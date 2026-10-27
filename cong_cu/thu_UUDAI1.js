#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ UUDAI-1 — mã giảm dùng chung hay không với giá hạng, máy chủ chọn cách lợi hơn
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_UUDAI1.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến, viec/UUDAI-1/dot_bien.py). Settings.jsx / Sales.jsx đọc từ <may-chu>/../client/src.
 *
 *  Khuôn thu_DIEMTHAT1.js: database.js thật + libsql thật trên kho TẠM, SX giả (đếm lần gọi checkStock). co.mocTruocTx chạy TRỌN một
 *  lệnh khác trước khi giao dịch kế tiếp mở (hai quầy chồng nhau TẤT ĐỊNH). Số theo phiếu: hạng Vàng 10 % (nhóm đặc biệt 20 %),
 *  món 50.000 / 39.000 / 30.000 (đặc biệt). Ca đơn gửi đúng tổng phiếu tính → gốc sai tổng thì 400 (đỏ).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const CLIENT = path.join(MAY_CHU, '..', 'client', 'src', 'pages');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_uudai1_'));
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
process.env.JWT_SECRET = 'thu_uudai1_' + Date.now();

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const docNguon = (...p) => { try { return fs.readFileSync(path.join(...p), 'utf8'); } catch { return ''; } };

const KHOA = ['uudai_chung_hang_percent', 'uudai_chung_hang_fixed', 'uudai_chung_hang_item'];

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();

  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const sxGia = async () => ({ ok: true });
  const demSX = { n: 0 };
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true,
    checkStock: async () => { demSX.n++; return { sufficient: true, stock: 999 }; },
    outStockFIFO: sxGia, inStockReturn: sxGia, callSxApi: sxGia };

  const co = { mocTruocTx: null };
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const moc = co.mocTruocTx; co.mocTruocTx = null;
    if (moc) await moc();
    return txGoc(...a);
  };

  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'settings', 'refunds', 'thanh-toan', 'wallets']) app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  let tinhUuDai = null;
  try { ({ tinhUuDai } = require(path.join(MAY_CHU, 'utils', 'uuDai.js'))); } catch { /* gốc chưa có — A1 đỏ */ }
  noiLai();

  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);

  // E1 đọc NGAY sau khởi động, trước khi bài đặt cài đặt nào.
  const seed = {};
  for (const r of await db.query(`SELECT key, value FROM pos_settings WHERE key IN (${KHOA.map(() => '?').join(',')})`, KHOA)) seed[r.key] = r.value;

  const chu = await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const nv = Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES ('nv_uudai1', 'x', 'nv', 'staff', 1)")).lastInsertRowid);
  const theCua = { chu: jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '1h' }),
    nv: jwt.sign({ userId: nv }, process.env.JWT_SECRET, { expiresIn: '1h' }) };
  const goiAi = async (ai, method, url, body) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', ...(ai ? { Authorization: 'Bearer ' + theCua[ai] } : {}) } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const goi = (method, url, body) => goiAi('chu', method, url, body);
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;
  const datCaiDat = (key, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
  const chung = async (pct, fix, mon1) => { for (const [i, v] of [pct, fix, mon1].entries()) await datCaiDat(KHOA[i], v); };
  for (const [key, v] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', 1000], ['loyalty_expiry_mode', 'none'],
    ['flash_enabled', 'false'], ['thanh_toan_payos_bat_buoc', '0']]) await datCaiDat(key, v);

  // Món: 0 = 50.000 · 1 = 39.000 · 2 = 30.000 nhóm đặc biệt.
  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 3');
  for (const [i, g] of [50000, 39000, 30000].entries()) {
    await db.run('UPDATE pos_products SET price = ?, is_special_group = ? WHERE id = ?', [g, i === 2 ? 1 : 0, sp[i].id]);
  }
  const mon = (i, sl = 1) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type, sx_product_id: sp[i].sx_product_id, quantity: sl });
  await db.run("INSERT INTO pos_product_groups (id, code, name) VALUES (91, 'NHOM_UUDAI1', 'Nhóm thử UUDAI-1')");
  for (const i of [0, 1]) await db.run('INSERT INTO pos_product_group_members (group_id, sx_product_type, sx_product_id) VALUES (91, ?, ?)', [sp[i].sx_product_type, sp[i].sx_product_id]);

  const hangId = Number((await db.run("INSERT INTO pos_membership_tiers (name, card_price, discount_percent, special_discount_percent, sort_order, is_active) VALUES ('Vàng', 100000, 10, 20, 99, 1)")).lastInsertRowid);
  let soSdt = 0;
  const sdtMoi = () => '0938' + String(400000 + (++soSdt));
  const khachHang = async (hetHan = false) => {
    const s = sdtMoi();
    await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
      VALUES (?, ?, 'Vàng', 100000, NULL, datetime('now', '+7 hours', '-30 days'), datetime('now', '+7 hours', ?))`, [s, hangId, hetHan ? '-1 days' : '+300 days']);
    return s;
  };
  let soMa = 0;
  const taoMa = async (loai, giaTri, o = {}) => {
    const ma = (o.ten || 'UD1_') + (++soMa);
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active,
      discount_scope, applicable_group_id, valid_to) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [ma, loai, giaTri, o.min || 0, o.tran || 0, o.luot || 0, o.daDung || 0, o.motMon ? 'item' : 'order', o.motMon ? 91 : null, o.hetHan ? '2000-01-01' : null]);
    return ma;
  };
  const daDung = (ma) => so('SELECT used_count FROM pos_discount_codes WHERE code = ?', [ma]);
  const donDb = (id) => mot('SELECT * FROM pos_orders WHERE id = ?', [id]);
  const ban = (body, tien) => goi('POST', '/orders', { customer_name: 'Khách UUDAI-1', payment_method: 'cash', cash_amount: tien, ...body });
  const tinhThu = (body, ai = 'chu') => goiAi(ai, 'POST', '/orders/tinh-thu', { customer_name: 'Khách UUDAI-1', ...body });
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };
  // Ca "đơn → tổng T": 200, cột total = T, tier_discount = H, discount_code đúng (null = không ghi mã).
  const caDon = async (ten, r, T, H, ma) => {
    const d = r.order ? await donDb(r.order.id) : null;
    k(ten, r.status === 200 && !!d && Number(d.total) === T && Number(d.tier_discount || 0) === H && (d.discount_code || null) === (ma || null),
      `${moTa(r)} · ${d ? `total ${d.total} · hạng ${d.tier_discount} · mã ${d.discount_code}` : 'không đơn'}`);
  };

  console.log('\nTHỬ UUDAI-1 — mã giảm & giá hạng');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E1] seed 3 khoá khi khởi động');
  k('E1 kho mới khởi động → uudai_chung_hang_percent / _fixed / _item = "1"', KHOA.every((x) => seed[x] === '1'), JSON.stringify(seed));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] MỘT hàm thuần tinhUuDai ở server/utils/uuDai.js');
  await chay('A', async () => {
    const f = typeof tinhUuDai === 'function' ? tinhUuDai : () => ({});
    k('A1 nạp server/utils/uuDai.js, có hàm tinhUuDai', typeof tinhUuDai === 'function');
    const nguon = docNguon(MAY_CHU, 'utils', 'uuDai.js');
    k('A2 hàm thuần: uuDai.js không nạp database / helpers, không getNow / Date / query',
      nguon.length > 0 && !/require\([^)]*(database|helpers)/.test(nguon) && !/getNow|\bDate\b|query\(/.test(nguon));
    const od = docNguon(MAY_CHU, 'routes', 'orders.js');
    k('A3 orders.js gọi tinhUuDai đúng MỘT chỗ (taoDon — POST /, tinh-thu, payOS đều qua đó), không còn công thức tiền mã riêng (mã 1 món, trần mã %)',
      (od.match(/tinhUuDai\(/g) || []).length === 1 && !/computeItemDiscountAmount/.test(od) && !/SELECT max_discount FROM/.test(od));
    const D = (gia, sl, tl) => ({ unit_price: gia, quantity: sl, ti_le_hang: tl });
    const kq = [
      f({ dong: [D(50000, 2, 10)], ma: { loai: 'percent', gia_tri: 10, tran: 0, mot_mon: null }, dungChung: true }),
      f({ dong: [D(39000, 2, 10)], ma: { loai: 'fixed', gia_tri: 20000, tran: 0, mot_mon: null }, dungChung: false }),
      f({ dong: [D(39000, 2, 10)], ma: { loai: 'fixed', gia_tri: 5000, tran: 0, mot_mon: null }, dungChung: false }),
      f({ dong: [D(39000, 2, 0)], ma: null, dungChung: true }),
    ];
    const tom = kq.map((x) => `${x.cach}/${x.giam_hang}/${x.giam_ma}`).join(' ');
    k('A4 bốn cách: cả hai 10.000+9.000 · mã 0+20.000 · hạng 7.800+0 · không 0+0', tom === 'ca_hai/10000/9000 ma/0/20000 hang/7800/0 khong/0/0', tom);
    k('A5 hàm trả giá hạng từng dòng (chọn mã → null) + số tiền lợi hơn', kq[0].gia_hang?.[0] === 45000 && kq[1].gia_hang?.[0] === null
      && kq[1].loi_hon === 12200 && kq[2].loi_hon === 2800, JSON.stringify([kq[0].gia_hang, kq[1].gia_hang, kq[1].loi_hon, kq[2].loi_hon]));
    const le = f({ dong: [D(12345, 1, 0)], ma: { loai: 'percent', gia_tri: 10, tran: 0, mot_mon: null }, dungChung: true });
    k('A6 tiền giảm mã % làm tròn về đồng: 10 % của 12.345 → 1.235', le.giam_ma === 1235, `${le.giam_ma}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] dùng chung: hạng trước, mã trên phần còn lại');
  await chung(1, 1, 1);
  let donB1 = null;
  await chay('B', async () => {
    const s = await khachHang();
    const m1 = await taoMa('percent', 10);
    const r1 = await ban({ customer_phone: s, items: [mon(0, 2)], discount_code: m1 }, 81000);
    donB1 = r1.order?.id;
    await caDon('B1 2 × 50.000, Vàng 10 %, mã 10 % → hạng 10.000, mã 9.000, tổng 81.000', r1, 81000, 10000, m1);
    const m2 = await taoMa('percent', 10, { tran: 5000 });
    await caDon('B2 mã 10 % trần 5.000 → tổng 85.000', await ban({ customer_phone: await khachHang(), items: [mon(0, 2)], discount_code: m2 }, 85000), 85000, 10000, m2);
    const m3 = await taoMa('percent', 10, { min: 100000 });
    await caDon('B3a đơn tối thiểu 100.000 so với giá GỐC 100.000 → mã áp, 81.000', await ban({ customer_phone: await khachHang(), items: [mon(0, 2)], discount_code: m3 }, 81000), 81000, 10000, m3);
    const m4 = await taoMa('percent', 10, { min: 100001 });
    await caDon('B3b đơn tối thiểu 100.001 (ngay trên) → mã không áp, 90.000, không ghi mã', await ban({ customer_phone: await khachHang(), items: [mon(0, 2)], discount_code: m4 }, 90000), 90000, 10000, null);
    const m5 = await taoMa('fixed', 95000);
    await caDon('B4 mã tiền 95.000 → không vượt phần còn lại 90.000, tổng 0', await ban({ customer_phone: await khachHang(), items: [mon(0, 2)], discount_code: m5 }, 0), 0, 10000, m5);
    const m6 = await taoMa('percent', 20, { motMon: true });
    const r6 = await ban({ customer_phone: await khachHang(), items: [mon(0, 1)], discount_code: m6 }, 36000);
    await caDon('B5 mã 1 món 20 % trên món 50.000 Vàng → tính trên 45.000: giảm 9.000, tổng 36.000', r6, 36000, 5000, m6);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] không dùng chung: máy chọn cách lợi hơn');
  await chung(0, 0, 0);
  await chay('C', async () => {
    const m1 = await taoMa('fixed', 20000);
    const r1 = await ban({ customer_phone: await khachHang(), items: [mon(1, 2)], discount_code: m1 }, 58000);
    await caDon('C1a 2 × 39.000, mã 20.000 → chọn mã, tổng 58.000, tier_discount 0', r1, 58000, 0, m1);
    const d1 = r1.order ? await donDb(r1.order.id) : {};
    const giaHang = r1.order ? await so('SELECT COUNT(*) FROM pos_order_items WHERE order_id = ? AND tier_unit_price IS NOT NULL', [r1.order.id]) : NaN;
    k('C1b chọn mã → vẫn ghi customer_tier "Vàng", không món nào có giá hạng, mã tiêu 1 lượt', d1.customer_tier === 'Vàng' && giaHang === 0 && await daDung(m1) === 1,
      `${d1.customer_tier} · ${giaHang} món giá hạng · dùng ${await daDung(m1)}`);
    const m2 = await taoMa('fixed', 5000, { daDung: 1, luot: 5 });
    const r2 = await ban({ customer_phone: await khachHang(), items: [mon(1, 2)], discount_code: m2 }, 70200);
    await caDon('C2a mã 5.000 → chọn hạng, tổng 70.200, đơn KHÔNG ghi mã', r2, 70200, 7800, null);
    const d2 = r2.order ? await donDb(r2.order.id) : {};
    k('C2b chọn hạng → mã không tiêu (used_count giữ 1), đơn không loại / trị giá mã', r2.status === 200 && await daDung(m2) === 1 && !d2.discount_type && !Number(d2.discount_value),
      `dùng ${await daDung(m2)} · ${d2.discount_type}/${d2.discount_value}`);
    const m3 = await taoMa('fixed', 7800);
    await caDon('C3a mã 7.800 = hạng 7.800 → bằng nhau giữ hạng, 70.200', await ban({ customer_phone: await khachHang(), items: [mon(1, 2)], discount_code: m3 }, 70200), 70200, 7800, null);
    const m4 = await taoMa('fixed', 7801);
    await caDon('C3b mã 7.801 (ngay trên) → chọn mã, 70.199', await ban({ customer_phone: await khachHang(), items: [mon(1, 2)], discount_code: m4 }, 70199), 70199, 0, m4);
    const m5 = await taoMa('fixed', 5000, { luot: 1 });
    await ban({ customer_phone: await khachHang(), items: [mon(1, 2)], discount_code: m5 }, 70200);
    await caDon('C4 mã 1 lượt, đơn chọn hạng không tiêu → đơn sau (khách không hạng) vẫn dùng được, 34.000',
      await ban({ customer_phone: sdtMoi(), items: [mon(1, 1)], discount_code: m5 }, 34000), 34000, 0, m5);
    const huy = r2.order ? await goi('PUT', `/orders/${r2.order.id}/cancel`, { reason: 'thử UUDAI-1' }) : {};
    k('C5a huỷ đơn chọn hạng → 200, không trả lượt mã (used_count giữ 1)', huy.status === 200 && await daDung(m2) === 1, `${moTa(huy)} · dùng ${await daDung(m2)}`);
    const s5 = await khachHang();
    const nap = await goi('POST', '/wallets/topup', { phone: s5, amount: 70200, customer_name: 'Khách UUDAI-1', payment_method: 'cash' });
    const r5 = await goi('POST', '/orders', { customer_phone: s5, customer_name: 'Khách UUDAI-1', items: [mon(1, 2)], discount_code: m2,
      payment_method: 'balance', balance_amount: 70200 });
    const yc = r5.order ? await goi('POST', '/refunds', { order_id: r5.order.id, reason: 'thử UUDAI-1' }) : {};
    const dy = yc.refund_id ? await goi('POST', `/refunds/${yc.refund_id}/approve`, {}) : {};
    k('C5b duyệt hoàn đơn chọn hạng (trả bằng ví) → 200, không trả lượt mã (used_count giữ 1)', nap.status === 200 && r5.status === 200 && dy.status === 200
      && await daDung(m2) === 1, `${moTa(nap)} · ${moTa(r5)} · ${moTa(yc)} · ${moTa(dy)} · dùng ${await daDung(m2)}`);
    await chung(0, 1, 0);
    const m6 = await taoMa('fixed', 5000);
    await caDon('C6 chỉ tắt loại % — mã TIỀN vẫn dùng chung: 78.000 − 7.800 − 5.000 = 65.200',
      await ban({ customer_phone: await khachHang(), items: [mon(1, 2)], discount_code: m6 }, 65200), 65200, 7800, m6);
    await chung(0, 0, 0);
    const m7 = await taoMa('percent', 10, { motMon: true });
    const r7 = await ban({ customer_phone: await khachHang(), items: [mon(1, 2)], discount_code: m7 }, 70200);
    await caDon('C7a mã 1 món 10 % (3.900) < hạng 7.800 → chọn hạng, 70.200', r7, 70200, 7800, null);
    k('C7b chọn hạng → không dòng nào mang giá mã (signup_unit_price) trên bill', r7.status === 200 && (r7.order?.items || []).every((i) => i.signup_unit_price == null),
      JSON.stringify((r7.order?.items || []).map((i) => i.signup_unit_price)));
    await chung(1, 1, 0);
    const m8 = await taoMa('fixed', 9000, { motMon: true });
    await caDon('C8 mã 1 món kiểu TIỀN theo khoá "1 món" (tắt), không theo khoá "tiền" (bật): 9.000 > hạng 7.800 → chọn mã, 69.000',
      await ban({ customer_phone: await khachHang(), items: [mon(1, 2)], discount_code: m8 }, 69000), 69000, 0, m8);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] quà đổi điểm LUÔN dùng chung');
  await chay('D', async () => {
    await chung(0, 0, 0);
    const s = await khachHang();
    const m = await taoMa('fixed', 5000, { ten: 'QUA_UD1_', luot: 1 });
    await db.run("INSERT INTO pos_voucher_grants (code, customer_phone, status, granted_at) VALUES (?, ?, 'available', datetime('now'))", [m, s]);
    const r = await ban({ customer_phone: s, items: [mon(1, 2)], discount_code: m }, 65200);
    await caDon('D1a voucher đổi điểm, cả 3 khoá "0" → vẫn dùng chung: 65.200', r, 65200, 7800, m);
    k('D1b voucher chuyển "used", gắn đơn', (await mot('SELECT status FROM pos_voucher_grants WHERE code = ?', [m]))?.status === 'used');
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] cài đặt: chỉ người có quyền, chỉ "0" / "1"');
  await chay('E', async () => {
    await chung(1, 1, 1);
    const e2 = await goiAi('nv', 'PUT', '/settings', { settings: { uudai_chung_hang_percent: '0' } });
    k('E2 nhân viên (không manage_settings) sửa → 403, khoá giữ "1"', e2.status === 403
      && (await mot("SELECT value FROM pos_settings WHERE key = 'uudai_chung_hang_percent'"))?.value === '1', moTa(e2));
    for (const sai of ['2', 'true', '']) {
      const e3 = await goi('PUT', '/settings', { settings: { uudai_chung_hang_fixed: '0', uudai_chung_hang_percent: sai } });
      const v = await db.query(`SELECT key, value FROM pos_settings WHERE key IN ('uudai_chung_hang_percent', 'uudai_chung_hang_fixed')`);
      k(`E3 chủ gửi "${sai}" → 400 CAI_DAT_KHONG_HOP_LE, không ghi khoá nào (kể cả _fixed hợp lệ đi cùng)`, e3.status === 400 && e3.code === 'CAI_DAT_KHONG_HOP_LE'
        && v.length === 2 && v.every((x) => x.value === '1'), `${moTa(e3)} · ${JSON.stringify(v)}`);
    }
    const e4 = await goi('PUT', '/settings', { settings: { uudai_chung_hang_item: '0', store_name: 'Tứ Quý Đường' } });
    k('E4 chủ gửi "0" → 200, đọc lại "0"; khoá khác (store_name) không bị kiểm "0"/"1"', e4.status === 200
      && (await mot("SELECT value FROM pos_settings WHERE key = 'uudai_chung_hang_item'"))?.value === '0', moTa(e4));
    const st = docNguon(CLIENT, 'Settings.jsx');
    k('E5 Settings.jsx: khối "Mã giảm & giá hạng", 3 khoá, ô "Dùng chung với giá hạng", câu bỏ tích, "Quà đổi điểm: luôn dùng chung"',
      st.includes('Mã giảm & giá hạng') && KHOA.every((x) => st.includes(x)) && st.includes('Dùng chung với giá hạng')
      && st.includes('máy tự chọn cái giảm nhiều hơn') && st.includes('Quà đổi điểm: luôn dùng chung'));
    await chung(1, 1, 1);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] tinh-thu: cùng đường, không ghi, không gọi SX');
  await chay('F', async () => {
    await chung(0, 0, 0);
    const s = await khachHang();
    const m = await taoMa('fixed', 20000, { luot: 3 });
    await db.run("INSERT INTO pos_voucher_grants (code, customer_phone, status, granted_at) VALUES ('KHONG_LIEN_QUAN_UD1', ?, 'available', datetime('now'))", [s]);
    const truoc = { don: await so('SELECT COUNT(*) FROM pos_orders'), ma: await daDung(m), sx: demSX.n,
      phien: await so('SELECT COUNT(*) FROM pos_phien_thanh_toan'), qua: await so("SELECT COUNT(*) FROM pos_voucher_grants WHERE status = 'available'") };
    const t = await tinhThu({ customer_phone: s, items: [mon(1, 2)], discount_code: m });
    k('F1 trả subtotal 78.000 · hạng 0 · mã 20.000 · tổng 58.000 · cách "ma" · câu ghi giỏ · giá đơn vị theo hạng từng món',
      t.status === 200 && t.subtotal === 78000 && t.tier_discount === 0 && t.discount_amount === 20000 && t.total === 58000 && t.cach === 'ma'
      && typeof t.cau_ghi === 'string' && t.cau_ghi.length > 0 && Array.isArray(t.items) && t.items.length === 1 && 'tier_unit_price' in t.items[0],
      `${moTa(t)} · ${JSON.stringify({ ...t, items: undefined })}`);
    k('F2 không ghi: số đơn, lượt mã, phiên thanh toán, voucher giữ nguyên', t.status === 200 && await so('SELECT COUNT(*) FROM pos_orders') === truoc.don
      && await daDung(m) === truoc.ma && await so('SELECT COUNT(*) FROM pos_phien_thanh_toan') === truoc.phien
      && await so("SELECT COUNT(*) FROM pos_voucher_grants WHERE status = 'available'") === truoc.qua);
    k('F3 không gọi SX (checkStock 0 lần)', t.status === 200 && demSX.n === truoc.sx, `${demSX.n - truoc.sx} lần`);
    const t2 = await tinhThu({ customer_phone: s, items: [mon(1, 2)], discount_code: m, cash_amount: 1, payment_method: 'balance', balance_amount: 99999999 });
    k('F1b thân có trường tiền (ví thiếu) → bỏ qua, vẫn 200 cùng số', t2.status === 200 && t2.total === 58000, moTa(t2));
    // F4 + S5: cùng giỏ ở 6 cấu hình — số tinh-thu = số POST / ghi; quầy gửi đúng tổng máy chủ → không 400 "không khớp tổng".
    // Giỏ 50.000 + 2 × 39.000 = 128.000, hạng 12.800, phí giao 10.000. Cấu hình "tắt": % và tiền có ca máy chọn MÃ lẫn chọn HẠNG; mã 1 món
    // chỉ có ca chọn MÃ ở đây (ca chọn hạng của mã 1 món: C7a, qua POST).
    const caF4 = [['%, bật', [1, 1, 1], () => taoMa('percent', 10), 'ca_hai', 113680],
      ['% 20, tắt', [0, 0, 0], () => taoMa('percent', 20), 'ma', 112400], ['% 10 = hạng, tắt', [0, 0, 0], () => taoMa('percent', 10), 'hang', 125200],
      ['tiền, bật', [1, 1, 1], () => taoMa('fixed', 5000), 'ca_hai', 120200],
      ['tiền 20.000, tắt', [0, 0, 0], () => taoMa('fixed', 20000), 'ma', 118000], ['tiền 5.000, tắt', [0, 0, 0], () => taoMa('fixed', 5000), 'hang', 125200],
      ['1 món, bật', [1, 1, 1], () => taoMa('fixed', 9000, { motMon: true }), 'ca_hai', 116200],
      ['1 món 20.000, tắt', [0, 0, 0], () => taoMa('fixed', 20000, { motMon: true }), 'ma', 118000]];
    for (const [ten, cd, taoM, cachDung, tongDung] of caF4) {
      await chung(...cd);
      const sdt = await khachHang(), ma = await taoM();
      const than = { customer_phone: sdt, items: [mon(0, 1), mon(1, 2)], discount_code: ma, shipping_fee: 10000 };
      const tt = await tinhThu(than);
      const r = await ban(than, tt.total);
      const d = r.order ? await donDb(r.order.id) : {};
      k(`F4 ${ten}: tinh-thu cách "${cachDung}" tổng ${tongDung}; POST / gửi đúng tổng đó → 200, total / hạng / mã của đơn = tinh-thu`,
        tt.status === 200 && tt.cach === cachDung && tt.total === tongDung && r.status === 200
        && Number(d.total) === tt.total && Number(d.tier_discount) === tt.tier_discount && (d.discount_code || null) === (tt.cach === 'hang' ? null : ma),
        `${moTa(tt)} · ${moTa(r)} · ${tt.cach} · đơn ${d.total}/${d.tier_discount}/${d.discount_code}`);
    }
    k('F5 chưa đăng nhập → 401', (await tinhThu({ items: [mon(0)] }, null)).status === 401);
    await chung(1, 1, 1);
    const f6 = await tinhThu({ customer_phone: await khachHang(), items: [mon(0, 2)], discount_code: 'KHONG_CO_MA_NAY' });
    k('F6 mã không có → 200, ma_loi có lời + ma_loi_code MA_KHONG_TON_TAI, tính NHƯ KHÔNG MÃ (cách "hang", 90.000, giảm mã 0)',
      f6.status === 200 && typeof f6.ma_loi === 'string' && f6.ma_loi.length > 0 && f6.ma_loi_code === 'MA_KHONG_TON_TAI'
      && f6.cach === 'hang' && f6.discount_amount === 0 && f6.total === 90000, `${moTa(f6)} · ${f6.ma_loi} · ${f6.ma_loi_code} · ${f6.cach} · ${f6.total}`);
    const f7 = await tinhThu({ customer_phone: s, items: [mon(1, 2)], discount_code: m });
    k('F7 mã hợp lệ → ma_loi rỗng', f7.status === 200 && !f7.ma_loi, `${moTa(f7)} · ${f7.ma_loi}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] không đổi');
  await chay('G', async () => {
    await chung(1, 1, 1);
    const trongFlash = async (f) => {
      const gio = Number(new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(11, 13));
      for (const [key, v] of [['flash_enabled', 'true'], ['flash_start', `${String(gio).padStart(2, '0')}:00`],
        ['flash_end', `${String((gio + 2) % 24).padStart(2, '0')}:00`], ['flash_percent', 20],
        ['flash_product_keys', JSON.stringify([`${sp[0].sx_product_type}_${sp[0].sx_product_id}`])]]) await datCaiDat(key, v);
      try { return await f(); } finally { await datCaiDat('flash_enabled', 'false'); }
    };
    const mG1 = await taoMa('fixed', 5000);
    const g1 = await trongFlash(() => ban({ customer_phone: sdtMoi(), items: [mon(0, 1)], discount_code: mG1 }, 35000));
    const sG1 = await khachHang();
    const g1b = await trongFlash(() => ban({ customer_phone: sG1, items: [mon(0, 1)], discount_code: mG1 }, 35000));
    await caDon('G1 Flash 20 % + mã tiền 5.000, khách Vàng → không hạng: 50.000 − 10.000 − 5.000 = 35.000', g1b, 35000, 0, mG1);
    k('G1b khách lẻ cùng giỏ trong Flash → 35.000 (đối chứng)', g1.status === 200, moTa(g1));
    const mG = await taoMa('percent', 10);
    await caDon('G2 thẻ hết hạn + mã 10 % → không hạng: 90.000', await ban({ customer_phone: await khachHang(true), items: [mon(0, 2)], discount_code: mG }, 90000), 90000, 0, mG);
    await caDon('G2b khách lẻ (không SĐT) + mã 10 % → 90.000', await ban({ items: [mon(0, 2)], discount_code: mG }, 90000), 90000, 0, mG);
    const g3 = await ban({ customer_phone: await khachHang(), items: [mon(0, 1)], membership_buy: { tier_id: hangId } }, 145000);
    await caDon('G3 mua thẻ 100.000 + món 50.000, khách Vàng → hạng chỉ trên món: 145.000', g3, 145000, 5000, null);
    const goiId = Number((await db.run(`INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active)
      VALUES ('GOI_UUDAI1', 'Gói UUDAI-1', 300000, 'ly', 10, 1)`)).lastInsertRowid);
    const muaGoi = { items: [mon(0, 1)], package_buy: { package_id: goiId, total_qty: 10, pkg_qty: 1 } };
    const g3b = await ban({ customer_phone: await khachHang(), ...muaGoi }, 345000);
    await caDon('G3b mua gói 300.000 + món 50.000, khách Vàng → hạng chỉ trên món: 345.000', g3b, 345000, 5000, null);
    const giaHangGoi = g3b.order ? await so('SELECT COUNT(*) FROM pos_order_items WHERE order_id = ? AND product_id < 0 AND tier_unit_price IS NOT NULL', [g3b.order.id]) : NaN;
    k('G3c dòng gói không có giá hạng', giaHangGoi === 0, `${giaHangGoi}`);
    const mG3 = await taoMa('percent', 10);
    await caDon('G3d mua gói + món, Vàng, mã 10 % dùng chung → mã trên phần còn lại (gồm dòng gói như cũ): 350.000 − 5.000 − 34.500 = 310.500',
      await ban({ customer_phone: await khachHang(), ...muaGoi, discount_code: mG3 }, 310500), 310500, 5000, mG3);
    await caDon('G4 nhóm đặc biệt 30.000 → special 20 %: 24.000', await ban({ customer_phone: await khachHang(), items: [mon(2, 1)] }, 24000), 24000, 6000, null);
    const s5 = await khachHang();
    await caDon('G5a đơn KHÔNG mã, khách Vàng → 90.000 như cũ', await ban({ customer_phone: s5, items: [mon(0, 2)] }, 90000), 90000, 10000, null);
    await db.run("INSERT INTO pos_customers (phone, name, discount_type, discount_value, created_at) VALUES (?, 'Khách giảm riêng', 'percent', 5, datetime('now'))", [s5]);
    await caDon('G5b đơn KHÔNG mã, Vàng + giảm riêng 5 % (trên giá gốc như cũ) → 85.000', await ban({ customer_phone: s5, items: [mon(0, 2)] }, 85000), 85000, 10000, null);
    const diem = donB1 ? await so("SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [donB1]) : NaN;
    k('G6 điểm theo tổng mới: đơn B1 81.000 tiền mặt, 1.000đ = 1 điểm → 81 điểm', diem === 81, `${diem}`);
    const mG7 = await taoMa('percent', 10);
    await caDon('G7 phí giao 20.000 không giảm hạng, không áp mã: 100.000 − 10.000 − 9.000 + 20.000 = 101.000',
      await ban({ customer_phone: await khachHang(), items: [mon(0, 2)], discount_code: mG7, shipping_fee: 20000 }, 101000), 101000, 10000, mG7);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[K] luồng hợp lệ không bị chặn');
  await chay('K', async () => {
    for (const cd of [[1, 1, 1], [0, 0, 0]]) {
      await chung(...cd);
      const m = await taoMa('percent', 10);
      await caDon(`K1 khách không hạng + mã 10 % (${cd[0] ? 'bật' : 'tắt'}) → mã áp: 90.000`, await ban({ customer_phone: sdtMoi(), items: [mon(0, 2)], discount_code: m }, 90000), 90000, 0, m);
    }
    const mh = await taoMa('fixed', 5000, { hetHan: true });
    const sk = await khachHang();
    await caDon('K2a mã hết hạn → đơn 200 như cũ, không ghi mã (khách Vàng: 90.000)', await ban({ customer_phone: sk, items: [mon(0, 2)], discount_code: mh }, 90000), 90000, 10000, null);
    const k2 = await tinhThu({ customer_phone: sk, items: [mon(0, 2)], discount_code: mh });
    k('K2b tinh-thu mã hết hạn → báo ma_loi + ma_loi_code MA_KHONG_AP_DUNG (không lặng lẽ bỏ)', k2.status === 200 && !!k2.ma_loi
      && k2.ma_loi_code === 'MA_KHONG_AP_DUNG', `${moTa(k2)} · ${k2.ma_loi} · ${k2.ma_loi_code}`);
    await chung(0, 0, 0);
    const sp3 = await khachHang(), mp = await taoMa('fixed', 5000);
    const than = { customer_phone: sp3, customer_name: 'K', items: [mon(1, 2)], discount_code: mp };
    const tt = await tinhThu(than);
    const ph = await goi('POST', '/thanh-toan/phien', { don: than, cach: 'tien_mat' });
    k('K3a payOS / phiên: tổng phiên = tinh-thu = 70.200 (chọn hạng)', ph.status === 200 && ph.phien?.tong === 70200 && tt.total === 70200,
      `${moTa(ph)} · phiên ${ph.phien?.tong} · tinh-thu ${tt.total}`);
    const ch = ph.phien ? await goi('POST', `/thanh-toan/phien/${ph.phien.id}/chot`, { cash_received: 70200 }) : {};
    const dch = ch.order?.id ? await donDb(ch.order.id) : (ph.phien ? await mot('SELECT o.* FROM pos_orders o JOIN pos_phien_thanh_toan p ON p.order_id = o.id WHERE p.id = ?', [ph.phien.id]) : null);
    k('K3b chốt phiên (taoDon chạy lại đủ) → đơn 70.200, không ghi mã, mã không tiêu', ch.status === 200 && !!dch && Number(dch.total) === 70200
      && !dch.discount_code && await daDung(mp) === 0, `${moTa(ch)} · ${dch ? dch.total + '/' + dch.discount_code : 'không đơn'} · dùng ${await daDung(mp)}`);
  });

  // Vòng soát 3: mỗi trường gói / thẻ của danh sách trắng tinh-thu có một ca "phải KHÔNG bị chặn" (tinh-thu = POST, đúng số tính tay).
  await chay('K4', async () => {
    await chung(1, 1, 1);
    const goiK4 = Number((await db.run(`INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active)
      VALUES ('GOI_UUDAI1_K4', 'Gói K4', 300000, 'ly', 10, 1)`)).lastInsertRowid);
    const caK4 = [];
    {
      const s = await khachHang();
      const cp = Number((await db.run(`INSERT INTO pos_customer_packages (customer_phone, package_id, status, total_qty, delivered_qty, created_at, updated_at)
        VALUES (?, ?, 'active', 10, 0, datetime('now'), datetime('now'))`, [s, goiK4])).lastInsertRowid);
      caK4.push(['K4a LẤY TỪ GÓI 1 món + mua 2 × 39.000, Vàng, mã tiền 5.000 → 78.000 − 7.800 − 5.000 = 65.200',
        { customer_phone: s, items: [{ ...mon(0, 1), from_package: true }, mon(1, 2)], customer_package_id: cp, discount_code: await taoMa('fixed', 5000) }, 65200]);
    }
    caK4.push(['K4b MUA GÓI 300.000 + món 50.000, Vàng, mã 10 % → 310.500',
      { customer_phone: await khachHang(), items: [mon(0, 1)], package_buy: { package_id: goiK4, total_qty: 10, pkg_qty: 1 }, discount_code: await taoMa('percent', 10) }, 310500]);
    caK4.push(['K4c MUA THẺ 100.000 + món 50.000, Vàng, mã tiền 5.000 → 150.000 − 5.000 − 5.000 = 140.000',
      { customer_phone: await khachHang(), items: [mon(0, 1)], membership_buy: { tier_id: hangId }, discount_code: await taoMa('fixed', 5000) }, 140000]);
    for (const [ten, than, tong] of caK4) {
      const tt = await tinhThu(than);
      const r = await ban(than, tt.total);
      const d = r.order ? await donDb(r.order.id) : {};
      k(`${ten}: tinh-thu 200 đúng tổng; POST / gửi tổng đó → 200, đơn ghi đúng tổng`, tt.status === 200 && tt.total === tong && r.status === 200
        && Number(d.total) === tong, `${moTa(tt)} · tinh-thu ${tt.total} · ${moTa(r)} · đơn ${d.total}`);
    }
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[H] hai quầy cùng bấm');
  await chay('H', async () => {
    await chung(0, 0, 0);
    const m = await taoMa('fixed', 5000, { luot: 1 });
    const sA = await khachHang();
    let rB = null;
    co.mocTruocTx = async () => { rB = await ban({ customer_phone: sdtMoi(), items: [mon(1, 1)], discount_code: m }, 34000); };
    const rA = await ban({ customer_phone: sA, items: [mon(1, 2)], discount_code: m }, 70200);
    k('H1 mã còn 1 lượt: đơn A (Vàng → chọn hạng) chồng đơn B (không hạng → dùng mã) → cả hai 200, used_count 1',
      rA.status === 200 && rB?.status === 200 && await daDung(m) === 1 && !(await donDb(rA.order?.id))?.discount_code,
      `${moTa(rA)} · ${rB ? moTa(rB) : 'B không chạy'} · dùng ${await daDung(m)}`);
    const m2 = await taoMa('fixed', 20000, { luot: 1 });
    let rD = null;
    co.mocTruocTx = async () => { rD = await ban({ customer_phone: await khachHang(), items: [mon(1, 2)], discount_code: m2 }, 58000); };
    const rC = await ban({ customer_phone: await khachHang(), items: [mon(1, 2)], discount_code: m2 }, 58000);
    k('H2 hai đơn cùng CHỌN MÃ lượt cuối → một 200, một 400 DISCOUNT_CODE_LIMIT_REACHED, used_count 1',
      rD?.status === 200 && rC.status === 400 && rC.code === 'DISCOUNT_CODE_LIMIT_REACHED' && await daDung(m2) === 1,
      `${rD ? moTa(rD) : '-'} · ${moTa(rC)} · dùng ${await daDung(m2)}`);
    await chung(1, 1, 1);
    const s3 = await khachHang(), m3 = await taoMa('fixed', 5000);
    const than = { customer_phone: s3, items: [mon(1, 2)], discount_code: m3 };
    const t3 = await tinhThu(than);
    await chung(0, 0, 0);
    const d0 = await so('SELECT COUNT(*) FROM pos_orders');
    const r3 = await ban(than, t3.total);
    k('H3 chủ đổi cài đặt giữa tinh-thu (65.200) và POST → POST tính lại 70.200, tiền gửi lệch → 400, không đơn nào ghi',
      t3.total === 65200 && r3.status === 400 && await so('SELECT COUNT(*) FROM pos_orders') === d0, `${t3.total} · ${moTa(r3)}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[S] màn Bán hàng cũ (Sales.jsx) dùng số máy chủ khi có mã');
  {
    const sa = docNguon(CLIENT, 'Sales.jsx');
    k('S1 Sales.jsx nạp client `api` có sẵn và hỏi POST /orders/tinh-thu (không fetch trần)', /import \{[^}]*\bapi\b[^}]*\} from '\.\.\/utils\/api'/.test(sa)
      && /api\.post\('\/orders\/tinh-thu'/.test(sa));
    const khoaDon = ['customer_phone', 'items', 'discount_code', 'shipping_fee', 'customer_package_id', 'package_buy', 'membership_buy'];
    k('S2 thân tinh-thu và thân tạo đơn dựng từ CÙNG một hàm donGuiMayChu (món, khách, mã, phí giao, gói, thẻ) — không hai bản lệch nhau',
      /api\.post\('\/orders\/tinh-thu', donGuiMayChu\(\)\)/.test(sa) && /const don = donGuiMayChu\(\);/.test(sa)
      && khoaDon.every((x) => new RegExp(`\\n        ${x}: don\\.${x},`).test(sa)) && (sa.match(/discount_code: discountCodeValid/g) || []).length === 1);
    k('S3 có mã → tổng / giảm hạng / giảm mã lấy từ kết quả tinh-thu', /const total = tinhThu \? tinhThu\.total :/.test(sa)
      && /tinhThu \? tinhThu\.tier_discount :/.test(sa) && /tinhThu \? tinhThu\.discount_amount :/.test(sa));
    k('S4 có mã mà chưa có số máy chủ → không mở thu tiền', /discountCodeValid\?\.valid && !tinhThu\)/.test(sa));
    k('S5 giỏ hiện câu máy chủ ghi (cau_ghi)', /tinhThu\?\.cau_ghi/.test(sa));
    k('S6 tinh-thu lỗi → giữ lý do máy chủ (tinhThuLoi), bấm thu hiện đúng lý do, không ghi đè bằng "đang tính"',
      /setTinhThuLoi\(e\.message/.test(sa) && /setError\(tinhThuLoi \|\| /.test(sa));
    k('S7 tinh-thu hỏi lại khi Flash / hạng ĐỔI NỘI DUNG (khoá chuỗi — làm mới 60 giây không xoá số máy chủ) và ngay trước khi ghi đơn có mã',
      /\[khoaGio, customer\?\.phone, discountCodeValid, shippingFee, activePkgId, buyQty, khoaFlash, khoaHang\]/.test(sa)
      && /const khoaFlash = flashState \? `\$\{flashState\.is_flash_now\}\|\$\{flashState\.percent\}\|/.test(sa)
      && /const khoaHang = membershipInfo \? `\$\{membershipInfo\.usable\}\|\$\{membershipInfo\.discount_percent\}\|\$\{membershipInfo\.special_discount_percent\}`/.test(sa)
      && /const moi = await api\.post\('\/orders\/tinh-thu', don\);\s*if \(moi\.total !== total\) \{\s*setTinhThu\(moi\);/.test(sa));
    const khoaGio = (sa.match(/const khoaGio = [^\n]*/) || [''])[0];
    k('S10 giỏ khoá theo phần tính tiền (món, số lượng, lấy từ gói, gói, thẻ), KHÔNG theo ghi chú — gõ ghi chú không xoá số máy chủ (vòng soát 3)',
      /\}, \[khoaGio, /.test(sa) && /i\.product_id, i\.quantity, i\.fromPkg, i\.is_pkg, i\.is_membership, i\.package_id, i\.tier_id/.test(khoaGio)
      && !/note/.test(khoaGio), khoaGio);
    k('S9 giỏ hiện lý do mã không áp (ma_loi) từ tinh-thu', /\{tinhThu\?\.ma_loi && \(/.test(sa) && /\{tinhThu\.ma_loi\}/.test(sa));
    const st2 = docNguon(CLIENT, 'Settings.jsx');
    const khoiUuDai = (st2.match(/const loadUuDaiChung = [\s\S]*?const deleteTier/) || [''])[0];
    k('S8 Settings.jsx: khối mới gọi máy chủ qua utils/api.js (api.get / api.put), không qua pkgApi / fetch',
      /api\.get\('\/settings'\)/.test(khoiUuDai) && /api\.put\('\/settings'/.test(khoiUuDai) && !/pkgApi|fetch\(/.test(khoiUuDai));
  }

  sv.close();
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  console.log(`\n  ${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.error('BÀI SẬP:', e); process.exit(2); });
