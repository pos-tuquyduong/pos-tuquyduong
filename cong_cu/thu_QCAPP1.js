#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ QC-APP-1 — thẻ Cài đặt "Quảng cáo trên App" + cửa công khai GET /api/kh/quang-cao
 * ═══════════════════════════════════════════════════════════════════════════
 *  PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có bảng, route quầy, cửa /api/kh/quang-cao, thẻ). Xanh ngay = vô giá trị (K3).
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_QCAPP1.js [--goc <thư mục gốc bản sao>]      (in "n đạt · m hỏng")
 *  Khuôn thu_HUY1.js / thu_GIOVN1.js: database.js thật + libsql thật trên kho TẠM, đồng hồ GIẢ (datVN = giờ Việt Nam).
 *  Số mong đợi viết TAY (ngày 2026-11-13 là thứ Sáu; 11-15 Chủ nhật; 11-16 thứ Hai) — không chép công thức của code.
 *   A quầy: quyền · PIN chủ quán · lưu / đọc / xoá / thứ tự        B máy chủ tự kiểm từng luật (400, không ghi gì)
 *   C cửa công khai: trường, lọc ngày, món tắt, thứ tự, trần lượt  D Giờ vàng tự động
 *   F bảng qua bước 028, sao lưu, dọn dữ liệu thử                  H giao diện: thẻ, đếm ngược, xem trước, câu nhắc, hàm thuần
 *   I nối vào bộ kiểm
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const iG = process.argv.indexOf('--goc');
const GOC = path.resolve(iG > 0 ? process.argv[iG + 1] : path.join(__dirname, '..'));
const MAY_CHU = path.join(GOC, 'server');
const SRC = path.join(GOC, 'client', 'src');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_qcapp1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
process.env.JWT_SECRET = 'thu_qcapp1_nv_' + Date.now();
process.env.KH_JWT_SECRET = 'thu_qcapp1_kh_' + Date.now();
process.env.GUI_MA_KHACH = 'gia';

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const doc = (...p) => { try { return fs.readFileSync(path.join(GOC, ...p), 'utf8'); } catch { return ''; } };
const sach = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const dem = (s, re) => (s.match(re) || []).length;

// Đồng hồ giả: datVN('2026-11-13T10:00:00') = giờ Việt Nam đó (máy chủ thấy UTC trừ 7 giờ).
const DateGoc = Date;
let gio = DateGoc.parse('2026-11-13T03:00:00Z');
global.Date = class extends DateGoc {
  constructor(...a) { if (a.length === 0) super(gio); else super(...a); }
  static now() { return gio; }
};
const datVN = (s) => { gio = DateGoc.parse(s + 'Z') - 7 * 3600000; };

const PIN = '246810';
const CH32 = 'a'.repeat(32);
const NFD32 = 'ệ'.normalize('NFD').repeat(32);   // 32 chữ nhìn thấy, mỗi chữ 3 mã
const GIA_DINH = '👨‍👩‍👧';                          // một biểu tượng ghép = 1 ký tự nhìn thấy

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const bcrypt = require(path.join(GOC, 'node_modules', 'bcryptjs'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();
  const guiLai = await db.initDatabase().then(() => true, () => false);
  let routeQC = null, loiNap = '';
  try { routeQC = require(path.join(MAY_CHU, 'routes', 'quang-cao.js')); } catch (e) { loiNap = e.message; }
  const app = express();
  app.use(express.json());
  if (routeQC) app.use('/api/pos/quang-cao', routeQC);
  app.use('/api/kh', require(path.join(MAY_CHU, 'routes', 'kh')));
  app.use('/api/kh', require(path.join(MAY_CHU, 'routes', 'kh', 'loi.js')).loiTangKh);
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  const mot = (sql, a = []) => db.queryOne(sql, a);
  const tk = {};
  for (const v of ['owner', 'manager', 'staff']) {
    let u = await mot('SELECT id FROM pos_users WHERE role = ? ORDER BY id LIMIT 1', [v]);
    if (!u) u = { id: Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)", ['qc_' + v, 'qc_' + v, v])).lastInsertRowid) };
    tk[v] = jwt.sign({ userId: u.id }, process.env.JWT_SECRET, { expiresIn: '3650d' });
  }
  const chu = await mot("SELECT id, username FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  await db.run('UPDATE pos_users SET password = ? WHERE id = ?', [bcrypt.hashSync('mk_chu_quan', 4), chu.id]);
  const goi = async (method, url, body, the = tk.owner) => {
    imLang();
    try {
      const h = { 'Content-Type': 'application/json' };
      if (the) h.Authorization = 'Bearer ' + the;
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined, headers: h });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r?.status}${r?.code ? ' · ' + r.code : ''}${r?.error ? ' · ' + r.error : ''}`;
  const datCai = (khoa, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [khoa, String(v)]);

  // Món: 0, 1 bán được · 2 đã tắt · 3 chưa có giá
  const sp = await db.query('SELECT * FROM pos_products ORDER BY id LIMIT 4');
  await db.run('UPDATE pos_products SET is_active = 1, price = 30000 WHERE id IN (?, ?)', [sp[0].id, sp[1].id]);
  await db.run('UPDATE pos_products SET is_active = 0, price = 30000 WHERE id = ?', [sp[2].id]);
  await db.run('UPDATE pos_products SET is_active = 1, price = NULL WHERE id = ?', [sp[3].id]);
  const ma = (i) => `${sp[i].sx_product_type}_${sp[i].sx_product_id}`;

  const dong = (kv = {}) => ({ chu_dai: 'Giảm 10% trà sáng', tieu_de: '', phu: '', chu_nut: '', dich: '', ma_mon: null, kieu_ngay: 'hang_ngay',
    cac_thu: [], tu_ngay: null, den_ngay: null, tu_gio: null, den_gio: null, bat: true, ...kv });
  const luu = (ds, o = {}) => goi('PUT', '/pos/quang-cao', { dong: ds, gio_vang: o.gio_vang ?? false, ...('pin' in o ? (o.pin === undefined ? {} : { pin: o.pin }) : { pin: PIN }) }, o.token || tk.owner);
  const docQuay = () => goi('GET', '/pos/quang-cao');
  const chup = async () => JSON.stringify(await docQuay());
  const dem1 = async () => Number((await mot('SELECT COUNT(*) AS n FROM pos_quang_cao'))?.n);
  const App = (kv) => goi('GET', '/kh/quang-cao', undefined, kv);

  muc('[A] Cài đặt ở quầy — quyền, PIN chủ quán, lưu / đọc');
  k('A0 nạp được server/routes/quang-cao.js', !!routeQC, loiNap);
  k('A0b initDatabase chạy lại không lỗi', guiLai);
  const bang = await db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pos_quang_cao'").catch(() => []);
  k('A0c có bảng pos_quang_cao', bang.length === 1);
  if (routeQC && bang.length) {
    const a1 = await goi('GET', '/pos/quang-cao', undefined, null), a1b = await goi('PUT', '/pos/quang-cao', { dong: [], pin: PIN }, null);
    k('A1 không đăng nhập: GET và PUT → 401', a1.status === 401 && a1b.status === 401, `${a1.status}/${a1b.status}`);
    const a2 = await goi('GET', '/pos/quang-cao', undefined, tk.staff), a2b = await luu([dong()], { token: tk.staff });
    k('A2 nhân viên (không manage_settings): GET và PUT → 403, không ghi', a2.status === 403 && a2b.status === 403 && (await dem1()) === 0, `${a2.status}/${a2b.status}`);
    const a4 = await luu([dong()]);
    k('A4 chưa đặt PIN chủ quán → 400 CHUA_CO_PIN_CHU_QUAN, không ghi', a4.status === 400 && a4.code === 'CHUA_CO_PIN_CHU_QUAN' && (await dem1()) === 0, moTa(a4));
    const { datPinChuQuan } = require(path.join(MAY_CHU, 'utils', 'pinChuQuan.js'));
    imLang(); const dp = await datPinChuQuan({ id: chu.id, role: 'owner', username: chu.username }, 'mk_chu_quan', PIN, PIN); noiLai();
    k('A (dựng) chủ quán đặt PIN', !dp.loi, JSON.stringify(dp));
    const a5 = await luu([dong()], { pin: undefined }), a5b = await luu([dong()], { pin: '111111' }), a5c = await luu([dong()], { pin: '' });
    k('A5 không PIN / PIN sai / PIN rỗng → 400 PIN_CHU_QUAN_SAI, không ghi gì', [a5, a5b, a5c].every((r) => r.status === 400 && r.code === 'PIN_CHU_QUAN_SAI') && (await dem1()) === 0,
      [a5, a5b, a5c].map(moTa).join(' | '));
    const a6 = await luu([dong({ chu_dai: 'Một' }), dong({ chu_dai: 'Hai', dich: 'menu' }), dong({ chu_dai: 'Ba', bat: false })]);
    const r6 = await docQuay();
    k('A6 PIN đúng → 200; đọc lại đủ 3 dòng đúng thứ tự, dòng tắt vẫn đọc được', a6.status === 200 && r6.status === 200 && (r6.dong || []).map((d) => d.chu_dai).join(',') === 'Một,Hai,Ba'
      && r6.dong[2].bat === false && r6.dong[1].dich === 'menu', moTa(a6) + ' ' + (r6.dong || []).map((d) => d.chu_dai));
    k('A6b đọc trả kèm gio_vang (false) và danh sách món ĐANG BÁN đúng 2 món', r6.gio_vang === false && Array.isArray(r6.mon) && r6.mon.map((m) => m.ma).sort().join() === [ma(0), ma(1)].sort().join()
      && r6.mon.every((m) => m.ten), JSON.stringify(r6.mon));
    const id1 = r6.dong?.[0]?.id, id2 = r6.dong?.[1]?.id;
    const a7 = await luu([dong({ id: id2, chu_dai: 'Hai đổi' }), dong({ chu_dai: 'Mới' })]);
    const r7 = await docQuay();
    k('A7 sửa giữ nguyên id, thêm dòng mới, dòng vắng mặt (Một, Ba) bị xoá; thứ tự theo mảng', a7.status === 200 && r7.dong.length === 2 && r7.dong[0].id === id2 && r7.dong[0].chu_dai === 'Hai đổi'
      && r7.dong[1].chu_dai === 'Mới' && id1 !== undefined && !r7.dong.some((d) => d.id === id1) && (await dem1()) === 2, moTa(a7));
    const a10 = await luu([dong({ id: 999999 })]);
    k('A10 id không có trong kho → 400, danh sách cũ còn nguyên', a10.status === 400 && a10.code === 'QUANG_CAO_KHONG_HOP_LE' && JSON.stringify((await docQuay()).dong) === JSON.stringify(r7.dong), moTa(a10));
    const a8 = await luu([], { gio_vang: true });
    const r8 = await docQuay();
    k('A8 (K5) lưu danh sách rỗng → 200, xoá hết; công tắc Giờ vàng nhớ = true', a8.status === 200 && r8.dong.length === 0 && r8.gio_vang === true && (await dem1()) === 0, moTa(a8));
    const a12 = await luu([], { gio_vang: 'co' });
    k('A12 gio_vang không phải đúng/sai → 400', a12.status === 400 && a12.code === 'QUANG_CAO_KHONG_HOP_LE', moTa(a12));
    await db.run("INSERT OR REPLACE INTO pos_permissions (role, permission, allowed, created_at) VALUES ('manager', 'manage_settings', 1, '2026-11-13T00:00:00')");
    const a7b = await luu([dong()], { token: tk.manager });
    k('A7b (K5) quản lý có manage_settings + PIN đúng → 200', a7b.status === 200, moTa(a7b));
    const [pa, pb] = await Promise.all([luu([dong({ chu_dai: 'A1' }), dong({ chu_dai: 'A2' }), dong({ chu_dai: 'A3' })]), luu([dong({ chu_dai: 'B1' }), dong({ chu_dai: 'B2' })])]);
    const rd = (await docQuay()).dong.map((d) => d.chu_dai).join(',');
    k('A11 hai lần lưu cùng lúc → kết quả cuối nguyên vẹn là MỘT trong hai danh sách (không lẫn dòng)', [pa.status, pb.status].every((s) => s === 200 || s === 409 || s === 503)
      && ['A1,A2,A3', 'B1,B2'].includes(rd) && (await dem1()) === rd.split(',').length, `${pa.status}/${pb.status} → ${rd}`);
    await luu([]);

    muc('[B] Máy chủ tự kiểm từng luật (400 QUANG_CAO_KHONG_HOP_LE + loi_o, không ghi gì)');
    await luu([dong({ chu_dai: 'Gốc' })]);
    const truoc = await chup();
    const tu = async (ten, ds, truong, chi = 0) => {
      const r = await luu(ds);
      k(`B ${ten} → 400 đúng ô "${truong}"`, r.status === 400 && r.code === 'QUANG_CAO_KHONG_HOP_LE' && r.loi_o?.truong === truong && r.loi_o?.dong === chi && !!r.error && (await chup()) === truoc,
        moTa(r) + ' ' + JSON.stringify(r.loi_o || {}));
    };
    const qua = async (ten, ds) => { const r = await luu(ds); k(`B (K5) ${ten} → 200`, r.status === 200, moTa(r)); return r; };
    await tu('chữ dải 33 ký tự', [dong({ chu_dai: 'a'.repeat(33) })], 'chu_dai');
    await tu('chữ dải 33 biểu tượng (mỗi cái 2 mã)', [dong({ chu_dai: '😀'.repeat(33) })], 'chu_dai');
    await tu('chữ dải trống', [dong({ chu_dai: '' })], 'chu_dai');
    await tu('chữ dải toàn dấu cách', [dong({ chu_dai: '   ' })], 'chu_dai');
    await tu('chữ dải không phải chữ', [dong({ chu_dai: 12345 })], 'chu_dai');
    await tu('chữ dải có xuống dòng', [dong({ chu_dai: 'a\nb' })], 'chu_dai');
    await tu('dòng thứ 2 sai chữ dải (loi_o.dong = 1)', [dong(), dong({ chu_dai: '' })], 'chu_dai', 1);
    await tu('tiêu đề 41 ký tự', [dong({ tieu_de: 'a'.repeat(41) })], 'tieu_de');
    await tu('dòng phụ 81 ký tự', [dong({ phu: 'a'.repeat(81) })], 'phu');
    await tu('chữ nút 21 ký tự', [dong({ chu_nut: 'a'.repeat(21) })], 'chu_nut');
    await tu('dich lạ', [dong({ dich: 'khac' })], 'dich');
    await tu('dich mon thiếu món', [dong({ dich: 'mon', ma_mon: null })], 'ma_mon');
    await tu('dich mon món không tồn tại', [dong({ dich: 'mon', ma_mon: 'tea_99999' })], 'ma_mon');
    await tu('kiểu ngày lạ', [dong({ kieu_ngay: 'moi_thang' })], 'kieu_ngay');
    await tu('theo thứ nhưng không chọn thứ', [dong({ kieu_ngay: 'thu', cac_thu: [] })], 'cac_thu');
    await tu('thứ 0', [dong({ kieu_ngay: 'thu', cac_thu: [0] })], 'cac_thu');
    await tu('thứ 8', [dong({ kieu_ngay: 'thu', cac_thu: [1, 8] })], 'cac_thu');
    await tu('thứ là chữ', [dong({ kieu_ngay: 'thu', cac_thu: ['t2'] })], 'cac_thu');
    await tu('khoảng ngày thiếu ngày', [dong({ kieu_ngay: 'khoang', tu_ngay: '2026-11-13' })], 'den_ngay');
    await tu('ngày không có thật 2026-02-30', [dong({ kieu_ngay: 'khoang', tu_ngay: '2026-02-30', den_ngay: '2026-03-05' })], 'tu_ngay');
    await tu('tháng 13', [dong({ kieu_ngay: 'khoang', tu_ngay: '2026-11-13', den_ngay: '2026-13-01' })], 'den_ngay');
    await tu('ngày kết thúc trước ngày bắt đầu', [dong({ kieu_ngay: 'khoang', tu_ngay: '2026-11-14', den_ngay: '2026-11-13' })], 'den_ngay');
    await tu('giờ bắt đầu 25:00', [dong({ tu_gio: '25:00', den_gio: '26:00' })], 'tu_gio');
    await tu('giờ không đủ hai số "9:00"', [dong({ tu_gio: '9:00', den_gio: '10:00' })], 'tu_gio');
    await tu('giờ phút 60', [dong({ tu_gio: '09:00', den_gio: '10:60' })], 'den_gio');
    await tu('chỉ có giờ bắt đầu', [dong({ tu_gio: '09:00', den_gio: null })], 'den_gio');
    await tu('chỉ có giờ kết thúc', [dong({ tu_gio: null, den_gio: '09:00' })], 'tu_gio');
    await tu('giờ kết thúc = giờ bắt đầu', [dong({ tu_gio: '10:00', den_gio: '10:00' })], 'den_gio');
    await tu('giờ kết thúc trước giờ bắt đầu 10:00 → 09:59', [dong({ tu_gio: '10:00', den_gio: '09:59' })], 'den_gio');
    await tu('vắt qua nửa đêm 23:00 → 01:00', [dong({ tu_gio: '23:00', den_gio: '01:00' })], 'den_gio');
    await tu('bat không phải đúng/sai', [dong({ bat: 'co' })], 'bat');
    await tu('hơn 20 dòng', Array.from({ length: 21 }, (_, i) => dong({ chu_dai: 'D' + i })), 'chu_dai', 20);
    const rr = await goi('PUT', '/pos/quang-cao', { dong: 'x', pin: PIN });
    k('B danh sách không phải mảng → 400, không ghi', rr.status === 400 && (await chup()) === truoc, moTa(rr));
    await qua('chữ dải đúng 32 ký tự', [dong({ chu_dai: CH32 })]);
    await qua('32 chữ tiếng Việt gõ dạng tổ hợp (mỗi chữ 3 mã) — đếm theo ký tự nhìn thấy', [dong({ chu_dai: NFD32 })]);
    await qua('32 biểu tượng 😀 và 32 biểu tượng gia đình ghép (1 cái = 1 ký tự)', [dong({ chu_dai: '😀'.repeat(32) }), dong({ chu_dai: GIA_DINH.repeat(32) })]);
    await qua('tiêu đề 40 · phụ 80 · nút 20 ký tự', [dong({ tieu_de: 'a'.repeat(40), phu: 'b'.repeat(80), chu_nut: 'c'.repeat(20) })]);
    await qua('đúng 20 dòng', Array.from({ length: 20 }, (_, i) => dong({ chu_dai: 'D' + i })));
    await qua('khung giờ 00:00–23:59', [dong({ tu_gio: '00:00', den_gio: '23:59' })]);
    await qua('khoảng ngày một ngày (từ = đến)', [dong({ kieu_ngay: 'khoang', tu_ngay: '2026-11-13', den_ngay: '2026-11-13' })]);
    await qua('món tồn tại nhưng ĐÃ TẮT (dòng cũ lưu lại được)', [dong({ dich: 'mon', ma_mon: ma(2) })]);
    const gioChuan = await luu([dong({ dich: 'menu', ma_mon: ma(0), kieu_ngay: 'hang_ngay', cac_thu: [1, 2], tu_ngay: '2026-11-13', den_ngay: '2026-11-14', chu_dai: '  Có khoảng trắng  ' }),
      dong({ kieu_ngay: 'thu', cac_thu: [3, 1, 3] })]);
    const rc = (await docQuay()).dong || [];
    k('B chuẩn hoá: dich ≠ mon thì ma_mon = null; hằng ngày bỏ thứ + ngày; chữ cắt khoảng trắng; thứ sắp xếp, bỏ trùng',
      gioChuan.status === 200 && rc[0]?.ma_mon === null && rc[0].cac_thu.length === 0 && rc[0].tu_ngay === null && rc[0].den_ngay === null && rc[0].chu_dai === 'Có khoảng trắng'
      && JSON.stringify(rc[1]?.cac_thu) === '[1,3]', JSON.stringify(rc));
    await luu([]);

    muc('[C] Cửa công khai GET /api/kh/quang-cao');
    datVN('2026-11-13T10:00:00');
    const c0 = await App(null);
    k('C0 không token, chưa có dòng → 200 { success, bay_gio, data: [] }', c0.status === 200 && c0.success === true && c0.bay_gio === '2026-11-13T10:00:00' && Array.isArray(c0.data) && c0.data.length === 0
      && Object.keys(c0).sort().join() === 'bay_gio,data,status,success', moTa(c0) + JSON.stringify(c0));
    const c0b = await App('sai.sai.sai');
    k('C0b cửa công khai: gửi tiêu đề Authorization sai vẫn 200 (không đòi token)', c0b.status === 200, moTa(c0b));
    await luu([
      dong({ chu_dai: 'Hằng ngày', tieu_de: 'T', phu: 'P', chu_nut: 'N', dich: 'uudai' }),
      dong({ chu_dai: 'Đã tắt', bat: false }),
      dong({ chu_dai: 'Chỉ thứ Hai', kieu_ngay: 'thu', cac_thu: [1] }),
      dong({ chu_dai: 'Chủ nhật', kieu_ngay: 'thu', cac_thu: [7] }),
      dong({ chu_dai: 'Khoảng 13-15', kieu_ngay: 'khoang', tu_ngay: '2026-11-13', den_ngay: '2026-11-15', tu_gio: '08:00', den_gio: '11:30' }),
      dong({ chu_dai: 'Món bán', dich: 'mon', ma_mon: ma(0) }),
      dong({ chu_dai: 'Món tắt', dich: 'mon', ma_mon: ma(2) }),
      dong({ chu_dai: 'Món chưa giá', dich: 'mon', ma_mon: ma(3) }),
      dong({ chu_dai: 'Trắc nghiệm', dich: 'tracnghiem' }),
      dong({ chu_dai: 'Menu', dich: 'menu' }),
    ]);
    const ten = (r) => (r.data || []).map((d) => d.chu_dai).join(' | ');
    const c1 = await App(null);
    k('C1 thứ Sáu 13.11: thấy Hằng ngày · Khoảng · Món bán · Món tắt · Món chưa giá · Trắc nghiệm · Menu; KHÔNG thấy dòng tắt, thứ Hai, Chủ nhật',
      ten(c1) === 'Hằng ngày | Khoảng 13-15 | Món bán | Món tắt | Món chưa giá | Trắc nghiệm | Menu', ten(c1));
    const d0 = c1.data?.[0] || {};
    k('C2 danh sách TRẮNG đúng 10 trường (không bat / cac_thu / kieu_ngay / ngày / ghi chú / thời điểm sửa)',
      Object.keys(d0).sort().join() === 'chu_dai,chu_nut,den_gio,dich,id,ma_mon,phu,tieu_de,tu_gio,uu_tien', Object.keys(d0).join());
    k('C2b giá trị: hằng ngày uudai, tiêu đề/phụ/nút giữ nguyên, giờ null, ma_mon null, id là số, ưu tiên = vị trí lúc lưu (1,5,6…)',
      d0.dich === 'uudai' && d0.tieu_de === 'T' && d0.phu === 'P' && d0.chu_nut === 'N' && d0.tu_gio === null && d0.den_gio === null && d0.ma_mon === null && Number.isInteger(d0.id)
      && c1.data.map((d) => d.uu_tien).join() === '1,5,6,7,8,9,10', c1.data?.map((d) => d.uu_tien).join());
    const kh = c1.data?.[1] || {};
    k('C3 khung giờ trả NGUYÊN tu_gio/den_gio (App tự so giờ) — máy chủ không lọc theo giờ', kh.tu_gio === '08:00' && kh.den_gio === '11:30');
    datVN('2026-11-13T23:30:00');
    k('C3b 23:30 cùng ngày: dòng 08:00–11:30 vẫn có mặt (chỉ lọc theo NGÀY)', ten(await App(null)).includes('Khoảng 13-15'));
    const m1 = (r) => (r.data || []).filter((d) => d.chu_dai.startsWith('Món'));
    datVN('2026-11-13T10:00:00');
    const cm = m1(c1);
    k('C4 món bán được → dich "mon" + ma_mon; món ĐÃ TẮT và món CHƯA GIÁ → dich "menu", ma_mon null',
      cm[0].dich === 'mon' && cm[0].ma_mon === ma(0) && cm[1].dich === 'menu' && cm[1].ma_mon === null && cm[2].dich === 'menu' && cm[2].ma_mon === null, JSON.stringify(cm));
    await db.run('UPDATE pos_products SET is_active = 0 WHERE id = ?', [sp[0].id]);
    k('C4b món vừa bị tắt → lần đọc sau đổi ngay sang "menu"', m1(await App(null))[0].dich === 'menu');
    await db.run('UPDATE pos_products SET is_active = 1 WHERE id = ?', [sp[0].id]);
    await db.run('UPDATE pos_products SET price = NULL WHERE id = ?', [sp[0].id]);
    k('C4c món bị xoá giá → "menu"', m1(await App(null))[0].dich === 'menu');
    await db.run('UPDATE pos_products SET price = 30000 WHERE id = ?', [sp[0].id]);
    k('C4d món có lại → "mon"', m1(await App(null))[0].dich === 'mon');
    datVN('2026-11-15T00:00:00');
    const cn = ten(await App(null));
    k('C5 Chủ nhật 15.11 00:00:00: thấy "Chủ nhật" + Khoảng (ngày cuối gồm cả hai đầu), không thấy "Chỉ thứ Hai"', cn.includes('Chủ nhật') && cn.includes('Khoảng 13-15') && !cn.includes('Chỉ thứ Hai'), cn);
    datVN('2026-11-15T23:59:59');
    k('C5b 15.11 23:59:59: khoảng còn hiện (sát nửa đêm)', ten(await App(null)).includes('Khoảng 13-15'));
    datVN('2026-11-16T00:00:00');
    const hai = ten(await App(null));
    k('C5c Thứ Hai 16.11 00:00:00: khoảng HẾT, "Chủ nhật" hết, "Chỉ thứ Hai" có', !hai.includes('Khoảng') && !hai.includes('Chủ nhật') && hai.includes('Chỉ thứ Hai'), hai);
    datVN('2026-11-12T23:59:59');
    const truocKhoang = ten(await App(null));
    k('C5d 12.11 23:59:59: khoảng CHƯA hiện; 13.11 00:00:00 đã hiện', !truocKhoang.includes('Khoảng') && (datVN('2026-11-13T00:00:00'), ten(await App(null))).includes('Khoảng 13-15'), truocKhoang);
    datVN('2026-11-13T10:00:00');
    await luu([dong({ chu_dai: 'Sau' }), dong({ chu_dai: 'Trước' })]);
    k('C6 thứ tự theo uu_tien = thứ tự lưu', ten(await App(null)) === 'Sau | Trước');
    const cp = (await luu([dong({ chu_dai: 'Trước' }), dong({ chu_dai: 'Sau' })]), await App(null));
    k('C6b đổi chỗ rồi lưu → đổi theo', ten(cp) === 'Trước | Sau' && cp.data[0].uu_tien < cp.data[1].uu_tien);
    const nho = JSON.stringify(await App(null));
    k('C7 không rò: câu trả lời không chứa chữ "bat", "cac_thu", "created", "updated", "pin"', !/"bat"|cac_thu|created|updated|"pin|error/.test(nho), nho);

    muc('[D] Giờ vàng tự động');
    await luu([dong({ chu_dai: 'Thường' })], { gio_vang: false });
    for (const [a, b] of [['flash_enabled', 'true'], ['flash_start', '15:00'], ['flash_end', '16:00'], ['flash_percent', '20'], ['flash_product_keys', JSON.stringify([ma(0)])]]) await datCai(a, b);
    const gv0 = await goi('GET', '/kh/gio-vang', undefined, null);
    datVN('2026-11-13T15:30:00');
    const gvChay = await goi('GET', '/kh/gio-vang', undefined, null);
    k('D0 (K5) /gio-vang giữ nguyên cách trả (dang_chay true lúc 15:30, 5 trường)', gvChay.dang_chay === true && gvChay.phan_tram === 20 && gvChay.mon?.length === 1 && gv0.dang_chay === false
      && Object.keys(gvChay).sort().join() === 'bat_dau,dang_chay,ket_thuc,mon,phan_tram,status,success', JSON.stringify(gvChay));
    k('D1 công tắc TẮT + Giờ vàng đang chạy → KHÔNG có dòng gio_vang', !(await App(null)).data.some((d) => d.id === 'gio_vang'));
    await luu([dong({ chu_dai: 'Thường' })], { gio_vang: true });
    const g1 = await App(null), g = g1.data?.[0] || {};
    k('D2 công tắc BẬT + đang chạy → dòng đầu id "gio_vang", uu_tien 0, den_gio "16:00", dich "menu", chữ do máy chủ dựng',
      g.id === 'gio_vang' && g.uu_tien === 0 && g.den_gio === '16:00' && g.tu_gio === null && g.dich === 'menu' && g.ma_mon === null && g.chu_dai === '⏰ Giờ vàng: giảm 20% đến 16:00'
      && g.tieu_de === '' && g.phu === '' && g.chu_nut === '' && g1.data.length === 2 && g1.data[1].chu_dai === 'Thường', JSON.stringify(g1.data));
    k('D2b chữ dải Giờ vàng ≤ 32 ký tự nhìn thấy (phần trăm lớn nhất 90)', (() => { const n = Array.from(new Intl.Segmenter('vi', { granularity: 'grapheme' }).segment(g.chu_dai || '')).length; return n > 0 && n <= 32; })());
    k('D2c dòng gio_vang có đúng 10 trường như dòng thường', Object.keys(g).sort().join() === 'chu_dai,chu_nut,den_gio,dich,id,ma_mon,phu,tieu_de,tu_gio,uu_tien', Object.keys(g).join());
    datVN('2026-11-13T10:00:00');
    k('D3 BẬT nhưng chưa tới giờ (10:00) → không có dòng', !(await App(null)).data.some((d) => d.id === 'gio_vang'));
    datVN('2026-11-13T16:00:00');
    k('D3b đúng 16:00:00 (mốc cuối không tính) → không có dòng', !(await App(null)).data.some((d) => d.id === 'gio_vang'));
    datVN('2026-11-13T15:00:00');
    k('D3c đúng 15:00:00 (mốc đầu tính) → có dòng', (await App(null)).data[0]?.id === 'gio_vang');
    datVN('2026-11-13T15:30:00');
    await datCai('flash_enabled', 'false');
    k('D4 Giờ vàng tắt ở Cài đặt giờ vàng → không có dòng', !(await App(null)).data.some((d) => d.id === 'gio_vang'));
    await datCai('flash_enabled', 'true'); await datCai('flash_product_keys', '[]');
    k('D4b Giờ vàng bật nhưng không có món (quầy không giảm được) → không có dòng', !(await App(null)).data.some((d) => d.id === 'gio_vang'));
    await datCai('flash_product_keys', JSON.stringify([ma(0)])); await datCai('flash_start', '22:00'); await datCai('flash_end', '02:00');
    datVN('2026-11-14T01:00:00');
    const dq = (await App(null)).data[0] || {};
    k('D5 khung qua nửa đêm 22:00–02:00, lúc 01:00 → có dòng, den_gio "02:00"', dq.id === 'gio_vang' && dq.den_gio === '02:00', JSON.stringify(dq));
    await datCai('flash_start', '15:00'); await datCai('flash_end', '16:00');
    datVN('2026-11-13T15:30:00');
    await luu([], { gio_vang: true });
    const g6 = await App(null);
    k('D6 (K5) không có dòng quán gõ, chỉ Giờ vàng → data đúng 1 dòng', g6.data.length === 1 && g6.data[0].id === 'gio_vang');

    muc('[C8] Trần lượt (cửa công khai không token)');
    let da429 = null;
    for (let i = 0; i < 320 && !da429; i++) { const r = await App(null); if (r.status === 429) da429 = r; }
    k('C8 quá trần lượt / phút / IP → 429 QUA_NHIEU_LAN { error, code }', !!da429 && da429.code === 'QUA_NHIEU_LAN' && !!da429.error, da429 ? moTa(da429) : 'không bao giờ 429');
    gio += 120000;

    muc('[F] Bảng, bước nâng cấp 028, sao lưu, dọn dữ liệu thử');
    const cot = (await db.query('PRAGMA table_info(pos_quang_cao)').catch(() => [])).map((c) => c.name);
    k('F1 bảng pos_quang_cao đủ cột', ['id', 'chu_dai', 'tieu_de', 'phu', 'chu_nut', 'dich', 'ma_mon', 'kieu_ngay', 'cac_thu', 'tu_ngay', 'den_ngay', 'tu_gio', 'den_gio', 'uu_tien', 'bat'].every((c) => cot.includes(c)), cot.join());
    const f028 = fs.existsSync(MAY_CHU) ? fs.readdirSync(path.join(MAY_CHU, 'nang_cap')).filter((f) => /^028_quang_cao\.js$/.test(f)) : [];
    const src028 = sach(doc('server', 'nang_cap', '028_quang_cao.js'));
    k('F2 có bước server/nang_cap/028_quang_cao.js, chỉ TẠO bảng (không UPDATE/DELETE/DROP/ALTER/INSERT)', f028.length === 1 && /CREATE TABLE IF NOT EXISTS pos_quang_cao/.test(src028) && !/\b(UPDATE|DELETE|DROP|ALTER|INSERT)\b/.test(src028), src028.slice(0, 60));
    k('F2b bước 028 không dùng giờ SQLite (CURRENT_TIMESTAMP / datetime(\'now\'))', f028.length === 1 && !/CURRENT_TIMESTAMP|datetime\s*\(\s*['"]now/i.test(src028));
    if (f028.length) {
      const buoc = require(path.join(MAY_CHU, 'nang_cap', '028_quang_cao.js'));
      imLang();
      const tx = await db.beginTransaction();
      let loi2 = '';
      try { await buoc.chay(tx, { themCot: async () => {} }); await buoc.chay(tx, { themCot: async () => {} }); await tx.commit(); } catch (e) { loi2 = e.message; await tx.rollback(); }
      noiLai();
      k('F3 chạy bước 028 hai lần liền không lỗi (viết lặp lại được)', loi2 === '', loi2);
    } else k('F3 chạy bước 028 hai lần liền không lỗi (viết lặp lại được)', false, 'chưa có bước 028');
    const bk = doc('server', 'routes', 'backup.js');
    const khoiBK = (bk.split('const BACKUP_TABLES = [')[1] || '').split('\n];')[0];
    const khoiKhongKP = (bk.split('const BANG_KHONG_KHOI_PHUC = [')[1] || '').split('];')[0];
    k('F4 pos_quang_cao có trong BACKUP_TABLES và KHÔNG nằm trong BANG_KHONG_KHOI_PHUC (cấu hình khôi phục được)', /name: 'pos_quang_cao'/.test(khoiBK) && !/pos_quang_cao/.test(khoiKhongKP));
    await luu([dong({ chu_dai: 'Giữ qua dọn' })], { gio_vang: true });
    const dt = require(path.join(MAY_CHU, 'utils', 'donThu.js'));
    imLang();
    const lk = await dt.lietKe({ truoc_ngay: '2099-01-01' }, 'thu').catch((e) => ({ loi: e.message }));
    const kqDon = lk && lk.ma_xac_nhan ? await dt.donDuLieuThu({ truoc_ngay: '2099-01-01', ma_xac_nhan: lk.ma_xac_nhan, go_xac_nhan: dt.CHU_XAC_NHAN }, 'thu').catch((e) => ({ loi: e.message })) : { loi: JSON.stringify(lk).slice(0, 80) };
    noiLai();
    const conLai = await docQuay();
    k('F5 chạy dọn dữ liệu thử thật → dòng quảng cáo + công tắc Giờ vàng còn nguyên', !kqDon.loi && conLai.dong?.[0]?.chu_dai === 'Giữ qua dọn' && conLai.gio_vang === true, JSON.stringify(kqDon).slice(0, 120));
    k('F6 donThu.js không có pos_quang_cao trong danh sách xoá (THU_TU_XOA)', !dt.THU_TU_XOA.includes('pos_quang_cao'));
  }

  muc('[H] Giao diện quầy');
  const st = sach(doc('client', 'src', 'pages', 'Settings.jsx'));
  const qc = sach(doc('client', 'src', 'pages', 'CaiDat', 'QuangCao.jsx'));
  const qcTho = doc('client', 'src', 'pages', 'CaiDat', 'QuangCao.jsx');
  const api = sach(doc('client', 'src', 'utils', 'api.js'));
  k('H1 có pages/CaiDat/QuangCao.jsx và pages/CaiDat/quangCao.js', qc.length > 0 && doc('client', 'src', 'pages', 'CaiDat', 'quangCao.js').length > 0);
  k('H2 api.js có quangCaoApi (GET / PUT /quang-cao qua axios chung)', /export const quangCaoApi = \{/.test(api) && /api\.get\('\/quang-cao'\)/.test(api) && /api\.put\('\/quang-cao'/.test(api));
  k('H3 Settings.jsx: nhập QuangCao, quyền manage_settings, nhóm Khách hàng, nút "📣 Quảng cáo trên App", nhánh vẽ <QuangCao',
    /import QuangCao from '\.\/CaiDat\/QuangCao'/.test(st) && /quangCao: 'manage_settings'/.test(st) && /\['quangCao', 'manage_settings'\]/.test(st)
    && /doiThe\('quangCao'\)/.test(st) && st.includes('📣 Quảng cáo trên App') && /tab === 'quangCao'[\s\S]{0,80}<QuangCao \/>/.test(st));
  k('H3b nút thẻ chỉ hiện khi có quyền: theTrongNhom.includes(\'quangCao\') && hasPermission(\'manage_settings\')', /theTrongNhom\.includes\('quangCao'\) && hasPermission\('manage_settings'\)/.test(st));
  k('H4 QuangCao.jsx nối ThanhLuu + HoiPin + useThayDoi + LoiO + thông báo chung (baoXong/baoLoi/baoLoiTu)',
    /<ThanhLuu id="quang-cao"/.test(qc) && /<HoiPin /.test(qc) && /useThayDoi\(/.test(qc) && /<LoiO /.test(qc) && /import \{[^}]*baoXong[^}]*\} from '\.\.\/\.\.\/components\/thongBaoKho\.js'/.test(qc)
    && dem(qc, /\bbao(?:Xong|Loi|LoiTu)\(/g) >= 4);
  k('H4b không alert( / setMessage / console.error / fetch( trần; gọi máy chủ qua quangCaoApi', !/(^|[^.\w])alert\(|setMessage|console\.error|\bfetch\(/.test(qc) && /quangCaoApi\.(?:ds|luu|doc)\(/.test(qc));
  k('H4c lưu xong tải lại số máy chủ giữ (await tai() sau quangCaoApi.luu), nút Lưu mờ + "Đang lưu…"', /quangCaoApi\.luu\([\s\S]{0,400}await tai\(\)/.test(qc) && /Đang lưu…/.test(qc) && /disabled=\{dangLuu\}/.test(qc));
  k('H5 câu nhắc NGUYÊN VĂN dưới ô chữ: "Không ghi công dụng chữa bệnh (quy định quảng cáo thực phẩm)."', qcTho.includes('Không ghi công dụng chữa bệnh (quy định quảng cáo thực phẩm).'));
  k('H6 đếm ngược khi gõ (hàm conLai/demKyTu được dùng ở ô chữ dải) + báo dưới ô bằng loi_o', /conLai\(|demKyTu\(/.test(qc) && /loi_o/.test(qc));
  k('H7 dòng xem trước dải mảnh: một dòng, cắt "…" (nowrap + overflow hidden + text-overflow ellipsis)', /whiteSpace: 'nowrap'/.test(qc) && /overflow: 'hidden'/.test(qc) && /textOverflow: 'ellipsis'/.test(qc) && /Xem trước/.test(qc));
  k('H8 đủ nhãn: Menu · Một món · Ưu đãi · Trắc nghiệm thể trạng · Không mở gì; hằng ngày / các thứ / từ ngày – đến ngày; Bật/Tắt; ▲▼',
    ['Menu', 'Một món', 'Ưu đãi', 'Trắc nghiệm thể trạng', 'Không mở gì', 'Hằng ngày', 'Các thứ trong tuần', 'Từ ngày – đến ngày', 'Bật', 'Tắt'].every((x) => qcTho.includes(x))
    && /aria-label="Lên"/.test(qc) && /aria-label="Xuống"/.test(qc));
  k('H9 công tắc Giờ vàng đúng chữ "Khi Giờ vàng đang chạy thì dải hiện Giờ vàng"', qcTho.includes('Khi Giờ vàng đang chạy thì dải hiện Giờ vàng'));
  k('H10 ô chọn món liệt kê món ĐANG BÁN máy chủ trả (mon) và gắn "(món đã tắt)" cho món cũ không còn', /\.mon\b/.test(qc) && qcTho.includes('(món đã tắt)'));
  k('H11 lỗi máy chủ loi_o đưa về đúng ô (khoá `${khoa}:${truong}`)', /loi_o/.test(qc) && /khoa\}:\$\{[^}]*truong/.test(qcTho.replace(/\s+/g, ' ')) || /\$\{[^}]*khoa[^}]*\}:\$\{[^}]*truong[^}]*\}/.test(qcTho));
  let M = {};
  try { M = await import(pathToFileURL(path.join(SRC, 'pages', 'CaiDat', 'quangCao.js')).href); } catch (e) { M = {}; }
  const sv2 = (() => { try { return require(path.join(MAY_CHU, 'routes', 'quang-cao.js')); } catch { return {}; } })();
  k('H12 nạp được quangCao.js (hàm thuần)', typeof M.demKyTu === 'function' && typeof M.kiemDong === 'function' && typeof M.conLai === 'function');
  if (M.demKyTu) {
    k('H12a demKyTu: "abc"=3 · 😀😀=2 · gia đình ghép=1 · chữ Việt tổ hợp 3 mã=1 · rỗng/null=0',
      M.demKyTu('abc') === 3 && M.demKyTu('😀😀') === 2 && M.demKyTu(GIA_DINH) === 1 && M.demKyTu('ệ'.normalize('NFD')) === 1 && M.demKyTu('') === 0 && M.demKyTu(null) === 0);
    k('H12b conLai: 32 − số ký tự (âm khi quá)', M.conLai('a'.repeat(30)) === 2 && M.conLai(CH32) === 0 && M.conLai('a'.repeat(35)) === -3 && M.conLai('') === 32);
    const d = (kv) => ({ khoa: 'x', chu_dai: 'Ok', tieu_de: '', phu: '', chu_nut: '', dich: '', ma_mon: '', kieu_ngay: 'hang_ngay', cac_thu: [], tu_ngay: '', den_ngay: '', tu_gio: '', den_gio: '', bat: true, ...kv });
    const l = (kv) => M.kiemDong([d(kv)]);
    k('H12c kiemDong: dòng hợp lệ → {}; chữ 33 → báo ô x:chu_dai; trống → x:chu_dai', Object.keys(l({})).length === 0 && !!l({ chu_dai: 'a'.repeat(33) })['x:chu_dai'] && !!l({ chu_dai: ' ' })['x:chu_dai'] && Object.keys(l({ chu_dai: CH32 })).length === 0);
    k('H12d kiemDong: giờ — thiếu một đầu, kết thúc ≤ bắt đầu, vắt nửa đêm → x:den_gio / x:tu_gio; 00:00–23:59 hợp lệ',
      !!l({ tu_gio: '09:00' })['x:den_gio'] && !!l({ den_gio: '09:00' })['x:tu_gio'] && !!l({ tu_gio: '10:00', den_gio: '10:00' })['x:den_gio'] && !!l({ tu_gio: '23:00', den_gio: '01:00' })['x:den_gio']
      && Object.keys(l({ tu_gio: '00:00', den_gio: '23:59' })).length === 0);
    k('H12e kiemDong: khoảng ngày — thiếu, không có thật, kết thúc < bắt đầu → báo; từ = đến hợp lệ; thứ rỗng → x:cac_thu; dich mon thiếu món → x:ma_mon',
      !!l({ kieu_ngay: 'khoang', tu_ngay: '2026-11-13' })['x:den_ngay'] && !!l({ kieu_ngay: 'khoang', tu_ngay: '2026-02-30', den_ngay: '2026-03-01' })['x:tu_ngay']
      && !!l({ kieu_ngay: 'khoang', tu_ngay: '2026-11-14', den_ngay: '2026-11-13' })['x:den_ngay'] && Object.keys(l({ kieu_ngay: 'khoang', tu_ngay: '2026-11-13', den_ngay: '2026-11-13' })).length === 0
      && !!l({ kieu_ngay: 'thu', cac_thu: [] })['x:cac_thu'] && !!l({ dich: 'mon', ma_mon: '' })['x:ma_mon']);
    k('H12f kiemDong: tiêu đề 41 / phụ 81 / nút 21 → báo; 40 / 80 / 20 hợp lệ; quá 20 dòng → báo',
      !!l({ tieu_de: 'a'.repeat(41) })['x:tieu_de'] && !!l({ phu: 'a'.repeat(81) })['x:phu'] && !!l({ chu_nut: 'a'.repeat(21) })['x:chu_nut']
      && Object.keys(l({ tieu_de: 'a'.repeat(40), phu: 'a'.repeat(80), chu_nut: 'a'.repeat(20) })).length === 0 && !!M.kiemDong(Array.from({ length: 21 }, (_, i) => d({ khoa: 'k' + i }))).chung);
    const gh = sv2.GIOI_HAN || {};
    k('H12g hằng số quầy = máy chủ (chu_dai 32 · tieu_de 40 · phu 80 · chu_nut 20 · 20 dòng)', M.GIOI_HAN && gh.chu_dai === M.GIOI_HAN.chu_dai && gh.tieu_de === M.GIOI_HAN.tieu_de && gh.phu === M.GIOI_HAN.phu
      && gh.chu_nut === M.GIOI_HAN.chu_nut && gh.so_dong === M.GIOI_HAN.so_dong && gh.chu_dai === 32 && gh.tieu_de === 40 && gh.phu === 80 && gh.chu_nut === 20 && gh.so_dong === 20, JSON.stringify([gh, M.GIOI_HAN]));
  }

  muc('[I] Nối vào bộ kiểm');
  const kt = doc('kiem_tra_truoc_khi_giao.js');
  k('I1 kiem_tra_truoc_khi_giao.js nối cong_cu/thu_QCAPP1.js', /chayBaiThat\('cong_cu\/thu_QCAPP1\.js'\)/.test(kt));
  const md = doc('HOP_DONG_API_KH.md');
  k('I2 hợp đồng ghi cửa GET /quang-cao (bảng chữ) — chi tiết v16 do thu_HOPDONG_KH canh', md.includes('`GET /quang-cao`'));

  sv.close();
  console.log(`\n${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { noiLai(); console.log(`✗ Bài thử sập: ${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e}`); console.log(`\n${dat} đạt · ${hong + 1} hỏng`); process.exit(2); });
