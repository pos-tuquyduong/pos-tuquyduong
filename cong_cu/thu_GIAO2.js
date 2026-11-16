#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ GIAO-2 — tin báo Ahamove trả lời NGAY, xử lý sau; dự phòng đọc lại cập nhật được thẻ; nút "Tải lại" hỏi Ahamove ngay
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ: cửa tin báo chờ đọc Ahamove rồi mới trả (Ahamove giả chậm 8 s → > 5 s); thẻ dang_goi trả 409; chi tiết chuyến
 *  bọc mảng / {order} thì đọc lại không đổi thẻ; GET ?doc_lai=1 không có.
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_GIAO2.js
 *
 *  Khuôn thu_GIAO1.js: database.js + libsql thật trên kho TẠM (chỉ thay ketNoiKho — P8); Ahamove là máy chủ GIẢ trong tiến trình (AHAMOVE_BASE_URL),
 *  khoá thử sinh ngẫu nhiên. "Kho chậm" = bọc queryOne / run của database.js TRƯỚC khi nạp route (module lấy hàm lúc nạp).
 *  Phần xử lý tin chạy SAU câu trả lời: bài chờ `giaoHang.choTinBao()` (không có trên gốc — gốc xử lý trước khi trả nên không cần chờ).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_giao2_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_giao2_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_giao2_kh_' + ngauNhien();
const BI_MAT = { api: 'ahk_' + ngauNhien(), bao: 'ahb_' + ngauNhien(), token: 'aht_' + ngauNhien() };
const SDT_AHA = '0900000002';
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
const muc = (t) => ra(`\n${C.dam}${t}${C.het}`);
// Nhật ký máy chủ (console) gom HẾT cả bài — phần xử lý tin chạy sau câu trả lời, ngoài mọi lời gọi của bài.
const nhatKy = [];
console.log = console.error = console.warn = console.info = (...a) => nhatKy.push(a.map(String).join(' '));
const sapNen = [];
process.on('unhandledRejection', (e) => sapNen.push(String(e?.code || e?.message || e)));
const thuNap = (p) => { try { return require(p); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') return null; throw e; } };
const J = (x) => String(JSON.stringify(x) ?? 'undefined');
const coBiMat = (s) => Object.values(BI_MAT).some((b) => String(s).includes(b));
const ngu = (ms) => new Promise((ok) => setTimeout(ok, ms));

// ─── Ahamove GIẢ ─────────────────────────────────────────────────────────
const A = { chuyen: new Map(), soChuyen: 0, doc: 0, chamDoc: 0, hong: null, boc: null, phi: 25000 };
function dungAhamoveGia(express) {
  const g = express();
  g.use(express.json());
  const coToken = (req) => req.headers.authorization === 'Bearer ' + BI_MAT.token;
  g.post('/v3/accounts/token', (req, res) => (req.body.api_key === BI_MAT.api && req.body.mobile === SDT_AHA ? res.json({ token: BI_MAT.token })
    : res.status(401).json({ title: 'sai khoá' })));
  g.post('/v3/orders/estimates', (req, res) => {
    if (!coToken(req)) return res.status(401).json({});
    res.json([{ _id: req.body.services?.[0]?._id, data: { distance: 3, total_price: A.phi } }]);
  });
  g.post('/v3/orders', (req, res) => {
    if (!coToken(req)) return res.status(401).json({});
    const id = 'G2AHA' + (++A.soChuyen);
    A.chuyen.set(id, { _id: id, status: 'ASSIGNING', tracking_number: req.body.path?.[1]?.tracking_number, total_price: A.phi, path: req.body.path });
    res.json({ order_id: id, status: 'ASSIGNING', order: { total_price: A.phi } });
  });
  g.get('/v3/orders/tracks/:tn', (req, res) => {
    if (!coToken(req)) return res.status(401).json({});
    const o = [...A.chuyen.values()].reverse().find((x) => x.tracking_number === req.params.tn);
    return o ? res.json(o) : res.status(404).json({});
  });
  g.get('/v3/orders/:id', async (req, res) => {
    if (!coToken(req)) return res.status(401).json({});
    A.doc++;
    if (A.chamDoc) await ngu(A.chamDoc);
    if (A.hong === 'doc') return res.status(500).json({ title: 'loi doc' });
    const o = A.chuyen.get(req.params.id);
    if (!o) return res.status(404).json({});
    return res.json(A.boc === 'mang' ? [o] : A.boc === 'order' ? { order: o } : o);
  });
  g.delete('/v3/orders/:id', (req, res) => {
    const o = A.chuyen.get(req.params.id);
    if (!coToken(req) || !o) return res.status(400).json({});
    Object.assign(o, { status: 'CANCELLED', cancel_by_user: true, cancel_fee: 0 });
    res.json({ success: true });
  });
  return g;
}
const datTrangThai = (id, them) => { if (A.chuyen.has(id)) Object.assign(A.chuyen.get(id), them); };

async function main() {
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();
  // Kho chậm / kho hỏng — gắn TRƯỚC khi nạp route.
  const K = { cham: 0, nem: false };
  const qoGoc = db.queryOne, runGoc = db.run;
  db.queryOne = async (sql, p) => {
    if (K.cham) await ngu(K.cham);
    if (K.nem && /FROM pos_giao_chuyen WHERE ma_ahamove/.test(sql)) throw Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
    return qoGoc(sql, p);
  };
  K.demCapNhat = 0;
  db.run = async (sql, p) => {
    if (K.cham) await ngu(K.cham);
    if (/^UPDATE pos_giao_chuyen SET trang_thai = \?, tai_xe_ten/.test(sql)) {
      K.demCapNhat++;
      if (K.nemCapNhat) throw Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
    }
    return runGoc(sql, p);
  };

  const svAha = await new Promise((ok) => { const s = dungAhamoveGia(express).listen(0, '127.0.0.1', () => ok(s)); });
  process.env.AHAMOVE_BASE_URL = `http://127.0.0.1:${svAha.address().port}`;
  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  const gh = require(R('giao-hang.js'));
  app.use('/api/pos/giao-hang', gh);
  app.use('/api/giao-hang/ahamove-bao', gh.webhook);
  const giaoHang = require(path.join(GOC, 'server', 'utils', 'giaoHang.js'));
  const choNen = async () => { if (typeof giaoHang.choTinBao === 'function') await giaoHang.choTinBao(); };
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;

  // ── Dữ liệu nền ──
  const owner = (await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1")).id;
  const tk = jwt.sign({ userId: owner }, KHOA_NV, { expiresIn: '1h' });
  const datCaiDat = (key, value) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(value), getNow()]);
  for (const [a, b] of [['loyalty_enabled', 'false'], ['flash_enabled', 'false'], ['signup_enabled', '0'], ['thanh_toan_payos_bat_buoc', '0'],
    ['giao_diem_lay', J({ dia_chi: 'Quán thử, Hà Nội', lat: 21.02, lng: 105.82 })]]) await datCaiDat(a, b);
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run("UPDATE pos_products SET price = 30000, ton_gan_nhat = NULL WHERE id = ?", [sp.id]);
  const mon = { product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: 1 };
  const SDT_KHACH = '0911000002';
  await db.run("INSERT INTO pos_customers (phone, name) VALUES (?, 'Khách Giao 2')", [SDT_KHACH]).catch(() => {});
  await db.run('INSERT INTO pos_wallets (phone, balance) VALUES (?, 10000000)', [SDT_KHACH]);

  const goi = async (method, url, body, them = {}) => {
    const headers = { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...them.headers };
    if (!them.congKhai) headers.Authorization = 'Bearer ' + tk;
    const r = await fetch(goc + (them.congKhai ? '' : '/pos') + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    const tho = await r.text();
    let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
    return { status: r.status, j };
  };
  const baoVe = (body, khoa = BI_MAT.bao) => goi('POST', '/giao-hang/ahamove-bao', body, { congKhai: true, headers: khoa === null ? {} : { apikey: khoa } });
  const chuyenCua = (orderId) => db.queryOne('SELECT * FROM pos_giao_chuyen WHERE order_id = ?', [orderId]);
  const luiGiay = (giay) => new Date(Date.parse(getNow() + 'Z') - giay * 1000).toISOString().slice(0, 19);
  const danhSach = async (docLai) => (await goi('GET', '/giao-hang' + (docLai ? '?doc_lai=1' : ''))).j.chuyen || [];
  const the = (ds, id) => ds.find((x) => x.order_id === id);
  const tinCua = async (ma) => Number((await qoGoc("SELECT COUNT(*) AS n FROM pos_giao_tin WHERE ma_ahamove = ? AND trang_thai NOT IN ('PHI_HUY', 'CHO_PHI_HUY')", [ma])).n);
  /** Một đơn giao trả đủ bằng ví + gọi xe → chuyến tim_xe có mã Ahamove. */
  async function moChuyen() {
    const b = await goi('POST', '/giao-hang/bao-phi', { dia_chi: 'Số 2 Ngõ Thử, Hà Nội' });
    const tinh = await goi('POST', '/orders/tinh-thu', { customer_phone: SDT_KHACH, customer_name: 'Khách Giao 2', items: [mon], giao: { ma_bao_phi: b.j.ma_bao_phi } });
    const tong = Number(tinh.j.total || 0);
    const r = await goi('POST', '/orders', { customer_phone: SDT_KHACH, customer_name: 'Khách Giao 2', items: [mon], payment_method: 'balance', balance_amount: tong,
      giao: { ma_bao_phi: b.j.ma_bao_phi, ten: 'Chị Nhận Hai', sdt: '0988000222', ghi_chu: '' } });
    const id = r.j.order?.id;
    await goi('POST', `/giao-hang/${id}/goi-xe`, {});
    return { id, x: (await chuyenCua(id))?.ma_ahamove };
  }
  const dongGiao = (s) => s.startsWith('[GIAO]');

  // ═══ A · trả lời ngay ═══════════════════════════════════════════════════
  muc('[A] Cửa tin báo: kiểm khoá → trả 200 NGAY; đọc lại + cập nhật thẻ chạy sau');
  {
    const v = await moChuyen();
    k('nền: tạo được chuyến tim_xe có mã Ahamove', !!v.x && (await chuyenCua(v.id))?.trang_thai === 'tim_xe', J(v));
    const d0 = A.doc;
    const s1 = await baoVe({ _id: v.x, status: 'ACCEPTED' }, BI_MAT.bao.slice(0, -1) + 'x');
    const s2 = await baoVe({ _id: v.x, status: 'ACCEPTED' }, null);
    delete process.env.AHAMOVE_KHOA_BAO;
    const s3 = await baoVe({ _id: v.x, status: 'ACCEPTED' });
    process.env.AHAMOVE_KHOA_BAO = BI_MAT.bao;
    await choNen();
    k('A1b khoá sai → 401 BAO_SAI_KHOA, thiếu → 401, chưa cài khoá → 503 BAO_CHUA_CAI; Ahamove KHÔNG bị đọc', s1.status === 401 && s1.j.code === 'BAO_SAI_KHOA'
      && s2.status === 401 && s3.status === 503 && s3.j.code === 'BAO_CHUA_CAI' && A.doc === d0, `${s1.status} ${s2.status} ${s3.status} đọc ${A.doc - d0}`);

    datTrangThai(v.x, { status: 'ACCEPTED', supplier_name: 'TX Hai A', supplier_id: '0977002201', supplier_plate: '29B2-22201' });
    A.chamDoc = 8000; K.cham = 300;
    const t0 = Date.now();
    const a1 = await baoVe({ _id: v.x, status: 'COMPLETED' });
    const ms = Date.now() - t0;
    k('A1a Ahamove giả chậm 8 s + kho chậm 300 ms/câu → cửa trả 200 dưới 1 giây', a1.status === 200 && ms < 1000, `${a1.status} sau ${ms} ms`);
    await choNen();
    A.chamDoc = 0; K.cham = 0;
    const c1 = await chuyenCua(v.id);
    k('A2a xử lý sau khi trả lời: đọc lại chuyến THẬT (thân nói COMPLETED, Ahamove nói ACCEPTED) → doi_tai_xe + tài xế', c1?.trang_thai === 'doi_tai_xe'
      && c1?.tai_xe_ten === 'TX Hai A' && c1?.tai_xe_sdt === '0977002201', `${c1?.trang_thai} ${c1?.tai_xe_ten}`);

    // A2b: Ahamove lỗi khi đọc lại → vẫn 200, log rõ mã chuyến + bước hỏng, máy chủ còn chạy
    const v2 = await moChuyen();
    A.hong = 'doc';
    const n0 = nhatKy.length;
    const a2 = await baoVe({ _id: v2.x, status: 'ACCEPTED' });
    await choNen();
    A.hong = null;
    const log2 = nhatKy.slice(n0).filter(dongGiao);
    k('A2b Ahamove lỗi khi đọc lại → 200; log "[GIAO] … <mã chuyến> … lỗi …"; thẻ giữ tim_xe', a2.status === 200 && log2.some((l) => l.includes(v2.x) && /lỗi/.test(l))
      && (await chuyenCua(v2.id))?.trang_thai === 'tim_xe', `${a2.status} ${J(log2)}`);
    // A2c: kho ném lỗi trong phần xử lý → không sập tiến trình (không unhandledRejection), có log, máy chủ vẫn trả lời
    K.nem = true;
    const n1 = nhatKy.length;
    const a3 = await baoVe({ _id: v2.x, status: 'ACCEPTED' });
    await choNen();
    await ngu(50);
    K.nem = false;
    const log3 = nhatKy.slice(n1).filter(dongGiao);
    const sau = await goi('GET', '/giao-hang');
    k('A2c kho hỏng trong phần xử lý → 200, có log [GIAO] kèm mã chuyến, KHÔNG unhandledRejection, máy chủ vẫn trả lời', a3.status === 200
      && log3.some((l) => l.includes(v2.x)) && sapNen.length === 0 && sau.status === 200, `${a3.status} ${J(log3)} sập ${J(sapNen)}`);

    // A3: hai tin cùng chuyến cách 49 ms → MỘT bản ghi chống lặp, thẻ cập nhật một lần
    const v3 = await moChuyen();
    datTrangThai(v3.x, { status: 'ACCEPTED', supplier_name: 'TX Hai B', supplier_id: '0977002202' });
    A.chamDoc = 300;
    const dem3 = K.demCapNhat;
    const p1 = baoVe({ _id: v3.x, status: 'ACCEPTED' });
    await ngu(49);
    const p2 = baoVe({ _id: v3.x, status: 'ACCEPTED' });
    const [b1, b2] = await Promise.all([p1, p2]);
    await choNen();
    A.chamDoc = 0;
    const c3 = await chuyenCua(v3.id);
    k('A3 hai tin cách 49 ms (Ahamove chậm 300 ms — cả hai cùng đang xử lý) → cả hai 200; MỘT dòng chống lặp; câu cập nhật thẻ chạy MỘT lần; thẻ doi_tai_xe',
      b1.status === 200 && b2.status === 200 && await tinCua(v3.x) === 1 && K.demCapNhat - dem3 === 1 && c3?.trang_thai === 'doi_tai_xe' && c3?.tai_xe_ten === 'TX Hai B', `${b1.status} ${b2.status} tin ${await tinCua(v3.x)} cập nhật ${K.demCapNhat - dem3} ${c3?.trang_thai}`);

    // A2d: kho hỏng ĐÚNG lúc cập nhật thẻ (Turso "socket hang up") → sổ chống lặp KHÔNG giữ dòng của tin hỏng; tin gửi lại cùng trạng thái được áp
    const v5 = await moChuyen();
    datTrangThai(v5.x, { status: 'ACCEPTED', supplier_name: 'TX Hai G', supplier_id: '0977002207' });
    K.nemCapNhat = true;
    await baoVe({ _id: v5.x, status: 'ACCEPTED' });
    await choNen();
    K.nemCapNhat = false;
    const tin5 = await tinCua(v5.x);
    await baoVe({ _id: v5.x, status: 'ACCEPTED' });
    await choNen();
    const c5 = await chuyenCua(v5.id);
    k('A2d kho hỏng lúc cập nhật thẻ → không để lại dòng chống lặp; tin lặp lại sau → doi_tai_xe + tài xế', tin5 === 0 && c5?.trang_thai === 'doi_tai_xe'
      && c5?.tai_xe_ten === 'TX Hai G', `tin ${tin5} ${c5?.trang_thai} ${c5?.tai_xe_ten}`);

    // A4: thẻ đang gọi xe lúc tin tới → 200 (không 409), không ghi sổ chống lặp; thẻ về tim_xe thì tin sau được áp
    const v4 = await moChuyen();
    await db.run("UPDATE pos_giao_chuyen SET trang_thai = 'dang_goi', goi_luc = ? WHERE order_id = ?", [getNow(), v4.id]);
    datTrangThai(v4.x, { status: 'ACCEPTED', supplier_name: 'TX Hai C', supplier_id: '0977002203' });
    const a4 = await baoVe({ _id: v4.x, status: 'ACCEPTED' });
    await choNen();
    const tin4 = await tinCua(v4.x), c4a = await chuyenCua(v4.id);
    // gọi xe xong (thẻ về tim_xe, đọc lúc gọi) — Ahamove KHÔNG gửi lại tin (đã nhận 200): thẻ lên nhờ đọc lại (bấm "Tải lại" sau 5 s)
    await db.run("UPDATE pos_giao_chuyen SET trang_thai = 'tim_xe', doc_luc = ? WHERE order_id = ?", [luiGiay(6), v4.id]);
    const c4 = the(await danhSach(true), v4.id);
    k('A4 thẻ dang_goi → 200 (không 409), không ghi sổ chống lặp, thẻ không đổi; gọi xe xong, không tin nào nữa → "Tải lại" đọc ra doi_tai_xe',
      a4.status === 200 && tin4 === 0 && c4a?.trang_thai === 'dang_goi' && c4?.trang_thai === 'doi_tai_xe' && c4?.tai_xe?.ten === 'TX Hai C',
      `${a4.status} ${a4.j.code || ''} tin ${tin4} ${c4?.trang_thai}`);

    // A5: không phải chuyến của quán / thân rỗng → 200, không đọc Ahamove, không ghi gì
    const d5 = A.doc;
    const tong5 = Number((await qoGoc('SELECT COUNT(*) AS n FROM pos_giao_tin')).n);
    const a5a = await baoVe({ _id: 'KHONG_PHAI_CUA_QUAN', status: 'ACCEPTED' });
    const a5b = await baoVe({});
    const v6 = await moChuyen();
    await db.run("UPDATE pos_giao_chuyen SET ma_ahamove = 'G2AHA_MOI' WHERE order_id = ?", [v6.id]);   // chuyến v6.x đã được thay bằng chuyến khác
    datTrangThai(v6.x, { status: 'ACCEPTED', supplier_name: 'TX Cu', supplier_id: '0977002299' });
    const d5b = A.doc;
    const a5c = await baoVe({ _id: v6.x, status: 'ACCEPTED' });
    await choNen();
    const c6 = await chuyenCua(v6.id);
    k('A5 chuyến cũ đã thay → 200, không đọc Ahamove, thẻ (chuyến mới) không đổi', a5c.status === 200 && A.doc === d5b && c6?.trang_thai === 'tim_xe' && !c6?.tai_xe_ten,
      `${a5c.status} đọc ${A.doc - d5b} ${c6?.trang_thai}`);
    k('A5 mã lạ / thân rỗng → 200, Ahamove không bị đọc, không ghi sổ tin', a5a.status === 200 && a5b.status === 200 && A.doc === d5
      && Number((await qoGoc('SELECT COUNT(*) AS n FROM pos_giao_tin')).n) === tong5, `${a5a.status} ${a5b.status} đọc ${A.doc - d5}`);
  }

  // ═══ B · dự phòng đọc lại ════════════════════════════════════════════════
  muc('[B] Dự phòng đọc lại: cập nhật được thẻ, không treo màn, nút Tải lại hỏi ngay, có log');
  {
    // B1: chi tiết chuyến Ahamove trả dạng bọc (mảng — như tra theo mã; hoặc {order}) → đọc lại vẫn đưa thẻ lên trạng thái có tài xế
    for (const [boc, tx] of [['mang', 'TX Hai D'], ['order', 'TX Hai E']]) {
      const v = await moChuyen();
      datTrangThai(v.x, { status: 'ACCEPTED', supplier_name: tx, supplier_id: '0977002204' });
      await db.run('UPDATE pos_giao_chuyen SET doc_luc = ? WHERE order_id = ?', [luiGiay(65), v.id]);
      A.boc = boc;
      const x = the(await danhSach(), v.id);
      A.boc = null;
      k(`B1 chi tiết chuyến bọc ${boc === 'mang' ? 'mảng [ … ]' : '{ order: … }'} → đọc lại 65 s đưa thẻ lên doi_tai_xe + tài xế`, x?.trang_thai === 'doi_tai_xe'
        && x?.tai_xe?.ten === tx, `${x?.trang_thai} ${x?.tai_xe?.ten}`);
    }

    // B4: tin bị mất; thẻ vừa đọc 10 s trước → hẹn 15 s (không cờ) giữ mốc 60 s; "Tải lại" (?doc_lai=1) đọc NGAY; bấm dồn không đọc thêm
    const v = await moChuyen();
    datTrangThai(v.x, { status: 'ACCEPTED', supplier_name: 'TX Hai F', supplier_id: '0977002206' });
    await db.run('UPDATE pos_giao_chuyen SET doc_luc = ? WHERE order_id = ?', [luiGiay(10), v.id]);
    const x0 = the(await danhSach(), v.id);
    const n0 = nhatKy.length;
    const x1 = the(await danhSach(true), v.id);
    const log1 = nhatKy.slice(n0).filter(dongGiao);
    const d1 = A.doc;
    const x2 = the(await danhSach(true), v.id);
    k('B4a tin mất, đọc 10 s trước: hẹn 15 s (không cờ) → vẫn tim_xe (mốc 60 s không đổi)', x0?.trang_thai === 'tim_xe', x0?.trang_thai);
    k('B4b bấm "Tải lại" (?doc_lai=1) → thẻ doi_tai_xe + tài xế NGAY trong lần trả lời đó', x1?.trang_thai === 'doi_tai_xe' && x1?.tai_xe?.ten === 'TX Hai F',
      `${x1?.trang_thai} ${x1?.tai_xe?.ten}`);
    k('B4c bấm "Tải lại" dồn ngay sau → Ahamove KHÔNG bị đọc thêm', A.doc === d1 && x2?.trang_thai === 'doi_tai_xe', `đọc thêm ${A.doc - d1}`);
    // B3: log mỗi lần đọc lại: [GIAO] <mã> <trạng thái Ahamove> → <trạng thái thẻ> · <ms>ms — không SĐT tài xế / địa chỉ khách
    k('B3a log đọc lại "[GIAO] … <mã> ACCEPTED → doi_tai_xe · <n>ms"', log1.some((l) => new RegExp(`${v.x} ACCEPTED → doi_tai_xe · \\d+ms`).test(l)), J(log1));
    const lo = nhatKy.filter(dongGiao).filter((l) => /0977002\d{3}|0988000222|Ngõ Thử|Chị Nhận/.test(l));
    k('B3b mọi dòng [GIAO] không có SĐT tài xế / SĐT, tên, địa chỉ người nhận', nhatKy.some(dongGiao) && lo.length === 0, J(lo.slice(0, 2)));

    // B4d: trần số chuyến mỗi lần bấm — 9+ chuyến chờ đọc → đọc đúng 8
    while (Number((await qoGoc("SELECT COUNT(*) AS n FROM pos_giao_chuyen WHERE trang_thai IN ('tim_xe', 'doi_tai_xe', 'dang_giao')")).n) < 9) await moChuyen();
    await db.run("UPDATE pos_giao_chuyen SET doc_luc = ? WHERE trang_thai IN ('tim_xe', 'doi_tai_xe', 'dang_giao')", [luiGiay(30)]);
    const d4 = A.doc;
    await danhSach(true);
    k('B4d 9+ chuyến chưa xong, đọc 30 s trước → "Tải lại" đọc đúng 8 chuyến (trần), không hơn', A.doc - d4 === 8, `đọc ${A.doc - d4}`);

    // B2: Ahamove treo 8 s → màn không chờ quá ~4 s (hạn đọc lại riêng, đọc song song); lỗi đọc lại có log (không nuốt im lặng)
    const v2 = await moChuyen();
    await db.run("UPDATE pos_giao_chuyen SET doc_luc = ? WHERE trang_thai IN ('tim_xe', 'doi_tai_xe', 'dang_giao')", [getNow()]);
    await db.run('UPDATE pos_giao_chuyen SET doc_luc = ? WHERE order_id = ?', [luiGiay(65), v2.id]);
    A.chamDoc = 8000;
    const n2 = nhatKy.length;
    let t0 = Date.now();
    const y1 = the(await danhSach(), v2.id);
    const ms1 = Date.now() - t0;
    await db.run('UPDATE pos_giao_chuyen SET doc_luc = ? WHERE order_id = ?', [luiGiay(65), v2.id]);
    t0 = Date.now();
    const y2 = the(await danhSach(true), v2.id);
    const ms2 = Date.now() - t0;
    A.chamDoc = 0;
    const log2 = nhatKy.slice(n2).filter(dongGiao);
    k('B2a Ahamove treo 8 s: hẹn 15 s trả < 6 s, "Tải lại" trả < 6 s; thẻ giữ tim_xe', ms1 < 6000 && ms2 < 6000 && y1?.trang_thai === 'tim_xe' && y2?.trang_thai === 'tim_xe',
      `${ms1} ms · ${ms2} ms`);
    k('B2b lỗi đọc lại dự phòng có log "[GIAO] … <mã> … lỗi" (không nuốt im lặng)', log2.some((l) => l.includes(v2.x) && /lỗi/.test(l)), J(log2));
  }

  // ═══ Z · không lộ khoá; gắn bài; nút Tải lại ═════════════════════════════
  muc('[Z] Nhật ký không khoá / token; bộ kiểm chạy bài này; nút Tải lại gửi cờ đọc ngay');
  {
    k('Z1 nhật ký cả bài không chứa khoá / token Ahamove', nhatKy.length > 0 && !nhatKy.some(coBiMat), nhatKy.find(coBiMat)?.slice(0, 120));
    const kt = fs.readFileSync(path.join(GOC, 'kiem_tra_truoc_khi_giao.js'), 'utf8');
    k("Z2 kiem_tra_truoc_khi_giao.js chạy 'cong_cu/thu_GIAO2.js'", /^chayBaiThat\('cong_cu\/thu_GIAO2\.js'\);/m.test(kt));
    const man = fs.readFileSync(path.join(GOC, 'client', 'src', 'pages', 'GiaoHang', 'index.jsx'), 'utf8');
    const api = fs.readFileSync(path.join(GOC, 'client', 'src', 'utils', 'api.js'), 'utf8');
    k('Z3 nút "Tải lại" gọi tai(true), không chỗ nào truyền đối số lạ vào tai; hẹn giờ gọi tai() không cờ; api gửi ?doc_lai=1 chỉ khi có cờ', /onClick=\{\(\) => tai\(true\)\}>Tải lại</.test(man) && !/onClick=\{tai\}|\.then\(tai\)/.test(man)
      && /setInterval\(\(\) => tai\(\), HOI_MS\)/.test(man) && /danhSach: \(docLai\) => api\.get\(`\/giao-hang\$\{docLai \? '\?doc_lai=1' : ''\}`\)/.test(api));
  }

  sv.close(); svAha.close();
  ra(`\n  ${C.dam}${dat} đạt · ${hong} hỏng${C.het}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  ra(`\n${C.do}✖ Bài thử sập: ${e.message}${C.het}\n${e.stack}`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
