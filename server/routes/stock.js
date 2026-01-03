/**
 * POS System - Stock Routes
 * Xem tồn kho thành phẩm từ hệ thống Sản xuất
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { 
  getFinishedProducts, 
  checkStock, 
  getStockSummary 
} = require('../utils/sxApi');

const router = express.Router();

/**
 * GET /api/pos/stock
 * Tồn kho thành phẩm tổng hợp
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const summary = await getStockSummary();
    
    // Thêm trạng thái
    const result = summary.map(item => ({
      ...item,
      status: getStockStatus(item.total_quantity),
      status_label: getStockStatusLabel(item.total_quantity)
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ 
      error: 'Không thể kết nối hệ thống Sản xuất',
      message: err.message 
    });
  }
});

/**
 * GET /api/pos/stock/detail
 * Tồn kho chi tiết từng batch
 */
router.get('/detail', authenticate, async (req, res) => {
  try {
    const products = await getFinishedProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ 
      error: 'Không thể kết nối hệ thống Sản xuất',
      message: err.message 
    });
  }
});

/**
 * GET /api/pos/stock/check
 * Kiểm tra tồn kho đủ không
 */
router.get('/check', authenticate, async (req, res) => {
  try {
    const { product_type, product_id, quantity } = req.query;

    if (!product_type || !quantity) {
      return res.status(400).json({ 
        error: 'Thiếu thông tin sản phẩm hoặc số lượng' 
      });
    }

    const result = await checkStock(product_type, product_id, quantity);
    
    res.json({
      ...result,
      status: result.sufficient ? 'ok' : 'insufficient',
      message: result.sufficient 
        ? `Đủ hàng (tồn: ${result.stock})` 
        : `Không đủ hàng. Tồn: ${result.stock}, cần: ${result.required}, thiếu: ${result.shortage}`
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Không thể kiểm tra tồn kho',
      message: err.message 
    });
  }
});

/**
 * Helper: Xác định trạng thái tồn kho
 */
function getStockStatus(quantity) {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= 10) return 'low';
  if (quantity <= 30) return 'medium';
  return 'high';
}

function getStockStatusLabel(quantity) {
  if (quantity <= 0) return 'Hết hàng';
  if (quantity <= 10) return 'Sắp hết';
  if (quantity <= 30) return 'Còn ít';
  return 'Còn nhiều';
}

module.exports = router;
