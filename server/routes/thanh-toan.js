/**
 * P3 — phiên thanh toán ở quầy (JWT nhân viên) + webhook payOS / SePay (công khai, chỉ tin chữ ký — SEPAY-1).
 * Không đường nào cho nhân viên tự đánh dấu "đã thu chuyển khoản": phiên payos (QR tự xác nhận: payOS hoặc SePay) chỉ chốt bằng webhook đúng chữ ký, phiên payos / ck_tay
 * chốt tay CHỈ qua xac-nhan-tay (quyền xac_nhan_ck_tay, có lý do). Mọi lối chốt đi qua MỘT chotPhien (utils/giuCho.js).
 */
const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow, chuoiSoHd } = require('../utils/helpers');
const { loiGhi, ghiVi, trongGiaoDich } = require('./wallets');
const { taoPhien, chotPhien, tomPhien } = require('../utils/giuCho');
const { datPin, xoaPin } = require('../utils/pinKhach');
const payos = require('../utils/payos');
const sepay = require('../utils/sepay');
const { LY_DO_HAI_CONG, LY_DO_TK_KHAC, LY_DO_VAO_VI, congCuaKhoa } = require('../utils/congQr');

const router = express.Router();
const webhook = express.Router();
const tra = (res, kq) => res.status(kq.status).json(kq.body);
const loi = (res, status, code, error) => res.status(status).json({ error, code });
const LY_DO_TOI_THIEU = 3;   // ký tự — cùng mức với điều chỉnh số dư (wallets.js /adjust)
const lyDoHopLe = (x) => typeof x === 'string' && x.trim().length >= LY_DO_TOI_THIEU;
const docPhien = (id) => queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [id]);
// Phiên của đơn App (KH-MUA-1 nối qua pos_don_app.phien_id) — App KHÔNG tạo lại đơn khi tiền về muộn (chủ quán Q1b 05.11).
const laPhienApp = async (id) => !!(await queryOne('SELECT 1 AS co FROM pos_don_app WHERE phien_id = ?', [id]));
const soHdCuaPhien = async (id) => {
  const s = await queryOne('SELECT kenh, so FROM pos_so_hoa_don WHERE phien_id = ?', [id]);
  return s ? chuoiSoHd(s) : `phiên #${id}`;
};

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
    // Q1a (chủ quán 05.11): tiền về sau khi QR hết hạn / đã huỷ → phiên QUẦY xác nhận tay được (đơn nhận lại số đã giữ); phiên App thì không.
    const muon = !p.order_id && (p.trang_thai === 'huy' || (p.trang_thai === 'cho' && p.het_han <= getNow()));
    if (muon && await laPhienApp(p.id)) {
      return loi(res, 409, 'PHIEN_APP_KHONG_TAO_LAI', 'Đơn App đã huỷ / hết hạn — không tạo lại đơn; tiền về muộn tự cộng vào tài khoản khách');
    }
    tra(res, await chotPhien(p, 'tay', { nguoi: req.user.username, lyDo: lyDo.trim(), muon }));
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

/** t: { khoa, noiDung (nội dung số hoá đơn đã chuẩn hoá — SePay) | ma (mã phiên | null), soTien, luc (giờ VN của giao dịch), maGd (mã giao dịch
 *  ngân hàng), duLieu, nguon ('payos' | 'sepay'), boQua (lý do ghi khong_phien ngay), khongPhien (lý do khi mã không thuộc phiên),
 *  thatBai (lý do ghi that_bai), tkKhac (số tài khoản nhận sai — chỉ SePay) }. */
async function xuLyTienVe(res, t) {
  const p = t.boQua ? null
    : t.noiDung ? await queryOne("SELECT * FROM pos_phien_thanh_toan WHERE noi_dung = ? AND cach = 'payos' ORDER BY id DESC LIMIT 1", [t.noiDung])
      : t.ma ? await queryOne("SELECT * FROM pos_phien_thanh_toan WHERE ma_payos = ? AND cach = 'payos'", [t.ma]) : null;
  if (p) t.ma = p.ma_payos;   // cột pos_payos_su_kien.ma_payos giữ nghĩa cũ (= mã phiên) cho daBao, đơn App, Đối soát
  const thamSo = (ketQua, lyDo) => [t.khoa, t.ma, t.soTien, ketQua, lyDo, JSON.stringify(t.duLieu), getNow()];
  const ghi = async (ketQua, lyDo) => { await run(CAU_GHI, thamSo(ketQua, lyDo)); res.json({ success: true }); };
  if (!p) return ghi('khong_phien', t.boQua || t.khongPhien);
  if (t.tkKhac) return ghi('chua_khop', `${LY_DO_TK_KHAC} ${t.tkKhac}`);
  if (t.thatBai) return ghi('that_bai', t.thatBai);
  const luc = DANG_GIO.test(String(t.luc || '')) ? String(t.luc).replace(' ', 'T') : getNow();
  // Q1b + chủ quán 05.11 lượt 2: phiên App đã huỷ / hết hạn, HOẶC 'loi' (không tạo được đơn — vd hết hàng lúc tiền về đúng hạn), tiền về →
  // KHÔNG tạo đơn; số tiền thật đã về cộng vào tài khoản khách của phiên. MỘT vị từ (vaoViDuoc), MỘT hàm ghi (vaoVi): dòng báo + dòng ví cùng
  // MỘT giao dịch, chỉ cộng khi dòng báo mới được ghi (changes 1) — báo lặp / hai báo cùng lúc cộng đúng một lần. Phiên QUẦY không vào đây.
  const laApp = !!p.phone && t.soTien > 0 && await laPhienApp(p.id);
  const vaoViDuoc = (x) => ['huy', 'loi'].includes(x.trang_thai) || (x.trang_thai === 'cho' && (luc > x.het_han || x.het_han <= getNow()));
  const vaoVi = async (x) => {
    const soHd = await soHdCuaPhien(x.id), maGd = t.maGd || '—';
    const dau = x.trang_thai === 'loi' ? `không tạo được đơn (${x.ly_do || 'lỗi'})` : 'tiền về muộn';
    await trongGiaoDich(async (tx) => {
      // "Hai cổng" (soát vòng 1): một khoản báo qua CẢ payOS lẫn SePay mang hai khoá khác nhau. Cổng này báo phiên ÍT lần hơn số lần cổng KIA đã
      // cộng ví → đây là bản sao của khoản đã cộng: ghi chua_khop + LY_DO_HAI_CONG (CẦN XEM), KHÔNG cộng lần hai. Đọc trong giao dịch ghi — hai báo
      // tới cùng lúc thì báo sau thấy dòng của báo trước. Báo NHIỀU hơn = khách chuyển thêm thật → cộng như thường.
      const da = await tx.query('SELECT khoa, ket_qua FROM pos_payos_su_kien WHERE ma_payos = ? AND khoa <> ?', [t.ma, t.khoa]);
      const nay = da.filter((d) => congCuaKhoa(d.khoa) === t.nguon).length;
      if (nay < da.filter((d) => d.ket_qua === 'vao_vi' && congCuaKhoa(d.khoa) !== t.nguon).length) {
        await tx.run(CAU_GHI, thamSo('chua_khop', `${dau} — ${LY_DO_HAI_CONG} (đã cộng vào tài khoản ${x.phone} qua báo cổng kia, ${soHd}) · mã GD ${maGd}: đối chiếu sao kê, KHÔNG cộng lần hai`));
        return;
      }
      const ins = await tx.run(CAU_GHI, thamSo('vao_vi', `${dau} — ${LY_DO_VAO_VI} ${x.phone} (${soHd}) · mã GD ${maGd}`));
      if (ins.changes !== 1) return;
      await ghiVi(tx, { phone: x.phone, loai: 'topup', soTien: t.soTien, cachTra: 'transfer', nguoi: t.nguon, luc: getNow(), cot: 'total_topup', soCot: t.soTien,
        ghiChu: (x.trang_thai === 'loi' ? `Không tạo được đơn ${soHd} (${x.ly_do || 'lỗi'})` : `Tiền về muộn ${soHd} (đơn App đã huỷ / hết hạn)`) + ` · mã GD ${maGd}` });
    });
    return res.json({ success: true });
  };
  if (laApp && vaoViDuoc(p)) return vaoVi(p);
  const lyDo = t.soTien !== p.con_lai ? `lệch tiền: về ${t.soTien}, phải thu ${p.con_lai}`
    : luc > p.het_han ? 'tiền về sau khi QR hết hạn' : null;
  if (lyDo) return ghi('chua_khop', lyDo);
  const kq = await chotPhien(p, t.nguon, { maGd: t.maGd, suKien: (tx) => tx.run(CAU_GHI, thamSo('khop', null)) });
  if (kq.status === 200) return res.json({ success: true });
  if (kq.status >= 500 || kq.body?.code === 'KHO_BAN') return tra(res, kq);
  // Chốt hỏng: chotPhien vừa đổi phiên App sang 'loi' (đơn hỏng), hoặc phiên vừa bị huỷ / hết hạn giữa chừng → đọc lại, cùng vị từ, vào ví.
  const moi = laApp ? await docPhien(p.id) : null;
  if (moi && vaoViDuoc(moi)) return vaoVi(moi);
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
      luc: d.transactionDateTime, maGd: String(d.reference ?? '').trim() || null, duLieu: d, nguon: 'payos', khongPhien: 'Mã đơn payOS không thuộc phiên nào',
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
      boQua: !d.vao ? 'SePay báo tiền ra' : !d.noiDung && !d.ma ? 'không có mã TQD trong nội dung' : null,
      khongPhien: `mã ${d.noiDung || 'TQD' + d.ma} không thuộc phiên nào` });
  } catch (err) {
    loiGhi(res, err);
  }
});

module.exports = router;
module.exports.webhook = webhook;
module.exports.webhookSepay = webhookSepay;
