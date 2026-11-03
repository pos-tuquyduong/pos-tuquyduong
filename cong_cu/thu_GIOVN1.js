#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ GIO-VN-1 — mọi giờ GHI / SO / TRẢ RA là giờ Việt Nam `YYYY-MM-DDTHH:mm:ss` (chủ quán 28.10)
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (còn chỗ ghi giờ UTC, chưa có bước nâng cấp 012). Xanh ngay từ đầu = vô giá trị (K3).
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_GIOVN1.js        (đọc server/ + HOP_DONG_API_KH.md + client/src/ cạnh thư mục cong_cu/ của bài)
 *  Khuôn thu_DOISOAT1.js: database.js + libsql thật trên kho TẠM, chỉ thay ketNoiKho (P8), SX tắt, đồng hồ GIẢ (`new Date()` / `Date.now()`).
 *  Máy chạy TZ=UTC như Render; ca C5b đổi TZ giữa chừng (Node đọc lại process.env.TZ) để bắt cách tính phụ thuộc múi giờ máy.
 *  Phần:
 *   D  phép QUÉT chặn tái phạm (hàm quet) — ca chuỗi giả từng mẫu; A1 quét server/ thật = 0 vi phạm, ngoại lệ chết → đỏ.
 *   A  route thật ghi giờ dạng T ≈ getNow · A3 hàm ngày của màn quầy (client/src/utils/ngayVN.js).
 *   B  bước nâng cấp 012 (server/nang_cap/012_gio_viet_nam.js → utils/chuanHoaGio.js) trên dữ liệu cũ gieo tay · B6 khôi phục sao lưu qua route.
 *   C  so giờ quanh 00:00 và 07:00 giờ VN (07:00 VN = 00:00 UTC, mốc đổi ngày của máy chủ).
 *   E  giờ trả ra /api/kh đúng dạng; hợp đồng bỏ "Lỗi đã biết", PHIEN_BAN 6.
 *   G  màn quầy (client/src) chỉ dùng giờ VN (chủ quán 03.11: một múi giờ duy nhất): quét GD1–GD4 — chỉ utils/ngayVN.js được đụng Date;
 *      hàm chung ngayVN.js (khoangNgay, docGioVN, hienNgay / hienGio / hienNgayGio) thử ở điện thoại đặt múi KHÁC giờ VN.
 *      Giới hạn GD3: `x.toLocaleString()` với x là biến Date (không có `new Date(` cùng dòng) lọt — số tiền cũng gọi toLocaleString.
 *  GIỚI HẠN quét (K4 TU-CHAY-6): chỉ soi chữ trong file server/**.js — giờ dựng qua hàm phụ ở file khác / SQL ghép động (khoiPhuc.js INSERT
 *  theo cột của file Excel) không thấy; mẫu 5 chỉ đọc INSERT có danh sách cột viết thẳng. M3 chỉ bắt đồng hồ trần viết LIỀN
 *  (`new Date().toISOString()`) — tách hai bước (`const d = new Date(); d.toISOString()`) hay `toLocaleString()` thiếu timeZone thì lọt.
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const MAY_CHU = path.join(GOC, 'server');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_giovn1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
process.env.JWT_SECRET = 'thu_giovn1_nv_' + Date.now();
process.env.KH_JWT_SECRET = 'thu_giovn1_kh_' + Date.now();
process.env.SX_API_KEY = 'khoa_sx_gia_thu_giovn1';   // customers-v2.js chỉ gọi SX (giả bên dưới) khi có khoá

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const doc = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
let nhatKy = [];
const imLang = () => { nhatKy = []; console.log = (...a) => nhatKy.push(a.join(' ')); console.error = console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const DANG_T = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/;

// Đồng hồ giả: datVN('2027-01-01T00:00:00') = giờ Việt Nam đó (máy chủ thấy UTC trừ 7 giờ).
const DateGoc = Date;
let gio = DateGoc.UTC(2026, 10, 2, 5, 0, 0);
const chuoiVaoDate = [];   // G3: chuỗi đưa vào new Date(...) — trình duyệt điện thoại (Safari) chỉ đọc chắc dạng ISO có T + múi
global.Date = class extends DateGoc {
  constructor(...a) { if (a.length === 0) super(gio); else { if (typeof a[0] === 'string') chuoiVaoDate.push(a[0]); super(...a); } }
  static now() { return gio; }
};
const datVN = (s) => { gio = DateGoc.parse(s + 'Z') - 7 * 3600000; };

// ═══════════════ phép QUÉT (D) ═══════════════
const MAU = [
  ['M1 CURRENT_TIMESTAMP ngoài định nghĩa cột', (d) => /CURRENT_TIMESTAMP/i.test(d) && !/^\s*\w+\s+(TEXT|DATETIME|DATE)\b.*DEFAULT CURRENT_TIMESTAMP/i.test(d)],
  ['M2 giờ của SQLite (now / localtime / +7 hours)', (d) => /['"`]now['"`]|unixepoch\s*\(|['"`]localtime['"`]|['"`]\+7 hours['"`]/i.test(d)],
  ['M3 đồng hồ máy chủ trần', (d) => /new Date\(\)\s*\.\s*(toISOString|toJSON|get\w+)\s*\(|new Date\(\s*Date\.now\(\)|7\s*\*\s*3600/.test(d)],
  ['M4 dựng giờ dấu cách', (d) => /\.replace\(\s*['"`]T['"`]\s*,\s*['"`] ['"`]\s*\)/.test(d)],
];
// Ngoại lệ: [file, chuỗi phải có trên dòng, lý do]. Ngoại lệ không còn khớp vi phạm nào → ĐỎ (khỏi để ngoại lệ chết).
const NGOAI_LE = [
  ['server/utils/doiSoat.js', "ELSE DATETIME(created_at, '+7 hours') END", 'dữ liệu CŨ chưa qua bước 012 (pos_damage_logs dấu cách = UTC) — dạng T lấy nguyên'],
  ['server/utils/chuanHoaGio.js', 'const CONG7 = (c) =>', 'chính bước đổi giờ CŨ (UTC) sang giờ VN: +7 giờ trên giá trị đã lưu, không phải đồng hồ máy'],
];
function boChuThich(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n').map((d) => (/^\s*\*/.test(d) ? '' : d.replace(/(^|[^:\\'"`\w])\/\/.*$/, '$1'))).join('\n');
}
function cotMacDinh(cacFile) {   // bảng → cột DEFAULT CURRENT_TIMESTAMP, đọc MỌI CREATE TABLE (database.js, nang_cap/, kho/ …)
  const bang = {};
  for (const src of cacFile) {
    for (const m of src.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)\s*\(/gi)) {
      let sau = 1, i = m.index + m[0].length;
      for (; i < src.length && sau > 0; i++) sau += src[i] === '(' ? 1 : src[i] === ')' ? -1 : 0;
      const cot = [...src.slice(m.index + m[0].length, i).matchAll(/(?:^|,)\s*(\w+)\s+\w+[^,]*DEFAULT CURRENT_TIMESTAMP/gi)].map((x) => x[1]);
      if (cot.length) bang[m[1]] = [...new Set([...(bang[m[1]] || []), ...cot])];
    }
  }
  return bang;
}
/** tep = { 'server/x.js': nội dung } → [{ tep, dong, mau, chu }] */
function quet(tep, { mau = MAU, ngoaiLe = NGOAI_LE, m5 = true } = {}) {
  const ra = [];
  const sach = Object.fromEntries(Object.entries(tep).map(([f, s]) => [f, boChuThich(s)]));
  for (const [f, s] of Object.entries(sach)) {
    s.split('\n').forEach((d, i) => { for (const [ten, phep] of mau) if (phep(d)) ra.push({ tep: f, dong: i + 1, mau: ten, chu: d.trim() }); });
  }
  const md = m5 ? cotMacDinh(Object.values(sach)) : {};
  for (const [f, s] of Object.entries(m5 ? sach : {})) {
    for (const m of s.matchAll(/INSERT\s+(?:OR\s+\w+\s+)?INTO\s+(\w+)\s*\(([^)]*)\)/gi)) {
      const cot = m[2].split(',').map((c) => c.trim().replace(/"/g, ''));
      const thieu = (md[m[1]] || []).filter((c) => !cot.includes(c));
      if (thieu.length) ra.push({ tep: f, dong: s.slice(0, m.index).split('\n').length, mau: 'M5 INSERT bỏ trống cột DEFAULT CURRENT_TIMESTAMP', chu: `${m[1]}: ${thieu.join(', ')}` });
    }
  }
  const ngoai = [], dung = new Set();
  const conLai = ra.filter((v) => {
    const j = ngoaiLe.findIndex(([f, chuoi]) => f === v.tep && sach[f].split('\n')[v.dong - 1].includes(chuoi));
    if (j >= 0) dung.add(j);
    return j < 0;
  });
  ngoaiLe.forEach((n, j) => { if (!dung.has(j) && tep[n[0]] !== undefined) ngoai.push(n); });
  return { viPham: conLai, ngoaiLeChet: ngoai };
}
// Màn quầy (client/src): điện thoại có thể đặt múi khác giờ VN → mọi đọc / tính / in ngày giờ đi qua client/src/utils/ngayVN.js.
const MAU_GD = [
  ['GD1 ngày / giờ theo đồng hồ điện thoại', (d) => /\.(get|set)(FullYear|Month|Date|Day|Hours|Minutes|Seconds)\s*\(/.test(d)],
  ['GD2 giờ UTC', (d) => /\.(toISOString|toJSON)\s*\(|\.(get|set)UTC\w*\s*\(|Date\.UTC\s*\(/.test(d)],
  ['GD3 in ngày / giờ không qua ngayVN.js', (d) => /\.toLocale(Date|Time)String\s*\(|new Date\([^;]*?\)\s*\.toLocaleString\s*\(|Intl\.DateTimeFormat\s*\(/.test(d)],
  ['GD4 đọc chuỗi giờ theo múi điện thoại', (d) => /new Date\(\s*[^)\s]|Date\.parse\s*\(/.test(d)],
];
const NGOAI_LE_GD = [
  ['client/src/utils/ngayVN.js', '', 'chỗ DUY NHẤT đọc / tính / in ngày giờ của màn quầy — mọi hàm gắn múi Asia/Ho_Chi_Minh hoặc +07:00 rõ ràng (A3, G2, G3 thử từng hàm)'],
  ['client/src/pages/BanHang/tinh.js', 'Date.parse(hetHan + MUI_VN)', 'het_han giờ VN không hậu tố, gắn +07:00 rõ ràng — đếm ngược QR theo khoảng'],
];
const GD = { mau: MAU_GD, ngoaiLe: NGOAI_LE_GD, m5: false };
function docClient() {
  const ra = {};
  const di = (thu) => { for (const t of fs.readdirSync(thu, { withFileTypes: true })) {
    const p = path.join(thu, t.name);
    if (t.isDirectory()) di(p); else if (/\.jsx?$/.test(t.name)) ra[path.relative(GOC, p).split(path.sep).join('/')] = doc(p);
  } };
  di(path.join(GOC, 'client', 'src'));
  return ra;
}
function docServer() {
  const ra = {};
  const di = (thu) => { for (const t of fs.readdirSync(thu, { withFileTypes: true })) {
    const p = path.join(thu, t.name);
    if (t.isDirectory()) { if (t.name !== 'node_modules') di(p); } else if (t.name.endsWith('.js')) ra[path.relative(GOC, p).split(path.sep).join('/')] = doc(p);
  } };
  di(MAY_CHU);
  return ra;
}

async function main() {
  muc('D. Phép quét chặn tái phạm (chuỗi giả)');
  const mot = (src, f = 'server/routes/gia.js') => quet({ [f]: src }).viPham;
  const ten = (v) => v.map((x) => x.mau.slice(0, 2)).join(',');
  k('D1 `SET updated_at = CURRENT_TIMESTAMP` → M1; cột `created_at TEXT DEFAULT CURRENT_TIMESTAMP` không đỏ',
    ten(mot("db.run(`UPDATE x SET updated_at = CURRENT_TIMESTAMP`)")) === 'M1' && mot('      created_at TEXT DEFAULT CURRENT_TIMESTAMP,').length === 0);
  k("D2 `DATE('now', 'localtime')` chữ HOA, `strftime('%s','now')`, `datetime(\"now\")`, `'+7 hours'` giữa dòng → M2 mỗi ca",
    ["sql += ` AND DATE(created_at) = DATE('now', 'localtime')`;", "q(\"SELECT strftime('%s','now')\")", "run('UPDATE p SET a = datetime(\"now\")')",
      "const x = 1; run(`UPDATE t SET d = datetime(?, '+7 hours')`, [a]);"].every((s) => ten(mot(s)) === 'M2'));
  k('D3 `new Date().toISOString()`, `new Date().getFullYear()`, `new Date(Date.now() + 7 * 3600 * 1000)` → M3',
    ['const now = new Date().toISOString();', 'const y = new Date().getFullYear();', 'const v = new Date(Date.now() + 1)'].every((s) => ten(mot(s)) === 'M3'));
  k("D4 `.replace('T', ' ')` → M4; `.replace(' ', 'T')` không đỏ", ten(mot("const h = d.toISOString().slice(0, 19).replace('T', ' ');")) === 'M4'
    && mot("const h = String(x).replace(' ', 'T');").length === 0);
  const ddl = "await db.execute(`CREATE TABLE IF NOT EXISTS t_thu (\n  id INTEGER PRIMARY KEY,\n  ten TEXT,\n  created_at TEXT DEFAULT CURRENT_TIMESTAMP\n)`);\n";
  k('D5 INSERT bỏ trống cột DEFAULT (bảng tạo ở FILE KHÁC, vd nang_cap/) → M5; INSERT có cột → không',
    ten(quet({ 'server/nang_cap/099_gia.js': ddl, 'server/routes/gia.js': "run('INSERT INTO t_thu (ten) VALUES (?)', [a]);" }).viPham) === 'M5'
    && quet({ 'server/nang_cap/099_gia.js': ddl, 'server/routes/gia.js': "run('INSERT INTO t_thu (ten, created_at) VALUES (?, ?)', [a, getNow()]);" }).viPham.length === 0);
  k("D6 mẫu nằm trong chú thích (// hoặc /* */ hoặc dòng *) → không đỏ; chuỗi 'http://x' không bị coi là chú thích",
    mot("// trước đây datetime('now') = UTC\n/* CURRENT_TIMESTAMP */\n * new Date().toISOString()").length === 0
    && ten(mot("const u = 'http://x'; run(`UPDATE t SET a = datetime('now')`);")) === 'M2');

  muc('A1. Quét server/ thật');
  const kq = quet(docServer());
  k(`A1 server/ không còn chỗ ghi / so giờ UTC (${kq.viPham.length} vi phạm)`, kq.viPham.length === 0,
    kq.viPham.slice(0, 8).map((v) => `${v.tep}:${v.dong} ${v.mau.slice(0, 2)} ${v.chu.slice(0, 60)}`).join(' | ') + (kq.viPham.length > 8 ? ' …' : ''));
  k('A1b mọi ngoại lệ còn khớp đúng một chỗ có thật (không ngoại lệ chết)', kq.ngoaiLeChet.length === 0, kq.ngoaiLeChet.map((n) => n[0] + ' ' + n[1]).join(' | '));

  muc('A3. Hàm ngày của màn quầy (client/src/utils/ngayVN.js)');
  const srcNgay = doc(path.join(GOC, 'client', 'src', 'utils', 'ngayVN.js'));
  let NV = {};
  try { NV = new Function(srcNgay.replace(/export\s+(default\s+)?function/g, 'function')
    + `\nreturn { ${[...srcNgay.matchAll(/export\s+function\s+(\w+)/g)].map((m) => m[1]).join(', ')} };`)(); } catch { /* chưa có file */ }
  const ngayVN = NV.ngayVN;
  datVN('2027-01-01T06:59:59');
  const a3 = ngayVN ? ngayVN() : null;
  datVN('2026-12-31T23:59:59');
  const a3b = ngayVN ? ngayVN() : null;
  k('A3 máy TZ=UTC, giờ VN 06:59:59 ngày 01.01.2027 → "2027-01-01"; 23:59:59 ngày 31.12 → "2026-12-31"', a3 === '2027-01-01' && a3b === '2026-12-31', `${a3} / ${a3b}`);
  const jsx = doc(path.join(GOC, 'client', 'src', 'pages', 'Orders.jsx')) + doc(path.join(GOC, 'client', 'src', 'pages', 'Reports.jsx'));
  k('A3b Lịch sử đơn + Báo cáo không còn lấy ngày bằng toISOString (giờ UTC của điện thoại)', jsx.length > 0 && !/toISOString\(\)\.slice\(0,\s*10\)/.test(jsx));

  muc('G. Màn quầy (client/src) chỉ dùng giờ VN — quét + hàm chung ngayVN.js (chủ quán 03.11)');
  const motGD = (src, f = 'client/src/pages/Gia.jsx') => quet({ [f]: src }, GD).viPham;
  const maGD = (v) => [...new Set(v.map((x) => x.mau.split(' ')[0]))].sort().join(',');
  k('G0a `now.getFullYear()`, `d.setDate(d.getDate() - 1)`, `new Date().getMonth()`, `d.getHours()` → GD1',
    ['const y = now.getFullYear();', 'd.setDate(d.getDate() - 1);', 'const m = new Date().getMonth();', 'const h = d.getHours();'].every((s) => maGD(motGD(s)) === 'GD1'));
  k('G0b `toISOString()`, `toJSON()`, `getUTCDate()`, `setUTCHours(`, `Date.UTC(` → GD2',
    ['const s = new Date().toISOString().slice(0, 10);', 'const j = d.toJSON();', 'const n = d.getUTCDate();', 'd.setUTCHours(0);', 'const t = Date.UTC(2026, 0, 1);']
      .every((s) => maGD(motGD(s)) === 'GD2'));
  k("G0c `toLocaleDateString('vi-VN')`, `toLocaleTimeString` (kể cả có timeZone), `new Date().toLocaleString(`, `Intl.DateTimeFormat(` → GD3",
    ["{new Date().toLocaleDateString('vi-VN')}", "d.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })", "const s = new Date().toLocaleString('vi-VN');",
      "const f = new Intl.DateTimeFormat('vi-VN');"].every((s) => maGD(motGD(s)) === 'GD3'));
  k('G0d `new Date(d.created_at)`, `new Date(now)`, `Date.parse(s)` → GD4; `new Date(x).toLocaleString(` → GD3 + GD4',
    ['const a = new Date(d.created_at);', 'const y = new Date(now);', 'const m = Date.parse(s);'].every((s) => maGD(motGD(s)) === 'GD4')
    && maGD(motGD("return new Date(date).toLocaleString('vi-VN', {")) === 'GD3,GD4');
  k('G0e KHÔNG đỏ: số tiền toLocaleString, Date.now(), new Date() trần, setter React setDate(, hàm ngayVN.js, chú thích; ngoại lệ ngayVN.js / tinh.js đúng dòng',
    ["const t = (p || 0).toLocaleString('vi-VN') + 'đ';", 'const h = Date.now() + 5000;', 'const n = new Date();', 'onChange={e => setDate(e.target.value)}',
      "<td>{hienNgay(d.created_at)}</td>", '// new Date(x).getMonth()', '{/* d.toISOString() */}'].every((s) => motGD(s).length === 0)
    && quet({ 'client/src/utils/ngayVN.js': "return new Date(t + '+07:00').toLocaleDateString('sv-SE', { timeZone: MUI });" }, GD).viPham.length === 0
    && quet({ 'client/src/pages/BanHang/tinh.js': 'const m = Date.parse(hetHan + MUI_VN);\nconst x = Date.parse(s);' }, GD).viPham.map((v) => v.dong).join() === '2');
  const kqGD = quet(docClient(), GD);
  k(`G1 client/src thật không còn chỗ lấy ngày / giờ theo điện thoại hoặc UTC (${kqGD.viPham.length} vi phạm)`, kqGD.viPham.length === 0,
    kqGD.viPham.slice(0, 8).map((v) => `${v.tep.replace('client/src/', '')}:${v.dong} ${v.mau.split(' ')[0]}`).join(' | ') + (kqGD.viPham.length > 8 ? ' …' : ''));
  k('G1b mọi ngoại lệ màn quầy còn khớp chỗ có thật (không ngoại lệ chết)', kqGD.ngoaiLeChet.length === 0, kqGD.ngoaiLeChet.map((n) => n[0]).join(' | '));
  const tzGoc = process.env.TZ;
  // Điện thoại: múi 0, múi ÂM, múi DƯƠNG và chính múi của quầy (+7) — lỗi "dựng ngày theo giờ máy rồi toISOString" chỉ lộ ở múi dương.
  const MUI_DT = ['UTC', 'America/Los_Angeles', 'Asia/Ho_Chi_Minh', 'Asia/Tokyo'];
  const g2 = [], g2Mong = [];
  for (const tz of MUI_DT) {
    process.env.TZ = tz;
    for (const [luc, loai, mong] of [
      ['2026-12-01T03:00:00', 'thisMonth', '2026-12-01..2026-12-01'], ['2026-12-01T03:00:00', 'lastMonth', '2026-11-01..2026-11-30'],
      ['2026-12-01T03:00:00', 'yesterday', '2026-11-30..2026-11-30'], ['2026-12-01T03:00:00', '7days', '2026-11-25..2026-12-01'],
      ['2026-12-01T03:00:00', 'today', '2026-12-01..2026-12-01'],
      ['2027-01-01T06:59:59', 'lastMonth', '2026-12-01..2026-12-31'], ['2027-01-01T06:59:59', 'yesterday', '2026-12-31..2026-12-31'],
      ['2027-03-31T23:30:00', 'lastMonth', '2027-02-01..2027-02-28'], ['2027-03-31T23:30:00', 'thisMonth', '2027-03-01..2027-03-31'],
      ['2028-03-01T00:00:00', 'lastMonth', '2028-02-01..2028-02-29']]) {
      datVN(luc);
      let r; try { r = NV.khoangNgay(loai).join('..'); } catch (e) { r = 'lỗi ' + e.message; }
      g2.push(`${tz} ${luc} ${loai}=${r}`); g2Mong.push(`${tz} ${luc} ${loai}=${mong}`);
    }
  }
  const g2Sai = g2.filter((x, i) => x !== g2Mong[i]);
  k('G2 nút lọc Lịch sử đơn (khoangNgay) theo giờ VN — điện thoại TZ=UTC / Los Angeles / Hồ Chí Minh / Tokyo: 01.12 03:00 VN tháng này = 01.12, tháng trước = 01–30.11; 01.01 06:59:59; 31.03 23:30; năm nhuận',
    g2Sai.length === 0, g2Sai.slice(0, 3).join(' | '));
  const g3 = [];
  chuoiVaoDate.length = 0;
  for (const tz of MUI_DT) {
    process.env.TZ = tz;
    const t = (f, ...a) => { try { return f(...a); } catch (e) { return 'lỗi ' + e.message; } };
    g3.push(t(() => [NV.docGioVN('2026-11-02T12:00:00'), NV.docGioVN('2026-11-02 12:00:00'), NV.docGioVN('2026-11-02T05:00:00Z'), NV.docGioVN('2026-11-02T05:00:00.000Z')]
      .every((d) => d.getTime() === DateGoc.UTC(2026, 10, 2, 5)) && NV.docGioVN('2026-11-02').getTime() === DateGoc.UTC(2026, 10, 1, 17)));
    g3.push(t(NV.hienNgay, '2026-12-31'), t(NV.hienNgay, '2026-12-31T00:30:00'), t(NV.hienGio, '2026-11-02T00:30:00', { hour: '2-digit', minute: '2-digit' }),
      t(NV.hienNgayGio, '2026-11-02T23:30:00'), t(NV.hienNgayGio, ''), t(NV.hienNgay, null));
  }
  process.env.TZ = tzGoc;
  const g3Mong = [true, '31/12/2026', '31/12/2026', '00:30', '23:30:00 2/11/2026', '', ''];
  const chuoiLa = chuoiVaoDate.filter((x) => !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(Z|[+-]\d\d:\d\d)$/.test(x));
  k('G3 docGioVN (chuỗi máy chủ không hậu tố = giờ VN; dấu cách cũ; đuôi Z; ngày thuần = 00:00 VN) + hienNgay / hienGio / hienNgayGio in giờ VN ở điện thoại UTC / Los Angeles / Hồ Chí Minh / Tokyo; rỗng → ""',
    JSON.stringify(g3) === JSON.stringify(MUI_DT.flatMap(() => g3Mong)), JSON.stringify(g3));
  k('G3b chuỗi ngayVN.js đưa vào new Date đúng dạng ISO có T + múi (Safari / iPhone không đọc dạng dấu cách) — Node đọc lỏng nên phải soi chuỗi',
    chuoiVaoDate.length > 0 && chuoiLa.length === 0, `${chuoiVaoDate.length} chuỗi · lạ: ${chuoiLa.slice(0, 3).join(' | ')}`);

  // ═══════════════ kho tạm + route thật ═══════════════
  datVN('2026-11-02T12:00:00');
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();
  const { getNow } = require(path.join(MAY_CHU, 'utils', 'helpers.js'));
  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const sxOk = async () => ({ ok: true });
  let sxBat = false, khachSX = [];   // SX giả: tắt mặc định; A2i / A2j bật để chạy doSoNo / bộ nhớ đệm khách SX
  const sxGoi = async (duong) => (String(duong).includes('/customers/export') ? khachSX : { ok: true });
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => sxBat, checkStock: async () => ({ sufficient: true }), outStockFIFO: sxOk, inStockReturn: sxOk, callSxApi: sxGoi };
  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'settings', 'packages', 'damages', 'products', 'product-groups', 'customers-v2', 'sync', 'signup-codes', 'backup', 'discount-codes']) {
    app.use('/api/pos/' + (r === 'customers-v2' ? 'customers' : r), require(path.join(MAY_CHU, 'routes', r + '.js')));
  }
  app.use('/api/kh', require(path.join(MAY_CHU, 'routes', 'kh')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}`;
  noiLai();
  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tk = jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '3650d' });
  const goi = async (method, url, body, token = tk) => {
    imLang();
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = 'Bearer ' + token;
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined, headers });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const mo = (r) => `HTTP ${r.status}${r.error ? ' · ' + r.error : ''}`;
  const motDong = (sql, a = []) => db.queryOne(sql, a);
  const datCai = (khoa, v) => db.run('INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [khoa, v, getNow()]);
  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 2');
  await db.run('UPDATE pos_products SET price = 25000 WHERE id IN (?, ?)', [sp[0].id, sp[1].id]);
  const mon = { product_id: sp[0].id, sx_product_type: sp[0].sx_product_type, sx_product_id: sp[0].sx_product_id, quantity: 1 };
  const taoDon = async (body) => { const r = await goi('POST', '/api/pos/orders', { customer_name: 'Khách GV1', items: [mon], payment_method: 'cash', cash_amount: 25000, ...body }); return r.order?.id; };
  const gan = (v, moc) => typeof v === 'string' && DANG_T.test(v) && Math.abs(DateGoc.parse(v + 'Z') - DateGoc.parse(moc + 'Z')) <= 2000;

  muc('A2. Route thật ghi giờ dạng T, đúng giờ VN (giờ giả 02.11.2026 12:00 VN)');
  const MOC = '2026-11-02T12:00:00';
  datVN(MOC);
  const sDat = await goi('PUT', '/api/pos/settings', { settings: { gv1_thu: 'x' } });
  const kSet = await motDong("SELECT updated_at AS t FROM pos_settings WHERE key = 'gv1_thu'");
  k('A2a lưu cài đặt → pos_settings.updated_at', sDat.status === 200 && gan(kSet?.t, MOC), `${mo(sDat)} · ${kSet?.t}`);
  const gTao = await goi('POST', '/api/pos/packages', { code: 'GV1GOI', name: 'Gói GV1', price: 100000, unit: 'ly', total_qty: 5 });
  const kGoi = await motDong("SELECT created_at AS a, updated_at AS b FROM pos_packages WHERE code = 'GV1GOI'");
  k('A2b tạo gói → pos_packages.created_at/updated_at', gTao.status === 200 && gan(kGoi?.a, MOC) && gan(kGoi?.b, MOC), `${mo(gTao)} · ${JSON.stringify(kGoi)}`);
  const donA = await taoDon({});
  const maA = (await motDong('SELECT code FROM pos_orders WHERE id = ?', [donA]))?.code;
  const inLog = await goi('POST', '/api/pos/settings/invoice/log', { order_id: donA, order_code: maA, invoice_number: '00001/2026' });
  const kIn = await motDong('SELECT id, printed_at AS t FROM pos_invoice_logs WHERE order_id = ?', [donA]);
  const xoaIn = kIn ? await goi('DELETE', `/api/pos/settings/invoice/logs/${kIn.id}`) : { status: 0 };
  const kXoa = kIn ? await motDong('SELECT deleted_at AS t FROM pos_invoice_logs WHERE id = ?', [kIn.id]) : null;
  k('A2c ghi + xoá nhật ký in → printed_at / deleted_at', inLog.status === 200 && xoaIn.status === 200 && gan(kIn?.t, MOC) && gan(kXoa?.t, MOC), `${kIn?.t} / ${kXoa?.t}`);
  const suCo = await goi('POST', '/api/pos/damages', { order_id: donA, product_code: sp[0].code, quantity: 1, reason: 'damaged', action: 'remake' });
  const kSc = await motDong('SELECT created_at AS t FROM pos_damage_logs WHERE order_id = ?', [donA]);
  k('A2d ghi sự cố → pos_damage_logs.created_at', gan(kSc?.t, MOC), `${mo(suCo)} · ${kSc?.t}`);
  const gia = await goi('PUT', '/api/pos/products/price', { sx_product_type: 'juice', sx_product_id: 9901, price: 10000 });
  const gia2 = await goi('PUT', '/api/pos/products/price', { sx_product_type: 'juice', sx_product_id: 9901, price: 12000 });
  const kSp = await motDong("SELECT created_at AS a, updated_at AS b FROM pos_products WHERE sx_product_type = 'juice' AND sx_product_id = 9901");
  k('A2e đặt giá món mới rồi đổi giá → pos_products.created_at/updated_at', gia.status === 200 && gia2.status === 200 && gan(kSp?.a, MOC) && gan(kSp?.b, MOC), JSON.stringify(kSp));
  const nhom = await goi('PUT', '/api/pos/product-groups/khach_moi/members', { members: [{ sx_product_type: sp[1].sx_product_type, sx_product_id: sp[1].sx_product_id }] });
  const kNhom = await motDong('SELECT created_at AS t FROM pos_product_group_members ORDER BY id DESC LIMIT 1');
  k('A2f thêm món vào nhóm → pos_product_group_members.created_at', nhom.status === 200 && gan(kNhom?.t, MOC), `${mo(nhom)} · ${kNhom?.t}`);
  const dc = await goi('PUT', '/api/pos/customers/0938111222/address', { address: '1 Lê Lợi' });
  const kDc = await motDong("SELECT created_at AS a, updated_at AS b FROM pos_customers WHERE phone = '0938111222'");
  const dc2 = await goi('PUT', '/api/pos/customers/0938111222/address', { address: '2 Lê Lợi' });
  const kDc2 = await motDong("SELECT updated_at AS b FROM pos_customers WHERE phone = '0938111222'");
  k('A2g ghi địa chỉ khách mới rồi sửa → pos_customers.created_at/updated_at', dc.status === 200 && dc2.status === 200 && gan(kDc?.a, MOC) && gan(kDc2?.b, MOC), `${mo(dc)} · ${JSON.stringify(kDc)} · ${kDc2?.b}`);
  const kSeed = await motDong("SELECT (SELECT created_at FROM pos_users WHERE role = 'owner' LIMIT 1) AS u, (SELECT created_at FROM pos_permissions LIMIT 1) AS p, (SELECT created_at FROM pos_membership_tiers LIMIT 1) AS t, (SELECT updated_at FROM pos_membership_tiers LIMIT 1) AS t2, (SELECT created_at FROM pos_product_groups LIMIT 1) AS g");
  k('A2h dữ liệu gieo lúc khởi tạo kho (chủ, quyền, hạng, nhóm) ghi dạng T', Object.values(kSeed || {}).every((v) => DANG_T.test(String(v))), JSON.stringify(kSeed));

  await db.run("INSERT INTO pos_stock_pending (order_code, sx_product_type, sx_product_id, quantity, direction, status, van_tay, created_at) VALUES ('GV1DS', 'juice', 1, 1, 'out', 'pending', 'POS:GV1DS:1', ?)", [MOC]);
  const { doSoNo } = require(path.join(MAY_CHU, 'utils', 'doSoNo.js'));
  sxBat = true; imLang();
  try { await doSoNo(); } finally { noiLai(); sxBat = false; }
  const kDs = await motDong("SELECT status, resolved_at AS t FROM pos_stock_pending WHERE order_code = 'GV1DS'");
  k('A2i đẩy sổ nợ tồn sang SX (doSoNo, SX giả) → pos_stock_pending.resolved_at', kDs?.status === 'resolved' && gan(kDs?.t, MOC), JSON.stringify(kDs));
  khachSX = [{ phone: '0938000060', name: 'Khách SX mới' }, { phone: '0938111222', name: 'Khách SX đã có' }];
  await goi('GET', '/api/pos/customers/search/0938');
  let kSx = null;
  for (let i = 0; i < 50 && !(kSx?.a); i++) { kSx = await motDong("SELECT created_at AS a, updated_at AS b FROM pos_customers WHERE phone = '0938000060'"); if (!kSx?.a) await new Promise((r) => setTimeout(r, 20)); }
  const kSx2 = await motDong("SELECT updated_at AS b FROM pos_customers WHERE phone = '0938111222'");
  khachSX = [];
  k('A2j bộ nhớ đệm khách từ SX (cacheCustomersToLocal): khách mới created_at/updated_at, khách đã có updated_at', gan(kSx?.a, MOC) && gan(kSx?.b, MOC) && gan(kSx2?.b, MOC),
    `${JSON.stringify(kSx)} · ${kSx2?.b}`);

  muc('C. So giờ quanh 00:00 và 07:00 giờ VN');
  // HANG-1: mua thẻ = chọn GÓI của hạng bán (máy chủ tra giá gói) — dựng gói 3 tháng cho hạng thấp nhất
  const GIA_GOI_3 = 300000;
  const hang = await motDong('SELECT id FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order LIMIT 1');
  await db.run("UPDATE pos_membership_tiers SET cach_co = 'ban', goi = ? WHERE id = ?", [JSON.stringify([{ so_thang: 3, gia: GIA_GOI_3, bat: true }]), hang.id]);
  const muaThe = async (sdt) => { const id = await taoDon({ customer_phone: sdt, items: [], membership_buy: { tier_id: hang.id, so_thang: 3 }, cash_amount: GIA_GOI_3 });
    return (await motDong('SELECT expires_at AS t FROM pos_membership_purchases WHERE order_id = ?', [id]))?.t; };
  datVN('2026-11-02T00:00:00'); const c5a = await muaThe('0938000001');
  datVN('2026-11-02T07:00:00'); const c5b = await muaThe('0938000002');
  k('C5a mua thẻ 00:00 và 07:00 VN, hạn 3 tháng → expires_at "2027-02-02T00:00:00" / "2027-02-02T07:00:00"', c5a === '2027-02-02T00:00:00' && c5b === '2027-02-02T07:00:00', `${c5a} / ${c5b}`);
  process.env.TZ = 'Asia/Ho_Chi_Minh';
  datVN('2026-01-30T20:00:00'); const c5c = await muaThe('0938000003');
  process.env.TZ = 'UTC';
  k('C5b máy chạy TZ=Asia/Ho_Chi_Minh: mua 30.01 20:00 VN (giờ máy đã sang 31.01) → hạn "2026-04-30T20:00:00" (không lệch 7 giờ, không chốt nhầm cuối tháng)', c5c === '2026-04-30T20:00:00', String(c5c));
  const { getMembershipStatus } = require(path.join(MAY_CHU, 'utils', 'membershipStatus.js'));
  const hangKhach = (sdt) => getMembershipStatus(db.query, db.queryOne, getNow, sdt);
  datVN('2027-02-02T06:59:59'); const c5d = await hangKhach('0938000002');
  datVN('2027-02-02T07:00:00'); const c5e = await hangKhach('0938000002');
  k('C5c thẻ hạn 07:00: 06:59:59 còn hạng, 07:00:00 hết', c5d?.status !== 'expired' && c5d?.tier_id && c5e?.status === 'expired', `${JSON.stringify(c5d)} / ${c5e?.status}`);

  const { layDiemKhach } = require(path.join(MAY_CHU, 'utils', 'diemKhach.js'));
  await db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, expires_at, reason, created_by, created_at) VALUES ('0938000009', 'earn', 10, '2027-01-01T00:00:00', 'thử', 'thu', '2026-10-01T10:00:00')");
  const diem = async (moc) => { datVN(moc); return Number((await layDiemKhach('0938000009')).points ?? (await layDiemKhach('0938000009')).balance ?? -1); };
  const c1 = [await diem('2026-12-31T06:59:59'), await diem('2026-12-31T07:00:00'), await diem('2026-12-31T23:59:59'), await diem('2027-01-01T00:00:00')];
  k('C1 điểm hạn 01.01.2027 00:00: 31.12 06:59:59 / 07:00 / 23:59:59 còn 10, 01.01 00:00:00 hết (hồi quy)', c1.join(',') === '10,10,10,0', c1.join(','));

  const doiSoat = require(path.join(MAY_CHU, 'utils', 'doiSoat.js'));
  const denLe = async (moc) => { datVN(moc); const d = await taoDon({});   // route thật (damages.js) — đền tiền đơn KHÔNG SĐT
    await goi('POST', '/api/pos/damages', { order_id: d, product_code: sp[0].code, quantity: 1, reason: 'damaged', action: 'refund', refund_amount: 10000 });
    return (await motDong('SELECT code FROM pos_orders WHERE id = ?', [d])).code; };
  const maDen = [await denLe('2027-01-07T00:30:00'), await denLe('2027-01-07T06:59:00'), await denLe('2027-01-07T07:00:00'), await denLe('2027-01-07T17:30:00')];
  imLang();
  const n7 = await doiSoat.chayDoiSoat({ kieu: 'ngay', ngay: '2027-01-07' }).catch((e) => ({ loi: e.message }));
  const n6 = await doiSoat.chayDoiSoat({ kieu: 'ngay', ngay: '2027-01-06' }).catch((e) => ({ loi: e.message }));
  noiLai();
  const coDen = (r, ma) => (r.can_xem || []).some((l) => l.bat_bien === 'DEN' && l.mo_ta.includes(ma));
  k('C6 đền tiền khách lẻ (route thật) lúc 00:30 / 06:59 / 07:00 / 17:30 VN ngày 07.01 → đối soát ngày 07.01, không ra 06.01 (17:30: bù +7 hai lần sẽ ra 08.01)',
    maDen.every((m) => coDen(n7, m) && !coDen(n6, m)), `07.01: ${maDen.map((m) => coDen(n7, m)).join(',')} · 06.01: ${maDen.map((m) => coDen(n6, m)).join(',')} ${n7.loi || ''}`);

  datVN('2027-03-01T00:10:00'); await taoDon({});
  const soNgay = async (ngay) => Number((await motDong("SELECT COUNT(*) AS n FROM pos_orders WHERE substr(created_at, 1, 10) = ?", [ngay])).n);
  const homNay = async (moc) => { datVN(moc); return Number((await goi('GET', '/api/pos/orders')).todayStats?.order_count); };
  const c7a = [await homNay('2027-03-01T06:59:00'), await homNay('2027-03-01T07:00:00'), await homNay('2027-02-28T23:59:59')];
  const c7aMong = [await soNgay('2027-03-01'), await soNgay('2027-03-01'), await soNgay('2027-02-28')];
  k('C7a thống kê "hôm nay" của Lịch sử đơn: 01.03 06:59 và 07:00 VN đếm đơn lúc 00:10 VN; 28.02 23:59:59 không đếm', c7aMong[0] > 0 && c7a.join(',') === c7aMong.join(','),
    `${c7a.join(',')} / ${c7aMong.join(',')}`);
  datVN('2026-12-31T23:59:59');
  const so0 = await goi('GET', '/api/pos/settings/invoice/next-number');
  const sc0 = await goi('GET', '/api/pos/damages/stats');
  datVN('2027-01-01T06:59:00');
  const so1 = await goi('GET', '/api/pos/settings/invoice/next-number');
  const sc1 = await goi('GET', '/api/pos/damages/stats');
  k('C7b số hoá đơn / thống kê sự cố: 31.12.2026 23:59:59 → 2026 / 2026-12; 01.01.2027 06:59 VN → 2027 / 2027-01', so0.data?.year === 2026 && sc0.month === '2026-12' && so1.data?.year === 2027 && sc1.month === '2027-01',
    `${so1.data?.year} · ${JSON.stringify(sc1).slice(0, 120)}`);

  await db.run("INSERT INTO pos_customers (phone, name, sync_status, created_at) VALUES ('0938000011', 'K 24h+1s', 'new', '2027-04-09T07:00:00'), ('0938000012', 'K 24h-1s', 'new', '2027-04-09T07:00:02')");
  await db.run("INSERT INTO pos_customers (phone, name, sync_status, created_at, exported_at) VALUES ('0938000013', 'X 48h+1s', 'exported', '2027-04-01T07:00:00', '2027-04-08T07:00:00'), ('0938000014', 'X 48h-1s', 'exported', '2027-04-01T07:00:00', '2027-04-08T07:00:02')");
  datVN('2027-04-10T07:00:01');
  await db.run("UPDATE pos_customers SET sync_status = 'synced' WHERE sync_status IN ('new', 'exported') AND phone NOT IN ('0938000011', '0938000012', '0938000013', '0938000014')");
  const tt = await goi('GET', '/api/pos/sync/status');
  const old = (tt.warnings || []).find((w) => w.type === 'old_new'), oldX = (tt.warnings || []).find((w) => w.type !== 'old_new');
  k('C11 10.04 07:00:01 VN: khách mới tạo 24 giờ + 1 giây có cảnh báo, 24 giờ − 1 giây không; đã xuất 48 giờ ± 1 giây cũng vậy (đếm = 1 mỗi loại)',
    old?.count === 1 && oldX?.count === 1, JSON.stringify(tt.warnings));

  const { layMaKhachMoi } = require(path.join(MAY_CHU, 'utils', 'diemKhach.js'));
  await db.run("INSERT INTO pos_discount_codes (code, discount_type, discount_value, valid_to, is_active, created_at) VALUES ('GV1C2', 'fixed', 5000, '2027-01-01', 1, '2026-12-01T10:00:00')");
  await db.run("INSERT INTO pos_signup_codes (code, issued_at, claimed_at, claimed_phone) VALUES ('GV1C2', '2026-12-01T10:00:00', '2026-12-01T11:00:00', '0938000040')");
  const conMa = async (moc) => { datVN(moc); return (await layMaKhachMoi('0938000040')).some((d) => d.code === 'GV1C2'); };
  const c2 = [await conMa('2027-01-01T06:59:59'), await conMa('2027-01-01T23:59:59'), await conMa('2027-01-02T00:00:00'), await conMa('2027-01-02T06:59:59')];
  await db.run("INSERT INTO pos_discount_codes (code, discount_type, discount_value, valid_from, is_active, created_at) VALUES ('GV1G4', 'fixed', 1000, '2027-01-02', 1, '2026-12-01T10:00:00')");
  const dsMa = await goi('GET', '/api/pos/discount-codes');
  const dongMa = Object.keys(dsMa).filter((x) => /^\d+$/.test(x)).map((x) => dsMa[x]);   // goi trải mảng JSON thành { 0: …, 1: …, status }
  const maC2 = dongMa.find((x) => x.code === 'GV1C2'), maG4 = dongMa.find((x) => x.code === 'GV1G4');
  const srcMa = doc(path.join(GOC, 'client', 'src', 'pages', 'DiscountCodes.jsx'));
  let hamMa = null;
  try { hamMa = new Function('ngayVN', [...srcMa.matchAll(/^const (hetHan|chuaBatDau) = .*$/gm)].map((m) => m[0]).join('\n') + '\nreturn { hetHan, chuaBatDau };')(NV.ngayVN); } catch { /* chưa có hàm */ }
  const g4 = [];
  for (const moc of ['2027-01-01T23:59:59', '2027-01-02T00:00:01', '2027-01-02T06:59:59']) { datVN(moc); g4.push(hamMa && maC2 && maG4 ? `${hamMa.hetHan(maC2)}/${hamMa.chuaBatDau(maG4)}` : 'thiếu'); }
  k('G4 màn Mã giảm giá (hàm của DiscountCodes.jsx trên dòng THẬT của GET /discount-codes): hạn 01.01 → 23:59:59 còn, 02.01 00:00:01 và 06:59:59 (UTC còn 01.01) hết; bắt đầu 02.01 → 23:59:59 chưa, 00:00:01 đã',
    g4.join(',') === 'false/true,true/false,true/false', `${g4.join(',')} · GET HTTP ${dsMa.status} · ${dongMa.length} mã · hàm ${hamMa ? 'có' : 'không'}`);
  k('C2 mã giảm hạn 01.01.2027: 01.01 06:59:59 / 23:59:59 còn; 02.01 00:00:00 / 06:59:59 (UTC còn 01.01) hết (hồi quy)', c2.join(',') === 'true,true,false,false', c2.join(','));

  await datCai('nhandiem_enabled', '1'); await datCai('nhandiem_han_gio', '24');
  for (const [ma, luc] of [['GV1C3A', '2027-01-05T07:00:00'], ['GV1C3B', '2027-01-05T07:00:00'], ['GV1C3C', '2027-01-05T00:00:00'], ['GV1C3D', '2027-01-05T00:00:00']]) {
    await db.run('INSERT INTO pos_signup_codes (code, order_id, issued_at) VALUES (?, NULL, ?)', [ma, luc]);
  }
  const nhanDiem = async (ma, moc) => { datVN(moc); return (await goi('POST', '/api/pos/signup-codes/nhan-diem', { code: ma, phone: '0938000041' })).code; };
  const c3a = await nhanDiem('GV1C3A', '2027-01-06T06:59:59'), c3b = await nhanDiem('GV1C3B', '2027-01-06T07:00:01');
  const c3c = await nhanDiem('GV1C3C', '2027-01-05T23:59:59'), c3d = await nhanDiem('GV1C3D', '2027-01-06T00:00:01');
  await datCai('nhandiem_enabled', '0');
  k('C3 mã bill hạn 24 giờ: in 05.01 07:00 → 06.01 06:59:59 chưa hết, 07:00:01 MA_HET_HAN; in 05.01 00:00 → 23:59:59 chưa hết, 06.01 00:00:01 MA_HET_HAN (hồi quy)',
    c3a !== 'MA_HET_HAN' && c3b === 'MA_HET_HAN' && c3c !== 'MA_HET_HAN' && c3d === 'MA_HET_HAN', `${c3a} / ${c3b} / ${c3c} / ${c3d}`);

  const { gomTheoKhach } = require(path.join(MAY_CHU, 'utils', 'goiKhach.js'));
  const ngayChua = (lan, moc) => { datVN(moc); return gomTheoKhach([{ customer_phone: '0938000042', status: 'active', total_qty: 5, delivered_qty: 1, last_delivery_at: lan }])[0].ngay_chua_lay; };
  const c4 = [ngayChua('2027-01-05T23:59:59', '2027-01-06T00:00:00'), ngayChua('2027-01-05T23:59:59', '2027-01-06T23:59:59'),
    ngayChua('2027-01-05T06:59:59', '2027-01-05T07:00:00'), ngayChua('2027-01-05T06:59:59', '2027-01-06T06:59:59')];
  k('C4 gói: lần lấy cuối 23:59:59 / 06:59:59 → 1 giây sau 0 ngày, đủ 24 giờ 1 ngày (hồi quy)', c4.join(',') === '0,1,0,1', c4.join(','));

  const giuCho = require(path.join(MAY_CHU, 'utils', 'giuCho.js'));
  const taoPhienLuc = async (moc) => { datVN(moc); imLang(); const r = await giuCho.taoPhien({ cach: 'ck_tay', don: { items: [mon] } }, 'thu').catch((e) => ({ loi: e.message })); noiLai();
    return { r, p: await motDong('SELECT * FROM pos_phien_thanh_toan ORDER BY id DESC LIMIT 1') }; };
  const tt10 = (p, moc) => { datVN(moc); return giuCho.tomPhien(p).trang_thai; };
  const q1 = await taoPhienLuc('2027-01-01T23:55:00'), q2 = await taoPhienLuc('2027-01-02T06:55:00');
  const c10 = [q1.p?.het_han, tt10(q1.p || {}, '2027-01-02T00:04:59'), tt10(q1.p || {}, '2027-01-02T00:05:00'), q2.p?.het_han, tt10(q2.p || {}, '2027-01-02T07:04:59'), tt10(q2.p || {}, '2027-01-02T07:05:00')];
  k('C10 phiên QR tạo 23:55 / 06:55 VN hết 00:05 / 07:05 (dạng T): 1 giây trước còn chờ, đúng mốc hết hạn (hồi quy)',
    c10.join(',') === '2027-01-02T00:05:00,cho,het_han,2027-01-02T07:05:00,cho,het_han', c10.join(',') + (q1.r?.loi ? ' · ' + q1.r.loi : '') + (q1.r?.status >= 400 ? ' · ' + JSON.stringify(q1.r.body) : ''));

  const { readFlashState } = require(path.join(MAY_CHU, 'utils', 'flashState.js'));
  await datCai('flash_enabled', 'true'); await datCai('flash_percent', '10'); await datCai('flash_product_keys', JSON.stringify([`${sp[0].sx_product_type}_${sp[0].sx_product_id}`]));
  const fl = async (bd, kt, moc) => { await datCai('flash_start', bd); await datCai('flash_end', kt); datVN(moc); return (await readFlashState(db.query, getNow)).is_flash_now; };
  const c8 = [await fl('22:00', '02:00', '2027-01-02T00:00:00'), await fl('07:00', '09:00', '2027-01-02T06:59:59'), await fl('07:00', '09:00', '2027-01-02T07:00:00')];
  await datCai('flash_enabled', 'false');
  k('C8 giờ vàng 22:00–02:00 lúc 00:00 VN đang chạy; 07:00–09:00: 06:59:59 chưa, 07:00:00 chạy (hồi quy)', c8.join(',') === 'true,false,true', c8.join(','));

  const lich = Object.fromEntries([2, 3, 4, 5, 6, 7, 8].map((t) => [t, { mo: '07:00', dong: '23:00' }]));
  await datCai('gio_hd_lich', JSON.stringify(lich));
  const hd = async (moc) => { datVN(moc); return (await goi('GET', '/api/kh/gio-hoat-dong', null, null)).dang_mo; };
  const c9 = [await hd('2027-01-02T06:59:59'), await hd('2027-01-02T07:00:00'), await hd('2027-01-02T22:59:59'), await hd('2027-01-02T23:00:00')];
  await datCai('gio_hd_lich', JSON.stringify(Object.fromEntries([2, 3, 4, 5, 6, 7, 8].map((t) => [t, { mo: '00:00', dong: '06:00' }]))));
  c9.push(await hd('2027-01-01T23:59:59'), await hd('2027-01-02T00:00:00'), await hd('2027-01-02T05:59:59'), await hd('2027-01-02T06:00:00'));
  await datCai('gio_hd_lich', '');
  k('C9 giờ hoạt động 07:00–23:00: 06:59:59 đóng, 07:00 mở, 22:59:59 mở, 23:00 đóng; 00:00–06:00: 23:59:59 hôm trước đóng, 00:00 mở, 05:59:59 mở, 06:00 đóng (hồi quy)',
    c9.join(',') === 'false,true,true,false,false,true,true,false', c9.join(','));

  muc('B. Bước nâng cấp 012 — dữ liệu cũ');
  let buoc = null, loiBuoc = '';
  try { buoc = require(path.join(MAY_CHU, 'nang_cap', '012_gio_viet_nam.js')); } catch (e) { loiBuoc = e.message; }
  k('B0 có server/nang_cap/012_gio_viet_nam.js xuất chay', typeof buoc?.chay === 'function', loiBuoc);
  const GIEO = [   // [bảng, cột, id dòng (tạo mới), giá trị cũ, giá trị phải ra]
    ['pos_damage_logs', 'created_at', '2027-01-06 17:30:00', '2027-01-07T00:30:00'],            // loại 2: UTC dấu cách → +7
    ['pos_balance_transactions', 'created_at', '2026-03-01 18:00:00', '2026-03-02T01:00:00'],   // loại 2 (Q1 chủ quán: sổ ví đổi GIỜ)
    ['pos_invoice_logs', 'printed_at', '2026-05-05 08:00:00', '2026-05-05T08:00:00'],          // loại 3: VN dấu cách → chỉ T
    ['pos_membership_purchases', 'expires_at', '2027-02-02 10:00:00', '2027-02-02T10:00:00'],   // loại 3 (Q2)
    ['pos_packages', 'created_at', '2026-06-01T17:00:00.123Z', '2026-06-02T00:00:00'],          // loại 1: đuôi Z → +7
    ['pos_orders', 'cancelled_at', '2026-01-05T03:00:00.000Z', '2026-01-05T10:00:00'],          // loại 1 ở cột getNow cũ
    ['pos_settings', 'updated_at', '2026-07-01 10:00:00', '2027-05-01T12:00:00'],               // cài đặt chưa dạng T → giờ VN lúc chạy (chủ quán 03.11)
    ['pos_orders', 'created_at', '2026-11-01T09:00:00', '2026-11-01T09:00:00'],                 // K5: đã đúng giờ VN → không đổi
    ['pos_discount_codes', 'valid_from', '2026-11-01', '2026-11-01'],                           // ngày thuần → không đụng
  ];
  const idGieo = [];
  const donB = await taoDon({});   // đơn thật rồi đặt giờ cũ: created_at đã đúng giờ VN (K5), cancelled_at đuôi Z (getNow 03–07.01)
  await db.run("UPDATE pos_orders SET created_at = '2026-11-01T09:00:00' WHERE id = ?", [donB]);
  imLang();
  for (const [bang, cot, cu] of GIEO) {
    let id = null;
    try {
      if (bang === 'pos_orders') id = donB;
      else if (bang === 'pos_settings') { await db.run("INSERT INTO pos_settings (key, value, updated_at) VALUES ('gv1_lan', '1', ?)", [cu]); id = 'gv1_lan'; }
      else if (bang === 'pos_damage_logs') id = Number((await db.run("INSERT INTO pos_damage_logs (order_id, order_code, product_code, product_name, quantity, reason, action, refund_amount, processed_by_name, created_at) VALUES (1, 'X', 'X', 'X', 1, 'damaged', 'remake', 0, 'thu', ?)", [cu])).lastInsertRowid);
      else if (bang === 'pos_balance_transactions') {   // sổ ví có ví khớp số dư (dòng hợp lệ — K5b chỉ đo GIỜ đổi, không đo lệch ví)
        await db.run("INSERT INTO pos_wallets (phone, balance, total_topup, created_at, updated_at) VALUES ('0938000020', 1000, 1000, '2026-03-02T01:00:00', '2026-03-02T01:00:00')");
        id = Number((await db.run("INSERT INTO pos_balance_transactions (customer_phone, type, amount, balance_before, balance_after, created_by, created_at) VALUES ('0938000020', 'topup', 1000, 0, 1000, 'thu', ?)", [cu])).lastInsertRowid);
      }
      else if (bang === 'pos_invoice_logs') id = Number((await db.run("INSERT INTO pos_invoice_logs (order_id, order_code, invoice_number, printed_at) VALUES (1, 'X', '9/2026', ?)", [cu])).lastInsertRowid);
      else if (bang === 'pos_membership_purchases') id = Number((await db.run("INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, purchased_at, expires_at, created_by) VALUES ('0938000021', 1, 'Vàng', 1, '2026-11-02T10:00:00', ?, 'thu')", [cu])).lastInsertRowid);
      else if (bang === 'pos_packages') id = Number((await db.run("INSERT INTO pos_packages (code, name, price, unit, total_qty, created_at, updated_at) VALUES ('GV1B', 'B', 1, 'ly', 1, ?, '2026-11-01T09:00:00')", [cu])).lastInsertRowid);
      else if (bang === 'pos_discount_codes') id = Number((await db.run("INSERT INTO pos_discount_codes (code, discount_type, discount_value, valid_from, created_at) VALUES ('GV1B', 'fixed', 1, ?, '2026-11-01T09:00:00')", [cu])).lastInsertRowid);
      if (bang === 'pos_orders' && cot === 'cancelled_at') await db.run('UPDATE pos_orders SET cancelled_at = ? WHERE id = ?', [cu, id]);
    } catch (e) { loiGoc(`  (gieo ${bang} hỏng: ${e.message})`); }
    idGieo.push(id);
  }
  // B1c: mỗi mục phân loại một dòng gieo (dòng ĐẦU mỗi bảng), cùng giá trị cũ / mới với B1 — chép ĐỘC LẬP từ ke_hoach.md mục B, không đọc
  // từ code (xoá / đổi loại một mục ở utils/chuanHoaGio.js → đỏ). KHONG_DUNG: cột chỉ ghi getNow — dấu cách ở đó KHÔNG được đổi (K5).
  const PHAN_LOAI = [['pos_users', 'created_at', 'utc'], ['pos_permissions', 'created_at', 'utc'], ['pos_customers', 'created_at', 'utc'],
    ['pos_customers', 'updated_at', 'utc'], ['pos_products', 'created_at', 'utc'], ['pos_products', 'updated_at', 'utc'], ['pos_products', 'ton_luc', 'vn'],
    ['pos_orders', 'created_at', 'utc'], ['pos_wallets', 'created_at', 'utc'], ['pos_wallets', 'updated_at', 'utc'], ['pos_balance_transactions', 'created_at', 'utc'],
    ['pos_damage_logs', 'created_at', 'utc'], ['pos_stock_pending', 'resolved_at', 'utc'], ['pos_export_logs', 'created_at', 'utc'],
    ['pos_membership_tiers', 'created_at', 'utc'], ['pos_membership_tiers', 'updated_at', 'vn'], ['pos_product_groups', 'created_at', 'utc'],
    ['pos_product_group_members', 'created_at', 'utc'], ['pos_invoice_logs', 'printed_at', 'vn'], ['pos_invoice_logs', 'deleted_at', 'vn'],
    ['pos_membership_purchases', 'expires_at', 'vn'], ['pos_discount_codes', 'valid_to', 'vn'], ['pos_settings', 'updated_at', 'lan'],
    ['pos_point_transactions', 'created_at', 'khong'], ['pos_orders', 'cancelled_at', 'khong'], ['pos_signup_codes', 'issued_at', 'khong']];
  const CU = { utc: '2026-03-01 18:00:00', vn: '2026-05-05 08:00:00', lan: '2026-07-01 10:00:00', khong: '2026-08-08 08:00:00' };
  const MOI = { utc: '2026-03-02T01:00:00', vn: '2026-05-05T08:00:00', lan: '2027-05-01T12:00:00', khong: '2026-08-08 08:00:00' };
  await db.run("INSERT INTO pos_stock_pending (order_code, sx_product_type, sx_product_id, quantity, status) VALUES ('GV1SP', 'juice', 1, 1, 'resolved')");
  await db.run("INSERT INTO pos_export_logs (exported_at, exported_by, registration_ids, customer_count) VALUES ('2026-11-01T09:00:00', 'thu', '[]', 0)");
  const dongPL = [];
  for (const [b, c, l] of PHAN_LOAI) {
    const r = await motDong(`SELECT rowid AS r FROM ${b} ORDER BY rowid LIMIT 1`);
    if (r) await db.run(`UPDATE ${b} SET ${c} = ? WHERE rowid = ?`, [CU[l], r.r]);
    dongPL.push(r?.r ?? null);
  }
  // B1d: giá trị LẠ trong cột đã phân loại UTC (pos_damage_logs.created_at) — thiếu giây, có mili-giây, thừa chữ, chữ rác → KHÔNG đụng.
  const LA = ['2026-03-01 18:00', '2026-03-01 18:00:00.123', '2026-03-01 18:00:00 x', 'không rõ', '2026-03-01'];
  const idLa = [];
  for (const v of LA) idLa.push(Number((await db.run("INSERT INTO pos_damage_logs (order_id, order_code, product_code, product_name, quantity, reason, action, refund_amount, processed_by_name, created_at) VALUES (1, 'LA', 'X', 'X', 1, 'damaged', 'remake', 0, 'thu', ?)", [v])).lastInsertRowid));
  // B1e: giá trị cài đặt (pos_settings.updated_at — chủ quán 03.11) chưa đúng dạng T → giờ VN lúc chạy nâng cấp; đuôi Z = UTC biết chắc → +7
  // như mọi cột; đã dạng T và NULL giữ nguyên.
  const CAI_LA = [['gv1_c_z', '2026-07-01T03:00:00Z', '2026-07-01T10:00:00'], ['gv1_c_mili', '2026-07-01T10:00:00.123', '2027-05-01T12:00:00'],
    ['gv1_c_rac', 'không rõ', '2027-05-01T12:00:00'], ['gv1_c_rong', '', '2027-05-01T12:00:00'], ['gv1_c_ngay', '2026-07-01', '2027-05-01T12:00:00'],
    ['gv1_c_t', '2026-07-01T10:00:00', '2026-07-01T10:00:00'], ['gv1_c_null', null, null]];
  for (const [khoa, v] of CAI_LA) await db.run('INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)', [khoa, '1', v]);
  const khoaCot = (bang) => (bang === 'pos_settings' ? 'key' : 'id');
  const docGieo = async () => Promise.all(GIEO.map(([bang, cot], i) => motDong(`SELECT ${cot} AS v FROM ${bang} WHERE ${khoaCot(bang)} = ?`, [idGieo[i]]).then((r) => r?.v ?? null)));
  const tongTien = () => motDong('SELECT (SELECT COALESCE(SUM(total),0) FROM pos_orders) AS d, (SELECT COALESCE(SUM(amount),0) FROM pos_balance_transactions) AS v, (SELECT COALESCE(SUM(points),0) FROM pos_point_transactions) AS p, (SELECT COUNT(*) FROM pos_customer_packages) AS g');
  datVN('2027-05-01T12:00:00');
  const tienTruoc = JSON.stringify(await tongTien());
  const dsTruoc = JSON.stringify(await doiSoat.chayDoiSoat({ kieu: 'ngay', ngay: '2026-11-02' }).catch((e) => e.message));
  const chayBuoc = async () => { const tx = await db.beginTransaction(); imLang();
    try { const r = await buoc.chay(tx); await tx.commit(); return { r, log: [...nhatKy] }; } catch (e) { await tx.rollback(); return { loi: e.message, log: [] }; } finally { noiLai(); } };
  noiLai();
  const lan1 = buoc?.chay ? await chayBuoc() : { loi: 'chưa có bước', log: [] };
  const sau1 = await docGieo();
  k('B1 đổi đúng từng loại: UTC dấu cách +7 (sự cố, sổ ví) · VN dấu cách chỉ đổi T (in, hạn thẻ) · đuôi Z +7 · cài đặt dấu cách → giờ VN lúc chạy',
    GIEO.slice(0, 7).every((g, i) => sau1[i] === g[3]), GIEO.slice(0, 7).map((g, i) => `${g[0]}.${g[1]}=${sau1[i]}`).join(' | ') + (lan1.loi ? ' · ' + lan1.loi : ''));
  k('B1b in một dòng cho mỗi cột đổi (`🔧 Nâng cấp 012: <bảng>.<cột> đổi n dòng`), cả cài đặt (6 dòng chưa dạng T → giờ chạy); không còn dòng "để nguyên"',
    ['pos_damage_logs.created_at đổi 1', 'pos_balance_transactions.created_at đổi 1', 'pos_invoice_logs.printed_at đổi 1', 'pos_packages.created_at đổi 1']
      .every((x) => lan1.log.some((l) => l.includes('Nâng cấp 012') && new RegExp(x.replace(/\./g, '\\.').replace(/ 1$/, ' [1-9]\\d* dòng')).test(l)))
      && lan1.log.some((l) => /pos_settings\.updated_at đổi 6 dòng/.test(l)) && !lan1.log.some((l) => /để nguyên/.test(l)),
    lan1.log.join(' | ').slice(0, 300));
  const plSau = await Promise.all(PHAN_LOAI.map(([b, c], i) => (dongPL[i] == null ? null : motDong(`SELECT ${c} AS v FROM ${b} WHERE rowid = ?`, [dongPL[i]]).then((r) => r?.v ?? null))));
  const plSai = PHAN_LOAI.filter(([, , l], i) => plSau[i] !== MOI[l]).map(([b, c, l], i) => `${b}.${c}(${l})=${plSau[PHAN_LOAI.findIndex((x) => x[0] === b && x[1] === c)]}`);
  k(`B1c MỌI mục phân loại (${PHAN_LOAI.length} cột / ${new Set(PHAN_LOAI.map((x) => x[0])).size} bảng) đổi đúng loại: UTC +7 · VN chỉ đổi T · cài đặt → giờ chạy · cột chỉ getNow để nguyên`,
    dongPL.every((x) => x != null) && plSai.length === 0, plSai.join(' | ') + (dongPL.some((x) => x == null) ? ' · thiếu dòng gieo: ' + PHAN_LOAI.filter((_, i) => dongPL[i] == null).map((x) => x[0]).join(',') : ''));
  const caiSau = await Promise.all(CAI_LA.map(([khoa]) => motDong('SELECT updated_at AS v FROM pos_settings WHERE key = ?', [khoa]).then((r) => r?.v)));
  k('B1e cài đặt: đuôi Z +7 · mili-giây / chữ rác / rỗng / ngày thuần → giờ VN lúc chạy · đã dạng T và NULL giữ nguyên',
    JSON.stringify(caiSau) === JSON.stringify(CAI_LA.map((x) => x[2])), JSON.stringify(caiSau));
  const laSau = await Promise.all(idLa.map((id) => motDong('SELECT created_at AS v FROM pos_damage_logs WHERE id = ?', [id]).then((r) => r?.v)));
  k('B1d giá trị lạ trong cột UTC (thiếu giây / mili-giây / thừa chữ / chữ rác / ngày thuần) giữ nguyên — mẫu khớp đủ 19 ký tự', !!lan1.r && JSON.stringify(laSau) === JSON.stringify(LA), JSON.stringify(laSau));
  const saoLuu = await motDong("SELECT created_at AS v FROM _sao_luu_012_pos_damage_logs WHERE id = ?", [idGieo[0]]).catch(() => null);
  const saoVi = await motDong("SELECT created_at AS v FROM _sao_luu_012_pos_balance_transactions WHERE id = ?", [idGieo[1]]).catch(() => null);
  const saoCai = await motDong("SELECT updated_at AS v FROM _sao_luu_012_pos_settings WHERE key = 'gv1_c_rac'").catch(() => null);
  k('B2 bảng sao lưu _sao_luu_012_<bảng> giữ giá trị GỐC (sự cố, sổ ví, cài đặt)', saoLuu?.v === GIEO[0][2] && saoVi?.v === GIEO[1][2] && saoCai?.v === 'không rõ',
    `${saoLuu?.v} / ${saoVi?.v} / ${saoCai?.v}`);
  datVN('2027-05-03T08:00:00');   // lần hai ở GIỜ KHÁC: quy tắc "giờ lúc chạy" không lặp lại được thì cài đặt sẽ đổi giờ
  const lan2 = buoc?.chay ? await chayBuoc() : { loi: 'chưa có bước', log: [] };
  datVN('2027-05-01T12:00:00');
  const sau2 = await docGieo();
  const caiSau2 = await Promise.all(CAI_LA.map(([khoa]) => motDong('SELECT updated_at AS v FROM pos_settings WHERE key = ?', [khoa]).then((r) => r?.v)));
  k('B3 chạy lần hai (giờ khác): không dòng "đổi", dữ liệu bằng hệt lần một (cả cài đặt)', !lan2.loi && !lan2.log.some((l) => / đổi [1-9]/.test(l))
    && JSON.stringify(sau2) === JSON.stringify(sau1) && JSON.stringify(caiSau2) === JSON.stringify(caiSau), lan2.loi || lan2.log.join(' | ').slice(0, 200));
  const tienSau = JSON.stringify(await tongTien());
  const dsSau = JSON.stringify(await doiSoat.chayDoiSoat({ kieu: 'ngay', ngay: '2026-11-02' }).catch((e) => e.message));
  k('B4 (K5) dòng đã đúng giờ VN + ngày thuần không đổi; tổng tiền đơn / ví / điểm / số gói trước = sau', sau1[7] === GIEO[7][3] && sau1[8] === GIEO[8][3] && tienTruoc === tienSau, `${sau1[7]} · ${sau1[8]} · ${tienTruoc} → ${tienSau}`);
  const lech = [...dsTruoc].findIndex((c, i) => c !== dsSau[i]);
  k('K5b đối soát ngày 02.11.2026 (dữ liệu dạng T) trước = sau bước 012', !!lan1.r && dsTruoc === dsSau,
    dsTruoc === dsSau ? '' : `lệch ở: ${dsTruoc.slice(Math.max(0, lech - 80), lech + 80)} ⇒ ${dsSau.slice(Math.max(0, lech - 80), lech + 80)}`);
  const saoThua = await db.query("SELECT name FROM sqlite_master WHERE name LIKE '_sao_luu_012_%' AND name IN ('_sao_luu_012_pos_kh_lan_thu', '_sao_luu_012_pos_refund_requests', '_sao_luu_012_pos_registrations')");
  k('B5 bảng không có dòng phải đổi → không tạo bảng sao lưu', !!lan1.r && saoThua.length === 0, saoThua.map((r) => r.name).join(','));

  muc('E. App KH');
  const { kyTokenKhach } = require(path.join(MAY_CHU, 'middleware', 'khachAuth.js'));
  await db.run("INSERT INTO pos_customers (phone, name, created_at, updated_at) VALUES ('0938000030', 'Khách E', '2026-02-01 03:00:00', '2026-02-01 03:00:00')");
  datVN('2027-05-02T06:30:00');
  const donE = await taoDon({ customer_phone: '0938000030' });   // TRƯỚC khi có hạng (giá hạng làm lệch tiền mặt 25.000)
  await db.run("INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, purchased_at, expires_at, created_by) VALUES ('0938000030', ?, 'Vàng', 1, '2027-04-01T10:00:00', '2027-07-01 10:00:00', 'thu')", [hang.id]);
  await db.run("UPDATE pos_products SET ton_luc = '2026-03-01 08:00:00' WHERE id = ?", [sp[0].id]);   // ton_luc cũ: VN dấu cách (products.js)
  if (buoc?.chay) await chayBuoc();
  await db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, expires_at, reason, created_by, created_at) VALUES ('0938000030', 'earn', 5, '2028-04-01T00:00:00', 'thử', 'thu', ?)", [getNow()]);
  const khE = await motDong("SELECT id FROM pos_customers WHERE phone = '0938000030'");
  const tkE = kyTokenKhach(khE.id);
  const gioLa = [], gioDi = [];
  const di = (o, duong) => {
    if (typeof o === 'string') { if (/^\d{4}-\d\d-\d\d[ T]\d\d:\d\d/.test(o)) { gioDi.push(duong.split('.')[0]); if (!DANG_T.test(o)) gioLa.push(`${duong}=${o}`); } }
    else if (o && typeof o === 'object') for (const [a, b] of Object.entries(o)) di(b, `${duong}.${a}`);
  };
  const cua = ['/toi', '/menu', '/diem', '/voucher', '/don', '/hang', '/gio-vang', '/gio-hoat-dong'];
  const traVe = [];
  for (const c of cua) { const r = await goi('GET', '/api/kh' + c, null, tkE); traVe.push(`${c}:${r.status}`); di(r, c); }
  const toi = await goi('GET', '/api/kh/toi', null, tkE);
  const coGio = ['/toi', '/menu', '/diem', '/don', '/gio-hoat-dong'].filter((c) => !gioDi.includes(c));
  k('E1 giờ trong /api/kh (hồ sơ, hạng, menu ton_luc, điểm, đơn, giờ hoạt động — dữ liệu cũ đã nâng cấp) đúng dạng YYYY-MM-DDTHH:mm:ss; ngay_tao = giờ VN',
    gioLa.length === 0 && coGio.length === 0 && JSON.stringify(toi).includes('2026-02-01T10:00:00'),
    gioLa.slice(0, 5).join(' | ') + (coGio.length ? ' · cửa không có giờ nào để đo: ' + coGio.join(',') + ` (đơn E ${donE})` : '') + ' · ' + traVe.join(' '));
  const hd2 = doc(path.join(GOC, 'HOP_DONG_API_KH.md'));
  const pb = Number((hd2.match(/^PHIEN_BAN:\s*(\d+)/m) || [])[1]);
  // HANG-1: phiên bản sau GIO-VN-1 tăng tiếp (v7) — khoá "≥ 6", khối máy đọc khớp đúng PHIEN_BAN, vẫn đòi dòng v6 GIO-VN-1 trong nhật ký
  k('E2 hợp đồng: bỏ câu "Lỗi đã biết", PHIEN_BAN ≥ 6 (GIO-VN-1 = 6), khối máy đọc phien_ban = PHIEN_BAN, nhật ký có dòng v6 GIO-VN-1',
    hd2.length > 0 && !/Lỗi đã biết/.test(hd2.split('## Nhật ký')[0]) && pb >= 6 && new RegExp(`"phien_ban":\\s*${pb}\\b`).test(hd2) && /^- v6 · .*GIO-VN-1/m.test(hd2), `PHIEN_BAN ${pb}`);

  muc('B6. Khôi phục sao lưu qua route thật (POST /backup/restore, GET /backup/export/:table)');
  const XLSX = require(path.join(GOC, 'node_modules', 'xlsx'));
  const DK = { id: 990001, phone: '0938000050', name: 'ĐK GV1', status: 'pending' };
  const tepCu = () => { const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ ...DK, created_at: '2026-02-01T03:00:00.000Z' }]), 'Đăng ký mới');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ backup_date: '2026-02-01T03:00:00.000Z', system: 'POS Tứ Quý Đường' }]), '_Metadata');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }); };
  const khoiPhuc = async (tep) => { const f = new FormData(); f.append('file', new Blob([tep]), 'sl.xlsx'); imLang();
    try { const r = await fetch(goc + '/api/pos/backup/restore', { method: 'POST', headers: { Authorization: 'Bearer ' + tk }, body: f }); return r.status; } finally { noiLai(); } };
  const xuat = async (bang) => { imLang();
    try { const r = await fetch(goc + '/api/pos/backup/export/' + bang, { headers: { Authorization: 'Bearer ' + tk } }); return r.status === 200 ? Buffer.from(await r.arrayBuffer()) : null; } finally { noiLai(); } };
  const docDK = async () => (await motDong('SELECT created_at AS v FROM pos_registrations WHERE id = 990001'))?.v;
  const kp1 = await khoiPhuc(tepCu());
  const v1 = await docDK();
  k('B6 khôi phục bản sao lưu CŨ (backup_date đuôi Z) → giờ đuôi Z ra giờ VN dạng T', kp1 === 200 && v1 === '2026-02-01T10:00:00', `HTTP ${kp1} · ${v1}`);
  const coSao = await motDong("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = '_sao_luu_012_pos_registrations'");
  k('B6c khôi phục KHÔNG tạo bảng _sao_luu_012_* (bản gốc là chính file vừa nạp)', Number(coSao?.n) === 0, String(coSao?.n));
  await db.run("UPDATE pos_registrations SET created_at = '2026-02-01T03:00:00.000Z' WHERE id = 990001");
  const tepMoi = await xuat('pos_registrations');
  const kp2 = tepMoi ? await khoiPhuc(tepMoi) : 0;
  const v2 = await docDK();
  k('B6b khứ hồi: xuất một bảng bằng route (code mới) → khôi phục chính file đó → giữ y nguyên từng ô (SAOLUU-2 F1)', kp2 === 200 && v2 === '2026-02-01T03:00:00.000Z', `HTTP ${kp2} · ${v2}`);

  sv.close();
}

function ket() {
  console.log(`\n${dat} đạt · ${hong} hỏng`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* */ }
  process.exit(hong ? 1 : 0);
}
main().then(ket).catch((e) => { noiLai(); console.log('  ✗ Bài thử sập: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')); hong++; ket(); });
