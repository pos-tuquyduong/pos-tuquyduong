#!/usr/bin/env node
/**
 * THỬ KH-NHANH-POS-1 — CORS `maxAge` cho /api/kh: trình duyệt nhớ kết quả hỏi trước (preflight) 2 giờ.
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KHNHANHPOS1.js
 *  Mở máy chủ THẬT (server/index.js, kho thử qua REPL_ID) rồi gửi OPTIONS. Bản đột biến: --goc <thư mục gốc có server/>
 */
const net = require('net');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const iG = process.argv.indexOf('--goc');
const GOC = iG > 0 ? path.resolve(process.argv[iG + 1]) : path.join(__dirname, '..');

let dat = 0;
let hong = 0;
function ca(ten, dung, chiTiet) {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); return; }
  hong++;
  console.log(`  ✗ ${ten}${chiTiet === undefined ? '' : ' — ' + JSON.stringify(chiTiet)}`);
}

const congTrong = () => new Promise((ok, loi) => {
  const s = net.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); });
  s.on('error', loi);
});

function goi(cong, method, duong, headers) {
  return new Promise((ok, loi) => {
    const yc = http.request({ host: '127.0.0.1', port: cong, path: duong, method, headers }, (res) => {
      res.resume();
      res.on('end', () => ok({ status: res.statusCode, h: res.headers }));
    });
    yc.on('error', loi);
    yc.end();
  });
}

async function main() {
  const cong = await congTrong();
  const env = { ...process.env, REPL_ID: 'thu_khnhanhpos1', PORT: String(cong) };
  const con = spawn(process.execPath, [path.join(GOC, 'server', 'index.js')], { cwd: GOC, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  con.stdout.on('data', (d) => { log += d; });
  con.stderr.on('data', (d) => { log += d; });
  process.on('exit', () => { try { con.kill(); } catch { /* đã thoát */ } });
  const han = Date.now() + 30000;
  for (;;) {
    if (con.exitCode !== null) throw new Error('máy chủ thoát sớm: ' + log.slice(-400));
    try { if ((await goi(cong, 'GET', '/api/pos/health', {})).status === 200) break; } catch { /* chưa nghe */ }
    if (Date.now() > han) { con.kill(); throw new Error('máy chủ không lên trong 30 s: ' + log.slice(-400)); }
    await new Promise((r) => setTimeout(r, 200));
  }

  const hoi = (duong, method = 'GET', tieuDe = 'authorization') => goi(cong, 'OPTIONS', duong,
    { Origin: 'https://app.thu.test', 'Access-Control-Request-Method': method, 'Access-Control-Request-Headers': tieuDe });

  const a = await hoi('/api/kh/me');
  ca('A1 OPTIONS /api/kh/... → Access-Control-Max-Age: 7200', a.h['access-control-max-age'] === '7200', a.h['access-control-max-age']);
  const a2 = await hoi('/api/kh/don/abc', 'POST', 'authorization,content-type');
  ca('A2 POST + Authorization,Content-Type → cũng Max-Age 7200', a2.h['access-control-max-age'] === '7200', a2.h['access-control-max-age']);

  // B: không đổi origin / methods / allowedHeaders
  ca('B1 origin vẫn *', a.h['access-control-allow-origin'] === '*', a.h['access-control-allow-origin']);
  ca('B2 methods vẫn GET,POST,PUT,DELETE', a.h['access-control-allow-methods'] === 'GET,POST,PUT,DELETE', a.h['access-control-allow-methods']);
  ca('B3 allowedHeaders vẫn Content-Type,Authorization', a.h['access-control-allow-headers'] === 'Content-Type,Authorization', a.h['access-control-allow-headers']);
  ca('B4 OPTIONS vẫn trả 204', a.status === 204, a.status);

  // K5: yêu cầu thường (không phải preflight) vẫn chạy, không mang Max-Age
  const t = await goi(cong, 'GET', '/api/pos/health', { Origin: 'https://app.thu.test' });
  ca('K5a GET thường vẫn 200 + origin *', t.status === 200 && t.h['access-control-allow-origin'] === '*', [t.status, t.h['access-control-allow-origin']]);
  ca('K5b GET thường KHÔNG mang Max-Age (chỉ preflight)', t.h['access-control-max-age'] === undefined, t.h['access-control-max-age']);

  con.kill();
  console.log(`\n${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { console.log('✗ sập: ' + e.message); process.exit(2); });
