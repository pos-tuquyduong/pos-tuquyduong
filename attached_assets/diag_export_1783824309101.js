// Chẩn đoán export-all: chạy đúng logic, đo thời gian TỪNG bước
// để biết chính xác bảng nào / bước nào làm treo.
require('dotenv').config();
const { createClient } = require('@libsql/client');
const XLSX = require('xlsx');

const BACKUP_TABLES = [
  { name: 'pos_customers', label: 'Khách hàng' },
  { name: 'pos_products', label: 'Sản phẩm' },
  { name: 'pos_wallets', label: 'Số dư' },
  { name: 'pos_orders', label: 'Đơn hàng' },
  { name: 'pos_order_items', label: 'Chi tiết đơn' },
  { name: 'pos_balance_transactions', label: 'Giao dịch số dư' },
  { name: 'pos_registrations', label: 'Đăng ký mới' },
  { name: 'pos_refund_requests', label: 'Yêu cầu hoàn tiền' },
  { name: 'pos_promotions', label: 'Khuyến mãi' },
  { name: 'pos_settings', label: 'Cài đặt' }
];

(async () => {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
  console.log('>> Da tao client, bat dau doc tung bang...\n');

  const wb = XLSX.utils.book_new();
  for (const t of BACKUP_TABLES) {
    process.stdout.write(`   [${t.name}] dang SELECT * ... `);
    const t0 = Date.now();
    const r = await db.execute(`SELECT * FROM ${t.name}`);
    const rows = r.rows.map(x => ({ ...x }));
    process.stdout.write(`OK ${rows.length} dong (${Date.now()-t0}ms) `);

    const t1 = Date.now();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, t.label.substring(0, 31));
    console.log(`| json_to_sheet ${Date.now()-t1}ms`);
  }

  console.log('\n>> Da doc xong tat ca bang. Bat dau XLSX.write...');
  const tw = Date.now();
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  console.log(`>> XLSX.write xong: ${buffer.length} bytes (${Date.now()-tw}ms)`);
  console.log('\n✅ HOAN TAT - export chay tron ven, khong treo o dau ca.');
  process.exit(0);
})().catch(e => { console.error('\n❌ LOI:', e.message); process.exit(1); });
