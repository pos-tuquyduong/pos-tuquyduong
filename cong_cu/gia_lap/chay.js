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
 *  thêm trễ ~40 ms vào MỌI lệnh tới kho trong lúc chạy kịch bản (bài học P19),
 *  chạy kich_ban.js như nhân viên bấm, và sau MỖI kịch bản kiểm bat_bien.js
 *  (SQL chỉ đọc, KHÔNG cộng trễ — LUOI-1 A1: kiểm sổ đọc tuần tự, không có gì
 *  chồng nhau). Trễ bật lại và SX giả hết lỗi TRƯỚC mỗi kịch bản.
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
const http = require('http');
const crypto = require('crypto');

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
  const xau = Object.keys(bien).filter((t) => BIEN_MAY_THAT.test(t) || mien.some((m) => String(bien[t]).toLowerCase().includes(m.toLowerCase())));
  return xau.length ? `môi trường có biến của máy thật: ${xau.join(', ')} (không in giá trị)` : '';
}
const lyDo = kiemAnToan();
if (lyDo) { viet(`Giả lập: TỪ CHỐI chạy — ${lyDo}`); process.exit(3); }
if (process.argv.includes('--chi-kiem-an-toan')) { viet('Giả lập: an toàn: qua'); process.exit(0); }

// ── A2 · kho tạm, xoá kể cả khi sập ─────────────────────────────────────────
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'gia_lap_'));
process.on('exit', () => { try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ } });
for (const tin of ['SIGTERM', 'SIGINT']) process.on(tin, () => process.exit(2));   // bộ kiểm hết giờ gửi SIGTERM → vẫn dọn
const sap = (e) => { viet(`Giả lập: SẬP — ${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' · ') : e}`); process.exit(2); };

async function main() {
  const MAY_CHU = fs.realpathSync(path.resolve(thamSo('--may-chu', path.join(GOC, 'server'))));
  const tim = (ten) => require.resolve(ten, { paths: [MAY_CHU] });
  const datCache = (p, exports) => { require.cache[p] = { id: p, filename: p, loaded: true, exports }; };
  // Log của máy chủ (mỗi request một dòng) không phải kết quả — tắt; kết quả in bằng viet().
  console.log = () => {}; console.warn = () => {}; console.error = () => {};

  // B2 · SX giả: trả tồn, GHI mọi lệnh trừ/hoàn kho kèm vân tay, chống trùng như SX thật (sxApi.js:174).
  // LUOI-1 B4: công tắc lỗi — kịch bản gọi ctx.batSxLoi(); MẶC ĐỊNH tắt, tự tắt trước mỗi kịch bản. Lúc lỗi: trả 503,
  // KHÔNG nhận, ghi lần lỗi (vân tay + kịch bản) vào sxGia.hong để bất biến I7 đối chiếu sổ nợ kho.
  const express = require(tim('express'));
  const nhanKho = [];
  const sxGia = { loi: false, kb: 0, hong: [], kbBat: new Set() };
  const sx = express();
  sx.use(express.json());
  sx.get('/api/finished-products/check-stock', (q, r) => r.json({ sufficient: true, stock: 999 }));
  for (const chieu of ['out', 'in']) {
    sx.post('/api/pos/stock/' + chieu, (q, r) => {
      const vt = q.body.van_tay || null;
      if (sxGia.loi) { sxGia.hong.push({ chieu, van_tay: vt, kb: sxGia.kb }); return r.status(503).json({ error: 'SX giả đang lỗi' }); }
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
  bienGia.JWT_SECRET = 'gia_lap_' + crypto.randomBytes(16).toString('hex');   // ngẫu nhiên: giả lập song song không trùng khoá
  bienGia.POS_SERVICE_API_KEY = 'khoa_dich_vu_gia_lap';
  bienGia.SX_API_KEY = 'khoa_sx_gia_lap';
  // Cổng 0: hệ điều hành cấp cổng lúc index.js listen; bắt đúng máy chủ đó để đọc cổng THẬT. Không "mượn cổng rồi đóng"
  // (TOCTOU — soát vòng 2 bắt: giả lập song song lấy mất cổng, yêu cầu rơi sang máy khác → 401).
  bienGia.PORT = '0';
  const listenGoc = http.Server.prototype.listen;
  let mayPos = null;
  http.Server.prototype.listen = function (...a) { mayPos = mayPos || this; return listenGoc.apply(this, a); };

  // Móc trước giao dịch (KB11): vá database.js TRƯỚC khi route lấy beginTransaction (orders.js:13).
  const db = require(path.join(MAY_CHU, 'database.js'));
  const txGoc = db.beginTransaction;
  const moc = { truocTx: null };
  db.beginTransaction = async (...a) => { const m = moc.truocTx; moc.truocTx = null; if (m) await m(); return txGoc(...a); };

  // B1 · máy chủ THẬT: nạp nguyên index.js (tự initDatabase rồi mới listen).
  require(path.join(MAY_CHU, 'index.js'));
  for (let i = 0; !mayPos?.listening; i++) {
    if (i > 100) throw new Error('máy chủ không lên sau 10 s');
    await new Promise((ok) => setTimeout(ok, 100));
  }
  http.Server.prototype.listen = listenGoc;
  const goc = `http://127.0.0.1:${mayPos.address().port}/api/pos`;
  if (!(await fetch(goc + '/health')).ok) throw new Error('máy chủ của giả lập không trả lời /health');

  const jwt = require(tim('jsonwebtoken'));
  const q = async (sql, a = []) => db.query(sql, a);
  const ctx = { db, q, moc, nhanKho, doLenh, sxGia, soQuay: { thu: new Map(), doi: new Map(), tangMa: new Map(), giaoGoi: new Map() },
    http: [], batSxLoi: () => { sxGia.loi = true; sxGia.kbBat.add(sxGia.kb); } };
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

  const lech = [];
  const daThay = new Set();
  const tenBB = Object.keys(BAT_BIEN);
  let soKB = 0;
  for (const [i, kb] of KICH_BAN.entries()) {
    if (i + 1 > DEN_KB) break;
    soKB++;
    treMs = TRE_MS;   // A1: trễ bật lại TRƯỚC mỗi kịch bản
    sxGia.loi = false;   // B4: SX giả hết lỗi trước mỗi kịch bản
    sxGia.kb = i + 1;
    ctx.http = [];
    try { await kb.chay(ctx); } catch (e) { ctx.http.push('SẬP giữa kịch bản: ' + e.message); }
    treMs = 0;   // A1: bất biến không cộng trễ
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
