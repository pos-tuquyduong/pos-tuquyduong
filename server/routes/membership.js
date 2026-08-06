/**
 * POS System - Membership Status Routes (TIER-1c)
 * Tra cứu hạng hiện tại của khách hàng.
 *
 * Việc MUA thẻ đi qua đúng luồng bán hàng thường (POST /api/pos/orders với
 * membership_buy — xem orders.js), giống hệt cách "mua gói" hoạt động — không
 * có endpoint mua riêng ở đây nữa, tránh 2 luồng thanh toán song song.
 *
 * Nguyên tắc: pos_membership_purchases CHỈ THÊM DÒNG, không sửa/xóa.
 * Hạng hiện tại = dòng MỚI NHẤT (purchased_at) mà expires_at > hiện tại.
 */

const express = require('express');
const { queryOne } = require('../database');
const { authenticate } = require('../middleware/auth');
const { normalizePhone, getNow } = require('../utils/helpers');

const router = express.Router();

// Helper: tính trạng thái hạng hiện tại của 1 khách (dùng chung cho GET status + hiển thị danh sách)
async function getMembershipStatus(phone) {
  const row = await queryOne(
    `SELECT * FROM pos_membership_purchases WHERE customer_phone = ? ORDER BY purchased_at DESC, id DESC LIMIT 1`,
    [phone],
  );
  if (!row) return { tier_name: null, status: 'none' };

  const now = new Date(getNow().replace(' ', 'T'));
  const expires = new Date(String(row.expires_at).replace(' ', 'T'));
  const msRemaining = expires.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

  let status = 'active';
  if (msRemaining <= 0) status = 'expired';
  else if (daysRemaining <= 7) status = 'expiring_soon';

  return {
    tier_id: row.tier_id,
    tier_name: row.tier_name,
    expires_at: row.expires_at,
    days_remaining: daysRemaining,
    status, // 'active' | 'expiring_soon' | 'expired' | 'none'
  };
}

// GET /api/pos/membership/status/:phone — tra cứu hạng hiện tại của 1 khách
router.get('/status/:phone', authenticate, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) return res.status(400).json({ error: 'SĐT không hợp lệ' });
    const data = await getMembershipStatus(phone);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.getMembershipStatus = getMembershipStatus;
