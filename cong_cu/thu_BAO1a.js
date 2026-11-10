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
// file → số lời GỌI baoXong/baoLoi/baoLoiTu tối thiểu (mỗi nút ghi một cặp xong/lỗi). Gỡ lời gọi mà giữ import thì D2 đỏ.
const MAN_DA_RA = {
  'pages/Orders.jsx': 10,
  'pages/Refunds.jsx': 4,
  'components/InvoicePrint.jsx': 2,
  'pages/Sales.jsx': 3,
  'pages/Customers.jsx': 10,
  'pages/DonApp.jsx': 3,
  'pages/DonThu.jsx': 5,
  'pages/Registrations.jsx': 14,
  'pages/DiscountCodes.jsx': 11,
  'pages/InvoiceSettings.jsx': 11,
  'pages/Reports.jsx': 4,
  'pages/GiaoHang/index.jsx': 3,
  'components/ViKhach.jsx': 2,
  'components/CapHang.jsx': 3,
  'components/DoiSoat.jsx': 5,
  'components/ThongTinMon.jsx': 2,
  'components/MaDangNhapApp.jsx': 1,
  'components/CustomerSearch.jsx': 2,
  'components/Layout.jsx': 2,
  'pages/Kho/DatHang.jsx': 2,
  'pages/Kho/DinhMuc.jsx': 2,
  'pages/Kho/NguyenLieu.jsx': 6,
  'pages/Kho/NhanHang.jsx': 2,
  'pages/Kho/NhapSx.jsx': 2,
  'pages/Kho/PhaChe.jsx': 2,
  'pages/Kho/PhatSinh.jsx': 2,
  'pages/Kho/SanPham.jsx': 2,
  'pages/Kho/XemPhieu.jsx': 2,
};
// Nút ghi phải khoá khi đang xử lý (D): file → cờ đang xử lý phải có và phải đi kèm disabled.
const KHOA_NUT = {   // file → [cờ, số chỗ disabled={…cờ…} tối thiểu = số nút ghi hiện có]
  'pages/DiscountCodes.jsx': ['dangXuLy', 2],
  'pages/Registrations.jsx': ['dangXuLy', 3],
  'pages/Reports.jsx': ['dangKetThuc', 1],
  'pages/Kho/DinhMuc.jsx': ['dang', 4],
  'pages/Kho/NguyenLieu.jsx': ['dang', 2],
  'pages/Kho/SanPham.jsx': ['dang', 1],
  'pages/Orders.jsx': ['deleting', 2],
  'pages/Customers.jsx': ['submitting', 2],
  'pages/DonThu.jsx': ['dangChay', 2],
  'pages/DonApp.jsx': ['dangBam', 2],
  'components/CapHang.jsx': ['dangGui', 2],
  'components/ViKhach.jsx': ['dang', 1],
  'components/DoiSoat.jsx': ['dangGhi', 3],
  'pages/Kho/XemPhieu.jsx': ['dangGhi', 7],
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
    T.baoLoi('Lỗi đỏ chưa đọc'); T.baoXong('x1'); T.baoXong('x2'); T.baoXong('x3');
    k('A11 đỏ chưa đọc KHÔNG bị xanh đẩy mất (bỏ xanh cũ nhất trước)', ghi().length === 3 && ghi().some((t) => t.loai === 'loi') && ghi().every((t) => t.tieuDe !== 'x1'));
    don();
    T.baoLoi('d1'); T.baoLoi('d2'); T.baoLoi('d3'); T.baoLoi('d4');
    k('A12 toàn đỏ quá 3 thì bỏ đỏ cũ nhất', ghi().length === 3 && ghi()[0].tieuDe === 'd2');
    don();
    T.baoLoi('d1'); T.baoLoi('d2'); T.baoLoi('d3'); T.baoXong('Đã thu tiền đơn 1');
    k('A13 đang 3 đỏ mà có xanh MỚI thì xanh mới vẫn hiện (bỏ đỏ cũ nhất, không bỏ chính cái mới)',
      ghi().length === 3 && ghi().some((t) => t.loai === 'xong' && t.tieuDe === 'Đã thu tiền đơn 1') && ghi().every((t) => t.tieuDe !== 'd1'));
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
  k('B7b Layout gắn <ThongBao /> vô điều kiện (không sau && / ? / :)', !/(&&|\?|:)\s*\(?\s*<ThongBao\s*\/>/.test(lay));
  k('C6 Sales.setError đi qua lyDoLoi (chữ kỹ thuật → câu chung)', /baoLoi\(\s*lyDoLoi\(\s*cau\s*\)\s*\)/.test(SX('pages', 'Sales.jsx')));
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
  for (const [f, toiThieu] of Object.entries(MAN_DA_RA)) {
    const s = SX(...f.split('/'));
    const goi = (s.match(/\bbao(?:Xong|Loi|LoiTu)\(/g) || []).length;
    k(`D2 ${f}: gọi ≥ ${toiThieu} lần`, goi >= toiThieu, `chỉ ${goi} lời gọi`);
    k(`D2 ${f}: nối ThongBao, không alert(`, /from ['"](\.\.\/)+components\/thongBaoKho\.js['"]|from ['"]\.\/thongBaoKho\.js['"]/.test(s) && !/(^|[^.\w])alert\(/m.test(s));
  }

  muc('D · nút đang xử lý mờ + không bấm hai lần');
  k('D3 CSS: .btn:disabled mờ đi', /\.btn:disabled[^{]*\{[^}]*opacity:\s*0?\.\d+/.test(css));
  for (const [f, [co, toiThieu]] of Object.entries(KHOA_NUT)) {
    const t = SX(...f.split('/'));
    const n = (t.match(new RegExp(`disabled=\\{[^}]*\\b${co}\\b`, 'g')) || []).length;
    k(`D4 ${f}: cờ ${co} khoá ≥ ${toiThieu} nút (disabled={…${co}…})`, n >= toiThieu, `chỉ ${n} chỗ`);
  }

  console.log(`\n${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
})();
