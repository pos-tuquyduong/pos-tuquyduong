#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ HỢP ĐỒNG /api/kh — HOP_DONG_API_KH.md khớp code (từ KH-API-2, dùng cho MỌI việc sau đổi cửa /api/kh)
 * ═══════════════════════════════════════════════════════════════════════════
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_HOPDONG_KH.js
 *
 *  1. Đọc khối JSON giữa <!-- HOP_DONG_MAY_DOC --> và <!-- HET HOP_DONG_MAY_DOC -->.
 *  2. Gọi TỪNG cửa trên kho thử (khuôn thu_KH1.js: database.js thật, kho tạm, chỉ thay ketNoiKho) với khách mẫu có hạng + ví + điểm
 *     + đơn + mã bill: 200 và mỗi đường `tra` có mặt (`a.b` · `x[].y` = mảng KHÔNG rỗng, mọi phần tử có y). Cửa token: true gọi không token
 *     → 401 KH_TOKEN_SAI; token: false → không 401.
 *  3. Mọi `code` thấy trong mọi câu trả lời (kể cả các ca lỗi dò thêm) ∈ ma_loi.
 *  4. Quét tĩnh server/routes/kh/index.js: route không có trong hợp đồng → ĐỎ; cửa hợp đồng không có route → ĐỎ. Bắt mọi `router.<x>(`
 *     (get/post/…/all/use/route, mọi kiểu nháy); đường không phải chữ viết thẳng → ĐỎ. GIỚI HẠN: chỉ file index.js — router con gắn từ
 *     file khác (router.use('/x', require(…))) hiện thành cửa "USE /x" → ĐỎ cho tới khi hợp đồng ghi; không theo vào file con.
 *  5. Quét tĩnh mã lỗi trả ra được qua /api/kh ∈ ma_loi. GIỚI HẠN (K4 TU-CHAY-6): chỉ các nguồn liệt kê ở NGUON_MA — không theo hàm phụ
 *     khác; thêm hàm phụ trả `code` cho /api/kh thì thêm nó vào NGUON_MA.
 *  6. Phần chữ: PHIEN_BAN = phien_ban, nhật ký có dòng vN, mỗi cửa một dòng bảng, mỗi mã lỗi có trong mục Mã lỗi.
 *  routes/kh/quay.js gắn ở /api/pos/kh (cửa nhân viên) — KHÔNG thuộc hợp đồng.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_hopdong_kh_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_hopdong_nv_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_hopdong_kh_' + Date.now();
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_hopdong';
process.env.GUI_MA_KHACH = 'gia';

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const doc = (...p) => fs.readFileSync(path.join(GOC, ...p), 'utf8');
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const cat = (s, tu, den) => { const a = s.indexOf(tu); if (a < 0) return ''; const b = den ? s.indexOf(den, a + tu.length) : -1; return s.slice(a, b < 0 ? undefined : b); };
const tim = (s, re) => [...s.matchAll(re)].map((m) => m[1]);

// Nguồn mã lỗi trả ra được qua /api/kh (mục 5). [file, cắt từ, cắt tới (null = hết file), biểu thức lấy mã]
const NGUON_MA = [
  ['server/routes/kh/loi.js', 'const LOI = {', '};', /^\s+([A-Z][A-Z0-9_]+): \[/gm],
  ['server/routes/kh/loi.js', 'function loiMayChu', null, /code: '([A-Z][A-Z0-9_]+)'/g],
  ['server/routes/kh/index.js', '', null, /(?:bao\(res, |code: )'([A-Z][A-Z0-9_]+)'/g],
  ['server/middleware/khachAuth.js', '', null, /code: '([A-Z][A-Z0-9_]+)'/g],
  ['server/utils/maKhach.js', '', null, /loi: '([A-Z][A-Z0-9_]+)'/g],
  ['server/utils/pinKhach.js', 'async function datPin', 'async function', /loi\('([A-Z][A-Z0-9_]+)'\)/g],
  ['server/routes/wallets.js', 'function loiGhi', 'function ', /code: '([A-Z][A-Z0-9_]+)'/g],
  // nhan-ma-bill / nhan-diem gọi hàm quầy: từ đầu file tới route quầy đầu tiên SAU hai hàm (GET / danh sách mã — không thuộc /api/kh).
  ['server/routes/signup-codes.js', '', "router.get('/', authenticate", /code: '([A-Z][A-Z0-9_]+)'/g],
];

async function main() {
  const md = doc('HOP_DONG_API_KH.md');
  let HD = null;
  try { HD = JSON.parse(cat(md, '<!-- HOP_DONG_MAY_DOC -->', '<!-- HET HOP_DONG_MAY_DOC -->').replace(/^[\s\S]*?```json/, '').replace(/```[\s\S]*$/, '')); } catch { HD = null; }
  console.log('\nTHỬ HỢP ĐỒNG /api/kh — HOP_DONG_API_KH.md khớp code');
  k('đọc được khối HOP_DONG_MAY_DOC (JSON có phien_ban, cua[], ma_loi[])', !!HD && Number.isInteger(HD.phien_ban) && Array.isArray(HD.cua) && Array.isArray(HD.ma_loi));
  if (!HD) return ket(null);
  const MA = new Set(HD.ma_loi);
  const ten = (c) => `${c.pt} ${c.duong}`;

  // ── 6. Phần chữ ────────────────────────────────────────────────────────
  muc('[H] phần chữ khớp phần máy đọc');
  const pb = (md.match(/^PHIEN_BAN: (\d+)$/m) || [])[1];
  k(`PHIEN_BAN: ${pb} = phien_ban ${HD.phien_ban}`, Number(pb) === HD.phien_ban);
  k(`nhật ký có dòng "- v${HD.phien_ban} ·"`, new RegExp(`^- v${HD.phien_ban} ·`, 'm').test(cat(md, '## Nhật ký')));
  const bangChu = cat(md, '## Các cửa', '## Mã lỗi');
  const thieuDong = HD.cua.filter((c) => !bangChu.includes('`' + ten(c) + '`'));
  k(`mỗi cửa của khối máy đọc có một dòng trong bảng chữ (${HD.cua.length} cửa)`, thieuDong.length === 0, thieuDong.map(ten).join(', '));
  const chuMa = cat(md, '## Mã lỗi', '## Đã hẹn');
  const thieuMa = HD.ma_loi.filter((m) => !chuMa.includes('`' + m + '`'));
  k(`mỗi mã của ma_loi có trong mục chữ "Mã lỗi" (${HD.ma_loi.length} mã)`, thieuMa.length === 0, thieuMa.join(', '));
  k('không còn dòng "Lỗi đã biết (sửa ở KH-API-2)"', !md.includes('Lỗi đã biết (sửa ở KH-API-2)'));
  const dongGv = bangChu.split('\n').find((l) => l.includes('`GET /gio-vang`')) || '';
  k('cửa /gio-vang ghi rõ "không có suất"', /không có suất/i.test(dongGv), dongGv.slice(0, 80));

  // ── 4. Quét tĩnh route ───────────────────────────────────────────────────
  muc('[I4] route của server/routes/kh/index.js = cửa của hợp đồng');
  const src = boChuThich(doc('server', 'routes', 'kh', 'index.js'));
  // Mọi lời gọi router.<x>( — có đường chữ (mọi kiểu nháy) thì thành cửa (all / use / route cũng là cửa, phải có trong hợp đồng mới qua);
  // router.use(<middleware>) không đường được phép; còn lại (đường là biến…) → cửa không đọc được → ĐỎ.
  const goiRouter = [...src.matchAll(/router\.(\w+)\(\s*(?:(['"`])([^'"`]+)\2)?/g)];
  const route = new Set(goiRouter.filter((m) => m[3]).map((m) => `${m[1].toUpperCase()} ${m[3]}`));
  const khongDoc = goiRouter.filter((m) => !m[3] && !(m[1] === 'use' && /^router\.use\(\s*[A-Za-z_]\w*\s*\)/.test(src.slice(m.index))));
  k('mọi router.<x>( của kh/index.js đọc được đường (chỉ router.use(<middleware>) được không đường)', khongDoc.length === 0,
    khongDoc.map((m) => src.slice(m.index, m.index + 40)).join(' | '));
  const cua = new Set(HD.cua.map(ten));
  const la = [...route].filter((r) => !cua.has(r)), mat = [...cua].filter((c) => !route.has(c));
  k(`mọi route dưới /api/kh (${route.size}) có trong hợp đồng`, route.size > 0 && la.length === 0, la.join(', '));
  k(`mọi cửa hợp đồng có route (${cua.size})`, mat.length === 0, mat.join(', '));

  // ── 5. Quét tĩnh mã lỗi ──────────────────────────────────────────────────
  muc('[I5] mã lỗi trả ra được qua /api/kh ∈ ma_loi (nguồn: NGUON_MA)');
  for (const [f, tu, den, re] of NGUON_MA) {
    const khoi = cat(doc(f), tu, den);
    const ds = [...new Set(tim(boChuThich(khoi), re))];
    const ngoai = ds.filter((m) => !MA.has(m));
    k(`${f}${tu ? ` (${tu.slice(0, 28)}…)` : ''}: ${ds.length} mã đều trong ma_loi`, ds.length > 0 && ngoai.length === 0, ngoai.join(', ') || 'không thấy mã nào — nguồn đổi chỗ?');
  }

  // ── 2–3. Gọi thật ───────────────────────────────────────────────────────
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();
  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const guiMa = require(path.join(GOC, 'server', 'utils', 'guiMaKhach.js'));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  const maThay = [];   // mọi `code` thấy trong câu trả lời /api/kh
  const goi = async (method, url, body, tk) => {
    const headers = body !== undefined ? { 'Content-Type': 'application/json' } : {};
    if (tk) headers.Authorization = 'Bearer ' + tk;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      if (url.startsWith('/kh') && j.code) maThay.push(`${j.code} (${method} ${url})`);
      return { status: r.status, j, tho };
    } finally { noiLai(); }
  };
  const datCaiDat = (key, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
  for (const [a, b] of [['signup_enabled', '1'], ['signup_discount_type', 'percent'], ['signup_discount_value', '10'], ['nhandiem_enabled', '1'],
    ['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['flash_enabled', 'false']]) await datCaiDat(a, b);
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 50000 WHERE id = ?', [sp.id]);
  const don = async (sdt) => (await goi('POST', '/pos/orders', { items: [{ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: 1 }],
    payment_method: 'cash', cash_amount: 50000, ...(sdt ? { customer_phone: sdt, customer_name: 'Khách mẫu' } : {}) }, tkChu)).j.order || {};

  // Khách mẫu: đăng nhập thật qua hai cửa đầu (lấy ở vòng gọi), rồi có hạng + ví + điểm + đơn + mã bill.
  const SDT = '0936123456';
  let tk = null, maBill = null, maDiem = null, maDon = null;
  const THAN = {
    'POST /dang-nhap/xin-ma': () => ({ sdt: SDT }),
    'POST /dang-nhap/xac-minh': () => ({ sdt: SDT, ma: guiMa.layMaGiaCuoi()?.ma, ten: 'Khách mẫu' }),
    'PUT /toi': () => ({ ten: 'Khách mẫu' }),
    'POST /nhan-ma-bill': () => ({ ma: maBill }),
    'POST /nhan-diem': () => ({ ma: maDiem }),
    'PUT /pin': () => ({ pin: '1234', pin_lai: '1234' }),
  };
  const coDuong = (o, phan) => {
    if (!phan.length) return true;
    const [dau, ...con] = phan;
    if (o === null || typeof o !== 'object') return false;
    if (dau.endsWith('[]')) { const a = o[dau.slice(0, -2)]; return Array.isArray(a) && a.length > 0 && a.every((x) => coDuong(x, con)); }
    return dau in o && (!con.length || coDuong(o[dau], con));
  };
  const chuanBi = async () => {
    maDon = (await don(SDT)).code;   // đơn TRƯỚC khi có hạng: tiền gửi = giá gốc
    const hang = Number((await db.run("INSERT INTO pos_membership_tiers (name, card_price, discount_percent, special_discount_percent, sort_order, is_active) VALUES ('Mẫu', 1000, 10, 5, 9, 1)")).lastInsertRowid);
    await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
      VALUES (?, ?, 'Mẫu', 1000, NULL, ?, datetime('now', '+7 hours', '+300 days'))`, [SDT, hang, getNow()]);
    await db.run('INSERT INTO pos_wallets (phone, balance) VALUES (?, 80000)', [SDT]);
    maBill = (await don()).signup_code;
    maDiem = (await don()).signup_code;
  };

  muc('[I2] gọi TỪNG cửa: 200 + đủ trường `tra`; token: true thiếu token → 401 KH_TOKEN_SAI');
  for (const c of HD.cua) {
    if (c.token && !tk) { k('khách mẫu đăng nhập được qua hai cửa đăng nhập (có token)', false); break; }
    const url = '/kh' + c.duong.replace(':ma', encodeURIComponent(maDon || 'x'));
    const than = THAN[ten(c)] ? THAN[ten(c)]() : undefined;
    const r = await goi(c.pt, url, than, c.token ? tk : null);
    const thieu = (c.tra || []).filter((d) => !coDuong(r.j, d.split('.')));
    k(`${ten(c)} → 200, đủ ${(c.tra || []).length} trường`, r.status === 200 && r.j.success === true && thieu.length === 0,
      `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}${thieu.length ? ' · thiếu ' + thieu.join(', ') : ''}`);
    if (ten(c) === 'POST /dang-nhap/xac-minh') { tk = r.j.token || null; if (tk) await chuanBi(); }
    const kt = await goi(c.pt, url, than);
    k(`${ten(c)} không token → ${c.token ? '401 KH_TOKEN_SAI' : 'không 401'}`, c.token ? kt.status === 401 && kt.j.code === 'KH_TOKEN_SAI' : kt.status !== 401, `HTTP ${kt.status}`);
  }

  muc('[I3] mọi `code` trả về (kể cả các ca lỗi dò thêm) ∈ ma_loi');
  for (const [pt, url, than] of [['POST', '/kh/dang-nhap/xin-ma', { sdt: 'abc' }], ['POST', '/kh/dang-nhap/xac-minh', { sdt: SDT, ma: '000000' }],
    ['GET', '/kh/don/KHONG-CO'], ['POST', '/kh/nhan-ma-bill', { ma: 'KHONGCO1' }], ['POST', '/kh/nhan-diem', { ma: '' }], ['POST', '/kh/nhan-ma-bill', { ma: maBill }],
    ['PUT', '/kh/pin', { pin: '12', pin_lai: '12' }], ['PUT', '/kh/toi', { ten: '' }], ['GET', '/kh/khong-co-duong']]) await goi(pt, url, than, tk);
  const ngoai = maThay.filter((m) => !MA.has(m.split(' ')[0]));
  k(`${maThay.length} mã thấy trong câu trả lời đều thuộc ma_loi`, maThay.length >= 8 && ngoai.length === 0, ngoai.join(' | '));
  sv.close();
  return ket();
}

function ket() {
  console.log(`\n  ${C.dam}${dat} đạt · ${hong} hỏng${C.het}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai();
  console.error(`\n${C.do}✖ Bài thử sập: ${e.message}${C.het}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
