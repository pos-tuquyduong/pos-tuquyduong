// =====================================================
// SỬA FILE: pos-system/server/routes/products.js
// 
// VẤN ĐỀ: Giá bị link nhầm vì id trùng (juice id=1, tea id=1)
// GIẢI PHÁP: Dùng composite key: sx_product_type + sx_product_id
// =====================================================

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { isSxConfigured, callSxApi } = require('../utils/sxApi');

const router = express.Router();

/**
 * GET /api/pos/products
 * Lấy danh sách sản phẩm từ SX với giá từ POS
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { category } = req.query;
    let products = [];

    // Gọi API từ SX
    if (isSxConfigured()) {
      try {
        products = await callSxApi('/api/pos/products-with-stock');

        if (category) {
          products = products.filter(p => p.category === category);
        }

        console.log(`✅ Loaded ${products.length} products from SX`);

      } catch (err) {
        console.error('❌ Error loading from SX:', err.message);
        products = getFallbackProducts(category);
      }
    } else {
      products = getFallbackProducts(category);
    }

    // Merge giá từ POS database - SỬA: dùng composite key
    const prices = query('SELECT sx_product_type, sx_product_id, price FROM pos_products');

    products = products.map(p => {
      // TÌM GIÁ BẰNG COMPOSITE KEY (type + id)
      const priceInfo = prices.find(pr => 
        pr.sx_product_type === p.sx_product_type && 
        String(pr.sx_product_id) === String(p.sx_product_id)
      );

      return {
        ...p,
        // Tạo unique_id để frontend phân biệt
        unique_id: `${p.sx_product_type}_${p.sx_product_id}`,
        price: priceInfo?.price || 0,
        unit: p.category === 'tea' ? 'gói' : 'túi',
        is_active: 1
      };
    });

    res.json(products);
  } catch (err) {
    console.error('Error in GET /products:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Fallback khi không kết nối được SX
 */
function getFallbackProducts(category) {
  console.log('⚠️  Using fallback products');

  let products = query(
    `SELECT * FROM pos_products WHERE is_active = 1${category ? ' AND category = ?' : ''} ORDER BY sort_order, name`,
    category ? [category] : []
  );

  return products.map(p => ({
    ...p,
    unique_id: `${p.sx_product_type}_${p.sx_product_id}`,
    stock_quantity: 999,
    stock_status: 'unknown'
  }));
}

/**
 * PUT /api/pos/products/price
 * Cập nhật giá bán - SỬA: dùng composite key
 */
router.put('/price', authenticate, checkPermission('manage_settings'), (req, res) => {
  try {
    const { sx_product_type, sx_product_id, price } = req.body;

    if (!sx_product_type || sx_product_id === undefined || price === undefined || price < 0) {
      return res.status(400).json({ error: 'Thiếu thông tin hoặc giá không hợp lệ' });
    }

    // Kiểm tra sản phẩm đã tồn tại chưa
    const existing = queryOne(
      'SELECT id FROM pos_products WHERE sx_product_type = ? AND sx_product_id = ?',
      [sx_product_type, sx_product_id]
    );

    if (existing) {
      // Update
      run(
        'UPDATE pos_products SET price = ?, updated_at = datetime("now") WHERE sx_product_type = ? AND sx_product_id = ?',
        [price, sx_product_type, sx_product_id]
      );
    } else {
      // Insert mới
      run(
        `INSERT INTO pos_products (code, name, category, sx_product_type, sx_product_id, price, unit, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime("now"), datetime("now"))`,
        [
          `${sx_product_type === 'tea' ? 'TEA' : 'CT'}${sx_product_id}`,
          'Từ SX',
          sx_product_type === 'tea' ? 'tea' : 'juice',
          sx_product_type,
          sx_product_id,
          price,
          sx_product_type === 'tea' ? 'gói' : 'túi'
        ]
      );
    }

    res.json({ success: true, price, sx_product_type, sx_product_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/products/batch/prices
 * Cập nhật giá hàng loạt
 */
router.put('/batch/prices', authenticate, checkPermission('manage_settings'), (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid products data' });
    }

    let updated = 0;
    products.forEach(p => {
      if (p.sx_product_type && p.sx_product_id !== undefined && p.price !== undefined) {
        const existing = queryOne(
          'SELECT id FROM pos_products WHERE sx_product_type = ? AND sx_product_id = ?',
          [p.sx_product_type, p.sx_product_id]
        );

        if (existing) {
          run(
            'UPDATE pos_products SET price = ?, updated_at = datetime("now") WHERE sx_product_type = ? AND sx_product_id = ?',
            [p.price, p.sx_product_type, p.sx_product_id]
          );
        } else {
          run(
            `INSERT INTO pos_products (code, name, category, sx_product_type, sx_product_id, price, unit, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              p.code || `${p.sx_product_type === 'tea' ? 'TEA' : 'CT'}${p.sx_product_id}`,
              p.name || 'Từ SX',
              p.sx_product_type === 'tea' ? 'tea' : 'juice',
              p.sx_product_type,
              p.sx_product_id,
              p.price,
              p.sx_product_type === 'tea' ? 'gói' : 'túi'
            ]
          );
        }
        updated++;
      }
    });

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/products/sync-from-sx
 * Đồng bộ danh sách sản phẩm từ SX
 */
router.post('/sync-from-sx', authenticate, checkPermission('manage_settings'), async (req, res) => {
  try {
    if (!isSxConfigured()) {
      return res.status(400).json({ error: 'Chưa cấu hình kết nối SX' });
    }

    const sxProducts = await callSxApi('/api/pos/products-with-stock');
    let synced = 0;

    for (const p of sxProducts) {
      const existing = queryOne(
        'SELECT id, price FROM pos_products WHERE sx_product_type = ? AND sx_product_id = ?',
        [p.sx_product_type, p.sx_product_id]
      );

      if (existing) {
        // Update tên, giữ nguyên giá
        run(
          'UPDATE pos_products SET code = ?, name = ?, updated_at = datetime("now") WHERE id = ?',
          [p.code, p.name, existing.id]
        );
      } else {
        // Insert mới với giá = 0
        run(
          `INSERT INTO pos_products (code, name, category, sx_product_type, sx_product_id, price, unit, is_active)
           VALUES (?, ?, ?, ?, ?, 0, ?, 1)`,
          [p.code, p.name, p.category, p.sx_product_type, p.sx_product_id, p.category === 'tea' ? 'gói' : 'túi']
        );
      }
      synced++;
    }

    res.json({ success: true, synced, message: `Đã đồng bộ ${synced} sản phẩm từ SX` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;