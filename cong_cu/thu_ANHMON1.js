#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ ANH-MON-1 — ảnh nhỏ cho món: bước 037 · tải / xoá / đọc ảnh · menu quầy + /api/kh/menu có `anh` · giao diện · hợp đồng v19
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có bảng, chưa có cửa ảnh, `anh` cứng null). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_ANHMON1.js [--may-chu <thư mục server>]
 *  (--may-chu: bản sao đột biến của viec/ANH-MON-1/dot_bien.py; giao diện đọc <may-chu>/../client/src)
 *
 *  Khuôn thu_KHSP1.js: database.js thật + libsql thật trên file kho TẠM; chỉ thay ketNoiKho (P8). Quyền: chủ (owner) tải được;
 *  nhân viên bị gỡ manage_settings → 403. So HTTP status + `code` (E12), không dò lời báo. Ranh giới 120 KB thử cả hai phía (K3).
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const CLIENT = path.join(MAY_CHU, '..', 'client', 'src');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_anhmon1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_anhmon1_nv_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_anhmon1_kh_' + Date.now();
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_anhmon1';

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };

const KB = 1024;
const GIOI_HAN = 120 * KB;   // phiếu A2 — số cứng ở ĐÂY là cố ý: bài thử khoá đúng con số chủ quán chốt, không đọc lại từ code
const KHOA_MENU_MOI = ['con_hang', 'gia', 'gia_hang', 'ma', 'nhom', 'ten', 'ton_cu', 'ton_luc', 'nhu_cau', 'the_chat', 'mo_ta', 'cong_dung', 'thanh_phan', 'anh'].sort();

// Ảnh giả: ĐÚNG byte đầu của từng kiểu, thân ngẫu nhiên (mỗi lần khác nhau trừ khi truyền hạt).
const nho = (hat) => crypto.createHash('sha256').update(String(hat)).digest();
const dem = (n, hat) => { const b = Buffer.alloc(n); for (let i = 0; i < n; i += 32) nho(hat + ':' + i).copy(b, i); return b; };
const jpeg = (n, hat = 'j') => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]), Buffer.from('JFIF\0'), dem(n - 13, hat), Buffer.from([0xff, 0xd9])]);
const png = (n, hat = 'p') => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), dem(n - 8, hat)]);
const webp = (n, hat = 'w') => Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP'), dem(n - 12, hat)]);
const wav = (n) => Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WAVE'), dem(n - 12, 'wav')]);
const pdf = (n) => Buffer.concat([Buffer.from('%PDF-1.4\n'), dem(n - 9, 'pdf')]);

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();
  const R = (f) => path.join(MAY_CHU, 'routes', f);
  const app = express();
  app.use(express.json({ limit: '5mb' }));   // như server/index.js — bộ đọc JSON đứng trước mọi route
  app.use('/api/pos/products', require(R('products.js')));
  app.use('/api/pos/kho', require(path.join(MAY_CHU, 'kho', 'duong.js')));
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}`;
  noiLai();

  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES ('thu_ngan_anhmon1', 'x', 'Thu ngân', 'staff', 1)");
  const nv = await db.queryOne("SELECT id FROM pos_users WHERE username = 'thu_ngan_anhmon1'");
  const tkNv = jwt.sign({ userId: nv.id }, KHOA_NV, { expiresIn: '1h' });
  await db.run("DELETE FROM pos_permissions WHERE role = 'staff' AND permission = 'manage_settings'");
  await db.run("INSERT INTO pos_permissions (role, permission, allowed) VALUES ('staff', 'manage_settings', 0)");

  for (const [i, loai] of [[901, 'juice'], [902, 'tea']]) {
    await db.run('INSERT INTO pos_products (code, name, category, price, is_active, sx_product_type, sx_product_id) VALUES (?, ?, ?, 25000, 1, ?, ?)',
      [`ANHMON1_${i}`, `Món thử ${i}`, loai, loai, i]);
  }
  await require('./gia_lap/monThu').dungMonThu(db);   // món thử có công thức + lô → có mặt trong menu
  const idMon = async (i) => (await db.queryOne('SELECT id FROM pos_products WHERE sx_product_id = ?', [i])).id;
  const m1 = await idMon(901), m2 = await idMon(902);

  const goi = async (method, url, o = {}) => {
    const headers = {};
    if (o.tk) headers.Authorization = 'Bearer ' + o.tk;
    if (o.kieu) headers['Content-Type'] = o.kieu;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: o.than });
      const buf = Buffer.from(await r.arrayBuffer());
      let j = {}; try { j = JSON.parse(buf.toString('utf8')); } catch { /* không phải JSON */ }
      return { status: r.status, j, buf, h: r.headers };
    } finally { noiLai(); }
  };
  const tai = (id, than, o = {}) => goi('PUT', `/api/pos/products/${id}/anh`, { tk: tkChu, kieu: 'image/jpeg', than, ...o });
  const xoa = (id, tk = tkChu) => goi('DELETE', `/api/pos/products/${id}/anh`, { tk });
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const moTa = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;
  const soHang = async (id) => Number((await db.queryOne('SELECT COUNT(*) AS n FROM pos_anh_mon WHERE product_id = ?', [id])).n);
  const menuKh = async (ma) => ((await goi('GET', '/api/kh/menu')).j.data || []).find((m) => m.ma === ma);
  const menuQuay = async (id) => ((await goi('GET', '/api/pos/products', { tk: tkChu })).j || []).find((p) => p.id === id);
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };
  const doc = (f) => { try { return fs.readFileSync(path.join(GOC, f), 'utf8'); } catch { return ''; } };
  const docCl = (f) => { try { return fs.readFileSync(path.join(CLIENT, f), 'utf8'); } catch { return ''; } };

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] Tải JPEG 80 KB → đọc lại ĐÚNG byte; menu quầy + App có `anh`');
  let duongA = null;
  await chay('A', async () => {
    const goc80 = jpeg(80 * KB);
    const r = await tai(m1, goc80);
    k('A1 chủ tải JPEG 80 KB → 200', la(r, 200), moTa(r));
    duongA = r.j.anh;
    k('A2 câu trả lời có `anh` là đường dẫn (chuỗi, bắt đầu "/")', typeof duongA === 'string' && duongA.startsWith('/'), JSON.stringify(r.j).slice(0, 120));
    const d = duongA ? await goi('GET', duongA) : { status: 0, buf: Buffer.alloc(0), h: new Map() };
    k('A3 đọc lại KHÔNG token → 200, đúng từng byte', d.status === 200 && Buffer.compare(d.buf, goc80) === 0, `HTTP ${d.status}, ${d.buf.length} byte`);
    k('A4 Content-Type = image/jpeg (theo byte thật)', d.h.get && d.h.get('content-type') === 'image/jpeg', String(d.h.get && d.h.get('content-type')));
    const cc = String((d.h.get && d.h.get('cache-control')) || '');
    k('A5 Cache-Control dài (≥ 1 năm, immutable)', /max-age=(\d+)/.test(cc) && Number(cc.match(/max-age=(\d+)/)[1]) >= 31536000 && /immutable/.test(cc), cc);
    k('A6 nosniff (không để trình duyệt đoán kiểu)', !!(d.h.get && /nosniff/i.test(d.h.get('x-content-type-options') || '')));
    const kh = await menuKh('juice_901');
    k('A7 /api/kh/menu: `anh` = đường dẫn ảnh', !!kh && typeof duongA === 'string' && kh.anh === duongA, JSON.stringify(kh && kh.anh));
    const q = await menuQuay(m1);
    k('A8 menu quầy: `anh` = đường dẫn ảnh', !!q && typeof duongA === 'string' && q.anh === duongA, JSON.stringify(q && q.anh));
    k('A9 menu KHÔNG chứa byte / base64 ảnh (không nhúng, không lộ cột)', !JSON.stringify(kh || {}).includes('du_lieu') && JSON.stringify([kh, q]).length < 6000);
    const hang = await db.queryOne('SELECT kieu, co, phien_ban FROM pos_anh_mon WHERE product_id = ?', [m1]).catch(() => null);
    k('A10 CSDL: kiểu image/jpeg, cỡ 81920 byte', !!hang && hang.kieu === 'image/jpeg' && Number(hang.co) === 80 * KB, JSON.stringify(hang));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] Kiểm kiểu THẬT bằng byte đầu — không tin đuôi / Content-Type khách khai');
  await chay('B', async () => {
    const r1 = await tai(m2, pdf(3 * KB));
    k('B1 PDF khai image/jpeg → 400 ANH_KHONG_HOP_LE', la(r1, 400, 'ANH_KHONG_HOP_LE'), moTa(r1));
    k('B2 PDF bị từ chối KHÔNG để lại hàng ảnh', (await soHang(m2)) === 0);
    const r2 = await tai(m2, wav(4 * KB), { kieu: 'image/webp' });
    k('B3 RIFF…WAVE khai image/webp → 400 (WebP cần "WEBP" ở byte 8)', la(r2, 400, 'ANH_KHONG_HOP_LE'), moTa(r2));
    const r3 = await tai(m2, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), { kieu: 'image/png' });
    k('B4 SVG khai image/png → 400', la(r3, 400, 'ANH_KHONG_HOP_LE'), moTa(r3));
    const r4 = await tai(m2, Buffer.alloc(0));
    k('B5 thân rỗng → 400', la(r4, 400), moTa(r4));
    const r5 = await tai(m2, JSON.stringify({ anh: 'x' }), { kieu: 'application/json' });
    k('B6 thân JSON (không phải byte ảnh) → 400', la(r5, 400), moTa(r5));
    const r6 = await tai(m2, png(5 * KB), { kieu: 'text/plain' });
    k('B7 PNG thật nhưng khai text/plain → vẫn nhận (kiểu theo byte), nhớ image/png', la(r6, 200) && !!r6.j.anh, moTa(r6));
    const d6 = r6.j.anh ? await goi('GET', r6.j.anh) : { h: new Map(), status: 0 };
    k('B8 đọc lại PNG: Content-Type image/png', d6.status === 200 && d6.h.get('content-type') === 'image/png', String(d6.h.get('content-type')));
    const r7 = await tai(m2, webp(5 * KB), { kieu: 'image/webp' });
    k('B9 WebP thật → 200', la(r7, 200) && !!r7.j.anh, moTa(r7));
    const d7 = r7.j.anh ? await goi('GET', r7.j.anh) : { h: new Map(), status: 0 };
    k('B10 đọc lại WebP: Content-Type image/webp', d7.status === 200 && d7.h.get('content-type') === 'image/webp', String(d7.h.get('content-type')));
    const r8 = await tai(m2, Buffer.from([0xff, 0xd8, 0xfe, 1, 2, 3, 4, 5]));
    k('B11 byte đầu FFD8FE (không phải FFD8FF) → 400 (so đủ ba byte, không chỉ hai)', la(r8, 400, 'ANH_KHONG_HOP_LE'), moTa(r8));
    await xoa(m2);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] Giới hạn 120 KB — thử cả hai phía ranh giới');
  await chay('C', async () => {
    const vua = await tai(m2, jpeg(GIOI_HAN, 'vua'));
    k('C1 đúng 120 KB → 200', la(vua, 200), moTa(vua));
    const qua = await tai(m2, jpeg(GIOI_HAN + 1, 'qua'));
    k('C2 120 KB + 1 byte → 413 ANH_QUA_LON', la(qua, 413, 'ANH_QUA_LON'), moTa(qua));
    k('C3 bị 413 thì ảnh cũ GIỮ NGUYÊN (không xoá, không ghi dở)', (await soHang(m2)) === 1 && (await goi('GET', vua.j.anh || '/x')).status === 200);
    const to = await tai(m2, jpeg(121 * KB, 'to'));
    k('C4 121 KB → 413 ANH_QUA_LON (ca phiếu)', la(to, 413, 'ANH_QUA_LON'), moTa(to));
    const khung = await tai(m2, jpeg(3 * 1024 * KB, 'khung'));
    k('C5 3 MB → 413 ANH_QUA_LON (không đọc hết thân vào RAM)', la(khung, 413, 'ANH_QUA_LON'), moTa(khung));
    await xoa(m2);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] Quyền — chỉ người được sửa món tải / xoá');
  await chay('D', async () => {
    const truoc = await soHang(m1);
    const r1 = await tai(m1, jpeg(2 * KB, 'nv'), { tk: tkNv });
    k('D1 nhân viên bị gỡ quyền tải → 403', la(r1, 403), moTa(r1));
    const r2 = await tai(m1, jpeg(2 * KB, 'kt'), { tk: null });
    k('D2 không đăng nhập tải → 401', la(r2, 401), moTa(r2));
    const r3 = await xoa(m1, tkNv);
    k('D3 nhân viên xoá → 403', la(r3, 403), moTa(r3));
    const r4 = await xoa(m1, null);
    k('D4 không đăng nhập xoá → 401', la(r4, 401), moTa(r4));
    const d = duongA ? await goi('GET', duongA) : { status: 0 };
    k('D5 sau bốn lần bị chặn ảnh cũ còn nguyên (đọc 200, số hàng không đổi)', d.status === 200 && (await soHang(m1)) === truoc && truoc === 1, `${d.status} · ${truoc} → ${await soHang(m1)}`);
    const r5 = await tai(999999, jpeg(2 * KB));
    k('D6 món không có → 404', la(r5, 404), moTa(r5));
    const r6 = await goi('PUT', '/api/pos/products/abc/anh', { tk: tkChu, kieu: 'image/jpeg', than: jpeg(2 * KB) });
    k('D7 mã món không phải số → không tải được (không 200)', r6.status !== 200, moTa(r6));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] Một ảnh / món · đổi ảnh → đường dẫn mới · xoá');
  await chay('E', async () => {
    const a = await tai(m1, jpeg(30 * KB, 'moi'));
    k('E1 tải lại = thay: vẫn MỘT hàng cho món', la(a, 200) && (await soHang(m1)) === 1, `${moTa(a)} · ${await soHang(m1)} hàng`);
    k('E2 đổi ảnh → đường dẫn KHÁC', !!a.j.anh && a.j.anh !== duongA, `${duongA} → ${a.j.anh}`);
    const cu = duongA ? await goi('GET', duongA) : { status: 0 };
    k('E3 đường dẫn CŨ không còn phục vụ (404, không trả ảnh khác dưới tên cũ)', cu.status === 404, `HTTP ${cu.status}`);
    const lai = await tai(m1, jpeg(30 * KB, 'moi'));
    k('E4 tải đúng byte cũ lần nữa → CÙNG đường dẫn (phiên bản theo nội dung)', la(lai, 200) && lai.j.anh === a.j.anh, `${a.j.anh} / ${lai.j.anh}`);
    const sai = a.j.anh ? a.j.anh.replace(/\/[^/]+$/, '/000000000000') : '/x';
    k('E5 đúng món, sai phiên bản → 404', (await goi('GET', sai)).status === 404);
    const lap = a.j.anh ? a.j.anh.replace(/\/anh\/\d+\//, '/anh/999999/') : '/x';
    k('E6 món không có ảnh → 404', (await goi('GET', lap)).status === 404);
    const kh1 = await menuKh('juice_901');
    k('E7 menu App theo ảnh MỚI', !!kh1 && kh1.anh === a.j.anh, JSON.stringify(kh1 && kh1.anh));
    const x = await xoa(m1);
    k('E8 xoá → 200, hết hàng ảnh', la(x, 200) && (await soHang(m1)) === 0, moTa(x));
    k('E9 sau xoá: /api/kh/menu `anh: null`', (await menuKh('juice_901'))?.anh === null);
    k('E10 sau xoá: menu quầy `anh: null`', (await menuQuay(m1))?.anh === null);
    k('E11 sau xoá: đường dẫn cũ 404', (await goi('GET', a.j.anh || '/x')).status === 404);
    const x2 = await xoa(m1);
    k('E12 xoá lần nữa (chưa có ảnh) → 200, lặp lại được', la(x2, 200), moTa(x2));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] K5 — luồng hợp lệ: món không ảnh · App cũ · kho ảnh hỏng không làm chết menu');
  await chay('F', async () => {
    const kh = await menuKh('tea_902');
    k('F1 món không ảnh: /api/kh/menu `anh: null` (không undefined, không "")', !!kh && kh.anh === null, JSON.stringify(kh && kh.anh));
    k('F2 bộ khoá món trong /api/kh/menu KHÔNG đổi (14 khoá, như hợp đồng)', !!kh && JSON.stringify(Object.keys(kh).sort()) === JSON.stringify(KHOA_MENU_MOI), Object.keys(kh || {}).join(','));
    const q = await menuQuay(m2);
    k('F3 menu quầy: món không ảnh `anh: null`', !!q && q.anh === null, JSON.stringify(q && q.anh));
    const sp = await goi('GET', '/api/pos/kho/san-pham', { tk: tkChu });
    k('F4 Kho › Sản phẩm: mỗi món có khoá `anh` (null khi chưa có)', la(sp, 200) && (sp.j.san_pham || []).length > 0 && (sp.j.san_pham || []).every((p) => 'anh' in p), moTa(sp));
    const a = await tai(m1, jpeg(10 * KB, 'kho'));
    const sp2 = await goi('GET', '/api/pos/kho/san-pham', { tk: tkChu });
    k('F5 Kho › Sản phẩm: món có ảnh trả đúng đường dẫn', (sp2.j.san_pham || []).find((p) => p.id === m1)?.anh === a.j.anh && typeof a.j.anh === 'string');
    await db.run('ALTER TABLE pos_anh_mon RENAME TO pos_anh_mon_hong');   // giả lập bước 037 hỏng / bảng mất
    const q2 = await goi('GET', '/api/kh/menu');
    const q3 = await goi('GET', '/api/pos/products', { tk: tkChu });
    k('F6 kho ảnh hỏng: /api/kh/menu VẪN 200, đủ món, `anh: null` (ảnh không được làm chết menu)',
      la(q2, 200) && (q2.j.data || []).length >= 2 && (q2.j.data || []).every((m) => m.anh === null), moTa(q2));
    k('F7 kho ảnh hỏng: menu quầy VẪN 200, đủ món', la(q3, 200) && Array.isArray(q3.j) && q3.j.length >= 2, moTa(q3));
    await db.run('ALTER TABLE pos_anh_mon_hong RENAME TO pos_anh_mon');
    await xoa(m1);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] Bước 037 — bảng ảnh; sao lưu Excel không mang ảnh (A5)');
  await chay('G', async () => {
    const cot = (await db.query('PRAGMA table_info(pos_anh_mon)')).map((c) => c.name).sort();
    k('G1 pos_anh_mon có đủ cột product_id, kieu, du_lieu, co, phien_ban, sua_luc', ['co', 'du_lieu', 'kieu', 'phien_ban', 'product_id', 'sua_luc'].every((c) => cot.includes(c)), cot.join(','));
    const so = (await db.query('SELECT so FROM pos_nang_cap ORDER BY so')).map((r) => r.so);
    k('G2 pos_nang_cap ghi bước 37', so.includes(37), JSON.stringify(so));
    const coBang = !!(await db.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = 'pos_anh_mon'"));
    let trung = false;
    try { imLang(); await db.run("INSERT INTO pos_anh_mon (product_id, kieu, du_lieu, co, phien_ban, sua_luc) VALUES (?, 'image/png', 'x', 1, 'a', 'b')", [m1]);
      await db.run("INSERT INTO pos_anh_mon (product_id, kieu, du_lieu, co, phien_ban, sua_luc) VALUES (?, 'image/png', 'x', 1, 'a', 'b')", [m1]); } catch { trung = true; } finally { noiLai(); }
    k('G3 product_id UNIQUE — hai hàng cho một món bị CSDL từ chối', coBang && trung);
    await db.run('DELETE FROM pos_anh_mon WHERE product_id = ?', [m1]).catch(() => {});
    const { chayNangCap } = require(path.join(MAY_CHU, 'nang_cap', 'chay.js'));
    imLang();
    const lai = await chayNangCap({ beginTransaction: db.beginTransaction, query: db.query });
    noiLai();
    k('G4 chạy lại bước nâng cấp: không hỏng', lai.hong === null, String(lai.hong));
    k('G5 backup.js (Excel hằng ngày) KHÔNG có bảng ảnh', !/pos_anh_mon/.test(doc('server/routes/backup.js')));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[H] Giao diện — thu nhỏ ở máy, ô ảnh quầy, hoá đơn không ảnh');
  await chay('H', async () => {
    const sp = docCl('pages/Kho/SanPham.jsx');
    const bh = docCl('pages/BanHang/BanHangMoi.jsx');
    const am = docCl('pages/BanHang/AnhMon.jsx');
    k('H1 SanPham.jsx: hằng số có tên 400 × 400 và chất lượng 0,7 MỘT chỗ', /CO_ANH\s*=\s*400\b/.test(sp) && /CHAT_LUONG_ANH\s*=\s*0\.7\b/.test(sp));
    k('H2 SanPham.jsx: cắt vuông giữa, WebP rồi JPEG, có nút Xoá ảnh', /toBlob/.test(sp) && /image\/webp/.test(sp) && /image\/jpeg/.test(sp) && /Xoá ảnh/.test(sp));
    k('H3 SanPham.jsx: tải qua api.request (không fetch trần)', /\/anh/.test(sp) && !/\bfetch\s*\(/.test(sp));
    k('H4 AnhMon.jsx: ảnh lười, chỗ giữ chỗ cố định, chữ viết tắt khi chưa có / lỗi', /loading="lazy"/.test(am) && /aspect-ratio|aspectRatio/.test(am + docCl('pages/BanHang/banHang.css')) && /onError/.test(am));
    k('H5 thẻ món (BanHangMoi.jsx) dùng AnhMon', (bh.match(/<AnhMon\b/g) || []).length >= 2, `${(bh.match(/<AnhMon\b/g) || []).length} chỗ`);
    const hd = ['pages/BanHang/ManKetThuc.jsx', 'components/HoaDon.jsx', 'components/BillPrint.jsx'].map(docCl).join('\n');
    k('H6 hoá đơn / tem KHÔNG có ảnh món', !/AnhMon|\.anh\b/.test(hd));
    // Khoá NHÁNH VẼ (K3): dựng AnhMon.jsx thật bằng esbuild rồi vẽ ra HTML — không chỉ dò chuỗi trong mã.
    let ve = null;
    try {
      const esbuild = require(path.join(GOC, 'client', 'node_modules', 'esbuild'));
      const nguon = path.join(CLIENT, 'pages', 'BanHang', 'AnhMon.jsx');
      const kq = esbuild.buildSync({
        stdin: { contents: `import AnhMon from ${JSON.stringify(nguon)}; import { renderToStaticMarkup } from 'react-dom/server'; import { createElement } from 'react'; export const ve = (p) => renderToStaticMarkup(createElement(AnhMon, p));`,
          resolveDir: path.join(GOC, 'client'), loader: 'js' },
        bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', nodePaths: [path.join(GOC, 'client', 'node_modules')],
        define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent',
      });
      const mo = { exports: {} };
      new Function('module', 'exports', 'require', kq.outputFiles[0].text)(mo, mo.exports, require);
      ve = mo.exports.ve;
    } catch (e) { k('H7 dựng được AnhMon.jsx để vẽ thử', false, e.message); }
    if (ve) {
      const coAnh = ve({ anh: '/api/pos/products/anh/5/abcdef012345', ten: 'Thanh Tân Dưỡng', kich: 48 });
      k('H7 có ảnh: vẽ <img> đúng đường dẫn, ảnh lười, khung 48 × 48 viết sẵn', /<img[^>]*src="\/api\/pos\/products\/anh\/5\/abcdef012345"/.test(coAnh) && /loading="lazy"/.test(coAnh) && /width:48px;height:48px/.test(coAnh), coAnh.slice(0, 200));
      const khong = ve({ anh: null, ten: 'Thanh Tân Dưỡng' });
      k('H8 chưa có ảnh (null): KHÔNG <img>, hiện chữ viết tắt "TT", khung 44 × 44 mặc định', !/<img/.test(khong) && />TT</.test(khong) && /width:44px;height:44px/.test(khong), khong.slice(0, 200));
      const rong = ve({ anh: '', ten: 'Cà phê' });
      k('H9 ảnh chuỗi rỗng: KHÔNG <img>, chữ viết tắt "CP"', !/<img/.test(rong) && />CP</.test(rong), rong.slice(0, 200));
      k('H10 cùng tên → cùng màu nền (không nhảy màu mỗi lần vẽ)', ve({ anh: null, ten: 'Ôn Dương Lộ' }) === ve({ anh: null, ten: 'Ôn Dương Lộ' }));
    }
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[I] Hợp đồng /api/kh — nghĩa mới của `anh`');
  await chay('I', async () => {
    const hd = doc('HOP_DONG_API_KH.md');
    const dau = Number((hd.match(/^PHIEN_BAN:\s*(\d+)/m) || [])[1]);
    k('I1 PHIEN_BAN ≥ 19', dau >= 19, String(dau));
    k('I2 nhật ký có dòng v19 nhắc ANH-MON-1', /^- v19 · .*ANH-MON-1/m.test(hd));
    k('I3 ghi nghĩa mới: `anh` = đường dẫn ảnh hoặc null (không còn "luôn null")', /ANH-MON-1/.test(hd) && !/`anh` \(luôn\s*`null`/.test(hd.split('## Nhật ký')[0].replace(/\s+/g, ' ')));   // nhật ký v4 là lịch sử, giữ nguyên
    k('I4 có file báo App KH', fs.existsSync(path.join(GOC, 'viec', 'ANH-MON-1', 'BAO_APPKH.md')));
  });

  sv.close();
  ket();
}

function ket() {
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
