/**
 * P3 — phiên thanh toán ở quầy (JWT nhân viên) + webhook payOS (công khai, chỉ tin chữ ký).
 * Không đường nào cho nhân viên tự đánh dấu "đã thu chuyển khoản": phiên payos chỉ chốt bằng webhook đúng chữ ký, phiên payos / ck_tay
 * chốt tay CHỈ qua xac-nhan-tay (quyền xac_nhan_ck_tay, có lý do). Mọi lối chốt đi qua MỘT chotPhien (utils/giuCho.js).
 */
const express = require('express');
const { queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');
const { loiGhi } = require('./wallets');
const { taoPhien, chotPhien, tomPhien } = require('../utils/giuCho');
const { datPin, xoaPin } = require('../utils/pinKhach');
const payos = require('../utils/payos');

const router = express.Router();
const webhook = express.Router();
const tra = (res, kq) => res.status(kq.status).json(kq.body);
const loi = (res, status, code, error) => res.status(status).json({ error, code });
const lyDoHopLe = (x) => typeof x === 'string' && x.trim().length >= 3;
const docPhien = (id) => queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [id]);

router.post('/phien', authenticate, async (req, res) => {
  try {
    tra(res, await taoPhien(req.body || {}, req.user.username));
  } catch (err) {
    loiGhi(res, err);
  }
});

router.get('/phien/:id', authenticate, async (req, res) => {
  try {
    const p = await docPhien(req.params.id);
    if (!p) return loi(res, 404, 'KHONG_THAY_PHIEN', 'Không tìm thấy phiên thanh toán');
    const o = p.order_id ? await queryOne('SELECT id, code FROM pos_orders WHERE id = ?', [p.order_id]) : null;
    res.json({ success: true, phien: tomPhien(p, o) });
  } catch (err) {
    loiGhi(res, err);
  }
});

// Quầy chốt phiên tiền mặt (đủ tiền khách đưa) hoặc phiên trả đủ bằng tài khoản. Phiên payos / ck_tay KHÔNG chốt ở đây.
router.post('/phien/:id/chot', authenticate, async (req, res) => {
  try {
    const p = await docPhien(req.params.id);
    if (!p) return loi(res, 404, 'KHONG_THAY_PHIEN', 'Không tìm thấy phiên thanh toán');
    if (p.cach !== 'tien_mat' && p.cach !== 'tai_khoan') {
      return loi(res, 400, 'PHIEN_KHONG_CHOT_TAY', 'Phiên chuyển khoản chỉ chốt khi tiền về (hoặc chủ quán / quản lý xác nhận tay)');
    }
    const khachDua = (req.body || {}).cash_received;
    if (p.cach === 'tien_mat' && khachDua != null && !(Number(khachDua) >= p.con_lai)) {
      return loi(res, 400, 'TIEN_KHACH_DUA_THIEU', 'Tiền khách đưa chưa đủ');
    }
    tra(res, await chotPhien(p, p.cach, { khachDua, nguoi: req.user.username }));
  } catch (err) {
    loiGhi(res, err);
  }
});

router.post('/phien/:id/huy', authenticate, async (req, res) => {
  try {
    const r = await run("UPDATE pos_phien_thanh_toan SET trang_thai = 'huy', luc_chot = ? WHERE id = ? AND trang_thai = 'cho'", [getNow(), req.params.id]);
    if (r.changes !== 1) return loi(res, 409, 'PHIEN_DA_CHOT', 'Phiên đã chốt hoặc đã huỷ');
    res.json({ success: true });
  } catch (err) {
    loiGhi(res, err);
  }
});

router.post('/phien/:id/xac-nhan-tay', authenticate, checkPermission('xac_nhan_ck_tay'), async (req, res) => {
  try {
    const lyDo = (req.body || {}).ly_do;
    if (!lyDoHopLe(lyDo)) return loi(res, 400, 'CAN_LY_DO', 'Nhập lý do xác nhận tay (tối thiểu 3 ký tự)');
    const p = await docPhien(req.params.id);
    if (!p) return loi(res, 404, 'KHONG_THAY_PHIEN', 'Không tìm thấy phiên thanh toán');
    if (p.cach !== 'payos' && p.cach !== 'ck_tay') return loi(res, 400, 'PHIEN_KHONG_PHAI_CK', 'Chỉ xác nhận tay phiên chuyển khoản');
    tra(res, await chotPhien(p, 'tay', { nguoi: req.user.username, lyDo: lyDo.trim() }));
  } catch (err) {
    loiGhi(res, err);
  }
});

// PIN ở quầy: CHỈ đặt lần đầu (khách gõ 2 lần). Đổi PIN ở App KH; quên PIN → xoá (owner / manager) rồi đặt lại.
router.post('/pin', authenticate, async (req, res) => {
  try {
    const b = req.body || {};
    const kq = await datPin(b.phone, b.pin, b.pin_lai, { lanDau: true, viec: 'dat_quay', nguoi: req.user.username });
    if (kq.loi) return loi(res, ...kq.loi);
    res.json({ success: true });
  } catch (err) {
    loiGhi(res, err);
  }
});

router.post('/pin/xoa', authenticate, checkPermission('xoa_pin_khach'), async (req, res) => {
  try {
    const b = req.body || {};
    if (!lyDoHopLe(b.ly_do)) return loi(res, 400, 'CAN_LY_DO', 'Nhập lý do xoá PIN (tối thiểu 3 ký tự)');
    const kq = await xoaPin(b.phone, b.ly_do.trim(), req.user.username);
    if (kq.loi) return loi(res, ...kq.loi);
    res.json({ success: true });
  } catch (err) {
    loiGhi(res, err);
  }
});

// ── Webhook payOS (công khai) ───────────────────────────────────────────────
// Sai chữ ký → 400, không ghi gì. Đúng chữ ký → MỖI báo một dòng pos_payos_su_kien (khoa UNIQUE: báo lặp dừng ở đó) và trả 200 để payOS
// thôi gửi lại — trừ khi máy chủ lỗi giữa chừng (5xx, chưa ghi gì) thì để payOS báo lại.
const DANG_GIO = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/;
webhook.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    if (!payos.kiemChuKy(b.data, b.signature)) return loi(res, 400, 'CHU_KY_SAI', 'Chữ ký không hợp lệ');
    const d = b.data;
    const khoa = `${d.orderCode}:${d.reference ?? ''}`;
    const cauGhi = `INSERT INTO pos_payos_su_kien (khoa, ma_payos, so_tien, ket_qua, ly_do, du_lieu, luc) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(khoa) DO NOTHING`;
    const thamSo = (ketQua, lyDo) => [khoa, Number(d.orderCode) || null, Number(d.amount) || 0, ketQua, lyDo, JSON.stringify(d), getNow()];
    const ghi = (ketQua, lyDo) => run(cauGhi, thamSo(ketQua, lyDo));
    const p = await queryOne("SELECT * FROM pos_phien_thanh_toan WHERE ma_payos = ? AND cach = 'payos'", [Number(d.orderCode)]);
    if (!p) { await ghi('khong_phien', 'Mã đơn payOS không thuộc phiên nào'); return res.json({ success: true }); }
    if (b.code !== '00' || d.code !== '00') { await ghi('that_bai', `payOS báo ${d.code}`); return res.json({ success: true }); }
    const luc = DANG_GIO.test(String(d.transactionDateTime || '')) ? String(d.transactionDateTime).replace(' ', 'T') : getNow();
    const lyDo = Number(d.amount) !== p.con_lai ? `lệch tiền: về ${d.amount}, phải thu ${p.con_lai}`
      : luc > p.het_han ? 'tiền về sau khi QR hết hạn' : null;
    if (lyDo) { await ghi('chua_khop', lyDo); return res.json({ success: true }); }
    const kq = await chotPhien(p, 'payos', { suKien: (tx) => tx.run(cauGhi, thamSo('khop', null)) });
    if (kq.status === 200) return res.json({ success: true });
    if (kq.status >= 500 || kq.body?.code === 'KHO_BAN') return tra(res, kq);
    await ghi('chua_khop', kq.body?.code === 'PHIEN_DA_CHOT' ? 'phiên đã chốt / hết hạn lúc tiền về' : `không tạo được đơn: ${kq.body?.code || kq.body?.error}`);
    res.json({ success: true });
  } catch (err) {
    loiGhi(res, err);
  }
});

module.exports = router;
module.exports.webhook = webhook;
