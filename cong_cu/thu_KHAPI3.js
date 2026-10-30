#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KH-API-3 — menu không bắt buộc token · đăng ký 3 bước (xưng hô, địa chỉ) · hồ sơ · tự gia hạn đăng nhập
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (menu bắt token, chưa có xưng hô, chưa có /gia-han). Xanh ngay từ đầu = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_KHAPI3.js
 *
 *  Khuôn thu_KH1.js: database.js thật + libsql thật trên file kho TẠM; chỉ thay ketNoiKho (P8), SX tắt. TZ=UTC đặt ở dòng đầu (Render chạy
 *  UTC) — giờ trả ra phải là giờ VN. App thử đặt `trust proxy 1` như server/index.js; IP đổi bằng X-Forwarded-For. Thời gian trôi của mã =
 *  lùi CẢ tao_luc lẫn het_han cùng một khoảng (strftime trên chính cột). Cửa sổ bộ đếm trong bộ nhớ thử bằng gọi thẳng giuLuotBoNho(…, luc).
 *  Mã lấy qua quầy (/api/pos/kh/cap-ma — không giới hạn lượt) trừ ca cần mã App. So HTTP status + `code`, không dò lời báo (E12).
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khapi3_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_khapi3_nv_' + Date.now();
const KHOA_KH = 'thu_khapi3_kh_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = KHOA_KH;
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_khapi3';
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
const XUNG_HO = ['anh', 'chi', 'co', 'chu', 'bac', 'em', 'ban'];

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();
  // Móc giao dịch (gắn TRƯỚC khi nạp route — maKhach.js lấy beginTransaction lúc nạp): hongTaoKhach → INSERT pos_customers trong giao dịch ném lỗi.
  let hongTaoKhach = false;
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const tx = await txGoc(...a);
    if (!hongTaoKhach) return tx;
    const run = tx.run.bind(tx);
    tx.run = async (sql, p) => { if (/INSERT INTO pos_customers/.test(sql)) throw new Error('hỏng thử'); return run(sql, p); };
    return tx;
  };
  const maKhach = require(path.join(GOC, 'server', 'utils', 'maKhach.js'));
  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use('/api/pos/kh', require(R('kh/quay.js')));
  app.use('/api/pos/signup-codes', require(R('signup-codes.js')));
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const guiMa = require(path.join(GOC, 'server', 'utils', 'guiMaKhach.js'));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES ('thu_ngan_khapi3', 'x', 'Thu ngân', 'staff', 1)");
  const nv = await db.queryOne("SELECT id FROM pos_users WHERE username = 'thu_ngan_khapi3'");
  const tkNv = jwt.sign({ userId: nv.id }, KHOA_NV, { expiresIn: '1h' });
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 40000 WHERE id = ?', [sp.id]);
  await db.run("INSERT INTO pos_membership_tiers (name, card_price, discount_percent, special_discount_percent, sort_order, is_active) VALUES ('Bật', 1000, 10, 5, 1, 1)");
  const hangTat = Number((await db.run("INSERT INTO pos_membership_tiers (name, card_price, discount_percent, special_discount_percent, sort_order, is_active) VALUES ('Tắt', 2000, 20, 5, 2, 0)")).lastInsertRowid);

  let soSdt = 0;
  const sdtMoi = () => '09' + String(30000000 + (++soSdt)).padStart(8, '0');
  // goi(method, url, body, { tk, auth, ip }) — auth: tiêu đề Authorization thô; ip: X-Forwarded-For.
  const goi = async (method, url, body, o = {}) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (o.auth !== undefined) headers.Authorization = o.auth; else if (o.tk) headers.Authorization = 'Bearer ' + o.tk;
    if (o.ip) headers['X-Forwarded-For'] = o.ip;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      return { status: r.status, j };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const capMa = async (sdt) => String((await goi('POST', '/pos/kh/cap-ma', { sdt }, { tk: tkNv })).j.ma);
  const xinMaApp = async (sdt) => { await goi('POST', '/kh/dang-nhap/xin-ma', { sdt }); return guiMa.layMaGiaCuoi()?.ma; };
  const xacMinh = (than) => goi('POST', '/kh/dang-nhap/xac-minh', than);
  const dongMa = (sdt) => db.queryOne('SELECT * FROM pos_kh_ma_dang_nhap WHERE sdt = ? ORDER BY id DESC LIMIT 1', [sdt]);
  const khach = (sdt) => db.queryOne('SELECT * FROM pos_customers WHERE phone = ?', [sdt]);
  const luc = async (giay) => (await db.queryOne("SELECT strftime('%Y-%m-%dT%H:%M:%S', ?, ?) AS t", [getNow(), `${giay} seconds`])).t;
  const lui = (id, giay) => db.run(`UPDATE pos_kh_ma_dang_nhap SET tao_luc = strftime('%Y-%m-%dT%H:%M:%S', tao_luc, ?),
    het_han = strftime('%Y-%m-%dT%H:%M:%S', het_han, ?) WHERE id = ?`, [`-${giay} seconds`, `-${giay} seconds`, id]);
  // Khách mới đăng nhập đủ thông tin qua mã quầy → { sdt, tk, r }.
  const dangKy = async (them = {}, sdt = sdtMoi()) => {
    const r = await xacMinh({ sdt, ma: await capMa(sdt), ten: 'Khách Ba', xung_ho: 'chi', ...them });
    return { sdt, tk: r.j.token, r };
  };
  const khachQuay = async () => {
    const sdt = sdtMoi();
    await db.run("INSERT INTO pos_customers (phone, name, address, created_at) VALUES (?, 'Khách Quầy', '12 Phố Cũ', ?)", [sdt, getNow()]);
    const r = await xacMinh({ sdt, ma: await capMa(sdt) });
    return { sdt, tk: r.j.token, r };
  };
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] GET /menu không bắt buộc token');
  await chay('A', async () => {
    const qc = await khachQuay();
    const co = await goi('GET', '/kh/menu', undefined, { tk: qc.tk, ip: '10.0.0.1' });
    const khong = await goi('GET', '/kh/menu', undefined, { ip: '10.0.0.1' });
    k('A2 token hợp lệ → 200 có món', la(co, 200) && (co.j.data || []).length > 0, moTa(co));
    k('A1 không token → 200, data GIỐNG HỆT lượt có token (cùng trường, cùng gia_hang)', la(khong, 200) && (khong.j.data || []).length > 0
      && bang(khong.j.data, co.j.data) && khong.j.data.every((m) => Array.isArray(m.gia_hang)), moTa(khong));
    k('A5 không token: gia_hang KHÔNG có hạng đã tắt', la(khong, 200) && khong.j.data.every((m) => m.gia_hang.every((g) => g.hang_id !== hangTat)));
    const het = jwt.sign({ loai: 'kh', id: 1, exp: Math.floor(Date.now() / 1000) - 10 }, KHOA_KH);
    for (const [nhan, auth] of [['token sai', 'Bearer abc.def.ghi'], ['token hết hạn', 'Bearer ' + het], ['Bearer null', 'Bearer null'], ['Basic x', 'Basic x'], ['tiêu đề Authorization rỗng', '']]) {
      const r = await goi('GET', '/kh/menu', undefined, { auth, ip: '10.0.0.2' });
      k(`A3 ${nhan} → 401 KH_TOKEN_SAI`, la(r, 401, 'KH_TOKEN_SAI'), moTa(r));
    }
    let r = null;
    for (let i = 1; i <= 300; i++) { r = await goi('GET', '/kh/menu', undefined, { ip: '10.0.0.9' }); if (r.status !== 200) break; }
    k('A4 cùng IP 300 lượt không token → lượt 300 vẫn 200', la(r, 200), moTa(r));
    r = await goi('GET', '/kh/menu', undefined, { ip: '10.0.0.9' });
    k('A4 lượt 301 → 429 QUA_NHIEU_LAN', la(r, 429, 'QUA_NHIEU_LAN'), moTa(r));
    r = await goi('GET', '/kh/menu', undefined, { ip: '10.0.0.10' });
    k('A4 IP khác cùng lúc → 200', la(r, 200), moTa(r));
    r = await goi('GET', '/kh/menu', undefined, { tk: qc.tk, ip: '10.0.0.9' });
    k('A4 có token, IP đã hết lượt không token → 200 (có token không bị đếm)', la(r, 200), moTa(r));
    const g = maKhach.giuLuotBoNho;
    const t0 = 1_000_000;
    const kq = typeof g === 'function' && [g('thu:a', 2, 60000, t0), g('thu:a', 2, 60000, t0 + 1), g('thu:a', 2, 60000, t0 + 59999), g('thu:a', 2, 60000, t0 + 60000)];
    k('A4b giuLuotBoNho: 2 lượt qua, lượt 3 trong cửa sổ (59 999 ms) chặn, đủ 60 000 ms → qua lại', bang(kq, [true, true, false, true]), JSON.stringify(kq));
    // A4d (soát vòng 2): cửa sổ "mỗi PHÚT" khoá qua CHÍNH giuLuotMenu — A4 chỉ dội trong một giây, A4b tự truyền độ dài cửa sổ.
    const t1 = 5_000_000_000;
    const gm = maKhach.giuLuotMenu;
    const m = typeof gm === 'function' && Array.from({ length: 300 }, () => gm('thu-cua-so', t1)).every(Boolean) && [gm('thu-cua-so', t1 + 59999), gm('thu-cua-so', t1 + 60000)];
    k('A4d giuLuotMenu: 300 lượt qua; lượt 301 ở 59 999 ms chặn; đủ 60 000 ms → qua lại', bang(m, [false, true]), JSON.stringify(m));
    // A4c (soát vòng 1): trần cứng BO_DEM_TOI_DA — vài khoá thêm KHÔNG xoá đếm; dội đủ trần khoá khác → xoá sạch (khoá đang chặn được đếm lại).
    const tran = maKhach.GIOI_HAN.BO_DEM_TOI_DA;
    const c = typeof g === 'function' && Number.isInteger(tran) && [g('thu:chan', 1, 60000, t0), g('thu:chan', 1, 60000, t0)];
    if (c) for (let i = 0; i < 10; i++) g('thu:it' + i, 1, 60000, t0);
    const conChan = c && g('thu:chan', 1, 60000, t0);
    if (c) for (let i = 0; i < tran; i++) g('thu:doi' + i, 1, 60000, t0);
    const sauDoi = c && g('thu:chan', 1, 60000, t0);
    k(`A4c bộ đếm: thêm 10 khoá vẫn chặn; dội ${tran} khoá khác (chạm trần) → xoá sạch, khoá cũ qua lại`, tran === 10000 && bang(c, [true, false]) && conChan === false && sauDoi === true,
      JSON.stringify([tran, c, conChan, sauDoi]));
  });

  muc('[B] Đăng ký 3 bước');
  await chay('B', async () => {
    let s = sdtMoi(), ma = await capMa(s);
    let r = await xacMinh({ sdt: s, ma, ten: 'Anh Mới' });
    k('B1 khách mới có tên, thiếu xưng hô → 400 CAN_TEN', la(r, 400, 'CAN_TEN'), moTa(r));
    r = await xacMinh({ sdt: s, ma, xung_ho: 'anh' });
    k('B1 có xưng hô, thiếu tên → 400 CAN_TEN', la(r, 400, 'CAN_TEN'), moTa(r));
    r = await xacMinh({ sdt: s, ma, ten: 'Anh Mới', xung_ho: 'ong' });
    k('B2 xung_ho "ong" → 400 XUNG_HO_SAI', la(r, 400, 'XUNG_HO_SAI'), moTa(r));
    k('B2 XUNG_HO_SAI không tốn lượt thử mã, mã chưa tiêu', Number((await dongMa(s)).so_lan_thu) === 0 && (await dongMa(s)).dung_luc === null);
    r = await xacMinh({ sdt: s, ma, ten: 'Anh Mới', xung_ho: 'anh', dia_chi: 'x'.repeat(301) });
    k('B3 dia_chi 301 ký tự → 400 DIA_CHI_QUA_DAI', la(r, 400, 'DIA_CHI_QUA_DAI'), moTa(r));
    r = await xacMinh({ sdt: s, ma, ten: 'Anh Mới', xung_ho: 'anh', dia_chi: 5 });
    k('B3 dia_chi không phải chuỗi (số) → 400 YEU_CAU_KHONG_HOP_LE', la(r, 400, 'YEU_CAU_KHONG_HOP_LE'), moTa(r));
    r = await xacMinh({ sdt: s, ma, ten: '  Anh Mới  ', xung_ho: 'anh', dia_chi: '  ' + 'đ'.repeat(300) + '  ' });
    const kh = await khach(s);
    k('B3 dia_chi đúng 300 ký tự (sau khi cắt khoảng trắng) → 200', la(r, 200), moTa(r));
    k('B4 CSDL lưu đủ: name, xung_ho, address đã cắt khoảng trắng', !!kh && kh.name === 'Anh Mới' && kh.xung_ho === 'anh' && kh.address === 'đ'.repeat(300),
      kh ? `${kh.name} · ${kh.xung_ho} · ${String(kh.address).length}` : '(không có khách)');
    k('B4 câu trả lời xác minh có xung_ho, dia_chi', !!r.j.khach && r.j.khach.xung_ho === 'anh' && r.j.khach.dia_chi === 'đ'.repeat(300));
    const ok = [];
    for (const x of XUNG_HO) { const d = await dangKy({ xung_ho: x }); ok.push(d.r.status === 200 && (await khach(d.sdt)).xung_ho === x); }
    k('B2 đủ 7 xưng hô anh · chi · co · chu · bac · em · ban → tạo được, lưu đúng', ok.length === 7 && ok.every(Boolean), JSON.stringify(ok));
    const d0 = await dangKy();
    k('B4 không gửi địa chỉ → address NULL', d0.r.status === 200 && (await khach(d0.sdt)).address === null, moTa(d0.r));

    s = sdtMoi(); ma = await capMa(s);
    hongTaoKhach = true;
    r = await xacMinh({ sdt: s, ma, ten: 'Hỏng', xung_ho: 'em' });
    hongTaoKhach = false;
    k('B4b INSERT khách hỏng giữa giao dịch → 500, mã KHÔNG bị tiêu, không có dòng khách', la(r, 500) && (await dongMa(s)).dung_luc === null && !(await khach(s)), moTa(r));

    for (const [nguon, layMa] of [['App', xinMaApp], ['quầy', capMa]]) {
      for (const [giay, mong] of [[590, 200], [610, 400]]) {
        s = sdtMoi(); ma = await layMa(s);
        let d = await dongMa(s);
        await lui(d.id, 240);   // mã đã 4 phút tuổi (còn 1 phút)
        const can = await xacMinh({ sdt: s, ma, ten: 'Chậm' });
        await lui(d.id, giay);
        r = await xacMinh({ sdt: s, ma, ten: 'Chậm', xung_ho: 'bac' });
        k(`B5 mã ${nguon}: CAN_TEN rồi ${giay} giây sau → ${mong === 200 ? '200 (còn trong 10 phút thêm)' : '400 MA_HET_HAN (quá 10 phút)'}`,
          la(can, 400, 'CAN_TEN') && (mong === 200 ? la(r, 200) : la(r, 400, 'MA_HET_HAN')), `${moTa(can)} → ${moTa(r)}`);
      }
    }
    s = sdtMoi(); ma = await capMa(s);
    const d = await dongMa(s);
    await xacMinh({ sdt: s, ma, ten: 'Một Lần' });
    await lui(d.id, 100);
    const h1 = (await dongMa(s)).het_han;
    r = await xacMinh({ sdt: s, ma, ten: 'Một Lần' });
    k('B6 CAN_TEN lần hai → het_han KHÔNG đổi (chỉ thêm 10 phút MỘT lần)', la(r, 400, 'CAN_TEN') && (await dongMa(s)).het_han === h1, `${h1} → ${(await dongMa(s)).het_han}`);
    s = sdtMoi(); ma = await capMa(s);
    const h0 = (await dongMa(s)).het_han;
    r = await xacMinh({ sdt: s, ma: String((Number(ma) + 1) % 1000000).padStart(6, '0'), ten: 'Sai' });
    k('B6 mã SAI → MA_SAI, het_han giữ nguyên', la(r, 400, 'MA_SAI') && (await dongMa(s)).het_han === h0, moTa(r));
    s = sdtMoi(); ma = await capMa(s);
    await xacMinh({ sdt: s, ma, ten: 'Đua' });
    const dua = await Promise.all([1, 2].map(() => xacMinh({ sdt: s, ma, ten: 'Đua', xung_ho: 'em' })));
    const soKhach = Number((await db.queryOne('SELECT COUNT(*) AS n FROM pos_customers WHERE phone = ?', [s])).n);
    k('B7 hai yêu cầu song song cùng mã sau CAN_TEN → đúng MỘT 200, một khách', dua.filter((x) => x.status === 200).length === 1 && soKhach === 1, dua.map(moTa).join(' / '));
    const qc = await khachQuay();
    s = qc.sdt; r = await xacMinh({ sdt: s, ma: await capMa(s), xung_ho: 'ong', dia_chi: 'y'.repeat(400) });
    const kc = await khach(s);
    k('B8 khách CŨ đăng nhập kèm xưng hô lạ + địa chỉ 400 ký tự → 200, CSDL không đổi', la(r, 200) && kc.xung_ho === null && kc.address === '12 Phố Cũ', moTa(r));
  });

  muc('[C] Hồ sơ GET / PUT /toi · bước nâng cấp 003');
  await chay('C', async () => {
    const qc = await khachQuay();
    let r = await goi('GET', '/kh/toi', undefined, { tk: qc.tk });
    k('C1 khách quầy: GET /toi có xung_ho null, dia_chi = address quầy', la(r, 200) && !!r.j.khach && r.j.khach.xung_ho === null && r.j.khach.dia_chi === '12 Phố Cũ', moTa(r));
    const d = await dangKy({ xung_ho: 'co', dia_chi: 'Ngõ 5' });
    r = await goi('GET', '/kh/toi', undefined, { tk: d.tk });
    k('C1 khách App: GET /toi có xung_ho, dia_chi', la(r, 200) && r.j.khach.xung_ho === 'co' && r.j.khach.dia_chi === 'Ngõ 5', moTa(r));
    r = await goi('PUT', '/kh/toi', { dia_chi: ' Số 9 Mới ' }, { tk: d.tk });
    k('C2 PUT dia_chi → 200, CSDL đổi (đã cắt), câu trả lời có trường mới', la(r, 200) && (await khach(d.sdt)).address === 'Số 9 Mới'
      && r.j.khach.dia_chi === 'Số 9 Mới' && r.j.khach.xung_ho === 'co' && r.j.khach.ten === 'Khách Ba', moTa(r));
    r = await goi('PUT', '/kh/toi', { dia_chi: 'z'.repeat(301) }, { tk: d.tk });
    k('C2 PUT dia_chi 301 ký tự → 400 DIA_CHI_QUA_DAI, CSDL không đổi', la(r, 400, 'DIA_CHI_QUA_DAI') && (await khach(d.sdt)).address === 'Số 9 Mới', moTa(r));
    r = await goi('PUT', '/kh/toi', { xung_ho: 'chu' }, { tk: d.tk });
    k('C2 PUT xung_ho → 200, CSDL đổi', la(r, 200) && (await khach(d.sdt)).xung_ho === 'chu', moTa(r));
    for (const x of ['ong', '']) {
      r = await goi('PUT', '/kh/toi', { xung_ho: x }, { tk: d.tk });
      k(`C2 PUT xung_ho "${x}" → 400 XUNG_HO_SAI, CSDL không đổi`, la(r, 400, 'XUNG_HO_SAI') && (await khach(d.sdt)).xung_ho === 'chu', moTa(r));
    }
    r = await goi('PUT', '/kh/toi', { dia_chi: '' }, { tk: d.tk });
    k('C2 PUT dia_chi "" → 200, address NULL (xoá)', la(r, 200) && (await khach(d.sdt)).address === null && r.j.khach.dia_chi === null, moTa(r));
    await goi('PUT', '/kh/toi', { dia_chi: 'Ngõ 7' }, { tk: d.tk });
    r = await goi('PUT', '/kh/toi', { dia_chi: [1] }, { tk: d.tk });
    k('C2 PUT dia_chi không phải chuỗi (mảng) → 400 YEU_CAU_KHONG_HOP_LE, CSDL không đổi', la(r, 400, 'YEU_CAU_KHONG_HOP_LE') && (await khach(d.sdt)).address === 'Ngõ 7', moTa(r));
    r = await goi('PUT', '/kh/toi', { dia_chi: null }, { tk: d.tk });
    k('C2 PUT dia_chi null → 200, address NULL (xoá)', la(r, 200) && (await khach(d.sdt)).address === null && r.j.khach.dia_chi === null, moTa(r));
    const nfd = 'ệ'.repeat(300).normalize('NFD');   // gõ dấu tách rời: 900 điểm mã, 300 ký tự sau NFC
    r = await goi('PUT', '/kh/toi', { dia_chi: nfd }, { tk: d.tk });
    k('C2 PUT dia_chi 300 ký tự dạng NFD → 200, CSDL lưu dạng NFC', la(r, 200) && (await khach(d.sdt)).address === 'ệ'.repeat(300), moTa(r));
    r = await goi('PUT', '/kh/toi', {}, { tk: d.tk });
    k('C3 PUT {} → 400 YEU_CAU_KHONG_HOP_LE', la(r, 400, 'YEU_CAU_KHONG_HOP_LE'), moTa(r));
    r = await goi('PUT', '/kh/toi', { ten: '' }, { tk: d.tk });
    k('C3 PUT { ten: "" } → 400 TEN_KHONG_HOP_LE', la(r, 400, 'TEN_KHONG_HOP_LE'), moTa(r));
    r = await goi('PUT', '/kh/toi', { ten: 'Tên v2' }, { tk: d.tk });
    k('C3/F2 PUT { ten } (App v2) → 200, chỉ đổi tên', la(r, 200) && (await khach(d.sdt)).name === 'Tên v2' && (await khach(d.sdt)).xung_ho === 'chu', moTa(r));

    const { chayNangCap } = require(path.join(GOC, 'server', 'nang_cap', 'chay.js'));
    const coCot = async () => (await db.query('PRAGMA table_info(pos_customers)')).some((c) => c.name === 'xung_ho');
    const buoc3 = await db.queryOne('SELECT ten FROM pos_nang_cap WHERE so = 3');
    k('C4 kho mới: pos_nang_cap có bước 3, pos_customers có cột xung_ho', !!buoc3 && await coCot(), buoc3 ? buoc3.ten : '(không có bước 3)');
    if (buoc3) {
      await db.run('ALTER TABLE pos_customers DROP COLUMN xung_ho');
      await db.run('DELETE FROM pos_nang_cap WHERE so = 3');
      const lan1 = await chayNangCap({ beginTransaction: txGoc, query: db.query });
      const sl = await db.queryOne('SELECT COUNT(*) AS n FROM _sao_luu_003_pos_customers').catch(() => null);
      k('C4 chạy lại bước 3 trên bảng có dòng → cột trở lại + bảng sao lưu _sao_luu_003_pos_customers có dòng', lan1.hong === null && await coCot() && !!sl && Number(sl.n) > 0, lan1.hong || '');
      const lan2 = await chayNangCap({ beginTransaction: txGoc, query: db.query });
      k('C4 chạy lần hai → không lỗi (bỏ qua bước đã chạy)', lan2.hong === null, lan2.hong || '');
    }
    // C4b: kho chỉ có bảng kho (thu_KHO2a E6b chạy cả thư mục nang_cap trên kho như vậy) → 003 không có pos_customers để thêm cột.
    const { createClient } = require(path.join(GOC, 'node_modules', '@libsql', 'client'));
    const cb = createClient({ url: 'file:' + path.join(THU_MUC, 'khong_bang_khach.db') });
    const dong = async (exe) => (await exe).rows.map((x) => ({ ...x }));
    const bocTx = (tx) => ({ query: (s, a = []) => dong(tx.execute({ sql: s, args: a })), queryOne: async (s, a = []) => (await dong(tx.execute({ sql: s, args: a })))[0],
      run: (s, a = []) => tx.execute({ sql: s, args: a }), commit: () => tx.commit(), rollback: () => tx.rollback() });
    const cbDb = { query: (s, a = []) => dong(cb.execute({ sql: s, args: a })), beginTransaction: async () => bocTx(await cb.transaction('write')) };
    const lanB = await chayNangCap(cbDb);
    const buocB = (await cbDb.query('SELECT so FROM pos_nang_cap ORDER BY so')).map((x) => Number(x.so)).join(',');
    const bangKhach = await cbDb.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pos_customers'");
    k('C4b kho không có bảng pos_customers → nâng cấp chạy hết không lỗi, ghi bước 3, không tự tạo bảng khách',
      lanB.hong === null && buocB.split(',').includes('3') && bangKhach.length === 0, `${lanB.hong || ''} · bước ${buocB}`);
    cb.close();
  });

  muc('[D] POST /gia-han');
  await chay('D', async () => {
    const d = await dangKy();
    const r = await goi('POST', '/kh/gia-han', undefined, { tk: d.tk });
    let tt = null; try { tt = jwt.verify(r.j.token, KHOA_KH); } catch { /* không có / sai */ }
    k('D1 → 200, token mới ký khoá khách, cùng id, hạn 30 ngày', la(r, 200) && !!tt && tt.loai === 'kh' && tt.id === jwt.decode(d.tk).id && tt.exp - tt.iat === 30 * 86400, moTa(r));
    const mong = tt ? new Date(tt.exp * 1000 + 7 * 3600 * 1000).toISOString().slice(0, 19) : '';
    k('D1 het_han = exp đổi sang giờ VN (TZ=UTC), dạng YYYY-MM-DDTHH:mm:ss không hậu tố', !!tt && r.j.het_han === mong, `${r.j.het_han} ≠ ${mong}`);
    const lech = tt && (await db.queryOne('SELECT ABS(julianday(?) - julianday(?, ?)) * 86400 AS g', [r.j.het_han, getNow(), '+30 days'])).g;
    k('D1 het_han cách giờ VN hiện tại 30 ngày (± 60 giây)', lech !== null && lech !== undefined && Number(lech) <= 60, String(lech));
    const moi = await goi('GET', '/kh/toi', undefined, { tk: r.j.token });
    const cu = await goi('GET', '/kh/toi', undefined, { tk: d.tk });
    k('D1 token mới gọi /toi được', la(moi, 200), moTa(moi));
    k('D4 token CŨ vẫn gọi /toi được (không thu hồi — tới hạn cũ)', la(cu, 200) && la(r, 200), moTa(cu));
    const het = jwt.sign({ loai: 'kh', id: jwt.decode(d.tk).id, exp: Math.floor(Date.now() / 1000) - 10 }, KHOA_KH);
    for (const [nhan, o] of [['token hết hạn', { tk: het }], ['token sai', { tk: 'abc' }], ['không token', {}]]) {
      const x = await goi('POST', '/kh/gia-han', undefined, o);
      k(`D2 ${nhan} → 401 KH_TOKEN_SAI`, la(x, 401, 'KH_TOKEN_SAI'), moTa(x));
    }
    const e = await dangKy();
    const ds = [];
    for (let i = 0; i < 11; i++) ds.push(await goi('POST', '/kh/gia-han', undefined, { tk: e.tk }));
    k('D3 khách gọi 10 lần / giờ → lượt 10 vẫn 200', la(ds[9], 200), moTa(ds[9]));
    k('D3 lượt 11 → 429 QUA_NHIEU_LAN', la(ds[10], 429, 'QUA_NHIEU_LAN'), moTa(ds[10]));
    const f = await goi('POST', '/kh/gia-han', undefined, { tk: (await dangKy()).tk });
    k('D3 khách khác không bị ảnh hưởng → 200', la(f, 200), moTa(f));
    // D3b (soát vòng 2): cửa sổ "mỗi GIỜ" khoá qua CHÍNH giuLuotGiaHan.
    const t2 = 6_000_000_000;
    const gh = maKhach.giuLuotGiaHan;
    const h = typeof gh === 'function' && Array.from({ length: 10 }, () => gh('thu-cua-so', t2)).every(Boolean) && [gh('thu-cua-so', t2 + 3599999), gh('thu-cua-so', t2 + 3600000)];
    k('D3b giuLuotGiaHan: 10 lượt qua; lượt 11 ở 3 599 999 ms chặn; đủ 3 600 000 ms → qua lại', bang(h, [false, true]), JSON.stringify(h));
    const nm = await goi('POST', '/kh/nhan-ma-bill', { ma: 'KHONGCO1' }, { tk: e.tk });
    k('F4 sau 11 lần gia hạn, nhận mã bill KHÔNG bị 429 (gia hạn không ăn trần pos_kh_lan_thu)', la(r, 200) && nm.status !== 429 && !!nm.j.code, moTa(nm));
  });

  muc('[F] App bản cũ (v2) chạy như cũ');
  await chay('F', async () => {
    const qc = await khachQuay();
    k('F1 khách CŨ đăng nhập chỉ { sdt, ma } → 200 có token', la(qc.r, 200) && !!qc.tk, moTa(qc.r));
  });

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
