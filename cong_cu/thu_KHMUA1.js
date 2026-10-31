#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KH-MUA-1 — App KH đặt đơn nhận tại quán: báo giá · tạo đơn (QR payOS / ví + PIN / ví + QR) · chống trùng · tiến trình · huỷ ·
 *  đơn về quầy (danh sách + Đang làm / Xong) · tiền về muộn · cài đặt chuông
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có /gio/bao-gia, POST /don, bảng pos_don_app). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KHMUA1.js
 *
 *  Khuôn thu_P3.js: database.js + libsql thật trên kho TẠM, chỉ thay ketNoiKho (P8), SX tắt; payOS giả trên 127.0.0.1; webhook ký bằng
 *  công thức viết riêng trong bài. checkStock của SX thay bằng móc (C10) TRƯỚC khi nạp orders.js. Thời gian trôi = lùi cột giờ trong kho
 *  tạm, không ngủ. Giờ hoạt động / Giờ vàng dựng quanh giờ VN hiện tại của máy chủ (getNow). So HTTP status + `code`, không dò lời báo.
 *  "Đếm bảng" (luật 4xx, chủ quán duyệt Q8): số đơn, số dòng đơn App, số phiên, phiên đang giữ, tổng đang giữ ví, số dòng sổ ví, số dư.
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khmua1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_khmua1_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_khmua1_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.khmua1.local/tra-ve';

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
const GIO_VN = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/;

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();

  // C10: SX báo thiếu hàng lúc tạo phiên — móc checkStock TRƯỚC khi nạp orders.js (orders.js lấy hàm lúc require).
  const sx = require(path.join(GOC, 'server', 'utils', 'sxApi.js'));
  let tonGia = null, mocCS = null;   // mocCS: hàm thay checkStock cho một ca (vòng sửa 1: đổi giá / hết hàng ĐÚNG lúc tạo phiên hay chốt)
  const csGoc = sx.checkStock;
  sx.checkStock = async (...a) => (mocCS ? mocCS(...a) : tonGia ? { sufficient: false, stock: tonGia } : csGoc(...a));
  // Vòng sửa 1 (soát lỗi 1, 5): móc đọc / ghi CSDL — gắn TRƯỚC khi nạp route (donApp / giuCho lấy hàm lúc require).
  //  mocNemSauChot: lần đọc phiên đầu tiên thấy da_thu thì ném (mạng chập SAU khi chốt ví đã ghi xong).
  //  rao: hai lần tra khoá gửi chờ nhau rồi cùng đi tiếp → hai yêu cầu chồng thật, cùng tới INSERT giữ khoá.
  //  mocCham: INSERT giữ khoá xong thì chờ 400 ms → yêu cầu thứ hai tra khoá đúng lúc dòng giữ khoá chưa có phiên.
  let mocNemSauChot = false, rao = null, mocCham = false;
  const ngu = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const qoGoc = db.queryOne;
  db.queryOne = async (sql, p) => {
    if (rao && /FROM pos_don_app WHERE phone = \? AND khoa_gui = \?/.test(sql)) {
      const r0 = rao;
      await new Promise((ok) => { r0.cho.push(ok); if (r0.cho.length >= 2) { rao = null; r0.cho.forEach((f) => f()); } });
    }
    const r = await qoGoc(sql, p);
    if (mocNemSauChot && /FROM pos_phien_thanh_toan WHERE id = \?/.test(sql) && r?.trang_thai === 'da_thu') {
      mocNemSauChot = false;
      throw new Error('mạng chập sau khi chốt (bài thử)');
    }
    return r;
  };
  const runGocDb = db.run;
  db.run = async (sql, p) => {
    const r = await runGocDb(sql, p);
    if (mocCham && /INSERT INTO pos_don_app/.test(sql)) { mocCham = false; await ngu(400); }
    return r;
  };
  // D (KHO_BAN): câu ghi phiên trong giao dịch ném "kho bận" một lần.
  let mocBan = false;
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const tx = await txGoc(...a);
    const runGoc = tx.run;
    tx.run = async (sql, p) => {
      if (mocBan && /INSERT INTO pos_phien_thanh_toan/.test(sql)) { mocBan = false; throw Object.assign(new Error('kho bận (bài thử)'), { code: 'SQLITE_BUSY' }); }
      return runGoc(sql, p);
    };
    return tx;
  };

  const payosNhan = [];
  const gia = express();
  gia.use(express.json());
  gia.post('/v2/payment-requests', (req, res) => {
    payosNhan.push(req.body);
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
  const tt = require(R('thanh-toan.js'));
  app.use('/api/pos/thanh-toan', tt);
  app.use('/api/payos/webhook', tt.webhook);
  app.use('/api/pos/kh', require(R('kh/quay.js')));
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const { kyTokenKhach } = require(path.join(GOC, 'server', 'middleware', 'khachAuth.js'));
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
  const sps = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 4');
  const GIA = [25000, 30000, 20000];
  for (let i = 0; i < 3; i++) await db.run('UPDATE pos_products SET price = ?, ton_gan_nhat = ? WHERE id = ?', [GIA[i], [null, 5, 0][i], sps[i].id]);
  await db.run('UPDATE pos_products SET price = 0 WHERE id = ?', [sps[3].id]);
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
  const moTa = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const so = async (sql, p = []) => Number((await db.queryOne(sql, p).catch(() => null))?.n ?? -1);
  const soDu = async (sdt) => Number((await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [sdt]))?.balance || 0);
  const dangGiu = (sdt) => so(`SELECT COALESCE(SUM(giu_vi), 0) AS n FROM pos_phien_thanh_toan WHERE phone = ? AND trang_thai = 'cho' AND het_han > ?`, [sdt, getNow()]);
  const chup = async (sdt) => [await so('SELECT COUNT(*) AS n FROM pos_orders'), await so('SELECT COUNT(*) AS n FROM pos_don_app'),
    await so('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan'), await so("SELECT COUNT(*) AS n FROM pos_phien_thanh_toan WHERE trang_thai = 'cho'"),
    await dangGiu(sdt), await so('SELECT COUNT(*) AS n FROM pos_balance_transactions'), await soDu(sdt)].join('/');
  const donApp = (maDon) => db.queryOne('SELECT * FROM pos_don_app WHERE ma = ?', [maDon]).catch(() => null);
  const phienCua = async (maDon) => { const a = await donApp(maDon); return a ? db.queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [a.phien_id]) : null; };
  const lui = (bang, cot, dk, p, giay) => db.run(`UPDATE ${bang} SET ${cot} = strftime('%Y-%m-%dT%H:%M:%S', ${cot}, '-${giay} seconds') WHERE ${dk}`, p).catch(() => {});

  let soSdt = 0;
  const khach = async (napVi = 0, pin = '1357') => {
    const sdt = '09' + String(41000000 + (++soSdt)).padStart(8, '0');
    const id = Number((await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + sdt, getNow()])).lastInsertRowid);
    if (napVi) await goi('POST', '/pos/wallets/topup', { phone: sdt, amount: napVi }, tkChu);
    if (pin) await goi('POST', '/pos/thanh-toan/pin', { phone: sdt, pin, pin_lai: pin }, tkChu);
    return { sdt, id, tk: kyTokenKhach(id) };
  };
  let soKhoa = 0;
  const khoaMoi = () => 'khoa-thu-' + String(++soKhoa).padStart(8, '0') + '-' + ngauNhien().slice(0, 6);
  const gio = (mon = [{ ma: ma(0), so_luong: 2, ghi_chu: 'ít đá' }], them = {}) => ({ mon, cach_nhan: 'tai_quan', ...them });
  const baoGia = (kh, than) => goi('POST', '/kh/gio/bao-gia', than, kh.tk);
  // Đặt đơn: tong_da_xem lấy từ báo giá ngay trước (như App), trừ khi ca truyền sẵn.
  const dat1 = async (kh, than, them = {}) => {
    let tong = them.tong_da_xem;
    if (tong === undefined) tong = (await baoGia(kh, than)).j.tong;
    return goi('POST', '/kh/don', { ...than, khoa_gui: khoaMoi(), cach_tra: 'qr', tong_da_xem: tong, ...them }, kh.tk);
  };
  let soRef = 0;
  const webhook = (p, them = {}) => {
    const data = { orderCode: p.ma_payos, amount: p.con_lai, description: p.noi_dung || 'x', accountNumber: '12345678', reference: 'REF' + (++soRef),
      transactionDateTime: getNow().replace('T', ' '), currency: 'VND', paymentLinkId: 'pl_' + p.ma_payos, code: '00', desc: 'success',
      counterAccountBankId: '', counterAccountName: null, ...them };
    return goi('POST', '/payos/webhook', { code: '00', desc: 'success', success: true, data, signature: hmac(chuoiKy(data)) });
  };
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };

  // Giờ VN hiện tại ± phút → 'HH:mm' (lịch cả tuần cùng một ca).
  const hhmm = (phut) => new Date(Date.parse(getNow() + 'Z') + phut * 60000).toISOString().slice(11, 16);
  const datLich = async (mo, dong, ngung = 0) => {
    const lich = {}; for (const t of [2, 3, 4, 5, 6, 7, 8]) lich[t] = { mo, dong };
    await datCaiDat('gio_hd_lich', JSON.stringify(lich)); await datCaiDat('gio_hd_ngung_truoc_phut', ngung);
  };
  const boLich = async () => { await datCaiDat('gio_hd_lich', ''); await datCaiDat('gio_hd_ngung_truoc_phut', 0); };
  const flash = async (bat, pt = 20) => { for (const [a, b] of [['flash_enabled', bat ? 'true' : 'false'], ['flash_start', hhmm(-60)], ['flash_end', hhmm(60)],
    ['flash_percent', pt], ['flash_product_keys', JSON.stringify([ma(0)])]]) await datCaiDat(a, b); };
  const hangId = Number((await db.run(`INSERT INTO pos_membership_tiers (name, card_price, discount_percent, special_discount_percent, sort_order, is_active)
    VALUES ('Vàng thử', 1000, 10, 5, 9, 1)`)).lastInsertRowid);
  const choHang = (sdt) => db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
    VALUES (?, ?, 'Vàng thử', 1000, NULL, ?, datetime('now', '+7 hours', '+300 days'))`, [sdt, hangId, getNow()]);
  const taoMa = (code, them = {}) => db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, usage_limit, used_count, is_active)
    VALUES (?, ?, ?, ?, 0, 1)`, [code, them.loai || 'fixed', them.gia_tri || 5000, them.luot || 0]);
  await taoMa('THU5K');
  await taoMa('THU10PT', { loai: 'percent', gia_tri: 10 });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] POST /gio/bao-gia — đi đúng taoDon chế độ chỉ tính, không ghi gì');
  await chay('A', async () => {
    const kh = await khach(0, null);
    await choHang(kh.sdt);
    const tinhThu = (than) => goi('POST', '/pos/orders/tinh-thu', { customer_phone: kh.sdt, ...than }, tkChu);
    const truoc = await chup(kh.sdt);
    const g1 = gio([{ ma: ma(0), so_luong: 2, ghi_chu: 'ít đá' }, { ma: ma(1), so_luong: 1 }], { ma_giam: 'THU5K' });
    const b1 = await baoGia(kh, g1);
    const q1 = await tinhThu({ items: [monQuay(0, 2), monQuay(1, 1)], discount_code: 'THU5K' });
    const giam = (r, loai) => (r.j.giam || []).find((x) => x.loai === loai)?.so_tien;
    k('A1 giỏ hạng + mã: tam_tinh / giảm hạng / giảm mã / tong = tinh-thu của quầy cùng giỏ', la(b1, 200) && la(q1, 200) && b1.j.tam_tinh === q1.j.subtotal
      && giam(b1, 'hang') === q1.j.tier_discount && giam(b1, 'ma_giam') === q1.j.discount_amount && b1.j.tong === q1.j.total && q1.j.tier_discount > 0
      && q1.j.discount_amount > 0, `${moTa(b1)} · ${JSON.stringify(b1.j).slice(0, 200)} · quầy ${q1.j.subtotal}/${q1.j.tier_discount}/${q1.j.discount_amount}/${q1.j.total}`);
    k('A6 Σ dong.thanh_tien = tam_tinh; tam_tinh − Σ giam + phi_giao = tong; dong theo đúng ma / so_luong gửi', la(b1, 200)
      && b1.j.dong.reduce((s, d) => s + d.thanh_tien, 0) === b1.j.tam_tinh
      && b1.j.tam_tinh - b1.j.giam.reduce((s, x) => s + x.so_tien, 0) + b1.j.phi_giao === b1.j.tong
      && b1.j.dong[0].ma === ma(0) && b1.j.dong[0].so_luong === 2 && b1.j.dong[0].don_gia === GIA[0] && b1.j.dong[1].ma === ma(1));
    k('A8 phi_giao === 0; giam[].loai chỉ trong ma_giam · hang · gio_vang', la(b1, 200) && b1.j.phi_giao === 0
      && b1.j.giam.every((x) => ['ma_giam', 'hang', 'gio_vang'].includes(x.loai) && x.so_tien > 0));
    await flash(true, 20);
    const g2 = gio([{ ma: ma(0), so_luong: 1 }]);
    const b2 = await baoGia(kh, g2);
    const q2 = await tinhThu({ items: [monQuay(0, 1)] });
    k('A1 giỏ Giờ vàng: dòng gio_vang = flash_discount quầy, KHÔNG dòng hang (dòng 0 không có — A2), tong = quầy', la(b2, 200)
      && giam(b2, 'gio_vang') === q2.j.flash_discount && q2.j.flash_discount > 0 && giam(b2, 'hang') === undefined && b2.j.tong === q2.j.total,
    `${moTa(b2)} · ${JSON.stringify(b2.j.giam)} · quầy ${q2.j.flash_discount}/${q2.j.total}`);
    const b7 = await baoGia(kh, gio([{ ma: ma(0), so_luong: 1 }], { ma_giam: 'THU10PT' }));
    k('A7 mã % lúc Giờ vàng (quầy báo lỗi cả đơn) → 200, không dòng ma_giam, ma_giam_loi { code, error }, tong = giá không mã', la(b7, 200)
      && giam(b7, 'ma_giam') === undefined && b7.j.ma_giam_loi && typeof b7.j.ma_giam_loi.code === 'string' && typeof b7.j.ma_giam_loi.error === 'string'
      && b7.j.tong === b2.j.tong, `${moTa(b7)} · ${JSON.stringify(b7.j).slice(0, 200)}`);
    await flash(false);
    const b3 = await baoGia(kh, gio([{ ma: ma(0), so_luong: 1 }], { ma_giam: 'KHONGCOMA' }));
    k('A3 mã không tồn tại → 200, không dòng ma_giam, ma_giam_loi.code = MA_KHONG_TON_TAI', la(b3, 200) && giam(b3, 'ma_giam') === undefined
      && b3.j.ma_giam_loi?.code === 'MA_KHONG_TON_TAI', `${moTa(b3)} · ${JSON.stringify(b3.j.ma_giam_loi)}`);
    const b4 = await baoGia(kh, gio([{ ma: ma(0), so_luong: 1 }]));
    k('A3 không gửi mã → ma_giam_loi null', la(b4, 200) && b4.j.ma_giam_loi === null, JSON.stringify(b4.j.ma_giam_loi));
    const b5 = await baoGia(kh, gio(undefined, { cach_nhan: 'giao' }));
    k('A5 cach_nhan "giao" → 400 CHUA_GIAO', la(b5, 400, 'CHUA_GIAO'), moTa(b5));
    const b6 = [await baoGia(kh, gio(undefined, { cach_nhan: 'bay' })), await baoGia(kh, { mon: [{ ma: ma(0), so_luong: 1 }] }),
      await baoGia(kh, gio([{ ma: ma(0), so_luong: 0 }])), await baoGia(kh, gio([]))];
    k('A5 cach_nhan lạ / thiếu, SL 0, giỏ rỗng → 400 YEU_CAU_KHONG_HOP_LE', b6.every((r) => la(r, 400, 'YEU_CAU_KHONG_HOP_LE')), b6.map(moTa).join(' / '));
    k('A4 báo giá không ghi gì (đếm bảng trước = sau)', (await chup(kh.sdt)) === truoc, `${truoc} → ${await chup(kh.sdt)}`);
    const kt = await goi('POST', '/kh/gio/bao-gia', g2);
    k('K2 báo giá không token → 401 KH_TOKEN_SAI', la(kt, 401, 'KH_TOKEN_SAI'), moTa(kt));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] chặn đặt: ngoài giờ · ngừng nhận · hết hàng · món không bán — cả báo giá lẫn tạo đơn, bảng không đổi');
  await chay('B', async () => {
    const kh = await khach(100000);
    const hai = async (than, them = {}) => [await baoGia(kh, than),
      await goi('POST', '/kh/don', { ...than, khoa_gui: khoaMoi(), cach_tra: 'qr', tong_da_xem: 25000, ...them }, kh.tk)];
    const truoc = await chup(kh.sdt);
    await datLich(hhmm(120), hhmm(180));
    let r = await hai(gio([{ ma: ma(0), so_luong: 1 }]));
    k('B1 quán đóng → 400 NGOAI_GIO (báo giá + tạo đơn)', r.every((x) => la(x, 400, 'NGOAI_GIO')), r.map(moTa).join(' / '));
    await datLich(hhmm(-120), hhmm(20), 21);
    r = await hai(gio([{ ma: ma(0), so_luong: 1 }]));
    k('B2 quán mở, đã ngừng nhận (đóng sau 20 phút, ngừng trước 21) → 400 QUA_GIO_NHAN_DON', r.every((x) => la(x, 400, 'QUA_GIO_NHAN_DON')), r.map(moTa).join(' / '));
    await datLich(hhmm(-120), hhmm(20), 19);
    const b3 = await baoGia(kh, gio([{ ma: ma(0), so_luong: 1 }]));
    k('B3 ngay dưới mốc ngừng (ngừng trước 19 phút) → còn nhận, báo giá 200', la(b3, 200), moTa(b3));
    await boLich();
    r = await hai(gio([{ ma: ma(2), so_luong: 1 }]));
    k('B4 món con_hang false (tồn 0) → 400 HET_HANG kèm ma', r.every((x) => la(x, 400, 'HET_HANG') && x.j.ma === ma(2)), r.map((x) => moTa(x) + ' ' + x.j.ma).join(' / '));
    r = await hai(gio([{ ma: ma(1), so_luong: 4 }, { ma: ma(1), so_luong: 2 }]));
    k('B5 tổng SL một món (4 + 2) vượt tồn đã biết (5) → 400 HET_HANG kèm ma', r.every((x) => la(x, 400, 'HET_HANG') && x.j.ma === ma(1)), r.map(moTa).join(' / '));
    r = await hai(gio([{ ma: ma(3), so_luong: 1 }]));
    const r2 = await hai(gio([{ ma: 'khong_co_999', so_luong: 1 }]));
    k('B6 món giá 0 / mã lạ → 400 MON_KHONG_BAN kèm ma', [...r, ...r2].every((x) => la(x, 400, 'MON_KHONG_BAN')) && r2[0].j.ma === 'khong_co_999',
      [...r, ...r2].map(moTa).join(' / '));
    k('B bảng không đổi sau mọi ca chặn', (await chup(kh.sdt)) === truoc, `${truoc} → ${await chup(kh.sdt)}`);
    const b7 = await baoGia(kh, gio([{ ma: ma(0), so_luong: 3 }]));
    k('K5 món tồn chưa rõ (con_hang null) không bị chặn; món tồn 5 đặt 5 không bị chặn', la(b7, 200)
      && la(await baoGia(kh, gio([{ ma: ma(1), so_luong: 5 }])), 200), moTa(b7));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] POST /don — qr / vi / vi_qr qua phiên thanh toán sẵn có');
  await chay('C', async () => {
    const a = await khach(0);
    const n0 = payosNhan.length;
    const r1 = await dat1(a, gio());
    const p1 = await phienCua(r1.j.ma_don);
    k('C1 qr → 200, tien_trinh cho_tra, phiên payos, qr.chuoi = QR payOS, giu_vi 0, con_lai = tong', la(r1, 200) && r1.j.tien_trinh === 'cho_tra'
      && p1?.cach === 'payos' && r1.j.qr?.chuoi === p1.qr && r1.j.giu_vi === 0 && r1.j.con_lai === r1.j.tong && r1.j.tong === 50000
      && payosNhan.length === n0 + 1 && payosNhan[n0].amount === 50000, `${moTa(r1)} · ${JSON.stringify(r1.j).slice(0, 200)}`);
    k('C9 qr.het_han = het_han phiên, dạng giờ VN; trung false', la(r1, 200) && r1.j.qr?.het_han === p1?.het_han && GIO_VN.test(r1.j.qr?.het_han || '')
      && r1.j.trung === false, JSON.stringify(r1.j.qr));
    k('C1 chưa có đơn thật (đơn chỉ thành khi trả đủ)', !p1?.order_id);

    const b = await khach(100000);
    const donTruoc = await so('SELECT COUNT(*) AS n FROM pos_orders');
    const r2 = await dat1(b, gio(), { cach_tra: 'vi', pin: '1357' });
    const p2 = await phienCua(r2.j.ma_don);
    const o2 = p2?.order_id ? await db.queryOne('SELECT * FROM pos_orders WHERE id = ?', [p2.order_id]) : null;
    k('C2 vi đủ → 200 da_tra, đơn thật trả bằng ví, ví trừ đúng tong, qr null, con_lai 0', la(r2, 200) && r2.j.tien_trinh === 'da_tra' && !!o2
      && o2.payment_method === 'balance' && o2.total === 50000 && (await soDu(b.sdt)) === 50000 && r2.j.qr === null && r2.j.con_lai === 0
      && r2.j.giu_vi === 50000 && (await so('SELECT COUNT(*) AS n FROM pos_orders')) === donTruoc + 1, `${moTa(r2)} · ví ${await soDu(b.sdt)}`);
    k('C2 đơn thật mang ghi chú ly + người tạo app_kh', !!o2 && (await db.queryOne('SELECT notes FROM pos_order_items WHERE order_id = ?', [o2.id]))?.notes === 'ít đá'
      && o2.created_by === 'app_kh');

    const c = await khach(20000);
    const n3 = payosNhan.length;
    const r3 = await dat1(c, gio(), { cach_tra: 'vi_qr', pin: '1357' });
    k('C3 vi_qr → giữ 20.000 ví, QR phần còn 30.000, cho_tra, ví chưa trừ', la(r3, 200) && r3.j.giu_vi === 20000 && r3.j.con_lai === 30000
      && r3.j.tien_trinh === 'cho_tra' && payosNhan[n3]?.amount === 30000 && (await dangGiu(c.sdt)) === 20000 && (await soDu(c.sdt)) === 20000, moTa(r3));

    const d = await khach(100000);
    const tD = await chup(d.sdt);
    const r4 = await dat1(d, gio(), { cach_tra: 'vi_qr', pin: '1357' });
    k('C4 ví đủ mà chọn vi_qr → 400 CACH_KHONG_KHOP, bảng không đổi', la(r4, 400, 'CACH_KHONG_KHOP') && (await chup(d.sdt)) === tD, moTa(r4));
    const e = await khach(10000);
    const tE = await chup(e.sdt);
    const r5 = await dat1(e, gio(), { cach_tra: 'vi', pin: '1357' });
    k('C5 ví thiếu mà chọn vi → 400 VI_KHONG_DU, bảng không đổi', la(r5, 400, 'VI_KHONG_DU') && (await chup(e.sdt)) === tE, moTa(r5));
    const r6 = await dat1(e, gio(), { cach_tra: 'vi', pin: '9999' });
    const pinSai = Number((await db.queryOne('SELECT pin_sai FROM pos_customers WHERE phone = ?', [e.sdt]))?.pin_sai || 0);
    k('C6 PIN sai → 400 PIN_SAI, đếm sai +1 (như quầy), bảng không đổi', la(r6, 400, 'PIN_SAI') && pinSai === 1 && (await chup(e.sdt)) === tE, `${moTa(r6)} · pin_sai ${pinSai}`);
    const r7 = await dat1(a, gio(), { tong: 1, don_gia: 1, gia: 1, total: 1 });
    k('C7 thân gửi tong / don_gia / total = 1 → bị bỏ qua, tong = 50.000 máy chủ tính', la(r7, 200) && r7.j.tong === 50000, `${moTa(r7)} · ${r7.j.tong}`);
    const f = await khach(100000, null);
    const tF = await chup(f.sdt);
    const r8 = await dat1(f, gio(), { cach_tra: 'vi', pin: '1357' });
    k('C8 khách chưa đặt PIN trả ví → 400 CHUA_CO_PIN, bảng không đổi', la(r8, 400, 'CHUA_CO_PIN') && (await chup(f.sdt)) === tF, moTa(r8));
    const g = await khach(100000);
    for (let i = 0; i < 5; i++) await dat1(g, gio(), { cach_tra: 'vi', pin: '0000' });
    const tG = await chup(g.sdt);
    const r9 = await dat1(g, gio(), { cach_tra: 'vi', pin: '1357' });
    k('C8 sai PIN 5 lần → lần sau (PIN đúng) 423 PIN_DANG_KHOA, bảng không đổi', la(r9, 423, 'PIN_DANG_KHOA') && (await chup(g.sdt)) === tG, moTa(r9));
    const h = await khach(0);
    const bg = await baoGia(h, gio([{ ma: ma(1), so_luong: 2 }]));
    tonGia = 1;
    const tH = await chup(h.sdt);
    const r10 = await dat1(h, gio([{ ma: ma(1), so_luong: 2 }]), { tong_da_xem: bg.j.tong });
    tonGia = null;
    k('C10 SX báo thiếu hàng lúc tạo phiên → 400 HET_HANG kèm ma, bảng không đổi', la(r10, 400, 'HET_HANG') && r10.j.ma === ma(1)
      && (await chup(h.sdt)) === tH, `${moTa(r10)} · ${r10.j.ma}`);
    const vq = await khach(0);
    const r11 = await dat1(vq, gio(), { cach_tra: 'vi_qr', pin: '1357' });
    k('Q3 ví 0đ chọn vi_qr → cho qua như qr (giữ 0, QR cả đơn)', la(r11, 200) && r11.j.giu_vi === 0 && r11.j.con_lai === 50000, moTa(r11));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] luật 4xx: MỌI lỗi có mã của POST /don = chưa tạo đơn, chưa giữ / trừ ví (đếm bảng từng mã)');
  await chay('D', async () => {
    // Mỗi ca một khách mới (trần 10 lượt / 10 phút theo khách — Q9); chuanBi chạy TRƯỚC khi chụp bảng.
    let kh = null;
    const ca = async (ten, status, code, gui, chuanBi = async () => {}) => {
      kh = await khach(100000);
      await chuanBi();
      const truoc = await chup(kh.sdt);
      const r = await gui();
      const sau = await chup(kh.sdt);
      k(`D1 ${code} → ${status}, bảng trước = sau`, la(r, status, code) && truoc === sau, `${moTa(r)} · ${truoc} → ${sau}`);
      return r;
    };
    const than = (them = {}) => ({ ...gio(), khoa_gui: khoaMoi(), cach_tra: 'vi', pin: '1357', tong_da_xem: 50000, ...them });
    const don = (them) => goi('POST', '/kh/don', than(them), kh.tk);
    await ca('khoá sai', 400, 'KHOA_GUI_SAI', () => don({ khoa_gui: 'ngan' }));
    await ca('thiếu tong_da_xem', 400, 'YEU_CAU_KHONG_HOP_LE', () => don({ tong_da_xem: undefined }));
    await ca('tong_da_xem âm', 400, 'YEU_CAU_KHONG_HOP_LE', () => don({ tong_da_xem: -1 }));
    await ca('tong_da_xem lẻ', 400, 'YEU_CAU_KHONG_HOP_LE', () => don({ tong_da_xem: 50000.5 }));
    await ca('tong_da_xem chuỗi', 400, 'YEU_CAU_KHONG_HOP_LE', () => don({ tong_da_xem: '50000' }));
    await ca('cach_tra lạ', 400, 'YEU_CAU_KHONG_HOP_LE', () => don({ cach_tra: 'tien_mat' }));
    await ca('giao', 400, 'CHUA_GIAO', () => don({ cach_nhan: 'giao' }));
    await datLich(hhmm(120), hhmm(180));
    await ca('ngoài giờ', 400, 'NGOAI_GIO', () => don());
    await datLich(hhmm(-120), hhmm(20), 30);
    await ca('ngừng nhận', 400, 'QUA_GIO_NHAN_DON', () => don());
    await boLich();
    await ca('món không bán', 400, 'MON_KHONG_BAN', () => don({ mon: [{ ma: ma(3), so_luong: 1 }] }));
    await ca('hết hàng', 400, 'HET_HANG', () => don({ mon: [{ ma: ma(2), so_luong: 1 }] }));
    await ca('giá đã đổi', 409, 'GIA_DA_DOI', () => don({ tong_da_xem: 49999 }));
    await ca('ví đủ chọn vi_qr', 400, 'CACH_KHONG_KHOP', () => don({ cach_tra: 'vi_qr' }));
    await ca('ví thiếu', 400, 'VI_KHONG_DU', () => don({ mon: [{ ma: ma(0), so_luong: 5 }], tong_da_xem: 125000 }));
    await ca('PIN sai', 400, 'PIN_SAI', () => don({ pin: '0000' }));
    mocBan = true;
    await ca('kho bận', 409, 'KHO_BAN', () => don());
    mocBan = false;
    const kt = await ca('không token', 401, 'KH_TOKEN_SAI', () => goi('POST', '/kh/don', than()));
    const dup = than();
    await ca('khoá dùng lại thân khác', 409, 'KHOA_GUI_DA_DUNG', () => goi('POST', '/kh/don', { ...dup, mon: [{ ma: ma(1), so_luong: 1 }], tong_da_xem: 30000 }, kh.tk),
      () => goi('POST', '/kh/don', dup, kh.tk));
    // 429: khách riêng, dồn tới trần bằng yêu cầu hỏng ở bước sau bộ đếm (cach_nhan lạ).
    const q = await khach(100000);
    let r429 = null;
    for (let i = 0; i < 12 && !r429; i++) {
      const r = await goi('POST', '/kh/don', { ...than(), cach_nhan: 'bay' }, q.tk);
      if (r.status === 429) r429 = r;
    }
    const tq = await chup(q.sdt);
    const r12 = await goi('POST', '/kh/don', than(), q.tk);
    k('D1 / K3 hết lượt → 429 QUA_NHIEU_LAN có thu_lai_sau_giay (số nguyên > 0), bảng không đổi', !!r429 && la(r12, 429, 'QUA_NHIEU_LAN')
      && Number.isInteger(r12.j.thu_lai_sau_giay) && r12.j.thu_lai_sau_giay > 0 && (await chup(q.sdt)) === tq, `${r429 && moTa(r429)} · ${JSON.stringify(r12.j)}`);
    const r13 = await goi('POST', '/kh/don', than(), (await khach(100000)).tk);
    k('K3 khách khác vẫn đặt được khi khách kia hết lượt', la(r13, 200), moTa(r13));
    k('K2 POST /don không token → 401', la(kt, 401, 'KH_TOKEN_SAI'));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[P] tong_da_xem: giá đổi giữa báo giá và đặt → 409 GIA_DA_DOI kèm báo giá mới, không tạo gì (chủ quán duyệt 31.10)');
  await chay('P', async () => {
    const kh = await khach(100000);
    await choHang(kh.sdt);
    const ca = async (ten, than, doi, traLai) => {
      const bg = await baoGia(kh, than);
      await doi();
      const truoc = await chup(kh.sdt);
      const r = await goi('POST', '/kh/don', { ...than, khoa_gui: khoaMoi(), cach_tra: 'vi', pin: '1357', tong_da_xem: bg.j.tong }, kh.tk);
      const moi = await baoGia(kh, than);
      k(`P1 ${ten} → 409 GIA_DA_DOI, bao_gia mới = /gio/bao-gia lúc này (≠ số đã xem), đếm bảng trước = sau, ví không giữ`, la(bg, 200) && la(r, 409, 'GIA_DA_DOI')
        && r.j.bao_gia?.tong === moi.j.tong && r.j.bao_gia?.tong !== bg.j.tong && Array.isArray(r.j.bao_gia?.dong) && Array.isArray(r.j.bao_gia?.giam)
        && (await chup(kh.sdt)) === truoc && (await dangGiu(kh.sdt)) === 0, `${moTa(r)} · đã xem ${bg.j.tong} · mới ${JSON.stringify(r.j.bao_gia || null).slice(0, 120)}`);
      await traLai();
    };
    const g1 = gio([{ ma: ma(0), so_luong: 1 }]);
    await flash(true, 20);
    await ca('Giờ vàng vừa tắt', g1, () => flash(false), async () => {});
    await taoMa('THU1LUOT', { luot: 1 });
    await ca('mã hết lượt', gio([{ ma: ma(1), so_luong: 1 }], { ma_giam: 'THU1LUOT' }),
      () => db.run("UPDATE pos_discount_codes SET used_count = 1 WHERE code = 'THU1LUOT'"), async () => {});
    await ca('hạng hết hạn', g1, () => db.run("UPDATE pos_membership_purchases SET expires_at = datetime('now', '-1 days') WHERE customer_phone = ?", [kh.sdt]),
      () => choHang(kh.sdt));
    const bd = await baoGia(kh, g1);
    const rd = await goi('POST', '/kh/don', { ...g1, khoa_gui: khoaMoi(), cach_tra: 'vi', pin: '1357', tong_da_xem: bd.j.tong + 1000 }, kh.tk);
    const khoaBg = Object.keys(bd.j).filter((x) => x !== 'success').sort().join(',');
    k('P5 409 GIA_DA_DOI đúng dạng { error, code, bao_gia } và bao_gia có ĐÚNG các khoá của /gio/bao-gia (chủ quán duyệt 31.10)', la(rd, 409, 'GIA_DA_DOI')
      && Object.keys(rd.j).sort().join(',') === 'bao_gia,code,error' && typeof rd.j.error === 'string'
      && Object.keys(rd.j.bao_gia || {}).sort().join(',') === khoaBg && rd.j.bao_gia.tong === bd.j.tong, `${Object.keys(rd.j)} · ${Object.keys(rd.j.bao_gia || {})} / ${khoaBg}`);
    const bg = await baoGia(kh, g1);
    const r = await goi('POST', '/kh/don', { ...g1, khoa_gui: khoaMoi(), cach_tra: 'vi', pin: '1357', tong_da_xem: bg.j.tong }, kh.tk);
    k('P2 đúng số đã xem → 200 (luồng hợp lệ không bị chặn)', la(r, 200) && r.j.tong === bg.j.tong, moTa(r));
    const bq = await baoGia(kh, g1);
    const r2 = await goi('POST', '/kh/don', { ...g1, khoa_gui: khoaMoi(), cach_tra: 'vi', pin: '1357', tong_da_xem: bq.j.tong + 1 }, kh.tk);
    const r3 = await goi('POST', '/kh/don', { ...g1, khoa_gui: khoaMoi(), cach_tra: 'vi', pin: '1357', tong_da_xem: bq.j.tong - 1 }, kh.tk);
    k('P3 lệch 1 đồng (trên / dưới) → 409 GIA_DA_DOI', la(r2, 409, 'GIA_DA_DOI') && la(r3, 409, 'GIA_DA_DOI'), `${moTa(r2)} / ${moTa(r3)}`);
    const dup = { ...g1, khoa_gui: khoaMoi(), cach_tra: 'qr', tong_da_xem: bq.j.tong };
    const lan1 = await goi('POST', '/kh/don', dup, kh.tk);
    await flash(true, 20);
    const lan2 = await goi('POST', '/kh/don', dup, kh.tk);
    await flash(false);
    k('P4 gửi lại CÙNG khoá sau khi giá đổi → trả đơn cũ (tra khoá trước so tổng), không 409', la(lan1, 200) && la(lan2, 200) && lan2.j.ma_don === lan1.j.ma_don
      && lan2.j.trung === true, `${moTa(lan1)} / ${moTa(lan2)}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] chống trùng: khoa_gui · lưới 10 giây · hai yêu cầu song song');
  await chay('E', async () => {
    const kh = await khach(100000);
    const than = (them = {}) => ({ ...gio(), khoa_gui: khoaMoi(), cach_tra: 'vi_qr', pin: '1357', tong_da_xem: 50000, ...them });
    const kh2 = await khach(30000);
    const t1 = than();
    const r1 = await goi('POST', '/kh/don', t1, kh2.tk);
    const giu1 = await dangGiu(kh2.sdt), ph1 = await so('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan');
    const r2 = await goi('POST', '/kh/don', t1, kh2.tk);
    k('E1 gửi lại cùng khoá cùng thân → 200 cùng ma_don, trung true, ví giữ MỘT lần, không phiên mới', la(r1, 200) && la(r2, 200)
      && r2.j.ma_don === r1.j.ma_don && r2.j.trung === true && giu1 === 30000 && (await dangGiu(kh2.sdt)) === 30000
      && (await so('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan')) === ph1, `${moTa(r1)} / ${moTa(r2)} · giữ ${giu1} → ${await dangGiu(kh2.sdt)}`);
    const r3 = await goi('POST', '/kh/don', { ...t1, pin: '0000' }, kh2.tk);
    k('E1 gửi lại cùng khoá, khác PIN → vẫn đơn cũ (PIN không thuộc thân so)', la(r3, 200) && r3.j.ma_don === r1.j.ma_don, moTa(r3));
    const r4 = await goi('POST', '/kh/don', { ...t1, mon: [{ ma: ma(0), so_luong: 2, ghi_chu: 'nhiều đá' }] }, kh2.tk);
    k('E2 cùng khoá, thân khác (ghi chú) → 409 KHOA_GUI_DA_DUNG', la(r4, 409, 'KHOA_GUI_DA_DUNG'), moTa(r4));
    const sai = [await goi('POST', '/kh/don', than({ khoa_gui: undefined }), kh.tk), await goi('POST', '/kh/don', than({ khoa_gui: 'a'.repeat(15) }), kh.tk),
      await goi('POST', '/kh/don', than({ khoa_gui: 'a'.repeat(65) }), kh.tk), await goi('POST', '/kh/don', than({ khoa_gui: 'khoa_co_gach_duoi_x' }), kh.tk),
      await goi('POST', '/kh/don', than({ khoa_gui: 12345678901234567 }), kh.tk)];
    k('E3 thiếu khoá / 15 ký tự / 65 / có "_" / số → 400 KHOA_GUI_SAI', sai.every((r) => la(r, 400, 'KHOA_GUI_SAI')), sai.map(moTa).join(' / '));
    const k16 = await goi('POST', '/kh/don', than({ khoa_gui: 'A1-' + ngauNhien().slice(0, 13), cach_tra: 'qr', mon: [{ ma: ma(0), so_luong: 1 }], tong_da_xem: 25000 }), kh.tk);
    const k64 = await goi('POST', '/kh/don', than({ khoa_gui: ('Z9-' + ngauNhien() + ngauNhien() + ngauNhien()).slice(0, 64), cach_tra: 'qr', mon: [{ ma: ma(1), so_luong: 1 }],
      tong_da_xem: 30000 }), kh.tk);
    k('E3 khoá đúng 16 và đúng 64 ký tự → qua', la(k16, 200) && la(k64, 200), `${moTa(k16)} / ${moTa(k64)}`);

    const kh3 = await khach(0);
    const g = (them = {}) => than({ cach_tra: 'qr', ...them });
    const a1 = await goi('POST', '/kh/don', g(), kh3.tk);
    const a2 = await goi('POST', '/kh/don', g(), kh3.tk);
    k('E4 khoá khác, cùng giỏ, trong 10 giây, đơn trước còn cho_tra → trả đơn trước, trung true', la(a1, 200) && la(a2, 200) && a2.j.ma_don === a1.j.ma_don
      && a2.j.trung === true, `${moTa(a1)} / ${moTa(a2)}`);
    const a3 = await goi('POST', '/kh/don', g({ mon: [{ ma: ma(0), so_luong: 2, ghi_chu: 'khác' }] }), kh3.tk);
    const a4 = await goi('POST', '/kh/don', g({ cach_tra: 'vi_qr' }), kh3.tk);
    k('E4 khác chỉ ghi chú / chỉ cách trả → đơn mới', la(a3, 200) && a3.j.ma_don !== a1.j.ma_don && la(a4, 200) && a4.j.ma_don !== a1.j.ma_don,
      `${moTa(a3)} / ${moTa(a4)}`);
    await lui('pos_don_app', 'tao_luc', 'phone = ?', [kh3.sdt], 11);
    const a5 = await goi('POST', '/kh/don', g(), kh3.tk);
    k('E4 sau 11 giây → đơn mới', la(a5, 200) && a5.j.ma_don !== a1.j.ma_don, moTa(a5));
    await goi('POST', `/kh/don/${a5.j.ma_don}/huy`, {}, kh3.tk);
    const a6 = await goi('POST', '/kh/don', g(), kh3.tk);
    k('E4 đơn trước đã huỷ (không còn cho_tra) → đơn mới', la(a6, 200) && a6.j.ma_don !== a5.j.ma_don, moTa(a6));

    const kh4 = await khach(100000);
    const ts = than({ cach_tra: 'vi' });
    const tr4 = await chup(kh4.sdt);
    const [s1, s2] = await Promise.all([goi('POST', '/kh/don', ts, kh4.tk), goi('POST', '/kh/don', ts, kh4.tk)]);
    const soApp = await so('SELECT COUNT(*) AS n FROM pos_don_app WHERE phone = ?', [kh4.sdt]);
    const soPh = await so('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan WHERE phone = ?', [kh4.sdt]);
    const s3 = await goi('POST', '/kh/don', ts, kh4.tk);
    const okS = [s1, s2].filter((r) => la(r, 200));
    k('E5 hai yêu cầu song song cùng khoá → đúng MỘT đơn App, MỘT phiên, ví trừ MỘT lần; bên thua 503 DANG_XU_LY hoặc 200 trung',
      soApp === 1 && soPh === 1 && (await soDu(kh4.sdt)) === 50000 && okS.length >= 1 && [s1, s2].every((r) => la(r, 200) || la(r, 503, 'DANG_XU_LY'))
      && la(s3, 200) && s3.j.ma_don === okS[0].j.ma_don && s3.j.trung === true, `${moTa(s1)} / ${moTa(s2)} · app ${soApp} phiên ${soPh} · ${tr4}`);

    const kh5 = await khach(100000);
    const t5 = than({ cach_tra: 'vi' });
    const b1 = await goi('POST', '/kh/don', t5, kh5.tk);
    await lui('pos_don_app', 'tao_luc', 'phone = ?', [kh5.sdt], 25 * 3600);
    const b2 = await goi('POST', '/kh/don', t5, kh5.tk);
    k('E6 cùng khoá sau 24 giờ → 409 KHOA_GUI_DA_DUNG (khoá duy nhất mãi trong CSDL)', la(b1, 200) && la(b2, 409, 'KHOA_GUI_DA_DUNG'), `${moTa(b1)} / ${moTa(b2)}`);
    const kh6 = await khach(100000);
    const b3 = await goi('POST', '/kh/don', t5, kh6.tk);
    k('E7 khách khác dùng đúng khoá đó → đơn mới của khách đó (khoá theo khách)', la(b3, 200) && b3.j.ma_don !== b1.j.ma_don && b3.j.trung === false, moTa(b3));
    const kh7 = await khach(0);
    const t7 = than({ cach_tra: 'qr' });
    const c1 = await goi('POST', '/kh/don', t7, kh7.tk);
    for (let i = 0; i < 12; i++) await goi('POST', '/kh/don', { ...than(), cach_nhan: 'bay' }, kh7.tk);
    const c2 = await goi('POST', '/kh/don', t7, kh7.tk);
    k('E8 hết lượt mà gửi lại khoá cũ → vẫn 200 đơn cũ (tra khoá trước bộ đếm)', la(c1, 200) && la(c2, 200) && c2.j.ma_don === c1.j.ma_don, `${moTa(c1)} / ${moTa(c2)}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[R] "Trả lời 4xx của POST /don không giữ khoá gửi — gửi lại cùng khoa_gui được xử lý như lần đầu." (chủ quán duyệt 31.10)');
  await chay('R', async () => {
    const lai = async (ten, status, code, kh, than, truocLan2, sua = {}) => {
      const r1 = await goi('POST', '/kh/don', than, kh.tk);
      await truocLan2();
      const r2 = await goi('POST', '/kh/don', { ...than, ...sua }, kh.tk);
      k(`R1 sau ${code} → gửi lại CÙNG khoá → xử lý như lần đầu (200 đơn mới, trung false; không KHOA_GUI_DA_DUNG)`, la(r1, status, code) && la(r2, 200)
        && r2.j.trung === false && !!r2.j.ma_don, `${moTa(r1)} → ${moTa(r2)}`);
    };
    const than = (them = {}) => ({ ...gio(), khoa_gui: khoaMoi(), cach_tra: 'vi', pin: '1357', tong_da_xem: 50000, ...them });
    const k1 = await khach(100000);
    mocBan = true;
    await lai('kho bận', 409, 'KHO_BAN', k1, than(), async () => { mocBan = false; });
    const k2 = await khach(100000);
    await datLich(hhmm(120), hhmm(180));
    await lai('ngoài giờ', 400, 'NGOAI_GIO', k2, than(), boLich);
    const k3 = await khach(100000);
    await lai('PIN sai', 400, 'PIN_SAI', k3, than({ pin: '0000' }), async () => {}, { pin: '1357' });
    const k4 = await khach(100000);
    await lai('giá đổi', 409, 'GIA_DA_DOI', k4, than({ tong_da_xem: 1 }), async () => {}, { tong_da_xem: 50000 });
    // Hết lượt: dồn tới trần, lần gửi khoá K → 429; qua cửa sổ (đồng hồ máy chủ tiến 11 phút) → gửi lại K → như lần đầu.
    const k5 = await khach(100000);
    for (let i = 0; i < 12; i++) await goi('POST', '/kh/don', { ...than(), cach_nhan: 'bay' }, k5.tk);
    const dnGoc = Date.now;
    await lai('hết lượt', 429, 'QUA_NHIEU_LAN', k5, than(), async () => { const t = dnGoc(); Date.now = () => dnGoc() - t + t + 11 * 60000; });
    Date.now = dnGoc;
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[V] vòng sửa 1 — lỗi SAU chốt ví · yêu cầu chồng thật · giá đổi sau tạo phiên · chốt ví hỏng · danh sách quầy');
  await chay('V', async () => {
    // Đếm cho ca có phiên lỡ tạo (Q8: phiên `huy` / `loi` còn dòng nhưng KHÔNG giữ tiền): đơn, đơn App, phiên đang giữ, đang giữ ví, số dư.
    const chupGiu = async (sdt) => [await so('SELECT COUNT(*) AS n FROM pos_orders'), await so('SELECT COUNT(*) AS n FROM pos_don_app'),
      await so("SELECT COUNT(*) AS n FROM pos_phien_thanh_toan WHERE trang_thai = 'cho'"), await dangGiu(sdt), await soDu(sdt)].join('/');
    const quay = async () => (await goi('GET', '/pos/kh/don-app', undefined, tkChu)).j.data || [];
    const than = (them = {}) => ({ ...gio(), khoa_gui: khoaMoi(), cach_tra: 'vi', pin: '1357', tong_da_xem: 50000, ...them });

    const k1 = await khach(100000);
    const t1 = than();
    const donTruoc = await so('SELECT COUNT(*) AS n FROM pos_orders');
    mocNemSauChot = true;
    const r1 = await goi('POST', '/kh/don', t1, k1.tk);
    mocNemSauChot = false;
    const r2 = await goi('POST', '/kh/don', t1, k1.tk);
    const ds1 = await quay();
    k('V1 lỗi ném SAU khi chốt ví đã ghi → gửi lại cùng khoá → đơn cũ (trung, da_tra), ví trừ MỘT lần, đơn vẫn hiện ở quầy', r1.status >= 500
      && la(r2, 200) && r2.j.trung === true && r2.j.tien_trinh === 'da_tra' && (await soDu(k1.sdt)) === 50000
      && (await so('SELECT COUNT(*) AS n FROM pos_orders')) === donTruoc + 1 && ds1.some((d) => d.ma === r2.j.ma_don),
    `${moTa(r1)} → ${moTa(r2)} · ví ${await soDu(k1.sdt)} · đơn +${(await so('SELECT COUNT(*) AS n FROM pos_orders')) - donTruoc}`);

    const k2 = await khach(100000);
    const t2 = than();
    rao = { cho: [] };
    const [a, b] = await Promise.all([goi('POST', '/kh/don', t2, k2.tk), goi('POST', '/kh/don', t2, k2.tk)]);
    rao = null;
    k('V2 hai yêu cầu cùng khoá CHỒNG thật (cùng qua bước tra khoá) → một 200, một 503 DANG_XU_LY; một đơn App, ví trừ một lần',
      [a, b].filter((r) => la(r, 200)).length === 1 && [a, b].filter((r) => la(r, 503, 'DANG_XU_LY')).length === 1
      && (await so('SELECT COUNT(*) AS n FROM pos_don_app WHERE phone = ?', [k2.sdt])) === 1 && (await soDu(k2.sdt)) === 50000, `${moTa(a)} / ${moTa(b)}`);

    const k3 = await khach(100000);
    const t3 = than();
    mocCham = true;
    const [c1, c2] = await Promise.all([goi('POST', '/kh/don', t3, k3.tk), ngu(150).then(() => goi('POST', '/kh/don', t3, k3.tk))]);
    k('V3 yêu cầu sau tra khoá đúng lúc dòng giữ khoá chưa có phiên → 503 DANG_XU_LY; yêu cầu đầu 200; một đơn', la(c1, 200) && la(c2, 503, 'DANG_XU_LY')
      && (await soDu(k3.sdt)) === 50000, `${moTa(c1)} / ${moTa(c2)}`);

    const k4 = await khach(20000);
    const tr4 = await chupGiu(k4.sdt);
    mocCS = async () => { mocCS = null; await flash(true, 20); return { sufficient: true }; };   // Giờ vàng bật ĐÚNG lúc tạo phiên
    const r4 = await goi('POST', '/kh/don', than({ cach_tra: 'vi_qr' }), k4.tk);
    mocCS = null;
    const moi4 = await baoGia(k4, gio());
    await flash(false);
    k('V4 giá đổi giữa báo giá và tạo phiên → 409 GIA_DA_DOI kèm báo giá mới; phiên lỡ tạo bị huỷ (ví nhả), không đơn App', la(r4, 409, 'GIA_DA_DOI')
      && r4.j.bao_gia?.tong === moi4.j.tong && r4.j.bao_gia?.tong !== 50000 && (await chupGiu(k4.sdt)) === tr4, `${moTa(r4)} · ${tr4} → ${await chupGiu(k4.sdt)}`);

    const k5 = await khach(100000);
    const tr5 = await chupGiu(k5.sdt);
    let lan = 0;
    mocCS = async () => (++lan >= 2 ? { sufficient: false, stock: 1 } : { sufficient: true });   // tạo phiên còn hàng, lúc chốt hết
    const r5 = await goi('POST', '/kh/don', than(), k5.tk);
    mocCS = null;
    k('V5 trả ví: chốt hỏng sau khi tạo phiên (hết hàng lúc chốt) → 400 HET_HANG, không đơn, không trừ / giữ ví (Q8)', la(r5, 400, 'HET_HANG')
      && (await chupGiu(k5.sdt)) === tr5, `${moTa(r5)} · ${tr5} → ${await chupGiu(k5.sdt)}`);

    const k6 = await khach(100000);
    const tr6 = await chupGiu(k6.sdt);
    let lan6 = 0;
    mocCS = async () => { if (++lan6 >= 2) await flash(true, 20); return { sufficient: true }; };   // Giờ vàng bật ĐÚNG lúc chốt ví
    const r6 = await goi('POST', '/kh/don', than(), k6.tk);
    mocCS = null;
    await flash(false);
    k('V6 lỗi đơn không có mã riêng (tổng đổi lúc chốt, lệch số ví đã giữ — taoDon 400 không code) → 400 DON_KHONG_HOP_LE, bảng không đổi', la(r6, 400, 'DON_KHONG_HOP_LE')
      && (await chupGiu(k6.sdt)) === tr6, `${moTa(r6)} · ${tr6} → ${await chupGiu(k6.sdt)}`);

    // Danh sách quầy: đơn xong HÔM QUA ẩn; đơn đang làm từ hôm qua vẫn hiện; đơn đã huỷ / hoàn từ hôm qua ẩn và không bấm được.
    const k7 = await khach(300000);
    const dat = async () => (await goi('POST', '/kh/don', than({ khoa_gui: khoaMoi() }), k7.tk)).j.ma_don;
    const [m1, m2, m3] = [await dat(), await dat(), await dat()];
    const id = async (m) => (await donApp(m))?.id;
    await goi('POST', `/pos/kh/don-app/${await id(m1)}/dang-lam`, {}, tkChu);
    await goi('POST', `/pos/kh/don-app/${await id(m1)}/xong`, {}, tkChu);
    await goi('POST', `/pos/kh/don-app/${await id(m2)}/dang-lam`, {}, tkChu);
    for (const m of [m1, m2, m3]) await lui('pos_phien_thanh_toan', 'luc_chot', 'id = ?', [(await donApp(m))?.phien_id], 86400);
    await db.run("UPDATE pos_orders SET status = 'cancelled' WHERE id = ?", [(await phienCua(m3))?.order_id]);
    const ds7 = (await quay()).map((d) => d.ma);
    const bam3 = await goi('POST', `/pos/kh/don-app/${await id(m3)}/dang-lam`, {}, tkChu);
    k('V7 quầy: xong hôm qua ẩn · đang làm hôm qua hiện · đã huỷ hôm qua ẩn, bấm Đang làm → 409', !ds7.includes(m1) && ds7.includes(m2) && !ds7.includes(m3)
      && la(bam3, 409, 'DA_DOI_TIEN_TRINH'), `${JSON.stringify(ds7.filter((m) => [m1, m2, m3].includes(m)))} · ${moTa(bam3)}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] tiến trình GET /don + GET /don/:ma');
  await chay('F', async () => {
    const kh = await khach(100000);
    const quay = await goi('POST', '/pos/orders', { items: [monQuay(1, 1)], payment_method: 'cash', cash_amount: 30000, customer_phone: kh.sdt,
      customer_name: 'K' }, tkChu);
    const r1 = await dat1(kh, gio());
    const ds = await goi('GET', '/kh/don', undefined, kh.tk);
    const dongApp = (ds.j.data || []).find((d) => d.ma === r1.j.ma_don);
    const dongQuay = (ds.j.data || []).find((d) => d.ma === quay.j.order?.code);
    k('F1 GET /don thấy đơn App cho_tra (qr có), đơn quầy vẫn đủ trường cũ + tien_trinh xong (F7)', la(ds, 200) && dongApp?.tien_trinh === 'cho_tra'
      && dongApp.qr?.chuoi === r1.j.qr?.chuoi && !!dongQuay && dongQuay.tien_trinh === 'xong' && dongQuay.tong === 30000 && dongQuay.trang_thai === 'completed'
      && 'da_tra' in dongQuay && 'thanh_toan' in dongQuay, `${moTa(ds)} · ${JSON.stringify(ds.j.data || []).slice(0, 240)}`);
    k('F1 đơn mới nhất đứng đầu (App tạo sau đơn quầy)', ds.j.data?.[0]?.ma === r1.j.ma_don, ds.j.data?.map((d) => d.ma).join(','));
    k('F6 giờ ở GET /don đúng dạng giờ VN', (ds.j.data || []).length >= 2 && ds.j.data.every((d) => GIO_VN.test(d.ngay)), ds.j.data?.map((d) => d.ngay).join(','));
    const ct = await goi('GET', `/kh/don/${r1.j.ma_don}`, undefined, kh.tk);
    k('F2 /don/:ma đơn cho_tra: mon[].ma, ghi_chu, qr cùng mã lúc tạo, giờ VN', la(ct, 200) && ct.j.don?.tien_trinh === 'cho_tra' && ct.j.don.mon?.[0]?.ma === ma(0)
      && ct.j.don.mon[0].ghi_chu === 'ít đá' && ct.j.don.mon[0].so_luong === 2 && ct.j.don.qr?.chuoi === r1.j.qr?.chuoi && ct.j.don.qr?.het_han === r1.j.qr?.het_han
      && GIO_VN.test(ct.j.don.ngay), `${moTa(ct)} · ${JSON.stringify(ct.j.don || null).slice(0, 240)}`);
    const r2 = await dat1(kh, gio([{ ma: ma(1), so_luong: 1 }]), { cach_tra: 'vi', pin: '1357' });
    const ct2 = await goi('GET', `/kh/don/${r2.j.ma_don}`, undefined, kh.tk);
    k('F3 đơn đã trả → tien_trinh da_tra, qr null, mon[].ma từ đơn thật, da_tra = tong', la(ct2, 200) && ct2.j.don?.tien_trinh === 'da_tra' && ct2.j.don.qr === null
      && ct2.j.don.mon?.[0]?.ma === ma(1) && ct2.j.don.da_tra === 30000, `${moTa(ct2)} · ${JSON.stringify(ct2.j.don || null).slice(0, 200)}`);
    const ctq = await goi('GET', `/kh/don/${quay.j.order?.code}`, undefined, kh.tk);
    k('F7 /don/:ma đơn quầy: tien_trinh xong, mon[].ma, qr null', la(ctq, 200) && ctq.j.don?.tien_trinh === 'xong' && ctq.j.don.mon?.[0]?.ma === ma(1)
      && ctq.j.don.qr === null, moTa(ctq));
    const r3 = await dat1(kh, gio([{ ma: ma(0), so_luong: 1 }]));
    const p3 = await phienCua(r3.j.ma_don);
    await lui('pos_phien_thanh_toan', 'het_han', 'id = ?', [p3?.id], 700);
    const ct3 = await goi('GET', `/kh/don/${r3.j.ma_don}`, undefined, kh.tk);
    k('F4 QR hết hạn chưa trả → da_huy, qr null (không cần ghi gì)', la(r3, 200) && la(ct3, 200) && ct3.j.don?.tien_trinh === 'da_huy' && ct3.j.don.qr === null,
      `${moTa(r3)} · ${moTa(ct3)} · ${ct3.j.don?.tien_trinh}`);
    const kh2 = await khach(30000);
    const r4 = await dat1(kh2, gio(), { cach_tra: 'vi_qr', pin: '1357' });
    const p4 = await phienCua(r4.j.ma_don);
    await lui('pos_phien_thanh_toan', 'het_han', 'id = ?', [p4?.id], 700);
    const ct4 = await goi('GET', `/kh/don/${r4.j.ma_don}`, undefined, kh2.tk);
    k('F4 vi_qr hết hạn → da_huy, ví giữ 20.000… về 0, số dư nguyên', la(r4, 200) && ct4.j.don?.tien_trinh === 'da_huy' && (await dangGiu(kh2.sdt)) === 0
      && (await soDu(kh2.sdt)) === 30000, `${moTa(ct4)} · ${ct4.j.don?.tien_trinh}`);
    const la2 = await goi('GET', `/kh/don/${r1.j.ma_don}`, undefined, kh2.tk);
    const la3 = await goi('GET', `/kh/don/${quay.j.order?.code}`, undefined, kh2.tk);
    const dsB = await goi('GET', '/kh/don', undefined, kh2.tk);
    k('F5 khách khác đọc đơn App / đơn quầy của người kia → 404 KHONG_THAY_DON; danh sách không có', la(la2, 404, 'KHONG_THAY_DON') && la(la3, 404, 'KHONG_THAY_DON')
      && !(dsB.j.data || []).some((d) => d.ma === r1.j.ma_don), `${moTa(la2)} / ${moTa(la3)}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] huỷ POST /don/:ma/huy');
  await chay('G', async () => {
    const kh = await khach(20000);
    const r1 = await dat1(kh, gio(), { cach_tra: 'vi_qr', pin: '1357' });
    const giu = await dangGiu(kh.sdt);
    const h1 = await goi('POST', `/kh/don/${r1.j.ma_don}/huy`, {}, kh.tk);
    const ct = await goi('GET', `/kh/don/${r1.j.ma_don}`, undefined, kh.tk);
    k('G1 huỷ đơn cho_tra (vi_qr) → 200 da_huy, phiên huy, ví nhả', la(h1, 200) && h1.j.tien_trinh === 'da_huy' && giu === 20000 && (await dangGiu(kh.sdt)) === 0
      && ct.j.don?.tien_trinh === 'da_huy' && (await phienCua(r1.j.ma_don))?.trang_thai === 'huy', `${moTa(h1)} · giữ ${giu}`);
    const h2 = await goi('POST', `/kh/don/${r1.j.ma_don}/huy`, {}, kh.tk);
    k('G4 huỷ lại đơn đã da_huy → 200 da_huy (Q5)', la(h2, 200) && h2.j.tien_trinh === 'da_huy', moTa(h2));
    const kh2 = await khach(100000);
    const r2 = await dat1(kh2, gio(), { cach_tra: 'vi', pin: '1357' });
    const truoc = await chup(kh2.sdt);
    const h3 = await goi('POST', `/kh/don/${r2.j.ma_don}/huy`, {}, kh2.tk);
    k('G2 đơn đã trả → 400 DA_TRA_GOI_QUAN, không đổi gì', la(h3, 400, 'DA_TRA_GOI_QUAN') && (await chup(kh2.sdt)) === truoc, moTa(h3));
    const r3 = await dat1(kh, gio([{ ma: ma(1), so_luong: 1 }]));
    const h4 = await goi('POST', `/kh/don/${r3.j.ma_don}/huy`, {}, kh2.tk);
    k('G3 khách khác huỷ đơn người kia → 404, đơn vẫn cho_tra', la(h4, 404, 'KHONG_THAY_DON') && (await phienCua(r3.j.ma_don))?.trang_thai === 'cho', moTa(h4));
    const p3 = await phienCua(r3.j.ma_don);
    const hq = await goi('POST', `/pos/thanh-toan/phien/${p3?.id}/huy`, {}, tkChu);
    const ct3 = await goi('GET', `/kh/don/${r3.j.ma_don}`, undefined, kh.tk);
    k('G5 quầy huỷ phiên của đơn App → App thấy da_huy', la(hq, 200) && ct3.j.don?.tien_trinh === 'da_huy', `${moTa(hq)} · ${ct3.j.don?.tien_trinh}`);
    // Hai người cùng bấm: khách huỷ ĐÚNG lúc tiền về.
    const kh3 = await khach(20000);
    const r4 = await dat1(kh3, gio(), { cach_tra: 'vi_qr', pin: '1357' });
    const p4 = await phienCua(r4.j.ma_don);
    const donTruoc = await so('SELECT COUNT(*) AS n FROM pos_orders');
    const [h5, w5] = await Promise.all([goi('POST', `/kh/don/${r4.j.ma_don}/huy`, {}, kh3.tk), webhook(p4 || {})]);
    const p4s = await phienCua(r4.j.ma_don);
    const donSau = await so('SELECT COUNT(*) AS n FROM pos_orders');
    const sk = await db.query('SELECT ket_qua FROM pos_payos_su_kien WHERE ma_payos = ?', [p4?.ma_payos]).catch(() => []);
    const thangDon = la(h5, 400, 'DA_TRA_GOI_QUAN') && p4s?.trang_thai === 'da_thu' && donSau === donTruoc + 1 && (await soDu(kh3.sdt)) === 0;
    const thangHuy = la(h5, 200) && p4s?.trang_thai === 'huy' && donSau === donTruoc && sk.some((s) => s.ket_qua === 'chua_khop') && (await soDu(kh3.sdt)) === 20000;
    k('G6 huỷ và tiền về cùng lúc → đúng MỘT kết quả (đơn thật HOẶC huỷ + chua_khop), ví không trừ hai lần', la(w5, 200) && (thangDon !== thangHuy),
      `${moTa(h5)} · phiên ${p4s?.trang_thai} · đơn +${donSau - donTruoc} · ví ${await soDu(kh3.sdt)} · ${JSON.stringify(sk)}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[H] đơn về quầy: danh sách đơn App, Đang làm → Xong, cài đặt chuông');
  await chay('H', async () => {
    const kh = await khach(0);
    const r1 = await dat1(kh, gio());
    const ds0 = await goi('GET', '/pos/kh/don-app', undefined, tkChu);
    k('H2 đơn chưa trả KHÔNG hiện ở quầy', la(ds0, 200) && !(ds0.j.data || []).some((d) => d.ma === r1.j.ma_don), moTa(ds0));
    const p1 = await phienCua(r1.j.ma_don);
    const w = await webhook(p1 || {});
    const ds1 = await goi('GET', '/pos/kh/don-app', undefined, tkChu);
    const d1 = (ds1.j.data || []).find((d) => d.ma === r1.j.ma_don);
    k('H1 webhook đúng chữ ký → đơn thật; quầy thấy: mã, giờ, món + ghi chú, tên khách, đã trả + cách', la(w, 200) && !!d1 && GIO_VN.test(d1.gio || '')
      && d1.mon?.[0]?.ghi_chu === 'ít đá' && d1.mon[0].so_luong === 2 && typeof d1.mon[0].ten === 'string' && d1.ten_khach === 'Khách ' + kh.sdt
      && d1.da_tra === 50000 && d1.tra_qr === 50000 && d1.tra_vi === 0 && d1.tien_trinh === 'da_tra' && !!d1.ma_bill,
    `${moTa(ds1)} · ${JSON.stringify(d1 || null).slice(0, 240)}`);
    const ct = await goi('GET', `/kh/don/${r1.j.ma_don}`, undefined, kh.tk);
    k('H1 App thấy da_tra sau khi tiền về', ct.j.don?.tien_trinh === 'da_tra', ct.j.don?.tien_trinh);
    const s1 = await goi('POST', `/pos/kh/don-app/${d1?.id}/dang-lam`, {}, tkChu);
    const ct2 = await goi('GET', `/kh/don/${r1.j.ma_don}`, undefined, kh.tk);
    const s2 = await goi('POST', `/pos/kh/don-app/${d1?.id}/dang-lam`, {}, tkChu);
    const s3 = await goi('POST', `/pos/kh/don-app/${d1?.id}/xong`, {}, tkChu);
    const ds2 = await goi('GET', '/kh/don', undefined, kh.tk);
    const s4 = await goi('POST', `/pos/kh/don-app/${d1?.id}/xong`, {}, tkChu);
    const a = await donApp(r1.j.ma_don);
    k('H3 / F8 Đang làm → App dang_lam; Xong → App xong; bấm lại → 409 DA_DOI_TIEN_TRINH; ghi người + giờ', la(s1, 200) && ct2.j.don?.tien_trinh === 'dang_lam'
      && la(s2, 409, 'DA_DOI_TIEN_TRINH') && la(s3, 200) && ds2.j.data?.find((d) => d.ma === r1.j.ma_don)?.tien_trinh === 'xong' && la(s4, 409, 'DA_DOI_TIEN_TRINH')
      && !!a?.nguoi_lam && GIO_VN.test(a?.luc_lam || '') && !!a?.nguoi_xong && GIO_VN.test(a?.luc_xong || ''), `${moTa(s1)} ${moTa(s2)} ${moTa(s3)} ${moTa(s4)}`);
    const r2 = await dat1(kh, gio([{ ma: ma(1), so_luong: 1 }]));
    const xx = await goi('POST', `/pos/kh/don-app/${(await donApp(r2.j.ma_don))?.id}/xong`, {}, tkChu);
    const dl = await goi('POST', `/pos/kh/don-app/${(await donApp(r2.j.ma_don))?.id}/dang-lam`, {}, tkChu);
    k('H3 đơn chưa trả: không bấm Đang làm / Xong được (409)', la(xx, 409, 'DA_DOI_TIEN_TRINH') && la(dl, 409, 'DA_DOI_TIEN_TRINH'), `${moTa(xx)} / ${moTa(dl)}`);
    const p2 = await phienCua(r2.j.ma_don);
    const xn = await goi('POST', `/pos/thanh-toan/phien/${p2?.id}/xac-nhan-tay`, { ly_do: 'khách chuyển nhầm nội dung' }, tkChu);
    const ds3 = await goi('GET', '/pos/kh/don-app', undefined, tkChu);
    k('H6 xác nhận tay phiên đơn App → đơn thật, hiện ở quầy', la(xn, 200) && (ds3.j.data || []).some((d) => d.ma === r2.j.ma_don), moTa(xn));
    const kt = await goi('GET', '/pos/kh/don-app', undefined, null);
    const kt2 = await goi('GET', '/pos/kh/don-app', undefined, kh.tk);
    k('H4 không token nhân viên / token khách → 401', kt.status === 401 && kt2.status === 401, `${moTa(kt)} / ${moTa(kt2)}`);
    const cd = (s) => goi('PUT', '/pos/settings', { settings: s }, tkChu);
    const sai = [await cd({ don_app_chuong_bat: '2' }), await cd({ don_app_chuong_tieng: 'khong_co' }), await cd({ don_app_chuong_am_luong: '101' }),
      await cd({ don_app_chuong_am_luong: '-1' }), await cd({ don_app_chuong_am_luong: '5.5' })];
    const dung = await cd({ don_app_chuong_bat: '0', don_app_chuong_tieng: 'chuong', don_app_chuong_am_luong: '100' });
    const doc = await db.query("SELECT key, value FROM pos_settings WHERE key LIKE 'don_app_chuong_%' ORDER BY key");
    k('H5 cài đặt chuông: sai giá trị → 400 CAI_DAT_KHONG_HOP_LE; đúng (0 / chuong / 100) → lưu', sai.every((r) => la(r, 400, 'CAI_DAT_KHONG_HOP_LE')) && la(dung, 200)
      && doc.map((x) => x.value).join(',') === '100,0,chuong', `${sai.map(moTa).join(' / ')} · ${JSON.stringify(doc)}`);
    k('H5 âm lượng biên 0 → lưu', la(await cd({ don_app_chuong_am_luong: '0' }), 200));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[I] tiền về muộn / lệch — đối soát hiện có, không tạo đơn ngầm');
  await chay('I', async () => {
    const kh = await khach(0);
    const r1 = await dat1(kh, gio());
    await goi('POST', `/kh/don/${r1.j.ma_don}/huy`, {}, kh.tk);
    const p1 = await phienCua(r1.j.ma_don);
    const truoc = await so('SELECT COUNT(*) AS n FROM pos_orders');
    const w1 = await webhook(p1 || {});
    const ct = await goi('GET', `/kh/don/${r1.j.ma_don}`, undefined, kh.tk);
    const sk1 = await db.queryOne('SELECT ket_qua FROM pos_payos_su_kien WHERE ma_payos = ? ORDER BY id DESC', [p1?.ma_payos]).catch(() => null);
    k('I1 tiền về sau khi khách huỷ → chua_khop, không đơn mới; App da_huy + tien_ve_cho_doi_soat true', la(w1, 200) && sk1?.ket_qua === 'chua_khop'
      && (await so('SELECT COUNT(*) AS n FROM pos_orders')) === truoc && ct.j.don?.tien_trinh === 'da_huy' && ct.j.don.tien_ve_cho_doi_soat === true,
    `${moTa(ct)} · ${JSON.stringify(ct.j.don || null).slice(0, 160)}`);
    const r2 = await dat1(kh, gio([{ ma: ma(1), so_luong: 1 }]));
    const p2 = await phienCua(r2.j.ma_don);
    const w2 = await webhook(p2 || {}, { amount: (p2?.con_lai || 0) - 1000 });
    const ct2 = await goi('GET', `/kh/don/${r2.j.ma_don}`, undefined, kh.tk);
    k('I2 tiền về lệch số → chua_khop, phiên vẫn cho_tra (chưa đơn), App vẫn cho_tra', la(w2, 200) && ct2.j.don?.tien_trinh === 'cho_tra'
      && (await so('SELECT COUNT(*) AS n FROM pos_orders')) === truoc, ct2.j.don?.tien_trinh);
    const kh2 = await khach(0);
    const r3 = await dat1(kh2, gio([{ ma: ma(1), so_luong: 2 }]));
    const p3 = await phienCua(r3.j.ma_don);
    tonGia = 1;
    const w3 = await webhook(p3 || {});
    tonGia = null;
    const ct3 = await goi('GET', `/kh/don/${r3.j.ma_don}`, undefined, kh2.tk);
    k('I3 tiền về đúng hạn nhưng chốt hỏng vì đơn (hết hàng) → phiên loi, chua_khop, App da_huy + cờ', la(w3, 200) && (await phienCua(r3.j.ma_don))?.trang_thai === 'loi'
      && ct3.j.don?.tien_trinh === 'da_huy' && ct3.j.don.tien_ve_cho_doi_soat === true, `${ct3.j.don?.tien_trinh} · ${ct3.j.don?.tien_ve_cho_doi_soat}`);
    const kh3 = await khach(20000);
    const r4 = await dat1(kh3, gio(), { cach_tra: 'vi_qr', pin: '1357' });
    const p4 = await phienCua(r4.j.ma_don);
    await lui('pos_phien_thanh_toan', 'het_han', 'id = ?', [p4?.id], 700);
    const w4 = await webhook(p4 || {});
    const ct4 = await goi('GET', `/kh/don/${r4.j.ma_don}`, undefined, kh3.tk);
    k('I4 vi_qr hết hạn rồi tiền QR về → ví đã nhả (số dư nguyên), không đơn, chua_khop, App da_huy + cờ', la(w4, 200) && (await soDu(kh3.sdt)) === 20000
      && (await dangGiu(kh3.sdt)) === 0 && ct4.j.don?.tien_trinh === 'da_huy' && ct4.j.don.tien_ve_cho_doi_soat === true, `${ct4.j.don?.tien_trinh}`);
    const kh4 = await khach(0);
    const r5 = await dat1(kh4, gio());
    await lui('pos_phien_thanh_toan', 'het_han', 'id = ?', [(await phienCua(r5.j.ma_don))?.id], 700);
    const ct5 = await goi('GET', `/kh/don/${r5.j.ma_don}`, undefined, kh4.tk);
    k('I hết hạn mà KHÔNG có tiền về → da_huy, cờ false', ct5.j.don?.tien_trinh === 'da_huy' && ct5.j.don.tien_ve_cho_doi_soat === false, JSON.stringify(ct5.j.don || null).slice(0, 120));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[K] luồng quầy chạy y như cũ — bảng số chụp (số lấy từ lần chạy trên code GỐC, ghi ở bang_chung_do.txt)');
  await chay('K', async () => {
    const kh = await khach(200000);
    await choHang(kh.sdt);
    const tt1 = await goi('POST', '/pos/orders/tinh-thu', { customer_phone: kh.sdt, items: [monQuay(0, 2), monQuay(1, 1)], discount_code: 'THU5K' }, tkChu);
    const o1 = await goi('POST', '/pos/orders', { items: [monQuay(0, 2), monQuay(1, 1)], discount_code: 'THU5K', payment_method: 'cash',
      cash_amount: tt1.j.total, customer_phone: kh.sdt, customer_name: 'K' }, tkChu);
    const ph = await goi('POST', '/pos/thanh-toan/phien', { don: { items: [monQuay(1, 1)], customer_phone: kh.sdt, customer_name: 'K' }, cach: 'tai_khoan',
      tru_tai_khoan: true, pin: '1357' }, tkChu);
    const chot = await goi('POST', `/pos/thanh-toan/phien/${ph.j.phien?.id}/chot`, {}, tkChu);
    const diem = await so('SELECT COALESCE(SUM(points), 0) AS n FROM pos_point_transactions WHERE customer_phone = ?', [kh.sdt]);
    const so1 = [tt1.j.subtotal, tt1.j.tier_discount, tt1.j.discount_amount, tt1.j.total, o1.j.order?.total, ph.j.phien?.tong, chot.status, await soDu(kh.sdt), diem];
    const MONG = [80000, 8000, 5000, 67000, 67000, 27000, 200, 173000, so1[8]];
    k(`K1 quầy: tinh-thu / POST /orders / phiên tài khoản cho cùng giỏ ra đúng số chụp trên gốc (${MONG.slice(0, 8).join(' · ')})`,
      la(tt1, 200) && la(o1, 200) && la(chot, 200) && so1.slice(0, 8).join(',') === MONG.slice(0, 8).join(','), so1.join(','));
    k('K1 quầy: điểm cộng của 2 đơn quầy > 0 (đường điểm chạy)', diem > 0, String(diem));
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
