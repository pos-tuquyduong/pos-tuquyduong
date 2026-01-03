/**
 * POS System - Refund Routes
 * Quản lý yêu cầu hoàn tiền
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');

const router = express.Router();

/**
 * GET /api/pos/refunds
 * Danh sách yêu cầu hoàn tiền
 */
router.get('/', authenticate, (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT r.*, 
        o.code as order_code,
        c.name as customer_name,
        c.phone as customer_phone
      FROM pos_refund_requests r
      LEFT JOIN pos_orders o ON r.order_id = o.id
      LEFT JOIN pos_customers c ON r.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY r.requested_at DESC`;
    
    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const refunds = query(sql, params);

    // Đếm theo trạng thái
    const stats = query(`
      SELECT status, COUNT(*) as count 
      FROM pos_refund_requests 
      GROUP BY status
    `);

    res.json({
      refunds,
      stats: stats.reduce((acc, s) => {
        acc[s.status] = s.count;
        return acc;
      }, { pending: 0, approved: 0, rejected: 0 })
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/refunds/pending
 * Danh sách chờ duyệt
 */
router.get('/pending', authenticate, checkPermission('approve_refund'), (req, res) => {
  try {
    const refunds = query(`
      SELECT r.*, 
        o.code as order_code,
        o.created_at as order_date,
        c.name as customer_name,
        c.phone as customer_phone,
        c.balance as current_balance
      FROM pos_refund_requests r
      LEFT JOIN pos_orders o ON r.order_id = o.id
      LEFT JOIN pos_customers c ON r.customer_id = c.id
      WHERE r.status = 'pending'
      ORDER BY r.requested_at ASC
    `);

    res.json(refunds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/refunds/:id/approve
 * Phê duyệt hoàn tiền
 */
router.post('/:id/approve', authenticate, checkPermission('approve_refund'), (req, res) => {
  try {
    const refund = queryOne(
      'SELECT * FROM pos_refund_requests WHERE id = ?',
      [req.params.id]
    );

    if (!refund) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu hoàn tiền' });
    }

    if (refund.status !== 'pending') {
      return res.status(400).json({ error: 'Yêu cầu này đã được xử lý' });
    }

    // Lấy thông tin khách hàng
    const customer = queryOne(
      'SELECT * FROM pos_customers WHERE id = ?',
      [refund.customer_id]
    );

    if (!customer) {
      return res.status(400).json({ error: 'Không tìm thấy khách hàng' });
    }

    const balanceBefore = customer.balance || 0;
    const balanceAfter = balanceBefore + refund.refund_amount;

    // Cộng tiền vào số dư
    run(
      'UPDATE pos_customers SET balance = ?, updated_at = ? WHERE id = ?',
      [balanceAfter, getNow(), customer.id]
    );

    // Ghi log giao dịch
    const txResult = run(`
      INSERT INTO pos_balance_transactions (
        customer_id, customer_phone, type, amount,
        balance_before, balance_after, reference_type, reference_id,
        notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer.id,
      customer.phone,
      'refund',
      refund.refund_amount,
      balanceBefore,
      balanceAfter,
      'order',
      refund.order_id,
      'Hoàn tiền đơn hàng',
      req.user.username,
      getNow()
    ]);

    // Cập nhật yêu cầu hoàn tiền
    run(`
      UPDATE pos_refund_requests SET
        status = 'approved',
        processed_by = ?,
        processed_at = ?,
        balance_transaction_id = ?
      WHERE id = ?
    `, [req.user.username, getNow(), txResult.lastInsertRowid, refund.id]);

    // Cập nhật đơn hàng
    run(`
      UPDATE pos_orders SET status = 'refunded' WHERE id = ?
    `, [refund.order_id]);

    res.json({
      success: true,
      message: `Đã hoàn ${refund.refund_amount.toLocaleString()}đ vào số dư của ${customer.name}`,
      new_balance: balanceAfter
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/refunds/:id/reject
 * Từ chối hoàn tiền
 */
router.post('/:id/reject', authenticate, checkPermission('approve_refund'), (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Vui lòng nhập lý do từ chối' });
    }

    const refund = queryOne(
      'SELECT * FROM pos_refund_requests WHERE id = ?',
      [req.params.id]
    );

    if (!refund) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu hoàn tiền' });
    }

    if (refund.status !== 'pending') {
      return res.status(400).json({ error: 'Yêu cầu này đã được xử lý' });
    }

    // Cập nhật yêu cầu hoàn tiền
    run(`
      UPDATE pos_refund_requests SET
        status = 'rejected',
        processed_by = ?,
        processed_at = ?,
        rejection_reason = ?
      WHERE id = ?
    `, [req.user.username, getNow(), reason, refund.id]);

    // Cập nhật đơn hàng thành cancelled (không hoàn tiền)
    run(`
      UPDATE pos_orders SET status = 'cancelled' WHERE id = ?
    `, [refund.order_id]);

    res.json({
      success: true,
      message: 'Đã từ chối yêu cầu hoàn tiền'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
