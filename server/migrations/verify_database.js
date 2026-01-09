/**
 * Kiểm tra database sau migration
 * Chạy: node server/migrations/verify_database.js
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/pos.db');

async function verify() {
  console.log('=== KIỂM TRA DATABASE ===\n');

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);

  // Danh sách bảng
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('Các bảng hiện có:');
  tables[0].values.forEach(t => {
    const isNew = ['pos_wallets', 'pos_registrations'].includes(t[0]);
    console.log(`  ${isNew ? '🆕' : '  '} ${t[0]}`);
  });

  // Kiểm tra bảng mới
  console.log('\n--- Kiểm tra bảng mới ---');

  const hasWallets = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='pos_wallets'");
  console.log(`pos_wallets: ${hasWallets.length > 0 ? '✅ Có' : '❌ Chưa có'}`);

  const hasRegistrations = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='pos_registrations'");
  console.log(`pos_registrations: ${hasRegistrations.length > 0 ? '✅ Có' : '❌ Chưa có'}`);

  // Kiểm tra column customer_name
  const cols = db.exec("PRAGMA table_info(pos_balance_transactions)");
  const hasCustomerName = cols[0]?.values.some(c => c[1] === 'customer_name');
  console.log(`customer_name column: ${hasCustomerName ? '✅ Có' : '❌ Chưa có'}`);

  console.log('\n=== KẾT THÚC KIỂM TRA ===');
  db.close();
}

verify().catch(console.error);