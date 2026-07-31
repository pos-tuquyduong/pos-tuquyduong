/**
 * POS System - Flash Sale Routes (F1)
 * Đọc cấu hình flash + trạng thái "đang flash" (giờ VN). CHỈ ĐỌC (inert).
 * Logic dùng chung ở utils/flashState.js → trùng khớp với luồng bán (orders.js).
 */

const express = require('express');
const { query } = require('../database');
const { authenticate } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');
const { readFlashState } = require('../utils/flashState');

const router = express.Router();

// GET /api/pos/flash — cấu hình flash + trạng thái hiện tại (giờ VN)
router.get('/', authenticate, async (req, res) => {
  try {
    const data = await readFlashState(query, getNow);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
