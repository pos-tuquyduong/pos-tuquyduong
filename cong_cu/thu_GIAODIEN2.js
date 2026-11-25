#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ GIAO-DIEN-2 — Quản lý 6 nhóm + tìm nhanh · mỗi nút mở thẳng đúng màn · gỡ chữ / trang SX · Khách hàng gọn · Hạng thành viên · chữ Thực thu
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (menu.js còn lưới 7 ô BH-2, chưa có timMuc / locKhach / PinChuQuan.jsx, còn chữ SX). Xanh ngay = vô giá trị (K3).
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_GIAODIEN2.js [--goc <thư mục gốc bản sao>]      (in "n đạt · m hỏng")
 *  [A, D2] hàm thuần của client/src (ES module, nạp bằng import()).  [B, C, D1, E, F] cấu trúc nguồn (bỏ chú thích — kiểm mẫu nguy hiểm BIẾN MẤT, E11).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const iG = process.argv.indexOf('--goc');
const GOC = path.resolve(iG > 0 ? process.argv[iG + 1] : path.join(__dirname, '..'));
const SRC = path.join(GOC, 'client', 'src');
const DOC = (...p) => { try { return fs.readFileSync(path.join(GOC, ...p), 'utf8'); } catch { return ''; } };
const CO = (...p) => fs.existsSync(path.join(GOC, ...p));
// bỏ chú thích khối, dòng, và chú thích cuối dòng (đứng sau khoảng trắng / dấu câu — không đụng "https://")
const sach = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/(^|[ \t;,{}()])\/\/.*$/gm, '$1');
const SX = (...p) => sach(DOC('client', 'src', ...p));

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const nap = async (...p) => { try { return await import(pathToFileURL(path.join(SRC, ...p)).href); } catch (e) { return { loiNap: e.message }; } };
const f = (X, ten) => (typeof X[ten] === 'function' ? X[ten] : () => { throw new Error('thiếu hàm ' + ten); });

// Bảng B1 của phiếu: [nhóm, nút, to, quyền]
const BANG = [
  ['Món & giá', 'Món, giá & công thức', '/kho', undefined],
  ['Món & giá', 'Giá bán & nhóm món', '/settings?the=products', 'manage_settings'],
  ['Món & giá', 'Gói nạp tiền', '/settings?the=goiNap', 'manage_products'],
  ['Khách & thẻ', 'Danh sách khách', '/customers', undefined],
  ['Khách & thẻ', 'Hạng thành viên', '/settings?the=tiers', 'manage_promotions'],
  ['Khách & thẻ', 'Điểm & quà', '/settings?the=loyalty', 'manage_settings'],
  ['Khuyến mãi', 'Mã giảm giá', '/discount-codes', 'manage_users'],
  ['Khuyến mãi', 'Giờ vàng', '/settings?the=flash', 'manage_settings'],
  ['Khuyến mãi', 'Chương trình', '/settings?the=chuongTrinh', 'manage_promotions'],
  ['Khuyến mãi', 'Quảng cáo trên App', '/settings?the=quangCao', 'manage_settings'],
  ['Tiền & báo cáo', 'Đối soát tiền', '/reports?tab=doisoat', 'view_reports'],
  ['Tiền & báo cáo', 'Hoàn tiền', '/refunds', 'approve_refund'],
  ['Tiền & báo cáo', 'Báo cáo doanh thu', '/reports', 'view_reports'],
  ['Nhân viên', 'Tài khoản nhân viên', '/settings?the=users', 'manage_users'],
  ['Nhân viên', 'Ai được làm gì', '/settings?the=permissions', 'manage_permissions'],
  ['Cài đặt quán', 'Giờ mở cửa', '/settings?the=gioHoatDong', 'manage_settings'],
  ['Cài đặt quán', 'Giao hàng', '/settings?the=giaoHang', 'manage_settings'],
  ['Cài đặt quán', 'In bill & tem', '/invoice-settings', 'manage_users'],
  ['Cài đặt quán', 'In phiếu kho', '/settings?the=inPhieu', 'manage_settings'],
  ['Cài đặt quán', 'Màn khách', '/settings?the=manKhach', 'manage_settings'],
  ['Cài đặt quán', 'PIN chủ quán', '/settings?the=pin', 'chi_chu_quan'],
  ['Cài đặt quán', 'Sao lưu', '/settings?the=backup', 'export_data'],
  ['Cài đặt quán', 'App khách hàng', '/settings?the=appKh', 'chi_chu_quan'],
];
const NHOM_TEN = ['Món & giá', 'Khách & thẻ', 'Khuyến mãi', 'Tiền & báo cáo', 'Nhân viên', 'Cài đặt quán'];
const tatCa = () => true;                                     // chủ quán: mọi quyền
const khongQuyen = () => false;                               // nhân viên thường
const chiQuyen = (...ds) => (q) => ds.includes(q);           // quản lý: một số quyền
const tenNut = (luoi) => luoi.flatMap((g) => (g.nut || []).map((n) => n.ten));
const QUAN_LY = chiQuyen('manage_settings', 'manage_promotions', 'manage_products', 'view_reports', 'approve_refund', 'manage_users', 'manage_permissions', 'export_data');

function lay(nguon, ten, DAMAGE_ACTIONS) {   // lấy chuỗi `const <ten> = {...};` từ nguồn và chạy thành object (nhãn thuần)
  const m = new RegExp(`const ${ten} = (\\{[^;]*\\});`).exec(nguon);
  if (!m) return null;
  try { return new Function('DAMAGE_ACTIONS', `return (${m[1]})`)(DAMAGE_ACTIONS); } catch { return null; }
}
function khoiMedia(css, dieuKien) {   // nội dung MỌI khối `@media (...) { ... }` khớp, nối lại (đếm ngoặc)
  let ra = '', i = css.indexOf(dieuKien);
  while (i >= 0) {
    const a = css.indexOf('{', i);
    let sau = 1, j = a + 1;
    while (j < css.length && sau > 0) { if (css[j] === '{') sau++; else if (css[j] === '}') sau--; j++; }
    ra += css.slice(a + 1, j - 1) + '\n';
    i = css.indexOf(dieuKien, j);
  }
  return ra;
}

async function main() {
  const M = await nap('pages', 'QuanLy', 'menu.js');
  const L = await nap('pages', 'QuanLy', 'locKhach.js');

  // ═══ A · Quản lý: 6 nhóm + tìm nhanh ═══════════════════════════════════
  muc('A1 · 6 nhóm đúng tên / thứ tự / nút; ẩn theo quyền');
  k('A0 nạp được QuanLy/menu.js', !M.loiNap, M.loiNap || '');
  const luoi = (q) => f(M, 'luoiQuanLy')(q);
  let day = [];
  try { day = luoi(tatCa); } catch (e) { k('A1a luoiQuanLy(chủ quán) chạy được', false, e.message); }
  k('A1b đúng 6 nhóm, đúng tên và thứ tự M1', bang(day.map((g) => g.ten), NHOM_TEN), JSON.stringify(day.map((g) => g.ten)));
  k('A1c đúng số nút, đúng tên + thứ tự từng nhóm (bảng B1 + 2 nút phiếu thêm)', bang(day.map((g) => (g.nut || []).map((n) => n.ten)),
    NHOM_TEN.map((t) => BANG.filter((b) => b[0] === t).map((b) => b[1]))));
  const nutPhang = day.flatMap((g) => g.nut || []);
  for (const [, ten, to, quyen] of BANG) {
    const n = nutPhang.find((x) => x.ten === ten);
    k(`B1 nút "${ten}" → ${to} · quyền ${quyen || '(không)'}`, !!n && n.to === to && n.quyen === quyen && Array.isArray(n.tuKhoa) && n.tuKhoa.length > 0, JSON.stringify(n));
  }
  k('A1d nhân viên thường: chỉ còn nút không đòi quyền (Món giá công thức, Danh sách khách), nhóm hết nút bị ẩn',
    bang(tenNut(luoi(khongQuyen)), ['Món, giá & công thức', 'Danh sách khách']) && bang(luoi(khongQuyen).map((g) => g.ten), ['Món & giá', 'Khách & thẻ']));
  const ql = tenNut(luoi(QUAN_LY));
  k('A1e quản lý: thấy nút theo quyền, KHÔNG thấy PIN chủ quán / App khách hàng (chỉ chủ quán)', ql.includes('Giờ mở cửa') && ql.includes('Hoàn tiền') && !ql.includes('PIN chủ quán') && !ql.includes('App khách hàng'), ql.join('|'));
  k('A1f chủ quán thấy cả PIN chủ quán + App khách hàng', tenNut(day).includes('PIN chủ quán') && tenNut(day).includes('App khách hàng'));
  k('A1g quản lý không có view_reports → nhóm Tiền & báo cáo chỉ còn Hoàn tiền; không approve_refund nữa thì ẩn cả nhóm',
    bang(tenNut(luoi(chiQuyen('approve_refund'))).filter((t) => ['Đối soát tiền', 'Hoàn tiền', 'Báo cáo doanh thu'].includes(t)), ['Hoàn tiền']) &&
    !luoi(chiQuyen('manage_settings')).some((g) => g.ten === 'Tiền & báo cáo'));
  k('A1h B3: không nút nào trỏ /settings trần (mọi nút mở thẳng đúng màn)', nutPhang.length > 0 && nutPhang.every((n) => n.to !== '/settings'));

  muc('A2 · timMuc (không dấu, không phân biệt hoa thường, Enter khi còn đúng 1 nút)');
  const tim = (c, q = tatCa) => { try { return f(M, 'timMuc')(c, q); } catch (e) { return []; } };
  const ten = (c, q) => tenNut(tim(c, q));
  k('A2a "pin" → chỉ PIN chủ quán', bang(ten('pin'), ['PIN chủ quán']), ten('pin').join('|'));
  k('A2b "gio mo cua" → Giờ mở cửa', bang(ten('gio mo cua'), ['Giờ mở cửa']), ten('gio mo cua').join('|'));
  k('A2c "hang vang" và "kim cuong" → Hạng thành viên', bang(ten('hang vang'), ['Hạng thành viên']) && bang(ten('kim cuong'), ['Hạng thành viên']));
  k('A2d "may in" → In bill & tem + In phiếu kho', bang(ten('may in').sort(), ['In bill & tem', 'In phiếu kho'].sort()), ten('may in').join('|'));
  k('A2e "vi" và "so du" → có Danh sách khách', ten('vi').includes('Danh sách khách') && ten('so du').includes('Danh sách khách'));
  k('A2f "nhan vien" → Tài khoản nhân viên', ten('nhan vien').includes('Tài khoản nhân viên'));
  k('A2g có dấu + hoa thường như nhau: "PIN", "Giờ Mở Cửa", "HẠNG VÀNG"', bang(ten('PIN'), ten('pin')) && bang(ten('Giờ Mở Cửa'), ten('gio mo cua')) && bang(ten('HẠNG VÀNG'), ten('hang vang')));
  k('A2h rỗng / chỉ khoảng trắng → đủ 6 nhóm', bang(tim('', tatCa).map((g) => g.ten), NHOM_TEN) && bang(tim('   ', tatCa).map((g) => g.ten), NHOM_TEN));
  k('A2i không khớp → danh sách rỗng', bang(tim('zzzqqq', tatCa), []));
  k('A2j kết quả lọc giữ cả quyền: quản lý gõ "pin" → không thấy gì', bang(ten('pin', QUAN_LY), []) && bang(ten('gio', QUAN_LY).sort(), ['Giờ mở cửa', 'Giờ vàng'].sort()), ten('gio', QUAN_LY).join('|'));
  k('A2k kết quả giữ dạng nhóm (có `ten` nhóm + `nut`) — lưới chỉ còn nút khớp', (() => { const r = tim('pin'); return Array.isArray(r) && r.length === 1 && r[0].ten === 'Cài đặt quán' && r[0].nut.length === 1; })());
  const dn = (c) => { try { return f(M, 'nutDuyNhat')(tim(c)); } catch (e) { return 'LỖI ' + e.message; } };
  k('A2l Enter: còn đúng 1 nút → trả nút đó; còn 2+ hoặc 0 → null', dn('pin')?.ten === 'PIN chủ quán' && dn('gio') === null && dn('zzzqqq') === null && dn('') === null, JSON.stringify(dn('pin')));

  muc('A3 · A4 · trang Quản lý một nguồn, điện thoại, ô Dọn dữ liệu thử');
  const ql_jsx = SX('pages', 'QuanLy', 'QuanLy.jsx');
  k('A3a QuanLy.jsx vẽ từ luoiQuanLy + timMuc của menu.js (không danh sách thứ hai)', /timMuc\(chuoi, hasPermission\)/.test(ql_jsx) && /\bnutDuyNhat\(nhom\)/.test(ql_jsx).test(ql_jsx) && /from '\.\/menu'/.test(ql_jsx) && !/Giờ mở cửa|Hạng thành viên|Tài khoản nhân viên/.test(ql_jsx));
  k('A3b có ô tìm với gợi ý "Tìm nhanh một mục cài đặt" + bắt Enter', /Tìm nhanh một mục cài đặt/.test(DOC('client', 'src', 'pages', 'QuanLy', 'QuanLy.jsx')) && /Enter/.test(ql_jsx));
  const css = DOC('client', 'src', 'index.css');
  const m768 = khoiMedia(css, '@media (max-width: 768px)');
  k('A3c index.css: lưới Quản lý 3 cột ở máy tính', /\.ql-luoi\s*\{[^}]*repeat\(3/.test(css));
  k('A3d index.css: trong @media (max-width: 768px) lưới đổi thành danh sách 1 cột, dòng cao ≥ 52px', /\.ql-luoi\s*\{[^}]*grid-template-columns:\s*1fr\s*;/.test(m768) && /\.ql-nut[^{]*\{[^}]*min-height:\s*(5[2-9]|[6-9]\d)px/.test(m768));
  k('A4a ô "Dọn dữ liệu thử" còn, chỉ owner, trỏ /don-thu', /Dọn dữ liệu thử/.test(ql_jsx) && /role === 'owner'/.test(ql_jsx) && /\/don-thu/.test(ql_jsx));
  k('A4b ô đó NẰM NGOÀI 6 nhóm (menu.js không có)', !/Dọn dữ liệu thử|don-thu/.test(SX('pages', 'QuanLy', 'menu.js')));

  // ═══ B · mở thẳng đúng màn ══════════════════════════════════════════════
  muc('B1 · mỗi `to` là route có thật, mỗi ?the= là thẻ có thật + đúng quyền');
  const app = SX('App.jsx');
  const st = SX('pages', 'Settings.jsx');
  const rep = SX('pages', 'Reports.jsx');
  const quyenThe = {};
  for (const m of st.matchAll(/\['([A-Za-z]+)',\s*'([a-z_]+)'\]/g)) quyenThe[m[1]] = m[2];
  const duongApp = new Set([...app.matchAll(/<Route\s+(?:index|path="([^"]*)")/g)].map((m) => '/' + (m[1] || '')));
  for (const [, ten, to, quyen] of BANG) {
    const [duong, truyVan] = to.split('?');
    const theM = /the=(\w+)/.exec(truyVan || '');
    const ok = duongApp.has(duong) && (!theM || (quyenThe[theM[1]] === quyen && new RegExp(`tab === '${theM[1]}'`).test(st)));
    k(`B1 "${ten}": route ${duong} có trong App.jsx${theM ? ` · thẻ ${theM[1]} có trong Settings, quyền thẻ = ${quyen}` : ''}`, ok, theM ? `quyền thẻ=${quyenThe[theM[1]]}` : '');
  }
  k('B1a Settings.jsx đọc ?the= (useSearchParams + get(\'the\')) và có chế độ thẻ riêng "← Quản lý"', /useSearchParams/.test(st) && /\.get\('the'\)/.test(st) && /← Quản lý/.test(st) && /to="\/quan-ly"/.test(st));
  k('B1b không có ?the= → đường cũ /settings còn nguyên: vẫn có hàng nhóm (NHOM_THE) và tiêu đề Cài đặt', /nhomHienDuoc\.map/.test(st) && /Cài đặt/.test(st));
  k('B1c thẻ packages (tạm ngưng) KHÔNG xoá: vẫn có `tab === \'packages\'` trong Settings, không nút nào trỏ tới', /tab === 'packages'/.test(st) && !BANG.some((b) => /the=packages/.test(b[2])));
  k('B1d Điểm & quà: trên màn có lối sang rewards + signup (moThe)', /moThe\(t\)/.test(st) && /\['rewards', '[^']*', 'manage_promotions'\]/.test(st) && /\['signup', '[^']*', 'manage_settings'\]/.test(st));
  k('B1e Reports.jsx nhận ?tab=doisoat (mặc định vẫn daily)', /doisoat[^\n]*searchParams\.get\('tab'\)/.test(rep) && /'daily'/.test(rep));
  muc('B2 · B4');
  k('B2 nút tạm "Giá bán & nhóm món" ngay dưới "Món, giá & công thức"; đầu thẻ products có câu hướng dẫn', (() => {
    const ds = tenNut(day); const i = ds.indexOf('Món, giá & công thức');
    return i >= 0 && ds[i + 1] === 'Giá bán & nhóm món';
  })() && /Giá sửa ở Kho › Sản phẩm; ở đây chỉnh nhóm đặc biệt và món tặng khách mới/.test(DOC('client', 'src', 'pages', 'Settings.jsx')));
  const pin = SX('pages', 'CaiDat', 'PinChuQuan.jsx');
  const hang = SX('pages', 'CaiDat', 'HangThe.jsx');
  k('B4a PinChuQuan.jsx có, gọi hangApi.datPin + hangApi.coPin, chỉ chủ quán đặt (role owner)', CO('client', 'src', 'pages', 'CaiDat', 'PinChuQuan.jsx') && /hangApi\.datPin\(/.test(pin) && /hangApi\.coPin\(/.test(pin) && /role === 'owner'/.test(pin));
  k('B4b HangThe.jsx không còn đặt / đổi PIN (không datPin, không ô mật khẩu đăng nhập) mà còn dòng "Đặt / đổi PIN chủ quán ›" trỏ ?the=pin', !/datPin/.test(hang) && !/Mật khẩu đăng nhập/.test(hang) && /Đặt \/ đổi PIN chủ quán ›/.test(hang) && /the=pin/.test(hang));
  k('B4c Settings.jsx mở PinChuQuan ở thẻ `pin`', /import PinChuQuan/.test(st) && /tab === 'pin'[^]*?<PinChuQuan/.test(st));
  k('B4d HangThe vẫn hỏi PIN khi lưu (HoiPin + hangApi.luu) — không đổi cách lưu (E2)', /<HoiPin/.test(hang) && /hangApi\.luu\(/.test(hang) && /hangApi\.xoa\(/.test(hang));

  // ═══ C · gỡ SX ═══════════════════════════════════════════════════════════
  muc('C1 · Customers.jsx hết chữ / thẻ đồng bộ SX');
  const cu = SX('pages', 'Customers.jsx');
  k('C1a hết "đồng bộ", "Gói đăng ký", "Gói đang dùng", "Ghi chú SX", "hệ thống SX", cờ is_synced / is_pending', !/đồng bộ|Gói đăng ký|Gói đang dùng|Ghi chú SX|hệ thống SX|is_synced|is_pending|\bSX\b/.test(cu));
  k('C1b câu sau khi thêm khách: "Đã thêm khách <tên>." (giữ phần voucher), vẫn gọi registrationsApi.create (K5)', /Đã thêm khách \$\{[^}]+\}\.\$\{phat\}/.test(cu) && /registrationsApi\.create\(/.test(cu));
  k('C1c "Ghi chú:" thay "Ghi chú SX:"; câu khách chưa có SĐT mới', /Ghi chú: \{/.test(cu) && /Khách chưa có SĐT — sửa thông tin khách để thêm SĐT trước/.test(cu));
  k('C1d chú thích đầu file không còn nói "khách từ SX"', !/từ SX|\bSX\b/.test((DOC('client', 'src', 'pages', 'Customers.jsx').match(/^\/\*\*[\s\S]*?\*\//) || [''])[0]));
  muc('C2 · Orders.jsx');
  const od = SX('pages', 'Orders.jsx');
  const hanhDong = lay(od, 'DAMAGE_ACTIONS'), nhanCu = lay(od, 'NHAN_XU_LY_CU', hanhDong);
  k('C2a ô chọn (DAMAGE_ACTIONS) không còn return_stock', !!hanhDong && !('return_stock' in hanhDong) && 'refund' in hanhDong && 'none' in hanhDong, JSON.stringify(hanhDong));
  k('C2b nhãn dòng cũ: NHAN_XU_LY_CU.return_stock = "Hoàn kho (cũ)", giữ refund / none (K5 dữ liệu cũ)', !!nhanCu && nhanCu.return_stock === 'Hoàn kho (cũ)' && nhanCu.refund === 'Hoàn tiền' && nhanCu.none === 'Chỉ ghi nhận', JSON.stringify(nhanCu));
  k('C2c bảng báo hỏng đọc nhãn từ NHAN_XU_LY_CU, ô chọn vẫn từ DAMAGE_ACTIONS', /NHAN_XU_LY_CU\[d\.action\]/.test(od) && /Object\.entries\(DAMAGE_ACTIONS\)/.test(od));
  k('C2d câu huỷ đơn: "Trả lại kho (các món trong đơn)", hết "Hoàn tồn kho SX"', /Trả lại kho \(các món trong đơn\)/.test(od) && !/Hoàn tồn kho SX|Hoàn kho SX/.test(od));
  muc('C3 · C4 · C5');
  k('C3a xoá pages/Registrations.jsx và components/CustomerInput.jsx', !CO('client', 'src', 'pages', 'Registrations.jsx') && !CO('client', 'src', 'components', 'CustomerInput.jsx'));
  k('C3b App.jsx: /registrations và /sync → <Navigate to="/customers" replace />, không import Registrations', /path="registrations" element=\{<Navigate to="\/customers" replace \/>\}/.test(app) && /path="sync" element=\{<Navigate to="\/customers" replace \/>\}/.test(app) && !/Registrations/.test(app));
  k('C3c không file nào import Registrations / CustomerInput', (() => {
    const ds = [];
    const di = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) di(p); else if (/\.(jsx?|mjs)$/.test(e.name)) ds.push(p); } };
    di(SRC);
    return ds.every((p) => !/from '[^']*\/(Registrations|CustomerInput)'/.test(fs.readFileSync(p, 'utf8')));
  })());
  const quet = [];
  const di2 = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) di2(p); else if (/\.(jsx?|mjs)$/.test(e.name)) quet.push(p); } };
  di2(SRC);
  const conSX = quet.filter((p) => { const r = path.relative(SRC, p).replace(/\\/g, '/'); return !r.startsWith('pages/Kho/') && r !== 'pages/BanHang/tinh.js'; })
    .flatMap((p) => sach(fs.readFileSync(p, 'utf8')).split('\n').filter((l) => /\bSX\b/.test(l)).map((l) => path.relative(SRC, p) + ': ' + l.trim().slice(0, 60)));
  k('C4 mã còn chữ SX (ngoài chú thích, Kho/ và BanHang/tinh.js) = 0', conSX.length === 0, conSX.join(' || '));
  const apiJs = DOC('client', 'src', 'utils', 'api.js');
  const kh = (/export const registrationsApi = \{[\s\S]*?\n\};/.exec(apiJs) || [''])[0];
  k('C5 registrationsApi: còn create (Customers dùng), hết exportCsv / confirmExport / revert / getLogs', /create:/.test(kh) && !/exportCsv|confirmExport|revert|getLogs/.test(kh), kh.slice(0, 80));

  // ═══ D · Khách hàng gọn ═════════════════════════════════════════════════
  muc('D2 · hàm lọc thuần (ca biên)');
  k('D0 nạp được QuanLy/locKhach.js', !L.loiNap, L.loiNap || '');
  const loc = (ds, o) => { try { return f(L, 'locKhach')(ds, o).map((c) => c.phone); } catch (e) { return ['LỖI ' + e.message]; } };
  const hang_ = (status, ten_ = 'Vàng') => ({ tier_id: 1, tier_name: ten_, status });
  const DS = [
    { phone: '01', name: 'An', balance: 5000, ngay_sinh: '1990-12-01', membership: hang_('active') },
    { phone: '02', name: 'Bình', balance: 0, ngay_sinh: null, membership: null },
    { phone: '03', name: 'Chi', balance: 0, ngay_sinh: '1991-01-31', membership: hang_('expired') },
    { phone: '04', name: 'Dũng', ngay_sinh: '', membership: hang_('expiring_soon') },
    { phone: '05', name: 'Hà', balance: -200, ngay_sinh: '2000-12-31', membership: { tier_id: null, tier_name: null, status: 'none' } },
  ];
  k('D2a Tất cả → đủ 5', bang(loc(DS, { loc: 'all', homNay: '2026-11-25' }), ['01', '02', '03', '04', '05']));
  k('D2b Có số dư = balance > 0 (0, âm, thiếu → không)', bang(loc(DS, { loc: 'co_so_du', homNay: '2026-11-25' }), ['01']), loc(DS, { loc: 'co_so_du', homNay: '2026-11-25' }).join());
  k('D2c Có hạng = còn hạn (active, expiring_soon); hết hạn hôm qua / none / null → không', bang(loc(DS, { loc: 'co_hang', homNay: '2026-11-25' }), ['01', '04']), loc(DS, { loc: 'co_hang', homNay: '2026-11-25' }).join());
  k('D2d Sinh nhật tháng 12: 01-12 và 31-12 vào; ngày sinh trống / tháng 1 không', bang(loc(DS, { loc: 'sinh_nhat', homNay: '2026-12-15' }), ['01', '05']), loc(DS, { loc: 'sinh_nhat', homNay: '2026-12-15' }).join());
  k('D2e Sinh nhật tháng 1 (qua năm): chỉ 31-01', bang(loc(DS, { loc: 'sinh_nhat', homNay: '2027-01-01' }), ['03']), loc(DS, { loc: 'sinh_nhat', homNay: '2027-01-01' }).join());
  k('D2f Sinh nhật tháng 11: không ai (ngày sinh trống không lọt)', bang(loc(DS, { loc: 'sinh_nhat', homNay: '2026-11-25' }), []));
  k('D2g tìm theo tên hoặc SĐT, hoa thường như nhau, cộng với chip', bang(loc(DS, { tim: 'BÌNH', loc: 'all', homNay: '2026-11-25' }), ['02']) && bang(loc(DS, { tim: '04', loc: 'all', homNay: '2026-11-25' }), ['04']) && bang(loc(DS, { tim: 'an', loc: 'co_so_du', homNay: '2026-11-25' }), ['01']));
  k('D2h không truyền gì → tất cả (mặc định là hành vi)', bang(loc(DS, {}), ['01', '02', '03', '04', '05']) && bang(loc(DS), ['01', '02', '03', '04', '05']));
  k('D2i danh sách chip: Tất cả · Có số dư · Có hạng · Sinh nhật tháng này', bang((L.BO_LOC || []).map((x) => x[1]), ['Tất cả', 'Có số dư', 'Có hạng', 'Sinh nhật tháng này']));
  muc('D1 · D3 · bố cục');
  k('D1a Customers.jsx dùng locKhach + ngayVN (hôm nay giờ VN) — không new Date() để lấy tháng', /locKhach/.test(cu) && /ngayVN\(\)/.test(cu) && !/new Date\(\)\.getMonth/.test(cu));
  k('D1b hai cột từ 1024px (matchMedia), điện thoại: chi tiết toàn màn + "← Khách hàng" + Back qua ?khach=', /min-width: 1024px/.test(cu) && /← Khách hàng/.test(cu) && /get\('khach'\)/.test(cu));
  k('D1c /customers?phone=<SĐT> (GOI-1) vẫn mở đúng khách', /get\('phone'\)/.test(cu));
  k('D3a 3 ô Số dư · Điểm · Hạng + "hết hạn"', /Số dư/.test(cu) && /Điểm/.test(cu) && /Hạng/.test(cu) && /hết hạn/.test(cu));
  k('D3b nút Nạp tiền · Sửa thông tin · Thêm… và hai tab Đơn gần đây | Voucher', /Nạp tiền/.test(cu) && /Sửa thông tin/.test(cu) && /Thêm…/.test(cu) && /Đơn gần đây/.test(cu) && /Voucher/.test(cu));
  k('D3c không khối nào biến mất: ViKhach · CapHang · MaDangNhapApp · ngày sinh CT-1a (luuNgaySinh) · đổi quà (doRedeem) · ghi chú + địa chỉ (handleSaveDetail) · người thân', /<ViKhach/.test(cu) && /<CapHang/.test(cu) && /<MaDangNhapApp/.test(cu) && /luuNgaySinh/.test(cu) && /doRedeem/.test(cu) && /handleSaveDetail/.test(cu) && /parent_name/.test(cu));
  k('D3d tab Đơn gần đây đọc qua ordersApi.list({ customer_phone }) — đường có sẵn, không fetch trần mới', /ordersApi\.list\(\{[^}]*customer_phone/.test(cu) && (cu.match(/\bfetch\s*\(/g) || []).length <= 2, String((cu.match(/\bfetch\s*\(/g) || []).length));
  k('D4 không có nút "Bán cho khách này" (làm ở TOPPING-1)', !/Bán cho khách này/.test(cu));

  // ═══ E · Hạng thành viên ═════════════════════════════════════════════════
  muc('E1 · bố cục hạng');
  k('E1a HangThe: một hạng mở để sửa (dangSua), hạng khác thu gọn + nút "Sửa", "+ Thêm hạng" ở cuối', /dangSua/.test(hang) && />Sửa</.test(hang) && /\+ Thêm hạng/.test(hang) && /· đang sửa/.test(hang));
  k('E1b sửa hạng khác khi còn thay đổi chưa lưu → hỏi (window.confirm) như doiThe', /if \(coDoi && !window\.confirm\([^\n]*chưa lưu/.test(hang) && /const moHangKhac = async \(khoa\) =>/.test(hang) && /onClick=\{\(\) => moHangKhac\(h\.khoa\)\}/.test(hang));
  k('E1c hai nút chọn "Mua ở quầy / trên App" | "Chỉ chủ quán cấp"; gói: ☐ Đang bán; "+ Thêm gói"', /Mua ở quầy \/ trên App/.test(hang) && /Chỉ chủ quán cấp/.test(hang) && /Đang bán/.test(hang) && /\+ Thêm gói/.test(hang));
  k('E1d mọi trường hạng GIỮ: tên, thứ bậc ▲▼, % giảm thường / đặc biệt, quyền lợi, làm tròn giá, xoá hạng', /Tên hạng/.test(hang) && /Lên bậc/.test(hang) && /special_discount_percent/.test(hang) && /quyen_loi/.test(hang) && /Làm tròn giá/.test(hang) && /xoa\(/.test(hang));
  k('E1e thanh dính đáy: dùng ThanhLuu sẵn có (phiếu E1) + useThayDoi, nút Lưu vẫn khoá khi đang lưu', /<ThanhLuu id="hang-the"/.test(hang) && /useThayDoi/.test(hang) && /onClick=\{batLuu\} disabled=\{dangLuu\}/.test(hang));
  k('E2 cách lưu / API / PIN không đổi: hangApi.luu có pin, hangApi.xoa có pin, ds + lamTron cùng một lần lưu', /hangApi\.luu\(\{[\s\S]*pin: pinLuu/.test(hang) && /hangApi\.xoa\(h\.id, pinSua\)/.test(hang));

  // ═══ F · chữ Thực thu ════════════════════════════════════════════════════
  muc('F1 · Reports.jsx');
  k('F1 dưới ô Thực thu: "= tiền thật vào quán (gồm tiền khách nạp, đã trừ hoàn) — khớp tab Đối soát"; hết câu cũ', /= tiền thật vào quán \(gồm tiền khách nạp, đã trừ hoàn\) — khớp tab Đối soát/.test(rep) && !/tiền mặt \+ chuyển khoản thật nhận/.test(rep));

  // ═══ G · nối vào bộ kiểm ═════════════════════════════════════════════════
  muc('G3 · kiem_tra_truoc_khi_giao.js');
  k("G3 có chayBaiThat('cong_cu/thu_GIAODIEN2.js')", /chayBaiThat\('cong_cu\/thu_GIAODIEN2\.js'\)/.test(DOC('kiem_tra_truoc_khi_giao.js')));

  console.log(`\n${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { console.log('BÀI SẬP: ' + (e.stack || e.message)); console.log(`\n${dat} đạt · ${hong + 1} hỏng`); process.exit(2); });
