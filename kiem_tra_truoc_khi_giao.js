#!/usr/bin/env node
/**
 * kiem_tra_truoc_khi_giao.js — POS Tứ Quý Đường
 * TẦNG 2 của bộ khung chất lượng (tầng 1 là CHECKLIST_CODE.md cùng thư mục).
 *
 * Máy tự kiểm thay vì người nhớ. Chạy MỘT lệnh, in bảng PASS/FAIL.
 *
 *   node kiem_tra_truoc_khi_giao.js          # kiểm nhanh (mặc định)
 *   node kiem_tra_truoc_khi_giao.js --day-du # kiểm thêm phần chậm (build lại)
 *
 * Git hook gọi bản nhanh. Trước khi push nên chạy --day-du một lần.
 *
 * NGUYÊN TẮC KHI THÊM PHÉP KIỂM MỚI:
 *  - Mỗi phép kiểm phải soi CODE THẬT, không đọc ghi chú (quy tắc số 0).
 *  - Bỏ dòng ghi chú trước khi soi (E2) — dùng bỏGhiChú().
 *  - ĐỪNG dò chữ trong thông báo do CHÍNH MÌNH viết ra (E12) — đã đẻ báo động
 *    giả 3 lần. Kiểm cấu trúc/kiểu, đừng kiểm câu chữ.
 *  - ĐẾM số phép kiểm, đừng đoán (E4) — script tự đếm ở cuối.
 *  - Phép kiểm ngưỡng chỉ được SIẾT, không được nới (bánh cóc).
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const os = require('os');

const GOC = __dirname;
const DAY_DU = process.argv.includes('--day-du');

let PASS = 0, FAIL = 0, CANH_BAO = 0;
const dong = [];

function pass(ten, ghi) {
  PASS++;
  dong.push(`  ✓ ${ten}${ghi ? '  — ' + ghi : ''}`);
}
function fail(ten, ghi) {
  FAIL++;
  dong.push(`  ✗ ${ten}${ghi ? '  → ' + ghi : ''}`);
}
function canhBao(ten, ghi) {
  CANH_BAO++;
  dong.push(`  ! ${ten}${ghi ? '  — ' + ghi : ''}`);
}
function chac(ten, dieuKien, ghiKhiSai) {
  if (dieuKien) pass(ten); else fail(ten, ghiKhiSai);
}
function nhom(ten) {
  dong.push('');
  dong.push(`── ${ten}`);
}

/** Đọc file, trả '' nếu không có. */
function doc(p) {
  try { return fs.readFileSync(path.join(GOC, p), 'utf8'); } catch { return ''; }
}
function co(p) {
  try { fs.accessSync(path.join(GOC, p)); return true; } catch { return false; }
}

/** Liệt kê file theo đuôi, bỏ node_modules / dist / .git / attached_assets. */
function liet(thuMuc, duoi) {
  const kq = [];
  const bo = new Set(['node_modules', 'dist', '.git', 'attached_assets', '.local', '.cache']);
  (function di(d) {
    let ds;
    try { ds = fs.readdirSync(path.join(GOC, d), { withFileTypes: true }); } catch { return; }
    for (const e of ds) {
      if (bo.has(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) di(p);
      else if (duoi.some((x) => e.name.endsWith(x))) kq.push(p);
    }
  })(thuMuc);
  return kq;
}

/**
 * Bỏ GHI CHÚ trước khi soi code (checklist E2). Đã bị báo động giả 2 lần vì
 * soi trúng dòng ghi chú.
 *
 * ⚠ CHỈ bỏ ghi chú, KHÔNG bỏ chuỗi. Cố ý: bóc chuỗi cho đúng cần một bộ phân
 * tích cú pháp thật, thêm nhiều code để đổi lấy rất ít. Hệ quả phải biết: nếu
 * có chuỗi chứa đúng mẫu đang tìm thì sẽ báo động giả. Chưa gặp ca nào.
 */
function boGhiChu(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

// ═══════════════════════════════════════════════════════════════════════════
nhom('A · KÝ TỰ & CÚ PHÁP');

// A1 — ký tự hỏng mã (F8). Đã thấy 4 chỗ thật ở SX.
{
  const files = [...liet('client/src', ['.js', '.jsx']), ...liet('server', ['.js'])];
  const hong = files.filter((f) => doc(f).includes('\uFFFD'));
  chac(`Ký tự hỏng mã U+FFFD = 0 (${files.length} file)`,
    hong.length === 0, hong.join(', '));
}

// A2 — cú pháp. server dùng node --check; client/jsx dùng esbuild của vite nếu có.
{
  const loi = [];
  for (const f of liet('server', ['.js'])) {
    try { execSync(`node --check "${path.join(GOC, f)}"`, { stdio: 'pipe' }); }
    catch (e) { loi.push(f); }
  }
  chac(`Cú pháp server/*.js`, loi.length === 0, loi.join(', '));

  const esb = path.join(GOC, 'client/node_modules/.bin/esbuild');
  if (fs.existsSync(esb)) {
    const loiC = [];
    for (const f of liet('client/src', ['.js', '.jsx'])) {
      try {
        execSync(`"${esb}" "${path.join(GOC, f)}" --loader:.js=jsx --loader:.jsx=jsx ` +
                 `--format=esm --outfile=/dev/null`, { stdio: 'pipe' });
      } catch { loiC.push(f); }
    }
    chac('Cú pháp client/src/*.jsx', loiC.length === 0, loiC.join(', '));
  } else {
    canhBao('Cú pháp client — bỏ qua', 'chưa cài client/node_modules');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
nhom('B · XỬ LÝ LỖI GIAO DIỆN (hồi quy POS-ERRHANDLING-v1)');

const apiSrc = doc('client/src/utils/api.js');
const apiCode = boGhiChu(apiSrc);

// B1 — không được quay lại response.json() trần trong bộ chặn (bẫy SyntaxError
// khi proxy trả trang HTML 502).
chac('api.js không có response.json() trần',
  !/await\s+response\.json\(\)/.test(apiCode),
  'còn response.json() trần — trang HTML 502 sẽ ném SyntaxError che mất status');

// B2 — chỉ ĐÚNG MỘT chỗ đá về /login, và nó phải nằm trong handleSessionExpired.
{
  const n = (apiCode.match(/window\.location\.href\s*=\s*['"]\/login['"]/g) || []).length;
  chac('api.js chỉ có 1 chỗ đá về /login', n === 1, `đếm được ${n}`);
  chac('api.js có handleSessionExpired()',
    /handleSessionExpired\s*\(/.test(apiCode), 'đã bị gỡ?');
  chac('api.js có cờ chặn request song song',
    /sessionExpiredHandled/.test(apiCode), 'thiếu cờ → 9 request là 9 lần điều hướng');
  chac('api.js không đá đi khi đang ở sẵn /login',
    /window\.location\.pathname\s*!==\s*['"]\/login['"]/.test(apiCode),
    'thiếu chốt này thì sinh vòng lặp tải lại trang');
}

// B3 — danh sách mã phiên chết phải ĐÚNG, và phải là danh sách CHO PHÉP.
{
  const phaiCo = ['NO_TOKEN', 'INVALID_TOKEN', 'TOKEN_EXPIRED', 'USER_NOT_FOUND', 'USER_INACTIVE'];
  const camCo = ['SERVICE_AUTH_NOT_CONFIGURED', 'INVALID_SERVICE_KEY'];
  const m = apiCode.match(/SESSION_DEAD_CODES\s*=\s*\[([^\]]*)\]/);
  if (!m) {
    fail('api.js có SESSION_DEAD_CODES', 'không tìm thấy');
  } else {
    const ds = m[1];
    const thieu = phaiCo.filter((c) => !ds.includes(c));
    const thua = camCo.filter((c) => ds.includes(c));
    chac('SESSION_DEAD_CODES đủ 5 mã phiên chết', thieu.length === 0, 'thiếu ' + thieu.join(','));
    chac('SESSION_DEAD_CODES KHÔNG chứa mã cấu hình service',
      thua.length === 0,
      'có ' + thua.join(',') + ' → server thiếu cấu hình sẽ đá đăng xuất = vòng lặp');
  }
}

// B4 — ErrorBoundary phải tồn tại VÀ được nối vào đúng 2 chỗ.
{
  chac('ErrorBoundary.jsx tồn tại', co('client/src/components/ErrorBoundary.jsx'));
  const eb = doc('client/src/components/ErrorBoundary.jsx');
  chac('ErrorBoundary có getDerivedStateFromError',
    /getDerivedStateFromError/.test(eb), 'không phải boundary thật');

  const main = boGhiChu(doc('client/src/main.jsx'));
  chac('main.jsx bọc <App/> bằng ErrorBoundary',
    /ErrorBoundary/.test(main), 'lưới đỡ ngoài cùng đã bị gỡ');

  const layout = boGhiChu(doc('client/src/components/Layout.jsx'));
  chac('Layout.jsx bọc <Outlet/> bằng ErrorBoundary',
    /ErrorBoundary/.test(layout), 'lưới đỡ trong đã bị gỡ');
  chac('Layout.jsx dùng key={location.pathname}',
    /key=\{location\.pathname\}/.test(layout),
    'thiếu key → vỡ 1 lần là kẹt màn báo lỗi mãi dù đã chuyển tab');
}

// B5 — thẻ <a href="/api/ KHÔNG gắn được token (checklist A1).
{
  const xau = [];
  for (const f of liet('client/src', ['.js', '.jsx'])) {
    const c = boGhiChu(doc(f));
    if (/href\s*=\s*["'`]\/api\//.test(c) || /window\.open\(\s*["'`]\/api\//.test(c)) xau.push(f);
  }
  chac('Không có <a href="/api/ hay window.open("/api/', xau.length === 0, xau.join(', '));
}

// B6 — HỒ SƠ TỰ KIỂM MÌNH. Thay cho việc ghi nhãn "✓ CHỐT" trong hồ sơ, vốn
// đã lệch thực tế 6/8 mục (xem quy tắc số 0). Mục nào đóng thì để lệnh ở đây.
{
  let n = 0;
  for (const f of liet('server', ['.js'])) {
    n += (boGhiChu(doc(f))
      .match(/req\.query\.(api_key|apikey|token|key|service_key)\b/g) || []).length;
  }
  chac('POS-5 đóng: khoá/token KHÔNG nhận qua query string', n === 0,
    `đếm được ${n} chỗ — khoá trong URL lọt vào log server và lịch sử trình duyệt`);

  let m = 0;
  for (const f of liet('client/src', ['.js', '.jsx'])) {
    m += (boGhiChu(doc(f)).match(/\bloginTime\b/g) || []).length;
  }
  chac('POS-6 đóng: client KHÔNG giữ bộ đếm phiên riêng', m === 0,
    `đếm được ${m} chỗ — sinh cửa sổ lệch hạn phiên như SX (8h vs 24h)`);
}

// ═══════════════════════════════════════════════════════════════════════════
nhom('C · BÁNH CÓC — chỉ được siết, không được nới');

// C1 — fetch trần ngoài api.js. NGƯỠNG CHỈ ĐƯỢC GIẢM.
// Dọn xong một file thì hạ số này xuống, không bao giờ tăng.
const NGUONG_FETCH = 34;
{
  let n = 0;
  const theoFile = {};
  for (const f of liet('client/src', ['.js', '.jsx'])) {
    if (f.endsWith(path.join('utils', 'api.js'))) continue;
    const k = (boGhiChu(doc(f)).match(/\bfetch\s*\(/g) || []).length;
    if (k) { theoFile[f] = k; n += k; }
  }
  if (n > NGUONG_FETCH) {
    fail(`fetch trần ngoài api.js ≤ ${NGUONG_FETCH}`,
      `đếm được ${n} — MỌC THÊM. ` + JSON.stringify(theoFile));
  } else if (n < NGUONG_FETCH) {
    pass(`fetch trần ngoài api.js = ${n}`,
      `đã dọn bớt ${NGUONG_FETCH - n} chỗ → HẠ NGUONG_FETCH xuống ${n} trong file này`);
  } else {
    pass(`fetch trần ngoài api.js = ${n}`, 'đúng ngưỡng, chưa dọn thêm');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
nhom('D · BẢN DỰNG (dist nằm trong git — quên build là lỗi ÂM THẦM)');

// D1 — build script phải ép NODE_ENV=production.
// .replit đặt NODE_ENV=development cho cả workspace → Vite lấy nhánh dev của
// react-dom, bundle phình từ 673 KB lên 1.143 KB mà KHÔNG có thông báo nào.
{
  let sc = '';
  try { sc = JSON.parse(doc('client/package.json')).scripts.build || ''; } catch {}
  chac('client build script ép NODE_ENV=production',
    /NODE_ENV\s*=\s*production/.test(sc), `hiện là: "${sc}"`);
}

// D2 — bundle đã commit không được là bản DEV của React.
{
  const thuMuc = path.join(GOC, 'client/dist/assets');
  let js = [];
  try { js = fs.readdirSync(thuMuc).filter((f) => f.endsWith('.js')); } catch {}
  if (!js.length) {
    fail('Có bundle trong client/dist/assets', 'không thấy file .js nào');
  } else {
    const dev = js.filter((f) =>
      fs.readFileSync(path.join(thuMuc, f), 'utf8').includes('Download the React DevTools'));
    chac('Bundle KHÔNG phải bản dev của React', dev.length === 0,
      dev.join(', ') + ' — chạy lại: cd client && npm run build');

    // D3 — index.html phải trỏ tới file CÓ THẬT (bắt trường hợp commit thiếu).
    const html = doc('client/dist/index.html');
    const ten = [...html.matchAll(/assets\/([^"']+\.js)/g)].map((m) => m[1]);
    const mat = ten.filter((t) => !js.includes(t));
    chac('index.html trỏ tới bundle CÓ THẬT trong dist/assets',
      ten.length > 0 && mat.length === 0,
      mat.length ? 'thiếu file: ' + mat.join(', ') : 'index.html không trỏ tới .js nào');

    // D4 — bundle phải chứa dấu vết bản vá xử lý lỗi (bắt "quên build" sau khi sửa src)
    const hienDung = ten.filter((t) => js.includes(t));
    if (hienDung.length) {
      const noiDung = fs.readFileSync(path.join(thuMuc, hienDung[0]), 'utf8');
      chac('Bundle có dấu vết POS-ERRHANDLING-v1',
        noiDung.includes('sessionExpiredHandled'),
        'src đã vá nhưng dist CHƯA build lại → production vẫn chạy mã cũ');
    }
  }
}

// D5 (chậm, chỉ khi --day-du) — build lại vào thư mục tạm, so tên băm.
// ĐIỂM MÙ (E6): thay đổi src mà vite tree-shake mất (biến không dùng, ghi chú)
// thì bundle không đổi nên phép kiểm báo xanh. Đúng, không phải sót: bundle
// không đổi nghĩa là dist ĐANG khớp. Chỉ đừng dùng nó để suy ra "src không đổi".
// Vite băm theo NỘI DUNG: src không đổi thì tên băm phải TRÙNG. Lệch tên =
// quên build. Đã kiểm chứng thực tế 24.08: build lại ra đúng index-BmhZeVG9.js.
if (DAY_DU) {
  if (!fs.existsSync(path.join(GOC, 'client/node_modules'))) {
    canhBao('So bản dựng — bỏ qua', 'chưa cài client/node_modules');
  } else {
    // Build ra NGOÀI repo: bản đầu ghi vào client/dist_kiemtra_tam — không nằm
    // trong .gitignore, nên build lỗi giữa chừng là thư mục rác ở lại trong repo
    // và có thể lọt vào commit (nhất là khi agent Replit gõ `git add -A`).
    // Dọn trong finally để lỗi kiểu gì cũng không để lại rác.
    const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'pos-kiemtra-'));
    try {
      execSync(`npm run build -- --outDir "${tam}" --emptyOutDir`,
        { cwd: path.join(GOC, 'client'), stdio: 'pipe' });
      const moi = fs.readdirSync(path.join(tam, 'assets'))
        .filter((f) => f.endsWith('.js')).sort();
      const cu = fs.readdirSync(path.join(GOC, 'client/dist/assets'))
        .filter((f) => f.endsWith('.js')).sort();
      chac('dist đã commit KHỚP với src hiện tại',
        JSON.stringify(moi) === JSON.stringify(cu),
        `dist có ${cu.join(',')} nhưng src build ra ${moi.join(',')} → CHẠY npm run build`);
    } catch (e) {
      fail('So bản dựng', 'build lỗi: ' + String(e.message).slice(0, 200));
    } finally {
      fs.rmSync(tam, { recursive: true, force: true });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
nhom('E · ĐƯỜNG TIỀN (server là nguồn sự thật duy nhất)');

const ordersSrc = doc('server/routes/orders.js');
const ordersCode = boGhiChu(ordersSrc);

// E1 — server PHẢI tự tra giá, TUYỆT ĐỐI không tính tiền theo giá client gửi.
// \b thay vì \s+WHERE: chịu được alias ("FROM pos_products p WHERE ...")
chac('orders.js tự tra giá từ pos_products',
  /FROM\s+pos_products\b/.test(ordersCode),
  'không thấy câu tra giá — server có đang tin giá client gửi không?');
chac('orders.js KHÔNG tính tiền theo item.unit_price',
  !/=\s*item\.unit_price/.test(ordersCode),
  'đang lấy giá từ body request — client sửa được giá');
chac('orders.js chặn sản phẩm chưa có giá',
  /product\.price\s*<=\s*0/.test(ordersCode),
  'mất chốt chặn giá 0');

// E2 — 3 trường đặc quyền chưa xác thực (hạng mục 4 sẽ vá).
//
// HAI BẢN TRƯỚC ĐỀU SAI, ghi lại vì đây là bài học E12 lặp lại lần thứ tư:
//   Bản 1 khớp TÊN HÀM /vaiTroNhanVien|laNhanVien|isStaff/ — đặt tên khác là
//     phép kiểm im lặng báo sai mãi mãi.
//   Bản 2 đòi "có so sánh req.user.role ở đâu đó trong file" — orders.js ĐÃ CÓ
//     SẴN `req.user.role !== "owner"` ở dòng 1356 cho một route KHÁC, nên chỉ
//     cần thêm marker là xanh dù cổng chưa hề đóng. Kiểm chứng bằng cách phá
//     thử: nhánh "marker suông" đáng lẽ đỏ thì lại xanh.
//
// Bản này kiểm SỰ VẮNG MẶT CỦA MẪU NGUY HIỂM — không phụ thuộc cách đặt tên,
// và chỉ chuyển sang xanh khi code thật sự đổi:
//   `item.from_package ? 0 : ...`  =  cờ THÔ từ req.body quyết định thẳng giá 0.
// Sau khi vá, giá trị này phải đi qua cổng phân quyền trước, nên mẫu thô biến mất.
{
  const coMarker = /POS-AUTHZ-v1/.test(ordersSrc);   // bản THÔ: marker là ghi chú
  const conCoThoTuGoi = /item\.from_package\s*\?\s*0/.test(ordersCode);

  if (!conCoThoTuGoi && coMarker) {
    pass('POST /orders có cổng phân quyền cho trường đặc quyền');
  } else if (coMarker && conCoThoTuGoi) {
    fail('POST /orders có cổng phân quyền',
      'có marker POS-AUTHZ-v1 nhưng `item.from_package ? 0` VẪN CÒN — cờ thô từ ' +
      'body vẫn quyết định thẳng giá 0. Marker suông, cổng chưa đóng');
  } else if (!coMarker && !conCoThoTuGoi) {
    canhBao('POST /orders — mẫu thô đã mất nhưng THIẾU marker',
      'thêm ghi chú POS-AUTHZ-v1 vào orders.js để phép kiểm chốt được');
  } else {
    canhBao('POST /orders CHƯA có cổng phân quyền',
      'from_package · discount_type/value · customer_package_id lấy thẳng từ ' +
      'body. CHẶN App KH — xem hạng mục 4 và mục P3 trong CHECKLIST_CODE.md');
  }
}

// ⚠ ĐIỀU PHÉP KIỂM NÀY KHÔNG BAO PHỦ (E6): chỉ canh được `from_package`.
// `discount_type`/`discount_value` không có mẫu thô đặc trưng để kiểm vắng mặt
// — chúng chỉ là biến đọc từ body rồi dùng thẳng. Phải tự soi bằng mắt, mục G.

// E7 — POS-NEN-v1: pay-debt phải chặn thu hai lần. Gỡ điều kiện debt_amount khỏi
// WHERE là hai lệnh thu cùng lúc cùng cộng tiền (đã chứng minh với độ trễ Turso).
{
  const src = boGhiChu(doc('server/routes/orders.js'));
  const a = src.indexOf('"/:id/pay-debt"');
  const khoi = a < 0 ? '' : src.slice(a, src.indexOf('router.', a + 20));
  chac('pay-debt chặn thu hai lần (WHERE … debt_amount = ? + kiểm số dòng đổi)',
    /WHERE id = \? AND debt_amount = \?/.test(khoi) && /changes !== 1/.test(khoi),
    'bấm đúp hoặc webhook gọi hai lần sẽ cộng tiền hai lần');
}

// E8 — POS-NEN-v1: mọi bảng tạo trong database.js phải có trong danh sách sao lưu.
// Đợt 17.09 phát hiện sao lưu thiếu 15/29 bảng — khôi phục là mất điểm, gói, tài khoản.
{
  const db = doc('server/database.js'), bk = doc('server/routes/backup.js');
  const tao = [...new Set([...db.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map(m => m[1]))];
  const i = bk.indexOf('BACKUP_TABLES');
  const sl = i < 0 ? '' : bk.slice(i, bk.indexOf('];', i));
  const thieu = tao.filter(t => !new RegExp(`name:\\s*'${t}'`).test(sl));
  chac(`mọi bảng đều được sao lưu (${tao.length} bảng)`, tao.length > 0 && thieu.length === 0,
    'thiếu trong BACKUP_TABLES: ' + thieu.join(', '));
}

// E9 — POS-P20-v1: mã in trên bill chỉ dùng được khi bill ĐÃ THANH TOÁN.
// Bill "mang ra bàn chưa thu" vẫn in mã; /claim từng không đọc đơn (đơn huỷ vẫn
// đổi được voucher), /nhan-diem không kiểm payment_status. Mỗi đường dùng mã
// phải gọi kiemDonCuaMa TRƯỚC lệnh ghi đầu tiên, và hàm đó phải chặn đơn huỷ +
// đơn chưa 'paid'. Bài chạy thật: node cong_cu/thu_P20.js
{
  const src = boGhiChu(doc('server/routes/signup-codes.js'));
  const khoi = (ten) => {
    const a = src.indexOf(`router.post('${ten}'`);
    return a < 0 ? '' : src.slice(a, src.indexOf('router.', a + 20));
  };
  for (const ten of ['/claim', '/nhan-diem']) {
    const k = khoi(ten);
    const goi = k.indexOf('kiemDonCuaMa(');
    const ghi = [k.indexOf('beginTransaction('), k.indexOf('UPDATE pos_signup_codes')].filter((i) => i >= 0);
    const ghiDau = ghi.length ? Math.min(...ghi) : Infinity;
    chac(`${ten}: kiểm đơn của mã (chưa huỷ, đã thanh toán) TRƯỚC lệnh ghi`,
      k !== '' && goi >= 0 && goi < ghiDau,
      'khách dùng được mã in trên bill khi bill chưa trả tiền hoặc đã huỷ');
  }
  const a = src.indexOf('function kiemDonCuaMa');
  const than = a < 0 ? '' : src.slice(a, src.indexOf('\n}', a));
  // POS-P20-v2: siết. Bản v1 chỉ soi `status === 'cancelled'` (khớp cả
  // payment_status) và chỉ soi CÓ GỌI hàm — bỏ qua kết quả vẫn xanh, đơn
  // 'refunded' vẫn lọt. Nay: danh sách TRẮNG + kết quả phải được dùng.
  const hang = src.match(/const TRANG_THAI_DUNG_MA\s*=\s*\{\s*status:\s*'(\w+)',\s*payment_status:\s*'(\w+)'\s*\}/);
  chac('kiemDonCuaMa: hằng TRANG_THAI_DUNG_MA (nếu dùng) đúng completed + paid',
    !/TRANG_THAI_DUNG_MA/.test(than) || (hang && hang[1] === 'completed' && hang[2] === 'paid'),
    'hằng danh sách trắng bị đổi: ' + (hang ? hang[1] + ' · ' + hang[2] : '(không đọc được)'));
  const traDon = than.match(/return\s*\{\s*don\s*\}/g) || [];
  chac('kiemDonCuaMa là DANH SÁCH TRẮNG: chỉ trả { don } khi status completed VÀ payment_status paid',
    traDon.length === 1 &&
      /if\s*\(\s*don\.status\s*===\s*(?:TRANG_THAI_DUNG_MA\.status|'completed')\s*&&\s*don\.payment_status\s*===\s*(?:TRANG_THAI_DUNG_MA\.payment_status|'paid')\s*\)\s*\{\s*return\s*\{\s*don\s*\}/.test(than),
    'đơn hoàn tiền / trạng thái lạ vẫn dùng được mã (danh sách đen để lọt)');
  for (const ten of ['/claim', '/nhan-diem']) {
    const k = khoi(ten);
    const m = k.match(/const\s+(\w+)\s*=\s*await\s+kiemDonCuaMa\(/);
    const ghi = [k.indexOf('beginTransaction('), k.indexOf('UPDATE pos_signup_codes')].filter((i) => i >= 0);
    const ghiDau = ghi.length ? Math.min(...ghi) : Infinity;
    const chan = m ? k.search(new RegExp(`if\\s*\\(\\s*${m[1]}\\.loi\\s*\\)\\s*\\{?\\s*return\\b`)) : -1;
    chac(`${ten}: DÙNG kết quả kiemDonCuaMa (if (X.loi) return) TRƯỚC lệnh ghi`,
      chan >= 0 && chan < ghiDau,
      'gọi hàm kiểm nhưng bỏ qua kết quả — mã vẫn dùng được');
  }
  {
    const k = khoi('/claim');
    const m = k.match(/const\s+(\w+)\s*=\s*await\s+tx\.run\(\s*['`]UPDATE pos_signup_codes SET claimed_at[^'`]*\bAND\s+claimed_at\s+IS\s+NULL\s*['`]/);
    // POS-P20-v3: siết. Chỉ đòi chữ `X.changes` có mặt thì `if (X && X.changes > 5)`
    // vẫn xanh (agent soát 26.09 chứng minh). Nay đòi ĐÚNG dạng chặn, và nó phải
    // nằm giữa lệnh UPDATE chiếm mã và lệnh INSERT voucher.
    const sauUpdate = m ? m.index + m[0].length : -1;
    const chan = m ? k.slice(sauUpdate).search(new RegExp(
      `if\\s*\\(\\s*!\\s*${m[1]}\\s*\\|\\|\\s*${m[1]}\\.changes\\s*!==\\s*1\\s*\\)\\s*\\{\\s*await\\s+tx\\.rollback\\(\\s*\\)\\s*;\\s*return\\b`)) : -1;
    const chenVoucher = m ? k.slice(sauUpdate).indexOf('INSERT INTO pos_discount_codes') : -1;
    chac('/claim: chiếm mã bằng UPDATE ... AND claimed_at IS NULL rồi if (!X || X.changes !== 1) { rollback; return } TRƯỚC khi phát voucher',
      !!m && chan >= 0 && chenVoucher >= 0 && chan < chenVoucher,
      'hai người claim cùng lúc cùng qua phép kiểm ngoài giao dịch');
  }
  {
    // POS-P20-v4: đường song song của /claim. Agent soát 26.09 xoá `AND
    // diem_nhan_luc IS NULL` → thu_P20 và bộ kiểm vẫn xanh. Đòi đúng dạng chặn
    // (changes === 0 hoặc !== 1), nằm giữa UPDATE chiếm mã và lệnh cộng điểm.
    const k = khoi('/nhan-diem');
    const m = k.match(/const\s+(\w+)\s*=\s*await\s+tx\.run\(\s*['`]UPDATE pos_signup_codes SET diem_nhan_luc[^'`]*\bAND\s+diem_nhan_luc\s+IS\s+NULL\s*['`]/);
    const sauUpdate = m ? m.index + m[0].length : -1;
    const chan = m ? k.slice(sauUpdate).search(new RegExp(
      `if\\s*\\(\\s*!\\s*${m[1]}\\s*\\|\\|\\s*${m[1]}\\.changes\\s*(?:===\\s*0|!==\\s*1)\\s*\\)\\s*\\{\\s*await\\s+tx\\.rollback\\(\\s*\\)\\s*;\\s*return\\b`)) : -1;
    const congDiem = m ? k.slice(sauUpdate).indexOf('INSERT INTO pos_point_transactions') : -1;
    chac('/nhan-diem: chiếm mã bằng UPDATE ... AND diem_nhan_luc IS NULL rồi if (!X || X.changes === 0) { rollback; return } TRƯỚC khi cộng điểm',
      !!m && chan >= 0 && congDiem >= 0 && chan < congDiem,
      'hai người nhận điểm cùng một mã cùng lúc đều được cộng điểm');
  }
}

// E11 — POS-P20-v2: bài thử CHẠY THẬT trong bộ kiểm (cũng là pre-commit và
// hook Stop). Phép tĩnh chỉ soi chữ; bài thật tạo đơn, huỷ, hoàn tiền rồi gọi
// route. Hết giờ hoặc sập = hỏng. canhGan (HOC-2b C3, chỉ giả lập + thu_gia_lap): xanh mà quá 80 % hạn → CẢNH BÁO
// (không chặn) — để thấy trước khi bài chạm hạn. Bài thử: cong_cu/thu_gia_lap.js [C3] cắt chính hàm này ra chạy.
function chayBaiThat(bai, env, han = 120000, canhGan = false) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(GOC, bai)], { cwd: GOC, encoding: 'utf8', timeout: han, env });
  const giay = ((Date.now() - t0) / 1000).toFixed(1);
  const ra = String(r.stdout || '') + String(r.stderr || '');
  const hong = ra.replace(/\x1b\[[0-9;]*m/g, '').split('\n').filter((l) => /[✗✖]/.test(l)).map((l) => l.trim());
  const xanh = r.status === 0 && !r.error;
  chac(`bài chạy thật ${bai} xanh (${giay} s)`, xanh,
    r.error ? String(r.error.message) : (hong.join(' | ') || `thoát mã ${r.status}`));
  if (xanh && canhGan && Date.now() - t0 > han * 0.8) {
    canhBao(`bài chạy thật ${bai} gần hạn`, `chạy ${giay} s > 80 % hạn ${han / 1000} s — báo chủ quán, KHÔNG nới hạn`);
  }
  return ra;
}
for (const bai of ['cong_cu/thu_P20.js', 'cong_cu/thu_P21.js', 'cong_cu/thu_P26a.js', 'cong_cu/thu_P26b.js']) chayBaiThat(bai);

// E12 — P26b (F2): MỌI lệnh ghi pos_wallets trong server/routes/ đi qua ghiVi (wallets.js): đọc số dư TRONG giao dịch
// ghi, cộng TƯƠNG ĐỐI. Ngoại lệ duy nhất: reconcileWallet (đối soát = ghi tuyệt đối có chủ đích), thân chạy trong
// trongGiaoDich (wallets.js — mở beginTransaction).
// Trước P26b: 18 lệnh ghi ở 12 chỗ đọc số dư NGOÀI giao dịch rồi `SET balance = ?` → hai người bấm gần nhau mất một khoản.
// Bài chạy thật: thu_P26b.js; chồng nhau thật: giả lập KB14–KB18.
{
  const thanHam = (src, mau) => { const a = src.indexOf(mau); return a < 0 ? '' : src.slice(a, src.indexOf('\n}', a)); };
  const vi = boGhiChu(doc('server/routes/wallets.js'));
  const ghiVi = thanHam(vi, 'async function ghiVi(');
  const doiSoat = thanHam(vi, 'async function reconcileWallet(');
  const sai = [];
  for (const f of fs.readdirSync(path.join(GOC, 'server', 'routes')).filter((x) => x.endsWith('.js')).sort()) {
    let src = boGhiChu(doc('server/routes/' + f));
    if (f === 'wallets.js') src = src.replace(ghiVi, '').replace(doiSoat, '');
    // Không phân biệt hoa thường; bắt cả UPDATE OR …, INSERT OR … INTO, REPLACE INTO, tên bảng trong ngoặc (soát vòng 1).
    const GHI_VI = /\b(?:UPDATE(?:\s+OR\s+\w+)?|INSERT(?:\s+OR\s+\w+)?\s+INTO|REPLACE\s+INTO)\s+["`'\[]?pos_wallets\b[^`'"]{0,60}/gi;
    for (const m of src.matchAll(GHI_VI)) sai.push(`${f}: ${m[0].replace(/\s+/g, ' ')}`);
  }
  chac('ví: mọi lệnh ghi pos_wallets trong server/routes/ nằm trong ghiVi hoặc reconcileWallet', !!ghiVi && sai.length === 0,
    (ghiVi ? '' : 'không thấy async function ghiVi( trong wallets.js · ') + sai.join(' · '));
  chac('ví: ghiVi đọc số dư bằng tx.queryOne và cộng tương đối (balance = balance + ?), không SET balance = ?',
    /tx\.queryOne\(\s*['`"]SELECT balance FROM pos_wallets/.test(ghiVi) && /balance\s*=\s*balance\s*\+\s*\?/.test(ghiVi)
      && !/SET\s+balance\s*=\s*\?/.test(ghiVi), 'số dư trước/sau lấy ngoài giao dịch hoặc ghi tuyệt đối → mất khoản khi bấm chồng');
  chac('ví: đối soát (reconcileWallet) đọc tổng sổ và ghi trong CÙNG một giao dịch',
    /trongGiaoDich\(async \(tx\) =>/.test(doiSoat) && /async function trongGiaoDich[^}]*beginTransaction\(\)/.test(vi)
      && /tx\.queryOne\([^;]*SUM\(amount\)/.test(doiSoat) && /tx\.run\(\s*`UPDATE pos_wallets SET balance = \?/.test(doiSoat),
    'bán đơn xen giữa lúc đọc tổng sổ và lúc ghi → mất khoản trừ');
}

// E10 — POS-P21-v1: đối soát ví (/:phone/reconcile, /reconcile-all) chỉ cộng các loại dòng làm đổi số dư ví.
// Hai route này chưa có nút trên màn hình — chỉ gọi thẳng API với quyền adjust_balance.
// pay-debt ghi 'debt_payment' số DƯƠNG (tiền mặt/chuyển khoản trả nợ); SUM mọi
// dòng thì ví được cộng khống đúng số nợ đã trả. Danh sách TRẮNG, chủ quán duyệt
// 25.09.2026 — loại mới mặc định KHÔNG tính. Bài chạy thật: node cong_cu/thu_P21.js
{
  const src = boGhiChu(doc('server/routes/wallets.js'));
  const m = src.match(/const LOAI_TINH_VAO_VI\s*=\s*\[([^\]]*)\]/);
  const ds = m ? [...m[1].matchAll(/'(\w+)'/g)].map((x) => x[1]).sort().join(',') : '';
  chac('ví: danh sách trắng LOAI_TINH_VAO_VI đúng 5 loại đã duyệt, không có debt_payment',
    ds === 'adjust,compensation,purchase,refund,topup',
    'danh sách đang là: ' + (ds || '(không có)'));
  const a = src.indexOf('async function reconcileWallet');
  const than = a < 0 ? '' : src.slice(a, src.indexOf('\n}', a));
  const b = src.indexOf("router.post('/reconcile-all'");
  const tatCa = b < 0 ? '' : src.slice(b, src.indexOf('router.', b + 20));
  chac('ví: đối soát (1 khách + toàn bộ) chỉ đọc dòng thuộc danh sách trắng',
    /SUM\(amount\)[^`]*\$\{DK_LOAI_VI\}/.test(than) && /DISTINCT customer_phone[^`]*\$\{DK_LOAI_VI\}/.test(tatCa),
    'gọi API đối soát ví (/:phone/reconcile, /reconcile-all) sẽ cộng tiền thu nợ vào ví khách');
}

// ═══════════════════════════════════════════════════════════════════════════
nhom('T · TỰ CHẠY — người gác (TU-CHAY-1)');

// T1 — bài phá thử người gác CHẠY THẬT: ~400 ca đúng mã luật, đột biến từng
// luật, tiến trình thật (stdin treo, nhật ký), cài đặt trên kho tạm + pre-push.
chayBaiThat('tu_chay/thu_nguoi_gac.js');
// T1b — TU-CHAY-2: xem_thu.sh, cai_thu_vien.sh, mẫu phiếu, skill (kho tạm + remote bare, npm giả)
chayBaiThat('tu_chay/thu_cong_cu.js');
// T1c — TU-CHAY-3: cổng PR cong.js (kho tạm, đột biến A6–A14) + file workflow cong_github.yml (B1–B6)
chayBaiThat('tu_chay/thu_cong.js');

// T2 — bản đã cài .claude/tu_chay/ phải khớp TỪNG BYTE với nguồn tu_chay/
// (trừ cai_dat.*, trình cài không chép sang). Lệch = hook đang chạy mã khác
// mã đã thử → CẢNH BÁO, chủ quán chạy lại bash tu_chay/cai_dat.sh.
// Giữ CẢNH BÁO, không nâng FAIL (chủ quán chốt 1b, HOC-2b): máy sửa tu_chay/ trên nhánh thì bản cài chắc chắn lệch tới khi
// chủ quán chạy cai_dat.sh; cổng A8 đã chặn cứng ở PR — FAIL ở đây là chặn commit của chính việc đang sửa tu_chay/.
{
  const daCai = path.join(GOC, '.claude', 'tu_chay');
  if (!fs.existsSync(daCai)) {
    pass('.claude/tu_chay/ chưa cài — bỏ qua so byte với tu_chay/');
  } else {
    // HOC-1: chỉ so FILE, bỏ thư mục con — cùng khuôn cai_dat.js (chỉ chép file) và cổng A8
    const tep = (d) => fs.readdirSync(d).filter((f) => { try { return fs.statSync(path.join(d, f)).isFile(); } catch { return true; } });
    // statSync như cai_dat.js:97: symlink tới file = file; symlink treo vẫn tính (báo lệch/thừa), không làm sập bộ kiểm
    const nguon = tep(path.join(GOC, 'tu_chay')).filter((f) => !/^cai_dat\./.test(f)).sort();
    const coSan = tep(daCai).sort();
    const lech = nguon.filter((f) => {
      try { return Buffer.compare(fs.readFileSync(path.join(GOC, 'tu_chay', f)), fs.readFileSync(path.join(daCai, f))) !== 0; } catch { return true; }
    });
    const thua = coSan.filter((f) => !nguon.includes(f));
    if (lech.length || thua.length) {
      canhBao('.claude/tu_chay/ khớp từng byte với tu_chay/',
        `lệch: ${lech.join(', ') || '-'} · thừa: ${thua.join(', ') || '-'} — chủ quán chạy lại: bash tu_chay/cai_dat.sh`);
    } else {
      pass(`.claude/tu_chay/ khớp từng byte với tu_chay/ (${nguon.length} file)`);
    }
  }
}
// T3 — TU-CHAY-2: skill đã cài .claude/skills/lam-viec/SKILL.md khớp từng byte nguồn tu_chay/skill_lam_viec.md
// Giữ CẢNH BÁO — cùng lý do T2 (chốt 1b).
{
  const daCai = path.join(GOC, '.claude', 'skills', 'lam-viec', 'SKILL.md');
  if (!fs.existsSync(daCai)) {
    pass('.claude/skills/lam-viec/SKILL.md chưa cài — bỏ qua so byte');
  } else if (Buffer.compare(fs.readFileSync(daCai), fs.readFileSync(path.join(GOC, 'tu_chay', 'skill_lam_viec.md'))) !== 0) {
    canhBao('.claude/skills/lam-viec/SKILL.md khớp từng byte với tu_chay/skill_lam_viec.md',
      'lệch — chủ quán chạy lại: bash tu_chay/cai_dat.sh');
  } else {
    pass('.claude/skills/lam-viec/SKILL.md khớp từng byte với tu_chay/skill_lam_viec.md');
  }
}

// T4 — TU-CHAY-3: bản cài trong ban_cai của tu_chay/cau_hinh.json (/ra-soat, cổng GitHub; skill đã có T3) khớp
// từng byte nguồn trong tu_chay/ (lệch → CẢNH BÁO, như T3). Giữ CẢNH BÁO — cùng lý do T2 (chốt 1b).
for (const [nguon, dich] of JSON.parse(doc('tu_chay/cau_hinh.json')).ban_cai.filter(([n]) => n !== 'skill_lam_viec.md')) {
  const daCai = path.join(GOC, dich);
  if (!fs.existsSync(daCai)) {
    canhBao(`${dich} khớp từng byte với tu_chay/${nguon}`, 'chưa cài — chủ quán chạy: bash tu_chay/cai_dat.sh');
  } else if (Buffer.compare(fs.readFileSync(daCai), fs.readFileSync(path.join(GOC, 'tu_chay', nguon))) !== 0) {
    canhBao(`${dich} khớp từng byte với tu_chay/${nguon}`, 'lệch — chủ quán chạy lại: bash tu_chay/cai_dat.sh');
  } else {
    pass(`${dich} khớp từng byte với tu_chay/${nguon}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
nhom('F · VỆ SINH REPO');

// F1 — .gitignore phải chặn attached_assets/ (checklist F3).
chac('.gitignore có attached_assets/',
  /^attached_assets\/?\s*$/m.test(doc('.gitignore')),
  'file thả vào chat agent sẽ lọt vào commit');

// F1b — dist PHẢI nằm trong git. Ai đó thêm nó vào .gitignore thì Render serve
// bản cũ vĩnh viễn mà không có thông báo nào (ràng buộc H5 + P1).
{
  const gi = doc('.gitignore');
  chac('.gitignore KHÔNG chặn client/dist',
    !/^\s*(client\/)?dist\/?\s*$/m.test(gi),
    'dist bị bỏ khỏi git → Render sẽ serve bản cũ mãi mãi');
}

// F2 — file .js lạc ở gốc repo. Giữ CẢNH BÁO (chủ quán chốt 1b, HOC-2b): người gác chặn tạo .js ở gốc trong phiên việc;
// file lạc cũ không làm hỏng quầy.
//
// Bản đầu cắm cứng ['fix.js','test-xlsx.js'] — vừa phải sửa tay mỗi lần có file
// mới, vừa gộp nhầm hai thứ khác hẳn nhau: fix.js là rác thật (ALTER TABLE trên
// một file sqlite local KHÔNG TỒN TẠI — POS chạy Turso), còn test-xlsx.js là
// công cụ kiểm có ích, chỉ nằm sai chỗ.
//
// Quy tắc tổng quát, tự bảo trì: gốc repo chỉ nên có script kiểm này. Công cụ
// dùng lại được thì cho vào cong_cu/; dùng một lần xong thì xoá.
{
  const cho = ['kiem_tra_truoc_khi_giao.js'];
  let lac = [];
  try {
    lac = fs.readdirSync(GOC)
      .filter((f) => f.endsWith('.js') && !cho.includes(f));
  } catch {}
  if (lac.length) {
    canhBao('File .js lạc ở gốc repo', lac.join(', ') +
      ' — dùng một lần thì xoá, dùng lại được thì chuyển vào cong_cu/');
  } else {
    pass('Gốc repo sạch, không có .js lạc');
  }
}

// F3 — npm test phải trỏ vào thứ CÓ THẬT.
{
  let sc = '';
  try { sc = JSON.parse(doc('package.json')).scripts.test || ''; } catch {}
  // Mọi file được nhắc tới trong script đều phải CÓ THẬT. Script không nhắc
  // file nào (ví dụ "node --test") thì không kết luận được — cho qua kèm ghi chú,
  // thay vì FAIL oan như bản đầu.
  const nhac = [...sc.matchAll(/(\S+\.(?:sh|js|mjs|cjs))/g)].map((x) => x[1]);
  const thieu = nhac.filter((f) => !co(f));
  if (!sc.trim()) {
    fail('npm test có định nghĩa', 'chưa có script test nào');
  } else if (!nhac.length) {
    canhBao('npm test không trỏ tới file nào', `script: "${sc}" — tự kiểm bằng tay`);
  } else {
    chac('npm test trỏ vào file có thật', thieu.length === 0,
      `script: "${sc}" → thiếu ${thieu.join(', ')}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
nhom('K · KHO THỬ — Replit KHÔNG được chạm dữ liệu thật (POS-KHOTHU-v2)');

// K1 — chỉ ketNoiKho.js được đọc 2 biến kết nối. Kiểm MẪU NGUY HIỂM VẮNG MẶT
// ở MỌI file (E13) — bắt được cả biến trung gian lẫn cách viết khác, vì mọi
// đường nối vào kho thật đều phải đi qua việc đọc biến môi trường.
{
  const cam = [
    /process\.env\.(TURSO_DATABASE_URL|SX_API_URL)\b/,
    /process\.env\[\s*['"`](TURSO_DATABASE_URL|SX_API_URL)['"`]\s*\]/,
    /\{[^}]*\b(TURSO_DATABASE_URL|SX_API_URL)\b[^}]*\}\s*=\s*process\.env/,
  ];
  const cho = path.join('server', 'ketNoiKho.js');
  const vi = [];
  for (const f of [...liet('server', ['.js']), ...liet('cong_cu', ['.js'])]) {
    if (f === cho) continue;
    const src = boGhiChu(doc(f));
    if (cam.some((re) => re.test(src))) vi.push(f);
  }
  chac('chỉ server/ketNoiKho.js đọc biến kết nối kho thật',
    vi.length === 0, 'tự đọc biến kết nối: ' + vi.join(', '));
}

// K2 — CHẠY THẬT ketNoiKho.js qua 4 ca môi trường. Kiểm HÀNH VI, không kiểm
// câu chữ: bản vá có vô số cách viết, hành vi đúng chỉ có một (E12, E13).
{
  const p = path.join(GOC, 'server', 'ketNoiKho.js');
  if (!co('server/ketNoiKho.js')) {
    fail('server/ketNoiKho.js tồn tại', 'thiếu file');
  } else {
    const BIEN = ['REPL_ID', 'REPL_SLUG', 'REPLIT', 'TURSO_DATABASE_URL',
                  'TURSO_AUTH_TOKEN', 'SX_API_URL', 'SX_API_URL_THU'];
    const giu = {};
    for (const k of BIEN) giu[k] = process.env[k];
    const dat = (o) => { for (const k of BIEN) delete process.env[k]; Object.assign(process.env, o); };
    const nap = () => { delete require.cache[require.resolve(p)]; return require(p); };
    const sai = [];
    try {
      // Ca 1 — Replit, có ĐỦ biến production → PHẢI dùng file, PHẢI tắt SX
      dat({ REPL_ID: 'x', TURSO_DATABASE_URL: 'libsql://that', TURSO_AUTH_TOKEN: 't', SX_API_URL: 'https://that' });
      let m = nap(); let c = m.cauHinhTurso();
      if (!c.laMayThu || !String(c.cauHinh.url).startsWith('file:')) sai.push('ca 1: Replit không dùng file');
      if (c.cauHinh.authToken) sai.push('ca 1: Replit vẫn mang authToken');
      if (m.diaChiSX() !== '') sai.push('ca 1: Replit vẫn bật SX');
      // Ca 2 — Replit + SX_API_URL_THU → dùng đúng địa chỉ thử
      dat({ REPL_SLUG: 'x', SX_API_URL: 'https://that', SX_API_URL_THU: 'https://thu' });
      m = nap();
      if (m.diaChiSX() !== 'https://thu') sai.push('ca 2: không dùng SX_API_URL_THU');
      // Ca 3 — không phải Replit → Turso + SX thật, y như trước patch
      dat({ TURSO_DATABASE_URL: 'libsql://that', TURSO_AUTH_TOKEN: 't', SX_API_URL: 'https://that' });
      m = nap(); c = m.cauHinhTurso();
      if (c.laMayThu || c.cauHinh.url !== 'libsql://that' || c.cauHinh.authToken !== 't') sai.push('ca 3: production không dùng Turso');
      if (m.diaChiSX() !== 'https://that') sai.push('ca 3: production mất SX');
      // Ca 4 — không phải Replit, thiếu URL → PHẢI từ chối (B5)
      dat({});
      m = nap(); let nem = false;
      try { m.cauHinhTurso(); } catch { nem = true; }
      if (!nem) sai.push('ca 4: thiếu URL mà không từ chối');
    } catch (e) {
      sai.push('lỗi khi chạy: ' + e.message);
    } finally {
      for (const k of BIEN) {
        if (giu[k] === undefined) delete process.env[k]; else process.env[k] = giu[k];
      }
      delete require.cache[require.resolve(p)];
    }
    chac('ketNoiKho.js chạy đúng cả 4 ca môi trường', sai.length === 0, sai.join(' · '));
  }
}

// K3 — kho thử không được lọt vào git
chac('.gitignore chặn thư mục data/', /^data\/\s*$/m.test(doc('.gitignore')),
  'thêm dòng "data/" vào .gitignore');

// ═══════════════════════════════════════════════════════════════════════════
nhom('S · GIẢ LẬP QUẦY (TU-CHAY-4) — một ngày bán hàng trên máy chủ thật, kho tạm');

// S1 — giả lập chạy với môi trường ĐÃ LỌC SẠCH (chủ quán chốt 02.10.2026): nó không bao giờ cầm khoá
// thật, kể cả trên Replit có Secrets. Chạy tay mà môi trường có khoá thì giả lập tự từ chối (A1).
// S2 — bánh cóc: số kịch bản / bất biến chỉ được TĂNG (trừ lần hạ có chủ quán chốt). Việc sau thêm kịch bản mới, không
// xoá kịch bản cũ.
const MT_SACH = Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(PATH|HOME|TMPDIR|LANG|LC_ALL|SYSTEMROOT)$/.test(k)));
const NGUONG_KICH_BAN = 29;   // 18 → 27: LUOI-1 thêm KB19–KB27 (đổi điểm, mã, gói, thẻ, nợ kho SX); 27 → 29: TACH-GL thêm KB28–KB29
const NGUONG_BAT_BIEN = 16;   // 10 → 16: LUOI-1 thêm I12–I17. (11 → 10 ở HOC-2b: bỏ I10, I10 ⊂ I11 — chủ quán chốt 2a.)
// S4 — đo CHẠY RIÊNG trên máy mây 4 lõi. LUOI-1 (09.10): 27 KB nối tiếp — giả lập 80–85 s, thu_gia_lap 90–94 s (sát ngưỡng).
// TACH-GL (10.10): chia 4 lượt chạy cùng lúc (chay.js cha/con, LUOT trong kich_ban.js) + KB28–29 → giả lập 24,5–25,0 s,
// thu_gia_lap 36,8–41,5 s (CPU cả tiến trình con 38,7–44,7 s = sàn thời gian trên máy 1 lõi). CHỈ chạy ở --day-du (cổng cong-chay
// chạy --day-du); hạn 120 s, xanh mà quá 80 % (96 s) → CẢNH BÁO (HOC-2b C3). Thêm kịch bản thì đo lại, vượt → hỏi chủ quán, KHÔNG nới.
{
  if (DAY_DU) {
    const ra = chayBaiThat('cong_cu/gia_lap/chay.js', MT_SACH, 120000, true);
    const m = ra.match(/Giả lập: (\d+) kịch bản · (\d+) bất biến/);
    chac(`bánh cóc giả lập: ≥ ${NGUONG_KICH_BAN} kịch bản, ≥ ${NGUONG_BAT_BIEN} bất biến`,
      !!m && +m[1] >= NGUONG_KICH_BAN && +m[2] >= NGUONG_BAT_BIEN, m ? m[0] : 'không thấy dòng tổng của giả lập');
    chayBaiThat('cong_cu/thu_gia_lap.js', MT_SACH, 120000, true);
  }
  // S3 — I4/I5 chép danh sách trắng ví (wallets.js không export): hai bản phải đi cùng nhau
  const dsVi = (p) => {
    const x = boGhiChu(doc(p)).match(/const LOAI_TINH_VAO_VI\s*=\s*\[([^\]]*)\]/);
    return x ? [...x[1].matchAll(/'(\w+)'/g)].map((y) => y[1]).sort().join(',') : '';
  };
  const viGl = dsVi('cong_cu/gia_lap/bat_bien.js');
  chac('giả lập: danh sách trắng ví trong bat_bien.js khớp wallets.js', !!viGl && viGl === dsVi('server/routes/wallets.js'),
    `bat_bien.js: ${viGl || '(không có)'} · wallets.js: ${dsVi('server/routes/wallets.js')}`);
}

console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('  KIỂM TRA TRƯỚC KHI GIAO — POS Tứ Quý Đường' +
            (DAY_DU ? '  [đầy đủ]' : '  [nhanh]'));
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log(dong.join('\n'));
console.log('');
console.log(`  ĐẾM (không đoán):  PASS ${PASS}  ·  FAIL ${FAIL}  ·  CẢNH BÁO ${CANH_BAO}`);
console.log(`  Tổng phép kiểm:    ${PASS + FAIL}`);
if (!DAY_DU) console.log('  (chạy --day-du để kiểm thêm: dist có khớp src không, giả lập quầy)');
console.log('');

if (FAIL > 0) {
  console.log('  ✗ CÓ LỖI — sửa xong rồi commit. Đọc CHECKLIST_CODE.md.');
  process.exit(1);
}
console.log('  ✓ Qua hết. Vẫn phải tự đọc mục G trong CHECKLIST_CODE.md —');
console.log('    phần lớn dạng lỗi KHÔNG kiểm tự động được.');
process.exit(0);
