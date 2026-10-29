#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KHO-2a — pha chế theo định mức · phiếu xuất nguyên liệu có duyệt · thành phẩm vào kho · kết quả · tồn · danh sách phiếu
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_KHO2a.js [--may-chu <thư mục server>]
 *  Khuôn thu_KHO1.js: database.js thật + libsql trên kho TẠM, route thật qua app.listen(0), JWT theo vai trò, SX giả.
 *  Chạy với TZ=UTC (Render chạy UTC); đồng hồ thay trong tiến trình (`datGio('YYYY-MM-DDTHH:mm:ss')` = giờ Việt Nam).
 *  Ca đua: bên thua 409 PHIEU_DA_XU_LY / DA_CO_KET_QUA hoặc KHO_BAN — điều ĐẠT là sổ chỉ ghi MỘT lần.
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_kho2a_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

// Đồng hồ giả: chỉ `new Date()` / `Date.now()` không đối số đổi theo; còn lại như Date thật.
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
process.env.JWT_SECRET = 'thu_kho2a_' + DateGoc.now();

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
const thu = (f) => { try { return { kq: f() }; } catch (e) { return { loi: e }; } };

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const { createClient } = require(path.join(GOC, 'node_modules', '@libsql', 'client'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();
  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const demSX = { tru: 0 };
  const sxThat = require(duongSX);
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => false, checkStock: async () => ({ sufficient: true, stock: 999 }),
    outStockFIFO: async () => { demSX.tru++; return { ok: true }; }, inStockReturn: async () => ({ ok: true }), callSxApi: async () => ({ ok: true }) };
  const app = express();
  app.use(express.json());
  for (const r of ['don-mo-rong', 'orders', 'settings']) app.use('/api/pos/' + (r === 'don-mo-rong' ? 'orders' : r), require(path.join(MAY_CHU, 'routes', r + '.js')));
  const nhapSx = nap('kho/nhapSx.js');
  if (!nhapSx.loiNap) nhapSx.THU_MUC_TAM = path.join(THU_MUC, 'tam_nhap_sx');
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
  for (const [ai, ten, vaiTro] of [['ql', 'ql_a', 'manager'], ['ql2', 'ql_b', 'manager'], ['nv', 'nv_a', 'staff'], ['la', 'thu_la', 'thu_la']]) {
    nguoi[ai] = Number((await ghiDb("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)", [ten, ten, vaiTro])).lastInsertRowid);
    tenDN[ai] = ten;
  }
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
  const t = nap('kho/tinh.js');
  const dl = nap('kho/duLieu.js');
  const fn = (m, ten) => (typeof m[ten] === 'function' ? m[ten] : () => { throw new Error('thiếu hàm ' + ten); });

  console.log('\nTHỬ KHO-2a — pha chế · phiếu xuất · duyệt · tồn');

  // ── Dữ liệu nền ──
  const themNL = async (ten, heSo, gia, toiThieu) => Number((await ghiDb(`INSERT INTO kho_nguyen_lieu (ten, ten_chuan, don_vi_luu, don_vi_hien,
    he_so_doi, gia_nhap, ton_toi_thieu, tao_luc) VALUES (?, ?, 'kg', ?, ?, ?, ?, '2026-11-01T00:00:00')`, [ten, ten.toLowerCase(), heSo === 1 ? 'kg' : 'g', heSo, gia, toiThieu]))?.lastInsertRowid);
  const n1 = await themNL('Cam', 1, 30000, 5);
  const n2 = await themNL('Kỷ tử', 0.001, 90000, null);
  const n3 = await themNL('Đường', 1, null, null);
  const themSP = async (code, ten) => Number((await ghiDb("INSERT INTO pos_products (code, name, category, price, is_active) VALUES (?, ?, 'juice', 30000, 1)", [code, ten]))?.lastInsertRowid);
  const s1 = await themSP('K2A1', 'Nước cam');
  const s2 = await themSP('K2A2', 'Trà kỷ tử');
  const s3 = await themSP('K2A3', 'Siro đường');
  const s4 = await themSP('K2A4', 'Cà phê pha');
  const s5 = await themSP('K2A5', 'Món trống');
  const nhomA = await goi('ql', 'POST', '/kho/nhom-cong-thuc', { ten: 'Nước ép', lech_cho_phep: 10 });
  const nhomB = await goi('ql', 'POST', '/kho/nhom-cong-thuc', { ten: 'Trà', lech_cho_phep: 30 });
  k('A0 manager tạo nhóm công thức có "% lệch cho phép" → 200, lưu đúng', nhomA.status === 200 && nhomB.status === 200
    && Number((await mot('SELECT lech_cho_phep FROM kho_nhom_cong_thuc WHERE id = ?', [nhomA.id || 0]))?.lech_cho_phep) === 10, moTa(nhomA));
  k('A0b staff tạo nhóm công thức → 403', (await goi('nv', 'POST', '/kho/nhom-cong-thuc', { ten: 'X' })).status === 403);
  const luuSP = (id, than) => goi('chu', 'PUT', `/kho/san-pham/${id}`, than);
  const kqSP = [
    await luuSP(s3, { kieu: 'lam_san', nhom_id: null, han_ngay: 5, cong_thuc: [{ nguyen_lieu_id: n3, luong: 0.1 }] }),
    await luuSP(s1, { kieu: 'lam_san', nhom_id: nhomA.id ?? null, han_ngay: 2, cong_thuc: [{ nguyen_lieu_id: n1, luong: 0.2 }, { thanh_phan_id: s3, luong: 0.5 }] }),
    await luuSP(s2, { kieu: 'lam_san', nhom_id: nhomB.id ?? null, cong_thuc: [{ nguyen_lieu_id: n2, luong: 0.005 }] }),
    await luuSP(s4, { kieu: 'pha_tai_cho', nhom_id: null, cong_thuc: [{ nguyen_lieu_id: n1, luong: 0.01 }] }),
    await luuSP(s5, { kieu: 'lam_san', nhom_id: null, cong_thuc: [] }),
  ];
  k('E0 PUT /san-pham/:id nhận hạn dùng (han_ngay) — Nước cam 2 ngày; không gửi trường thì KHÔNG xoá hạn đã có',
    kqSP.every((r) => r.status === 200) && Number((await mot('SELECT han_ngay FROM kho_san_pham WHERE pos_product_id = ?', [s1]))?.han_ngay) === 2,
    kqSP.map(moTa).join(' | '));
  await luuSP(s3, { kieu: 'lam_san', nhom_id: null, cong_thuc: [{ nguyen_lieu_id: n3, luong: 0.1 }] });
  k('E0b sửa công thức không gửi han_ngay → hạn 5 giữ nguyên', Number((await mot('SELECT han_ngay FROM kho_san_pham WHERE pos_product_id = ?', [s3]))?.han_ngay) === 5);
  // Lô nhập sẵn (phiếu PN đã duyệt, dựng bằng SQL — KHO-2b mới có màn nhập)
  let soPN = 0;
  const themLo = async (cot, id, sl, han) => {
    const p = Number((await ghiDb("INSERT INTO kho_phieu (loai, so_phieu, trang_thai, nguoi_tao, tao_luc) VALUES ('PN', ?, 'da_duyet', 'admin', '2026-11-01T08:00:00')",
      ['PN-THU-' + (++soPN)]))?.lastInsertRowid);
    const lo = Number((await ghiDb(`INSERT INTO kho_lo (${cot}, so_luong, han_dung, phieu_id, tao_luc) VALUES (?, ?, ?, ?, '2026-11-01T08:00:00')`, [id, sl, han, p]))?.lastInsertRowid);
    await ghiDb(`INSERT INTO kho_phieu_dong (phieu_id, ${cot}, lo_id, so_luong) VALUES (?, ?, ?, ?)`, [p, id, lo, sl]);
    return lo;
  };
  const loA = await themLo('nguyen_lieu_id', n1, 0.5, '2026-11-20T00:00:00');
  const loB = await themLo('nguyen_lieu_id', n1, 1, '2026-11-10T00:00:00');
  const loC = await themLo('nguyen_lieu_id', n1, 3, '2026-11-01T00:00:00');   // quá hạn từ trước
  await themLo('nguyen_lieu_id', n2, 1, null);
  await themLo('san_pham_id', s1, 4, '2026-11-08T08:00:00');
  await themLo('san_pham_id', s1, 5, '2026-11-06T07:00:00');
  await themLo('san_pham_id', s1, 3, '2026-11-07T20:00:00');
  await themLo('san_pham_id', s2, 6, null);
  await themLo('san_pham_id', s3, 1, '2026-11-08T06:00:00');
  await themLo('san_pham_id', s3, 1, '2026-11-08T06:00:01');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] định mức');
  const dm1 = await goi('ql', 'PUT', '/kho/dinh-muc', { san_pham_id: s1, dinh_muc: [{ thu: null, so_luong: 10 }, { thu: 6, so_luong: 15 }] });
  const dm1b = await goi('ql', 'PUT', '/kho/dinh-muc', { san_pham_id: s1, dinh_muc: [{ thu: null, so_luong: 10 }, { thu: 6, so_luong: 15 }] });
  const dmDoc = await goi('ql', 'GET', '/kho/dinh-muc');
  const dmS1 = (dmDoc.mon || []).find((m) => m.san_pham_id === s1);
  k('A1 manager đặt định mức mọi ngày 10 + thứ 7 = 15 → GET trả đúng; lưu lần hai không nhân đôi dòng (thu NULL)', dm1.status === 200 && dm1b.status === 200
    && JSON.stringify((dmS1?.dinh_muc || []).map((d) => [d.thu, Number(d.so_luong)])) === '[[null,10],[6,15]]'
    && (await so('SELECT COUNT(*) FROM kho_dinh_muc WHERE san_pham_id = ?', [s1])) === 2, `${moTa(dm1)} ${JSON.stringify(dmS1)}`);
  const dm2 = await goi('chu', 'PUT', '/kho/dinh-muc', { san_pham_id: s2, dinh_muc: [{ thu: null, so_luong: 4 }] });
  k('A2 owner đặt định mức → 200', dm2.status === 200, moTa(dm2));
  k('A2b định mức sai (thứ 7, số âm, thứ trùng) → 400, không ghi', (await goi('ql', 'PUT', '/kho/dinh-muc', { san_pham_id: s2, dinh_muc: [{ thu: 7, so_luong: 1 }] })).status === 400
    && (await goi('ql', 'PUT', '/kho/dinh-muc', { san_pham_id: s2, dinh_muc: [{ thu: null, so_luong: -1 }] })).status === 400
    && (await goi('ql', 'PUT', '/kho/dinh-muc', { san_pham_id: s2, dinh_muc: [{ thu: 1, so_luong: 1 }, { thu: 1, so_luong: 2 }] })).status === 400
    && (await so('SELECT COUNT(*) FROM kho_dinh_muc WHERE san_pham_id = ?', [s2])) === 1);
  const cd = (dong, th) => thu(() => fn(t, 'chonDinhMuc')(dong, th)).kq;
  const dongDm = [{ thu: null, so_luong: 10 }, { thu: 6, so_luong: 15 }];
  k('A3 chonDinhMuc: thứ có dòng → 15; thứ không có → mọi ngày 10; không dòng nào → 0; canLam không âm',
    cd(dongDm, 6) === 15 && cd(dongDm, 2) === 10 && cd([], 2) === 0 && cd([{ thu: 3, so_luong: 2 }], 2) === 0
    && thu(() => fn(t, 'canLam')(10, 4)).kq === 6 && thu(() => fn(t, 'canLam')(3, 7)).kq === 0);
  k('A3b thuCuaNgay theo lịch (không giờ máy): 2026-11-07 = 6 (thứ 7), 2026-11-08 = 0, 2024-02-29 = 4',
    thu(() => fn(t, 'thuCuaNgay')('2026-11-07')).kq === 6 && thu(() => fn(t, 'thuCuaNgay')('2026-11-08')).kq === 0
    && thu(() => fn(t, 'thuCuaNgay')('2024-02-29')).kq === 4);
  k('A4 staff đọc / đặt định mức → 403', (await goi('nv', 'GET', '/kho/dinh-muc')).status === 403
    && (await goi('nv', 'PUT', '/kho/dinh-muc', { san_pham_id: s1, dinh_muc: [] })).status === 403);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] màn Pha chế');
  const monPC = (r, id) => (r.mon || []).find((m) => m.san_pham_id === id) || {};
  datGio('2026-11-06T10:00:00');   // thứ 6 → định mức mọi ngày
  const pc1 = await goi('nv', 'GET', '/kho/pha-che?ngay=hom_nay');
  k('B1 định mức 10, lô còn hạn 4 + 3, lô HẾT HẠN 5 → đang có 7, cần làm 3', pc1.status === 200 && Number(monPC(pc1, s1).dinh_muc) === 10
    && gan(monPC(pc1, s1).dang_co, 7) && gan(monPC(pc1, s1).can_lam, 3), `${moTa(pc1)} ${JSON.stringify(monPC(pc1, s1))}`);
  k('B2 đang có 6 > định mức 4 → cần làm 0 (không âm)', gan(monPC(pc1, s2).dang_co, 6) && monPC(pc1, s2).can_lam === 0, JSON.stringify(monPC(pc1, s2)));
  datGio('2026-11-07T06:00:00');   // thứ 7 06:00 VN = thứ 6 23:00 UTC
  const pcNay = await goi('nv', 'GET', '/kho/pha-che?ngay=hom_nay');
  const pcMai = await goi('nv', 'GET', '/kho/pha-che?ngay=ngay_mai');
  k('B3 dưới TZ=UTC: hôm nay = thứ 7 (định mức 15, đang có 7 → 8); ngày mai = CN (10; lô hết hạn 20:00 hôm nay không tính → đang có 4, cần 6)',
    Number(monPC(pcNay, s1).dinh_muc) === 15 && gan(monPC(pcNay, s1).can_lam, 8) && pcNay.ngay === '2026-11-07'
    && Number(monPC(pcMai, s1).dinh_muc) === 10 && gan(monPC(pcMai, s1).dang_co, 4) && gan(monPC(pcMai, s1).can_lam, 6) && pcMai.ngay === '2026-11-08',
    `${JSON.stringify(monPC(pcNay, s1))} | ${JSON.stringify(monPC(pcMai, s1))}`);
  k('B4 món pha_tai_cho / chưa định lượng không hiện; món làm sẵn thiếu công thức có cờ', !(pcNay.mon || []).some((m) => m.san_pham_id === s4)
    && monPC(pcNay, s5).co_cong_thuc === false && monPC(pcNay, s1).co_cong_thuc === true);
  k('B5 vai trò lạ / không đăng nhập → 403 / 401', (await goi('la', 'GET', '/kho/pha-che')).status === 403 && (await goi(null, 'GET', '/kho/pha-che')).status === 401);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C/D/E] phiếu xuất — tạo · duyệt · ghi kho');
  const demPX = () => so("SELECT COUNT(*) FROM kho_phieu WHERE loai = 'PX'");
  const demLo = () => so('SELECT COUNT(*) FROM kho_lo');
  const tonQL = async () => { const r = await goi('ql', 'GET', '/kho/ton'); return { r, nl: (id) => (r.nguyen_lieu || []).find((x) => x.id === id) || {} }; };
  const px = (ai, mon, maGui) => goi(ai, 'POST', '/kho/phieu-xuat', { mon, ma_gui: maGui });
  const pxTruoc = await demPX();
  const c1 = await px('ql', [{ san_pham_id: s1, so_phan: 10 }, { san_pham_id: s2, so_phan: 4 }], 'g-c1');
  const c1id = c1.phieu?.id;
  const tong = (r, id) => (r.tong || []).find((x) => x.nguyen_lieu_id === id) || {};
  const tm = (r, id) => (r.theo_mon || []).find((x) => x.san_pham_id === id) || {};
  const nlm = (m, id) => (m.nguyen_lieu || []).find((x) => x.nguyen_lieu_id === id) || {};
  k('C1 bảng tổng = Σ trienKhai (lồng): Cam 2 kg · Đường 0.5 kg · Kỷ tử 0.02 kg; mỗi món bảng riêng; 1 phần = mẻ / số phần', c1.status === 200
    && gan(tong(c1, n1).luong, 2) && gan(tong(c1, n3).luong, 0.5) && gan(tong(c1, n2).luong, 0.02) && (c1.tong || []).length === 3
    && gan(nlm(tm(c1, s1), n1).luong, 2) && gan(nlm(tm(c1, s1), n3).luong, 0.5) && (tm(c1, s1).nguyen_lieu || []).length === 2
    && gan(nlm(tm(c1, s1), n1).mot_phan_hien, 0.2), `${moTa(c1)} ${JSON.stringify(c1.tong)}`);
  k('C2 MỘT phiếu cho cả lần (+1 kho_phieu PX)', (await demPX()) === pxTruoc + 1);
  k('C3 số phiếu PX-261107-001 (ngày VN dưới TZ=UTC)', c1.phieu?.so_phieu === 'PX-261107-001', c1.phieu?.so_phieu);
  k('C8 đơn vị hiện: Kỷ tử 20 g cả mẻ, 5 g một phần (he_so_doi 0.001)', gan(nlm(tm(c1, s2), n2).luong_hien, 20) && gan(nlm(tm(c1, s2), n2).mot_phan_hien, 5)
    && nlm(tm(c1, s2), n2).don_vi === 'g' && gan(tong(c1, n2).luong_hien, 20), JSON.stringify(tm(c1, s2)));
  k('D2 manager tạo → tự duyệt (da_duyet, người duyệt = manager)', c1.phieu?.trang_thai === 'da_duyet' && c1.phieu?.nguoi_duyet === 'ql_a', JSON.stringify(c1.phieu));
  const xuatN1 = await q("SELECT lo_id, so_luong FROM kho_phieu_dong WHERE phieu_id = ? AND nguyen_lieu_id = ? ORDER BY id", [c1id || 0, n1]);
  k('E2 trừ lô hạn gần trước: lô B (hạn 10/11) 1 kg → lô A (20/11) 0.5 kg → thiếu 0.5 kg lo_id NULL; lô quá hạn C KHÔNG bị trừ',
    JSON.stringify(xuatN1.map((d) => [d.lo_id === null ? null : Number(d.lo_id), Number(d.so_luong)])) === JSON.stringify([[loB, -1], [loA, -0.5], [null, -0.5]])
    && (await so("SELECT COUNT(*) FROM kho_phieu_dong WHERE lo_id = ? AND phieu_id <> (SELECT phieu_id FROM kho_lo WHERE id = ?)", [loC, loC])) === 0, JSON.stringify(xuatN1));
  const t1 = await tonQL();
  k('E1 Đường không có lô → vẫn ghi, tồn −0.5 (âm, cờ đỏ ở tồn và ở phiếu)', gan(t1.nl(n3).ton, -0.5) && t1.nl(n3).am === true && tong(c1, n3).am === true
    && (await so('SELECT COUNT(*) FROM kho_phieu_dong WHERE phieu_id = ? AND nguyen_lieu_id = ? AND lo_id IS NULL', [c1id || 0, n3])) === 1, JSON.stringify(t1.nl(n3)));
  const loS1 = await mot('SELECT * FROM kho_lo WHERE phieu_id = ? AND san_pham_id = ?', [c1id || 0, s1]);
  const loS2 = await mot('SELECT * FROM kho_lo WHERE phieu_id = ? AND san_pham_id = ?', [c1id || 0, s2]);
  k('E3 mỗi món một lô: Nước cam 10 phần hạn = giờ làm + 2 ngày (2026-11-09T06:00:00); Trà kỷ tử chưa có hạn → lô không hạn, vẫn vào',
    loS1 && Number(loS1.so_luong) === 10 && loS1.han_dung === '2026-11-09T06:00:00' && loS2 && Number(loS2.so_luong) === 4 && loS2.han_dung === null,
    JSON.stringify([loS1, loS2]));
  k('E4 giá vốn: Trà kỷ tử đủ giá = 0.02 kg × 90.000 / 4 = 450 đ/phần; Nước cam thiếu giá Đường → NULL (vẫn vào kho)',
    Number(loS2?.gia_von) === 450 && loS1?.gia_von === null, JSON.stringify([loS1?.gia_von, loS2?.gia_von]));
  const hl = (a, b) => thu(() => fn(dl, 'hanLo')(a, b)).kq;
  k('E5 hanLo qua cuối tháng / năm, không hạn → null', hl('2026-01-31T10:00:00', 1) === '2026-02-01T10:00:00'
    && hl('2026-12-31T23:30:00', 1) === '2027-01-01T23:30:00' && hl('2026-11-07T06:00:00', null) === null);
  // C6: sửa công thức SAU khi tạo → phiếu vẫn số cũ
  await luuSP(s1, { kieu: 'lam_san', nhom_id: nhomA.id ?? null, cong_thuc: [{ nguyen_lieu_id: n1, luong: 0.3 }, { thanh_phan_id: s3, luong: 0.5 }] });
  const c1doc = await goi('nv', 'GET', `/kho/phieu/${c1id}`);
  k('C6 sửa công thức sau khi tạo → GET /phieu/:id vẫn Cam 2 kg (đọc từ sổ, không tính lại)', c1doc.status === 200 && gan(tong(c1doc, n1).luong, 2), moTa(c1doc));
  await luuSP(s1, { kieu: 'lam_san', nhom_id: nhomA.id ?? null, cong_thuc: [{ nguyen_lieu_id: n1, luong: 0.2 }, { thanh_phan_id: s3, luong: 0.5 }] });
  const pxC4 = await demPX();
  const c4 = await px('ql', [{ san_pham_id: s1, so_phan: 1 }, { san_pham_id: s5, so_phan: 1 }]);
  k('C4 món không công thức → 400 MON_CHUA_CONG_THUC, không ghi gì', c4.status === 400 && c4.code === 'MON_CHUA_CONG_THUC' && (await demPX()) === pxC4, moTa(c4));
  const c5 = await Promise.all([[], [{ san_pham_id: s1, so_phan: 0 }], [{ san_pham_id: s1, so_phan: -2 }], [{ san_pham_id: s1, so_phan: 'x' }]].map((m) => px('ql', m)));
  k('C5 số phần ≤ 0 / không phải số / không món → 400 SO_PHAN_SAI', c5.every((r) => r.status === 400 && r.code === 'SO_PHAN_SAI') && (await demPX()) === pxC4, c5.map(moTa).join(' | '));
  const lo7 = await demLo();
  const c7 = await Promise.all([px('ql', [{ san_pham_id: s2, so_phan: 1 }], 'g-c7'), px('ql', [{ san_pham_id: s2, so_phan: 1 }], 'g-c7')]);
  k('C7 bấm hai lần (cùng ma_gui, song song) → MỘT phiếu, MỘT lô', (await demPX()) === pxC4 + 1 && (await demLo()) === lo7 + 1
    && c7.every((r) => r.status === 200 || r.code === 'KHO_BAN') && c7.filter((r) => r.status === 200).every((r) => r.phieu?.id === c7.find((x) => x.phieu)?.phieu?.id),
    c7.map(moTa).join(' | '));
  const c3b = await px('ql', [{ san_pham_id: s2, so_phan: 1 }], 'g-c3b');
  k('C3b phiếu sau cùng ngày, khác ma_gui → số kế tiếp PX-261107-003', c3b.phieu?.so_phieu === 'PX-261107-003', c3b.phieu?.so_phieu);
  const pa = await mot('SELECT so_phieu FROM kho_phieu WHERE id = ?', [c7.find((r) => r.phieu)?.phieu?.id || 0]);
  k('C3c số phiếu không trùng (002 cho lần bấm hai lần)', pa?.so_phieu === 'PX-261107-002', pa?.so_phieu);

  // D — duyệt
  const tonN2Truoc = (await tonQL()).nl(n2).ton;
  const loD1 = await demLo();
  const d1 = await px('nv', [{ san_pham_id: s2, so_phan: 2 }], 'g-d1');
  k('D1 staff tạo → cho_duyet; tồn nguyên liệu KHÔNG đổi, không lô', d1.phieu?.trang_thai === 'cho_duyet' && gan((await tonQL()).nl(n2).ton, tonN2Truoc)
    && (await demLo()) === loD1, JSON.stringify(d1.phieu || moTa(d1)));
  k('D4 staff duyệt → 403', (await goi('nv', 'POST', `/kho/phieu/${d1.phieu?.id}/duyet`)).status === 403);
  const d3 = await px('nv', [{ san_pham_id: s2, so_phan: 1 }], 'g-d3');
  await ghiDb("UPDATE kho_phieu SET nguoi_tao = 'ql_a' WHERE id = ?", [d3.phieu?.id || 0]);
  const d3a = await goi('ql', 'POST', `/kho/phieu/${d3.phieu?.id}/duyet`);
  k('D3 người tạo tự duyệt → 403 TU_DUYET, không ghi gì', d3a.status === 403 && d3a.code === 'TU_DUYET' && (await demLo()) === loD1
    && (await mot('SELECT trang_thai FROM kho_phieu WHERE id = ?', [d3.phieu?.id || 0]))?.trang_thai === 'cho_duyet', moTa(d3a));
  const d3b = await goi('chu', 'POST', `/kho/phieu/${d1.phieu?.id}/duyet`);
  k('D3b owner duyệt phiếu của staff → 200, da_duyet, người duyệt = owner, có lô', d3b.status === 200 && d3b.phieu?.trang_thai === 'da_duyet'
    && d3b.phieu?.nguoi_duyet === tenDN.chu && (await demLo()) === loD1 + 1, moTa(d3b));
  const duaDuyet = async (ten, goiA, goiB) => {
    const p = await px('nv', [{ san_pham_id: s2, so_phan: 1 }], 'g-' + ten);
    const id = p.phieu?.id || 0;
    const lo0 = await demLo();
    const dong0 = await so('SELECT COUNT(*) FROM kho_phieu_dong WHERE phieu_id = ?', [id]);
    const kq = await Promise.all([goiA(id), goiB(id)]);
    return { id, kq, loMoi: (await demLo()) - lo0, dongMoi: (await so('SELECT COUNT(*) FROM kho_phieu_dong WHERE phieu_id = ?', [id])) - dong0,
      tt: (await mot('SELECT trang_thai FROM kho_phieu WHERE id = ?', [id]))?.trang_thai };
  };
  const thua = (r) => r.status === 409 && ['PHIEU_DA_XU_LY', 'KHO_BAN'].includes(r.code);
  const d5 = await duaDuyet('d5', (id) => goi('ql', 'POST', `/kho/phieu/${id}/duyet`), (id) => goi('ql2', 'POST', `/kho/phieu/${id}/duyet`));
  k('D5 hai người duyệt song song → một 200, một 409; MỘT lô, dòng ghi một lần', d5.kq.filter((r) => r.status === 200).length === 1 && d5.kq.some(thua)
    && d5.loMoi === 1 && d5.tt === 'da_duyet' && d5.dongMoi === 0, `${d5.kq.map(moTa).join(' | ')} · lô +${d5.loMoi} · dòng +${d5.dongMoi}`);
  const d6 = await duaDuyet('d6', (id) => goi('ql', 'POST', `/kho/phieu/${id}/duyet`), (id) => goi('ql', 'POST', `/kho/phieu/${id}/duyet`));
  k('D6 cùng người bấm duyệt hai lần → MỘT lô', d6.kq.filter((r) => r.status === 200).length === 1 && d6.loMoi === 1, d6.kq.map(moTa).join(' | '));
  const d7 = await px('nv', [{ san_pham_id: s2, so_phan: 1 }], 'g-d7');
  const d7a = await goi('ql', 'POST', `/kho/phieu/${d7.phieu?.id}/tu-choi`, { ly_do: '  ' });
  const lo7b = await demLo();
  const d7b = await goi('ql', 'POST', `/kho/phieu/${d7.phieu?.id}/tu-choi`, { ly_do: 'Không đủ người' });
  k('D7 từ chối không lý do → 400 THIEU_LY_DO; có lý do → huy, lý do lưu, không lô', d7a.status === 400 && d7a.code === 'THIEU_LY_DO' && d7b.status === 200
    && d7b.phieu?.trang_thai === 'huy' && d7b.phieu?.ly_do === 'Không đủ người' && (await demLo()) === lo7b, `${moTa(d7a)} | ${moTa(d7b)}`);
  const caiDat = (ai, v) => goi(ai, 'PUT', '/settings', { settings: { kho_px_nv_can_duyet: v } });
  const d8a = await caiDat('chu', '0');
  const d8p = await px('nv', [{ san_pham_id: s2, so_phan: 1 }], 'g-d8a');
  await ghiDb("UPDATE pos_settings SET value = 'x' WHERE key = 'kho_px_nv_can_duyet'");
  const d8x = await px('nv', [{ san_pham_id: s2, so_phan: 1 }], 'g-d8x');
  await ghiDb("DELETE FROM pos_settings WHERE key = 'kho_px_nv_can_duyet'");
  const d8n = await px('nv', [{ san_pham_id: s2, so_phan: 1 }], 'g-d8n');
  k('D8 công tắc = "0" → staff tự duyệt; giá trị lạ "x" / không có dòng → vẫn cần duyệt', d8a.status === 200 && d8p.phieu?.trang_thai === 'da_duyet'
    && d8x.phieu?.trang_thai === 'cho_duyet' && d8n.phieu?.trang_thai === 'cho_duyet', [d8a, d8p, d8x, d8n].map((r) => r.phieu?.trang_thai || moTa(r)).join(' | '));
  // Quản lý được chủ quán cấp quyền cài đặt (Cài đặt › Phân quyền) — D10 chỉ thử MỘT phép: khoá kho_* chỉ chủ quán.
  await ghiDb("INSERT OR REPLACE INTO pos_permissions (role, permission, allowed) VALUES ('manager', 'manage_settings', 1)");
  const d10a = await caiDat('chu', '2');
  const d10b = await caiDat('ql', '0');
  k('D10 công tắc chỉ nhận 0 / 1; manager đổi → 403 (chỉ chủ quán); không ghi', d10a.status === 400 && d10b.status === 403
    && (await mot("SELECT value FROM pos_settings WHERE key = 'kho_px_nv_can_duyet'")) === null, `${moTa(d10a)} | ${moTa(d10b)}`);
  const d10c = await goi('ql', 'PUT', '/settings', { settings: { loyalty_x: '1' } });
  k('D10b manager vẫn đổi được cài đặt KHÁC (K5)', d10c.status === 200, moTa(d10c));
  const choDuyet = await goi('ql', 'GET', '/kho/phieu?trang_thai=cho_duyet');
  const choSQL = (await q("SELECT id FROM kho_phieu WHERE trang_thai = 'cho_duyet' ORDER BY id")).map((r) => Number(r.id));
  k('D9 GET /phieu?trang_thai=cho_duyet = đúng danh sách chờ (nguồn đếm huy hiệu)', choDuyet.status === 200 && choSQL.length >= 3
    && JSON.stringify((choDuyet.phieu || []).map((p) => p.id).sort((a, b) => a - b)) === JSON.stringify(choSQL), JSON.stringify(choSQL));
  const d11 = await duaDuyet('d11', (id) => goi('ql', 'POST', `/kho/phieu/${id}/duyet`), (id) => goi('ql2', 'POST', `/kho/phieu/${id}/tu-choi`, { ly_do: 'thôi' }));
  k('D11 từ chối song song với duyệt → một bên thắng; từ chối thắng thì không lô', d11.kq.filter((r) => r.status === 200).length === 1 && d11.kq.some(thua)
    && (d11.tt === 'huy' ? d11.loMoi === 0 : d11.tt === 'da_duyet' && d11.loMoi === 1), `${d11.kq.map(moTa).join(' | ')} · ${d11.tt} lô +${d11.loMoi}`);
  await ghiDb("UPDATE kho_phieu SET nguoi_tao = 'ql_a' WHERE id = ?", [d8n.phieu?.id || 0]);
  const d12a = await goi('ql', 'POST', `/kho/phieu/${d8n.phieu?.id}/tu-choi`, { ly_do: 'x' });
  const d12b = await goi('ql', 'POST', `/kho/phieu/${c1id}/tu-choi`, { ly_do: 'x' });
  k('D12 người tạo tự từ chối → 403 TU_DUYET; từ chối phiếu đã duyệt → 409 PHIEU_DA_XU_LY', d12a.status === 403 && d12a.code === 'TU_DUYET'
    && d12b.status === 409 && d12b.code === 'PHIEU_DA_XU_LY', `${moTa(d12a)} | ${moTa(d12b)}`);

  // E6 / E8
  const nc = await q('SELECT so, ten FROM pos_nang_cap ORDER BY so');
  const cot = async (b) => (await q(`PRAGMA table_info(${b})`)).map((c) => c.name);
  k('E6 bước 002 đã chạy: cột han_ngay, lech_cho_phep, so_lan_in, ma_gui, loai / cho_mon_id / nguoi / luc có', nc.some((r) => Number(r.so) === 2 && /^002_/.test(r.ten))
    && (await cot('kho_san_pham')).includes('han_ngay') && (await cot('kho_nhom_cong_thuc')).includes('lech_cho_phep')
    && (await cot('kho_phieu_dong')).filter((c) => ['loai', 'cho_mon_id', 'nguoi', 'luc'].includes(c)).length === 4
    && (await cot('kho_phieu')).filter((c) => ['so_lan_in', 'ma_gui'].includes(c)).length === 2, JSON.stringify(nc));
  // Kho chỉ có bước 001 + một dòng kho_san_pham → chạy bộ đầy đủ: 002 chạy, sao lưu bảng có dòng, chạy lại không đổi.
  const chay = nap('nang_cap/chay.js');
  const fileE6 = path.join(THU_MUC, 'e6.db');
  const c6 = createClient({ url: 'file:' + fileE6 });
  const rows = async (exe) => (await exe).rows.map((r) => ({ ...r }));
  const bocTx = (tx) => ({ query: (s, a = []) => rows(tx.execute({ sql: s, args: a })), queryOne: async (s, a = []) => (await rows(tx.execute({ sql: s, args: a })))[0],
    run: (s, a = []) => tx.execute({ sql: s, args: a }), commit: () => tx.commit(), rollback: () => tx.rollback() });
  const csdl6 = { query: (s, a = []) => rows(c6.execute({ sql: s, args: a })), beginTransaction: async () => bocTx(await c6.transaction('write')) };
  const dir001 = path.join(THU_MUC, 'chi_001');
  fs.mkdirSync(dir001);
  fs.copyFileSync(path.join(MAY_CHU, 'nang_cap', '001_kho.js'), path.join(dir001, '001_kho.js'));
  let e6 = {};
  if (typeof chay.chayNangCap === 'function') {
    imLang();
    try {
      await chay.chayNangCap(csdl6, dir001);
      await c6.execute("INSERT INTO kho_san_pham (pos_product_id, kieu) VALUES (1, 'lam_san')");
      e6.lan1 = await chay.chayNangCap(csdl6, path.join(MAY_CHU, 'nang_cap'));
      const ct = async () => JSON.stringify(await csdl6.query("SELECT name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name"));
      e6.ct1 = await ct();
      e6.lan2 = await chay.chayNangCap(csdl6, path.join(MAY_CHU, 'nang_cap'));
      e6.ct2 = await ct();
      e6.saoLuu = (await csdl6.query('SELECT COUNT(*) AS n FROM _sao_luu_002_kho_san_pham'))[0].n;
      e6.cot = (await csdl6.query('PRAGMA table_info(kho_san_pham)')).map((c) => c.name);
    } catch (e) { e6.loi = e.message; }
    noiLai();
  }
  k('E6b kho có dòng kho_san_pham → 002 sao lưu _sao_luu_002_kho_san_pham (1 dòng), thêm cột; chạy lại không đổi cấu trúc', !e6.loi && !e6.lan1?.hong
    && Number(e6.saoLuu) === 1 && (e6.cot || []).includes('han_ngay') && e6.ct1 === e6.ct2 && !e6.lan2?.hong, e6.loi || e6.lan1?.hong);
  c6.close();
  const e8p = await px('nv', [{ san_pham_id: s2, so_phan: 1 }], 'g-e8');
  const e8dong = await so('SELECT COUNT(*) FROM kho_phieu_dong');
  await ghiDb("CREATE TRIGGER thu_chan_lo BEFORE INSERT ON kho_lo BEGIN SELECT RAISE(ABORT, 'chan thu'); END");
  const e8a = await goi('ql', 'POST', `/kho/phieu/${e8p.phieu?.id}/duyet`);
  const e8px = await demPX();
  const e8b = await px('ql', [{ san_pham_id: s2, so_phan: 1 }], 'g-e8b');
  await ghiDb('DROP TRIGGER thu_chan_lo');
  k('E8 MỘT giao dịch: chèn lô hỏng giữa chừng → duyệt lỗi, phiếu vẫn cho_duyet, không dòng nào đổi; tạo-tự-duyệt lỗi → không có phiếu',
    e8p.phieu?.trang_thai === 'cho_duyet' && e8a.status >= 500 && (await mot('SELECT trang_thai FROM kho_phieu WHERE id = ?', [e8p.phieu?.id || 0]))?.trang_thai === 'cho_duyet'
    && (await so('SELECT COUNT(*) FROM kho_phieu_dong')) === e8dong && (await so('SELECT COUNT(*) FROM kho_phieu_dong WHERE phieu_id = ? AND lo_id IS NOT NULL', [e8p.phieu?.id || 0])) === 0
    && e8b.status >= 500 && (await demPX()) === e8px, `${moTa(e8a)} | ${moTa(e8b)}`);

  // E7 — nhập SX điền hạn dùng
  const fileSx = path.join(THU_MUC, 'sx.db');
  const cs = createClient({ url: 'file:' + fileSx });
  for (const c of [
    "CREATE TABLE ingredients (id INTEGER PRIMARY KEY, name TEXT, unit TEXT, price REAL, category TEXT, shelf_life_days INTEGER, min_stock REAL, stock REAL)",
    "CREATE TABLE recipes (id INTEGER PRIMARY KEY, name TEXT, code TEXT, days_use INTEGER, is_active INTEGER DEFAULT 1)",
    'CREATE TABLE recipe_ingredients (id INTEGER PRIMARY KEY, recipe_id INTEGER, ingredient_id INTEGER, amount REAL)',
    'CREATE TABLE tea_products (id INTEGER PRIMARY KEY, name TEXT, code TEXT, is_active INTEGER DEFAULT 1)',
    'CREATE TABLE tea_ingredients (id INTEGER PRIMARY KEY, tea_product_id INTEGER, ingredient_id INTEGER, amount REAL)',
    'CREATE TABLE product_types (id INTEGER PRIMARY KEY, code TEXT, name TEXT, is_active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0)',
    'CREATE TABLE sx_products (id INTEGER PRIMARY KEY, code TEXT, name TEXT, type_id INTEGER, is_active INTEGER DEFAULT 1, legacy_id INTEGER, days_use INTEGER)',
    'CREATE TABLE sx_product_ingredients (id INTEGER PRIMARY KEY, product_id INTEGER, ingredient_id INTEGER, amount REAL)',
    'CREATE VIEW v_recipes AS SELECT * FROM recipes', 'CREATE VIEW v_tea_products AS SELECT * FROM tea_products',
    'CREATE VIEW v_recipe_ingredients AS SELECT recipe_id, ingredient_id, amount FROM recipe_ingredients',
    'CREATE VIEW v_tea_ingredients AS SELECT tea_product_id, ingredient_id, amount FROM tea_ingredients',
    "INSERT INTO ingredients VALUES (1, 'Cam', 'kg', 30000, 'juice', 0, 0, 0)",
    "INSERT INTO recipes VALUES (1, 'Hồng Tân Sinh', 'CT1', 3, 1), (2, 'Lục Tân Khí', 'CT2', 5, 1)",
    'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount) VALUES (1, 1, 0.1), (2, 1, 0.2)',
    "INSERT INTO product_types VALUES (1, 'juice', 'Nước ép', 1, 0), (2, 'tea', 'Trà', 1, 1), (3, 'caphe', 'Cà phê', 1, 2)",
    "INSERT INTO sx_products VALUES (21, 'CF02', 'Bạc xỉu', 3, 1, 5, 2)",
    'INSERT INTO sx_product_ingredients (product_id, ingredient_id, amount) VALUES (21, 1, 0.01)',
  ]) await cs.execute(c);
  cs.close();
  const ct1 = await mot("SELECT id FROM pos_products WHERE code = 'CT1'");
  await ghiDb("INSERT INTO kho_san_pham (pos_product_id, kieu, han_ngay) VALUES (?, 'lam_san', 7)", [ct1?.id || 0]);
  const f = new FormData();
  f.append('file', new Blob([fs.readFileSync(fileSx)]), 'sx.db');
  f.append('ghi', '1');
  imLang();
  const nhapR = await fetch(goc + '/kho/nhap-sx', { method: 'POST', headers: { Authorization: 'Bearer ' + the.chu }, body: f }).then((r) => r.status).catch(() => 0);
  noiLai();
  const hanCode = async (code) => (await mot('SELECT s.han_ngay FROM kho_san_pham s JOIN pos_products p ON p.id = s.pos_product_id WHERE p.code = ?', [code]))?.han_ngay;
  k('E7 nhập SX điền hạn từ days_use: CT2 (v_recipes) = 5, CF02 (sx_products) = 2; CT1 đã có 7 → KHÔNG đè', nhapR === 200
    && Number(await hanCode('CT2')) === 5 && Number(await hanCode('CF02')) === 2 && Number(await hanCode('CT1')) === 7,
    `${nhapR} · ${await hanCode('CT2')} · ${await hanCode('CF02')} · ${await hanCode('CT1')}`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] kết quả');
  const kq = (ai, id, than) => goi(ai, 'POST', `/kho/phieu/${id}/ket-qua`, than);
  const f1 = await kq('ql', c1id, { san_pham_id: s2 });
  k('F1 ✓ đúng chuẩn → dòng ket_qua 0', f1.status === 200 && (await so("SELECT COUNT(*) FROM kho_phieu_dong WHERE phieu_id = ? AND loai = 'ket_qua' AND so_luong = 0 AND san_pham_id = ?", [c1id || 0, s2])) === 1, moTa(f1));
  const f2 = await kq('nv', c1id, { san_pham_id: s1, so_thuc: 8, ghi_chu: 'rơi một bình' });
  const dongF2 = await mot("SELECT * FROM kho_phieu_dong WHERE phieu_id = ? AND loai = 'ket_qua' AND san_pham_id = ?", [c1id || 0, s1]);
  const tonLo = async (loId) => so("SELECT COALESCE(SUM(d.so_luong), 0) FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id WHERE d.lo_id = ? AND p.trang_thai = 'da_duyet'", [loId || 0]);
  k('F2 số thực 8 (chuẩn 10) + ghi chú → dòng −2 cùng lô, có người / giờ; tồn lô 8', f2.status === 200 && dongF2 && Number(dongF2.so_luong) === -2
    && dongF2.nguoi === 'nv_a' && dongF2.luc === '2026-11-07T06:00:00' && dongF2.ghi_chu === 'rơi một bình' && Number(dongF2.lo_id) === Number(loS1?.id)
    && (await tonLo(loS1?.id)) === 8 && tm(f2, s1).ket_qua?.trang_thai === 'da_dien', `${moTa(f2)} ${JSON.stringify(dongF2)}`);
  const lechMon = async (sp, sl, thuc) => {
    const p = await px('ql', [{ san_pham_id: sp, so_phan: sl }], `g-lech-${sp}-${thuc}`);
    const r = await kq('ql', p.phieu?.id, { san_pham_id: sp, so_thuc: thuc });
    return r.status === 200 ? r.lech : 'HTTP ' + r.status;
  };
  const f3 = [await lechMon(s1, 10, 8), await lechMon(s1, 10, 9), await lechMon(s1, 10, 11.1), await lechMon(s2, 10, 8), await lechMon(s3, 10, 1)];
  k('F3 lệch 20 % ở nhóm 10 % → vàng; đúng 10 % → không; 11 % → vàng; nhóm 30 % lệch 20 % → không; món không nhóm → không; VẪN ghi',
    JSON.stringify(f3) === '[true,false,true,false,false]', JSON.stringify(f3));
  const lc = (a, b, c) => thu(() => fn(t, 'lechQuaNguong')(a, b, c)).kq;
  k('F3b lechQuaNguong thuần: (10, 8, 10) true · (10, 9, 10) false · (10, 8, null) false', lc(10, 8, 10) === true && lc(10, 9, 10) === false && lc(10, 8, null) === false);
  const f4p = await px('ql', [{ san_pham_id: s1, so_phan: 5 }], 'g-f4');
  const f4 = await Promise.all([kq('ql', f4p.phieu?.id, { san_pham_id: s1 }), kq('nv', f4p.phieu?.id, { san_pham_id: s1, so_thuc: 4 })]);
  k('F4 hai kết quả song song cùng món → MỘT dòng; bên thua 409', (await so("SELECT COUNT(*) FROM kho_phieu_dong WHERE phieu_id = ? AND loai = 'ket_qua'", [f4p.phieu?.id || 0])) === 1
    && f4.filter((r) => r.status === 200).length === 1 && f4.some((r) => r.status === 409 && ['DA_CO_KET_QUA', 'KHO_BAN'].includes(r.code)), f4.map(moTa).join(' | '));
  const f6a = await kq('ql', d8x.phieu?.id, { san_pham_id: s2 });
  const f6b = await kq('ql', d7.phieu?.id, { san_pham_id: s2 });
  k('F6 ghi kết quả phiếu cho_duyet / huy → 409', f6a.status === 409 && f6b.status === 409, `${moTa(f6a)} | ${moTa(f6b)}`);
  const f5p = await px('ql', [{ san_pham_id: s2, so_phan: 2 }], 'g-f5');
  datGio('2026-11-07T23:30:00');
  const f5a = await goi('nv', 'GET', `/kho/phieu/${f5p.phieu?.id}`);
  datGio('2026-11-08T06:00:00');   // = 2026-11-07 23:00 UTC
  const f5b = await goi('nv', 'GET', `/kho/phieu/${f5p.phieu?.id}`);
  const f5l = await goi('nv', 'GET', '/kho/phieu?loai=PX');
  const f5c = await kq('nv', f5p.phieu?.id, { san_pham_id: s2, so_thuc: 1 });
  k('F5 cùng ngày 23:30 VN → cho_dien; qua ngày VN (06:00 hôm sau, máy vẫn ngày cũ theo UTC) → tu_chot ở phiếu + danh sách; ghi → 409 DA_TU_CHOT',
    tm(f5a, s2).ket_qua?.trang_thai === 'cho_dien' && tm(f5b, s2).ket_qua?.trang_thai === 'tu_chot' && f5b.phieu?.ket_qua === 'tu_chot'
    && (f5l.phieu || []).find((p) => p.id === f5p.phieu?.id)?.ket_qua === 'tu_chot' && f5c.status === 409 && f5c.code === 'DA_TU_CHOT',
    `${tm(f5a, s2).ket_qua?.trang_thai} · ${tm(f5b, s2).ket_qua?.trang_thai} · ${moTa(f5c)}`);
  const tk = (a, b, c, d) => thu(() => fn(t, 'trangThaiKetQua')(a, b, c, d)).kq;
  k('F5b trangThaiKetQua: có kết quả → da_dien; cùng ngày → cho_dien; qua ngày → tu_chot; phiếu sửa → da_dien', tk('2026-11-07', '2026-11-07', true, false) === 'da_dien'
    && tk('2026-11-07', '2026-11-07', false, false) === 'cho_dien' && tk('2026-11-07', '2026-11-08', false, false) === 'tu_chot'
    && tk('2026-11-07', '2026-11-08', false, true) === 'da_dien');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] tồn kho');
  datGio('2026-11-07T06:00:00');
  const g = await tonQL();
  const tonSQL = async (id) => so("SELECT COALESCE(SUM(d.so_luong), 0) FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id WHERE d.nguyen_lieu_id = ? AND p.trang_thai = 'da_duyet'", [id]);
  const coChoN2 = await so("SELECT COUNT(*) FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id WHERE d.nguyen_lieu_id = ? AND p.trang_thai <> 'da_duyet'", [n2]);
  k('G1 tồn nguyên liệu = Σ dòng phiếu da_duyet (bỏ cho_duyet / huy); Cam dưới tối thiểu 5 → cờ vàng; Kỷ tử không âm; có nhóm',
    g.r.status === 200 && coChoN2 > 0 && gan(g.nl(n1).ton, await tonSQL(n1)) && gan(g.nl(n2).ton, await tonSQL(n2)) && gan(g.nl(n3).ton, await tonSQL(n3))
    && g.nl(n1).duoi_toi_thieu === true && g.nl(n2).am === false && g.nl(n2).duoi_toi_thieu === false && Array.isArray(g.r.nhom_nguyen_lieu),
    `${moTa(g.r)} ${JSON.stringify(g.nl(n1))}`);
  const tp = (id) => (g.r.thanh_pham || []).find((x) => x.san_pham_id === id) || {};
  const hanLoTP = (id) => (tp(id).lo || []).map((l) => [l.han_dung, l.han]);
  k('G2 thành phẩm theo lô + hạn: còn đúng 1 ngày → sap_het; 1 ngày + 1 giây → con; quá hạn → qua_han; không hạn → null',
    JSON.stringify(hanLoTP(s3).filter(([h]) => /2026-11-08T06/.test(h))) === JSON.stringify([['2026-11-08T06:00:00', 'sap_het'], ['2026-11-08T06:00:01', 'con']])
    && hanLoTP(s1).some(([h, c]) => h === '2026-11-06T07:00:00' && c === 'qua_han') && hanLoTP(s1).some(([h, c]) => h === '2026-11-07T20:00:00' && c === 'sap_het')
    && hanLoTP(s2).some(([h, c]) => h === null && c === null), JSON.stringify([hanLoTP(s3), hanLoTP(s1)]));
  const coGia = (o) => JSON.stringify(o).match(/"(gia_nhap|gia_von|don_gia)"/g) || [];
  const g3p = await px('nv', [{ san_pham_id: s2, so_phan: 1 }], 'g-g3');
  await caiDat('chu', '0');
  const g3t = await px('nv', [{ san_pham_id: s2, so_phan: 1 }], 'g-g3t');
  await caiDat('chu', '1');
  const nvPhan = [await goi('nv', 'GET', '/kho/ton'), await goi('nv', 'GET', '/kho/pha-che'), await goi('nv', 'GET', '/kho/phieu'), await goi('nv', 'GET', `/kho/phieu/${c1id}`),
    g3p, g3t, await kq('nv', g3t.phieu?.id, { san_pham_id: s2 }), await goi('nv', 'POST', `/kho/phieu/${c1id}/in`)];
  k('G3 nhân viên: /ton, /pha-che, /phieu, /phieu/:id, POST /phieu-xuat, /ket-qua, /in → KHÔNG có gia_nhap / gia_von / don_gia',
    nvPhan.every((r) => r.status === 200) && nvPhan.every((r) => !coGia(r).length), nvPhan.map((r) => `${r.status}:${coGia(r).join(',')}`).join(' | '));
  const qlPhieu = await goi('ql', 'GET', `/kho/phieu/${c1id}`);
  k('G3b quản lý thấy giá (tồn: gia_nhap; phiếu: don_gia / gia_von)', coGia(g.r).includes('"gia_nhap"') && coGia(qlPhieu).length > 0);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[H] danh sách phiếu · in · sửa · huỷ');
  const ds = async (qs) => ((await goi('ql', 'GET', '/kho/phieu' + qs)).phieu || []).map((p) => p.id).sort((a, b) => a - b);
  const sqlIds = async (w, a = []) => (await q(`SELECT id FROM kho_phieu WHERE ${w} ORDER BY id`, a)).map((r) => Number(r.id));
  const h1 = [await ds('?loai=PX&trang_thai=huy'), await ds('?loai=PN'), await ds('?tu=2026-11-01&den=2026-11-01')];
  const h1s = [await sqlIds("loai = 'PX' AND trang_thai = 'huy'"), await sqlIds("loai = 'PN'"), await sqlIds("substr(tao_luc, 1, 10) BETWEEN '2026-11-01' AND '2026-11-01'")];
  k('H1 lọc loại / trạng thái / ngày đúng', h1s.every((x) => x.length > 0) && JSON.stringify(h1) === JSON.stringify(h1s), JSON.stringify([h1, h1s]));
  const in1 = await goi('ql', 'POST', `/kho/phieu/${c1id}/in`);
  const in2 = await goi('ql', 'POST', `/kho/phieu/${c1id}/in`);
  k('H2 in: số lần in tăng mỗi lần (sau lần in của G3: 2 rồi 3)', in1.phieu?.so_lan_in === 2 && in2.phieu?.so_lan_in === 3, `${in1.phieu?.so_lan_in} ${in2.phieu?.so_lan_in}`);
  const dongC1 = await so('SELECT COUNT(*) FROM kho_phieu_dong WHERE phieu_id = ?', [c1id || 0]);
  const tonH = await tonQL();
  datGio('2026-11-08T10:00:00');
  const h4 = [await goi('ql', 'POST', `/kho/phieu/${c1id}/sua`, { mon: [{ san_pham_id: s1, so_phan: 12 }], ly_do: 'x' }),
    await goi('nv', 'POST', `/kho/phieu/${c1id}/huy`, { ly_do: 'x' }), await goi('ql', 'POST', `/kho/phieu/${c1id}/huy`, { ly_do: 'x' }),
    await goi('chu', 'POST', `/kho/phieu/${c1id}/sua`, { mon: [{ san_pham_id: s1, so_phan: 12 }] }), await goi('chu', 'POST', `/kho/phieu/${c1id}/huy`, {})];
  k('H4 manager / staff sửa / huỷ → 403; chủ quán thiếu lý do → 400 THIEU_LY_DO', h4.slice(0, 3).every((r) => r.status === 403)
    && h4.slice(3).every((r) => r.status === 400 && r.code === 'THIEU_LY_DO'), h4.map(moTa).join(' | '));
  const h3 = await goi('chu', 'POST', `/kho/phieu/${c1id}/sua`, { mon: [{ san_pham_id: s1, so_phan: 12 }, { san_pham_id: s2, so_phan: 4 }], ly_do: 'ghi nhầm số' });
  const tonH3 = await tonQL();
  const loMoi = await mot('SELECT * FROM kho_lo WHERE phieu_id = ? AND san_pham_id = ?', [h3.phieu?.id || 0, s1]);
  k('H3 chủ quán sửa → phiếu MỚI (thay_cho_id), cũ huy, dòng cũ GIỮ; tồn theo phiếu mới (Cam −0.4, Kỷ tử như cũ); lô cũ + kết quả rơi khỏi tồn; lô mới hạn theo giờ làm CŨ',
    h3.status === 200 && h3.phieu?.thay_cho_id === c1id && h3.phieu?.trang_thai === 'da_duyet'
    && (await mot('SELECT trang_thai FROM kho_phieu WHERE id = ?', [c1id || 0]))?.trang_thai === 'huy'
    && (await so('SELECT COUNT(*) FROM kho_phieu_dong WHERE phieu_id = ?', [c1id || 0])) === dongC1
    && gan(tonH3.nl(n1).ton, tonH.nl(n1).ton - 0.4) && gan(tonH3.nl(n2).ton, tonH.nl(n2).ton) && (await tonLo(loS1?.id)) === 0
    && loMoi && Number(loMoi.so_luong) === 12 && loMoi.han_dung === '2026-11-09T06:00:00', `${moTa(h3)} ${JSON.stringify(loMoi)}`);
  const h3k = await kq('chu', h3.phieu?.id, { san_pham_id: s1, so_thuc: 1 });
  k('F6b phiếu sửa: không mở lại ô kết quả → 409; trạng thái đã chốt (không tu_chot)', h3k.status === 409 && tm(h3, s1).ket_qua?.trang_thai === 'da_dien', moTa(h3k));
  const cuDoc = await goi('ql', 'GET', `/kho/phieu/${c1id}`);
  k('H3b phiếu cũ trỏ sang phiếu thay (thay_bang_id), giữ lý do', cuDoc.phieu?.thay_bang_id === h3.phieu?.id && cuDoc.phieu?.ly_do === 'ghi nhầm số', JSON.stringify(cuDoc.phieu));
  const h5Truoc = await tonQL();
  const h5p = await px('ql', [{ san_pham_id: s2, so_phan: 3 }], 'g-h5');
  const h5 = await goi('chu', 'POST', `/kho/phieu/${h5p.phieu?.id}/huy`, { ly_do: 'làm nhầm' });
  const h5Sau = await tonQL();
  k('H5 huỷ phiếu đã duyệt → tồn nguyên liệu về như trước; lô thành phẩm rơi khỏi tồn', h5.status === 200 && h5.phieu?.trang_thai === 'huy'
    && gan(h5Sau.nl(n2).ton, h5Truoc.nl(n2).ton) && (await tonLo((await mot('SELECT id FROM kho_lo WHERE phieu_id = ?', [h5p.phieu?.id || 0]))?.id)) === 0, moTa(h5));
  const h5b = await goi('chu', 'POST', `/kho/phieu/${h5p.phieu?.id}/huy`, { ly_do: 'lần hai' });
  k('H5b huỷ lại phiếu đã huỷ → 409 PHIEU_DA_XU_LY', h5b.status === 409 && h5b.code === 'PHIEU_DA_XU_LY', moTa(h5b));
  const h6 = await duaDuyet('h6', (id) => goi('chu', 'POST', `/kho/phieu/${id}/sua`, { mon: [{ san_pham_id: s2, so_phan: 2 }], ly_do: 'sửa' }),
    (id) => goi('ql', 'POST', `/kho/phieu/${id}/duyet`));
  const thay6 = await q("SELECT id, trang_thai FROM kho_phieu WHERE thay_cho_id = ?", [h6.id]);
  const loCon6 = await so(`SELECT COUNT(*) FROM kho_lo l JOIN kho_phieu p ON p.id = l.phieu_id WHERE (p.id = ? OR p.thay_cho_id = ?) AND p.trang_thai = 'da_duyet'`, [h6.id, h6.id]);
  k('H6 sửa song song với duyệt → phiếu gốc huy, đúng MỘT phiếu thay còn hiệu lực, đúng MỘT lô còn hiệu lực', h6.tt === 'huy' && thay6.length === 1
    && thay6[0].trang_thai === 'da_duyet' && loCon6 === 1 && h6.kq.some((r) => r.status === 200), `${h6.kq.map(moTa).join(' | ')} · ${h6.tt} · lô ${loCon6}`);
  const h7p = await px('nv', [{ san_pham_id: s2, so_phan: 1 }], 'g-h7');
  const h7t = await tonQL();
  const h7 = await goi('chu', 'POST', `/kho/phieu/${h7p.phieu?.id}/huy`, { ly_do: 'không làm' });
  k('H7 huỷ phiếu chờ duyệt → huy, tồn không đổi', h7.status === 200 && h7.phieu?.trang_thai === 'huy' && gan((await tonQL()).nl(n2).ton, h7t.nl(n2).ton), moTa(h7));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[I] quyền');
  const DUONG = [ // [phương thức, đường, thân, vai trò được]
    ['GET', '/kho/pha-che', null, 'oms'], ['GET', '/kho/dinh-muc', null, 'om'], ['PUT', '/kho/dinh-muc', {}, 'om'], ['POST', '/kho/nhom-cong-thuc', {}, 'om'],
    ['PUT', '/kho/nhom-cong-thuc/999999', {}, 'om'], ['PUT', '/kho/san-pham/999999', {}, 'o'], ['POST', '/kho/phieu-xuat', {}, 'oms'], ['GET', '/kho/phieu', null, 'oms'],
    ['GET', '/kho/phieu/999999', null, 'oms'], ['POST', '/kho/phieu/999999/in', null, 'oms'], ['POST', '/kho/phieu/999999/duyet', null, 'om'],
    ['POST', '/kho/phieu/999999/tu-choi', { ly_do: 'x' }, 'om'], ['POST', '/kho/phieu/999999/ket-qua', { san_pham_id: 1 }, 'oms'],
    ['POST', '/kho/phieu/999999/sua', { mon: [{ san_pham_id: s2, so_phan: 1 }], ly_do: 'x' }, 'o'], ['POST', '/kho/phieu/999999/huy', { ly_do: 'x' }, 'o'], ['GET', '/kho/ton', null, 'oms'],
  ];
  const sai = [];
  for (const [m, u, b, duoc] of DUONG) {
    for (const [ai, ma] of [['chu', 'o'], ['ql', 'm'], ['nv', 's'], ['la', 'x']]) {
      const r = await goi(ai, m, u, b);
      if (duoc.includes(ma) ? [401, 403].includes(r.status) : r.status !== 403) sai.push(`${ai} ${m} ${u} → ${r.status}`);
    }
    if ((await goi(null, m, u, b)).status !== 401) sai.push(`không token ${m} ${u}`);
  }
  k('I1 bảng quyền: mỗi đường × owner / manager / staff / vai trò lạ / không token đúng mã', !sai.length, sai.join(' | '));
  const la = [await goi('chu', 'GET', '/kho/khong-co'), await goi('ql', 'POST', `/kho/phieu/${c1id}/xoa`), await goi('nv', 'DELETE', `/kho/phieu/${c1id}`)];
  k('I2 đường lạ dưới /api/pos/kho → 403 DUONG_LA, không lộ dữ liệu', la.every((r) => r.status === 403 && r.code === 'DUONG_LA' && !r.phieu), la.map(moTa).join(' | '));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[J] bán hàng chạy như cũ');
  await ghiDb("UPDATE pos_products SET price = 25000 WHERE code = 'CT1'");
  await ghiDb("INSERT OR IGNORE INTO kho_san_pham (pos_product_id, kieu) VALUES (?, 'lam_san')", [ct1?.id || 0]);
  await themLo('san_pham_id', ct1?.id || 0, 5, null);
  const dongJ = await so('SELECT COUNT(*) FROM kho_phieu_dong');
  const truJ = demSX.tru;
  const sp1 = await mot("SELECT * FROM pos_products WHERE code = 'CT1'");
  const don = await goi('chu', 'POST', '/orders', { customer_name: 'Khách KHO2a', items: [{ product_id: sp1.id, sx_product_type: sp1.sx_product_type,
    sx_product_id: sp1.sx_product_id, quantity: 1 }], payment_method: 'cash', cash_amount: 25000 });
  const donDb = await mot('SELECT total FROM pos_orders WHERE id = ?', [don.order?.id || don.order_id || don.id || 0]);
  k('J1 đơn món làm sẵn đã có lô → 200, tổng 25.000, SX nhận 1 lệnh trừ kho như cũ, kho_phieu_dong KHÔNG thêm dòng (KHO-3 mới trừ)',
    don.success === true && Number(donDb?.total) === 25000 && demSX.tru === truJ + 1 && (await so('SELECT COUNT(*) FROM kho_phieu_dong')) === dongJ,
    `${moTa(don)} total ${donDb?.total} · SX +${demSX.tru - truJ}`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[K] cấu trúc');
  const kt = doc(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'));
  k('K1 bộ kiểm chạy bài này', /chayBaiThat\('cong_cu\/thu_KHO2a\.js'\)/.test(kt));
  const kd = path.join(GOC, 'client', 'src', 'pages', 'Kho');
  const idx = doc(path.join(kd, 'index.jsx'));
  k('K2 màn Kho: PhaChe · TonKho · DsPhieu · XemPhieu · DinhMuc có; tab đầu là Pha chế', ['PhaChe', 'TonKho', 'DsPhieu', 'XemPhieu', 'DinhMuc']
    .every((f) => fs.existsSync(path.join(kd, f + '.jsx'))) && /tabs = \[\s*\{ ma: 'pc'/.test(idx));
  const tinhSrc = doc(path.join(MAY_CHU, 'kho', 'tinh.js')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  k('K3 tinh.js vẫn THUẦN (không require, không Date / getNow)', tinhSrc.length > 0 && !/require\(|\bDate\b|getNow/.test(tinhSrc));

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
