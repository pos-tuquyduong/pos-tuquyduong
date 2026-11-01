#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KH-SDT-1 — công cụ dọn dữ liệu thử (chỉ chủ quán): liệt kê → tải danh sách → tải sao lưu → gõ DON DU LIEU THU → dọn
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có route /api/pos/don-thu, chưa có màn). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KHSDT1.js
 *  Máy chủ: database.js thật + libsql thật trên file kho TẠM, route thật qua HTTP. Dữ liệu mẫu gắn nhãn TỪNG DÒNG "phải xoá" (XOA) —
 *  bài tự là đáp án độc lập: mọi dòng KHÔNG nhãn của MỌI bảng phải còn nguyên từng cột sau khi dọn (E — K5).
 *  Giao diện: hàm thuần client/src/pages/QuanLy/donThu.js gọi thẳng; .jsx đọc nguồn. Bản đột biến: --goc <thư mục gốc kho>.
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const iG = process.argv.indexOf('--goc');
const GOC = iG > 0 ? path.resolve(process.argv[iG + 1]) : path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khsdt1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_khsdt1_nv_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_khsdt1_kh_' + Date.now();

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
const sach = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const X = '2026-09-01';   // ngày X: dọn mọi giao dịch có created_at < X
const T1 = '0912345678';  // số thử mồ côi (không hồ sơ) — dọn theo NGÀY
const T2 = '0900000002';  // số thử có hồ sơ — dọn theo DANH SÁCH SĐT
const K = '0900000003';   // khách thật ví 50.000 — có trong danh sách SĐT nhưng PHẢI giữ nguyên
const CON = '0900000005'; // con của K (K trả hộ) — đơn của con phải giữ
const R = '0900000004';   // khách thật ngoài danh sách, có hồ sơ từ trước X
const P6 = '0900000006';  // số có dòng cộng trước X, dòng trừ sau X → điểm âm nếu chỉ dọn theo ngày

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow, getToday } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  let coRoute = true;
  try { app.use('/api/pos/don-thu', require(path.join(GOC, 'server', 'routes', 'don-thu.js'))); } catch { coRoute = false; }
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos/don-thu`;
  const chu = await db.queryOne("SELECT id, username FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const nv = await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES ('nv_khsdt1', 'x', 'NV', 'staff', 1)");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  const tkNv = jwt.sign({ userId: nv.lastInsertRowid }, KHOA_NV, { expiresIn: '1h' });
  const goi = async (duong, than, token = tkChu) => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = 'Bearer ' + token;
    try {
      const r = await fetch(goc + duong, { method: 'POST', headers: h, body: JSON.stringify(than) });
      let j = {}; try { j = JSON.parse(await r.text()); } catch { /* không phải JSON */ }
      return { status: r.status, j };
    } catch (e) { return { status: 0, j: { loi: e.message } }; }
  };

  // ── dữ liệu mẫu: mỗi dòng gắn nhãn xoá / giữ ───────────────────────────────
  const XOA = new Set();
  const them = async (bangTen, o, xoa = false) => {
    const cot = Object.keys(o);
    const r = await db.run(`INSERT INTO ${bangTen} (${cot.join(', ')}) VALUES (${cot.map(() => '?').join(', ')})`, cot.map((c) => o[c]));
    const id = Number(r.lastInsertRowid);
    if (xoa) XOA.add(`${bangTen}:${id}`);
    return id;
  };
  const homNay = getNow();
  const don = (code, phone, luc, xoa, them2 = {}) => them('pos_orders', { code, customer_phone: phone, total: 50000, payment_method: 'cash', status: 'completed', created_at: luc, ...them2 }, xoa);
  const diem = (phone, points, luc, orderId, xoa, type = 'earn') => them('pos_point_transactions', { customer_phone: phone, type, points, order_id: orderId, created_at: luc, expires_at: '2027-12-31T23:59:59' }, xoa);

  // T1 — số mồ côi: mọi thứ trước X phải đi; dòng ĐÚNG ngày X và sau X phải ở lại
  const O1 = await don('ORD-20260806-751', T1, '2026-08-06T10:00:00', true);
  await them('pos_order_items', { order_id: O1, product_name: 'Trà', quantity: 1, unit_price: 50000, total_price: 50000 }, true);
  await them('pos_invoice_logs', { order_id: O1, order_code: 'ORD-20260806-751', invoice_number: 'HD1' }, true);
  await them('pos_order_log', { order_id: O1, loai: 'tao', luc: '2026-08-06T10:00:00' }, true);
  await them('pos_refund_requests', { order_id: O1, customer_phone: T1 }, true);
  await them('pos_damage_logs', { order_id: O1, product_code: 'TRA', quantity: 1, reason: 'vỡ', action: 'doi' }, true);
  await them('pos_promotion_usage', { promotion_id: 1, order_id: O1, customer_phone: T1 }, true);
  await them('pos_balance_transactions', { customer_phone: T1, type: 'payment', amount: -1, order_id: O1, created_at: '2026-08-06T10:00:00' }, true);
  await diem(T1, 500, '2026-08-06T10:00:00', O1, true);
  await them('pos_signup_codes', { code: 'TQDT1', order_id: O1, order_customer_phone: T1, claimed_at: '2026-08-07T09:00:00', claimed_phone: T1 }, true);
  await them('pos_discount_codes', { code: 'TQDT1', discount_type: 'fixed', discount_value: 10000 }, true);
  await diem(T1, -200, '2026-08-10T10:00:00', null, true, 'redeem');
  await them('pos_voucher_grants', { code: 'DDT1', customer_phone: T1, status: 'available', granted_at: '2026-08-10T10:00:00' }, true);
  await them('pos_discount_codes', { code: 'DDT1', discount_type: 'fixed', discount_value: 20000 }, true);
  await them('pos_kh_ma_dang_nhap', { sdt: T1, ma_bam: 'x', nguon: 'quay', tao_luc: '2026-08-06T10:00:00', het_han: '2026-08-06T10:05:00' }, true);
  await them('pos_kh_lan_thu', { loai: 'nhan_diem', sdt: T1, tao_luc: '2026-08-06T10:00:00' }, true);
  await don('ORD-20260831-001', null, '2026-08-31T23:59:59', true);   // ngay dưới X → xoá
  await don('ORD-20260901-001', null, X + 'T00:00:00', false);       // ĐÚNG X → giữ (so nhỏ hơn, không nhỏ hơn hoặc bằng)
  await diem(T1, 100, '2026-09-15T10:00:00', null, false, 'adjust');  // sau X → giữ
  await them('pos_kh_ma_dang_nhap', { sdt: T1, ma_bam: 'y', nguon: 'quay', tao_luc: '2026-09-15T10:00:00', het_han: '2026-09-15T10:05:00' }, false);

  // T2 — số thử có hồ sơ, dọn theo danh sách: mọi bảng; đơn HÔM NAY giữ (và dòng gắn đơn đó giữ)
  await them('pos_customers', { phone: T2, name: 'Thử 2', created_at: '2026-10-20T08:00:00' }, true);
  await them('pos_wallets', { phone: T2, balance: 0, total_topup: 100000, total_spent: 100000 }, true);
  await them('pos_balance_transactions', { customer_phone: T2, type: 'topup', amount: 100000, created_at: '2026-10-20T08:00:00' }, true);
  const O2 = await don('ORD-20261020-001', T2, '2026-10-20T09:00:00', true);
  await them('pos_order_items', { order_id: O2, product_name: 'Gói', quantity: 1, unit_price: 100000, total_price: 100000 }, true);
  await them('pos_balance_transactions', { customer_phone: T2, type: 'payment', amount: -100000, order_id: O2, created_at: '2026-10-20T09:00:00' }, true);
  await diem(T2, 1000, '2026-10-20T09:00:00', O2, true);
  const GOI2 = await them('pos_customer_packages', { customer_phone: T2, package_id: 1, order_id: O2, total_qty: 10, created_at: '2026-10-20T09:00:00' }, true);
  await them('pos_membership_purchases', { customer_phone: T2, tier_id: 1, tier_name: 'Vàng', order_id: O2, purchased_at: '2026-10-20T09:00:00', expires_at: '2027-10-20T09:00:00' }, true);
  await them('pos_registrations', { phone: T2, name: 'Thử 2' }, true);
  await them('pos_kh_ma_dang_nhap', { sdt: T2, ma_bam: 'z', nguon: 'gui', tao_luc: '2026-10-21T08:00:00', het_han: '2026-10-21T08:05:00' }, true);
  await them('pos_voucher_grants', { code: 'DDT2', customer_phone: T2, status: 'used', granted_at: '2026-10-21T08:00:00' }, true);
  await them('pos_discount_codes', { code: 'DDT2', discount_type: 'fixed', discount_value: 20000 }, true);
  const O8 = await don('ORD-HOMNAY-T2', T2, homNay, false, { customer_package_id: GOI2 });   // hôm nay → giữ; gói trỏ tới bị xoá → NULL
  await diem(T2, 50, homNay, O8, false);

  // K — khách thật ví ≠ 0, CÓ trong danh sách SĐT: không một dòng nào của K bị đụng, kể cả trước X
  await them('pos_customers', { phone: K, name: 'Khách thật', created_at: '2026-07-01T08:00:00' });
  await them('pos_wallets', { phone: K, balance: 50000, total_topup: 50000 });
  await them('pos_balance_transactions', { customer_phone: K, type: 'topup', amount: 50000, created_at: '2026-07-01T08:00:00' });
  const O3 = await don('ORD-20260820-001', K, '2026-08-20T10:00:00', false);
  await diem(K, 500, '2026-08-20T10:00:00', O3, false);
  await them('pos_voucher_grants', { code: 'DDK', customer_phone: K, status: 'available', granted_at: '2026-08-21T10:00:00' });
  await them('pos_discount_codes', { code: 'DDK', discount_type: 'fixed', discount_value: 20000 });
  await don('ORD-20260809-001', CON, '2026-08-09T10:00:00', false, { parent_phone: K });   // K trả hộ con → giữ

  // R — khách thật ngoài danh sách: hồ sơ / ví / sổ ví / gói / thẻ giữ dù trước X; dòng điểm không gắn đơn trước X thì dọn
  await them('pos_customers', { phone: R, name: 'Khách R', created_at: '2026-08-01T08:00:00' });
  await them('pos_wallets', { phone: R, balance: 0 });
  await them('pos_balance_transactions', { customer_phone: R, type: 'topup', amount: 0, created_at: '2026-08-02T08:00:00' });
  await diem(R, 100, '2026-08-03T08:00:00', null, true, 'bonus');
  await them('pos_customer_packages', { customer_phone: R, package_id: 1, total_qty: 5, created_at: '2026-08-04T08:00:00' });
  await them('pos_membership_purchases', { customer_phone: R, tier_id: 1, tier_name: 'Vàng', purchased_at: '2026-08-04T08:00:00', expires_at: '2027-08-04T08:00:00' });
  const O4 = await don('ORD-20261015-001', R, '2026-10-15T10:00:00', false);
  await diem(R, 500, '2026-10-15T10:00:00', O4, false);
  await them('pos_voucher_grants', { code: 'DDR', customer_phone: R, status: 'available', granted_at: '2026-10-16T10:00:00' });
  await them('pos_discount_codes', { code: 'DDR', discount_type: 'fixed', discount_value: 20000 });
  await them('pos_signup_codes', { code: 'TQDT2', order_id: O4, order_customer_phone: R, claimed_at: '2026-10-16T09:00:00', claimed_phone: T2 }, true);   // mã trên bill R, số thử T2 nhận
  await them('pos_discount_codes', { code: 'TQDT2', discount_type: 'fixed', discount_value: 10000 }, true);

  // Đơn không SĐT: có phiên thanh toán (tiền ngân hàng) → giữ; thường → xoá; hôm nay → giữ
  const O5 = await don('ORD-20260807-001', null, '2026-08-07T10:00:00', false, { payment_method: 'transfer' });
  await them('pos_phien_thanh_toan', { than: '{}', tong: 50000, con_lai: 0, cach: 'qr', het_han: '2026-08-07T10:15:00', order_id: O5, nguoi_tao: 'x', tao_luc: '2026-08-07T10:00:00', trang_thai: 'da_thu' });
  const O6 = await don('ORD-20260808-001', null, '2026-08-08T10:00:00', true);
  await them('pos_order_items', { order_id: O6, product_name: 'Nước', quantity: 2, unit_price: 25000, total_price: 50000 }, true);
  await don('ORD-HOMNAY-LE', null, homNay, false);

  // P6 — dòng cộng trước X (đi theo ngày), dòng trừ sau X (ở lại) → điểm âm nếu không có P6 trong danh sách
  await diem(P6, 300, '2026-08-05T10:00:00', null, true);
  await diem(P6, -300, '2026-10-05T10:00:00', null, true, 'redeem');

  const tatBang = (await db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")).map((r) => r.name);
  const chup = async () => {
    const o = {};
    for (const t of tatBang) o[t] = await db.query(`SELECT * FROM ${t} ORDER BY rowid`);
    return o;
  };
  const bam = (o) => crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
  const demXoa = (t) => [...XOA].filter((x) => x.startsWith(t + ':')).length;
  noiLai();

  muc('[D0] Có route /api/pos/don-thu');
  k('D0 nạp được server/routes/don-thu.js', coRoute);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D9] Chỉ chủ quán');
  {
    imLang();
    const a = await goi('/liet-ke', { truoc_ngay: X }, tkNv);
    const b = await goi('/don', { truoc_ngay: X, ma_xac_nhan: 'x', go_xac_nhan: 'DON DU LIEU THU' }, tkNv);
    const c = await goi('/liet-ke', { truoc_ngay: X }, null);
    const d = await goi('/don', { truoc_ngay: X }, null);
    noiLai();
    k('D9 nhân viên liệt kê → 403 CHI_CHU_QUAN', a.status === 403 && a.j.code === 'CHI_CHU_QUAN', `${a.status} ${JSON.stringify(a.j)}`);
    k('D9 nhân viên dọn → 403 CHI_CHU_QUAN', b.status === 403 && b.j.code === 'CHI_CHU_QUAN', `${b.status}`);
    k('D9 không token → 401 cả hai route', c.status === 401 && d.status === 401, `${c.status}/${d.status}`);
  }

  muc('[D8] Tiêu chí sai → 400, không ghi gì');
  {
    const truoc = bam(await chup());
    imLang();
    const homNayNgay = getToday();
    const mai = new Date(Date.parse(homNayNgay + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
    const r1 = await goi('/liet-ke', { truoc_ngay: homNayNgay });
    const r2 = await goi('/liet-ke', { truoc_ngay: mai });
    const r3 = await goi('/liet-ke', { truoc_ngay: '2026-13-01' });
    const r4 = await goi('/liet-ke', { truoc_ngay: 'abc' });
    const r5 = await goi('/liet-ke', {});
    const r6 = await goi('/liet-ke', { sdt: [] });
    const r7 = await goi('/liet-ke', { sdt: ['abc'] });
    const r8 = await goi('/don', { truoc_ngay: homNayNgay, ma_xac_nhan: 'x', go_xac_nhan: 'DON DU LIEU THU' });
    noiLai();
    k('D8 ngày X = hôm nay → 400 NGAY_KHONG_HOP_LE', r1.status === 400 && r1.j.code === 'NGAY_KHONG_HOP_LE', `${r1.status} ${JSON.stringify(r1.j)}`);
    k('D8 ngày X = mai → 400 NGAY_KHONG_HOP_LE', r2.status === 400 && r2.j.code === 'NGAY_KHONG_HOP_LE', `${r2.status}`);
    k('D8 ngày sai dạng (tháng 13 / chữ) → 400 NGAY_KHONG_HOP_LE', r3.status === 400 && r3.j.code === 'NGAY_KHONG_HOP_LE' && r4.status === 400 && r4.j.code === 'NGAY_KHONG_HOP_LE', `${r3.status}/${r4.status}`);
    k('D8 không tiêu chí / danh sách rỗng → 400 TIEU_CHI_TRONG', r5.status === 400 && r5.j.code === 'TIEU_CHI_TRONG' && r6.status === 400 && r6.j.code === 'TIEU_CHI_TRONG', `${r5.status}/${r6.status}`);
    k('D8 SĐT sai dạng → 400 SDT_KHONG_HOP_LE', r7.status === 400 && r7.j.code === 'SDT_KHONG_HOP_LE', `${r7.status}`);
    k('D8 dọn với ngày X = hôm nay → 400 (cùng kiểm tiêu chí)', r8.status === 400 && r8.j.code === 'NGAY_KHONG_HOP_LE', `${r8.status}`);
    k('D8 không ghi gì', truoc === bam(await chup()));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D1] Liệt kê theo ngày X');
  const truocD1 = bam(await chup());
  imLang();
  const l1 = await goi('/liet-ke', { truoc_ngay: X });
  noiLai();
  const ma = (l) => (l.j.don || []).map((d) => d.code).sort();
  {
    k('D1 200', l1.status === 200, `${l1.status} ${JSON.stringify(l1.j).slice(0, 200)}`);
    k('D1 đơn trước X: đúng O1, 31/08 23:59:59, O6 (không đơn đúng X, không đơn của K / con K, không đơn có phiên, không đơn hôm nay)',
      bang(ma(l1), ['ORD-20260806-751', 'ORD-20260808-001', 'ORD-20260831-001']), JSON.stringify(ma(l1)));
    const sd = l1.j.so_dong || {};
    k('D1 dòng gắn đơn đi theo đơn (chi tiết 2, nhật ký đơn, hoá đơn, hoàn, hỏng, khuyến mãi, sổ ví theo đơn)',
      sd.pos_order_items === 2 && sd.pos_order_log === 1 && sd.pos_invoice_logs === 1 && sd.pos_refund_requests === 1 && sd.pos_damage_logs === 1
      && sd.pos_promotion_usage === 1 && sd.pos_balance_transactions === 1, JSON.stringify(sd));
    k('D1 điểm trước X: O1 +500, T1 −200, R +100, P6 +300 (không dòng sau X, không dòng của K)', sd.pos_point_transactions === 4, String(sd.pos_point_transactions));
    k('D1 voucher trước X: chỉ của T1 (K giữ) + mã giảm của voucher và mã bill đơn O1', sd.pos_voucher_grants === 1 && sd.pos_discount_codes === 2 && sd.pos_signup_codes === 1, JSON.stringify(sd));
    k('D1 mã đăng nhập / lần thử App trước X', sd.pos_kh_ma_dang_nhap === 1 && sd.pos_kh_lan_thu === 1, JSON.stringify(sd));
    k('D1 theo ngày KHÔNG chạm hồ sơ khách, ví, gói / thẻ không gắn đơn', !sd.pos_customers && !sd.pos_wallets && !sd.pos_customer_packages && !sd.pos_membership_purchases, JSON.stringify(sd));
    k('D1 tổng tiền = tổng đơn sẽ dọn (3 × 50.000)', l1.j.tong_tien === 150000, String(l1.j.tong_tien));
    k('D1 không bao giờ dọn sổ tiền / kho / phiên / đơn App', ['pos_doi_soat_ghi', 'pos_payos_su_kien', 'pos_phien_thanh_toan', 'pos_don_app', 'pos_nhat_ky_pin', 'pos_stock_pending', 'pos_products', 'pos_settings', 'pos_users', 'pos_sync_logs'].every((t) => !sd[t]));
  }
  muc('[D3] Giữ lại: ví ≠ 0, đơn có phiên thanh toán');
  {
    const gd = (l1.j.giu_lai && l1.j.giu_lai.don) || [];
    k('D3 đơn có phiên thanh toán → giữ lại, có lý do', gd.some((d) => d.code === 'ORD-20260807-001' && d.ly_do), JSON.stringify(gd));
    k('D3 đơn K trả hộ con (ví K ≠ 0) → giữ lại', gd.some((d) => d.code === 'ORD-20260809-001' && d.ly_do), JSON.stringify(gd));
    k('D3 đơn của K (ví ≠ 0) trước X → giữ lại', gd.some((d) => d.code === 'ORD-20260820-001'), JSON.stringify(gd));
    k('D3 ví ≠ 0 của K liệt kê riêng kèm số dư', ((l1.j.giu_lai && l1.j.giu_lai.vi) || []).some((v) => v.phone === K && Number(v.balance) === 50000), JSON.stringify(l1.j.giu_lai && l1.j.giu_lai.vi));
  }
  muc('[D10] Điểm âm → báo + từ chối dọn');
  {
    const da = l1.j.diem_am || [];
    k('D10 P6 (cộng trước X, trừ sau X) → diem_am có P6 còn −300', da.length === 1 && da[0].phone === P6 && Number(da[0].con_lai) === -300, JSON.stringify(da));
    k('D10 không báo oan: T1 còn +100 sau X, R còn +500 → không âm', !da.some((d) => d.phone === T1 || d.phone === R));
    imLang();
    const r = await goi('/don', { truoc_ngay: X, ma_xac_nhan: l1.j.ma_xac_nhan, go_xac_nhan: 'DON DU LIEU THU' });
    noiLai();
    k('D10 dọn khi có điểm âm → 409 DIEM_AM', r.status === 409 && r.j.code === 'DIEM_AM', `${r.status} ${JSON.stringify(r.j).slice(0, 160)}`);
  }
  muc('[D4] Liệt kê không ghi gì');
  k('D4 kho trước = sau (liệt kê + dọn bị từ chối)', truocD1 === bam(await chup()));

  muc('[D2] Liệt kê theo danh sách SĐT');
  {
    imLang();
    const l2 = await goi('/liet-ke', { sdt: [' 0900 000 002 ', K] });
    noiLai();
    const sd = l2.j.so_dong || {};
    k('D2 200, SĐT chuẩn hoá (khoảng trắng bỏ), K không nằm trong danh sách dọn', l2.status === 200 && bang(l2.j.sdt, [T2]), `${l2.status} ${JSON.stringify(l2.j.sdt)}`);
    k('D2 đơn: chỉ O2 (đơn hôm nay của T2 giữ, đơn số khác không vào)', bang(ma(l2), ['ORD-20261020-001']), JSON.stringify(ma(l2)));
    k('D2 đủ mọi bảng của T2: hồ sơ, ví 0, sổ ví 2, điểm 1 (không dòng của đơn hôm nay), gói, thẻ, đăng ký, mã App, voucher, mã bill đã nhận',
      sd.pos_customers === 1 && sd.pos_wallets === 1 && sd.pos_balance_transactions === 2 && sd.pos_point_transactions === 1 && sd.pos_customer_packages === 1
      && sd.pos_membership_purchases === 1 && sd.pos_registrations === 1 && sd.pos_kh_ma_dang_nhap === 1 && sd.pos_voucher_grants === 1
      && sd.pos_signup_codes === 1 && sd.pos_discount_codes === 2, JSON.stringify(sd));
    k('D2 ví K liệt kê ở giữ lại', ((l2.j.giu_lai && l2.j.giu_lai.vi) || []).some((v) => v.phone === K));
  }

  // ═════════════════════════════════════════════════════════════════════════
  const TC = { truoc_ngay: X, sdt: [T2, K, P6] };
  muc('[D5] Dọn: chữ xác nhận, mã xác nhận, dữ liệu đổi giữa hai bước');
  let l3;
  {
    imLang();
    l3 = await goi('/liet-ke', TC);
    noiLai();
    k('D5 (điều kiện) liệt kê đủ tiêu chí: không còn điểm âm', l3.status === 200 && (l3.j.diem_am || []).length === 0 && !!l3.j.ma_xac_nhan, JSON.stringify(l3.j.diem_am));
    const truoc = bam(await chup());
    imLang();
    const a = await goi('/don', { ...TC, ma_xac_nhan: l3.j.ma_xac_nhan });
    const b = await goi('/don', { ...TC, ma_xac_nhan: l3.j.ma_xac_nhan, go_xac_nhan: 'don du lieu thu' });
    const c = await goi('/don', { ...TC, ma_xac_nhan: 'abc', go_xac_nhan: 'DON DU LIEU THU' });
    const d = await goi('/don', { ...TC, go_xac_nhan: 'DON DU LIEU THU' });
    noiLai();
    k('D5 thiếu chữ xác nhận → 400 CHU_XAC_NHAN_SAI', a.status === 400 && a.j.code === 'CHU_XAC_NHAN_SAI', `${a.status}`);
    k('D5 chữ thường → 400 CHU_XAC_NHAN_SAI (gõ đúng nguyên chữ)', b.status === 400 && b.j.code === 'CHU_XAC_NHAN_SAI', `${b.status}`);
    k('D5 sai mã xác nhận → 409 DANH_SACH_DA_DOI', c.status === 409 && c.j.code === 'DANH_SACH_DA_DOI', `${c.status}`);
    k('D5 thiếu mã xác nhận → 409 DANH_SACH_DA_DOI', d.status === 409 && d.j.code === 'DANH_SACH_DA_DOI', `${d.status}`);
    k('D5 kho không đổi', truoc === bam(await chup()));
    // dữ liệu mới xuất hiện giữa liệt kê và dọn
    imLang();
    await don('ORD-20260811-001', null, '2026-08-11T10:00:00', true);
    const e = await goi('/don', { ...TC, ma_xac_nhan: l3.j.ma_xac_nhan, go_xac_nhan: 'DON DU LIEU THU' });
    noiLai();
    k('D5 có đơn mới thuộc tiêu chí sau khi liệt kê → 409 DANH_SACH_DA_DOI, không xoá gì', e.status === 409 && e.j.code === 'DANH_SACH_DA_DOI', `${e.status}`);
  }

  muc('[D11] Một giao dịch: hỏng giữa chừng → không xoá dòng nào');
  {
    imLang();
    l3 = await goi('/liet-ke', TC);
    const truoc = bam(await chup());
    await db.run('ALTER TABLE pos_sync_logs RENAME TO pos_sync_logs_tam');
    const r = await goi('/don', { ...TC, ma_xac_nhan: l3.j.ma_xac_nhan, go_xac_nhan: 'DON DU LIEU THU' });
    await db.run('ALTER TABLE pos_sync_logs_tam RENAME TO pos_sync_logs');
    const sau = bam(await chup());
    noiLai();
    k('D11 ghi nhật ký hỏng → không 200', r.status >= 500, `${r.status}`);
    k('D11 không xoá dòng nào', truoc === sau);
  }

  muc('[D6] Dọn đúng → đúng số dòng đã liệt kê + nhật ký đủ');
  const trc = await chup();
  imLang();
  const r6 = await goi('/don', { ...TC, ma_xac_nhan: l3.j.ma_xac_nhan, go_xac_nhan: 'DON DU LIEU THU' });
  noiLai();
  const sau = await chup();
  {
    k('D6 200, da_don = tổng dòng đã liệt kê = số dòng bài gắn nhãn xoá', r6.status === 200 && r6.j.da_don === l3.j.tong_dong && r6.j.da_don === XOA.size,
      `${r6.status} da_don=${r6.j.da_don} liệt kê=${l3.j.tong_dong} nhãn=${XOA.size}`);
    const sai = tatBang.filter((t) => ((r6.j.so_dong || {})[t] || 0) !== demXoa(t));
    k('D6 từng bảng: số dòng xoá = số dòng gắn nhãn', sai.length === 0, sai.map((t) => `${t} ${(r6.j.so_dong || {})[t] || 0}≠${demXoa(t)}`).join(', '));
    const conNhan = [...XOA].filter((x) => { const [t, id] = x.split(':'); return (sau[t] || []).some((r) => Number(r.id) === Number(id)); });
    k('D6 mọi dòng gắn nhãn xoá đã đi', conNhan.length === 0, conNhan.join(', '));
    const nk = (sau.pos_sync_logs || []).filter((r) => r.type === 'don_thu');
    let ct = {}; try { ct = JSON.parse(nk[0] && nk[0].details); } catch { /* hỏng */ }
    k('D6 đúng MỘT dòng nhật ký don_thu, có người + lúc (giờ VN) + số dòng', nk.length === 1 && nk[0].created_by === chu.username && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(String(nk[0].created_at)) && Number(nk[0].record_count) === XOA.size,
      JSON.stringify(nk.map((r) => ({ ...r, details: undefined }))));
    k('D6 nhật ký có tiêu chí + số dòng từng bảng', !!ct.tieu_chi && ct.tieu_chi.truoc_ngay === X && bang(ct.tieu_chi.sdt, [T2, P6]) && bang(ct.so_dong, r6.j.so_dong), JSON.stringify(ct.tieu_chi));
    const goc1 = (trc.pos_orders || []).find((r) => r.code === 'ORD-20260806-751');
    const chup1 = ((ct.ban_chup || {}).pos_orders || []).find((r) => r.code === 'ORD-20260806-751');
    k('D6 bản chụp giữ NGUYÊN dòng đã xoá (mọi cột)', !!goc1 && bang(chup1, goc1), JSON.stringify(chup1));
    k('D6 bản chụp có đủ mọi dòng đã xoá', Object.values(ct.ban_chup || {}).reduce((s, a) => s + a.length, 0) === XOA.size);
    k('D6 trả bản chụp cho màn hình tải về', bang(r6.j.ban_chup, ct.ban_chup));
  }
  muc('[E] K5 — dòng ngoài tiêu chí còn nguyên từng cột');
  {
    const lech = [];
    for (const t of tatBang) {
      const mong = (trc[t] || []).filter((r) => !XOA.has(`${t}:${r.id}`)).map((r) => (t === 'pos_orders' && Number(r.id) === O8 ? { ...r, customer_package_id: null } : r));
      const that = (sau[t] || []).filter((r) => !(t === 'pos_sync_logs' && r.type === 'don_thu'));
      if (!bang(mong, that)) lech.push(t);
    }
    k('E1 mọi bảng: dòng KHÔNG gắn nhãn trước = sau (hồ sơ, ví, sổ ví, điểm, voucher, gói, thẻ của K / R / con K; sản phẩm, cài đặt…)', lech.length === 0, lech.join(', '));
    const o8 = (sau.pos_orders || []).find((r) => Number(r.id) === O8);
    k('E2 đơn hôm nay giữ, gói của nó bị dọn → customer_package_id NULL (như xoá đơn)', !!o8 && o8.customer_package_id === null, JSON.stringify(o8 && o8.customer_package_id));
    const tien = (o) => (o.pos_orders || []).filter((r) => !XOA.has(`pos_orders:${r.id}`)).reduce((s, r) => s + Number(r.total), 0);
    k('E2 tổng tiền các đơn KHÔNG dọn bằng nhau trước–sau', tien(trc) === tien(sau));
    k('E2 hồ sơ khách R (trước X, ngoài danh sách) còn', (sau.pos_customers || []).some((r) => r.phone === R));
  }

  muc('[D7] Chạy lại → không còn gì');
  {
    const truoc = bam(await chup());
    imLang();
    const l = await goi('/liet-ke', TC);
    const r = await goi('/don', { ...TC, ma_xac_nhan: l.j.ma_xac_nhan, go_xac_nhan: 'DON DU LIEU THU' });
    noiLai();
    k('D7 liệt kê lại → 0 dòng', l.status === 200 && l.j.tong_dong === 0, `${l.status} ${l.j.tong_dong}`);
    k('D7 dọn lại → 200 da_don 0, không nhật ký mới, kho không đổi', r.status === 200 && r.j.da_don === 0 && truoc === bam(await chup()), `${r.status} ${JSON.stringify(r.j).slice(0, 120)}`);
  }
  sv.close();

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D12] Màn hình: hàm thuần + nguồn');
  let M = {};
  try { M = await import(pathToFileURL(path.join(GOC, 'client', 'src', 'pages', 'QuanLy', 'donThu.js')).href); } catch { M = {}; }
  const f = (ten) => (typeof M[ten] === 'function' ? M[ten] : () => undefined);
  {
    const svDt = (() => { try { return require(path.join(GOC, 'server', 'utils', 'donThu.js')); } catch { return {}; } })();
    k('D12 chữ xác nhận màn hình = máy chủ = "DON DU LIEU THU"', M.CHU_XAC_NHAN === 'DON DU LIEU THU' && svDt.CHU_XAC_NHAN === M.CHU_XAC_NHAN, `${M.CHU_XAC_NHAN}/${svDt.CHU_XAC_NHAN}`);
    k('D12 đọc ô SĐT: tách dòng / dấu phẩy, bỏ khoảng trắng, bỏ dòng trống', bang(f('docDanhSachSdt')('0900 000 002\n\n 0900000003 , 0900000006'), [T2, K, P6]));
    const kq = { tong_dong: 5, diem_am: [], don: [{ code: 'ORD-A', created_at: '2026-08-06T10:00:00', customer_phone: T1, total: 50000 }],
      sdt: [T2], so_dong: { pos_orders: 1 }, giu_lai: { vi: [{ phone: K, balance: 50000 }], don: [{ code: 'ORD-B', ly_do: 'có phiên' }] } };
    const csv = String(f('dungCsv')(kq) || '');
    k('D12 CSV có đơn (mã, ngày, SĐT, tiền), SĐT dọn, số dòng từng bảng, phần giữ lại', ['ORD-A', '2026-08-06T10:00:00', T1, '50000', T2, 'pos_orders', K, 'ORD-B', 'có phiên'].every((x) => csv.includes(x)), csv.slice(0, 200));
    const du = { ketQua: kq, daTaiDs: true, daTaiSaoLuu: true, go: 'DON DU LIEU THU' };
    const mo = f('moNutDon');
    k('D12 nút Dọn mở khi đủ điều kiện', mo(du) === true);
    k('D12 nút Dọn ĐÓNG khi thiếu một điều kiện (chưa liệt kê · 0 dòng · điểm âm · chưa tải danh sách · chưa tải sao lưu · gõ sai)', [
      { ...du, ketQua: null }, { ...du, ketQua: { ...kq, tong_dong: 0 } }, { ...du, ketQua: { ...kq, diem_am: [{ phone: P6 }] } },
      { ...du, daTaiDs: false }, { ...du, daTaiSaoLuu: false }, { ...du, go: 'DON DU LIEU THU ' }].every((x) => mo(x) === false));
    const dt = sach(doc('client/src/pages/DonThu.jsx'));
    k('D12 màn gọi liệt kê + dọn qua api (không fetch trần)', /api\.post\(\s*'\/don-thu\/liet-ke'/.test(dt) && /api\.post\(\s*'\/don-thu\/don'/.test(dt) && !/\bfetch\s*\(/.test(dt));
    k('D12 màn có nút tải sao lưu toàn bộ (/backup/export-all) và đánh dấu đã tải', /api\.download\(\s*'\/backup\/export-all'/.test(dt) && /setDaTaiSaoLuu\(\s*true\s*\)/.test(dt));
    k('D12 màn dùng moNutDon cho nút Dọn và tải bản chụp sau khi dọn', /disabled=\{!moNutDon\(/.test(dt) && /ban_chup/.test(dt));
    k('D12 đổi tiêu chí → bỏ kết quả + bỏ dấu đã tải', /setKetQua\(null\)/.test(dt) && /setDaTaiDs\(false\)/.test(dt) && /setDaTaiSaoLuu\(false\)/.test(dt));
    const ql = sach(doc('client/src/pages/QuanLy/QuanLy.jsx'));
    k("D12 Quản lý: ô Dọn dữ liệu thử chỉ hiện với owner", /role\s*===\s*'owner'\s*&&[\s\S]{0,400}to="\/don-thu"/.test(ql));
    k('D12 App.jsx có route /don-thu tới DonThu', /path="don-thu"\s+element=\{<DonThu\s*\/>\}/.test(doc('client/src/App.jsx')));
    k('D12 server/index.js mount /api/pos/don-thu', /app\.use\('\/api\/pos\/don-thu', require\('\.\/routes\/don-thu'\)\)/.test(doc('server/index.js')));
  }

  console.log(`\nSỐ CA: ${dat + hong}`);
  console.log(`${dat} đạt · ${hong} hỏng`);
  fs.rmSync(THU_MUC, { recursive: true, force: true });
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { noiLai(); console.log(`  ${C.do}✗ bài thử sập — ${e.stack || e.message}${C.het}`); console.log(`${dat} đạt · ${hong + 1} hỏng`); process.exit(1); });
