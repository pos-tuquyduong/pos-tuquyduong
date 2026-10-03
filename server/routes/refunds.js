/**
 * POS System - Refund Routes
 * Quản lý yêu cầu hoàn tiền
 * 
 * THIẾT KẾ: phone làm định danh chính
 * - Hoàn tiền vào pos_wallets (theo phone)
 * 
 * TURSO MIGRATION: Tất cả database calls dùng await
 */

const express = require('express');
const { query } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');
const { ghiVi, loiGhi, trongGiaoDich } = require('./wallets');

const router = express.Router();

// P26b (chủ quán chốt Q8 03.10.2026): đơn mua gói / thẻ hội viên KHÔNG hoàn qua yêu cầu — duyệt hoàn không huỷ gói, thẻ,
// không hoàn kho; chỉ Huỷ đơn làm đủ. Chặn ở CẢ tạo lẫn duyệt (yêu cầu cũ có sẵn trong kho vẫn bị chặn lúc duyệt).
const DON_CO_GOI = {
  status: 400,
  body: { code: 'DON_CO_GOI', error: 'Đơn có gói / thẻ hội viên — không hoàn qua yêu cầu, hãy dùng Huỷ đơn' },
};
const coGoi = async (tx, orderId) => !!(await tx.queryOne(
  `SELECT 1 FROM pos_customer_packages WHERE order_id = ? UNION ALL SELECT 1 FROM pos_membership_purchases WHERE order_id = ? LIMIT 1`,
  [orderId, orderId]));
const loi = (status, error, code) => ({ huy: true, status, body: code ? { error, code } : { error } });

/**
 * GET /api/pos/refunds
 * Danh sách yêu cầu hoàn tiền
 */
router.get('/', authenticate, async (req, res) => {
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

    const refunds = await query(sql, params);

    // Đếm theo trạng thái
    const stats = await query(`
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
router.get('/pending', authenticate, checkPermission('approve_refund'), async (req, res) => {
  try {
    const refunds = await query(`
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
router.post('/', authenticate, async (req, res) => {
  try {
    const { order_id, reason } = req.body;

    // P26b: đọc đơn + kiểm trùng TRONG giao dịch ghi — hai người bấm cùng lúc không đẻ được hai yêu cầu chờ duyệt.
    const kq = await trongGiaoDich(async (tx) => {
      const order = await tx.queryOne('SELECT * FROM pos_orders WHERE id = ?', [order_id]);
      if (!order) return loi(404, 'Không tìm thấy đơn hàng');
      if (order.status === 'cancelled' || order.status === 'refunded') return loi(400, 'Đơn hàng đã được hủy/hoàn tiền');
      if (!order.balance_amount || order.balance_amount <= 0) return loi(400, 'Đơn hàng không thanh toán bằng số dư');
      if (await coGoi(tx, order.id)) return { huy: true, ...DON_CO_GOI };
      const existing = await tx.queryOne('SELECT id FROM pos_refund_requests WHERE order_id = ? AND status = ?', [order_id, 'pending']);
      if (existing) return loi(400, 'Đã có yêu cầu hoàn tiền đang chờ duyệt');
      return tx.run(`
        INSERT INTO pos_refund_requests (
          order_id, customer_phone, order_total, balance_paid, refund_amount,
          status, requested_by, requested_at, reason
        ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
      `, [order_id, order.customer_phone, order.total, order.balance_amount, order.balance_amount,
        req.user.username, getNow(), reason || 'Yêu cầu hoàn tiền']);
    });
    if (kq.huy) return res.status(kq.status).json(kq.body);

    res.json({
      success: true,
      refund_id: kq.lastInsertRowid,
      message: 'Đã tạo yêu cầu hoàn tiền, chờ admin duyệt'
    });
  } catch (err) {
    loiGhi(res, err);
  }
});

/**
 * POST /api/pos/refunds/:id/approve
 * Phê duyệt hoàn tiền - cộng vào pos_wallets
 */
router.post('/:id/approve', authenticate, checkPermission('approve_refund'), async (req, res) => {
  try {
    // P26b: mọi thứ TRONG một giao dịch ghi; chiếm yêu cầu và đổi trạng thái đơn bằng UPDATE có điều kiện + kiểm số dòng
    // đổi — duyệt hai lần, duyệt đơn đã huỷ/đã hoàn đều thua 400, ví không đổi.
    const now = getNow();
    const kq = await trongGiaoDich(async (tx) => {
      const refund = await tx.queryOne('SELECT * FROM pos_refund_requests WHERE id = ?', [req.params.id]);
      if (!refund) return loi(404, 'Không tìm thấy yêu cầu hoàn tiền');
      if (!refund.customer_phone) return loi(400, 'Không có SĐT khách hàng');
      const chiem = await tx.run(`UPDATE pos_refund_requests SET status = 'approved', processed_by = ?, processed_at = ?
        WHERE id = ? AND status = 'pending'`, [req.user.username, now, refund.id]);
      if (chiem.changes !== 1) return loi(400, 'Yêu cầu này đã được xử lý', 'YEU_CAU_DA_XU_LY');
      if (await coGoi(tx, refund.order_id)) return { huy: true, ...DON_CO_GOI };
      const don = await tx.run(`UPDATE pos_orders SET status = 'refunded' WHERE id = ? AND status = 'completed'`, [refund.order_id]);
      if (don.changes !== 1) return loi(400, 'Đơn không còn ở trạng thái hoàn được (đã huỷ / đã hoàn)', 'DON_KHONG_CON_HOAN_DUOC');
      const vi = await ghiVi(tx, { phone: refund.customer_phone, loai: 'refund', soTien: refund.refund_amount, orderId: refund.order_id,
        ghiChu: 'Hoàn tiền đơn hàng (duyệt)', nguoi: req.user.username, luc: now });
      await tx.run('UPDATE pos_refund_requests SET balance_transaction_id = ? WHERE id = ?', [vi.id, refund.id]);
      return { ...vi, refund_amount: refund.refund_amount };
    });
    if (kq.huy) return res.status(kq.status).json(kq.body);

    res.json({
      success: true,
      message: `Đã hoàn ${kq.refund_amount.toLocaleString()}đ vào số dư`,
      new_balance: kq.sau
    });
  } catch (err) {
    loiGhi(res, err);
  }
});

/**
 * POST /api/pos/refunds/:id/reject
 * Từ chối hoàn tiền
 */
router.post('/:id/reject', authenticate, checkPermission('approve_refund'), async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Vui lòng nhập lý do từ chối' });
    }

    // P26b: trong giao dịch ghi + UPDATE có điều kiện — từ chối không đè lên yêu cầu vừa được duyệt.
    const kq = await trongGiaoDich(async (tx) => {
      const refund = await tx.queryOne('SELECT id FROM pos_refund_requests WHERE id = ?', [req.params.id]);
      if (!refund) return loi(404, 'Không tìm thấy yêu cầu hoàn tiền');
      const doi = await tx.run(`UPDATE pos_refund_requests SET status = 'rejected', processed_by = ?, processed_at = ?, rejection_reason = ?
        WHERE id = ? AND status = 'pending'`, [req.user.username, getNow(), reason, refund.id]);
      return doi.changes === 1 ? doi : loi(400, 'Yêu cầu này đã được xử lý', 'YEU_CAU_DA_XU_LY');
    });
    if (kq.huy) return res.status(kq.status).json(kq.body);

    res.json({
      success: true,
      message: 'Đã từ chối yêu cầu hoàn tiền'
    });
  } catch (err) {
    loiGhi(res, err);
  }
});

module.exports = router;
