#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KH-QUAY-2 — (A) quầy cấp mã đăng nhập App cho SĐT MỚI · (B) hoá đơn khách chỉ còn khổ nhiệt 58mm / 80mm · (C) K5 giữ nguyên
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có ô số mới, chưa có hàm khoHoaDon, hoá đơn còn chọn A4 / A5). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KHQUAY2.js
 *  Hàm thuần: GỌI THẲNG client/src/utils/{maApp,inPhieu}.js. Giao diện (.jsx) không chạy được trong node → đọc NGUỒN, bắt theo hành vi
 *  (bảng khổ, danh sách <option>, thành phần được gắn), không dò một tên biến. Máy chủ: database.js thật + libsql thật trên file kho TẠM.
 *  Bản đột biến: --goc <thư mục gốc kho> (viec/KH-QUAY-2/dot_bien.py chép kho ra thư mục tạm rồi thay chuỗi).
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const iG = process.argv.indexOf('--goc');
const GOC = iG > 0 ? path.resolve(process.argv[iG + 1]) : path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khquay2_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_khquay2_nv_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_khquay2_kh_' + Date.now();
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_khquay2';

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };

const doc = (f) => { try { return fs.readFileSync(path.join(GOC, f), 'utf8'); } catch { return ''; } };
const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const nap = (f) => import(pathToFileURL(path.join(GOC, f)).href);

/** Khoá của một đối tượng JS viết dạng `{ '58mm': {…}, a5: {…} }` — chỉ các khoá cấp 1 (đầu dòng thụt đúng một bậc) trong khối `const <ten> = {…};`. */
function khoaBang(nguon, ten) {
  const m = new RegExp('const ' + ten + ' = \\{\\n([\\s\\S]*?)\\n\\};').exec(nguon);
  if (!m) return null;
  return [...m[1].matchAll(/^ {2}(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9_]+)):/gm)].map((x) => x[1] || x[2] || x[3]);
}
const conA4A5 = (s) => /(^|[^A-Za-z0-9])(a5|a4)([^A-Za-z0-9]|$)/i.test(s);

async function main() {
  const maApp = await nap('client/src/utils/maApp.js');
  const inPhieu = await nap('client/src/utils/inPhieu.js');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A1] Hàm chuẩn hoá SĐT của ô "số mới" (utils/maApp.js chuanSdtQuay)');
  const cs = (v) => { try { return maApp.chuanSdtQuay(v); } catch { return 'LỖI: chưa có hàm'; } };   // thiếu hàm → mọi ca dưới ĐỎ, số ca không đổi
  k('A1 có hàm chuanSdtQuay', typeof maApp.chuanSdtQuay === 'function');
  {
    k('A1 "0912345678" → giữ nguyên', cs('0912345678') === '0912345678', String(cs('0912345678')));
    k('A1 có khoảng trắng / chấm / gạch → bỏ', cs(' 0912 345.678 ') === '0912345678' && cs('0912-345-678') === '0912345678');
    k('A1 +84 / 84 đầu → 0 (cùng luật normalizePhone của quầy)', cs('+84 912 345 678') === '0912345678' && cs('84912345678') === '0912345678');
    k('A1 11 số bắt đầu 0 vẫn hợp lệ (ranh giới trên: 0 + 10 số)', cs('09123456789') === '09123456789');
    k('A1 ranh giới dưới: 0 + 9 số = 10 số hợp lệ, 9 số KHÔNG', cs('0912345678') !== null && cs('091234567') === null);
    k('A1 ranh giới trên: 12 số KHÔNG hợp lệ', cs('091234567890') === null);
    k('A1 rỗng / chỉ khoảng trắng / chữ / số ngắn → null (không gọi máy chủ)', cs('') === null && cs('   ') === null && cs('abc') === null && cs('123') === null && cs(undefined) === null && cs(null) === null);
    k('A1 không bắt đầu bằng 0 (sau chuẩn hoá) → null', cs('9123456789') === null && cs('1912345678') === null);
    k('A1 trả chuỗi sạch chỉ gồm chữ số (an toàn để gửi)', /^0\d{9,10}$/.test(cs('+84 (912) 345-678') || ''));
  }

  muc('[A2] Giao diện — ô "Mã đăng nhập App cho số mới" (đọc nguồn)');
  const qs = doc('client/src/components/MaAppSoMoi.jsx');
  const kh = doc('client/src/pages/Customers.jsx');
  const ma = doc('client/src/components/MaDangNhapApp.jsx');
  k('A2 có components/MaAppSoMoi.jsx', qs.length > 0);
  k('A2 ô dùng lại MaDangNhapApp (không viết lại mã + đếm ngược)', /import\s+MaDangNhapApp\s+from\s+'\.\/MaDangNhapApp'/.test(qs) && /<MaDangNhapApp\b/.test(qs));
  const bienKiem = (/const\s+(\w+)\s*=\s*chuanSdtQuay\(/.exec(qs) || [])[1];
  k('A2 SĐT sai dạng bị chặn: số đưa đi chỉ lấy từ kết quả chuanSdtQuay (không dùng chữ gõ thô)', !!bienKiem && /import[^;]*chuanSdtQuay[^;]*maApp/.test(qs)
    && new RegExp('setSdt\\(' + bienKiem + '\\b').test(qs) && !/setSdt\(go\b/.test(qs), String(bienKiem));
  k('A2 MaDangNhapApp (nơi duy nhất gọi máy chủ) chỉ hiện khi đã có số qua kiểm: {sdt && <MaDangNhapApp', /\{sdt\s*&&\s*<MaDangNhapApp\b/.test(qs));
  k('A2 SĐT sai dạng → báo lỗi ngay trong ô (có chỗ hiện lời báo)', /setLoi\(\s*s\s*\?\s*''\s*:\s*'[^']*SĐT[^']*'\s*\)/.test(qs) || /setLoi\(\s*s\s*\?\s*''\s*:\s*`[^`]*SĐT[^`]*`\s*\)/.test(qs));
  k('A2 MaDangNhapApp có prop tuLay: vào là lấy mã (ô số mới không bắt bấm hai lần)', /if \(tuLay\) layMa\(\)/.test(ma) && /<MaDangNhapApp\b[^>]*\btuLay\b/.test(qs));
  k('A2 ô KHÔNG tự gọi máy chủ (chỉ MaDangNhapApp gọi /kh/cap-ma)', !/api\.(post|get|put)|fetch\(/.test(qs) && /api\.post\('\/kh\/cap-ma'/.test(ma));
  k('A2 ô KHÔNG tạo khách và KHÔNG ghi mã ra ngoài state', !/customers|localStorage|sessionStorage/i.test(qs));
  k('A2 có chỗ nhập SĐT (input) và nút', /<input\b/.test(qs) && /<button\b/.test(qs));
  k('A2 màn Khách hàng gắn <MaAppSoMoi />', /import\s+MaAppSoMoi\s+from\s+'\.\.\/components\/MaAppSoMoi'/.test(kh) && /<MaAppSoMoi\b/.test(kh));
  k('A2 ô nằm NGOÀI khung chi tiết khách (trước modal chi tiết hoặc ở đầu màn): gắn đúng 1 lần', (kh.match(/<MaAppSoMoi\b/g) || []).length === 1);

  muc('[A3] Máy chủ: cấp mã cho SĐT chưa là khách → 200, KHÔNG tạo khách, không đổi máy chủ');
  {
    imLang();
    const express = require(path.join(GOC, 'node_modules', 'express'));
    const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
    const db = require(path.join(GOC, 'server', 'database.js'));
    await db.initDatabase();
    const app = express();
    app.use(express.json());
    app.use('/api/pos/kh', require(path.join(GOC, 'server', 'routes', 'kh', 'quay.js')));
    const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
    const goc = `http://127.0.0.1:${sv.address().port}/api`;
    const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
    const tk = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
    const goi = async (than, token = tk) => {
      const h = { 'Content-Type': 'application/json' };
      if (token) h.Authorization = 'Bearer ' + token;
      const r = await fetch(goc + '/pos/kh/cap-ma', { method: 'POST', headers: h, body: JSON.stringify(than) });
      let j = {}; try { j = JSON.parse(await r.text()); } catch { /* không phải JSON */ }
      return { status: r.status, j };
    };
    const dem = async () => (await db.queryOne('SELECT COUNT(*) AS n FROM pos_customers')).n;
    const truoc = await dem();
    const moi = '0933000111';
    const co = await db.queryOne('SELECT 1 AS co FROM pos_customers WHERE phone = ?', [moi]);
    const r = await goi({ sdt: moi });
    const sau = await dem();
    const kh2 = await db.queryOne('SELECT 1 AS co FROM pos_customers WHERE phone = ?', [moi]);
    noiLai();
    k('A3 (điều kiện) SĐT thử chưa là khách', !co);
    k('A3 SĐT chưa là khách → 200 + mã 6 số + het_han_giay', r.status === 200 && /^\d{6}$/.test(String(r.j.ma)) && Number(r.j.het_han_giay) > 0, `HTTP ${r.status} ${JSON.stringify(r.j)}`);
    k('A3 bảng khách KHÔNG thêm dòng nào', truoc === sau && !kh2, `${truoc} → ${sau}`);
    imLang();
    const sai = await goi({ sdt: 'abc' });
    const khongToken = await goi({ sdt: moi }, null);
    noiLai();
    k('A3 SĐT sai dạng → 400 SDT_KHONG_HOP_LE; không token → 401', sai.status === 400 && sai.j.code === 'SDT_KHONG_HOP_LE' && khongToken.status === 401, `${sai.status}/${khongToken.status}`);
    sv.close();
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B1] Hàm khổ hoá đơn dùng chung (utils/inPhieu.js khoHoaDon)');
  const kho = (v) => { try { return inPhieu.khoHoaDon(v); } catch { return 'LỖI: chưa có hàm'; } };
  k('B1 có hàm khoHoaDon', typeof inPhieu.khoHoaDon === 'function');
  {
    k("B1 'a5' / 'a4' → '80mm'", kho('a5') === '80mm' && kho('a4') === '80mm', `${kho('a5')} ${kho('a4')}`);
    k("B1 rỗng / undefined / null / lạ / hoa-thường lạ → '80mm'", ['', undefined, null, 'xyz', 'A5', 'A4', 0, {}].every((v) => kho(v) === '80mm'));
    k("B1 khổ nhiệt giữ nguyên: '58mm' → '58mm', '80mm' → '80mm'", kho('58mm') === '58mm' && kho('80mm') === '80mm');
    k("B1 khổ của tem / phiếu pha chế KHÔNG phải khổ hoá đơn → '80mm'", kho('40x30') === '80mm');
  }
  k('B1 KHO_BILL chỉ còn ["58mm","80mm"]', bang(inPhieu.KHO_BILL, ['58mm', '80mm']), JSON.stringify(inPhieu.KHO_BILL));
  const macDinh = inPhieu.docBoIn({});
  k("B1 không có cài đặt → khổ bill mặc định '80mm'", macDinh.bill.kho === '80mm', macDinh.bill.kho);
  k("B1 cài đặt cũ invoice_default_size = 'a5' / 'a4' → bill.kho '80mm' (không sửa dữ liệu)", inPhieu.docBoIn({ invoice_default_size: 'a5' }).bill.kho === '80mm' && inPhieu.docBoIn({ invoice_default_size: 'a4' }).bill.kho === '80mm');
  k("B1 invoice_default_size = '58mm' → bill.kho '58mm' (khổ nhiệt đã chọn được giữ)", inPhieu.docBoIn({ invoice_default_size: '58mm' }).bill.kho === '58mm');
  k("B1 bộ in đã lưu bill.kho = 'a4' / 'a5' → '80mm'; '58mm' giữ", inPhieu.docBoIn({ [inPhieu.KHOA_BO_IN]: JSON.stringify({ bill: { kho: 'a4' } }) }).bill.kho === '80mm'
    && inPhieu.docBoIn({ [inPhieu.KHOA_BO_IN]: JSON.stringify({ bill: { kho: 'a5' } }) }).bill.kho === '80mm'
    && inPhieu.docBoIn({ [inPhieu.KHOA_BO_IN]: JSON.stringify({ bill: { kho: '58mm' } }) }).bill.kho === '58mm');

  muc('[B2] Giao diện hoá đơn — không còn chỗ chọn A4 / A5 (đọc nguồn)');
  const ip = doc('client/src/components/InvoicePrint.jsx');
  const ipv = doc('client/src/components/InvoicePreview.jsx');
  const is = doc('client/src/pages/InvoiceSettings.jsx');
  const khoaIp = khoaBang(ip, 'PAPER_SIZES');
  k('B2 InvoicePrint: bảng PAPER_SIZES chỉ còn 58mm · 80mm', !!khoaIp && bang(khoaIp, ['58mm', '80mm']), JSON.stringify(khoaIp));
  k('B2 InvoicePrint: khổ khởi tạo đi qua khoHoaDon (khổ lạ không rơi về A5)', /useState\(khoHoaDon\(/.test(ip) &&!/PAPER_SIZES\[paperSize\]\s*\|\|\s*PAPER_SIZES\['a5'\]/.test(ip));
  k('B2 InvoicePrint: hết nhánh in A4 / A5 (@page, bề ngang hộp)', !/'a4'|'a5'|"a4"|"a5"/.test(ip.replace(/\/\/.*$/gm, '')), (ip.match(/.*['"]a[45]['"].*/g) || [])[0]);
  const optIs = [...is.matchAll(/<option\s+value="([^"]*)"/g)].map((x) => x[1]);
  k('B2 InvoiceSettings "Khổ mặc định": chỉ còn <option> 58mm · 80mm', bang(optIs.filter((v) => /mm$|^a[45]$/.test(v)), ['58mm', '80mm']), JSON.stringify(optIs));
  k("B2 InvoiceSettings: khổ mặc định cấu hình không còn 'a5' / 'a4'", !/default_size:\s*["']a[45]["']/.test(is) && !/useState\(["']a[45]["']\)/.test(is) && !/\[\s*"58mm",\s*"80mm",\s*"a5"/.test(is));
  k('B2 InvoiceSettings: giá trị cũ lưu trong cấu hình được đọc qua khoHoaDon (ô chọn hiện đúng khổ, không trống)', /value=\{khoHoaDon\(config\.default_size\)\}/.test(is));
  k("B2 InvoiceSettings: nút xem trước không còn A4 / A5", !/\["58mm",\s*"80mm",\s*"a5",\s*"a4"\]/.test(is));
  const khoaPv = (() => { const m = /const baseStyles = \{\n([\s\S]*?)\n    \};/.exec(ipv); return m ? [...m[1].matchAll(/^ {6}(?:'([^']+)'|([A-Za-z0-9_]+)):/gm)].map((x) => x[1] || x[2]) : null; })();
  k('B2 InvoicePreview: kiểu theo khổ chỉ còn 58mm · 80mm', !!khoaPv && bang(khoaPv, ['58mm', '80mm']), JSON.stringify(khoaPv));
  const khoaTo = khoaBang(ipv, 'CO_TO');
  k('B2 InvoicePreview (HoaDonTo CO_TO): chỉ còn 58mm · 80mm', !!khoaTo && bang(khoaTo, ['58mm', '80mm']), JSON.stringify(khoaTo));
  k("B2 InvoicePreview: không còn khổ mặc định 'a5', không còn nhánh header A5/A4", !/size\s*=\s*'a5'/.test(ipv) && !/baseStyles\['a5'\]/.test(ipv) && !/A5\/A4/.test(ipv));
  k('B2 loại `bill` trong inPhieu.js không còn a4 / a5', !/MAC_DINH_BO_IN[\s\S]{0,200}bill:\s*\{[^}]*'a[45]'/.test(doc('client/src/utils/inPhieu.js')) && !/KHO_BILL\s*=\s*\[[^\]]*a[45]/.test(doc('client/src/utils/inPhieu.js')));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] K5 — phần KHÔNG được đổi');
  k("C1 khổ phiếu pha chế giữ nguyên ['80mm','58mm'], tem ['40x30']", bang(inPhieu.KHO_PHIEU, ['80mm', '58mm']) && bang(inPhieu.KHO_TEM, ['40x30']));
  k("C1 khổ phiếu pha chế / tem mặc định giữ ('80mm' / '40x30')", macDinh.pha_che.kho === '80mm' && macDinh.tem.kho === '40x30');
  k('C1 phiếu pha chế chọn 58mm vẫn được; tem lạ → 40x30', inPhieu.docBoIn({ [inPhieu.KHOA_BO_IN]: JSON.stringify({ pha_che: { kho: '58mm' }, tem: { kho: 'a4' } }) }).pha_che.kho === '58mm');
  const inpPhieu = doc('client/src/components/InPhieu.jsx');
  const xem = doc('client/src/pages/Kho/XemPhieu.jsx');
  k("C2 phiếu kho / in phiếu giữ A5 · A4 (InPhieu.jsx KHO_GIAY, XemPhieu 'In A4')", /KHO_GIAY\s*=\s*\{[^}]*a5[^}]*a4/.test(inpPhieu) && /inRa\('a4'\)/.test(xem));
  k('C3 nút "Mã đăng nhập App" trong chi tiết khách chạy như cũ (key theo SĐT)', /<MaDangNhapApp key=\{selectedCustomer\.phone\} sdt=\{selectedCustomer\.phone\} \/>/.test(kh));
  k('C3 MaDangNhapApp vẫn gọi POST /kh/cap-ma, giữ khoá chống bấm đôi', /api\.post\('\/kh\/cap-ma', \{ sdt \}\)/.test(ma) && /dangBay\.current/.test(ma));
  k('C4 hoá đơn 2 tờ HD-1 vẫn vẽ bằng HoaDonTo (58mm · 80mm)', /export function HoaDonTo/.test(ipv) && /<HoaDonTo\b/.test(ip));
  k("C4 InvoicePrint vẫn truyền khổ cho tờ in lại / in 2 tờ (size={paperSize})", /size=\{paperSize\}/.test(ip));
  k('C5 máy chủ KHÔNG đổi: seed invoice_default_size còn nguyên (dữ liệu thật có thể đang là a5)', /invoice_default_size',\s*'a5'/.test(doc('server/database.js')));
  void conA4A5;

  console.log(`\nSỐ CA: ${dat + hong}`);
  console.log(`${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { noiLai(); console.log(`  ${C.do}✗ bài thử sập — ${e.stack || e.message}${C.het}`); console.log(`${dat} đạt · ${hong + 1} hỏng`); process.exit(1); });
