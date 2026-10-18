/**
 * KH-API-1 (D) — route NHÂN VIÊN (token quầy), gắn ở /api/pos/kh. Route xác thực bằng token KHÁCH chỉ nằm ở /api/kh (index.js cùng thư mục).
 * POST /cap-ma { sdt } — thu ngân cấp mã đăng nhập App cho khách đứng ở quầy; mã quầy không bị giới hạn lượt xin (Q7).
 */
const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { canCauHinhKhach } = require('../../middleware/khachAuth');
const { chuanSdt, capMaQuay } = require('../../utils/maKhach');
const { bao, loiMayChu } = require('./loi');

const router = express.Router();

router.post('/cap-ma', authenticate, canCauHinhKhach, async (req, res) => {
  try {
    const sdt = chuanSdt((req.body || {}).sdt);
    if (!sdt) return bao(res, 'SDT_KHONG_HOP_LE');
    res.json({ success: true, ...(await capMaQuay(sdt, req.user.username, req.ip || '')) });
  } catch (err) {
    loiMayChu(res, err, 'cap-ma');
  }
});

module.exports = router;
