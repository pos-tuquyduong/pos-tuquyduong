/**
 * POS System - Packages Routes
 * CRUD gói template (với lock) + customer packages + per-item delivery tracking
 */
const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');

// Helper: đếm KH đang dùng gói
const countActiveUsers = async (packageId) => {
  const r = await queryOne('SELECT COUNT(*) as c FROM pos_customer_packages WHERE package_id = ? AND status = ?', [packageId, 'active']);
  return r?.c || 0;
};

// ═══ TEMPLATE CRUD (lock khi có KH đang dùng) ═══

// GET / — Danh sách template (kèm active_users count)
router.get('/', authenticate, async (req, res) => {
  try {
    const { active } = req.query;
    let sql = `SELECT p.*, 
      (SELECT COUNT(*) FROM pos_customer_packages cp WHERE cp.package_id = p.id AND cp.status = 'active') as active_users
      FROM pos_packages p`;
    if (active === '1' || active === undefined) sql += ' WHERE p.is_active = 1';
    else if (active === '0') sql += ' WHERE p.is_active = 0';
    sql += ' ORDER BY p.sort_order ASC, p.id ASC';
    res.json({ success: true, data: await query(sql) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST / — Thêm template
router.post('/', authenticate, checkPermission('manage_users'), async (req, res) => {
  try {
    const { code, name, description, price, unit, total_qty, package_items, is_active, sort_order } = req.body;
    if (!code || !name) return res.status(400).json({ success: false, error: 'Mã và tên gói bắt buộc' });
    const dup = await queryOne('SELECT id FROM pos_packages WHERE code = ?', [code.trim().toUpperCase()]);
    if (dup) return res.status(400).json({ success: false, error: `Mã "${code}" đã tồn tại` });
    const now = new Date().toISOString();
    const result = await run(
      `INSERT INTO pos_packages (code, name, description, price, unit, total_qty, package_items, is_active, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code.trim().toUpperCase(), name.trim(), description || '', price || 0, unit || 'túi',
       total_qty || 0, package_items ? JSON.stringify(package_items) : null,
       is_active !== undefined ? (is_active ? 1 : 0) : 1, sort_order || 0, now, now]
    );
    const pkg = await queryOne('SELECT * FROM pos_packages WHERE id = ?', [result.lastInsertRowid]);
    res.json({ success: true, data: pkg, message: 'Đã thêm gói' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /:id — Sửa template (🔒 LOCK khi có KH đang dùng)
router.put('/:id', authenticate, checkPermission('manage_users'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await queryOne('SELECT * FROM pos_packages WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, error: 'Không tìm thấy gói' });

    const activeUsers = await countActiveUsers(id);
    const { code, name, description, price, unit, total_qty, package_items, is_active, sort_order } = req.body;

    // 🔒 Lock: có KH đang dùng → chỉ cho toggle is_active/sort_order
    if (activeUsers > 0) {
      const isToggleOnly = is_active !== undefined && !code && !name && !description && price === undefined && !unit && total_qty === undefined && !package_items;
      if (!isToggleOnly) {
        return res.status(400).json({
          success: false, locked: true, active_users: activeUsers,
          error: `Không thể sửa — ${activeUsers} KH đang dùng gói này. Hãy tạo gói mới.`
        });
      }
    }

    if (code && code.trim().toUpperCase() !== existing.code) {
      const dup = await queryOne('SELECT id FROM pos_packages WHERE code = ? AND id != ?', [code.trim().toUpperCase(), id]);
      if (dup) return res.status(400).json({ success: false, error: `Mã "${code}" đã tồn tại` });
    }

    const itemsJson = package_items !== undefined ? JSON.stringify(package_items) : existing.package_items;
    await run(
      `UPDATE pos_packages SET code=?, name=?, description=?, price=?, unit=?, total_qty=?, package_items=?, is_active=?, sort_order=?, updated_at=? WHERE id=?`,
      [(code || existing.code).trim().toUpperCase(), (name || existing.name).trim(),
       description !== undefined ? description : existing.description,
       price !== undefined ? price : existing.price, unit || existing.unit,
       total_qty !== undefined ? total_qty : existing.total_qty, itemsJson,
       is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
       sort_order !== undefined ? sort_order : existing.sort_order, new Date().toISOString(), id]
    );
    const updated = await queryOne('SELECT * FROM pos_packages WHERE id = ?', [id]);
    res.json({ success: true, data: updated, message: 'Đã cập nhật gói' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /:id (🔒 LOCK)
router.delete('/:id', authenticate, checkPermission('manage_users'), async (req, res) => {
  try {
    const { id } = req.params;
    const activeUsers = await countActiveUsers(id);
    if (activeUsers > 0) {
      return res.status(400).json({ success: false, locked: true, active_users: activeUsers,
        error: `Không thể xóa — ${activeUsers} KH đang dùng gói này.` });
    }
    const everUsed = await queryOne('SELECT COUNT(*) as c FROM pos_customer_packages WHERE package_id = ?', [id]);
    if (everUsed?.c > 0) {
      await run('UPDATE pos_packages SET is_active = 0, updated_at = ? WHERE id = ?', [new Date().toISOString(), id]);
      return res.json({ success: true, message: 'Gói đã có lịch sử → chuyển ngừng bán' });
    }
    await run('DELETE FROM pos_packages WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa gói' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ═══ CUSTOMER PACKAGES ═══

// GET /customer/:phone — Gói của 1 khách (kèm per-item delivered)
router.get('/customer/:phone', authenticate, async (req, res) => {
  try {
    const pkgs = await query(
      `SELECT cp.*, p.code as pkg_code, p.name as pkg_name, p.price as pkg_price,
              p.unit as pkg_unit, p.package_items as pkg_items, p.total_qty as pkg_total_qty
       FROM pos_customer_packages cp
       JOIN pos_packages p ON cp.package_id = p.id
       WHERE cp.customer_phone = ?
       ORDER BY cp.status = 'active' DESC, cp.created_at DESC`,
      [req.params.phone]
    );
    // Per-item delivered cho gói active
    for (const pkg of pkgs) {
      if (pkg.status === 'active') {
        pkg.delivered_items = await query(
          `SELECT oi.product_code, oi.product_name, SUM(oi.quantity) as delivered_qty
           FROM pos_order_items oi JOIN pos_orders o ON o.id = oi.order_id
           WHERE o.customer_package_id = ? AND oi.product_id > 0 AND oi.unit_price = 0
           GROUP BY oi.product_code`, [pkg.id]);
      }
    }
    res.json({ success: true, data: pkgs });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /customer-packages/all — Tất cả gói (Reports)
router.get('/customer-packages/all', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `SELECT cp.*, p.code as pkg_code, p.name as pkg_name, p.price as pkg_price,
                      p.unit as pkg_unit, p.package_items as pkg_items
               FROM pos_customer_packages cp JOIN pos_packages p ON cp.package_id = p.id`;
    const params = [];
    if (status && status !== 'all') { sql += ' WHERE cp.status = ?'; params.push(status); }
    sql += " ORDER BY cp.status = 'active' DESC, cp.created_at DESC";
    res.json({ success: true, data: await query(sql, params) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /customer-packages/:id/deliveries — Lịch sử giao
router.get('/customer-packages/:id/deliveries', authenticate, async (req, res) => {
  try {
    const deliveries = await query(
      `SELECT o.id, o.code as order_code, o.created_at, o.created_by,
              GROUP_CONCAT(oi.product_name || ' ×' || oi.quantity, ', ') as items,
              SUM(oi.quantity) as total_qty
       FROM pos_orders o JOIN pos_order_items oi ON oi.order_id = o.id
       WHERE o.customer_package_id = ? AND oi.product_id > 0
       GROUP BY o.id ORDER BY o.created_at ASC`, [req.params.id]);
    res.json({ success: true, data: deliveries });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /buy — Khách mua gói
router.post('/buy', authenticate, async (req, res) => {
  try {
    const { customer_phone, package_id, total_qty, order_id, notes } = req.body;
    if (!customer_phone || !package_id || !total_qty) return res.status(400).json({ success: false, error: 'Thiếu thông tin' });
    const now = new Date().toISOString();
    const result = await run(
      `INSERT INTO pos_customer_packages (customer_phone, package_id, order_id, total_qty, delivered_qty, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 'active', ?, ?, ?)`,
      [customer_phone, package_id, order_id || null, total_qty, notes || '', now, now]);
    res.json({ success: true, data: { id: result.lastInsertRowid }, message: 'Đã tạo gói cho khách' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /customer-packages/:id/deliver — Atomic update delivered_qty
router.put('/customer-packages/:id/deliver', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { delivered_qty } = req.body;
    if (!delivered_qty || delivered_qty <= 0) return res.status(400).json({ success: false, error: 'Số lượng không hợp lệ' });
    await run(
      `UPDATE pos_customer_packages SET delivered_qty = delivered_qty + ?,
         status = CASE WHEN delivered_qty + ? >= total_qty THEN 'completed' ELSE 'active' END,
         updated_at = ? WHERE id = ?`,
      [delivered_qty, delivered_qty, new Date().toISOString(), id]);
    const updated = await queryOne('SELECT * FROM pos_customer_packages WHERE id = ?', [id]);
    if (!updated) return res.status(404).json({ success: false, error: 'Không tìm thấy gói KH' });
    res.json({ success: true, data: { delivered_qty: updated.delivered_qty, status: updated.status } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /customer-packages/:id/cancel — Hủy gói
router.put('/customer-packages/:id/cancel', authenticate, checkPermission('manage_users'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const cp = await queryOne('SELECT * FROM pos_customer_packages WHERE id = ?', [id]);
    if (!cp) return res.status(404).json({ success: false, error: 'Không tìm thấy gói KH' });
    if (cp.status === 'completed') return res.status(400).json({ success: false, error: 'Gói đã hoàn thành' });
    await run('UPDATE pos_customer_packages SET status = ?, notes = ?, updated_at = ? WHERE id = ?',
      ['cancelled', notes || `Hủy gói (đã giao ${cp.delivered_qty}/${cp.total_qty})`, new Date().toISOString(), id]);
    res.json({ success: true, message: `Đã hủy gói (đã giao ${cp.delivered_qty}/${cp.total_qty})` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
