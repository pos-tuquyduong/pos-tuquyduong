#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KH-TOMTAT-1 — Lịch sử đơn App có tóm tắt thật: kenh, cach_nhan, tra[], so_mon, mon_dau, giam (GET /api/kh/don và /don/:ma)
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có 6 trường). Chạy ở GỐC kho POS: node cong_cu/thu_KHTOMTAT1.js
 *  --goc <thư mục>: chạy trên bản sao cây kho (đột biến, viec/KH-TOMTAT-1/dot_bien.py). Mặc định: cây chứa file này.
 *
 *  Khuôn thu_HDKH1.js (kho thử libsql thật, payOS giả 127.0.0.1). Số mong đợi viết cứng từ giá thử 25.000 / 30.000 / 20.000, hoặc đọc từ
 *  cửa quầy GET /api/pos/hoa-don/:id (hoá đơn in) — không đọc lại từ chính hàm đang thử.
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const iG = process.argv.indexOf('--goc');
const GOC = path.resolve(iG > 0 ? process.argv[iG + 1] : path.join(__dirname, '..'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khtomtat1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_khtomtat1_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_khtomtat1_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.khtomtat1.local/tra-ve';

let dat = 0, hong = 0, soCa = 0;
const k = (ten, dung, them = '') => {
  soCa++;
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = console.error = console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const chuoiKy = (d) => Object.keys(d).sort().map((x) => `${x}=${d[x] == null ? '' : d[x]}`).join('&');
const hmac = (s) => crypto.createHmac('sha256', KHOA.ck).update(s).digest('hex');
const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const soTu = (s) => Number(String(s).replace(/\D/g, ''));
const TRUONG_MOI = ['kenh', 'cach_nhan', 'tra', 'so_mon', 'mon_dau', 'giam'];

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();
  const sx = require(path.join(GOC, 'server', 'utils', 'sxApi.js'));
  sx.checkStock = async () => ({ sufficient: true });

  const gia = express();
  gia.use(express.json());
  gia.post('/v2/payment-requests', (req, res) => {
    const data = { orderCode: req.body.orderCode, amount: req.body.amount, description: req.body.description, status: 'PENDING',
      paymentLinkId: 'pl_' + req.body.orderCode, qrCode: 'QR_GIA_' + req.body.orderCode, checkoutUrl: 'https://gia/' + req.body.orderCode };
    res.json({ code: '00', desc: 'success', data, signature: hmac(chuoiKy(data)) });
  });
  const svGia = await new Promise((ok) => { const s = gia.listen(0, '127.0.0.1', () => ok(s)); });
  process.env.PAYOS_BASE_URL = `http://127.0.0.1:${svGia.address().port}`;

  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/wallets', require(R('wallets.js')));
  app.use('/api/pos/settings', require(R('settings.js')));
  app.use('/api/pos/hoa-don', require(R('hoaDon.js')));
  const tt = require(R('thanh-toan.js'));
  app.use('/api/pos/thanh-toan', tt);
  app.use('/api/payos/webhook', tt.webhook);
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const { kyTokenKhach } = require(path.join(GOC, 'server', 'middleware', 'khachAuth.js'));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  const datCaiDat = (key, value) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(value), getNow()]);
  for (const [a, b] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['flash_enabled', 'false'], ['signup_enabled', '0'],
    ['thanh_toan_payos_bat_buoc', '0'], ['store_name', 'Quán Thử TT']]) await datCaiDat(a, b);
  const sps = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 3');
  for (let i = 0; i < 3; i++) await db.run('UPDATE pos_products SET price = ?, ton_gan_nhat = NULL WHERE id = ?', [[25000, 30000, 20000][i], sps[i].id]);
  const ma = (i) => `${sps[i].sx_product_type}_${sps[i].sx_product_id}`;
  const monQuay = (i, sl = 1) => ({ product_id: sps[i].id, sx_product_type: sps[i].sx_product_type, sx_product_id: sps[i].sx_product_id, quantity: sl });

  const goi = async (method, url, body, tk) => {
    const headers = body !== undefined ? { 'Content-Type': 'application/json' } : {};
    if (tk) headers.Authorization = 'Bearer ' + tk;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      return { status: r.status, j, tho };
    } finally { noiLai(); }
  };
  let soSdt = 0;
  const khach = async (napVi = 0, pin = '1357') => {
    const sdt = '09' + String(63000000 + (++soSdt)).padStart(8, '0');
    const id = Number((await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + sdt, getNow()])).lastInsertRowid);
    if (napVi) await goi('POST', '/pos/wallets/topup', { phone: sdt, amount: napVi }, tkChu);
    if (pin) await goi('POST', '/pos/thanh-toan/pin', { phone: sdt, pin, pin_lai: pin }, tkChu);
    return { sdt, id, tk: kyTokenKhach(id) };
  };
  let soKhoa = 0;
  const khoaMoi = () => 'khoa-thu-' + String(++soKhoa).padStart(8, '0') + '-' + ngauNhien().slice(0, 6);
  const gio = () => ({ mon: [{ ma: ma(0), so_luong: 2, ghi_chu: 'ít đá' }], cach_nhan: 'tai_quan' });
  const datApp = async (kh, cachTra, them = {}) => {
    const than = gio();
    const bg = await goi('POST', '/kh/gio/bao-gia', than, kh.tk);
    return goi('POST', '/kh/don', { ...than, khoa_gui: khoaMoi(), cach_tra: cachTra, tong_da_xem: bg.j.tong, ...them }, kh.tk);
  };
  const phienCua = async (maDon) => {
    const a = await db.queryOne('SELECT * FROM pos_don_app WHERE ma = ?', [maDon]);
    return db.queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [a.phien_id]);
  };
  let soRef = 0;
  const webhook = (p) => {
    const data = { orderCode: p.ma_payos, amount: p.con_lai, description: p.noi_dung || 'x', accountNumber: '12345678', reference: 'REF' + (++soRef),
      transactionDateTime: getNow().replace('T', ' '), currency: 'VND', paymentLinkId: 'pl_' + p.ma_payos, code: '00', desc: 'success',
      counterAccountBankId: '', counterAccountName: null };
    return goi('POST', '/payos/webhook', { code: '00', desc: 'success', success: true, data, signature: hmac(chuoiKy(data)) });
  };
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.stack || e.message); } };
  const quay = async (kh, than) => {
    const tinh = await goi('POST', '/pos/orders/tinh-thu', { customer_phone: kh.sdt, ...than }, tkChu);
    const r = await goi('POST', '/pos/orders', { payment_method: 'cash', cash_amount: tinh.j.total, customer_phone: kh.sdt, customer_name: 'Chị Hoa', ...than }, tkChu);
    if (!r.j.order) logGoc('  (đơn quầy không tạo được)', r.status, r.tho.slice(0, 200));
    return r.j.order;
  };
  /** Chỉnh cột tiền của đơn quầy (đơn thật chỉ có cách trả tiền mặt ở bài này; ví / QR dựng bằng cột như quầy ghi). */
  const datCot = (oid, cot) => db.run(`UPDATE pos_orders SET ${Object.keys(cot).map((c) => c + ' = ?').join(', ')} WHERE id = ?`, [...Object.values(cot), oid]);
  const tenDau = async (oid) => (await db.queryOne('SELECT product_name AS n FROM pos_order_items WHERE order_id = ? ORDER BY id LIMIT 1', [oid]))?.n;

  /** Đọc đơn ở CẢ hai cửa; mong = { trường: giá trị }. Trả chi tiết. */
  const kiem = async (ten, kh, maDon, mong) => {
    const ct = await goi('GET', `/kh/don/${maDon}`, undefined, kh.tk);
    const ds = await goi('GET', '/kh/don', undefined, kh.tk);
    const trongDs = (ds.j.data || []).find((d) => d.ma === maDon);
    const lech = (x) => Object.entries(mong).filter(([f, v]) => !bang(x?.[f], v)).map(([f]) => `${f}=${JSON.stringify(x?.[f])}`);
    k(`${ten}: /don/:ma và /don cùng ${Object.keys(mong).join(', ')}`, ct.status === 200 && !lech(ct.j.don).length && !lech(trongDs).length,
      `chi tiết lệch ${lech(ct.j.don)} · danh sách lệch ${lech(trongDs)} · mong ${JSON.stringify(mong)}`);
    return ct.j.don || {};
  };
  const tienGiamTrenTo = (hd) => (hd || []).filter((d) => ['giam_hang', 'giam_flash', 'giam_ma'].includes(d.loai)).reduce((s, d) => s + soTu(d.phai), 0);
  const traCuaQuay = async (oid) => (await goi('GET', `/pos/hoa-don/${oid}`, undefined, tkChu)).j.hoa_don.thanh_toan.filter((x) => x.loai !== 'ghi_no').map((x) => ({ cach: x.loai, so_tien: x.so_tien }));

  const hangId = Number((await db.run(`INSERT INTO pos_membership_tiers (name, card_price, discount_percent, special_discount_percent, sort_order, is_active)
    VALUES ('Vàng thử', 1000, 10, 5, 9, 1)`)).lastInsertRowid);
  const choHang = (sdt) => db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
    VALUES (?, ?, 'Vàng thử', 1000, NULL, ?, datetime('now', '+7 hours', '+300 days'))`, [sdt, hangId, getNow()]);
  await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, usage_limit, used_count, is_active) VALUES ('THUTT', 'fixed', 5000, 0, 0, 1)`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] đơn quầy: kenh · cach_nhan · tra[] · so_mon · mon_dau · giam — đúng giá trị ở CẢ GET /don và GET /don/:ma');
  await chay('A', async () => {
    const kh = await khach(0, null);
    const o1 = await quay(kh, { items: [monQuay(0, 2)] });
    const ten0 = await tenDau(o1.id);
    k('A0 tên món đầu lấy từ đơn thật có mặt', !!ten0, String(ten0));
    await kiem('A1 tiền mặt 2 ly 50.000', kh, o1.code, { kenh: 'quay', cach_nhan: 'tai_quan', tra: [{ cach: 'tien_mat', so_tien: 50000 }], so_mon: 2, mon_dau: ten0, giam: 0 });

    const o2 = await quay(kh, { items: [monQuay(1, 1), monQuay(2, 2)] });
    await datCot(o2.id, { payment_method: 'transfer', cash_amount: 0, transfer_amount: 70000 });
    await kiem('A2 chuyển khoản / QR 70.000, 3 món, món đầu là món thứ nhất', kh, o2.code,
      { kenh: 'quay', tra: [{ cach: 'chuyen_khoan', so_tien: 70000 }], so_mon: 3, mon_dau: await tenDau(o2.id), giam: 0 });

    const o3 = await quay(kh, { items: [monQuay(0, 2)] });
    await datCot(o3.id, { payment_method: 'balance', cash_amount: 0, balance_amount: 50000 });
    await kiem('A3 trả ví 50.000', kh, o3.code, { tra: [{ cach: 'tai_khoan', so_tien: 50000 }], giam: 0 });

    const o4 = await quay(kh, { items: [monQuay(0, 2)] });
    await datCot(o4.id, { payment_method: 'balance', cash_amount: 0, balance_amount: 20000, transfer_amount: 30000 });
    await kiem('A4 ví + QR → HAI dòng tra[] (ví 20.000 trước, QR 30.000 sau)', kh, o4.code,
      { tra: [{ cach: 'tai_khoan', so_tien: 20000 }, { cach: 'chuyen_khoan', so_tien: 30000 }] });

    const o5 = await quay(kh, { items: [monQuay(0, 2)] });
    await datCot(o5.id, { cash_amount: 40000, debt_amount: 10000 });
    const d5 = await kiem('A5 ghi nợ 10.000: tra[] chỉ phần ĐÃ trả (tiền mặt 40.000, không có dòng nợ)', kh, o5.code, { tra: [{ cach: 'tien_mat', so_tien: 40000 }], da_tra: 40000 });
    k('A5b tổng tra[] = da_tra', d5.tra?.reduce((s, x) => s + x.so_tien, 0) === d5.da_tra, JSON.stringify([d5.tra, d5.da_tra]));

    const kHang = await khach(0, null);
    await choHang(kHang.sdt);
    const o6 = await quay(kHang, { items: [monQuay(0, 2)], discount_code: 'THUTT' });
    const dong6 = await db.queryOne('SELECT subtotal, total, tier_discount FROM pos_orders WHERE id = ?', [o6.id]);
    const d6 = await kiem('A6 giảm hạng + mã 5.000: giam = giá gốc − tổng', kHang, o6.code, { giam: dong6.subtotal - dong6.total });
    k('A6b có CẢ giảm hạng (> 0) lẫn mã (5.000) nên giam > 5.000, và = tổng các dòng giảm in trên hoa_don[]',
      dong6.tier_discount > 0 && d6.giam === dong6.tier_discount + 5000 && d6.giam === tienGiamTrenTo(d6.hoa_don), JSON.stringify([dong6, d6.giam, tienGiamTrenTo(d6.hoa_don)]));

    const hd6 = (await goi('GET', `/pos/hoa-don/${o6.id}`, undefined, tkChu)).j.hoa_don.tien;
    k('A6c hoá đơn quầy của đơn giảm giữ nguyên: giam_hang = cột tier_discount, giam_ma = 5.000, tổng 40.000', hd6.giam_hang === dong6.tier_discount && hd6.giam_ma === 5000 && hd6.tong === 40000, JSON.stringify(hd6));

    const o7 = await quay(kh, { items: [monQuay(2, 1)] });
    await datCot(o7.id, { shipping_fee: 23000, total: 43000, cash_amount: 43000 });
    const d7 = await kiem('A7 đơn có phí giao 23.000 → cach_nhan "giao", giam 0 (phí giao không phải giảm)', kh, o7.code,
      { cach_nhan: 'giao', giam: 0, tra: [{ cach: 'tien_mat', so_tien: 43000 }] });
    k('A7b hoa_don[] của đơn giao có dòng phi_giao +23.000đ', d7.hoa_don?.find((d) => d.loai === 'phi_giao')?.phai === '+23.000đ');

    const o8 = await quay(kh, { items: [monQuay(0, 2)] });
    await datCot(o8.id, { flash_discount: 3000, total: 47000, cash_amount: 47000 });
    await kiem('A8 giảm Flash 3.000 (cột flash_discount): giam 3.000', kh, o8.code, { giam: 3000, tra: [{ cach: 'tien_mat', so_tien: 47000 }] });
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A2] đơn App: lấy tại quầy, đã trả / chờ trả / đã huỷ');
  await chay('A2', async () => {
    const kVi = await khach(100000);
    const rVi = await datApp(kVi, 'vi', { pin: '1357' });
    const ctVi = await kiem('AP1 ví đủ (đã trả)', kVi, rVi.j.ma_don, { kenh: 'app', cach_nhan: 'tai_quan', tra: [{ cach: 'tai_khoan', so_tien: 50000 }], so_mon: 2, giam: 0 });
    k('AP1b mon_dau của đơn App = tên món đầu trong mon[]', typeof ctVi.mon_dau === 'string' && ctVi.mon_dau === ctVi.mon?.[0]?.ten, JSON.stringify([ctVi.mon_dau, ctVi.mon?.[0]?.ten]));

    const kVq = await khach(20000);
    const rVq = await datApp(kVq, 'vi_qr', { pin: '1357' });
    await webhook(await phienCua(rVq.j.ma_don));
    await kiem('AP2 ví + QR đã quét → hai dòng tra[] (ví 20.000, QR 30.000), tổng = số đã trả', kVq, rVq.j.ma_don,
      { kenh: 'app', tra: [{ cach: 'tai_khoan', so_tien: 20000 }, { cach: 'chuyen_khoan', so_tien: 30000 }], da_tra: 50000 });

    const kQr = await khach(0, null);
    const rQr = await datApp(kQr, 'qr');
    await kiem('AP3 đơn App chờ trả: tra [] · giam 0 · vẫn có kenh / cach_nhan / so_mon / mon_dau', kQr, rQr.j.ma_don,
      { kenh: 'app', cach_nhan: 'tai_quan', tra: [], so_mon: 2, mon_dau: ctVi.mon_dau, giam: 0 });
    await goi('POST', `/kh/don/${rQr.j.ma_don}/huy`, {}, kQr.tk);
    await kiem('AP4 đơn App huỷ trước khi trả: tra []', kQr, rQr.j.ma_don, { kenh: 'app', tra: [], giam: 0, so_mon: 2 });
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] cùng nguồn với hoá đơn quầy: tra[] = thanh_toan của GET /pos/hoa-don/:id; tổng tra[] = da_tra; tên cach trùng khoá hoá đơn');
  await chay('B', async () => {
    const kh = await khach(0, null);
    const o = await quay(kh, { items: [monQuay(0, 2)] });
    await datCot(o.id, { payment_method: 'balance', cash_amount: 10000, balance_amount: 15000, parent_balance_amount: 5000, transfer_amount: 20000 });
    const quayTra = await traCuaQuay(o.id);
    const ct = await goi('GET', `/kh/don/${o.code}`, undefined, kh.tk);
    k('B1 bốn cách trả cùng lúc: tra[] đúng bằng thanh_toan của hoá đơn quầy (4 dòng, cùng thứ tự, cùng tên cach)', quayTra.length === 4 && bang(ct.j.don?.tra, quayTra), JSON.stringify([ct.j.don?.tra, quayTra]));
    const ds = (await goi('GET', '/kh/don', undefined, kh.tk)).j.data || [];
    k('B2 mọi đơn trong danh sách: tổng tra[] = da_tra (không đơn nào lệch)', ds.length > 0 && ds.every((d) => d.tra && d.tra.reduce((s, x) => s + x.so_tien, 0) === d.da_tra), JSON.stringify(ds.map((d) => [d.tra, d.da_tra])));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] đơn cũ thiếu dữ liệu → null, không đoán');
  await chay('C', async () => {
    const kh = await khach(0, null);
    const o = await quay(kh, { items: [monQuay(0, 1)] });
    await db.run('DELETE FROM pos_order_items WHERE order_id = ?', [o.id]);
    await datCot(o.id, { total: null, shipping_fee: null });
    await kiem('C1 đơn không dòng món, không tổng, không phí giao: so_mon / mon_dau / tra / giam / cach_nhan đều null', kh, o.code,
      { kenh: 'quay', cach_nhan: null, tra: null, so_mon: null, mon_dau: null, giam: null });
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] khách A không đọc được tóm tắt đơn của khách B');
  await chay('E', async () => {
    const a = await khach(0, null), b = await khach(0, null);
    const oa = await quay(a, { items: [monQuay(0, 1)] });
    const xem = await goi('GET', `/kh/don/${oa.code}`, undefined, b.tk);
    k('E1 B đọc đơn của A → 404 KHONG_THAY_DON, không có trường tóm tắt nào', xem.status === 404 && xem.j.code === 'KHONG_THAY_DON' && !TRUONG_MOI.some((f) => xem.tho.includes(`"${f}"`)), xem.tho.slice(0, 120));
    const dsB = await goi('GET', '/kh/don', undefined, b.tk);
    k('E2 danh sách của B rỗng, không lộ gì của A', dsB.status === 200 && bang(dsB.j.data, []) && !dsB.tho.includes(oa.code));
    const dsA = (await goi('GET', '/kh/don', undefined, a.tk)).j.data || [];
    k('E3 chính A thấy đơn của mình với đủ 6 trường (không chặn oan)', dsA.length === 1 && TRUONG_MOI.every((f) => f in dsA[0]), JSON.stringify(dsA[0]));
    k('E4 không token → 401', (await goi('GET', `/kh/don/${oa.code}`)).status === 401);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[K5] luồng hợp lệ KHÔNG đổi: trường cũ, hoá đơn quầy, phân trang');
  await chay('K5', async () => {
    const kh = await khach(0, null);
    const o = await quay(kh, { items: [monQuay(0, 2)] });
    const ct = (await goi('GET', `/kh/don/${o.code}`, undefined, kh.tk)).j.don;
    k('K5a trường cũ của /don/:ma còn đúng giá trị', ct?.ma === o.code && ct.tong === 50000 && ct.da_tra === 50000 && ct.trang_thai === 'completed' && ct.thanh_toan === 'paid'
      && ct.tien_trinh === 'xong' && ct.cach_tra === null && ct.mon?.length === 1 && ct.mon[0].so_luong === 2 && ct.hoa_don?.length > 0, JSON.stringify(ct)?.slice(0, 300));
    const hd = (await goi('GET', `/pos/hoa-don/${o.id}`, undefined, tkChu)).j.hoa_don;
    k('K5b hoá đơn quầy y như cũ: thanh_toan [tiền mặt 50.000], tien { giá gốc 50.000, giảm 0 0 0, phí giao 0, tổng 50.000 }',
      bang(hd.thanh_toan, [{ loai: 'tien_mat', so_tien: 50000 }]) && bang(hd.tien, { gia_goc: 50000, giam_hang: 0, giam_flash: 0, giam_ma: 0, ma_giam: null, phi_giao: 0, tong: 50000 }), JSON.stringify([hd.thanh_toan, hd.tien]));
    const kLon = await khach(0, null);
    for (let i = 0; i < 21; i++) await quay(kLon, { items: [monQuay(2, 1)] });
    const t1 = (await goi('GET', '/kh/don', undefined, kLon.tk)).j, t2 = (await goi('GET', '/kh/don?trang=2', undefined, kLon.tk)).j;
    k('K5c phân trang giữ nguyên: trang 1 có 20 đơn và con_nua, trang 2 có 1 đơn; mọi đơn đủ 6 trường', t1.data?.length === 20 && t1.con_nua === true && t2.data?.length === 1 && t2.con_nua === false
      && [...t1.data, ...t2.data].every((d) => TRUONG_MOI.every((f) => f in d) && d.so_mon === 1 && d.tra?.[0]?.so_tien === 20000), JSON.stringify([t1.data?.length, t2.data?.length, t1.data?.[0]]));
  });

  logGoc(`\nSỐ CA: ${soCa}`);
  logGoc(`\n${hong ? '✗' : '✓'} ${dat} đạt · ${hong} hỏng`);
  svGia.close(); sv.close();
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ */ }
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { noiLai(); console.error('BÀI THỬ SẬP:', e); process.exit(2); });
