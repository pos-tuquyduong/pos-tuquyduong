#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ TINGEE-1 — cổng QR Tingee: VietQR tự dựng tới số tài khoản ảo (VA) + Webhook biến động số dư ký HMAC-SHA512
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có tingee.js / webhook Tingee). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_TINGEE1.js
 *
 *  Khuôn thu_SEPAY1.js: database.js + libsql thật trên kho TẠM; chỉ thay ketNoiKho (P8), SX tắt. Express riêng mount ĐÚNG đường như index.js
 *  (thân THÔ cho /api/tingee/webhook trước express.json — phép tĩnh T1 canh index.js làm y như vậy). Khoá thử sinh ngẫu nhiên lúc chạy; KHÔNG
 *  gọi Tingee thật. Chữ ký viết RIÊNG trong bài theo tai_lieu_tingee.md mục 2: HMAC-SHA512(khoá, "<x-request-timestamp>:<thân>") hex. Trả lời
 *  theo mục 3: 200 + code "00" (ghi nhận), "02" (báo lặp), sai chữ ký 401 + "09". Không từ chối báo vì giờ cũ (mục 4). Khớp tài khoản theo
 *  vaAccountNumber; accountNumber (số gốc) bỏ qua (chủ quán 06.11). Nội dung có mã VA ngân hàng chèn đầu (chủ quán chuyển thử 06.11).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_tingee1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_tingee1_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_tingee1_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.tingee1.local/tra-ve';
const SP = { bin: '970000', soTk: '9990001234', khoa: 'sp_' + ngauNhien() };
process.env.SEPAY_BIN = SP.bin; process.env.SEPAY_SO_TK = SP.soTk; process.env.SEPAY_KHOA_WEBHOOK = SP.khoa;
// Tingee: số VA có CHỮ CÁI (dạng thật VQR…), BIN MB 970422.
const TG = { id: 'tgid_' + ngauNhien(), khoa: 'tgkhoa_' + ngauNhien(), soTk: 'VQRQANJMG7944', bin: '970422', moiTruong: undefined };
const BIEN = { id: 'TINGEE_CLIENT_ID', khoa: 'TINGEE_SECRET_TOKEN', soTk: 'TINGEE_SO_TK', bin: 'TINGEE_BIN', moiTruong: 'TINGEE_MOI_TRUONG' };
const datTingee = (o = TG) => { for (const [k, ten] of Object.entries(BIEN)) { if (o[k] === undefined) delete process.env[ten]; else process.env[ten] = o[k]; } };
datTingee();
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

const kyTingee = (than, ts, khoa = TG.khoa) => crypto.createHmac('sha512', khoa).update(`${ts}:${than}`, 'utf8').digest('hex');
const kySepay = (than, ts) => 'sha256=' + crypto.createHmac('sha256', SP.khoa).update(`${ts}.${than}`).digest('hex');
// Giờ VN (UTC+7) viết riêng: mốc tuyệt đối → 'YYYY-MM-DDTHH:mm:ss'; dịch giây từ một chuỗi giờ VN.
const gioVN = (ms = Date.now()) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 19);
const dichGiay = (s, d) => gioVN(new Date(s + '+07:00').getTime() + d * 1000);
const tsTingee = (ms = Date.now()) => new Date(ms + 7 * 3600e3).toISOString().replace(/[-:T.Z]/g, '').slice(0, 17);   // yyyyMMddHHmmssSSS
const ngayTingee = (s) => s.replace(/[-:T]/g, '');   // 'YYYY-MM-DDTHH:mm:ss' → yyyyMMddHHmmss
// VietQR: TLV (id 2 số, độ dài 2 số) + CRC-16/CCITT-FALSE — viết riêng. tlvDu: đọc hết chuỗi, sai độ dài bất kỳ trường nào → null.
const tlvDu = (s) => {
  const o = {}; let i = 0;
  while (i < s.length) { if (i + 4 > s.length) return null; const n = Number(s.slice(i + 2, i + 4)); if (!/^\d{2}$/.test(s.slice(i + 2, i + 4)) || i + 4 + n > s.length) return null; o[s.slice(i, i + 2)] = s.slice(i + 4, i + 4 + n); i += 4 + n; }
  return o;
};
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

  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use('/api/sepay/webhook', express.raw({ type: '*/*', limit: '100kb' }));
  app.use('/api/tingee/webhook', express.raw({ type: '*/*', limit: '100kb' }));
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/wallets', require(R('wallets.js')));
  app.use('/api/pos/settings', require(R('settings.js')));
  const tt = require(R('thanh-toan.js'));
  app.use('/api/pos/thanh-toan', tt);
  app.use('/api/payos/webhook', tt.webhook);
  app.use('/api/sepay/webhook', tt.webhookSepay);
  if (tt.webhookTingee) app.use('/api/tingee/webhook', tt.webhookTingee);
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

  const traVe = [];   // mọi thân trả về — phép X1 soát khoá không lộ
  const goi = async (method, url, body, tk = tkChu, them = {}) => {
    const headers = { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...them.headers };
    if (tk) headers.Authorization = 'Bearer ' + tk;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: them.tho ?? (body !== undefined ? JSON.stringify(body) : undefined) });
      const tho = await r.text();
      traVe.push(tho);
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      return { status: r.status, j, tho };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status} · ${r.tho.replace(/\s+/g, ' ').slice(0, 120)}`;
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const dem = async (sql, p = []) => Number((await db.queryOne(sql, p).catch(() => null))?.n ?? -1);
  const soDon = () => dem('SELECT COUNT(*) AS n FROM pos_orders');
  const soSuKien = () => dem('SELECT COUNT(*) AS n FROM pos_payos_su_kien');
  const soDu = async (sdt) => Number((await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [sdt]))?.balance || 0);
  const dongPhien = (id) => db.queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [id]).catch(() => null);
  const suKien = (id) => db.query('SELECT * FROM pos_payos_su_kien WHERE ma_payos = ? ORDER BY id', [id]).catch(() => []);
  const ketQua = async (id) => (await suKien(id)).map((x) => x.ket_qua).join();

  let soSdt = 0;
  const khach = async () => {
    const sdt = '09' + String(53000000 + (++soSdt)).padStart(8, '0');
    await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + sdt, getNow()]);
    return sdt;
  };
  const taoPhien = (o = {}) => goi('POST', '/pos/thanh-toan/phien', {
    don: { items: [mon(o.sl || 1)], ...(o.sdt ? { customer_phone: o.sdt, customer_name: 'K' } : {}) }, cach: o.cach || 'payos' });
  // Phiên của đơn App: phiên quầy có SĐT + một dòng pos_don_app nối phien_id (laPhienApp chỉ xét dòng này).
  const phienApp = async () => {
    const sdt = await khach();
    const p = (await taoPhien({ sdt })).j.phien || {};
    await db.run(`INSERT INTO pos_don_app (ma, phone, khoa_gui, bam, than, phien_id, tao_luc) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['APPTHU' + p.id, sdt, 'kg' + p.id, 'bam' + p.id, '{}', p.id, getNow()]).catch(() => null);
    return { p, sdt };
  };
  let soFt = 0;
  const baoT = (p, them = {}) => ({ clientId: TG.id, transactionCode: 'FT2631' + String(++soFt).padStart(10, '0'), amount: p.con_lai,
    content: `QANJMG7944 ${p.noi_dung} Ma giao dich Trace123`, bank: 'MB', accountNumber: '0123456789', vaAccountNumber: TG.soTk,
    transactionDate: ngayTingee(getNow()), type: 'credit', additionalData: [{ name: 'note', value: 'x' }], ...them });
  // o: { tho (thân thô), ts, chuKy, khoa, boKy, boTs, kyTren (chuỗi đem ký nếu khác thân gửi) }
  const guiT = (b, o = {}) => {
    const tho = o.tho ?? JSON.stringify(b), ts = String(o.ts ?? tsTingee());
    const headers = { 'Content-Type': 'application/json' };
    if (!o.boTs) headers['x-request-timestamp'] = ts;
    if (!o.boKy) headers['x-signature'] = o.chuKy ?? kyTingee(o.kyTren ?? tho, ts, o.khoa);
    return goi('POST', '/tingee/webhook', undefined, null, { headers, tho });
  };
  let soGd = 800000;
  const baoS = (p) => ({ id: ++soGd, gateway: 'MB', transactionDate: getNow().replace('T', ' '), accountNumber: SP.soTk, subAccount: '',
    code: p.noi_dung, content: p.noi_dung, transferType: 'in', description: 'x', transferAmount: p.con_lai, accumulated: 0, referenceCode: 'FTS' + soGd });
  const guiS = (b) => { const tho = JSON.stringify(b), ts = String(Math.floor(Date.now() / 1000));
    return goi('POST', '/sepay/webhook', undefined, null, { headers: { 'Content-Type': 'application/json', 'X-SePay-Timestamp': ts, 'X-SePay-Signature': kySepay(tho, ts) }, tho }); };
  const nhan = (r, code = '00') => r.status === 200 && r.j.code === code;
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] biến môi trường + công tắc CONG_QR=tingee — thiếu / sai biến → 503 như cổng khác; cổng cũ chạy như cũ');
  await chay('A', async () => {
    datCong('tingee');
    const r0 = await taoPhien();
    k('A1 CONG_QR=tingee đủ biến → tạo phiên QR 200', la(r0, 200) && !!r0.j.phien?.qr, moTa(r0));
    const truoc = await dem('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan');
    for (const [ten, o] of [['TINGEE_CLIENT_ID', { ...TG, id: undefined }], ['TINGEE_SECRET_TOKEN', { ...TG, khoa: undefined }], ['TINGEE_SO_TK', { ...TG, soTk: undefined }],
      ['TINGEE_BIN', { ...TG, bin: undefined }], ['TINGEE_BIN sai dạng (5 số)', { ...TG, bin: '97042' }], ['TINGEE_SO_TK sai dạng (có dấu cách)', { ...TG, soTk: 'VQR 7944' }],
      ['TINGEE_MOI_TRUONG lạ', { ...TG, moiTruong: 'thu' }]]) {
      datTingee(o);
      const r = await taoPhien();
      datTingee();
      k(`A2 thiếu / sai ${ten} → 503 PAYOS_CHUA_CAU_HINH, không tạo phiên`, la(r, 503, 'PAYOS_CHUA_CAU_HINH')
        && await dem('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan') === truoc, moTa(r));
    }
    for (const mt of ['production', 'uat']) {
      datTingee({ ...TG, moiTruong: mt });
      const r = await taoPhien();
      datTingee();
      k(`A3 TINGEE_MOI_TRUONG=${mt} → cài được (200)`, la(r, 200), moTa(r));
    }
    datCong('sepay');
    const rs = await taoPhien();
    const ms = tlvDu(tlvDu(tlvDu(String(rs.j.phien?.qr || ''))?.['38'] || '')?.['01'] || '') || {};
    k('A4 CONG_QR=sepay → QR vẫn tới tài khoản SePay (cổng cũ không đổi, K5)', la(rs, 200) && ms['00'] === SP.bin && ms['01'] === SP.soTk, moTa(rs));
    datCong('tingee');
    const g1 = await goi('GET', '/pos/settings');
    k("A5 GET /settings có cong_qr = { ten: 'Tingee', da_cai: true }", la(g1, 200) && g1.j.cong_qr?.ten === 'Tingee' && g1.j.cong_qr?.da_cai === true, moTa(g1));
    datTingee({ ...TG, khoa: undefined });
    const g2 = await goi('GET', '/pos/settings');
    datTingee();
    k('A5 thiếu khoá Tingee → cong_qr.da_cai = false (màn Cài đặt hiện "chưa cài")', la(g2, 200) && g2.j.cong_qr?.ten === 'Tingee' && g2.j.cong_qr?.da_cai === false, moTa(g2));
    datCong('sepay');
    const g3 = await goi('GET', '/pos/settings');
    datCong('tingee');
    k("A5 CONG_QR=sepay → cong_qr.ten = 'SePay'", g3.j.cong_qr?.ten === 'SePay' && g3.j.cong_qr?.da_cai === true, moTa(g3));
  });

  muc('[B] QR Tingee — VietQR tự dựng tới số VA có chữ cái, chuỗi EMV đúng chuẩn');
  await chay('B', async () => {
    datCong('tingee');
    k('B0 (tự kiểm bài) CRC-16/CCITT-FALSE("123456789") = 29B1', crc('123456789') === '29B1');
    const t0 = getNow();
    const r = await taoPhien({ sl: 2 });
    const p = r.j.phien || {}, q = String(p.qr || ''), f = tlvDu(q) || {}, m38 = tlvDu(f['38'] || '') || {}, m3801 = tlvDu(m38['01'] || '') || {}, m62 = tlvDu(f['62'] || '') || {};
    k('B1 chuỗi EMV đọc HẾT được (mọi trường đúng độ dài), trường 63 = 4 ký tự CRC ở cuối', !!tlvDu(q) && f['63']?.length === 4 && q.endsWith(f['63']), q);
    k('B1 00=01, 01=12, 38.00=A000000727, 38.02=QRIBFTTA, 53=704, 58=VN', f['00'] === '01' && f['01'] === '12' && m38['00'] === 'A000000727'
      && m38['02'] === 'QRIBFTTA' && f['53'] === '704' && f['58'] === 'VN', q);
    k(`B2 38.01.00 = ${TG.bin} (MB), 38.01.01 = ${TG.soTk} (số VA có chữ cái, độ dài 13 khai đúng)`, m3801['00'] === TG.bin && m3801['01'] === TG.soTk
      && m38['01'] === `0006${TG.bin}0113${TG.soTk}`, m38['01']);
    const nd = `TQD${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][Number(t0.slice(5, 7)) - 1]}${t0.slice(8, 10)} HD`;
    k('B3 54 = 50000 (phần còn lại); 62.08 = nội dung số hoá đơn TQD<MMM><DD> HD<4 số> của phiên (CK-NOIDUNG-1)', f['54'] === '50000'
      && new RegExp(`^${nd}\\d{4}$`).test(m62['08'] || '') && p.noi_dung === m62['08'], q);
    k('B4 CRC: 6304 + 4 hex, đúng CRC tính riêng', /6304[0-9A-F]{4}$/.test(q) && crc(q.slice(0, -4)) === q.slice(-4), q.slice(-8));
    const src = (() => { try { return fs.readFileSync(path.join(GOC, 'server', 'utils', 'tingee.js'), 'utf8'); } catch { return 'fetch('; } })();
    k('B5 tingee.js không gọi mạng (không fetch / http) — QR tự dựng', !/fetch\(|require\(['"]https?['"]\)/.test(src));
  });

  muc('[C] Webhook Tingee — chữ ký, trả lời "00" / "02" / "09", báo lặp, giờ cũ, tin lạ');
  await chay('C', async () => {
    datCong('tingee');
    const p1 = (await taoPhien()).j.phien || {};
    const b1 = baoT(p1);
    const nDon = await soDon();
    const r1 = await guiT(b1);
    const ph1 = await dongPhien(p1.id), don1 = ph1?.order_id ? await db.queryOne('SELECT ma_gd FROM pos_orders WHERE id = ?', [ph1.order_id]) : null;
    const sk1 = (await suKien(p1.id))[0] || {};
    k('C1 đúng chữ ký (thân gọn như Tingee gửi) → 200 {"code":"00"}', nhan(r1), moTa(r1));
    k("C1 phiên da_thu, nguon 'tingee', một đơn mới, mã GD FT… lưu vào đơn", ph1?.trang_thai === 'da_thu' && ph1?.nguon === 'tingee'
      && await soDon() === nDon + 1 && don1?.ma_gd === b1.transactionCode, JSON.stringify(ph1 && { tt: ph1.trang_thai, nguon: ph1.nguon }));
    k("C1 một dòng sự kiện khoa = 'tingee:<transactionCode>', ket_qua khop", sk1.khoa === 'tingee:' + b1.transactionCode && sk1.ket_qua === 'khop', JSON.stringify(sk1).slice(0, 160));
    const n1 = await soSuKien();
    const r2 = await guiT(b1);
    k('C2 báo LẶP (Tingee gửi lại y hệt) → 200 {"code":"02"}, không thêm dòng, không thêm đơn', nhan(r2, '02') && await soSuKien() === n1
      && await soDon() === nDon + 1, moTa(r2));

    const p3 = (await taoPhien()).j.phien || {};
    const b3 = baoT(p3), tho3 = JSON.stringify(b3), ts3 = tsTingee();
    const n3 = await soSuKien();
    const sai = [
      ['chữ ký sai một ký tự', { chuKy: (() => { const c = kyTingee(tho3, ts3); return (c[0] === 'a' ? 'b' : 'a') + c.slice(1); })(), ts: ts3 }],
      ['ký bằng khoá khác', { khoa: 'khoa_khac_' + ngauNhien(), ts: ts3 }],
      ['thiếu x-signature', { boKy: true, ts: ts3 }],
      ['thiếu x-request-timestamp', { boTs: true, chuKy: kyTingee(tho3, ''), ts: '' }],
      ['x-request-timestamp sai dạng (giây Unix)', { ts: String(Math.floor(Date.now() / 1000)) }],
      ['chữ ký đúng cho thân khác (đổi số tiền một byte)', { tho: tho3.replace(`"amount":${p3.con_lai}`, `"amount":${p3.con_lai + 1}`), kyTren: tho3, ts: ts3 }],
    ];
    for (const [ten, o] of sai) {
      const r = await guiT(b3, o);
      k(`C3 ${ten} → 401 {"code":"09"}, không ghi gì, phiên vẫn cho`, la(r, 401, '09') && await soSuKien() === n3 && (await dongPhien(p3.id))?.trang_thai === 'cho', moTa(r));
    }
    datTingee({ ...TG, khoa: undefined });
    const rRong = await guiT(b3, { khoa: '' });
    datTingee();
    k('C3 máy chủ chưa cài khoá Tingee (khoá rỗng) → 401, kể cả khi kẻ gửi ký bằng khoá rỗng', la(rRong, 401, '09') && await soSuKien() === n3, moTa(rRong));

    const r4 = await guiT(b3, { ts: tsTingee(Date.now() - 6 * 3600e3) });
    k('C4 mốc giờ CŨ 6 tiếng (Tingee gửi lại muộn), đúng chữ ký → vẫn nhận "00", chốt (mục 4: không từ chối vì giờ cũ)', nhan(r4)
      && (await dongPhien(p3.id))?.nguon === 'tingee', moTa(r4));

    const p5 = (await taoPhien()).j.phien || {};
    const b5 = baoT(p5);
    const thoRong = JSON.stringify(b5, null, 2);
    const r5 = await guiT(b5, { tho: thoRong });
    k('C5 thân có dấu cách / xuống dòng, ký trên đúng thân THÔ → nhận, chốt', nhan(r5) && (await dongPhien(p5.id))?.nguon === 'tingee', moTa(r5));
    const p5b = (await taoPhien()).j.phien || {};
    const b5b = baoT(p5b);
    const r5b = await guiT(b5b, { tho: JSON.stringify(b5b, null, 1), kyTren: JSON.stringify(b5b) });
    k('C5 thân có dấu cách nhưng Tingee ký trên JSON.stringify (bản gọn) → vẫn nhận (mục 2: khớp MỘT trong hai)', nhan(r5b)
      && (await dongPhien(p5b.id))?.nguon === 'tingee', moTa(r5b));

    const p6 = (await taoPhien()).j.phien || {};
    const n6 = await soSuKien();
    const r6 = await guiT(baoT(p6, { type: 'debit' }));
    k('C6 type "debit" (tiền ra) → 200 "00", ghi khong_phien, phiên vẫn cho', nhan(r6) && await soSuKien() === n6 + 1
      && (await dongPhien(p6.id))?.trang_thai === 'cho', moTa(r6));
    const r6b = await guiT(baoT(p6, { type: undefined }));
    k('C6 không có trường type (tài liệu HDSD không ghi) → coi là tiền vào, chốt', nhan(r6b) && (await dongPhien(p6.id))?.nguon === 'tingee', moTa(r6b));

    const n7 = await soSuKien();
    const r7 = await guiT(undefined, { tho: 'khong phai json' });
    k('C7 đúng chữ ký, thân không phải JSON → 400 BAO_KHONG_HOP_LE, không ghi', la(r7, 400, 'BAO_KHONG_HOP_LE') && await soSuKien() === n7, moTa(r7));
    const thu = { requestId: 'kiem-tra-ket-noi', message: 'test' };
    const r7b = await guiT(thu);
    const r7c = await guiT(thu);
    k('C8 tin không có transactionCode (tin "Kiểm tra kết nối" / dạng lạ) → 200 "00" (để Portal báo kết nối được), ghi MỘT dòng khong_phien kể cả gửi lại',
      nhan(r7b) && r7c.status === 200 && ['00', '02'].includes(r7c.j.code) && await soSuKien() === n7 + 1, moTa(r7b));

    const p9 = (await taoPhien()).j.phien || {};
    const b9 = baoT(p9);
    const nd9 = await soDon(), ns9 = await soSuKien();
    const [x, y] = await Promise.all([guiT(b9), guiT(b9)]);
    k('C9 hai báo GIỐNG HỆT tới CÙNG LÚC → cả hai 200 ("00" / "02"), MỘT đơn, MỘT dòng sự kiện', [x, y].every((r) => r.status === 200 && ['00', '02'].includes(r.j.code))
      && await soDon() === nd9 + 1 && await soSuKien() === ns9 + 1, moTa(x) + ' / ' + moTa(y));
  });

  muc('[D] khớp phiên bằng ĐÚNG luật đang có — nội dung có mã VA chèn đầu, tài khoản VA, tiền, hạn, hai cổng, vào ví');
  await chay('D', async () => {
    datCong('tingee');
    for (const [ten, f] of [['HOA "QANJMG7944 TQDNOV06 HD0016"', (nd) => `QANJMG7944 ${nd}`], ['thường "qanjmg7944 tqdnov06 hd0016"', (nd) => `qanjmg7944 ${nd}`.toLowerCase()],
      ['dính liền "QANJMG7944TQDNOV06HD0016"', (nd) => `QANJMG7944${nd.replace(/\s/g, '')}`]]) {
      const p = (await taoPhien()).j.phien || {};
      const r = await guiT(baoT(p, { content: f(p.noi_dung) }));
      k(`D1 nội dung ${ten} (ngân hàng chèn mã VA đầu) → khớp ĐÚNG phiên`, nhan(r) && await ketQua(p.id) === 'khop' && (await dongPhien(p.id))?.nguon === 'tingee', moTa(r));
    }
    const pA = (await taoPhien()).j.phien || {}, pB = (await taoPhien()).j.phien || {};
    const rAB = await guiT(baoT(pA, { content: `QANJMG7944 ${pB.noi_dung}`, amount: pB.con_lai }));
    k('D1 nội dung mang số hoá đơn của phiên B → chốt B, không đụng A', nhan(rAB) && (await dongPhien(pB.id))?.trang_thai === 'da_thu'
      && (await dongPhien(pA.id))?.trang_thai === 'cho', moTa(rAB));
    const r0 = await guiT(baoT(pA, { content: 'QANJMG7944 chuyen tien' }));
    k('D2 nội dung không có mã → khong_phien, phiên vẫn cho', nhan(r0) && (await dongPhien(pA.id))?.trang_thai === 'cho', moTa(r0));

    const pK = (await taoPhien()).j.phien || {};
    const rK = await guiT(baoT(pK, { vaAccountNumber: 'VQRKHAC0001' }));
    const skK = (await suKien(pK.id)).pop() || {};
    k('D3 vaAccountNumber KHÁC TINGEE_SO_TK → chua_khop "tiền vào tài khoản khác VQRKHAC0001", phiên KHÔNG chốt', nhan(rK) && skK.ket_qua === 'chua_khop'
      && String(skK.ly_do).startsWith('tiền vào tài khoản khác VQRKHAC0001') && (await dongPhien(pK.id))?.trang_thai === 'cho', JSON.stringify(skK).slice(0, 200));
    const rK2 = await guiT(baoT(pK, { vaAccountNumber: '' }));
    k('D3 vaAccountNumber RỖNG (tiền vào số gốc) → không chốt, "tài khoản khác"', nhan(rK2) && (await dongPhien(pK.id))?.trang_thai === 'cho'
      && String((await suKien(pK.id)).pop()?.ly_do).includes('tài khoản khác'), moTa(rK2));
    const rK3 = await guiT(baoT(pK, { accountNumber: '9999999999', vaAccountNumber: TG.soTk.toLowerCase() }));
    k('D3 accountNumber (số gốc) bất kỳ + VA đúng (khác hoa thường) → VẪN chốt (accountNumber bỏ qua khi so)', nhan(rK3)
      && (await dongPhien(pK.id))?.nguon === 'tingee', moTa(rK3));

    const pT = (await taoPhien()).j.phien || {};
    for (const d of [1, -1]) {
      const r = await guiT(baoT(pT, { amount: pT.con_lai + d }));
      k(`D4 lệch tiền ${d > 0 ? '+' : ''}${d} đồng → chua_khop "lệch tiền", phiên vẫn cho`, nhan(r) && (await suKien(pT.id)).pop()?.ly_do?.startsWith('lệch tiền')
        && (await dongPhien(pT.id))?.trang_thai === 'cho', moTa(r));
    }
    const pH1 = (await taoPhien()).j.phien || {}, pH2 = (await taoPhien()).j.phien || {};
    const rH1 = await guiT(baoT(pH1, { transactionDate: ngayTingee(dichGiay(pH1.het_han, -1)) }));
    k('D5 transactionDate 1 giây TRƯỚC hạn QR → chốt', nhan(rH1) && (await dongPhien(pH1.id))?.nguon === 'tingee', moTa(rH1));
    const rH2 = await guiT(baoT(pH2, { transactionDate: ngayTingee(dichGiay(pH2.het_han, 1)) }));
    k('D5 transactionDate 1 giây SAU hạn QR (đọc đúng giờ VN của Tingee) → chua_khop "tiền về sau khi QR hết hạn"', nhan(rH2)
      && (await suKien(pH2.id)).pop()?.ly_do === 'tiền về sau khi QR hết hạn' && (await dongPhien(pH2.id))?.trang_thai === 'cho', moTa(rH2));

    // Hai cổng (CK-NOIDUNG-1 Q6 B): cùng một khoản báo qua SePay + Tingee.
    const pS = (await taoPhien()).j.phien || {};
    const nS = await soDon();
    const rS1 = await guiS(baoS(pS)), rS2 = await guiT(baoT(pS));
    k('D6 SePay chốt trước, Tingee báo cùng khoản sau → không đơn thứ hai; dòng Tingee chua_khop "đã chốt bằng báo SePay … hai cổng"',
      rS1.status === 200 && nhan(rS2) && await soDon() === nS + 1 && /đã chốt bằng báo SePay .*cùng một khoản báo qua hai cổng/.test((await suKien(pS.id)).pop()?.ly_do || ''),
      (await suKien(pS.id)).map((x) => x.ket_qua + ':' + x.ly_do).join(' | '));
    const pS2 = (await taoPhien()).j.phien || {};
    await guiT(baoT(pS2));
    const rS3 = await guiS(baoS(pS2));
    k('D6 Tingee chốt trước, SePay báo sau → dòng SePay chua_khop "đã chốt bằng báo Tingee … hai cổng"', rS3.status === 200
      && /đã chốt bằng báo Tingee .*cùng một khoản báo qua hai cổng/.test((await suKien(pS2.id)).pop()?.ly_do || ''), (await suKien(pS2.id)).map((x) => x.ly_do).join(' | '));

    // Phiên App huỷ: tiền về → vào ví (luật CK-NOIDUNG-1); báo cùng khoản qua cổng kia → KHÔNG cộng lần hai.
    const { p: pV, sdt: sV } = await phienApp();
    await goi('POST', `/pos/thanh-toan/phien/${pV.id}/huy`, {});
    const v0 = await soDu(sV);
    const rV1 = await guiT(baoT(pV));
    k('D7 phiên App đã huỷ, tiền về qua Tingee → vao_vi, cộng ĐÚNG số tiền vào tài khoản khách', nhan(rV1) && await ketQua(pV.id) === 'vao_vi'
      && await soDu(sV) === v0 + pV.con_lai, `${await ketQua(pV.id)} · ${v0} → ${await soDu(sV)}`);
    const rV2 = await guiS(baoS(pV));
    k('D7 cùng khoản báo thêm qua SePay → chua_khop "hai cổng", ví KHÔNG cộng lần hai', rV2.status === 200 && await soDu(sV) === v0 + pV.con_lai
      && String((await suKien(pV.id)).pop()?.ly_do).includes('cùng một khoản báo qua hai cổng'), (await suKien(pV.id)).map((x) => x.ket_qua).join());
    const { p: pV2, sdt: sV2 } = await phienApp();
    await goi('POST', `/pos/thanh-toan/phien/${pV2.id}/huy`, {});
    const w0 = await soDu(sV2);
    await guiS(baoS(pV2));
    const rV3 = await guiT(baoT(pV2));
    k('D7 ngược lại: SePay vào ví trước, Tingee báo sau → Tingee chua_khop "hai cổng", ví cộng đúng MỘT lần', nhan(rV3) && await soDu(sV2) === w0 + pV2.con_lai
      && String((await suKien(pV2.id)).pop()?.ly_do).includes('cùng một khoản báo qua hai cổng'), (await suKien(pV2.id)).map((x) => x.ket_qua + ':' + x.khoa).join(' | '));

    datCong('sepay');
    const pW = (await taoPhien()).j.phien || {};
    datCong('tingee');
    const rW = await guiT(baoT(pW));
    k('D8 phiên tạo lúc CONG_QR=sepay → báo Tingee đúng chữ ký vẫn chốt (webhook mọi cổng luôn mở)', nhan(rW) && (await dongPhien(pW.id))?.nguon === 'tingee', moTa(rW));
    const pW2 = (await taoPhien()).j.phien || {};
    datCong('payos');
    const rW2 = await guiT(baoT(pW2));
    datCong('tingee');
    k('D8 phiên Tingee, đổi CONG_QR=payos trước khi tiền về → báo Tingee vẫn chốt (đổi công tắc không làm mất tiền về)', nhan(rW2)
      && (await dongPhien(pW2.id))?.nguon === 'tingee', moTa(rW2));
  });

  muc('[E] Đối soát — nhãn "Tingee giao dịch <mã>", lưới chặn ghi tiền vượt tính Tingee là cổng riêng');
  await chay('E', async () => {
    const ds = await chayDoiSoat({ kieu: 'ngay' });
    const tat = [...ds.do, ...ds.can_xem].filter((l) => l.bat_bien === 'CK').map((l) => l.mo_ta);
    k('E1 dòng Tingee mang nhãn "Tingee giao dịch FT2631…, mã <n>" (không phải "payOS mã")', tat.some((m) => /^Tingee giao dịch FT2631\d{10}, mã \d+: về /.test(m))
      && !tat.some((m) => /^payOS mã .*tài khoản khác VQRKHAC/.test(m)), tat.filter((m) => /VQRKHAC|FT2631/.test(m)).slice(0, 2).join(' | '));
    k('E1 dòng "tiền vào tài khoản khác" của Tingee ở CẦN XEM (không ĐỎ)', ds.can_xem.some((l) => /^Tingee giao dịch .*tài khoản khác VQRKHAC0001/.test(l.mo_ta))
      && !ds.do.some((l) => /tài khoản khác VQRKHAC/.test(l.mo_ta)));
    // Lưới chặn (doiSoat.js): một phiên có 1 đơn (khop Tingee) + 1 cộng ví (payOS) = ghi 2 lần, mỗi cổng báo 1 → ĐỎ. Tingee gộp vào payOS thì lọt.
    const { p } = await phienApp();
    const gio = getNow();
    await db.run(`INSERT INTO pos_payos_su_kien (khoa, ma_payos, so_tien, ket_qua, ly_do, du_lieu, luc) VALUES (?, ?, ?, 'khop', NULL, '{}', ?), (?, ?, ?, 'vao_vi', 'thử', '{}', ?)`,
      ['tingee:FTLUOI1', p.id, p.con_lai, gio, `${p.id}:REFLUOI`, p.id, p.con_lai, gio]);   // mã phiên (ma_payos) = id phiên (giuCho.js)
    const ds2 = await chayDoiSoat({ kieu: 'ngay' });
    k('E2 phiên ghi tiền 2 lần (đơn qua Tingee + cộng ví qua payOS), mỗi cổng báo 1 → ĐỎ "vượt số khoản thật"',
      ds2.do.some((l) => new RegExp(`^phiên #${p.id} .*vượt số khoản thật`).test(l.mo_ta)), ds2.do.filter((l) => /vượt/.test(l.mo_ta)).map((l) => l.mo_ta).join(' | '));
  });

  muc('[X·T·F] khoá không lộ; index.js gắn thân thô đúng chỗ; bộ kiểm chạy bài này; hướng dẫn chủ quán');
  {
    const lo = [...nhatKy, ...traVe].filter((l) => l.includes(TG.khoa) || l.includes(TG.id));
    k('X1 log máy chủ + mọi thân trả về (tạo phiên, webhook, GET /settings) không chứa khoá / Client ID Tingee', lo.length === 0, String(lo[0]).slice(0, 120));
    const dl = await db.query('SELECT du_lieu FROM pos_payos_su_kien').catch(() => []);
    k('X2 cột du_lieu (vào bản sao lưu) không chứa khoá / clientId Tingee', dl.length > 0 && !dl.some((d) => String(d.du_lieu).includes(TG.id) || String(d.du_lieu).includes(TG.khoa)));
    const src = fs.readFileSync(path.join(GOC, 'server', 'index.js'), 'utf8');
    const viTri = (re) => { const m = re.exec(src); return m ? m.index : -1; };
    const iRaw = viTri(/^app\.use\('\/api\/tingee\/webhook', express\.raw\(\{ type: '\*\/\*', limit: '100kb' \}\)\);/m), iJson = viTri(/^app\.use\(express\.json\(/m);
    const iT = viTri(/^app\.use\('\/api\/tingee\/webhook', require\('\.\/routes\/thanh-toan'\)\.webhookTingee\);/m);
    k("T1 index.js: express.raw cho RIÊNG '/api/tingee/webhook' đứng TRƯỚC express.json", iRaw >= 0 && iJson >= 0 && iRaw < iJson, `${iRaw} / ${iJson}`);
    k("T2 index.js: app.use('/api/tingee/webhook', …webhookTingee) trước express.static", iT >= 0 && iT < viTri(/^app\.use\(express\.static\(/m));
    const kt = fs.readFileSync(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'), 'utf8');
    k("T3 kiem_tra_truoc_khi_giao.js chạy 'cong_cu/thu_TINGEE1.js'", /^chayBaiThat\('cong_cu\/thu_TINGEE1\.js'\);/m.test(kt));
    let hd = '';
    try { hd = fs.readFileSync(path.join(GOC, 'viec', 'TINGEE-1', 'cai_dat_tingee.md'), 'utf8'); } catch { /* chưa có */ }
    k('F1 cai_dat_tingee.md đủ: 5 biến, địa chỉ Webhook có www, mục Webhook, QR Code, API Credentials, ngoài giờ bán, CONG_QR=tingee, 2.000đ, đổi lại CONG_QR=sepay',
      ['TINGEE_CLIENT_ID', 'TINGEE_SECRET_TOKEN', 'TINGEE_SO_TK', 'TINGEE_BIN', 'TINGEE_MOI_TRUONG', 'https://www.pos-tuquyduong.io.vn/api/tingee/webhook', 'Webhook',
        'QR Code', 'API Credentials', 'ngoài giờ bán', 'CONG_QR=tingee', '2.000', 'CONG_QR=sepay'].every((x) => hd.includes(x)));
    k('F1 cai_dat_tingee.md không chứa dãy ≥ 8 chữ số liền (số tài khoản / khoá)', hd.length > 0 && !/\d{8,}/.test(hd));
    const dongLui = hd.split('\n').filter((l) => /Không thấy/.test(l));
    k('F2 cai_dat_tingee.md: bước thử có dòng "Không thấy … đổi lại `CONG_QR=sepay` NGAY" (chủ quán 06.11), đứng SAU bước đặt CONG_QR=tingee',
      dongLui.some((l) => l.includes('`CONG_QR=sepay`') && /NGAY/.test(l)) && hd.indexOf('Không thấy') > hd.indexOf('`CONG_QR=tingee`'), dongLui.join(' | ').slice(0, 160));
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
