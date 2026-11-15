#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ SAOLUU-DEM-1 — cửa sao lưu tự động: MỘT khoá chỉ đọc `posk_` lấy đúng tệp "Sao lưu toàn bộ" (GET /api/pos/backup/tu-dong).
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_SAOLUUDEM1.js [--goc <thư mục có server/ + client/src/ (bản sao đột biến)>]
 *  Mở máy chủ THẬT (server/index.js) trên kho TẠM (biến kết nối trỏ file tạm, không REPL_ID). IP mỗi ca đặt bằng header cf-connecting-ip
 *  (DANG-NHAP-2) — mỗi ca một IP để bộ đếm 6 lần / giờ không xen nhau. Số mong đợi viết TAY (6 lần, 43 ký tự = 32 byte base64url).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const net = require('net');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');

const GOC = path.join(__dirname, '..');
const iG = process.argv.indexOf('--goc');
const GOC_THU = iG > 0 ? path.resolve(process.argv[iG + 1]) : GOC;
const SV = path.join(GOC_THU, 'server');
const MOC = '2f40a7b';   // commit PHIEU: SAOLUU-DEM-1 (gốc của việc)
const KHOA_DB = 'khoa_sao_luu_pos';   // tên khoá trong pos_settings — viết TAY, module phải xuất đúng tên này
const CUA = '/api/pos/backup/tu-dong';
const QL = '/api/pos/backup/khoa-tu-dong';   // cửa quản lý: GET trạng thái · POST tạo · POST /thu-hoi
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_saoluudem1_'));
process.env.JWT_SECRET = 'thu_saoluudem1_' + crypto.randomBytes(8).toString('hex');
const nm = (m) => require(path.join(GOC, 'node_modules', m));
const jwt = nm('jsonwebtoken');
const bcrypt = nm('bcryptjs');
const XLSX = nm('xlsx');
const { createClient } = nm('@libsql/client');

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them !== '' ? '  — ' + String(them).slice(0, 300) : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const doan = async (ten, fn) => { try { await fn(); } catch (e) { k(`${ten} — sập`, false, e.stack ? e.stack.split('\n').slice(0, 2).join(' ') : e); } };
const doc = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const moTa = (r) => `HTTP ${r?.status}${r?.j?.code ? ' · ' + r.j.code : ''}${r?.j?.error ? ' · ' + r.j.error : ''}`;
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

function goiTho(cong, method, duong, { headers = {}, body } = {}) {
  return new Promise((ok, loi) => {
    const buf = body === undefined ? null : Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    const h = { ...headers };
    if (buf) { h['Content-Length'] = buf.length; if (!h['Content-Type']) h['Content-Type'] = 'application/json'; }
    const yc = http.request({ host: '127.0.0.1', port: cong, path: duong, method, headers: h }, (res) => {
      const ph = [];
      res.on('data', (d) => ph.push(d));
      res.on('end', () => {
        const b = Buffer.concat(ph);
        let j = null; try { j = JSON.parse(b.toString('utf8')); } catch { /* không phải JSON */ }
        ok({ status: res.statusCode, h: res.headers, b, j: j && typeof j === 'object' ? j : {} });
      });
    });
    yc.on('error', loi);
    if (buf) yc.write(buf);
    yc.end();
  });
}
const congTrong = () => new Promise((ok, loi) => {
  const s = net.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); });
  s.on('error', loi);
});
function multipart(tenTep, buf, truong = 'file') {
  const ranh = '----sl' + crypto.randomBytes(8).toString('hex');
  const dau = Buffer.from(`--${ranh}\r\nContent-Disposition: form-data; name="${truong}"; filename="${tenTep}"\r\nContent-Type: application/octet-stream\r\n\r\n`);
  return { body: Buffer.concat([dau, buf, Buffer.from(`\r\n--${ranh}--\r\n`)]), type: 'multipart/form-data; boundary=' + ranh };
}

async function moMay() {
  const cong = await congTrong();
  const fileKho = path.join(THU_MUC, 'kho.db');
  const env = { PATH: process.env.PATH, HOME: process.env.HOME, PORT: String(cong), JWT_SECRET: process.env.JWT_SECRET,
    TURSO_DATABASE_URL: 'file:' + fileKho, NODE_ENV: 'production' };
  const con = spawn(process.execPath, [path.join(SV, 'index.js')], { cwd: THU_MUC, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  con.stdout.on('data', (d) => { log = (log + d).slice(-300000); });
  con.stderr.on('data', (d) => { log = (log + d).slice(-300000); });
  process.on('exit', () => { try { con.kill(); } catch { /* đã thoát */ } });
  const han = Date.now() + 60000;
  for (;;) {
    if (con.exitCode !== null) throw new Error('máy thoát sớm: ' + log.slice(-400));
    try { if ((await goiTho(cong, 'GET', '/api/pos/health')).status === 200) break; } catch { /* chưa nghe */ }
    if (Date.now() > han) throw new Error('máy không lên trong 60 s: ' + log.slice(-400));
    await new Promise((r) => setTimeout(r, 200));
  }
  const db = createClient({ url: 'file:' + fileKho });
  await db.execute('PRAGMA busy_timeout = 5000');
  const q = async (sql, a = []) => (await db.execute({ sql, args: a })).rows.map((r) => ({ ...r }));
  let ipDem = 10;
  const ipMoi = () => `10.9.${Math.floor(++ipDem / 200)}.${ipDem % 200 + 1}`;
  const goi = (method, duong, { ve, body, ip = ipMoi(), headers = {} } = {}) => goiTho(cong, method, duong, {
    body, headers: { ...headers, 'cf-connecting-ip': ip, ...(ve ? { Authorization: 'Bearer ' + ve } : {}) } });
  const ownerId = Number((await q("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1"))[0].id);
  const vePos = jwt.sign({ userId: ownerId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { cong, q, goi, ipMoi, vePos, ownerId, log: () => log };
}

const trangCua = (buf) => {
  const wb = XLSX.read(buf, { type: 'buffer' });
  return Object.fromEntries(wb.SheetNames.map((s) => [s, XLSX.utils.sheet_to_json(wb.Sheets[s], { defval: null })]));
};

async function main() {
  // ═══ A · tĩnh: MỘT hàm dựng tệp ═══
  muc('[A] Một hàm dựng tệp (tĩnh)');
  const bk = doc(path.join(SV, 'routes', 'backup.js'));
  const route = (duong) => { const i = bk.indexOf(`'${duong}'`); return i < 0 ? '' : bk.slice(i).split(/\nrouter\./)[0]; };   // chỉ thân MỘT route (tới `router.` kế tiếp)
  const dung = bk.split('async function dungTepSaoLuu')[1]?.split(/\nrouter\./)[0] || '';   // thân hàm (tới route kế tiếp)
  k('A1a backup.js có hàm dungTepSaoLuu (có XLSX.write + bangDangCo); hai route /export-all, /tu-dong KHÔNG tự dựng tệp (không XLSX. / book_new / readTablePaged / bangDangCo)',
    /XLSX\.write\(/.test(dung) && /bangDangCo\(\)/.test(dung) && ['/export-all', '/tu-dong'].every((d) => route(d) !== '' && !/XLSX\.|book_new|readTablePaged|bangDangCo/.test(route(d))),
    `thân hàm ${dung.length} ký tự`);
  k("A1b /export-all và /tu-dong cùng gọi dungTepSaoLuu(", /dungTepSaoLuu\(/.test(route('/export-all')) && /dungTepSaoLuu\(/.test(route('/tu-dong')));
  const khoaMd = doc(path.join(SV, 'utils', 'khoaSaoLuuPos.js'));
  k(`B1a khoaSaoLuuPos.js xuất KHOA_CAI_DAT = '${KHOA_DB}' (tên khoá riêng một chỗ)`, new RegExp(`KHOA_CAI_DAT\\s*=\\s*'${KHOA_DB}'`).test(khoaMd) && /KHOA_CAI_DAT/.test(doc(path.join(SV, 'routes', 'settings.js'))));
  let diffIndex = 'không đo được';
  try { diffIndex = execFileSync('git', ['diff', '--stat', MOC, 'HEAD', '--', 'server/index.js'], { cwd: GOC, encoding: 'utf8' }).trim(); } catch { /* kho nông */ }
  k('B3 server/index.js không đổi so với gốc của việc', diffIndex === '', diffIndex);

  const A = await moMay();
  const PIN = '4821';
  await A.q("INSERT OR REPLACE INTO pos_pin_chu_quan (id, pin_bam, sai, khoa_den, dat_boi, dat_luc) VALUES (1, ?, 0, NULL, 'admin', '2026-11-14T08:00:00')", [bcrypt.hashSync(PIN, 4)]);
  const veQly = await (async () => {
    const r = await A.goi('POST', '/api/pos/users', { ve: A.vePos, body: { username: 'qly_sl', password: 'matkhau1', display_name: 'qly', role: 'manager' } });
    return jwt.sign({ userId: r.j.user?.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  })();
  const tu = (khoa, o = {}) => A.goi('GET', CUA, { headers: khoa === null ? {} : { Authorization: 'Bearer ' + khoa }, ...o });
  const taoKhoa = (ve = A.vePos, pin = PIN) => A.goi('POST', QL, { ve, body: { pin } });
  const dongKhoa = async () => (await A.q('SELECT key, value FROM pos_settings WHERE key = ?', [KHOA_DB]))[0];

  // ═══ B · tạo / thu hồi ═══
  muc('[B] Khoá sao lưu POS: tạo / thay / thu hồi (chỉ chủ quán + PIN)');
  let khoa1 = '', khoa2 = '';
  await doan('B', async () => {
    const t0 = await taoKhoa(A.vePos, null);
    const t1 = await taoKhoa(A.vePos, '0000');
    const t2 = await taoKhoa(veQly, PIN);
    const t3 = await A.goi('POST', QL, { body: { pin: PIN } });
    k('B2a không PIN / PIN sai → lỗi, quản lý → 403, không vé → 401; chưa có dòng khoá nào', [t0, t1].every((r) => r.status >= 400 && r.status < 500 && !r.j.khoa)
      && t2.status === 403 && t3.status === 401 && !(await dongKhoa()), [t0, t1, t2, t3].map(moTa).join(' | '));
    const g0 = await A.goi('GET', QL, { ve: A.vePos });
    k('B1b chưa có khoá → trạng thái co_khoa = false', g0.status === 200 && g0.j.data?.co_khoa === false, moTa(g0) + JSON.stringify(g0.j));
    const t = await taoKhoa();
    khoa1 = t.j.khoa || '';
    k('B1c tạo → 200, khoá posk_ + 43 ký tự base64url (32 byte), hiện trong câu trả lời tạo', t.status === 200 && /^posk_[A-Za-z0-9_-]{43,}$/.test(khoa1), moTa(t));
    const d = await dongKhoa();
    let nd = {}; try { nd = JSON.parse(d?.value || '{}'); } catch { /* hỏng */ }
    k('B1d máy chủ CHỈ giữ băm SHA-256 + tạo lúc + người tạo; chuỗi khoá không nằm ở đâu trong dòng', !!d && nd.ma_bam === sha(khoa1) && !!nd.tao_luc && nd.tao_boi === 'admin'
      && !d.value.includes(khoa1) && !d.value.includes(khoa1.slice(5)), d?.value);
    const g = await A.goi('GET', QL, { ve: A.vePos });
    const gs = JSON.stringify(g.j);
    k('B1e GET trạng thái: co_khoa, tao_luc, tao_boi, lay_luc = null; KHÔNG có băm / khoá', g.status === 200 && g.j.data?.co_khoa === true && !!g.j.data?.tao_luc && g.j.data?.lay_luc === null
      && !gs.includes(sha(khoa1)) && !gs.includes('posk_'), gs);
    const g2 = await A.goi('GET', QL, { ve: veQly });
    k('B2b quản lý xem trạng thái → 403', g2.status === 403, moTa(g2));
    const t4 = await taoKhoa();
    khoa2 = t4.j.khoa || '';
    const a1 = await tu(khoa1), a2 = await tu(khoa2);
    k('B1f tạo khoá mới thay khoá cũ: cũ → 401 ngay, mới → 200; chỉ còn MỘT dòng khoá', t4.status === 200 && khoa2 !== khoa1 && a1.status === 401 && a2.status === 200
      && (await A.q('SELECT COUNT(*) AS n FROM pos_settings WHERE key LIKE ?', ['%sao_luu%']))[0].n === 1, `${moTa(a1)} | ${moTa(a2)}`);
  });

  // ═══ C · cửa lấy tệp ═══
  muc('[C] Cửa lấy tệp GET /api/pos/backup/tu-dong');
  await doan('C', async () => {
    const tay = await A.goi('GET', '/api/pos/backup/export-all', { ve: A.vePos });
    const may = await tu(khoa2);
    const x = tay.status === 200 ? trangCua(tay.b) : {}, y = may.status === 200 ? trangCua(may.b) : {};
    const ten = Object.keys(x), dongSo = (o) => Object.keys(o).map((s) => `${s}=${o[s].length}`).join(',');
    const khacNoiDung = ten.filter((s) => s !== '_Metadata' && JSON.stringify(x[s]) !== JSON.stringify(y[s]));
    k('C1a khoá đúng → 200, Content-Type xlsx, tên tệp POS-backup-<ngày>.xlsx như tải tay', may.status === 200 && /spreadsheetml\.sheet/.test(may.h['content-type'] || '')
      && /^attachment; filename="POS-backup-\d{4}-\d\d-\d\d\.xlsx"$/.test(may.h['content-disposition'] || '') && may.h['content-disposition'] === tay.h['content-disposition'], moTa(may) + ' ' + (may.h['content-disposition'] || ''));
    k('A1c tệp cửa mới = tệp /export-all: cùng tên trang theo cùng thứ tự, cùng số dòng + nội dung mỗi trang (trừ _Metadata)', ten.length > 20 && ten.join('|') === Object.keys(y).join('|')
      && khacNoiDung.length === 0, `trang ${ten.length}/${Object.keys(y).length}; khác: ${khacNoiDung.join(',')} ${dongSo(y).slice(0, 80)}`);
    k('A1d /export-all vẫn như cũ: chủ quán 200, quản lý 403', tay.status === 200 && (await A.goi('GET', '/api/pos/backup/export-all', { ve: veQly })).status === 403);
    const cam = [await tu(null), await tu('posk_' + 'A'.repeat(43)), await tu(khoa1), await tu(null, { ve: A.vePos }), await tu('khong-phai-khoa'),
      await A.goi('GET', CUA + '?khoa=' + khoa2), await A.goi('GET', CUA, { headers: { Authorization: 'Basic ' + khoa2 } })];
    k('C2a thiếu / sai / cũ / vé POS / khoá nằm trong query / sai kiểu → ĐỀU 401 CHUA_DANG_NHAP, cùng một thân (không lộ khoá có tồn tại hay không)',
      cam.every((r) => r.status === 401 && r.j.code === 'CHUA_DANG_NHAP') && new Set(cam.map((r) => JSON.stringify(r.j))).size === 1 && cam.every((r) => !r.b.toString().includes(khoa2)),
      cam.map(moTa).join(' | '));
    const ndk = await A.goi('POST', '/api/pos/nd-khoa-sao-luu', { ve: A.vePos, body: { ten: 'thu', pin: PIN } });
    const vNd = await tu(ndk.j.khoa || 'ndk_x');
    const nd2 = await A.goi('GET', '/api/nd/xuat', { headers: { Authorization: 'Bearer ' + khoa2 } });
    const ndOk = await A.goi('GET', '/api/nd/xuat', { headers: { Authorization: 'Bearer ' + (ndk.j.khoa || 'x') } });
    k('C3a ndk_ ở cửa mới → 401; posk_ ở /api/nd/xuat → 401 (khoá ndk_ vẫn dùng được ở cửa của nó: 200)', /^ndk_/.test(ndk.j.khoa || '') && vNd.status === 401 && nd2.status === 401 && ndOk.status === 200, [vNd, nd2, ndOk].map(moTa).join(' | '));
    const khac = [];
    for (const [m, d] of [['GET', '/api/pos/backup/export-all'], ['GET', '/api/pos/backup/export/pos_settings'], ['GET', '/api/pos/backup/info'], ['GET', QL], ['POST', QL],
      ['GET', '/api/pos/orders'], ['GET', '/api/pos/settings'], ['GET', '/api/pos/auth/me'], ['GET', '/api/pos/customers']]) {
      const r = await A.goi(m, d, { headers: { Authorization: 'Bearer ' + khoa2 }, body: m === 'POST' ? { pin: PIN } : undefined });
      khac.push(`${m} ${d} → ${r.status}`);
    }
    k('C3b posk_ gửi ở mọi cửa POS khác → 401 như không có vé (không mở được gì)', khac.every((s) => / 401$/.test(s)), khac.filter((s) => !/ 401$/.test(s)).join(' | '));
    const ip = A.ipMoi();
    const th = [];
    for (const kh of [khoa2, 'posk_' + 'B'.repeat(43), khoa2, 'posk_' + 'C'.repeat(43), khoa2, 'posk_' + 'D'.repeat(43)]) th.push((await tu(kh, { ip })).status);
    const t7 = await tu(khoa2, { ip }), t8 = await tu('posk_' + 'E'.repeat(43), { ip }), khacIp = await tu(khoa2);
    k('C4 trần 6 lần / giờ / IP, tính cả đúng lẫn sai: 6 lần đầu qua (200 / 401), lần 7 (khoá đúng) và lần 8 (sai) → 429 QUA_NHIEU_LAN; IP khác vẫn 200',
      th.join() === '200,401,200,401,200,401' && t7.status === 429 && t7.j.code === 'QUA_NHIEU_LAN' && t8.status === 429 && khacIp.status === 200, `${th.join()} | ${moTa(t7)} | ${moTa(t8)} | ${moTa(khacIp)}`);
    const g = await A.goi('GET', QL, { ve: A.vePos });
    const bangCuoi = await tu(khoa2);
    const g3 = await A.goi('GET', QL, { ve: A.vePos });
    k('C5a lần lấy gần nhất: lay_luc giờ VN (không hậu tố) + lay_co = số byte của tệp vừa trả', /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(g3.j.data?.lay_luc || '') && g3.j.data?.lay_co === bangCuoi.b.length && g.j.data?.lay_co > 0,
      JSON.stringify(g3.j.data) + ' vs ' + bangCuoi.b.length);
    const lg = A.log();
    k('C5b log máy chủ có dòng [sao-luu-tu-dong] và KHÔNG chứa khoá nào (đúng, cũ, sai, ndk_) — kể cả phần thân chuỗi khoá', /\[sao-luu-tu-dong\]/.test(lg)
      && [khoa1, khoa2, ndk.j.khoa, 'B'.repeat(43), 'khong-phai-khoa', sha(khoa2)].every((s) => !lg.includes(s)) && !lg.includes(khoa2.slice(5)), lg.split('\n').filter((l) => /sao-luu-tu-dong|posk_/.test(l)).slice(-3).join(' / '));
    // thu hồi
    const h0 = await A.goi('POST', QL + '/thu-hoi', { ve: A.vePos, body: {} });
    const h1 = await A.goi('POST', QL + '/thu-hoi', { ve: A.vePos, body: { pin: '0000' } });
    const h2 = await A.goi('POST', QL + '/thu-hoi', { ve: veQly, body: { pin: PIN } });
    const conSong = await tu(khoa2);
    k('B2c thu hồi: không PIN / PIN sai → lỗi, quản lý → 403; khoá VẪN dùng được', h0.status >= 400 && h1.status >= 400 && h2.status === 403 && conSong.status === 200, [h0, h1, h2, conSong].map(moTa).join(' | '));
    const h3 = await A.goi('POST', QL + '/thu-hoi', { ve: A.vePos, body: { pin: PIN } });
    const chet = await tu(khoa2);
    const h4 = await A.goi('POST', QL + '/thu-hoi', { ve: A.vePos, body: { pin: PIN } });
    k('B2d thu hồi đúng PIN → 200, khoá hết hiệu lực NGAY (401), dòng khoá mất; thu hồi lần hai → 404 KHONG_TIM_THAY', h3.status === 200 && chet.status === 401 && !(await dongKhoa())
      && h4.status === 404 && h4.j.code === 'KHONG_TIM_THAY', [h3, chet, h4].map(moTa).join(' | '));
  });

  // ═══ D · khoá riêng không lộ ở Cài đặt, không xuất, không khôi phục ═══
  muc('[D] Khoá riêng: không lộ ở Cài đặt, không vào tệp xuất, khôi phục không làm sống lại');
  await doan('D', async () => {
    const t = await taoKhoa(); const khoaNay = t.j.khoa;
    const bam = sha(khoaNay || 'khong-co-khoa');
    await A.q("INSERT OR REPLACE INTO pos_settings (key, value, updated_at) VALUES ('thu_khoa_thuong', 'v1', '2026-11-15T08:00:00')");
    const gAll = await A.goi('GET', '/api/pos/settings', { ve: A.vePos });
    const gOne = await A.goi('GET', '/api/pos/settings/' + KHOA_DB, { ve: A.vePos });
    const gThuong = await A.goi('GET', '/api/pos/settings/thu_khoa_thuong', { ve: A.vePos });
    k('B1g GET /settings không có dòng khoá, không chứa băm; GET /settings/<khoá> → 404; khoá thường vẫn đọc được (K5)', gAll.status === 200 && !(KHOA_DB in (gAll.j.data || {})) && !gAll.b.toString().includes(bam)
      && gAll.j.data?.thu_khoa_thuong === 'v1' && gOne.status === 404 && !gOne.b.toString().includes(bam) && gThuong.status === 200, [gAll, gOne, gThuong].map(moTa).join(' | '));
    const truoc = (await dongKhoa()).value;
    const p1 = await A.goi('PUT', '/api/pos/settings', { ve: A.vePos, body: { settings: { [KHOA_DB]: JSON.stringify({ ma_bam: sha('toi-tu-chon') }) } } });
    const p2 = await A.goi('PUT', '/api/pos/settings', { ve: A.vePos, body: { settings: { thu_khoa_moi: 'x', [KHOA_DB]: 'y' } } });
    const p3 = await A.goi('PUT', '/api/pos/settings', { ve: veQly, body: { settings: { [KHOA_DB]: JSON.stringify({ ma_bam: sha('toi-tu-chon') }) } } });
    const p4 = await A.goi('PUT', '/api/pos/settings', { ve: A.vePos, body: { settings: { thu_khoa_thuong: 'v2' } } });
    k('B1h PUT /settings có khoá riêng → 403 KHOA_RIENG, KHÔNG ghi gì (kể cả khoá thường đi kèm; quản lý cũng không); PUT khoá thường vẫn 200 (K5)', [p1, p2].every((r) => r.status === 403 && r.j.code === 'KHOA_RIENG')
      && p3.status === 403 && (await dongKhoa()).value === truoc && (await A.q("SELECT key FROM pos_settings WHERE key = 'thu_khoa_moi'")).length === 0
      && p4.status === 200 && (await A.q("SELECT value FROM pos_settings WHERE key = 'thu_khoa_thuong'"))[0].value === 'v2', [p1, p2, p3, p4].map(moTa).join(' | '));
    const tayCl = await A.goi('GET', '/api/pos/backup/export/pos_settings', { ve: A.vePos });
    const tayAll = await A.goi('GET', '/api/pos/backup/export-all', { ve: A.vePos });
    const maySl = await tu(khoaNay);
    const trangCd = (b) => (trangCua(b)['Cài đặt'] || []);
    k('P1 tệp xuất KHÔNG có dòng khoá: export/pos_settings, export-all và cửa mới đều không có key = khoá riêng, không chứa băm; các khoá khác vẫn có',
      [tayCl, tayAll, maySl].every((r) => r.status === 200 && !trangCd(r.b).some((d) => d.key === KHOA_DB) && !r.b.includes(Buffer.from(bam)))
      && trangCd(tayCl.b).some((d) => d.key === 'thu_khoa_thuong'), [tayCl, tayAll, maySl].map(moTa).join(' | '));
    // khôi phục
    const nay = (await A.q('SELECT value, updated_at FROM pos_settings WHERE key = ?', [KHOA_DB]))[0];
    const cu = JSON.stringify({ ma_bam: sha('khoa-cu-da-thu-hoi'), tao_luc: '2026-01-01T00:00:00', tao_boi: 'admin', lay_luc: null, lay_co: null });
    const dongCd = [{ key: 'thu_khoa_thuong', value: 'tu-tep', updated_at: '2026-11-01T00:00:00' }, { key: KHOA_DB, value: cu, updated_at: '2026-01-01T00:00:00' }];
    const tepSheet = (dong) => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dong), 'Cài đặt');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ backup_date: '2026-11-15T09:00:00', system: 'POS', version: '1.0', tables: 'pos_settings' }]), '_Metadata');
      return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })); };
    const gui = (duong, buf) => { const m = multipart('sl.xlsx', buf); return A.goi('POST', duong, { ve: A.vePos, body: m.body, headers: { 'Content-Type': m.type } }); };
    const xt = await gui('/api/pos/backup/preview-restore', tepSheet(dongCd));
    const tr = (xt.j.preview || []).find((p) => p.sheet === 'Cài đặt');
    k('R1 xem trước tệp có dòng khoá: trang Cài đặt đếm 1 dòng (dòng khoá bị bỏ qua, không đếm)', xt.status === 200 && tr?.fileRows === 1, moTa(xt) + JSON.stringify(tr));
    const kp = await gui('/api/pos/backup/restore', tepSheet(dongCd));
    const sau = (await A.q('SELECT value, updated_at FROM pos_settings WHERE key = ?', [KHOA_DB]))[0];
    const cuaCu = await tu(khoaNay);
    k('R2 khôi phục tệp có dòng khoá cũ: khoá đang dùng NGUYÊN (cùng dòng, vẫn lấy được tệp), băm cũ không sống lại; dòng khác của tệp vẫn khôi phục',
      kp.status === 200 && sau?.value === nay.value && sau?.updated_at === nay.updated_at && cuaCu.status === 200 && !sau.value.includes(sha('khoa-cu-da-thu-hoi'))
      && (await A.q("SELECT value FROM pos_settings WHERE key = 'thu_khoa_thuong'"))[0]?.value === 'tu-tep', moTa(kp) + ' ' + sau?.value);
    const chiKhoa = await gui('/api/pos/backup/restore', tepSheet([dongCd[1]]));
    const sau2 = (await A.q('SELECT value FROM pos_settings WHERE key = ?', [KHOA_DB]))[0];
    const conThuong = (await A.q("SELECT value FROM pos_settings WHERE key = 'thu_khoa_thuong'"))[0]?.value;
    k('R3 tệp Cài đặt CHỈ có dòng khoá: trang bị bỏ qua (không xoá gì) — khoá nguyên, các khoá khác nguyên', chiKhoa.status === 200 && sau2?.value === nay.value && conThuong === 'tu-tep' && (await tu(khoaNay)).status === 200, moTa(chiKhoa) + ' ' + JSON.stringify([sau2?.value === nay.value, conThuong]) + JSON.stringify(chiKhoa.j).slice(0, 300));
    const kthuong = await gui('/api/pos/backup/restore', tepSheet([{ key: 'thu_khoa_thuong', value: 'lan-hai', updated_at: '2026-11-02T00:00:00' }]));
    k('R4 tệp xuất bình thường (không dòng khoá) vẫn khôi phục được và KHÔNG làm mất khoá (K5)', kthuong.status === 200 && (await dongKhoa())?.value === nay.value
      && (await A.q("SELECT value FROM pos_settings WHERE key = 'thu_khoa_thuong'"))[0]?.value === 'lan-hai' && (await tu(khoaNay)).status === 200, moTa(kthuong));
  });

  // ═══ E · giao diện + bộ kiểm (tĩnh) ═══
  muc('[E] Giao diện + nối bộ kiểm (tĩnh)');
  {
    const st = doc(path.join(GOC_THU, 'client', 'src', 'pages', 'Settings.jsx'));
    const kg = doc(path.join(GOC_THU, 'client', 'src', 'pages', 'CaiDat', 'KhoaSaoLuuPos.jsx'));
    const ap = doc(path.join(GOC_THU, 'client', 'src', 'utils', 'api.js'));
    k("D1a Settings.jsx import KhoaSaoLuuPos và gắn <KhoaSaoLuuPos /> đúng MỘT chỗ, chỉ chủ quán, trong tab sao lưu", /import KhoaSaoLuuPos from '\.\/CaiDat\/KhoaSaoLuuPos'/.test(st) && (st.match(/<KhoaSaoLuuPos\b/g) || []).length === 1
      && /isAdmin && <KhoaSaoLuuPos \/>|isAdmin && \(\s*<KhoaSaoLuuPos \/>/.test(st) && st.indexOf('<KhoaSaoLuuPos') > st.indexOf("tab === 'backup' ?") && st.indexOf('<KhoaSaoLuuPos') < st.indexOf("tab === 'loyalty' ?"));
    k('D1b KhoaSaoLuuPos.jsx: "Sao lưu tự động lên Google Drive", "Lần Google lấy gần nhất", "Chưa lấy lần nào", "Tạo khoá mới", "Thu hồi khoá", "Khoá cũ sẽ ngừng dùng", hỏi PIN bằng HoiPin',
      ['Sao lưu tự động lên Google Drive', 'Lần Google lấy gần nhất', 'Chưa lấy lần nào', 'Tạo khoá mới', 'Thu hồi khoá', 'Khoá cũ sẽ ngừng dùng'].every((s) => kg.includes(s)) && /<HoiPin /.test(kg));
    k('D2 KhoaSaoLuuPos.jsx: nút Chép + câu "Dán vào Apps Script › Cài đặt dự án › Thuộc tính tập lệnh, tên KHOA_POS. Không gửi khoá qua chat / Zalo."; báo theo CAIDAT-BAO-1 (baoXong / baoLoiTu); gọi /backup/khoa-tu-dong',
      kg.includes('Dán vào Apps Script › Cài đặt dự án › Thuộc tính tập lệnh, tên KHOA_POS. Không gửi khoá qua chat / Zalo.') && /Chép/.test(kg) && /baoXong\(/.test(kg) && /baoLoiTu\(/.test(kg) && /\/backup\/khoa-tu-dong/.test(kg));
    k('D3 giao diện không mang khoá ra ngoài: không localStorage / console.log trong KhoaSaoLuuPos.jsx, không fetch trần (dùng api.js)', kg !== '' && !/localStorage|sessionStorage|console\.log/.test(kg) && !/\bfetch\(/.test(kg) && /from '..\/..\/utils\/api'/.test(kg) && ap !== '');
    k("E1 kiem_tra_truoc_khi_giao.js chạy bài này (chayBaiThat('cong_cu/thu_SAOLUUDEM1.js'))", /chayBaiThat\('cong_cu\/thu_SAOLUUDEM1\.js'/.test(doc(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'))));
  }
}

main().catch((e) => { k('bài sập', false, e.stack); }).finally(() => {
  console.log(`\n${dat} đạt · ${hong} hỏng`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
});
