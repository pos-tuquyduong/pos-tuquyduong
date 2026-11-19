#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ TIEN-KHOA-2 — bịt 3 lối đổi tiền không qua PIN / QR
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (trừ tay còn, điều chỉnh ví không PIN, đổi tiền mặt → CK, thu nợ CK). Xanh ngay = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_TIENKHOA2.js [--may-chu <thư mục server>]
 *  (--may-chu: bản sao đột biến của viec/TIEN-KHOA-2/dot_bien.py; giao diện đọc <may-chu>/../client/src)
 *
 *  [A1] /wallets/deduct bỏ hẳn · [A2] /wallets/adjust cần PIN chủ quán (utils/pinChuQuan.js — chung luật sai / khoá), không âm, dòng sổ đủ
 *  người / lý do / giờ, hiện CẦN XEM ở Đối soát (phép DC) · [A3] đổi tiền mặt → CK chặn hẳn, CK → tiền mặt vẫn được + hiện ở Đối soát ·
 *  [A4] thu nợ CK → 400 THU_NO_CK_PHAI_QR · [G] màn ViKhach / Orders / api.js · [K5] luồng hợp lệ PHẢI KHÔNG bị chặn.
 *  Máy chủ: database.js + libsql thật trên kho TẠM (khuôn thu_BOMANCU1). Mỗi ca CHẶN so đúng `code` VÀ dấu vết không ghi.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const CLIENT = path.join(MAY_CHU, '..', 'client', 'src');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_tienkhoa2_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_tk2_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_tk2_kh_' + ngauNhien();
process.env.PAYOS_CLIENT_ID = 'id_' + ngauNhien(); process.env.PAYOS_API_KEY = 'api_' + ngauNhien(); process.env.PAYOS_CHECKSUM_KEY = 'ck_' + ngauNhien();
process.env.PAYOS_BASE_URL = 'http://127.0.0.1:9';   // không phiên QR nào được tạo trong bài này
delete process.env.CONG_QR;

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); }
  else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = console.error = console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };
const doc = (...p) => { try { return fs.readFileSync(path.join(...p), 'utf8'); } catch { return ''; } };
const sach = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const { donCu } = require('./gia_lap/donCu');

const LOI_THU_NO = 'Thu nợ chuyển khoản phải qua QR — tạm thu tiền mặt';
const PIN_CQ = '8642', PIN_KH = '1357';

async function main() {
  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] màn hình (đọc mã nguồn client/src)');
  await chay('G', async () => {
    const api = sach(doc(CLIENT, 'utils', 'api.js'));
    const vi = (api.match(/export const walletsApi = \{[\s\S]*?\n\};/) || [''])[0];
    k('A1b api.js: walletsApi không còn deduct / "/wallets/deduct", vẫn còn adjust · topup', vi.length > 0 && !/deduct/.test(api)
      && /adjust:/.test(vi) && /topup:/.test(vi), vi.slice(0, 80));
    const vk = sach(doc(CLIENT, 'components', 'ViKhach.jsx'));
    const goiAdjust = (vk.match(/walletsApi\.adjust\(\{[^}]*\}/) || [''])[0];
    k('A2i ViKhach.jsx: import HoiPin, vẽ <HoiPin, gửi pin trong walletsApi.adjust, không window.prompt', /import HoiPin from '\.\/HoiPin'/.test(vk)
      && /<HoiPin\b/.test(vk) && /\bpin\b/.test(goiAdjust) && !/prompt\(/.test(vk), goiAdjust || 'không thấy walletsApi.adjust({...})');
    const od = sach(doc(CLIENT, 'pages', 'Orders.jsx'));
    k('A4e Orders.jsx: thu nợ gọi ordersApi.payDebt với tiền mặt, không còn fetch tới pay-debt, không còn nút chọn chuyển khoản, có lời báo QR',
      /ordersApi\.payDebt\(\s*selectedOrder\.id\s*,\s*\{\s*payment_method:\s*'cash'/.test(od) && !/fetch\([^)]*pay-debt/.test(od)
      && !/setPaymentMethod\('transfer'\)/.test(od) && od.includes(LOI_THU_NO),
    `payDebt ${/ordersApi\.payDebt\(/.test(od)} · fetch ${/fetch\([^)]*pay-debt/.test(od)} · nút CK ${/setPaymentMethod\('transfer'\)/.test(od)} · lời ${od.includes(LOI_THU_NO)}`);
  });

  // ═════════════════════════════════════════════════════════════════════════
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const bcrypt = require(path.join(GOC, 'node_modules', 'bcryptjs'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  const { getNow } = require(path.join(MAY_CHU, 'utils', 'helpers.js'));
  const { chayDoiSoat } = require(path.join(MAY_CHU, 'utils', 'doiSoat.js'));
  await db.initDatabase();
  const R = (f) => path.join(MAY_CHU, 'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(R('don-mo-rong.js')));   // như server/index.js: trước orders.js
  for (const r of ['customers', 'orders', 'wallets']) app.use('/api/pos/' + r, require(R(r + '.js')));
  app.use('/api/pos/thanh-toan', require(R('thanh-toan.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  const chu = await db.queryOne("SELECT id, username FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  const datCaiDat = (key, value) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(value), getNow()]);
  for (const [a, b] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['flash_enabled', 'false'], ['signup_enabled', '0'],
    ['thanh_toan_payos_bat_buoc', '0']]) await datCaiDat(a, b);
  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 25000 WHERE id = ?', [sp[0].id]);
  const mon = () => ({ product_id: sp[0].id, sx_product_type: sp[0].sx_product_type, sx_product_id: sp[0].sx_product_id, quantity: 1 });
  const goi = async (method, url, body, tk = tkChu) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers: { 'Content-Type': 'application/json', ...(tk ? { Authorization: 'Bearer ' + tk } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined });
      let j = {}; try { j = await r.json(); } catch { /* không JSON */ }
      return { status: r.status, j };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.j?.code ? ' · ' + r.j.code : ''}${r.j?.error && r.status >= 400 ? ' · ' + String(r.j.error).slice(0, 80) : ''}`;
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const soCh = async (sql, p = []) => Number(Object.values(await db.queryOne(sql, p))[0] ?? 0);   // câu hỏng → NÉM (không so suông)
  const soDu = (sdt) => soCh('SELECT COALESCE((SELECT balance FROM pos_wallets WHERE phone = ?), 0) AS n', [sdt]);
  const vet = async () => JSON.stringify(await Promise.all([
    'SELECT COUNT(*) AS n FROM pos_orders', 'SELECT COUNT(*) AS n FROM pos_balance_transactions', 'SELECT COALESCE(SUM(balance), 0) AS n FROM pos_wallets',
    'SELECT COALESCE(SUM(thuong), 0) AS n FROM pos_wallets', 'SELECT COUNT(*) AS n FROM pos_order_log', 'SELECT COUNT(*) AS n FROM pos_point_transactions',
    'SELECT COALESCE(SUM(COALESCE(cash_amount, 0) * 3 + COALESCE(transfer_amount, 0) * 7 + COALESCE(debt_amount, 0) * 11), 0) AS n FROM pos_orders',
    "SELECT COUNT(*) AS n FROM pos_orders WHERE payment_status = 'paid'"].map((q) => soCh(q))));
  const caChan = async (ten, gui, status, code, kiemThem = async () => '') => {
    const t = await vet();
    const r = await gui();
    const sau = await vet();
    const them = await kiemThem(r);
    k(`${ten} → ${status}${code ? ' ' + code : ''}, không ghi gì`, la(r, status, code) && sau === t && !them,
      `${moTa(r)}${sau === t ? '' : ' · dấu vết ' + t + ' → ' + sau}${them ? ' · ' + them : ''}`);
    return r;
  };
  let soSdt = 0;
  const sdtMoi = () => '09' + String(52000000 + (++soSdt)).padStart(8, '0');
  const khach = async (vi = 0) => {
    const sdt = sdtMoi();
    await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + sdt, getNow()]);
    if (vi) await goi('POST', '/pos/wallets/topup', { phone: sdt, amount: vi });
    await goi('POST', '/pos/thanh-toan/pin', { phone: sdt, pin: PIN_KH, pin_lai: PIN_KH });
    return sdt;
  };
  const chinh = (sdt, amount, pin, reason = 'thử TIEN-KHOA-2') => goi('POST', '/pos/wallets/adjust',
    { phone: sdt, amount, customer_name: 'K', reason, ...(pin !== undefined ? { pin } : {}) });
  const pinRow = () => db.queryOne('SELECT sai, khoa_den FROM pos_pin_chu_quan WHERE id = 1');
  const datPin = async () => db.run(`INSERT OR REPLACE INTO pos_pin_chu_quan (id, pin_bam, sai, khoa_den, dat_boi, dat_luc) VALUES (1, ?, 0, NULL, 'thu_tk2', ?)`,
    [await bcrypt.hash(PIN_CQ, 4), getNow()]);
  const moKhoaPin = () => db.run('UPDATE pos_pin_chu_quan SET sai = 0, khoa_den = NULL WHERE id = 1');
  const donDb = (id) => db.queryOne('SELECT * FROM pos_orders WHERE id = ?', [id]);
  const soDoi = (id) => soCh("SELECT COUNT(*) AS n FROM pos_order_log WHERE order_id = ? AND loai = 'doi'", [id]);
  const donTienMat = async () => (await goi('POST', '/pos/orders', { items: [mon()], payment_method: 'cash', cash_amount: 25000, cash_received: 25000 })).j.order?.id;
  const donCk = async () => {
    const p = (await goi('POST', '/pos/thanh-toan/phien', { cach: 'ck_tay', don: { items: [mon()] } })).j.phien;
    const x = await goi('POST', `/pos/thanh-toan/phien/${p?.id}/xac-nhan-tay`, { ly_do: 'Khách đưa màn hình chuyển khoản' });
    return { r: x, id: x.j.order?.id };
  };
  const donNo = async (sdt, no = 25000, cach = 'debt') => {
    imLang();
    const r = await donCu(MAY_CHU, { ...(sdt ? { customer_phone: sdt, customer_name: 'K' } : {}), items: [mon()], payment_method: cach, debt_amount: no,
      ...(cach === 'debt' ? { due_date: '2026-12-31' } : {}) }).finally(noiLai);
    if (r.status !== 200) throw new Error('không dựng được đơn nợ cũ: HTTP ' + r.status + ' ' + JSON.stringify(r.body).slice(0, 120));
    return r.body.order.id;
  };
  const thuNo = (id, payment_method, amount) => goi('POST', `/pos/orders/${id}/pay-debt`, { payment_method, ...(amount ? { amount } : {}) });
  const doiSoat = async () => { imLang(); try { return await chayDoiSoat({ kieu: 'ngay' }, {}); } finally { noiLai(); } };

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A1] trừ tay /wallets/deduct — bỏ hẳn');
  await chay('A1', async () => {
    const kh = await khach(50000);
    await caChan('A1 chủ quán POST /wallets/deduct 10.000', () => goi('POST', '/pos/wallets/deduct', { phone: kh, amount: 10000 }), 404, undefined,
      async () => ((await soDu(kh)) === 50000 ? '' : 'số dư ' + await soDu(kh)));
  });

  muc('[A2] điều chỉnh ví /wallets/adjust — PIN chủ quán');
  await chay('A2', async () => {
    const kh = await khach(50000);
    await caChan('A2c chưa đặt PIN chủ quán, điều chỉnh +10.000 có gửi PIN', () => chinh(kh, 10000, PIN_CQ), 400, 'CHUA_CO_PIN_CHU_QUAN');
    await datPin();
    await caChan('A2a thiếu PIN, điều chỉnh +10.000', () => chinh(kh, 10000), 400, 'PIN_CHU_QUAN_SAI');
    await caChan('A2a2 thiếu PIN, điều chỉnh −10.000', () => chinh(kh, -10000), 400, 'PIN_CHU_QUAN_SAI');
    await caChan('A2b sai PIN, điều chỉnh +10.000', () => chinh(kh, 10000, '1111'), 400, 'PIN_CHU_QUAN_SAI');
    await moKhoaPin();
    for (let i = 0; i < 5; i++) await chinh(kh, 10000, '1111');
    await caChan('A2d sai PIN 5 lần → lần 6 PIN ĐÚNG vẫn bị khoá', () => chinh(kh, 10000, PIN_CQ), 423, 'PIN_CHU_QUAN_KHOA');
    await moKhoaPin();
    const t0 = await pinRow();
    await caChan('A2g lý do < 3 ký tự + PIN sai → lỗi lý do, KHÔNG tốn lượt PIN', () => chinh(kh, 10000, '1111', 'ab'), 400, undefined,
      async () => { const t = await pinRow(); return t.sai === t0.sai ? '' : `sai ${t0.sai} → ${t.sai}`; });
    // A2e: phần đang giữ cho phiên thanh toán không tiêu được (số KHẢ DỤNG).
    const g = await khach(30000);
    const ph = await goi('POST', '/pos/thanh-toan/phien', { cach: 'tai_khoan', don: { customer_phone: g, customer_name: 'K', items: [mon()] }, tru_tai_khoan: true, pin: PIN_KH });
    await caChan(`A2e PIN đúng, trừ 10.000 khi 25.000 / 30.000 đang giữ cho phiên (${moTa(ph)})`, () => chinh(g, -10000, PIN_CQ), 400, 'SO_DU_KHONG_DU');
    // A2f + K5-1: chủ quán cộng tay có PIN đúng (khách riêng — không phụ thuộc kết quả các ca chặn ở trên).
    const kh2 = await khach(50000);
    const dong0 = await soCh('SELECT COALESCE(MAX(id), 0) AS n FROM pos_balance_transactions');
    const f = await chinh(kh2, 10000, PIN_CQ, 'Bù khách thiếu tiền thối');
    const d = await db.queryOne('SELECT * FROM pos_balance_transactions WHERE id > ? ORDER BY id', [dong0]);
    const soDong = await soCh('SELECT COUNT(*) AS n FROM pos_balance_transactions WHERE id > ?', [dong0]);
    k('A2f (K5) PIN đúng cộng +10.000 → 200, số dư 60.000, ĐÚNG MỘT dòng sổ adjust đủ người · lý do · giờ VN', la(f, 200) && (await soDu(kh2)) === 60000
      && soDong === 1 && d?.type === 'adjust' && Number(d?.amount) === 10000 && d?.created_by === chu.username && d?.notes === 'Bù khách thiếu tiền thối'
      && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(String(d?.created_at)), `${moTa(f)} · ${await soDu(kh2)} · ${soDong} dòng · ${JSON.stringify(d)?.slice(0, 160)}`);
    const tr = await chinh(kh2, -20000, PIN_CQ, 'Thu lại khoản cộng nhầm');
    k('A2f2 (K5) PIN đúng trừ −20.000 trong số khả dụng → 200, số dư 40.000', la(tr, 200) && (await soDu(kh2)) === 40000, `${moTa(tr)} · ${await soDu(kh2)}`);
    // A2h: hai người cùng bấm.
    const h = await khach(30000);
    const t1 = await vet();
    const [x1, x2] = await Promise.all([chinh(h, -30000), chinh(h, 30000)]);
    k('A2h1 hai lệnh KHÔNG PIN cùng lúc (trừ + cộng) → cả hai 400 PIN_CHU_QUAN_SAI, không ghi gì', la(x1, 400, 'PIN_CHU_QUAN_SAI') && la(x2, 400, 'PIN_CHU_QUAN_SAI')
      && (await vet()) === t1, `${moTa(x1)} / ${moTa(x2)}`);
    await moKhoaPin();
    const ra = await Promise.all([chinh(h, -30000, PIN_CQ), chinh(h, -30000, PIN_CQ)]);
    const st = ra.map((r) => r.status).sort().join(',');
    k('A2h2 hai người cùng trừ hết số dư 30.000 (PIN đúng cả hai) → một 200 + một 400 SO_DU_KHONG_DU, số dư 0', st === '200,400'
      && ra.some((r) => la(r, 400, 'SO_DU_KHONG_DU')) && (await soDu(h)) === 0, `${ra.map(moTa).join(' / ')} · ${await soDu(h)}`);
    const ds = await doiSoat();
    const dc = (ds.can_xem || []).filter((l) => l.bat_bien === 'DC' && l.mo_ta.includes(kh2) && l.mo_ta.includes('Bù khách thiếu tiền thối'));
    k('A2j Đối soát hôm nay: dòng CẦN XEM "DC" cho lần điều chỉnh (SĐT + lý do + người), không ĐỎ', dc.length === 1 && dc[0].mo_ta.includes(chu.username)
      && !(ds.do || []).some((l) => l.bat_bien === 'DC'), JSON.stringify((ds.can_xem || []).filter((l) => l.bat_bien === 'DC')).slice(0, 200));
  });

  muc('[A3] đổi cách trả');
  await chay('A3', async () => {
    const id = await donTienMat();
    await caChan('A3a bill tiền mặt trong ngày đổi sang chuyển khoản', () => goi('POST', `/pos/orders/${id}/doi-cach-tra`, { sang: 'transfer', ly_do: 'khách chuyển khoản lại' }),
      409, 'DOI_SANG_CK_PHAI_QUA_QR', async () => { const o = await donDb(id); return Number(o.cash_amount) === 25000 && Number(o.transfer_amount || 0) === 0 ? '' : JSON.stringify(o); });
    const ck = await donCk();
    const b = await goi('POST', `/pos/orders/${ck.id}/doi-cach-tra`, { sang: 'cash', ly_do: 'khách trả lại tiền mặt' });
    const o = await donDb(ck.id);
    k('A3b (K5) bill chuyển khoản đổi sang tiền mặt → 200, tiền mặt 25.000 · CK 0, một dòng nhật ký doi', la(ck.r, 200) && la(b, 200)
      && Number(o?.cash_amount) === 25000 && Number(o?.transfer_amount || 0) === 0 && (await soDoi(ck.id)) === 1, `${moTa(ck.r)} · ${moTa(b)} · ${JSON.stringify(o)?.slice(0, 80)}`);
    const ds = await doiSoat();
    const dc = (ds.can_xem || []).filter((l) => l.bat_bien === 'DC' && l.mo_ta.includes(o?.code) && l.mo_ta.includes('khách trả lại tiền mặt'));
    k('A3c Đối soát hôm nay: dòng CẦN XEM "DC" cho lần đổi CK → tiền mặt (mã đơn + lý do + người)', dc.length === 1 && dc[0].mo_ta.includes(chu.username),
      JSON.stringify((ds.can_xem || []).filter((l) => l.bat_bien === 'DC')).slice(0, 200));
  });

  muc('[A4] thu nợ đơn cũ');
  await chay('A4', async () => {
    const kh = await khach(0);
    const no = await donNo(kh);
    await caChan('A4a đơn NỢ cũ thu bằng chuyển khoản', () => thuNo(no, 'transfer', 25000), 400, 'THU_NO_CK_PHAI_QR',
      async (r) => (r.j.error === LOI_THU_NO ? '' : 'lời: ' + r.j.error));
    const ct = await donNo(null, 25000, 'cho_thu');
    await caChan('A4b bill chờ thu (cho_thu) thu bằng chuyển khoản', () => thuNo(ct, 'transfer'), 400, 'THU_NO_CK_PHAI_QR');
    await caChan('A4c cách trả lạ "the"', () => thuNo(no, 'the'), 400, 'CACH_TRA_LA');
    const ct2 = await donNo(null, 25000, 'cho_thu');
    const tc = await thuNo(ct2, 'cash');
    k('A4f (K5) bill chờ thu thu tiền mặt → 200 paid', la(tc, 200) && (await donDb(ct2))?.payment_status === 'paid', moTa(tc));
    // K5-3: thu một phần rồi đủ bằng tiền mặt, điểm cộng khi đủ.
    const kh3 = await khach(0);
    const no3 = await donNo(kh3);
    const d0 = await soCh('SELECT COUNT(*) AS n FROM pos_point_transactions WHERE customer_phone = ?', [kh3]);
    const p1 = await thuNo(no3, 'cash', 10000);
    const p2 = await thuNo(no3, 'cash', 15000);
    const o = await donDb(no3);
    const d1 = await soCh('SELECT COUNT(*) AS n FROM pos_point_transactions WHERE customer_phone = ?', [kh3]);
    k('A4g (K5) đơn nợ cũ thu tiền mặt 10.000 rồi 15.000 → partial rồi paid, tiền mặt 25.000, nợ 0, có điểm khi đủ', la(p1, 200) && p1.j.data?.payment_status === 'partial'
      && la(p2, 200) && o?.payment_status === 'paid' && Number(o?.cash_amount) === 25000 && Number(o?.debt_amount) === 0 && d1 > d0,
    `${moTa(p1)} · ${moTa(p2)} · ${o?.payment_status} · tm ${o?.cash_amount} · nợ ${o?.debt_amount} · điểm ${d0} → ${d1}`);
    // A4d: hai người cùng bấm.
    const n2 = await donNo(kh);
    const ra = await Promise.all([thuNo(n2, 'cash'), thuNo(n2, 'cash')]);
    const st = ra.map((r) => r.status).sort().join(',');
    const o2 = await donDb(n2);
    k('A4d1 hai người cùng thu tiền mặt một đơn nợ → một 200 + một 409 DA_THU_ROI (hoặc 400 đã thu đủ), tiền mặt cộng đúng một lần',
      (st === '200,409' || st === '200,400') && ra.some((r) => r.j.code === 'DA_THU_ROI') && Number(o2?.cash_amount) === 25000, `${ra.map(moTa).join(' / ')} · tm ${o2?.cash_amount}`);
    const n3 = await donNo(kh);
    const rb = await Promise.all([thuNo(n3, 'transfer'), thuNo(n3, 'cash')]);
    const o3 = await donDb(n3);
    k('A4d2 cùng lúc một người thu CK, một người thu tiền mặt → CK 400 THU_NO_CK_PHAI_QR, tiền mặt 200; CK 0, tiền mặt 25.000', la(rb[0], 400, 'THU_NO_CK_PHAI_QR')
      && la(rb[1], 200) && Number(o3?.transfer_amount || 0) === 0 && Number(o3?.cash_amount) === 25000, `${rb.map(moTa).join(' / ')} · ${JSON.stringify(o3)?.slice(0, 80)}`);
  });

  muc('[K5] bán hàng qua phiên không đổi');
  await chay('K5', async () => {
    const kh = await khach(100000);
    const p = (await goi('POST', '/pos/thanh-toan/phien', { cach: 'tai_khoan', don: { customer_phone: kh, customer_name: 'K', items: [mon()] }, tru_tai_khoan: true, pin: PIN_KH })).j.phien;
    const c = await goi('POST', `/pos/thanh-toan/phien/${p?.id}/chot`, {});
    k('K5-4a phiên tài khoản + PIN khách → chốt 200, số dư còn 75.000', la(c, 200) && (await soDu(kh)) === 75000, `${moTa(c)} · ${await soDu(kh)}`);
    const ck = await donCk();
    const o = await donDb(ck.id);
    k('K5-4b phiên chuyển khoản xác nhận tay → 200, đơn CK 25.000', la(ck.r, 200) && Number(o?.transfer_amount) === 25000, moTa(ck.r));
    const nap = await goi('POST', '/pos/wallets/topup', { phone: kh, amount: 20000 });
    k('K5-5 nạp tay /wallets/topup không đổi → 200, số dư 95.000', la(nap, 200) && (await soDu(kh)) === 95000, `${moTa(nap)} · ${await soDu(kh)}`);
  });

  sv.close();
}

main().catch((e) => { noiLai(); console.error('Bài thử sập:', e); hong++; }).finally(() => {
  noiLai();
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* — */ }
  console.log(`\nTIEN-KHOA-2: ${dat} đạt · ${hong} hỏng`);
  process.exit(hong ? 1 : 0);
});
