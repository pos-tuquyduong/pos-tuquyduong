#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ P22-23 — điểm chỉ cộng khi thu đủ · mua gói / thẻ phải thu đủ · I8 theo luật mới
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_P2223.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến, viec/P22-23/dot_bien.py). bat_bien.js nạp từ <may-chu>/../cong_cu/gia_lap
 *  (như doiSoat.js) — bản sao phải chép cả hai thư mục cạnh nhau.
 *
 *  Khuôn thu_P26c.js: database.js thật + libsql thật trên kho TẠM, SX giả (luôn làm, đếm lệnh). Công tắc co.mocTruocTx (chạy TRỌN
 *  một lệnh khác trước khi giao dịch kế tiếp mở — hai lần thu chồng nhau TẤT ĐỊNH) và co.nemGhi (câu ghi khớp mẫu ném lỗi).
 *  Cài đặt điểm: bật, 1.000đ = 1 điểm, không hết hạn (ca nào đổi thì tự trả lại). So status / code / số dòng sổ — chỉ E2 đọc chữ bill.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_p2223_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: {
    laMayThu: () => true,
    cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }),
    diaChiSX: () => '',
    FILE_THU: FILE_KHO,
  },
};
process.env.JWT_SECRET = 'thu_p2223_' + Date.now();

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();

  const sx = { lenh: 0 };
  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const sxGia = async () => { sx.lenh++; return { ok: true }; };
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true, checkStock: async () => ({ sufficient: true, stock: 999 }),
    outStockFIFO: sxGia, inStockReturn: sxGia, callSxApi: sxGia };

  const co = { mocTruocTx: null, nemGhi: null };
  const loiGiaGhi = (sql) => {
    if (co.nemGhi && co.nemGhi.test(String(sql))) { const e = new Error('SQLITE_IOERR: lỗi ghi (giả)'); e.code = 'SQLITE_IOERR'; throw e; }
  };
  const txGoc = db.beginTransaction, runGoc = db.run;
  db.beginTransaction = async (...a) => {
    const moc = co.mocTruocTx; co.mocTruocTx = null;
    if (moc) await moc();
    const tx = await txGoc(...a);
    const lenh = (f) => async (...b) => { loiGiaGhi(b[0]); return f(...b); };
    return { ...tx, query: lenh(tx.query), queryOne: lenh(tx.queryOne), run: lenh(tx.run) };
  };
  db.run = async (sql, a) => { loiGiaGhi(sql); return runGoc(sql, a); };

  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'wallets', 'signup-codes']) app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  const { BAT_BIEN, DIEM_KHI_THU_TU } = require(path.join(MAY_CHU, '..', 'cong_cu', 'gia_lap', 'bat_bien.js'));
  noiLai();

  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const chu = await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const the = jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const goi = async (method, url, body) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + the } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;
  const datCaiDat = (key, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
  for (const [key, v] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', 1000], ['loyalty_expiry_mode', 'none'],
    ['flash_enabled', 'false'], ['nhandiem_enabled', 1], ['nhandiem_he_so', 2]]) await datCaiDat(key, v);

  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 4');
  const GIA = [25000, 20000, 50000, 30000];
  for (const [i, g] of GIA.entries()) await db.run('UPDATE pos_products SET price = ? WHERE id = ?', [g, sp[i].id]);
  const mon = (i, sl = 1, tuGoi = false) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type,
    sx_product_id: sp[i].sx_product_id, quantity: sl, from_package: tuGoi });
  let soSdt = 0;
  const sdtMoi = () => '0938' + String(200000 + (++soSdt));
  const ban = (body) => goi('POST', '/orders', { customer_name: 'Khách P22-23', ...body });
  const nap = async (sdt, tien) => {
    const r = await goi('POST', '/wallets/topup', { phone: sdt, amount: tien, customer_name: 'Khách P22-23', payment_method: 'cash' });
    if (r.status !== 200) throw new Error('không nạp được ví: ' + moTa(r));
  };
  const vi = (sdt) => so('SELECT COALESCE((SELECT balance FROM pos_wallets WHERE phone = ?), 0)', [sdt]);
  const soEarn = (id) => so("SELECT COUNT(*) FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [id]);
  const diemDon = (id) => so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ?', [id]);
  const dongEarn = (id) => mot("SELECT points, expires_at, reason, created_at FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [id]);
  const thu = (id, soTien, cach = 'cash') => goi('POST', `/orders/${id}/pay-debt`, { payment_method: cach, amount: soTien });
  const donNo = async (sdt, i = 0, them = {}) => {
    const r = await ban({ customer_phone: sdt, items: [mon(i)], payment_method: 'debt', debt_amount: GIA[i], ...them });
    if (r.status !== 200) throw new Error('không tạo được đơn nợ: ' + moTa(r));
    return r.order;
  };
  const anh = (id) => mot(`SELECT o.payment_status AS tt, o.debt_amount AS no,
      (SELECT COUNT(*) FROM pos_balance_transactions WHERE order_id = o.id AND type = 'debt_payment') AS so_thu,
      (SELECT COUNT(*) FROM pos_order_log WHERE order_id = o.id AND loai = 'thu') AS nhat_ky FROM pos_orders o WHERE o.id = ?`, [id]);
  const hanQuy = (luc) => {
    const y = Number(luc.slice(0, 4)), m = Number(luc.slice(5, 7));
    const q = m <= 3 ? 1 : m <= 6 ? 4 : m <= 9 ? 7 : 10;
    return `${y + 1}-${String(q).padStart(2, '0')}-01T00:00:00`;
  };
  // Flash 20 % trên món 0 (25.000 → 20.000), chỉ bật quanh lệnh `f` (giờ VN: giờ này → +2 giờ) — khuôn thu_P26c L2a.
  const trongFlash = async (f) => {
    const gio = Number(new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(11, 13));
    for (const [key, v] of [['flash_enabled', 'true'], ['flash_start', `${String(gio).padStart(2, '0')}:00`],
      ['flash_end', `${String((gio + 2) % 24).padStart(2, '0')}:00`], ['flash_percent', 20],
      ['flash_product_keys', JSON.stringify([`${sp[0].sx_product_type}_${sp[0].sx_product_id}`])]]) await datCaiDat(key, v);
    try { return await f(); } finally { await datCaiDat('flash_enabled', 'false'); }
  };
  let soGoi = 0;
  const taoGoi = async (gia, luot) => Number((await db.run(`INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active)
    VALUES (?, 'Gói P22-23', ?, 'ly', ?, 1)`, [`GOI_P2223_${++soGoi}`, gia, luot])).lastInsertRowid);
  const hang = await mot('SELECT id, card_price FROM pos_membership_tiers WHERE is_active = 1 ORDER BY id LIMIT 1');
  const giaThe = Number(hang.card_price);
  const boQuaF1 = new Set();   // đơn cố ý đổi cài đặt / ném lỗi ghi giữa chừng — I8 so với cài đặt HIỆN TẠI nên không mô tả được

  console.log('\nTHỬ P22-23 — điểm chỉ cộng khi thu đủ · mua gói / thẻ phải thu đủ');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] thu đủ lúc tạo → cộng điểm như cũ (K5)');
  {
    const r1 = await ban({ customer_phone: sdtMoi(), items: [mon(0)], payment_method: 'cash', cash_amount: 25000 });
    const e1 = await dongEarn(r1.order?.id);
    k('A1 tiền mặt đủ 25.000 có SĐT → 1 dòng earn 25 điểm, lý do "Tích điểm đơn <mã>", không hạn', r1.status === 200
      && await soEarn(r1.order.id) === 1 && e1?.points === 25 && e1.reason === `Tích điểm đơn ${r1.order.code}` && e1.expires_at === null,
    `${moTa(r1)} · ${JSON.stringify(e1)}`);
    await datCaiDat('loyalty_expiry_mode', 'quarter');
    const r2 = await ban({ customer_phone: sdtMoi(), items: [mon(1)], payment_method: 'transfer', transfer_amount: 20000 });
    await datCaiDat('loyalty_expiry_mode', 'none');
    const e2 = await dongEarn(r2.order?.id);
    k('A2 chuyển khoản đủ, hạn "quarter" → 20 điểm, hết hạn đầu quý tương ứng năm sau', r2.status === 200 && e2?.points === 20
      && e2.expires_at === hanQuy(r2.order.created_at), `${moTa(r2)} · ${JSON.stringify(e2)}`);
    const s3 = sdtMoi(); await nap(s3, 100000);
    const r3 = await ban({ customer_phone: s3, items: [mon(2)], payment_method: 'balance', balance_amount: 50000 });
    k('A3 trả đủ 50.000 bằng ví → 1 dòng earn 50 điểm', r3.status === 200 && await soEarn(r3.order.id) === 1 && await diemDon(r3.order.id) === 50,
      `${moTa(r3)} · ${await diemDon(r3.order?.id)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] chưa thu đủ lúc tạo → KHÔNG có dòng earn');
  {
    const b1 = await ban({ customer_phone: sdtMoi(), items: [mon(0)], payment_method: 'cho_thu', debt_amount: 25000 });
    k('B1 bill mang ra bàn (cho_thu, nợ 25.000) có SĐT → 200 pending, 0 earn', b1.status === 200 && b1.order.payment_status === 'pending'
      && await soEarn(b1.order.id) === 0, `${moTa(b1)} · earn ${await soEarn(b1.order?.id)}`);
    const b2 = await ban({ customer_phone: sdtMoi(), items: [mon(0)], payment_method: 'debt', debt_amount: 25000 });
    k('B2 ghi nợ 25.000 → 200 pending, 0 earn', b2.status === 200 && b2.order.payment_status === 'pending' && await soEarn(b2.order.id) === 0,
      `${moTa(b2)} · earn ${await soEarn(b2.order?.id)}`);
    const s3 = sdtMoi(); await nap(s3, 10000);
    const b3 = await ban({ customer_phone: s3, items: [mon(0)], payment_method: 'debt', balance_amount: 10000, debt_amount: 15000 });
    k('B3 ví 10.000 + nợ 15.000 → 200 partial, 0 earn', b3.status === 200 && b3.order.payment_status === 'partial' && await soEarn(b3.order.id) === 0,
      `${moTa(b3)} · earn ${await soEarn(b3.order?.id)}`);
    const b4 = await ban({ customer_phone: sdtMoi(), items: [mon(0)], payment_method: 'debt', debt_amount: 25000, payment_status: 'paid' });
    k('B4 máy khách gửi payment_status "paid" kèm nợ 25.000 → đơn pending, 0 earn', b4.status === 200 && b4.order.payment_status === 'pending'
      && await soEarn(b4.order.id) === 0, `${moTa(b4)} · earn ${await soEarn(b4.order?.id)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] thu nợ (pay-debt): thu ĐỦ mới cộng điểm, cùng giao dịch, cài đặt LÚC THU');
  {
    await datCaiDat('loyalty_expiry_mode', 'quarter');
    const d1 = await donNo(sdtMoi(), 2);
    await db.run("UPDATE pos_orders SET created_at = '2025-01-15T10:00:00' WHERE id = ?", [d1.id]);   // tạo khác quý với lúc thu
    await datCaiDat('loyalty_earn_per_amount', 2000);
    const t1 = await thu(d1.id, 50000);
    await datCaiDat('loyalty_earn_per_amount', 1000);
    await datCaiDat('loyalty_expiry_mode', 'none');
    const e1 = await dongEarn(d1.id), a1 = await anh(d1.id);
    boQuaF1.add(d1.code);
    k('C1 đơn nợ 50.000, đổi 1.000 → 2.000đ/điểm rồi thu đủ → 1 earn 25 điểm, hạn quý theo giờ thu, lý do như lúc bán; có debt_payment + nhật ký thu',
      t1.status === 200 && a1.tt === 'paid' && await soEarn(d1.id) === 1 && e1?.points === 25 && e1.reason === `Tích điểm đơn ${d1.code}`
      && e1.expires_at === hanQuy(e1.created_at) && e1.expires_at !== hanQuy('2025-01-15T10:00:00') && a1.so_thu === 1 && a1.nhat_ky === 1, `${moTa(t1)} · ${JSON.stringify(e1)} · ${JSON.stringify(a1)}`);

    const d2 = await donNo(sdtMoi(), 2);
    const t2a = await thu(d2.id, 20000);
    const giua = await soEarn(d2.id);
    const t2b = await thu(d2.id, 30000);
    k('C2 thu một phần 20.000 → partial, 0 earn; thu nốt 30.000 → paid, 1 earn 50 điểm', t2a.status === 200 && t2a.data?.payment_status === 'partial'
      && giua === 0 && t2b.status === 200 && t2b.data?.payment_status === 'paid' && await soEarn(d2.id) === 1 && await diemDon(d2.id) === 50,
    `${moTa(t2a)} · ${giua} / ${moTa(t2b)} · ${await soEarn(d2.id)} · ${await diemDon(d2.id)}`);

    const d3 = await trongFlash(() => ban({ customer_phone: sdtMoi(), items: [mon(0)], payment_method: 'debt', debt_amount: 20000 }));
    const t3 = d3.status === 200 ? await thu(d3.order.id, 20000) : {};
    k('C3 đơn Flash (giảm 5.000) ghi nợ 20.000 → thu đủ 200, 0 earn', d3.status === 200 && Number(d3.order.flash_discount) === 5000
      && t3.status === 200 && await soEarn(d3.order.id) === 0, `${moTa(d3)} / ${moTa(t3)} · earn ${await soEarn(d3.order?.id)}`);

    const d4 = await donNo(sdtMoi());
    co.nemGhi = /INSERT INTO pos_point_transactions/;
    const t4 = await thu(d4.id, 25000);
    co.nemGhi = null;
    const a4 = await anh(d4.id);
    boQuaF1.add(d4.code);
    k('C4 câu ghi điểm lỗi → thu vẫn 200 paid, có debt_payment + nhật ký thu, 0 earn', t4.status === 200 && a4.tt === 'paid' && a4.so_thu === 1
      && a4.nhat_ky === 1 && await soEarn(d4.id) === 0, `${moTa(t4)} · ${JSON.stringify(a4)} · earn ${await soEarn(d4.id)}`);

    const s5 = sdtMoi();
    const d5 = await donNo(s5);
    await db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, reason, created_at) VALUES (?, 'earn', 25, ?, 'luật cũ', ?)",
      [s5, d5.id, d5.created_at]);
    const t5 = await thu(d5.id, 25000);
    k('C5 dữ liệu CŨ: đơn nợ đã có earn lúc tạo → thu đủ 200, vẫn đúng 1 earn (không cộng đôi)', t5.status === 200 && await soEarn(d5.id) === 1
      && await diemDon(d5.id) === 25, `${moTa(t5)} · ${await soEarn(d5.id)} · ${await diemDon(d5.id)}`);

    const d6 = await ban({ items: [mon(0)], payment_method: 'debt', debt_amount: 25000 });
    const t6 = d6.status === 200 ? await thu(d6.order.id, 25000) : {};
    k('C6 (K5) đơn nợ KHÔNG SĐT → thu đủ 200 paid, 0 dòng điểm', d6.status === 200 && t6.status === 200 && t6.data?.payment_status === 'paid'
      && await diemDon(d6.order.id) === 0, `${moTa(d6)} / ${moTa(t6)}`);

    const d7 = await donNo(sdtMoi());
    await datCaiDat('loyalty_enabled', 'false');
    const t7 = await thu(d7.id, 25000);
    await datCaiDat('loyalty_enabled', 'true');
    boQuaF1.add(d7.code);
    k('C7 tắt tích điểm lúc thu → thu 200, 0 earn', t7.status === 200 && await soEarn(d7.id) === 0, `${moTa(t7)} · earn ${await soEarn(d7.id)}`);

    const d8 = await donNo(sdtMoi());
    co.nemGhi = /'debt_payment'/;
    const t8 = await thu(d8.id, 25000);
    co.nemGhi = null;
    const a8 = await anh(d8.id);
    k('C8 câu ghi SAU câu ghi điểm lỗi → thu 500, rollback trọn: đơn vẫn nợ 25.000 pending, 0 earn, 0 debt_payment, 0 nhật ký thu',
      t8.status === 500 && a8.tt === 'pending' && a8.no === 25000 && await soEarn(d8.id) === 0 && a8.so_thu === 0 && a8.nhat_ky === 0,
      `${moTa(t8)} · ${JSON.stringify(a8)} · earn ${await soEarn(d8.id)}`);

    await datCaiDat('loyalty_enabled', 'false');
    const d9 = await donNo(sdtMoi());
    await datCaiDat('loyalty_enabled', 'true');
    const t9 = await thu(d9.id, 25000);
    k('C9 tắt tích điểm lúc tạo, bật lúc thu → thu 200, 1 earn 25 điểm', t9.status === 200 && await soEarn(d9.id) === 1 && await diemDon(d9.id) === 25,
      `${moTa(t9)} · ${await soEarn(d9.id)} · ${await diemDon(d9.id)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] mua gói / thẻ chưa thu đủ → 400 GOI_THE_CHUA_THU_DU, không ghi gì');
  {
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active)
      VALUES ('P2223GIAM', 'fixed', 1000, 0, 0, 0, 0, 1)`);
    const BANG = ['pos_orders', 'pos_order_items', 'pos_customer_packages', 'pos_membership_purchases', 'pos_balance_transactions',
      'pos_point_transactions', 'pos_stock_pending', 'pos_signup_codes', 'pos_registrations'];
    const chup = async (sdt) => {
      const x = {};
      for (const b of BANG) x[b] = await so(`SELECT COUNT(*) FROM ${b}`);
      x.vi = await vi(sdt);
      x.ma = await so("SELECT used_count FROM pos_discount_codes WHERE code = 'P2223GIAM'");
      x.sx = sx.lenh;
      return JSON.stringify(x);
    };
    const tuChoi = async (ten, sdt, body) => {
      const truoc = await chup(sdt);
      const r = await ban({ customer_phone: sdt, ...body });
      const sau = await chup(sdt);
      k(ten, r.status === 400 && r.code === 'GOI_THE_CHUA_THU_DU' && truoc === sau, `${moTa(r)} · ${truoc} → ${sau}`);
    };
    const goi1 = await taoGoi(300000, 10);
    await tuChoi('D1 mua gói 300.000 GHI NỢ (+ khách mới, + mã giảm) → 400; không đơn, không gói, không ví, không kho, không mã, không khách',
      sdtMoi(), { items: [], package_buy: { package_id: goi1, pkg_qty: 1 }, payment_method: 'debt', debt_amount: 299000,
        discount_code: 'P2223GIAM', is_new_customer: true });
    await tuChoi('D2 mua thẻ hội viên CHỜ THU (bill mang ra bàn) → 400, không đơn, không dòng mua thẻ', sdtMoi(),
      { items: [], membership_buy: { tier_id: hang.id }, payment_method: 'cho_thu', debt_amount: giaThe });
    const s3 = sdtMoi(); await nap(s3, 100000);
    await tuChoi('D3 mua gói trả ví 100.000 + nợ 200.000 → 400, ví không bị trừ', s3,
      { items: [], package_buy: { package_id: goi1, pkg_qty: 1 }, payment_method: 'debt', balance_amount: 100000, debt_amount: 200000 });
    await tuChoi('D3b mua thẻ + nợ, máy khách gửi payment_status "paid" → 400', sdtMoi(),
      { items: [], membership_buy: { tier_id: hang.id }, payment_method: 'debt', debt_amount: giaThe, payment_status: 'paid' });

    const s4 = sdtMoi();
    const d4 = await ban({ customer_phone: s4, items: [], package_buy: { package_id: goi1, pkg_qty: 1 }, payment_method: 'cash', cash_amount: 300000 });
    const cp4 = await so('SELECT id FROM pos_customer_packages WHERE order_id = ?', [d4.order?.id]);
    k('D4 (K5) mua gói trả đủ tiền mặt → 200, có gói khách', d4.status === 200 && cp4 > 0, `${moTa(d4)} · gói ${cp4}`);
    await tuChoi('D3c gia hạn gói (customer_package_id + package_buy, không lấy món) GHI NỢ → 400', s4,
      { items: [], customer_package_id: cp4, package_buy: { package_id: goi1, pkg_qty: 1 }, payment_method: 'debt', debt_amount: 300000 });
    const d4b = await ban({ customer_phone: s4, items: [], customer_package_id: cp4, package_buy: { package_id: goi1, pkg_qty: 1 },
      payment_method: 'cash', cash_amount: 300000 });
    k('D4b (K5) gia hạn gói trả đủ → 200', d4b.status === 200, moTa(d4b));
    const s5 = sdtMoi(); await nap(s5, giaThe);
    const d5 = await ban({ customer_phone: s5, items: [], membership_buy: { tier_id: hang.id }, payment_method: 'balance', balance_amount: giaThe });
    k('D5 (K5) mua thẻ trả đủ bằng ví → 200, 1 dòng mua thẻ', d5.status === 200
      && await so('SELECT COUNT(*) FROM pos_membership_purchases WHERE order_id = ?', [d5.order?.id]) === 1, moTa(d5));
    const d6 = await ban({ customer_phone: s4, items: [mon(0, 1, true), mon(1)], customer_package_id: cp4, payment_method: 'debt', debt_amount: 20000 });
    k('D6 (K5) lấy 1 ly từ gói cũ + 1 món lẻ GHI NỢ 20.000 → 200 pending', d6.status === 200 && d6.order.payment_status === 'pending', moTa(d6));
    const d7 = await ban({ customer_phone: sdtMoi(), items: [mon(3)], payment_method: 'debt', debt_amount: 30000 });
    k('D7 (K5) đơn thường ghi nợ, không gói / thẻ → 200 pending', d7.status === 200 && d7.order.payment_status === 'pending', moTa(d7));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] hai lần thu chồng nhau / thu lại khi đã paid → tối đa MỘT dòng earn');
  {
    const g1 = await donNo(sdtMoi());
    let r2;
    co.mocTruocTx = async () => { r2 = await thu(g1.id, 25000); };
    const r1 = await thu(g1.id, 25000);
    const ma = [r1.status, r2?.status].sort().join(',');
    k('G1 hai lệnh thu đủ chồng nhau → một 200, một 409 DA_THU_ROI; đúng 1 earn', ma === '200,409'
      && [r1.code, r2?.code].includes('DA_THU_ROI') && await soEarn(g1.id) === 1, `${moTa(r1)} / ${r2 && moTa(r2)} · earn ${await soEarn(g1.id)}`);

    const g2 = await donNo(sdtMoi(), 2);
    let r4;
    co.mocTruocTx = async () => { r4 = await thu(g2.id, 50000); };
    const r3 = await thu(g2.id, 20000);
    k('G2 thu một phần 20.000 chồng thu đủ 50.000 (thu đủ vào trước) → thu đủ 200, một phần 409; paid, đúng 1 earn',
      r4?.status === 200 && r3.status === 409 && r3.code === 'DA_THU_ROI' && (await anh(g2.id)).tt === 'paid' && await soEarn(g2.id) === 1,
      `${moTa(r3)} / ${r4 && moTa(r4)} · earn ${await soEarn(g2.id)}`);

    const g2b = await donNo(sdtMoi(), 2);
    let r6;
    co.mocTruocTx = async () => { r6 = await thu(g2b.id, 20000); };
    const r5 = await thu(g2b.id, 50000);
    const giua = await soEarn(g2b.id);
    const r7 = await thu(g2b.id, 30000);
    k('G2b thu đủ chồng thu một phần (một phần vào trước) → một phần 200, thu đủ 409, 0 earn; thu nốt 30.000 → paid, 1 earn',
      r6?.status === 200 && r5.status === 409 && giua === 0 && r7.status === 200 && await soEarn(g2b.id) === 1,
      `${r6 && moTa(r6)} / ${moTa(r5)} · ${giua} / ${moTa(r7)} · ${await soEarn(g2b.id)}`);

    const r8 = await thu(g1.id, 25000);
    k('G3 thu lần nữa khi đơn đã paid → 400 DA_THU_ROI, vẫn 1 earn', r8.status === 400 && r8.code === 'DA_THU_ROI' && await soEarn(g1.id) === 1,
      `${moTa(r8)} · earn ${await soEarn(g1.id)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] nhận điểm bằng mã bill (/nhan-diem): Flash 0 điểm · hệ số MỘT hàm · bill chưa thu');
  const nhan = (r, sdt) => goi('POST', '/signup-codes/nhan-diem', { code: r.order?.signup_code, phone: sdt });
  const daNhan = (r) => mot('SELECT diem_nhan_luc FROM pos_signup_codes WHERE code = ?', [r.order?.signup_code]);
  {
    const s1 = sdtMoi();
    const b1 = await trongFlash(() => ban({ customer_phone: s1, items: [mon(0)], payment_method: 'cash', cash_amount: 20000 }));
    const n1 = await nhan(b1, s1);
    k('E1c bill đơn Flash KHÔNG hứa điểm (nhân điểm đang bật)', b1.status === 200 && !/diem/.test(String(b1.order.signup_loi)),
      `bill "${b1.order?.signup_loi}"`);
    k('E1 đơn Flash đã thu → /nhan-diem 400 DON_FLASH_KHONG_DIEM, 0 dòng điểm, mã chưa bị tiêu', b1.status === 200 && Number(b1.order.flash_discount) > 0
      && n1.status === 400 && n1.code === 'DON_FLASH_KHONG_DIEM' && await diemDon(b1.order.id) === 0 && (await daNhan(b1))?.diem_nhan_luc === null,
    `${moTa(b1)} / ${moTa(n1)} · điểm ${await diemDon(b1.order?.id)}`);
    const s1b = sdtMoi();
    const b1b = await ban({ customer_phone: s1b, items: [mon(2)], payment_method: 'cash', cash_amount: 50000 });
    const n1b = await nhan(b1b, s1b);
    k('E1d (K5) bill đơn thường vẫn hứa "gap 2 diem"', String(b1b.order?.signup_loi).includes('gap 2 diem'), `bill "${b1b.order?.signup_loi}"`);
    k('E1b (K5) đơn thường đã thu 50.000 (50 điểm lúc bán) → /nhan-diem 200, tổng 50 × 2 = 100', n1b.status === 200 && await diemDon(b1b.order.id) === 100,
      `${moTa(n1b)} · ${await diemDon(b1b.order?.id)}`);
    const s3 = sdtMoi();
    const b3 = await ban({ customer_phone: s3, items: [mon(0)], payment_method: 'cho_thu', debt_amount: 25000 });
    const n3 = await nhan(b3, s3);
    k('E3 bill chưa thu → /nhan-diem 400 BILL_CHUA_THANH_TOAN', n3.status === 400 && n3.code === 'BILL_CHUA_THANH_TOAN', moTa(n3));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] bất biến I8 theo luật mới (kho tạm của bài này)');
  {
    const s3 = sdtMoi();
    const h1 = await ban({ customer_phone: s3, items: [mon(0)], payment_method: 'cash', cash_amount: 25000 });
    const x1 = await goi('PUT', `/orders/${h1.order?.id}/cancel`, { reason: 'thử P22-23' });
    const h2 = await ban({ customer_phone: s3, items: [mon(0)], payment_method: 'debt', debt_amount: 25000 });
    const x2 = await goi('PUT', `/orders/${h2.order?.id}/cancel`, { reason: 'thử P22-23' });
    const lech = await BAT_BIEN.I8((sql, a = []) => db.query(sql, a), {});
    const con = lech.filter((d) => !boQuaF1.has((/^đơn (\S+): /.exec(d) || [])[1]));
    k('F3 đơn đã thu huỷ giữ 25 điểm; đơn ghi nợ huỷ 0 điểm', x1.status === 200 && x2.status === 200 && await diemDon(h1.order.id) === 25
      && await diemDon(h2.order.id) === 0, `${moTa(x1)} / ${moTa(x2)} · ${await diemDon(h1.order?.id)} / ${await diemDon(h2.order?.id)}`);
    k(`F1 I8 trên mọi đơn của bài (trừ ${boQuaF1.size} đơn cố ý đổi cài đặt / ném lỗi ghi) → 0 lệch`, con.length === 0, JSON.stringify(con.slice(0, 4)));

    // F2 — dữ liệu CŨ trên production: đơn ghi nợ đã có earn theo luật cũ. Đối soát thật (ctx.thuc) tha nếu tạo TRƯỚC mốc.
    const s2 = sdtMoi();
    const f2 = await donNo(s2);
    await db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, reason, created_at) VALUES (?, 'earn', 25, ?, 'luật cũ', ?)",
      [s2, f2.id, f2.created_at]);
    const moc = String(DIEM_KHI_THU_TU || '');
    const coDon = async (luc, ctx) => {
      await db.run('UPDATE pos_orders SET created_at = ? WHERE id = ?', [luc, f2.id]);
      return (await BAT_BIEN.I8((sql, a = []) => db.query(sql, a), ctx)).some((d) => d.startsWith(`đơn ${f2.code}: `));
    };
    const truocMoc = /^\d{4}-\d{2}-\d{2}$/.test(moc)
      ? new Date(Date.parse(moc + 'T00:00:00Z') - 1000).toISOString().slice(0, 19) : '';
    const a = truocMoc && await coDon(truocMoc, { thuc: true });
    const b = truocMoc && await coDon(moc + 'T00:00:00', { thuc: true });
    const c = truocMoc && await coDon(truocMoc, {});
    k(`F2 đơn ghi nợ có earn (dữ liệu cũ): Đối soát thật, tạo 1 giây trước mốc ${moc || '(chưa có)'} → KHÔNG lệch; đúng mốc → lệch; giả lập (không ctx.thuc) trước mốc → lệch`,
      !!truocMoc && a === false && b === true && c === true, `trước mốc ${a} · đúng mốc ${b} · giả lập ${c}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E2] hệ số nhân điểm: bill và /nhan-diem cùng MỘT số');
  {
    for (const [ten, heSo, dung] of [['E2 hệ số cài 0,5 (< 1)', 0.5, 2], ['E2b (K5) hệ số 3', 3, 3]]) {
      await datCaiDat('nhandiem_he_so', heSo);
      const s = sdtMoi();
      const b = await ban({ customer_phone: s, items: [mon(2)], payment_method: 'cash', cash_amount: 50000 });
      const n = await nhan(b, s);
      k(`${ten} → bill hứa "gap ${dung} diem" VÀ /nhan-diem cộng tổng 50 × ${dung} = ${50 * dung}`, b.status === 200
        && String(b.order.signup_loi).includes(`gap ${dung} diem`) && n.status === 200 && await diemDon(b.order.id) === 50 * dung,
      `${moTa(b)} · bill "${b.order?.signup_loi}" / ${moTa(n)} · ${await diemDon(b.order?.id)}`);
    }
    await datCaiDat('nhandiem_he_so', 2);
  }

  sv.close();
  console.log(`\n  ${dat} đạt · ${hong} hỏng\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai();
  console.error(`\n✖ Bài thử sập: ${e.message}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
