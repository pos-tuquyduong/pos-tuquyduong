#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ CK-NOIDUNG-1 — nội dung chuyển khoản mang số hoá đơn (TQD<MMM><DD> HD<4 số> / APP<4 số>), giữ số lúc hiện QR, mã giao dịch ngân hàng,
 *  tiền về muộn: quầy xác nhận tay nhận lại số cũ (Q1a) · App tự cộng vào tài khoản khách (Q1b)
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có sổ số hoá đơn, nội dung TQD<mã phiên>, không lưu mã GD). Xanh ngay từ đầu = vô giá trị (K3).
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_CKNOIDUNG1.js
 *
 *  Khuôn thu_SEPAY1.js: database.js + libsql thật trên kho TẠM (ketNoiKho giả, P8), SX tắt; express riêng mount đúng đường như index.js.
 *  Khoá thử sinh ngẫu nhiên; webhook SePay / payOS ký bằng công thức viết riêng trong bài. Giờ giả (qua 00:00, 06:30 giờ VN = 23:30 UTC hôm
 *  trước) bằng cách thay Date toàn cục trong lúc gọi, trả lại ngay sau. Bảng tháng JAN…DEC viết riêng ở đây, không lấy từ máy chủ.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_cknoidung1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_ckn1_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_ckn1_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.ckn1.local/tra-ve';
const SP = { bin: '970000', soTk: '9990001234', khoa: 'sp_' + ngauNhien() };
process.env.SEPAY_BIN = SP.bin; process.env.SEPAY_SO_TK = SP.soTk; process.env.SEPAY_KHOA_WEBHOOK = SP.khoa;
const datCong = (ten) => { process.env.CONG_QR = ten; };

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
const hmacPayos = (s) => crypto.createHmac('sha256', KHOA.ck).update(s).digest('hex');
const kySepay = (than, ts, khoa = SP.khoa) => 'sha256=' + crypto.createHmac('sha256', khoa).update(`${ts}.${than}`).digest('hex');
const tlv = (s) => { const o = {}; let i = 0; while (i + 4 <= s.length) { const n = Number(s.slice(i + 2, i + 4)); o[s.slice(i, i + 2)] = s.slice(i + 4, i + 4 + n); i += 4 + n; } return o; };

// Giờ giả: thay Date toàn cục (getNow / new Date() của máy chủ đọc lúc gọi), trả lại bằng datGio(null).
const DateGoc = Date;
const datGio = (ms) => {
  if (ms == null) { global.Date = DateGoc; return; }
  const lech = ms - DateGoc.now();
  global.Date = class extends DateGoc {
    constructor(...a) { super(...(a.length ? a : [DateGoc.now() + lech])); }
    static now() { return DateGoc.now() + lech; }
  };
};
const THANG = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const ngayVN = (ms) => new DateGoc(ms).toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(0, 10);
const congNgay = (ngay, n) => new DateGoc(DateGoc.parse(ngay + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const mocVN = (ngay, gio) => DateGoc.parse(`${ngay}T${gio}+07:00`);
const so4 = (n) => String(n).padStart(4, '0');
const noiDungMong = (ngay, kenh, so) => `TQD${THANG[Number(ngay.slice(5, 7)) - 1]}${ngay.slice(8, 10)} ${kenh}${so4(so)}`;

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();

  let payosHong = false;
  const gia = express();
  gia.use(express.json());
  gia.post('/v2/payment-requests', (req, res) => {
    if (payosHong) return res.json({ code: '20', desc: 'lỗi giả', data: null });
    const data = { orderCode: req.body.orderCode, amount: req.body.amount, description: req.body.description, status: 'PENDING',
      paymentLinkId: 'pl_' + req.body.orderCode, qrCode: 'QR_GIA_' + req.body.orderCode, checkoutUrl: 'https://gia/' + req.body.orderCode };
    res.json({ code: '00', desc: 'success', data, signature: hmacPayos(chuoiKy(data)) });
  });
  const svGia = await new Promise((ok) => { const s = gia.listen(0, '127.0.0.1', () => ok(s)); });
  process.env.PAYOS_BASE_URL = `http://127.0.0.1:${svGia.address().port}`;

  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use('/api/sepay/webhook', express.raw({ type: '*/*', limit: '100kb' }));
  app.use(express.json());
  app.use('/api/pos/orders', require(R('don-mo-rong.js')));
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/wallets', require(R('wallets.js')));
  app.use('/api/pos/hoa-don', require(R('hoaDon.js')));
  app.use('/api/pos/kh', require(R('kh/quay.js')));
  const tt = require(R('thanh-toan.js'));
  app.use('/api/pos/thanh-toan', tt);
  app.use('/api/payos/webhook', tt.webhook);
  app.use('/api/sepay/webhook', tt.webhookSepay);
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const { kyTokenKhach } = require(path.join(GOC, 'server', 'middleware', 'khachAuth.js'));
  const { chayDoiSoat } = require(path.join(GOC, 'server', 'utils', 'doiSoat.js'));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  // ── Dữ liệu nền ──────────────────────────────────────────────────────────
  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '30d' });
  const nv = Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active, created_at) VALUES ('nv_ckn1', 'x', 'NV', 'staff', 1, ?)", [getNow()])).lastInsertRowid);
  const tkNv = jwt.sign({ userId: nv }, KHOA_NV, { expiresIn: '30d' });
  const datCaiDat = (key, value) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(value), getNow()]);
  for (const [a, b] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['flash_enabled', 'false'], ['signup_enabled', '0'],
    ['thanh_toan_payos_bat_buoc', '0']]) await datCaiDat(a, b);
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 25000, ton_gan_nhat = NULL WHERE id = ?', [sp.id]);
  const mon = (sl = 1) => ({ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: sl });

  const goi = async (method, url, body, tk = tkChu, them = {}) => {
    const headers = { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...them.headers };
    if (tk) headers.Authorization = 'Bearer ' + tk;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: them.tho ?? (body !== undefined ? JSON.stringify(body) : undefined) });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      return { status: r.status, j, tho };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const daNhan = (r) => r.status === 200 && r.tho === '{"success":true}';
  const dem = async (sql, p = []) => Number((await db.queryOne(sql, p).catch(() => null))?.n ?? -1);
  const soDon = () => dem('SELECT COUNT(*) AS n FROM pos_orders');
  const soDu = async (sdt) => Number((await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [sdt]))?.balance || 0);
  const dongPhien = (id) => db.queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [id]).catch(() => null);
  const soCua = (phienId) => db.queryOne('SELECT * FROM pos_so_hoa_don WHERE phien_id = ?', [phienId]).catch(() => null);
  const soDong = () => dem('SELECT COUNT(*) AS n FROM pos_so_hoa_don');
  const suKien = (id) => db.query('SELECT * FROM pos_payos_su_kien WHERE ma_payos = ? ORDER BY id', [id]).catch(() => []);
  const ketQua = async (id) => (await suKien(id)).map((x) => x.ket_qua).join();
  const donCua = async (phienId) => { const p = await dongPhien(phienId); return p?.order_id ? db.queryOne('SELECT * FROM pos_orders WHERE id = ?', [p.order_id]) : null; };
  const luiPhien = (id) => db.run("UPDATE pos_phien_thanh_toan SET het_han = strftime('%Y-%m-%dT%H:%M:%S', ?, '-1 seconds') WHERE id = ?", [getNow(), id]);
  const homNay = () => getNow().slice(0, 10);

  let soSdt = 0;
  const khach = async (napVi = 0) => {
    const sdt = '09' + String(61000000 + (++soSdt)).padStart(8, '0');
    const id = Number((await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + sdt, getNow()])).lastInsertRowid);
    if (napVi) await goi('POST', '/pos/wallets/topup', { phone: sdt, amount: napVi });
    await goi('POST', '/pos/thanh-toan/pin', { phone: sdt, pin: '1357', pin_lai: '1357' });
    return { sdt, id, tk: kyTokenKhach(id) };
  };
  const taoPhien = (o = {}) => goi('POST', '/pos/thanh-toan/phien', {
    don: { items: [mon(o.sl || 1)], ...(o.sdt ? { customer_phone: o.sdt, customer_name: 'K' } : {}) },
    cach: o.cach || 'payos', tru_tai_khoan: !!o.sdt && !o.khongVi, pin: o.sdt ? '1357' : undefined, ...(o.them || {}) });
  let soGd = 810000;
  const bao = (p, them = {}) => ({ id: ++soGd, gateway: 'Vietcombank', transactionDate: getNow().replace('T', ' '), accountNumber: SP.soTk, subAccount: '',
    code: null, content: `${p.noi_dung || ''} chuyen tien`, transferType: 'in', description: 'NGUYEN VAN A chuyen tien',
    transferAmount: p.con_lai, accumulated: 0, referenceCode: 'FT' + soGd, ...them });
  const guiSepay = (b, o = {}) => {
    const tho = JSON.stringify(b), ts = String(Math.floor(DateGoc.now() / 1000));
    return goi('POST', '/sepay/webhook', undefined, null, { headers: { 'Content-Type': 'application/json', 'X-SePay-Timestamp': ts,
      'X-SePay-Signature': o.chuKy ?? kySepay(tho, ts) }, tho });
  };
  let soRef = 0;
  const guiPayos = (p, them = {}) => {
    const data = { orderCode: p.id, amount: p.con_lai, description: p.noi_dung, accountNumber: '12345678', reference: 'REF' + (++soRef),
      transactionDateTime: getNow().replace('T', ' '), currency: 'VND', paymentLinkId: 'pl_' + p.id, code: '00', desc: 'success', ...them };
    return goi('POST', '/payos/webhook', { code: '00', desc: 'success', success: true, data, signature: hmacPayos(chuoiKy(data)) }, null);
  };
  const gio = { mon: [{ ma: `${sp.sx_product_type}_${sp.sx_product_id}`, so_luong: 1 }], cach_nhan: 'tai_quan' };
  let soKhoa = 0;
  const datApp = async (kh, them = { cach_tra: 'qr' }) => {
    const tong = (await goi('POST', '/kh/gio/bao-gia', gio, kh.tk)).j.tong;
    return goi('POST', '/kh/don', { ...gio, khoa_gui: `khoa-ckn1-${++soKhoa}-${ngauNhien().slice(0, 8)}`, tong_da_xem: tong, ...them }, kh.tk);
  };
  const phienApp = async (ma) => { const d = await db.queryOne('SELECT phien_id FROM pos_don_app WHERE ma = ?', [ma]).catch(() => null); return d ? dongPhien(d.phien_id) : null; };
  const donTienMat = () => goi('POST', '/pos/orders', { items: [mon(1)], payment_method: 'cash', cash_amount: 25000, cash_received: 25000, change_amount: 0 });
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); datGio(null); k(`${ten}: bài chạy hết mục`, false, e.message); } };
  const soCuaMa = (code) => { const m = /-(HD|APP)(\d{4})$/.exec(String(code || '')); return m ? Number(m[2]) : null; };

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] giữ số hoá đơn lúc hiện QR — dãy chung quầy + App, đếm lại mỗi ngày giờ VN');
  const vA = {};
  await chay('A', async () => {
    datCong('sepay');
    const r1 = await taoPhien();
    const p1 = r1.j.phien || {}, s1 = await soCua(p1.id), n1 = Number(s1?.so);
    const f62 = tlv(tlv(String(p1.qr || ''))['62'] || '')['08'];
    k('A1 phiên QR quầy giữ số ngay lúc tạo: sổ có dòng (ngày hôm nay giờ VN, kênh HD), nội dung = TQD<MMM><DD> HD<4 số> (cả 62.08 VietQR)',
      la(r1, 200) && s1?.kenh === 'HD' && s1?.ngay === homNay() && n1 >= 1 && p1.noi_dung === noiDungMong(homNay(), 'HD', n1) && f62 === p1.noi_dung,
      moTa(r1) + ' ' + JSON.stringify({ s1, nd: p1.noi_dung, f62 }));
    vA.p1 = p1; vA.n1 = n1;
    const kh = await khach(0);
    const r2 = await datApp(kh);
    const p2 = await phienApp(r2.j.ma_don) || {}, s2 = await soCua(p2.id);
    k('A2 phiên App giữ số kế tiếp CÙNG dãy (kênh APP), nội dung TQD<MMM><DD> APP<4 số>', la(r2, 200) && s2?.kenh === 'APP' && Number(s2?.so) === n1 + 1
      && p2.noi_dung === noiDungMong(homNay(), 'APP', n1 + 1), JSON.stringify({ s2, nd: p2.noi_dung }));
    vA.app = { kh, ma: r2.j.ma_don, p: p2 };
    const [r3a, r3b] = await Promise.all([taoPhien(), taoPhien()]);
    const sa = await soCua(r3a.j.phien?.id), sb = await soCua(r3b.j.phien?.id);
    k('A3 hai phiên tạo cùng lúc (Promise.all) → hai số khác nhau, liền nhau', la(r3a, 200) && la(r3b, 200) && !!sa && !!sb
      && Math.abs(Number(sa.so) - Number(sb.so)) === 1 && Math.min(sa.so, sb.so) === n1 + 2, JSON.stringify({ sa: sa?.so, sb: sb?.so }));
    const r4 = await donTienMat();
    const ma4 = r4.j.order?.code || r4.j.code || '';
    const pSau = await taoPhien(), sSau = await soCua(pSau.j.phien?.id);
    k('A4 đơn tiền mặt tạo giữa các phiên → lấy số SAU số đã giữ (không lấy lại), phiên sau đó lấy số kế tiếp', la(r4, 200)
      && soCuaMa(ma4) === n1 + 4 && Number(sSau?.so) === n1 + 5 && new RegExp(`^ORD-${homNay().replace(/-/g, '')}-HD${so4(n1 + 4)}$`).test(ma4),
      `${moTa(r4)} ${ma4} · phiên sau ${sSau?.so}`);
    const r8 = await taoPhien({ them: { kenh: 'APP' } });
    const s8 = await soCua(r8.j.phien?.id);
    k('A8 quầy gửi kenh: "APP" trong thân yêu cầu → vẫn kênh HD (kênh App chỉ do máy chủ đặt)', la(r8, 200) && s8?.kenh === 'HD'
      && / HD\d{4}$/.test(r8.j.phien?.noi_dung || ''), JSON.stringify({ s8, nd: r8.j.phien?.noi_dung }));
    // A6: phiên huỷ TRONG giao dịch (tài khoản trả đủ mà chọn QR → CACH_KHONG_KHOP) không tiêu số
    const kv = await khach(50000);
    const truoc = await soDong();
    const r6 = await taoPhien({ sdt: kv.sdt });
    k('A6 phiên bị từ chối trong giao dịch (400 CACH_KHONG_KHOP) không tiêu số — sổ không thêm dòng', la(r6, 400, 'CACH_KHONG_KHOP') && truoc >= 0
      && await soDong() === truoc, `${moTa(r6)} · ${truoc} → ${await soDong()}`);
    // A5: qua 00:00 giờ VN → số đếm lại từ 0001
    const mai = congNgay(homNay(), 1);
    datGio(mocVN(mai, '00:00:30'));
    const r5 = await taoPhien();
    datGio(null);
    const s5 = await soCua(r5.j.phien?.id);
    k('A5 phiên tạo lúc 00:00:30 ngày mai (giờ VN) → số 0001 của ngày mai', la(r5, 200) && s5?.ngay === mai && Number(s5?.so) === 1
      && r5.j.phien?.noi_dung === noiDungMong(mai, 'HD', 1), moTa(r5) + ' ' + JSON.stringify({ s5, nd: r5.j.phien?.noi_dung }));
    // A7: số thứ 10000 trong ngày → không cắt, không tạo phiên
    const ngay7 = congNgay(homNay(), 3);
    await db.run('INSERT INTO pos_so_hoa_don (ngay, so, kenh, luc) VALUES (?, 9999, ?, ?)', [ngay7, 'HD', getNow()]).catch(() => null);
    const phTruoc = await dem('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan');
    datGio(mocVN(ngay7, '10:00:00'));
    const r7 = await taoPhien();
    datGio(null);
    k('A7 ngày đã dùng tới 9999 → tạo phiên QR hỏng (5xx), không có số 10000, không có phiên mới', r7.status >= 500
      && await dem('SELECT COUNT(*) AS n FROM pos_so_hoa_don WHERE so > 9999') === 0 && await dem('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan') === phTruoc,
      moTa(r7));
  });

  muc('[B] nội dung CK + webhook SePay khớp đúng phiên theo nội dung mới');
  await chay('B', async () => {
    datCong('sepay');
    for (const [ten, bien] of [['chữ thường, bỏ dấu cách', (nd) => nd.toLowerCase().replace(/ /g, '')],
      ['chấm / gạch giữa các phần', (nd) => nd.replace('TQD', 'TQD.').replace(/(\d{2}) /, '$1-').replace(/([A-Z]{3})(\d{2})/, '$1.$2')],
      ['thêm chữ trước sau', (nd) => `CK abc ${nd} xyz`]]) {
      const p = (await taoPhien()).j.phien || {};
      const dk = await soDon();
      const w = await guiSepay(bao(p, { content: bien(p.noi_dung || ''), code: null }));
      const o = await donCua(p.id);
      k(`B3 nội dung bị ngân hàng đổi dạng (${ten}: "${bien(p.noi_dung || '')}") → khớp ĐÚNG phiên, một đơn`, daNhan(w) && await soDon() === dk + 1
        && !!o && await ketQua(p.id) === 'khop', moTa(w) + ' · ' + await ketQua(p.id));
    }
    const p4 = (await taoPhien()).j.phien || {};
    const dk4 = await soDon();
    const w4 = await guiSepay(bao(p4, { content: `${p4.noi_dung}1 chuyen tien` }));
    k('B4 nội dung dính thêm chữ số (…HD00xx1) → KHÔNG khớp phiên nào, không tạo đơn', daNhan(w4) && await soDon() === dk4
      && !(await dongPhien(p4.id))?.order_id, moTa(w4));
    const p5 = (await taoPhien()).j.phien || {};
    const w5a = await guiSepay(bao(p5, { transferAmount: p5.con_lai - 1000 }));
    const w5b = await guiSepay(bao(p5), { chuKy: 'sha256=' + '0'.repeat(64) });
    const w5c = await guiSepay(bao(p5, { accountNumber: '9990009999' }));
    k('B5 luật cũ giữ nguyên: lệch tiền → chua_khop; sai chữ ký → 401; tài khoản khác → chua_khop; không đơn', daNhan(w5a) && la(w5b, 401)
      && daNhan(w5c) && await ketQua(p5.id) === 'chua_khop,chua_khop' && !(await dongPhien(p5.id))?.order_id, await ketQua(p5.id));
    const b5 = bao(p5);
    await guiSepay(b5);
    const dk5 = await soDon();
    const w5d = await guiSepay(b5);
    k('B5 báo lặp cùng giao dịch sau khi đã khớp → không đơn thứ hai', daNhan(w5d) && await soDon() === dk5 && !!(await dongPhien(p5.id))?.order_id);
    const p7 = (await taoPhien()).j.phien || {};
    const w7 = await guiSepay(bao(p7, { content: `TQD${p7.id} chuyen tien` }));
    k('B7 khách gõ mẫu cũ TQD<mã phiên> (phiên tạo trước lúc triển khai) → vẫn khớp', daNhan(w7) && await ketQua(p7.id) === 'khop' && !!(await donCua(p7.id)));
    // B6: payOS (dự phòng) — nội dung giữ TQD<mã phiên> ≤ 9 ký tự, phiên VẪN giữ số hoá đơn
    datCong('payos');
    const r6 = await taoPhien();
    const p6 = r6.j.phien || {}, s6 = await soCua(p6.id);
    k('B6 CONG_QR=payos: nội dung = TQD<mã phiên> (≤ 9 ký tự), phiên vẫn giữ số HD', la(r6, 200) && p6.noi_dung === 'TQD' + p6.id
      && p6.noi_dung.length <= 9 && s6?.kenh === 'HD', moTa(r6) + ' ' + JSON.stringify({ nd: p6.noi_dung, s6 }));
    const w6 = await guiPayos(p6);
    const o6 = await donCua(p6.id);
    k('B6 tiền payOS về → đơn mang đúng số đã giữ', la(w6, 200) && soCuaMa(o6?.code) === Number(s6?.so), o6?.code);
    datCong('sepay');
    // B8: 06:30 giờ VN = 23:30 UTC hôm trước → nội dung mang NGÀY VN
    const ngay8 = congNgay(homNay(), 2);
    datGio(mocVN(ngay8, '06:30:00'));
    const r8 = await taoPhien();
    datGio(null);
    k(`B8 phiên tạo 06:30 giờ VN ngày ${ngay8} (UTC còn hôm trước) → nội dung mang ngày VN`, la(r8, 200)
      && String(r8.j.phien?.noi_dung || '').startsWith(noiDungMong(ngay8, 'HD', 1).slice(0, 8)) && ngayVN(mocVN(ngay8, '06:30:00')) === ngay8,
      r8.j.phien?.noi_dung);
    const w9 = await guiSepay(bao({ noi_dung: 'TQDJAN01 HD0099', con_lai: 25000 }));
    const sk9 = await db.queryOne('SELECT * FROM pos_payos_su_kien WHERE khoa = ?', [`sepay:${soGd}`]).catch(() => null);
    const ds9 = await chayDoiSoat({ kieu: 'ngay' });
    k('B9 nội dung đúng dạng mà không thuộc phiên nào → khong_phien, lý do + Đối soát ghi chuỗi khách gõ "TQDJAN01 HD0099"', daNhan(w9)
      && sk9?.ket_qua === 'khong_phien' && String(sk9?.ly_do).includes('TQDJAN01 HD0099')
      && ds9.can_xem.some((l) => l.bat_bien === 'CK' && l.mo_ta.includes('TQDJAN01 HD0099')), JSON.stringify(sk9?.ly_do));
  });

  muc('[C·D] tiền về → đơn mang đúng số đã giữ; mã giao dịch ngân hàng lưu vào đơn, in bill, chi tiết đơn');
  const vC = {};
  await chay('C', async () => {
    datCong('sepay');
    const p = (await taoPhien()).j.phien || {}, s = await soCua(p.id);
    const w = await guiSepay(bao(p, { referenceCode: 'FT26309ABCDE' }));
    const o = await donCua(p.id);
    const soHd = 'HD' + so4(Number(s?.so));
    k('C1 tiền SePay về → mã đơn ORD-<ngày của số>-HD<số đã giữ>', daNhan(w) && o?.code === `ORD-${String(s?.ngay).replace(/-/g, '')}-${soHd}`, o?.code);
    k('D1 referenceCode SePay → pos_orders.ma_gd', o?.ma_gd === 'FT26309ABCDE', String(o?.ma_gd));
    const hd = await goi('GET', `/pos/hoa-don/${o?.id}`);
    k('C1 hoá đơn (routes/hoaDon.js) so_bill = HD<số> (đúng chuỗi in to)', hd.j.hoa_don?.don?.so_bill === soHd, hd.j.hoa_don?.don?.so_bill);
    k('D5 dữ liệu hoá đơn có don.ma_gd', hd.j.hoa_don?.don?.ma_gd === 'FT26309ABCDE', JSON.stringify(hd.j.hoa_don?.don || null).slice(0, 160));
    let to = null;
    try { to = (await import(pathToFileURL(path.join(GOC, 'client', 'src', 'utils', 'hoaDon.js')).href)).dungHoaDon(hd.j.hoa_don, {}, { lien: 'khach' }); } catch { /* chưa dựng được */ }
    const dongGd = (to?.thanh_toan || []).find((d) => d.khoa === 'ma_gd');
    k('D5 bill quầy (client/src/utils/hoaDon.js) có dòng "Mã GD" FT26309ABCDE', dongGd?.ten === 'Mã GD' && dongGd?.tien === 'FT26309ABCDE', JSON.stringify(dongGd || null));
    const ct = await goi('GET', `/pos/orders/${o?.id}`);
    k('D3 GET /orders/:id (chi tiết đơn) có ma_gd', ct.j.ma_gd === 'FT26309ABCDE', String(ct.j.ma_gd));
    await db.run("UPDATE pos_orders SET payment_method = 'cho_thu', payment_status = 'pending' WHERE id = ?", [o?.id]);
    const ctt = await goi('GET', '/pos/orders/cho-thu');
    await db.run("UPDATE pos_orders SET payment_method = 'transfer', payment_status = 'paid' WHERE id = ?", [o?.id]);
    const dCt = (ctt.j.data || ctt.j.don || []).find?.((x) => x.id === o?.id) || (Array.isArray(ctt.j) ? ctt.j.find((x) => x.id === o?.id) : null);
    k('C1 số bill của don-mo-rong (/orders/cho-thu) = HD<số>', dCt?.so_bill === soHd, JSON.stringify(dCt || ctt.j).slice(0, 160));
    vC.o = o; vC.soHd = soHd;
    // D2: payOS reference
    datCong('payos');
    const pp = (await taoPhien()).j.phien || {};
    await guiPayos(pp, { reference: 'FT26309PAYOS' });
    k('D2 payOS reference → pos_orders.ma_gd', (await donCua(pp.id))?.ma_gd === 'FT26309PAYOS');
    datCong('sepay');
    // C5: đơn App QR qua webhook → APP<số>
    const kh = await khach(0);
    const ra = await datApp(kh);
    const pa = await phienApp(ra.j.ma_don) || {}, sa = await soCua(pa.id);
    await guiSepay(bao(pa, { referenceCode: 'FT26309APPAA' }));
    const oa = await donCua(pa.id);
    const soApp = 'APP' + so4(Number(sa?.so));
    const hda = await goi('GET', `/pos/hoa-don/${oa?.id}`);
    k('C5 đơn App trả QR qua webhook → mã ORD-<ngày>-APP<số>, hoá đơn so_bill APP<số>', !!oa && oa.code.endsWith('-' + soApp)
      && hda.j.hoa_don?.don?.so_bill === soApp, `${oa?.code} · ${hda.j.hoa_don?.don?.so_bill}`);
    k('BỎ mã App ngẫu nhiên khỏi ghi chú đơn (in trên bill / phiếu): ghi chú không chứa mã A…, vẫn "Đơn App"', !!oa
      && !String(oa.notes || '').includes(ra.j.ma_don) && /Đơn App/.test(String(oa.notes || '')), String(oa?.notes));
    const cA = await goi('GET', `/kh/don/${ra.j.ma_don}`, undefined, kh.tk);
    k('D5 hoá đơn App (GET /kh/don/:ma hoa_don) có dòng "Mã GD"', (cA.j.don?.hoa_don || []).some((d) => d.loai === 'ma_gd' && d.phai === 'FT26309APPAA'),
      JSON.stringify((cA.j.don?.hoa_don || []).filter((d) => /ma_gd|ck/.test(d.loai))));
    vC.app = { kh, ma: ra.j.ma_don, soApp };
  });

  muc('[C4] Q1a — phiên QUẦY tiền về muộn: xác nhận tay sau khi QR hết hạn / đã huỷ → đơn nhận lại đúng số đã giữ');
  await chay('C4', async () => {
    datCong('sepay');
    const a = await khach(30000);
    const p = (await taoPhien({ sdt: a.sdt, sl: 2 })).j.phien || {}, s = await soCua(p.id);
    await luiPhien(p.id);
    const w = await guiSepay(bao(p));   // tiền về SAU hết hạn → chua_khop (ĐỎ), phiên quầy KHÔNG cộng ví
    k('G7 phiên QUẦY hết hạn, tiền về → chua_khop như cũ, KHÔNG cộng ví, không đơn', daNhan(w) && await ketQua(p.id) === 'chua_khop'
      && await soDu(a.sdt) === 30000 && !(await dongPhien(p.id))?.order_id, `${await ketQua(p.id)} · ví ${await soDu(a.sdt)}`);
    const ph = (await taoPhien()).j.phien || {};
    await goi('POST', `/pos/thanh-toan/phien/${ph.id}/huy`, {});
    const dkh = await soDon();
    const wh = await guiSepay(bao(ph));
    k('G7b phiên QUẦY đã huỷ, tiền về TRONG hạn → không tự tạo đơn (chốt muộn chỉ qua xác nhận tay), chua_khop', daNhan(wh) && await soDon() === dkh
      && await ketQua(ph.id) === 'chua_khop' && !(await dongPhien(ph.id))?.order_id, `${await ketQua(ph.id)} · đơn ${dkh} → ${await soDon()}`);
    const ds0 = await chayDoiSoat({ kieu: 'ngay' });
    const dong0 = ds0.do.find((l) => l.bat_bien === 'CK' && l.xac_nhan_tay === p.id);
    k('C4h Đối soát: dòng tiền về muộn của phiên quầy ở ĐỎ, có nút xác nhận tay (xac_nhan_tay = mã phiên)', !!dong0, ds0.do.filter((l) => l.bat_bien === 'CK').map((l) => l.mo_ta).join(' | ').slice(0, 200));
    const rNv = await goi('POST', `/pos/thanh-toan/phien/${p.id}/xac-nhan-tay`, { ly_do: 'đã thấy sao kê' }, tkNv);
    k('C4f nhân viên không có quyền xac_nhan_ck_tay → 403', rNv.status === 403, moTa(rNv));
    const rLd = await goi('POST', `/pos/thanh-toan/phien/${p.id}/xac-nhan-tay`, { ly_do: 'ab' });
    k('C4 thiếu lý do → 400 CAN_LY_DO', la(rLd, 400, 'CAN_LY_DO'), moTa(rLd));
    const [x1, x2] = await Promise.all([goi('POST', `/pos/thanh-toan/phien/${p.id}/xac-nhan-tay`, { ly_do: 'đã thấy sao kê' }),
      goi('POST', `/pos/thanh-toan/phien/${p.id}/xac-nhan-tay`, { ly_do: 'đã thấy sao kê 2' })]);
    const o = await donCua(p.id);
    k('C4 + C4g hai người cùng xác nhận tay phiên QUẦY đã hết hạn → đúng một 200 + một 409, MỘT đơn', [x1.status, x2.status].sort().join() === '200,409'
      && await dem('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan WHERE id = ? AND order_id IS NOT NULL', [p.id]) === 1, `${moTa(x1)} / ${moTa(x2)}`);
    k('C4 đơn nhận LẠI đúng số đã giữ (HD<số>), ví trừ lại đúng phần giữ 30.000 trong cùng giao dịch', !!o && soCuaMa(o.code) === Number(s?.so)
      && o.code.includes('-HD') && await soDu(a.sdt) === 0 && o.balance_amount === 30000, `${o?.code} · ví ${await soDu(a.sdt)}`);
    const ds1 = await chayDoiSoat({ kieu: 'ngay' });
    k('C4h Đối soát sau xác nhận tay: báo tiền về muộn của phiên đó chuyển sang CẦN XEM (không còn ở ĐỎ)', !ds1.do.some((l) => l.bat_bien === 'CK' && l.mo_ta.includes(`mã ${p.id}:`))
      && ds1.can_xem.some((l) => l.bat_bien === 'CK' && l.mo_ta.includes(`mã ${p.id}:`)), ds1.do.filter((l) => l.bat_bien === 'CK').map((l) => l.mo_ta).join(' | ').slice(0, 200));
    // C4b: ví đã tiêu mất phần giữ → SO_DU_KHONG_DU, không đơn, phiên vẫn chốt lại được sau khi nạp
    const b = await khach(30000);
    const pb = (await taoPhien({ sdt: b.sdt, sl: 2 })).j.phien || {};
    await luiPhien(pb.id);
    const tieu = (await taoPhien({ sdt: b.sdt, cach: 'tai_khoan', sl: 1 })).j.phien || {};
    await goi('POST', `/pos/thanh-toan/phien/${tieu.id}/chot`, {});
    const dk = await soDon();
    const rb = await goi('POST', `/pos/thanh-toan/phien/${pb.id}/xac-nhan-tay`, { ly_do: 'tiền về muộn' });
    k('C4b ví đã tiêu (còn 5.000 < 30.000 giữ cũ) → 400 SO_DU_KHONG_DU, không tạo đơn, ví không đổi', la(rb, 400, 'SO_DU_KHONG_DU') && await soDon() === dk
      && await soDu(b.sdt) === 5000, `${moTa(rb)} · ví ${await soDu(b.sdt)}`);
    await goi('POST', '/pos/wallets/topup', { phone: b.sdt, amount: 25000 });
    const rb2 = await goi('POST', `/pos/thanh-toan/phien/${pb.id}/xac-nhan-tay`, { ly_do: 'tiền về muộn' });
    k('C4b khách nạp đủ → xác nhận tay lại được (phiên không bị khoá thành lỗi), đơn mang số đã giữ', la(rb2, 200)
      && soCuaMa((await donCua(pb.id))?.code) === Number((await soCua(pb.id))?.so), moTa(rb2));
    // C4c: giá đổi → không tạo đơn
    const pc = (await taoPhien()).j.phien || {};
    await luiPhien(pc.id);
    await db.run('UPDATE pos_products SET price = 26000 WHERE id = ?', [sp.id]);
    const dkc = await soDon();
    const rc = await goi('POST', `/pos/thanh-toan/phien/${pc.id}/xac-nhan-tay`, { ly_do: 'tiền về muộn' });
    await db.run('UPDATE pos_products SET price = 25000 WHERE id = ?', [sp.id]);
    k('C4c giá đã đổi từ lúc tạo phiên → 4xx, KHÔNG tạo đơn', rc.status >= 400 && rc.status < 500 && await soDon() === dkc, moTa(rc));
    // C4d: phiên đã huỷ
    const pd = (await taoPhien()).j.phien || {};
    await goi('POST', `/pos/thanh-toan/phien/${pd.id}/huy`, {});
    const rd = await goi('POST', `/pos/thanh-toan/phien/${pd.id}/xac-nhan-tay`, { ly_do: 'khách đã chuyển' });
    k('C4d phiên QUẦY đã huỷ, tiền về → xác nhận tay → 200, đơn mang số đã giữ', la(rd, 200) && soCuaMa((await donCua(pd.id))?.code) === Number((await soCua(pd.id))?.so), moTa(rd));
    // C4e: phiên App hết hạn → không tạo lại đơn
    const kh = await khach(0);
    const ra = await datApp(kh);
    const pa = await phienApp(ra.j.ma_don) || {};
    await luiPhien(pa.id);
    const re = await goi('POST', `/pos/thanh-toan/phien/${pa.id}/xac-nhan-tay`, { ly_do: 'khách đã chuyển' });
    k('C4e phiên của đơn App đã hết hạn → 409 PHIEN_APP_KHONG_TAO_LAI, không đơn', la(re, 409, 'PHIEN_APP_KHONG_TAO_LAI') && !(await dongPhien(pa.id))?.order_id, moTa(re));
    // K5: xác nhận tay trong hạn vẫn như cũ
    const pk = (await taoPhien()).j.phien || {};
    const rk = await goi('POST', `/pos/thanh-toan/phien/${pk.id}/xac-nhan-tay`, { ly_do: 'đã thấy sao kê' });
    k('K5 xác nhận tay phiên QUẦY còn hạn → 200 như cũ', la(rk, 200) && !!(await donCua(pk.id)), moTa(rk));
  });

  muc('[G] Q1b — phiên APP tiền về muộn → tự cộng vào tài khoản khách, một lần mỗi báo tiền');
  await chay('G', async () => {
    datCong('sepay');
    const kh = await khach(0);
    const r1 = await datApp(kh);
    await goi('POST', `/kh/don/${r1.j.ma_don}/huy`, {}, kh.tk);
    const p1 = await phienApp(r1.j.ma_don) || {}, s1 = await soCua(p1.id);
    const b1 = bao(p1, { referenceCode: 'FT26309MUON1' });
    const dk = await soDon();
    const w1 = await guiSepay(b1);
    const c1 = await goi('GET', `/kh/don/${r1.j.ma_don}`, undefined, kh.tk);
    const vi1 = await db.queryOne("SELECT * FROM pos_balance_transactions WHERE customer_phone = ? ORDER BY id DESC LIMIT 1", [kh.sdt]).catch(() => null);
    k('G1 đơn App đã huỷ, tiền SePay về → ví khách +25.000 (số thật đã về), dòng báo vao_vi, KHÔNG tạo đơn', daNhan(w1) && await soDu(kh.sdt) === 25000
      && await ketQua(p1.id) === 'vao_vi' && await soDon() === dk && !(await dongPhien(p1.id))?.order_id, `${await ketQua(p1.id)} · ví ${await soDu(kh.sdt)}`);
    k('G1 dòng ví: nạp chuyển khoản, ghi "tiền về muộn" + số APP<số> + mã GD', vi1?.type === 'topup' && vi1?.payment_method === 'transfer'
      && /tiền về muộn/i.test(vi1?.notes || '') && String(vi1?.notes).includes('APP' + so4(Number(s1?.so))) && String(vi1?.notes).includes('FT26309MUON1'), JSON.stringify(vi1?.notes));
    k('G1 App thấy đơn da_huy + tien_ve_cho_doi_soat + tien_ve_da_cong_vi = 25000', c1.j.don?.tien_trinh === 'da_huy' && c1.j.don?.tien_ve_cho_doi_soat === true
      && c1.j.don?.tien_ve_da_cong_vi === 25000, JSON.stringify(c1.j.don || null).slice(0, 220));
    const ds1 = await goi('GET', '/kh/don', undefined, kh.tk);
    k('G1 GET /don (danh sách) cũng có tien_ve_da_cong_vi', (ds1.j.data || []).some((d) => d.ma === r1.j.ma_don && d.tien_ve_da_cong_vi === 25000));
    const w2 = await guiSepay(b1);
    k('G2 báo lặp CÙNG giao dịch → không cộng lần hai (ví vẫn 25.000, một dòng báo)', daNhan(w2) && await soDu(kh.sdt) === 25000 && (await suKien(p1.id)).length === 1,
      `ví ${await soDu(kh.sdt)} · ${await ketQua(p1.id)}`);
    const r3 = await datApp(kh);
    await goi('POST', `/kh/don/${r3.j.ma_don}/huy`, {}, kh.tk);
    const p3 = await phienApp(r3.j.ma_don) || {};
    const b3 = bao(p3);
    const [w3a, w3b] = await Promise.all([guiSepay(b3), guiSepay(b3)]);
    k('G3 hai báo CÙNG giao dịch tới cùng lúc → cộng đúng một lần', daNhan(w3a) && daNhan(w3b) && await soDu(kh.sdt) === 50000 && (await suKien(p3.id)).length === 1,
      `ví ${await soDu(kh.sdt)}`);
    const r4 = await datApp(kh);
    const p4 = await phienApp(r4.j.ma_don) || {};
    await luiPhien(p4.id);
    await guiSepay(bao(p4, { transferAmount: 20000 }));
    k('G4 đơn App hết hạn (không huỷ), tiền về (lệch: 20.000) → cộng đúng số THẬT đã về', await soDu(kh.sdt) === 70000 && await ketQua(p4.id) === 'vao_vi', `ví ${await soDu(kh.sdt)}`);
    const r5 = await datApp(kh);
    await goi('POST', `/kh/don/${r5.j.ma_don}/huy`, {}, kh.tk);
    const p5 = await phienApp(r5.j.ma_don) || {};
    const w5 = await guiSepay(bao(p5, { accountNumber: '9990009999' }));
    const w6 = await guiSepay(bao(p5), { chuKy: 'sha256=' + '1'.repeat(64) });
    k('G5 tiền vào tài khoản KHÁC → chua_khop, KHÔNG cộng; G6 sai chữ ký → 401, KHÔNG cộng', daNhan(w5) && la(w6, 401) && await ketQua(p5.id) === 'chua_khop'
      && await soDu(kh.sdt) === 70000, `${await ketQua(p5.id)} · ví ${await soDu(kh.sdt)}`);
    const r11 = await datApp(kh);
    const p11 = await phienApp(r11.j.ma_don) || {};
    await db.run("UPDATE pos_phien_thanh_toan SET trang_thai = 'loi', ly_do = 'HET_HANG' WHERE id = ?", [p11.id]);
    await guiSepay(bao(p11));
    k('G11 phiên App "loi" từ trước (chốt hỏng vì đơn) tiền về → CŨNG cộng vào ví (chủ quán 05.11 lượt 2), dòng vao_vi', await ketQua(p11.id) === 'vao_vi'
      && await soDu(kh.sdt) === 95000, `${await ketQua(p11.id)} · ví ${await soDu(kh.sdt)}`);
    const c11 = await goi('GET', `/kh/don/${r11.j.ma_don}`, undefined, kh.tk);
    k('L12 App: phiên loi "HET_HANG" → thong_bao_tien_ve đúng nguyên câu', c11.j.don?.thong_bao_tien_ve
      === 'Không tạo được đơn vì món đã hết hàng — đã cộng 25.000đ vào tài khoản của bạn', JSON.stringify(c11.j.don?.thong_bao_tien_ve));
    k('L12 App: đơn huỷ rồi tiền về (G1) → "Tiền về sau khi đơn đã huỷ / hết hạn — đã cộng 25.000đ vào tài khoản của bạn"; đơn không tiền về → null',
      c1.j.don?.thong_bao_tien_ve === 'Tiền về sau khi đơn đã huỷ / hết hạn — đã cộng 25.000đ vào tài khoản của bạn'
      && (await goi('GET', '/kh/don', undefined, kh.tk)).j.data?.some((d) => d.ma === r5.j.ma_don && d.thong_bao_tien_ve === null),
    JSON.stringify(c1.j.don?.thong_bao_tien_ve));
    const ds = await chayDoiSoat({ kieu: 'ngay' });
    k('G8 Đối soát: "tiền về muộn — đã cộng vào tài khoản" ở CẦN XEM, không ở ĐỎ', ds.can_xem.some((l) => l.bat_bien === 'CK' && /tiền về muộn — đã cộng vào tài khoản/.test(l.mo_ta))
      && !ds.do.some((l) => /đã cộng vào tài khoản/.test(l.mo_ta)), ds.do.filter((l) => l.bat_bien === 'CK').map((l) => l.mo_ta).join(' | ').slice(0, 200));
    k('G8 sổ ví khớp (I4, I18 không có dòng của khách này)', ![...ds.do, ...ds.can_xem].some((l) => ['I4', 'I18'].includes(l.bat_bien) && l.mo_ta.includes(kh.sdt)));
    datCong('payos');
    const kp = await khach(0);
    const r9 = await datApp(kp);
    await goi('POST', `/kh/don/${r9.j.ma_don}/huy`, {}, kp.tk);
    const p9 = await phienApp(r9.j.ma_don) || {};
    const w9 = await guiPayos(p9);
    k('G9 payOS báo tiền về muộn cho đơn App đã huỷ → cũng cộng (cùng một hàm)', la(w9, 200) && await soDu(kp.sdt) === 25000 && await ketQua(p9.id) === 'vao_vi', `ví ${await soDu(kp.sdt)}`);
    datCong('sepay');
    // Soát vòng 1: CÙNG một khoản báo qua CẢ HAI cổng (payOS đã cộng, SePay đọc mẫu cũ TQD<mã phiên>) → không cộng lần hai.
    const w9b = await guiSepay(bao(p9));
    const sk9 = await suKien(p9.id);
    k('G9b CÙNG khoản báo qua hai cổng (payOS rồi SePay), đơn App đã huỷ → ví cộng đúng MỘT lần; dòng SePay chua_khop "hai cổng" (CẦN XEM)', daNhan(w9b)
      && await soDu(kp.sdt) === 25000 && sk9.map((x) => x.ket_qua).join() === 'vao_vi,chua_khop' && String(sk9[1]?.ly_do).includes('cùng một khoản báo qua hai cổng'),
    `ví ${await soDu(kp.sdt)} · ${sk9.map((x) => `${x.ket_qua}:${x.ly_do}`).join(' | ').slice(0, 220)}`);
    const w9c = await guiSepay(bao(p9));
    k('G9c khoản THỨ HAI thật (SePay báo thêm một giao dịch khác) → cộng thêm đúng một lần', daNhan(w9c) && await soDu(kp.sdt) === 50000
      && await ketQua(p9.id) === 'vao_vi,chua_khop,vao_vi', `ví ${await soDu(kp.sdt)} · ${await ketQua(p9.id)}`);
    const ds9 = await chayDoiSoat({ kieu: 'ngay' });
    k('G9b Đối soát: dòng "hai cổng" của phiên App ở CẦN XEM, không ĐỎ', ds9.can_xem.some((l) => l.bat_bien === 'CK' && l.mo_ta.includes(`mã ${p9.id}:`)
      && l.mo_ta.includes('hai cổng')) && !ds9.do.some((l) => l.bat_bien === 'CK' && l.mo_ta.includes(`mã ${p9.id}:`)),
    ds9.do.filter((l) => l.mo_ta.includes(`mã ${p9.id}:`)).map((l) => l.mo_ta).join(' | ').slice(0, 200));
  });

  muc('[L] phiên APP lỗi vì đơn (món ngừng bán lúc tiền về ĐÚNG hạn) → tiền thật đã về cộng vào ví, báo rõ App · quầy · Đối soát');
  await chay('L', async () => {
    datCong('sepay');
    const ngungBan = (tat) => db.run('UPDATE pos_products SET is_active = ? WHERE id = ?', [tat ? 0 : 1, sp.id]);
    const kh = await khach(0);
    const r1 = await datApp(kh);
    const p1 = await phienApp(r1.j.ma_don) || {}, s1 = await soCua(p1.id);
    const soHd1 = 'APP' + so4(Number(s1?.so));
    const b1 = bao(p1, { referenceCode: 'FT26309LOI01' });
    const dk = await soDon();
    await ngungBan(true);
    const w1 = await guiSepay(b1);
    await ngungBan(false);
    k('L1 App QR đúng hạn, món ngừng bán, tiền về đúng số → phiên loi, KHÔNG đơn, ví +25.000, một dòng báo vao_vi', daNhan(w1) && (await dongPhien(p1.id))?.trang_thai === 'loi'
      && await soDon() === dk && await soDu(kh.sdt) === 25000 && await ketQua(p1.id) === 'vao_vi', `${await ketQua(p1.id)} · ví ${await soDu(kh.sdt)} · ${(await dongPhien(p1.id))?.trang_thai}`);
    const vi1 = await db.queryOne('SELECT * FROM pos_balance_transactions WHERE customer_phone = ? ORDER BY id DESC LIMIT 1', [kh.sdt]).catch(() => null);
    k('L2 dòng ví: nạp chuyển khoản, ghi "Không tạo được đơn" + APP<số> + mã GD', vi1?.type === 'topup' && vi1?.payment_method === 'transfer'
      && /Không tạo được đơn/.test(vi1?.notes || '') && String(vi1?.notes).includes(soHd1) && String(vi1?.notes).includes('FT26309LOI01'), JSON.stringify(vi1?.notes));
    const c1 = await goi('GET', `/kh/don/${r1.j.ma_don}`, undefined, kh.tk);
    const ds1 = await goi('GET', '/kh/don', undefined, kh.tk);
    const CAU = 'Không tạo được đơn vì món đã hết hàng — đã cộng 25.000đ vào tài khoản của bạn';
    k('L3 App: da_huy + tien_ve_da_cong_vi 25000 + thong_bao_tien_ve đúng nguyên câu (chi tiết và danh sách)', c1.j.don?.tien_trinh === 'da_huy'
      && c1.j.don?.tien_ve_da_cong_vi === 25000 && c1.j.don?.thong_bao_tien_ve === CAU
      && (ds1.j.data || []).some((d) => d.ma === r1.j.ma_don && d.thong_bao_tien_ve === CAU), JSON.stringify(c1.j.don || null).slice(0, 260));
    k('L3 App KHÔNG nhận lời lỗi nội bộ (tên lỗi máy chủ / "ngừng bán")', !/ngừng bán|không tồn tại/.test(JSON.stringify(c1.j.don || {})));
    const w2 = await guiSepay(b1);
    k('L4 báo lặp CÙNG giao dịch → không cộng lần hai', daNhan(w2) && await soDu(kh.sdt) === 25000 && (await suKien(p1.id)).length === 1, `ví ${await soDu(kh.sdt)}`);
    const w6 = await guiSepay(bao(p1, { referenceCode: 'FT26309LOI06' }));
    k('L6 khoản KHÁC (giao dịch thứ hai) vào phiên đã loi → cộng thêm đúng một lần', daNhan(w6) && await soDu(kh.sdt) === 50000
      && await ketQua(p1.id) === 'vao_vi,vao_vi', `ví ${await soDu(kh.sdt)} · ${await ketQua(p1.id)}`);
    const r5 = await datApp(kh);
    const p5 = await phienApp(r5.j.ma_don) || {};
    const b5 = bao(p5);
    await ngungBan(true);
    const [w5a, w5b] = await Promise.all([guiSepay(b5), guiSepay(b5)]);
    await ngungBan(false);
    k('L5 hai báo CÙNG giao dịch cùng lúc, phiên đúng hạn hỏng đơn → cộng đúng một lần, một dòng báo', daNhan(w5a) && daNhan(w5b) && await soDu(kh.sdt) === 75000
      && (await suKien(p5.id)).length === 1 && await ketQua(p5.id) === 'vao_vi', `ví ${await soDu(kh.sdt)} · ${await ketQua(p5.id)}`);
    const r7 = await datApp(kh);
    const p7 = await phienApp(r7.j.ma_don) || {};
    await ngungBan(true);
    const w7 = await guiSepay(bao(p7, { accountNumber: '9990009999' }));
    const w7b = await guiSepay(bao(p7), { chuKy: 'sha256=' + '2'.repeat(64) });
    await ngungBan(false);
    k('L7 tài khoản KHÁC → chua_khop, sai chữ ký → 401; KHÔNG cộng ví', daNhan(w7) && la(w7b, 401) && await ketQua(p7.id) === 'chua_khop'
      && await soDu(kh.sdt) === 75000, `${await ketQua(p7.id)} · ví ${await soDu(kh.sdt)}`);
    const q = await goi('GET', '/pos/kh/don-app');
    const dq = (q.j.data || []).find((d) => d.tien_trinh === 'vao_vi' && d.so_hd === soHd1 && String(d.ly_do).includes('FT26309LOI01'));
    k('L8 quầy (GET /pos/kh/don-app) có MỖI báo vao_vi một dòng: so_hd, so_tien 25000, tên khách, lý do "không tạo được đơn" + mã GD', la(q, 200) && !!dq
      && dq.so_tien === 25000 && dq.ten_khach === 'Khách ' + kh.sdt && /không tạo được đơn/.test(dq.ly_do || '') && Array.isArray(dq.mon)
      && (q.j.data || []).filter((d) => d.tien_trinh === 'vao_vi' && d.so_hd === soHd1).length === 2,
    JSON.stringify((q.j.data || []).filter((d) => d.tien_trinh === 'vao_vi')).slice(0, 400));
    const dl = await goi('POST', `/pos/kh/don-app/${(await db.queryOne('SELECT id FROM pos_don_app WHERE ma = ?', [r1.j.ma_don]))?.id}/dang-lam`, {});
    k('L8 dòng vao_vi không phải đơn "Mới" (không da_tra), không bấm Đang làm được (409)', !(q.j.data || []).some((d) => d.ma === r1.j.ma_don && d.tien_trinh === 'da_tra')
      && la(dl, 409, 'DA_DOI_TIEN_TRINH'), moTa(dl));
    const ds = await chayDoiSoat({ kieu: 'ngay' });
    const dong = ds.can_xem.find((l) => l.bat_bien === 'CK' && l.mo_ta.includes('FT26309LOI01'));
    k('L9 Đối soát: CẦN XEM có lý do (không tạo được đơn), số HD, số tiền 25.000, mã GD; không ở ĐỎ', !!dong && /không tạo được đơn/.test(dong.mo_ta)
      && dong.mo_ta.includes(soHd1) && dong.mo_ta.includes('25.000') && !ds.do.some((l) => l.mo_ta.includes('FT26309LOI01')), dong?.mo_ta || 'không thấy');
    const so1 = (ds.so_hd || []).find((s) => s.so_hd === soHd1);
    k('L9b Đối soát bảng số hoá đơn: số của phiên loi có tiền về ghi lý do + "xem mục CK"', /lỗi: /.test(so1?.ly_do || '') && /xem mục CK/.test(so1?.ly_do || ''),
      JSON.stringify(so1 || null));
    const kq = await khach(0);
    const pq = (await taoPhien({ sdt: kq.sdt, khongVi: true })).j.phien || {};
    await ngungBan(true);
    const wq = await guiSepay(bao(await dongPhien(pq.id) || {}));
    await ngungBan(false);
    k('L10 phiên QUẦY hỏng đơn lúc tiền về → chua_khop ĐỎ như cũ, KHÔNG cộng ví', daNhan(wq) && await ketQua(pq.id) === 'chua_khop' && await soDu(kq.sdt) === 0
      && (await dongPhien(pq.id))?.trang_thai === 'loi', `${await ketQua(pq.id)} · ví ${await soDu(kq.sdt)}`);
    datCong('payos');
    const kp = await khach(0);
    const r11 = await datApp(kp);
    const p11 = await phienApp(r11.j.ma_don) || {};
    await ngungBan(true);
    const w11 = await guiPayos(p11);
    await ngungBan(false);
    k('L11 payOS: phiên App hỏng đơn lúc tiền về → cũng cộng ví (cùng một hàm)', la(w11, 200) && await soDu(kp.sdt) === 25000 && await ketQua(p11.id) === 'vao_vi',
      `ví ${await soDu(kp.sdt)} · ${await ketQua(p11.id)}`);
    datCong('sepay');
    // Soát vòng 1: lý do ngắn đúng loại lỗi — lời lỗi flash sale có chữ "giảm giá" KHÔNG được ra "giá món đã đổi".
    const kl = await khach(0);
    const loiThu = [['Đang flash sale — chỉ dùng được voucher/giảm giá kiểu TIỀN, không dùng kiểu %.', 'vì mã giảm giá không còn dùng được'],
      ['Số tiền thanh toán (20.000đ) không khớp tổng đơn hàng thật (25.000đ).', 'vì giá món đã đổi'], ['Sản phẩm X chưa có giá bán', 'vì đơn không còn hợp lệ']];
    const raL14 = [];
    for (const [lyDoPhien, mong] of loiThu) {
      const r = await datApp(kl);
      const p = await phienApp(r.j.ma_don) || {};
      await db.run("UPDATE pos_phien_thanh_toan SET trang_thai = 'loi', ly_do = ? WHERE id = ?", [lyDoPhien, p.id]);
      await guiSepay(bao(p));
      const tb = (await goi('GET', `/kh/don/${r.j.ma_don}`, undefined, kl.tk)).j.don?.thong_bao_tien_ve;
      raL14.push([tb === `Không tạo được đơn ${mong} — đã cộng 25.000đ vào tài khoản của bạn`, tb]);
    }
    k('L14 lý do ngắn theo đúng loại lỗi: flash sale / voucher → mã giảm; không khớp tổng → giá đổi; "chưa có giá bán" → câu chung', raL14.every(([d]) => d),
      raL14.map(([, tb]) => tb).join(' | '));
    const doc = (f) => fs.readFileSync(path.join(GOC, 'client', 'src', ...f), 'utf8');
    const dist = path.join(GOC, 'client', 'dist', 'assets');
    const bundle = fs.existsSync(dist) ? fs.readdirSync(dist).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(dist, f), 'utf8')).join('\n') : '';
    k('L13 màn Đơn App + nút nổi đọc dòng vao_vi; bản build dist có', /'vao_vi'/.test(doc(['pages', 'DonApp.jsx'])) && /'vao_vi'/.test(doc(['components', 'DonAppNoi.jsx']))
      && /"vao_vi"/.test(bundle) && /vào ví/.test(bundle));
  });

  muc('[E] Đối soát cuối ngày — số hoá đơn huỷ kèm lý do; số trống không lý do → ĐỎ');
  await chay('E', async () => {
    datCong('sepay');
    const ph = (await taoPhien()).j.phien || {};
    await luiPhien(ph.id);
    const pu = (await taoPhien()).j.phien || {};
    await goi('POST', `/pos/thanh-toan/phien/${pu.id}/huy`, {});
    datCong('payos');
    payosHong = true;
    const rl = await taoPhien();
    payosHong = false;
    const pl = await db.queryOne("SELECT * FROM pos_phien_thanh_toan WHERE trang_thai = 'loi' ORDER BY id DESC LIMIT 1").catch(() => null);
    datCong('sepay');
    const pc = (await taoPhien()).j.phien || {};
    const tm = await donTienMat();
    const ds = await chayDoiSoat({ kieu: 'ngay' });
    const ds_so = ds.so_hd || [];
    const tim = (id) => ds_so.find((x) => x.phien_id === id);
    const sh = await soCua(ph.id);
    k('C2 / E1 phiên hết hạn → Đối soát liệt kê HD<số> + "QR hết hạn"', /QR hết hạn/.test(tim(ph.id)?.ly_do || '') && tim(ph.id)?.so_hd === 'HD' + so4(Number(sh?.so)),
      JSON.stringify(tim(ph.id) || null));
    k('C3 / E1 phiên nhân viên huỷ → "huỷ trước khi trả"', /huỷ trước khi trả/.test(tim(pu.id)?.ly_do || ''), JSON.stringify(tim(pu.id) || null));
    k('C6 / E1 cổng QR lỗi lúc tạo → 502 + số ghi "cổng QR lỗi"', rl.status === 502 && !!pl && /cổng QR lỗi/.test(tim(pl.id)?.ly_do || ''), JSON.stringify(tim(pl?.id) || null));
    k('E1 phiên còn hạn → "đang chờ" (không phải huỷ)', /đang chờ/.test(tim(pc.id)?.ly_do || ''), JSON.stringify(tim(pc.id) || null));
    k('E2 số đã thành đơn tiền mặt (không mã GD) KHÔNG liệt kê', !ds_so.some((x) => x.ma_don === (tm.j.order?.code || '#')), tm.j.order?.code);
    k('D4 số thành đơn có mã GD → Đối soát có ma_gd + mã đơn', ds_so.some((x) => x.ma_gd === 'FT26309ABCDE' && x.ma_don === vC.o?.code), JSON.stringify(ds_so.filter((x) => x.ma_gd).slice(0, 2)));
    k('E1 kỳ ngày: không dòng ĐỎ "số hoá đơn trống" khi mọi số đều có phiên / đơn', !ds.do.some((l) => l.bat_bien === 'SO'), ds.do.filter((l) => l.bat_bien === 'SO').map((l) => l.mo_ta).join(' | '));
    await db.run('INSERT INTO pos_so_hoa_don (ngay, so, kenh, luc) VALUES (?, 9000, ?, ?)', [homNay(), 'HD', getNow()]).catch(() => null);
    const ds2 = await chayDoiSoat({ kieu: 'ngay' });
    k('E3 dòng sổ không phiên không đơn (HD9000) → ĐỎ "số trống không lý do"', ds2.do.some((l) => l.bat_bien === 'SO' && l.mo_ta.includes('HD9000')),
      ds2.do.map((l) => l.bat_bien).join());
    await db.run('DELETE FROM pos_so_hoa_don WHERE so = 9000 AND ngay = ?', [homNay()]).catch(() => null);
  });

  muc('[F] cửa App: so_hd = số hoá đơn (đúng chuỗi in trên bill), ma / ma_don giữ nguyên');
  await chay('F', async () => {
    datCong('sepay');
    const kh = await khach(0);
    const r1 = await datApp(kh);
    const p1 = await phienApp(r1.j.ma_don) || {}, s1 = await soCua(p1.id);
    const soApp1 = 'APP' + so4(Number(s1?.so));
    k('F1 POST /don cách qr → so_hd = APP<số đã giữ>, ma_don vẫn mã App A…', la(r1, 200) && r1.j.so_hd === soApp1 && /^A/.test(r1.j.ma_don || ''),
      JSON.stringify(r1.j).slice(0, 200));
    const c1 = await goi('GET', `/kh/don/${r1.j.ma_don}`, undefined, kh.tk);
    k('F2 GET /don/:ma đơn App CHƯA trả → so_hd APP<số đã giữ>', c1.j.don?.so_hd === soApp1, String(c1.j.don?.so_hd));
    await guiSepay(bao(p1));
    const c2 = await goi('GET', `/kh/don/${r1.j.ma_don}`, undefined, kh.tk);
    k('F2 đơn App ĐÃ trả → so_hd APP<số> (= so_bill in trên bill)', c2.j.don?.so_hd === soApp1 && c2.j.don?.tien_trinh === 'da_tra', JSON.stringify(c2.j.don || null).slice(0, 160));
    const pq = (await taoPhien({ sdt: kh.sdt, khongVi: true })).j.phien || {};
    await guiSepay(bao(pq));
    const oq = await donCua(pq.id);
    await db.run(`INSERT INTO pos_orders (code, customer_phone, customer_name, total, payment_method, status, created_at) VALUES (?, ?, 'K', 0, 'cash', 'completed', ?)`,
      [`ORD-${homNay().replace(/-/g, '')}-012`, kh.sdt, getNow()]);
    const ds = await goi('GET', '/kh/don', undefined, kh.tk);
    const tim = (ma) => (ds.j.data || []).find((d) => d.ma === ma);
    k('F2 GET /don: đơn quầy → so_hd HD<số>; đơn cũ mã ORD-…-012 → so_hd "012"; đơn App → APP<số>', tim(oq?.code)?.so_hd === 'HD' + so4(Number((await soCua(pq.id))?.so))
      && tim(`ORD-${homNay().replace(/-/g, '')}-012`)?.so_hd === '012' && tim(r1.j.ma_don)?.so_hd === soApp1, JSON.stringify((ds.j.data || []).map((d) => [d.ma, d.so_hd])).slice(0, 240));
    const r5 = await datApp(kh);
    const p5 = await phienApp(r5.j.ma_don) || {};
    await db.run('DELETE FROM pos_so_hoa_don WHERE phien_id = ?', [p5.id]).catch(() => null);
    const c5 = await goi('GET', `/kh/don/${r5.j.ma_don}`, undefined, kh.tk);
    k('F5 đơn App chưa có đơn thật và chưa được cấp số (tạo trước lúc triển khai) → so_hd null', c5.status === 200 && 'so_hd' in (c5.j.don || {}) && c5.j.don.so_hd === null,
      JSON.stringify(c5.j.don || null).slice(0, 160));
    const q = await goi('GET', '/pos/kh/don-app');
    k('F3 quầy GET /pos/kh/don-app có so_hd', (q.j.data || []).some((d) => d.ma === r1.j.ma_don && d.so_hd === soApp1), JSON.stringify((q.j.data || []).slice(0, 2)).slice(0, 200));
    const kb = await khach(0);
    const cb = await goi('GET', `/kh/don/${r1.j.ma_don}`, undefined, kb.tk);
    k('F4 khách B đọc đơn của khách A → 404 như cũ', cb.status === 404, moTa(cb));
    const jsx = fs.readFileSync(path.join(GOC, 'client', 'src', 'pages', 'DonApp.jsx'), 'utf8');
    const dist = path.join(GOC, 'client', 'dist', 'assets');
    const bundle = fs.existsSync(dist) ? fs.readdirSync(dist).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(dist, f), 'utf8')).join('\n') : '';
    k('F6 màn Đơn App (DonApp.jsx) hiện so_hd chữ to; bản build dist có so_hd', /so_hd/.test(jsx) && /\.so_hd\b/.test(bundle));
  });

  muc('[F2] hợp đồng /api/kh — trường mới + câu luật 4xx của POST /don khớp code');
  await chay('F2', async () => {
    const hd = fs.readFileSync(path.join(GOC, 'HOP_DONG_API_KH.md'), 'utf8');
    const luat = hd.split('\n').find((l) => l.includes('**Luật 4xx:**')) || '';
    k('F2 câu luật 4xx của POST /don nêu đủ ba ngoại lệ: 401, 409 KHO_BAN (gửi lại CÙNG khoá), 409 KHOA_GUI_DA_DUNG', /401/.test(luat) && /KHO_BAN/.test(luat)
      && /KHOA_GUI_DA_DUNG/.test(luat) && /cùng khoá|CÙNG khoá/i.test(luat), luat.slice(0, 200));
    k('F hợp đồng PHIEN_BAN ≥ 10; phần máy đọc có so_hd và tien_ve_da_cong_vi', Number((/^PHIEN_BAN: (\d+)/m.exec(hd) || [])[1]) >= 10
      && /"data\[\]\.so_hd"/.test(hd) && /"don\.so_hd"/.test(hd) && /"don\.tien_ve_da_cong_vi"/.test(hd));
    const kt = fs.readFileSync(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'), 'utf8');
    k("T1 kiem_tra_truoc_khi_giao.js chạy 'cong_cu/thu_CKNOIDUNG1.js'", /chayBaiThat\('cong_cu\/thu_CKNOIDUNG1\.js'\)/.test(kt));
  });

  muc('[K5] không đổi: tiền mặt, payOS, đơn cũ, huỷ đơn mã mới');
  await chay('K', async () => {
    const r1 = await donTienMat();
    k('K1 đơn tiền mặt trực tiếp → 200, tổng 25.000 như cũ', la(r1, 200) && Number(r1.j.order?.total) === 25000, moTa(r1));
    const cu = await db.queryOne("SELECT * FROM pos_orders WHERE code LIKE '%-012'");
    const hd = await goi('GET', `/pos/hoa-don/${cu?.id}`);
    k('K4 đơn cũ mã ORD-<ngày>-012 → hoá đơn so_bill "012" như cũ', hd.j.hoa_don?.don?.so_bill === '012', hd.j.hoa_don?.don?.so_bill);
    datCong('payos');
    const r5 = await taoPhien();
    k('K5 CONG_QR=payos vẫn tạo QR', la(r5, 200) && !!r5.j.phien?.checkout_url, moTa(r5));
    datCong('sepay');
    const h = await goi('PUT', `/pos/orders/${r1.j.order?.id}/cancel`, { reason: 'thử huỷ đơn mã mới' });
    k('K6 huỷ đơn mã mới (ORD-…-HD<số>) chạy như đơn cũ → 200', la(h, 200) && /-HD\d{4}$/.test(r1.j.order?.code || ''), `${moTa(h)} · ${r1.j.order?.code}`);
  });

  sv.close(); svGia.close();
  console.log(`\n  ${C.dam}${dat} đạt · ${hong} hỏng${C.het}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai();
  datGio(null);
  console.error(`\n${C.do}✖ Bài thử sập: ${e.message}${C.het}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
