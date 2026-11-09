#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KH-THE-1 — App KH mua thẻ hạng (chung giỏ với đồ uống), hạng lên NGAY lúc đơn được ghi "đã thu" ở mọi cách trả; hợp đồng v13
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (gốc từ chối dòng thẻ → YEU_CAU_KHONG_HOP_LE; chưa có cột quyen_loi). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KHTHE1.js
 *
 *  Khuôn thu_KHMUA1.js: database.js + libsql thật trên kho TẠM (chỉ thay ketNoiKho — P8), SX tắt, payOS giả trên 127.0.0.1, webhook ký bằng
 *  công thức viết riêng trong bài. Thời gian trôi = lùi cột giờ trong kho tạm. So HTTP status + `code`, không dò lời báo (trừ lý do ngắn D8,
 *  câu hợp đồng cho khách). Chủ quán duyệt kế hoạch 09.11: (Q1) không tách banThe.js — App đi đúng taoDon của quầy; (Q2) tiền QR về sau khi đơn
 *  App hết hạn → vào ví, chưa có hạng; (Q3) đơn App chỉ có sản phẩm không pha chế → tự "Xong" lúc đã thu; (Q4) giỏ không cần pha chế bán mọi giờ.
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const GOC = path.join(__dirname, '..');
// --may-chu <thư mục server>: chạy trên bản sao server/ (đột biến viec/KH-THE-1/dot_bien.py); client/src, cong_cu đọc từ GOC.
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khthe1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(MAY_CHU,'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_khthe1_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_khthe1_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.khthe1.local/tra-ve';

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = console.error = console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const chuoiKy = (d) => Object.keys(d).sort().map((x) => `${x}=${d[x] == null ? '' : d[x]}`).join('&');
const hmac = (s) => crypto.createHmac('sha256', KHOA.ck).update(s).digest('hex');
const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// K1: băm giỏ CŨ (không dòng thẻ) chụp trên code GỐC da5f5d4 — giỏ [món 0 × 2 "ít đá", món 1 × 1], cach_nhan tai_quan, cach_tra vi, không mã.
const BAM_GOC = 'd9f0ac1218e625669cc3367e496afd28c6338797f21bb3c13915f5939ecf30ec';

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const bcrypt = require(path.join(GOC, 'node_modules', 'bcryptjs'));
  const db = require(path.join(MAY_CHU,'database.js'));
  const { getNow } = require(path.join(MAY_CHU,'utils', 'helpers.js'));
  await db.initDatabase();

  // D9: lỗi máy (không phải kho bận) ở câu ghi phiên trong giao dịch — một lần.
  let mocNem = false;
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const tx = await txGoc(...a);
    const runGoc = tx.run;
    tx.run = async (sql, p) => {
      if (mocNem && /INSERT INTO pos_phien_thanh_toan/.test(sql)) { mocNem = false; throw new Error('đĩa hỏng (bài thử)'); }
      return runGoc(sql, p);
    };
    return tx;
  };

  const gia = express();
  gia.use(express.json());
  gia.post('/v2/payment-requests', (req, res) => {
    const data = { orderCode: req.body.orderCode, amount: req.body.amount, description: req.body.description, status: 'PENDING',
      paymentLinkId: 'pl_' + req.body.orderCode, qrCode: 'QR_GIA_' + req.body.orderCode, checkoutUrl: 'https://gia/' + req.body.orderCode };
    res.json({ code: '00', desc: 'success', data, signature: hmac(chuoiKy(data)) });
  });
  const svGia = await new Promise((ok) => { const s = gia.listen(0, '127.0.0.1', () => ok(s)); });
  process.env.PAYOS_BASE_URL = `http://127.0.0.1:${svGia.address().port}`;

  const R = (f) => path.join(MAY_CHU,'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/wallets', require(R('wallets.js')));
  app.use('/api/pos/refunds', require(R('refunds.js')));
  app.use('/api/pos/tiers', require(R('tiers.js')));
  const tt = require(R('thanh-toan.js'));
  app.use('/api/pos/thanh-toan', tt);
  app.use('/api/payos/webhook', tt.webhook);
  app.use('/api/pos/kh', require(R('kh/quay.js')));
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const { kyTokenKhach } = require(path.join(MAY_CHU,'middleware', 'khachAuth.js'));
  const { tienTheoSo } = require(path.join(MAY_CHU,'utils', 'doiSoat.js'));
  const batBien = require(path.join(GOC, 'cong_cu', 'gia_lap', 'bat_bien.js'));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  // ── Dữ liệu nền ──────────────────────────────────────────────────────────
  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  const datCaiDat = (key, value) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(value), getNow()]);
  for (const [a, b] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['flash_enabled', 'false'], ['signup_enabled', '0'],
    ['thanh_toan_payos_bat_buoc', '0']]) await datCaiDat(a, b);
  const sps = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 2');
  const GIA = [25000, 30000];
  for (let i = 0; i < 2; i++) await db.run('UPDATE pos_products SET price = ?, ton_gan_nhat = NULL WHERE id = ?', [GIA[i], sps[i].id]);
  const ma = (i) => `${sps[i].sx_product_type}_${sps[i].sx_product_id}`;
  const monQuay = (i, sl = 1) => ({ product_id: sps[i].id, sx_product_type: sps[i].sx_product_type, sx_product_id: sps[i].sx_product_id, quantity: sl });
  const PIN_CQ = '2468';
  await db.run('DELETE FROM pos_pin_chu_quan');
  await db.run("INSERT INTO pos_pin_chu_quan (id, pin_bam, sai, khoa_den, dat_boi, dat_luc) VALUES (1, ?, 0, NULL, 'thu', ?)", [bcrypt.hashSync(PIN_CQ, 4), getNow()]);
  const taoHang = async (ten, bac, cach, goi, pt = 10) => Number((await db.run(`INSERT INTO pos_membership_tiers (name, card_price, discount_percent,
    special_discount_percent, sort_order, is_active, cach_co, goi) VALUES (?, 0, ?, 0, ?, 1, ?, ?)`, [ten, pt, bac, cach, JSON.stringify(goi)])).lastInsertRowid);
  const VANG = await taoHang('Vàng thử', 52, 'ban', [{ so_thang: 1, gia: 100000, bat: true }, { so_thang: 3, gia: 250000, bat: true },
    { so_thang: 6, gia: null, bat: true }, { so_thang: 12, gia: 900000, bat: false }]);
  const BAC = await taoHang('Bạc thử', 51, 'ban', [{ so_thang: 1, gia: 50000, bat: true }], 5);
  const KC = await taoHang('Kim Cương thử', 53, 'chi_cap', [], 20);

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
  const moTa = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const so = async (sql, p = []) => Number((await db.queryOne(sql, p).catch(() => null))?.n ?? -1);
  const soDu = async (sdt) => Number((await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [sdt]))?.balance || 0);
  const soThe = (sdt) => so('SELECT COUNT(*) AS n FROM pos_membership_purchases WHERE customer_phone = ?', [sdt]);
  const chup = async (sdt) => [await so('SELECT COUNT(*) AS n FROM pos_orders'), await so('SELECT COUNT(*) AS n FROM pos_don_app'),
    await so('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan'), await so("SELECT COUNT(*) AS n FROM pos_phien_thanh_toan WHERE trang_thai = 'cho'"),
    await so('SELECT COUNT(*) AS n FROM pos_membership_purchases'), await soDu(sdt)].join('/');
  const donApp = (maDon) => db.queryOne('SELECT * FROM pos_don_app WHERE ma = ?', [maDon]).catch(() => null);
  const phienCua = async (maDon) => { const a = await donApp(maDon); return a ? db.queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [a.phien_id]) : null; };
  const lui = (bang, cot, dk, p, giay) => db.run(`UPDATE ${bang} SET ${cot} = strftime('%Y-%m-%dT%H:%M:%S', ${cot}, '-${giay} seconds') WHERE ${dk}`, p);
  const hangToi = async (kh) => (await goi('GET', '/kh/toi', undefined, kh.tk)).j.khach?.hang || null;

  let soSdt = 0;
  const khach = async (napVi = 0, pin = '1357') => {
    const sdt = '09' + String(42000000 + (++soSdt)).padStart(8, '0');
    const id = Number((await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + sdt, getNow()])).lastInsertRowid);
    if (napVi) await goi('POST', '/pos/wallets/topup', { phone: sdt, amount: napVi }, tkChu);
    if (pin) await goi('POST', '/pos/thanh-toan/pin', { phone: sdt, pin, pin_lai: pin }, tkChu);
    return { sdt, id, tk: kyTokenKhach(id) };
  };
  const capKC = (sdt) => db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at, loai, so_thang)
    VALUES (?, ?, 'Kim Cương thử', 0, NULL, ?, '9999-12-31T23:59:59', 'cap', NULL)`, [sdt, KC, getNow()]);
  let soKhoa = 0;
  const khoaMoi = () => 'khoa-the-' + String(++soKhoa).padStart(8, '0') + '-' + ngauNhien().slice(0, 6);
  const the = (hang = VANG, thang = 1, them = {}) => ({ loai: 'the', hang_id: hang, so_thang: thang, ...them });
  const mon = (i, sl = 1, ghiChu) => ({ ma: ma(i), so_luong: sl, ...(ghiChu ? { ghi_chu: ghiChu } : {}) });
  const gio = (dong, them = {}) => ({ mon: dong, cach_nhan: 'tai_quan', ...them });
  const baoGia = (kh, than) => goi('POST', '/kh/gio/bao-gia', than, kh.tk);
  const dat1 = async (kh, than, them = {}) => {
    let tong = them.tong_da_xem;
    if (tong === undefined) tong = (await baoGia(kh, than)).j.tong;
    return goi('POST', '/kh/don', { ...than, khoa_gui: khoaMoi(), cach_tra: 'qr', tong_da_xem: tong, ...them }, kh.tk);
  };
  const datVi = (kh, than, them = {}) => dat1(kh, than, { cach_tra: 'vi', pin: '1357', ...them });
  let soRef = 0;
  const webhook = (p, them = {}) => {
    const data = { orderCode: p.ma_payos, amount: p.con_lai, description: p.noi_dung || 'x', accountNumber: '12345678', reference: 'REFT' + (++soRef),
      transactionDateTime: getNow().replace('T', ' '), currency: 'VND', paymentLinkId: 'pl_' + p.ma_payos, code: '00', desc: 'success',
      counterAccountBankId: '', counterAccountName: null, ...them };
    return goi('POST', '/payos/webhook', { code: '00', desc: 'success', success: true, data, signature: hmac(chuoiKy(data)) });
  };
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };
  const hhmm = (phut) => new Date(Date.parse(getNow() + 'Z') + phut * 60000).toISOString().slice(11, 16);
  const datLich = async (mo, dong, ngung = 0) => {
    const lich = {}; for (const t of [2, 3, 4, 5, 6, 7, 8]) lich[t] = { mo, dong };
    await datCaiDat('gio_hd_lich', JSON.stringify(lich)); await datCaiDat('gio_hd_ngung_truoc_phut', ngung);
  };
  const boLich = async () => { await datCaiDat('gio_hd_lich', ''); await datCaiDat('gio_hd_ngung_truoc_phut', 0); };
  const tinhThu = (sdt, than) => goi('POST', '/pos/orders/tinh-thu', { customer_phone: sdt, ...than }, tkChu);
  const I15 = async () => batBien.BAT_BIEN.I15((sql, p) => db.query(sql, p));
  const diemDon = (oid) => so('SELECT COALESCE(SUM(points), 0) AS n FROM pos_point_transactions WHERE order_id = ?', [oid]);
  const taoTaiQuay = (kh, than) => goi('POST', '/pos/orders', { customer_phone: kh.sdt, customer_name: 'K', ...than }, tkChu);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] MỘT đường bán thẻ: quầy y như trước (đối chứng), App cùng giá + cùng mã chặn với quầy');
  await chay('A', async () => {
    const kh = await khach();
    const o = await taoTaiQuay(kh, { items: [], membership_buy: { tier_id: VANG, so_thang: 1 }, payment_method: 'cash', cash_amount: 100000 });
    const dong = await db.queryOne('SELECT * FROM pos_membership_purchases WHERE order_id = ?', [o.j.order?.id]);
    k('A1 quầy bán Vàng 1 tháng: 200, tổng 100.000đ, một dòng sổ ban · 1 tháng · 100.000đ', la(o, 200) && o.j.order?.total === 100000 && dong?.loai === 'ban'
      && dong?.so_thang === 1 && dong?.price_paid === 100000, `${moTa(o)} · ${JSON.stringify(dong)}`);
    const kc = await khach(); await capKC(kc.sdt);
    const cap = [[kh, the(KC, 1), 'HANG_CHI_CAP'], [kh, the(VANG, 6), 'GOI_HANG_KHONG_BAN'], [kh, the(VANG, 12), 'GOI_HANG_KHONG_BAN'],
      [kc, the(VANG, 1), 'DA_CO_HANG_CAO_HON']];
    for (const [ai, t, code] of cap) {
      const q = await tinhThu(ai.sdt, { items: [], membership_buy: { tier_id: t.hang_id, so_thang: t.so_thang } });
      const a = await baoGia(ai, gio([t]));
      k(`A2/B5–B7 ${t.hang_id === KC ? 'Kim Cương' : 'Vàng ' + t.so_thang + ' tháng'}${ai === kc ? ' (khách đang Kim Cương)' : ''}: quầy và App cùng 400 ${code}`,
        la(q, 400, code) && la(a, 400, code), `quầy ${moTa(q)} · App ${moTa(a)}`);
    }
  });

  muc('[B] Hợp đồng v13 — dòng thẻ trong mon[] của /gio/bao-gia và POST /don');
  await chay('B', async () => {
    const kh = await khach(1000000);
    const truoc = await chup(kh.sdt);
    const g1 = gio([mon(0, 2, 'ít đá'), the(VANG, 3), mon(1, 1)]);
    const b1 = await baoGia(kh, g1);
    const q1 = await tinhThu(kh.sdt, { items: [monQuay(0, 2), monQuay(1, 1)], membership_buy: { tier_id: VANG, so_thang: 3 } });
    const d = b1.j.dong || [];
    k('B1 thẻ GIỮA giỏ: dong[] theo đúng thứ tự gửi — món 0 (25.000) · thẻ (250.000) · món 1 (30.000); tong = tinh-thu quầy cùng giỏ', la(b1, 200) && la(q1, 200)
      && d.length === 3 && d[0].ma === ma(0) && d[0].don_gia === 25000 && d[0].so_luong === 2 && d[2].ma === ma(1) && d[2].don_gia === 30000
      && b1.j.tong === q1.j.total && b1.j.tam_tinh === 50000 + 250000 + 30000, `${moTa(b1)} · ${JSON.stringify(d)} · quầy ${q1.j.total}`);
    k('B1 dòng thẻ đúng 7 trường { loai "the", hang_id, so_thang, ma null, so_luong 1, don_gia, thanh_tien } = giá gói máy chủ', d[1]
      && bang(Object.keys(d[1]).sort(), ['don_gia', 'hang_id', 'loai', 'ma', 'so_luong', 'so_thang', 'thanh_tien']) && d[1].loai === 'the' && d[1].hang_id === VANG
      && d[1].so_thang === 3 && d[1].ma === null && d[1].so_luong === 1 && d[1].don_gia === 250000 && d[1].thanh_tien === 250000, JSON.stringify(d[1]));
    k('K2 dòng món giữ ĐÚNG 4 trường cũ { ma, so_luong, don_gia, thanh_tien }', bang(Object.keys(d[0] || {}).sort(), ['don_gia', 'ma', 'so_luong', 'thanh_tien'])
      && bang(Object.keys(d[2] || {}).sort(), ['don_gia', 'ma', 'so_luong', 'thanh_tien']), JSON.stringify([d[0], d[2]]));
    const b2 = await baoGia(kh, gio([the(VANG, 1)]));
    k('B2 giỏ CHỈ thẻ → 200, một dòng, tong 100.000', la(b2, 200) && b2.j.dong?.length === 1 && b2.j.tong === 100000, `${moTa(b2)} · ${b2.j.tong}`);
    const b2b = await baoGia(kh, gio([the(VANG, 1, { so_luong: 1 })]));
    k('B4 so_luong 1 gửi rõ → 200 (không chặn oan)', la(b2b, 200), moTa(b2b));
    const b3 = await baoGia(kh, gio([the(VANG, 1), mon(0), the(VANG, 3)]));
    k('B3 hai dòng thẻ → 400 NHIEU_THE', la(b3, 400, 'NHIEU_THE'), moTa(b3));
    const sai = [the(VANG, 1, { so_luong: 2 }), { loai: 'the', hang_id: String(VANG), so_thang: 1 }, the(VANG, 0), { loai: 'goi', hang_id: VANG, so_thang: 1 },
      the(VANG, 1, { ma: ma(0) }), { loai: 'the', so_thang: 1 }];
    const b4 = await Promise.all(sai.map((x) => baoGia(kh, gio([x]))));
    k('B4 so_luong 2 · hang_id chữ · so_thang 0 · loai lạ · kèm ma · thiếu hang_id → 400 YEU_CAU_KHONG_HOP_LE', b4.every((r) => la(r, 400, 'YEU_CAU_KHONG_HOP_LE')),
      b4.map(moTa).join(' / '));
    const b13 = await baoGia(kh, gio([the(999999, 1)]));
    k('B13 hạng không có → 400 DON_KHONG_HOP_LE (mã sẵn có)', la(b13, 400, 'DON_KHONG_HOP_LE'), moTa(b13));
    const b8 = await datVi(kh, g1, { tong_da_xem: 1000 });
    k('B8 tong_da_xem lệch → 409 GIA_DA_DOI kèm bao_gia có dòng thẻ', la(b8, 409, 'GIA_DA_DOI') && b8.j.bao_gia?.dong?.[1]?.loai === 'the', moTa(b8));
    const b3d = await datVi(kh, gio([the(VANG, 1), the(VANG, 3)]), { tong_da_xem: 0 });
    const b5d = await datVi(kh, gio([the(KC, 1)]), { tong_da_xem: 0 });
    k('B3/B5 POST /don: hai thẻ → NHIEU_THE · Kim Cương → HANG_CHI_CAP', la(b3d, 400, 'NHIEU_THE') && la(b5d, 400, 'HANG_CHI_CAP'), `${moTa(b3d)} / ${moTa(b5d)}`);
    k('B11 các 4xx ở trên không để lại đơn / dòng đơn App / phiên / dòng sổ thẻ / tiền ví (đếm bảng)', (await chup(kh.sdt)) === truoc,
      `${truoc} → ${await chup(kh.sdt)}`);
    const khoa = khoaMoi();
    const tong = (await baoGia(kh, gio([the(VANG, 1)]))).j.tong;
    const d1 = await goi('POST', '/kh/don', { ...gio([the(VANG, 1)]), khoa_gui: khoa, cach_tra: 'vi', pin: '1357', tong_da_xem: tong }, kh.tk);
    const d2 = await goi('POST', '/kh/don', { ...gio([the(VANG, 1)]), khoa_gui: khoa, cach_tra: 'vi', pin: '1357', tong_da_xem: tong }, kh.tk);
    k('B9 gửi lại cùng khoá → 200 trung: true, cùng mã đơn, một dòng sổ thẻ', la(d1, 200) && la(d2, 200) && d2.j.trung === true && d2.j.ma_don === d1.j.ma_don
      && (await soThe(kh.sdt)) === 1, `${moTa(d1)} · ${moTa(d2)} · ${d2.j.trung}`);
    const d2b = await goi('POST', '/kh/don', { ...gio([the(VANG, 1, { so_luong: 1 })]), khoa_gui: khoa, cach_tra: 'vi', pin: '1357', tong_da_xem: tong }, kh.tk);
    k('B9b gửi lại cùng khoá, dòng thẻ thêm so_luong: 1 (cùng nghĩa với bỏ trống) → vẫn trung: true', la(d2b, 200) && d2b.j.trung === true
      && d2b.j.ma_don === d1.j.ma_don, moTa(d2b));
    const d3 = await goi('POST', '/kh/don', { ...gio([the(VANG, 3)]), khoa_gui: khoa, cach_tra: 'vi', pin: '1357', tong_da_xem: 250000 }, kh.tk);
    k('B10 cùng khoá, đổi gói thẻ → 409 KHOA_GUI_DA_DUNG', la(d3, 409, 'KHOA_GUI_DA_DUNG'), moTa(d3));
    const kh2 = await khach();
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, usage_limit, used_count, is_active) VALUES ('THE5K', 'fixed', 5000, 0, 0, 1)`);
    const b12 = await baoGia(kh2, gio([mon(0, 2), the(VANG, 1)], { ma_giam: 'THE5K' }));
    const q12 = await tinhThu(kh2.sdt, { items: [monQuay(0, 2)], membership_buy: { tier_id: VANG, so_thang: 1 }, discount_code: 'THE5K' });
    k('B12 thẻ + mã giảm: tong App = tinh-thu quầy cùng giỏ', la(b12, 200) && la(q12, 200) && b12.j.tong === q12.j.total, `${b12.j.tong} / ${q12.j.total}`);
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, usage_limit, used_count, is_active) VALUES ('THE10PT', 'percent', 10, 0, 0, 1)`);
    const b12b = await baoGia(kh2, gio([the(VANG, 3)], { ma_giam: 'THE10PT' }));
    const q12b = await tinhThu(kh2.sdt, { items: [], membership_buy: { tier_id: VANG, so_thang: 3 }, discount_code: 'THE10PT' });
    k('B12b giỏ chỉ thẻ + mã 10%: áp như quầy (tính trên giá thẻ) — tong App = tinh-thu quầy = 225.000', la(b12b, 200) && la(q12b, 200)
      && b12b.j.tong === q12b.j.total && b12b.j.tong === 225000, `${moTa(b12b)} · ${b12b.j.tong} / ${q12b.j.total}`);
  });

  muc('[C] Giá đồ uống trong đơn có thẻ = theo hạng khách ĐANG CÓ (hạng mới áp từ đơn sau)');
  await chay('C', async () => {
    const kh = await khach(1000000);
    const g = gio([mon(0, 1), the(VANG, 1)]);
    const b = await baoGia(kh, g);
    k('C1 khách chưa hạng: món giá GỐC (không dòng giảm hạng), tong = 25.000 + 100.000', la(b, 200) && b.j.tong === 125000
      && !(b.j.giam || []).some((x) => x.loai === 'hang'), `${moTa(b)} · ${b.j.tong} · ${JSON.stringify(b.j.giam)}`);
    const d = await datVi(kh, g);
    const p = await phienCua(d.j.ma_don);
    const o = p?.order_id ? await db.queryOne('SELECT total, tier_discount FROM pos_orders WHERE id = ?', [p.order_id]) : null;
    k('C1 đơn ghi đúng 125.000, không giảm hạng', la(d, 200) && o?.total === 125000 && !Number(o?.tier_discount), `${moTa(d)} · ${JSON.stringify(o)}`);
    const sau = await baoGia(kh, gio([mon(0, 1)]));
    k('C3 đơn SAU đó: món được giảm hạng Vàng', la(sau, 200) && (sau.j.giam || []).some((x) => x.loai === 'hang' && x.so_tien > 0), JSON.stringify(sau.j.giam));
    const b2 = await baoGia(kh, g);
    const q2 = await tinhThu(kh.sdt, { items: [monQuay(0, 1)], membership_buy: { tier_id: VANG, so_thang: 1 } });
    k('C2 khách đang Vàng gia hạn Vàng + món: có giảm hạng, tong = tinh-thu quầy', la(b2, 200) && b2.j.tong === q2.j.total && q2.j.tier_discount > 0
      && b2.j.tong < 125000, `${b2.j.tong} / ${q2.j.total}`);
  });

  muc('[D] Hạng lên NGAY trong giao dịch ghi "đã thu" — ví / QR / ví + QR / xác nhận tay; trùng chỉ một dòng sổ');
  await chay('D', async () => {
    const kh = await khach(1000000);
    const d1 = await datVi(kh, gio([the(VANG, 1)]));
    const h1 = await hangToi(kh);
    k('D1 trả ví: 200, /toi.hang = Vàng ngay sau POST /don, một dòng sổ', la(d1, 200) && h1?.id === VANG && (await soThe(kh.sdt)) === 1, `${moTa(d1)} · ${JSON.stringify(h1)}`);
    k('Q3 giỏ chỉ thẻ trả ví → tien_trinh "xong" ngay (không chờ quầy pha)', d1.j.tien_trinh === 'xong', d1.j.tien_trinh);

    const kq = await khach();
    const d2 = await dat1(kq, gio([mon(0, 1), the(VANG, 1)]));
    const p2 = await phienCua(d2.j.ma_don);
    const truocQ = [await hangToi(kq), await soThe(kq.sdt)];
    k('D2 QR: sau POST /don chưa có hạng, chưa dòng sổ, tien_trinh cho_tra', la(d2, 200) && d2.j.tien_trinh === 'cho_tra' && truocQ[0] === null && truocQ[1] === 0,
      `${moTa(d2)} · ${JSON.stringify(truocQ)}`);
    const ttMuaTruoc = (await tienTheoSo(getNow().slice(0, 10), getNow().slice(0, 10), 'transfer').catch(() => null))?.ban ?? null;
    const [w1, w2] = await Promise.all([webhook(p2), webhook(p2)]);
    const w3 = await webhook(p2);
    const ttMuaSau = (await tienTheoSo(getNow().slice(0, 10), getNow().slice(0, 10), 'transfer').catch(() => null))?.ban ?? null;
    const p2s = await phienCua(d2.j.ma_don);
    k('D2 Tingee / QR báo tiền về → có hạng Vàng', (await hangToi(kq))?.id === VANG, `${w1.status}/${w2.status}`);
    k('D4 báo tiền HAI lần song song + một lần nữa → đúng một đơn, một dòng sổ thẻ', p2s?.trang_thai === 'da_thu' && (await soThe(kq.sdt)) === 1
      && (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [kq.sdt])) === 1, `${w3.status} · ${await soThe(kq.sdt)}`);
    const chiTiet = await goi('GET', `/kh/don/${d2.j.ma_don}`, undefined, kq.tk);
    k('Q3 giỏ có đồ uống → sau khi trả tien_trinh "da_tra" (chờ quầy pha như cũ)', chiTiet.j.don?.tien_trinh === 'da_tra', chiTiet.j.don?.tien_trinh);
    k('G5 Đối soát: tiền CK của đơn thẻ App vào tienTheoSo chuyển khoản như đơn quầy (+125.000)', ttMuaTruoc !== null && ttMuaSau - ttMuaTruoc === 125000,
      `${ttMuaTruoc} → ${ttMuaSau}`);

    const kv = await khach(30000);
    const d3 = await dat1(kv, gio([the(VANG, 1)]), { cach_tra: 'vi_qr', pin: '1357' });
    const p3 = await phienCua(d3.j.ma_don);
    k('D3 ví + QR: giữ 30.000, chưa có hạng', la(d3, 200) && d3.j.giu_vi === 30000 && d3.j.con_lai === 70000 && (await hangToi(kv)) === null, moTa(d3));
    await webhook(p3);
    k('D3 QR phần còn lại về đủ → có hạng, ví còn 0', (await hangToi(kv))?.id === VANG && (await soDu(kv.sdt)) === 0, String(await soDu(kv.sdt)));
    const dq = await dat1(kv, gio([the(VANG, 1)]));
    const qrOnly = await goi('GET', `/kh/don/${dq.j.ma_don}`, undefined, kv.tk);
    await webhook(await phienCua(dq.j.ma_don));
    const qrSau = await goi('GET', `/kh/don/${dq.j.ma_don}`, undefined, kv.tk);
    k('Q3 giỏ chỉ thẻ trả QR: cho_tra → tiền về → "xong" ngay', qrOnly.j.don?.tien_trinh === 'cho_tra' && qrSau.j.don?.tien_trinh === 'xong',
      `${qrOnly.j.don?.tien_trinh} → ${qrSau.j.don?.tien_trinh}`);

    const kt = await khach();
    const d5 = await dat1(kt, gio([the(VANG, 1)]));
    const p5 = await phienCua(d5.j.ma_don);
    const x5 = await goi('POST', `/pos/thanh-toan/phien/${p5?.id}/xac-nhan-tay`, { ly_do: 'Đã thấy tiền về tài khoản quán' }, tkChu);
    k('D5 xác nhận tay phiên App CÒN hạn → có hạng', la(x5, 200) && (await hangToi(kt))?.id === VANG, moTa(x5));

    const ks = await khach(1000000);
    const khoa = khoaMoi();
    const than = { ...gio([the(VANG, 1)]), khoa_gui: khoa, cach_tra: 'vi', pin: '1357', tong_da_xem: 100000 };
    const ss = await Promise.all([goi('POST', '/kh/don', than, ks.tk), goi('POST', '/kh/don', than, ks.tk)]);
    let lai = ss.find((r) => r.status === 200);
    for (let i = 0; i < 5 && ss.some((r) => la(r, 503, 'DANG_XU_LY')) && !lai; i++) lai = (await goi('POST', '/kh/don', than, ks.tk));
    k('D6 hai POST /don cùng khoá song song (ví) → một đơn, một dòng sổ, ví trừ đúng một lần', (await soThe(ks.sdt)) === 1 && (await soDu(ks.sdt)) === 900000
      && (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [ks.sdt])) === 1, ss.map(moTa).join(' / '));

    const kh7 = await khach();
    const d7 = await dat1(kh7, gio([the(VANG, 1)]));
    const p7 = await phienCua(d7.j.ma_don);
    await lui('pos_phien_thanh_toan', 'het_han', 'id = ?', [p7.id], 700);
    const w7 = await webhook(p7);
    const x7 = await goi('POST', `/pos/thanh-toan/phien/${p7.id}/xac-nhan-tay`, { ly_do: 'Tiền về muộn khách báo lại' }, tkChu);
    k('D7 (Q2) tiền QR về SAU khi đơn App hết hạn → vào ví 100.000, không đơn, KHÔNG hạng; xác nhận tay → 409 PHIEN_APP_KHONG_TAO_LAI', w7.status === 200
      && (await soDu(kh7.sdt)) === 100000 && (await hangToi(kh7)) === null && (await soThe(kh7.sdt)) === 0 && la(x7, 409, 'PHIEN_APP_KHONG_TAO_LAI'),
    `${w7.status} · ${await soDu(kh7.sdt)} · ${moTa(x7)}`);

    const kh8 = await khach();
    const d8 = await dat1(kh8, gio([the(BAC, 1)]));
    const p8 = await phienCua(d8.j.ma_don);
    await db.run('UPDATE pos_membership_tiers SET is_active = 0 WHERE id = ?', [BAC]);
    await webhook(p8);
    await db.run('UPDATE pos_membership_tiers SET is_active = 1 WHERE id = ?', [BAC]);
    const ds8 = await goi('GET', '/kh/don', undefined, kh8.tk);
    const tb = (ds8.j.data || []).find((x) => x.ma === d8.j.ma_don)?.thong_bao_tien_ve || '';
    k('D8 hạng bị xoá giữa lúc đặt và tiền về → tiền vào ví, không hạng, lý do "vì thẻ hạng không còn mua được" (không phải "hết hàng")',
      (await soDu(kh8.sdt)) === 50000 && (await soThe(kh8.sdt)) === 0 && tb.includes('vì thẻ hạng không còn mua được'), tb);

    const kh9 = await khach(1000000);
    const truoc9 = await soThe(kh9.sdt);
    mocNem = true;
    const d9 = await datVi(kh9, gio([the(VANG, 1)]));
    mocNem = false;
    k('D9 lỗi máy lúc tạo phiên → 500 LOI_MAY_CHU, chỉ { error, code }, không dòng sổ thẻ', la(d9, 500, 'LOI_MAY_CHU') && bang(Object.keys(d9.j).sort(), ['code', 'error'])
      && (await soThe(kh9.sdt)) === truoc9, `${moTa(d9)} · ${d9.tho.slice(0, 120)}`);
    const i15 = await I15();
    k('I15 sạch: mọi đơn thẻ (quầy + App) đúng một dòng sổ, không dòng sổ của đơn huỷ', i15.length === 0, i15.join(' · '));
  });

  muc('[E] Huỷ / xoá / hoàn đơn App có thẻ → thu hồi như quầy; hạng tính lại từ sổ');
  await chay('E', async () => {
    const huy = (oid) => goi('PUT', `/pos/orders/${oid}/cancel`, { reason: 'thử huỷ' }, tkChu);
    const oidCua = async (maDon) => (await phienCua(maDon))?.order_id;
    const k1 = await khach(1000000);
    const e1 = await datVi(k1, gio([mon(0, 1), the(VANG, 1)]));
    const r1 = await huy(await oidCua(e1.j.ma_don));
    k('E1 quầy huỷ đơn thẻ App → dòng sổ mất, /toi.hang về null', la(e1, 200) && la(r1, 200) && (await soThe(k1.sdt)) === 0 && (await hangToi(k1)) === null, moTa(r1));
    const k2 = await khach(1000000);
    const e2 = await datVi(k2, gio([the(VANG, 1)]));
    const r2 = await goi('DELETE', `/pos/orders/${await oidCua(e2.j.ma_don)}`, undefined, tkChu);
    k('E2 xoá đơn thẻ App → dòng sổ mất, hết hạng', la(r2, 200) && (await soThe(k2.sdt)) === 0 && (await hangToi(k2)) === null, moTa(r2));
    const k3 = await khach(1000000);
    const e3 = await datVi(k3, gio([the(VANG, 1)]));
    const r3 = await goi('POST', '/pos/refunds', { order_id: await oidCua(e3.j.ma_don), reason: 'thử hoàn' }, tkChu);
    k('E3 xin hoàn đơn thẻ App (trả ví) → 400 DON_CO_GOI như quầy, hạng giữ', la(r3, 400, 'DON_CO_GOI') && (await hangToi(k3))?.id === VANG, moTa(r3));
    const k4 = await khach();
    const e4 = await dat1(k4, gio([the(VANG, 1)]));
    const h4 = await goi('POST', `/kh/don/${e4.j.ma_don}/huy`, {}, k4.tk);
    const p4 = await phienCua(e4.j.ma_don);
    await webhook(p4);
    k('E4 App huỷ đơn thẻ chưa trả → da_huy; tiền về sau đó vào ví, không bao giờ có dòng sổ', la(h4, 200) && h4.j.tien_trinh === 'da_huy' && (await soThe(k4.sdt)) === 0
      && (await hangToi(k4)) === null, moTa(h4));
    const k5 = await khach(1000000);
    await datVi(k5, gio([the(VANG, 1)]));
    const han1 = (await hangToi(k5))?.het_han;
    const e5 = await datVi(k5, gio([the(VANG, 1)]));
    const han2 = (await hangToi(k5))?.het_han;
    await huy(await oidCua(e5.j.ma_don));
    const han3 = (await hangToi(k5))?.het_han;
    k('E5 gia hạn cộng nối (hạn 2 > hạn 1) rồi huỷ đơn gia hạn → hạn về đúng hạn 1', !!han1 && !!han2 && han2 > han1 && han3 === han1, `${han1} → ${han2} → ${han3}`);
  });

  muc('[F] Quyền lợi hạng — bước 023, Cài đặt hạng (PIN), GET /hang quyen_loi[]');
  await chay('F', async () => {
    const cot = (await db.query('PRAGMA table_info(pos_membership_tiers)')).some((c) => c.name === 'quyen_loi');
    const buoc = await so('SELECT COUNT(*) AS n FROM pos_nang_cap WHERE so = 23');
    const { chayNangCap } = require(path.join(MAY_CHU,'nang_cap', 'chay.js'));
    const lai = await chayNangCap({ beginTransaction: db.beginTransaction, query: db.query });
    k('F1 bước 023 đã chạy, có cột quyen_loi; chạy lại bộ nâng cấp không hỏng', cot && buoc === 1 && lai.hong === null, `${cot} · ${buoc} · ${lai.hong}`);
    const hangGoc = async (id) => (await goi('GET', '/pos/tiers', undefined, tkChu)).j.data?.tiers?.find((t) => t.id === id);
    const gui = async (id, them, pin = PIN_CQ) => {
      const h = await hangGoc(id);
      const t = { id: h.id, name: h.name, sort_order: h.sort_order, discount_percent: h.discount_percent, special_discount_percent: h.special_discount_percent,
        cach_co: h.cach_co, goi: h.goi, ...them };
      return goi('PUT', '/pos/tiers', { tiers: [t], round_to: 500, round_mode: 'nearest', pin }, tkChu);
    };
    const ql = async (id) => (await goi('GET', '/kh/hang')).j.data?.find((x) => x.id === id)?.quyen_loi;
    const p2 = await gui(VANG, { quyen_loi: '  Giảm 10% mọi ly  \n\n  Tặng 1 ly ngày sinh \n' });
    k('F2 PUT quyen_loi nhiều dòng → GET /kh/hang quyen_loi[] đã cắt khoảng trắng, bỏ dòng rỗng; hạng khác []', la(p2, 200)
      && bang(await ql(VANG), ['Giảm 10% mọi ly', 'Tặng 1 ly ngày sinh']) && bang(await ql(KC), []), `${moTa(p2)} · ${JSON.stringify(await ql(VANG))}`);
    const p3 = await gui(VANG, { discount_percent: 10 });
    k('F3 PUT KHÔNG gửi quyen_loi (máy quầy bản cũ) → giữ nguyên chữ cũ', la(p3, 200) && bang(await ql(VANG), ['Giảm 10% mọi ly', 'Tặng 1 ly ngày sinh']), moTa(p3));
    const dong = (n, dai = 5) => Array.from({ length: n }, (_, i) => String(i).padEnd(dai, 'x')).join('\n');
    const ok10 = await gui(BAC, { quyen_loi: dong(10) });
    const sai11 = await gui(BAC, { quyen_loi: dong(11) });
    const ok120 = await gui(BAC, { quyen_loi: dong(1, 120) });
    const sai121 = await gui(BAC, { quyen_loi: dong(1, 121) });
    const saiKieu = await gui(BAC, { quyen_loi: ['a'] });
    k('F4 10 dòng / 120 ký tự → 200; 11 dòng / 121 ký tự / không phải chuỗi → 400 HANG_KHONG_HOP_LE', la(ok10, 200) && la(ok120, 200)
      && la(sai11, 400, 'HANG_KHONG_HOP_LE') && la(sai121, 400, 'HANG_KHONG_HOP_LE') && la(saiKieu, 400, 'HANG_KHONG_HOP_LE'),
    [ok10, sai11, ok120, sai121, saiKieu].map(moTa).join(' / '));
    const p5 = await gui(VANG, { quyen_loi: 'đổi trộm' }, '0000');
    k('F5 PIN chủ quán sai → không đổi', p5.status >= 400 && bang(await ql(VANG), ['Giảm 10% mọi ly', 'Tặng 1 ly ngày sinh']), moTa(p5));
    await db.run('UPDATE pos_pin_chu_quan SET sai = 0, khoa_den = NULL WHERE id = 1');
  });

  muc('[G] Hiển thị — hoa_don[], mon[], màn Đơn App ở quầy, tem');
  await chay('G', async () => {
    const kh = await khach(1000000);
    const dq = await dat1(kh, gio([the(VANG, 1), mon(0, 1, 'ít đường')]));   // thẻ đứng ĐẦU giỏ: đơn thật xếp thẻ SAU món (taoDon)
    const ct0 = await goi('GET', `/kh/don/${dq.j.ma_don}`, undefined, kh.tk);
    const ds0 = (await goi('GET', '/kh/don', undefined, kh.tk)).j.data?.find((x) => x.ma === dq.j.ma_don);
    const m0 = ct0.j.don?.mon || [];
    k('G2 đơn CHƯA trả: mon[] dòng thẻ loai "the", tên như bill quầy, ghi_chu null (đủ trường); món giữ ghi chú', m0.length === 2 && m0[1]?.loai === 'the'
      && m0[1]?.ten === '🎟️ Thẻ hội viên Vàng thử · 1 tháng' && 'ghi_chu' in (m0[1] || {}) && m0[1].ghi_chu === null && m0[0]?.ghi_chu === 'ít đường' && m0[0]?.loai === undefined,
    JSON.stringify(m0));
    await webhook(await phienCua(dq.j.ma_don));
    const ct = await goi('GET', `/kh/don/${dq.j.ma_don}`, undefined, kh.tk);
    const ds1 = (await goi('GET', '/kh/don', undefined, kh.tk)).j.data?.find((x) => x.ma === dq.j.ma_don);
    k('G6 so_mon đơn thẻ: chưa trả = sau khi trả = 2', ds0?.so_mon === 2 && ds1?.so_mon === 2, `${ds0?.so_mon} / ${ds1?.so_mon}`);
    const m1 = ct.j.don?.mon || [];
    const hinh = (m) => m.map((x) => [Object.keys(x).sort().join(','), x.ten, x.so_luong, x.don_gia, x.thanh_tien, x.ghi_chu ?? null, x.loai ?? null]);
    k('G7 CÙNG một đơn: mon[] (trường, thứ tự, tên, tiền, ghi chú) và mon_dau trước khi trả = sau khi trả', bang(hinh(m0), hinh(m1))
      && ds0?.mon_dau === ds1?.mon_dau && !!ds0?.mon_dau, `${JSON.stringify(hinh(m0))} ≠ ${JSON.stringify(hinh(m1))} · ${ds0?.mon_dau} / ${ds1?.mon_dau}`);
    k('G2 đơn đã trả: mon[] dòng thẻ loai "the", dòng món không có loai', m1.length === 2 && m1.filter((x) => x.loai === 'the').length === 1
      && m1.find((x) => x.loai !== 'the')?.ghi_chu === 'ít đường', JSON.stringify(m1));
    const hd = ct.j.don?.hoa_don || [];
    const oid = (await phienCua(dq.j.ma_don)).order_id;
    const han = (await db.queryOne('SELECT expires_at FROM pos_membership_purchases WHERE order_id = ?', [oid]))?.expires_at || '';
    const ngay = `${han.slice(8, 10)}/${han.slice(5, 7)}/${han.slice(0, 4)}`;
    const dThe = hd.filter((x) => x.loai === 'the');
    k('G1 hoa_don[]: đúng một dòng loai "the" (tên thẻ, giá), ghi_chu "Hạn mới: <ngày sổ>"; dòng đồ uống vẫn loai "mon"', dThe.length === 1
      && /Thẻ hội viên Vàng thử · 1 tháng/.test(dThe[0].trai) && dThe[0].ghi_chu === `Hạn mới: ${ngay}` && hd.filter((x) => x.loai === 'mon').length === 1,
    JSON.stringify(dThe));
    const kv = await khach(1000000);
    await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at, loai, so_thang)
      VALUES (?, ?, 'Vàng thử', 0, NULL, ?, '9999-12-31T23:59:59', 'cap', NULL)`, [kv.sdt, VANG, getNow()]);
    const dv = await datVi(kv, gio([the(VANG, 1)]));
    const hdv = (await goi('GET', `/kh/don/${dv.j.ma_don}`, undefined, kv.tk)).j.don?.hoa_don || [];
    const gv = hdv.find((x) => x.loai === 'the')?.ghi_chu;
    k('G1b hạn sau đơn là không thời hạn → hoa_don ghi "Hạn mới: không thời hạn" (không in năm 9999 / số lạ)', la(dv, 200) && gv === 'Hạn mới: không thời hạn', String(gv));
    const kc = await khach(1000000);
    const dc = await datVi(kc, gio([the(VANG, 1)]));
    const quay = (await goi('GET', '/pos/kh/don-app', undefined, tkChu)).j.data || [];
    const q1 = quay.find((x) => x.ma === dq.j.ma_don), q2 = quay.find((x) => x.ma === dc.j.ma_don);
    k('G3 màn Đơn App: đơn có thẻ co_the = tên thẻ, mon[] KHÔNG có dòng thẻ (quầy không pha)', q1?.co_the === '🎟️ Thẻ hội viên Vàng thử · 1 tháng'
      && q1?.mon?.length === 1 && q1?.mon?.[0]?.ghi_chu === 'ít đường', JSON.stringify(q1));
    k('Q3 màn Đơn App: đơn chỉ thẻ vẫn hiện, tien_trinh "xong", mon[] rỗng; đơn có đồ uống "da_tra"', q2?.tien_trinh === 'xong' && q2?.mon?.length === 0
      && q2?.co_the === '🎟️ Thẻ hội viên Vàng thử · 1 tháng' && q1?.tien_trinh === 'da_tra', `${JSON.stringify(q2)} · ${q1?.tien_trinh}`);
    const bl = await goi('POST', `/pos/kh/don-app/${q2?.id}/dang-lam`, {}, tkChu);
    k('Q3 đơn chỉ thẻ bấm "Đang làm" → bị từ chối (không có bước pha)', bl.status === 409, moTa(bl));
    const { dungTem } = await import(pathToFileURL(path.join(GOC, 'client', 'src', 'utils', 'inPhieu.js')).href);
    const items = await db.query('SELECT product_id, product_code, product_name, quantity, notes FROM pos_order_items WHERE order_id = ? ORDER BY id', [oid]);
    const tem = dungTem({ items, customer_name: 'K', code: 'X-1', created_at: getNow() }, {}, { khong_pha: [] });
    k('G4 tem ly của đơn thẻ App: một tem cho đồ uống, không tem cho thẻ', items.length === 2 && tem.length === 1 && !/Thẻ/.test(tem[0].ten), JSON.stringify(tem.map((t) => t.ten)));
  });

  muc('[H] Điểm — CÙNG hàm cộng điểm của quầy');
  await chay('H', async () => {
    const ka = await khach(1000000), kq = await khach();
    const a = await datVi(ka, gio([the(VANG, 1)]));
    const o = await taoTaiQuay(kq, { items: [], membership_buy: { tier_id: VANG, so_thang: 1 }, payment_method: 'cash', cash_amount: 100000 });
    const dA = await diemDon((await phienCua(a.j.ma_don))?.order_id), dQ = await diemDon(o.j.order?.id);
    k('H1 điểm đơn thẻ App (trả ví 100.000) = điểm đơn thẻ quầy (tiền mặt 100.000)', la(a, 200) && dA === dQ && dQ > 0, `${dA} / ${dQ}`);
  });

  muc('[GIỜ] (Q4 chủ quán 09.11) giỏ không cần pha chế bán MỌI giờ; giỏ có đồ uống vẫn theo giờ');
  await chay('GIO', async () => {
    const kh = await khach(1000000);
    await datLich(hhmm(-180), hhmm(-120));
    const c1 = await baoGia(kh, gio([the(VANG, 1)])), c2 = await baoGia(kh, gio([mon(0)])), c3 = await baoGia(kh, gio([mon(0), the(VANG, 1)]));
    k('GIO1 quán đóng: giỏ chỉ thẻ → 200; có đồ uống (một mình / cùng thẻ) → 400 NGOAI_GIO', la(c1, 200) && la(c2, 400, 'NGOAI_GIO') && la(c3, 400, 'NGOAI_GIO'),
      [c1, c2, c3].map(moTa).join(' / '));
    const d = await datVi(kh, gio([the(VANG, 1)]));
    k('GIO3 quán đóng: đặt giỏ chỉ thẻ trả ví → 200 + có hạng', la(d, 200) && (await hangToi(kh))?.id === VANG, moTa(d));
    await datLich(hhmm(-60), hhmm(30), 60);
    const n1 = await baoGia(kh, gio([the(VANG, 1)])), n2 = await baoGia(kh, gio([mon(0)]));
    k('GIO2 quá giờ nhận đơn: giỏ chỉ thẻ → 200; đồ uống → 400 QUA_GIO_NHAN_DON', la(n1, 200) && la(n2, 400, 'QUA_GIO_NHAN_DON'), `${moTa(n1)} / ${moTa(n2)}`);
    await boLich();
  });

  muc('[K5] Không đổi — giỏ cũ, khoá gửi cũ');
  await chay('K', async () => {
    const kh = await khach(1000000);
    const d = await datVi(kh, gio([mon(0, 2, 'ít đá'), mon(1, 1)]));
    const a = await donApp(d.j.ma_don);
    k('K1 giỏ cũ (không thẻ) băm y như code gốc — khoá gửi đang sống trên production không lệch', la(d, 200) && a?.bam === BAM_GOC, `${moTa(d)} · ${a?.bam}`);
    k('K2 đơn đồ uống trả ví → da_tra như cũ (quầy còn pha)', d.j.tien_trinh === 'da_tra', d.j.tien_trinh);
    const truoc = (thang) => new Date(Date.parse(getNow() + 'Z') - thang * 31 * 86400000).toISOString().slice(0, 19);
    const kg = await khach(1000000);
    await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at, loai, so_thang)
      VALUES (?, ?, 'Kim Cương thử', 0, NULL, ?, ?, 'cap', 1)`, [kg.sdt, KC, truoc(2), truoc(1)]);
    await datVi(kg, gio([the(VANG, 1)]));
    const hg = await hangToi(kg);
    const bg = await baoGia(kg, gio([the(VANG, 1)]));
    k('K5a luật giảm hạng: Kim Cương (cấp 1 tháng) đã hết hạn → không chặn mua Vàng; /toi.hang = Vàng', hg?.id === VANG && la(bg, 200), `${JSON.stringify(hg)} · ${moTa(bg)}`);
    const kh5 = await khach(1000000);
    await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at, loai, so_thang)
      VALUES (?, ?, 'Vàng thử', 100000, NULL, ?, ?, 'ban', 1)`, [kh5.sdt, VANG, truoc(3), truoc(2)]);
    const h0 = await hangToi(kh5);
    const d5 = await datVi(kh5, gio([the(VANG, 1)]));
    const h5 = await hangToi(kh5);
    k('K5b Vàng đã hết hạn mua lại Vàng trên App → 200, có hạng, hạn mới tính từ hôm nay (> bây giờ)', h0 === null && la(d5, 200) && h5?.id === VANG
      && h5?.het_han > getNow(), `${JSON.stringify(h0)} · ${moTa(d5)} · ${JSON.stringify(h5)}`);
  });

  muc('[S] An toàn — khách chỉ thấy / mua cho chính mình');
  await chay('S', async () => {
    const kA = await khach(1000000), kB = await khach(1000000);
    const s1 = await datVi(kA, gio([the(VANG, 1)], { customer_phone: kB.sdt, sdt: kB.sdt }));
    k('S1 thân có SĐT khách B → thẻ vẫn ghi cho khách token A', la(s1, 200) && (await soThe(kA.sdt)) === 1 && (await soThe(kB.sdt)) === 0, moTa(s1));
    const s2 = await goi('GET', `/kh/don/${s1.j.ma_don}`, undefined, kB.tk);
    k('S2 khách B đọc đơn thẻ của A → 404', s2.status === 404, moTa(s2));
    const s3 = await baoGia(kA, gio([the(VANG, 1, { don_gia: 1, gia: 1 })]));
    k('S3 dòng thẻ kèm don_gia / gia lạ → 400 (máy chủ không nhận giá App gửi)', la(s3, 400, 'YEU_CAU_KHONG_HOP_LE'), moTa(s3));
    const s4 = await baoGia(kA, gio([the(KC, 1)]));
    k('S4 lỗi thẻ chỉ { error, code }', bang(Object.keys(s4.j).sort(), ['code', 'error']), JSON.stringify(s4.j));
  });

  sv.close(); svGia.close();
  return ket();
}

function ket() {
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
