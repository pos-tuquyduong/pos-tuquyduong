#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ BAO-1a — thông báo nổi chung cho mọi màn ngoài Cài đặt
 * ═══════════════════════════════════════════════════════════════════════════
 *  PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có ThongBao.jsx, Layout chưa gắn, còn alert( ở Orders / Refunds / InvoicePrint).
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_BAO1a.js [--goc <thư mục gốc bản sao>]      (in "n đạt · m hỏng")
 *  [A] kho thông báo thuần (components/thongBaoKho.js, nạp bằng import()): xanh tự ẩn, đỏ KHÔNG tự ẩn, tối đa 3, nút đóng.
 *  [B] thành phần ThongBao.jsx: role status / alert, nút đóng ≥ 44px, nổi cố định; Layout gắn MỘT lần.
 *  [C] lyDoLoi: lấy câu máy chủ; không có / chữ kỹ thuật → câu chung.
 *  [D] bánh cóc `alert(` trong client/src; màn đã rà không còn alert( và nối ThongBao.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const iG = process.argv.indexOf('--goc');
const GOC = path.resolve(iG > 0 ? process.argv[iG + 1] : path.join(__dirname, '..'));
const SRC = path.join(GOC, 'client', 'src');
const DOC = (...p) => { try { return fs.readFileSync(path.join(SRC, ...p), 'utf8'); } catch { return ''; } };
const sach = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const SX = (...p) => sach(DOC(...p));

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const doi = (ms) => new Promise((r) => setTimeout(r, ms));

// Bánh cóc: số `alert(` còn lại trong client/src (chỉ được giảm; đã dọn hết ngoài Cài đặt).
const NGUONG_ALERT = 0;
// Màn đã rà BAO-1a: nối ThongBao, không còn alert(.
const MAN_DA_RA = [
  'pages/Orders.jsx', 'pages/Refunds.jsx', 'components/InvoicePrint.jsx', 'pages/Sales.jsx', 'pages/Customers.jsx', 'pages/DonApp.jsx',
  'pages/DonThu.jsx', 'pages/Registrations.jsx', 'pages/DiscountCodes.jsx', 'pages/InvoiceSettings.jsx', 'pages/Reports.jsx',
  'pages/GiaoHang/index.jsx', 'components/ViKhach.jsx', 'components/CapHang.jsx', 'components/DoiSoat.jsx', 'components/ThongTinMon.jsx',
  'components/MaDangNhapApp.jsx', 'components/CustomerSearch.jsx', 'components/Layout.jsx',
  'pages/Kho/DatHang.jsx', 'pages/Kho/DinhMuc.jsx', 'pages/Kho/NguyenLieu.jsx', 'pages/Kho/NhanHang.jsx', 'pages/Kho/NhapSx.jsx',
  'pages/Kho/PhaChe.jsx', 'pages/Kho/PhatSinh.jsx', 'pages/Kho/SanPham.jsx', 'pages/Kho/XemPhieu.jsx',
];
// Nút ghi phải khoá khi đang xử lý (D): file → cờ đang xử lý phải có và phải đi kèm disabled.
const KHOA_NUT = {
  'pages/DiscountCodes.jsx': 'dangXuLy', 'pages/Registrations.jsx': 'dangXuLy', 'pages/Reports.jsx': 'dangKetThuc',
  'pages/Kho/DinhMuc.jsx': 'dang', 'pages/Kho/NguyenLieu.jsx': 'dang', 'pages/Kho/SanPham.jsx': 'dang',
  'pages/Orders.jsx': 'deleting', 'pages/Customers.jsx': 'submitting', 'pages/DonThu.jsx': 'dangChay', 'pages/DonApp.jsx': 'dangBam',
  'components/CapHang.jsx': 'dangGui', 'components/ViKhach.jsx': 'dang', 'pages/Kho/XemPhieu.jsx': 'dangGhi',
};

function duyet(thuMuc, ra = []) {
  for (const e of fs.readdirSync(thuMuc, { withFileTypes: true })) {
    const f = path.join(thuMuc, e.name);
    if (e.isDirectory()) duyet(f, ra); else if (/\.jsx?$/.test(e.name)) ra.push(f);
  }
  return ra;
}

(async () => {
  let T;
  try { T = await import(pathToFileURL(path.join(SRC, 'components', 'thongBaoKho.js')).href); } catch (e) { T = { loiNap: e.message }; }

  muc('A · kho thông báo');
  k('A0 nạp được components/thongBaoKho.js', !T.loiNap, T.loiNap || '');
  if (!T.loiNap) {
    const ghi = () => T.laySnapshot();
    const don = () => { for (const t of [...ghi()]) T.bo(t.id); };
    don();
    T.baoLoi('Chưa lưu khách được', 'Số điện thoại đã có');
    k('A1 baoLoi hiện ngay, loại loi, có tiêu đề + lý do', ghi().length === 1 && ghi()[0].loai === 'loi' && ghi()[0].tieuDe === 'Chưa lưu khách được' && ghi()[0].lyDo === 'Số điện thoại đã có');
    T.baoXong('Đã lưu khách Nguyễn Thị Hoa');
    k('A2 baoXong hiện ngay, loại xong', ghi().length === 2 && ghi()[1].loai === 'xong' && ghi()[1].tieuDe === 'Đã lưu khách Nguyễn Thị Hoa');
    k('A3 TG_TU_AN trong khoảng 3–5 giây', T.TG_TU_AN >= 3000 && T.TG_TU_AN <= 5000, String(T.TG_TU_AN));
    await doi(T.TG_TU_AN + 300);
    k('A4 xanh TỰ ẨN sau ~4 giây', !ghi().some((t) => t.loai === 'xong'));
    k('A5 đỏ KHÔNG tự ẩn', ghi().some((t) => t.loai === 'loi'));
    don();
    k('A6 tối đa 3 thông báo', (() => { for (let i = 0; i < 6; i++) T.baoLoi('Lỗi ' + i); return ghi().length === 3 && ghi()[2].tieuDe === 'Lỗi 5' && ghi()[0].tieuDe === 'Lỗi 3'; })());
    don();
    T.baoLoi('A'); T.baoLoi('B');
    T.bo(ghi()[0].id);
    k('A7 bo(id) đóng đúng một thông báo', ghi().length === 1 && ghi()[0].tieuDe === 'B');
    let goi = 0; const huy = T.dangKy(() => goi++);
    T.baoXong('x'); T.baoXong('x2'); await doi(5);
    k('A8a dangKy báo cho màn vẽ khi đổi (gộp trong cùng lượt, không báo giữa lúc đang vẽ màn khác)', goi === 1, String(goi));
    huy(); T.baoXong('y'); await doi(5);
    k('A8b huỷ đăng ký thì thôi', goi === 1, String(goi));
    don();
    T.baoLoi('Hết hàng'); T.baoLoi('Hết hàng'); T.baoLoi('Hết hàng');
    k('A10 cùng một câu lỗi đang hiện thì không chất thêm', ghi().length === 1);
    don();
    T.baoXong('x1'); T.baoXong('x2'); T.baoXong('x3'); T.baoXong('x4');
    k('A9 xanh thứ 4 đẩy xanh thứ 1 ra', ghi().length === 3 && ghi()[0].tieuDe === 'x2');
    don();

    muc('C · câu lỗi dễ hiểu');
    const chung = 'Thử lại; vẫn lỗi thì báo chủ quán.';
    k('C1 lấy câu error của máy chủ', T.lyDoLoi({ error: 'Số dư ví không đủ' }) === 'Số dư ví không đủ');
    k('C2 lấy message của Error', T.lyDoLoi(new Error('Khách này đã bị khoá')) === 'Khách này đã bị khoá');
    k('C3 không có câu → câu chung', T.lyDoLoi({}) === chung && T.lyDoLoi(null) === chung && T.lyDoLoi('') === chung);
    k('C4 chữ kỹ thuật (HTTP 500, Failed to fetch, stack) → câu chung',
      T.lyDoLoi(new Error('HTTP 502 (phản hồi không phải JSON)')) === chung && T.lyDoLoi(new TypeError('Failed to fetch')) === chung && T.lyDoLoi(new Error('x\n    at foo (a.js:1:1)')) === chung);
    T.baoLoiTu('lưu khách', new Error('HTTP 500'));
    k('C5 baoLoiTu: "Chưa <việc> được" + câu chung', ghi()[0]?.tieuDe === 'Chưa lưu khách được' && ghi()[0]?.lyDo === chung);
    don();
  }

  muc('B · thành phần + Layout');
  const tb = SX('components', 'ThongBao.jsx');
  k('B1 có components/ThongBao.jsx', tb.length > 0);
  k('B2 role="alert" cho đỏ, role="status" cho xanh', /role=\{[^}]*'alert'[^}]*'status'[^}]*\}/.test(tb));
  k('B3 nút đóng có aria-label và gọi bo()', /aria-label="Đóng thông báo"/.test(tb) && /onClick=\{\(\) => bo\(/.test(tb));
  const kho = SX('components', 'thongBaoKho.js');
  k('B4 thongBaoKho.js export baoXong / baoLoi / baoLoiTu', /export const baoXong/.test(kho) && /export const baoLoi\b/.test(kho) && /export const baoLoiTu/.test(kho));
  k('B4b ThongBao.jsx chỉ export thành phần (không re-export hàm — lint fast refresh)', !/^export \{/m.test(tb) && /export default function ThongBao/.test(tb));
  const css = sach(DOC('index.css'));
  k('B5 CSS nổi cố định góc trên phải', /\.thong-bao-khung\s*\{[^}]*position:\s*fixed[^}]*top:[^}]*right:/.test(css));
  k('B6 nút đóng ≥ 44px', /\.thong-bao-dong\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/.test(css));
  const lay = SX('components', 'Layout.jsx');
  k('B7 Layout gắn <ThongBao /> đúng MỘT lần', (lay.match(/<ThongBao\s*\/>/g) || []).length === 1 && /import ThongBao from '\.\/ThongBao'/.test(lay));
  const gan = fs.existsSync(SRC) ? duyet(SRC).filter((f) => /<ThongBao\s*\/>/.test(sach(fs.readFileSync(f, 'utf8'))) && !/ThongBao\.jsx$/.test(f)) : [];
  k('B8 chỉ MỘT file gắn <ThongBao />', gan.length === 1, gan.map((f) => path.relative(SRC, f)).join(', '));

  muc('D · bánh cóc alert( và màn đã rà');
  const co = [];
  for (const f of duyet(SRC)) {
    const n = (sach(fs.readFileSync(f, 'utf8')).match(/(^|[^.\w])alert\(/gm) || []).length;
    if (n) co.push(`${path.relative(SRC, f)}×${n}`);
  }
  const tong = co.reduce((a, s) => a + Number(s.split('×')[1]), 0);
  k(`D1 alert( trong client/src ≤ ${NGUONG_ALERT}`, tong <= NGUONG_ALERT, `đếm ${tong}: ${co.join(', ')}`);
  if (tong < NGUONG_ALERT) console.log(`  – đã dọn bớt → HẠ NGUONG_ALERT xuống ${tong}`);
  for (const f of MAN_DA_RA) {
    const s = SX(...f.split('/'));
    k(`D2 ${f}: nối ThongBao, không alert(`, /from ['"](\.\.\/)+components\/thongBaoKho\.js['"]|from ['"]\.\/thongBaoKho\.js['"]/.test(s) && !/(^|[^.\w])alert\(/m.test(s));
  }

  muc('D · nút đang xử lý mờ + không bấm hai lần');
  k('D3 CSS: .btn:disabled mờ đi', /\.btn:disabled[^{]*\{[^}]*opacity:\s*0?\.\d+/.test(css));
  for (const [f, co] of Object.entries(KHOA_NUT)) {
    const t = SX(...f.split('/'));
    k(`D4 ${f}: cờ ${co} có và khoá nút (disabled={…${co}…})`, new RegExp(`disabled=\\{[^}]*\\b${co}\\b`).test(t));
  }

  console.log(`\n${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
})();
