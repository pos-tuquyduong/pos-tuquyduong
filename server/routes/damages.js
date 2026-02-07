/**
 * POS System - Damage Logs Routes
 * Quản lý sự cố hàng hỏng - Phương án "1 cửa" Manager
 * 
 * Flow: Manager xử lý trực tiếp từ chi tiết đơn → Lưu log
 */

const express = require('express');
const router = express.Router();
const { authenticate, checkPermission } = require('../middleware/auth');
const { query, queryOne, run } = require('../database');
const { isSxConfigured, callSxApi } = require('../utils/sxApi');

const DAMAGE_REASONS = {
  'damaged': 'Hỏng khi vận chuyển',
  'wrong_product': 'Giao sai sản phẩm',
  'rejected': 'Khách từ chối nhận',
  'quality': 'Chất lượng không đạt',
  'other': 'Lý do khác'
};

const DAMAGE_ACTIONS = {
  'refund': 'Hoàn tiền',
  'return_stock': 'Hoàn kho SX',
  'none': 'Chỉ ghi nhận'
};

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/pos/damages - Danh sách log sự cố
// ═══════════════════════════════════════════════════════════════════════════
router.get('/', authenticate, async (req, res) => {
  try {
    const { from, to, order_id } = req.query;
    
    let sql = `SELECT * FROM pos_damage_logs WHERE 1=1`;
    const params = [];
    
    if (from) {
      sql += ` AND date(created_at) >= ?`;
      params.push(from);
    }
    
    if (to) {
      sql += ` AND date(created_at) <= ?`;
      params.push(to);
    }
    
    if (order_id) {
      sql += ` AND order_id = ?`;
      params.push(order_id);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT 100`;
    
    const logs = await query(sql, params);
    
    res.json({ 
      success: true, 
      logs,
      reasons: DAMAGE_REASONS,
      actions: DAMAGE_ACTIONS
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/pos/damages/stats - Thống kê
// ═══════════════════════════════════════════════════════════════════════════
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query;
    const y = year || new Date().getFullYear();
    const m = month || (new Date().getMonth() + 1);
    const monthStr = `${y}-${String(m).padStart(2, '0')}`;
    
    // Tổng hợp tháng hiện tại
    const summary = await queryOne(`
      SELECT 
        COUNT(*) as total_cases,
        SUM(damage_value) as total_damage,
        SUM(refund_amount) as total_refund,
        SUM(CASE WHEN returned_to_stock = 1 THEN quantity ELSE 0 END) as total_returned
      FROM pos_damage_logs
      WHERE strftime('%Y-%m', created_at) = ?
    `, [monthStr]);
    
    // Theo lý do
    const byReason = await query(`
      SELECT reason, COUNT(*) as count, SUM(damage_value) as total
      FROM pos_damage_logs
      WHERE strftime('%Y-%m', created_at) = ?
      GROUP BY reason
    `, [monthStr]);
    
    // Theo sản phẩm
    const byProduct = await query(`
      SELECT product_code, product_name, SUM(quantity) as total_qty, SUM(damage_value) as total
      FROM pos_damage_logs
      WHERE strftime('%Y-%m', created_at) = ?
      GROUP BY product_code
      ORDER BY total_qty DESC
      LIMIT 10
    `, [monthStr]);
    
    res.json({
      success: true,
      month: monthStr,
      summary,
      byReason: byReason.map(r => ({ ...r, reason_label: DAMAGE_REASONS[r.reason] || r.reason })),
      byProduct
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/pos/damages - Xử lý sự cố (Manager/Owner only)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/', authenticate, checkPermission('manage_orders'), async (req, res) => {
  try {
    // Chỉ Manager/Owner
    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Chỉ Manager/Owner mới có quyền xử lý sự cố' });
    }

    const { order_id, product_code, quantity, reason, reason_note, action, refund_amount, return_to_stock } = req.body;
    
    if (!order_id || !product_code || !quantity || !reason || !action) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    
    // Lấy thông tin đơn hàng
    const order = await queryOne(`SELECT * FROM pos_orders WHERE id = ?`, [order_id]);
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }
    
    // Lấy thông tin SP trong đơn
    const item = await queryOne(
      `SELECT * FROM pos_order_items WHERE order_id = ? AND product_code = ?`,
      [order_id, product_code]
    );
    if (!item) {
      return res.status(400).json({ error: 'Sản phẩm không có trong đơn hàng' });
    }
    
    if (quantity > item.quantity) {
      return res.status(400).json({ error: `Số lượng tối đa: ${item.quantity}` });
    }
    
    const unit_price = item.unit_price || 0;
    const damage_value = unit_price * quantity;
    const finalRefund = action === 'refund' ? (refund_amount || damage_value) : 0;
    
    // Xử lý hoàn tiền
    if (action === 'refund' && finalRefund > 0 && order.customer_phone) {
      // Kiểm tra/tạo wallet
      let wallet = await queryOne(`SELECT * FROM pos_wallets WHERE phone = ?`, [order.customer_phone]);
      if (!wallet) {
        await run(`INSERT INTO pos_wallets (phone, balance) VALUES (?, 0)`, [order.customer_phone]);
        wallet = { balance: 0 };
      }
      
      // Cộng số dư
      await run(`UPDATE pos_wallets SET balance = balance + ?, updated_at = datetime('now') WHERE phone = ?`, 
        [finalRefund, order.customer_phone]);
      
      // Ghi log giao dịch
      await run(`
        INSERT INTO pos_balance_transactions (phone, type, amount, balance_after, note, created_by, created_at)
        VALUES (?, 'compensation', ?, ?, ?, ?, datetime('now'))
      `, [
        order.customer_phone,
        finalRefund,
        (wallet.balance || 0) + finalRefund,
        `Đền bù đơn ${order.code} - ${DAMAGE_REASONS[reason]} - ${product_code} x${quantity}`,
        req.user.display_name || req.user.username
      ]);
    }
    
    // Xử lý hoàn kho
    let stockReturned = 0;
    if ((action === 'return_stock' || return_to_stock) && isSxConfigured()) {
      try {
        await callSxApi('/api/pos/stock/return', {
          method: 'POST',
          body: JSON.stringify({
            product_code,
            quantity,
            reason: `Hoàn kho từ đơn ${order.code} - ${DAMAGE_REASONS[reason]}`
          })
        });
        stockReturned = 1;
      } catch (err) {
        console.log('Hoàn kho SX thất bại:', err.message);
      }
    }
    
    // Lưu log
    await run(`
      INSERT INTO pos_damage_logs (
        order_id, order_code, customer_phone, customer_name,
        product_code, product_name, quantity, unit_price, damage_value,
        reason, reason_note, action, refund_amount, returned_to_stock,
        processed_by, processed_by_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      order_id, order.code, order.customer_phone, order.customer_name,
      product_code, item.product_name, quantity, unit_price, damage_value,
      reason, reason_note || null, action, finalRefund, stockReturned,
      req.user.id, req.user.display_name || req.user.username
    ]);
    
    res.json({ 
      success: true, 
      message: action === 'refund' 
        ? `Đã hoàn ${finalRefund.toLocaleString()}đ vào số dư khách`
        : action === 'return_stock'
          ? `Đã hoàn ${quantity} sản phẩm về kho`
          : 'Đã ghi nhận sự cố'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
