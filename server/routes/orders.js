/**
 * POS System - Order Routes
 * Quản lý đơn hàng bán lẻ
 * FIXED: Dùng sx_product_type + sx_product_id thay vì id
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { 
  generateOrderCode, 
  getNow, 
  getToday,
  calculateOrderTotal 
} = require('../utils/helpers');
const { checkStock, outStockFIFO } = require('../utils/sxApi');

const router = express.Router();

/**
 * GET /api/pos/orders
 * Danh sách đơn hàng
 */
router.get('/', authenticate, (req, res) => {
  try {
    const { date, from, to, customer_id, status, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT o.*, 
        (SELECT COUNT(*) FROM pos_order_items WHERE order_id = o.id) as item_count
      FROM pos_orders o WHERE 1=1
    `;
    const params = [];

    if (date) {
      sql += ` AND DATE(o.created_at) = ?`;
      params.push(date);
    } else {
      if (from) { sql += ` AND DATE(o.created_at) >= ?`; params.push(from); }
      if (to) { sql += ` AND DATE(o.created_at) <= ?`; params.push(to); }
    }
    if (customer_id) { sql += ` AND o.customer_id = ?`; params.push(customer_id); }
    if (status) { sql += ` AND o.status = ?`; params.push(status); }

    sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (page - 1) * limit);

    const orders = query(sql, params);
    const total = queryOne(`SELECT COUNT(*) as total FROM pos_orders`)?.total || 0;

    const todayStats = queryOne(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue
      FROM pos_orders 
      WHERE DATE(created_at) = DATE('now', 'localtime')
        AND status != 'cancelled'
    `);

    res.json({ orders, total, todayStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/orders/:id
 * Chi tiết đơn hàng
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const order = queryOne('SELECT * FROM pos_orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    const items = query('SELECT * FROM pos_order_items WHERE order_id = ?', [order.id]);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/orders
 * Tạo đơn hàng mới
 * FIXED: Dùng sx_product_type + sx_product_id để tìm sản phẩm
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { customer_id, items, payment_method, discount = 0, discount_reason, note } = req.body;

    // Validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Đơn hàng phải có ít nhất 1 sản phẩm' });
    }
    if (!payment_method || !['cash', 'transfer', 'balance', 'mixed'].includes(payment_method)) {
      return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
    }

    // Lấy thông tin sản phẩm và tính tổng
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      // FIXED: Dùng sx_product_type + sx_product_id thay vì id
      let product;
      if (item.sx_product_type && item.sx_product_id !== undefined) {
        // Tìm bằng composite key (ưu tiên)
        product = queryOne(
          'SELECT * FROM pos_products WHERE sx_product_type = ? AND sx_product_id = ? AND is_active = 1', 
          [item.sx_product_type, item.sx_product_id]
        );
      } else {
        // Fallback: tìm bằng id (cho backward compatibility)
        product = queryOne('SELECT * FROM pos_products WHERE id = ? AND is_active = 1', [item.product_id]);
      }

      if (!product) {
        return res.status(400).json({ error: `Sản phẩm không tồn tại hoặc đã ngừng bán` });
      }
      if (product.price <= 0) {
        return res.status(400).json({ error: `Sản phẩm ${product.name} chưa có giá bán` });
      }

      // Kiểm tra tồn kho từ SX
      try {
        const stockCheck = await checkStock(product.sx_product_type, product.sx_product_id, item.quantity);
        if (!stockCheck.sufficient) {
          return res.status(400).json({ 
            error: `Không đủ hàng: ${product.name}. Tồn kho: ${stockCheck.stock}, cần: ${item.quantity}` 
          });
        }
      } catch (err) {
        console.error('Stock check error:', err.message);
        // Cho phép tiếp tục nếu không kết nối được SX (fallback)
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: product.id,
        product_code: product.code,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: itemTotal,
        sx_product_type: product.sx_product_type,
        sx_product_id: product.sx_product_id
      });
    }

    const total = Math.max(0, subtotal - discount);

    // Lấy thông tin khách hàng
    let customer = null;
    if (customer_id) {
      customer = queryOne('SELECT * FROM pos_customers WHERE id = ?', [customer_id]);
    }

    // Thanh toán bằng số dư
    let balanceAmount = 0;
    let balanceBefore = 0;
    let balanceAfter = 0;

    if (payment_method === 'balance' && customer) {
      if (customer.balance < total) {
        return res.status(400).json({ error: `Số dư không đủ. Hiện có: ${customer.balance.toLocaleString()}đ` });
      }
      balanceAmount = total;
      balanceBefore = customer.balance;
      balanceAfter = customer.balance - total;
    }

    // Tạo đơn hàng
    const orderCode = generateOrderCode();
    const now = getNow();

    const result = run(`
      INSERT INTO pos_orders (
        code, customer_id, customer_name, customer_phone,
        subtotal, discount, discount_reason, total,
        payment_method, balance_used,
        status, note, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?)
    `, [
      orderCode,
      customer?.id || null,
      customer?.name || 'Khách lẻ',
      customer?.phone || null,
      subtotal,
      discount,
      discount_reason || null,
      total,
      payment_method,
      balanceAmount,
      note || null,
      req.user.username,
      now, now
    ]);

    const orderId = result.lastInsertRowid;

    // Thêm chi tiết đơn hàng
    for (const item of orderItems) {
      run(`
        INSERT INTO pos_order_items (
          order_id, product_id, product_code, product_name,
          quantity, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.product_code, item.product_name, item.quantity, item.unit_price, item.total_price]);

      // Trừ kho từ SX (FIFO)
      try {
        await outStockFIFO(item.sx_product_type, item.sx_product_id, item.quantity, `POS: ${orderCode}`);
      } catch (err) {
        console.error('Stock out error:', err.message);
      }
    }

    // Trừ số dư khách hàng
    if (balanceAmount > 0 && customer) {
      run('UPDATE pos_customers SET balance = ?, updated_at = ? WHERE id = ?', 
        [balanceAfter, now, customer.id]);

      // Ghi log giao dịch số dư
      run(`
        INSERT INTO pos_balance_transactions (
          customer_id, customer_phone, type, amount, 
          balance_before, balance_after, ref_type, ref_id,
          note, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [customer.id, customer.phone, 'payment', -balanceAmount, balanceBefore, balanceAfter, 'order', orderId, 'Thanh toán đơn hàng ' + orderCode, req.user.username, now]);
    }

    res.json({ 
      success: true, 
      order: { 
        id: orderId, 
        code: orderCode, 
        total,
        items: orderItems.length
      } 
    });

  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/orders/:id/cancel
 * Hủy đơn hàng
 */
router.put('/:id/cancel', authenticate, checkPermission('cancel_orders'), async (req, res) => {
  try {
    const { reason } = req.body;
    const order = queryOne('SELECT * FROM pos_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Đơn hàng đã được hủy trước đó' });
    }

    const now = getNow();

    // Hoàn lại số dư nếu đã thanh toán bằng balance
    if (order.balance_used > 0 && order.customer_id) {
      const customer = queryOne('SELECT * FROM pos_customers WHERE id = ?', [order.customer_id]);
      if (customer) {
        const balanceBefore = customer.balance;
        const balanceAfter = customer.balance + order.balance_used;

        run('UPDATE pos_customers SET balance = ?, updated_at = ? WHERE id = ?',
          [balanceAfter, now, customer.id]);

        run(`
          INSERT INTO pos_balance_transactions (
            customer_id, customer_phone, type, amount,
            balance_before, balance_after, ref_type, ref_id,
            note, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [customer.id, customer.phone, 'refund', order.balance_used, balanceBefore, balanceAfter, 'order', order.id, 'Hoàn tiền hủy đơn ' + order.code, req.user.username, now]);
      }
    }

    // Cập nhật trạng thái
    run(`
      UPDATE pos_orders 
      SET status = 'cancelled', cancel_reason = ?, cancelled_by = ?, cancelled_at = ?, updated_at = ?
      WHERE id = ?
    `, [reason || 'Không có lý do', req.user.username, now, now, order.id]);

    // TODO: Hoàn lại tồn kho vào SX

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;