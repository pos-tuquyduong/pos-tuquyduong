#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════
 *  THỬ NHOM-MON-1 — một danh sách nhóm món (pos_nhom_mon) dùng chung cho quầy · App KH · Kho
 * ═══════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có bảng / route nhóm). Xanh ngay từ đầu = vô giá trị (K3).
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_NHOMMON1.js [--may-chu <thư mục server>]
 *  Khuôn thu_KHAPI3.js: database.js thật + libsql kho TẠM, route thật qua app.listen(0). `--may-chu` = bản sao đột biến.
 *  Nâng cấp thử bằng chính bước 035 trên dữ liệu có 'juice' / 'tea' / '' / mã lạ. Đơn App thử qua /kh/gio/bao-gia (cùng dungItems với đặt đơn).
 * ═══════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const CLIENT = path.join(MAY_CHU, '..', 'client', 'src');   // bản sao đột biến có cả client/src
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_nhommon1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_nhommon1_nv_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_nhommon1_kh_' + Date.now();
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_nhommon1';
process.env.GUI_MA_KHACH = 'gia';

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  const { getNow } = require(path.join(MAY_CHU, 'utils', 'helpers.js'));
  await db.initDatabase();
  const R = (f) => path.join(MAY_CHU, 'routes', f);
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use('/api/pos/products', require(R('products.js')));
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/kh', require(R('kh/quay.js')));
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const guiMa = require(path.join(MAY_CHU, 'utils', 'guiMaKhach.js'));
  const manKhach = require(path.join(MAY_CHU, 'utils', 'manKhach.js'));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  const them = async (ten, role) => {
    await db.run('INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, ?, ?, ?, 1)', [ten, 'x', ten, role]);
    return jwt.sign({ userId: (await db.queryOne('SELECT id FROM pos_users WHERE username = ?', [ten])).id }, KHOA_NV, { expiresIn: '1h' });
  };
  const tkChu = await them('thu_chu_nm1', 'owner');
  const tkNv = await them('thu_nv_nm1', 'staff');   // không có manage_settings
  const goi = async (method, url, body, tk) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (tk) headers.Authorization = 'Bearer ' + tk;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      let j = {}; try { j = JSON.parse(await r.text()); } catch { /* không phải JSON */ }
      return { status: r.status, j };
    } finally { noiLai(); }
  };
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const moTa = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;
  const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };
  const bang_ = () => db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pos_nhom_mon'");
  const nhom = () => db.query('SELECT * FROM pos_nhom_mon ORDER BY thu_tu, id').catch(() => []);
  const buoc035 = () => require(path.join(MAY_CHU, 'nang_cap', '035_nhom_mon.js'));
  const chayBuoc = async () => { const tx = await db.beginTransaction(); try { await buoc035().chay(tx, { themCot: async () => {} }); await tx.commit(); } catch (e) { await tx.rollback(); throw e; } };
  const menuApp = async () => (await goi('GET', '/kh/menu')).j.data || [];
  const maMon = (p) => `${p.sx_product_type}_${p.sx_product_id}`;

  // Dữ liệu: 4 món — juice, tea, category '' và mã lạ 'dacbiet'
  await require('./gia_lap/monThu').dungMonThu(db);
  await db.run("UPDATE pos_products SET price = 40000, is_active = 0");
  const moi = async (ten, cat, id) => db.run(`INSERT INTO pos_products (code, name, category, price, unit, sx_product_type, sx_product_id, is_active, created_at)
    VALUES (?, ?, ?, 40000, 'ly', 'pos', ?, 1, ?)`, ['NM' + id, ten, cat, id, getNow()]);
  await moi('Nước ép thử', 'juice', 901); await moi('Trà thử', 'tea', 902); await moi('Món không nhóm', '', 903); await moi('Món nhóm lạ', 'dacbiet', 904);
  await require('./gia_lap/monThu').dungMonThu(db);
  const sp = Object.fromEntries((await db.query("SELECT * FROM pos_products WHERE sx_product_id BETWEEN 901 AND 904")).map((p) => [p.code, p]));
  const [mJ, mT, mR, mL] = ['NM901', 'NM902', 'NM903', 'NM904'].map((c) => sp[c]);

  muc('[A1] bước nâng cấp 035 — một nhóm cho mỗi giá trị category khác rỗng');
  await chay('A1', async () => {
    imLang(); try { await db.run('DROP TABLE IF EXISTS pos_nhom_mon'); } finally { noiLai(); }
    let loi = null;
    try { await chayBuoc(); } catch (e) { loi = e.message; }
    const d1 = await nhom();
    const maSach = d1.map((g) => g.ma).sort();
    k('A1a bảng tạo được, nhóm = juice · tea · dacbiet (không "" )', !loi && bang(maSach, ['dacbiet', 'juice', 'tea']), loi || JSON.stringify(maSach));
    const ten = Object.fromEntries(d1.map((g) => [g.ma, g.ten]));
    k('A1b tên đầu: juice → "Nước ép", tea → "Trà", lạ → chính mã', ten.juice === 'Nước ép' && ten.tea === 'Trà' && ten.dacbiet === 'dacbiet', JSON.stringify(ten));
    k('A1c cả hai công tắc bật; thứ tự juice < tea < dacbiet', d1.every((g) => g.hien_quay === 1 && g.hien_app === 1)
      && bang(d1.map((g) => g.ma), ['juice', 'tea', 'dacbiet']), JSON.stringify(d1.map((g) => [g.ma, g.thu_tu])));
    let loi2 = null; try { await chayBuoc(); } catch (e) { loi2 = e.message; }
    k('A1d chạy lần 2 không nhân đôi, không đổi', !loi2 && bang((await nhom()).map((g) => [g.ma, g.ten, g.thu_tu]), d1.map((g) => [g.ma, g.ten, g.thu_tu])), loi2 || '');
    const cat = (await db.query("SELECT category FROM pos_products WHERE sx_product_id BETWEEN 901 AND 904 ORDER BY sx_product_id")).map((r) => r.category);
    k('A1e category các món KHÔNG đổi', bang(cat, ['juice', 'tea', '', 'dacbiet']), JSON.stringify(cat));
  });

  muc('[A2] route nhóm — quyền, sửa tên giữ mã, thứ tự, xoá');
  await chay('A2', async () => {
    const dsKhong = await goi('GET', '/pos/products/nhom');
    k('A2a không đăng nhập → 401', la(dsKhong, 401), moTa(dsKhong));
    const ds = await goi('GET', '/pos/products/nhom', undefined, tkNv);
    k('A2b nhân viên đọc được danh sách (để vẽ tab)', la(ds, 200) && (ds.j.data || ds.j.nhom || []).length === 3, moTa(ds));
    const t403 = await Promise.all([goi('POST', '/pos/products/nhom', { ten: 'X' }, tkNv), goi('PUT', '/pos/products/nhom/tea', { ten: 'X' }, tkNv),
      goi('DELETE', '/pos/products/nhom/dacbiet', undefined, tkNv), goi('PUT', '/pos/products/nhom-thu-tu', { ma: ['tea', 'juice', 'dacbiet'] }, tkNv)]);
    k('A2c ghi cần manage_settings → nhân viên 403 cả POST / PUT / DELETE / thứ tự', t403.every((r) => la(r, 403)), t403.map(moTa).join(' | '));
    const them1 = await goi('POST', '/pos/products/nhom', { ten: 'Cà phê' }, tkChu);
    const maMoi = them1.j.nhom?.ma;
    k('A2d thêm nhóm: máy sinh mã, tên giữ, hai công tắc bật', la(them1, 200) && !!maMoi && them1.j.nhom.ten === 'Cà phê' && them1.j.nhom.hien_quay === 1 && them1.j.nhom.hien_app === 1, moTa(them1));
    const trung = await goi('POST', '/pos/products/nhom', { ten: 'Cà phê' }, tkChu);
    const rong = await goi('POST', '/pos/products/nhom', { ten: '   ' }, tkChu);
    k('A2e tên trùng → 400 TEN_TRUNG; tên rỗng → 400 TEN_KHONG_HOP_LE', la(trung, 400, 'TEN_TRUNG') && la(rong, 400, 'TEN_KHONG_HOP_LE'), moTa(trung) + ' | ' + moTa(rong));
    const doiTen = await goi('PUT', '/pos/products/nhom/tea', { ten: 'Trà thảo mộc', ma: 'tea_moi' }, tkChu);
    const sauDoi = await nhom();
    k('A2f sửa tên: mã GIỮ (body có `ma` cũng bị bỏ qua), món vẫn category tea', la(doiTen, 200) && sauDoi.some((g) => g.ma === 'tea' && g.ten === 'Trà thảo mộc') && !sauDoi.some((g) => g.ma === 'tea_moi')
      && (await db.queryOne('SELECT category FROM pos_products WHERE id = ?', [mT.id])).category === 'tea', moTa(doiTen));
    const cong = await goi('PUT', '/pos/products/nhom/tea', { hien_quay: 0 }, tkChu);
    const g = (await nhom()).find((x) => x.ma === 'tea');
    k('A2g công tắc: chỉ đổi hien_quay, hien_app giữ nguyên', la(cong, 200) && g.hien_quay === 0 && g.hien_app === 1, moTa(cong));
    await goi('PUT', '/pos/products/nhom/tea', { hien_quay: 1 }, tkChu);
    const thuTu = await goi('PUT', '/pos/products/nhom-thu-tu', { ma: [maMoi, 'tea', 'juice', 'dacbiet'] }, tkChu);
    k('A2h thứ tự: lưu đúng danh sách', la(thuTu, 200) && bang((await nhom()).map((x) => x.ma), [maMoi, 'tea', 'juice', 'dacbiet']), moTa(thuTu));
    const thieu = await goi('PUT', '/pos/products/nhom-thu-tu', { ma: ['tea', 'juice'] }, tkChu);
    const thua = await goi('PUT', '/pos/products/nhom-thu-tu', { ma: [maMoi, 'tea', 'juice', 'dacbiet', 'khongco'] }, tkChu);
    k('A2i thứ tự thiếu / thừa mã → 400 và KHÔNG đổi', la(thieu, 400) && la(thua, 400) && bang((await nhom()).map((x) => x.ma), [maMoi, 'tea', 'juice', 'dacbiet']), moTa(thieu) + ' | ' + moTa(thua));
    const xoaCon = await goi('DELETE', '/pos/products/nhom/dacbiet', undefined, tkChu);
    k('A2j xoá nhóm còn món → 409 NHOM_CON_MON, nhóm còn', la(xoaCon, 409, 'NHOM_CON_MON') && (await nhom()).some((x) => x.ma === 'dacbiet'), moTa(xoaCon));
    const xoaGoc = await Promise.all([goi('DELETE', '/pos/products/nhom/juice', undefined, tkChu), goi('DELETE', '/pos/products/nhom/tea', undefined, tkChu)]);
    k('A2k nhóm gốc juice / tea → 409 NHOM_GOC (kể cả khi còn món lẫn khi rỗng)', xoaGoc.every((r) => la(r, 409)) && xoaGoc.every((r) => ['NHOM_GOC', 'NHOM_CON_MON'].includes(r.j.code)), xoaGoc.map(moTa).join(' | '));
    await db.run('UPDATE pos_products SET is_active = 0 WHERE category = ?', ['tea']);
    const goc2 = await goi('DELETE', '/pos/products/nhom/tea', undefined, tkChu);
    k('A2l nhóm gốc RỖNG vẫn không xoá được → NHOM_GOC (phép riêng, không dựa vào "còn món")', la(goc2, 409, 'NHOM_GOC'), moTa(goc2));
    await db.run('UPDATE pos_products SET is_active = 1 WHERE id = ?', [mT.id]);
    const xoaRong = await goi('DELETE', '/pos/products/nhom/' + maMoi, undefined, tkChu);
    const khongCo = await goi('DELETE', '/pos/products/nhom/' + maMoi, undefined, tkChu);
    k('A2m nhóm rỗng xoá được (200); xoá lần nữa → 404 NHOM_KHONG_CO', la(xoaRong, 200) && la(khongCo, 404, 'NHOM_KHONG_CO'), moTa(xoaRong) + ' | ' + moTa(khongCo));
  });

  muc('[A3] món chỉ nhận nhóm có thật');
  await chay('A3', async () => {
    const putXau = await goi('PUT', '/pos/products/' + mJ.id, { category: 'khongco' }, tkChu);
    const postXau = await goi('POST', '/pos/products', { name: 'Món nhóm sai', price: 10000, category: 'khongco' }, tkChu);
    k('A3a PUT category không có → 400 NHOM_KHONG_CO', la(putXau, 400, 'NHOM_KHONG_CO'), moTa(putXau));
    k('A3b POST category không có → 400 NHOM_KHONG_CO, không tạo món', la(postXau, 400, 'NHOM_KHONG_CO') && !(await db.queryOne("SELECT 1 AS co FROM pos_products WHERE name = 'Món nhóm sai'")), moTa(postXau));
    const putOk = await goi('PUT', '/pos/products/' + mR.id, { category: 'tea' }, tkChu);
    const postOk = await goi('POST', '/pos/products', { name: 'Món tạo mới', price: 10000, category: 'tea' }, tkChu);
    const postMd = await goi('POST', '/pos/products', { name: 'Món mặc định', price: 10000 }, tkChu);
    k('A3c K5: category hợp lệ → 200; POST không gửi category vẫn → mặc định juice', la(putOk, 200) && la(postOk, 200) && la(postMd, 200) && postMd.j.product?.category === 'juice', moTa(putOk) + ' | ' + moTa(postOk) + ' | ' + moTa(postMd));
    await goi('PUT', '/pos/products/' + mR.id, { category: '' }, tkChu).catch(() => {});
    await db.run("UPDATE pos_products SET category = '' WHERE id = ?", [mR.id]);
    // hai người cùng bấm: xoá nhóm rỗng ‖ gán món vào nhóm đó — không bao giờ còn món mồ côi
    const m = (await goi('POST', '/pos/products/nhom', { ten: 'Nhóm đua' }, tkChu)).j.nhom.ma;
    const [a, b] = await Promise.all([goi('DELETE', '/pos/products/nhom/' + m, undefined, tkChu), goi('PUT', '/pos/products/' + mR.id, { category: m }, tkChu)]);
    const moCoi = await db.queryOne('SELECT 1 AS co FROM pos_products WHERE id = ? AND category = ? AND NOT EXISTS (SELECT 1 FROM pos_nhom_mon WHERE ma = ?)', [mR.id, m, m]);
    k('A3d đua xoá nhóm ‖ gán món: không còn món mồ côi (một bên bị chặn)', !moCoi && !(la(a, 200) && la(b, 200)), `${moTa(a)} | ${moTa(b)}`);
    await db.run("UPDATE pos_products SET category = '' WHERE id = ?", [mR.id]);
  });

  muc('[A4] quầy — GET /pos/products trả thêm tên · thứ tự · công tắc quầy');
  await chay('A4', async () => {
    const q = await goi('GET', '/pos/products', undefined, tkNv);
    const ds = q.j.data || q.j.products || q.j;
    const lay = (p) => (Array.isArray(ds) ? ds : []).find((x) => x.code === p.code);
    const j = lay(mJ), l = lay(mL), r = lay(mR);
    k('A4a có nhom_ten, nhom_thu_tu, nhom_hien_quay; nhom_ten theo bảng (đã đổi "Trà thảo mộc")', la(q, 200) && j?.nhom_ten === 'Nước ép' && lay(mT)?.nhom_ten === 'Trà thảo mộc' && typeof j.nhom_thu_tu === 'number' && j.nhom_hien_quay === 1, moTa(q));
    k('A4b món chưa có nhóm (category "" hoặc nhóm bị mất): vẫn trả, nhom_hien_quay = 1 (giữ hành vi cũ — K5)', r && r.nhom_hien_quay === 1, JSON.stringify(r && [r.nhom_ten, r.nhom_hien_quay]));
    await goi('PUT', '/pos/products/nhom/dacbiet', { hien_quay: 0 }, tkChu);
    const q2 = await goi('GET', '/pos/products', undefined, tkNv);
    const l2 = (q2.j.data || q2.j.products || q2.j).find((x) => x.code === mL.code);
    k('A4c nhóm tắt quầy: món VẪN trong GET (Cài đặt / Kho cần thấy), nhom_hien_quay = 0', l2 && l2.nhom_hien_quay === 0, JSON.stringify(l2 && l2.nhom_hien_quay));
    const loc = await goi('GET', '/pos/products?category=juice', undefined, tkNv);
    k('A4d K5: ?category=juice vẫn lọc như cũ', la(loc, 200) && (loc.j.data || loc.j.products || loc.j).every((x) => x.category === 'juice'), moTa(loc));
    void l;
  });

  muc('[A5] App KH /menu — lọc theo hien_app, hai công tắc độc lập, đơn App chặn món nhóm tắt');
  await chay('A5', async () => {
    const co = (m, p) => m.some((x) => x.ma === maMon(p));
    await goi('PUT', '/pos/products/nhom/dacbiet', { hien_quay: 0, hien_app: 1 }, tkChu);
    let m = await menuApp();
    k('A5a nhóm tắt QUẦY, bật APP → món vẫn trong /menu (hai công tắc độc lập)', co(m, mL));
    k('A5b món có nhom_ten + nhom_thu_tu; nhom GIỮ = mã', m.find((x) => x.ma === maMon(mJ))?.nhom === 'juice' && m.find((x) => x.ma === maMon(mJ))?.nhom_ten === 'Nước ép'
      && typeof m.find((x) => x.ma === maMon(mJ))?.nhom_thu_tu === 'number', JSON.stringify(m.find((x) => x.ma === maMon(mJ))));
    await goi('PUT', '/pos/products/nhom/dacbiet', { hien_quay: 1, hien_app: 0 }, tkChu);
    m = await menuApp();
    k('A5c nhóm tắt APP → món biến khỏi /menu; nhóm khác còn', !co(m, mL) && co(m, mJ) && co(m, mT));
    await goi('PUT', '/pos/products/' + mR.id, { category: 'juice' }, tkChu);
    m = await menuApp();
    k('A5e món gán vào nhóm juice → hiện trên App', co(m, mR));
    await db.run("UPDATE pos_products SET category = '' WHERE id = ?", [mR.id]);
    m = await menuApp();
    k('A5f K5: món category "" (chưa có nhóm) vẫn trong /menu — không lọc oan', co(m, mR));
    await goi('PUT', '/pos/products/nhom/dacbiet', { hien_app: 1 }, tkChu);
    m = await menuApp();
    k('A5g bật lại → món về', co(m, mL));
    const xt = await goi('GET', '/pos/products/nhom/xem-truoc', undefined, tkNv);
    k('A2n khung "Xem trước": đúng bộ món /api/kh/menu đang trả (cùng hàm, so BẰNG), không đăng nhập → 401',
      la(xt, 200) && bang((xt.j.data || []).map((x) => x.ma).sort(), m.map((x) => x.ma).sort()) && la(await goi('GET', '/pos/products/nhom/xem-truoc'), 401), moTa(xt));
    const ord = (await nhom()).map((g) => g.ma);   // sau A2h: tea, juice, dacbiet — nhom_thu_tu phải đi theo BẢNG, không theo mã
    k('A5h nhom_thu_tu khớp thứ tự nhóm trong bảng (tea < juice < dacbiet)', bang(ord, ['tea', 'juice', 'dacbiet']) && m.find((x) => x.ma === maMon(mT)).nhom_thu_tu < m.find((x) => x.ma === maMon(mJ)).nhom_thu_tu
      && m.find((x) => x.ma === maMon(mJ)).nhom_thu_tu < m.find((x) => x.ma === maMon(mL)).nhom_thu_tu);
    // đơn App
    const sdt = '0933000111';
    await db.run("INSERT INTO pos_customers (phone, name, created_at) VALUES (?, 'Khách Thử', ?)", [sdt, getNow()]);
    const nv = tkNv;
    const ma = String((await goi('POST', '/pos/kh/cap-ma', { sdt }, nv)).j.ma);
    const dn = await goi('POST', '/kh/dang-nhap/xac-minh', { sdt, ma });
    const tk = dn.j.token;
    const gio = (p) => ({ mon: [{ ma: maMon(p), so_luong: 1 }], cach_nhan: 'tai_quan' });
    await goi('PUT', '/pos/products/nhom/dacbiet', { hien_app: 0 }, tkChu);
    const chan = await goi('POST', '/kh/gio/bao-gia', gio(mL), tk);
    k('A5i đơn App gọi món nhóm tắt App → MON_KHONG_BAN', chan.j.code === 'MON_KHONG_BAN', moTa(chan));
    await goi('PUT', '/pos/products/nhom/dacbiet', { hien_app: 1 }, tkChu);
    const qua = await goi('POST', '/kh/gio/bao-gia', gio(mL), tk);
    k('A5j bật lại → báo giá không còn MON_KHONG_BAN', qua.j.code !== 'MON_KHONG_BAN' && qua.status < 500, moTa(qua));
    const tatQuay = await goi('PUT', '/pos/products/nhom/dacbiet', { hien_quay: 0 }, tkChu);
    const qua2 = await goi('POST', '/kh/gio/bao-gia', gio(mL), tk);
    k('A5k tắt QUẦY không chặn đơn App (công tắc độc lập)', la(tatQuay, 200) && qua2.j.code !== 'MON_KHONG_BAN', moTa(qua2));
    await goi('PUT', '/pos/products/nhom/dacbiet', { hien_quay: 1 }, tkChu);
  });

  muc('[Q3] màn khách theo "hiện ở quầy"');
  await chay('Q3', async () => {
    const tenMon = async () => ((await manKhach.noiDung()).menu || []).map((x) => x.ten);
    await goi('PUT', '/pos/products/nhom/dacbiet', { hien_quay: 0, hien_app: 1 }, tkChu);
    const a = await tenMon();
    k('Q3a tắt quầy → món biến khỏi màn khách', !a.includes(mL.name) && a.includes(mJ.name), JSON.stringify(a));
    await goi('PUT', '/pos/products/nhom/dacbiet', { hien_quay: 1, hien_app: 0 }, tkChu);
    const b = await tenMon();
    k('Q3b tắt App, bật quầy → món VẪN trên màn khách; nhom giữ là mã', b.includes(mL.name) && ((await manKhach.noiDung()).menu.find((x) => x.ten === mL.name) || {}).nhom === 'dacbiet', JSON.stringify(b));
    await goi('PUT', '/pos/products/nhom/dacbiet', { hien_quay: 1, hien_app: 1 }, tkChu);
  });

  muc('[A7 · K5] đổi tên nhóm không làm hỏng; luồng cũ chạy như cũ');
  await chay('A7', async () => {
    await goi('PUT', '/pos/products/nhom/juice', { ten: 'Nước ép tươi' }, tkChu);
    const m = await menuApp();
    const mon = m.find((x) => x.ma === maMon(mJ));
    k('A7a sửa tên → /menu đổi ngay; mã `nhom` và category món KHÔNG đổi', mon?.nhom_ten === 'Nước ép tươi' && mon?.nhom === 'juice'
      && (await db.queryOne('SELECT category FROM pos_products WHERE id = ?', [mJ.id])).category === 'juice');
    const don = await goi('POST', '/pos/orders', { items: [{ sx_product_type: mJ.sx_product_type, sx_product_id: mJ.sx_product_id, quantity: 1 }], payment_method: 'cash', cash_amount: 40000, cash_received: 40000, change_amount: 0 }, tkChu);
    k('A7b K5: món cũ category juice bán như cũ (đơn 200)', la(don, 200), moTa(don));
    const nhomUuDai = await db.queryOne("SELECT name FROM sqlite_master WHERE name IN ('pos_product_groups', 'kho_nhom_cong_thuc')").catch(() => null);
    k('A7c pos_product_groups / kho_nhom_cong_thuc còn nguyên (không bị đụng)', !!nhomUuDai);
    const ghiChu = fs.readFileSync(path.join(CLIENT, 'pages', 'BanHang', 'ghiChuMacDinh.js'), 'utf8');
    k('A7d ghi chú nhanh vẫn theo MÃ nhóm (tea / juice)', /tea:\s*\[/.test(ghiChu) && /juice:\s*\[/.test(ghiChu));
  });

  muc('[A4 giao diện · A6] màn Bán hàng + hợp đồng + báo App KH');
  await chay('GD', async () => {
    const bh = fs.readFileSync(path.join(CLIENT, 'pages', 'BanHang', 'BanHangMoi.jsx'), 'utf8');
    k('A4e BanHangMoi bỏ TEN_NHOM viết cứng; tên tab = nhom_ten; thứ tự tab theo nhom_thu_tu; nhóm tắt quầy bị lọc khỏi tab + món (khoá đúng biểu thức, không chỉ có chữ)',
      !/TEN_NHOM/.test(bh) && /spQuay = useMemo\(\(\) => sp\.filter\(\(p\) => p\.nhom_hien_quay !== 0\), \[sp\]\)/.test(bh)
      && /Object\.fromEntries\(spQuay\.map\(\(p\) => \[p\.category, p\.nhom_ten \|\| p\.category\]\)\)/.test(bh)
      && /\.sort\(\(a, b\) => \(spQuay\.find\(\(p\) => p\.category === a\)\.nhom_thu_tu \?\? 9999\) - \(spQuay\.find\(\(p\) => p\.category === b\)\.nhom_thu_tu \?\? 9999\)\)/.test(bh)
      && /const dsMon = nhom === 'all' \? spQuay : spQuay\.filter/.test(bh) && /tenNhom\[n\] \|\| n/.test(bh));
    const hd = fs.readFileSync(path.join(GOC, 'HOP_DONG_API_KH.md'), 'utf8');
    k('A6a hợp đồng: PHIEN_BAN 19, nhom_ten + nhom_thu_tu', /PHIEN_BAN:\s*19\b/.test(hd) && /nhom_ten/.test(hd) && /nhom_thu_tu/.test(hd));
    k('A6b có BAO_APPKH.md nhắc nhom_ten + nhom_thu_tu', (() => { try { const t = fs.readFileSync(path.join(GOC, 'viec', 'NHOM-MON-1', 'BAO_APPKH.md'), 'utf8'); return /nhom_ten/.test(t) && /nhom_thu_tu/.test(t); } catch { return false; } })());
    const sanpham = fs.readFileSync(path.join(CLIENT, 'pages', 'Kho', 'SanPham.jsx'), 'utf8');
    k('A3e SanPham.jsx: ô Nhóm là ô chọn (select), không còn ô gõ tay', /<select[^>]*>[\s\S]{0,400}nhom/i.test(sanpham) && !/Nhóm \(tab ở màn Bán hàng\)<input/.test(sanpham));
  });

  void bang_;
  sv.close();
  ket();
}

function ket() {
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
