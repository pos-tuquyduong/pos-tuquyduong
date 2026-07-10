/**
 * POS System - Authentication Middleware
 * 
 * TURSO MIGRATION: Tất cả database calls phải dùng await
 * Middleware phải là async function
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../database');

/**
 * So sánh chuỗi bí mật theo thời gian hằng số (chống dò timing).
 */
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Middleware xác thực JWT token (ASYNC cho Turso)
 */
async function authenticate(req, res, next) {
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
    
    // Lấy thông tin user từ database - THÊM await
    const users = await query(
      'SELECT id, username, display_name, role, is_active FROM pos_users WHERE id = ?',
      [decoded.userId]
    );
    const user = users[0];

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
 * Middleware kiểm tra quyền (ASYNC cho Turso)
 */
function checkPermission(permission) {
  return async (req, res, next) => {
    try {
      const { role } = req.user;
      
      // Admin có tất cả quyền
      if (role === 'owner') {
        return next();
      }

      // Kiểm tra quyền trong database - THÊM await
      const perms = await query(
        'SELECT allowed FROM pos_permissions WHERE role = ? AND permission = ?',
        [role, permission]
      );
      const perm = perms[0];

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
 * Middleware kiểm tra role (không cần async - không có DB call)
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

/**
 * Xác thực cho MÁY-GỌI-MÁY (vd worker đồng bộ của web) — POS-1.
 *
 * - Nếu request có header `X-Service-Key`:
 *     + Khớp với biến môi trường POS_SERVICE_API_KEY -> coi là "service principal"
 *       (chỉ đọc), gắn req.user role='service'. KHÔNG phải người dùng thật.
 *     + Không khớp / chưa cấu hình key -> 401.
 * - Nếu KHÔNG có header đó -> chuyển sang xác thực JWT người dùng như bình thường
 *   (luồng đăng nhập nhân viên giữ nguyên, không đổi một chữ).
 *
 * CHỈ gắn middleware này vào các endpoint CHỈ-ĐỌC mà máy thật sự cần
 * (hiện tại: GET /api/pos/products). Các route khác vẫn dùng `authenticate`,
 * nên service key không mở được cửa nào ngoài phạm vi cho phép.
 */
async function authenticateServiceOrUser(req, res, next) {
  const serviceKey = req.headers['x-service-key'];
  if (serviceKey !== undefined) {
    const configured = process.env.POS_SERVICE_API_KEY || '';
    if (!configured) {
      return res.status(401).json({
        error: 'Service auth chưa được cấu hình',
        code: 'SERVICE_AUTH_NOT_CONFIGURED'
      });
    }
    if (!safeEqual(serviceKey, configured)) {
      return res.status(401).json({
        error: 'Service key không hợp lệ',
        code: 'INVALID_SERVICE_KEY'
      });
    }
    req.user = { id: 0, username: 'web-sync', role: 'service', is_active: 1 };
    return next();
  }
  return authenticate(req, res, next);
}

module.exports = {
  authenticate,
  authenticateServiceOrUser,
  checkPermission,
  checkRole
};
