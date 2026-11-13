#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ GIAO-1 — giao hàng Ahamove ở quầy: báo phí do máy chủ quyết, gọi xe một lần, tin Ahamove báo về, huỷ theo bước, Đối soát
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có utils/ahamove.js, utils/giaoHang.js, routes/giao-hang.js). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_GIAO1.js
 *
 *  Khuôn thu_SEPAY1.js: database.js + libsql thật trên kho TẠM; chỉ thay ketNoiKho (P8), SX tắt. Ahamove là một máy chủ GIẢ trong tiến trình
 *  (AHAMOVE_BASE_URL trỏ về nó — KHÔNG gọi Ahamove thật, phiếu mục Cấm); khoá thử sinh ngẫu nhiên lúc chạy. Dạng tin Ahamove trong máy giả là
 *  dạng bài này GIẢ ĐỊNH theo tài liệu tóm tắt (ke_hoach.md mục 2) — CHƯA đối chiếu Ahamove thật (trang_thai.md, CHƯA KIỂM).
 *  So HTTP + `code`, không dò lời (E12). Module chưa có → ca hỏng riêng, bài không sập.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_giao1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_giao1_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_giao1_kh_' + ngauNhien();
const BI_MAT = { api: 'ahk_' + ngauNhien(), bao: 'ahb_' + ngauNhien(), diaChi: 'ahd_' + ngauNhien(), token: 'aht_' + ngauNhien() };
const SDT_AHA = '0900000001';
const datAhamove = (co = true) => {
  if (co) { process.env.AHAMOVE_API_KEY = BI_MAT.api; process.env.AHAMOVE_SDT = SDT_AHA; } else { delete process.env.AHAMOVE_API_KEY; }
};
datAhamove();
process.env.AHAMOVE_KHOA_BAO = BI_MAT.bao;

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const nhatKy = [];
const imLang = () => { console.log = console.error = console.warn = (...a) => nhatKy.push(a.map(String).join(' ')); };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const thuNap = (p) => { try { return require(p); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return null; throw e; } };
const J = (x) => String(JSON.stringify(x) ?? 'undefined');
const coBiMat = (s) => Object.values(BI_MAT).some((b) => String(s).includes(b));

// ─── Ahamove GIẢ ─────────────────────────────────────────────────────────
const A = {
  chuyen: new Map(), tao: [], baoPhi: [], huy: [], goiY: [], tokenLan: 0, soChuyen: 0,
  phi: 25000, km: { 'Số 1 Ngõ Gần': 3, 'Số 9 Đường Biên': 5, 'Số 9 Đường Xa': 5.1 }, hong: null, nuot: false, phiHuy: 0, khiTao: null, khiHuy: null,
  khiDoc: null, nuotHuy: false,   // V5: việc chen đúng lúc máy đọc chuyến; lệnh huỷ Ahamove đã làm nhưng mất mạng trước khi trả lời
};
const DIA_CHI_GOI_Y = { G1: { label: 'Số 1 Ngõ Gần, Hà Nội', lat: 21.01, lng: 105.81 }, LAY: { label: 'Quán Tứ Quý Đường', lat: 21.02, lng: 105.82 } };

function dungAhamoveGia(express) {
  const g = express();
  g.use(express.json());
  const coToken = (req) => req.headers.authorization === 'Bearer ' + BI_MAT.token;
  g.post('/v3/accounts/token', (req, res) => {
    A.tokenLan++;
    if (req.body.api_key !== BI_MAT.api || req.body.mobile !== SDT_AHA) return res.status(401).json({ title: 'sai khoá' });
    res.json({ token: BI_MAT.token });
  });
  g.post('/v3/orders/estimates', (req, res) => {
    if (!coToken(req)) return res.status(401).json({ title: 'Token not found' });
    A.baoPhi.push(req.body);
    if (A.hong === 'bao_phi') return res.status(500).json({ title: 'chi tiet noi bo XYZ ' + BI_MAT.token });
    const diem = req.body.path?.[1] || {};
    const km = Object.entries(A.km).find(([t]) => String(diem.address || '').startsWith(t))?.[1] ?? 2;
    res.json([{ _id: req.body.services?.[0]?._id, data: { distance: km, total_price: A.phi } }]);
  });
  g.post('/v3/orders', async (req, res) => {
    if (!coToken(req)) return res.status(401).json({ title: 'Token not found' });
    if (A.hong === 'tao') return res.status(500).json({ title: 'loi tao' });
    const id = 'AHA' + (++A.soChuyen);
    if (A.khiTao) { const f = A.khiTao; A.khiTao = null; await f(id); }   // G9: máy khác giành lại đúng lúc Ahamove đang tạo
    const tn = req.body.path?.[1]?.tracking_number;
    A.chuyen.set(id, { _id: id, status: 'ASSIGNING', tracking_number: tn, total_price: A.phi, path: req.body.path, service_id: req.body.service_id });
    A.tao.push(req.body);
    if (A.nuot) { A.nuot = false; req.socket.destroy(); return; }
    res.json({ order_id: id, status: 'ASSIGNING', order: { total_price: A.phi } });
  });
  g.get('/v3/orders/tracks/:tn', (req, res) => {
    if (!coToken(req)) return res.status(401).json({ title: 'Token not found' });
    const o = [...A.chuyen.values()].reverse().find((x) => x.tracking_number === req.params.tn);
    return o ? res.json(o) : res.status(404).json({ title: 'not found' });
  });
  g.get('/v3/orders/:id', async (req, res) => {
    if (!coToken(req)) return res.status(401).json({ title: 'Token not found' });
    if (A.khiDoc) { const f = A.khiDoc; A.khiDoc = null; await f(); }
    if (A.hong === 'doc') return res.status(500).json({ title: 'loi doc' });
    const o = A.chuyen.get(req.params.id);
    return o ? res.json(o) : res.status(404).json({ title: 'not found' });
  });
  g.delete('/v3/orders/:id', async (req, res) => {
    if (!coToken(req)) return res.status(401).json({ title: 'Token not found' });
    const o = A.chuyen.get(req.params.id);
    if (!o || !['IDLE', 'ASSIGNING', 'ACCEPTED'].includes(o.status)) return res.status(400).json({ title: 'not cancellable' });
    if (A.khiHuy) { const f = A.khiHuy; A.khiHuy = null; await f(); }   // J5f: thẻ đổi đúng lúc Ahamove đang huỷ
    A.huy.push({ id: req.params.id, ...req.body });
    Object.assign(o, { status: 'CANCELLED', cancel_by_user: true, cancel_fee: A.phiHuy });
    if (A.nuotHuy) { A.nuotHuy = false; req.socket.destroy(); return; }
    res.json({ success: true });
  });
  // Gợi ý địa chỉ (cách 1 — AHAMOVE_DIA_CHI_URL + AHAMOVE_DIA_CHI_KHOA)
  const f = (ma, d) => ({ properties: { ref_id: ma, label: d.label }, geometry: { coordinates: [d.lng, d.lat] } });
  g.get('/dplaces/web/v2/autocomplete', (req, res) => {
    A.goiY.push({ text: req.query.text, apikey: req.headers.apikey });
    if (req.headers.apikey !== BI_MAT.diaChi) return res.status(401).json({});
    res.json({ features: Object.entries(DIA_CHI_GOI_Y).map(([ma, d]) => f(ma, d)) });
  });
  g.get('/gplaces/web/v2/detail', (req, res) => {
    if (req.headers.apikey !== BI_MAT.diaChi) return res.status(401).json({});
    const d = DIA_CHI_GOI_Y[req.query.id];
    return d ? res.json({ features: [f(req.query.id, d)] }) : res.status(404).json({});
  });
  return g;
}
const datTrangThai = (id, them) => Object.assign(A.chuyen.get(id), them);

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();
  // G10: đơn bị hoàn ĐÚNG khe giữa lúc gọi xe đọc đơn và câu giành (gắn TRƯỚC khi nạp route — module lấy hàm lúc nạp)
  let mocHoan = null;
  const qoGoc = db.queryOne;
  db.queryOne = async (sql, p) => {
    const r = await qoGoc(sql, p);
    if (mocHoan && /SELECT code, status, payment_status FROM pos_orders/.test(sql)) { const id = mocHoan; mocHoan = null; await db.run("UPDATE pos_orders SET status = 'refunded' WHERE id = ?", [id]); }
    return r;
  };

  const svAha = await new Promise((ok) => { const s = dungAhamoveGia(express).listen(0, '127.0.0.1', () => ok(s)); });
  const gocAha = `http://127.0.0.1:${svAha.address().port}`;
  process.env.AHAMOVE_BASE_URL = gocAha;
  const datGoiY = (co) => { if (co) { process.env.AHAMOVE_DIA_CHI_URL = gocAha; process.env.AHAMOVE_DIA_CHI_KHOA = BI_MAT.diaChi; } else { delete process.env.AHAMOVE_DIA_CHI_URL; delete process.env.AHAMOVE_DIA_CHI_KHOA; } };

  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/refunds', require(R('refunds.js')));
  app.use('/api/pos/settings', require(R('settings.js')));
  app.use('/api/pos/hoa-don', require(R('hoaDon.js')));
  const tt = require(R('thanh-toan.js'));
  app.use('/api/pos/thanh-toan', tt);
  const gh = thuNap(R('giao-hang.js'));
  if (gh) { app.use('/api/pos/giao-hang', gh); app.use('/api/giao-hang/ahamove-bao', gh.webhook); }
  const giaoHang = thuNap(path.join(GOC, 'server', 'utils', 'giaoHang.js'));
  const ahamove = thuNap(path.join(GOC, 'server', 'utils', 'ahamove.js'));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  // ── Dữ liệu nền ──────────────────────────────────────────────────────────
  const nguoi = {};
  nguoi.owner = (await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1")).id;
  for (const v of ['manager', 'staff']) {
    nguoi[v] = Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)", ['g1_' + v, 'g1_' + v, v])).lastInsertRowid);
  }
  const tk = Object.fromEntries(Object.entries(nguoi).map(([v, id]) => [v, jwt.sign({ userId: id }, KHOA_NV, { expiresIn: '1h' })]));
  const datCaiDat = (key, value) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(value), getNow()]);
  for (const [a, b] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['loyalty_expiry_mode', 'none'], ['flash_enabled', 'false'],
    ['signup_enabled', '0'], ['thanh_toan_payos_bat_buoc', '0'], ['giao_diem_lay', J({ dia_chi: 'Quán thử, Hà Nội', lat: 21.02, lng: 105.82 })]]) await datCaiDat(a, b);
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run("UPDATE pos_products SET price = 30000, ton_gan_nhat = NULL, code = COALESCE(code, 'G1-MON') WHERE id = ?", [sp.id]);
  const spCode = (await db.queryOne('SELECT code FROM pos_products WHERE id = ?', [sp.id])).code;
  const mon = (sl = 1) => ({ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: sl });
  await db.run("INSERT INTO pos_discount_codes (code, discount_type, discount_value, is_active, usage_limit, used_count) VALUES ('G1GIAM10', 'percent', 10, 1, 0, 0)");

  const goi = async (method, url, body, token = tk.owner, them = {}) => {
    const headers = { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...them.headers };
    if (token) headers.Authorization = 'Bearer ' + token;
    imLang();
    try {
      const r = await fetch(goc + (them.congKhai ? '' : '/pos') + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      return { status: r.status, j, tho };
    } finally { noiLai(); }
  };
  const chuyenCua = (orderId) => db.queryOne('SELECT * FROM pos_giao_chuyen WHERE order_id = ?', [orderId]).catch(() => null);
  const baoVe = (body, khoa = BI_MAT.bao) => goi('POST', '/giao-hang/ahamove-bao', body, null, { congKhai: true, headers: khoa === null ? {} : { apikey: khoa } });
  const SDT_KHACH = '0911000001';
  await db.run("INSERT INTO pos_customers (phone, name) VALUES (?, 'Khách Giao')", [SDT_KHACH]).catch(() => {});
  await db.run('INSERT INTO pos_wallets (phone, balance) VALUES (?, 10000000)', [SDT_KHACH]);   // đủ cho mọi đơn giao của bài
  const soDu = async () => Number((await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [SDT_KHACH]))?.balance || 0);

  // Một báo phí (cách 2 — chữ) rồi một đơn giao trả đủ. tra: 'vi' | 'tien_mat' | 'ck'
  const baoPhi = (diaChi = 'Số 1 Ngõ Gần, Hà Nội', them = {}) => goi('POST', '/giao-hang/bao-phi', { dia_chi: diaChi, ...them });
  const daTao = [];
  async function donGiao({ tra = 'vi', sl = 2, diaChi, ghiChu = 'Tầng 3, gọi trước', sdt = SDT_KHACH } = {}) {
    const b = await baoPhi(diaChi);
    const ma = b.j.ma_bao_phi;
    const tinh = await goi('POST', '/orders/tinh-thu', { customer_phone: sdt, customer_name: 'Khách Giao', items: [mon(sl)], giao: { ma_bao_phi: ma } });
    const tong = Number(tinh.j.total || 0);
    const tien = tra === 'vi' ? { payment_method: 'balance', balance_amount: tong } : tra === 'ck' ? { payment_method: 'transfer', transfer_amount: tong }
      : { payment_method: 'cash', cash_amount: tong, cash_received: tong };
    const r = await goi('POST', '/orders', { customer_phone: sdt, customer_name: 'Khách Giao', items: [mon(sl)], shipping_fee: 1, ...tien,
      giao: { ma_bao_phi: ma, ten: 'Chị Nhận', sdt: '0988000111', ghi_chu: ghiChu } });
    if (r.j.order) daTao.push({ id: r.j.order.id, phi: A.phi });   // sổ của BÀI THỬ: phí Ahamove giả đang báo (K1 — không đọc lại bằng công thức code)
    return { bao: b, tinh, r, id: r.j.order?.id, code: r.j.order?.code, ma };
  }
  const goiXe = (id, body = {}, token = tk.staff) => goi('POST', `/giao-hang/${id}/goi-xe`, body, token);
  const huyDon = (id, body, token = tk.manager) => goi('PUT', `/orders/${id}/cancel`, body, token);

  // ═══ A · biến môi trường, khoá không lộ ═══════════════════════════════════
  muc('[A] Ahamove chỉ cài ở biến môi trường — khoá không ra trình duyệt / DB / nhật ký');
  {
    const r = await goi('GET', '/giao-hang/cai-dat');
    k('A1 GET /giao-hang/cai-dat: ahamove.da_cai = true, bản thử', r.status === 200 && r.j.ahamove?.da_cai === true && r.j.ahamove?.ban === 'thu', r.status + ' ' + r.tho.slice(0, 120));
    k('A1 câu trả cai-dat không chứa khoá / token', r.status === 200 && !coBiMat(r.tho));
    datAhamove(false);
    const r2 = await goi('GET', '/giao-hang/cai-dat');
    const b2 = await baoPhi();
    datAhamove(true);
    k('A4 thiếu AHAMOVE_API_KEY → da_cai = false; báo phí 503 AHAMOVE_CHUA_CAI', r2.j.ahamove?.da_cai === false && b2.status === 503 && b2.j.code === 'AHAMOVE_CHUA_CAI', `${r2.j.ahamove?.da_cai} ${b2.status} ${b2.j.code}`);
    const luu = { m: process.env.AHAMOVE_MOI_TRUONG, b: process.env.AHAMOVE_BASE_URL };
    delete process.env.AHAMOVE_BASE_URL;
    const gocDung = [];
    for (const mt of [undefined, 'staging', 'production', 'PRODUCTION ', 'lung tung']) {
      if (mt === undefined) delete process.env.AHAMOVE_MOI_TRUONG; else process.env.AHAMOVE_MOI_TRUONG = mt;
      gocDung.push(ahamove?.gocAhamove?.());
    }
    process.env.AHAMOVE_BASE_URL = luu.b; if (luu.m === undefined) delete process.env.AHAMOVE_MOI_TRUONG; else process.env.AHAMOVE_MOI_TRUONG = luu.m;
    const STG = 'https://partner-apistg.ahamove.com', PRD = 'https://partner-api.ahamove.com';
    k('A5 AHAMOVE_MOI_TRUONG: thiếu / staging / lạ → gốc THỬ; đúng "production" (bỏ khoảng trắng, hoa thường) → gốc THẬT',
      J(gocDung) === J([STG, STG, PRD, PRD, STG]), J(gocDung));
    process.env.AHAMOVE_MOI_TRUONG = 'production';
    const r3 = await goi('GET', '/giao-hang/cai-dat');
    delete process.env.AHAMOVE_MOI_TRUONG;
    k('A5 production → cai-dat báo bản thật', r3.j.ahamove?.ban === 'that', J(r3.j.ahamove));
    A.hong = 'bao_phi';
    const r4 = await baoPhi();
    A.hong = null;
    k('A7 Ahamove 500 → 502 AHAMOVE_LOI, câu trả không chứa lời nội bộ của Ahamove / token', r4.status === 502 && r4.j.code === 'AHAMOVE_LOI' && !r4.tho.includes('noi bo XYZ') && !coBiMat(r4.tho), r4.status + ' ' + r4.tho.slice(0, 100));
    const luuBao = process.env.AHAMOVE_KHOA_BAO;
    delete process.env.AHAMOVE_KHOA_BAO;
    const r5 = await baoVe({ _id: 'AHA0', status: 'ACCEPTED' }, 'bat_ky');
    process.env.AHAMOVE_KHOA_BAO = luuBao;
    k('A8 thiếu AHAMOVE_KHOA_BAO → tin báo về 503 (không nhận tin nào)', r5.status === 503, String(r5.status));
    const bk = fs.readFileSync(R('backup.js'), 'utf8');
    k('A2 backup.js: ba bảng pos_giao_* có trong BACKUP_TABLES và trong danh sách KHÔNG khôi phục',
      ['pos_giao_chuyen', 'pos_giao_bao_phi', 'pos_giao_tin'].every((t) => new RegExp(`name: '${t}'`).test(bk) && new RegExp(`'${t}'`).test(bk.slice(bk.indexOf('BANG_KHONG_KHOI_PHUC = ')))));
  }

  // ═══ B · Cài đặt → Giao hàng ═══════════════════════════════════════════════
  muc('[B] Cài đặt → Giao hàng (chủ quán sửa; sai một khoá không ghi khoá nào)');
  {
    const r0 = await goi('GET', '/giao-hang/cai-dat');
    const cd0 = r0.j.cai_dat || {};
    k('B4 chưa lưu → mặc định: 2 phút/món, 6 phút tìm xe, 15 phút nhắc, HAN-BIKE', cd0.phut_moi_mon === 2 && cd0.phut_tim_xe === 6 && cd0.phut_nhac === 15 && cd0.loai_xe === 'HAN-BIKE', J(cd0));
    const tot = { giao_km_toi_da: '5', giao_gio_nhan: '', giao_loai_xe: 'HAN-BIKE', giao_phut_moi_mon: '2', giao_phut_tim_xe: '6', giao_phut_nhac: '15', giao_sdt_quan: '0912345678' };
    const r1 = await goi('PUT', '/settings', { settings: tot });
    const r1b = await goi('GET', '/giao-hang/cai-dat');
    k('B1 lưu đủ khoá giao_* → cai-dat đọc lại đúng', r1.status === 200 && r1b.j.cai_dat?.km_toi_da === 5 && r1b.j.cai_dat?.sdt_quan === '0912345678', r1.status + ' ' + J(r1b.j.cai_dat));
    for (const [ten, sai] of [['km âm', { giao_km_toi_da: '-1' }], ['giờ sai', { giao_gio_nhan: '25:00-26:00' }], ['loại xe lạ', { giao_loai_xe: 'HAN-TRUCK' }],
      ['phút không nguyên', { giao_phut_moi_mon: '1.5' }], ['điểm lấy gõ tay', { giao_diem_lay: '{"dia_chi":"x","lat":1,"lng":2}' }], ['khoá giao_ lạ', { giao_la: '1' }]]) {
      const r = await goi('PUT', '/settings', { settings: { ...tot, giao_km_toi_da: '9', ...sai } });
      const km = (await db.queryOne("SELECT value FROM pos_settings WHERE key = 'giao_km_toi_da'"))?.value;
      k(`B2 ${ten} → 400 CAI_DAT_KHONG_HOP_LE, không khoá nào đổi`, r.status === 400 && r.j.code === 'CAI_DAT_KHONG_HOP_LE' && km === '5', `${r.status} ${r.j.code} km=${km}`);
    }
    const r3 = await goi('PUT', '/settings', { settings: { giao_km_toi_da: '9' } }, tk.staff);
    k('B3 nhân viên sửa cài đặt giao → 403', r3.status === 403, String(r3.status));
    datGoiY(true);
    const d1 = await goi('POST', '/giao-hang/diem-lay', { ma_goi_y: 'LAY' }, tk.staff);
    const d2 = await goi('POST', '/giao-hang/diem-lay', { ma_goi_y: 'LAY' });
    const dl = JSON.parse((await db.queryOne("SELECT value FROM pos_settings WHERE key = 'giao_diem_lay'"))?.value || '{}');
    k('B7 điểm lấy hàng: nhân viên 403; chủ quán chọn gợi ý → lưu địa chỉ + toạ độ', d1.status === 403 && d2.status === 200 && dl.lat === 21.02 && dl.lng === 105.82 && /Tứ Quý/.test(dl.dia_chi), `${d1.status} ${d2.status} ${J(dl)}`);
    datGoiY(false);
    const h = Number(getNow().slice(11, 13));
    const hh = (x) => String((x + 24) % 24).padStart(2, '0') + ':00';
    await datCaiDat('giao_gio_nhan', `${hh(h + 2)}-${hh(h + 3)}`);
    const n1 = await baoPhi();
    await datCaiDat('giao_gio_nhan', `${hh(h - 1)}-${hh(h + 1)}`);
    const n2 = await baoPhi();
    await datCaiDat('giao_gio_nhan', '');
    k('B5 ngoài giờ nhận đơn giao → 400 NGOAI_GIO_GIAO; trong giờ (kể cả khung qua nửa đêm) → 200', n1.status === 400 && n1.j.code === 'NGOAI_GIO_GIAO' && n2.status === 200, `${n1.status} ${n1.j.code} / ${n2.status} ${n2.j.code}`);
    await datCaiDat('giao_loai_xe', 'HAN-EXPRESS');
    A.baoPhi.length = 0;
    await baoPhi();
    await datCaiDat('giao_loai_xe', 'HAN-BIKE');
    k('B6 loại xe mặc định (Cài đặt) tới lệnh báo phí Ahamove', A.baoPhi[0]?.services?.[0]?._id === 'HAN-EXPRESS', J(A.baoPhi[0]?.services));
  }

  // ═══ C · ô địa chỉ ══════════════════════════════════════════════════════════
  muc('[C] Ô địa chỉ: một hàm máy chủ, hai cách (gợi ý Ahamove | chữ + nhân viên xác nhận)');
  {
    datGoiY(true);
    const g = await goi('GET', '/giao-hang/dia-chi?q=' + encodeURIComponent('Số 1 Ngõ'));
    k('C3 cách 1: gợi ý qua máy chủ — Ahamove nhận đúng apikey, trình duyệt không thấy khoá', g.status === 200 && g.j.cach === 'goi_y' && g.j.goi_y?.some((x) => x.ma === 'G1')
      && A.goiY.at(-1)?.apikey === BI_MAT.diaChi && !coBiMat(g.tho), g.status + ' ' + g.tho.slice(0, 120));
    const c1 = await baoPhi('Số 1 Ngõ Gần, Hà Nội');
    A.baoPhi.length = 0;
    const c1b = await goi('POST', '/giao-hang/bao-phi', { ma_goi_y: 'G1' });
    const den = A.baoPhi[0]?.path?.[1] || {};
    k('C1 cách 1 bật: gõ chữ không chọn gợi ý → 400 DIA_CHI_PHAI_CHON_GOI_Y', c1.status === 400 && c1.j.code === 'DIA_CHI_PHAI_CHON_GOI_Y', `${c1.status} ${c1.j.code}`);
    k('C1 cách 1: chọn gợi ý → báo phí với toạ độ của gợi ý', c1b.status === 200 && den.lat === 21.01 && den.lng === 105.81 && c1b.j.can_xac_nhan === false, `${c1b.status} ${J(den)}`);
    const c1c = await goi('POST', '/giao-hang/bao-phi', { ma_goi_y: 'KHONG_CO' });
    k('C1 cách 1: mã gợi ý không có ở Ahamove → 400 (không báo phí)', c1c.status === 400, `${c1c.status} ${c1c.j.code}`);
    datGoiY(false);
    const g2 = await goi('GET', '/giao-hang/dia-chi?q=' + encodeURIComponent('Số 1 Ngõ Gần'));
    const c2 = await baoPhi('Số 1 Ngõ Gần, Hà Nội');
    k('C1b cách 2 (chưa có khoá gợi ý): dia-chi báo cach = xac_nhan; báo phí bằng chữ → km + phí + can_xac_nhan', g2.j.cach === 'xac_nhan' && c2.status === 200
      && c2.j.km === 3 && c2.j.phi === 25000 && c2.j.can_xac_nhan === true && typeof c2.j.ma_bao_phi === 'string' && c2.j.ma_bao_phi.length >= 32, J(c2.j).slice(0, 160));
    const c2b = await baoPhi('  ');
    k('C1b cách 2: chữ rỗng → 400', c2b.status === 400, String(c2b.status));
    const e1 = await baoPhi('Số 9 Đường Biên, Hà Nội');
    const e2 = await baoPhi('Số 9 Đường Xa, Hà Nội');
    k('C2 km = tối đa (5) → qua; 5,1 → 400 QUA_KHOANG_CACH', e1.status === 200 && e2.status === 400 && e2.j.code === 'QUA_KHOANG_CACH', `${e1.status} / ${e2.status} ${e2.j.code}`);
  }

  // ═══ D · Bán hàng — đơn giao ═══════════════════════════════════════════════
  muc('[D] Đơn giao ở quầy: phí ship do MÁY CHỦ lấy từ báo phí, dòng riêng, thu đủ trước');
  let d1 = null;
  {
    d1 = await donGiao();
    k('D1 đơn giao: shipping_fee = phí báo (25.000), bỏ qua số màn hình gửi', d1.r.status === 200 && d1.r.j.order?.shipping_fee === 25000, `${d1.r.status} ${d1.r.tho.slice(0, 160)}`);
    k('K5f tinh-thu có giao: trả phí ship đúng mà KHÔNG tiêu báo phí', d1.tinh.j.shipping_fee === 25000 && d1.r.status === 200, J(d1.tinh.j).slice(0, 120));
    const ch = await chuyenCua(d1.id);
    k('D6 đơn giao vào "Đang pha": chuyến dang_pha, giờ nhận, người nhận, ghi chú tài xế', ch?.trang_thai === 'dang_pha' && !!ch.nhan_luc && ch.ten_nhan === 'Chị Nhận'
      && ch.ghi_chu === 'Tầng 3, gọi trước' && ch.phi_khach === 25000, J(ch).slice(0, 200));
    const lai = await goi('POST', '/orders', { customer_phone: SDT_KHACH, items: [mon(1)], payment_method: 'balance', balance_amount: 55000, giao: { ma_bao_phi: d1.ma, ten: 'A', sdt: '0988000111' } });
    const bp = await db.queryOne('SELECT order_id FROM pos_giao_bao_phi WHERE ma = ?', [d1.ma]).catch(() => null);
    k('D4 dùng lại một báo phí cho đơn thứ hai → 400 BAO_PHI_DA_DUNG; báo phí vẫn gắn đơn đầu', lai.status === 400 && lai.j.code === 'BAO_PHI_DA_DUNG' && Number(bp?.order_id) === d1.id, `${lai.status} ${lai.j.code}`);
    const b2 = await baoPhi();
    const t2 = await goi('POST', '/orders/tinh-thu', { customer_phone: SDT_KHACH, items: [mon(2)], discount_code: 'G1GIAM10', giao: { ma_bao_phi: b2.j.ma_bao_phi } });
    k('D2 mã giảm 10% chỉ giảm tiền món, phí ship nguyên (54.000 + 25.000)', t2.j.total === 79000 && t2.j.shipping_fee === 25000, J(t2.j).slice(0, 160));
    const no = await goi('POST', '/orders', { customer_phone: SDT_KHACH, items: [mon(1)], payment_method: 'debt', debt_amount: 55000, giao: { ma_bao_phi: b2.j.ma_bao_phi, ten: 'A', sdt: '0988000111' } });
    k('D8 đơn giao ghi nợ / chưa thu đủ → 400 GIAO_PHAI_THU_DU', no.status === 400 && no.j.code === 'GIAO_PHAI_THU_DU', `${no.status} ${no.j.code}`);
    const sai = await goi('POST', '/orders/tinh-thu', { items: [mon(1)], giao: { ma_bao_phi: 'f'.repeat(32) } });
    k('D4 mã báo phí không có → 400 BAO_PHI_KHONG_HOP_LE', sai.status === 400 && sai.j.code === 'BAO_PHI_KHONG_HOP_LE', `${sai.status} ${sai.j.code}`);
    // D5 + D9: phiên tiền mặt (giuCho) — tạo phiên còn hạn, báo phí hết hạn rồi mới chốt → vẫn tạo đơn
    const b3 = await baoPhi();
    const ph = await goi('POST', '/thanh-toan/phien', { cach: 'tien_mat', don: { customer_phone: SDT_KHACH, customer_name: 'Khách Giao', items: [mon(1)],
      giao: { ma_bao_phi: b3.j.ma_bao_phi, ten: 'Anh Phiên', sdt: '0988000222', ghi_chu: '' } } });
    await db.run("UPDATE pos_giao_bao_phi SET het_han = '2000-01-01T00:00:00' WHERE ma = ?", [b3.j.ma_bao_phi]).catch(() => {});
    const hh = await goi('POST', '/orders/tinh-thu', { items: [mon(1)], giao: { ma_bao_phi: b3.j.ma_bao_phi } });
    const chot = ph.j.phien ? await goi('POST', `/thanh-toan/phien/${ph.j.phien.id}/chot`, { cash_received: 60000 }) : { status: 0, j: {}, tho: '' };
    const oid = chot.j.order?.id;
    if (oid) daTao.push({ id: oid, phi: 25000 });
    const ch3 = oid ? await chuyenCua(oid) : null;
    k('D5 báo phí hết hạn → tính tiền 400 BAO_PHI_HET_HAN', hh.status === 400 && hh.j.code === 'BAO_PHI_HET_HAN', `${hh.status} ${hh.j.code}`);
    k('D9 + D5 phiên tiền mặt mang giao (giuCho), chốt SAU hạn báo phí vẫn tạo đơn giao — tiền khách đã nhận', ph.status === 200 && ph.j.phien?.tong === 55000
      && chot.status === 200 && ch3?.ten_nhan === 'Anh Phiên', `${ph.status} ${ph.j.phien?.tong} ${chot.status} ${chot.tho.slice(0, 100)}`);
    const p = oid ? await db.queryOne("SELECT points FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [oid]) : null;
    const o3 = oid ? await db.queryOne('SELECT shipping_fee FROM pos_orders WHERE id = ?', [oid]) : null;
    k('D3 điểm KHÔNG tính phí ship: đơn giao tiền mặt 55.000 (30.000 món + 25.000 ship) → 3 điểm, không phải 5', o3?.shipping_fee === 25000 && Number(p?.points) === 3,
      `ship ${o3?.shipping_fee} điểm ${p?.points}`);
    const hd = await goi('GET', `/hoa-don/${d1.id}`);
    k('D7 hoá đơn có giao.dia_chi (dòng "GIAO HÀNG")', hd.j.hoa_don?.giao?.dia_chi === 'Số 1 Ngõ Gần, Hà Nội' && hd.j.hoa_don?.giao?.nguoi_nhan === 'Chị Nhận', J(hd.j.hoa_don?.giao));
    const thuong = await goi('POST', '/orders', { items: [mon(1)], shipping_fee: 7000, payment_method: 'cash', cash_amount: 37000, cash_received: 37000 });
    const hd2 = thuong.j.order ? await goi('GET', `/hoa-don/${thuong.j.order.id}`) : { j: {} };
    k('K5a đơn KHÔNG giao: shipping_fee màn hình gửi vẫn như cũ (7.000), không chuyến, hoá đơn không có giao', thuong.status === 200 && thuong.j.order?.shipping_fee === 7000
      && !(await chuyenCua(thuong.j.order.id)) && !hd2.j.hoa_don?.giao, `${thuong.status} ${thuong.tho.slice(0, 120)}`);
  }

  // ═══ E + F · màn Giao hàng, giờ gọi tài xế ═════════════════════════════════
  muc('[E·F] Màn Giao hàng 4 cột + giờ gợi ý gọi tài xế');
  {
    const f = giaoHang?.gioGoiTaiXe;
    const cd = { phut_moi_mon: 2, phut_tim_xe: 6 };
    k('F1 một đơn 5 món: 10:00 + 5×2 − 6 = 10:04', f && f('2026-11-06T10:00:00', 5, cd) === '2026-11-06T10:04:00', f ? f('2026-11-06T10:00:00', 5, cd) : 'chưa có hàm');
    k('F2 đơn sau có 4 món đang pha trước + 3 món của nó: 10:00 + 7×2 − 6 = 10:08', f && f('2026-11-06T10:00:00', 7, cd) === '2026-11-06T10:08:00');
    k('F3 1 món: 2 − 6 < 0 → không sớm hơn giờ nhận (10:00)', f && f('2026-11-06T10:00:00', 1, cd) === '2026-11-06T10:00:00');
    k('F3 qua nửa đêm: 23:58 + 5×2 − 6 = 00:02 hôm sau', f && f('2026-11-06T23:58:00', 5, cd) === '2026-11-07T00:02:00');
    const ds = await goi('GET', '/giao-hang');
    const the = (ds.j.chuyen || []).find((x) => x.order_id === d1.id);
    k('E1 GET /giao-hang: thẻ đơn giao ở cột dang_pha, có món, km, người nhận', ds.status === 200 && the?.cot === 'dang_pha' && the?.so_mon === 2 && the?.km === 3
      && the?.mon?.[0]?.sl === 2 && the?.ten === 'Chị Nhận', ds.status + ' ' + J(the).slice(0, 200));
    const dangPha = (ds.j.chuyen || []).filter((x) => x.trang_thai === 'dang_pha').sort((a, b) => a.nhan_luc.localeCompare(b.nhan_luc) || a.id - b.id);
    const sau = dangPha.at(-1), truoc = dangPha.slice(0, -1).reduce((s, x) => s + x.so_mon, 0);
    k('F2 qua máy chủ: giờ gợi ý của thẻ cuối cộng món các đơn đang pha trước nó', dangPha.length >= 2 && sau.goi_luc_goi_y === f(sau.nhan_luc, truoc + sau.so_mon, { phut_moi_mon: 2, phut_tim_xe: 6 }),
      J(dangPha.map((x) => [x.so_mon, x.nhan_luc, x.goi_luc_goi_y])));
    // E2: cột Mới (đơn App — KH-MUA-2 sau): dựng một chuyến 'moi' bằng tay rồi Nhận
    const dm = await donGiao({ sl: 1 });
    await db.run("UPDATE pos_giao_chuyen SET trang_thai = 'moi', nhan_luc = NULL WHERE order_id = ?", [dm.id]).catch(() => {});
    const ds2 = await goi('GET', '/giao-hang');
    const n1 = await goi('POST', `/giao-hang/${dm.id}/nhan`, {}, tk.staff);
    const n2 = await goi('POST', `/giao-hang/${dm.id}/nhan`, {}, tk.staff);
    const chm = await chuyenCua(dm.id);
    k('E2 cột Mới: thẻ moi ở cột moi; Nhận → dang_pha + giờ nhận; Nhận lần hai → 409', (ds2.j.chuyen || []).find((x) => x.order_id === dm.id)?.cot === 'moi'
      && n1.status === 200 && chm?.trang_thai === 'dang_pha' && !!chm?.nhan_luc && n2.status === 409, `${n1.status} ${n2.status} ${chm?.trang_thai}`);
    const tc = await huyDon(dm.id, { reason: 'thử' }, tk.staff);
    k('J11 nhân viên Từ chối / huỷ đơn giao → 403', tc.status === 403, String(tc.status));
    // F4: cờ máy chủ so giờ (màn không dùng đồng hồ máy quầy): đơn 5 món vừa nhận → chưa tới giờ, chưa nhắc; nhận từ hôm qua → tới giờ + nhắc
    const f4 = await donGiao({ sl: 5 });
    const the4 = async () => ((await goi('GET', '/giao-hang')).j.chuyen || []).find((x) => x.order_id === f4.id);
    const u1 = await the4();
    await db.run('UPDATE pos_giao_chuyen SET nhan_luc = ? WHERE order_id = ?', [new Date(Date.parse(getNow() + 'Z') - 86400000).toISOString().slice(0, 19), f4.id]).catch(() => {});
    const u2 = await the4();
    k('F4 toi_gio / nhac do máy chủ tính: vừa nhận → false / false; nhận từ hôm qua → true / true', u1?.toi_gio === false && u1?.nhac === false
      && u2?.toi_gio === true && u2?.nhac === true, `${u1?.toi_gio}/${u1?.nhac} → ${u2?.toi_gio}/${u2?.nhac}`);
  }

  // ═══ G · gọi xe ══════════════════════════════════════════════════════════════
  muc('[G] Gọi xe: thu đủ trước, một chuyến dù bấm hai lần / hai máy, lỗi mạng không tạo chuyến thứ hai');
  let gx = null;
  {
    gx = await donGiao({ sl: 1, ghiChu: 'Ngõ 5, nhà xanh' });
    await db.run("UPDATE pos_orders SET payment_status = 'pending' WHERE id = ?", [gx.id]);
    const g1 = await goiXe(gx.id);
    await db.run("UPDATE pos_orders SET payment_status = 'paid' WHERE id = ?", [gx.id]);
    k('G1 đơn chưa thu đủ → 409 CHUA_THU_DU, không gọi Ahamove', g1.status === 409 && g1.j.code === 'CHUA_THU_DU', `${g1.status} ${g1.j.code}`);
    A.phi = 30000;
    const truoc = A.tao.length;
    const [a, b] = await Promise.all([goiXe(gx.id), goiXe(gx.id, {}, tk.manager)]);
    A.phi = 25000;
    k('G2 hai máy cùng bấm Gọi tài xế → MỘT chuyến ở Ahamove; một máy 200, máy kia 409', A.tao.length === truoc + 1 && [a.status, b.status].sort().join() === '200,409', `${a.status} ${b.status} tạo ${A.tao.length - truoc}`);
    const g3 = await goiXe(gx.id);
    k('G3 bấm lại sau khi đã có chuyến → 409, không tạo thêm', g3.status === 409 && A.tao.length === truoc + 1, String(g3.status));
    const body = A.tao.at(-1) || {};
    const ch = await chuyenCua(gx.id);
    k('G6 mã theo dõi = số HD; toạ độ / địa chỉ điểm giao = đã lưu; không COD', body.path?.[1]?.tracking_number === gx.code && body.path?.[1]?.address === 'Số 1 Ngõ Gần, Hà Nội'
      && body.path?.[0]?.address && !('cod' in (body.path?.[1] || {})), J(body).slice(0, 220));
    k('C4 ghi chú cho tài xế tới remarks của điểm giao', body.path?.[1]?.remarks === 'Ngõ 5, nhà xanh', J(body.path?.[1]));
    k('G5 phí thật 30.000 ≠ khách trả 25.000 → chenh = +5.000 (quán bù), chuyến tim_xe', ch?.trang_thai === 'tim_xe' && ch?.phi_that === 30000 && ch?.chenh === 5000 && ch?.ma_ahamove === 'AHA' + A.soChuyen,
      J(ch).slice(0, 200));
    const ds = await goi('GET', '/giao-hang');
    const the = (ds.j.chuyen || []).find((x) => x.order_id === gx.id);
    k('G7 thẻ trả chenh để hiện "quán bù X đ"; cột doi_tai_xe', the?.chenh === 5000 && the?.cot === 'doi_tai_xe', J(the).slice(0, 160));
    // G4: Ahamove tạo xong nhưng câu trả bị cắt → bấm lại tra theo mã, KHÔNG tạo chuyến thứ hai
    const g4 = await donGiao({ sl: 1 });
    A.nuot = true;
    const t1 = A.tao.length;
    const x1 = await goiXe(g4.id);
    const chx = await chuyenCua(g4.id);
    const x2 = await goiXe(g4.id);
    const chy = await chuyenCua(g4.id);
    k('G4 lỗi mạng giữa chừng → báo rõ, chuyến giữ "đang gọi" + lỗi', x1.status >= 500 && chx?.trang_thai === 'dang_goi' && !!chx?.loi, `${x1.status} ${chx?.trang_thai} ${chx?.loi}`);
    k('G4 bấm lại → nhận chuyến đã có theo mã theo dõi, Ahamove chỉ có MỘT chuyến', x2.status === 200 && A.tao.length === t1 + 1 && chy?.trang_thai === 'tim_xe' && chy?.ma_ahamove === 'AHA' + A.soChuyen,
      `${x2.status} tạo ${A.tao.length - t1} ${chy?.trang_thai} ${chy?.ma_ahamove}`);
    // I3: Ahamove từ chối tạo → về Đang pha + lỗi, đơn còn nguyên
    const g5 = await donGiao({ sl: 1 });
    A.hong = 'tao';
    const x3 = await goiXe(g5.id);
    A.hong = null;
    const chz = await chuyenCua(g5.id);
    const dz = await db.queryOne('SELECT status FROM pos_orders WHERE id = ?', [g5.id]);
    k('I3 Ahamove lỗi khi tạo chuyến → 502, thẻ về dang_pha + lỗi, đơn còn', x3.status === 502 && chz?.trang_thai === 'dang_pha' && !!chz?.loi && dz?.status === 'completed', `${x3.status} ${chz?.trang_thai}`);
  }

  // ═══ H · Ahamove báo về ══════════════════════════════════════════════════════
  muc('[H] Tin Ahamove báo về: xác thực khoá, chống lặp, đọc lại trạng thái từ Ahamove');
  {
    const ch0 = await chuyenCua(gx.id);
    const id = ch0?.ma_ahamove || 'AHA_KHONG';
    const h1 = await baoVe({ _id: id, status: 'COMPLETED' }, BI_MAT.bao.slice(0, -1) + 'x');
    const h2 = await baoVe({ _id: id, status: 'COMPLETED' }, null);
    const h2b = await baoVe({ _id: id, status: 'COMPLETED' }, BI_MAT.bao + 'x');
    k('H1 sai khoá (cùng độ dài) → 401 BAO_SAI_KHOA; H2 thiếu header / dài hơn → 401; chuyến không đổi', h1.status === 401 && h1.j.code === 'BAO_SAI_KHOA' && h2.status === 401 && h2b.status === 401
      && (await chuyenCua(gx.id))?.trang_thai === 'tim_xe', `${h1.status} ${h2.status} ${h2b.status}`);
    if (A.chuyen.has(id)) datTrangThai(id, { status: 'ACCEPTED', supplier_name: 'Tài Xế A', supplier_id: '0977000333', supplier_plate: '29B1-12345' });
    const h4 = await baoVe({ _id: id, status: 'COMPLETED' });
    const ch1 = await chuyenCua(gx.id);
    k('H4 thân tin nói COMPLETED nhưng Ahamove (đọc lại) nói ACCEPTED → doi_tai_xe', h4.status === 200 && ch1?.trang_thai === 'doi_tai_xe', `${h4.status} ${ch1?.trang_thai}`);
    k('H5 + H10 có tài xế: tên, SĐT, biển số, giờ có xe được lưu', ch1?.tai_xe_ten === 'Tài Xế A' && ch1?.tai_xe_sdt === '0977000333' && ch1?.tai_xe_bien_so === '29B1-12345' && !!ch1?.co_xe_luc,
      J(ch1).slice(0, 220));
    const nTin = Number((await db.queryOne('SELECT COUNT(*) AS n FROM pos_giao_tin').catch(() => ({ n: -1 }))).n);
    if (A.chuyen.has(id)) datTrangThai(id, { supplier_name: 'Đổi Tên Giả' });   // Ahamove vẫn ACCEPTED: báo lại (thân khác) = tin lặp
    const h3 = await baoVe({ _id: id, status: 'ACCEPTED', sub_status: 'lap' });
    const nTin2 = Number((await db.queryOne('SELECT COUNT(*) AS n FROM pos_giao_tin').catch(() => ({ n: -1 }))).n);
    const ch1b = await chuyenCua(gx.id);
    k('H3 tin lặp (Ahamove đọc lại vẫn cùng trạng thái) → 200, không thêm dòng, không đổi gì', h3.status === 200 && nTin2 === nTin && nTin > 0
      && ch1b?.trang_thai === 'doi_tai_xe' && ch1b?.tai_xe_ten === 'Tài Xế A', `${h3.status} ${nTin}→${nTin2} ${ch1b?.tai_xe_ten}`);
    if (A.chuyen.has(id)) datTrangThai(id, { status: 'IN PROCESS', supplier_name: 'Tài Xế A' });
    const h6 = await baoVe({ _id: id, status: 'IN PROCESS' });
    const ch2 = await chuyenCua(gx.id);
    k('H6 tài xế lấy hàng → TỰ sang dang_giao + giờ lấy hàng (quầy không bấm)', h6.status === 200 && ch2?.trang_thai === 'dang_giao' && !!ch2?.lay_hang_luc, `${ch2?.trang_thai}`);
    if (A.chuyen.has(id)) datTrangThai(id, { status: 'ASSIGNING' });   // trạng thái chưa từng báo (lớp chống lặp không che) nhưng LÙI
    const h8 = await baoVe({ _id: id, status: 'ASSIGNING', sub_status: 'tre' });
    if (A.chuyen.has(id)) datTrangThai(id, { status: 'IN PROCESS' });
    k('H8 tin trễ lùi trạng thái (ASSIGNING sau IN PROCESS) → bỏ qua, vẫn dang_giao', h8.status === 200 && (await chuyenCua(gx.id))?.trang_thai === 'dang_giao');
    const j6 = await huyDon(gx.id, { reason: 'khách đổi ý', do_da_pha: 'bo_di' });
    const j6b = await goi('POST', `/giao-hang/${gx.id}/huy-chuyen`, { ly_do: 'khách đổi ý' }, tk.manager);
    k('J6 đang giao → huỷ đơn 409 DANG_GIAO_KHONG_HUY; huỷ chuyến 409', j6.status === 409 && j6.j.code === 'DANG_GIAO_KHONG_HUY' && j6b.status === 409, `${j6.status} ${j6.j.code} ${j6b.status}`);
    if (A.chuyen.has(id)) datTrangThai(id, { status: 'COMPLETED', path: [{}, { status: 'COMPLETED' }], total_price: 30000 });
    const h7 = await baoVe({ _id: id, status: 'COMPLETED' });
    const ch3 = await chuyenCua(gx.id);
    k('H7 giao xong → xong + giờ xong; thẻ rời màn Giao hàng', h7.status === 200 && ch3?.trang_thai === 'xong' && !!ch3?.xong_luc
      && !((await goi('GET', '/giao-hang')).j.chuyen || []).some((x) => x.order_id === gx.id), `${ch3?.trang_thai}`);
    const la = await baoVe({ _id: 'KHONG_CUA_QUAN', status: 'ACCEPTED' });
    k('H tin của chuyến không thuộc quán → 200, không làm gì', la.status === 200);
    k('A3 tin báo không lưu header / khoá: bảng pos_giao_tin không chứa khoá', !(await db.query('SELECT * FROM pos_giao_tin').catch(() => [])).some((r) => coBiMat(J(r))));
  }

  // ═══ H9 in tem · I sự cố ════════════════════════════════════════════════════
  muc('[H9·I] In tem túi một lần; tìm xe lâu; tài xế huỷ → tự tìm lại MỘT lần');
  {
    const d = await donGiao({ sl: 1 });
    const [t1, t2] = await Promise.all([goi('POST', `/giao-hang/${d.id}/in-tem`, {}, tk.staff), goi('POST', `/giao-hang/${d.id}/in-tem`, {}, tk.manager)]);
    const t3 = await goi('POST', `/giao-hang/${d.id}/in-tem`, { lai: true }, tk.staff);
    k('H9 hai máy mở màn cùng in tem tự động → một máy được in; in lại → lần 2', [t1.j.duoc, t2.j.duoc].filter(Boolean).length === 1 && t3.j.duoc === true && t3.j.lan === 2,
      `${t1.status}/${t1.j.duoc} ${t2.status}/${t2.j.duoc} ${t3.j.lan}`);
    await goiXe(d.id);
    const ch = await chuyenCua(d.id);
    const tim = async (giay) => {
      const luc = new Date(Date.parse(getNow() + 'Z') - giay * 1000).toISOString().slice(0, 19);
      await db.run('UPDATE pos_giao_chuyen SET goi_luc = ?, doc_luc = ? WHERE order_id = ?', [luc, getNow(), d.id]).catch(() => {});
      return ((await goi('GET', '/giao-hang')).j.chuyen || []).find((x) => x.order_id === d.id);
    };
    const a = await tim(599), b = await tim(601);
    k('I1 tìm xe 9:59 → chưa báo; 10:01 → tim_lau (thẻ đỏ, nút Tìm lại)', a?.tim_lau === false && b?.tim_lau === true, `${a?.tim_lau} ${b?.tim_lau}`);
    await tim(599);
    const r0 = await goiXe(d.id);
    await tim(601);
    const truoc = A.tao.length;
    A.phiHuy = 2000;
    const r1 = await goiXe(d.id, { loai_xe: 'HAN-EXPRESS' });
    A.phiHuy = 0;
    const ch2 = await chuyenCua(d.id);
    k('I4b Tìm lại: phí huỷ chuyến cũ (2.000) cộng vào phi_huy của chuyến (quán chịu, vào Đối soát)', ch2?.phi_huy === 2000, String(ch2?.phi_huy));
    k('I4 Tìm lại: chưa lâu → 409; lâu → huỷ chuyến cũ ở Ahamove + tạo chuyến mới loại xe đã đổi', r0.status === 409 && r1.status === 200 && A.huy.some((x) => x.id === ch?.ma_ahamove)
      && A.tao.length === truoc + 1 && A.tao.at(-1)?.service_id === 'HAN-EXPRESS' && ch2?.ma_ahamove !== ch?.ma_ahamove, `${r0.status} ${r1.status} huỷ ${A.huy.length}`);
    // I2: tài xế huỷ → tự tìm lại MỘT lần (hai tin khác nhau đến cùng lúc vẫn một chuyến mới)
    const ma = ch2?.ma_ahamove;
    if (A.chuyen.has(ma)) datTrangThai(ma, { status: 'CANCELLED', cancel_by_user: false });
    const t0 = A.tao.length;
    await Promise.all([baoVe({ _id: ma, status: 'CANCELLED', sub_status: 'a' }), baoVe({ _id: ma, status: 'CANCELLED', sub_status: 'b' })]);
    const ch3 = await chuyenCua(d.id);
    k('I2 tài xế huỷ → tự tìm lại MỘT lần (hai tin cùng lúc vẫn một chuyến mới) + báo quầy', A.tao.length === t0 + 1 && ch3?.trang_thai === 'tim_xe' && ch3?.ma_ahamove !== ma && !!ch3?.loi,
      `tạo ${A.tao.length - t0} ${ch3?.trang_thai} ${ch3?.loi}`);
    const ma2 = ch3?.ma_ahamove;
    if (A.chuyen.has(ma2)) datTrangThai(ma2, { status: 'CANCELLED', cancel_by_user: false });
    await baoVe({ _id: ma2, status: 'CANCELLED' });
    const ch4 = await chuyenCua(d.id);
    k('I2 tài xế huỷ lần nữa → không tự tìm thêm, chuyen_huy (thẻ đỏ, quầy gọi lại / huỷ)', A.tao.length === t0 + 1 && ch4?.trang_thai === 'chuyen_huy', `${ch4?.trang_thai}`);
    const lai = await goiXe(d.id);
    k('I gọi lại từ chuyen_huy → chuyến mới', lai.status === 200 && (await chuyenCua(d.id))?.trang_thai === 'tim_xe', String(lai.status));
    // I5: Ahamove huỷ khi tài xế ĐÃ lấy hàng → KHÔNG tự gọi xe mới (hàng đang ngoài đường), báo quầy
    const e5 = await donGiao({ sl: 1 });
    await goiXe(e5.id);
    const m5 = (await chuyenCua(e5.id))?.ma_ahamove;
    if (A.chuyen.has(m5)) datTrangThai(m5, { status: 'IN PROCESS', supplier_name: 'TX E', supplier_id: '0977000666' });
    await baoVe({ _id: m5, status: 'IN PROCESS' });
    if (A.chuyen.has(m5)) datTrangThai(m5, { status: 'CANCELLED', cancel_by_user: false });
    const t5 = A.tao.length;
    await baoVe({ _id: m5, status: 'CANCELLED' });
    const c5 = await chuyenCua(e5.id);
    k('I5 huỷ khi đang giao → giao_loi + báo quầy, KHÔNG tạo chuyến mới', A.tao.length === t5 && c5?.trang_thai === 'giao_loi' && !!c5?.loi, `tạo ${A.tao.length - t5} ${c5?.trang_thai}`);
    // Q5c: thẻ giao_loi có lối ra — duyệt hoàn đơn đó đóng thẻ (không nằm mãi ở cột Đang giao)
    const r5c = await goi('POST', '/refunds', { order_id: e5.id, reason: 'giao lỗi' });
    const a5c = r5c.j.refund_id ? await goi('POST', `/refunds/${r5c.j.refund_id}/approve`, {}) : { status: 0 };
    // DT: thẻ giao lỗi của đơn tiền mặt (không hoàn qua ví được) → quản lý / chủ quán "Đóng thẻ" (lý do), không đụng tiền; phí chuyến vẫn ở Đối soát
    const e14 = await donGiao({ sl: 1, tra: 'tien_mat' });
    await goiXe(e14.id);
    const m14 = (await chuyenCua(e14.id))?.ma_ahamove;
    if (A.chuyen.has(m14)) datTrangThai(m14, { status: 'IN PROCESS', supplier_name: 'TX K', supplier_id: '0977001222' });
    await baoVe({ _id: m14, status: 'IN PROCESS' });
    if (A.chuyen.has(m14)) datTrangThai(m14, { status: 'CANCELLED', cancel_by_user: false });
    await baoVe({ _id: m14, status: 'CANCELLED' });
    const dt1 = await goi('POST', `/giao-hang/${e14.id}/dong-the`, { ly_do: 'đã gọi tài xế xử lý' }, tk.staff);
    const dt2 = await goi('POST', `/giao-hang/${e14.id}/dong-the`, {}, tk.manager);
    const dt3 = await goi('POST', `/giao-hang/${e14.id}/dong-the`, { ly_do: 'đã gọi tài xế xử lý' }, tk.manager);
    const c14 = await chuyenCua(e14.id);
    const o14 = await db.queryOne('SELECT status, cash_amount FROM pos_orders WHERE id = ?', [e14.id]);
    k('DT Đóng thẻ giao lỗi: nhân viên 403, thiếu lý do 400, quản lý 200 → thẻ rời màn, đơn + tiền không đổi', dt1.status === 403 && dt2.status === 400
      && dt3.status === 200 && c14?.trang_thai === 'da_dong' && !((await goi('GET', '/giao-hang')).j.chuyen || []).some((x) => x.order_id === e14.id)
      && o14?.status === 'completed' && Number(o14?.cash_amount) > 0, `${dt1.status} ${dt2.status} ${dt3.status} ${c14?.trang_thai} ${o14?.status}`);
    const dt4 = await goi('POST', `/giao-hang/${e14.id}/dong-the`, { ly_do: 'lần hai' }, tk.manager);
    k('DT Đóng thẻ chỉ cho thẻ giao lỗi (đóng lần hai / thẻ khác → 409)', dt4.status === 409, String(dt4.status));
    k('Q5c duyệt hoàn đơn giao_loi → chuyến huy, thẻ rời màn', a5c.status === 200 && (await chuyenCua(e5.id))?.trang_thai === 'huy'
      && !((await goi('GET', '/giao-hang')).j.chuyen || []).some((x) => x.order_id === e5.id), `${r5c.status} ${a5c.status} ${(await chuyenCua(e5.id))?.trang_thai}`);
    // H12: tin báo không tới — màn hỏi thì máy chủ đọc lại chuyến quá 60 s chưa cập nhật
    const e6 = await donGiao({ sl: 1 });
    await goiXe(e6.id);
    const m6 = (await chuyenCua(e6.id))?.ma_ahamove;
    if (A.chuyen.has(m6)) datTrangThai(m6, { status: 'ACCEPTED', supplier_name: 'TX F', supplier_id: '0977000777' });
    const docLuc = async (giay) => db.run('UPDATE pos_giao_chuyen SET doc_luc = ? WHERE order_id = ?',
      [new Date(Date.parse(getNow() + 'Z') - giay * 1000).toISOString().slice(0, 19), e6.id]).catch(() => {});
    await docLuc(55);
    const x1 = ((await goi('GET', '/giao-hang')).j.chuyen || []).find((x) => x.order_id === e6.id);
    await docLuc(65);
    const x2 = ((await goi('GET', '/giao-hang')).j.chuyen || []).find((x) => x.order_id === e6.id);
    k('H12 đọc lại dự phòng: 55 s chưa đọc lại (tim_xe); 65 s → đọc Ahamove, sang doi_tai_xe + tài xế (không cần tin báo)', x1?.trang_thai === 'tim_xe'
      && x2?.trang_thai === 'doi_tai_xe' && x2?.tai_xe?.ten === 'TX F', `${x1?.trang_thai} → ${x2?.trang_thai}`);
    // G8: "đang gọi" treo (máy chủ chết giữa chừng, không có lỗi) — 170 s chưa cho gọi lại; 190 s → thẻ báo treo, gọi lại được, một chuyến
    const e7 = await donGiao({ sl: 1 });
    const treo = async (giay) => {
      await db.run("UPDATE pos_giao_chuyen SET trang_thai = 'dang_goi', loi = NULL, loi_mang = 0, goi_luc = ? WHERE order_id = ?",
        [new Date(Date.parse(getNow() + 'Z') - giay * 1000).toISOString().slice(0, 19), e7.id]).catch(() => {});
      return ((await goi('GET', '/giao-hang')).j.chuyen || []).find((x) => x.order_id === e7.id);
    };
    const y1 = await treo(170);
    const g8a = await goiXe(e7.id);
    const y2 = await treo(190);
    const t8 = A.tao.length;
    const g8b = await goiXe(e7.id);
    k('G8 "đang gọi" treo: 170 s → chưa treo, gọi lại 409; 190 s → treo (màn có nút Gọi lại), gọi lại 200 tạo MỘT chuyến', y1?.treo === false && g8a.status === 409
      && y2?.treo === true && g8b.status === 200 && A.tao.length === t8 + 1, `${y1?.treo} ${g8a.status} ${y2?.treo} ${g8b.status} tạo ${A.tao.length - t8}`);
    // G9: máy khác giành lại đúng lúc Ahamove đang tạo → máy này thua: không ghi đè, chuyến vừa tạo bị huỷ
    const e8 = await donGiao({ sl: 1 });
    A.khiTao = () => db.run("UPDATE pos_giao_chuyen SET goi_luc = '2000-01-01T00:00:00' WHERE order_id = ?", [e8.id]);
    const g9 = await goiXe(e8.id);
    const c8 = await chuyenCua(e8.id);
    const moiTao = 'AHA' + A.soChuyen;
    k('G9 thua giành giữa chừng → 409, chuyến không ghi mã mới, chuyến vừa tạo bị huỷ ở Ahamove', g9.status === 409 && c8?.ma_ahamove == null
      && A.huy.some((x) => x.id === moiTao), `${g9.status} ${c8?.ma_ahamove} huỷ ${A.huy.some((x) => x.id === moiTao)}`);
    // G8b (chủ quán chốt Q6 06.11): thẻ treo mà chuyến cũ X còn chạy → Gọi lại NHẬN LẠI X (không huỷ, không gọi chuyến mới)
    const e9 = await donGiao({ sl: 1 });
    await goiXe(e9.id);
    const x9 = (await chuyenCua(e9.id))?.ma_ahamove;
    if (A.chuyen.has(x9)) datTrangThai(x9, { status: 'ACCEPTED', supplier_name: 'TX G', supplier_id: '0977000888' });
    await db.run("UPDATE pos_giao_chuyen SET trang_thai = 'dang_goi', goi_luc = ? WHERE order_id = ?",
      [new Date(Date.parse(getNow() + 'Z') - 190 * 1000).toISOString().slice(0, 19), e9.id]).catch(() => {});
    const t9 = A.tao.length;
    const g8c = await goiXe(e9.id);
    const c9 = await chuyenCua(e9.id);
    const song9 = [...A.chuyen.values()].filter((o) => String(o.tracking_number || '').startsWith(e9.code) && !['CANCELLED', 'COMPLETED'].includes(o.status));
    k('G8b thẻ treo còn chuyến cũ chạy → nhận lại X: không huỷ, không tạo mới, thẻ theo X (doi_tai_xe, tài xế)', g8c.status === 200 && !A.huy.some((x) => x.id === x9)
      && A.tao.length === t9 && song9.length === 1 && c9?.ma_ahamove === x9 && c9?.trang_thai === 'doi_tai_xe' && c9?.tai_xe_ten === 'TX G',
      `${g8c.status} huỷ X ${A.huy.some((x) => x.id === x9)} tạo ${A.tao.length - t9} ${c9?.trang_thai} ${c9?.tai_xe_ten}`);
    // G8c: thẻ treo mà tài xế chuyến cũ ĐÃ lấy hàng (Ahamove không cho huỷ) → nhận lại, sang dang_giao + giờ lấy hàng (không kẹt, Đối soát giữ phí)
    const e11 = await donGiao({ sl: 1 });
    await goiXe(e11.id);
    const x11 = (await chuyenCua(e11.id))?.ma_ahamove;
    if (A.chuyen.has(x11)) datTrangThai(x11, { status: 'IN PROCESS', supplier_name: 'TX H', supplier_id: '0977000999' });
    await db.run("UPDATE pos_giao_chuyen SET trang_thai = 'dang_goi', goi_luc = ? WHERE order_id = ?",
      [new Date(Date.parse(getNow() + 'Z') - 190 * 1000).toISOString().slice(0, 19), e11.id]).catch(() => {});
    const t11 = A.tao.length;
    const g8d = await goiXe(e11.id);
    const c11 = await chuyenCua(e11.id);
    k('G8c thẻ treo, tài xế chuyến cũ đã lấy hàng → nhận lại: dang_giao + giờ lấy hàng, không tạo mới', g8d.status === 200 && A.tao.length === t11
      && c11?.trang_thai === 'dang_giao' && !!c11?.lay_hang_luc && c11?.ma_ahamove === x11, `${g8d.status} ${c11?.trang_thai} ${c11?.lay_hang_luc}`);
    // G9b: thua giành nhưng máy thắng đã NHẬN chính chuyến vừa tạo (qua mã theo dõi) → máy thua KHÔNG huỷ chuyến đó
    const e12 = await donGiao({ sl: 1 });
    A.khiTao = (id) => db.run("UPDATE pos_giao_chuyen SET goi_luc = '2000-01-01T00:00:00', trang_thai = 'tim_xe', ma_ahamove = ? WHERE order_id = ?", [id, e12.id]);
    const g9b = await goiXe(e12.id);
    const m12 = (await chuyenCua(e12.id))?.ma_ahamove;
    k('G9b thua giành, máy thắng đã nhận chuyến vừa tạo → 409, chuyến đó KHÔNG bị huỷ', g9b.status === 409 && !!m12 && !A.huy.some((x) => x.id === m12),
      `${g9b.status} ${m12} huỷ ${A.huy.some((x) => x.id === m12)}`);
    // I6: Tìm lại (tìm quá lâu) đúng lúc tài xế vừa lấy hàng (Ahamove không cho huỷ) → nhận lại chuyến, không kẹt "tìm xe", không tạo mới
    const e13 = await donGiao({ sl: 1 });
    await goiXe(e13.id);
    const x13 = (await chuyenCua(e13.id))?.ma_ahamove;
    await db.run('UPDATE pos_giao_chuyen SET goi_luc = ?, doc_luc = ? WHERE order_id = ?',
      [new Date(Date.parse(getNow() + 'Z') - 601 * 1000).toISOString().slice(0, 19), getNow(), e13.id]).catch(() => {});
    if (A.chuyen.has(x13)) datTrangThai(x13, { status: 'IN PROCESS', supplier_name: 'TX I', supplier_id: '0977001111' });
    const t13 = A.tao.length;
    const i6 = await goiXe(e13.id);
    const c13 = await chuyenCua(e13.id);
    k('I6 Tìm lại mà Ahamove không cho huỷ (tài xế vừa lấy hàng) → nhận lại chuyến: dang_giao, không tạo mới', i6.status === 200 && A.tao.length === t13
      && c13?.trang_thai === 'dang_giao' && c13?.ma_ahamove === x13, `${i6.status} ${c13?.trang_thai}`);
    // GL: Tìm lại mà Ahamove không cho huỷ VÀ không đọc được chuyến cũ → 502, thẻ về tim_xe GIỮ giờ gọi cũ (vẫn "tìm lâu", bấm lại được ngay)
    const e15 = await donGiao({ sl: 1 });
    await goiXe(e15.id);
    const x15 = (await chuyenCua(e15.id))?.ma_ahamove;
    await db.run('UPDATE pos_giao_chuyen SET goi_luc = ?, doc_luc = ? WHERE order_id = ?',
      [new Date(Date.parse(getNow() + 'Z') - 601 * 1000).toISOString().slice(0, 19), getNow(), e15.id]).catch(() => {});
    if (A.chuyen.has(x15)) datTrangThai(x15, { status: 'IN PROCESS', supplier_name: 'TX L', supplier_id: '0977001333' });
    A.hong = 'doc';
    const gl1 = await goiXe(e15.id);
    A.hong = null;
    const the15 = ((await goi('GET', '/giao-hang')).j.chuyen || []).find((x) => x.order_id === e15.id);
    const gl2 = await goiXe(e15.id);
    k('GL không đọc được chuyến cũ → 502, thẻ tim_xe vẫn "tìm lâu" (giữ giờ gọi cũ); bấm lại ngay → 200 nhận lại chuyến', gl1.status === 502
      && the15?.trang_thai === 'tim_xe' && the15?.tim_lau === true && gl2.status === 200 && (await chuyenCua(e15.id))?.trang_thai === 'dang_giao',
      `${gl1.status} ${the15?.trang_thai} ${the15?.tim_lau} ${gl2.status}`);
    // G10: đơn bị hoàn chen giữa lúc đọc đơn và câu giành → câu giành thua (409), Ahamove không tạo gì
    const e10 = await donGiao({ sl: 1 });
    mocHoan = e10.id;
    const t10 = A.tao.length;
    const g10 = await goiXe(e10.id);
    mocHoan = null;
    k('G10 hoàn đơn chen giữa đọc và giành → 409, không tạo chuyến', g10.status === 409 && A.tao.length === t10, `${g10.status} tạo ${A.tao.length - t10}`);
    // J5d: Huỷ chuyến khi thẻ đang "đang gọi" (chưa có chuyến chắc chắn) → 409, không gọi Ahamove huỷ
    await db.run("UPDATE pos_giao_chuyen SET trang_thai = 'dang_goi', goi_luc = ?, ma_ahamove = 'AHA_GIA' WHERE order_id = ?", [getNow(), e10.id]).catch(() => {});
    const h0 = A.huy.length;
    const j5d = await goi('POST', `/giao-hang/${e10.id}/huy-chuyen`, { ly_do: 'thử huỷ' }, tk.manager);
    k('J5d Huỷ chuyến khi đang gọi xe → 409 KHONG_CO_CHUYEN, không gửi huỷ', j5d.status === 409 && j5d.j.code === 'KHONG_CO_CHUYEN' && A.huy.length === h0, `${j5d.status} ${j5d.j.code}`);
  }

  // ═══ J · huỷ theo bước ══════════════════════════════════════════════════════
  muc('[J] Huỷ theo bước — quản lý / chủ quán + lý do; hỏi "Dùng cho đơn khác | Bỏ đi"');
  let dHuy = [];
  {
    const a = await donGiao({ sl: 2 });
    const j1 = await huyDon(a.id, { reason: 'khách đổi ý', do_da_pha: 'dung_lai' }, tk.staff);
    const j2 = await huyDon(a.id, { do_da_pha: 'dung_lai' });
    const j3c = await huyDon(a.id, { reason: 'khách đổi ý' });
    k('J1 nhân viên huỷ đơn giao → 403', j1.status === 403, String(j1.status));
    k('J2 thiếu lý do → 400 LY_DO_BAT_BUOC', j2.status === 400 && j2.j.code === 'LY_DO_BAT_BUOC', `${j2.status} ${j2.j.code}`);
    k('J3c đang pha mà chưa chọn "Dùng cho đơn khác | Bỏ đi" → 400 CHON_DO_DA_PHA', j3c.status === 400 && j3c.j.code === 'CHON_DO_DA_PHA', `${j3c.status} ${j3c.j.code}`);
    const vi0 = await soDu();
    const j3 = await huyDon(a.id, { reason: 'khách đổi ý', do_da_pha: 'dung_lai' });
    const cha = await chuyenCua(a.id);
    const kho = await db.query("SELECT * FROM pos_stock_pending WHERE order_id = ? AND direction = 'in'", [a.id]);
    const hong1 = await db.query('SELECT * FROM pos_damage_logs WHERE order_id = ?', [a.id]);
    k('J3 + J10 quản lý huỷ đơn đang pha trả bằng tài khoản, "Dùng cho đơn khác" → hoàn ví đủ (gồm phí ship), hoàn kho như đường huỷ cũ, không ghi hàng hỏng',
      j3.status === 200 && (await soDu()) - vi0 === 85000 && cha?.trang_thai === 'huy' && cha?.do_da_pha === 'dung_lai' && kho.length === 1 && hong1.length === 0,
      `${j3.status} ví +${(await soDu()) - vi0} ${cha?.trang_thai}/${cha?.do_da_pha} kho ${kho.length} hỏng ${hong1.length}`);
    const b = await donGiao({ sl: 3 });
    const j3b = await huyDon(b.id, { reason: 'pha nhầm', do_da_pha: 'bo_di' });
    const chb = await chuyenCua(b.id);
    const kho2 = await db.query("SELECT * FROM pos_stock_pending WHERE order_id = ? AND direction = 'in'", [b.id]);
    const hong2 = await db.query('SELECT * FROM pos_damage_logs WHERE order_id = ?', [b.id]);
    k('J3b "Bỏ đi" → ghi hàng hỏng ĐÚNG món + số lượng (lý do có số HD), KHÔNG hoàn kho (đồ đã đổ — kho giữ phần đã trừ), đánh dấu trên chuyến',
      j3b.status === 200 && chb?.do_da_pha === 'bo_di' && kho2.length === 0 && hong2.length === 1 && hong2[0].product_code === spCode && Number(hong2[0].quantity) === 3
      && hong2[0].action === 'none' && Number(hong2[0].refund_amount) === 0 && String(hong2[0].reason_note || '').includes(b.code),
      `${j3b.status} ${chb?.do_da_pha} kho ${kho2.length} hỏng ${J(hong2[0] || {}).slice(0, 160)}`);
    // HUY-1 (Q6, chủ quán 11.11): đơn giao trả tiền mặt / CK huỷ được — hoàn TOÀN BỘ (gồm phí ship) vào tài khoản khách
    const viJ4 = await soDu();
    const c = await donGiao({ tra: 'tien_mat' });
    const j4 = await huyDon(c.id, { reason: 'khách đổi ý', do_da_pha: 'dung_lai' });
    const viJ9 = await soDu();
    const ck = await donGiao({ tra: 'ck' });
    const j9 = await huyDon(ck.id, { reason: 'khách đổi ý', do_da_pha: 'dung_lai' });
    k('J4 + J9 đơn giao trả tiền mặt / chuyển khoản (quản lý, đang pha) → huỷ 200, ví khách + toàn bộ 85.000 (gồm phí ship)', j4.status === 200 && j9.status === 200
      && viJ9 - viJ4 === 85000 && (await soDu()) - viJ9 === 85000 && (await chuyenCua(c.id))?.trang_thai === 'huy',
      `${c.r.status} ${j4.status} ${j4.j.code} +${viJ9 - viJ4} / ${ck.r.status} ${j9.status} ${j9.j.code} +${(await soDu()) - viJ9}`);
    // HUY-1 (Q8): đơn giao KHÔNG có tài khoản khách mà trả tiền mặt / CK → vẫn chặn huỷ trên máy (không trả tiền mặt từ két cho khách ở xa)
    const kl = await donGiao({ tra: 'tien_mat', sdt: null });
    const j4b = await huyDon(kl.id, { reason: 'khách đổi ý', do_da_pha: 'dung_lai' });
    k('J4b đơn giao không tài khoản khách trả tiền mặt → 409 GIAO_KHONG_TAI_KHOAN, đơn còn', kl.r.status === 200 && j4b.status === 409 && j4b.j.code === 'GIAO_KHONG_TAI_KHOAN'
      && (await db.queryOne('SELECT status FROM pos_orders WHERE id = ?', [kl.id]))?.status === 'completed', `${kl.r.status} ${j4b.status} ${j4b.j.code}`);
    // J5: đợi tài xế — huỷ đơn thẳng bị chặn; huỷ chuyến (Ahamove) rồi huỷ đơn
    const d = await donGiao({ sl: 1 });
    await goiXe(d.id);
    const ma = (await chuyenCua(d.id))?.ma_ahamove;
    if (A.chuyen.has(ma)) datTrangThai(ma, { status: 'ACCEPTED', supplier_name: 'TX B', supplier_id: '0977000444' });
    await baoVe({ _id: ma, status: 'ACCEPTED' });
    // H11: Ahamove đổi tài xế (ACCEPTED → ASSIGNING → ACCEPTED tài xế khác) — tin ACCEPTED lần hai KHÔNG bị coi là tin lặp
    if (A.chuyen.has(ma)) datTrangThai(ma, { status: 'ASSIGNING', supplier_name: null, supplier_id: null });
    await baoVe({ _id: ma, status: 'ASSIGNING' });
    const h11a = await chuyenCua(d.id);
    if (A.chuyen.has(ma)) datTrangThai(ma, { status: 'ACCEPTED', supplier_name: 'TX C', supplier_id: '0977000555' });
    await baoVe({ _id: ma, status: 'ACCEPTED' });
    const h11b = await chuyenCua(d.id);
    // H11b: kịch bản từ tin ĐẦU TIÊN Ahamove gửi (ASSIGNING ngay khi tạo) → ACCEPTED B → ASSIGNING (lặp khoá, bị nuốt) → ACCEPTED C; rồi đổi thẳng C → D
    const hb = await donGiao({ sl: 1 });
    await goiXe(hb.id);
    const mb = (await chuyenCua(hb.id))?.ma_ahamove;
    const bao = async (them) => { if (A.chuyen.has(mb)) datTrangThai(mb, them); await baoVe({ _id: mb, status: them.status }); };
    await bao({ status: 'ASSIGNING' });
    await bao({ status: 'ACCEPTED', supplier_name: 'TX B2', supplier_id: '0977001001' });
    await bao({ status: 'ASSIGNING', supplier_name: null, supplier_id: null });
    await bao({ status: 'ACCEPTED', supplier_name: 'TX C2', supplier_id: '0977001002' });
    const hb1 = await chuyenCua(hb.id);
    await bao({ status: 'ACCEPTED', supplier_name: 'TX D2', supplier_id: '0977001003' });
    const hb2 = await chuyenCua(hb.id);
    k('H11b đổi tài xế (có tin ASSIGNING đầu) → thẻ tài xế mới; đổi thẳng ACCEPTED → ACCEPTED → tài xế mới', hb1?.trang_thai === 'doi_tai_xe' && hb1?.tai_xe_ten === 'TX C2'
      && hb2?.tai_xe_ten === 'TX D2' && hb2?.tai_xe_sdt === '0977001003', `${hb1?.trang_thai} ${hb1?.tai_xe_ten} → ${hb2?.tai_xe_ten}`);
    k('H11 đổi tài xế: ACCEPTED → ASSIGNING (về tim_xe) → ACCEPTED tài xế mới (doi_tai_xe, tên + SĐT mới)', h11a?.trang_thai === 'tim_xe' && h11b?.trang_thai === 'doi_tai_xe'
      && h11b?.tai_xe_ten === 'TX C' && h11b?.tai_xe_sdt === '0977000555', `${h11a?.trang_thai} → ${h11b?.trang_thai} ${h11b?.tai_xe_ten}`);
    const j5a = await huyDon(d.id, { reason: 'khách đổi ý', do_da_pha: 'dung_lai' });
    const j5s = await goi('POST', `/giao-hang/${d.id}/huy-chuyen`, { ly_do: 'khách đổi ý' }, tk.staff);
    const j5l = await goi('POST', `/giao-hang/${d.id}/huy-chuyen`, {}, tk.manager);
    A.phiHuy = 5000;
    const j5b = await goi('POST', `/giao-hang/${d.id}/huy-chuyen`, { ly_do: 'khách đổi ý' }, tk.manager);
    A.phiHuy = 0;
    const chd = await chuyenCua(d.id);
    k('J5 đợi tài xế: huỷ đơn thẳng → 409 HUY_CHUYEN_TRUOC; huỷ chuyến: nhân viên 403, thiếu lý do 400', j5a.status === 409 && j5a.j.code === 'HUY_CHUYEN_TRUOC' && j5s.status === 403 && j5l.status === 400,
      `${j5a.status} ${j5a.j.code} ${j5s.status} ${j5l.status}`);
    k('J5 quản lý huỷ chuyến → Ahamove huỷ (kèm lý do), phí huỷ 5.000 quán chịu ghi trên chuyến, chuyến chuyen_huy', j5b.status === 200 && A.huy.some((x) => x.id === ma && x.comment)
      && chd?.trang_thai === 'chuyen_huy' && chd?.phi_huy === 5000, `${j5b.status} ${chd?.trang_thai} ${chd?.phi_huy}`);
    const j5c = await huyDon(d.id, { reason: 'khách đổi ý', do_da_pha: 'bo_di' });
    k('J5 sau huỷ chuyến → huỷ đơn được (hỏi Bỏ đi / Dùng lại như Đang pha)', j5c.status === 200 && (await chuyenCua(d.id))?.trang_thai === 'huy', `${j5c.status} ${j5c.j.code}`);
    // J5e: phí huỷ chỉ cộng khi CHÍNH lệnh huỷ của quán thành công — Huỷ chuyến (3.000) → Gọi tài xế mất mạng → Gọi lại: vẫn 3.000
    const pe = await donGiao({ sl: 1 });
    await goiXe(pe.id);
    A.phiHuy = 3000;
    await goi('POST', `/giao-hang/${pe.id}/huy-chuyen`, { ly_do: 'khách đổi giờ' }, tk.manager);
    A.phiHuy = 0;
    A.nuot = true;
    await goiXe(pe.id);
    const pe2 = await goiXe(pe.id);
    const cpe = await chuyenCua(pe.id);
    k('J5e Huỷ chuyến → Gọi tài xế mất mạng → Gọi lại: phí huỷ vẫn 3.000 (không cộng lại khi đọc chuyến đã huỷ)', pe2.status === 200 && cpe?.phi_huy === 3000
      && cpe?.trang_thai === 'tim_xe', `${pe2.status} ${cpe?.phi_huy} ${cpe?.trang_thai}`);
    // J5f: Ahamove nhận huỷ nhưng thẻ vừa đổi (máy khác Gọi lại) → 409 TRANG_THAI_DA_DOI, không báo "đã huỷ"
    const pf = await donGiao({ sl: 1 });
    await goiXe(pf.id);
    A.khiHuy = () => db.run("UPDATE pos_giao_chuyen SET trang_thai = 'dang_goi' WHERE order_id = ?", [pf.id]);
    A.phiHuy = 4500;
    const j5f = await goi('POST', `/giao-hang/${pf.id}/huy-chuyen`, { ly_do: 'khách đổi giờ' }, tk.manager);
    A.phiHuy = 0;
    const cpf = await chuyenCua(pf.id);
    k('J5f thẻ đổi đúng lúc huỷ chuyến → 409 TRANG_THAI_DA_DOI; phí huỷ 4.500 của lệnh huỷ đã thành công VẪN ghi (vòng 5)', j5f.status === 409
      && j5f.j.code === 'TRANG_THAI_DA_DOI' && cpf?.phi_huy === 4500, `${j5f.status} ${j5f.j.code} ${cpf?.phi_huy}`);
    const j8c = await goi('DELETE', `/orders/${d.id}`);
    k('J8b xoá đơn giao ĐÃ từng gọi xe (sổ phí Ahamove / phí huỷ) → 409 DON_GIAO_DA_GOI_XE, chuyến còn', j8c.status === 409 && j8c.j.code === 'DON_GIAO_DA_GOI_XE'
      && !!(await chuyenCua(d.id)), `${j8c.status} ${j8c.j.code}`);
    // J7: Từ chối đơn Mới (quản lý, có lý do, không cần chọn đồ đã pha)
    const m = await donGiao({ sl: 1 });
    await db.run("UPDATE pos_giao_chuyen SET trang_thai = 'moi' WHERE order_id = ?", [m.id]).catch(() => {});
    const j7 = await huyDon(m.id, { reason: 'hết nguyên liệu' });
    k('J7 Từ chối đơn Mới (quản lý + lý do) → huỷ được, chuyến huy', j7.status === 200 && (await chuyenCua(m.id))?.trang_thai === 'huy', `${j7.status} ${j7.j.code}`);
    // J8: xoá đơn — chuyến còn ở Ahamove → 409; đang pha → xoá cả chuyến, nhả báo phí
    const x = await donGiao({ sl: 1 });
    await goiXe(x.id);
    const j8a = await goi('DELETE', `/orders/${x.id}`);
    const y = await donGiao({ sl: 1 });
    const j8b = await goi('DELETE', `/orders/${y.id}`);
    const bpY = await db.queryOne('SELECT order_id FROM pos_giao_bao_phi WHERE ma = ?', [y.ma]).catch(() => null);
    k('J8 xoá đơn có chuyến ở Ahamove → 409 HUY_CHUYEN_TRUOC; xoá đơn đang pha → xoá chuyến, báo phí nhả order_id', j8a.status === 409 && j8a.j.code === 'HUY_CHUYEN_TRUOC'
      && j8b.status === 200 && !(await chuyenCua(y.id)) && bpY && bpY.order_id === null, `${j8a.status} ${j8a.j.code} ${j8b.status} ${J(bpY)}`);
    // K5b: đơn thường — HUY-1 (chủ quán 05.11): nhân viên không huỷ, lý do bắt buộc (đơn giao giữ luật riêng ở trên)
    const t = await goi('POST', '/orders', { items: [mon(1)], payment_method: 'cash', cash_amount: 30000, cash_received: 30000 });
    const k5 = await huyDon(t.j.order?.id, { reason: 'khách đổi ý' }, tk.staff);
    const k5c = await huyDon(t.j.order?.id, { reason: '' });
    const k5d = await huyDon(t.j.order?.id, { reason: 'ok' });
    k('K5b đơn KHÔNG giao: nhân viên → 403; quản lý thiếu lý do → 400 LY_DO_BAT_BUOC; quản lý lý do ngắn (đơn thường không đòi 3 ký tự) → 200',
      k5.status === 403 && k5c.status === 400 && k5c.j.code === 'LY_DO_BAT_BUOC' && k5d.status === 200, `${k5.status} ${k5c.status} ${k5c.j.code} ${k5d.status}`);
    // Q5: hoàn tiền — đơn giao còn chuyến ở Ahamove không xin / duyệt hoàn được
    const q = await donGiao({ sl: 1 });
    const q1 = await goi('POST', '/refunds', { order_id: q.id, reason: 'thử' });
    await goiXe(q.id);
    const q2 = await goi('POST', '/refunds', { order_id: q.id, reason: 'thử' });
    const q3 = q1.j.refund_id ? await goi('POST', `/refunds/${q1.j.refund_id}/approve`, {}) : { status: 0, j: {}, tho: '' };
    k('Q5 hoàn tiền: đơn giao đang pha xin được; còn chuyến ở Ahamove → xin 409 / duyệt 409 DON_GIAO_DANG_CHAY', q1.status === 200 && q2.status === 409 && q2.j.code === 'DON_GIAO_DANG_CHAY'
      && q3.status === 409 && q3.j.code === 'DON_GIAO_DANG_CHAY', `${q1.status} ${q2.status} ${q2.j.code} ${q3.status} ${q3.j.code}`);
    // Q5b: duyệt hoàn đơn giao CHƯA gọi xe (đang pha) → chuyến đóng, thẻ rời màn Giao hàng
    const q5 = await donGiao({ sl: 1 });
    const r5 = await goi('POST', '/refunds', { order_id: q5.id, reason: 'thử' });
    const a5 = r5.j.refund_id ? await goi('POST', `/refunds/${r5.j.refund_id}/approve`, {}) : { status: 0 };
    const c5 = await chuyenCua(q5.id);
    k('Q5b duyệt hoàn đơn giao đang pha → 200, chuyến huy, thẻ rời màn', a5.status === 200 && c5?.trang_thai === 'huy'
      && !((await goi('GET', '/giao-hang')).j.chuyen || []).some((x) => x.order_id === q5.id), `${r5.status} ${a5.status} ${c5?.trang_thai}`);
    dHuy = [a.code, b.code, d.code, m.code];
  }

  // ═══ V5 · vòng sửa 5 (chủ quán Q8 + Q9 07.11) ══════════════════════════════
  muc('[V5] Thẻ đã đóng chặn huỷ; phí huỷ theo lệnh của quán (Q9) ghi đúng một lần; Tìm lại không gọi chuyến mới khi chuyến vừa bị huỷ');
  {
    const luiGiay = (giay) => new Date(Date.parse(getNow() + 'Z') - giay * 1000).toISOString().slice(0, 19);
    const the = async (id) => ((await goi('GET', '/giao-hang')).j.chuyen || []).find((x) => x.order_id === id);
    const moChuyen = async (them) => { const e = await donGiao({ sl: 1, ...them }); await goiXe(e.id); return { ...e, x: (await chuyenCua(e.id))?.ma_ahamove }; };
    const dat = (ma, them) => { if (A.chuyen.has(ma)) datTrangThai(ma, them); };
    const timLau = (id) => db.run('UPDATE pos_giao_chuyen SET goi_luc = ?, doc_luc = ? WHERE order_id = ?', [luiGiay(601), getNow(), id]).catch(() => {});
    const homNay = getNow().slice(0, 10);
    // V1 (Q8-1): đơn trả bằng tài khoản — giao lỗi → Đóng thẻ → Huỷ đơn phải bị chặn như thẻ giao lỗi (hàng đã theo tài xế đi)
    const v1 = await moChuyen();
    dat(v1.x, { status: 'IN PROCESS', supplier_name: 'TX V1', supplier_id: '0977002001' });
    await baoVe({ _id: v1.x, status: 'IN PROCESS' });
    dat(v1.x, { status: 'CANCELLED', cancel_by_user: false });
    await baoVe({ _id: v1.x, status: 'CANCELLED' });
    const dt1 = await goi('POST', `/giao-hang/${v1.id}/dong-the`, { ly_do: 'đã xử lý với tài xế' }, tk.manager);
    const vi1 = await soDu();
    const h1 = await huyDon(v1.id, { reason: 'khách đòi huỷ', do_da_pha: 'bo_di' });
    const kho1 = await db.query("SELECT id FROM pos_stock_pending WHERE order_id = ? AND direction = 'in'", [v1.id]).catch(() => []);
    const o1 = await db.queryOne('SELECT status FROM pos_orders WHERE id = ?', [v1.id]);
    k('V1 đơn tài khoản: Đóng thẻ giao lỗi rồi Huỷ đơn → 409 DANG_GIAO_KHONG_HUY — ví, kho, đơn không đổi', dt1.status === 200 && h1.status === 409
      && h1.j.code === 'DANG_GIAO_KHONG_HUY' && (await soDu()) === vi1 && kho1.length === 0 && o1?.status === 'completed',
      `${dt1.status} ${h1.status} ${h1.j.code} ví ${(await soDu()) - vi1} kho ${kho1.length} ${o1?.status}`);
    // V2 (Q8-2): Tìm lại — Ahamove huỷ chuyến cũ (phí 4.000) nhưng đọc lại lỗi → "phí huỷ chưa rõ", màn hỏi lại thì đọc được, ghi MỘT lần
    const v2 = await moChuyen();
    await timLau(v2.id);
    A.phiHuy = 4000;
    A.khiHuy = () => { A.hong = 'doc'; };
    const r2 = await goiXe(v2.id, { tu: 'tim_xe' });
    A.hong = null; A.phiHuy = 0;
    const p2a = (await chuyenCua(v2.id))?.phi_huy;
    const ds2 = giaoHang ? await giaoHang.doiSoatGiao(db.query, homNay, homNay).catch(() => null) : null;
    await the(v2.id);
    const p2b = (await chuyenCua(v2.id))?.phi_huy;
    await the(v2.id);
    const ds2b = giaoHang ? await giaoHang.doiSoatGiao(db.query, homNay, homNay).catch(() => null) : null;
    const p2c = (await chuyenCua(v2.id))?.phi_huy;
    k('V2 Tìm lại: Ahamove huỷ chuyến cũ (phí 4.000) mà đọc lại lỗi → chuyến mới; Đối soát báo 1 chuyến chưa rõ phí huỷ; màn hỏi lại → ghi 4.000 MỘT lần',
      r2.status === 200 && p2a === 0 && ds2?.phi_huy_chua_ro === 1 && p2b === 4000 && p2c === 4000 && ds2b?.phi_huy_chua_ro === 0,
      `${r2.status} ${p2a} ${ds2?.phi_huy_chua_ro} ${p2b} ${p2c} ${ds2b?.phi_huy_chua_ro}`);
    // V3 (Q8-2, Q8-3): quản lý Huỷ chuyến thành công, đúng lúc đó máy khác bấm "Tìm lại" → không gọi chuyến mới, phí huỷ 5.000 không mất, không cộng hai lần
    const v3 = await moChuyen();
    await timLau(v3.id);
    A.phiHuy = 5000;
    let cu3 = null;
    A.khiDoc = async () => { cu3 = await goiXe(v3.id, { tu: 'tim_xe' }); };
    const t3 = A.tao.length;
    const h3 = await goi('POST', `/giao-hang/${v3.id}/huy-chuyen`, { ly_do: 'khách đổi giờ' }, tk.manager);
    A.phiHuy = 0; A.khiDoc = null;
    const c3 = await chuyenCua(v3.id);
    k('V3 quản lý Huỷ chuyến đúng lúc máy khác bấm Tìm lại → Tìm lại 409, KHÔNG gọi chuyến mới; quản lý 200; chuyen_huy; phí huỷ 5.000 một lần',
      h3.status === 200 && cu3?.status === 409 && A.tao.length === t3 && c3?.trang_thai === 'chuyen_huy' && c3?.phi_huy === 5000,
      `${h3.status} ${h3.j.code} ${cu3?.status} ${cu3?.j?.code} tạo ${A.tao.length - t3} ${c3?.trang_thai} ${c3?.phi_huy}`);
    // V4 (Q8-3): màn máy khác còn hiện "Tìm lại" (tim_xe) trong khi thẻ đã chuyen_huy → không gọi chuyến mới; "Gọi lại" đúng thẻ vẫn được (K5)
    const t4 = A.tao.length;
    const s4 = await goiXe(v3.id, { tu: 'tim_xe' });
    const t4b = A.tao.length;
    const s4b = await goiXe(v3.id, { tu: 'chuyen_huy' });
    k('V4 màn cũ bấm "Tìm lại" (tim_xe) mà thẻ đã chuyen_huy → 409 TRANG_THAI_DA_DOI, không tạo chuyến; "Gọi lại" (chuyen_huy) → 200 một chuyến',
      s4.status === 409 && s4.j.code === 'TRANG_THAI_DA_DOI' && t4b === t4 && s4b.status === 200 && A.tao.length === t4 + 1,
      `${s4.status} ${s4.j.code} tạo ${t4b - t4} ${s4b.status} ${A.tao.length - t4}`);
    // V5 (Q9): quán huỷ thẳng trên app Ahamove → Ahamove báo huỷ theo lệnh quán → phí huỷ 6.000; tin lặp không cộng
    const v5 = await moChuyen();
    dat(v5.x, { status: 'CANCELLED', cancel_by_user: true, cancel_fee: 6000 });
    await baoVe({ _id: v5.x, status: 'CANCELLED' });
    await baoVe({ _id: v5.x, status: 'CANCELLED', sub_status: 'lap' });
    await the(v5.id);
    const c5 = await chuyenCua(v5.id);
    k('V5 quán huỷ trên app Ahamove (báo huỷ theo lệnh quán, phí 6.000) → chuyen_huy, phí huỷ 6.000 một lần', c5?.trang_thai === 'chuyen_huy' && c5?.phi_huy === 6000,
      `${c5?.trang_thai} ${c5?.phi_huy}`);
    // V6 (Q9): lệnh Huỷ chuyến mất mạng (Ahamove đã huỷ) → máy báo lỗi; Ahamove báo huỷ theo lệnh quán → phí huỷ 7.000
    const v6 = await moChuyen();
    A.phiHuy = 7000; A.nuotHuy = true;
    const h6 = await goi('POST', `/giao-hang/${v6.id}/huy-chuyen`, { ly_do: 'khách đổi ý' }, tk.manager);
    A.phiHuy = 0; A.nuotHuy = false;
    const c6a = await chuyenCua(v6.id);
    await baoVe({ _id: v6.x, status: 'CANCELLED' });
    const c6 = await chuyenCua(v6.id);
    k('V6 lệnh Huỷ chuyến mất mạng (Ahamove đã huỷ) → báo lỗi, thẻ chưa đổi; Ahamove báo huỷ theo lệnh quán → chuyen_huy, phí huỷ 7.000', h6.status !== 200
      && c6a?.trang_thai === 'tim_xe' && c6?.trang_thai === 'chuyen_huy' && c6?.phi_huy === 7000, `${h6.status} ${c6a?.trang_thai} ${c6?.trang_thai} ${c6?.phi_huy}`);
    // V7 (Q9 + Q8-3): Tìm lại — lệnh huỷ chuyến cũ mất mạng nhưng Ahamove đã huỷ theo lệnh quán → phí 8.000; không gọi chuyến mới (quầy Gọi lại)
    const v7 = await moChuyen();
    await timLau(v7.id);
    A.phiHuy = 8000; A.nuotHuy = true;
    const t7 = A.tao.length;
    const r7 = await goiXe(v7.id, { tu: 'tim_xe' });
    A.phiHuy = 0; A.nuotHuy = false;
    const c7 = await chuyenCua(v7.id);
    k('V7 Tìm lại: lệnh huỷ chuyến cũ mất mạng mà Ahamove đã huỷ theo lệnh quán → 409 CHUYEN_DA_HUY, không tạo chuyến, chuyen_huy, phí huỷ 8.000',
      r7.status === 409 && r7.j.code === 'CHUYEN_DA_HUY' && A.tao.length === t7 && c7?.trang_thai === 'chuyen_huy' && c7?.phi_huy === 8000,
      `${r7.status} ${r7.j.code} tạo ${A.tao.length - t7} ${c7?.trang_thai} ${c7?.phi_huy}`);
    // V8 (Q8-5): tài xế / Ahamove huỷ (KHÔNG theo lệnh quán) kèm phí 3.000 → quán không ghi phí huỷ (tự tìm lại lần đầu, chuyen_huy lần hai)
    const v8 = await moChuyen();
    dat(v8.x, { status: 'CANCELLED', cancel_by_user: false, cancel_fee: 3000 });
    await baoVe({ _id: v8.x, status: 'CANCELLED' });
    const c8a = await chuyenCua(v8.id);
    dat(c8a?.ma_ahamove, { status: 'CANCELLED', cancel_by_user: false, cancel_fee: 3000 });
    await baoVe({ _id: c8a?.ma_ahamove, status: 'CANCELLED' });
    const c8 = await chuyenCua(v8.id);
    k('V8 tài xế / Ahamove huỷ (không theo lệnh quán, phí 3.000) → không ghi phí huỷ: tự tìm lại rồi chuyen_huy, phí huỷ 0', c8a?.trang_thai === 'tim_xe'
      && c8a?.ma_ahamove !== v8.x && c8?.trang_thai === 'chuyen_huy' && c8?.phi_huy === 0, `${c8a?.trang_thai} ${c8?.trang_thai} ${c8?.phi_huy}`);
    // V9 (Q8-4): thẻ treo vì mất mạng (loi_mang) mà đọc chuyến cũ lỗi → vẫn treo (nút Gọi lại), bấm lại được ngay
    const v9 = await moChuyen();
    await db.run("UPDATE pos_giao_chuyen SET trang_thai = 'dang_goi', loi_mang = 1, loi = 'Mất kết nối', goi_luc = ? WHERE order_id = ?", [getNow(), v9.id]).catch(() => {});
    A.hong = 'doc';
    const r9a = await goiXe(v9.id);
    A.hong = null;
    const y9 = await the(v9.id);
    const r9b = await goiXe(v9.id);
    k('V9 thẻ treo vì mất mạng, đọc chuyến cũ lỗi → 502, thẻ VẪN treo (nút Gọi lại); bấm lại → 200 nhận lại chuyến cũ', r9a.status === 502 && y9?.treo === true
      && r9b.status === 200 && (await chuyenCua(v9.id))?.ma_ahamove === v9.x, `${r9a.status} ${y9?.treo} ${r9b.status}`);
    // V10 (Q8-4): tin báo tới lúc thẻ đang gọi xe → không đánh dấu đã xử lý (Ahamove gửi lại); tin gửi lại sau khi thẻ về tim_xe được áp
    const v10 = await moChuyen();
    await db.run("UPDATE pos_giao_chuyen SET trang_thai = 'dang_goi', goi_luc = ? WHERE order_id = ?", [getNow(), v10.id]).catch(() => {});
    dat(v10.x, { status: 'ACCEPTED', supplier_name: 'TX V10', supplier_id: '0977002010' });
    const b10 = await baoVe({ _id: v10.x, status: 'ACCEPTED' });
    await db.run("UPDATE pos_giao_chuyen SET trang_thai = 'tim_xe' WHERE order_id = ?", [v10.id]).catch(() => {});
    await baoVe({ _id: v10.x, status: 'ACCEPTED' });
    const c10 = await chuyenCua(v10.id);
    k('V10 tin báo lúc thẻ đang gọi xe → 409 DANG_GOI_XE (không ghi sổ chống lặp); tin gửi lại khi thẻ tim_xe → doi_tai_xe + tài xế', b10.status === 409
      && b10.j.code === 'DANG_GOI_XE' && c10?.trang_thai === 'doi_tai_xe' && c10?.tai_xe_ten === 'TX V10', `${b10.status} ${b10.j.code} ${c10?.trang_thai} ${c10?.tai_xe_ten}`);
    // V11–V13 (Q8-5): chống đua khi nhận lại chuyến cũ / trả thẻ về — máy khác giành lại thẻ đúng lúc máy này đang đọc Ahamove
    const v11 = await moChuyen();
    dat(v11.x, { status: 'ACCEPTED', supplier_name: 'TX V11', supplier_id: '0977002011' });
    const treoLai = () => db.run("UPDATE pos_giao_chuyen SET trang_thai = 'dang_goi', loi_mang = 0, loi = NULL, ma_ahamove = ?, goi_luc = ? WHERE order_id = ?",
      [v11.x, luiGiay(190), v11.id]).catch(() => {});
    const MOC = '2001-01-01T00:00:00';
    await treoLai();
    A.khiDoc = () => db.run('UPDATE pos_giao_chuyen SET goi_luc = ? WHERE order_id = ?', [MOC, v11.id]);
    const t11 = A.tao.length;
    const r11 = await goiXe(v11.id);
    const c11 = await chuyenCua(v11.id);
    k('V11 nhận lại chuyến cũ mà máy khác vừa giành lại thẻ (giờ gọi khác) → 409, thẻ của máy kia giữ nguyên, không tạo chuyến', r11.status === 409
      && c11?.trang_thai === 'dang_goi' && c11?.goi_luc === MOC && A.tao.length === t11, `${r11.status} ${c11?.trang_thai} ${c11?.goi_luc}`);
    await treoLai();
    A.khiDoc = () => db.run("UPDATE pos_giao_chuyen SET ma_ahamove = 'AHA_KHAC' WHERE order_id = ?", [v11.id]);
    const r12 = await goiXe(v11.id);
    const c12 = await chuyenCua(v11.id);
    k('V12 nhận lại chuyến cũ mà thẻ vừa sang mã chuyến khác → 409, thẻ không bị ghi theo chuyến cũ', r12.status === 409 && c12?.trang_thai === 'dang_goi'
      && c12?.ma_ahamove === 'AHA_KHAC', `${r12.status} ${c12?.trang_thai} ${c12?.ma_ahamove}`);
    await treoLai();
    A.hong = 'doc';
    A.khiDoc = () => db.run('UPDATE pos_giao_chuyen SET goi_luc = ? WHERE order_id = ?', [MOC, v11.id]);
    const r13 = await goiXe(v11.id);
    A.hong = null; A.khiDoc = null;
    const c13 = await chuyenCua(v11.id);
    k('V13 đọc chuyến cũ lỗi mà máy khác vừa giành lại thẻ → 502, câu trả thẻ về không ghi đè (giờ gọi + lỗi của máy kia giữ nguyên)', r13.status === 502
      && c13?.goi_luc === MOC && c13?.loi == null, `${r13.status} ${c13?.goi_luc} ${c13?.loi}`);
  }

  // ═══ K · Đối soát ═══════════════════════════════════════════════════════════
  muc('[K] Đối soát ngày: phí khách trả, phí Ahamove thật, quán bù / dư, phí huỷ, đơn giao huỷ');
  {
    const { chayDoiSoat } = require(path.join(GOC, 'server', 'utils', 'doiSoat.js'));
    // chuyến có phí thật thấp hơn (quán dư) để bù và dư không triệt tiêu
    const d = await donGiao({ sl: 1 });
    A.phi = 21000;
    await goiXe(d.id);
    A.phi = 25000;
    const mk = (await chuyenCua(d.id))?.ma_ahamove;
    if (A.chuyen.has(mk)) datTrangThai(mk, { status: 'COMPLETED', path: [{}, { status: 'COMPLETED' }], total_price: 21000 });
    await baoVe({ _id: mk, status: 'COMPLETED' });
    imLang();
    let kq = null;
    try { kq = await chayDoiSoat({ kieu: 'ngay', ngay: getNow().slice(0, 10) }); } finally { noiLai(); }
    const g = kq?.tien?.giao;
    // SỐ CỨNG theo kịch bản (không tính lại bằng công thức của code — K3). Phí thật / chênh chỉ của chuyến tài xế ĐÃ lấy hàng:
    // gx xong 30.000 (bù 5.000) · đơn K xong 21.000 (dư 4.000) · I5 giao_loi 25.000 (chênh 0). Chuyến huỷ / đang tìm không tính.
    // Phí huỷ: J5 5.000 + I4b 2.000. Phí khách trả = cột shipping_fee của đơn còn hiệu lực (nguồn khác: pos_orders).
    // phí khách trả: SỔ CỦA BÀI THỬ (phí từ câu trả lúc tạo đơn), chỉ đơn còn hiệu lực
    let pk = 0;
    for (const x of daTao) if ((await db.queryOne('SELECT status FROM pos_orders WHERE id = ?', [x.id]))?.status === 'completed') pk += Number(x.phi);
    // Vòng 4: + chuyến đã chạy G8c 25.000, I6 25.000, GL 25.000, DT 25.000 (chênh 0) → phí thật 176.000; phí huỷ chỉ lệnh huỷ của quán: J5 5.000 + I4b 2.000 + J5e 3.000.
    // Vòng 5: + chuyến đã chạy V1 25.000 → phí thật 201.000; phí huỷ theo lệnh quán (Q9) + J5f 4.500, V2 4.000, V3 5.000, V5 6.000, V6 7.000, V7 8.000 → 44.500
    // (V8 tài xế huỷ có phí 3.000 → KHÔNG tính).
    k('K1 phí khách trả / phí Ahamove thật / quán bù / quán dư / phí huỷ (số cứng: 201.000 · 5.000 · 4.000 · 44.500)', !!g && g.phi_khach === Number(pk)
      && g.phi_that === 201000 && g.quan_bu === 5000 && g.quan_du === 4000 && g.phi_huy === 44500, J(g).slice(0, 200) + ' khách ' + pk);
    const huy = (g?.don_huy || []).map((x) => x.code);
    k('K1 danh sách đơn giao huỷ đủ, kèm "Bỏ đi" / "Dùng cho đơn khác"', dHuy.every((c) => huy.includes(c)) && (g?.don_huy || []).some((x) => x.do_da_pha === 'bo_di'),
      J(g?.don_huy || []).slice(0, 200));
  }

  // ═══ V6 · vòng sửa 6 (chủ quán Q10 + Q11 07.11) ══════════════════════════════
  muc('[V6] Gọi lại thẻ treo theo Q9; chuyến trùng tự huỷ ghi phí; mã theo dõi ra chuyến đã giao → nhận lại; phí huỷ chưa rõ không kẹt');
  {
    const luiGiay = (giay) => new Date(Date.parse(getNow() + 'Z') - giay * 1000).toISOString().slice(0, 19);
    const the = async (id) => ((await goi('GET', '/giao-hang')).j.chuyen || []).find((x) => x.order_id === id);
    const moChuyen = async () => { const e = await donGiao({ sl: 1 }); await goiXe(e.id); return { ...e, x: (await chuyenCua(e.id))?.ma_ahamove }; };
    const dat = (ma, them) => { if (A.chuyen.has(ma)) datTrangThai(ma, them); };
    const treo = (id) => db.run("UPDATE pos_giao_chuyen SET trang_thai = 'dang_goi', loi_mang = 1, loi = 'Mất kết nối', goi_luc = ? WHERE order_id = ?", [getNow(), id]).catch(() => {});
    const homNay = getNow().slice(0, 10);
    const chuaRo = async () => (giaoHang ? (await giaoHang.doiSoatGiao(db.query, homNay, homNay).catch(() => null))?.phi_huy_chua_ro : undefined);
    // W1 (Q9, lỗi soát 1): thẻ treo, quán đã huỷ chuyến cũ trên app Ahamove (phí 3.500) → Gọi lại: ghi phí huỷ 3.500, gọi MỘT chuyến mới
    const w1 = await moChuyen();
    dat(w1.x, { status: 'CANCELLED', cancel_by_user: true, cancel_fee: 3500 });
    await treo(w1.id);
    let t = A.tao.length;
    const r1 = await goiXe(w1.id, { tu: 'dang_goi' });
    const c1 = await chuyenCua(w1.id);
    k('W1 thẻ treo, quán huỷ chuyến cũ trên app Ahamove (phí 3.500) → Gọi lại 200, phí huỷ 3.500, một chuyến mới', r1.status === 200 && c1?.phi_huy === 3500
      && A.tao.length === t + 1 && c1?.ma_ahamove !== w1.x, `${r1.status} ${c1?.phi_huy} tạo ${A.tao.length - t}`);
    // W2 (Q9 chiều ngược): thẻ treo, TÀI XẾ huỷ chuyến cũ (phí 3.500) → Gọi lại: KHÔNG ghi phí huỷ, gọi một chuyến mới
    const w2 = await moChuyen();
    dat(w2.x, { status: 'CANCELLED', cancel_by_user: false, cancel_fee: 3500 });
    await treo(w2.id);
    t = A.tao.length;
    const r2 = await goiXe(w2.id, { tu: 'dang_goi' });
    const c2 = await chuyenCua(w2.id);
    k('W2 thẻ treo, tài xế huỷ chuyến cũ (phí 3.500) → Gọi lại 200, phí huỷ 0, một chuyến mới', r2.status === 200 && c2?.phi_huy === 0 && A.tao.length === t + 1,
      `${r2.status} ${c2?.phi_huy} tạo ${A.tao.length - t}`);
    // W3 (Q11): Ahamove báo huỷ KHÔNG kèm trường "ai huỷ" (cancel_by_user) → coi là quán huỷ: phí huỷ 2.500, chuyen_huy, không tự tìm lại
    const w3 = await moChuyen();
    t = A.tao.length;
    if (A.chuyen.has(w3.x)) delete A.chuyen.get(w3.x).cancel_by_user;
    dat(w3.x, { status: 'CANCELLED', cancel_fee: 2500 });
    await baoVe({ _id: w3.x, status: 'CANCELLED' });
    const c3 = await chuyenCua(w3.id);
    k('W3 tin huỷ không có cancel_by_user → coi là quán huỷ: phí huỷ 2.500, chuyen_huy, không tự gọi chuyến mới', c3?.phi_huy === 2500 && c3?.trang_thai === 'chuyen_huy'
      && A.tao.length === t, `${c3?.phi_huy} ${c3?.trang_thai} tạo ${A.tao.length - t}`);
    // W4 (lỗi soát 2): máy thua giành giữa lúc tạo → tự huỷ chuyến trùng (phí 1.500) → phí huỷ của chuyến trùng vào thẻ (Đối soát)
    const w4 = await donGiao({ sl: 1 });
    A.phiHuy = 1500;
    A.khiTao = () => db.run("UPDATE pos_giao_chuyen SET goi_luc = '2000-01-01T00:00:00' WHERE order_id = ?", [w4.id]);
    const r4 = await goiXe(w4.id);
    A.phiHuy = 0; A.khiTao = null;
    const c4 = await chuyenCua(w4.id);
    k('W4 tự huỷ chuyến trùng (phí 1.500) → 409, chuyến trùng bị huỷ, phí huỷ 1.500 ghi vào thẻ', r4.status === 409 && A.huy.some((x) => x.id === 'AHA' + A.soChuyen)
      && c4?.phi_huy === 1500, `${r4.status} ${c4?.phi_huy}`);
    // W5 (lỗi soát 3): thẻ treo vì mất mạng lúc tạo; chuyến Z thật ra đã tạo và GIAO XONG → Gọi lại: nhận lại Z (xong, phí thật), KHÔNG gọi chuyến mới
    const w5 = await donGiao({ sl: 1 });
    A.nuot = true;
    const r5a = await goiXe(w5.id);
    const z = 'AHA' + A.soChuyen;
    dat(z, { status: 'COMPLETED', path: [{}, { status: 'COMPLETED' }], supplier_name: 'TX W5', supplier_id: '0977002055' });
    t = A.tao.length;
    const r5 = await goiXe(w5.id, { tu: 'dang_goi' });
    const c5 = await chuyenCua(w5.id);
    k('W5 tra theo mã theo dõi ra chuyến đã giao xong → nhận lại: 200, không tạo chuyến, thẻ xong + giờ xong + phí thật 25.000', r5a.status === 504 && r5.status === 200
      && A.tao.length === t && c5?.ma_ahamove === z && c5?.trang_thai === 'xong' && !!c5?.xong_luc && c5?.phi_that === 25000,
      `${r5a.status} ${r5.status} tạo ${A.tao.length - t} ${c5?.ma_ahamove} ${c5?.trang_thai} ${c5?.xong_luc} ${c5?.phi_that}`);
    // W6 (lỗi soát 4): Tìm lại mà tài xế vừa huỷ chuyến cũ (lần đầu) → máy tự tìm lại một chuyến → báo 200 (không báo "bấm Gọi lại")
    const w6 = await moChuyen();
    await db.run('UPDATE pos_giao_chuyen SET goi_luc = ?, doc_luc = ? WHERE order_id = ?', [luiGiay(601), getNow(), w6.id]).catch(() => {});
    dat(w6.x, { status: 'CANCELLED', cancel_by_user: false });
    t = A.tao.length;
    const r6 = await goiXe(w6.id, { tu: 'tim_xe' });
    const c6 = await chuyenCua(w6.id);
    k('W6 Tìm lại mà tài xế vừa huỷ chuyến cũ → máy tự tìm lại: 200, MỘT chuyến mới, thẻ tim_xe theo chuyến mới', r6.status === 200 && A.tao.length === t + 1
      && c6?.trang_thai === 'tim_xe' && c6?.ma_ahamove !== w6.x, `${r6.status} ${r6.j.code} tạo ${A.tao.length - t} ${c6?.trang_thai}`);
    // W7 (soát — nghi ngờ): Huỷ chuyến thành công mà đọc lại Ahamove CHƯA thấy huỷ → "chưa rõ" (không khoá phí 0); Ahamove báo huỷ phí 2.000 → ghi 2.000
    const w7 = await moChuyen();
    A.khiDoc = () => dat(w7.x, { status: 'ASSIGNING' });
    const h7 = await goi('POST', `/giao-hang/${w7.id}/huy-chuyen`, { ly_do: 'khách đổi giờ' }, tk.manager);
    A.khiDoc = null;
    const r7a = await chuaRo();
    dat(w7.x, { status: 'CANCELLED', cancel_by_user: true, cancel_fee: 2000 });
    await the(w7.id);
    const c7 = await chuyenCua(w7.id);
    k('W7 Huỷ chuyến 200, đọc lại chưa thấy huỷ → 1 chuyến chưa rõ phí; đọc lại khi đã huỷ → phí huỷ 2.000, hết chưa rõ', h7.status === 200 && r7a === 1
      && c7?.phi_huy === 2000 && (await chuaRo()) === 0, `${h7.status} ${r7a} ${c7?.phi_huy}`);
    // W8 (soát — nghi ngờ): phí huỷ chưa rõ mà Ahamove báo phí 0 → vẫn hết "chưa rõ" (không đọc lại mãi)
    const w8 = await moChuyen();
    A.khiHuy = () => { A.hong = 'doc'; };
    const h8 = await goi('POST', `/giao-hang/${w8.id}/huy-chuyen`, { ly_do: 'khách đổi giờ' }, tk.manager);
    A.hong = null;
    const r8a = await chuaRo();
    await the(w8.id);
    const c8 = await chuyenCua(w8.id);
    k('W8 phí huỷ chưa rõ, đọc lại thấy huỷ phí 0 → phí huỷ 0, hết chưa rõ', h8.status === 200 && r8a === 1 && c8?.phi_huy === 0 && (await chuaRo()) === 0,
      `${h8.status} ${r8a} ${c8?.phi_huy} ${await chuaRo()}`);
    // W9 (soát — nghi ngờ): 3 chuyến chờ đọc phí huỷ không bao giờ ra (Ahamove không còn chuyến; mã xếp TRƯỚC 'AHA…' theo chỉ mục) không chặn chuyến thứ tư
    for (const [i, ma] of ['AA_KET1', 'AA_KET2', 'AA_KET3'].entries()) {
      await db.run("INSERT INTO pos_giao_tin (ma_ahamove, trang_thai, phu, luc) VALUES (?, 'CHO_PHI_HUY', '0', ?)", [ma, luiGiay(900 - i)]).catch(() => {});
    }
    const w9 = await moChuyen();
    A.phiHuy = 1200;
    A.khiHuy = () => { A.hong = 'doc'; };
    const h9 = await goi('POST', `/giao-hang/${w9.id}/huy-chuyen`, { ly_do: 'khách đổi giờ' }, tk.manager);
    A.hong = null; A.phiHuy = 0;
    await the(w9.id); await the(w9.id);
    const c9 = await chuyenCua(w9.id);
    k('W9 ba chuyến chờ đọc kẹt (cũ hơn) không chặn chuyến thứ tư: sau hai lần màn hỏi → phí huỷ 1.200, hết chưa rõ', h9.status === 200 && c9?.phi_huy === 1200
      && (await chuaRo()) === 0, `${h9.status} ${c9?.phi_huy} ${await chuaRo()}`);
  }

  // ═══ A6 · không khoá nào trong DB / nhật ký ════════════════════════════════
  muc('[A6] Quét DB + nhật ký cả bài: không khoá / token nào');
  {
    const bang = (await db.query("SELECT name FROM sqlite_master WHERE type = 'table'")).map((r) => r.name);
    const lo = [];
    for (const t of bang) for (const r of await db.query(`SELECT * FROM "${t}"`)) if (coBiMat(J(r))) lo.push(t);
    k('A6 mọi bảng (gồm pos_settings, pos_giao_*) không chứa khoá / token Ahamove', bang.includes('pos_giao_chuyen') && lo.length === 0, lo.join(', ') || (bang.includes('pos_giao_chuyen') ? '' : 'chưa có bảng'));
    k('A3 nhật ký (console) cả bài không chứa khoá / token', nhatKy.length > 0 && !nhatKy.some(coBiMat), nhatKy.find(coBiMat)?.slice(0, 120));
  }

  // ═══ T · gắn đường ════════════════════════════════════════════════════════════
  muc('[T] index.js gắn cửa giao hàng; bộ kiểm chạy bài này');
  {
    const ix = fs.readFileSync(path.join(GOC, 'server', 'index.js'), 'utf8');
    const vt = (re) => { const m = re.exec(ix); return m ? m.index : -1; };
    const iGh = vt(/^app\.use\('\/api\/pos\/giao-hang', require\('\.\/routes\/giao-hang'\)\);/m);
    const iBao = vt(/^app\.use\('\/api\/giao-hang\/ahamove-bao', require\('\.\/routes\/giao-hang'\)\.webhook\);/m);
    k("T1 index.js: '/api/pos/giao-hang' và '/api/giao-hang/ahamove-bao' gắn TRƯỚC express.static", iGh >= 0 && iBao >= 0 && Math.max(iGh, iBao) < vt(/^app\.use\(express\.static\(/m), `${iGh} ${iBao}`);
    const kt = fs.readFileSync(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'), 'utf8');
    k("T2 kiem_tra_truoc_khi_giao.js chạy 'cong_cu/thu_GIAO1.js'", /^chayBaiThat\('cong_cu\/thu_GIAO1\.js'\);/m.test(kt));
  }

  sv.close(); svAha.close();
  console.log(`\n  ${C.dam}${dat} đạt · ${hong} hỏng${C.het}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai();
  console.error(`\n${C.do}✖ Bài thử sập: ${e.message}${C.het}\n${e.stack}`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
