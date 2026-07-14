require('dotenv').config({ quiet: true });
const { createClient } = require('@libsql/client');
process.on('exit', (c) => console.log(`\n>> Ma thoat: ${c}`));

const withTimeout = (p, ms, label) => Promise.race([
  p,
  new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT ${ms}ms tai "${label}"`)), ms))
]);

(async () => {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  // 1) Đọc toàn bộ nhưng CHỈ 1 cột id -> có treo không? (loại trừ do cột dữ liệu nặng)
  try {
    console.log('1) SELECT id FROM pos_customers (chi 1 cot, tat ca dong)...');
    const r = await withTimeout(db.execute('SELECT id FROM pos_customers'), 10000, 'select id all');
    console.log('   OK, doc', r.rows.length, 'dong id ->', r.rows.map(x=>x.id).join(','));
  } catch (e) { console.log('   ❌', e.message); }

  // 2) Đọc phân trang từng khối 5 dòng -> tìm khối/dòng nào làm treo
  try {
    console.log('2) Doc phan trang tung khoi 5 dong...');
    for (let off = 0; off < 40; off += 5) {
      const r = await withTimeout(
        db.execute({ sql: 'SELECT * FROM pos_customers ORDER BY id LIMIT 5 OFFSET ?', args: [off] }),
        8000, `offset ${off}`
      );
      console.log(`   offset ${off}: OK ${r.rows.length} dong`);
    }
    console.log('   -> Phan trang chay het, khong khoi nao treo.');
  } catch (e) { console.log('   ❌ TREO/LOI tai:', e.message); }

  // 3) Có transaction/khóa treo? Thử một truy vấn ghi nhẹ với timeout
  try {
    console.log('3) Kiem khoa ghi (PRAGMA + ghi thu nghiem)...');
    const r = await withTimeout(db.execute('PRAGMA busy_timeout'), 5000, 'pragma');
    console.log('   busy_timeout =', JSON.stringify(r.rows[0]));
  } catch (e) { console.log('   ❌', e.message); }

  console.log('\n>> Xong chan doan.');
  process.exit(0);
})().catch(e => { console.log('LOI ngoai:', e.message); process.exit(1); });
