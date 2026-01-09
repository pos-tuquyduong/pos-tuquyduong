/**
 * Thêm bảng pos_export_logs để lưu lịch sử export
 * Chạy: node server/migrations/add_export_logs.js
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/pos.db');

async function migrate() {
  console.log('Tạo bảng pos_export_logs...');

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);

  // Tạo bảng export logs
  db.run(`
    CREATE TABLE IF NOT EXISTS pos_export_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exported_at TEXT NOT NULL,
      exported_by TEXT NOT NULL,
      registration_ids TEXT NOT NULL,
      customer_count INTEGER NOT NULL,
      file_name TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Đã tạo bảng pos_export_logs');

  // Thêm index
  db.run(`CREATE INDEX IF NOT EXISTS idx_export_logs_date ON pos_export_logs(exported_at)`);
  console.log('✅ Đã tạo index');

  // Lưu
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log('=== MIGRATION HOÀN THÀNH ===');
}

migrate().catch(console.error);