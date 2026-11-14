#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ ND-API-1 — kho nội dung App KH (/api/nd): nhà riêng server/nd/, bảng nd_* (bước 027), nhóm quyền "App khách hàng — nội dung",
 *  vé riêng, CORS riêng, cập nhật an toàn, xuất / nhập toàn bộ, khoá sao lưu chỉ đọc, sao lưu Excel, dọn thử, hợp đồng HOP_DONG_API_ND.md.
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_NDAPI1.js [--goc <thư mục có server/ + client/src/ (bản sao đột biến)>]
 *  Mở máy chủ THẬT (server/index.js) hai lần trên kho TẠM (biến kết nối trỏ file tạm, không REPL_ID): A = mọi ca, B = kho trống cho ca nhập.
 *  CORS đo trên máy chủ thật (không app tự dựng — K3). Số mong đợi viết TAY (5 lần, 80 ký tự, 1.048.576 byte, 512.000 byte).
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
const MOC = 'bbf5eaf';   // commit PHIEU: ND-API-1 (gốc của việc)
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_ndapi1_'));
process.env.JWT_SECRET = 'thu_ndapi1_' + crypto.randomBytes(8).toString('hex');
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
const ND_BANG = ['nd_ban', 'nd_nhap', 'nd_anh', 'nd_nhat_ky', 'nd_khoa_sao_luu', 'nd_lan_sai'];
const QUYEN = ['nd_xem', 'nd_sua', 'nd_cap_nhat', 'nd_xuat_nhap'];
const MOI_LOI = [];   // mọi phản hồi lỗi /api/nd — C5

// ── HTTP thô (đặt được Origin, X-Forwarded-For) ──
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
        const r = { status: res.statusCode, h: res.headers, b, j: j && typeof j === 'object' ? j : {} };
        if (duong.startsWith('/api/nd') && res.statusCode >= 400) MOI_LOI.push({ duong, method, status: r.status, j: r.j });
        ok(r);
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
function multipart(tenTep, loai, buf, truong = 'anh') {
  const ranh = '----nd' + crypto.randomBytes(8).toString('hex');
  const dau = Buffer.from(`--${ranh}\r\nContent-Disposition: form-data; name="${truong}"; filename="${tenTep}"\r\nContent-Type: ${loai}\r\n\r\n`);
  return { body: Buffer.concat([dau, buf, Buffer.from(`\r\n--${ranh}--\r\n`)]), type: 'multipart/form-data; boundary=' + ranh };
}
const PNG = (n = 200) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), crypto.randomBytes(n - 8)]);
const JPEG = (n = 200) => Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), crypto.randomBytes(n - 4)]);
const WEBP = (n = 200) => { const b = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 '), crypto.randomBytes(n - 16)]); b.writeUInt32LE(n - 8, 4); return b; };

async function moMay(ten) {
  const cong = await congTrong();
  const fileKho = path.join(THU_MUC, ten + '.db');
  const env = { PATH: process.env.PATH, HOME: process.env.HOME, PORT: String(cong), JWT_SECRET: process.env.JWT_SECRET,
    TURSO_DATABASE_URL: 'file:' + fileKho, NODE_ENV: 'production' };
  const con = spawn(process.execPath, [path.join(SV, 'index.js')], { cwd: THU_MUC, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  con.stdout.on('data', (d) => { log = (log + d).slice(-4000); });
  con.stderr.on('data', (d) => { log = (log + d).slice(-4000); });
  process.on('exit', () => { try { con.kill(); } catch { /* đã thoát */ } });
  const han = Date.now() + 60000;
  for (;;) {
    if (con.exitCode !== null) throw new Error(`máy ${ten} thoát sớm: ` + log.slice(-400));
    try { if ((await goiTho(cong, 'GET', '/api/pos/health')).status === 200) break; } catch { /* chưa nghe */ }
    if (Date.now() > han) throw new Error(`máy ${ten} không lên trong 60 s: ` + log.slice(-400));
    await new Promise((r) => setTimeout(r, 200));
  }
  const db = createClient({ url: 'file:' + fileKho });
  await db.execute('PRAGMA busy_timeout = 5000');
  const q = async (sql, a = []) => (await db.execute({ sql, args: a })).rows.map((r) => ({ ...r }));
  const goi = (method, duong, { ve, body, ip = '10.0.0.1', origin, headers = {} } = {}) => goiTho(cong, method, duong, {
    body, headers: { ...headers, 'X-Forwarded-For': ip, ...(ve ? { Authorization: 'Bearer ' + ve } : {}), ...(origin ? { Origin: origin } : {}) } });
  const chup = async () => {
    const ra = [];
    for (const s of ['SELECT * FROM nd_ban ORDER BY so_ban', 'SELECT * FROM nd_nhap ORDER BY khoa', 'SELECT ma, loai, kich_thuoc, length(du_lieu) AS n, luc FROM nd_anh ORDER BY ma',
      'SELECT * FROM nd_nhat_ky ORDER BY id']) ra.push(await q(s).catch((e) => 'lỗi: ' + e.message));
    return JSON.stringify(ra);
  };
  const veNd = async (ten_dang_nhap, mat_khau, ip = '10.0.0.1') => (await goi('POST', '/api/nd/dang-nhap', { body: { ten_dang_nhap, mat_khau }, ip })).j.ve;
  const ownerId = Number((await q("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1"))[0].id);
  return { ten, cong, con, db, q, goi, chup, veNd, vePos: jwt.sign({ userId: ownerId }, process.env.JWT_SECRET, { expiresIn: '1h' }), ownerId, log: () => log };
}

async function main() {
  // ═══ A · nhà riêng (tĩnh) ═══
  muc('[A] Nhà riêng: mọi mã trong server/nd/, chỉ cauNoi.js chạm pos_');
  const thuNd = path.join(SV, 'nd');
  const tepNd = fs.existsSync(thuNd) ? fs.readdirSync(thuNd, { recursive: true }).filter((f) => String(f).endsWith('.js')).map(String) : [];
  const nguonNd = Object.fromEntries(tepNd.map((f) => [f, doc(path.join(thuNd, f))]));
  const quetPos = (tep) => Object.entries(tep).filter(([f, s]) => path.basename(f) !== 'cauNoi.js' && /pos_/.test(s)).map(([f]) => f);
  k('A1 server/nd/: tệp nào ngoài cauNoi.js có chữ pos_ → đỏ (không tệp nào)', tepNd.length >= 5 && quetPos(nguonNd).length === 0
    && /pos_users/.test(nguonNd['cauNoi.js'] || '') && /pos_permissions/.test(nguonNd['cauNoi.js'] || ''), `tệp: ${tepNd.join(', ')} · vi phạm: ${quetPos(nguonNd).join(', ')}`);
  k('A1b đối chứng: duLieu.js thêm "pos_orders" → phép quét bắt', JSON.stringify(quetPos({ ...nguonNd, 'duLieu.js': (nguonNd['duLieu.js'] || '') + ' pos_orders ' })) === '["duLieu.js"]');
  {
    const moi = doc(path.join(SV, 'index.js')).split('\n');
    let cu = [];
    try { cu = execFileSync('git', ['show', `${MOC}:server/index.js`], { cwd: GOC, encoding: 'utf8' }).split('\n'); } catch { /* kho nông */ }
    let j = 0;
    for (const d of moi) if (j < cu.length && d === cu[j]) j++;
    const iNd = moi.findIndex((d) => /app\.use\('\/api\/nd'/.test(d));
    const iCors = moi.findIndex((d) => /^app\.use\(cors\(/.test(d));
    k('A2 index.js: gắn /api/nd TRƯỚC cors chung; so với gốc chỉ THÊM dòng (mọi dòng cũ còn nguyên, đúng thứ tự)',
      cu.length > 100 && j === cu.length && iNd >= 0 && iCors > iNd && moi.length - cu.length <= 4, `cũ ${cu.length} khớp ${j} · nd ${iNd} · cors ${iCors} · thêm ${moi.length - cu.length}`);
  }

  let A, B;
  await doan('mở máy chủ', async () => { [A, B] = await Promise.all([moMay('A'), moMay('B')]); });
  if (!A || !B) { k('máy chủ không lên — dừng', false); return; }
  const ND = '/api/nd';

  // ═══ B · bảng ═══
  muc('[B] Bảng nd_* (bước 027)');
  await doan('B', async () => {
    const cot = async (t) => (await A.q(`PRAGMA table_info(${t})`)).map((c) => c.name);
    const CAN = { nd_ban: ['so_ban', 'gia_tri', 'ghi_chu', 'tom_tat', 'nguoi', 'luc', 'tu_ban', 'dang_chay'], nd_nhap: ['khoa', 'gia_tri', 'nguoi', 'luc', 'ban_goc'],
      nd_anh: ['ma', 'loai', 'kich_thuoc', 'du_lieu', 'luc'], nd_nhat_ky: ['nguoi', 'luc', 'viec', 'so_ban', 'so_khoa'],
      nd_khoa_sao_luu: ['ma_bam', 'tao_luc', 'thu_hoi_luc'], nd_lan_sai: ['khoa', 'sai', 'khoa_den'] };
    const thieu = [];
    for (const [t, ds] of Object.entries(CAN)) { const c = await cot(t); for (const x of ds) if (!c.includes(x)) thieu.push(`${t}.${x}`); }
    k('B1 đủ 6 bảng nd_* và cột theo nghiệm thu B', thieu.length === 0, thieu.join(', '));
    const fk = [];
    for (const t of ND_BANG) if ((await A.q(`PRAGMA foreign_key_list(${t})`)).length) fk.push(t);
    k('A3 không bảng nd_* nào có khoá ngoại', fk.length === 0 && thieu.length === 0, fk.join(', '));
    const b0 = await A.goi('GET', ND + '/ban-dang-chay');
    k('B2 kho trống: ban-dang-chay (không vé) → bản 0 rỗng', b0.status === 200 && b0.j.so_ban === 0 && JSON.stringify(b0.j.gia_tri) === '{}', moTa(b0));
    const b0c = await A.goi('GET', ND + '/ban-dang-chay?co=0');
    k('C2a kho trống ?co=0 → { khong_doi: true }', b0c.status === 200 && b0c.j.khong_doi === true, moTa(b0c));
  });

  // ═══ G · đăng nhập ═══
  muc('[G] Đăng nhập riêng /api/nd/dang-nhap');
  let veChu, veQly;
  const tk = {};
  await doan('G', async () => {
    const g1 = await A.goi('POST', ND + '/dang-nhap', { body: { ten_dang_nhap: 'admin', mat_khau: 'admin123' } });
    veChu = g1.j.ve;
    k('G1 đúng → vé + quyen[] đủ 4 quyền nd (chủ quán) + het_han giờ VN', g1.status === 200 && typeof veChu === 'string'
      && QUYEN.every((x) => (g1.j.quyen || []).includes(x)) && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(g1.j.het_han || ''), moTa(g1));
    for (const [ten, role] of [['qly_nd', 'manager'], ['nv_nd', 'staff']]) {
      const r = await A.goi('POST', '/api/pos/users', { ve: A.vePos, body: { username: ten, password: 'matkhau1', display_name: ten, role } });
      tk[role] = r.j.user?.id;
    }
    veQly = await A.veNd('qly_nd', 'matkhau1', '10.0.0.2');
    const me = await A.goi('GET', '/api/pos/auth/me', { ve: veChu });
    const pn = await A.goi('GET', ND + '/nhap', { ve: A.vePos });
    k('G2 vé nd gọi /api/pos/auth/me → 401; vé POS gọi /api/nd/nhap → 401 CHUA_DANG_NHAP', !!veChu && me.status === 401 && pn.status === 401 && pn.j.code === 'CHUA_DANG_NHAP', `${moTa(me)} / ${moTa(pn)}`);
    let kyBangPos = false;
    try { jwt.verify(veChu, process.env.JWT_SECRET); kyBangPos = true; } catch { /* đúng: khoá khác */ }
    k('G2c vé nd KHÔNG ký bằng khoá vé POS (JWT_SECRET trần)', !!veChu && !kyBangPos);
    // G3: không có tên / sai mật khẩu / tài khoản khoá → cùng một câu (mỗi lần một IP để bộ đếm không xen)
    await A.q('UPDATE pos_users SET is_active = 0 WHERE username = ?', ['nv_nd']);
    const s1 = await A.goi('POST', ND + '/dang-nhap', { body: { ten_dang_nhap: 'khong_co_ai', mat_khau: 'x' }, ip: '10.3.0.1' });
    const s2 = await A.goi('POST', ND + '/dang-nhap', { body: { ten_dang_nhap: 'admin', mat_khau: 'sai_roi' }, ip: '10.3.0.2' });
    const s3 = await A.goi('POST', ND + '/dang-nhap', { body: { ten_dang_nhap: 'nv_nd', mat_khau: 'matkhau1' }, ip: '10.3.0.3' });
    k('G3 không có tên / sai mật khẩu / tài khoản khoá → CÙNG status + error + code', s1.status === 401 && [s2, s3].every((s) => s.status === s1.status
      && s.j.error === s1.j.error && s.j.code === s1.j.code) && s1.j.code === 'SAI_DANG_NHAP', [s1, s2, s3].map(moTa).join(' | '));
    await A.q('UPDATE pos_users SET is_active = 1 WHERE username = ?', ['nv_nd']);
    // G4: ngưỡng 5 lần / 15 phút — theo CẶP (tên + IP) và theo IP; không khoá tên trên mọi máy (Q-A chủ quán 13.11)
    const thu = (ten, mk, ip) => A.goi('POST', ND + '/dang-nhap', { body: { ten_dang_nhap: ten, mat_khau: mk }, ip });
    const a = [];
    for (let i = 0; i < 6; i++) a.push((await thu('admin', 'sai' + i, '10.1.1.1')).status);
    const a7 = await thu('admin', 'admin123', '10.1.1.1');
    k('G4a cùng tên + IP: sai 5 lần → lần 5 vẫn 401, lần 6 → 429 QUA_NHIEU_LAN; đúng mật khẩu khi đang khoá → vẫn 429',
      JSON.stringify(a) === '[401,401,401,401,401,429]' && a7.status === 429 && a7.j.code === 'QUA_NHIEU_LAN', `${JSON.stringify(a)} · ${moTa(a7)}`);
    const b = await thu('admin', 'admin123', '10.1.1.2');
    k('G4b (K5) tên bị khoá ở IP kia → từ IP khác đúng mật khẩu vẫn 200 (không khoá tên toàn cục)', b.status === 200 && !!b.j.ve, moTa(b));
    const c = [];
    for (let i = 1; i <= 6; i++) c.push((await thu('ten_la_' + i, 'x', '10.1.1.3')).status);
    k('G4c cùng IP, 6 tên khác nhau: lần 5 vẫn 401, lần 6 → 429 (đếm theo IP)', JSON.stringify(c) === '[401,401,401,401,401,429]', JSON.stringify(c));
    const d = [];
    for (let i = 0; i < 5; i++) { d.push((await thu('qly_nd', 'sai' + i, '10.1.1.4')).status); d.push((await thu('admin', 'admin123', '10.1.1.4')).status); }
    const d6 = await thu('qly_nd', 'matkhau1', '10.1.1.4');
    const d7 = await thu('admin', 'admin123', '10.1.1.4');
    k('G4d cặp (tên + IP): sai 5 lần xen đăng nhập đúng của người khác (đặt lại bộ đếm IP) → tên đó ở IP đó 429; người khác cùng IP vẫn 200',
      JSON.stringify(d) === '[401,200,401,200,401,200,401,200,401,200]' && d6.status === 429 && d7.status === 200, `${JSON.stringify(d)} · ${moTa(d6)} · ${moTa(d7)}`);
    // G5: vé hết hạn / aud khác — khoá vé nd lấy từ hàm khoaVe của tinh.js (cùng JWT_SECRET)
    let khoaVe = null;
    try { khoaVe = require(path.join(SV, 'nd', 'tinh.js')).khoaVe(process.env.JWT_SECRET); } catch { /* chưa có */ }
    const uid = A.ownerId;
    const het = khoaVe ? jwt.sign({ nd: uid, exp: Math.floor(Date.now() / 1000) - 60 }, khoaVe, { audience: 'nd' }) : 'x';
    const aud = khoaVe ? jwt.sign({ nd: uid }, khoaVe, { audience: 'pos', expiresIn: '1h' }) : 'x';
    const dung = khoaVe ? jwt.sign({ nd: uid }, khoaVe, { audience: 'nd', expiresIn: '1h' }) : 'x';
    const [r1, r2, r3] = await Promise.all([het, aud, dung].map((v) => A.goi('GET', ND + '/nhap', { ve: v })));
    k('G5 vé hết hạn → 401; vé aud khác → 401; đối chứng vé đúng → 200', r1.status === 401 && r2.status === 401 && r3.status === 200, `${moTa(r1)} / ${moTa(r2)} / ${moTa(r3)}`);
  });

  // ═══ F · quyền ═══
  muc('[F] Quyền nhóm "App khách hàng — nội dung"');
  const apiJs = doc(path.join(GOC_THU, 'client', 'src', 'utils', 'api.js'));
  const duongLuuQuyen = (vai) => '/api/pos' + ((apiJs.match(/updatePermissions:\s*\(role, permissions\)\s*=>\s*api\.put\(`([^`]+)`/) || [])[1] || '/??').replace('${role}', vai);
  const datQuyen = (vai, ds) => A.goi('PUT', duongLuuQuyen(vai), { ve: A.vePos, body: { permissions: ds } });
  await doan('F', async () => {
    const p = await A.goi('GET', '/api/pos/users/permissions', { ve: A.vePos });
    const NHAN = { nd_xem: 'Xem Chế độ sửa App', nd_sua: 'Sửa nội dung App (Lưu nháp)', nd_cap_nhat: 'Cập nhật toàn bộ + quay lại phiên bản', nd_xuat_nhap: 'Xuất / nhập toàn bộ' };
    const ap = p.j.all_permissions || [];
    k('F1 màn Phân quyền có 4 quyền nd đúng nhãn thư App, cùng nhóm "App khách hàng — nội dung"', QUYEN.every((x) => ap.some((a) => a.key === x
      && a.label === NHAN[x] && a.nhom === 'App khách hàng — nội dung')), JSON.stringify(ap.filter((a) => /^nd_/.test(a.key))));
    const gieo = await A.q(`SELECT role, permission, allowed FROM pos_permissions WHERE permission LIKE 'nd\\_%' ESCAPE '\\' ORDER BY role, permission`);
    const ky = (vai) => QUYEN.map((x) => gieo.find((g) => g.role === vai && g.permission === x)?.allowed).join('');
    k('F2 bước 027 gieo: owner 1111, manager 0000, staff 0000', ky('owner') === '1111' && ky('manager') === '0000' && ky('staff') === '0000', `${ky('owner')} ${ky('manager')} ${ky('staff')}`);
    const f3a = await A.goi('GET', ND + '/nhap', { ve: veQly });
    const luu = await datQuyen('manager', { nd_xem: true, nd_sua: true });
    const f3b = await A.goi('PUT', ND + '/nhap', { ve: veQly, body: { khoa: 'thu.quyen', gia_tri: 'x', ban_goc: 0 } });
    k('F3a quản lý chưa có quyền → 403 KHONG_DU_QUYEN; F3b nút Lưu của màn Phân quyền (đường trong api.js) bật nd_sua → cùng vé PUT nhap 200',
      f3a.status === 403 && f3a.j.code === 'KHONG_DU_QUYEN' && luu.status === 200 && f3b.status === 200, `${moTa(f3a)} / lưu ${moTa(luu)} ${duongLuuQuyen('manager')} / ${moTa(f3b)}`);
    await datQuyen('manager', { nd_sua: false });
    const f3c = await A.goi('PUT', ND + '/nhap', { ve: veQly, body: { khoa: 'thu.quyen', gia_tri: 'y', ban_goc: 0 } });
    k('F3c tắt nd_sua → CÙNG vé lần gọi kế tiếp 403 (thu quyền là hết ngay)', f3c.status === 403, moTa(f3c));
    // F2b: chạy lại bước 027 khi chủ quán đã bật nd_xem cho manager → không đè
    let chayLai = 'chưa có bước';
    try {
      const buoc = require(path.join(SV, 'nang_cap', '027_noi_dung.js'));
      const tx = { query: (s, a) => A.q(s, a), queryOne: async (s, a) => (await A.q(s, a))[0] || null, run: async (s, a) => { const r = await A.db.execute({ sql: s, args: a || [] }); return { changes: r.rowsAffected }; } };
      await buoc.chay(tx, { themCot: async () => {} });
      chayLai = (await A.q("SELECT allowed FROM pos_permissions WHERE role = 'manager' AND permission = 'nd_xem'"))[0]?.allowed;
    } catch (e) { chayLai = 'lỗi ' + e.message; }
    k('F2b chạy lại bước 027 → quyền chủ quán đã bật (manager nd_xem = 1) KHÔNG bị đè', Number(chayLai) === 1, chayLai);
    await A.goi('PUT', '/api/pos/users/' + tk.manager, { ve: A.vePos, body: { is_active: false } });
    const f4 = await A.goi('GET', ND + '/nhap', { ve: veQly });
    await A.goi('PUT', '/api/pos/users/' + tk.manager, { ve: A.vePos, body: { is_active: true } });
    const f4b = await A.goi('GET', ND + '/nhap', { ve: veQly });
    k('F4 khoá tài khoản → cùng vé 401 CHUA_DANG_NHAP; mở lại → 200', f4.status === 401 && f4.j.code === 'CHUA_DANG_NHAP' && f4b.status === 200, `${moTa(f4)} / ${moTa(f4b)}`);
    // F5: bảng cửa × quyền — thiếu ĐÚNG quyền của cửa → 403; cửa của quyền khác → không 403 (thân sai để không ghi gì)
    const CUA = [['GET', '/nhap', 'nd_xem'], ['GET', '/phien-ban', 'nd_xem'], ['GET', '/phien-ban/1', 'nd_xem'],
      ['PUT', '/nhap', 'nd_sua', { khoa: 'sai khoa', gia_tri: 1, ban_goc: 0 }], ['DELETE', '/nhap/khong.co', 'nd_sua'], ['POST', '/anh', 'nd_sua', {}],
      ['POST', '/cap-nhat', 'nd_cap_nhat', { ban_goc: -1 }], ['POST', '/quay-lai', 'nd_cap_nhat', { so: -1, ban_goc: -1 }],
      ['GET', '/xuat', 'nd_xuat_nhap'], ['POST', '/nhap-toan-bo', 'nd_xuat_nhap', { dinh_dang: 999 }]];
    const sai = [];
    for (const q of QUYEN) {
      await datQuyen('manager', Object.fromEntries(QUYEN.map((x) => [x, x !== q])));
      for (const [m, d, can, body] of CUA) {
        const r = await A.goi(m, ND + d, { ve: veQly, body });
        if ((r.status === 403) !== (can === q)) sai.push(`${q}: ${m} ${d} → ${r.status}`);
      }
    }
    await datQuyen('manager', Object.fromEntries(QUYEN.map((x) => [x, false])));
    k('F5 mỗi cửa cần quyền: thiếu đúng quyền đó → 403, đủ → không 403 (10 cửa × 4 quyền)', sai.length === 0, sai.join(' · '));
    await A.q("DELETE FROM pos_permissions WHERE role = 'owner' AND permission LIKE 'nd\\_%' ESCAPE '\\'");
    const f6 = await A.goi('GET', ND + '/nhap', { ve: veChu });
    k('K5b chủ quán (không còn dòng quyền nd nào) vẫn đủ quyền', f6.status === 200, moTa(f6));
  });

  // ═══ D · giới hạn ═══
  muc('[D] Giới hạn khoá / giá trị / bản / ảnh');
  const luuNhap = (khoa, gia_tri, ban_goc = 0, ve = veChu) => A.goi('PUT', ND + '/nhap', { ve, body: { khoa, gia_tri, ban_goc } });
  await doan('D', async () => {
    const k80 = await luuNhap('a'.repeat(80), 'x');
    const k81 = await luuNhap('a'.repeat(81), 'x');
    const xau = await Promise.all(['a b', 'ä', '', 'a/b'].map((x) => luuNhap(x, 'x')));
    const tot = await luuNhap('Trang.chu_tieu-de.9', 'x');
    k('D1 khoá 80 ký tự qua, 81 → 400 KHOA_KHONG_HOP_LE; "a b", "ä", rỗng, "a/b" → 400; [a-zA-Z0-9._-] qua',
      k80.status === 200 && k81.status === 400 && k81.j.code === 'KHOA_KHONG_HOP_LE' && xau.every((r) => r.status === 400 && r.j.code === 'KHOA_KHONG_HOP_LE') && tot.status === 200,
      `${moTa(k80)} / ${moTa(k81)} / ${xau.map(moTa).join(',')} / ${moTa(tot)}`);
    const nul = await luuNhap('d2.null', null);
    const thieu = await A.goi('PUT', ND + '/nhap', { ve: veChu, body: { khoa: 'd2.thieu', ban_goc: 0 } });
    const hop = await Promise.all([['d2.chuoi', 'Chào bạn 🌿'], ['d2.so', 12.5], ['d2.dung', true], ['d2.mang', [1, 'a', { b: null }]], ['d2.obj', { x: [1] }]].map(([kk, v]) => luuNhap(kk, v)));
    k('D2 giá trị null / thiếu → 400 GIA_TRI_KHONG_HOP_LE; chuỗi / số / đúng-sai / mảng / object → 200',
      nul.status === 400 && nul.j.code === 'GIA_TRI_KHONG_HOP_LE' && thieu.status === 400 && hop.every((r) => r.status === 200), `${moTa(nul)} / ${moTa(thieu)} / ${hop.map((r) => r.status)}`);
    const hong = await A.goi('PUT', ND + '/nhap', { ve: veChu, body: '{"khoa": "x", ' });
    k('C6 JSON hỏng → 400 DU_LIEU_KHONG_HOP_LE (JSON, không trang lỗi HTML)', hong.status === 400 && hong.j.code === 'DU_LIEU_KHONG_HOP_LE', moTa(hong));
    // D3: bản = bản đang chạy + mọi nháp ≤ 1.048.576 byte UTF-8 của JSON — chuỗi tiếng Việt (3 byte / ký tự) để lộ lỗi đếm ký tự
    const nhapNay = (await A.goi('GET', ND + '/nhap', { ve: veChu })).j.nhap || [];
    const gop = Object.fromEntries(nhapNay.filter((n) => n.khoa !== 'd3.lon').map((n) => [n.khoa, n.gia_tri]));
    const nen = Buffer.byteLength(JSON.stringify({ ...gop, 'd3.lon': '' }));
    const conLai = 1048576 - nen;
    const chuoi = 'ệ'.repeat(Math.floor(conLai / 3)) + 'a'.repeat(conLai % 3);
    const vua = await luuNhap('d3.lon', chuoi);
    const qua = await luuNhap('d3.lon', chuoi + 'a');
    k('D3 bản đúng 1.048.576 byte qua; +1 byte → 413 QUA_LON (đo byte UTF-8, chuỗi tiếng Việt)', conLai > 0 && vua.status === 200 && qua.status === 413 && qua.j.code === 'QUA_LON',
      `${moTa(vua)} / ${moTa(qua)} · ${chuoi.length} ký tự`);
    await A.goi('DELETE', ND + '/nhap/d3.lon', { ve: veChu });
    await A.goi('DELETE', ND + '/nhap/' + 'a'.repeat(80), { ve: veChu });
    const anh = (buf, ten = 'a.webp', loai = 'image/webp') => { const m = multipart(ten, loai, buf); return A.goi('POST', ND + '/anh', { ve: veChu, body: m.body, headers: { 'Content-Type': m.type } }); };
    const v512 = await anh(WEBP(512000));
    const v513 = await anh(WEBP(512001));
    k('D4 ảnh WebP đúng 512.000 byte qua (K5); 512.001 → 413 QUA_LON', v512.status === 200 && v513.status === 413 && v513.j.code === 'QUA_LON', `${moTa(v512)} / ${moTa(v513)}`);
    const gia = await anh(Buffer.from('<html><script>alert(1)</script></html>' + ' '.repeat(100)), 'x.webp', 'image/webp');
    const that = await Promise.all([[PNG(), 'a.png', 'image/png'], [JPEG(), 'a.jpg', 'image/jpeg'], [WEBP(), 'a.webp', 'image/webp']].map(([b, t, l]) => anh(b, t, l)));
    const loaiDoan = await anh(PNG(300), 'anh.webp', 'image/webp');
    k('D5 tên .webp, loại image/webp mà byte là HTML → 400 ANH_KHONG_HOP_LE; PNG / JPEG / WebP thật → 200, loại theo BYTE (PNG khai .webp → image/png)',
      gia.status === 400 && gia.j.code === 'ANH_KHONG_HOP_LE' && that.every((r) => r.status === 200) && that.map((r) => r.j.loai).join() === 'image/png,image/jpeg,image/webp'
      && loaiDoan.j.loai === 'image/png', `${moTa(gia)} / ${that.map((r) => r.status + ' ' + r.j.loai)} / ${loaiDoan.j.loai}`);
    const lap = WEBP(400);
    const l1 = await anh(lap), l2 = await anh(lap);
    const dem = Number((await A.q('SELECT COUNT(*) AS n FROM nd_anh WHERE ma = ?', [l1.j.ma || '']))[0]?.n);
    k('D6 gửi lại cùng ảnh → cùng ma (SHA-256 nội dung), moi: false, bảng 1 dòng; url = /api/nd/anh/<ma>', l1.status === 200 && l2.j.ma === l1.j.ma
      && l1.j.ma === crypto.createHash('sha256').update(lap).digest('hex') && l1.j.moi === true && l2.j.moi === false && dem === 1 && l1.j.url === '/api/nd/anh/' + l1.j.ma,
      `${moTa(l1)} ${l1.j.ma} / ${l2.j.moi} / ${dem}`);
    const c3 = await A.goi('GET', ND + '/anh/' + l1.j.ma);
    k('C3 GET anh/:ma (không vé) → đúng byte, Content-Type theo loại, Cache-Control immutable, nosniff', c3.status === 200 && c3.b.equals(lap)
      && c3.h['content-type'] === 'image/webp' && /immutable/.test(c3.h['cache-control'] || '') && /max-age=31536000/.test(c3.h['cache-control'] || '')
      && c3.h['x-content-type-options'] === 'nosniff', `${c3.status} ${c3.h['content-type']} ${c3.h['cache-control']}`);
    const c3b = await A.goi('GET', ND + '/anh/' + 'f'.repeat(64));
    k('C3b ảnh không có → 404 KHONG_TIM_THAY', c3b.status === 404 && c3b.j.code === 'KHONG_TIM_THAY', moTa(c3b));
  });

  // ═══ E · cập nhật an toàn ═══
  muc('[E] Cập nhật toàn bộ / quay lại — một giao dịch, ban_goc');
  const capNhat = (ban_goc, ve = veChu, ghi_chu) => A.goi('POST', ND + '/cap-nhat', { ve, body: { ban_goc, ghi_chu } });
  await doan('E', async () => {
    await datQuyen('manager', { nd_xem: true, nd_sua: true });
    await luuNhap('k5.cua.A', 'của chủ quán');
    await luuNhap('k5.cua.B', 'của quản lý', 0, veQly);
    const sai = await capNhat(1);
    const truoc = await A.chup();
    const sai2 = await capNhat(5);
    k('E1 ban_goc ≠ bản đang chạy → 409 CO_BAN_MOI_HON, không đổi gì (chụp 4 bảng trước / sau)', sai.status === 409 && sai.j.code === 'CO_BAN_MOI_HON'
      && sai2.status === 409 && truoc === await A.chup(), `${moTa(sai)} / ${moTa(sai2)}`);
    const nhapTruoc = (await A.goi('GET', ND + '/nhap', { ve: veChu })).j.nhap || [];
    const e2 = await capNhat(0, veChu, 'lần đầu');
    const b1 = await A.goi('GET', ND + '/phien-ban/1', { ve: veChu });
    const conNhap = (await A.goi('GET', ND + '/nhap', { ve: veChu })).j;
    const nk = await A.q("SELECT * FROM nd_nhat_ky WHERE viec = 'cap_nhat' ORDER BY id DESC LIMIT 1");
    const mong = Object.fromEntries(nhapTruoc.map((n) => [n.khoa, n.gia_tri]));
    k('E2 đúng → bản 1 = bản 0 + mọi nháp; nháp rỗng; nhật ký cap_nhat (so_ban 1, so_khoa); GET nhap trả so_ban 1', e2.status === 200 && e2.j.so_ban === 1
      && JSON.stringify(b1.j.ban?.gia_tri) === JSON.stringify(mong) && b1.j.ban?.ghi_chu === 'lần đầu' && (conNhap.nhap || []).length === 0 && conNhap.so_ban === 1
      && Number(nk[0]?.so_ban) === 1 && Number(nk[0]?.so_khoa) === nhapTruoc.length && nhapTruoc.length >= 8, `${moTa(e2)} / ${moTa(b1)} / ${JSON.stringify(nk[0])}`);
    k('K5a nháp của hai người (k5.cua.A chủ quán, k5.cua.B quản lý) cùng vào bản mới', b1.j.ban?.gia_tri?.['k5.cua.A'] === 'của chủ quán' && b1.j.ban?.gia_tri?.['k5.cua.B'] === 'của quản lý');
    let b3 = 'không ném';
    try { await A.q('INSERT INTO nd_ban (so_ban, gia_tri, luc, dang_chay) VALUES (99, ?, ?, 1)', ['{}', '2026-11-14T10:00:00']); } catch (e) { b3 = e.message; }
    k('B3 chèn tay bản thứ hai dang_chay = 1 → kho từ chối (chỉ mục duy nhất)', /UNIQUE/i.test(b3), b3);
    await A.q('DELETE FROM nd_ban WHERE so_ban = 99');
    // C2 ?co=
    const c2a = await A.goi('GET', ND + '/ban-dang-chay?co=1');
    const c2b = await A.goi('GET', ND + '/ban-dang-chay?co=0');
    k('C2 ?co= trùng bản đang chạy → { khong_doi: true }; lệch → đủ bản', c2a.j.khong_doi === true && c2a.j.gia_tri === undefined && c2b.j.so_ban === 1
      && c2b.j.gia_tri?.['k5.cua.A'] === 'của chủ quán', `${JSON.stringify(c2a.j).slice(0, 80)} / ${c2b.j.so_ban}`);
    // E3: hai người cập nhật cùng lúc
    await luuNhap('e3.x', 1, 1);
    const hai = await Promise.all([capNhat(1), capNhat(1)]);
    const ds = hai.map((r) => r.status).sort().join();
    const soBan = Number((await A.q('SELECT COUNT(*) AS n FROM nd_ban'))[0].n);
    k('E3 hai người cập nhật cùng lúc cùng ban_goc → đúng một 200, một 409 CO_BAN_MOI_HON, đúng một bản mới', ds === '200,409'
      && hai.some((r) => r.j.code === 'CO_BAN_MOI_HON') && soBan === 2, `${hai.map(moTa).join(' | ')} · ${soBan} bản`);
    const khongNhap = await capNhat(2);
    k('E2b không có nháp → 400 KHONG_CO_NHAP', khongNhap.status === 400 && khongNhap.j.code === 'KHONG_CO_NHAP', moTa(khongNhap));
    // E4 quay lại
    const t4 = await A.chup();
    const q1 = await A.goi('POST', ND + '/quay-lai', { ve: veChu, body: { so: 1, ban_goc: 1 } });
    const giuNguyen = t4 === await A.chup();
    const q2 = await A.goi('POST', ND + '/quay-lai', { ve: veChu, body: { so: 1, ban_goc: 2 } });
    const b3r = (await A.goi('GET', ND + '/phien-ban/3', { ve: veChu })).j.ban;
    const b1r = (await A.goi('GET', ND + '/phien-ban/1', { ve: veChu })).j.ban;
    k('E4 quay-lai ban_goc cũ → 409 không đổi gì; đúng → bản MỚI 3, tu_ban = 1, gia_tri giống bản 1', q1.status === 409 && q1.j.code === 'CO_BAN_MOI_HON' && giuNguyen
      && q2.status === 200 && q2.j.so_ban === 3 && Number(b3r?.tu_ban) === 1 && !!b1r && JSON.stringify(b3r?.gia_tri) === JSON.stringify(b1r?.gia_tri),
      `${moTa(q1)} / ${moTa(q2)} / ${JSON.stringify(b3r).slice(0, 80)}`);
    const q404 = await A.goi('POST', ND + '/quay-lai', { ve: veChu, body: { so: 77, ban_goc: 3 } });
    k('E4b quay lại bản không có → 404 KHONG_TIM_THAY', q404.status === 404 && q404.j.code === 'KHONG_TIM_THAY', moTa(q404));
    const e5 = await Promise.all([1, 2].map((so) => A.goi('POST', ND + '/quay-lai', { ve: veChu, body: { so, ban_goc: 3 } })));
    k('E5 hai người quay lại cùng lúc → đúng một 200, một 409', e5.map((r) => r.status).sort().join() === '200,409', e5.map(moTa).join(' | '));
    const pb = await A.goi('GET', ND + '/phien-ban', { ve: veChu });
    const dong = await A.q('SELECT so_ban, dang_chay FROM nd_ban ORDER BY so_ban');
    k('B4 sau 2 cập nhật + 2 quay lại: đủ 4 bản 1..4, đúng MỘT dang_chay = 1 (bản 4); danh sách không kèm gia_tri', dong.map((d) => d.so_ban).join() === '1,2,3,4'
      && dong.filter((d) => Number(d.dang_chay) === 1).map((d) => d.so_ban).join() === '4' && (pb.j.data || []).length === 4 && (pb.j.data || []).every((x) => x.gia_tri === undefined),
      JSON.stringify(dong));
    const xoa = await A.goi('DELETE', ND + '/nhap/khong.co', { ve: veChu });
    await luuNhap('bo.nhap', 'x', 4);
    const nkTruoc = Number((await A.q("SELECT COUNT(*) AS n FROM nd_nhat_ky WHERE viec = 'bo_nhap'"))[0].n);
    const xoa2 = await A.goi('DELETE', ND + '/nhap/bo.nhap', { ve: veChu });
    const nkb = await A.q("SELECT COUNT(*) AS n FROM nd_nhat_ky WHERE viec = 'bo_nhap'");
    k('C1 DELETE nhap/:khoa: có → 200 + nhật ký bo_nhap; không có → 404 KHONG_TIM_THAY', xoa.status === 404 && xoa2.status === 200 && Number(nkb[0].n) === nkTruoc + 1, `${moTa(xoa)} / ${moTa(xoa2)}`);
    await luuNhap('con.lai.trong.file', { a: 1 }, 4);
  });

  // ═══ J · khoá sao lưu chỉ đọc ═══
  muc('[J] Khoá sao lưu chỉ đọc');
  const KS = '/api/pos/nd-khoa-sao-luu';
  let khoa = '';
  await doan('J', async () => {
    await A.q("INSERT OR REPLACE INTO pos_pin_chu_quan (id, pin_bam, sai, khoa_den, dat_boi, dat_luc) VALUES (1, ?, 0, NULL, 'admin', '2026-11-14T08:00:00')", [bcrypt.hashSync('1234', 4)]);
    const truoc = Number((await A.q('SELECT COUNT(*) AS n FROM nd_khoa_sao_luu').catch(() => [{ n: -1 }]))[0].n);
    const j4a = await A.goi('POST', KS, { ve: A.vePos, body: { ten: 'Không PIN' } });
    const j4b = await A.goi('POST', KS, { ve: A.vePos, body: { ten: 'PIN sai', pin: '9999' } });
    const vePosQly = jwt.sign({ userId: tk.manager }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const j4c = await A.goi('POST', KS, { ve: vePosQly, body: { ten: 'Quản lý', pin: '1234' } });
    const j4d = await A.goi('GET', KS, { ve: veChu });
    const sau = Number((await A.q('SELECT COUNT(*) AS n FROM nd_khoa_sao_luu').catch(() => [{ n: -1 }]))[0].n);
    k('J4 không PIN / PIN sai → 400 không tạo; quản lý → 403; vé nd ở cửa POS → 401', j4a.status === 400 && j4b.status === 400 && j4c.status === 403 && j4d.status === 401
      && truoc === 0 && sau === 0, `${[j4a, j4b, j4c, j4d].map(moTa).join(' | ')} · ${truoc}→${sau}`);
    const j1 = await A.goi('POST', KS, { ve: A.vePos, body: { ten: 'Sao lưu đêm GitHub', pin: '1234' } });
    khoa = j1.j.khoa || '';
    const ds = await A.goi('GET', KS, { ve: A.vePos });
    const bang = await A.q('SELECT * FROM nd_khoa_sao_luu');
    k('J1 tạo (PIN đúng) → khoá hiện MỘT lần; danh sách không có khoá; bảng chỉ giữ băm SHA-256 (≠ khoá)', j1.status === 200 && /^ndk_[A-Za-z0-9_-]{40,}$/.test(khoa)
      && ds.status === 200 && (ds.j.data || []).length === 1 && !JSON.stringify(ds.j).includes(khoa) && !JSON.stringify(ds.j).includes(bang[0]?.ma_bam || '@@')
      && bang.length === 1 && bang[0].ma_bam === crypto.createHash('sha256').update(khoa).digest('hex') && !Object.values(bang[0]).includes(khoa), `${moTa(j1)} · ${JSON.stringify(ds.j).slice(0, 120)}`);
    const x = await A.goi('GET', ND + '/xuat', { ve: khoa });
    const ghi = await Promise.all([['PUT', '/nhap', { khoa: 'j2', gia_tri: 1, ban_goc: 4 }], ['POST', '/cap-nhat', { ban_goc: 4 }], ['POST', '/nhap-toan-bo', { dinh_dang: 1 }],
      ['GET', '/nhap'], ['GET', '/phien-ban'], ['POST', '/quay-lai', { so: 1, ban_goc: 4 }], ['DELETE', '/nhap/con.lai.trong.file']].map(([m, d, body]) => A.goi(m, ND + d, { ve: khoa, body })));
    k('J2 khoá gọi GET /xuat → 200 (có nhật ký xuat); mọi cửa khác → 403 KHONG_DU_QUYEN', x.status === 200 && x.j.dinh_dang === 1
      && ghi.every((r) => r.status === 403 && r.j.code === 'KHONG_DU_QUYEN'), `${moTa(x)} / ${ghi.map((r) => r.status).join(',')}`);
    const th = await A.goi('POST', `${KS}/${bang[0]?.id}/thu-hoi`, { ve: A.vePos, body: { pin: '1234' } });
    const x2 = await A.goi('GET', ND + '/xuat', { ve: khoa });
    const x3 = await A.goi('GET', ND + '/xuat', { ve: 'ndk_' + 'A'.repeat(43) });
    k('J3 thu hồi (PIN) → khoá cũ GET /xuat 401; khoá bịa → 401', th.status === 200 && x2.status === 401 && x3.status === 401, `${moTa(th)} / ${moTa(x2)} / ${moTa(x3)}`);
  });

  // ═══ I · xuất / nhập toàn bộ ═══
  muc('[I] Xuất / nhập toàn bộ');
  let tep = null;
  await doan('I', async () => {
    const veB = await B.veNd('admin', 'admin123');
    const nhapB = (body) => B.goi('POST', ND + '/nhap-toan-bo', { ve: veB, body });
    const xa = await A.goi('GET', ND + '/xuat', { ve: veChu });
    tep = xa.j;
    k('C1b xuất: tệp JSON tải về (Content-Disposition), dinh_dang 1, đủ ban / nhap / anh (base64) / nhat_ky', xa.status === 200 && /attachment/.test(xa.h['content-disposition'] || '')
      && tep.dinh_dang === 1 && (tep.ban || []).length === 4 && (tep.nhap || []).length >= 1 && (tep.anh || []).length >= 5 && (tep.nhat_ky || []).length >= 5
      && typeof tep.anh?.[0]?.du_lieu_base64 === 'string', `${moTa(xa)} · ${Object.keys(tep)}`);
    const tr0 = await B.chup();
    const i3a = await nhapB({ ...tep, dinh_dang: 2 });
    const i3b = await nhapB({ ...tep, anh: [...tep.anh, { ...tep.anh[0], du_lieu_base64: Buffer.from('<html>x</html>').toString('base64') }] });
    const i3c = await nhapB({ ...tep, ban: tep.ban.map((b) => ({ ...b, dang_chay: 1 })) });
    const i3d = await nhapB({ ...tep, anh: tep.anh.map((a, i) => (i ? a : { ...a, ma: 'a'.repeat(64) })) });
    k('I3 tệp dinh_dang lạ / ảnh base64 là HTML / hai bản đang chạy / mã ảnh lệch băm → 400, kho trống vẫn trống', [i3a, i3b, i3c, i3d].every((r) => r.status === 400)
      && i3b.j.code === 'ANH_KHONG_HOP_LE' && tr0 === await B.chup(), [i3a, i3b, i3c, i3d].map(moTa).join(' | '));
    const i1 = await nhapB(tep);
    const xb = (await B.goi('GET', ND + '/xuat', { ve: veB })).j;
    const s = (x) => JSON.stringify(x);
    const nkB = (xb.nhat_ky || []).slice(0, (tep.nhat_ky || []).length);
    const anhB = await B.goi('GET', ND + '/anh/' + tep.anh[0].ma);
    k('I1 xuất → nhập vào kho TRỐNG → giống hệt: từng bản (mọi cột), từng ảnh (byte), nháp, nhật ký (phần đầu)', i1.status === 200 && s(xb.ban) === s(tep.ban)
      && s(xb.anh) === s(tep.anh) && s(xb.nhap) === s(tep.nhap) && s(nkB) === s(tep.nhat_ky) && anhB.b.equals(Buffer.from(tep.anh[0].du_lieu_base64, 'base64')),
      `${moTa(i1)} · bản ${s(xb.ban) === s(tep.ban)} ảnh ${s(xb.anh) === s(tep.anh)} nháp ${s(xb.nhap) === s(tep.nhap)} nk ${s(nkB) === s(tep.nhat_ky)}`);
    const bd = await B.goi('GET', ND + '/ban-dang-chay');
    k('I1b kho B sau nhập: bản đang chạy = bản 4 của A', bd.j.so_ban === 4, moTa(bd));
    const t2 = await B.chup();
    const i2 = await nhapB(tep);
    k('I2 nhập vào kho đã có dữ liệu → 409 KHO_DA_CO_DU_LIEU, không xoá / đổi gì', i2.status === 409 && i2.j.code === 'KHO_DA_CO_DU_LIEU' && t2 === await B.chup(), moTa(i2));
  });

  // ═══ K · sao lưu Excel + dọn thử ═══
  muc('[K] Sao lưu Excel (Q-B) + dọn dữ liệu thử');
  await doan('K', async () => {
    const ex = await A.goi('GET', '/api/pos/backup/export-all', { ve: A.vePos });
    const wb = XLSX.read(ex.b, { type: 'buffer' });
    const trang = wb.Sheets['Nội dung App (JSON)'];
    const dong = trang ? XLSX.utils.sheet_to_json(trang) : [];
    let tepEx = {};
    try { tepEx = JSON.parse(dong.map((d) => d.du_lieu).join('')); } catch { /* hỏng */ }
    const xn = (await A.goi('GET', ND + '/xuat', { ve: veChu })).j;
    const s = (x) => JSON.stringify(x);
    let daiNhat = 0;
    for (const n of wb.SheetNames) for (const r of XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1 })) for (const o of r) daiNhat = Math.max(daiNhat, String(o ?? '').length);
    const nhanNd = [...doc(path.join(SV, 'routes', 'backup.js')).matchAll(/name: '(nd_\w+)', label: '([^']+)'/g)].map((m) => [m[1], m[2]]);
    k('K1 export-all có trang "Nội dung App (JSON)" = tệp Xuất (bản, ảnh, nháp giống hệt); ô dài nhất ≤ 32.767; không trang thô nào của bảng nd_*',
      ex.status === 200 && dong.length >= 2 && s(tepEx.ban) === s(xn.ban) && s(tepEx.anh) === s(xn.anh) && s(tepEx.nhap) === s(xn.nhap) && daiNhat <= 32767
      && nhanNd.length === 6 && !nhanNd.some(([, l]) => wb.SheetNames.includes(l)), `${moTa(ex)} · ${dong.length} dòng · dài ${daiNhat} · nhãn ${nhanNd.length}`);
    const nhanBan = (nhanNd.find(([t]) => t === 'nd_ban') || [])[1] || 'Nội dung App - Bản';
    const wbK = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbK, trang || XLSX.utils.json_to_sheet([{ phan: 1, du_lieu: '{}' }]), 'Nội dung App (JSON)');
    XLSX.utils.book_append_sheet(wbK, XLSX.utils.json_to_sheet([{ so_ban: 77, gia_tri: '{}', luc: '2026-11-14T10:00:00', dang_chay: 0 }]), nhanBan);
    XLSX.utils.book_append_sheet(wbK, wb.Sheets['Cài đặt'], 'Cài đặt');
    const tepK = XLSX.write(wbK, { type: 'buffer', bookType: 'xlsx' });
    const gui = (d, buf) => { const m = multipart('sao_luu.xlsx', 'application/octet-stream', buf, 'file'); return A.goi('POST', '/api/pos/backup/' + d, { ve: A.vePos, body: m.body, headers: { 'Content-Type': m.type } }); };
    const truoc = await A.chup();
    const xem = await gui('preview-restore', tepK);
    const kp = await gui('restore', tepK);
    const tt = (r, sh) => (r.j.preview || r.j.results || []).find((x) => x.sheet === sh)?.status;
    k('K2 xem trước + khôi phục tệp đó: hai trang nội dung App (kể cả trang mang NHÃN bảng nd_ban) bị bỏ qua, nd_* không đổi; trang POS khôi phục như cũ',
      xem.status === 200 && kp.status === 200 && tt(xem, 'Nội dung App (JSON)') === 'skipped' && tt(xem, nhanBan) === 'skipped' && tt(kp, nhanBan) === 'skipped'
      && tt(kp, 'Cài đặt') === 'restored' && truoc === await A.chup(), `${moTa(xem)} / ${moTa(kp)} · ${tt(kp, nhanBan)}`);
    const wbCu = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbCu, wb.Sheets['Cài đặt'], 'Cài đặt');
    const cu = await gui('restore', XLSX.write(wbCu, { type: 'buffer', bookType: 'xlsx' }));
    k('K5f khôi phục tệp sao lưu CŨ (không có trang nội dung App) → như trước', cu.status === 200 && tt(cu, 'Cài đặt') === 'restored', moTa(cu));
    const mot = await A.goi('GET', '/api/pos/backup/export/nd_anh', { ve: A.vePos });
    k('K1b xuất một bảng nd_* bằng export/:table → 400 (nội dung App sao lưu trong bản toàn bộ)', mot.status === 400, moTa(mot));
    let dt = {};
    try { dt = require(path.join(SV, 'utils', 'donThu.js')); } catch (e) { dt = { loi: e.message }; }
    k('K3 donThu.js: 6 bảng nd_* đăng ký "không bao giờ dọn" (BANG_KHONG_DON), không nằm trong danh sách xoá', ND_BANG.every((t) => (dt.BANG_KHONG_DON || []).includes(t))
      && !ND_BANG.some((t) => (dt.THU_TU_XOA || []).includes(t)), JSON.stringify(dt.BANG_KHONG_DON || dt.loi));
  });

  // ═══ H · CORS ═══
  muc('[H] CORS /api/nd chỉ hai tên miền App; /api/kh, /api/pos không đổi');
  await doan('H', async () => {
    const TOT = ['https://tuquyduong.com', 'https://app-kh.pages.dev'];
    const LA = ['https://evil.example', 'https://tuquyduong.com.evil.example', 'http://tuquyduong.com', 'null'];
    const acao = (r) => r.h['access-control-allow-origin'];
    const tot = await Promise.all(TOT.map((o) => A.goi('GET', ND + '/ban-dang-chay', { origin: o })));
    const totHoi = await Promise.all(TOT.map((o) => A.goi('OPTIONS', ND + '/nhap', { origin: o, headers: { 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'authorization,content-type' } })));
    k('H1a Origin tuquyduong.com / app-kh.pages.dev → ACAO đúng origin đó (GET + OPTIONS hỏi trước có PUT)', tot.every((r, i) => acao(r) === TOT[i])
      && totHoi.every((r, i) => acao(r) === TOT[i] && /PUT/.test(r.h['access-control-allow-methods'] || '')), [...tot, ...totHoi].map(acao).join(', '));
    const la = [];
    for (const o of LA) {
      la.push(await A.goi('GET', ND + '/ban-dang-chay', { origin: o }));
      la.push(await A.goi('OPTIONS', ND + '/cap-nhat', { origin: o, headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization' } }));
      la.push(await A.goi('GET', ND + '/khong-co', { origin: o }));
    }
    k('H1b Origin lạ (evil, đuôi giả, http, null) → KHÔNG có Access-Control-Allow-Origin nào (kể cả *), GET / OPTIONS / 404', la.every((r) => acao(r) === undefined), la.map(acao).join(','));
    const l404 = await A.goi('GET', ND + '/khong-co', { origin: TOT[0] });
    k('C4 đường lạ /api/nd/khong-co → 404 KHONG_TIM_THAY JSON (không rơi xuống trang quầy), vẫn có ACAO cho origin hợp lệ', l404.status === 404 && l404.j.code === 'KHONG_TIM_THAY'
      && acao(l404) === TOT[0], `${moTa(l404)} ${acao(l404)}`);
    const sai = await A.goi('POST', ND + '/ban-dang-chay', {});
    k('C4b sai phương thức (POST ban-dang-chay) → 404 KHONG_TIM_THAY', sai.status === 404 && sai.j.code === 'KHONG_TIM_THAY', moTa(sai));
    const kh = await A.goi('OPTIONS', '/api/kh/toi', { origin: 'https://evil.example', headers: { 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization' } });
    const pos = await A.goi('GET', '/api/pos/health', { origin: 'https://evil.example' });
    k('H2 (K5) /api/kh và /api/pos vẫn Access-Control-Allow-Origin: * như cũ', acao(kh) === '*' && acao(pos) === '*' && kh.h['access-control-max-age'] === '7200', `${acao(kh)} ${acao(pos)}`);
    const lg = await A.goi('POST', '/api/pos/auth/login', { body: { username: 'admin', password: 'admin123' } });
    k('K5d đăng nhập POS thường vẫn 200', lg.status === 200 && !!lg.j.token, moTa(lg));
    k('C5 mọi phản hồi lỗi /api/nd đều có { error, code } chữ', MOI_LOI.length > 30 && MOI_LOI.every((r) => typeof r.j.error === 'string' && r.j.error && /^[A-Z_]+$/.test(r.j.code || '')),
      MOI_LOI.filter((r) => !(typeof r.j.error === 'string' && /^[A-Z_]+$/.test(r.j.code || ''))).slice(0, 3).map((r) => `${r.method} ${r.duong} ${r.status} ${JSON.stringify(r.j)}`).join(' | '));
  });

  // ═══ L · hợp đồng riêng ═══
  muc('[L] Hợp đồng HOP_DONG_API_ND.md v1');
  await doan('L', async () => {
    const hd = doc(path.join(GOC, 'HOP_DONG_API_ND.md'));
    const khoi = (hd.match(/```json HOP_DONG_ND_MAY_DOC\n([\s\S]*?)\n```/) || [])[1];
    let may = {};
    try { may = JSON.parse(khoi); } catch { /* chưa có */ }
    const duong = doc(path.join(SV, 'nd', 'duong.js'));
    const cuaCode = [...duong.matchAll(/router\.(get|post|put|delete)\('([^']+)'/g)].map((m) => `${m[1].toUpperCase()} ${m[2]}`).sort();
    const cuaHd = (may.cua || []).map((c) => `${c.phuong_thuc} ${c.duong}`).sort();
    k('L1 PHIEN_BAN: 1; khối máy đọc liệt kê ĐÚNG tập cửa của router nd (so bằng, hai chiều; 13 cửa)', /^PHIEN_BAN: 1$/m.test(hd) && may.phien_ban === 1
      && cuaCode.length === 13 && JSON.stringify(cuaCode) === JSON.stringify(cuaHd), `code ${cuaCode.join(',')} · hđ ${cuaHd.join(',')}`);
    let gh = {};
    try { gh = require(path.join(SV, 'nd', 'tinh.js')).GIOI_HAN || {}; } catch { /* chưa có */ }
    const TAY = { khoa_toi_da: 80, ban_toi_da_byte: 1048576, anh_toi_da_byte: 512000, nhap_toan_bo_toi_da_byte: 52428800, sai_toi_da: 5, khoa_phut: 15, ve_gio: 12 };
    k('L2 giới hạn trong hợp đồng = hằng của server/nd/tinh.js = số viết tay', JSON.stringify(may.gioi_han) === JSON.stringify(TAY) && JSON.stringify(gh) === JSON.stringify(TAY),
      `${JSON.stringify(may.gioi_han)} / ${JSON.stringify(gh)}`);
    const maCode = new Set([...Object.values(nguonNd).join('\n').matchAll(/\b([A-Z][A-Z_]{5,})\b/g)].map((m) => m[1]).filter((m) => (may.ma_loi || {})[m] !== undefined || /^(CHUA|KHONG|CO_|KHOA_|QUA_|ANH_|SAI_|GIA_|DU_|KHO_|LOI_)/.test(m)));
    const TOI_THIEU = { CHUA_DANG_NHAP: 401, KHONG_DU_QUYEN: 403, CO_BAN_MOI_HON: 409, KHOA_KHONG_HOP_LE: 400, QUA_LON: 413, ANH_KHONG_HOP_LE: 400, QUA_NHIEU_LAN: 429, KHONG_TIM_THAY: 404 };
    const thieu = [...maCode].filter((m) => (may.ma_loi || {})[m] === undefined);
    k('L3 mã lỗi: đủ 8 mã tối thiểu đúng status; mọi mã trong server/nd/ có trong hợp đồng', Object.entries(TOI_THIEU).every(([m, s]) => (may.ma_loi || {})[m] === s)
      && thieu.length === 0 && maCode.size >= 12, `thiếu: ${thieu.join(', ')}`);
    k('L4 quyền trong hợp đồng = 4 quyền nd; hợp đồng riêng, không dùng số phiên bản /api/kh', JSON.stringify((may.quyen || []).map((x) => x.ma)) === JSON.stringify(QUYEN)
      && !/HOP_DONG_MAY_DOC\b/.test(hd));
  });

  // ═══ M · nối bộ kiểm + giao diện ═══
  muc('[M] Bộ kiểm + giao diện (tĩnh)');
  {
    k("M1 kiem_tra_truoc_khi_giao.js chạy bài này (chayBaiThat('cong_cu/thu_NDAPI1.js'))", /chayBaiThat\('cong_cu\/thu_NDAPI1\.js'/.test(doc(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'))));
    const st = doc(path.join(GOC_THU, 'client', 'src', 'pages', 'Settings.jsx'));
    const ak = doc(path.join(GOC_THU, 'client', 'src', 'pages', 'CaiDat', 'AppKhachHang.jsx'));
    k('S1 Settings.jsx: hai lưới Phân quyền hiện tiêu đề nhóm (p.nhom); thẻ "📱 App khách hàng" chỉ chủ quán, mã ở CaiDat/AppKhachHang.jsx',
      (st.match(/tieuDeNhom\(/g) || []).length >= 3 && /import AppKhachHang from '\.\/CaiDat\/AppKhachHang'/.test(st) && /isAdmin && \(\s*<button[\s\S]{0,200}?doiThe\('appKh'\)/.test(st)
      && /tab === 'appKh' \? \(\s*<AppKhachHang \/>/.test(st));
    k('S2 AppKhachHang.jsx: tạo / thu hồi qua ndKhoaApi + HoiPin; api.js có ndKhoaApi trỏ /nd-khoa-sao-luu', /ndKhoaApi\.tao\(/.test(ak) && /ndKhoaApi\.thuHoi\(/.test(ak)
      && /<HoiPin /.test(ak) && /export const ndKhoaApi = \{[\s\S]{0,300}'\/nd-khoa-sao-luu'/.test(apiJs));
  }
}

main().catch((e) => { k('bài sập', false, e.stack); }).finally(() => {
  console.log(`\n${dat} đạt · ${hong} hỏng`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
});
