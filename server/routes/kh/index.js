/**
 * KH-API-1 — cổng App KH, gắn MỘT chỗ tại /api/kh (index.js máy chủ). Luật:
 * - Thiếu / sai cấu hình KH_JWT_SECRET → mọi đường 503 (canCauHinhKhach đứng đầu router).
 * - Đăng nhập + đọc chung (hang, gio-vang, gio-hoat-dong; menu: token không bắt buộc — KH-API-3) đứng TRƯỚC xacThucKhach;
 *   còn lại cần token KHÁCH. SĐT LUÔN là req.khach.phone — sdt / phone /
 *   customer_phone trong tham số hay thân yêu cầu bị bỏ qua (F3).
 * - Tiền / điểm / voucher / mã bill đi qua ĐÚNG hàm quầy đang dùng (diemKhach.js, signup-codes.js, products.js).
 * - KH-API-2: giá hạng qua giaHang.js (cùng hàm orders.js), giờ vàng qua readFlashState, giờ hoạt động qua gioHoatDong.js.
 * - Mọi cửa ở đây phải có trong HOP_DONG_API_KH.md (bài thử cong_cu/thu_HOPDONG_KH.js canh).
 */
const express = require('express');
const { query, queryOne, run } = require('../../database');
const { canCauHinhKhach, xacThucKhach, tuyChonKhach, kyTokenKhach, hanTokenKhach } = require('../../middleware/khachAuth');
const { chuanSdt, chuanTen, chuanXungHo, chuanDiaChi, giuLuotMenu, giuLuotGiaHan, xinMaGui, giuLuotNhanMa, xacMinhMa } = require('../../utils/maKhach');
const { layDiemKhach, layVoucherKhach, layMaKhachMoi } = require('../../utils/diemKhach');
const { getNow, sinhQrKhongTrung, QR_TIEN_TO } = require('../../utils/helpers');
const { nhanMaUuDai, nhanDiemMaBill } = require('../signup-codes');
const { layMenuQuay } = require('../products');
const { bao, loiMayChu } = require('./loi');
const { datPin } = require('../../utils/pinKhach');
const { dangGiu } = require('../wallets');
const { getMembershipStatus, isTierUsable } = require('../../utils/membershipStatus');
const { readFlashState } = require('../../utils/flashState');
const { tiLeHangMon, giaCacHang } = require('../../utils/giaHang');
const { docCaiDat, khungHangNgay, traGioHoatDong } = require('../../utils/gioHoatDong');

const router = express.Router();
const SO_DON_MOI_TRANG = 20;

// Danh sách TRẮNG hồ sơ — kh là cả hàng pos_customers (SELECT *). dia_chi = cột address dùng chung với quầy (chủ quán 30.10).
const hoSo = (kh) => ({ sdt: kh.phone, ten: kh.name, ngay_tao: kh.created_at, xung_ho: kh.xung_ho ?? null, dia_chi: kh.address ?? null });
const tomDon = (o) => ({
  ma: o.code, ngay: o.created_at, tong: o.total, da_tra: Number(o.total || 0) - Number(o.debt_amount || 0),
  trang_thai: o.status, thanh_toan: o.payment_status,
});
const COT_DON = 'id, code, created_at, total, debt_amount, status, payment_status';
// Danh sách TRẮNG trường món (E5) — không giá vốn, không số tồn thật. ton_cu + ton_luc: mất SX thì App hiện "theo số lúc …" (CLAUDE.md §5.8).
const monKhach = (p, dsHang) => ({
  ma: p.unique_id, ten: p.name, nhom: p.category, gia: p.price,
  con_hang: p.khong_quan_kho ? true : typeof p.stock_quantity === 'number' ? p.stock_quantity > 0 : null,
  ton_cu: !!p.ton_cu, ton_luc: p.ton_luc || null,
  gia_hang: giaCacHang(p.price, p.is_special_group, dsHang),
  // KH-SP-1: thông tin ngắn nhập ở màn Sản phẩm POS; chưa nhập → [] / null. Ảnh món làm sau (KH-SP-2).
  nhu_cau: p.nhu_cau, the_chat: p.the_chat, mo_ta: p.mo_ta, cong_dung: p.cong_dung, thanh_phan: p.thanh_phan, anh: null,
});
// Hạng đang bật — cùng thứ tự GET /api/pos/tiers.
const hangDangBat = () => query('SELECT * FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order ASC, card_price ASC');
const phanTram = (h) => ({ phan_tram: tiLeHangMon(h, false), phan_tram_nhom_dac_biet: tiLeHangMon(h, true) });
// Thẻ hạng DÙNG ĐƯỢC của khách — CÙNG hai hàm và CÙNG câu đọc hạng (không lọc is_active) với giảm hạng ở orders.js; hết / chưa có → null.
async function theCuaKhach(phone) {
  const m = await getMembershipStatus(query, queryOne, getNow, phone);
  const h = isTierUsable(m.status) && await queryOne('SELECT * FROM pos_membership_tiers WHERE id = ?', [m.tier_id]);
  return h ? { h, het_han: String(m.expires_at).replace(' ', 'T') } : null;
}
// Số dư KHẢ DỤNG của ví riêng khách = số quầy hiện (GET /api/pos/wallets/:phone: balance − dangGiu). Không cộng ví mẹ (chủ quán 29.10).
async function soDuVi(phone) {
  const v = await queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [phone]);
  return Number(v?.balance || 0) - (await dangGiu({ queryOne }, phone));
}

router.use(canCauHinhKhach);

// ── Đăng nhập (không cần token) ───────────────────────────────────────────
// A5: câu trả lời KHÔNG phụ thuộc SĐT có là khách hay không — đường này không đọc pos_customers.
router.post('/dang-nhap/xin-ma', async (req, res) => {
  try {
    const sdt = chuanSdt((req.body || {}).sdt);
    if (!sdt) return bao(res, 'SDT_KHONG_HOP_LE');
    const kq = await xinMaGui(sdt, req.ip || '');
    if (kq.loi) return bao(res, kq.loi);
    res.json({ success: true, lay_ma_tai_quay: kq.layMaTaiQuay });
  } catch (err) {
    loiMayChu(res, err, 'kh xin-ma');
  }
});

router.post('/dang-nhap/xac-minh', async (req, res) => {
  try {
    const b = req.body || {};
    const sdt = chuanSdt(b.sdt);
    if (!sdt) return bao(res, 'SDT_KHONG_HOP_LE');
    const kq = await xacMinhMa(sdt, String(b.ma ?? ''), { ten: b.ten, xungHo: b.xung_ho, diaChi: b.dia_chi });
    if (kq.loi) return bao(res, kq.loi);
    const kh = await queryOne('SELECT * FROM pos_customers WHERE id = ?', [kq.khachId]);
    res.json({ success: true, token: kyTokenKhach(kh.id), khach: hoSo(kh) });
  } catch (err) {
    loiMayChu(res, err, 'kh xac-minh');
  }
});

// ── Đọc chung, không cần token (KH-API-2) — đứng TRƯỚC xacThucKhach ────────
router.get('/hang', async (req, res) => {
  try {
    const ds = await hangDangBat();
    res.json({ success: true, data: ds.map((h) => ({ id: h.id, ten: h.name, ...phanTram(h), gia_the: Number(h.card_price) || 0, thu_tu: h.sort_order })) });
  } catch (err) {
    loiMayChu(res, err, 'kh hang');
  }
});

// Giờ vàng = flash sale. MỘT vị từ `bat` = quầy giảm được (orders.js F2: có % VÀ có món); dang_chay = bat VÀ đang trong khung.
// POS không đếm suất → không có trường suất.
router.get('/gio-vang', async (req, res) => {
  try {
    const f = await readFlashState(query, getNow);
    const bat = f.enabled && !!f.start && !!f.end && f.start !== f.end && f.percent > 0 && f.product_keys.length > 0;
    const bayGio = getNow();
    const khung = bat ? khungHangNgay(bayGio, f.start, f.end) : null;
    res.json({
      success: true, dang_chay: bat && f.is_flash_now,
      bat_dau: khung ? khung.mo : null, ket_thuc: khung ? khung.dong : null, phan_tram: bat ? f.percent : 0, mon: bat ? f.product_keys : [],
    });
  } catch (err) {
    loiMayChu(res, err, 'kh gio-vang');
  }
});

router.get('/gio-hoat-dong', async (req, res) => {
  try {
    const rows = await query("SELECT key, value FROM pos_settings WHERE key LIKE 'gio_hd_%'");
    res.json({ success: true, ...traGioHoatDong(getNow(), docCaiDat(Object.fromEntries(rows.map((r) => [r.key, r.value])))) });
  } catch (err) {
    loiMayChu(res, err, 'kh gio-hoat-dong');
  }
});

// KH-API-3: token KHÔNG bắt buộc (khách chưa đăng nhập vẫn xem menu + giá). Gửi token mà sai → 401 như mọi cửa. Không token → giới hạn
// MENU_IP_PHUT lượt / IP / phút (bộ nhớ); có token không đếm.
router.get('/menu', tuyChonKhach, async (req, res) => {
  try {
    if (!req.khach && !giuLuotMenu(req.ip || '')) return bao(res, 'QUA_NHIEU_LAN');
    const [mon, dsHang, the] = await Promise.all([layMenuQuay(), hangDangBat(), req.khach && theCuaKhach(req.khach.phone)]);
    // Hạng đã tắt mà khách còn thẻ: quầy vẫn giảm (orders.js không lọc is_active) → giá hạng đó cũng hiện cho chính khách này.
    if (the && !dsHang.some((h) => h.id === the.h.id)) dsHang.push(the.h);
    res.json({ success: true, data: mon.filter((p) => p.sellable).map((p) => monKhach(p, dsHang)) });
  } catch (err) {
    loiMayChu(res, err, 'kh menu');
  }
});

// ── Từ đây: token khách bắt buộc ──────────────────────────────────────────
router.use(xacThucKhach);

// P15-QR: `qr` CHỈ ở đây (không vào hoSo — xác minh / PUT /toi không trả). Mã chưa có tiền tố (cũ QR-<SĐT> hoặc NULL) → đổi sang mã mới
// lần đầu khách xem — cùng vị từ startsWith(QR_TIEN_TO) với /customers/qr/:code. Câu ghi so-đổi theo đúng giá trị vừa đọc: hai lượt cùng lúc
// thì lượt sau changes = 0, đọc lại ra mã của lượt trước.
router.get('/toi', async (req, res) => {
  try {
    const docQr = async () => (await queryOne('SELECT qr_code FROM pos_customers WHERE id = ?', [req.khach.id])).qr_code;
    let qr = await docQr();
    if (!String(qr || '').startsWith(QR_TIEN_TO)) {
      // GET-ghi: đổi mã QR cũ / NULL MỘT lần khi khách xem QR (P15-QR phần B) — lần sau đã có tiền tố, không ghi nữa.
      await run('UPDATE pos_customers SET qr_code = ?, updated_at = ? WHERE id = ? AND qr_code IS ?',
        [await sinhQrKhongTrung(queryOne), getNow(), req.khach.id, qr]);
      qr = await docQr();
    }
    const phone = req.khach.phone, the = await theCuaKhach(phone);
    const hang = the ? { id: the.h.id, ten: the.h.name, ...phanTram(the.h), het_han: the.het_han } : null;
    res.json({ success: true, khach: { ...hoSo(req.khach), qr, hang, so_du_vi: await soDuVi(phone) } });
  } catch (err) {
    loiMayChu(res, err, 'kh toi');
  }
});

// KH-API-3: sửa ten / xung_ho / dia_chi — trường nào có khoá trong thân thì sửa, ít nhất một. Cùng hàm kiểm với đăng ký (maKhach.js).
// ten / xung_ho gửi mà rỗng → lỗi (không xoá được); dia_chi rỗng / null → xoá. MỘT câu UPDATE chỉ các cột được gửi.
router.put('/toi', async (req, res) => {
  try {
    const b = req.body || {};
    const doi = {};
    if ('ten' in b) { doi.name = chuanTen(b.ten); if (!doi.name) return bao(res, 'TEN_KHONG_HOP_LE'); }
    if ('xung_ho' in b) { doi.xung_ho = chuanXungHo(b.xung_ho); if (!doi.xung_ho || doi.xung_ho.loi) return bao(res, 'XUNG_HO_SAI'); }
    if ('dia_chi' in b) { doi.address = chuanDiaChi(b.dia_chi); if (doi.address && doi.address.loi) return bao(res, doi.address.loi); }
    const cot = Object.keys(doi);
    if (!cot.length) return bao(res, 'YEU_CAU_KHONG_HOP_LE');
    await run(`UPDATE pos_customers SET ${cot.map((c) => `${c} = ?`).join(', ')}, updated_at = ? WHERE id = ?`,
      [...Object.values(doi), getNow(), req.khach.id]);
    res.json({ success: true, khach: hoSo({ ...req.khach, ...doi }) });
  } catch (err) {
    loiMayChu(res, err, 'kh sua ho so');
  }
});

// KH-API-3 (D): token CÒN HẠN → token mới 30 ngày. Token cũ KHÔNG thu hồi (JWT không lưu ở máy chủ; sổ phiên là KH-TACH-1) — tự hết
// đúng hạn cũ. GIA_HAN_KHACH_GIO lượt / khách / giờ (bộ nhớ, KHÔNG ghi pos_kh_lan_thu — bảng đó là trần nhận mã bill / nhận điểm).
router.post('/gia-han', (req, res) => {
  try {
    if (!giuLuotGiaHan(req.khach.id)) return bao(res, 'QUA_NHIEU_LAN');
    const token = kyTokenKhach(req.khach.id);
    res.json({ success: true, token, het_han: hanTokenKhach(token) });
  } catch (err) {
    loiMayChu(res, err, 'kh gia-han');
  }
});

router.get('/diem', async (req, res) => {
  try {
    const { points, history } = await layDiemKhach(req.khach.phone);
    res.json({ success: true, phone: req.khach.phone, points, history });
  } catch (err) {
    loiMayChu(res, err, 'kh diem');
  }
});

router.get('/voucher', async (req, res) => {
  try {
    const phone = req.khach.phone;
    res.json({ success: true, phone, data: await layVoucherKhach(phone, req.query.all === '1'), ma_khach_moi: await layMaKhachMoi(phone) });
  } catch (err) {
    loiMayChu(res, err, 'kh voucher');
  }
});

router.get('/don', async (req, res) => {
  try {
    const trang = Math.max(1, parseInt(req.query.trang, 10) || 1);
    const ds = await query(`SELECT ${COT_DON} FROM pos_orders WHERE customer_phone = ? ORDER BY id DESC LIMIT ? OFFSET ?`,
      [req.khach.phone, SO_DON_MOI_TRANG + 1, (trang - 1) * SO_DON_MOI_TRANG]);
    res.json({ success: true, trang, con_nua: ds.length > SO_DON_MOI_TRANG, data: ds.slice(0, SO_DON_MOI_TRANG).map(tomDon) });
  } catch (err) {
    loiMayChu(res, err, 'kh don');
  }
});

// Đơn của khách khác → 404 như đơn không có (không lộ đơn tồn tại — phiếu F3).
router.get('/don/:ma', async (req, res) => {
  try {
    const o = await queryOne(`SELECT ${COT_DON} FROM pos_orders WHERE customer_phone = ? AND code = ?`, [req.khach.phone, req.params.ma]);
    if (!o) return bao(res, 'KHONG_THAY_DON');
    const mon = await query(`SELECT product_name, quantity, unit_price, flash_unit_price, tier_unit_price, total_price, notes
      FROM pos_order_items WHERE order_id = ? ORDER BY id`, [o.id]);
    res.json({ success: true, don: { ...tomDon(o), mon: mon.map((d) => ({
      ten: d.product_name, so_luong: d.quantity, don_gia: d.flash_unit_price || d.tier_unit_price || d.unit_price,
      thanh_tien: d.total_price, ghi_chu: d.notes,
    })) } });
  } catch (err) {
    loiMayChu(res, err, 'kh chi tiet don');
  }
});

// E6 / E7: CÙNG hàm của /signup-codes/claim và /nhan-diem — thân dựng MỚI chỉ hai khoá, SĐT từ hàng CSDL của token.
// Q9: mỗi lần gọi giữ một lượt (trần chung hai đường theo SĐT + IP) TRƯỚC khi vào hàm; hết lượt → 429, hàm không chạy.
const quaToken = (req) => ({ body: { code: (req.body || {}).ma, phone: req.khach.phone }, khach: req.khach, user: { username: 'app_kh' } });
const nhanQuaToken = (ham, loai) => async (req, res) => {
  try {
    if (!(await giuLuotNhanMa(req.khach.phone, req.ip || '', loai))) return bao(res, 'QUA_NHIEU_LAN');
  } catch (err) {
    return loiMayChu(res, err, `kh ${loai}`);
  }
  return ham(quaToken(req), res);
};
router.post('/nhan-ma-bill', nhanQuaToken(nhanMaUuDai, 'nhan_ma_bill'));
router.post('/nhan-diem', nhanQuaToken(nhanDiemMaBill, 'nhan_diem'));

// P3 (Q6): khách đặt / đổi PIN của CHÍNH mình — SĐT từ token, mọi sdt / phone trong thân bị bỏ qua. Cùng datPin với quầy.
router.put('/pin', async (req, res) => {
  try {
    const b = req.body || {};
    const kq = await datPin(req.khach.phone, b.pin, b.pin_lai, { lanDau: false, viec: 'dat_app', nguoi: 'app_kh' });
    if (kq.loi) return res.status(kq.loi[0]).json({ error: kq.loi[2], code: kq.loi[1] });
    res.json({ success: true });
  } catch (err) {
    loiMayChu(res, err, 'kh pin');
  }
});

// G: đường lạ (đã qua token) → 404 có code, không rơi ra trang 404 mặc định.
router.use((req, res) => bao(res, 'KHONG_TIM_THAY'));

module.exports = router;
