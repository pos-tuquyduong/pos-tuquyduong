/**
 * GIAO-1 — quy tắc giao hàng Ahamove ở quầy (chủ quán chốt 18–21.10, 24.10, 29.10, 05.11). MỘT chỗ đổi trạng thái chuyến: mọi câu ghi trạng thái
 * có điều kiện trạng thái cũ trong WHERE; câu GIÀNH quyền (gọi xe, tự tìm lại, nhận đơn, in tem) kiểm `changes`; trong lúc gọi xe mọi câu ghi
 * kèm dấu giữ quyền `goi_luc = <lúc giành>` — máy thua dừng, chuyến vừa tạo thì huỷ. Route chỉ nhận yêu cầu (routes/giao-hang.js); đường tạo /
 * huỷ / xoá / hoàn đơn gọi các hàm ở đây.
 *
 * Trạng thái: moi (đơn App — KH-MUA-2) → dang_pha → dang_goi (đang hỏi Ahamove) → tim_xe → doi_tai_xe → dang_giao → xong | giao_loi;
 *   chuyen_huy = chuyến Ahamove đã huỷ (quán huỷ / tài xế huỷ lần hai) — đơn chưa huỷ, quầy gọi lại hoặc huỷ đơn; huy = đơn đã huỷ;
 *   da_dong = thẻ giao lỗi quản lý đã đóng (chỉ rời màn — huỷ đơn vẫn bị chặn như giao_loi).
 * Tiền: phí ship của đơn = phí trong pos_giao_bao_phi (máy chủ hỏi Ahamove) — không phải số màn hình gửi; phí thật lúc gọi xe ≠ phí khách trả →
 *   `chenh` (dương = quán bù) cho Đối soát; phí huỷ chuyến quán chịu khi chuyến huỷ theo lệnh của quán (chủ quán Q9 07.11) — ghi MỘT lần mỗi mã
 *   chuyến (ghiPhiHuy), tách khỏi câu đổi trạng thái thẻ.
 */
const crypto = require('crypto');
const { query, queryOne, run, beginTransaction } = require('../database');
const { getNow } = require('./helpers');
const aha = require('./ahamove');
const { ghiHangHong } = require('../routes/damages');

const LOAI_XE = ['HAN-BIKE', 'HAN-EXPRESS'];
const MAC_DINH = { km_toi_da: 10, gio_nhan: '', loai_xe: 'HAN-BIKE', phut_moi_mon: 2, phut_tim_xe: 6, phut_nhac: 15, diem_lay: null, sdt_quan: '' };
const BAO_PHI_HAN_PHUT = 30;
const GOI_TREO_GIAY = 180;           // "đang gọi" quá chừng này (máy gọi chết giữa chừng) → máy khác gọi lại được (có kiểm theo mã theo dõi). Một lần gọi
                                     // đi tối đa ~6 lời gọi Ahamove × 10 s (+ lấy lại token) — dài hơn thế; máy cũ về muộn thì thua dấu giữ quyền.
const TIM_XE_TOI_DA_GIAY = 600;      // tìm xe quá 10 phút → thẻ đỏ, cho "Tìm lại"
const DOC_LAI_GIAY = 60;             // dự phòng tin báo không tới: màn Giao hàng hỏi thì đọc lại chuyến quá 60 s chưa cập nhật
const DOC_LAI_TOI_DA = 3;            // mỗi lần hỏi đọc lại tối đa 3 chuyến
const LY_DO_TOI_THIEU = 3;
const SONG = ['dang_goi', 'tim_xe', 'doi_tai_xe', 'dang_giao'];   // còn chuyến (hoặc có thể còn) ở Ahamove
// Chuyến đã chạy = tài xế đã lấy hàng hoặc đã giao xong (theo DẤU GIỜ, không theo trạng thái — thẻ giao lỗi bị đóng khi hoàn tiền vẫn giữ phí):
// Ahamove tính phí chuyến; Đối soát chỉ cộng phí thật / chênh của các chuyến này.
const daChay = (x) => !!(x.lay_hang_luc || x.xong_luc);
const COT = { moi: 'moi', dang_pha: 'dang_pha', dang_goi: 'dang_pha', chuyen_huy: 'dang_pha', tim_xe: 'doi_tai_xe', doi_tai_xe: 'doi_tai_xe',
  dang_giao: 'dang_giao', giao_loi: 'dang_giao' };
const HANG = { tim_xe: 1, doi_tai_xe: 2, dang_giao: 3, xong: 4, giao_loi: 4 };

const loi = (status, code, error) => ({ loi: { status, body: { error, code } } });
const lechGiay = (luc, giay) => new Date(Date.parse(luc + 'Z') + giay * 1000).toISOString().slice(0, 19);   // giờ VN dạng T, cộng / trừ giây
const nguyen = (v, a, b) => /^\d{1,4}$/.test(String(v)) && Number(v) >= a && Number(v) <= b;
const laQuanLy = (u) => ['owner', 'manager'].includes(u?.role);
const lyDoHopLe = (x) => typeof x === 'string' && x.trim().length >= LY_DO_TOI_THIEU;

// ─── Cài đặt (khoá giao_* trong pos_settings) ───
const KIEM = {
  giao_km_toi_da: (v) => /^\d{1,2}(\.\d)?$/.test(String(v)) && Number(v) > 0 && Number(v) <= 50,
  giao_gio_nhan: (v) => v === '' || /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/.test(String(v)),
  giao_loai_xe: (v) => LOAI_XE.includes(String(v)),
  giao_phut_moi_mon: (v) => nguyen(v, 0, 30),
  giao_phut_tim_xe: (v) => nguyen(v, 0, 60),
  giao_phut_nhac: (v) => nguyen(v, 1, 120),
  giao_sdt_quan: (v) => v === '' || /^0\d{8,10}$/.test(String(v)),
};
/** Kiểm khoá giao_* của PUT /settings — sai một khoá → câu báo (không ghi khoá nào). Điểm lấy hàng chỉ đặt qua POST /giao-hang/diem-lay. */
function kiemCaiDat(settings) {
  const sai = Object.entries(settings).find(([k, v]) => k.startsWith('giao_') && !(KIEM[k] && KIEM[k](v)));
  return sai ? `Cài đặt giao hàng ${sai[0]} không hợp lệ` : null;
}
async function docCaiDat() {
  const s = Object.fromEntries((await query("SELECT key, value FROM pos_settings WHERE key LIKE 'giao_%'")).map((r) => [r.key.slice(5), r.value]));
  let diemLay = null;
  try { diemLay = s.diem_lay ? JSON.parse(s.diem_lay) : null; } catch { /* hỏng → coi như chưa cài */ }
  const n = (k) => (s[k] != null && s[k] !== '' ? Number(s[k]) : MAC_DINH[k]);
  return { km_toi_da: n('km_toi_da'), gio_nhan: s.gio_nhan ?? MAC_DINH.gio_nhan, loai_xe: LOAI_XE.includes(s.loai_xe) ? s.loai_xe : MAC_DINH.loai_xe,
    phut_moi_mon: n('phut_moi_mon'), phut_tim_xe: n('phut_tim_xe'), phut_nhac: n('phut_nhac'), diem_lay: diemLay, sdt_quan: s.sdt_quan || '' };
}
/** Giờ nhận đơn giao 'HH:MM-HH:MM' (qua nửa đêm được); rỗng = cả ngày. */
function trongGio(khung, luc) {
  if (!khung) return true;
  const p = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const [a, b] = khung.split('-').map(p), m = p(luc.slice(11, 16));
  return a <= b ? m >= a && m < b : m >= a || m < b;
}

// ─── Ô địa chỉ: MỘT hàm, hai cách (Q1 05.11) ───
/** Cách 1 (có AHAMOVE_DIA_CHI_URL + _KHOA): chỉ nhận mã gợi ý Ahamove → địa chỉ chuẩn + toạ độ. Cách 2: chữ — nhân viên xác nhận lại địa chỉ + km. */
async function phanGiaiDiaChi({ ma_goi_y: ma, dia_chi: chu }) {
  if (aha.coGoiY()) {
    if (typeof ma !== 'string' || !ma) return loi(400, 'DIA_CHI_PHAI_CHON_GOI_Y', 'Chọn một địa chỉ trong danh sách gợi ý của Ahamove');
    const d = await aha.chiTietDiaChi(ma);
    return d ? { ...d, can_xac_nhan: false } : loi(400, 'GOI_Y_KHONG_CO', 'Không tìm thấy địa chỉ gợi ý này — gõ lại để chọn');
  }
  const t = typeof chu === 'string' ? chu.trim().replace(/\s+/g, ' ') : '';
  if (t.length < 5 || t.length > 200) return loi(400, 'DIA_CHI_TRONG', 'Nhập địa chỉ giao (số nhà, đường, phường / quận)');
  return { dia_chi: t, lat: null, lng: null, can_xac_nhan: true };
}
const loiAhamove = (e) => (e.code === 'AHAMOVE_CHUA_CAI' ? loi(503, 'AHAMOVE_CHUA_CAI', 'Chưa cài Ahamove — báo chủ quán')
  : loi(502, 'AHAMOVE_LOI', e.code === 'AHAMOVE_MAT_MANG' ? 'Không kết nối được Ahamove — thử lại' : 'Ahamove từ chối — kiểm tra địa chỉ rồi thử lại'));

async function goiY(q) {
  if (!aha.coGoiY()) return { cach: 'xac_nhan', goi_y: [] };
  const chu = String(q || '').trim();
  try {
    return { cach: 'goi_y', goi_y: chu.length >= 2 ? (await aha.goiYDiaChi(chu)).slice(0, 10) : [] };
  } catch (e) { return loiAhamove(e); }
}
async function datDiemLay(b) {
  try {
    const d = await phanGiaiDiaChi(b || {});
    if (d.loi) return d;
    await run(`INSERT INTO pos_settings (key, value, updated_at) VALUES ('giao_diem_lay', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value,
      updated_at = excluded.updated_at`, [JSON.stringify({ dia_chi: d.dia_chi, lat: d.lat, lng: d.lng }), getNow()]);
    return { diem_lay: { dia_chi: d.dia_chi, lat: d.lat, lng: d.lng } };
  } catch (e) { return loiAhamove(e); }
}

/** "Tính phí": giờ nhận đơn → địa chỉ → Ahamove báo phí → quá km thì chặn → lưu báo phí (đơn dùng mã này). */
async function taoBaoPhi(b, nguoi) {
  if (!aha.daCai()) return loiAhamove({ code: 'AHAMOVE_CHUA_CAI' });
  const cd = await docCaiDat(), now = getNow();
  if (!trongGio(cd.gio_nhan, now)) return loi(400, 'NGOAI_GIO_GIAO', `Ngoài giờ nhận đơn giao (${cd.gio_nhan})`);
  if (!cd.diem_lay) return loi(409, 'CHUA_CAI_DIEM_LAY', 'Chưa cài điểm lấy hàng của quán — Cài đặt → Giao hàng');
  const loaiXe = LOAI_XE.includes(b?.loai_xe) ? b.loai_xe : cd.loai_xe;
  try {
    const d = await phanGiaiDiaChi(b || {});
    if (d.loi) return d;
    const bp = await aha.baoPhi({ lay: { ...cd.diem_lay, sdt: cd.sdt_quan }, giao: d, loaiXe });
    if (bp.km > cd.km_toi_da) return loi(400, 'QUA_KHOANG_CACH', `Quá xa: ${bp.km} km (quán giao tối đa ${cd.km_toi_da} km)`);
    const ma = crypto.randomBytes(16).toString('hex'), hetHan = lechGiay(now, BAO_PHI_HAN_PHUT * 60);
    await run(`INSERT INTO pos_giao_bao_phi (ma, dia_chi, lat, lng, km, loai_xe, phi, het_han, nguoi_tao, tao_luc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ma, d.dia_chi, d.lat ?? bp.lat, d.lng ?? bp.lng, bp.km, loaiXe, bp.phi, hetHan, nguoi, now]);
    return { ma_bao_phi: ma, phi: bp.phi, km: bp.km, dia_chi: d.dia_chi, dia_chi_ahamove: bp.dia_chi, het_han: hetHan, can_xac_nhan: d.can_xac_nhan, loai_xe: loaiXe };
  } catch (e) { return loiAhamove(e); }
}

// ─── Nối đường tạo đơn (orders.js taoDon) ───
/** Đọc báo phí cho đơn giao. boQuaHan: chốt phiên (tiền khách đã về — không từ chối vì hết hạn). kiemNguoiNhan: mọi đường trừ "tính thử". */
async function docBaoPhiDon(giao, { boQuaHan, kiemNguoiNhan }) {
  const bp = typeof giao?.ma_bao_phi === 'string' ? await queryOne('SELECT * FROM pos_giao_bao_phi WHERE ma = ?', [giao.ma_bao_phi]) : null;
  if (!bp) return { loi: { error: 'Chưa tính phí giao (hoặc mã báo phí sai) — bấm Tính phí', code: 'BAO_PHI_KHONG_HOP_LE' } };
  if (bp.order_id != null) return { loi: { error: 'Báo phí này đã dùng cho đơn khác — tính phí lại', code: 'BAO_PHI_DA_DUNG' } };
  if (!boQuaHan && bp.het_han <= getNow()) return { loi: { error: 'Báo phí đã quá 30 phút — tính phí lại', code: 'BAO_PHI_HET_HAN' } };
  if (kiemNguoiNhan && !(String(giao.ten || '').trim() && /^0\d{8,10}$/.test(String(giao.sdt || '').trim()))) {
    return { loi: { error: 'Đơn giao cần tên và SĐT người nhận', code: 'GIAO_THIEU_NGUOI_NHAN' } };
  }
  return bp;
}
/** Trong giao dịch tạo đơn: giành báo phí (một báo phí — một đơn) + ghi chuyến "Đang pha". false = báo phí vừa bị đơn khác dùng. */
async function ghiChuyenDon(tx, { orderId, giao, bp, now }) {
  const g = await tx.run('UPDATE pos_giao_bao_phi SET order_id = ? WHERE ma = ? AND order_id IS NULL', [orderId, bp.ma]);
  if (g.changes !== 1) return false;
  await tx.run(`INSERT INTO pos_giao_chuyen (order_id, ma_bao_phi, ten_nhan, sdt_nhan, dia_chi, lat, lng, km, ghi_chu, loai_xe, trang_thai, nhan_luc, phi_khach, tao_luc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'dang_pha', ?, ?, ?)`, [orderId, bp.ma, String(giao.ten).trim().slice(0, 100), String(giao.sdt).trim(), bp.dia_chi,
    bp.lat, bp.lng, bp.km, String(giao.ghi_chu || '').trim().slice(0, 300) || null, bp.loai_xe, now, bp.phi, now]);
  return true;
}

// ─── Nối đường huỷ / xoá / hoàn đơn ───
/** Đầu PUT /orders/:id/cancel (trong giao dịch). null = đơn không giao (đường cũ y nguyên). { loi } = chặn. { c, doDaPha } = cho huỷ. */
async function kiemHuyDonGiao(tx, order, user, body) {
  const c = await tx.queryOne('SELECT * FROM pos_giao_chuyen WHERE order_id = ?', [order.id]);
  if (!c) return null;
  if (!laQuanLy(user)) return { loi: { status: 403, body: { error: 'Huỷ đơn giao cần quản lý hoặc chủ quán', code: 'PERMISSION_DENIED' } } };
  if (!lyDoHopLe(body?.reason)) return { loi: { status: 400, body: { error: 'Nhập lý do huỷ (ít nhất 3 ký tự)', code: 'LY_DO_BAT_BUOC' } } };
  if (['dang_goi', 'tim_xe', 'doi_tai_xe'].includes(c.trang_thai)) {
    return { loi: { status: 409, body: { error: 'Đơn đang có chuyến Ahamove — bấm "Huỷ chuyến" trước rồi mới huỷ đơn', code: 'HUY_CHUYEN_TRUOC' } } };
  }
  if (['dang_giao', 'xong', 'giao_loi', 'da_dong'].includes(c.trang_thai)) {
    return { loi: { status: 409, body: { error: 'Tài xế đã lấy hàng — không huỷ trên máy, dùng "Báo sự cố"', code: 'DANG_GIAO_KHONG_HUY' } } };
  }
  // Phiếu J: tới khi HUY-1 gộp chỉ huỷ đơn giao chưa thu / thu bằng tài khoản (đường huỷ cũ chỉ hoàn phần ví). HUY-1 xoá đúng dòng này.
  if (Number(order.cash_amount) > 0 || Number(order.transfer_amount) > 0) {
    return { loi: { status: 409, body: { error: 'Đơn giao trả tiền mặt / chuyển khoản chưa huỷ được trên máy (chờ việc HUY-1) — báo chủ quán', code: 'CHO_HUY_1' } } };
  }
  const daPha = ['dang_pha', 'chuyen_huy'].includes(c.trang_thai);
  if (daPha && !['dung_lai', 'bo_di'].includes(body?.do_da_pha)) {
    return { loi: { status: 400, body: { error: 'Chọn đồ đã pha: "Dùng cho đơn khác" hoặc "Bỏ đi"', code: 'CHON_DO_DA_PHA' } } };
  }
  return { c, doDaPha: daPha ? body.do_da_pha : null };
}
/** Sau khi đơn đã chuyển 'cancelled' (cùng giao dịch): chuyến → huy; "Bỏ đi" → ghi hàng hỏng ĐÚNG món + số lượng (hàm chung damages.js). */
async function chotHuyGiao(tx, { c, doDaPha }, order, user, now) {
  await tx.run('UPDATE pos_giao_chuyen SET trang_thai = ?, huy_luc = ?, ly_do_huy = ?, do_da_pha = ? WHERE id = ? AND trang_thai = ?',
    ['huy', now, String(order.cancelled_reason || '').slice(0, 300), doDaPha, c.id, c.trang_thai]);
  if (doDaPha !== 'bo_di') return;
  const mon = await tx.query(`SELECT product_code, MIN(product_name) AS ten, SUM(quantity) AS sl, MAX(unit_price) AS gia FROM pos_order_items
    WHERE order_id = ? AND product_id > 0 GROUP BY product_code`, [order.id]);
  for (const m of mon) {
    await ghiHangHong(tx, { order, product_code: m.product_code, ten: m.ten, soLuong: Number(m.sl), gia: Number(m.gia), reason: 'other',
      reason_note: `Huỷ đơn giao ${order.code} — đồ đã pha bỏ đi`, action: 'none', refund: 0, user });
  }
}
/** DELETE /orders/:id: còn chuyến ở Ahamove → chặn; được xoá → xoá chuyến, nhả báo phí. Trả { loi } hoặc null. */
async function xoaDonGiao(tx, orderId) {
  const c = await tx.queryOne('SELECT trang_thai, ma_ahamove FROM pos_giao_chuyen WHERE order_id = ?', [orderId]);
  if (c && SONG.includes(c.trang_thai)) return { loi: { error: 'Đơn đang có chuyến Ahamove — huỷ chuyến trước', code: 'HUY_CHUYEN_TRUOC' } };
  // Đã từng gọi xe → dòng chuyến mang phí Ahamove / phí huỷ quán đã trả (sổ Đối soát) — không xoá; dùng Huỷ đơn.
  if (c?.ma_ahamove) return { loi: { error: 'Đơn giao đã gọi xe Ahamove — không xoá được (giữ sổ phí giao), dùng Huỷ đơn', code: 'DON_GIAO_DA_GOI_XE' } };
  await tx.run('DELETE FROM pos_giao_chuyen WHERE order_id = ?', [orderId]);
  await tx.run('UPDATE pos_giao_bao_phi SET order_id = NULL WHERE order_id = ?', [orderId]);
  return null;
}
/** Q5 (05.11): đơn giao còn chuyến ở Ahamove không xin / duyệt hoàn tiền. */
const donGiaoDangChay = async (tx, orderId) => SONG.includes((await tx.queryOne('SELECT trang_thai FROM pos_giao_chuyen WHERE order_id = ?', [orderId]))?.trang_thai);
/** Duyệt hoàn tiền (refunds.js, cùng giao dịch, sau cổng đơn): chuyến không còn sống ở Ahamove (chưa gọi xe, đã huỷ chuyến, giao lỗi) → đóng (huy)
 *  để thẻ rời màn Giao hàng. giao_loi rời màn qua đây hoặc "Đóng thẻ" (dongThe). */
const dongChuyenKhiHoan = (tx, orderId, now) => tx.run(`UPDATE pos_giao_chuyen SET trang_thai = 'huy', huy_luc = ?, ly_do_huy = 'Đã duyệt hoàn tiền'
  WHERE order_id = ? AND trang_thai IN ('moi', 'dang_pha', 'chuyen_huy', 'giao_loi')`, [now, orderId]);

// ─── Phí huỷ chuyến (J, K — chủ quán Q8 + Q9 07.11) ───
/** Chuyến `d` đã huỷ theo lệnh của quán → cộng phí huỷ ĐÚNG MỘT lần cho mã chuyến (dấu 'PHI_HUY' trong pos_giao_tin), tách khỏi câu đổi trạng thái thẻ. */
async function ghiPhiHuy(chuyenId, d) {
  const tx = await beginTransaction();
  try {
    const g = await tx.run("INSERT OR IGNORE INTO pos_giao_tin (ma_ahamove, trang_thai, phu, luc) VALUES (?, 'PHI_HUY', '', ?)", [d.ma, getNow()]);
    if (g.changes === 1 && d.phi_huy) await tx.run('UPDATE pos_giao_chuyen SET phi_huy = phi_huy + ? WHERE id = ?', [Math.round(d.phi_huy), chuyenId]);
    await tx.commit();
  } catch (e) { await tx.rollback(); throw e; }
}
/** Lệnh huỷ của quán vừa thành công: đọc được chuyến đã huỷ → ghi phí ngay; không đọc được → "phí huỷ chưa rõ" (CHO_PHI_HUY), màn hỏi thì đọc lại. */
const ghiPhiHuyLenh = (chuyenId, ma, d) => (d?.trang_thai === 'CANCELLED' ? ghiPhiHuy(chuyenId, d)
  : run("INSERT OR IGNORE INTO pos_giao_tin (ma_ahamove, trang_thai, phu, luc) VALUES (?, 'CHO_PHI_HUY', ?, ?)", [ma, String(chuyenId), getNow()]));
const CHO_PHI_HUY = `SELECT t.id, t.ma_ahamove, t.phu FROM pos_giao_tin t WHERE trang_thai = 'CHO_PHI_HUY'
  AND NOT EXISTS (SELECT 1 FROM pos_giao_tin p WHERE p.ma_ahamove = t.ma_ahamove AND p.trang_thai = 'PHI_HUY')`;
/** Đọc lại chuyến chờ lâu nhất trước; chưa ra (chưa huỷ / Ahamove không trả) thì xếp xuống cuối — chuyến đọc mãi không ra không chặn chuyến sau. */
async function docLaiPhiHuy() {
  for (const t of await query(CHO_PHI_HUY + ` ORDER BY t.luc, t.id DESC LIMIT ${DOC_LAI_TOI_DA}`)) {
    const d = await aha.docChuyen(t.ma_ahamove).catch(() => null);
    if (d?.trang_thai === 'CANCELLED') await ghiPhiHuy(Number(t.phu), d);
    else await run('UPDATE pos_giao_tin SET luc = ? WHERE id = ?', [getNow(), t.id]);
  }
}

// ─── Gọi xe (G) ───
const docChuyenDon = (orderId) => queryOne('SELECT * FROM pos_giao_chuyen WHERE order_id = ?', [orderId]);
const diemGiao = (c) => ({ dia_chi: c.dia_chi, lat: c.lat, lng: c.lng, ten: c.ten_nhan, sdt: c.sdt_nhan, ghi_chu: c.ghi_chu });

/** Bấm "Gọi tài xế" / "Tìm lại" / "Gọi lại". Giành quyền bằng MỘT câu ghi → hai máy cùng bấm chỉ một máy gọi Ahamove.
 *  `tu` = trạng thái thẻ màn đang thấy: thẻ đã đổi (vd quản lý vừa Huỷ chuyến mà màn khác còn nút "Tìm lại") → 409, không gọi gì. */
async function goiXe(orderId, loaiXe, tu) {
  const c = await docChuyenDon(orderId);
  if (!c) return loi(404, 'KHONG_PHAI_DON_GIAO', 'Không phải đơn giao');
  if (tu != null && tu !== c.trang_thai) return loi(409, 'TRANG_THAI_DA_DOI', 'Thẻ vừa đổi trạng thái — xem lại thẻ rồi bấm lại');
  const o = await queryOne('SELECT code, status, payment_status FROM pos_orders WHERE id = ?', [orderId]);
  if (o?.status !== 'completed') return loi(409, 'DON_KHONG_CON', 'Đơn đã huỷ / đã hoàn — không gọi xe');
  if (o.payment_status !== 'paid') return loi(409, 'CHUA_THU_DU', 'Đơn chưa thu đủ tiền — thu đủ rồi mới gọi xe');
  if (loaiXe != null && !LOAI_XE.includes(loaiXe)) return loi(400, 'LOAI_XE_SAI', 'Loại xe không hợp lệ');
  const now = getNow();
  // Câu giành kiểm lại đơn (hoàn / huỷ chen giữa lúc đọc ở trên và đây thì thua); goi_luc = now là dấu giữ quyền cho mọi câu ghi sau.
  const g = await run(`UPDATE pos_giao_chuyen SET trang_thai = 'dang_goi', goi_luc = ?, loi_mang = 0, loi = NULL, loai_xe = COALESCE(?, loai_xe)
    WHERE id = ? AND (trang_thai IN ('dang_pha', 'chuyen_huy') OR (trang_thai = 'dang_goi' AND (loi_mang = 1 OR goi_luc < ?))
      OR (trang_thai = 'tim_xe' AND goi_luc < ?))
      AND EXISTS (SELECT 1 FROM pos_orders WHERE id = pos_giao_chuyen.order_id AND status = 'completed' AND payment_status = 'paid')`,
  [now, loaiXe ?? null, c.id, lechGiay(now, -GOI_TREO_GIAY), lechGiay(now, -TIM_XE_TOI_DA_GIAY)]);
  if (g.changes !== 1) return loi(409, 'DANG_GOI_XE', 'Chuyến đang được gọi hoặc đã có xe — xem trạng thái trên thẻ');
  // Thẻ còn mã chuyến cũ (Tìm lại, hoặc Gọi lại thẻ treo — có thể chết giữa chừng): không bao giờ để hai chuyến cùng chạy.
  // Chỉ "Tìm lại" (tim_xe) gửi lệnh huỷ; lệnh huỷ đó thành công → phí huỷ (ghiPhiHuyLenh). Còn lại ĐỌC chuyến cũ: còn chạy / đã xong → NHẬN LẠI
  // (thẻ theo chuyến cũ, không gọi chuyến mới); đã huỷ theo lệnh quán → phí huỷ (một lần mỗi mã chuyến); "Tìm lại" mà chuyến vừa bị huỷ bởi việc
  // khác (quản lý Huỷ chuyến, tài xế, lệnh huỷ mất mạng) → KHÔNG gọi chuyến mới, thẻ theo tin huỷ; Gọi lại thẻ treo mà chuyến đã huỷ → gọi chuyến mới.
  if (['tim_xe', 'dang_goi'].includes(c.trang_thai) && c.ma_ahamove) {
    let daHuy = false;
    if (c.trang_thai === 'tim_xe') {
      try { await aha.huyChuyen(c.ma_ahamove, 'Quán tìm lại xe'); daHuy = true; } catch { /* không huỷ được: đọc chuyến cũ bên dưới */ }
    }
    const cu = await aha.docChuyen(c.ma_ahamove).catch(() => undefined);
    if (daHuy) await ghiPhiHuyLenh(c.id, c.ma_ahamove, cu);
    else if (cu === undefined) {   // không đọc được chuyến cũ: trả thẻ về như cũ, GIỮ goi_luc + loi_mang cũ (nút Tìm lại / Gọi lại còn, bấm lại được ngay)
      await run("UPDATE pos_giao_chuyen SET trang_thai = ?, goi_luc = ?, loi_mang = ?, loi = ? WHERE id = ? AND trang_thai = 'dang_goi' AND goi_luc = ?",
        [c.trang_thai, c.goi_luc, c.loi_mang, 'Không đọc được chuyến cũ ở Ahamove — bấm lại sau', c.id, now]);
      return loi(502, 'AHAMOVE_LOI', 'Không đọc được chuyến cũ ở Ahamove — thử lại');
    } else if (cu?.trang_thai === 'CANCELLED') {
      if (cu.nguoi_huy_la_quan) await ghiPhiHuy(c.id, cu);
      if (c.trang_thai === 'tim_xe') {
        const v = await run("UPDATE pos_giao_chuyen SET trang_thai = 'tim_xe', goi_luc = ? WHERE id = ? AND trang_thai = 'dang_goi' AND goi_luc = ?", [c.goi_luc, c.id, now]);
        if (v.changes === 1) {
          await capNhatTuAhamove(await docChuyenDon(c.order_id), cu);
          const sau = await docChuyenDon(c.order_id);   // tài xế huỷ lần đầu → máy vừa tự tìm lại một chuyến
          if (sau?.trang_thai === 'tim_xe' && sau.ma_ahamove !== c.ma_ahamove) return { ok: true, ma_ahamove: sau.ma_ahamove, tu_tim_lai: true };
        }
        return loi(409, 'CHUYEN_DA_HUY', 'Chuyến vừa bị huỷ ở Ahamove — xem lại thẻ rồi bấm Gọi lại');
      }
    } else if (cu) {
      return nhanLaiChuyenCu(c, cu, now);
    }
  }
  return taoChuyenMoi({ ...c, loai_xe: loaiXe || c.loai_xe }, o, c.trang_thai, now);
}

/** Chuyến cũ vẫn chạy ở Ahamove → thẻ theo nó: về 'tim_xe' (giữ quyền) rồi áp trạng thái đọc được (tài xế, đang giao, xong). */
async function nhanLaiChuyenCu(c, cu, khoa) {
  const n = await run(`UPDATE pos_giao_chuyen SET trang_thai = 'tim_xe', loi = NULL, loi_mang = 0, doc_luc = ? WHERE id = ? AND trang_thai = 'dang_goi'
    AND goi_luc = ? AND ma_ahamove = ?`, [getNow(), c.id, khoa, cu.ma]);
  if (n.changes !== 1) return loi(409, 'DANG_GOI_XE', 'Máy khác đã gọi lại chuyến này — xem trạng thái trên thẻ');
  await capNhatTuAhamove({ ...(await docChuyenDon(c.order_id)) }, cu);
  return { ok: true, ma_ahamove: cu.ma, nhan_lai: true };
}

/** Chuyến đang 'dang_goi' (đã giành lúc `khoa` = goi_luc): kiểm theo mã theo dõi (lần trước có thể đã tạo) → báo phí lại → tạo chuyến.
 *  Mọi câu ghi kèm `goi_luc = khoa`: máy về muộn (máy khác đã giành lại sau GOI_TREO_GIAY) thua — chuyến nó vừa tạo bị huỷ ngay. */
async function taoChuyenMoi(c, o, cu, khoa) {
  const ve = cu === 'dang_pha' || cu === 'dang_goi' ? 'dang_pha' : 'chuyen_huy';
  const giu = "id = ? AND trang_thai = 'dang_goi' AND goi_luc = ?";
  const thua = loi(409, 'DANG_GOI_XE', 'Máy khác đã gọi lại chuyến này — xem trạng thái trên thẻ');
  try {
    let tn = c.ma_theo_doi;
    if (tn) {
      const co = await aha.traTheoMa(tn);
      if (co && co.ma !== c.ma_ahamove && co.trang_thai !== 'CANCELLED') {   // lần trước đã tạo: còn chạy / đã giao xong → nhận lại, không gọi mới
        const n = await run(`UPDATE pos_giao_chuyen SET ma_ahamove = ?, trang_thai = 'tim_xe', phi_that = COALESCE(?, phi_that), chenh = COALESCE(?, phi_that) - phi_khach,
          loi = NULL, loi_mang = 0, doc_luc = ? WHERE ${giu}`, [co.ma, co.phi, co.phi, getNow(), c.id, khoa]);
        if (n.changes !== 1) return thua;
        await capNhatTuAhamove(await docChuyenDon(c.order_id), co);   // áp trạng thái đọc được (tài xế, đang giao, xong)
        return { ok: true, ma_ahamove: co.ma, nhan_lai: true };
      }
      if (co) tn = null;
    }
    if (!tn) {
      const lan = Number(c.lan_tim) + 1;
      tn = o.code + (lan > 1 ? '-' + lan : '');
      if ((await run(`UPDATE pos_giao_chuyen SET lan_tim = ?, ma_theo_doi = ? WHERE ${giu}`, [lan, tn, c.id, khoa])).changes !== 1) return thua;
    }
    const cd = await docCaiDat();
    const lay = { ...cd.diem_lay, sdt: cd.sdt_quan, ten: (await queryOne("SELECT value FROM pos_settings WHERE key = 'store_name'"))?.value || 'Quán' };
    const giao = { ...diemGiao(c), ma_theo_doi: tn };
    const bp = await aha.baoPhi({ lay, giao, loaiXe: c.loai_xe });
    const t = await aha.taoChuyen({ lay, giao, loaiXe: c.loai_xe });
    const phi = t.phi ?? bp.phi;
    const n = await run(`UPDATE pos_giao_chuyen SET ma_ahamove = ?, trang_thai = 'tim_xe', phi_that = ?, chenh = ? - phi_khach, loi = NULL, loi_mang = 0, doc_luc = ?,
      tai_xe_ten = NULL, tai_xe_sdt = NULL, tai_xe_bien_so = NULL WHERE ${giu}`, [t.ma, phi, phi, getNow(), c.id, khoa]);
    if (n.changes !== 1) {   // thua giành: chuyến vừa tạo không ai giữ → huỷ ngay (trừ khi máy thắng đã nhận chính chuyến này qua mã theo dõi);
      if ((await docChuyenDon(c.order_id))?.ma_ahamove !== t.ma) {   // lệnh huỷ của quán thành công → phí huỷ (Q9)
        const huy = await aha.huyChuyen(t.ma, 'Trùng chuyến — quán đã gọi chuyến khác').then(() => true, (e) => console.error('GIAO-1: không huỷ được chuyến trùng', t.ma, e.code));
        if (huy) await ghiPhiHuyLenh(c.id, t.ma, await aha.docChuyen(t.ma).catch(() => undefined));
      }
      return thua;
    }
    return { ok: true, ma_ahamove: t.ma };
  } catch (e) {
    if (e.code === 'AHAMOVE_MAT_MANG') {
      await run(`UPDATE pos_giao_chuyen SET loi_mang = 1, loi = ? WHERE ${giu}`,
        ['Mất kết nối Ahamove — chưa rõ đã gọi xe chưa. Bấm "Gọi lại" để máy kiểm rồi mới gọi', c.id, khoa]);
      return loi(504, 'AHAMOVE_MAT_MANG', 'Mất kết nối Ahamove — chưa rõ đã gọi xe chưa. Bấm "Gọi lại" để kiểm');
    }
    await run(`UPDATE pos_giao_chuyen SET trang_thai = ?, loi = ? WHERE ${giu}`,
      [ve, e.code === 'AHAMOVE_CHUA_CAI' ? 'Chưa cài Ahamove' : 'Ahamove từ chối gọi xe — thử lại', c.id, khoa]);
    return loiAhamove(e);
  }
}

/** J bước "Đợi tài xế": quản lý / chủ quán + lý do → huỷ chuyến ở Ahamove (phí huỷ quán chịu) → chuyen_huy; quầy huỷ đơn tiếp. */
async function huyChuyenGiao(orderId, lyDo, user) {
  if (!laQuanLy(user)) return loi(403, 'PERMISSION_DENIED', 'Huỷ chuyến cần quản lý hoặc chủ quán');
  if (!lyDoHopLe(lyDo)) return loi(400, 'LY_DO_BAT_BUOC', 'Nhập lý do huỷ (ít nhất 3 ký tự)');
  const c = await docChuyenDon(orderId);
  if (c && ['dang_giao', 'xong', 'giao_loi'].includes(c.trang_thai)) return loi(409, 'DANG_GIAO_KHONG_HUY', 'Tài xế đã lấy hàng — dùng "Báo sự cố"');
  if (!c || !['tim_xe', 'doi_tai_xe'].includes(c.trang_thai) || !c.ma_ahamove) return loi(409, 'KHONG_CO_CHUYEN', 'Đơn không có chuyến Ahamove đang chạy');
  try { await aha.huyChuyen(c.ma_ahamove, lyDo.trim()); } catch (e) {
    return e.code === 'AHAMOVE_TU_CHOI' ? loi(409, 'AHAMOVE_KHONG_HUY', 'Ahamove không cho huỷ — có thể tài xế đã lấy hàng') : loiAhamove(e);
  }
  // Lệnh huỷ đã thành công: phí huỷ ghi NGAY, tách khỏi câu đổi trạng thái (thẻ vừa đổi vẫn không mất phí; không đọc được → chờ đọc lại).
  await ghiPhiHuyLenh(c.id, c.ma_ahamove, await aha.docChuyen(c.ma_ahamove).catch(() => undefined));
  const n = await run(`UPDATE pos_giao_chuyen SET trang_thai = 'chuyen_huy', loi = ? WHERE id = ? AND ma_ahamove = ? AND trang_thai IN ('tim_xe', 'doi_tai_xe')`,
    ['Quán đã huỷ chuyến: ' + lyDo.trim().slice(0, 200), c.id, c.ma_ahamove]);
  if (n.changes === 1) return { ok: true };
  // Thẻ vừa đổi: tin huỷ / máy khác đã đưa thẻ về chuyen_huy theo chính chuyến này → huỷ xong; đổi khác → báo quầy xem lại thẻ.
  const sau = await docChuyenDon(orderId);
  return sau?.trang_thai === 'chuyen_huy' && sau.ma_ahamove === c.ma_ahamove ? { ok: true }
    : loi(409, 'TRANG_THAI_DA_DOI', 'Chuyến cũ đã huỷ nhưng thẻ vừa đổi trạng thái — xem lại thẻ trước khi huỷ đơn');
}

// ─── Ahamove báo về (H) / đọc lại dự phòng ───
const trangThaiQuan = (d) => ({ IDLE: 'tim_xe', ASSIGNING: 'tim_xe', ACCEPTED: 'doi_tai_xe', CONFIRMING: 'doi_tai_xe', PAYING: 'doi_tai_xe', 'IN PROCESS': 'dang_giao',
  COMPLETED: d.diem_giao === 'FAILED' ? 'giao_loi' : 'xong' })[d.trang_thai] || null;

/** Áp trạng thái ĐỌC LẠI từ Ahamove lên chuyến. Một chiều (tin trễ / lùi bị bỏ), trừ ACCEPTED → ASSIGNING (Ahamove tìm tài xế khác). */
async function capNhatTuAhamove(c, d) {
  if (!d || d.ma !== c.ma_ahamove || !['tim_xe', 'doi_tai_xe', 'dang_giao'].includes(c.trang_thai)) return;
  const now = getNow();
  if (d.trang_thai === 'CANCELLED') {
    if (d.nguoi_huy_la_quan) await ghiPhiHuy(c.id, d);   // Q9: huỷ theo lệnh của quán (kể cả lệnh mất mạng, huỷ trên app Ahamove) — một lần mỗi mã
    if (c.trang_thai === 'dang_giao') {   // huỷ khi tài xế ĐÃ lấy hàng: hàng đang ngoài đường — KHÔNG tự gọi xe mới, báo quầy
      await run(`UPDATE pos_giao_chuyen SET trang_thai = 'giao_loi', loi = ? WHERE id = ? AND trang_thai = 'dang_giao' AND ma_ahamove = ?`,
        ['Ahamove huỷ chuyến khi tài xế đã lấy hàng — gọi tài xế / Ahamove', c.id, c.ma_ahamove]);
      return;
    }
    if (!d.nguoi_huy_la_quan && !c.tu_tim_lai) {   // tài xế / Ahamove huỷ lần đầu (chưa lấy hàng) → tự tìm lại MỘT lần
      const g = await run(`UPDATE pos_giao_chuyen SET trang_thai = 'dang_goi', tu_tim_lai = 1, goi_luc = ? WHERE id = ? AND trang_thai = ?
        AND ma_ahamove = ? AND tu_tim_lai = 0`, [now, c.id, c.trang_thai, c.ma_ahamove]);
      if (g.changes !== 1) return;
      const o = await queryOne('SELECT code FROM pos_orders WHERE id = ?', [c.order_id]);
      const kq = await taoChuyenMoi({ ...c, tu_tim_lai: 1 }, o, 'chuyen_huy', now);
      if (kq.ok) await run('UPDATE pos_giao_chuyen SET loi = ? WHERE id = ? AND ma_ahamove = ?', ['Tài xế huỷ chuyến — máy đã tự tìm xe lại', c.id, kq.ma_ahamove]);
      return;
    }
    await run(`UPDATE pos_giao_chuyen SET trang_thai = 'chuyen_huy', loi = ? WHERE id = ? AND trang_thai = ? AND ma_ahamove = ?`,
      ['Tài xế / Ahamove huỷ chuyến — gọi lại hoặc huỷ đơn', c.id, c.trang_thai, c.ma_ahamove]);
    return;
  }
  const moi = trangThaiQuan(d);
  const tx = d.tai_xe;
  // Một chiều, trừ: Ahamove tìm tài xế khác (doi_tai_xe → tim_xe) và đổi thẳng tài xế (doi_tai_xe → doi_tai_xe, SĐT tài xế khác).
  const doiTaiXe = moi === 'doi_tai_xe' && c.trang_thai === 'doi_tai_xe' && !!tx.sdt && tx.sdt !== c.tai_xe_sdt;
  if (!moi || !(HANG[moi] > HANG[c.trang_thai] || (c.trang_thai === 'doi_tai_xe' && moi === 'tim_xe') || doiTaiXe)) return;
  const veTim = moi === 'tim_xe' ? 1 : 0;   // Ahamove tìm tài xế khác: bỏ tài xế cũ khỏi thẻ
  await run(`UPDATE pos_giao_chuyen SET trang_thai = ?, tai_xe_ten = CASE WHEN ? THEN NULL ELSE COALESCE(?, tai_xe_ten) END,
    tai_xe_sdt = CASE WHEN ? THEN NULL ELSE COALESCE(?, tai_xe_sdt) END, tai_xe_bien_so = CASE WHEN ? THEN NULL WHEN ? THEN ? ELSE COALESCE(?, tai_xe_bien_so) END, co_xe_luc = CASE WHEN ? = 'doi_tai_xe' THEN COALESCE(co_xe_luc, ?) ELSE co_xe_luc END,
    lay_hang_luc = CASE WHEN ? = 'dang_giao' THEN ? ELSE lay_hang_luc END, xong_luc = CASE WHEN ? IN ('xong', 'giao_loi') THEN ? ELSE xong_luc END,
    phi_that = COALESCE(?, phi_that), chenh = COALESCE(?, phi_that) - phi_khach, doc_luc = ?, loi = CASE WHEN ? = 'giao_loi' THEN 'Giao không thành công' ELSE loi END
    WHERE id = ? AND trang_thai = ? AND ma_ahamove = ?`,
  [moi, veTim, tx.ten, veTim, tx.sdt, veTim, doiTaiXe ? 1 : 0, tx.bien_so, tx.bien_so, moi, now, moi, now, moi, now, d.phi, d.phi, now, moi, c.id, c.trang_thai, c.ma_ahamove]);
}

/** Tin báo về: chỉ lấy mã chuyến; trạng thái đọc lại bằng token của quán. Lặp (mã + trạng thái đọc lại + điểm giao + SĐT tài xế — Ahamove đổi
 *  tài xế thì ACCEPTED lần hai là tin MỚI) → không làm gì. */
async function nhanTinBao(b) {
  const ma = String(b?._id || b?.order_id || '').replace(/-\d+$/, '');
  const c = ma ? await queryOne('SELECT * FROM pos_giao_chuyen WHERE ma_ahamove = ?', [ma]) : null;
  if (!c) return { status: 200, body: { success: true } };   // không phải chuyến của quán (hoặc chuyến cũ đã thay) — bỏ qua
  // Thẻ đang gọi xe: chưa áp được — KHÔNG ghi sổ chống lặp, trả 409 (Ahamove có gửi lại tin hay không: CHƯA đối chiếu). Tin sau cùng chuyến được áp;
  // không có tin sau thì màn Giao hàng đọc lại chuyến quá DOC_LAI_GIAY (danhSach) — trạng thái không mất.
  if (c.trang_thai === 'dang_goi') return loi(409, 'DANG_GOI_XE', 'Thẻ đang gọi xe — chưa áp tin').loi;
  let d;
  try { d = await aha.docChuyen(ma); } catch { return loi(502, 'AHAMOVE_LOI', 'Không đọc lại được chuyến — màn Giao hàng đọc lại sau').loi; }
  if (!d) return { status: 200, body: { success: true } };
  const moi = await run('INSERT OR IGNORE INTO pos_giao_tin (ma_ahamove, trang_thai, phu, luc) VALUES (?, ?, ?, ?)', [ma, d.trang_thai, `${d.diem_giao}|${d.tai_xe.sdt || ''}`, getNow()]);
  if (moi.changes === 1) await capNhatTuAhamove(c, d);
  return { status: 200, body: { success: true } };
}

// ─── Màn Giao hàng (E, F, I) ───
/** Giờ gợi ý gọi tài xế = giờ nhận + (món của nó + món các đơn đang pha trước nó) × phút/món − phút tìm xe; không sớm hơn giờ nhận. */
function gioGoiTaiXe(nhanLuc, soMon, cd) {
  return lechGiay(nhanLuc, Math.max(0, soMon * cd.phut_moi_mon - cd.phut_tim_xe) * 60);
}
const TEN_TRA = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', balance: 'Tài khoản' };

async function danhSach() {
  const cd = await docCaiDat(), now = getNow();
  const doc = () => query(`SELECT c.*, o.code, o.total, o.payment_method, o.payment_status FROM pos_giao_chuyen c JOIN pos_orders o ON o.id = c.order_id
    WHERE c.trang_thai NOT IN ('xong', 'huy', 'da_dong') ORDER BY COALESCE(c.nhan_luc, c.tao_luc), c.id`);
  let ds = await doc();
  let doiLai = 0;
  for (const c of ds.filter((x) => ['tim_xe', 'doi_tai_xe', 'dang_giao'].includes(x.trang_thai) && (!x.doc_luc || x.doc_luc < lechGiay(now, -DOC_LAI_GIAY)))) {
    if (doiLai >= DOC_LAI_TOI_DA) break;
    const g = await run('UPDATE pos_giao_chuyen SET doc_luc = ? WHERE id = ? AND (doc_luc IS NULL OR doc_luc < ?)', [now, c.id, lechGiay(now, -DOC_LAI_GIAY)]);
    if (g.changes !== 1) continue;
    doiLai++;
    try { await capNhatTuAhamove(c, await aha.docChuyen(c.ma_ahamove)); } catch { /* Ahamove không trả lời: giữ trạng thái cũ, lần sau đọc lại */ }
  }
  if (doiLai) ds = await doc();
  await docLaiPhiHuy().catch(() => { /* Ahamove không trả lời: lần hỏi sau đọc lại */ });
  const mon = ds.length ? await query(`SELECT order_id, product_name, quantity, notes FROM pos_order_items WHERE order_id IN (${ds.map(() => '?').join(',')}) ORDER BY id`,
    ds.map((c) => c.order_id)) : [];
  let monTruoc = 0;
  return ds.map((c) => {
    const m = mon.filter((x) => x.order_id === c.order_id).map((x) => ({ ten: x.product_name, sl: Number(x.quantity), ghi_chu: x.notes || '' }));
    const soMon = m.reduce((s, x) => s + x.sl, 0);
    let goiLuc = null;
    if (c.trang_thai === 'dang_pha' && c.nhan_luc) { monTruoc += soMon; goiLuc = gioGoiTaiXe(c.nhan_luc, monTruoc, cd); }
    return {
      id: c.id, order_id: c.order_id, code: c.code, trang_thai: c.trang_thai, cot: COT[c.trang_thai] || 'dang_pha', ten: c.ten_nhan, sdt: c.sdt_nhan,
      dia_chi: c.dia_chi, ghi_chu: c.ghi_chu || '', km: c.km, loai_xe: c.loai_xe, so_mon: soMon, mon: m, tong: c.total, thanh_toan: TEN_TRA[c.payment_method] || c.payment_method,
      phi_khach: c.phi_khach, phi_that: c.phi_that, chenh: c.chenh, phi_huy: c.phi_huy, loi: c.loi,
      tai_xe: { ten: c.tai_xe_ten, sdt: c.tai_xe_sdt, bien_so: c.tai_xe_bien_so }, nhan_luc: c.nhan_luc, goi_luc: c.goi_luc, goi_luc_goi_y: goiLuc,
      toi_gio: !!goiLuc && goiLuc <= now,
      nhac: c.trang_thai === 'dang_pha' && !!c.nhan_luc && lechGiay(c.nhan_luc, cd.phut_nhac * 60) <= now,
      tim_lau: c.trang_thai === 'tim_xe' && !!c.goi_luc && c.goi_luc < lechGiay(now, -TIM_XE_TOI_DA_GIAY),
      treo: c.trang_thai === 'dang_goi' && (!!c.loi_mang || (!!c.goi_luc && c.goi_luc < lechGiay(now, -GOI_TREO_GIAY))),   // quầy được bấm "Gọi lại"
      in_tem_luc: c.in_tem_luc, lan_in_tem: c.lan_in_tem,
    };
  });
}
async function nhanDon(orderId) {
  const g = await run("UPDATE pos_giao_chuyen SET trang_thai = 'dang_pha', nhan_luc = ? WHERE order_id = ? AND trang_thai = 'moi'", [getNow(), orderId]);
  return g.changes === 1 ? { ok: true } : loi(409, 'KHONG_O_COT_MOI', 'Đơn đã được nhận hoặc không còn ở cột Mới');
}
/** Thẻ giao lỗi (Ahamove báo giao không thành / huỷ khi đã lấy hàng): quản lý / chủ quán đóng thẻ có lý do — CHỈ rời màn, không đụng tiền / đơn
 *  (chủ quán Q6 06.11; hoàn tiền đơn tiền mặt / CK chờ HUY-1). Thẻ da_dong vẫn chặn Huỷ đơn như giao_loi (kiemHuyDonGiao — Q8 07.11).
 *  Phí chuyến vẫn ở Đối soát (tính theo dấu giờ đã chạy). */
async function dongThe(orderId, lyDo, user) {
  if (!laQuanLy(user)) return loi(403, 'PERMISSION_DENIED', 'Đóng thẻ cần quản lý hoặc chủ quán');
  if (!lyDoHopLe(lyDo)) return loi(400, 'LY_DO_BAT_BUOC', 'Nhập lý do đóng thẻ (ít nhất 3 ký tự)');
  const g = await run("UPDATE pos_giao_chuyen SET trang_thai = 'da_dong', huy_luc = ?, loi = ? WHERE order_id = ? AND trang_thai = 'giao_loi'",
    [getNow(), 'Đã đóng thẻ: ' + lyDo.trim().slice(0, 200), orderId]);
  return g.changes === 1 ? { ok: true } : loi(409, 'KHONG_PHAI_GIAO_LOI', 'Chỉ đóng được thẻ giao lỗi');
}
/** Tem túi giao: lần đầu chỉ MỘT máy giành được (hai máy cùng mở màn); in lại thì đếm lần. */
async function inTem(orderId, lai) {
  const g = lai ? await run('UPDATE pos_giao_chuyen SET lan_in_tem = lan_in_tem + 1, in_tem_luc = COALESCE(in_tem_luc, ?) WHERE order_id = ?', [getNow(), orderId])
    : await run('UPDATE pos_giao_chuyen SET in_tem_luc = ?, lan_in_tem = 1 WHERE order_id = ? AND in_tem_luc IS NULL', [getNow(), orderId]);
  const c = await docChuyenDon(orderId);
  return { duoc: g.changes === 1, lan: c?.lan_in_tem || 0 };
}

// ─── Hoá đơn + Đối soát (K) ───
async function giaoTrenHoaDon(orderId) {
  const c = await docChuyenDon(orderId);
  return c ? { dia_chi: c.dia_chi, nguoi_nhan: c.ten_nhan, sdt: c.sdt_nhan, ghi_chu: c.ghi_chu || '' } : null;
}
async function doiSoatGiao(q, tu, den) {
  const ds = await q(`SELECT c.*, o.code, o.status, o.shipping_fee, o.cancelled_reason FROM pos_giao_chuyen c JOIN pos_orders o ON o.id = c.order_id
    WHERE DATE(o.created_at) BETWEEN ? AND ?`, [tu, den]);
  const tong = (f) => ds.reduce((s, x) => s + f(x), 0);
  const choPhi = await q(CHO_PHI_HUY, []);
  return {
    so_don: ds.length,
    phi_khach: tong((x) => (x.status === 'completed' ? Number(x.shipping_fee || 0) : 0)),
    phi_that: tong((x) => (daChay(x) ? Number(x.phi_that || 0) : 0)),
    quan_bu: tong((x) => (daChay(x) ? Math.max(0, Number(x.chenh || 0)) : 0)),
    quan_du: tong((x) => (daChay(x) ? Math.max(0, -Number(x.chenh || 0)) : 0)),
    phi_huy: tong((x) => Number(x.phi_huy || 0)),
    phi_huy_chua_ro: choPhi.filter((t) => ds.some((x) => x.id === Number(t.phu))).length,   // lệnh huỷ thành công mà chưa đọc được phí
    don_huy: ds.filter((x) => x.trang_thai === 'huy' || x.status !== 'completed')
      .map((x) => ({ code: x.code, ly_do: x.ly_do_huy || x.cancelled_reason || '', do_da_pha: x.do_da_pha, phi_huy: Number(x.phi_huy || 0) })),
  };
}

module.exports = {
  LOAI_XE, MAC_DINH, kiemCaiDat, docCaiDat, goiY, datDiemLay, taoBaoPhi, docBaoPhiDon, ghiChuyenDon, kiemHuyDonGiao, chotHuyGiao, xoaDonGiao,
  donGiaoDangChay, dongChuyenKhiHoan, laQuanLy, goiXe, dongThe, huyChuyenGiao, nhanTinBao, gioGoiTaiXe, danhSach, nhanDon, inTem, giaoTrenHoaDon, doiSoatGiao,
};
