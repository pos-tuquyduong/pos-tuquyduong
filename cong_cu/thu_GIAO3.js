#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ GIAO-3 — Ahamove sau lượt thử 16–18.11: lý do giao thất bại, hàng trả về quán, phí không về 0, Đối soát không treo,
 *  "Thực thu" do máy chủ tính, hộp lý do thay window.prompt
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ ở A1, B2, B3, C1, D3, E4, G2.   Chạy ở GỐC kho POS:   node cong_cu/thu_GIAO3.js
 *
 *  Khuôn thu_GIAO2.js: database.js + libsql thật trên kho TẠM (chỉ thay ketNoiKho — P8); Ahamove là máy chủ GIẢ trong tiến trình
 *  (AHAMOVE_BASE_URL), khoá thử sinh ngẫu nhiên. Màn thật (DoiSoat.jsx, GiaoHang/index.jsx, Reports.jsx) gói bằng esbuild cùng utils/api.js THẬT,
 *  React thay bằng bộ chạy hook tối giản (khuôn khungManHinh của thu_VOUCHER2.js — kho không có jsdom). setTimeout ≥ 30 s được rút còn 300 ms
 *  để thử hạn chờ Đối soát mà không đợi thật.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const SRC = path.join(GOC, 'client', 'src');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_giao3_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_giao3_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_giao3_kh_' + ngauNhien();
const BI_MAT = { api: 'ahk_' + ngauNhien(), bao: 'ahb_' + ngauNhien(), token: 'aht_' + ngauNhien() };
const SDT_AHA = '0900000003';
process.env.AHAMOVE_API_KEY = BI_MAT.api;
process.env.AHAMOVE_SDT = SDT_AHA;
process.env.AHAMOVE_KHOA_BAO = BI_MAT.bao;
delete process.env.AHAMOVE_DIA_CHI_URL;
delete process.env.AHAMOVE_DIA_CHI_KHOA;

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
const ra = (s) => process.stdout.write(s + '\n');
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; ra(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; ra(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => ra(`\n${C.dam}${t}${C.het}`);
const nhatKy = [];
console.log = console.error = console.warn = console.info = (...a) => nhatKy.push(a.map(String).join(' '));
const J = (x) => String(JSON.stringify(x) ?? 'undefined');
const ngu = (ms) => new Promise((ok) => setTimeout(ok, ms));
const setTimeoutGoc = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...a) => setTimeoutGoc(fn, ms >= 30000 ? 300 : ms, ...a);   // hạn chờ dài (≥ 30 s) → 300 ms

// ─── Ahamove GIẢ ─────────────────────────────────────────────────────────
const A = { chuyen: new Map(), so: 0, doc: 0, phi: 16000, phiTao: null, phiBao: null };
function dungAhamoveGia(express) {
  const g = express();
  g.use(express.json());
  const coToken = (req) => req.headers.authorization === 'Bearer ' + BI_MAT.token;
  g.post('/v3/accounts/token', (req, res) => (req.body.api_key === BI_MAT.api ? res.json({ token: BI_MAT.token }) : res.status(401).json({})));
  g.post('/v3/orders/estimates', (req, res) => res.json([{ _id: req.body.services?.[0]?._id, data: { distance: 3, total_price: A.phiBao ?? A.phi } }]));
  g.post('/v3/orders', (req, res) => {
    if (!coToken(req)) return res.status(401).json({});
    const id = 'G3AHA' + (++A.so);
    const phi = A.phiTao ?? A.phi;
    A.chuyen.set(id, { _id: id, status: 'ASSIGNING', tracking_number: req.body.path?.[1]?.tracking_number, total_price: phi, path: req.body.path });
    res.json({ order_id: id, status: 'ASSIGNING', order: { total_price: phi } });
  });
  g.get('/v3/orders/tracks/:tn', (req, res) => res.status(404).json({}));
  g.get('/v3/orders/:id', (req, res) => {
    A.doc++;
    const o = A.chuyen.get(req.params.id);
    return o ? res.json(o) : res.status(404).json({});
  });
  g.delete('/v3/orders/:id', (req, res) => {
    const o = A.chuyen.get(req.params.id);
    if (!o) return res.status(400).json({});
    Object.assign(o, { status: 'CANCELLED', cancel_by_user: true, cancel_fee: 0 });
    res.json({ success: true });
  });
  return g;
}
const datAha = (id, them) => Object.assign(A.chuyen.get(id), them);
const TX = { supplier_name: 'TX Ba Mot', supplier_id: '0977003301', supplier_plate: '29B3-33301' };
const diemDen = (them) => [{ address: 'Quán' }, { address: 'Khách', ...them }];

// ─── Khung chạy màn hình thật (rút gọn từ thu_VOUCHER2.js khungManHinh) ───
function khungManHinh(cong) {
  const esbuild = require(path.join(GOC, 'client', 'node_modules', 'esbuild'));
  const FRAG = Symbol.for('g3.frag');
  let hien = null, hen = () => {};
  const khac = (a, b) => !a || !b || a.length !== b.length || a.some((x, i) => !Object.is(x, b[i]));
  const slot = (dau) => { const i = hien.i++; if (!(i in hien.s)) hien.s[i] = dau(); return hien.s[i]; };
  const tao = (type, props, key) => ({ type, props: props || {}, key });
  const R = {
    Fragment: FRAG, jsx: tao, jsxs: tao,
    createElement: (type, cfg, ...con) => tao(type, { ...(cfg || {}), ...(con.length ? { children: con.length === 1 ? con[0] : con } : {}) }, cfg?.key),
    useState(dau) {
      const s = slot(() => ({ v: typeof dau === 'function' ? dau() : dau }));
      s.set = s.set || ((x) => { const v = typeof x === 'function' ? x(s.v) : x; if (!Object.is(v, s.v)) { s.v = v; hen(); } });
      return [s.v, s.set];
    },
    useRef: (dau) => slot(() => ({ current: dau })),
    useMemo(fn, deps) { const s = slot(() => ({})); if (!('v' in s) || khac(s.deps, deps)) { s.v = fn(); s.deps = deps; } return s.v; },
    useCallback: (fn, deps) => R.useMemo(() => fn, deps),
    useEffect(fn, deps) { const s = slot(() => ({})); if (!s.da || khac(s.deps, deps)) { s.da = true; s.deps = deps; s.fn = fn; hien.fx.push(s); } },
  };
  R.default = R;
  globalThis.__G3_REACT = R;
  globalThis.__G3_BAO = [];
  const VO = { AuthContext: 'module.exports = { useAuth: () => ({ hasPermission: () => true, user: { role: "owner", username: "chu" } }) };',
    thongBaoKho: 'const b = (k) => (...a) => { globalThis.__G3_BAO.push([k, a.map((x) => (x && x.message) || String(x)).join(" · ")]); };'
      + ' module.exports = { baoXong: b("xong"), baoLoi: b("loi"), baoLoiTu: b("loi"), lyDoLoi: (e) => (e && e.message) || "", dangKy: () => () => {}, laySnapshot: () => [], bo: () => {} };' };
  // Vỏ gói ngoài: đúng các tên file nhập (đọc từ câu import) — esbuild chép thuộc tính module CommonJS, không đọc được Proxy (thu_VOUCHER2.js).
  const tenNhap = (file, goi) => {
    const e = goi.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), ds = new Set();
    for (const m of fs.readFileSync(file, 'utf8').matchAll(new RegExp(`import\\s+([^;]*?)\\s+from\\s+['"]${e}['"]`, 'g'))) {
      const nhom = m[1].match(/\{([^}]*)\}/);
      if (nhom) nhom[1].split(',').map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean).forEach((x) => ds.add(x));
    }
    return [...ds];
  };
  const GOI_RONG = (ten) => 'const vo = () => null; const ham = (k) => k === "useSearchParams" ? () => [new URLSearchParams(), () => {}] : k.startsWith("use") ? () => () => {} : vo;'
    + ` module.exports = { __esModule: true, default: vo, ${ten.map((t) => `${JSON.stringify(t)}: ham(${JSON.stringify(t)})`).join(', ')} };`;
  const vo = { name: 'g3', setup(b) {
    b.onResolve({ filter: /\.(css|png|jpe?g|svg|gif|webp)$/ }, () => ({ path: 'css', namespace: 'g3' }));
    b.onResolve({ filter: /^react(\/jsx-runtime|\/jsx-dev-runtime)?$/ }, () => ({ path: 'react', namespace: 'g3' }));
    b.onResolve({ filter: /(AuthContext|thongBaoKho(\.js)?)$/ }, (a) => ({ path: Object.keys(VO).find((x) => a.path.includes(x)), namespace: 'g3' }));
    b.onResolve({ filter: /^[^./]/ }, (a) => ({ path: 'goi:' + tenNhap(a.importer, a.path).join(','), namespace: 'g3' }));
    b.onLoad({ filter: /.*/, namespace: 'g3' }, (a) => ({ loader: 'js', contents: a.path === 'css' ? '' : a.path === 'react' ? 'module.exports = globalThis.__G3_REACT;'
      : a.path.startsWith('goi:') ? GOI_RONG(a.path.slice(4).split(',').filter(Boolean)) : VO[a.path] }));
  } };
  const fetchGoc = globalThis.fetch;
  globalThis.fetch = (u, o) => fetchGoc(typeof u === 'string' && u.startsWith('/') ? `http://127.0.0.1:${cong}${u}` : u, o);
  globalThis.window = { innerWidth: 1400, addEventListener() {}, removeEventListener() {}, location: { pathname: '/', href: '' }, URL };
  let token = '';
  globalThis.localStorage = { getItem: (key) => (key === 'pos_token' ? token : null), setItem() {}, removeItem() {} };
  const nap = async (rel, tk) => {
    token = tk;
    const kq = await esbuild.build({ entryPoints: [path.join(SRC, ...rel)], bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic',
      keepNames: true, logLevel: 'silent', define: { 'import.meta.env': '{}' }, plugins: [vo] });
    const m = { exports: {} };
    new Function('module', 'exports', 'require', kq.outputFiles[0].text)(m, m.exports, require);
    return m.exports.default;
  };
  const dung = (Goc) => {
    const ds = new Map();
    let cay = null, dangVe = false, lai = false;
    const veNut = (el, duong, gap) => {
      if (el == null || typeof el === 'boolean') return [];
      if (Array.isArray(el)) return el.flatMap((c, i) => veNut(c, `${duong}.${c?.key ?? i}`, gap));
      if (typeof el !== 'object') return [String(el)];
      const { type, props: p } = el;
      if (type === FRAG) return veNut(p.children, duong + '~', gap);
      if (typeof type === 'function') {
        const kh = `${duong}/${type.name}`;
        if (!ds.has(kh)) ds.set(kh, { s: [], fx: [] });
        const x = ds.get(kh); gap.add(kh);
        const truoc = hien; hien = x; x.i = 0;
        let r; try { r = type(p); } finally { hien = truoc; }
        return [{ type, props: p, con: veNut(r, kh, gap) }];
      }
      return [{ type, props: p, con: veNut(p.children, `${duong}>${type}`, gap) }];
    };
    const ve = () => {
      dangVe = true;
      try {
        for (let n = 0; n < 60; n++) {
          lai = false;
          const gap = new Set();
          cay = veNut(tao(Goc, {}), '', gap)[0];
          for (const [kh, x] of ds) {
            const fx = x.fx; x.fx = [];
            if (!gap.has(kh)) { ds.delete(kh); continue; }
            for (const s of fx) { if (s.don) s.don(); const d = s.fn(); s.don = typeof d === 'function' ? d : null; }
          }
          if (!lai) break;
        }
      } finally { dangVe = false; }
    };
    hen = () => { lai = true; if (!dangVe) queueMicrotask(() => { if (lai && !dangVe) ve(); }); };
    ve();
    const tat = (n, kq = []) => { if (n && typeof n === 'object') { kq.push(n); n.con.forEach((c) => tat(c, kq)); } return kq; };
    const chu = (n) => (typeof n === 'string' ? n : n ? n.con.map(chu).join('') : '');
    return {
      chu, tat: () => tat(cay), tim: (dk) => tat(cay).filter(dk), toan: () => chu(cay),
      nut: (ten) => tat(cay).find((n) => n.type === 'button' && chu(n).trim() === ten),
      doi: async (dk, ms = 4000) => { const het = Date.now() + ms; while (Date.now() < het) { if (dk()) return true; await ngu(25); } return !!dk(); },
    };
  };
  const ev = (them = {}) => ({ preventDefault() {}, stopPropagation() {}, key: '', ...them, target: { value: '', ...(them.target || {}) } });
  return { nap, dung, ev, bao: () => globalThis.__G3_BAO };
}

async function main() {
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow, getToday, addDaysToDateString } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();
  await require('./gia_lap/monThu').dungMonThu(db);   // KHO-3a (Câu 1): món thử có công thức + lô — bán trừ kho POS
  const svAha = await new Promise((ok) => { const s = dungAhamoveGia(express).listen(0, '127.0.0.1', () => ok(s)); });
  process.env.AHAMOVE_BASE_URL = `http://127.0.0.1:${svAha.address().port}`;
  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const T = { treo: false, loi503: false };
  const app = express();
  app.use(express.json());
  app.use('/api/pos/reports/doi-soat', (req, res, next) => (T.treo ? undefined : T.loi503
    ? res.status(503).json({ error: db.LOI_KHO.doc, code: 'KHO_MAT_KET_NOI' }) : next()));
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/reports', require(R('reports.js')));
  const gh = require(R('giao-hang.js'));
  app.use('/api/pos/giao-hang', gh);
  app.use('/api/giao-hang/ahamove-bao', gh.webhook);
  const giaoHang = require(path.join(GOC, 'server', 'utils', 'giaoHang.js'));
  const choNen = async () => { if (typeof giaoHang.choTinBao === 'function') await giaoHang.choTinBao().catch(() => {}); };
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const cong = sv.address().port;
  const goc = `http://127.0.0.1:${cong}/api`;

  const owner = (await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1")).id;
  const tk = jwt.sign({ userId: owner }, KHOA_NV, { expiresIn: '1h' });
  const datCaiDat = (key, value) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(value), getNow()]);
  for (const [a, b] of [['loyalty_enabled', 'false'], ['flash_enabled', 'false'], ['signup_enabled', '0'], ['thanh_toan_payos_bat_buoc', '0'],
    ['giao_diem_lay', J({ dia_chi: 'Quán thử, Hà Nội', lat: 21.02, lng: 105.82 })]]) await datCaiDat(a, b);
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 30000, ton_gan_nhat = NULL WHERE id = ?', [sp.id]);
  const mon = { product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: 1 };
  const SDT_KHACH = '0911000003';
  await db.run("INSERT INTO pos_customers (phone, name) VALUES (?, 'Khách Giao 3')", [SDT_KHACH]).catch(() => {});
  await db.run('INSERT INTO pos_wallets (phone, balance) VALUES (?, 10000000)', [SDT_KHACH]);

  const goi = async (method, url, body, them = {}) => {
    const headers = { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...them.headers };
    if (!them.congKhai) headers.Authorization = 'Bearer ' + tk;
    const r = await fetch(goc + (them.congKhai ? '' : '/pos') + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    const tho = await r.text();
    let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
    return { status: r.status, j };
  };
  const baoVe = async (ma) => { const r = await goi('POST', '/giao-hang/ahamove-bao', { _id: ma }, { congKhai: true, headers: { apikey: BI_MAT.bao } }); await choNen(); return r; };
  const chuyenCua = (orderId) => db.queryOne('SELECT * FROM pos_giao_chuyen WHERE order_id = ?', [orderId]);
  const luiDoc = (orderId) => db.run('UPDATE pos_giao_chuyen SET doc_luc = ? WHERE order_id = ?',
    [new Date(Date.parse(getNow() + 'Z') - 6000).toISOString().slice(0, 19), orderId]);
  const danhSach = async (docLai) => (await goi('GET', '/giao-hang' + (docLai ? '?doc_lai=1' : ''))).j.chuyen || [];
  /** Đơn giao trả đủ tiền mặt (+ gọi xe nếu `goiXe`) → { id, x: mã chuyến }. */
  async function moChuyen(goiXe = true) {
    const b = await goi('POST', '/giao-hang/bao-phi', { dia_chi: 'Số 3 Ngõ Thử, Hà Nội' });
    const tinh = await goi('POST', '/orders/tinh-thu', { customer_phone: SDT_KHACH, customer_name: 'Khách Giao 3', items: [mon], giao: { ma_bao_phi: b.j.ma_bao_phi } });
    // Ghép main (BO-MAN-CU-1): đường thẳng POST /orders chỉ nhận tiền mặt — đơn giao thử trả đủ TIỀN MẶT (việc này không xét cách trả).
    const tong = Number(tinh.j.total || 0);
    const r = await goi('POST', '/orders', { customer_phone: SDT_KHACH, customer_name: 'Khách Giao 3', items: [mon], payment_method: 'cash',
      cash_amount: tong, cash_received: tong, giao: { ma_bao_phi: b.j.ma_bao_phi, ten: 'Chị Nhận Ba', sdt: '0988000333', ghi_chu: '' } });
    const id = r.j.order?.id;
    if (goiXe) await goi('POST', `/giao-hang/${id}/goi-xe`, {});
    return { id, x: (await chuyenCua(id))?.ma_ahamove };
  }
  /** Chuyến đang giao (tài xế đã lấy hàng). */
  async function dangGiao() {
    const v = await moChuyen();
    datAha(v.x, { status: 'IN PROCESS', ...TX });
    await baoVe(v.x);
    return v;
  }

  // ═══ A · lý do giao thất bại ═══════════════════════════════════════════
  muc('[A] Lý do giao thất bại (D4-GHICHU phần 1)');
  const LY_DO = 'Người nhận đặt hàng sai địa chỉ';
  const vA = await dangGiao();
  k('nền: chuyến lên dang_giao', (await chuyenCua(vA.id))?.trang_thai === 'dang_giao', (await chuyenCua(vA.id))?.trang_thai);
  datAha(vA.x, { status: 'COMPLETED', path: diemDen({ status: 'FAILED', fail_comment: LY_DO }) });
  await baoVe(vA.x);
  let cA = await chuyenCua(vA.id);
  const theA = (await danhSach()).find((x) => x.order_id === vA.id);
  k('A1 COMPLETED + điểm giao FAILED có fail_comment → giao_loi, thẻ "Giao không thành công: <lý do Ahamove>" (kho + danh sách)', cA?.trang_thai === 'giao_loi'
    && cA?.loi === 'Giao không thành công: ' + LY_DO && theA?.loi === cA?.loi, `${cA?.trang_thai} · ${cA?.loi} · ${theA?.loi}`);
  const vA2 = await dangGiao();
  datAha(vA2.x, { status: 'COMPLETED', path: diemDen({ status: 'FAILED' }) });
  await baoVe(vA2.x);
  k('A1 không có lý do → "Giao không thành công" như cũ', (await chuyenCua(vA2.id))?.loi === 'Giao không thành công', (await chuyenCua(vA2.id))?.loi);
  const vA3 = await dangGiao();
  const dai = '<b>x</b>' + 'Đ'.repeat(300);
  datAha(vA3.x, { status: 'COMPLETED', path: diemDen({ status: 'FAILED', fail_comment: dai }) });
  await baoVe(vA3.x);
  const loiA3 = (await chuyenCua(vA3.id))?.loi || '';
  k('A1 lý do dài → cắt ≤ 200 ký tự, giữ nguyên dạng chữ (không đổi < >, React hiện chữ thường)', loiA3 === 'Giao không thành công: ' + dai.slice(0, 200), `${loiA3.length} ký tự`);

  // ═══ B · hàng trả về quán ═════════════════════════════════════════════
  muc('[B] Hàng trả về quán (D4-GHICHU phần 2)');
  const donA0 = await db.queryOne('SELECT status, payment_status, total FROM pos_orders WHERE id = ?', [vA.id]);
  const vi0 = await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [SDT_KHACH]);
  datAha(vA.x, { sub_status: 'IN_RETURN' });
  await baoVe(vA.x);
  cA = await chuyenCua(vA.id);
  k('B2 tin IN_RETURN (cùng COMPLETED, cùng điểm FAILED, cùng tài xế) → được áp: tra_hang dang_tra, vẫn giao_loi', cA?.tra_hang === 'dang_tra' && cA?.trang_thai === 'giao_loi',
    `${cA?.tra_hang} ${cA?.trang_thai} · ${J(nhatKy.filter((l) => l.includes(vA.x)).slice(-1))}`);
  datAha(vA.x, { sub_status: 'RETURNED', path: diemDen({ status: 'FAILED', fail_comment: LY_DO, return_time: 1763457820 }) });   // 2025-11-18 16:23:40 giờ VN
  await baoVe(vA.x);
  cA = await chuyenCua(vA.id);
  k('B1/B2 tin RETURNED → "Hàng đã về quán" (tra_hang da_ve) + giờ = return_time đổi sang giờ VN; vẫn giao_loi; lý do giữ (A2)', cA?.tra_hang === 'da_ve'
    && cA?.tra_hang_luc === '2025-11-18T16:23:40' && cA?.trang_thai === 'giao_loi' && cA?.loi === 'Giao không thành công: ' + LY_DO, J([cA?.tra_hang, cA?.tra_hang_luc, cA?.loi]));
  const tinLap = nhatKy.length;
  await baoVe(vA.x);
  k('B2 tin RETURNED lặp (cùng sub_status) → "bỏ qua: tin lặp"', nhatKy.slice(tinLap).some((l) => l.startsWith(`[GIAO] tin ${vA.x} COMPLETED → bỏ qua: tin lặp`)), J(nhatKy.slice(tinLap)));
  const donA1 = await db.queryOne('SELECT status, payment_status, total FROM pos_orders WHERE id = ?', [vA.id]);
  const vi1 = await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [SDT_KHACH]);
  datAha(vA.x, { sub_status: 'IN_RETURN', supplier_id: '0977003399' });   // tin trễ (khoá chống lặp khác: tài xế khác) → câu ghi một chiều phải chặn
  await baoVe(vA.x);
  const cLui = await chuyenCua(vA.id);
  k('B1 một chiều: thẻ đã về quán, tin IN_RETURN tới trễ → VẪN "đã về quán", giữ giờ', cLui?.tra_hang === 'da_ve' && cLui?.tra_hang_luc === '2025-11-18T16:23:40',
    J([cLui?.tra_hang, cLui?.tra_hang_luc]));
  datAha(vA.x, { sub_status: 'RETURNED', supplier_id: TX.supplier_id });
  k('B1 trả hàng KHÔNG đụng đơn / ví (luật 02.11)', J(donA0) === J(donA1) && J(vi0) === J(vi1), `${J(donA0)} → ${J(donA1)} · ${J(vi0)} → ${J(vi1)}`);
  const theB = (await danhSach()).find((x) => x.order_id === vA.id);
  k('B1 danh sách màn trả tra_hang + tra_hang_luc; nút Đóng thẻ còn (trạng thái giao_loi)', theB?.tra_hang === 'da_ve' && theB?.tra_hang_luc === '2025-11-18T16:23:40'
    && theB?.trang_thai === 'giao_loi', J(theB && { t: theB.trang_thai, h: theB.tra_hang, l: theB.tra_hang_luc }));

  // B3: tin RETURNED bị lỡ → Tải lại đọc thẻ giao_loi chưa về quán
  datAha(vA2.x, { sub_status: 'RETURNED' });
  await luiDoc(vA2.id);
  const truocB3 = getNow().slice(0, 16);
  await danhSach(true);
  const c3 = await chuyenCua(vA2.id);
  k('B3 tin RETURNED lỡ → "Tải lại" đọc lại thẻ giao_loi → da_ve; không return_time → giờ POS biết', c3?.tra_hang === 'da_ve'
    && String(c3?.tra_hang_luc || '').slice(0, 16) >= truocB3, J([c3?.tra_hang, c3?.tra_hang_luc]));
  await db.run('UPDATE pos_giao_chuyen SET doc_luc = ?', [getNow()]);
  await luiDoc(vA2.id); await luiDoc(vA.id);
  const vDong = await dangGiao();
  datAha(vDong.x, { status: 'COMPLETED', path: diemDen({ status: 'FAILED' }) });
  await baoVe(vDong.x);
  await goi('POST', `/giao-hang/${vDong.id}/dong-the`, { ly_do: 'Đã gọi khách' });
  datAha(vDong.x, { sub_status: 'RETURNED' });
  await luiDoc(vDong.id);
  const d0 = A.doc;
  await danhSach(true);
  k('B3 thẻ đã về quán / đã đóng → KHÔNG gọi Ahamove nữa', A.doc === d0 && (await chuyenCua(vDong.id))?.tra_hang == null, `đọc thêm ${A.doc - d0}`);
  const vLo = await dangGiao();
  datAha(vLo.x, { status: 'COMPLETED', sub_status: 'RETURNED', path: diemDen({ status: 'FAILED', fail_comment: 'Sai số nhà', return_time: 1763457820 }) });
  await baoVe(vLo.x);
  const cLo = await chuyenCua(vLo.id);
  k('B1 (đường UPDATE chính) tin FAILED + RETURNED cùng lỡ, thẻ dang_giao đọc thẳng → giao_loi + lý do + "đã về quán" + giờ ngay một lần', cLo?.trang_thai === 'giao_loi'
    && cLo?.loi === 'Giao không thành công: Sai số nhà' && cLo?.tra_hang === 'da_ve' && cLo?.tra_hang_luc === '2025-11-18T16:23:40', J([cLo?.trang_thai, cLo?.loi, cLo?.tra_hang, cLo?.tra_hang_luc]));
  const vXong = await dangGiao();
  datAha(vXong.x, { status: 'COMPLETED', path: diemDen({ status: 'COMPLETED' }) });
  await baoVe(vXong.x);
  const cX = await chuyenCua(vXong.id);
  const vLa = await dangGiao();
  datAha(vLa.x, { status: 'COMPLETED', sub_status: 'constructor', path: diemDen({ status: 'FAILED' }) });
  await baoVe(vLa.x);
  const cLa = await chuyenCua(vLa.id);
  k('B4 sub_status lạ ("constructor" — tên thuộc tính sẵn có của object) → bỏ qua: thẻ vẫn lên giao_loi, không dòng trả hàng', cLa?.trang_thai === 'giao_loi'
    && cLa?.tra_hang == null, J([cLa?.trang_thai, cLa?.tra_hang]));
  k('B4 giao xong (COMPLETED + COMPLETED) vẫn xong, không dòng trả hàng, loi trống', cX?.trang_thai === 'xong' && cX?.tra_hang == null && cX?.loi == null, J([cX?.trang_thai, cX?.tra_hang, cX?.loi]));
  const vH = await dangGiao();
  datAha(vH.x, { status: 'CANCELLED', cancel_by_user: false, cancel_comment: 'Khách không nghe máy' });
  await baoVe(vH.x);
  const vH2 = await dangGiao();
  datAha(vH2.x, { status: 'CANCELLED', cancel_by_user: false });
  await baoVe(vH2.x);
  const CAU_HUY = 'Ahamove huỷ chuyến khi tài xế đã lấy hàng — gọi tài xế / Ahamove';
  await db.run('UPDATE pos_giao_chuyen SET doc_luc = ?', [getNow()]);
  await luiDoc(vH.id); await luiDoc(vH2.id);
  const dH = A.doc;
  await danhSach(true);
  k('B3 thẻ giao_loi do Ahamove HUỶ khi đang giao (không bao giờ có RETURNED) → KHÔNG đọc lại theo nhịp', A.doc === dH, `đọc thêm ${A.doc - dH}`);
  k('A3 huỷ khi đang giao: có cancel_comment → "<câu cũ>: <comment>"; không có → câu cũ', (await chuyenCua(vH.id))?.loi === CAU_HUY + ': Khách không nghe máy'
    && (await chuyenCua(vH2.id))?.loi === CAU_HUY, J([(await chuyenCua(vH.id))?.loi, (await chuyenCua(vH2.id))?.loi]));

  // ═══ C · phí Ahamove không về 0 ═══════════════════════════════════════
  muc('[C] Phí Ahamove không về 0 (D-PHI-1)');
  const vC = await moChuyen();
  const cC0 = await chuyenCua(vC.id);
  const nC = nhatKy.length;
  datAha(vC.x, { status: 'ACCEPTED', total_price: 0, ...TX });
  await baoVe(vC.x);
  const cC1 = await chuyenCua(vC.id);
  k('C1 phí lúc gọi 16.000 → tin ACCEPTED total_price 0 → phi_that GIỮ 16.000, chenh giữ (không "quán dư")', cC0?.phi_that === 16000 && cC1?.phi_that === 16000
    && cC1?.chenh === cC0?.chenh && cC1?.trang_thai === 'doi_tai_xe', J([cC0?.phi_that, cC0?.chenh, cC1?.phi_that, cC1?.chenh, cC1?.trang_thai]));
  const logPhi = nhatKy.slice(nC).filter((l) => l.startsWith(`[GIAO] phi ${vC.x} `));
  k('C3 log MỘT dòng "[GIAO] phi <mã> total_price=0 …" — không SĐT tài xế / khách, không tên', logPhi.length === 1 && logPhi[0].includes('total_price=0')
    && !/0977003301|0988000333|TX Ba|Chị Nhận/.test(logPhi.join(' ')), J(logPhi));
  for (const x of ['', 'abc', null]) {
    datAha(vC.x, { total_price: x, supplier_id: '09770033' + String(10 + ['', 'abc', null].indexOf(x)) });   // đổi tài xế: tin mới (không bị chống lặp)
    await baoVe(vC.x);
  }
  k('C1 phí rỗng / chữ / null → phi_that vẫn 16.000', (await chuyenCua(vC.id))?.phi_that === 16000, String((await chuyenCua(vC.id))?.phi_that));
  datAha(vC.x, { total_price: 21000, supplier_id: '0977003320' });
  await baoVe(vC.x);
  const cC2 = await chuyenCua(vC.id);
  k('C2 phí MỚI 21.000 (phụ phí) → cập nhật, chenh = 21.000 − phí khách', cC2?.phi_that === 21000 && cC2?.chenh === 21000 - cC2?.phi_khach, J([cC2?.phi_that, cC2?.chenh, cC2?.phi_khach]));
  A.phiTao = 0;
  const vT = await moChuyen();
  A.phiTao = null;
  k('C3 (K4) tạo chuyến Ahamove trả total_price 0 → phi_that = phí báo 16.000 (không 0)', (await chuyenCua(vT.id))?.phi_that === 16000, String((await chuyenCua(vT.id))?.phi_that));
  A.phiBao = 0; A.phiTao = 0;
  const vT0 = await moChuyen(false);
  await goi('POST', `/giao-hang/${vT0.id}/goi-xe`, {});
  A.phiBao = null; A.phiTao = null;
  const cT0 = await chuyenCua(vT0.id);
  k('C3 (K4) báo phí lúc gọi xe 0 VÀ tạo chuyến trả phí 0 → phi_that KHÔNG ghi 0 (để trống = chưa biết), chenh trống', cT0?.trang_thai === 'tim_xe'
    && cT0?.phi_that == null && cT0?.chenh == null, J([cT0?.trang_thai, cT0?.phi_that, cT0?.chenh]));
  datAha(vT.x, { status: 'IN PROCESS', total_price: 0, ...TX });
  await baoVe(vT.x);
  const ds = await giaoHang.doiSoatGiao(db.query, getToday(), getToday());
  const tay = (await db.query('SELECT phi_that FROM pos_giao_chuyen WHERE lay_hang_luc IS NOT NULL OR xong_luc IS NOT NULL')).reduce((s, r) => s + Number(r.phi_that || 0), 0);
  k('C4 Đối soát giao cộng phi_that đã giữ (chuyến lấy hàng với total_price 0 vẫn 16.000)', (await chuyenCua(vT.id))?.phi_that === 16000 && ds.phi_that === tay,
    `${(await chuyenCua(vT.id))?.phi_that} · ${ds.phi_that} / ${tay}`);

  // ═══ G · Thực thu ═════════════════════════════════════════════════════
  muc('[G] "Thực thu" Báo cáo Hàng ngày do máy chủ tính (F-LOI-2)');
  let soDon = 0;
  const donThang = async (ngay, o, nap = false) => {
    const code = `G3-${ngay}-${++soDon}`;
    const r = await db.run(`INSERT INTO pos_orders (code, subtotal, discount, total, shipping_fee, payment_method, cash_amount, transfer_amount, balance_amount, status,
      payment_status, cancelled_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?)`, [code, o.mon, o.giam || 0, o.mon - (o.giam || 0) + (o.ship || 0), o.ship || 0,
      o.cach, o.tm || 0, o.ck || 0, o.vi || 0, o.huy ? 'cancelled' : 'completed', o.huy ? `${ngay}T15:00:00` : null, `${ngay}T10:00:00`]);
    await db.run('INSERT INTO pos_order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES (?, ?, ?, 1, ?, ?)',
      [Number(r.lastInsertRowid), nap ? -2000001 : sp.id, nap ? 'Gói nạp' : 'Món', o.mon, o.mon]);
  };
  const NG = { a: '2026-10-01', b: '2026-10-02', c: '2026-10-03', d: '2026-10-04', e: '2026-10-05' };
  await donThang(NG.a, { mon: 30000, ship: 16000, cach: 'cash', tm: 46000 });
  await donThang(NG.b, { mon: 50000, giam: 10000, cach: 'cash', tm: 40000 });
  await donThang(NG.c, { mon: 30000, cach: 'balance', vi: 30000 });
  await donThang(NG.d, { mon: 30000, cach: 'cash', tm: 30000, huy: true });
  await donThang(NG.e, { mon: 100000, cach: 'cash', tm: 100000 }, true);
  const thucThu = {};
  for (const [ca, ngay] of Object.entries(NG)) thucThu[ca] = (await goi('GET', `/reports/daily?date=${ngay}`)).j.thuc_thu;
  k('G2 Thực thu do máy chủ trả (tính tay): (a) 46.000 · (b) 40.000 · (c) trả bằng tài khoản 0 · (d) huỷ trong ngày 0 · (e) đơn nạp tiền mặt 100.000',
    J(thucThu) === J({ a: 46000, b: 40000, c: 0, d: 0, e: 100000 }), J(thucThu));
  const soSach = await require(path.join(GOC, 'server', 'utils', 'doiSoat.js')).soSach(NG.a, NG.a);
  k('G1 cùng số với soSach (tien_mat + chuyen_khoan)', thucThu.a === soSach.tien_vao.tien_mat + soSach.tien_vao.chuyen_khoan, `${thucThu.a} / ${J(soSach.tien_vao)}`);
  const daily = (await goi('GET', `/reports/daily?date=${NG.a}`)).j;
  k('G3 giữ nguyên các ô cũ (doanh thu / tiền mặt / chiết khấu / phí ship)', daily.order_stats?.total_revenue === 46000 && daily.order_stats?.cash_revenue === 46000
    && daily.order_stats?.total_shipping === 16000, J(daily.order_stats));

  // ═══ D, E, G (màn) · màn thật qua esbuild ═════════════════════════════
  const M = khungManHinh(cong);
  muc('[G màn] Reports.jsx: ô Thực thu hiện số máy chủ, không tự cộng trừ');
  await donThang(getToday(), { mon: 30000, ship: 16000, cach: 'cash', tm: 46000 });
  try {
    const Reports = await M.nap(['pages', 'Reports.jsx'], tk);
    const man = M.dung(Reports);
    const the = () => man.tim((n) => n.type === 'div' && /stat-card/.test(n.props.className || '') && man.chu(n).includes('Thực thu'))[0];
    await man.doi(() => the() && /\d/.test(man.chu(the()).replace('Thực thu', '')));
    const tt = await goi('GET', `/reports/daily?date=${getToday()}`);
    const soMan = (man.chu(the()) || '').replace(/\D/g, '');
    k('G2 màn hiện ĐÚNG số máy chủ thuc_thu (hôm nay có đơn 30.000 + phí 16.000 tiền mặt) — không phải công thức cũ của màn',
      tt.j.thuc_thu != null && soMan === String(tt.j.thuc_thu) && soMan !== String(tt.j.order_stats.total_revenue - tt.j.order_stats.total_discount + tt.j.order_stats.total_shipping),
      `màn "${man.chu(the())}" · máy chủ ${tt.j.thuc_thu}`);
    k('G3 dưới ô có dòng "= tiền thật vào quán (gồm tiền khách nạp, đã trừ hoàn) — khớp tab Đối soát" (GIAO-DIEN-2 F1, chủ quán đồng ý 19.11)', man.chu(the()).includes('= tiền thật vào quán (gồm tiền khách nạp, đã trừ hoàn) — khớp tab Đối soát'), man.chu(the()));
  } catch (e) { k('G màn dựng được Reports.jsx', false, e.message); }
  const reportsSrc = fs.readFileSync(path.join(SRC, 'pages', 'Reports.jsx'), 'utf8');
  k('G4 client/src/pages/Reports.jsx không còn tự cộng / trừ total_revenue / total_discount / total_shipping', !/(total_revenue|total_discount|total_shipping)[^\n]*\)\s*[-+]/.test(reportsSrc));

  muc('[D] Màn Đối soát không treo');
  try {
    const DoiSoat = await M.nap(['components', 'DoiSoat.jsx'], tk);
    T.treo = true;
    const man = M.dung(DoiSoat);
    const nutChay = () => man.tat().find((n) => n.type === 'button' && /^(Đối soát|Đang đối soát…)$/.test(man.chu(n)));
    await ngu(100);
    const dangTreo = man.chu(nutChay() || { con: [] });
    await man.doi(() => man.toan().includes('Đối soát quá lâu'), 2500);
    k('D3 máy chủ không trả lời → hết hạn chờ (hằng số ≥ 30 s, bài rút còn 300 ms) → "Đối soát quá lâu — thử lại hoặc chọn kỳ ngắn hơn", nút Đối soát bấm lại được',
      dangTreo === 'Đang đối soát…' && man.toan().includes('Đối soát quá lâu — thử lại hoặc chọn kỳ ngắn hơn') && man.chu(nutChay()) === 'Đối soát' && !nutChay()?.props.disabled,
      `trước "${dangTreo}" · sau "${man.chu(nutChay() || { con: [] })}" · ${man.toan().slice(0, 120)}`);
    T.treo = false; T.loi503 = true;
    nutChay().props.onClick();
    await man.doi(() => man.toan().includes(db.LOI_KHO.doc), 5000);
    k('D3 503 KHO_MAT_KET_NOI → câu báo của máy chủ, không treo', man.toan().includes(db.LOI_KHO.doc) && man.chu(nutChay()) === 'Đối soát', man.toan().slice(0, 160));
    T.loi503 = false;
    const n0 = nhatKy.length;
    nutChay().props.onClick();
    await man.doi(() => !man.toan().includes('Mất kết nối') && man.chu(nutChay()) === 'Đối soát' && nhatKy.slice(n0).some((l) => l.startsWith('[DOISOAT]')), 8000);
    k('D3 bấm lại → ra kết quả, hết câu báo; D4 máy chủ ghi "[DOISOAT] ngay <ngày> · <ms>ms · <n> câu"', !man.toan().includes('Đối soát quá lâu')
      && nhatKy.slice(n0).some((l) => /^\[DOISOAT\] ngay \d{4}-\d{2}-\d{2} · \d+ms · \d+ câu$/.test(l)), J(nhatKy.slice(n0).filter((l) => l.includes('DOISOAT'))));
  } catch (e) { k('D màn dựng được DoiSoat.jsx', false, e.stack); }

  muc('[E] Hộp lý do của POS thay window.prompt');
  const ghSrc = fs.readdirSync(path.join(SRC, 'pages', 'GiaoHang')).filter((f) => /\.jsx?$/.test(f))
    .map((f) => fs.readFileSync(path.join(SRC, 'pages', 'GiaoHang', f), 'utf8')).join('\n');
  const conLai = ghSrc.match(/window\.prompt|window\.confirm|alert\(/g) || [];
  k('E4 client/src/pages/GiaoHang: 0 chỗ window.prompt / window.confirm / alert(', conLai.length === 0, `${conLai.length} chỗ`);
  try {
    const vE = await dangGiao();
    datAha(vE.x, { status: 'COMPLETED', path: diemDen({ status: 'FAILED', fail_comment: 'Khách hẹn hôm khác' }) });
    await baoVe(vE.x);
    const vE2 = await moChuyen();
    const vE3 = await moChuyen(false);
    const GiaoHang = await M.nap(['pages', 'GiaoHang', 'index.jsx'], tk);
    const man = M.dung(GiaoHang);
    const code = async (id) => (await db.queryOne('SELECT code FROM pos_orders WHERE id = ?', [id])).code;
    const moTheCua = async (id) => {
      const c = await code(id);
      await man.doi(() => man.tim((n) => n.type === 'div' && /gh-the\b/.test(n.props.className || '') && man.chu(n).includes(c)).length > 0);
      man.tim((n) => n.type === 'div' && /gh-the\b/.test(n.props.className || '') && man.chu(n).includes(c))[0].props.onClick();
      await ngu(30);
    };
    const o = () => man.tim((n) => (n.type === 'input' || n.type === 'textarea') && typeof n.props.onChange === 'function')[0];
    // Ca LUÔN chạy (soát vòng 1, TU-CHAY-5): bản không có hộp thì gõ / bấm là không làm gì và ca in ✗ — số ca không phụ thuộc code.
    const go = (chu) => o()?.props.onChange(M.ev({ target: { value: chu } }));
    const bam = (ten) => man.nut(ten)?.props.onClick(M.ev());
    const theCua = (c) => man.tim((n) => n.type === 'div' && /gh-the\b/.test(n.props.className || '') && man.chu(n).includes(c))[0];
    const cA = await code(vA.id);
    await man.doi(() => !!theCua(cA));
    k('B1 màn: thẻ đã về quán hiện "Hàng đã về quán" + giờ (16:23) và lý do', /Hàng đã về quán[^]*16:23/.test(man.chu(theCua(cA) || { con: [] }))
      && man.chu(theCua(cA)).includes('Giao không thành công: ' + LY_DO), man.chu(theCua(cA) || { con: [] }));
    datAha(vE.x, { sub_status: 'IN_RETURN' });
    await baoVe(vE.x);
    man.nut('Tải lại')?.props.onClick();
    const cE = await code(vE.id);
    await man.doi(() => man.chu(theCua(cE) || { con: [] }).includes('Đang trả hàng về quán'), 2000);
    k('B1 màn: thẻ đang trả về hiện "Đang trả hàng về quán", nút Đóng thẻ như cũ', man.chu(theCua(cE) || { con: [] }).includes('Đang trả hàng về quán'), man.chu(theCua(cE) || { con: [] }));
    await moTheCua(vE.id);
    k('A1 màn: chi tiết thẻ hiện lý do Ahamove', man.toan().includes('Giao không thành công: Khách hẹn hôm khác'), man.toan().slice(0, 200));
    const baoTruoc = M.bao().length;
    man.nut('Đóng thẻ').props.onClick(M.ev());
    await man.doi(() => !!o(), 1000);
    k('E1 Đóng thẻ → mở hộp lý do của POS (câu hỏi cũ), có Xác nhận / Thôi', !!o() && man.toan().includes('Lý do đóng thẻ giao lỗi (chỉ đóng thẻ, không đụng tiền / đơn):')
      && !!man.nut('Xác nhận') && !!man.nut('Thôi'), man.toan().slice(-200));
    {
      go('ab');
      await ngu(20);
      bam('Xác nhận');
      await ngu(150);
      k('E2 lý do 2 ký tự → báo ngay dưới ô, KHÔNG gửi (thẻ vẫn giao_loi)', man.toan().includes('ít nhất 3 ký tự') && (await chuyenCua(vE.id))?.trang_thai === 'giao_loi' && !!o(),
        man.toan().slice(-160));
      go('  ab  ');
      await ngu(20);
      const hetLoi = !man.toan().includes('ít nhất 3 ký tự');   // gõ lại → câu báo tắt
      bam('Xác nhận');
      await ngu(150);
      k('E2 "  ab  " (2 ký tự + khoảng trắng hai đầu) → vẫn báo, không gửi', hetLoi && man.toan().includes('ít nhất 3 ký tự') && !!o()
        && (await chuyenCua(vE.id))?.trang_thai === 'giao_loi', man.toan().slice(-160));
      bam('Thôi');
      await ngu(150);
      k('E2 bấm Thôi → đóng hộp, không gửi, không báo lỗi', !o() && (await chuyenCua(vE.id))?.trang_thai === 'giao_loi' && M.bao().length === baoTruoc, J(M.bao().slice(baoTruoc)));
      await db.run("UPDATE pos_giao_chuyen SET trang_thai = 'xong' WHERE order_id = ?", [vE.id]);   // thẻ đổi sau lưng màn → máy chủ 409
      bam('Đóng thẻ');
      await man.doi(() => !!o(), 1000);
      go('abc');   // ĐÚNG ngưỡng 3 ký tự → hộp cho gửi (máy chủ trả 409 vì thẻ đã đổi)
      await ngu(20);
      bam('Xác nhận');
      await man.doi(() => M.bao().length > baoTruoc, 2000);
      k('E3 lý do đúng 3 ký tự được gửi; máy chủ trả 409 → báo lỗi rõ (không im lặng)', M.bao().slice(baoTruoc).some(([kieu, chu]) => kieu === 'loi' && chu.includes('Chỉ đóng được thẻ giao lỗi')), J(M.bao().slice(baoTruoc)));
      await db.run("UPDATE pos_giao_chuyen SET trang_thai = 'giao_loi' WHERE order_id = ?", [vE.id]);
      await man.doi(() => !o(), 1000);
    }
    await moTheCua(vE2.id);
    man.nut('Huỷ chuyến')?.props.onClick(M.ev());
    await man.doi(() => !!o(), 1000);
    k('E1 Huỷ chuyến → hộp "Lý do huỷ chuyến Ahamove (phí huỷ nếu có quán chịu):"', !!o() && man.toan().includes('Lý do huỷ chuyến Ahamove (phí huỷ nếu có quán chịu):'));
    {
      go('Khách đổi giờ');
      await ngu(20);
      bam('Xác nhận');
      await ngu(400);
      k('E1 lý do hợp lệ → gửi, chuyến huỷ (chuyen_huy)', (await chuyenCua(vE2.id))?.trang_thai === 'chuyen_huy', (await chuyenCua(vE2.id))?.trang_thai);
    }
    await moTheCua(vE3.id);
    man.nut('Bỏ đi')?.props.onClick(M.ev());
    await man.doi(() => !!o(), 1000);
    k('E1 Huỷ đơn giao → hộp "Lý do huỷ đơn giao:"; Thôi → đơn vẫn còn', !!o() && man.toan().includes('Lý do huỷ đơn giao:'));
    bam('Thôi'); await ngu(100);
    k('E2 Thôi ở huỷ đơn → đơn KHÔNG huỷ', (await db.queryOne('SELECT status FROM pos_orders WHERE id = ?', [vE3.id]))?.status === 'completed');
  } catch (e) { k('E màn dựng được GiaoHang/index.jsx', false, e.stack); }

  ra(`\n${hong ? C.do : C.xanh}${C.dam}GIAO-3: ${dat} đạt · ${hong} hỏng${C.het}`);
  sv.closeAllConnections?.(); svAha.closeAllConnections?.();
  return hong;
}

main().then((h) => { fs.rmSync(THU_MUC, { recursive: true, force: true }); process.exit(h ? 1 : 0); },
  (e) => { ra('SẬP: ' + (e.stack || e)); fs.rmSync(THU_MUC, { recursive: true, force: true }); process.exit(2); });
