/**
 * POS System - Wallets Routes
 * API quản lý số dư khách hàng
 */

const express = require('express');
const { query, queryOne, run, beginTransaction } = require('../database');
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

    // Nguyên tử: cập nhật số dư + ghi sổ đi cùng một transaction
    const tx = await beginTransaction();
    try {
      if (wallet) {
        await tx.run(`UPDATE pos_wallets SET balance = ?, total_topup = total_topup + ?, updated_at = ? WHERE phone = ?`,
          [balanceAfter, topupAmount, getNow(), normalizedPhone]);
      } else {
        await tx.run(`INSERT INTO pos_wallets (phone, balance, total_topup, total_spent, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)`,
          [normalizedPhone, balanceAfter, topupAmount, getNow(), getNow()]);
      }
      await tx.run(`INSERT INTO pos_balance_transactions (customer_phone, customer_name, type, amount, balance_before, balance_after, payment_method, notes, created_by, created_at)
           VALUES (?, ?, 'topup', ?, ?, ?, ?, ?, ?, ?)`,
        [normalizedPhone, customer_name || null, topupAmount, balanceBefore, balanceAfter, payment_method || 'cash', notes || null, req.user.username, getNow()]);
      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    }

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

    const tx = await beginTransaction();
    try {
      await tx.run(`UPDATE pos_wallets SET balance = ?, total_spent = total_spent + ?, updated_at = ? WHERE phone = ?`,
        [balanceAfter, deductAmount, getNow(), normalizedPhone]);
      await tx.run(`INSERT INTO pos_balance_transactions (customer_phone, customer_name, type, amount, balance_before, balance_after, notes, created_by, created_at)
           VALUES (?, ?, 'purchase', ?, ?, ?, ?, ?, ?)`,
        [normalizedPhone, customer_name || null, -deductAmount, balanceBefore, balanceAfter, notes || order_code || null, req.user.username, getNow()]);
      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    }

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

    const tx = await beginTransaction();
    try {
      if (wallet) {
        if (adjustAmount > 0) {
          await tx.run(`UPDATE pos_wallets SET balance = ?, total_topup = total_topup + ?, updated_at = ? WHERE phone = ?`,
            [balanceAfter, adjustAmount, getNow(), normalizedPhone]);
        } else {
          await tx.run(`UPDATE pos_wallets SET balance = ?, total_spent = total_spent + ?, updated_at = ? WHERE phone = ?`,
            [balanceAfter, Math.abs(adjustAmount), getNow(), normalizedPhone]);
        }
      } else {
        await tx.run(`INSERT INTO pos_wallets (phone, balance, total_topup, total_spent, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)`,
          [normalizedPhone, balanceAfter, adjustAmount > 0 ? adjustAmount : 0, getNow(), getNow()]);
      }
      await tx.run(`INSERT INTO pos_balance_transactions (customer_phone, customer_name, type, amount, balance_before, balance_after, notes, created_by, created_at)
           VALUES (?, ?, "adjust", ?, ?, ?, ?, ?, ?)`,
        [normalizedPhone, customer_name || null, adjustAmount, balanceBefore, balanceAfter, reason, req.user.username, getNow()]);
      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    }

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

/**
 * Đối soát: tính lại số dư = TỔNG ledger theo SĐT, ghi lại cho khớp.
 * Đây là lưới an toàn để số dư lưu-sẵn không bao giờ trôi khỏi sổ.
 */
async function reconcileWallet(phone) {
  const row = await queryOne(
    `SELECT COALESCE(SUM(amount), 0) AS ledger_sum FROM pos_balance_transactions WHERE customer_phone = ?`,
    [phone]
  );
  const ledgerSum = row?.ledger_sum || 0;
  const wallet = await queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [phone]);
  const before = wallet ? wallet.balance : null;
  if (wallet) {
    await run(`UPDATE pos_wallets SET balance = ?, updated_at = ? WHERE phone = ?`,
      [ledgerSum, getNow(), phone]);
  } else {
    await run(`INSERT INTO pos_wallets (phone, balance, total_topup, total_spent, created_at, updated_at) VALUES (?, ?, 0, 0, ?, ?)`,
      [phone, ledgerSum, getNow(), getNow()]);
  }
  return { phone, balance_before: before, balance_after: ledgerSum, ledger_sum: ledgerSum };
}

/**
 * POST /api/pos/wallets/:phone/reconcile — đối soát 1 khách (owner)
 */
router.post('/:phone/reconcile', authenticate, checkPermission('adjust_balance'), async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    if (!phone) return res.status(400).json({ error: 'SĐT không hợp lệ' });
    const result = await reconcileWallet(phone);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/wallets/reconcile-all — đối soát toàn bộ (owner). Nút "kiểm lại sổ".
 */
router.post('/reconcile-all', authenticate, checkPermission('adjust_balance'), async (req, res) => {
  try {
    const phones = await query(`SELECT DISTINCT customer_phone AS phone FROM pos_balance_transactions WHERE customer_phone IS NOT NULL`);
    const results = [];
    for (const p of phones) {
      results.push(await reconcileWallet(p.phone));
    }
    const fixed = results.filter(r => r.balance_before !== r.balance_after).length;
    res.json({ success: true, checked: results.length, fixed, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
