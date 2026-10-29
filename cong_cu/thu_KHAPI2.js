#!/usr/bin/env node
process.env.TZ = 'UTC';   // F8: cả bài chạy như Render (máy chủ UTC) — mọi giờ trả ra vẫn phải là giờ VN
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KH-API-2 — cửa App KH chỉ đọc (hạng, ví, hạng, giờ vàng, giá hạng, giờ hoạt động) + hạn mã theo cài đặt
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có giaHang.js, gioHoatDong.js, 4 cửa mới). Xanh ngay = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KHAPI2.js
 *
 *  Khuôn thu_KH1.js: database.js thật + libsql thật trên file kho TẠM; chỉ thay ketNoiKho (P8), tắt SX. Express riêng mount ĐÚNG
 *  đường như index.js. Đơn tạo qua POST /orders thật. Thời gian trôi dựng bằng cách lùi cột giờ trong kho tạm, không ngủ.
 *  Module chưa có (code gốc) → ca của nó hỏng riêng, không sập cả bài.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khapi2_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_khapi2_nv_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_khapi2_kh_' + Date.now();
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_khapi2';

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
let sau = 0;   // số lời gọi đang chạy (A4 gọi song song) — chỉ nối log lại khi lời gọi cuối xong
const imLang = () => { sau++; console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = (het = false) => { sau = het ? 0 : Math.max(0, sau - 1); if (!sau) { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; } };
const thuNap = (p) => { try { return require(p); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return null; throw e; } };
const GIO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/;
const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  const { tinhUuDai } = require(path.join(GOC, 'server', 'utils', 'uuDai.js'));
  const { kyTokenKhach } = require(path.join(GOC, 'server', 'middleware', 'khachAuth.js'));
  const GH = thuNap(path.join(GOC, 'server', 'utils', 'giaHang.js'));
  const HD = thuNap(path.join(GOC, 'server', 'utils', 'gioHoatDong.js'));
  await db.initDatabase();

  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use(express.json());
  for (const [duong, f] of [['orders', 'orders.js'], ['signup-codes', 'signup-codes.js'], ['settings', 'settings.js'], ['products', 'products.js']]) {
    app.use('/api/pos/' + duong, require(R(f)));
  }
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  const goi = async (method, url, body, tk) => {
    const headers = body !== undefined ? { 'Content-Type': 'application/json' } : {};
    if (tk) headers.Authorization = 'Bearer ' + tk;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      return { status: r.status, j, tho };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;
  const datCaiDat = (key, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
  const luc = async (giay) => (await db.queryOne("SELECT strftime('%Y-%m-%dT%H:%M:%S', ?, ?) AS t", [getNow(), `${giay} seconds`])).t;
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(true); k(`${ten}: bài chạy hết mục`, false, e.message); } };
  for (const [a, b] of [['signup_enabled', '1'], ['signup_discount_type', 'percent'], ['signup_discount_value', '10'], ['nhandiem_enabled', '1'],
    ['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['flash_enabled', 'false'], ['thanh_toan_payos_bat_buoc', '0']]) await datCaiDat(a, b);

  // Món 0 thường 45.000 · món 1 nhóm đặc biệt 33.333. Hạng thử 12,5 % / 7 %; hạng 0 %; hạng tắt.
  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 2');
  for (const [i, g] of [45000, 33333].entries()) await db.run('UPDATE pos_products SET price = ?, is_special_group = ? WHERE id = ?', [g, i, sp[i].id]);
  const mon = (i, sl = 1) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type, sx_product_id: sp[i].sx_product_id, quantity: sl });
  const maMon = (i) => `${sp[i].sx_product_type}_${sp[i].sx_product_id}`;
  const themHang = async (ten, gia, pt, ptDb, thuTu, bat) => Number((await db.run(`INSERT INTO pos_membership_tiers (name, card_price, discount_percent,
    special_discount_percent, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)`, [ten, gia, pt, ptDb, thuTu, bat])).lastInsertRowid);
  const hangThu = await themHang('Thử', 100000, 12.5, 7, 50, 1);
  const hang0 = await themHang('Không giảm', 1000, 0, 0, 60, 1);
  const hangTat = await themHang('Đã tắt', 1, 30, 30, 0, 0);
  let soSdt = 0;
  const khachMoi = async (hetHanGiay) => {
    const sdt = '0937' + String(500000 + (++soSdt));
    const id = Number((await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + soSdt, getNow()])).lastInsertRowid);
    if (hetHanGiay !== undefined) {
      await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
        VALUES (?, ?, 'Thử', 100000, NULL, ?, ?)`, [sdt, hangThu, (await luc(-86400)).replace('T', ' '), (await luc(hetHanGiay)).replace('T', ' ')]);
    }
    return { sdt, id, tk: kyTokenKhach(id) };
  };
  const tinhThu = (sdt, items) => goi('POST', '/pos/orders/tinh-thu', { customer_name: 'K', customer_phone: sdt, items }, tkChu);
  const ban = (sdt, items, tien) => goi('POST', '/pos/orders', { customer_name: 'K', customer_phone: sdt, items, payment_method: 'cash', cash_amount: tien }, tkChu);
  const giaDong = async (orderId, i) => Number((await db.queryOne('SELECT tier_unit_price AS g FROM pos_order_items WHERE order_id = ? AND product_id = ?',
    [orderId, sp[i].id])).g);
  console.log('\nTHỬ KH-API-2 — cửa App KH chỉ đọc + giờ hoạt động');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] một hàm % hạng + giá hạng (server/utils/giaHang.js) — cùng phép làm tròn với tinhUuDai');
  await chay('A1-A2', async () => {
    k('A · nạp được server/utils/giaHang.js', !!GH);
    if (!GH) return;
    const h = { discount_percent: 12.5, special_discount_percent: 7 };
    for (const [ten, hang, db_, mong] of [['thường', h, false, 12.5], ['nhóm đặc biệt', h, true, 7], ['95 → 90', { discount_percent: 95 }, false, 90],
      ['−5 → 0', { discount_percent: -5 }, false, 0], ['null → 0', { discount_percent: null }, false, 0], ["'abc' → 0", { discount_percent: 'abc' }, false, 0],
      ["'12.5' → 12.5", { special_discount_percent: '12.5' }, true, 12.5]]) {
      k(`A1 tiLeHangMon ${ten}`, GH.tiLeHangMon(hang, db_) === mong, String(GH.tiLeHangMon(hang, db_)));
    }
    for (const [gia, pt, mong] of [[3, 12.5, 3], [45000, 12.5, 39375], [33333, 15, 28333], [10001, 15, 8501], [45000, 0, 45000]]) {
      k(`A2 giaHangMon(${gia}, ${pt}) = ${mong}`, GH.giaHangMon(gia, pt) === mong, String(GH.giaHangMon(gia, pt)));
    }
    let hat = 7, lechMay = [], lechMan = [];
    const ngau = () => { hat = (hat * 48271) % 2147483647; return hat; };
    let T = null; try { T = await import(pathToFileURL(path.join(GOC, 'client', 'src', 'pages', 'BanHang', 'tinh.js')).href); } catch { T = null; }
    for (let i = 0; i < 50; i++) {
      const gia = 1000 + (ngau() % 199001), pt = (ngau() % 181) / 2;
      const may = tinhUuDai({ dong: [{ unit_price: gia, quantity: 1, ti_le_hang: pt }], ma: null, dungChung: false }).gia_hang[0] ?? gia;
      if (GH.giaHangMon(gia, pt) !== may) lechMay.push(`${gia}/${pt}`);
      if (T && T.giaHang(gia, pt).hang !== GH.giaHangMon(gia, pt)) lechMan.push(`${gia}/${pt}`);
    }
    k('A2 50 cặp (giá, %) ngẫu nhiên hạt cố định: giaHangMon = tinhUuDai(...).gia_hang[0]', lechMay.length === 0, lechMay.slice(0, 3).join(', '));
    if (T) k('A2b cùng 50 cặp = giaHang(gia, %).hang của màn bán BanHang/tinh.js', lechMan.length === 0, lechMan.slice(0, 3).join(', '));
    else console.log('  · A2b CHƯA KIỂM — không nạp được client/src/pages/BanHang/tinh.js (không đếm là đạt)');
    const src = fs.readFileSync(R('orders.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    k('A5 orders.js nạp giaHang.js và quyết % hạng bằng tiLeHangMon (không còn công thức % riêng)',
      /require\(["']\.\.\/utils\/giaHang["']\)/.test(src) && /tiLeHangMon\(tier, it\.is_special_group\)/.test(src) && !src.includes('special_discount_percent) || 0'));
  });

  await chay('A3-A4', async () => {
    const kh = await khachMoi(300 * 86400);
    const m = await goi('GET', '/kh/menu', undefined, kh.tk);
    const giaMenu = (i) => ((m.j.data || []).find((x) => x.ma === maMon(i))?.gia_hang || []).find((g) => g.hang_id === hangThu)?.gia;
    const tt = await tinhThu(kh.sdt, [mon(0), mon(1)]);
    const r = await ban(kh.sdt, [mon(0), mon(1)], tt.j.total);
    const dong = r.j.order ? [await giaDong(r.j.order.id, 0), await giaDong(r.j.order.id, 1)] : [];
    k('A3 /menu gia_hang của hạng khách: món thường 39.375 (12,5 %), món đặc biệt 31.000 (7 % riêng)', giaMenu(0) === 39375 && giaMenu(1) === 31000,
      `${moTa(m)} · ${giaMenu(0)} · ${giaMenu(1)}`);
    k('A3 tinh-thu tier_unit_price từng món = gia_hang của /menu (cùng khách, cùng hạng)',
      tt.status === 200 && tt.j.items?.[0]?.tier_unit_price === giaMenu(0) && tt.j.items?.[1]?.tier_unit_price === giaMenu(1),
      `${moTa(tt)} · ${tt.j.items?.map((x) => x.tier_unit_price)}`);
    k('A3 POST /orders thật: tier_unit_price đã ghi = gia_hang của /menu; tổng 70.375', r.status === 200 && bang(dong, [giaMenu(0), giaMenu(1)])
      && Number(tt.j.total) === 70375, `${moTa(r)} · ${dong} · tổng ${tt.j.total}`);
    // A4 — hai người cùng bấm: hai khách cùng hạng, hai đơn CÙNG LÚC.
    const [k1, k2] = [await khachMoi(300 * 86400), await khachMoi(300 * 86400)];
    const hai = await Promise.all([ban(k1.sdt, [mon(0), mon(1)], 70375), ban(k2.sdt, [mon(0), mon(1)], 70375)]);
    const ghi = [];
    for (const x of hai) ghi.push(x.j.order ? [await giaDong(x.j.order.id, 0), await giaDong(x.j.order.id, 1), Number((await db.queryOne('SELECT total FROM pos_orders WHERE id = ?', [x.j.order.id])).total)] : null);
    k('A4 hai POST /orders cùng lúc, hai khách cùng hạng → cả hai 200, giá hạng 39.375 / 31.000, tổng 70.375',
      hai.every((x) => x.status === 200) && ghi.every((g) => bang(g, [39375, 31000, 70375])), `${hai.map(moTa)} · ${JSON.stringify(ghi)}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] GET /kh/toi — hạng + số dư ví khả dụng');
  await chay('B', async () => {
    const ca = await khachMoi(300 * 86400), sap = await khachMoi(3 * 86400), het = await khachMoi(-60), chua = await khachMoi();
    const toi = (x) => goi('GET', '/kh/toi', undefined, x.tk);
    const a = await toi(ca), hh = a.j.khach?.hang;
    k('B1 hạng active → hang { id, ten, phan_tram 12.5, phan_tram_nhom_dac_biet 7, het_han } đúng 5 trường', !!hh && bang(Object.keys(hh).sort(),
      ['het_han', 'id', 'phan_tram', 'phan_tram_nhom_dac_biet', 'ten']) && hh.id === hangThu && hh.ten === 'Thử' && hh.phan_tram === 12.5
      && hh.phan_tram_nhom_dac_biet === 7, `${moTa(a)} · ${JSON.stringify(hh)}`);
    const hetHan = (await db.queryOne('SELECT expires_at FROM pos_membership_purchases WHERE customer_phone = ?', [ca.sdt])).expires_at;
    k('B1 het_han = expires_at của lần mua, dạng YYYY-MM-DDTHH:mm:ss', !!hh && hh.het_han === String(hetHan).replace(' ', 'T') && GIO.test(hh.het_han), hh && hh.het_han);
    const b2 = await toi(sap), b3 = await toi(het), b4 = await toi(chua);
    k('B2 hạng sắp hết (3 ngày) → vẫn có hang', b2.j.khach?.hang?.id === hangThu, JSON.stringify(b2.j.khach?.hang));
    k('B3 hạng đã hết hạn → hang: null', b3.status === 200 && b3.j.khach && b3.j.khach.hang === null, JSON.stringify(b3.j.khach?.hang));
    k('B4 chưa mua hạng → hang: null', b4.status === 200 && b4.j.khach && b4.j.khach.hang === null, JSON.stringify(b4.j.khach?.hang));
    await db.run('INSERT INTO pos_wallets (phone, balance) VALUES (?, 100000)', [ca.sdt]);
    await db.run('INSERT INTO pos_wallets (phone, balance) VALUES (?, 5000)', [chua.sdt]);
    const phien = async (sdt, giu, hanGiay) => db.run(`INSERT INTO pos_phien_thanh_toan (than, tong, phone, giu_vi, con_lai, cach, trang_thai, het_han,
      nguoi_tao, tao_luc) VALUES ('{}', ?, ?, ?, 0, 'vi', 'cho', ?, 'thu', ?)`, [giu, sdt, giu, await luc(hanGiay), getNow()]);
    await phien(ca.sdt, 30000, 600);
    await phien(ca.sdt, 20000, -60);   // phiên đã hết hạn → tự nhả, không trừ
    const b5 = await toi(ca);
    k('B5 so_du_vi = 100.000 − 30.000 đang giữ (phiên hết hạn không trừ) = 70.000, số nguyên', b5.j.khach?.so_du_vi === 70000, String(b5.j.khach?.so_du_vi));
    k('B5 không có ví → so_du_vi 0', (await toi(sap)).j.khach?.so_du_vi === 0);
    const b6 = await toi(chua);
    k('B6 khách A (không hạng) → hang null, so_du_vi 5.000 của A (không lộ số của khách khác)', b6.j.khach?.hang === null && b6.j.khach?.so_du_vi === 5000,
      JSON.stringify(b6.j.khach));
    k('B7 trường cũ sdt, ten, ngay_tao, qr giữ nguyên', b6.j.khach?.sdt === chua.sdt && b6.j.khach?.ten === 'Khách ' + (soSdt) && 'ngay_tao' in (b6.j.khach || {})
      && String(b6.j.khach?.qr || '').length > 0, JSON.stringify(b6.j.khach));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] GET /kh/hang — không cần token');
  await chay('C', async () => {
    const r = await goi('GET', '/kh/hang');
    const ds = r.j.data || [];
    const mong = await db.query('SELECT id FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order, card_price');
    k('C1 không token → 200, đúng các hạng đang bật theo thứ tự sort_order, không có hạng tắt', r.status === 200 && bang(ds.map((x) => x.id), mong.map((x) => x.id))
      && !ds.some((x) => x.id === hangTat), `${moTa(r)} · ${ds.map((x) => x.id)}`);
    const t = ds.find((x) => x.id === hangThu);
    k('C1 mỗi hạng ĐÚNG 6 trường { id, ten, phan_tram, phan_tram_nhom_dac_biet, gia_the, thu_tu }', ds.length > 0 && ds.every((x) => bang(Object.keys(x).sort(),
      ['gia_the', 'id', 'phan_tram', 'phan_tram_nhom_dac_biet', 'ten', 'thu_tu'])) && !!t && t.phan_tram === 12.5 && t.phan_tram_nhom_dac_biet === 7
      && t.gia_the === 100000 && t.thu_tu === 50, JSON.stringify(t));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] GET /kh/gio-vang — không cần token, đọc readFlashState');
  await chay('D', async () => {
    const hhmm = async (giay) => (await luc(giay)).slice(11, 16);
    const flash = async (bat, tu, den, pt) => { for (const [a, b] of [['flash_enabled', bat], ['flash_start', tu], ['flash_end', den], ['flash_percent', pt],
      ['flash_product_keys', JSON.stringify([maMon(0)])]]) await datCaiDat(a, b); };
    await flash('true', await hhmm(-3600), await hhmm(3600), 20);
    const d1 = await goi('GET', '/kh/gio-vang'), x = d1.j, now = getNow();
    k('D1 đang trong khung → dang_chay true, phan_tram 20, mon = [mã món]', d1.status === 200 && x.dang_chay === true && x.phan_tram === 20 && bang(x.mon, [maMon(0)]),
      `${moTa(d1)} · ${d1.tho.slice(0, 160)}`);
    k('D1 bat_dau ≤ bây giờ < ket_thuc, giờ đầy đủ YYYY-MM-DDTHH:mm:ss', GIO.test(x.bat_dau) && GIO.test(x.ket_thuc) && x.bat_dau <= now && now < x.ket_thuc,
      `${x.bat_dau} · ${now} · ${x.ket_thuc}`);
    await flash('true', await hhmm(7200), await hhmm(10800), 20);
    const d2 = (await goi('GET', '/kh/gio-vang')).j;
    k('D2 bật nhưng ngoài khung → dang_chay false (vẫn có giờ khung)', d2.dang_chay === false && GIO.test(d2.bat_dau), JSON.stringify(d2));
    await flash('false', await hhmm(-3600), await hhmm(3600), 20);
    const d3 = (await goi('GET', '/kh/gio-vang')).j;
    k('D3 tắt → dang_chay false, mon []', d3.dang_chay === false && bang(d3.mon, []), JSON.stringify(d3));
    await flash('true', await hhmm(-3600), await hhmm(3600), 0);
    const d4 = (await goi('GET', '/kh/gio-vang')).j;
    k('D4 % = 0 → dang_chay false (cùng điều kiện quầy)', d4.dang_chay === false, JSON.stringify(d4));
    await flash('true', await hhmm(-3600), await hhmm(3600), 20);
    await datCaiDat('flash_product_keys', '[]');
    const d6 = (await goi('GET', '/kh/gio-vang')).j;
    k('D6 bật, có %, KHÔNG có món → như tắt: dang_chay false, phan_tram 0, mon [], bat_dau null (một vị từ)', d6.dang_chay === false && d6.phan_tram === 0
      && bang(d6.mon, []) && d6.bat_dau === null, JSON.stringify(d6));
    k('D7 khung qua nửa đêm, giờ CỐ ĐỊNH: 00:30 → bắt đầu hôm qua 22:00 · 23:00 → hôm nay · khung 14–16 lúc 10:00 → hôm nay', !!HD?.khungHangNgay
      && bang(HD.khungHangNgay('2026-11-02T00:30:00', '22:00', '02:00'), { mo: '2026-11-01T22:00:00', dong: '2026-11-02T02:00:00' })
      && bang(HD.khungHangNgay('2026-11-02T23:00:00', '22:00', '02:00'), { mo: '2026-11-02T22:00:00', dong: '2026-11-03T02:00:00' })
      && bang(HD.khungHangNgay('2026-11-02T10:00:00', '14:00', '16:00'), { mo: '2026-11-02T14:00:00', dong: '2026-11-02T16:00:00' }));
    k('D7 /gio-vang dựng khung bằng khungHangNgay(bayGio, …) — không công thức riêng',
      /khungHangNgay\(bayGio, f\.start, f\.end\)/.test(fs.readFileSync(path.join(GOC, 'server', 'routes', 'kh', 'index.js'), 'utf8')));
    await datCaiDat('flash_enabled', 'false');
    k('D5 không có trường "suất" (POS không đếm suất)', d1.status === 200 && !/suat/.test(d1.tho), d1.tho.slice(0, 120));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] GET /kh/menu — gia_hang từng món');
  await chay('E', async () => {
    const kh = await khachMoi();
    const m = await goi('GET', '/kh/menu', undefined, kh.tk);
    const ds = m.j.data || [];
    const hang = await db.query('SELECT * FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order, card_price');
    const sai = GH ? ds.filter((p) => {
      const dbs = sp.findIndex((s, i) => maMon(i) === p.ma) === 1;
      return !bang(p.gia_hang, hang.map((h) => ({ hang_id: h.id, gia: GH.giaHangMon(p.gia, GH.tiLeHangMon(h, dbs)) })));
    }) : ds;
    k('E1 mỗi món có gia_hang đủ hạng đang bật, giá = giaHangMon(gia, tiLeHangMon(hạng, nhóm))', m.status === 200 && ds.length >= 2 && sai.length === 0,
      `${moTa(m)} · ${sai.slice(0, 2).map((p) => p.ma + ' ' + JSON.stringify(p.gia_hang)).join(' | ')}`);
    const md = ds.find((p) => p.ma === maMon(1));
    k('E2 món nhóm đặc biệt dùng % riêng (hạng thử 7 % → 31.000, không phải 12,5 % → 29.166)',
      md?.gia_hang?.find((g) => g.hang_id === hangThu)?.gia === 31000, JSON.stringify(md?.gia_hang));
    k('E3 trường cũ y nguyên (ma, ten, nhom, gia, con_hang, ton_cu, ton_luc)', ds.length > 0 && ds.every((p) => ['ma', 'ten', 'nhom', 'gia', 'con_hang', 'ton_cu', 'ton_luc']
      .every((kk) => kk in p)) && bang(Object.keys(ds[0]).sort(), ['con_hang', 'gia', 'gia_hang', 'ma', 'nhom', 'ten', 'ton_cu', 'ton_luc']), Object.keys(ds[0] || {}).join(','));
    k('E4 hạng 0 % → gia = giá gốc', ds.length > 0 && ds.every((p) => p.gia_hang?.find((g) => g.hang_id === hang0)?.gia === p.gia));
    k('E5 giaCacHang giá null / 0 → []', !!GH && bang(GH.giaCacHang(null, false, hang), []) && bang(GH.giaCacHang(0, true, hang), []));
    // E6 — hạng đã tắt (xoá mềm) mà khách còn thẻ: quầy vẫn giảm (orders.js đọc % không lọc is_active) → /menu của khách đó cũng phải có giá.
    const kt = await khachMoi();
    await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
      VALUES (?, ?, 'Đã tắt', 1, NULL, ?, ?)`, [kt.sdt, hangTat, (await luc(-86400)).replace('T', ' '), (await luc(86400)).replace('T', ' ')]);
    const g6 = (((await goi('GET', '/kh/menu', undefined, kt.tk)).j.data || []).find((p) => p.ma === maMon(0))?.gia_hang || []);
    const q6 = await tinhThu(kt.sdt, [mon(0)]);
    k('E6 hạng ĐÃ TẮT, khách còn thẻ → /menu của khách đó có giá hạng đó = tier_unit_price quầy (31.500); khách khác không thấy hạng tắt',
      g6.find((g) => g.hang_id === hangTat)?.gia === 31500 && q6.j.items?.[0]?.tier_unit_price === 31500
      && !(ds.find((p) => p.ma === maMon(0))?.gia_hang || []).some((g) => g.hang_id === hangTat), `${JSON.stringify(g6)} · quầy ${q6.j.items?.[0]?.tier_unit_price}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] giờ hoạt động — dangMo thuần (server/utils/gioHoatDong.js) + GET /kh/gio-hoat-dong + PUT /settings');
  const LICH = { 2: { mo: '07:00', dong: '22:00' }, 3: { mo: '07:00', dong: '22:00' }, 4: { mo: '07:00', dong: '22:00' }, 5: { mo: '07:00', dong: '22:00' },
    6: { mo: '07:00', dong: '22:00' }, 7: { mo: '18:00', dong: '02:00' }, 8: { nghi: true } };
  await chay('F1-F9', async () => {
    k('F · nạp được server/utils/gioHoatDong.js', !!HD);
    if (!HD) return;
    const cd = (them = {}) => HD.docCaiDat({ gio_hd_lich: JSON.stringify(LICH), gio_hd_thong_bao: 'Mở lại lúc {gio_mo_lai}', ...them });
    const ca = (ten, bayGio, c, mong) => {
      const r = HD.dangMo(bayGio, c);
      const lech = Object.keys(mong).filter((kk) => !bang(r[kk], mong[kk]));
      k(`${ten} (${bayGio})`, lech.length === 0, lech.map((kk) => `${kk}=${JSON.stringify(r[kk])}`).join(' · '));
    };
    const hom2 = { mo: '2026-11-02T07:00:00', dong: '2026-11-02T22:00:00' };
    ca('F1 Thứ Hai trong giờ → mở', '2026-11-02T10:00:00', cd(), { dang_mo: true, nhan_don: true, hom_nay: hom2, mo_lai_luc: null, thong_bao: '' });
    ca('F1 trước giờ mở 1 giây → đóng, mở lại 07:00 cùng ngày', '2026-11-02T06:59:59', cd(), { dang_mo: false, nhan_don: false, hom_nay: hom2,
      mo_lai_luc: '2026-11-02T07:00:00' });
    ca('F1 đúng giờ đóng → đóng, mở lại 07:00 hôm sau', '2026-11-02T22:00:00', cd(), { dang_mo: false, mo_lai_luc: '2026-11-03T07:00:00' });
    const dem = { mo: '2026-11-07T18:00:00', dong: '2026-11-08T02:00:00' };
    ca('F2 Thứ Bảy 18:00–02:00, 23:00 → mở', '2026-11-07T23:00:00', cd(), { dang_mo: true, hom_nay: dem });
    ca('F2 01:00 Chủ nhật vẫn mở theo lịch Thứ Bảy', '2026-11-08T01:00:00', cd(), { dang_mo: true, nhan_don: true, hom_nay: dem, mo_lai_luc: null });
    ca('F2 03:00 Chủ nhật → đóng, mở lại Thứ Hai 07:00', '2026-11-08T03:00:00', cd(), { dang_mo: false, hom_nay: null, mo_lai_luc: '2026-11-09T07:00:00' });
    const nghi = cd({ gio_hd_ngay_nghi: JSON.stringify([{ ngay: '2026-11-03', ly_do: 'Giỗ' }, { ngay: '2026-11-04', ly_do: 'Giỗ' }]) });
    ca('F3 ngày nghỉ đặc biệt 2 ngày liền → đóng, mở lại ngày mở kế tiếp', '2026-11-03T10:00:00', nghi, { dang_mo: false, hom_nay: null,
      mo_lai_luc: '2026-11-05T07:00:00', thong_bao: 'Mở lại lúc 07:00 05/11' });
    ca('F3 tối trước ngày nghỉ → đóng, mở lại sau ngày nghỉ', '2026-11-02T23:00:00', nghi, { dang_mo: false, mo_lai_luc: '2026-11-05T07:00:00' });
    ca('F4 Chủ nhật nghỉ cả ngày theo thứ', '2026-11-08T12:00:00', cd(), { dang_mo: false, hom_nay: null, mo_lai_luc: '2026-11-09T07:00:00' });
    const n30 = cd({ gio_hd_ngung_truoc_phut: '30' });
    ca('F5 ngừng trước 30 phút: đúng 21:30 → còn mở, KHÔNG nhận đơn', '2026-11-02T21:30:00', n30, { dang_mo: true, nhan_don: false, hom_nay: hom2 });
    ca('F5 21:29 (ngay dưới ngưỡng) → nhận đơn', '2026-11-02T21:29:00', n30, { dang_mo: true, nhan_don: true });
    ca('F5 qua nửa đêm: 01:30 Chủ nhật (đóng 02:00) → không nhận đơn', '2026-11-08T01:30:00', n30, { dang_mo: true, nhan_don: false });
    ca('F5 không cài N (mặc định 0): 21:59:59 → nhận đơn', '2026-11-02T21:59:59', cd(), { dang_mo: true, nhan_don: true });
    ca('F6 chưa cài gì → mở cả ngày, thong_bao rỗng', '2026-11-08T03:00:00', HD.docCaiDat({}), { dang_mo: true, nhan_don: true, hom_nay: null,
      mo_lai_luc: null, thong_bao: '' });
    ca('F6 chưa cài lịch, có ngày nghỉ → đóng, mở lại 00:00 hôm sau', '2026-11-03T10:00:00',
      HD.docCaiDat({ gio_hd_ngay_nghi: JSON.stringify([{ ngay: '2026-11-03', ly_do: 'x' }]) }), { dang_mo: false, mo_lai_luc: '2026-11-04T00:00:00' });
    ca('F6 dữ liệu lịch hỏng (nhập tay) → coi như chưa cài', '2026-11-08T03:00:00', HD.docCaiDat({ gio_hd_lich: '{hỏng' }), { dang_mo: true });
    k('F7 thứ: 01.11.2026 (Chủ nhật) → 8 · 02.11 → 2 · 07.11 → 7', HD.thuCua('2026-11-01') === 8 && HD.thuCua('2026-11-02') === 2 && HD.thuCua('2026-11-07') === 7);
    ca('F9 câu thông báo điền {gio_mo_lai} cùng ngày → chỉ giờ', '2026-11-02T06:00:00', cd(), { thong_bao: 'Mở lại lúc 07:00' });
    const caTuan = Object.fromEntries([2, 3, 4, 5, 6, 7, 8].map((t) => [t, { nghi: true }]));
    ca('F9 nghỉ cả tuần (không có giờ mở lại) → câu KHÔNG cụt', '2026-11-02T10:00:00', cd({ gio_hd_lich: JSON.stringify(caTuan) }),
      { dang_mo: false, mo_lai_luc: null, thong_bao: 'Mở lại lúc (chưa có lịch)' });
    const n30tron = HD.docCaiDat({ gio_hd_ngung_truoc_phut: '30' });
    ca('F12 chưa cài lịch + ngừng trước 30 phút: 23:59 vẫn nhận đơn (mở cả ngày, không có giờ đóng)', '2026-11-02T23:59:00', n30tron, { dang_mo: true, nhan_don: true });
    ca('F12 chưa cài lịch + N 30 + mai nghỉ: 23:30 → không nhận đơn (đóng thật 00:00)', '2026-11-02T23:30:00',
      HD.docCaiDat({ gio_hd_ngung_truoc_phut: '30', gio_hd_ngay_nghi: JSON.stringify([{ ngay: '2026-11-03', ly_do: 'x' }]) }), { dang_mo: true, nhan_don: false });
    const noi = cd({ gio_hd_ngung_truoc_phut: '30', gio_hd_lich: JSON.stringify({ ...LICH, 2: { mo: '07:00', dong: '00:00' }, 3: { mo: '00:00', dong: '22:00' } }) });
    ca('F12 Thứ Hai 07:00–00:00 nối Thứ Ba 00:00–22:00: 23:45 Thứ Hai vẫn nhận đơn', '2026-11-02T23:45:00', noi, { dang_mo: true, nhan_don: true });
    ca('F12 ca nối: 21:30 Thứ Ba (đóng 22:00) → không nhận đơn', '2026-11-03T21:30:00', noi, { dang_mo: true, nhan_don: false });
    ca('F12 ca nối: hom_nay.dong = giờ đóng của cả chuỗi (cùng hàm với nhan_don)', '2026-11-02T23:50:00', noi,
      { hom_nay: { mo: '2026-11-02T07:00:00', dong: '2026-11-03T22:00:00' } });
    const chong = cd({ gio_hd_ngung_truoc_phut: '30', gio_hd_lich: JSON.stringify({ ...LICH, 2: { mo: '18:00', dong: '02:00' }, 3: { mo: '01:00', dong: '10:00' } }) });
    ca('F13 ca CHỒNG nhau (Thứ Hai 18:00–02:00, Thứ Ba 01:00–10:00), N 30: 01:40 vẫn nhận đơn', '2026-11-03T01:40:00', chong, { dang_mo: true, nhan_don: true });
    ca('F13 ca chồng: 09:30 Thứ Ba (đóng 10:00) → không nhận đơn; hom_nay.dong = 10:00', '2026-11-03T09:30:00', chong, { dang_mo: true, nhan_don: false,
      hom_nay: { mo: '2026-11-03T01:00:00', dong: '2026-11-03T10:00:00' } });
  });

  await chay('F8, F10, F11', async () => {
    const r = await goi('GET', '/kh/gio-hoat-dong');
    const vn = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 19);
    const x = r.j;
    k('F8 không token → 200; bay_gio = giờ VN tính độc lập (lệch ≤ 5 giây) dù máy chạy TZ=UTC', r.status === 200 && GIO.test(x.bay_gio)
      && Math.abs(Date.parse(x.bay_gio + 'Z') - Date.parse(vn + 'Z')) <= 5000, `${moTa(r)} · ${x.bay_gio} · ${vn}`);
    k('F8 đủ trường bay_gio, dang_mo, nhan_don, hom_nay, mo_lai_luc, thong_bao, lich_tuan, ngay_nghi', ['bay_gio', 'dang_mo', 'nhan_don', 'hom_nay', 'mo_lai_luc',
      'thong_bao', 'lich_tuan', 'ngay_nghi'].every((kk) => kk in x), Object.keys(x).join(','));
    k('F6 kho mới (seed) → mở cả ngày, thong_bao rỗng, lich_tuan thứ 2…8', x.dang_mo === true && x.thong_bao === '' && bang((x.lich_tuan || []).map((d) => d.thu), [2, 3, 4, 5, 6, 7, 8]),
      JSON.stringify(x).slice(0, 200));
    const put = (settings) => goi('PUT', '/pos/settings', { settings }, tkChu);
    const truoc = await db.queryOne("SELECT value FROM pos_settings WHERE key = 'gio_hd_thong_bao'");
    for (const [ten, bad] of [['giờ 25:00', { gio_hd_lich: JSON.stringify({ ...LICH, 2: { mo: '25:00', dong: '22:00' } }) }], ['JSON hỏng', { gio_hd_lich: '{hỏng' }],
      ['thiếu một thứ', { gio_hd_lich: JSON.stringify({ ...LICH, 8: undefined }) }], ['N âm', { gio_hd_ngung_truoc_phut: '-5' }],
      ['ngày sai 30/02', { gio_hd_ngay_nghi: JSON.stringify([{ ngay: '2026-02-30', ly_do: 'x' }]) }], ['khoá lạ', { gio_hd_la: '1' }]]) {
      const p = await put({ gio_hd_thong_bao: 'KHÔNG ĐƯỢC GHI', ...bad });
      const sau = await db.queryOne("SELECT value FROM pos_settings WHERE key = 'gio_hd_thong_bao'");
      k(`F10 PUT ${ten} → 400 CAI_DAT_KHONG_HOP_LE, không khoá nào được ghi`, p.status === 400 && p.j.code === 'CAI_DAT_KHONG_HOP_LE' && bang(sau, truoc), `${moTa(p)} · ${JSON.stringify(sau)}`);
    }
    const ok = await put({ gio_hd_lich: JSON.stringify({ ...LICH, 8: { nghi: true } }), gio_hd_ngay_nghi: JSON.stringify([{ ngay: '2030-01-01', ly_do: 'Tết' }]),
      gio_hd_thong_bao: 'Nghỉ — mở lại {gio_mo_lai}', gio_hd_ngung_truoc_phut: '15' });
    const y = (await goi('GET', '/kh/gio-hoat-dong')).j;
    k('F10 PUT đúng → 200; cửa đọc ra lịch tuần + ngày nghỉ vừa lưu', ok.status === 200 && bang(y.lich_tuan?.[0], { thu: 2, mo: '07:00', dong: '22:00', nghi: false })
      && bang(y.lich_tuan?.[6], { thu: 8, mo: null, dong: null, nghi: true }) && bang(y.ngay_nghi, [{ ngay: '2030-01-01', ly_do: 'Tết' }]), `${moTa(ok)} · ${JSON.stringify(y).slice(0, 240)}`);
    const giu = ['bay_gio', 'hom_nay', 'mo_lai_luc'].map((kk) => y[kk]).concat(y.hom_nay ? [y.hom_nay.mo, y.hom_nay.dong] : []).filter((v) => typeof v === 'string');
    k('F8 mọi giờ trả ra khớp YYYY-MM-DDTHH:mm:ss', giu.length >= 1 && giu.every((v) => GIO.test(v)), giu.join(' · '));
    const k5 = await put({ uudai_chung_hang_percent: '1', invoice_policy: 'all' });
    k('F11 khoá khác (uudai_chung_hang_percent, invoice_policy) vẫn lưu được → 200', k5.status === 200, moTa(k5));
    k('F10 xoá lịch bằng chuỗi rỗng → 200 (về "chưa cài")', (await put({ gio_hd_lich: '' })).status === 200);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] hạn mã ưu đãi khách mới theo cài đặt (Q1 a) + lỗi máy qua /api/kh');
  const donMa = async () => {
    const r = await goi('POST', '/pos/orders', { items: [mon(0)], payment_method: 'cash', cash_amount: 45000 }, tkChu);
    return r.j.order?.signup_code;
  };
  const luiMa = async (ma, gio) => db.run('UPDATE pos_signup_codes SET issued_at = ? WHERE code = ?', [await luc(-gio * 3600), ma]);
  await chay('G2', async () => {
    await datCaiDat('nhandiem_han_gio', '48');
    const ma30 = await donMa(), ma49 = await donMa(), maQuay = await donMa(), maDuoi = await donMa(), maTren = await donMa();
    await luiMa(ma30, 30); await luiMa(ma49, 49); await luiMa(maQuay, 30); await luiMa(maDuoi, 48 - 1 / 60); await luiMa(maTren, 48 + 1 / 60);
    const rDuoi = await goi('POST', '/kh/nhan-ma-bill', { ma: maDuoi }, (await khachMoi()).tk);
    const rTren = await goi('POST', '/kh/nhan-ma-bill', { ma: maTren }, (await khachMoi()).tk);
    k('G2 ngưỡng: 47 giờ 59 phút → 200 · 48 giờ 1 phút → 400 MA_HET_HAN', rDuoi.status === 200 && rTren.status === 400 && rTren.j.code === 'MA_HET_HAN',
      `${moTa(rDuoi)} · ${moTa(rTren)}`);
    const a = await khachMoi(), b = await khachMoi();
    const r30 = await goi('POST', '/kh/nhan-ma-bill', { ma: ma30 }, a.tk);
    const r49 = await goi('POST', '/kh/nhan-ma-bill', { ma: ma49 }, b.tk);
    k('G2 cài hạn 48 giờ: mã in 30 giờ trước → App nhận được (200)', !!ma30 && r30.status === 200, `${moTa(r30)} · ${r30.j.error || ''}`);
    k('G2 mã in 49 giờ trước → 400 MA_HET_HAN, lời ghi "48 giờ"', r49.status === 400 && r49.j.code === 'MA_HET_HAN' && /48 giờ/.test(r49.j.error || '')
      && !/24 giờ/.test(r49.j.error || ''), `${moTa(r49)} · ${r49.j.error}`);
    const q = await goi('POST', '/pos/signup-codes/claim', { code: maQuay, phone: (await khachMoi()).sdt }, tkChu);
    k('G2 đường quầy /claim cùng hạn theo cài đặt (mã 30 giờ → 200)', q.status === 200, `${moTa(q)} · ${q.j.error || ''}`);
    await datCaiDat('nhandiem_han_gio', '24');
  });

  muc('[J] K5 — luồng hợp lệ chạy như cũ');
  await chay('J', async () => {
    const kh = await khachMoi(300 * 86400), tron = await khachMoi();
    const r2 = await ban(tron.sdt, [mon(0)], 45000);
    k('J2 khách không hạng → giá gốc, không tier_unit_price', r2.status === 200 && (await giaDong(r2.j.order.id, 0)) === 0, moTa(r2));
    const hm = async (g) => (await luc(g)).slice(11, 16);
    for (const [a, b] of [['flash_enabled', 'true'], ['flash_start', await hm(-3600)], ['flash_end', await hm(3600)], ['flash_percent', '20'],
      ['flash_product_keys', JSON.stringify([maMon(0)])]]) await datCaiDat(a, b);
    const r3 = await ban(kh.sdt, [mon(0)], 36000);
    const d3 = r3.j.order ? await db.queryOne('SELECT tier_discount, total FROM pos_orders WHERE id = ?', [r3.j.order.id]) : null;
    k('J3 đơn dính giờ vàng → KHÔNG giảm hạng (như cũ): tổng 36.000, tier_discount 0', r3.status === 200 && Number(d3.tier_discount || 0) === 0 && Number(d3.total) === 36000,
      `${moTa(r3)} · ${JSON.stringify(d3)}`);
    await datCaiDat('flash_enabled', 'false');
    const tuan = Object.fromEntries([2, 3, 4, 5, 6, 7, 8].map((t) => [t, { nghi: true }]));
    await goi('PUT', '/pos/settings', { settings: { gio_hd_lich: JSON.stringify(tuan) } }, tkChu);
    const gh = (await goi('GET', '/kh/gio-hoat-dong')).j;
    const r5 = await ban(tron.sdt, [mon(0)], 45000);
    k('J5 quầy bán lúc quán "nghỉ cả tuần" theo giờ hoạt động → 200 (quầy KHÔNG bị chặn)', gh.dang_mo === false && r5.status === 200, `${gh.dang_mo} · ${moTa(r5)}`);
    k('J5 câu báo khi không có giờ mở lại KHÔNG cụt đuôi', !!gh.thong_bao && !/\s$/.test(gh.thong_bao) && /chưa có lịch/.test(gh.thong_bao), JSON.stringify(gh.thong_bao));
    await datCaiDat('gio_hd_lich', '');
    const ma = await donMa();
    const r6 = await goi('POST', '/pos/signup-codes/nhan-diem', { code: ma, phone: (await khachMoi()).sdt }, tkChu);
    k('J6 nhận điểm ở quầy /api/pos/signup-codes/nhan-diem → 200', r6.status === 200, `${moTa(r6)} · ${r6.j.error || ''}`);
  });

  // G1 / G3 chạy CUỐI: đổi tên bảng pos_signup_codes trong kho tạm để dựng lỗi máy.
  await chay('G1-G3', async () => {
    const a = await khachMoi();
    await db.run('ALTER TABLE pos_signup_codes RENAME TO pos_signup_codes_tam');
    const r1 = await goi('POST', '/kh/nhan-ma-bill', { ma: 'ABC123' }, a.tk);
    const r2 = await goi('POST', '/kh/nhan-diem', { ma: 'ABC123' }, a.tk);
    const q = await goi('POST', '/pos/signup-codes/claim', { code: 'ABC123', phone: a.sdt }, tkChu);
    await db.run('ALTER TABLE pos_signup_codes_tam RENAME TO pos_signup_codes');
    for (const [ten, r] of [['nhan-ma-bill', r1], ['nhan-diem', r2]]) {
      k(`G1 /kh/${ten} lỗi máy → 500 LOI_MAY_CHU, lời không chứa lời máy (khoá hồi quy)`, r.status === 500 && r.j.code === 'LOI_MAY_CHU' && !/no such table/i.test(r.tho), r.tho.slice(0, 120));
    }
    k('G3 đường quầy /api/pos/signup-codes/claim lỗi máy → 500 lời cũ ({ success: false, error })', q.status === 500 && q.j.success === false && /no such table/i.test(q.j.error || ''),
      q.tho.slice(0, 120));
  });

  sv.close();
  console.log(`\n  ${C.dam}${dat} đạt · ${hong} hỏng${C.het}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai(true);
  console.error(`\n${C.do}✖ Bài thử sập: ${e.message}${C.het}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
