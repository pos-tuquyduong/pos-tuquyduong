/**
 * POS System - Registrations Routes
 * Quản lý đăng ký subscription mới + Export logs + Revert
 */

const express = require('express');
const { query, queryOne, run } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow, normalizePhone } = require('../utils/helpers');
const { RELATIONSHIP_VALUES } = require('../constants/relationships');

const router = express.Router();

// ══════════════════════════════════════════════════════
// ROUTES CỤ THỂ - ĐẶT TRƯỚC /:id
// ══════════════════════════════════════════════════════

/**
 * GET /api/pos/registrations/stats/summary
 */
router.get('/stats/summary', authenticate, (req, res) => {
  try {
    const stats = queryOne(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'exported' THEN 1 ELSE 0 END) as exported
      FROM pos_registrations
    `);
    res.json({ stats: stats || { total: 0, pending: 0, exported: 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/registrations/export/csv
 * Chỉ tải CSV, KHÔNG đánh dấu exported
 */
router.get('/export/csv', authenticate, checkPermission('export_data'), (req, res) => {
  try {
    const registrations = query(`SELECT * FROM pos_registrations WHERE status = 'pending' ORDER BY created_at`);

    if (registrations.length === 0) {
      return res.status(400).json({ error: 'Không có đăng ký mới để export' });
    }

    // Tạo CSV content
    const headers = ['Tên KH', 'SĐT', 'Ghi chú', 'SĐT Khách chính', 'Quan hệ', 'Sản phẩm', 'Số CT', 'Nhóm', 'Ngày BĐ', 'Trạng thái'];
    const rows = registrations.map(r => [
      r.name || '',
      r.phone || '',
      r.notes || '',
      r.parent_phone || '',
      r.relationship || '',
      r.requested_product || '',
      r.requested_cycles || '',
      '',
      '',
      'Chờ xếp nhóm'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const fileName = `dang-ky-moi_${new Date().toISOString().slice(0,10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send('\uFEFF' + csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/registrations/confirm-export
 * Xác nhận export thành công - đánh dấu exported + ghi log
 */
router.post('/confirm-export', authenticate, checkPermission('export_data'), (req, res) => {
  try {
    // Lấy danh sách pending
    const pending = query("SELECT id, phone, name FROM pos_registrations WHERE status = 'pending'");

    if (pending.length === 0) {
      return res.status(400).json({ error: 'Không có đăng ký nào để đánh dấu' });
    }

    const ids = pending.map(r => r.id);
    const now = getNow();
    const fileName = `dang-ky-moi_${new Date().toISOString().slice(0,10)}.csv`;

    // Đánh dấu exported
    const placeholders = ids.map(() => '?').join(',');
    run(`UPDATE pos_registrations SET status = 'exported', exported_at = ?, exported_by = ? WHERE id IN (${placeholders})`,
      [now, req.user.username, ...ids]);

    // Ghi log
    run(`INSERT INTO pos_export_logs (exported_at, exported_by, registration_ids, customer_count, file_name) VALUES (?, ?, ?, ?, ?)`,
      [now, req.user.username, JSON.stringify(ids), ids.length, fileName]);

    res.json({ 
      success: true, 
      count: ids.length,
      message: `Đã đánh dấu ${ids.length} khách exported`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/registrations/revert/:id
 * Hoàn tác 1 đăng ký từ exported về pending
 */
router.post('/revert/:id', authenticate, checkPermission('export_data'), (req, res) => {
  try {
    const reg = queryOne('SELECT * FROM pos_registrations WHERE id = ?', [req.params.id]);

    if (!reg) {
      return res.status(404).json({ error: 'Không tìm thấy' });
    }

    if (reg.status !== 'exported') {
      return res.status(400).json({ error: 'Chỉ có thể hoàn tác đăng ký đã exported' });
    }

    run(`UPDATE pos_registrations SET status = 'pending', exported_at = NULL, exported_by = NULL WHERE id = ?`,
      [req.params.id]);

    res.json({ success: true, message: 'Đã hoàn tác về trạng thái chờ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/registrations/revert-last
 * Hoàn tác lần export gần nhất
 */
router.post('/revert-last', authenticate, checkPermission('export_data'), (req, res) => {
  try {
    // Lấy log gần nhất
    const lastLog = queryOne('SELECT * FROM pos_export_logs ORDER BY id DESC LIMIT 1');

    if (!lastLog) {
      return res.status(400).json({ error: 'Không có lịch sử export' });
    }

    const ids = JSON.parse(lastLog.registration_ids);

    // Hoàn tác các đăng ký
    const placeholders = ids.map(() => '?').join(',');
    run(`UPDATE pos_registrations SET status = 'pending', exported_at = NULL, exported_by = NULL WHERE id IN (${placeholders}) AND status = 'exported'`,
      ids);

    // Xóa log
    run('DELETE FROM pos_export_logs WHERE id = ?', [lastLog.id]);

    res.json({ 
      success: true, 
      count: ids.length,
      message: `Đã hoàn tác ${ids.length} khách từ lần export lúc ${lastLog.exported_at}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/registrations/export-logs
 * Lịch sử export
 */
router.get('/export-logs', authenticate, (req, res) => {
  try {
    const logs = query('SELECT * FROM pos_export_logs ORDER BY id DESC LIMIT 20');
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// ROUTES CHUNG
// ══════════════════════════════════════════════════════

/**
 * GET /api/pos/registrations
 */
router.get('/', authenticate, (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    let sql = 'SELECT * FROM pos_registrations WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const registrations = query(sql, params);
    const stats = queryOne(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = 'exported' THEN 1 ELSE 0 END) as exported FROM pos_registrations`);

    res.json({ registrations, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/registrations
 */
router.post('/', authenticate, (req, res) => {
  try {
    const { phone, name, notes, parent_phone, relationship, requested_product, requested_cycles } = req.body;

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'SĐT không hợp lệ' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên không được để trống' });
    }

    const existing = queryOne('SELECT phone FROM pos_registrations WHERE phone = ?', [normalizedPhone]);
    if (existing) {
      return res.status(400).json({ error: 'SĐT đã được đăng ký' });
    }

    const validRelationship = RELATIONSHIP_VALUES.includes(relationship) ? relationship : null;
    const normalizedParentPhone = parent_phone ? normalizePhone(parent_phone) : null;

    const result = run(`
      INSERT INTO pos_registrations (phone, name, notes, parent_phone, relationship, requested_product, requested_cycles, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [normalizedPhone, name.trim(), notes || null, normalizedParentPhone, validRelationship, requested_product || null, requested_cycles ? parseInt(requested_cycles) : null, req.user.username, getNow()]
    );

    const newReg = queryOne('SELECT * FROM pos_registrations WHERE id = ?', [result.lastInsertRowid]);
    res.json({ success: true, registration: newReg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// ROUTES CÓ PARAMETER - ĐẶT SAU CÙNG
// ══════════════════════════════════════════════════════

/**
 * GET /api/pos/registrations/:id
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const registration = queryOne('SELECT * FROM pos_registrations WHERE id = ?', [req.params.id]);
    if (!registration) {
      return res.status(404).json({ error: 'Không tìm thấy' });
    }
    res.json(registration);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/pos/registrations/:id
 */
router.put('/:id', authenticate, (req, res) => {
  try {
    const { name, notes, parent_phone, relationship, requested_product, requested_cycles } = req.body;
    const existing = queryOne('SELECT * FROM pos_registrations WHERE id = ?', [req.params.id]);

    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy' });
    }
    if (existing.status === 'exported') {
      return res.status(400).json({ error: 'Không thể sửa đăng ký đã export' });
    }

    const validRelationship = RELATIONSHIP_VALUES.includes(relationship) ? relationship : null;

    run(`UPDATE pos_registrations SET name = ?, notes = ?, parent_phone = ?, relationship = ?, requested_product = ?, requested_cycles = ? WHERE id = ?`,
      [name?.trim() || existing.name, notes ?? existing.notes, parent_phone ? normalizePhone(parent_phone) : null, validRelationship, requested_product || existing.requested_product, requested_cycles ? parseInt(requested_cycles) : existing.requested_cycles, req.params.id]
    );

    const updated = queryOne('SELECT * FROM pos_registrations WHERE id = ?', [req.params.id]);
    res.json({ success: true, registration: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/pos/registrations/:id
 */
router.delete('/:id', authenticate, (req, res) => {
  try {
    const existing = queryOne('SELECT * FROM pos_registrations WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy' });
    }
    run('DELETE FROM pos_registrations WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;