/**
 * POS System - Membership Tier Routes (TIER-1a-v2)
 * Đọc/lưu cấu hình hạng thành viên (giá thẻ + % giảm) + số tháng hiệu lực + mức làm tròn giá.
 * Hạng lên theo MUA THẺ (TIER-1c), không còn theo tích lũy mua hàng.
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
const VALID_MONTHS_MIN = 1;
const VALID_MONTHS_MAX = 24;

// GET /api/pos/tiers — danh sách hạng (sắp theo giá thẻ) + cấu hình làm tròn + hạn thẻ
router.get('/', authenticate, async (req, res) => {
  try {
    const tiers = await query(
      'SELECT * FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order ASC, card_price ASC',
    );
    const rows = await query(
      "SELECT key, value FROM pos_settings WHERE key IN ('tier_round_to','tier_round_mode','tier_card_valid_months')",
    );
    const s = {};
    rows.forEach((r) => (s[r.key] = r.value));
    let roundTo = parseInt(s.tier_round_to, 10);
    if (!ROUND_ALLOWED.includes(roundTo)) roundTo = 500;
    const roundMode = s.tier_round_mode === 'down' ? 'down' : 'nearest';
    let validMonths = parseInt(s.tier_card_valid_months, 10);
    if (!Number.isFinite(validMonths) || validMonths < VALID_MONTHS_MIN || validMonths > VALID_MONTHS_MAX) validMonths = 3;
    res.json({ success: true, data: { tiers, round_to: roundTo, round_mode: roundMode, valid_months: validMonths } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/pos/tiers — lưu các hạng (theo id) + cấu hình làm tròn + hạn thẻ
router.put('/', authenticate, checkPermission('manage_promotions'), async (req, res) => {
  try {
    const { tiers, round_to, round_mode, valid_months } = req.body || {};
    if (!Array.isArray(tiers)) return res.status(400).json({ error: 'Thiếu danh sách hạng' });
    const now = getNow();

    for (const t of tiers) {
      const id = parseInt(t.id, 10);
      if (!Number.isFinite(id)) continue;
      const name = String(t.name || '').trim();
      const cardPrice = Number(t.card_price);
      const pct = Number(t.discount_percent);
      if (!name) return res.status(400).json({ error: 'Tên hạng không được trống' });
      if (!Number.isFinite(cardPrice) || cardPrice < 0) return res.status(400).json({ error: 'Giá thẻ không hợp lệ' });
      if (!Number.isFinite(pct) || pct < 0 || pct > 90) return res.status(400).json({ error: '% giảm phải từ 0 đến 90' });
      await run(
        'UPDATE pos_membership_tiers SET name=?, card_price=?, discount_percent=?, updated_at=? WHERE id=?',
        [name, cardPrice, pct, now, id],
      );
    }

    const rt = ROUND_ALLOWED.includes(parseInt(round_to, 10)) ? String(parseInt(round_to, 10)) : '500';
    const rm = round_mode === 'down' ? 'down' : 'nearest';
    const vmInt = parseInt(valid_months, 10);
    const vm = (Number.isFinite(vmInt) && vmInt >= VALID_MONTHS_MIN && vmInt <= VALID_MONTHS_MAX) ? String(vmInt) : '3';

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
    await run(
      `INSERT INTO pos_settings (key, value, updated_at) VALUES ('tier_card_valid_months', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
      [vm, now],
    );

    res.json({ success: true, message: 'Đã lưu hạng thành viên' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pos/tiers/:id — xóa mềm 1 hạng (is_active=0), KHÔNG xóa cứng dữ liệu
router.delete('/:id', authenticate, checkPermission('manage_promotions'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID không hợp lệ' });
    const now = getNow();
    await run('UPDATE pos_membership_tiers SET is_active=0, updated_at=? WHERE id=?', [now, id]);
    res.json({ success: true, message: 'Đã xóa hạng' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
