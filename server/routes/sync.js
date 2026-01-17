/**
 * POS System - Sync Routes
 * Đồng bộ khách hàng với hệ thống Sản xuất
 */

const express = require('express');
const multer = require('multer');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { 
  getNow, 
  normalizePhone,
  parseCSVLine,
  generateCSV,
  generateQRCode
} = require('../utils/helpers');

const router = express.Router();

// Cấu hình upload file
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * GET /api/pos/sync/status
 * Trạng thái đồng bộ
 */
router.get('/status', authenticate, (req, res) => {
  try {
    const stats = queryOne(`
      SELECT 
        SUM(CASE WHEN sync_status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN sync_status = 'exported' THEN 1 ELSE 0 END) as exported_count,
        SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) as synced_count,
        SUM(CASE WHEN sync_status = 'retail_only' THEN 1 ELSE 0 END) as retail_count
      FROM pos_customers
    `);

    // Lấy thông tin export gần nhất
    const lastExport = queryOne(`
      SELECT * FROM pos_sync_logs 
      WHERE type = 'export_new' 
      ORDER BY created_at DESC LIMIT 1
    `);

    // Lấy thông tin import gần nhất
    const lastImport = queryOne(`
      SELECT * FROM pos_sync_logs 
      WHERE type = 'import_sx' 
      ORDER BY created_at DESC LIMIT 1
    `);

    // Kiểm tra cảnh báo
    const warnings = [];
    
    // Khách new tồn đọng > 1 ngày
    const oldNew = queryOne(`
      SELECT COUNT(*) as count FROM pos_customers 
      WHERE sync_status = 'new' 
      AND datetime(created_at) < datetime('now', '-1 day')
    `);
    if (oldNew?.count > 0) {
      warnings.push({
        type: 'old_new',
        message: `Có ${oldNew.count} khách mới chưa export (tạo từ hơn 1 ngày trước)`,
        count: oldNew.count
      });
    }

    // Khách exported tồn đọng > 2 ngày
    const oldExported = queryOne(`
      SELECT COUNT(*) as count FROM pos_customers 
      WHERE sync_status = 'exported' 
      AND datetime(exported_at) < datetime('now', '-2 day')
    `);
    if (oldExported?.count > 0) {
      warnings.push({
        type: 'old_exported',
        message: `Có ${oldExported.count} khách đã export chưa được SX xử lý (hơn 2 ngày)`,
        count: oldExported.count
      });
    }

    res.json({
      stats,
      last_export: lastExport,
      last_import: lastImport,
      warnings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/sync/export
 * Export khách hàng mới ra CSV
 */
router.get('/export', authenticate, checkPermission('export_data'), (req, res) => {
  try {
    // Lấy danh sách khách new
    const customers = query(`
      SELECT c.*,
        p.name as parent_name
      FROM pos_customers c
      LEFT JOIN pos_customers p ON c.parent_phone = p.phone
      WHERE c.sync_status = 'new'
      ORDER BY c.parent_phone IS NOT NULL, c.created_at
    `);

    if (customers.length === 0) {
      return res.status(400).json({ error: 'Không có khách hàng mới để export' });
    }

    // Tạo CSV theo format của SX
    const headers = [
      'Tên KH', 'SĐT', 'Ghi chú', 'Khách chính', 'Quan hệ',
      'Nhóm', 'Sản phẩm', 'Loại SP', 'Số CT', 'Ngày BĐ', 'Ngày KT', 'Trạng thái'
    ];

    const rows = customers.map(c => ({
      'Tên KH': c.name,
      'SĐT': c.phone,
      'Ghi chú': c.notes || '',
      'Khách chính': c.parent_name || '',
      'Quan hệ': c.relationship || '',
      'Nhóm': '', // SX sẽ điền
      'Sản phẩm': c.requested_product || '',
      'Loại SP': c.customer_type === 'subscription' ? (c.requested_product === 'Trà' ? 'tea' : 'juice') : '',
      'Số CT': c.requested_cycles || '',
      'Ngày BĐ': '', // SX sẽ điền
      'Ngày KT': '',
      'Trạng thái': 'Chờ xếp nhóm'
    }));

    const csvContent = generateCSV(headers, rows);

    // Cập nhật trạng thái khách hàng
    const customerIds = customers.map(c => c.id);
    customerIds.forEach(id => {
      run(
        'UPDATE pos_customers SET sync_status = ?, exported_at = ?, exported_by = ? WHERE id = ?',
        ['exported', getNow(), req.user.username, id]
      );
    });

    // Ghi log
    const fileName = `khach-moi_${new Date().toISOString().slice(0,10)}_${Date.now()}.csv`;
    run(`
      INSERT INTO pos_sync_logs (type, file_name, record_count, details, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'export_new',
      fileName,
      customers.length,
      JSON.stringify({ customer_ids: customerIds, phones: customers.map(c => c.phone) }),
      req.user.username,
      getNow()
    ]);

    // Trả về file CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/sync/export/preview
 * Xem trước danh sách sẽ export
 */
router.get('/export/preview', authenticate, (req, res) => {
  try {
    const customers = query(`
      SELECT c.id, c.phone, c.name, c.requested_product, c.requested_cycles, c.created_at,
        p.name as parent_name
      FROM pos_customers c
      LEFT JOIN pos_customers p ON c.parent_phone = p.phone
      WHERE c.sync_status = 'new'
      ORDER BY c.created_at DESC
    `);

    res.json({
      count: customers.length,
      customers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/sync/import
 * Import CSV từ SX
 */
router.post('/import', authenticate, checkPermission('import_data'), upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file CSV' });
    }

    // Đọc file CSV
    const content = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, ''); // Remove BOM
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ error: 'File CSV không có dữ liệu' });
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);
    const phoneIndex = headers.findIndex(h => h.toLowerCase().includes('sđt') || h.toLowerCase().includes('phone'));
    const nameIndex = headers.findIndex(h => h.toLowerCase().includes('tên'));
    const groupIndex = headers.findIndex(h => h.toLowerCase().includes('nhóm'));
    const productIndex = headers.findIndex(h => h.toLowerCase().includes('sản phẩm'));
    const startDateIndex = headers.findIndex(h => h.toLowerCase().includes('ngày bđ') || h.toLowerCase().includes('bắt đầu'));
    const endDateIndex = headers.findIndex(h => h.toLowerCase().includes('ngày kt') || h.toLowerCase().includes('kết thúc'));
    const statusIndex = headers.findIndex(h => h.toLowerCase().includes('trạng thái'));

    if (phoneIndex === -1) {
      return res.status(400).json({ error: 'Không tìm thấy cột SĐT trong file' });
    }

    // Parse data
    const results = {
      updated: 0,
      created: 0,
      skipped: 0,
      errors: []
    };

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        const phone = normalizePhone(values[phoneIndex]);
        
        if (!phone) {
          results.skipped++;
          continue;
        }

        const data = {
          name: nameIndex >= 0 ? values[nameIndex] : null,
          sx_group_name: groupIndex >= 0 ? values[groupIndex] : null,
          sx_product: productIndex >= 0 ? values[productIndex] : null,
          sx_start_date: startDateIndex >= 0 ? values[startDateIndex] : null,
          sx_end_date: endDateIndex >= 0 ? values[endDateIndex] : null,
          sx_status: statusIndex >= 0 ? values[statusIndex] : null
        };

        // Tìm khách hàng theo SĐT
        const existing = queryOne('SELECT * FROM pos_customers WHERE phone = ?', [phone]);

        if (existing) {
          // Cập nhật - KHÔNG ghi đè discount_type, discount_value, discount_note
          run(`
            UPDATE pos_customers SET
              sx_group_name = COALESCE(?, sx_group_name),
              sx_product = COALESCE(?, sx_product),
              sx_start_date = COALESCE(?, sx_start_date),
              sx_end_date = COALESCE(?, sx_end_date),
              sx_status = COALESCE(?, sx_status),
              sync_status = 'synced',
              synced_at = ?,
              updated_at = ?
            WHERE phone = ?
          `, [
            data.sx_group_name,
            data.sx_product,
            data.sx_start_date,
            data.sx_end_date,
            data.sx_status,
            getNow(),
            getNow(),
            phone
          ]);
          results.updated++;
        } else {
          // Tạo mới (khách từ SX import sang)
          if (data.name) {
            run(`
              INSERT INTO pos_customers (
                phone, name, qr_code, 
                sx_group_name, sx_product, sx_start_date, sx_end_date, sx_status,
                sync_status, synced_at, customer_type, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              phone,
              data.name,
              generateQRCode(phone),
              data.sx_group_name,
              data.sx_product,
              data.sx_start_date,
              data.sx_end_date,
              data.sx_status,
              'synced',
              getNow(),
              'subscription',
              getNow()
            ]);
            results.created++;
          } else {
            results.skipped++;
          }
        }
      } catch (err) {
        results.errors.push({ line: i + 1, error: err.message });
      }
    }

    // Ghi log
    run(`
      INSERT INTO pos_sync_logs (type, file_name, record_count, details, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'import_sx',
      req.file.originalname,
      results.updated + results.created,
      JSON.stringify(results),
      results.errors.length > 0 ? 'partial' : 'success',
      req.user.username,
      getNow()
    ]);

    res.json({
      success: true,
      results,
      message: `Đã cập nhật ${results.updated} khách, tạo mới ${results.created} khách`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/sync/logs
 * Lịch sử đồng bộ
 */
router.get('/logs', authenticate, (req, res) => {
  try {
    const { type, limit = 20 } = req.query;

    let sql = `SELECT * FROM pos_sync_logs WHERE 1=1`;
    const params = [];

    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const logs = query(sql, params);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
