/**
 * GIAO-1 — cửa giao hàng Ahamove. Nhân viên (JWT quầy): /api/pos/giao-hang/*. Ahamove báo về (công khai, chỉ tin header apikey = AHAMOVE_KHOA_BAO,
 * so bằng timingSafeEqual trên băm — không lộ độ dài): /api/giao-hang/ahamove-bao (`.webhook`). Quy tắc ở utils/giaoHang.js; file này chỉ nhận
 * yêu cầu, kiểm quyền và trả lời. Không câu trả nào chứa khoá / token Ahamove.
 */
const express = require('express');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const { loiGhi } = require('./wallets');
const gh = require('../utils/giaoHang');
const aha = require('../utils/ahamove');

const router = express.Router();
const webhook = express.Router();
const tra = (res, kq) => (kq.loi ? res.status(kq.loi.status).json(kq.loi.body) : res.json({ success: true, ...kq }));
const boc = (lam) => async (req, res) => { try { await lam(req, res); } catch (e) { loiGhi(res, e); } };
const chiQuanLy = (req, res, next) => (gh.laQuanLy(req.user) ? next()
  : res.status(403).json({ error: 'Chỉ quản lý hoặc chủ quán', code: 'PERMISSION_DENIED' }));

router.get('/cai-dat', authenticate, boc(async (req, res) => {
  res.json({ success: true, cai_dat: await gh.docCaiDat(), loai_xe: gh.LOAI_XE, ahamove: { da_cai: aha.daCai(), ban: aha.ban(), goi_y: aha.coGoiY() } });
}));
router.get('/dia-chi', authenticate, boc(async (req, res) => tra(res, await gh.goiY(req.query.q))));
router.post('/diem-lay', authenticate, chiQuanLy, boc(async (req, res) => tra(res, await gh.datDiemLay(req.body))));
router.post('/bao-phi', authenticate, boc(async (req, res) => tra(res, await gh.taoBaoPhi(req.body, req.user.username))));
router.get('/', authenticate, boc(async (req, res) => res.json({ success: true, chuyen: await gh.danhSach() })));
router.post('/:id/nhan', authenticate, boc(async (req, res) => tra(res, await gh.nhanDon(Number(req.params.id)))));
router.post('/:id/goi-xe', authenticate, boc(async (req, res) => tra(res, await gh.goiXe(Number(req.params.id), req.body?.loai_xe ?? null, req.body?.tu ?? null))));
router.post('/:id/huy-chuyen', authenticate, boc(async (req, res) => tra(res, await gh.huyChuyenGiao(Number(req.params.id), req.body?.ly_do, req.user))));
router.post('/:id/dong-the', authenticate, boc(async (req, res) => tra(res, await gh.dongThe(Number(req.params.id), req.body?.ly_do, req.user))));
router.post('/:id/in-tem', authenticate, boc(async (req, res) => tra(res, await gh.inTem(Number(req.params.id), req.body?.lai === true))));

const bam = (s) => crypto.createHash('sha256').update(String(s)).digest();
webhook.post('/', boc(async (req, res) => {
  const khoa = process.env.AHAMOVE_KHOA_BAO;
  if (!khoa) return res.status(503).json({ error: 'Chưa cài khoá tin báo Ahamove', code: 'BAO_CHUA_CAI' });
  const nhan = req.headers.apikey;
  if (typeof nhan !== 'string' || !crypto.timingSafeEqual(bam(nhan), bam(khoa))) return res.status(401).json({ error: 'Sai khoá', code: 'BAO_SAI_KHOA' });
  const kq = await gh.nhanTinBao(req.body);
  res.status(kq.status).json(kq.body);
}));

module.exports = router;
module.exports.webhook = webhook;
