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
const { execSync } = require('child_process');
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

// F2 — file .js lạc ở gốc repo.
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
console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('  KIỂM TRA TRƯỚC KHI GIAO — POS Tứ Quý Đường' +
            (DAY_DU ? '  [đầy đủ]' : '  [nhanh]'));
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log(dong.join('\n'));
console.log('');
console.log(`  ĐẾM (không đoán):  PASS ${PASS}  ·  FAIL ${FAIL}  ·  CẢNH BÁO ${CANH_BAO}`);
console.log(`  Tổng phép kiểm:    ${PASS + FAIL}`);
if (!DAY_DU) console.log('  (chạy --day-du để kiểm thêm: dist có khớp src không)');
console.log('');

if (FAIL > 0) {
  console.log('  ✗ CÓ LỖI — sửa xong rồi commit. Đọc CHECKLIST_CODE.md.');
  process.exit(1);
}
console.log('  ✓ Qua hết. Vẫn phải tự đọc mục G trong CHECKLIST_CODE.md —');
console.log('    phần lớn dạng lỗi KHÔNG kiểm tự động được.');
process.exit(0);
