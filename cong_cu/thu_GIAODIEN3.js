#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ GIAO-DIEN-3 — màn hình vừa khít mọi thiết bị: khung chung không kéo trang rộng ra, iPhone không tự phóng chữ,
 *  hàng tab Kho xuống dòng ở máy tính (điện thoại giữ một hàng cuộn ngang)
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (index.css chưa có `.main-content { min-width: 0 }` / text-size-adjust, kho.css chưa có khối 769px).
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_GIAODIEN3.js [--goc <thư mục gốc bản sao>]      (in "n đạt · m hỏng")
 *  Không cần trình duyệt: đọc file CSS, dựng "giá trị hiệu lực của một thuộc tính ở bề rộng màn W" (luật media min/max-width, câu sau thắng câu trước).
 *  GIỚI HẠN (nói thẳng): chỉ so selector NGUYÊN VĂN (`.main-content`, không tính độ ưu tiên giữa selector khác nhau), media chỉ hiểu
 *  `(min-width: Npx)` / `(max-width: Npx)` nối bằng `and` — điều kiện lạ coi như không áp. Đo bề ngang thật bằng Chrome: xem trang_thai.md (C3).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const path = require('path');

const iG = process.argv.indexOf('--goc');
const GOC = path.resolve(iG > 0 ? process.argv[iG + 1] : path.join(__dirname, '..'));
const DOC = (...p) => { try { return fs.readFileSync(path.join(GOC, ...p), 'utf8'); } catch { return ''; } };

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);

// ── bộ đọc CSS tối thiểu ────────────────────────────────────────────────────
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
function khoiNgoac(s, a) {   // s[a] === '{' → chỉ số ngay sau '}' khớp (đếm ngoặc)
  let sau = 1, j = a + 1;
  while (j < s.length && sau > 0) { if (s[j] === '{') sau++; else if (s[j] === '}') sau--; j++; }
  return j;
}
function phanTich(css, dk = '') {   // → [{ dk, chon: [selector], khai: [[thuộc tính, giá trị]] }] theo thứ tự trong file
  const s = boChuThich(css), ra = [];
  let i = 0;
  while (i < s.length) {
    const a = s.indexOf('{', i), cham = s.indexOf(';', i);
    if (a < 0) break;
    if (cham >= 0 && cham < a && /^\s*@/.test(s.slice(i, cham))) { i = cham + 1; continue; }   // @import / @charset
    const dau = s.slice(i, a).trim(), j = khoiNgoac(s, a), than = s.slice(a + 1, j - 1);
    if (/^@media\b/i.test(dau)) ra.push(...phanTich(than, dau.replace(/\s+/g, ' ').replace(/\(\s*([\w-]+)\s*:\s*/g, '($1: ').replace(/\s*\)/g, ')').toLowerCase()));   // `(min-width:769px)` = `(min-width: 769px)`
    else if (!dau.startsWith('@')) {
      ra.push({
        dk, chon: dau.split(',').map((x) => x.trim()),
        khai: than.split(';').map((d) => { const m = /^\s*([\w-]+)\s*:\s*([\s\S]*?)\s*$/.exec(d); return m ? [m[1].toLowerCase(), m[2].replace(/\s*!important\s*$/i, '').trim().toLowerCase()] : null; }).filter(Boolean),
      });
    }   // @keyframes / @font-face / @supports: bỏ cả khối
    i = j;
  }
  return ra;
}
function apDung(dk, rong) {   // '' = áp mọi cỡ; điều kiện lạ = KHÔNG áp
  if (!dk) return true;
  const m = /^@media\s+(.*)$/.exec(dk);
  if (!m) return false;
  const dieuKien = m[1].split(/\s+and\s+/);
  return dieuKien.every((c) => {
    const x = /^\(\s*(min|max)-width\s*:\s*(\d+(?:\.\d+)?)px\s*\)$/.exec(c.trim());
    return !!x && (x[1] === 'min' ? rong >= Number(x[2]) : rong <= Number(x[2]));
  });
}
function giaTri(luat, chon, thuocTinh, rong) {   // giá trị hiệu lực ở bề rộng `rong` (câu sau thắng), undefined nếu chưa ai đặt
  let kq;
  for (const r of luat) {
    if (!r.chon.includes(chon) || !apDung(r.dk, rong)) continue;
    for (const [p, v] of r.khai) if (p === thuocTinh) kq = v;
  }
  return kq;
}
const laSoKhong = (v) => typeof v === 'string' && /^0(\.0+)?([a-z%]+)?$/.test(v);   // `0`, `0px`, `0rem` — so GIÁ TRỊ bằng 0, không so chuỗi

const dan = (css, chon, tt, rong) => giaTri(phanTich(css), chon, tt, rong);
const RONG = { dienThoai: 390, bienDuoi: 768, bienTren: 769, bangTinh: 820, mayTinh: 1280 };

async function main() {
  // ═══ 0 · bộ đọc tự thử (ca XANH + ca ĐỎ trên CSS giả — K3: bài thử không tự xanh oan) ═══
  muc('0 · bộ đọc CSS: ca giả');
  const GIA = '.main-content { flex: 1; min-width: 0px; }';
  k('0a min-width: 0px đạt (so giá trị bằng 0, không so chuỗi)', laSoKhong(dan(GIA, '.main-content', 'min-width', 1280)));
  k('0b `min-width: 0` và `0 !important` cũng đạt', laSoKhong(dan('.main-content{min-width:0}', '.main-content', 'min-width', 390)) && laSoKhong(dan('.main-content{min-width:0 !important}', '.main-content', 'min-width', 390)));
  k('0c xoá dòng → ĐỎ (không có giá trị)', !laSoKhong(dan('.main-content { flex: 1; }', '.main-content', 'min-width', 1280)));
  k('0d chỉ đặt trong @media 768 → ĐỎ ở 1280, đạt ở 390', !laSoKhong(dan('@media (max-width: 768px) { .main-content { min-width: 0; } }', '.main-content', 'min-width', 1280))
    && laSoKhong(dan('@media (max-width: 768px) { .main-content { min-width: 0; } }', '.main-content', 'min-width', 390)));
  k('0e câu sau thắng: ngoài @media có 0 nhưng câu sau đặt 600px → ĐỎ', !laSoKhong(dan('.main-content{min-width:0} .main-content{min-width:600px}', '.main-content', 'min-width', 1280)));
  k('0f selector khác (`.main-content-x`, `.a .main-content`) không tính', dan('.main-content-x{min-width:0} .a .main-content{min-width:0}', '.main-content', 'min-width', 390) === undefined);
  k('0g selector trong danh sách phẩy được tính', laSoKhong(dan('.a, .main-content { min-width: 0; }', '.main-content', 'min-width', 390)));
  k('0h chú thích không tính', dan('/* .main-content { min-width: 0; } */ .x{}', '.main-content', 'min-width', 390) === undefined);
  k('0i biên media: max-width 768 áp ở 768, không áp ở 769; min-width 769 ngược lại',
    dan('@media (max-width: 768px){.a{c:1}}', '.a', 'c', 768) === '1' && dan('@media (max-width: 768px){.a{c:1}}', '.a', 'c', 769) === undefined
    && dan('@media (min-width: 769px){.a{c:1}}', '.a', 'c', 769) === '1' && dan('@media (min-width: 769px){.a{c:1}}', '.a', 'c', 768) === undefined);
  k('0j media lạ (print) không áp; @keyframes không lẫn vào', dan('@media print { .a{c:1} } @keyframes x { from{c:2} to{c:3} }', '.a', 'c', 1280) === undefined
    && dan('@keyframes x { from{c:2} } .a{c:9}', '.a', 'c', 1280) === '9');
  k('0k @import / @charset không làm lệch', dan('@import url(x.css); .a{c:7}', '.a', 'c', 1280) === '7');
  k('0l viết `@media(min-width:769px)` không dấu cách vẫn là điều kiện `(min-width: 769px)` (không đỏ oan)', phanTich('@media (min-width:769px){.a{c:1}}')[0].dk === '@media (min-width: 769px)'
    && phanTich('@media  ( min-width : 769px ) {.a{c:1}}')[0].dk === '@media (min-width: 769px)');

  // ═══ A · khung chung (index.css) ═══
  muc('A1 · `.main-content { min-width: 0 }` ở quy tắc gốc — áp mọi cỡ màn');
  const css = DOC('client', 'src', 'index.css');
  const luat = phanTich(css);
  const mc = (w) => giaTri(luat, '.main-content', 'min-width', w);
  k('T1a điện thoại 390 px: min-width = 0', laSoKhong(mc(RONG.dienThoai)), String(mc(RONG.dienThoai)));
  k('T1b biên 768 / 769 px: min-width = 0 cả hai phía (không chỉ nằm trong @media 768)', laSoKhong(mc(RONG.bienDuoi)) && laSoKhong(mc(RONG.bienTren)), `${mc(768)} / ${mc(769)}`);
  k('T1c máy tính bảng 820 px và máy tính 1280 px: min-width = 0', laSoKhong(mc(RONG.bangTinh)) && laSoKhong(mc(RONG.mayTinh)), `${mc(820)} / ${mc(1280)}`);
  k('T1d KHÔNG đổi flex / margin-left: 1280 px → flex 1, margin-left 240px; 390 px → margin-left 0',
    giaTri(luat, '.main-content', 'flex', RONG.mayTinh) === '1' && giaTri(luat, '.main-content', 'margin-left', RONG.mayTinh) === '240px'
    && giaTri(luat, '.main-content', 'margin-left', RONG.dienThoai) === '0');
  k('T1e KHÔNG giấu tràn bằng overflow-x: hidden ở html / body / .app-layout / .main-content (phương án đã loại)',
    ['html', 'body', '.app-layout', '.main-content'].every((c) => { const v = giaTri(luat, c, 'overflow-x', RONG.dienThoai), w = giaTri(luat, c, 'overflow', RONG.dienThoai); return v !== 'hidden' && w !== 'hidden'; }));

  muc('A2 · iPhone không tự phóng chữ');
  const ts = (tt, w) => giaTri(luat, 'html', tt, w);
  k('T2a html có -webkit-text-size-adjust: 100%', ts('-webkit-text-size-adjust', RONG.dienThoai) === '100%', String(ts('-webkit-text-size-adjust', RONG.dienThoai)));
  k('T2b html có text-size-adjust: 100% (chuẩn)', ts('text-size-adjust', RONG.dienThoai) === '100%', String(ts('text-size-adjust', RONG.dienThoai)));
  k('T2c áp mọi cỡ màn (không nằm trong @media): 1280 px cũng 100%', ts('-webkit-text-size-adjust', RONG.mayTinh) === '100%' && ts('text-size-adjust', RONG.mayTinh) === '100%');

  muc('T3 · thẻ viewport: vẫn cho phóng to bằng hai ngón');
  const html = DOC('client', 'index.html');
  const vp = (/<meta\s+name="viewport"\s+content="([^"]*)"/i.exec(html) || [])[1] || '';
  const vpMap = Object.fromEntries(vp.split(',').map((x) => x.split('=').map((y) => y.trim().toLowerCase())).filter((x) => x[0]));
  k('T3a có thẻ viewport với width=device-width', vpMap.width === 'device-width', vp);
  k('T3b KHÔNG có user-scalable=no / 0', !['no', '0'].includes(vpMap['user-scalable']), vp);
  k('T3c maximum-scale (nếu có) ≥ 2 — người dùng phóng to được', vpMap['maximum-scale'] === undefined || Number(vpMap['maximum-scale']) >= 2, vp);

  muc('A3 · lớp `.table-responsive` (5 chỗ dùng: DoiSoat, DiscountCodes, Reports) phải có CSS cuộn ngang — bảng 600 px ở điện thoại không thò ra ngoài thẻ');
  const cuonNgang = (w) => giaTri(luat, '.table-responsive', 'overflow-x', w) === 'auto' && !['hidden', 'visible', 'clip'].includes(giaTri(luat, '.table-responsive', 'overflow', w));   // viết tắt `overflow` đặt SAU cũng tính (như T1e)
  k('T5a `.table-responsive` có overflow-x: auto ở điện thoại 390 px và máy tính 1280 px, không bị `overflow: hidden/visible` viết tắt đè', cuonNgang(RONG.dienThoai) && cuonNgang(RONG.mayTinh),
    `${giaTri(luat, '.table-responsive', 'overflow-x', 390)} / ${giaTri(luat, '.table-responsive', 'overflow-x', 1280)} · overflow: ${giaTri(luat, '.table-responsive', 'overflow', 390)}`);
  k('T5b bảng vẫn 600 px ở điện thoại (quy tắc cũ `.table { min-width: 600px }` trong @media 768 không đổi) và 100% bề ngang ở máy tính',
    giaTri(luat, '.table', 'min-width', RONG.dienThoai) === '600px' && giaTri(luat, '.table', 'min-width', RONG.mayTinh) === undefined && giaTri(luat, '.table', 'width', RONG.mayTinh) === '100%');

  // ═══ B · hàng tab Kho ═══
  muc('B1 · `.kho-tabs`: máy tính xuống dòng, điện thoại một hàng cuộn ngang');
  const khoCss = DOC('client', 'src', 'pages', 'Kho', 'kho.css');
  const lk = phanTich(khoCss);
  const kt = (tt, w) => giaTri(lk, '.kho-tabs', tt, w);
  const wrap = (w) => kt('flex-wrap', w) === 'wrap';
  k('T4a điện thoại 390 px và biên 768 px: KHÔNG wrap, overflow-x: auto (một hàng cuộn ngang như cũ)',
    [RONG.dienThoai, RONG.bienDuoi].every((w) => !wrap(w) && kt('overflow-x', w) === 'auto'), `390: ${kt('flex-wrap', 390)}/${kt('overflow-x', 390)} · 768: ${kt('flex-wrap', 768)}/${kt('overflow-x', 768)}`);
  k('T4b máy tính bảng 820 px, biên 769 px và máy tính 1280 px: flex-wrap: wrap + overflow-x: visible',
    [RONG.bienTren, RONG.bangTinh, RONG.mayTinh].every((w) => wrap(w) && kt('overflow-x', w) === 'visible'), `769: ${kt('flex-wrap', 769)}/${kt('overflow-x', 769)} · 1280: ${kt('flex-wrap', 1280)}/${kt('overflow-x', 1280)}`);
  const khoiWrap = lk.filter((r) => r.chon.includes('.kho-tabs') && r.khai.some(([p, v]) => p === 'flex-wrap' && v === 'wrap'));
  k('T4c flex-wrap: wrap CHỈ nằm trong đúng MỘT khối `@media (min-width: 769px)` — không đặt ngoài @media', khoiWrap.length === 1 && khoiWrap[0].dk === '@media (min-width: 769px)', khoiWrap.map((r) => r.dk || '(ngoài @media)').join(' | '));
  k('T4d vẫn là hàng flex có khoảng cách (display: flex · gap) ở mọi cỡ', [RONG.dienThoai, RONG.mayTinh].every((w) => kt('display', w) === 'flex' && kt('gap', w) === '0.5rem'));
  k('T4e ngưỡng khớp index.css: có @media (max-width: 768px) (769 = 768 + 1)', luat.some((r) => r.dk === '@media (max-width: 768px)'));

  // ═══ C · nối vào bộ kiểm ═══
  muc('C1 · kiem_tra_truoc_khi_giao.js');
  k("C1 có chayBaiThat('cong_cu/thu_GIAODIEN3.js')", /^\s*chayBaiThat\('cong_cu\/thu_GIAODIEN3\.js'\)/m.test(DOC('kiem_tra_truoc_khi_giao.js')));

  console.log(`\n${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { console.log('BÀI SẬP: ' + (e.stack || e.message)); console.log(`\n${dat} đạt · ${hong + 1} hỏng`); process.exit(2); });
