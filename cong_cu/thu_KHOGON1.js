#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════════
 *  THỬ KHO-GON-1 — Việc hôm nay · kiểm kê tối (đếm mù) · nhận bàn giao sáng · chỉnh tồn tay · diễn biến
 * ════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_KHOGON1.js [--may-chu <thư mục server>]
 *  Khuôn thu_KHO2b.js: database.js thật + libsql trên kho TẠM, route thật qua app.listen(0), JWT theo vai trò,
 *  TZ=UTC, đồng hồ thay trong tiến trình (`datGio('YYYY-MM-DDTHH:mm:ss')` = giờ Việt Nam).
 *  Bán xen giữa (C5) = banHang.truKhoDon thật trong giao dịch thật (đường bán của quầy).
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
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khogon1_'));
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
process.env.JWT_SECRET = 'thu_khogon1_' + DateGoc.now();

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
/** Có khoá số máy (tồn) ở MỌI tầng — màn kiểm kê đếm mù không được nhận. */
const coKhoa = (x, ds) => (Array.isArray(x) ? x.some((v) => coKhoa(v, ds))
  : x && typeof x === 'object' ? Object.entries(x).some(([kh, v]) => ds.includes(kh) || coKhoa(v, ds)) : false);

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
  const { trongGiaoDich } = require(path.join(MAY_CHU, 'routes', 'wallets.js'));
  const banHang = nap('kho/banHang.js');
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

  console.log('\nTHỬ KHO-GON-1 — việc hôm nay · kiểm kê · bàn giao · chỉnh tay · diễn biến');

  // ── Dữ liệu nền (ngày N0 = 30.11) ──
  datGio('2026-11-30T08:00:00');
  const themNL = async (ten, toiThieu, han, dangDung = 1) => Number((await ghiDb(`INSERT INTO kho_nguyen_lieu (ten, ten_chuan, don_vi_luu, he_so_doi,
    gia_nhap, ton_toi_thieu, han_ngay, dang_dung, tao_luc) VALUES (?, ?, 'kg', 1, 10000, ?, ?, ?, '2026-11-01T00:00:00')`, [ten, ten.toLowerCase(), toiThieu, han, dangDung]))?.lastInsertRowid);
  const nCam = await themNL('Cam', null, 3);
  const nDuong = await themNL('Đường', 5, null);
  const nGung = await themNL('Gừng', null, null);
  const nQue = await themNL('Quế', 5, null, 0);
  const sNC = Number((await ghiDb("INSERT INTO pos_products (code, name, category, price, is_active) VALUES ('KG1', 'Nước cam', 'juice', 30000, 1)"))?.lastInsertRowid);
  await goi('chu', 'PUT', `/kho/san-pham/${sNC}`, { kieu: 'lam_san', han_ngay: 30, cong_thuc: [{ nguyen_lieu_id: nCam, luong: 0.2 }] });
  // B6: món pha tại chỗ — Cà phê đen (Cà phê tồn 0 → quầy không bán được) · Cam ép (Cam còn → bán được)
  const nCaPhe = await themNL('Cà phê', null, null);
  const themMon = async (code, ten) => Number((await ghiDb("INSERT INTO pos_products (code, name, category, price, is_active) VALUES (?, ?, 'drink', 20000, 1)", [code, ten]))?.lastInsertRowid);
  const sCPD = await themMon('KG2', 'Cà phê đen');
  const sCamEp = await themMon('KG3', 'Cam ép');
  await goi('chu', 'PUT', `/kho/san-pham/${sCPD}`, { kieu: 'pha_tai_cho', cong_thuc: [{ nguyen_lieu_id: nCaPhe, luong: 0.02 }] });
  await goi('chu', 'PUT', `/kho/san-pham/${sCamEp}`, { kieu: 'pha_tai_cho', cong_thuc: [{ nguyen_lieu_id: nCam, luong: 0.1 }] });
  const pn0 = await goi('nv', 'POST', '/kho/phieu-nhan', { dong: [{ nguyen_lieu_id: nCam, luong: 10 }, { nguyen_lieu_id: nDuong, luong: 2 }, { nguyen_lieu_id: nGung, luong: 3 }], ma_gui: 'pn0' });
  await goi('ql', 'POST', `/kho/phieu/${pn0.phieu?.id}/duyet`);
  await goi('ql', 'POST', '/kho/phieu-xuat', { mon: [{ san_pham_id: sNC, so_phan: 10 }], ma_gui: 'px0' });
  const tonNL = async (id) => Number(await so(`SELECT COALESCE(SUM(d.so_luong), 0) FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id
    WHERE d.nguyen_lieu_id = ? AND p.trang_thai = 'da_duyet' AND p.loai <> 'DH'`, [id]));
  const tonSP = async (id) => Number(await so(`SELECT COALESCE(SUM(d.so_luong), 0) FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id
    WHERE d.san_pham_id = ? AND d.lo_id IS NOT NULL AND p.trang_thai = 'da_duyet' AND p.loai <> 'DH'`, [id]));
  const demKK = () => so("SELECT COUNT(*) FROM kho_phieu WHERE loai = 'KK'");
  const demDB = (loai) => so('SELECT COUNT(*) FROM kho_dien_bien WHERE loai = ?', [loai]);
  let soDon = 9000;
  const ban = (spId, sl) => trongGiaoDich(async (tx) => {
    const r = await banHang.truKhoDon(tx, { orderId: ++soDon, items: [{ product_id: spId, quantity: sl }], nguoi: 'quay', luc: require(path.join(MAY_CHU, 'utils', 'helpers')).getNow() });
    return r.loi ? { ...r, huy: true } : r;
  });
  k('Nền: Cam 8 · Đường 2 · Gừng 3 · Nước cam 10 phần', gan(await tonNL(nCam), 8) && gan(await tonNL(nDuong), 2) && gan(await tonSP(sNC), 10),
    `${await tonNL(nCam)} · ${await tonNL(nDuong)} · ${await tonSP(sNC)}`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] việc cố định · cài đặt');
  const mau0 = await goi('ql', 'GET', '/kho/viec-mau');
  const m3 = mau0.mau || [];
  k('A1 mẫu mặc định: 1 Nhận bàn giao (bangiao, 08:00) · 2 Pha sẵn (phache) · 3 Kiểm kê & chốt (kiemke, cuối)', m3.length === 3
    && m3.map((m) => m.loai).join() === 'bangiao,phache,kiemke' && m3[0].gio_han === '08:00' && /bàn giao/i.test(m3[0].ten), moTa(mau0) + ' ' + JSON.stringify(m3.map((m) => m.loai)));
  k('A1b nhân viên không đọc / sửa mẫu việc → 403', (await goi('nv', 'GET', '/kho/viec-mau')).status === 403 && (await goi('nv', 'POST', '/kho/viec-mau', { ten: 'x', giao: 'nv' })).status === 403);
  const gioSai = await goi('ql', 'POST', '/kho/viec-mau', { ten: 'Sai giờ', giao: 'nv', gio_han: '25:00' });
  k('A1c giờ hạn "25:00" → 400 GIO_SAI', gioSai.status === 400 && gioSai.code === 'GIO_SAI', moTa(gioSai));
  k('A1d giao cho lạ → 400 GIAO_SAI', (await goi('ql', 'POST', '/kho/viec-mau', { ten: 'X', giao: 'ai_do' })).code === 'GIAO_SAI');
  const themMau = async (ten, giao, gio = null) => (await goi('ql', 'POST', '/kho/viec-mau', { ten, giao, gio_han: gio })).id;
  const mDa = await themMau('Gọi đá', 'nv', '20:00');
  const mSang = await themMau('Mở cửa', 'sang');
  const mToi = await themMau('Đóng cửa', 'toi');
  const mQl = await themMau('Họp quản lý', 'ql');
  const mTat = await themMau('Lau bàn', 'tat_ca');
  const mXoa = await themMau('Tạm xoá', 'nv');
  k('A1e thêm mẫu thường 200 (id số)', [mDa, mSang, mToi, mQl, mTat, mXoa].every((x) => Number(x) > 0));
  const xoaDB = await goi('ql', 'DELETE', `/kho/viec-mau/${m3[0]?.id}`);
  k('A1f xoá việc đặc biệt (bangiao) → 409 VIEC_KHONG_XOA', xoaDB.status === 409 && xoaDB.code === 'VIEC_KHONG_XOA', moTa(xoaDB));
  k('A1g xoá việc thường → 200, mất khỏi danh sách', (await goi('ql', 'DELETE', `/kho/viec-mau/${mXoa}`)).status === 200
    && !((await goi('ql', 'GET', '/kho/viec-mau')).mau || []).some((m) => m.id === mXoa));
  const suaDB = await goi('ql', 'PUT', `/kho/viec-mau/${m3[0]?.id}`, { ten: 'Nhận bàn giao đầu ngày', giao: 'nv', gio_han: '08:30' });
  const sau = (await goi('ql', 'GET', '/kho/viec-mau')).mau || [];
  k('A1h sửa việc đặc biệt (tên / giờ) 200, loại giữ bangiao', suaDB.status === 200 && sau.find((m) => m.id === m3[0]?.id)?.gio_han === '08:30'
    && sau.find((m) => m.id === m3[0]?.id)?.loai === 'bangiao', moTa(suaDB));
  const viTri = (ds, id) => ds.findIndex((m) => m.id === id);
  const truocLen = viTri(sau, mDa);
  await goi('ql', 'POST', `/kho/viec-mau/${mDa}/len`);
  const sauLen = (await goi('ql', 'GET', '/kho/viec-mau')).mau || [];
  await goi('ql', 'POST', `/kho/viec-mau/${mDa}/xuong`);
  const sauXuong = (await goi('ql', 'GET', '/kho/viec-mau')).mau || [];
  k('A1i Lên rồi Xuống: vị trí −1 rồi trở lại', truocLen > 0 && viTri(sauLen, mDa) === truocLen - 1 && viTri(sauXuong, mDa) === truocLen, `${truocLen} → ${viTri(sauLen, mDa)} → ${viTri(sauXuong, mDa)}`);
  const caiQl = await goi('ql', 'PUT', '/kho/cai-dat-viec', { so_ca: 2 });
  k('A2a quản lý đổi số ca → 403 (chỉ chủ quán — Q2)', caiQl.status === 403, moTa(caiQl));
  const caiSai = await goi('chu', 'PUT', '/kho/cai-dat-viec', { so_ca: 3 });
  k('A2b số ca 3 → 400 CAI_DAT_KHONG_HOP_LE', caiSai.status === 400 && caiSai.code === 'CAI_DAT_KHONG_HOP_LE', moTa(caiSai));
  const cd0 = await goi('ql', 'GET', '/kho/cai-dat-viec');
  k('A2c mặc định 1 ca, quản lý KHÔNG chỉnh tay', cd0.so_ca === 1 && cd0.ql_chinh_tay === false, JSON.stringify(cd0));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[K5] dữ liệu như production: chưa tick kiểm, chưa có chốt, ngưỡng NULL');
  const kkTrong = await goi('nv', 'GET', '/kho/kiem-ke?che_do=bangiao');
  k('K5-3 mở bàn giao khi chưa có chốt + chưa tick → 200, cờ chua_co_chot', kkTrong.status === 200 && kkTrong.chua_co_chot === true, moTa(kkTrong));
  const ng = await goi('ql', 'PUT', '/kho/nguong', { nguyen_lieu: [{ id: nCam, ton_toi_thieu: null, kiem_hang_ngay: 1 }] });
  k('C1a PUT /nguong tick "Kiểm hằng ngày" Cam 200; nhân viên 403', ng.status === 200 && (await so('SELECT kiem_hang_ngay FROM kho_nguyen_lieu WHERE id = ?', [nCam])) === 1
    && (await goi('nv', 'PUT', '/kho/nguong', { nguyen_lieu: [{ id: nGung, kiem_hang_ngay: 1 }] })).status === 403, moTa(ng));
  await goi('ql', 'PUT', `/kho/nguyen-lieu/${nCam}`, { ten: 'Cam', don_vi_luu: 'kg', he_so_doi: 1, gia_nhap: 10000, han_ngay: 3 });
  k('C1b màn Nguyên liệu (PUT /nguyen-lieu không gửi cờ) KHÔNG xoá cờ kiểm hằng ngày', (await so('SELECT kiem_hang_ngay FROM kho_nguyen_lieu WHERE id = ?', [nCam])) === 1);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A3 · B] ngày N1 = 01.12 — sinh việc, ai thấy gì, quá giờ');
  datGio('2026-12-01T06:00:00');
  const [h1, h2] = await Promise.all([goi('nv', 'POST', '/kho/viec/hom-nay', {}), goi('ql', 'POST', '/kho/viec/hom-nay', {})]);
  const soMau = (await goi('ql', 'GET', '/kho/viec-mau')).mau?.length;
  k('A3a hai máy mở cùng lúc → đúng MỘT bộ việc cho 01.12', h1.status === 200 && h2.status === 200 && (await so("SELECT COUNT(*) FROM kho_viec WHERE ngay = '2026-12-01'")) === soMau,
    `${moTa(h1)} · ${await so("SELECT COUNT(*) FROM kho_viec WHERE ngay = '2026-12-01'")} / ${soMau}`);
  k('A3b mở lại lần 3 không thêm', (await goi('nv', 'POST', '/kho/viec/hom-nay', {})).status === 200 && (await so("SELECT COUNT(*) FROM kho_viec WHERE ngay = '2026-12-01'")) === soMau);
  await goi('ql', 'PUT', `/kho/viec-mau/${mDa}`, { ten: 'Gọi đá viên', giao: 'nv', gio_han: '20:00' });
  const mGiua = await themMau('Mẫu thêm giữa ngày', 'nv');
  const hn = await goi('nv', 'POST', '/kho/viec/hom-nay', {});
  const tenHN = (hn.viec || []).map((v) => v.ten);
  k('A3c sửa mẫu / thêm mẫu giữa ngày → hôm nay giữ nguyên ("Gọi đá", không có mẫu mới)', tenHN.includes('Gọi đá') && !tenHN.includes('Gọi đá viên') && !tenHN.includes('Mẫu thêm giữa ngày'), tenHN.join(', '));
  k('A2d 1 ca: nhân viên thấy mọi việc trừ việc quản lý', !tenHN.includes('Họp quản lý') && ['Mở cửa', 'Đóng cửa', 'Lau bàn'].every((t) => tenHN.includes(t)) && hn.so_ca === 1, tenHN.join(', '));
  const hnChu = await goi('chu', 'POST', '/kho/viec/hom-nay', {});
  k('A2e chủ / quản lý thấy cả việc quản lý', (hnChu.viec || []).some((v) => v.ten === 'Họp quản lý'));
  await goi('chu', 'PUT', '/kho/cai-dat-viec', { so_ca: 2, ql_chinh_tay: 0 });
  const toi = await goi('nv', 'POST', '/kho/viec/hom-nay', { ca: 'toi' });
  const tenToi = (toi.viec || []).map((v) => v.ten);
  k('A2f 2 ca, ca tối: KHÔNG thấy việc ca sáng; thấy nv · tat_ca · toi', toi.so_ca === 2 && !tenToi.includes('Mở cửa') && ['Đóng cửa', 'Lau bàn', 'Gọi đá'].every((t) => tenToi.includes(t))
    && !tenToi.includes('Họp quản lý'), tenToi.join(', '));
  const sang = await goi('nv', 'POST', '/kho/viec/hom-nay', { ca: 'sang' });
  k('A2g 2 ca, ca sáng: thấy việc sáng, không thấy việc tối', (sang.viec || []).some((v) => v.ten === 'Mở cửa') && !(sang.viec || []).some((v) => v.ten === 'Đóng cửa'));
  const vSang = (hnChu.viec || []).find((v) => v.ten === 'Mở cửa');
  const xongNgoai = await goi('nv', 'POST', `/kho/viec/${vSang?.id}/xong`, { ca: 'toi' });
  k('A2h nhân viên ca tối bấm Xong việc ca sáng → 403 VIEC_KHONG_CUA_BAN', xongNgoai.status === 403 && xongNgoai.code === 'VIEC_KHONG_CUA_BAN', moTa(xongNgoai));
  await goi('chu', 'PUT', '/kho/cai-dat-viec', { so_ca: 1, ql_chinh_tay: 0 });
  muc('[C3] bàn giao sáng N1 — chưa có chốt');
  const vBG = (hnChu.viec || []).find((v) => v.loai === 'bangiao');
  datGio('2026-12-01T07:00:00');
  const bg0 = await goi('nv', 'GET', '/kho/kiem-ke?che_do=bangiao');
  const bgNC = (bg0.dong || []).find((d) => d.san_pham_id === sNC);
  k('C3a chưa có chốt → "Chốt" = số máy, cờ chua_co_chot', bg0.chua_co_chot === true && bgNC && gan(bgNC.chot, await tonSP(sNC)), JSON.stringify(bgNC));
  const nhan0 = await goi('nv', 'POST', '/kho/kiem-ke', { che_do: 'bangiao', moc: bg0.moc, moc_luc: bg0.moc_luc, dong: [], ma_gui: 'bg0' });
  k('C3b nhận ca đúng hết (ô trống) → 200, KHÔNG phiếu KK, việc bangiao xong, dòng nhan_ca không cam', nhan0.status === 200 && (await demKK()) === 0
    && (await mot('SELECT xong_luc FROM kho_viec WHERE id = ?', [vBG?.id || 0]))?.xong_luc != null
    && (await so("SELECT chu_y FROM kho_dien_bien WHERE loai = 'nhan_ca' ORDER BY id DESC LIMIT 1")) === 0, moTa(nhan0));
  datGio('2026-12-01T09:00:00');
  const xongDB = await goi('nv', 'POST', `/kho/viec/${vBG?.id}/xong`, {});
  k('B1b việc đặc biệt bấm Xong trực tiếp → 409 VIEC_TU_XONG', xongDB.status === 409 && xongDB.code === 'VIEC_TU_XONG', moTa(xongDB));
  const vTat = (hnChu.viec || []).find((v) => v.ten === 'Lau bàn');
  const [x1, x2] = await Promise.all([goi('nv', 'POST', `/kho/viec/${vTat?.id}/xong`, {}), goi('nv2', 'POST', `/kho/viec/${vTat?.id}/xong`, {})]);
  const vTatDb = await mot('SELECT * FROM kho_viec WHERE id = ?', [vTat?.id || 0]);
  k('B4a hai người cùng bấm Xong → MỘT 200, một 409 VIEC_DA_XONG; ghi người + giờ', [x1, x2].filter((r) => r.status === 200).length === 1
    && [x1, x2].some((r) => r.code === 'VIEC_DA_XONG') && ['nv_a', 'nv_b'].includes(vTatDb?.nguoi_xong) && vTatDb?.xong_luc === '2026-12-01T09:00:00', `${moTa(x1)} / ${moTa(x2)}`);
  datGio('2026-12-01T10:00:00');
  const ps1 = await goi('nv', 'POST', '/kho/viec', { ten: 'Hết đá — gọi đá' });
  k('B2a nhân viên thêm việc phát sinh → 200, giao mặc định nv, ghi người tạo + diễn biến them_viec', ps1.status === 200 && ps1.viec?.giao === 'nv' && ps1.viec?.nguoi_tao === 'nv_a'
    && (await demDB('them_viec')) === 1, moTa(ps1));
  k('B2b giao cho lạ → 400 GIAO_SAI; tên trống → 400 THIEU_TEN', (await goi('nv', 'POST', '/kho/viec', { ten: 'a', giao: 'ai' })).code === 'GIAO_SAI'
    && (await goi('nv', 'POST', '/kho/viec', { ten: '  ' })).code === 'THIEU_TEN');
  const hn10 = await goi('ql', 'POST', '/kho/viec/hom-nay', {});
  const dn = hn10.duoi_nguong || [];
  k('B3a dải cam: Đường (2 < 5) có; Gừng (ngưỡng NULL), Quế (ngừng dùng) không', dn.some((n) => n.id === nDuong) && !dn.some((n) => n.id === nGung) && !dn.some((n) => n.id === nQue), JSON.stringify(dn.map((n) => n.ten)));
  const [g1, g2] = [await goi('ql', 'POST', '/kho/viec', { nguyen_lieu_id: nDuong }), await goi('nv', 'POST', '/kho/viec', { nguyen_lieu_id: nDuong })];
  k('B3b giao việc gọi thêm Đường 2 lần → MỘT việc giao ql, cùng id; dải cam báo đã giao', g1.status === 200 && g1.viec?.id === g2.viec?.id && g1.viec?.giao === 'ql'
    && (await so("SELECT COUNT(*) FROM kho_viec WHERE ngay = '2026-12-01' AND nguyen_lieu_id = ?", [nDuong])) === 1
    && ((await goi('ql', 'POST', '/kho/viec/hom-nay', {})).duoi_nguong || []).find((n) => n.id === nDuong)?.da_giao === true, `${moTa(g1)} / ${moTa(g2)}`);
  const dnNv = ((await goi('nv', 'POST', '/kho/viec/hom-nay', {})).duoi_nguong || []).find((n) => n.id === nDuong);
  k('B3d nhân viên (không thấy việc giao ql) vẫn thấy Đường "đã giao" — không hiện lại nút', dnNv?.da_giao === true, JSON.stringify(dnNv));
  const pnD = await goi('nv', 'POST', '/kho/phieu-nhan', { dong: [{ nguyen_lieu_id: nDuong, luong: 5 }], ma_gui: 'pnD' });
  k('B3c lưu phiếu Nhận hàng có Đường → việc gọi Đường tự xong + diễn biến nhan_hang', pnD.status === 200
    && (await mot('SELECT xong_luc FROM kho_viec WHERE id = ?', [g1.viec?.id || 0]))?.xong_luc != null && (await demDB('nhan_hang')) >= 1, moTa(pnD));
  await goi('ql', 'POST', `/kho/phieu/${pnD.phieu?.id}/duyet`);
  const pcTruoc = await demDB('pha_che');
  const px1 = await goi('nv', 'POST', '/kho/phieu-xuat', { mon: [{ san_pham_id: sNC, so_phan: 2 }], ma_gui: 'px1' });
  const px1b = await goi('nv', 'POST', '/kho/phieu-xuat', { mon: [{ san_pham_id: sNC, so_phan: 2 }], ma_gui: 'px1' });
  const vPC = (hnChu.viec || []).find((v) => v.loai === 'phache');
  k('E1a lưu phiếu xuất pha chế → việc phache tự xong; bấm hai lần (ma_gui) → MỘT diễn biến pha_che', px1.status === 200 && px1b.phieu?.id === px1.phieu?.id
    && (await mot('SELECT xong_luc FROM kho_viec WHERE id = ?', [vPC?.id || 0]))?.xong_luc != null && (await demDB('pha_che')) === pcTruoc + 1, `${moTa(px1)} · ${pcTruoc} → ${await demDB('pha_che')}`);
  await goi('ql', 'POST', `/kho/phieu/${px1.phieu?.id}/duyet`);
  const psR = await goi('nv', 'POST', '/kho/phieu-phat-sinh', { su_co: 'hong', muc: [{ nguyen_lieu_id: nGung, luong: 0.5 }], ma_gui: 'ps1' });
  k('E1b phiếu phát sinh → diễn biến phat_sinh tô cam', psR.status === 200 && (await so("SELECT chu_y FROM kho_dien_bien WHERE loai = 'phat_sinh'")) === 1, moTa(psR));
  if (psR.phieu?.trang_thai === 'cho_duyet') await goi('ql', 'POST', `/kho/phieu/${psR.phieu?.id}/duyet`);

  // ═════════════════════════════════════════════════════════════════════════
  const vDa = (hnChu.viec || []).find((v) => v.ten === 'Gọi đá');
  const quaGio = async (gio) => { datGio('2026-12-01T' + gio); return ((await goi('nv', 'POST', '/kho/viec/hom-nay', {})).viec || []).find((v) => v.id === vDa?.id)?.qua_gio; };
  const g1959 = await quaGio('19:59:00'), g2000 = await quaGio('20:00:59'), g2001 = await quaGio('20:01:00');
  k('B1a hạn "20:00": 19:59 và 20:00:59 chưa quá giờ, 20:01 quá giờ', g1959 === false && g2000 === false && g2001 === true, `${g1959} · ${g2000} · ${g2001}`);
  datGio('2026-12-01T20:02:00');
  k('B4d nhân viên bấm Xong "Gọi đá" → 200', (await goi('nv', 'POST', `/kho/viec/${vDa?.id}/xong`, {})).status === 200);
  k('B1c việc đã xong không "quá giờ"', (await quaGio('20:03:00')) === false);
  datGio('2026-12-01T20:05:00');
  k('B4b nhân viên / quản lý mở lại → 403', (await goi('nv', 'POST', `/kho/viec/${vDa?.id}/mo-lai`)).status === 403 && (await goi('ql', 'POST', `/kho/viec/${vDa?.id}/mo-lai`)).status === 403);
  const moLai = await goi('chu', 'POST', `/kho/viec/${vDa?.id}/mo-lai`);
  k('B4c chủ quán mở lại → 200, việc chưa xong, có diễn biến mo_lai', moLai.status === 200 && (await mot('SELECT xong_luc FROM kho_viec WHERE id = ?', [vDa?.id || 0]))?.xong_luc == null
    && (await demDB('mo_lai')) === 1, moTa(moLai));

  muc('[C] kiểm kê tối N1 (đếm mù)');
  datGio('2026-12-01T21:30:00');
  const kk = await goi('nv', 'GET', '/kho/kiem-ke?che_do=kiemke');
  const khoaDong = (kk.dong || []).map((d) => (d.nguyen_lieu_id ? 'nl' + d.nguyen_lieu_id : 'sp' + d.san_pham_id));
  k('C1c danh sách kiểm = Nước cam (làm sẵn có lô) + Cam (tick); không có Gừng / Đường', khoaDong.includes('nl' + nCam) && khoaDong.includes('sp' + sNC)
    && !khoaDong.includes('nl' + nGung) && !khoaDong.includes('nl' + nDuong), khoaDong.join());
  k('Q1a kiểm kê đếm mù: nhân viên KHÔNG nhận số máy (may / ton / goc / chot)', kk.status === 200 && !coKhoa(kk, ['may', 'ton', 'ton_hien', 'goc', 'chot', 'may_ghi']), JSON.stringify(kk.dong?.[0]));
  const camTruoc = await tonNL(nCam), ncTruoc = await tonSP(sNC);
  const guiKK = (ai, dong, ma, ghiChung = 'Tủ lạnh 2 hơi kêu', r = kk) => goi(ai, 'POST', '/kho/kiem-ke', { che_do: 'kiemke', moc: r.moc, moc_luc: r.moc_luc, dong, ghi_chu_chung: ghiChung, ma_gui: ma });
  const thieuDong = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: camTruoc }], 'kk-thieu');
  k('Q1b kiểm kê thiếu số một dòng (bỏ Nước cam) → 400 KHO_THIEU_SO, không ghi gì', thieuDong.status === 400 && thieuDong.code === 'KHO_THIEU_SO'
    && (await so('SELECT COUNT(*) FROM kho_chot')) === 1, moTa(thieuDong));
  const oTrong = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: camTruoc }, { san_pham_id: sNC, thuc: '' }], 'kk-trong');
  k('Q1c ô số để trống ở kiểm kê → 400 KHO_THIEU_SO', oTrong.status === 400 && oTrong.code === 'KHO_THIEU_SO', moTa(oTrong));
  const la = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: camTruoc }, { san_pham_id: sNC, thuc: ncTruoc }, { nguyen_lieu_id: nGung, thuc: 1, ghi_chu: 'x' }], 'kk-la');
  k('C6b nhân viên gửi dòng không thuộc danh sách kiểm (Gừng) → 400 KHO_DONG_LA', la.status === 400 && la.code === 'KHO_DONG_LA', moTa(la));
  const mocSai = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: camTruoc }, { san_pham_id: sNC, thuc: ncTruoc }], 'kk-moc', '', { moc: 999999, moc_luc: kk.moc_luc });
  const mocThieu = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: camTruoc }, { san_pham_id: sNC, thuc: ncTruoc }], 'kk-moc2', '', {});
  k('C5d mốc lớn hơn id lớn nhất / thiếu mốc → 400 KHO_MOC_SAI', mocSai.code === 'KHO_MOC_SAI' && mocThieu.code === 'KHO_MOC_SAI', `${moTa(mocSai)} / ${moTa(mocThieu)}`);
  const amKK = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: -1, ghi_chu: 'x' }, { san_pham_id: sNC, thuc: ncTruoc }], 'kk-am');
  k('D2a kiểm kê số âm → 400 KHO_SO_AM', amKK.status === 400 && amKK.code === 'KHO_SO_AM', moTa(amKK));
  // ca đua: hai nhân viên cùng chốt, cùng mốc
  const dongKK = [{ nguyen_lieu_id: nCam, thuc: camTruoc - 1, ghi_chu: 'đổ 1 kg' }, { san_pham_id: sNC, thuc: ncTruoc + 2, ghi_chu: 'pha thêm chưa ghi' }];
  const [c1, c2] = await Promise.all([guiKK('nv', dongKK, 'kk-a'), guiKK('nv2', dongKK, 'kk-b')]);
  const thang = c1.status === 200 ? c1 : c2;
  k('Q5a phản hồi lưu kiểm kê của NHÂN VIÊN chỉ "đã chốt" — không số máy, không dòng lệch / số lệch, không mã phiếu', thang.da_chot === true
    && !coKhoa(thang, ['anh', 'lech', 'phieu_id', 'may', 'goc', 'chot', 'ton', 'dong']), JSON.stringify(thang));
  k('C-đua hai người cùng chốt → MỘT 200, người sau 409 KHO_DA_KIEM; tồn chỉ trừ MỘT lần', [c1, c2].filter((r) => r.status === 200).length === 1
    && [c1, c2].some((r) => r.code === 'KHO_DA_KIEM') && (await demKK()) === 1 && gan(await tonNL(nCam), camTruoc - 1), `${moTa(c1)} / ${moTa(c2)} · Cam ${await tonNL(nCam)}`);
  const kkP = await mot("SELECT * FROM kho_phieu WHERE loai = 'KK' ORDER BY id DESC LIMIT 1");
  const kkD = await q('SELECT d.*, l.han_dung AS lo_han, l.phieu_id AS lo_phieu FROM kho_phieu_dong d LEFT JOIN kho_lo l ON l.id = d.lo_id WHERE d.phieu_id = ? ORDER BY d.id', [kkP?.id || 0]);
  const dCam = kkD.filter((d) => Number(d.nguyen_lieu_id) === nCam);
  const dNC = kkD.find((d) => Number(d.san_pham_id) === sNC);
  k('C2a phiếu KK đã duyệt ngay (người tạo = nhân viên), dòng loai kiem_ke có ghi chú', kkP?.trang_thai === 'da_duyet' && ['nv_a', 'nv_b'].includes(kkP?.nguoi_tao)
    && kkD.every((d) => d.loai === 'kiem_ke') && dCam[0]?.ghi_chu === 'đổ 1 kg', JSON.stringify(kkP));
  k('C2b lệch −: trừ theo lô (FEFO), tổng −1', dCam.length >= 1 && gan(dCam.reduce((t, d) => t + Number(d.so_luong), 0), -1) && dCam.every((d) => d.lo_id != null));
  k('C2c lệch +: lô thành phẩm MỚI +2, hạn = giờ chốt + 30 ngày (hạn món)', dNC && gan(dNC.so_luong, 2) && dNC.lo_phieu === kkP?.id && dNC.lo_han === '2026-12-31T21:30:00', JSON.stringify(dNC));
  const xemKK = await goi('ql', 'GET', `/kho/phieu/${kkP?.id}`);
  const dongXem = xemKK.dong || [];
  k('C2f xem phiếu KK: dòng trừ / cộng có dấu (Cam tang false, Nước cam tang true)', dongXem.some((d) => d.nguyen_lieu_id === nCam && d.tang === false)
    && dongXem.some((d) => d.san_pham_id === sNC && d.tang === true), JSON.stringify(dongXem.map((d) => [d.ten, d.tang])));
  const chot1 = await mot("SELECT * FROM kho_chot WHERE che_do = 'kiemke' ORDER BY id DESC LIMIT 1");
  const anh1 = (() => { try { return JSON.parse(chot1?.anh || '[]'); } catch { return []; } })();
  k('C2d ảnh chốt: tồn sau chốt từng thứ + ghi chú chung', gan(anh1.find((a) => a.nguyen_lieu_id === nCam)?.chot, camTruoc - 1) && gan(anh1.find((a) => a.san_pham_id === sNC)?.chot, ncTruoc + 2)
    && chot1?.ghi_chu_chung === 'Tủ lạnh 2 hơi kêu', chot1?.anh);
  const vKK = (hnChu.viec || []).find((v) => v.loai === 'kiemke');
  k('C2e việc kiemke tự xong; diễn biến kiem_ke tô cam (có lệch)', (await mot('SELECT xong_luc FROM kho_viec WHERE id = ?', [vKK?.id || 0]))?.xong_luc != null
    && (await so("SELECT chu_y FROM kho_dien_bien WHERE loai = 'kiem_ke' ORDER BY id DESC LIMIT 1")) === 1);
  const lai = await guiKK(thang === c1 ? 'nv' : 'nv2', dongKK, thang === c1 ? 'kk-a' : 'kk-b');
  k('C-ma_gui bấm lại cùng mã → trả lần đã ghi CÙNG dạng (nhân viên: vẫn chỉ "đã chốt"), không thêm phiếu', lai.status === 200 && lai.chot_id === thang.chot_id
    && (await demKK()) === 1 && JSON.stringify(Object.keys(lai).sort()) === JSON.stringify(Object.keys(thang).sort()), JSON.stringify(lai));
  const laiBG = await goi(thang === c1 ? 'nv' : 'nv2', 'POST', '/kho/kiem-ke', { che_do: 'bangiao', moc: kk.moc, moc_luc: kk.moc_luc, dong: [], ma_gui: thang === c1 ? 'kk-a' : 'kk-b' });
  const laiKhac = await goi(thang === c1 ? 'nv2' : 'nv', 'POST', '/kho/kiem-ke', { che_do: 'kiemke', moc: kk.moc, moc_luc: kk.moc_luc, dong: [], ma_gui: thang === c1 ? 'kk-a' : 'kk-b' });
  k('Q5b nhân viên gửi lại mã của lần kiểm kê với chế độ bàn giao / người khác gửi mã đó → 409 MA_GUI_TRUNG, không lộ ảnh chốt', laiBG.status === 409
    && laiBG.code === 'MA_GUI_TRUNG' && laiKhac.status === 409 && laiKhac.code === 'MA_GUI_TRUNG' && !coKhoa([laiBG, laiKhac], ['anh', 'lech', 'goc']), `${JSON.stringify(laiBG)} / ${moTa(laiKhac)}`);
  // bán sau chốt (Q3) — sáng ra thấy lệch so với chốt
  datGio('2026-12-01T22:05:00');
  const ban1 = await ban(sNC, 1);
  k('Nền: bán 1 Nước cam sau chốt (truKhoDon)', !ban1.loi && gan(await tonSP(sNC), ncTruoc + 1), JSON.stringify(ban1.loi || ''));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C3] ngày N2 = 02.12 — nhận bàn giao so với chốt tối qua');
  datGio('2026-12-02T07:00:00');
  const bg = await goi('nv', 'GET', '/kho/kiem-ke?che_do=bangiao');
  const bgNC2 = (bg.dong || []).find((d) => d.san_pham_id === sNC);
  const bgCam = (bg.dong || []).find((d) => d.nguyen_lieu_id === nCam);
  k('C3c "Chốt" = số tối qua chốt (máy đã bán thêm 1 vẫn hiện số chốt), "Ca trước dặn" đúng', bg.chua_co_chot === false && gan(bgNC2?.chot, ncTruoc + 2)
    && gan(bgCam?.chot, camTruoc - 1) && bg.ca_truoc_dan === 'Tủ lạnh 2 hơi kêu', JSON.stringify(bgNC2) + ' · ' + bg.ca_truoc_dan);
  k('C3f bàn giao trả cả số máy (sáng THẤY số): Nước cam máy = sau bán sau chốt', gan(bgNC2?.may, ncTruoc + 1), JSON.stringify(bgNC2));
  const bgTrong = await goi('nv', 'POST', '/kho/kiem-ke', { che_do: 'bangiao', moc: bg.moc, moc_luc: bg.moc_luc, dong: [], ma_gui: 'bg-trong' });
  k('C3g bàn giao để trống hết khi máy ≠ chốt (bán sau chốt) → 400 KHO_THIEU_SO (phải gõ số thật), không kéo tồn về số chốt', bgTrong.status === 400
    && bgTrong.code === 'KHO_THIEU_SO' && gan(await tonSP(sNC), ncTruoc + 1), moTa(bgTrong));
  const bgTrongGhi = await goi('nv', 'POST', '/kho/kiem-ke', { che_do: 'bangiao', moc: bg.moc, moc_luc: bg.moc_luc, dong: [{ san_pham_id: sNC, thuc: '', ghi_chu: 'bán sau chốt' }],
    ma_gui: 'bg-trong-ghi' });
  k('C3h bàn giao để trống + có ghi chú khi máy ≠ chốt → 400 KHO_THIEU_SO, KHÔNG tạo hàng ảo (tồn giữ số máy)', bgTrongGhi.status === 400
    && bgTrongGhi.code === 'KHO_THIEU_SO' && gan(await tonSP(sNC), ncTruoc + 1), `${moTa(bgTrongGhi)} · NC ${await tonSP(sNC)}`);
  const bgThieu = await goi('nv', 'POST', '/kho/kiem-ke', { che_do: 'bangiao', moc: bg.moc, moc_luc: bg.moc_luc, dong: [{ san_pham_id: sNC, thuc: ncTruoc + 1 }], ma_gui: 'bg-kg' });
  k('C4b bàn giao lệch so với chốt không ghi chú → 400 KHO_THIEU_GHI_CHU', bgThieu.status === 400 && bgThieu.code === 'KHO_THIEU_GHI_CHU', moTa(bgThieu));
  const kkTruocBG = await demKK();
  const nhan = await goi('nv', 'POST', '/kho/kiem-ke', { che_do: 'bangiao', moc: bg.moc, moc_luc: bg.moc_luc, ghi_chu_chung: 'nhận ca sáng',
    dong: [{ san_pham_id: sNC, thuc: ncTruoc + 1, ghi_chu: 'tối qua bán sau chốt' }, { nguyen_lieu_id: nCam, thuc: camTruoc - 1.5, ghi_chu: 'thiếu 0,5 kg' }], ma_gui: 'bg1' });
  k('C3d bàn giao lệch → 200, phiếu KK điều chỉnh về số thực tế (Cam −0,5); Nước cam khớp máy → không dòng', nhan.status === 200 && (await demKK()) === kkTruocBG + 1
    && gan(await tonNL(nCam), camTruoc - 1.5) && gan(await tonSP(sNC), ncTruoc + 1), `${moTa(nhan)} · Cam ${await tonNL(nCam)} · NC ${await tonSP(sNC)}`);
  k('C3e diễn biến nhan_ca tô cam (lệch so với chốt)', (await so("SELECT chu_y FROM kho_dien_bien WHERE loai = 'nhan_ca' ORDER BY id DESC LIMIT 1")) === 1);
  const chotBG = await mot("SELECT * FROM kho_chot WHERE che_do = 'bangiao' ORDER BY id DESC LIMIT 1");
  k('C4c ghi chú dòng lưu trong ảnh bàn giao', /bán sau chốt/.test(chotBG?.anh || ''));
  k('K5-2 quán 1 ca: CÙNG một nhân viên làm bàn giao sáng N1 và kiểm kê tối N1 (đều 200)', nhan0.status === 200 && (thang === c1 || c2.status === 200));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C5] tồn đổi giữa lúc mở và lúc lưu');
  datGio('2026-12-02T21:00:00');
  const r5 = await goi('nv', 'GET', '/kho/kiem-ke?che_do=kiemke');
  const nc5 = await tonSP(sNC), cam5 = await tonNL(nCam);
  await ban(sNC, 1);
  const kkTruoc5 = await demKK();
  const kk5 = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: cam5, ghi_chu: 'đủ, đã lau tủ' }, { san_pham_id: sNC, thuc: nc5 }], 'kk5', '', r5);
  const chot5 = await mot("SELECT anh FROM kho_chot WHERE che_do = 'kiemke' ORDER BY id DESC LIMIT 1");
  const anh5 = (() => { try { return JSON.parse(chot5?.anh || '[]'); } catch { return []; } })();
  k('C5a bán 1 ly giữa lúc mở và lưu, đếm đúng → 200, KHÔNG phiếu KK, tồn = số sau bán, không cam', kk5.status === 200 && (await demKK()) === kkTruoc5 && gan(await tonSP(sNC), nc5 - 1)
    && (await so("SELECT chu_y FROM kho_dien_bien WHERE loai = 'kiem_ke' ORDER BY id DESC LIMIT 1")) === 0, `${moTa(kk5)} · ${JSON.stringify(kk5.lech)}`);
  k('C5b ảnh chốt = tồn SAU chốt (số sau bán), không phải số gõ', gan(anh5.find((a) => a.san_pham_id === sNC)?.chot, nc5 - 1), chot5?.anh);
  k('C4d dòng KHÔNG lệch có ghi chú → ghi chú vẫn lưu trong ảnh chốt', anh5.find((a) => a.nguyen_lieu_id === nCam)?.ghi_chu === 'đủ, đã lau tủ', chot5?.anh);
  k('K5-1 kiểm kê không lệch → việc kiemke vẫn xong (02.12)', (await so("SELECT COUNT(*) FROM kho_viec WHERE ngay = '2026-12-02' AND loai = 'kiemke' AND xong_luc IS NOT NULL")) === 1);
  datGio('2026-12-02T21:10:00');
  const r6 = await goi('nv', 'GET', '/kho/kiem-ke?che_do=kiemke');
  const nc6 = await tonSP(sNC);
  await ban(sNC, 1);
  const kk6 = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: cam5 }, { san_pham_id: sNC, thuc: nc6 - 2 }], 'kk6', '', r6);
  k('C5c đếm thiếu 2 + bán 1 xen giữa → tồn = thực tế (−3 so với lúc mở)', kk6.status === 200 && gan(await tonSP(sNC), nc6 - 3), `${moTa(kk6)} · ${await tonSP(sNC)} / ${nc6 - 3}`);
  const db6 = await mot("SELECT * FROM kho_dien_bien WHERE loai = 'kiem_ke' ORDER BY id DESC LIMIT 1");
  k('C4a kiểm kê TỐI dòng lệch KHÔNG ghi chú → vẫn lưu (Q5 — không dò được số máy); chủ / quản lý thấy dòng cam "chưa giải thích"', kk6.status === 200
    && db6?.chu_y === 1 && /Nước cam[^;]*chưa giải thích/.test(db6?.chi_tiet || ''), db6?.chi_tiet);
  // bán hết giữa chừng: tồn mới < 0
  datGio('2026-12-02T21:20:00');
  const r7 = await goi('nv', 'GET', '/kho/kiem-ke?che_do=kiemke');
  const nc7 = await tonSP(sNC);
  await ban(sNC, nc7);
  const kk7 = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: cam5 }, { san_pham_id: sNC, thuc: 0, ghi_chu: 'đếm 0' }], 'kk7', '', r7);
  k('C5e đếm 0 rồi bán hết xen giữa (tồn mới < 0) → 409 KHO_TON_DOI, không ghi', kk7.status === 409 && kk7.code === 'KHO_TON_DOI' && gan(await tonSP(sNC), 0), moTa(kk7));
  // huỷ đơn xen giữa: đổi tồn mà không có phiếu mới
  datGio('2026-12-02T21:20:30');
  const r8 = await goi('nv', 'GET', '/kho/kiem-ke?che_do=kiemke');
  datGio('2026-12-02T21:21:00');
  await trongGiaoDich((tx) => banHang.huyPhieuBan(tx, soDon, { nguoi: 'chu', luc: '2026-12-02T21:21:00', lyDo: 'khách đổi ý' }));
  const kk8 = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: cam5 }, { san_pham_id: sNC, thuc: 0, ghi_chu: 'đếm 0' }], 'kk8', '', r8);
  k('C5f huỷ đơn xen giữa (hàng về lô cũ) → 409 KHO_TON_DOI "tải lại"', kk8.status === 409 && kk8.code === 'KHO_TON_DOI', moTa(kk8));
  datGio('2026-12-02T21:22:00');
  const r9 = await goi('nv', 'GET', '/kho/kiem-ke?che_do=kiemke');
  const nc9 = await tonSP(sNC);
  await goi('ql', 'POST', '/kho/phieu-xuat', { mon: [{ san_pham_id: sNC, so_phan: 1 }], ma_gui: 'px9' });
  const cam9 = await tonNL(nCam);
  const kk9 = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: 0, ghi_chu: 'đếm 0' }, { san_pham_id: sNC, thuc: nc9 }], 'kk9', '', r9);
  k('C5g nguyên liệu: đếm 0 rồi phiếu pha chế trừ thêm xen giữa (tồn mới < 0) → 409 KHO_TON_DOI, không ghi tồn âm', kk9.status === 409 && kk9.code === 'KHO_TON_DOI'
    && gan(await tonNL(nCam), cam9), `${moTa(kk9)} · Cam ${await tonNL(nCam)}`);

  // duyệt phiếu CŨ (chờ duyệt) xen giữa: đổi tồn mà không có phiếu mới
  datGio('2026-12-02T21:23:00');
  const pxCho = await goi('nv', 'POST', '/kho/phieu-xuat', { mon: [{ san_pham_id: sNC, so_phan: 1 }], ma_gui: 'px-cho' });
  datGio('2026-12-02T21:23:30');
  const r10 = await goi('nv', 'GET', '/kho/kiem-ke?che_do=kiemke');
  const nc10 = await tonSP(sNC), cam10 = await tonNL(nCam);
  datGio('2026-12-02T21:24:00');
  await goi('ql', 'POST', `/kho/phieu/${pxCho.phieu?.id}/duyet`);
  const kkTruoc10 = await demKK();
  // đếm thật gồm cả 1 ly của phiếu chờ duyệt (Cam đã dùng 0,2) — Q4: kiểm kê coi phiếu chờ như đã ghi
  const kk10 = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: cam10 - 0.2 }, { san_pham_id: sNC, thuc: nc10 + 1 }], 'kk10', '', r10);
  k('C5h quản lý duyệt phiếu chờ xen giữa lúc đếm → 200, KHÔNG lệch giả (không phiếu KK), tồn sau duyệt = số đếm', pxCho.phieu?.trang_thai === 'cho_duyet'
    && kk10.status === 200 && (await demKK()) === kkTruoc10 && gan(await tonSP(sNC), nc10 + 1) && gan(await tonNL(nCam), cam10 - 0.2), `${pxCho.phieu?.trang_thai} · ${moTa(kk10)}`);
  datGio('2026-12-02T21:25:00');
  const r11 = await goi('nv', 'GET', '/kho/kiem-ke?che_do=kiemke');
  const nc11 = await tonSP(sNC), cam11 = await tonNL(nCam);
  const huy11 = await goi('chu', 'POST', `/kho/phieu/${pxCho.phieu?.id}/huy`, { ly_do: 'pha nhầm' });
  const kk11 = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: cam11, ghi_chu: 'x' }, { san_pham_id: sNC, thuc: nc11, ghi_chu: 'x' }], 'kk11', '', r11);
  k('C5i huỷ phiếu CÙNG GIÂY với lúc mở màn → vẫn 409 KHO_TON_DOI (so giờ >=, thà tải lại thừa)', huy11.status === 200 && kk11.status === 409 && kk11.code === 'KHO_TON_DOI',
    `${moTa(huy11)} · ${moTa(kk11)}`);

  // Q4: phiếu CHỜ DUYỆT lúc chốt — không tính đôi khi duyệt sau; từ chối sau chốt → dòng cam
  datGio('2026-12-02T21:26:00');
  const px12 = await goi('nv', 'POST', '/kho/phieu-xuat', { mon: [{ san_pham_id: sNC, so_phan: 10 }], ma_gui: 'px12' });
  datGio('2026-12-02T21:26:30');
  const r12 = await goi('nv', 'GET', '/kho/kiem-ke?che_do=kiemke');
  const nc12 = await tonSP(sNC), cam12 = await tonNL(nCam);
  const kkTruoc12 = await demKK();
  const kk12 = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: cam12 - 2 }, { san_pham_id: sNC, thuc: nc12 + 10 }], 'kk12', '', r12);
  datGio('2026-12-02T21:27:00');
  const dy12 = await goi('ql', 'POST', `/kho/phieu/${px12.phieu?.id}/duyet`);
  k('Q4a pha 10 ly CHỜ duyệt → kiểm kê đếm (gồm 10 ly đó) → không phiếu KK → duyệt → tồn = số đếm (không cộng đôi thành +20)', px12.phieu?.trang_thai === 'cho_duyet'
    && kk12.status === 200 && (await demKK()) === kkTruoc12 && dy12.status === 200 && gan(await tonSP(sNC), nc12 + 10) && gan(await tonNL(nCam), cam12 - 2),
  `${moTa(kk12)} · NC ${await tonSP(sNC)} / ${nc12 + 10} · Cam ${await tonNL(nCam)} / ${cam12 - 2}`);
  datGio('2026-12-02T21:28:00');
  const px13 = await goi('nv', 'POST', '/kho/phieu-xuat', { mon: [{ san_pham_id: sNC, so_phan: 1 }], ma_gui: 'px13' });
  datGio('2026-12-02T21:28:30');
  const r13 = await goi('nv', 'GET', '/kho/kiem-ke?che_do=kiemke');
  const nc13 = await tonSP(sNC), cam13 = await tonNL(nCam);
  await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: cam13 - 0.2 }, { san_pham_id: sNC, thuc: nc13 + 1 }], 'kk13', '', r13);
  datGio('2026-12-02T21:29:00');
  const demTC = () => so("SELECT COUNT(*) FROM kho_dien_bien WHERE loai = 'tu_choi_sau_chot'");
  const tc13 = await goi('ql', 'POST', `/kho/phieu/${px13.phieu?.id}/tu-choi`, { ly_do: 'pha nhầm' });
  const dbTC = await mot("SELECT * FROM kho_dien_bien WHERE loai = 'tu_choi_sau_chot' ORDER BY id DESC LIMIT 1");
  k('Q4b phiếu chờ đã tính vào lần chốt rồi bị TỪ CHỐI → dòng cam ở Diễn biến để kiểm lại', tc13.status === 200 && (await demTC()) === 1 && dbTC?.chu_y === 1
    && new RegExp(px13.phieu?.so_phieu || '@').test(dbTC?.chi_tiet || ''), `${moTa(tc13)} · ${dbTC?.chi_tiet}`);
  datGio('2026-12-02T21:30:00');
  const px14 = await goi('nv', 'POST', '/kho/phieu-xuat', { mon: [{ san_pham_id: sNC, so_phan: 1 }], ma_gui: 'px14' });
  datGio('2026-12-02T21:31:00');
  const tc14 = await goi('ql', 'POST', `/kho/phieu/${px14.phieu?.id}/tu-choi`, { ly_do: 'pha nhầm' });
  k('Q4c (K5) từ chối phiếu chờ tạo SAU lần chốt cuối → KHÔNG thêm dòng cam', tc14.status === 200 && (await demTC()) === 1, moTa(tc14));
  // chốt có tính một phiếu chờ, rồi phiếu đó bị đổi bằng đường khác: huỷ (chủ quán) · sửa (chủ quán)
  const chotVoiCho = async (ma, gioTao, gioDoc) => {
    datGio('2026-12-02T' + gioTao);
    const px = await goi('nv', 'POST', '/kho/phieu-xuat', { mon: [{ san_pham_id: sNC, so_phan: 1 }], ma_gui: ma });
    datGio('2026-12-02T' + gioDoc);
    const rr = await goi('nv', 'GET', '/kho/kiem-ke?che_do=kiemke');
    await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: (await tonNL(nCam)) - 0.2 }, { san_pham_id: sNC, thuc: (await tonSP(sNC)) + 1 }], 'kk-' + ma, '', rr);
    return px;
  };
  const px15 = await chotVoiCho('px15', '21:32:00', '21:32:30');
  datGio('2026-12-02T21:33:00');
  const huy15 = await goi('chu', 'POST', `/kho/phieu/${px15.phieu?.id}/huy`, { ly_do: 'pha nhầm' });
  k('Q4d phiếu chờ đã tính vào lần chốt rồi bị chủ quán HUỶ → dòng cam', huy15.status === 200 && (await demTC()) === 2, `${moTa(huy15)} · ${await demTC()}`);
  const px16 = await chotVoiCho('px16', '21:34:00', '21:34:30');
  datGio('2026-12-02T21:35:00');
  const sua16 = await goi('chu', 'POST', `/kho/phieu/${px16.phieu?.id}/sua`, { mon: [{ san_pham_id: sNC, so_phan: 1 }], ly_do: 'sửa sau chốt' });
  k('Q4e phiếu chờ đã tính vào lần chốt rồi bị chủ quán SỬA → dòng cam', sua16.status === 200 && (await demTC()) === 3, `${moTa(sua16)} · ${await demTC()}`);
  // đơn đặt hàng chờ duyệt KHÔNG phải hàng có thật — không tính vào kiểm kê, từ chối sau chốt không cảnh báo
  datGio('2026-12-02T21:36:00');
  const dh17 = await goi('nv', 'POST', '/kho/phieu-dat', { mon: [], nguyen_lieu: [{ nguyen_lieu_id: nCam, luong: 5 }], ma_gui: 'dh17' });
  datGio('2026-12-02T21:36:30');
  const r17 = await goi('nv', 'GET', '/kho/kiem-ke?che_do=kiemke');
  const kkTruoc17 = await demKK();
  const kk17 = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: await tonNL(nCam) }, { san_pham_id: sNC, thuc: await tonSP(sNC) }], 'kk17', '', r17);
  datGio('2026-12-02T21:37:00');
  const tc17 = await goi('ql', 'POST', `/kho/phieu/${dh17.phieu?.id}/tu-choi`, { ly_do: 'không cần' });
  k('Q4f đơn đặt hàng CHỜ duyệt không tính là hàng có thật (đếm đúng sổ → không phiếu KK); từ chối nó sau chốt → không dòng cam', dh17.phieu?.trang_thai === 'cho_duyet'
    && kk17.status === 200 && (await demKK()) === kkTruoc17 && tc17.status === 200 && (await demTC()) === 3, `${dh17.phieu?.trang_thai} · ${moTa(kk17)} · KK ${await demKK()}/${kkTruoc17} · ${await demTC()}`);
  // bàn giao: thành phẩm hết lô (bán hết sau chốt) mà tối qua chốt còn → vẫn có dòng
  datGio('2026-12-02T21:38:00');
  await ban(sNC, await tonSP(sNC));
  const bg18 = await goi('nv', 'GET', '/kho/kiem-ke?che_do=bangiao');
  const d18 = (bg18.dong || []).find((d) => d.san_pham_id === sNC);
  k('C3i bàn giao: thành phẩm bán hết sau chốt (máy 0) mà chốt còn → vẫn có dòng để báo lệch', d18 && d18.chot > 0 && gan(d18.may, 0), JSON.stringify(d18));
  // Q8 (a): đếm THIẾU một món làm sẵn đang có phiếu pha chế CHỜ duyệt (chưa có lô) → trừ vào chính phiếu chờ; nguyên liệu trừ đủ theo phiếu gốc
  datGio('2026-12-02T21:39:00');
  const px19 = await goi('nv', 'POST', '/kho/phieu-xuat', { mon: [{ san_pham_id: sNC, so_phan: 10 }], ma_gui: 'px19' });
  datGio('2026-12-02T21:39:30');
  const r19 = await goi('nv', 'GET', '/kho/kiem-ke?che_do=kiemke');
  const cam19 = await tonNL(nCam);
  const kk19 = await guiKK('nv', [{ nguyen_lieu_id: nCam, thuc: cam19 - 2 }, { san_pham_id: sNC, thuc: 9 }], 'kk19', '', r19);
  const p19 = await mot('SELECT * FROM kho_phieu WHERE id = ?', [px19.phieu?.id || 0]);
  const tp19 = await so("SELECT SUM(so_luong) FROM kho_phieu_dong WHERE phieu_id = ? AND loai = 'thanh_pham'", [px19.phieu?.id || 0]);
  const xuat19 = await so("SELECT SUM(so_luong) FROM kho_phieu_dong WHERE phieu_id = ? AND loai = 'xuat'", [px19.phieu?.id || 0]);
  const db19 = await mot("SELECT * FROM kho_dien_bien WHERE loai = 'giam_phieu_cho' ORDER BY id DESC LIMIT 1");
  k('Q8a hết lô, 10 ly chờ duyệt, đếm 9 → 200; phiếu chờ còn 9 phần, lý do "kiểm kê: đếm thiếu 1", nguyên liệu phiếu vẫn trừ đủ 10 ly; dòng cam', kk19.status === 200
    && p19?.trang_thai === 'cho_duyet' && gan(tp19, 9) && /kiểm kê: đếm thiếu 1/.test(p19?.ly_do || '') && gan(xuat19, -2) && db19?.chu_y === 1
    && new RegExp(px19.phieu?.so_phieu || '@').test(db19?.chi_tiet || ''), `${moTa(kk19)} · ${tp19} · ${p19?.ly_do} · ${xuat19} · ${db19?.chi_tiet}`);
  datGio('2026-12-02T21:40:00');
  const dy19 = await goi('ql', 'POST', `/kho/phieu/${px19.phieu?.id}/duyet`);
  k('Q8b quản lý duyệt phiếu đã giảm → lô 9 ly khớp số đếm, Cam = số đếm (không trừ đôi)', dy19.status === 200 && gan(await tonSP(sNC), 9) && gan(await tonNL(nCam), cam19 - 2),
    `${moTa(dy19)} · NC ${await tonSP(sNC)} · Cam ${await tonNL(nCam)} / ${cam19 - 2}`);
  datGio('2026-12-02T21:41:00');
  await ban(sNC, 9);
  const px20 = await goi('nv', 'POST', '/kho/phieu-xuat', { mon: [{ san_pham_id: sNC, so_phan: 5 }], ma_gui: 'px20' });
  datGio('2026-12-02T21:41:30');
  const ton20 = await goi('chu', 'GET', '/kho/ton');
  const ct20 = await goi('chu', 'POST', '/kho/chinh-tay', { san_pham_id: sNC, thuc: 4, ly_do: 'vỡ 1 ly mới pha', moc: ton20.moc, moc_luc: ton20.moc_luc, ma_gui: 'ct20' });
  k('Q8c chủ quán CHỈNH TAY món đang có phiếu chờ (5 → thật 4) → 200, phiếu chờ còn 4 phần (không bị chặn)', ct20.status === 200
    && gan(await so("SELECT SUM(so_luong) FROM kho_phieu_dong WHERE phieu_id = ? AND loai = 'thanh_pham'", [px20.phieu?.id || 0]), 4), moTa(ct20));
  datGio('2026-12-02T21:42:00');
  await goi('ql', 'POST', `/kho/phieu/${px20.phieu?.id}/duyet`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] chỉnh tồn tay');
  datGio('2026-12-02T22:00:00');
  const tonChu = await goi('chu', 'GET', '/kho/ton');
  const tonQl = await goi('ql', 'GET', '/kho/ton');
  const tonNv = await goi('nv', 'GET', '/kho/ton');
  k('D1a /ton: chủ duoc_chinh_tay true, quản lý false (công tắc tắt), nhân viên false', tonChu.duoc_chinh_tay === true && tonQl.duoc_chinh_tay === false && tonNv.duoc_chinh_tay === false);
  const chinh = (ai, than, r = tonChu) => goi(ai, 'POST', '/kho/chinh-tay', { moc: r.moc, moc_luc: r.moc_luc, ...than });
  const kkTruocCT = await demKK();
  const ctChu = await chinh('chu', { nguyen_lieu_id: nGung, thuc: 5, ly_do: 'đếm lại kho', ma_gui: 'ct1' });
  const ctP = await mot("SELECT * FROM kho_phieu WHERE loai = 'KK' ORDER BY id DESC LIMIT 1");
  k('D1b chủ quán chỉnh tay → 200, phiếu KK MỘT dòng, ly_do, tồn = số mới', ctChu.status === 200 && (await demKK()) === kkTruocCT + 1 && ctP?.ly_do === 'đếm lại kho'
    && (await so('SELECT COUNT(*) FROM kho_phieu_dong WHERE phieu_id = ?', [ctP?.id || 0])) === 1 && gan(await tonNL(nGung), 5), moTa(ctChu));
  k('D1c diễn biến chinh_tay tô cam', (await so("SELECT chu_y FROM kho_dien_bien WHERE loai = 'chinh_tay' ORDER BY id DESC LIMIT 1")) === 1);
  datGio('2026-12-02T22:01:00');
  const tonChu2 = await goi('chu', 'GET', '/kho/ton');
  const ctQlTat = await chinh('ql', { nguyen_lieu_id: nGung, thuc: 4, ly_do: 'x', ma_gui: 'ct2' }, tonChu2);
  k('D1d quản lý chỉnh tay khi công tắc TẮT → 403', ctQlTat.status === 403, moTa(ctQlTat));
  const ctNv = await chinh('nv', { nguyen_lieu_id: nGung, thuc: 4, ly_do: 'x', ma_gui: 'ct3' }, tonChu2);
  k('D1e nhân viên chỉnh tay → 403', ctNv.status === 403, moTa(ctNv));
  await goi('chu', 'PUT', '/kho/cai-dat-viec', { so_ca: 1, ql_chinh_tay: 1 });
  k('D1f bật công tắc → /ton quản lý duoc_chinh_tay true', (await goi('ql', 'GET', '/kho/ton')).duoc_chinh_tay === true);
  const ctQlBat = await chinh('ql', { nguyen_lieu_id: nGung, thuc: 4, ly_do: 'quản lý đếm', ma_gui: 'ct4' }, tonChu2);
  k('D1g quản lý chỉnh tay khi công tắc BẬT → 200', ctQlBat.status === 200 && gan(await tonNL(nGung), 4), moTa(ctQlBat));
  datGio('2026-12-02T22:02:00');
  const tonChu3 = await goi('chu', 'GET', '/kho/ton');
  const ctLyDo = await chinh('chu', { nguyen_lieu_id: nGung, thuc: 3, ly_do: '  ', ma_gui: 'ct5' }, tonChu3);
  k('D1h thiếu lý do → 400 THIEU_LY_DO', ctLyDo.status === 400 && ctLyDo.code === 'THIEU_LY_DO', moTa(ctLyDo));
  const ctAm = await chinh('chu', { nguyen_lieu_id: nGung, thuc: -1, ly_do: 'x', ma_gui: 'ct6' }, tonChu3);
  k('D2b chỉnh tay số mới −1 → 400 KHO_SO_AM', ctAm.status === 400 && ctAm.code === 'KHO_SO_AM', moTa(ctAm));
  const ctTP = await chinh('chu', { san_pham_id: sNC, thuc: 3, ly_do: 'pha thêm', ma_gui: 'ct7' }, tonChu3);
  k('D1i chỉnh tay thành phẩm lên 3 → 200, lô mới', ctTP.status === 200 && gan(await tonSP(sNC), 3), `${moTa(ctTP)} · ${await tonSP(sNC)}`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B5 · B6] diễn biến · đã xem · cần chú ý');
  const db1 = await goi('chu', 'GET', '/kho/dien-bien');
  const loaiCo = new Set((db1.dong || []).map((d) => d.loai));
  k('B5a diễn biến hôm nay có dòng nhận ca · chốt · chỉnh tay; mỗi dòng giờ · việc · người', ['nhan_ca', 'kiem_ke', 'chinh_tay'].every((l) => loaiCo.has(l))
    && (db1.dong || []).every((d) => d.luc?.startsWith('2026-12-02') && d.nguoi && d.viec), [...loaiCo].join());
  k('B5b nhân viên đọc diễn biến → 403', (await goi('nv', 'GET', '/kho/dien-bien')).status === 403 && (await goi('nv', 'GET', '/kho/dien-bien/so')).status === 403);
  const soChu0 = (await goi('chu', 'GET', '/kho/dien-bien/so')).chua_xem, soQl0 = (await goi('ql', 'GET', '/kho/dien-bien/so')).chua_xem;
  k('B5c chưa xem > 0 cho cả chủ và quản lý', soChu0 > 0 && soQl0 > 0, `${soChu0} / ${soQl0}`);
  const cy = db1.can_chu_y || {};
  const msc = await goi('ql', 'GET', '/kho/mon-chua-san');
  const csIds = (cy.mon_chua_san || []).map((m) => m.san_pham_id);
  k('B6c Cần chú ý báo món PHA TẠI CHỖ hết nguyên liệu: "Cà phê đen — Pha tại chỗ: hết Cà phê"; Cam ép (Cam còn) KHÔNG báo', (cy.mon_chua_san || [])
    .some((m) => m.san_pham_id === sCPD && m.ly_do === 'Pha tại chỗ: hết Cà phê') && !csIds.includes(sCamEp), JSON.stringify(cy.mon_chua_san));
  k('B6a Cần chú ý: có MỌI món của /mon-chua-san (dùng lại hàm đang có); có dòng lệch / chỉnh tay chưa xem', (msc.mon || []).every((m) => csIds.includes(m.san_pham_id))
    && (cy.dien_bien || []).some((d) => d.loai === 'chinh_tay') && (cy.dien_bien || []).some((d) => d.loai === 'kiem_ke') && (cy.dien_bien || []).every((d) => d.chu_y === 1), JSON.stringify(cy).slice(0, 200));
  const denId = Math.max(...(db1.dong || []).map((d) => d.id));
  await goi('chu', 'POST', '/kho/dien-bien/da-xem', { den_id: 999999999 });
  const soChu1 = (await goi('chu', 'GET', '/kho/dien-bien/so')).chua_xem, soQl1 = (await goi('ql', 'GET', '/kho/dien-bien/so')).chua_xem;
  k('B5d chủ "Đã xem" → của chủ 0, của quản lý GIỮ nguyên (xem riêng)', soChu1 === 0 && soQl1 === soQl0, `${soChu1} / ${soQl1}`);
  k('B6b chủ đã xem → Cần chú ý của chủ hết dòng diễn biến', ((await goi('chu', 'GET', '/kho/dien-bien')).can_chu_y?.dien_bien || []).length === 0);
  await goi('nv', 'POST', '/kho/viec', { ten: 'Gọi thêm đường' });
  k('B5e dòng tới sau lúc bấm "Đã xem" (đã xem tới id lớn nhất lúc đó) → chủ thấy 1 chưa xem', (await goi('chu', 'GET', '/kho/dien-bien/so')).chua_xem === 1 && denId > 0);
  const xemTrong = await goi('ql2', 'POST', '/kho/dien-bien/da-xem', { den_id: 0 });
  k('K5-7 "Đã xem" với den_id 0 → 200', xemTrong.status === 200, moTa(xemTrong));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[Ngày VN] 23:59 vs 00:00 giờ Việt Nam trên máy UTC');
  datGio('2026-12-03T23:59:00');
  const n3 = await goi('nv', 'POST', '/kho/viec/hom-nay', {});
  datGio('2026-12-04T00:00:00');
  const n4 = await goi('nv', 'POST', '/kho/viec/hom-nay', {});
  k('V1 23:59 VN → ngày 03.12; 00:00 VN → ngày 04.12, sinh bộ mới', n3.ngay === '2026-12-03' && n4.ngay === '2026-12-04'
    && (await so("SELECT COUNT(*) FROM kho_viec WHERE ngay = '2026-12-04' AND mau_id IS NOT NULL")) > 0, `${n3.ngay} / ${n4.ngay}`);
  k('A3d ngày sau dùng mẫu đã sửa / thêm ("Gọi đá viên", "Mẫu thêm giữa ngày")', (n4.viec || []).some((v) => v.ten === 'Gọi đá viên') && (n4.viec || []).some((v) => v.mau_id === mGiua));
  k('B2c việc phát sinh chỉ có trong ngày tạo', !(n4.viec || []).some((v) => v.ten === 'Hết đá — gọi đá'));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E2 · sao lưu · bộ kiểm] tĩnh');
  const kd = path.join(CLIENT, 'pages', 'Kho');
  const idx = doc(path.join(kd, 'index.jsx'));
  k('E2a tab đầu "Việc hôm nay" (viec), thứ hai Pha chế (pc); Nhận hàng · Phát sinh · Tồn kho · Phiếu theo sau', /tabs = \[\s*\{ ma: 'viec'[^}]*\},\s*\{ ma: 'pc'/.test(idx)
    && ['pc', 'nh', 'ps', 'ton', 'phieu'].map((m) => idx.indexOf(`ma: '${m}'`)).every((v, i, a) => v > 0 && (i === 0 || v > a[i - 1])));
  k('E2b tab "Cài đặt kho" chỉ chủ / quản lý', /\{ ma: 'caidat', ten: 'Cài đặt kho', hien: quanLy \}/.test(idx));
  k('B5f MỘT vòng hỏi 30 s (một setInterval) và vòng đó hỏi số chưa xem', (idx.match(/setInterval/g) || []).length === 1 && /\/kho\/dien-bien\/so/.test(idx));
  k('E2c màn mới có: ViecHomNay · KiemKe · CaiDatKho', ['ViecHomNay', 'KiemKe', 'CaiDatKho'].every((f) => fs.existsSync(path.join(kd, f + '.jsx'))));
  const bk = doc(path.join(MAY_CHU, 'routes', 'backup.js'));
  const vt = (t) => bk.indexOf(`name: '${t}'`);
  k('S1 sao lưu có 5 bảng mới, mẫu việc trước việc', ['kho_viec_mau', 'kho_viec', 'kho_dien_bien', 'kho_dien_bien_xem', 'kho_chot'].every((t) => vt(t) > 0) && vt('kho_viec_mau') < vt('kho_viec'));
  const kt = doc(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'));
  k('K1 bộ kiểm chạy bài này', /chayBaiThat\('cong_cu\/thu_KHOGON1\.js'\)/.test(kt));

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
