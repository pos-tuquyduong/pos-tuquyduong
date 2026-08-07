/**
 * POS System - Membership Status Routes (TIER-1c)
 * Tra cứu hạng hiện tại của khách hàng.
 *
 * Việc MUA thẻ đi qua đúng luồng bán hàng thường (POST /api/pos/orders với
 * membership_buy — xem orders.js), giống hệt cách "mua gói" hoạt động — không
 * có endpoint mua riêng ở đây nữa, tránh 2 luồng thanh toán song song.
 *
 * Logic tra hạng dùng chung với orders.js qua utils/membershipStatus.js —
 * MỘT NGUỒN duy nhất, tránh 2 nơi tính khác nhau (đúng khuôn mẫu flashState.js).
 */

const express = require('express');
const { query, queryOne } = require('../database');
const { authenticate } = require('../middleware/auth');
const { normalizePhone, getNow } = require('../utils/helpers');
const { getMembershipStatus } = require('../utils/membershipStatus');

const router = express.Router();

// GET /api/pos/membership/status/:phone — tra cứu hạng hiện tại của 1 khách
router.get('/status/:phone', authenticate, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) return res.status(400).json({ error: 'SĐT không hợp lệ' });
    const data = await getMembershipStatus(query, queryOne, getNow, phone);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
