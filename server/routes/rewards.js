/**
 * POS System - Reward Catalog Routes (LOY-2a)
 * Kho quà đổi điểm — CRUD danh mục phần thưởng.
 * INERT: không đụng luồng bán/tiền. Đổi điểm thật (trừ điểm + đẻ voucher) là LOY-2b.
 *
 * TURSO: mọi database call dùng await.
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');

const router = express.Router();

// GET /api/pos/rewards  (?active=1 → chỉ lấy quà đang bật)
router.get('/', authenticate, async (req, res) => {
  try {
    const onlyActive = req.query.active === '1';
    const rows = await query(
      `SELECT * FROM pos_reward_catalog ${onlyActive ? 'WHERE is_active = 1' : ''} ORDER BY points_cost ASC, id ASC`,
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pos/rewards  (tạo quà)
router.post('/', authenticate, checkPermission('manage_promotions'), async (req, res) => {
  try {
    const { name, points_cost, discount_type, discount_value, max_discount, valid_days } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Vui lòng nhập tên quà' });
    const cost = parseInt(points_cost, 10);
    if (!Number.isFinite(cost) || cost < 1) return res.status(400).json({ error: 'Giá điểm phải ≥ 1' });
    const type = discount_type === 'percent' ? 'percent' : 'fixed';
    const value = Number(discount_value);
    if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'Trị giá giảm phải > 0' });
    if (type === 'percent' && value > 100) return res.status(400).json({ error: 'Phần trăm không vượt 100' });
    const days = parseInt(valid_days, 10);
    const validDays = (Number.isFinite(days) && days >= 1) ? days : 30;

    const result = await run(
      `INSERT INTO pos_reward_catalog (
        name, points_cost, discount_type, discount_value, max_discount, valid_days, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [name.trim(), cost, type, value, Number(max_discount) || 0, validDays, req.user.username, getNow()],
    );
    res.json({ success: true, id: Number(result.lastInsertRowid), message: 'Đã thêm quà' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/pos/rewards/:id  (cập nhật / bật-tắt)
router.put('/:id', authenticate, checkPermission('manage_promotions'), async (req, res) => {
  try {
    const existing = await queryOne('SELECT * FROM pos_reward_catalog WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy quà' });
    const b = req.body || {};
    const name = (b.name != null && String(b.name).trim()) ? String(b.name).trim() : existing.name;
    const cost = b.points_cost != null ? parseInt(b.points_cost, 10) : existing.points_cost;
    const type = b.discount_type != null ? (b.discount_type === 'percent' ? 'percent' : 'fixed') : existing.discount_type;
    const value = b.discount_value != null ? Number(b.discount_value) : existing.discount_value;
    const maxD = b.max_discount != null ? (Number(b.max_discount) || 0) : existing.max_discount;
    const daysRaw = b.valid_days != null ? parseInt(b.valid_days, 10) : existing.valid_days;
    const days = (Number.isFinite(daysRaw) && daysRaw >= 1) ? daysRaw : existing.valid_days;
    const active = b.is_active != null ? (b.is_active ? 1 : 0) : existing.is_active;

    if (!Number.isFinite(cost) || cost < 1) return res.status(400).json({ error: 'Giá điểm phải ≥ 1' });
    if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'Trị giá giảm phải > 0' });
    if (type === 'percent' && value > 100) return res.status(400).json({ error: 'Phần trăm không vượt 100' });

    await run(
      `UPDATE pos_reward_catalog SET name=?, points_cost=?, discount_type=?, discount_value=?, max_discount=?, valid_days=?, is_active=?, updated_at=? WHERE id=?`,
      [name, cost, type, value, maxD, days, active, getNow(), req.params.id],
    );
    res.json({ success: true, message: 'Đã cập nhật quà' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pos/rewards/:id  (xóa mềm: tắt is_active)
router.delete('/:id', authenticate, checkPermission('manage_promotions'), async (req, res) => {
  try {
    await run('UPDATE pos_reward_catalog SET is_active = 0, updated_at = ? WHERE id = ?', [getNow(), req.params.id]);
    res.json({ success: true, message: 'Đã ẩn quà' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
