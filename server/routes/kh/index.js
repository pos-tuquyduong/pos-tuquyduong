/**
 * KH-API-1 — cổng App KH, gắn MỘT chỗ tại /api/kh (index.js máy chủ). Luật:
 * - Thiếu / sai cấu hình KH_JWT_SECRET → mọi đường 503 (canCauHinhKhach đứng đầu router).
 * - Ngoài hai đường đăng nhập, mọi đường cần token KHÁCH (xacThucKhach). SĐT LUÔN là req.khach.phone — sdt / phone /
 *   customer_phone trong tham số hay thân yêu cầu bị bỏ qua (F3).
 * - Tiền / điểm / voucher / mã bill đi qua ĐÚNG hàm quầy đang dùng (diemKhach.js, signup-codes.js, products.js).
 */
const express = require('express');
const { query, queryOne, run } = require('../../database');
const { canCauHinhKhach, xacThucKhach, kyTokenKhach } = require('../../middleware/khachAuth');
const { chuanSdt, chuanTen, xinMaGui, giuLuotNhanMa, xacMinhMa } = require('../../utils/maKhach');
const { layDiemKhach, layVoucherKhach, layMaKhachMoi } = require('../../utils/diemKhach');
const { getNow } = require('../../utils/helpers');
const { nhanMaUuDai, nhanDiemMaBill } = require('../signup-codes');
const { layMenuQuay } = require('../products');
const { bao, loiMayChu } = require('./loi');

const router = express.Router();
const SO_DON_MOI_TRANG = 20;

const hoSo = (kh) => ({ sdt: kh.phone, ten: kh.name, ngay_tao: kh.created_at });
const tomDon = (o) => ({
  ma: o.code, ngay: o.created_at, tong: o.total, da_tra: Number(o.total || 0) - Number(o.debt_amount || 0),
  trang_thai: o.status, thanh_toan: o.payment_status,
});
const COT_DON = 'id, code, created_at, total, debt_amount, status, payment_status';
// Danh sách TRẮNG trường món (E5) — không giá vốn, không số tồn thật. ton_cu + ton_luc: mất SX thì App hiện "theo số lúc …" (CLAUDE.md §5.8).
const monKhach = (p) => ({
  ma: p.unique_id, ten: p.name, nhom: p.category, gia: p.price,
  con_hang: p.khong_quan_kho ? true : typeof p.stock_quantity === 'number' ? p.stock_quantity > 0 : null,
  ton_cu: !!p.ton_cu, ton_luc: p.ton_luc || null,
});

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
    const kq = await xacMinhMa(sdt, String(b.ma ?? ''), b.ten);
    if (kq.loi) return bao(res, kq.loi);
    const kh = await queryOne('SELECT id, phone, name, created_at FROM pos_customers WHERE id = ?', [kq.khachId]);
    res.json({ success: true, token: kyTokenKhach(kh.id), khach: hoSo(kh) });
  } catch (err) {
    loiMayChu(res, err, 'kh xac-minh');
  }
});

// ── Từ đây: token khách bắt buộc ──────────────────────────────────────────
router.use(xacThucKhach);

router.get('/toi', (req, res) => res.json({ success: true, khach: hoSo(req.khach) }));

router.put('/toi', async (req, res) => {
  try {
    const ten = chuanTen((req.body || {}).ten);
    if (!ten) return bao(res, 'TEN_KHONG_HOP_LE');
    await run('UPDATE pos_customers SET name = ?, updated_at = ? WHERE id = ?', [ten, getNow(), req.khach.id]);
    res.json({ success: true, khach: hoSo({ ...req.khach, name: ten }) });
  } catch (err) {
    loiMayChu(res, err, 'kh sua ten');
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

router.get('/menu', async (req, res) => {
  try {
    const mon = await layMenuQuay();
    res.json({ success: true, data: mon.filter((p) => p.sellable).map(monKhach) });
  } catch (err) {
    loiMayChu(res, err, 'kh menu');
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

module.exports = router;
