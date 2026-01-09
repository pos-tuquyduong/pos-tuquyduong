/**
 * Tạo bảng pos_wallets
 * Chạy: node server/migrations/add_wallets.js
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/pos.db');

async function migrate() {
  console.log('Tạo bảng pos_wallets...');
  
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);

  // Tạo bảng
  db.run(`
    CREATE TABLE IF NOT EXISTS pos_wallets (
      phone TEXT PRIMARY KEY,
      balance INTEGER DEFAULT 0,
      total_topup INTEGER DEFAULT 0,
      total_spent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT
    )
  `);
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_wallets_balance ON pos_wallets(balance)`);

  // Lưu
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  
  // Verify
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='pos_wallets'");
  if (tables.length > 0) {
    console.log('✅ Đã tạo bảng pos_wallets');
  } else {
    console.log('❌ Lỗi: Không tạo được bảng');
  }
  
  db.close();
}

migrate().catch(console.error);
