/**
 * POS System - Backup Routes (Excel)
 * Xuất/Nhập data qua Excel thay vì copy file DB
 * Tương thích Turso cloud database
 */

const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { query, run } = require('../database');

const upload = multer({ storage: multer.memoryStorage() });

// Các bảng cần backup (thứ tự quan trọng cho restore - parent trước child)
const BACKUP_TABLES = [
  { name: 'pos_customers', label: 'Khách hàng', key: 'phone' },
  { name: 'pos_products', label: 'Sản phẩm', key: 'id' },
  { name: 'pos_wallets', label: 'Số dư', key: 'phone' },
  { name: 'pos_orders', label: 'Đơn hàng', key: 'id' },
  { name: 'pos_order_items', label: 'Chi tiết đơn', key: 'id' },
  { name: 'pos_balance_transactions', label: 'Giao dịch số dư', key: 'id' },
  { name: 'pos_registrations', label: 'Đăng ký mới', key: 'id' },
  { name: 'pos_refund_requests', label: 'Yêu cầu hoàn tiền', key: 'id' },
  { name: 'pos_promotions', label: 'Khuyến mãi', key: 'id' },
  { name: 'pos_settings', label: 'Cài đặt', key: 'key' }
];

/**
 * GET /api/pos/backup/info
 * Thông tin database + thống kê số dòng từng bảng
 */
router.get('/info', authenticate, async (req, res) => {
  try {
    const tables = [];
    for (const t of BACKUP_TABLES) {
      const result = await query(`SELECT COUNT(*) as count FROM ${t.name}`);
      tables.push({
        name: t.name,
        label: t.label,
        count: result[0]?.count || 0
      });
    }

    const totalRows = tables.reduce((sum, t) => sum + t.count, 0);

    res.json({
      type: 'turso_cloud',
      status: 'connected',
      tables,
      totalRows,
      message: 'Backup qua Excel - xuất/nhập từng bảng hoặc tất cả'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/backup/export-all
 * Xuất tất cả data thành 1 file Excel (nhiều sheet)
 */
router.get('/export-all', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Chỉ owner mới có quyền backup' });
    }

    const wb = XLSX.utils.book_new();

    for (const t of BACKUP_TABLES) {
      const rows = await query(`SELECT * FROM ${t.name}`);
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, t.label.substring(0, 31));
    }

    // Sheet metadata
    const meta = [{
      backup_date: new Date().toISOString(),
      system: 'POS Tứ Quý Đường',
      version: '1.0',
      tables: BACKUP_TABLES.map(t => t.name).join(', ')
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meta), '_Metadata');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `POS-backup-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Export all error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/pos/backup/export/:table
 * Xuất 1 bảng thành file Excel
 */
router.get('/export/:table', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Chỉ owner mới có quyền backup' });
    }

    const tableDef = BACKUP_TABLES.find(t => t.name === req.params.table);
    if (!tableDef) {
      return res.status(400).json({ error: 'Bảng không hợp lệ' });
    }

    const rows = await query(`SELECT * FROM ${tableDef.name}`);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), tableDef.label.substring(0, 31));

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `POS-${tableDef.name}-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Export table error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/backup/preview-restore
 * Preview file Excel trước khi restore
 */
router.post('/preview-restore', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file upload' });
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const preview = [];

    const labelToTable = {};
    for (const t of BACKUP_TABLES) {
      labelToTable[t.label] = t;
    }

    for (const sheetName of wb.SheetNames) {
      if (sheetName === '_Metadata') continue;

      const tableDef = labelToTable[sheetName];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws);

      let currentCount = 0;
      if (tableDef) {
        const result = await query(`SELECT COUNT(*) as count FROM ${tableDef.name}`);
        currentCount = result[0]?.count || 0;
      }

      preview.push({
        sheet: sheetName,
        table: tableDef?.name || 'unknown',
        label: tableDef?.label || sheetName,
        recognized: !!tableDef,
        fileRows: rows.length,
        currentRows: currentCount
      });
    }

    res.json({ success: true, preview });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/pos/backup/restore
 * Khôi phục data từ file Excel backup
 */
router.post('/restore', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Chỉ owner mới có quyền khôi phục' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Không có file upload' });
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const results = [];

    const labelToTable = {};
    for (const t of BACKUP_TABLES) {
      labelToTable[t.label] = t;
    }

    for (const sheetName of wb.SheetNames) {
      if (sheetName === '_Metadata') continue;
      
      const tableDef = labelToTable[sheetName];
      if (!tableDef) {
        results.push({ sheet: sheetName, status: 'skipped', reason: 'Không nhận diện được bảng' });
        continue;
      }

      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws);

      if (rows.length === 0) {
        results.push({ sheet: sheetName, table: tableDef.name, status: 'skipped', reason: 'Không có dữ liệu' });
        continue;
      }

      // Xóa data cũ rồi insert mới
      await run(`DELETE FROM ${tableDef.name}`);

      let inserted = 0;
      const columns = Object.keys(rows[0]);

      for (const row of rows) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === undefined || val === null || val === '') return null;
          return val;
        });

        const placeholders = columns.map(() => '?').join(', ');
        const colNames = columns.map(c => `"${c}"`).join(', ');

        try {
          await run(`INSERT INTO ${tableDef.name} (${colNames}) VALUES (${placeholders})`, values);
          inserted++;
        } catch (insertErr) {
          console.error(`Insert error [${tableDef.name}]:`, insertErr.message);
        }
      }

      results.push({
        sheet: sheetName,
        table: tableDef.name,
        status: 'restored',
        rows: inserted,
        total: rows.length
      });
    }

    res.json({ success: true, message: 'Khôi phục hoàn tất', results });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
