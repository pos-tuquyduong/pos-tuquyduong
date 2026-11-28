#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════════
 *  THỬ KHO-GON-2 — Pha chế (tối đa theo kho, chặn thiếu, món đun nồi, trừ lô gói) · ảnh hoá đơn phiếu nhận ·
 *  thẻ nguyên liệu · luật duyệt mới (nhận cộng ngay) · màn điện thoại
 * ════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_KHOGON2.js [--may-chu <thư mục server>]
 *  Khuôn thu_KHOGON1.js: database.js thật + libsql trên kho TẠM, route thật qua app.listen(0), JWT theo vai trò, TZ=UTC,
 *  đồng hồ thay trong tiến trình (`datGio` = giờ Việt Nam). Phần màn (client/src) là phép dò mã nguồn — không có trình duyệt.
 * ════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const CLIENT = path.join(MAY_CHU, '..', 'client', 'src');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khogon2_'));
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
process.env.JWT_SECRET = 'thu_khogon2_' + DateGoc.now();

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
const js = (x) => String(JSON.stringify(x));
const gan = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-9;
const coKhoa = (x, ds) => (Array.isArray(x) ? x.some((v) => coKhoa(v, ds))
  : x && typeof x === 'object' ? Object.entries(x).some(([kh, v]) => ds.includes(kh) || coKhoa(v, ds)) : false);
/** Byte giả có đầu đúng kiểu (máy chủ kiểm byte đầu) — đủ `co` byte. */
const anhGia = (kieu, co) => {
  const dau = { jpeg: [0xFF, 0xD8, 0xFF, 0xE0], png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], pdf: [...Buffer.from('%PDF-1.4\n')] }[kieu];
  const b = Buffer.alloc(co, 0x41);
  Buffer.from(dau).copy(b);
  return b;
};

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();
  const app = express();
  app.use(express.json());
  app.use('/api/pos/settings', require(path.join(MAY_CHU, 'routes', 'settings.js')));
  const kho = nap('kho/duong.js');
  if (typeof kho === 'function') app.use('/api/pos/kho', kho);
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  const tinh = nap('kho/tinh.js');
  noiLai();

  const ghiDb = (sql, a = []) => db.run(sql, a).catch(() => null);
  const mot = async (sql, a = []) => db.queryOne(sql, a).catch(() => null);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const nguoi = { chu: (await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1")).id };
  const tenDN = { chu: (await mot('SELECT username FROM pos_users WHERE id = ?', [nguoi.chu])).username };
  for (const [ai, ten, vaiTro] of [['ql', 'ql_a', 'manager'], ['ql2', 'ql_b', 'manager'], ['nv', 'nv_a', 'staff'], ['nv2', 'nv_b', 'staff'], ['la', 'la_a', 'viewer']]) {
    nguoi[ai] = Number((await ghiDb("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)", [ten, ten, vaiTro])).lastInsertRowid);
    tenDN[ai] = ten;
  }
  const the = Object.fromEntries(Object.entries(nguoi).map(([a, id]) => [a, jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '3650d' })]));
  const goi = async (ai, method, url, body, raw) => {
    imLang();
    try {
      const headers = ai ? { Authorization: 'Bearer ' + the[ai] } : {};
      if (body) headers['Content-Type'] = 'application/json';
      if (raw) headers['Content-Type'] = raw.kieu;
      const r = await fetch(goc + url, { method, headers, body: raw ? raw.byte : body ? js(body) : undefined });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const guiAnh = (ai, phieuId, byte, kieu = 'image/jpeg') => goi(ai, 'POST', `/kho/phieu/${phieuId}/anh`, null, { byte, kieu });
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;
  const tonNL = (id) => so(`SELECT COALESCE(SUM(d.so_luong), 0) FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id
    WHERE d.nguyen_lieu_id = ? AND p.trang_thai = 'da_duyet' AND p.loai <> 'DH'`, [id]);
  const tonSP = (id) => so(`SELECT COALESCE(SUM(d.so_luong), 0) FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id
    WHERE d.san_pham_id = ? AND d.lo_id IS NOT NULL AND p.trang_thai = 'da_duyet' AND p.loai <> 'DH'`, [id]);
  const demPhieu = (loai) => so('SELECT COUNT(*) FROM kho_phieu WHERE loai = ?', [loai]);
  const ttCua = async (id) => (await mot('SELECT trang_thai FROM kho_phieu WHERE id = ?', [id]))?.trang_thai;
  /** Nhập nền — chạy được cả trên gốc (PN chờ → người khác duyệt) lẫn bản vá (PN cộng ngay; duyệt lần nữa = 409 vô hại). */
  const nhap = async (nlId, luong, ma) => {
    const r = await goi('nv', 'POST', '/kho/phieu-nhan', { dong: [{ nguyen_lieu_id: nlId, luong }], ma_gui: ma });
    await goi('ql', 'POST', `/kho/phieu/${r.phieu?.id}/duyet`);
    return r;
  };

  console.log('\nTHỬ KHO-GON-2 — pha chế theo kho · món nồi · trừ lô gói · ảnh hoá đơn · thẻ nguyên liệu · luật duyệt mới');

  // ── Dữ liệu nền (01.12) ──
  datGio('2026-12-01T08:00:00');
  const themNL = async (ten, toiThieu = null) => Number((await ghiDb(`INSERT INTO kho_nguyen_lieu (ten, ten_chuan, don_vi_luu, he_so_doi, gia_nhap, ton_toi_thieu,
    dang_dung, tao_luc) VALUES (?, ?, 'kg', 1, 10000, ?, 1, '2026-11-01T00:00:00')`, [ten, ten.toLowerCase(), toiThieu]))?.lastInsertRowid);
  const themMon = async (code, ten, nhom = 'drink') => Number((await ghiDb("INSERT INTO pos_products (code, name, category, price, unit, is_active) VALUES (?, ?, ?, 20000, 'ly', 1)",
    [code, ten, nhom]))?.lastInsertRowid);
  const nCam = await themNL('Cam', 5);
  const nMat = await themNL('Mật ong');
  const nAtiso = await themNL('Atiso');
  const nCo = await themNL('Cỏ ngọt');
  const nTra = await themNL('Trà xanh', 1);
  const sNC = await themMon('G1', 'Nước cam');          // 0.2 Cam / phần
  const sCM = await themMon('G2', 'Cam mật ong');       // 0.3 Cam + 0.1 Mật ong / phần
  const sGoi = await themMon('G3', 'Gói trà atiso');   // làm sẵn: 10 Atiso + 2 Cỏ ngọt / gói
  const sTra = await themMon('G4', 'Trà atiso nồi');   // làm sẵn, đun nồi: 1/25 gói / ly, mỗi mẻ 25 ly
  const sTX = await themMon('G5', 'Trà xanh pha', 'tea');   // làm sẵn, KHÔNG mẻ
  await goi('chu', 'PUT', `/kho/san-pham/${sNC}`, { kieu: 'lam_san', han_ngay: 3, cong_thuc: [{ nguyen_lieu_id: nCam, luong: 0.2 }] });
  await goi('chu', 'PUT', `/kho/san-pham/${sCM}`, { kieu: 'lam_san', cong_thuc: [{ nguyen_lieu_id: nCam, luong: 0.3 }, { nguyen_lieu_id: nMat, luong: 0.1 }] });
  await goi('chu', 'PUT', `/kho/san-pham/${sGoi}`, { kieu: 'lam_san', han_ngay: 30, cong_thuc: [{ nguyen_lieu_id: nAtiso, luong: 10 }, { nguyen_lieu_id: nCo, luong: 2 }] });
  await goi('chu', 'PUT', `/kho/san-pham/${sTX}`, { kieu: 'lam_san', cong_thuc: [{ nguyen_lieu_id: nTra, luong: 0.05 }] });
  await nhap(nCam, 1, 'n1');
  await nhap(nMat, 1, 'n2');
  await nhap(nAtiso, 200, 'n3');
  await nhap(nCo, 50, 'n4');
  await nhap(nTra, 2, 'n5');
  k('Nền: Cam 1 · Mật ong 1 · Atiso 200 · Cỏ ngọt 50 · Trà xanh 2', gan(await tonNL(nCam), 1) && gan(await tonNL(nAtiso), 200) && gan(await tonNL(nTra), 2),
    `${await tonNL(nCam)} · ${await tonNL(nAtiso)} · ${await tonNL(nTra)}`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A4] món đun nồi: "Mỗi mẻ ra" + "Ghi chú mẻ" ở Sản phẩm & công thức');
  const ctTra = [{ thanh_phan_id: sGoi, luong: 0.04 }];
  const a4a = await goi('chu', 'PUT', `/kho/san-pham/${sTra}`, { kieu: 'lam_san', han_ngay: 1, me_ra: 25, me_ghi: '+ 5 L nước', cong_thuc: ctTra });
  const spDs = async () => (await goi('chu', 'GET', '/kho/san-pham')).san_pham || [];
  const spTra = (await spDs()).find((p) => p.id === sTra) || {};
  k('A4a lưu me_ra 25 + me_ghi "+ 5 L nước" → đọc lại đúng', a4a.status === 200 && Number(spTra.me_ra) === 25 && spTra.me_ghi === '+ 5 L nước', `${moTa(a4a)} · ${spTra.me_ra} · ${spTra.me_ghi}`);
  const meSai = [];
  for (const x of [0, -1, 'abc', Infinity]) {
    const r = await goi('chu', 'PUT', `/kho/san-pham/${sTra}`, { kieu: 'lam_san', me_ra: x === Infinity ? '1e999' : x, cong_thuc: ctTra });
    if (!(r.status === 400 && r.code === 'ME_SAI')) meSai.push(`${x}: ${moTa(r)}`);
  }
  const r61 = await goi('chu', 'PUT', `/kho/san-pham/${sTra}`, { kieu: 'lam_san', me_ghi: 'x'.repeat(61), cong_thuc: ctTra });
  const r60 = await goi('chu', 'PUT', `/kho/san-pham/${sTra}`, { kieu: 'lam_san', me_ghi: 'y'.repeat(60), cong_thuc: ctTra });
  k('A4b me_ra 0 / âm / chữ / vô hạn → 400 ME_SAI; me_ghi 61 ký tự → 400, 60 ký tự → 200', !meSai.length && r61.status === 400 && r61.code === 'ME_SAI' && r60.status === 200,
    `${meSai.join(' | ')} · 61: ${moTa(r61)} · 60: ${moTa(r60)}`);
  const giu = (await spDs()).find((p) => p.id === sTra) || {};
  k('A4c không gửi me_ra = GIỮ 25 (màn cũ không gửi trường này)', Number(giu.me_ra) === 25, String(giu.me_ra));
  await goi('chu', 'PUT', `/kho/san-pham/${sTra}`, { kieu: 'lam_san', me_ghi: '+ 5 L nước', cong_thuc: ctTra });
  const boMe = await goi('chu', 'PUT', `/kho/san-pham/${sTX}`, { kieu: 'lam_san', me_ra: '', me_ghi: '', cong_thuc: [{ nguyen_lieu_id: nTra, luong: 0.05 }] });
  const tx0 = (await spDs()).find((p) => p.id === sTX) || {};
  k('A4d me_ra "" = không theo mẻ (null)', boMe.status === 200 && tx0.me_ra == null && tx0.me_ghi == null, `${moTa(boMe)} · ${tx0.me_ra}`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A2] tối đa theo kho — MỘT hàm thuần tinh.toiDa');
  const td = tinh.toiDa || (() => undefined);
  const M = (o) => new Map(Object.entries(o));
  k('A2a 1 nguyên liệu: tồn 10, 3 / phần → 3', td([{ khoa: 'a', luong: 3 }], M({ a: 10 })) === 3, String(td([{ khoa: 'a', luong: 3 }], M({ a: 10 }))));
  k('A2b 2 nguyên liệu → lấy nhỏ nhất (10/3 = 3, 10/2 = 5 → 3)', td([{ khoa: 'a', luong: 3 }, { khoa: 'b', luong: 2 }], M({ a: 10, b: 10 })) === 3);
  k('A2c biên: 9 / 3 = 3 · 8.999 / 3 = 2 · 0.3 / 0.1 = 3 (số thực lẻ)', td([{ khoa: 'a', luong: 3 }], M({ a: 9 })) === 3 && td([{ khoa: 'a', luong: 3 }], M({ a: 8.999 })) === 2
    && td([{ khoa: 'a', luong: 0.1 }], M({ a: 0.3 })) === 3, `${td([{ khoa: 'a', luong: 0.1 }], M({ a: 0.3 }))}`);
  k('A2d tồn 0 / âm / không có → 0; công thức rỗng → null (không giới hạn)', td([{ khoa: 'a', luong: 1 }], M({ a: 0 })) === 0 && td([{ khoa: 'a', luong: 1 }], M({ a: -2 })) === 0
    && td([{ khoa: 'a', luong: 1 }], M({})) === 0 && td([], M({})) === null);
  const pc = async (ai = 'nv') => goi(ai, 'GET', '/kho/pha-che');
  let p0 = await pc();
  const monCua = (p, id) => (p.mon || []).find((m) => m.san_pham_id === id) || {};
  k('A2e GET /pha-che: Nước cam (0.2 Cam, Cam 1) → toi_da 5, mot_phan có Cam 0.2', monCua(p0, sNC).toi_da === 5
    && (monCua(p0, sNC).mot_phan || []).some((d) => d.khoa === `nl:${nCam}` && gan(d.luong, 0.2)), js(monCua(p0, sNC)).slice(0, 200));
  k('A2f Cam mật ong (0.3 Cam · 0.1 Mật ong) → toi_da 3 (Cam chặn)', monCua(p0, sCM).toi_da === 3, String(monCua(p0, sCM).toi_da));
  k('A2g món dùng gói, gói hết → toi_da 0', monCua(p0, sTra).toi_da === 0 && (monCua(p0, sTra).mot_phan || []).some((d) => d.khoa === `sp:${sGoi}`),
    js(monCua(p0, sTra)).slice(0, 200));
  const khoCam = (p0.kho || []).find((x) => x.khoa === `nl:${nCam}`) || {};
  k('A2h bảng kho có tên + tồn để màn cộng chân "Thiếu:"', khoCam.ten === 'Cam' && gan(khoCam.ton, 1) && 'don_vi' in khoCam, js(khoCam));
  k('A1a mỗi món có nhom_id + me_ra + me_ghi; danh sách nhóm đi kèm', Array.isArray(p0.nhom) && 'nhom_id' in monCua(p0, sNC) && monCua(p0, sTra).me_ra === 25
    && monCua(p0, sTra).me_ghi === '+ 5 L nước' && monCua(p0, sTX).me_ra === null);
  k('A2i nhân viên không nhận khoá giá ở /pha-che', !coKhoa(p0, ['gia_nhap', 'don_gia', 'gia_von']));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A3] máy chủ chặn phiếu xuất pha chế thiếu nguyên liệu (Q1) — lúc tạo và lúc duyệt; chủ quán sửa không chặn');
  const px = (ai, mon, ma) => goi(ai, 'POST', '/kho/phieu-xuat', { mon, ma_gui: ma });
  const demPX = await demPhieu('PX');
  const a3a = await px('ql', [{ san_pham_id: sNC, so_phan: 3 }, { san_pham_id: sCM, so_phan: 2 }], 'a3a');   // 0.6 + 0.6 = 1.2 Cam > 1
  k('A3a hai món mỗi món ≤ tối đa nhưng TỔNG vượt → 409 THIEU_NGUYEN_LIEU, có dòng Cam (cần 1.2, có 1); không phiếu, tồn giữ',
    a3a.status === 409 && a3a.code === 'THIEU_NGUYEN_LIEU' && (a3a.thieu || []).some((t) => t.ten === 'Cam' && gan(t.can, 1.2) && gan(t.co, 1))
    && (await demPhieu('PX')) === demPX && gan(await tonNL(nCam), 1), `${moTa(a3a)} · ${js(a3a.thieu)}`);
  const a3b = await px('chu', [{ san_pham_id: sNC, so_phan: 6 }], 'a3b');
  k('A3b một món vượt (6 × 0.2 = 1.2) → 409 (chủ quán tạo mới cũng chặn)', a3b.status === 409 && a3b.code === 'THIEU_NGUYEN_LIEU', moTa(a3b));
  const a3c = await px('nv', [{ san_pham_id: sNC, so_phan: 6 }], 'a3c');
  k('A3c nhân viên tạo phiếu chờ mà vượt → 409 ngay lúc tạo', a3c.status === 409 && a3c.code === 'THIEU_NGUYEN_LIEU' && (await demPhieu('PX')) === demPX, moTa(a3c));
  const a3d = await px('nv', [{ san_pham_id: sNC, so_phan: 4 }], 'a3d');   // 0.8 ≤ 1 → chờ duyệt
  const a3d2 = await px('ql', [{ san_pham_id: sCM, so_phan: 1 }], 'a3d2');   // ql trừ ngay 0.3 → Cam còn 0.7 < 0.8
  const a3d3 = await goi('ql2', 'POST', `/kho/phieu/${a3d.phieu?.id}/duyet`);
  k('A3d phiếu chờ: lúc tạo đủ, tới lúc DUYỆT kho không còn đủ → 409 THIEU_NGUYEN_LIEU, phiếu vẫn chờ, tồn không đổi',
    a3d.phieu?.trang_thai === 'cho_duyet' && a3d2.status === 200 && a3d3.status === 409 && a3d3.code === 'THIEU_NGUYEN_LIEU'
    && (await ttCua(a3d.phieu?.id)) === 'cho_duyet' && gan(await tonNL(nCam), 0.7), `${moTa(a3d)} · ${moTa(a3d2)} · ${moTa(a3d3)} · Cam ${await tonNL(nCam)}`);
  await goi('chu', 'POST', `/kho/phieu/${a3d.phieu?.id}/huy`, { ly_do: 'thử' });
  const a3e = await px('ql', [{ san_pham_id: sNC, so_phan: 3.5 }], 'a3e');   // 0.7 = đúng bằng tồn
  k('A3e đúng bằng tồn (3.5 × 0.2 = 0.7) → 200 (biên — không chặn oan)', a3e.status === 200 && gan(await tonNL(nCam), 0), `${moTa(a3e)} · Cam ${await tonNL(nCam)}`);
  const a3f = await goi('chu', 'POST', `/kho/phieu/${a3e.phieu?.id}/sua`, { mon: [{ san_pham_id: sNC, so_phan: 5 }], ly_do: 'đếm lại' });
  k('A3f K5 chủ quán SỬA phiếu cũ khi kho thiếu (5 phần cần 1, có 0.7 sau huỷ) → 200 không chặn, tồn âm như KHO-2a',
    a3f.status === 200 && gan(await tonNL(nCam), -0.3), `${moTa(a3f)} · Cam ${await tonNL(nCam)}`);
  await nhap(nCam, 2.3, 'n6');   // Cam về 2

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A4/Q2] trọn chuỗi: làm 10 gói (trừ thảo dược) → pha 2 nồi trà từ gói (CHỈ trừ lô gói)');
  const lg = await px('ql', [{ san_pham_id: sGoi, so_phan: 10 }], 'lamgoi');
  k('A4e làm 10 gói: Atiso 200 → 100, Cỏ ngọt 50 → 30, lô gói 10', lg.status === 200 && gan(await tonNL(nAtiso), 100) && gan(await tonNL(nCo), 30) && gan(await tonSP(sGoi), 10),
    `${moTa(lg)} · ${await tonNL(nAtiso)} · ${await tonNL(nCo)} · gói ${await tonSP(sGoi)}`);
  p0 = await pc();
  k('A2j sau khi có 10 gói: trà nồi tối đa 250 ly (10 gói ÷ 0.04)', monCua(p0, sTra).toi_da === 250, String(monCua(p0, sTra).toi_da));
  const tra = await px('ql', [{ san_pham_id: sTra, so_phan: 50 }], 'tra2noi');   // màn gửi 2 nồi × 25
  k('A4f pha 2 nồi (50 ly): lô trà 50, lô gói còn 8, thảo dược KHÔNG đổi (Atiso 100, Cỏ ngọt 30)', tra.status === 200 && gan(await tonSP(sTra), 50)
    && gan(await tonSP(sGoi), 8) && gan(await tonNL(nAtiso), 100) && gan(await tonNL(nCo), 30),
    `${moTa(tra)} · trà ${await tonSP(sTra)} · gói ${await tonSP(sGoi)} · Atiso ${await tonNL(nAtiso)} · Cỏ ${await tonNL(nCo)}`);
  const xemTra = await goi('nv', 'GET', `/kho/phieu/${tra.phieu?.id}`);
  const tmTra = (xemTra.theo_mon || [])[0] || {};
  k('A5a phiếu nồi: theo món có so_noi 2, me_ra 25, me_ghi; tổng có dòng gói 2', tmTra.so_noi === 2 && tmTra.me_ra === 25 && tmTra.me_ghi === '+ 5 L nước'
    && (xemTra.tong || []).some((t) => t.ten === 'Gói trà atiso' && gan(t.luong, 2)), `${js(tmTra).slice(0, 160)} · ${js(xemTra.tong).slice(0, 160)}`);
  const tra31 = await px('ql', [{ san_pham_id: sTra, so_phan: 30 }], 'tra30');   // máy cũ gửi số ly lẻ mẻ
  const x31 = await goi('nv', 'GET', `/kho/phieu/${tra31.phieu?.id}`);
  k('A4g K5 máy chưa tải lại gửi so_phan 30 (không chẵn mẻ) cho món có mẻ → 200, so_noi null, gói −1.2', tra31.status === 200 && ((x31.theo_mon || [])[0] || {}).so_noi === null
    && gan(await tonSP(sGoi), 6.8), `${moTa(tra31)} · gói ${await tonSP(sGoi)}`);
  const traQua = await px('ql', [{ san_pham_id: sTra, so_phan: 200 }], 'tra8noi');   // cần 8 gói, còn 6.8
  k('A4h không đủ gói → 409 KHONG_DU_TON, lô gói + thảo dược không đổi', traQua.status === 409 && traQua.code === 'KHONG_DU_TON' && gan(await tonSP(sGoi), 6.8)
    && gan(await tonNL(nAtiso), 100), `${moTa(traQua)} · gói ${await tonSP(sGoi)}`);
  const traCho = await px('nv', [{ san_pham_id: sTra, so_phan: 25 }], 'tracho');
  await px('ql', [{ san_pham_id: sTra, so_phan: 150 }], 'tra6noi');   // trừ 6 gói → còn 0.8 < 1
  const traDuyet = await goi('ql', 'POST', `/kho/phieu/${traCho.phieu?.id}/duyet`);
  k('A4i phiếu chờ của nhân viên: lúc duyệt gói không còn đủ → 409 KHONG_DU_TON, vẫn chờ', traCho.phieu?.trang_thai === 'cho_duyet' && traDuyet.status === 409
    && traDuyet.code === 'KHONG_DU_TON' && (await ttCua(traCho.phieu?.id)) === 'cho_duyet', `${moTa(traCho)} · ${moTa(traDuyet)}`);
  const tx1 = await px('ql', [{ san_pham_id: sTX, so_phan: 10 }], 'tx1');
  k('A4j K5 món làm sẵn không có mẻ (Trà xanh) gửi so_phan như cũ → 200, so_noi null', tx1.status === 200 && ((tx1.theo_mon || [])[0] || {}).so_noi === null && gan(await tonNL(nTra), 1.5),
    `${moTa(tx1)} · ${await tonNL(nTra)}`);
  const tk = tinh.trienKhai || (() => []);
  const bang = { [sTra]: [{ thanh_phan_id: sGoi, luong: 0.04 }], [sGoi]: [{ nguyen_lieu_id: nAtiso, luong: 10 }] };
  const tkMacDinh = tk({ goc: sTra, bang }, 25);
  k('A4k trienKhai MẶC ĐỊNH không đổi (bán hàng gọi thẳng — Cấm): gói vẫn triển khai xuống Atiso 10', tkMacDinh.length === 1 && tkMacDinh[0].nguyen_lieu_id === nAtiso && gan(tkMacDinh[0].luong, 10),
    js(tkMacDinh));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] luật duyệt: nhận hàng ai cũng cộng ngay · xuất theo công tắc · phiếu nhận cũ chờ duyệt như cũ');
  const e1 = [];
  for (const ai of ['nv', 'ql', 'chu']) {
    const t0 = await tonNL(nMat);
    const r = await goi(ai, 'POST', '/kho/phieu-nhan', { dong: [{ nguyen_lieu_id: nMat, luong: 1 }], ma_gui: 'e1' + ai });
    const lo = await so('SELECT COUNT(*) FROM kho_lo WHERE phieu_id = ?', [r.phieu?.id]);
    const dbNguoi = await mot("SELECT nguoi FROM kho_dien_bien WHERE phieu_id = ? AND loai = 'nhan_hang'", [r.phieu?.id]);
    if (!(r.status === 200 && r.phieu?.trang_thai === 'da_duyet' && gan(await tonNL(nMat), t0 + 1) && lo === 1 && dbNguoi?.nguoi === tenDN[ai]
      && r.phieu?.nguoi_duyet === tenDN[ai])) e1.push(`${ai}: ${moTa(r)} · ${r.phieu?.trang_thai} · lô ${lo} · db ${dbNguoi?.nguoi}`);
  }
  k('E1a nhân viên / quản lý / chủ quán nhận → đã duyệt NGAY, tồn +1, một lô, Diễn biến ghi đúng người nhận', !e1.length, e1.join(' | '));
  const t1 = await tonNL(nMat);
  const [e1b, e1c] = await Promise.all([1, 2].map(() => goi('nv', 'POST', '/kho/phieu-nhan', { dong: [{ nguyen_lieu_id: nMat, luong: 1 }], ma_gui: 'e1b' })));
  k('E1b bấm hai lần cùng ma_gui (đồng thời) → MỘT phiếu, tồn +1 (không cộng đôi)', e1b.phieu?.id === e1c.phieu?.id && gan(await tonNL(nMat), t1 + 1)
    && (await so("SELECT COUNT(*) FROM kho_phieu WHERE ma_gui = 'e1b'")) === 1, `${moTa(e1b)} · ${moTa(e1c)} · ${await tonNL(nMat)}`);
  // E3: phiếu nhận CŨ còn chờ (dữ liệu trước nâng cấp) — chèn thẳng như bản cũ đã ghi
  const pnCu = Number((await ghiDb(`INSERT INTO kho_phieu (loai, so_phieu, trang_thai, nguoi_tao, tao_luc) VALUES ('PN', 'PN-261130-901', 'cho_duyet', ?, '2026-11-30T10:00:00')`,
    [tenDN.nv]))?.lastInsertRowid);
  await ghiDb("INSERT INTO kho_phieu_dong (phieu_id, nguyen_lieu_id, so_luong, loai, nguoi, luc) VALUES (?, ?, 3, 'nhap', ?, '2026-11-30T10:00:00')", [pnCu, nMat, tenDN.nv]);
  const t3 = await tonNL(nMat);
  const e3a = await goi('nv', 'POST', `/kho/phieu/${pnCu}/duyet`);
  const e3tu = await goi('nv2', 'POST', `/kho/phieu/${pnCu}/duyet`);
  k('E3a phiếu nhận cũ còn chờ: tồn CHƯA cộng (không tự cộng khi nâng cấp); nhân viên không duyệt (403)', gan(t3, t1 + 1) && e3a.status === 403 && e3tu.status === 403 && (await ttCua(pnCu)) === 'cho_duyet',
    `${t3} · ${moTa(e3a)}`);
  const [e3b, e3c] = await Promise.all(['ql', 'ql2'].map((ai) => goi(ai, 'POST', `/kho/phieu/${pnCu}/duyet`)));
  k('E3b hai quản lý cùng bấm duyệt phiếu cũ → đúng MỘT lần ghi (+3), một lô', [e3b.status, e3c.status].sort().join() === '200,409' && gan(await tonNL(nMat), t3 + 3)
    && (await so('SELECT COUNT(*) FROM kho_lo WHERE phieu_id = ?', [pnCu])) === 1, `${moTa(e3b)} · ${moTa(e3c)} · ${await tonNL(nMat)}`);
  const pnCu2 = Number((await ghiDb(`INSERT INTO kho_phieu (loai, so_phieu, trang_thai, nguoi_tao, tao_luc) VALUES ('PN', 'PN-261130-902', 'cho_duyet', ?, '2026-11-30T10:00:00')`,
    [tenDN.ql]))?.lastInsertRowid);
  await ghiDb("INSERT INTO kho_phieu_dong (phieu_id, nguyen_lieu_id, so_luong, loai, nguoi, luc) VALUES (?, ?, 1, 'nhap', ?, '2026-11-30T10:00:00')", [pnCu2, nMat, tenDN.ql]);
  const e3d = await goi('ql', 'POST', `/kho/phieu/${pnCu2}/duyet`);
  k('E3c người tạo tự duyệt phiếu cũ → 403 TU_DUYET (luật cũ giữ cho phiếu cũ)', e3d.status === 403 && e3d.code === 'TU_DUYET', moTa(e3d));
  // E2: công tắc (khoá kho_px_nv_can_duyet: '0' = nhân viên xuất không cần duyệt)
  const ps = (ai, ma) => goi(ai, 'POST', '/kho/phieu-phat-sinh', { su_co: 'hong', muc: [{ nguyen_lieu_id: nMat, luong: 0.1 }], ma_gui: ma });
  const e2a = await ps('nv', 'e2a');
  const e2b = await px('nv', [{ san_pham_id: sTX, so_phan: 1 }], 'e2b');
  const e2q = await ps('ql', 'e2q');
  k('E2a công tắc TẮT (mặc định): nhân viên phát sinh + pha chế → chờ; quản lý → trừ ngay', e2a.phieu?.trang_thai === 'cho_duyet' && e2b.phieu?.trang_thai === 'cho_duyet'
    && e2q.phieu?.trang_thai === 'da_duyet', `${e2a.phieu?.trang_thai} · ${e2b.phieu?.trang_thai} · ${e2q.phieu?.trang_thai}`);
  const ccNv = await goi('nv', 'PUT', '/settings', { settings: { kho_px_nv_can_duyet: '0' } });
  const ccQl = await goi('ql', 'PUT', '/settings', { settings: { kho_px_nv_can_duyet: '0' } });
  k('E2b nhân viên / quản lý đổi công tắc → 403', ccNv.status === 403 && ccQl.status === 403, `${moTa(ccNv)} · ${moTa(ccQl)}`);
  const ccChu = await goi('chu', 'PUT', '/settings', { settings: { kho_px_nv_can_duyet: '0' } });
  const tPS = await tonNL(nMat);
  const e2c = await ps('nv', 'e2c');
  const e2d = await px('nv', [{ san_pham_id: sTX, so_phan: 1 }], 'e2d');
  const e2dh = await goi('nv', 'POST', '/kho/phieu-dat', { nguyen_lieu: [{ nguyen_lieu_id: nMat, luong: 1 }], ma_gui: 'e2dh' });
  const dbPS = await mot("SELECT nguoi FROM kho_dien_bien WHERE phieu_id = ? AND loai = 'phat_sinh'", [e2c.phieu?.id]);
  k('E2c chủ quán bật → nhân viên phát sinh + pha chế trừ NGAY + Diễn biến; đặt hàng (DH) giữ luật cũ (chờ)', ccChu.status === 200 && e2c.phieu?.trang_thai === 'da_duyet'
    && e2d.phieu?.trang_thai === 'da_duyet' && gan(await tonNL(nMat), tPS - 0.1) && dbPS?.nguoi === tenDN.nv && e2dh.phieu?.trang_thai === 'cho_duyet',
    `${moTa(ccChu)} · ${e2c.phieu?.trang_thai} · ${e2d.phieu?.trang_thai} · DH ${e2dh.phieu?.trang_thai}`);
  await goi('chu', 'PUT', '/settings', { settings: { kho_px_nv_can_duyet: '1' } });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] ảnh hoá đơn của phiếu nhận');
  const pnA = await goi('nv', 'POST', '/kho/phieu-nhan', { dong: [{ nguyen_lieu_id: nMat, luong: 1 }], ma_gui: 'pnA', ghi_chu: 'HĐ 123' });
  const idA = pnA.phieu?.id;
  const b3a = await guiAnh('nv', idA, anhGia('jpeg', 200 * 1024));
  k('B3a JPEG thật 200 KB → 200, trả id + kiểu + cỡ', b3a.status === 200 && b3a.anh?.kieu === 'image/jpeg' && b3a.anh?.co === 200 * 1024 && b3a.anh?.id > 0, moTa(b3a));
  const b3b = await guiAnh('nv', idA, anhGia('pdf', 50 * 1024), 'image/jpeg');
  k('B3b file đổi đuôi .jpg mà byte là PDF (Content-Type image/jpeg) → 400 ANH_KHONG_HOP_LE', b3b.status === 400 && b3b.code === 'ANH_KHONG_HOP_LE', moTa(b3b));
  const b3c = await guiAnh('nv', idA, anhGia('jpeg', 401 * 1024));
  k('B3c 401 KB → 413 ANH_QUA_LON', b3c.status === 413 && b3c.code === 'ANH_QUA_LON', moTa(b3c));
  const b3d = await guiAnh('nv', idA, anhGia('png', 400 * 1024), 'image/png');
  k('B3d K5 PNG đúng 400 KB (biên, ảnh từ máy tính) → 200', b3d.status === 200 && b3d.anh?.kieu === 'image/png', moTa(b3d));
  const [b3e1, b3e2] = await Promise.all([1, 2].map(() => guiAnh('nv', idA, anhGia('jpeg', 1024))));
  const demAnh = () => so('SELECT COUNT(*) FROM kho_anh_phieu WHERE phieu_id = ?', [idA]);
  k('B3e đang có 2 ảnh, hai lần gửi CÙNG LÚC → đúng một lọt (tối đa 3), lần kia 400 QUA_SO_ANH', [b3e1.status, b3e2.status].sort().join() === '200,400'
    && [b3e1, b3e2].some((r) => r.code === 'QUA_SO_ANH') && (await demAnh()) === 3, `${moTa(b3e1)} · ${moTa(b3e2)} · ${await demAnh()}`);
  const b3f = await guiAnh('ql', idA, anhGia('jpeg', 1024));
  k('B3f ảnh thứ 4 → 400 QUA_SO_ANH', b3f.status === 400 && b3f.code === 'QUA_SO_ANH' && (await demAnh()) === 3, moTa(b3f));
  const pnB = await goi('nv', 'POST', '/kho/phieu-nhan', { dong: [{ nguyen_lieu_id: nMat, luong: 1 }], ma_gui: 'pnB' });
  const b3g = await guiAnh('nv2', pnB.phieu?.id, anhGia('jpeg', 1024));
  const b3h = await guiAnh('ql', pnB.phieu?.id, anhGia('jpeg', 1024));
  k('B3g Q5 nhân viên KHÁC gắn ảnh phiếu người khác → 403; quản lý gắn được (K5)', b3g.status === 403 && b3h.status === 200, `${moTa(b3g)} · ${moTa(b3h)}`);
  const b3i = await guiAnh('ql', tx1.phieu?.id, anhGia('jpeg', 1024));
  k('B3i gắn ảnh vào phiếu pha chế (PX) → 400 CHI_PHIEU_NHAN', b3i.status === 400 && b3i.code === 'CHI_PHIEU_NHAN', moTa(b3i));
  const pnHuy = await goi('nv', 'POST', '/kho/phieu-nhan', { dong: [{ nguyen_lieu_id: nMat, luong: 1 }], ma_gui: 'pnHuy' });
  await goi('chu', 'POST', `/kho/phieu/${pnHuy.phieu?.id}/huy`, { ly_do: 'nhầm' });
  const b3j = await guiAnh('nv', pnHuy.phieu?.id, anhGia('jpeg', 1024));
  const b3k = await guiAnh('nv', 999999, anhGia('jpeg', 1024));
  k('B3j phiếu đã huỷ → 409 PHIEU_DA_HUY; phiếu không có → 404', b3j.status === 409 && b3j.code === 'PHIEU_DA_HUY' && b3k.status === 404, `${moTa(b3j)} · ${moTa(b3k)}`);
  const b3l = await guiAnh(null, idA, anhGia('jpeg', 1024));
  const b3m = await guiAnh('la', pnB.phieu?.id, anhGia('jpeg', 1024));
  k('B3k chưa đăng nhập → 401; vai trò ngoài owner / manager / staff → 403', b3l.status === 401 && b3m.status === 403, `${moTa(b3l)} · ${moTa(b3m)}`);
  const xA = await goi('nv2', 'GET', `/kho/phieu/${idA}`);
  k('B4a chi tiết phiếu có danh sách 3 ảnh (id, kiểu, cỡ) — KHÔNG kèm byte', (xA.anh || []).length === 3 && xA.anh.every((a) => a.id > 0 && a.kieu && a.co > 0 && !('du_lieu' in a)),
    js(xA.anh));
  const aDau = (xA.anh || [])[0] || {};
  const docA = await goi('nv2', 'GET', `/kho/phieu/${idA}/anh/${aDau.id}`);
  k('B4b người xem được phiếu (nhân viên khác) đọc ảnh → đúng byte gốc', docA.status === 200 && docA.kieu === 'image/jpeg'
    && Buffer.from(String(docA.du_lieu), 'base64').equals(anhGia('jpeg', 200 * 1024)), moTa(docA));
  const docSai = await goi('nv', 'GET', `/kho/phieu/${pnB.phieu?.id}/anh/${aDau.id}`);
  k('B4c id ảnh của phiếu KHÁC qua đường phiếu B → 404 (không đọc chéo)', docSai.status === 404 && !docSai.du_lieu, moTa(docSai));
  const docLa = await goi('la', 'GET', `/kho/phieu/${idA}/anh/${aDau.id}`);
  const xLa = await goi('la', 'GET', `/kho/phieu/${idA}`);
  const docKo = await goi(null, 'GET', `/kho/phieu/${idA}/anh/${aDau.id}`);
  k('B4d vai trò không xem được phiếu → 403 cả phiếu lẫn ảnh; chưa đăng nhập → 401', docLa.status === 403 && xLa.status === 403 && docKo.status === 401 && !docLa.du_lieu,
    `${moTa(docLa)} · ${moTa(xLa)} · ${moTa(docKo)}`);
  const ds = await goi('chu', 'GET', '/kho/phieu?loai=PN');
  k('B4e danh sách phiếu không kèm byte ảnh', ds.status === 200 && !js(ds).includes('du_lieu'));
  const suaA = await goi('chu', 'POST', `/kho/phieu/${idA}/sua`, { dong: [{ nguyen_lieu_id: nMat, luong: 2 }], ly_do: 'nhầm số' });
  const xMoi = await goi('nv', 'GET', `/kho/phieu/${suaA.phieu?.id}`);
  k('B4f chủ quán sửa phiếu nhận → phiếu mới GIỮ 3 ảnh hoá đơn (đường song song K4)', suaA.status === 200 && (xMoi.anh || []).length === 3, `${moTa(suaA)} · ${(xMoi.anh || []).length}`);
  const pnKo = await goi('nv', 'POST', '/kho/phieu-nhan', { dong: [{ nguyen_lieu_id: nMat, luong: 1 }], ma_gui: 'pnKo' });
  k('B3l K5 nhận hàng KHÔNG ảnh → 200 như thường, danh sách ảnh rỗng', pnKo.status === 200 && Array.isArray(pnKo.anh) && !pnKo.anh.length, moTa(pnKo));
  const bk = doc(path.join(MAY_CHU, 'routes', 'backup.js'));
  k('B5a bảng ảnh phiếu nằm trong BANG_KHONG_XUAT_EXCEL (có lý do), không trong BACKUP_TABLES', /BANG_KHONG_XUAT_EXCEL = \['pos_anh_mon', 'kho_anh_phieu'\]/.test(bk)
    && !/name: 'kho_anh_phieu'/.test(bk));
  const am = nap('utils/anhMon.js');
  k('B3m hằng số có tên: 400 KB, 3 ảnh / phiếu (server/utils/anhMon.js)', am.GIOI_HAN_ANH_PHIEU === 400 * 1024 && am.SO_ANH_PHIEU_TOI_DA === 3);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D1] thẻ nguyên liệu');
  datGio('2026-12-01T10:00:00');
  const choCam = await px('nv', [{ san_pham_id: sNC, so_phan: 1 }], 'theCho');   // phiếu chờ chạm Cam
  const theCam = await goi('nv', 'GET', `/kho/nguyen-lieu/${nCam}/the`);
  const nl = theCam.nguyen_lieu || {};
  k('D1a tồn + nhãn: Cam 2 < ngưỡng 5 → duoi_nguong', theCam.status === 200 && gan(nl.ton, 2) && nl.nhan === 'duoi_nguong' && nl.ten === 'Cam', `${moTa(theCam)} · ${js(nl)}`);
  k('D1b phiếu chờ duyệt chạm Cam có trong thẻ', (theCam.cho_duyet || []).some((p) => p.phieu_id === choCam.phieu?.id && gan(p.luong, 0.2)), js(theCam.cho_duyet));
  const dm = (theCam.dung_cho_mon || []);
  k('D1c "Dùng cho món": Nước cam đủ 10 phần, Cam mật ong đủ 6 (theo Cam: 2 ÷ 0.3)', dm.some((m) => m.san_pham_id === sNC && m.du_phan === 10) && dm.some((m) => m.san_pham_id === sCM && m.du_phan === 6),
    js(dm));
  k('D1d lô đang có (còn, hạn, nhận lúc) + lịch sử nhập / xuất (số phiếu, người)', (theCam.lo || []).length >= 1 && (theCam.lo || []).every((l) => l.con > 0 && 'han_dung' in l && l.tao_luc)
    && (theCam.lich_su || []).some((d) => d.so_phieu && d.nguoi && d.loai === 'PN'), `${js(theCam.lo).slice(0, 120)} · ${(theCam.lich_su || []).length}`);
  k('D1e nhân viên không nhận khoá giá ở thẻ; quản lý nhận', !coKhoa(theCam, ['gia_nhap', 'don_gia', 'gia_von']) && coKhoa(await goi('ql', 'GET', `/kho/nguyen-lieu/${nCam}/the`), ['gia_nhap']));
  const theAt = await goi('nv', 'GET', `/kho/nguyen-lieu/${nAtiso}/the`);
  const theKo = await goi('nv', 'GET', '/kho/nguyen-lieu/999999/the');
  await ghiDb("INSERT INTO kho_phieu_dong (phieu_id, nguyen_lieu_id, so_luong, loai) VALUES (?, ?, -100, 'xuat')", [lg.phieu?.id, nAtiso]);   // Atiso về 0
  const theHet = await goi('nv', 'GET', `/kho/nguyen-lieu/${nAtiso}/the`);
  k('D1f nhãn: Atiso 100 không ngưỡng → du; về 0 → het; id lạ → 404', theAt.nguyen_lieu?.nhan === 'du' && theHet.nguyen_lieu?.nhan === 'het' && theKo.status === 404,
    `${theAt.nguyen_lieu?.nhan} · ${theHet.nguyen_lieu?.nhan} · ${moTa(theKo)}`);
  const theLa = await goi('la', 'GET', `/kho/nguyen-lieu/${nCam}/the`);
  k('D1g vai trò lạ → 403', theLa.status === 403, moTa(theLa));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[Màn] phép dò mã nguồn client/src/pages/Kho');
  const kd = path.join(CLIENT, 'pages', 'Kho');
  const pcx = doc(path.join(kd, 'PhaChe.jsx'));
  k('A1b lọc nhóm: chỉ nhóm có món, 1 nhóm thì không hiện hàng nút', /nhomCo\.length > 1 &&/.test(pcx) && /nhom_id/.test(pcx));
  k('A1c tick sẵn món dưới định mức, số = can_lam (theo nồi: làm tròn LÊN)', /Math\.ceil\(m\.can_lam \/ m\.me_ra\)/.test(pcx) && /m\.can_lam > 0 && m\.co_cong_thuc/.test(pcx));
  k('A2k mỗi dòng "Có … · tối đa …", nút − / + quanh ô số', /tối đa/.test(pcx) && /Có \{/.test(pcx) && /aria-label="Bớt"/.test(pcx) && /aria-label="Thêm"/.test(pcx));
  k('A3g dòng đỏ "Vượt — kho chỉ đủ" + chân "Thiếu: … (cần x, có y)" + nút "Xem phiếu & in" khoá khi thiếu / vượt',
    /Vượt — kho chỉ đủ/.test(pcx) && /Thiếu: /.test(pcx) && /cần \$?\{/.test(pcx) && /Xem phiếu &amp; in|Xem phiếu & in/.test(pcx) && /disabled=\{[^}]*thieu\.length/.test(pcx));
  k('A4l món nồi: nhập theo NỒI, gửi so_phan = nồi × me_ra; dòng "1 nồi = … → ra n …"', /m\.me_ra \? n \* m\.me_ra : n/.test(pcx) && /1 nồi = /.test(pcx) && /→ ra \{m\.me_ra\}/.test(pcx));
  k('D4 dòng nhắc món pha tại chỗ không cần pha trước', /pha tại chỗ/.test(pcx) && /chỉ cần Nhận hàng/.test(pcx));
  const xp = doc(path.join(kd, 'XemPhieu.jsx'));
  k('A5b phiếu in: dòng nồi (so_noi, 1 nồi = …) + chỗ ký Người pha / Quản lý', /so_noi/.test(xp) && /1 nồi = /.test(xp) && /Người pha/.test(xp) && /Quản lý/.test(xp));
  k('B4g XemPhieu hiện ảnh hoá đơn qua api.get (data:…), có nút "＋ Ảnh hoá đơn"', /\/anh\/\$\{/.test(xp) && /data:\$\{/.test(xp) && /＋ Ảnh hoá đơn/.test(xp));
  const nh = doc(path.join(kd, 'NhanHang.jsx'));
  k('B1a Nhận hàng: một dòng một thứ, ô tìm (boDau), nhãn "thấp" theo duoi_toi_thieu, giữ "hay mua" / theo đơn', /boDau\(/.test(nh) && /duoi_toi_thieu/.test(nh) && /thấp/.test(nh)
    && /hay_mua|hayMua/.test(nh) && /don_mo/.test(nh));
  k('B2a nút "Chụp hoá đơn" accept image/* capture environment; hiện "≈ … (gốc …)"', /Chụp hoá đơn/.test(nh) && /accept="image\/\*"/.test(nh) && /capture="environment"/.test(nh) && /gốc /.test(nh));
  k('E1c lời nút không còn "chờ người khác duyệt"', !/chờ người khác duyệt/.test(nh) && nh.length > 0);
  const anh = doc(path.join(kd, 'anh.js'));
  k('B2b thu nhỏ MỘT chỗ (anh.js): hoá đơn cạnh dài 1280, JPEG 0,6; ảnh món 400 vuông 0,7', /CANH_HOA_DON = 1280\b/.test(anh) && /CHAT_LUONG_HOA_DON = 0\.6\b/.test(anh)
    && /CO_ANH = 400\b/.test(anh) && /CHAT_LUONG_ANH = 0\.7\b/.test(anh) && /image\/jpeg/.test(anh) && /export async function thuNhoAnh/.test(anh));
  k('B2c SanPham.jsx + NhanHang.jsx dùng chung thuNhoAnh (không chép hàm)', /import \{[^}]*thuNhoAnh[^}]*\} from '\.\/anh'/.test(doc(path.join(kd, 'SanPham.jsx'))) && /from '\.\/anh'/.test(nh)
    && !/function thuNhoAnh/.test(doc(path.join(kd, 'SanPham.jsx'))));
  const tnl = doc(path.join(kd, 'TheNguyenLieu.jsx'));
  const postTnl = [...tnl.matchAll(/api\.(post|put|delete)\(\s*[`'"]([^`'"]+)/g)].map((m) => m[2]);
  k('D2a thẻ: ba nút "＋ Nhận hàng" · "− Xuất / hao hụt" · "Chỉnh tồn", đi đúng đường có sẵn (không đường ghi mới)',
    /＋ Nhận hàng/.test(tnl) && /− Xuất \/ hao hụt/.test(tnl) && /Chỉnh tồn/.test(tnl) && postTnl.length >= 2
    && postTnl.every((d) => ['/kho/phieu-nhan', '/kho/phieu-phat-sinh'].includes(d)) && /ChinhTonTay/.test(tnl), js(postTnl));
  const ct = doc(path.join(kd, 'ChinhTonTay.jsx'));
  k('D2b Chỉnh tồn: MỘT khối dùng chung cho Tồn kho và thẻ (/kho/chinh-tay), chỉ hiện khi duoc_chinh_tay', /\/kho\/chinh-tay/.test(ct) && /ChinhTonTay/.test(doc(path.join(kd, 'TonKho.jsx')))
    && !/\/kho\/chinh-tay/.test(doc(path.join(kd, 'TonKho.jsx'))) && /duoc_chinh_tay/.test(tnl));
  k('D1h thẻ hiện: tồn chữ to, phiếu chờ, Dùng cho món, lô, lịch sử', /Dùng cho món/.test(tnl) && /cho_duyet/.test(tnl) && /lich_su/.test(tnl) && /\.lo\b|lo\.map|\.lo\.map/.test(tnl));
  const idx = doc(path.join(kd, 'index.jsx'));
  k('D3a điều hướng: ngăn xếp màn, nút "←" màn trước + dòng đường dẫn "›"; danh sách ẩn bằng display (không tháo) để giữ lọc / cuộn',
    /ngan/.test(idx) && /←/.test(idx) && /' › '/.test(idx) && /display: [^}]*'none'/.test(idx) && /TheNguyenLieu/.test(idx));
  k('D3b mở thẻ từ Tồn kho, Nguyên liệu và dải dưới ngưỡng ở Việc hôm nay', /moThe/.test(doc(path.join(kd, 'TonKho.jsx'))) && /moThe/.test(doc(path.join(kd, 'NguyenLieu.jsx')))
    && /moThe/.test(doc(path.join(kd, 'ViecHomNay.jsx'))));
  k('D3c lưu xong ở thẻ → về đúng thẻ, tải lại số (xong → tai lại)', /xongViec|veThe|taiLai\(\)/.test(tnl));
  const chung = doc(path.join(kd, 'chung.js'));
  const sp = doc(path.join(kd, 'SanPham.jsx'));
  k('D5 MỘT hàm làm tròn gọn (soGon) ở chung.js; ô sửa công thức + ô sửa phiếu dùng nó, SanPham bỏ bản so() chép', /export const soGon = /.test(chung)
    && /soGon\(d\.luong_hien\)/.test(sp) && /soGon\(d\.luong_hien\)/.test(xp) && !/^const so = /m.test(sp));
  const cd = doc(path.join(kd, 'CaiDatKho.jsx'));
  const dmx = doc(path.join(kd, 'DinhMuc.jsx'));
  k('E2d công tắc ở Cài đặt kho, nhãn "Nhân viên xuất kho không cần duyệt" (chỉ chủ quán); Định mức cùng nhãn, không còn nhãn ngược "cần duyệt"',
    /Nhân viên xuất kho không cần duyệt/.test(cd) && /kho_px_nv_can_duyet/.test(cd) && /checked=\{!cd\.nv_can_duyet\}/.test(cd)
    && !/Nhân viên xuất kho cần duyệt/.test(dmx) && /checked=\{!dl\.nv_can_duyet\}/.test(dmx));
  const css = doc(path.join(kd, 'kho.css'));
  k('C1 màn hẹp: nút − / + ≥ 40 px, thanh nút chính dính đáy, không tràn ngang', /\.kho-nut-so[^}]*min-width: 2\.5rem/.test(css) && /\.kho-chan[^}]*position: sticky[^}]*bottom: 0/.test(css)
    && /@media \(max-width: 420px\)/.test(css) && /overflow-x: hidden/.test(css));
  const kt = doc(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'));
  k('K1 bộ kiểm chạy bài này', /chayBaiThat\('cong_cu\/thu_KHOGON2\.js'\)/.test(kt));

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
