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
router.get('/', authenticate, async (req, res) => {
  try {
    const { has_balance } = req.query;
    let sql = 'SELECT * FROM pos_wallets';
    if (has_balance === 'true') {
      sql += ' WHERE balance > 0';
    }
    sql += ' ORDER BY balance DESC';
    const wallets = await query(sql);
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/wallets/:phone
 * Lấy wallet theo SĐT
 */
router.get('/:phone', authenticate, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) {
      return res.status(400).json({ error: 'SĐT không hợp lệ' });
    }

    let wallet = await queryOne('SELECT * FROM pos_wallets WHERE phone = ?', [phone]);
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
router.post('/topup', authenticate, checkPermission('topup_balance'), async (req, res) => {
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

    let wallet = await queryOne('SELECT * FROM pos_wallets WHERE phone = ?', [normalizedPhone]);
    const balanceBefore = wallet?.balance || 0;
    const balanceAfter = balanceBefore + topupAmount;

    if (wallet) {
      await run(`UPDATE pos_wallets SET balance = ?, total_topup = total_topup + ?, updated_at = ? WHERE phone = ?`,
        [balanceAfter, topupAmount, getNow(), normalizedPhone]);
    } else {
      await run(`INSERT INTO pos_wallets (phone, balance, total_topup, total_spent, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)`,
        [normalizedPhone, balanceAfter, topupAmount, getNow(), getNow()]);
    }

    await run(`INSERT INTO pos_balance_transactions (customer_phone, customer_name, type, amount, balance_before, balance_after, payment_method, notes, created_by, created_at)
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
router.post('/deduct', authenticate, async (req, res) => {
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

    const wallet = await queryOne('SELECT * FROM pos_wallets WHERE phone = ?', [normalizedPhone]);
    if (!wallet || wallet.balance < deductAmount) {
      return res.status(400).json({ error: 'Số dư không đủ', balance: wallet?.balance || 0 });
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - deductAmount;

    await run(`UPDATE pos_wallets SET balance = ?, total_spent = total_spent + ?, updated_at = ? WHERE phone = ?`,
      [balanceAfter, deductAmount, getNow(), normalizedPhone]);

    await run(`INSERT INTO pos_balance_transactions (customer_phone, customer_name, type, amount, balance_before, balance_after, notes, created_by, created_at)
         VALUES (?, ?, 'purchase', ?, ?, ?, ?, ?, ?)`,
      [normalizedPhone, customer_name || null, -deductAmount, balanceBefore, balanceAfter, notes || order_code || null, req.user.username, getNow()]);

    res.json({ success: true, balance: balanceAfter, deducted: deductAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**

/**
 * POST /api/pos/wallets/adjust
 * Điều chỉnh số dư (chỉ owner)
 */
router.post("/adjust", authenticate, checkPermission("adjust_balance"), async (req, res) => {
  try {
    const { phone, amount, customer_name, reason } = req.body;

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: "SĐT không hợp lệ" });
    }

    const adjustAmount = parseInt(amount);
    if (!adjustAmount || adjustAmount === 0) {
      return res.status(400).json({ error: "Số tiền điều chỉnh không hợp lệ" });
    }

    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: "Vui lòng nhập lý do (tối thiểu 3 ký tự)" });
    }

    let wallet = await queryOne("SELECT * FROM pos_wallets WHERE phone = ?", [normalizedPhone]);
    const balanceBefore = wallet?.balance || 0;
    const balanceAfter = balanceBefore + adjustAmount;

    if (balanceAfter < 0) {
      return res.status(400).json({ error: `Không thể giảm. Số dư hiện tại: ${balanceBefore.toLocaleString()}đ` });
    }

    if (wallet) {
      if (adjustAmount > 0) {
        await run(`UPDATE pos_wallets SET balance = ?, total_topup = total_topup + ?, updated_at = ? WHERE phone = ?`,
          [balanceAfter, adjustAmount, getNow(), normalizedPhone]);
      } else {
        await run(`UPDATE pos_wallets SET balance = ?, total_spent = total_spent + ?, updated_at = ? WHERE phone = ?`,
          [balanceAfter, Math.abs(adjustAmount), getNow(), normalizedPhone]);
      }
    } else {
      await run(`INSERT INTO pos_wallets (phone, balance, total_topup, total_spent, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)`,
        [normalizedPhone, balanceAfter, adjustAmount > 0 ? adjustAmount : 0, getNow(), getNow()]);
    }

    await run(`INSERT INTO pos_balance_transactions (customer_phone, customer_name, type, amount, balance_before, balance_after, notes, created_by, created_at)
         VALUES (?, ?, "adjust", ?, ?, ?, ?, ?, ?)`,
      [normalizedPhone, customer_name || null, adjustAmount, balanceBefore, balanceAfter, reason, req.user.username, getNow()]);

    res.json({ success: true, balance: balanceAfter, adjusted: adjustAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/wallets/:phone/transactions
 * Lịch sử giao dịch
 */
router.get('/:phone/transactions', authenticate, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    const { limit = 50 } = req.query;

    if (!phone) {
      return res.status(400).json({ error: 'SĐT không hợp lệ' });
    }

    const transactions = await query(
      `SELECT * FROM pos_balance_transactions WHERE customer_phone = ? ORDER BY created_at DESC LIMIT ?`,
      [phone, parseInt(limit)]
    );

    res.json({ transactions, total: transactions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
