/**
 * ND-API-1 (J, Q-D) — khoá sao lưu CHỈ ĐỌC cho tác vụ đêm của App KH: khoá chỉ gọi được GET /api/nd/xuat (xacThuc.canQuyen).
 * Gắn dưới /api/pos/nd-khoa-sao-luu (vé POS, CHỈ chủ quán, PIN chủ quán qua cầu nối — Q-H): thẻ Cài đặt "📱 App khách hàng" gọi.
 * Khoá hiện ĐÚNG MỘT lần trong câu trả lời tạo; máy chủ chỉ giữ băm SHA-256; thu hồi là có hiệu lực ngay.
 */
const express = require('express');
const cauNoi = require('./cauNoi');
const D = require('./duLieu');
const { laLoiBan } = require('../database');

const router = express.Router();
const chiChuQuan = (req, res, next) => (req.user.role === 'owner' ? next()
  : res.status(403).json({ error: 'Chỉ chủ quán tạo / thu hồi khoá sao lưu', code: 'CHI_CHU_QUAN' }));
/** PIN chủ quán — tạo khoá: gọi SAU khi kiểm tên (gõ sai tên không tốn lượt PIN); thu hồi: gọi trước khi tìm khoá (id sai vẫn tốn một lượt —
 *  chỉ chủ quán gọi được, chấp nhận). Sai → gửi lỗi, trả false. */
async function quaPin(req, res) {
  const p = await cauNoi.kiemPinChuQuan(req.body?.pin);
  if (!p.loi) return true;
  res.status(p.loi[0]).json({ error: p.loi[2], code: p.loi[1] });
  return false;
}
const lam = (fn) => async (req, res) => {
  try { await fn(req, res); } catch (e) {
    if (laLoiBan(e)) return res.status(409).json({ error: 'Máy chủ đang bận — bấm lại sau giây lát', code: 'KHO_BAN' });
    console.error('Khoá sao lưu nd:', e.message);
    return res.status(500).json({ error: 'Lỗi máy chủ — thử lại sau', code: 'LOI_MAY_CHU' });
  }
};

router.use(cauNoi.xacThucPos, chiChuQuan);

router.get('/', lam(async (req, res) => res.json({ success: true, data: await D.dsKhoa() })));

router.post('/', lam(async (req, res) => {
  const ten = typeof req.body?.ten === 'string' ? req.body.ten.trim() : '';
  if (!ten || ten.length > 60) return res.status(400).json({ error: 'Đặt tên cho khoá (1–60 ký tự), ví dụ "Sao lưu đêm GitHub"', code: 'DU_LIEU_KHONG_HOP_LE' });
  if (!(await quaPin(req, res))) return undefined;
  return res.json({ success: true, ...(await D.taoKhoa(ten, req.user.username)) });
}));

router.post('/:id/thu-hoi', lam(async (req, res) => {
  if (!(await quaPin(req, res))) return undefined;
  if (!(await D.thuHoiKhoa(Number(req.params.id)))) return res.status(404).json({ error: 'Không có khoá này, hoặc khoá đã thu hồi', code: 'KHONG_TIM_THAY' });
  return res.json({ success: true });
}));

module.exports = router;
