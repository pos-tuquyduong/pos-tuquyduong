#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ DOISOAT-NHANH — Đối soát trên máy chủ thật treo ở cùng một bước: đo từng bước, hạn giờ mỗi câu + cả lượt, dừng khi khách bỏ
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ ở A1, A2, B1, B2, B3, B4, C1.   Chạy ở GỐC kho POS:   node cong_cu/thu_DOISOATNHANH.js
 *
 *  Khuôn thu_GIAO3.js: database.js + libsql thật trên kho TẠM (chỉ thay ketNoiKho — P8). Câu kho "không bao giờ trả lời" dựng bằng cách bọc
 *  execute của client libsql (giữ nguyên query / doCau / đọc lại của database.js). Hạn giờ của bài rút ÷50 qua đối tượng HAN mà doiSoat.js xuất
 *  (ca H khoá giá trị THẬT trước khi rút). Kho thật qua HTTP (libsql remote → Turso) KHÔNG dựng được ở đây — xem CHƯA KIỂM trong trang_thai.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_dsn_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
process.env.JWT_SECRET = 'thu_dsn_nv_' + crypto.randomBytes(12).toString('hex');

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
const ra = (s) => process.stdout.write(s + '\n');
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; ra(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; ra(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => ra(`\n${C.dam}${t}${C.het}`);
const nhatKy = [];
console.log = console.error = console.warn = console.info = (...a) => nhatKy.push(a.map(String).join(' '));
const J = (x) => String(JSON.stringify(x) ?? 'undefined');
const ngu = (ms) => new Promise((ok) => setTimeout(ok, ms));
const NGAY = '2026-11-18';
const RUT = 50;   // hạn giờ của bài = hạn thật ÷ RUT
const HAN_NGOAI_MS = 20000 / RUT;   // C1: "treo" = quá hạn ngoài của bài (20 s thật ÷ RUT)
// Bọc lời hứa bằng hạn ngoài của bài: hết hạn → { treo: true } (bản chưa vá treo mãi ở đây).
const coHanNgoai = (p, ms = HAN_NGOAI_MS * 3) => Promise.race([p.then((kq) => ({ kq }), (loi) => ({ loi })), ngu(ms).then(() => ({ treo: true }))]);

async function main() {
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  await db.initDatabase();
  const ds = require(path.join(GOC, 'server', 'utils', 'doiSoat.js'));

  // ─── Kho giả: bọc execute. luat(sql, lanGui) → 'treo' | số ms chậm | undefined. Đếm lần gửi theo mẫu; thứ tự câu (lần gửi đầu của mỗi lời gọi). ───
  const kho = db.getDb();
  const exGoc = kho.execute.bind(kho);
  const G = { luat: () => undefined, gui: [], daThay: new WeakSet() };
  kho.execute = (cau) => {
    const sql = String(cau.sql || cau);
    const moi = !G.daThay.has(cau);
    if (moi) G.daThay.add(cau);
    G.gui.push({ sql, moi });
    const lan = G.gui.filter((x) => x.sql === sql).length;
    const l = G.luat(sql, lan);
    if (l === 'treo') return new Promise(() => {});
    if (typeof l === 'number') return ngu(l).then(() => exGoc(cau));
    return exGoc(cau);
  };
  const datLai = (luat = () => undefined) => { G.luat = luat; G.gui = []; nhatKy.length = 0; };
  const soGui = (mau) => G.gui.filter((x) => mau.test(x.sql)).length;
  const LA_DIEM = /NOT IN \('earn', 'redeem'\)/;   // câu "loại dòng điểm lạ" của I8 — câu #13 kho rỗng (phiếu)

  // ─── Dữ liệu CŨ có dòng lệch (C1 khả năng 2): đơn trước AP_DUNG_TU, I3 lệch (pending, nợ 0), I8 lệch (điểm 5, đúng luật 0) → phanLoai gọi tra ───
  await db.run(`INSERT INTO pos_orders (code, customer_phone, total, payment_method, payment_status, status, debt_amount, created_at)
    VALUES ('DSNCU1', '0911000001', 50000, 'cash', 'pending', 'completed', 0, '2026-09-01T09:00:00'),
           ('DSNCU2', '0911000002', 80000, 'cash', 'paid', 'completed', 0, '2026-11-18T10:00:00')`);
  const idCu = (await db.queryOne("SELECT id FROM pos_orders WHERE code = 'DSNCU1'")).id;
  await db.run(`INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, created_at) VALUES ('0911000001', 'earn', 5, ?, '2026-09-01T09:00:00')`, [idCu]);

  // ─── H: hằng số THẬT (so bằng) rồi rút ÷RUT cho bài ───
  muc('[H] Hằng số hạn giờ');
  const HAN = ds.HAN || {};
  const manSrc = fs.readFileSync(path.join(GOC, 'client', 'src', 'components', 'DoiSoat.jsx'), 'utf8');
  const hanMan = Number((/const HAN_DOI_SOAT_MS = (\d+);/.exec(manSrc) || [])[1]);
  k('B1 HAN.CAU_DOI_SOAT_MS = 15000 (một lần gửi câu)', HAN.CAU_DOI_SOAT_MS === 15000, J(HAN));
  k('B2 HAN.LUOT_DOI_SOAT_MS = 50000 và nhỏ hơn hạn chờ của màn HAN_DOI_SOAT_MS (DoiSoat.jsx) = 60000; cận trên lượt (hạn + chờ đọc lại cuối) < hạn màn',
    HAN.LUOT_DOI_SOAT_MS === 50000 && hanMan === 60000 && HAN.LUOT_DOI_SOAT_MS + db.CHO_DOC_MS[db.CHO_DOC_MS.length - 1] < hanMan, `${J(HAN)} · màn ${hanMan}`);
  const CAU = 15000 / RUT, LUOT = 50000 / RUT;
  if (ds.HAN) { ds.HAN.CAU_DOI_SOAT_MS = CAU; ds.HAN.LUOT_DOI_SOAT_MS = LUOT; }

  // ─── A1: log từng bước ───
  muc('[A1] Log lúc bắt đầu + mỗi bước (chỉ tên bước + số)');
  const TEN_BB = Object.keys(ds.BAT_BIEN).filter((t) => t !== 'I7');
  const BUOC = {
    ngay: [...TEN_BB, 'D1', 'DEN', 'CK', 'XNT', 'D2', 'tongHop', 'soHoaDonNgay', 'soKet'],
    tuan: [...TEN_BB, 'D1', 'DEN', 'CK', 'XNT', 'D2', 'tongHop', 'sao_ke'],
    thang: [...TEN_BB, 'D1', 'DEN', 'CK', 'XNT', 'D2', 'tongHop'],
  };
  const MAU_BUOC = /^\[DOISOAT\] buoc ([A-Za-z0-9_]+) · (\d+) ms · (\d+) câu$/;
  const MAU_CUOI = /^\[DOISOAT\] (ngay|tuan|thang) (\d{4}-\d\d-\d\d) · (\d+)ms · (\d+) câu$/;
  for (const kieu of ['ngay', 'tuan', 'thang']) {
    datLai();
    const r = await coHanNgoai(ds.chayDoiSoat({ kieu, ngay: NGAY }));
    const dong = nhatKy.filter((l) => l.startsWith('[DOISOAT]'));
    const buoc = dong.filter((l) => MAU_BUOC.test(l)).map((l) => MAU_BUOC.exec(l));
    const cuoi = dong.map((l) => MAU_CUOI.exec(l)).find(Boolean);
    const tongCau = buoc.reduce((s, m) => s + Number(m[3]), 0);
    const ky = ds.tinhKy(kieu, NGAY);
    k(`A1 ${kieu}: dòng đầu "[DOISOAT] bat_dau ${kieu} ${ky.tu}"`, dong[0] === `[DOISOAT] bat_dau ${kieu} ${ky.tu}`, J(dong.slice(0, 2)));
    k(`A1 ${kieu}: mỗi bước đúng một dòng "buoc <ten> · <ms> ms · <n> câu", đúng thứ tự`, J(buoc.map((m) => m[1])) === J(BUOC[kieu]), J(buoc.map((m) => m[1])));
    k(`A1 ${kieu}: dòng cuối giữ dạng cũ (D4 GIAO-3); tổng câu các bước = số câu dòng cuối = số câu gửi kho`, !!cuoi && !!r.kq && tongCau === Number(cuoi[4])
      && tongCau === G.gui.filter((x) => x.moi).length && dong[dong.length - 1] === cuoi[0], `bước ${tongCau} · cuối ${cuoi && cuoi[4]} · kho ${G.gui.filter((x) => x.moi).length}`);
    k(`A1 ${kieu}: mọi dòng [DOISOAT] chỉ có tên bước + số (không SĐT / mã đơn / số tiền / SQL)`, dong.length > 2 && dong.every((l) => l === dong[0] || MAU_BUOC.test(l) || MAU_CUOI.test(l))
      && !dong.some((l) => /0911|DSNCU|SELECT|50\.000/.test(l)), J(dong.filter((l) => !MAU_BUOC.test(l)).slice(0, 4)));
  }
  datLai();
  const [p1, p2] = await Promise.all([ds.chayDoiSoat({ kieu: 'ngay', ngay: NGAY }), ds.chayDoiSoat({ kieu: 'ngay', ngay: NGAY })]);
  const cuoi2 = nhatKy.map((l) => MAU_CUOI.exec(l)).filter(Boolean).map((m) => Number(m[4]));
  const mot = G.gui.filter((x) => x.moi).length / 2;
  k('A1 hai người cùng bấm (hai lượt chồng nhau): mỗi dòng cuối đếm ĐÚNG số câu của lượt mình (không cộng lẫn lượt kia)',
    !!p1 && !!p2 && cuoi2.length === 2 && cuoi2.every((n) => n === mot), `${J(cuoi2)} · mỗi lượt ${mot}`);

  // ─── C1 / B1: một câu không bao giờ trả lời ───
  muc('[C1/B1] Một câu kho không bao giờ trả lời');
  datLai((sql) => (LA_DIEM.test(sql) ? 'treo' : undefined));
  let t = Date.now();
  let r = await coHanNgoai(ds.chayDoiSoat({ kieu: 'ngay', ngay: NGAY }));
  let ms = Date.now() - t;
  const thuTu = G.gui.filter((x) => x.moi).findIndex((x) => LA_DIEM.test(x.sql)) + 1;
  k('C1 (1) câu "loại dòng điểm lạ" (I8) không trả lời → lượt KHÔNG treo quá hạn ngoài của bài (20 s ÷50)', !r.treo, r.treo ? 'TREO' : `${ms} ms`);
  k('B1 → lỗi 503 DOI_SOAT_QUA_HAN "Đối soát quá lâu ở bước I8 — thử lại sau"', !!r.loi && r.loi.status === 503 && r.loi.code === 'DOI_SOAT_QUA_HAN'
    && r.loi.message === 'Đối soát quá lâu ở bước I8 — thử lại sau', r.loi ? `${r.loi.status} ${r.loi.code} ${r.loi.message}` : J(r.treo || 'không lỗi'));
  k(`B1 đọc lại đúng luật KET-NOI-1: câu treo gửi đúng 1 + ${db.CHO_DOC_MS.length} lần, chờ đủ mỗi lần (≥ 3 × hạn câu)`, soGui(LA_DIEM) === 1 + db.CHO_DOC_MS.length && ms >= 3 * CAU, `${soGui(LA_DIEM)} lần · ${ms} ms`);
  k(`B1 log "[DOISOAT] qua_han buoc I8 cau ${thuTu}" (thứ tự câu trong lượt)`, nhatKy.includes(`[DOISOAT] qua_han buoc I8 cau ${thuTu}`), J(nhatKy.filter((l) => /qua_han|KET-NOI/.test(l))));
  k('B1 dừng ở bước treo: không gửi câu của bước sau (I9)', !G.gui.some((x) => /FROM pos_order_log$/.test(x.sql.trim())), J(G.gui.length));
  datLai((sql, lan) => (LA_DIEM.test(sql) && lan === 1 ? 'treo' : undefined));
  r = await coHanNgoai(ds.chayDoiSoat({ kieu: 'ngay', ngay: NGAY }));
  k('B1 câu treo LẦN ĐẦU rồi đọc lại được → kết quả đủ, không lỗi, có dòng [KET-NOI] thử lại', !!r.kq && Array.isArray(r.kq.bat_bien) && soGui(LA_DIEM) === 2
    && nhatKy.some((l) => /^\[KET-NOI\] doc lan 1\/3 \S+ — thu lai$/.test(l)), r.kq ? J(nhatKy.filter((l) => /KET-NOI/.test(l))) : J(r.loi?.message || 'treo'));
  datLai((sql) => (/FROM pos_order_log$/.test(sql.trim()) ? 'treo' : undefined));
  r = await coHanNgoai(ds.chayDoiSoat({ kieu: 'ngay', ngay: NGAY }));
  k('B1 câu treo ở bước khác (I9) → lời nêu đúng bước I9', r.loi?.code === 'DOI_SOAT_QUA_HAN' && r.loi.message === 'Đối soát quá lâu ở bước I9 — thử lại sau', r.loi?.message || 'treo');
  datLai();
  r = await coHanNgoai(ds.chayDoiSoat({ kieu: 'thang', ngay: '2026-09-15' }));
  const nhom = (n) => (r.kq?.[n] || []).map((l) => l.bat_bien);
  k('C1 (2) dữ liệu cũ (tháng 9) có dòng lệch I3 / I8 (phanLoai gọi tra) → chạy xong, không treo; I8 trước mốc → LỆCH CŨ, I3 (không mốc) → LỆCH',
    !!r.kq && nhom('cu').includes('I8') && nhom('do').includes('I3'), J(r.kq ? { do: r.kq.do, cu: r.kq.cu } : r));

  // ─── D1: câu chậm dưới hạn vẫn chờ được ───
  muc('[D1] Câu chậm DƯỚI hạn — không báo lỗi oan');
  datLai((sql) => (LA_DIEM.test(sql) ? Math.round(CAU * 0.7) : undefined));
  r = await coHanNgoai(ds.chayDoiSoat({ kieu: 'ngay', ngay: NGAY }));
  k('D1 câu chậm 0,7 × hạn câu (ngay dưới) → kết quả đủ, gửi 1 lần, không DOI_SOAT_QUA_HAN', !!r.kq && soGui(LA_DIEM) === 1 && !nhatKy.some((l) => l.includes('qua_han')),
    r.kq ? J(soGui(LA_DIEM)) : r.loi?.message || 'treo');

  // ─── B2: hạn tổng ───
  muc('[B2] Cả lượt có hạn tổng (mỗi câu chậm dưới hạn câu)');
  datLai(() => Math.round(CAU * 0.8));
  t = Date.now();
  r = await coHanNgoai(ds.chayDoiSoat({ kieu: 'ngay', ngay: NGAY }));
  ms = Date.now() - t;
  const nB2 = G.gui.length;
  await ngu(CAU * 2);
  k('B2 lượt dài hơn hạn tổng → 503 DOI_SOAT_QUA_HAN "Đối soát quá lâu ở bước …" trong khoảng [hạn tổng − 1 câu, hạn tổng + chờ đọc lại cuối]',
    r.loi?.code === 'DOI_SOAT_QUA_HAN' && /^Đối soát quá lâu ở bước \S+ — thử lại sau$/.test(r.loi.message) && ms >= LUOT - CAU && ms <= LUOT + db.CHO_DOC_MS[1] / RUT + 150,
    `${r.loi ? r.loi.message : r.treo ? 'treo' : 'xong không lỗi'} · ${ms} ms (hạn ${LUOT})`);
  k('B2 sau khi báo lỗi lượt không gửi thêm câu nào', G.gui.length === nB2, `${nB2} → ${G.gui.length}`);

  // ─── D2: đường khác không có hạn giờ mới ───
  muc('[D2] query / run ngoài Đối soát không có hạn giờ');
  datLai((sql) => (/thu_dsn_d2/.test(sql) ? CAU * 2 : undefined));
  const d2 = await coHanNgoai(db.query("SELECT 'thu_dsn_d2' AS x"));
  k('D2 query thường chậm 2 × hạn câu Đối soát → vẫn trả kết quả (không hạn giờ, không đọc lại)', d2.kq?.[0]?.x === 'thu_dsn_d2' && soGui(/thu_dsn_d2/) === 1, J(d2));
  const d2r = await coHanNgoai(db.run("UPDATE pos_settings SET value = value WHERE key = 'thu_dsn_d2'"));
  k('D2 run chậm 2 × hạn câu → vẫn xong', !!d2r.kq && soGui(/thu_dsn_d2/) === 2, J(d2r));

  // ─── HTTP: route thật + doYeuCau ───
  const app = express();
  app.use(express.json());
  app.use('/api', db.doYeuCau);
  let soYc = 0;
  app.use('/api/pos/reports/doi-soat', (req, res, next) => { soYc++; next(); });
  app.use('/api/pos/reports', require(path.join(GOC, 'server', 'routes', 'reports.js')));
  app.get('/api/thu/treo', async (req, res) => { try { await db.query("SELECT 'thu_dsn_a2' AS x"); res.json({}); } catch { res.status(500).json({}); } });
  app.get('/api/thu/loi', async (req, res) => { try { await db.query('SELECT thu_dsn_cot_khong_co FROM pos_orders'); } catch { /* lỗi câu */ } await ngu(2150); res.json({}); });
  const sv = await new Promise((ok) => { const s = app.listen(0, '127.0.0.1', () => ok(s)); });
  const cong = sv.address().port;
  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tk = jwt.sign({ userId: chu.id }, process.env.JWT_SECRET);
  const goiBo = (duong, boSauMs) => new Promise((xong) => {
    const yc = http.request({ host: '127.0.0.1', port: cong, path: duong, method: 'GET', headers: { Authorization: 'Bearer ' + tk } });
    yc.on('error', () => xong()); yc.end(); setTimeout(() => { yc.destroy(); xong(); }, boSauMs);
  });

  muc('[A2] Dòng [CHAM] thêm "· đang chờ <k> câu"');
  datLai((sql) => (/thu_dsn_a2/.test(sql) ? 'treo' : undefined));
  await goiBo('/api/thu/treo', 2200);
  await ngu(150);
  const MAU_CHAM = /^\[CHAM\] GET (\S+) · (\d+) ms · kho (\d+) câu \/ (\d+) ms · ngoài (\d+) ms · đang chờ (\d+) câu$/;
  let cham = nhatKy.filter((l) => l.startsWith('[CHAM]'));
  let m = MAU_CHAM.exec(cham[0] || '');
  k('A2 câu kho không trả lời, khách bỏ ở 2,2 s → MỘT dòng [CHAM] "… kho 0 câu / 0 ms · ngoài 0 ms · đang chờ 1 câu"', cham.length === 1 && !!m && m[3] === '0' && m[6] === '1', J(cham));
  datLai();
  await new Promise((xong) => http.get({ host: '127.0.0.1', port: cong, path: '/api/thu/loi' }, (res) => { res.resume(); res.on('end', xong); }).on('error', xong));
  await ngu(50);
  cham = nhatKy.filter((l) => l.startsWith('[CHAM]'));
  m = MAU_CHAM.exec(cham[0] || '');
  k('A2 câu kho ném lỗi rồi yêu cầu chậm 2,15 s → "kho 1 câu … · đang chờ 0 câu" (đếm đúng cả khi câu ném lỗi)', cham.length === 1 && !!m && m[3] === '1' && m[6] === '0', J(cham));

  muc('[B3] Khách bỏ giữa chừng → lượt dừng ở bước kế tiếp');
  datLai(() => 30);
  await goiBo(`/api/pos/reports/doi-soat?kieu=ngay&ngay=${NGAY}`, 400);
  const nBo = G.gui.length;
  await ngu(1500);
  const dong = nhatKy.filter((l) => l.startsWith('[DOISOAT]'));
  const iBo = dong.findIndex((l) => /^\[DOISOAT\] bo_giua [A-Za-z0-9_]+$/.test(l));
  k('B3 log "[DOISOAT] bo_giua <bước>", sau đó không bước nào chạy, không dòng xong cả lượt', iBo > 0 && dong.slice(iBo + 1).length === 0 && !dong.some((l) => MAU_CUOI.test(l)), J(dong.slice(-3)));
  k('B3 sau khi khách bỏ, lượt gửi thêm tối đa các câu của bước đang chạy (không chạy tiếp tới hết)', G.gui.length - nBo <= 8 && G.gui.length < 40, `${nBo} → ${G.gui.length}`);

  muc('[B4] Màn Đối soát: 503 DOI_SOAT_QUA_HAN → lời máy chủ, bấm lại được');
  const esbuild = require(path.join(GOC, 'client', 'node_modules', 'esbuild'));
  const goi = await esbuild.build({ entryPoints: [path.join(GOC, 'client', 'src', 'utils', 'api.js')], bundle: true, write: false, format: 'cjs', platform: 'node',
    logLevel: 'silent', define: { 'import.meta.env': '{}' } });
  const fetchGoc = globalThis.fetch;
  globalThis.fetch = (u, o) => fetchGoc(typeof u === 'string' && u.startsWith('/') ? `http://127.0.0.1:${cong}${u}` : u, o);
  globalThis.window = { location: { pathname: '/', href: '' }, addEventListener() {}, removeEventListener() {} };
  globalThis.localStorage = { getItem: (key) => (key === 'pos_token' ? tk : null), setItem() {}, removeItem() {} };
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', goi.outputFiles[0].text)(mod, mod.exports, require);
  datLai((sql) => (LA_DIEM.test(sql) ? 'treo' : undefined));
  soYc = 0;
  const b4 = await coHanNgoai(mod.exports.api.get(`/reports/doi-soat?kieu=ngay&ngay=${NGAY}`, { han: hanMan }));
  k('B4 api.js thật: 503 → lỗi mang lời máy chủ "Đối soát quá lâu ở bước I8 — thử lại sau", code DOI_SOAT_QUA_HAN, gửi đúng 1 lần (không tự gửi lại)',
    b4.loi?.message === 'Đối soát quá lâu ở bước I8 — thử lại sau' && b4.loi.code === 'DOI_SOAT_QUA_HAN' && b4.loi.status === 503 && soYc === 1,
    b4.treo ? 'TREO (máy chủ không trả lời)' : `${b4.loi?.status} ${b4.loi?.code} ${b4.loi?.message} · ${soYc} yêu cầu`);
  k('B4 DoiSoat.jsx: lỗi không phải QUA_HAN hiện e.message; finally trả nút về "Đối soát" (bấm lại được)',
    /setLoi\(e\.code === 'QUA_HAN' \? '[^']+' : e\.message \|\| '[^']+'\);\s*\} finally \{\s*setDangChay\(false\);/.test(manSrc), 'mẫu catch / finally của chay()');
  globalThis.fetch = fetchGoc;
  sv.close();

  ra(`\n${C.dam}DOISOAT-NHANH: ${dat} đạt · ${hong} hỏng${C.het}`);
  process.exit(hong ? 1 : 0);
}
main().catch((e) => { ra(`${C.do}✗ bài thử sập: ${e.stack}${C.het}`); process.exit(2); });
