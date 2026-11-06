#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ GIAO-DIEN-1 — dải báo "Đơn App" · Số dư gộp vào Khách hàng · ô "Khách và tiền" · nạp tay chỉ chủ quán · thẻ mã QR thương hiệu
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (manager / staff còn nạp được, nút nổi còn `position: fixed`, chưa có veQrThuongHieu.js). Xanh ngay = vô giá trị (K3).
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_GIAODIEN1.js [--goc <thư mục gốc bản sao>]      (in "n đạt · m hỏng")
 *  [A-D, F] hàm thuần của client/src (ES module, nạp bằng import()) + cấu trúc nguồn chỗ máy không thử được bằng hàm thuần.
 *  [E] THẬT: database.js + libsql trên kho TẠM, route wallets.js thật qua HTTP, bước nâng cấp 018 chạy thật.
 *  [F] mã QR: ma trận khớp qrcode-generator mức H, và ảnh dựng từ CHÍNH các phần tử đã vẽ phải giải mã ra đúng chuỗi (jsqr).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const iG = process.argv.indexOf('--goc');
const GOC = path.resolve(iG > 0 ? process.argv[iG + 1] : path.join(__dirname, '..'));
const SRC = path.join(GOC, 'client', 'src');
const DOC = (...p) => { try { return fs.readFileSync(path.join(GOC, ...p), 'utf8'); } catch { return ''; } };
const CO = (...p) => fs.existsSync(path.join(GOC, ...p));
const sach = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const SX = (...p) => sach(DOC('client', 'src', ...p));   // nguồn đã bỏ chú thích — phép "KHÔNG có" không bị chú thích đánh lừa (E11)

const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_giaodien1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_gd1_nv_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_gd1_kh_' + Date.now();
delete process.env.SX_API_KEY;

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const nap = async (...p) => { try { return await import(pathToFileURL(path.join(SRC, ...p)).href); } catch (e) { return { loiNap: e.message }; } };
const thu = (ten, fn) => { try { k(ten, !!fn()); } catch (e) { k(ten, false, e.message); } };

async function phanThuan() {
  const D = await nap('utils', 'donAppDai.js');
  const M = await nap('pages', 'QuanLy', 'menu.js');
  const f = (X, ten) => (typeof X[ten] === 'function' ? X[ten] : () => { throw new Error('thiếu hàm ' + ten); });

  // ═══ A · dải báo ════════════════════════════════════════════════════════
  muc('A · dải báo "Đơn App": đếm, phút sớm nhất, không nút nổi');
  k('A0 nạp được utils/donAppDai.js', !D.loiNap, D.loiNap || '');
  const bay = Date.parse('2026-11-06T10:30:00+07:00');
  const don = (id, tt, gio) => ({ id, tien_trinh: tt, gio });
  const ds = [don(3, 'da_tra', '2026-11-06T10:25:00'), don(2, 'da_tra', '2026-11-06T10:10:00'), don(1, 'dang_lam', '2026-11-06T09:00:00'),
    don(4, 'xong', '2026-11-06T08:00:00'), don('vao_vi:1', 'vao_vi', '2026-11-06T10:20:00')];
  thu('A1 soMoi = số đơn đã trả chưa bấm "Đang làm" (đúng cách đếm của nút nổi cũ); đang làm / xong KHÔNG đếm', () => f(D, 'tomDonApp')(ds, bay).soMoi === 2);
  thu('A2 soViVe = số dòng "vào ví" (tiền về muộn được cộng vào ví)', () => f(D, 'tomDonApp')(ds, bay).soViVe === 1);
  thu('A3 sớm nhất: đơn mới cũ nhất lúc 10:10, bây giờ 10:30 → 20 phút (chỉ tính đơn "mới", không tính đơn đang làm)', () => f(D, 'tomDonApp')(ds, bay).somNhatPhut === 20);
  thu('A4 không có đơn mới → soMoi 0, somNhatPhut null, hienDai false (không hiện gì)', () => {
    const t = f(D, 'tomDonApp')([don(1, 'xong', '2026-11-06T09:00:00'), don(2, 'dang_lam', '2026-11-06T09:30:00')], bay);
    return t.soMoi === 0 && t.somNhatPhut === null && f(D, 'hienDai')(t) === false;
  });
  thu('A5 có đơn mới hoặc tiền về ví → hienDai true (ngay trên ngưỡng 0 / 1 đều hiện)', () => {
    const g = f(D, 'tomDonApp'), h = f(D, 'hienDai');
    return h(g([don(1, 'da_tra', '2026-11-06T10:29:00')], bay)) === true && h(g([don('vao_vi:9', 'vao_vi', '2026-11-06T10:00:00')], bay)) === true;
  });
  thu('A6 giờ lạ / thiếu → somNhatPhut null (không NaN, không âm), vẫn đếm đơn', () => {
    const t = f(D, 'tomDonApp')([don(1, 'da_tra', ''), don(2, 'da_tra', 'xyz')], bay);
    return t.soMoi === 2 && t.somNhatPhut === null;
  });
  thu('A7 đơn có giờ ở TƯƠNG LAI (lệch đồng hồ) → 0 phút, không âm', () => f(D, 'tomDonApp')([don(1, 'da_tra', '2026-11-06T10:40:00')], bay).somNhatPhut === 0);
  thu('A8 danh sách rác (null / không phải mảng) không ném, ra 0', () => { const t = f(D, 'tomDonApp')(null, bay); return t.soMoi === 0 && t.soViVe === 0; });
  thu('A9 chuDai: "N đơn App mới" + (rộng) "đơn sớm nhất X phút trước"; hẹp thì bỏ phần phút', () => {
    const t = { soMoi: 2, soViVe: 0, somNhatPhut: 20 };
    return f(D, 'chuDai')(t, true) === '2 đơn App mới · đơn sớm nhất 20 phút trước' && f(D, 'chuDai')(t, false) === '2 đơn App mới';
  });
  thu('A10 chuDai: có tiền về ví thì nói thêm "N vào ví" (như nút cũ)', () => /1 vào ví/.test(f(D, 'chuDai')({ soMoi: 0, soViVe: 1, somNhatPhut: null }, true)));

  const noi = SX('components', 'DonAppNoi.jsx'), layout = SX('components', 'Layout.jsx');
  k('A11 DonAppNoi.jsx không còn `position: fixed` (nút nổi bỏ)', !/position\s*:\s*['"]fixed['"]/.test(noi));
  const caiDat = (() => { let tat = ''; for (const p of ['components', 'pages']) { const quet = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const x = path.join(d, e.name);
    if (e.isDirectory()) quet(x); else if (/\.jsx?$/.test(e.name) && /DonApp|donApp|Dai/i.test(e.name) && /position\s*:\s*['"]fixed['"]/.test(sach(fs.readFileSync(x, 'utf8')))) tat += x + ' '; } };
    if (fs.existsSync(path.join(SRC, p))) quet(path.join(SRC, p)); } return tat; })();
  k('A12 không file giao diện nào của đơn App / dải dùng `position: fixed`', caiDat === '', caiDat);
  k('A13 Layout.jsx gắn dải đơn App ở ĐẦU <main> (trước ErrorBoundary), không còn <DonAppNoi />', /<main className="main-content">\s*<DaiDonApp/.test(layout) && !/<DonAppNoi\s*\/>/.test(layout), 'main.content: ' + (/<main[^>]*>[\s\S]{0,120}/.exec(layout) || [''])[0].replace(/\s+/g, ' '));
  k('A14 giữ nguyên chuông: DonAppNoi.jsx vẫn xuất keuChuong / mayOQuan / datMayOQuan / TIENG_CHUONG / AM_LUONG_MAC_DINH và hỏi /kh/don-app, cờ "Máy ở quán"',
    ['keuChuong', 'mayOQuan', 'datMayOQuan', 'TIENG_CHUONG', 'AM_LUONG_MAC_DINH'].every((x) => new RegExp('export (const|function) ' + x).test(noi)) && /\/kh\/don-app/.test(noi) && /don_app_chuong_bat/.test(noi) && /KHOA_DA_THAY|don_app_da_thay/.test(noi));
  k('A15 DonApp.jsx + CaiDatChuong.jsx vẫn nhập được từ DonAppNoi (không gãy)', /from '\.\.\/components\/DonAppNoi'/.test(SX('pages', 'DonApp.jsx')) && /from '\.\/DonAppNoi'/.test(SX('components', 'CaiDatChuong.jsx')));
  k('A16 dải có nút "Xem" mở /don-app, và trong luồng trang (không z-index nổi)', /Xem/.test(noi) && /['"]\/don-app['"]/.test(noi) && !/zIndex\s*:\s*9\d\d/.test(noi));

  // ═══ B · menu ══════════════════════════════════════════════════════════
  muc('B · menu có "Đơn App" + số đỏ');
  const quyen = (...ds) => (q) => ds.includes(q);
  const ten = (ds) => ds.map((x) => x.ten);
  const tatCa = quyen('view_reports', 'manage_users', 'approve_refund', 'view_customer_balance');
  const menu = (q) => (M.dungMenu ? M.dungMenu(q) : { mayTinh: [], dienThoai: [] });
  k('B0 nạp được QuanLy/menu.js', !M.loiNap, M.loiNap || '');
  thu('B1 máy tính (đủ quyền): Bán hàng · Hôm nay · Đơn hàng · Đơn App · Khách hàng · Kho · Quản lý ("Đơn App" ngay dưới "Đơn hàng")', () =>
    bang(ten(menu(tatCa).mayTinh), ['Bán hàng', 'Hôm nay', 'Đơn hàng', 'Đơn App', 'Khách hàng', 'Kho', 'Quản lý']));
  thu('B2 "Đơn App" đường dẫn /don-app, KHÔNG đòi quyền (máy chủ chỉ đòi đăng nhập): không quyền gì vẫn có (K5)', () =>
    menu(tatCa).mayTinh.find((x) => x.ten === 'Đơn App')?.to === '/don-app' && ten(menu(quyen()).mayTinh).includes('Đơn App'));
  thu('B3 thanh dưới điện thoại KHÔNG đổi (Bán hàng · Hôm nay · Đơn · Khách · Thêm); "Đơn App" vào bảng Thêm nhờ danh sách máy tính', () =>
    bang(ten(menu(tatCa).dienThoai), ['Bán hàng', 'Hôm nay', 'Đơn', 'Khách', 'Thêm']));
  thu('B4 số đỏ: soDo("/don-app", {donApp: 3}) = 3; 0 hoặc thiếu → 0 (không hiện); mục khác luôn 0', () =>
    f(M, 'soDo')('/don-app', { donApp: 3 }) === 3 && f(M, 'soDo')('/don-app', { donApp: 0 }) === 0 && f(M, 'soDo')('/don-app', {}) === 0 && f(M, 'soDo')('/orders', { donApp: 3 }) === 0 && f(M, 'soDo')('/don-app', { donApp: 1 }) === 1);
  k('B5 Layout.jsx vẽ số đỏ từ soDo (nav + bảng Thêm)', /soDo\(/.test(layout) && /nav-badge/.test(layout));

  // ═══ D · lưới Quản lý ═══════════════════════════════════════════════════
  muc('D · trang Quản lý: ô "Khách và tiền"');
  const luoi = (q) => (M.luoiQuanLy ? M.luoiQuanLy(q) : []);
  const lien = (q) => luoi(q).map((o) => `${o.ten}:${o.loi.map((l) => l.to).join('+')}`);
  thu('D1 đủ quyền: có ô "Khách và tiền" với ba lối Khách hàng và số dư (/customers) · Hoàn tiền (/refunds) · Báo cáo / đối soát (/reports)', () => {
    const o = luoi(tatCa).find((x) => x.ten === 'Khách và tiền');
    return !!o && bang(o.loi.map((l) => [l.ten, l.to]), [['Khách hàng và số dư', '/customers'], ['Hoàn tiền', '/refunds'], ['Báo cáo / đối soát', '/reports']]);
  });
  thu('D2 không quyền gì: ô còn đúng lối /customers (K5 — Khách hàng không đòi quyền); Hoàn tiền + Báo cáo bị ẩn', () => lien(quyen()).includes('Khách và tiền:/customers'));
  thu('D3 chỉ approve_refund: Khách và tiền = /customers + /refunds (không /reports)', () => lien(quyen('approve_refund')).includes('Khách và tiền:/customers+/refunds'));
  thu('D4 chỉ view_reports: Khách và tiền = /customers + /reports', () => lien(quyen('view_reports')).includes('Khách và tiền:/customers+/reports'));
  thu('D5 các ô cũ giữ nguyên (6 ô cũ vẫn đủ, đúng đường dẫn)', () => {
    const l = lien(tatCa);
    return ['Sản phẩm & công thức:/kho', 'Nguyên liệu:/kho', 'Khuyến mãi & thành viên:/discount-codes+/settings', 'Con người:/settings', 'Báo cáo:/reports', 'Cài đặt:/settings+/invoice-settings'].every((x) => l.includes(x)) && l.length === 7;
  });

  // ═══ C · Số dư gộp vào Khách hàng ═══════════════════════════════════════
  muc('C · Số dư gộp vào trang Khách hàng');
  const vi = SX('components', 'ViKhach.jsx'), kh = SX('pages', 'Customers.jsx'), app = SX('App.jsx');
  k('C1 có components/ViKhach.jsx (khu Ví dùng trong chi tiết khách)', CO('client', 'src', 'components', 'ViKhach.jsx'));
  k('C2 Khu Ví có: Số dư · "Lịch sử ví" · "Điều chỉnh" · "Nạp tay (thử)"', ['Lịch sử ví', 'Điều chỉnh', 'Nạp tay (thử)'].every((x) => vi.includes(x)) && /Số dư/.test(vi));
  k('C3 "Điều chỉnh" chỉ khi hasPermission(\'adjust_balance\') (quyền như cũ)', /hasPermission\('adjust_balance'\)/.test(vi));
  k('C4 "Nạp tay (thử)" CHỈ chủ quán: gắn vào user.role === \'owner\'; số dư chỉ khi view_customer_balance', /role\s*===\s*'owner'/.test(vi) && /hasPermission\('view_customer_balance'\)/.test(vi));
  k('C5 khu Ví dùng đúng ba lệnh cũ: walletsApi.topup / adjust / transactions', ['topup', 'adjust', 'transactions'].every((x) => new RegExp('walletsApi\\.' + x).test(vi)));
  k('C6 Customers.jsx gắn ViKhach trong ô chi tiết khách và có ô tổng "Khách đang gửi quán" + cột Số dư', /<ViKhach/.test(kh) && /Khách đang gửi quán/.test(kh) && /<th[^>]*>Số dư<\/th>/.test(kh));
  k('C7 Customers.jsx: tổng gửi quán = tổng balance (cộng số dư), không số cứng', /reduce\(\(\w+, \w+\) => \w+ \+ \(?\w+\.balance/.test(kh) || /totalBalance|tongGui/.test(kh));
  k('C8 menu.js: bỏ lối "Số dư →" (LOI_THEM.customers không còn /balance)', !/['"]\/balance['"]/.test(sach(DOC('client', 'src', 'pages', 'QuanLy', 'menu.js'))));
  k('C9 /balance chuyển về /customers (link cũ không gãy), không còn nhập Balance', /path="balance"\s+element=\{<Navigate to="\/customers" replace \/>\}/.test(app) && !/import Balance/.test(app));
  k('C10 màn Số dư cũ đã gỡ (Balance.jsx không còn — một chỗ làm một việc)', !CO('client', 'src', 'pages', 'Balance.jsx'));
}

async function phanQr() {
  muc('F · thẻ mã QR thương hiệu');
  const Q = await nap('utils', 'veQrThuongHieu.js');
  k('F0 nạp được utils/veQrThuongHieu.js', !Q.loiNap, Q.loiNap || '');
  if (Q.loiNap) return;
  const qrcode = require(path.join(GOC, 'client', 'node_modules', 'qrcode-generator'));
  let jsQR; try { jsQR = require(path.join(GOC, 'client', 'node_modules', 'jsqr')); jsQR = jsQR.default || jsQR; } catch (e) { k('F0b nạp được jsqr', false, e.message); return; }
  const EMV = '00020101021238570010A000000727012700069704220113VQRQAB8PU64820208QRIBFTTA53037045405450005802VN62340830TQDNOV06 HD0016630461AB';
  const ve = Q.veQrThuongHieu(EMV);
  const n = ve.n;
  const goc = qrcode(0, 'H'); goc.addData(EMV, 'Byte'); goc.make();
  thu('F1 mức sửa lỗi H và ma trận GIỐNG HỆT qrcode-generator mức H cùng dữ liệu', () => ve.mucSua === 'H' && n === goc.getModuleCount() &&
    ve.hang.every((hang, r) => hang.every((o, c) => o === goc.isDark(r, c))));
  thu('F2 viền trắng quanh mã ≥ 3 ô (le ≥ 3, khung W = n + 2·le)', () => ve.le >= 3 && ve.W === n + 2 * ve.le);
  const goc4 = (r, c) => ((r + 0.5 < n / 2) ? 't' : 'd') + ((c + 0.5 < n / 2) ? 't' : 'p');
  const MAU = { tt: '#253A6E', tp: '#966923', dt: '#347042', dp: '#B2342C' };
  thu('F3 màu chấm theo 4 phần tư: trên-trái xanh đậm #253A6E · trên-phải vàng kim #966923 · dưới-trái xanh lá #347042 · dưới-phải đỏ #B2342C (MỌI chấm)', () =>
    ve.cham.length > 100 && ve.cham.every((x) => x.mau.toUpperCase() === MAU[goc4(x.r, x.c)]));
  thu('F4 ba ô góc, mỗi ô theo màu góc của nó (trên-trái · trên-phải · dưới-trái); KHÔNG có ô góc dưới-phải', () => {
    const m = Object.fromEntries(ve.oGoc.map((o) => [`${o.r},${o.c}`, o.mau.toUpperCase()]));
    return ve.oGoc.length === 3 && m['0,0'] === MAU.tt && m[`0,${n - 7}`] === MAU.tp && m[`${n - 7},0`] === MAU.dt;
  });
  thu('F5 không chấm nào nằm trong vùng 7×7 của ô góc (ô góc vẽ riêng, tô đặc)', () => ve.cham.every((x) => !((x.r < 7 && x.c < 7) || (x.r < 7 && x.c >= n - 7) || (x.r >= n - 7 && x.c < 7))));
  thu('F6 logo: đường kính ≤ 20 % bề ngang phần mã, nền tròn trắng lớn hơn logo, cả hai tròn ở GIỮA', () =>
    ve.logo.kinhLogo > 0 && ve.logo.kinhLogo <= 0.2 * n && ve.logo.kinhNen > ve.logo.kinhLogo && ve.logo.tam === ve.W / 2);
  thu('F7 không chấm nào nằm dưới nền tròn của logo', () => ve.cham.every((x) => Math.hypot(x.c + ve.le + 0.5 - ve.logo.tam, x.r + ve.le + 0.5 - ve.logo.tam) > ve.logo.kinhNen / 2));
  thu('F8 phần tử chấm là TRÒN (SVG dùng <circle>), ô góc bo tròn tô đặc (<rect rx>), không vẽ lõi rỗng; nền mã TRẮNG kể cả giao diện tối', () => {
    const s = Q.qrThuongHieuSvg(EMV, 'logo.png');
    return /<circle/.test(s) && /<rect[^>]*rx=/.test(s) && /<image[^>]*href="logo\.png"/.test(s) && /<rect[^>]*fill="#fff"/i.test(s) && !/<path[^>]*M\d+ \d+h1v1h-1z/.test(s);
  });
  thu('F9 qrThuongHieuSvg(rỗng) → "" (không vẽ QR chết); chuỗi quá dài → không ném, "" ', () => Q.qrThuongHieuSvg('', 'x') === '' && Q.qrThuongHieuSvg('https://a.vn/?x=' + 'x'.repeat(5000), 'x') === '' && Q.veQrThuongHieu('').n === 0);
  // F10: dựng ảnh từ CHÍNH các phần tử đã tính (chấm tròn, ô góc, nền logo) rồi giải mã bằng jsqr — ở cỡ đầy đủ và thu nhỏ còn 40 %
  const dung = (heSo) => {
    const W = Math.round(ve.W * heSo), px = new Uint8ClampedArray(W * W * 4).fill(255);
    const to = (x, y, d) => { const i = (Math.round(y) * W + Math.round(x)) * 4; if (i >= 0 && i < px.length) { px[i] = px[i + 1] = px[i + 2] = d; } };
    const dia = (cx, cy, r, d) => { for (let y = Math.floor((cy - r) * heSo); y <= Math.ceil((cy + r) * heSo); y++) for (let x = Math.floor((cx - r) * heSo); x <= Math.ceil((cx + r) * heSo); x++) if (Math.hypot(x / heSo - cx, y / heSo - cy) <= r) to(x, y, d); };
    for (const o of ve.cham) dia(o.c + ve.le + 0.5, o.r + ve.le + 0.5, 0.48, 0);
    for (const o of ve.oGoc) {   // vòng ngoài liền (7×7 trừ 5×5) + lõi 3×3 đặc
      for (let y = 0; y < 7 * heSo; y++) for (let x = 0; x < 7 * heSo; x++) {
        const ax = x / heSo, ay = y / heSo, vong = ax < 1 || ax >= 6 || ay < 1 || ay >= 6, loi = ax >= 2 && ax < 5 && ay >= 2 && ay < 5;
        if (vong || loi) to(((o.c + ve.le) * heSo) + x, ((o.r + ve.le) * heSo) + y, 0);
      }
    }
    dia(ve.logo.tam, ve.logo.tam, ve.logo.kinhNen / 2, 255);
    dia(ve.logo.tam, ve.logo.tam, ve.logo.kinhLogo / 2, 90);   // logo tối nhưng nhỏ — không che hơn nền
    return { px, W };
  };
  for (const [heSo, nhan] of [[10, 'cỡ đủ'], [4, 'thu nhỏ còn 40 %']]) {
    thu(`F10 giải mã ra ĐÚNG chuỗi (${nhan})`, () => { const a = dung(heSo); return jsQR(a.px, a.W, a.W)?.data === EMV; });
  }
  thu('F11 chuỗi khác → ma trận khác (hàm thật sự dựng từ dữ liệu, không hình cố định)', () => bang(Q.veQrThuongHieu('abc').hang, Q.veQrThuongHieu('abc').hang) && !bang(Q.veQrThuongHieu('abc').hang, Q.veQrThuongHieu('abd').hang));

  // F12-F15: chỗ HIỆN và chỗ GIỮ NGUYÊN
  const the = SX('components', 'TheQr.jsx'), manQr = SX('pages', 'BanHang', 'ManQr.jsx'), manThu = SX('pages', 'ManKhach', 'ManThu.jsx');
  k('F12 có components/TheQr.jsx dùng veQrThuongHieu + logo trong assets', CO('client', 'src', 'components', 'TheQr.jsx') && /qrThuongHieuSvg/.test(the) && /assets\/logo_TQD_bieu_tuong\.png/.test(the) && CO('client', 'src', 'assets', 'logo_TQD_bieu_tuong.png'));
  k('F13 thẻ: nền kem #FBF3E6, viền vàng kim #B08028, đầu thẻ "Tứ Quý Đường" (đỏ đô #7A1E18) + "Quét mã để thanh toán", dòng dưới mã "<HD> · <nội dung>", KHÔNG dòng chữ cuối thẻ',
    /#FBF3E6/i.test(the) && /#B08028/i.test(the) && /#7A1E18/i.test(the) && /Tứ Quý Đường/.test(the) && /Quét mã để thanh toán/.test(the) && /soHd|dongChan/.test(the) && !/Tiền về sẽ tự|Cảm ơn/.test(the));
  k('F14 ManQr (quầy) + ManThu (màn khách) dùng CHUNG <TheQr> và không còn qrSvg trực tiếp; giữ đồng hồ đếm ngược', /<TheQr/.test(manQr) && /<TheQr/.test(manThu) && !/qrSvg/.test(manQr) && !/qrSvg/.test(manThu) && /dinhDangDemNguoc/.test(manQr) && /dinhDangDemNguoc/.test(manThu));
  k('F15 bill / phiếu IN nhiệt GIỮ mã vuông đen cũ: InvoicePreview vẫn qrSvg (veQr.js), TrangRanh (QR tải App) không đổi', /qrSvg/.test(SX('components', 'InvoicePreview.jsx')) && /qrSvg/.test(SX('pages', 'ManKhach', 'TrangRanh.jsx')) && /qrSvg/.test(SX('utils', 'veQr.js')) && !/veQrThuongHieu|TheQr/.test(SX('components', 'InvoicePreview.jsx')));
  thu('F16 dòng chân thẻ: số HD là từ cuối của nội dung CK ("TQDNOV06 HD0016" → "HD0016 · TQDNOV06 HD0016"); rỗng → rỗng', () => {
    const T = Q.dongChanThe; return typeof T === 'function' && T('TQDNOV06 HD0016') === 'HD0016 · TQDNOV06 HD0016' && T('') === '' && T(undefined) === '';
  });
}

async function phanThat() {
  muc('E · nạp tay chỉ chủ quán (máy chủ thật, kho tạm)');
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  imLang();
  await db.initDatabase();
  const app = express();
  app.use(express.json());
  app.use('/api/pos/wallets', require(path.join(GOC, 'server', 'routes', 'wallets.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();
  const nguoi = async (ten, vai) => Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)", [ten, ten, vai])).lastInsertRowid);
  const chu = Number((await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1")).id);
  const TK = { chu: chu, ql: await nguoi('ql_gd1', 'manager'), nv: await nguoi('nv_gd1', 'staff') };
  const goi = async (id, duong, body) => {
    imLang();
    try {
      const r = await fetch(goc + duong, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt.sign({ userId: id }, KHOA_NV, { expiresIn: '1h' }) }, body: JSON.stringify(body) });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } catch (e) { return { status: 0, error: e.message }; } finally { noiLai(); }
  };
  const nap1 = (id, sdt) => goi(id, '/wallets/topup', { phone: sdt, amount: 100000, customer_name: 'Khách GD1', payment_method: 'cash' });
  const quyen = async (vai) => Number((await db.queryOne("SELECT allowed FROM pos_permissions WHERE role = ? AND permission = 'topup_balance'", [vai]))?.allowed);
  const soDu = async (sdt) => Number((await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [sdt]))?.balance || 0);

  k('E1 kho MỚI: quyền topup_balance = 0 cho manager và staff, = 1 cho owner (seed)', (await quyen('manager')) === 0 && (await quyen('staff')) === 0 && (await quyen('owner')) === 1,
    `manager=${await quyen('manager')} staff=${await quyen('staff')} owner=${await quyen('owner')}`);
  let r = await nap1(TK.ql, '0939000001');
  k('E2 manager gọi POST /wallets/topup → 403, ví không đổi', r.status === 403 && (await soDu('0939000001')) === 0, `HTTP ${r.status}`);
  r = await nap1(TK.nv, '0939000002');
  k('E3 staff gọi POST /wallets/topup → 403, ví không đổi', r.status === 403 && (await soDu('0939000002')) === 0, `HTTP ${r.status}`);
  r = await nap1(TK.chu, '0939000003');
  k('E4 owner vẫn nạp được (K5): 200, số dư 100.000', r.status === 200 && (await soDu('0939000003')) === 100000, `HTTP ${r.status}`);

  // bước 018 trên kho ĐANG CHẠY: dựng lại trạng thái cũ (manager / staff = 1, chưa có dòng bước 18)
  await db.run("UPDATE pos_permissions SET allowed = 1 WHERE permission = 'topup_balance' AND role IN ('manager', 'staff')");
  await db.run('DELETE FROM pos_nang_cap WHERE so = 18');
  await db.run("DROP TABLE IF EXISTS _sao_luu_018_pos_permissions");
  const chay = () => { imLang(); return require(path.join(GOC, 'server', 'nang_cap', 'chay.js')).chayNangCap({ beginTransaction: db.beginTransaction, query: db.query }).finally(noiLai); };
  const kq = await chay();
  k('E5 bước 018 chạy được (không hỏng) và ghi dòng pos_nang_cap số 18', kq.hong === null && Number((await db.queryOne('SELECT COUNT(*) AS n FROM pos_nang_cap WHERE so = 18')).n) === 1, String(kq.hong));
  k('E6 sau 018 trên kho đang chạy: manager = 0, staff = 0, owner vẫn 1', (await quyen('manager')) === 0 && (await quyen('staff')) === 0 && (await quyen('owner')) === 1);
  const ban = await db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_sao_luu_018_pos_permissions'");
  k('E7 bước đổi dữ liệu có SAO LƯU bảng quyền trước khi đổi (_sao_luu_018_pos_permissions, còn nguyên 2 dòng topup = 1)', ban.length === 1 &&
    Number((await db.queryOne("SELECT COUNT(*) AS n FROM _sao_luu_018_pos_permissions WHERE permission = 'topup_balance' AND allowed = 1 AND role IN ('manager', 'staff')")).n) === 2);
  // K5: chủ quán bật lại ở màn Phân quyền → bước 018 KHÔNG chạy lại đè
  await db.run("UPDATE pos_permissions SET allowed = 1 WHERE permission = 'topup_balance' AND role = 'manager'");
  const dongSL = Number((await db.queryOne('SELECT COUNT(*) AS n FROM _sao_luu_018_pos_permissions')).n);
  await chay();
  k('E8 chạy nâng cấp LẦN HAI không đổi gì thêm: quyền chủ quán đã bật lại cho manager vẫn là 1, sao lưu không thêm dòng', (await quyen('manager')) === 1 && Number((await db.queryOne('SELECT COUNT(*) AS n FROM _sao_luu_018_pos_permissions')).n) === dongSL);
  r = await nap1(TK.ql, '0939000004');
  k('E9 chủ quán bật lại cho manager → manager nạp được (K5, màn Phân quyền còn tác dụng)', r.status === 200 && (await soDu('0939000004')) === 100000, `HTTP ${r.status}`);
  r = await nap1(TK.nv, '0939000005');
  k('E10 staff vẫn 403 (chỉ manager được bật lại)', r.status === 403);

  const dd = sach(DOC('server', 'database.js'));
  k('E11 seed trong database.js: topup_balance của manager và staff = 0, của owner = 1', /\['owner', 'topup_balance', 1\]/.test(dd) && /\['staff', 'topup_balance', 0\]/.test(dd) && /\['manager', 'topup_balance', 0\]/.test(dd));
  k('E12 route POST /topup vẫn kiểm quyền topup_balance (không bỏ cổng)', /router\.post\('\/topup', authenticate, checkPermission\('topup_balance'\)/.test(sach(DOC('server', 'routes', 'wallets.js'))));
  sv.close();
}

async function main() {
  await phanThuan();
  await phanQr();
  try { await phanThat(); } catch (e) { noiLai(); k('E (bài sập giữa chừng)', false, e.message); }
  console.log(`\n${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { noiLai(); console.log('BÀI SẬP: ' + (e.stack || e.message)); console.log(`\n${dat} đạt · ${hong + 1} hỏng`); process.exit(2); });
