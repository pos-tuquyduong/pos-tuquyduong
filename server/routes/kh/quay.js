/**
 * KH-API-1 (D) — route NHÂN VIÊN (token quầy), gắn ở /api/pos/kh. Route xác thực bằng token KHÁCH chỉ nằm ở /api/kh (index.js cùng thư mục).
 * POST /cap-ma { sdt } — thu ngân cấp mã đăng nhập App cho khách đứng ở quầy; mã quầy không bị giới hạn lượt xin (Q7).
 * KH-MUA-1: GET /don-app — đơn App đã trả (mọi nhân viên); POST /don-app/:id/dang-lam | /xong — đổi tiến trình, ghi người + giờ.
 *   Không gắn canCauHinhKhach: chưa cài khoá ký token khách thì quầy vẫn xem đơn App.
 */
const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { canCauHinhKhach } = require('../../middleware/khachAuth');
const { chuanSdt, capMaQuay } = require('../../utils/maKhach');
const { bao, loiMayChu } = require('./loi');
const { dsQuay, doiTienTrinh } = require('../../utils/donApp');

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

router.get('/don-app', authenticate, async (req, res) => {
  try {
    res.json({ success: true, data: await dsQuay() });
  } catch (err) {
    loiMayChu(res, err, 'don-app');
  }
});

const doiBuoc = (buoc) => async (req, res) => {
  try {
    if (!(await doiTienTrinh(Number(req.params.id), buoc, req.user.username))) {
      return res.status(409).json({ error: 'Đơn đã đổi tiến trình hoặc chưa trả tiền — tải lại danh sách', code: 'DA_DOI_TIEN_TRINH' });
    }
    res.json({ success: true });
  } catch (err) {
    loiMayChu(res, err, 'don-app tien-trinh');
  }
};
router.post('/don-app/:id/dang-lam', authenticate, doiBuoc('dang_lam'));
router.post('/don-app/:id/xong', authenticate, doiBuoc('xong'));

module.exports = router;
