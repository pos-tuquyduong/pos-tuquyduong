#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KHO-1 — kho trong POS phần 1: bảng kho, nâng cấp dữ liệu đánh số, nhập danh mục từ SX, đường /api/pos/kho
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_KHO1.js [--may-chu <thư mục server>]
 *  Khuôn thu_DOISOAT1.js: database.js thật + libsql thật trên kho TẠM, route thật, SX giả (đếm lệnh trừ kho).
 *  File SX mẫu bài TỰ DỰNG đúng cấu trúc phiếu ("Cấu trúc SX"), đủ các ca trùng tên của bảng tên chính thức.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_kho1_'));
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
process.env.JWT_SECRET = 'thu_kho1_' + Date.now();

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const doc = (duong) => { try { return fs.readFileSync(duong, 'utf8'); } catch { return ''; } };
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const nap = (ten) => { try { return require(path.join(MAY_CHU, ten)); } catch (e) { return { loiNap: e.message }; } };
const gan = (a, b) => Math.abs(a - b) < 1e-9;

// File SX mẫu — đúng cấu trúc phiếu; dữ liệu đủ ca gộp / giá / thiếu đơn vị / công thức trỏ tên gộp / món chưa có ở POS.
async function dungFileSx(duong, them = []) {
  const { createClient } = require(path.join(GOC, 'node_modules', '@libsql', 'client'));
  const c = createClient({ url: 'file:' + duong });
  const cau = [
    `CREATE TABLE ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, unit TEXT DEFAULT 'kg', display_unit TEXT DEFAULT 'kg',
      price REAL DEFAULT 0, stock REAL DEFAULT 0, min_stock REAL DEFAULT 0, track_inventory INTEGER DEFAULT 0, category TEXT DEFAULT 'juice',
      shelf_life_days INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, days_use INTEGER DEFAULT 4, description TEXT,
      is_active INTEGER DEFAULT 1, updated_at TEXT)`,
    'CREATE TABLE recipe_ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL, ingredient_id INTEGER NOT NULL, amount REAL NOT NULL)',
    `CREATE TABLE tea_products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, description TEXT, default_interval INTEGER DEFAULT 30,
      unit TEXT DEFAULT 'gói', created_at TEXT, packages_per_cycle INTEGER DEFAULT 30, is_active INTEGER DEFAULT 1, updated_at TEXT)`,
    'CREATE TABLE tea_ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, tea_product_id INTEGER NOT NULL, ingredient_id INTEGER NOT NULL, amount REAL NOT NULL)',
    `CREATE TABLE product_types (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, icon TEXT DEFAULT '',
      code_prefix TEXT NOT NULL, fp_type TEXT NOT NULL, sales_mode TEXT NOT NULL DEFAULT 'make_to_stock', has_recipe INTEGER NOT NULL DEFAULT 1,
      is_system INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER DEFAULT 0, quan_kho INTEGER NOT NULL DEFAULT 1)`,
    `CREATE TABLE sx_products (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, type_id INTEGER NOT NULL,
      unit TEXT, is_active INTEGER NOT NULL DEFAULT 1, legacy_table TEXT, legacy_id INTEGER)`,
    `CREATE TABLE sx_product_ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, ingredient_id INTEGER NOT NULL,
      amount REAL NOT NULL, unit_internal TEXT, note TEXT)`,
    'CREATE TABLE app_config (key TEXT PRIMARY KEY, value TEXT)',
    "INSERT INTO app_config VALUES ('USE_UNIFIED_PRODUCTS', 'true')",
    'CREATE VIEW v_recipes AS SELECT * FROM recipes',
    'CREATE VIEW v_tea_products AS SELECT * FROM tea_products',
    'CREATE VIEW v_recipe_ingredients AS SELECT recipe_id, ingredient_id, amount FROM recipe_ingredients',
    'CREATE VIEW v_tea_ingredients AS SELECT tea_product_id, ingredient_id, amount FROM tea_ingredients',
    'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, phone TEXT)',
    "INSERT INTO customers VALUES (1, 'Khách SX', '0900000001')",
  ];
  const nl = [ // id, tên SX (đúng như SX, kể cả dấu cách thừa), category, giá, đơn vị, hạn, tối thiểu, tồn
    [1, 'Cam', 'juice', 0, 'kg', 0, 0, 12], [3, 'Dền Đỏ', 'juice', 0, 'kg', 0, 0, 0], [5, 'Gừng', 'juice', 40000, 'kg', 0, 0, 3],
    [15, 'Củ dền', 'juice', 65000, 'kg', 0, 0, 0], [24, 'Đỗ đen rang', 'tea', 50000, 'kg', 0, 0, 0], [25, 'Mè đen rang', 'tea', 15, 'kg', 0, 0, 0],
    [26, 'Kỷ tử', 'tea', 0, 'kg', 0, 0, 0], [27, 'Táo đỏ khô', 'tea', 0, 'kg', 0, 0, 0], [28, 'Táo tươi', 'juice', 30000, 'kg', 0, 0, 0],
    [33, 'Gừng tươi', 'juice', 45000, 'kg', 0, 0, 0], [34, 'Táo đỏ', 'tea', 0, 'kg', 0, 0, 0], [35, 'Trần bì khô', 'tea', 0, 'kg', 0, 0, 0],
    [39, 'Trần bì', 'tea', 0, 'kg', 0, 0, 0], [43, 'Cẩu tích', 'tea', 0, 'kg', 0, 0, 0], [47, 'Mẹ Thuốc', 'tea', 120000, 'kg', 0, 0, 0],
    [48, 'Mẹ Thuốc ', 'tea', 0, 'kg', 0, 0, 0], [49, 'Cẩu Tích', 'tea', 0, 'kg', 0, 0, 0], [50, 'Kỳ Tử ', 'tea', 90000, 'kg', 0, 0, 0],
    [51, 'Táo Đỏ', 'tea', 0, 'kg', 0, 0, 0], [53, 'Trần Bì ', 'tea', 0, 'kg', 0, 0, 0], [60, 'lá  DỨA', 'juice', 0, '', 3, 0.5, 7],
  ];
  for (const [id, ten, nhom, gia, dv, han, tt, ton] of nl) {
    cau.push({ sql: 'INSERT INTO ingredients (id, name, category, price, unit, shelf_life_days, min_stock, stock) VALUES (?,?,?,?,?,?,?,?)',
      args: [id, ten, nhom, gia, dv, han, tt, ton] });
  }
  cau.push("INSERT INTO recipes (id, name, code, is_active) VALUES (1, 'Hồng Tân Sinh', 'CT1', 1), (13, 'Test production owner', 'CT13', 0)");
  for (const [ma, sl] of [[1, 0.07], [3, 0.1], [15, 0.03], [5, 0.002], [28, 0.09], [999, 0.01]]) {
    cau.push({ sql: 'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount) VALUES (1, ?, ?)', args: [ma, sl] });
  }
  cau.push("INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount) VALUES (13, 1, 0.5)");
  cau.push("INSERT INTO tea_products (id, name, code, is_active) VALUES (1, 'Dưỡng Nhan Lộ', 'DNL', 1), (2, 'Ngọc Thanh Lộ', 'CT2', 1)");
  for (const [ma, sl] of [[47, 0.0035], [34, 0.004200000000000001], [53, 0.0005]]) {
    cau.push({ sql: 'INSERT INTO tea_ingredients (tea_product_id, ingredient_id, amount) VALUES (1, ?, ?)', args: [ma, sl] });
  }
  cau.push("INSERT INTO tea_ingredients (tea_product_id, ingredient_id, amount) VALUES (2, 47, 0.001)");
  cau.push(`INSERT INTO product_types (id, code, name, code_prefix, fp_type, is_system, is_active, quan_kho) VALUES
    (1, 'juice', 'Nước ép', 'CT', 'juice', 1, 1, 1), (2, 'tea', 'Trà thảo mộc', 'TEA', 'tea', 1, 1, 1),
    (3, 'caphe', 'CÀ PHÊ', 'CF', 'caphe', 0, 1, 0), (4, 'cu', 'Nhóm cũ', 'CU', 'cu', 0, 0, 1)`);
  cau.push(`INSERT INTO sx_products (id, code, name, type_id, is_active, legacy_table, legacy_id) VALUES
    (20, 'CF01', 'Cà Phê Đen', 3, 1, NULL, NULL), (21, 'CF02', 'Bạc xỉu', 3, 1, 'caphe', 5), (22, 'CU1', 'Món nhóm cũ', 4, 1, 'cu', 1)`);
  cau.push("INSERT INTO sx_product_ingredients (product_id, ingredient_id, amount) VALUES (21, 28, 0.01), (22, 28, 0.02)");
  for (const c2 of them) cau.push(c2);
  for (const c2 of cau) await c.execute(c2);
  c.close();
}

const bamFile = (duong) => crypto.createHash('sha1').update(fs.readFileSync(duong)).digest('hex');

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const XLSX = require(path.join(GOC, 'node_modules', 'xlsx'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();

  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const demSX = { tru: 0 };
  const sxOk = async () => ({ ok: true });
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => false, checkStock: async () => ({ sufficient: true, stock: 999 }),
    outStockFIFO: async () => { demSX.tru++; return { ok: true }; }, inStockReturn: sxOk, callSxApi: sxOk };

  const app = express();
  app.use(express.json());
  for (const r of ['don-mo-rong', 'orders', 'backup']) {
    app.use('/api/pos/' + (r === 'don-mo-rong' ? 'orders' : r), require(path.join(MAY_CHU, 'routes', r + '.js')));
  }
  const kho = nap('kho/duong.js');
  if (typeof kho === 'function') app.use('/api/pos/kho', kho);
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();

  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const coBang = async (ten) => (await so("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = ?", [ten])) === 1;
  const chu = await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const nguoi = { chu: chu.id };
  for (const [ten, vaiTro] of [['ql_kho1', 'manager'], ['nv_kho1', 'staff']]) {
    nguoi[vaiTro] = Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)",
      [ten, ten, vaiTro])).lastInsertRowid);
  }
  const the = Object.fromEntries(Object.entries(nguoi).map(([a, id]) => [a, jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '3650d' })]));
  const goiAi = async (ai, method, url, body) => {
    imLang();
    try {
      const headers = { Authorization: 'Bearer ' + the[ai] };
      if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
      const r = await fetch(goc + url, { method, headers, body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined) });
      const kieu = r.headers.get('content-type') || '';
      if (!kieu.includes('json')) return { status: r.status, tep: Buffer.from(await r.arrayBuffer()) };
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const goi = (method, url, body) => goiAi('chu', method, url, body);
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;
  const tepForm = (duong, ghi, ten = 'file') => {
    const f = new FormData();
    f.append(ten, new Blob([fs.readFileSync(duong)]), 'sx.db');
    f.append('ghi', ghi ? '1' : '0');
    return f;
  };
  const nhap = (ai, duong, ghi) => goiAi(ai, 'POST', '/kho/nhap-sx', tepForm(duong, ghi));
  const dem = async (bang) => ((await coBang(bang)) ? so(`SELECT COUNT(*) FROM ${bang}`) : NaN);

  console.log('\nTHỬ KHO-1 — kho trong POS phần 1');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] cấu trúc theo mục nghiệp vụ');
  for (const f of ['duong.js', 'tinh.js', 'duLieu.js', 'nhapSx.js']) k(`A1 server/kho/${f} có`, fs.existsSync(path.join(MAY_CHU, 'kho', f)));
  const index = doc(path.join(MAY_CHU, 'index.js'));
  k('A2 index.js mount /api/pos/kho đúng MỘT lần', (index.match(/app\.use\(\s*['"]\/api\/pos\/kho['"]/g) || []).length === 1);
  const tinhSrc = doc(path.join(MAY_CHU, 'kho', 'tinh.js')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  k('A3 tinh.js THUẦN: không require, không Date / getNow', tinhSrc.length > 0 && !/require\(|\bDate\b|getNow/.test(tinhSrc));
  const nhapSx = nap('kho/nhapSx.js');
  const bang = nhapSx.BANG_TEN_CHINH_THUC || {};
  k('A4 nhapSx.js có hằng BANG_TEN_CHINH_THUC: 41 tên SX → 37 khoá sau chuẩn hoá', Object.keys(bang).length === 37, `${Object.keys(bang).length} khoá`);
  k('A5 trang Kho có ở client/src/pages/Kho/ + route /kho trong App.jsx + đúng một mục /kho trong Layout.jsx',
    fs.existsSync(path.join(GOC, 'client', 'src', 'pages', 'Kho', 'index.jsx'))
    && /path="kho"/.test(doc(path.join(GOC, 'client', 'src', 'App.jsx')))
    && (doc(path.join(GOC, 'client', 'src', 'components', 'Layout.jsx')).match(/to: '\/kho'/g) || []).length === 1);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] phép tính thuần (tinh.js)');
  const t = nap('kho/tinh.js');
  const fn = (ten) => (typeof t[ten] === 'function' ? t[ten] : () => { throw new Error('thiếu hàm ' + ten); });
  const thu = (f) => { try { return { kq: f() }; } catch (e) { return { loi: e }; } };
  const bangCT = {
    10: [{ nguyen_lieu_id: 1, luong: 0.07 }, { thanh_phan_id: 20, luong: 0.5 }],
    20: [{ nguyen_lieu_id: 2, luong: 0.01 }, { thanh_phan_id: 30, luong: 2 }],
    30: [{ nguyen_lieu_id: 1, luong: 0.001 }],
  };
  const tk = thu(() => fn('trienKhai')({ goc: 10, bang: bangCT }, 3));
  const lay = (ds, id) => (ds || []).find((d) => d.nguyen_lieu_id === id)?.luong;
  k('E1 trienKhai lồng 2 tầng × 3 phần: NL1 = 3×(0.07 + 0.5×2×0.001), NL2 = 3×0.5×0.01',
    !tk.loi && gan(lay(tk.kq, 1), 3 * (0.07 + 0.001)) && gan(lay(tk.kq, 2), 0.015) && tk.kq.length === 2, tk.loi?.message || JSON.stringify(tk.kq));
  const kc = thu(() => fn('trienKhai')({ goc: 1, bang: { 1: [{ thanh_phan_id: 2, luong: 1 }, { thanh_phan_id: 3, luong: 1 }],
    2: [{ nguyen_lieu_id: 9, luong: 1 }], 3: [{ thanh_phan_id: 2, luong: 1 }] } }, 1));
  k('E2 hình kim cương A→B, A→C→B KHÔNG phải vòng — NL9 = 2', !kc.loi && gan(lay(kc.kq, 9), 2), kc.loi?.message);
  const v1 = thu(() => fn('trienKhai')({ goc: 5, bang: { 5: [{ thanh_phan_id: 5, luong: 1 }] } }, 1));
  k('E3 vòng A→A → ném CONG_THUC_VONG_LAP, chuỗi [5,5]', v1.loi?.code === 'CONG_THUC_VONG_LAP' && JSON.stringify(v1.loi.chuoi) === '[5,5]',
    v1.loi ? `${v1.loi.code} ${JSON.stringify(v1.loi.chuoi)}` : 'không ném');
  const v2 = thu(() => fn('trienKhai')({ goc: 5, bang: { 5: [{ thanh_phan_id: 6, luong: 1 }], 6: [{ thanh_phan_id: 5, luong: 1 }] } }, 1));
  k('E4 vòng A→B→A → ném, chuỗi [5,6,5]', v2.loi?.code === 'CONG_THUC_VONG_LAP' && JSON.stringify(v2.loi.chuoi) === '[5,6,5]');
  const v3 = thu(() => fn('trienKhai')({ goc: 5, bang: { 5: [{ thanh_phan_id: 6, luong: 1 }], 6: [{ nguyen_lieu_id: 1, luong: 1 }] } }, 2));
  k('E5 A→B không vòng → không ném, NL1 = 2', !v3.loi && gan(lay(v3.kq, 1), 2));
  k('E6 doiDonVi 0.0125 kg → 12.5 g (hệ số 0.001) và 12.5 g → 0.0125 kg',
    !thu(() => fn('doiDonVi')(1, 1)).loi && gan(fn('doiDonVi')(0.0125, 0.001), 12.5) && gan(fn('doiDonVi')(12.5, 0.001, true), 0.0125));
  const ch = thu(() => [fn('chuanHoaTen')('  Trần   Bì '), fn('chuanHoaTen')('Táo tươi'), fn('chuanTenHienThi')('lá  DỨA')]);
  k('E7 chuanHoaTen gộp khoảng trắng + thường, GIỮ dấu; chuanTenHienThi viết hoa chữ đầu',
    !ch.loi && ch.kq[0] === 'trần bì' && ch.kq[1] === 'táo tươi' && ch.kq[2] === 'Lá dứa', JSON.stringify(ch.kq || ch.loi?.message));
  const tt = (ten) => bang[thu(() => fn('chuanHoaTen')(ten)).kq]?.[0];
  k('E8 bảng tên chính thức: Gừng tươi→Gừng, Kỳ Tử →Kỷ tử, Táo Đỏ / Táo đỏ khô→Táo đỏ, Trần Bì →Trần bì, Dền Đỏ→Củ dền, Mẹ Thuốc →Mẹ thuốc',
    tt('Gừng tươi') === 'Gừng' && tt('Kỳ Tử ') === 'Kỷ tử' && tt('Táo Đỏ') === 'Táo đỏ' && tt('Táo đỏ khô') === 'Táo đỏ'
    && tt('Trần Bì ') === 'Trần bì' && tt('Trần bì khô') === 'Trần bì' && tt('Dền Đỏ') === 'Củ dền' && tt('Mẹ Thuốc ') === 'Mẹ thuốc');
  k('E9 "Táo tươi" KHÔNG gộp vào Táo đỏ', tt('Táo tươi') === 'Táo tươi');
  const tenPOS = new Set(Object.values(bang).map((x) => x[0]));
  const nhomPOS = new Set(Object.values(bang).map((x) => x[1]));
  k('E10 bảng ra đúng 32 tên POS, 2 nhóm (Rau củ quả · Dược liệu)', tenPOS.size === 32 && nhomPOS.size === 2
    && nhomPOS.has('Rau củ quả') && nhomPOS.has('Dược liệu'), `${tenPOS.size} tên · ${[...nhomPOS].join(', ')}`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] nâng cấp dữ liệu đánh số');
  const cauTruc = async () => JSON.stringify(await db.query("SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name"));
  const ctLan1 = await cauTruc();
  const nc1 = (await coBang('pos_nang_cap')) ? await db.query('SELECT so, ten FROM pos_nang_cap ORDER BY so') : [];
  k('B1 khởi động lần 1: pos_nang_cap có bước 1 (001_kho)', nc1.length === 1 && Number(nc1[0].so) === 1 && nc1[0].ten === '001_kho', JSON.stringify(nc1));
  imLang(); await db.initDatabase(); noiLai();
  k('B2 khởi động lần 2: cấu trúc CSDL y hệt, pos_nang_cap không thêm dòng', (await cauTruc()) === ctLan1 && (await dem('pos_nang_cap')) === 1);
  const chay = nap('nang_cap/chay.js');
  const chayNC = (csdl, thuMuc) => (typeof chay.chayNangCap === 'function' ? chay.chayNangCap(csdl, thuMuc) : Promise.resolve({ hong: 'thiếu chayNangCap' }));
  const dirBuoc = (ten, tep) => {
    const d = path.join(THU_MUC, ten); fs.mkdirSync(d);
    for (const [f, than] of Object.entries(tep)) fs.writeFileSync(path.join(d, f), than);
    return d;
  };
  const dHong = dirBuoc('buoc_hong', {
    '901_a.js': "module.exports.chay = async (tx) => { await tx.run('CREATE TABLE thu_a (x)'); };",
    '902_hong.js': "module.exports.chay = async (tx) => { await tx.run('CREATE TABLE thu_b (x)'); throw new Error('cố ý hỏng'); };",
    '903_c.js': "module.exports.chay = async (tx) => { await tx.run('CREATE TABLE thu_c (x)'); };",
    'ghichu.txt': 'không phải bước',
  });
  imLang(); const kqHong = await chayNC(db, dHong); noiLai();
  const daChay = (await coBang('pos_nang_cap')) ? (await db.query('SELECT so FROM pos_nang_cap WHERE so > 900')).map((r) => Number(r.so)) : [];
  k('B3 bước 901 chạy + đánh dấu; 902 hỏng KHÔNG đánh dấu; 903 KHÔNG chạy', JSON.stringify(daChay) === '[901]'
    && (await coBang('thu_a')) && !(await coBang('thu_c')), JSON.stringify(daChay));
  k('B4 bước hỏng rollback cả bước (thu_b không còn) + kết quả nêu "902_hong"', !(await coBang('thu_b')) && /902_hong/.test(String(kqHong?.hong)), String(kqHong?.hong));
  await db.run('CREATE TABLE thu_co_dong (x)'); await db.run('INSERT INTO thu_co_dong VALUES (1), (2)'); await db.run('CREATE TABLE thu_rong (x)');
  const dCot = dirBuoc('buoc_cot', {
    '904_cot.js': "module.exports.chay = async (tx, { themCot }) => { await themCot('thu_co_dong', 'moi TEXT'); await themCot('thu_rong', 'moi TEXT');"
      + " await themCot('thu_co_dong', 'moi TEXT'); };",
  });
  imLang(); const kqCot = await chayNC(db, dCot); noiLai();
  k('B5 themCot vào bảng CÓ dòng → _sao_luu_904_thu_co_dong đủ 2 dòng, cột mới có', !kqCot?.hong && (await dem('_sao_luu_904_thu_co_dong')) === 2
    && (await db.query('PRAGMA table_info(thu_co_dong)')).some((c) => c.name === 'moi'), String(kqCot?.hong));
  k('B6 themCot vào bảng rỗng → KHÔNG tạo bảng sao lưu; gọi lại cột đã có → không lỗi', !(await coBang('_sao_luu_904_thu_rong'))
    && (await db.query('PRAGMA table_info(thu_rong)')).some((c) => c.name === 'moi'));
  const tepBuoc = fs.existsSync(path.join(MAY_CHU, 'nang_cap')) ? fs.readdirSync(path.join(MAY_CHU, 'nang_cap')).filter((f) => f.endsWith('.js') && f !== 'chay.js') : [];
  const viPham = tepBuoc.filter((f) => /\b(ALTER\s+TABLE|DROP\s+(TABLE|INDEX|VIEW)|DELETE\s+FROM|RENAME\s)/i.test(doc(path.join(MAY_CHU, 'nang_cap', f))));
  k('B7 bước nâng cấp chỉ THÊM: không ALTER/DROP/DELETE/RENAME viết thẳng (≥ 1 bước để quét)', tepBuoc.length >= 1 && !viPham.length, viPham.join(', '));
  // Hai máy chủ khởi động cùng lúc: bản database.js thứ hai (kết nối riêng) cùng chạy một thư mục bước chậm.
  const duongDB = require.resolve(path.join(MAY_CHU, 'database.js'));
  const dbGoc = require.cache[duongDB];
  delete require.cache[duongDB];
  const db2 = require(duongDB);
  require.cache[duongDB] = dbGoc;
  imLang(); await db2.initDatabase(); noiLai();
  await db.run('CREATE TABLE thu_dem (buoc INTEGER)');
  const cham = (n) => `module.exports.chay = async (tx) => { await tx.run('INSERT INTO thu_dem VALUES (${n})'); await new Promise((r) => setTimeout(r, 150)); };`;
  const dSS = dirBuoc('buoc_song_song', { '905_cham.js': cham(905), '906_cham.js': cham(906) });
  imLang(); const ss = await Promise.all([chayNC(db, dSS), chayNC(db2, dSS)]); noiLai();
  k('B8 hai bộ chạy song song cùng CSDL: mỗi bước đúng 1 lần, không bên nào báo hỏng',
    (await dem('thu_dem')) === 2 && (await so('SELECT COUNT(*) FROM pos_nang_cap WHERE so IN (905, 906)')) === 2 && !ss[0]?.hong && !ss[1]?.hong,
    `thu_dem ${await dem('thu_dem')} · ${ss.map((x) => x?.hong).join(' | ')}`);
  const layHong = db.layNangCapHong;
  db.layNangCapHong = () => '902_hong: cố ý hỏng';
  const r503 = await goiAi('staff', 'GET', '/kho/nguyen-lieu');
  db.layNangCapHong = layHong;
  k('B9 bước hỏng → đường kho trả 503 NANG_CAP_HONG nêu tên bước', r503.status === 503 && r503.code === 'NANG_CAP_HONG' && /902_hong/.test(r503.error || ''), moTa(r503));
  k('B10 bình thường layNangCapHong() = null', typeof layHong === 'function' && layHong() === null);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] bảng kho');
  const BANG_KHO = ['kho_nhom_nguyen_lieu', 'kho_nha_cung_cap', 'kho_nguyen_lieu', 'kho_nhom_cong_thuc', 'kho_san_pham', 'kho_cong_thuc',
    'kho_dinh_muc', 'kho_phieu', 'kho_lo', 'kho_phieu_dong'];
  const thieu = []; for (const b of BANG_KHO) if (!(await coBang(b))) thieu.push(b);
  k('C1 đủ 10 bảng kho_*', !thieu.length, 'thiếu ' + thieu.join(', '));
  const nem = async (sql, a = []) => { try { await db.run(sql, a); return false; } catch { return true; } };
  k('C2 CHECK: kiểu sản phẩm lạ bị từ chối', await nem("INSERT INTO kho_san_pham (pos_product_id, kieu) VALUES (1, 'la')"));
  k('C3 CHECK: loại phiếu lạ bị từ chối', await nem("INSERT INTO kho_phieu (loai, so_phieu, nguoi_tao, tao_luc) VALUES ('XX', 'T1', 'a', 'b')"));
  k('C4 CHECK: dòng công thức có CẢ nguyên liệu lẫn thành phần bị từ chối',
    await nem('INSERT INTO kho_cong_thuc (san_pham_id, nguyen_lieu_id, thanh_phan_id, luong) VALUES (1, 1, 2, 1)'));
  let cotTon = [];
  for (const b of BANG_KHO) if (await coBang(b)) cotTon = cotTon.concat((await db.query(`PRAGMA table_info(${b})`)).filter((c) => /^ton($|_)/.test(c.name) && c.name !== 'ton_toi_thieu').map((c) => b + '.' + c.name));
  k('C5 tồn KHÔNG là ô sửa tay: không cột ton* nào trong bảng kho (trừ ton_toi_thieu)', (await coBang('kho_nguyen_lieu')) && !cotTon.length, cotTon.join(', '));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D/K] một món một dòng — pos_products và menu không đổi');
  const COT_SP = 'id,code,name,category,price,unit,description,image_url,is_active,sort_order,sx_product_type,sx_product_id,is_special_group,created_at,updated_at,ton_gan_nhat,ton_luc';
  k('D1 pos_products KHÔNG thêm cột', (await db.query('PRAGMA table_info(pos_products)')).map((c) => c.name).join(',') === COT_SP);
  await db.run("UPDATE pos_products SET price = 25000 WHERE code IN ('CT1', 'CT2')");
  const { layMenuQuay } = require(path.join(MAY_CHU, 'routes', 'products.js'));
  imLang(); const menuTruoc = JSON.stringify(await layMenuQuay()); noiLai();

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F/G] nhập danh mục từ SX');
  const fileSx = path.join(THU_MUC, 'sx.db');
  await dungFileSx(fileSx);
  const bamSx = bamFile(fileSx);
  const nlTruoc = await dem('kho_nguyen_lieu');
  const xem = await nhap('chu', fileSx, false);
  const kh = xem.ke_hoach || {};
  k('F1 xem trước 200: 12 nguyên liệu thêm, 3 nhóm sản phẩm, 3 món tạo ẩn, 3 món có công thức', xem.status === 200 && kh.nguyen_lieu_them === 12
    && kh.nhom_san_pham_them === 3 && kh.mon_tao_an === 3 && kh.cong_thuc_ghi === 3, moTa(xem) + ' ' + JSON.stringify(kh).slice(0, 300));
  const loaiCB = new Set((kh.canh_bao || []).map((c) => c.loai));
  const CB = ['GIA_BAT_THUONG', 'THIEU_DON_VI', 'TEN_MOI', 'THIEU_NGUYEN_LIEU', 'GOP_CONG_THUC', 'TRUNG_MA', 'MON_TAO_AN'];
  k('F2 đủ 7 loại cảnh báo (giá, thiếu đơn vị, tên mới, công thức trỏ NL không có, hai tên gộp một công thức, trùng mã, món tạo ẩn)',
    CB.every((c) => loaiCB.has(c)), 'thiếu ' + CB.filter((c) => !loaiCB.has(c)).join(', '));
  const gop = (kh.gop || []).find((g) => g.giu === 'Táo đỏ');
  k('F3 bản xem trước nêu tên gộp: Táo đỏ ← Táo đỏ khô, Táo Đỏ', gop && gop.cu.length === 3, JSON.stringify(gop));
  k('F4 xem trước KHÔNG ghi gì', (await dem('kho_nguyen_lieu')) === nlTruoc && (await so('SELECT COUNT(*) FROM pos_products')) === 8);
  const ghi = await nhap('chu', fileSx, true);
  const nl = await db.query('SELECT * FROM kho_nguyen_lieu ORDER BY ten');
  const tenNL = nl.map((r) => r.ten);
  k('G1 nhập → đúng 12 nguyên liệu (gộp đúng bảng tên chính thức)', ghi.status === 200 && JSON.stringify(tenNL) === JSON.stringify(
    ['Cam', 'Cẩu tích', 'Củ dền', 'Gừng', 'Kỷ tử', 'Lá dứa', 'Mè đen rang', 'Mẹ thuốc', 'Táo tươi', 'Táo đỏ', 'Trần bì', 'Đỗ đen rang'].sort()),
    moTa(ghi) + ' ' + tenNL.join(', '));
  const nlTen = (ten) => nl.find((r) => r.ten === ten) || {};
  k('G2 dòng gộp: Gừng giá lớn nhất 45.000, sx_id nhỏ nhất 5; Kỷ tử giá 90.000 đơn vị hiện g',
    Number(nlTen('Gừng').gia_nhap) === 45000 && Number(nlTen('Gừng').sx_id) === 5 && Number(nlTen('Kỷ tử').gia_nhap) === 90000 && nlTen('Kỷ tử').don_vi_hien === 'g');
  k('F5 giá 0 và giá < 1.000 → TRỐNG (NULL); đơn vị lưu kg; Rau củ quả hiện kg', nlTen('Cam').gia_nhap === null && nlTen('Mè đen rang').gia_nhap === null
    && nl.every((r) => r.don_vi_luu === 'kg') && nlTen('Cam').don_vi_hien === 'kg');
  k('F6 hạn / tối thiểu: 0 → NULL, có số thì giữ (Lá dứa 3 ngày, 0.5)', nlTen('Cam').han_ngay === null && nlTen('Cam').ton_toi_thieu === null
    && Number(nlTen('Lá dứa').han_ngay) === 3 && gan(Number(nlTen('Lá dứa').ton_toi_thieu), 0.5));
  const nhomNL = await db.query('SELECT n.ten, COUNT(l.id) AS so FROM kho_nhom_nguyen_lieu n LEFT JOIN kho_nguyen_lieu l ON l.nhom_id = n.id GROUP BY n.id ORDER BY n.ten');
  k('F7 nhóm nguyên liệu: Dược liệu 7 · Rau củ quả 5 (Lá dứa tên mới juice → Rau củ quả)', JSON.stringify(nhomNL.map((r) => [r.ten, Number(r.so)]))
    === JSON.stringify([['Dược liệu', 7], ['Rau củ quả', 5]]), JSON.stringify(nhomNL));
  const nhomCT = (await coBang('kho_nhom_cong_thuc')) ? (await db.query('SELECT ten FROM kho_nhom_cong_thuc ORDER BY ten')).map((r) => r.ten) : [];
  k('F8 nhóm sản phẩm giữ tên SX ("CÀ PHÊ" → "Cà phê"), không lấy nhóm đã tắt', JSON.stringify(nhomCT) === JSON.stringify(['Cà phê', 'Nước ép', 'Trà thảo mộc']), nhomCT.join(', '));
  const moi = await db.query("SELECT code, name, category, price, is_active, sx_product_type, sx_product_id FROM pos_products WHERE code IN ('DNL', 'CF01', 'CF02', 'CU1', 'CT13') ORDER BY code");
  k('F9 món SX chưa có ở POS → tạo ẨN giá 0, giữ khoá nối (DNL tea/1, CF02 caphe/5, CF01 không id); bỏ món tắt / nhóm tắt',
    JSON.stringify(moi.map((r) => [r.code, r.category, Number(r.price), Number(r.is_active), r.sx_product_type, r.sx_product_id === null ? null : Number(r.sx_product_id)]))
    === JSON.stringify([['CF01', 'caphe', 0, 0, 'caphe', null], ['CF02', 'caphe', 0, 0, 'caphe', 5], ['DNL', 'tea', 0, 0, 'tea', 1]]), JSON.stringify(moi));
  k('F10 trùng mã khác món (tea 2 mã CT2) → bỏ qua, CT2 cũ giữ nguyên tên', (await mot("SELECT name FROM pos_products WHERE code = 'CT2'"))?.name === 'Lục Tân Khí');
  const ctMon = async (code) => db.query(`SELECT l.ten, c.luong FROM kho_cong_thuc c JOIN kho_nguyen_lieu l ON l.id = c.nguyen_lieu_id
    JOIN pos_products p ON p.id = c.san_pham_id WHERE p.code = ? ORDER BY l.ten`, [code]).catch(() => []);
  const ct1Mon = await ctMon('CT1');
  k('G3 Hồng Tân Sinh: Củ dền 0.13 (Dền Đỏ + Củ dền cộng), bỏ dòng trỏ NL không có',
    JSON.stringify(ct1Mon.map((r) => [r.ten, Number(Number(r.luong).toFixed(6))])) === JSON.stringify([['Cam', 0.07], ['Củ dền', 0.13], ['Gừng', 0.002], ['Táo tươi', 0.09]]),
    JSON.stringify(ct1Mon));
  const dnl = await ctMon('DNL');
  k('G4 Dưỡng Nhan Lộ: số kg sai số máy lưu làm tròn 6 chữ số (Táo đỏ 0.0042)', dnl.some((r) => r.ten === 'Táo đỏ' && Number(r.luong) === 0.0042) && dnl.length === 3, JSON.stringify(dnl));
  k('G5 Bạc xỉu (nhóm khác): công thức lấy sx_product_ingredients theo sx_products.id (21), không theo legacy_id', JSON.stringify((await ctMon('CF02')).map((r) => r.ten)) === '["Táo tươi"]');
  const kieu = (await coBang('kho_san_pham')) ? await db.query('SELECT p.code, s.kieu FROM kho_san_pham s JOIN pos_products p ON p.id = s.pos_product_id ORDER BY p.code') : [];
  k('F11 kiểu: món có công thức SX → lam_san; Cà Phê Đen → chua_dinh_luong', JSON.stringify(kieu.map((r) => [r.code, r.kieu]))
    === JSON.stringify([['CF01', 'chua_dinh_luong'], ['CF02', 'lam_san'], ['CT1', 'lam_san'], ['DNL', 'lam_san']]), JSON.stringify(kieu));
  const cot = (await coBang('kho_nguyen_lieu')) ? (await db.query('PRAGMA table_info(kho_nguyen_lieu)')).map((c) => c.name) : [];
  k('F12 không lấy tồn / khách: kho_nguyen_lieu không có cột stock, không có bảng customers ở POS', !cot.includes('stock') && !(await coBang('customers')));
  k('F13 file SX KHÔNG bị sửa (băm trước = sau)', bamFile(fileSx) === bamSx);
  const tamDir = nhapSx.THU_MUC_TAM;
  k('F14 file tạm đã xoá (thư mục tạm nhập SX rỗng)', !!tamDir && (!fs.existsSync(tamDir) || fs.readdirSync(tamDir).length === 0), String(tamDir));
  const bamKho = async () => { const h = crypto.createHash('sha1'); for (const b of BANG_KHO.concat(['pos_products'])) if (await coBang(b)) h.update(JSON.stringify(await db.query(`SELECT * FROM ${b} ORDER BY rowid`))); return h.digest('hex'); };
  const sau1 = await bamKho();
  const lan2 = await nhap('chu', fileSx, true);
  k('F15 nhập lại cùng file → 200, KHÔNG thêm / đổi một dòng', lan2.status === 200 && (await bamKho()) === sau1 && lan2.ke_hoach?.nguyen_lieu_them === 0, moTa(lan2));
  await db.run("UPDATE kho_nguyen_lieu SET gia_nhap = 50000 WHERE ten = 'Gừng'");
  await db.run("UPDATE kho_nhom_nguyen_lieu SET ten = 'Thuốc bắc' WHERE ten = 'Dược liệu'");
  await db.run("DELETE FROM kho_cong_thuc WHERE san_pham_id = (SELECT id FROM pos_products WHERE code = 'CT1') AND nguyen_lieu_id = (SELECT id FROM kho_nguyen_lieu WHERE ten = 'Cam')");
  const fileSx2 = path.join(THU_MUC, 'sx2.db');
  await dungFileSx(fileSx2, ["INSERT INTO ingredients (id, name, category, price) VALUES (61, 'Hạt sen', 'tea', 200000)"]);
  const lan3 = await nhap('chu', fileSx2, true);
  k('F16 bản mới hơn: chỉ +1 nguyên liệu (Hạt sen vào nhóm đã đổi tên), giá Gừng chủ quán sửa giữ 50.000, không sinh lại nhóm "Dược liệu", công thức đã sửa giữ',
    lan3.status === 200 && (await dem('kho_nguyen_lieu')) === 13 && Number((await mot("SELECT gia_nhap FROM kho_nguyen_lieu WHERE ten = 'Gừng'"))?.gia_nhap) === 50000
    && (await so("SELECT COUNT(*) FROM kho_nhom_nguyen_lieu WHERE ten = 'Dược liệu'")) === 0
    && (await mot("SELECT n.ten FROM kho_nguyen_lieu l JOIN kho_nhom_nguyen_lieu n ON n.id = l.nhom_id WHERE l.ten = 'Hạt sen'"))?.ten === 'Thuốc bắc'
    && (await ctMon('CT1')).length === 3, moTa(lan3));
  const lon = path.join(THU_MUC, 'lon.db');
  fs.writeFileSync(lon, Buffer.alloc((nhapSx.GIOI_HAN_FILE_SX || 20 * 1024 * 1024) + 1));
  const rLon = await nhap('chu', lon, false);
  k('F17 file quá giới hạn → 413 FILE_QUA_LON', rLon.status === 413 && rLon.code === 'FILE_QUA_LON', moTa(rLon));
  const hongF = path.join(THU_MUC, 'hong.db'); fs.writeFileSync(hongF, 'không phải sqlite');
  const rHong = await nhap('chu', hongF, false);
  k('F18 file không phải bản sao lưu SX → 400 FILE_SX_HONG', rHong.status === 400 && rHong.code === 'FILE_SX_HONG', moTa(rHong));
  k('F19 manager / staff nhập SX → 403', (await nhap('manager', fileSx, false)).status === 403 && (await nhap('staff', fileSx, false)).status === 403);
  // Hai người bấm Nhập cùng lúc trên kho chưa có gì của SX.
  for (const b of ['kho_cong_thuc', 'kho_san_pham', 'kho_nguyen_lieu', 'kho_nhom_nguyen_lieu', 'kho_nhom_cong_thuc']) if (await coBang(b)) await db.run(`DELETE FROM ${b}`);
  const hai = await Promise.all([nhap('chu', fileSx, true), nhap('chu', fileSx, true)]);
  k('F20 hai lần Nhập cùng lúc → không nhân đôi (12 nguyên liệu, 8 dòng công thức)', hai.every((r) => r.status === 200 || r.code === 'KHO_BAN')
    && (await dem('kho_nguyen_lieu')) === 12 && (await dem('kho_cong_thuc')) === 8, hai.map(moTa).join(' | '));
  imLang(); const menuSau = JSON.stringify(await layMenuQuay()); noiLai();
  k('K1 menu quầy (mất SX → dự phòng) y hệt trước khi nhập: món tạo ẩn không lên quầy', menuSau === menuTruoc);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[I/E/H] đường /api/pos/kho — quyền, công thức, thiếu thông tin');
  const ds = await goiAi('staff', 'GET', '/kho/nguyen-lieu');
  k('I1 staff XEM nguyên liệu → 200 (kèm nhóm, nhà cung cấp)', ds.status === 200 && Array.isArray(ds.nguyen_lieu) && ds.nguyen_lieu.length === 12
    && Array.isArray(ds.nhom) && Array.isArray(ds.nha_cung_cap), moTa(ds));
  const nlDs = (ten) => (ds.nguyen_lieu || []).find((r) => r.ten === ten) || {};
  k('H1 "Thiếu thông tin": Cam thiếu giá / hạn / tối thiểu (null), Gừng có giá', nlDs('Cam').gia_nhap === null && nlDs('Cam').han_ngay === null
    && nlDs('Cam').ton_toi_thieu === null && Number(nlDs('Gừng').gia_nhap) > 0);
  const moiNL = { ten: 'Lá chanh', nhom_id: ds.nhom?.[0]?.id, don_vi_luu: 'kg', don_vi_hien: 'g', he_so_doi: 0.001, gia_nhap: 80000 };
  k('I2 staff thêm nguyên liệu → 403', (await goiAi('staff', 'POST', '/kho/nguyen-lieu', moiNL)).status === 403);
  const qlThem = await goiAi('manager', 'POST', '/kho/nguyen-lieu', moiNL);
  k('I3 manager thêm nguyên liệu → 200', qlThem.status === 200 && qlThem.id > 0, moTa(qlThem));
  const trung = await goiAi('manager', 'POST', '/kho/nguyen-lieu', { ...moiNL, ten: '  lá   CHANH ' });
  k('I4 thêm trùng tên (khác hoa / khoảng trắng) → 409 TEN_TRUNG', trung.status === 409 && trung.code === 'TEN_TRUNG', moTa(trung));
  const idCam = nlDs('Cam').id;
  const suaTrung = await goiAi('manager', 'PUT', `/kho/nguyen-lieu/${idCam}`, { ...nlDs('Cam'), ten: 'Lá Chanh' });
  k('I5 SỬA thành tên trùng nguyên liệu khác → 409 TEN_TRUNG', suaTrung.status === 409 && suaTrung.code === 'TEN_TRUNG', moTa(suaTrung));
  const sua = await goiAi('manager', 'PUT', `/kho/nguyen-lieu/${idCam}`, { ...nlDs('Cam'), gia_nhap: 30000, dang_dung: 0 });
  k('I6 manager sửa giá + ngừng dùng → 200, ghi đúng', sua.status === 200 && Number((await mot('SELECT gia_nhap FROM kho_nguyen_lieu WHERE id = ?', [idCam]))?.gia_nhap) === 30000
    && Number((await mot('SELECT dang_dung FROM kho_nguyen_lieu WHERE id = ?', [idCam]))?.dang_dung) === 0, moTa(sua));
  k('I7 staff sửa nguyên liệu → 403', (await goiAi('staff', 'PUT', `/kho/nguyen-lieu/${idCam}`, { ...nlDs('Cam') })).status === 403);
  const xoaDung = await goiAi('manager', 'DELETE', `/kho/nguyen-lieu/${idCam}`);
  k('I8 xoá nguyên liệu NẰM trong công thức → 409 NGUYEN_LIEU_DANG_DUNG', xoaDung.status === 409 && xoaDung.code === 'NGUYEN_LIEU_DANG_DUNG', moTa(xoaDung));
  k('I9 xoá nguyên liệu không ai dùng → 200, mất dòng', (await goiAi('manager', 'DELETE', `/kho/nguyen-lieu/${qlThem.id}`)).status === 200
    && (await so('SELECT COUNT(*) FROM kho_nguyen_lieu WHERE id = ?', [qlThem.id || 0])) === 0);
  for (const [duong, than] of [['/kho/nhom', { ten: 'Gia vị' }], ['/kho/nha-cung-cap', { ten: 'Chợ Long Biên', sdt: '0900' }]]) {
    k(`I10 staff POST ${duong} → 403`, (await goiAi('staff', 'POST', duong, than)).status === 403);
    const r = await goiAi('manager', 'POST', duong, than);
    k(`I11 manager POST ${duong} → 200; sửa PUT → 200`, r.status === 200 && (await goiAi('manager', 'PUT', `${duong}/${r.id}`, { ...than, ten: than.ten + ' 2' })).status === 200, moTa(r));
  }
  k('I12 staff xem sản phẩm & công thức → 403', (await goiAi('staff', 'GET', '/kho/san-pham')).status === 403);
  const sp = await goiAi('manager', 'GET', '/kho/san-pham');
  k('I13 manager xem sản phẩm & công thức → 200, CT1 có 4 dòng công thức', sp.status === 200
    && (sp.san_pham || []).find((s) => s.code === 'CT1')?.cong_thuc?.length === 4, moTa(sp));
  const idSP = async (code) => Number((await mot('SELECT id FROM pos_products WHERE code = ?', [code]))?.id);
  const [ct1, ct2, ct3] = [await idSP('CT1'), await idSP('CT2'), await idSP('CT3')];
  const nlId = async (ten) => Number((await mot('SELECT id FROM kho_nguyen_lieu WHERE ten = ?', [ten]))?.id);
  const congThucCT2 = { kieu: 'lam_san', cong_thuc: [{ nguyen_lieu_id: await nlId('Gừng'), luong: 0.0125 }, { thanh_phan_id: ct3, luong: 0.5 }] };
  k('I14 staff sửa công thức → 403', (await goiAi('staff', 'PUT', `/kho/san-pham/${ct2}`, congThucCT2)).status === 403);
  k('I15 manager sửa công thức → 403', (await goiAi('manager', 'PUT', `/kho/san-pham/${ct2}`, congThucCT2)).status === 403);
  const chuSua = await goiAi('chu', 'PUT', `/kho/san-pham/${ct2}`, congThucCT2);
  k('E10 chủ quán lưu công thức lồng (CT2 dùng CT3) → 200; lượng lưu số thật 0.0125', chuSua.status === 200
    && Number((await mot('SELECT luong FROM kho_cong_thuc WHERE san_pham_id = ? AND nguyen_lieu_id IS NOT NULL', [ct2]))?.luong) === 0.0125, moTa(chuSua));
  await goiAi('chu', 'PUT', `/kho/san-pham/${ct3}`, { kieu: 'lam_san', cong_thuc: [{ nguyen_lieu_id: await nlId('Táo tươi'), luong: 0.2 }] });
  const tinhN = await goiAi('staff', 'GET', `/kho/san-pham/${ct2}/trien-khai?so_phan=4`);
  k('E11 staff "Tính cho N phần" → 403', tinhN.status === 403);
  const tinh4 = await goiAi('manager', 'GET', `/kho/san-pham/${ct2}/trien-khai?so_phan=4`);
  const l4 = (ten) => (tinh4.nguyen_lieu || []).find((r) => r.ten === ten)?.luong;
  k('E12 "Tính cho 4 phần" CT2: Gừng 0.05 kg, Táo tươi 4×0.5×0.2 = 0.4 kg (lồng)', tinh4.status === 200 && gan(l4('Gừng'), 0.05) && gan(l4('Táo tươi'), 0.4), moTa(tinh4));
  const tuThan = await goiAi('chu', 'PUT', `/kho/san-pham/${ct3}`, { kieu: 'lam_san', cong_thuc: [{ thanh_phan_id: ct3, luong: 1 }] });
  k('E13 lưu vòng A→A → 400 CONG_THUC_VONG_LAP', tuThan.status === 400 && tuThan.code === 'CONG_THUC_VONG_LAP', moTa(tuThan));
  const vong = await goiAi('chu', 'PUT', `/kho/san-pham/${ct3}`, { kieu: 'lam_san', cong_thuc: [{ thanh_phan_id: ct2, luong: 1 }] });
  k('E14 lưu vòng A→B→A → 400, lời báo nêu chuỗi tên (Cam Tân Dưỡng → Lục Tân Khí → Cam Tân Dưỡng)', vong.status === 400 && vong.code === 'CONG_THUC_VONG_LAP'
    && (vong.error || '').includes('Cam Tân Dưỡng → Lục Tân Khí → Cam Tân Dưỡng'), moTa(vong));
  k('E15 lưu vòng bị chặn thì công thức cũ giữ nguyên', (await so('SELECT COUNT(*) FROM kho_cong_thuc WHERE san_pham_id = ? AND thanh_phan_id IS NULL', [ct3])) === 1);
  const kieuSai = await goiAi('chu', 'PUT', `/kho/san-pham/${ct3}`, { kieu: 'bay_mau', cong_thuc: [] });
  k('E16 kiểu lạ → 400 KIEU_SAI', kieuSai.status === 400 && kieuSai.code === 'KIEU_SAI', moTa(kieuSai));
  const ct4 = await idSP('CT4'), ct5 = await idSP('CT5');
  const cheo = await Promise.all([goiAi('chu', 'PUT', `/kho/san-pham/${ct4}`, { kieu: 'lam_san', cong_thuc: [{ thanh_phan_id: ct5, luong: 1 }] }),
    goiAi('chu', 'PUT', `/kho/san-pham/${ct5}`, { kieu: 'lam_san', cong_thuc: [{ thanh_phan_id: ct4, luong: 1 }] })]);
  const ma = cheo.map((r) => r.status).sort().join(',');
  k('E17 hai người lưu chéo cùng lúc (CT4 dùng CT5, CT5 dùng CT4) → đúng một 200, một 400 vòng', ma === '200,400' && cheo.some((r) => r.code === 'CONG_THUC_VONG_LAP'), cheo.map(moTa).join(' | '));
  const ct6 = await idSP('CT6');
  const macDinh = (sp.san_pham || []).find((s) => s.id === ct6);
  k('D2 món chưa có dòng kho_san_pham → kiểu chua_dinh_luong (mặc định)', macDinh?.kieu === 'chua_dinh_luong', JSON.stringify(macDinh));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[J] sao lưu + khôi phục');
  const xuat = await goi('GET', '/backup/export-all');
  const wb = xuat.tep ? XLSX.read(xuat.tep, { type: 'buffer' }) : { SheetNames: [] };
  const sheetKho = wb.SheetNames.filter((s) => /kho|nâng cấp/i.test(s));
  k('J1 xuất sao lưu có đủ 11 trang mới (pos_nang_cap + 10 bảng kho_*)', sheetKho.length >= 11, wb.SheetNames.join(' | '));
  const backupSrc = doc(path.join(MAY_CHU, 'routes', 'backup.js'));
  const vt = (ten) => backupSrc.indexOf(`'${ten}'`);
  k('J2 BACKUP_TABLES cha trước con: nguyên liệu → công thức; phiếu, lô → dòng phiếu', vt('kho_nguyen_lieu') > 0 && vt('kho_cong_thuc') > vt('kho_nguyen_lieu')
    && vt('kho_phieu_dong') > vt('kho_lo') && vt('kho_lo') > vt('kho_phieu') && vt('kho_san_pham') > vt('kho_nhom_cong_thuc'));
  const khoiPhuc = async () => { const f = new FormData(); f.append('file', new Blob([xuat.tep || Buffer.alloc(0)]), 'sl.xlsx'); return goi('POST', '/backup/restore', f); };
  await db.run("INSERT INTO kho_nguyen_lieu (ten, ten_chuan, don_vi_luu, tao_luc) VALUES ('Sau sao lưu', 'sau sao lưu', 'kg', 'x')").catch(() => {});
  await db.run("INSERT INTO pos_nang_cap (so, ten, luc) VALUES (999, '999_sau_sao_luu', 'x')").catch(() => {});
  const bamChiKho = async () => { const h = crypto.createHash('sha1'); for (const b of BANG_KHO) if (await coBang(b)) h.update(JSON.stringify(await db.query(`SELECT * FROM ${b} ORDER BY rowid`))); return h.digest('hex'); };
  const bamTruoc = await bamChiKho();
  const kp1 = await khoiPhuc();
  k('J3 kho ĐANG có dữ liệu: khôi phục BỎ QUA bảng kho (không đổi một dòng), báo rõ', kp1.status === 200 && (await bamChiKho()) === bamTruoc
    && (kp1.results || []).some((r) => /^kho_/.test(r.table) && r.status === 'skipped'), moTa(kp1));
  k('J4 pos_nang_cap KHÔNG BAO GIỜ khôi phục (dòng 999 thêm sau sao lưu vẫn còn)', (await so('SELECT COUNT(*) FROM pos_nang_cap WHERE so = 999')) === 1);
  const nlSL = (XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find((s) => s === 'Kho - Nguyên liệu') || '_'] || {})).length;
  for (const b of [...BANG_KHO].reverse()) if (await coBang(b)) await db.run(`DELETE FROM ${b}`);
  const kp2 = await khoiPhuc();
  k('J5 kho TRỐNG: khôi phục đủ nguyên liệu từ file', kp2.status === 200 && nlSL > 0 && (await dem('kho_nguyen_lieu')) === nlSL, `${moTa(kp2)} · file ${nlSL}`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[K] đường bán không đổi');
  const truoc = demSX.tru;
  const don = await goi('POST', '/orders', { customer_name: 'Khách KHO1', items: [{ product_id: ct1, sx_product_type: 'juice', sx_product_id: 1, quantity: 1 }],
    payment_method: 'cash', cash_amount: 25000 });
  k('K2 tạo đơn vẫn 200 và vẫn gửi lệnh trừ kho sang SX', don.success === true && demSX.tru > truoc, `${moTa(don)} · trừ SX ${demSX.tru - truoc}`);
  const fileTrong = path.join(THU_MUC, 'trong.db');
  delete require.cache[duongDB];
  const db3 = require(duongDB);
  require.cache[duongDB] = dbGoc;
  require.cache[duongKN].exports.cauHinhTurso = () => ({ laMayThu: true, cauHinh: { url: 'file:' + fileTrong } });
  imLang(); let loi3 = null; try { await db3.initDatabase(); } catch (e) { loi3 = e; } noiLai();
  k('K3 khởi động trên kho trống → tự tạo bảng kho + pos_nang_cap', !loi3 && (await db3.queryOne("SELECT COUNT(*) AS n FROM sqlite_master WHERE name LIKE 'kho_%' AND type = 'table'"))?.n >= 10
    && typeof db3.layNangCapHong === 'function' && db3.layNangCapHong() === null, loi3?.message);

  sv.close();
  console.log(`\n  ${dat} đạt · ${hong} hỏng\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai();
  console.error(`\n✖ Bài thử sập: ${e.stack || e.message}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
