/**
 * MANKHACH-1 — màn khách. Ba cổng, không route nào "tạm mở":
 *   · nhân viên (JWT quầy): /quay/* · /may (xem / thu hồi cần quyền manage_settings)
 *   · màn khách (khoá riêng X-Man-Khach-Khoa, chỉ đọc quầy đã ghép): /trang-thai · /noi-dung
 *   · công khai duy nhất: POST /ghep (nhập mã ghép; giới hạn lần sai theo IP)
 * Chỉ HIỂN THỊ — không ghi tiền / đơn / phiên. Quy tắc nằm ở utils/manKhach.js.
 */
const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const mk = require('../utils/manKhach');

const router = express.Router();
const loiRa = (res, l) => res.status(l.status).json({ error: l.error, code: l.code });
const bao = (fn) => async (req, res) => {
  try {
    const kq = await fn(req, res);
    if (kq?.loi) return loiRa(res, kq.loi);
    return res.json({ success: true, ...kq });
  } catch (err) {
    console.error('Màn khách lỗi:', err.message);
    return res.status(500).json({ error: 'Lỗi máy chủ', code: 'LOI_MAY_CHU' });
  }
};

async function canKhoaMan(req, res, next) {
  try {
    const kq = await mk.xacThucKhoa(req.get('X-Man-Khach-Khoa'));
    if (kq.loi) return loiRa(res, kq.loi);
    req.manKhach = kq.may;
    return next();
  } catch (err) {
    console.error('Màn khách lỗi:', err.message);
    return res.status(500).json({ error: 'Lỗi máy chủ', code: 'LOI_MAY_CHU' });
  }
}

// ── Quầy (nhân viên) ──
router.post('/quay/mo', authenticate, bao((req) => mk.moQuay(req.body?.quay_id)));
router.post('/quay/doi-ma', authenticate, bao((req) => mk.doiMa(req.body?.quay_id)));
router.post('/quay/phien', authenticate, bao((req) => mk.baoPhien(req.body?.quay_id, req.body?.phien_id, req.user.username)));

// ── Chủ quán / quản lý: danh sách máy + thu hồi ──
router.get('/may', authenticate, checkPermission('manage_settings'), bao(async () => ({ may: await mk.danhSachMay() })));
router.post('/may/:id/thu-hoi', authenticate, checkPermission('manage_settings'), bao((req) => mk.thuHoiMay(req.params.id, req.user.username)));

// ── Màn khách ──
router.post('/ghep', bao(async (req) => mk.ghep(req.body?.ma, req.body?.ten, req.ip)));
router.get('/trang-thai', canKhoaMan, bao((req) => mk.trangThai(req.manKhach.quay_id)));
router.get('/noi-dung', canKhoaMan, bao(() => mk.noiDung()));

module.exports = router;
