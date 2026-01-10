/**
 * POS System - Report Routes
 * Báo cáo doanh thu, bán hàng
 * 
 * THIẾT KẾ: phone làm định danh chính
 * - Số dư từ pos_wallets
 * - Giao dịch từ pos_balance_transactions (theo phone)
 */

const express = require('express');
const { query, queryOne } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getToday } = require('../utils/helpers');

const router = express.Router();

/**
 * GET /api/pos/reports/daily
 * Báo cáo ngày
 */
router.get('/daily', authenticate, checkPermission('view_reports'), (req, res) => {
  try {
    const { date = getToday() } = req.query;

    // Tổng quan đơn hàng
    const orderStats = queryOne(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'cancelled' OR status = 'refunded' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'completed' THEN cash_amount ELSE 0 END) as cash_revenue,
        SUM(CASE WHEN status = 'completed' THEN transfer_amount ELSE 0 END) as transfer_revenue,
        SUM(CASE WHEN status = 'completed' THEN balance_amount ELSE 0 END) as balance_revenue,
        SUM(CASE WHEN status = 'completed' THEN discount ELSE 0 END) as total_discount
      FROM pos_orders
      WHERE DATE(created_at) = ?
    `, [date]);

    // Tổng quan số dư
    const balanceStats = queryOne(`
      SELECT 
        SUM(CASE WHEN type = 'topup' THEN amount ELSE 0 END) as total_topup,
        SUM(CASE WHEN type = 'refund' THEN amount ELSE 0 END) as total_refund,
        COUNT(CASE WHEN type = 'topup' THEN 1 END) as topup_count
      FROM pos_balance_transactions
      WHERE DATE(created_at) = ?
    `, [date]);

    // Sản phẩm bán chạy
    const topProducts = query(`
      SELECT 
        oi.product_code,
        oi.product_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_price) as total_revenue
      FROM pos_order_items oi
      JOIN pos_orders o ON oi.order_id = o.id
      WHERE DATE(o.created_at) = ? AND o.status = 'completed'
      GROUP BY oi.product_id
      ORDER BY total_quantity DESC
      LIMIT 10
    `, [date]);

    // Danh sách đơn hàng
    const orders = query(`
      SELECT o.*, 
        (SELECT COUNT(*) FROM pos_order_items WHERE order_id = o.id) as item_count
      FROM pos_orders o
      WHERE DATE(o.created_at) = ?
      ORDER BY o.created_at DESC
    `, [date]);

    res.json({
      date,
      order_stats: orderStats,
      balance_stats: balanceStats,
      top_products: topProducts,
      orders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/reports/sales
 * Báo cáo doanh thu theo khoảng thời gian
 */
router.get('/sales', authenticate, checkPermission('view_reports'), (req, res) => {
  try {
    const { from, to, group_by = 'day' } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'Vui lòng chọn khoảng thời gian' });
    }

    let dateFormat;
    switch (group_by) {
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'week':
        dateFormat = '%Y-W%W';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const sales = query(`
      SELECT 
        strftime('${dateFormat}', created_at) as period,
        COUNT(*) as order_count,
        SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) as revenue,
        SUM(CASE WHEN status = 'completed' THEN cash_amount ELSE 0 END) as cash,
        SUM(CASE WHEN status = 'completed' THEN transfer_amount ELSE 0 END) as transfer,
        SUM(CASE WHEN status = 'completed' THEN balance_amount ELSE 0 END) as balance,
        SUM(CASE WHEN status = 'completed' THEN discount ELSE 0 END) as discount
      FROM pos_orders
      WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
      GROUP BY period
      ORDER BY period
    `, [from, to]);

    // Tổng cộng
    const totals = queryOne(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'completed' THEN cash_amount ELSE 0 END) as total_cash,
        SUM(CASE WHEN status = 'completed' THEN transfer_amount ELSE 0 END) as total_transfer,
        SUM(CASE WHEN status = 'completed' THEN balance_amount ELSE 0 END) as total_balance
      FROM pos_orders
      WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
    `, [from, to]);

    res.json({
      from,
      to,
      group_by,
      sales,
      totals
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/reports/products
 * Báo cáo sản phẩm bán chạy
 */
router.get('/products', authenticate, checkPermission('view_reports'), (req, res) => {
  try {
    const { from, to, limit = 20 } = req.query;

    let sql = `
      SELECT 
        oi.product_id,
        oi.product_code,
        oi.product_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_price) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM pos_order_items oi
      JOIN pos_orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
    `;
    const params = [];

    if (from) {
      sql += ` AND DATE(o.created_at) >= ?`;
      params.push(from);
    }
    if (to) {
      sql += ` AND DATE(o.created_at) <= ?`;
      params.push(to);
    }

    sql += `
      GROUP BY oi.product_id
      ORDER BY total_quantity DESC
      LIMIT ?
    `;
    params.push(parseInt(limit));

    const products = query(sql, params);

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/reports/balance
 * Báo cáo số dư khách hàng - từ pos_wallets
 */
router.get('/balance', authenticate, checkPermission('view_reports'), (req, res) => {
  try {
    // Top khách có số dư cao
    const topBalance = query(`
      SELECT phone, balance, total_topup, total_spent
      FROM pos_wallets
      WHERE balance > 0
      ORDER BY balance DESC
      LIMIT 20
    `);

    // Tổng số dư trong hệ thống
    const totalBalance = queryOne(`
      SELECT 
        COALESCE(SUM(balance), 0) as total,
        COUNT(CASE WHEN balance > 0 THEN 1 END) as customer_count,
        COALESCE(SUM(total_topup), 0) as all_time_topup,
        COALESCE(SUM(total_spent), 0) as all_time_spent
      FROM pos_wallets
    `);

    // Giao dịch gần đây
    const recentTransactions = query(`
      SELECT *
      FROM pos_balance_transactions
      ORDER BY created_at DESC
      LIMIT 50
    `);

    res.json({
      total_balance: totalBalance?.total || 0,
      customer_with_balance: totalBalance?.customer_count || 0,
      all_time_topup: totalBalance?.all_time_topup || 0,
      all_time_spent: totalBalance?.all_time_spent || 0,
      top_balance: topBalance,
      recent_transactions: recentTransactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/reports/staff
 * Báo cáo theo nhân viên
 */
router.get('/staff', authenticate, checkPermission('view_reports'), (req, res) => {
  try {
    const { from, to } = req.query;

    let sql = `
      SELECT 
        created_by as staff,
        COUNT(*) as order_count,
        SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) as revenue,
        SUM(CASE WHEN status = 'cancelled' OR status = 'refunded' THEN 1 ELSE 0 END) as cancelled_count
      FROM pos_orders
      WHERE 1=1
    `;
    const params = [];

    if (from) {
      sql += ` AND DATE(created_at) >= ?`;
      params.push(from);
    }
    if (to) {
      sql += ` AND DATE(created_at) <= ?`;
      params.push(to);
    }

    sql += ` GROUP BY created_by ORDER BY revenue DESC`;

    const staffStats = query(sql, params);

    res.json(staffStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;