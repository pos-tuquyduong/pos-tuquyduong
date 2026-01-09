/**
 * POS System - Wallets Routes
 * API quản lý số dư khách hàng
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow, normalizePhone } = require('../utils/helpers');

const router = express.Router();

/**
 * GET /api/pos/wallets
 * Danh sách wallets
 */
router.get('/', authenticate, (req, res) => {
  try {
    const { has_balance } = req.query;
    let sql = 'SELECT * FROM pos_wallets';
    if (has_balance === 'true') {
      sql += ' WHERE balance > 0';
    }
    sql += ' ORDER BY balance DESC';
    const wallets = query(sql);
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/wallets/:phone
 * Lấy wallet theo SĐT
 */
router.get('/:phone', authenticate, (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ error: 'SĐT không hợp lệ' });
    }

    let wallet = queryOne('SELECT * FROM pos_wallets WHERE phone = ?', [phone]);
    if (!wallet) {
      wallet = { phone, balance: 0, total_topup: 0, total_spent: 0 };
    }
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/wallets/topup
 * Nạp tiền
 */
router.post('/topup', authenticate, checkPermission('topup_balance'), (req, res) => {
  try {
    const { phone, amount, customer_name, notes, payment_method } = req.body;

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'SĐT không hợp lệ' });
    }

    const topupAmount = parseInt(amount);
    if (!topupAmount || topupAmount <= 0) {
      return res.status(400).json({ error: 'Số tiền không hợp lệ' });
    }

    let wallet = queryOne('SELECT * FROM pos_wallets WHERE phone = ?', [normalizedPhone]);
    const balanceBefore = wallet?.balance || 0;
    const balanceAfter = balanceBefore + topupAmount;

    if (wallet) {
      run(`UPDATE pos_wallets SET balance = ?, total_topup = total_topup + ?, updated_at = ? WHERE phone = ?`,
        [balanceAfter, topupAmount, getNow(), normalizedPhone]);
    } else {
      run(`INSERT INTO pos_wallets (phone, balance, total_topup, total_spent, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)`,
        [normalizedPhone, balanceAfter, topupAmount, getNow(), getNow()]);
    }

    run(`INSERT INTO pos_balance_transactions (customer_phone, customer_name, type, amount, balance_before, balance_after, payment_method, notes, created_by, created_at)
         VALUES (?, ?, 'topup', ?, ?, ?, ?, ?, ?, ?)`,
      [normalizedPhone, customer_name || null, topupAmount, balanceBefore, balanceAfter, payment_method || 'cash', notes || null, req.user.username, getNow()]);

    res.json({ success: true, balance: balanceAfter, amount: topupAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/wallets/deduct
 * Trừ tiền (khi mua hàng)
 */
router.post('/deduct', authenticate, (req, res) => {
  try {
    const { phone, amount, customer_name, order_code, notes } = req.body;

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'SĐT không hợp lệ' });
    }

    const deductAmount = parseInt(amount);
    if (!deductAmount || deductAmount <= 0) {
      return res.status(400).json({ error: 'Số tiền không hợp lệ' });
    }

    const wallet = queryOne('SELECT * FROM pos_wallets WHERE phone = ?', [normalizedPhone]);
    if (!wallet || wallet.balance < deductAmount) {
      return res.status(400).json({ error: 'Số dư không đủ', balance: wallet?.balance || 0 });
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - deductAmount;

    run(`UPDATE pos_wallets SET balance = ?, total_spent = total_spent + ?, updated_at = ? WHERE phone = ?`,
      [balanceAfter, deductAmount, getNow(), normalizedPhone]);

    run(`INSERT INTO pos_balance_transactions (customer_phone, customer_name, type, amount, balance_before, balance_after, notes, created_by, created_at)
         VALUES (?, ?, 'purchase', ?, ?, ?, ?, ?, ?)`,
      [normalizedPhone, customer_name || null, -deductAmount, balanceBefore, balanceAfter, notes || order_code || null, req.user.username, getNow()]);

    res.json({ success: true, balance: balanceAfter, deducted: deductAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/wallets/:phone/transactions
 * Lịch sử giao dịch
 */
router.get('/:phone/transactions', authenticate, (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    const { limit = 50 } = req.query;

    if (!phone) {
      return res.status(400).json({ error: 'SĐT không hợp lệ' });
    }

    const transactions = query(
      `SELECT * FROM pos_balance_transactions WHERE customer_phone = ? ORDER BY created_at DESC LIMIT ?`,
      [phone, parseInt(limit)]
    );

    res.json({ transactions, total: transactions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;