#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GIẢ LẬP QUẦY POS (TU-CHAY-4) — "một ngày bán hàng trong vài chục giây"
 * ═══════════════════════════════════════════════════════════════════════════
 *  Chạy ở GỐC kho:  node cong_cu/gia_lap/chay.js [--may-chu <thư mục server>] [--den-kb <n>]
 *                   [--cau-hinh <cau_hinh.json>] [--chi-kiem-an-toan]
 *
 *  Bật NGUYÊN server/index.js thật (đúng route, middleware, thứ tự mount như
 *  production) trên một file kho TẠM, trỏ SX vào một SX giả ghi lại vân tay,
 *  thêm trễ ~40 ms vào MỌI lệnh tới kho (bài học P19), chạy kich_ban.js như
 *  nhân viên bấm, và sau MỖI kịch bản kiểm bat_bien.js (SQL chỉ đọc).
 *
 *  AN TOÀN (A1, A2): thấy biến môi trường của máy thật → TỪ CHỐI, thoát 3.
 *  Không đọc .env, không chạm data/, không nối Turso. Kho tạm xoá khi xong,
 *  kể cả khi sập. File này giữ phần an toàn — kịch bản và bất biến nằm ở
 *  file riêng để việc sau sửa chúng mà không mở được phần này (F3).
 *
 *  Thoát: 0 ĐẠT · 1 KHÔNG ĐẠT (lệch bất biến / HTTP) · 2 sập · 3 từ chối chạy.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');

const GOC = path.join(__dirname, '..', '..');
const thamSo = (ten, macDinh) => { const i = process.argv.indexOf(ten); return i > 0 ? process.argv[i + 1] : macDinh; };
const CAU_HINH = path.resolve(thamSo('--cau-hinh', path.join(GOC, 'tu_chay', 'cau_hinh.json')));
const DEN_KB = Number(thamSo('--den-kb', 1e9));
const TRE_MS = 40;
const viet = (s) => process.stdout.write(s + '\n');

// ── A1 · trước MỌI require của máy chủ ──────────────────────────────────────
const BIEN_MAY_THAT = /^(TURSO_.*|DATABASE_URL|SX_API_URL|SX_API_URL_THU|SX_API_KEY|JWT_SECRET|POS_SERVICE_API_KEY)$/;
function kiemAnToan() {
  let mien = null;
  try { mien = JSON.parse(fs.readFileSync(CAU_HINH, 'utf8')).ten_mien_production; } catch { /* hỏng = từ chối */ }
  if (!Array.isArray(mien) || !mien.length || mien.some((m) => typeof m !== 'string' || !m)) {
    return `không đọc được ten_mien_production trong ${CAU_HINH}`;
  }
  const bien = process.env;
  const xau = Object.keys(bien).filter((t) => BIEN_MAY_THAT.test(t) || mien.some((m) => String(bien[t]).includes(m)));
  return xau.length ? `môi trường có biến của máy thật: ${xau.join(', ')} (không in giá trị)` : '';
}
const lyDo = kiemAnToan();
if (lyDo) { viet(`Giả lập: TỪ CHỐI chạy — ${lyDo}`); process.exit(3); }
if (process.argv.includes('--chi-kiem-an-toan')) { viet('Giả lập: an toàn: qua'); process.exit(0); }

// ── A2 · kho tạm, xoá kể cả khi sập ─────────────────────────────────────────
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'gia_lap_'));
process.on('exit', () => { try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ } });
const sap = (e) => { viet(`Giả lập: SẬP — ${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' · ') : e}`); process.exit(2); };

async function main() {
  const MAY_CHU = fs.realpathSync(path.resolve(thamSo('--may-chu', path.join(GOC, 'server'))));
  const tim = (ten) => require.resolve(ten, { paths: [MAY_CHU] });
  const datCache = (p, exports) => { require.cache[p] = { id: p, filename: p, loaded: true, exports }; };
  // Log của máy chủ (mỗi request một dòng) không phải kết quả — tắt; kết quả in bằng viet().
  console.log = () => {}; console.warn = () => {}; console.error = () => {};

  // B2 · SX giả: trả tồn, GHI mọi lệnh trừ/hoàn kho kèm vân tay, chống trùng như SX thật (sxApi.js:174).
  const express = require(tim('express'));
  const nhanKho = [];
  const sx = express();
  sx.use(express.json());
  sx.get('/api/finished-products/check-stock', (q, r) => r.json({ sufficient: true, stock: 999 }));
  for (const chieu of ['out', 'in']) {
    sx.post('/api/pos/stock/' + chieu, (q, r) => {
      const vt = q.body.van_tay || null;
      const lap = vt && nhanKho.some((x) => x.van_tay === vt);
      nhanKho.push({ chieu, van_tay: vt, so_luong: q.body.quantity });
      r.json(lap ? { success: true, da_lam_roi: true, lam_luc: 'truoc' } : { success: true });
    });
  }
  sx.use((q, r) => r.status(404).json({ error: 'SX giả không có đường ' + q.path }));
  const sxMay = await new Promise((ok) => { const s = sx.listen(0, '127.0.0.1', () => ok(s)); });

  // A2 · kho qua ketNoiKho (nơi DUY NHẤT quyết định kết nối — P8), như cong_cu/thu_P20.js.
  const FILE_KHO = path.join(THU_MUC, 'kho.db');
  datCache(path.join(MAY_CHU, 'ketNoiKho.js'), {
    laMayThu: () => true,
    cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }),
    diaChiSX: () => `http://127.0.0.1:${sxMay.address().port}`,
    FILE_THU: FILE_KHO,
  });
  datCache(tim('dotenv'), { config: () => ({ parsed: {} }) });   // .env của máy KHÔNG bao giờ được nạp

  // B3 · trễ mạng: bọc client libsql; đo thời gian thật của từng lệnh để tự kiểm trễ đang bật.
  let treMs = 0;
  const doLenh = [];
  const tre = (f) => async (...a) => {
    if (!treMs) return f(...a);
    const t0 = Date.now();
    await new Promise((ok) => setTimeout(ok, treMs));
    try { return await f(...a); } finally { doLenh.push(Date.now() - t0); }
  };
  const boc = (doi, ten) => new Proxy(doi, {
    get(t, k) {
      const v = t[k];
      if (typeof v !== 'function') return v;
      if (ten.includes(k)) return tre(v.bind(t));
      return v.bind(t);
    },
  });
  const libsql = require(tim('@libsql/client'));
  datCache(tim('@libsql/client'), { ...libsql, createClient: (ch) => {
    const c = libsql.createClient(ch);
    const tx = c.transaction.bind(c);
    return new Proxy(boc(c, ['execute', 'batch']), {
      get(t, k) { return k === 'transaction' ? tre(async (...a) => boc(await tx(...a), ['execute', 'commit', 'rollback'])) : t[k]; },
    });
  } });

  // Khoá GIẢ — chỉ đặt SAU phép kiểm A1.
  const bienGia = process.env;
  bienGia.JWT_SECRET = 'gia_lap_' + Date.now();
  bienGia.POS_SERVICE_API_KEY = 'khoa_dich_vu_gia_lap';
  bienGia.SX_API_KEY = 'khoa_sx_gia_lap';
  bienGia.PORT = String(await new Promise((ok) => { const s = net.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); }));

  // Móc trước giao dịch (KB11): vá database.js TRƯỚC khi route lấy beginTransaction (orders.js:13).
  const db = require(path.join(MAY_CHU, 'database.js'));
  const txGoc = db.beginTransaction;
  const moc = { truocTx: null };
  db.beginTransaction = async (...a) => { const m = moc.truocTx; moc.truocTx = null; if (m) await m(); return txGoc(...a); };

  // B1 · máy chủ THẬT: nạp nguyên index.js (tự initDatabase rồi mới listen).
  require(path.join(MAY_CHU, 'index.js'));
  const goc = `http://127.0.0.1:${bienGia.PORT}/api/pos`;
  for (let i = 0; ; i++) {
    try { if ((await fetch(goc + '/health')).ok) break; } catch { /* chưa lên */ }
    if (i > 100) throw new Error('máy chủ không lên sau 10 s');
    await new Promise((ok) => setTimeout(ok, 100));
  }

  const jwt = require(tim('jsonwebtoken'));
  const q = async (sql, a = []) => db.query(sql, a);
  const ctx = { db, q, moc, nhanKho, doLenh, soQuay: { thu: new Map(), doi: new Map() }, http: [] };
  const goi = async (ai, method, url, body) => {
    const headers = { 'Content-Type': 'application/json' };
    if (ai === 'dv') headers['X-Service-Key'] = bienGia.POS_SERVICE_API_KEY;
    else headers.Authorization = 'Bearer ' + ctx.token[ai];
    const r = await fetch(goc + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    let j = {};
    try { j = await r.json(); } catch { /* không phải JSON */ }
    return { ...j, status: r.status };
  };
  ctx.goi = goi;
  ctx.mong = (ten, dung, nhan) => { if (!dung) ctx.http.push(`${ten}: ${nhan}`); return dung; };

  const { KICH_BAN, dungDuLieu } = require('./kich_ban.js');
  const { BAT_BIEN } = require('./bat_bien.js');
  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const nv = await db.run(`INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES ('nv_gia_lap', 'x', 'Nhân viên 2', 'staff', 1)`);
  ctx.token = { chu: jwt.sign({ userId: chu.id }, bienGia.JWT_SECRET), nv: jwt.sign({ userId: Number(nv.lastInsertRowid) }, bienGia.JWT_SECRET) };
  await dungDuLieu(ctx);   // B4 — tự khẳng định, sai thì ném lỗi → sập
  treMs = TRE_MS;

  const lech = [];
  const daThay = new Set();
  const tenBB = Object.keys(BAT_BIEN);
  let soKB = 0;
  for (const [i, kb] of KICH_BAN.entries()) {
    if (i + 1 > DEN_KB) break;
    soKB++;
    ctx.http = [];
    try { await kb.chay(ctx); } catch (e) { ctx.http.push('SẬP giữa kịch bản: ' + e.message); }
    for (const h of ctx.http) lech.push(`KB${i + 1} → HTTP: ${h}`);
    for (const ten of tenBB) {
      for (const l of await BAT_BIEN[ten](q, ctx)) {
        if (daThay.has(ten + l)) continue;
        daThay.add(ten + l);
        lech.push(`KB${i + 1} → ${ten}: ${l}`);
      }
    }
  }
  const tong = `Giả lập: ${soKB} kịch bản · ${tenBB.length} bất biến`;
  if (lech.length) { lech.forEach((l) => viet('  ✗ ' + l)); viet(`${tong} · KHÔNG ĐẠT (${lech.length} lệch)`); process.exit(1); }
  viet(`${tong} · ĐẠT`);
  process.exit(0);
}

main().catch(sap);
