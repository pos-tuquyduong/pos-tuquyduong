/**
 * POS System - Customer Routes
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { 
  QR_TIEN_TO,
  normalizePhone, 
  getNow 
} = require('../utils/helpers');
const { boMat } = require('../utils/pinKhach'); // P3
const { taoKhach } = require('../utils/khachMoi'); // KHACH-APP-1 (C)
const { loiGhi } = require('./wallets');

const router = express.Router();

// P3 (E): không câu trả nào của /customers lộ `password` / `pin_code` (băm vẫn là bí mật) — bọc res.json MỘT chỗ cho mọi đường,
// kể cả đường thêm sau; thay bằng `co_pin` để quầy biết khách đã đặt PIN.
router.use((req, res, next) => {
  const json = res.json.bind(res);
  res.json = (than) => json(boMat(than));
  next();
});

/**
 * GET /api/pos/customers
 * Danh sách khách hàng
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      sync_status, 
      customer_type, 
      search,
      page = 1,
      limit = 50
    } = req.query;

    let sql = `
      SELECT c.*,
        (SELECT COUNT(*) FROM pos_customers WHERE parent_phone = c.phone) as children_count
      FROM pos_customers c
      WHERE 1=1
    `;
    const params = [];

    if (sync_status) {
      sql += ` AND c.sync_status = ?`;
      params.push(sync_status);
    }

    if (customer_type) {
      sql += ` AND c.customer_type = ?`;
      params.push(customer_type);
    }

    if (search) {
      sql += ` AND (c.phone LIKE ? OR c.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sắp xếp: khách chính trước, rồi theo tên
    sql += ` ORDER BY c.parent_phone IS NOT NULL, c.name`;
    
    // Pagination
    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const customers = await query(sql, params);

    // Đếm tổng
    let countSql = `SELECT COUNT(*) as total FROM pos_customers WHERE 1=1`;
    const countParams = [];
    
    if (sync_status) {
      countSql += ` AND sync_status = ?`;
      countParams.push(sync_status);
    }
    if (customer_type) {
      countSql += ` AND customer_type = ?`;
      countParams.push(customer_type);
    }
    if (search) {
      countSql += ` AND (phone LIKE ? OR name LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const totalResult = await queryOne(countSql, countParams);
    const total = totalResult?.total || 0;

    // Thống kê theo sync_status
    const stats = await query(`
      SELECT sync_status, COUNT(*) as count 
      FROM pos_customers 
      GROUP BY sync_status
    `);

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      },
      stats: stats.reduce((acc, s) => {
        acc[s.sync_status] = s.count;
        return acc;
      }, {})
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/customers/stats
 * Thống kê khách hàng
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN sync_status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN sync_status = 'exported' THEN 1 ELSE 0 END) as exported_count,
        SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) as synced_count,
        SUM(CASE WHEN sync_status = 'retail_only' THEN 1 ELSE 0 END) as retail_count,
        SUM(balance) as total_balance
      FROM pos_customers
    `);
    const stats = statsResult[0];

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/**
 * GET /api/pos/customers/search
 * Autocomplete search khách hàng - trả về name, phone, balance, debt, discount
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 1) {
      return res.json([]);
    }

    const searchTerm = `%${q}%`;

    // Query khách hàng + số dư + tổng nợ + chiết khấu
    const customers = await query(`
      SELECT 
        c.id,
        c.phone,
        c.name,
        c.parent_phone,
        c.relationship,
        c.discount_type,
        c.discount_value,
        c.discount_note,
        COALESCE(w.balance, 0) as balance,
        COALESCE(debt.total_debt, 0) as total_debt,
        COALESCE(debt.pending_orders, 0) as pending_orders
      FROM pos_customers c
      LEFT JOIN pos_wallets w ON c.phone = w.phone
      LEFT JOIN (
        SELECT 
          customer_phone,
          SUM(debt_amount) as total_debt,
          COUNT(*) as pending_orders
        FROM pos_orders 
        WHERE debt_amount > 0 AND status != 'cancelled'
        GROUP BY customer_phone
      ) debt ON c.phone = debt.customer_phone
      WHERE c.name LIKE ? OR c.phone LIKE ?
      ORDER BY 
        CASE WHEN c.name LIKE ? THEN 0 ELSE 1 END,
        c.name
      LIMIT ?
    `, [searchTerm, searchTerm, q + '%', parseInt(limit)]);

    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/**
 * GET /api/pos/customers/:id
 * Chi tiết khách hàng
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const customer = await queryOne(
      'SELECT * FROM pos_customers WHERE id = ?',
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    // Lấy danh sách người nhận (con)
    const children = await query(
      'SELECT id, phone, name, relationship FROM pos_customers WHERE parent_phone = ?',
      [customer.phone]
    );

    // Lấy khách chính (cha)
    let parent = null;
    if (customer.parent_phone) {
      parent = await queryOne(
        'SELECT id, phone, name FROM pos_customers WHERE phone = ?',
        [customer.parent_phone]
      );
    }

    // Lấy giao dịch gần đây
    const recentTransactions = await query(
      `SELECT * FROM pos_balance_transactions 
       WHERE customer_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [customer.id]
    );

    // Lấy đơn hàng gần đây
    const recentOrders = await query(
      `SELECT * FROM pos_orders 
       WHERE customer_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [customer.id]
    );

    res.json({
      ...customer,
      children,
      parent,
      recent_transactions: recentTransactions,
      recent_orders: recentOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/customers/phone/:phone
 * Tìm theo SĐT (exact match)
 */
router.get('/phone/:phone', authenticate, async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    
    const customer = await queryOne(
      'SELECT * FROM pos_customers WHERE phone = ?',
      [phone]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    // Lấy danh sách người nhận
    const children = await query(
      'SELECT id, phone, name, relationship FROM pos_customers WHERE parent_phone = ?',
      [customer.phone]
    );

    res.json({ ...customer, children });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/customers/qr/:code
 * Tìm theo QR code
 */
router.get('/qr/:code', authenticate, async (req, res) => {
  try {
    // P15-QR: chỉ mã có tiền tố mới; mã cũ QR-<SĐT> (đoán được từ SĐT) bị từ chối như mã không có.
    const code = String(req.params.code);
    const customer = code.startsWith(QR_TIEN_TO)
      ? await queryOne('SELECT * FROM pos_customers WHERE qr_code = ?', [code])
      : null;

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng', code: 'QR_KHONG_CO' });
    }

    // Lấy danh sách người nhận
    const children = await query(
      'SELECT id, phone, name, relationship FROM pos_customers WHERE parent_phone = ?',
      [customer.phone]
    );

    res.json({ ...customer, children });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/customers
 * Thêm khách hàng mới
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      phone,
      name,
      notes,
      parent_phone,
      relationship,
      customer_type,   // KHACH-APP-1 (Q2): không gửi → mặc định chung của taoKhach (retail / retail_only)
      requested_product,
      requested_cycles,
      children = [] // Danh sách người nhận
    } = req.body;

    // Validate
    if (!phone || !name) {
      return res.status(400).json({ 
        error: 'Vui lòng nhập số điện thoại và tên khách hàng' 
      });
    }

    // KHACH-APP-1 (C): cùng hàm tạo với App — kiểm trùng SĐT ngay trong câu ghi (hai quầy cùng bấm → một khách, bên kia 400)
    const kq = await taoKhach({ phone, name, notes, parent_phone, relationship, customer_type, requested_product, requested_cycles,
      created_by: req.user.username });
    if (kq.loi === 'SDT_KHONG_HOP_LE') return res.status(400).json({ error: 'Số điện thoại không hợp lệ', code: kq.loi });
    if (kq.loi) return res.status(400).json({ error: 'Vui lòng nhập số điện thoại và tên khách hàng', code: kq.loi });
    if (kq.trung) return res.status(400).json({ error: 'Số điện thoại đã tồn tại trong hệ thống', code: 'SDT_DA_CO' });

    // Người nhận: cùng hàm, theo loại của khách chính; không SĐT / SĐT sai / trùng → bỏ qua (như trước bỏ người nhận trùng)
    for (const child of Array.isArray(children) ? children : []) {
      if (child && child.phone && child.name) {
        await taoKhach({ phone: child.phone, name: child.name, parent_phone: kq.khach.phone, relationship: child.relationship,
          customer_type: kq.khach.customer_type, sync_status: kq.khach.sync_status, created_by: req.user.username });
      }
    }

    const newChildren = await query(
      'SELECT * FROM pos_customers WHERE parent_phone = ?',
      [kq.khach.phone]
    );

    res.status(201).json({
      success: true,
      customer: { ...kq.khach, children: newChildren }
    });
  } catch (err) {
    loiGhi(res, err);
  }
});

/**
 * PUT /api/pos/customers/:id
 * Cập nhật khách hàng
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const {
      name,
      notes,
      parent_phone,
      relationship,
      customer_type,
      requested_product,
      requested_cycles
    } = req.body;

    const customer = await queryOne(
      'SELECT * FROM pos_customers WHERE id = ?',
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    await run(`
      UPDATE pos_customers SET
        name = COALESCE(?, name),
        notes = ?,
        parent_phone = ?,
        relationship = ?,
        customer_type = COALESCE(?, customer_type),
        requested_product = ?,
        requested_cycles = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      name?.trim(),
      notes,
      parent_phone ? normalizePhone(parent_phone) : null,
      relationship,
      customer_type,
      requested_product,
      requested_cycles,
      getNow(),
      req.params.id
    ]);

    const updated = await queryOne(
      'SELECT * FROM pos_customers WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, customer: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/customers/:id/discount
 * KHACH-CK-1: chỉ còn ghi "Ghi chú khách" (cột discount_note, in trên hoá đơn). Chiết khấu riêng từng khách đã bỏ (chủ quán 29.10)
 * → mức > 0 trả 400 CHIET_KHAU_RIENG_DA_BO (cùng câu, cùng mã với customers-v2.js); mức luôn ghi 0, loại về mặc định 'percent'.
 */
// POS-ANTOAN-v1: giữ quyền manage_settings như cũ.
router.put('/:id/discount', authenticate, checkPermission('manage_settings'), async (req, res) => {
  try {
    const { discount_value, discount_note } = req.body;
    if (Number(discount_value) > 0) {
      return res.status(400).json({ error: 'Đã bỏ chiết khấu riêng từng khách — dùng hạng thành viên hoặc mã giảm', code: 'CHIET_KHAU_RIENG_DA_BO' });
    }

    const customer = await queryOne(
      'SELECT * FROM pos_customers WHERE id = ?',
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    await run(`
      UPDATE pos_customers SET
        discount_type = 'percent',
        discount_value = 0,
        discount_note = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      discount_note || null,
      getNow(),
      req.params.id
    ]);

    const updated = await queryOne(
      'SELECT * FROM pos_customers WHERE id = ?',
      [req.params.id]
    );

    res.json({ 
      success: true, 
      customer: updated,
      message: 'Đã cập nhật ghi chú khách'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/customers/:id/children
 * Danh sách người nhận của khách
 */
router.get('/:id/children', authenticate, async (req, res) => {
  try {
    const customer = await queryOne(
      'SELECT phone FROM pos_customers WHERE id = ?',
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    const children = await query(
      'SELECT * FROM pos_customers WHERE parent_phone = ?',
      [customer.phone]
    );

    res.json(children);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/customers/:id/children
 * Thêm người nhận cho khách
 */
router.post('/:id/children', authenticate, async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Vui lòng nhập tên người nhận' });
    }

    const parent = await queryOne(
      'SELECT * FROM pos_customers WHERE id = ?',
      [req.params.id]
    );

    if (!parent) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    // KHACH-APP-1 (C): cùng hàm tạo khách; người nhận theo loại của khách chính. Không SĐT → 400 (trước: 500 vì phone NOT NULL)
    const kq = await taoKhach({ phone: phone || '', name, parent_phone: parent.phone, relationship,
      customer_type: parent.customer_type, sync_status: parent.sync_status, created_by: req.user.username });
    if (kq.loi === 'SDT_KHONG_HOP_LE') return res.status(400).json({ error: 'Người nhận cần số điện thoại hợp lệ', code: kq.loi });
    if (kq.loi) return res.status(400).json({ error: 'Vui lòng nhập tên người nhận', code: kq.loi });
    if (kq.trung) return res.status(400).json({ error: 'Số điện thoại đã tồn tại trong hệ thống', code: 'SDT_DA_CO' });

    res.status(201).json({ success: true, child: kq.khach });
  } catch (err) {
    loiGhi(res, err);
  }
});

module.exports = router;
