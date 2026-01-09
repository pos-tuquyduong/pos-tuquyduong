/**
 * Fix bảng pos_balance_transactions - bỏ customer_id, dùng phone làm định danh chính
 * Chạy: node server/migrations/fix_balance_transactions.js
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/pos.db');

async function migrate() {
  console.log('Fix bảng pos_balance_transactions - dùng phone làm định danh chính...');

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);

  // Kiểm tra cấu trúc bảng hiện tại
  const tableInfo = db.exec("PRAGMA table_info(pos_balance_transactions)");
  console.log('Cấu trúc bảng hiện tại:');
  if (tableInfo.length > 0) {
    tableInfo[0].values.forEach(col => {
      console.log(`  - ${col[1]} (${col[2]}) ${col[3] ? 'NOT NULL' : 'NULL'}`);
    });
  }

  // Tạo bảng mới - KHÔNG có customer_id
  db.run(`
    CREATE TABLE IF NOT EXISTS pos_balance_transactions_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_phone TEXT NOT NULL,
      customer_name TEXT,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_before INTEGER DEFAULT 0,
      balance_after INTEGER DEFAULT 0,
      order_id INTEGER,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Copy dữ liệu từ bảng cũ (nếu có)
  try {
    db.run(`
      INSERT INTO pos_balance_transactions_new 
        (id, customer_phone, customer_name, type, amount, balance_before, balance_after, order_id, payment_method, notes, created_by, created_at)
      SELECT 
        id, customer_phone, customer_name, type, amount, balance_before, balance_after, order_id, payment_method, notes, created_by, created_at
      FROM pos_balance_transactions
      WHERE customer_phone IS NOT NULL
    `);
    console.log('✅ Đã copy dữ liệu từ bảng cũ');
  } catch (e) {
    console.log('Không có dữ liệu cũ hoặc bảng chưa tồn tại:', e.message);
  }

  // Xóa bảng cũ và rename bảng mới
  db.run(`DROP TABLE IF EXISTS pos_balance_transactions`);
  db.run(`ALTER TABLE pos_balance_transactions_new RENAME TO pos_balance_transactions`);
  console.log('✅ Đã tạo lại bảng pos_balance_transactions (không có customer_id)');

  // Tạo index cho phone
  db.run(`CREATE INDEX IF NOT EXISTS idx_balance_trans_phone ON pos_balance_transactions(customer_phone)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_balance_trans_date ON pos_balance_transactions(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_balance_trans_type ON pos_balance_transactions(type)`);
  console.log('✅ Đã tạo index');

  // Lưu
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log('');
  console.log('=== MIGRATION HOÀN THÀNH ===');
  console.log('Schema mới: id, customer_phone, customer_name, type, amount, balance_before, balance_after, order_id, payment_method, notes, created_by, created_at');
}

migrate().catch(console.error);