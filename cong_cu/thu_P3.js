#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ P3 — phiên thanh toán: QR payOS tự xác nhận · xác nhận tay · PIN khách · giữ rồi trừ tài khoản
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có /thanh-toan, bảng phiên, PIN). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_P3.js
 *
 *  Khuôn thu_KH1.js: database.js + libsql thật trên kho TẠM; chỉ thay ketNoiKho (P8) và tắt SX. Express riêng mount ĐÚNG đường như
 *  index.js. KHÔNG gọi payOS thật: PAYOS_BASE_URL trỏ máy chủ giả trên 127.0.0.1; khoá thử sinh ngẫu nhiên lúc chạy. Webhook ký bằng
 *  công thức VIẾT RIÊNG trong bài (không dùng hàm của payos.js). Hết hạn dựng bằng cách lùi cột giờ trong kho tạm, không ngủ.
 *  So HTTP status + `code`, không dò lời báo (E12). Module chưa có (code gốc) → route không gắn → mỗi ca hỏng riêng, không sập cả bài.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_p3_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: {
    laMayThu: () => true,
    cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }),
    diaChiSX: () => '',
    FILE_THU: FILE_KHO,
  },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_p3_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_p3_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
const datKhoa = (k) => { process.env.PAYOS_CLIENT_ID = k.id; process.env.PAYOS_API_KEY = k.api; process.env.PAYOS_CHECKSUM_KEY = k.ck; };
datKhoa(KHOA);
process.env.PAYOS_RETURN_URL = 'https://thu.p3.local/tra-ve';

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); }
  else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);

// Log máy chủ gom vào nhatKy (ca J soi: không dòng nào chứa khoá payOS).
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const nhatKy = [];
const imLang = () => { console.log = console.error = console.warn = (...a) => nhatKy.push(a.join(' ')); };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const thuNap = (p) => { try { return require(p); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return null; throw e; } };

// Chuỗi ký payOS — viết riêng ở bài (đối chiếu SDK payOSHQ/payos-lib-node): khoá xếp tăng dần, null → rỗng, nối k=v bằng &.
const chuoiKy = (d) => Object.keys(d).sort().map((x) => `${x}=${d[x] == null ? '' : d[x]}`).join('&');
const hmac = (s, ck = KHOA.ck) => crypto.createHmac('sha256', ck).update(s).digest('hex');

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const bcrypt = require(path.join(GOC, 'node_modules', 'bcryptjs'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();

  // Móc B13 (chết giữa chừng): câu ghi sự kiện payOS TRONG giao dịch chạy xong thì ném một lần. Gắn TRƯỚC khi nạp route
  // (route lấy beginTransaction lúc require).
  let mocChetSauSuKien = false, mocTruocTx = null, mocBan = false;
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const moc = mocTruocTx; mocTruocTx = null;   // B9b: một lệnh chốt khác chạy XONG giữa "phép kiểm ngoài giao dịch" và "mở giao dịch"
    if (moc) await moc();
    const tx = await txGoc(...a);
    const runGoc = tx.run;
    tx.run = async (sql, p) => {
      const kq = await runGoc(sql, p);
      if (mocChetSauSuKien && /INSERT INTO pos_payos_su_kien/.test(sql)) { mocChetSauSuKien = false; throw new Error('chết giữa chừng (bài thử)'); }
      if (mocBan && /SET trang_thai = 'da_thu'/.test(sql)) { mocBan = false; throw Object.assign(new Error('kho bận (bài thử)'), { code: 'SQLITE_BUSY' }); }
      return kq;
    };
    return tx;
  };

  // payOS giả: ghi lại mọi yêu cầu, trả vỏ có chữ ký đúng (như SDK kiểm).
  const payosNhan = [];
  let payosHong = null;   // 'tu_choi' | 'ky_sai' — A6
  const gia = express();
  gia.use(express.json());
  gia.post('/v2/payment-requests', (req, res) => {
    payosNhan.push({ headers: req.headers, body: req.body });
    const data = { orderCode: req.body.orderCode, amount: req.body.amount, description: req.body.description, status: 'PENDING',
      paymentLinkId: 'pl_' + req.body.orderCode, qrCode: 'QR_GIA_' + req.body.orderCode, checkoutUrl: 'https://gia/' + req.body.orderCode };
    if (payosHong === 'tu_choi') return res.json({ code: '20', desc: 'tu choi (gia)', data: null });
    res.json({ code: '00', desc: 'success', data, signature: payosHong === 'ky_sai' ? hmac(chuoiKy(data), 'khoa_khac') : hmac(chuoiKy(data)) });
  });
  const svGia = await new Promise((ok) => { const s = gia.listen(0, '127.0.0.1', () => ok(s)); });
  process.env.PAYOS_BASE_URL = `http://127.0.0.1:${svGia.address().port}`;

  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/customers', require(R('customers.js')));
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/wallets', require(R('wallets.js')));
  const tt = thuNap(R('thanh-toan.js'));
  if (tt) app.use('/api/pos/thanh-toan', tt);
  if (tt && tt.webhook) app.use('/api/payos/webhook', tt.webhook);
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const { kyTokenKhach } = require(path.join(GOC, 'server', 'middleware', 'khachAuth.js'));
  const { chayDoiSoat } = require(path.join(GOC, 'server', 'utils', 'doiSoat.js'));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  // ── Dữ liệu nền ──────────────────────────────────────────────────────────
  const tkVai = async (role) => {
    if (role !== 'owner') await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)", ['p3_' + role, role, role]);
    const u = await db.queryOne(role === 'owner' ? "SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1" : 'SELECT id FROM pos_users WHERE username = ?', ['p3_' + role]);
    return jwt.sign({ userId: u.id }, KHOA_NV, { expiresIn: '1h' });
  };
  const tkChu = await tkVai('owner'), tkQl = await tkVai('manager'), tkNv = await tkVai('staff');
  const datCaiDat = (key, value) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(value)]);
  for (const [a, b] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['flash_enabled', 'false'], ['signup_enabled', '0']]) await datCaiDat(a, b);
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 25000 WHERE id = ?', [sp.id]);
  const mon = (sl = 1) => ({ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: sl });

  const goi = async (method, url, body, tk = tkNv) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
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
  const dem = async (sql, p = []) => Number((await db.queryOne(sql, p).catch(() => null))?.n ?? -1);
  const soDon = () => dem('SELECT COUNT(*) AS n FROM pos_orders');
  const soDongVi = () => dem('SELECT COUNT(*) AS n FROM pos_balance_transactions');
  const soDu = async (sdt) => Number((await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [sdt]))?.balance || 0);
  const dongPhien = (id) => db.queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [id]).catch(() => null);
  const suKien = (id) => db.query('SELECT * FROM pos_payos_su_kien WHERE ma_payos = ? ORDER BY id', [id]).catch(() => []);
  const luiPhien = (id) => db.run("UPDATE pos_phien_thanh_toan SET het_han = strftime('%Y-%m-%dT%H:%M:%S', ?, '-1 seconds') WHERE id = ?", [getNow(), id]).catch(() => {});

  let soSdt = 0;
  const sdtMoi = () => '09' + String(30000000 + (++soSdt)).padStart(8, '0');
  // Khách mới (có hồ sơ) + nạp ví qua route thật + PIN đặt qua quầy (2 lần).
  const khach = async (napVi = 0, pin = '1357', them = {}) => {
    const sdt = sdtMoi();
    await db.run('INSERT INTO pos_customers (phone, name, parent_phone, created_at) VALUES (?, ?, ?, ?)', [sdt, 'Khách ' + sdt, them.me || null, getNow()]);
    if (napVi) await goi('POST', '/pos/wallets/topup', { phone: sdt, amount: napVi }, tkChu);
    if (pin) await goi('POST', '/pos/thanh-toan/pin', { phone: sdt, pin, pin_lai: pin });
    return sdt;
  };
  const taoPhien = (o) => goi('POST', '/pos/thanh-toan/phien', {
    don: { items: [mon(o.sl || 1)], ...(o.sdt ? { customer_phone: o.sdt, customer_name: 'K' } : {}), ...(o.don || {}) },
    cach: o.cach || 'payos', tru_tai_khoan: !!o.pin, pin: o.pin, tru_tai_khoan_me: !!o.pinMe, pin_me: o.pinMe }, o.tk);
  let soRef = 0;
  const webhook = (p, them = {}, ck = KHOA.ck) => {
    const data = { orderCode: p.id, amount: p.con_lai, description: p.noi_dung || 'x', accountNumber: '12345678', reference: 'REF' + (++soRef),
      transactionDateTime: getNow().replace('T', ' '), currency: 'VND', paymentLinkId: 'pl_' + p.id, code: '00', desc: 'success',
      counterAccountBankId: '', counterAccountName: null, ...them };
    return { code: '00', desc: 'success', success: true, data, signature: hmac(chuoiKy(data), ck) };
  };
  const guiWebhook = (than) => goi('POST', '/payos/webhook', than, null);
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };
  const PIN = '1357';

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] tạo phiên payOS: số tiền máy chủ tính, mã đơn duy nhất, nội dung ≤ 9 ký tự, hạn 10 phút');
  await chay('A', async () => {
    const a = await khach(30000);
    const t0 = Math.floor(Date.now() / 1000);
    const r = await taoPhien({ sdt: a, sl: 2, pin: PIN });
    const p = r.j.phien || {}, nhan = payosNhan[payosNhan.length - 1] || { body: {}, headers: {} };
    k('A1 tạo phiên 50.000 (giữ 30.000 tài khoản) → 200, payOS nhận đúng PHẦN CÒN LẠI 20.000', la(r, 200) && p.giu_vi === 30000
      && p.con_lai === 20000 && nhan.body.amount === 20000, moTa(r) + ' · ' + JSON.stringify(nhan.body).slice(0, 120));
    k('A1 mã đơn payOS = mã phiên, nội dung TQD<mã phiên> ≤ 9 ký tự, không dấu cách', nhan.body.orderCode === p.id
      && nhan.body.description === 'TQD' + p.id && nhan.body.description.length <= 9 && p.noi_dung === nhan.body.description);
    const b = nhan.body, chuKyLink = hmac(`amount=${b.amount}&cancelUrl=${b.cancelUrl}&description=${b.description}&orderCode=${b.orderCode}&returnUrl=${b.returnUrl}`);
    k('A1 chữ ký tạo link đúng công thức payOS, header x-client-id / x-api-key', b.signature === chuKyLink
      && nhan.headers['x-client-id'] === KHOA.id && nhan.headers['x-api-key'] === KHOA.api);
    k('A1 expiredAt = giây Unix nguyên, hạn 10 phút (±5 s)', Number.isInteger(b.expiredAt) && Math.abs(b.expiredAt - t0 - 600) <= 5, String(b.expiredAt));
    const hh = await db.queryOne("SELECT CAST(strftime('%s', het_han) AS INTEGER) - CAST(strftime('%s', ?) AS INTEGER) AS n FROM pos_phien_thanh_toan WHERE id = ?", [getNow(), p.id]).catch(() => null);
    k('A1 cột het_han của phiên = bây giờ + 10 phút (±5 s); quầy nhận QR của payOS', !!hh && Math.abs(hh.n - 600) <= 5 && p.qr === 'QR_GIA_' + p.id, JSON.stringify(hh));
    const r2 = await taoPhien({});
    k('A1 phiên thứ hai → mã đơn payOS khác', la(r2, 200) && payosNhan[payosNhan.length - 1].body.orderCode !== nhan.body.orderCode, moTa(r2));
    const r3 = await taoPhien({ don: { items: [{ ...mon(1), unit_price: 1, total_price: 1 }], total: 1, transfer_amount: 1, cash_amount: 1 } });
    k('A2 giỏ gửi unit_price / total / tiền sai → payOS vẫn nhận số máy chủ tính 25.000', la(r3, 200) && payosNhan[payosNhan.length - 1].body.amount === 25000, moTa(r3));
    const truoc = await dem('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan'), lan = payosNhan.length;
    datKhoa({ id: '', api: '', ck: KHOA.ck });
    const r4 = await taoPhien({ sdt: a, pin: PIN });
    datKhoa(KHOA);
    k('A3 thiếu khoá payOS → 503 PAYOS_CHUA_CAU_HINH, không tạo phiên, không gọi payOS', la(r4, 503, 'PAYOS_CHUA_CAU_HINH')
      && await dem('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan') === truoc && payosNhan.length === lan, moTa(r4));
    // A4: QR tĩnh (ck_tay) — chỉ chốt được bằng xác nhận tay.
    const c = await taoPhien({ cach: 'ck_tay' });
    const cp = c.j.phien || {};
    const c1 = await goi('POST', `/pos/thanh-toan/phien/${cp.id}/chot`, {});
    const d0 = await soDon();
    const c2 = await guiWebhook(webhook({ ...cp, con_lai: 25000 }));
    k('A4 phiên ck_tay → 200, không gọi payOS; tự chốt → 400 PHIEN_KHONG_CHOT_TAY', la(c, 200) && payosNhan.length === lan && la(c1, 400, 'PHIEN_KHONG_CHOT_TAY'), moTa(c) + ' / ' + moTa(c1));
    k('A4 webhook mang mã của phiên ck_tay → 200, KHÔNG đơn, sự kiện khong_phien', la(c2, 200) && await soDon() === d0
      && (await suKien(cp.id)).map((x) => x.ket_qua).join() === 'khong_phien', moTa(c2));
    const c3 = await goi('POST', `/pos/thanh-toan/phien/${cp.id}/xac-nhan-tay`, { ly_do: 'Khách CK vào tài khoản quán' }, tkQl);
    k('A4 phiên ck_tay → xác nhận tay (quản lý) mới chốt được', la(c3, 200) && c3.j.order && (await dongPhien(cp.id))?.nguon === 'tay', moTa(c3));
    // A5: mã phiên 6 chữ số (nội dung 9 ký tự) qua; 7 chữ số (10 ký tự) → lỗi có mã, không cắt.
    await db.run("UPDATE sqlite_sequence SET seq = 999998 WHERE name = 'pos_phien_thanh_toan'").catch(() => {});
    const r5 = await taoPhien({}), r6 = await taoPhien({});
    k('A5 mã phiên 999999 → nội dung TQD999999 (9 ký tự) → 200', la(r5, 200) && r5.j.phien.noi_dung === 'TQD999999', moTa(r5));
    k('A5 mã phiên 1000000 (nội dung 10 ký tự) → 409 MA_PHIEN_QUA_DAI, không gọi payOS', la(r6, 409, 'MA_PHIEN_QUA_DAI')
      && payosNhan[payosNhan.length - 1].body.orderCode === 999999, moTa(r6));
    // Dọn hai phiên mã cao (AUTOINCREMENT lấy max(seq, max id)) để các mục sau dùng mã ngắn.
    await db.run('DELETE FROM pos_phien_thanh_toan WHERE id >= 999999').catch(() => {});
    await db.run("UPDATE sqlite_sequence SET seq = 2000 WHERE name = 'pos_phien_thanh_toan'").catch(() => {});
  });

  muc('[A6] payOS từ chối / trả vỏ sai chữ ký → 502, nhả phần giữ');
  await chay('A6', async () => {
    const a = await khach(30000);
    for (const [kieu, nhan] of [['tu_choi', 'từ chối'], ['ky_sai', 'vỏ trả sai chữ ký']]) {
      payosHong = kieu;
      const r = await taoPhien({ sdt: a, sl: 2, pin: PIN });
      payosHong = null;
      const w = await goi('GET', `/pos/wallets/${a}`);
      k(`A6 payOS ${nhan} → 502 PAYOS_LOI, phần giữ nhả ngay (khả dụng 30.000)`, la(r, 502, 'PAYOS_LOI') && w.j.kha_dung === 30000, `${moTa(r)} · ${w.j.kha_dung}`);
    }
  });

  muc('[B] webhook payOS: chữ ký, một lần ghi, tiền về chưa khớp, chết giữa chừng');
  const vB = {};
  await chay('B', async () => {
    const a = await khach(30000);
    const p = (await taoPhien({ sdt: a, sl: 2, pin: PIN })).j.phien;
    const d0 = await soDon(), sk0 = await dem('SELECT COUNT(*) AS n FROM pos_payos_su_kien');
    const sai = webhook(p); sai.signature = hmac(chuoiKy(sai.data), 'khoa_khac');
    const b1 = await guiWebhook(sai);
    k('B1 chữ ký sai → 400 CHU_KY_SAI, không đơn, không sự kiện', la(b1, 400, 'CHU_KY_SAI') && await soDon() === d0
      && await dem('SELECT COUNT(*) AS n FROM pos_payos_su_kien') === sk0, moTa(b1));
    datKhoa({ ...KHOA, ck: '' });
    const b2 = await guiWebhook(webhook(p, {}, ''));
    datKhoa(KHOA);
    k('B2 khoá checksum rỗng + chữ ký HMAC khoá rỗng → 400, không đơn', la(b2, 400) && await soDon() === d0, moTa(b2));
    vB.p = p;
    const bao = webhook(p);
    const b3 = await guiWebhook(bao);
    const pp = await dongPhien(p.id) || {}, don = await db.queryOne('SELECT * FROM pos_orders WHERE id = ?', [pp.order_id]) || {};
    const diem = await db.queryOne("SELECT points FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [don.id || -1]);
    k('B3 đúng chữ ký + mã + tiền → 200, MỘT đơn paid, CK 20.000 + tài khoản 30.000', la(b3, 200) && await soDon() === d0 + 1
      && don.payment_status === 'paid' && Number(don.transfer_amount) === 20000 && Number(don.balance_amount) === 30000 && Number(don.cash_amount) === 0, moTa(b3) + ' ' + JSON.stringify(pp).slice(0, 100));
    k('B3 ví trừ đúng 30.000 (còn 0), điểm = floor(50.000 / 10.000) = 5, kho SX có dòng ra như đơn quầy', await soDu(a) === 0 && Number(diem?.points) === 5
      && await dem("SELECT COUNT(*) AS n FROM pos_stock_pending WHERE order_id = ? AND direction = 'out'", [don.id || -1]) === 1);
    k('B3 phiên da_thu nguồn payos, sự kiện khop', pp.trang_thai === 'da_thu' && pp.nguon === 'payos' && (await suKien(p.id)).map((x) => x.ket_qua).join() === 'khop');
    for (let i = 0; i < 3; i++) await guiWebhook(bao);
    k('B4 báo lặp 3 lần → vẫn MỘT đơn, MỘT sự kiện', await soDon() === d0 + 1 && (await suKien(p.id)).length === 1);
    const a5 = await khach(30000), p5 = (await taoPhien({ sdt: a5, sl: 2, pin: PIN })).j.phien, d5 = await soDon();
    const bao5 = webhook(p5);
    const [x, y] = await Promise.all([guiWebhook(bao5), guiWebhook(bao5)]);
    k('B5 hai báo CÙNG LÚC → MỘT đơn, ví trừ MỘT lần', x.status === 200 && y.status === 200 && await soDon() === d5 + 1 && await soDu(a5) === 0, moTa(x) + ' / ' + moTa(y));
    const a6 = await khach(30000), p6 = (await taoPhien({ sdt: a6, sl: 2, pin: PIN })).j.phien, d6 = await soDon();
    const b6 = await guiWebhook(webhook(p6, { amount: p6.con_lai - 1000 }));
    k('B6 lệch 1.000đ → 200, KHÔNG đơn, sự kiện chua_khop, ví nguyên', la(b6, 200) && await soDon() === d6 && await soDu(a6) === 30000
      && (await suKien(p6.id)).map((s) => s.ket_qua).join() === 'chua_khop', moTa(b6));
    const p6b = (await taoPhien({})).j.phien, d6b = await soDon();
    const b6b = await guiWebhook(webhook(p6b, { amount: p6b.con_lai + 1000 }));
    k('B6 trả DƯ 1.000đ → 200, KHÔNG đơn, sự kiện chua_khop', la(b6b, 200) && await soDon() === d6b
      && (await suKien(p6b.id)).map((s) => s.ket_qua).join() === 'chua_khop', moTa(b6b));
    const p7 = (await taoPhien({})).j.phien;
    await luiPhien(p7.id);
    const c7 = await goi('GET', `/pos/thanh-toan/phien/${p7.id}`);
    k('C1 phiên lùi quá hạn → GET trạng thái het_han', c7.j.phien?.trang_thai === 'het_han', moTa(c7));
    const b7 = await guiWebhook(webhook(p7));
    k('B7 tiền về sau khi hết hạn → KHÔNG đơn, chua_khop', la(b7, 200) && !(await dongPhien(p7.id))?.order_id && (await suKien(p7.id)).map((s) => s.ket_qua).join() === 'chua_khop', moTa(b7));
    const p7b = (await taoPhien({})).j.phien;
    const b7b = await guiWebhook(webhook(p7b, { transactionDateTime: '2099-01-01 00:00:00' }));
    k('B7 transactionDateTime (payOS ký) sau het_han của phiên → KHÔNG đơn, chua_khop', la(b7b, 200)
      && !(await dongPhien(p7b.id))?.order_id && (await suKien(p7b.id))[0]?.ket_qua === 'chua_khop' || false, moTa(b7b));
    const p8 = (await taoPhien({})).j.phien;
    const h8 = await goi('POST', `/pos/thanh-toan/phien/${p8.id}/huy`, {});
    const c8 = await goi('GET', `/pos/thanh-toan/phien/${p8.id}`);
    const b8 = await guiWebhook(webhook(p8));
    k('B8 / C1 huỷ → GET huy; tiền về sau huỷ → KHÔNG đơn, chua_khop', la(h8, 200) && c8.j.phien?.trang_thai === 'huy' && la(b8, 200)
      && !(await dongPhien(p8.id))?.order_id && (await suKien(p8.id)).map((s) => s.ket_qua).join() === 'chua_khop', moTa(h8));
    const p9 = (await taoPhien({})).j.phien, d9 = await soDon();
    const [w9, t9] = await Promise.all([guiWebhook(webhook(p9)), goi('POST', `/pos/thanh-toan/phien/${p9.id}/xac-nhan-tay`, { ly_do: 'Thấy tiền về' }, tkQl)]);
    const sk9 = (await suKien(p9.id)).map((s) => s.ket_qua).join(), n9 = (await dongPhien(p9.id))?.nguon;
    k('B9 webhook + xác nhận tay CÙNG LÚC → MỘT đơn; bên thua: webhook chua_khop / xác nhận tay 409', await soDon() === d9 + 1
      && ((n9 === 'payos' && sk9 === 'khop' && la(t9, 409, 'PHIEN_DA_CHOT')) || (n9 === 'tay' && sk9 === 'chua_khop')), `${moTa(w9)} / ${moTa(t9)} · ${n9} · ${sk9}`);
    const p9b = (await taoPhien({})).j.phien, d9b = await soDon();
    let t9b = null;
    mocTruocTx = async () => { t9b = await goi('POST', `/pos/thanh-toan/phien/${p9b.id}/xac-nhan-tay`, { ly_do: 'Chen giữa' }, tkQl); };
    const w9b = await guiWebhook(webhook(p9b));
    mocTruocTx = null;
    k('B9b (tất định) xác nhận tay chốt XONG giữa phép kiểm và giao dịch của webhook → MỘT đơn (nguồn tay), webhook chua_khop',
      la(w9b, 200) && t9b && la(t9b, 200) && await soDon() === d9b + 1 && (await dongPhien(p9b.id))?.nguon === 'tay'
      && (await suKien(p9b.id)).map((s) => s.ket_qua).join() === 'chua_khop', `${moTa(w9b)} / ${t9b && moTa(t9b)} · ${await soDon() - d9b} đơn`);
    const p11 = (await taoPhien({})).j.phien, d11 = await soDon();
    const b11 = await guiWebhook(webhook(p11, { code: '01', desc: 'fail' }));
    k('B11 data.code ≠ 00 → 200, KHÔNG đơn, sự kiện that_bai', la(b11, 200) && await soDon() === d11 && (await suKien(p11.id))[0]?.ket_qua === 'that_bai', moTa(b11));
    const a12 = await khach(30000), p12 = (await taoPhien({ sdt: a12, sl: 2, pin: PIN })).j.phien, d12 = await soDon();
    await db.run('UPDATE pos_products SET price = 30000 WHERE id = ?', [sp.id]);
    const b12 = await guiWebhook(webhook(p12));
    await db.run('UPDATE pos_products SET price = 25000 WHERE id = ?', [sp.id]);
    const t12 = await goi('POST', `/pos/thanh-toan/phien/${p12.id}/xac-nhan-tay`, { ly_do: 'thử chốt lại' }, tkQl);
    const v12 = await goi('GET', `/pos/wallets/${a12}`);
    k('B12 giá đổi giữa tạo phiên và tiền về → KHÔNG đơn, phiên loi, sự kiện chua_khop', la(b12, 200) && await soDon() === d12
      && (await dongPhien(p12.id))?.trang_thai === 'loi' && (await suKien(p12.id))[0]?.ket_qua === 'chua_khop', moTa(b12));
    k('B12 sau đó chốt lại phiên loi → 409 PHIEN_DA_CHOT; phần giữ đã nhả (khả dụng 30.000)', la(t12, 409, 'PHIEN_DA_CHOT') && v12.j.kha_dung === 30000, moTa(t12));
    const a13 = await khach(30000), p13 = (await taoPhien({ sdt: a13, sl: 2, pin: PIN })).j.phien, d13 = await soDon();
    mocChetSauSuKien = true;
    const b13 = await guiWebhook(webhook(p13));
    mocChetSauSuKien = false;
    const giua = { don: await soDon(), sk: (await suKien(p13.id)).length, tt: (await dongPhien(p13.id))?.trang_thai, vi: await soDu(a13) };
    const b13b = await guiWebhook(webhook(p13));
    k('B13 chết sau khi ghi sự kiện TRONG giao dịch → 5xx, rollback cả sự kiện, phiên vẫn cho, ví nguyên', b13.status >= 500
      && giua.don === d13 && giua.sk === 0 && giua.tt === 'cho' && giua.vi === 30000, moTa(b13) + ' ' + JSON.stringify(giua));
    k('B13 payOS báo lại → chốt được (không bị nuốt)', la(b13b, 200) && await soDon() === d13 + 1 && (await suKien(p13.id)).map((s) => s.ket_qua).join() === 'khop', moTa(b13b));
    const a14 = await khach(30000), p14 = (await taoPhien({ sdt: a14, sl: 2, pin: PIN })).j.phien, d14 = await soDon();
    mocBan = true;
    const b14 = await guiWebhook(webhook(p14));
    mocBan = false;
    const giua14 = { don: await soDon(), sk: (await suKien(p14.id)).length, tt: (await dongPhien(p14.id))?.trang_thai, vi: await soDu(a14) };
    const b14b = await guiWebhook(webhook(p14));
    k('B14 kho bận lúc chốt → webhook 409 KHO_BAN (payOS báo lại), KHÔNG sự kiện, phiên vẫn cho, ví nguyên', la(b14, 409, 'KHO_BAN')
      && giua14.don === d14 && giua14.sk === 0 && giua14.tt === 'cho' && giua14.vi === 30000, moTa(b14) + ' ' + JSON.stringify(giua14));
    k('B14 payOS báo lại → chốt được', la(b14b, 200) && await soDon() === d14 + 1, moTa(b14b));
    const ds = await chayDoiSoat({ kieu: 'ngay' });
    k('B10 Đối soát hôm nay ĐỎ: dòng CK cho tiền về chưa khớp', ds.ket_qua === 'DO' && ds.do.filter((l) => l.bat_bien === 'CK').length >= 5,
      ds.do.filter((l) => l.bat_bien === 'CK').length + ' dòng');
    k('B10 sự kiện khong_phien → CẦN XEM (vàng), không đỏ', ds.can_xem.some((l) => l.bat_bien === 'CK') && !ds.do.some((l) => l.bat_bien === 'CK' && /khong_phien|không thuộc phiên/.test(l.mo_ta)));
    k('D4 Đối soát CẦN XEM có dòng XNT cho đơn xác nhận tay', ds.can_xem.some((l) => l.bat_bien === 'XNT'));
  });

  muc('[C] trạng thái phiên — máy khách không tự đánh dấu "đã thu chuyển khoản"');
  await chay('C', async () => {
    const p = (await taoPhien({})).j.phien;
    const c0 = await goi('GET', `/pos/thanh-toan/phien/${p.id}`);
    k('C1 phiên mới → cho', c0.j.phien?.trang_thai === 'cho' && c0.j.phien?.con_lai === 25000, moTa(c0));
    const c1 = vB.p ? await goi('GET', `/pos/thanh-toan/phien/${vB.p.id}`) : { j: {}, status: 0 };
    k('C1 phiên payOS đã về → da_thu + mã đơn', c1.j.phien?.trang_thai === 'da_thu' && /^ORD-/.test(c1.j.phien?.order?.code || ''), moTa(c1));
    const c2 = await goi('POST', `/pos/thanh-toan/phien/${p.id}/chot`, { cash_received: 25000 });
    k('C2 nhân viên tự chốt phiên payOS → 400 PHIEN_KHONG_CHOT_TAY', la(c2, 400, 'PHIEN_KHONG_CHOT_TAY'), moTa(c2));
    const c3 = await goi('GET', '/pos/thanh-toan/phien/99999999');
    k('C1 phiên không có → 404 KHONG_THAY_PHIEN', la(c3, 404, 'KHONG_THAY_PHIEN'), moTa(c3));
  });

  muc('[D] xác nhận tay: chỉ chủ quán / quản lý, bắt buộc lý do, ghi nhật ký');
  await chay('D', async () => {
    const p = (await taoPhien({})).j.phien;
    const d1 = await goi('POST', `/pos/thanh-toan/phien/${p.id}/xac-nhan-tay`, { ly_do: 'nhân viên tự bấm' }, tkNv);
    k('D1 nhân viên xác nhận tay → 403', d1.status === 403, moTa(d1));
    const d2 = await goi('POST', `/pos/thanh-toan/phien/${p.id}/xac-nhan-tay`, { ly_do: '  ' }, tkQl);
    k('D2 quản lý thiếu lý do → 400 CAN_LY_DO', la(d2, 400, 'CAN_LY_DO'), moTa(d2));
    const d2b = await goi('POST', `/pos/thanh-toan/phien/${p.id}/xac-nhan-tay`, { ly_do: ' ab ' }, tkQl);
    k('D2 lý do 2 ký tự (ngay dưới ngưỡng 3) → 400 CAN_LY_DO', la(d2b, 400, 'CAN_LY_DO'), moTa(d2b));
    const p3k = (await taoPhien({})).j.phien;
    const d2c = await goi('POST', `/pos/thanh-toan/phien/${p3k.id}/xac-nhan-tay`, { ly_do: 'abc' }, tkQl);
    k('D2 lý do đúng 3 ký tự → 200', la(d2c, 200), moTa(d2c));
    const ptm = (await taoPhien({ cach: 'tien_mat' })).j.phien;
    const d6 = await goi('POST', `/pos/thanh-toan/phien/${ptm.id}/xac-nhan-tay`, { ly_do: 'thử nhầm phiên' }, tkQl);
    k('D6 xác nhận tay phiên tiền mặt → 400 PHIEN_KHONG_PHAI_CK', la(d6, 400, 'PHIEN_KHONG_PHAI_CK'), moTa(d6));
    const d3 = await goi('POST', `/pos/thanh-toan/phien/${p.id}/xac-nhan-tay`, { ly_do: 'Sao kê có tiền, webhook lỡ' }, tkQl);
    const pp = await dongPhien(p.id) || {}, don = await db.queryOne('SELECT * FROM pos_orders WHERE id = ?', [pp.order_id || -1]) || {};
    k('D3 quản lý có lý do → đơn CK 25.000; phiên lưu lý do + người + giờ', la(d3, 200) && Number(don.transfer_amount) === 25000
      && pp.nguon === 'tay' && pp.ly_do === 'Sao kê có tiền, webhook lỡ' && pp.nguoi_xac_nhan === 'p3_manager' && !!pp.luc_chot, moTa(d3));
    const log = await db.queryOne("SELECT * FROM pos_order_log WHERE order_id = ? AND loai = 'xac_nhan_ck_tay'", [don.id || -1]);
    k('D5 nhật ký đơn có dòng xac_nhan_ck_tay kèm lý do', !!log && /webhook lỡ/.test(log.chi_tiet || log.noi_dung || ''));
    const q = await db.query("SELECT role, permission, allowed FROM pos_permissions WHERE permission IN ('xac_nhan_ck_tay', 'xoa_pin_khach') ORDER BY permission, role");
    k('D4 quyền seed: xac_nhan_ck_tay + xoa_pin_khach — manager 1, owner 1, staff 0', q.map((x) => `${x.permission}:${x.role}=${x.allowed}`).join()
      === 'xac_nhan_ck_tay:manager=1,xac_nhan_ck_tay:owner=1,xac_nhan_ck_tay:staff=0,xoa_pin_khach:manager=1,xoa_pin_khach:owner=1,xoa_pin_khach:staff=0',
    q.map((x) => `${x.permission}:${x.role}=${x.allowed}`).join());
  });

  muc('[E] PIN: băm, 2 lần gõ, sai 5 lần khoá 15 phút, không lộ ở câu trả khách');
  await chay('E', async () => {
    const b = await khach(50000, null);
    const e1 = await goi('POST', '/pos/thanh-toan/pin', { phone: b, pin: '2468', pin_lai: '2468' });
    const cot = (await db.queryOne('SELECT pin_code FROM pos_customers WHERE phone = ?', [b]))?.pin_code || '';
    k('E1 đặt PIN ở quầy (2 lần khớp) → cột là băm bcrypt, không phải 4 số', la(e1, 200) && cot.startsWith('$2') && bcrypt.compareSync('2468', cot), moTa(e1));
    const e1b = await goi('POST', '/pos/thanh-toan/pin', { phone: b, pin: '1111', pin_lai: '1111' });
    k('E1 quầy đặt lại khi đã có PIN → 409 PIN_DA_CO', la(e1b, 409, 'PIN_DA_CO'), moTa(e1b));
    const c = await khach(50000, null);
    const e2 = await goi('POST', '/pos/thanh-toan/pin', { phone: c, pin: '1234', pin_lai: '1243' });
    const e2b = await goi('POST', '/pos/thanh-toan/pin', { phone: c, pin: '12a4', pin_lai: '12a4' });
    k('E2 hai lần lệch → 400 PIN_KHONG_KHOP; không phải 4 chữ số → 400 PIN_KHONG_HOP_LE', la(e2, 400, 'PIN_KHONG_KHOP') && la(e2b, 400, 'PIN_KHONG_HOP_LE'), moTa(e2) + ' / ' + moTa(e2b));
    const e2c = await goi('POST', '/pos/thanh-toan/pin', { phone: c, pin: '123', pin_lai: '123' });
    const e2d = await goi('POST', '/pos/thanh-toan/pin', { phone: c, pin: '12345', pin_lai: '12345' });
    k('E2 PIN 3 số / 5 số (ngay dưới / ngay trên 4) → 400 PIN_KHONG_HOP_LE', la(e2c, 400, 'PIN_KHONG_HOP_LE') && la(e2d, 400, 'PIN_KHONG_HOP_LE'), moTa(e2c) + ' / ' + moTa(e2d));
    const e5 = await taoPhien({ sdt: c, cach: 'tien_mat', pin: '1234' });
    k('E5 chưa có PIN mà trừ tài khoản → 400 CHUA_CO_PIN', la(e5, 400, 'CHUA_CO_PIN'), moTa(e5));
    await db.run("UPDATE pos_customers SET pin_code = '1234' WHERE phone = ?", [c]);
    const e5b = await taoPhien({ sdt: c, cach: 'tien_mat', pin: '1234' });
    const e5c = await goi('POST', '/pos/thanh-toan/pin', { phone: c, pin: '4321', pin_lai: '4321' });
    k('E5 (Q7) pin_code cũ không phải băm → coi như CHƯA có: trừ tài khoản 400 CHUA_CO_PIN, quầy đặt được', la(e5b, 400, 'CHUA_CO_PIN') && la(e5c, 200), moTa(e5b) + ' / ' + moTa(e5c));
    // E3: sai 5 lần → lần 6 dù đúng vẫn khoá; lùi giờ khoá → mở lại.
    const kq = [];
    for (let i = 0; i < 5; i++) kq.push(await taoPhien({ sdt: b, sl: 3, cach: 'tien_mat', pin: '0000' }));
    const e3 = await taoPhien({ sdt: b, sl: 3, cach: 'tien_mat', pin: '2468' });
    const khoa15 = await db.queryOne("SELECT CAST(strftime('%s', pin_khoa_den) AS INTEGER) - CAST(strftime('%s', ?) AS INTEGER) AS n FROM pos_customers WHERE phone = ?", [getNow(), b]).catch(() => null);
    k('E3 khoá đến = bây giờ + 15 phút (±5 s)', !!khoa15 && Math.abs(khoa15.n - 900) <= 5, JSON.stringify(khoa15));
    k('E3 sai 5 lần (mỗi lần 400 PIN_SAI) → lần 6 dù ĐÚNG → 423 PIN_DANG_KHOA', kq.every((x) => la(x, 400, 'PIN_SAI')) && la(e3, 423, 'PIN_DANG_KHOA'), kq.map(moTa).join(',') + ' / ' + moTa(e3));
    await db.run("UPDATE pos_customers SET pin_khoa_den = strftime('%Y-%m-%dT%H:%M:%S', ?, '-1 seconds') WHERE phone = ?", [getNow(), b]).catch(() => {});
    const e3b = await taoPhien({ sdt: b, sl: 3, cach: 'tien_mat', pin: '2468' });
    k('E3 hết 15 phút khoá → PIN đúng qua (200)', la(e3b, 200), moTa(e3b));
    if (e3b.j.phien) await goi('POST', `/pos/thanh-toan/phien/${e3b.j.phien.id}/huy`, {});
    const kq4 = [];
    for (let i = 0; i < 4; i++) kq4.push(await taoPhien({ sdt: b, sl: 3, cach: 'tien_mat', pin: '0000' }));
    const e4 = await taoPhien({ sdt: b, sl: 3, cach: 'tien_mat', pin: '2468' });
    const dem4 = (await db.queryOne('SELECT pin_sai FROM pos_customers WHERE phone = ?', [b]))?.pin_sai;
    k('E4 sai 4 lần (ngay dưới ngưỡng) + 1 đúng → 200, đếm sai về 0', kq4.every((x) => la(x, 400, 'PIN_SAI')) && la(e4, 200) && Number(dem4) === 0, moTa(e4) + ' · pin_sai=' + dem4);
    if (e4.j.phien) await goi('POST', `/pos/thanh-toan/phien/${e4.j.phien.id}/huy`, {});
    await Promise.all([taoPhien({ sdt: b, sl: 3, cach: 'tien_mat', pin: '0000' }), taoPhien({ sdt: b, sl: 3, cach: 'tien_mat', pin: '0000' })]);
    const n = await khach(50000, '2468');
    for (let i = 0; i < 2; i++) await taoPhien({ sdt: n, sl: 3, cach: 'tien_mat', pin: '0000' });
    const loat = await Promise.all(Array.from({ length: 30 }, () => taoPhien({ sdt: n, sl: 3, cach: 'tien_mat', pin: '0000' })));
    const soSo = loat.filter((x) => la(x, 400, 'PIN_SAI')).length, soKhoa = loat.filter((x) => la(x, 423, 'PIN_DANG_KHOA')).length;
    k('E10 đã sai 2 lần, 30 PIN sai CÙNG LÚC → chỉ 3 lượt được so (PIN_SAI), 27 lượt 423 PIN_DANG_KHOA', soSo === 3 && soKhoa === 27, `${soSo} so · ${soKhoa} khoá`);
    k('E8 hai PIN sai CÙNG LÚC → đếm 2 (cộng tương đối)', Number((await db.queryOne('SELECT pin_sai FROM pos_customers WHERE phone = ?', [b]))?.pin_sai) === 2);
    // Xoá PIN (quên PIN): owner / manager, lý do bắt buộc.
    const x1 = await goi('POST', '/pos/thanh-toan/pin/xoa', { phone: b, ly_do: 'Khách quên PIN' }, tkNv);
    const x2 = await goi('POST', '/pos/thanh-toan/pin/xoa', { phone: b }, tkQl);
    const x3 = await goi('POST', '/pos/thanh-toan/pin/xoa', { phone: b, ly_do: 'Khách quên PIN' }, tkQl);
    const sau = await db.queryOne('SELECT pin_code, pin_sai FROM pos_customers WHERE phone = ?', [b]);
    k('E (Q6) Xoá PIN: nhân viên 403 · thiếu lý do 400 CAN_LY_DO · quản lý có lý do → PIN trống, đếm sai 0', x1.status === 403 && la(x2, 400, 'CAN_LY_DO')
      && la(x3, 200) && sau && sau.pin_code == null && Number(sau.pin_sai) === 0, `${moTa(x1)} / ${moTa(x2)} / ${moTa(x3)}`);
    k('E (Q6) Xoá PIN ghi nhật ký (người + lý do)', !!(await db.queryOne("SELECT * FROM pos_nhat_ky_pin WHERE phone = ? AND viec = 'xoa' AND nguoi = 'p3_manager' AND ly_do = 'Khách quên PIN'", [b]).catch(() => null)));
    // E6: không câu trả nào của /customers lộ password / pin_code.
    await goi('POST', '/pos/thanh-toan/pin', { phone: b, pin: '2468', pin_lai: '2468' });
    await db.run("UPDATE pos_customers SET password = 'mat_khau_bam_thu_p3', qr_code = 'TQD-P3-QR-1' WHERE phone = ?", [b]);
    const kh = await db.queryOne('SELECT * FROM pos_customers WHERE phone = ?', [b]);
    const tao = await goi('POST', '/pos/customers', { phone: sdtMoi(), name: 'Mới P3', children: [{ name: 'Con', phone: sdtMoi() }] });
    const duong = [['GET /qr/:code', await goi('GET', '/pos/customers/qr/TQD-P3-QR-1')], ['GET /:id', await goi('GET', `/pos/customers/${kh.id}`)],
      ['GET /phone/:p', await goi('GET', `/pos/customers/phone/${b}`)], ['GET / (danh sách)', await goi('GET', `/pos/customers?search=${b}`)],
      ['GET /search', await goi('GET', `/pos/customers/search?q=${b}`)], ['POST / (tạo)', tao],
      ['PUT /:id', await goi('PUT', `/pos/customers/${kh.id}`, { name: kh.name })], ['PUT /:id/discount', await goi('PUT', `/pos/customers/${kh.id}/discount`, { discount_type: 'percent', discount_value: 0 }, tkChu)],
      ['GET /:id/children', await goi('GET', `/pos/customers/${kh.id}/children`)], ['POST /:id/children', await goi('POST', `/pos/customers/${kh.id}/children`, { name: 'Con 2', phone: sdtMoi() })]];
    const lo = duong.filter(([, r]) => r.tho.includes('"password"') || r.tho.includes('"pin_code"') || r.tho.includes(kh.pin_code) || r.tho.includes('mat_khau_bam_thu_p3'));
    k(`E6 ${duong.length} đường /customers (qr, id, phone, danh sách, search, tạo, sửa, chiết khấu, con) không trả password / pin_code`,
      lo.length === 0 && duong.filter(([t, r]) => r.status >= 200 && r.status < 300 && t !== 'GET /:id').length === duong.length - 1,   // GET /:id 500 có sẵn (Phát hiện)
 lo.map(([t]) => t).join(', ') + ' · ' + duong.map(([t, r]) => t + ' ' + r.status).join(', '));
    k('E6 hồ sơ khách có co_pin (quầy biết khách đã đặt PIN, không thấy băm)', duong[2][1].j.co_pin === true, JSON.stringify(duong[2][1].j).slice(0, 80));
    // E7 / E9: App KH đặt / đổi PIN của CHÍNH mình (SĐT từ token).
    const a = await khach(0, '1111'), bb = await khach(0, '2222');
    const idA = (await db.queryOne('SELECT id FROM pos_customers WHERE phone = ?', [a])).id;
    const bamB = (await db.queryOne('SELECT pin_code FROM pos_customers WHERE phone = ?', [bb])).pin_code;
    const e7 = await goi('PUT', '/kh/pin', { pin: '5678', pin_lai: '5678', sdt: bb, phone: bb, customer_phone: bb }, kyTokenKhach(idA));
    const sauA = (await db.queryOne('SELECT pin_code FROM pos_customers WHERE phone = ?', [a])).pin_code;
    const sauB = (await db.queryOne('SELECT pin_code FROM pos_customers WHERE phone = ?', [bb])).pin_code;
    k('E7 App KH A đổi PIN, gửi kèm SĐT của B → PIN A đổi (băm), PIN B nguyên', la(e7, 200) && bcrypt.compareSync('5678', sauA || '') && sauB === bamB, moTa(e7));
    const e9 = await goi('PUT', '/kh/pin', { pin: '5678', pin_lai: '5678' }, null);
    const e9b = await goi('PUT', '/kh/pin', { pin: '56', pin_lai: '56' }, kyTokenKhach(idA));
    k('E9 /kh/pin không token → 401; PIN sai dạng → 400 PIN_KHONG_HOP_LE có error + code', e9.status === 401 && la(e9b, 400, 'PIN_KHONG_HOP_LE') && !!e9b.j.error, moTa(e9) + ' / ' + moTa(e9b));
  });

  muc('[F] giữ tài khoản: số dư khả dụng = số dư − đang giữ ở MỌI nơi tiêu');
  await chay('F', async () => {
    const f = await khach(100000);
    const dong0 = await soDongVi();
    const r = await taoPhien({ sdt: f, sl: 3, cach: 'tai_khoan', pin: PIN });
    const p = r.j.phien || {};
    const w = await goi('GET', `/pos/wallets/${f}`);
    k('F1 / F6 phiên giữ 75.000 / 100.000 → GET ví có dang_giu 75.000, kha_dung 25.000; chưa ghi dòng sổ ví nào', la(r, 200) && p.giu_vi === 75000
      && w.j.dang_giu === 75000 && w.j.kha_dung === 25000 && Number(w.j.balance) === 100000 && await soDongVi() === dong0, moTa(r) + ' ' + JSON.stringify(w.j));
    const tru = await goi('POST', '/pos/wallets/deduct', { phone: f, amount: 30000 }, tkChu);
    const dc = await goi('POST', '/pos/wallets/adjust', { phone: f, amount: -30000, reason: 'thử giữ' }, tkChu);
    const od = await goi('POST', '/pos/orders', { customer_phone: f, items: [mon(2)], balance_amount: 50000 }, tkNv);
    k('F1 đang giữ: trừ tay 30.000 / điều chỉnh −30.000 / đơn quầy trừ 50.000 → 400 SO_DU_KHONG_DU', la(tru, 400, 'SO_DU_KHONG_DU')
      && la(dc, 400, 'SO_DU_KHONG_DU') && la(od, 400, 'SO_DU_KHONG_DU'), [tru, dc, od].map(moTa).join(' / '));
    const nap = await goi('POST', '/pos/wallets/topup', { phone: f, amount: 5000 }, tkChu);
    const tru2 = await goi('POST', '/pos/wallets/deduct', { phone: f, amount: 30000 }, tkChu);
    k('F1 (K5) nạp 5.000 khi đang giữ → 200; trừ đúng bằng khả dụng 30.000 → 200', la(nap, 200) && la(tru2, 200), moTa(nap) + ' / ' + moTa(tru2));
    const c = await goi('POST', `/pos/thanh-toan/phien/${p.id}/chot`, {});
    const don = c.j.order || {};
    const dd = await db.queryOne('SELECT * FROM pos_orders WHERE id = ?', [don.id || -1]) || {};
    k('F7 phiên chỉ trả tài khoản chốt → đơn balance 75.000, tiền mặt 0, ví còn 0', la(c, 200) && dd.payment_method === 'balance'
      && Number(dd.balance_amount) === 75000 && Number(dd.cash_amount) === 0 && await soDu(f) === 0, moTa(c));
    const c2 = await goi('POST', `/pos/thanh-toan/phien/${p.id}/chot`, {});
    k('F7 chốt lại lần hai → 409 PHIEN_DA_CHOT', la(c2, 409, 'PHIEN_DA_CHOT'), moTa(c2));
    // F2 / F3: hết hạn, huỷ → nhả, không dòng sổ nào.
    const g = await khach(100000);
    const d1 = await soDongVi();
    const p2 = (await taoPhien({ sdt: g, sl: 3, cach: 'tai_khoan', pin: PIN })).j.phien;
    await luiPhien(p2.id);
    const kd2 = (await goi('GET', `/pos/wallets/${g}`)).j.kha_dung;
    const c3 = await goi('POST', `/pos/thanh-toan/phien/${p2.id}/chot`, {});
    k('F2 phiên hết hạn → khả dụng về 100.000; chốt phiên hết hạn → 409', kd2 === 100000 && la(c3, 409, 'PHIEN_DA_CHOT'), `${kd2} · ${moTa(c3)}`);
    const p3 = (await taoPhien({ sdt: g, sl: 3, cach: 'tai_khoan', pin: PIN })).j.phien;
    const h3 = await goi('POST', `/pos/thanh-toan/phien/${p3.id}/huy`, {});
    const kd3 = (await goi('GET', `/pos/wallets/${g}`)).j.kha_dung;
    k('F3 huỷ → nhả (khả dụng 100.000); hết hạn + huỷ KHÔNG thêm dòng sổ ví nào', la(h3, 200) && kd3 === 100000 && await soDongVi() === d1, `${kd3}`);
    const tru3 = await goi('POST', '/pos/wallets/deduct', { phone: g, amount: 100000 }, tkChu);
    k('F2 sau khi nhả → trừ tay đủ 100.000 → 200', la(tru3, 200), moTa(tru3));
    // F4: hai quầy cùng giữ trên một ví.
    const h = await khach(100000);
    const [x, y] = await Promise.all([taoPhien({ sdt: h, sl: 6, pin: PIN }), taoPhien({ sdt: h, sl: 6, pin: PIN })]);
    const gx = x.j.phien?.giu_vi, gy = y.j.phien?.giu_vi;
    k('F4 hai phiên CÙNG LÚC trên ví 100.000 → tổng giữ đúng 100.000 (một phiên 100.000, phiên kia 0)', la(x, 200) && la(y, 200)
      && gx + gy === 100000 && [gx, gy].sort().join() === '0,100000', `${moTa(x)} ${gx} / ${moTa(y)} ${gy}`);
    // F4b (tất định): phiên B tạo XONG giữa phép kiểm và giao dịch của phiên A trên cùng ví → A thấy phần B đã giữ.
    const h2 = await khach(100000);
    let rB = null;
    mocTruocTx = async () => { rB = await taoPhien({ sdt: h2, sl: 6, pin: PIN }); };
    const rA = await taoPhien({ sdt: h2, sl: 6, pin: PIN });
    mocTruocTx = null;
    k('F4b (tất định) phiên B giữ XONG giữa phép kiểm và giao dịch của A → B 100.000, A 0 (đọc số dư + đang giữ TRONG giao dịch)',
      la(rA, 200) && rB && la(rB, 200) && rB.j.phien.giu_vi === 100000 && rA.j.phien.giu_vi === 0, `B ${rB && rB.j.phien?.giu_vi} / A ${rA.j.phien?.giu_vi}`);
    // F8: số dư đã thấp hơn phần đang giữ (vd đối soát ghi tuyệt đối) → điều chỉnh CỘNG vẫn qua.
    const q = await khach(50000);
    const pq = (await taoPhien({ sdt: q, sl: 2, cach: 'tai_khoan', pin: PIN })).j.phien;
    await db.run('UPDATE pos_wallets SET balance = 30000 WHERE phone = ?', [q]);
    const cong = await goi('POST', '/pos/wallets/adjust', { phone: q, amount: 10000, reason: 'bù lệch' }, tkChu);
    k('F8 số dư 30.000 < đang giữ 50.000 → điều chỉnh CỘNG 10.000 vẫn 200', !!pq && la(cong, 200), moTa(cong));
    // F9: SĐT mẹ = SĐT khách → giữ hai lần một ví → từ chối có mã.
    const f9 = await taoPhien({ sdt: q, sl: 4, cach: 'tien_mat', pin: PIN, pinMe: PIN, don: { parent_phone: q } });
    k('F9 trừ tài khoản + tài khoản mẹ cùng MỘT SĐT → 400 ME_TRUNG_KHACH', la(f9, 400, 'ME_TRUNG_KHACH'), moTa(f9));
    // F10: phiên hết hạn ĐÚNG lúc giữa phép báo sớm và giao dịch chốt → cổng trong giao dịch chặn.
    const pt10 = (await taoPhien({ sdt: await khach(0, null), cach: 'tien_mat' })).j.phien, d10 = await soDon();
    mocTruocTx = () => luiPhien(pt10.id);
    const c10 = await goi('POST', `/pos/thanh-toan/phien/${pt10.id}/chot`, {});
    mocTruocTx = null;
    k('F10 hết hạn giữa phép báo sớm và giao dịch → 409 PHIEN_DA_CHOT, KHÔNG đơn', la(c10, 409, 'PHIEN_DA_CHOT') && await soDon() === d10, moTa(c10));
    // F5: tài khoản mẹ — PIN của mẹ (Q4).
    const me = await khach(50000, '8642'), con = await khach(0, '1357', { me });
    const sai = await taoPhien({ sdt: con, sl: 3, cach: 'tien_mat', pinMe: '1357', don: { parent_phone: me } });
    k('F5 trừ tài khoản mẹ bằng PIN của con → 400 PIN_SAI (Q4: PIN của chủ tài khoản)', la(sai, 400, 'PIN_SAI'), moTa(sai));
    const pm = await taoPhien({ sdt: con, sl: 3, cach: 'tien_mat', pinMe: '8642', don: { parent_phone: me } });
    const trMe = await goi('POST', '/pos/wallets/deduct', { phone: me, amount: 1 }, tkChu);
    k('F5 giữ 50.000 trên ví MẸ, còn lại 25.000; đang giữ → trừ tay ví mẹ 1đ → 400', la(pm, 200) && pm.j.phien.giu_vi_me === 50000
      && pm.j.phien.con_lai === 25000 && la(trMe, 400, 'SO_DU_KHONG_DU'), moTa(pm) + ' / ' + moTa(trMe));
    const cm = await goi('POST', `/pos/thanh-toan/phien/${pm.j.phien?.id}/chot`, { cash_received: 30000 });
    const dm = await db.queryOne('SELECT * FROM pos_orders WHERE id = ?', [cm.j.order?.id || -1]) || {};
    k('F5 / H3 chốt tiền mặt → đơn mẹ 50.000 + tiền mặt 25.000 (khách đưa 30.000, thối 5.000), ví mẹ 0', la(cm, 200) && Number(dm.parent_balance_amount) === 50000
      && Number(dm.cash_amount) === 25000 && Number(dm.change_amount) === 5000 && dm.parent_phone === me && await soDu(me) === 0, moTa(cm));
    const pt = (await taoPhien({ sdt: await khach(0, null), cach: 'tien_mat' })).j.phien;
    const ct = await goi('POST', `/pos/thanh-toan/phien/${pt?.id}/chot`, { cash_received: 20000 });
    k('F (K5) khách KHÔNG có PIN trả tiền mặt (không trừ tài khoản) → phiên + chốt được; khách đưa thiếu → 400 TIEN_KHACH_DUA_THIEU',
      !!pt && la(ct, 400, 'TIEN_KHACH_DUA_THIEU') && la(await goi('POST', `/pos/thanh-toan/phien/${pt.id}/chot`, { cash_received: 25000 }), 200), moTa(ct));
  });

  muc('[G] điểm cộng giữ nguyên cách tính (tinhDiemDon)');
  await chay('G', async () => {
    const a = await khach(0, null), b = await khach(0, null);
    const p = (await taoPhien({ sdt: a, sl: 3, cach: 'tien_mat' })).j.phien;
    const c = await goi('POST', `/pos/thanh-toan/phien/${p?.id}/chot`, {});
    const q = await goi('POST', '/pos/orders', { customer_phone: b, items: [mon(3)], payment_method: 'cash', cash_amount: 75000 });
    const diem = async (id) => Number((await db.queryOne("SELECT points FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [id || -1]))?.points || 0);
    k('G1 đơn qua phiên = đơn quầy cùng giỏ: 7 điểm', la(c, 200) && la(q, 200) && await diem(c.j.order.id) === 7 && await diem(q.j.order.id) === 7, moTa(c));
    const gio = Number(getNow().slice(11, 13));
    for (const [key, v] of [['flash_enabled', 'true'], ['flash_start', `${String(gio).padStart(2, '0')}:00`], ['flash_end', `${String((gio + 2) % 24).padStart(2, '0')}:00`],
      ['flash_percent', 20], ['flash_product_keys', JSON.stringify([`${sp.sx_product_type}_${sp.sx_product_id}`])]]) await datCaiDat(key, v);
    const pf = (await taoPhien({ sdt: a, sl: 3, cach: 'tien_mat' })).j.phien;
    const cf = await goi('POST', `/pos/thanh-toan/phien/${pf?.id}/chot`, {});
    await datCaiDat('flash_enabled', 'false');
    k('G2 đơn Flash qua phiên → tổng 60.000, 0 điểm (như đơn quầy)', la(cf, 200) && pf.tong === 60000 && await diem(cf.j.order.id) === 0, moTa(cf));
  });

  muc('[H] một đơn không trả kết hợp tiền mặt + chuyển khoản');
  await chay('H', async () => {
    const h1 = await goi('POST', '/pos/orders', { items: [mon(1)], payment_method: 'cash', cash_amount: 10000, transfer_amount: 15000 });
    k('H1 POST /orders tiền mặt 10.000 + CK 15.000 → 400 TRA_KET_HOP', la(h1, 400, 'TRA_KET_HOP'), moTa(h1));
    const k1 = await goi('POST', '/pos/orders', { items: [mon(1)], payment_method: 'transfer', transfer_amount: 25000 });
    k('H (K5) chỉ chuyển khoản 25.000 (cờ payOS tắt) → 200', la(k1, 200), moTa(k1));
  });

  muc('[I] K5 — luồng cũ chạy như cũ; cờ thanh_toan_payos_bat_buoc');
  await chay('I', async () => {
    const a = await khach(100000, null);
    const i1 = await goi('POST', '/pos/orders', { customer_phone: a, items: [mon(1)], payment_method: 'cash', cash_amount: 25000 });
    const i2 = await goi('POST', '/pos/orders', { customer_phone: a, items: [mon(1)], payment_method: 'balance' });
    const i2b = await goi('POST', '/pos/orders', { customer_phone: a, items: [mon(1)], payment_method: 'cash', balance_amount: 25000 });
    await db.run("INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active) VALUES ('GOI-P3', 'Gói P3', 200000, 'túi', 10, 1)");
    const goiP = await db.queryOne("SELECT id FROM pos_packages WHERE code = 'GOI-P3'");
    const i4 = await goi('POST', '/pos/orders', { customer_phone: a, items: [], package_buy: { package_id: goiP.id }, payment_method: 'cash', cash_amount: 200000 });
    const cp = await db.queryOne('SELECT id FROM pos_customer_packages WHERE customer_phone = ? ORDER BY id DESC LIMIT 1', [a]);
    const i3 = await goi('POST', '/pos/orders', { customer_phone: a, items: [{ ...mon(1), from_package: true }], customer_package_id: cp?.id, payment_method: 'cash', cash_amount: 0 });
    await db.run("INSERT INTO pos_membership_tiers (name, card_price, discount_percent, is_active) VALUES ('Vàng', 300000, 5, 1)");
    const hang = await db.queryOne("SELECT id FROM pos_membership_tiers WHERE name = 'Vàng' ORDER BY id DESC LIMIT 1");
    const i5 = await goi('POST', '/pos/orders', { customer_phone: await khach(0, null), items: [], membership_buy: { tier_id: hang.id }, payment_method: 'cash', cash_amount: 300000 });
    const no = await goi('POST', '/pos/orders', { customer_phone: a, customer_name: 'K', items: [mon(1)], payment_method: 'debt', debt_amount: 25000, due_date: '2026-12-31' });
    const i6 = await goi('POST', `/pos/orders/${no.j.order?.id}/pay-debt`, { payment_method: 'cash', amount: 25000 });
    k('I1–I6 tiền mặt · số dư đủ (2 kiểu) · mua gói · giao từ gói 0đ · mua thẻ · thu nợ CŨ ở pay-debt → 200',
      [i1, i2, i2b, i4, i3, i5, no, i6].every((x) => la(x, 200)), [i1, i2, i2b, i4, i3, i5, no, i6].map(moTa).join(', '));
    await datCaiDat('thanh_toan_payos_bat_buoc', '1');
    const j1 = await goi('POST', '/pos/orders', { items: [mon(1)], payment_method: 'transfer', transfer_amount: 25000 });
    const j2 = await goi('POST', '/pos/orders', { customer_phone: a, items: [mon(1)], payment_method: 'cash', balance_amount: 25000 });
    const j3 = await goi('POST', '/pos/orders', { customer_phone: a, items: [mon(1)], payment_method: 'balance' });
    const j3b = await goi('POST', '/pos/orders', { customer_phone: await khach(0, null), items: [mon(1)], payment_method: 'cash', parent_phone: a, parent_balance_amount: 25000 });
    const j4 = await goi('POST', '/pos/orders', { items: [mon(1)], payment_method: 'cash', cash_amount: 25000 });
    const j5 = await goi('POST', '/pos/orders', { customer_phone: a, items: [{ ...mon(1), from_package: true }], customer_package_id: cp?.id, payment_method: 'cash', cash_amount: 0 });
    const pj = (await taoPhien({})).j.phien;
    const j6 = pj ? await guiWebhook(webhook(pj)) : { status: 0, j: {} };
    await datCaiDat('thanh_toan_payos_bat_buoc', '0');
    k('I7 cờ BẬT: CK trần → 400 CK_PHAI_QUA_PAYOS; trừ tài khoản / ví mẹ ngoài phiên (3 kiểu) → 400 VI_PHAI_QUA_PIN', la(j1, 400, 'CK_PHAI_QUA_PAYOS')
      && la(j2, 400, 'VI_PHAI_QUA_PIN') && la(j3, 400, 'VI_PHAI_QUA_PIN') && la(j3b, 400, 'VI_PHAI_QUA_PIN'), [j1, j2, j3, j3b].map(moTa).join(', '));
    k('I7 cờ BẬT (K5): tiền mặt · giao từ gói 0đ · phiên payOS về → vẫn 200, đơn tạo', la(j4, 200) && la(j5, 200) && la(j6, 200)
      && !!(await dongPhien(pj?.id))?.order_id, [j4, j5, j6].map(moTa).join(', '));
    const kl = await taoPhien({});
    k('I (K5) khách lẻ (không SĐT) tạo phiên payOS → 200', la(kl, 200), moTa(kl));
  });

  muc('[J] không lộ khoá payOS');
  {
    const lo = nhatKy.filter((l) => l.includes(KHOA.ck) || l.includes(KHOA.api));
    k(`J1 log máy chủ (${nhatKy.length} dòng) không chứa khoá checksum / api key`, nhatKy.length > 0 && lo.length === 0, lo.slice(0, 2).join(' | '));
  }

  muc('[tĩnh] index.js gắn route phiên + webhook; bảng mới vào sao lưu và KHÔNG khôi phục; bộ kiểm chạy bài này');
  {
    const bo = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const src = bo(fs.readFileSync(path.join(GOC, 'server', 'index.js'), 'utf8'));
    k("index.js: app.use('/api/pos/thanh-toan', require('./routes/thanh-toan'))", src.includes("app.use('/api/pos/thanh-toan', require('./routes/thanh-toan'))"));
    k("index.js: app.use('/api/payos/webhook', require('./routes/thanh-toan').webhook) TRƯỚC express.static",
      src.includes("app.use('/api/payos/webhook', require('./routes/thanh-toan').webhook)") && src.indexOf("'/api/payos/webhook'") < src.indexOf('app.use(express.static('));
    const bk = bo(fs.readFileSync(path.join(GOC, 'server', 'routes', 'backup.js'), 'utf8'));
    const iKhong = bk.indexOf('BANG_KHONG_KHOI_PHUC'), khongKP = bk.slice(iKhong, bk.indexOf('];', iKhong));
    k('backup.js: pos_phien_thanh_toan + pos_payos_su_kien + pos_nhat_ky_pin trong BANG_KHONG_KHOI_PHUC',
      ['pos_phien_thanh_toan', 'pos_payos_su_kien', 'pos_nhat_ky_pin'].every((t) => khongKP.includes(`'${t}'`)));
    // Không cắt chú thích ở đây: bộ kiểm có chuỗi 'server/**' (mở /* giả). Đòi đúng dòng gọi chạy.
    const kt = fs.readFileSync(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'), 'utf8');
    k("kiem_tra_truoc_khi_giao.js chạy 'cong_cu/thu_P3.js'", /^for \(const bai of \[[^\n]*'cong_cu\/thu_P3\.js'\]\) chayBaiThat\(bai\);$/m.test(kt));
  }

  sv.close(); svGia.close();
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
