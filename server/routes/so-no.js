/**
 * POS-DODNO-v1 — hai duong cho so no
 *   GET  /api/pos/so-no          dem viec ket + danh sach ngan (dai bao)
 *   POST /api/pos/so-no/doi-ngay doi ngay khong cho gian cach (nut bam)
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../database');
const { demViecKet, doSoNo } = require('../utils/doSoNo');

router.get('/', authenticate, async (req, res) => {
  try {
    const dem = await demViecKet();
    const ds = await query(
      `SELECT id, order_code, product_name, quantity, direction, status,
              retry_count, error_message, created_at
         FROM pos_stock_pending
        WHERE status IN ('pending', 'can_xem')
        ORDER BY created_at DESC LIMIT 20`,
    );
    res.json({ ...dem, danh_sach: ds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/doi-ngay', authenticate, async (req, res) => {
  try {
    const kq = await doSoNo();
    const dem = await demViecKet();
    res.json({ ...kq, con_lai: dem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
