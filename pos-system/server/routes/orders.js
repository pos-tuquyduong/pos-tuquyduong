/**
 * POS System - Order Routes
 * Quản lý đơn hàng bán lẻ
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
      SELECT COUNT(*) as order_count,
        SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) as total_revenue
      FROM pos_orders WHERE DATE(created_at) = ?
    `, [getToday()]);

    res.json({ orders, pagination: { page: parseInt(page), limit: parseInt(limit), total }, today_stats: todayStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/orders/:id
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const order = queryOne('SELECT * FROM pos_orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

    const items = query('SELECT * FROM pos_order_items WHERE order_id = ?', [order.id]);
    let customer = order.customer_id ? queryOne('SELECT id, phone, name, balance FROM pos_customers WHERE id = ?', [order.customer_id]) : null;

    res.json({ ...order, items, customer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/orders
 * Tạo đơn hàng mới
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { customer_id, items, payment_method, discount = 0, discount_reason, notes } = req.body;

    // Validate
    if (!items || !items.length) {
      return res.status(400).json({ error: 'Đơn hàng phải có ít nhất 1 sản phẩm' });
    }
    if (!payment_method || !['cash', 'transfer', 'balance', 'mixed'].includes(payment_method)) {
      return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
    }

    // Lấy thông tin sản phẩm và tính tổng
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = queryOne('SELECT * FROM pos_products WHERE id = ? AND is_active = 1', [item.product_id]);
      if (!product) {
        return res.status(400).json({ error: `Sản phẩm ID ${item.product_id} không tồn tại hoặc đã ngừng bán` });
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
      if (!customer) {
        return res.status(400).json({ error: 'Không tìm thấy khách hàng' });
      }
    }

    // Kiểm tra số dư nếu thanh toán bằng balance
    let balanceAmount = 0;
    let cashAmount = 0;
    let transferAmount = 0;

    if (payment_method === 'balance') {
      if (!customer) {
        return res.status(400).json({ error: 'Cần chọn khách hàng để thanh toán bằng số dư' });
      }
      if (customer.balance < total) {
        return res.status(400).json({ 
          error: `Số dư không đủ. Hiện có: ${customer.balance}, cần: ${total}` 
        });
      }
      balanceAmount = total;
    } else if (payment_method === 'cash') {
      cashAmount = total;
    } else if (payment_method === 'transfer') {
      transferAmount = total;
    }

    // Tạo mã đơn hàng
    const orderCode = generateOrderCode();

    // Insert đơn hàng
    const orderResult = run(`
      INSERT INTO pos_orders (
        code, customer_id, customer_phone, customer_name,
        subtotal, discount, discount_reason, total,
        payment_method, cash_amount, transfer_amount, balance_amount,
        status, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderCode,
      customer?.id || null,
      customer?.phone || null,
      customer?.name || 'Khách lẻ',
      subtotal,
      discount,
      discount_reason || null,
      total,
      payment_method,
      cashAmount,
      transferAmount,
      balanceAmount,
      'completed',
      notes || null,
      req.user.username,
      getNow()
    ]);

    const orderId = orderResult.lastInsertRowid;

    // Insert chi tiết đơn hàng
    for (const item of orderItems) {
      run(`
        INSERT INTO pos_order_items (
          order_id, product_id, product_code, product_name,
          quantity, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.product_code, item.product_name, item.quantity, item.unit_price, item.total_price]);
    }

    // Trừ số dư nếu thanh toán bằng balance
    if (balanceAmount > 0) {
      const balanceBefore = customer.balance;
      const balanceAfter = balanceBefore - balanceAmount;
      
      run('UPDATE pos_customers SET balance = ?, updated_at = ? WHERE id = ?', [balanceAfter, getNow(), customer.id]);
      
      run(`
        INSERT INTO pos_balance_transactions (
          customer_id, customer_phone, type, amount,
          balance_before, balance_after, reference_type, reference_id,
          notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [customer.id, customer.phone, 'payment', -balanceAmount, balanceBefore, balanceAfter, 'order', orderId, 'Thanh toán đơn hàng ' + orderCode, req.user.username, getNow()]);
    }

    // Xuất kho từ SX
    for (const item of orderItems) {
      try {
        await outStockFIFO(
          item.sx_product_type,
          item.sx_product_id,
          item.quantity,
          customer ? { id: customer.id, name: customer.name } : null,
          { id: orderId, code: orderCode }
        );
      } catch (err) {
        console.error('Stock out error:', err.message);
        // Log lỗi nhưng không rollback đơn hàng
      }
    }

    // Trả về đơn hàng đã tạo
    const newOrder = queryOne('SELECT * FROM pos_orders WHERE id = ?', [orderId]);
    const newItems = query('SELECT * FROM pos_order_items WHERE order_id = ?', [orderId]);

    res.status(201).json({
      success: true,
      order: { ...newOrder, items: newItems },
      message: 'Đã tạo đơn hàng thành công'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/orders/:id/cancel
 * Hủy đơn hàng
 */
router.post('/:id/cancel', authenticate, checkPermission('cancel_order'), (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Vui lòng nhập lý do hủy đơn' });
    }

    const order = queryOne('SELECT * FROM pos_orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Chỉ có thể hủy đơn hàng đã hoàn thành' });
    }

    // Nếu đơn có thanh toán bằng số dư → tạo yêu cầu hoàn tiền
    if (order.balance_amount > 0) {
      run(`
        INSERT INTO pos_refund_requests (
          order_id, customer_id, order_total, balance_paid, refund_amount,
          status, requested_by, reason, requested_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [order.id, order.customer_id, order.total, order.balance_amount, order.balance_amount, 'pending', req.user.username, reason, getNow()]);

      run(`
        UPDATE pos_orders SET 
          status = 'refund_pending', cancelled_at = ?, cancelled_by = ?, cancelled_reason = ?
        WHERE id = ?
      `, [getNow(), req.user.username, reason, order.id]);

      return res.json({
        success: true,
        status: 'refund_pending',
        message: 'Đã hủy đơn. Yêu cầu hoàn tiền đang chờ phê duyệt.'
      });
    }

    // Không có số dư → hủy trực tiếp
    run(`
      UPDATE pos_orders SET 
        status = 'cancelled', cancelled_at = ?, cancelled_by = ?, cancelled_reason = ?
      WHERE id = ?
    `, [getNow(), req.user.username, reason, order.id]);

    res.json({ success: true, status: 'cancelled', message: 'Đã hủy đơn hàng' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
