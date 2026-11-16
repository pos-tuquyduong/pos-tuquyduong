#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KET-NOI-1 — kết nối bền vững: đọc tự thử lại khi rớt mạng · mã lượt bấm thu tiền · lỗi mạng báo dễ hiểu · đo chậm
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ. Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KETNOI1.js   [--may-chu <bản sao server/>]  (đột biến viec/KET-NOI-1/dot_bien.py)
 *
 *  Khuôn thu_P3.js: database.js + libsql thật trên kho TẠM (thay ketNoiKho — P8), Express riêng mount đúng đường như index.js.
 *  Lớp mạng giả: thay `execute` / `transaction` của client kho, ném lỗi dựng ĐÚNG hình node-fetch 2.7.0 mà @libsql/client chuyển nguyên
 *  (`FetchError`, type `system`, code `ECONNRESET`, chữ "request to https://…turso.io/v2/pipeline failed, reason: socket hang up").
 *  "Ghi rồi mới rớt": commit THẬT xong mới ném. Quầy: gói client/src/utils/api.js THẬT bằng esbuild (khuôn thu_VOUCHER2.js), `fetch` giả
 *  chuyển yêu cầu tới máy chủ thử rồi (tuỳ ca) vứt câu trả. Mục [G] chạy server/index.js THẬT trong tiến trình con (khuôn thu_DANGNHAP2.js J).
 *  Không gọi payOS / Ahamove / Turso thật: máy giả trên 127.0.0.1. So status + `code`, không dò lời báo (E12) — trừ câu phiếu chốt nguyên văn.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const SRC = path.join(MAY_CHU, '..', 'client', 'src');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_ketnoi1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const stubKetNoi = (file) => ({ laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + file } }), diaChiSX: () => '', FILE_THU: file });
const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = { id: duongKN, filename: duongKN, loaded: true, exports: stubKetNoi(FILE_KHO) };
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_kn1_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_kn1_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.kn1.local/tra-ve';
const AHA = { api: 'aha_' + ngauNhien(), sdt: '0909000111', bao: 'bao_' + ngauNhien(), token: 'tok_' + ngauNhien() };
process.env.AHAMOVE_API_KEY = AHA.api; process.env.AHAMOVE_SDT = AHA.sdt; process.env.AHAMOVE_KHOA_BAO = AHA.bao;

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
let dat = 0, hong = 0;
// In THẲNG (logGoc): lúc gom log máy chủ (imLang) dòng ✓ / ✗ không được lẫn vào nhatKy — đột biến VS-CHAM-NGUONG từng "LẠC" vì dòng ✗ bị nuốt.
const k = (ten, dung, them = '') => {
  if (dung) { dat++; logGoc(`  ${C.xanh}✓${C.het} ${ten}`); }
  else { hong++; logGoc(`  ${C.do}✗ ${ten}${them ? '  — ' + String(them).slice(0, 220) : ''}${C.het}`); }
};
const muc = (t) => logGoc(`\n${C.dam}${t}${C.het}`);
const nhatKy = [];
const imLang = () => { console.log = console.error = console.warn = (...a) => nhatKy.push(a.map((x) => (x instanceof Error ? `${x.message} ${JSON.stringify(x)} ${x.cause ? JSON.stringify(String(x.cause.message || x.cause)) : ''}` : typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ')); };
let giuLog = false;   // [F]: dòng [CHAM] in lúc 'finish' — có thể SAU khi goi() trả; giữ gom log cả khoảng đó
const noiLai = () => { if (giuLog) return; console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const ngu = (ms) => new Promise((ok) => setTimeout(ok, ms));
const DIA_CHI_KHO = 'https://thu-kho.turso.io/v2/pipeline';
// Lỗi mạng ĐÚNG hình node-fetch 2.7.0 (@libsql/isomorphic-fetch/node_modules/node-fetch/lib/index.js:1501).
const loiMang = () => Object.assign(new Error(`request to ${DIA_CHI_KHO} failed, reason: socket hang up`), { name: 'FetchError', type: 'system', code: 'ECONNRESET', errno: 'ECONNRESET' });
const LO = (s) => /turso\.io|socket hang up|pipeline|ECONNRESET/i.test(String(s));
const CAU_DOC = 'Mất kết nối máy chủ — thử lại sau vài giây';
const CAU_GHI = 'Mất kết nối máy chủ — chưa biết đã ghi chưa, xem lại trước khi bấm lại';
const CAU_B5 = 'Mất kết nối — chưa biết đơn đã ghi chưa. Đừng thu lại: mở Đơn hàng kiểm đơn mới nhất.';

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const D = require(path.join(MAY_CHU, 'database.js'));
  const { getNow } = require(path.join(MAY_CHU, 'utils', 'helpers.js'));
  await D.initDatabase();

  // ── Lớp mạng giả (ngoài + trong giao dịch). H: ngoài giao dịch; HT: trong giao dịch; sauCommit: regex câu trong tx → commit thật rồi ném ──
  const M = { goi: 0, H: null, HT: null, sauCommit: null, vaoTx: 0, chanTx: null };   // chanTx: mọi giao dịch chờ tới khi thả (B1f ép đua)
  const datHong = (con, khop = /./, tao = loiMang) => { M.H = { con, khop, tao }; };
  const hongTx = (con, khop = /./, tao = loiMang) => { M.HT = { con, khop, tao }; };
  const traSql = (st) => (typeof st === 'string' ? st : st.sql);
  const moc = () => {
    const c = D.getDb();
    if (c.__kn1) return;
    c.__kn1 = true;
    const exe = c.execute.bind(c), txGoc = c.transaction.bind(c);
    c.execute = async (st) => {
      M.goi++;
      const H = M.H;
      if (H && H.con > 0 && H.khop.test(traSql(st))) { H.con--; throw H.tao(); }
      return exe(st);
    };
    c.transaction = async (...a) => {
      M.vaoTx++;
      if (M.chanTx) await M.chanTx;
      const t = await txGoc(...a);
      const te = t.execute.bind(t), tc = t.commit.bind(t);
      let khop = false;
      t.execute = async (st) => {
        const sql = traSql(st), HT = M.HT;
        if (HT && HT.con > 0 && HT.khop.test(sql)) { HT.con--; throw HT.tao(); }
        if (M.sauCommit && M.sauCommit.test(sql)) khop = true;
        return te(st);
      };
      t.commit = async () => { await tc(); if (khop) { M.sauCommit = null; throw loiMang(); } };
      return t;
    };
  };
  moc();
  const dem = () => (typeof D.demKetNoi === 'function' ? D.demKetNoi() : {});

  // ── payOS giả + Ahamove giả + máy "ngoài" chậm ──
  const chuoiKy = (d) => Object.keys(d).sort().map((x) => `${x}=${d[x] == null ? '' : d[x]}`).join('&');
  const hmac = (s) => crypto.createHmac('sha256', KHOA.ck).update(s).digest('hex');
  const P = { nhan: 0, treo: null, tuChoi: false };
  const gia = express();
  gia.use(express.json());
  gia.post('/v2/payment-requests', async (req, res) => {
    P.nhan++;
    if (P.treo) await P.treo;
    const data = { orderCode: req.body.orderCode, amount: req.body.amount, description: req.body.description, status: 'PENDING',
      paymentLinkId: 'pl_' + req.body.orderCode, qrCode: 'QR_KN1_' + req.body.orderCode, checkoutUrl: 'https://gia/' + req.body.orderCode };
    if (P.tuChoi) return res.json({ code: '20', desc: 'tu choi', data: null });
    res.json({ code: '00', desc: 'success', data, signature: hmac(chuoiKy(data)) });
  });
  gia.post('/v3/accounts/token', (req, res) => res.json({ token: AHA.token }));
  gia.get('/v3/orders/:id', (req, res) => res.json({ _id: req.params.id, status: 'ACCEPTED', path: [{}, { status: '' }], supplier_id: '0911222333',
    supplier_name: 'Tài xế thử', total_price: 20000 }));
  gia.get('/ngoai-cham', async (req, res) => { await ngu(60); res.json({ ok: true }); });
  const svGia = await new Promise((ok) => { const s = gia.listen(0, '127.0.0.1', () => ok(s)); });
  const gocGia = `http://127.0.0.1:${svGia.address().port}`;
  process.env.PAYOS_BASE_URL = gocGia;
  process.env.AHAMOVE_BASE_URL = gocGia;

  // ── Máy chủ thử: cùng thứ tự gắn như index.js (đo yêu cầu + móc lỗi kho trước mọi route) ──
  const R = (f) => path.join(MAY_CHU, 'routes', f);
  const app = express();
  app.use(express.json());
  const doLan = [];
  app.use('/api', (req, res, next) => { res.on('finish', () => { if (res.locals.ketNoi) doLan.push({ duong: `${req.method} ${req.originalUrl.split('?')[0]}`, ...res.locals.ketNoi }); }); next(); });
  if (typeof D.doYeuCau === 'function') app.use('/api', D.doYeuCau);
  if (typeof D.mocLoiKho === 'function') app.use('/api/pos', D.mocLoiKho);
  const ngoai = typeof D.bocFetchNgoai === 'function' ? D.bocFetchNgoai(globalThis.fetch) : globalThis.fetch;
  app.get('/api/pos/thu-cham/:ms', async (req, res) => {
    await D.query('SELECT 1 AS x');
    await (await ngoai(gocGia + '/ngoai-cham')).json();
    await ngu(Number(req.params.ms));
    res.json({ ok: true });
  });
  app.use('/api/pos/customers', require(R('customers.js')));
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/wallets', require(R('wallets.js')));
  const tt = require(R('thanh-toan.js'));
  app.use('/api/pos/thanh-toan', tt);
  app.use('/api/giao-hang/ahamove-bao', require(R('giao-hang.js')).webhook);
  const sv = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)); });
  const cong = sv.address().port;
  const goc = `http://127.0.0.1:${cong}/api`;
  noiLai();

  // ── Dữ liệu nền ──
  const tkVai = async (ten, role) => {
    if (role !== 'owner') await D.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)", [ten, ten, role]);
    const u = await D.queryOne(role === 'owner' ? "SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1" : 'SELECT id FROM pos_users WHERE username = ?', [ten]);
    return jwt.sign({ userId: u.id }, KHOA_NV, { expiresIn: '1h' });
  };
  const tkChu = await tkVai('', 'owner'), tkQl = await tkVai('kn1_ql', 'manager'), tkNv = await tkVai('kn1_nv', 'staff'), tkNv2 = await tkVai('kn1_nv2', 'staff');
  for (const [a, b] of [['loyalty_enabled', 'true'], ['flash_enabled', 'false'], ['signup_enabled', '0']]) {
    await D.run('INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [a, b, getNow()]);
  }
  const sp = await D.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await D.run('UPDATE pos_products SET price = 25000 WHERE id = ?', [sp.id]);
  const mon = (sl = 1) => ({ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: sl });

  const goi = async (method, url, body, tk = tkNv) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (tk) headers.Authorization = 'Bearer ' + tk;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      return { status: r.status, j, tho };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.j?.code ? ' · ' + r.j.code : ''}`;
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const so = async (sql, p = []) => { const h = M.H; M.H = null; try { return Number((await D.queryOne(sql, p).catch(() => null))?.n ?? -1); } finally { M.H = h; } };
  const soPhien = () => so('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan');
  const soDon = () => so('SELECT COUNT(*) AS n FROM pos_orders');
  const soHd = () => so('SELECT COUNT(*) AS n FROM pos_so_hoa_don');
  const dongVi = (sdt) => so('SELECT COUNT(*) AS n FROM pos_balance_transactions WHERE customer_phone = ?', [sdt]);
  const viCon = (sdt) => so('SELECT balance AS n FROM pos_wallets WHERE phone = ?', [sdt]);
  const giuVi = (sdt) => so("SELECT COALESCE(SUM(giu_vi), 0) AS n FROM pos_phien_thanh_toan WHERE phone = ? AND trang_thai = 'cho'", [sdt]);
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.stack || e.message); } };
  let soSdt = 0;
  const PIN = '2468';
  const khach = async (vi = 0) => {
    const sdt = '09' + String(71000000 + (++soSdt)).padStart(8, '0');
    await D.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + sdt, getNow()]);
    if (vi) await goi('POST', '/pos/wallets/topup', { phone: sdt, amount: vi }, tkChu);
    await goi('POST', '/pos/thanh-toan/pin', { phone: sdt, pin: PIN, pin_lai: PIN });
    return sdt;
  };
  const vc = require(path.join(MAY_CHU, 'utils', 'voucherCode.js'));
  const phatVoucher = async (sdt) => {
    const tx = await D.beginTransaction();
    try {
      const r = await vc.phatVoucher(tx, { ten: 'KN1 giảm 5k', kieu: 'tien', gia_tri: 5000, tran: 0, don_toi_thieu: 0, ap_dung: 'tat_ca', ap_dung_ids: null,
        han_ngay: 30, chinh_chu: 0, id: null }, sdt, 'tay', {});
      await tx.commit(); return r.code;
    } catch (e) { await tx.rollback(); throw e; }
  };
  let soMa = 0;
  const maMoi = () => `kn1-${Date.now().toString(36)}-${++soMa}`;
  const than = (o = {}) => ({ cach: o.cach || 'tien_mat', don: { items: [mon(o.sl || 1)], ...(o.sdt ? { customer_phone: o.sdt, customer_name: 'K' } : {}), ...(o.don || {}) },
    tru_tai_khoan: !!o.tk, pin: o.tk ? PIN : undefined, ...(o.ma !== undefined ? { ma_gui: o.ma } : {}) });
  const tao = (o, tk) => goi('POST', '/pos/thanh-toan/phien', than(o), tk);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] Máy chủ ĐỌC tự thử lại khi rớt kết nối (database.js)');
  await chay('A', async () => {
    const d0 = dem();
    let g = M.goi; datHong(1, /SELECT/);
    let r = await D.query('SELECT 7 AS x').catch((e) => e);
    k('A1a SELECT rớt 1 lần → tự đọc lại, ra đúng kết quả (execute 2 lần)', r?.[0]?.x === 7 && M.goi - g === 2, `${JSON.stringify(r?.message || r)} · ${M.goi - g}`);
    g = M.goi; datHong(2, /SELECT/);
    const t0 = Date.now();
    r = await D.queryOne('SELECT 8 AS x').catch((e) => e);
    const ms = Date.now() - t0;
    k('A1b queryOne rớt 2 lần → lần 3 ra kết quả (execute 3 lần)', r?.x === 8 && M.goi - g === 3, `${r?.message || JSON.stringify(r)} · ${M.goi - g}`);
    k('A1d rớt 2 lần → RA kết quả và tổng chờ ≤ 1000 ms', r?.x === 8 && ms <= 1000, `${ms} ms`);
    g = M.goi; datHong(3, /SELECT/);
    r = await D.query('SELECT 9 AS x').catch((e) => e);
    k('A1c rớt 3 lần → ném KHO_MAT_KET_NOI (câu đọc), execute ĐÚNG 3 lần (2 thử lại)', r?.code === 'KHO_MAT_KET_NOI' && r?.message === CAU_DOC && M.goi - g === 3,
      `${r?.code} · ${r?.message} · ${M.goi - g}`);
    k('A1c lỗi ném ra KHÔNG mang lỗi gốc (cause) / địa chỉ kho', r instanceof Error && !r.cause && !/turso\.io|socket hang up|pipeline/.test(JSON.stringify(r) + r.message), JSON.stringify(r));

    const L = D.laLoiMang;
    const co = typeof L === 'function';
    const fe = loiMang();
    k('A1e laLoiMang: FetchError node-fetch (type system) → mạng', co && L(fe) === true);
    k('A1f laLoiMang: mã ở err.code (ETIMEDOUT) và ở cause.code (ECONNRESET), chữ khác → mạng',
      co && L(Object.assign(new Error('x'), { code: 'ETIMEDOUT' })) && L(Object.assign(new Error('y'), { cause: { code: 'ECONNRESET' } })));
    k('A1g laLoiMang: chữ "fetch failed" / "socket hang up" (không mã) → mạng', co && L(new TypeError('fetch failed')) && L(new Error('read socket hang up')));
    k('A1h laLoiMang: SERVER_ERROR 502/503/504 → mạng; SERVER_ERROR 500 → KHÔNG',
      co && [502, 503, 504].every((s) => L(Object.assign(new Error('SERVER_ERROR: Server returned HTTP status ' + s), { code: 'SERVER_ERROR', cause: { status: s } })))
      && !L(Object.assign(new Error('SERVER_ERROR: Server returned HTTP status 500'), { code: 'SERVER_ERROR', cause: { status: 500 } })));
    k('A3c laLoiMang: SQLITE_ERROR / SQLITE_CONSTRAINT_UNIQUE / SQLITE_BUSY / lỗi JS → KHÔNG', co
      && ['SQLITE_ERROR', 'SQLITE_CONSTRAINT_UNIQUE', 'SQLITE_BUSY'].every((c) => !L(Object.assign(new Error(c + ': x'), { code: c }))) && !L(new TypeError('a is undefined')) && !L(null));

    g = M.goi; datHong(1);
    r = await D.run('UPDATE pos_settings SET value = value WHERE key = ?', ['flash_enabled']).catch((e) => e);
    k('A2a run() rớt → KHÔNG thử lại (execute 1 lần), ném KHO_MAT_KET_NOI câu GHI', r?.code === 'KHO_MAT_KET_NOI' && r?.message === CAU_GHI && M.goi - g === 1, `${r?.code} · ${M.goi - g}`);
    for (const [ma, sql] of [['A2b', "INSERT INTO pos_settings (key, value, updated_at) VALUES ('kn1_a2', '1', 'x')"],
      ['A2b2', "WITH x AS (SELECT 1) INSERT INTO pos_settings (key, value, updated_at) SELECT 'kn1_a2b', '1', 'x' FROM x"]]) {
      g = M.goi; datHong(1);
      r = await D.query(sql).catch((e) => e);
      k(`${ma} câu GHI đi qua query() (${sql.slice(0, 14)}…) rớt → KHÔNG thử lại, ném câu ghi`, r?.code === 'KHO_MAT_KET_NOI' && r?.message === CAU_GHI && M.goi - g === 1, `${r?.code} · ${M.goi - g}`);
    }
    for (const [ma, sql] of [['A2c', '  -- chú thích đầu\n  /* khối */ SELECT 3 AS x'], ['A2d', 'SELECT key, updated_at, 3 AS x FROM pos_settings LIMIT 1'],
      ['A2d2', "SELECT REPLACE('ab', 'a', '') AS y, 3 AS x"], ['A2e', 'WITH t AS (SELECT 3 AS x) SELECT x FROM t']]) {
      g = M.goi; datHong(1);
      r = await D.query(sql).catch((e) => e);
      k(`${ma} câu ĐỌC "${sql.replace(/\s+/g, ' ').slice(0, 40)}" rớt 1 lần → vẫn thử lại, ra kết quả`, r?.[0]?.x === 3 && M.goi - g === 2, `${r?.message || ''} · ${M.goi - g}`);
    }
    g = M.goi;
    r = await D.query('SELECT * FROM bang_khong_co_kn1').catch((e) => e);
    k('A3a SQL sai → ném NGUYÊN lỗi (SQLITE_ERROR, chữ "no such table"), execute 1 lần', /SQLITE_ERROR/.test(String(r?.code)) && /no such table/.test(r?.message) && M.goi - g === 1,
      `${r?.code} · ${M.goi - g}`);
    const dTruocBan = dem();
    datHong(1, /SELECT/, () => Object.assign(new Error('SQLITE_BUSY: database is locked (giả)'), { code: 'SQLITE_BUSY' }));
    r = await D.query('SELECT 1 AS x').catch((e) => e);
    moc();   // kho file: lỗi bận thay kết nối (P26d) — móc lại client mới
    k('A3b SELECT gặp SQLITE_BUSY → ném BẬN như cũ (P26d), KHÔNG đếm là rớt mạng', r?.code === 'SQLITE_BUSY' && dem().rot === dTruocBan.rot, `${r?.code} · rot ${dTruocBan.rot}→${dem().rot}`);

    nhatKy.length = 0;
    imLang();
    datHong(1, /SELECT/);
    await D.query('SELECT * FROM pos_customers WHERE phone = ?', ['0912345678']).catch(() => {});
    datHong(1);
    await D.run('UPDATE pos_customers SET name = ? WHERE phone = ?', ['Tên Bí Mật', '0912345678']).catch(() => {});
    noiLai();
    const dong = nhatKy.filter((x) => x.includes('[KET-NOI]'));
    k('A4a mỗi lần rớt MỘT dòng [KET-NOI] (đọc: thử lại; ghi: không thử lại)', dong.length === 2 && /doc/.test(dong[0]) && /ghi/.test(dong[1]), JSON.stringify(dong));
    k('A4a log KHÔNG chứa câu SQL, tham số (SĐT, tên), địa chỉ kho', nhatKy.length > 0 && !nhatKy.some((x) => /pos_customers|0912345678|Tên Bí Mật|turso\.io|socket hang up/.test(x)),
      JSON.stringify(nhatKy).slice(0, 200));
    const d1 = dem();
    k('A4b demKetNoi(): rot / thu_lai_dat / thu_lai_hong / tu đếm đúng các ca trên', typeof D.demKetNoi === 'function'
      && d1.rot - (d0.rot || 0) === 1 + 2 + 3 + 1 + 2 + 4 + 2 && d1.thu_lai_dat - (d0.thu_lai_dat || 0) === 2 + 4 + 1 && d1.thu_lai_hong - (d0.thu_lai_hong || 0) === 1
      && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(d1.tu), JSON.stringify(d1));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] Thu tiền ở quầy: mã lượt bấm (tạo phiên) + chốt lần hai trả đơn đã ghi');
  await chay('B1', async () => {
    const a = await khach(30000);
    const ma = maMoi();
    const p0 = await soPhien();
    const r1 = await tao({ sdt: a, sl: 2, tk: true, ma }), r2 = await tao({ sdt: a, sl: 2, tk: true, ma });
    const x = r1.j.phien || {}, y = r2.j.phien || {};
    k('B1a cùng ma_gui hai lần → 200 CÙNG phiên (id, tong, giu_vi, con_lai), chỉ +1 phiên', la(r1, 200) && la(r2, 200) && x.id === y.id && x.tong === y.tong
      && x.giu_vi === 30000 && y.giu_vi === 30000 && x.con_lai === y.con_lai && await soPhien() === p0 + 1, `${moTa(r1)} / ${moTa(r2)} · ${x.id}/${y.id} · ${await soPhien() - p0}`);
    k('B1a ví chỉ bị GIỮ một lần (30.000)', await giuVi(a) === 30000, String(await giuVi(a)));
    const ma2 = maMoi(), n0 = P.nhan, h0 = await soHd();
    const q1 = await tao({ cach: 'payos', ma: ma2 }), q2 = await tao({ cach: 'payos', ma: ma2 });
    k('B1b phiên QR cùng mã → cùng phiên, cùng QR + nội dung; cổng QR gọi 1 lần; MỘT số hoá đơn', la(q1, 200) && la(q2, 200) && q1.j.phien?.id === q2.j.phien?.id
      && q1.j.phien?.qr && q1.j.phien.qr === q2.j.phien?.qr && q1.j.phien.noi_dung === q2.j.phien?.noi_dung && P.nhan - n0 === 1 && await soHd() - h0 === 1,
      `${moTa(q1)} / ${moTa(q2)} · cổng ${P.nhan - n0} · HĐ ${await soHd() - h0}`);
    let p1 = await soPhien();
    const c1 = await tao({ sdt: a, sl: 3, tk: true, ma });
    k('B1c cùng mã, giỏ KHÁC → 409 MA_GUI_KHAC_DON, không phiên mới', la(c1, 409, 'MA_GUI_KHAC_DON') && await soPhien() === p1, moTa(c1));
    const c2 = await tao({ sdt: a, sl: 2, tk: true, ma }, tkNv2);
    k('B1d cùng mã + cùng giỏ, nhân viên KHÁC → 409 MA_GUI_KHAC_DON', la(c2, 409, 'MA_GUI_KHAC_DON') && await soPhien() === p1, moTa(c2));
    const c3 = await tao({ sdt: a, sl: 2, ma });
    k('B1h cùng mã + cùng giỏ, lần đầu trừ tài khoản (giữ 30.000) lần sau KHÔNG xin trừ → 409 MA_GUI_KHAC_DON', la(c3, 409, 'MA_GUI_KHAC_DON') && await soPhien() === p1, moTa(c3));
    const e1 = await tao({}), e2 = await tao({}), e3 = await tao({ ma: maMoi() }), e4 = await tao({ ma: maMoi() });
    k('B1e không gửi mã → hai phiên (như cũ); hai mã KHÁC cùng giỏ → hai phiên (không gộp)', [e1, e2, e3, e4].every((r) => la(r, 200))
      && new Set([e1, e2, e3, e4].map((r) => r.j.phien?.id)).size === 4 && await soPhien() === p1 + 4, [e1, e2, e3, e4].map(moTa).join(' / '));
    p1 = await soPhien();
    const ma3 = maMoi();
    // Ép đua THẬT: cả hai yêu cầu qua đường nhanh (chưa có phiên) rồi cùng chờ mở giao dịch — chỉ câu đọc ĐẦU trong giao dịch cứu được.
    let tha;
    M.chanTx = new Promise((ok) => { tha = ok; });
    const v0 = M.vaoTx;
    const dua = Promise.all([tao({ ma: ma3, sl: 4 }), tao({ ma: ma3, sl: 4 })]);
    for (let i = 0; i < 300 && M.vaoTx - v0 < 2; i++) await ngu(10);
    const duaDu = M.vaoTx - v0 >= 2;
    M.chanTx = null; tha();
    const [f1, f2] = await dua;
    k('B1f hai yêu cầu cùng mã CÙNG LÚC (cả hai đã qua đường nhanh, cùng chờ mở giao dịch) → MỘT phiên, hai câu trả cùng id', duaDu && la(f1, 200) && la(f2, 200)
      && f1.j.phien?.id === f2.j.phien?.id && await soPhien() === p1 + 1, `đua ${duaDu} · ${moTa(f1)} / ${moTa(f2)} · +${await soPhien() - p1}`);
    const g1 = await tao({ ma: 'ngan' }), g2 = await tao({ ma: 'co dau cach 123' }), g3 = await tao({ ma: 12345678 });
    k('B1g mã sai dạng (ngắn / dấu cách / số) → 400 MA_GUI_KHONG_HOP_LE', [g1, g2, g3].every((r) => la(r, 400, 'MA_GUI_KHONG_HOP_LE')), [g1, g2, g3].map(moTa).join(' / '));
    const ma4 = maMoi(), h1 = await tao({ ma: ma4 });
    await goi('POST', `/pos/thanh-toan/phien/${h1.j.phien?.id}/huy`, {});
    const h2 = await tao({ ma: ma4 });
    k('B1g mã của phiên ĐÃ HUỶ gửi lại → 409 PHIEN_DA_CHOT (không trả phiên huỷ, không tạo mới)', la(h2, 409, 'PHIEN_DA_CHOT'), moTa(h2));
    const chen = (m) => D.run(`INSERT INTO pos_phien_thanh_toan (than, tong, con_lai, cach, het_han, nguoi_tao, tao_luc, ma_gui) VALUES ('{}', 1, 1, 'tien_mat', ?, 'x', ?, ?)`,
      [getNow(), getNow(), m]).then(() => 'ok', (e) => String(e.code || e.message));
    const ma5 = maMoi(), u1 = await chen(ma5), u2 = await chen(ma5), u3 = await chen(null), u4 = await chen(null);
    k('B1k bước 029: khoá UNIQUE — hai dòng cùng ma_gui → kho từ chối; ma_gui NULL (đơn App, lời gọi cũ) → nhiều dòng được', u1 === 'ok' && /UNIQUE|CONSTRAINT/.test(u2)
      && u3 === 'ok' && u4 === 'ok', `${u1} / ${u2} / ${u3} / ${u4}`);
  });

  await chay('B1ij', async () => {
    const b = await khach(0);
    const code = await phatVoucher(b);
    const ma = maMoi();
    const v1 = await tao({ cach: 'payos', sdt: b, don: { vouchers: [code] }, ma }), v2 = await tao({ cach: 'payos', sdt: b, don: { vouchers: [code] }, ma });
    k('B1i phiên QR có voucher gửi lại cùng mã → 200 cùng phiên (không bị chính nó chặn VOUCHER_DANG_GIU)', la(v1, 200) && la(v2, 200) && v1.j.phien?.id === v2.j.phien?.id,
      `${moTa(v1)} / ${moTa(v2)}`);
    let tha;
    P.treo = new Promise((ok) => { tha = ok; });
    const ma2 = maMoi(), p0 = await soPhien();
    const dau = tao({ cach: 'payos', ma: ma2 });
    for (let i = 0; i < 100 && await soPhien() === p0; i++) await ngu(20);
    const giua = await tao({ cach: 'payos', ma: ma2 });
    tha(); P.treo = null;
    const xong = await dau;
    k('B1j phiên QR đang gọi cổng (chưa có QR) gửi lại cùng mã → 503 DANG_XU_LY; lần đầu vẫn ra QR', la(giua, 503, 'DANG_XU_LY') && la(xong, 200) && !!xong.j.phien?.qr,
      `${moTa(giua)} / ${moTa(xong)}`);
    P.tuChoi = true;
    const ma3 = maMoi(), l1 = await tao({ cach: 'payos', ma: ma3 }), l2 = await tao({ cach: 'payos', ma: ma3 });
    P.tuChoi = false;
    k('B1j cổng QR hỏng → 502 PAYOS_LOI; gửi lại cùng mã → 502 PAYOS_LOI (như lần đầu)', la(l1, 502, 'PAYOS_LOI') && la(l2, 502, 'PAYOS_LOI'), `${moTa(l1)} / ${moTa(l2)}`);
  });

  await chay('B2', async () => {
    const a = await khach(20000);
    const p = (await tao({ sdt: a, sl: 2, tk: true, ma: maMoi() })).j.phien;
    const o0 = await soDon(), v0 = await dongVi(a);
    const c1 = await goi('POST', `/pos/thanh-toan/phien/${p.id}/chot`, { cash_received: 30000 });
    const c2 = await goi('POST', `/pos/thanh-toan/phien/${p.id}/chot`, { cash_received: 30000 });
    k('B2a chốt tiền mặt hai lần → lần hai 200 CÙNG order.id (không 409)', la(c1, 200) && la(c2, 200) && c1.j.order?.id && c2.j.order?.id === c1.j.order.id, `${moTa(c1)} / ${moTa(c2)}`);
    k('B2a đúng MỘT đơn, ví trừ MỘT lần (một dòng sổ ví)', await soDon() === o0 + 1 && await dongVi(a) === v0 + 1 && await viCon(a) === 0, `đơn +${await soDon() - o0} · sổ ví +${await dongVi(a) - v0}`);
    const q = (await tao({ ma: maMoi() })).j.phien;
    const o1 = await soDon();
    const [d1, d2] = await Promise.all([goi('POST', `/pos/thanh-toan/phien/${q.id}/chot`, {}), goi('POST', `/pos/thanh-toan/phien/${q.id}/chot`, {})]);
    k('B2a hai lần chốt CÙNG LÚC → MỘT đơn; mỗi câu trả 200 (cùng đơn) hoặc 409 PHIEN_DA_CHOT', await soDon() === o1 + 1 && [d1, d2].some((r) => la(r, 200))
      && [d1, d2].every((r) => la(r, 200) || la(r, 409, 'PHIEN_DA_CHOT')), `${moTa(d1)} / ${moTa(d2)}`);
    const h = (await tao({})).j.phien;
    await goi('POST', `/pos/thanh-toan/phien/${h.id}/huy`, {});
    const b1 = await goi('POST', `/pos/thanh-toan/phien/${h.id}/chot`, {});
    k('B2b phiên đã huỷ → chốt 409 PHIEN_DA_CHOT (như cũ)', la(b1, 409, 'PHIEN_DA_CHOT'), moTa(b1));
    const ck = (await tao({ cach: 'ck_tay' })).j.phien;
    const t1 = await goi('POST', `/pos/thanh-toan/phien/${ck.id}/xac-nhan-tay`, { ly_do: 'Khách CK đúng' }, tkQl);
    const t2 = await goi('POST', `/pos/thanh-toan/phien/${ck.id}/xac-nhan-tay`, { ly_do: 'Khách CK đúng' }, tkQl);
    k('B2c xác nhận tay lần hai → 409 PHIEN_DA_CHOT (đường khác KHÔNG trả lại đơn)', la(t1, 200) && la(t2, 409, 'PHIEN_DA_CHOT'), `${moTa(t1)} / ${moTa(t2)}`);
    const gc = require(path.join(MAY_CHU, 'utils', 'giuCho.js'));
    const b = await khach(30000);
    const tk = (await goi('POST', '/pos/thanh-toan/phien', { cach: 'tai_khoan', don: { items: [mon(1)], customer_phone: b, customer_name: 'K' }, tru_tai_khoan: true, pin: PIN })).j.phien;
    const x1 = await goi('POST', `/pos/thanh-toan/phien/${tk.id}/chot`, {});
    const doc = () => D.queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [tk.id]);
    const x2 = await gc.chotPhien(await doc(), 'tai_khoan', { nguoi: 'app' });
    const x3 = await gc.chotPhien(await doc(), 'tai_khoan', { nguoi: 'kn1_nv', lapLai: true });
    k('B2d chotPhien KHÔNG lapLai (đường đơn App) lần hai → 409; CÓ lapLai (route /chot) → 200 lap_lai cùng đơn', la(x1, 200) && x2.status === 409
      && x3.status === 200 && x3.body?.lap_lai === true && x3.body?.order?.id === x1.j.order?.id, `${moTa(x1)} · ${x2.status} · ${x3.status} ${JSON.stringify(x3.body).slice(0, 80)}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] Quầy: client/src/utils/api.js THẬT (esbuild) — gửi lại có mã, lỗi mạng tiếng Việt');
  const esbuild = require(path.join(GOC, 'client', 'node_modules', 'esbuild'));
  let A = {};
  try {
    const kq = await esbuild.build({ entryPoints: [path.join(SRC, 'utils', 'api.js')], bundle: true, write: false, format: 'cjs', platform: 'node', logLevel: 'silent',
      define: { 'import.meta.env': '{}' } });
    globalThis.localStorage = { getItem: (x) => (x === 'pos_token' ? tkNv : null), setItem() {}, removeItem() {} };
    globalThis.window = { location: { pathname: '/', href: '' }, URL };
    const m = { exports: {} };
    new Function('module', 'exports', 'require', kq.outputFiles[0].text)(m, m.exports, require);
    A = m.exports;
  } catch (e) { k('C0 gói được api.js', false, e.message); }
  const fetchThat = globalThis.fetch;
  const F = { goi: [], truoc: 0, sau: 0, gia: [] };   // gia: [{ status, than }] câu trả giả lần lượt
  globalThis.fetch = async (u, o = {}) => {
    if (typeof u !== 'string' || !u.startsWith('/api/')) return fetchThat(u, o);
    F.goi.push({ u, method: o.method || 'GET', body: o.body });
    if (F.truoc > 0) { F.truoc--; throw new TypeError('Failed to fetch'); }
    const g = F.gia.shift();
    if (g) return new Response(typeof g.than === 'string' ? g.than : JSON.stringify(g.than), { status: g.status, headers: { 'content-type': typeof g.than === 'string' ? 'text/html' : 'application/json' } });
    const r = await fetchThat(`http://127.0.0.1:${cong}${u}`, o);
    if (F.sau > 0) { F.sau--; await r.text(); throw new TypeError('Failed to fetch'); }
    return r;
  };
  const goiApi = async (fn) => { F.goi = []; imLang(); try { return { kq: await fn() }; } catch (e) { return { loi: e }; } finally { noiLai(); } };
  const TT = A.thanhToanApi || {}, O = A.ordersApi || {}, api = A.api || A.default || {};

  await chay('C', async () => {
    let r = await goiApi(() => { F.truoc = 1; return api.post('/wallets/topup', { phone: '0900000001', amount: 1000 }); });
    k('C1a fetch ném TypeError → lỗi code MAT_KET_NOI + lời tiếng Việt (không "Failed to fetch")', r.loi?.code === 'MAT_KET_NOI'
      && r.loi?.message === 'Mất kết nối tới máy chủ — kiểm tra mạng rồi thử lại', `${r.loi?.code} · ${r.loi?.message}`);
    k('C1b POST thường rớt mạng → gửi ĐÚNG 1 lần (không tự gửi lại lệnh ghi)', F.goi.length === 1, String(F.goi.length));
    r = await goiApi(() => { F.truoc = 2; return api.get('/thanh-toan/phien/1'); });
    k('C1b GET rớt 2 lần → lần 3 có trả lời (3 lần gửi)', F.goi.length === 3 && !r.loi?.code?.startsWith?.('MAT'), `${F.goi.length} · ${r.loi?.code}`);
    r = await goiApi(() => { F.truoc = 3; return api.get('/thanh-toan/phien/1'); });
    k('B3b GET rớt 3 lần → ném MAT_KET_NOI sau ĐÚNG 3 lần gửi', r.loi?.code === 'MAT_KET_NOI' && F.goi.length === 3, `${F.goi.length} · ${r.loi?.code}`);
    r = await goiApi(() => { F.gia = [{ status: 502, than: '<html>Bad gateway</html>' }]; return api.get('/thanh-toan/phien/1'); });
    k('B3b GET gặp trang 502 của proxy (không JSON, không code) → gửi lại', F.goi.length === 2, String(F.goi.length));
    r = await goiApi(() => { F.gia = [{ status: 502, than: '<html>x</html>' }]; return api.post('/wallets/topup', {}); });
    k('C1a POST thường gặp trang 502 proxy → MAT_KET_NOI + lời tiếng Việt, gửi 1 lần', r.loi?.code === 'MAT_KET_NOI' && F.goi.length === 1, `${r.loi?.code} · ${r.loi?.message} · ${F.goi.length}`);
    r = await goiApi(() => { F.gia = [{ status: 409, than: { error: 'bận', code: 'KHO_BAN' } }]; return api.get('/thanh-toan/phien/1'); });
    k('B3c GET thường gặp 409 KHO_BAN → KHÔNG gửi lại (chỉ lời gọi có mã)', r.loi?.code === 'KHO_BAN' && F.goi.length === 1, `${r.loi?.code} · ${F.goi.length}`);

    const ma = maMoi(), p0 = await soPhien();
    r = await goiApi(() => { F.truoc = 1; return TT.taoPhien(than({ ma })); });
    const b0 = F.goi.map((x) => x.body);
    k('B3a taoPhien rớt mạng 1 lần → gửi lại NGUYÊN thân (cùng ma_gui) → thành công, +1 phiên', !r.loi && r.kq?.phien?.id && F.goi.length === 2 && b0[0] === b0[1]
      && JSON.parse(b0[1]).ma_gui === ma && await soPhien() === p0 + 1, `${r.loi?.code || ''} · ${F.goi.length}`);
    const ma2 = maMoi(), p1 = await soPhien();
    r = await goiApi(() => { F.sau = 1; return TT.taoPhien(than({ ma: ma2 })); });
    k('B4a máy chủ GHI phiên rồi câu trả rớt → quầy gửi lại cùng mã → MỘT phiên', !r.loi && F.goi.length === 2 && await soPhien() === p1 + 1, `${r.loi?.code || ''} · ${F.goi.length} · +${await soPhien() - p1}`);
    const ma3 = maMoi(), p2 = await soPhien();
    M.sauCommit = /INSERT INTO pos_phien_thanh_toan/;
    r = await goiApi(() => TT.taoPhien(than({ ma: ma3 })));
    k('B4a kho ghi phiên rồi rớt (máy chủ 503 KHO_MAT_KET_NOI) → quầy gửi lại → MỘT phiên', !r.loi && r.kq?.phien?.id && F.goi.length === 2 && await soPhien() === p2 + 1,
      `${r.loi?.code || ''} · ${F.goi.length} · +${await soPhien() - p2}`);
    r = await goiApi(() => { P.tuChoi = true; return TT.taoPhien(than({ cach: 'payos', ma: maMoi() })); });
    P.tuChoi = false;
    k('B3b 502 PAYOS_LOI (có code) → KHÔNG gửi lại', r.loi?.code === 'PAYOS_LOI' && F.goi.length === 1, `${r.loi?.code} · ${F.goi.length}`);

    const a = await khach(20000), code = await phatVoucher(a);
    const pv = (await goiApi(() => TT.taoPhien({ ...than({ sdt: a, sl: 2, tk: true, ma: maMoi() }), don: { items: [mon(2)], customer_phone: a, customer_name: 'K', vouchers: [code] } }))).kq?.phien;
    const o0 = await soDon(), v0 = await dongVi(a), hd0 = await soHd();
    M.sauCommit = /SET trang_thai = 'da_thu'/;
    r = await goiApi(() => TT.chotPhien(pv.id, { cash_received: 50000 }));
    const gr = await D.queryOne('SELECT * FROM pos_voucher_grants WHERE UPPER(code) = UPPER(?)', [code]);
    k('B4b kho GHI đơn rồi rớt → quầy gửi lại lệnh chốt → 200 cùng đơn', !r.loi && r.kq?.order?.id && F.goi.length === 2, `${r.loi?.code || ''} ${r.loi?.message || ''} · ${F.goi.length}`);
    k('B4b đúng MỘT đơn, ví trừ MỘT lần, voucher dùng MỘT lần (đúng đơn), MỘT số hoá đơn', await soDon() === o0 + 1 && await dongVi(a) === v0 + 1 && gr?.status !== 'available'
      && Number(gr?.used_order_id) === Number(r.kq?.order?.id) && await soHd() - hd0 === 1, `đơn +${await soDon() - o0} · ví +${await dongVi(a) - v0} · voucher ${gr?.status}/${gr?.used_order_id} · HĐ +${await soHd() - hd0}`);
    const pq = (await goiApi(() => TT.taoPhien(than({ ma: maMoi() })))).kq?.phien;
    const o1 = await soDon();
    r = await goiApi(() => { F.sau = 1; return TT.chotPhien(pq.id, {}); });
    k('B4b đơn ghi xong, câu trả rớt mạng → gửi lại chốt → 200 cùng đơn, MỘT đơn', !r.loi && r.kq?.order?.id && F.goi.length === 2 && await soDon() === o1 + 1,
      `${r.loi?.code || ''} · ${F.goi.length} · +${await soDon() - o1}`);
    const pk = (await goiApi(() => TT.taoPhien(than({ ma: maMoi() })))).kq?.phien;
    r = await goiApi(() => { F.gia = [{ status: 409, than: { error: 'bận', code: 'KHO_BAN' } }, { status: 503, than: { error: 'đang', code: 'DANG_XU_LY' } }]; return TT.chotPhien(pk.id, {}); });
    k('B3c chotPhien gặp 409 KHO_BAN rồi 503 DANG_XU_LY → gửi lại (3 lần), lần 3 ra đơn', !r.loi && r.kq?.order?.id && F.goi.length === 3, `${r.loi?.code || ''} · ${F.goi.length}`);
    r = await goiApi(() => { F.truoc = 1; return O.tinhThu({ items: [mon(1)] }); });
    k('C1 ngoại lệ chủ quán duyệt (#5): ordersApi.tinhThu (POST chỉ tính) rớt mạng → tự gửi lại', !r.loi && F.goi.length === 2 && r.kq?.total === 25000, `${r.loi?.code || ''} · ${F.goi.length}`);
    r = await goiApi(() => { F.truoc = 1; return api.upload('/thu', {}); });
    const r2 = await goiApi(() => { F.truoc = 1; return api.download('/thu', 'x.csv'); });
    k('C1c upload / download rớt mạng → MAT_KET_NOI + lời tiếng Việt', r.loi?.code === 'MAT_KET_NOI' && r2.loi?.code === 'MAT_KET_NOI', `${r.loi?.code} / ${r2.loi?.code} · ${r2.loi?.message}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C2] Máy chủ: lỗi mạng tới kho → 503 KHO_MAT_KET_NOI, không lộ chữ Turso');
  await chay('C2', async () => {
    const p = (await tao({})).j.phien;
    datHong(3, /FROM pos_phien_thanh_toan/);
    let r = await goi('GET', `/pos/thanh-toan/phien/${p.id}`);
    k('C2a route đọc (GET phiên, qua loiGhi) hết lượt → 503 KHO_MAT_KET_NOI, lời đọc, không chữ Turso', la(r, 503, 'KHO_MAT_KET_NOI') && r.j.error === CAU_DOC && !LO(r.tho), r.tho.slice(0, 160));
    datHong(3, /FROM pos_orders/);
    r = await goi('GET', '/pos/orders?limit=5');
    k('C2b route trả { error: err.message } (GET /orders) → móc đổi thành 503 + code, không lộ', la(r, 503, 'KHO_MAT_KET_NOI') && !LO(r.tho), r.tho.slice(0, 160));
    hongTx(1, /INSERT INTO pos_phien_thanh_toan/);
    nhatKy.length = 0;
    r = await goi('POST', '/pos/thanh-toan/phien', than({ ma: maMoi() }));   // có mã → câu đầu giao dịch là đọc phienCuaMa, INSERT là câu SAU
    k('C2c câu GHI thứ hai trong giao dịch rớt (tạo phiên, loiGhi) → 503 KHO_MAT_KET_NOI, lời GHI', la(r, 503, 'KHO_MAT_KET_NOI') && r.j.error === CAU_GHI && !LO(r.tho), r.tho.slice(0, 160));
    hongTx(1, /INSERT INTO pos_phien_thanh_toan/);
    const r2c = await goi('POST', '/pos/thanh-toan/phien', than({}));   // không mã, tiền mặt → INSERT là câu ĐẦU (mở giao dịch + câu đầu)
    k('C2c2 câu ĐẦU của giao dịch rớt (mở + INSERT) → 503 KHO_MAT_KET_NOI, lời GHI', la(r2c, 503, 'KHO_MAT_KET_NOI') && r2c.j.error === CAU_GHI && !LO(r2c.tho), r2c.tho.slice(0, 160));
    k('C2f log (loiGhi / console.error(x, err)) KHÔNG chứa địa chỉ kho / chữ Turso', !nhatKy.some((x) => /turso\.io|socket hang up/.test(x)), JSON.stringify(nhatKy.filter((x) => LO(x))).slice(0, 200));
    datHong(1, /FROM pos_orders/, () => Object.assign(new Error('loi la KN1 khong phai mang'), { code: 'SQLITE_MISUSE' }));
    r = await goi('GET', '/pos/orders?limit=5');
    k('C2d lỗi 500 KHÔNG phải mạng → thân giữ nguyên như cũ (móc không đụng)', r.status === 500 && r.j.error === 'loi la KN1 khong phai mang' && r.j.code === undefined, r.tho.slice(0, 160));
    datHong(3, /FROM pos_users/);
    r = await goi('GET', `/pos/thanh-toan/phien/${p.id}`);
    k('C2e middleware/auth.js 500 (tra nhân viên) khi kho rớt → 503 KHO_MAT_KET_NOI, không lộ', la(r, 503, 'KHO_MAT_KET_NOI') && !LO(r.tho), r.tho.slice(0, 160));
    const res = { s: 0, j: null, status(x) { this.s = x; return this; }, json(x) { this.j = x; return this; } };
    const daTra = typeof D.traLoiKho === 'function' && D.traLoiKho(res, Object.assign(new Error(CAU_GHI), { code: 'KHO_MAT_KET_NOI' }));
    const khongTra = typeof D.traLoiKho === 'function' && D.traLoiKho({ ...res }, new Error('khac'));
    const idx = fs.readFileSync(path.join(MAY_CHU, 'index.js'), 'utf8');
    k('C2e traLoiKho: lỗi KHO_MAT_KET_NOI → 503 { error, code }; lỗi khác → không trả; bắt lỗi cuối index.js gọi nó TRƯỚC 500', daTra === true && res.s === 503
      && res.j?.code === 'KHO_MAT_KET_NOI' && res.j?.error === CAU_GHI && khongTra === false && /app\.use\(\(err, req, res, next\) => \{\s*if \(traLoiKho\(res, err\)\) return;/.test(idx),
      `${daTra} ${res.s} ${khongTra}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] Màn Bán hàng: nút thu khi chưa có số máy chủ · lời lỗi tính giá · câu B5 · mã lượt bấm (tinh.js thật + ThuTien.jsx thật)');
  await chay('E', async () => {
    const T = await import(pathToFileURL(path.join(SRC, 'pages', 'BanHang', 'tinh.js')).href);
    const nh = T.nhanhNutThu || (() => 'khong_co');
    k('E1a chưa có số máy chủ (coSo sai) → "cho" dù phaiTra 0 / có tiền', nh({ coSo: false, phaiTra: 0 }) === 'cho' && nh({ coSo: false, phaiTra: 25000 }) === 'cho');
    k('E1b có số: phaiTra 0 → "het" (đơn 0đ THẬT vẫn hiện); phaiTra > 0 → "tra"', nh({ coSo: true, phaiTra: 0 }) === 'het' && nh({ coSo: true, phaiTra: 1 }) === 'tra');
    // ThuTien.jsx THẬT: React tối giản (useState), dò chữ trên cây vẽ ra.
    const tao2 = (type, props) => ({ type, props: props || {} });
    globalThis.__KN1_REACT = { useState: (d) => [typeof d === 'function' ? d() : d, () => {}], jsx: tao2, jsxs: tao2, Fragment: 'frag' };
    const vo = { name: 'kn1', setup(b) { b.onResolve({ filter: /^react(\/jsx-runtime)?$/ }, () => ({ path: 'react', namespace: 'kn1' }));
      b.onLoad({ filter: /.*/, namespace: 'kn1' }, () => ({ loader: 'js', contents: 'module.exports = globalThis.__KN1_REACT;' })); } };
    const kq = await esbuild.build({ entryPoints: [path.join(SRC, 'pages', 'BanHang', 'ThuTien.jsx')], bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic',
      logLevel: 'silent', plugins: [vo] });
    const m = { exports: {} };
    new Function('module', 'exports', 'require', kq.outputFiles[0].text)(m, m.exports, require);
    const chu = (n) => (n == null || typeof n === 'boolean' ? '' : Array.isArray(n) ? n.map(chu).join('') : typeof n !== 'object' ? String(n) : chu(n.props?.children));
    const ve = (coSo, phaiTra) => chu(m.exports.default({ coSo, tong: phaiTra, phaiTra, khach: null, soDuDung: 0, soDuMeDung: 0, cachTra: 'tien_mat', onCachTra() {},
      cachConLai: 'tien_mat', onCachConLai() {}, laNap: false, laThe: false, dungMe: false, onDungMe() {}, dangGui: false, onThu() {} }));
    const a = ve(false, 0), b = ve(true, 0), c = ve(true, 25000);
    k('E1a ThuTien.jsx: chưa có số máy chủ → KHÔNG có "Đơn 0đ — hoàn tất" / "Trả đủ bằng tài khoản" / "Đã nhận tiền"; vẫn "Đang tính…"',
      !/Đơn 0đ|Trả đủ bằng tài khoản|Đã nhận tiền|Hiện mã QR/.test(a) && /Đang tính…/.test(a), a.slice(0, 160));
    k('E1b ThuTien.jsx: số máy chủ = 0 → "Đơn 0đ — hoàn tất"; > 0 → "Đã nhận tiền"', /Đơn 0đ — hoàn tất/.test(b) && /Đã nhận tiền/.test(c), `${b.slice(-60)} | ${c.slice(-40)}`);
    const lt = T.loiTinhGia || ((e) => e.message);
    k('E2a lời tính giá: MAT_KET_NOI / KHO_MAT_KET_NOI → "Mất kết nối, bấm Thử lại"', lt({ code: 'MAT_KET_NOI', message: 'x' }) === 'Mất kết nối, bấm Thử lại'
      && lt({ code: 'KHO_MAT_KET_NOI', status: 503, message: CAU_DOC }) === 'Mất kết nối, bấm Thử lại');
    k('E2b lỗi nghiệp vụ (400 có code) → giữ lời máy chủ', lt({ status: 400, code: 'MA_HET_HAN', message: 'Mã đã hết hạn' }) === 'Mã đã hết hạn');
    k('B5a câu B5 đúng chữ phiếu, MỘT chỗ (tinh.js CAU_CHUA_BIET_DON)', T.CAU_CHUA_BIET_DON === CAU_B5, String(T.CAU_CHUA_BIET_DON));
    const vk = T.viecKhiThuHong || (() => 'khong_co');
    const mk = { code: 'MAT_KET_NOI' };
    k('B3d viecKhiThuHong: tạo phiên hết lượt lỗi mạng → bao_chua_biet (KHÔNG nhả); lỗi khác → bao_loi', vk({ loi: mk, daCoPhien: false, hoi: null }) === 'bao_chua_biet'
      && vk({ loi: { code: 'KHO_MAT_KET_NOI' }, daCoPhien: false, hoi: null }) === 'bao_chua_biet' && vk({ loi: { code: 'PIN_SAI' }, daCoPhien: false, hoi: null }) === 'bao_loi');
    k('B3d viecKhiThuHong: chốt hỏng + hỏi được da_thu → xong; cho / huy → nha; hỏi hỏng → bao_chua_biet',
      vk({ loi: mk, daCoPhien: true, hoi: { trang_thai: 'da_thu' } }) === 'xong' && vk({ loi: mk, daCoPhien: true, hoi: { trang_thai: 'cho' } }) === 'nha'
      && vk({ loi: { code: 'X' }, daCoPhien: true, hoi: { trang_thai: 'huy' } }) === 'nha' && vk({ loi: mk, daCoPhien: true, hoi: null }) === 'bao_chua_biet');
    const g = [{ key: 1, product_id: 5, quantity: 1, note: '' }];
    const t1 = T.thanPhien({ gio: g, khach: null, ma: '', cach: 'tien_mat', dungTK: false, dungMe: false, maGui: 'abcd1234' });
    const t0 = T.thanPhien({ gio: g, khach: null, ma: '', cach: 'tien_mat', dungTK: false, dungMe: false });
    k('B5b thanPhien có maGui → than.ma_gui; KHÔNG truyền → không có trường (lời gọi cũ)', t1.ma_gui === 'abcd1234' && !('ma_gui' in t0), JSON.stringify(t1).slice(0, 100));
    const bh = fs.readFileSync(path.join(SRC, 'pages', 'BanHang', 'BanHangMoi.jsx'), 'utf8');
    k('B5a BanHangMoi: không còn câu cũ "Mất kết nối khi chốt"; dùng CAU_CHUA_BIET_DON + viecKhiThuHong trong chayPhien', !/Mất kết nối khi chốt/.test(bh)
      && /setLoi\(CAU_CHUA_BIET_DON\)/.test(bh) && /viecKhiThuHong\(\{ loi: e, daCoPhien: !!p, hoi \}\)/.test(bh), '');
    k('B1/B3 BanHangMoi: mỗi lần chayPhien sinh MỘT mã (maGuiMoi) gửi trong thân; lời tính giá qua loiTinhGia', /maGui: maGuiMoi\(\)/.test(bh) && /setLoiTinh\(loiTinhGia\(e\)\)/.test(bh));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] Đo chậm: [CHAM] > 2 giây · số câu kho của ba đường (F2 chỉ đo + báo cáo)');
  await chay('F', async () => {
    k('F1 ngưỡng chậm là MỘT hằng 2000 ms', D.NGUONG_CHAM_MS === 2000, String(D.NGUONG_CHAM_MS));
    const ix = fs.readFileSync(path.join(MAY_CHU, 'index.js'), 'utf8');
    const vt = (s) => ix.indexOf(s);
    k('F1 index.js: bọc fetch toàn cục (đo "ngoài"); gắn doYeuCau + mocLoiKho SAU bộ đọc thân, TRƯỚC route đầu tiên', /globalThis\.fetch = bocFetchNgoai\(globalThis\.fetch\);/.test(ix)
      && vt("app.use('/api', doYeuCau);") > vt('app.use(express.json(') && vt("app.use('/api/pos', mocLoiKho);") > vt('app.use(express.json(')
      && vt("app.use('/api', doYeuCau);") < vt("app.use('/api/pos/auth'") && vt("app.use('/api/pos', mocLoiKho);") < vt("app.use('/api/pos/auth'"),
      [vt("app.use('/api', doYeuCau);"), vt("app.use('/api/pos', mocLoiKho);"), vt('app.use(express.json('), vt("app.use('/api/pos/auth'")].join(' '));
    const c0 = dem().cham || {};
    imLang(); giuLog = true;
    nhatKy.length = 0;
    let r = await goi('GET', '/pos/thu-cham/1800?sdt=0912345678');
    await ngu(80);
    k('F1 yêu cầu 1,8 giây (ngay DƯỚI ngưỡng) → KHÔNG có dòng [CHAM]', la(r, 200) && !nhatKy.some((x) => x.includes('[CHAM]')), JSON.stringify(nhatKy.filter((x) => x.includes('[CHAM]'))));
    nhatKy.length = 0;
    r = await goi('GET', '/pos/thu-cham/2150?sdt=0912345678');
    await ngu(80);
    const dong = nhatKy.filter((x) => x.includes('[CHAM]'));
    giuLog = false; noiLai();
    const mm = /^\[CHAM\] GET (\S+) · (\d+) ms · kho (\d+) câu \/ (\d+) ms · ngoài (\d+) ms$/.exec(dong[0] || '');
    k('F1 yêu cầu 2,15 giây (ngay TRÊN ngưỡng) → MỘT dòng [CHAM] đúng dạng; kho 1 câu; ngoài ≥ 60 ms', la(r, 200) && dong.length === 1 && !!mm && Number(mm[2]) > 2000
      && mm[3] === '1' && Number(mm[5]) >= 60, JSON.stringify(dong));
    k('F1 dòng [CHAM] KHÔNG có SĐT / tham số / số trong đường dẫn', !!mm && !/0912345678|\?|2150/.test(dong[0]) && mm[1] === '/api/pos/thu-cham/:x', dong[0]);
    const c1 = dem().cham || {};
    k('F3 demKetNoi().cham: so_lan +1, lau_nhat_ms ≥ 2150, luc giờ VN', c1.so_lan === (c0.so_lan || 0) + 1 && c1.lau_nhat_ms >= 2150 && /^\d{4}-\d\d-\d\dT/.test(String(c1.luc)), JSON.stringify(c1));

    // F2 — đo số câu kho (chỉ đo + báo cáo)
    const a = await khach(0);
    doLan.length = 0;
    const p = await goi('POST', '/pos/thanh-toan/phien', { cach: 'tien_mat', don: { items: [mon(2)], customer_phone: a, customer_name: 'K' }, ma_gui: maMoi() });
    await goi('POST', `/pos/thanh-toan/phien/${p.j.phien?.id}/chot`, { cash_received: 50000 });
    await goi('POST', '/pos/orders/tinh-thu', { items: [mon(2)], customer_phone: a, customer_name: 'K' });
    await D.run(`INSERT INTO pos_giao_chuyen (order_id, ten_nhan, sdt_nhan, dia_chi, loai_xe, trang_thai, ma_ahamove, tao_luc) VALUES (?, 'Nhận', '0900000002', 'Địa chỉ', 'BIKE', 'tim_xe', 'AHAKN1', ?)`,
      [990001, getNow()]);
    const bao = await (async () => { imLang(); try { return await fetchThat(`${goc}/giao-hang/ahamove-bao`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: AHA.bao },
      body: JSON.stringify({ _id: 'AHAKN1', status: 'ACCEPTED' }) }); } finally { noiLai(); } })();
    await ngu(50);
    const tim = (re) => doLan.filter((x) => re.test(x.duong)).pop();
    const ds = [['tạo phiên tiền mặt', tim(/POST \/api\/pos\/thanh-toan\/phien$/)], ['chốt tiền mặt', tim(/\/chot$/)], ['tinh-thu', tim(/tinh-thu$/)],
      ['tin báo Ahamove', tim(/ahamove-bao$/)]];
    for (const [ten, x] of ds) console.log(`  ĐO F2 ${ten}: ${x ? `${x.cau} câu kho tuần tự · kho ${x.khoMs} ms · ngoài ${x.ngoaiMs} ms` : 'KHÔNG ĐO ĐƯỢC'}`);
    k('F2 đo được số câu kho (> 0) cho tạo phiên, chốt tiền mặt, tinh-thu, tin báo Ahamove (tin báo 200)', ds.every(([, x]) => x && x.cau > 0) && bao.status === 200,
      ds.map(([t, x]) => `${t}=${x?.cau}`).join(' '));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] server/index.js THẬT trong tiến trình con: health ket_noi + cham, móc 503, log không lộ');
  await chay('G', async () => {
    const { spawn } = require('child_process');
    const CO = path.join(THU_MUC, 'rot_mang.co');
    const preload = path.join(THU_MUC, 'nap_truoc.js');
    fs.writeFileSync(preload, `const fs = require('fs');
const p = require.resolve(${JSON.stringify(path.join(MAY_CHU, 'ketNoiKho.js'))});
require.cache[p] = { id: p, filename: p, loaded: true, exports: { laMayThu: () => true,
  cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + ${JSON.stringify(path.join(THU_MUC, 'kho_con.db'))} } }), diaChiSX: () => '', FILE_THU: '' } };
const lib = require(require.resolve('@libsql/client', { paths: [${JSON.stringify(MAY_CHU)}] }));
const tao = lib.createClient;
lib.createClient = (cfg) => { const c = tao(cfg); const e = c.execute.bind(c);
  c.execute = async (st) => { if (fs.existsSync(${JSON.stringify(CO)})) throw Object.assign(new Error('request to ${DIA_CHI_KHO} failed, reason: socket hang up'),
    { name: 'FetchError', type: 'system', code: 'ECONNRESET' }); return e(st); }; return c; };
`);
    const congCon = await new Promise((ok) => { const t = require('net').createServer().listen(0, '127.0.0.1', () => { const x = t.address().port; t.close(() => ok(x)); }); });
    const con = spawn(process.execPath, ['-r', preload, path.join(MAY_CHU, 'index.js')], {
      cwd: GOC, env: { ...process.env, PORT: String(congCon), REPL_ID: '', REPLIT: '' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    con.stdout.on('data', (x) => { log += x; });
    con.stderr.on('data', (x) => { log += x; });
    const hoi = (duong, than) => new Promise((ok) => {
      const body = than ? JSON.stringify(than) : '';
      const yc = http.request({ host: '127.0.0.1', port: congCon, path: duong, method: than ? 'POST' : 'GET',
        headers: than ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {} }, (res) => {
        let t = ''; res.on('data', (x) => { t += x; }); res.on('end', () => { let j = {}; try { j = JSON.parse(t); } catch { /* */ } ok({ status: res.statusCode, j, tho: t }); });
      });
      yc.on('error', () => ok({ status: 0, j: {}, tho: '' }));
      yc.end(body);
    });
    try {
      let h = { status: 0 };
      for (let i = 0; i < 150 && h.status !== 200; i++) { h = await hoi('/api/pos/health'); if (h.status !== 200) await ngu(200); }
      const kn = h.j.ket_noi || {};
      k('G1 GET /api/pos/health có ket_noi { rot, thu_lai_dat, thu_lai_hong, tu, cham { so_lan, lau_nhat_ms, luc } }', h.status === 200
        && ['rot', 'thu_lai_dat', 'thu_lai_hong', 'tu'].every((x) => x in kn) && kn.cham && ['so_lan', 'lau_nhat_ms', 'luc'].every((x) => x in kn.cham), JSON.stringify(h.j).slice(0, 200));
      fs.writeFileSync(CO, '1');
      const dn = await hoi('/api/pos/auth/login', { username: 'admin', password: 'sai_kn1' });
      fs.rmSync(CO, { force: true });
      k('G2 kho rớt khi đăng nhập (route trả err.message) → 503 KHO_MAT_KET_NOI, không chữ Turso', dn.status === 503 && dn.j.code === 'KHO_MAT_KET_NOI' && !LO(dn.tho), `${dn.status} ${dn.tho.slice(0, 160)}`);
      const h2 = await hoi('/api/pos/health');
      k('G3 health sau lần rớt: rot ≥ 3, thu_lai_hong ≥ 1', (h2.j.ket_noi?.rot || 0) >= 3 && (h2.j.ket_noi?.thu_lai_hong || 0) >= 1, JSON.stringify(h2.j.ket_noi));
      k('G4 log máy chủ thật KHÔNG chứa địa chỉ kho / "socket hang up"; có dòng [KET-NOI]', !/turso\.io|socket hang up/.test(log) && /\[KET-NOI\]/.test(log),
        log.split('\n').filter((x) => LO(x) || /KET-NOI/.test(x)).slice(0, 3).join(' | '));
    } finally { con.kill(); }
  });

  noiLai();
  globalThis.fetch = fetchThat;
  console.log(`\n${hong ? C.do : C.xanh}${C.dam}KET-NOI-1: ${dat} đạt · ${hong} hỏng · tổng ${dat + hong} ca${C.het}`);
  sv.close(); svGia.close();
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.error('✖ Bài thử sập:', e.stack || e.message); process.exit(2); });
