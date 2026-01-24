/**
 * POS System - Settings Routes
 * API quản lý cài đặt hệ thống và hóa đơn
 * 
 * Phase A: Hệ thống hóa đơn cơ bản
 * 
 * TURSO MIGRATION: Tất cả database calls dùng await
 * QUAN TRỌNG: forEach → for...of khi có await bên trong
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query, queryOne, run, saveDatabase } = require('../database');
const { authenticate } = require('../middleware/auth');

// Multer config cho upload logo
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 }, // 500KB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF)'));
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/pos/settings - Lấy tất cả settings
// ═══════════════════════════════════════════════════════════════════════════
router.get('/', authenticate, async (req, res) => {
  try {
    const settings = await query('SELECT key, value, updated_at FROM pos_settings');
    
    // Chuyển array thành object để dễ sử dụng
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    res.json({
      success: true,
      data: settingsObj,
      raw: settings // Trả về cả dạng array nếu cần
    });
  } catch (err) {
    console.error('GET settings error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/pos/settings/:key - Lấy 1 setting
// ═══════════════════════════════════════════════════════════════════════════
router.get('/:key', authenticate, async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await queryOne('SELECT key, value, updated_at FROM pos_settings WHERE key = ?', [key]);

    if (!setting) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy cài đặt' });
    }

    res.json({ success: true, data: setting });
  } catch (err) {
    console.error('GET setting error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/pos/settings - Cập nhật nhiều settings
// Body: { settings: { key1: value1, key2: value2, ... } }
// ═══════════════════════════════════════════════════════════════════════════
router.put('/', authenticate, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Thiếu dữ liệu settings' });
    }

    // Kiểm tra quyền (chỉ owner/manager được sửa)
    if (!['owner', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Không có quyền sửa cài đặt' });
    }

    let updated = 0;
    const timestamp = new Date().toISOString();

    // QUAN TRỌNG: Dùng for...of thay vì forEach vì có await
    for (const [key, value] of Object.entries(settings)) {
      // Sử dụng INSERT OR REPLACE để tự động thêm mới hoặc cập nhật
      await run(`
        INSERT INTO pos_settings (key, value, updated_at) 
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET 
          value = excluded.value,
          updated_at = excluded.updated_at
      `, [key, String(value), timestamp]);
      updated++;
    }

    res.json({
      success: true,
      message: `Đã cập nhật ${updated} cài đặt`,
      updated
    });
  } catch (err) {
    console.error('PUT settings error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/pos/settings/logo - Upload logo cửa hàng
// Lưu dạng base64 trong database
// ═══════════════════════════════════════════════════════════════════════════
router.post('/logo', authenticate, upload.single('logo'), async (req, res) => {
  try {
    // Kiểm tra quyền
    if (!['owner', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Không có quyền upload logo' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Không có file được upload' });
    }

    // Chuyển sang base64
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Lưu vào database
    const timestamp = new Date().toISOString();
    await run(`
      INSERT INTO pos_settings (key, value, updated_at) 
      VALUES ('store_logo', ?, ?)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value,
        updated_at = excluded.updated_at
    `, [base64, timestamp]);

    res.json({
      success: true,
      message: 'Đã upload logo thành công',
      data: {
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (err) {
    console.error('Upload logo error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/pos/settings/logo - Xóa logo
// ═══════════════════════════════════════════════════════════════════════════
router.delete('/logo', authenticate, async (req, res) => {
  try {
    // Kiểm tra quyền
    if (!['owner', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Không có quyền xóa logo' });
    }

    const timestamp = new Date().toISOString();
    await run(`
      UPDATE pos_settings SET value = '', updated_at = ?
      WHERE key = 'store_logo'
    `, [timestamp]);

    res.json({ success: true, message: 'Đã xóa logo' });
  } catch (err) {
    console.error('Delete logo error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/pos/settings/invoice/next-number - Lấy số hóa đơn tiếp theo
// Format: 00001/2026
// ═══════════════════════════════════════════════════════════════════════════
router.get('/invoice/next-number', authenticate, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Đếm số hóa đơn trong năm hiện tại
    const result = await queryOne(`
      SELECT COUNT(*) as count 
      FROM pos_invoice_logs 
      WHERE invoice_number LIKE ?
    `, [`%/${currentYear}`]);

    const nextNumber = (result?.count || 0) + 1;
    const invoiceNumber = `${String(nextNumber).padStart(5, '0')}/${currentYear}`;

    res.json({
      success: true,
      data: {
        invoiceNumber,
        nextNumber,
        year: currentYear
      }
    });
  } catch (err) {
    console.error('Get next invoice number error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/pos/settings/invoice/log - Lưu log in hóa đơn
// ═══════════════════════════════════════════════════════════════════════════
router.post('/invoice/log', authenticate, async (req, res) => {
  try {
    const { order_id, order_code, invoice_number, paper_size = 'a5', print_type = 'print' } = req.body;

    if (!order_id || !order_code || !invoice_number) {
      return res.status(400).json({ 
        success: false, 
        error: 'Thiếu thông tin: order_id, order_code, invoice_number' 
      });
    }

    // Lưu log
    const result = await run(`
      INSERT INTO pos_invoice_logs (
        order_id, order_code, invoice_number, paper_size, 
        printed_by, printed_by_name, print_type, printed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+7 hours'))
    `, [
      order_id, 
      order_code, 
      invoice_number, 
      paper_size,
      req.user.id,
      req.user.display_name || req.user.username,
      print_type
    ]);

    // Cập nhật invoice_number vào order
    await run(`
      UPDATE pos_orders SET invoice_number = ?
      WHERE id = ?
    `, [invoice_number, order_id]);

    res.json({
      success: true,
      message: 'Đã lưu log in hóa đơn',
      data: {
        id: result.lastInsertRowid,
        invoice_number
      }
    });
  } catch (err) {
    console.error('Save invoice log error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/pos/settings/invoice/logs - Lấy danh sách log in hóa đơn
// ═══════════════════════════════════════════════════════════════════════════
router.get('/invoice/logs', authenticate, async (req, res) => {
  try {
    const { from_date, to_date, limit = 100, offset = 0 } = req.query;

    let sql = `
      SELECT il.*, o.total, o.customer_name, o.customer_phone
      FROM pos_invoice_logs il
      LEFT JOIN pos_orders o ON il.order_id = o.id
      WHERE il.is_deleted = 0
    `;
    const params = [];

    if (from_date) {
      sql += ' AND DATE(il.printed_at) >= DATE(?)';
      params.push(from_date);
    }
    if (to_date) {
      sql += ' AND DATE(il.printed_at) <= DATE(?)';
      params.push(to_date);
    }

    sql += ' ORDER BY il.printed_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = await query(sql, params);

    // Đếm tổng
    let countSql = `
      SELECT COUNT(*) as total 
      FROM pos_invoice_logs 
      WHERE is_deleted = 0
    `;
    const countParams = [];
    if (from_date) {
      countSql += ' AND DATE(printed_at) >= DATE(?)';
      countParams.push(from_date);
    }
    if (to_date) {
      countSql += ' AND DATE(printed_at) <= DATE(?)';
      countParams.push(to_date);
    }
    const countResult = await queryOne(countSql, countParams);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total: countResult?.total || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error('Get invoice logs error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/pos/settings/invoice/logs/:id - Xóa log hóa đơn (soft delete)
// Chỉ Owner được xóa
// ═══════════════════════════════════════════════════════════════════════════
router.delete('/invoice/logs/:id', authenticate, async (req, res) => {
  try {
    // Kiểm tra quyền - chỉ owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, error: 'Chỉ Owner được xóa log hóa đơn' });
    }

    const { id } = req.params;

    // Soft delete
    await run(`
      UPDATE pos_invoice_logs 
      SET is_deleted = 1, deleted_at = datetime('now', '+7 hours'), deleted_by = ?
      WHERE id = ?
    `, [req.user.id, id]);

    res.json({ success: true, message: 'Đã xóa log hóa đơn' });
  } catch (err) {
    console.error('Delete invoice log error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/pos/settings/invoice/logs - Xóa nhiều log hóa đơn
// Body: { ids: [1, 2, 3] }
// ═══════════════════════════════════════════════════════════════════════════
router.delete('/invoice/logs', authenticate, async (req, res) => {
  try {
    // Kiểm tra quyền - chỉ owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, error: 'Chỉ Owner được xóa log hóa đơn' });
    }

    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Thiếu danh sách IDs' });
    }

    // Soft delete nhiều records
    const placeholders = ids.map(() => '?').join(',');
    await run(`
      UPDATE pos_invoice_logs 
      SET is_deleted = 1, deleted_at = datetime('now', '+7 hours'), deleted_by = ?
      WHERE id IN (${placeholders})
    `, [req.user.id, ...ids]);

    res.json({ 
      success: true, 
      message: `Đã xóa ${ids.length} log hóa đơn` 
    });
  } catch (err) {
    console.error('Bulk delete invoice logs error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/pos/settings/invoice/stats - Thống kê hóa đơn
// ═══════════════════════════════════════════════════════════════════════════
router.get('/invoice/stats', authenticate, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString().split('T')[0];

    // Tổng số hóa đơn năm nay
    const yearTotal = await queryOne(`
      SELECT COUNT(*) as count 
      FROM pos_invoice_logs 
      WHERE invoice_number LIKE ? AND is_deleted = 0
    `, [`%/${currentYear}`]);

    // Tổng số hóa đơn hôm nay
    const todayTotal = await queryOne(`
      SELECT COUNT(*) as count 
      FROM pos_invoice_logs 
      WHERE DATE(printed_at) = DATE(?) AND is_deleted = 0
    `, [today]);

    // Thống kê theo khổ giấy
    const byPaperSize = await query(`
      SELECT paper_size, COUNT(*) as count 
      FROM pos_invoice_logs 
      WHERE is_deleted = 0
      GROUP BY paper_size
    `);

    res.json({
      success: true,
      data: {
        year: currentYear,
        year_total: yearTotal?.count || 0,
        today_total: todayTotal?.count || 0,
        by_paper_size: byPaperSize
      }
    });
  } catch (err) {
    console.error('Get invoice stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
