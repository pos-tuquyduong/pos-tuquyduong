/**
 * POS System - Auth Routes
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne, run } = require('../database');
const { authenticate } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');
const { giuLuot, dangNhapDung } = require('../utils/gioiHanDangNhap');

const router = express.Router();
const BAM_GIA = bcrypt.hashSync('khong-ai-co-mat-khau-nay', 10);   // DANG-NHAP-2: tên không tồn tại vẫn chạy một lần bcrypt

/**
 * POST /api/pos/auth/login
 * Đăng nhập
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Vui lòng nhập tên đăng nhập và mật khẩu' 
      });
    }

    // DANG-NHAP-2: giữ lượt TRƯỚC khi so mật khẩu; quá giới hạn → 429 (kể cả khi gõ đúng)
    const luot = giuLuot(req.ip, username);
    if (luot.chan) {
      return res.status(429).json({
        error: `Gõ sai quá nhiều lần — thử lại sau ${luot.phut} phút`,
        code: 'QUA_NHIEU_LAN'
      });
    }

    // Tìm user. Không có user vẫn so với băm giả: thời gian phản hồi không lộ tên có thật.
    const user = await queryOne(
      'SELECT * FROM pos_users WHERE username = ?',
      [String(username)]
    );
    const validPassword = await bcrypt.compare(String(password), user ? String(user.password) : BAM_GIA);

    if (!user || !validPassword) {
      return res.status(401).json({
        error: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }

    // Chỉ người biết ĐÚNG mật khẩu mới được biết tài khoản bị khoá
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    dangNhapDung(req.ip, username);

    // Cập nhật last_login
    await run(
      'UPDATE pos_users SET last_login = ? WHERE id = ?',
      [getNow(), user.id]
    );

    // Tạo token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }   // BAN-HANG-1 (DANG-NHAP-1): mặc định 30 ngày, biến môi trường vẫn ưu tiên
    );

    // Lấy permissions
    const permissions = await query(
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
router.post('/logout', authenticate, async (req, res) => {
  res.json({ success: true, message: 'Đã đăng xuất' });
});

/**
 * GET /api/pos/auth/me
 * Lấy thông tin user hiện tại
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const permissions = await query(
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
router.put('/password', authenticate, async (req, res) => {
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
    const user = await queryOne(
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
    await run(
      'UPDATE pos_users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ success: true, message: 'Đã đổi mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
