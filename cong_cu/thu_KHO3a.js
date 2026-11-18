#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KHO-3a — ngắt hẳn SX: menu từ pos_products, bán trừ kho POS trong CÙNG giao dịch, giữ hàng theo phiên, lưới an toàn
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:  node cong_cu/thu_KHO3a.js
 *  Khuôn thu_KHO2b.js + thu_KHMUA1.js: database.js thật + libsql kho TẠM, route thật qua app.listen(0), JWT theo vai trò, payOS giả.
 *  KHÔNG thay utils/sxApi.js: ketNoiKho trỏ SX vào một máy GIẢ trên 127.0.0.1 ĐẾM mọi lần gọi — bản vá phải gọi 0 lần (C1, C2).
 *  Đồng hồ: TZ=UTC, `datGio('YYYY-MM-DDTHH:mm:ss')` = giờ Việt Nam. Ca đua dùng Promise.all thật.
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const MAY_CHU = path.join(GOC, 'server');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_kho3a_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_kho3a_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_kho3a_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.kho3a.local/tra-ve';

const DateGoc = Date;
let gioGia = null;
global.Date = class extends DateGoc {
  constructor(...a) { if (a.length) super(...a); else super(gioGia ?? DateGoc.now()); }
  static now() { return gioGia ?? DateGoc.now(); }
};
const datGio = (vn) => { gioGia = vn ? DateGoc.parse(vn + '+07:00') : null; };

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
let nhatKyLoi = [];
const imLang = () => { console.log = () => {}; console.error = (...a) => nhatKyLoi.push(a.join(' ')); console.warn = (...a) => nhatKyLoi.push(a.join(' ')); };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const chuoiKy = (d) => Object.keys(d).sort().map((x) => `${x}=${d[x] == null ? '' : d[x]}`).join('&');
const hmac = (s) => crypto.createHmac('sha256', KHOA.ck).update(s).digest('hex');
const gan = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-6;
const doc = (p) => { try { return fs.readFileSync(path.join(GOC, p), 'utf8'); } catch { return ''; } };
const coFile = (p) => fs.existsSync(path.join(GOC, p));

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));

  // SX GIẢ — trả danh sách món (đường cũ) và ĐẾM mọi lần gọi. Trỏ ketNoiKho vào nó TRƯỚC khi nạp sxApi / route.
  const sxNhan = [];
  const sxApp = express();
  sxApp.use(express.json());
  sxApp.use((q, r) => { sxNhan.push(q.method + ' ' + q.path); r.json(q.path.includes('products-with-stock') ? [] : { sufficient: true, stock: 999, ok: true }); });
  const svSx = await new Promise((ok) => { const s = sxApp.listen(0, '127.0.0.1', () => ok(s)); });
  const SX_URL = `http://127.0.0.1:${svSx.address().port}`;
  const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
  require.cache[duongKN] = { id: duongKN, filename: duongKN, loaded: true,
    exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => SX_URL, FILE_THU: FILE_KHO } };

  // payOS giả
  const gia = express();
  gia.use(express.json());
  gia.post('/v2/payment-requests', (req, res) => {
    const data = { orderCode: req.body.orderCode, amount: req.body.amount, description: req.body.description, status: 'PENDING',
      paymentLinkId: 'pl_' + req.body.orderCode, qrCode: 'QR_GIA_' + req.body.orderCode, checkoutUrl: 'https://gia/' + req.body.orderCode };
    res.json({ code: '00', desc: 'success', data, signature: hmac(chuoiKy(data)) });
  });
  const svGia = await new Promise((ok) => { const s = gia.listen(0, '127.0.0.1', () => ok(s)); });
  process.env.PAYOS_BASE_URL = `http://127.0.0.1:${svGia.address().port}`;

  const db = require(path.join(MAY_CHU, 'database.js'));
  const { getNow } = require(path.join(MAY_CHU, 'utils', 'helpers.js'));
  await db.initDatabase();
  // B7: móc giao dịch — ném lỗi giả khi chèn dòng phiếu bán (trừ kho trong giao dịch đơn)
  let mocNemBan = false;
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const tx = await txGoc(...a);
    const runGoc = tx.run;
    tx.run = async (sql, p) => {
      if (mocNemBan && /INSERT INTO kho_phieu_dong/.test(sql)) { mocNemBan = false; throw new Error('lỗi CSDL giả giữa trừ kho (bài thử)'); }
      return runGoc(sql, p);
    };
    return tx;
  };

  const R = (f) => path.join(MAY_CHU, 'routes', f);
  const nap = (p) => { try { return require(p); } catch (e) { return null; } };
  const app = express();
  app.use(express.json());
  app.use('/api/pos/products', require(R('products.js')));
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/wallets', require(R('wallets.js')));
  app.use('/api/pos/settings', require(R('settings.js')));
  app.use('/api/pos/backup', require(R('backup.js')));
  app.use('/api/pos/registrations', require(R('registrations.js')));
  app.use('/api/pos/so-no', require(R('so-no.js')));
  app.use('/api/pos/damages', require(R('damages.js')));
  const tt = require(R('thanh-toan.js'));
  app.use('/api/pos/thanh-toan', tt);
  app.use('/api/payos/webhook', tt.webhook);
  app.use('/api/pos/kh', require(R('kh/quay.js')));
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const khoDuong = nap(path.join(MAY_CHU, 'kho', 'duong.js'));
  if (typeof khoDuong === 'function') app.use('/api/pos/kho', khoDuong);
  const { kyTokenKhach } = require(path.join(MAY_CHU, 'middleware', 'khachAuth.js'));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  // Đếm mọi lời gọi mạng RA NGOÀI các máy của bài (SX giả nằm trong danh sách đếm riêng — sxNhan).
  const fetchGoc = global.fetch;
  const raNgoai = [];
  global.fetch = (url, ...a) => {
    const u = String(url?.url || url);
    if (!u.startsWith(goc) && !u.startsWith(process.env.PAYOS_BASE_URL) && !u.startsWith(SX_URL)) raNgoai.push(u);
    return fetchGoc(url, ...a);
  };

  // ── Người, quyền, token ──
  const q = (sql, a = []) => db.query(sql, a).catch(() => []);
  const ghiDb = (sql, a = []) => db.run(sql, a);
  const mot = (sql, a = []) => db.queryOne(sql, a).catch(() => null);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const chu = await mot("SELECT id, username FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const nguoi = { chu: chu.id };
  for (const [ai, ten, vaiTro] of [['ql', 'ql_k3a', 'manager'], ['nv', 'nv_k3a', 'staff']]) {
    nguoi[ai] = Number((await ghiDb("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)", [ten, ten, vaiTro])).lastInsertRowid);
  }
  await ghiDb("INSERT OR REPLACE INTO pos_permissions (role, permission, allowed) VALUES ('manager', 'manage_settings', 1)");
  await ghiDb("INSERT OR REPLACE INTO pos_permissions (role, permission, allowed) VALUES ('staff', 'manage_settings', 0)");
  const the = Object.fromEntries(Object.entries(nguoi).map(([a, id]) => [a, jwt.sign({ userId: id }, KHOA_NV, { expiresIn: '3650d' })]));
  const goi = async (ai, method, url, body, tkKhach) => {
    imLang();
    try {
      const headers = {};
      if (ai) headers.Authorization = 'Bearer ' + the[ai];
      if (tkKhach) headers.Authorization = 'Bearer ' + tkKhach;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      return { status: r.status, j, tho };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.j?.code ? ' · ' + r.j.code : ''}${r.j?.error ? ' · ' + r.j.error : ''}`;
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.stack?.split('\n').slice(0, 2).join(' | ')); } };
  const datCaiDat = (key, value) => ghiDb(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, String(value), getNow()]);
  for (const [a, b] of [['loyalty_enabled', 'false'], ['flash_enabled', 'false'], ['signup_enabled', '0'], ['thanh_toan_payos_bat_buoc', '0'],
    ['gio_hd_lich', ''], ['gio_hd_ngung_truoc_phut', '0']]) await datCaiDat(a, b);

  console.log('\nTHỬ KHO-3a — menu từ POS · bán trừ kho POS · giữ hàng · lưới an toàn · gỡ SX');
  datGio('2026-11-18T09:00:00');

  // ── Dữ liệu nền: nguyên liệu, món, công thức, lô ──
  const nhom = Number((await ghiDb("INSERT INTO kho_nhom_nguyen_lieu (ten, thu_tu) VALUES ('Nhóm thử K3a', 1)")).lastInsertRowid);
  const themNL = async (ten, dv, gia = null) => Number((await ghiDb(`INSERT INTO kho_nguyen_lieu (ten, ten_chuan, nhom_id, don_vi_luu, don_vi_hien, he_so_doi, gia_nhap, tao_luc)
    VALUES (?, ?, ?, ?, ?, 1, ?, '2026-11-01T00:00:00')`, [ten, ten.toLowerCase(), nhom, dv, dv, gia])).lastInsertRowid);
  const nlCam = await themNL('Cam K3a', 'kg', 30000);
  const nlCaPhe = await themNL('Cà phê K3a', 'g', 0);   // dữ liệu 18.11: giá 0
  const nlDuong = await themNL('Đường K3a', 'kg');     // giá trống
  const nlSua = await themNL('Sữa K3a', 'kg');
  let soMa = 900;
  const themSP = async (ten, gia = 20000, them = {}) => {
    const id = ++soMa;
    const r = await ghiDb(`INSERT INTO pos_products (code, name, category, price, unit, is_active, sort_order, sx_product_type, sx_product_id, created_at)
      VALUES (?, ?, 'juice', ?, 'túi', ?, ?, 'thu3a', ?, ?)`, [`K3A${id}`, ten, gia, them.an ? 0 : 1, them.thuTu ?? id, id, getNow()]);
    return { id: Number(r.lastInsertRowid), sx_product_type: 'thu3a', sx_product_id: id, ten, gia };
  };
  const luuSP = (sp, than, ai = 'chu') => goi(ai, 'PUT', `/pos/kho/san-pham/${sp.id}`, than);
  let soPhieu = 0;
  const phieuNen = async (loai, dong) => {
    const id = Number((await ghiDb(`INSERT INTO kho_phieu (loai, so_phieu, trang_thai, nguoi_tao, tao_luc, nguoi_duyet, duyet_luc)
      VALUES (?, ?, 'da_duyet', 'nen', ?, 'nen', ?)`, [loai, `NEN-${++soPhieu}`, getNow(), getNow()])).lastInsertRowid);
    for (const d of dong) {
      const lo = Number((await ghiDb('INSERT INTO kho_lo (nguyen_lieu_id, san_pham_id, so_luong, han_dung, phieu_id, tao_luc) VALUES (?, ?, ?, ?, ?, ?)',
        [d.nl ?? null, d.sp ?? null, d.sl, d.han ?? null, id, getNow()])).lastInsertRowid);
      await ghiDb('INSERT INTO kho_phieu_dong (phieu_id, nguyen_lieu_id, san_pham_id, lo_id, so_luong, loai) VALUES (?, ?, ?, ?, ?, ?)',
        [id, d.nl ?? null, d.sp ?? null, lo, d.sl, d.nl ? 'nhap' : 'thanh_pham']);
      d.lo = lo;
    }
    return id;
  };
  const napNL = (nl, sl, han = null) => phieuNen('PN', [{ nl, sl, han }]);
  const napTP = async (sp, sl, han = null) => { const d = { sp: sp.id, sl, han }; await phieuNen('PX', [d]); return d.lo; };
  const tonNL = (nl) => so(`SELECT COALESCE(SUM(d.so_luong), 0) FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id
    WHERE d.nguyen_lieu_id = ? AND p.trang_thai = 'da_duyet' AND p.loai <> 'DH'`, [nl]);
  const conLo = (lo) => so(`SELECT COALESCE(SUM(d.so_luong), 0) FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id
    WHERE d.lo_id = ? AND p.trang_thai = 'da_duyet' AND p.loai <> 'DH'`, [lo]);
  const phieuBanCua = (orderId) => q("SELECT * FROM kho_phieu WHERE su_co = 'ban_hang' AND don_hang_id = ?", [orderId]);
  const demPhieuBan = () => so("SELECT COUNT(*) FROM kho_phieu WHERE su_co = 'ban_hang'");
  const mon = (sp, sl = 1) => ({ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: sl });
  const tongCua = async (items, them = {}) => Number((await goi('chu', 'POST', '/pos/orders/tinh-thu', { items, ...them })).j.total);
  const banTM = async (items, them = {}) => {
    const tong = await tongCua(items, them);
    return goi('chu', 'POST', '/pos/orders', { items, payment_method: 'cash', cash_amount: tong, cash_received: tong, ...them });
  };
  const taoPhienQuay = (items, cach = 'tien_mat', them = {}) => goi('chu', 'POST', '/pos/thanh-toan/phien', { cach, don: { items, ...them } });
  const chotTM = (id) => goi('chu', 'POST', `/pos/thanh-toan/phien/${id}/chot`, {});
  const huyPhien = (id) => goi('chu', 'POST', `/pos/thanh-toan/phien/${id}/huy`, {});
  const phien = (id) => mot('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [id]);
  const huyDon = (id, them = {}) => goi('chu', 'PUT', `/pos/orders/${id}/cancel`, { reason: 'khách đổi ý (thử)', ...them });
  const menuQuay = async () => { const r = await goi('chu', 'GET', '/pos/products'); return Array.isArray(r.j) ? r.j : []; };
  const menuApp = async () => ((await goi(null, 'GET', '/kh/menu')).j.data || []);
  const tren = (ds, sp) => ds.find((x) => String(x.sx_product_id) === String(sp.sx_product_id) && x.sx_product_type === sp.sx_product_type);
  const maCua = (sp) => `${sp.sx_product_type}_${sp.sx_product_id}`;
  let soRef = 0;
  const webhook = (p, them = {}) => {
    const data = { orderCode: p.ma_payos, amount: p.con_lai, description: p.noi_dung || 'x', accountNumber: '12345678', reference: 'K3A' + (++soRef),
      transactionDateTime: getNow().replace('T', ' '), currency: 'VND', paymentLinkId: 'pl_' + p.ma_payos, code: '00', desc: 'success',
      counterAccountBankId: '', counterAccountName: null, ...them };
    return goi(null, 'POST', '/payos/webhook', { code: '00', desc: 'success', success: true, data, signature: hmac(chuoiKy(data)) });
  };
  let soSdt = 0;
  const khach = async () => {
    const sdt = '09' + String(55000000 + (++soSdt)).padStart(8, '0');
    const id = Number((await ghiDb('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách K3a ' + soSdt, getNow()])).lastInsertRowid);
    return { sdt, id, tk: kyTokenKhach(id) };
  };
  const soDu = async (sdt) => Number((await mot('SELECT balance FROM pos_wallets WHERE phone = ?', [sdt]))?.balance || 0);
  const datApp = async (kh, mons) => {
    const than = { mon: mons, cach_nhan: 'tai_quan' };
    const bg = await goi(null, 'POST', '/kh/gio/bao-gia', than, kh.tk);
    return goi(null, 'POST', '/kh/don', { ...than, khoa_gui: 'k3a-' + ngauNhien().slice(0, 16), cach_tra: 'qr', tong_da_xem: bg.j.tong }, kh.tk);
  };
  const phienAppMoiNhat = async (kh) => mot(`SELECT p.* FROM pos_don_app a JOIN pos_phien_thanh_toan p ON p.id = a.phien_id WHERE a.phone = ? ORDER BY a.id DESC LIMIT 1`, [kh.sdt]);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A1–A3] Menu từ pos_products — quầy và /api/kh/menu cùng hàm, không gọi SX');
  const spLS = await themSP('Nước cam K3a', 25000, { thuTu: 1 });         // làm sẵn theo lô
  const spCF = await themSP('Cà Phê Đen K3a', 20000, { thuTu: 2 });       // pha tại chỗ 16 g
  const spCon = await themSP('Siro K3a', 5000, { thuTu: 3 });             // thành phần lồng
  const spLong = await themSP('Cà phê sữa K3a', 30000, { thuTu: 4 });     // công thức lồng
  const spChua = await themSP('Chưa công thức K3a', 15000, { thuTu: 5 }); // không dòng kho
  const spRong = await themSP('Công thức rỗng K3a', 15000, { thuTu: 6 }); // pha tại chỗ, công thức rỗng
  const spCDL = await themSP('Chưa định lượng K3a', 15000, { thuTu: 7 });
  const spAn = await themSP('Món ẩn K3a', 15000, { thuTu: 8, an: true });
  const spGia0 = await themSP('Giá 0 K3a', 0, { thuTu: 9 });
  const spA = await themSP('Chung A K3a', 10000, { thuTu: 10 });
  const spB = await themSP('Chung B K3a', 10000, { thuTu: 11 });
  await luuSP(spLS, { kieu: 'lam_san', han_ngay: 1, cong_thuc: [{ nguyen_lieu_id: nlCam, luong: 0.2 }] });
  await luuSP(spCF, { kieu: 'pha_tai_cho', cong_thuc: [{ nguyen_lieu_id: nlCaPhe, luong: 16 }] });
  await luuSP(spCon, { kieu: 'pha_tai_cho', cong_thuc: [{ nguyen_lieu_id: nlDuong, luong: 0.03 }] });
  await luuSP(spLong, { kieu: 'pha_tai_cho', cong_thuc: [{ thanh_phan_id: spCon.id, luong: 2 }, { nguyen_lieu_id: nlCaPhe, luong: 10 }, { nguyen_lieu_id: nlSua, luong: 0.1 }] });
  await luuSP(spRong, { kieu: 'pha_tai_cho', cong_thuc: [] });
  await luuSP(spCDL, { kieu: 'chua_dinh_luong', cong_thuc: [] });
  await luuSP(spA, { kieu: 'pha_tai_cho', cong_thuc: [{ nguyen_lieu_id: nlSua, luong: 0.3 }] });
  await luuSP(spB, { kieu: 'pha_tai_cho', cong_thuc: [{ nguyen_lieu_id: nlSua, luong: 0.3 }] });
  const loCu = await napTP(spLS, 2, '2026-11-17T09:00:00');   // ĐÃ hết hạn
  const loGan = await napTP(spLS, 2, '2026-11-18T20:00:00');
  const loXa = await napTP(spLS, 3, '2026-11-19T20:00:00');
  await napNL(nlCaPhe, 47.999);
  await napNL(nlDuong, 1);
  await napNL(nlSua, 1);

  await chay('A', async () => {
    const mq = await menuQuay();
    const ma = await menuApp();
    const cua = (ds) => ds.filter((x) => x.sx_product_type === 'thu3a');
    k('A1 menu quầy có món POS (không lấy danh sách SX)', !!tren(mq, spLS) && !!tren(mq, spCF), `${cua(mq).length} món thu3a`);
    k('A1 thứ tự theo sort_order', cua(mq).map((x) => x.name).slice(0, 4).join('|') === [spLS, spCF, spCon, spLong].map((s) => s.ten).join('|'),
      cua(mq).map((x) => x.name).join('|'));
    k('A1 giá lấy từ POS', tren(mq, spCF)?.price === 20000, String(tren(mq, spCF)?.price));
    k('D2 món ẩn (is_active 0) không có trên menu', !tren(mq, spAn));
    k('D2 món giá 0 không bán được (sellable false)', tren(mq, spGia0)?.sellable === false);
    k('A1 /api/kh/menu có món đủ hàng, đúng giá', ma.find((x) => x.ma === maCua(spLS))?.gia === 25000);
    k('A2 làm sẵn: số = lô CÒN HẠN (2 + 3, bỏ lô hết hạn 2)', tren(mq, spLS)?.stock_quantity === 5, String(tren(mq, spLS)?.stock_quantity));
    k('A2 pha tại chỗ: số phần = floor(47,999 / 16) = 2 (không làm tròn lên 3)', tren(mq, spCF)?.stock_quantity === 2, String(tren(mq, spCF)?.stock_quantity));
    k('A2 công thức lồng: số phần = min(sữa 1/0,1 = 10, cà phê 47,999/10 = 4, đường 1/0,06 = 16) = 4', tren(mq, spLong)?.stock_quantity === 4,
      String(tren(mq, spLong)?.stock_quantity));
    k('A2 chưa công thức: không bịa số (null, không 999)', tren(mq, spChua) && tren(mq, spChua).stock_quantity === null && tren(mq, spChua).chua_cong_thuc === true,
      JSON.stringify(tren(mq, spChua) && { s: tren(mq, spChua).stock_quantity, c: tren(mq, spChua).chua_cong_thuc }));
    k('A2 bỏ "tồn gần nhất của SX": ton_cu false, ton_luc null', tren(mq, spLS)?.ton_cu === false && tren(mq, spLS)?.ton_luc === null);
    k('B3 món chưa công thức: quầy sellable false, App KHÔNG thấy', tren(mq, spChua)?.sellable === false && !ma.find((x) => x.ma === maCua(spChua)));
    k('B3 công thức rỗng / chua_dinh_luong cũng chưa sẵn sàng', tren(mq, spRong)?.chua_cong_thuc === true && tren(mq, spCDL)?.chua_cong_thuc === true);
    k('C1 tải menu KHÔNG gọi SX', sxNhan.length === 0, sxNhan.slice(0, 3).join(', '));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A3b] Bước 031 — đổi đúng 4 tên nước ép, chỉ khi tên còn là tên tạm');
  await chay('A3b', async () => {
    const buoc = nap(path.join(MAY_CHU, 'nang_cap', '031_ten_mon_sx.js'));
    k('A3b có bước 031_ten_mon_sx.js', !!buoc?.chay);
    if (!buoc?.chay) return;
    const giu = await q("SELECT id FROM pos_products WHERE sx_product_type = 'juice' AND sx_product_id IN (4, 5, 6, 7, 8)");
    await ghiDb("DELETE FROM pos_products WHERE sx_product_type = 'juice' AND sx_product_id IN (4, 5, 6, 7, 8)");
    for (const [id, ten] of [[4, 'Công thức 4'], [5, 'Công thức 5'], [6, 'Công thức 6'], [7, 'Công thức 7'], [8, 'Đã sửa tay']]) {
      await ghiDb("INSERT INTO pos_products (code, name, category, price, sx_product_type, sx_product_id) VALUES (?, ?, 'juice', 0, 'juice', ?)", [`A3B${id}`, ten, id]);
    }
    const tx = { run: (s, a) => db.run(s, a), query: (s, a) => db.query(s, a), queryOne: (s, a) => db.queryOne(s, a) };
    await buoc.chay(tx, {});
    const ten = async (id) => (await mot("SELECT name FROM pos_products WHERE sx_product_type = 'juice' AND sx_product_id = ?", [id]))?.name;
    k('A3b juice 5/6/7 → Thanh Tân Dưỡng / Tĩnh Nguyên Thủy / Ôn Dương Lộ',
      (await ten(5)) === 'Thanh Tân Dưỡng' && (await ten(6)) === 'Tĩnh Nguyên Thủy' && (await ten(7)) === 'Ôn Dương Lộ');
    k('A3b juice 8 đã sửa tay → KHÔNG đổi', (await ten(8)) === 'Đã sửa tay');
    k('A3b juice 4 (ngoài danh sách) → KHÔNG đổi', (await ten(4)) === 'Công thức 4');
    await ghiDb("UPDATE pos_products SET name = 'Công thức 8' WHERE sx_product_type = 'juice' AND sx_product_id = 8");
    await buoc.chay(tx, {});
    k('A3b chạy lại: juice 8 tên tạm → Tâm Vệ Lộ, tên đã đổi giữ nguyên', (await ten(8)) === 'Tâm Vệ Lộ' && (await ten(5)) === 'Thanh Tân Dưỡng');
    await ghiDb("DELETE FROM pos_products WHERE code LIKE 'A3B%'");
    void giu;
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B1–B4] Bán trừ kho POS trong cùng giao dịch — FEFO, ngưỡng, thiếu nguyên liệu, chưa công thức, phiếu bán');
  let donLS = null;
  await chay('B1', async () => {
    const r6 = await banTM([mon(spLS, 6)]);
    k('B1 thiếu 1 (còn 5 cần 6) → 400 HET_HANG, lời "Không đủ hàng"', la(r6, 400, 'HET_HANG') && /^Không đủ hàng: /.test(r6.j.error || ''), moTa(r6));
    const truoc = await so('SELECT COUNT(*) FROM pos_orders');
    const r3 = await banTM([mon(spLS, 3)]);
    donLS = r3.j.order?.id;
    k('B1 bán 3 → 200', la(r3, 200), moTa(r3));
    k('B1 FEFO: lô hạn gần (2) hết trước, lô xa còn 3 − 1 = 2', (await conLo(loGan)) === 0 && (await conLo(loXa)) === 2,
      `gần ${await conLo(loGan)} · xa ${await conLo(loXa)}`);
    k('B1 lô hết hạn KHÔNG bị bán', (await conLo(loCu)) === 2, String(await conLo(loCu)));
    const pb = donLS ? await phieuBanCua(donLS) : [];
    k('B4 đúng MỘT phiếu PS ban_hang da_duyet nối đơn', pb.length === 1 && pb[0].loai === 'PS' && pb[0].trang_thai === 'da_duyet', JSON.stringify(pb.map((p) => p.so_phieu)));
    const xem = pb[0] ? await goi('ql', 'GET', `/pos/kho/phieu/${pb[0].id}`) : { status: 0, j: {} };
    k('B4 xem lại được phiếu bán ở Kho › Phiếu (dòng thành phẩm)', la(xem, 200) && (xem.j.dong || []).some((d) => d.san_pham_id === spLS.id), moTa(xem));
    const r2 = await banTM([mon(spLS, 2)]);
    k('B1 đủ ĐÚNG bằng số cần (còn 2, cần 2) → 200', la(r2, 200), moTa(r2));
    const r1 = await banTM([mon(spLS, 1)]);
    k('B1 hết lô còn hạn → HET_HANG (dù còn lô hết hạn)', la(r1, 400, 'HET_HANG'), moTa(r1));
    k('B7 bị chặn thì không ghi đơn', (await so('SELECT COUNT(*) FROM pos_orders')) === truoc + 2);
    k('A2 menu sau bán: làm sẵn hiện 0 (hết)', tren(await menuQuay(), spLS)?.stock_quantity === 0);
  });

  await chay('B2', async () => {
    const r3 = await banTM([mon(spCF, 3)]);
    k('B2 pha tại chỗ TẮT, thiếu (47,999 g, cần 48) → 400 THIEU_NGUYEN_LIEU nêu nguyên liệu', la(r3, 400, 'THIEU_NGUYEN_LIEU') && /Cà phê K3a/.test(r3.j.error || ''), moTa(r3));
    const r2 = await banTM([mon(spCF, 2)]);
    k('B2 đủ (cần 32 g) → 200, trừ đúng 32 g', la(r2, 200) && gan(await tonNL(nlCaPhe), 15.999), `${moTa(r2)} · tồn ${await tonNL(nlCaPhe)}`);
    const rl = await banTM([mon(spLong, 1)]);
    k('B2 công thức lồng: đường 2 × 0,03 = 0,06; sữa 0,1; cà phê 10', la(rl, 200) && gan(await tonNL(nlDuong), 0.94) && gan(await tonNL(nlSua), 0.9)
      && gan(await tonNL(nlCaPhe), 5.999), `${moTa(rl)} · đường ${await tonNL(nlDuong)} · sữa ${await tonNL(nlSua)}`);
    const rg = await banTM([mon(spA, 2), mon(spB, 2)]);
    k('B2 hai món chung nguyên liệu: từng món đủ (0,6 ≤ 0,9) mà cả giỏ thiếu (1,2) → chặn', la(rg, 400, 'THIEU_NGUYEN_LIEU'), moTa(rg));
    const rDong = await banTM([mon(spA, 2), mon(spA, 2)]);
    k('B2 cùng món hai dòng cộng dồn (1,2 > 0,9) → chặn', la(rDong, 400, 'THIEU_NGUYEN_LIEU'), moTa(rDong));
  });

  await chay('B8', async () => {
    const nv = await luuSP(spCF, { kieu: 'pha_tai_cho', cong_thuc: [{ nguyen_lieu_id: nlCaPhe, luong: 16 }], cho_ban_thieu: 1 }, 'nv');
    const ql = await luuSP(spCF, { kieu: 'pha_tai_cho', cong_thuc: [{ nguyen_lieu_id: nlCaPhe, luong: 16 }], cho_ban_thieu: 1 }, 'ql');
    k('B8 nhân viên / quản lý bật "cho bán khi thiếu" → 403', nv.status === 403 && ql.status === 403, `${nv.status}/${ql.status}`);
    k('B8 mặc định TẮT (cột cho_ban_thieu = 0 khi không truyền)',
      Number((await mot('SELECT cho_ban_thieu FROM kho_san_pham WHERE pos_product_id = ?', [spCF.id]))?.cho_ban_thieu) === 0);
    const bat = await luuSP(spCF, { kieu: 'pha_tai_cho', cong_thuc: [{ nguyen_lieu_id: nlCaPhe, luong: 16 }], cho_ban_thieu: 1 });
    k('B8 chủ quán bật → 200', la(bat, 200), moTa(bat));
    const r = await banTM([mon(spCF, 1)]);
    k('B2 BẬT + thiếu (còn 5,999 g cần 16) → bán được', la(r, 200), moTa(r));
    const am = await mot("SELECT COUNT(*) AS n FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id WHERE p.su_co = 'ban_hang' AND d.nguyen_lieu_id = ? AND d.lo_id IS NULL", [nlCaPhe]);
    const ton = await goi('ql', 'GET', '/pos/kho/ton');
    k('B2 BẬT: phần thiếu ghi âm (dòng không lô), Tồn kho báo đỏ', Number(am?.n) >= 1 && (ton.j.nguyen_lieu || []).find((x) => x.id === nlCaPhe)?.am === true,
      `dòng âm ${am?.n} · tồn ${await tonNL(nlCaPhe)}`);
    const mq = await menuQuay();
    k('A2 BẬT: menu không chặn (khong_quan_kho)', tren(mq, spCF)?.khong_quan_kho === true);
    const tat = await luuSP(spCF, { kieu: 'pha_tai_cho', cong_thuc: [{ nguyen_lieu_id: nlCaPhe, luong: 16 }], cho_ban_thieu: 0 });
    const r2 = await banTM([mon(spCF, 1)]);
    k('B8 tắt lại → chặn ngay', la(tat, 200) && la(r2, 400, 'THIEU_NGUYEN_LIEU'), moTa(r2));
  });

  await chay('B3', async () => {
    const truoc = await demPhieuBan();
    for (const [ten, sp] of [['không dòng kho', spChua], ['công thức rỗng', spRong], ['chua_dinh_luong', spCDL]]) {
      const r = await banTM([mon(sp, 1)]);
      k(`B3 ${ten} → 400 CHUA_CO_CONG_THUC`, la(r, 400, 'CHUA_CO_CONG_THUC'), moTa(r));
    }
    k('B3 bị chặn: không phiếu kho nào', (await demPhieuBan()) === truoc);
    const tt = await goi('chu', 'POST', '/pos/orders/tinh-thu', { items: [mon(spChua, 1)] });
    k('B6 tinh-thu (báo giá) món chưa công thức vẫn báo giá, không ghi phiếu', la(tt, 200) && (await demPhieuBan()) === truoc, moTa(tt));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B3b] Giữ hàng — phiên chờ trả giữ đúng số, nhả khi huỷ / hết hạn, hai phiên tranh chai cuối');
  const spGiu = await themSP('Chai cuối K3a', 12000, { thuTu: 12 });
  await luuSP(spGiu, { kieu: 'lam_san', cong_thuc: [{ nguyen_lieu_id: nlCam, luong: 0.2 }] });
  const loGiu = await napTP(spGiu, 1);
  await chay('B3b', async () => {
    const a = await taoPhienQuay([mon(spGiu, 1)]);
    k('B3b phiên A (tiền mặt) giữ chai cuối → 200', la(a, 200), moTa(a));
    const mq = await menuQuay(), ma = await menuApp();
    k('B3b menu quầy hiện 0, App con_hang false (phần đang giữ đã trừ)', tren(mq, spGiu)?.stock_quantity === 0 && ma.find((x) => x.ma === maCua(spGiu))?.con_hang === false,
      `${tren(mq, spGiu)?.stock_quantity} / ${ma.find((x) => x.ma === maCua(spGiu))?.con_hang}`);
    const b = await taoPhienQuay([{ product_id: spGiu.id, quantity: 1 }]);
    k('B3b phiên B (món theo product_id) → HET_HANG', la(b, 400, 'HET_HANG'), moTa(b));
    const tm = await banTM([mon(spGiu, 1)]);
    k('B3b POST /orders tiền mặt thẳng → HET_HANG', la(tm, 400, 'HET_HANG'), moTa(tm));
    const kh = await khach();
    const app = await datApp(kh, [{ ma: maCua(spGiu), so_luong: 1 }]);
    k('B3b App đặt chai đang bị giữ → HET_HANG kèm ma', la(app, 400, 'HET_HANG') && app.j.ma === maCua(spGiu), moTa(app) + ' · ma ' + app.j.ma);
    await huyPhien(a.j.phien?.id);
    const b2 = await taoPhienQuay([mon(spGiu, 1)]);
    k('B3b A huỷ → nhả ngay, B giữ được', la(b2, 200), moTa(b2));
    datGio('2026-11-18T09:11:00');   // B hết hạn (HAN_PHUT 10)
    const c = await taoPhienQuay([mon(spGiu, 1)]);
    k('B3b B hết hạn → tự nhả, C giữ được', la(c, 200), moTa(c));
    const chot = await chotTM(c.j.phien?.id);
    k('B3b C trả trong hạn khi đang giữ CHAI CUỐI → chốt được (phần giữ của chính C không chặn C)', la(chot, 200), moTa(chot));
    k('B3b chốt trừ đúng lô đã giữ', (await conLo(loGiu)) === 0, String(await conLo(loGiu)));
    // Hai phiên song song tranh chai cuối
    await napTP(spGiu, 1);
    const dua = await Promise.all([taoPhienQuay([mon(spGiu, 1)]), taoPhienQuay([mon(spGiu, 1)]), taoPhienQuay([mon(spGiu, 1)])]);
    k('B3b ba phiên CÙNG LÚC tranh chai cuối → đúng một giữ được', dua.filter((r) => la(r, 200)).length === 1, dua.map(moTa).join(' | '));
    const giuDuoc = dua.find((r) => la(r, 200));
    // Xác nhận tay QR quầy SAU hạn khi phiên khác đang giữ chai cuối → không bán vượt
    datGio('2026-11-18T09:30:00');
    await napTP(spGiu, 1);
    const qr = await taoPhienQuay([mon(spGiu, 1)], 'payos');
    k('B3b phiên QR quầy giữ chai (chuẩn bị ca chốt muộn)', la(qr, 200), moTa(qr));
    datGio('2026-11-18T09:41:00');   // QR hết hạn → nhả
    const khac = await taoPhienQuay([mon(spGiu, 1)]);
    const tay = await goi('chu', 'POST', `/pos/thanh-toan/phien/${qr.j.phien?.id}/xac-nhan-tay`, { ly_do: 'khách chuyển muộn (thử)' });
    k('B3b xác nhận tay QR sau hạn khi phiên KHÁC đang giữ chai cuối → HET_HANG (không bán vượt)', la(khac, 200) && la(tay, 400, 'HET_HANG'), `${moTa(khac)} · ${moTa(tay)}`);
    void giuDuoc;
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B3c] Lưới an toàn — đã giữ mà hàng thật mất trước khi tiền về: không đơn, hoàn ví đúng số, một lần');
  await chay('B3c', async () => {
    datGio('2026-11-18T10:00:00');
    const spL = await themSP('Lưới K3a', 18000, { thuTu: 13 });
    await luuSP(spL, { kieu: 'lam_san', cong_thuc: [{ nguyen_lieu_id: nlCam, luong: 0.2 }] });
    const mat = async (lo) => {   // phiếu phát sinh lấy mất hàng thật (không xét phần giữ — đúng như KHO-2b)
      const id = Number((await ghiDb(`INSERT INTO kho_phieu (loai, so_phieu, trang_thai, nguoi_tao, tao_luc, nguoi_duyet, duyet_luc, su_co)
        VALUES ('PS', ?, 'da_duyet', 'nen', ?, 'nen', ?, 'hong')`, [`NEN-PS-${++soPhieu}`, getNow(), getNow()])).lastInsertRowid);
      await ghiDb("INSERT INTO kho_phieu_dong (phieu_id, san_pham_id, lo_id, so_luong, loai) VALUES (?, ?, ?, -1, 'phat_sinh')", [id, spL.id, lo]);
    };
    // App
    const lo1 = await napTP(spL, 1);
    const kh = await khach();
    const dApp = await datApp(kh, [{ ma: maCua(spL), so_luong: 1 }]);
    const pA = await phienAppMoiNhat(kh);
    k('B3c App đặt QR giữ chai cuối', la(dApp, 200) && !!pA, moTa(dApp));
    await mat(lo1);
    const donTruoc = await so('SELECT COUNT(*) FROM pos_orders');
    const w1 = await webhook(pA || {});
    const w2 = await webhook(pA || {}, { reference: 'K3A' + soRef });   // gửi lại cùng khoá
    k('B3c tiền về đúng hạn: KHÔNG tạo đơn', (await so('SELECT COUNT(*) FROM pos_orders')) === donTruoc, `${moTa(w1)} · ${moTa(w2)}`);
    k('B3c ví khách +ĐÚNG số tiền, MỘT lần (báo hai lần)', (await soDu(kh.sdt)) === Number(pA?.con_lai), `số dư ${await soDu(kh.sdt)} / phải ${pA?.con_lai}`);
    const maDon = (await mot('SELECT ma FROM pos_don_app WHERE phone = ? ORDER BY id DESC LIMIT 1', [kh.sdt]))?.ma;
    const xem = await goi(null, 'GET', `/kh/don/${maDon}`, undefined, kh.tk);
    k('B3c App thấy thong_bao_tien_ve có TÊN món + "vừa hết" + đã hoàn vào ví', /Lưới K3a/.test(xem.j.don?.thong_bao_tien_ve || '') && /vừa hết/.test(xem.j.don?.thong_bao_tien_ve || '')
      && Number(xem.j.don?.tien_ve_da_cong_vi) === Number(pA?.con_lai), xem.j.don?.thong_bao_tien_ve || moTa(xem));
    const bao = await mot("SELECT ly_do FROM pos_payos_su_kien WHERE ma_payos = ? AND ket_qua = 'vao_vi'", [pA?.ma_payos]);
    k('B3c quầy có dòng báo (vao_vi) nêu món hết', /Lưới K3a/.test(bao?.ly_do || ''), bao?.ly_do || '(không có)');
    k('B3c không dòng âm thành phẩm', (await conLo(lo1)) === -1 + 1 - 1 + 1 || (await conLo(lo1)) === 0, String(await conLo(lo1)));
    // Quầy QR có SĐT khách
    const lo2 = await napTP(spL, 1);
    const kh2 = await khach();
    const pq = await taoPhienQuay([mon(spL, 1)], 'payos', { customer_phone: kh2.sdt, customer_name: 'Khách K3a quầy' });
    const p2 = await phien(pq.j.phien?.id);
    await mat(lo2);
    await webhook(p2 || {});
    k('B3c phiên QR QUẦY có SĐT: hỏng vì hết hàng → vào ví đúng số', (await soDu(kh2.sdt)) === Number(p2?.con_lai), `số dư ${await soDu(kh2.sdt)} / ${p2?.con_lai}`);
    // Quầy QR không SĐT
    const lo3 = await napTP(spL, 1);
    const pv = await taoPhienQuay([mon(spL, 1)], 'payos');
    const p3 = await phien(pv.j.phien?.id);
    await mat(lo3);
    const viTruoc = await so('SELECT COUNT(*) FROM pos_balance_transactions');
    await webhook(p3 || {});
    const b3 = await mot('SELECT ket_qua, ly_do FROM pos_payos_su_kien WHERE ma_payos = ? ORDER BY rowid DESC LIMIT 1', [p3?.ma_payos]);
    k('B3c QR quầy KHÔNG SĐT: chua_khop "HOÀN TIỀN TAY", không dòng ví', b3?.ket_qua === 'chua_khop' && /HOÀN TIỀN TAY/.test(b3?.ly_do || '')
      && (await so('SELECT COUNT(*) FROM pos_balance_transactions')) === viTruoc, JSON.stringify(b3));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B5] Huỷ / xoá đơn — trả kho đúng lô, MỘT lần; đồ đã pha bỏ đi không trả');
  await chay('B5', async () => {
    datGio('2026-11-18T11:00:00');
    const spH = await themSP('Huỷ K3a', 10000, { thuTu: 14 });
    await luuSP(spH, { kieu: 'lam_san', cong_thuc: [{ nguyen_lieu_id: nlCam, luong: 0.2 }] });
    const loH = await napTP(spH, 4);
    const d1 = (await banTM([mon(spH, 2)])).j.order?.id;
    k('B5 bán 2 → lô còn 2', (await conLo(loH)) === 2);
    const huy = await Promise.all([huyDon(d1), huyDon(d1)]);
    k('B5 hai lần huỷ CÙNG LÚC → trả kho MỘT lần (lô về 4)', huy.filter((r) => la(r, 200)).length === 1 && (await conLo(loH)) === 4,
      `${huy.map(moTa).join(' | ')} · lô ${await conLo(loH)}`);
    const pb = d1 ? await phieuBanCua(d1) : [];
    k('B5 phiếu bán của đơn huỷ → trạng thái huy', pb.length === 1 && pb[0].trang_thai === 'huy');
    const lai = await goi('chu', 'POST', `/pos/kho/phieu/${pb[0]?.id}/huy`, { ly_do: 'thử huỷ tay' });
    const sua = await goi('chu', 'POST', `/pos/kho/phieu/${pb[0]?.id}/sua`, { ly_do: 'thử sửa tay', muc: [] });
    k('Câu 4: phiếu bán không huỷ / sửa tay được ở Kho → 409 PHIEU_BAN_HANG', la(lai, 409, 'PHIEU_BAN_HANG') && la(sua, 409, 'PHIEU_BAN_HANG'), `${moTa(lai)} · ${moTa(sua)}`);
    const d2 = (await banTM([mon(spH, 1)])).j.order?.id;
    const xoa = await goi('chu', 'DELETE', `/pos/orders/${d2}`);
    k('B5 xoá đơn completed → trả kho (lô về 4)', la(xoa, 200) && (await conLo(loH)) === 4, `${moTa(xoa)} · lô ${await conLo(loH)}`);
    const d3 = (await banTM([mon(spH, 1)])).j.order?.id;
    await huyDon(d3);
    const lo3 = await conLo(loH);
    const xoa3 = await goi('chu', 'DELETE', `/pos/orders/${d3}`);
    k('B5 xoá đơn ĐÃ huỷ → không trả thêm', la(xoa3, 200) && (await conLo(loH)) === lo3 && lo3 === 4, `lô ${await conLo(loH)}`);
    // Đơn cũ (trước gộp — không phiếu bán): huỷ không lỗi
    const cu = Number((await ghiDb(`INSERT INTO pos_orders (code, customer_name, subtotal, total, payment_method, cash_amount, status, created_by, created_at)
      VALUES ('CU-K3A-1', 'Khách lẻ', 10000, 10000, 'cash', 10000, 'completed', 'nen', ?)`, [getNow()])).lastInsertRowid);
    const hc = await huyDon(cu);
    k('B5 huỷ đơn CŨ không phiếu bán → 200, không lỗi', la(hc, 200), moTa(hc));
    // Đơn giao "Bỏ đi": dựng chuyến đang pha
    const d4 = (await banTM([mon(spH, 2)], { customer_phone: (await khach()).sdt })).j.order?.id;
    await ghiDb(`INSERT INTO pos_giao_chuyen (order_id, trang_thai, tao_luc) VALUES (?, 'dang_pha', ?)`, [d4, getNow()]).catch(() => null);
    const truoc = await conLo(loH);
    const hb = await huyDon(d4, { do_da_pha: 'bo_di', reason: 'đồ đã pha bỏ đi (thử)' });
    const pb4 = d4 ? await phieuBanCua(d4) : [];
    k('B5 đơn giao "Bỏ đi" → KHÔNG trả kho, phiếu ghi hao hụt', la(hb, 200) && (await conLo(loH)) === truoc && pb4[0]?.trang_thai === 'da_duyet' && /hao hụt/.test(pb4[0]?.ghi_chu || ''),
      `${moTa(hb)} · lô ${await conLo(loH)}/${truoc} · ${pb4[0]?.trang_thai} · ${pb4[0]?.ghi_chu}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B6 · B7] Mọi lối vào taoDon trừ một lần · tinh-thu không trừ · lỗi CSDL rollback cả đơn');
  await chay('B6', async () => {
    datGio('2026-11-18T12:00:00');
    const spM = await themSP('Lối K3a', 10000, { thuTu: 15 });
    await luuSP(spM, { kieu: 'lam_san', cong_thuc: [{ nguyen_lieu_id: nlCam, luong: 0.2 }] });
    await napTP(spM, 50);
    const truoc = await demPhieuBan();
    const tt = await goi('chu', 'POST', '/pos/orders/tinh-thu', { items: [mon(spM, 1)] });
    k('B6 tinh-thu → 0 phiếu bán', la(tt, 200) && (await demPhieuBan()) === truoc);
    const p = await taoPhienQuay([mon(spM, 1)]);
    const c = await chotTM(p.j.phien?.id);
    const c2 = await chotTM(p.j.phien?.id);
    const o1 = c.j.order?.id;
    k('B6 phiên tiền mặt: một đơn, một phiếu (gửi lại lệnh chốt không trừ lần hai)', la(c, 200) && (await phieuBanCua(o1)).length === 1 && (await demPhieuBan()) === truoc + 1,
      `${moTa(c)} · ${moTa(c2)}`);
    const qr = await taoPhienQuay([mon(spM, 1)], 'payos');
    const pq = await phien(qr.j.phien?.id);
    await webhook(pq || {});
    const o2 = (await phien(qr.j.phien?.id))?.order_id;
    k('B6 phiên QR (webhook) → một phiếu', !!o2 && (await phieuBanCua(o2)).length === 1);
    const kh = await khach();
    await datApp(kh, [{ ma: maCua(spM), so_luong: 1 }]);
    const pa = await phienAppMoiNhat(kh);
    await webhook(pa || {});
    const o3 = (await phien(pa?.id))?.order_id;
    k('B6 đơn App → một phiếu', !!o3 && (await phieuBanCua(o3)).length === 1);
    const tq = await taoPhienQuay([mon(spM, 1)], 'payos');
    const tay = await goi('chu', 'POST', `/pos/thanh-toan/phien/${tq.j.phien?.id}/xac-nhan-tay`, { ly_do: 'khách đưa sao kê (thử)' });
    k('B6 xác nhận tay → một phiếu', la(tay, 200) && (await phieuBanCua(tay.j.order?.id)).length === 1, moTa(tay));
    const dt = await banTM([mon(spM, 1)]);
    k('B6 POST /orders thẳng → một phiếu', la(dt, 200) && (await phieuBanCua(dt.j.order?.id)).length === 1);
    const donCu = nap(path.join(GOC, 'cong_cu', 'gia_lap', 'donCu.js'));
    k('B6 có cong_cu/gia_lap/donCu.js (đơn cũ qua taoDonGoc cũng đi qua cùng dòng trừ kho)', !!donCu);
    // B7
    const soDon = await so('SELECT COUNT(*) FROM pos_orders');
    mocNemBan = true;
    const loi = await banTM([mon(spM, 1)]);
    mocNemBan = false;
    k('B7 lỗi CSDL giữa trừ kho → không đơn, không phiếu', loi.status >= 400 && (await so('SELECT COUNT(*) FROM pos_orders')) === soDon
      && (await demPhieuBan()) === truoc + 5, `${moTa(loi)} · đơn ${await so('SELECT COUNT(*) FROM pos_orders')}/${soDon} · phiếu ${await demPhieuBan()}`);
    const d3 = await banTM([{ ...mon(spM, 1) }], { membership_buy: undefined });
    k('D1 sau lỗi bán lại bình thường', la(d3, 200), moTa(d3));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A4 · A5 · A7] Quản lý món trong POS · món chưa sẵn sàng bán');
  await chay('A4', async () => {
    const nv = await goi('nv', 'POST', '/pos/products', { name: 'Món nv K3a', category: 'juice', price: 10000, unit: 'ly', sort_order: 99, is_active: 1 });
    k('A4 nhân viên tạo món → 403', nv.status === 403, moTa(nv));
    const rong = await goi('ql', 'POST', '/pos/products', { name: '  ', category: 'juice', price: 10000 });
    k('A4 tên rỗng → 400 TEN_KHONG_HOP_LE', la(rong, 400, 'TEN_KHONG_HOP_LE'), moTa(rong));
    const tao = await goi('ql', 'POST', '/pos/products', { name: 'Món thử K3a', category: 'tra', price: 15000, unit: 'ly', sort_order: 0, is_active: 1 });
    const id = tao.j.product?.id;
    const hang = id ? await mot('SELECT * FROM pos_products WHERE id = ?', [id]) : null;
    k('A4 quản lý tạo món → khoá ("pos", id), mã POS<id>', la(tao, 200) && hang?.sx_product_type === 'pos' && Number(hang?.sx_product_id) === id && hang?.code === `POS${id}`,
      `${moTa(tao)} · ${hang && [hang.sx_product_type, hang.sx_product_id, hang.code].join('/')}`);
    const trung = await goi('ql', 'POST', '/pos/products', { name: 'Món thử K3a', category: 'tra', price: 15000 });
    k('A4 trùng tên món đang bán → 400 TEN_TRUNG', la(trung, 400, 'TEN_TRUNG'), moTa(trung));
    const mq = await menuQuay();
    const m = mq.find((x) => x.id === id);
    k('A4 món mới chưa công thức: hiện mờ (sellable false), đơn vị "ly" từ cột unit', m?.sellable === false && m?.unit === 'ly', JSON.stringify(m && { s: m.sellable, u: m.unit }));
    if (id) {
      await goi('chu', 'PUT', `/pos/kho/san-pham/${id}`, { kieu: 'pha_tai_cho', cong_thuc: [{ nguyen_lieu_id: nlDuong, luong: 0.01 }] });
      const gia = await goi('ql', 'PUT', '/pos/products/price', { sx_product_type: 'pos', sx_product_id: id, price: 17000 });
      const b = await banTM([{ product_id: id, sx_product_type: 'pos', sx_product_id: id, quantity: 1 }]);
      k('A4/A5 có công thức + sửa giá qua route giá có sẵn → bán được, đúng giá mới', la(gia, 200) && la(b, 200) && Number(b.j.order?.total) === 17000, `${moTa(gia)} · ${moTa(b)}`);
      const sua = await goi('ql', 'PUT', `/pos/products/${id}`, { name: 'Món thử K3a đổi', category: 'tra', sort_order: 0, is_active: 0 });
      const sau = await menuQuay();
      k('A4 sửa tên + ẩn → menu không còn món', la(sua, 200) && !sau.find((x) => x.id === id), moTa(sua));
      const nvSua = await goi('nv', 'PUT', `/pos/products/${id}`, { is_active: 1 });
      k('A4 nhân viên sửa / hiện món → 403', nvSua.status === 403, moTa(nvSua));
      const xoa = await goi('chu', 'DELETE', `/pos/products/${id}`);
      k('A4 không có đường xoá cứng món (404)', xoa.status === 404 && !!(await mot('SELECT id FROM pos_products WHERE id = ?', [id])), moTa(xoa));
    }
    const ds = await goi('ql', 'GET', '/pos/kho/mon-chua-san');
    const mons = ds.j.mon || [];
    const coMon = (sp) => mons.some((x) => Number(x.san_pham_id) === sp.id);
    k('A7 liệt kê: chưa dòng kho, công thức rỗng, chưa định lượng, làm sẵn hết lô còn hạn', coMon(spChua) && coMon(spRong) && coMon(spCDL) && coMon(spLS), moTa(ds));
    k('A7 KHÔNG liệt kê món đủ (pha tại chỗ có công thức) và món đã ẩn', !coMon(spLong) && !coMon(spAn));
    k('A7 có số đếm = số dòng', Number(ds.j.so) === mons.length, `${ds.j.so} / ${mons.length}`);
    const nvDs = await goi('nv', 'GET', '/pos/kho/mon-chua-san');
    k('A7 nhân viên không xem (QUAN_LY)', nvDs.status === 403, moTa(nvDs));
    const dist = fs.existsSync(path.join(GOC, 'client', 'dist', 'assets')) ? fs.readdirSync(path.join(GOC, 'client', 'dist', 'assets')).filter((f) => f.endsWith('.js'))
      .map((f) => fs.readFileSync(path.join(GOC, 'client', 'dist', 'assets', f), 'utf8')).join('\n') : '';
    k('A5 (dist) màn Sản phẩm sửa giá ngay tại chỗ — không còn "đặt giá ở Cài đặt › Sản phẩm"', !/đặt giá ở Cài đặt › Sản phẩm/.test(dist) && /mon-chua-san/.test(dist));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[K4 kho_phieu] Phiếu bán ở các màn Kho — danh sách, hạn mức nội bộ, gợi ý, sao lưu');
  await chay('K4', async () => {
    const ds = await goi('ql', 'GET', '/pos/kho/phieu');
    const dsBan = await goi('ql', 'GET', '/pos/kho/phieu?ban_hang=1');
    k('Kho › Phiếu: mặc định ẨN phiếu bán; lọc ban_hang=1 mới hiện', (ds.j.phieu || []).every((p) => p.su_co !== 'ban_hang')
      && (dsBan.j.phieu || []).length > 0 && (dsBan.j.phieu || []).every((p) => p.su_co === 'ban_hang'), `${(ds.j.phieu || []).length} / ${(dsBan.j.phieu || []).length}`);
    const ps = await goi('nv', 'POST', '/pos/kho/phieu-phat-sinh', { su_co: 'noi_bo', ghi_chu: 'uống thử', muc: [{ nguyen_lieu_id: nlCam, luong: 0.001 }], ma_gui: 'k3a-' + ngauNhien() });
    k('PS nội bộ nhỏ sau khi đã bán nhiều → không bị hạn mức chặn (bán không cộng vào hạn mức)', la(ps, 200) && ps.j.phieu?.trang_thai !== undefined, moTa(ps));
    const gy = await goi('nv', 'GET', '/pos/kho/goi-y-nhap');
    k('Gợi ý nhập: tồn lấy sau bán, "hay mua" không gồm nguyên liệu chỉ bị bán', la(gy, 200) && !(gy.j.hay_mua || []).includes(nlCaPhe), moTa(gy));
    const goiY = await goi('nv', 'GET', '/pos/kho/phat-sinh/goi-y?su_co=hong');
    k('Gợi ý phát sinh chạy (lô đã bán hết không còn)', la(goiY, 200) && !JSON.stringify(goiY.j).includes(`"lo_id":${loGan},`), moTa(goiY));
  });
  await chay('SaoLuu', async () => {
    const sl = await goi('chu', 'GET', '/pos/backup/export');
    k('C3 sao lưu chạy, không gọi SX', [200].includes(sl.status) && sxNhan.length === 0, `${moTa(sl)} · SX ${sxNhan.length}`);
    const cot = await q('PRAGMA table_info(kho_phieu)');
    k('Sao lưu giữ cột don_hang_id (SELECT * theo bảng)', cot.some((c) => c.name === 'don_hang_id'));
    const chiMuc = await q("SELECT sql FROM sqlite_master WHERE type = 'index' AND name = 'ux_kho_phieu_don_hang'");
    k('Khoá duy nhất một đơn — một phiếu bán (ux_kho_phieu_don_hang)', /UNIQUE/i.test(chiMuc[0]?.sql || ''));
    let trung = false;
    const dau = (await q("SELECT don_hang_id FROM kho_phieu WHERE su_co = 'ban_hang' AND don_hang_id IS NOT NULL LIMIT 1"))[0];
    try { await ghiDb(`INSERT INTO kho_phieu (loai, so_phieu, trang_thai, nguoi_tao, tao_luc, su_co, don_hang_id) VALUES ('PS', 'TRUNG-K3A', 'da_duyet', 'nen', ?, 'ban_hang', ?)`,
      [getNow(), dau?.don_hang_id]); } catch { trung = true; }
    k('Ghi hai phiếu bán cùng đơn → khoá duy nhất chặn', !!dau && trung);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] Gỡ SX — không lời gọi mạng, đường SX trả 410, sổ nợ không còn báo');
  await chay('C', async () => {
    await ghiDb(`INSERT INTO pos_stock_pending (order_code, order_id, sx_product_type, sx_product_id, product_name, quantity, direction, status, created_at)
      VALUES ('CU-K3A', 1, 'juice', 1, 'Cũ', 1, 'out', 'pending', ?)`, [getNow()]).catch(() => null);
    const sn = await goi('chu', 'GET', '/pos/so-no');
    k('C4 GET /so-no = 0 việc dù sổ nợ còn dòng pending (dữ liệu giữ nguyên)', la(sn, 200) && sn.j.cho === 0 && sn.j.canXem === 0
      && (await so("SELECT COUNT(*) FROM pos_stock_pending WHERE status = 'pending'")) >= 1, JSON.stringify(sn.j).slice(0, 120));
    const dn = await goi('chu', 'POST', '/pos/so-no/doi-ngay', {});
    k('C4 đẩy sổ nợ → 410 SX_DA_NGAT', la(dn, 410, 'SX_DA_NGAT'), moTa(dn));
    const xk = await goi('chu', 'GET', '/pos/registrations/export/csv');
    const ds = await goi('chu', 'GET', '/pos/registrations');
    k('C5 xuất SX của đăng ký → 410 SX_DA_NGAT; danh sách đăng ký vẫn 200', la(xk, 410, 'SX_DA_NGAT') && la(ds, 200), `${moTa(xk)} · ${moTa(ds)}`);
    const dongBo = await goi('chu', 'POST', '/pos/products/sync-from-sx', {});
    k('C1 POST /products/sync-from-sx → 410 SX_DA_NGAT', la(dongBo, 410, 'SX_DA_NGAT'), moTa(dongBo));
    const hoan = await goi('chu', 'POST', '/pos/damages', { order_id: donLS, product_code: `K3A${spLS.sx_product_id}`, quantity: 1, reason: 'other', action: 'return_stock' });
    k('Câu 3: báo sự cố "hoàn kho SX" → 400 HOAN_KHO_SX_DA_BO, không gọi SX', la(hoan, 400, 'HOAN_KHO_SX_DA_BO') && sxNhan.length === 0, moTa(hoan));
    k('C1/C2 suốt bài: SX giả nhận 0 lời gọi', sxNhan.length === 0, `${sxNhan.length}: ${sxNhan.slice(0, 4).join(', ')}`);
    k('C2 không lời gọi mạng nào ra ngoài', raNgoai.length === 0, raNgoai.slice(0, 3).join(', '));
    k('C2 không log lỗi SX', !nhatKyLoi.some((l) => /\bSX\b/.test(l)), nhatKyLoi.filter((l) => /\bSX\b/.test(l)).slice(0, 2).join(' | '));
    const may = ['routes/orders.js', 'routes/products.js', 'routes/damages.js', 'routes/backup.js', 'routes/so-no.js', 'utils/giuCho.js', 'index.js', 'ketNoiKho.js', 'database.js']
      .map((f) => [f, doc('server/' + f)]);
    const con = may.filter(([, s]) => /outStockFIFO|inStockReturn|checkStock\(|products-with-stock|isSxConfigured|diaChiSX|SX_API_URL/.test(s)).map(([f]) => f);
    k('C1/C6 server/ không còn lời gọi / biến SX (orders, products, damages, backup, so-no, giuCho, index, ketNoiKho, database)', con.length === 0, con.join(', '));
    k('C1 đã bỏ stock.js, doi-chieu.js, sync.js, utils/doSoNo.js', !coFile('server/routes/stock.js') && !coFile('server/routes/doi-chieu.js')
      && !coFile('server/routes/sync.js') && !coFile('server/utils/doSoNo.js'));
    const sxApi = doc('server/utils/sxApi.js');
    k('C1 sxApi.js chỉ còn callSxApi ném SX_DA_NGAT, không fetch (bước 020 vẫn nạp được)', /SX_DA_NGAT/.test(sxApi) && !/fetch\(/.test(sxApi));
    k('C6 index.js trả 410 cho /stock, /sync, /doi-chieu', /sxDaNgat/.test(doc('server/index.js')));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D1] Kho TRỐNG — mọi món bị chặn đúng mã, không 500');
  await chay('D1', async () => {
    const spT = await themSP('Trống K3a', 10000, { thuTu: 16 });
    const r = await banTM([mon(spT, 1)]);
    const p = await taoPhienQuay([mon(spT, 1)]);
    k('D1 kho trống: POST /orders và tạo phiên → CHUA_CO_CONG_THUC, không 500', la(r, 400, 'CHUA_CO_CONG_THUC') && la(p, 400, 'CHUA_CO_CONG_THUC'), `${moTa(r)} · ${moTa(p)}`);
  });

  noiLai();
  console.log(`\nKHO-3a: ${dat} đạt · ${hong} hỏng · tổng ${dat + hong} ca`);
  sv.close(); svGia.close(); svSx.close();
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.log('LỖI CHẠY BÀI:', e.stack); console.log(`\nKHO-3a: ${dat} đạt · ${hong + 1} hỏng · tổng ${dat + hong + 1} ca`); process.exit(1); });
