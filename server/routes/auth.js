/**
 * POS System - Auth Routes
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne, run } = require('../database');
const { authenticate } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');

const router = express.Router();

/**
 * POST /api/pos/auth/login
 * Đăng nhập
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Vui lòng nhập tên đăng nhập và mật khẩu' 
      });
    }

    // Tìm user
    const user = queryOne(
      'SELECT * FROM pos_users WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({ 
        error: 'Tên đăng nhập hoặc mật khẩu không đúng' 
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Tài khoản đã bị vô hiệu hóa' 
      });
    }

    // Kiểm tra password
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Tên đăng nhập hoặc mật khẩu không đúng' 
      });
    }

    // Cập nhật last_login
    run(
      'UPDATE pos_users SET last_login = ? WHERE id = ?',
      [getNow(), user.id]
    );

    // Tạo token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Lấy permissions
    const permissions = query(
      'SELECT permission, allowed FROM pos_permissions WHERE role = ?',
      [user.role]
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role
      },
      permissions: permissions.reduce((acc, p) => {
        acc[p.permission] = !!p.allowed;
        return acc;
      }, {})
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/auth/logout
 * Đăng xuất (client-side xóa token)
 */
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Đã đăng xuất' });
});

/**
 * GET /api/pos/auth/me
 * Lấy thông tin user hiện tại
 */
router.get('/me', authenticate, (req, res) => {
  try {
    const permissions = query(
      'SELECT permission, allowed FROM pos_permissions WHERE role = ?',
      [req.user.role]
    );

    res.json({
      user: req.user,
      permissions: permissions.reduce((acc, p) => {
        acc[p.permission] = !!p.allowed;
        return acc;
      }, {})
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/auth/password
 * Đổi mật khẩu
 */
router.put('/password', authenticate, (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ 
        error: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới' 
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ 
        error: 'Mật khẩu mới phải có ít nhất 6 ký tự' 
      });
    }

    // Lấy user hiện tại
    const user = queryOne(
      'SELECT password FROM pos_users WHERE id = ?',
      [req.user.id]
    );

    // Kiểm tra mật khẩu cũ
    if (!bcrypt.compareSync(current_password, user.password)) {
      return res.status(400).json({ 
        error: 'Mật khẩu cũ không đúng' 
      });
    }

    // Cập nhật mật khẩu mới
    const hashedPassword = bcrypt.hashSync(new_password, 10);
    run(
      'UPDATE pos_users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ success: true, message: 'Đã đổi mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
