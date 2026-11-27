#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ TOPPING-1 — topping cài theo từng món · bán riêng · giá / hạng / mã / voucher / Flash / điểm · kho · sự cố · hoá đơn / tem · App KH
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:  node cong_cu/thu_TOPPING1.js  [--may-chu <thư mục server>]
 *  Khuôn thu_KHO3a.js: database.js thật + libsql kho TẠM, route thật qua app.listen(0), JWT theo vai trò, payOS giả.
 *  Mọi số tiền so với SỐ TÍNH TAY ghi ngay cạnh ca (KHUON_LOI K3 bổ sung 11.11) — không chép công thức của máy chủ.
 *  Đồng hồ: TZ=UTC, `datGio('YYYY-MM-DDTHH:mm:ss')` = giờ Việt Nam.
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');   // bản sao đột biến (viec/TOPPING-1/dot_bien.py)
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const KHACH_SRC = path.join(path.dirname(MAY_CHU), 'client', 'src');   // bản sao đột biến mang client/src cạnh server
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_topping1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_tp1_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_tp1_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.topping1.local/tra-ve';

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
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const chuoiKy = (d) => Object.keys(d).sort().map((x) => `${x}=${d[x] == null ? '' : d[x]}`).join('&');
const hmac = (s) => crypto.createHmac('sha256', KHOA.ck).update(s).digest('hex');

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const XLSX = require(path.join(GOC, 'node_modules', 'xlsx'));
  const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
  require.cache[duongKN] = { id: duongKN, filename: duongKN, loaded: true,
    exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => 'http://127.0.0.1:9', FILE_THU: FILE_KHO } };
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
  datGio('2026-11-27T08:00:00');   // TRƯỚC initDatabase: mốc bước 014_nap (truDiemHoan chỉ tính điểm ghi sau mốc) theo đồng hồ của bài, không theo giờ thật
  await db.initDatabase();
  const R = (f) => path.join(MAY_CHU, 'routes', f);
  const app = express();
  app.use(express.json());
  for (const r of ['products', 'orders', 'wallets', 'settings', 'backup', 'damages', 'flash', 'tiers', 'membership']) app.use('/api/pos/' + r, require(R(r + '.js')));
  app.use('/api/pos/hoa-don', require(R('hoaDon.js')));
  const tt = require(R('thanh-toan.js'));
  app.use('/api/pos/thanh-toan', tt);
  app.use('/api/payos/webhook', tt.webhook);
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  app.use('/api/pos/kho', require(path.join(MAY_CHU, 'kho', 'duong.js')));
  const { kyTokenKhach } = require(path.join(MAY_CHU, 'middleware', 'khachAuth.js'));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  const q = (sql, a = []) => db.query(sql, a).catch(() => []);
  const ghiDb = (sql, a = []) => db.run(sql, a);
  const mot = (sql, a = []) => db.queryOne(sql, a).catch(() => null);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const chu = await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const nguoi = { chu: chu.id };
  for (const [ai, ten, vaiTro] of [['ql', 'ql_tp1', 'manager'], ['nv', 'nv_tp1', 'staff']]) {
    nguoi[ai] = Number((await ghiDb("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)", [ten, ten, vaiTro])).lastInsertRowid);
  }
  await ghiDb("INSERT OR REPLACE INTO pos_permissions (role, permission, allowed) VALUES ('manager', 'manage_settings', 0)");
  await ghiDb("INSERT OR REPLACE INTO pos_permissions (role, permission, allowed) VALUES ('staff', 'manage_settings', 0)");
  const the = Object.fromEntries(Object.entries(nguoi).map(([a, id]) => [a, jwt.sign({ userId: id }, KHOA_NV, { expiresIn: '3650d' })]));
  const goi = async (ai, method, url, body, tkKhach, tho = false) => {
    imLang();
    try {
      const headers = {};
      if (ai) headers.Authorization = 'Bearer ' + the[ai];
      if (tkKhach) headers.Authorization = 'Bearer ' + tkKhach;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      if (tho) return { status: r.status, buf: Buffer.from(await r.arrayBuffer()) };
      const chu = await r.text();
      let j = {}; try { j = JSON.parse(chu); } catch { /* không phải JSON */ }
      return { status: r.status, j };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.j?.code ? ' · ' + r.j.code : ''}${r.j?.error ? ' · ' + r.j.error : ''}`;
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.stack?.split('\n').slice(0, 2).join(' | ')); } };
  const datCaiDat = (key, value) => ghiDb(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, String(value), getNow()]);
  for (const [a, b] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', 1000], ['loyalty_expiry_mode', 'none'], ['flash_enabled', 'false'],
    ['signup_enabled', '0'], ['nhandiem_enabled', '0'], ['thanh_toan_payos_bat_buoc', '0'], ['gio_hd_lich', ''], ['gio_hd_ngung_truoc_phut', '0']]) await datCaiDat(a, b);
  datGio('2026-11-27T09:00:00');

  console.log('\nTHỬ TOPPING-1 — topping theo món · bán riêng · tiền · kho · sự cố · hoá đơn / tem · App KH');

  // ── Dữ liệu nền ──
  const nhom = Number((await ghiDb("INSERT INTO kho_nhom_nguyen_lieu (ten, thu_tu) VALUES ('Nhóm TP1', 1)")).lastInsertRowid);
  const themNL = async (ten) => Number((await ghiDb(`INSERT INTO kho_nguyen_lieu (ten, ten_chuan, nhom_id, don_vi_luu, don_vi_hien, he_so_doi, gia_nhap, tao_luc)
    VALUES (?, ?, ?, 'kg', 'kg', 1, 1000, '2026-11-01T00:00:00')`, [ten, ten.toLowerCase(), nhom])).lastInsertRowid);
  const nlTra = await themNL('Trà TP1'), nlNep = await themNL('Nếp TP1');
  let soPhieu = 0;
  const phieuNen = async (loai, d) => {
    const id = Number((await ghiDb(`INSERT INTO kho_phieu (loai, so_phieu, trang_thai, nguoi_tao, tao_luc, nguoi_duyet, duyet_luc)
      VALUES (?, ?, 'da_duyet', 'nen', ?, 'nen', ?)`, [loai, `TP1-${++soPhieu}`, getNow(), getNow()])).lastInsertRowid);
    const lo = Number((await ghiDb('INSERT INTO kho_lo (nguyen_lieu_id, san_pham_id, so_luong, han_dung, phieu_id, tao_luc) VALUES (?, ?, ?, NULL, ?, ?)',
      [d.nl ?? null, d.sp ?? null, d.sl, id, getNow()])).lastInsertRowid);
    await ghiDb('INSERT INTO kho_phieu_dong (phieu_id, nguyen_lieu_id, san_pham_id, lo_id, so_luong, loai) VALUES (?, ?, ?, ?, ?, ?)',
      [id, d.nl ?? null, d.sp ?? null, lo, d.sl, d.nl ? 'nhap' : 'thanh_pham']);
    return lo;
  };
  await phieuNen('PN', { nl: nlTra, sl: 1000 });
  const conLoSP = (spId) => so(`SELECT COALESCE(SUM(d.so_luong), 0) FROM kho_phieu_dong d JOIN kho_phieu p ON p.id = d.phieu_id
    WHERE d.san_pham_id = ? AND p.trang_thai = 'da_duyet' AND p.loai <> 'DH'`, [spId]);
  const taoMon = async (ten, giaTien, category = 'tea') => {
    const r = await goi('chu', 'POST', '/pos/products', { name: ten, price: giaTien, category, unit: 'ly' });
    const p = r.j.product;
    return { id: p.id, code: p.code, sx_product_type: p.sx_product_type, sx_product_id: p.sx_product_id, ten, gia: giaTien };
  };
  const luuKho = (sp, than) => goi('chu', 'PUT', `/pos/kho/san-pham/${sp.id}`, than);
  const caiMon = (sp, than, ai = 'chu') => goi(ai, 'PUT', `/pos/products/${sp.id}`, than);
  const maCua = (sp) => `${sp.sx_product_type}_${sp.sx_product_id}`;

  const TRA = await taoMon('Trà Dưỡng Nhan TP1', 45000);
  const TRA2 = await taoMon('Trà Gừng TP1', 30000);
  const CAM = await taoMon('Nước Cam TP1', 20000, 'juice');
  const NEP = await taoMon('Nếp cẩm TP1', 10000, 'topping');
  const THACH = await taoMon('Thạch TP1', 7505, 'topping');   // giá lẻ: 10 % ra 750,5 → làm tròn
  const LN = await taoMon('Long nhãn TP1', 12000, 'topping');
  for (const m of [TRA, TRA2, CAM]) await luuKho(m, { kieu: 'pha_tai_cho', cong_thuc: [{ nguyen_lieu_id: nlTra, luong: 0.01 }] });
  for (const t of [NEP, THACH, LN]) await luuKho(t, { kieu: 'lam_san', cong_thuc: [{ nguyen_lieu_id: nlNep, luong: 0.05 }] });
  const loNep = await phieuNen('PX', { sp: NEP.id, sl: 40 });
  await phieuNen('PX', { sp: THACH.id, sl: 6 });
  await phieuNen('PX', { sp: LN.id, sl: 1 });

  const mon = (sp, sl = 1, topping) => ({ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: sl,
    ...(topping ? { topping: topping.map(([t, n]) => ({ product_id: t.id, sx_product_type: t.sx_product_type, sx_product_id: t.sx_product_id, so_phan: n })) } : {}) });
  const tinhThu = (items, them = {}) => goi('chu', 'POST', '/pos/orders/tinh-thu', { items, ...them });
  const tongCua = async (items, them = {}) => Number((await tinhThu(items, them)).j.total);
  const banTM = async (items, them = {}) => {
    const tong = await tongCua(items, them);
    return goi('chu', 'POST', '/pos/orders', { items, payment_method: 'cash', cash_amount: tong, cash_received: tong, ...them });
  };
  const dongDon = (id) => q('SELECT * FROM pos_order_items WHERE order_id = ? ORDER BY id', [id]);
  const donDb = (id) => mot('SELECT * FROM pos_orders WHERE id = ?', [id]);
  let soSdt = 0;
  const khach = async () => {
    const sdt = '09' + String(71000000 + (++soSdt)).padStart(8, '0');
    const id = Number((await ghiDb('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách TP1 ' + soSdt, getNow()])).lastInsertRowid);
    return { sdt, id, tk: kyTokenKhach(id) };
  };

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B1–B3] Cài đặt topping + ghi chú nhanh theo món (PUT /pos/products/:id)');
  await chay('B', async () => {
    const t1 = await caiMon(NEP, { la_topping: 1, gia_ban_rieng: 15000 });
    const t1b = await caiMon(THACH, { la_topping: 1, gia_ban_rieng: null });
    await caiMon(LN, { la_topping: 1 });
    k('T01 đặt cờ topping + giá bán riêng (có / trống)', la(t1, 200) && la(t1b, 200) && t1.j.product?.la_topping === 1 && t1.j.product?.gia_ban_rieng === 15000
      && t1b.j.product?.gia_ban_rieng === null, `${moTa(t1)} · ${moTa(t1b)}`);
    const gt0 = await caiMon(NEP, { gia_ban_rieng: 0 });
    k('T01b giá bán riêng 0 / âm / lẻ → 400 (trống mới là "không bán riêng")', la(gt0, 400) && la(await caiMon(NEP, { gia_ban_rieng: 1500.5 }), 400), moTa(gt0));
    const t2 = await caiMon(TRA, { topping_cho_mon: [NEP.id, THACH.id, LN.id], ghi_chu_nhanh: ['Ít đá', 'Không đá', 'Ít ngọt'] });
    k('T02 món: tick topping + ghi chú nhanh theo thứ tự', la(t2, 200) && JSON.stringify(t2.j.product?.ghi_chu_nhanh) === '["Ít đá","Không đá","Ít ngọt"]'
      && JSON.stringify(t2.j.product?.topping_cho_mon) === JSON.stringify([NEP.id, THACH.id, LN.id]), moTa(t2));
    const t5 = await caiMon(TRA2, { topping_cho_mon: [CAM.id] });
    k('T05 topping_cho_mon trỏ món KHÔNG phải topping → 400 TOPPING_KHONG_HOP_LE', la(t5, 400, 'TOPPING_KHONG_HOP_LE'), moTa(t5));
    const t5b = await caiMon(NEP, { topping_cho_mon: [THACH.id] });
    k('T05b topping không có topping của topping → 400 TOPPING_KHONG_HOP_LE', la(t5b, 400, 'TOPPING_KHONG_HOP_LE'), moTa(t5b));
    const gcSai = await caiMon(TRA2, { ghi_chu_nhanh: ['x'.repeat(31)] });
    k('T05c ghi chú nhanh > 30 ký tự → 400', la(gcSai, 400), moTa(gcSai));
    const t7 = await caiMon(TRA2, { topping_cho_mon: [NEP.id] }, 'ql');
    k('T48 quản lý không quyền manage_settings → 403, không đổi', t7.status === 403 && !(await mot('SELECT topping_cho_mon FROM pos_products WHERE id = ?', [TRA2.id]))?.topping_cho_mon, moTa(t7));
    const ds = await goi('ql', 'GET', '/pos/products');
    const tra = Array.isArray(ds.j) ? ds.j.find((p) => p.id === TRA.id) : null, nep = Array.isArray(ds.j) ? ds.j.find((p) => p.id === NEP.id) : null;
    k('T48b quản lý XEM được: menu quầy có topping[], ghi_chu_nhanh[], la_topping, gia_ban_rieng, topping_toi_da_phan = 3',
      JSON.stringify(tra?.topping) === JSON.stringify([NEP.id, THACH.id, LN.id]) && tra?.ghi_chu_nhanh?.length === 3 && nep?.la_topping === true
      && nep?.gia_ban_rieng === 15000 && tra?.topping_toi_da_phan === 3, JSON.stringify(tra && { t: tra.topping, g: tra.ghi_chu_nhanh, m: tra.topping_toi_da_phan }));
    const c6 = await goi('chu', 'POST', `/pos/products/${TRA.id}/chep-nhom`, {});
    const tra2 = await mot('SELECT topping_cho_mon, ghi_chu_nhanh FROM pos_products WHERE id = ?', [TRA2.id]);
    const cam = await mot('SELECT topping_cho_mon FROM pos_products WHERE id = ?', [CAM.id]);
    k('T06 "Chép cho cả nhóm": món cùng nhóm (tea) nhận topping + ghi chú; nhóm khác (juice) không đổi',
      la(c6, 200) && tra2?.topping_cho_mon === JSON.stringify([NEP.id, THACH.id, LN.id]) && tra2?.ghi_chu_nhanh === JSON.stringify(['Ít đá', 'Không đá', 'Ít ngọt'])
      && !cam?.topping_cho_mon, `${moTa(c6)} · ${JSON.stringify(tra2)}`);
    k('T06b chép nhóm cần quyền → quản lý 403', (await goi('ql', 'POST', `/pos/products/${TRA.id}/chep-nhom`, {})).status === 403);
    // K5 (soát vòng 1): món đã tick một topping, sau đó topping bị ẩn → sửa món chỗ KHÁC (thứ tự / tên / ẩn) KHÔNG bị chặn
    await ghiDb('UPDATE pos_products SET is_active = 0 WHERE id = ?', [LN.id]);
    const t5d = await caiMon(TRA2, { sort_order: 5 });
    const t5e = await caiMon(TRA2, { topping_cho_mon: [NEP.id, LN.id] });
    await ghiDb('UPDATE pos_products SET is_active = 1 WHERE id = ?', [LN.id]);
    k('T05d topping trong danh sách cũ đã ẩn → sửa thứ tự món vẫn 200 (không chặn oan)', la(t5d, 200), moTa(t5d));
    k('T05e nhưng GỬI danh sách có topping đã ẩn → 400 TOPPING_KHONG_HOP_LE', la(t5e, 400, 'TOPPING_KHONG_HOP_LE'), moTa(t5e));
    await ghiDb('UPDATE pos_products SET ghi_chu_nhanh = ? WHERE id = ?', [JSON.stringify(['Ít đá']), NEP.id]);
    const ds2 = await goi('chu', 'GET', '/pos/products');
    await ghiDb('UPDATE pos_products SET ghi_chu_nhanh = NULL WHERE id = ?', [NEP.id]);
    k('T48c topping không có nút ghi chú nhanh ở quầy (dù CSDL còn dữ liệu cũ) — chạm tab Topping là vào giỏ, cùng luật App',
      JSON.stringify((Array.isArray(ds2.j) ? ds2.j : []).find((p) => p.id === NEP.id)?.ghi_chu_nhanh) === '[]');
  });

  muc('[B2] Bước nâng cấp 036 — chép ghi chú THEO_NHOM cũ (K5: quầy không mất nút ghi chú ngày đầu)');
  await chay('B2', async () => {
    const buoc = require(path.join(MAY_CHU, 'nang_cap', '036_topping.js'));
    const tea = await taoMon('Trà nâng cấp TP1', 20000, 'tea'), juice = await taoMon('Ép nâng cấp TP1', 20000, 'juice'), khac = await taoMon('Bánh nâng cấp TP1', 20000, 'banh');
    const daCo = await taoMon('Trà có sẵn TP1', 20000, 'tea');
    for (const m of [tea, juice, khac, daCo]) await ghiDb('UPDATE pos_products SET ghi_chu_nhanh = NULL WHERE id = ?', [m.id]);
    await ghiDb('UPDATE pos_products SET ghi_chu_nhanh = ? WHERE id = ?', [JSON.stringify(['Riêng']), daCo.id]);
    const tx = await db.beginTransaction();
    const themCot = async () => {};   // cột đã thêm lúc khởi động (initDatabase chạy cả thư mục nang_cap) — ở đây chỉ thử phần chép ghi chú
    try { await buoc.chay(tx, { themCot }); await buoc.chay(tx, { themCot }); await tx.commit(); } catch (e) { await tx.rollback(); throw e; }
    const gc = async (m) => (await mot('SELECT ghi_chu_nhanh FROM pos_products WHERE id = ?', [m.id]))?.ghi_chu_nhanh;
    k('T03 tea → ["Ít đá","Không đá","Ít ngọt","Nóng"]', (await gc(tea)) === JSON.stringify(['Ít đá', 'Không đá', 'Ít ngọt', 'Nóng']), await gc(tea));
    k('T03b juice → ["Ít đá","Không đá","Không đường"]', (await gc(juice)) === JSON.stringify(['Ít đá', 'Không đá', 'Không đường']), await gc(juice));
    k('T03c nhóm khác → bộ dự phòng (chat Q6)', (await gc(khac)) === JSON.stringify(['Ít đá', 'Không đá', 'Ít đường', 'Không đường']), await gc(khac));
    k('T03d món đã có ghi chú → giữ nguyên, chạy hai lần không đè', (await gc(daCo)) === JSON.stringify(['Riêng']), await gc(daCo));
    k('T03e sản phẩm topping không nhận ghi chú nhanh', (await gc(NEP)) == null || (await gc(NEP)) === '[]', await gc(NEP));
    for (const m of [tea, juice, khac, daCo]) await ghiDb('UPDATE pos_products SET is_active = 0 WHERE id = ?', [m.id]);
  });

  muc('[D1, D2] Tạo đơn: dòng con, máy chủ tự tra giá, chặn sai');
  let don1 = null;
  await chay('D1', async () => {
    const items = [mon(TRA, 2, [[NEP, 2]])];
    items[0].unit_price = 1; items[0].topping[0].unit_price = 1; items[0].topping[0].price = 1;   // giá màn gửi: phải bị bỏ qua
    const tong = await tongCua(items);
    k('T12 1 ly trà + 2 phần nếp cẩm × 2 ly = 45.000×2 + 10.000×2×2 = 130.000đ', tong === 130000, String(tong));
    const r = await goi('chu', 'POST', '/pos/orders', { items, payment_method: 'cash', cash_amount: 130000, cash_received: 130000 });
    don1 = r.j.order;
    const dd = don1 ? await dongDon(don1.id) : [];
    const cha = dd.find((d) => d.product_id === TRA.id), con = dd.find((d) => d.product_id === NEP.id);
    k('T12b đơn ghi: dòng trà (2 ly) + dòng nếp cẩm 4 phần trỏ về dòng trà (dong_cha_id)', la(r, 200) && dd.length === 2 && cha?.quantity === 2
      && con?.quantity === 4 && con?.dong_cha_id === cha?.id && cha?.dong_cha_id == null && con?.unit_price === 10000, `${moTa(r)} · ${JSON.stringify(dd.map((d) => [d.product_id, d.quantity, d.dong_cha_id]))}`);
    k('T13 giá màn gửi (1đ) bị bỏ qua — máy chủ dùng giá DB (total 130.000)', Number(don1?.total) === 130000, String(don1?.total));
    const tt = await tinhThu([mon(TRA, 2, [[NEP, 2]]), mon(CAM, 1)]);
    const its = tt.j.chi_tiet?.items || tt.j.items || [];
    k('T08 tinh-thu trả `cha` + `so_phan` để quầy / App ghép dòng', its.length === 3 && its[1]?.cha === 0 && its[1]?.so_phan === 2 && its[0]?.cha == null && its[2]?.cha == null,
      JSON.stringify(its.map((x) => [x.product_id, x.cha, x.so_phan])));
    const sai = async (ten, items2, code) => { const x = await tinhThu(items2); k(ten, la(x, 400, code), moTa(x)); };
    await sai('T14 topping không thuộc danh sách của món (Cam không cài topping) → TOPPING_KHONG_CHO_MON', [mon(CAM, 1, [[NEP, 1]])], 'TOPPING_KHONG_CHO_MON');
    await sai('T14b topping gắn vào topping → TOPPING_KHONG_CHO_MON', [mon(NEP, 1, [[THACH, 1]])], 'TOPPING_KHONG_CHO_MON');
    await sai('T14c "topping" là món thường đặt vào ly → TOPPING_KHONG_CHO_MON', [mon(TRA, 1, [[CAM, 1]])], 'TOPPING_KHONG_CHO_MON');
    await sai('T15 so_phan 0 → TOPPING_SO_PHAN', [mon(TRA, 1, [[NEP, 0]])], 'TOPPING_SO_PHAN');
    await sai('T15b so_phan 4 (ngay trên trần 3) → TOPPING_SO_PHAN', [mon(TRA, 1, [[NEP, 4]])], 'TOPPING_SO_PHAN');
    await sai('T15c so_phan 1,5 → TOPPING_SO_PHAN', [mon(TRA, 1, [[NEP, 1.5]])], 'TOPPING_SO_PHAN');
    await sai('T15d so_phan chuỗi "2" → TOPPING_SO_PHAN', [{ ...mon(TRA, 1), topping: [{ product_id: NEP.id, so_phan: '2' }] }], 'TOPPING_SO_PHAN');
    await sai('T15e cùng topping hai lần trong một ly → TOPPING_SO_PHAN', [mon(TRA, 1, [[NEP, 1], [NEP, 2]])], 'TOPPING_SO_PHAN');
    k('T15f so_phan 3 (đúng trần) → qua', la(await tinhThu([mon(TRA, 1, [[NEP, 3]])]), 200));
    const xs = await tinhThu([{ ...mon(TRA, 1), topping: 'NEP' }]);
    k('T15g topping không phải mảng → 400', xs.status === 400, moTa(xs));
    await sai('T16 topping đứng một mình mà không có giá bán riêng → TOPPING_KHONG_BAN_RIENG', [mon(THACH, 1)], 'TOPPING_KHONG_BAN_RIENG');
    await ghiDb('UPDATE pos_products SET is_active = 0 WHERE id = ?', [THACH.id]);
    const ng = await tinhThu([mon(TRA, 1, [[THACH, 1]])]);
    await ghiDb('UPDATE pos_products SET is_active = 1 WHERE id = ?', [THACH.id]);
    k('T17 topping ngừng bán → 400 "ngừng bán" (mã sẵn có của món)', ng.status === 400 && /ngừng bán/.test(ng.j.error || ''), moTa(ng));
    const het = await banTM([mon(TRA, 2, [[LN, 1]])]);
    k('T17b topping hết lô (Long nhãn còn 1, cần 2) → HET_HANG, không ghi đơn', la(het, 400, 'HET_HANG'), moTa(het));
  });

  muc('[D3] Tiền: hạng · mã · voucher · Flash · điểm — so số tính tay');
  const vang = Number((await ghiDb(`INSERT INTO pos_membership_tiers (name, card_price, discount_percent, special_discount_percent, sort_order, is_active, cach_co, goi)
    VALUES ('Vàng TP1', 0, 10, 10, 50, 1, 'ban', '[]')`)).lastInsertRowid);
  const khachHang = async () => {
    const kh = await khach();
    await ghiDb(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
      VALUES (?, ?, 'Vàng TP1', 0, NULL, ?, '2099-12-31T00:00:00')`, [kh.sdt, vang, getNow()]);
    return kh;
  };
  let soMa = 0;
  const maChung = async (loai, giaTri, scope = 'order', nhomId = null) => {
    const ma = 'TP1MA' + (++soMa);
    await ghiDb(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active, discount_scope, applicable_group_id)
      VALUES (?, ?, ?, 0, 0, 0, 0, 1, ?, ?)`, [ma, loai, giaTri, scope, nhomId]);
    return ma;
  };
  const voucher = async (sdt, loai, giaTri, o = {}) => {
    const ma = 'TP1V' + (++soMa);
    await ghiDb(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, valid_to, is_active, ap_dung, ap_dung_ids)
      VALUES (?, ?, ?, 0, 0, 1, 0, '2099-12-31', 1, ?, ?)`, [ma, loai, giaTri, o.ap_dung || 'tat_ca', o.ids ? JSON.stringify(o.ids) : null]);
    await ghiDb("INSERT INTO pos_voucher_grants (code, customer_phone, status, granted_at, expires_at) VALUES (?, ?, 'available', ?, '2099-12-31')", [ma, sdt, getNow()]);
    return ma;
  };
  await ghiDb("INSERT INTO pos_product_groups (id, code, name) VALUES (931, 'NHOM_TP1', 'Nhóm thử TOPPING-1')");
  await ghiDb('INSERT INTO pos_product_group_members (group_id, sx_product_type, sx_product_id) VALUES (931, ?, ?)', [TRA.sx_product_type, TRA.sx_product_id]);
  await chay('D3', async () => {
    const kv = await khachHang();
    const r18 = await tinhThu([mon(TRA, 1, [[THACH, 1]])], { customer_phone: kv.sdt });
    // tay: 45.000 + 7.505 = 52.505; giảm hạng 10 % từng dòng: 4.500 + round(750,5) = 4.500 + 751 = 5.251 → 47.254
    k('T18 khách Vàng 10 %: trà 45.000 + thạch 7.505 → giảm 4.500 + 751 = 5.251, tổng 47.254đ', Number(r18.j.total) === 47254 && Number(r18.j.tier_discount) === 5251,
      `${moTa(r18)} · ${r18.j.total} · ${r18.j.tier_discount}`);
    const kh = await khach();
    const v1 = await voucher(kh.sdt, 'fixed', 20000), v2 = await voucher(kh.sdt, 'percent', 10);
    const r19 = await tinhThu([mon(TRA, 2, [[NEP, 2]])], { customer_phone: kh.sdt, vouchers: [v1, v2] });
    // tay: tiền món gồm topping 130.000 → voucher tiền 20.000 → còn 110.000 → voucher 10 % = 11.000 → tổng 99.000 (không tính topping: 103.000)
    k('T19 voucher 20.000đ + voucher 10 % trên 130.000 (gồm topping) → 20.000 + 11.000, tổng 99.000đ', Number(r19.j.total) === 99000, `${moTa(r19)} · ${r19.j.total}`);
    const m20 = await maChung('percent', 10);
    const r20 = await tinhThu([mon(TRA, 2, [[NEP, 2]])], { discount_code: m20 });
    k('T20 mã giảm 10 % trên 130.000 → 13.000, tổng 117.000đ', Number(r20.j.total) === 117000, `${moTa(r20)} · ${r20.j.total}`);
    const m42 = await maChung('fixed', 5000);
    k('T42 mã giảm TIỀN 5.000đ trên đơn có topping → 125.000đ', (await tongCua([mon(TRA, 2, [[NEP, 2]])], { discount_code: m42 })) === 125000);
    const kn = await khach();
    const vn = await voucher(kn.sdt, 'percent', 10, { ap_dung: 'nhom', ids: [931] });
    const r21 = await tinhThu([mon(TRA, 2, [[NEP, 2]]), mon(CAM, 1)], { customer_phone: kn.sdt, vouchers: [vn] });
    // tay: nhóm có trà → trà 90.000 + nếp cẩm của ly trà 40.000 = 130.000 × 10 % = 13.000; cam 20.000 không giảm → 150.000 − 13.000 = 137.000
    k('T21 voucher 10 % theo nhóm "trà" giảm cả topping của ly trà (13.000), không giảm cam → 137.000đ (Q3)', Number(r21.j.total) === 137000, `${moTa(r21)} · ${r21.j.total}`);
    const m43 = await maChung('percent', 50, 'item', 931);
    const r43 = await tinhThu([mon(TRA, 1, [[NEP, 2]])], { discount_code: m43 });
    // tay: mã "giảm 1 món" 50 % chỉ trên ly trà 45.000 → 22.500; topping 20.000 không giảm → 65.000 − 22.500 = 42.500
    k('T43 mã "giảm 1 món" 50 % chỉ giảm ly (22.500), không giảm topping → 42.500đ (Q3)', Number(r43.j.total) === 42500, `${moTa(r43)} · ${r43.j.total}`);
    // soát vòng 2: topping CŨNG thuộc nhóm của mã và ĐẮT hơn ly → mã vẫn chỉ chọn ly
    await ghiDb("INSERT INTO pos_product_groups (id, code, name) VALUES (933, 'NHOM_TP1B', 'Nhóm thử TOPPING-1 b')");
    for (const sp of [TRA2, NEP]) await ghiDb('INSERT INTO pos_product_group_members (group_id, sx_product_type, sx_product_id) VALUES (933, ?, ?)', [sp.sx_product_type, sp.sx_product_id]);
    await ghiDb('UPDATE pos_products SET price = 40000 WHERE id = ?', [NEP.id]);
    const m43b = await maChung('percent', 50, 'item', 933);
    const t43b = await tongCua([mon(TRA2, 1, [[NEP, 1]])], { discount_code: m43b });
    await ghiDb('UPDATE pos_products SET price = 10000 WHERE id = ?', [NEP.id]);
    await ghiDb('DELETE FROM pos_product_group_members WHERE group_id = 933');
    // tay: trà gừng 30.000 + nếp 40.000 = 70.000; mã 50 % chọn LY 30.000 → giảm 15.000 → 55.000 (nếu chọn topping: giảm 20.000 → 50.000)
    k('T43b topping thuộc nhóm của mã và đắt hơn ly → mã "giảm 1 món" vẫn chọn ly: 55.000đ', t43b === 55000, String(t43b));
    const flash = async (keys, fn) => {
      for (const [key, v] of [['flash_enabled', 'true'], ['flash_start', '08:00'], ['flash_end', '11:00'], ['flash_percent', 20], ['flash_product_keys', JSON.stringify(keys)]]) await datCaiDat(key, v);
      try { return await fn(); } finally { await datCaiDat('flash_enabled', 'false'); }
    };
    const f1 = await flash([maCua(NEP)], () => tongCua([mon(TRA, 1, [[NEP, 1]])]));
    const f2 = await flash([maCua(TRA)], () => tongCua([mon(TRA, 1, [[NEP, 1]])]));
    // tay: topping trong Flash 20 %: 10.000 → 2.000 giảm → 53.000; chỉ trà trong Flash: 45.000 → 9.000 giảm, topping không kéo theo → 46.000
    k('T22 Flash: topping có trong danh sách → giảm topping (53.000đ)', f1 === 53000, String(f1));
    k('T22b Flash: chỉ ly trong danh sách → topping KHÔNG kéo theo (46.000đ) (Q2)', f2 === 46000, String(f2));
    const f3 = await flash([maCua(NEP)], () => tinhThu([mon(TRA, 1, [[NEP, 1]])], { customer_phone: kv.sdt }));
    k('T22c đơn dính Flash (vì topping) → không giảm hạng như cũ', Number(f3.j.tier_discount || 0) === 0 && Number(f3.j.total) === 53000, `${f3.j.total} · ${f3.j.tier_discount}`);
    await ghiDb('UPDATE pos_products SET tich_diem = 0 WHERE id = ?', [NEP.id]);
    const kd = await khach();
    const b23 = await banTM([mon(TRA, 1, [[NEP, 1]])], { customer_phone: kd.sdt });
    const diem23 = await so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ?', [b23.j.order?.id]);
    // tay: 55.000 trả, phần dòng bật điểm = trà 45.000 → 45 điểm (1 điểm / 1.000đ)
    k('T23 điểm: topping tắt tích điểm → chỉ trên ly (45 điểm của 55.000đ)', la(b23, 200) && diem23 === 45, `${moTa(b23)} · ${diem23}`);
    await ghiDb('UPDATE pos_products SET tich_diem = 1 WHERE id = ?', [NEP.id]);
    const kd2 = await khach();
    const b23b = await banTM([mon(TRA, 1, [[NEP, 1]])], { customer_phone: kd2.sdt });
    k('T23b topping bật tích điểm → cả topping (55 điểm)', (await so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ?', [b23b.j.order?.id])) === 55);
  });

  muc('[D4] Kho: tổng topping cả giỏ · giữ hàng phiên · trừ · huỷ · xoá · hoàn · sự cố');
  await chay('D4', async () => {
    await phieuNen('PX', { sp: THACH.id, sl: 0.0001 });   // không đổi tồn nguyên phần (6)
    const ton = Math.floor(await conLoSP(THACH.id));
    k('T24 nền: thạch còn 6 phần', ton === 6, String(ton));
    const vuot = await banTM([mon(TRA, 1, [[THACH, 3]]), mon(TRA2, 2, [[THACH, 2]])]);   // 3 + 4 = 7 > 6
    k('T24 hai dòng cùng topping tổng 7 > tồn 6 → HET_HANG (ngay trên)', la(vuot, 400, 'HET_HANG'), moTa(vuot));
    const truoc = await conLoSP(THACH.id);
    const vua = await banTM([mon(TRA, 1, [[THACH, 2]]), mon(TRA2, 2, [[THACH, 2]])]);   // 2 + 4 = 6 = tồn
    k('T24b tổng = tồn 6 → qua (ngay dưới)', la(vua, 200), moTa(vua));
    k('T26 trừ kho topping cùng phiếu bán của đơn (6 phần)', Math.abs((truoc - (await conLoSP(THACH.id))) - 6) < 1e-6, String(truoc - (await conLoSP(THACH.id))));
    const huy = await goi('chu', 'PUT', `/pos/orders/${vua.j.order?.id}/cancel`, { reason: 'khách đổi ý (thử)', ly_do_ma: 'khach_doi_y' });
    k('T27 huỷ đơn → topping về kho (lại 6 phần)', la(huy, 200) && Math.abs((await conLoSP(THACH.id)) - truoc) < 1e-6, `${moTa(huy)} · ${await conLoSP(THACH.id)}`);
    const d38 = await banTM([mon(TRA, 1, [[THACH, 2]])]);
    const xoa = await goi('chu', 'DELETE', `/pos/orders/${d38.j.order?.id}`, { reason: 'thử xoá' });
    k('T38 xoá đơn → topping về kho', la(d38, 200) && xoa.status < 300 && Math.abs((await conLoSP(THACH.id)) - truoc) < 1e-6, `${moTa(xoa)} · ${await conLoSP(THACH.id)}`);
    // giữ hàng phiên chờ trả: phiên QR giữ 6 phần thạch → quầy không bán được 1 phần; huỷ phiên → bán được
    const ph = await goi('chu', 'POST', '/pos/thanh-toan/phien', { cach: 'payos', don: { items: [mon(TRA, 2, [[THACH, 3]])] } });
    const chan = await banTM([mon(TRA, 1, [[THACH, 1]])]);
    k('T25 phiên chờ trả giữ 6 phần topping → đơn quầy cần 1 phần bị HET_HANG', la(ph, 200) && la(chan, 400, 'HET_HANG'), `${moTa(ph)} · ${moTa(chan)}`);
    await goi('chu', 'POST', `/pos/thanh-toan/phien/${ph.j.phien?.id}/huy`, {});
    k('T25b huỷ phiên → nhả, đơn quầy qua', la(await banTM([mon(TRA, 1, [[THACH, 1]])]), 200));
    // hai đơn cùng lúc tranh phần cuối
    const con = Math.floor(await conLoSP(THACH.id));
    const [a, b] = await Promise.all([banTM([mon(TRA, con, [[THACH, 1]])]), banTM([mon(TRA2, con, [[THACH, 1]])])]);   // mỗi đơn cần đủ `con` phần
    k(`T36 hai đơn cùng lúc tranh ${con} phần cuối → đúng một đơn qua, một HET_HANG`, [a, b].filter((x) => x.status === 200).length === 1
      && [a, b].some((x) => la(x, 400, 'HET_HANG')), `${moTa(a)} · ${moTa(b)}`);
    const r29 = await banTM([mon(NEP, 2)]);
    const dd29 = r29.j.order ? await dongDon(r29.j.order.id) : [];
    k('T29 topping bán riêng 2 phần: giá bán riêng 15.000 × 2 = 30.000đ, không dòng cha', la(r29, 200) && Number(r29.j.order?.total) === 30000
      && dd29.length === 1 && dd29[0].dong_cha_id == null, `${moTa(r29)} · ${r29.j.order?.total}`);
  });

  muc('[D4 · Q7] Báo sự cố: theo LY (gồm topping), topping riêng; trần + điểm chia phần ly / topping');
  await chay('Q7', async () => {
    await ghiDb('UPDATE pos_products SET tich_diem = 0 WHERE id = ?', [NEP.id]);
    const kh = await khach();
    const b = await banTM([mon(TRA, 2, [[NEP, 1]])], { customer_phone: kh.sdt });   // 2 × (45.000 + 10.000) = 110.000; điểm bật = 90.000 → 90
    const o = b.j.order;
    const den = (code, tien, sl = 1) => goi('chu', 'POST', '/pos/damages', { order_id: o?.id, product_code: code, quantity: sl, reason: 'damaged', action: 'refund', refund_amount: tien });
    const diem = () => so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ?', [o?.id]);
    k('Q7 nền: đơn 110.000đ, 90 điểm (topping tắt điểm)', la(b, 200) && Number(o?.total) === 110000 && (await diem()) === 90, `${moTa(b)} · ${await diem()}`);
    const qua = await den(TRA.code, 55001);
    k('T28 đền 1 ly: trần = ly 45.000 + topping 10.000 = 55.000 → 55.001 bị VUOT_GIA', la(qua, 400, 'VUOT_GIA'), moTa(qua));
    const tp = await den(NEP.code, 1000);
    k('T28b chọn riêng dòng topping trong ly → TOPPING_BAO_THEO_LY', la(tp, 400, 'TOPPING_BAO_THEO_LY'), moTa(tp));
    const d1 = await den(TRA.code, 22000);
    // tay: 22.000 chia theo đã trả của ly: trà 45.000 / 55.000 → 18.000 (bật), nếp 10.000 / 55.000 → 4.000 (tắt). Điểm trừ = ceil(90 × 18.000 / 90.000) = 18
    k('T28c đền 22.000 (trong trần) → qua; điểm trừ chia phần ly / topping: 18 điểm (không phải 22)', la(d1, 200) && (await diem()) === 72, `${moTa(d1)} · còn ${await diem()}`);
    const d2 = await den(TRA.code, 55000);
    k('T28d đền ly thứ hai đủ 55.000 (gồm topping) → qua', la(d2, 200), moTa(d2));
    const d3 = await den(TRA.code, 1, 1);
    k('T28e hết số ly → VUOT_SO_LUONG', la(d3, 400, 'VUOT_SO_LUONG'), moTa(d3));
    await ghiDb('UPDATE pos_products SET tich_diem = 1 WHERE id = ?', [NEP.id]);
    const kr = await khach();
    const br = await banTM([mon(NEP, 2)], { customer_phone: kr.sdt });
    const dr = await goi('chu', 'POST', '/pos/damages', { order_id: br.j.order?.id, product_code: NEP.code, quantity: 1, reason: 'damaged', action: 'refund', refund_amount: 15000 });
    k('T28f topping bán riêng đền như món (15.000)', la(dr, 200), moTa(dr));
    const kh39 = await khach();
    const b39 = await banTM([mon(TRA, 1, [[NEP, 2]])], { customer_phone: kh39.sdt });
    const vi0 = (await mot('SELECT balance FROM pos_wallets WHERE phone = ?', [kh39.sdt]))?.balance || 0;
    const h39 = await goi('chu', 'PUT', `/pos/orders/${b39.j.order?.id}/cancel`, { reason: 'thử', ly_do_ma: 'khach_doi_y' });
    const vi1 = (await mot('SELECT balance FROM pos_wallets WHERE phone = ?', [kh39.sdt]))?.balance || 0;
    // soát vòng 1: đơn dùng mã "giảm 1 món" — trần đền một ly có topping = số khách trả thật (không trừ khoản giảm hai lần)
    const kg = await khach();
    const mg = await maChung('percent', 50, 'item', 931);
    const bg = await banTM([mon(TRA, 1, [[NEP, 2]])], { customer_phone: kg.sdt, discount_code: mg });
    const deng = (tien) => goi('chu', 'POST', '/pos/damages', { order_id: bg.j.order?.id, product_code: TRA.code, quantity: 1, reason: 'damaged', action: 'refund', refund_amount: tien });
    // tay: 45.000 + 2 × 10.000 = 65.000; mã giảm 1 món 50 % chỉ ly = 22.500 → khách trả 42.500
    const g1 = await deng(42501), g2 = await deng(42500);
    k('T28g mã "giảm 1 món" + topping: đơn 42.500; đền 42.501 → VUOT_GIA (ngay trên), đền 42.500 → qua (ngay dưới)', Number(bg.j.order?.total) === 42500
      && la(g1, 400, 'VUOT_GIA') && la(g2, 200), `${bg.j.order?.total} · ${moTa(g1)} · ${moTa(g2)}`);
    k('T39 HUỶ đơn (PUT /cancel — không phải duyệt hoàn refunds.js) có topping (HUY-1: hoàn toàn bộ đã trả vào tài khoản) → 65.000 (ly + topping)', la(b39, 200) && la(h39, 200) && vi1 - vi0 === 65000, `${moTa(b39)} · ${moTa(h39)} · ${vi1 - vi0}`);
  });

  muc('[C4] Hoá đơn · tem · phiếu pha chế · in lại đơn cũ');
  await chay('C4', async () => {
    const kv = await khachHang();
    const b = await banTM([mon(TRA, 2, [[NEP, 2]]), mon(CAM, 1)], { customer_phone: kv.sdt });
    const hd = (await goi('chu', 'GET', `/pos/hoa-don/${b.j.order?.id}`)).j.hoa_don;
    const m = hd?.mon || [];
    // tay: trà 2 ly gốc 90.000, hạng 40.500 × 2 = 81.000; nếp 4 phần gốc 40.000, hạng 9.000 × 4 = 36.000
    k('T09 dữ liệu hoá đơn: dòng topping trỏ ly (topping_cua), so_phan 2, giá gốc + giá hạng như món', m.length === 3 && m[1]?.topping_cua === 0 && m[1]?.so_phan === 2
      && m[1]?.thanh_tien_goc === 40000 && m[1]?.thanh_tien === 36000 && m[0]?.thanh_tien === 81000, JSON.stringify(m.map((x) => [x.ten, x.topping_cua, x.so_phan, x.thanh_tien])));
    k('T09b % hạng trên bill vẫn hiện (dòng topping không làm mất %)', hd?.khach?.phan_tram === 10, String(hd?.khach?.phan_tram));
    // Q4: % hạng của topping theo cờ nhóm đặc biệt của CHÍNH topping. Hạng thử 10 % / đặc biệt 20 %, nếp cẩm nhóm đặc biệt.
    const bac = Number((await ghiDb(`INSERT INTO pos_membership_tiers (name, card_price, discount_percent, special_discount_percent, sort_order, is_active, cach_co, goi)
      VALUES ('Bạc TP1', 0, 10, 20, 40, 1, 'ban', '[]')`)).lastInsertRowid);
    const kb = await khach();
    await ghiDb(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
      VALUES (?, ?, 'Bạc TP1', 0, NULL, ?, '2099-12-31T00:00:00')`, [kb.sdt, bac, getNow()]);
    await ghiDb('UPDATE pos_products SET is_special_group = 1 WHERE id = ?', [NEP.id]);
    const bd = await banTM([mon(TRA, 1, [[NEP, 1]])], { customer_phone: kb.sdt });
    await ghiDb('UPDATE pos_products SET is_special_group = 0 WHERE id = ?', [NEP.id]);
    const hdd = (await goi('chu', 'GET', `/pos/hoa-don/${bd.j.order?.id}`)).j.hoa_don;
    // tay: trà 45.000 × 90 % = 40.500; nếp 10.000 × 80 % = 8.000 → 48.500; bill in "10 %" theo ly
    k('T09d topping nhóm đặc biệt giảm % riêng (20 %: 8.000), ly 10 %; tổng 48.500; bill vẫn in % hạng của ly (10)', Number(bd.j.order?.total) === 48500
      && hdd?.mon?.[1]?.thanh_tien === 8000 && hdd?.khach?.phan_tram === 10, `${bd.j.order?.total} · ${JSON.stringify(hdd?.mon?.map((x) => x.thanh_tien))} · ${hdd?.khach?.phan_tram}`);
    const H = await import(pathToFileURL(path.join(KHACH_SRC, 'utils', 'hoaDon.js')).href);
    const to = H.dungHoaDon(hd, {});
    const dongTp = to.mon.find((x) => x.topping);
    k('T09c tờ hoá đơn: "+ Nếp cẩm TP1 x2" dưới ly, không in "sl x"', !!dongTp && dongTp.ten === '+ Nếp cẩm TP1 x2' && to.mon.indexOf(dongTp) === 1, JSON.stringify(to.mon.map((x) => [x.sl, x.ten, x.topping])));
    const P = await import(pathToFileURL(path.join(KHACH_SRC, 'utils', 'inPhieu.js')).href);
    const cfg = P.docBoIn({});
    for (const [nguon, don] of [['vừa tạo (POST)', b.j.order], ['in lại (GET /orders/:id)', (await goi('chu', 'GET', `/pos/orders/${b.j.order?.id}`)).j.order || (await goi('chu', 'GET', `/pos/orders/${b.j.order?.id}`)).j]]) {
      const tem = P.dungTem(don, {}, cfg);
      k(`T10 tem (${nguon}): 3 tem (2 trà + 1 cam), không tem cho topping; tem trà có "+ Nếp cẩm TP1 x2"`, tem.length === 3
        && tem.filter((x) => (x.topping || []).join() === '+ Nếp cẩm TP1 x2').length === 2 && !(tem[2].topping || []).length, JSON.stringify(tem.map((x) => [x.ten, x.topping])));
      const pc = P.dungPhieuPhaChe(don, {}, cfg);
      k(`T44 phiếu pha chế (${nguon}): 2 dòng, dòng trà có topping`, pc.dong.length === 2 && (pc.dong[0].topping || []).join() === '+ Nếp cẩm TP1 x2', JSON.stringify(pc.dong));
    }
    const pc2 = P.dungPhieuPhaChe({ code: 'X', items: [{ id: 1, product_id: 5, product_code: 'TRA', product_name: 'Trà', quantity: 1 },
      { id: 2, product_id: 6, product_code: 'NEP', product_name: 'Nếp', quantity: 1, dong_cha_id: 1 }, { id: 3, product_id: 5, product_code: 'TRA', product_name: 'Trà', quantity: 1 }] }, {}, cfg);
    k('T44b phiếu pha chế: hai ly cùng món, một có topping một không → hai dòng riêng', pc2.dong.length === 2 && pc2.dong.filter((d) => (d.topping || []).join() === '+ Nếp').length === 1,
      JSON.stringify(pc2.dong));
    const cu = await banTM([mon(CAM, 2)]);
    const hdCu = (await goi('chu', 'GET', `/pos/hoa-don/${cu.j.order?.id}`)).j.hoa_don;
    const toCu = H.dungHoaDon(hdCu, {});
    k('T11 đơn không topping: hoá đơn + tem y như cũ (2 tem, không dòng "+")', toCu.mon.length === 1 && !toCu.mon[0].topping && P.dungTem(cu.j.order, {}, cfg).length === 2);
  });

  muc('[D5] App KH: menu · báo giá · đơn = quầy · lỗi · lịch sử');
  await chay('D5', async () => {
    const menu = await goi(null, 'GET', '/kh/menu');
    const ds = menu.j.data || [];
    const tra = ds.find((x) => x.ma === maCua(TRA));
    const tLN = tra?.topping?.find((x) => x.ma === maCua(LN));
    k('T30 /api/kh/menu: món có topping[{ ma, ten, gia, gia_hang, con_hang }] + ghi_chu_nhanh[]', Array.isArray(tra?.topping) && tra.topping.length === 3
      && tra.topping[0].ma === maCua(NEP) && tra.topping[0].gia === 10000 && Array.isArray(tra.topping[0].gia_hang) && JSON.stringify(tra.ghi_chu_nhanh) === '["Ít đá","Không đá","Ít ngọt"]',
      JSON.stringify(tra?.topping?.[0]));
    k('T30b topping hết → con_hang: false (Long nhãn còn 1 vẫn true; hết lô thì false)', tLN?.con_hang === true, JSON.stringify(tLN));
    k('T30c topping không bán riêng không hiện như món; bán riêng hiện nhom "topping" giá bán riêng', !ds.some((x) => x.ma === maCua(THACH))
      && ds.find((x) => x.ma === maCua(NEP))?.nhom === 'topping' && ds.find((x) => x.ma === maCua(NEP))?.gia === 15000, JSON.stringify(ds.find((x) => x.ma === maCua(NEP))));
    k('T50 menu có topping_toi_da_phan = 3', menu.j.topping_toi_da_phan === 3, String(menu.j.topping_toi_da_phan));
    const kh = await khach();
    const than = { mon: [{ ma: maCua(TRA), so_luong: 2, topping: [{ ma: maCua(NEP), so_phan: 2 }] }, { ma: maCua(CAM), so_luong: 1 }], cach_nhan: 'tai_quan' };
    const bg = await goi(null, 'POST', '/kh/gio/bao-gia', than, kh.tk);
    const quay = await tongCua([mon(TRA, 2, [[NEP, 2]]), mon(CAM, 1)], { customer_phone: kh.sdt });
    k('T31 đơn App có topping = đơn quầy cùng giỏ (150.000đ)', la(bg, 200) && bg.j.tong === quay && quay === 150000, `${moTa(bg)} · ${bg.j.tong} · ${quay}`);
    const dTra = bg.j.dong?.[0], dCam = bg.j.dong?.[1];
    k('T32 báo giá App ghép đúng dòng: trà 90.000 + topping[{ so_phan 2, thanh_tien 40.000 }], cam 20.000', dTra?.thanh_tien === 90000 && dTra?.topping?.[0]?.thanh_tien === 40000
      && dTra?.topping?.[0]?.so_phan === 2 && dCam?.thanh_tien === 20000 && bg.j.dong.length === 2, JSON.stringify(bg.j.dong));
    const sai = await goi(null, 'POST', '/kh/gio/bao-gia', { mon: [{ ma: maCua(CAM), so_luong: 1, topping: [{ ma: maCua(NEP), so_phan: 1 }] }], cach_nhan: 'tai_quan' }, kh.tk);
    k('T33 App gửi topping ngoài danh sách món → 400 TOPPING_KHONG_CHO_MON', la(sai, 400, 'TOPPING_KHONG_CHO_MON'), moTa(sai));
    const qua = await goi(null, 'POST', '/kh/gio/bao-gia', { mon: [{ ma: maCua(TRA), so_luong: 1, topping: [{ ma: maCua(NEP), so_phan: 4 }] }], cach_nhan: 'tai_quan' }, kh.tk);
    k('T33b App so_phan 4 → 400 TOPPING_SO_PHAN', la(qua, 400, 'TOPPING_SO_PHAN'), moTa(qua));
    const rieng = await goi(null, 'POST', '/kh/gio/bao-gia', { mon: [{ ma: maCua(THACH), so_luong: 1 }], cach_nhan: 'tai_quan' }, kh.tk);
    k('T49 App đặt riêng topping không bán riêng → 400 (MON_KHONG_BAN)', rieng.status === 400, moTa(rieng));
    const het = await goi(null, 'POST', '/kh/gio/bao-gia', { mon: [{ ma: maCua(TRA), so_luong: 2, topping: [{ ma: maCua(LN), so_phan: 1 }] }], cach_nhan: 'tai_quan' }, kh.tk);
    k('T49b App topping không đủ (Long nhãn còn 1, cần 2) → HET_HANG', la(het, 400, 'HET_HANG'), moTa(het));
    // soát vòng 2: nhánh false của con_hang — bán phần Long nhãn cuối rồi đọc menu
    const banLN = await banTM([mon(TRA, 1, [[LN, 1]])]);
    const lnHet = ((await goi(null, 'GET', '/kh/menu')).j.data || []).find((x) => x.ma === maCua(TRA))?.topping?.find((x) => x.ma === maCua(LN));
    k('T30d topping hết (Long nhãn bán phần cuối) → /api/kh/menu con_hang: false', la(banLN, 200) && lnHet?.con_hang === false, `${moTa(banLN)} · ${JSON.stringify(lnHet)}`);
    // soát vòng 2: đơn ĐÃ trả của khách (đơn quầy có SĐT) — lịch sử App + chi tiết + hoá đơn App gom topping vào ly
    const bq = await banTM([mon(TRA, 2, [[NEP, 2]])], { customer_phone: kh.sdt });
    const xq = (await goi(null, 'GET', `/kh/don/${bq.j.order?.code}`, undefined, kh.tk)).j.don || {};
    const dsDonKh = ((await goi(null, 'GET', '/kh/don', undefined, kh.tk)).j.data || []).find((x) => x.ma === bq.j.order?.code);
    k('T35b đơn đã trả: so_mon = 2 ly (không đếm 4 phần topping) ở cả danh sách lẫn chi tiết', xq.so_mon === 2 && dsDonKh?.so_mon === 2, `${xq.so_mon} · ${dsDonKh?.so_mon}`);
    k('T35c chi tiết đơn đã trả: dòng trà mang topping[{ so_phan 2, thanh_tien 40.000 }], không dòng topping rời', xq.mon?.length === 1
      && xq.mon[0].topping?.[0]?.so_phan === 2 && xq.mon[0].topping[0].thanh_tien === 40000, JSON.stringify(xq.mon));
    k('T45 hoá đơn App (hoa_don[]): dòng "+ Nếp cẩm TP1 x2" không kèm "sl x"', (xq.hoa_don || []).some((d) => d.trai === '+ Nếp cẩm TP1 x2'),
      JSON.stringify((xq.hoa_don || []).filter((d) => d.loai === 'mon')));
    const dsQ = (await goi('chu', 'GET', '/pos/orders')).j.orders || [];
    k('T47b danh sách đơn quầy: item_count = 1 dòng (ly), không đếm dòng topping', dsQ.find((o) => o.id === bq.j.order?.id)?.item_count === 1,
      String(dsQ.find((o) => o.id === bq.j.order?.id)?.item_count));
    const cu = await goi(null, 'POST', '/kh/gio/bao-gia', { mon: [{ ma: maCua(CAM), so_luong: 1 }], cach_nhan: 'tai_quan' }, kh.tk);
    k('T31b App bản cũ (không gửi topping) vẫn báo giá như cũ', la(cu, 200) && cu.j.tong === 20000 && !('topping' in (cu.j.dong?.[0] || {})), JSON.stringify(cu.j.dong));
    const dat = await goi(null, 'POST', '/kh/don', { ...than, khoa_gui: 'tp1-' + ngauNhien().slice(0, 16), cach_tra: 'qr', tong_da_xem: bg.j.tong }, kh.tk);
    const maDon = dat.j.ma_don;
    const xem = maDon ? await goi(null, 'GET', `/kh/don/${maDon}`, undefined, kh.tk) : { j: {} };
    const ct = xem.j.don || {};
    k('T35 lịch sử App (đơn chờ trả): so_mon = 3 ly (không đếm topping), dòng trà mang topping', la(dat, 200) && ct.so_mon === 3
      && ct.mon?.[0]?.topping?.[0]?.so_phan === 2, `${moTa(dat)} · ${JSON.stringify({ so: ct.so_mon, mon: ct.mon })}`);
    const khoa = 'tp1-' + ngauNhien().slice(0, 16);
    const lan1 = await goi(null, 'POST', '/kh/don', { mon: [{ ma: maCua(CAM), so_luong: 1 }], cach_nhan: 'tai_quan', khoa_gui: khoa, cach_tra: 'qr', tong_da_xem: 20000 }, kh.tk);
    const lan2 = await goi(null, 'POST', '/kh/don', { mon: [{ ma: maCua(CAM), so_luong: 1 }], cach_nhan: 'tai_quan', khoa_gui: khoa, cach_tra: 'qr', tong_da_xem: 20000 }, kh.tk);
    k('T34 giỏ không topping gửi lại cùng khoá → cùng đơn (băm giỏ không đổi)', la(lan1, 200) && la(lan2, 200) && !!lan1.j.ma_don && lan1.j.ma_don === lan2.j.ma_don && lan2.j.trung === true, `${moTa(lan1)} · ${moTa(lan2)}`);
    const lan3 = await goi(null, 'POST', '/kh/don', { mon: [{ ma: maCua(TRA), so_luong: 1 }], cach_nhan: 'tai_quan', khoa_gui: khoa + 'x', cach_tra: 'qr', tong_da_xem: 45000 }, kh.tk);
    const lan4 = await goi(null, 'POST', '/kh/don', { mon: [{ ma: maCua(TRA), so_luong: 1, topping: [{ ma: maCua(NEP), so_phan: 1 }] }], cach_nhan: 'tai_quan', khoa_gui: khoa + 'x', cach_tra: 'qr', tong_da_xem: 55000 }, kh.tk);
    k('T34b cùng khoá nhưng giỏ khác topping → KHÔNG trả lại đơn cũ', la(lan3, 200) && !!lan3.j.ma_don && lan4.j.ma_don !== lan3.j.ma_don, `${moTa(lan3)} · ${moTa(lan4)}`);
  });

  muc('[K4] Đường song song: màn khách · đơn giao · sao lưu');
  await chay('K4', async () => {
    const mk = require(path.join(MAY_CHU, 'utils', 'manKhach.js'));
    const nd = typeof mk.noiDung === 'function' ? await mk.noiDung().catch(() => null) : null;
    const ten = JSON.stringify(nd?.menu || nd?.mon || nd || '');
    k('T46 màn khách: menu không liệt kê topping không bán riêng (Thạch)', !!nd && !ten.includes('Thạch TP1'), ten.slice(0, 200));
    const tep = await goi('chu', 'GET', '/pos/backup/export/pos_order_items', undefined, null, true);
    let cot = [];
    const tieuDe = (buf) => { try { const wb = XLSX.read(buf); return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 })[0] || []; } catch { return []; } };
    cot = tieuDe(tep.buf);
    const tepSp = await goi('chu', 'GET', '/pos/backup/export/pos_products', undefined, null, true);
    const cotSp = tieuDe(tepSp.buf);
    k('T04 sao lưu mang cột mới (dong_cha_id; la_topping, gia_ban_rieng, topping_cho_mon, ghi_chu_nhanh)', cot.includes('dong_cha_id')
      && ['la_topping', 'topping_cho_mon', 'ghi_chu_nhanh'].every((c) => cotSp.includes(c)), JSON.stringify(cot) + ' ' + JSON.stringify(cotSp));
    const gh = require(path.join(MAY_CHU, 'utils', 'giaoHang.js'));
    k('T47 đơn giao: số món tính giờ gọi tài xế không đếm topping (soMonDon)', typeof gh.soMonDon === 'function'
      && gh.soMonDon([{ quantity: 2, dong_cha_id: null }, { quantity: 4, dong_cha_id: 7 }, { quantity: 1 }]) === 3);
  });

  sv.close(); svGia.close();
  console.log(`\nTỔNG: ${dat} đạt · ${hong} hỏng · ${dat + hong} ca`);
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { noiLai(); console.error('BÀI SẬP:', e); process.exit(2); });
