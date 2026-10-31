#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ MANKHACH-1 — màn khách: ghép máy · khoá riêng · trạng thái QR + món · nội dung rảnh · cài đặt · thu hồi
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có routes/man-khach.js, bảng ghép máy). Xanh ngay từ đầu = vô giá trị (K3).
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_MANKHACH1.js
 *  Khuôn thu_KHMUA1.js: database.js + libsql thật trên kho TẠM, chỉ thay ketNoiKho (P8), SX tắt, payOS giả trên 127.0.0.1.
 *  Thời gian trôi = lùi cột giờ trong kho tạm, không ngủ. So HTTP status + `code`, không dò lời báo.
 *  Ca giới hạn lần thử chạy CUỐI (đếm theo IP, mọi ca chung IP 127.0.0.1).
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_mankhach1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(GOC, 'server', 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_mankhach1_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_mankhach1_kh_' + ngauNhien();
const KHOA = { id: 'id_' + ngauNhien(), api: 'api_' + ngauNhien(), ck: 'ck_' + ngauNhien() };
process.env.PAYOS_CLIENT_ID = KHOA.id; process.env.PAYOS_API_KEY = KHOA.api; process.env.PAYOS_CHECKSUM_KEY = KHOA.ck;
process.env.PAYOS_RETURN_URL = 'https://thu.mankhach1.local/tra-ve';

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
const H_KHOA = 'X-Man-Khach-Khoa';

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(GOC, 'server', 'database.js'));
  const { getNow } = require(path.join(GOC, 'server', 'utils', 'helpers.js'));
  await db.initDatabase();
  const sx = require(path.join(GOC, 'server', 'utils', 'sxApi.js'));
  sx.checkStock = async () => ({ sufficient: true });   // SX tắt: bài chỉ đo màn khách

  const gia = express();
  gia.use(express.json());
  gia.post('/v2/payment-requests', (req, res) => {
    const data = { orderCode: req.body.orderCode, amount: req.body.amount, description: req.body.description, status: 'PENDING',
      paymentLinkId: 'pl_' + req.body.orderCode, qrCode: 'QR_GIA_' + req.body.orderCode, checkoutUrl: 'https://gia/' + req.body.orderCode };
    res.json({ code: '00', desc: 'success', data, signature: hmac(chuoiKy(data)) });
  });
  const svGia = await new Promise((ok) => { const s = gia.listen(0, '127.0.0.1', () => ok(s)); });
  process.env.PAYOS_BASE_URL = `http://127.0.0.1:${svGia.address().port}`;

  const R = (f) => path.join(GOC, 'server', 'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/settings', require(R('settings.js')));
  app.use('/api/pos/thanh-toan', require(R('thanh-toan.js')));
  let man = null, loiNap = '';
  try { man = require(R('man-khach.js')); app.use('/api/pos/man-khach', man); } catch (e) { loiNap = e.message; }
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();
  k('có routes/man-khach.js nạp được', !!man, loiNap);
  if (!man) { sv.close(); svGia.close(); return ket(); }

  // ── Dữ liệu nền ──
  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  const nvId = Number((await db.run(`INSERT INTO pos_users (username, password_hash, display_name, role, is_active) VALUES ('nv_thu', 'x', 'NV thử', 'staff', 1)`)).lastInsertRowid);
  const tkNv = jwt.sign({ userId: nvId }, KHOA_NV, { expiresIn: '1h' });
  const datCaiDat = (key, value) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(value), getNow()]);
  for (const [a, b] of [['loyalty_enabled', 'false'], ['flash_enabled', 'false'], ['signup_enabled', '0'], ['thanh_toan_payos_bat_buoc', '0']]) await datCaiDat(a, b);
  const sps = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 4');
  const GIA = [25000, 30000, 20000];
  for (let i = 0; i < 3; i++) await db.run('UPDATE pos_products SET price = ?, ton_gan_nhat = ? WHERE id = ?', [GIA[i], [null, 5, 0][i], sps[i].id]);
  const ma = (i) => `${sps[i].sx_product_type}_${sps[i].sx_product_id}`;
  const mon = (i, sl = 1) => ({ product_id: sps[i].id, sx_product_type: sps[i].sx_product_type, sx_product_id: sps[i].sx_product_id, quantity: sl });
  const SDT = '0912345678', TEN_KHACH = 'Khách Bí Mật';
  await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [SDT, TEN_KHACH, getNow()]);

  const goi = async (method, url, body, tk, them = {}) => {
    const headers = { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...them };
    if (tk) headers.Authorization = 'Bearer ' + tk;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      return { status: r.status, j, tho };
    } finally { noiLai(); }
  };
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const mt = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;
  const so = async (sql, p = []) => Number((await db.queryOne(sql, p).catch(() => null))?.n ?? -1);

  const moQuay = async (id) => (await goi('POST', '/man-khach/quay/mo', id ? { quay_id: id } : {}, tkNv)).j;
  const ghep = (maGhep, ten = 'Màn thử') => goi('POST', '/man-khach/ghep', { ma: maGhep, ten });
  const trangThai = (khoa) => goi('GET', '/man-khach/trang-thai', undefined, null, khoa ? { [H_KHOA]: khoa } : {});
  const taoPhien = async (items, them = {}) => (await goi('POST', '/thanh-toan/phien', { cach: 'payos', don: { items, ...them } }, tkNv)).j.phien;
  const baoPhien = (quayId, phienId) => goi('POST', '/man-khach/quay/phien', { quay_id: quayId, phien_id: phienId }, tkNv);
  const luiGio = (id, giay) => db.run(`UPDATE pos_phien_thanh_toan SET luc_chot = strftime('%Y-%m-%dT%H:%M:%S', luc_chot, ?) WHERE id = ?`, [`${-giay} seconds`, id]);

  // ═════════════ A. Ghép máy ═════════════
  muc('A. Ghép máy');
  const q1 = await moQuay(), q2 = await moQuay();
  k('A1 quầy mở → có quay_id + mã ghép 6 số', /^[0-9a-f]{16}$/.test(q1.quay_id || '') && /^\d{6}$/.test(q1.ma || ''), JSON.stringify(q1));
  k('A2 hai quầy = hai quay_id, hai mã khác nhau', q1.quay_id !== q2.quay_id && q1.ma !== q2.ma);
  const q1lai = await moQuay(q1.quay_id);
  k('A3 mở lại cùng quay_id → giữ mã (còn hạn)', q1lai.quay_id === q1.quay_id && q1lai.ma === q1.ma);
  const mo0 = await goi('POST', '/man-khach/quay/mo', {});
  k('A4 quầy mở KHÔNG token nhân viên → 401', la(mo0, 401), mt(mo0));
  const gSai = await ghep('000000');
  k('A5 mã sai → 400 MA_GHEP_SAI', la(gSai, 400, 'MA_GHEP_SAI'), mt(gSai));
  const g1 = await ghep(q1.ma, 'Màn A'), g2 = await ghep(q2.ma, 'Màn B');
  k('A6 mã đúng → 200 + khoá riêng', la(g1, 200) && typeof g1.j.khoa === 'string' && g1.j.khoa.length >= 32, mt(g1));
  k('A7 hai quầy ghép ra hai khoá khác nhau', g1.j.khoa && g2.j.khoa && g1.j.khoa !== g2.j.khoa);
  const luu = await db.query('SELECT * FROM pos_man_khach_may').catch(() => []);
  k('A8 kho KHÔNG lưu khoá gốc (chỉ băm)', luu.length === 2 && luu.every((m) => !JSON.stringify(m).includes(g1.j.khoa) && !JSON.stringify(m).includes(g2.j.khoa)), JSON.stringify(luu).slice(0, 120));
  await db.run("UPDATE pos_man_khach_quay SET ma_het_han = '2000-01-01T00:00:00' WHERE id = ?", [q2.quay_id]);
  const gHet = await ghep(q2.ma);
  k('A9 mã HẾT HẠN → 400 MA_GHEP_SAI', la(gHet, 400, 'MA_GHEP_SAI'), mt(gHet));
  const q2moi = await moQuay(q2.quay_id);
  k('A10 quầy mở lại sau hạn → cấp mã MỚI còn hạn', /^\d{6}$/.test(q2moi.ma || '') && q2moi.ma_het_han > getNow(), JSON.stringify(q2moi));
  const dm = await goi('POST', '/man-khach/quay/doi-ma', { quay_id: q1.quay_id }, tkNv);
  const gCu = await ghep(q1.ma);
  k('A11 đổi mã → mã mới khác; mã cũ không ghép được', la(dm, 200) && /^\d{6}$/.test(dm.j.ma || '') && dm.j.ma !== q1.ma && la(gCu, 400, 'MA_GHEP_SAI'), mt(dm) + ' / ' + mt(gCu));
  const t1 = await trangThai(g1.j.khoa);
  k('A12 màn đã ghép đọc được trạng thái (rảnh)', la(t1, 200) && t1.j.che_do === 'ranh', mt(t1) + ' ' + (t1.j.che_do || ''));
  const tKhong = await trangThai(null), tSai = await trangThai('khoa-khong-ton-tai');
  k('A13 không khoá / khoá lạ → 401', la(tKhong, 401) && la(tSai, 401), mt(tKhong) + ' / ' + mt(tSai));
  const duongNv = [await goi('GET', '/settings', undefined, null, { [H_KHOA]: g1.j.khoa }), await goi('POST', '/orders/tinh-thu', { items: [mon(0)] }, null, { [H_KHOA]: g1.j.khoa }),
    await goi('GET', '/man-khach/may', undefined, null, { [H_KHOA]: g1.j.khoa }), await goi('POST', '/man-khach/quay/mo', {}, null, { [H_KHOA]: g1.j.khoa }),
    await goi('GET', '/thanh-toan/phien/1', undefined, null, { [H_KHOA]: g1.j.khoa })];
  k('A14 khoá màn khách KHÔNG mở đường nhân viên (cài đặt, tính giá, danh sách máy, mở quầy, phiên)', duongNv.every((r) => r.status === 401), duongNv.map(mt).join(' | '));
  const dsNv = await goi('GET', '/man-khach/may', undefined, tkNv);
  k('A15 nhân viên không quyền cài đặt xem / thu hồi máy → 403', la(dsNv, 403) && la(await goi('POST', '/man-khach/may/1/thu-hoi', {}, tkNv), 403), mt(dsNv));

  // ═════════════ B. Lúc thu ═════════════
  muc('B. Lúc thu');
  const khongPhien = await baoPhien(q1.quay_id, 999999);
  k('B1 báo phiên không có → 404 KHONG_THAY_PHIEN', la(khongPhien, 404, 'KHONG_THAY_PHIEN'), mt(khongPhien));
  const p1 = await taoPhien([mon(0, 2), mon(1, 1)], { customer_phone: SDT, customer_name: TEN_KHACH });
  const b1 = await baoPhien(q1.quay_id, p1.id);
  const tq1 = await trangThai(g1.j.khoa), tq2 = await trangThai(g2.j.khoa);
  const th = tq1.j.thu || {};
  k('B2 quầy báo phiên → màn của quầy 1 chuyển "thu"', la(b1, 200) && tq1.j.che_do === 'thu', mt(b1) + ' ' + tq1.j.che_do);
  k('B3 hiện ĐÚNG chuỗi qr máy chủ trả + số phải trả + tổng', th.qr === p1.qr && th.con_lai === p1.con_lai && th.tong === p1.tong && th.qr === 'QR_GIA_' + p1.id,
    JSON.stringify({ qr: th.qr, cl: th.con_lai, tong: th.tong }));
  const mon1 = th.mon || [];
  k('B4 danh sách món: tên · SL · thành tiền do máy chủ tính (2×25.000 + 1×30.000)', mon1.length === 2 && mon1[0].so_luong === 2 && mon1[0].thanh_tien === 50000
    && mon1[1].thanh_tien === 30000 && mon1[0].ten === sps[0].name && p1.tong === 80000, JSON.stringify(mon1) + ' tong=' + p1.tong);
  k('B5 đếm ngược theo hạn phiên (con_giay > 0, ≤ 15 phút) + gio_vn', th.con_giay > 0 && th.con_giay <= 900 && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(tq1.j.gio_vn || ''), String(th.con_giay));
  k('B6 quầy 2 (không báo phiên) vẫn RẢNH — hai cặp không lẫn', la(tq2, 200) && tq2.j.che_do === 'ranh' && !tq2.tho.includes(p1.qr), tq2.j.che_do);
  k('B7 KHÔNG lộ SĐT / tên khách / số dư (chủ quán chưa bật)', !tq1.tho.includes(SDT) && !tq1.tho.includes(TEN_KHACH) && !/balance|so_du|diem|points|phone/i.test(tq1.tho), tq1.tho.slice(0, 200));
  await datCaiDat('man_khach_hien_ten', '1');
  const tTen = await trangThai(g1.j.khoa);
  k('B8 chủ quán BẬT hiện tên → có tên gọi, vẫn KHÔNG có SĐT', (tTen.j.thu || {}).ten_khach === TEN_KHACH && !tTen.tho.includes(SDT), tTen.tho.slice(0, 160));
  await datCaiDat('man_khach_hien_ten', '0');
  await datCaiDat('flash_enabled', 'true'); await datCaiDat('flash_start', '00:00'); await datCaiDat('flash_end', '23:59');
  await datCaiDat('flash_percent', '20'); await datCaiDat('flash_product_keys', JSON.stringify([ma(0)]));
  const p2 = await taoPhien([mon(0, 1)]);
  await baoPhien(q2.quay_id, p2.id);
  const tg = await trangThai(g2.j.khoa);
  const gi = (tg.j.thu || {}).giam || [];
  k('B9 có Giờ vàng → dòng giảm 5.000 (số máy chủ) và còn phải trả 20.000', gi.length === 1 && gi[0].tien === 5000 && (tg.j.thu || {}).con_lai === 20000 && p2.tong === 20000, JSON.stringify(gi) + ' / ' + p2.tong);
  await datCaiDat('flash_enabled', 'false');
  // chốt phiên (quầy bấm xác nhận tay — cùng đường chốt của quầy) → cảm ơn → rảnh
  const chot = await goi('POST', `/thanh-toan/phien/${p1.id}/xac-nhan-tay`, { ly_do: 'thử màn khách' }, tkChu);
  const tcm = await trangThai(g1.j.khoa);
  k('B10 quầy chốt → "cam_on" + số tiền đã nhận', la(chot, 200) && tcm.j.che_do === 'cam_on' && (tcm.j.cam_on || {}).so_tien === p1.con_lai && !tcm.tho.includes('QR_GIA_'), mt(chot) + ' ' + tcm.j.che_do);
  await luiGio(p1.id, 30);
  const tr = await trangThai(g1.j.khoa);
  k('B11 qua vài giây → về rảnh', tr.j.che_do === 'ranh', tr.j.che_do);
  await luiGio(p1.id, -28);   // biên: mới chốt cách đây ~2 giây → còn cảm ơn
  const tbien = await trangThai(g1.j.khoa);
  k('B12 biên: vừa chốt cách đây ~2 giây → vẫn "cam_on"', tbien.j.che_do === 'cam_on', tbien.j.che_do);
  await goi('POST', `/thanh-toan/phien/${p2.id}/huy`, {}, tkNv);
  const th2 = await trangThai(g2.j.khoa);
  k('B13 quầy huỷ phiên → về rảnh', th2.j.che_do === 'ranh', th2.j.che_do);
  const p3 = await taoPhien([mon(0, 1)]);
  await baoPhien(q2.quay_id, p3.id);
  await db.run("UPDATE pos_phien_thanh_toan SET het_han = '2000-01-01T00:00:00' WHERE id = ?", [p3.id]);
  const th3 = await trangThai(g2.j.khoa);
  k('B14 phiên hết hạn → về rảnh', th3.j.che_do === 'ranh', th3.j.che_do);
  const p4 = await taoPhien([mon(0, 1)]);
  await baoPhien(q2.quay_id, p4.id);
  await db.run('UPDATE pos_phien_thanh_toan SET qr = NULL WHERE id = ?', [p4.id]);
  const th4 = await trangThai(g2.j.khoa);
  k('B15 phiên không có QR (tiền mặt…) → không hiện thu, vẫn rảnh', th4.j.che_do === 'ranh', th4.j.che_do);

  // ═════════════ C/D. Nội dung rảnh + cài đặt ═════════════
  muc('C/D. Nội dung rảnh + Cài đặt → Màn khách');
  const noiDung = () => goi('GET', '/man-khach/noi-dung', undefined, null, { [H_KHOA]: g1.j.khoa });
  const n0 = await noiDung();
  k('C1 chưa cài gì → có danh sách trang mặc định (menu, Giờ vàng, QR App)', la(n0, 200) && Array.isArray(n0.j.trang) && n0.j.trang.map((t) => t.loai).join(',') === 'menu,flash,qr_app', mt(n0) + ' ' + JSON.stringify(n0.j.trang));
  const menu = n0.j.menu || [];
  const m0 = menu.find((m) => m.ten === sps[0].name), m2 = menu.find((m) => m.ten === sps[2].name);
  k('C2 menu lấy từ POS: giá đúng; món tồn 0 có cờ hết hàng; không lộ số tồn / giá vốn', m0 && m0.gia === 25000 && m2 && m2.het === true && m0.het === false && !/stock|ton_|cost|von/i.test(JSON.stringify(menu)), JSON.stringify(menu.slice(0, 2)));
  const cauHinh = [{ loai: 'chu', bat: true, giay: 12, tieu_de: 'Chào mừng', noi_dung: 'Nước ép nguyên chất' }, { loai: 'menu', bat: true, giay: 20 },
    { loai: 'flash', bat: false, giay: 8 }, { loai: 'anh', bat: false, giay: 8 }, { loai: 'qr_app', bat: true, giay: 10 }];
  const luuOk = await goi('PUT', '/settings', { settings: { man_khach_trang: JSON.stringify(cauHinh), man_khach_dia_chi_app: 'https://app-kh.pages.dev', man_khach_hien_ten: '0' } }, tkChu);
  const n1 = await noiDung();
  k('D1 lưu danh sách trang + địa chỉ App → 200; màn khách đọc lại đúng thứ tự, trang tắt bị bỏ, địa chỉ có mặt',
    la(luuOk, 200) && n1.j.trang.map((t) => t.loai).join(',') === 'chu,menu,qr_app' && n1.j.trang[0].giay === 12 && n1.j.trang[0].tieu_de === 'Chào mừng' && n1.j.dia_chi_app === 'https://app-kh.pages.dev',
    mt(luuOk) + ' ' + JSON.stringify(n1.j.trang));
  const truoc = await so("SELECT COUNT(*) AS n FROM pos_settings WHERE key LIKE 'man_khach_%'");
  const sai = [
    ['loại lạ', [{ loai: 'xyz', bat: true, giay: 10 }]], ['số giây 2', [{ loai: 'menu', bat: true, giay: 2 }]], ['số giây 121', [{ loai: 'menu', bat: true, giay: 121 }]],
    ['số giây chữ', [{ loai: 'menu', bat: true, giay: 'mười' }]], ['trang ảnh BẬT (chưa có chỗ lưu ảnh)', [{ loai: 'anh', bat: true, giay: 10 }]],
    ['chữ quá dài', [{ loai: 'chu', bat: true, giay: 10, noi_dung: 'a'.repeat(501) }]], ['không phải mảng', { loai: 'menu' }],
    ['quá 12 trang', Array.from({ length: 13 }, () => ({ loai: 'menu', bat: true, giay: 10 }))],
  ];
  const kqSai = [];
  for (const [ten, v] of sai) kqSai.push([ten, await goi('PUT', '/settings', { settings: { man_khach_trang: JSON.stringify(v), gio_thu: 'x' } }, tkChu)]);
  k('D2 giá trị sai → 400 CAI_DAT_KHONG_HOP_LE (8 kiểu), không ghi khoá nào', kqSai.every(([, r]) => la(r, 400, 'CAI_DAT_KHONG_HOP_LE')) && await so("SELECT COUNT(*) AS n FROM pos_settings WHERE key = 'gio_thu'") === 0,
    kqSai.map(([t, r]) => `${t}:${mt(r)}`).join(' | '));
  const sai2 = [await goi('PUT', '/settings', { settings: { man_khach_trang: 'không phải json' } }, tkChu), await goi('PUT', '/settings', { settings: { man_khach_dia_chi_app: 'javascript:alert(1)' } }, tkChu),
    await goi('PUT', '/settings', { settings: { man_khach_hien_ten: '2' } }, tkChu)];
  k('D3 JSON hỏng · địa chỉ không phải http(s) · hiện tên ≠ 0/1 → 400', sai2.every((r) => la(r, 400, 'CAI_DAT_KHONG_HOP_LE')), sai2.map(mt).join(' | '));
  const sau = await so("SELECT COUNT(*) AS n FROM pos_settings WHERE key LIKE 'man_khach_%'");
  k('D4 sau mọi ca sai, cài đặt cũ còn nguyên', sau === truoc && (await noiDung()).j.trang[0].tieu_de === 'Chào mừng', `${truoc}→${sau}`);
  const bien = await goi('PUT', '/settings', { settings: { man_khach_trang: JSON.stringify([{ loai: 'menu', bat: true, giay: 3 }, { loai: 'chu', bat: true, giay: 120, noi_dung: 'a'.repeat(500) }]) } }, tkChu);
  k('D5 biên hợp lệ (3 giây · 120 giây · chữ 500 ký tự) → 200', la(bien, 200), mt(bien));
  await datCaiDat('flash_enabled', 'true'); await datCaiDat('flash_product_keys', JSON.stringify([ma(0)]));
  await datCaiDat('man_khach_trang', JSON.stringify([{ loai: 'flash', bat: true, giay: 8 }]));
  const nf = await noiDung();
  k('C3 Giờ vàng đang chạy → màn khách nhận % giảm + tên món', (nf.j.flash || {}).dang_chay === true && nf.j.flash.phan_tram === 20 && (nf.j.flash.mon || []).includes(sps[0].name), JSON.stringify(nf.j.flash));
  await datCaiDat('flash_enabled', 'false');
  const nf2 = await noiDung();
  k('C4 hết Giờ vàng → dang_chay = false', (nf2.j.flash || {}).dang_chay === false, JSON.stringify(nf2.j.flash));
  const nhom = await goi('PUT', '/settings', { settings: { man_khach_trang: JSON.stringify([]) } }, tkNv);
  k('D6 nhân viên thường không sửa được cài đặt màn khách → 403', la(nhom, 403), mt(nhom));

  // ═════════════ Thu hồi ═════════════
  muc('Thu hồi khoá');
  const ds = await goi('GET', '/man-khach/may', undefined, tkChu);
  const mayA = (ds.j.may || []).find((m) => m.ten === 'Màn A');
  k('E1 chủ quán xem được danh sách máy đã ghép (tên, quầy, giờ ghép), KHÔNG kèm khoá / băm', la(ds, 200) && ds.j.may.length === 2 && mayA && !/khoa|bam/i.test(JSON.stringify(ds.j.may)), mt(ds) + ' ' + JSON.stringify(ds.j).slice(0, 160));
  const thuHoi = await goi('POST', `/man-khach/may/${mayA.id}/thu-hoi`, {}, tkChu);
  const sauTh = await trangThai(g1.j.khoa), sauTh2 = await goi('GET', '/man-khach/noi-dung', undefined, null, { [H_KHOA]: g1.j.khoa }), conB = await trangThai(g2.j.khoa);
  k('E2 thu hồi → màn A mất quyền (trạng thái + nội dung → 401 KHOA_THU_HOI); màn B không ảnh hưởng', la(thuHoi, 200) && la(sauTh, 401, 'KHOA_THU_HOI') && la(sauTh2, 401, 'KHOA_THU_HOI') && la(conB, 200), mt(sauTh) + ' / ' + mt(conB));
  const gLai = await ghep(dm.j.ma, 'Màn A mới');
  k('E3 sau thu hồi, ghép lại bằng mã hiện tại → khoá mới chạy được', la(gLai, 200) && la(await trangThai(gLai.j.khoa), 200), mt(gLai));

  // ═════════════ F. K5 — chưa ghép màn nào, bán hàng chạy như cũ ═════════════
  muc('F. Không có màn khách ghép — bán hàng như cũ');
  await db.run('DELETE FROM pos_man_khach_may');
  await db.run('DELETE FROM pos_man_khach_quay');
  const dem0 = await so('SELECT COUNT(*) AS n FROM pos_orders');
  const pk = await taoPhien([mon(0, 1)]);
  const ck = await goi('POST', `/thanh-toan/phien/${pk.id}/xac-nhan-tay`, { ly_do: 'thử k5' }, tkChu);
  const tien = await goi('POST', '/orders', { items: [mon(0, 1)], payment_method: 'cash', cash_amount: 25000, cash_received: 25000 }, tkNv);
  k('F1 không quầy / không máy ghép: tạo phiên QR + chốt + đơn tiền mặt vẫn 200 (đơn +2)', pk && la(ck, 200) && la(tien, 200) && await so('SELECT COUNT(*) AS n FROM pos_orders') === dem0 + 2, `${mt(ck)} ${mt(tien)}`);
  const sBan = await goi('POST', '/man-khach/quay/phien', { quay_id: 'khongco', phien_id: pk.id }, tkNv);
  k('F2 báo phiên cho quầy không tồn tại → 404 KHONG_THAY_QUAY (không tự tạo)', la(sBan, 404, 'KHONG_THAY_QUAY'), mt(sBan));

  // ═════════════ A+. Giới hạn lần thử (CHẠY CUỐI) ═════════════
  muc('A+. Giới hạn đoán mã');
  const qx = await moQuay();
  const kq = []; for (let i = 0; i < 7; i++) kq.push(await ghep(qx.ma === '111111' ? '222222' : '111111'));
  const dungMa = await ghep(qx.ma);
  k('A16 sai liên tiếp → 429 QUA_NHIEU_LAN từ lần thứ 6; lúc đó cả mã ĐÚNG cũng bị chặn', kq.slice(0, 5).every((r) => la(r, 400, 'MA_GHEP_SAI')) && la(kq[5], 429, 'QUA_NHIEU_LAN') && la(dungMa, 429, 'QUA_NHIEU_LAN'),
    kq.map(mt).join(' | ') + ' / ' + mt(dungMa));

  sv.close(); svGia.close();
  return ket();
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
