#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ KHACH-APP-1 — khách MỘT nguồn pos_customers: (A) một hàm đọc · (B) bước chép lần cuối 020 / 022 + trạng thái HOÃN của khung
 *  nâng cấp · (C) một hàm tạo khách · (D) quầy + App tạo khách giống nhau, hiện / tìm / quét QR / mở hồ sơ khi SX thiếu họ và khi SX tắt.
 * ═══════════════════════════════════════════════════════════════════════════
 *  PHẢI ĐỎ trên code chưa vá (đọc khách từ SX, bộ đệm ghi đè tên, hai đường tạo khách lệch cột, chưa có bước 020 / 022). Xanh ngay = vô
 *  giá trị (K3). Chạy ở gốc kho:  node cong_cu/thu_KHACHAPP1.js   — bản đột biến: --goc <thư mục kho chép>.
 *  Máy chủ: database.js thật + libsql trên file kho TẠM; SX giả (sxApi.js thay trong require.cache): 'ds' trả danh sách KHÔNG có khách
 *  mới · 'loi' ném (SX tắt / treo). Đếm mọi lượt gọi SX của đường đọc khách.
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');

const iG = process.argv.indexOf('--goc');
const GOC = iG > 0 ? path.resolve(process.argv[iG + 1]) : path.join(__dirname, '..');
const MAY_CHU = path.join(GOC, 'server');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_khachapp1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => 'http://sx.gia', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_khachapp1_nv_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_khachapp1_kh_' + Date.now();
process.env.SX_API_KEY = 'khoa_sx_gia_khachapp1';   // code gốc chỉ gọi SX khi có khoá — để bài thấy được đường đọc SX

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const thu = async (ten, f) => { try { await f(); } catch (e) { noiLai(); k(`${ten} (bài sập giữa chừng)`, false, e.message); } };
const DANG_T = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/;
const QR_MOI = /^TQD-[A-HJ-NP-Z2-9]{12}$/;

// SX giả — cài TRƯỚC khi nạp database / route (bước nâng cấp và customers-v2 require sxApi lúc nạp)
const sx = { che: 'loi', ds: [], goi: 0 };
const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
const sxThat = require(duongSX);
require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true, checkStock: async () => ({ sufficient: true }),
  outStockFIFO: async () => ({ ok: true }), inStockReturn: async () => ({ ok: true }),
  callSxApi: async (duong) => {
    if (!String(duong).includes('/customers/export')) return { ok: true };
    sx.goi++;
    if (sx.che === 'loi') throw new Error('SX tắt (giả)');
    return sx.ds.map((c) => ({ ...c }));
  } };

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();   // sx.che = 'loi' → bước chép SX phải HOÃN, không hỏng
  const hongLucDau = db.layNangCapHong();
  const app = express();
  app.use(express.json());
  const gan = (duong, tep) => { try { app.use(duong, require(path.join(MAY_CHU, 'routes', tep))); } catch (e) { loiGoc(`(không nạp được ${tep}: ${e.message})`); } };
  gan('/api/pos/v2/customers', 'customers-v2.js');
  gan('/api/pos/customers', 'customers.js');
  gan('/api/pos/registrations', 'registrations.js');
  gan('/api/pos/kh', 'kh/quay.js');
  gan('/api/kh', 'kh/index.js');
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  const mot = (sql, a = []) => db.queryOne(sql, a);
  const chu = await mot("SELECT id, username FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tk = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  const goi = async (method, url, body, tkGoi = tk) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tkGoi } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { j, status: r.status };
    } catch (e) { return { status: 0, j: { error: e.message } }; } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status} ${JSON.stringify(r.j).slice(0, 160)}`;
  const quayTao = (than) => goi('POST', '/pos/customers', than);
  const appTao = async (sdt, ten, xungHo, diaChi) => {
    const m = await goi('POST', '/pos/kh/cap-ma', { sdt });
    return goi('POST', '/kh/dang-nhap/xac-minh', { sdt, ma: m.j.ma, ten, xung_ho: xungHo, dia_chi: diaChi });
  };
  const dsKhach = async () => (await goi('GET', '/pos/v2/customers')).j.customers || [];
  const tim = async (q) => (await goi('GET', '/pos/v2/customers/search/' + encodeURIComponent(q))).j.results || [];
  const { chayNangCap } = require(path.join(MAY_CHU, 'nang_cap', 'chay.js'));
  const nangCap = () => chayNangCap({ beginTransaction: db.beginTransaction, query: db.query });

  const SDT_Q = '0938100001', SDT_A = '0938100002', SDT_SX = '0938100009';
  sx.ds = [{ phone: SDT_SX, name: 'Khách Chỉ SX' }];   // SX giả KHÔNG có khách quầy / khách App

  muc('[C] Một hàm tạo khách — quầy và App');
  let kq = null, ka = null;
  await thu('C1', async () => {
    kq = await quayTao({ phone: SDT_Q, name: 'Khách Mới' });   // cùng tên ở hai đường → mọi cột (trừ cột phiếu loại) phải bằng nhau
    ka = await appTao(SDT_A, 'Khách Mới', 'chi', '1 Lê Lợi');
    k('C0 (điều kiện) quầy 201, App xác minh 200', kq.status === 201 && ka.status === 200, `${moTa(kq)} · ${moTa(ka)}`);
    const q = await mot('SELECT * FROM pos_customers WHERE phone = ?', [SDT_Q]), a = await mot('SELECT * FROM pos_customers WHERE phone = ?', [SDT_A]);
    const BO = ['id', 'phone', 'qr_code', 'created_at', 'updated_at', 'created_by', 'xung_ho', 'address'];
    const lech = Object.keys(q || {}).filter((c) => !BO.includes(c) && q[c] !== a[c]).map((c) => `${c}: ${q[c]} ≠ ${a[c]}`);
    k('C1 so MỌI cột (trừ id, phone, qr_code, giờ, created_by, xung_ho, address) hai khách bằng nhau', !!q && !!a && lech.length === 0, lech.join(' · '));
    k('C1 mặc định chung retail / retail_only (chủ quán Q2)', q?.customer_type === 'retail' && q?.sync_status === 'retail_only', `${q?.customer_type}/${q?.sync_status}`);
    k('C1 created_by: quầy = tên nhân viên, App = app_kh', q?.created_by === chu.username && a?.created_by === 'app_kh', `${q?.created_by} / ${a?.created_by}`);
    k('C2 hai mã QR dạng TQD- + 12 ký tự, khác nhau', QR_MOI.test(q?.qr_code || '') && QR_MOI.test(a?.qr_code || '') && q.qr_code !== a.qr_code, `${q?.qr_code} ${a?.qr_code}`);
    k('C6 App giữ xung_ho + address; quầy để trống', a?.xung_ho === 'chi' && a?.address === '1 Lê Lợi' && q?.xung_ho == null && q?.address == null);
    k('C6b giờ tạo dạng giờ VN T (getNow)', DANG_T.test(q?.created_at || '') && DANG_T.test(a?.created_at || ''), `${q?.created_at} ${a?.created_at}`);
  });
  await thu('C2b', async () => {
    // App phải đi qua sinhQrKhongTrung: mã đầu tiên sinh ra trùng mã đã có → App vẫn được mã khác, không 500
    // ép lần sinh mã ĐẦU TIÊN ra đúng mã của khách quầy: crypto.randomBytes(12) trả byte = vị trí ký tự trong bảng QR (helpers.js)
    const crypto = require('crypto');
    const BANG = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const qrQ = (await mot('SELECT qr_code FROM pos_customers WHERE phone = ?', [SDT_Q])).qr_code;
    const m = await goi('POST', '/pos/kh/cap-ma', { sdt: '0938100003' });
    const rbGoc = crypto.randomBytes; let ep = true;
    crypto.randomBytes = (n, ...x) => {
      if (n === 12 && ep) { ep = false; return Buffer.from([...qrQ.slice(4)].map((c) => BANG.indexOf(c))); }
      return rbGoc(n, ...x);
    };
    let r;
    try { r = await goi('POST', '/kh/dang-nhap/xac-minh', { sdt: '0938100003', ma: m.j.ma, ten: 'Khách App Hai', xung_ho: 'anh' }); } finally { crypto.randomBytes = rbGoc; }
    k('C2b (điều kiện) mã ép đã được dùng', ep === false);
    const d = await mot('SELECT qr_code FROM pos_customers WHERE phone = ?', ['0938100003']);
    k('C2b App: mã QR trùng mã đã có → sinh lại, tạo được khách (không 500, không mất khách)', r.status === 200 && !!d && QR_MOI.test(d.qr_code || '') && d.qr_code !== qrQ, `${moTa(r)} · ${d?.qr_code}`);
  });
  await thu('C3', async () => {
    const s = '0938100004';
    const [q, a] = await Promise.all([quayTao({ phone: s, name: 'Đua Quầy' }), appTao(s, 'Đua App', 'em')]);
    const n = Number((await mot('SELECT COUNT(*) AS n FROM pos_customers WHERE phone = ?', [s])).n);
    const dong = await mot('SELECT name FROM pos_customers WHERE phone = ?', [s]);
    const quayDung = q.status === 201 || (q.status === 400 && q.j.code === 'SDT_DA_CO');
    // hồ sơ App (kh/index.js hoSo) không có id → so sdt + ten với dòng trong kho; thiếu trường thì ĐỎ (không `??` về giá trị mong đợi)
    k('C3 quầy + App cùng SĐT cùng lúc → MỘT khách; quầy 201 hoặc 400 SDT_DA_CO; App đăng nhập đúng khách đó', n === 1 && quayDung && a.status === 200
      && a.j.khach?.sdt === s && !!dong && a.j.khach?.ten === dong.name,
      `${n} dòng · ${moTa(q)} · ${moTa(a)}`);
  });
  await thu('C4', async () => {
    const s = '0938100005';
    const kqs = await Promise.all([quayTao({ phone: s, name: 'Hai Quầy A' }), quayTao({ phone: s, name: 'Hai Quầy B' }), quayTao({ phone: s, name: 'Hai Quầy C' })]);
    const n = Number((await mot('SELECT COUNT(*) AS n FROM pos_customers WHERE phone = ?', [s])).n);
    k('C4 ba quầy cùng SĐT cùng lúc → MỘT khách, một 201, còn lại 400 SDT_DA_CO (không 500)', n === 1 && kqs.filter((r) => r.status === 201).length === 1
      && kqs.filter((r) => r.status === 400 && r.j.code === 'SDT_DA_CO').length === 2, kqs.map(moTa).join(' · '));
    const lai = await quayTao({ phone: SDT_Q, name: 'Trùng' });
    k('C4b quầy tạo SĐT đã có → 400 SDT_DA_CO, câu cũ giữ', lai.status === 400 && lai.j.code === 'SDT_DA_CO' && /đã tồn tại/.test(lai.j.error || ''), moTa(lai));
  });
  await thu('C5', async () => {
    const r = await quayTao({ phone: '+84 938 100 006', name: '  Khách Dấu Cách ' });
    const d = await mot('SELECT name FROM pos_customers WHERE phone = ?', ['0938100006']);
    k('C5 quầy SĐT +84 / dấu cách → lưu 0…, tên trim', r.status === 201 && d?.name === 'Khách Dấu Cách', moTa(r));
    const sai = await quayTao({ phone: '12345', name: 'Sai' });
    k('C5b SĐT sai dạng → 400', sai.status === 400, moTa(sai));
  });
  await thu('K2', async () => {
    const r = await quayTao({ phone: '0938100007', name: 'Mẹ', customer_type: 'subscription',
      children: [{ phone: '0938100017', name: 'Con có SĐT', relationship: 'con' }, { name: 'Con không SĐT' }] });
    const con = await mot('SELECT * FROM pos_customers WHERE phone = ?', ['0938100017']);
    const me = await mot('SELECT * FROM pos_customers WHERE phone = ?', ['0938100007']);
    k('K2 người nhận có SĐT: tạo được, có QR, parent_phone đúng, theo loại của mẹ; người nhận không SĐT bỏ qua (không 500)', r.status === 201 && !!con
      && QR_MOI.test(con.qr_code || '') && con.parent_phone === '0938100007' && con.customer_type === 'subscription' && con.sync_status === 'new', `${moTa(r)} · ${JSON.stringify(con)}`);
    k('K2b quầy gửi rõ customer_type → theo đó (subscription / new — sync.js vẫn xuất)', me?.customer_type === 'subscription' && me?.sync_status === 'new');
    const them = await goi('POST', `/pos/customers/${me.id}/children`, { name: 'Con thêm sau', phone: '0938100027' });
    const c2 = await mot('SELECT * FROM pos_customers WHERE phone = ?', ['0938100027']);
    k('K2c POST /:id/children qua hàm chung: có QR mới, theo loại của mẹ', them.status === 201 && QR_MOI.test(c2?.qr_code || '') && c2?.sync_status === 'new', `${moTa(them)} · ${c2?.qr_code}`);
    const khongSdt = await goi('POST', `/pos/customers/${me.id}/children`, { name: 'Con không số' });
    k('K2d POST /:id/children không SĐT → 400 (không 500)', khongSdt.status === 400, moTa(khongSdt));
  });
  await thu('C7', async () => {
    const r = await goi('POST', '/pos/registrations', { phone: '0938100008', name: 'Khách Đăng Ký', requested_product: 'Nước ép', requested_cycles: 2 });
    const d = await mot('SELECT * FROM pos_customers WHERE phone = ?', ['0938100008']);
    const dk = await mot('SELECT * FROM pos_registrations WHERE phone = ?', ['0938100008']);
    k('C7 "Thêm khách" (POST /registrations) tạo khách THẬT (có QR, retail_only) và vẫn ghi đăng ký chờ (Q1)', r.status === 200 && !!d && QR_MOI.test(d.qr_code || '')
      && d.sync_status === 'retail_only' && d.requested_cycles === 2 && dk?.status === 'pending', `${moTa(r)} · ${JSON.stringify(d)}`);
    // Q7 (chủ quán 07.11): GIỮ CHẶN — khách đã có tài khoản thì bán gói ở màn Bán hàng; 409 mã riêng, câu rõ, không lưu gì
    const tenTruoc = (await mot('SELECT name FROM pos_customers WHERE phone = ?', [SDT_Q])).name;
    const lai = await goi('POST', '/pos/registrations', { phone: SDT_Q, name: 'Đã là khách', requested_product: 'Nước ép' });
    const dk2 = await mot('SELECT 1 AS co FROM pos_registrations WHERE phone = ?', [SDT_Q]);
    const tenSau = (await mot('SELECT name FROM pos_customers WHERE phone = ?', [SDT_Q])).name;
    k('C7b "Thêm khách" SĐT đã là khách → 409 KHACH_DA_CO_TAI_KHOAN, câu chủ quán chốt, không ghi đăng ký, khách giữ nguyên (Q7)', lai.status === 409
      && lai.j.code === 'KHACH_DA_CO_TAI_KHOAN' && lai.j.error === 'Khách đã có tài khoản — tìm khách ở màn Bán hàng để bán gói' && !dk2 && tenSau === tenTruoc, moTa(lai));
    const sd = '0938100019';
    const dua = await Promise.all([1, 2, 3].map((i) => goi('POST', '/pos/registrations', { phone: sd, name: 'Đua Đăng Ký ' + i })));
    const nDk = Number((await mot('SELECT COUNT(*) AS n FROM pos_registrations WHERE phone = ?', [sd])).n);
    const nKh = Number((await mot('SELECT COUNT(*) AS n FROM pos_customers WHERE phone = ?', [sd])).n);
    k('C7c ba "Thêm khách" cùng SĐT mới cùng lúc → một 200, còn lại 400 / 409 có code hoặc câu rõ (không 500); một đăng ký, một khách', nDk === 1 && nKh === 1
      && dua.filter((r) => r.status === 200).length === 1 && dua.every((r) => r.status === 200 || ((r.status === 400 || r.status === 409) && !!r.j.error)),
      `${nDk} đk · ${nKh} khách · ${dua.map(moTa).join(' · ')}`);
    const s = '0938100018';
    const dc = await goi('PUT', `/pos/v2/customers/${s}/address`, { address: '9 Hai Bà' });
    const ck = await goi('PUT', '/pos/v2/customers/0938100028/discount', { discount_note: 'Ít đá' });
    const d1 = await mot('SELECT * FROM pos_customers WHERE phone = ?', [s]), d2 = await mot('SELECT * FROM pos_customers WHERE phone = ?', ['0938100028']);
    k('C8 ghi địa chỉ / ghi chú cho SĐT chưa là khách → tạo qua hàm chung (có QR, retail_only) rồi ghi', dc.status === 200 && ck.status === 200
      && QR_MOI.test(d1?.qr_code || '') && QR_MOI.test(d2?.qr_code || '') && d1?.address === '9 Hai Bà' && d2?.discount_note === 'Ít đá' && d1?.sync_status === 'retail_only',
      `${moTa(dc)} · ${JSON.stringify(d1)}`);
  });

  muc('[R] Màn Đăng ký: sửa / xoá đăng ký chờ (Q6, chủ quán 07.11)');
  const taoNV = async (ten, vai) => jwt.sign({ userId: Number((await db.run(
    "INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)", [ten, ten, vai])).lastInsertRowid) }, KHOA_NV, { expiresIn: '1h' });
  const tkNV = await taoNV('nv_thu_khachapp1', 'staff'), tkQL = await taoNV('ql_thu_khachapp1', 'manager');
  const dangKy = (s, ten, t) => goi('POST', '/pos/registrations', { phone: s, name: ten, requested_product: 'Nước ép' }, t);
  const idDk = async (s) => (await mot('SELECT id FROM pos_registrations WHERE phone = ?', [s]))?.id;
  const khachCua = (s) => mot('SELECT * FROM pos_customers WHERE phone = ?', [s]);
  const soNhatKy = async () => Number((await mot("SELECT COUNT(*) AS n FROM pos_sync_logs WHERE type = 'xoa_khach'")).n);
  const xoaDk = async (s, t) => goi('DELETE', '/pos/registrations/' + await idDk(s), undefined, t);
  await thu('R1', async () => {
    const s = '0938100051';
    await dangKy(s, 'Tên Đăng Ký');
    const truoc = await khachCua(s), q0 = (await khachCua(SDT_Q)).name;
    const r = await goi('PUT', '/pos/registrations/' + await idDk(s), { name: 'Tên Đã Sửa', notes: 'ghi mới', parent_phone: '0938100007', relationship: 'con' });
    const sau = await khachCua(s);
    k('R1 sửa đăng ký CHỜ → dòng khách cùng SĐT đổi tên / ghi chú / SĐT mẹ / quan hệ; cột khác (QR, loại) giữ (Q6a)', r.status === 200 && sau?.name === 'Tên Đã Sửa'
      && sau.notes === 'ghi mới' && sau.parent_phone === '0938100007' && sau.relationship === 'con' && sau.qr_code === truoc?.qr_code && sau.customer_type === truoc?.customer_type,
      `${moTa(r)} · ${JSON.stringify(sau)}`);
    k('R1b sửa đăng ký không đụng khách khác', (await khachCua(SDT_Q)).name === q0);
    k('R1c danh sách / ô tìm hiện tên mới', (await dsKhach()).find((c) => c.phone === s)?.name === 'Tên Đã Sửa' && (await tim(s)).some((c) => c.name === 'Tên Đã Sửa'));
    await db.run("UPDATE pos_registrations SET status = 'exported' WHERE phone = ?", [s]);
    const x = await goi('PUT', '/pos/registrations/' + await idDk(s), { name: 'Sửa Sau Xuất' });
    k('R1d đăng ký đã xuất → 400, khách không đổi', x.status === 400 && (await khachCua(s)).name === 'Tên Đã Sửa', moTa(x));
  });
  await thu('R2', async () => {
    const s = '0938100052';
    await dangKy(s, 'Nhập Nhầm');
    const n0 = await soNhatKy();
    const r = await xoaDk(s);
    k('R2 chủ quán xoá đăng ký chờ, khách trắng do chính đăng ký tạo → xoá cả đăng ký lẫn khách (Q6b)', r.status === 200 && !(await idDk(s)) && !(await khachCua(s)), moTa(r));
    const nk = await mot("SELECT * FROM pos_sync_logs WHERE type = 'xoa_khach' ORDER BY id DESC LIMIT 1");
    let ct = {}; try { ct = JSON.parse(nk?.details || '{}'); } catch { /* hỏng */ }
    k('R2b nhật ký xoá khách: ai (created_by), lúc nào (giờ VN dạng T), SĐT, tên, lý do', (await soNhatKy()) === n0 + 1 && nk.created_by === chu.username
      && DANG_T.test(nk.created_at || '') && ct.phone === s && ct.name === 'Nhập Nhầm' && typeof ct.ly_do === 'string' && ct.ly_do.length > 0, nk ? JSON.stringify(nk) : 'không có dòng');
    const lai = await dangKy(s, 'Nhập Lại Đúng');
    k('R2c nhập lại cùng SĐT sau khi xoá → 200, khách mới', lai.status === 200 && (await khachCua(s))?.name === 'Nhập Lại Đúng', moTa(lai));
  });
  await thu('R3', async () => {
    const s = '0938100053';
    await dangKy(s, 'Nhân Viên Xoá', tkNV);
    const n0 = await soNhatKy();
    const r = await xoaDk(s, tkNV);
    k('R3 NHÂN VIÊN xoá đăng ký → chỉ xoá đăng ký, khách giữ nguyên, không nhật ký xoá khách', r.status === 200 && !(await idDk(s)) && !!(await khachCua(s)) && (await soNhatKy()) === n0, moTa(r));
    const s2 = '0938100054';
    await dangKy(s2, 'Quản Lý Xoá', tkNV);
    const r2 = await xoaDk(s2, tkQL);
    k('R3b QUẢN LÝ xoá đăng ký chờ (nhân viên nhập), khách trắng → xoá khách', r2.status === 200 && !(await idDk(s2)) && !(await khachCua(s2)), moTa(r2));
  });
  await thu('R4', async () => {
    // mỗi dấu vết một ca: khách có dấu vết đó → chủ quán xoá đăng ký thì CHỈ xoá đăng ký, khách giữ
    // chèn một dòng: cột cho sẵn + mọi cột NOT NULL không mặc định điền giá trị giả (số → 1, chữ → chuỗi ngẫu nhiên)
    const chenDong = async (bang, dat) => {
      const cots = (await db.query(`PRAGMA table_info(${bang})`)).filter((c) => c.notnull && c.dflt_value == null && !c.pk && !(c.name in dat));
      const ten = [...Object.keys(dat), ...cots.map((c) => c.name)];
      const gt = [...Object.values(dat), ...cots.map((c) => (/INT|REAL/i.test(c.type) ? 1 : 'thu_' + Math.random().toString(36).slice(2)))];
      return Number((await db.run(`INSERT INTO ${bang} (${ten.join(', ')}) VALUES (${ten.map(() => '?').join(', ')})`, gt)).lastInsertRowid);
    };
    const chen = (bang, cot, s) => chenDong(bang, { [cot]: s });
    const DAU_VET = [
      ['đơn', (s) => chen('pos_orders', 'customer_phone', s)],
      ['ví còn tiền', (s) => db.run('INSERT INTO pos_wallets (phone, balance, created_at) VALUES (?, 5000, ?)', [s, '2026-11-01T08:00:00'])],
      ['giao dịch ví (ví về 0)', async (s) => { await db.run('INSERT INTO pos_wallets (phone, balance, created_at) VALUES (?, 0, ?)', [s, '2026-11-01T08:00:00']);
        await chen('pos_balance_transactions', 'customer_phone', s); }],
      ['điểm', (s) => chen('pos_point_transactions', 'customer_phone', s)],
      ['gói', async (s) => chenDong('pos_customer_packages', { customer_phone: s, package_id: await chenDong('pos_packages', {}) })],
      ['thẻ hạng', (s) => chen('pos_membership_purchases', 'customer_phone', s)],
      ['người nhận gắn SĐT', (s) => db.run("INSERT INTO pos_customers (phone, name, parent_phone, created_at) VALUES (?, 'Con Gắn', ?, '2026-11-01T08:00:00')", ['0938109' + s.slice(-3), s])],
      ['mã đăng nhập App', (s) => chen('pos_kh_ma_dang_nhap', 'sdt', s)],
    ];
    let i = 0;
    for (const [ten, them] of DAU_VET) {
      const s = '09381006' + String(++i).padStart(2, '0');
      await dangKy(s, 'Có ' + ten);
      await them(s);
      const r = await xoaDk(s);
      k(`R4 khách có ${ten} → chủ quán xoá đăng ký: chỉ xoá đăng ký, khách GIỮ`, r.status === 200 && !(await idDk(s)) && !!(await khachCua(s)), moTa(r));
    }
  });
  await thu('R5', async () => {
    const s = '0938100071';
    await appTao(s, 'Khách App Có Đăng Ký Cũ', 'anh');
    await db.run("INSERT INTO pos_registrations (phone, name, status, created_by, created_at) VALUES (?, 'Đăng Ký Cũ', 'pending', ?, '2026-10-01T00:00:00')", [s, chu.username]);
    const r = await xoaDk(s);
    k('R5 khách App (created_by app_kh) → chủ quán xoá đăng ký cũ: khách GIỮ', r.status === 200 && !(await idDk(s)) && !!(await khachCua(s)), moTa(r));
    const s2 = '0938100072';
    await db.run("INSERT INTO pos_customers (phone, name, qr_code, created_by, created_at) VALUES (?, 'Khách Có Trước', 'TQD-CCCCCCCCCCCC', ?, '2026-09-01T00:00:00')", [s2, chu.username]);
    await db.run("INSERT INTO pos_registrations (phone, name, status, created_by, created_at) VALUES (?, 'Đăng Ký Sau', 'pending', ?, '2026-10-01T00:00:00')", [s2, chu.username]);
    const r2 = await xoaDk(s2);
    k('R5b khách có TRƯỚC đăng ký (cùng người nhập) → khách GIỮ', r2.status === 200 && !(await idDk(s2)) && !!(await khachCua(s2)), moTa(r2));
    const s3 = '0938100073';
    await dangKy(s3, 'Đã Xuất SX');
    await db.run("UPDATE pos_registrations SET status = 'exported' WHERE phone = ?", [s3]);
    const r3 = await xoaDk(s3);
    k('R5c đăng ký đã xuất (không phải CHỜ) → chỉ xoá đăng ký, khách GIỮ', r3.status === 200 && !(await idDk(s3)) && !!(await khachCua(s3)), moTa(r3));
    const r4 = await goi('DELETE', '/pos/registrations/999999');
    k('R5d xoá đăng ký không có → 404', r4.status === 404, moTa(r4));
  });
  await thu('R6', async () => {
    const so = fs.readdirSync(path.join(MAY_CHU, 'nang_cap')).filter((f) => /^\d{3}_/.test(f)).map((f) => f.slice(0, 3));
    k('R6 server/nang_cap: không hai file cùng số (021 thuộc GIAO-1 — bước đăng ký chờ là 022)', new Set(so).size === so.length
      && fs.existsSync(path.join(MAY_CHU, 'nang_cap', '022_chep_dang_ky_qr.js')) && !fs.existsSync(path.join(MAY_CHU, 'nang_cap', '021_chep_dang_ky_qr.js')), so.join(','));
  });

  // dữ liệu kèm: ví, điểm, ngày sinh, mẹ có ví
  await db.run('INSERT INTO pos_wallets (phone, balance, total_topup, total_spent, created_at) VALUES (?, 50000, 70000, 20000, ?)', [SDT_A, '2026-11-01T08:00:00']);
  await db.run('INSERT INTO pos_wallets (phone, balance, created_at) VALUES (?, 120000, ?)', ['0938100007', '2026-11-01T08:00:00']);
  await db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, created_at) VALUES (?, 'earn', 30, ?)", [SDT_A, '2026-11-01T08:00:00']);
  await db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, expires_at, created_at) VALUES (?, 'earn', 99, '2020-01-01T00:00:00', ?)", [SDT_A, '2020-01-01T00:00:00']);
  await db.run('UPDATE pos_customers SET ngay_sinh = ? WHERE phone = ?', ['1990-05-06', SDT_A]);
  await db.run("INSERT INTO pos_registrations (phone, name, status, created_at) VALUES ('0938100099', 'Chỉ Đăng Ký', 'pending', '2026-11-01T08:00:00')");
  await db.run("INSERT INTO pos_wallets (phone, balance, created_at) VALUES ('0938100098', 7000, '2026-11-01T08:00:00')");
  await db.run("INSERT INTO pos_customers (phone, name, sx_status, qr_code, created_at) VALUES ('0938100097', 'Khách SX Ngừng', 'expired', 'TQD-BBBBBBBBBBBB', '2026-11-01T08:00:00')");

  for (const [che, nhan] of [['ds', 'SX trả danh sách KHÔNG có họ'], ['loi', 'SX tắt']]) {
    sx.che = che;
    muc(`[A/D] Đọc khách — ${nhan}`);
    await thu('A ' + che, async () => {
      sx.goi = 0;
      const ds = await dsKhach();
      const q = ds.find((c) => c.phone === SDT_Q), a = ds.find((c) => c.phone === SDT_A);
      k(`A1 (${che}) khách quầy + khách App có trong GET /v2/customers`, !!q && !!a, `${ds.length} dòng: ${ds.map((c) => c.phone).join(',')}`);
      k(`A1b (${che}) khách App: balance 50000, points 30 (điểm hết hạn không tính), ngay_sinh, xung_ho`, a?.balance === 50000 && a?.points === 30 && a?.ngay_sinh === '1990-05-06' && a?.xung_ho === 'chi', JSON.stringify(a));
      const dem = {}; ds.forEach((c) => { dem[c.phone] = (dem[c.phone] || 0) + 1; });
      k(`A6 (${che}) mỗi SĐT MỘT dòng`, Object.values(dem).every((n) => n === 1), JSON.stringify(Object.entries(dem).filter(([, n]) => n > 1)));
      const dkk = ds.find((c) => c.phone === '0938100008');
      k(`A6b (${che}) khách tạo qua "Thêm khách" hiện là KHÁCH (id, is_synced), không phải dòng đăng ký chờ`, !!dkk?.id && dkk.is_synced === true && !dkk.is_pending, JSON.stringify(dkk));
      const ngung = ds.find((c) => c.phone === '0938100097');
      k(`A14 (${che}) khách SX đã ngừng (sx_status 'expired') vẫn hiện (Q3)`, !!ngung, `${ds.length} dòng`);
      const dk = ds.find((c) => c.phone === '0938100099');
      k(`A9 (${che}) đăng ký chờ chưa là khách vẫn hiện is_pending + registration_id`, dk?.is_pending === true && !!dk?.registration_id, JSON.stringify(dk));
      const t1 = await tim('Khách Mới'), t2 = await tim(SDT_Q), t3 = await tim('khách mớ');
      k(`A3 (${che}) /search theo tên / SĐT / một phần tên (không phân biệt hoa thường) ra đúng khách`, t1.some((c) => c.phone === SDT_A) && t1.some((c) => c.phone === SDT_Q) && t2.some((c) => c.phone === SDT_Q) && t3.some((c) => c.phone === SDT_A),
        `${t1.length}/${t2.length}/${t3.length}`);
      const me = (await tim('0938100017'))[0];
      k(`A13 (${che}) người nhận: parent_balance = ví mẹ 120000, parent_name = tên mẹ`, me?.parent_balance === 120000 && me?.parent_name === 'Mẹ', JSON.stringify(me));
      const qr = (await mot('SELECT qr_code FROM pos_customers WHERE phone = ?', [SDT_A])).qr_code;
      const quet = await goi('GET', '/pos/customers/qr/' + qr);
      const quetTim = await tim(quet.j.phone || 'x');
      k(`A4 (${che}) quét QR khách App → SĐT → /search ra khách`, quet.status === 200 && quetTim.some((c) => c.phone === SDT_A), moTa(quet));
      const hs = await goi('GET', '/pos/v2/customers/' + SDT_A), full = await goi('GET', `/pos/v2/customers/${SDT_Q}/full`);
      k(`A5 (${che}) GET /:phone khách App 200 + balance, total_topup, xung_ho; /:phone/full khách quầy 200`, hs.status === 200 && hs.j.balance === 50000 && hs.j.total_topup === 70000
        && hs.j.xung_ho === 'chi' && full.status === 200 && full.j.customer?.phone === SDT_Q && Array.isArray(full.j.orders), `${moTa(hs)} · ${moTa(full)}`);
      const le = await goi('GET', '/pos/v2/customers/0938100098'), khong = await goi('GET', '/pos/v2/customers/0938177777');
      k(`A9b (${che}) chỉ có ví → is_retail; không gì → 404`, le.status === 200 && le.j.is_retail === true && khong.status === 404, `${moTa(le)} · ${moTa(khong)}`);
      k(`A11 (${che}) bốn đường đọc khách KHÔNG gọi SX lần nào`, sx.goi === 0, `${sx.goi} lượt`);
      const KHOA_CU = ['name', 'phone', 'balance', 'points', 'source', 'is_synced', 'discount_type', 'discount_value', 'discount_note', 'address', 'ngay_sinh', 'customer_type', 'membership'];
      k(`A12 (${che}) dạng trả ra: danh sách giữ đủ khoá cũ + có xung_ho`, !!q && [...KHOA_CU, 'xung_ho'].every((x) => x in q), q ? KHOA_CU.filter((x) => !(x in q)).join(',') + (('xung_ho' in q) ? '' : ' thiếu xung_ho') : 'không có q');
      k(`A12b (${che}) không lộ mật khẩu / PIN`, !!q && !('password' in q) && !('pin_code' in q));
    });
  }

  muc('[A8] Tên sửa ở POS không bị SX đè');
  await thu('A8', async () => {
    sx.che = 'ds'; sx.ds = [{ phone: SDT_Q, name: 'Tên Cũ Bên SX' }, { phone: SDT_SX, name: 'Khách Chỉ SX' }];
    const id = (await mot('SELECT id FROM pos_customers WHERE phone = ?', [SDT_Q])).id;
    await goi('PUT', '/pos/customers/' + id, { name: 'Tên Mới Ở POS' });
    await dsKhach(); await new Promise((r) => setTimeout(r, 150)); await dsKhach(); await new Promise((r) => setTimeout(r, 150));
    const ten = (await mot('SELECT name FROM pos_customers WHERE phone = ?', [SDT_Q])).name;
    const tren = (await dsKhach()).find((c) => c.phone === SDT_Q)?.name;
    k('A8 sau hai lần tải danh sách: tên trong kho + trên danh sách vẫn là tên POS', ten === 'Tên Mới Ở POS' && tren === 'Tên Mới Ở POS', `${ten} / ${tren}`);
    k('A8b khách chỉ có ở SX KHÔNG tự chép vào kho khi tải danh sách', !(await mot('SELECT 1 AS co FROM pos_customers WHERE phone = ?', [SDT_SX])));
  });

  muc('[B] Bước chép lần cuối (020 khách SX · 022 đăng ký chờ + cấp QR ô trống) và trạng thái HOÃN');
  await thu('B3', async () => {
    k('B3 lúc khởi động SX tắt: khung KHÔNG hỏng (kho không 503)', hongLucDau === null, String(hongLucDau));
    const d20 = await mot('SELECT 1 AS co FROM pos_nang_cap WHERE so = 20');
    const d22 = await mot('SELECT 1 AS co FROM pos_nang_cap WHERE so = 22');
    k('B3b bước 020 (SX) HOÃN — chưa ghi pos_nang_cap; bước 022 sau nó vẫn chạy', !d20 && !!d22, `${!!d20} ${!!d22}`);
    k('B5 trong lúc 020 chưa xong, danh sách vẫn 200', (await goi('GET', '/pos/v2/customers')).status === 200);
    sx.che = 'ds'; const dsCu = sx.ds; sx.ds = [];
    imLang(); const rr = await nangCap(); noiLai();
    sx.ds = dsCu;
    k('B3c SX trả danh sách RỖNG → 020 vẫn HOÃN (không coi là xong), khung không hỏng', rr.hong === null && !(await mot('SELECT 1 AS co FROM pos_nang_cap WHERE so = 20')), String(rr.hong));
  });
  await thu('B1', async () => {
    const SDT_CU = '0938100031';
    await db.run("INSERT INTO pos_customers (phone, name, qr_code, created_at) VALUES (?, 'Tên POS Đúng', 'TQD-AAAAAAAAAAAA', ?)", [SDT_CU, '2026-11-01T08:00:00']);
    const truoc = Number((await mot('SELECT COUNT(*) AS n FROM pos_customers')).n);
    sx.che = 'ds'; sx.goi = 0;
    sx.ds = [{ phone: SDT_CU, name: 'Tên SX Cũ' }, { phone: '0938100032', name: 'SX Thiếu Một', parent_phone: SDT_CU, relationship: 'con' },
      { phone: '+84938100033', name: 'SX Thiếu Hai' }, { phone: '123', name: 'SĐT Sai' }, { phone: '0938100034', name: '  ' }, null];
    imLang(); const r = await nangCap(); noiLai();
    const sau = Number((await mot('SELECT COUNT(*) AS n FROM pos_customers')).n);
    const cu = await mot('SELECT name, qr_code FROM pos_customers WHERE phone = ?', [SDT_CU]);
    const m1 = await mot('SELECT * FROM pos_customers WHERE phone = ?', ['0938100032']), m2 = await mot('SELECT * FROM pos_customers WHERE phone = ?', ['0938100033']);
    k('B1 SX trả lời → bước 020 chạy, khung không hỏng', r.hong === null && !!(await mot('SELECT 1 AS co FROM pos_nang_cap WHERE so = 20')), String(r.hong));
    k('B1b chỉ THÊM 2 khách thiếu (một SĐT +84 chuẩn hoá); dòng đã có KHÔNG đổi tên / QR', sau === truoc + 2 && !!m1 && !!m2 && cu.name === 'Tên POS Đúng' && cu.qr_code === 'TQD-AAAAAAAAAAAA', `${truoc} → ${sau} · ${JSON.stringify(cu)}`);
    k('B1c khách chép có QR mới, parent_phone, synced / active / subscription, giờ dạng T', QR_MOI.test(m1?.qr_code || '') && m1?.parent_phone === SDT_CU && m1?.sync_status === 'synced'
      && m1?.sx_status === 'active' && m1?.customer_type === 'subscription' && DANG_T.test(m1?.created_at || ''), JSON.stringify(m1));
    const sl = await mot("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = '_sao_luu_020_pos_customers'");
    const sl2 = sl && Number(sl.n) ? Number((await mot('SELECT COUNT(*) AS n FROM _sao_luu_020_pos_customers')).n) : -1;
    k('B1d sao lưu _sao_luu_020_pos_customers = bảng TRƯỚC khi chép', sl2 === truoc, `${sl2} / ${truoc}`);
    const log = await mot("SELECT * FROM pos_sync_logs WHERE type = 'chep_khach_sx' ORDER BY id DESC LIMIT 1");
    let ct = {}; try { ct = JSON.parse(log?.details || '{}'); } catch { /* hỏng */ }
    k('B1e nhật ký pos_sync_logs: record_count = 2, {sx 6, da_co 1, them 2, bo_qua 3, truoc, sau}', log?.record_count === 2 && ct.sx === 6 && ct.da_co === 1 && ct.them === 2
      && ct.bo_qua === 3 && ct.truoc === truoc && ct.sau === sau, log ? log.details : 'không có dòng');
    k('B4 SĐT sai dạng / tên rỗng / phần tử hỏng bị bỏ, không chép', !(await mot("SELECT 1 AS co FROM pos_customers WHERE phone IN ('123', '0938100034')")));
    sx.goi = 0;
    imLang(); const r2 = await nangCap(); noiLai();
    const sau2 = Number((await mot('SELECT COUNT(*) AS n FROM pos_customers')).n);
    const soLog = Number((await mot("SELECT COUNT(*) AS n FROM pos_sync_logs WHERE type = 'chep_khach_sx'")).n);
    k('B2 chạy khung lần hai: không gọi SX, không thêm khách, không thêm nhật ký', r2.hong === null && sx.goi === 0 && sau2 === sau && soLog === 1, `${sx.goi} lượt · ${sau}→${sau2} · ${soLog} log`);
  });
  await thu('B6', async () => {
    // 022: đăng ký chờ chưa là khách → chép; dòng khách qr_code trống → cấp mã (chỉ ô trống)
    await db.run("INSERT INTO pos_customers (phone, name, qr_code, notes, updated_at, created_at) VALUES ('0938100041', 'Cũ Không QR', NULL, 'giữ', '2026-10-01T00:00:00', '2026-10-01T00:00:00')");
    await db.run("INSERT INTO pos_customers (phone, name, qr_code, created_at) VALUES ('0938100042', 'Cũ QR Rỗng', '', '2026-10-01T00:00:00')");
    await db.run("INSERT INTO pos_customers (phone, name, qr_code, created_at) VALUES ('0938100043', 'Cũ QR Kiểu Cũ', 'QR-0938100043', '2026-10-01T00:00:00')");
    await db.run("INSERT INTO pos_registrations (phone, name, notes, requested_cycles, status, created_by, created_at) VALUES ('0938100044', 'Đăng Ký Cũ', 'ghi', 3, 'pending', 'nv_cu', '2026-10-01T00:00:00')");
    await db.run("INSERT INTO pos_registrations (phone, name, status, created_at) VALUES ('0938100045', 'Đã Xuất', 'exported', '2026-10-01T00:00:00')");
    await db.run('DELETE FROM pos_nang_cap WHERE so = 22');
    imLang(); const r = await nangCap(); noiLai();
    const c1 = await mot("SELECT * FROM pos_customers WHERE phone = '0938100041'"), c2 = await mot("SELECT qr_code FROM pos_customers WHERE phone = '0938100042'");
    const c3 = await mot("SELECT qr_code FROM pos_customers WHERE phone = '0938100043'"), dk = await mot("SELECT * FROM pos_customers WHERE phone = '0938100044'");
    k('B6 bước 022: cấp QR cho dòng qr_code NULL / rỗng; không đổi cột khác (updated_at, notes); không đụng mã đã có', r.hong === null && QR_MOI.test(c1?.qr_code || '') && QR_MOI.test(c2?.qr_code || '')
      && c1.updated_at === '2026-10-01T00:00:00' && c1.notes === 'giữ' && c3?.qr_code === 'QR-0938100043', `${String(r.hong)} · ${JSON.stringify(c1)} · ${c2?.qr_code}`);
    k('B6b đăng ký CHỜ chưa là khách → thành khách (QR, retail_only, created_by của đăng ký); đăng ký đã xuất không chép', !!dk && QR_MOI.test(dk.qr_code || '') && dk.sync_status === 'retail_only'
      && dk.requested_cycles === 3 && dk.created_by === 'nv_cu' && !(await mot("SELECT 1 AS co FROM pos_customers WHERE phone = '0938100045'")), JSON.stringify(dk));
    const quet = await goi('GET', '/pos/customers/qr/' + c1.qr_code);
    k('B6c quét QR mới cấp ra đúng khách cũ', quet.status === 200 && quet.j.phone === '0938100041', moTa(quet));
    const log = await mot("SELECT * FROM pos_sync_logs WHERE type = 'chep_khach_dang_ky' ORDER BY id DESC LIMIT 1");
    let ct = {}; try { ct = JSON.parse(log?.details || '{}'); } catch { /* hỏng */ }
    k('B6d nhật ký 022: them_dang_ky ≥ 1, cap_qr ≥ 2', ct.them_dang_ky >= 1 && ct.cap_qr >= 2 && log.record_count === ct.them_dang_ky, log ? log.details : 'không có dòng');
    const dem = Number((await mot('SELECT COUNT(*) AS n FROM pos_customers')).n);
    imLang(); await nangCap(); noiLai();
    k('B6e chạy khung lần hai: 022 không chạy lại (số khách không đổi)', Number((await mot('SELECT COUNT(*) AS n FROM pos_customers')).n) === dem);
  });
  await thu('B7', async () => {
    // khung: trạng thái HOÃN do bước TỰ trả về ≠ ném lỗi (ném vẫn rollback + dừng + hong)
    const tm = fs.mkdtempSync(path.join(THU_MUC, 'buoc_'));
    await db.run('CREATE TABLE IF NOT EXISTS thu_buoc (x TEXT)');
    fs.writeFileSync(path.join(tm, '901_hoan.js'), "module.exports.truoc = async () => ({ hoan: 'chưa sẵn' }); module.exports.chay = async (tx) => { await tx.run(\"INSERT INTO thu_buoc VALUES ('901')\"); };");
    fs.writeFileSync(path.join(tm, '902_ghi.js'), "module.exports.chay = async (tx) => { await tx.run(\"INSERT INTO thu_buoc VALUES ('902')\"); };");
    fs.writeFileSync(path.join(tm, '903_nem.js'), "module.exports.chay = async (tx) => { await tx.run(\"INSERT INTO thu_buoc VALUES ('903')\"); throw new Error('hỏng thử'); };");
    fs.writeFileSync(path.join(tm, '904_sau.js'), "module.exports.chay = async (tx) => { await tx.run(\"INSERT INTO thu_buoc VALUES ('904')\"); };");
    imLang(); const r = await chayNangCap({ beginTransaction: db.beginTransaction, query: db.query }, tm); noiLai();
    const x = (await db.query('SELECT x FROM thu_buoc ORDER BY x')).map((d) => d.x).join(',');
    const so = (await db.query('SELECT so FROM pos_nang_cap WHERE so > 900 ORDER BY so')).map((d) => d.so).join(',');
    k('B7 bước HOÃN: không ghi gì, không pos_nang_cap; bước sau chạy; bước NÉM → rollback + hong + DỪNG (904 không chạy)', x === '902' && so === '902'
      && /^903_nem: hỏng thử$/.test(String(r.hong)), `${x} · ${so} · ${r.hong}`);
  });

  sv.close();
  console.log(`\nTỔNG: ${dat}/${dat + hong} ca đạt`);
  console.log(hong ? `✗ CÓ ${hong} CA HỎNG` : '✓ ĐẠT');
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.log(`\n✗ BÀI SẬP: ${e.stack}`); console.log(`\nTỔNG: ${dat}/${dat + hong + 1} ca đạt`); process.exit(1); });
