#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ BH-CKTAY-1 — màn Bán hàng KHÔNG có ô "Chiết khấu" giảm tay (máy chủ không nhận mức giảm màn hình gửi)
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_BHCKTAY1.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến). Mã giao diện đọc từ <may-chu>/../client/src.
 *
 *  BO-MAN-CU-1 (chủ quán 11.11): màn cũ Sales.jsx đã xoá — bài soi màn Bán hàng duy nhất (pages/BanHang/). Thân đơn KHÔNG tự gõ:
 *  chạy THẬT thanTinhThu / thanPhien của BanHang/tinh.js (trạng thái "có / không mã") rồi gửi lên máy chủ thật qua phiên tiền mặt.
 *  Khuôn thu_KHACHCK1.js: database.js thật + libsql thật trên kho TẠM, SX giả.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const PAGES = path.join(MAY_CHU, '..', 'client', 'src', 'pages');
const BAN_HANG = path.join(PAGES, 'BanHang');
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
const sach = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

async function main() {
  const tep = fs.existsSync(BAN_HANG) ? fs.readdirSync(BAN_HANG).filter((n) => /\.(jsx?|js)$/.test(n)) : [];
  const nguon = tep.map((n) => sach(fs.readFileSync(path.join(BAN_HANG, n), 'utf8'))).join('\n');
  console.log('\nTHỬ BH-CKTAY-1 — màn Bán hàng không có ô Chiết khấu giảm tay');

  console.log('\n[A] nguồn màn Bán hàng (pages/BanHang/) không có ô / state / nhánh giảm tay');
  k('A0 đọc được BanHang/BanHangMoi.jsx + tinh.js', tep.includes('BanHangMoi.jsx') && tep.includes('tinh.js') && nguon.length > 5000);
  k('A1 không ô nhập nào ghi vào mức giảm (setDiscount / setDiscountType / setDiscountValue)', !/\bsetDiscount(Type|Value)?\s*\(/.test(nguon));
  k('A2 không state discount / discountType / discountValue', !/const \[discount(Type|Value)?,/.test(nguon) && !/\bdiscount(Type|Value)\b/.test(nguon));
  k('A3 không nhánh giảm % / đ cố định trên màn (discountType ===, value="fixed")', !/discountType\s*===/.test(nguon) && !/value="fixed"/.test(nguon));
  const moi = sach(fs.existsSync(path.join(BAN_HANG, 'BanHangMoi.jsx')) ? fs.readFileSync(path.join(BAN_HANG, 'BanHangMoi.jsx'), 'utf8') : '');
  k('A4 tổng trên màn lấy từ máy chủ (tinh-thu) khi có số', /const tong = coSo \? Math\.round\(mayChu\.total\) :/.test(moi));
  k('A6 (BO-MAN-CU-1) chỉ còn MỘT màn Bán hàng: không còn pages/Sales.jsx', !fs.existsSync(path.join(PAGES, 'Sales.jsx')));

  console.log('\n[B] thân màn hình gửi máy chủ: không trường giảm tay (chạy thật hàm của tinh.js)');
  let T = {};
  try { T = await import(pathToFileURL(path.join(BAN_HANG, 'tinh.js')).href); } catch (e) { k('B0 nạp tinh.js', false, e.message); }
  const gio = [{ key: 'a', product_id: 1, sx_product_type: 'a', sx_product_id: 1, unit_price: 50000, quantity: 2, note: '' }];
  const khach = { phone: '0900000001', name: 'A', discount_type: 'percent', discount_value: 10 };   // hồ sơ cũ có mức 10 %
  const GIAM = ['discount', 'discount_type', 'discount_value', 'discount_reason'];
  const khongMa = typeof T.thanTinhThu === 'function' ? T.thanTinhThu(gio, khach, '') : null;
  k('B2 không mã (khách hồ sơ cũ 10 %) → thân tinh-thu không có discount / discount_type / discount_value / discount_reason',
    !!khongMa && GIAM.every((x) => !(x in khongMa)) && !khongMa.discount_code, JSON.stringify(khongMa));
  const coMa = typeof T.thanTinhThu === 'function' ? T.thanTinhThu(gio, khach, 'giam15') : null;
  k('B3 (K5) có mã → thân gửi discount_code (chữ hoa), máy chủ tự tra mức; vẫn không trường giảm tay', !!coMa && coMa.discount_code === 'GIAM15'
    && GIAM.every((x) => !(x in coMa)), JSON.stringify(coMa));
  const phien = typeof T.thanPhien === 'function' ? T.thanPhien({ gio, khach, ma: '', cach: 'tien_mat', dungTK: false, dungMe: false }) : null;
  k('B4 phần `don` của phiên thu = đúng thân tinh-thu (một hàm, không bản lệch)', !!phien && JSON.stringify(phien.don) === JSON.stringify(khongMa), JSON.stringify(phien));

  console.log('\n[C] đơn không mã: thân do màn Bán hàng dựng → phiên tiền mặt → máy chủ ghi đúng tổng tinh-thu');
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
    app.use('/api/pos/thanh-toan', require(path.join(MAY_CHU, 'routes', 'thanh-toan.js')));
    const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
    const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
    const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
    const the = jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const goi = async (url, body) => {
      const r = await fetch(goc + url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + the } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    };
    await db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', ['flash_enabled', 'false']);
    const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
    await db.run('UPDATE pos_products SET price = 50000, is_special_group = 0 WHERE id = ?', [sp.id]);
    const gioThat = [{ ...gio[0], product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id }];
    const than = T.thanPhien({ gio: gioThat, khach: { name: 'Khách BHCKTAY1' }, ma: '', cach: 'tien_mat', dungTK: false, dungMe: false });
    const tt = await goi('/orders/tinh-thu', than.don);
    const p = await goi('/thanh-toan/phien', than);
    const c = p.phien ? await goi(`/thanh-toan/phien/${p.phien.id}/chot`, { cash_received: 100000 }) : { status: 0 };
    const luu = c.order ? await db.queryOne('SELECT total, discount_type, discount_value FROM pos_orders WHERE id = ?', [c.order.id]) : null;
    sv.close();
    noiLai();
    k('C1 tinh-thu giỏ 2 × 50.000 không mã = 100.000', tt.status === 200 && tt.total === 100000, `HTTP ${tt.status} · ${tt.total}`);
    k('C2 phiên tiền mặt với thân do màn Bán hàng dựng → chốt 200, tổng lưu = tinh-thu = 100.000, không mức giảm', c.status === 200 && luu
      && Number(luu.total) === 100000 && !luu.discount_type && !Number(luu.discount_value), `HTTP ${p.status}/${c.status}${c.error ? ' · ' + c.error : ''} · lưu ${JSON.stringify(luu)}`);
  } catch (e) { noiLai(); k('C: bài chạy hết mục', false, e.message); }

  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  console.log(`\n  ${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.error('BÀI SẬP:', e); process.exit(2); });
