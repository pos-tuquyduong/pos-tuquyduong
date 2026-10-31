#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ BH-CKTAY-1 — màn Bán hàng cũ bỏ hẳn ô "Chiết khấu" giảm tay
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_BHCKTAY1.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến, viec/BH-CKTAY-1/dot_bien.py). Mã giao diện đọc từ <may-chu>/../client/src.
 *
 *  Khuôn thu_KHACHCK1.js: database.js thật + libsql thật trên kho TẠM, SX giả. Thân đơn KHÔNG tự gõ: lấy đúng các biểu thức
 *  `discount*` trong orderData của Sales.jsx, chạy với trạng thái "chủ quán gõ 10 % vào ô, không có mã" rồi gửi lên máy chủ thật.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const SALES = path.join(MAY_CHU, '..', 'client', 'src', 'pages', 'Sales.jsx');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_bhcktay1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }),
    diaChiSX: () => '', FILE_THU: FILE_KHO },
};
process.env.JWT_SECRET = 'thu_bhcktay1_' + Date.now();

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };

async function main() {
  const sa = fs.existsSync(SALES) ? fs.readFileSync(SALES, 'utf8') : '';
  console.log('\nTHỬ BH-CKTAY-1 — bỏ ô Chiết khấu giảm tay ở màn Bán hàng cũ');

  console.log('\n[A] nguồn Sales.jsx không còn ô / state / nhánh giảm tay');
  k('A0 đọc được Sales.jsx', sa.length > 1000);
  k('A1 không ô nhập nào ghi vào mức giảm (setDiscount / setDiscountType / setDiscountValue)', !/\bsetDiscount(Type|Value)?\s*\(/.test(sa));
  k('A2 không còn state discount / discountType / discountValue', !/const \[discount(Type|Value)?,/.test(sa) && !/\bdiscount(Type|Value)\b/.test(sa));
  k('A3 không còn nhánh cộng giảm ngoài mã (discount > 0, nhánh % / đ cố định)', !/\bdiscount\s*>\s*0/.test(sa)
    && !/discountType\s*===/.test(sa) && !/value="fixed"/.test(sa));
  k('A4 giảm trên màn chỉ từ mã / máy chủ: discountAmount = số tinh-thu hoặc discount_amount của mã',
    /discountAmount = discountCodeValid\.discount_amount \|\| 0;/.test(sa) && /tinhThu \? tinhThu\.discount_amount/.test(sa));

  console.log('\n[B] thân đơn giữ đủ khoá, giá trị giảm tay = 0');
  const orderData = (sa.match(/const orderData = \{([\s\S]*?)\n      \};/) || [])[1] || '';
  const bieuThuc = Object.fromEntries([...orderData.matchAll(/^\s{8}(discount|discount_type|discount_value):\s*(.*),$/gm)].map((x) => [x[1], x[2]]));
  k('B1 orderData còn đủ ba khoá discount / discount_type / discount_value', Object.keys(bieuThuc).length === 3, Object.keys(bieuThuc).join(','));
  let than = {};
  try {
    // Trạng thái "đã gõ 10 % vào ô, không mã": tên cũ truyền vào, mã bản mới không dùng tới nên bỏ qua.
    // eslint-disable-next-line no-new-func
    than = new Function('discountCodeValid', 'discountType', 'discountValue', 'discount', 'discountAmount',
      `return { discount: ${bieuThuc.discount}, discount_type: ${bieuThuc.discount_type}, discount_value: ${bieuThuc.discount_value} };`)(
      null, 'percent', 10, 0, 5000);
  } catch (e) { than = { loi: e.message }; }
  k('B2 không mã, ô từng gõ 10 % → discount 0, discount_type null, discount_value 0', than.discount === 0 && than.discount_type === null && than.discount_value === 0, JSON.stringify(than));
  let coMa = {};
  try {
    coMa = new Function('discountCodeValid', 'discountType', 'discountValue', 'discount', 'discountAmount',
      `return { discount_type: ${bieuThuc.discount_type}, discount_value: ${bieuThuc.discount_value} };`)(
      { valid: true, discount_type: 'percent', discount_value: 15 }, 'fixed', 99, 0, 0);
  } catch (e) { coMa = { loi: e.message }; }
  k('B3 (K5) có mã hợp lệ → vẫn gửi discount_type / discount_value của mã như cũ', coMa.discount_type === 'percent' && coMa.discount_value === 15, JSON.stringify(coMa));

  console.log('\n[C] đơn không mã: thân do Sales.jsx dựng → máy chủ nhận, tổng = tinh-thu');
  try {
    imLang();
    const express = require(path.join(GOC, 'node_modules', 'express'));
    const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
    const db = require(path.join(MAY_CHU, 'database.js'));
    await db.initDatabase();
    const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
    const sxThat = require(duongSX);
    const sxGia = async () => ({ ok: true });
    require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true,
      checkStock: async () => ({ sufficient: true, stock: 999 }), outStockFIFO: sxGia, inStockReturn: sxGia, callSxApi: sxGia };
    const app = express();
    app.use(express.json());
    app.use('/api/pos/orders', require(path.join(MAY_CHU, 'routes', 'orders.js')));
    const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
    const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
    const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
    const the = jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const goi = async (url, body) => {
      const r = await fetch(goc + url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + the } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    };
    for (const [key, v] of [['flash_enabled', 'false'], ['thanh_toan_payos_bat_buoc', '0']]) await db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, v]);
    const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
    await db.run('UPDATE pos_products SET price = 50000, is_special_group = 0 WHERE id = ?', [sp.id]);
    const don = { customer_name: 'Khách BHCKTAY1', items: [{ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: 2 }] };
    const tt = await goi('/orders/tinh-thu', don);
    const r = await goi('/orders', { ...don, ...than, payment_method: 'cash', cash_amount: tt.total });
    const luu = r.order ? await db.queryOne('SELECT total FROM pos_orders WHERE id = ?', [r.order.id]) : null;
    sv.close();
    noiLai();
    k('C1 tinh-thu giỏ 2 × 50.000 không mã = 100.000', tt.status === 200 && tt.total === 100000, `HTTP ${tt.status} · ${tt.total}`);
    k('C2 POST đơn với thân dựng từ Sales.jsx → 200, tổng lưu = tổng tinh-thu = 100.000 (không "tổng lệch")',
      r.status === 200 && luu && Number(luu.total) === 100000, `HTTP ${r.status}${r.error ? ' · ' + r.error : ''} · lưu ${luu && luu.total}`);
  } catch (e) { noiLai(); k('C: bài chạy hết mục', false, e.message); }

  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  console.log(`\n  ${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.error('BÀI SẬP:', e); process.exit(2); });
