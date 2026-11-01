#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ SEPAY-1 — QR chuyển khoản qua SePay (VietQR tự dựng + webhook HMAC-SHA256), payOS giữ làm dự phòng bằng công tắc CONG_QR
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có congQr / sepay / vietQr / webhook SePay). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_SEPAY1.js
 *
 *  Khuôn thu_P3.js: database.js + libsql thật trên kho TẠM; chỉ thay ketNoiKho (P8), SX tắt. Express riêng mount ĐÚNG đường như index.js
 *  (thân THÔ cho /api/sepay/webhook trước express.json — phép tĩnh [T] canh index.js làm y như vậy). Khoá thử sinh ngẫu nhiên lúc chạy;
 *  BIN / số tài khoản là số giả. Webhook SePay ký bằng công thức VIẾT RIÊNG trong bài (tai_lieu_sepay.md mục 4), giải VietQR + CRC cũng viết
 *  riêng. So HTTP + `code`, không dò lời (E12) — trừ câu Đối soát / lý do chua_khop là thứ chủ quán đọc. Module chưa có → mỗi ca hỏng riêng.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_sepay1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_sepay1_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_sepay1_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.sepay1.local/tra-ve';
const SP = { bin: '970000', soTk: '9990001234', khoa: 'sp_' + ngauNhien() };
const datSepay = (o = SP) => { process.env.SEPAY_BIN = o.bin; process.env.SEPAY_SO_TK = o.soTk; process.env.SEPAY_KHOA_WEBHOOK = o.khoa; };
datSepay();
const datCong = (ten) => { if (ten === undefined) delete process.env.CONG_QR; else process.env.CONG_QR = ten; };

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const nhatKy = [];
const imLang = () => { console.log = console.error = console.warn = (...a) => nhatKy.push(a.join(' ')); };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const thuNap = (p) => { try { return require(p); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return null; throw e; } };
const bo = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// payOS: chuỗi ký viết riêng (khuôn thu_P3). SePay: 'sha256=' + HMAC-SHA256(khoá, ts + '.' + thân thô) — tai_lieu_sepay.md mục 4.
const chuoiKy = (d) => Object.keys(d).sort().map((x) => `${x}=${d[x] == null ? '' : d[x]}`).join('&');
const hmacPayos = (s) => crypto.createHmac('sha256', KHOA.ck).update(s).digest('hex');
const kySepay = (than, ts, khoa = SP.khoa) => 'sha256=' + crypto.createHmac('sha256', khoa).update(`${ts}.${than}`).digest('hex');
// VietQR: TLV (id 2 số, độ dài 2 số) + CRC-16/CCITT-FALSE — viết riêng, tự kiểm bằng vectơ chuẩn "123456789" → 29B1.
const tlv = (s) => { const o = {}; let i = 0; while (i + 4 <= s.length) { const n = Number(s.slice(i + 2, i + 4)); o[s.slice(i, i + 2)] = s.slice(i + 4, i + 4 + n); i += 4 + n; } return o; };
function crc(s) {
  let c = 0xffff;
  for (const ch of Buffer.from(s, 'utf8')) for (let b = 7; b >= 0; b--) { const tren = ((c >> 15) & 1) ^ ((ch >> b) & 1); c = (c << 1) & 0xffff; if (tren) c ^= 0x1021; }
  return c.toString(16).toUpperCase().padStart(4, '0');
}

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();

  // Móc C16: kho bận đúng lúc câu cổng da_thu; C16b: chết ngay sau câu ghi sự kiện TRONG giao dịch. Gắn trước khi nạp route.
  let mocBan = false, mocChet = false;
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const tx = await txGoc(...a);
    const runGoc = tx.run;
    tx.run = async (sql, p) => {
      if (mocBan && /SET trang_thai = 'da_thu'/.test(sql)) { mocBan = false; throw Object.assign(new Error('kho bận (bài thử)'), { code: 'SQLITE_BUSY' }); }
      const kq = await runGoc(sql, p);
      if (mocChet && /INSERT INTO pos_payos_su_kien/.test(sql)) { mocChet = false; throw new Error('chết giữa chừng (bài thử)'); }
      return kq;
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
    res.json({ code: '00', desc: 'success', data, signature: hmacPayos(chuoiKy(data)) });
  });
  const svGia = await new Promise((ok) => { const s = gia.listen(0, '127.0.0.1', () => ok(s)); });
  process.env.PAYOS_BASE_URL = `http://127.0.0.1:${svGia.address().port}`;

  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use('/api/sepay/webhook', express.raw({ type: '*/*', limit: '100kb' }));
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/wallets', require(R('wallets.js')));
  app.use('/api/pos/refunds', require(R('refunds.js')));
  const tt = require(R('thanh-toan.js'));
  app.use('/api/pos/thanh-toan', tt);
  app.use('/api/payos/webhook', tt.webhook);
  if (tt.webhookSepay) app.use('/api/sepay/webhook', tt.webhookSepay);
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const { kyTokenKhach } = require(path.join(GOC, 'server', 'middleware', 'khachAuth.js'));
  const { chayDoiSoat } = require(path.join(GOC, 'server', 'utils', 'doiSoat.js'));
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
  const daNhan = (r) => r.status === 200 && r.tho === '{"success":true}';   // tai_lieu_sepay.md mục 3: 200 + đúng {"success": true}
  const dem = async (sql, p = []) => Number((await db.queryOne(sql, p).catch(() => null))?.n ?? -1);
  const soDon = () => dem('SELECT COUNT(*) AS n FROM pos_orders');
  const soSuKien = () => dem('SELECT COUNT(*) AS n FROM pos_payos_su_kien');
  const soDu = async (sdt) => Number((await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [sdt]))?.balance || 0);
  const dongPhien = (id) => db.queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [id]).catch(() => null);
  const suKien = (id) => db.query('SELECT * FROM pos_payos_su_kien WHERE ma_payos = ? ORDER BY id', [id]).catch(() => []);
  const ketQua = async (id) => (await suKien(id)).map((x) => x.ket_qua).join();
  const luiPhien = (id) => db.run("UPDATE pos_phien_thanh_toan SET het_han = strftime('%Y-%m-%dT%H:%M:%S', ?, '-1 seconds') WHERE id = ?", [getNow(), id]);

  let soSdt = 0;
  const khach = async (napVi = 0) => {
    const sdt = '09' + String(52000000 + (++soSdt)).padStart(8, '0');
    const id = Number((await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + sdt, getNow()])).lastInsertRowid);
    if (napVi) await goi('POST', '/pos/wallets/topup', { phone: sdt, amount: napVi });
    await goi('POST', '/pos/thanh-toan/pin', { phone: sdt, pin: '1357', pin_lai: '1357' });
    return { sdt, id, tk: kyTokenKhach(id) };
  };
  const taoPhien = (o = {}) => goi('POST', '/pos/thanh-toan/phien', {
    don: { items: [mon(o.sl || 1)], ...(o.sdt ? { customer_phone: o.sdt, customer_name: 'K' } : {}) },
    cach: o.cach || 'payos', tru_tai_khoan: !!o.sdt, pin: o.sdt ? '1357' : undefined });
  let soGd = 700000;
  const bao = (p, them = {}) => ({ id: ++soGd, gateway: 'Vietcombank', transactionDate: getNow().replace('T', ' '), accountNumber: SP.soTk, subAccount: '',
    code: p.noi_dung ?? null, content: `${p.noi_dung || ''} chuyen tien`, transferType: 'in', description: 'NGUYEN VAN A chuyen tien',
    transferAmount: p.con_lai, accumulated: 0, referenceCode: 'FT' + soGd, ...them });
  // o: { tho (thân thô), ts, chuKy, khoa, boKy, boTs }
  const guiSepay = (b, o = {}) => {
    const tho = o.tho ?? JSON.stringify(b), ts = String(o.ts ?? Math.floor(Date.now() / 1000));
    const headers = { 'Content-Type': 'application/json' };
    if (!o.boTs) headers['X-SePay-Timestamp'] = ts;
    if (!o.boKy) headers['X-SePay-Signature'] = o.chuKy ?? kySepay(tho, ts, o.khoa);
    return goi('POST', '/sepay/webhook', undefined, null, { headers, tho });
  };
  let soRef = 0;
  const guiPayos = (p, them = {}) => {
    const data = { orderCode: p.id, amount: p.con_lai, description: p.noi_dung, accountNumber: '12345678', reference: 'REF' + (++soRef),
      transactionDateTime: getNow().replace('T', ' '), currency: 'VND', paymentLinkId: 'pl_' + p.id, code: '00', desc: 'success', ...them };
    return goi('POST', '/payos/webhook', { code: '00', desc: 'success', success: true, data, signature: hmacPayos(chuoiKy(data)) }, null);
  };
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] công tắc CONG_QR — một chỗ chọn cổng; thiếu khoá cổng đang chọn → 503 như cũ');
  const vA = {};
  await chay('A', async () => {
    datCong(undefined);
    const n0 = payosNhan.length;
    const r1 = await taoPhien();
    k('A1 không đặt CONG_QR → cổng payOS (gọi payOS, có checkout_url)', la(r1, 200) && payosNhan.length === n0 + 1
      && r1.j.phien?.checkout_url === 'https://gia/' + r1.j.phien?.id, moTa(r1));
    vA.phienPayos = r1.j.phien;
    datCong('sepay');
    const truoc = await dem('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan');
    for (const [ten, o] of [['SEPAY_BIN', { ...SP, bin: '' }], ['SEPAY_SO_TK', { ...SP, soTk: '' }], ['SEPAY_KHOA_WEBHOOK', { ...SP, khoa: '' }],
      ['SEPAY_BIN sai dạng (5 số)', { ...SP, bin: '97000' }], ['SEPAY_SO_TK sai dạng (20 ký tự)', { ...SP, soTk: '1'.repeat(20) }]]) {
      datSepay(o);
      const r = await taoPhien();
      datSepay();
      k(`A2 CONG_QR=sepay thiếu / sai ${ten} → 503 PAYOS_CHUA_CAU_HINH, không tạo phiên, không gọi payOS`, la(r, 503, 'PAYOS_CHUA_CAU_HINH')
        && await dem('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan') === truoc && payosNhan.length === n0 + 1, moTa(r));
    }
    datCong('lung_tung');
    const r3 = await taoPhien();
    k('A3 CONG_QR lạ → 503 PAYOS_CHUA_CAU_HINH (không đoán cổng), không gọi payOS', la(r3, 503, 'PAYOS_CHUA_CAU_HINH') && payosNhan.length === n0 + 1, moTa(r3));
    datCong('sepay');
    datSepay({ bin: '', soTk: '', khoa: '' });
    const r5a = await taoPhien({ cach: 'tien_mat' }), r5b = await taoPhien({ cach: 'ck_tay' });
    datSepay();
    k('A5 CONG_QR=sepay thiếu cả 3 khoá → tiền mặt / QR tĩnh vẫn tạo phiên (K5)', la(r5a, 200) && la(r5b, 200), moTa(r5a) + ' / ' + moTa(r5b));
    const r6 = await guiPayos(vA.phienPayos);
    k('A6 CONG_QR=sepay: phiên payOS tạo trước khi đổi công tắc → báo payOS vẫn chốt (khop, nguồn payos)', la(r6, 200)
      && await ketQua(vA.phienPayos.id) === 'khop' && (await dongPhien(vA.phienPayos.id))?.nguon === 'payos', moTa(r6));
    const p7 = (await taoPhien()).j.phien || {};
    datCong('payos');
    const r7 = await guiSepay(bao(p7));
    datCong('sepay');
    k('A7 CONG_QR=payos: phiên SePay tạo trước khi đổi công tắc → báo SePay vẫn chốt (tiền về muộn không mất)', daNhan(r7)
      && await ketQua(p7.id) === 'khop' && (await dongPhien(p7.id))?.nguon === 'sepay', moTa(r7));
    // A4 tĩnh: process.env.CONG_QR chỉ đọc ở congQr.js; giuCho.js không còn gọi thẳng payos.
    const ds = [];
    const quet = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) quet(p); else if (f.name.endsWith('.js')) ds.push(p); } };
    quet(path.join(GOC, 'server'));
    const coDoc = ds.filter((f) => /process\.env\.CONG_QR|process\.env\[['"]CONG_QR/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(GOC, f));
    const gc = bo(fs.readFileSync(path.join(GOC, 'server', 'utils', 'giuCho.js'), 'utf8'));
    k('A4 CONG_QR chỉ đọc ở server/utils/congQr.js; giuCho.js chọn cổng qua congQr, không require payos', coDoc.join() === path.join('server', 'utils', 'congQr.js')
      && gc.includes("require('./congQr')") && !gc.includes("require('./payos')"), coDoc.join());
  });

  muc('[B] tạo QR SePay — VietQR tự dựng, không gọi mạng, số tiền = phần còn lại');
  await chay('B', async () => {
    datCong('sepay');
    k('B0 (tự kiểm bài) CRC-16/CCITT-FALSE("123456789") = 29B1', crc('123456789') === '29B1');
    const a = await khach(30000);
    const n0 = payosNhan.length, t0 = getNow();
    const r = await taoPhien({ sdt: a.sdt, sl: 2 });
    const p = r.j.phien || {}, q = String(p.qr || ''), f = tlv(q), m38 = tlv(f['38'] || ''), m3801 = tlv(m38['01'] || ''), m62 = tlv(f['62'] || '');
    k('B1 phiên 50.000 giữ 30.000 tài khoản → 200, con_lai 20.000, checkout_url null', la(r, 200) && p.con_lai === 20000 && p.giu_vi === 30000
      && p.checkout_url === null, moTa(r) + ' ' + JSON.stringify(p).slice(0, 160));
    k('B1 VietQR: 00=01, 01=12 (QR động), 38.00=A000000727, 38.02=QRIBFTTA, 53=704, 58=VN', f['00'] === '01' && f['01'] === '12'
      && m38['00'] === 'A000000727' && m38['02'] === 'QRIBFTTA' && f['53'] === '704' && f['58'] === 'VN', q);
    k('B1 VietQR: BIN + số tài khoản đúng cài đặt; 54 = 20000 (phần còn lại, không phải tổng 50.000); 62.08 = TQD<mã phiên>',
      m3801['00'] === SP.bin && m3801['01'] === SP.soTk && f['54'] === '20000' && m62['08'] === 'TQD' + p.id && p.noi_dung === 'TQD' + p.id, q);
    k('B2 CRC: chuỗi kết thúc 6304 + 4 hex, đúng CRC tính riêng', /6304[0-9A-F]{4}$/.test(q) && crc(q.slice(0, -4)) === q.slice(-4), q.slice(-8));
    const sai = q.slice(0, 20) + (q[20] === '1' ? '2' : '1') + q.slice(21);
    k('B2 sửa một ký tự → CRC không còn khớp (phép kiểm CRC có răng)', crc(sai.slice(0, -4)) !== sai.slice(-4));
    const src = ['sepay.js', 'vietQr.js'].map((x) => { try { return bo(fs.readFileSync(path.join(GOC, 'server', 'utils', x), 'utf8')); } catch { return 'fetch('; } }).join('\n');
    k('B3 không gọi mạng: payOS giả không nhận yêu cầu; sepay.js / vietQr.js không có fetch / http', payosNhan.length === n0 && !/fetch\(|require\(['"]https?['"]\)/.test(src));
    const hh = await db.queryOne("SELECT CAST(strftime('%s', het_han) AS INTEGER) - CAST(strftime('%s', ?) AS INTEGER) AS n FROM pos_phien_thanh_toan WHERE id = ?", [t0, p.id]).catch(() => null);
    k('B4 het_han = bây giờ + 10 phút (±5 s), cùng dạng giờ VN', !!hh && Math.abs(hh.n - 600) <= 5 && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(p.het_han || ''), JSON.stringify(hh));
  });

  muc('[C] webhook SePay — chữ ký, mốc giờ, chống trùng, khớp / chưa khớp / không phiên');
  await chay('C', async () => {
    datCong('sepay');
    const a = await khach(30000);
    const p = (await taoPhien({ sdt: a.sdt, sl: 2 })).j.phien;
    const chup = async () => [await soDon(), await soSuKien(), (await dongPhien(p.id))?.trang_thai].join('/');
    const c0 = await chup();
    const b1 = bao(p);
    const ca = async (ten, o, mong = 401) => {
      const r = await guiSepay(b1, o);
      k(`${ten} → ${mong} CHU_KY_SAI, không đơn, không sự kiện, phiên vẫn cho`, la(r, mong, 'CHU_KY_SAI') && await chup() === c0, moTa(r) + ' · ' + await chup());
    };
    await ca('C1 chữ ký bằng khoá khác', { khoa: 'khoa_khac' });
    await ca('C1 chữ ký đúng nhưng thân bị sửa (số tiền)', { tho: JSON.stringify({ ...b1, transferAmount: 1 }), chuKy: kySepay(JSON.stringify(b1), Math.floor(Date.now() / 1000)) });
    await ca('C2 thiếu X-SePay-Signature', { boKy: true });
    await ca('C2b thiếu X-SePay-Timestamp', { boTs: true });
    await ca('C3 mốc giờ cũ 302 giây', { ts: Math.floor(Date.now() / 1000) - 302 });
    await ca('C4 mốc giờ tương lai 302 giây', { ts: Math.floor(Date.now() / 1000) + 302 });
    datSepay({ ...SP, khoa: '' });
    await ca('C1b khoá webhook chưa cài + chữ ký HMAC khoá rỗng', { khoa: '' });
    datSepay();
    // C5: thân gửi có thụt lề — máy chủ phải ký trên thân THÔ (JSON.stringify lại sẽ lệch chữ ký).
    const tho5 = JSON.stringify(b1, null, 2);
    const ts5 = Math.floor(Date.now() / 1000) - 298;
    const r5 = await guiSepay(b1, { tho: tho5, ts: ts5 });
    const pp = await dongPhien(p.id) || {}, don = await db.queryOne('SELECT * FROM pos_orders WHERE id = ?', [pp.order_id || -1]) || {};
    const sk = (await suKien(p.id))[0] || {};
    k('C3 mốc giờ cũ 298 giây (dưới ngưỡng 300) + thân thô có thụt lề → 200 {"success":true}', daNhan(r5), moTa(r5) + ' ' + r5.tho);
    k('C5 khớp → MỘT đơn paid: CK 20.000 + tài khoản 30.000, ví còn 0, phiên da_thu nguồn sepay', await soDon() === Number(c0.split('/')[0]) + 1
      && don.payment_status === 'paid' && Number(don.transfer_amount) === 20000 && Number(don.balance_amount) === 30000 && await soDu(a.sdt) === 0
      && pp.trang_thai === 'da_thu' && pp.nguon === 'sepay', JSON.stringify(pp).slice(0, 160));
    k('C5 sự kiện khop, khoa = sepay:<id giao dịch>, so_tien 20.000, ma_payos = mã phiên', sk.ket_qua === 'khop' && sk.khoa === 'sepay:' + b1.id
      && Number(sk.so_tien) === 20000 && Number(sk.ma_payos) === p.id, JSON.stringify(sk).slice(0, 160));
    const duLieu = (() => { try { return JSON.parse(sk.du_lieu); } catch { return {}; } })();
    k('C5b du_lieu giữ thân báo (id, content) nhưng BỎ accumulated (số dư tài khoản quán)', duLieu.id === b1.id && !!duLieu.content && !('accumulated' in duLieu),
      String(sk.du_lieu).slice(0, 120));
    const sk0 = await soSuKien(), than9 = JSON.stringify({ ...b1, id: undefined });
    const r9a = await guiSepay(null, { tho: than9 }), r9b = await guiSepay(null, { tho: 'khong phai json' });
    k('C9b thân đúng chữ ký nhưng thiếu id / không phải JSON → 400 BAO_KHONG_HOP_LE, không ghi dòng nào', la(r9a, 400, 'BAO_KHONG_HOP_LE')
      && la(r9b, 400, 'BAO_KHONG_HOP_LE') && await soSuKien() === sk0, moTa(r9a) + ' / ' + moTa(r9b));
    // E2b: đơn chốt qua SePay hoàn trên quầy như đơn payOS — trả đúng phần ví 30.000 đã trừ, đơn refunded.
    const yc = await goi('POST', '/pos/refunds', { order_id: pp.order_id, reason: 'thử SEPAY-1' });
    const dy = await goi('POST', `/pos/refunds/${yc.j.refund_id}/approve`, {});
    const sau = await db.queryOne('SELECT status FROM pos_orders WHERE id = ?', [pp.order_id || -1]).catch(() => null);
    k('E2b hoàn đơn SePay (yêu cầu + duyệt) → ví nhận lại đúng 30.000 phần tài khoản, đơn refunded', la(yc, 200) && la(dy, 200)
      && dy.j.tong_hoan === 30000 && await soDu(a.sdt) === 30000 && sau?.status === 'refunded', moTa(yc) + ' / ' + moTa(dy) + ' · ' + sau?.status);
    const lap = [];
    for (let i = 0; i < 3; i++) lap.push(await guiSepay(b1));
    k('C6 báo lặp 3 lần cùng id → mỗi lần 200 {"success":true}, vẫn MỘT đơn, MỘT sự kiện', lap.every(daNhan) && pp.order_id
      && await soDon() === Number(c0.split('/')[0]) + 1 && (await suKien(p.id)).length === 1, lap.map(moTa).join(' / '));
    const a7 = await khach(30000), p7 = (await taoPhien({ sdt: a7.sdt, sl: 2 })).j.phien, d7 = await soDon(), b7 = bao(p7);
    const [x, y] = await Promise.all([guiSepay(b7), guiSepay(b7)]);
    k('C7 hai báo cùng id CÙNG LÚC → MỘT đơn, MỘT sự kiện, ví trừ một lần', daNhan(x) && daNhan(y) && await soDon() === d7 + 1
      && (await suKien(p7.id)).length === 1 && await soDu(a7.sdt) === 0, moTa(x) + ' / ' + moTa(y));
    const khongPhien = async (ten, b) => {
      const d = await soDon(), r = await guiSepay(b);
      const dong = await db.queryOne('SELECT * FROM pos_payos_su_kien WHERE khoa = ?', ['sepay:' + b.id]).catch(() => null);
      k(`${ten} → 200 {"success":true}, sự kiện khong_phien, không đơn`, daNhan(r) && dong?.ket_qua === 'khong_phien' && await soDon() === d, moTa(r) + ' ' + JSON.stringify(dong).slice(0, 120));
      return dong;
    };
    const p8 = (await taoPhien()).j.phien;
    await khongPhien('C8 tiền RA mang đúng mã + số của phiên đang chờ', bao(p8, { transferType: 'out' }));
    k('C8 phiên đó vẫn cho', (await dongPhien(p8.id))?.trang_thai === 'cho');
    await khongPhien('C9 không có mã (code null, nội dung không TQD)', bao(p8, { code: null, content: 'chuyen tien tra sua' }));
    await khongPhien('C10 mã TQD không thuộc phiên nào', bao(p8, { code: 'TQD99999', content: 'TQD99999' }));
    // C10b: phiên mã 6 chữ số (tối đa) + nội dung dính thêm chữ số → không được cắt 6 số đầu để khớp nhầm phiên đó.
    await db.run("UPDATE sqlite_sequence SET seq = 199998 WHERE name = 'pos_phien_thanh_toan'");
    const p6 = (await taoPhien()).j.phien || {};
    await khongPhien('C10b mã dính thêm chữ số (TQD<mã 6 số>0) — không khớp nhầm phiên <mã>', bao(p6, { code: null, content: `CK TQD${p6.id}0 tra sua` }));
    k('C10b phiên 6 chữ số đó vẫn cho, không đơn', p6.id === 199999 && (await dongPhien(p6.id))?.trang_thai === 'cho', String(p6.id));
    const b11 = bao(p8, { code: null, content: `NGUYEN VAN A CK tqd${p8.id} tra sua` }), r11 = await guiSepay(b11);
    const s11 = await db.queryOne('SELECT ket_qua FROM pos_payos_su_kien WHERE khoa = ?', ['sepay:' + b11.id]).catch(() => null);
    k('C11 code null, mã kẹp giữa nội dung (chữ thường) → khớp, chốt phiên', daNhan(r11) && (await dongPhien(p8.id))?.nguon === 'sepay' && s11?.ket_qua === 'khop', moTa(r11) + ' · ' + s11?.ket_qua);
    const lech = async (ten, them, mau) => {
      const pl = (await taoPhien()).j.phien, d = await soDon();
      if (them === 'het_han') await luiPhien(pl.id);
      const r = await guiSepay(bao(pl, them === 'het_han' ? {} : typeof them === 'function' ? them(pl) : them));
      const s = (await suKien(pl.id))[0] || {};
      k(`${ten} → 200, KHÔNG đơn, chua_khop "${mau}"`, daNhan(r) && await soDon() === d && s.ket_qua === 'chua_khop' && String(s.ly_do).includes(mau)
        && !(await dongPhien(pl.id))?.order_id, moTa(r) + ' · ' + s.ket_qua + ' · ' + s.ly_do);
      return pl;
    };
    await lech('C12 thiếu 1.000đ', (pl) => ({ transferAmount: pl.con_lai - 1000 }), 'lệch tiền');
    await lech('C12 dư 1.000đ', (pl) => ({ transferAmount: pl.con_lai + 1000 }), 'lệch tiền');
    await lech('C13 tiền về sau khi phiên hết hạn', 'het_han', 'hết hạn');
    await lech('C13 transactionDate (giờ VN) sau het_han', { transactionDate: '2099-01-01 00:00:00' }, 'hết hạn');
    const p14 = (await taoPhien()).j.phien;
    const t14 = await goi('POST', `/pos/thanh-toan/phien/${p14.id}/xac-nhan-tay`, { ly_do: 'Thấy tiền về sao kê' });
    const r14 = await guiSepay(bao(p14));
    const s14 = (await suKien(p14.id))[0] || {};
    k('C14 đã xác nhận tay → báo SePay ghi chua_khop "KHÔNG hoàn", không đơn thứ hai', la(t14, 200) && daNhan(r14) && s14.ket_qua === 'chua_khop'
      && String(s14.ly_do).includes('KHÔNG hoàn') && (await dongPhien(p14.id))?.nguon === 'tay', moTa(r14) + ' · ' + s14.ly_do);
    datCong('payos');
    const p14b = (await taoPhien()).j.phien;
    datCong('sepay');
    const w14b = await guiPayos(p14b), d14b = await soDon(), r14b = await guiSepay(bao(p14b));
    const s14b = (await suKien(p14b.id)).map((s) => s.ket_qua + ':' + s.ly_do);
    k('C14b một khoản báo qua HAI cổng (payOS chốt trước, SePay báo sau) → không đơn thứ hai; dòng SePay chua_khop "hai cổng … KHÔNG hoàn"',
      la(w14b, 200) && daNhan(r14b) && await soDon() === d14b && s14b.length === 2 && s14b[0] === 'khop:null'
      && /^chua_khop:.*hai cổng.*KHÔNG hoàn/.test(s14b[1]), s14b.join(' | '));
    // C14c: khách chuyển THÊM một lần thật (giao dịch SePay khác) → không phải "hai cổng" (SePay đã báo phiên này) → chua_khop thường (ĐỎ, phải hoàn).
    const r14c = await guiSepay(bao(p14b)), s14c = (await suKien(p14b.id)).map((s) => s.ket_qua + ':' + s.ly_do);
    k('C14c SePay báo lần 2 (giao dịch khác) cho phiên payOS đã chốt → chua_khop "phiên đang da_thu", KHÔNG phải "hai cổng"', daNhan(r14c)
      && s14c.length === 3 && /^chua_khop:phiên đang da_thu/.test(s14c[2]), s14c.join(' | '));
    // C14d: chiều ngược — SePay chốt trước, payOS báo sau (lúc cài: CONG_QR=payos, webhook SePay đã bật); payOS báo lần 2 → chua_khop thường.
    datCong('payos');
    const p14d = (await taoPhien()).j.phien;
    datCong('sepay');
    const r14d = await guiSepay(bao(p14d)), w14d = await guiPayos(p14d), w14e = await guiPayos(p14d);
    const s14d = (await suKien(p14d.id)).map((s) => s.ket_qua + ':' + s.ly_do);
    k('C14d SePay chốt trước, payOS báo sau → dòng payOS "đã chốt bằng báo SePay … hai cổng … KHÔNG hoàn"; payOS báo lần 2 → "phiên đang da_thu"',
      daNhan(r14d) && la(w14d, 200) && la(w14e, 200) && (await dongPhien(p14d.id))?.nguon === 'sepay' && s14d.length === 3 && s14d[0] === 'khop:null'
      && /^chua_khop:đã chốt bằng báo SePay.*hai cổng.*KHÔNG hoàn/.test(s14d[1]) && /^chua_khop:phiên đang da_thu/.test(s14d[2]), s14d.join(' | '));
    const pE = (await taoPhien()).j.phien;
    await goi('POST', `/pos/thanh-toan/phien/${pE.id}/huy`, {});
    const rE = await guiSepay(bao(pE)), sE = (await suKien(pE.id))[0] || {};
    k('E2a phiên SePay đã huỷ, tiền về → chua_khop "phiên đang huy", không đơn', daNhan(rE) && sE.ket_qua === 'chua_khop' && /huy/.test(sE.ly_do)
      && !(await dongPhien(pE.id))?.order_id, sE.ly_do);
    for (const [ma, ten, moc] of [['C16', 'kho bận lúc chốt → 409 KHO_BAN', 'ban'], ['C16b', 'chết sau câu ghi sự kiện trong giao dịch → 5xx', 'chet']]) {
      const ak = await khach(30000), pk = (await taoPhien({ sdt: ak.sdt, sl: 2 })).j.phien, dk = await soDon(), bk = bao(pk);
      if (moc === 'ban') mocBan = true; else mocChet = true;
      const r = await guiSepay(bk);
      mocBan = mocChet = false;
      const giua = [await soDon() - dk, (await suKien(pk.id)).length, (await dongPhien(pk.id))?.trang_thai, await soDu(ak.sdt)].join('/');
      const lai = await guiSepay(bk);
      k(`${ma} ${ten} (SePay gửi lại), chưa ghi sự kiện, phiên cho, ví nguyên`, (moc === 'ban' ? la(r, 409, 'KHO_BAN') : r.status >= 500) && !daNhan(r)
        && giua === '0/0/cho/30000', moTa(r) + ' · ' + giua);
      k(`${ma} gửi lại cùng id → chốt được (không bị nuốt)`, daNhan(lai) && await soDon() === dk + 1 && await ketQua(pk.id) === 'khop', moTa(lai));
    }
  });

  muc('[C18] đơn App cach_tra qr qua SePay — chuỗi VietQR trả App, tiền về chốt đơn, tiền về sau huỷ → tien_ve_cho_doi_soat');
  await chay('C18', async () => {
    datCong('sepay');
    const kh = await khach(0);
    const gio = { mon: [{ ma: `${sp.sx_product_type}_${sp.sx_product_id}`, so_luong: 1 }], cach_nhan: 'tai_quan' };
    let soKhoa = 0;
    const datApp = async (k1 = kh, them = { cach_tra: 'qr' }) => {
      const tong = (await goi('POST', '/kh/gio/bao-gia', gio, k1.tk)).j.tong;
      return goi('POST', '/kh/don', { ...gio, khoa_gui: `khoa-sepay-${++soKhoa}-${ngauNhien().slice(0, 8)}`, tong_da_xem: tong, ...them }, k1.tk);
    };
    const phienCua = async (ma) => { const d = await db.queryOne('SELECT phien_id FROM pos_don_app WHERE ma = ?', [ma]).catch(() => null); return d ? dongPhien(d.phien_id) : null; };
    const r1 = await datApp();
    const p1 = await phienCua(r1.j.ma_don) || {}, f = tlv(String(r1.j.qr?.chuoi || ''));
    k('E3 POST /kh/don cách qr (CONG_QR=sepay) → 200 cho_tra, qr.chuoi là VietQR (54 = 25000, 62.08 = TQD<mã phiên>), qr.het_han có', la(r1, 200)
      && r1.j.tien_trinh === 'cho_tra' && f['54'] === '25000' && tlv(f['62'] || '')['08'] === 'TQD' + p1.id && !!r1.j.qr?.het_han, moTa(r1) + ' ' + JSON.stringify(r1.j).slice(0, 200));
    const w1 = await guiSepay(bao(p1));
    const c1 = await goi('GET', `/kh/don/${r1.j.ma_don}`, undefined, kh.tk);
    k('C18 tiền SePay về → đơn App da_tra, có đơn thật (như payOS)', daNhan(w1) && c1.j.don?.tien_trinh === 'da_tra' && !!(await phienCua(r1.j.ma_don))?.order_id,
      moTa(c1) + ' ' + JSON.stringify(c1.j.don || null).slice(0, 160));
    const r2 = await datApp();
    await goi('POST', `/kh/don/${r2.j.ma_don}/huy`, {}, kh.tk);
    const w2 = await guiSepay(bao(await phienCua(r2.j.ma_don) || {}));
    const c2 = await goi('GET', `/kh/don/${r2.j.ma_don}`, undefined, kh.tk);
    k('C18 tiền SePay về sau khi khách huỷ → da_huy + tien_ve_cho_doi_soat true, không đơn thật', daNhan(w2) && c2.j.don?.tien_trinh === 'da_huy'
      && c2.j.don.tien_ve_cho_doi_soat === true && !(await phienCua(r2.j.ma_don))?.order_id, JSON.stringify(c2.j.don || null).slice(0, 160));
    const kv = await khach(10000);
    const r3 = await datApp(kv, { cach_tra: 'vi_qr', pin: '1357' });
    const p3 = await phienCua(r3.j.ma_don) || {}, f3 = tlv(String(r3.j.qr?.chuoi || ''));
    k('C18b đơn App vi_qr (ví 10.000) → giữ 10.000, VietQR 54 = 15000 (phần còn lại)', la(r3, 200) && r3.j.giu_vi === 10000 && r3.j.con_lai === 15000
      && f3['54'] === '15000', moTa(r3) + ' ' + JSON.stringify(r3.j).slice(0, 160));
    const w3 = await guiSepay(bao(p3));
    const c3 = await goi('GET', `/kh/don/${r3.j.ma_don}`, undefined, kv.tk);
    k('C18b tiền SePay 15.000 về → da_tra, ví trừ đúng 10.000 (còn 0)', daNhan(w3) && c3.j.don?.tien_trinh === 'da_tra' && await soDu(kv.sdt) === 0,
      moTa(w3) + ' · ' + c3.j.don?.tien_trinh + ' · ' + await soDu(kv.sdt));
  });

  muc('[D] Đối soát — tiền SePay chưa khớp / không phiên cùng bảng, cùng loại dòng với payOS, ghi rõ nguồn');
  await chay('D', async () => {
    datCong('payos');
    const pp = (await taoPhien()).j.phien;
    await guiPayos(pp, { amount: pp.con_lai - 1 });
    const ds = await chayDoiSoat({ kieu: 'ngay' });
    const ck = (nhom) => ds[nhom].filter((l) => l.bat_bien === 'CK').map((l) => l.mo_ta);
    k('D1 ĐỎ có dòng "SePay giao dịch … chưa khớp đơn" và dòng "payOS mã … chưa khớp đơn"', ck('do').some((m) => /^SePay giao dịch \d+, mã \d+: về .* chưa khớp đơn/.test(m))
      && ck('do').some((m) => /^payOS mã \d+: về .* chưa khớp đơn/.test(m)), ck('do').slice(0, 3).join(' | '));
    k('D1 CẦN XEM có dòng SePay "không thuộc phiên nào" (kể cả báo không mã: "mã —"); không dòng SePay không_phien nào ở ĐỎ',
      ck('can_xem').some((m) => /^SePay giao dịch \d+, mã —: về .* không thuộc phiên nào/.test(m))
      && !ck('do').some((m) => /^SePay.*không thuộc phiên nào/.test(m)), ck('can_xem').slice(0, 3).join(' | '));
    k('D2 dòng "cùng một khoản báo qua hai cổng … KHÔNG hoàn" (C14b) ở CẦN XEM, KHÔNG ở ĐỎ (ĐỎ = phải hoàn / nạp)',
      ck('can_xem').some((m) => /hai cổng.*KHÔNG hoàn/.test(m)) && !ck('do').some((m) => /hai cổng/.test(m)), ck('do').filter((m) => /hai cổng/.test(m)).join(' | '));
    k('D2 dòng SePay "phiên đang da_thu" (C14c — khách chuyển thêm lần thật) ở ĐỎ', ck('do').some((m) => /^SePay giao dịch .*phiên đang da_thu/.test(m)));
    k('D2 dòng "đã xác nhận tay … KHÔNG hoàn" (C14) GIỮ ở ĐỎ như trước (nghiệm thu E: đối soát cũ không đổi)', ck('do').some((m) => /đã xác nhận tay trước/.test(m)));
  });

  muc('[X·T·F] không lộ khoá; index.js gắn thân thô đúng chỗ; bộ kiểm chạy bài này; hướng dẫn cài');
  {
    const lo = nhatKy.filter((l) => l.includes(SP.khoa) || l.includes(KHOA.ck));
    k('X1 log máy chủ suốt bài không chứa khoá webhook SePay / khoá payOS', lo.length === 0, lo[0]);
    // Không cắt chú thích bằng bo(): chuỗi '*/*' của express.raw mở một "/*" giả. Đòi đúng DÒNG mã (neo đầu dòng — dòng chú thích không khớp).
    const src = fs.readFileSync(path.join(GOC, 'server', 'index.js'), 'utf8');
    const viTri = (re) => { const m = re.exec(src); return m ? m.index : -1; };
    const iRaw = viTri(/^app\.use\('\/api\/sepay\/webhook', express\.raw\(\{ type: '\*\/\*', limit: '100kb' \}\)\);/m), iJson = viTri(/^app\.use\(express\.json\(/m);
    const iSepay = viTri(/^app\.use\('\/api\/sepay\/webhook', require\('\.\/routes\/thanh-toan'\)\.webhookSepay\);/m);
    k("T1 index.js: express.raw cho RIÊNG '/api/sepay/webhook' đứng TRƯỚC express.json", iRaw >= 0 && iJson >= 0 && iRaw < iJson, `${iRaw} / ${iJson}`);
    k("T2 index.js: app.use('/api/sepay/webhook', require('./routes/thanh-toan').webhookSepay) trước express.static; webhook payOS vẫn gắn",
      iSepay >= 0 && viTri(/^app\.use\('\/api\/payos\/webhook', require\('\.\/routes\/thanh-toan'\)\.webhook\);/m) >= 0 && iSepay < viTri(/^app\.use\(express\.static\(/m));
    const kt = fs.readFileSync(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'), 'utf8');
    k("T3 kiem_tra_truoc_khi_giao.js chạy 'cong_cu/thu_SEPAY1.js'", /^chayBaiThat\('cong_cu\/thu_SEPAY1\.js'\);/m.test(kt));
    let hd = '';
    try { hd = fs.readFileSync(path.join(GOC, 'viec', 'SEPAY-1', 'cai_dat_sepay.md'), 'utf8'); } catch { /* chưa có */ }
    k('F1 cai_dat_sepay.md có đủ: CONG_QR, SEPAY_BIN, SEPAY_SO_TK, SEPAY_KHOA_WEBHOOK, /api/sepay/webhook, HMAC-SHA256, TQD, 2.000, quay về payOS',
      ['CONG_QR', 'SEPAY_BIN', 'SEPAY_SO_TK', 'SEPAY_KHOA_WEBHOOK', '/api/sepay/webhook', 'HMAC-SHA256', 'TQD', '2.000', 'payOS'].every((x) => hd.includes(x)));
    k('F1 cai_dat_sepay.md không chứa dãy ≥ 8 chữ số liền (số tài khoản / khoá)', hd.length > 0 && !/\d{8,}/.test(hd));
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
