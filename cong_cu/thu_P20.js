#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ P20 — mã trên bill chỉ dùng được khi bill ĐÃ THANH TOÁN
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ POS-P20-v1. Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_P20.js
 *
 *  CHẠY THẬT, không stub tầng dữ liệu: database.js thật + libsql thật trên một
 *  file kho TẠM (thư mục tạm của hệ điều hành, xoá khi xong). Chỉ thay
 *  ketNoiKho (nơi DUY NHẤT quyết định kết nối — P8) để trỏ vào file tạm, và
 *  tắt SX. Không đụng data/pos_thu.db, không đụng Turso.
 *
 *  Đơn được tạo qua POST /orders THẬT → payment_status là của máy chủ tự tính,
 *  không phải do bài thử tự đặt. Bill chờ thu được thu qua pay-debt THẬT.
 *
 *  Chỉ so HTTP status và `code` — không dò chữ trong lời báo (E12).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_p20_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

// ── Thay ketNoiKho TRƯỚC khi bất kỳ module nào require nó ─────────────────
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: {
    laMayThu: () => true,
    cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }),
    diaChiSX: () => '',          // SX tắt → checkStock/outStock chạy chế độ degraded
    FILE_THU: FILE_KHO,
  },
};
process.env.JWT_SECRET = 'thu_p20_' + Date.now();
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_p20';

const C = { do: '\x1b[31m', xanh: '\x1b[32m', mo: '\x1b[2m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); }
  else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);

// Log của máy chủ (tạo đơn, SX tắt…) không phải kết quả thử — gom lại cho gọn.
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  await db.initDatabase();

  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(path.join(GOC, 'server', 'routes', 'orders.js')));
  app.use('/api/pos/signup-codes', require(path.join(GOC, 'server', 'routes', 'signup-codes.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();

  // ── Dữ liệu nền ──────────────────────────────────────────────────────────
  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const token = jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const datCaiDat = async (key, value) => db.run(
    `INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, value]);
  await datCaiDat('signup_enabled', '1');
  await datCaiDat('signup_discount_type', 'percent');
  await datCaiDat('signup_discount_value', '10');
  await datCaiDat('nhandiem_enabled', '1');
  await datCaiDat('loyalty_enabled', 'true');
  await datCaiDat('loyalty_earn_per_amount', '10000');
  await datCaiDat('flash_enabled', 'false');

  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 25000 WHERE id = ?', [sp.id]);
  const mon = (sl = 1, tuGoi = false) =>
    ({ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: sl, from_package: tuGoi });

  let soSdt = 0;
  const sdtMoi = () => '09' + String(10000000 + (++soSdt)).padStart(8, '0');
  const napVi = async (phone, soTien) => db.run(
    `INSERT INTO pos_wallets (phone, balance, total_topup, total_spent, created_at, updated_at)
     VALUES (?, ?, ?, 0, datetime('now'), datetime('now'))`, [phone, soTien, soTien]);

  const goi = async (method, url, body, dichVu = false) => {
    const headers = { 'Content-Type': 'application/json' };
    if (dichVu) headers['X-Service-Key'] = process.env.POS_SERVICE_API_KEY;
    else headers.Authorization = 'Bearer ' + token;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
      let j = {}; try { j = await r.json(); } catch { /* body không phải JSON */ }
      return { status: r.status, ...j };
    } finally { noiLai(); }
  };

  // Tạo đơn qua POST /orders thật. Trả { id, ma, trangThaiTien } đọc lại từ DB.
  const taoDon = async (ten, body) => {
    const r = await goi('POST', '/orders', body);
    if (!r.success) throw new Error(`Không tạo được đơn "${ten}": ${r.status} ${r.error || ''}`);
    const o = await db.queryOne('SELECT id, payment_status, status FROM pos_orders WHERE id = ?', [r.order.id]);
    if (!r.order.signup_code) throw new Error(`Đơn "${ten}" không được phát mã in bill`);
    return { id: o.id, ma: r.order.signup_code, trangThaiTien: o.payment_status };
  };
  const claim = (ma) => goi('POST', '/signup-codes/claim', { code: ma, phone: sdtMoi() }, true);
  const nhanDiem = (ma) => goi('POST', '/signup-codes/nhan-diem', { code: ma, phone: sdtMoi() }, true);
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] Bill CHƯA thanh toán → phải bị chặn, mã BILL_CHUA_THANH_TOAN');
  {
    const d1 = await taoDon('chờ thu 1', { items: [mon()], payment_method: 'cho_thu', debt_amount: 25000 });
    k(`đơn "mang ra bàn chưa thu" có payment_status = pending (máy chủ tự tính)`, d1.trangThaiTien === 'pending', d1.trangThaiTien);
    const r1 = await claim(d1.ma);
    k('/claim với bill chờ thu → 400 BILL_CHUA_THANH_TOAN', r1.status === 400 && r1.code === 'BILL_CHUA_THANH_TOAN', moTa(r1));

    const d2 = await taoDon('chờ thu 2', { items: [mon()], payment_method: 'cho_thu', debt_amount: 25000 });
    const r2 = await nhanDiem(d2.ma);
    k('/nhan-diem với bill chờ thu → 400 BILL_CHUA_THANH_TOAN', r2.status === 400 && r2.code === 'BILL_CHUA_THANH_TOAN', moTa(r2));

    const sdt3 = sdtMoi(); await napVi(sdt3, 10000);
    const d3 = await taoDon('kết hợp còn nợ', {
      customer_phone: sdt3, customer_name: 'Khách nợ', items: [mon()], payment_method: 'debt',
      balance_amount: 10000, debt_amount: 15000 });
    k('đơn trả kết hợp còn nợ có payment_status = partial', d3.trangThaiTien === 'partial', d3.trangThaiTien);
    const r3 = await claim(d3.ma);
    k('/claim với đơn kết hợp còn nợ → 400 BILL_CHUA_THANH_TOAN', r3.status === 400 && r3.code === 'BILL_CHUA_THANH_TOAN', moTa(r3));

    const sdt4 = sdtMoi();
    const d4 = await taoDon('ghi nợ khách quen', {
      customer_phone: sdt4, customer_name: 'Khách quen', items: [mon()], payment_method: 'debt', debt_amount: 25000 });
    const r4 = await nhanDiem(d4.ma);
    k('/nhan-diem với đơn ghi nợ → 400 BILL_CHUA_THANH_TOAN', r4.status === 400 && r4.code === 'BILL_CHUA_THANH_TOAN', moTa(r4));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] Đơn ĐÃ HUỶ → /claim phải chặn (trước đây /claim không đọc đơn)');
  {
    const d = await taoDon('sẽ huỷ', { items: [mon()], payment_method: 'cash', cash_amount: 25000 });
    const h = await goi('PUT', `/orders/${d.id}/cancel`, { reason: 'thử P20' });
    k('huỷ đơn qua PUT /cancel thật', h.status === 200, moTa(h));
    const r = await claim(d.ma);
    k('/claim với đơn đã huỷ → 400 DON_DA_HUY', r.status === 400 && r.code === 'DON_DA_HUY', moTa(r));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] Mã KHÔNG gắn đơn → /claim phải chặn như /nhan-diem vẫn chặn');
  {
    await db.run(`INSERT INTO pos_signup_codes (code, order_id, issued_at) VALUES ('P20KHONGDON', NULL, ?)`,
      [require(path.join(GOC, 'server', 'utils', 'helpers.js')).getNow()]);
    const r = await claim('P20KHONGDON');
    k('/claim với mã order_id NULL → 400 MA_KHONG_GAN_DON', r.status === 400 && r.code === 'MA_KHONG_GAN_DON', moTa(r));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] K5 — luồng HỢP LỆ phải KHÔNG bị chặn (cả /claim lẫn /nhan-diem)');
  const phaiQua = async (ten, d, nhanDiemMongDoi = 200) => {
    k(`${ten}: payment_status = paid`, d.trangThaiTien === 'paid', d.trangThaiTien);
    const a = await claim(d.ma);
    k(`${ten}: /claim → 200`, a.status === 200 && a.success === true, moTa(a));
    const b = await nhanDiem(d.ma);
    if (nhanDiemMongDoi === 200) k(`${ten}: /nhan-diem → 200`, b.status === 200 && b.success === true, moTa(b));
    else k(`${ten}: /nhan-diem → ${nhanDiemMongDoi} (luật CŨ, không phải P20)`, b.code === nhanDiemMongDoi, moTa(b));
  };
  {
    await phaiQua('thu ngay tiền mặt',
      await taoDon('tiền mặt', { items: [mon()], payment_method: 'cash', cash_amount: 25000, cash_received: 50000 }));
    await phaiQua('thu ngay chuyển khoản',
      await taoDon('chuyển khoản', { items: [mon()], payment_method: 'transfer', transfer_amount: 25000 }));

    const sdtVi = sdtMoi(); await napVi(sdtVi, 100000);
    await phaiQua('trả bằng ví',
      await taoDon('ví', { customer_phone: sdtVi, customer_name: 'Khách ví', items: [mon()], payment_method: 'balance', balance_amount: 25000 }));

    // Chiết khấu do MÁY CHỦ tự tra từ hồ sơ khách (orders.js POS-CONGDON-v1 · LO 2),
    // không nhận mức giảm client gửi — nên phải tạo khách có chiết khấu riêng.
    const sdtCK = sdtMoi();
    await db.run(`INSERT INTO pos_customers (phone, name, discount_type, discount_value) VALUES (?, 'Khách CK', 'fixed', 5000)`, [sdtCK]);
    await phaiQua('có chiết khấu',
      await taoDon('chiết khấu', { customer_phone: sdtCK, customer_name: 'Khách CK', items: [mon()], payment_method: 'cash', cash_amount: 20000 }));

    const sdtKH = sdtMoi(); await napVi(sdtKH, 10000);
    await phaiQua('trả kết hợp đủ tiền (ví + tiền mặt)',
      await taoDon('kết hợp đủ', { customer_phone: sdtKH, customer_name: 'Khách KH', items: [mon()], payment_method: 'mixed',
        balance_amount: 10000, cash_amount: 15000 }));

    // Lấy từ gói 0đ — gói thật trong pos_customer_packages.
    const sdtGoi = sdtMoi();
    const pk = await db.run(`INSERT INTO pos_packages (code, name, price, is_active) VALUES ('GOI_P20', 'Gói thử P20', 0, 1)`);
    const cp = await db.run(
      `INSERT INTO pos_customer_packages (customer_phone, package_id, status, total_qty, delivered_qty, created_at)
       VALUES (?, ?, 'active', 10, 0, datetime('now'))`, [sdtGoi, Number(pk.lastInsertRowid)]);
    await phaiQua('lấy từ gói 0đ',
      await taoDon('từ gói', { customer_phone: sdtGoi, customer_name: 'Khách gói', items: [mon(1, true)], payment_method: 'cash',
        customer_package_id: Number(cp.lastInsertRowid) }),
      'DON_KHONG_DU_DIEM');   // đơn 0đ không có điểm để nhân — luật có từ trước P20

    // Bill chờ thu → thu qua pay-debt THẬT → dùng được.
    const dCho = await taoDon('chờ thu rồi thu', { items: [mon()], payment_method: 'cho_thu', debt_amount: 25000 });
    const t = await goi('POST', `/orders/${dCho.id}/pay-debt`, { payment_method: 'cash' });
    k('pay-debt bill chờ thu → 200', t.status === 200, moTa(t));
    dCho.trangThaiTien = (await db.queryOne('SELECT payment_status FROM pos_orders WHERE id = ?', [dCho.id])).payment_status;
    await phaiQua('bill chờ thu SAU KHI pay-debt thu đủ', dCho);

    // Đơn kết hợp còn nợ → thu nốt → dùng được.
    const sdtNo = sdtMoi(); await napVi(sdtNo, 10000);
    const dNo = await taoDon('còn nợ rồi thu nốt', {
      customer_phone: sdtNo, customer_name: 'Khách nợ 2', items: [mon()], payment_method: 'debt', balance_amount: 10000, debt_amount: 15000 });
    const t2 = await goi('POST', `/orders/${dNo.id}/pay-debt`, { payment_method: 'transfer' });
    k('pay-debt thu nốt đơn kết hợp → 200', t2.status === 200, moTa(t2));
    dNo.trangThaiTien = (await db.queryOne('SELECT payment_status FROM pos_orders WHERE id = ?', [dNo.id])).payment_status;
    await phaiQua('đơn kết hợp SAU KHI thu nốt nợ', dNo);
  }

  sv.close();
  console.log(`\n  ${C.dam}${dat} đạt · ${hong} hỏng${C.het}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai();
  console.error(`\n${C.do}✖ Bài thử sập: ${e.message}${C.het}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
