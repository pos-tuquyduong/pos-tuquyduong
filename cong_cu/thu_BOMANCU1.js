#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ BO-MAN-CU-1 — bỏ màn Bán hàng cũ · khoá đường tạo đơn thẳng · tạm ngưng gói
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (màn cũ còn, đường thẳng nhận ví / CK / nợ, gói bán được). Xanh ngay = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_BOMANCU1.js [--may-chu <thư mục server>]
 *  (--may-chu: bản sao đột biến của viec/BO-MAN-CU-1/dot_bien.py; giao diện đọc <may-chu>/../client/src)
 *
 *  [A] giao diện: DỰNG THẬT BanHang/index.jsx (esbuild, React giả tối thiểu) với 4 kiểu đầu vào — chưa bật / localStorage "tắt" /
 *      ?man=cu / ?man=moi — phải ra BanHangMoi; kiểu bố cục vẫn nhớ. Không còn chữ / file / hàm của màn cũ.
 *  [B] máy chủ: database.js + libsql thật trên kho TẠM (khuôn thu_P3). Mỗi ca CHẶN so đúng `code` VÀ dấu vết không ghi (đơn, dòng món,
 *      dòng ví, tổng số dư, điểm, gói, lượt gói, phiên, lượt mã, voucher, thẻ). Không gọi payOS thật (máy giả 127.0.0.1, khoá sinh lúc chạy).
 *  [C] luồng hợp lệ PHẢI KHÔNG bị chặn (K5): tiền mặt, phiên tiền mặt / tài khoản + PIN / mẹ + PIN / tách / CK tay / QR tự xác nhận,
 *      thẻ hạng, nạp, mã + voucher, hạng + flash; đơn CŨ (dựng bằng thân taoDonGoc — cong_cu/gia_lap/donCu.js) xem, huỷ, kết thúc gói.
 *  [K] khoá cửa chặn: chữ `taoDonGoc` chỉ ở routes/orders.js, đúng 3 dòng (định nghĩa, lời gọi trong taoDon, export).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const CLIENT = path.join(MAY_CHU, '..', 'client', 'src');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_bomancu1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_bmc_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_bmc_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.bmc.local/tra-ve';
delete process.env.CONG_QR;

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); }
  else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = console.error = console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };
const doc = (...p) => { try { return fs.readFileSync(path.join(...p), 'utf8'); } catch { return ''; } };
const sach = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const duyet = (d, duoi) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []).flatMap((e) => (e.isDirectory()
  ? duyet(path.join(d, e.name), duoi) : duoi.some((x) => e.name.endsWith(x)) ? [path.join(d, e.name)] : []));
const { donCu } = (() => { try { return require('./gia_lap/donCu'); } catch { return { donCu: async () => { throw new Error('chưa có cong_cu/gia_lap/donCu.js'); } }; } })();

// Chuỗi ký payOS — viết riêng ở bài (khuôn thu_P3): khoá xếp tăng dần, null → rỗng, nối k=v bằng &.
const chuoiKy = (d) => Object.keys(d).sort().map((x) => `${x}=${d[x] == null ? '' : d[x]}`).join('&');
const hmac = (s) => crypto.createHmac('sha256', KHOA.ck).update(s).digest('hex');

// ── [A] dựng BanHang/index.jsx thật: React giả (jsx trả { type, props }), BanHangMoi / Sales thay bằng hàm rỗng mang đúng tên ──
async function napTrangChu() {
  const esbuild = require(path.join(GOC, 'client', 'node_modules', 'esbuild'));
  globalThis.__BMC_REACT = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'frag',
    useState: (d) => [typeof d === 'function' ? d() : d, () => {}] };
  const vo = { name: 'bmc', setup(b) {
    b.onResolve({ filter: /^react(\/jsx-runtime|\/jsx-dev-runtime)?$/ }, () => ({ path: 'react', namespace: 'bmc' }));
    b.onResolve({ filter: /^(\.\/BanHangMoi|\.\.\/Sales)$/ }, (a) => ({ path: a.path.endsWith('Sales') ? 'Sales' : 'BanHangMoi', namespace: 'bmc' }));
    b.onLoad({ filter: /.*/, namespace: 'bmc' }, (a) => ({ loader: 'js', contents: a.path === 'react' ? 'module.exports = globalThis.__BMC_REACT;'
      : `export default function ${a.path}() { return null; }` }));
  } };
  const kq = await esbuild.build({ entryPoints: [path.join(CLIENT, 'pages', 'BanHang', 'index.jsx')], bundle: true, write: false, format: 'cjs',
    platform: 'node', jsx: 'automatic', keepNames: true, logLevel: 'silent', plugins: [vo] });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', kq.outputFiles[0].text)(m, m.exports, require);
  return m.exports.default;
}
const khoGia = (dau = {}) => { const m = { ...dau }; return { getItem: (a) => (a in m ? m[a] : null), setItem: (a, v) => { m[a] = String(v); }, m }; };
const khoHong = { getItem: () => { throw new Error('bị chặn'); }, setItem: () => { throw new Error('bị chặn'); } };
function veTrangChu(TrangChu, kho, search = '') {
  globalThis.window = { location: { search, pathname: '/', href: 'http://quay/' + search }, history: { replaceState() {} }, localStorage: kho };
  const el = TrangChu();
  return { ten: el?.type?.name || String(el?.type), props: el?.props || {} };
}

async function main() {
  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] Một màn Bán hàng duy nhất (giao diện)');
  await chay('A1', async () => {
    const TrangChu = await napTrangChu();
    const a = veTrangChu(TrangChu, khoGia());
    k('A1a máy chưa từng bật (kho trống) → màn mới, kiểu Tự động', a.ten === 'BanHangMoi' && a.props.kieu === 'tudong', `${a.ten} · ${a.props.kieu}`);
    const b = veTrangChu(TrangChu, khoGia({ pos_man_ban_hang_moi: '0', pos_man_ban_hang_kieu: 'dienthoai' }));
    k('A1b localStorage cũ ghi "tắt" (pos_man_ban_hang_moi = 0) → màn mới, giữ kiểu Điện thoại', b.ten === 'BanHangMoi' && b.props.kieu === 'dienthoai',
      `${b.ten} · ${b.props.kieu}`);
    const c = veTrangChu(TrangChu, khoGia({ pos_man_ban_hang_moi: '1' }), '?man=cu');
    k('A1c địa chỉ /?man=cu (máy đang bật) → vẫn màn mới', c.ten === 'BanHangMoi', c.ten);
    const d = veTrangChu(TrangChu, khoGia(), '?man=moi');
    k('A1d địa chỉ /?man=moi → màn mới', d.ten === 'BanHangMoi', d.ten);
    const kho = khoGia();
    const e1 = veTrangChu(TrangChu, kho);
    if (typeof e1.props.onDoiKieu === 'function') e1.props.onDoiKieu('maytinhbang');
    const e2 = veTrangChu(TrangChu, kho);
    k('A1e đổi kiểu bằng onDoiKieu("maytinhbang") rồi mở lại → nhớ Máy tính bảng', e2.ten === 'BanHangMoi' && e2.props.kieu === 'maytinhbang',
      `${e2.ten} · ${e2.props.kieu} · onDoiKieu ${typeof e1.props.onDoiKieu}`);
    const f = veTrangChu(TrangChu, khoHong);
    k('A1f localStorage bị chặn → vẫn màn mới, Tự động, không ném', f.ten === 'BanHangMoi' && f.props.kieu === 'tudong', `${f.ten} · ${f.props.kieu}`);
    const g = veTrangChu(TrangChu, khoGia({ pos_man_ban_hang_kieu: 'tuyet-voi' }));
    k('A1g kiểu lạ trong kho → Tự động', g.ten === 'BanHangMoi' && g.props.kieu === 'tudong', `${g.ten} · ${g.props.kieu}`);
  });
  await chay('A2', async () => {
    const bhm = doc(CLIENT, 'pages', 'BanHang', 'BanHangMoi.jsx');
    k('A2a bảng ⚙: có "Kiểu màn bán hàng (máy này)", không còn "Màn bán hàng mới (máy này)" / "Tắt — về màn cũ"', bhm.length > 1000
      && bhm.includes('Kiểu màn bán hàng (máy này)') && !bhm.includes('Màn bán hàng mới (máy này)') && !bhm.includes('Tắt — về màn cũ'));
    // Câu duy nhất được giữ (chủ quán 17.11 câu 3): Layout.jsx nói về các màn Cài đặt cũ, không phải màn bán hàng (file Cấm của việc).
    const GIU = 'Các màn cũ chuyển vào trang Quản lý';
    const vet = duyet(CLIENT, ['.js', '.jsx', '.css']).flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').map((dong, i) => [f, i + 1, dong]))
      // `Sales` phân biệt hoa thường như phiếu A2 (grep `Sales`): khối CSS cũ "SALES PAGE" / .sales-layout ở index.css (ngoài Phạm vi) là Phát hiện.
      .filter(([, , dong]) => /\bSales\b/.test(dong) || /man=cu|man=moi|màn cũ|màn bán hàng cũ|onDoiCaiDat|docCongTac|ghiCongTac/i.test(dong.replace(GIU, '')))
      .map(([f, i]) => path.relative(CLIENT, f) + ':' + i);
    k('A2b client/src không còn man=cu · man=moi · Sales · "màn cũ" · công tắc cũ (trừ câu Layout.jsx đã duyệt giữ)', vet.length === 0, vet.slice(0, 6).join(', '));
  });
  await chay('A3', async () => {
    k('A3a đã xoá pages/Sales.jsx và components/CustomerSearch.jsx (chỉ màn cũ dùng)', !fs.existsSync(path.join(CLIENT, 'pages', 'Sales.jsx'))
      && !fs.existsSync(path.join(CLIENT, 'components', 'CustomerSearch.jsx')));
    const api = doc(CLIENT, 'utils', 'api.js');
    const ordersApi = (api.match(/export const ordersApi = \{[\s\S]*?\n\};/) || [''])[0];
    k('A3b api.js: ordersApi không còn create (tạo đơn thẳng), vẫn còn tinhThu · get · cancel', ordersApi.length > 0 && !/\bcreate\s*:/.test(ordersApi)
      && /tinhThu:/.test(ordersApi) && /\bget:/.test(ordersApi) && /cancel:/.test(ordersApi));
    const nhap = duyet(CLIENT, ['.js', '.jsx']).filter((f) => /from\s+['"][^'"]*\/(Sales|CustomerSearch)['"]/.test(fs.readFileSync(f, 'utf8')));
    k('A3c không file nào còn import Sales / CustomerSearch', nhap.length === 0, nhap.map((f) => path.relative(CLIENT, f)).join(', '));
  });

  // ═════════════════════════════════════════════════════════════════════════
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  const { getNow } = require(path.join(MAY_CHU, 'utils', 'helpers.js'));
  await db.initDatabase();
  const payosNhan = [];
  const gia = express();
  gia.use(express.json());
  gia.post('/v2/payment-requests', (req, res) => {
    payosNhan.push(req.body);
    const data = { orderCode: req.body.orderCode, amount: req.body.amount, description: req.body.description, status: 'PENDING',
      paymentLinkId: 'pl_' + req.body.orderCode, qrCode: 'QR_GIA_' + req.body.orderCode, checkoutUrl: 'https://gia/' + req.body.orderCode };
    res.json({ code: '00', desc: 'success', data, signature: hmac(chuoiKy(data)) });
  });
  const svGia = await new Promise((ok) => { const s = gia.listen(0, '127.0.0.1', () => ok(s)); });
  process.env.PAYOS_BASE_URL = `http://127.0.0.1:${svGia.address().port}`;
  const R = (f) => path.join(MAY_CHU, 'routes', f);
  const app = express();
  app.use(express.json());
  for (const r of ['customers', 'orders', 'wallets', 'packages']) app.use('/api/pos/' + r, require(R(r + '.js')));
  const tt = require(R('thanh-toan.js'));
  app.use('/api/pos/thanh-toan', tt);
  app.use('/api/payos/webhook', tt.webhook);
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  const datCaiDat = (key, value) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(value), getNow()]);
  // Cờ cũ để đúng giá trị gieo sẵn trên quầy (database.js: '0') — cổng mới không được dựa vào nó.
  for (const [a, b] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['flash_enabled', 'false'], ['signup_enabled', '0'],
    ['thanh_toan_payos_bat_buoc', '0']]) await datCaiDat(a, b);
  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 2');
  await db.run('UPDATE pos_products SET price = 25000 WHERE id IN (?, ?)', [sp[0].id, sp[1].id]);
  const mon = (sl = 1, i = 0, tuGoi) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type, sx_product_id: sp[i].sx_product_id, quantity: sl,
    ...(tuGoi ? { from_package: true } : {}) });
  const goi = async (method, url, body, tk = tkChu) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers: { 'Content-Type': 'application/json', ...(tk ? { Authorization: 'Bearer ' + tk } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined });
      let j = {}; try { j = await r.json(); } catch { /* không JSON */ }
      return { status: r.status, j };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.j?.code ? ' · ' + r.j.code : ''}${r.j?.error && r.status >= 400 ? ' · ' + String(r.j.error).slice(0, 80) : ''}`;
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const so = async (sql, p = []) => Number(Object.values((await db.queryOne(sql, p).catch(() => null)) || { n: -1 })[0] ?? 0);
  const soDu = (sdt) => so('SELECT COALESCE((SELECT balance FROM pos_wallets WHERE phone = ?), 0) AS n', [sdt]);
  // Dấu vết ghi: mọi bảng tiền / điểm / gói / phiên / mã / voucher / thẻ (B5: "không ghi gì").
  const vet = async () => JSON.stringify(await Promise.all([
    'SELECT COUNT(*) AS n FROM pos_orders', 'SELECT COUNT(*) AS n FROM pos_order_items', 'SELECT COUNT(*) AS n FROM pos_balance_transactions',
    'SELECT COALESCE(SUM(balance), 0) AS n FROM pos_wallets', 'SELECT COUNT(*) AS n FROM pos_point_transactions', 'SELECT COUNT(*) AS n FROM pos_customer_packages',
    'SELECT COALESCE(SUM(delivered_qty), 0) AS n FROM pos_customer_packages', 'SELECT COUNT(*) AS n FROM pos_phien_thanh_toan',
    'SELECT COALESCE(SUM(used_count), 0) AS n FROM pos_discount_codes', "SELECT COUNT(*) AS n FROM pos_voucher_grants WHERE status <> 'available'",
    'SELECT COUNT(*) AS n FROM pos_membership_purchases'].map((q) => so(q))));
  let soSdt = 0;
  const sdtMoi = () => '09' + String(41000000 + (++soSdt)).padStart(8, '0');
  const khach = async (napVi = 0, pin = '1357', me = null) => {
    const sdt = sdtMoi();
    await db.run('INSERT INTO pos_customers (phone, name, parent_phone, created_at) VALUES (?, ?, ?, ?)', [sdt, 'Khách ' + sdt, me, getNow()]);
    if (napVi) await goi('POST', '/pos/wallets/topup', { phone: sdt, amount: napVi });
    if (pin) await goi('POST', '/pos/thanh-toan/pin', { phone: sdt, pin, pin_lai: pin });
    return sdt;
  };
  const taoPhien = (than) => goi('POST', '/pos/thanh-toan/phien', than);
  const chot = (id, than = {}) => goi('POST', `/pos/thanh-toan/phien/${id}/chot`, than);
  const donDb = (id) => db.queryOne('SELECT * FROM pos_orders WHERE id = ?', [id]).catch(() => null);
  await db.run("INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active) VALUES ('GOI-BMC', 'Gói BMC', 200000, 'ly', 10, 1)");
  const goiMau = await db.queryOne("SELECT id FROM pos_packages WHERE code = 'GOI-BMC'");
  const muaGoiCu = async (sdt) => {   // gói khách đang dùng, mua từ TRƯỚC ngày cập nhật (dựng bằng thân taoDonGoc)
    const r = await donCu(MAY_CHU, { customer_phone: sdt, customer_name: 'K', items: [], package_buy: { package_id: goiMau.id }, payment_method: 'cash', cash_amount: 200000 });
    const cp = await db.queryOne('SELECT * FROM pos_customer_packages WHERE order_id = ?', [r.body?.order?.id]).catch(() => null);
    return { r, cp };
  };

  // Một ca CHẶN: đúng status + code, và dấu vết không đổi.
  const caChan = async (ten, gui, code) => {
    const t = await vet();
    const r = await gui();
    const sau = await vet();
    k(`${ten} → 400 ${code}, không ghi gì`, la(r, 400, code) && sau === t, `${moTa(r)}${sau === t ? '' : ' · dấu vết ' + t + ' → ' + sau}`);
  };
  const thang = (than) => () => goi('POST', '/pos/orders', than);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B1 · B2 · nợ] đường tạo đơn THẲNG chỉ nhận tiền mặt (cờ cũ thanh_toan_payos_bat_buoc = 0 như quầy thật)');
  await chay('B1', async () => {
    const kh = await khach(100000);
    const me = await khach(100000, '2468'), con = await khach(0, '1357', me);
    await caChan('B1a trừ tài khoản khách (balance_amount 25.000)', thang({ customer_phone: kh, items: [mon()], payment_method: 'cash', balance_amount: 25000 }), 'VI_PHAI_QUA_PIN');
    await caChan('B1b payment_method "balance" (trả hết bằng tài khoản)', thang({ customer_phone: kh, items: [mon()], payment_method: 'balance' }), 'VI_PHAI_QUA_PIN');
    await caChan('B1c tách tài khoản 10.000 + tiền mặt 15.000', thang({ customer_phone: kh, items: [mon()], payment_method: 'cash', balance_amount: 10000, cash_amount: 15000 }), 'VI_PHAI_QUA_PIN');
    await caChan('B1d trừ tài khoản MẸ (parent_balance_amount 25.000, đúng mẹ)', thang({ customer_phone: con, parent_phone: me, items: [mon()], payment_method: 'cash',
      parent_balance_amount: 25000 }), 'VI_PHAI_QUA_PIN');
    await caChan('B2a chuyển khoản (transfer_amount 25.000)', thang({ items: [mon()], payment_method: 'transfer', transfer_amount: 25000 }), 'CK_PHAI_QUA_PAYOS');
    await caChan('B2b nhãn "transfer" nhưng số ở cash_amount', thang({ items: [mon()], payment_method: 'transfer', cash_amount: 25000 }), 'CK_PHAI_QUA_PAYOS');
    await caChan('B2c transfer_amount dưới nhãn "cash"', thang({ items: [mon()], payment_method: 'cash', transfer_amount: 25000 }), 'CK_PHAI_QUA_PAYOS');
    // Soát vòng 1 lỗi 1: thân cộng transfer_amount KHÁC 0 bất kỳ dấu (orders.js `(Number(transfer_amount) || 0)`) — cổng phải cùng biểu thức.
    await caChan('B2d chuyển khoản ÂM (tiền mặt 35.000 + CK −10.000 = 25.000)', thang({ items: [mon()], payment_method: 'cash', cash_amount: 35000,
      transfer_amount: -10000 }), 'CK_PHAI_QUA_PAYOS');
    await caChan('B2e chuyển khoản dạng chuỗi "-10000"', thang({ items: [mon()], payment_method: 'cash', cash_amount: 35000, transfer_amount: '-10000' }),
      'CK_PHAI_QUA_PAYOS');
    await caChan('N1 ghi nợ (payment_method debt, debt_amount 25.000)', thang({ customer_phone: kh, customer_name: 'K', items: [mon()], payment_method: 'debt',
      debt_amount: 25000, due_date: '2026-12-31' }), 'KHONG_GHI_NO');
    await caChan('N2 chờ thu (payment_method cho_thu)', thang({ items: [mon()], payment_method: 'cho_thu', debt_amount: 25000 }), 'KHONG_GHI_NO');
    await caChan('N3 tiền mặt 10.000 + nợ 15.000 (nhãn combined)', thang({ customer_phone: kh, customer_name: 'K', items: [mon()], payment_method: 'combined',
      cash_amount: 10000, debt_amount: 15000 }), 'KHONG_GHI_NO');
    await caChan('N4 nhãn "debt" mà số ở cash_amount', thang({ items: [mon()], payment_method: 'debt', cash_amount: 25000 }), 'KHONG_GHI_NO');
    await datCaiDat('thanh_toan_payos_bat_buoc', '1');
    await caChan('B1e cờ cũ = 1: vẫn chặn y như cờ 0 (tài khoản)', thang({ customer_phone: kh, items: [mon()], payment_method: 'balance' }), 'VI_PHAI_QUA_PIN');
    await datCaiDat('thanh_toan_payos_bat_buoc', '0');
    // Hai quầy cùng bấm (B5): hai yêu cầu trừ ví cùng lúc → cả hai bị chặn, số dư không đổi.
    const t = await vet();
    const [x, y] = await Promise.all([1, 2].map(() => goi('POST', '/pos/orders', { customer_phone: kh, items: [mon()], payment_method: 'cash', balance_amount: 25000 })));
    k('B5 hai quầy cùng gửi trừ tài khoản → cả hai 400 VI_PHAI_QUA_PIN, số dư vẫn 100.000, không ghi gì', la(x, 400, 'VI_PHAI_QUA_PIN')
      && la(y, 400, 'VI_PHAI_QUA_PIN') && (await soDu(kh)) === 100000 && (await vet()) === t, `${moTa(x)} · ${moTa(y)} · ${await soDu(kh)}`);
  });

  muc('[B3] gói: quầy tạm ngưng mua gói và lấy món từ gói ở MỌI lối');
  await chay('B3', async () => {
    const kh = await khach(0);
    const mua = { customer_phone: kh, customer_name: 'K', items: [], package_buy: { package_id: goiMau.id } };
    await caChan('G1 đường thẳng mua gói (tiền mặt 200.000)', thang({ ...mua, payment_method: 'cash', cash_amount: 200000 }), 'GOI_TAM_DUNG');
    await caChan('G2 đường thẳng package_buy: {} (thân rỗng)', thang({ ...mua, package_buy: {}, items: [mon(1, 0, true)], payment_method: 'cash', cash_amount: 0 }), 'GOI_TAM_DUNG');
    await caChan('G3 tinh-thu mua gói', () => goi('POST', '/pos/orders/tinh-thu', mua), 'GOI_TAM_DUNG');
    await caChan('G4 tạo phiên tiền mặt mua gói', () => taoPhien({ cach: 'tien_mat', don: mua }), 'GOI_TAM_DUNG');
    const qr0 = payosNhan.length;
    await caChan('G5 tạo phiên QR mua gói', () => taoPhien({ cach: 'payos', don: mua }), 'GOI_TAM_DUNG');
    k('G5b phiên QR mua gói: không gọi cổng QR', payosNhan.length === qr0, `${qr0} → ${payosNhan.length}`);
    const { r: m, cp } = await muaGoiCu(kh);
    k('G6 (đối chứng) gói CŨ đang dùng dựng bằng thân taoDonGoc → 200, gói active', m.status === 200 && cp?.status === 'active', `HTTP ${m.status} · ${cp?.status}`);
    const lay = { customer_phone: kh, customer_name: 'K', customer_package_id: cp?.id, items: [mon(1, 0, true)] };
    await caChan('G7 đường thẳng lấy 1 ly từ gói cũ', thang({ ...lay, payment_method: 'cash', cash_amount: 0 }), 'GOI_TAM_DUNG');
    await caChan('G8 tinh-thu lấy từ gói', () => goi('POST', '/pos/orders/tinh-thu', lay), 'GOI_TAM_DUNG');
    await caChan('G9 tạo phiên tiền mặt lấy từ gói', () => taoPhien({ cach: 'tien_mat', don: lay }), 'GOI_TAM_DUNG');
    await caChan('G10 from_package không kèm mã gói', thang({ customer_phone: kh, items: [mon(1, 0, true)], payment_method: 'cash', cash_amount: 0 }), 'GOI_TAM_DUNG');
    await caChan('G11 chỉ customer_package_id (gia hạn / bật gói, món thường trả tiền)', thang({ customer_phone: kh, customer_package_id: cp?.id, items: [mon()],
      payment_method: 'cash', cash_amount: 25000 }), 'GOI_TAM_DUNG');
    // Phiên tạo TRƯỚC ngày cập nhật mà thân có gói: chốt bị chặn, phiên thôi giữ ('loi'), không đơn.
    const now = getNow();
    const ins = await db.run(`INSERT INTO pos_phien_thanh_toan (than, tong, phone, giu_vi, giu_vi_me, con_lai, cach, het_han, nguoi_tao, tao_luc)
      VALUES (?, 200000, ?, 0, 0, 200000, 'tien_mat', strftime('%Y-%m-%dT%H:%M:%S', ?, '+10 minutes'), 'chu', ?)`, [JSON.stringify(mua), kh, now, now]);
    const idCu = Number(ins.lastInsertRowid);
    await caChan('G12 chốt phiên CŨ (tạo trước cập nhật) có thân mua gói', () => chot(idCu, { cash_received: 200000 }), 'GOI_TAM_DUNG');
    const pCu = await db.queryOne('SELECT trang_thai, order_id FROM pos_phien_thanh_toan WHERE id = ?', [idCu]);
    k('G12b phiên cũ có gói sau khi chốt hỏng: trạng thái loi (thôi giữ), không gắn đơn', pCu?.trang_thai === 'loi' && !pCu?.order_id, JSON.stringify(pCu));
  });

  muc('[K] khoá cửa chặn: thân taoDonGoc không lối nào khác gọi');
  await chay('K', async () => {
    const dong = duyet(MAY_CHU, ['.js']).filter((f) => !f.includes('node_modules')).flatMap((f) => sach(fs.readFileSync(f, 'utf8')).split('\n')
      .filter((d) => /\btaoDonGoc\b/.test(d)).map((d) => [path.relative(MAY_CHU, f), d.trim()]));
    const tep = [...new Set(dong.map(([f]) => f))];
    k('K1 chữ taoDonGoc chỉ ở routes/orders.js, đúng 3 dòng (định nghĩa · lời gọi trong taoDon · export)', tep.length === 1 && tep[0] === path.join('routes', 'orders.js')
      && dong.length === 3 && dong.some(([, d]) => /^async function taoDonGoc\(req, res, phien = null\)/.test(d))
      && dong.some(([, d]) => /^module\.exports\.taoDonGoc = taoDonGoc;$/.test(d)) && dong.some(([, d]) => /return taoDonGoc\(req, res, phien\)/.test(d)),
    dong.map(([f, d]) => `${f}: ${d.slice(0, 60)}`).join(' | '));
    // K2 (soát vòng 1 lỗi 5b): mọi lối tạo đơn của máy chủ đi qua cửa chặn `taoDon` — so BẰNG đúng 6 lời gọi (kế hoạch mục 1). Lối mới
    // phải thêm vào danh sách này (có chủ ý), không được tự lọt.
    const GOI = [['routes/orders.js', 2], ['utils/giuCho.js', 2], ['utils/donApp.js', 1], ['utils/manKhach.js', 1]];
    const goiTaoDon = duyet(MAY_CHU, ['.js']).filter((f) => !f.includes('node_modules')).map((f) => [path.relative(MAY_CHU, f).split(path.sep).join('/'),
      (sach(fs.readFileSync(f, 'utf8')).match(/(?<![\w.])taoDon\s*\(/g) || []).length - (/async function taoDon\s*\(/.test(sach(fs.readFileSync(f, 'utf8'))) ? 1 : 0)])
      .filter(([, n]) => n > 0).sort();
    k('K2 lời gọi taoDon( ở server/ đúng 6 chỗ: orders.js 2 (route thẳng, tinh-thu) · giuCho.js 2 (tạo / chốt phiên) · donApp.js 1 · manKhach.js 1',
      JSON.stringify(goiTaoDon) === JSON.stringify(GOI.slice().sort()), JSON.stringify(goiTaoDon));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] luồng hợp lệ PHẢI KHÔNG bị chặn (K5)');
  const PIN = '1357';
  await chay('C1', async () => {
    const a = await goi('POST', '/pos/orders', { items: [mon()], payment_method: 'cash', cash_amount: 25000, cash_received: 50000, change_amount: 25000 });
    k('C1a đường thẳng tiền mặt → 200, tổng 25.000', la(a, 200) && a.j.order?.total === 25000, moTa(a));
    const p1 = (await taoPhien({ cach: 'tien_mat', don: { items: [mon()] } })).j.phien;
    const c1 = await chot(p1?.id, { cash_received: 50000 });
    k('C1b phiên tiền mặt → chốt 200, đơn cash 25.000', la(c1, 200) && Number((await donDb(c1.j.order?.id))?.cash_amount) === 25000, moTa(c1));
    const kh = await khach(100000);
    const p2 = (await taoPhien({ cach: 'tai_khoan', don: { customer_phone: kh, customer_name: 'K', items: [mon()] }, tru_tai_khoan: true, pin: PIN })).j.phien;
    const c2 = await chot(p2?.id);
    k('C1c phiên tài khoản + PIN đúng → 200, trừ đúng 25.000 (còn 75.000)', la(c2, 200) && (await soDu(kh)) === 75000, `${moTa(c2)} · ${await soDu(kh)}`);
    const me = await khach(100000, '2468'), con = await khach(0, PIN, me);
    const p3 = (await taoPhien({ cach: 'tai_khoan', don: { customer_phone: con, customer_name: 'Con', items: [mon()], parent_phone: me },
      tru_tai_khoan_me: true, pin_me: '2468' })).j.phien;
    const c3 = await chot(p3?.id);
    k('C1d phiên tài khoản MẸ + PIN mẹ → 200, mẹ còn 75.000', la(c3, 200) && (await soDu(me)) === 75000, `${moTa(c3)} · ${await soDu(me)}`);
    const kt = await khach(10000);
    const p4 = (await taoPhien({ cach: 'tien_mat', don: { customer_phone: kt, customer_name: 'K', items: [mon()] }, tru_tai_khoan: true, pin: PIN })).j.phien;
    const c4 = await chot(p4?.id, { cash_received: 20000 });
    const d4 = await donDb(c4.j.order?.id);
    k('C1e tách tài khoản 10.000 + tiền mặt 15.000 → 200, ví 0, đơn ghi đúng hai phần', la(c4, 200) && (await soDu(kt)) === 0
      && Number(d4?.balance_amount) === 10000 && Number(d4?.cash_amount) === 15000, `${moTa(c4)} · ${d4?.balance_amount}/${d4?.cash_amount}`);
    const p5 = (await taoPhien({ cach: 'ck_tay', don: { items: [mon()] } })).j.phien;
    const c5 = await goi('POST', `/pos/thanh-toan/phien/${p5?.id}/xac-nhan-tay`, { ly_do: 'Khách đưa màn hình chuyển khoản' });
    k('C1f phiên chuyển khoản tay + xác nhận tay → 200, đơn transfer 25.000', la(c5, 200)
      && Number((await donDb(c5.j.order?.id))?.transfer_amount) === 25000, moTa(c5));
    const p6 = (await taoPhien({ cach: 'payos', don: { items: [mon(2)] } })).j.phien;
    const data = { orderCode: p6?.id, amount: p6?.con_lai, description: p6?.noi_dung || 'x', accountNumber: '12345678', reference: 'REF_BMC_1',
      transactionDateTime: getNow().replace('T', ' '), currency: 'VND', paymentLinkId: 'pl_' + p6?.id, code: '00', desc: 'success',
      counterAccountBankId: '', counterAccountName: null };
    const w = await goi('POST', '/payos/webhook', { code: '00', desc: 'success', success: true, data, signature: hmac(chuoiKy(data)) }, null);
    const p6b = await db.queryOne('SELECT order_id FROM pos_phien_thanh_toan WHERE id = ?', [p6?.id]).catch(() => null);
    k('C1j phiên QR + tiền về (webhook ký đúng) → đơn tạo, transfer 50.000', la(w, 200) && Number((await donDb(p6b?.order_id))?.transfer_amount) === 50000,
      `${moTa(w)} · đơn ${p6b?.order_id}`);
  });
  await chay('C1g', async () => {
    await db.run(`INSERT INTO pos_membership_tiers (name, card_price, discount_percent, is_active, sort_order, goi) VALUES ('Vàng BMC', 300000, 10, 1, 99,
      json_array(json_object('so_thang', 3, 'gia', 300000, 'bat', json('true'))))`);
    const hang = await db.queryOne("SELECT id FROM pos_membership_tiers WHERE name = 'Vàng BMC'");
    const a = await goi('POST', '/pos/orders', { customer_phone: await khach(0, null), customer_name: 'K', items: [], membership_buy: { tier_id: hang.id, so_thang: 3 },
      payment_method: 'cash', cash_amount: 300000 });
    const p = (await taoPhien({ cach: 'tien_mat', don: { customer_phone: await khach(0, null), customer_name: 'K', items: [], membership_buy: { tier_id: hang.id, so_thang: 3 } } })).j;
    const c = await chot(p.phien?.id, { cash_received: 300000 });
    k('C1g mua hạng thẻ tiền mặt: đường thẳng → 200; qua phiên → 200', la(a, 200) && la(c, 200), `${moTa(a)} · phiên ${p.code || ''} · ${moTa(c)}`);
    const nap = Number((await db.run(`INSERT INTO pos_goi_nap (ten, khach_tra, vao_tk, is_active, thu_tu, created_at, updated_at)
      VALUES ('Nạp BMC', 100000, 110000, 1, 1, ?, ?)`, [getNow(), getNow()])).lastInsertRowid);
    const kn = await khach(0, null);
    const n1 = await goi('POST', '/pos/orders', { customer_phone: kn, customer_name: 'K', items: [], goi_nap_id: nap, payment_method: 'cash', cash_amount: 100000 });
    const pn = (await taoPhien({ cach: 'tien_mat', don: { customer_phone: kn, customer_name: 'K', items: [], goi_nap_id: nap } })).j.phien;
    const n2 = await chot(pn?.id, { cash_received: 100000 });
    k('C1h nạp tiền tiền mặt: đường thẳng → 200; qua phiên → 200; tài khoản +220.000', la(n1, 200) && la(n2, 200) && (await soDu(kn)) === 220000,
      `${moTa(n1)} · ${moTa(n2)} · ${await soDu(kn)}`);
  });
  await chay('C2', async () => {
    // Đơn giao (GIAO-1/2) qua phiên: báo phí gieo sẵn như máy chủ đã tính (khuôn bảng pos_giao_bao_phi), phí do máy chủ lấy từ báo phí.
    const now = getNow();
    await db.run(`INSERT INTO pos_giao_bao_phi (ma, dia_chi, lat, lng, km, loai_xe, phi, het_han, nguoi_tao, tao_luc)
      VALUES ('BMC_BP1', 'Số 1 Ngõ Thử, Hà Nội', 21.02, 105.82, 2.5, 'BIKE', 15000, strftime('%Y-%m-%dT%H:%M:%S', ?, '+30 minutes'), 'chu', ?)`, [now, now]);
    const giao = { ma_bao_phi: 'BMC_BP1', ten: 'Chị Nhận', sdt: '0988000111', ghi_chu: 'Gọi trước' };
    const tinh = await goi('POST', '/pos/orders/tinh-thu', { items: [mon()], giao });
    const p = (await taoPhien({ cach: 'tien_mat', don: { customer_name: 'Khách giao', items: [mon()], giao } })).j.phien;
    const c = await chot(p?.id, { cash_received: 50000 });
    const chuyen = c.j.order ? await db.queryOne('SELECT ma_bao_phi, phi_khach FROM pos_giao_chuyen WHERE order_id = ?', [c.j.order.id]).catch(() => null) : null;
    k('C2 đơn giao qua phiên tiền mặt → 200, tổng = tinh-thu (25.000 + phí 15.000), ghi chuyến giao với đúng báo phí', la(c, 200) && tinh.j.total === 40000
      && p?.tong === 40000 && chuyen?.ma_bao_phi === 'BMC_BP1' && Number(chuyen?.phi_khach) === 15000, `${moTa(c)} · ${tinh.j.total}/${p?.tong} · ${JSON.stringify(chuyen)}`);
  });
  await chay('C1i', async () => {
    await db.run("INSERT INTO pos_discount_codes (code, discount_type, discount_value, usage_limit, used_count, is_active) VALUES ('BMC10', 'percent', 10, 0, 0, 1)");
    const kh = await khach(0, null);
    const don = { customer_phone: kh, customer_name: 'K', items: [mon(2)], discount_code: 'BMC10' };
    const tinh = await goi('POST', '/pos/orders/tinh-thu', don);
    const p = (await taoPhien({ cach: 'tien_mat', don })).j.phien;
    const c = await chot(p?.id, { cash_received: 50000 });
    k('C1i mã giảm 10 % qua phiên → 200, tổng = tinh-thu = 45.000, mã +1 lượt', la(c, 200) && tinh.j.total === 45000 && c.j.order?.total === 45000
      && (await so("SELECT used_count AS n FROM pos_discount_codes WHERE code = 'BMC10'")) === 1, `${moTa(c)} · ${tinh.j.total} · ${c.j.order?.total}`);
    const ma = 'BMCV' + ngauNhien().slice(0, 6).toUpperCase();
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, valid_to, is_active)
      VALUES (?, 'fixed', 5000, 0, 0, 1, 0, '2099-12-31', 1)`, [ma]);
    await db.run("INSERT INTO pos_voucher_grants (code, customer_phone, status, granted_at, expires_at) VALUES (?, ?, 'available', ?, '2099-12-31')", [ma, kh, getNow()]);
    const dv = { customer_phone: kh, customer_name: 'K', items: [mon()], vouchers: [ma] };
    const tv = await goi('POST', '/pos/orders/tinh-thu', dv);
    const pv = (await taoPhien({ cach: 'tien_mat', don: dv })).j.phien;
    const cv = await chot(pv?.id, { cash_received: 25000 });
    const g = await db.queryOne('SELECT status FROM pos_voucher_grants WHERE code = ?', [ma]);
    k('C1i voucher 5.000 qua phiên → 200, tổng = tinh-thu = 20.000, voucher đã dùng', la(cv, 200) && tv.j.total === 20000 && cv.j.order?.total === 20000
      && g?.status !== 'available', `${moTa(cv)} · ${tv.j.total} · ${cv.j.order?.total} · ${g?.status}`);
  });
  await chay('C1k', async () => {
    const kh = await khach(0, null);
    const hang = await db.queryOne("SELECT id FROM pos_membership_tiers WHERE name = 'Vàng BMC'");
    await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
      VALUES (?, ?, 'Vàng BMC', 0, NULL, ?, '2099-12-31T00:00:00')`, [kh, hang?.id, getNow()]);
    const gio = getNow().slice(11, 16);
    const [bd, kt] = gio < '12:00' ? ['00:00', '23:59'] : ['12:00', '11:59'];
    for (const [a, b] of [['flash_enabled', 'true'], ['flash_start', bd], ['flash_end', kt], ['flash_percent', '20'],
      ['flash_product_keys', JSON.stringify([`${sp[1].sx_product_type}_${sp[1].sx_product_id}`])]]) await datCaiDat(a, b);
    // Máy chủ: đơn có món Flash thì KHÔNG cộng giảm hạng (orders.js `if (!flashApplied && phone)`) → hai đơn riêng.
    const qua = async (don) => {
      const tinh = await goi('POST', '/pos/orders/tinh-thu', don);
      const p = (await taoPhien({ cach: 'tien_mat', don })).j.phien;
      return { tinh, p, c: await chot(p?.id, { cash_received: 50000 }) };
    };
    const h = await qua({ customer_phone: kh, customer_name: 'K', items: [mon(1, 0)] });
    k('C1k khách hạng (giảm 10 %) qua phiên → 200, giảm hạng 2.500, tổng đơn = tinh-thu = 22.500', la(h.c, 200) && h.tinh.j.tier_discount === 2500
      && h.p?.tong === 22500 && h.c.j.order?.total === 22500, `${moTa(h.c)} · hạng ${h.tinh.j.tier_discount} · ${h.tinh.j.total}/${h.p?.tong}/${h.c.j.order?.total}`);
    const f = await qua({ items: [mon(1, 1)] });
    await datCaiDat('flash_enabled', 'false');
    k('C1l Giờ vàng 20 % qua phiên → 200, giảm flash 5.000, tổng đơn = tinh-thu = 20.000', la(f.c, 200) && f.tinh.j.flash_discount === 5000
      && f.p?.tong === 20000 && f.c.j.order?.total === 20000, `${moTa(f.c)} · flash ${f.tinh.j.flash_discount} · ${f.tinh.j.total}/${f.p?.tong}/${f.c.j.order?.total}`);
  });

  muc('[C5 · C6] đơn CŨ (dựng bằng thân taoDonGoc, như dữ liệu đang có trên quầy): xem, huỷ, thu nợ, kết thúc gói');
  await chay('C5', async () => {
    const huy = (id) => goi('PUT', `/pos/orders/${id}/cancel`, { ly_do_ma: 'khach_doi_y' });
    const kh = await khach(100000);
    const d1 = await donCu(MAY_CHU, { customer_phone: kh, customer_name: 'K', items: [mon()], payment_method: 'cash', balance_amount: 10000, cash_amount: 15000 });
    const ls = await goi('GET', `/pos/orders?customer_phone=${kh}`);
    k('C5a đơn cũ trừ ví MỘT PHẦN (10.000 / 100.000) → có trong Lịch sử đơn (GET /orders)', d1.status === 200
      && (ls.j.orders || []).some((o) => o.id === d1.body?.order?.id), `HTTP ${d1.status} · ${moTa(ls)}`);
    const h1 = await huy(d1.body?.order?.id);
    // HUY-1 (thu_HUY1 D4): huỷ hoàn TOÀN BỘ đã trả vào tài khoản — 100.000 − 10.000 + 10.000 (ví) + 15.000 (tiền mặt) = 115.000.
    k('C5b huỷ đơn cũ trừ ví một phần → 200, tài khoản 115.000 (hoàn đủ 25.000 như HUY-1)', la(h1, 200) && (await soDu(kh)) === 115000, `${moTa(h1)} · ${await soDu(kh)}`);
    const me = await khach(100000, '2468'), con = await khach(0, PIN, me);
    const d2 = await donCu(MAY_CHU, { customer_phone: con, parent_phone: me, customer_name: 'Con', items: [mon()], payment_method: 'cash', parent_balance_amount: 25000 });
    const h2 = await huy(d2.body?.order?.id);
    k('C5c đơn cũ trừ ví MẸ → huỷ 200, mẹ về lại 100.000', d2.status === 200 && la(h2, 200) && (await soDu(me)) === 100000, `HTTP ${d2.status} · ${moTa(h2)} · ${await soDu(me)}`);
    const d3 = await donCu(MAY_CHU, { items: [mon()], payment_method: 'transfer', transfer_amount: 25000 });
    const h3 = await huy(d3.body?.order?.id);
    k('C5d đơn cũ chuyển khoản → huỷ 200, đơn cancelled', d3.status === 200 && la(h3, 200) && (await donDb(d3.body?.order?.id))?.status === 'cancelled', moTa(h3));
    const kg = await khach(0);
    const { r: m, cp } = await muaGoiCu(kg);
    const l = await donCu(MAY_CHU, { customer_phone: kg, customer_name: 'K', customer_package_id: cp?.id, items: [mon(2, 0, true)], payment_method: 'cash', cash_amount: 0 });
    const da = await so('SELECT delivered_qty AS n FROM pos_customer_packages WHERE id = ?', [cp?.id]);
    const hl = await huy(l.body?.order?.id);
    const sau = await so('SELECT delivered_qty AS n FROM pos_customer_packages WHERE id = ?', [cp?.id]);
    k('C5e đơn cũ LẤY 2 ly từ gói → huỷ 200, gói hoàn 2 lượt (2 → 0)', l.status === 200 && da === 2 && la(hl, 200) && sau === 0, `HTTP ${l.status} · ${da} → ${moTa(hl)} → ${sau}`);
    const hm = await huy(m.body?.order?.id);
    const conGoi = await so('SELECT COUNT(*) AS n FROM pos_customer_packages WHERE id = ?', [cp?.id]);
    k('C5f đơn cũ MUA gói (chưa lấy lượt nào sau C5e) → huỷ 200, gói bị bỏ (như HUY-1, orders.js huỷ đơn mua gói)', m.status === 200 && la(hm, 200) && conGoi === 0,
      `${moTa(hm)} · còn ${conGoi} dòng gói`);
    const { r: m2, cp: cp2 } = await muaGoiCu(kg);
    await donCu(MAY_CHU, { customer_phone: kg, customer_name: 'K', customer_package_id: cp2?.id, items: [mon(1, 0, true)], payment_method: 'cash', cash_amount: 0 });
    const hm2 = await huy(m2.body?.order?.id);
    const cpSau = await db.queryOne('SELECT status FROM pos_customer_packages WHERE id = ?', [cp2?.id]);
    k('C5h đơn cũ MUA gói đã lấy 1 lượt → huỷ 200, gói cancelled (giữ làm lịch sử)', la(hm2, 200) && cpSau?.status === 'cancelled', `${moTa(hm2)} · ${cpSau?.status}`);
    const no = await donCu(MAY_CHU, { customer_phone: kh, customer_name: 'K', items: [mon()], payment_method: 'debt', debt_amount: 25000, due_date: '2026-12-31' });
    const tn = await goi('POST', `/pos/orders/${no.body?.order?.id}/pay-debt`, { payment_method: 'cash', amount: 25000 });
    k('C5g đơn NỢ cũ → thu nợ tiền mặt 200, đơn paid (đơn nợ cũ vẫn thu được)', no.status === 200 && la(tn, 200)
      && (await donDb(no.body?.order?.id))?.payment_status === 'paid', `HTTP ${no.status} · ${moTa(tn)}`);
  });
  await chay('C6', async () => {
    const kh = await khach(0);
    const { cp } = await muaGoiCu(kh);
    const kt = await goi('PUT', `/pos/packages/customer-packages/${cp?.id}/cancel`, { reason: 'Kết thúc gói thử BO-MAN-CU-1', hoan: false });
    const ds = await goi('GET', `/pos/packages/customer-packages/theo-khach?loc=xong&phone=${kh}`);
    const thay = JSON.stringify(ds.j.data || []);
    k('C6 kết thúc gói cũ (không hoàn) → 200; Báo cáo › Gói vẫn xem được gói đã kết thúc (lọc "xong")', la(kt, 200) && la(ds, 200)
      && (await so('SELECT COUNT(*) AS n FROM pos_customer_packages WHERE id = ? AND status = ?', [cp?.id, 'cancelled'])) === 1 && thay.includes(kh),
    `${moTa(kt)} · ${moTa(ds)} · ${thay.slice(0, 100)}`);
  });

  sv.close(); svGia.close();
}

main().catch((e) => { noiLai(); console.error('Bài thử sập:', e); hong++; }).finally(() => {
  noiLai();
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* — */ }
  console.log(`\nBO-MAN-CU-1: ${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
});
