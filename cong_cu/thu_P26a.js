#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ P26a — mã dòng vừa ghi (lastInsertRowid) trả ra JSON là SỐ, không BigInt
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3): kho trả BigInt → res.json ném lỗi →
 *  route GHI XONG rồi mới báo 500.
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_P26a.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến A5), như gia_lap/chay.js.
 *
 *  CHẠY THẬT như thu_P20.js: database.js thật + libsql thật trên file kho TẠM.
 *  Chỉ thay ketNoiKho (P8) để trỏ vào file tạm, tắt SX. Không đụng Turso.
 *  Chỉ so HTTP status, kiểu và id trong kho — không dò chữ (E12).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_p26a_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: {
    laMayThu: () => true,
    cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }),
    diaChiSX: () => '',
    FILE_THU: FILE_KHO,
  },
};
process.env.JWT_SECRET = 'thu_p26a_' + Date.now();
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_p26a';

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const laSo = (v) => typeof v === 'number' && Number.isInteger(v);

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();
  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'refunds', 'discount-codes', 'settings', 'packages', 'rewards', 'loyalty', 'tiers']) {
    app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  }
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();

  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const token = jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const goi = async (method, url, body) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { status: r.status, ...j };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.error ? ' · ' + r.error : ''}`;
  const idKho = async (sql, a) => (await db.queryOne(sql, a))?.id;
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 25000 WHERE id = ?', [sp.id]);
  const SDT = '0926000001';
  await db.run(`INSERT INTO pos_wallets (phone, balance, total_topup, total_spent, created_at, updated_at)
    VALUES (?, 100000, 100000, 0, datetime('now'), datetime('now'))`, [SDT]);
  // Bảng trống thì id = 1 = rowsAffected → "đúng dòng" không phân biệt được (soát vòng 3). Đẩy id mỗi bảng đi một khác.
  for (const [i, bang] of ['pos_refund_requests', 'pos_discount_codes', 'pos_invoice_logs', 'pos_customer_packages',
    'pos_reward_catalog', 'pos_voucher_grants'].entries()) await db.run('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)', [bang, 100 * (i + 1)]);

  console.log('\nTHỬ P26a — id trả ra JSON là số, đúng dòng vừa ghi');
  console.log('\n[A1] bốn route đưa thẳng lastInsertRowid vào res.json');
  const don = await goi('POST', '/orders', { customer_phone: SDT, customer_name: 'Khách P26a', payment_method: 'balance', balance_amount: 25000,
    items: [{ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: 1 }] });
  if (!don.success) throw new Error('không tạo được đơn trả bằng ví: ' + moTa(don));
  const c1 = await goi('POST', '/refunds', { order_id: don.order.id, reason: 'thử P26a' });
  const id1 = await idKho('SELECT id FROM pos_refund_requests WHERE order_id = ?', [don.order.id]);
  k('C1 POST /refunds → 200, refund_id là số, đúng dòng trong kho', c1.status === 200 && laSo(c1.refund_id) && c1.refund_id === id1,
    `${moTa(c1)} · refund_id ${c1.refund_id} · kho ${id1}`);
  const c2 = await goi('POST', '/discount-codes', { code: 'P26A_MA', discount_type: 'fixed', discount_value: 5000 });
  const id2 = await idKho('SELECT id FROM pos_discount_codes WHERE code = ?', ['P26A_MA']);
  k('C2 POST /discount-codes → 200, id là số, đúng dòng trong kho', c2.status === 200 && laSo(c2.id) && c2.id === id2,
    `${moTa(c2)} · id ${c2.id} · kho ${id2}`);
  const c3 = await goi('POST', '/settings/invoice/log', { order_id: don.order.id, order_code: don.order.code, invoice_number: 'HD-P26A' });
  const id3 = await idKho('SELECT id FROM pos_invoice_logs WHERE invoice_number = ?', ['HD-P26A']);
  k('C3 POST /settings/invoice/log → 200, data.id là số, đúng dòng trong kho', c3.status === 200 && laSo(c3.data?.id) && c3.data.id === id3,
    `${moTa(c3)} · id ${c3.data?.id} · kho ${id3}`);
  const goiId = Number((await db.run(`INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active)
    VALUES ('GOI_P26A', 'Gói P26a', 300000, 'ly', 10, 1)`)).lastInsertRowid);
  const c4 = await goi('POST', '/packages/buy', { customer_phone: SDT, package_id: goiId, total_qty: 10 });
  const id4 = await idKho('SELECT id FROM pos_customer_packages WHERE customer_phone = ? AND package_id = ?', [SDT, goiId]);
  k('C4 POST /packages/buy → 200, data.id là số, đúng dòng trong kho', c4.status === 200 && laSo(c4.data?.id) && c4.data.id === id4,
    `${moTa(c4)} · id ${c4.data?.id} · kho ${id4}`);

  console.log('\n[A1] đường trong giao dịch: beginTransaction().run');
  const tx = await db.beginTransaction();
  const r5 = await tx.run("INSERT INTO pos_settings (key, value, updated_at) VALUES ('thu_p26a', '1', datetime('now'))");
  await tx.commit();
  const id5 = Number((await db.queryOne("SELECT rowid AS id FROM pos_settings WHERE key = 'thu_p26a'")).id);
  k('C5 tx.run(INSERT) → lastInsertRowid là số, đúng dòng trong kho', laSo(r5.lastInsertRowid) && r5.lastInsertRowid === id5,
    `${typeof r5.lastInsertRowid} ${r5.lastInsertRowid} · kho ${id5}`);

  console.log('\n[A2] route đã tự bọc Number() — phải KHÔNG hỏng (K5)');
  const c7 = await goi('POST', '/rewards', { name: 'Quà P26a', points_cost: 10, discount_type: 'fixed', discount_value: 5000 });
  const id7 = await idKho('SELECT id FROM pos_reward_catalog WHERE name = ?', ['Quà P26a']);
  k('C7 POST /rewards → 200, id là số, đúng dòng trong kho', c7.status === 200 && laSo(c7.id) && c7.id === id7, `${moTa(c7)} · id ${c7.id} · kho ${id7}`);
  await db.run(`INSERT INTO pos_point_transactions (customer_phone, type, points, expires_at, reason, created_by, created_at)
    VALUES (?, 'earn', 50, NULL, 'thử P26a', 'thu', datetime('now'))`, [SDT]);
  const c8 = await goi('POST', '/loyalty/redeem', { phone: SDT, reward_id: id7 });
  const id8 = await idKho('SELECT id FROM pos_voucher_grants WHERE customer_phone = ? AND reward_id = ?', [SDT, id7]);
  k('C8 POST /loyalty/redeem → 200, grant_id là số, đúng dòng trong kho', c8.status === 200 && laSo(c8.data?.grant_id) && c8.data.grant_id === id8,
    `${moTa(c8)} · grant_id ${c8.data?.grant_id} · kho ${id8}`);
  const hang = await goi('GET', '/tiers');
  const c9 = await goi('PUT', '/tiers', { ...hang.data, tiers: hang.data?.tiers });
  k('C9 PUT /tiers lưu lại hạng có sẵn → 200', hang.status === 200 && c9.status === 200, `${moTa(hang)} / ${moTa(c9)}`);

  sv.close();
  console.log(`\n  ${dat} đạt · ${hong} hỏng\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai();
  console.error(`\n✖ Bài thử sập: ${e.message}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
