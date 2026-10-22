#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ P15-QR — QR thành viên không đoán được: sinh mã, đổi mã cũ, tra QR ở quầy, khách xem QR của mình
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (QR = 'QR-' + SĐT). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_P15QR.js
 *
 *  Khuôn thu_KH1.js: database.js thật + libsql thật trên file kho TẠM; chỉ thay ketNoiKho (P8), tắt SX (ô tìm khách chạy
 *  nhánh dự phòng pos_customers — nhánh SX thật CHƯA KIỂM). Express riêng mount ĐÚNG đường như index.js. Riêng D4 chạy
 *  server/index.js THẬT (tiến trình con, cùng file kho) để soi đúng bộ ghi nhật ký yêu cầu.
 *  A7 dựng trùng mã TẤT ĐỊNH: ghi lại các lần rút crypto.randomBytes từ helpers.js khi tạo một khách, rồi phát lại đúng
 *  chuỗi đó cho lần rút đầu của chỗ gọi đang thử — chỗ gọi nào không sinh lại khi trùng thì hỏng.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_p15qr_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_p15qr_nv_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_p15qr_kh_' + Date.now();
process.env.GUI_MA_KHACH = 'gia';
delete process.env.SX_API_KEY;

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); }
  else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const nhatKy = [];
const imLang = () => { console.log = console.error = console.warn = (...a) => nhatKy.push(a.join(' ')); };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const DANG_MOI = /^TQD-[A-Z2-9]{12}$/;

// Ghi / phát lại các lần rút ngẫu nhiên của helpers.js (A7). Lần rút từ chỗ khác (fetch, multer…) đi thẳng.
const rutGoc = crypto.randomBytes;
let soRut = 0, ghi = null, phat = null;
crypto.randomBytes = function (...a) {
  if (!/helpers\.js/.test(new Error().stack)) return rutGoc.apply(this, a);
  soRut++;
  if (phat && phat.boQua > 0) phat.boQua--;
  else if (phat && phat.ds.length) return Buffer.from(phat.ds.shift());
  const b = rutGoc.apply(this, a);
  if (ghi) ghi.push(Buffer.from(b));
  return b;
};

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const H = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  const { kyTokenKhach } = require(path.join(GOC, 'server', 'middleware', 'khachAuth.js'));
  const guiMa = require(path.join(GOC, 'server', 'utils', 'guiMaKhach.js'));
  await db.initDatabase();
  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/customers', require(R('customers.js')));
  app.use('/api/pos/v2/customers', require(R('customers-v2.js')));
  app.use('/api/pos/sync', require(R('sync.js')));
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  let soSdt = 0;
  const sdtMoi = () => '09' + String(30000000 + (++soSdt)).padStart(8, '0');
  const goi = async (method, url, body, tk = tkChu, coGoc = goc) => {
    const headers = {};
    if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (tk) headers.Authorization = 'Bearer ' + tk;
    imLang();
    try {
      const r = await fetch(coGoc + url, { method, headers, body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      return { status: r.status, j, tho };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;
  const qrCua = async (sdt) => ((await db.queryOne('SELECT qr_code FROM pos_customers WHERE phone = ?', [sdt])) || {}).qr_code;
  const taoKhach = async (sdt, children) => goi('POST', '/pos/customers', { phone: sdt, name: 'Khách ' + sdt, ...(children ? { children } : {}) });
  const chenKhach = async (sdt, qr) => (await db.run('INSERT INTO pos_customers (phone, name, qr_code, created_at) VALUES (?, ?, ?, ?)',
    [sdt, 'Khách cũ ' + sdt, qr, H.getNow()])).lastInsertRowid;
  const toi = (id) => goi('GET', '/kh/toi', undefined, kyTokenKhach(id));
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); phat = ghi = null; k(`${ten}: bài chạy hết mục`, false, e.message); } };

  muc('[A] mã QR mới: ngẫu nhiên, có tiền tố, không chứa SĐT');
  await chay('A', async () => {
    const s1 = sdtMoi(), s2 = sdtMoi();
    const r1 = await taoKhach(s1), r2 = await taoKhach(s2);
    const q1 = await qrCua(s1), q2 = await qrCua(s2);
    k('A1 POST /customers → 201, qr TQD-+12 ký tự, không chứa SĐT, hai khách khác mã',
      r1.status === 201 && r2.status === 201 && DANG_MOI.test(q1) && DANG_MOI.test(q2) && !q1.includes(s1.slice(1)) && q1 !== q2, `${q1} · ${q2}`);
    const me = sdtMoi(), con = sdtMoi();
    await taoKhach(me, [{ name: 'Con có số', phone: con }, { name: 'Con không số' }]);
    const qMe = await qrCua(me), qCon = await qrCua(con);
    const khongSo = await db.queryOne("SELECT qr_code FROM pos_customers WHERE parent_phone = ? AND name = 'Con không số'", [me]);
    k('A2 người nhận có SĐT → mã thật riêng ≠ mã mẹ; người nhận không SĐT → NULL',
      DANG_MOI.test(qCon) && qCon !== qMe && !!khongSo && khongSo.qr_code === null, `${qCon} · ${qMe} · ${khongSo && khongSo.qr_code}`);
    const idMe = (await db.queryOne('SELECT id FROM pos_customers WHERE phone = ?', [me])).id, c3 = sdtMoi();
    const r3 = await goi('POST', `/pos/customers/${idMe}/children`, { name: 'Con thêm', phone: c3 });
    k('A3 POST /:id/children có SĐT → 201, mã thật', r3.status === 201 && DANG_MOI.test(await qrCua(c3)), `${moTa(r3)} · ${await qrCua(c3)}`);
    const tap = new Set(); let sai = 0;
    for (let i = 0; i < 2000; i++) { const m = H.generateQRCode('0901234567'); tap.add(m); if (!DANG_MOI.test(m) || m.includes('901234567')) sai++; }
    k('A4 2000 lần generateQRCode → đúng dạng, không chứa SĐT, không trùng', sai === 0 && tap.size === 2000, `sai ${sai} · khác nhau ${tap.size}`);
  });

  muc('[A5] sinhQrKhongTrung: trùng thì sinh lại, tối đa QR_THU_TOI_DA lần');
  await chay('A5', async () => {
    k('A5 helpers xuất sinhQrKhongTrung, QR_TIEN_TO = "TQD-", QR_THU_TOI_DA = 5',
      typeof H.sinhQrKhongTrung === 'function' && H.QR_TIEN_TO === 'TQD-' && H.QR_THU_TOI_DA === 5, `${typeof H.sinhQrKhongTrung} · ${H.QR_TIEN_TO} · ${H.QR_THU_TOI_DA}`);
    let hoi = 0;
    const m = await H.sinhQrKhongTrung(async () => (++hoi <= 2 ? { x: 1 } : null));
    k('A5 trùng 2 lần → lần 3 trả mã mới, hỏi kho đúng 3 lần', DANG_MOI.test(m) && hoi === 3, `${m} · hỏi ${hoi}`);
    hoi = 0; let nem = false;
    try { await H.sinhQrKhongTrung(async () => { hoi++; return { x: 1 }; }); } catch { nem = true; }
    k('A5 luôn trùng → ném, sau ĐÚNG 5 lần hỏi', nem && hoi === 5, `ném ${nem} · hỏi ${hoi}`);
  });

  muc('[A6–A8] đường song song: khách mới từ App, mọi chỗ gọi sinh lại khi trùng, nhập CSV từ SX');
  await chay('A6', async () => {
    const s = sdtMoi();
    await goi('POST', '/kh/dang-nhap/xin-ma', { sdt: s }, null);
    const r = await goi('POST', '/kh/dang-nhap/xac-minh', { sdt: s, ma: guiMa.layMaGiaCuoi().ma, ten: 'Khách App' }, null);
    k('A6 khách mới qua App (xac-minh) → mã thật', r.status === 200 && DANG_MOI.test(await qrCua(s)), `${moTa(r)} · ${await qrCua(s)}`);
  });
  await chay('A7', async () => {
    ghi = []; const goc7 = sdtMoi(); await taoKhach(goc7); const mau = ghi; ghi = null;
    const daCo = await qrCua(goc7);
    const thu = async (ten, boQua, lam, sdtKQ) => {
      phat = { ds: mau.map((b) => Buffer.from(b)), boQua }; const truoc = soRut;
      const r = await lam(); const q = await sdtKQ(); phat = null;
      k(`A7 ${ten}: lần rút đầu trùng mã có sẵn → vẫn thành công, mã mới ≠ mã có sẵn`,
        r.status < 300 && DANG_MOI.test(q) && q !== daCo && soRut - truoc >= 2 * mau.length, `${moTa(r)} · ${q} · rút ${soRut - truoc}`);
    };
    const a = sdtMoi(); await thu('POST /', 0, () => taoKhach(a), () => qrCua(a));
    const me = sdtMoi(), con = sdtMoi(); await thu('người nhận trong POST /', mau.length, () => taoKhach(me, [{ name: 'Con', phone: con }]), () => qrCua(con));
    const idMe = (await db.queryOne('SELECT id FROM pos_customers WHERE phone = ?', [me])).id, c2 = sdtMoi();
    await thu('POST /:id/children', 0, () => goi('POST', `/pos/customers/${idMe}/children`, { name: 'Con 2', phone: c2 }), () => qrCua(c2));
    const cu = sdtMoi(), idCu = await chenKhach(cu, 'QR-' + cu);
    await thu('/kh/toi đổi mã cũ', 0, () => toi(idCu), () => qrCua(cu));
  });
  await chay('A8', async () => {
    const s = sdtMoi(), fd = new FormData();
    fd.append('file', new Blob([`SĐT,Tên\n${s},Khách SX\n`], { type: 'text/csv' }), 'kh.csv');
    const r = await goi('POST', '/pos/sync/import', fd);
    k('A8 nhập CSV từ SX khách mới → mã thật (đường sync.js đổi qua helpers.js)', r.status === 200 && DANG_MOI.test(await qrCua(s)), `${moTa(r)} · ${await qrCua(s)}`);
  });

  muc('[B] khách đang có QR-<SĐT> hoặc NULL: đổi mã khi khách xem QR lần đầu; mã cũ bị từ chối');
  await chay('B', async () => {
    const s = sdtMoi(), id = await chenKhach(s, 'QR-' + s);
    const b1 = await goi('GET', `/pos/customers/qr/QR-${s}`);
    k('B1 /qr/QR-<sđt> (dạng cũ, chưa đổi) → 404 QR_KHONG_CO', b1.status === 404 && b1.j.code === 'QR_KHONG_CO', moTa(b1));
    const t = await toi(id), moi = await qrCua(s);
    const tra = await goi('GET', `/pos/customers/qr/${moi}`), traCu = await goi('GET', `/pos/customers/qr/QR-${s}`);
    k('B2 /toi → qr dạng mới = cột trong kho; /qr/<mới> → 200 đúng khách; /qr/<cũ> → 404',
      t.status === 200 && DANG_MOI.test(t.j.khach && t.j.khach.qr) && t.j.khach.qr === moi && tra.status === 200 && tra.j.id === id && traCu.status === 404,
      `${moTa(t)} · ${t.j.khach && t.j.khach.qr} · kho ${moi} · ${tra.status} · ${traCu.status}`);
    const n = sdtMoi(), idN = await chenKhach(n, null);
    const tn = await toi(idN);
    k('B3 khách qr_code NULL (chép từ SX) → /toi sinh mã, lưu kho', DANG_MOI.test(tn.j.khach && tn.j.khach.qr) && tn.j.khach.qr === await qrCua(n), `${tn.j.khach && tn.j.khach.qr}`);
    const d = sdtMoi(), idD = await chenKhach(d, 'QR-' + d);
    const [x, y] = await Promise.all([toi(idD), toi(idD)]);
    const qx = x.j.khach && x.j.khach.qr, qy = y.j.khach && y.j.khach.qr;
    k('B4 hai /toi đồng thời trên khách cũ → cùng một qr, đúng mã trong kho', DANG_MOI.test(qx) && qx === qy && qx === await qrCua(d), `${qx} · ${qy} · ${await qrCua(d)}`);
    const f = sdtMoi(); await taoKhach(f);
    const idF = (await db.queryOne('SELECT id FROM pos_customers WHERE phone = ?', [f])).id, qF = await qrCua(f);
    const f1 = await toi(idF), f2 = await toi(idF);
    k('F2 khách đã có mã mới gọi /toi 2 lần → mã KHÔNG đổi', !!qF && f1.j.khach && f1.j.khach.qr === qF && f2.j.khach.qr === qF && await qrCua(f) === qF,
      `${qF} · ${f1.j.khach && f1.j.khach.qr} · ${f2.j.khach && f2.j.khach.qr}`);
  });

  muc('[D] khách xem QR của mình — chỉ ở GET /toi, theo token, không vào log');
  await chay('D', async () => {
    const a = sdtMoi(), b = sdtMoi(); await taoKhach(a); await taoKhach(b);
    const idA = (await db.queryOne('SELECT id FROM pos_customers WHERE phone = ?', [a])).id;
    const idB = (await db.queryOne('SELECT id FROM pos_customers WHERE phone = ?', [b])).id;
    const qA = await qrCua(a), qB = await qrCua(b);
    const ra = await toi(idA), rb = await toi(idB);
    const lech = await goi('GET', `/kh/toi?sdt=${b}&phone=${b}&id=${idB}`, undefined, kyTokenKhach(idA));
    k('D1 cặp A/B: /toi của A ra mã A, của B ra mã B; A gửi tham số của B vẫn ra mã A, không chứa mã B',
      !!qA && ra.j.khach && ra.j.khach.qr === qA && rb.j.khach && rb.j.khach.qr === qB && lech.j.khach && lech.j.khach.qr === qA && !lech.tho.includes(qB),
      `${ra.j.khach && ra.j.khach.qr} · ${rb.j.khach && rb.j.khach.qr} · ${lech.j.khach && lech.j.khach.qr}`);
    const tk = kyTokenKhach(idA), lo = [];
    for (const [m, u, body] of [['PUT', '/kh/toi', { ten: 'Tên A' }], ['GET', '/kh/diem'], ['GET', '/kh/voucher'], ['GET', '/kh/don'],
      ['GET', '/kh/don/ORD-KHONG-CO'], ['GET', '/kh/menu']]) {
      const r = await goi(m, u, body, tk);
      if (/"qr"/.test(r.tho) || r.tho.includes(qA)) lo.push(`${m} ${u}`);
    }
    await goi('POST', '/kh/dang-nhap/xin-ma', { sdt: a }, null);
    const xm = await goi('POST', '/kh/dang-nhap/xac-minh', { sdt: a, ma: guiMa.layMaGiaCuoi().ma }, null);
    if (xm.status !== 200 || /"qr"/.test(xm.tho) || xm.tho.includes(qA)) lo.push(`xac-minh ${xm.status}`);
    k('D2 qr (khoá lẫn giá trị) KHÔNG có ở xac-minh, PUT /toi, /diem, /voucher, /don, /don/:ma, /menu', lo.length === 0, lo.join(', '));
  });

  muc('[E] /api/pos/customers/qr/:code — chỉ nhân viên, mã sai → 404 có code, không lộ khách khác');
  await chay('E', async () => {
    const me = sdtMoi(), con = sdtMoi(), la = sdtMoi();
    await taoKhach(me, [{ name: 'Người nhận', phone: con }]); await taoKhach(la);
    const qMe = await qrCua(me), idMe = (await db.queryOne('SELECT id FROM pos_customers WHERE phone = ?', [me])).id;
    const kTok = await goi('GET', `/pos/customers/qr/${qMe}`, undefined, null);
    const kKh = await goi('GET', `/pos/customers/qr/${qMe}`, undefined, kyTokenKhach(idMe));
    const bia = await goi('GET', '/pos/customers/qr/TQD-ABCDEFGHJKLM');
    const dung = await goi('GET', `/pos/customers/qr/${qMe}`);
    k('E1 không token → 401; token KHÁCH → 401', kTok.status === 401 && kKh.status === 401, `${kTok.status} · ${kKh.status}`);
    k('E1 token quầy + mã TQD- bịa → 404 QR_KHONG_CO', bia.status === 404 && bia.j.code === 'QR_KHONG_CO', moTa(bia));
    k('E2 mã đúng → 200, id = khách đó, children = đúng người nhận của khách đó',
      dung.status === 200 && dung.j.id === idMe && Array.isArray(dung.j.children) && dung.j.children.map((c) => c.phone).join() === con && !dung.tho.includes(la),
      `${moTa(dung)} · ${JSON.stringify(dung.j.children)}`);
    let lo = 0;
    for (const m of ['%E0%A4%A', 'TQD-x%2Fy', '%25', "' OR 1=1 --"]) { const r = await goi('GET', `/pos/customers/qr/${m}`); if (r.status === 200 || r.tho.includes('"phone"')) lo++; }
    k('E3 mã méo → không 200, không trả dữ liệu khách', lo === 0, `lộ ${lo}`);
  });

  muc('[F1] luồng hợp lệ: tìm tên / SĐT, tạo khách, mã của người nhận ra ĐÚNG người nhận (K5)');
  await chay('F1', async () => {
    const s = sdtMoi(), con = sdtMoi();
    const tao = await goi('POST', '/pos/customers', { phone: s, name: 'Bà Tìm Thấy', children: [{ name: 'Cháu', phone: con }] });
    const t1 = await goi('GET', `/pos/v2/customers/search/${s}`), t2 = await goi('GET', `/pos/v2/customers/search/${encodeURIComponent('Bà Tìm')}`);
    const qCon = await qrCua(con), rc = await goi('GET', `/pos/customers/qr/${qCon}`);
    k('F1 POST /customers → 201; tìm theo SĐT, theo tên → 200 có khách', tao.status === 201 && t1.status === 200 && t1.tho.includes(s) && t2.status === 200 && t2.tho.includes(s),
      `${tao.status} · ${t1.status} · ${t2.status}`);
    k('F1 mã người nhận tra ra đúng người nhận', !!qCon && rc.status === 200 && rc.j.phone === con, `${qCon} · ${moTa(rc)} · ${rc.j.phone}`);
  });

  muc('[D4] server/index.js THẬT: tra QR → nhật ký yêu cầu không chứa mã');
  await chay('D4', async () => {
    const s = sdtMoi(); await taoKhach(s); const ma = await qrCua(s);
    const cong = await new Promise((ok) => { const t = net.createServer().listen(0, () => { const p = t.address().port; t.close(() => ok(p)); }); });
    const con = spawn(process.execPath, [path.join(GOC, 'server', 'index.js')], { cwd: GOC, env: { PATH: process.env.PATH, HOME: process.env.HOME,
      PORT: String(cong), TURSO_DATABASE_URL: 'file:' + FILE_KHO, JWT_SECRET: KHOA_NV, KH_JWT_SECRET: 'x', SX_API_URL: '', SX_API_KEY: '', NODE_ENV: 'test' } });
    let ra = '';
    con.stdout.on('data', (d) => { ra += d; }); con.stderr.on('data', (d) => { ra += d; }); con.on('exit', (c) => { ra += ` [thoát ${c}]`; });
    try {
      for (let i = 0; i < 100 && !ra.includes('API:'); i++) await new Promise((ok) => setTimeout(ok, 100));
      const g = `http://127.0.0.1:${cong}/api`;
      const r = await goi('GET', `/pos/customers/qr/${ma}`, undefined, tkChu, g), r2 = await goi('GET', '/pos/customers/qr/TQD-ZZZZZZZZZZZZ', undefined, tkChu, g);
      await new Promise((ok) => setTimeout(ok, 200));
      k('D4 index.js thật: tra mã đúng → 200, mã bịa → 404 (yêu cầu đi qua bộ ghi)', r.status === 200 && r2.status === 404 && /customers\/qr\//.test(ra), `${r.status} · ${r2.status}`);
      k('D4 nhật ký index.js không chứa mã QR nào', !ra.includes(ma) && !ra.includes('TQD-ZZZZZZZZZZZZ'), ra.split('\n').filter((d) => d.includes('/qr/')).join(' | '));
    } catch (e) { throw new Error(`${e.message} · tiến trình con: ${ra.slice(-300).replace(/\s+/g, ' ')}`); } finally { con.kill(); }
  });

  sv.close();
  muc('[D3] nhật ký máy chủ của cả bài không chứa mã QR nào');
  const ma = (await db.query('SELECT qr_code FROM pos_customers WHERE qr_code IS NOT NULL')).map((x) => x.qr_code);
  const loLog = nhatKy.filter((d) => ma.some((m) => d.includes(m)));
  k(`D3 ${nhatKy.length} dòng log, ${ma.length} mã — không dòng nào chứa mã`, ma.length > 0 && loLog.length === 0, loLog.slice(0, 2).join(' | '));

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
