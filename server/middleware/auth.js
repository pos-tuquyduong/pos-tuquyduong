/**
 * POS System - Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const { query } = require('../database');

/**
 * Middleware xác thực JWT token
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Không có token xác thực',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Lấy thông tin user từ database
    const user = query(
      'SELECT id, username, display_name, role, is_active FROM pos_users WHERE id = ?',
      [decoded.userId]
    )[0];

    if (!user) {
      return res.status(401).json({ 
        error: 'Người dùng không tồn tại',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Tài khoản đã bị vô hiệu hóa',
        code: 'USER_INACTIVE'
      });
    }

    // Gắn thông tin user vào request
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token đã hết hạn',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token không hợp lệ',
        code: 'INVALID_TOKEN'
      });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Middleware kiểm tra quyền
 */
function checkPermission(permission) {
  return (req, res, next) => {
    try {
      const { role } = req.user;
      
      // Admin có tất cả quyền
      if (role === 'owner') {
        return next();
      }

      // Kiểm tra quyền trong database
      const perm = query(
        'SELECT allowed FROM pos_permissions WHERE role = ? AND permission = ?',
        [role, permission]
      )[0];

      if (!perm || !perm.allowed) {
        return res.status(403).json({ 
          error: 'Bạn không có quyền thực hiện thao tác này',
          code: 'PERMISSION_DENIED',
          required_permission: permission
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };
}

/**
 * Middleware kiểm tra role
 */
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Bạn không có quyền truy cập',
        code: 'ROLE_NOT_ALLOWED'
      });
    }
    next();
  };
}

module.exports = {
  authenticate,
  checkPermission,
  checkRole
};
