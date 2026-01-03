/**
 * POS System - Product Routes
 * Quản lý sản phẩm và menu bán hàng
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');
const { getStockSummary } = require('../utils/sxApi');

const router = express.Router();

/**
 * GET /api/pos/products
 * Danh sách sản phẩm
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, active = '1', with_stock = 'false' } = req.query;

    let sql = `SELECT * FROM pos_products WHERE 1=1`;
    const params = [];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (active === '1') {
      sql += ` AND is_active = 1`;
    }

    sql += ` ORDER BY sort_order, name`;

    let products = query(sql, params);

    // Thêm thông tin tồn kho từ SX nếu yêu cầu
    if (with_stock === 'true') {
      try {
        const stockSummary = await getStockSummary();
        
        products = products.map(product => {
          const stock = stockSummary.find(s => 
            s.product_type === product.sx_product_type && 
            s.product_id === product.sx_product_id
          );
          return {
            ...product,
            stock_quantity: stock?.total_quantity || 0,
            stock_status: getStockStatus(stock?.total_quantity || 0)
          };
        });
      } catch (err) {
        console.error('Error fetching stock:', err.message);
        // Khi không kết nối được SX, cho phép bán (stock = 999)
        products = products.map(p => ({
          ...p,
          stock_quantity: 999,
          stock_status: 'in_stock'
        }));
      }
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/products/:id
 * Chi tiết sản phẩm
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const product = queryOne(
      'SELECT * FROM pos_products WHERE id = ?',
      [req.params.id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    // Lấy tồn kho từ SX
    try {
      const stockSummary = await getStockSummary();
      const stock = stockSummary.find(s => 
        s.product_type === product.sx_product_type && 
        s.product_id === product.sx_product_id
      );
      product.stock_quantity = stock?.total_quantity || 0;
      product.stock_status = getStockStatus(stock?.total_quantity || 0);
      product.stock_batches = stock?.batches || [];
    } catch (err) {
      product.stock_quantity = null;
      product.stock_status = 'unknown';
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/products
 * Thêm sản phẩm mới (admin)
 */
router.post('/', authenticate, checkPermission('manage_products'), (req, res) => {
  try {
    const {
      code,
      name,
      category,
      price = 0,
      unit = 'túi',
      description,
      image_url,
      is_active = 1,
      sort_order = 0,
      sx_product_type,
      sx_product_id
    } = req.body;

    // Validate
    if (!code || !name || !category) {
      return res.status(400).json({ 
        error: 'Vui lòng nhập đầy đủ mã, tên và danh mục sản phẩm' 
      });
    }

    // Kiểm tra code trùng
    const existing = queryOne(
      'SELECT id FROM pos_products WHERE code = ?',
      [code]
    );

    if (existing) {
      return res.status(400).json({ error: 'Mã sản phẩm đã tồn tại' });
    }

    const result = run(`
      INSERT INTO pos_products (
        code, name, category, price, unit,
        description, image_url, is_active, sort_order,
        sx_product_type, sx_product_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code.toUpperCase(),
      name.trim(),
      category,
      price,
      unit,
      description || null,
      image_url || null,
      is_active ? 1 : 0,
      sort_order,
      sx_product_type || null,
      sx_product_id || null,
      getNow()
    ]);

    const product = queryOne(
      'SELECT * FROM pos_products WHERE id = ?',
      [result.lastInsertRowid]
    );

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/products/:id
 * Cập nhật sản phẩm
 */
router.put('/:id', authenticate, checkPermission('manage_products'), (req, res) => {
  try {
    const {
      name,
      category,
      price,
      unit,
      description,
      image_url,
      is_active,
      sort_order,
      sx_product_type,
      sx_product_id
    } = req.body;

    const product = queryOne(
      'SELECT * FROM pos_products WHERE id = ?',
      [req.params.id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    run(`
      UPDATE pos_products SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        price = COALESCE(?, price),
        unit = COALESCE(?, unit),
        description = ?,
        image_url = ?,
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order),
        sx_product_type = ?,
        sx_product_id = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      name?.trim(),
      category,
      price,
      unit,
      description,
      image_url,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      sort_order,
      sx_product_type,
      sx_product_id,
      getNow(),
      req.params.id
    ]);

    const updated = queryOne(
      'SELECT * FROM pos_products WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/products/:id/price
 * Cập nhật giá bán (shortcut)
 */
router.put('/:id/price', authenticate, checkPermission('manage_products'), (req, res) => {
  try {
    const { price } = req.body;

    if (price === undefined || price < 0) {
      return res.status(400).json({ error: 'Giá không hợp lệ' });
    }

    const product = queryOne(
      'SELECT * FROM pos_products WHERE id = ?',
      [req.params.id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    run(
      'UPDATE pos_products SET price = ?, updated_at = ? WHERE id = ?',
      [price, getNow(), req.params.id]
    );

    res.json({ 
      success: true, 
      product: { ...product, price }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/products/:id/toggle
 * Bật/tắt sản phẩm
 */
router.put('/:id/toggle', authenticate, checkPermission('manage_products'), (req, res) => {
  try {
    const product = queryOne(
      'SELECT * FROM pos_products WHERE id = ?',
      [req.params.id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    const newStatus = product.is_active ? 0 : 1;

    run(
      'UPDATE pos_products SET is_active = ?, updated_at = ? WHERE id = ?',
      [newStatus, getNow(), req.params.id]
    );

    res.json({ 
      success: true, 
      is_active: newStatus === 1,
      message: newStatus ? 'Đã bật sản phẩm' : 'Đã tắt sản phẩm'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/products/prices/batch
 * Cập nhật giá hàng loạt
 */
router.put('/prices/batch', authenticate, checkPermission('manage_products'), (req, res) => {
  try {
    const { prices } = req.body;

    if (!prices || !Array.isArray(prices)) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }

    let updated = 0;
    prices.forEach(({ id, price }) => {
      if (id && price !== undefined && price >= 0) {
        run(
          'UPDATE pos_products SET price = ?, updated_at = ? WHERE id = ?',
          [price, getNow(), id]
        );
        updated++;
      }
    });

    res.json({ 
      success: true, 
      updated_count: updated,
      message: `Đã cập nhật giá ${updated} sản phẩm`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Helper: Xác định trạng thái tồn kho
 */
function getStockStatus(quantity) {
  if (quantity === null || quantity === undefined) return 'unknown';
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= 10) return 'low';
  return 'in_stock';
}

module.exports = router;
