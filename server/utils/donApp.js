/**
 * KH-MUA-1 — đơn App KH nhận tại quán (chủ quán chốt 30–31.10). KHÔNG có phép tính tiền nào ở đây:
 * - Báo giá = taoDon chế độ chỉ tính (CÙNG lời gọi POST /orders/tinh-thu); file này chỉ đổi tên trường sang dạng App.
 * - Tạo đơn = phiên thanh toán sẵn có (giuCho.js taoPhien → giữ ví / QR payOS; trả ví đủ → chotPhien ngay). Đơn thật chỉ có khi đã trả đủ.
 * - pos_don_app (nâng cấp 006) chỉ nối khách ↔ phiên + khoá gửi + tiến trình quầy. Tiến trình đọc ra bằng MỘT hàm tienTrinh; hết hạn
 *   không cần ghi gì (dangGiu chỉ đếm phiên `cho` còn hạn).
 * - Luật 4xx (chủ quán 31.10): MỌI trả lời 4xx của datDon = chưa tạo đơn, chưa giữ / trừ ví, KHÔNG giữ khoá gửi — dòng giữ khoá bị xoá,
 *   phiên lỡ tạo bị huỷ (finally). Ngoại lệ đã duyệt (Q8): chốt ví hỏng sau khi tạo phiên để lại một dòng phiên `loi` không giữ tiền.
 *   Ngoại lệ còn lại: taoPhien tự ném SAU khi giao dịch phiên đã ghi (phienId chưa về) → phiên `cho` mồ côi giữ ví tới hết hạn (HAN_PHUT) rồi
 *   tự nhả; App nhận 5xx, không 4xx.
 * - "Đã tạo xong" là cột `xong` riêng (soát vòng 2) — có phien_id KHÔNG có nghĩa là xong. App chỉ thấy đơn qua MỘT vị từ THAY_DUOC (xong = 1
 *   HOẶC phiên đã da_thu — đơn đã trả mà lỗi ném trước khi kịp đánh dấu xong): lưới 10 giây, đơn chưa trả của GET /don, huỷ. Tra khoá đọc cả
 *   dòng chưa xong (→ DANG_XU_LY); đơn đã trả (GET /don nhánh đơn thật, quầy, đổi tiến trình) đi theo phiên da_thu, không cần cột xong.
 * - Dọn dẹp (finally) đọc lại CSDL, không tin cờ trong bộ nhớ: phiên đã `da_thu` (lỗi ném SAU khi chốt ví đã ghi) → GIỮ dòng đơn App để
 *   gửi lại cùng khoá trả đúng đơn đó, không trừ ví lần hai (soát vòng 1).
 */
const crypto = require('crypto');
const { query, queryOne, run } = require('../database');
const { getNow } = require('./helpers');
const { taoDon } = require('../routes/orders');
const { layMenuQuay } = require('../routes/products');
const { docCaiDat, dangMo } = require('./gioHoatDong');
const { taoPhien, chotPhien, gomRes } = require('./giuCho');
const { laTrungKhoa } = require('../kho/tinh');
const { thanLoi } = require('../routes/kh/loi');

const NGUOI = 'app_kh';
const GIOI = {
  MON_TOI_DA: 50, SL_TOI_DA: 99, GHI_CHU_TOI_DA: 200,
  KHOA_GUI: /^[A-Za-z0-9-]{16,64}$/,
  NHO_KHOA_GIAY: 24 * 3600,      // gửi lại cùng khoá trong 24 giờ → đơn cũ; quá → KHOA_GUI_DA_DUNG (khoá duy nhất mãi trong CSDL)
  LUOI_GIAY: 10,                 // lưới thứ hai: cùng giỏ, đơn trước còn cho_tra
  LUOT_DAT: 10, LUOT_CUA_SO_MS: 10 * 60000,   // Q9: 10 lần / 10 phút mỗi khách (gửi lại cùng khoá không tính)
  BO_DEM_TOI_DA: 10000,
};
const CACH_TRA = { qr: { cach: 'payos', vi: false }, vi: { cach: 'tai_khoan', vi: true }, vi_qr: { cach: 'payos', vi: true } };
const HUY = ['cancelled', 'refunded'];
const DON_CON = "o.status NOT IN ('cancelled', 'refunded')";   // cùng danh sách HUY, trong câu SQL
const THAY_DUOC = "(a.xong = 1 OR p.trang_thai = 'da_thu')";   // đơn App mà App nhìn thấy (a = pos_don_app, p = phiên của nó)
// Mã lỗi của taoPhien / chotPhien giữ nguyên khi trả App; mã khác → DON_KHONG_HOP_LE (lời báo giữ nguyên) — mọi mã App nhận có trong hợp đồng.
const GIU_MA = ['CACH_KHONG_KHOP', 'CHUA_CO_PIN', 'PIN_SAI', 'PIN_DANG_KHOA', 'PAYOS_CHUA_CAU_HINH', 'PAYOS_LOI', 'KHO_BAN'];
const CHU_MA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const truGiay = (giay) => new Date(Date.parse(getNow() + 'Z') - giay * 1000).toISOString().slice(0, 19);
const sinhMa = () => 'A' + [...crypto.randomBytes(8)].map((b) => CHU_MA[b % CHU_MA.length]).join('');
// Băm giỏ từ thân THÔ (chưa kiểm) — so được cả khi thân sai dạng; KHÔNG có pin, tong_da_xem, khoa_gui.
const bamGio = (b) => crypto.createHash('sha256').update(JSON.stringify([
  Array.isArray(b.mon) ? b.mon.map((m) => [m?.ma ?? null, m?.so_luong ?? null, m?.ghi_chu || null]) : null,
  b.ma_giam || null, b.cach_nhan ?? null, b.cach_tra ?? null])).digest('hex');

/** MỘT vị từ tiến trình cho mọi nơi đọc (App, quầy). p: phiên; o: đơn thật (status) | null; quay: tien_trinh_quay. */
function tienTrinh(p, o, quay) {
  if (p.trang_thai === 'da_thu') return o && HUY.includes(o.status) ? 'da_huy' : quay || 'da_tra';
  return p.trang_thai === 'cho' && p.het_han > getNow() ? 'cho_tra' : 'da_huy';
}
const qrCua = (p, tt) => (tt === 'cho_tra' ? { chuoi: p.qr, het_han: p.het_han } : null);

const luot = new Map();
/** Giữ một lượt POST /don của khách. Trả 0 = được; > 0 = số giây phải chờ. */
function giuLuotDat(khachId, luc = Date.now()) {
  if (luot.size >= GIOI.BO_DEM_TOI_DA) luot.clear();
  const o = luot.get(khachId);
  if (!o || luc - o.bat_dau >= GIOI.LUOT_CUA_SO_MS) { luot.set(khachId, { bat_dau: luc, dem: 1 }); return 0; }
  if (o.dem >= GIOI.LUOT_DAT) return Math.max(1, Math.ceil((o.bat_dau + GIOI.LUOT_CUA_SO_MS - luc) / 1000));
  o.dem++;
  return 0;
}

/** Thân giỏ → { mon[], maGiam } | lỗi { status, body }. */
function docGio(b) {
  if (b.cach_nhan === 'giao') return thanLoi('CHUA_GIAO');
  const sai = thanLoi('YEU_CAU_KHONG_HOP_LE');
  if (b.cach_nhan !== 'tai_quan' || !Array.isArray(b.mon) || !b.mon.length || b.mon.length > GIOI.MON_TOI_DA) return sai;
  if (b.ma_giam != null && typeof b.ma_giam !== 'string') return sai;
  for (const m of b.mon) {
    if (!m || typeof m.ma !== 'string' || !m.ma || !Number.isInteger(m.so_luong) || m.so_luong < 1 || m.so_luong > GIOI.SL_TOI_DA) return sai;
    if (m.ghi_chu != null && (typeof m.ghi_chu !== 'string' || m.ghi_chu.length > GIOI.GHI_CHU_TOI_DA)) return sai;
  }
  return { mon: b.mon.map((m) => ({ ma: m.ma, so_luong: m.so_luong, ghi_chu: (m.ghi_chu || '').trim() || null })), maGiam: (b.ma_giam || '').trim() || null };
}

/** Giờ hoạt động — cùng hàm /gio-hoat-dong, giờ máy chủ. */
async function kiemGio() {
  const rows = await query("SELECT key, value FROM pos_settings WHERE key LIKE 'gio_hd_%'");
  const m = dangMo(getNow(), docCaiDat(Object.fromEntries(rows.map((r) => [r.key, r.value]))));
  return !m.dang_mo ? thanLoi('NGOAI_GIO') : !m.nhan_don ? thanLoi('QUA_GIO_NHAN_DON') : null;
}

/** Món App → items của taoDon, theo ĐÚNG danh sách /menu thấy (layMenuQuay). Tồn chưa rõ (null) không chặn (Q7). */
async function dungItems(mon) {
  const theoMa = new Map((await layMenuQuay()).map((p) => [p.unique_id, p]));
  const can = new Map();
  for (const m of mon) {
    const p = theoMa.get(m.ma);
    if (!p || !p.sellable) return thanLoi('MON_KHONG_BAN', { ma: m.ma });
    can.set(m.ma, (can.get(m.ma) || 0) + m.so_luong);
  }
  for (const [ma, sl] of can) {
    const p = theoMa.get(ma);
    if (!p.khong_quan_kho && typeof p.stock_quantity === 'number' && sl > p.stock_quantity) return thanLoi('HET_HANG', { ma });
  }
  return {
    items: mon.map((m) => { const p = theoMa.get(m.ma); return { sx_product_type: p.sx_product_type, sx_product_id: p.sx_product_id, quantity: m.so_luong, note: m.ghi_chu }; }),
    ten: mon.map((m) => theoMa.get(m.ma).name),
  };
}

/** Lỗi của taoDon / taoPhien / chotPhien → lỗi App (mọi mã có trong hợp đồng; không lộ lời máy). */
function chuanLoi({ status, body }, mon = [], ten = []) {
  const code = body && body.code, error = body && body.error;
  if (code === 'SO_DU_KHONG_DU') return thanLoi('VI_KHONG_DU');
  if (GIU_MA.includes(code)) return { status, body: { error, code } };
  if (status >= 500) return thanLoi('LOI_MAY_CHU');
  if (!code && /^Không đủ hàng: /.test(error || '')) {   // checkStock của SX lúc tạo phiên (orders.js — 400 không code)
    const i = ten.findIndex((t) => error.startsWith(`Không đủ hàng: ${t}.`));
    return thanLoi('HET_HANG', { ma: i >= 0 ? mon[i].ma : null });
  }
  return thanLoi('DON_KHONG_HOP_LE', typeof error === 'string' && error ? { error } : {});
}

async function chiTinh(khach, items, maGiam) {
  const r = gomRes();
  const body = { customer_phone: khach.phone, customer_name: khach.name, items, ...(maGiam ? { discount_code: maGiam } : {}) };
  const kq = await taoDon({ body, user: { username: NGUOI } }, r, { chiTinh: true, tinhThu: true });
  return r.body !== undefined ? { status: r.statusCode, body: r.body } : kq.chiTiet;
}

/** Báo giá dạng App. Mã làm cả giỏ hỏng (mã % lúc Giờ vàng, MA_KHONG_CO_MON — quầy báo lỗi cả đơn) → tính lại KHÔNG mã + ma_giam_loi (Q10). */
async function baoGia(khach, gio, d) {
  let ct = await chiTinh(khach, d.items, gio.maGiam), maDung = gio.maGiam, maLoi = null;
  if (ct.status && gio.maGiam && ct.status < 500) {
    const khongMa = await chiTinh(khach, d.items, null);
    if (!khongMa.status) {
      maLoi = { code: ct.body.code === 'MA_KHONG_CO_MON' ? 'MA_KHONG_CO_MON' : 'MA_KHONG_AP_DUNG', error: ct.body.error };
      ct = khongMa; maDung = null;
    }
  }
  if (ct.status) return chuanLoi(ct, gio.mon, d.ten);
  if (!maLoi && ct.ma_loi_code) maLoi = { code: ct.ma_loi_code, error: ct.ma_loi };
  if (!maLoi && maDung && !ct.discount_code && ct.cach === 'hang') maLoi = { code: 'MA_KHONG_LOI_HON', error: ct.cau_ghi };   // Q4
  const giam = [['ma_giam', ct.discount_amount], ['hang', ct.tier_discount], ['gio_vang', ct.flash_discount]]
    .filter(([, n]) => n > 0).map(([loai, so_tien]) => ({ loai, so_tien }));
  return {
    maDung,
    bao: {
      dong: gio.mon.map((m, i) => ({ ma: m.ma, so_luong: ct.items[i].quantity, don_gia: ct.items[i].unit_price,
        thanh_tien: ct.items[i].unit_price * ct.items[i].quantity })),   // = itemTotal của taoDon; Σ = subtotal
      tam_tinh: ct.subtotal, giam, phi_giao: 0, tong: ct.total, ma_giam_loi: maLoi,
    },
  };
}

/** Kiểm giỏ + giờ + món rồi báo giá — dùng chung cho /gio/bao-gia và POST /don. */
async function kiemVaBaoGia(khach, b) {
  const gio = docGio(b);
  if (gio.status) return gio;
  const loiGio = await kiemGio();
  if (loiGio) return loiGio;
  const d = await dungItems(gio.mon);
  if (d.status) return d;
  const bg = await baoGia(khach, gio, d);
  return bg.status ? bg : { gio, d, ...bg };
}

async function baoGiaKhach(khach, b) {
  const kq = await kiemVaBaoGia(khach, b);
  return kq.status ? kq : { status: 200, body: { success: true, ...kq.bao } };
}

const docPhien = (id) => queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [id]);
const huyPhien = (id) => run("UPDATE pos_phien_thanh_toan SET trang_thai = 'huy', luc_chot = ? WHERE id = ? AND trang_thai = 'cho'", [getNow(), id]);

async function traDon(a, trung) {
  const p = await docPhien(a.phien_id);
  const o = p.order_id ? await queryOne('SELECT status FROM pos_orders WHERE id = ?', [p.order_id]) : null;
  const tt = tienTrinh(p, o, a.tien_trinh_quay);
  return { status: 200, body: { success: true, ma_don: a.ma, tong: p.tong, giu_vi: p.giu_vi, con_lai: p.con_lai, tien_trinh: tt, qr: qrCua(p, tt), trung } };
}

/** POST /don. Thứ tự (chủ quán 31.10): khoá gửi → tra khoá → lượt → thân + tong_da_xem → giờ → món → lưới 10 giây → báo giá / GIA_DA_DOI
 *  → giữ khoá → phiên (→ chốt ví). */
async function datDon(khach, b) {
  const phone = khach.phone, khoa = b.khoa_gui;
  if (typeof khoa !== 'string' || !GIOI.KHOA_GUI.test(khoa)) return thanLoi('KHOA_GUI_SAI');
  const bam = bamGio(b);
  let cu = await queryOne('SELECT * FROM pos_don_app WHERE phone = ? AND khoa_gui = ?', [phone, khoa]);
  // Dòng chưa tạo xong = yêu cầu cùng khoá đang chạy → 503, KHÔNG bao giờ tự xoá dòng của yêu cầu khác (soát vòng 1, lỗi 2) — trừ khi phiên đã
  // da_thu (lỗi ném SAU khi chốt ví đã ghi): đơn đã có (THAY_DUOC) → trả đúng đơn đó (không trừ ví lần hai).
  if (cu && !cu.xong) {
    const p = cu.phien_id ? await docPhien(cu.phien_id) : null;
    if (!p || p.trang_thai !== 'da_thu') return thanLoi('DANG_XU_LY');
  }
  if (cu) return cu.bam === bam && cu.tao_luc > truGiay(GIOI.NHO_KHOA_GIAY) ? traDon(cu, true) : thanLoi('KHOA_GUI_DA_DUNG');
  const cho = giuLuotDat(khach.id);
  if (cho) return thanLoi('QUA_NHIEU_LAN', { thu_lai_sau_giay: cho });
  const tra = CACH_TRA[b.cach_tra];
  if (!tra || !Number.isInteger(b.tong_da_xem) || b.tong_da_xem < 0) {
    const gio = docGio(b);
    return gio.status ? gio : thanLoi('YEU_CAU_KHONG_HOP_LE');
  }
  const kq = await kiemVaBaoGia(khach, b);
  if (kq.status) return kq;
  const trung = await queryOne(`SELECT a.* FROM pos_don_app a JOIN pos_phien_thanh_toan p ON p.id = a.phien_id
    WHERE a.phone = ? AND ${THAY_DUOC} AND a.bam = ? AND a.tao_luc > ? AND p.trang_thai = 'cho' AND p.het_han > ? ORDER BY a.id DESC LIMIT 1`,
  [phone, bam, truGiay(GIOI.LUOI_GIAY), getNow()]);
  if (trung) return traDon(trung, true);
  if (kq.bao.tong !== b.tong_da_xem) return thanLoi('GIA_DA_DOI', { bao_gia: kq.bao });

  const ma = sinhMa();
  const than = JSON.stringify({ dong: kq.bao.dong.map((x, i) => ({ ...x, ten: kq.d.ten[i], ghi_chu: kq.gio.mon[i].ghi_chu })), tong: kq.bao.tong });
  let appId;
  try {
    appId = Number((await run('INSERT INTO pos_don_app (ma, phone, khoa_gui, bam, than, tao_luc) VALUES (?, ?, ?, ?, ?, ?)',
      [ma, phone, khoa, bam, than, getNow()])).lastInsertRowid);
  } catch (e) {
    if (laTrungKhoa(e)) return thanLoi('DANG_XU_LY');   // yêu cầu song song cùng khoá đang giữ — App gửi lại cùng khoá
    throw e;
  }
  let xong = false, phienId = null;
  try {
    const don = { customer_phone: phone, customer_name: khach.name, items: kq.d.items, notes: `Đơn App ${ma} · nhận tại quán`,
      ...(kq.maDung ? { discount_code: kq.maDung } : {}) };
    const tp = await taoPhien({ cach: tra.cach, don, tru_tai_khoan: tra.vi, pin: b.pin }, NGUOI);
    if (tp.status !== 200) return chuanLoi(tp, kq.gio.mon, kq.d.ten);
    phienId = tp.body.phien.id;
    // Gắn phiên NGAY (trước khi chốt): lỗi ném sau đó thì dòng đơn App vẫn trỏ đúng phiên — finally xét theo trạng thái phiên trong CSDL.
    if ((await run('UPDATE pos_don_app SET phien_id = ? WHERE id = ? AND phien_id IS NULL', [phienId, appId])).changes !== 1) {
      throw new Error('KH-MUA-1: mất dòng giữ khoá gửi');
    }
    if (tp.body.phien.tong !== kq.bao.tong) {   // giá đổi đúng giữa báo giá và tạo phiên
      const moi = await kiemVaBaoGia(khach, b);
      return moi.status ? moi : thanLoi('GIA_DA_DOI', { bao_gia: moi.bao });
    }
    if (tra.cach === 'tai_khoan') {
      const c = await chotPhien(await docPhien(phienId), 'tai_khoan', { nguoi: NGUOI });
      if ((await docPhien(phienId)).trang_thai !== 'da_thu') return chuanLoi(c.status === 200 ? { status: 500, body: {} } : c, kq.gio.mon, kq.d.ten);
    }
    await run('UPDATE pos_don_app SET xong = 1 WHERE id = ?', [appId]);
    xong = true;
    return traDon({ ma, phien_id: phienId, tien_trinh_quay: '' }, false);
  } finally {
    if (!xong) {
      try {
        if (phienId) await huyPhien(phienId);
        await run(`DELETE FROM pos_don_app WHERE id = ? AND NOT EXISTS (SELECT 1 FROM pos_phien_thanh_toan p
          WHERE p.id = pos_don_app.phien_id AND p.trang_thai = 'da_thu')`, [appId]);
      } catch (e) { console.error('KH-MUA-1 dọn giữ khoá lỗi:', e.message); }
    }
  }
}

// Danh sách đơn của khách = đơn thật (quầy + App đã trả) ∪ đơn App chưa có đơn thật. MỘT câu cho GET /don và GET /don/:ma.
const CO_TIEN_VE = "EXISTS (SELECT 1 FROM pos_payos_su_kien s WHERE s.ma_payos = p.ma_payos AND s.ket_qua = 'chua_khop')";
const CAU_DON = `SELECT * FROM (
    SELECT o.code AS ma_bill, o.created_at AS ngay, o.total AS tong, o.debt_amount AS no, o.status AS trang_thai, o.payment_status AS thanh_toan,
      o.id AS oid, a.ma AS ma_app, a.than, a.tien_trinh_quay, p.trang_thai AS p_tt, p.het_han, p.qr, ${CO_TIEN_VE} AS tien_ve, 1 AS loai
    FROM pos_orders o LEFT JOIN pos_phien_thanh_toan p ON p.order_id = o.id LEFT JOIN pos_don_app a ON a.phien_id = p.id
    WHERE o.customer_phone = ?
    UNION ALL
    SELECT NULL, a.tao_luc, p.tong, 0, NULL, NULL, NULL, a.ma, a.than, a.tien_trinh_quay, p.trang_thai, p.het_han, p.qr, ${CO_TIEN_VE}, 0
    FROM pos_don_app a JOIN pos_phien_thanh_toan p ON p.id = a.phien_id WHERE a.phone = ? AND ${THAY_DUOC} AND p.order_id IS NULL)`;

function tomDon(r) {
  const tt = r.ma_app ? tienTrinh({ trang_thai: r.p_tt, het_han: r.het_han }, r.loai ? { status: r.trang_thai } : null, r.tien_trinh_quay)
    : HUY.includes(r.trang_thai) ? 'da_huy' : 'xong';
  return {
    ma: r.ma_app || r.ma_bill, ngay: r.ngay, tong: r.tong, da_tra: r.loai ? Number(r.tong || 0) - Number(r.no || 0) : 0,
    trang_thai: r.trang_thai, thanh_toan: r.thanh_toan, tien_trinh: tt, qr: r.ma_app ? qrCua(r, tt) : null,
    tien_ve_cho_doi_soat: tt === 'da_huy' && !!r.tien_ve,
  };
}

async function dsDon(phone, trang, moiTrang) {
  const ds = await query(`${CAU_DON} ORDER BY ngay DESC, loai ASC, oid DESC LIMIT ? OFFSET ?`, [phone, phone, moiTrang + 1, (trang - 1) * moiTrang]);
  return { trang, con_nua: ds.length > moiTrang, data: ds.slice(0, moiTrang).map(tomDon) };
}

/** Đơn theo mã App hoặc mã bill — LUÔN trong phạm vi SĐT token; không có → null (route trả 404 như không có). */
async function chiTietDon(phone, ma) {
  const r = await queryOne(`${CAU_DON} WHERE ma_app = ? OR ma_bill = ? LIMIT 1`, [phone, phone, ma, ma]);
  if (!r) return null;
  const mon = r.loai
    ? (await query(`SELECT oi.product_name, oi.quantity, oi.unit_price, oi.flash_unit_price, oi.tier_unit_price, oi.total_price, oi.notes,
        pp.sx_product_type, pp.sx_product_id FROM pos_order_items oi LEFT JOIN pos_products pp ON pp.id = oi.product_id
        WHERE oi.order_id = ? ORDER BY oi.id`, [r.oid])).map((d) => ({
      ma: d.sx_product_type != null ? `${d.sx_product_type}_${d.sx_product_id}` : null, ten: d.product_name, so_luong: d.quantity,
      don_gia: d.flash_unit_price || d.tier_unit_price || d.unit_price, thanh_tien: d.total_price, ghi_chu: d.notes }))
    : JSON.parse(r.than).dong.map((d) => ({ ma: d.ma, ten: d.ten, so_luong: d.so_luong, don_gia: d.don_gia, thanh_tien: d.thanh_tien, ghi_chu: d.ghi_chu }));
  return { ...tomDon(r), mon };
}

async function huyDon(phone, ma) {
  const a = await queryOne(`SELECT a.* FROM pos_don_app a JOIN pos_phien_thanh_toan p ON p.id = a.phien_id WHERE a.phone = ? AND a.ma = ? AND ${THAY_DUOC}`,
    [phone, ma]);
  if (!a) return thanLoi('KHONG_THAY_DON');
  await huyPhien(a.phien_id);   // đua với webhook: cùng điều kiện trang_thai = 'cho' với cổng chốt — một bên thắng
  const kq = await traDon(a, false);
  return kq.body.tien_trinh === 'da_huy' ? { status: 200, body: { success: true, ma_don: a.ma, tien_trinh: 'da_huy' } } : thanLoi('DA_TRA_GOI_QUAN');
}

// ── Quầy ────────────────────────────────────────────────────────────────────
/** Đơn App ĐÃ TRẢ: hôm nay + đơn chưa xong (và không bị huỷ / hoàn) từ trước. Đơn chưa trả không có. */
async function dsQuay() {
  const ds = await query(`SELECT a.id, a.ma, a.than, a.tien_trinh_quay, a.nguoi_lam, a.luc_lam, a.nguoi_xong, a.luc_xong,
      p.giu_vi, p.con_lai, p.trang_thai AS p_tt, p.het_han, p.luc_chot, o.code, o.customer_name, o.status
    FROM pos_don_app a JOIN pos_phien_thanh_toan p ON p.id = a.phien_id JOIN pos_orders o ON o.id = p.order_id
    WHERE p.trang_thai = 'da_thu' AND (p.luc_chot >= ? OR (a.tien_trinh_quay <> 'xong' AND ${DON_CON})) ORDER BY a.id DESC LIMIT 100`, [getNow().slice(0, 10) + 'T00:00:00']);
  return ds.map((r) => ({
    id: r.id, ma: r.ma, ma_bill: r.code, gio: r.luc_chot, ten_khach: r.customer_name,
    mon: JSON.parse(r.than).dong.map((d) => ({ ten: d.ten, so_luong: d.so_luong, ghi_chu: d.ghi_chu })),
    da_tra: r.giu_vi + r.con_lai, tra_vi: r.giu_vi, tra_qr: r.con_lai,
    tien_trinh: tienTrinh({ trang_thai: r.p_tt, het_han: r.het_han }, { status: r.status }, r.tien_trinh_quay),
    nguoi_lam: r.nguoi_lam, luc_lam: r.luc_lam, nguoi_xong: r.nguoi_xong, luc_xong: r.luc_xong,
  }));
}

/** Đang làm ('' → dang_lam) · Xong (dang_lam → xong); chỉ đơn đã trả, chưa bị huỷ / hoàn. Câu ghi có điều kiện — bấm lại / hai máy cùng bấm → false. */
async function doiTienTrinh(id, buoc, nguoi) {
  const [tu, cotNguoi, cotLuc] = buoc === 'dang_lam' ? ['', 'nguoi_lam', 'luc_lam'] : ['dang_lam', 'nguoi_xong', 'luc_xong'];
  const r = await run(`UPDATE pos_don_app SET tien_trinh_quay = ?, ${cotNguoi} = ?, ${cotLuc} = ? WHERE id = ? AND tien_trinh_quay = ?
    AND EXISTS (SELECT 1 FROM pos_phien_thanh_toan p JOIN pos_orders o ON o.id = p.order_id
      WHERE p.id = pos_don_app.phien_id AND p.trang_thai = 'da_thu' AND ${DON_CON})`, [buoc, nguoi, getNow(), id, tu]);
  return r.changes === 1;
}

module.exports = { baoGiaKhach, datDon, dsDon, chiTietDon, huyDon, dsQuay, doiTienTrinh, tienTrinh, giuLuotDat, GIOI };
