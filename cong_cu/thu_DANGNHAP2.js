#!/usr/bin/env node
/**
 * THỬ DANG-NHAP-2 — đăng nhập POS: giới hạn số lần gõ sai + câu báo chung.
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_DANGNHAP2.js
 *  Router THẬT server/routes/auth.js gắn vào express (trust proxy = 1 như server/index.js), kho thử TẠM, gọi qua HTTP thật.
 *  IP giả qua X-Forwarded-For; thời gian giả bằng cách lệch Date.now; bcrypt.compare được đếm (đếm số lần thật sự so mật khẩu).
 *  Bản đột biến: chép server/ + cong_cu/ ra thư mục tạm rồi chạy bài trong đó (viec/DANG-NHAP-2/dot_bien.py) — bài đọc server/ cạnh nó.
 *  Chỉ so status / code / cấu trúc; câu chữ chỉ dò ở chỗ phiếu chốt nguyên văn (E) và số phút (A6).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const GOC = path.join(__dirname, '..');
const MAY_CHU = path.join(GOC, 'server');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_dangnhap2_'));
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
process.env.JWT_SECRET = 'thu_dangnhap2_' + Date.now();
delete process.env.JWT_EXPIRES_IN;

let dat = 0, hong = 0;
const ca = (ten, dung, them) => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them === undefined ? '' : '  — ' + JSON.stringify(them)}`); }
};
const muc = (t) => console.log('\n' + t);
const doc = (f) => fs.readFileSync(path.join(GOC, f), 'utf8');

const DOI_GIO = { ms: 0 };
const dongHoThat = Date.now.bind(Date);
Date.now = () => dongHoThat() + DOI_GIO.ms;
const PHUT = 60 * 1000;

const CAU_CHUNG = 'Tên đăng nhập hoặc mật khẩu không đúng';

async function main() {
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const bcrypt = require(path.join(GOC, 'node_modules', 'bcryptjs'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  const logGoc = console.log;
  console.log = () => {};
  await db.initDatabase();
  console.log = logGoc;

  const them = (ten, mk, hoatDong) => db.run(
    'INSERT INTO pos_users (username, password, display_name, role, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [ten, bcrypt.hashSync(mk, 4), 'Thử ' + ten, 'staff', hoatDong, '2026-01-01T00:00:00']);
  await them('nv', 'nv123', 1);
  await them('quan', 'quan123', 0);
  for (let i = 1; i <= 5; i++) await them('nvq' + i, 'mk' + i, 1);

  // Đếm số lần bcrypt.compare thật sự chạy (route phải gọi qua `bcrypt.compare` của module)
  let soSo = 0;
  const soGoc = bcrypt.compare;
  bcrypt.compare = (...a) => { soSo++; return soGoc.apply(bcrypt, a); };

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use('/api/pos/auth', require(path.join(MAY_CHU, 'routes', 'auth.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)); });
  const cong = sv.address().port;

  const goi = (ip, username, password, xff) => new Promise((ok, loi) => {
    const body = JSON.stringify({ username, password });
    const yc = http.request({ host: '127.0.0.1', port: cong, path: '/api/pos/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'X-Forwarded-For': xff || ip } }, (res) => {
      let t = '';
      res.on('data', (d) => { t += d; });
      res.on('end', () => { let j = {}; try { j = JSON.parse(t); } catch { /* không phải JSON */ } ok({ status: res.statusCode, j }); });
    });
    yc.on('error', loi);
    yc.end(body);
  });
  const sai = (ip, ten = 'nv', xff) => goi(ip, ten, 'mat_khau_sai', xff);
  const dung = (ip, ten = 'nv', mk = 'nv123') => goi(ip, ten, mk);
  const phutCon = (r) => Number(String(r.j.error || '').match(/(\d+) phút/)?.[1]);
  const trangThai = (r) => `${r.status} ${r.j.code || ''}`;

  // ═══ A — theo CẶP (tên + IP): 5 lần sai / 15 phút ═══
  muc('A — giới hạn theo cặp (tên đăng nhập + IP)');
  {
    const ip = '10.1.0.1';
    const kq = [];
    for (let i = 0; i < 5; i++) kq.push(await sai(ip));
    ca('A1 5 lần sai đầu → 401 cả năm (chưa bị chặn)', kq.every((r) => r.status === 401), kq.map(trangThai));
    const sau = await sai(ip);
    ca('A1b lần sai thứ 6 → 429 QUA_NHIEU_LAN', sau.status === 429 && sau.j.code === 'QUA_NHIEU_LAN', [sau.status, sau.j]);
    ca('A1c câu 429 báo số phút còn lại (vừa khoá: 15)', phutCon(sau) === 15, sau.j.error);
    const dungSau = await dung(ip);
    ca('A2 lần thứ 6 GÕ ĐÚNG mật khẩu vẫn 429, không có vé', dungSau.status === 429 && dungSau.j.code === 'QUA_NHIEU_LAN' && !dungSau.j.token, [dungSau.status, dungSau.j.code]);

    DOI_GIO.ms = 14 * PHUT + 30 * 1000;
    const gan = await dung(ip);
    ca('A3 còn 30 giây (ngay dưới 15 phút) → vẫn 429, báo 1 phút (làm tròn LÊN)', gan.status === 429 && phutCon(gan) === 1, [gan.status, gan.j.error]);
    DOI_GIO.ms = 15 * PHUT;
    const het = await dung(ip);
    ca('A4 đủ 15 phút → đếm lại: gõ đúng vào được (200)', het.status === 200 && !!het.j.token, [het.status, het.j.code]);
    DOI_GIO.ms = 0;
  }
  {
    const ip = '10.1.0.2';
    for (let i = 0; i < 3; i++) await sai(ip);
    const d = await dung(ip);
    ca('A5 sai 3 lần rồi gõ đúng (lần 4) → 200', d.status === 200, d.status);
    const kq = [];
    for (let i = 0; i < 5; i++) kq.push(await sai(ip));
    const s6 = await sai(ip);
    ca('A5b đăng nhập đúng xoá đếm: sau đó lại được sai đủ 5 lần (401) rồi lần 6 mới 429',
      kq.every((r) => r.status === 401) && s6.status === 429, [kq.map((r) => r.status), s6.status]);
  }
  {
    const ip = '10.1.0.3';
    for (const t of ['Admin ', 'admin', ' ADMIN', 'admin  ', 'Admin']) await sai(ip, t);
    const s6 = await sai(ip, ' aDmIn ');
    ca('A6 "Admin " / "admin" / " ADMIN" là MỘT cặp: lần 6 → 429', s6.status === 429, trangThai(s6));
  }
  {
    const ip = '10.1.0.4';
    const kq = [];
    for (let i = 0; i < 4; i++) kq.push(await sai(ip, 'nvq1'));
    const nam = await sai(ip, 'nvq1');
    ca('A7 ngay trên ngưỡng: lần sai thứ 5 vẫn 401 (chưa chặn)', nam.status === 401 && kq.every((r) => r.status === 401), [kq.map((r) => r.status), nam.status]);
  }
  {
    const ip = '10.1.0.5';
    for (let i = 0; i < 5; i++) await sai(ip, 'nvq2', `${i}.${i}.${i}.${i}, ${ip}`);
    const s6 = await sai(ip, 'nvq2', `9.9.9.9, ${ip}`);
    ca('A8 gõ thêm giá trị giả ở đầu X-Forwarded-For không đổi được IP (lấy giá trị proxy thêm): lần 6 → 429', s6.status === 429, trangThai(s6));
  }

  // ═══ B — không khoá theo tên trên mọi máy ═══
  muc('B — IP khác vẫn vào');
  {
    const ip = '10.2.0.1';
    for (let i = 0; i < 6; i++) await sai(ip, 'admin');
    const khoa = await dung(ip, 'admin', 'admin123');
    const khac = await dung('10.2.0.99', 'admin', 'admin123');
    ca('B1 (admin, IP1) đang khoá', khoa.status === 429, trangThai(khoa));
    ca('B2 cùng tên admin từ IP khác, mật khẩu đúng → 200 (người lạ không khoá được chủ quán ở quầy)', khac.status === 200 && !!khac.j.token, [khac.status, khac.j.code]);
  }

  // ═══ C — theo IP: 20 lần sai / 15 phút, mọi tên cộng lại ═══
  muc('C — giới hạn theo IP (rải nhiều tên)');
  {
    const ip = '10.3.0.1';
    const kq = [];
    for (let i = 1; i <= 20; i++) kq.push(await sai(ip, 'ten_la_' + i));
    ca('C1 20 tên khác nhau, mỗi tên sai 1 lần → cả 20 lần 401 (ngay dưới ngưỡng)', kq.every((r) => r.status === 401), kq.map((r) => r.status).join(','));
    const s21 = await sai(ip, 'ten_la_21');
    ca('C2 lần thứ 21 từ IP đó (tên mới) → 429 QUA_NHIEU_LAN', s21.status === 429 && s21.j.code === 'QUA_NHIEU_LAN', trangThai(s21));
    const dungIp = await dung(ip, 'nv');
    ca('C3 cùng IP đang bị chặn: tên có thật gõ đúng cũng 429', dungIp.status === 429, trangThai(dungIp));
    const ipKhac = await dung('10.3.0.2', 'nv');
    ca('C4 IP khác không bị ảnh hưởng', ipKhac.status === 200, trangThai(ipKhac));
  }
  {
    // K5: luồng hợp lệ đi qua cổng — quầy dùng chung MỘT IP cho cả nhóm nhân viên
    const ip = '10.3.0.3';
    const kq = [];
    for (let i = 0; i < 30; i++) kq.push(await dung(ip, 'nv'));
    ca('C5 (K5) 30 lần đăng nhập ĐÚNG liên tiếp từ một IP → cả 30 lần 200 (lần đúng không tốn lượt IP)', kq.every((r) => r.status === 200), kq.map((r) => r.status).join(','));
    const lan = [];
    for (let i = 1; i <= 5; i++) { lan.push(await sai(ip, 'nvq' + i)); lan.push(await sai(ip, 'nvq' + i)); }
    const vao = await dung(ip, 'nvq3', 'mk3');
    ca('C6 (K5) 5 nhân viên chung IP, mỗi người sai 2 lần (10 lần) rồi vào bình thường → 200',
      lan.every((r) => r.status === 401) && vao.status === 200, [lan.map((r) => r.status).join(','), vao.status]);
  }

  // ═══ D — giữ lượt TRƯỚC khi so mật khẩu ═══
  muc('D — 20 yêu cầu sai cùng lúc');
  {
    const ip = '10.4.0.1';
    const truoc = soSo;
    const kq = await Promise.all(Array.from({ length: 20 }, () => sai(ip, 'nv')));
    const n401 = kq.filter((r) => r.status === 401).length;
    const n429 = kq.filter((r) => r.status === 429).length;
    ca('D1 20 yêu cầu sai song song cùng một cặp → đúng 5 lần 401, còn lại 15 lần 429', n401 === 5 && n429 === 15, { n401, n429 });
    ca('D2 chỉ 5 lần được so bcrypt (phần còn lại chặn TRƯỚC khi so)', soSo - truoc === 5, soSo - truoc);
  }
  {
    const ip = '10.4.0.2';
    const truoc = soSo;
    const kq = await Promise.all(Array.from({ length: 20 }, () => sai(ip, 'khong_co_ten_nay')));
    ca('D3 tên không tồn tại cũng vậy: 5 lần 401, 15 lần 429, 5 lần so', kq.filter((r) => r.status === 401).length === 5
      && kq.filter((r) => r.status === 429).length === 15 && soSo - truoc === 5, [kq.map((r) => r.status).join(','), soSo - truoc]);
  }

  // ═══ E — câu báo chung ═══
  muc('E — câu báo chung, không lộ tên có thật / đang khoá');
  {
    const tenKhong = await sai('10.5.0.1', 'khong_ton_tai');
    const saiMk = await sai('10.5.0.2', 'nv');
    const khoaSai = await sai('10.5.0.3', 'quan');
    ca('E1 tên không tồn tại → 401 + câu chung, không code', tenKhong.status === 401 && tenKhong.j.error === CAU_CHUNG && tenKhong.j.code === undefined, tenKhong);
    ca('E2 sai mật khẩu → 401 + câu chung, không code', saiMk.status === 401 && saiMk.j.error === CAU_CHUNG && saiMk.j.code === undefined, saiMk);
    ca('E3 tài khoản BỊ KHOÁ mà SAI mật khẩu → CÙNG câu, cùng 401, không code (không lộ tên có thật)',
      khoaSai.status === 401 && khoaSai.j.error === CAU_CHUNG && khoaSai.j.code === undefined, khoaSai);
    ca('E4 ba trường hợp trả về GIỐNG HỆT nhau (cả thân JSON)', JSON.stringify(tenKhong.j) === JSON.stringify(saiMk.j) && JSON.stringify(saiMk.j) === JSON.stringify(khoaSai.j),
      [tenKhong.j, saiMk.j, khoaSai.j]);

    const truoc = soSo;
    await sai('10.5.0.4', 'khong_ton_tai');
    ca('E5 tên không tồn tại vẫn chạy ĐÚNG MỘT lần bcrypt (băm giả — thời gian phản hồi tương đương)', soSo - truoc === 1, soSo - truoc);
    const truoc2 = soSo;
    await sai('10.5.0.5', 'quan');
    ca('E5b tài khoản khoá + sai mật khẩu cũng chạy MỘT lần bcrypt', soSo - truoc2 === 1, soSo - truoc2);

    const khoaDung = await dung('10.5.0.6', 'quan', 'quan123');
    ca('E6 tài khoản khoá + mật khẩu ĐÚNG → 401 báo riêng "vô hiệu" (người biết mật khẩu cần biết lý do), không code, không vé',
      khoaDung.status === 401 && /vô hiệu/.test(khoaDung.j.error || '') && khoaDung.j.error !== CAU_CHUNG && khoaDung.j.code === undefined && !khoaDung.j.token, khoaDung);
  }
  {
    const ip = '10.5.0.7';
    const kq = [];
    for (let i = 0; i < 5; i++) kq.push(await sai(ip, 'khong_ton_tai'));
    const s6 = await sai(ip, 'khong_ton_tai');
    ca('E7 mọi lần sai tính lượt, KỂ CẢ tên không tồn tại: lần 6 → 429', kq.every((r) => r.status === 401) && s6.status === 429, [kq.map((r) => r.status), s6.status]);
    const ip2 = '10.5.0.8';
    for (let i = 0; i < 5; i++) await sai(ip2, 'quan');
    const t6 = await sai(ip2, 'quan');
    ca('E8 tài khoản khoá sai mật khẩu cũng tính lượt: lần 6 → 429', t6.status === 429, trangThai(t6));
  }
  {
    const ip = '10.5.0.9';
    const r = await goi(ip, '', 'x');
    const r2 = await goi(ip, 'nv', '');
    ca('E9 thiếu tên hoặc mật khẩu vẫn 400 như cũ', r.status === 400 && r2.status === 400, [r.status, r2.status]);
  }

  // ═══ F — bộ đếm trong bộ nhớ, có trần + dọn quá hạn ═══
  muc('F — bộ đếm trong bộ nhớ');
  {
    const duong = path.join(MAY_CHU, 'utils', 'gioiHanDangNhap.js');
    ca('F0 có server/utils/gioiHanDangNhap.js', fs.existsSync(duong));
    let m = null;
    try { m = require(duong); } catch { /* chưa có */ }
    if (m && typeof m.giuLuot === 'function' && typeof m.soMuc === 'function' && Number.isInteger(m.TRAN_MUC)) {
      const t0 = 1000000000000;
      const tran = m.TRAN_MUC;
      for (let i = 0; i < tran * 3; i++) m.giuLuot('9.9.' + (i >> 8) + '.' + (i & 255), 'ten' + i, t0);
      ca('F1 bị dò bằng 3 × TRAN_MUC cặp khác nhau → số mục không vượt trần', m.soMuc() <= tran * 2, [m.soMuc(), tran]);
      m.giuLuot('8.8.8.8', 'x', t0 + 16 * PHUT);
      ca('F2 sau 15 phút mọi mục cũ được dọn (chỉ còn mục vừa ghi)', m.soMuc() <= 2, m.soMuc());
      const r = m.giuLuot('7.7.7.7', 'y', t0 + 100 * PHUT);
      ca('F3 giuLuot trả { chan } khi chưa tới ngưỡng = false', r && r.chan === false, r);
    } else {
      ca('F1 module xuất giuLuot / soMuc / TRAN_MUC', false, m && Object.keys(m));
      ca('F2 sau 15 phút mọi mục cũ được dọn (chỉ còn mục vừa ghi)', false, 'không có module');
      ca('F3 giuLuot trả { chan } khi chưa tới ngưỡng = false', false, 'không có module');
    }
    const nguon = fs.existsSync(duong) ? fs.readFileSync(duong, 'utf8') : '';
    ca('F4 không bảng mới, không đụng database', nguon !== '' && !/CREATE TABLE|require\(['"]\.\.\/database/.test(nguon));
  }

  // ═══ G — màn đăng nhập hiện câu của máy chủ, không đá vòng ═══
  muc('G — màn đăng nhập (phép tĩnh)');
  {
    const login = doc('client/src/pages/Login.jsx');
    const api = doc('client/src/utils/api.js');
    const bat = login.slice(login.indexOf('catch (err)'), login.indexOf('finally'));
    ca('G1 Login.jsx hiện err.message của máy chủ khi lỗi', /setError\(err\.message/.test(bat), bat.slice(0, 120));
    ca('G2 Login.jsx không xoá ô đã gõ khi lỗi (không setUsername(\'\') / setPassword(\'\') trong catch)', !/set(Username|Password)\(['"]['"]\)/.test(bat), bat);
    const ds = api.slice(api.indexOf('const SESSION_DEAD_CODES = ['), api.indexOf('];', api.indexOf('const SESSION_DEAD_CODES = [')));
    ca('G3 api.js: QUA_NHIEU_LAN KHÔNG nằm trong SESSION_DEAD_CODES (429 không phải phiên chết)', ds.includes('NO_TOKEN') && !ds.includes('QUA_NHIEU_LAN'), ds);
    ca('G4 api.js: chỉ 401 mới có thể là phiên chết (429 không đá về /login)', /return status === 401 && !!code && SESSION_DEAD_CODES\.includes\(code\)/.test(api));
    const auth = doc('server/routes/auth.js');
    const dang = auth.slice(auth.indexOf("router.post('/login'"), auth.indexOf("router.", auth.indexOf("router.post('/login'") + 10));
    const lo = ['NO_TOKEN', 'INVALID_TOKEN', 'TOKEN_EXPIRED', 'USER_NOT_FOUND', 'USER_INACTIVE'].filter((c) => dang.includes(c));
    ca('G5 câu trả lời đăng nhập không mang mã phiên chết', dang.length > 100 && lo.length === 0, lo);
  }

  // ═══ H — không đổi: vé, dạng trả, last_login ═══
  muc('H — không đổi');
  {
    const r = await dung('10.8.0.1', 'admin', 'admin123');
    const g = jwt.verify(r.j.token || '', process.env.JWT_SECRET);
    ca('H1 trả { success, token, user{id,username,display_name,role}, permissions }',
      r.status === 200 && r.j.success === true && Object.keys(r.j.user || {}).sort().join() === 'display_name,id,role,username' && typeof r.j.permissions === 'object', r.j);
    ca('H2 vé hạn 30 ngày (khi không đặt JWT_EXPIRES_IN), mang userId + role', g.exp - g.iat === 30 * 86400 && g.role === 'owner' && g.userId === r.j.user.id, g);
    const u = await db.queryOne("SELECT last_login FROM pos_users WHERE username = 'admin'");
    ca('H3 last_login được ghi', !!u.last_login, u);
    const server = doc('server/index.js');
    ca('H4 server/index.js vẫn app.set(\'trust proxy\', 1) trước khi gắn /api/pos/auth (req.ip là IP thật sau Render)',
      server.indexOf("app.set('trust proxy', 1)") > 0 && server.indexOf("app.set('trust proxy', 1)") < server.indexOf("app.use('/api/pos/auth'"));
  }

  // ═══ J — VÒNG 2: IP thật sau Cloudflare (MỘT chỗ ở cửa vào server/index.js) ═══
  muc('J — IP thật của khách (header Cloudflare) — chạy server/index.js THẬT trong tiến trình con');
  {
    const { spawn } = require('child_process');
    const preload = path.join(THU_MUC, 'nap_truoc.js');
    fs.writeFileSync(preload, `const p = require.resolve(${JSON.stringify(path.join(MAY_CHU, 'ketNoiKho.js'))});
require.cache[p] = { id: p, filename: p, loaded: true, exports: { laMayThu: () => true,
  cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + ${JSON.stringify(path.join(THU_MUC, 'kho_con.db'))} } }), diaChiSX: () => '', FILE_THU: '' } };\n`);
    const congCon = await new Promise((ok) => { const t = require('net').createServer().listen(0, '127.0.0.1', () => { const p = t.address().port; t.close(() => ok(p)); }); });
    const con = spawn(process.execPath, ['-r', preload, path.join(MAY_CHU, 'index.js')], {
      cwd: GOC, env: { ...process.env, PORT: String(congCon), REPL_ID: '', REPLIT: '', KH_JWT_SECRET: 'khach_thu_dangnhap2_' + Date.now() }, stdio: ['ignore', 'pipe', 'pipe'] });
    let nhatKyCon = '';
    con.stdout.on('data', (d) => { nhatKyCon += d; });
    con.stderr.on('data', (d) => { nhatKyCon += d; });
    const hoi = (duong, tieuDe, thanBody) => new Promise((ok) => {
      const body = thanBody ? JSON.stringify(thanBody) : '';
      const yc = http.request({ host: '127.0.0.1', port: congCon, path: duong, method: thanBody ? 'POST' : 'GET',
        headers: { ...(thanBody ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}), ...tieuDe } }, (res) => {
        let t = '';
        res.on('data', (d) => { t += d; });
        res.on('end', () => { let j = {}; try { j = JSON.parse(t); } catch { /* không phải JSON */ } ok({ status: res.statusCode, j }); });
      });
      yc.on('error', () => ok({ status: 0, j: {} }));
      yc.end(body);
    });
    const saiCon = (tieuDe, ten = 'admin') => hoi('/api/pos/auth/login', tieuDe, { username: ten, password: 'mat_khau_sai' });
    let len = false;
    for (let i = 0; i < 150 && !len; i++) {
      len = (await hoi('/api/pos/auth/login', {}, { username: 'x', password: 'y' })).status !== 0;
      if (!len) await new Promise((r) => setTimeout(r, 200));
    }
    ca('J0 máy chủ thật (server/index.js) lên được trong tiến trình con', len, nhatKyCon.slice(-300));
    if (len) {
      const nam = async (tieuDe, ten) => { const kq = []; for (let i = 0; i < 5; i++) kq.push(await saiCon(tieuDe(i), ten)); return kq; };
      // V3a — cùng X-Forwarded-For (IP máy Cloudflare) mà True-Client-IP khác → đếm RIÊNG
      const cf = '172.71.1.1';
      const kA = await nam(() => ({ 'X-Forwarded-For': cf, 'True-Client-IP': '203.0.113.10' }));
      const kB = await nam(() => ({ 'X-Forwarded-For': cf, 'True-Client-IP': '203.0.113.11' }));
      const a6 = await saiCon({ 'X-Forwarded-For': cf, 'True-Client-IP': '203.0.113.10' });
      ca('J1 hai khách sau CÙNG máy Cloudflare (XFF giống nhau, True-Client-IP khác): mỗi người đủ 5 lần sai (401), không dính nhau',
        kA.every((r) => r.status === 401) && kB.every((r) => r.status === 401), [kA.map((r) => r.status), kB.map((r) => r.status)]);
      ca('J2 người thứ nhất sai lần 6 → 429 QUA_NHIEU_LAN (đếm theo IP thật)', a6.status === 429 && a6.j.code === 'QUA_NHIEU_LAN', [a6.status, a6.j]);
      const b6 = await saiCon({ 'X-Forwarded-For': cf, 'True-Client-IP': '203.0.113.11' });
      ca('J3 người thứ hai cũng 429 ở lần 6 của MÌNH (không bị khoá thay người kia)', b6.status === 429, b6.status);
      const dungKhac = await hoi('/api/pos/auth/login', { 'X-Forwarded-For': cf, 'True-Client-IP': '203.0.113.12' }, { username: 'admin', password: 'admin123' });
      ca('J4 người thứ ba (IP thật khác, cùng máy Cloudflare) vẫn đăng nhập đúng vào được (200)', dungKhac.status === 200 && !!dungKhac.j.token, [dungKhac.status, dungKhac.j.code]);
      // V3b — cùng True-Client-IP, X-Forwarded-For đổi liên tục → đếm CHUNG (không lách)
      const kC = [];
      for (let i = 0; i < 5; i++) kC.push(await saiCon({ 'X-Forwarded-For': `198.51.100.${i + 1}`, 'True-Client-IP': '203.0.113.20' }, 'nv_khong_co'));
      const c6 = await saiCon({ 'X-Forwarded-For': '198.51.100.99', 'True-Client-IP': '203.0.113.20' }, 'nv_khong_co');
      ca('J5 cùng True-Client-IP, X-Forwarded-For đổi mỗi lần: vẫn đếm CHUNG → lần 6 là 429 (không lách được bằng XFF)',
        kC.every((r) => r.status === 401) && c6.status === 429, [kC.map((r) => r.status), c6.status]);
      // CF-Connecting-IP thay True-Client-IP; True-Client-IP đứng trước
      const kD = await nam(() => ({ 'X-Forwarded-For': cf, 'CF-Connecting-IP': '203.0.113.30' }), 'nv_cf');
      const d6 = await saiCon({ 'X-Forwarded-For': '172.71.9.9', 'CF-Connecting-IP': '203.0.113.30' }, 'nv_cf');
      ca('J6 chỉ có CF-Connecting-IP (không True-Client-IP): vẫn lấy IP thật → lần 6 từ cùng IP đó là 429 dù XFF khác',
        kD.every((r) => r.status === 401) && d6.status === 429, [kD.map((r) => r.status), d6.status]);
      const kE = await nam(() => ({ 'X-Forwarded-For': cf, 'True-Client-IP': '203.0.113.40', 'CF-Connecting-IP': '203.0.113.41' }), 'nv_uu');
      const e6a = await saiCon({ 'X-Forwarded-For': cf, 'True-Client-IP': '203.0.113.99', 'CF-Connecting-IP': '203.0.113.41' }, 'nv_uu');
      const e6b = await saiCon({ 'X-Forwarded-For': cf, 'True-Client-IP': '203.0.113.40', 'CF-Connecting-IP': '203.0.113.42' }, 'nv_uu');
      ca('J7 có cả hai: CF-Connecting-IP được ưu tiên (Cloudflare LUÔN ghi đè; True-Client-IP khách tự gửi được nếu chưa bật Managed Transform): đổi True-Client-IP vẫn 429 (không lách được); đổi CF-Connecting-IP thì là người khác → 401',
        kE.every((r) => r.status === 401) && e6a.status === 429 && e6b.status === 401, [e6a.status, e6b.status]);
      // IPv6 hợp lệ
      const kF = await nam(() => ({ 'X-Forwarded-For': cf, 'True-Client-IP': '2001:db8::7' }), 'nv_v6');
      const f6 = await saiCon({ 'X-Forwarded-For': '172.71.7.7', 'True-Client-IP': '2001:db8::7' }, 'nv_v6');
      ca('J8 IPv6 hợp lệ cũng được nhận làm IP thật', kF.every((r) => r.status === 401) && f6.status === 429, [kF.map((r) => r.status), f6.status]);
      // không có header Cloudflare → như cũ (IP từ XFF, một tầng proxy)
      const kG = await nam(() => ({ 'X-Forwarded-For': '192.0.2.50' }), 'nv_cu');
      const g6 = await saiCon({ 'X-Forwarded-For': '192.0.2.50' }, 'nv_cu');
      const g7 = await saiCon({ 'X-Forwarded-For': '192.0.2.51' }, 'nv_cu');
      ca('J9 không có header Cloudflare → đếm theo XFF như cũ (cùng XFF 429 ở lần 6; XFF khác là người khác)',
        kG.every((r) => r.status === 401) && g6.status === 429 && g7.status === 401, [g6.status, g7.status]);
      // header rác → bỏ qua, quay về IP cũ (XFF)
      const rac = ['abc', '1.2.3.4, 5.6.7.8', '999.1.1.1', '', ' ', '1.2.3.4:80', '203.0.113.1/24'];
      const kH = [];
      for (const r of rac.slice(0, 5)) kH.push(await saiCon({ 'X-Forwarded-For': '192.0.2.60', 'True-Client-IP': r }, 'nv_rac'));
      const h6 = await saiCon({ 'X-Forwarded-For': '192.0.2.60', 'CF-Connecting-IP': rac[5] }, 'nv_rac');
      ca('J10 header rác (abc, danh sách "a, b", ngoài dải, rỗng, có cổng) bị bỏ qua → đếm theo XFF: lần 6 là 429', kH.every((r) => r.status === 401) && h6.status === 429, [kH.map((r) => r.status), h6.status]);
      const dsRac = [];
      for (let i = 0; i < 6; i++) dsRac.push(await saiCon({ 'X-Forwarded-For': `192.0.2.${70 + i}`, 'True-Client-IP': '1.2.3.4, 5.6.7.8' }, 'nv_ds'));
      ca('J11 "1.2.3.4, 5.6.7.8" KHÔNG bị cắt lấy phần đầu làm IP (nếu cắt thì 6 lần này dồn một IP và lần 6 là 429)', dsRac.every((r) => r.status === 401), dsRac.map((r) => r.status));
      // /api/kh (đường cũ KHÔNG sửa) đếm theo IP thật: 300 lượt / phút / IP cho /menu không token
      const menu = (tieuDe) => hoi('/api/kh/menu', tieuDe);
      const dau = await menu({ 'X-Forwarded-For': cf, 'True-Client-IP': '203.0.113.50' });
      ca('J12 /api/kh/menu trả 200 cho khách không token (điều kiện của ca J13)', dau.status === 200, [dau.status, dau.j]);
      let kqKh = [];
      for (let lo = 0; lo < 299; lo += 50) {
        kqKh = kqKh.concat(await Promise.all(Array.from({ length: Math.min(50, 299 - lo) }, () => menu({ 'X-Forwarded-For': cf, 'True-Client-IP': '203.0.113.50' }))));
      }
      const quaTran = await menu({ 'X-Forwarded-For': cf, 'True-Client-IP': '203.0.113.50' });
      const nguoiKhac = await menu({ 'X-Forwarded-For': cf, 'True-Client-IP': '203.0.113.51' });
      ca('J13 /api/kh/menu (giuLuotMenu — đường cũ, không sửa): 300 lượt của một IP thật rồi lượt 301 → 429; người khác sau cùng máy Cloudflare vẫn 200',
        kqKh.every((r) => r.status === 200) && quaTran.status === 429 && nguoiKhac.status === 200, [quaTran.status, nguoiKhac.status, [...new Set(kqKh.map((r) => r.status))]]);
    }
    con.kill();
    // phép tĩnh: một hàm ipKhach + MỘT middleware ngay sau trust proxy, trước app.use đầu tiên
    const bo = (f) => doc(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const idx = bo('server/index.js');
    const iTrust = idx.indexOf("app.set('trust proxy', 1)");
    const iUse = idx.indexOf('app.use(');
    const iIp = idx.indexOf('ipKhach(req)');
    ca('J14 server/index.js: middleware ghi đè req.ip bằng ipKhach(req) đứng SAU trust proxy và TRƯỚC app.use đầu tiên (chính nó là app.use đầu)',
      iTrust > 0 && iUse > iTrust && /^app\.use\(\(req, res, next\) => \{[\s\S]*?ipKhach\(req\)/.test(idx.slice(iUse)) && iIp > iUse && iIp < idx.indexOf('app.use(', iUse + 1));
    const hamIp = (() => { try { return require(path.join(MAY_CHU, 'utils', 'ipKhach.js')); } catch { return null; } })();
    ca('J15 server/utils/ipKhach.js có hàm ipKhach(req)', !!hamIp && typeof (hamIp.ipKhach || hamIp) === 'function');
    const lay = hamIp && (hamIp.ipKhach || hamIp);
    const gia = (h, ip) => ({ headers: h, ip });
    ca('J16 ipKhach: CF-Connecting-IP > True-Client-IP > req.ip; rác → bỏ qua / req.ip',
      !!lay && lay(gia({ 'true-client-ip': '1.1.1.1', 'cf-connecting-ip': '2.2.2.2' }, '9.9.9.9')) === '2.2.2.2'
      && lay(gia({ 'true-client-ip': '1.1.1.1' }, '9.9.9.9')) === '1.1.1.1'
      && lay(gia({ 'cf-connecting-ip': 'abc', 'true-client-ip': '1.1.1.1' }, '9.9.9.9')) === '1.1.1.1'
      && lay(gia({ 'cf-connecting-ip': '2.2.2.2' }, '9.9.9.9')) === '2.2.2.2'
      && lay(gia({ 'true-client-ip': 'abc', 'cf-connecting-ip': '2.2.2.2' }, '9.9.9.9')) === '2.2.2.2'
      && lay(gia({ 'true-client-ip': '1.1.1.1, 2.2.2.2' }, '9.9.9.9')) === '9.9.9.9'
      && lay(gia({}, '9.9.9.9')) === '9.9.9.9' && lay(gia({ 'true-client-ip': ['1.1.1.1', '2.2.2.2'] }, '9.9.9.9')) === '9.9.9.9');
  }

  // ═══ I — nối vào bộ kiểm ═══
  muc('I — nối vào kiem_tra_truoc_khi_giao.js');
  ca('I1 bộ kiểm chạy bài này', /chayBaiThat\('cong_cu\/thu_DANGNHAP2\.js'\)/.test(doc('kiem_tra_truoc_khi_giao.js')));

  bcrypt.compare = soGoc;
  Date.now = dongHoThat;
  sv.close();
  console.log(`\n${dat} đạt · ${hong} hỏng`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { console.log('✗ sập: ' + (e && e.stack || e)); process.exit(2); });
