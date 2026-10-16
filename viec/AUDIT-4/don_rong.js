#!/usr/bin/env node
// AUDIT-4 A6 — đơn rỗng / tổng 0 / chỉ mua thẻ ở POST /orders: có tạo đơn không, đơn đó vào báo cáo / điểm / ví ra sao. Chạy ở GỐC kho:
//   node viec/AUDIT-4/don_rong.js
// Chép server/ vào thư mục tạm (bản sao máy chủ), kho SQLite tạm, SX giả (khuôn cong_cu/thu_P26c.js:20–90). KHÔNG đụng server/ thật, data/, Turso.
// `items: []` + `membership_buy: {}` / `package_buy: {}` đã có ca T1b (thu_P26c.js:896), S2g (:849) — không lặp. Chỉ ĐO, không kết luận mức
// (mức ghi ở trang_thai.md / bao_cao.md). Thoát 0 khi chạy hết, 2 khi sập.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..', '..');
const TAM = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'audit4_rong_')));
const don = () => fs.rmSync(TAM, { recursive: true, force: true });
process.on('exit', don);
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => process.exit(130));   // 'exit' xoá TAM
fs.cpSync(path.join(GOC, 'server'), path.join(TAM, 'server'), { recursive: true });
fs.symlinkSync(path.join(GOC, 'node_modules'), path.join(TAM, 'node_modules'));
const MAY_CHU = path.join(TAM, 'server');
const KHO = path.join(TAM, 'kho.db');
const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = { id: duongKN, filename: duongKN, loaded: true, exports: {
  laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + KHO } }), diaChiSX: () => '', FILE_THU: KHO } };
process.env.JWT_SECRET = 'audit4_rong_' + Date.now();
process.env.TMPDIR = TAM;

const im = () => { const g = [console.log, console.error, console.warn]; console.log = console.error = console.warn = () => {}; return () => { [console.log, console.error, console.warn] = g; }; };

async function main() {
  let mo = im();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();
  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);   // nạp TRƯỚC: vế trái require.cache[…] tính trước vế phải
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true, checkStock: async () => ({ sufficient: true, stock: 999 }),
    outStockFIFO: async () => ({ ok: true }), inStockReturn: async () => ({ ok: true }), callSxApi: async () => ({ ok: true }) };
  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'reports']) app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  mo();
  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const the = jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const goi = async (method, url, body) => {
    const tat = im();
    try {
      const r = await fetch(`http://127.0.0.1:${sv.address().port}/api/pos${url}`, { method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + the } });
      let j = {}; try { j = await r.json(); } catch { /* không JSON */ }
      return { ...j, status: r.status };
    } finally { tat(); }
  };

  // Dữ liệu: 1 món 25.000, điểm bật (1 điểm / 1.000đ), mã giảm 100 %, hạng thẻ đầu, gói 300.000 / 10 lượt.
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 25000 WHERE id = ?', [sp.id]);
  for (const [k, v] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '1000']]) {
    await db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [k, v]);
  }
  await db.run("INSERT INTO pos_discount_codes (code, discount_type, discount_value, usage_limit, used_count, is_active) VALUES ('AU4FREE', 'percent', 100, 0, 0, 1)");
  const hang = await db.queryOne('SELECT id, card_price FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order LIMIT 1');
  const goiId = Number((await db.run("INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active) VALUES ('GOI_AU4', 'Gói AU4', 300000, 'ly', 10, 1)")).lastInsertRowid);
  const mon = (tuGoi = false) => ({ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: 1, from_package: tuGoi });
  const truoc = await goi('GET', '/reports/daily');

  const ket = [];
  const ca = async (ten, body) => {
    const r = await goi('POST', '/orders', { customer_name: 'Khách AU4', payment_method: 'cash', ...body });
    const o = r.order ? await db.queryOne('SELECT id, subtotal, total, status, customer_package_id FROM pos_orders WHERE id = ?', [r.order.id]) : null;
    const dong = o ? (await db.queryOne('SELECT COUNT(*) AS n FROM pos_order_items WHERE order_id = ?', [o.id])).n : '-';
    const diem = o ? (await db.queryOne('SELECT COALESCE(SUM(points), 0) AS n FROM pos_point_transactions WHERE order_id = ?', [o.id])).n : '-';
    const vi = o ? (await db.queryOne('SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS t FROM pos_balance_transactions WHERE order_id = ?', [o.id])) : null;
    console.log(`  ${ten} → HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}` + (o ? ` · đơn #${o.id} ${o.status} · subtotal ${o.subtotal}`
      + ` · total ${o.total} · ${dong} dòng · điểm ${diem} · sổ ví ${vi.n} dòng ${vi.t}` : ' · không tạo đơn'));
    if (o) ket.push(o);
    return { r, o };
  };
  console.log('\nAUDIT-4 A6 — đơn rỗng / tổng 0 ở POST /orders (bản sao máy chủ, kho tạm)');
  await ca('R1 items: [] (không gói, không thẻ)', { items: [], cash_amount: 0 });
  await ca('R5 1 món 25.000 + mã giảm 100 % (tổng 0), có SĐT', { items: [mon()], discount_code: 'AU4FREE', customer_phone: '0927900001', cash_amount: 0 });
  await ca(`R6 (K5) chỉ mua thẻ ${hang.card_price}, items: []`, { items: [], membership_buy: { tier_id: hang.id }, customer_phone: '0927900002', cash_amount: hang.card_price });
  const mua = await ca('R8a (K5) mua gói 300.000, items: []', { items: [], package_buy: { package_id: goiId, total_qty: 10, pkg_qty: 1 }, customer_phone: '0927900003', cash_amount: 300000 });
  const cp = (await db.queryOne('SELECT id FROM pos_customer_packages WHERE order_id = ?', [mua.o?.id]))?.id;
  await ca('R8b (K5) lấy 1 ly từ gói (0đ)', { items: [mon(true)], customer_package_id: cp, customer_phone: '0927900003', cash_amount: 0 });

  const sau = await goi('GET', '/reports/daily');
  const so = (b, k) => Number((b.order_stats || {})[k] ?? 0);   // reports.js:85–91 trả { order_stats, package_stats, … }
  const khoa = Object.keys(sau.order_stats || {});
  console.log(`\n  báo cáo /reports/daily (HTTP ${truoc.status} → ${sau.status}), sau − trước:`);
  for (const k of khoa) console.log(`    ${k}: ${so(truoc, k)} → ${so(sau, k)} (Δ ${so(sau, k) - so(truoc, k)})`);
  const tongDon = ket.reduce((s, o) => s + Number(o.total), 0);
  const demDon = ket.filter((o) => !(o.customer_package_id && Number(o.total) === 0)).length;
  console.log(`  đối chiếu: ${ket.length} đơn tạo · tổng total ${tongDon} · đơn báo cáo phải đếm (trừ giao từ gói 0đ) ${demDon}`);
  console.log('\n  A6 chạy hết');
  sv.close();
  await db.closeDatabase?.();
}

main().then(() => process.exit(0), (e) => { process.stderr.write('✖ A6 sập: ' + (e && e.stack || e) + '\n'); process.exit(2); });   // console có thể đang bị tắt
