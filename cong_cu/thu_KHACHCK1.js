#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KHACH-CK-1 — bỏ chiết khấu riêng từng khách (ưu đãi chỉ qua hạng, mã giảm, Giờ vàng)
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_KHACHCK1.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến, viec/KHACH-CK-1/dot_bien.py). Mã giao diện đọc từ <may-chu>/../client/src.
 *
 *  Khuôn thu_UUDAI1.js: database.js thật + libsql thật trên kho TẠM, SX giả. Hồ sơ khách có mức cũ (dữ liệu chưa nâng cấp) dựng
 *  bằng INSERT thẳng SAU khởi động (bước 004 đã chạy lúc khởi động trên bảng chưa có ai). Ca đơn gửi ĐÚNG giá niêm yết → gốc tự
 *  giảm theo hồ sơ thì 400 "không khớp" (đỏ).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const CLIENT = path.join(MAY_CHU, '..', 'client', 'src');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khachck1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const BUOC_004 = path.join(MAY_CHU, 'nang_cap', '004_bo_chiet_khau_rieng.js');
const BANG_SAO_LUU = '_sao_luu_004_pos_customers';

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
process.env.JWT_SECRET = 'thu_khachck1_' + Date.now();

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const docNguon = (...p) => { try { return fs.readFileSync(path.join(...p), 'utf8'); } catch { return ''; } };

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();

  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const sxGia = async () => ({ ok: true });
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true,
    checkStock: async () => ({ sufficient: true, stock: 999 }), outStockFIFO: sxGia, inStockReturn: sxGia, callSxApi: sxGia };

  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(path.join(MAY_CHU, 'routes', 'orders.js')));
  app.use('/api/pos/customers', require(path.join(MAY_CHU, 'routes', 'customers.js')));
  app.use('/api/pos/v2/customers', require(path.join(MAY_CHU, 'routes', 'customers-v2.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();

  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const coBang = async (ten) => !!(await mot("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", [ten]));
  const coBangSaoLuuLucDau = await coBang(BANG_SAO_LUU);

  const chu = await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const the = jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const goi = async (method, url, body) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + the } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;
  const datCaiDat = (key, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
  for (const [key, v] of [['flash_enabled', 'false'], ['thanh_toan_payos_bat_buoc', '0']]) await datCaiDat(key, v);

  // Món: 0 = 50.000 · 1 = 30.000. Hạng Vàng 10 %.
  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 2');
  for (const [i, g] of [50000, 30000].entries()) await db.run('UPDATE pos_products SET price = ?, is_special_group = 0 WHERE id = ?', [g, sp[i].id]);
  const mon = (i, sl = 1) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type, sx_product_id: sp[i].sx_product_id, quantity: sl });
  const hangId = Number((await db.run("INSERT INTO pos_membership_tiers (name, card_price, discount_percent, special_discount_percent, sort_order, is_active) VALUES ('Vàng', 100000, 10, 20, 99, 1)")).lastInsertRowid);

  let soSdt = 0;
  const sdtMoi = () => '0939' + String(500000 + (++soSdt));
  // Hồ sơ dữ liệu cũ: mức chiết khấu riêng ghi thẳng vào CSDL (như production trước 004).
  const khachCK = async (loai, muc, s = sdtMoi()) => {
    await db.run('INSERT INTO pos_customers (phone, name, discount_type, discount_value, discount_note) VALUES (?, ?, ?, ?, ?)', [s, 'Khách CK1', loai, muc, null]);
    return s;
  };
  const vang = async (s) => db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
      VALUES (?, ?, 'Vàng', 100000, NULL, datetime('now', '+7 hours', '-30 days'), datetime('now', '+7 hours', '+300 days'))`, [s, hangId]);
  let soMa = 0;
  const taoMa = async (loai, giaTri) => {
    const ma = 'CK1_' + (++soMa);
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active,
      discount_scope) VALUES (?, ?, ?, 0, 0, 0, 0, 1, 'order')`, [ma, loai, giaTri]);
    return ma;
  };
  const ban = (body, tien) => goi('POST', '/orders', { customer_name: 'Khách CK1', payment_method: 'cash', cash_amount: tien, ...body });
  const tongDon = async (r) => (r.order ? Number((await mot('SELECT total FROM pos_orders WHERE id = ?', [r.order.id])).total) : NaN);
  const caDon = async (ten, r, T) => { const t = await tongDon(r); k(ten, r.status === 200 && t === T, `${moTa(r)} · tổng ${t}`); };
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };
  const trongFlash = async (f) => {
    const gio = Number(new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(11, 13));
    for (const [key, v] of [['flash_enabled', 'true'], ['flash_start', `${String(gio).padStart(2, '0')}:00`],
      ['flash_end', `${String((gio + 2) % 24).padStart(2, '0')}:00`], ['flash_percent', 20],
      ['flash_product_keys', JSON.stringify([`${sp[0].sx_product_type}_${sp[0].sx_product_id}`])]]) await datCaiDat(key, v);
    try { return await f(); } finally { await datCaiDat('flash_enabled', 'false'); }
  };

  console.log('\nTHỬ KHACH-CK-1 — bỏ chiết khấu riêng từng khách');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] máy chủ không áp chiết khấu hồ sơ; hạng / mã / Giờ vàng như cũ');
  await chay('A', async () => {
    const s1 = await khachCK('percent', 10);
    await caDon('A1 hồ sơ percent 10, không mã, 2 × 50.000 → tổng 100.000 (không 90.000)', await ban({ customer_phone: s1, items: [mon(0, 2)] }, 100000), 100000);
    const s2 = await khachCK('fixed', 5000);
    await caDon('A2 hồ sơ fixed 5.000, không mã, 50.000 → tổng 50.000 (không 45.000)', await ban({ customer_phone: s2, items: [mon(0, 1)] }, 50000), 50000);
    const t3 = await goi('POST', '/orders/tinh-thu', { customer_phone: s1, customer_name: 'Khách CK1', items: [mon(0, 2)] });
    k('A3 tinh-thu cùng giỏ A1 → total 100.000 (cùng số POST /orders ghi)', t3.status === 200 && Number(t3.total) === 100000, `${moTa(t3)} · total ${t3.total}`);
    const s5 = await khachCK('percent', 10); await vang(s5);
    await caDon('A5 đối chứng hạng: Vàng 10 % + hồ sơ 10 %, 2 × 50.000 → chỉ giảm hạng: 90.000', await ban({ customer_phone: s5, items: [mon(0, 2)] }, 90000), 90000);
    const s6 = await khachCK('percent', 10);
    const m6 = await taoMa('fixed', 5000);
    await caDon('A6 đối chứng mã: hồ sơ 10 % + mã tiền 5.000, 2 × 50.000 → 95.000 (mã như cũ)', await ban({ customer_phone: s6, items: [mon(0, 2)], discount_code: m6 }, 95000), 95000);
    const s7 = await khachCK('percent', 10);
    const r7 = await trongFlash(() => ban({ customer_phone: s7, items: [mon(0, 1)] }, 40000));
    await caDon('A7 Giờ vàng 20 %: khách hồ sơ 10 % mua 50.000 → giá Flash 40.000, KHÔNG 400 "chỉ dùng voucher TIỀN"', r7, 40000);
    const s8 = sdtMoi();
    await caDon('A8 đối chứng: khách không hồ sơ, 30.000 → 30.000', await ban({ customer_phone: s8, items: [mon(1, 1)] }, 30000), 30000);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] không cửa nào ghi được mức > 0');
  await chay('B', async () => {
    const MA = 'CHIET_KHAU_RIENG_DA_BO';
    const mucHoSo = async (s) => mot('SELECT discount_type, discount_value, discount_note FROM pos_customers WHERE phone = ?', [s]);
    const s1 = await khachCK('percent', 0);
    const b1 = await goi('PUT', `/v2/customers/${s1}/discount`, { discount_type: 'percent', discount_value: 5, discount_note: 'x' });
    const h1 = await mucHoSo(s1);
    k('B1 PUT v2 percent 5 → 400 CHIET_KHAU_RIENG_DA_BO, hồ sơ vẫn 0 / không ghi ghi chú', b1.status === 400 && b1.code === MA && Number(h1.discount_value) === 0
      && h1.discount_note === null, `${moTa(b1)} · ${JSON.stringify(h1)}`);
    const b2 = await goi('PUT', `/v2/customers/${s1}/discount`, { discount_type: 'fixed', discount_value: '5000' });
    k('B2 PUT v2 fixed "5000" (chuỗi) → 400 cùng mã', b2.status === 400 && b2.code === MA && Number((await mucHoSo(s1)).discount_value) === 0, moTa(b2));
    const kh3 = await mot('SELECT id FROM pos_customers WHERE phone = ?', [s1]);
    const b3 = await goi('PUT', `/customers/${kh3.id}/discount`, { discount_type: 'percent', discount_value: 5 });
    k('B3 PUT customers/:id/discount percent 5 → 400 cùng mã', b3.status === 400 && b3.code === MA && Number((await mucHoSo(s1)).discount_value) === 0, moTa(b3));
    const s4 = sdtMoi();
    const b4 = await goi('PUT', `/v2/customers/${s4}/discount`, { discount_type: 'percent', discount_value: 5 });
    k('B4 PUT v2 khách chưa có hồ sơ, mức 5 → 400 và KHÔNG tạo dòng', b4.status === 400 && b4.code === MA && !(await mucHoSo(s4)), moTa(b4));
    const b5 = await goi('PUT', `/v2/customers/${s1}/discount`, { discount_note: 'Ít ngọt' });
    const h5 = await mucHoSo(s1);
    const s5 = sdtMoi();
    const b5b = await goi('PUT', `/v2/customers/${s5}/discount`, { discount_note: 'Khách mới' });
    const h5b = await mucHoSo(s5);
    k('B5 (K5) PUT v2 chỉ ghi chú → 200, ghi chú lưu, mức 0; khách chưa có hồ sơ → tạo với mức 0', b5.status === 200 && h5.discount_note === 'Ít ngọt'
      && Number(h5.discount_value) === 0 && b5b.status === 200 && h5b?.discount_note === 'Khách mới' && Number(h5b.discount_value) === 0,
    `${moTa(b5)} ${JSON.stringify(h5)} / ${moTa(b5b)} ${JSON.stringify(h5b)}`);
    const b6 = await goi('PUT', `/customers/${kh3.id}/discount`, { discount_type: 'percent', discount_value: 0, discount_note: 'Ghi chú v1' });
    k('B6 (K5) PUT customers/:id/discount mức 0 → 200, ghi chú lưu', b6.status === 200 && (await mucHoSo(s1)).discount_note === 'Ghi chú v1', moTa(b6));
    const b7 = await goi('PUT', `/customers/${kh3.id}/discount`, { discount_type: 'fixed', discount_value: -5 });
    const h7 = await mucHoSo(s1);
    const b7b = await goi('PUT', `/v2/customers/${s1}/discount`, { discount_type: 'fixed', discount_value: -5 });
    const h7b = await mucHoSo(s1);
    k('B7 mức âm −5, loại fixed ở TỪNG cửa → sau mỗi cửa hồ sơ vẫn 0, loại percent (không ghi số / loại thân gửi)', [h7, h7b].every((h) =>
      Number(h.discount_value) === 0 && h.discount_type === 'percent'), `${moTa(b7)} ${JSON.stringify(h7)} / ${moTa(b7b)} ${JSON.stringify(h7b)}`);
    const s7c = sdtMoi();
    const b7c = await goi('PUT', `/v2/customers/${s7c}/discount`, { discount_type: 'fixed', discount_value: -5, discount_note: 'Mới âm' });
    const h7c = await mucHoSo(s7c);
    k('B7c PUT v2 khách CHƯA có hồ sơ, mức −5 loại fixed → tạo với mức 0, loại percent (nhánh INSERT)', b7c.status === 200
      && Number(h7c?.discount_value) === 0 && h7c?.discount_type === 'percent' && h7c?.discount_note === 'Mới âm', `${moTa(b7c)} ${JSON.stringify(h7c)}`);
    // F2 hai người cùng bấm: một gửi mức 5, một chỉ ghi chú.
    const [c1, c2] = await Promise.all([goi('PUT', `/v2/customers/${s1}/discount`, { discount_type: 'percent', discount_value: 5 }),
      goi('PUT', `/v2/customers/${s1}/discount`, { discount_note: 'Cùng lúc' })]);
    const h8 = await mucHoSo(s1);
    k('B8 hai người cùng bấm (mức 5 + chỉ ghi chú) → 400 + 200, hồ sơ cuối mức 0, ghi chú "Cùng lúc"', c1.status === 400 && c2.status === 200
      && Number(h8.discount_value) === 0 && h8.discount_note === 'Cùng lúc', `${moTa(c1)} / ${moTa(c2)} · ${JSON.stringify(h8)}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] bước nâng cấp 004 — sao lưu rồi đặt về 0');
  await chay('C', async () => {
    let buoc = null;
    try { buoc = require(BUOC_004); } catch { /* gốc chưa có — C đỏ */ }
    k('C0 có server/nang_cap/004_bo_chiet_khau_rieng.js xuất chay()', typeof buoc?.chay === 'function');
    k('C3 khởi động trên bảng chưa có khách mức ≠ 0 → 004 KHÔNG tạo bảng sao lưu', !coBangSaoLuuLucDau);
    const daChay = await mot("SELECT ten FROM pos_nang_cap WHERE so = 4");
    k('C5 bộ chạy đã ghi bước 4 vào pos_nang_cap lúc khởi động', daChay?.ten === '004_bo_chiet_khau_rieng', JSON.stringify(daChay));
    // Thêm dữ liệu cũ đủ kiểu: percent 10, fixed 5000, percent 0.5, mức âm (lọt cửa cũ), và khách 0.
    await khachCK('percent', 10); await khachCK('fixed', 5000); await khachCK('percent', 0.5); await khachCK('fixed', -2000); await khachCK('percent', 0);
    const cu = await db.query('SELECT phone, discount_type, discount_value FROM pos_customers WHERE COALESCE(discount_value, 0) <> 0 ORDER BY phone');
    const tongDong = await so('SELECT COUNT(*) FROM pos_customers');
    const N = cu.length;
    const chayBuoc = async () => {
      const ghi = []; const logCu = console.log; console.log = (...a) => ghi.push(a.join(' '));
      const tx = await db.beginTransaction();
      try { await buoc.chay(tx, { themCot: async () => { throw new Error('004 không được thêm cột'); } }); await tx.commit(); } catch (e) { await tx.rollback(); ghi.push('LỖI ' + e.message); } finally { console.log = logCu; }
      return ghi.join('\n');
    };
    const log1 = buoc ? await chayBuoc() : '';
    const conLai = await so('SELECT COUNT(*) FROM pos_customers WHERE COALESCE(discount_value, 0) <> 0');
    const loaiLech = await so("SELECT COUNT(*) FROM pos_customers WHERE phone IN (" + cu.map(() => '?').join(',') + ") AND discount_type <> 'percent'", cu.map((r) => r.phone));
    k(`C1a trước có N = ${N} khách mức ≠ 0 (N ≥ 6) → sau 0; type về percent`, N >= 6 && conLai === 0 && loaiLech === 0, `còn ${conLai} · lệch type ${loaiLech}`);
    const coSL = await coBang(BANG_SAO_LUU);
    const sl = coSL ? await db.query(`SELECT phone, discount_type, discount_value FROM ${BANG_SAO_LUU} WHERE COALESCE(discount_value, 0) <> 0 ORDER BY phone`) : [];
    k(`C1b bảng ${BANG_SAO_LUU} đủ ${tongDong} dòng, ${N} dòng giữ đúng mức cũ`, coSL && (await so(`SELECT COUNT(*) FROM ${BANG_SAO_LUU}`)) === tongDong
      && JSON.stringify(sl) === JSON.stringify(cu), coSL ? `${JSON.stringify(sl).slice(0, 200)}` : 'không có bảng');
    k(`C4 log nâng cấp báo số khách bị đặt lại (${N})`, new RegExp(`\\b${N} khách`).test(log1), log1);
    const cauTruc = async () => JSON.stringify(await db.query("SELECT type, name, sql FROM sqlite_master ORDER BY name"));
    const ct1 = await cauTruc(); const dong1 = await so(`SELECT COUNT(*) FROM ${coSL ? BANG_SAO_LUU : 'pos_customers'}`);
    const log2 = buoc ? await chayBuoc() : 'không có bước';
    k('C2 chạy thân 004 lần 2 → cấu trúc CSDL y hệt, bảng sao lưu không thêm dòng, không lỗi', buoc && (await cauTruc()) === ct1
      && (await so(`SELECT COUNT(*) FROM ${coSL ? BANG_SAO_LUU : 'pos_customers'}`)) === dong1 && !/LỖI/.test(log2), log2);
    // C6: kho trống chưa có bảng pos_customers (thu_KHO2a E6b chạy mọi bước trên kho như vậy) → 004 không lỗi, không tạo gì.
    const { createClient } = require(path.join(GOC, 'node_modules', '@libsql', 'client'));
    const c6 = createClient({ url: 'file:' + path.join(THU_MUC, 'trong.db') });
    let loi6 = null;
    try {
      const tx6 = await c6.transaction('write');
      const rows = async (sql, a = []) => (await tx6.execute({ sql, args: a })).rows.map((r) => ({ ...r }));
      try { await buoc.chay({ query: rows, queryOne: async (sql, a) => (await rows(sql, a))[0], run: (sql, a = []) => tx6.execute({ sql, args: a }) }); await tx6.commit(); } catch (e) { await tx6.rollback(); throw e; }
    } catch (e) { loi6 = e.message; }
    const bang6 = buoc ? (await c6.execute("SELECT COUNT(*) AS n FROM sqlite_master")).rows[0].n : -1;
    c6.close();
    k('C6 kho trống chưa có bảng pos_customers → 004 không lỗi, không tạo bảng nào', buoc && !loi6 && Number(bang6) === 0, loi6 || `${bang6} bảng`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] màn hình không còn chiết khấu riêng (đọc mã thật — mẫu nguy hiểm vắng mặt)');
  await chay('D', async () => {
    const tinh = docNguon(CLIENT, 'pages', 'BanHang', 'tinh.js');
    const moi = docNguon(CLIENT, 'pages', 'BanHang', 'BanHangMoi.jsx');
    const sa = docNguon(CLIENT, 'pages', 'Sales.jsx');
    const ci = docNguon(CLIENT, 'components', 'CustomerInput.jsx');
    const cu = docNguon(CLIENT, 'pages', 'Customers.jsx');
    k('D1a tinh.js không còn khachGiam / giamKhach / coChietKhauRieng', tinh.length > 0 && !/khachGiam|giamKhach|coChietKhauRieng/.test(tinh));
    k('D1b BanHangMoi.jsx không còn chanChietKhau / coChietKhauRieng; ThuTien nhận coSo={coSo}', moi.length > 0 && !/chanChietKhau|coChietKhauRieng/.test(moi)
      && /coSo=\{coSo\}/.test(moi));
    // Mọi `<x>.discount_value / discount_type` trong Sales.jsx — chỉ được là của mã giảm hoặc của đơn đã tạo (hoá đơn), không tên khác.
    const docMuc = [...sa.matchAll(/(\w+)\??\.discount_(?:value|type)\b/g)].map((m) => m[1])
      .filter((ten) => !['discountCodeValid', 'order', 'completedOrder'].includes(ten));
    k('D1c Sales.jsx không còn applyCustomerDiscount, không đọc <khách>.discount_value / discount_type (mọi tên biến)', sa.length > 0
      && !/applyCustomerDiscount/.test(sa) && docMuc.length === 0, docMuc.join(', '));
    // Mọi tên biến: chỉ còn ĐÚNG hai chỗ chép phản hồi máy chủ vào trạng thái (`data.discount_type / data.discount_value || 0`, giữ theo
    // kế hoạch §9 Q2) — thêm một chỗ đọc nào (huy hiệu qua tên khác) là đỏ.
    const docMucCI = [...ci.matchAll(/(\w+)\??\.discount_(value|type)\b/g)].map((m) => `${m[1]}.${m[2]}`);
    k('D1d CustomerInput.jsx không còn huy hiệu CK (mọi tên biến)', ci.length > 0 && !/CK:/.test(ci)
      && JSON.stringify(docMucCI) === JSON.stringify(['data.type', 'data.value']), docMucCI.join(', '));
    k('D1e Customers.jsx không còn bộ lọc has_discount, cột / form mức chiết khấu', cu.length > 0 && !/has_discount|discount_value|discount_type|formatDiscount|Chiết khấu mặc định/.test(cu));
    // D2: chạy hàm thật của tinh.js (ES module thuần, nạp thẳng như thu_BH1).
    let m = {};
    try { m = await import(pathToFileURL(path.join(CLIENT, 'pages', 'BanHang', 'tinh.js')).href); } catch (e) { k('D2 nạp tinh.js', false, e.message); }
    const sp1 = { product_id: 1, sx_product_type: 'a', sx_product_id: 1, unit_price: 100000, quantity: 1 };
    const g = typeof m.tinhGio === 'function' ? m.tinhGio([sp1], { khachGiam: { loai: 'percent', gia_tri: 10 } }) : {};
    const d = typeof m.dungDonHang === 'function' && typeof m.tinhGio === 'function'
      ? m.dungDonHang({ gio: [sp1], tamTinh: g, cach: 'cash', khach: { phone: '0900000000', name: 'A', discount_type: 'percent', discount_value: 10 }, khachDua: 100000 }) : {};
    k('D2 tinhGio bỏ qua khachGiam cũ (tổng 100.000); dungDonHang khách hồ sơ 10 % → gửi discount_type null, discount_value 0',
      g.tong === 100000 && d.discount_type === null && d.discount_value === 0, `tổng ${g.tong} · ${d.discount_type}/${d.discount_value}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] ghi chú khách giữ nguyên (discount_note → customer_note trên hoá đơn)');
  await chay('E', async () => {
    const sa = docNguon(CLIENT, 'pages', 'Sales.jsx');
    const od = docNguon(CLIENT, 'pages', 'Orders.jsx');
    const moi = docNguon(CLIENT, 'pages', 'BanHang', 'BanHangMoi.jsx');
    const cu = docNguon(CLIENT, 'pages', 'Customers.jsx');
    k('E1a Sales / Orders / BanHangMoi vẫn đưa discount_note vào ghi chú hoá đơn', /customerNote: customer\?\.discount_note/.test(sa)
      && /customer_note: custData\.discount_note/.test(od) && /customer_note: kh\?\.discount_note/.test(moi));
    k('E1b Customers.jsx nhãn "Ghi chú khách", vẫn gửi discount_note qua updateDiscount', /Ghi chú khách/.test(cu) && !/Lý do chiết khấu/.test(cu)
      && /updateDiscount\(selectedCustomer\.phone, \{\s*discount_note: detailForm\.discount_note\s*\}\)/.test(cu));
    k('E1c Customers.jsx hiện ghi chú khi có (không còn điều kiện mức > 0)', /\{c\.discount_note && \(/.test(cu));
    const s2 = sdtMoi();
    await db.run('INSERT INTO pos_wallets (phone, balance) VALUES (?, 0)', [s2]);
    await db.run("INSERT INTO pos_customers (phone, name, discount_type, discount_value, discount_note) VALUES (?, 'E2', 'percent', 0, 'Ít đá')", [s2]);
    const e2 = await goi('GET', `/v2/customers/${s2}`);
    k('E2 (K5) GET /v2/customers/:sdt vẫn trả discount_note (màn chọn khách đọc ghi chú từ đây)', e2.status === 200 && e2.discount_note === 'Ít đá', moTa(e2));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] giảm tay theo đơn ở màn cũ không đổi');
  await chay('F', async () => {
    const sa = docNguon(CLIENT, 'pages', 'Sales.jsx');
    k('F3a Sales.jsx còn ô giảm tay và vẫn gửi discount_value = discountValue khi không mã', /setDiscountValue\(Math\.max\(0, parseInt\(/.test(sa)
      && /discount_value: discountCodeValid\?\.valid \? discountCodeValid\.discount_value : discountValue,/.test(sa));
    const r = await ban({ customer_phone: sdtMoi(), items: [mon(1, 1)], discount_type: 'percent', discount_value: 10 }, 30000);
    await caDon('F3b đối chứng: thân gửi percent 10 không mã → máy chủ không tin tờ khai, tổng 30.000 như cũ', r, 30000);
    const d3 = r.order ? await mot('SELECT discount_type, discount_value FROM pos_orders WHERE id = ?', [r.order.id]) : null;
    k('F3c cùng đơn F3b: dòng đơn ghi discount_type null, discount_value 0 (không ghi mức tờ khai)', d3 && d3.discount_type === null
      && Number(d3.discount_value) === 0, JSON.stringify(d3));
  });

  sv.close();
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  console.log(`\n  ${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.error('BÀI SẬP:', e); process.exit(2); });
