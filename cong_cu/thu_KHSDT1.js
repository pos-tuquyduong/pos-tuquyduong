#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KH-SDT-1 — công cụ dọn dữ liệu thử (chỉ chủ quán): liệt kê → tải danh sách → tải sao lưu → gõ DON DU LIEU THU → dọn
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có route /api/pos/don-thu, chưa có màn). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KHSDT1.js
 *  Máy chủ: database.js thật + libsql thật (khoá ngoại BẬT) trên file kho TẠM, route thật qua HTTP. Dữ liệu mẫu gắn nhãn TỪNG DÒNG
 *  "phải xoá" (XOA) — bài tự là đáp án độc lập: mọi dòng KHÔNG nhãn của MỌI bảng còn nguyên từng cột sau khi dọn, trừ đúng các
 *  cột bù ghi sẵn (trả lượt mã). Sổ ví dùng loại dòng THẬT (topup / purchase — wallets.js LOAI_TINH_VAO_VI) để đối soát I4 có nghĩa;
 *  đối soát (utils/doiSoat.js chayDoiSoat) chạy trước–sau, không được thêm dòng lệch nào. Sao lưu export-all phải chạy được sau dọn.
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
const T2 = '0900000002';  // số thử có hồ sơ — dọn theo DANH SÁCH SĐT, xoá sạch
const T3 = '0900000007';  // trong danh sách nhưng có đơn hôm nay → giữ CẢ SỐ (không xoá nửa chừng)
const K = '0900000003';   // khách thật ví 50.000 — có trong danh sách SĐT nhưng PHẢI giữ nguyên
const CON = '0900000005'; // con của K (K trả hộ) — đơn của con phải giữ
const R = '0900000004';   // khách thật ngoài danh sách: trả bằng ví, gói không gắn đơn
const P6 = '0900000006';  // dòng cộng trước X, dòng trừ sau X → điểm âm nếu chỉ dọn theo ngày
const P7 = '0900000008';  // như P6 nhưng lô điểm ĐÃ HẾT HẠN → không âm (không chặn oan)
const PM = '0900000009';  // trong danh sách, trả hộ đơn của CON2 (ngoài danh sách) → giữ cả số
const CON2 = '0900000010';
const B = '0900000016';   // khách thật ngoài danh sách nhận mã bill in trên đơn thử → điểm + mã của B phải còn (soát vòng 2, lỗi 1)
const CM = '0900000011';  // trong danh sách, chỉ có dòng điểm mồ côi (đơn đã bị xoá ở quầy) → dọn được (lỗi 3)
const G = '0900000012';   // trong danh sách, gói không gắn đơn đang được đơn của số khác dùng → giữ cả số (lỗi 4)
const M2 = '0900000014';  // trong danh sách, là mẹ của khách 0900000015 (ngoài danh sách) → giữ cả số (lỗi 5)
const T4 = '0900000017';  // trong danh sách, nạp ví tiền mặt rơi vào két ĐÃ ĐẾM từ ngày X → giữ cả số (Q9)
const T5 = '0900000018';  // đơn tiền mặt trước X, két 31/08 (< X): theo ngày → dọn + liệt kê két; chỉ theo SĐT (không X) → giữ (Q9)
const KET = ['2026-08-01', '2026-08-06', '2026-08-31', X, '2026-09-02', '2026-09-05'];   // ngày đã đếm két (sổ đối soát KHÔNG dọn)
const SO_DON_LON = 40;  // đơn thử có ghi chú dài — bản chụp vượt trần một ô Excel (32767 ký tự)

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow, getToday } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  const { chayDoiSoat } = require(path.join(GOC, 'server', 'utils', 'doiSoat.js'));
  await db.initDatabase();
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  let coRoute = true;
  try { app.use('/api/pos/don-thu', require(path.join(GOC, 'server', 'routes', 'don-thu.js'))); } catch { coRoute = false; }
  app.use('/api/pos/backup', require(path.join(GOC, 'server', 'routes', 'backup.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  const chu = await db.queryOne("SELECT id, username FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const nv = await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES ('nv_khsdt1', 'x', 'NV', 'staff', 1)");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  const tkNv = jwt.sign({ userId: nv.lastInsertRowid }, KHOA_NV, { expiresIn: '1h' });
  const goi = async (duong, than, token = tkChu) => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = 'Bearer ' + token;
    try {
      const r = await fetch(goc + '/don-thu' + duong, { method: 'POST', headers: h, body: JSON.stringify(than) });
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
  const diem = (phone, points, luc, orderId, xoa, type = 'earn', het = '2027-12-31T23:59:59') => them('pos_point_transactions', { customer_phone: phone, type, points, order_id: orderId, created_at: luc, expires_at: het }, xoa);
  const so = (phone, type, amount, luc, orderId, xoa) => them('pos_balance_transactions', { customer_phone: phone, type, amount, order_id: orderId, created_at: luc }, xoa);
  // khoá ngoại đang BẬT (libsql): khuyến mãi + gói mẫu có thật, máy chủ phải xoá con trước cha
  const KM = await them('pos_promotions', { code: 'KM_THU', name: 'KM thử', type: 'percent', value: 10 });
  const GOI = await them('pos_packages', { code: 'GOI_THU', name: 'Gói thử', total_qty: 10 });
  const CHUNG = await them('pos_discount_codes', { code: 'CHUNG', discount_type: 'fixed', discount_value: 5000, usage_limit: 10, used_count: 3 });

  // T1 — số mồ côi: mọi thứ trước X phải đi; dòng ĐÚNG ngày X và sau X phải ở lại
  const O1 = await don('ORD-20260806-751', T1, '2026-08-06T10:00:00', true, { cash_amount: 50000 });
  await them('pos_order_items', { order_id: O1, product_name: 'Trà', quantity: 1, unit_price: 50000, total_price: 50000 }, true);
  await them('pos_invoice_logs', { order_id: O1, order_code: 'ORD-20260806-751', invoice_number: `00001/${getToday().slice(0, 4)}` }, true);   // hoá đơn năm nay duy nhất → xoá hết được
  for (const ky of KET) await them('pos_doi_soat_ghi', { loai: 'ket', ky, so_tien: 50000, de_lai: 0, nguoi: 'x', luc: ky + 'T22:00:00' });
  await diem(T1, 50, '2026-08-07T10:00:00', 9998, true);   // dòng mồ côi: đơn 9998 đã bị xoá ở quầy → dọn theo ngày
  await them('pos_order_log', { order_id: O1, loai: 'tao', luc: '2026-08-06T10:00:00' }, true);
  await them('pos_refund_requests', { order_id: O1, customer_phone: T1 }, true);
  await them('pos_damage_logs', { order_id: O1, product_code: 'TRA', quantity: 1, reason: 'vỡ', action: 'doi' }, true);
  await them('pos_promotion_usage', { promotion_id: KM, order_id: O1, customer_phone: T1 }, true);
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
  // T1 mua gói trước X, đơn lấy từ gói HÔM NAY → đơn mua gói giữ (gói đang dùng), đơn hôm nay giữ
  await don('ORD-20260812-001', T1, '2026-08-12T10:00:00', false);
  const OB = Number((await db.queryOne("SELECT id FROM pos_orders WHERE code = 'ORD-20260812-001'")).id);
  const GPT = await them('pos_customer_packages', { customer_phone: T1, package_id: GOI, order_id: OB, total_qty: 10, delivered_qty: 1, created_at: '2026-08-12T10:00:00' });
  await don('ORD-HOMNAY-T1GOI', T1, homNay, false, { customer_package_id: GPT });

  // T2 — số thử có hồ sơ, dọn theo danh sách: mọi bảng, sổ ví khớp ví (nạp 100.000, mua bằng ví 100.000, ví 0)
  await them('pos_customers', { phone: T2, name: 'Thử 2', pin_code: '$2b$10$bammau', created_at: '2026-10-20T08:00:00' }, true);
  await them('pos_wallets', { phone: T2, balance: 0, total_topup: 100000, total_spent: 100000 }, true);
  await so(T2, 'topup', 100000, '2026-10-20T08:00:00', null, true);
  const O2 = await don('ORD-20261020-001', T2, '2026-10-20T09:00:00', true, { payment_method: 'balance', balance_amount: 100000, total: 100000 });
  await them('pos_order_items', { order_id: O2, product_name: 'Gói', quantity: 1, unit_price: 100000, total_price: 100000 }, true);
  await so(T2, 'purchase', -100000, '2026-10-20T09:00:00', O2, true);
  await diem(T2, 1000, '2026-10-20T09:00:00', O2, true);
  await them('pos_customer_packages', { customer_phone: T2, package_id: GOI, order_id: O2, total_qty: 10, created_at: '2026-10-20T09:00:00' }, true);
  await them('pos_membership_purchases', { customer_phone: T2, tier_id: 1, tier_name: 'Vàng', order_id: O2, purchased_at: '2026-10-20T09:00:00', expires_at: '2027-10-20T09:00:00' }, true);
  await them('pos_registrations', { phone: T2, name: 'Thử 2' }, true);
  await them('pos_kh_ma_dang_nhap', { sdt: T2, ma_bam: 'z', nguon: 'gui', tao_luc: '2026-10-21T08:00:00', het_han: '2026-10-21T08:05:00' }, true);
  await them('pos_voucher_grants', { code: 'DDT2', customer_phone: T2, status: 'used', granted_at: '2026-10-21T08:00:00' }, true);
  await them('pos_discount_codes', { code: 'DDT2', discount_type: 'fixed', discount_value: 20000 }, true);

  // T3 — trong danh sách, có đơn hôm nay → giữ CẢ SỐ: hồ sơ, đơn cũ, điểm
  await them('pos_customers', { phone: T3, name: 'Thử 3', created_at: '2026-10-01T08:00:00' });
  const O3a = await don('ORD-20261002-001', T3, '2026-10-02T10:00:00', false);
  await diem(T3, 500, '2026-10-02T10:00:00', O3a, false);
  await don('ORD-HOMNAY-T3', T3, homNay, false);

  // PM — trong danh sách, ví 0, nhưng đã trả hộ (bằng ví) đơn SAU X của CON2 (ngoài danh sách) → đơn đó ở lại → giữ CẢ SỐ PM
  await them('pos_customers', { phone: PM, name: 'Mẹ thử', created_at: '2026-10-01T08:00:00' });
  await them('pos_wallets', { phone: PM, balance: 0, total_topup: 50000, total_spent: 50000 });
  await so(PM, 'topup', 50000, '2026-10-01T08:00:00', null, false);
  const OCm = await don('ORD-20261010-001', CON2, '2026-10-10T10:00:00', false, { parent_phone: PM, parent_balance_amount: 50000, payment_method: 'balance' });
  await so(PM, 'purchase', -50000, '2026-10-10T10:00:00', OCm, false);

  // B — khách thật: nhận điểm + ưu đãi bằng mã bill in trên đơn thử OA (không SĐT, trước X) SAU X → đơn OA giữ, dòng của B còn nguyên
  await them('pos_customers', { phone: B, name: 'Khách B', created_at: '2026-07-01T08:00:00' });
  const OA = await don('ORD-20260805-001', null, '2026-08-05T10:00:00', false);
  await them('pos_signup_codes', { code: 'BILLA', order_id: OA, claimed_at: '2026-10-05T09:00:00', claimed_phone: B, diem_nhan_luc: '2026-10-05T09:00:00', diem_nhan_phone: B });
  await them('pos_discount_codes', { code: 'BILLA', discount_type: 'fixed', discount_value: 10000 });
  await diem(B, 400, '2026-10-05T09:00:00', OA, false);
  // CM — chỉ còn dòng điểm mồ côi (đơn 9999 đã xoá ở quầy) + hồ sơ → xoá sạch được
  await them('pos_customers', { phone: CM, name: 'Thử mồ côi', created_at: '2026-10-01T08:00:00' }, true);
  await diem(CM, 200, '2026-10-01T09:00:00', 9999, true);
  await diem(CM, -100, '2026-10-02T09:00:00', 9999, true, 'adjust');
  // G — gói không gắn đơn, đơn của số khác (sau X, ngoài danh sách) đang lấy từ gói → giữ cả số G
  await them('pos_customers', { phone: G, name: 'Thử gói', created_at: '2026-10-01T08:00:00' });
  const GG = await them('pos_customer_packages', { customer_phone: G, package_id: GOI, total_qty: 5, delivered_qty: 1, created_at: '2026-10-01T08:00:00' });
  await don('ORD-20261012-001', '0900000013', '2026-10-12T10:00:00', false, { customer_package_id: GG, total: 0 });
  // M2 — là mẹ của khách 0900000015 (ngoài danh sách) → giữ cả số M2
  await them('pos_customers', { phone: M2, name: 'Mẹ 2', created_at: '2026-10-01T08:00:00' });
  await them('pos_customers', { phone: '0900000015', name: 'Con 2', parent_phone: M2, relationship: 'con', created_at: '2026-10-01T08:00:00' });

  // K — khách thật ví ≠ 0, CÓ trong danh sách SĐT: không một dòng nào của K bị đụng, kể cả trước X
  await them('pos_customers', { phone: K, name: 'Khách thật', created_at: '2026-07-01T08:00:00' });
  await them('pos_wallets', { phone: K, balance: 50000, total_topup: 50000 });
  await so(K, 'topup', 50000, '2026-07-01T08:00:00', null, false);
  const OK = await don('ORD-20260820-001', K, '2026-08-20T10:00:00', false);
  await diem(K, 500, '2026-08-20T10:00:00', OK, false);
  await them('pos_voucher_grants', { code: 'DDK', customer_phone: K, status: 'available', granted_at: '2026-08-21T10:00:00' });
  await them('pos_discount_codes', { code: 'DDK', discount_type: 'fixed', discount_value: 20000 });
  await don('ORD-20260809-001', CON, '2026-08-09T10:00:00', false, { parent_phone: K });   // K trả hộ con → giữ

  // R — khách thật ngoài danh sách: nạp + mua bằng ví trước X (ví 0) → đơn giữ để ví khớp sổ; gói không gắn đơn → đơn lấy từ gói giữ
  await them('pos_customers', { phone: R, name: 'Khách R', created_at: '2026-08-01T08:00:00' });
  await them('pos_wallets', { phone: R, balance: 0, total_topup: 100000, total_spent: 100000 });
  await so(R, 'topup', 100000, '2026-08-02T08:00:00', null, false);
  const OR1 = await don('ORD-20260802-001', R, '2026-08-02T09:00:00', false, { payment_method: 'balance', balance_amount: 100000, total: 100000 });
  await so(R, 'purchase', -100000, '2026-08-02T09:00:00', OR1, false);
  await diem(R, 100, '2026-08-03T08:00:00', null, true, 'bonus');
  const GR = await them('pos_customer_packages', { customer_phone: R, package_id: GOI, total_qty: 5, delivered_qty: 1, created_at: '2026-08-04T08:00:00' });
  await don('ORD-20260804-001', R, '2026-08-04T10:00:00', false, { customer_package_id: GR, total: 0 });
  await them('pos_membership_purchases', { customer_phone: R, tier_id: 1, tier_name: 'Vàng', purchased_at: '2026-08-04T08:00:00', expires_at: '2027-08-04T08:00:00' });
  const O4 = await don('ORD-20261015-001', R, '2026-10-15T10:00:00', false);
  await diem(R, 500, '2026-10-15T10:00:00', O4, false);
  await them('pos_signup_codes', { code: 'TQDT2', order_id: O4, order_customer_phone: R, claimed_at: '2026-10-16T09:00:00', claimed_phone: T2 }, true);   // mã trên bill R, số thử T2 nhận
  await them('pos_discount_codes', { code: 'TQDT2', discount_type: 'fixed', discount_value: 10000 }, true);

  // Đơn không SĐT: có phiên (tiền ngân hàng) → giữ; nợ kho SX → giữ; dùng mã CHUNG → xoá + trả lượt + voucher R về available
  const O5 = await don('ORD-20260807-001', null, '2026-08-07T10:00:00', false, { payment_method: 'transfer' });
  await them('pos_phien_thanh_toan', { than: '{}', tong: 50000, con_lai: 0, cach: 'qr', het_han: '2026-08-07T10:15:00', order_id: O5, nguoi_tao: 'x', tao_luc: '2026-08-07T10:00:00', trang_thai: 'da_thu' });
  const OS = await don('ORD-20260813-001', null, '2026-08-13T10:00:00', false);
  await them('pos_stock_pending', { order_code: 'ORD-20260813-001', order_id: OS, sx_product_type: 'tra', sx_product_id: 1, quantity: 1 });
  const O6 = await don('ORD-20260808-001', null, '2026-08-08T10:00:00', true, { discount_code: 'chung', discount_type: 'fixed', discount_value: 5000 });
  await them('pos_order_items', { order_id: O6, product_name: 'Nước', quantity: 2, unit_price: 25000, total_price: 50000 }, true);
  // đơn ĐÃ HUỶ dùng mã CHUNG: lúc huỷ đã trả lượt (orders.js) → xoá KHÔNG trả thêm lượt (soát vòng 2, lỗi 2)
  await don('ORD-20260809-002', null, '2026-08-09T11:00:00', true, { status: 'cancelled', discount_code: 'CHUNG', discount_type: 'fixed', discount_value: 5000 });
  const DDR = await them('pos_voucher_grants', { code: 'DDR', customer_phone: R, status: 'used', granted_at: '2026-10-16T10:00:00', used_order_id: O6, used_at: '2026-10-16T11:00:00' });
  await them('pos_discount_codes', { code: 'DDR', discount_type: 'fixed', discount_value: 20000 });
  await don('ORD-HOMNAY-LE', null, homNay, false);
  for (let i = 1; i <= SO_DON_LON; i++) {
    await don(`ORD-THU-${String(i).padStart(3, '0')}`, null, '2026-08-20T12:00:00', true, { notes: 'ghi chú thử '.repeat(90) });
  }

  // P6 — cộng trước X (đi theo ngày), trừ sau X (ở lại) → điểm âm nếu không có P6 trong danh sách
  await diem(P6, 300, '2026-08-05T10:00:00', null, true);
  await diem(P6, -300, '2026-10-05T10:00:00', null, true, 'redeem');
  // P7 — cùng cảnh nhưng lô điểm đã hết hạn (dòng trừ chép hạn lô) → số dư thật = 0, KHÔNG được báo âm
  await diem(P7, 300, '2026-08-05T10:00:00', null, true, 'earn', '2026-10-01T00:00:00');
  await diem(P7, -300, '2026-09-10T10:00:00', null, false, 'redeem', '2026-10-01T00:00:00');

  // Q9 (chủ quán chốt 02.11) — két một ngày = để lại lần đếm TRƯỚC + tiền mặt vào / ra cả KHOẢNG (doiSoat.js soKet): két < X được lệch
  // (liệt kê đúng ngày), két từ X không được đổi → đơn thử có tiền rơi vào khoảng của két ≥ X giữ lại; không chọn ngày → mọi két giữ nguyên.
  await don('ORD-20260820-T5', T5, '2026-08-20T10:00:00', true, { cash_amount: 20000 });   // két 31/08 (< X) → lệch, liệt kê
  await don('ORD-20260831-HUY', null, '2026-08-31T10:00:00', false, { status: 'cancelled', cash_amount: 20000, cancelled_at: X + 'T09:00:00' });   // huỷ ĐÚNG ngày X → két X
  const ONO = await don('ORD-20260825-NO', null, '2026-08-25T10:00:00', false, { cash_amount: 30000 });   // nợ, thu tiền mặt 02/09 → két 02/09
  await them('pos_order_log', { order_id: ONO, loai: 'thu', luc: '2026-09-02T10:00:00', chi_tiet: JSON.stringify({ cach: 'cash', so_tien: 30000 }) });
  await them('pos_customers', { phone: T4, name: 'Thử nạp', created_at: '2026-09-04T08:00:00' });
  await them('pos_wallets', { phone: T4, balance: 0, total_topup: 40000, total_spent: 40000 });
  await so(T4, 'topup', 40000, '2026-09-04T10:00:00', null, false);   // nạp tiền mặt → két 05/09
  await so(T4, 'adjust', -40000, '2026-09-04T11:00:00', null, false);

  const tatBang = (await db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")).map((r) => r.name);
  const chup = async () => {
    const o = {};
    for (const t of tatBang) o[t] = await db.query(`SELECT * FROM ${t} ORDER BY rowid`);
    return o;
  };
  const bam = (o) => crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
  const demXoa = (t) => [...XOA].filter((x) => x.startsWith(t + ':')).length;
  const doiSoat = async () => {
    const ds = [];
    for (const [kieu, ngay] of [['ngay', getToday()], ['thang', '2026-08-15'], ['thang', '2026-10-15']]) {
      const r = await chayDoiSoat({ kieu, ngay });
      for (const l of [...r.do, ...r.can_xem]) ds.push(`${l.bat_bien} ${l.mo_ta}`);
    }
    return new Set(ds);
  };
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
  const ma = (l) => (l.j.don || []).map((d) => d.code).filter((c) => !c.startsWith('ORD-THU-')).sort();
  const soLon = (l) => (l.j.don || []).filter((d) => d.code.startsWith('ORD-THU-')).length;
  {
    k('D1 200', l1.status === 200, `${l1.status} ${JSON.stringify(l1.j).slice(0, 200)}`);
    k('D1 đơn trước X: đúng O1, T5, 31/08 23:59:59, O6, đơn huỷ 09/08 + 40 đơn thử (không đơn đúng X, không đơn bị giữ)',
      bang(ma(l1), ['ORD-20260806-751', 'ORD-20260808-001', 'ORD-20260809-002', 'ORD-20260820-T5', 'ORD-20260831-001']) && soLon(l1) === SO_DON_LON, `${JSON.stringify(ma(l1))} + ${soLon(l1)}`);
    const sd = l1.j.so_dong || {};
    k('D1 dòng gắn đơn đi theo đơn (chi tiết 2, nhật ký đơn, hoá đơn, hoàn, hỏng, khuyến mãi)',
      sd.pos_order_items === 2 && sd.pos_order_log === 1 && sd.pos_invoice_logs === 1 && sd.pos_refund_requests === 1 && sd.pos_damage_logs === 1
      && sd.pos_promotion_usage === 1, JSON.stringify(sd));
    k('D1 theo ngày KHÔNG xoá dòng sổ ví nào (ví của R phải khớp sổ)', !sd.pos_balance_transactions, JSON.stringify(sd));
    k('D1 điểm trước X: O1 +500, T1 −200, T1 mồ côi +50, R +100, P6 +300, P7 +300 (không dòng sau X, không dòng của K / T3 / B / đơn giữ)', sd.pos_point_transactions === 6, String(sd.pos_point_transactions));
    k('D1 voucher trước X: chỉ của T1 (K giữ) + mã giảm của voucher và mã bill đơn O1 (mã CHUNG không xoá)', sd.pos_voucher_grants === 1 && sd.pos_discount_codes === 2 && sd.pos_signup_codes === 1, JSON.stringify(sd));
    k('D1 mã đăng nhập / lần thử App trước X', sd.pos_kh_ma_dang_nhap === 1 && sd.pos_kh_lan_thu === 1, JSON.stringify(sd));
    k('D1 theo ngày KHÔNG chạm hồ sơ khách, ví, gói / thẻ không gắn đơn', !sd.pos_customers && !sd.pos_wallets && !sd.pos_customer_packages && !sd.pos_membership_purchases, JSON.stringify(sd));
    k('D1 tổng tiền = tổng đơn sẽ dọn (45 × 50.000)', l1.j.tong_tien === 50000 * (5 + SO_DON_LON), String(l1.j.tong_tien));
    k('D1 tổng điểm còn hạn sẽ mất: 500 − 200 + 50 + 100 + 300 (P7 hết hạn không tính)', l1.j.tong_diem_con_han === 750, String(l1.j.tong_diem_con_han));
    k('D1 két < X sẽ lệch, tính theo KHOẢNG két (lần đếm trước → ngày đếm): 06/08 (đơn O1 cùng ngày) + 31/08 (đơn T5 ngày 20/08, không có két đúng ngày đơn)',
      bang(l1.j.ket_se_lech, ['2026-08-06', '2026-08-31']), JSON.stringify(l1.j.ket_se_lech));
    k('D1 không bao giờ dọn sổ tiền / kho / phiên / đơn App', ['pos_doi_soat_ghi', 'pos_payos_su_kien', 'pos_phien_thanh_toan', 'pos_don_app', 'pos_nhat_ky_pin', 'pos_stock_pending', 'pos_products', 'pos_settings', 'pos_users', 'pos_sync_logs', 'pos_packages'].every((t) => !sd[t]));
  }
  muc('[D3] Giữ lại cả cụm: ví ≠ 0, phiên, nợ kho, sổ ví, gói');
  {
    const gd = (l1.j.giu_lai && l1.j.giu_lai.don) || [];
    const co = (code, re) => gd.some((d) => d.code === code && re.test(d.ly_do || ''));
    k('D3 đơn có phiên thanh toán → giữ lại', co('ORD-20260807-001', /phiên/), JSON.stringify(gd));
    k('D3 đơn K trả hộ con (ví K ≠ 0) → giữ lại', co('ORD-20260809-001', /trả hộ/));
    k('D3 đơn của K (ví ≠ 0) trước X → giữ lại', co('ORD-20260820-001', /ví/));
    k('D3 đơn còn nợ kho SX → giữ lại', co('ORD-20260813-001', /kho/));
    k('D3 đơn R mua bằng ví (sổ ví của số không dọn) → giữ lại', co('ORD-20260802-001', /sổ ví/));
    k('D3 đơn R lấy từ gói còn giữ → giữ lại', co('ORD-20260804-001', /gói còn giữ/));
    k('D3 đơn T1 mua gói mà đơn hôm nay đang dùng → giữ lại', co('ORD-20260812-001', /Mua gói/));
    k('D3 đơn thử có mã bill khách thật B đã nhận điểm / ưu đãi → giữ lại (điểm + mã của B còn)', co('ORD-20260805-001', /SĐT khác/));
    k('D3 đơn thử huỷ ĐÚNG ngày X (tiền trả ra rơi vào két X) → giữ lại, lý do két', co('ORD-20260831-HUY', /két ngày 2026-09-01/), JSON.stringify(gd.filter((d) => /HUY|NO$/.test(d.code))));
    k('D3 đơn thử nợ, thu tiền mặt SAU X (két 02/09) → giữ lại, lý do két', co('ORD-20260825-NO', /két ngày 2026-09-02/));
    k('D3 ví ≠ 0 của K liệt kê riêng kèm số dư', ((l1.j.giu_lai && l1.j.giu_lai.vi) || []).some((v) => v.phone === K && Number(v.balance) === 50000), JSON.stringify(l1.j.giu_lai && l1.j.giu_lai.vi));
  }
  muc('[D10] Điểm âm → báo + từ chối dọn (cùng vị từ còn hạn với số dư thật)');
  {
    const da = l1.j.diem_am || [];
    k('D10 P6 (cộng trước X, trừ sau X) → diem_am có P6 còn −300', da.some((d) => d.phone === P6 && Number(d.con_lai) === -300), JSON.stringify(da));
    k('D10 không chặn oan: P7 lô đã hết hạn (số dư thật 0), T1 còn +100, R còn +500 → không âm', da.length === 1, JSON.stringify(da));
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
    const l2 = await goi('/liet-ke', { sdt: [' 0900 000 002 ', K, T3] });
    noiLai();
    const sd = l2.j.so_dong || {};
    k('D2 200, SĐT chuẩn hoá (khoảng trắng bỏ); K (ví) và T3 (đơn hôm nay) KHÔNG nằm trong danh sách xoá sạch', l2.status === 200 && bang(l2.j.sdt, [T2]), `${l2.status} ${JSON.stringify(l2.j.sdt)}`);
    k('D2 K và T3 hiện ở giữ lại (SĐT)', bang(l2.j.giu_lai && l2.j.giu_lai.sdt, [K, T3]), JSON.stringify(l2.j.giu_lai && l2.j.giu_lai.sdt));
    const ld = (l2.j.giu_lai && l2.j.giu_lai.ly_do_sdt) || {};
    k('D2 SĐT giữ lại có lý do: K ví, T3 đơn phải giữ', /ví/.test(ld[K] || '') && /đơn phải giữ/.test(ld[T3] || '') && Object.keys(ld).length === 2, JSON.stringify(ld));
    k('D2 đơn: chỉ O2 (đơn cũ của T3 giữ theo số, đơn số khác không vào)', bang(ma(l2), ['ORD-20261020-001']), JSON.stringify(ma(l2)));
    k('D2 đơn hôm nay của T3 hiện ở giữ lại có lý do', ((l2.j.giu_lai && l2.j.giu_lai.don) || []).some((d) => d.code === 'ORD-HOMNAY-T3' && /hôm nay/.test(d.ly_do)));
    k('D2 đủ mọi bảng của T2: hồ sơ, ví 0, sổ ví 2, điểm 1, gói, thẻ, đăng ký, mã App, voucher, mã bill đã nhận; T3 không một dòng',
      sd.pos_customers === 1 && sd.pos_wallets === 1 && sd.pos_balance_transactions === 2 && sd.pos_point_transactions === 1 && sd.pos_customer_packages === 1
      && sd.pos_membership_purchases === 1 && sd.pos_registrations === 1 && sd.pos_kh_ma_dang_nhap === 1 && sd.pos_voucher_grants === 1
      && sd.pos_signup_codes === 1 && sd.pos_discount_codes === 2, JSON.stringify(sd));
  }

  muc('[D15] Chỉ theo SĐT (không chọn ngày) → mọi két đã đếm giữ nguyên');
  {
    imLang();
    const l = await goi('/liet-ke', { sdt: [T5] });
    noiLai();
    const gd = (l.j.giu_lai && l.j.giu_lai.don) || [];
    k('D15 đơn T5 (tiền vào két 31/08) → giữ lại, lý do két; T5 giữ cả số; không két nào lệch', l.status === 200 && !(l.j.don || []).length
      && gd.some((d) => d.code === 'ORD-20260820-T5' && /két ngày 2026-08-31/.test(d.ly_do)) && bang(l.j.giu_lai.sdt, [T5]) && bang(l.j.ket_se_lech, []),
      `${l.status} ${JSON.stringify(gd)} ${JSON.stringify(l.j.ket_se_lech)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  const TC = { truoc_ngay: X, sdt: [T2, K, T3, P6, PM, CM, G, M2, T4] };
  muc('[D5] Dọn: chữ xác nhận, mã xác nhận, dữ liệu đổi giữa hai bước');
  let l3;
  {
    imLang();
    l3 = await goi('/liet-ke', TC);
    noiLai();
    k('D5 (điều kiện) liệt kê đủ tiêu chí: không còn điểm âm', l3.status === 200 && (l3.j.diem_am || []).length === 0 && !!l3.j.ma_xac_nhan, JSON.stringify(l3.j.diem_am));
    k('D5 giữ cả số: trả hộ đơn số khác (PM), gói đang được đơn số khác dùng (G), mẹ của khách không xoá (M2), nạp ví vào két ≥ X (T4); số chỉ còn dòng mồ côi (CM) xoá được',
      bang(l3.j.giu_lai && l3.j.giu_lai.sdt, [K, T3, PM, G, M2, T4]) && bang(l3.j.sdt, [T2, P6, CM]),
      `${JSON.stringify(l3.j.giu_lai && l3.j.giu_lai.sdt)} / ${JSON.stringify(l3.j.sdt)}`);
    const ld = (l3.j.giu_lai && l3.j.giu_lai.ly_do_sdt) || {};
    k('D5 mỗi SĐT giữ cả số có lý do đúng (màn + CSV): PM dòng gắn đơn, G gói, M2 khách không xoá, T4 két 05/09',
      /gắn đơn không dọn/.test(ld[PM] || '') && /gói/.test(ld[G] || '') && /khách không xoá/.test(ld[M2] || '') && /két ngày 2026-09-05/.test(ld[T4] || ''), JSON.stringify(ld));
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
  imLang();
  const dsTruoc = await doiSoat();
  const ketMoiNgay = async () => { const m = {}; for (const ky of KET) m[ky] = (await chayDoiSoat({ kieu: 'ngay', ngay: ky })).ket.so_theo_so; return m; };
  const ketTruoc = await ketMoiNgay();
  noiLai();
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
      JSON.stringify(nk.map((r) => ({ ...r, details: String(r.details).slice(0, 80) }))));
    k('D6 nhật ký có tiêu chí (SĐT xoá sạch thật) + số dòng từng bảng', !!ct.tieu_chi && ct.tieu_chi.truoc_ngay === X && bang(ct.tieu_chi.sdt, [T2, P6, CM]) && bang(ct.so_dong, r6.j.so_dong), JSON.stringify(ct.tieu_chi));
    const phan = (sau.pos_sync_logs || []).filter((r) => r.type === 'don_thu_chup' && r.file_name === `don_thu#${nk[0] && nk[0].id}`).sort((a, b) => a.record_count - b.record_count);
    const ghep = phan.map((r) => r.details).join('');
    let chupNk = {}; try { chupNk = JSON.parse(ghep); } catch { /* hỏng */ }
    const xoaNk = chupNk.xoa || {};
    const st = chupNk.sua_truoc || {};
    k('D6 nhật ký chụp dòng bị SỬA trước khi trả lượt (mã CHUNG dùng 3, voucher DDR used) — trong các phần chia, KHÔNG ở một ô details',
      ((st.pos_discount_codes || []).find((r) => r.code === 'CHUNG') || {}).used_count === 3
      && ((st.pos_voucher_grants || []).find((r) => Number(r.id) === DDR) || {}).status === 'used' && ct.sua_truoc === undefined, JSON.stringify(st).slice(0, 160));
    k('D6 bản chụp trong nhật ký chia phần, mỗi ô ≤ 32767 ký tự (trần ô Excel của sao lưu)', phan.length >= 2 && phan.length === ct.so_phan && phan.every((r) => String(r.details).length <= 32767)
      && (sau.pos_sync_logs || []).every((r) => String(r.details ?? '').length <= 32767), `${phan.length} phần / so_phan ${ct.so_phan}`);
    k('D6 băm bản chụp trong nhật ký khớp phần ghép', ct.bam_ban_chup === crypto.createHash('sha256').update(ghep).digest('hex'));
    const goc1 = (trc.pos_orders || []).find((r) => r.code === 'ORD-20260806-751');
    k('D6 bản chụp nhật ký giữ NGUYÊN dòng đã xoá (mọi cột)', !!goc1 && bang(((xoaNk.pos_orders || []).find((r) => r.code === 'ORD-20260806-751')), goc1));
    k('D6 bản chụp nhật ký đủ mọi dòng đã xoá', Object.values(xoaNk).reduce((s, a) => s + a.length, 0) === XOA.size);
    const khT2 = (xoaNk.pos_customers || []).find((r) => r.phone === T2);
    k('D6 nhật ký (nhân viên đọc được qua /sync/logs) che PIN / mật khẩu / mã băm: "[ẩn]"', !!khT2 && khT2.pin_code === '[ẩn]' && !ghep.includes('$2b$10$bammau'), JSON.stringify(khT2 && khT2.pin_code));
    const khTra = ((r6.j.ban_chup || {}).pos_customers || []).find((r) => r.phone === T2);
    k('D6 bản chụp trả về cho chủ quán tải: đủ dòng, giữ nguyên cột (kể cả PIN băm)', !!khTra && khTra.pin_code === '$2b$10$bammau'
      && Object.values(r6.j.ban_chup || {}).reduce((s, a) => s + a.length, 0) === XOA.size);
  }
  muc('[E] K5 — dòng ngoài tiêu chí còn nguyên từng cột; đối soát; sao lưu');
  {
    const lech = [];
    for (const t of tatBang) {
      const mong = (trc[t] || []).filter((r) => !XOA.has(`${t}:${r.id}`)).map((r) => {
        if (t === 'pos_discount_codes' && Number(r.id) === CHUNG) return { ...r, used_count: r.used_count - 1 };
        if (t === 'pos_voucher_grants' && Number(r.id) === DDR) return { ...r, status: 'available', used_order_id: null, used_at: null };
        return r;
      });
      const that = (sau[t] || []).filter((r) => !(t === 'pos_sync_logs' && /^don_thu/.test(r.type)));
      if (!bang(mong, that)) lech.push(t);
    }
    k('E1 mọi bảng: dòng KHÔNG gắn nhãn trước = sau (hồ sơ, ví, sổ ví, điểm, voucher, gói, thẻ của K / R / T3 / con K; sản phẩm…), trừ cột bù', lech.length === 0, lech.join(', '));
    const chung = (sau.pos_discount_codes || []).find((r) => Number(r.id) === CHUNG);
    const ddr = (sau.pos_voucher_grants || []).find((r) => Number(r.id) === DDR);
    k('E2 xoá đơn dùng mã → trả lượt mã CHỈ cho đơn completed (CHUNG 3 → 2, đơn đã huỷ không trả thêm) + voucher R về available (traLuotMa)', chung && chung.used_count === 2 && ddr && ddr.status === 'available' && ddr.used_order_id === null, `${chung && chung.used_count} ${ddr && ddr.status}`);
    const tien = (o) => (o.pos_orders || []).filter((r) => !XOA.has(`pos_orders:${r.id}`)).reduce((s, r) => s + Number(r.total), 0);
    k('E2 tổng tiền các đơn KHÔNG dọn bằng nhau trước–sau', tien(trc) === tien(sau));
    k('E2 hồ sơ khách R, T3, K còn', [R, T3, K].every((p) => (sau.pos_customers || []).some((r) => r.phone === p)));
    imLang();
    const dsSau = await doiSoat();
    noiLai();
    const moi = [...dsSau].filter((l) => !dsTruoc.has(l));
    k('E3 đối soát (chayDoiSoat ngày hôm nay + tháng 8 + tháng 10): KHÔNG thêm dòng lệch nào sau khi dọn', moi.length === 0, moi.slice(0, 3).join(' | '));
    imLang();
    const ketSau = await ketMoiNgay();
    noiLai();
    const doi = KET.filter((ky) => ketTruoc[ky] !== ketSau[ky]);
    k('E5 két MỌI ngày đã đếm (chayDoiSoat kiểu ngày): ngày từ X không đổi; ngày < X đổi đúng bằng danh sách ket_se_lech đã liệt kê',
      KET.every((ky) => ky < X || ketTruoc[ky] === ketSau[ky]) && bang(doi, l3.j.ket_se_lech) && doi.length === 2, `đổi ${JSON.stringify(doi)} / liệt kê ${JSON.stringify(l3.j.ket_se_lech)}`);
    imLang();
    let sl = { status: 0 };
    try { sl = await fetch(goc + '/backup/export-all', { headers: { Authorization: 'Bearer ' + tkChu } }); } catch { /* sập */ }
    noiLai();
    k('E4 sao lưu toàn bộ (/backup/export-all) vẫn tải được SAU khi dọn (nhật ký lớn)', sl.status === 200, String(sl.status));
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

  muc('[D13] Số hoá đơn: xoá HẾT hoặc KHÔNG xoá hoá đơn năm nay (số kế tiếp = đếm hoá đơn trong năm)');
  {
    const nam = getToday().slice(0, 4);
    imLang();
    const OQ = await don('ORD-20260825-001', null, '2026-08-25T10:00:00', false);
    await them('pos_invoice_logs', { order_id: OQ, order_code: 'ORD-20260825-001', invoice_number: `00002/${nam}` });
    const lA = await goi('/liet-ke', { truoc_ngay: X });
    const OT = await don('ORD-HOMNAY-HD', null, homNay, false);
    await them('pos_invoice_logs', { order_id: OT, order_code: 'ORD-HOMNAY-HD', invoice_number: `00003/${nam}` });
    const lB = await goi('/liet-ke', { truoc_ngay: X });
    noiLai();
    k('D13 hoá đơn năm nay chỉ ở đơn sẽ dọn → dọn được', (lA.j.don || []).some((d) => d.code === 'ORD-20260825-001'), JSON.stringify(ma(lA)));
    k('D13 còn hoá đơn năm nay ở đơn giữ (hôm nay) → đơn thử có hoá đơn năm nay cũng giữ, có lý do', !(lB.j.don || []).some((d) => d.code === 'ORD-20260825-001')
      && ((lB.j.giu_lai && lB.j.giu_lai.don) || []).some((d) => d.code === 'ORD-20260825-001' && /hoá đơn/.test(d.ly_do)), JSON.stringify(ma(lB)));
  }

  muc('[D14] Mọi bảng có cột SĐT / order_id đều có chủ: trong danh sách dọn hoặc danh sách KHÔNG dọn (dò PRAGMA)');
  {
    const svDt = (() => { try { return require(path.join(GOC, 'server', 'utils', 'donThu.js')); } catch { return {}; } })();
    const coChu = new Set([...(svDt.THU_TU_XOA || []), ...(svDt.BANG_KHONG_DON || [])]);
    const voChu = [];
    for (const t of tatBang) {
      const cot = (await db.query(`PRAGMA table_info(${t})`)).map((c) => c.name);
      if (cot.some((c) => /(^|_)phone$|^sdt$|(^|_)order_id$/.test(c)) && !coChu.has(t)) voChu.push(t);
    }
    k('D14 không bảng nào có cột SĐT / order_id mà vô chủ', coChu.size > 0 && voChu.length === 0, voChu.join(', ') || 'chưa có danh sách');
    const chia = typeof svDt.chiaPhan === 'function' ? svDt.chiaPhan : () => [];
    const s1 = 'a'.repeat(29999) + '\u{1F600}' + 'b'.repeat(10);
    const p1 = chia(s1), p2 = chia('a'.repeat(30001));
    k('D16 chia phần nhật ký: emoji ở vị trí 29.999 không bị cắt đôi (phần 1 dài 29.999), ghép lại đúng; không emoji → 30.000 + 1',
      p1.length === 2 && p1[0].length === 29999 && p1.join('') === s1 && p1.every((x) => !/[\uD800-\uDBFF]$/.test(x))
      && p2.length === 2 && p2[0].length === 30000 && p2[1] === 'a', JSON.stringify(p1.map((x) => x.length)) + ' ' + JSON.stringify(p2.map((x) => x.length)));
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
    const kq = { tong_dong: 5, tong_tien: 50000, tong_diem_con_han: 700, diem_am: [], don: [{ code: 'ORD-A', created_at: '2026-08-06T10:00:00', customer_phone: T1, total: 50000 }],
      sdt: [T2], so_dong: { pos_orders: 1 }, giu_lai: { vi: [{ phone: K, balance: 50000 }], sdt: [T3], ly_do_sdt: { [T3]: 'Có gói đang được đơn không dọn dùng' }, don: [{ code: 'ORD-B', ly_do: 'có phiên' }] } };
    const csv = String(f('dungCsv')(kq) || '');
    k('D12 CSV có đơn (mã, ngày, SĐT, tiền), SĐT dọn, số dòng từng bảng, tổng điểm, phần giữ lại (ví, SĐT, đơn)', ['ORD-A', '2026-08-06T10:00:00', T1, '50000', T2, 'pos_orders', '700', K, T3, 'ORD-B', 'có phiên'].every((x) => csv.includes(x)), csv.slice(0, 200));
    k('D12 CSV: SĐT giữ lại ghi ĐÚNG lý do của số đó (không câu chung)', csv.split('\r\n').some((d) => d.includes(T3) && d.includes('Có gói đang được đơn không dọn dùng')) && !csv.includes('xem lý do ở ví / đơn'));
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
    const doiTc = (/const doiTieuChi = [^\n]*/.exec(dt) || [''])[0];
    k('D12 đổi tiêu chí (ô ngày + ô SĐT qua doiTieuChi) → bỏ kết quả + bỏ dấu đã tải danh sách / sao lưu',
      /setKetQua\(null\)/.test(doiTc) && /setDaTaiDs\(false\)/.test(doiTc) && /setDaTaiSaoLuu\(false\)/.test(doiTc)
      && /type="date"[^>]*onChange=\{doiTieuChi\(setNgay\)\}/.test(dt) && /<textarea[^>]*onChange=\{doiTieuChi\(setOSdt\)\}/.test(dt), doiTc);
    k('D12 màn hiện SĐT giữ lại kèm lý do', /gl\.sdt/.test(dt) && /ly_do_sdt/.test(dt));
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
