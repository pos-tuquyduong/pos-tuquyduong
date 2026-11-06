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
const coBiMat = (s) => Object.values(BI_MAT).some((b) => String(s).includes(b));

// ─── Ahamove GIẢ ─────────────────────────────────────────────────────────
const A = {
  chuyen: new Map(), tao: [], baoPhi: [], huy: [], goiY: [], tokenLan: 0, soChuyen: 0,
  phi: 25000, km: { 'Số 1 Ngõ Gần': 3, 'Số 9 Đường Biên': 5, 'Số 9 Đường Xa': 5.1 }, hong: null, nuot: false, phiHuy: 0,
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
  g.post('/v3/orders', (req, res) => {
    if (!coToken(req)) return res.status(401).json({ title: 'Token not found' });
    if (A.hong === 'tao') return res.status(500).json({ title: 'loi tao' });
    const id = 'AHA' + (++A.soChuyen);
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
  g.get('/v3/orders/:id', (req, res) => {
    if (!coToken(req)) return res.status(401).json({ title: 'Token not found' });
    const o = A.chuyen.get(req.params.id);
    return o ? res.json(o) : res.status(404).json({ title: 'not found' });
  });
  g.delete('/v3/orders/:id', (req, res) => {
    if (!coToken(req)) return res.status(401).json({ title: 'Token not found' });
    const o = A.chuyen.get(req.params.id);
    if (!o || !['IDLE', 'ASSIGNING', 'ACCEPTED'].includes(o.status)) return res.status(400).json({ title: 'not cancellable' });
    A.huy.push({ id: req.params.id, ...req.body });
    Object.assign(o, { status: 'CANCELLED', cancel_by_user: true, cancel_fee: A.phiHuy });
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
    ['signup_enabled', '0'], ['thanh_toan_payos_bat_buoc', '0']]) await datCaiDat(a, b);
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
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      return { status: r.status, j, tho };
    } finally { noiLai(); }
  };
  const chuyenCua = (orderId) => db.queryOne('SELECT * FROM pos_giao_chuyen WHERE order_id = ?', [orderId]).catch(() => null);
  const baoVe = (body, khoa = BI_MAT.bao) => goi('POST', '/giao-hang/ahamove-bao', body, null, { headers: khoa === null ? {} : { apikey: khoa } });
  const SDT_KHACH = '0911000001';
  await db.run("INSERT INTO pos_customers (phone, name) VALUES (?, 'Khách Giao')", [SDT_KHACH]).catch(() => {});
  await db.run('INSERT INTO pos_wallets (phone, balance) VALUES (?, 1000000)', [SDT_KHACH]);
  const soDu = async () => Number((await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [SDT_KHACH]))?.balance || 0);

  // Một báo phí (cách 2 — chữ) rồi một đơn giao trả đủ. tra: 'vi' | 'tien_mat' | 'ck'
  const baoPhi = (diaChi = 'Số 1 Ngõ Gần, Hà Nội', them = {}) => goi('POST', '/giao-hang/bao-phi', { dia_chi: diaChi, ...them });
  async function donGiao({ tra = 'vi', sl = 2, diaChi, ghiChu = 'Tầng 3, gọi trước' } = {}) {
    const b = await baoPhi(diaChi);
    const ma = b.j.ma_bao_phi;
    const tinh = await goi('POST', '/orders/tinh-thu', { customer_phone: SDT_KHACH, customer_name: 'Khách Giao', items: [mon(sl)], giao: { ma_bao_phi: ma } });
    const tong = Number(tinh.j.total || 0);
    const tien = tra === 'vi' ? { payment_method: 'balance', balance_amount: tong } : tra === 'ck' ? { payment_method: 'transfer', transfer_amount: tong }
      : { payment_method: 'cash', cash_amount: tong, cash_received: tong };
    const r = await goi('POST', '/orders', { customer_phone: SDT_KHACH, customer_name: 'Khách Giao', items: [mon(sl)], shipping_fee: 1, ...tien,
      giao: { ma_bao_phi: ma, ten: 'Chị Nhận', sdt: '0988000111', ghi_chu: ghiChu } });
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
      JSON.stringify(gocDung) === JSON.stringify([STG, STG, PRD, PRD, STG]), JSON.stringify(gocDung));
    process.env.AHAMOVE_MOI_TRUONG = 'production';
    const r3 = await goi('GET', '/giao-hang/cai-dat');
    delete process.env.AHAMOVE_MOI_TRUONG;
    k('A5 production → cai-dat báo bản thật', r3.j.ahamove?.ban === 'that', JSON.stringify(r3.j.ahamove));
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
    k('B4 chưa lưu → mặc định: 2 phút/món, 6 phút tìm xe, 15 phút nhắc, HAN-BIKE', cd0.phut_moi_mon === 2 && cd0.phut_tim_xe === 6 && cd0.phut_nhac === 15 && cd0.loai_xe === 'HAN-BIKE', JSON.stringify(cd0));
    const tot = { giao_km_toi_da: '5', giao_gio_nhan: '', giao_loai_xe: 'HAN-BIKE', giao_phut_moi_mon: '2', giao_phut_tim_xe: '6', giao_phut_nhac: '15', giao_sdt_quan: '0912345678' };
    const r1 = await goi('PUT', '/settings', { settings: tot });
    const r1b = await goi('GET', '/giao-hang/cai-dat');
    k('B1 lưu đủ khoá giao_* → cai-dat đọc lại đúng', r1.status === 200 && r1b.j.cai_dat?.km_toi_da === 5 && r1b.j.cai_dat?.sdt_quan === '0912345678', r1.status + ' ' + JSON.stringify(r1b.j.cai_dat));
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
    k('B7 điểm lấy hàng: nhân viên 403; chủ quán chọn gợi ý → lưu địa chỉ + toạ độ', d1.status === 403 && d2.status === 200 && dl.lat === 21.02 && dl.lng === 105.82 && /Tứ Quý/.test(dl.dia_chi), `${d1.status} ${d2.status} ${JSON.stringify(dl)}`);
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
    k('B6 loại xe mặc định (Cài đặt) tới lệnh báo phí Ahamove', A.baoPhi[0]?.services?.[0]?._id === 'HAN-EXPRESS', JSON.stringify(A.baoPhi[0]?.services));
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
    k('C1 cách 1: chọn gợi ý → báo phí với toạ độ của gợi ý', c1b.status === 200 && den.lat === 21.01 && den.lng === 105.81 && c1b.j.can_xac_nhan === false, `${c1b.status} ${JSON.stringify(den)}`);
    const c1c = await goi('POST', '/giao-hang/bao-phi', { ma_goi_y: 'KHONG_CO' });
    k('C1 cách 1: mã gợi ý không có ở Ahamove → 400 (không báo phí)', c1c.status === 400, `${c1c.status} ${c1c.j.code}`);
    datGoiY(false);
    const g2 = await goi('GET', '/giao-hang/dia-chi?q=' + encodeURIComponent('Số 1 Ngõ Gần'));
    const c2 = await baoPhi('Số 1 Ngõ Gần, Hà Nội');
    k('C1b cách 2 (chưa có khoá gợi ý): dia-chi báo cach = xac_nhan; báo phí bằng chữ → km + phí + can_xac_nhan', g2.j.cach === 'xac_nhan' && c2.status === 200
      && c2.j.km === 3 && c2.j.phi === 25000 && c2.j.can_xac_nhan === true && typeof c2.j.ma_bao_phi === 'string' && c2.j.ma_bao_phi.length >= 32, JSON.stringify(c2.j).slice(0, 160));
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
    k('K5f tinh-thu có giao: trả phí ship đúng mà KHÔNG tiêu báo phí', d1.tinh.j.shipping_fee === 25000 && d1.r.status === 200, JSON.stringify(d1.tinh.j).slice(0, 120));
    const ch = await chuyenCua(d1.id);
    k('D6 đơn giao vào "Đang pha": chuyến dang_pha, giờ nhận, người nhận, ghi chú tài xế', ch?.trang_thai === 'dang_pha' && !!ch.nhan_luc && ch.ten_nhan === 'Chị Nhận'
      && ch.ghi_chu === 'Tầng 3, gọi trước' && ch.phi_khach === 25000, JSON.stringify(ch).slice(0, 200));
    const p = await db.queryOne("SELECT points FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [d1.id]);
    k('D3 điểm KHÔNG tính phí ship (60.000 tiền món → 6 điểm, không phải 8)', Number(p?.points) === 6, String(p?.points));
    const lai = await goi('POST', '/orders', { customer_phone: SDT_KHACH, items: [mon(1)], payment_method: 'balance', balance_amount: 55000, giao: { ma_bao_phi: d1.ma, ten: 'A', sdt: '0988000111' } });
    const bp = await db.queryOne('SELECT order_id FROM pos_giao_bao_phi WHERE ma = ?', [d1.ma]).catch(() => null);
    k('D4 dùng lại một báo phí cho đơn thứ hai → 400 BAO_PHI_DA_DUNG; báo phí vẫn gắn đơn đầu', lai.status === 400 && lai.j.code === 'BAO_PHI_DA_DUNG' && Number(bp?.order_id) === d1.id, `${lai.status} ${lai.j.code}`);
    const b2 = await baoPhi();
    const t2 = await goi('POST', '/orders/tinh-thu', { customer_phone: SDT_KHACH, items: [mon(2)], discount_code: 'G1GIAM10', giao: { ma_bao_phi: b2.j.ma_bao_phi } });
    k('D2 mã giảm 10% chỉ giảm tiền món, phí ship nguyên (54.000 + 25.000)', t2.j.total === 79000 && t2.j.shipping_fee === 25000, JSON.stringify(t2.j).slice(0, 160));
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
    const chot = ph.j.phien ? await goi('POST', `/thanh-toan/phien/${ph.j.phien.id}/chot`, { cash_received: 60000 }) : { status: 0, j: {} };
    const oid = chot.j.order?.id;
    const ch3 = oid ? await chuyenCua(oid) : null;
    k('D5 báo phí hết hạn → tính tiền 400 BAO_PHI_HET_HAN', hh.status === 400 && hh.j.code === 'BAO_PHI_HET_HAN', `${hh.status} ${hh.j.code}`);
    k('D9 + D5 phiên tiền mặt mang giao (giuCho), chốt SAU hạn báo phí vẫn tạo đơn giao — tiền khách đã nhận', ph.status === 200 && ph.j.phien?.tong === 55000
      && chot.status === 200 && ch3?.ten_nhan === 'Anh Phiên', `${ph.status} ${ph.j.phien?.tong} ${chot.status} ${chot.tho.slice(0, 100)}`);
    const hd = await goi('GET', `/hoa-don/${d1.id}`);
    k('D7 hoá đơn có giao.dia_chi (dòng "GIAO HÀNG")', hd.j.hoa_don?.giao?.dia_chi === 'Số 1 Ngõ Gần, Hà Nội' && hd.j.hoa_don?.giao?.nguoi_nhan === 'Chị Nhận', JSON.stringify(hd.j.hoa_don?.giao));
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
      && the?.mon?.[0]?.sl === 2 && the?.ten === 'Chị Nhận', ds.status + ' ' + JSON.stringify(the).slice(0, 200));
    const dangPha = (ds.j.chuyen || []).filter((x) => x.cot === 'dang_pha').sort((a, b) => a.nhan_luc.localeCompare(b.nhan_luc) || a.id - b.id);
    const sau = dangPha.at(-1), truoc = dangPha.slice(0, -1).reduce((s, x) => s + x.so_mon, 0);
    k('F2 qua máy chủ: giờ gợi ý của thẻ cuối cộng món các đơn đang pha trước nó', dangPha.length >= 2 && sau.goi_luc_goi_y === f(sau.nhan_luc, truoc + sau.so_mon, { phut_moi_mon: 2, phut_tim_xe: 6 }),
      JSON.stringify(dangPha.map((x) => [x.so_mon, x.nhan_luc, x.goi_luc_goi_y])));
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
      && body.path?.[0]?.address && !('cod' in (body.path?.[1] || {})), JSON.stringify(body).slice(0, 220));
    k('C4 ghi chú cho tài xế tới remarks của điểm giao', body.path?.[1]?.remarks === 'Ngõ 5, nhà xanh', JSON.stringify(body.path?.[1]));
    k('G5 phí thật 30.000 ≠ khách trả 25.000 → chenh = +5.000 (quán bù), chuyến tim_xe', ch?.trang_thai === 'tim_xe' && ch?.phi_that === 30000 && ch?.chenh === 5000 && ch?.ma_ahamove === 'AHA' + A.soChuyen,
      JSON.stringify(ch).slice(0, 200));
    const ds = await goi('GET', '/giao-hang');
    const the = (ds.j.chuyen || []).find((x) => x.order_id === gx.id);
    k('G7 thẻ trả chenh để hiện "quán bù X đ"; cột doi_tai_xe', the?.chenh === 5000 && the?.cot === 'doi_tai_xe', JSON.stringify(the).slice(0, 160));
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
      JSON.stringify(ch1).slice(0, 220));
    const nTin = Number((await db.queryOne('SELECT COUNT(*) AS n FROM pos_giao_tin').catch(() => ({ n: -1 }))).n);
    if (A.chuyen.has(id)) datTrangThai(id, { status: 'IN PROCESS' });
    const h3 = await baoVe({ _id: id, status: 'COMPLETED' });
    const nTin2 = Number((await db.queryOne('SELECT COUNT(*) AS n FROM pos_giao_tin').catch(() => ({ n: -1 }))).n);
    k('H3 tin lặp (cùng mã + trạng thái) → 200, không thêm dòng, không đổi chuyến', h3.status === 200 && nTin2 === nTin && nTin > 0 && (await chuyenCua(gx.id))?.trang_thai === 'doi_tai_xe', `${h3.status} ${nTin}→${nTin2}`);
    const h6 = await baoVe({ _id: id, status: 'IN PROCESS' });
    const ch2 = await chuyenCua(gx.id);
    k('H6 tài xế lấy hàng → TỰ sang dang_giao + giờ lấy hàng (quầy không bấm)', h6.status === 200 && ch2?.trang_thai === 'dang_giao' && !!ch2?.lay_hang_luc, `${ch2?.trang_thai}`);
    if (A.chuyen.has(id)) datTrangThai(id, { status: 'ACCEPTED' });
    await baoVe({ _id: id, status: 'ACCEPTED', sub_status: 'tre' });
    k('H8 tin trễ lùi trạng thái (ACCEPTED sau IN PROCESS) → bỏ qua', (await chuyenCua(gx.id))?.trang_thai === 'dang_giao');
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
    k('A3 tin báo không lưu header / khoá: bảng pos_giao_tin không chứa khoá', !(await db.query('SELECT * FROM pos_giao_tin').catch(() => [])).some((r) => coBiMat(JSON.stringify(r))));
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
      await db.run('UPDATE pos_giao_chuyen SET goi_luc = ?, doc_luc = ? WHERE order_id = ?', [luc, getNow(), d.id]);
      return ((await goi('GET', '/giao-hang')).j.chuyen || []).find((x) => x.order_id === d.id);
    };
    const a = await tim(599), b = await tim(601);
    k('I1 tìm xe 9:59 → chưa báo; 10:01 → tim_lau (thẻ đỏ, nút Tìm lại)', a?.tim_lau === false && b?.tim_lau === true, `${a?.tim_lau} ${b?.tim_lau}`);
    await tim(599);
    const r0 = await goiXe(d.id);
    await tim(601);
    const truoc = A.tao.length;
    const r1 = await goiXe(d.id, { loai_xe: 'HAN-EXPRESS' });
    const ch2 = await chuyenCua(d.id);
    k('I4 Tìm lại: chưa lâu → 409; lâu → huỷ chuyến cũ ở Ahamove + tạo chuyến mới loại xe đã đổi', r0.status === 409 && r1.status === 200 && A.huy.some((x) => x.id === ch.ma_ahamove)
      && A.tao.length === truoc + 1 && A.tao.at(-1).service_id === 'HAN-EXPRESS' && ch2.ma_ahamove !== ch.ma_ahamove, `${r0.status} ${r1.status} huỷ ${A.huy.length}`);
    // I2: tài xế huỷ → tự tìm lại MỘT lần (hai tin khác nhau đến cùng lúc vẫn một chuyến mới)
    const ma = ch2.ma_ahamove;
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
      `${j3b.status} ${chb?.do_da_pha} kho ${kho2.length} hỏng ${JSON.stringify(hong2[0] || {}).slice(0, 160)}`);
    const c = await donGiao({ tra: 'tien_mat' });
    const j4 = await huyDon(c.id, { reason: 'khách đổi ý', do_da_pha: 'dung_lai' });
    const ck = await donGiao({ tra: 'ck' });
    const j9 = await huyDon(ck.id, { reason: 'khách đổi ý', do_da_pha: 'dung_lai' });
    k('J4 + J9 đơn giao trả tiền mặt / chuyển khoản → 409 CHO_HUY_1 (chờ HUY-1 hoàn toàn bộ)', j4.status === 409 && j4.j.code === 'CHO_HUY_1' && j9.status === 409 && j9.j.code === 'CHO_HUY_1',
      `${c.r.status} ${j4.status} ${j4.j.code} / ${ck.r.status} ${j9.status} ${j9.j.code}`);
    // J5: đợi tài xế — huỷ đơn thẳng bị chặn; huỷ chuyến (Ahamove) rồi huỷ đơn
    const d = await donGiao({ sl: 1 });
    await goiXe(d.id);
    const ma = (await chuyenCua(d.id))?.ma_ahamove;
    if (A.chuyen.has(ma)) datTrangThai(ma, { status: 'ACCEPTED', supplier_name: 'TX B', supplier_id: '0977000444' });
    await baoVe({ _id: ma, status: 'ACCEPTED' });
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
      && j8b.status === 200 && !(await chuyenCua(y.id)) && bpY && bpY.order_id === null, `${j8a.status} ${j8a.j.code} ${j8b.status} ${JSON.stringify(bpY)}`);
    // K5b: đơn thường nhân viên huỷ như cũ
    const t = await goi('POST', '/orders', { items: [mon(1)], payment_method: 'cash', cash_amount: 30000, cash_received: 30000 });
    const k5 = await huyDon(t.j.order?.id, { reason: '' }, tk.staff);
    k('K5b đơn KHÔNG giao: nhân viên huỷ được, lý do không bắt buộc (như cũ)', k5.status === 200, `${k5.status} ${k5.j.code}`);
    // Q5: hoàn tiền — đơn giao còn chuyến ở Ahamove không xin / duyệt hoàn được
    const q = await donGiao({ sl: 1 });
    const q1 = await goi('POST', '/refunds', { order_id: q.id, reason: 'thử' });
    await goiXe(q.id);
    const q2 = await goi('POST', '/refunds', { order_id: q.id, reason: 'thử' });
    const q3 = q1.j.refund_id ? await goi('POST', `/refunds/${q1.j.refund_id}/approve`, {}) : { status: 0, j: {} };
    k('Q5 hoàn tiền: đơn giao đang pha xin được; còn chuyến ở Ahamove → xin 409 / duyệt 409 DON_GIAO_DANG_CHAY', q1.status === 200 && q2.status === 409 && q2.j.code === 'DON_GIAO_DANG_CHAY'
      && q3.status === 409 && q3.j.code === 'DON_GIAO_DANG_CHAY', `${q1.status} ${q2.status} ${q2.j.code} ${q3.status} ${q3.j.code}`);
    dHuy = [a.code, b.code, d.code, m.code];
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
    imLang();
    let kq = null;
    try { kq = await chayDoiSoat({ kieu: 'ngay', ngay: getNow().slice(0, 10) }); } finally { noiLai(); }
    const g = kq?.tien?.giao;
    const ds = await db.query(`SELECT c.*, o.status, o.shipping_fee FROM pos_giao_chuyen c JOIN pos_orders o ON o.id = c.order_id`).catch(() => []);
    const ky = { phi_khach: ds.filter((x) => x.status === 'completed').reduce((s, x) => s + x.shipping_fee, 0),
      phi_that: ds.reduce((s, x) => s + Number(x.phi_that || 0), 0), bu: ds.reduce((s, x) => s + Math.max(0, Number(x.chenh || 0)), 0),
      du: ds.reduce((s, x) => s + Math.max(0, -Number(x.chenh || 0)), 0), huy: ds.reduce((s, x) => s + Number(x.phi_huy || 0), 0) };
    k('K1 tổng phí khách trả / phí Ahamove thật / quán bù / quán dư / phí huỷ khớp từng chuyến', !!g && g.phi_khach === ky.phi_khach && g.phi_that === ky.phi_that && g.quan_bu === ky.bu
      && g.quan_du === ky.du && g.phi_huy === ky.huy && ky.bu > 0 && ky.du > 0 && ky.huy === 5000, JSON.stringify(g) + ' ≠ ' + JSON.stringify(ky));
    const huy = (g?.don_huy || []).map((x) => x.code);
    k('K1 danh sách đơn giao huỷ đủ, kèm "Bỏ đi" / "Dùng cho đơn khác"', dHuy.every((c) => huy.includes(c)) && (g?.don_huy || []).some((x) => x.do_da_pha === 'bo_di'),
      JSON.stringify(g?.don_huy || []).slice(0, 200));
  }

  // ═══ A6 · không khoá nào trong DB / nhật ký ════════════════════════════════
  muc('[A6] Quét DB + nhật ký cả bài: không khoá / token nào');
  {
    const bang = (await db.query("SELECT name FROM sqlite_master WHERE type = 'table'")).map((r) => r.name);
    const lo = [];
    for (const t of bang) for (const r of await db.query(`SELECT * FROM "${t}"`)) if (coBiMat(JSON.stringify(r))) lo.push(t);
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
