/**
 * P3 — phiên thanh toán ở quầy (JWT nhân viên) + webhook payOS / SePay (công khai, chỉ tin chữ ký — SEPAY-1).
 * Không đường nào cho nhân viên tự đánh dấu "đã thu chuyển khoản": phiên payos (QR tự xác nhận: payOS hoặc SePay) chỉ chốt bằng webhook đúng chữ ký, phiên payos / ck_tay
 * chốt tay CHỈ qua xac-nhan-tay (quyền xac_nhan_ck_tay, có lý do). Mọi lối chốt đi qua MỘT chotPhien (utils/giuCho.js).
 */
const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');
const { loiGhi } = require('./wallets');
const { taoPhien, chotPhien, tomPhien } = require('../utils/giuCho');
const { datPin, xoaPin } = require('../utils/pinKhach');
const payos = require('../utils/payos');
const sepay = require('../utils/sepay');
const { LY_DO_HAI_CONG, LY_DO_TK_KHAC, congCuaKhoa } = require('../utils/congQr');

const router = express.Router();
const webhook = express.Router();
const tra = (res, kq) => res.status(kq.status).json(kq.body);
const loi = (res, status, code, error) => res.status(status).json({ error, code });
const LY_DO_TOI_THIEU = 3;   // ký tự — cùng mức với điều chỉnh số dư (wallets.js /adjust)
const lyDoHopLe = (x) => typeof x === 'string' && x.trim().length >= LY_DO_TOI_THIEU;
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
    if (!lyDoHopLe(lyDo)) return loi(res, 400, 'CAN_LY_DO', `Nhập lý do xác nhận tay (tối thiểu ${LY_DO_TOI_THIEU} ký tự)`);
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
    if (!lyDoHopLe(b.ly_do)) return loi(res, 400, 'CAN_LY_DO', `Nhập lý do xoá PIN (tối thiểu ${LY_DO_TOI_THIEU} ký tự)`);
    const kq = await xoaPin(b.phone, b.ly_do.trim(), req.user.username);
    if (kq.loi) return loi(res, ...kq.loi);
    res.json({ success: true });
  } catch (err) {
    loiGhi(res, err);
  }
});

// ── Webhook tiền về: payOS + SePay (công khai, chỉ tin chữ ký) ─────────────
// Sai chữ ký → 4xx, không ghi gì. Đúng chữ ký → MỖI báo một dòng pos_payos_su_kien (khoa UNIQUE: báo lặp dừng ở đó) và trả 200
// {"success": true} (cả hai cổng coi là đã nhận, thôi gửi lại) — trừ khi máy chủ lỗi giữa chừng (5xx) hoặc kho bận (409 KHO_BAN): chưa ghi gì,
// để cổng báo lại. MỘT hàm xuLyTienVe cho cả hai cổng (SEPAY-1): khoá, khớp phiên, chua_khop, chốt.
const DANG_GIO = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/;
const CAU_GHI = `INSERT INTO pos_payos_su_kien (khoa, ma_payos, so_tien, ket_qua, ly_do, du_lieu, luc) VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(khoa) DO NOTHING`;
const TEN_CONG = { payos: 'payOS', sepay: 'SePay' };

/** t: { khoa, ma (mã phiên | null), soTien, luc (giờ VN của giao dịch), duLieu, nguon ('payos' | 'sepay'), boQua (lý do ghi khong_phien ngay),
 *  khongPhien (lý do khi mã không thuộc phiên), thatBai (lý do ghi that_bai), tkKhac (số tài khoản nhận sai — chỉ SePay) }. */
async function xuLyTienVe(res, t) {
  const thamSo = (ketQua, lyDo) => [t.khoa, t.ma, t.soTien, ketQua, lyDo, JSON.stringify(t.duLieu), getNow()];
  const ghi = async (ketQua, lyDo) => { await run(CAU_GHI, thamSo(ketQua, lyDo)); res.json({ success: true }); };
  const p = !t.boQua && t.ma ? await queryOne("SELECT * FROM pos_phien_thanh_toan WHERE ma_payos = ? AND cach = 'payos'", [t.ma]) : null;
  if (!p) return ghi('khong_phien', t.boQua || t.khongPhien);
  if (t.tkKhac) return ghi('chua_khop', `${LY_DO_TK_KHAC} ${t.tkKhac}`);
  if (t.thatBai) return ghi('that_bai', t.thatBai);
  const luc = DANG_GIO.test(String(t.luc || '')) ? String(t.luc).replace(' ', 'T') : getNow();
  const lyDo = t.soTien !== p.con_lai ? `lệch tiền: về ${t.soTien}, phải thu ${p.con_lai}`
    : luc > p.het_han ? 'tiền về sau khi QR hết hạn' : null;
  if (lyDo) return ghi('chua_khop', lyDo);
  const kq = await chotPhien(p, t.nguon, { suKien: (tx) => tx.run(CAU_GHI, thamSo('khop', null)) });
  if (kq.status === 200) return res.json({ success: true });
  if (kq.status >= 500 || kq.body?.code === 'KHO_BAN') return tra(res, kq);
  const sau = kq.body?.code === 'PHIEN_DA_CHOT' ? await queryOne('SELECT trang_thai, nguon, nguoi_xac_nhan, order_id FROM pos_phien_thanh_toan WHERE id = ?', [p.id]) : null;
  // "Hai cổng" chỉ khi phiên do CỔNG KIA chốt và cổng này CHƯA báo gì cho phiên — cổng này báo lần nữa là khách chuyển thêm thật (phải hoàn).
  const daBao = sau ? (await query('SELECT khoa FROM pos_payos_su_kien WHERE ma_payos = ?', [t.ma])).some((x) => congCuaKhoa(x.khoa) === t.nguon) : false;
  return ghi('chua_khop', !sau ? `không tạo được đơn: ${kq.body?.code || kq.body?.error}`
    : sau.nguon === 'tay' ? `đã xác nhận tay trước (${sau.nguoi_xac_nhan}, đơn #${sau.order_id}) — tiền về đúng số: đối chiếu, KHÔNG hoàn`
      : sau.trang_thai === 'da_thu' && TEN_CONG[sau.nguon] && sau.nguon !== t.nguon && !daBao
        ? `đã chốt bằng báo ${TEN_CONG[sau.nguon]} (đơn #${sau.order_id}) — ${LY_DO_HAI_CONG}: đối chiếu sao kê, KHÔNG hoàn`
        : `phiên đang ${sau.trang_thai} lúc tiền về`);
}

webhook.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    if (!payos.kiemChuKy(b.data, b.signature)) return loi(res, 400, 'CHU_KY_SAI', 'Chữ ký không hợp lệ');
    const d = b.data;
    await xuLyTienVe(res, { khoa: `${d.orderCode}:${d.reference ?? ''}`, ma: Number(d.orderCode) || null, soTien: Number(d.amount) || 0,
      luc: d.transactionDateTime, duLieu: d, nguon: 'payos', khongPhien: 'Mã đơn payOS không thuộc phiên nào',
      thatBai: b.code !== '00' || d.code !== '00' ? `payOS báo ${d.code}` : null });
  } catch (err) {
    loiGhi(res, err);
  }
});

// SePay: thân THÔ (index.js gắn express.raw cho riêng đường này trước express.json) — chữ ký tính trên đúng từng byte gửi tới.
const webhookSepay = express.Router();
webhookSepay.post('/', async (req, res) => {
  try {
    if (!sepay.kiemBao(req.headers, req.body)) return res.status(401).json({ success: false, error: 'Chữ ký không hợp lệ', code: 'CHU_KY_SAI' });
    let b;
    try { b = JSON.parse(req.body.toString('utf8')); } catch { b = null; }
    if (!b || typeof b !== 'object' || b.id == null) return res.status(400).json({ success: false, error: 'Thân báo không hợp lệ', code: 'BAO_KHONG_HOP_LE' });
    const d = sepay.docBao(b);
    await xuLyTienVe(res, { ...d, duLieu: { ...b, accumulated: undefined }, nguon: 'sepay',   // không lưu số dư tài khoản quán
      boQua: !d.vao ? 'SePay báo tiền ra' : !d.ma ? 'không có mã TQD trong nội dung' : null,
      khongPhien: `mã TQD${d.ma} không thuộc phiên nào` });
  } catch (err) {
    loiGhi(res, err);
  }
});

module.exports = router;
module.exports.webhook = webhook;
module.exports.webhookSepay = webhookSepay;
