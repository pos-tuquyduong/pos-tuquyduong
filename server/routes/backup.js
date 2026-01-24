/**
 * POS System - Backup Routes
 * Sao lưu và khôi phục database
 * 
 * NOTE: Với Turso, backup/restore hoạt động khác.
 * File này giữ lại để tương thích, có thể cập nhật sau.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

/**
 * GET /api/pos/backup/download
 * Tải file backup database
 * NOTE: Với Turso cloud, tính năng này cần được cập nhật
 */
  router.get('/download', async (req, res) => {
    // Cho phép token qua query string để download trực tiếp
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Không có token xác thực' });
    }

    try {
      const jwt = require('jsonwebtoken');
      jwt.verify(token, process.env.JWT_SECRET || 'pos-secret-key-2025');
    } catch (err) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }
  try {
    // Turso cloud - không có file local
    return res.status(501).json({ 
      error: 'Tính năng backup đang được cập nhật cho Turso cloud database',
      message: 'Vui lòng sử dụng Turso Dashboard để backup'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/backup/restore
 * Khôi phục database từ file backup
 * NOTE: Với Turso cloud, tính năng này cần được cập nhật
 */
router.post('/restore', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file upload' });
    }

    // Xóa file tạm
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Turso cloud - không support restore file local
    return res.status(501).json({ 
      error: 'Tính năng restore đang được cập nhật cho Turso cloud database',
      message: 'Vui lòng sử dụng Turso Dashboard để restore'
    });
  } catch (err) {
    // Xóa file tạm nếu có lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/backup/info
 * Thông tin database hiện tại
 */
router.get('/info', authenticate, async (req, res) => {
  try {
    // Turso cloud database info
    res.json({
      type: 'turso_cloud',
      url: process.env.TURSO_DATABASE_URL ? 'Connected' : 'Not configured',
      message: 'Database đang chạy trên Turso Cloud'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
