/**
 * Tạo bảng pos_registrations
 * Chạy: node server/migrations/add_registrations.js
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/pos.db');

async function migrate() {
  console.log('Tạo bảng pos_registrations...');

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);

  // Tạo bảng
  db.run(`
    CREATE TABLE IF NOT EXISTS pos_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      name TEXT NOT NULL,
      notes TEXT,
      parent_phone TEXT,
      relationship TEXT,
      requested_product TEXT,
      requested_cycles INTEGER,
      status TEXT DEFAULT 'pending',
      exported_at TEXT,
      exported_by TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_registrations_status ON pos_registrations(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_registrations_phone ON pos_registrations(phone)`);

  // Lưu
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));

  // Verify
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='pos_registrations'");
  if (tables.length > 0) {
    console.log('✅ Đã tạo bảng pos_registrations');
  } else {
    console.log('❌ Lỗi: Không tạo được bảng');
  }

  db.close();
}

migrate().catch(console.error);