/**
 * POS System - User Routes
 * Quản lý nhân viên và phân quyền
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');

const router = express.Router();

/**
 * GET /api/pos/users
 * Danh sách nhân viên
 */
router.get('/', authenticate, checkPermission('manage_users'), (req, res) => {
  try {
    const users = query(`
      SELECT id, username, display_name, role, is_active, created_at, last_login
      FROM pos_users
      ORDER BY role, username
    `);

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/users
 * Thêm nhân viên mới
 */
router.post('/', authenticate, checkPermission('manage_users'), (req, res) => {
  try {
    const { username, password, display_name, role = 'staff' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Kiểm tra username trùng
    const existing = queryOne('SELECT id FROM pos_users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = run(`
      INSERT INTO pos_users (username, password, display_name, role, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `, [username, hashedPassword, display_name || username, role, getNow()]);

    const user = queryOne('SELECT id, username, display_name, role, is_active FROM pos_users WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/users/:id
 * Cập nhật nhân viên
 */
router.put('/:id', authenticate, checkPermission('manage_users'), (req, res) => {
  try {
    const { display_name, role, is_active } = req.body;

    const user = queryOne('SELECT * FROM pos_users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    }

    // Không cho sửa admin cuối cùng
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = queryOne("SELECT COUNT(*) as count FROM pos_users WHERE role = 'admin' AND is_active = 1")?.count || 0;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Không thể thay đổi quyền admin cuối cùng' });
      }
    }

    run(`
      UPDATE pos_users SET
        display_name = COALESCE(?, display_name),
        role = COALESCE(?, role),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `, [display_name, role, is_active !== undefined ? (is_active ? 1 : 0) : null, req.params.id]);

    const updated = queryOne('SELECT id, username, display_name, role, is_active FROM pos_users WHERE id = ?', [req.params.id]);

    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/users/:id/password
 * Reset mật khẩu
 */
router.put('/:id/password', authenticate, checkPermission('manage_users'), (req, res) => {
  try {
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const user = queryOne('SELECT * FROM pos_users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    }

    const hashedPassword = bcrypt.hashSync(new_password, 10);
    run('UPDATE pos_users SET password = ? WHERE id = ?', [hashedPassword, req.params.id]);

    res.json({ success: true, message: 'Đã đặt lại mật khẩu' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/permissions
 * Danh sách quyền
 */
router.get('/permissions', authenticate, checkPermission('manage_permissions'), (req, res) => {
  try {
    const permissions = query(`
      SELECT * FROM pos_permissions
      ORDER BY role, permission
    `);

    // Nhóm theo role
    const grouped = {};
    permissions.forEach(p => {
      if (!grouped[p.role]) grouped[p.role] = {};
      grouped[p.role][p.permission] = !!p.allowed;
    });

    // Danh sách tất cả quyền
    const allPermissions = [
      { key: 'view_customer_balance', label: 'Xem số dư khách hàng' },
      { key: 'topup_balance', label: 'Nạp tiền cho khách' },
      { key: 'adjust_balance', label: 'Điều chỉnh số dư' },
      { key: 'view_reports', label: 'Xem báo cáo' },
      { key: 'manage_products', label: 'Quản lý sản phẩm' },
      { key: 'manage_users', label: 'Quản lý nhân viên' },
      { key: 'approve_refund', label: 'Phê duyệt hoàn tiền' },
      { key: 'export_data', label: 'Export dữ liệu' },
      { key: 'import_data', label: 'Import dữ liệu' },
      { key: 'cancel_order', label: 'Hủy đơn hàng' },
      { key: 'view_all_orders', label: 'Xem tất cả đơn hàng' },
      { key: 'manage_promotions', label: 'Quản lý khuyến mãi' },
      { key: 'manage_permissions', label: 'Quản lý phân quyền' }
    ];

    res.json({
      permissions: grouped,
      all_permissions: allPermissions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/permissions/:role
 * Cập nhật quyền cho role
 */
router.put('/permissions/:role', authenticate, checkPermission('manage_permissions'), (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    if (role === 'admin') {
      return res.status(400).json({ error: 'Không thể sửa quyền của admin' });
    }

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }

    // Cập nhật từng quyền
    Object.entries(permissions).forEach(([permission, allowed]) => {
      const existing = queryOne(
        'SELECT id FROM pos_permissions WHERE role = ? AND permission = ?',
        [role, permission]
      );

      if (existing) {
        run(
          'UPDATE pos_permissions SET allowed = ? WHERE role = ? AND permission = ?',
          [allowed ? 1 : 0, role, permission]
        );
      } else {
        run(
          'INSERT INTO pos_permissions (role, permission, allowed) VALUES (?, ?, ?)',
          [role, permission, allowed ? 1 : 0]
        );
      }
    });

    res.json({ success: true, message: 'Đã cập nhật phân quyền' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
