/**
 * THU P1 — POS-DODNO-v1  (an toan tuyet doi, KHONG dung kho that)
 *
 * Chay trong cua so Replit POS (tu thu muc GOC cua repo):
 *     node thu_p1.js chen     → tao 2 dong so no gia
 *     node thu_p1.js xem      → xem trang thai hien tai
 *     node thu_p1.js don      → xoa sach dong gia
 *
 * VI SAO AN TOAN
 *   Ca 2 dong deu KHONG CO VAN TAY. Bo di doi co luat: dong khong co van tay
 *   thi TUYET DOI khong gui sang SX (gui ma thieu van tay se tru kho lan nua).
 *   No chuyen thang sang 'can_xem'. Nghia la SX khong he nhan mot lenh nao,
 *   ton kho that khong doi mot don vi.
 *
 *   Ma don dat tien to ZZTHU- de de nhan ra va don sach.
 */

// Nap bien moi truong y het server/index.js — chay thang trong shell thi
// KHONG tu co san, phai goi dotenv (bai hoc lan chay dau: URL_INVALID).
require('dotenv').config();

const { createClient } = require('@libsql/client');

if (!process.env.TURSO_DATABASE_URL) {
  console.error('\n❌ Khong doc duoc TURSO_DATABASE_URL.\n');
  console.error('   Kiem hai dieu:');
  console.error('   1. Dang o THU MUC GOC cua repo POS?   ->  ls .env');
  console.error('   2. File .env co dong TURSO_DATABASE_URL?  ->  grep TURSO .env | cut -c1-40\n');
  process.exit(1);
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const TIEN_TO = 'ZZTHU-';

async function chen() {
  for (const [ma, huong, ten] of [
    ['ZZTHU-1', 'out', 'THU P1 - chieu tru kho'],
    ['ZZTHU-2', 'in', 'THU P1 - chieu hoan kho'],
  ]) {
    await db.execute({
      sql: `INSERT INTO pos_stock_pending
              (order_code, order_id, sx_product_type, sx_product_id,
               product_name, quantity, direction, status, error_message,
               created_at, van_tay)
            VALUES (?, 0, 'juice', 999999, ?, 1, ?, 'pending',
                    'Dong THU cua thu_p1.js — khong co van tay nen se KHONG gui sang SX',
                    datetime('now'), NULL)`,
      args: [ma, ten, huong],
    });
  }
  console.log('\n✅ Da chen 2 dong so no gia (KHONG co van tay → khong bao gio goi SX)\n');
  console.log('   Bay gio mo POS tren trinh duyet:');
  console.log('   1. Dai bao MAU VANG phai hien o dau thanh ben trai: "2 viec kho cho gui"');
  console.log('   2. Bam vao dai → doi ngay → dai chuyen MAU DO: "2 viec can ban xem"');
  console.log('      (dung: khong co van tay thi khong tu gui, phai nguoi xem)');
  console.log('   3. Chay `node thu_p1.js don` de xoa sach\n');
  console.log('   Muon thu LOP 1 (an theo hoat dong): chen xong ĐỪNG bam gi,');
  console.log('   chi dung POS binh thuong, cho ~3 phut roi `node thu_p1.js xem`.');
  console.log('   Trang thai phai tu chuyen sang can_xem ma khong ai bam nut.\n');
  await xem();
}

async function xem() {
  const r = await db.execute(
    `SELECT order_code, direction, status, retry_count, van_tay
       FROM pos_stock_pending WHERE order_code LIKE '${TIEN_TO}%'
       ORDER BY order_code`,
  );
  if (!r.rows.length) {
    console.log('   (khong con dong THU nao)\n');
  } else {
    console.log('   ma don      chieu  trang thai   so lan thu  van tay');
    for (const d of r.rows) {
      console.log(
        `   ${String(d.order_code).padEnd(11)} ${String(d.direction).padEnd(6)} ` +
        `${String(d.status).padEnd(12)} ${String(d.retry_count ?? 0).padEnd(11)} ` +
        `${d.van_tay || '(khong co)'}`,
      );
    }
    console.log('');
  }

  const tong = await db.execute(
    `SELECT status, COUNT(*) n FROM pos_stock_pending
      WHERE status IN ('pending','can_xem') GROUP BY status`,
  );
  console.log('   Dai bao dang dem:',
    tong.rows.length ? tong.rows.map((x) => `${x.status}=${x.n}`).join(' · ') : '0 (dai bao khong hien)');
  console.log('');
}

async function don() {
  const r = await db.execute(
    `DELETE FROM pos_stock_pending WHERE order_code LIKE '${TIEN_TO}%'`,
  );
  console.log(`\n🧹 Da xoa ${r.rowsAffected} dong THU. So no tro lai nguyen trang.\n`);
  await xem();
}

const lenh = process.argv[2];
const bang = { chen, xem, don };
if (!bang[lenh]) {
  console.log('\nDung: node thu_p1.js chen | xem | don\n');
  process.exit(1);
}
bang[lenh]().catch((e) => { console.error('LOI:', e.message); process.exit(1); });
