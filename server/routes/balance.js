/**
 * POS System - Balance Routes
 * Quản lý số dư khách hàng
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');

const router = express.Router();

/**
 * GET /api/pos/customers/:id/balance
 * Lấy số dư và lịch sử giao dịch
 */
router.get('/:id/balance', authenticate, checkPermission('view_customer_balance'), (req, res) => {
  try {
    const { from, to, limit = 50, page = 1 } = req.query;

    const customer = queryOne(
      'SELECT id, phone, name, balance FROM pos_customers WHERE id = ?',
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    // Query lịch sử giao dịch
    let sql = `
      SELECT * FROM pos_balance_transactions 
      WHERE customer_id = ?
    `;
    const params = [req.params.id];

    if (from) {
      sql += ` AND DATE(created_at) >= ?`;
      params.push(from);
    }
    if (to) {
      sql += ` AND DATE(created_at) <= ?`;
      params.push(to);
    }

    sql += ` ORDER BY created_at DESC`;
    
    // Pagination
    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const transactions = query(sql, params);

    // Tổng số giao dịch
    let countSql = `SELECT COUNT(*) as total FROM pos_balance_transactions WHERE customer_id = ?`;
    const countParams = [req.params.id];
    if (from) {
      countSql += ` AND DATE(created_at) >= ?`;
      countParams.push(from);
    }
    if (to) {
      countSql += ` AND DATE(created_at) <= ?`;
      countParams.push(to);
    }
    const total = queryOne(countSql, countParams)?.total || 0;

    // Thống kê
    const stats = queryOne(`
      SELECT 
        SUM(CASE WHEN type = 'topup' THEN amount ELSE 0 END) as total_topup,
        SUM(CASE WHEN type = 'payment' THEN ABS(amount) ELSE 0 END) as total_payment,
        SUM(CASE WHEN type = 'refund' THEN amount ELSE 0 END) as total_refund,
        COUNT(*) as transaction_count
      FROM pos_balance_transactions
      WHERE customer_id = ?
    `, [req.params.id]);

    res.json({
      customer: {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
        balance: customer.balance
      },
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      },
      stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/customers/:id/balance/topup
 * Nạp tiền
 */
router.post('/:id/balance/topup', authenticate, checkPermission('topup_balance'), (req, res) => {
  try {
    const { amount, payment_method, notes } = req.body;

    // Validate
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Số tiền nạp phải lớn hơn 0' });
    }

    if (!payment_method || !['cash', 'transfer'].includes(payment_method)) {
      return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
    }

    const customer = queryOne(
      'SELECT * FROM pos_customers WHERE id = ?',
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    const balanceBefore = customer.balance || 0;
    const balanceAfter = balanceBefore + amount;

    // Cập nhật số dư
    run(
      'UPDATE pos_customers SET balance = ?, updated_at = ? WHERE id = ?',
      [balanceAfter, getNow(), req.params.id]
    );

    // Ghi log giao dịch
    const result = run(`
      INSERT INTO pos_balance_transactions (
        customer_id, customer_phone, type, amount,
        balance_before, balance_after, payment_method,
        notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer.id,
      customer.phone,
      'topup',
      amount,
      balanceBefore,
      balanceAfter,
      payment_method,
      notes || `Nạp tiền ${payment_method === 'cash' ? 'tiền mặt' : 'chuyển khoản'}`,
      req.user.username,
      getNow()
    ]);

    res.json({
      success: true,
      transaction: {
        id: result.lastInsertRowid,
        type: 'topup',
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        payment_method
      },
      new_balance: balanceAfter
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/customers/:id/balance/adjust
 * Điều chỉnh số dư (chỉ admin)
 */
router.post('/:id/balance/adjust', authenticate, checkPermission('adjust_balance'), (req, res) => {
  try {
    const { amount, notes } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Vui lòng nhập số tiền điều chỉnh' });
    }

    if (!notes) {
      return res.status(400).json({ error: 'Vui lòng nhập lý do điều chỉnh' });
    }

    const customer = queryOne(
      'SELECT * FROM pos_customers WHERE id = ?',
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    const balanceBefore = customer.balance || 0;
    const balanceAfter = balanceBefore + amount;

    if (balanceAfter < 0) {
      return res.status(400).json({ 
        error: 'Số dư sau điều chỉnh không thể âm',
        current_balance: balanceBefore,
        adjustment: amount
      });
    }

    // Cập nhật số dư
    run(
      'UPDATE pos_customers SET balance = ?, updated_at = ? WHERE id = ?',
      [balanceAfter, getNow(), req.params.id]
    );

    // Ghi log giao dịch
    const result = run(`
      INSERT INTO pos_balance_transactions (
        customer_id, customer_phone, type, amount,
        balance_before, balance_after,
        notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer.id,
      customer.phone,
      'adjust',
      amount,
      balanceBefore,
      balanceAfter,
      notes,
      req.user.username,
      getNow()
    ]);

    res.json({
      success: true,
      transaction: {
        id: result.lastInsertRowid,
        type: 'adjust',
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter
      },
      new_balance: balanceAfter
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Hàm nội bộ: Trừ số dư khi thanh toán
 */
function deductBalance(customerId, amount, orderId, username) {
  const customer = queryOne(
    'SELECT * FROM pos_customers WHERE id = ?',
    [customerId]
  );

  if (!customer) {
    throw new Error('Không tìm thấy khách hàng');
  }

  const balanceBefore = customer.balance || 0;
  
  if (balanceBefore < amount) {
    throw new Error(`Số dư không đủ. Hiện có: ${balanceBefore}, cần: ${amount}`);
  }

  const balanceAfter = balanceBefore - amount;

  // Cập nhật số dư
  run(
    'UPDATE pos_customers SET balance = ?, updated_at = ? WHERE id = ?',
    [balanceAfter, getNow(), customerId]
  );

  // Ghi log giao dịch
  const result = run(`
    INSERT INTO pos_balance_transactions (
      customer_id, customer_phone, type, amount,
      balance_before, balance_after,
      reference_type, reference_id,
      notes, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    customer.id,
    customer.phone,
    'payment',
    -amount, // Số âm cho thanh toán
    balanceBefore,
    balanceAfter,
    'order',
    orderId,
    'Thanh toán đơn hàng',
    username,
    getNow()
  ]);

  return {
    transaction_id: result.lastInsertRowid,
    balance_before: balanceBefore,
    balance_after: balanceAfter
  };
}

/**
 * Hàm nội bộ: Hoàn tiền vào số dư
 */
function refundBalance(customerId, amount, orderId, username, notes) {
  const customer = queryOne(
    'SELECT * FROM pos_customers WHERE id = ?',
    [customerId]
  );

  if (!customer) {
    throw new Error('Không tìm thấy khách hàng');
  }

  const balanceBefore = customer.balance || 0;
  const balanceAfter = balanceBefore + amount;

  // Cập nhật số dư
  run(
    'UPDATE pos_customers SET balance = ?, updated_at = ? WHERE id = ?',
    [balanceAfter, getNow(), customerId]
  );

  // Ghi log giao dịch
  const result = run(`
    INSERT INTO pos_balance_transactions (
      customer_id, customer_phone, type, amount,
      balance_before, balance_after,
      reference_type, reference_id,
      notes, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    customer.id,
    customer.phone,
    'refund',
    amount,
    balanceBefore,
    balanceAfter,
    'order',
    orderId,
    notes || 'Hoàn tiền đơn hàng',
    username,
    getNow()
  ]);

  return {
    transaction_id: result.lastInsertRowid,
    balance_before: balanceBefore,
    balance_after: balanceAfter
  };
}

module.exports = router;
module.exports.deductBalance = deductBalance;
module.exports.refundBalance = refundBalance;
