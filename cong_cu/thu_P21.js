#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ P21 — gọi route reconcile (chưa có màn hình nào gọi) chỉ cộng các loại dòng thuộc DANH SÁCH TRẮNG
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ POS-P21-v1. Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_P21.js
 *
 *  Lỗi: reconcileWallet đặt số dư = SUM(amount) của MỌI dòng trong
 *  pos_balance_transactions. pay-debt ghi dòng 'debt_payment' mang số DƯƠNG —
 *  tiền khách trả nợ bằng tiền mặt/chuyển khoản, KHÔNG phải tiền trong ví.
 *  Gọi route reconcile (chưa có màn hình nào gọi) là ví khách được cộng khống đúng số nợ đã trả.
 *
 *  Chạy thật như thu_P20.js: database.js + libsql trên file kho TẠM; nạp ví,
 *  tạo đơn, thu nợ, huỷ đơn, điều chỉnh, đền bù đều qua ROUTE THẬT — bài thử
 *  không tự chèn dòng sổ nào.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_p21_'));
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
process.env.JWT_SECRET = 'thu_p21_' + Date.now();
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_p21';

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
  app.use('/api/pos/wallets', require(path.join(GOC, 'server', 'routes', 'wallets.js')));
  app.use('/api/pos/damages', require(path.join(GOC, 'server', 'routes', 'damages.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();

  // ── Dữ liệu nền ──────────────────────────────────────────────────────────
  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const token = jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const datCaiDat = async (key, value) => db.run(
    `INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, value]);
  await datCaiDat('flash_enabled', 'false');
  await datCaiDat('loyalty_enabled', 'false');

  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 19000 WHERE id = ?', [sp.id]);
  const mon = () => ({ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: 1 });

  let soSdt = 0;
  const sdtMoi = () => '09' + String(20000000 + (++soSdt)).padStart(8, '0');

  const goi = async (method, url, body) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: body ? JSON.stringify(body) : undefined });
      let j = {}; try { j = await r.json(); } catch { /* body không phải JSON */ }
      return { status: r.status, ...j };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.error ? ' · ' + r.error : ''}`;
  const buoc = async (ten, p) => { const r = await p; if (r.status !== 200) throw new Error(`${ten}: ${moTa(r)}`); return r; };

  const soDu = async (phone) => (await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [phone]))?.balance ?? null;
  const napVi = (phone, soTien) => buoc('nạp ví', goi('POST', '/wallets/topup', { phone, amount: soTien, customer_name: 'Khách', payment_method: 'cash' }));
  const taoDon = async (ten, body) => (await buoc('tạo đơn ' + ten, goi('POST', '/orders', body))).order;
  // Đơn ghi nợ 19.000đ rồi thu nợ bằng tiền mặt qua pay-debt THẬT → sinh dòng debt_payment +19.000.
  const noRoiThu = async (phone) => {
    const d = await taoDon('ghi nợ', { customer_phone: phone, customer_name: 'Khách', items: [mon()], payment_method: 'debt', debt_amount: 19000 });
    await buoc('pay-debt', goi('POST', `/orders/${d.id}/pay-debt`, { payment_method: 'cash' }));
    const c = await db.queryOne(`SELECT COUNT(*) AS n FROM pos_balance_transactions WHERE customer_phone = ? AND type = 'debt_payment'`, [phone]);
    if (!c.n) throw new Error('pay-debt không sinh dòng debt_payment — bài thử không còn đo đúng chỗ');
  };

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] Ví 50.000đ + đã thu nợ 19.000đ tiền mặt → đối soát phải giữ 50.000đ');
  {
    const sdt = sdtMoi();
    await napVi(sdt, 50000);
    await noRoiThu(sdt);
    k('trước đối soát: ví = 50.000đ (thu nợ không đụng ví)', await soDu(sdt) === 50000, String(await soDu(sdt)));
    const r = await goi('POST', `/wallets/${sdt}/reconcile`);
    k('POST /wallets/:phone/reconcile → 200', r.status === 200, moTa(r));
    k('sau đối soát 1 khách: ví vẫn 50.000đ (không cộng khống 19.000đ)', await soDu(sdt) === 50000, `ví = ${await soDu(sdt)}`);

    const sdt2 = sdtMoi();
    await napVi(sdt2, 50000);
    await noRoiThu(sdt2);
    const r2 = await goi('POST', '/wallets/reconcile-all');
    k('POST /wallets/reconcile-all → 200', r2.status === 200, moTa(r2));
    k('sau khi gọi route reconcile (chưa có màn hình nào gọi) toàn bộ: ví vẫn 50.000đ', await soDu(sdt2) === 50000, `ví = ${await soDu(sdt2)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] Khách CHỈ có thu nợ, chưa từng có ví → gọi route reconcile (chưa có màn hình nào gọi) không được đẻ ra ví');
  {
    const sdt = sdtMoi();
    await noRoiThu(sdt);
    k('trước: khách chưa có ví', await soDu(sdt) === null, String(await soDu(sdt)));
    const r = await goi('POST', '/wallets/reconcile-all');
    k('reconcile-all → 200', r.status === 200, moTa(r));
    const v = await soDu(sdt);
    k('sau: không có ví nào mang tiền thu nợ', v === null || v === 0, `ví = ${v}`);
    k('sau: không tạo dòng ví mới cho khách chỉ có nợ', v === null, `ví = ${v}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] K5 — ví có đủ 5 loại TRẮNG: đối soát phải KHÔNG đổi số dư đang đúng');
  {
    const sdt = sdtMoi();
    await napVi(sdt, 100000);                                                   // topup +100.000
    const dVi = await taoDon('trả ví', { customer_phone: sdt, customer_name: 'Khách', items: [mon()],
      payment_method: 'balance', balance_amount: 19000 });                      // purchase −19.000
    const dHuy = await taoDon('trả ví sẽ huỷ', { customer_phone: sdt, customer_name: 'Khách', items: [mon()],
      payment_method: 'balance', balance_amount: 19000 });                      // purchase −19.000
    await buoc('huỷ đơn', goi('PUT', `/orders/${dHuy.id}/cancel`, { reason: 'thử P21' }));   // refund +19.000
    await buoc('điều chỉnh', goi('POST', '/wallets/adjust', { phone: sdt, amount: -3000, customer_name: 'Khách', reason: 'thử P21' })); // adjust −3.000
    const it = await db.queryOne('SELECT product_code FROM pos_order_items WHERE order_id = ?', [dVi.id]);
    await buoc('đền bù', goi('POST', '/damages', { order_id: dVi.id, product_code: it.product_code, quantity: 1,
      reason: 'quality', action: 'refund', refund_amount: 7000 }));             // compensation +7.000
    await noRoiThu(sdt);                                                        // debt_payment +19.000 (KHÔNG tính)

    const loai = (await db.query(`SELECT DISTINCT type FROM pos_balance_transactions WHERE customer_phone = ?`, [sdt]))
      .map((x) => x.type).sort().join(',');
    k('sổ của khách có đủ 6 loại (5 trắng + debt_payment)',
      loai === 'adjust,compensation,debt_payment,purchase,refund,topup', loai);
    const truoc = await soDu(sdt);
    k('trước đối soát: ví = 100.000 − 19.000 − 19.000 + 19.000 − 3.000 + 7.000 = 85.000đ', truoc === 85000, String(truoc));
    await buoc('reconcile', goi('POST', `/wallets/${sdt}/reconcile`));
    k('sau đối soát: ví vẫn 85.000đ', await soDu(sdt) === 85000, `ví = ${await soDu(sdt)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] K5 — ví trôi thật (không có debt_payment) → đối soát VẪN phải sửa về đúng sổ');
  {
    const sdt = sdtMoi();
    await napVi(sdt, 40000);
    await db.run('UPDATE pos_wallets SET balance = 99999 WHERE phone = ?', [sdt]);   // giả lập số dư trôi
    const r = await goi('POST', `/wallets/${sdt}/reconcile`);
    k('reconcile → 200', r.status === 200, moTa(r));
    k('ví trôi 99.999đ được kéo về đúng sổ 40.000đ', await soDu(sdt) === 40000, `ví = ${await soDu(sdt)}`);
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
