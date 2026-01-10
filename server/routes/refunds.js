/**
 * POS System - Refund Routes
 * Quản lý yêu cầu hoàn tiền
 * 
 * THIẾT KẾ: phone làm định danh chính
 * - Hoàn tiền vào pos_wallets (theo phone)
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow, normalizePhone } = require('../utils/helpers');

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
        o.code as order_code
      FROM pos_refund_requests r
      LEFT JOIN pos_orders o ON r.order_id = o.id
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
        w.balance as current_balance
      FROM pos_refund_requests r
      LEFT JOIN pos_orders o ON r.order_id = o.id
      LEFT JOIN pos_wallets w ON r.customer_phone = w.phone
      WHERE r.status = 'pending'
      ORDER BY r.requested_at ASC
    `);

    res.json(refunds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/refunds
 * Tạo yêu cầu hoàn tiền
 */
router.post('/', authenticate, (req, res) => {
  try {
    const { order_id, reason } = req.body;

    const order = queryOne('SELECT * FROM pos_orders WHERE id = ?', [order_id]);
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    if (order.status === 'cancelled' || order.status === 'refunded') {
      return res.status(400).json({ error: 'Đơn hàng đã được hủy/hoàn tiền' });
    }

    if (!order.balance_amount || order.balance_amount <= 0) {
      return res.status(400).json({ error: 'Đơn hàng không thanh toán bằng số dư' });
    }

    // Kiểm tra đã có yêu cầu chưa
    const existing = queryOne(
      'SELECT id FROM pos_refund_requests WHERE order_id = ? AND status = ?',
      [order_id, 'pending']
    );
    if (existing) {
      return res.status(400).json({ error: 'Đã có yêu cầu hoàn tiền đang chờ duyệt' });
    }

    const result = run(`
      INSERT INTO pos_refund_requests (
        order_id, customer_phone, order_total, balance_paid, refund_amount,
        status, requested_by, requested_at, reason
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `, [
      order_id,
      order.customer_phone,
      order.total,
      order.balance_amount,
      order.balance_amount,
      req.user.username,
      getNow(),
      reason || 'Yêu cầu hoàn tiền'
    ]);

    res.json({
      success: true,
      refund_id: result.lastInsertRowid,
      message: 'Đã tạo yêu cầu hoàn tiền, chờ admin duyệt'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/refunds/:id/approve
 * Phê duyệt hoàn tiền - cộng vào pos_wallets
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

    const phone = refund.customer_phone;
    if (!phone) {
      return res.status(400).json({ error: 'Không có SĐT khách hàng' });
    }

    const now = getNow();

    // Lấy hoặc tạo wallet
    let wallet = queryOne('SELECT * FROM pos_wallets WHERE phone = ?', [phone]);
    const balanceBefore = wallet?.balance || 0;
    const balanceAfter = balanceBefore + refund.refund_amount;

    if (wallet) {
      run('UPDATE pos_wallets SET balance = ?, updated_at = ? WHERE phone = ?',
        [balanceAfter, now, phone]);
    } else {
      run(`INSERT INTO pos_wallets (phone, balance, total_topup, total_spent, created_at, updated_at) 
           VALUES (?, ?, 0, 0, ?, ?)`,
        [phone, balanceAfter, now, now]);
    }

    // Ghi log giao dịch
    const txResult = run(`
      INSERT INTO pos_balance_transactions (
        customer_phone, customer_name, type, amount,
        balance_before, balance_after, order_id,
        notes, created_by, created_at
      ) VALUES (?, ?, 'refund', ?, ?, ?, ?, ?, ?, ?)
    `, [
      phone,
      null,
      refund.refund_amount,
      balanceBefore,
      balanceAfter,
      refund.order_id,
      'Hoàn tiền đơn hàng (duyệt)',
      req.user.username,
      now
    ]);

    // Cập nhật yêu cầu hoàn tiền
    run(`
      UPDATE pos_refund_requests SET
        status = 'approved',
        processed_by = ?,
        processed_at = ?,
        balance_transaction_id = ?
      WHERE id = ?
    `, [req.user.username, now, txResult.lastInsertRowid, refund.id]);

    // Cập nhật đơn hàng
    run(`UPDATE pos_orders SET status = 'refunded' WHERE id = ?`, [refund.order_id]);

    res.json({
      success: true,
      message: `Đã hoàn ${refund.refund_amount.toLocaleString()}đ vào số dư`,
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

    res.json({
      success: true,
      message: 'Đã từ chối yêu cầu hoàn tiền'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;