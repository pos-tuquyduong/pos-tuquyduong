require('dotenv').config({ quiet: true });
const { createClient } = require('@libsql/client');

// In mã thoát khi tiến trình kết thúc (phân biệt crash vs chạy xong)
process.on('exit', (code) => console.log(`\n>> Tien trinh KET THUC voi ma thoat: ${code}`));
process.on('uncaughtException', (e) => console.log('>> uncaughtException:', e.message));
process.on('unhandledRejection', (e) => console.log('>> unhandledRejection:', e && e.message));

(async () => {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  // Đồng hồ báo treo: nếu một bước nào đó quá 12s chưa xong -> đang TREO (không phải crash)
  const watchdog = (label) => setTimeout(() => {
    console.log(`\n>> ⏰ VAN DANG TREO o buoc "${label}" sau 12s -> day la TREO (hang), khong phai crash.`);
    process.exit(99);
  }, 12000);

  try {
    let w;
    console.log('A) SELECT COUNT(*) FROM pos_customers ...');
    w = watchdog('COUNT'); 
    let r = await db.execute('SELECT COUNT(*) AS c FROM pos_customers');
    clearTimeout(w);
    console.log('   OK, count =', Number(r.rows[0].c));

    console.log('B) SELECT * FROM pos_customers LIMIT 1 ...');
    w = watchdog('LIMIT 1');
    r = await db.execute('SELECT * FROM pos_customers LIMIT 1');
    clearTimeout(w);
    console.log('   OK, so cot =', r.columns ? r.columns.length : '?', '| cac cot:', (r.columns||[]).join(','));

    console.log('C) SELECT * FROM pos_customers (toan bo) ...');
    w = watchdog('SELECT * full');
    r = await db.execute('SELECT * FROM pos_customers');
    clearTimeout(w);
    console.log('   OK, doc duoc', r.rows.length, 'dong');

    console.log('\n✅ CA BA BUOC DEU CHAY -> pos_customers khong phai thu pham.');
    process.exit(0);
  } catch (e) {
    console.log('>> ❌ LOI (co bat duoc):', e.message);
    process.exit(1);
  }
})();
