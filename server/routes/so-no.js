/**
 * POS-DODNO-v1 → KHO-3a: sổ nợ kho SX (`pos_stock_pending`) không còn gửi đi — SX đã ngắt, bán trừ kho POS trong cùng giao dịch đơn.
 *   GET  /api/pos/so-no          luôn 0 việc (dải "việc kho chờ gửi" trên thanh điều hướng tự tắt); dữ liệu cũ giữ nguyên làm lịch sử
 *   POST /api/pos/so-no/doi-ngay 410 SX_DA_NGAT
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, (req, res) => res.json({ cho: 0, canXem: 0, dangChay: false, danh_sach: [] }));

router.post('/doi-ngay', authenticate, (req, res) => res.status(410).json({ error: 'Đã ngắt kết nối SX — không còn gửi kho sang SX', code: 'SX_DA_NGAT' }));

module.exports = router;
