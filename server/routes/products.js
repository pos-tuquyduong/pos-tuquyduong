/**
 * POS System - Products Routes
 * Quản lý sản phẩm bán hàng
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { isSxConfigured, callSxApi } = require('../utils/sxApi');

const router = express.Router();

/**
 * GET /api/pos/products
 * Lấy danh sách sản phẩm
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { category } = req.query;
    let products = [];

    // Gọi API mới từ SX
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

    // Merge giá từ POS database
    const prices = query('SELECT sx_product_type, sx_product_id, price FROM pos_products');

    products = products.map(p => {
      const priceInfo = prices.find(pr => 
        pr.sx_product_type === p.sx_product_type && 
        pr.sx_product_id === p.sx_product_id
      );

      return {
        ...p,
        price: priceInfo?.price || 0,
        unit: 'túi',
        is_active: 1
      };
    });

    res.json(products);
  } catch (err) {
    console.error('Error in GET /products:', err);
    res.status(500).json({ error: err.message });
  }
});

function getFallbackProducts(category) {
  console.log('⚠️  Using fallback products (stock = 999)');

  let products = query(
    `SELECT * FROM pos_products WHERE is_active = 1${category ? ' AND category = ?' : ''} ORDER BY sort_order, name`,
    category ? [category] : []
  );

  return products.map(p => ({
    ...p,
    stock_quantity: 999,
    stock_status: 'unknown'
  }));
}

router.put('/:id/price', authenticate, checkPermission('manage_settings'), (req, res) => {
  try {
    const { price } = req.body;

    if (price === undefined || price < 0) {
      return res.status(400).json({ error: 'Giá không hợp lệ' });
    }

    run(
      'UPDATE pos_products SET price = ?, updated_at = datetime("now") WHERE id = ?',
      [price, req.params.id]
    );

    res.json({ success: true, price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/batch/prices', authenticate, checkPermission('manage_settings'), (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid products data' });
    }

    products.forEach(p => {
      if (p.sx_product_type && p.sx_product_id !== undefined && p.price !== undefined) {
        run(
          `UPDATE pos_products 
           SET price = ?, updated_at = datetime("now") 
           WHERE sx_product_type = ? AND sx_product_id = ?`,
          [p.price, p.sx_product_type, p.sx_product_id]
        );
      }
    });

    res.json({ success: true, updated: products.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;