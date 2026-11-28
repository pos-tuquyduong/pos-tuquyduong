#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ GIAO-DIEN-4 — làm đẹp POS theo mẫu chủ quán duyệt 28.11: giữ đỏ · vàng · kem; sơn mài + bill giấy; icon vẽ thay emoji;
 *  khẩu hiệu "Đông Y Dưỡng Thể"; hình ly vẽ khi món chưa có ảnh.
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (index.css còn quy tắc đỏ toàn cục, chưa có TieuDeMan.jsx, AnhMon còn chữ viết tắt …).
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_GIAODIEN4.js [--goc <thư mục gốc bản sao>]      (in "SỐ CA" và "n đạt · m hỏng")
 *  Không cần trình duyệt: đọc file CSS (bộ đọc ở dưới, thử trên CSS giả trước), dựng component THẬT bằng esbuild rồi vẽ ra HTML.
 *  GIỚI HẠN (nói thẳng): chỉ so selector NGUYÊN VĂN, không tính độ ưu tiên giữa selector khác nhau; media chỉ hiểu min/max-width nối `and`
 *  (`@media print` coi như KHÔNG áp ở màn hình — đúng ý: quy tắc "đỏ toàn cục" chỉ được còn trong khối in). Đo bề ngang / nhìn mắt bằng
 *  Chrome: xem trang_thai.md (F4). 4 file in KHÔNG bị sửa: kiểm một lần bằng git diff (trang_thai.md), không đưa vào bài thử vĩnh viễn
 *  vì việc sau của Kho được phép sửa chúng.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const path = require('path');

const iG = process.argv.indexOf('--goc');
const GOC = path.resolve(iG > 0 ? process.argv[iG + 1] : path.join(__dirname, '..'));
const CL = (...p) => path.join(GOC, 'client', 'src', ...p);
const DOC = (...p) => { try { return fs.readFileSync(path.join(GOC, ...p), 'utf8'); } catch { return ''; } };
const DOCCL = (...p) => { try { return fs.readFileSync(CL(...p), 'utf8'); } catch { return ''; } };

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);

// ── bộ đọc CSS tối thiểu (cùng khuôn thu_GIAODIEN3, thêm: giữ điều kiện @media nguyên văn để phân biệt khối in) ──────────────
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
function khoiNgoac(s, a) { let sau = 1, j = a + 1; while (j < s.length && sau > 0) { if (s[j] === '{') sau++; else if (s[j] === '}') sau--; j++; } return j; }
function phanTich(css, dk = '') {
  const s = boChuThich(css), ra = [];
  let i = 0;
  while (i < s.length) {
    const a = s.indexOf('{', i), cham = s.indexOf(';', i);
    if (a < 0) break;
    if (cham >= 0 && cham < a && /^\s*@/.test(s.slice(i, cham))) { i = cham + 1; continue; }
    const dau = s.slice(i, a).trim(), j = khoiNgoac(s, a), than = s.slice(a + 1, j - 1);
    if (/^@media\b/i.test(dau)) ra.push(...phanTich(than, dau.replace(/\s+/g, ' ').replace(/\(\s*([\w-]+)\s*:\s*/g, '($1: ').replace(/\s*\)/g, ')').toLowerCase()));
    else if (!dau.startsWith('@')) {
      ra.push({ dk, chon: dau.split(',').map((x) => x.trim()),
        khai: than.split(';').map((d) => { const m = /^\s*([\w-]+)\s*:\s*([\s\S]*?)\s*$/.exec(d); return m ? [m[1].toLowerCase(), m[2].replace(/\s*!important\s*$/i, '').trim()] : null; }).filter(Boolean) });
    }
    i = j;
  }
  return ra;
}
function apDung(dk, rong) {
  if (!dk) return true;
  const m = /^@media\s+(.*)$/.exec(dk);
  if (!m) return false;
  return m[1].split(/\s+and\s+/).every((c) => { const x = /^\(\s*(min|max)-width\s*:\s*(\d+(?:\.\d+)?)px\s*\)$/.exec(c.trim()); return !!x && (x[1] === 'min' ? rong >= Number(x[2]) : rong <= Number(x[2])); });
}
/** giá trị hiệu lực của `tt` cho selector NGUYÊN VĂN `chon` ở bề rộng `rong`; `rong = 'in'` → CHỈ các khối @media print (câu sau thắng). */
function giaTri(luat, chon, tt, rong = 1280) {
  let kq;
  for (const r of luat) {
    if (!r.chon.includes(chon)) continue;
    if (rong === 'in' ? r.dk !== '@media print' : !apDung(r.dk, rong)) continue;
    for (const [p, v] of r.khai) if (p === tt) kq = v;
  }
  return kq;
}
const L = (v) => String(v ?? '').toLowerCase().replace(/\s+/g, ' ');
const co = (v, mau) => mau.test(L(v));

// ── "đỏ toàn cục": bộ chọn trần (h1, strong, td, input, ::placeholder…) ngoài khối in có màu chữ KHÁC chữ than / chữ phụ ────────
const CHU_THAN = /^(var\(--chu\)|#292524)$/, CHU_PHU = /^(var\(--phu\)|#7c6f66)$/;
const TRAN = /^[a-z][a-z0-9]*(::placeholder)?$/;
function doToanCuc(css) {   // → ['strong,b → #991b1b', …] — danh sách quy tắc trần sai
    const ra = [];
  for (const r of phanTich(css)) {
    if (r.dk) continue;
    for (const c of r.chon) {
      if (!TRAN.test(c) || c === 'a') continue;     // `a` (liên kết) không nằm trong A2
      const mau = L((r.khai.filter(([p]) => p === 'color').pop() || [])[1]);
      if (!mau) continue;
      const dung = c.endsWith('::placeholder') ? CHU_PHU.test(mau) : CHU_THAN.test(mau);
      if (!dung) ra.push(`${c} → ${mau}`);
    }
  }
  return ra;
}

// ── dựng component thật bằng esbuild ────────────────────────────────────────
function dung(noiDung) {   // noiDung: mã JS dùng được `import`; phải `export` thứ cần. Trả module.
  // bản sao đột biến (--goc) không chép node_modules → lấy thư viện từ kho thật, còn MÃ NGUỒN vẫn đọc ở GOC
  const NM = fs.existsSync(path.join(GOC, 'client', 'node_modules')) ? path.join(GOC, 'client', 'node_modules') : path.join(__dirname, '..', 'client', 'node_modules');
  const esbuild = require(path.join(NM, 'esbuild'));
  const kq = esbuild.buildSync({
    stdin: { contents: noiDung, resolveDir: path.join(GOC, 'client'), loader: 'js' },
    bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', nodePaths: [NM],
    loader: { '.png': 'dataurl', '.svg': 'dataurl' }, define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'silent',
  });
  const mo = { exports: {} };
  new Function('module', 'exports', 'require', kq.outputFiles[0].text)(mo, mo.exports, require);
  return mo.exports;
}
const J = (p) => JSON.stringify(CL(...p));

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{FE0F}]/u;
const dongTieuDe = (src) => src.split('\n').filter((d) => /className="page-title"|<TieuDeMan\b/.test(d));

async function main() {
  const css = DOCCL('index.css'), luat = phanTich(css), G = (c, t, w) => giaTri(luat, c, t, w);
  const bh = DOCCL('pages', 'BanHang', 'banHang.css'), lb = phanTich(bh), GB = (c, t, w) => giaTri(lb, c, t, w);

  // ═══ 0 · bộ đọc tự thử — ca ĐỎ từng quy tắc cũ (K3: bài thử không xanh oan) ═══
  muc('0 · bộ bắt "đỏ toàn cục" tự thử trên CSS giả');
  k('0a h1–h6 màu đỏ → BỊ BẮT', doToanCuc('h1, h2, h3, h4, h5, h6 { color: #B91C1C; }').length === 6);
  k('0b strong, b màu đỏ → BỊ BẮT', doToanCuc('strong, b { color: #991B1B; }').length === 2);
  k('0c td, th màu xám cũ #78716C → BỊ BẮT (chữ thường phải là chữ than)', doToanCuc('td, th { color: #78716C; }').length === 2);
  k('0d input, select, textarea màu đỏ → BỊ BẮT', doToanCuc('input, select, textarea { color: #991B1B; }').length === 3);
  k('0e placeholder màu đỏ → BỊ BẮT', doToanCuc('input::placeholder, textarea::placeholder { color: #DC2626; opacity: 0.5; }').length === 2);
  k('0f đúng: td,th = chữ than; placeholder = chữ phụ; bộ chọn lớp (.input) không tính → KHÔNG bắt', doToanCuc('td, th { color: var(--chu); } input::placeholder { color: var(--phu); } .input { color: #991B1B; }').length === 0);
  k('0g đỏ nằm trong @media print → KHÔNG bắt (khối in giữ nguyên hôm nay); đỏ ngoài khối → BẮT', doToanCuc('@media print { strong, b { color: #991B1B; } }').length === 0 && doToanCuc('@media (max-width: 768px) { strong { color: #991B1B; } } strong { color: #991B1B; }').length === 1);

  // ═══ A · khung chung ═══
  muc('A1 · biến màu MỘT chỗ ở :root (giữ tên cũ, thêm tên mới)');
  const BIEN = { '--do': '#b91c1c', '--do-dam': '#7f1d1d', '--vang': '#f59e0b', '--dat': '#c8962e', '--dat-nhat': '#ecd9a8', '--kem': '#fef7ed', '--giay': '#fffdf8', '--vien': '#eedfcc', '--chu': '#292524', '--phu': '#7c6f66' };
  for (const [b, v] of Object.entries(BIEN)) k(`A1 :root ${b} = ${v}`, L(G(':root', b)) === v, String(G(':root', b)));
  k('A1 tên cũ còn nguyên (--primary, --primary-dark, --accent, --cream, --sidebar-bg, --gray-500)', ['--primary', '--primary-dark', '--accent', '--cream', '--sidebar-bg', '--gray-500'].every((b) => G(':root', b)));

  muc('A2 · bỏ quy tắc đỏ toàn cục');
  const sai = doToanCuc(css);
  k('A2a ngoài khối in KHÔNG còn quy tắc trần (h1–h6, strong/b, td/th, input/select/textarea, placeholder) sai màu', sai.length === 0, sai.join(' | '));
  k('A2b chữ thường = chữ than: body color var(--chu)', CHU_THAN.test(L(G('body', 'color'))), String(G('body', 'color')));
  k('A2c chữ trong ô nhập = chữ than (.input, .login-field input); placeholder (.input::placeholder) = chữ phụ',
    CHU_THAN.test(L(G('.input', 'color'))) && CHU_THAN.test(L(G('.login-field input', 'color'))) && CHU_PHU.test(L(G('.input::placeholder', 'color'))),
    `${G('.input', 'color')} / ${G('.login-field input', 'color')} / ${G('.input::placeholder', 'color')}`);
  k('A2d .page-title = đỏ đậm (var(--do-dam)) + phông Playfair Display có dự phòng Georgia', co(G('.page-title', 'color'), /^var\(--do-dam\)$|^#7f1d1d$/) && co(G('.page-title', 'font-family'), /playfair display.*georgia/), `${G('.page-title', 'color')} / ${G('.page-title', 'font-family')}`);
  k('A2e chỗ CỐ Ý đỏ có lớp riêng: .text-danger, .alert-danger, .loi-o, .bh-gia, .stat-value, .product-price vẫn đỏ',
    co(G('.text-danger', 'color'), /danger|#dc2626|#b91c1c/) && co(G('.alert-danger', 'color'), /#991b1b|#b91c1c/) && co(G('.loi-o', 'color'), /#b91c1c|#dc2626/) && co(GB('.bh-gia', 'color'), /bh-do|#b91c1c|var\(--do\)/) && co(G('.stat-value', 'color'), /#b91c1c|var\(--do\)|primary/) && co(G('.product-price', 'color'), /#b91c1c|var\(--do\)|primary/));

  muc('A3 · phông chữ');
  const html = DOC('client', 'index.html');
  k('A3a index.html có <link> Google Fonts: Be Vietnam Pro 400;500;600;700 + Playfair Display 600;700 + display=swap',
    /<link[^>]*href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*family=Be\+Vietnam\+Pro:wght@400;500;600;700[^"]*family=Playfair\+Display:wght@600;700[^"]*display=swap"/.test(html) || /<link[^>]*href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*family=Playfair\+Display:wght@600;700[^"]*family=Be\+Vietnam\+Pro:wght@400;500;600;700[^"]*display=swap"/.test(html));
  k('A3b chữ chung (body): Be Vietnam Pro, dự phòng system-ui — mất mạng vẫn đọc được', co(G('body', 'font-family'), /^'be vietnam pro'.*system-ui/), String(G('body', 'font-family')));
  k('A3c tên quán / tổng tiền dùng Playfair (hằng --font-chu-dep có Georgia)', co(G(':root', '--font-chu-dep'), /playfair display.*georgia/), String(G(':root', '--font-chu-dep')));

  muc('A4 · nền kem phẳng + mây chìm; thẻ giấy; nút');
  const nen = L(G('body', 'background'));
  k('A4a body: nền kem + họa tiết mây (SVG data URI), KHÔNG gradient hồng', /var\(--kem\)/.test(nen) && /url\("data:image\/svg\+xml/.test(nen) && !/gradient/.test(nen), nen.slice(0, 120));
  k('A4b .card: nền giấy, viền kem, bo 16px, KHÔNG backdrop-filter', co(G('.card', 'background'), /^var\(--giay\)$/) && co(G('.card', 'border'), /var\(--vien\)/) && co(G('.card', 'border-radius'), /^(16px|1rem)$/) && G('.card', 'backdrop-filter') === undefined && G('.card', '-webkit-backdrop-filter') === undefined,
    `${G('.card', 'background')} | ${G('.card', 'border')} | ${G('.card', 'border-radius')} | ${G('.card', 'backdrop-filter')}`);
  k('A4c .btn-primary đỏ gradient nhẹ (đỏ → đỏ đậm), chữ trắng', co(G('.btn-primary', 'background'), /linear-gradient.*(#c42020|#dc2626|var\(--do\)).*(#a51b1b|#b91c1c|var\(--do\))/) && co(G('.btn-primary', 'color'), /^(white|#fff|#ffffff)$/), String(G('.btn-primary', 'background')));
  k('A4d .btn-outline nút phụ trắng viền kem, không backdrop-filter', co(G('.btn-outline', 'background'), /^(#fff|white|#ffffff|var\(--giay\))$/) && co(G('.btn-outline', 'border'), /var\(--vien\)/) && G('.btn-outline', 'backdrop-filter') === undefined, `${G('.btn-outline', 'background')} | ${G('.btn-outline', 'border')}`);

  muc('A5 · .page-header');
  k('A5 nền giấy, vạch dưới kem, không backdrop-filter', co(G('.page-header', 'background'), /^var\(--giay\)$/) && co(G('.page-header', 'border-bottom'), /var\(--vien\)/) && G('.page-header', 'backdrop-filter') === undefined, `${G('.page-header', 'background')} | ${G('.page-header', 'border-bottom')}`);

  muc('F2 · in không đổi: khối @media print trả đúng phông + màu cũ cho phần Kho in bằng window.print()');
  const I = (c, t) => L(giaTri(luat, c, t, 'in'));
  k('F2a body: phông cũ \'Inter\', -apple-system + màu #78716c', /^'inter', -apple-system, sans-serif$/.test(I('body', 'font-family')) && I('body', 'color') === '#78716c', `${I('body', 'font-family')} | ${I('body', 'color')}`);
  k('F2b h1–h6 #b91c1c · strong,b #991b1b · td,th #78716c như hôm nay', I('h1', 'color') === '#b91c1c' && I('h6', 'color') === '#b91c1c' && I('strong', 'color') === '#991b1b' && I('b', 'color') === '#991b1b' && I('td', 'color') === '#78716c' && I('th', 'color') === '#78716c');
  k('F2c khối in KHÔNG bật nền: body không có gradient / ảnh mây trong @media print (giấy trắng như cũ)', !/url\(|gradient/.test(I('body', 'background')));

  // ═══ B · tiêu đề + icon ═══
  muc('B1 · TieuDeMan');
  let TD = null;
  try { TD = dung(`import C from ${J(['components', 'TieuDeMan.jsx'])}; import { Receipt } from 'lucide-react'; import { renderToStaticMarkup } from 'react-dom/server'; import { createElement } from 'react';
    export const ve = (p) => renderToStaticMarkup(createElement(C, { icon: Receipt, ...p }));`); } catch (e) { k('B1a dựng được components/TieuDeMan.jsx', false, String(e.message).split('\n')[0]); k('B1b không emoji; có `phu` thì hiện thêm dòng phụ; không `phu` thì không', false, 'chưa dựng được TieuDeMan'); }   // đủ ca dù file chưa có → số ca không đổi giữa bản gốc và bản vá (cổng A16)
  if (TD) {
    const h = TD.ve({ ten: 'Đơn hàng' }), hp = TD.ve({ ten: 'Đơn hàng', phu: 'Hôm nay' });
    k('B1a vẽ <h1 class="page-title"> có chữ tên màn + ô icon <svg> TRƯỚC chữ', /<h1[^>]*class="page-title/.test(h) && />Đơn hàng</.test(h) && h.indexOf('<svg') > -1 && h.indexOf('<svg') < h.indexOf('Đơn hàng'), h.slice(0, 220));
    k('B1b không emoji; có `phu` thì hiện thêm dòng phụ; không `phu` thì không', !EMOJI.test(h) && />Hôm nay</.test(hp) && !/Hôm nay/.test(h));
  }
  const TRANG_B1 = ['Refunds', 'Orders', 'Customers', 'Reports', 'DiscountCodes', 'Settings'];
  for (const t of TRANG_B1) {
    const s = DOCCL('pages', `${t}.jsx`), d = dongTieuDe(s);
    k(`B1c ${t}.jsx: tiêu đề dùng <TieuDeMan, không còn h1.page-title thô, không emoji`, /import TieuDeMan from '\.\.\/components\/TieuDeMan'/.test(s) && d.some((x) => /<TieuDeMan\b/.test(x)) && !d.some((x) => /className="page-title"/.test(x)) && !d.some((x) => EMOJI.test(x)), d.join(' ⏎ ').slice(0, 200));
  }
  { const s = DOCCL('pages', 'QuanLy', 'QuanLy.jsx'), d = dongTieuDe(s);
    k('B1d QuanLy.jsx: tiêu đề màn dùng <TieuDeMan (trước chỉ là <h1> trơn)', d.some((x) => /<TieuDeMan\b/.test(x)) && !/<h1>Quản lý<\/h1>/.test(s)); }
  k('B1e ca ĐỎ tự thử: dòng tiêu đề giả còn emoji → BỊ BẮT; không emoji → qua', dongTieuDe('<h1 className="page-title">👥 Khách hàng</h1>').some((x) => EMOJI.test(x)) && !dongTieuDe('<TieuDeMan icon={Users} ten="Khách hàng" />').some((x) => EMOJI.test(x)));
  { const st = DOCCL('pages', 'Settings.jsx'), m = /const TEN_THE = \{([\s\S]*?)\};/.exec(st);
    k('B1f Settings.jsx: TEN_THE không emoji; tiêu đề chung "Cài đặt" không emoji', !!m && !EMOJI.test(m[1]) && !/'[^']*⚙️[^']*Cài đặt'/.test(st)); }
  k('B2 emoji còn lại ở client/src KHÔNG làm ở việc này (phiếu B2): chỉ ghi số đếm vào Phát hiện (không phép thử)', true);

  // ═══ C · thanh bên + thanh dưới ═══
  muc('C1 · thanh bên sơn mài (máy tính)');
  const lay = DOCCL('components', 'Layout.jsx');
  k('C1a khẩu hiệu "Đông Y Dưỡng Thể" xuất hiện đúng MỘT lần trong Layout.jsx (hằng số có tên) và hằng đó được vẽ', (lay.match(/Đông Y Dưỡng Thể/g) || []).length === 1 && /const KHAU_HIEU\s*=\s*'Đông Y Dưỡng Thể'/.test(lay) && /\{KHAU_HIEU\}/.test(lay));
  k('C1b logo lấy từ assets/logo_TQD_bieu_tuong.png (không còn icon-72x72 ở thanh bên)', /import \w+ from '\.\.\/assets\/logo_TQD_bieu_tuong\.png'/.test(lay) && !/icon-72x72/.test(lay));
  const nenBen = /^var\(--sidebar-bg\)$/.test(L(G('.sidebar', 'background'))) ? G(':root', '--sidebar-bg') : G('.sidebar', 'background');   // biến được → đọc giá trị biến
  k('C1c .sidebar nền sơn mài (gradient đỏ đậm) + mây vàng chìm (::before dùng SVG data URI)', co(nenBen, /radial-gradient.*linear-gradient.*#7f1d1d/) && co(G('.sidebar::before', 'background') + ' ' + G('.sidebar::before', 'background-image'), /url\("data:image\/svg\+xml/), `${G('.sidebar', 'background')} | ${G('.sidebar::before', 'background')}`);
  k('C1d đầu thanh: logo 64px giữa; tên quán Playfair; khẩu hiệu Playfair NGHIÊNG màu dát vàng nhạt',
    co(G('.sidebar-header', 'flex-direction'), /^column$/) && co(G('.sidebar-header img', 'width'), /^64px$/) && co(G('.sidebar-khau-hieu', 'font-family'), /playfair|font-chu-dep/) && co(G('.sidebar-khau-hieu', 'font-style'), /^italic$/) && co(G('.sidebar-khau-hieu', 'color'), /^(var\(--dat-nhat\)|#ecd9a8)$/),
    `${G('.sidebar-header', 'flex-direction')} | ${G('.sidebar-header img', 'width')} | ${G('.sidebar-khau-hieu', 'font-style')}`);
  k('C1e mục đang chọn: nền vàng nhạt mờ + vạch vàng bên trái + icon vàng (.nav-item.active)', co(G('.nav-item.active', 'background'), /rgba\(236, ?217, ?168|rgba\(232, ?196, ?106/) && co(G('.nav-item.active', 'border-left-color') + G('.nav-item.active::before', 'background'), /dat-nhat|ecd9a8|dat\)/) && co(G('.nav-item.active', 'color'), /^(#fff|white|#ffffff|var\(--dat-nhat\))$/) && co(G('.nav-item.active svg', 'color'), /dat-nhat|ecd9a8/), `${G('.nav-item.active', 'background')} | ${G('.nav-item.active svg', 'color')}`);
  k('C1f chân thanh bên giữ tên người đăng nhập + vai trò + nút Đăng xuất (không gọi API mới)', /user\?\.display_name \|\| user\?\.username/.test(lay) && /Đăng xuất/.test(lay) && (lay.match(/api\./g) || []).length === 0);
  k('C1g .sidebar là cột flex để chân thanh nằm đáy', co(G('.sidebar', 'display'), /^flex$/) && co(G('.sidebar', 'flex-direction'), /^column$/));
  muc('C2/C3 · thanh dưới điện thoại + số đỏ');
  k('C2a .bottom-nav nền giấy (≤ 768px)', co(G('.bottom-nav', 'background', 390), /^var\(--giay\)$/), String(G('.bottom-nav', 'background', 390)));
  k('C2b mục đang chọn đỏ + chấm vàng nhỏ dưới (.bottom-nav-item.active::after)', co(G('.bottom-nav-item.active', 'color', 390), /^var\(--do\)$|^#b91c1c$/) && co(G('.bottom-nav-item.active::after', 'background', 390), /^var\(--dat\)$|^#c8962e$/) && co(G('.bottom-nav-item.active::after', 'border-radius', 390), /50%/), String(G('.bottom-nav-item.active::after', 'background', 390)));
  k('C3 số đỏ cạnh menu (.nav-badge) + dải báo việc kho kẹt (⏳ … Bấm để gửi lại ngay) còn nguyên', /\.nav-badge\s*\{/.test(css) && /soDo\(item\.to/.test(lay) && /Bấm để gửi lại ngay/.test(lay) && /soNo\.cho > 0/.test(lay));

  // ═══ D · màn Bán hàng ═══
  muc('D1 · nhãn tồn trên thẻ món');
  let T = null;
  try { T = dung(`export * from ${J(['pages', 'BanHang', 'tinh.js'])};`); } catch (e) { k('D1a nạp được tinh.js', false, String(e.message).split('\n')[0]); }
  if (T) {
    const nt = T.nhanTon;
    k('D1a tinh.js có hàm nhanTon', typeof nt === 'function');
    if (typeof nt === 'function') {
      k('D1b hết (quản kho, tồn 0) → "Hết"', nt({ stock_quantity: 0 }) === 'Hết');
      k('D1c không quản kho → "Pha ngay" (kể cả khi tồn ghi 0)', nt({ khong_quan_kho: 1, stock_quantity: 0 }) === 'Pha ngay' && nt({ khong_quan_kho: true }) === 'Pha ngay');
      k('D1d còn hàng → "Còn n" (ngay biên: 1 → "Còn 1"; 28 → "Còn 28")', nt({ stock_quantity: 1 }) === 'Còn 1' && nt({ stock_quantity: 28 }) === 'Còn 28');
      k('D1e không có số tồn (món chưa nạp tồn) → rỗng, KHÔNG bịa "Hết"', nt({}) === '' && nt({ stock_quantity: null }) === '' && nt({ stock_quantity: undefined }) === '');
    } else for (const c of ['D1b', 'D1c', 'D1d', 'D1e']) k(`${c} (cần hàm nhanTon)`, false, 'tinh.js chưa có nhanTon');   // đủ ca dù hàm chưa có (cổng A16)
  }
  const bhm = DOCCL('pages', 'BanHang', 'BanHangMoi.jsx');
  k('D1f thẻ món (BanHangMoi.jsx) có khung hình + nhãn tồn từ nhanTon; nút vẫn disabled y như cũ', /className="bh-hinh"/.test(bhm) && /nhanTon\(s\)/.test(bhm) && /disabled=\{het \|\| chuaCT \|\| !coGia\(s\)\}/.test(bhm) && /onClick=\{\(\) => chamMon\(s\)\}/.test(bhm));
  k('D1g CSS thẻ món: bo 16px, nhãn tồn góc trái trên, món hết xám + mờ', co(GB('.bh-mon', 'border-radius'), /^16px$/) && co(GB('.bh-nhan-ton', 'position'), /^absolute$/) && co(GB('.bh-nhan-ton', 'left'), /^8px$/) && co(GB('.bh-mon:disabled', 'filter'), /grayscale/) && co(GB('.bh-mon:disabled', 'opacity'), /^0\.[3-6]/), `${GB('.bh-mon', 'border-radius')} | ${GB('.bh-mon:disabled', 'filter')}`);

  muc('D2 · AnhMon: chưa ảnh → hình ly vẽ theo nhóm');
  const AM = (() => { try { return dung(`import * as M from ${J(['pages', 'BanHang', 'AnhMon.jsx'])}; import { renderToStaticMarkup } from 'react-dom/server'; import { createElement } from 'react';
    export const ve = (p) => renderToStaticMarkup(createElement(M.default, p)); export const mauNhom = M.mauNhom; export const HinhLy = M.HinhLy; export const veLy = (p) => renderToStaticMarkup(createElement(M.HinhLy, p));
    export const veHai = (a, b) => renderToStaticMarkup(createElement('div', null, createElement(M.default, a), createElement(M.default, b)));`); } catch (e) { k('D2 dựng được AnhMon.jsx', false, String(e.message).split('\n')[0]); return null; } })();
  if (AM) {
    const nhom = (n) => (typeof AM.mauNhom === 'function' ? AM.mauNhom(n) : {});
    const nuoc = (n) => String(nhom(n).nuoc || ''), nen = (n) => String(nhom(n).nen || '');
    k('D2a mauNhom: tea / coffee / juice ra ba màu nước KHÁC nhau, đều là mã màu', [nuoc('tea'), nuoc('coffee'), nuoc('juice')].every((m) => /^#[0-9a-f]{6}$/i.test(m)) && new Set([nuoc('tea'), nuoc('coffee'), nuoc('juice')]).size === 3);
    k('D2b nhóm lạ + KHÔNG truyền nhóm + chuỗi rỗng → CÙNG màu mặc định, khác cả ba nhóm trên', /^#[0-9a-f]{6}$/i.test(nuoc('xyz')) && nuoc('xyz') === nuoc(undefined) && nuoc('xyz') === nuoc('') && nuoc('xyz') === nuoc(null) && ![nuoc('tea'), nuoc('coffee'), nuoc('juice')].includes(nuoc('xyz')));
    const khong = AM.ve({ anh: null, ten: 'Thanh Tân Dưỡng', nhom: 'tea', kich: 96 });
    k('D2c chưa ảnh (null): vẽ <svg> ly, KHÔNG <img>, KHÔNG chữ viết tắt "TT", khung 96 × 96, màu nước nhóm trà', /<svg/.test(khong) && !/<img/.test(khong) && !/>TT</.test(khong) && /width:96px;height:96px/.test(khong) && nuoc('tea') !== '' && khong.toLowerCase().includes(nuoc('tea')), khong.slice(0, 160));
    const rong = AM.ve({ anh: '', ten: 'Cà phê', nhom: 'coffee' });
    k('D2d ảnh chuỗi rỗng: vẽ ly màu cà phê, không <img>, không chữ "CP"; khung mặc định 44 × 44', /<svg/.test(rong) && !/<img/.test(rong) && !/>CP</.test(rong) && nuoc('coffee') !== '' && rong.toLowerCase().includes(nuoc('coffee')) && /width:44px;height:44px/.test(rong));
    const coAnh = AM.ve({ anh: '/api/pos/products/anh/5/abcdef012345', ten: 'Thanh Tân Dưỡng', nhom: 'tea', kich: 48 });
    k('D2e CÓ ảnh: <img> đúng đường dẫn, ảnh lười, khung 48 × 48; KHÔNG vẽ ly', /<img[^>]*src="\/api\/pos\/products\/anh\/5\/abcdef012345"/.test(coAnh) && /loading="lazy"/.test(coAnh) && /width:48px;height:48px/.test(coAnh) && !/<svg/.test(coAnh), coAnh.slice(0, 160));
    k('D2f nhóm lạ / không truyền nhóm: vẫn vẽ ly, màu mặc định (không vỡ, không "undefined" trong HTML)', (() => { const a = AM.ve({ anh: null, ten: 'Món mới' }), b = AM.ve({ anh: null, ten: 'Món mới', nhom: 'khong-co' }); return /<svg/.test(a) && a === b && !/undefined|null|NaN/.test(a) && nuoc(undefined) !== '' && a.toLowerCase().includes(nuoc(undefined)); })());
    k('D2g cùng nhóm → cùng hình (không nhảy mỗi lần vẽ); khác nhóm → khác màu', AM.ve({ anh: null, ten: 'A', nhom: 'tea' }) === AM.ve({ anh: null, ten: 'A', nhom: 'tea' }) && AM.ve({ anh: null, ten: 'A', nhom: 'tea' }) !== AM.ve({ anh: null, ten: 'A', nhom: 'juice' }));
    k('D2h cỡ nhỏ (dòng giỏ 36, ô topping 40) vẫn vẽ ly gọn: khung đúng cỡ, có <svg>', [36, 40].every((c) => { const h = AM.ve({ anh: null, ten: 'A', nhom: 'tea', kich: c }); return /<svg/.test(h) && new RegExp(`width:${c}px;height:${c}px`).test(h); }));
    k('D2i hai ly TRÊN CÙNG MỘT TRANG có id gradient KHÁC nhau (id trùng → màu ly này lẫn sang ly kia)', (() => { const h = AM.veHai({ anh: null, ten: 'A', nhom: 'tea' }, { anh: null, ten: 'B', nhom: 'juice' }); const ids = [...h.matchAll(/<linearGradient id="([^"]+)"/g)].map((m) => m[1]); return ids.length === 2 && ids[0] !== ids[1]; })());
    k('D2j HinhLy (dùng cho chip nhóm) vẽ được ly nhỏ theo màu nhóm', typeof AM.HinhLy === 'function' && typeof AM.veLy === 'function' && nuoc('juice') !== '' && /<svg/.test(AM.veLy({ nhom: 'juice' })) && AM.veLy({ nhom: 'juice' }).toLowerCase().includes(nuoc('juice')));
    void nen;
  }
  const am = DOCCL('pages', 'BanHang', 'AnhMon.jsx');
  k('D2k AnhMon giữ ảnh lười + onError → ly (ANH-MON-1)', /loading="lazy"/.test(am) && /onError=\{\(\) => setHong\(anh\)\}/.test(am) && /hong !== anh/.test(am));
  k('D2l nơi gọi AnhMon truyền nhóm: BanHangMoi (thẻ món + dòng giỏ)', (bhm.match(/<AnhMon\b[^>]*\bnhom=/g) || []).length >= 2, `${(bhm.match(/<AnhMon\b[^>]*\bnhom=/g) || []).length} chỗ`);

  muc('D3 · chip nhóm');
  k('D3a hàng nhóm có ô icon ly nhỏ theo màu nhóm (<HinhLy trong BanHangMoi.jsx), chữ nhóm giữ nguyên', /<HinhLy\b/.test(bhm) && /tenNhom\[n\] \|\| n/.test(bhm) && /'Tất cả'/.test(bhm));
  k('D3b CSS chip: bo tròn; đang chọn đỏ (nền var(--do), chữ trắng)', co(GB('.bh-tab', 'border-radius'), /^999px$/) && co(GB('.bh-tab.bh-chon', 'background'), /^var\(--bh-do\)$|^var\(--do\)$/) && co(GB('.bh .bh-tab.bh-chon', 'color'), /^#fff$|^white$/));

  muc('D4 · giỏ hàng như tờ bill giấy');
  k('D4a .bh-cot-gio nền giấy + mép dưới răng cưa (mask)', co(GB('.bh-cot-gio', 'background'), /^var\(--giay\)$/) && /(gradient)/.test(L(GB('.bh-cot-gio', '-webkit-mask') || GB('.bh-cot-gio', 'mask'))), `${GB('.bh-cot-gio', 'background')} | ${GB('.bh-cot-gio', 'mask')}`);
  k('D4b mỗi dòng giỏ ngăn bằng nét đứt', co(GB('.bh-dong', 'border-bottom'), /dashed/));
  k('D4c dòng Tổng: vạch đậm phía trên + số Playfair đỏ to (.bh-tien-dong.bh-tong)', co(GB('.bh-tien-dong.bh-tong', 'border-top'), /^2px solid/) && co(GB('.bh-tien-dong.bh-tong span:last-child', 'font-family'), /playfair|font-chu-dep/) && co(GB('.bh-tien-dong.bh-tong span:last-child', 'color'), /bh-do|var\(--do\)|#b91c1c/), `${GB('.bh-tien-dong.bh-tong', 'border-top')} | ${GB('.bh-tien-dong.bh-tong span:last-child', 'font-family')}`);
  { const tt = DOCCL('pages', 'BanHang', 'ThuTien.jsx').replace(/\s+/g, ' ');
    k('D4d ThuTien.jsx: nút Tiền mặt có icon <IconTien />, Chuyển khoản có icon <IconQr /> — chữ nút NGUYÊN (liền sau icon, không đổi `>Tiền mặt</button>`); KHÔNG import thư viện icon vào file này (bài KET-NOI-1 dựng nó với React tối giản)', /<IconTien \/>Tiền mặt<\/button>/.test(tt) && /<IconQr \/>Chuyển khoản<\/button>/.test(tt) && !/from 'lucide-react'/.test(tt));
    k('D5a ThuTien.jsx: chữ + thứ tự nút không đổi (Tiền mặt → Chuyển khoản → Trừ tài khoản; Đã nhận tiền; Hiện mã QR · …)', /Tiền mặt<\/button>.*Chuyển khoản<\/button>.*Trừ tài khoản<\/button>/.test(tt) && />Đã nhận tiền<\/button>/.test(tt) && /Hiện mã QR · \{vnd\(phaiTra\)\}<\/button>/.test(tt)); }
  k('D4e điện thoại: thanh giỏ (.bh-thanh-gio .bh-nut) đỏ đậm như mẫu — gradient #931c1b → #7f1d1d', co(GB('.bh-thanh-gio .bh-nut', 'background'), /linear-gradient.*#931c1b.*(#7f1d1d|var\(--do-dam\))/), String(GB('.bh-thanh-gio .bh-nut', 'background')));
  k('D5b cột / bố cục màn Bán hàng không đổi: 2 cột (.bh-than flex), giỏ rộng 380px, 4 chỗ gọi onThu/onCachTra… còn trong BanHangMoi', co(GB('.bh-cot-gio', 'width'), /^380px$/) && co(GB('.bh-than', 'display'), /^flex$/) && /onThu=\{thu\}/.test(bhm) && /onCachTra=\{doiCachTra\}/.test(bhm));
  k('D5c màn Bán hàng KHÔNG thêm lời chào / ô "Đã bán · Doanh thu" (phiếu D5)', !/Chào buổi|Đã bán|Doanh thu/.test(bhm));
  k('D5d màn Bán hàng KHÔNG thêm lời gọi máy chủ mới: BanHangMoi.jsx không có `fetch(` và không import thêm API ngoài danh sách cũ', !/\bfetch\s*\(/.test(bhm) && /import \{ api, customersV2Api, goiNapApi, ordersApi, productsApi, thanhToanApi \} from '\.\.\/\.\.\/utils\/api'/.test(bhm));

  // ═══ E · Quản lý ═══
  muc('E1 · 6 thẻ nhóm có ô icon màu');
  let MN = null;
  try { MN = dung(`export * from ${J(['pages', 'QuanLy', 'menu.js'])};`); } catch (e) { k('E1a nạp được menu.js', false, String(e.message).split('\n')[0]); }
  const MAU_NHOM = { 'Món & giá': 'vang', 'Cài đặt quán': 'vang', 'Khách & thẻ': 'lam', 'Nhân viên': 'lam', 'Khuyến mãi': 'do', 'Tiền & báo cáo': 'luc' };
  const ql = DOCCL('pages', 'QuanLy', 'QuanLy.jsx');
  if (MN) {
    const nhom = MN.luoiQuanLy(() => true);
    k('E1a luoiQuanLy(chủ quán) vẫn đủ 6 nhóm', nhom.length === 6, nhom.map((g) => g.ten).join(' · '));
    for (const g of nhom) {
      k(`E1b nhóm "${g.ten}": mau = ${MAU_NHOM[g.ten]} + có tên icon`, g.mau === MAU_NHOM[g.ten] && typeof g.icon === 'string' && /^[A-Z][A-Za-z0-9]+$/.test(g.icon), `mau=${g.mau} icon=${g.icon}`);
      k(`E1c nhóm "${g.ten}": QuanLy.jsx nhập + ánh xạ icon ${g.icon} từ lucide-react`, typeof g.icon === 'string' && (ql.match(new RegExp(`\\b${g.icon}\\b`, 'g')) || []).length >= 2 && /from 'lucide-react'/.test(ql));
    }
  }
  k('E1d CSS: bốn lớp màu thẻ (--mau): vàng #c8962e · lam #29406b · đỏ #b91c1c · lục #3f7a45',
    [['vang', '#c8962e'], ['lam', '#29406b'], ['do', '#b91c1c'], ['luc', '#3f7a45']].every(([m, v]) => L(G(`.ql-mau-${m}`, '--mau')) === v), ['vang', 'lam', 'do', 'luc'].map((m) => G(`.ql-mau-${m}`, '--mau')).join(' '));
  k('E1e tên nhóm Playfair; mỗi dòng có "›" (.ql-nut::after hoặc .ql-chevron); máy tính vẫn lưới 3 cột', co(G('.ql-the-ten', 'font-family'), /playfair|font-chu-dep/) && /ql-chevron/.test(ql) && co(G('.ql-luoi', 'grid-template-columns', 1280), /repeat\(3/));
  k('E1f dòng danh sách ở điện thoại giữ GIAO-DIEN-2: cao ≥ 52px, 1 cột (≤ 768px)', /^(5[2-9]|[6-9]\d)px$/.test(L(G('.ql-nut', 'min-height', 390))) && co(G('.ql-luoi', 'grid-template-columns', 390), /^1fr$/));

  // ═══ R · vòng sửa 1 (soát độc lập 28.11) — mỗi ca ứng một lỗi người soát tìm ra ═══
  muc('R · lỗi soát độc lập: vạch vàng bị cắt · thẻ Nạp/Thẻ mất khung · .bh-to quá rộng · tờ in `.card-title` · ly topping · màu thiếu');
  const so = (v) => { const m = /^(-?\d+(?:\.\d+)?)(px|rem)?$/.exec(L(v)); return m ? Number(m[1]) : NaN; };
  k('R1 vạch vàng (.nav-item.active::before) nằm TRONG mục (left ≥ 0): `.sidebar-nav` có overflow-y nên phần nhô ra ngoài (left âm) bị CẮT mất',
    so(G('.nav-item.active::before', 'left')) >= 0,`left=${G('.nav-item.active::before', 'left')} overflow-y=${G('.sidebar-nav', 'overflow-y')}`);
  { const doan = bhm.split('<button className="bh-mon"').slice(1).map((d) => d.slice(0, d.indexOf('</button>')));
    k('R2 MỌI thẻ `bh-mon` (món, Nạp tiền, Thẻ thành viên, Chủ quán cấp) bọc chữ trong .bh-chu-mon — .bh-mon không còn padding, thiếu khung thì chữ dính mép', doan.length >= 4 && doan.every((d) => /className="bh-chu-mon"/.test(d)), `${doan.length} thẻ · có khung: ${doan.filter((d) => /bh-chu-mon/.test(d)).length}`); }
  k('R3a `.bh-to button` GIỮ cách xếp cột cũ (ô tiền khách đưa: số trên, "trả lại" dưới, canh trái)', co(GB('.bh-to button', 'flex-direction'), /^column$/) && co(GB('.bh-to button', 'align-items'), /^flex-start$/), `${GB('.bh-to button', 'flex-direction')} / ${GB('.bh-to button', 'align-items')}`);
  { const tt = DOCCL('pages', 'BanHang', 'ThuTien.jsx');
    k('R3b chỉ HAI nút có icon (Tiền mặt, Chuyển khoản) mang lớp riêng bh-nut-ic xếp hàng ngang giữa', co(GB('.bh-to .bh-nut-ic', 'flex-direction'), /^row$/) && (tt.match(/bh-nut-ic/g) || []).length === 2, `${(tt.match(/bh-nut-ic/g) || []).length} chỗ`); }
  k('R4a in không đổi — lớp `.card-title` (tiêu đề phiếu Kho in: XemPhieu / KiemKe) trả đúng phông thừa hưởng + màu #b91c1c + cỡ 1rem như hôm nay', I('.card-title', 'color') === '#b91c1c' && I('.card-title', 'font-family') === 'inherit' && I('.card-title', 'font-size') === '1rem' && I('.card-title', 'font-weight') === '600', `${I('.card-title', 'color')} | ${I('.card-title', 'font-family')}`);
  k('R4b in không đổi — `.table th` màu #b91c1c như hôm nay', I('.table th', 'color') === '#b91c1c', I('.table th', 'color'));
  { const kc = DOCCL('pages', 'BanHang', 'KhungChonMon.jsx');
    k('R5 KhungChonMon.jsx (trong Phạm vi): ô ảnh topping truyền nhóm (`nhom=`), không còn prop chết `ten=`', /<AnhMon\b[^>]*\bnhom=\{t\.category\}/.test(kc) && !/<AnhMon\b[^>]*\bten=/.test(kc)); }
  k('R6 .ql-the-o: màu có dự phòng khi nhóm thiếu / lạ `mau` (var(--mau, …)) — không thành ô trong suốt chữ trắng', /^var\(--mau, ?var\(--dat\)\)$/.test(L(G('.ql-the-o', 'background'))), String(G('.ql-the-o', 'background')));
  k('R7 chip nhóm: đệm hai bên bằng nhau (chip Topping / Nạp tiền / Thẻ không có ô icon); chip CÓ ô icon thu đệm trái bằng lớp riêng (bh-tab-co-ic)', /^\S+ \S+$/.test(L(GB('.bh-tab', 'padding'))) && so(GB('.bh-tab-co-ic', 'padding-left')) > 0 && /bh-tab-co-ic/.test(bhm), `${GB('.bh-tab', 'padding')} | ${GB('.bh-tab-co-ic', 'padding-left')}`);
  k('R8 AnhMon không dùng Object.hasOwn (lần đầu xuất hiện ở client/src; iPad / iPhone cũ < iOS 15.4 sập cả màn Bán hàng)', !/Object\.hasOwn\(/.test(DOCCL('pages', 'BanHang', 'AnhMon.jsx')));

  // ═══ F · nối vào bộ kiểm ═══
  muc('F1 · nối vào bộ kiểm');
  const kt = DOC('kiem_tra_truoc_khi_giao.js');
  k("F1a kiem_tra_truoc_khi_giao.js có chayBaiThat('cong_cu/thu_GIAODIEN4.js') (không bị comment)", /^\s*chayBaiThat\('cong_cu\/thu_GIAODIEN4\.js'\)/m.test(kt));
  k('F1b thu_GIAODIEN3.js vẫn còn trong bộ kiểm (phép của GIAO-DIEN-3: min-width 0, text-size-adjust, tab Kho)', /^\s*chayBaiThat\('cong_cu\/thu_GIAODIEN3\.js'\)/m.test(kt));

  console.log(`\nSỐ CA: ${dat + hong}`);
  console.log(`${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { console.log(`  ✗ bài thử sập — ${e.stack || e.message}`); console.log(`${dat} đạt · ${hong + 1} hỏng`); process.exit(1); });
