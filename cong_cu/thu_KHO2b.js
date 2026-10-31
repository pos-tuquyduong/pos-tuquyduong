#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KHO-2b — đặt hàng (DH) có hạn mức · nhận hàng (PN theo đơn / mua lẻ) người KHÁC duyệt · xử lý phát sinh (PS) · tồn
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_KHO2b.js [--may-chu <thư mục server>]
 *  Khuôn thu_KHO2a.js: database.js thật + libsql trên kho TẠM, route thật qua app.listen(0), JWT theo vai trò, SX giả,
 *  TZ=UTC, đồng hồ thay trong tiến trình (`datGio('YYYY-MM-DDTHH:mm:ss')` = giờ Việt Nam).
 *  Ca đua: bên thua 409 PHIEU_DA_XU_LY hoặc KHO_BAN — điều ĐẠT là sổ chỉ ghi MỘT lần.
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_kho2b_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const DateGoc = Date;
let gioGia = null;
global.Date = class extends DateGoc {
  constructor(...a) { if (a.length) super(...a); else super(gioGia ?? DateGoc.now()); }
  static now() { return gioGia ?? DateGoc.now(); }
};
const datGio = (vn) => { gioGia = vn ? DateGoc.parse(vn + '+07:00') : null; };

const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
process.env.JWT_SECRET = 'thu_kho2b_' + DateGoc.now();

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const doc = (duong) => { try { return fs.readFileSync(duong, 'utf8'); } catch { return ''; } };
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const nap = (ten) => { try { return require(path.join(MAY_CHU, ten)); } catch (e) { return { loiNap: e.message }; } };
const gan = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-9;
const KHOA_TIEN = ['gia_nhap', 'don_gia', 'gia_von', 'tong_uoc_tinh', 'gia_tri', 'da_dung', 'han_muc'];
/** Mọi khoá tiền ở MỌI tầng của một phản hồi (nhân viên phải ra rỗng). */
const khoaTien = (x, ra = new Set()) => {
  if (Array.isArray(x)) x.forEach((v) => khoaTien(v, ra));
  else if (x && typeof x === 'object') for (const [kh, v] of Object.entries(x)) { if (KHOA_TIEN.includes(kh)) ra.add(kh); khoaTien(v, ra); }
  return ra;
};

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();
  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => false, checkStock: async () => ({ sufficient: true, stock: 999 }),
    outStockFIFO: async () => ({ ok: true }), inStockReturn: async () => ({ ok: true }), callSxApi: async () => ({ ok: true }) };
  const app = express();
  app.use(express.json());
  app.use('/api/pos/settings', require(path.join(MAY_CHU, 'routes', 'settings.js')));
  app.use('/api/pos/backup', require(path.join(MAY_CHU, 'routes', 'backup.js')));
  const kho = nap('kho/duong.js');
  if (typeof kho === 'function') app.use('/api/pos/kho', kho);
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();

  const q = (sql, a = []) => db.query(sql, a).catch(() => []);
  const ghiDb = (sql, a = []) => db.run(sql, a).catch(() => null);
  const mot = async (sql, a = []) => db.queryOne(sql, a).catch(() => null);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const nguoi = { chu: (await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1")).id };
  const tenDN = { chu: (await mot('SELECT username FROM pos_users WHERE id = ?', [nguoi.chu])).username };
  for (const [ai, ten, vaiTro] of [['ql', 'ql_a', 'manager'], ['ql2', 'ql_b', 'manager'], ['nv', 'nv_a', 'staff'], ['nv2', 'nv_b', 'staff']]) {
    nguoi[ai] = Number((await ghiDb("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)", [ten, ten, vaiTro])).lastInsertRowid);
    tenDN[ai] = ten;
  }
  await ghiDb("INSERT OR REPLACE INTO pos_permissions (role, permission, allowed) VALUES ('manager', 'manage_settings', 1)");
  const the = Object.fromEntries(Object.entries(nguoi).map(([a, id]) => [a, jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '3650d' })]));
  const goi = async (ai, method, url, body) => {
    imLang();
    try {
      const headers = ai ? { Authorization: 'Bearer ' + the[ai] } : {};
      if (body) headers['Content-Type'] = 'application/json';
      const r = await fetch(goc + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;

  console.log('\nTHỬ KHO-2b — đặt hàng · nhận hàng · phát sinh');

  // ── Dữ liệu nền ──
  datGio('2026-11-07T08:00:00');
  const themNL = async (ten, heSo, gia, toiThieu, han) => Number((await ghiDb(`INSERT INTO kho_nguyen_lieu (ten, ten_chuan, nhom_id, don_vi_luu, don_vi_hien,
    he_so_doi, gia_nhap, ton_toi_thieu, han_ngay, tao_luc) VALUES (?, ?, ?, 'kg', ?, ?, ?, ?, ?, '2026-11-01T00:00:00')`,
  [ten, ten.toLowerCase(), nhomRau, heSo === 1 ? 'kg' : 'g', heSo, gia, toiThieu, han]))?.lastInsertRowid);
  const nhomRau = Number((await ghiDb("INSERT INTO kho_nhom_nguyen_lieu (ten, thu_tu) VALUES ('Rau củ quả', 1)"))?.lastInsertRowid);
  const n1 = await themNL('Cam', 1, 30000, 5, 3);
  const n2 = await themNL('Kỷ tử', 0.001, 90000, null, null);
  const n3 = await themNL('Đường', 1, null, null, null);
  const n4 = await themNL('Gừng', 1, 20000, null, null);
  const themSP = async (code, ten) => Number((await ghiDb("INSERT INTO pos_products (code, name, category, price, is_active) VALUES (?, ?, 'juice', 30000, 1)", [code, ten]))?.lastInsertRowid);
  const s1 = await themSP('K2B1', 'Nước cam');
  const s2 = await themSP('K2B2', 'Trà gừng');
  const s3 = await themSP('K2B3', 'Cà phê pha');
  const s4 = await themSP('K2B4', 'Siro đường');
  const luuSP = (id, than) => goi('chu', 'PUT', `/kho/san-pham/${id}`, than);
  await luuSP(s1, { kieu: 'lam_san', han_ngay: 1, cong_thuc: [{ nguyen_lieu_id: n1, luong: 0.2 }, { nguyen_lieu_id: n4, luong: 0.05 }] });
  await luuSP(s2, { kieu: 'lam_san', cong_thuc: [{ nguyen_lieu_id: n4, luong: 0.1 }, { nguyen_lieu_id: n2, luong: 0.005 }] });
  await luuSP(s3, { kieu: 'pha_tai_cho', cong_thuc: [{ nguyen_lieu_id: n1, luong: 0.01 }, { nguyen_lieu_id: n2, luong: 0.002 }] });
  await luuSP(s4, { kieu: 'lam_san', cong_thuc: [{ nguyen_lieu_id: n3, luong: 0.1 }] });

  const taoDH = (ai, than, maGui) => goi(ai, 'POST', '/kho/phieu-dat', { ...than, ma_gui: maGui });
  const taoPN = (ai, than, maGui) => goi(ai, 'POST', '/kho/phieu-nhan', { ...than, ma_gui: maGui });
  const taoPS = (ai, than, maGui) => goi(ai, 'POST', '/kho/phieu-phat-sinh', { ...than, ma_gui: maGui });
  const duyet = (ai, id) => goi(ai, 'POST', `/kho/phieu/${id}/duyet`);
  const caiDat = (ai, khoa, v) => goi(ai, 'PUT', '/settings', { settings: { [khoa]: v } });
  const tonDoc = async () => goi('ql', 'GET', '/kho/ton');
  const ton = async (id) => Number(((await tonDoc()).nguyen_lieu || []).find((x) => x.id === id)?.ton);
  const tonTP = async (id) => Number(((await tonDoc()).thanh_pham || []).find((x) => x.san_pham_id === id)?.ton ?? 0);
  const tonTat = async () => { const r = await tonDoc(); return Object.fromEntries([n1, n2, n3, n4].map((id) => [id, Number((r.nguyen_lieu || []).find((x) => x.id === id)?.ton)])); };
  const bang = (a, b) => [n1, n2, n3, n4].every((id) => gan(a[id], b[id]));
  const dongCua = (pid) => q('SELECT * FROM kho_phieu_dong WHERE phieu_id = ? ORDER BY id', [pid || 0]);
  const demLo = () => so('SELECT COUNT(*) FROM kho_lo');
  const demPhieu = (loai) => so('SELECT COUNT(*) FROM kho_phieu WHERE loai = ?', [loai]);
  const ttCua = async (id) => (await mot('SELECT trang_thai FROM kho_phieu WHERE id = ?', [id || 0]))?.trang_thai;
  const thua = (r) => r.status === 409 && ['PHIEU_DA_XU_LY', 'KHO_BAN'].includes(r.code);
  const DH_MAU = { mon: [{ san_pham_id: s1, so_phan: 10 }, { san_pham_id: s2, so_phan: 4 }], nguyen_lieu: [{ nguyen_lieu_id: n4, luong: 0.1 }] };

  // ═════════════════════════════════════════════════════════════════════════
  muc('[0] bước nâng cấp 007');
  const cot = async (b) => (await q(`PRAGMA table_info(${b})`)).map((c) => c.name);
  k('N1 bước 007 đã chạy: kho_phieu.don_id, kho_phieu.su_co, kho_phieu_dong.han_dung có', (await so('SELECT COUNT(*) FROM pos_nang_cap WHERE so = 7')) === 1
    && (await cot('kho_phieu')).includes('don_id') && (await cot('kho_phieu')).includes('su_co') && (await cot('kho_phieu_dong')).includes('han_dung'));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] đơn đặt hàng');
  const ton0 = await tonTat();
  const a1 = await taoDH('ql', DH_MAU, 'g-a1');
  const dongA1 = await dongCua(a1.phieu?.id);
  const luongA1 = (id) => dongA1.filter((d) => Number(d.nguyen_lieu_id) === id).map((d) => Number(d.so_luong));
  k('A1 theo công thức: Nước cam ×10 + Trà gừng ×4 → Cam 2 · Gừng 0.5 + 0.4 gộp · Kỷ tử 0.02 (MỘT dòng mỗi nguyên liệu)', a1.status === 200
    && dongA1.length === 3 && gan(luongA1(n1)[0], 2) && luongA1(n1).length === 1 && gan(luongA1(n2)[0], 0.02), `${moTa(a1)} ${JSON.stringify(dongA1.map((d) => [d.nguyen_lieu_id, d.so_luong]))}`);
  k('A2 nguyên liệu lẻ trùng (Gừng +0.1) gộp vào dòng công thức → Gừng 1.0', luongA1(n4).length === 1 && gan(luongA1(n4)[0], 1), JSON.stringify(luongA1(n4)));
  k('A11 phiếu đơn chỉ ghi lượng: dòng loại "dat", KHÔNG cho_mon_id, không dòng thành phẩm', dongA1.every((d) => d.loai === 'dat' && d.cho_mon_id === null && d.san_pham_id === null));
  k('A12 đơn giá = giá nhập lúc đặt; tổng ước tính 2×30.000 + 1×20.000 + 0.02×90.000 = 81.800 (quản lý thấy)', dongA1.length === 3
    && Number(dongA1.find((d) => Number(d.nguyen_lieu_id) === n1)?.don_gia) === 30000 && Number(a1.phieu?.tong_uoc_tinh) === 81800, JSON.stringify(a1.phieu));
  k('A7 không có Cài đặt hạn mức → mặc định 500.000: quản lý đặt 81.800 → tự duyệt', a1.phieu?.trang_thai === 'da_duyet' && a1.phieu?.nguoi_duyet === 'ql_a', JSON.stringify(a1.phieu));
  k('A9 đơn đã duyệt KHÔNG đổi tồn', bang(await tonTat(), ton0), JSON.stringify([ton0, await tonTat()]));
  const a7a = await taoDH('ql', { nguyen_lieu: [{ nguyen_lieu_id: n4, luong: 25 }] }, 'g-a7a');
  const a7b = await taoDH('ql', { nguyen_lieu: [{ nguyen_lieu_id: n4, luong: 25.00005 }] }, 'g-a7b');
  k('A7b mặc định: 25 kg Gừng = 500.000 → tự duyệt; 500.001 → chờ duyệt', a7a.phieu?.trang_thai === 'da_duyet' && a7b.phieu?.trang_thai === 'cho_duyet',
    `${a7a.phieu?.trang_thai || moTa(a7a)} | ${a7b.phieu?.trang_thai || moTa(a7b)}`);
  const a10 = [await caiDat('ql', 'kho_han_muc_dat_hang', '81800'), await caiDat('chu', 'kho_han_muc_dat_hang', '-1'), await caiDat('chu', 'kho_han_muc_dat_hang', 'abc'),
    await caiDat('chu', 'kho_han_muc_dat_hang', '1.5')];
  k('A10 hạn mức đặt hàng: quản lý đổi → 403; âm / chữ / số lẻ → 400; không ghi', a10[0].status === 403 && a10.slice(1).every((r) => r.status === 400)
    && (await mot("SELECT value FROM pos_settings WHERE key = 'kho_han_muc_dat_hang'")) === null, a10.map(moTa).join(' | '));
  const a4c = await caiDat('chu', 'kho_han_muc_dat_hang', '81800');
  const a4a = await taoDH('ql', DH_MAU, 'g-a4a');
  await caiDat('chu', 'kho_han_muc_dat_hang', '81799');
  const a4b = await taoDH('ql', DH_MAU, 'g-a4b');
  k('A4 quản lý: tổng = hạn mức 81.800 → tự duyệt; hạn mức 81.799 (tổng vượt 1 đồng) → chờ duyệt', a4c.status === 200 && a4a.phieu?.trang_thai === 'da_duyet'
    && a4b.phieu?.trang_thai === 'cho_duyet', `${moTa(a4c)} | ${a4a.phieu?.trang_thai} | ${a4b.phieu?.trang_thai}`);
  const a5a = await duyet('ql2', a4b.phieu?.id);
  const a5d = await goi('ql2', 'GET', `/kho/phieu/${a4b.phieu?.id}`);
  const a5b = await duyet('chu', a4b.phieu?.id);
  k('A5 đơn trên hạn mức: quản lý khác duyệt → 403 CAN_CHU_QUAN (phiếu báo can_chu_quan); chủ quán duyệt → 200', a5a.status === 403 && a5a.code === 'CAN_CHU_QUAN'
    && a5d.phieu?.can_chu_quan === true && a5b.status === 200 && a5b.phieu?.trang_thai === 'da_duyet', `${moTa(a5a)} | ${a5d.phieu?.can_chu_quan} | ${moTa(a5b)}`);
  const dsQL = await goi('ql', 'GET', '/kho/phieu?trang_thai=cho_duyet');
  k('A5b danh sách chờ duyệt: đơn trên hạn mức có cờ can_chu_quan (quản lý không đếm vào huy hiệu)',
    (dsQL.phieu || []).some((p) => p.id === a7b.phieu?.id && p.can_chu_quan === true), JSON.stringify((dsQL.phieu || []).map((p) => [p.id, p.loai, p.can_chu_quan])));
  await caiDat('chu', 'kho_han_muc_dat_hang', '81800');
  const a6 = await taoDH('nv', DH_MAU, 'g-a6');
  const a6b = await duyet('ql', a6.phieu?.id);
  k('A6 nhân viên tạo → chờ duyệt; quản lý duyệt (≤ hạn mức) → 200', a6.phieu?.trang_thai === 'cho_duyet' && a6b.status === 200 && a6b.phieu?.trang_thai === 'da_duyet',
    `${a6.phieu?.trang_thai || moTa(a6)} | ${moTa(a6b)}`);
  const a8 = await taoDH('ql', { nguyen_lieu: [{ nguyen_lieu_id: n3, luong: 0.1 }] }, 'g-a8');
  k('A8 nguyên liệu chưa có giá → tổng không tính được → coi như TRÊN hạn mức (quản lý không tự duyệt)', a8.phieu?.trang_thai === 'cho_duyet'
    && a8.phieu?.tong_uoc_tinh === null, JSON.stringify(a8.phieu || moTa(a8)));
  const a3 = await Promise.all([taoDH('ql', { mon: [{ san_pham_id: s1, so_phan: 0 }] }), taoDH('ql', {}), taoDH('ql', { nguyen_lieu: [{ nguyen_lieu_id: n1, luong: -1 }] }),
    taoDH('ql', { nguyen_lieu: [{ nguyen_lieu_id: 999999, luong: 1 }] })]);
  k('A3 đơn rỗng / số phần 0 / lượng âm / nguyên liệu không có → 400', a3.every((r) => r.status === 400), a3.map(moTa).join(' | '));
  const in1 = await goi('nv', 'POST', `/kho/phieu/${a1.phieu?.id}/in`);
  const in2 = await goi('nv', 'POST', `/kho/phieu/${a1.phieu?.id}/in`);
  k('A13 in đơn đã duyệt (gửi nhà cung cấp): lần 1, lần 2 đếm đúng', in1.status === 200 && in1.phieu?.so_lan_in === 1 && in2.phieu?.so_lan_in === 2, `${moTa(in1)} | ${in2.phieu?.so_lan_in}`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B/C] nhận hàng');
  const dh1 = a1.phieu?.id;
  datGio('2026-11-07T09:00:00');
  const tonB = await tonTat();
  const lo0 = await demLo();
  const pn1 = await taoPN('ql', { don_id: dh1, dong: [{ nguyen_lieu_id: n1, luong: 2, don_gia: 31000 }, { nguyen_lieu_id: n4, luong: 0.6, don_gia: 21000, han_dung: '2026-11-20' },
    { nguyen_lieu_id: n3, luong: 1, don_gia: 15000 }], ghi_chu: 'HĐ 123' }, 'g-pn1');
  const pn1id = pn1.phieu?.id;
  const b1 = await duyet('ql', pn1id);
  k('B1 phiếu nhận chờ duyệt; chính người tạo duyệt → 403 TU_DUYET; tồn + lô không đổi', pn1.status === 200 && pn1.phieu?.trang_thai === 'cho_duyet'
    && b1.status === 403 && b1.code === 'TU_DUYET' && (await demLo()) === lo0 && bang(await tonTat(), tonB), `${moTa(pn1)} | ${moTa(b1)}`);
  const goiY1 = await goi('ql', 'GET', '/kho/goi-y-nhap');
  const don1 = (goiY1.don_mo || []).find((d) => d.id === dh1);
  const cl = (d, id) => Number((d?.con_lai || []).find((x) => x.nguyen_lieu_id === id)?.con_lai);
  k('B4 nhận thiếu (phiếu chờ duyệt cũng tính): đơn còn mở — Cam 0 · Gừng 0.4 · Kỷ tử 0.02', !!don1 && gan(cl(don1, n1), 0) && gan(cl(don1, n4), 0.4) && gan(cl(don1, n2), 0.02),
    JSON.stringify(don1 || goiY1.don_mo || moTa(goiY1)));
  const b2 = await duyet('ql2', pn1id);
  const loPN1 = await q('SELECT * FROM kho_lo WHERE phieu_id = ? ORDER BY id', [pn1id || 0]);
  const loCua = (id) => loPN1.find((l) => Number(l.nguyen_lieu_id) === id) || {};
  const tonB2 = await tonTat();
  k('B2 người KHÁC duyệt → mỗi dòng một lô (lượng, giá vốn = giá nhập thật), tồn Cam +2 · Gừng +0.6 · Đường +1', b2.status === 200 && b2.phieu?.trang_thai === 'da_duyet'
    && loPN1.length === 3 && Number(loCua(n1).so_luong) === 2 && Number(loCua(n1).gia_von) === 31000 && gan(tonB2[n1], tonB[n1] + 2) && gan(tonB2[n4], tonB[n4] + 0.6)
    && gan(tonB2[n3], tonB[n3] + 1), `${moTa(b2)} ${JSON.stringify(loPN1)}`);
  k('B7 hạn: trống + nguyên liệu có hạn 3 ngày → 2026-11-10T09:00:00; ngày gõ tay → cuối ngày đó; nguyên liệu không hạn → lô không hạn',
    loCua(n1).han_dung === '2026-11-10T09:00:00' && loCua(n4).han_dung === '2026-11-20T23:59:59' && loCua(n3).han_dung === null, JSON.stringify(loPN1.map((l) => l.han_dung)));
  k('B6 dòng ngoài đơn (Đường) cộng kho, KHÔNG vào phần còn lại của đơn', !(don1?.con_lai || []).some((x) => x.nguyen_lieu_id === n3));
  k('K4 giá nhập của nguyên liệu KHÔNG đổi khi nhận (chủ quán chốt 31.10)', Number((await mot('SELECT gia_nhap FROM kho_nguyen_lieu WHERE id = ?', [n1]))?.gia_nhap) === 30000);
  const pn2 = await taoPN('nv', { don_id: dh1, dong: [{ nguyen_lieu_id: n4, luong: 0.4 }, { nguyen_lieu_id: n2, luong: 0.02 }] }, 'g-pn2');
  const dongSau = (await goi('ql', 'GET', '/kho/goi-y-nhap')).don_mo || [];
  const pn3 = await taoPN('nv', { don_id: dh1, dong: [{ nguyen_lieu_id: n1, luong: 1 }] }, 'g-pn3');
  k('B4b phiếu nhận nốt phần thiếu → đơn đóng (không còn trong danh sách mở); nhận tiếp đơn đã đóng → 409 DON_DA_DONG', pn2.phieu?.trang_thai === 'cho_duyet'
    && !dongSau.some((d) => d.id === dh1) && pn3.status === 409 && pn3.code === 'DON_DA_DONG', `${moTa(pn2)} | ${moTa(pn3)}`);
  const b3a = await goi('ql', 'POST', `/kho/phieu/${pn2.phieu?.id}/tu-choi`, { ly_do: ' ' });
  const tonB3 = await tonTat();
  const b3b = await goi('ql', 'POST', `/kho/phieu/${pn2.phieu?.id}/tu-choi`, { ly_do: 'Hàng dập' });
  const don1b = ((await goi('ql', 'GET', '/kho/goi-y-nhap')).don_mo || []).find((d) => d.id === dh1);
  k('B3 từ chối thiếu lý do → 400; có lý do → huỷ, tồn không đổi', b3a.status === 400 && b3a.code === 'THIEU_LY_DO' && b3b.status === 200
    && b3b.phieu?.trang_thai === 'huy' && bang(await tonTat(), tonB3), `${moTa(b3a)} | ${moTa(b3b)}`);
  k('B5 phiếu nhận bị từ chối → phần đó MỞ LẠI (Gừng 0.4 · Kỷ tử 0.02)', !!don1b && gan(cl(don1b, n4), 0.4) && gan(cl(don1b, n2), 0.02), JSON.stringify(don1b));
  const pn2b = await taoPN('nv', { don_id: dh1, dong: [{ nguyen_lieu_id: n4, luong: 0.4 }, { nguyen_lieu_id: n2, luong: 0.02 }] }, 'g-pn2b');
  await duyet('ql', pn2b.phieu?.id);
  const pnDon = await goi('ql', 'GET', `/kho/phieu/${pn1id}`);
  const dongLech = (pnDon.dong || []).map((d) => [d.nguyen_lieu_id, !!d.lech, !!d.ngoai_don]);
  k('G3 phiếu nhận theo đơn: dòng lệch số đặt (Gừng 0.6 / 1.0) có cờ lech, dòng ngoài đơn có cờ ngoai_don, dòng đủ (Cam 2/2) không cờ',
    JSON.stringify(dongLech) === JSON.stringify([[n1, false, false], [n4, true, false], [n3, false, true]]), JSON.stringify(pnDon.dong || moTa(pnDon)));
  const pn4 = await taoPN('nv', { don_id: a8.phieu?.id, dong: [{ nguyen_lieu_id: n3, luong: 1 }] }, 'g-pn4');
  k('B9 nhận theo đơn CHƯA duyệt → 409 DON_KHONG_MO', pn4.status === 409 && pn4.code === 'DON_KHONG_MO', moTa(pn4));
  // C — mua lẻ
  const c1 = await taoPN('chu', { dong: [{ nguyen_lieu_id: n2, luong: 0.1, don_gia: 95000 }] }, 'g-c1');
  const c1a = await duyet('chu', c1.phieu?.id);
  const tonC = await ton(n2);
  const c1b = await duyet('ql', c1.phieu?.id);
  k('B8/C1 mua lẻ (không đơn): chủ quán tạo vẫn chờ duyệt; chủ quán tự duyệt → 403 TU_DUYET; quản lý duyệt → +0.1', c1.phieu?.trang_thai === 'cho_duyet'
    && c1.phieu?.don_id === null && c1a.status === 403 && c1a.code === 'TU_DUYET' && c1b.status === 200 && gan(await ton(n2), tonC + 0.1), `${moTa(c1)} | ${moTa(c1a)} | ${moTa(c1b)}`);
  const c0 = await Promise.all([taoPN('nv', { dong: [] }), taoPN('nv', { dong: [{ nguyen_lieu_id: n1, luong: 0 }] }), taoPN('nv', { dong: [{ nguyen_lieu_id: n1, luong: 1, han_dung: '7/11' }] }),
    taoPN('nv', { dong: [{ nguyen_lieu_id: n1, luong: 1, don_gia: -5 }] })]);
  k('C0 phiếu nhận sai (không dòng / lượng 0 / hạn sai dạng / giá âm) → 400', c0.every((r) => r.status === 400), c0.map(moTa).join(' | '));
  const goiYnv = await goi('nv', 'GET', '/kho/goi-y-nhap');
  const nlGY = (id) => (goiYnv.nguyen_lieu || []).find((x) => x.id === id) || {};
  k('C2 gợi ý nhập: Cam dưới tối thiểu 5 → cờ; "hay mua" xếp nhiều dòng nhận nhất trước (Gừng 2 · Kỷ tử 2 · Cam / Đường 1); món có công thức kèm lượng 1 phần',
    goiYnv.status === 200 && nlGY(n1).duoi_toi_thieu === true && JSON.stringify((goiYnv.hay_mua || []).slice(0, 2).sort()) === JSON.stringify([n2, n4].sort())
    && gan(((goiYnv.mon || []).find((m) => m.san_pham_id === s1)?.mot_phan || []).find((x) => x.nguyen_lieu_id === n1)?.luong, 0.2),
    `${moTa(goiYnv)} ${JSON.stringify(goiYnv.hay_mua)}`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[H] phiếu xuất dùng lô từ phiếu nhận');
  const pnLe = await taoPN('ql', { dong: [{ nguyen_lieu_id: n1, luong: 0.5, han_dung: '2026-11-01' }, { nguyen_lieu_id: n1, luong: 3, han_dung: '2026-11-30' }] }, 'g-pnle');
  await duyet('ql2', pnLe.phieu?.id);
  const loLe = await q('SELECT id, han_dung FROM kho_lo WHERE phieu_id = ? ORDER BY id', [pnLe.phieu?.id || 0]);
  const loA = Number(loLe[0]?.id);
  const loCam = Number(loCua(n1).id);
  const px1 = await goi('ql', 'POST', '/kho/phieu-xuat', { mon: [{ san_pham_id: s1, so_phan: 2 }], ma_gui: 'g-px1' });
  const xuatN1 = (await dongCua(px1.phieu?.id)).filter((d) => d.loai === 'xuat' && Number(d.nguyen_lieu_id) === n1);
  k('H2/H3 phiếu xuất (KHO-2a) trừ lô của phiếu nhận hạn gần trước (Cam lô 10/11), KHÔNG trừ lô đã quá hạn (01/11)', px1.status === 200
    && JSON.stringify(xuatN1.map((d) => [Number(d.lo_id), Number(d.so_luong)])) === JSON.stringify([[loCam, -0.4]]), `${moTa(px1)} ${JSON.stringify(xuatN1)}`);
  const loS1 = Number((await mot('SELECT id FROM kho_lo WHERE phieu_id = ? AND san_pham_id = ?', [px1.phieu?.id || 0, s1]))?.id);
  const px4 = await goi('ql', 'POST', '/kho/phieu-xuat', { mon: [{ san_pham_id: s4, so_phan: 3 }], ma_gui: 'g-px4' });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] xử lý phát sinh');
  datGio('2026-11-07T12:00:00');
  const gyHH = await goi('nv', 'GET', '/kho/phat-sinh/goi-y?su_co=het_han');
  const loGY = (gyHH.muc || []).map((m) => m.lo_id);
  k('D1 "hết hạn" chỉ gợi ý lô quá / sắp hết hạn: lô Cam 01/11 + lô Nước cam (hạn 08/11 09:00) có; lô Cam 10/11, 30/11 KHÔNG',
    gyHH.status === 200 && loGY.includes(loA) && loGY.includes(loS1) && !loGY.includes(loCam) && !loGY.includes(Number(loLe[1]?.id)), `${moTa(gyHH)} ${JSON.stringify(gyHH.muc)}`);
  const gyNB = await goi('nv', 'GET', '/kho/phat-sinh/goi-y?su_co=noi_bo');
  const kieuNB = (gyNB.muc || []).map((m) => [m.san_pham_id ?? null, m.nguyen_lieu_id ?? null]);
  k('D3 "dùng nội bộ" chỉ gợi ý thành phẩm còn hàng + món pha tại chỗ: Nước cam, Cà phê pha có; nguyên liệu KHÔNG', kieuNB.some(([sp]) => sp === s1)
    && kieuNB.some(([sp]) => sp === s3) && kieuNB.every(([, nl]) => nl === null), JSON.stringify(gyNB.muc || moTa(gyNB)));
  const tonD = await tonTat();
  const d2 = await taoPS('nv', { su_co: 'hong', muc: [{ nguyen_lieu_id: n1, luong: 0.7 }] }, 'g-d2');
  const tonD2 = await tonTat();
  const d2b = await duyet('ql', d2.phieu?.id);
  const psN1 = (await dongCua(d2.phieu?.id)).map((d) => [Number(d.lo_id), Number(d.so_luong)]);
  k('D2 hỏng: nhân viên → chờ duyệt (tồn chưa đổi); duyệt → trừ FEFO KỂ CẢ lô quá hạn: lô 01/11 −0.5 rồi lô 10/11 −0.2', d2.phieu?.trang_thai === 'cho_duyet'
    && bang(tonD2, tonD) && d2b.status === 200 && psN1.length === 2 && psN1[0][0] === loA && gan(psN1[0][1], -0.5) && psN1[1][0] === loCam && gan(psN1[1][1], -0.2)
    && gan(await ton(n1), tonD[n1] - 0.7),
    `${moTa(d2)} | ${moTa(d2b)} ${JSON.stringify(psN1)}`);
  k('D6 phiếu phát sinh có người / giờ / loại chuyện', d2.phieu?.nguoi_tao === 'nv_a' && d2.phieu?.tao_luc === '2026-11-07T12:00:00' && d2.phieu?.su_co === 'hong',
    JSON.stringify(d2.phieu));
  const d10 = await taoPS('ql', { su_co: 'do_vo', muc: [{ nguyen_lieu_id: n4, luong: 0.1 }] }, 'g-d10');
  k('D10 đổ vỡ: quản lý tạo → tự duyệt, dòng có lô', d10.phieu?.trang_thai === 'da_duyet' && (await dongCua(d10.phieu?.id)).every((d) => d.lo_id !== null), moTa(d10));
  const d6 = [await taoPS('nv', { su_co: 'khac', muc: [{ nguyen_lieu_id: n4, luong: 0.1 }] }), await taoPS('nv', { su_co: 'la', muc: [{ nguyen_lieu_id: n4, luong: 0.1 }] }),
    await taoPS('nv', { su_co: 'hong', muc: [] }), await taoPS('nv', { su_co: 'hong', muc: [{ nguyen_lieu_id: n4, luong: 0 }] })];
  k('D6b "khác" thiếu ghi chú / loại lạ / không món / lượng 0 → 400', d6.every((r) => r.status === 400) && d6[0].code === 'THIEU_GHI_CHU', d6.map(moTa).join(' | '));
  const d12 = await taoPS('nv', { su_co: 'het_han', muc: [{ lo_id: loS1, luong: 1 }] }, 'g-d12');
  const tp12 = await tonTP(s1);
  await duyet('ql', d12.phieu?.id);
  const dong12 = await dongCua(d12.phieu?.id);
  k('D12 hết hạn theo lô: trừ đúng lô đã chọn (thành phẩm Nước cam −1)', dong12.length === 1 && Number(dong12[0].lo_id) === loS1 && gan(await tonTP(s1), tp12 - 1),
    JSON.stringify(dong12));
  // D14 (soát lần 1): hai người cùng báo hết hạn phần còn lại của MỘT lô, cả hai chờ duyệt → duyệt phiếu thứ hai phải bị chặn
  const conS1 = Number((await q(`SELECT COALESCE(SUM(d.so_luong), 0) AS c FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id
    WHERE d.lo_id = ? AND p.trang_thai = 'da_duyet'`, [loS1]))[0]?.c);
  const d14a = await taoPS('nv', { su_co: 'het_han', muc: [{ lo_id: loS1, luong: conS1 }] }, 'g-d14a');
  const d14b = await taoPS('nv2', { su_co: 'het_han', muc: [{ lo_id: loS1, luong: conS1 }] }, 'g-d14b');
  const d14x = await duyet('ql', d14a.phieu?.id);
  const d14y = await duyet('ql', d14b.phieu?.id);
  k('D14 hai phiếu hết hạn cùng một lô (đều chờ duyệt): duyệt phiếu 1 → 200; phiếu 2 → 409 KHONG_DU_TON, vẫn chờ duyệt; tồn thành phẩm 0, không âm',
    d14a.phieu?.trang_thai === 'cho_duyet' && d14b.phieu?.trang_thai === 'cho_duyet' && d14x.status === 200 && d14y.status === 409 && d14y.code === 'KHONG_DU_TON'
    && (await ttCua(d14b.phieu?.id)) === 'cho_duyet' && gan(await tonTP(s1), 0), `${conS1} · ${moTa(d14x)} | ${moTa(d14y)} · tồn ${await tonTP(s1)}`);
  const f5t = await tonTat();
  const f5 = [await goi('ql2', 'POST', `/kho/phieu/${d14b.phieu?.id}/tu-choi`, { ly_do: 'Trùng phiếu' }), await goi('ql2', 'POST', `/kho/phieu/${a8.phieu?.id}/tu-choi`, { ly_do: 'Không cần' })];
  k('F5 từ chối phiếu phát sinh và đơn đặt hàng → huỷ, tồn không đổi', f5.every((r) => r.status === 200 && r.phieu?.trang_thai === 'huy') && bang(await tonTat(), f5t)
    && gan(await tonTP(s1), 0), f5.map(moTa).join(' | '));
  // nội bộ — hạn mức theo người / ngày
  await caiDat('chu', 'kho_px_nv_can_duyet', '0');
  const d8 = [await caiDat('ql', 'kho_han_muc_noi_bo', '960'), await caiDat('chu', 'kho_han_muc_noi_bo', '-1'), await caiDat('chu', 'kho_han_muc_noi_bo', 'x')];
  k('D8 hạn mức nội bộ: quản lý đổi → 403; âm / chữ → 400', d8[0].status === 403 && d8[1].status === 400 && d8[2].status === 400, d8.map(moTa).join(' | '));
  await caiDat('chu', 'kho_han_muc_noi_bo', '960');
  const nb = (ai, g, sl = 1) => taoPS(ai, { su_co: 'noi_bo', muc: [{ san_pham_id: s3, luong: sl }] }, g);
  const d4a = await nb('nv', 'g-d4a');
  const d4b = await nb('nv', 'g-d4b');
  const d4c = await nb('nv', 'g-d4c');
  const d4d = await nb('nv2', 'g-d4d');
  k('D4 nội bộ 480 đ/ly, hạn mức 960/người/ngày (công tắc tắt): ly 1, 2 (= hạn mức) tự duyệt; ly 3 → chờ duyệt; người khác không cộng dồn',
    d4a.phieu?.trang_thai === 'da_duyet' && d4b.phieu?.trang_thai === 'da_duyet' && d4c.phieu?.trang_thai === 'cho_duyet' && d4d.phieu?.trang_thai === 'da_duyet',
    [d4a, d4b, d4c, d4d].map((r) => r.phieu?.trang_thai || moTa(r)).join(' | '));
  const dong4 = (await dongCua(d4a.phieu?.id)).map((d) => [Number(d.nguyen_lieu_id), Number(d.so_luong), Number(d.cho_mon_id)]);
  k('D5 món pha tại chỗ dùng nội bộ → trừ nguyên liệu theo công thức (Cam −0.01, Kỷ tử −0.002, cho_mon_id = món)', dong4.length === 2
    && dong4.some(([n, sl, m]) => n === n1 && gan(sl, -0.01) && m === s3) && dong4.some(([n, sl, m]) => n === n2 && gan(sl, -0.002) && m === s3), JSON.stringify(dong4));
  datGio('2026-11-08T07:00:00');
  const d4e = await nb('nv', 'g-d4e');
  k('D4b sang ngày mới (giờ VN) → hạn mức tính lại, tự duyệt', d4e.phieu?.trang_thai === 'da_duyet', d4e.phieu?.trang_thai || moTa(d4e));
  const tonD9 = await tonTat();
  const d9a = await duyet('nv', d4c.phieu?.id);
  const d9b = await duyet('ql', d4c.phieu?.id);
  k('D9 phiếu vượt hạn mức: nhân viên duyệt → 403; quản lý duyệt → trừ kho', d9a.status === 403 && d9b.status === 200 && gan(await ton(n1), tonD9[n1] - 0.01), `${moTa(d9a)} | ${moTa(d9b)}`);
  const d11 = await taoPS('nv', { su_co: 'noi_bo', muc: [{ san_pham_id: s4, luong: 1 }] }, 'g-d11');
  k('D11 món chưa có giá vốn (Siro đường — Đường chưa có giá) → coi như vượt hạn mức, chờ duyệt', px4.status === 200 && d11.phieu?.trang_thai === 'cho_duyet',
    d11.phieu?.trang_thai || moTa(d11));
  const psTruoc = await demPhieu('PS');
  const d13 = await taoPS('nv', { su_co: 'hong', muc: [{ san_pham_id: s1, luong: 999 }] }, 'g-d13');
  k('D13 thành phẩm không đủ lô để trừ → 409 KHONG_DU_TON, không ghi phiếu', d13.status === 409 && d13.code === 'KHONG_DU_TON' && (await demPhieu('PS')) === psTruoc, moTa(d13));
  await caiDat('chu', 'kho_px_nv_can_duyet', '1');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E/F] bấm hai lần · số phiếu · giá · sửa / huỷ · đua');
  const e1 = [];
  for (const [loai, tao, than] of [['DH', taoDH, { nguyen_lieu: [{ nguyen_lieu_id: n4, luong: 1 }] }], ['PN', taoPN, { dong: [{ nguyen_lieu_id: n4, luong: 1 }] }],
    ['PS', taoPS, { su_co: 'hong', muc: [{ nguyen_lieu_id: n4, luong: 0.01 }] }]]) {
    const truoc = await demPhieu(loai);
    const r = await Promise.all([tao('nv', than, 'g-e1-' + loai), tao('nv', than, 'g-e1-' + loai)]);
    const id = r.find((x) => x.phieu)?.phieu?.id;
    e1.push(`${loai}:${(await demPhieu(loai)) - truoc}:${r.filter((x) => x.status === 200).every((x) => x.phieu?.id === id) && r.every((x) => x.status === 200 || x.code === 'KHO_BAN')}`);
  }
  k('E1 bấm hai lần cùng ma_gui (song song) → MỘT phiếu cho DH, PN, PS', JSON.stringify(e1) === '["DH:1:true","PN:1:true","PS:1:true"]', JSON.stringify(e1));
  k('E2 số phiếu theo loại + ngày VN: DH-261107-001, PN-261107-001, PS-261107-001', a1.phieu?.so_phieu === 'DH-261107-001' && pn1.phieu?.so_phieu === 'PN-261107-001'
    && d2.phieu?.so_phieu === 'PS-261107-001', [a1.phieu?.so_phieu, pn1.phieu?.so_phieu, d2.phieu?.so_phieu].join(' '));
  const e3 = { dh: a6, pn: pn2, ps: d4a, gy: goiYnv, gyps: gyNB, xemDH: await goi('nv', 'GET', `/kho/phieu/${dh1}`), xemPN: await goi('nv', 'GET', `/kho/phieu/${pn1id}`),
    xemPS: await goi('nv', 'GET', `/kho/phieu/${d2.phieu?.id}`), ds: await goi('nv', 'GET', '/kho/phieu') };
  const lo3 = Object.entries(e3).filter(([, r]) => r.status !== 200 || khoaTien(r).size).map(([t, r]) => `${t}:${r.status}:${[...khoaTien(r)].join(',')}`);
  k('E3 nhân viên: mọi phản hồi DH / PN / PS / gợi ý / xem phiếu / danh sách KHÔNG có khoá tiền', !lo3.length, lo3.join(' | '));
  k('E3b quản lý thấy giá ở cùng phiếu (đối chứng — phép quét thật sự tìm được khoá)', khoaTien(await goi('ql', 'GET', `/kho/phieu/${dh1}`)).has('don_gia'));
  // sửa / huỷ
  const ncc = Number((await ghiDb("INSERT INTO kho_nha_cung_cap (ten) VALUES ('Chợ đầu mối')"))?.lastInsertRowid);
  const pnS = await taoPN('nv', { dong: [{ nguyen_lieu_id: n4, luong: 2, don_gia: 20000 }], ghi_chu: 'HĐ 777', nha_cung_cap_id: ncc }, 'g-pns');
  await duyet('ql', pnS.phieu?.id);
  const tonE4 = await ton(n4);
  const e4 = [await goi('ql', 'POST', `/kho/phieu/${pnS.phieu?.id}/huy`, { ly_do: 'x' }), await goi('ql', 'POST', `/kho/phieu/${pnS.phieu?.id}/sua`, { ly_do: 'x', dong: [] }),
    await goi('chu', 'POST', `/kho/phieu/${pnS.phieu?.id}/sua`, { dong: [{ nguyen_lieu_id: n4, luong: 1.5 }] }),
    await goi('chu', 'POST', `/kho/phieu/${pnS.phieu?.id}/sua`, { ly_do: 'x', mon: [{ san_pham_id: s2, so_phan: 1 }] })];
  k('E4 quản lý huỷ / sửa → 403; chủ quán sửa thiếu lý do → 400; thân kiểu phiếu xuất cho phiếu nhận → 400; phiếu vẫn da_duyet, tồn giữ', e4[0].status === 403
    && e4[1].status === 403 && e4[2].status === 400 && e4[3].status === 400 && (await ttCua(pnS.phieu?.id)) === 'da_duyet' && gan(await ton(n4), tonE4)
    && (await demPhieu('PX')) === 2, e4.map(moTa).join(' | '));
  const e4b = await goi('chu', 'POST', `/kho/phieu/${pnS.phieu?.id}/sua`, { ly_do: 'Gõ nhầm số', dong: [{ nguyen_lieu_id: n4, luong: 1.5, don_gia: 20000 }] });
  k('E4b chủ quán sửa phiếu nhận → phiếu cũ huỷ (giữ), phiếu MỚI thay_cho_id tự duyệt; tồn Gừng = trước − 2 + 1.5', e4b.status === 200
    && e4b.phieu?.thay_cho_id === pnS.phieu?.id && e4b.phieu?.trang_thai === 'da_duyet' && (await ttCua(pnS.phieu?.id)) === 'huy' && gan(await ton(n4), tonE4 - 0.5)
    && (await dongCua(pnS.phieu?.id)).length === 1, moTa(e4b));
  k('E4c sửa không gửi ghi chú / nhà cung cấp → phiếu mới GIỮ số hoá đơn "HĐ 777" và nhà cung cấp của phiếu cũ', e4b.phieu?.ghi_chu === 'HĐ 777'
    && Number(e4b.phieu?.nha_cung_cap_id) === ncc, JSON.stringify([e4b.phieu?.ghi_chu, e4b.phieu?.nha_cung_cap_id]));
  const pnCho = await taoPN('chu', { dong: [{ nguyen_lieu_id: n4, luong: 5 }] }, 'g-pncho');
  const tonE4d = await ton(n4);
  const e4d = await goi('chu', 'POST', `/kho/phieu/${pnCho.phieu?.id}/sua`, { ly_do: 'sửa', dong: [{ nguyen_lieu_id: n4, luong: 6 }] });
  k('E4d chủ quán sửa phiếu nhận CHỜ DUYỆT của chính mình → 409 PHIEU_CHUA_DUYET; không tự duyệt, tồn không đổi', e4d.status === 409 && e4d.code === 'PHIEU_CHUA_DUYET'
    && (await ttCua(pnCho.phieu?.id)) === 'cho_duyet' && gan(await ton(n4), tonE4d), moTa(e4d));
  const tonE5 = await tonTat();
  const e5 = [await goi('chu', 'POST', `/kho/phieu/${d10.phieu?.id}/huy`, { ly_do: '' }), await goi('chu', 'POST', `/kho/phieu/${d10.phieu?.id}/huy`, { ly_do: 'Nhầm' })];
  k('E5 huỷ phiếu phát sinh: thiếu lý do → 400; có lý do → huỷ, Gừng cộng lại 0.1', e5[0].status === 400 && e5[1].status === 200 && e5[1].phieu?.trang_thai === 'huy'
    && gan(await ton(n4), tonE5[n4] + 0.1), e5.map(moTa).join(' | '));
  const e5b = await goi('chu', 'POST', `/kho/phieu/${d2.phieu?.id}/sua`, { ly_do: 'Chỉ hỏng 0.3', su_co: 'hong', muc: [{ nguyen_lieu_id: n1, luong: 0.3 }] });
  k('E5b chủ quán sửa phiếu phát sinh → phiếu mới tự duyệt, tồn Cam cộng lại 0.4', e5b.status === 200 && e5b.phieu?.thay_cho_id === d2.phieu?.id
    && gan(await ton(n1), tonE5[n1] + 0.4), moTa(e5b));
  // E5e: thân y như màn XemPhieu (thanSua) dựng cho dòng lô — lo_id KÈM san_pham_id của lô (docPhieuNhap trả cả hai)
  const tpE5e = await tonTP(s1);
  const e5e = await goi('chu', 'POST', `/kho/phieu/${d12.phieu?.id}/sua`, { ly_do: 'Chỉ hỏng nửa', su_co: 'het_han', muc: [{ lo_id: loS1, san_pham_id: s1, luong: 0.5 }] });
  k('E5e sửa phiếu hết hạn với thân kèm cả lo_id lẫn san_pham_id → 200, phiếu mới trừ đúng lô, thành phẩm cộng lại 0.5', e5e.status === 200
    && e5e.phieu?.su_co === 'het_han' && (await dongCua(e5e.phieu?.id)).every((d) => Number(d.lo_id) === loS1) && gan(await tonTP(s1), tpE5e + 0.5), moTa(e5e));
  const e5c = await goi('chu', 'POST', `/kho/phieu/${dh1}/sua`, { ly_do: 'Thêm Gừng', nguyen_lieu: [{ nguyen_lieu_id: n4, luong: 2 }, { nguyen_lieu_id: n1, luong: 2 }] });
  const dMoi = ((await goi('ql', 'GET', '/kho/goi-y-nhap')).don_mo || []).find((d) => d.id === e5c.phieu?.id);
  k('E5c chủ quán sửa đơn → đơn mới tự duyệt; phần còn lại tính cả phiếu nhận của đơn cũ (Gừng 2 − 1.0 = 1.0, Cam 0)', e5c.status === 200
    && e5c.phieu?.thay_cho_id === dh1 && (await ttCua(dh1)) === 'huy' && !!dMoi && gan(cl(dMoi, n4), 1) && gan(cl(dMoi, n1), 0), `${moTa(e5c)} ${JSON.stringify(dMoi)}`);
  const tonE5d = await tonTat();
  const e5d = await goi('chu', 'POST', `/kho/phieu/${a7a.phieu?.id}/huy`, { ly_do: 'Không đặt nữa' });
  k('E5d huỷ đơn đã duyệt → huỷ, tồn không đổi', e5d.status === 200 && e5d.phieu?.trang_thai === 'huy' && bang(await tonTat(), tonE5d), moTa(e5d));
  // F — đua + tồn
  const dua = async (tao, goiA, goiB) => {
    const p = await tao();
    const id = p.phieu?.id || 0;
    const lo1 = await demLo();
    const d0 = (await dongCua(id)).length;
    const kq = await Promise.all([goiA(id), goiB(id)]);
    return { kq, loMoi: (await demLo()) - lo1, dongMoi: (await dongCua(id)).length - d0, tt: await ttCua(id) };
  };
  const f2t = await tonTat();
  const f2 = await dua(() => taoPN('nv', { dong: [{ nguyen_lieu_id: n2, luong: 0.05 }] }, 'g-f2'), (id) => duyet('ql', id), (id) => duyet('ql2', id));
  k('F2 hai quản lý duyệt cùng phiếu nhận song song → một 200, một 409; MỘT lô; tồn cộng MỘT lần', f2.kq.filter((r) => r.status === 200).length === 1 && f2.kq.some(thua)
    && f2.loMoi === 1 && gan(await ton(n2), f2t[n2] + 0.05), `${f2.kq.map(moTa).join(' | ')} · lô +${f2.loMoi}`);
  const f4t = await tonTat();
  const f4 = await dua(() => taoPS('nv', { su_co: 'hong', muc: [{ nguyen_lieu_id: n4, luong: 0.05 }] }, 'g-f4'), (id) => duyet('ql', id), (id) => duyet('ql2', id));
  k('F4 hai quản lý duyệt cùng phiếu phát sinh song song → trừ MỘT lần, dòng chia lô một lần', f4.kq.filter((r) => r.status === 200).length === 1 && f4.kq.some(thua)
    && gan(await ton(n4), f4t[n4] - 0.05) && f4.dongMoi === 0, `${f4.kq.map(moTa).join(' | ')} · dòng +${f4.dongMoi}`);
  const f4b = await dua(() => taoDH('nv', { nguyen_lieu: [{ nguyen_lieu_id: n4, luong: 1 }] }, 'g-f4b'), (id) => duyet('ql', id), (id) => duyet('ql2', id));
  k('F4b hai quản lý duyệt cùng đơn song song → một 200, một 409', f4b.kq.filter((r) => r.status === 200).length === 1 && f4b.kq.some(thua) && f4b.tt === 'da_duyet',
    f4b.kq.map(moTa).join(' | '));
  await caiDat('chu', 'kho_px_nv_can_duyet', '0');
  datGio('2026-11-09T07:00:00');
  await caiDat('chu', 'kho_han_muc_noi_bo', '500');
  const f3 = await Promise.all([nb('nv', 'g-f3a'), nb('nv', 'g-f3b')]);
  k('F3 hai phiếu nội bộ cùng người song song, mỗi phiếu 480 ≤ 500 nhưng cộng 960 > 500 → KHÔNG cả hai tự duyệt',
    f3.filter((r) => r.phieu?.trang_thai === 'da_duyet').length <= 1 && f3.every((r) => r.status === 200 || r.code === 'KHO_BAN'), f3.map((r) => r.phieu?.trang_thai || moTa(r)).join(' | '));
  await caiDat('chu', 'kho_px_nv_can_duyet', '1');
  const f6t = await ton(n4);
  const f6 = await goi('chu', 'POST', `/kho/phieu/${pn1id}/huy`, { ly_do: 'Nhập nhầm nhà cung cấp' });
  k('F6 huỷ phiếu nhận mà lô đã bị trừ → tồn = Σ dòng còn hiệu lực (Gừng −0.6), không lỗi', f6.status === 200 && gan(await ton(n4), f6t - 0.6), moTa(f6));
  k('F1 tồn = Σ dòng phiếu đã duyệt: Gừng tính lại từ sổ khớp /ton', gan(await ton(n4), await so(`SELECT COALESCE(SUM(d.so_luong), 0) FROM kho_phieu_dong d JOIN kho_phieu p
    ON p.id = d.phieu_id WHERE d.nguyen_lieu_id = ? AND p.trang_thai = 'da_duyet' AND p.loai <> 'DH'`, [n4])));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[H4] sao lưu / khôi phục với cột mới của bước 007');
  const chup = async () => JSON.stringify({ p: (await q('SELECT id, loai, trang_thai, don_id, su_co, ghi_chu FROM kho_phieu ORDER BY id'))
    .map((r) => [r.id, r.loai, r.trang_thai, r.don_id ?? null, r.su_co ?? null, r.ghi_chu ?? null]),
  d: (await q('SELECT id, han_dung, lo_id, so_luong FROM kho_phieu_dong ORDER BY id')).map((r) => [r.id, r.han_dung ?? null, r.lo_id ?? null, Number(r.so_luong)]),
  ton: await tonTat() });
  const truocSL = await chup();
  imLang();
  const rx = await fetch(goc + '/backup/export-all', { headers: { Authorization: 'Bearer ' + the.chu } }).catch(() => null);
  const tep = rx && rx.ok ? Buffer.from(await rx.arrayBuffer()) : Buffer.alloc(0);
  for (const b of ['kho_phieu_dong', 'kho_lo', 'kho_phieu', 'kho_dinh_muc', 'kho_cong_thuc', 'kho_san_pham', 'kho_nhom_cong_thuc', 'kho_nguyen_lieu', 'kho_nha_cung_cap',
    'kho_nhom_nguyen_lieu']) await ghiDb(`DELETE FROM ${b}`);
  const f = new FormData();
  f.append('file', new Blob([tep]), 'sl.xlsx');
  const kp = await fetch(goc + '/backup/restore', { method: 'POST', headers: { Authorization: 'Bearer ' + the.chu }, body: f }).catch(() => null);
  noiLai();
  const sauSL = await chup();
  k('H4 kho trống khôi phục từ sao lưu: phiếu (don_id, su_co, ghi chú), dòng (han_dung, lô, lượng) và tồn y hệt trước', tep.length > 0 && kp?.status === 200
    && sauSL === truocSL, `${tep.length} byte · ${kp?.status} · ${[...truocSL].findIndex((c, i) => c !== sauSL[i])}: ${truocSL.slice(
      Math.max(0, [...truocSL].findIndex((c, i) => c !== sauSL[i]) - 60), [...truocSL].findIndex((c, i) => c !== sauSL[i]) + 40)} ≠ ${sauSL.slice(
      Math.max(0, [...truocSL].findIndex((c, i) => c !== sauSL[i]) - 60), [...truocSL].findIndex((c, i) => c !== sauSL[i]) + 40)}`);

  muc('[G] màn hình (phép tĩnh — dùng thật là thử tay)');
  const kd = path.join(GOC, 'client', 'src', 'pages', 'Kho');
  const idx = doc(path.join(kd, 'index.jsx'));
  const thuTu = ['pc', 'nh', 'ps', 'ton', 'phieu', 'nl', 'sp', 'dm', 'dh', 'sx'].map((m) => idx.indexOf(`ma: '${m}'`));
  k('G1 tab: Pha chế · Nhận hàng · Phát sinh lên trước, Đặt hàng sau Định mức', thuTu.every((v, i) => v > 0 && (i === 0 || v > thuTu[i - 1])), JSON.stringify(thuTu));
  k('G2 MỘT vòng hỏi chờ duyệt (một setInterval trong index.jsx), quản lý bỏ đơn cần chủ quán', (idx.match(/setInterval/g) || []).length === 1 && /can_chu_quan/.test(idx));
  const chon = doc(path.join(kd, 'ChonNguyenLieu.jsx'));
  k('C3 bộ chọn: khung "Đã chọn", tab "Sắp hết & hay mua", tab nhóm, ô lọc tên', /Đã chọn/.test(chon) && /Sắp hết & hay mua/.test(chon) && /boDau/.test(chon) && /nhom/.test(chon));
  const nh = doc(path.join(kd, 'NhanHang.jsx'));
  k('G3b màn nhận: "Nhận đủ tất cả", dòng lệch tô vàng (kho-vang)', /Nhận đủ tất cả/.test(nh) && /kho-vang/.test(nh));
  const psj = doc(path.join(kd, 'PhatSinh.jsx'));
  k('D7 màn phát sinh 4 bước: Chuyện gì xảy ra? → Món nào? → Bao nhiêu? → Xem phiếu', ['Chuyện gì xảy ra?', 'Món nào?', 'Bao nhiêu?', 'Xem phiếu'].every((c) => psj.includes(c)));
  const kt = doc(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'));
  k('K1 bộ kiểm chạy bài này', /chayBaiThat\('cong_cu\/thu_KHO2b\.js'\)/.test(kt));

  sv.close();
  datGio(null);
  console.log(`\n  ${dat} đạt · ${hong} hỏng\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai();
  console.error(`\n✖ Bài thử sập: ${e.stack || e.message}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
