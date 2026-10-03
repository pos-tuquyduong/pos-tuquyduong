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
const { ghiVi, loiGhi, trongGiaoDich } = require('./wallets');

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
    
    const soLuong = Number(quantity);
    if (!Number.isInteger(soLuong) || soLuong <= 0) {
      return res.status(400).json({ error: 'Số lượng không hợp lệ' });
    }
    const soGui = Number(refund_amount || 0);
    if (!Number.isFinite(soGui) || soGui < 0) {
      return res.status(400).json({ error: 'Số tiền đền không hợp lệ' });
    }

    // P26b: MÁY CHỦ quyết số tiền đền (chủ quán chốt C1 + Q6 03.10.2026). Gom MỌI dòng cùng mã trong đơn: cộng dồn số lượng
    // đã báo (mọi action) ≤ tổng số lượng; tiền mỗi lần ≤ số lượng × đơn giá CAO NHẤT các dòng đó; tổng tiền đền cộng dồn
    // ≤ tổng giá các dòng (món lấy từ gói giá 0 → không đền tiền). Đọc + ghi ví + sổ + log trong CÙNG một giao dịch ghi.
    const loi = (status, error, code) => ({ huy: true, status, body: { error, code } });
    const kq = await trongGiaoDich(async (tx) => {
      const order = await tx.queryOne(`SELECT * FROM pos_orders WHERE id = ?`, [order_id]);
      if (!order) return loi(404, 'Không tìm thấy đơn hàng');
      const dong = await tx.queryOne(`SELECT MIN(product_name) AS ten, COALESCE(SUM(quantity), 0) AS sl,
          COALESCE(MAX(unit_price), 0) AS gia, COALESCE(SUM(unit_price * quantity), 0) AS tien, COUNT(*) AS n
        FROM pos_order_items WHERE order_id = ? AND product_code = ?`, [order_id, product_code]);
      if (!Number(dong.n)) return loi(400, 'Sản phẩm không có trong đơn hàng');
      const da = await tx.queryOne(`SELECT COALESCE(SUM(quantity), 0) AS sl, COALESCE(SUM(refund_amount), 0) AS tien
        FROM pos_damage_logs WHERE order_id = ? AND product_code = ?`, [order_id, product_code]);
      const conLai = Number(dong.sl) - Number(da.sl);
      if (soLuong > conLai) return loi(400, `Số lượng tối đa: ${Math.max(0, conLai)}`, 'VUOT_SO_LUONG');
      const gia = Number(dong.gia);
      const damage_value = gia * soLuong;
      const finalRefund = action === 'refund' ? (soGui || damage_value) : 0;
      if (action === 'refund') {
        if (order.status !== 'completed') return loi(400, 'Đơn đã huỷ / đã hoàn — không đền tiền được', 'DON_KHONG_DEN_DUOC');
        if (finalRefund > damage_value || Number(da.tien) + finalRefund > Number(dong.tien)) {
          return loi(400, `Tiền đền tối đa: ${Math.max(0, Math.min(damage_value, Number(dong.tien) - Number(da.tien))).toLocaleString()}đ`, 'VUOT_GIA');
        }
        if (finalRefund > 0 && order.customer_phone) {
          await ghiVi(tx, { phone: order.customer_phone, ten: order.customer_name || null, loai: 'compensation', soTien: finalRefund,
            orderId: order.id, ghiChu: `Đền bù đơn ${order.code} - ${DAMAGE_REASONS[reason]} - ${product_code} x${soLuong}`,
            nguoi: req.user.display_name || req.user.username });
        }
      }
      const log = await tx.run(`
        INSERT INTO pos_damage_logs (
          order_id, order_code, customer_phone, customer_name,
          product_code, product_name, quantity, unit_price, damage_value,
          reason, reason_note, action, refund_amount, returned_to_stock,
          processed_by, processed_by_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, datetime('now'))
      `, [
        order_id, order.code, order.customer_phone, order.customer_name,
        product_code, dong.ten, soLuong, gia, damage_value,
        reason, reason_note || null, action, finalRefund,
        req.user.id, req.user.display_name || req.user.username
      ]);
      return { order, finalRefund, logId: log.lastInsertRowid };
    });
    if (kq.huy) return res.status(kq.status).json(kq.body);
    const { order, finalRefund } = kq;

    // Xử lý hoàn kho (ngoài giao dịch — gọi SX, như trước P26b)
    if ((action === 'return_stock' || return_to_stock) && isSxConfigured()) {
      try {
        await callSxApi('/api/pos/stock/return', {
          method: 'POST',
          body: JSON.stringify({
            product_code,
            quantity: soLuong,
            reason: `Hoàn kho từ đơn ${order.code} - ${DAMAGE_REASONS[reason]}`
          })
        });
        await run('UPDATE pos_damage_logs SET returned_to_stock = 1 WHERE id = ?', [kq.logId]);
      } catch (err) {
        console.log('Hoàn kho SX thất bại:', err.message);
      }
    }

    res.json({ 
      success: true, 
      message: action === 'refund' 
        ? `Đã hoàn ${finalRefund.toLocaleString()}đ vào số dư khách`
        : action === 'return_stock'
          ? `Đã hoàn ${soLuong} sản phẩm về kho`
          : 'Đã ghi nhận sự cố'
    });
  } catch (err) {
    loiGhi(res, err);
  }
});

module.exports = router;
