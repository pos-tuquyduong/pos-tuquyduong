#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ CT-1a — thẻ Cài đặt "Chương trình" · ngày sinh khách (nhập MỘT lần) · cửa App GET /chuong-trinh, PUT /toi.ngay_sinh
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (chưa có routes/chuong-trinh.js, cột ngay_sinh, bước 017). Xanh ngay từ đầu = vô giá trị (K3).
 *  Chạy ở GỐC kho POS:        node cong_cu/thu_CT1a.js
 *  Chạy trên bản sao đột biến: node cong_cu/thu_CT1a.js --may-chu <thư mục>/server   (cạnh nó là client/src — viec/CT-1a/dot_bien.py)
 *  Khuôn thu_MANKHACH1.js: database.js + libsql thật trên kho TẠM (chỉ thay ketNoiKho, P8), SX tắt. So HTTP status + `code`, không dò lời báo.
 *  Ca giới hạn lượt của /chuong-trinh chạy CUỐI (đếm theo IP, mọi ca chung IP 127.0.0.1).
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const iMc = process.argv.indexOf('--may-chu');
const SV = iMc > 0 ? path.resolve(process.argv[iMc + 1]) : path.join(GOC, 'server');   // thư mục server/ đang thử
const GOC_THU = path.dirname(SV);                                                      // cạnh nó: client/src, server/...
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_ct1a_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(SV, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const ngauNhien = () => crypto.randomBytes(12).toString('hex');
const KHOA_NV = 'thu_ct1a_nv_' + ngauNhien();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_ct1a_kh_' + ngauNhien();

const C = { do: '\x1b[31m', xanh: '\x1b[32m', dam: '\x1b[1m', het: '\x1b[0m' };
let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ${C.xanh}✓${C.het} ${ten}`); } else { hong++; console.log(`  ${C.do}✗ ${ten}${them ? '  — ' + them : ''}${C.het}`); }
};
const muc = (t) => console.log(`\n${C.dam}${t}${C.het}`);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = console.error = console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const doc = (...p) => { try { return fs.readFileSync(path.join(GOC_THU, ...p), 'utf8'); } catch { return ''; } };
const DANG_GIO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/;

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(SV, 'database.js'));
  const { getNow } = require(path.join(SV, 'utils', 'helpers.js'));
  const { kyTokenKhach } = require(path.join(SV, 'middleware', 'khachAuth.js'));
  await db.initDatabase();
  const sx = require(path.join(SV, 'utils', 'sxApi.js'));
  sx.checkStock = async () => ({ sufficient: true });   // SX tắt: bài chỉ đo chương trình / ngày sinh

  const R = (f) => path.join(SV, 'routes', f);
  const app = express();
  app.use(express.json());
  app.use('/api/pos/orders', require(R('orders.js')));
  app.use('/api/pos/settings', require(R('settings.js')));
  app.use('/api/pos/v2/customers', require(R('customers-v2.js')));
  let ct = null, loiNap = '';
  try { ct = require(R('chuong-trinh.js')); app.use('/api/pos/chuong-trinh', ct); } catch (e) { loiNap = e.message; }
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const cong = sv.address().port;
  const POS = `http://127.0.0.1:${cong}/api/pos`, KH = `http://127.0.0.1:${cong}/api/kh`;
  noiLai();

  // ── Dữ liệu nền ──
  const taoNv = async (ten, vaiTro) => Number((await db.run(`INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)`, [ten, ten, vaiTro])).lastInsertRowid);
  const chu = await db.queryOne("SELECT id, username FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const tkChu = jwt.sign({ userId: chu.id }, KHOA_NV, { expiresIn: '1h' });
  const tkQl = jwt.sign({ userId: await taoNv('ql_thu', 'manager') }, KHOA_NV, { expiresIn: '1h' });
  const tkNv = jwt.sign({ userId: await taoNv('nv_thu', 'staff') }, KHOA_NV, { expiresIn: '1h' });
  const datCaiDat = (key, value) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, String(value), getNow()]);
  for (const [a, b] of [['loyalty_enabled', 'false'], ['flash_enabled', 'false'], ['signup_enabled', '0'], ['thanh_toan_payos_bat_buoc', '0']]) await datCaiDat(a, b);

  const goi = async (goc, method, url, body, tk) => {
    const headers = body !== undefined ? { 'Content-Type': 'application/json' } : {};
    if (tk) headers.Authorization = 'Bearer ' + tk;
    imLang();
    try {
      const r = await fetch(goc + url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      const tho = await r.text();
      let j = {}; try { j = JSON.parse(tho); } catch { /* không phải JSON */ }
      return { status: r.status, j, tho };
    } finally { noiLai(); }
  };
  const pos = (method, url, body, tk) => goi(POS, method, url, body, tk);
  const kh = (method, url, body, tk) => goi(KH, method, url, body, tk);
  const la = (r, status, code) => r.status === status && (code === undefined || r.j.code === code);
  const mt = (r) => `HTTP ${r.status}${r.j.code ? ' · ' + r.j.code : ''}`;

  // Ngày: hôm nay (giờ VN) ± n ngày / n năm — tính bằng lịch thuần, không dính múi giờ.
  const homNay = getNow().slice(0, 10);
  const cong1 = (ngay, n) => { const [y, m, d] = ngay.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
  const luiNam = (ngay, n) => {   // cùng ngày-tháng, lùi n năm (29.2 gặp năm không nhuận → 28.2)
    const [y, m, d] = ngay.split('-').map(Number);
    let dt = new Date(Date.UTC(y - n, m - 1, d));
    if (dt.getUTCMonth() !== m - 1) dt = new Date(Date.UTC(y - n, m - 1, d - 1));
    return dt.toISOString().slice(0, 10);
  };
  let dem = 0;
  const khachMoi = async (ten = 'Khách thử') => {
    const sdt = '0933' + String(100000 + (++dem)).slice(1) + '0';
    const id = Number((await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, ten, getNow()])).lastInsertRowid);
    return { sdt, id, tk: kyTokenKhach(id) };
  };
  const an = async (fn, mac = null) => { imLang(); try { return await fn(); } catch { return mac; } finally { noiLai(); } };   // câu đọc/ghi có thể hỏng trên bản chưa vá: ghi ✗ chứ không sập
  const ngaySinhDb = async (sdt) => (await an(() => db.queryOne('SELECT ngay_sinh FROM pos_customers WHERE phone = ?', [sdt])))?.ngay_sinh ?? 'KHONG_CO_COT';
  const soDb = (sdt) => an(() => db.query('SELECT * FROM pos_ngay_sinh_sua WHERE phone = ? ORDER BY id', [sdt]));
  const soKhach = async () => Number((await db.queryOne('SELECT COUNT(*) AS n FROM pos_customers')).n);

  // ═════════════ 0. Cấu trúc dữ liệu ═════════════
  muc('0. Cấu trúc (bước 017): bảng chương trình · cột ngày sinh · sổ sửa · KHÔNG lưu căn cước');
  const cotKhach = (await db.query('PRAGMA table_info(pos_customers)')).map((c) => c.name);
  const cotCt = (await db.query('PRAGMA table_info(pos_chuong_trinh)')).map((c) => c.name);
  const cotSo = (await db.query('PRAGMA table_info(pos_ngay_sinh_sua)')).map((c) => c.name);
  k('0a pos_customers có cột ngay_sinh', cotKhach.includes('ngay_sinh'));
  k('0b có bảng pos_chuong_trinh và pos_ngay_sinh_sua', cotCt.length > 0 && cotSo.length > 0, `ct ${cotCt.length} cột · sổ ${cotSo.length} cột`);
  const TEN_CAN_CUOC = /can_cuoc|cccd|cmnd|cmt|giay_to_so|so_giay_to|id_card|national|passport/i;
  k('0c KHÔNG có cột nào lưu số căn cước / giấy tờ (pos_customers + hai bảng mới)',
    cotCt.length > 0 && cotSo.length > 0 && ![...cotKhach, ...cotCt, ...cotSo].some((c) => TEN_CAN_CUOC.test(c)),
    [...cotKhach, ...cotCt, ...cotSo].filter((c) => TEN_CAN_CUOC.test(c)).join(', '));
  const buoc = await db.queryOne("SELECT so FROM pos_nang_cap WHERE ten LIKE '017%'");
  k('0d bước nâng cấp 017_chuong_trinh đã chạy', !!buoc);
  const quyen = await db.query("SELECT role, allowed FROM pos_permissions WHERE permission = 'sua_ngay_sinh' ORDER BY role");
  k('0e quyền sua_ngay_sinh: chủ quán 1, quản lý 0, nhân viên 0', quyen.length === 3 && quyen.every((q) => Number(q.allowed) === (q.role === 'owner' ? 1 : 0)), JSON.stringify(quyen));
  const bk = doc('server', 'routes', 'backup.js');
  const iKP = bk.indexOf('const BANG_KHONG_KHOI_PHUC');
  const khongKP = iKP < 0 ? '' : bk.slice(iKP, bk.indexOf('];', iKP));
  const coTen = (t) => new RegExp(`^\\s*\\{ name: '${t}'`, 'm').test(bk);
  k('0f hai bảng mới có trong BACKUP_TABLES; sổ sửa ngày sinh (chỉ-thêm) CHẶN khôi phục bằng file',
    coTen('pos_chuong_trinh') && coTen('pos_ngay_sinh_sua') && khongKP.includes("'pos_ngay_sinh_sua'"));

  // ═════════════ A. Thẻ Cài đặt "Chương trình" ═════════════
  muc('A. Thẻ Chương trình: tạo · sửa · bật/tắt · xoá · giá trị sai 400 · quyền');
  k('A0 có routes/chuong-trinh.js nạp được', !!ct, loiNap);
  const mau = (them = {}) => ({ ten: 'CT thử', mo_ta: 'Mô tả ngắn', loai: 'khac', mien_so_mon: 0, mien_gia_toi_da: null, giam_ca_don_pt: 10, giam_con_lai_pt: 0,
    chi_tai_quan: true, can_xem_giay_to: false, gioi_han_ky: 'ngay', gioi_han_so: 1, bat_dau: null, ket_thuc: null, dang_bat: false, ...them });
  const soCt = async () => Number((await an(() => db.queryOne('SELECT COUNT(*) AS n FROM pos_chuong_trinh'), { n: -1 })).n);

  const ds0 = await pos('GET', '/chuong-trinh', undefined, tkChu);
  const tim = (r, ma) => (r.j.data || []).find((x) => x.ma === ma);
  const hsg = tim(ds0, 'hoc_sinh_gioi'), sn = tim(ds0, 'sinh_nhat');
  k('A1 danh sách có hai chương trình mẫu, TẮT sẵn', !!hsg && !!sn && hsg.dang_bat === false && sn.dang_bat === false, mt(ds0));
  k('A1b mẫu "Học sinh giỏi": loại hoc_sinh_gioi, miễn 1 món, người đi kèm 50% phần còn lại, xem giấy tờ, chỉ tại quán, 1 lần / năm học',
    !!hsg && hsg.loai === 'hoc_sinh_gioi' && hsg.mien_so_mon === 1 && hsg.giam_con_lai_pt === 50 && hsg.giam_ca_don_pt === 0 && hsg.can_xem_giay_to === true
    && hsg.chi_tai_quan === true && hsg.gioi_han_ky === 'nam_hoc' && hsg.gioi_han_so === 1, JSON.stringify(hsg));
  k('A1c mẫu "Sinh nhật": loại sinh_nhat, 50% CẢ ĐƠN, không miễn món, đối chiếu giấy tờ, chỉ tại quán',
    !!sn && sn.loai === 'sinh_nhat' && sn.giam_ca_don_pt === 50 && sn.mien_so_mon === 0 && sn.giam_con_lai_pt === 0 && sn.can_xem_giay_to === true && sn.chi_tai_quan === true, JSON.stringify(sn));
  k('A1d danh sách kèm khoảng tuổi mặc định 5–100', ds0.j.khoang_tuoi?.toi_thieu === 5 && ds0.j.khoang_tuoi?.toi_da === 100, JSON.stringify(ds0.j.khoang_tuoi));

  // Quyền
  const khongToken = await pos('GET', '/chuong-trinh');
  k('A2a không token → 401', khongToken.status === 401, mt(khongToken));
  const nv = [await pos('GET', '/chuong-trinh', undefined, tkNv), await pos('POST', '/chuong-trinh', mau(), tkNv),
    await pos('PUT', '/chuong-trinh/1', { dang_bat: true }, tkNv), await pos('DELETE', '/chuong-trinh/1', undefined, tkNv), await pos('PUT', '/chuong-trinh/khoang-tuoi', { toi_thieu: 5, toi_da: 100 }, tkNv)];
  k('A2b nhân viên (không có manage_promotions) → 403 ở cả 5 cửa quầy', nv.every((r) => la(r, 403, 'PERMISSION_DENIED')), nv.map(mt).join(' | '));
  const ql = await pos('GET', '/chuong-trinh', undefined, tkQl);
  k('A2c quản lý (có manage_promotions) đọc được → 200', ql.status === 200, mt(ql));

  // Tạo hợp lệ
  const n0 = await soCt();
  const t1 = await pos('POST', '/chuong-trinh', mau({ ten: '  Chương trình thử  ', mo_ta: 'Giảm cho khách quen', giam_ca_don_pt: 15 }), tkChu);
  const c1 = t1.j.chuong_trinh || {};
  k('A3 tạo hợp lệ → 200, có id + ma, tên cắt khoảng trắng, TẮT sẵn khi không nói bật', t1.status === 200 && Number.isInteger(c1.id) && typeof c1.ma === 'string' && c1.ma.length > 0
    && c1.ten === 'Chương trình thử' && c1.giam_ca_don_pt === 15 && c1.dang_bat === false && await soCt() === n0 + 1, mt(t1) + ' ' + JSON.stringify(c1));
  const dongDb = c1.id ? await an(() => db.queryOne('SELECT * FROM pos_chuong_trinh WHERE id = ?', [c1.id])) : null;
  k('A3b dòng trong kho khớp (ghi lúc dạng giờ VN)', !!dongDb && dongDb.ten === 'Chương trình thử' && Number(dongDb.giam_ca_don_pt) === 15 && DANG_GIO.test(String(dongDb.tao_luc || '')), JSON.stringify(dongDb));
  const t2 = await pos('POST', '/chuong-trinh', mau({ ten: 'CT miễn món', mien_so_mon: 2, mien_gia_toi_da: 45000, giam_ca_don_pt: 0, can_xem_giay_to: true, gioi_han_ky: 'nam', gioi_han_so: 3,
    bat_dau: '2026-09-01', ket_thuc: '2027-05-31', dang_bat: true }), tkChu);
  const c2 = t2.j.chuong_trinh || {};
  k('A3c tạo kiểu "miễn N món + giá tối đa", hạn, bật ngay → đúng từng trường', t2.status === 200 && c2.mien_so_mon === 2 && c2.mien_gia_toi_da === 45000 && c2.can_xem_giay_to === true
    && c2.gioi_han_ky === 'nam' && c2.gioi_han_so === 3 && c2.bat_dau === '2026-09-01' && c2.ket_thuc === '2027-05-31' && c2.dang_bat === true, JSON.stringify(c2));
  const ql2 = await pos('POST', '/chuong-trinh', mau({ ten: 'Do quản lý tạo' }), tkQl);
  k('A3d quản lý tạo được → 200', ql2.status === 200, mt(ql2));

  // Giá trị sai → 400 CHUONG_TRINH_SAI, không ghi gì
  muc('A. Giá trị sai → 400, không ghi');
  const SAI = [
    ['tên rỗng', { ten: '   ' }], ['tên không phải chuỗi', { ten: 123 }], ['tên 81 ký tự', { ten: 'a'.repeat(81) }], ['mô tả 201 ký tự', { mo_ta: 'b'.repeat(201) }],
    ['loại lạ', { loai: 'vip' }], ['miễn món âm', { mien_so_mon: -1 }], ['miễn món lẻ', { mien_so_mon: 1.5 }], ['miễn món 21 (trần 20)', { mien_so_mon: 21 }],
    ['miễn món là chuỗi', { mien_so_mon: '1' }], ['giá tối đa món miễn âm', { mien_so_mon: 1, mien_gia_toi_da: -5 }], ['giá tối đa món miễn là chữ', { mien_so_mon: 1, mien_gia_toi_da: 'abc' }],
    ['giá tối đa món miễn bằng 0', { mien_so_mon: 1, mien_gia_toi_da: 0 }],
    ['% cả đơn 101', { giam_ca_don_pt: 101 }], ['% cả đơn âm', { giam_ca_don_pt: -1 }], ['% cả đơn lẻ', { giam_ca_don_pt: 10.5 }],
    ['% phần còn lại 101', { giam_con_lai_pt: 101 }], ['% phần còn lại âm', { giam_con_lai_pt: -1 }],
    ['không có ưu đãi nào (cả ba bằng 0)', { mien_so_mon: 0, giam_ca_don_pt: 0, giam_con_lai_pt: 0 }],
    ['kỳ giới hạn lạ', { gioi_han_ky: 'tuan' }], ['số lần 0', { gioi_han_so: 0 }], ['số lần 100 (trần 99)', { gioi_han_so: 100 }], ['số lần lẻ', { gioi_han_so: 1.5 }],
    ['ngày bắt đầu tháng 13', { bat_dau: '2026-13-01' }], ['ngày bắt đầu 30.2', { bat_dau: '2026-02-30' }], ['ngày kết thúc là chữ', { ket_thuc: 'abc' }],
    ['ngày không đủ số 0', { bat_dau: '2026-9-1' }], ['kết thúc trước bắt đầu', { bat_dau: '2026-10-02', ket_thuc: '2026-10-01' }],
    ['chi_tai_quan là chữ', { chi_tai_quan: 'yes' }], ['can_xem_giay_to là chữ', { can_xem_giay_to: 'x' }], ['dang_bat là chữ', { dang_bat: 'x' }],
  ];
  const kqSai = [];
  for (const [ten, them] of SAI) {
    const truoc = await soCt();
    const r = await pos('POST', '/chuong-trinh', mau(them), tkChu);
    if (!(la(r, 400, 'CHUONG_TRINH_SAI') && await soCt() === truoc)) kqSai.push(`${ten}: ${mt(r)}`);
  }
  k(`A4 ${SAI.length} giá trị sai → 400 CHUONG_TRINH_SAI và không thêm dòng nào`, kqSai.length === 0, kqSai.join(' | '));
  // Ngay-trên / ngay-dưới của từng ngưỡng: phải QUA (K3).
  const QUA = [['tên 80 ký tự', { ten: 'a'.repeat(80) }], ['mô tả 200 ký tự', { mo_ta: 'b'.repeat(200) }], ['mô tả bỏ trống', { mo_ta: undefined }], ['% cả đơn 100', { giam_ca_don_pt: 100 }],
    ['% phần còn lại 100 (cả đơn 0)', { giam_ca_don_pt: 0, giam_con_lai_pt: 100 }], ['miễn món 20', { mien_so_mon: 20, giam_ca_don_pt: 0 }], ['số lần 99', { gioi_han_so: 99 }], ['số lần 1', { gioi_han_so: 1 }],
    ['bắt đầu = kết thúc', { bat_dau: '2026-10-01', ket_thuc: '2026-10-01' }], ['chỉ có bắt đầu', { bat_dau: '2026-10-01' }], ['chỉ có kết thúc', { ket_thuc: '2026-10-01' }],
    ['miễn món không giá tối đa (null)', { mien_so_mon: 1, giam_ca_don_pt: 0, mien_gia_toi_da: null }], ['loại sinh_nhat', { loai: 'sinh_nhat' }], ['kỳ ngay / nam_hoc / nam / moi_khach', { gioi_han_ky: 'moi_khach' }],
    ['29.2 năm nhuận', { bat_dau: '2028-02-29' }]];
  const kqQua = [];
  for (const [ten, them] of QUA) {
    const r = await pos('POST', '/chuong-trinh', mau(them), tkChu);
    if (r.status !== 200) kqQua.push(`${ten}: ${mt(r)}`);
  }
  k(`A4b ${QUA.length} giá trị sát ngưỡng HỢP LỆ → vẫn 200 (không chặn oan)`, kqQua.length === 0, kqQua.join(' | '));

  // Sửa · bật / tắt · xoá
  const s1 = await pos('PUT', `/chuong-trinh/${c1.id}`, { ten: 'Đã đổi tên', giam_ca_don_pt: 20 }, tkChu);
  k('A5 sửa từng phần (tên + %) → 200; trường không gửi giữ nguyên', s1.status === 200 && s1.j.chuong_trinh?.ten === 'Đã đổi tên' && s1.j.chuong_trinh?.giam_ca_don_pt === 20
    && s1.j.chuong_trinh?.mo_ta === 'Giảm cho khách quen' && s1.j.chuong_trinh?.ma === c1.ma, mt(s1) + ' ' + JSON.stringify(s1.j.chuong_trinh));
  const b1 = await pos('PUT', `/chuong-trinh/${c1.id}`, { dang_bat: true }, tkChu);
  const b2 = await pos('PUT', `/chuong-trinh/${c1.id}`, { dang_bat: false }, tkChu);
  k('A6 bật rồi tắt (chỉ gửi dang_bat) → 200, đúng trạng thái; tên giữ nguyên', b1.j.chuong_trinh?.dang_bat === true && b2.j.chuong_trinh?.dang_bat === false && b2.j.chuong_trinh?.ten === 'Đã đổi tên', mt(b1) + ' / ' + mt(b2));
  const s2 = await pos('PUT', `/chuong-trinh/${c1.id}`, { giam_ca_don_pt: 150 }, tkChu);
  const sauSai = await an(() => db.queryOne('SELECT giam_ca_don_pt FROM pos_chuong_trinh WHERE id = ?', [c1.id]));
  k('A7 sửa thành giá trị sai → 400 CHUONG_TRINH_SAI, dòng cũ nguyên', la(s2, 400, 'CHUONG_TRINH_SAI') && Number(sauSai?.giam_ca_don_pt) === 20, mt(s2));
  const s3 = await pos('PUT', `/chuong-trinh/${c1.id}`, { giam_ca_don_pt: 0 }, tkChu);
  k('A7b sửa làm mất hết ưu đãi (kết quả không còn ưu đãi nào) → 400', la(s3, 400, 'CHUONG_TRINH_SAI'), mt(s3));
  const s4 = await pos('PUT', '/chuong-trinh/999999', { dang_bat: true }, tkChu);
  const s5 = await pos('DELETE', '/chuong-trinh/999999', undefined, tkChu);
  k('A8 id không có: sửa và xoá → 404 CHUONG_TRINH_KHONG_CO', la(s4, 404, 'CHUONG_TRINH_KHONG_CO') && la(s5, 404, 'CHUONG_TRINH_KHONG_CO'), mt(s4) + ' / ' + mt(s5));
  const truocXoa = await soCt();
  const x1 = await pos('DELETE', `/chuong-trinh/${c1.id}`, undefined, tkChu);
  const x2 = await pos('DELETE', `/chuong-trinh/${c1.id}`, undefined, tkChu);
  k('A9 xoá → 200 và mất dòng; xoá lại → 404', x1.status === 200 && await soCt() === truocXoa - 1 && la(x2, 404, 'CHUONG_TRINH_KHONG_CO'), mt(x1) + ' / ' + mt(x2));
  // Khoảng tuổi
  const kt1 = await pos('PUT', '/chuong-trinh/khoang-tuoi', { toi_thieu: 10, toi_da: 90 }, tkChu);
  const kt2 = await pos('GET', '/chuong-trinh', undefined, tkChu);
  k('A10 đặt khoảng tuổi 10–90 → 200, danh sách trả đúng', kt1.status === 200 && kt2.j.khoang_tuoi?.toi_thieu === 10 && kt2.j.khoang_tuoi?.toi_da === 90, mt(kt1) + ' ' + JSON.stringify(kt2.j.khoang_tuoi));
  const ktSai = [{ toi_thieu: 50, toi_da: 20 }, { toi_thieu: -1, toi_da: 90 }, { toi_thieu: 5, toi_da: 151 }, { toi_thieu: '5', toi_da: 90 }, { toi_thieu: 5.5, toi_da: 90 }, { toi_thieu: 5 }, {}];
  const rKtSai = []; for (const b of ktSai) rKtSai.push(await pos('PUT', '/chuong-trinh/khoang-tuoi', b, tkChu));
  const kt3 = await pos('GET', '/chuong-trinh', undefined, tkChu);
  k('A10b khoảng tuổi sai (min>max · âm · >150 · chuỗi · lẻ · thiếu) → 400 và khoảng cũ giữ nguyên', rKtSai.every((r) => la(r, 400, 'CHUONG_TRINH_SAI')) && kt3.j.khoang_tuoi?.toi_thieu === 10 && kt3.j.khoang_tuoi?.toi_da === 90, rKtSai.map(mt).join(' | '));
  const ktBien = await pos('PUT', '/chuong-trinh/khoang-tuoi', { toi_thieu: 0, toi_da: 0 }, tkChu);
  const ktBien2 = await pos('PUT', '/chuong-trinh/khoang-tuoi', { toi_thieu: 5, toi_da: 100 }, tkChu);   // trả về mặc định
  k('A10c sát ngưỡng hợp lệ 0–0 → 200; trả lại 5–100 → 200', ktBien.status === 200 && ktBien2.status === 200, mt(ktBien) + ' / ' + mt(ktBien2));

  // ═════════════ B. Ngày sinh tại quầy ═════════════
  muc('B. Ngày sinh tại quầy: nhập khi trống · sửa chỉ chủ quán + lý do + sổ · kiểm giá trị');
  const dsB = '/v2/customers';
  const NS = luiNam(homNay, 30);   // 30 tuổi — hợp lệ
  const kB = await khachMoi('Khách B');
  const nB = await soKhach();
  const b0 = await pos('PUT', `${dsB}/${kB.sdt}/ngay-sinh`, { ngay_sinh: NS }, tkNv);
  const soB = await soDb(kB.sdt);
  k('B1 nhân viên nhập khi đang trống → 200, ngày lưu đúng', b0.status === 200 && b0.j.ngay_sinh === NS && await ngaySinhDb(kB.sdt) === NS, mt(b0));
  k('B1b có đúng 1 dòng sổ: cũ null, mới = ngày, ai = nhân viên, lúc dạng giờ VN, không lý do',
    !!soB && soB.length === 1 && soB[0].cu == null && soB[0].moi === NS && soB[0].boi === 'nv_thu' && DANG_GIO.test(String(soB[0].luc)), JSON.stringify(soB));
  const NS2 = luiNam(homNay, 31);
  const b1x = await pos('PUT', `${dsB}/${kB.sdt}/ngay-sinh`, { ngay_sinh: NS2, ly_do: 'Khách nhập nhầm' }, tkNv);
  const b2x = await pos('PUT', `${dsB}/${kB.sdt}/ngay-sinh`, { ngay_sinh: NS2, ly_do: 'Khách nhập nhầm' }, tkQl);
  const soB2 = await soDb(kB.sdt);
  k('B2 đã có ngày sinh: nhân viên VÀ quản lý (chưa được cấp quyền) → 403 PERMISSION_DENIED; ngày + sổ không đổi',
    la(b1x, 403, 'PERMISSION_DENIED') && la(b2x, 403, 'PERMISSION_DENIED') && await ngaySinhDb(kB.sdt) === NS && soB2?.length === 1, mt(b1x) + ' / ' + mt(b2x));
  const b3x = await pos('PUT', `${dsB}/${kB.sdt}/ngay-sinh`, { ngay_sinh: NS2 }, tkChu);
  const b3y = await pos('PUT', `${dsB}/${kB.sdt}/ngay-sinh`, { ngay_sinh: NS2, ly_do: '   ' }, tkChu);
  k('B3 chủ quán sửa KHÔNG lý do (thiếu / toàn khoảng trắng) → 400 LY_DO_BAT_BUOC; ngày nguyên', la(b3x, 400, 'LY_DO_BAT_BUOC') && la(b3y, 400, 'LY_DO_BAT_BUOC') && await ngaySinhDb(kB.sdt) === NS, mt(b3x) + ' / ' + mt(b3y));
  const b4 = await pos('PUT', `${dsB}/${kB.sdt}/ngay-sinh`, { ngay_sinh: NS2, ly_do: 'Đối chiếu căn cước: nhập nhầm năm' }, tkChu);
  const soB3 = await soDb(kB.sdt);
  const d2 = soB3?.[1];
  k('B4 chủ quán sửa CÓ lý do → 200, ngày mới', b4.status === 200 && await ngaySinhDb(kB.sdt) === NS2, mt(b4));
  k('B4b sổ thêm dòng thứ 2: cũ = ngày cũ, mới = ngày mới, lý do, ai = admin, lúc dạng giờ VN; dòng đầu còn nguyên',
    soB3?.length === 2 && d2.cu === NS && d2.moi === NS2 && d2.ly_do === 'Đối chiếu căn cước: nhập nhầm năm' && d2.boi === chu.username && DANG_GIO.test(String(d2.luc)) && soB3[0].moi === NS, JSON.stringify(soB3));
  await db.run("UPDATE pos_permissions SET allowed = 1 WHERE role = 'manager' AND permission = 'sua_ngay_sinh'");
  const b5 = await pos('PUT', `${dsB}/${kB.sdt}/ngay-sinh`, { ngay_sinh: NS, ly_do: 'Quản lý được cấp quyền' }, tkQl);
  k('B5 quản lý SAU KHI được cấp quyền sua_ngay_sinh → sửa được (quyền theo bảng phân quyền, không cứng theo vai)', b5.status === 200 && await ngaySinhDb(kB.sdt) === NS, mt(b5));
  await db.run("UPDATE pos_permissions SET allowed = 0 WHERE role = 'manager' AND permission = 'sua_ngay_sinh'");
  const b6 = await pos('PUT', `${dsB}/${kB.sdt}/ngay-sinh`, { ngay_sinh: NS2, ly_do: 'x' }, tkQl);
  k('B5b thu quyền lại → quản lý lại bị 403', la(b6, 403, 'PERMISSION_DENIED'), mt(b6));
  const b7 = await pos('PUT', `${dsB}/${kB.sdt}/ngay-sinh`, { ngay_sinh: 'khong-phai-ngay', ly_do: 'thử' }, tkChu);
  k('B5c chủ quán sửa thành giá trị sai → 400 NGAY_SINH_SAI; ngày nguyên', la(b7, 400, 'NGAY_SINH_SAI') && await ngaySinhDb(kB.sdt) === NS, mt(b7));
  const kLa = await pos('PUT', `${dsB}/0944999999/ngay-sinh`, { ngay_sinh: NS }, tkNv);
  const kHong = await pos('PUT', `${dsB}/123/ngay-sinh`, { ngay_sinh: NS }, tkNv);
  k('B6 khách không có → 404 KHACH_KHONG_TON_TAI và KHÔNG tạo khách mới (luật thiết kế 6); SĐT hỏng → 400', la(kLa, 404, 'KHACH_KHONG_TON_TAI') && kHong.status === 400 && await soKhach() === nB, mt(kLa) + ' / ' + mt(kHong));
  const kKo = await pos('PUT', `${dsB}/${kB.sdt}/ngay-sinh`, { ngay_sinh: NS });
  k('B6b không token → 401', kKo.status === 401, mt(kKo));

  // Kiểm giá trị — chạy bằng quầy trên khách trống, mỗi ca một khách
  muc('B. Kiểm ngày sinh (cùng hàm với App)');
  const SAI_NS = [['sai dạng 20000101', '20000101'], ['sai dạng 2000-1-1', '2000-1-1'], ['có giờ', '2000-01-01T00:00:00'], ['khoảng trắng đầu', ' 2000-01-01'], ['tháng 13', '2000-13-01'],
    ['30.2', '2000-02-30'], ['29.2 năm không nhuận', '2001-02-29'], ['ngày 0', '2000-01-00'], ['năm 0000', '0000-01-01'], ['rỗng', ''], ['chữ', 'abc'], ['số', 20000101], ['null', null], ['mảng', ['2000-01-01']],
    ['TƯƠNG LAI (ngày mai)', cong1(homNay, 1)], ['hôm nay (tuổi 0 < tối thiểu 5)', homNay], ['tuổi 4 (ngay dưới 5)', cong1(luiNam(homNay, 5), 1)], ['tuổi 101 (ngay trên 100)', luiNam(homNay, 101)]];
  const kqNs = [];
  for (const [ten, v] of SAI_NS) {
    const x = await khachMoi();
    const r = await pos('PUT', `${dsB}/${x.sdt}/ngay-sinh`, { ngay_sinh: v }, tkNv);
    if (!(la(r, 400, 'NGAY_SINH_SAI') && await ngaySinhDb(x.sdt) === null)) kqNs.push(`${ten}: ${mt(r)}`);
  }
  k(`B7 ${SAI_NS.length} ngày sinh sai / tương lai / ngoài tuổi → 400 NGAY_SINH_SAI, không lưu`, kqNs.length === 0, kqNs.join(' | '));
  const QUA_NS = [['đúng 5 tuổi (ngay trên mức tối thiểu)', luiNam(homNay, 5)], ['đúng 100 tuổi (ngay dưới mức tối đa)', cong1(luiNam(homNay, 101), 1)], ['29.2 năm nhuận', '2000-02-29'], ['30 tuổi', NS]];
  const kqQuaNs = [];
  for (const [ten, v] of QUA_NS) {
    const x = await khachMoi();
    const r = await pos('PUT', `${dsB}/${x.sdt}/ngay-sinh`, { ngay_sinh: v }, tkNv);
    if (!(r.status === 200 && await ngaySinhDb(x.sdt) === v)) kqQuaNs.push(`${ten}: ${mt(r)}`);
  }
  k(`B7b ${QUA_NS.length} ngày sinh sát ngưỡng HỢP LỆ → 200, lưu đúng (không chặn oan)`, kqQuaNs.length === 0, kqQuaNs.join(' | '));
  await pos('PUT', '/chuong-trinh/khoang-tuoi', { toi_thieu: 10, toi_da: 60 }, tkChu);
  const t9 = await khachMoi(), t11 = await khachMoi(), t61 = await khachMoi(), t60 = await khachMoi();
  const rt = [await pos('PUT', `${dsB}/${t9.sdt}/ngay-sinh`, { ngay_sinh: luiNam(homNay, 9) }, tkNv), await pos('PUT', `${dsB}/${t11.sdt}/ngay-sinh`, { ngay_sinh: luiNam(homNay, 11) }, tkNv),
    await pos('PUT', `${dsB}/${t61.sdt}/ngay-sinh`, { ngay_sinh: luiNam(homNay, 61) }, tkNv), await pos('PUT', `${dsB}/${t60.sdt}/ngay-sinh`, { ngay_sinh: luiNam(homNay, 60) }, tkNv)];
  k('B8 khoảng tuổi theo CÀI ĐẶT (10–60): 9 tuổi 400 · 11 tuổi 200 · 61 tuổi 400 · 60 tuổi 200', la(rt[0], 400, 'NGAY_SINH_SAI') && rt[1].status === 200 && la(rt[2], 400, 'NGAY_SINH_SAI') && rt[3].status === 200, rt.map(mt).join(' | '));
  // Cài đặt hỏng (ghi tay vào kho) → lùi về mặc định, không sập, không mở toang
  await datCaiDat('ct_tuoi_toi_thieu', '50'); await datCaiDat('ct_tuoi_toi_da', '20');
  const hu1 = await khachMoi(), hu2 = await khachMoi(), hu3 = await khachMoi();
  const rh = [await pos('PUT', `${dsB}/${hu1.sdt}/ngay-sinh`, { ngay_sinh: luiNam(homNay, 30) }, tkNv), await pos('PUT', `${dsB}/${hu2.sdt}/ngay-sinh`, { ngay_sinh: luiNam(homNay, 3) }, tkNv)];
  await datCaiDat('ct_tuoi_toi_thieu', 'abc'); await datCaiDat('ct_tuoi_toi_da', '');
  rh.push(await pos('PUT', `${dsB}/${hu3.sdt}/ngay-sinh`, { ngay_sinh: luiNam(homNay, 30) }, tkNv));
  k('B8b cài đặt tuổi HỎNG (min > max · chữ · rỗng) → dùng mặc định 5–100: 30 tuổi 200, 3 tuổi 400', rh[0].status === 200 && la(rh[1], 400, 'NGAY_SINH_SAI') && rh[2].status === 200, rh.map(mt).join(' | '));
  await pos('PUT', '/chuong-trinh/khoang-tuoi', { toi_thieu: 5, toi_da: 100 }, tkChu);

  // ═════════════ C. Cửa App ═════════════
  muc('C. App: /toi.khach.ngay_sinh · PUT /toi nhận ngay_sinh một lần · GET /chuong-trinh');
  const kc = await khachMoi('Khách App');
  const g0 = await kh('GET', '/toi', undefined, kc.tk);
  k('C1 GET /toi: khach.ngay_sinh có mặt và = null khi chưa nhập', g0.status === 200 && 'ngay_sinh' in (g0.j.khach || {}) && g0.j.khach.ngay_sinh === null, mt(g0));
  const p0 = await kh('PUT', '/toi', { ngay_sinh: NS }, kc.tk);
  k('C2 PUT /toi {ngay_sinh} lần đầu → 200, khach.ngay_sinh = ngày; kho có; sổ có dòng ai = app_kh',
    p0.status === 200 && p0.j.khach?.ngay_sinh === NS && await ngaySinhDb(kc.sdt) === NS && (await soDb(kc.sdt))?.[0]?.boi === 'app_kh', mt(p0));
  const g1 = await kh('GET', '/toi', undefined, kc.tk);
  k('C2b GET /toi sau đó trả đúng ngày', g1.j.khach?.ngay_sinh === NS, mt(g1));
  const p1 = await kh('PUT', '/toi', { ngay_sinh: NS2 }, kc.tk);
  const p1b = await kh('PUT', '/toi', { ngay_sinh: NS }, kc.tk);
  k('C3 lần hai (khác giá trị / cùng giá trị) → 409 NGAY_SINH_DA_CO; ngày + sổ không đổi', la(p1, 409, 'NGAY_SINH_DA_CO') && la(p1b, 409, 'NGAY_SINH_DA_CO') && await ngaySinhDb(kc.sdt) === NS && (await soDb(kc.sdt))?.length === 1, mt(p1) + ' / ' + mt(p1b));
  const kcSai = [];
  for (const [ten, v] of SAI_NS) {
    const x = await khachMoi();
    const r = await kh('PUT', '/toi', { ngay_sinh: v }, x.tk);
    if (!(la(r, 400, 'NGAY_SINH_SAI') && await ngaySinhDb(x.sdt) === null)) kcSai.push(`${ten}: ${mt(r)}`);
  }
  k(`C4 App gửi ${SAI_NS.length} giá trị sai / tương lai / ngoài tuổi / null → 400 NGAY_SINH_SAI, không lưu`, kcSai.length === 0, kcSai.join(' | '));
  const kcQua = [];
  for (const [ten, v] of QUA_NS) {
    const x = await khachMoi();
    const r = await kh('PUT', '/toi', { ngay_sinh: v }, x.tk);
    if (!(r.status === 200 && await ngaySinhDb(x.sdt) === v)) kcQua.push(`${ten}: ${mt(r)}`);
  }
  k(`C4b App gửi ${QUA_NS.length} ngày sát ngưỡng HỢP LỆ → 200 (không chặn oan)`, kcQua.length === 0, kcQua.join(' | '));
  const dua = await khachMoi();
  const dd = await Promise.all([kh('PUT', '/toi', { ngay_sinh: luiNam(homNay, 20) }, dua.tk), kh('PUT', '/toi', { ngay_sinh: luiNam(homNay, 21) }, dua.tk)]);
  const soDua = await soDb(dua.sdt);
  const thang = dd.find((r) => r.status === 200);
  k('C5 hai máy cùng PUT lần đầu cùng lúc → ĐÚNG MỘT thắng (200), một 409 NGAY_SINH_DA_CO; kho = giá trị của máy thắng; sổ 1 dòng',
    dd.filter((r) => r.status === 200).length === 1 && dd.filter((r) => la(r, 409, 'NGAY_SINH_DA_CO')).length === 1 && thang?.j.khach?.ngay_sinh === await ngaySinhDb(dua.sdt) && soDua?.length === 1, dd.map(mt).join(' | '));
  // Khách A không đụng khách B
  const A = await khachMoi('A'), B = await khachMoi('B');
  const pa = await kh('PUT', '/toi', { ngay_sinh: NS, sdt: B.sdt, phone: B.sdt, customer_phone: B.sdt, id: B.id }, A.tk);
  k('C6 khách A gửi kèm SĐT / id của B: chỉ A có ngày; B vẫn trống (SĐT lấy từ token)', pa.status === 200 && await ngaySinhDb(A.sdt) === NS && await ngaySinhDb(B.sdt) === null, mt(pa));
  const cu401 = await kh('PUT', '/toi', { ngay_sinh: NS });
  const cu401b = await kh('PUT', '/toi', { ngay_sinh: NS }, 'khong.phai.token');
  k('C6b PUT /toi không token / token sai → 401 KH_TOKEN_SAI', la(cu401, 401, 'KH_TOKEN_SAI') && la(cu401b, 401, 'KH_TOKEN_SAI'), mt(cu401) + ' / ' + mt(cu401b));
  // K5: đường cũ nguyên
  const k5 = await khachMoi('Tên cũ');
  const kq1 = await kh('PUT', '/toi', { ten: 'Tên mới', xung_ho: 'chi', dia_chi: 'Số 5 Phố Thử' }, k5.tk);
  const dongK5 = await db.queryOne('SELECT name, xung_ho, address FROM pos_customers WHERE id = ?', [k5.id]);
  k('K5a PUT /toi chỉ ten / xung_ho / dia_chi (như cũ) → 200, ghi đúng, ngay_sinh vẫn null',
    kq1.status === 200 && kq1.j.khach?.ten === 'Tên mới' && kq1.j.khach?.xung_ho === 'chi' && kq1.j.khach?.dia_chi === 'Số 5 Phố Thử' && kq1.j.khach?.ngay_sinh === null && dongK5.name === 'Tên mới' && await ngaySinhDb(k5.sdt) === null, mt(kq1));
  const kq2 = await kh('PUT', '/toi', { ten: 'Tên hai', ngay_sinh: NS }, k5.tk);
  k('K5b tên + ngày sinh trong MỘT thân (ngày đang trống) → 200, cả hai ghi', kq2.status === 200 && kq2.j.khach?.ten === 'Tên hai' && kq2.j.khach?.ngay_sinh === NS && (await db.queryOne('SELECT name FROM pos_customers WHERE id = ?', [k5.id])).name === 'Tên hai', mt(kq2));
  const kq3 = await kh('PUT', '/toi', { ten: 'Tên ba', ngay_sinh: NS2 }, k5.tk);
  k('K5c tên + ngày sinh khi ngày ĐÃ CÓ → 409 và KHÔNG sửa tên (một thân hỏng thì không ghi gì)', la(kq3, 409, 'NGAY_SINH_DA_CO') && (await db.queryOne('SELECT name FROM pos_customers WHERE id = ?', [k5.id])).name === 'Tên hai', mt(kq3));
  const kq4 = await kh('PUT', '/toi', { ten: 'Tên bốn' }, k5.tk);
  k('K5d khách đã có ngày sinh vẫn sửa tên bình thường → 200, ngày không đổi', kq4.status === 200 && kq4.j.khach?.ngay_sinh === NS && await ngaySinhDb(k5.sdt) === NS, mt(kq4));
  const kq5 = await kh('PUT', '/toi', {}, k5.tk);
  k('K5e PUT /toi thân rỗng → vẫn 400 YEU_CAU_KHONG_HOP_LE', la(kq5, 400, 'YEU_CAU_KHONG_HOP_LE'), mt(kq5));

  // GET /chuong-trinh — chỉ bật + trong hạn
  muc('C. GET /chuong-trinh (không token)');
  await an(() => db.run('UPDATE pos_chuong_trinh SET dang_bat = 0'));
  const them = (ma, ten, dangBat, batDau, ketThuc) => an(() => db.run(`INSERT INTO pos_chuong_trinh (ma, ten, mo_ta, loai, mien_so_mon, mien_gia_toi_da, giam_ca_don_pt, giam_con_lai_pt, chi_tai_quan, can_xem_giay_to,
    gioi_han_ky, gioi_han_so, bat_dau, ket_thuc, dang_bat, tao_luc) VALUES (?, ?, 'mô tả ' || ?, 'khac', 1, 30000, 25, 40, 1, 1, 'ngay', 1, ?, ?, ?, ?)`, [ma, ten, ten, batDau, ketThuc, dangBat, getNow()]));
  await them('t_bat', 'Đang bật', 1, null, null);
  await them('t_tat', 'Đã tắt', 0, null, null);
  await them('t_chua', 'Chưa tới hạn', 1, cong1(homNay, 1), null);
  await them('t_het', 'Hết hạn', 1, null, cong1(homNay, -1));
  await them('t_bd_nay', 'Bắt đầu hôm nay', 1, homNay, null);
  await them('t_kt_nay', 'Kết thúc hôm nay', 1, null, homNay);
  await them('t_trong', 'Đang trong hạn', 1, cong1(homNay, -1), cong1(homNay, 1));
  await them('t_chi_hom_nay', 'Chỉ hôm nay', 1, homNay, homNay);
  const cp = await kh('GET', '/chuong-trinh');
  const maThay = (cp.j.data || []).map((x) => x.ma);
  const DUNG = ['t_bat', 't_bd_nay', 't_kt_nay', 't_trong', 't_chi_hom_nay'];   // đúng thứ tự tạo
  k('C7 chỉ trả chương trình ĐANG BẬT và TRONG THỜI GIAN CHẠY (ranh giới: bắt đầu / kết thúc = hôm nay thì CÓ; mai / hôm qua thì KHÔNG), theo thứ tự tạo',
    cp.status === 200 && cp.j.success === true && JSON.stringify(maThay) === JSON.stringify(DUNG), mt(cp) + ' ' + maThay.join(','));
  const khoaTra = (cp.j.data || []).map((x) => Object.keys(x).sort().join(','));
  k('C8 mỗi mục có ĐÚNG năm trường { ma, ten, mo_ta, loai, dang_bat } (không lộ mức ưu đãi / điều kiện); dang_bat = true',
    khoaTra.length > 0 && khoaTra.every((s) => s === 'dang_bat,loai,ma,mo_ta,ten') && cp.j.data.every((x) => x.dang_bat === true && x.loai === 'khac' && x.mo_ta.startsWith('mô tả ')), khoaTra[0]);
  const cpTk = await kh('GET', '/chuong-trinh', undefined, kc.tk);
  const cpSai = await kh('GET', '/chuong-trinh', undefined, 'khong.phai.token');
  k('C9 gọi CÓ token cũng 200 (cửa công khai, không phụ thuộc token)', cpTk.status === 200 && (cpTk.j.data || []).length === DUNG.length && cpSai.status === 200, mt(cpTk) + ' / ' + mt(cpSai));

  // K5 — không đổi giá / điểm / đơn
  muc('K5. Không đổi giá / điểm / đơn nào');
  const sp = await db.queryOne('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 40000 WHERE id = ?', [sp.id]);
  const don = (sdt) => pos('POST', '/orders', { items: [{ product_id: sp.id, sx_product_type: sp.sx_product_type, sx_product_id: sp.sx_product_id, quantity: 2 }],
    payment_method: 'cash', cash_amount: 80000, customer_phone: sdt }, tkChu);
  const kDon = await khachMoi('Khách đơn');
  await an(() => db.run('UPDATE pos_customers SET ngay_sinh = ? WHERE id = ?', [luiNam(homNay, 30), kDon.id]));   // sinh nhật HÔM NAY
  await an(() => db.run('UPDATE pos_chuong_trinh SET dang_bat = 0'));
  const d1 = await don(kDon.sdt);
  await an(() => db.run("UPDATE pos_chuong_trinh SET dang_bat = 1 WHERE ma IN ('sinh_nhat', 'hoc_sinh_gioi', 't_bat')"));
  const d2o = await don(kDon.sdt);
  k('K5f tổng đơn y nguyên khi bật chương trình Sinh nhật / Học sinh giỏi (khách sinh nhật hôm nay): CT-1a chỉ lưu cấu hình, không áp giá',
    d1.status === 200 && d2o.status === 200 && d1.j.order?.total === 80000 && d2o.j.order?.total === 80000 && d2o.j.order?.discount === d1.j.order?.discount, mt(d1) + ' ' + d1.j.order?.total + ' / ' + mt(d2o) + ' ' + d2o.j.order?.total);
  const ctOrders = (doc('server', 'routes', 'orders.js') + doc('server', 'utils', 'donApp.js') + doc('server', 'utils', 'uuDai.js')).includes('pos_chuong_trinh');
  k('K5g đường tạo đơn (orders.js, donApp.js, uuDai.js) KHÔNG đọc pos_chuong_trinh (phần áp là CT-1b)', !ctOrders);

  // ═════════════ D. Giao diện (đọc tĩnh) ═════════════
  muc('D. Giao diện quầy (đọc tĩnh)');
  const st = doc('client', 'src', 'pages', 'Settings.jsx');
  const ctJsx = doc('client', 'src', 'pages', 'CaiDat', 'ChuongTrinh.jsx');
  const cus = doc('client', 'src', 'pages', 'Customers.jsx');
  const apiJs = doc('client', 'src', 'utils', 'api.js');
  k('D1 Settings.jsx có thẻ chuongTrinh (quyền manage_promotions, nhóm Khách hàng) và nạp CaiDat/ChuongTrinh', /chuongTrinh: 'manage_promotions'/.test(st) && /\['chuongTrinh', 'manage_promotions'\]/.test(st) && /CaiDat\/ChuongTrinh/.test(st));
  k('D2 ChuongTrinh.jsx gọi qua utils/api.js; không fetch trần; xoá KHÔNG dùng hộp thoại trình duyệt (bấm 2 lần)',
    ctJsx.length > 500 && /from '\.\.\/\.\.\/utils\/api'/.test(ctJsx) && !/\bfetch\s*\(/.test(ctJsx) && !/window\.confirm|\bconfirm\s*\(|\balert\s*\(/.test(ctJsx));
  k('D3 api.js có chuongTrinhApi (danh sách · tạo · sửa · xoá · khoảng tuổi) và khachApi/ngay-sinh', /chuongTrinhApi/.test(apiJs) && /ngay-sinh/.test(apiJs));
  k('D4 Customers.jsx có ô Ngày sinh gọi qua api.js (không fetch trần mới)', /ngay_sinh/.test(cus) && /ngaySinh|ngay-sinh/i.test(cus) && !/fetch\(`\/api\/pos\/v2\/customers\/\$\{[^}]*\}\/ngay-sinh/.test(cus));
  k('D5 Customers.jsx: sửa ngày sinh đã có chỉ hiện khi hasPermission(sua_ngay_sinh) và bắt nhập lý do', /hasPermission\('sua_ngay_sinh'\)/.test(cus) && /ly_do|lyDo/.test(cus));

  // ═════════════ A+. Giới hạn lượt (CHẠY CUỐI) ═════════════
  muc('A+. Cửa công khai /chuong-trinh có trần lượt theo IP (chung bộ đếm với /menu: 300 lần / phút / IP)');
  let truoc = 0; // số lượt /chuong-trinh không token đã gọi ở trên: C7, C8 dùng cp (1) → đếm lại cho chắc bằng cách gọi tới khi gặp 429
  let lan429 = 0;
  for (let i = 1; i <= 320; i++) { const r = await kh('GET', '/chuong-trinh'); if (r.status === 429) { lan429 = i; k('A17b 429 mang code QUA_NHIEU_LAN', r.j.code === 'QUA_NHIEU_LAN', mt(r)); break; } truoc = i; }
  k('A17 gọi dồn không token → bị 429 trước lượt thứ 320 (trần 300 / phút / IP; đã có 2–3 lượt ở trên)', lan429 >= 295 && lan429 <= 300, `429 đầu tiên ở lượt ${lan429 || 'không có'} (đạt ${truoc} lượt 200)`);

  sv.close();
  return ket();
}

function ket() {
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
