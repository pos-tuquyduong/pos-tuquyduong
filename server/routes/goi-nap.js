/**
 * NAP-1 — gói nạp tiền (Cài đặt sản phẩm). Gói = "khách trả X → vào tài khoản Y" (Y ≥ X; phần hơn là thưởng nạp, không hạn).
 * Quầy đọc gói đang bật (GET /); thêm / sửa / bật / tắt cần quyền manage_products. Không xoá cứng: đơn cũ trỏ tới gói — bớt gói = tắt.
 * Bán gói đi đúng đường tạo đơn của quầy (orders.js taoDon, thân có `goi_nap_id`) — giá do máy chủ tra từ bảng này.
 */
const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');
const { loiGhi } = require('./wallets');   // kho bận → 409 KHO_BAN, lỗi khác → 500 không lộ lời máy

const router = express.Router();
const TRUONG = 'id, ten, khach_tra, vao_tk, is_active, thu_tu';
const loi = (res, error) => res.status(400).json({ error, code: 'GOI_NAP_KHONG_HOP_LE' });
const soNguyen = (x) => typeof x === 'number' && Number.isInteger(x);

/** Kiểm một gói đủ trường (sau khi gộp phần sửa vào gói cũ). Trả lời lỗi hoặc null. */
function kiemGoi(g) {
  if (typeof g.ten !== 'string' || !g.ten.trim() || g.ten.trim().length > 60) return 'Tên gói không được trống (tối đa 60 ký tự)';
  if (!soNguyen(g.khach_tra) || g.khach_tra <= 0) return '"Khách trả" phải là số đồng nguyên lớn hơn 0';
  if (!soNguyen(g.vao_tk) || g.vao_tk < g.khach_tra) return '"Vào tài khoản" phải là số đồng nguyên, không nhỏ hơn "Khách trả"';
  if (!soNguyen(g.thu_tu)) return 'Thứ tự phải là số nguyên';
  return null;
}

router.get('/', authenticate, async (req, res) => {
  try {
    res.json(await query(`SELECT ${TRUONG} FROM pos_goi_nap WHERE is_active = 1 ORDER BY thu_tu, khach_tra, id`));
  } catch (err) {
    console.error('Gói nạp:', err);
    res.status(500).json({ error: 'Lỗi máy chủ', code: 'LOI_MAY_CHU' });
  }
});

router.get('/tat-ca', authenticate, checkPermission('manage_products'), async (req, res) => {
  try {
    res.json(await query(`SELECT ${TRUONG} FROM pos_goi_nap ORDER BY is_active DESC, thu_tu, khach_tra, id`));
  } catch (err) {
    console.error('Gói nạp:', err);
    res.status(500).json({ error: 'Lỗi máy chủ', code: 'LOI_MAY_CHU' });
  }
});

router.post('/', authenticate, checkPermission('manage_products'), async (req, res) => {
  try {
    const b = req.body || {};
    const g = { ten: b.ten, khach_tra: b.khach_tra, vao_tk: b.vao_tk, thu_tu: b.thu_tu ?? 0 };
    const sai = kiemGoi(g);
    if (sai) return loi(res, sai);
    const now = getNow();
    const r = await run(`INSERT INTO pos_goi_nap (ten, khach_tra, vao_tk, is_active, thu_tu, created_at, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [g.ten.trim(), g.khach_tra, g.vao_tk, b.is_active === 0 || b.is_active === false ? 0 : 1, g.thu_tu, now, now, req.user.username]);
    res.json({ success: true, data: await queryOne(`SELECT ${TRUONG} FROM pos_goi_nap WHERE id = ?`, [Number(r.lastInsertRowid)]) });
  } catch (err) {
    loiGhi(res, err);
  }
});

router.put('/:id', authenticate, checkPermission('manage_products'), async (req, res) => {
  try {
    const cu = await queryOne(`SELECT ${TRUONG} FROM pos_goi_nap WHERE id = ?`, [req.params.id]);
    if (!cu) return res.status(404).json({ error: 'Không có gói nạp này', code: 'GOI_NAP_KHONG_CO' });
    const b = req.body || {};
    const g = { ...cu, ...Object.fromEntries(['ten', 'khach_tra', 'vao_tk', 'thu_tu'].filter((x) => b[x] !== undefined).map((x) => [x, b[x]])) };
    const sai = kiemGoi(g);
    if (sai) return loi(res, sai);
    const bat = b.is_active === undefined ? cu.is_active : (b.is_active === 0 || b.is_active === false ? 0 : 1);
    await run(`UPDATE pos_goi_nap SET ten = ?, khach_tra = ?, vao_tk = ?, is_active = ?, thu_tu = ?, updated_at = ?, updated_by = ? WHERE id = ?`,
      [g.ten.trim(), g.khach_tra, g.vao_tk, bat, g.thu_tu, getNow(), req.user.username, cu.id]);
    res.json({ success: true, data: await queryOne(`SELECT ${TRUONG} FROM pos_goi_nap WHERE id = ?`, [cu.id]) });
  } catch (err) {
    loiGhi(res, err);
  }
});

module.exports = router;
