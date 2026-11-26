#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ GIAO-4 — Ahamove báo phí 0đ / âm thì CHẶN ở "Tính phí" (502 AHAMOVE_PHI_0, không lưu báo phí, log [GIAO] phi_0);
 *  phí bình thường, báo phí cũ, gọi xe (phí 0 = "chưa biết") KHÔNG đổi.
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ ở T1–T6, K4, H1.   Chạy ở GỐC kho POS:   node cong_cu/thu_GIAO4.js
 *
 *  Khuôn thu_GIAO3.js: database.js + libsql thật trên kho TẠM (chỉ thay ketNoiKho — P8); Ahamove là máy chủ GIẢ trong tiến trình
 *  (AHAMOVE_BASE_URL), khoá thử sinh ngẫu nhiên. Chỉ máy chủ — màn KhungGiao không đổi (ke_hoach.md mục 0).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_giao4_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_giao4_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_giao4_kh_' + ngauNhien();
const BI_MAT = { api: 'ahk_' + ngauNhien(), bao: 'ahb_' + ngauNhien(), token: 'aht_' + ngauNhien() };
const SDT_AHA = '0900000004';
process.env.AHAMOVE_API_KEY = BI_MAT.api;
process.env.AHAMOVE_SDT = SDT_AHA;
process.env.AHAMOVE_KHOA_BAO = BI_MAT.bao;
delete process.env.AHAMOVE_DIA_CHI_URL;
delete process.env.AHAMOVE_DIA_CHI_KHOA;

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
const ra = (s) => process.stdout.write(s + '\n');
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; ra(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; ra(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const nhatKy = [];
console.log = console.error = console.warn = console.info = (...a) => nhatKy.push(a.map(String).join(' '));
const J = (x) => String(JSON.stringify(x) ?? 'undefined');

const LOI_PHI_0 = 'Ahamove báo phí 0đ — bấm Tính phí lại (nếu lặp lại, gọi Ahamove kiểm tra)';
const DIA_CHI = 'Số 4 Ngõ Thử, Hà Nội';

// ─── Ahamove GIẢ: A.bao = các trường phí của báo phí (ghép vào data, kể cả thiếu trường) ───
const A = { chuyen: new Map(), so: 0, bao: { total_price: 15000 }, phiTao: 16000 };
function dungAhamoveGia(express) {
  const g = express();
  g.use(express.json());
  const coToken = (req) => req.headers.authorization === 'Bearer ' + BI_MAT.token;
  g.post('/v3/accounts/token', (req, res) => (req.body.api_key === BI_MAT.api ? res.json({ token: BI_MAT.token }) : res.status(401).json({})));
  g.post('/v3/orders/estimates', (req, res) => res.json([{ _id: req.body.services?.[0]?._id, data: { distance: 3, ...A.bao } }]));
  g.post('/v3/orders', (req, res) => {
    if (!coToken(req)) return res.status(401).json({});
    const id = 'G4AHA' + (++A.so);
    A.chuyen.set(id, { _id: id, status: 'ASSIGNING', tracking_number: req.body.path?.[1]?.tracking_number, total_price: A.phiTao, path: req.body.path });
    res.json({ order_id: id, status: 'ASSIGNING', order: { total_price: A.phiTao } });
  });
  g.get('/v3/orders/tracks/:tn', (req, res) => res.status(404).json({}));
  g.get('/v3/orders/:id', (req, res) => { const o = A.chuyen.get(req.params.id); return o ? res.json(o) : res.status(404).json({}); });
  return g;
}

async function main() {
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();
  await require('./gia_lap/monThu').dungMonThu(db);
  const svAha = await new Promise((ok) => { const s = dungAhamoveGia(express).listen(0, '127.0.0.1', () => ok(s)); });
  process.env.AHAMOVE_BASE_URL = `http://127.0.0.1:${svAha.address().port}`;
  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/giao-hang', require(R('giao-hang.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;

  const owner = (await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1")).id;
  const tk = jwt.sign({ userId: owner }, KHOA_NV, { expiresIn: '1h' });
  const datCaiDat = (key, value) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(value), getNow()]);
  for (const [a, b] of [['loyalty_enabled', 'false'], ['flash_enabled', 'false'], ['signup_enabled', '0'], ['thanh_toan_payos_bat_buoc', '0'],
    ['giao_diem_lay', J({ dia_chi: 'Quán thử, Hà Nội', lat: 21.02, lng: 105.82 })], ['giao_sdt_quan', '0900000444']]) await datCaiDat(a, b);
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 30000, ton_gan_nhat = NULL WHERE id = ?', [sp.id]);
  const mon = { product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: 1 };
  const SDT_KHACH = '0911000004';
  await db.run("INSERT INTO pos_customers (phone, name) VALUES (?, 'Khách Giao 4')", [SDT_KHACH]).catch(() => {});

  const goi = async (method, url, body) => {
    const r = await fetch(goc + url, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk },
      body: body !== undefined ? JSON.stringify(body) : undefined });
    const tho = await r.text();
    let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
    return { status: r.status, j };
  };
  const tinhPhi = () => goi('POST', '/giao-hang/bao-phi', { dia_chi: DIA_CHI });
  const soBaoPhi = async () => Number((await db.queryOne('SELECT count(*) AS n FROM pos_giao_bao_phi')).n);
  const baoPhiCua = (ma) => db.queryOne('SELECT * FROM pos_giao_bao_phi WHERE ma = ?', [ma]);
  const logPhi0 = (tu) => nhatKy.slice(tu).filter((l) => l.startsWith('[GIAO] phi_0'));

  // ── T1–T6: Ahamove báo phí 0 / âm → chặn, không lưu, log một dòng chỉ số ──
  const CHAN = [
    ['T1 total_price 0', { total_price: 0 }, 'total_price=0 total_fee=null'],
    ['T2 total_price -5000', { total_price: -5000 }, 'total_price=-5000 total_fee=null'],
    ['T3 total_price "0" (chữ)', { total_price: '0' }, 'total_price=0 total_fee=null'],
    ['T4 thiếu total_price, total_fee 0', { total_fee: 0 }, 'total_price=null total_fee=0'],
    ['T5 total_price 0, total_fee 20000 (không lấy total_fee thay — chủ quán 26.11)', { total_price: 0, total_fee: 20000 }, 'total_price=0 total_fee=20000'],
  ];
  for (const [ten, bao, log] of CHAN) {
    A.bao = bao;
    const n0 = await soBaoPhi(), l0 = nhatKy.length;
    const r = await tinhPhi();
    k(`${ten} → 502 AHAMOVE_PHI_0, đúng lời phiếu`, r.status === 502 && r.j.code === 'AHAMOVE_PHI_0' && r.j.error === LOI_PHI_0 && !r.j.ma_bao_phi, J([r.status, r.j]));
    k(`${ten} → KHÔNG ghi dòng pos_giao_bao_phi`, (await soBaoPhi()) === n0, `${n0} → ${await soBaoPhi()}`);
    const l = logPhi0(l0);
    k(`T6 ${ten} → log đúng MỘT dòng "[GIAO] phi_0 ${log}", không địa chỉ / SĐT`, l.length === 1 && l[0] === `[GIAO] phi_0 ${log}`
      && !/Ngõ Thử|Quán thử|0900000444|0911000004/.test(l.join(' ')), J(l));
  }

  // ── K1–K3: phí bình thường → như cũ ──
  const QUA = [['K1 phí 1đ', { total_price: 1 }, 1], ['K2 phí 15.000đ', { total_price: 15000 }, 15000],
    ['K3 thiếu total_price, total_fee 20000 (đường cũ)', { total_fee: 20000 }, 20000]];
  for (const [ten, bao, phi] of QUA) {
    A.bao = bao;
    const n0 = await soBaoPhi(), l0 = nhatKy.length;
    const r = await tinhPhi();
    const dong = r.j.ma_bao_phi ? await baoPhiCua(r.j.ma_bao_phi) : null;
    k(`${ten} → 200, phi ${phi}, lưu đúng một dòng phi ${phi}, không log phi_0`, r.status === 200 && r.j.phi === phi && Number(dong?.phi) === phi
      && (await soBaoPhi()) === n0 + 1 && logPhi0(l0).length === 0, J([r.status, r.j, dong?.phi, logPhi0(l0)]));
  }

  // ── K4: bị chặn rồi bấm lại (Ahamove hết lỗi) → được ──
  A.bao = { total_price: 0 };
  const k4a = await tinhPhi();
  A.bao = { total_price: 15000 };
  const k4b = await tinhPhi();
  k('K4 chặn (0đ) rồi bấm Tính phí lại → lần 2: 200 phi 15000', k4a.j.code === 'AHAMOVE_PHI_0' && k4b.status === 200 && k4b.j.phi === 15000, J([k4a.j.code, k4b.status, k4b.j.phi]));

  // ── K5: báo phí đã lưu > 0 dùng cho đơn giao như cũ ──
  const tinh = await goi('POST', '/orders/tinh-thu', { customer_phone: SDT_KHACH, customer_name: 'Khách Giao 4', items: [mon], giao: { ma_bao_phi: k4b.j.ma_bao_phi } });
  const tong = Number(tinh.j.total || 0);
  const don = await goi('POST', '/orders', { customer_phone: SDT_KHACH, customer_name: 'Khách Giao 4', items: [mon], payment_method: 'cash',
    cash_amount: tong, cash_received: tong, giao: { ma_bao_phi: k4b.j.ma_bao_phi, ten: 'Chị Nhận Bốn', sdt: '0988000444', ghi_chu: '' } });
  const id = don.j.order?.id;
  const chuyenCua = () => db.queryOne('SELECT * FROM pos_giao_chuyen WHERE order_id = ?', [id]);
  const o = id ? await db.queryOne('SELECT shipping_fee FROM pos_orders WHERE id = ?', [id]) : null;
  const c0 = id ? await chuyenCua() : null;
  k('K5 báo phí cũ 15.000 → đơn giao tạo được, shipping_fee 15000, chuyến phi_khach 15000', (don.status === 200 || don.status === 201) && Number(o?.shipping_fee) === 15000
    && Number(c0?.phi_khach) === 15000, J([don.status, don.j.error, o?.shipping_fee, c0?.phi_khach]));

  // ── K7: báo phí bị chặn không đụng chuyến đã có ──
  A.bao = { total_price: 0 };
  await tinhPhi();
  const c1 = id ? await chuyenCua() : null;
  k('K7 chặn báo phí mới → chuyến đã có không đổi một trường', !!c0 && J(c0) === J(c1), J([c0, c1]));

  // ── K6: gọi xe khi Ahamove báo 0 (đường giaoHang.js goiXe — không đổi): vẫn gọi được, phí thật = tạo chuyến trả ──
  A.bao = { total_price: 0 }; A.phiTao = null;
  const gx = id ? await goi('POST', `/giao-hang/${c0.id}/goi-xe`, {}) : { status: 0, j: {} };
  const c2 = id ? await chuyenCua() : null;
  k('K6 gọi xe lúc Ahamove báo phí 0 → 200, tim_xe, phi_that trống (không chặn, không ghi 0)', gx.status === 200 && c2?.trang_thai === 'tim_xe' && c2?.phi_that == null,
    J([gx.status, gx.j, c2?.trang_thai, c2?.phi_that]));
  A.phiTao = 16000;

  // ── H1–H2: hai máy cùng bấm Tính phí ──
  A.bao = { total_price: 0 };
  let n0 = await soBaoPhi();
  const h1 = await Promise.all([tinhPhi(), tinhPhi()]);
  k('H1 hai máy cùng bấm, Ahamove báo 0 → cả hai 502 AHAMOVE_PHI_0, 0 dòng mới', h1.every((r) => r.status === 502 && r.j.code === 'AHAMOVE_PHI_0') && (await soBaoPhi()) === n0,
    J(h1.map((r) => [r.status, r.j.code])));
  A.bao = { total_price: 15000 };
  n0 = await soBaoPhi();
  const h2 = await Promise.all([tinhPhi(), tinhPhi()]);
  k('H2 hai máy cùng bấm, 15.000 → cả hai 200, hai mã báo phí khác nhau', h2.every((r) => r.status === 200 && r.j.phi === 15000) && h2[0].j.ma_bao_phi !== h2[1].j.ma_bao_phi
    && (await soBaoPhi()) === n0 + 2, J(h2.map((r) => [r.status, r.j.phi])));

  ra(`\n${hong ? C.do : C.xanh}${C.dam}GIAO-4: ${dat} đạt · ${hong} hỏng${C.het}`);
  sv.closeAllConnections?.(); svAha.closeAllConnections?.();
  return hong;
}

main().then((h) => { fs.rmSync(THU_MUC, { recursive: true, force: true }); process.exit(h ? 1 : 0); },
  (e) => { ra('SẬP: ' + (e.stack || e)); fs.rmSync(THU_MUC, { recursive: true, force: true }); process.exit(2); });
