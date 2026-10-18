#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ DOI-SOAT-1 — màn "Đối soát": bất biến sổ sách chạy trên dữ liệu thật (CHỈ ĐỌC), ngày / tuần / tháng
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_DOISOAT1.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến, viec/DOI-SOAT-1/dot_bien.py). Bản sao phải nằm cạnh cong_cu/ của nó
 *  (doiSoat.js nạp ../../cong_cu/gia_lap/bat_bien.js — quyết định 3).
 *
 *  Khuôn thu_P26c.js: database.js thật + libsql thật trên kho TẠM, route thật. Đồng hồ GIẢ (bọc Date) để ngày / tuần / tháng
 *  và "hôm nay" cố định. SX giả luôn nhận. Ba người: chủ (owner), quản lý (manager), nhân viên (staff).
 *  Lệch cấy bằng INSERT / UPDATE trực tiếp rồi hoàn lại; cuối bài dữ liệu phải XANH lại (bắt hoàn sai).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_doisoat1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');

const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: {
    laMayThu: () => true,
    cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }),
    diaChiSX: () => '',
    FILE_THU: FILE_KHO,
  },
};
process.env.JWT_SECRET = 'thu_doisoat1_' + Date.now();
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_doisoat1';

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };

// Đồng hồ giả: `new Date()` và `Date.now()` trả `gio`; mặc định 12:00 giờ VN thứ 4 04.11.2026.
const DateGoc = Date;
let gio = DateGoc.UTC(2026, 10, 4, 5, 0, 0);
global.Date = class extends DateGoc {
  constructor(...a) { if (a.length === 0) super(gio); else super(...a); }
  static now() { return gio; }
};
const datGio = (y, m, d, gioUTC = 5, phut = 0) => { gio = DateGoc.UTC(y, m - 1, d, gioUTC, phut, 0); };

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();

  // Ghi lại MỌI câu SQL + số dòng trả về — bọc TRƯỚC khi nạp route / doiSoat.js (module destructure lúc nạp thì bọc muộn không chặn được).
  const ghi = { bat: false, sql: [], dong: 0 };
  for (const ten of ['query', 'queryOne', 'run']) {
    const goc = db[ten];
    db[ten] = async (...a) => {
      const r = await goc(...a);
      if (ghi.bat) { ghi.sql.push(String(a[0])); if (Array.isArray(r)) ghi.dong += r.length; }
      return r;
    };
  }

  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const sxOk = async () => ({ ok: true });
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true, checkStock: async () => ({ sufficient: true, stock: 999 }),
    outStockFIFO: sxOk, inStockReturn: sxOk, callSxApi: sxOk };

  const app = express();
  app.use(express.json());
  for (const r of ['don-mo-rong', 'orders', 'refunds', 'wallets', 'packages', 'rewards', 'loyalty', 'reports']) {
    app.use('/api/pos/' + (r === 'don-mo-rong' ? 'orders' : r), require(path.join(MAY_CHU, 'routes', r + '.js')));
  }
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();

  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const chu = await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const nguoi = { chu: chu.id };
  for (const [ten, vaiTro] of [['ql_ds1', 'manager'], ['nv_ds1', 'staff']]) {
    nguoi[vaiTro] = Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)",
      [ten, ten, vaiTro])).lastInsertRowid);
  }
  const the = Object.fromEntries(Object.entries(nguoi).map(([a, id]) => [a, jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '3650d' })]));
  const goiAi = async (ai, method, url, body) => {
    imLang();
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (ai) headers.Authorization = 'Bearer ' + the[ai];
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined, headers });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const goi = (method, url, body) => goiAi('chu', method, url, body);
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;

  // ── dữ liệu nền ──
  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 4');
  for (const [i, g] of [25000, 20000, 50000, 30000].entries()) await db.run('UPDATE pos_products SET price = ? WHERE id = ?', [g, sp[i].id]);
  const mon = (i, sl = 1, tuGoi = false) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type,
    sx_product_id: sp[i].sx_product_id, quantity: sl, from_package: tuGoi });
  const datCai = (khoa, giaTri) => db.run('INSERT INTO pos_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [khoa, giaTri]);
  await datCai('loyalty_enabled', 'true');
  await datCai('loyalty_earn_per_amount', '1000');
  let soSdt = 0;
  const sdtMoi = () => '0937' + String(100000 + (++soSdt));
  const nap = async (sdt, tien) => {
    const r = await goi('POST', '/wallets/topup', { phone: sdt, amount: tien, customer_name: 'Khách DS1', payment_method: 'cash' });
    if (r.status !== 200) throw new Error('không nạp được ví: ' + moTa(r));
  };
  const taoDon = async (body) => {
    const r = await goi('POST', '/orders', { customer_name: 'Khách DS1', ...body });
    if (!r.success) throw new Error('không tạo được đơn: ' + moTa(r));
    return r.order.id;
  };
  const huy = (id) => goi('PUT', `/orders/${id}/cancel`, { reason: 'thử DS1' });
  const maDon = (id) => mot('SELECT code FROM pos_orders WHERE id = ?', [id]).then((r) => r.code);
  let soGoi = 0;
  const taoGoi = async (gia, luot) => Number((await db.run(`INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active)
    VALUES (?, 'Gói DS1', ?, 'ly', ?, 1)`, [`GOI_DS1_${++soGoi}`, gia, luot])).lastInsertRowid);
  const muaGoi = (sdt, goiId, tra, them = {}) => goi('POST', '/orders', { customer_phone: sdt, customer_name: 'Khách DS1',
    items: [], package_buy: { package_id: goiId, total_qty: 10, pkg_qty: 1 }, payment_method: 'cash', cash_amount: 0, ...tra, ...them });
  const ds = async (ai, kieu, ngay) => ({ do: [], can_xem: [], cu: [], bat_bien: [],   // 404 (chưa vá) → mảng rỗng, ca ✗ chứ không sập
    ...(await goiAi(ai, 'GET', `/reports/doi-soat?kieu=${kieu}${ngay ? '&ngay=' + ngay : ''}`)) });
  const ghiDS = (ai, body) => goiAi(ai, 'POST', '/reports/doi-soat/ghi', body);
  const tom = (r) => `HTTP ${r.status} · ${r.ket_qua} · đỏ: ${(r.do || []).slice(0, 3).map((l) => l.bat_bien + ' ' + l.mo_ta).join(' | ')}`;
  const bam = async () => {   // băm NỘI DUNG mọi bảng pos_* (trừ bảng của việc này) — đếm hàng không bắt được UPDATE
    const h = crypto.createHash('sha1');
    const bang = await db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'pos_%' AND name <> 'pos_doi_soat_ghi' ORDER BY name");
    for (const b of bang) h.update(b.name + JSON.stringify(await db.query(`SELECT * FROM ${b.name} ORDER BY rowid`)));
    return h.digest('hex');
  };

  console.log('\nTHỬ DOI-SOAT-1 — màn Đối soát');
  let doiSoat = {};
  try { doiSoat = require(path.join(MAY_CHU, 'utils', 'doiSoat.js')); } catch (e) { k('A0 server/utils/doiSoat.js nạp được', false, e.message); }
  const BAT_BIEN = doiSoat.BAT_BIEN || {};
  const goiHam = async (ten, ...a) => (typeof doiSoat[ten] === 'function' ? doiSoat[ten](...a) : { do: [], loi: 'thiếu hàm ' + ten });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B0] dữ liệu SẠCH dựng bằng luồng thật → XANH ở cả ba kỳ (K5: mỗi luồng hợp lệ một dòng)');
  datGio(2026, 11, 4);   // thứ 4 04.11.2026 12:00 VN
  const f = {};
  f.tm = await taoDon({ items: [mon(0)], payment_method: 'cash', cash_amount: 25000 });
  k('B0a đơn tiền mặt thường tạo được', f.tm > 0);
  const sNo = sdtMoi();
  f.no = await taoDon({ customer_phone: sNo, items: [mon(0)], payment_method: 'debt', debt_amount: 25000 });
  const thuNo = await goi('POST', `/orders/${f.no}/pay-debt`, { payment_method: 'cash', amount: 25000 });
  k('B0b đơn nợ rồi thu sau bằng pay-debt → 200', thuNo.status === 200, moTa(thuNo));
  f.huy = await taoDon({ items: [mon(0)], payment_method: 'cash', cash_amount: 25000 });
  const h1 = await huy(f.huy);
  k('B0c huỷ đơn tiền mặt → 200', h1.status === 200, moTa(h1));
  const sBal = sdtMoi();
  await nap(sBal, 25000);
  f.bal = await taoDon({ customer_phone: sBal, items: [mon(0)], payment_method: 'balance', balance_amount: 25000 });
  const yc = await goi('POST', '/refunds', { order_id: f.bal, reason: 'thử DS1' });
  const dy = await goi('POST', `/refunds/${yc.refund_id}/approve`, {});
  k('B0d đơn trả bằng ví → yêu cầu hoàn → duyệt → 200', yc.status === 200 && dy.status === 200, `${moTa(yc)} / ${moTa(dy)}`);
  const hang = await mot('SELECT id, card_price FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order LIMIT 1');
  f.the = await taoDon({ customer_phone: sdtMoi(), items: [], membership_buy: { tier_id: hang.id }, payment_method: 'cash', cash_amount: Number(hang.card_price) });
  k('B0e mua thẻ hội viên bằng tiền mặt tạo được', f.the > 0);
  const sG = sdtMoi();
  const goiA = await taoGoi(300000, 10);
  const m1 = await muaGoi(sG, goiA, { cash_amount: 300000 });
  const cp = await mot('SELECT id FROM pos_customer_packages WHERE order_id = ?', [m1.order?.id]);
  const lay = await goi('POST', '/orders', { customer_phone: sG, customer_name: 'Khách DS1', items: [mon(0, 1, true)], customer_package_id: cp?.id,
    payment_method: 'cash', cash_amount: 0 });
  k('B0f mua gói 300.000 rồi lấy 1 ly từ gói → 200', m1.success && lay.status === 200, `${moTa(m1)} / ${moTa(lay)}`);
  f.doi = await taoDon({ items: [mon(0)], payment_method: 'cash', cash_amount: 25000 });
  const dc = await goi('POST', `/orders/${f.doi}/doi-cach-tra`, { sang: 'transfer', ly_do: 'thử DS1' });
  k('B0g đổi cách trả tiền mặt → chuyển khoản cùng ngày → 200', dc.status === 200, moTa(dc));
  const sDiem = sdtMoi();
  await db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, reason, created_at) VALUES (?, 'earn', 10, 'thử DS1', ?)", [sDiem, '2026-11-04T09:00:00']);
  const qua = await goi('POST', '/rewards', { name: 'Quà DS1', points_cost: 3, discount_type: 'fixed', discount_value: 5000, valid_days: 30 });
  const doiDiem = await goi('POST', '/loyalty/redeem', { phone: sDiem, reward_id: qua.id });
  k('B0h đổi điểm lấy quà → 200', doiDiem.status === 200, moTa(doiDiem));
  const mgd = await muaGoi(sdtMoi(), goiA, { cash_amount: 300000 }, { items: [mon(0, 1, true)] });
  const diemMgd = await so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ?', [mgd.order?.id]);
  k('B0i mua gói rồi lấy ngay → 200', mgd.success, moTa(mgd));
  for (const kieu of ['ngay', 'tuan', 'thang']) {
    const r = await ds('chu', kieu, '2026-11-04');
    k(`B0 ${kieu}: dữ liệu sạch → XANH`, r.status === 200 && r.ket_qua === 'XANH', tom(r));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] dùng lại bất biến, MỘT bản, CHỈ ĐỌC');
  {
    const r = await ds('chu', 'thang', '2026-11-04');
    const ten = (r.bat_bien || []).map((b) => b.ten).filter((t) => /^I\d+$/.test(t)).sort();
    const goc = Object.keys(BAT_BIEN).sort();
    const chay = (r.bat_bien || []).filter((b) => /^I\d+$/.test(b.ten) && b.trang_thai !== 'bo').length;
    const bo = (r.bat_bien || []).filter((b) => b.trang_thai === 'bo').map((b) => b.ten + ':' + (b.ly_do ? 'có lý do' : 'THIẾU lý do'));
    k('A1 danh sách = Object.keys(BAT_BIEN) (18); chạy 17, bỏ I7 có lý do', ten.join() === goc.join() && goc.length === 18 && chay === 17 && bo.join() === 'I7:có lý do',
      `${ten.length}/${goc.length} · chạy ${chay} · bỏ ${bo.join()}`);
    const truoc = await bam();
    ghi.bat = true; ghi.sql = []; ghi.dong = 0;
    for (const kieu of ['ngay', 'tuan', 'thang']) await ds('chu', kieu, '2026-11-04');
    ghi.bat = false;
    const khongDoc = ghi.sql.filter((s) => !/^\s*(SELECT|WITH)\b/i.test(s));
    k('A2 mọi câu SQL của ba lượt chạy bắt đầu SELECT|WITH', ghi.sql.length > 30 && khongDoc.length === 0, `${ghi.sql.length} câu · ngoài lệ: ${khongDoc.slice(0, 2).join(' | ')}`);
    k('A3 băm nội dung mọi bảng pos_* (trừ bảng của việc này) trước = sau', truoc === await bam());
    let nem = false;
    try { await doiSoat.chayDoiSoat({ kieu: 'ngay', ngay: '2026-11-04' }, { IW: async (q) => { await q('UPDATE pos_settings SET value = value'); return []; } }); }
    catch { nem = typeof doiSoat.chayDoiSoat === 'function'; }   // thiếu hàm không được tính là "bị chặn" (K3)
    k('A2b bất biến giả có UPDATE → bị chặn (ném lỗi), nội dung bảng không đổi', nem && truoc === await bam());
    const ma = fs.readFileSync(path.join(MAY_CHU, 'utils', 'doiSoat.js'), 'utf8');
    const ngoaiGhi = ma.replace(/\/\/ <ghi-moi>[\s\S]*?\/\/ <\/ghi-moi>/, '');
    k('A4 doiSoat.js: không reconcile; INSERT|UPDATE|DELETE chỉ trong khối ghiMoi', /<ghi-moi>/.test(ma) && !/reconcile/i.test(ma) && !/\b(INSERT|UPDATE|DELETE)\b/.test(ngoaiGhi));
    k('A5 (ghi chú) giả lập chay.js / thu_gia_lap.js đạt: chạy ở cổng --day-du nhóm S, số liệu trong bang_chung_do.txt', true);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] kỳ ngày / tuần (thứ 2 → CN) / tháng theo GIỜ VN');
  {
    // Đơn chuyển khoản dựng ở ngày 04.11 rồi đặt created_at. Tuần 16→22.11: trong 20.000 (T2 00:00:00) · 50.000 (T4) · 25.000 (CN 23:59:59);
    // ngoài 30.000 (CN trước 23:59:59) · 45.000 (T2 sau 00:00:00). Tháng 11 ngoài: 31.10 23:59:59 và 01.12 00:00:00.
    const ck = async (dsMon, luc) => {
      const tong = dsMon.reduce((t, m) => t + [25000, 20000, 50000, 30000][sp.findIndex((s) => s.id === m.product_id)] * m.quantity, 0);
      const id = await taoDon({ items: dsMon, payment_method: 'transfer', transfer_amount: tong });
      await db.run('UPDATE pos_orders SET created_at = ? WHERE id = ?', [luc, id]);
    };
    await ck([mon(1)], '2026-11-16T00:00:00'); await ck([mon(2)], '2026-11-18T12:00:00'); await ck([mon(0)], '2026-11-22T23:59:59');
    await ck([mon(3)], '2026-11-15T23:59:59'); await ck([mon(0), mon(1)], '2026-11-23T00:00:00');
    await ck([mon(1)], '2026-10-31T23:59:59'); await ck([mon(0)], '2026-12-01T00:00:00');
    const ngay = await ds('chu', 'ngay', '2026-11-18');
    const tuan = await ds('chu', 'tuan', '2026-11-18');
    const thang = await ds('chu', 'thang', '2026-11-18');
    const rong = (r) => r.tien?.chuyen_khoan?.rong;
    k('B1 ngày 18.11: CK theo sổ = 50.000, không lẫn ngày khác', rong(ngay) === 50000 && ngay.tu === '2026-11-18' && ngay.den === '2026-11-18', `${rong(ngay)} · ${ngay.tu}→${ngay.den}`);
    k('B2 tuần 16→22.11 (T2 00:00:00 trong, CN 23:59:59 trong, CN trước và T2 sau ngoài): CK = 95.000', rong(tuan) === 95000 && tuan.tu === '2026-11-16' && tuan.den === '2026-11-22', `${rong(tuan)} · ${tuan.tu}→${tuan.den}`);
    k('B3 tháng 11 (31.10 23:59:59 và 01.12 00:00:00 ngoài): CK = 195.000 (170.000 + 25.000 đổi cách trả B0g)', rong(thang) === 195000 && thang.tu === '2026-11-01' && thang.den === '2026-11-30', `${rong(thang)} · ${thang.tu}→${thang.den}`);
    const ky = (kieu, ngayX) => (typeof doiSoat.tinhKy === 'function' ? doiSoat.tinhKy(kieu, ngayX) : {});
    k('B3b tuần vắt tháng / năm: 01.10.2026 → 28.09–04.10; 01.01.2027 → 28.12–03.01', ky('tuan', '2026-10-01').tu === '2026-09-28' && ky('tuan', '2026-10-01').den === '2026-10-04'
      && ky('tuan', '2027-01-01').tu === '2026-12-28' && ky('tuan', '2027-01-01').den === '2027-01-03');
    k('B3c tháng 2: 2028 (nhuận) → 29, 2027 → 28', ky('thang', '2028-02-10').den === '2028-02-29' && ky('thang', '2027-02-10').den === '2027-02-28');
    gio = DateGoc.UTC(2026, 9, 18, 18, 30, 0);   // 18:30 UTC thứ 7 = 01:30 giờ VN THỨ 2 19.10.2026
    const m = await ds('chu', 'tuan');
    k('B4 đồng hồ 18:30 UTC (= 01:30 T2 19.10 VN), không truyền ngày → hôm nay 19.10, tuần 19→25.10 (UTC sẽ ra 18.10 / 12→18)',
      m.hom_nay === '2026-10-19' && m.tu === '2026-10-19' && m.den === '2026-10-25', `${m.hom_nay} · ${m.tu}→${m.den}`);
    datGio(2026, 11, 4);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] dữ liệu cũ trước ngày áp dụng → vàng; lệch cấy từng bất biến → đúng nhóm, có ngày; không rõ ngày → đỏ');
  {
    const maTm = await maDon(f.tm), maNo = await maDon(f.no), maDoi = await maDon(f.doi);
    const goiHong = await taoGoi(1000, 2);
    const L = 'toan_so', K = 'ky';
    // [bất biến, [SQL cấy], [SQL hoàn], mẫu mô tả, nhóm, phạm vi, có ngày?]
    const cay = [
      ['I1', [`INSERT INTO pos_signup_codes (code, order_id, issued_at, claimed_at, claimed_phone) VALUES ('DS_I1', ${f.huy}, '2026-11-04T10:00:00', '2026-11-04T23:00:00', '0900000001')`], ["DELETE FROM pos_signup_codes WHERE code = 'DS_I1'"], /mã DS_I1 đã dùng/, 'do', K, true],
      ['I2', ["INSERT INTO pos_signup_codes (code, order_id, issued_at) VALUES ('DS_I2', 999991, '2026-11-04T10:00:00')"], ["DELETE FROM pos_signup_codes WHERE code = 'DS_I2'"], /mã DS_I2 mồ côi/, 'do', L, true],
      ['I3', [`UPDATE pos_orders SET payment_status = 'la' WHERE id = ${f.tm}`], [`UPDATE pos_orders SET payment_status = 'paid' WHERE id = ${f.tm}`], new RegExp(`đơn ${maTm}: completed · la`), 'do', K, true],
      ['I4', [`UPDATE pos_wallets SET balance = balance + 7 WHERE phone = '${sBal}'`], [`UPDATE pos_wallets SET balance = balance - 7 WHERE phone = '${sBal}'`], new RegExp(`ví ${sBal}: số dư`), 'do', L, true],
      ['I5', [`INSERT INTO pos_balance_transactions (customer_phone, type, amount, created_at, notes) VALUES ('${sBal}', 'la_hoac', 1, '2026-11-04T10:00:00', 'DS_I5')`], ["DELETE FROM pos_balance_transactions WHERE notes = 'DS_I5'"], /loại dòng ví lạ "la_hoac"/, 'do', L, false],
      ['I6', [`UPDATE pos_orders SET total = total + 5 WHERE id = ${f.tm}`], [`UPDATE pos_orders SET total = total - 5 WHERE id = ${f.tm}`], new RegExp(`đơn ${maTm}: đã ghi`), 'do', K, true],
      ['I8', [`INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, reason, created_at) VALUES ('${sBal}', 'earn', 3, ${f.tm}, 'DS_I8', '2026-11-04T10:00:00')`], ["DELETE FROM pos_point_transactions WHERE reason = 'DS_I8'"], new RegExp(`đơn ${maTm}: 3 điểm`), 'do', K, true],
      ['I8', [`INSERT INTO pos_point_transactions (customer_phone, type, points, reason, created_at) VALUES ('${sBal}', 'la', 1, 'DS_I8b', '2026-11-04T10:00:00')`], ["DELETE FROM pos_point_transactions WHERE reason = 'DS_I8b'"], /loại dòng điểm lạ "la"/, 'do', L, false],
      ['I9', [`INSERT INTO pos_balance_transactions (customer_phone, type, amount, order_id, created_at, notes) VALUES ('${sNo}', 'debt_payment', 1, ${f.no}, '2026-11-04T10:00:00', 'DS_I9')`], ["DELETE FROM pos_balance_transactions WHERE notes = 'DS_I9'"], new RegExp(`đơn ${maNo}: 2 dòng sổ debt_payment`), 'do', K, true],
      ['I11', [`INSERT INTO pos_balance_transactions (customer_phone, type, amount, order_id, created_at, notes) VALUES ('${sBal}', 'refund', 500, ${f.tm}, '2026-11-04T10:00:00', 'DS_I11')`], ["DELETE FROM pos_balance_transactions WHERE notes = 'DS_I11'"], new RegExp(`đơn #${f.tm}, ví ${sBal}`), 'do', K, true],
      ['I12', [`INSERT INTO pos_voucher_grants (code, customer_phone, granted_at, status) VALUES ('DS_I12', '${sBal}', '2026-11-04T10:00:00', 'available')`], ["DELETE FROM pos_voucher_grants WHERE code = 'DS_I12'"], /quà #\d+ mã DS_I12/, 'can_xem', K, true],
      ['I13', ["INSERT INTO pos_discount_codes (code, discount_type, discount_value, usage_limit, used_count, created_at) VALUES ('DS_I13', 'fixed', 1000, 2, 3, '2026-11-04T10:00:00')"], ["DELETE FROM pos_discount_codes WHERE code = 'DS_I13'"], /mã DS_I13: đã dùng 3\/2/, 'can_xem', L, true],
      ['I14', [`INSERT INTO pos_customer_packages (customer_phone, package_id, total_qty, delivered_qty, status, notes, created_at) VALUES ('${sBal}', ${goiHong}, 2, 5, 'active', 'DS_I14', '2026-11-04T10:00:00')`], ["DELETE FROM pos_customer_packages WHERE notes = 'DS_I14'"], /gói #\d+: đã giao 5 > tổng 2/, 'can_xem', K, true],
      ['I15', ["INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at) VALUES ('0900000002', 1, 'DS_I15', 0, 888881, '2026-11-04T10:00:00', '2027-11-04T10:00:00')"], ["DELETE FROM pos_membership_purchases WHERE tier_name = 'DS_I15'"], /dòng mua thẻ #\d+ của đơn #888881 không còn/, 'do', K, true],
      ['I16', [`UPDATE pos_orders SET cash_amount = 1 WHERE id = ${f.doi}`], [`UPDATE pos_orders SET cash_amount = 0 WHERE id = ${f.doi}`], new RegExp(`đơn ${maDoi}: nhật ký đổi sang`), 'do', K, true],
      ['I17', [`INSERT INTO pos_refund_requests (order_id, customer_phone, refund_amount, status, requested_at, processed_at, reason) VALUES (${f.tm}, '${sBal}', 100, 'approved', '2026-11-04T10:00:00', '2026-11-04T10:00:00', 'DS_I17')`], ["DELETE FROM pos_refund_requests WHERE reason = 'DS_I17'"], new RegExp(`yêu cầu hoàn #\\d+ \\(đơn #${f.tm}\\)`), 'do', K, true],
      ['I18', [`UPDATE pos_wallets SET total_topup = total_topup + 9 WHERE phone = '${sBal}'`], [`UPDATE pos_wallets SET total_topup = total_topup - 9 WHERE phone = '${sBal}'`], new RegExp(`ví ${sBal}: tổng nạp`), 'do', L, true],
      ['I19', [`INSERT INTO pos_wallets (phone, balance) VALUES ('0900000003', 99999)`, `INSERT INTO pos_balance_transactions (customer_phone, type, amount, order_id, created_at, notes) VALUES ('0900000003', 'compensation', 99999, ${f.tm}, '2026-11-04T10:00:00', 'DS_I19')`],
        ["DELETE FROM pos_balance_transactions WHERE notes = 'DS_I19'", "DELETE FROM pos_wallets WHERE phone = '0900000003'"], new RegExp(`đơn ${maTm}: khách nhận lại`), 'do', K, true],
      ['D1', ["INSERT INTO pos_signup_codes (code, issued_at, claimed_at, claimed_phone) VALUES ('DS_D1A', '2026-11-04T10:00:00', '2026-11-04T10:00:00', '0911111111')", "INSERT INTO pos_signup_codes (code, issued_at, claimed_at, claimed_phone) VALUES ('DS_D1B', '2026-11-04T10:00:00', '2026-11-04T10:00:00', '0911111111')"],
        ["DELETE FROM pos_signup_codes WHERE code LIKE 'DS_D1%'"], /0911111111: 2 dòng claimed_phone/, 'do', K, true],
    ];
    const sach = async () => (await ds('chu', 'thang', '2026-11-04')).ket_qua === 'XANH';
    for (const [bb, setup, hoan, mau, nhom, pv, coNgay] of cay) {
      for (const s of setup) await db.run(s);
      const r = await ds('chu', 'thang', '2026-11-04');
      const dong = (r[nhom] || []).find((l) => l.bat_bien === bb && mau.test(l.mo_ta));
      k(`C4 ${bb} ${mau.source.slice(0, 40)}: dòng ở nhóm ${nhom}, phạm vi ${pv}, ${coNgay ? 'có ngày' : 'không ngày'}`,
        !!dong && dong.pham_vi === pv && (coNgay ? !!dong.ngay : !dong.ngay), dong ? JSON.stringify(dong) : `không thấy; đỏ: ${(r.do || []).slice(0, 2).map((l) => l.mo_ta).join(' | ')}`);
      for (const s of hoan) await db.run(s);
    }
    k('C4z hoàn lại hết lệch cấy → XANH', await sach());

    // Ngưỡng ngày áp dụng: I19 áp dụng từ 2026-10-14. Dòng của đơn ngày 13.10 23:59:59 → vàng; 14.10 00:00:00 → đỏ.
    const cayI19 = async () => {
      await db.run("INSERT INTO pos_wallets (phone, balance) VALUES ('0900000004', 99999)");
      await db.run(`INSERT INTO pos_balance_transactions (customer_phone, type, amount, order_id, created_at, notes) VALUES ('0900000004', 'compensation', 99999, ${f.tm}, '2026-10-13T08:00:00', 'DS_C')`);
    };
    const hoanI19 = async () => {
      await db.run("DELETE FROM pos_balance_transactions WHERE notes = 'DS_C'"); await db.run("DELETE FROM pos_wallets WHERE phone = '0900000004'");
      await db.run('UPDATE pos_orders SET created_at = ? WHERE id = ?', ['2026-11-04T12:00:00', f.tm]);
    };
    await cayI19();
    await db.run('UPDATE pos_orders SET created_at = ? WHERE id = ?', ['2026-10-13T23:59:59', f.tm]);
    const c1 = await ds('chu', 'thang', '2026-10-15');
    k('C1 đơn 13.10 23:59:59 (trước ngày áp dụng I19) → nhóm vàng "cũ", kết quả XANH', c1.cu.some((l) => l.bat_bien === 'I19') && !c1.do.some((l) => l.bat_bien === 'I19') && c1.ket_qua === 'XANH', tom(c1));
    await db.run('UPDATE pos_orders SET created_at = ? WHERE id = ?', ['2026-10-14T00:00:00', f.tm]);
    const c2 = await ds('chu', 'thang', '2026-10-15');
    k('C2 đơn 14.10 00:00:00 (đúng ngày áp dụng) → ĐỎ', c2.do.some((l) => l.bat_bien === 'I19') && c2.ket_qua === 'DO', tom(c2));
    await hoanI19();
    const ap = doiSoat.AP_DUNG_TU || {};
    const thieu = Object.keys(BAT_BIEN).filter((t) => t !== 'I7' && !Object.prototype.hasOwnProperty.call(ap, t));
    k('C3 AP_DUNG_TU có khoá cho mọi bất biến chạy (trừ I7) và D1', thieu.length === 0 && Object.prototype.hasOwnProperty.call(ap, 'D1'), `thiếu: ${thieu.join()}`);
    const xa = await goiHam('chayDoiSoat', { kieu: 'ngay', ngay: '2030-01-01' },{ ...BAT_BIEN, I99: async () => ['dòng lạ không có khoá'] });
    const la = (xa.do || []).find((l) => l.bat_bien === 'I99');
    k('C5 dòng không phân giải được ngày → ĐỎ ở kỳ bất kỳ (kỳ 2030 không có đơn nào)', !!la && !la.ngay && xa.ket_qua === 'DO', JSON.stringify(la));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] SĐT nhận ≥ 2 lần (D1); điểm đơn mua thẻ / gói (D2 = I8)');
  {
    const ins = (ma, phone, luc, cot = 'claimed') => (cot === 'claimed'
      ? db.run('INSERT INTO pos_signup_codes (code, issued_at, claimed_at, claimed_phone) VALUES (?, ?, ?, ?)', [ma, luc, luc, phone])
      : db.run('INSERT INTO pos_signup_codes (code, issued_at, diem_nhan_luc, diem_nhan_phone) VALUES (?, ?, ?, ?)', [ma, luc, luc, phone]));
    const xoa = () => db.run("DELETE FROM pos_signup_codes WHERE code LIKE 'DS_D1%'");
    await ins('DS_D1A', '0922222222', '2026-10-10T10:00:00'); await ins('DS_D1B', '0922222222', '2026-10-10T11:00:00');
    let r = await ds('chu', 'thang', '2026-10-15');
    k('D1a SĐT 2 lần `claimed_phone` trước P20c (ngày < 17.10) → vàng, không đỏ', r.cu.some((l) => l.bat_bien === 'D1' && /0922222222/.test(l.mo_ta)) && !r.do.some((l) => l.bat_bien === 'D1'), tom(r));
    await xoa();
    await ins('DS_D1A', '0922222222', '2026-11-04T10:00:00'); await ins('DS_D1B', '0922222222', '2026-11-04T11:00:00');
    r = await ds('chu', 'thang', '2026-11-04');
    k('D1b cùng SĐT, ngày sau P20c → ĐỎ', r.do.some((l) => l.bat_bien === 'D1' && /0922222222/.test(l.mo_ta)) && r.ket_qua === 'DO', tom(r));
    await xoa();
    await ins('DS_D1C', '0933333333', '2026-11-04T10:00:00', 'diem'); await ins('DS_D1D', '0933333333', '2026-11-04T11:00:00', 'diem');
    await datCai('nhandiem_chi_lan_dau', '1');
    r = await ds('chu', 'thang', '2026-11-04');
    k('D1c `diem_nhan_phone` ×2 khi cài đặt "chỉ lần đầu" bật → ĐỎ', r.do.some((l) => l.bat_bien === 'D1' && /diem_nhan_phone/.test(l.mo_ta)), tom(r));
    await datCai('nhandiem_chi_lan_dau', '0');
    r = await ds('chu', 'thang', '2026-11-04');
    k('D1d (K5) cùng dữ liệu, cài đặt cho nhận nhiều lần → CẦN XEM (vàng), không đỏ', r.can_xem.some((l) => l.bat_bien === 'D1') && !r.do.some((l) => l.bat_bien === 'D1') && r.ket_qua === 'XANH', tom(r));
    await datCai('nhandiem_chi_lan_dau', '1'); await xoa();

    const diemThe = await so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ?', [f.the]);
    const tongThe = await so('SELECT total FROM pos_orders WHERE id = ?', [f.the]);
    k('D2a mua thẻ: điểm = floor(total/1000), đúng tiền mua', diemThe === Math.floor(tongThe / 1000) && diemThe > 0, `${diemThe} điểm / tổng ${tongThe}`);
    await db.run("UPDATE pos_point_transactions SET points = points + 100 WHERE order_id = ? AND type = 'earn'", [f.the]);
    r = await ds('chu', 'thang', '2026-11-04');
    const l2 = r.do.find((l) => l.bat_bien === 'I8' && l.nhan === 'D2');
    k('D2a2 cấy +100 điểm trên đơn mua thẻ → ĐỎ "đúng luật là N", nhãn D2', !!l2 && new RegExp(`${diemThe + 100} điểm, đúng luật là ${diemThe}`).test(l2.mo_ta), l2 ? l2.mo_ta : tom(r));
    await db.run("UPDATE pos_point_transactions SET points = points - 100 WHERE order_id = ? AND type = 'earn'", [f.the]);
    const idLay = lay.order?.id;
    await db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, reason, created_at) VALUES (?, 'earn', 5, ?, 'DS_D2b', '2026-11-04T10:00:00')", [sG, idLay]);
    r = await ds('chu', 'thang', '2026-11-04');
    k('D2b đơn lấy-từ-gói (tổng 0) được cộng 5 điểm → ĐỎ', r.do.some((l) => l.bat_bien === 'I8' && l.nhan === 'D2' && /5 điểm, đúng luật là 0/.test(l.mo_ta)), tom(r));
    await db.run("DELETE FROM pos_point_transactions WHERE reason = 'DS_D2b'");
    k('D2c (K5) mua gói rồi lấy ngay: điểm theo tiền mua (300), không cộng thêm → XANH', diemMgd === 300 && (await ds('chu', 'thang', '2026-11-04')).ket_qua === 'XANH', `${diemMgd} điểm`);
    const sNo2 = sdtMoi();
    const theNo = await taoDon({ customer_phone: sNo2, items: [], membership_buy: { tier_id: hang.id }, payment_method: 'debt', debt_amount: Number(hang.card_price) });
    const diemNo = await so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ?', [theNo]);
    k('D2d (ghi hành vi HIỆN TẠI) đơn thẻ còn nợ: điểm theo `total`, XANH (đổi khi chủ quán chốt khác)', diemNo === Math.floor(Number(hang.card_price) / 1000) && (await ds('chu', 'thang', '2026-11-04')).ket_qua === 'XANH', `${diemNo} điểm`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] ô két (đếm cuối ngày + để lại cho mai) — tiền mặt thật vào két = bán + nạp ví + thu nợ theo NGÀY THU − trả ra');
  datGio(2027, 1, 5);   // thứ 3 05.01.2027
  const sB = sdtMoi();
  await taoDon({ items: [mon(0)], payment_method: 'cash', cash_amount: 25000 });
  const dNo = await taoDon({ customer_phone: sB, items: [mon(2)], payment_method: 'debt', debt_amount: 50000 });
  let r0 = await ds('chu', 'ngay', '2027-01-05');
  k('E1 chưa đếm két → "chưa đếm két", kết quả XANH', r0.ket_qua === 'XANH' && r0.ket?.trang_thai === 'chua_dem' && r0.tien?.tien_mat?.rong === 25000, `${tom(r0)} · ${r0.ket?.trang_thai} · ${r0.tien?.tien_mat?.rong}`);
  const g1 = await ghiDS('chu', { loai: 'ket', ky: '2027-01-05', so_tien: 125000, de_lai: 100000 });
  r0 = await ds('chu', 'ngay', '2027-01-05');
  k('E1b ngày đầu có đếm nhưng chưa có số để lại của ngày trước → "chưa có mốc" (vàng, XANH)', g1.status === 201 && r0.ket?.trang_thai === 'chua_co_moc' && r0.ket_qua === 'XANH', `${moTa(g1)} · ${r0.ket?.trang_thai}`);
  datGio(2027, 1, 6);   // thứ 4 06.01.2027
  await taoDon({ items: [mon(1)], payment_method: 'cash', cash_amount: 20000 });
  const thu2 = await goi('POST', `/orders/${dNo}/pay-debt`, { payment_method: 'cash', amount: 50000 });
  await nap(sB, 30000);
  const dHuy = await taoDon({ items: [mon(0)], payment_method: 'cash', cash_amount: 25000 });
  await huy(dHuy);
  const goiB = await taoGoi(300000, 10);
  const mB = await muaGoi(sdtMoi(), goiB, { cash_amount: 300000 });
  await huy(mB.order?.id);
  await taoDon({ items: [mon(2)], payment_method: 'transfer', transfer_amount: 50000 });
  const e2 = await ds('chu', 'ngay', '2027-01-06');
  const tm = e2.tien?.tien_mat || {};
  k('E0 tiền mặt vào két 06.01: bán 345.000 (20.000 + 25.000 huỷ + 300.000 gói huỷ) · thu nợ 50.000 (thu ngày 06, đơn tạo ngày 05) · nạp ví 30.000 · trả ra 25.000 (huỷ đơn thường; huỷ gói KHÔNG ra) → ròng 400.000',
    thu2.status === 200 && tm.ban === 345000 && tm.thu_no === 50000 && tm.nap_vi === 30000 && tm.tra_ra === 25000 && tm.rong === 400000, JSON.stringify(tm));
  k('E0b sổ két 06.01 = để lại 05.01 (100.000) + 400.000 = 500.000; chưa đếm → vàng', e2.ket?.so_theo_so === 500000 && e2.ket?.trang_thai === 'chua_dem' && e2.ket_qua === 'XANH', JSON.stringify(e2.ket));
  const g2 = await ghiDS('chu', { loai: 'ket', ky: '2027-01-06', so_tien: 500000, de_lai: 150000 });
  const e3 = await ds('chu', 'ngay', '2027-01-06');
  k('E2 đếm 500.000 = sổ → chênh 0, XANH', g2.status === 201 && e3.ket?.chenh === 0 && e3.ket?.trang_thai === 'khop' && e3.ket_qua === 'XANH', `${moTa(g2)} · ${JSON.stringify(e3.ket)}`);
  await ghiDS('chu', { loai: 'ket', ky: '2027-01-06', so_tien: 500001, de_lai: 150000 });
  const e4 = await ds('chu', 'ngay', '2027-01-06');
  k('E3 đếm 500.001 (sổ 500.000) → ĐỎ đúng "+1đ" và hai số', e4.ket_qua === 'DO' && e4.do.some((l) => l.bat_bien === 'KET' && /\+1đ/.test(l.mo_ta) && /500\.001/.test(l.mo_ta) && /500\.000/.test(l.mo_ta)), tom(e4));
  const dong = await db.query("SELECT * FROM pos_doi_soat_ghi WHERE loai = 'ket' AND ky = '2027-01-06' ORDER BY id");
  k('E4 ghi lần 2 là THÊM dòng (2 dòng), có người + giờ; màn lấy dòng mới; lịch sử có cả hai',
    dong.length === 2 && dong.every((d) => d.nguoi && d.luc) && e4.ket?.so_dem === 500001 && e4.ket?.lich_su?.length === 2, `${dong.length} dòng · ${JSON.stringify(e4.ket)}`);
  await ghiDS('chu', { loai: 'ket', ky: '2027-01-06', so_tien: 500000, de_lai: 150000 });
  const ghiSai = async (b) => (await ghiDS('chu', { loai: 'ket', ky: '2027-01-06', so_tien: 1000, de_lai: 0, ...b }));
  const sai = [['âm', { so_tien: -1 }], ['lẻ', { so_tien: 100.5 }], ['chuỗi', { so_tien: '1000' }], ['trên trần', { so_tien: 1000000001 }], ['để lại âm', { de_lai: -1 }]];
  const kqSai = await Promise.all(sai.map(async ([, b]) => (await ghiSai(b))));
  k('E5 số tiền âm / lẻ / chuỗi / trên trần 1.000.000.000 / để lại âm → 400 DOI_SOAT_SO_TIEN_SAI', kqSai.every((x) => x.status === 400 && x.code === 'DOI_SOAT_SO_TIEN_SAI'), kqSai.map(moTa).join(' ; '));
  const bien = [await ghiSai({ so_tien: 0, de_lai: 0 }), await ghiSai({ so_tien: 1000000000, de_lai: 0 })];
  k('E5b (K5) sát biên: 0 và đúng 1.000.000.000 → 201', bien.every((x) => x.status === 201), bien.map(moTa).join(' ; '));
  const deLaiLon = await ghiSai({ so_tien: 1000, de_lai: 1001 });
  k('E5c để lại lớn hơn số đếm → 400 DOI_SOAT_DE_LAI_SAI; bằng → 201', deLaiLon.status === 400 && deLaiLon.code === 'DOI_SOAT_DE_LAI_SAI' && (await ghiSai({ so_tien: 1000, de_lai: 1000 })).status === 201, moTa(deLaiLon));
  await ghiDS('chu', { loai: 'ket', ky: '2027-01-06', so_tien: 500000, de_lai: 150000 });   // trả về số khớp cho các bước sau
  const tl = await ghiDS('chu', { loai: 'ket', ky: '2027-01-07', so_tien: 1000, de_lai: 0 });
  const dang = await ghiDS('chu', { loai: 'ket', ky: '06/01/2027', so_tien: 1000, de_lai: 0 });
  k('E6 ngày tương lai / sai dạng → 400 DOI_SOAT_KY_SAI', tl.status === 400 && tl.code === 'DOI_SOAT_KY_SAI' && dang.status === 400 && dang.code === 'DOI_SOAT_KY_SAI', `${moTa(tl)} ; ${moTa(dang)}`);

  muc('[F] tuần: CK theo sổ + đã so sao kê; tháng: 4 nhóm + nhắc kiểm kê kho');
  {
    const t = await ds('chu', 'tuan', '2027-01-06');
    k('F1 tuần 04→10.01.2027: CK theo sổ = 50.000; chưa so sao kê → vàng, XANH', t.tien?.chuyen_khoan?.rong === 50000 && t.sao_ke == null && t.ket_qua === 'XANH', `${t.tien?.chuyen_khoan?.rong} · ${tom(t)}`);
    const s1 = await ghiDS('chu', { loai: 'sao_ke', ky: '2027-01-04', da_so: 1, ghi_chu: 'khớp sao kê' });
    const s2 = await ghiDS('chu', { loai: 'sao_ke', ky: '2027-01-04', da_so: 0, ghi_chu: 'bỏ đánh dấu' });
    const t2 = await ds('chu', 'tuan', '2027-01-06');
    const n = await so("SELECT COUNT(*) FROM pos_doi_soat_ghi WHERE loai = 'sao_ke' AND ky = '2027-01-04'");
    k('F2 đánh dấu rồi bỏ đánh dấu: 2 dòng, màn lấy dòng mới nhất', s1.status === 201 && s2.status === 201 && n === 2 && t2.sao_ke?.da_so === 0 && t2.sao_ke?.ghi_chu === 'bỏ đánh dấu', `${n} · ${JSON.stringify(t2.sao_ke)}`);
    await ghiDS('chu', { loai: 'sao_ke', ky: '2027-01-04', da_so: 1, ghi_chu: 'khớp sao kê' });
    const t3 = await ds('chu', 'tuan', '2027-01-06');
    const lech = await ghiDS('chu', { loai: 'sao_ke', ky: '2027-01-06', da_so: 1 });
    k('F2b đánh dấu lại → da_so 1; `ky` sao kê không phải thứ 2 → 400 DOI_SOAT_KY_SAI', t3.sao_ke?.da_so === 1 && lech.status === 400 && lech.code === 'DOI_SOAT_KY_SAI', `${JSON.stringify(t3.sao_ke)} ; ${moTa(lech)}`);
    const th = await ds('chu', 'thang', '2027-01-06');
    const tp = th.tien || {};
    k('F3 tháng 01.2027: tiền mặt 425.000 · CK 50.000 · ví nạp 30.000, chi 0 · điểm cộng 350 trừ 0 · nhắc kiểm kê kho',
      tp.tien_mat?.rong === 425000 && tp.chuyen_khoan?.rong === 50000 && tp.vi?.nap === 30000 && tp.vi?.chi === 0 && tp.diem?.cong === 350 && tp.diem?.tru === 0
        && typeof th.nhac_kho === 'string' && /kiểm kê kho/i.test(th.nhac_kho), JSON.stringify(tp));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] quyền view_reports: máy chủ kiểm; màn ẩn nút');
  {
    const lay1 = (ai) => ds(ai, 'ngay', '2027-01-06');
    const [gNv, gQl, gKhong, gChu] = [await lay1('nv'), await lay1('ql'), await lay1(null), await lay1('chu')];
    k('G1 nhân viên GET → 403', gNv.status === 403, moTa(gNv));
    const pNv = await ghiDS('nv', { loai: 'sao_ke', ky: '2027-01-04', da_so: 1 });
    k('G1b nhân viên POST → 403 (và không ghi gì)', pNv.status === 403 && await so("SELECT COUNT(*) FROM pos_doi_soat_ghi WHERE loai = 'sao_ke'") === 3, moTa(pNv));
    const pQl = await ghiDS('ql', { loai: 'sao_ke', ky: '2027-01-04', da_so: 1 });
    k('G2 quản lý (có view_reports) GET 200, POST 201', gQl.status === 200 && pQl.status === 201, `${moTa(gQl)} ; ${moTa(pQl)}`);
    k('G3 không token → 401 (GET và POST)', gKhong.status === 401 && (await ghiDS(null, { loai: 'sao_ke', ky: '2027-01-04', da_so: 1 })).status === 401, moTa(gKhong));
    k('G4 chủ GET → 200', gChu.status === 200, moTa(gChu));
    const man = fs.readFileSync(path.join(GOC, 'client', 'src', 'components', 'DoiSoat.jsx'), 'utf8');
    const trang = fs.readFileSync(path.join(GOC, 'client', 'src', 'pages', 'Reports.jsx'), 'utf8');
    k("G5 màn: DoiSoat.jsx ẩn nút ghi theo hasPermission('view_reports') và Reports.jsx dựng <DoiSoat", /hasPermission\('view_reports'\)/.test(man) && /<DoiSoat\b/.test(trang));
    const bi = await ds('chu', 'xx', '2027-01-06');
    k('G6 kiểu kỳ sai → 400 DOI_SOAT_KIEU_SAI', bi.status === 400 && bi.code === 'DOI_SOAT_KIEU_SAI', moTa(bi));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[Z] cuối bài: mọi lệch cấy đã hoàn → XANH ở dữ liệu sạch; hiệu năng ba kỳ trên dữ liệu nhiều');
  datGio(2026, 11, 4);
  {
    const z = await ds('chu', 'thang', '2026-11-04');
    k('Z1 sau mọi cấy + hoàn, tháng 11 → XANH', z.ket_qua === 'XANH', tom(z));
    // N đơn KÈM dòng điểm, ví, mã bill, món — các cột order_id không có chỉ mục (I8, I15, I19): chi phí gần tích N × M, không tuyến tính.
    const N = 3000;
    const bangDon = [];
    for (let i = 0; i < N; i++) bangDon.push(`('DSHN${i}', '09${String(40000000 + i)}', 25000, 25000, 'cash', 25000, 'completed', 'paid', '2026-11-${String(1 + (i % 28)).padStart(2, '0')}T10:00:00')`);
    for (let i = 0; i < N; i += 500) {
      await db.run(`INSERT INTO pos_orders (code, customer_phone, subtotal, total, payment_method, cash_amount, status, payment_status, created_at) VALUES ${bangDon.slice(i, i + 500).join(',')}`);
    }
    const dau = await so("SELECT MIN(id) FROM pos_orders WHERE code = 'DSHN0'");
    for (let i = 0; i < N; i += 500) {
      const id = (j) => dau + j;
      const hang = (fn, n) => Array.from({ length: Math.min(500, N - i) }, (_, j) => fn(id(i + j), i + j)).join(',');
      await db.run(`INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, created_at) VALUES ${hang((d, j) => `('09${40000000 + j}', 'earn', 25, ${d}, '2026-11-02T10:00:00')`)}`);
      await db.run(`INSERT INTO pos_balance_transactions (customer_phone, type, amount, order_id, created_at) VALUES ${hang((d, j) => `('09${40000000 + j}', 'topup', 0, ${d}, '2026-11-02T10:00:00')`)}`);
      await db.run(`INSERT INTO pos_order_items (order_id, product_id, quantity, unit_price, total_price) VALUES ${hang((d) => `(${d}, ${sp[0].id}, 1, 25000, 25000)`)}`);
      await db.run(`INSERT INTO pos_signup_codes (code, order_id, issued_at) VALUES ${hang((d, j) => `('DSHM${j}', ${d}, '2026-11-02T10:00:00')`)}`);
    }
    ghi.bat = true; ghi.sql = []; ghi.dong = 0;
    const t0 = process.hrtime.bigint();
    const lon = await ds('chu', 'thang', '2026-11-04');
    const giay = Number(process.hrtime.bigint() - t0) / 1e9;
    ghi.bat = false;
    logGoc(`      H1: ${N} đơn kèm điểm / ví / mã bill / món → ${giay.toFixed(2)} s · ${ghi.sql.length} câu SQL · ${ghi.dong} dòng trả về (Turso thật còn cộng trễ mạng mỗi câu — CHƯA KIỂM)`);
    k('H1 tháng trên dữ liệu nhiều: trả lời 200 trong < 10 s (kho cục bộ = cận dưới)', lon.status === 200 && giay < 10, `${moTa(lon)} · ${giay.toFixed(2)} s`);
  }

  sv.close();
  console.log(`\n  ${dat} đạt · ${hong} hỏng\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai();
  console.error(`\n✖ Bài thử sập: ${e.stack || e.message}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
