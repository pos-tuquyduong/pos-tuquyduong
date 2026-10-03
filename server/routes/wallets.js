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
 * P26b — CHỖ DUY NHẤT ghi pos_wallets (bộ kiểm E12 canh), trừ đối soát. Gọi BÊN TRONG giao dịch ghi (beginTransaction
 * là khoá ghi độc quyền): số dư trước/sau đọc trong giao dịch, cộng TƯƠNG ĐỐI, ví chưa có thì tạo, ghi dòng sổ cùng lúc.
 * Trước đây mỗi route đọc số dư NGOÀI giao dịch rồi `SET balance = ?` → hai người bấm gần nhau thì mất một khoản.
 * khongAm: số dư sau < 0 → KHÔNG ghi gì, trả { thieu: true } để chỗ gọi rollback + 400 SO_DU_KHONG_DU.
 * cot/soCot: cột tổng (total_topup / total_spent) cộng thêm — duyệt hoàn, báo hỏng không truyền (như trước P26b).
 */
async function ghiVi(tx, { phone, ten = null, loai, soTien, orderId = null, cachTra = 'cash', ghiChu = null, nguoi, luc = getNow(),
  cot = null, soCot = 0, khongAm = false }) {
  const w = await tx.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [phone]);
  const truoc = Number(w?.balance || 0);
  const sau = truoc + soTien;
  if (khongAm && sau < 0) return { truoc, sau, thieu: true };
  const nap = cot === 'total_topup' ? soCot : 0, tieu = cot === 'total_spent' ? soCot : 0;
  const u = await tx.run(`UPDATE pos_wallets SET balance = balance + ?, total_topup = total_topup + ?, total_spent = total_spent + ?,
    updated_at = ? WHERE phone = ?`, [soTien, nap, tieu, luc, phone]);
  if (!u.changes) {
    await tx.run(`INSERT INTO pos_wallets (phone, balance, total_topup, total_spent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [phone, soTien, nap, tieu, luc, luc]);
  }
  const r = await tx.run(`INSERT INTO pos_balance_transactions (customer_phone, customer_name, type, amount, balance_before, balance_after,
      order_id, payment_method, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [phone, ten, loai, soTien, truoc, sau, orderId, cachTra, ghiChu, nguoi, luc]);
  return { truoc, sau, id: r.lastInsertRowid };
}

/** P26b (chủ quán chốt Q1 03.10.2026): kho bận → 409 KHO_BAN — giao dịch đã rollback, lệnh này chưa ghi gì. Lỗi khác → 500. */
function loiGhi(res, err) {
  if (err && err.code === 'SQLITE_BUSY') {
    return res.status(409).json({ code: 'KHO_BAN', error: 'Đang có thao tác khác ghi sổ — bấm lại' });
  }
  return res.status(500).json({ error: err.message });
}

/** Chạy `lam(tx)` trong một giao dịch ghi: lam trả về gì thì trả nấy; ném lỗi thì rollback rồi ném tiếp. */
async function trongGiaoDich(lam) {
  const tx = await beginTransaction();
  try {
    const kq = await lam(tx);
    if (kq && kq.huy) await tx.rollback(); else await tx.commit();
    return kq;
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

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

    const kq = await trongGiaoDich((tx) => ghiVi(tx, { phone: normalizedPhone, ten: customer_name || null, loai: 'topup',
      soTien: topupAmount, cachTra: payment_method || 'cash', ghiChu: notes || null, nguoi: req.user.username,
      cot: 'total_topup', soCot: topupAmount }));

    res.json({ success: true, balance: kq.sau, amount: topupAmount });
  } catch (err) {
    loiGhi(res, err);
  }
});

/**
 * POST /api/pos/wallets/deduct
 * Trừ tiền (khi mua hàng)
 */
// POS-ANTOAN-v1: tru so du thu cong phai co quyen `adjust_balance`.
// Ban hang khong di qua day (orders.js tu cap nhat vi ~886) nen khoa lai
// KHONG anh huong quay.
router.post('/deduct', authenticate, checkPermission('adjust_balance'), async (req, res) => {
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

    const kq = await trongGiaoDich(async (tx) => {
      const r = await ghiVi(tx, { phone: normalizedPhone, ten: customer_name || null, loai: 'purchase', soTien: -deductAmount,
        ghiChu: notes || order_code || null, nguoi: req.user.username, cot: 'total_spent', soCot: deductAmount, khongAm: true });
      return r.thieu ? { ...r, huy: true } : r;
    });
    if (kq.thieu) {
      return res.status(400).json({ error: 'Số dư không đủ', code: 'SO_DU_KHONG_DU', balance: kq.truoc });
    }

    res.json({ success: true, balance: kq.sau, deducted: deductAmount });
  } catch (err) {
    loiGhi(res, err);
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

    const kq = await trongGiaoDich(async (tx) => {
      const r = await ghiVi(tx, { phone: normalizedPhone, ten: customer_name || null, loai: 'adjust', soTien: adjustAmount,
        ghiChu: reason, nguoi: req.user.username, cot: adjustAmount > 0 ? 'total_topup' : 'total_spent',
        soCot: Math.abs(adjustAmount), khongAm: true });
      return r.thieu ? { ...r, huy: true } : r;
    });
    if (kq.thieu) {
      return res.status(400).json({ error: `Không thể giảm. Số dư hiện tại: ${kq.truoc.toLocaleString()}đ`, code: 'SO_DU_KHONG_DU' });
    }

    res.json({ success: true, balance: kq.sau, adjusted: adjustAmount });
  } catch (err) {
    loiGhi(res, err);
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
 * POS-P21-v1: CHỈ các loại dòng này làm đổi pos_wallets.balance, nên CHỈ chúng
 * được cộng khi đối soát. Danh sách TRẮNG — chủ quán duyệt 25.09.2026.
 * 'debt_payment' (pay-debt) là tiền mặt/chuyển khoản trả nợ, KHÔNG phải tiền
 * trong ví: cộng vào là ví được cộng khống. Loại MỚI mặc định KHÔNG tính —
 * muốn tính phải thêm vào đây, có chủ quán duyệt.
 */
const LOAI_TINH_VAO_VI = ['topup', 'purchase', 'refund', 'adjust', 'compensation'];
const DK_LOAI_VI = `type IN (${LOAI_TINH_VAO_VI.map(() => '?').join(', ')})`;

/**
 * Đối soát: tính lại số dư = TỔNG ledger (chỉ LOAI_TINH_VAO_VI) theo SĐT, ghi lại cho khớp.
 * Đây là lưới an toàn để số dư lưu-sẵn không bao giờ trôi khỏi sổ.
 */
async function reconcileWallet(phone) {
  // P26b: đọc tổng sổ và ghi trong CÙNG một giao dịch ghi — bán đơn không xen vào giữa được. Ghi TUYỆT ĐỐI có chủ đích
  // (số dư := tổng sổ) — chỗ duy nhất ngoài ghiVi được ghi pos_wallets (bộ kiểm E12).
  return trongGiaoDich(async (tx) => {
    const row = await tx.queryOne(
      `SELECT COALESCE(SUM(amount), 0) AS ledger_sum FROM pos_balance_transactions WHERE customer_phone = ? AND ${DK_LOAI_VI}`,
      [phone, ...LOAI_TINH_VAO_VI]
    );
    const ledgerSum = row?.ledger_sum || 0;
    const wallet = await tx.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [phone]);
    const before = wallet ? wallet.balance : null;
    if (wallet) {
      await tx.run(`UPDATE pos_wallets SET balance = ?, updated_at = ? WHERE phone = ?`,
        [ledgerSum, getNow(), phone]);
    } else {
      await tx.run(`INSERT INTO pos_wallets (phone, balance, total_topup, total_spent, created_at, updated_at) VALUES (?, ?, 0, 0, ?, ?)`,
        [phone, ledgerSum, getNow(), getNow()]);
    }
    return { phone, balance_before: before, balance_after: ledgerSum, ledger_sum: ledgerSum };
  });
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
    loiGhi(res, err);
  }
});

/**
 * POST /api/pos/wallets/reconcile-all — đối soát toàn bộ (quyền adjust_balance).
 * Chưa có màn hình nào gọi route này (grep "reconcile" trong client/src = 0, 26.09.2026)
 * — chỉ tới được bằng gọi thẳng API.
 */
router.post('/reconcile-all', authenticate, checkPermission('adjust_balance'), async (req, res) => {
  try {
    // P21: khách chỉ có dòng debt_payment không có ví — đừng đẻ ví cho họ.
    const phones = await query(
      `SELECT DISTINCT customer_phone AS phone FROM pos_balance_transactions WHERE customer_phone IS NOT NULL AND ${DK_LOAI_VI}`,
      LOAI_TINH_VAO_VI
    );
    const results = [];
    for (const p of phones) {
      results.push(await reconcileWallet(p.phone));
    }
    const fixed = results.filter(r => r.balance_before !== r.balance_after).length;
    res.json({ success: true, checked: results.length, fixed, results });
  } catch (err) {
    loiGhi(res, err);
  }
});

module.exports = router;
module.exports.ghiVi = ghiVi;
module.exports.loiGhi = loiGhi;
module.exports.trongGiaoDich = trongGiaoDich;
