/**
 * POS System - Customer Routes
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { 
  generateQRCode, 
  normalizePhone, 
  isValidPhone,
  getNow 
} = require('../utils/helpers');

const router = express.Router();

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
    const customer = await queryOne(
      'SELECT * FROM pos_customers WHERE qr_code = ?',
      [req.params.code]
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
      customer_type = 'subscription',
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

    const normalizedPhone = normalizePhone(phone);
    
    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({ 
        error: 'Số điện thoại không hợp lệ' 
      });
    }

    // Kiểm tra trùng
    const existing = await queryOne(
      'SELECT id FROM pos_customers WHERE phone = ?',
      [normalizedPhone]
    );

    if (existing) {
      return res.status(400).json({ 
        error: 'Số điện thoại đã tồn tại trong hệ thống' 
      });
    }

    // Tạo QR code
    const qrCode = generateQRCode(normalizedPhone);

    // Xác định sync_status
    const syncStatus = customer_type === 'retail' ? 'retail_only' : 'new';

    // Insert khách hàng chính
    const result = await run(`
      INSERT INTO pos_customers (
        phone, name, notes, parent_phone, relationship,
        qr_code, customer_type, requested_product, requested_cycles,
        sync_status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      normalizedPhone,
      name.trim(),
      notes || null,
      parent_phone ? normalizePhone(parent_phone) : null,
      relationship || null,
      qrCode,
      customer_type,
      requested_product || null,
      requested_cycles || null,
      syncStatus,
      req.user.username,
      getNow()
    ]);

    const customerId = result.lastInsertRowid;

    // Thêm người nhận (children)
    if (children && children.length > 0) {
      for (const child of children) {
        if (child.name) {
          const childPhone = child.phone ? normalizePhone(child.phone) : null;
          const childQR = childPhone ? generateQRCode(childPhone) : null;
          
          // Kiểm tra phone trùng nếu có
          if (childPhone) {
            const existingChild = await queryOne(
              'SELECT id FROM pos_customers WHERE phone = ?',
              [childPhone]
            );
            if (existingChild) continue; // Skip nếu trùng
          }

          await run(`
            INSERT INTO pos_customers (
              phone, name, parent_phone, relationship,
              qr_code, customer_type, sync_status, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            childPhone,
            child.name.trim(),
            normalizedPhone, // parent_phone = khách chính
            child.relationship || null,
            childQR,
            customer_type,
            syncStatus,
            req.user.username,
            getNow()
          ]);
        }
      }
    }

    // Trả về khách hàng vừa tạo
    const newCustomer = await queryOne(
      'SELECT * FROM pos_customers WHERE id = ?',
      [customerId]
    );

    const newChildren = await query(
      'SELECT * FROM pos_customers WHERE parent_phone = ?',
      [normalizedPhone]
    );

    res.status(201).json({
      success: true,
      customer: { ...newCustomer, children: newChildren }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
 * Cập nhật chiết khấu cho khách hàng
 */
router.put('/:id/discount', authenticate, async (req, res) => {
  try {
    const { discount_type, discount_value, discount_note } = req.body;

    const customer = await queryOne(
      'SELECT * FROM pos_customers WHERE id = ?',
      [req.params.id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    // Validate
    if (discount_type && !['percent', 'fixed'].includes(discount_type)) {
      return res.status(400).json({ error: 'Loại chiết khấu không hợp lệ' });
    }

    if (discount_type === 'percent' && discount_value > 100) {
      return res.status(400).json({ error: 'Phần trăm chiết khấu không được vượt quá 100%' });
    }

    await run(`
      UPDATE pos_customers SET
        discount_type = ?,
        discount_value = ?,
        discount_note = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      discount_type || 'percent',
      discount_value || 0,
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
      message: 'Đã cập nhật chiết khấu cho khách hàng'
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

    const childPhone = phone ? normalizePhone(phone) : null;
    
    // Kiểm tra phone trùng nếu có
    if (childPhone) {
      const existing = await queryOne(
        'SELECT id FROM pos_customers WHERE phone = ?',
        [childPhone]
      );
      if (existing) {
        return res.status(400).json({ 
          error: 'Số điện thoại đã tồn tại trong hệ thống' 
        });
      }
    }

    const qrCode = childPhone ? generateQRCode(childPhone) : null;

    const result = await run(`
      INSERT INTO pos_customers (
        phone, name, parent_phone, relationship,
        qr_code, customer_type, sync_status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      childPhone,
      name.trim(),
      parent.phone,
      relationship || null,
      qrCode,
      parent.customer_type,
      parent.sync_status,
      req.user.username,
      getNow()
    ]);

    const child = await queryOne(
      'SELECT * FROM pos_customers WHERE id = ?',
      [result.lastInsertRowid]
    );

    res.status(201).json({ success: true, child });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
