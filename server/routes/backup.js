/**
 * POS System - Backup Routes
 * Sao lưu và khôi phục database
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
 */
  router.get('/download', (req, res) => {
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
    const dbPath = process.env.DB_PATH || './data/pos.db';

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database không tồn tại' });
    }

    const timestamp = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const fileName = `pos-backup-${timestamp}.db`;

    res.download(dbPath, fileName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/backup/restore
 * Khôi phục database từ file backup
 */
router.post('/restore', authenticate, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file upload' });
    }

    const dbPath = process.env.DB_PATH || './data/pos.db';
    const dataDir = path.dirname(dbPath);

    // Tạo folder nếu chưa có
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Backup file hiện tại trước khi restore
    let backupPath = null;
    if (fs.existsSync(dbPath)) {
      backupPath = path.join(dataDir, `pos-before-restore-${Date.now()}.db`);
      fs.copyFileSync(dbPath, backupPath);
    }

    // Copy file mới vào
    fs.copyFileSync(req.file.path, dbPath);

    // Xóa file tạm
    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true, 
      message: 'Khôi phục thành công! Vui lòng restart server để áp dụng.',
      backup_created: backupPath
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
router.get('/info', authenticate, (req, res) => {
  try {
    const dbPath = process.env.DB_PATH || './data/pos.db';

    if (!fs.existsSync(dbPath)) {
      return res.json({ exists: false });
    }

    const stats = fs.statSync(dbPath);
    res.json({
      exists: true,
      size: stats.size,
      sizeFormatted: (stats.size / 1024).toFixed(2) + ' KB',
      modified: stats.mtime
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;