#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ HD-KH-1 — App KH xem hoá đơn ĐÚNG mẫu quầy (GET /api/kh/don/:ma → hoa_don[]) + cach_tra / giu_vi / con_lai của đơn App
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có hoa_don, cach_tra, giu_vi, con_lai ở /kh/don). Chạy ở GỐC kho POS: node cong_cu/thu_HDKH1.js
 *  --goc <thư mục>: chạy trên bản sao cây kho (đột biến, viec/HD-KH-1/dot_bien.py). Mặc định: cây chứa file này.
 *
 *  Khuôn thu_KHMUA1.js (kho thử libsql thật, payOS giả 127.0.0.1). Bản so: hoa_don[] của App so với tờ khách của HÀM QUẦY
 *  (client/src/utils/hoaDon.js) dựng từ GET /api/pos/hoa-don/:id của CÙNG đơn + cùng cài đặt — bài tự duyệt cây tờ theo thứ tự
 *  HoaDonTo vẽ (viết riêng, không gọi detTo của máy chủ).
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const iG = process.argv.indexOf('--goc');
const GOC = path.resolve(iG > 0 ? process.argv[iG + 1] : path.join(__dirname, '..'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_hdkh1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_hdkh1_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_hdkh1_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.hdkh1.local/tra-ve';

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

/** Cây tờ của hàm quầy → danh sách chữ theo thứ tự HoaDonTo vẽ (viết riêng, độc lập với detTo). Mỗi phần tử: [loai, trai, phai, gach, ghi_chu, dam]. */
function chuCuaTo(to) {
  const d = to.dau, o = [];
  const them = (...a) => o.push(a);
  const tieuDe = (x) => x.khoa.startsWith('tieu_de');
  if (to.canh_bao) them('canh_bao', to.canh_bao, '', '', '', true);
  them('ten_quan', d.ten_quan, '', '', '', true);
  if (d.dia_chi) them('dia_chi', d.dia_chi, '', '', '', false);
  them('so_bill', d.chu_so_bill, String(d.so_bill), '', '', true);
  if (to.nhan) them('nhan', to.nhan, '', '', '', true);
  them('gio', d.gio, d.nhan_vien ? (d.nhan_nv ? d.nhan_nv + ': ' : '') + d.nhan_vien : '', '', '', false);
  them('khach', d.nhan_khach, d.khach, '', '', true);
  for (const m of to.mon) them('mon', `${m.sl} x ${m.ten}`, m.tien, m.tien_goc, m.ghi_chu, false);
  for (const x of to.tien) them(x.khoa, x.ten, x.tien, '', '', !!x.dam);
  for (const x of [...to.thanh_toan, ...to.diem]) them(tieuDe(x) ? 'tieu_de' : x.khoa, x.ten, tieuDe(x) ? '' : x.tien, '', '', !!x.dam);
  for (const c of to.chan) them('chan', c.chu, '', '', '', false);
  return o;
}
const CHU_DONG = ['loai', 'trai', 'phai', 'dam', 'gach', 'ghi_chu'];

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
    ['thanh_toan_payos_bat_buoc', '0'], ['store_name', 'Quán Thử HDKH'], ['store_address', 'Số 1 Phố Thử'], ['invoice_kh_url', 'https://app.thu.vn/?ma={ma}']]) await datCaiDat(a, b);
  const sps = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 3');
  for (let i = 0; i < 3; i++) await db.run('UPDATE pos_products SET price = ?, ton_gan_nhat = NULL WHERE id = ?', [[25000, 30000, 20000][i], sps[i].id]);
  const ma = (i) => `${sps[i].sx_product_type}_${sps[i].sx_product_id}`;
  const monQuay = (i, sl = 1, ghi) => ({ product_id: sps[i].id, sx_product_type: sps[i].sx_product_type, sx_product_id: sps[i].sx_product_id, quantity: sl, ...(ghi ? { note: ghi } : {}) });

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
    const sdt = '09' + String(61000000 + (++soSdt)).padStart(8, '0');
    const id = Number((await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + sdt, getNow()])).lastInsertRowid);
    if (napVi) await goi('POST', '/pos/wallets/topup', { phone: sdt, amount: napVi }, tkChu);
    if (pin) await goi('POST', '/pos/thanh-toan/pin', { phone: sdt, pin, pin_lai: pin }, tkChu);
    return { sdt, id, tk: kyTokenKhach(id) };
  };
  let soKhoa = 0;
  const khoaMoi = () => 'khoa-thu-' + String(++soKhoa).padStart(8, '0') + '-' + ngauNhien().slice(0, 6);
  const gio = (mon = [{ ma: ma(0), so_luong: 2, ghi_chu: 'ít đá' }]) => ({ mon, cach_nhan: 'tai_quan' });
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
    const tinh = await goi('POST', '/pos/orders/tinh-thu', { customer_phone: kh.sdt, ...than }, tkChu);   // quầy trả đúng tổng: lấy tổng từ máy chủ
    const r = await goi('POST', '/pos/orders', { payment_method: 'cash', cash_amount: tinh.j.total, customer_phone: kh.sdt, customer_name: 'Chị Hoa', ...than }, tkChu);
    if (!r.j.order) logGoc('  (đơn quầy không tạo được)', r.status, r.tho.slice(0, 200));
    return r.j.order;
  };

  const hangId = Number((await db.run(`INSERT INTO pos_membership_tiers (name, card_price, discount_percent, special_discount_percent, sort_order, is_active)
    VALUES ('Vàng thử', 1000, 10, 5, 9, 1)`)).lastInsertRowid);
  const choHang = (sdt) => db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
    VALUES (?, ?, 'Vàng thử', 1000, NULL, ?, datetime('now', '+7 hours', '+300 days'))`, [sdt, hangId, getNow()]);
  await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, usage_limit, used_count, is_active) VALUES ('THUHDKH', 'fixed', 5000, 0, 0, 1)`);
  const P = await import(pathToFileURL(path.join(GOC, 'client', 'src', 'utils', 'hoaDon.js')).href);

  /** So hoa_don[] của App với tờ khách của hàm quầy trên cùng đơn + cùng cài đặt. */
  const soVoiQuay = async (ten, kh, oid, maKh) => {
    const ct = await goi('GET', `/kh/don/${maKh}`, undefined, kh.tk);
    const hd = await goi('GET', `/pos/hoa-don/${oid}`, undefined, tkChu);
    const caiDat = {};
    for (const r of await db.query("SELECT key, value FROM pos_settings WHERE key LIKE 'invoice%' OR key IN ('store_name','store_address','store_phone')")) caiDat[r.key] = r.value;
    const mong = chuCuaTo(P.dungHoaDon(hd.j.hoa_don, caiDat, { lien: 'khach' })).map(([loai, trai, phai, gach, ghi, dam]) => ({ loai, trai, phai, dam, gach, ghi_chu: ghi }));
    const co = ct.j.don?.hoa_don;
    const duKhoa = Array.isArray(co) && co.every((d) => bang(Object.keys(d), CHU_DONG));
    k(`${ten}: hoa_don[] ${mong.length} dòng, đủ 6 trường, GIỐNG HỆT tờ khách của hàm quầy (từng dòng)`, ct.status === 200 && duKhoa && bang(co, mong),
      `HTTP ${ct.status} · app ${JSON.stringify(co)?.slice(0, 260)} · quầy ${JSON.stringify(mong).slice(0, 260)}`);
    return co || [];
  };

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] hoa_don[] của GET /kh/don/:ma giống hệt tờ giao khách của quầy (≥ 6 loại đơn)');
  await chay('A', async () => {
    const kh = await khach(50000);
    await choHang(kh.sdt);
    const kLe = await khach(0, null);
    const o1 = await quay(kLe, { items: [monQuay(0, 2, 'ít đá'), monQuay(1, 1)] });
    const dong1 = await soVoiQuay('A1 đơn thường (khách không hạng, có ghi chú ly)', kLe, o1.id, o1.code);
    k('A1b đơn thường: ghi chú ly ở dòng món, tổng đậm, có mục THANH TOÁN', dong1.some((d) => d.loai === 'mon' && d.ghi_chu === 'ít đá')
      && dong1.find((d) => d.loai === 'tong')?.dam === true && dong1.some((d) => d.loai === 'tieu_de'), JSON.stringify(dong1).slice(0, 200));
    const o2 = await quay(kh, { items: [monQuay(0, 2), monQuay(1, 1)] });
    const d2 = await soVoiQuay('A2 đơn giá hạng', kh, o2.id, o2.code);
    k('A2b đơn hạng: có dòng giam_hang và món có giá gạch (gach)', d2.some((d) => d.loai === 'giam_hang') && d2.some((d) => d.loai === 'mon' && d.gach !== ''));
    const kMa = await khach(0, null);
    const o3 = await quay(kMa, { items: [monQuay(0, 2)], discount_code: 'THUHDKH' });
    const d3 = await soVoiQuay('A3 đơn mã giảm', kMa, o3.id, o3.code);
    k('A3b đơn mã giảm: có dòng giam_ma', d3.some((d) => d.loai === 'giam_ma'));
    const kPhi = await khach(0, null);
    const o4 = await quay(kPhi, { items: [monQuay(2, 1)] });
    await db.run('UPDATE pos_orders SET shipping_fee = 23000, total = total + 23000 WHERE id = ?', [o4.id]);
    const d4 = await soVoiQuay('A4 đơn có phí giao', kPhi, o4.id, o4.code);
    k('A4b đơn phí giao: có dòng phi_giao +23.000đ', d4.find((d) => d.loai === 'phi_giao')?.phai === '+23.000đ', JSON.stringify(d4.find((d) => d.loai === 'phi_giao')));
    const kHuy = await khach(0, null);
    const o5 = await quay(kHuy, { items: [monQuay(0, 1)] });
    await goi('PUT', `/pos/orders/${o5.id}/cancel`, { reason: 'thử HDKH1' }, tkChu);
    const d5 = await soVoiQuay('A5 đơn huỷ', kHuy, o5.id, o5.code);
    k('A5b đơn huỷ: dòng đầu là canh_bao "ĐƠN ĐÃ HUỶ"', d5[0]?.loai === 'canh_bao' && d5[0].trai === 'ĐƠN ĐÃ HUỶ', JSON.stringify(d5[0]));
    const kVq = await khach(10000);
    const r6 = await datApp(kVq, 'vi_qr', { pin: '1357' });
    await webhook(await phienCua(r6.j.ma_don));
    const oid6 = (await phienCua(r6.j.ma_don)).order_id;
    const d6 = await soVoiQuay('A6 đơn App ví + QR (đã trả)', kVq, oid6, r6.j.ma_don);
    k('A6b đơn ví + QR: có dòng tu_tk và ck (hai cách trả)', d6.some((d) => d.loai === 'tu_tk') && d6.some((d) => d.loai === 'ck'), d6.map((d) => d.loai).join());
    const d6b = await soVoiQuay('A6c cùng đơn đọc bằng mã bill (không chỉ mã App)', kVq, oid6, (await db.queryOne('SELECT code FROM pos_orders WHERE id = ?', [oid6])).code);
    k('A6d mã App và mã bill ra cùng một hoa_don', bang(d6, d6b));
    await datCaiDat('invoice_chu_cam_on', 'Hẹn gặp lại {ten_khach}!'); await datCaiDat('invoice_an_chinh_sach', 'true'); await datCaiDat('invoice_chu_ten_quan', 'TIỆM THỬ');
    const dChu = await soVoiQuay('A7 chữ quán sửa ở Cài đặt hoá đơn hiện y như tờ in', kLe, o1.id, o1.code);
    k('A7b chữ sửa: tên quán "TIỆM THỬ", lời cảm ơn tự điền tên, chính sách ẩn', dChu[0]?.trai === 'TIỆM THỬ' && dChu.some((d) => d.loai === 'chan' && d.trai.startsWith('Hẹn gặp lại') && d.trai.includes('Chị Hoa'))
      && !dChu.some((d) => d.trai.startsWith('Ly có vấn đề')), JSON.stringify(dChu.filter((d) => d.loai === 'chan')));
    const chuoi = JSON.stringify(dChu) + JSON.stringify(d6) + JSON.stringify(d3);
    k('A8 tờ (có dòng) KHÔNG chứa mã nhận điểm "TQD-", SĐT đầy đủ của khách, hay địa chỉ QR', dChu.length > 0 && d6.length > 0 && d3.length > 0 && !/TQD-/.test(chuoi) && !chuoi.includes(kLe.sdt) && !chuoi.includes('app.thu.vn')
      && !dChu.some((d) => d.loai === 'qr' || d.loai === 'ma_diem'));
    await datCaiDat('invoice_chu_cam_on', ''); await datCaiDat('invoice_an_chinh_sach', 'false'); await datCaiDat('invoice_chu_ten_quan', 'TỨ QUÝ ĐƯỜNG');
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] cach_tra / giu_vi / con_lai (GET /kh/don/:ma và từng đơn của GET /kh/don)');
  await chay('B', async () => {
    const dung = async (ten, kh, r, cachTra, giu, conLai) => {
      const ct = await goi('GET', `/kh/don/${r.j.ma_don}`, undefined, kh.tk);
      const ds = await goi('GET', '/kh/don', undefined, kh.tk);
      const trongDs = (ds.j.data || []).find((d) => d.ma === r.j.ma_don);
      const ok = (x) => x?.cach_tra === cachTra && x.giu_vi === giu && x.con_lai === conLai;
      k(`${ten}: /don/:ma và /don cùng cach_tra="${cachTra}", giu_vi=${giu}, con_lai=${conLai}`, ok(ct.j.don) && ok(trongDs),
        `ct ${JSON.stringify([ct.j.don?.cach_tra, ct.j.don?.giu_vi, ct.j.don?.con_lai])} · ds ${JSON.stringify([trongDs?.cach_tra, trongDs?.giu_vi, trongDs?.con_lai])}`);
      return ct;
    };
    const kQr = await khach(0, null);
    const rQr = await datApp(kQr, 'qr');
    k('B0 POST /don trả giu_vi / con_lai (hành vi cũ giữ nguyên)', rQr.j.giu_vi === 0 && rQr.j.con_lai === 50000, JSON.stringify([rQr.status, rQr.j.giu_vi, rQr.j.con_lai, rQr.j.code]));
    await dung('B1 QR thuần (đang chờ trả)', kQr, rQr, 'qr', 0, 50000);
    const kVi = await khach(100000);
    const rVi = await datApp(kVi, 'vi', { pin: '1357' });
    await dung('B2 ví đủ (đã trả)', kVi, rVi, 'vi', 50000, 0);
    const kVq = await khach(20000);
    const rVq = await datApp(kVq, 'vi_qr', { pin: '1357' });
    k('B3a POST /don ví + QR giữ 20.000 · còn 30.000', rVq.j.giu_vi === 20000 && rVq.j.con_lai === 30000, JSON.stringify([rVq.status, rVq.j.giu_vi, rVq.j.con_lai, rVq.j.code]));
    await dung('B3 ví + QR (chờ quét)', kVq, rVq, 'vi_qr', 20000, 30000);
    await webhook(await phienCua(rVq.j.ma_don));
    await dung('B4 ví + QR sau khi quét xong (tải lại vẫn biết)', kVq, rVq, 'vi_qr', 20000, 30000);
    const kLe = await khach(0, null);
    const q = await quay(kLe, { items: [monQuay(0, 1)] });
    const ct = await goi('GET', `/kh/don/${q.code}`, undefined, kLe.tk);
    const ds = await goi('GET', '/kh/don', undefined, kLe.tk);
    const dq = (ds.j.data || []).find((d) => d.ma === q.code);
    k('B5 đơn quầy: cach_tra / giu_vi / con_lai đều null (cả /don/:ma lẫn /don)', [ct.j.don, dq].every((x) => x && x.cach_tra === null && x.giu_vi === null && x.con_lai === null),
      JSON.stringify([ct.j.don?.cach_tra, dq?.cach_tra]));
    const ctCho = await goi('GET', `/kh/don/${rQr.j.ma_don}`, undefined, kQr.tk);
    k('B7 đơn App đang chờ trả: hoa_don=[] (chưa có đơn thật), mon[] vẫn đủ', bang(ctCho.j.don?.hoa_don, []) && ctCho.j.don?.mon?.length === 1, JSON.stringify(ctCho.j.don?.hoa_don));
    const huy = await goi('POST', `/kh/don/${rQr.j.ma_don}/huy`, {}, kQr.tk);
    const hct = await goi('GET', `/kh/don/${rQr.j.ma_don}`, undefined, kQr.tk);
    k('B6 đơn App chưa trả rồi huỷ: vẫn cach_tra="qr", hoa_don=[]', huy.status === 200 && hct.j.don?.cach_tra === 'qr' && bang(hct.j.don?.hoa_don, []), JSON.stringify(hct.j.don));
    // K5: trường cũ của /don/:ma giữ nguyên
    const CU = ['ma', 'ngay', 'tong', 'da_tra', 'trang_thai', 'thanh_toan', 'tien_trinh', 'qr', 'tien_ve_cho_doi_soat', 'mon'];
    const MON = ['ma', 'ten', 'so_luong', 'don_gia', 'thanh_tien', 'ghi_chu'];
    k('K5 trường cũ của /don/:ma + mon[] còn đủ, đúng giá trị (đơn quầy 25.000; đơn App 2 ly)', [ct.j.don, hct.j.don].every((d) => d && CU.every((f) => f in d) && d.mon.every((m) => MON.every((f) => f in m)))
      && ct.j.don.tong === 25000 && hct.j.don.mon[0].so_luong === 2);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] khách A không đọc được đơn của khách B');
  await chay('C', async () => {
    const a = await khach(0, null), b = await khach(0, null), c = await khach(0, null);
    const oa = await quay(a, { items: [monQuay(0, 1)] });
    const ra = await datApp(c, 'qr');
    const xemA = await goi('GET', `/kh/don/${oa.code}`, undefined, b.tk);
    const xemApp = await goi('GET', `/kh/don/${ra.j.ma_don}`, undefined, b.tk);
    k('C1 khách B đọc đơn quầy của khách A → 404 KHONG_THAY_DON, không có hoa_don', xemA.status === 404 && xemA.j.code === 'KHONG_THAY_DON' && !/hoa_don/.test(xemA.tho), `HTTP ${xemA.status} ${xemA.tho.slice(0, 120)}`);
    k('C2 khách B đọc đơn App của người khác → 404 KHONG_THAY_DON', xemApp.status === 404 && xemApp.j.code === 'KHONG_THAY_DON');
    const ok = await goi('GET', `/kh/don/${oa.code}`, undefined, a.tk);
    k('C3 chính khách A đọc được (không chặn oan)', ok.status === 200 && Array.isArray(ok.j.don?.hoa_don) && ok.j.don.hoa_don.length > 0);
    const chuoiB = JSON.stringify((await goi('GET', '/kh/don', undefined, b.tk)).j);
    k('C4 danh sách đơn của B không có đơn / SĐT của A', !chuoiB.includes(oa.code) && !chuoiB.includes(a.sdt));
    const khongToken = await goi('GET', `/kh/don/${oa.code}`);
    k('C5 không token → 401', khongToken.status === 401);
  });

  logGoc(`\nSỐ CA: ${soCa}`);
  logGoc(`\n${hong ? '✗' : '✓'} ${dat} đạt · ${hong} hỏng`);
  svGia.close(); sv.close();
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ */ }
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { noiLai(); console.error('BÀI THỬ SẬP:', e); process.exit(2); });
