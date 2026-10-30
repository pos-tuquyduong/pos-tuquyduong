#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KH-UI-1 — máy chủ POS phục vụ App KH theo tên miền (KH_HOST) + hàm thuần của app_kh
 * ═══════════════════════════════════════════════════════════════════════════
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KHUI1.js      (in "n đạt · 0 hỏng")
 *
 *  server/index.js luôn gọi startServer() nên không `require` được → bài mở NGUYÊN `node server/index.js` làm tiến trình con
 *  (khối thật đang chạy, không dựng bản giả). REPL_ID đặt để ketNoiKho chọn kho thử data/pos_thu.db (gitignore), SX tắt.
 *  Cổng ngẫu nhiên. Host giả đặt bằng tiêu đề Host của http.request.
 *  Cần `(cd app_kh && npm ci && npm run build)` trước — chưa có app_kh/dist thì các ca H2/H4 hỏng, đúng ý.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const GOC = path.join(__dirname, '..');
const KH_HOST = 'kh.thu.test';
const DOC = (...p) => fs.readFileSync(path.join(GOC, ...p), 'utf8');
const CO = (...p) => fs.existsSync(path.join(GOC, ...p));

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); }
  else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);

const congTrong = () => new Promise((ok, loi) => {
  const s = net.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); });
  s.on('error', loi);
});

/** Mở máy chủ thật; env thêm vào (KH_HOST…) tuỳ ca. Trả { cong, dung() }. */
async function moMayChu(envThem) {
  const cong = await congTrong();
  const env = { ...process.env, REPL_ID: 'thu_khui1', PORT: String(cong), ...envThem };
  delete env.KH_HOST;
  Object.assign(env, envThem);
  const con = spawn(process.execPath, [path.join(GOC, 'server', 'index.js')], { cwd: GOC, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  con.stdout.on('data', (d) => { log += d; });
  con.stderr.on('data', (d) => { log += d; });
  process.on('exit', () => { try { con.kill(); } catch { /* đã thoát */ } });   // mọi đường thoát (kể cả catch → exit 2) đều dọn máy chủ con
  const han = Date.now() + 30000;
  for (;;) {
    if (con.exitCode !== null) throw new Error('máy chủ thoát sớm: ' + log.slice(-400));
    try { if ((await goi(cong, '/api/pos/health')).status === 200) break; } catch { /* chưa nghe */ }
    if (Date.now() > han) { con.kill(); throw new Error('máy chủ không lên trong 30 s: ' + log.slice(-400)); }
    await new Promise((r) => setTimeout(r, 200));
  }
  return { cong, dung: () => new Promise((r) => { con.once('exit', r); con.kill(); }) };
}

function goi(cong, duong, host, them = {}) {
  return new Promise((ok, loi) => {
    const yc = http.request({ host: '127.0.0.1', port: cong, path: duong, headers: { ...(host === undefined ? {} : { Host: host }), ...them } }, (res) => {
      res.setEncoding('utf8');   // ghép mẩu theo ký tự: chữ nhiều byte rơi đúng ranh giới mẩu không bị hỏng (H2f đỏ oan sau khi dist đổi)
      let than = '';
      res.on('data', (d) => { than += d; });
      res.on('end', () => ok({ status: res.statusCode, than }));
    });
    yc.on('error', loi);
    yc.end();
  });
}

/** Yêu cầu có tiêu đề Host RỖNG — http.request tự thay Host rỗng bằng Host mặc định nên phải gửi thô qua socket. */
function goiHostRong(cong, duong) {
  return new Promise((ok, loi) => {
    const s = net.connect(cong, '127.0.0.1', () => s.write(`GET ${duong} HTTP/1.1\r\nHost:\r\nConnection: close\r\n\r\n`));
    let tho = '';
    s.on('data', (d) => { tho += d; });
    s.on('error', loi);
    s.on('close', () => {
      const i = tho.indexOf('\r\n\r\n');
      ok({ status: Number(tho.slice(9, 12)), than: i < 0 ? '' : tho.slice(i + 4) });
    });
  });
}

(async () => {
  const KHOA_KH = 'thu_khui1_kh_' + Date.now();
  const KHOA_NV = 'thu_khui1_nv_' + Date.now();
  const quay = CO('client', 'dist', 'index.html') ? DOC('client', 'dist', 'index.html') : null;
  const appKh = CO('app_kh', 'dist', 'index.html') ? DOC('app_kh', 'dist', 'index.html') : null;

  muc('H1 — KH_HOST chưa đặt: hành vi cũ y nguyên');
  let mc = await moMayChu({ KH_JWT_SECRET: KHOA_KH, JWT_SECRET: KHOA_NV });
  let r = await goi(mc.cong, '/', KH_HOST);
  k('H1 chưa đặt KH_HOST, Host = tên App → vẫn client/dist/index.html', quay !== null && r.status === 200 && r.than === quay, `status ${r.status}`);
  r = await goi(mc.cong, '/diem', KH_HOST);
  k('H1 đường lạ → SPA của quầy', quay !== null && r.status === 200 && r.than === quay);
  r = await goiHostRong(mc.cong, '/');
  k('H1 Host rỗng, KH_HOST chưa đặt → vẫn client/dist (rỗng không khớp rỗng)', quay !== null && r.status === 200 && r.than === quay, `status ${r.status}`);
  await mc.dung();

  muc('H2 — KH_HOST đặt: chọn thư mục tĩnh theo Host');
  // KH_HOST gõ tay trên Render dễ thừa khoảng trắng / chữ hoa: máy chủ phải chuẩn hoá phía KH_HOST (trim + chữ thường), không chỉ phía Host.
  mc = await moMayChu({ KH_JWT_SECRET: KHOA_KH, JWT_SECRET: KHOA_NV, KH_HOST: `  ${KH_HOST.toUpperCase()} ` });
  r = await goi(mc.cong, '/', KH_HOST);
  k('H2 Host đúng → app_kh/dist/index.html', appKh !== null && r.status === 200 && r.than === appKh, `status ${r.status}`);
  k('H2 App KH khác trang quầy (đối chứng)', appKh !== null && quay !== null && appKh !== quay);
  r = await goi(mc.cong, '/', 'pos.thu.test');
  k('H2 Host khác → client/dist', quay !== null && r.status === 200 && r.than === quay);
  r = await goi(mc.cong, '/');
  k('H2 Host mặc định (127.0.0.1) → client/dist', quay !== null && r.status === 200 && r.than === quay);
  r = await goi(mc.cong, '/diem', KH_HOST);
  k('H2b Host đúng + đường không phải file → index.html App KH', appKh !== null && r.status === 200 && r.than === appKh);
  r = await goi(mc.cong, '/', KH_HOST.toUpperCase() + ':8080');
  k('H2c Host viết hoa + cổng vẫn khớp', appKh !== null && r.status === 200 && r.than === appKh);
  r = await goi(mc.cong, '/', 'x' + KH_HOST);
  k('H2c Host có tiền tố thừa → client/dist', quay !== null && r.than === quay);
  r = await goi(mc.cong, '/', KH_HOST + '.evil.test');
  k('H2c Host có hậu tố thừa → client/dist', quay !== null && r.than === quay);
  r = await goi(mc.cong, '/', 'pos.thu.test', { 'X-Forwarded-Host': KH_HOST });
  k('H2c X-Forwarded-Host KH_HOST nhưng Host là quầy → client/dist (không tin tiêu đề chuyển tiếp)', quay !== null && r.than === quay);
  const tepApp = appKh === null ? [] : [...appKh.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]);
  k('H2e index.html App KH có file con để thử', tepApp.length > 0);
  for (const t of tepApp) {
    r = await goi(mc.cong, t, KH_HOST);
    k(`H2e ${t} ở Host App KH → đúng nội dung app_kh/dist`, r.status === 200 && r.than === DOC('app_kh', 'dist', t.slice(1)), `status ${r.status}`);
    r = await goi(mc.cong, t, 'pos.thu.test');
    k(`H2e ${t} ở Host quầy KHÔNG ra file của App KH`, r.than !== DOC('app_kh', 'dist', t.slice(1)));
  }
  const asset = (quay || '').match(/(?:src|href)="(\/assets\/[^"]+)"/);
  const rq = asset ? await goi(mc.cong, asset[1], 'pos.thu.test') : { status: 0 };
  k('H2f quầy: file trong client/dist/assets vẫn tải được ở Host quầy khi KH_HOST đặt', rq.status === 200 && rq.than === DOC('client', 'dist', asset[1].slice(1)));

  muc('H2d/H3 — /api/* dùng chung một máy chủ');
  for (const host of [KH_HOST, 'pos.thu.test']) {
    r = await goi(mc.cong, '/api/pos/health', host);
    k(`H2d /api/pos/health ở Host ${host} vẫn JSON của máy chủ`, r.status === 200 && r.than.includes('"status":"ok"'));
    r = await goi(mc.cong, '/api/kh/toi', host);
    let ma = ''; try { ma = JSON.parse(r.than).code; } catch { /* không phải JSON */ }
    k(`H3 /api/kh/toi không token ở Host ${host} → 401 KH_TOKEN_SAI`, r.status === 401 && ma === 'KH_TOKEN_SAI', `status ${r.status}`);
    r = await goi(mc.cong, '/api/kh/menu', host);
    let menu = null; try { menu = JSON.parse(r.than); } catch { /* không phải JSON */ }
    k(`H3 /api/kh/menu không token ở Host ${host} → 200 JSON (KH-API-3: xem menu không cần đăng nhập)`, r.status === 200 && !!menu && menu.success === true, `status ${r.status}`);
  }
  r = await goi(mc.cong, '/api/khong-co', KH_HOST);
  k('H2d /api/ lạ ở Host App KH → 404 JSON, không trả trang HTML', r.status === 404 && !r.than.includes('<html'));
  await mc.dung();

  muc('H4 — index.html App KH trỏ tới file có thật');
  if (appKh === null) k('H4 có app_kh/dist/index.html', false, 'chưa dựng app_kh/dist');
  else {
    const tro = [...appKh.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]);
    k('H4 index.html có ít nhất một file con trỏ tới', tro.length > 0);
    for (const t of tro) k(`H4 ${t} có trong app_kh/dist/`, CO('app_kh', 'dist', t.slice(1)));
  }

  muc('H5 — hàm thuần app_kh/src/dinhDang.js');
  let d = null;
  try { d = await import(pathToFileURL(path.join(GOC, 'app_kh', 'src', 'dinhDang.js')).href); } catch (e) { k('H5 nạp được dinhDang.js', false, e.message); }
  if (d) {
    k('H5 dinhDangGia(25000) = "25.000đ"', d.dinhDangGia(25000) === '25.000đ', String(d.dinhDangGia(25000)));
    k('H5 dinhDangGia(0) = "0đ"', d.dinhDangGia(0) === '0đ');
    k('H5 dinhDangGia(1234567) = "1.234.567đ"', d.dinhDangGia(1234567) === '1.234.567đ');
    k('H5 dinhDangGia(999) không dấu chấm thừa', d.dinhDangGia(999) === '999đ');
    k('H5 dinhDangGia(null) = "" (không bịa số)', d.dinhDangGia(null) === '');
    k('H5 dinhDangNgay("2026-10-22T14:05:00") = "14:05 22/10/2026"', d.dinhDangNgay('2026-10-22T14:05:00') === '14:05 22/10/2026', String(d.dinhDangNgay('2026-10-22T14:05:00')));
    k('H5 dinhDangNgay(rỗng) = ""', d.dinhDangNgay('') === '' && d.dinhDangNgay(null) === '');
    k('H5 loiTheoCode: có error của máy chủ → dùng đúng error đó', d.loiTheoCode('MA_SAI', 'Mã không đúng') === 'Mã không đúng');
    k('H5 loiTheoCode: không error, có code đã biết → lời tiếng Việt', /[à-ỹ]/i.test(d.loiTheoCode('KH_CHUA_CAU_HINH', '')));
    k('H5 loiTheoCode: code lạ + không error → lời chung, không rỗng', d.loiTheoCode('MA_LA', '').length > 0);
    k('H5 loiTheoCode: lỗi mạng (code MANG_LOI) có lời riêng khác lời chung', d.loiTheoCode('MANG_LOI', '') !== d.loiTheoCode('MA_LA', ''));
  }

  muc('Luật phiếu — chỉ MỘT chỗ gọi máy chủ');
  const nguon = [];
  const quet = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) quet(p); else if (/\.(jsx?|html)$/.test(e.name)) nguon.push(p);
  } };
  if (CO('app_kh', 'src')) quet(path.join(GOC, 'app_kh', 'src'));
  const fetchNgoai = nguon.filter((p) => /\bfetch\s*\(/.test(fs.readFileSync(p, 'utf8')) && path.basename(p) !== 'api.js');
  k('mọi fetch( của app_kh/src nằm trong api.js', nguon.length > 0 && fetchNgoai.length === 0, fetchNgoai.join(', '));
  k('không đường /api/pos trong app_kh/src', nguon.length > 0 && !nguon.some((p) => fs.readFileSync(p, 'utf8').includes('/api/pos')));

  console.log(`\n${C.dam}${dat} đạt · ${hong} hỏng${C.het}`);
  process.exit(hong ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
