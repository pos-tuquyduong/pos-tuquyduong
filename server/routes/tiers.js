/**
 * POS System - Membership Tier Routes (TIER-1a)
 * Đọc/lưu cấu hình hạng thành viên + mức làm tròn giá.
 * INERT: chưa áp giá lúc bán (đó là TIER-2). App KH đọc cùng API này.
 *
 * TURSO: mọi database call dùng await; lastInsertRowid là BigInt → bọc Number() khi trả.
 */

const express = require('express');
const { query, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');

const router = express.Router();

const ROUND_ALLOWED = [0, 500, 1000];

// GET /api/pos/tiers — danh sách hạng (sắp theo ngưỡng) + cấu hình làm tròn
router.get('/', authenticate, async (req, res) => {
  try {
    const tiers = await query(
      'SELECT * FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order ASC, min_spend ASC',
    );
    const rows = await query(
      "SELECT key, value FROM pos_settings WHERE key IN ('tier_round_to','tier_round_mode')",
    );
    const s = {};
    rows.forEach((r) => (s[r.key] = r.value));
    let roundTo = parseInt(s.tier_round_to, 10);
    if (!ROUND_ALLOWED.includes(roundTo)) roundTo = 500;
    const roundMode = s.tier_round_mode === 'down' ? 'down' : 'nearest';
    res.json({ success: true, data: { tiers, round_to: roundTo, round_mode: roundMode } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/pos/tiers — lưu các hạng (theo id) + cấu hình làm tròn
router.put('/', authenticate, checkPermission('manage_promotions'), async (req, res) => {
  try {
    const { tiers, round_to, round_mode } = req.body || {};
    if (!Array.isArray(tiers)) return res.status(400).json({ error: 'Thiếu danh sách hạng' });
    const now = getNow();

    for (const t of tiers) {
      const id = parseInt(t.id, 10);
      if (!Number.isFinite(id)) continue;
      const name = String(t.name || '').trim();
      const minSpend = Number(t.min_spend);
      const pct = Number(t.discount_percent);
      if (!name) return res.status(400).json({ error: 'Tên hạng không được trống' });
      if (!Number.isFinite(minSpend) || minSpend < 0) return res.status(400).json({ error: 'Ngưỡng tiền không hợp lệ' });
      if (!Number.isFinite(pct) || pct < 0 || pct > 90) return res.status(400).json({ error: '% giảm phải từ 0 đến 90' });
      await run(
        'UPDATE pos_membership_tiers SET name=?, min_spend=?, discount_percent=?, updated_at=? WHERE id=?',
        [name, minSpend, pct, now, id],
      );
    }

    const rt = ROUND_ALLOWED.includes(parseInt(round_to, 10)) ? String(parseInt(round_to, 10)) : '500';
    const rm = round_mode === 'down' ? 'down' : 'nearest';
    await run(
      `INSERT INTO pos_settings (key, value, updated_at) VALUES ('tier_round_to', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
      [rt, now],
    );
    await run(
      `INSERT INTO pos_settings (key, value, updated_at) VALUES ('tier_round_mode', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
      [rm, now],
    );

    res.json({ success: true, message: 'Đã lưu hạng thành viên' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
