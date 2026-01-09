/**
 * Thêm column customer_name vào pos_balance_transactions
 * Chạy: node server/migrations/add_customer_name_column.js
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/pos.db');

async function migrate() {
  console.log('Thêm column customer_name...');

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);

  try {
    db.run(`ALTER TABLE pos_balance_transactions ADD COLUMN customer_name TEXT`);
    console.log('✅ Đã thêm column customer_name');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('ℹ️ Column đã tồn tại, bỏ qua');
    } else {
      console.log('❌ Lỗi:', e.message);
    }
  }

  // Lưu
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();
}

migrate().catch(console.error);