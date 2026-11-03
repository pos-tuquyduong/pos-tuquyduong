/**
 * KH-SDT-1 — /api/pos/don-thu: dọn dữ liệu thử trước khai trương. CHỈ chủ quán (role owner, như sao lưu). Quy tắc ở utils/donThu.js.
 *   POST /liet-ke  { truoc_ngay?, sdt?: [] }                                → danh sách sẽ dọn + giữ lại + ma_xac_nhan (không ghi gì)
 *   POST /don      { truoc_ngay?, sdt?, ma_xac_nhan, go_xac_nhan }          → dọn một giao dịch, trả bản chụp nguyên dòng
 */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { lietKe, donDuLieuThu } = require('../utils/donThu');

const router = express.Router();
router.use(authenticate, (req, res, next) => (req.user.role === 'owner' ? next()
  : res.status(403).json({ error: 'Chỉ chủ quán được dọn dữ liệu thử', code: 'CHI_CHU_QUAN' })));

const tra = (viec, ten) => async (req, res) => {
  try {
    const kq = await viec(req.body || {}, req.user.username);
    if (kq.loi) return res.status(kq.loi.status).json({ error: kq.loi.error, code: kq.loi.code });
    res.json(kq);
  } catch (err) {
    console.error(`[don-thu] ${ten} lỗi:`, err.message);
    res.status(500).json({ error: `Lỗi máy chủ khi ${ten} — chưa dọn gì`, code: 'LOI_MAY_CHU' });
  }
};
router.post('/liet-ke', tra(lietKe, 'liệt kê'));
router.post('/don', tra(donDuLieuThu, 'dọn'));

module.exports = router;
