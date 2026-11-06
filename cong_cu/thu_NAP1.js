#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ NAP-1 — gói nạp ở quầy, ví hai ngăn (tiền nạp / thưởng nạp), điểm khi tiêu ví, sổ sách tiền nạp
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_NAP1.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến, viec/NAP-1/dot_bien.py). bat_bien.js nạp từ <may-chu>/../cong_cu/gia_lap.
 *
 *  Khuôn thu_DIEMTHAT1.js: database.js thật + libsql thật trên kho TẠM, SX giả. co.mocTruocTx chạy TRỌN một lệnh khác trước khi giao
 *  dịch kế tiếp mở (hai quầy chồng nhau TẤT ĐỊNH). Mỗi mục [A]…[K] ánh xạ mục Nghiệm thu cùng tên của viec/NAP-1/phieu.md.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_nap1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
process.on('exit', () => { try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ } });

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
process.env.JWT_SECRET = 'thu_nap1_' + Date.now();

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const thuNap = (ten) => { try { return require(path.join(MAY_CHU, ...ten)); } catch { return null; } };   // gốc chưa có file → ca đỏ, bài không sập

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();

  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const sxGia = async () => ({ ok: true });
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true, checkStock: async () => ({ sufficient: true, stock: 999 }),
    outStockFIFO: sxGia, inStockReturn: sxGia, callSxApi: sxGia };

  const co = { mocTruocTx: null };
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const moc = co.mocTruocTx; co.mocTruocTx = null;
    if (moc) await moc();
    return txGoc(...a);
  };

  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'wallets', 'signup-codes', 'thanh-toan', 'refunds', 'damages', 'reports', 'packages']) {
    app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  }
  app.use('/api/pos/orders', require(path.join(MAY_CHU, 'routes', 'don-mo-rong.js')));
  const goiNapRoute = thuNap(['routes', 'goi-nap.js']);
  if (goiNapRoute) app.use('/api/pos/goi-nap', goiNapRoute);
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  const { BAT_BIEN } = require(path.join(MAY_CHU, '..', 'cong_cu', 'gia_lap', 'bat_bien.js'));
  const doiSoat = require(path.join(MAY_CHU, 'utils', 'doiSoat.js'));
  const viKhach = thuNap(['utils', 'viKhach.js']) || {};
  const { tienTinhDiem, diemTruKhiHoan } = require(path.join(MAY_CHU, 'utils', 'diemThat.js'));
  const { getToday } = require(path.join(MAY_CHU, 'utils', 'helpers.js'));
  noiLai();

  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => { try { return Number(Object.values((await mot(sql, a)) || { x: NaN })[0]); } catch { return NaN; } };
  const nguoi = async (ten, vai) => Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)",
    [ten, ten, vai])).lastInsertRowid);
  const chu = await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const ky = (id) => jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const THE_CHU = ky(chu.id), THE_NV = ky(await nguoi('nv_nap1', 'staff')), THE_QL = ky(await nguoi('ql_nap1', 'manager'));
  // Chủ quán 06.11 câu 2: tạo / sửa / bật / tắt gói nạp chỉ owner + PIN chủ quán (utils/pinChuQuan.js của HANG-1) — đặt sẵn PIN cho bài.
  const PIN = '1357';
  await db.run("INSERT OR REPLACE INTO pos_pin_chu_quan (id, pin_bam, sai, khoa_den, dat_boi, dat_luc) VALUES (1, ?, 0, NULL, 'thu_nap1', ?)",
    [require(path.join(GOC, 'node_modules', 'bcryptjs')).hashSync(PIN, 4), getToday() + 'T00:00:00']);
  const goi = async (method, url, body, the = THE_CHU) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + the } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return Array.isArray(j) ? { data: j, status: r.status } : { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;
  const datCaiDat = (key, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
  for (const [key, v] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', 1000], ['loyalty_expiry_mode', 'none'],
    ['flash_enabled', 'false'], ['nhandiem_enabled', 1], ['nhandiem_he_so', 2]]) await datCaiDat(key, v);

  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 2');
  const GIA = [21000, 20000];
  for (const [i, g] of GIA.entries()) await db.run('UPDATE pos_products SET price = ? WHERE id = ?', [g, sp[i].id]);
  const mon = (i) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type, sx_product_id: sp[i].sx_product_id, quantity: 1 });
  let soSdt = 0;
  const sdtMoi = () => '0938' + String(400000 + (++soSdt));
  const ban = (body) => goi('POST', '/orders', { customer_name: 'Khách NAP-1', items: [mon(0)], ...body });
  const banNap = (sdt, goiId, them = {}, the = THE_CHU) => goi('POST', '/orders', { customer_phone: sdt, customer_name: 'Khách NAP-1', items: [],
    goi_nap_id: goiId, payment_method: 'cash', cash_amount: 100000, ...them }, the);
  const vi = async (sdt) => {
    try { const w = await mot('SELECT balance, thuong FROM pos_wallets WHERE phone = ?', [sdt]); return { so_du: Number(w?.balance || 0), thuong: Number(w?.thuong || 0), co: !!w && w.thuong !== undefined }; }
    catch { return { so_du: NaN, thuong: NaN, co: false }; }
  };
  const viChu = (v) => `số dư ${v.so_du} · thưởng ${v.thuong}`;
  const soDon = () => so('SELECT COUNT(*) FROM pos_orders');
  const diemDon = (id) => so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ?', [id]);
  const q = (sql, a) => db.query(sql, a);
  const lechBB = async (ds = ['I4', 'I6', 'I8', 'I11', 'I15', 'I18', 'I19']) => {
    const ra = [];
    for (const t of ds) { try { ra.push(...(await BAT_BIEN[t](q, {})).map((x) => `${t} ${x}`)); } catch (e) { ra.push(`${t} sập: ${e.message}`); } }
    return ra;
  };
  const napTay = async (sdt, tien) => {
    const r = await goi('POST', '/wallets/topup', { phone: sdt, amount: tien, customer_name: 'Khách NAP-1', payment_method: 'cash' });
    if (r.status !== 200) k(`chuẩn bị: nạp tay ${tien} vào ${sdt} → 200`, false, moTa(r));   // không ném: bài chạy tiếp, đột biến được tính BẮT / LẠC đúng
  };
  const homNay = getToday();

  console.log('\nTHỬ NAP-1 — gói nạp, ví hai ngăn, điểm khi tiêu ví, sổ sách tiền nạp');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[M] Bước nâng cấp 014: bảng gói nạp + cột thưởng của ví và sổ ví');
  {
    const cot = async (bang) => (await db.query(`PRAGMA table_info(${bang})`)).map((c) => c.name);
    const bang = await so("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'pos_goi_nap'");
    k('M1 có bảng pos_goi_nap, cột pos_wallets.thuong, pos_balance_transactions.thuong',
      bang === 1 && (await cot('pos_wallets')).includes('thuong') && (await cot('pos_balance_transactions')).includes('thuong'));
    const { chayNangCap } = require(path.join(MAY_CHU, 'nang_cap', 'chay.js'));
    imLang(); const lai = await chayNangCap(db); noiLai();
    k('M2 chạy lại bộ nâng cấp → không hỏng, không chạy đôi', !lai.hong && (await so("SELECT COUNT(*) FROM pos_nang_cap WHERE ten = '014_nap'")) === 1, JSON.stringify(lai));
    const { BACKUP_TABLES } = (() => { try { return { BACKUP_TABLES: require(path.join(MAY_CHU, 'routes', 'backup.js')).BACKUP_TABLES }; } catch { return {}; } })();
    const src = fs.readFileSync(path.join(MAY_CHU, 'routes', 'backup.js'), 'utf8');
    k("M3 pos_goi_nap trong BACKUP_TABLES (xuất / sao lưu được)", (BACKUP_TABLES || []).some?.((t) => t.name === 'pos_goi_nap') || /name: 'pos_goi_nap'/.test(src));
    // Chủ quán 06.11 câu 2: gói nạp chỉ sửa được có PIN chủ quán → file sao lưu cũ không được ghi đè (khuôn pos_membership_tiers của HANG-1).
    const iKP = src.indexOf('const BANG_KHONG_KHOI_PHUC'), khongKP = iKP >= 0 ? src.slice(iKP, src.indexOf('];', iKP)) : '';
    k("M4 pos_goi_nap trong BANG_KHONG_KHOI_PHUC (khôi phục bằng file không vượt PIN chủ quán)", khongKP.includes("'pos_goi_nap'"), khongKP ? '' : 'không thấy BANG_KHONG_KHOI_PHUC');
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] Gói nạp: thêm / sửa / bật / tắt; khách trả > 0, vào tài khoản ≥ khách trả; CHỈ chủ quán + PIN chủ quán (chủ quán 06.11)');
  const taoGoi = (b, the) => goi('POST', '/goi-nap', { pin: PIN, ...b }, the);
  const suaGoi = (id, b, the) => goi('PUT', `/goi-nap/${id}`, { pin: PIN, ...b }, the);
  const g1 = await taoGoi({ ten: 'Nạp 100k', khach_tra: 100000, vao_tk: 105000 });
  k('A1 tạo gói 100.000 → 105.000 → 200', g1.status === 200 && Number(g1.data?.id || g1.id) > 0, moTa(g1));
  const ID1 = Number(g1.data?.id || g1.id);
  const sai = [];
  for (const b of [{ khach_tra: 0, vao_tk: 0 }, { khach_tra: -5, vao_tk: 10 }, { khach_tra: 1000.5, vao_tk: 2000 }, { khach_tra: '100000', vao_tk: 105000 },
    { khach_tra: 100000 }, { khach_tra: 100000, vao_tk: 105000, ten: '   ' }]) {
    const r = await taoGoi({ ten: 'Sai', ...b });
    if (!(r.status === 400 && r.code === 'GOI_NAP_KHONG_HOP_LE')) sai.push(`${JSON.stringify(b)} → ${moTa(r)}`);
  }
  k('A2 khách trả 0 / âm / lẻ / chuỗi, thiếu vào tài khoản, tên trống → 400 GOI_NAP_KHONG_HOP_LE', sai.length === 0, sai.join(' | '));
  const a3 = await taoGoi({ ten: 'Lỗ', khach_tra: 100000, vao_tk: 99999 });
  k('A3 vào tài khoản 99.999 < khách trả 100.000 → 400', a3.status === 400 && a3.code === 'GOI_NAP_KHONG_HOP_LE', moTa(a3));
  const a4 = await taoGoi({ ten: 'Bằng', khach_tra: 50000, vao_tk: 50000 });
  k('A4 vào tài khoản = khách trả (ngay trên ngưỡng) → 200', a4.status === 200, moTa(a4));
  const ID_BANG = Number(a4.data?.id || a4.id);
  const a5 = await taoGoi({ ten: 'NV', khach_tra: 10000, vao_tk: 11000 }, THE_NV);
  const a5b = await suaGoi(ID1, { is_active: 0 }, THE_NV);
  const a5c = await taoGoi({ ten: 'QL', khach_tra: 10000, vao_tk: 11000 }, THE_QL);
  const a5d = await suaGoi(ID1, { vao_tk: 1000000 }, THE_QL);
  const a5e = await suaGoi(ID1, { is_active: 0 }, THE_QL);
  const sauA5 = await mot('SELECT vao_tk, is_active FROM pos_goi_nap WHERE id = ?', [ID1]).catch(() => null);
  const chiChu = [a5, a5b, a5c, a5d, a5e].every((r) => r.status === 403 && r.code === 'CHI_CHU_QUAN');
  k('A5 nhân viên VÀ quản lý (có quyền manage_products) gửi đúng PIN: thêm / sửa / tắt → 403 CHI_CHU_QUAN, gói giữ nguyên',
    chiChu && (await so("SELECT COUNT(*) FROM pos_goi_nap WHERE ten IN ('NV', 'QL')")) === 0 && Number(sauA5?.vao_tk) === 105000 && Number(sauA5?.is_active) === 1,
    [a5, a5b, a5c, a5d, a5e].map(moTa).join(' · '));
  const a8a = await goi('POST', '/goi-nap', { ten: 'Không PIN', khach_tra: 10000, vao_tk: 11000 });
  const a8b = await taoGoi({ ten: 'Sai PIN', khach_tra: 10000, vao_tk: 11000, pin: '9999' });
  const a8c = await goi('PUT', `/goi-nap/${ID1}`, { is_active: 0 });
  const a8d = await suaGoi(ID1, { vao_tk: 1000000, pin: '135' });
  const sauA8 = await mot('SELECT vao_tk, is_active FROM pos_goi_nap WHERE id = ?', [ID1]).catch(() => null);
  k('A8 chủ quán thiếu / sai PIN: thêm, tắt, sửa → 400 PIN_CHU_QUAN_SAI, không tạo, gói giữ nguyên',
    [a8a, a8b, a8c, a8d].every((r) => r.status === 400 && r.code === 'PIN_CHU_QUAN_SAI')
      && (await so("SELECT COUNT(*) FROM pos_goi_nap WHERE ten IN ('Không PIN', 'Sai PIN')")) === 0 && Number(sauA8?.vao_tk) === 105000 && Number(sauA8?.is_active) === 1,
    [a8a, a8b, a8c, a8d].map(moTa).join(' · '));
  const g3 = await taoGoi({ ten: 'Nạp 20k', khach_tra: 20000, vao_tk: 21000 });
  const ID3 = Number(g3.data?.id || g3.id);
  const gTat = await taoGoi({ ten: 'Sẽ tắt', khach_tra: 30000, vao_tk: 33000 });
  const ID_TAT = Number(gTat.data?.id || gTat.id);
  const a6 = await suaGoi(ID_TAT, { is_active: 0 });
  const dsQuay = await goi('GET', '/goi-nap', null, THE_NV);
  const dsHet = await goi('GET', '/goi-nap/tat-ca');
  const thay = (r, id) => (r.data || []).some((x) => Number(x.id) === id);
  k('A6 tắt gói → 200; quầy (GET /goi-nap) không thấy gói tắt, thấy gói bật; Cài đặt (tat-ca) thấy cả hai',
    a6.status === 200 && dsQuay.status === 200 && !thay(dsQuay, ID_TAT) && thay(dsQuay, ID1) && thay(dsHet, ID_TAT) && thay(dsHet, ID1),
    `${moTa(a6)} · quầy ${JSON.stringify((dsQuay.data || []).map((x) => x.id))} · tất cả ${JSON.stringify((dsHet.data || []).map((x) => x.id))}`);
  const a6b = await suaGoi(ID1, { vao_tk: 90000 });
  const a6c = await suaGoi(ID_BANG, { ten: 'Bằng tiền', vao_tk: 52000 });
  const giuNguyen = await mot('SELECT vao_tk FROM pos_goi_nap WHERE id = ?', [ID1]).catch(() => null);
  k('A6b sửa thành vào tài khoản < khách trả → 400, gói giữ nguyên; sửa hợp lệ → 200',
    a6b.status === 400 && Number(giuNguyen?.vao_tk) === 105000 && a6c.status === 200, `${moTa(a6b)} · ${moTa(a6c)}`);
  const sTat = sdtMoi();
  const a7 = await banNap(sTat, ID_TAT, { cash_amount: 30000 });
  const a9 = [await banNap(sdtMoi(), ID3, { cash_amount: 20000 }, THE_NV), await banNap(sdtMoi(), ID3, { cash_amount: 20000 }, THE_QL)];
  const dsQL = await goi('GET', '/goi-nap', null, THE_QL);
  k('A9 (K5) nhân viên và quản lý vẫn thấy gói đang bật và BÁN gói ở quầy → 200',
    a9.every((r) => r.status === 200 && r.order?.total === 20000) && thay(dsQuay, ID3) && thay(dsQL, ID3), a9.map(moTa).join(' · ') + ' · ' + moTa(dsQL));
  k('A7 bán gói đang tắt → 400 GOI_NAP_KHONG_CO, ví không có', a7.status === 400 && a7.code === 'GOI_NAP_KHONG_CO' && (await vi(sTat)).so_du === 0, moTa(a7));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] Bán gói ở quầy: bắt buộc khách, máy chủ tra gói, chỉ tiền mặt / QR, không gộp; thu đủ → cộng ngay cùng giao dịch');
  const s1 = sdtMoi();
  const b1 = await banNap(s1, ID1);
  const v1 = await vi(s1);
  const dongB1 = b1.order ? await mot('SELECT type, amount, thuong, order_id, payment_method FROM pos_balance_transactions WHERE customer_phone = ? AND order_id = ?', [s1, b1.order.id]).catch(() => null) : null;
  k('B1 bán gói 100.000 tiền mặt → đơn tổng 100.000; ví 105.000 (thưởng 5.000); sổ topup 105.000 · thưởng 5.000 gắn đơn · cash',
    b1.status === 200 && b1.order?.total === 100000 && v1.so_du === 105000 && v1.thuong === 5000 && dongB1?.type === 'topup'
      && Number(dongB1.amount) === 105000 && Number(dongB1.thuong) === 5000 && dongB1.payment_method === 'cash',
    `${moTa(b1)} · ${viChu(v1)} · ${JSON.stringify(dongB1)}`);
  const B1_ID = b1.order?.id;
  const s2 = sdtMoi();
  const p2 = await goi('POST', '/thanh-toan/phien', { cach: 'ck_tay', don: { customer_phone: s2, customer_name: 'Khách NAP-1', goi_nap_id: ID1 } });
  const c2 = p2.phien ? await goi('POST', `/thanh-toan/phien/${p2.phien.id}/xac-nhan-tay`, { ly_do: 'Đã thấy tiền về tài khoản quán' }) : p2;
  const v2 = await vi(s2);
  const dongB2 = await mot("SELECT payment_method, thuong FROM pos_balance_transactions WHERE customer_phone = ? AND type = 'topup'", [s2]).catch(() => null);
  k('B2 phiên chuyển khoản (QR, chốt qua chotPhien) → phải trả 100.000; ví 105.000 · thưởng 5.000; sổ cách transfer',
    p2.status === 200 && p2.phien?.con_lai === 100000 && c2.status === 200 && v2.so_du === 105000 && v2.thuong === 5000 && dongB2?.payment_method === 'transfer',
    `${moTa(p2)} · ${moTa(c2)} · ${viChu(v2)} · ${JSON.stringify(dongB2)}`);
  const s3 = sdtMoi();
  const truocB3 = await soDon();
  const b3 = await banNap(s3, ID1, { cash_amount: 105000 });
  const b3b = await banNap(s3, ID1, { cash_amount: 100000, items: [], unit_price: 1, total: 1 });
  k('B3 máy chủ tự tra giá gói: gửi 105.000 → 400 (lệch tổng); gửi kèm unit_price / total giả → tổng vẫn 100.000',
    b3.status === 400 && b3b.status === 200 && b3b.order?.total === 100000 && (await soDon()) === truocB3 + 1, `${moTa(b3)} · ${moTa(b3b)}`);
  const s4 = sdtMoi();
  const b4a = await goi('POST', '/orders', { items: [], goi_nap_id: ID1, payment_method: 'cash', cash_amount: 100000 });
  const b4b = await banNap('   ', ID1);
  const b4c = await banNap(null, ID1);
  k('B4 không SĐT / SĐT trống / SĐT null → 400 NAP_CAN_KHACH', [b4a, b4b, b4c].every((r) => r.status === 400 && r.code === 'NAP_CAN_KHACH'),
    [b4a, b4b, b4c].map(moTa).join(' | '));
  const b5 = await banNap(s4, ID1, { items: [mon(0)], cash_amount: 121000 });
  const b5b = await banNap(s4, ID1, { membership_buy: { tier_id: 1, so_thang: 1 } });
  const b5c = await banNap(s4, ID1, { package_buy: { package_id: 1 } });
  k('B5 gói nạp kèm món / mua thẻ / mua gói → 400 NAP_KHONG_GOP, ví không đổi',
    [b5, b5b, b5c].every((r) => r.status === 400 && r.code === 'NAP_KHONG_GOP') && (await vi(s4)).so_du === 0, [b5, b5b, b5c].map(moTa).join(' | '));
  await napTay(s4, 200000);
  const b6 = [await banNap(s4, ID1, { cash_amount: 0, balance_amount: 100000 }), await banNap(s4, ID1, { cash_amount: 0, payment_method: 'balance' }),
    await banNap(sdtMoi(), ID1, { cash_amount: 0, parent_phone: s4, parent_balance_amount: 100000 }),
    await banNap(s4, ID1, { cash_amount: 50000, balance_amount: 50000 })];
  k('B6 trả gói nạp bằng ví / payment_method balance / ví mẹ / ví một phần → 400 NAP_CHI_TIEN_MAT_QR, ví không đổi',
    b6.every((r) => r.status === 400 && r.code === 'NAP_CHI_TIEN_MAT_QR') && (await vi(s4)).so_du === 200000, b6.map(moTa).join(' | '));
  const soPhien = () => so('SELECT COUNT(*) FROM pos_phien_thanh_toan');
  const truocB7 = await soPhien();
  const b7 = [await goi('POST', '/thanh-toan/phien', { cach: 'tien_mat', tru_tai_khoan: true, pin: '1234', don: { customer_phone: s4, goi_nap_id: ID1 } }),
    await goi('POST', '/thanh-toan/phien', { cach: 'tai_khoan', tru_tai_khoan: true, pin: '1234', don: { customer_phone: s4, goi_nap_id: ID1 } }),
    await goi('POST', '/thanh-toan/phien', { cach: 'tien_mat', tru_tai_khoan_me: true, pin_me: '1234', don: { customer_phone: sdtMoi(), parent_phone: s4, goi_nap_id: ID1 } })];
  k('B7 phiên trừ tài khoản / cách tai_khoan / tài khoản mẹ cho gói nạp → 400 NAP_CHI_TIEN_MAT_QR, không giữ phiên',
    b7.every((r) => r.status === 400 && r.code === 'NAP_CHI_TIEN_MAT_QR') && (await soPhien()) === truocB7, b7.map(moTa).join(' | '));
  const b8 = await banNap(s4, ID1, { discount_code: 'GIAM10' });
  k('B8 gói nạp kèm mã giảm → 400 NAP_CHI_TIEN_MAT_QR', b8.status === 400 && b8.code === 'NAP_CHI_TIEN_MAT_QR', moTa(b8));
  const b9 = await banNap(s4, ID1, { cash_amount: 50000, debt_amount: 50000 });
  const b9b = await banNap(s4, ID1, { cash_amount: 97000, shipping_fee: 3000 });
  k('B9 gói nạp ghi nợ / có phí giao → 400', b9.status === 400 && b9.code === 'NAP_CHI_TIEN_MAT_QR' && b9b.status === 400 && b9b.code === 'NAP_CHI_TIEN_MAT_QR',
    `${moTa(b9)} · ${moTa(b9b)}`);
  const s10 = sdtMoi(), truocB10 = await soDon();
  const p10 = await goi('POST', '/thanh-toan/phien', { cach: 'ck_tay', don: { customer_phone: s10, goi_nap_id: ID1 } });
  const h10 = p10.phien ? await goi('POST', `/thanh-toan/phien/${p10.phien.id}/huy`) : p10;
  const c10 = p10.phien ? await goi('POST', `/thanh-toan/phien/${p10.phien.id}/xac-nhan-tay`, { ly_do: 'Bấm nhầm sau khi huỷ phiên' }) : p10;
  k('B10 phiên nạp huỷ trước khi thu → không đơn, ví không có; xác nhận sau huỷ → 409',
    p10.status === 200 && h10.status === 200 && c10.status === 409 && (await soDon()) === truocB10 && (await vi(s10)).so_du === 0,
    `${moTa(p10)} · ${moTa(h10)} · ${moTa(c10)}`);
  const s11 = sdtMoi(), truocB11 = await soDon();
  await db.run("CREATE TRIGGER thu_nap1_hong BEFORE INSERT ON pos_balance_transactions WHEN NEW.type = 'topup' AND NEW.customer_phone = '" + s11 + "' BEGIN SELECT RAISE(ABORT, 'cay loi'); END");
  const b11 = await banNap(s11, ID1);
  await db.run('DROP TRIGGER thu_nap1_hong');
  k('B11 ghi sổ ví hỏng giữa giao dịch → rollback: không đơn, ví không có', b11.status >= 500 && (await soDon()) === truocB11 && (await vi(s11)).so_du === 0, moTa(b11));
  const s12 = sdtMoi();
  const p12 = await goi('POST', '/thanh-toan/phien', { cach: 'tien_mat', don: { customer_phone: s12, goi_nap_id: ID1 } });
  let c12a = null;
  co.mocTruocTx = async () => { c12a = await goi('POST', `/thanh-toan/phien/${p12.phien?.id}/chot`, { cash_received: 100000 }); };
  const c12b = await goi('POST', `/thanh-toan/phien/${p12.phien?.id}/chot`, { cash_received: 100000 });
  co.mocTruocTx = null;
  const v12 = await vi(s12);
  k('B12 hai quầy cùng chốt một phiên nạp → đúng một lần cộng (105.000 · 5.000), lệnh sau 409',
    p12.status === 200 && c12a?.status === 200 && c12b.status === 409 && v12.so_du === 105000 && v12.thuong === 5000
      && (await so("SELECT COUNT(*) FROM pos_balance_transactions WHERE customer_phone = ? AND type = 'topup'", [s12])) === 1,
    `${moTa(p12)} · ${c12a && moTa(c12a)} · ${moTa(c12b)} · ${viChu(v12)}`);
  const hang = await mot("SELECT * FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order LIMIT 1");
  await db.run('UPDATE pos_membership_tiers SET discount_percent = 10 WHERE id = ?', [hang.id]);
  const sV = sdtMoi();
  await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, purchased_at, expires_at, created_by, loai, so_thang)
    VALUES (?, ?, ?, 0, '2026-01-01T00:00:00', '9999-12-31T23:59:59', 'thu', 'cap', NULL)`, [sV, hang.id, hang.name]);
  const doiChung = await ban({ customer_phone: sV, payment_method: 'cash', cash_amount: 18900 });
  const b13 = await banNap(sV, ID1);
  k('B13 khách có hạng (đơn món đối chứng được giảm 10 %) mua gói nạp → tổng 100.000, không giảm hạng',
    doiChung.status === 200 && doiChung.order?.tier_discount === 2100 && b13.status === 200 && b13.order?.total === 100000 && !(b13.order?.tier_discount > 0),
    `đối chứng ${moTa(doiChung)} giảm ${doiChung.order?.tier_discount} · ${moTa(b13)} tổng ${b13.order?.total}`);
  const b14 = await goi('POST', '/orders/tinh-thu', { customer_phone: s4, customer_name: 'Khách NAP-1', items: [], goi_nap_id: ID1 });
  k('B14 tinh-thu giỏ gói nạp → tổng 100.000 (màn Bán hàng hỏi giá)', b14.status === 200 && Number(b14.total) === 100000, moTa(b14) + ' · ' + b14.total);
  k('B15 bất biến I4 · I6 · I8 · I11 · I15 · I18 · I19 = 0 lệch sau phần bán gói', (await lechBB()).length === 0, (await lechBB()).join(' | '));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] Ví hai ngăn: trừ theo TỶ LỆ, cộng lại đúng ngăn đã trừ, tổng hai ngăn = số dư');
  {
    const f = viKhach.thuongKhiTru;
    const ca = [[[105000, 5000, 21000], 1000], [[21000, 1000, 21000], 1000], [[21000, 1000, 30000], 1000], [[0, 0, 5000], 0], [[-5, 0, 10], 0],
      [[100, 0, 50], 0], [[10, 8, 3], 2], [[3, 2, 2], 1], [[5, 4, 3], 2], [[10, 9, 5], 5]];
    const lech = typeof f === 'function' ? ca.filter(([a, n]) => f(...a) !== n).map(([a, n]) => `${a} → ${f(...a)} (đúng ${n})`) : ['không có hàm'];
    const tienNapKhongAm = typeof f === 'function' && ca.every(([[d, t, x]]) => x >= d || d <= 0 || (d - x) - (t - f(d, t, x)) >= 0);
    k('C0 thuongKhiTru (utils/viKhach.js): tỷ lệ làm tròn, trừ hết số dư = hết thưởng, số dư ≤ 0 → 0, tiền nạp sau trừ không âm', lech.length === 0 && tienNapKhongAm, lech.join(' | '));
    const h = viKhach.thuongKhiHoan;
    // [ví đã trừ, thưởng đã trừ, thưởng đã trả lại, ví đã cộng lại, khoản cộng lần này] → phần thưởng
    const txGia = (vi, th, tra, hoan) => ({ queryOne: async () => ({ vi_tru: vi, thuong_tru: th, thuong_tra: tra, vi_hoan: hoan }) });
    const caH = [[[42000, 2000, 0, 0, 10500], 500], [[42000, 2000, 500, 10500, 21000], 1000], [[63000, 2032, 0, 0, 21000], 677],
      [[63000, 2032, 1354, 42000, 21000], 678], [[63000, 2032, 1354, 41999, 21000], 677], [[3, 2, 1, 1, 1], 1], [[30, 20, 19, 0, 15], 1], [[3, 2, 2, 1, 2], 0], [[0, 0, 0, 0, 5000], 0],
      [[21000, 0, 0, 0, 21000], 0], [[21000, 1000, 0, 0, 0], 0], [[21000, 1000, 0, 0, 30000], 1000]];
    const lechH = [];
    if (typeof h === 'function') for (const [[vi, th, tra, hoan, x], n] of caH) { const r = await h(txGia(vi, th, tra, hoan), 's', 1, x); if (r !== n) lechH.push(`${[vi, th, tra, hoan, x]} → ${r} (đúng ${n})`); }
    else lechH.push('không có hàm');
    k('C0b thuongKhiHoan: tỷ lệ thưởng / ví của phần đã trừ, lần làm đủ phần ví trả NỐT thưởng (số lẻ), không vượt phần chưa trả, ví chưa trừ → 0', lechH.length === 0, lechH.join(' | '));
    // Vòng sửa 4 (soát vòng 3 lỗi 1): lần "trả nốt" sau nhiều lần cộng nhỏ làm tròn về 0 — phần thưởng KHÔNG vượt chính khoản cộng (mọi nhánh).
    const caT = [[[7, 3, 0, 6, 1], 1], [[7, 3, 0, 5, 2], 2], [[7, 3, 0, 4, 3], 3], [[7, 3, 0, 0, 7], 3], [[100, 99, 0, 99, 1], 1], [[10, 9, 0, 0, 1], 1]];
    const lechT = [];
    if (typeof h === 'function') {
      for (const [[vi, th, tra, hoan, x], n] of caT) { const r = await h(txGia(vi, th, tra, hoan), 's', 1, x); if (r !== n) lechT.push(`${[vi, th, tra, hoan, x]} → ${r} (đúng ${n})`); }
      for (const [[vi, th, tra, hoan, x]] of caH) { const r = await h(txGia(vi, th, tra, hoan), 's', 1, x); if (r > Math.max(x, 0)) lechT.push(`${[vi, th, tra, hoan, x]} → ${r} > khoản ${x}`); }
    } else lechT.push('không có hàm');
    k('C0c thuongKhiHoan: phần thưởng của một lần cộng lại ≤ chính khoản cộng, kể cả lần "trả nốt" (đã trừ 7 · thưởng 3 · đã cộng 6 · lần này 1 → 1)', lechT.length === 0, lechT.join(' | '));
  }
  const c1 = await ban({ customer_phone: s1, payment_method: 'balance', balance_amount: 21000 });
  const vc1 = await vi(s1);
  const dongC1 = c1.order ? await mot("SELECT amount, thuong FROM pos_balance_transactions WHERE order_id = ? AND type = 'purchase'", [c1.order.id]).catch(() => null) : null;
  k('C1 ví 105.000 (thưởng 5.000) trả đơn 21.000 → trừ thưởng 1.000 + nạp 20.000; ví 84.000 · thưởng 4.000',
    c1.status === 200 && vc1.so_du === 84000 && vc1.thuong === 4000 && Number(dongC1?.thuong) === -1000, `${moTa(c1)} · ${viChu(vc1)} · ${JSON.stringify(dongC1)}`);
  const sC2 = sdtMoi();
  await banNap(sC2, ID3, { cash_amount: 20000 });
  const c2x = await ban({ customer_phone: sC2, payment_method: 'balance', balance_amount: 21000 });
  const vc2 = await vi(sC2);
  k('C2 ví 21.000 (thưởng 1.000) trả hết → số dư 0, thưởng 0', c2x.status === 200 && vc2.so_du === 0 && vc2.thuong === 0, `${moTa(c2x)} · ${viChu(vc2)}`);
  const sMe = sdtMoi(), sCon = sdtMoi();
  await banNap(sMe, ID1);
  const c3 = await ban({ customer_phone: sCon, parent_phone: sMe, payment_method: 'cash', parent_balance_amount: 21000 });
  const vMe = await vi(sMe);
  k('C3 ví mẹ 105.000 (thưởng 5.000) trả hộ 21.000 → ví mẹ 84.000 · thưởng 4.000', c3.status === 200 && vMe.so_du === 84000 && vMe.thuong === 4000,
    `${moTa(c3)} · ${viChu(vMe)}`);
  const sC4 = sdtMoi();
  await banNap(sC4, ID1);
  const c4a = await goi('POST', '/wallets/deduct', { phone: sC4, amount: 21000, notes: 'trừ tay' });
  const vC4a = await vi(sC4);
  const c4b = await goi('POST', '/wallets/adjust', { phone: sC4, amount: -21000, reason: 'điều chỉnh giảm' });
  const vC4b = await vi(sC4);
  const c4c = await goi('POST', '/wallets/adjust', { phone: sC4, amount: 10000, reason: 'điều chỉnh tăng' });
  const vC4c = await vi(sC4);
  k('C4 /deduct 21.000 → thưởng 4.000; /adjust −21.000 → thưởng 3.000; /adjust +10.000 → tiền nạp (thưởng giữ 3.000)',
    c4a.status === 200 && vC4a.thuong === 4000 && c4b.status === 200 && vC4b.thuong === 3000 && c4c.status === 200 && vC4c.so_du === 73000 && vC4c.thuong === 3000,
    `${viChu(vC4a)} · ${viChu(vC4b)} · ${viChu(vC4c)}`);
  const c5 = c1.order ? await goi('PUT', `/orders/${c1.order.id}/cancel`, { reason: 'thử huỷ' }) : c1;
  const vc5 = await vi(s1);
  k('C5 huỷ đơn C1 → ví về 105.000 · thưởng 5.000 (trả đúng ngăn)', c5.status === 200 && vc5.so_du === 105000 && vc5.thuong === 5000, `${moTa(c5)} · ${viChu(vc5)}`);
  const c6a = await ban({ customer_phone: s1, payment_method: 'balance', balance_amount: 21000 });
  const c6x = c6a.order ? await goi('DELETE', `/orders/${c6a.order.id}`) : c6a;
  const vc6 = await vi(s1);
  const c6b = await ban({ customer_phone: s1, payment_method: 'balance', balance_amount: 21000 });
  const yc = c6b.order ? await goi('POST', '/refunds', { order_id: c6b.order.id, reason: 'thử hoàn' }) : c6b;
  const dy = yc.refund_id ? await goi('POST', `/refunds/${yc.refund_id}/approve`) : yc;
  const vc6b = await vi(s1);
  k('C6 xoá đơn trả ví → 105.000 · 5.000; duyệt hoàn đơn trả ví → 105.000 · 5.000',
    c6x.status === 200 && vc6.so_du === 105000 && vc6.thuong === 5000 && dy.status === 200 && vc6b.so_du === 105000 && vc6b.thuong === 5000,
    `${moTa(c6x)} · ${viChu(vc6)} · ${moTa(dy)} · ${viChu(vc6b)}`);
  const c7 = await ban({ customer_phone: s1, payment_method: 'balance', balance_amount: 42000, items: [{ ...mon(0), quantity: 2 }] });
  const vc7a = await vi(s1);
  const den = (o, tien) => goi('POST', '/damages', { order_id: o.id, product_code: sp[0].code, quantity: 1, reason: 'damaged', action: 'refund', refund_amount: tien });
  const d7 = c7.order ? await den(c7.order, 10500) : c7;
  const vc7 = await vi(s1);
  const d7b = c7.order ? await den(c7.order, 21000) : c7;
  const vc7b = await vi(s1);
  k('C7 đơn ví 42.000 (thưởng 2.000) → ví 63.000 · 3.000; đền một phần 10.500 → thưởng +500 (tỷ lệ); đền thêm 21.000 → thưởng +1.000',
    c7.status === 200 && vc7a.so_du === 63000 && vc7a.thuong === 3000 && d7.status === 200 && vc7.so_du === 73500 && vc7.thuong === 3500
      && d7b.status === 200 && vc7b.so_du === 94500 && vc7b.thuong === 4500,
    `${moTa(c7)} · ${viChu(vc7a)} · ${moTa(d7)} · ${viChu(vc7)} · ${moTa(d7b)} · ${viChu(vc7b)}`);
  {
    // Số KHÔNG chia hết (K3): ví 155.000 (thưởng 5.000) trả 63.000 → thưởng 2.032; đền 3 lần × 21.000 → 677 + 677 + 678 (lần cuối trả nốt).
    const sL = sdtMoi();
    await banNap(sL, ID1);
    await napTay(sL, 50000);
    const cL = await ban({ customer_phone: sL, payment_method: 'balance', balance_amount: 63000, items: [{ ...mon(0), quantity: 3 }] });
    const thL = cL.order ? -(await so("SELECT thuong FROM pos_balance_transactions WHERE order_id = ? AND type = 'purchase'", [cL.order.id])) : NaN;
    const ra = [];
    for (let i = 0; i < 3; i++) { await (cL.order ? den(cL.order, 21000) : null); ra.push(await so("SELECT COALESCE(SUM(thuong), 0) FROM pos_balance_transactions WHERE order_id = ? AND type = 'compensation'", [cL.order?.id])); }
    const vL = await vi(sL);
    k('C7c đền 3 lần số lẻ: phần thưởng đã trừ 2.032 → trả lại 677 · 1.354 · 2.032 (đủ, không rơi đồng nào sang tiền nạp); ví 155.000 · 5.000',
      cL.status === 200 && thL === 2032 && ra.join() === '677,1354,2032' && vL.so_du === 155000 && vL.thuong === 5000, `${moTa(cL)} · trừ ${thL} · trả ${ra} · ${viChu(vL)}`);
  }
  {
    // Kết thúc gói có hoàn (packages.js → ghiHoan): đơn mua gói 30.000 trả ví 21.000 (thưởng 1.000) + tiền mặt 9.000 → hoàn trọn vào ví.
    const goiId = Number((await db.run("INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active) VALUES ('NAP1G', 'Gói thử NAP-1', 30000, 'ly', 3, 1)")).lastInsertRowid);
    const sG = sdtMoi();
    await banNap(sG, ID1);
    const mua = await goi('POST', '/orders', { customer_phone: sG, customer_name: 'Khách NAP-1', items: [], package_buy: { package_id: goiId }, payment_method: 'cash',
      balance_amount: 21000, cash_amount: 9000 });
    const vG0 = await vi(sG);
    const cp = mua.order ? await mot('SELECT id FROM pos_customer_packages WHERE order_id = ?', [mua.order.id]) : null;
    const kt = cp ? await goi('PUT', `/packages/customer-packages/${cp.id}/cancel`, { reason: 'thử NAP-1 kết thúc gói', hoan: true }) : { status: 0 };
    const vG = await vi(sG);
    const dongG = mua.order ? await db.query("SELECT payment_method AS c, amount AS a, thuong AS t FROM pos_balance_transactions WHERE order_id = ? AND type = 'refund' ORDER BY id", [mua.order.id]) : [];
    k('C13 kết thúc gói có hoàn: ví 84.000 · 4.000 → hoàn phần ví 21.000 (thưởng 1.000) + tiền mặt 9.000 vào ví (tiền nạp) → 114.000 · 5.000',
      mua.status === 200 && vG0.so_du === 84000 && vG0.thuong === 4000 && kt.status === 200 && vG.so_du === 114000 && vG.thuong === 5000
        && JSON.stringify(dongG.map((d) => [d.c, Number(d.a), Number(d.t)])) === JSON.stringify([['cash', 21000, 1000], ['hoan_goi', 9000, 0]]),
      `${moTa(mua)} · ${viChu(vG0)} · ${moTa(kt)} · ${viChu(vG)} · ${JSON.stringify(dongG)}`);
  }
  const sMe7 = sdtMoi(), sCon7 = sdtMoi();
  await banNap(sMe7, ID1);
  await banNap(sCon7, ID1);
  const c7b = await ban({ customer_phone: sCon7, parent_phone: sMe7, payment_method: 'cash', parent_balance_amount: 10000, cash_amount: 11000 });
  const d7c = c7b.order ? await den(c7b.order, 5000) : c7b;
  const vCon7 = await vi(sCon7);
  k('C7b đơn trả ví MẸ + tiền mặt, đền vào ví CON (con không trả ví đơn này) → toàn tiền nạp, thưởng con giữ 5.000',
    c7b.status === 200 && d7c.status === 200 && vCon7.so_du === 110000 && vCon7.thuong === 5000, `${moTa(c7b)} · ${moTa(d7c)} · ${viChu(vCon7)}`);
  const sCu = sdtMoi();
  await napTay(sCu, 50000);
  const vCu0 = await vi(sCu);
  const c8 = await ban({ customer_phone: sCu, payment_method: 'balance', balance_amount: 21000 });
  const vCu = await vi(sCu);
  k('C8 nạp tay /topup (ví cũ) → toàn tiền nạp; trả đơn không trừ thưởng', vCu0.co && vCu0.thuong === 0 && c8.status === 200 && vCu.so_du === 29000 && vCu.thuong === 0,
    `${viChu(vCu0)} · ${moTa(c8)} · ${viChu(vCu)}`);
  const c9 = await lechBB();
  k('C9 chuỗi nạp → trả → huỷ → xoá → hoàn → ví mẹ → đền: I4 · I6 · I8 · I11 · I15 · I18 · I19 = 0 lệch', c9.length === 0, c9.join(' | '));
  const sC10 = sdtMoi();
  await banNap(sC10, ID1);
  let c10a = null;
  co.mocTruocTx = async () => { c10a = await ban({ customer_phone: sC10, payment_method: 'balance', balance_amount: 21000 }); };
  const c10b = await ban({ customer_phone: sC10, payment_method: 'balance', balance_amount: 21000, items: [mon(0)] });
  co.mocTruocTx = null;
  const vC10 = await vi(sC10);
  k('C10 hai quầy cùng trả trên một ví → cả hai qua, ví 63.000 · thưởng 3.000, I4 = 0 lệch',
    c10a?.status === 200 && c10b.status === 200 && vC10.so_du === 63000 && vC10.thuong === 3000 && (await lechBB(['I4'])).length === 0,
    `${c10a && moTa(c10a)} · ${moTa(c10b)} · ${viChu(vC10)}`);
  await db.run('UPDATE pos_wallets SET thuong = thuong + 777 WHERE phone = ?', [sC10]).catch(() => {});
  const lechCay = await lechBB(['I4']);
  const c11 = await goi('POST', `/wallets/${sC10}/reconcile`);
  const vC11 = await vi(sC10);
  await db.run('UPDATE pos_wallets SET thuong = ? WHERE phone = ?', [-1, sCu]).catch(() => {});
  const lechAm = await lechBB(['I4']);
  await goi('POST', `/wallets/${sCu}/reconcile`);
  k('C11 cấy lệch thưởng → I4 báo đúng ví; đối soát ví sửa thưởng về đúng sổ (3.000); thưởng âm → I4 báo',
    lechCay.length === 1 && lechCay[0].includes(sC10) && c11.status === 200 && vC11.thuong === 3000 && lechAm.some((x) => x.includes(sCu))
      && (await lechBB(['I4'])).length === 0, `${lechCay.join(' | ')} · ${moTa(c11)} · ${viChu(vC11)} · ${lechAm.join(' | ')}`);
  {
    const sT = sdtMoi();
    await banNap(sT, ID3, { cash_amount: 20000 });
    await db.run('UPDATE pos_wallets SET thuong = 30000 WHERE phone = ?', [sT]).catch(() => {});
    await db.run('UPDATE pos_balance_transactions SET thuong = 30000 WHERE customer_phone = ?', [sT]).catch(() => {});
    const lechVuot = await lechBB(['I4']);
    await db.run('UPDATE pos_wallets SET thuong = 1000 WHERE phone = ?', [sT]).catch(() => {});
    await db.run('UPDATE pos_balance_transactions SET thuong = 1000 WHERE customer_phone = ?', [sT]).catch(() => {});
    k('C12 thưởng 30.000 > số dư 21.000 (sổ khớp) → I4 báo; trả về 1.000 → 0 lệch', lechVuot.some((x) => x.includes(sT)) && (await lechBB(['I4'])).length === 0,
      lechVuot.join(' | '));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] Tiền nạp không hoàn');
  {
    const truoc = await vi(s1);
    const d1 = await goi('PUT', `/orders/${B1_ID}/cancel`, { reason: 'thử huỷ nạp' });
    const d2 = await goi('DELETE', `/orders/${B1_ID}`);
    const d3 = await goi('POST', '/refunds', { order_id: B1_ID, reason: 'thử hoàn nạp' });
    const ma = await mot('SELECT product_code FROM pos_order_items WHERE order_id = ?', [B1_ID]);
    const d4 = await goi('POST', '/damages', { order_id: B1_ID, product_code: ma?.product_code, quantity: 1, reason: 'damaged', action: 'refund', refund_amount: 1000 });
    const sau = await vi(s1);
    const don = await mot('SELECT status FROM pos_orders WHERE id = ?', [B1_ID]);
    k('D1 huỷ đơn nạp → 400 NAP_KHONG_HOAN', d1.status === 400 && d1.code === 'NAP_KHONG_HOAN', moTa(d1));
    k('D2 xoá đơn nạp → 400 NAP_KHONG_HOAN', d2.status === 400 && d2.code === 'NAP_KHONG_HOAN', moTa(d2));
    k('D3 yêu cầu hoàn đơn nạp → 400 NAP_KHONG_HOAN; D4 đền bù đơn nạp → 400; đơn còn completed, ví không đổi',
      d3.status === 400 && d3.code === 'NAP_KHONG_HOAN' && d4.status === 400 && don?.status === 'completed' && sau.so_du === truoc.so_du && sau.thuong === truoc.thuong, `${moTa(d3)} · ${moTa(d4)} · ${don?.status}`);
    const d5 = await goi('POST', '/wallets/adjust', { phone: s1, amount: -1000, reason: '' });
    k('D5 điều chỉnh tay thiếu lý do → 400 (như cũ)', d5.status === 400, moTa(d5));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] Điểm: nạp KHÔNG tích; trả bằng ví (cả hai ngăn) CÓ tích như tiền mặt');
  {
    const e1 = b1.order ? await diemDon(B1_ID) : NaN;
    k('E1 đơn nạp 100.000 có SĐT → 0 điểm', b1.status === 200 && e1 === 0, `${e1} điểm`);
    const sE = sdtMoi();
    await banNap(sE, ID1);
    const e2 = await ban({ customer_phone: sE, payment_method: 'balance', balance_amount: 21000 });
    k('E2 trả trọn bằng ví 21.000 (có thưởng) → 21 điểm', e2.status === 200 && (await diemDon(e2.order.id)) === 21, `${moTa(e2)} · ${e2.order && await diemDon(e2.order.id)}`);
    const e3 = await ban({ customer_phone: sE, payment_method: 'cash', balance_amount: 10000, cash_amount: 11000 });
    const sCon = sdtMoi();
    const e3b = await ban({ customer_phone: sCon, parent_phone: sE, payment_method: 'transfer', parent_balance_amount: 10000, transfer_amount: 14000, shipping_fee: 3000 });
    k('E3 ví 10.000 + tiền mặt 11.000 → 21 điểm; ví mẹ 10.000 + CK 14.000, phí giao 3.000 → 21 điểm',
      e3.status === 200 && (await diemDon(e3.order.id)) === 21 && e3b.status === 200 && (await diemDon(e3b.order.id)) === 21,
      `${moTa(e3)} · ${e3.order && await diemDon(e3.order.id)} · ${moTa(e3b)} · ${e3b.order && await diemDon(e3b.order.id)}`);
    const e4 = await ban({ customer_phone: sE, payment_method: 'cash', balance_amount: 10000, debt_amount: 11000 });
    const t4 = e4.order ? await goi('POST', `/orders/${e4.order.id}/pay-debt`, { payment_method: 'cash', amount: 11000 }) : e4;
    k('E4 ví 10.000 + nợ 11.000, thu đủ nợ → 21 điểm (cả phần ví)', e4.status === 200 && t4.status === 200 && (await diemDon(e4.order.id)) === 21,
      `${moTa(e4)} · ${moTa(t4)} · ${e4.order && await diemDon(e4.order.id)}`);
    const maBill = await so('SELECT COUNT(*) FROM pos_signup_codes WHERE order_id = ?', [B1_ID]);
    k('E5 đơn nạp không phát mã bill (không có gì để nhận điểm)', b1.status === 200 && !b1.order?.signup_code && maBill === 0, `mã ${b1.order?.signup_code} · ${maBill} dòng`);
    k('E6 tienTinhDiem: ví + ví mẹ + tiền mặt + CK, trần tổng đơn, trừ phí giao',
      tienTinhDiem({ balance_amount: 21000, total: 21000 }) === 21000 && tienTinhDiem({ parent_balance_amount: 10000, transfer_amount: 14000, shipping_fee: 3000, total: 24000 }) === 21000
        && tienTinhDiem({ cash_amount: 21001, total: 21000 }) === 21000 && tienTinhDiem({ balance_amount: 5000 }) === 0,
      `${tienTinhDiem({ balance_amount: 21000, total: 21000 })}`);
    // Soát bảo mật lần 1 (chủ quán 06.11 chọn (a)): DUYỆT HOÀN trả phần tài khoản (con + mẹ) → trừ điểm theo tỷ lệ phần đã hoàn / tiền tính điểm,
    // làm tròn LÊN, giữ điểm phần tiền mặt / CK. Điểm tích theo luật cũ (dòng earn TRƯỚC bước nâng cấp 014 — ví 0 điểm) → không trừ.
    const hoan = async (id) => {
      const y = await goi('POST', '/refunds', { order_id: id, reason: 'thử hoàn điểm' });
      return y.refund_id ? goi('POST', `/refunds/${y.refund_id}/approve`) : y;
    };
    const e7a = await ban({ customer_phone: sE, payment_method: 'balance', balance_amount: 21000 });
    const e7b = await ban({ customer_phone: sE, payment_method: 'cash', balance_amount: 10400, cash_amount: 10600 });
    const sC7 = sdtMoi();
    await napTay(sC7, 5000);
    const e7c = await ban({ customer_phone: sC7, parent_phone: sE, payment_method: 'cash', balance_amount: 5000, parent_balance_amount: 5000, cash_amount: 11000 });
    await napTay(sE, 21000);
    const e7d = await ban({ customer_phone: sE, payment_method: 'balance', balance_amount: 21000 });
    const truoc = [];
    for (const e of [e7a, e7b, e7c, e7d]) truoc.push(e.order ? await diemDon(e.order.id) : NaN);
    if (e7d.order) await db.run("UPDATE pos_point_transactions SET created_at = '2000-01-01T00:00:00' WHERE order_id = ? AND type = 'earn'", [e7d.order.id]);
    const hk = [];
    for (const e of [e7a, e7b, e7c, e7d]) hk.push(e.order ? await hoan(e.order.id) : e);
    const sau = [];
    for (const e of [e7a, e7b, e7c, e7d]) sau.push(e.order ? await diemDon(e.order.id) : NaN);
    const lechI8 = (await lechBB(['I8'])).filter((x) => !e7d.order || !x.includes(e7d.order.code));
    k('E7 duyệt hoàn trừ điểm phần tài khoản: trọn ví 21 → 0; ví 10.400 + tiền mặt 10.600 (21) → trừ 11 (làm tròn LÊN) → 10; con 5.000 + mẹ 5.000 + tiền mặt 11.000 (21) → 11; điểm luật cũ (earn trước 014) → giữ 21; I8 = 0 lệch',
      hk.every((r) => r.status === 200) && JSON.stringify(truoc) === '[21,21,21,21]' && JSON.stringify(sau) === '[0,10,11,21]' && lechI8.length === 0,
      `${hk.map(moTa).join(' · ')} · trước ${JSON.stringify(truoc)} · sau ${JSON.stringify(sau)} · ${lechI8.join(' | ')}`);
    k('E8 diemTruKhiHoan: tỷ lệ làm tròn LÊN, không quá điểm, 0 khi không có điểm / tiền',
      typeof diemTruKhiHoan === 'function' && diemTruKhiHoan(21, 10400, 21000) === 11 && diemTruKhiHoan(21, 10000, 21000) === 10
        && diemTruKhiHoan(21, 24000, 21000) === 21 && diemTruKhiHoan(0, 5000, 21000) === 0 && diemTruKhiHoan(21, 0, 21000) === 0 && diemTruKhiHoan(21, 5000, 0) === 0,
      typeof diemTruKhiHoan === 'function' ? `${diemTruKhiHoan(21, 10400, 21000)}` : 'không có hàm');
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] Sổ sách: két / sao kê đúng ngày, doanh thu không gồm nạp, thưởng nạp đã dùng, quán đang giữ hộ khách');
  {
    const ket = async () => [await doiSoat.tienTheoSo(homNay, homNay, 'cash'), await doiSoat.tienTheoSo(homNay, homNay, 'transfer')];
    const daily = async () => (await goi('GET', `/reports/daily?date=${homNay}`)).order_stats || {};
    const sales = async () => { const r = await goi('GET', `/reports/sales?from=${homNay}&to=${homNay}`); return { ...(r.totals || {}), ky: (r.sales || []).reduce((t, x) => t + Number(x.revenue || 0), 0) }; };
    const staff = async () => ((await goi('GET', `/reports/staff?from=${homNay}&to=${homNay}`)).data || []).reduce((s, r) => s + Number(r.revenue || 0), 0);
    const ds = async () => (await goi('GET', `/orders?from=${homNay}&to=${homNay}`)).todayStats || {};
    const soSach = async () => goi('GET', `/reports/so-sach?tu=${homNay}&den=${homNay}`);
    const [k0, c0] = await ket(), d0 = await daily(), s0 = await sales(), st0 = await staff(), o0 = await ds(), ss0 = await soSach();
    const sF = sdtMoi();
    const f1 = await banNap(sF, ID1);
    await napTay(sF, 50000);
    const [k1, c1x] = await ket(), d1 = await daily(), s1x = await sales(), st1 = await staff(), o1 = await ds(), ss1 = await soSach();
    k('F1 két ngày: bán gói tiền mặt 100.000 + nạp tay 50.000 → két +150.000 (không đếm đôi đơn nạp)', f1.status === 200 && k1.rong - k0.rong === 150000 && c1x.rong === c0.rong,
      `két ${k0.rong} → ${k1.rong} · CK ${c0.rong} → ${c1x.rong}`);
    k('F2 doanh thu /daily, /sales, /staff, danh sách đơn KHÔNG cộng đơn nạp',
      Number(d1.total_revenue) === Number(d0.total_revenue) && Number(d1.cash_revenue) === Number(d0.cash_revenue) && Number(s1x.total_revenue) === Number(s0.total_revenue) && s1x.ky === s0.ky
        && st1 === st0 && Number(o1.total_revenue) === Number(o0.total_revenue),
      `daily ${d0.total_revenue}→${d1.total_revenue} · sales ${s0.total_revenue}→${s1x.total_revenue} · staff ${st0}→${st1} · đơn ${o0.total_revenue}→${o1.total_revenue}`);
    k('F5 ô "tiền thật vào quán": trong đó tiền nạp +150.000 (đơn nạp 100.000 + nạp tay 50.000), cùng số với két',
      ss1.status === 200 && ss1.tien_vao?.trong_do_nap - ss0.tien_vao?.trong_do_nap === 150000 && ss1.tien_vao?.tien_mat === k1.rong,
      `${moTa(ss1)} · ${JSON.stringify(ss1.tien_vao)}`);
    const f3 = await ban({ customer_phone: sF, payment_method: 'balance', balance_amount: 21000 });
    const ss3 = await soSach();
    const tang = (a, b, t) => Number(b?.ban_hang?.[t]) - Number(a?.ban_hang?.[t]);
    const thF = f3.order ? -(await so("SELECT thuong FROM pos_balance_transactions WHERE order_id = ? AND type = 'purchase'", [f3.order.id])) : NaN;
    k('F3 bán 21.000 trả ví 155.000 (thưởng 5.000 → phần thưởng 677) → bán +21.000, thưởng nạp đã dùng +677, doanh thu thật +20.323',
      f3.status === 200 && thF === 677 && tang(ss1, ss3, 'tong_ban') === 21000 && tang(ss1, ss3, 'thuong_nap_da_dung') === 677 && tang(ss1, ss3, 'doanh_thu_that') === 20323,
      `phần thưởng ${thF} · ${JSON.stringify(ss1.ban_hang)} → ${JSON.stringify(ss3.ban_hang)}`);
    const huy = f3.order ? await goi('PUT', `/orders/${f3.order.id}/cancel`, { reason: 'thử' }) : f3;
    const ss4 = await soSach();
    k('F3b huỷ đơn đó → thưởng nạp đã dùng và doanh thu thật về như trước', huy.status === 200 && tang(ss1, ss4, 'thuong_nap_da_dung') === 0 && tang(ss1, ss4, 'doanh_thu_that') === 0,
      JSON.stringify(ss4.ban_hang));
    const tong = await mot('SELECT COALESCE(SUM(balance), 0) AS b, COALESCE(SUM(thuong), 0) AS t FROM pos_wallets').catch(() => ({}));
    const gh = ss4.giu_ho || {};
    k('F4 ô "quán đang giữ hộ khách" cuối kỳ = tổng số dư ví, tách tiền nạp / thưởng nạp',
      ss4.status === 200 && gh.tong === Number(tong.b) && gh.thuong_nap === Number(tong.t) && gh.tien_nap === Number(tong.b) - Number(tong.t) && gh.thuong_nap > 0,
      `${JSON.stringify(gh)} · ví ${JSON.stringify(tong)}`);
    const [k5, c5x] = await ket();
    const doi = f1.order ? await goi('POST', `/orders/${f1.order.id}/doi-cach-tra`, { sang: 'transfer', ly_do: 'khách chuyển khoản' }) : f1;
    const [k6, c6x] = await ket(), ss6 = await soSach();
    k('K8 đổi tiền mặt → CK trên đơn nạp: két −100.000, CK +100.000, ô tiền nạp không đổi tổng, ví không đổi',
      doi.status === 200 && k5.rong - k6.rong === 100000 && c6x.rong - c5x.rong === 100000 && ss6.tien_vao?.trong_do_nap === ss4.tien_vao?.trong_do_nap
        && (await vi(sF)).so_du === 155000 - 0,
      `${moTa(doi)} · két ${k5.rong}→${k6.rong} · CK ${c5x.rong}→${c6x.rong}`);
    const sTk = await goi('GET', `/reports/so-sach?tu=${homNay}&den=${homNay}`, null, THE_NV);
    const sSai = await soSach().then(() => goi('GET', '/reports/so-sach?tu=2026-13-01&den=2026-13-02'));
    k('F6 sổ sách cần quyền view_reports (nhân viên → 403); ngày sai → 400', sTk.status === 403 && sSai.status === 400, `${moTa(sTk)} · ${moTa(sSai)}`);
    const spBan = (await goi('GET', `/reports/products?from=${homNay}&to=${homNay}&limit=200`)).data || [];
    k('F7 /reports/products (sản phẩm bán chạy) không có dòng gói nạp; món thường vẫn có', spBan.length > 0 && !spBan.some((x) => Number(x.product_id) <= -2000000),
      JSON.stringify(spBan.map((x) => x.product_id)));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[K] K5 — không đổi: nạp tay, bán món thường không SĐT, ví + CK');
  {
    const k6 = await ban({ payment_method: 'cash', cash_amount: 21000 });
    k('K6 bán món thường không SĐT → 200 (cổng nạp không chặn oan)', k6.status === 200 && k6.order?.total === 21000, moTa(k6));
    const sK = sdtMoi();
    await napTay(sK, 30000);
    const k2 = await ban({ customer_phone: sK, payment_method: 'transfer', balance_amount: 10000, transfer_amount: 11000 });
    const vK = await vi(sK);
    k('K2 ví 10.000 + CK 11.000 → 200, ví 20.000 · thưởng 0', k2.status === 200 && vK.so_du === 20000 && vK.thuong === 0, `${moTa(k2)} · ${viChu(vK)}`);
    const cuoi = await lechBB();
    k('K9 bất biến I4 · I6 · I8 · I11 · I15 · I18 · I19 = 0 lệch cuối bài', cuoi.length === 0, cuoi.join(' | '));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] Màn Bán hàng mới (BanHang/tinh.js): giỏ gói nạp gửi goi_nap_id, cần khách, không gộp, không giá hạng');
  {
    let t = {};
    try { t = await import(pathToFileURL(path.join(MAY_CHU, '..', 'client', 'src', 'pages', 'BanHang', 'tinh.js')).href); } catch (e) { t = { loiNap: e.message }; }
    const kh = { phone: '0938499999', name: 'Khách G' };
    const gioNap = [{ key: 1, goi_nap_id: 7, product_id: -2000007, product_name: 'Nạp 100k', unit_price: 100000, quantity: 1 }];
    const gioMon = [{ key: 2, product_id: 5, sx_product_type: 'juice', sx_product_id: 9, product_name: 'Ép', unit_price: 30000, quantity: 1 }];
    const than = typeof t.thanTinhThu === 'function' ? t.thanTinhThu(gioNap, kh, 'GIAM10') : null;
    k('G1 thanTinhThu giỏ gói nạp → { khách, items: [], goi_nap_id } (không mã); giỏ món giữ nguyên dạng cũ (không goi_nap_id)',
      !!than && than.goi_nap_id === 7 && Array.isArray(than.items) && than.items.length === 0 && than.customer_phone === kh.phone && !than.discount_code
        && !('goi_nap_id' in t.thanTinhThu(gioMon, kh, '')), JSON.stringify(than) + (t.loiNap ? ' · ' + t.loiNap : ''));
    const p = typeof t.thanPhien === 'function' ? t.thanPhien({ gio: gioNap, khach: kh, ma: '', cach: 'payos', dungTK: false, dungMe: false }) : null;
    k('G2 thanPhien giỏ nạp → đơn mang goi_nap_id, không trừ tài khoản', p?.don?.goi_nap_id === 7 && p.tru_tai_khoan === false && p.tru_tai_khoan_me === false, JSON.stringify(p));
    const kt = typeof t.kiemTraNap === 'function' ? [t.kiemTraNap([], null), t.kiemTraNap(gioMon, kh), t.kiemTraNap([], kh), t.kiemTraNap(gioNap, kh)] : [];
    k('G3 kiemTraNap: chưa khách → báo; giỏ có món → báo; giỏ trống / giỏ nạp + có khách → được',
      kt.length === 4 && typeof kt[0] === 'string' && typeof kt[1] === 'string' && kt[2] === null && kt[3] === null, JSON.stringify(kt));
    const k1 = typeof t.khoaTinh === 'function' ? t.khoaTinh(gioNap, kh, '') : '', k2 = typeof t.khoaTinh === 'function' ? t.khoaTinh([{ ...gioNap[0], goi_nap_id: 8, product_id: -2000008 }], kh, '') : '';
    const g = typeof t.tinhGio === 'function' ? t.tinhGio(gioNap, { hang: { usable: true, discount_percent: 10, special_discount_percent: 10 } }) : null;
    k('G4 đổi gói nạp → khoá hỏi giá đổi; giá hạng không gạch giá gói nạp (tổng 100.000)', k1 && k1 !== k2 && g?.tong === 100000, `${k1} · ${k2} · ${g?.tong}`);
  }

  console.log(`\n  ${dat} đạt · ${hong} hỏng\n`);
  sv.close();
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.log('SẬP:', e.stack || e.message); process.exit(2); });
