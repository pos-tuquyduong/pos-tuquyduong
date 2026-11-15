#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KH-NAP-1 — khách tự nạp trên App (dòng nạp trong đơn App, GET /goi-nap, GET /vi) + thẻ hạng / nạp CHỈ trả tiền thật (quầy + App)
 *  + tiền QR về muộn của đơn App chỉ thẻ / chỉ nạp vẫn ĐỦ quyền lợi (chủ quán 14.11); hợp đồng /api/kh v17
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (gốc từ chối dòng nạp → YEU_CAU_KHONG_HOP_LE; chưa có /goi-nap, /vi; thẻ trả số dư được). Xanh ngay = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KHNAP1.js   [--may-chu <bản sao server/>]  (đột biến viec/KH-NAP-1/dot_bien.py)
 *
 *  Khuôn thu_KHTHE1.js: database.js + libsql thật trên kho TẠM (chỉ thay ketNoiKho — P8), SX tắt, payOS giả trên 127.0.0.1, webhook ký bằng công
 *  thức viết riêng trong bài. Thời gian trôi = lùi cột giờ trong kho tạm. So HTTP status + `code`; lời báo chỉ so ở chỗ phiếu chốt câu chữ.
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khnap1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_khnap1_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_khnap1_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.khnap1.local/tra-ve';

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
const CAU_THE = 'Thẻ hội viên chỉ trả tiền mặt (ở quầy) hoặc chuyển khoản — không trừ số dư tài khoản';   // phiếu B2

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  const { getNow } = require(path.join(MAY_CHU, 'utils', 'helpers.js'));
  await db.initDatabase();
  // Soát vòng 2 (nghi ngờ 1): chen một dòng báo CÙNG khoá đúng lúc giữa phép kiểm khoá (ngoài giao dịch) và giao dịch chốt — như bản sao thứ hai của cổng
  // vừa ghi xong. chenKhoa = { khoa, ma } → ghi một lần ở lần mở giao dịch kế tiếp.
  let chenKhoa = null;
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    if (chenKhoa) {
      const c = chenKhoa; chenKhoa = null;
      await db.run(`INSERT INTO pos_payos_su_kien (khoa, ma_payos, so_tien, ket_qua, ly_do, du_lieu, luc) VALUES (?, ?, ?, 'vao_vi', 'bản sao chen (bài thử)', '{}', ?)`,
        [c.khoa, c.ma, c.so_tien, getNow()]);
    }
    return txGoc(...a);
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

  const R = (f) => path.join(MAY_CHU, 'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/wallets', require(R('wallets.js')));
  app.use('/api/pos/refunds', require(R('refunds.js')));
  app.use('/api/pos/damages', require(R('damages.js')));
  app.use('/api/pos/reports', require(R('reports.js')));
  const tt = require(R('thanh-toan.js'));
  app.use('/api/pos/thanh-toan', tt);
  app.use('/api/payos/webhook', tt.webhook);
  app.use('/api/pos/kh', require(R('kh/quay.js')));
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const { kyTokenKhach } = require(path.join(MAY_CHU, 'middleware', 'khachAuth.js'));
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
  for (const [i, g] of [[0, 25000], [1, 30000]]) await db.run('UPDATE pos_products SET price = ?, ton_gan_nhat = NULL WHERE id = ?', [g, sps[i].id]);
  const ma = (i) => `${sps[i].sx_product_type}_${sps[i].sx_product_id}`;
  const monQuay = (i, sl = 1) => ({ product_id: sps[i].id, sx_product_type: sps[i].sx_product_type, sx_product_id: sps[i].sx_product_id, quantity: sl });
  const taoGoi = async (ten, tra, vao, bat = 1, thuTu = 0) => Number((await db.run(`INSERT INTO pos_goi_nap (ten, khach_tra, vao_tk, is_active, thu_tu, created_at,
    updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'thu')`, [ten, tra, vao, bat, thuTu, getNow(), getNow()])).lastInsertRowid);
  const G1 = await taoGoi('Nạp 100k', 100000, 105000, 1, 1);
  const G2 = await taoGoi('Nạp 200k', 200000, 220000, 1, 0);
  const GTAT = await taoGoi('Nạp tắt', 50000, 60000, 0, 0);
  const taoHang = async (ten, bac, goiHang, pt = 10) => Number((await db.run(`INSERT INTO pos_membership_tiers (name, card_price, discount_percent,
    special_discount_percent, sort_order, is_active, cach_co, goi) VALUES (?, 0, ?, 0, ?, 1, 'ban', ?)`, [ten, pt, bac, JSON.stringify(goiHang)])).lastInsertRowid);
  const VANG = await taoHang('Vàng thử', 62, [{ so_thang: 1, gia: 100000, bat: true }]);
  const KCB = await taoHang('Kim Cương bán thử', 63, [{ so_thang: 1, gia: 300000, bat: true }], 20);
  const GOI_TT = Number((await db.run("INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active) VALUES ('KN1G', 'Gói thử KN1', 300000, 'ly', 10, 1)"))
    .lastInsertRowid);
  await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active, discount_scope)
    VALUES ('KN1CHUNG', 'fixed', 5000, 0, 0, 0, 0, 1, 'order')`);

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
  const vi = async (sdt) => { const w = await db.queryOne('SELECT balance, thuong FROM pos_wallets WHERE phone = ?', [sdt]);
    return { so_du: Number(w?.balance || 0), thuong: Number(w?.thuong || 0) }; };
  const soThe = (sdt) => so('SELECT COUNT(*) AS n FROM pos_membership_purchases WHERE customer_phone = ?', [sdt]);
  const chup = async (sdt) => [await so('SELECT COUNT(*) AS n FROM pos_orders'), await so('SELECT COUNT(*) AS n FROM pos_don_app'),
    await so('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan'), await so("SELECT COUNT(*) AS n FROM pos_phien_thanh_toan WHERE trang_thai = 'cho'"),
    await so('SELECT COUNT(*) AS n FROM pos_membership_purchases'), (await vi(sdt)).so_du].join('/');
  const donApp = (maDon) => db.queryOne('SELECT * FROM pos_don_app WHERE ma = ?', [maDon]).catch(() => null);
  const phienCua = async (maDon) => { const a = await donApp(maDon); return a?.phien_id ? db.queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [a.phien_id]) : null; };
  const oidCua = async (maDon) => Number((await phienCua(maDon))?.order_id || 0);
  const lui = (bang, cot, dk, p, giay) => db.run(`UPDATE ${bang} SET ${cot} = strftime('%Y-%m-%dT%H:%M:%S', ${cot}, '-${giay} seconds') WHERE ${dk}`, p);
  const hangToi = async (kh) => (await goi('GET', '/kh/toi', undefined, kh.tk)).j.khach?.hang || null;
  const soDuToi = async (kh) => (await goi('GET', '/kh/toi', undefined, kh.tk)).j.khach?.so_du_vi;

  let soSdt = 0;
  const khach = async (napVi = 0, pin = '1357') => {
    const sdt = '09' + String(43000000 + (++soSdt)).padStart(8, '0');
    const id = Number((await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + sdt, getNow()])).lastInsertRowid);
    if (napVi) await goi('POST', '/pos/wallets/topup', { phone: sdt, amount: napVi }, tkChu);
    if (pin) await goi('POST', '/pos/thanh-toan/pin', { phone: sdt, pin, pin_lai: pin }, tkChu);
    return { sdt, id, tk: kyTokenKhach(id) };
  };
  let soKhoa = 0;
  const khoaMoi = () => 'khoa-nap-' + String(++soKhoa).padStart(8, '0') + '-' + ngauNhien().slice(0, 6);
  const nap = (maGoi = G1, them = {}) => ({ loai: 'nap', ma_goi: maGoi, ...them });
  const the = (hang = VANG, thang = 1) => ({ loai: 'the', hang_id: hang, so_thang: thang });
  const mon = (i, sl = 1) => ({ ma: ma(i), so_luong: sl });
  const gio = (dong, them = {}) => ({ mon: dong, cach_nhan: 'tai_quan', ...them });
  const baoGia = (kh, than) => goi('POST', '/kh/gio/bao-gia', than, kh.tk);
  const dat1 = async (kh, than, them = {}) => {
    let tong = them.tong_da_xem;
    if (tong === undefined) tong = (await baoGia(kh, than)).j.tong ?? 0;
    return goi('POST', '/kh/don', { ...than, khoa_gui: them.khoa_gui || khoaMoi(), cach_tra: 'qr', tong_da_xem: tong, ...them }, kh.tk);
  };
  let soRef = 0;
  const webhook = (p, them = {}) => {
    const data = { orderCode: p.ma_payos, amount: p.con_lai, description: p.noi_dung || 'x', accountNumber: '12345678', reference: 'REFN' + (++soRef),
      transactionDateTime: getNow().replace('T', ' '), currency: 'VND', paymentLinkId: 'pl_' + p.ma_payos, code: '00', desc: 'success',
      counterAccountBankId: '', counterAccountName: null, ...them };
    return goi('POST', '/payos/webhook', { code: '00', desc: 'success', success: true, data, signature: hmac(chuoiKy(data)) });
  };
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };
  const hhmm = (phut) => new Date(Date.parse(getNow() + 'Z') + phut * 60000).toISOString().slice(11, 16);
  const datLich = async (mo, dong) => {
    const lich = {}; for (const t of [2, 3, 4, 5, 6, 7, 8]) lich[t] = { mo, dong };
    await datCaiDat('gio_hd_lich', JSON.stringify(lich)); await datCaiDat('gio_hd_ngung_truoc_phut', 0);
  };
  const boLich = async () => { await datCaiDat('gio_hd_lich', ''); await datCaiDat('gio_hd_ngung_truoc_phut', 0); };
  const quay = (than) => goi('POST', '/pos/orders', { customer_name: 'K', ...than }, tkChu);
  const diemDon = (oid) => so('SELECT COALESCE(SUM(points), 0) AS n FROM pos_point_transactions WHERE order_id = ?', [oid]);
  const suKien = (p) => db.query('SELECT ket_qua, ly_do FROM pos_payos_su_kien WHERE ma_payos = ? ORDER BY id', [p.ma_payos]);
  /** Đặt đơn App nạp gói G1 bằng QR, trả { d, p } (phiên). */
  const datNap = async (kh, maGoi = G1) => { const d = await dat1(kh, gio([nap(maGoi)])); return { d, p: await phienCua(d.j.ma_don) }; };

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] Dòng nạp trong đơn App (A1–A4)');
  await chay('A', async () => {
    const kh = await khach(500000);
    const b1 = await baoGia(kh, gio([nap(G1)]));
    const d0 = b1.j.dong?.[0];
    k('A1 báo giá giỏ chỉ nạp → 200, tong = khach_tra 100.000 (giá máy chủ)', la(b1, 200) && b1.j.tong === 100000 && b1.j.tam_tinh === 100000, `${moTa(b1)} · ${b1.j.tong}`);
    k('A3 dòng nạp đúng 6 trường { loai "nap", ma_goi, ma null, so_luong 1, don_gia, thanh_tien }; giam[] rỗng', !!d0
      && bang(Object.keys(d0).sort(), ['don_gia', 'loai', 'ma', 'ma_goi', 'so_luong', 'thanh_tien']) && d0.loai === 'nap' && d0.ma_goi === G1 && d0.ma === null
      && d0.so_luong === 1 && d0.don_gia === 100000 && d0.thanh_tien === 100000 && bang(b1.j.giam, []), JSON.stringify(b1.j));
    const b1c = await baoGia(kh, gio([nap(G1, { so_luong: 1 })]));
    k('A1 so_luong 1 gửi rõ → 200 (không chặn oan)', la(b1c, 200) && b1c.j.tong === 100000, moTa(b1c));
    const sai = [nap(G1, { so_luong: 2 }), nap(0), nap('1'), nap(G1, { ma: ma(0) }), { loai: 'nap' }, nap(1.5)];
    const b1b = await Promise.all(sai.map((x) => baoGia(kh, gio([x]))));
    k('A1 so_luong 2 · ma_goi 0 · ma_goi chữ · khoá lạ · thiếu ma_goi · ma_goi lẻ → 400 YEU_CAU_KHONG_HOP_LE', b1b.every((r) => la(r, 400, 'YEU_CAU_KHONG_HOP_LE')),
      b1b.map(moTa).join(' / '));
    const truoc = await chup(kh.sdt);
    const g2 = [[gio([nap(G1), mon(0)]), 'NAP_KHONG_GOP', 'nạp + món'], [gio([nap(G1), the()]), 'NAP_KHONG_GOP', 'nạp + thẻ'],
      [gio([nap(G1), nap(G2)]), 'NAP_KHONG_GOP', 'hai dòng nạp'], [gio([nap(GTAT)]), 'GOI_NAP_KHONG_CO', 'gói tắt'], [gio([nap(987654)]), 'GOI_NAP_KHONG_CO', 'gói không có']];
    for (const [g, code, ten] of g2) {
      const b = await baoGia(kh, g), d = await dat1(kh, g, { tong_da_xem: 100000 });
      k(`A2 ${ten}: báo giá + POST /don → 400 ${code} (nguyên mã)`, la(b, 400, code) && la(d, 400, code), `${moTa(b)} / ${moTa(d)}`);
    }
    const dv = await dat1(kh, gio([nap(G1)]), { cach_tra: 'vi', pin: '1357', tong_da_xem: 100000 });
    const dvq = await dat1(kh, gio([nap(G1)]), { cach_tra: 'vi_qr', pin: '1357', tong_da_xem: 100000 });
    k('A2 nạp trả vi / vi_qr → 400 NAP_CHI_TIEN_MAT_QR (nguyên mã, không DON_KHONG_HOP_LE)', la(dv, 400, 'NAP_CHI_TIEN_MAT_QR') && la(dvq, 400, 'NAP_CHI_TIEN_MAT_QR'),
      `${moTa(dv)} / ${moTa(dvq)}`);
    k('A2 mọi 4xx ở trên: không đơn / dòng đơn App / phiên / sổ thẻ / tiền ví (đếm bảng)', (await chup(kh.sdt)) === truoc, `${truoc} → ${await chup(kh.sdt)}`);
    // VOUCHER-2 (phiếu điểm 4): mã chung / voucher trên giỏ nạp → luật "dòng không giảm" sẵn có, báo ở ma_giam_loi / voucher_loi, không giữ voucher.
    const vc = 'KN1V' + ngauNhien().slice(0, 6).toUpperCase();
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active, discount_scope)
      VALUES (?, 'fixed', 10000, 0, 0, 1, 0, 1, 'order')`, [vc]);
    await db.run("INSERT INTO pos_voucher_grants (code, customer_phone, status, granted_at, expires_at) VALUES (?, ?, 'available', ?, '2099-12-31')", [vc, kh.sdt, getNow()]);
    const bm = await baoGia(kh, gio([nap(G1)], { ma_giam: 'KN1CHUNG', vouchers: [vc] }));
    k('A2 nạp + ma_giam + voucher: báo giá 200, tong 100.000, ma_giam_loi + voucher_loi = MA_KHONG_AP_MON_THUONG', la(bm, 200) && bm.j.tong === 100000
      && bm.j.ma_giam_loi?.code === 'MA_KHONG_AP_MON_THUONG' && bm.j.voucher_loi?.length === 1 && bm.j.voucher_loi[0].code === 'MA_KHONG_AP_MON_THUONG',
    `${moTa(bm)} · ${JSON.stringify([bm.j.ma_giam_loi, bm.j.voucher_loi])}`);
    const dm = await dat1(kh, gio([nap(G1)], { ma_giam: 'KN1CHUNG', vouchers: [vc] }), { tong_da_xem: 100000 });
    const pm = await phienCua(dm.j.ma_don), thanM = pm ? JSON.parse(pm.than) : {};
    k('A2 đặt đơn nạp kèm mã / voucher → 200, phiên KHÔNG mang mã / voucher (không giữ voucher cho phiên nạp)', la(dm, 200) && !!pm && !thanM.discount_code
      && !(thanM.vouchers || []).length, `${moTa(dm)} · ${pm?.than}`);
    // Khoá gửi: cùng khoá + cùng giỏ nạp gửi song song → một đơn; cùng khoá đổi gói → KHOA_GUI_DA_DUNG (băm dòng nạp theo ma_goi).
    const kg = await khach(), khoa = khoaMoi();
    const thanK = { ...gio([nap(G1)]), khoa_gui: khoa, cach_tra: 'qr', tong_da_xem: 100000 };
    const ss = await Promise.all([goi('POST', '/kh/don', thanK, kg.tk), goi('POST', '/kh/don', thanK, kg.tk)]);
    const lai = await goi('POST', '/kh/don', thanK, kg.tk);
    const doiGoi = await goi('POST', '/kh/don', { ...thanK, mon: [nap(G2)], tong_da_xem: 200000 }, kg.tk);
    k('A1 khoá gửi: hai POST /don nạp cùng khoá song song → một dòng đơn App; gửi lại → trung; cùng khoá đổi gói → 409 KHOA_GUI_DA_DUNG',
      ss.some((r) => la(r, 200)) && la(lai, 200) && lai.j.trung === true && la(doiGoi, 409, 'KHOA_GUI_DA_DUNG')
      && (await so('SELECT COUNT(*) AS n FROM pos_don_app WHERE phone = ?', [kg.sdt])) === 1, `${ss.map(moTa).join(' / ')} · ${moTa(lai)} · ${moTa(doiGoi)}`);
    // A4: quán đóng → giỏ chỉ nạp vẫn đặt được; giỏ đồ uống bị chặn (đối chứng).
    await datLich(hhmm(120), hhmm(180));
    const n4 = await baoGia(kh, gio([nap(G1)])), d4 = await dat1(kh, gio([nap(G1)])), m4 = await baoGia(kh, gio([mon(0)]));
    await boLich();
    k('A4 quán đóng: báo giá + đặt giỏ chỉ nạp → 200; giỏ đồ uống → 400 NGOAI_GIO', la(n4, 200) && la(d4, 200) && la(m4, 400, 'NGOAI_GIO'),
      `${moTa(n4)} / ${moTa(d4)} / ${moTa(m4)}`);
  });

  muc('[B] Tiền về đúng hạn (A5), xem đơn (A8), quầy (E1, E2), huỷ / hoàn (A7)');
  await chay('B', async () => {
    const kh = await khach();
    const { d, p } = await datNap(kh);
    const truocTra = await goi('GET', `/kh/don/${d.j.ma_don}`, undefined, kh.tk);
    const dsTruoc = (await goi('GET', '/kh/don', undefined, kh.tk)).j.data?.find((x) => x.ma === d.j.ma_don);
    k('A5 chưa thu → số dư 0, tien_trinh cho_tra', la(d, 200) && (await soDuToi(kh)) === 0 && d.j.tien_trinh === 'cho_tra', `${moTa(d)} · ${d.j.tien_trinh}`);
    const [w1, w2] = await Promise.all([webhook(p, { reference: 'REFN-A5-SS' }), webhook(p, { reference: 'REFN-A5-SS' })]);   // CÙNG khoá (bản sao thật)
    await webhook(p, { reference: 'REFN-LAP' }); await webhook(p, { reference: 'REFN-LAP' });
    const v = await vi(kh.sdt);
    k('A5 QR về đủ → /toi.so_du_vi 105.000, ngăn thưởng 5.000; hai báo song song + một báo lặp → MỘT đơn, ví cộng MỘT lần', w1.status === 200 && w2.status === 200
      && (await soDuToi(kh)) === 105000 && v.so_du === 105000 && v.thuong === 5000
      && (await so("SELECT COUNT(*) AS n FROM pos_balance_transactions WHERE customer_phone = ? AND type = 'topup'", [kh.sdt])) === 1
      && (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [kh.sdt])) === 1, `${JSON.stringify(v)} · ${await soDuToi(kh)}`);
    const oid = await oidCua(d.j.ma_don);
    k('A5 đơn nạp 0 điểm; A4 tien_trinh "xong" ngay khi đã thu', (await diemDon(oid)) === 0
      && (await goi('GET', `/kh/don/${d.j.ma_don}`, undefined, kh.tk)).j.don?.tien_trinh === 'xong', String(await diemDon(oid)));
    const sau = await goi('GET', `/kh/don/${d.j.ma_don}`, undefined, kh.tk);
    const dsSau = (await goi('GET', '/kh/don', undefined, kh.tk)).j.data?.find((x) => x.ma === d.j.ma_don);
    const ten = '💳 Nạp 100.000đ → vào tài khoản 105.000đ';
    const m0 = truocTra.j.don?.mon?.[0], m1 = sau.j.don?.mon?.[0];
    k('A8 dòng nạp loai "nap", ten đúng chuỗi quầy, ghi_chu null — trước và sau khi trả giống nhau', m0?.loai === 'nap' && m1?.loai === 'nap' && m0.ten === ten
      && m1.ten === ten && m0.ghi_chu === null && m1.ghi_chu === null && m0.don_gia === m1.don_gia && m0.thanh_tien === m1.thanh_tien, JSON.stringify([m0, m1]));
    k('A8 GET /don: so_mon 1, mon_dau = tên dòng nạp — trước = sau khi trả; kenh app', dsTruoc?.so_mon === 1 && dsSau?.so_mon === 1 && dsTruoc.mon_dau === ten
      && dsSau.mon_dau === ten && dsSau.kenh === 'app', JSON.stringify([dsTruoc?.so_mon, dsTruoc?.mon_dau, dsSau?.so_mon, dsSau?.mon_dau]));
    k('A8 hoa_don[] khác rỗng; tra[] = một dòng chuyển khoản 100.000', (sau.j.don?.hoa_don || []).length > 0 && sau.j.don?.tra?.length === 1
      && sau.j.don.tra[0].so_tien === 100000, JSON.stringify(sau.j.don?.tra));
    const ds = (await goi('GET', '/pos/kh/don-app', undefined, tkChu)).j.data || [];
    const q = ds.find((x) => x.ma === d.j.ma_don);
    const dl = q ? await goi('POST', `/pos/kh/don-app/${q.id}/dang-lam`, {}, tkChu) : { status: 0, j: {} };
    k('E1 màn Đơn App: đơn nạp có co_nap = tên dòng, mon[] rỗng, tien_trinh xong; bấm Đang làm → từ chối', q?.co_nap === ten && q.mon.length === 0
      && q.tien_trinh === 'xong' && dl.status === 409, `${JSON.stringify(q)} · ${moTa(dl)}`);
    const huy = await goi('PUT', `/pos/orders/${oid}/cancel`, { reason: 'thử huỷ' }, tkChu);
    const xoa = await goi('DELETE', `/pos/orders/${oid}`, undefined, tkChu);
    const hoan = await goi('POST', '/pos/refunds', { order_id: oid, reason: 'thử hoàn' }, tkChu);
    const sc = await goi('POST', '/pos/damages', { order_id: oid, product_code: `NAP-${G1}`, quantity: 1, reason: 'damaged', action: 'refund', refund_amount: 1000 }, tkChu);
    k('A7 đơn nạp App đã trả: quầy huỷ / xoá / xin hoàn → 400 NAP_KHONG_HOAN, báo sự cố → 400 DON_NAP_KHONG_SU_CO; ví không đổi', la(huy, 400, 'NAP_KHONG_HOAN')
      && la(xoa, 400, 'NAP_KHONG_HOAN') && la(hoan, 400, 'NAP_KHONG_HOAN') && la(sc, 400, 'DON_NAP_KHONG_SU_CO') && (await vi(kh.sdt)).so_du === 105000,
    [huy, xoa, hoan, sc].map(moTa).join(' / '));
    const kh2 = await khach();
    const { d: d2, p: p2 } = await datNap(kh2);
    const h2 = await goi('POST', `/kh/don/${d2.j.ma_don}/huy`, {}, kh2.tk);
    k('A7 App huỷ đơn nạp CHƯA trả → 200 da_huy, chưa có tiền', la(h2, 200) && h2.j.tien_trinh === 'da_huy' && (await vi(kh2.sdt)).so_du === 0 && !!p2, moTa(h2));
    // E2: báo cáo doanh thu không tính đơn nạp App (sqlDonNap).
    const doanhThu = await db.queryOne(`SELECT COALESCE(SUM(total), 0) AS n FROM pos_orders o WHERE o.customer_phone = ? AND NOT
      (o.id IN (SELECT order_id FROM pos_order_items WHERE product_id <= -2000000))`, [kh.sdt]);
    k('E2 đơn nạp App có dòng product_id ≤ −2000000 (sqlDonNap nhận ra — báo cáo / Đối soát xếp nhóm nạp, không là doanh thu)', Number(doanhThu.n) === 0
      && (await so('SELECT COUNT(*) AS n FROM pos_order_items WHERE order_id = ? AND product_id = ?', [oid, -2000000 - G1])) === 1, String(doanhThu.n));
    const quayNap = await quay({ customer_phone: (await khach()).sdt, items: [], goi_nap_id: G1, payment_method: 'cash', cash_amount: 100000 });
    const hdQ = quayNap.j.order ? await db.queryOne('SELECT product_name, unit_price FROM pos_order_items WHERE order_id = ?', [quayNap.j.order.id]) : null;
    k('E2 / K5 nạp ở quầy tiền mặt vẫn 200; tờ đơn nạp App cùng dòng hàng với đơn nạp quầy cùng gói (in)', la(quayNap, 200) && hdQ?.product_name === ten
      && hdQ.unit_price === 100000, `${moTa(quayNap)} · ${JSON.stringify(hdQ)}`);
  });

  muc('[C] Tiền QR về muộn — đơn chỉ nạp / chỉ thẻ ĐỦ quyền lợi (A6)');
  await chay('C', async () => {
    const muon = async (p) => { await lui('pos_phien_thanh_toan', 'het_han', 'id = ?', [p.id], 700); return db.queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [p.id]); };
    const ka = await khach();
    const a = await datNap(ka);
    const pa = await muon(a.p);
    const [wa, wb] = await Promise.all([webhook(pa, { reference: 'REFN-A6-SS' }), webhook(pa, { reference: 'REFN-A6-SS' })]);   // CÙNG khoá (bản sao thật)
    await webhook(pa, { reference: 'REFN-MUON-LAP' }); await webhook(pa, { reference: 'REFN-MUON-LAP' });
    const xa = await goi('GET', `/kh/don/${a.d.j.ma_don}`, undefined, ka.tk);
    const va = await vi(ka.sdt);
    k('A6 nạp về muộn (QR hết hạn) đúng số → đơn nạp, cộng đủ 105.000 (thưởng 5.000), đơn "xong"; hai báo song song + báo lặp → chốt MỘT lần',
      wa.status === 200 && wb.status === 200 && va.so_du === 105000 && va.thuong === 5000 && xa.j.don?.tien_trinh === 'xong'
      && (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [ka.sdt])) === 1
      && (await so("SELECT COUNT(*) AS n FROM pos_balance_transactions WHERE customer_phone = ?", [ka.sdt])) === 1, `${JSON.stringify(va)} · ${xa.j.don?.tien_trinh}`);
    k('A6 về muộn tự chốt: không dòng vao_vi; dòng báo khop ghi "tiền về muộn"', !(await suKien(pa)).some((s) => s.ket_qua === 'vao_vi')
      && (await suKien(pa)).some((s) => s.ket_qua === 'khop' && /tiền về muộn/.test(s.ly_do || '')), JSON.stringify(await suKien(pa)));
    const kb = await khach();
    const b = await datNap(kb);
    await goi('POST', `/kh/don/${b.d.j.ma_don}/huy`, {}, kb.tk);
    await webhook(await db.queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [b.p.id]));
    k('A6 đơn nạp khách đã bấm huỷ rồi tiền về → đơn nạp đủ 105.000, đơn "xong"', (await vi(kb.sdt)).so_du === 105000
      && (await goi('GET', `/kh/don/${b.d.j.ma_don}`, undefined, kb.tk)).j.don?.tien_trinh === 'xong', String((await vi(kb.sdt)).so_du));
    const kc = await khach();
    const dc = await dat1(kc, gio([the(VANG, 1)]));
    const pc = await muon(await phienCua(dc.j.ma_don));
    const truocChot = getNow();
    await webhook(pc);
    const hc = await db.queryOne('SELECT * FROM pos_membership_purchases WHERE customer_phone = ?', [kc.sdt]);
    const xtay = await goi('POST', `/pos/thanh-toan/phien/${pc.id}/xac-nhan-tay`, { ly_do: 'Tiền về muộn khách báo' }, tkChu);
    k('A6 thẻ về muộn → lên hạng Vàng, hạn tính từ lúc chốt (> lúc tiền về); xác nhận tay sau đó vẫn 409 PHIEN_APP_KHONG_TAO_LAI hoặc đã chốt, không đơn thứ hai',
      (await hangToi(kc))?.id === VANG && !!hc && hc.expires_at > truocChot && (await soThe(kc.sdt)) === 1 && xtay.status === 409
      && (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [kc.sdt])) === 1 && (await vi(kc.sdt)).so_du === 0, `${JSON.stringify(hc)} · ${moTa(xtay)}`);
    const kd = await khach();
    const dd = await dat1(kd, gio([mon(0)]));
    await webhook(await muon(await phienCua(dd.j.ma_don)));
    k('A6 / K5 ĐỒ UỐNG về muộn → vẫn chỉ vào tài khoản (25.000), không đơn', (await vi(kd.sdt)).so_du === 25000
      && (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [kd.sdt])) === 0, String((await vi(kd.sdt)).so_du));
    const ke = await khach();
    const e = await datNap(ke);
    await db.run('UPDATE pos_goi_nap SET is_active = 0 WHERE id = ?', [G1]);
    const pe = await muon(e.p);
    await webhook(pe); await webhook(pe, { reference: 'REFN-E2' });
    await db.run('UPDATE pos_goi_nap SET is_active = 1 WHERE id = ?', [G1]);
    // Soát vòng 1 lỗi 1: cổng gửi lại ĐÚNG báo cũ (cùng reference) sau khi nguyên nhân đã gỡ (gói bật lại) → báo đã ghi KHÔNG bao giờ chốt đơn.
    const guiLai = await webhook(pe, { reference: 'REFN-E2' });
    k('A6 gói bật lại rồi cổng gửi lại ĐÚNG báo cũ → 200 (cổng thôi gửi), không đơn, ví không đổi (báo đã ghi không chốt lần hai)', guiLai.status === 200
      && (await vi(ke.sdt)).so_du === 200000
      && (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [ke.sdt])) === 0 && (await soThe(ke.sdt)) === 0, String((await vi(ke.sdt)).so_du));
    const dsE = (await goi('GET', '/kh/don', undefined, ke.tk)).j.data?.find((x) => x.ma === e.d.j.ma_don);
    const qEs = ((await goi('GET', '/pos/kh/don-app', undefined, tkChu)).j.data || []).filter((x) => x.tien_trinh === 'vao_vi' && x.ma === e.d.j.ma_don);
    const qE = { ly_do: qEs.length === 2 && qEs.every((x) => /GOI_NAP_KHONG_CO/.test(x.ly_do || '')) ? qEs[0].ly_do : JSON.stringify(qEs.map((x) => x.ly_do)) };   // MỌI lần báo
    k('A6 gói nạp đã tắt rồi tiền về muộn → vào tài khoản ĐÚNG số đã về (100.000, không thưởng), không đơn; khách + quầy thấy lý do ở MỌI lần báo',
      (await vi(ke.sdt)).so_du === 200000 && (await vi(ke.sdt)).thuong === 0 && (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [ke.sdt])) === 0
      && /gói|không còn/.test(dsE?.thong_bao_tien_ve || '') && /GOI_NAP_KHONG_CO/.test(qE.ly_do) && !qE.ly_do.startsWith('['), `${(await vi(ke.sdt)).so_du} · ${dsE?.thong_bao_tien_ve} · ${qE?.ly_do}`);
    const kf = await khach();
    await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at, loai, so_thang)
      VALUES (?, ?, 'Kim Cương bán thử', 300000, NULL, ?, '2099-12-31T23:59:59', 'ban', 1)`, [kf.sdt, KCB, getNow()]);
    const df = await dat1(kf, gio([the(VANG, 1)]), { tong_da_xem: 100000 });
    const pf = df.j.ma_don ? await phienCua(df.j.ma_don) : null;
    if (pf) await webhook(await muon(pf));
    k('A6 khách đã có hạng cao hơn rồi thẻ về muộn → vào tài khoản 100.000, không thẻ mới (hoặc chặn ngay lúc đặt)', !pf
      || ((await vi(kf.sdt)).so_du === 100000 && (await soThe(kf.sdt)) === 1), `${moTa(df)} · ${(await vi(kf.sdt)).so_du}`);
    const kg = await khach();
    const g = await datNap(kg);
    await webhook(await muon(g.p), { amount: 90000 });
    k('A6 tiền về muộn LỆCH số (90.000) → vào tài khoản đúng 90.000 như hiện nay, không đơn', (await vi(kg.sdt)).so_du === 90000
      && (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [kg.sdt])) === 0, String((await vi(kg.sdt)).so_du));
    const kh = await khach();
    const h = await datNap(kh);
    const ph = await muon(h.p);
    await db.run(`INSERT INTO pos_payos_su_kien (khoa, ma_payos, so_tien, ket_qua, ly_do, du_lieu, luc) VALUES (?, ?, ?, 'chua_khop', 'thử cổng kia', '{}', ?)`,
      ['sepay:KN1-' + ngauNhien(), ph.ma_payos, 100000, getNow()]);
    await webhook(ph);
    k('A6 cổng kia đã báo tiền cho phiên → KHÔNG tự chốt, không cộng (chua_khop, cần xem)', (await vi(kh.sdt)).so_du === 0
      && (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [kh.sdt])) === 0, String((await vi(kh.sdt)).so_du));
    const ki = await khach();
    const i = await datNap(ki);
    await db.run("UPDATE pos_phien_thanh_toan SET trang_thai = 'loi', ly_do = 'GOI_NAP_KHONG_CO' WHERE id = ?", [i.p.id]);
    await webhook(await db.queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [i.p.id]));
    k('A6 phiên "loi" (đơn hỏng lúc tiền về đúng hạn) → vào tài khoản 100.000, không chốt', (await vi(ki.sdt)).so_du === 100000
      && (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [ki.sdt])) === 0, String((await vi(ki.sdt)).so_du));
    const kj = await khach();
    const j = await datNap(kj);
    const xj = await goi('POST', `/pos/thanh-toan/phien/${j.p.id}/xac-nhan-tay`, { ly_do: 'Đã thấy tiền về' }, tkChu);
    await webhook(await muon(j.p));
    k('A6 quầy xác nhận tay lúc CÒN hạn rồi tiền về muộn → một đơn, ví 105.000 (không cộng thêm)', la(xj, 200) && (await vi(kj.sdt)).so_du === 105000
      && (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [kj.sdt])) === 1, `${moTa(xj)} · ${(await vi(kj.sdt)).so_du}`);
    // Đua cùng khoá: bản kia ghi dòng báo SAU phép kiểm khoá của bản này → giao dịch chốt phải huỷ (suKien không ghi được) — không đơn.
    const kr = await khach();
    const rr = await datNap(kr);
    const pr = await muon(rr.p);
    chenKhoa = { khoa: `${pr.ma_payos}:REFN-DUA`, ma: pr.ma_payos, so_tien: 100000 };
    const wr = await webhook(pr, { reference: 'REFN-DUA' });
    chenKhoa = null;
    const wr2 = await webhook(pr, { reference: 'REFN-DUA' });   // cổng gửi lại sau 5xx
    k('A6 hai bản CÙNG khoá đua nhau (bản kia ghi dòng báo giữa chừng) → bản này KHÔNG chốt đơn (giao dịch huỷ, 5xx); gửi lại → 200, vẫn không đơn, ví không đổi',
      (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [kr.sdt])) === 0 && (await vi(kr.sdt)).so_du === 0 && wr.status >= 500
      && wr2.status === 200, `${moTa(wr)} · ${moTa(wr2)} · ${(await vi(kr.sdt)).so_du}`);
    // Soát vòng 3: cổng KIA (SePay) ghi dòng báo cho cùng phiên giữa phép kiểm "cổng kia" (ngoài giao dịch) và giao dịch chốt → không chốt.
    const kc2 = await khach();
    const rc = await datNap(kc2);
    const pc2 = await muon(rc.p);
    chenKhoa = { khoa: 'sepay:KN1-DUA-' + ngauNhien().slice(0, 8), ma: pc2.ma_payos, so_tien: 100000 };
    const wc = await webhook(pc2, { reference: 'REFN-DUA-CONG' });
    chenKhoa = null;
    const wc2 = await webhook(pc2, { reference: 'REFN-DUA-CONG' });
    k('A6 cổng KIA báo xen giữa lúc chốt muộn → không chốt đơn (5xx); gửi lại → 200, không đơn, không tự cộng (cần xem)',
      (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [kc2.sdt])) === 0 && (await vi(kc2.sdt)).so_du === 0 && wc.status >= 500
      && wc2.status === 200, `${moTa(wc)} · ${moTa(wc2)} · ${(await vi(kc2.sdt)).so_du}`);
    const kk = await khach();
    const kq = await datNap(kk);
    await db.run('UPDATE pos_goi_nap SET khach_tra = 110000 WHERE id = ?', [G1]);
    await webhook(await muon(kq.p));
    await db.run('UPDATE pos_goi_nap SET khach_tra = 100000 WHERE id = ?', [G1]);
    k('A6 giá gói đổi giữa lúc tạo QR và lúc tiền về muộn → vào tài khoản đúng 100.000 đã về, không đơn', (await vi(kk.sdt)).so_du === 100000
      && (await so('SELECT COUNT(*) AS n FROM pos_orders WHERE customer_phone = ?', [kk.sdt])) === 0, String((await vi(kk.sdt)).so_du));
  });

  muc('[D] Thẻ hạng chỉ trả tiền thật — quầy + App (B1–B4), luồng hợp lệ không bị chặn (K5)');
  await chay('D', async () => {
    const kh = await khach(1000000);
    const me = await khach(1000000);
    const datMe = (con, sdtMe) => db.run('UPDATE pos_customers SET parent_phone = ? WHERE phone = ?', [sdtMe, con]);
    await datMe(kh.sdt, me.sdt);
    const theQ = { items: [], membership_buy: { tier_id: VANG, so_thang: 1 } };
    const t1 = [await quay({ customer_phone: kh.sdt, ...theQ, payment_method: 'balance', balance_amount: 100000 }),
      await quay({ customer_phone: kh.sdt, ...theQ, payment_method: 'cash', balance_amount: 50000, cash_amount: 50000 }),
      await quay({ customer_phone: kh.sdt, ...theQ, payment_method: 'cash', parent_phone: me.sdt, parent_balance_amount: 100000 }),
      await quay({ customer_phone: kh.sdt, ...theQ, items: [monQuay(0)], payment_method: 'balance', balance_amount: 125000 }),
      await quay({ customer_phone: kh.sdt, ...theQ, package_buy: { package_id: GOI_TT, pkg_qty: 1 }, payment_method: 'balance', balance_amount: 400000 })];
    k('B2 quầy: thẻ + balance / ví một phần / ví mẹ / thẻ + đồ uống / thẻ + gói trả bằng ví → 400 THE_KHONG_TRA_VI, đúng câu phiếu; ví không đổi',
      t1.every((r) => la(r, 400, 'THE_KHONG_TRA_VI') && r.j.error === CAU_THE) && (await vi(kh.sdt)).so_du === 1000000 && (await vi(me.sdt)).so_du === 1000000
      && (await soThe(kh.sdt)) === 0, t1.map(moTa).join(' / '));
    await datCaiDat('thanh_toan_payos_bat_buoc', '1');
    const t1c = await quay({ customer_phone: kh.sdt, ...theQ, payment_method: 'balance', balance_amount: 100000 });
    await datCaiDat('thanh_toan_payos_bat_buoc', '0');
    k('B2 cờ "CK phải qua payOS" bật → vẫn THE_KHONG_TRA_VI (không VI_PHAI_QUA_PIN)', la(t1c, 400, 'THE_KHONG_TRA_VI'), moTa(t1c));
    const soPhien = () => so('SELECT COUNT(*) AS n FROM pos_phien_thanh_toan');
    const truocP = await soPhien();
    const don = { customer_phone: kh.sdt, ...theQ };
    const t2 = [await goi('POST', '/pos/thanh-toan/phien', { cach: 'tien_mat', tru_tai_khoan: true, pin: '1357', don }, tkChu),
      await goi('POST', '/pos/thanh-toan/phien', { cach: 'tai_khoan', tru_tai_khoan: true, pin: '1357', don }, tkChu),
      await goi('POST', '/pos/thanh-toan/phien', { cach: 'payos', tru_tai_khoan_me: true, pin_me: '1357', don: { ...don, parent_phone: me.sdt } }, tkChu)];
    k('B2 phiên PIN tru_tai_khoan / cách tai_khoan / tru_tai_khoan_me có thẻ → 400 THE_KHONG_TRA_VI, không phiên giữ', t2.every((r) => la(r, 400, 'THE_KHONG_TRA_VI'))
      && (await soPhien()) === truocP, t2.map(moTa).join(' / '));
    const truoc = await chup(kh.sdt);
    const t3 = [];
    for (const g of [gio([the()]), gio([mon(0), the()])]) {
      for (const c of ['vi', 'vi_qr']) t3.push(await dat1(kh, g, { cach_tra: c, pin: '1357' }));
    }
    k('B2 App: giỏ thẻ / thẻ + đồ uống trả vi / vi_qr → 400 THE_KHONG_TRA_VI (nguyên mã); không đơn / phiên / ví đổi', t3.every((r) => la(r, 400, 'THE_KHONG_TRA_VI'))
      && (await chup(kh.sdt)) === truoc, t3.map(moTa).join(' / '));
    const k4 = await quay({ customer_phone: (await khach()).sdt, ...theQ, payment_method: 'cash', cash_amount: 100000 });
    const k4b = await quay({ customer_phone: (await khach()).sdt, ...theQ, payment_method: 'transfer', transfer_amount: 100000 });
    const kq = await khach();
    const k5 = await dat1(kq, gio([the()]));
    await webhook(await phienCua(k5.j.ma_don));
    k('K5 thẻ + tiền mặt / CK ở quầy → 200; thẻ App trả QR → 200 + lên hạng', la(k4, 200) && la(k4b, 200) && la(k5, 200) && (await hangToi(kq))?.id === VANG,
      `${moTa(k4)} / ${moTa(k4b)} / ${moTa(k5)}`);
    const kv = await khach(500000), kvq = await khach(10000), conV = await khach();
    await datMe(conV.sdt, kv.sdt);
    const k1 = await dat1(kv, gio([mon(0)]), { cach_tra: 'vi', pin: '1357' });
    const k1b = await dat1(kvq, gio([mon(1)]), { cach_tra: 'vi_qr', pin: '1357' });
    const k2 = await quay({ customer_phone: conV.sdt, items: [monQuay(0)], payment_method: 'cash', cash_amount: 0, parent_phone: kv.sdt, parent_balance_amount: 25000 });
    const k3 = await quay({ customer_phone: kv.sdt, items: [], package_buy: { package_id: GOI_TT, pkg_qty: 1 }, payment_method: 'balance', balance_amount: 300000 });
    k('K5 đồ uống App trả vi / vi_qr → 200; ví mẹ cho đồ uống ở quầy → 200; gói trả trước trả số dư → 200', la(k1, 200) && la(k1b, 200) && la(k2, 200) && la(k3, 200),
      [k1, k1b, k2, k3].map(moTa).join(' / '));
    // B4: đơn thẻ cũ trả bằng số dư (dữ liệu trước việc) → huỷ quầy theo luật cũ: ví hoàn, hạng thu hồi.
    const kc = await khach();
    const o = await quay({ customer_phone: kc.sdt, ...theQ, payment_method: 'cash', cash_amount: 100000 });
    await db.run("UPDATE pos_orders SET payment_method = 'balance', balance_amount = 100000, cash_amount = 0 WHERE id = ?", [o.j.order.id]);
    await db.run(`INSERT INTO pos_balance_transactions (customer_phone, type, amount, thuong, balance_before, balance_after, order_id, payment_method, notes, created_by,
      created_at) VALUES (?, 'purchase', -100000, 0, 100000, 0, ?, 'cash', 'cũ', 'thu', ?)`, [kc.sdt, o.j.order.id, getNow()]);
    const hb = await goi('PUT', `/pos/orders/${o.j.order.id}/cancel`, { reason: 'thử huỷ đơn cũ' }, tkChu);
    k('B4 đơn thẻ CŨ đã trả bằng số dư → huỷ quầy 200, ví hoàn 100.000, hạng thu hồi (luật cũ)', la(hb, 200) && (await vi(kc.sdt)).so_du === 100000
      && (await soThe(kc.sdt)) === 0, `${moTa(hb)} · ${(await vi(kc.sdt)).so_du}`);
  });

  muc('[E] GET /goi-nap (C1) + GET /vi (D1–D4)');
  await chay('E', async () => {
    const gn = await goi('GET', '/kh/goi-nap');
    const ds = gn.j.data || [];
    k('C1 GET /goi-nap không token → gói bật, thứ tự thu_tu (200k trước 100k), gói tắt không có, đúng 4 trường { ma, ten, tra, vao }', la(gn, 200) && ds.length === 2
      && ds[0].ma === G2 && ds[1].ma === G1 && !ds.some((x) => x.ma === GTAT) && ds.every((x) => bang(Object.keys(x).sort(), ['ma', 'ten', 'tra', 'vao']))
      && ds[1].tra === 100000 && ds[1].vao === 105000, JSON.stringify(gn.j));
    k('C1 ten chuỗi không rỗng; tra, vao nguyên đồng; vao ≥ tra', ds.length > 0 && ds.every((x) => typeof x.ten === 'string' && x.ten.length > 0
      && Number.isInteger(x.tra) && Number.isInteger(x.vao) && x.vao >= x.tra), JSON.stringify(ds));
    const kh = await khach(), kb = await khach(), con = await khach();
    await db.run('UPDATE pos_customers SET parent_phone = ? WHERE phone = ?', [kh.sdt, con.sdt]);
    const v0 = await goi('GET', '/kh/vi');
    k('D1 GET /vi không token → 401', v0.status === 401, moTa(v0));
    // Sổ ví của kh: nạp gói App · nạp tay (ghi chú tay) · trả đơn đồ uống · ví mẹ trả đơn của con · trừ tay · điều chỉnh ± · hoàn (huỷ) · đền · tiền về muộn
    const n = await datNap(kh); await webhook(n.p);
    await goi('POST', '/pos/wallets/topup', { phone: kh.sdt, amount: 50000, notes: 'GHI-TAY-BI-MAT' }, tkChu);
    const tra = await dat1(kh, gio([mon(0)]), { cach_tra: 'vi', pin: '1357' });
    const traHo = await quay({ customer_phone: con.sdt, items: [monQuay(1)], payment_method: 'cash', cash_amount: 0, parent_phone: kh.sdt, parent_balance_amount: 30000 });
    await goi('POST', '/pos/wallets/deduct', { phone: kh.sdt, amount: 1000, notes: 'GHI-TAY-BI-MAT' }, tkChu);
    await goi('POST', '/pos/wallets/adjust', { phone: kh.sdt, amount: 2000, reason: 'GHI-TAY-BI-MAT' }, tkChu);
    await goi('POST', '/pos/wallets/adjust', { phone: kh.sdt, amount: -500, reason: 'GHI-TAY-BI-MAT' }, tkChu);
    const oTra = await oidCua(tra.j.ma_don);
    const hoan = await goi('PUT', `/pos/orders/${oTra}/cancel`, { reason: 'thử huỷ' }, tkChu);
    const muon = await dat1(kh, gio([mon(1)]));
    const pm = await phienCua(muon.j.ma_don);
    await lui('pos_phien_thanh_toan', 'het_han', 'id = ?', [pm.id], 700);
    await webhook(await db.queryOne('SELECT * FROM pos_phien_thanh_toan WHERE id = ?', [pm.id]));
    await db.run(`INSERT INTO pos_balance_transactions (customer_phone, type, amount, balance_before, balance_after, order_id, notes, created_by, created_at)
      VALUES (?, 'debt_payment', 12345, 0, 0, NULL, 'GHI-TAY-BI-MAT', 'thu', ?)`, [kh.sdt, getNow()]);
    await db.run(`INSERT INTO pos_balance_transactions (customer_phone, type, amount, thuong, balance_before, balance_after, order_id, payment_method, notes, created_by,
      created_at) VALUES (?, 'compensation', 700, 0, 0, 700, ?, 'cash', 'GHI-TAY-BI-MAT', 'thu', ?)`, [kh.sdt, oTra, getNow()]);
    // B đơn hai phiên trỏ cùng đơn — LEFT JOIN không được nhân dòng (chủ quán điểm 3).
    await db.run(`INSERT INTO pos_phien_thanh_toan (than, tong, phone, giu_vi, con_lai, cach, het_han, nguoi_tao, tao_luc, trang_thai, order_id)
      VALUES ('{}', 0, ?, 0, 0, 'tien_mat', ?, 'thu', ?, 'da_thu', ?)`, [kh.sdt, getNow(), getNow(), oTra]);
    await goi('POST', '/pos/wallets/topup', { phone: kb.sdt, amount: 77777, notes: 'CUA-KHACH-B' }, tkChu);
    const tatCa = [];
    for (let t = 1; t <= 5; t++) { const r = await goi('GET', `/kh/vi?trang=${t}`, undefined, kh.tk); tatCa.push(...(r.j.data || [])); if (!r.j.con_nua) break; }
    const v1 = await goi('GET', '/kh/vi', undefined, kh.tk);
    const soDong = await so(`SELECT COUNT(*) AS n FROM pos_balance_transactions WHERE customer_phone = ? AND type IN ('topup','purchase','refund','adjust','compensation')`, [kh.sdt]);
    k('D1 trang 1: trang 1, đúng 6 trường mỗi dòng, mới trước; MỖI dòng sổ đổi số dư ra ĐÚNG MỘT dòng (không nhân dòng, không debt_payment)', la(v1, 200) && v1.j.trang === 1
      && typeof v1.j.con_nua === 'boolean' && tatCa.length === soDong && tatCa.every((x) => bang(Object.keys(x).sort(), ['ghi_chu', 'loai', 'ma_don', 'ngay', 'so_tien', 'thuong']))
      && tatCa.every((x, i) => i === 0 || tatCa[i - 1].ngay >= x.ngay) && !tatCa.some((x) => x.so_tien === 12345), `${tatCa.length} / ${soDong} · ${moTa(v1)}`);
    const cua = (dk) => tatCa.filter(dk);
    k('D2 loai: nạp gói / nạp tay / tiền về muộn = nap; trả đơn + trả hộ = tra_don; hoàn + đền = hoan_don; trừ tay + điều chỉnh ± = dieu_chinh',
      cua((x) => x.loai === 'nap').length === 3 && cua((x) => x.loai === 'tra_don').length === 2 && cua((x) => x.loai === 'hoan_don').length === 2
      && cua((x) => x.loai === 'dieu_chinh').length === 3 && tatCa.every((x) => ['nap', 'tra_don', 'hoan_don', 'dieu_chinh'].includes(x.loai)),
    JSON.stringify(tatCa.map((x) => [x.loai, x.so_tien])));
    const napGoi = tatCa.find((x) => x.loai === 'nap' && x.so_tien === 105000), traDon = tatCa.find((x) => x.loai === 'tra_don' && x.so_tien === -25000);
    k('D3 so_tien có dấu (+105.000 nạp, −25.000 trả đơn); thuong có dấu (+5.000; phần thưởng của khoản trừ âm); ngay giờ VN không hậu tố', napGoi?.thuong === 5000
      && traDon && traDon.thuong < 0 && tatCa.every((x) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(x.ngay)), JSON.stringify([napGoi, traDon]));
    k('D4 ma_don của chính khách mở được GET /don/:ma', !!traDon?.ma_don && la(await goi('GET', `/kh/don/${traDon.ma_don}`, undefined, kh.tk), 200)
      && napGoi?.ma_don === n.d.j.ma_don, JSON.stringify([traDon?.ma_don, napGoi?.ma_don]));
    const ho = tatCa.find((x) => x.loai === 'tra_don' && x.so_tien === -30000);
    const chuoi = JSON.stringify(tatCa);
    k('D4 ví của bạn trả hộ đơn người khác → ma_don null; không tên / SĐT / mã bill người đó; không ghi chú tay; không dòng của khách B', la(traHo, 200)
      && !!ho && ho.ma_don === null && !chuoi.includes(con.sdt) && !chuoi.includes('Khách ' + con.sdt) && !chuoi.includes(String(traHo.j.order?.code))
      && !chuoi.includes('GHI-TAY-BI-MAT') && !chuoi.includes('77777') && !chuoi.includes('CUA-KHACH-B') && la(hoan, 200), JSON.stringify(ho));
    // Soát vòng 1 lỗi 2: đơn của CHÍNH khách đã bị xoá (xoá cứng pos_orders) → nhãn chung, không "trả hộ".
    const kx = await khach(100000);
    const ox = await quay({ customer_phone: kx.sdt, items: [monQuay(0)], payment_method: 'balance', balance_amount: 25000 });
    const xoaX = await goi('DELETE', `/pos/orders/${ox.j.order?.id}`, undefined, tkChu);
    const vx = (await goi('GET', '/kh/vi', undefined, kx.tk)).j.data || [];
    k('D4 đơn của chính khách đã xoá → "Thanh toán đơn" / "Hoàn tiền đơn" (không "trả hộ"), ma_don null', la(ox, 200) && la(xoaX, 200)
      && vx.some((x) => x.so_tien === -25000 && x.ghi_chu === 'Thanh toán đơn' && x.ma_don === null)
      && vx.some((x) => x.so_tien === 25000 && x.ghi_chu === 'Hoàn tiền đơn') && !vx.some((x) => /trả hộ/.test(x.ghi_chu)), JSON.stringify(vx));
    // Soát vòng 1 lỗi 4: ngưỡng trang 20 / 21, mới trước theo giờ (giờ khác nhau từng dòng).
    const kt = await khach();
    for (let i = 0; i < 21; i++) {
      await db.run(`INSERT INTO pos_balance_transactions (customer_phone, type, amount, thuong, balance_before, balance_after, order_id, payment_method, created_by,
        created_at) VALUES (?, 'adjust', ?, 0, 0, 0, NULL, 'cash', 'thu', ?)`, [kt.sdt, i + 1, `2026-01-01T00:00:${String(i).padStart(2, '0')}`]);
    }
    const t1 = await goi('GET', '/kh/vi?trang=1', undefined, kt.tk), t2 = await goi('GET', '/kh/vi?trang=2', undefined, kt.tk);
    k('D1 21 dòng: trang 1 đúng 20 dòng + con_nua true, mới trước (21 → 2); trang 2 đúng 1 dòng (1) + con_nua false', t1.j.data?.length === 20 && t1.j.con_nua === true
      && t1.j.data[0].so_tien === 21 && t1.j.data[19].so_tien === 2 && t2.j.data?.length === 1 && t2.j.data[0].so_tien === 1 && t2.j.con_nua === false && t2.j.trang === 2,
    JSON.stringify([t1.j.data?.length, t1.j.con_nua, t1.j.data?.[0]?.so_tien, t2.j.data?.length, t2.j.con_nua]));
    await db.run(`DELETE FROM pos_balance_transactions WHERE customer_phone = ? AND amount = 1`, [kt.sdt]);
    const t20 = await goi('GET', '/kh/vi?trang=1', undefined, kt.tk);
    k('D1 đúng 20 dòng → trang 1 đủ 20, con_nua false (ngay dưới ngưỡng)', t20.j.data?.length === 20 && t20.j.con_nua === false, JSON.stringify([t20.j.data?.length, t20.j.con_nua]));
    const vb = await goi('GET', `/kh/vi?phone=${kh.sdt}`, undefined, kb.tk);
    k('D4 khách B gửi ?phone của A → chỉ thấy ví của B (SĐT từ token)', la(vb, 200) && (vb.j.data || []).length === 1 && vb.j.data[0].so_tien === 77777,
      JSON.stringify(vb.j.data));
  });

  muc('[G] Nạp + mã ở quầy (K5 — điểm 4 phiếu) và trần lượt chung /goi-nap với /menu (C1)');
  await chay('G', async () => {
    const sq = (await khach()).sdt;
    const tq = await goi('POST', '/pos/orders/tinh-thu', { customer_phone: sq, items: [], goi_nap_id: G1, discount_code: 'KN1CHUNG' }, tkChu);
    const pq = await quay({ customer_phone: sq, items: [], goi_nap_id: G1, discount_code: 'KN1CHUNG', payment_method: 'cash', cash_amount: 100000 });
    k('K5 quầy: tính thử nạp + mã → 200, tổng 100.000, ma_loi_code MA_KHONG_AP_MON_THUONG; ghi đơn nạp + mã → vẫn 400 NAP_CHI_TIEN_MAT_QR (luật NAP-1)',
      la(tq, 200) && Number(tq.j.total) === 100000 && tq.j.ma_loi_code === 'MA_KHONG_AP_MON_THUONG' && la(pq, 400, 'NAP_CHI_TIEN_MAT_QR'), `${moTa(tq)} · ${tq.j.ma_loi_code} · ${moTa(pq)}`);
    let het = null;
    for (let i = 0; i < 320 && !het; i++) { const r = await goi('GET', '/kh/chuong-trinh'); if (r.status === 429) het = r; }
    const gn = await goi('GET', '/kh/goi-nap');
    k('C1 /goi-nap dùng CHUNG trần lượt / IP với /menu: hết lượt (qua /chuong-trinh) → /goi-nap 429 QUA_NHIEU_LAN', !!het && la(gn, 429, 'QUA_NHIEU_LAN'), moTa(gn));
  });

  muc('[F] Màn quầy (B5, E1) — chạy hàm thật của tinh.js; nhánh vẽ dò trên mã nguồn (bản sao --may-chu nếu có)');
  await chay('F', async () => {
    const SRC = iMC > 0 ? path.join(MAY_CHU, '..', 'client', 'src') : path.join(GOC, 'client', 'src');
    const T = await import(pathToFileURL(path.join(SRC, 'pages', 'BanHang', 'tinh.js')).href);
    const coSoDu = { balance: 50000, parent_balance: 0 };
    k('B5 lyDoKhongTru: giỏ có thẻ (khách có số dư) → lý do "Thẻ hội viên chỉ trả tiền mặt hoặc chuyển khoản"; bỏ laThe → null (mặc định, lời gọi cũ)',
      T.lyDoKhongTru({ khach: coSoDu, laNap: false, laThe: true }) === 'Thẻ hội viên chỉ trả tiền mặt hoặc chuyển khoản'
      && T.lyDoKhongTru({ khach: coSoDu, laNap: false }) === null, String(T.lyDoKhongTru({ khach: coSoDu, laNap: false, laThe: true })));
    const bh = fs.readFileSync(path.join(SRC, 'pages', 'BanHang', 'BanHangMoi.jsx'), 'utf8');
    const ttj = fs.readFileSync(path.join(SRC, 'pages', 'BanHang', 'ThuTien.jsx'), 'utf8');
    k('B5 BanHangMoi: giỏ có thẻ tắt trừ tài khoản (cả mẹ) như giỏ nạp; ThuTien chuyển laThe vào lyDoKhongTru',
      /const laThe = !!layThe\(gio\)/.test(bh) && /dungTK: dungTK && !chiTienThat, dungMe: dungMe && dungTK && !chiTienThat/.test(bh)
      && /chiTienThat = laNap \|\| laThe/.test(bh) && /laThe=\{laThe\}/.test(bh) && /lyDoKhongTru\(\{ khach, laNap, laThe \}\)/.test(ttj));
    const da = fs.readFileSync(path.join(SRC, 'pages', 'DonApp.jsx'), 'utf8');
    k('E1 DonApp.jsx: đơn nạp hiện nhãn co_nap "đã vào tài khoản, không pha"', /\{d\.co_nap && <div[^\n]*\{d\.co_nap\} — [^\n]*đã vào tài khoản, không pha/.test(da));
  });

  noiLai();
  console.log(`\n${hong ? C.do : C.xanh}${C.dam}KH-NAP-1: ${dat} đạt · ${hong} hỏng · tổng ${dat + hong} ca${C.het}`);
  sv.close(); svGia.close();
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.error('✖ Bài thử sập:', e.stack || e.message); process.exit(2); });
