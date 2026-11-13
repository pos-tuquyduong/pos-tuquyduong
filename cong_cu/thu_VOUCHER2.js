#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ VOUCHER-2 — mẫu voucher, nhiều voucher một đơn, mã chung, voucher ship, không áp lên thẻ / gói / nạp
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_VOUCHER2.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến, viec/VOUCHER-2/dot_bien.py).
 *
 *  Khuôn thu_UUDAI1.js / thu_KHTHE1.js: database.js thật + libsql thật trên kho TẠM, SX giả. co.mocTruocTx chạy TRỌN một lệnh khác trước khi
 *  giao dịch kế tiếp mở (hai quầy chồng nhau TẤT ĐỊNH). Số tiền tính TAY (K3), có bộ số đi qua phân số lẻ.
 *  Món: M0 = 50.000 · M1 = 33.333 (nhóm 92) · M2 = 20.000. Gói 300.000 · thẻ 100.000 · gói nạp 100.000.
 *  [Q2] mã bill → MỘT voucher theo mẫu (Cài đặt) cho khách có tài khoản tạo SAU lúc in bill (chủ quán Q2 11.11, Q9 12.11).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_voucher2_'));
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
const ngauNhien = () => crypto.randomBytes(8).toString('hex');
process.env.JWT_SECRET = 'thu_voucher2_nv_' + ngauNhien();
process.env.KH_JWT_SECRET = 'thu_voucher2_kh_' + ngauNhien();

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const bcrypt = require(path.join(GOC, 'node_modules', 'bcryptjs'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();
  const { getNow, getToday, addDaysToDateString } = require(path.join(MAY_CHU, 'utils', 'helpers.js'));

  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const sxGia = async () => ({ ok: true });
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => false,
    checkStock: async () => ({ sufficient: true, stock: 999 }), outStockFIFO: sxGia, inStockReturn: sxGia, callSxApi: sxGia };

  const co = { mocTruocTx: null };
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const moc = co.mocTruocTx; co.mocTruocTx = null;
    if (moc) await moc();
    return txGoc(...a);
  };

  const R = (f) => path.join(MAY_CHU, 'routes', f);
  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'settings', 'refunds', 'thanh-toan', 'wallets', 'rewards', 'loyalty', 'reports', 'damages', 'signup-codes']) app.use('/api/pos/' + r, require(R(r + '.js')));
  app.use('/api/pos/hoa-don', require(R('hoaDon.js')));
  app.use('/api/kh', require(R('kh')));
  app.use('/api/kh', require(R('kh/loi.js')).loiTangKh);
  const { kyTokenKhach } = require(path.join(MAY_CHU, 'middleware', 'khachAuth.js'));
  const { tienDaTraTheoDong, soTienHoanGoi } = require(path.join(MAY_CHU, 'utils', 'tienDaTra.js'));
  const batBien = require(path.join(GOC, 'cong_cu', 'gia_lap', 'bat_bien.js'));
  let vc = {};
  try { vc = require(path.join(MAY_CHU, 'utils', 'voucherCode.js')); } catch { /* gốc lỗi nạp — A/B đỏ */ }
  let tinhUuDai = null;
  try { ({ tinhUuDai } = require(path.join(MAY_CHU, 'utils', 'uuDai.js'))); } catch { /* — */ }
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  noiLai();

  const mot = (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const datCaiDat = (key, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
  for (const [key, v] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', 1000], ['loyalty_expiry_mode', 'none'], ['flash_enabled', 'false'],
    ['thanh_toan_payos_bat_buoc', '0'], ['signup_enabled', '0'], ['uudai_chung_hang_percent', '1'], ['uudai_chung_hang_fixed', '1']]) await datCaiDat(key, v);

  const chu = await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const nv = Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES ('nv_voucher2', 'x', 'nv', 'staff', 1)")).lastInsertRowid);
  const theCua = { chu: jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '1h' }),
    nv: jwt.sign({ userId: nv }, process.env.JWT_SECRET, { expiresIn: '1h' }) };
  const goiTk = async (tk, method, url, body) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body !== undefined ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', ...(tk ? { Authorization: 'Bearer ' + tk } : {}) } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const goi = (method, url, body, ai = 'chu') => goiTk(theCua[ai], method, url, body);
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;
  const chay = async (ten, fn) => { try { await fn(); } catch (e) { noiLai(); k(`${ten}: bài chạy hết mục`, false, e.message); } };

  // ── Dữ liệu nền ──────────────────────────────────────────────────────────
  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 3');
  for (const [i, g] of [50000, 33333, 20000].entries()) await db.run('UPDATE pos_products SET price = ?, is_special_group = 0, ton_gan_nhat = NULL WHERE id = ?', [g, sp[i].id]);
  const mon = (i, sl = 1, them = {}) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type, sx_product_id: sp[i].sx_product_id, quantity: sl, ...them });
  await db.run("INSERT INTO pos_product_groups (id, code, name) VALUES (92, 'NHOM_V2', 'Nhóm thử VOUCHER-2')");
  await db.run('INSERT INTO pos_product_group_members (group_id, sx_product_type, sx_product_id) VALUES (92, ?, ?)', [sp[1].sx_product_type, sp[1].sx_product_id]);
  const goiId = Number((await db.run("INSERT INTO pos_packages (code, name, price, unit, total_qty, package_items, is_active) VALUES ('GOI_V2', 'Gói thử', 300000, 'túi', 10, NULL, 1)")).lastInsertRowid);
  const hangId = Number((await db.run(`INSERT INTO pos_membership_tiers (name, card_price, discount_percent, special_discount_percent, sort_order, is_active, cach_co, goi)
    VALUES ('Vàng V2', 0, 0, 0, 77, 1, 'ban', ?)`, [JSON.stringify([{ so_thang: 1, gia: 100000, bat: true }])])).lastInsertRowid);
  const napId = Number((await db.run("INSERT INTO pos_goi_nap (ten, khach_tra, vao_tk, is_active, thu_tu, created_at, updated_at) VALUES ('Nạp V2', 100000, 110000, 1, 0, ?, ?)", [getNow(), getNow()])).lastInsertRowid);

  let soSdt = 0;
  const khach = async (vi = 0, pin = '1357') => {
    const sdt = '09' + String(61000000 + (++soSdt)).padStart(8, '0');
    const id = Number((await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + sdt, getNow()])).lastInsertRowid);
    if (vi) await goi('POST', '/pos/wallets/topup', { phone: sdt, amount: vi });
    if (pin) await goi('POST', '/pos/thanh-toan/pin', { phone: sdt, pin, pin_lai: pin });
    return { sdt, id, tk: kyTokenKhach(id) };
  };
  // Phát voucher qua ĐÚNG hàm phatVoucher (một giao dịch) — o: { kieu, gia_tri, tran, min, ap_dung, ids, han, chinh_chu, nguon }.
  const phat = async (sdt, kieu, gia_tri, o = {}) => {
    const mau = { ten: o.ten || `V2 ${kieu} ${gia_tri}`, kieu, gia_tri, tran: o.tran || 0, don_toi_thieu: o.min || 0, ap_dung: o.ap_dung || 'tat_ca',
      ap_dung_ids: o.ids || null, han_ngay: o.han || 30, chinh_chu: o.chinh_chu ? 1 : 0, id: o.mau_id || null };
    if (typeof vc.phatVoucher !== 'function') {   // gốc chưa có hàm: ghi thẳng như /redeem cũ để TỪNG ca đỏ riêng (không sập cả mục)
      const code = 'V2G' + ngauNhien().slice(0, 8).toUpperCase(), han = addDaysToDateString(getToday(), mau.han_ngay);
      await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, valid_to, is_active)
        VALUES (?, ?, ?, ?, ?, 1, 0, ?, 1)`, [code, /phan_tram/.test(kieu) ? 'percent' : 'fixed', gia_tri, mau.don_toi_thieu, mau.tran, han]);
      await db.run("INSERT INTO pos_voucher_grants (code, customer_phone, status, granted_at, expires_at) VALUES (?, ?, 'available', ?, ?)", [code, sdt, getNow(), han]);
      return code;
    }
    const tx = await db.beginTransaction();
    try { const r = await vc.phatVoucher(tx, mau, sdt, o.nguon || 'tay', {}); await tx.commit(); return r.code; } catch (e) { await tx.rollback(); throw e; }
  };
  let soMa = 0;
  const maChung = async (loai, giaTri, o = {}) => {
    const ma = 'V2CHUNG' + (++soMa);
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active, discount_scope)
      VALUES (?, ?, ?, ?, 0, ?, 0, 1, 'order')`, [ma, loai, giaTri, o.min || 0, o.luot || 0]);
    return ma;
  };
  const grant = (ma) => mot('SELECT * FROM pos_voucher_grants WHERE UPPER(code) = UPPER(?)', [ma]);
  const luot = (ma) => so('SELECT used_count FROM pos_discount_codes WHERE UPPER(code) = UPPER(?)', [ma]);
  const soDon = () => so('SELECT COUNT(*) AS n FROM pos_orders');
  const donDb = (id) => mot('SELECT * FROM pos_orders WHERE id = ?', [id]);
  const ban = (body, tien) => goi('POST', '/pos/orders', { customer_name: 'Khách V2', payment_method: 'cash', cash_amount: tien, ...body });
  const tinhThu = (body) => goi('POST', '/pos/orders/tinh-thu', { customer_name: 'Khách V2', ...body });
  const tongDon = async (r) => (r.order ? Number((await donDb(r.order.id))?.total) : null);
  const la400 = async (ten, r, code, truocDon, ma) => {
    const sau = await soDon();
    k(ten, r.status === 400 && r.code === code && sau === truocDon && (ma === undefined || (await luot(ma)) === 0), `${moTa(r)} · đơn ${truocDon}→${sau}`);
  };

  console.log('\nTHỬ VOUCHER-2 — mẫu voucher + nhiều voucher một đơn');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] Mẫu voucher (Cài đặt → Voucher) — CRUD + MỘT hàm dựng câu khách thấy');
  await chay('A', async () => {
    const mau = { ten: 'Giảm 20k', kieu: 'tien', gia_tri: 20000, tran: 0, don_toi_thieu: 50000, ap_dung: 'tat_ca', han_ngay: 30, chinh_chu: 0 };
    const t1 = await goi('POST', '/pos/rewards/mau', mau);
    const t0 = await goi('POST', '/pos/rewards/mau', mau, 'nv');
    k('A1 chủ quán tạo mẫu → 200 có id; nhân viên → 403', t1.status === 200 && Number(t1.id) > 0 && t0.status === 403, `${moTa(t1)} / ${moTa(t0)}`);
    const s1 = await goi('PUT', `/pos/rewards/mau/${t1.id}`, { gia_tri: 25000 });
    const s2 = await goi('PUT', `/pos/rewards/mau/${t1.id}`, { bat: 0 });
    const ds = await goi('GET', '/pos/rewards/mau');
    const m1 = (ds.data || []).find((m) => Number(m.id) === Number(t1.id));
    k('A1 sửa giá trị 25.000 + tắt → danh sách có mẫu, gia_tri 25000, bat 0, kèm mo_ta', s1.status === 200 && s2.status === 200 && !!m1
      && Number(m1.gia_tri) === 25000 && Number(m1.bat) === 0 && typeof m1.mo_ta === 'string', JSON.stringify(m1));
    const f = typeof vc.moTaVoucher === 'function' ? vc.moTaVoucher : () => '';
    const cau = [
      f({ kieu: 'tien', gia_tri: 20000, tran: 0, don_toi_thieu: 50000, ap_dung: 'tat_ca', han_ngay: 30 }),
      f({ kieu: 'phan_tram', gia_tri: 10, tran: 30000, don_toi_thieu: 0, ap_dung: 'tat_ca', han_ngay: 7 }),
      f({ kieu: 'ship_tien', gia_tri: 15000, tran: 0, don_toi_thieu: 0, ap_dung: 'tat_ca', han_ngay: 30 }),
      f({ kieu: 'ship_phan_tram', gia_tri: 50, tran: 20000, don_toi_thieu: 100000, ap_dung: 'tat_ca', han_ngay: 14 }),
      f({ kieu: 'phan_tram', gia_tri: 10, tran: 0, don_toi_thieu: 0, ap_dung: 'nhom', ap_dung_ids: '[92]', han_ngay: 30 }),
      f({ kieu: 'tien', gia_tri: 5000, tran: 9000, don_toi_thieu: 0, ap_dung: 'tat_ca', han_ngay: 3 }),
    ];
    const mong = ['Giảm 20.000đ cho đơn từ 50.000đ · HSD 30 ngày', 'Giảm 10% tối đa 30.000đ · HSD 7 ngày', 'Giảm 15.000đ phí giao · HSD 30 ngày',
      'Giảm 50% phí giao tối đa 20.000đ cho đơn từ 100.000đ · HSD 14 ngày', 'Giảm 10% cho món chọn · HSD 30 ngày',
      'Giảm 5.000đ · HSD 3 ngày'];
    k('A2 moTaVoucher dựng đúng câu 4 kiểu + áp dụng món chọn + voucher tiền không in trần', cau.every((c, i) => c === mong[i]), JSON.stringify(cau));
    const xt = await goi('POST', '/pos/rewards/mau/mo-ta', mau);
    k('A2 cửa xem trước (không ghi) trả cùng câu', xt.status === 200 && xt.mo_ta === mong[0], moTa(xt) + ' ' + xt.mo_ta);
    const sai = await Promise.all([{ ...mau, gia_tri: 0 }, { ...mau, kieu: 'phan_tram', gia_tri: 101 }, { ...mau, tran: -1 }, { ...mau, kieu: 'la' },
      { ...mau, han_ngay: 0 }, { ...mau, ten: ' ' }].map((m) => goi('POST', '/pos/rewards/mau', m)));
    const doc = (...p) => { try { return fs.readFileSync(path.join(MAY_CHU, '..', 'client', 'src', ...p), 'utf8'); } catch { return ''; } };
    const mv = doc('pages', 'CaiDat', 'MauVoucher.jsx'), st = doc('pages', 'Settings.jsx');
    k('A4 Cài đặt: Settings.jsx gắn <MauVoucher />; màn mới gọi máy chủ qua utils/api.js (không fetch trần), xem trước câu từ /rewards/mau/mo-ta, báo lưu BAO-1a',
      /import MauVoucher from '\.\/CaiDat\/MauVoucher'/.test(st) && /<MauVoucher \/>/.test(st) && /from '\.\.\/\.\.\/utils\/api'/.test(mv) && !/\bfetch\(/.test(mv)
      && /api\.post\('\/rewards\/mau\/mo-ta'/.test(mv) && /baoXong\(/.test(mv) && /baoLoiTu\(/.test(mv) && /voucher_toi_da/.test(mv));
    k('A3 giá trị 0 / % > 100 / trần âm / kiểu lạ / hạn 0 / tên rỗng → 400 MAU_KHONG_HOP_LE', sai.every((r) => r.status === 400 && r.code === 'MAU_KHONG_HOP_LE'),
      sai.map(moTa).join(' | '));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] Phát từ mẫu — MỘT hàm phatVoucher; đổi điểm đi qua hàm này');
  await chay('B', async () => {
    const a = await khach();
    const ma = await phat(a.sdt, 'tien', 10000, { han: 31, nguon: 'gioi_thieu', min: 40000, mau_id: 5 });
    const g = await grant(ma), d = await mot('SELECT * FROM pos_discount_codes WHERE code = ?', [ma]);
    k('B1 phatVoucher → 1 mã + 1 grant đúng SĐT, nguon, mau_id, hạn = hôm nay + 31 ngày, dùng 1 lần, đơn tối thiểu chụp vào mã',
      !!g && !!d && g.customer_phone === a.sdt && g.nguon === 'gioi_thieu' && Number(g.mau_id) === 5 && g.status === 'available'
      && g.expires_at === addDaysToDateString(getToday(), 31) && d.valid_to === g.expires_at && Number(d.usage_limit) === 1 && Number(d.min_order) === 40000,
      JSON.stringify({ g, d }).slice(0, 300));
    await db.run(`INSERT INTO pos_point_transactions (customer_phone, type, points, reason, created_at) VALUES (?, 'earn', 500, 'thử', ?)`, [a.sdt, getNow()]);
    const qua = Number((await db.run("INSERT INTO pos_reward_catalog (name, points_cost, discount_type, discount_value, max_discount, valid_days, is_active) VALUES ('Quà V2', 200, 'fixed', 15000, 0, 20, 1)")).lastInsertRowid);
    const r = await goi('POST', '/pos/loyalty/redeem', { phone: a.sdt, reward_id: qua });
    const g2 = r.data ? await grant(r.data.code) : null, d2 = r.data ? await mot('SELECT * FROM pos_discount_codes WHERE code = ?', [r.data.code]) : null;
    k('B2 đổi điểm vẫn trừ 200 điểm + đẻ mã 15.000 dùng 1 lần, hạn 20 ngày, grant nguon doi_diem, chia sẻ được', r.status === 200 && r.data.points_left === 300
      && !!g2 && g2.nguon === 'doi_diem' && Number(g2.point_tx_id) > 0 && Number(d2.discount_value) === 15000 && Number(d2.usage_limit) === 1
      && d2.valid_to === addDaysToDateString(getToday(), 20) && Number(d2.chinh_chu) === 0, `${moTa(r)} ${JSON.stringify(g2)}`);
    const tm = await goi('POST', '/pos/rewards/mau', { ten: 'Mẫu B3', kieu: 'tien', gia_tri: 7000, han_ngay: 10 });
    const m = (await goi('GET', '/pos/rewards/mau')).data?.find((x) => Number(x.id) === Number(tm.id));
    const ma3 = m ? await phat(a.sdt, m.kieu, m.gia_tri, { han: m.han_ngay, mau_id: m.id }) : null;
    await goi('PUT', `/pos/rewards/mau/${tm.id}`, { gia_tri: 9000, han_ngay: 60 });
    const d3 = ma3 ? await mot('SELECT * FROM pos_discount_codes WHERE code = ?', [ma3]) : null;
    k('B3 sửa mẫu sau khi phát → voucher đã phát giữ 7.000 và hạn cũ', !!d3 && Number(d3.discount_value) === 7000 && d3.valid_to === addDaysToDateString(getToday(), 10), JSON.stringify(d3));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] Nhiều voucher một đơn (tối đa N) + MỘT mã chung');
  await datCaiDat('voucher_toi_da', 3);
  await chay('C', async () => {
    const a = await khach();
    const v1 = await phat(a.sdt, 'tien', 10000), v2 = await phat(a.sdt, 'tien', 5000), v3 = await phat(a.sdt, 'phan_tram', 10);
    // 50.000 + 33.333 = 83.333 → −10.000 −5.000 = 68.333 → 10 % = 6.833,3 → 6.833 → 61.500.
    const r1 = await ban({ customer_phone: a.sdt, items: [mon(0), mon(1)], vouchers: [v3, v1, v2] }, 61500);
    const d1 = r1.order ? await donDb(r1.order.id) : null;
    k('C1 2 voucher tiền + 1 voucher % → voucher tiền trừ trước, % trên phần còn lại: tổng 61.500 (tính tay)', r1.status === 200 && Number(d1?.total) === 61500
      && Number(d1?.discount) === 21833, `${moTa(r1)} · ${d1 ? d1.total + ' / ' + d1.discount : ''}`);
    const g1 = await grant(v1), g3 = await grant(v3);
    k('C1 / I1 grant ghi đơn + số giảm từng voucher (10.000, 6.833), lượt mã = 1, đơn cờ giam_mon_thuong = 1', g1?.status === 'used' && Number(g1.used_order_id) === r1.order?.id
      && Number(g1.so_tien_giam) === 10000 && Number(g3?.so_tien_giam) === 6833 && (await luot(v1)) === 1 && Number(d1?.giam_mon_thuong) === 1, JSON.stringify([g1, g3]).slice(0, 300));

    const b = await khach();
    const w = [];
    for (const x of [1000, 2000, 3000, 4000]) w.push(await phat(b.sdt, 'tien', x));
    let tr = await soDon();
    await la400('C2 voucher thứ N+1 (4 > 3) → 400 VUOT_SO_VOUCHER, không đơn, không tiêu', await ban({ customer_phone: b.sdt, items: [mon(0)], vouchers: w }, 40000), 'VUOT_SO_VOUCHER', tr, w[0]);
    await datCaiDat('voucher_toi_da', 2);
    tr = await soDon();
    await la400('C2 N = 2 (Cài đặt) → 3 voucher (ngay trên) bị chặn', await ban({ customer_phone: b.sdt, items: [mon(0)], vouchers: w.slice(0, 3) }, 44000), 'VUOT_SO_VOUCHER', tr, w[0]);
    const r2 = await ban({ customer_phone: b.sdt, items: [mon(0)], vouchers: w.slice(0, 2) }, 47000);
    k('C2 N = 2 → đúng 2 voucher (bằng ngưỡng) → 200, tổng 47.000', r2.status === 200 && (await tongDon(r2)) === 47000, moTa(r2));
    await datCaiDat('voucher_toi_da', 3);

    const c = await khach();
    const mc = await maChung('fixed', 3000, { luot: 5 }), vc1 = await phat(c.sdt, 'tien', 10000);
    const r3 = await ban({ customer_phone: c.sdt, items: [mon(0), mon(1)], discount_code: mc, vouchers: [vc1] }, 70333);
    const d3 = r3.order ? await donDb(r3.order.id) : null;
    k('C3 mã chung 3.000 + voucher 10.000 cùng đơn → 70.333; đơn ghi mã chung, voucher ghi grant', r3.status === 200 && Number(d3?.total) === 70333 && d3?.discount_code === mc
      && (await grant(vc1)).status === 'used', moTa(r3));

    // C4 — chính chủ / chia sẻ (Q1).
    const A = await khach(), B = await khach();
    const vcc = await phat(B.sdt, 'tien', 10000, { chinh_chu: true });
    tr = await soDon();
    await la400('C4a voucher CHỈ CHÍNH CHỦ của B trên đơn khách A → 400 VOUCHER_CHINH_CHU', await ban({ customer_phone: A.sdt, items: [mon(0)], vouchers: [vcc] }, 40000), 'VOUCHER_CHINH_CHU', tr, vcc);
    await la400('C4d voucher chính chủ, đơn không SĐT → 400 VOUCHER_CHINH_CHU', await ban({ items: [mon(0)], vouchers: [vcc] }, 40000), 'VOUCHER_CHINH_CHU', tr, vcc);
    const c4b = await ban({ customer_phone: B.sdt, items: [mon(0)], vouchers: [vcc] }, 40000);
    k('C4b cùng voucher trên đơn của chính B → 200 (K5)', c4b.status === 200 && (await tongDon(c4b)) === 40000, moTa(c4b));
    const vcs = await phat(B.sdt, 'tien', 10000);
    const c4c = await ban({ customer_phone: A.sdt, items: [mon(0)], vouchers: [vcs] }, 40000);
    k('C4c voucher CHIA SẺ của B trên đơn A → 200, grant used ghi đơn A', c4c.status === 200 && Number((await grant(vcs)).used_order_id) === c4c.order?.id, moTa(c4c));

    // C5 — hết hạn / đã dùng / chưa đủ tối thiểu (ngay dưới / bằng).
    const e = await khach();
    const vhh = await phat(e.sdt, 'tien', 5000);
    await db.run("UPDATE pos_discount_codes SET valid_to = '2000-01-01' WHERE code = ?", [vhh]);
    await db.run("UPDATE pos_voucher_grants SET expires_at = '2000-01-01' WHERE code = ?", [vhh]);
    tr = await soDon();
    await la400('C5 voucher hết hạn → 400 VOUCHER_HET_HAN', await ban({ customer_phone: e.sdt, items: [mon(0)], vouchers: [vhh] }, 45000), 'VOUCHER_HET_HAN', tr, vhh);
    await la400('C5 voucher đã dùng (dùng lại v1 của C1) → 400 VOUCHER_DA_DUNG', await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [v1] }, 40000), 'VOUCHER_DA_DUNG', tr);
    const vmin = await phat(e.sdt, 'tien', 5000, { min: 83334 }), vbang = await phat(e.sdt, 'tien', 5000, { min: 83333 });
    await la400('C5 đơn tối thiểu 83.334, món thường 83.333 (ngay dưới) → 400 VOUCHER_CHUA_DU_DON', await ban({ customer_phone: e.sdt, items: [mon(0), mon(1)], vouchers: [vmin] }, 78333), 'VOUCHER_CHUA_DU_DON', tr, vmin);
    const c5 = await ban({ customer_phone: e.sdt, items: [mon(0), mon(1)], vouchers: [vbang] }, 78333);
    k('C5 đơn tối thiểu = 83.333 (bằng) → 200, 78.333', c5.status === 200 && (await tongDon(c5)) === 78333, moTa(c5));
    const vrac = 'KHONGCO9';
    tr = await soDon();
    await la400('C5 mã voucher không có → 400 VOUCHER_KHONG_TON_TAI', await ban({ customer_phone: e.sdt, items: [mon(0)], vouchers: [vrac] }, 50000), 'VOUCHER_KHONG_TON_TAI', tr);

    const vto = await phat(e.sdt, 'tien', 200000);
    const c6 = await ban({ customer_phone: e.sdt, items: [mon(0), mon(1)], vouchers: [vto] }, 0);
    k('C6 voucher 200.000 > tiền món 83.333 → kẹp, tổng 0, giảm ghi đúng 83.333', c6.status === 200 && (await tongDon(c6)) === 0 && Number((await grant(vto)).so_tien_giam) === 83333, moTa(c6));

    const vok = await phat(e.sdt, 'tien', 4000);
    const c7 = await tinhThu({ customer_phone: e.sdt, items: [mon(0)], vouchers: [vok, vhh] });
    k('C7 tinh-thu có voucher hỏng → 200 MỀM: tính voucher tốt (46.000) + voucher_loi đúng mã / code', c7.status === 200 && c7.total === 46000
      && Array.isArray(c7.voucher_loi) && c7.voucher_loi.length === 1 && c7.voucher_loi[0].ma === vhh && c7.voucher_loi[0].code === 'VOUCHER_HET_HAN', JSON.stringify(c7).slice(0, 300));

    // C8 — Q4: tối đa MỘT voucher %.
    const p = await khach();
    const p1 = await phat(p.sdt, 'phan_tram', 10), p2 = await phat(p.sdt, 'phan_tram', 20), t1 = await phat(p.sdt, 'tien', 5000), t2 = await phat(p.sdt, 'tien', 5000);
    tr = await soDon();
    const c8 = await ban({ customer_phone: p.sdt, items: [mon(0)], vouchers: [p1, p2] }, 36000);
    await la400('C8 voucher % thứ hai → 400 VOUCHER_PHAN_TRAM_HAI', c8, 'VOUCHER_PHAN_TRAM_HAI', tr, p1);
    k('C8 lời báo đúng câu chủ quán', c8.error === `Voucher ${p2}: Mỗi đơn chỉ dùng một voucher giảm %`, c8.error);
    const c8c = await tinhThu({ customer_phone: p.sdt, items: [mon(0)], vouchers: [p1, p2] });
    k('C8c tinh-thu → voucher_loi có mã % thứ hai, tổng chỉ tính % đầu (45.000)', c8c.status === 200 && c8c.total === 45000
      && c8c.voucher_loi?.[0]?.ma === p2 && c8c.voucher_loi?.[0]?.code === 'VOUCHER_PHAN_TRAM_HAI', JSON.stringify(c8c.voucher_loi));
    // 50.000 −5.000 −5.000 = 40.000 → 10 % = 4.000 → 36.000.
    const c8b = await ban({ customer_phone: p.sdt, items: [mon(0)], vouchers: [p1, t1, t2] }, 36000);
    k('C8b 1 voucher % + 2 voucher tiền → 200, 36.000 (K5)', c8b.status === 200 && (await tongDon(c8b)) === 36000, moTa(c8b));

    // Voucher nhóm món (Q3): 10 % các món nhóm 92 (M1 33.333) → 3.333; đơn 83.333 → 80.000.
    const n = await khach();
    const vn = await phat(n.sdt, 'phan_tram', 10, { ap_dung: 'nhom', ids: '[92]' });
    const cn = await ban({ customer_phone: n.sdt, items: [mon(0), mon(1)], vouchers: [vn] }, 80000);
    k('C9 voucher % nhóm món → chỉ trên món thuộc nhóm: 10 % × 33.333 = 3.333, tổng 80.000', cn.status === 200 && (await tongDon(cn)) === 80000, moTa(cn));
    const vn2 = await phat(n.sdt, 'tien', 5000, { ap_dung: 'nhom', ids: '[92]' });
    tr = await soDon();
    await la400('C9 voucher nhóm món, giỏ không có món nhóm → 400 VOUCHER_KHONG_CO_MON', await ban({ customer_phone: n.sdt, items: [mon(0)], vouchers: [vn2] }, 45000), 'VOUCHER_KHONG_CO_MON', tr, vn2);
  });

  // ═════════════════════════════════════════════════════════════════════════
  const gioFlash = async (fn) => {
    const gio = Number(getNow().slice(11, 13));
    for (const [key, v] of [['flash_enabled', 'true'], ['flash_start', `${String(gio).padStart(2, '0')}:00`],
      ['flash_end', `${String((gio + 2) % 24).padStart(2, '0')}:00`], ['flash_percent', 20],
      ['flash_product_keys', JSON.stringify([`${sp[0].sx_product_type}_${sp[0].sx_product_id}`])]]) await datCaiDat(key, v);
    try { return await fn(); } finally { await datCaiDat('flash_enabled', 'false'); }
  };
  muc('[D] Giờ flash: không voucher %, voucher tiền vẫn dùng');
  await chay('D', async () => gioFlash(async () => {
    const a = await khach();
    const vp = await phat(a.sdt, 'phan_tram', 10), vt = await phat(a.sdt, 'tien', 10000);
    const tr = await soDon();
    await la400('D1 giờ flash + voucher % → 400 VOUCHER_PHAN_TRAM_FLASH', await ban({ customer_phone: a.sdt, items: [mon(0), mon(1)], vouchers: [vp] }, 66000), 'VOUCHER_PHAN_TRAM_FLASH', tr, vp);
    // 50.000 −20 % flash (10.000) + 33.333 = 73.333 → −10.000 = 63.333.
    const r = await ban({ customer_phone: a.sdt, items: [mon(0), mon(1)], vouchers: [vt] }, 63333);
    k('D2 giờ flash + voucher tiền → 200, đúng 63.333', r.status === 200 && (await tongDon(r)) === 63333, moTa(r));
  }));

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] Voucher ship — chỉ giảm dòng phí giao, không quá phí giao, tính vào N');
  let soBp = 0;
  const baoPhi = async (phi) => {
    const ma = 'BPV2' + ngauNhien() + (++soBp);
    await db.run(`INSERT INTO pos_giao_bao_phi (ma, dia_chi, km, loai_xe, phi, het_han, tao_luc) VALUES (?, 'Số 1 Ngõ Thử', 2, 'BIKE', ?, ?, ?)`,
      [ma, phi, '2999-01-01T00:00:00', getNow()]);
    return { ma_bao_phi: ma, ten: 'Chị Nhận', sdt: '0988000111' };
  };
  await chay('E', async () => {
    const a = await khach();
    const s1 = await phat(a.sdt, 'ship_tien', 15000), s2 = await phat(a.sdt, 'ship_phan_tram', 50, { tran: 10000 }), s3 = await phat(a.sdt, 'ship_tien', 50000);
    const e1 = await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [s1], giao: await baoPhi(30000) }, 65000);
    const d1 = e1.order ? await donDb(e1.order.id) : null;
    const chuyen = e1.order ? await mot('SELECT phi_khach FROM pos_giao_chuyen WHERE order_id = ?', [e1.order.id]) : null;
    k('E1 ship tiền 15.000 trên phí 30.000 → tổng 65.000; cột shipping_fee = phần khách trả 15.000, giam_ship 15.000', e1.status === 200 && Number(d1?.total) === 65000
      && Number(d1?.shipping_fee) === 15000 && Number(d1?.giam_ship) === 15000, `${moTa(e1)} · ${JSON.stringify(d1 && { t: d1.total, s: d1.shipping_fee, g: d1.giam_ship })}`);
    k('E4 chuyến giao ghi phí khách trả 15.000 (phần quán bù vào chênh lệch đối soát)', Number(chuyen?.phi_khach) === 15000, JSON.stringify(chuyen));
    const e1b = await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [s2], giao: await baoPhi(30000) }, 70000);
    k('E1 ship 50 % có trần 10.000 trên phí 30.000 → giảm 10.000, tổng 70.000', e1b.status === 200 && (await tongDon(e1b)) === 70000, moTa(e1b));
    const e1c = await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [s3], giao: await baoPhi(30000) }, 50000);
    k('E1 ship 50.000 trên phí 30.000 → kẹp 30.000, tổng 50.000 (không trừ vào món)', e1c.status === 200 && (await tongDon(e1c)) === 50000, moTa(e1c));
    const s4 = await phat(a.sdt, 'ship_tien', 15000);
    let tr = await soDon();
    const e2 = await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [s4] }, 50000);
    await la400('E2 đơn tại quán + voucher ship → 400 VOUCHER_SHIP_CAN_GIAO', e2, 'VOUCHER_SHIP_CAN_GIAO', tr, s4);
    k('E2 lời báo "Voucher giao hàng chỉ dùng cho đơn giao"', e2.error === `Voucher ${s4}: Voucher giao hàng chỉ dùng cho đơn giao`, e2.error);
    await la400('E2b phí ship gõ tay (không qua giao) + voucher ship → 400 VOUCHER_SHIP_CAN_GIAO', await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [s4], shipping_fee: 20000 }, 55000), 'VOUCHER_SHIP_CAN_GIAO', tr, s4);
    const ds = [];
    for (let i = 0; i < 3; i++) ds.push(await phat(a.sdt, 'tien', 1000));
    await la400('E3 3 voucher tiền + 1 voucher ship (N = 3) → 400 VUOT_SO_VOUCHER', await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [...ds, s4], giao: await baoPhi(30000) }, 62000), 'VUOT_SO_VOUCHER', tr, s4);
    // Q10: 1 voucher % món + 1 voucher ship % → không phải "hai voucher %". 50.000 − 10 % = 45.000; phí 30.000 − 50 % (trần 10.000) = 20.000 → 65.000.
    const vp = await phat(a.sdt, 'phan_tram', 10), s5 = await phat(a.sdt, 'ship_phan_tram', 50, { tran: 10000 });
    const e6 = await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [s5, vp], giao: await baoPhi(30000) }, 65000);   // ship % gửi TRƯỚC: thứ tự không đổi kết quả
    k('E6 (Q10) voucher ship % (gửi trước) + voucher % món → 200, 65.000', e6.status === 200 && (await tongDon(e6)) === 65000, moTa(e6));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] Mã / voucher KHÔNG áp lên thẻ hạng, gói trả trước, nạp');
  let donF7 = null;
  await chay('F', async () => {
    const a = await khach();
    const m10 = await maChung('percent', 10);
    const f1 = await ban({ customer_phone: a.sdt, items: [mon(0)], membership_buy: { tier_id: hangId, so_thang: 1 }, discount_code: m10 }, 145000);
    k('F1 thẻ 100.000 + món 50.000 + mã chung 10 % → mã chỉ trên món: 145.000', f1.status === 200 && (await tongDon(f1)) === 145000, moTa(f1));
    const b = await khach();
    const f2 = await ban({ customer_phone: b.sdt, items: [mon(0)], package_buy: { package_id: goiId }, discount_code: m10 }, 345000);
    donF7 = f2.order?.id;
    k('F2 gói 300.000 + món 50.000 + mã 10 % → 345.000', f2.status === 200 && (await tongDon(f2)) === 345000, moTa(f2));
    const c = await khach();
    const vt = await phat(c.sdt, 'tien', 10000);
    let tr = await soDon();
    await la400('F3 chỉ thẻ + voucher → 400 MA_KHONG_AP_MON_THUONG', await ban({ customer_phone: c.sdt, items: [], membership_buy: { tier_id: hangId, so_thang: 1 }, vouchers: [vt] }, 90000), 'MA_KHONG_AP_MON_THUONG', tr, vt);
    const f3b = await tinhThu({ customer_phone: c.sdt, items: [], membership_buy: { tier_id: hangId, so_thang: 1 }, discount_code: m10 });
    k('F3 chỉ thẻ + mã chung → mềm: không giảm (100.000), ma_loi_code MA_KHONG_AP_MON_THUONG', f3b.status === 200 && f3b.total === 100000 && f3b.ma_loi_code === 'MA_KHONG_AP_MON_THUONG', JSON.stringify(f3b).slice(0, 200));
    await la400('F4 nạp + voucher → 400 NAP_CHI_TIEN_MAT_QR', await ban({ customer_phone: c.sdt, goi_nap_id: napId, vouchers: [vt] }, 100000), 'NAP_CHI_TIEN_MAT_QR', tr, vt);
    const ph = await goi('POST', '/pos/thanh-toan/phien', { don: { customer_phone: b.sdt, customer_name: 'K', items: [mon(0)], package_buy: { package_id: goiId }, discount_code: m10 }, cach: 'tien_mat' });
    k('F5 phiên thanh toán: gói + món + mã 10 % → tổng 345.000', ph.status === 200 && ph.phien?.tong === 345000, moTa(ph) + ' ' + ph.phien?.tong);
    if (ph.phien) await goi('POST', `/pos/thanh-toan/phien/${ph.phien.id}/huy`, {});
    const mMin = await maChung('fixed', 5000, { min: 50000 });
    const f6 = await tinhThu({ customer_phone: c.sdt, items: [mon(1)], membership_buy: { tier_id: hangId, so_thang: 1 }, discount_code: mMin });
    k('F6 mã chung tối thiểu 50.000, giỏ thẻ 100.000 + món 33.333 → không áp (133.333)', f6.status === 200 && f6.total === 133333 && f6.ma_loi_code === 'MA_KHONG_AP_DUNG', JSON.stringify(f6).slice(0, 200));

    const vMin = await phat(c.sdt, 'tien', 5000, { min: 50000 });
    tr = await soDon();
    await la400('F6b voucher tối thiểu 50.000, giỏ thẻ 100.000 + món 33.333 → 400 VOUCHER_CHUA_DU_DON (tính trên món thường)',
      await ban({ customer_phone: c.sdt, items: [mon(1)], membership_buy: { tier_id: hangId, so_thang: 1 }, vouchers: [vMin] }, 128333), 'VOUCHER_CHUA_DU_DON', tr, vMin);

    // F7 (Q7) — tiền đã trả theo dòng, số tính tay: món 45.000, gói 300.000.
    const tx = { query: db.query, queryOne: db.queryOne };
    const o = donF7 ? await donDb(donF7) : null;
    const dong = o ? await tienDaTraTheoDong(tx, o) : [];
    const dGoi = dong.find((x) => Number(x.product_id) < 0), dMon = dong.find((x) => Number(x.product_id) > 0);
    k('F7 đơn mới gói + món + mã 10 % món → gói đã trả 300.000, món đã trả 45.000', dGoi?.da_tra === 300000 && dMon?.da_tra === 45000, JSON.stringify(dong.map((x) => x.da_tra)));
    const cp = o ? await mot('SELECT * FROM pos_customer_packages WHERE order_id = ?', [o.id]) : null;
    const hg = cp ? await soTienHoanGoi(tx, cp) : null;
    k('F7 kết thúc gói chưa lấy lượt nào → hoàn theo 300.000', hg?.tong === 300000, JSON.stringify(hg && { tong: hg.tong, loi: hg.loi }));
    const den = (tien) => goi('POST', '/pos/damages', { order_id: o?.id, product_code: sp[0].code, quantity: 1, reason: 'damaged', action: 'refund', refund_amount: tien });
    const den1 = await den(45001), den2 = await den(45000);
    k('F7 đền món: 45.001 (ngay trên số khách trả) → 400 VUOT_GIA; 45.000 → 200', den1.status === 400 && den1.code === 'VUOT_GIA' && den2.status === 200, `${moTa(den1)} / ${moTa(den2)}`);
    if (o) await db.run('UPDATE pos_orders SET giam_mon_thuong = 0 WHERE id = ?', [o.id]);
    const cu = o ? await tienDaTraTheoDong(tx, await donDb(o.id)) : [];
    k('F7b cùng đơn đặt cờ đơn CŨ (0) → chia cũ: gói 295.714, món 49.285', cu.find((x) => Number(x.product_id) < 0)?.da_tra === 295714
      && cu.find((x) => Number(x.product_id) > 0)?.da_tra === 49285, JSON.stringify(cu.map((x) => x.da_tra)));
    if (o) await db.run('UPDATE pos_orders SET giam_mon_thuong = 1 WHERE id = ?', [o.id]);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] Huỷ / xoá / duyệt hoàn → trả MỌI voucher + lượt mã chung; phiên QR không tiêu; hai đơn cùng voucher → một đơn');
  await chay('G', async () => {
    const a = await khach(100000);
    const mc = await maChung('fixed', 1000, { luot: 5 });
    const vs = [await phat(a.sdt, 'tien', 2000), await phat(a.sdt, 'tien', 3000), await phat(a.sdt, 'phan_tram', 10)];
    // 50.000 − 1.000 − 2.000 − 3.000 = 44.000 → 10 % = 4.400 → 39.600.
    const r = await ban({ customer_phone: a.sdt, items: [mon(0)], discount_code: mc, vouchers: vs }, 39600);
    const huy = r.order ? await goi('PUT', `/pos/orders/${r.order.id}/cancel`, { reason: 'thử VOUCHER-2' }) : {};
    const gs = await Promise.all(vs.map(grant));
    k('G1 huỷ đơn 3 voucher + mã chung → mọi grant available, used_count về 0, mã chung về 0', r.status === 200 && huy.status === 200
      && gs.every((g) => g.status === 'available' && g.used_order_id == null) && (await Promise.all(vs.map(luot))).every((n) => n === 0) && (await luot(mc)) === 0,
      `${moTa(r)} / ${moTa(huy)} · ${gs.map((g) => g.status).join(',')}`);
    const vb = await phat(a.sdt, 'tien', 5000);
    const r2 = await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [vb] }, 45000);
    const huy2 = r2.order ? await goi('PUT', `/pos/orders/${r2.order.id}/cancel`, { reason: 'thử VOUCHER-2' }) : {};
    k('G1b đơn CHỈ voucher (không mã chung) huỷ → voucher về available, lượt 0', huy2.status === 200 && (await grant(vb)).status === 'available' && (await luot(vb)) === 0, moTa(huy2));
    const r3 = await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [vb] }, 45000);
    const xoa = r3.order ? await goi('DELETE', `/pos/orders/${r3.order.id}`, { reason: 'thử VOUCHER-2' }) : {};
    k('G2 xoá đơn → voucher về available', r3.status === 200 && xoa.status === 200 && (await grant(vb)).status === 'available' && (await luot(vb)) === 0, moTa(xoa));
    const r4 = await goi('POST', '/pos/orders', { customer_phone: a.sdt, customer_name: 'K', items: [mon(0)], vouchers: [vb], payment_method: 'balance', balance_amount: 45000 });
    const daTieu = (await grant(vb)).status === 'used' && (await tongDon(r4)) === 45000;   // K3: chứng minh voucher ĐÃ tiêu trước khi duyệt hoàn
    const yc = r4.order ? await goi('POST', '/pos/refunds', { order_id: r4.order.id, reason: 'thử VOUCHER-2' }) : {};
    const dy = yc.refund_id;
    const duyet = dy ? await goi('POST', `/pos/refunds/${dy}/approve`, {}) : {};
    k('G2 duyệt hoàn đơn 45.000 (voucher đã tiêu) → voucher về available, lượt 0', daTieu && duyet.status === 200 && (await grant(vb)).status === 'available'
      && (await luot(vb)) === 0, `đã tiêu ${daTieu} · ${moTa(yc)} / ${moTa(duyet)}`);

    // G3 — phiên giữ chỗ: tạo với voucher (tổng ĐÃ trừ voucher) → huỷ → voucher không tiêu; phiên tiền mặt chốt → tiêu.
    const vq = await phat(a.sdt, 'tien', 10000);
    const p1 = await goi('POST', '/pos/thanh-toan/phien', { don: { customer_phone: a.sdt, customer_name: 'K', items: [mon(0)], vouchers: [vq] }, cach: 'ck_tay' });
    const h1 = p1.phien ? await goi('POST', `/pos/thanh-toan/phien/${p1.phien.id}/huy`, {}) : {};
    k('G3 phiên ck_tay tổng 40.000 (đã trừ voucher) → huỷ → voucher vẫn available, lượt 0', p1.status === 200 && p1.phien?.tong === 40000 && h1.status === 200
      && (await grant(vq)).status === 'available' && (await luot(vq)) === 0, `${moTa(p1)} ${p1.phien?.tong} / ${moTa(h1)}`);
    const p2 = await goi('POST', '/pos/thanh-toan/phien', { don: { customer_phone: a.sdt, customer_name: 'K', items: [mon(0)], vouchers: [vq] }, cach: 'tien_mat' });
    const c2 = p2.phien ? await goi('POST', `/pos/thanh-toan/phien/${p2.phien.id}/chot`, { cash_received: 40000 }) : {};
    k('G3 phiên tiền mặt chốt → đơn 40.000, voucher used', c2.status === 200 && (await grant(vq)).status === 'used' && (await luot(vq)) === 1, moTa(c2));

    // G4 — hai quầy cùng dùng một voucher: lệnh chen vào chạy TRỌN trước giao dịch của lệnh sau.
    const vr = await phat(a.sdt, 'tien', 10000);
    let chen = null;
    co.mocTruocTx = async () => { chen = await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [vr] }, 40000); imLang(); };
    const sau = await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [vr] }, 40000);
    co.mocTruocTx = null;
    k('G4 hai đơn cùng voucher → đúng một 200, một 400 VOUCHER_DA_DUNG; lượt = 1', chen?.status === 200 && sau.status === 400 && sau.code === 'VOUCHER_DA_DUNG'
      && (await luot(vr)) === 1 && Number((await grant(vr)).used_order_id) === chen.order?.id, `${chen && moTa(chen)} / ${moTa(sau)}`);
    // G4b / G4c — MỖI điều kiện của câu tiêu tự đứng được (K3: mỗi vế một ca): giữa phép kiểm (ngoài giao dịch) và giao dịch, chỉ MỘT phía đổi.
    const vb4 = await phat(a.sdt, 'tien', 10000);
    co.mocTruocTx = async () => { await db.run("UPDATE pos_voucher_grants SET status = 'used' WHERE code = ?", [vb4]); };
    const g4b = await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [vb4] }, 40000);
    co.mocTruocTx = null;
    k('G4b ví voucher vừa chuyển "used" (mã chưa tăng lượt) → 400 VOUCHER_DA_DUNG, lượt mã KHÔNG tăng (rollback)', g4b.status === 400 && g4b.code === 'VOUCHER_DA_DUNG'
      && (await luot(vb4)) === 0, moTa(g4b));
    const vc4 = await phat(a.sdt, 'tien', 10000);
    co.mocTruocTx = async () => { await db.run('UPDATE pos_discount_codes SET used_count = 1 WHERE code = ?', [vc4]); };
    const g4c = await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [vc4] }, 40000);
    co.mocTruocTx = null;
    k('G4c mã vừa hết lượt (ví còn "available") → 400 VOUCHER_DA_DUNG, ví vẫn available', g4c.status === 400 && g4c.code === 'VOUCHER_DA_DUNG'
      && (await grant(vc4)).status === 'available', moTa(g4c));
    await db.run('UPDATE pos_discount_codes SET used_count = 0 WHERE code = ?', [vc4]);   // trả dữ liệu tay về đúng sổ (I4 soát BẰNG)
    // G5 — đơn kiểu cũ (voucher ở ô mã) huỷ: trả ĐÚNG một lượt (mã nhiều lượt để MAX(0) không che lỗi trả hai lần).
    const vcu = await phat(a.sdt, 'tien', 5000);
    await db.run('UPDATE pos_discount_codes SET usage_limit = 5, used_count = 3 WHERE code = ?', [vcu]);
    const g5 = await ban({ customer_phone: a.sdt, items: [mon(0)], discount_code: vcu }, 45000);
    const l5 = await luot(vcu);
    const h5 = g5.order ? await goi('PUT', `/pos/orders/${g5.order.id}/cancel`, { reason: 'thử VOUCHER-2' }) : {};
    k('G5 voucher ở ô mã (đơn ghi discount_code) → lượt 3 → 4; huỷ → về 3 (không trừ hai lần)', g5.status === 200 && (await donDb(g5.order.id)).discount_code === vcu
      && l5 === 4 && h5.status === 200 && (await luot(vcu)) === 3, `${moTa(g5)} · ${l5} → ${await luot(vcu)}`);
    await db.run('UPDATE pos_discount_codes SET usage_limit = 1, used_count = 0 WHERE code = ?', [vcu]);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[H] App KH — ví có mo_ta + nguon; báo giá + đặt đơn nhận danh sách voucher; App cũ gửi một mã vẫn chạy');
  const ma = (i) => `${sp[i].sx_product_type}_${sp[i].sx_product_id}`;
  const gioApp = (dong, them = {}) => ({ mon: dong.map(([i, sl]) => ({ ma: ma(i), so_luong: sl })), cach_nhan: 'tai_quan', ...them });
  const baoGiaApp = (kh, than) => goiTk(kh.tk, 'POST', '/kh/gio/bao-gia', than);
  await chay('H', async () => {
    await datCaiDat('gio_hd_lich', ''); await datCaiDat('gio_hd_ngung_truoc_phut', 0);
    const a = await khach(200000);
    const v1 = await phat(a.sdt, 'tien', 20000, { min: 50000, han: 30, nguon: 'gioi_thieu' });
    const vi = await goiTk(a.tk, 'GET', '/kh/voucher');
    const dv = (vi.data || []).find((x) => x.code === v1);
    k('H1 GET /kh/voucher → dòng có mo_ta (câu từ mẫu) + nguon', vi.status === 200 && dv?.nguon === 'gioi_thieu'
      && dv?.mo_ta === `Giảm 20.000đ cho đơn từ 50.000đ · HSD ${addDaysToDateString(getToday(), 30).split('-').reverse().join('/')}`, JSON.stringify(dv));
    const v2 = await phat(a.sdt, 'phan_tram', 10);
    const bg = await baoGiaApp(a, gioApp([[0, 2]], { vouchers: [v1, v2] }));
    // 100.000 − 20.000 = 80.000 → 10 % = 8.000 → 72.000.
    const gV = (bg.giam || []).filter((x) => x.loai === 'voucher');
    k('H2 báo giá với vouchers[] → tong 72.000, giam[] có 2 dòng loai voucher kèm ma', bg.status === 200 && bg.tong === 72000 && gV.length === 2
      && gV.some((x) => x.ma === v1 && x.so_tien === 20000) && gV.some((x) => x.ma === v2 && x.so_tien === 8000), JSON.stringify(bg).slice(0, 300));
    const dd = await goiTk(a.tk, 'POST', '/kh/don', { ...gioApp([[0, 2]], { vouchers: [v1, v2] }), khoa_gui: 'khoa-v2-' + ngauNhien(), cach_tra: 'vi', pin: '1357', tong_da_xem: 72000 });
    k('H2 POST /kh/don với vouchers[] (trả tài khoản) → 200, hai voucher used', dd.status === 200 && (await grant(v1)).status === 'used' && (await grant(v2)).status === 'used', moTa(dd));
    const v3 = await phat(a.sdt, 'tien', 5000);
    const cu = await baoGiaApp(a, gioApp([[0, 1]], { ma_giam: v3 }));
    k('H3 App cũ gửi ma_giam = mã voucher → vẫn áp (45.000), báo ra y như trước (dòng ma_giam 5.000, không dòng voucher)', cu.status === 200 && cu.tong === 45000
      && (cu.giam || []).some((x) => x.loai === 'ma_giam' && x.so_tien === 5000) && !(cu.giam || []).some((x) => x.loai === 'voucher'), JSON.stringify(cu).slice(0, 200));
    const v4 = await phat(a.sdt, 'tien', 5000, { chinh_chu: true });
    const B0 = await khach();
    const lau = await baoGiaApp(B0, gioApp([[0, 1]], { ma_giam: v4 }));
    k('H3b ô mã cũ KHÔNG lách luật mới: voucher chính chủ của A gõ ở ma_giam của B → không áp, ma_giam_loi VOUCHER_CHINH_CHU', lau.status === 200 && lau.tong === 50000
      && lau.ma_giam_loi?.code === 'VOUCHER_CHINH_CHU', JSON.stringify(lau).slice(0, 200));
    const B = await khach();
    const vb = await phat(B.sdt, 'tien', 5000, { chinh_chu: true });
    const h4 = await baoGiaApp(a, gioApp([[0, 1]], { vouchers: [vb] }));
    k('H4 khách A gửi voucher chính chủ của B → báo giá không áp (50.000) + voucher_loi VOUCHER_CHINH_CHU', h4.status === 200 && h4.tong === 50000
      && h4.voucher_loi?.[0]?.code === 'VOUCHER_CHINH_CHU' && h4.voucher_loi?.[0]?.ma === vb, JSON.stringify(h4).slice(0, 200));
    const tr3c = await soDon();
    const h3c = await ban({ customer_phone: B0.sdt, items: [mon(0)], discount_code: v4 }, 50000);
    k('H3c POST quầy: voucher chính chủ của người khác gõ ở ô mã → MỀM như mã cũ (đơn 200, 50.000, không ghi mã, voucher không tiêu)', h3c.status === 200
      && (await tongDon(h3c)) === 50000 && (await donDb(h3c.order.id)).discount_code == null && (await soDon()) === tr3c + 1 && (await grant(v4)).status === 'available', moTa(h3c));
    const sai = await baoGiaApp(a, gioApp([[0, 1]], { vouchers: 'ABC' }));
    k('H5 vouchers không phải mảng chuỗi → 400 YEU_CAU_KHONG_HOP_LE', sai.status === 400 && sai.code === 'YEU_CAU_KHONG_HOP_LE', moTa(sai));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[I] Đơn lưu đủ mã đã dùng — hoá đơn, báo cáo, đối soát');
  await chay('I', async () => {
    const a = await khach();
    const v1 = await phat(a.sdt, 'tien', 10000), v2 = await phat(a.sdt, 'ship_tien', 10000);
    const mc = await maChung('fixed', 2000, { luot: 5 });
    const r = await ban({ customer_phone: a.sdt, items: [mon(0)], vouchers: [v1, v2], discount_code: mc, giao: await baoPhi(25000) }, 53000);
    const hd = r.order ? await goi('GET', `/pos/hoa-don/${r.order.id}`) : {};
    const t = hd.hoa_don?.tien || {};
    // Tờ in hiện tại chưa có dòng voucher (mẫu in chờ chủ quán — Q14): giam_ma / phi_giao GIỮ nghĩa cũ để cộng khớp tổng; dòng voucher THÊM riêng.
    k('I2 hoá đơn: thêm vouchers [mã, 10.000] + giam_ship 10.000; giam_ma (mã 2.000 + voucher 10.000) và phi_giao (khách trả 15.000) giữ nghĩa cũ — gốc − giảm + phí = tổng 53.000',
      r.status === 200 && Array.isArray(t.vouchers) && t.vouchers.length === 1 && t.vouchers[0].ma === v1 && t.vouchers[0].so_tien === 10000 && t.giam_ma === 12000
      && t.phi_giao === 15000 && t.giam_ship === 10000 && t.tong === 53000 && t.gia_goc - t.giam_hang - t.giam_flash - t.giam_ma + t.phi_giao === t.tong,
      `${moTa(r)} ${JSON.stringify(t)}`);
    const bc = await goi('GET', `/pos/reports/discounts?from=${getToday()}&to=${getToday()}`);
    const dongV = (bc.by_voucher || []).find((x) => x.code === v1);
    k('I3 báo cáo mã có nhóm theo voucher (mã, số đơn, tiền giảm) + tổng giảm phí giao quán bù', bc.status === 200 && Number(dongV?.usage_count) === 1
      && Number(dongV?.total_discount) === 10000 && Number(bc.summary?.total_ship_discount) >= 10000, JSON.stringify(bc).slice(0, 300));
    const q = (sql, p) => db.query(sql, p);
    const lech = [...await batBien.BAT_BIEN.I12(q), ...await batBien.BAT_BIEN.I13(q, { thuc: false, soQuay: { tangMa: new Map() } })];
    k('I4 bất biến I12 / I13 (so BẰNG) sau mọi kịch bản dùng / huỷ voucher → không dòng lệch', lech.length === 0, JSON.stringify(lech).slice(0, 400));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[Q2] Mã in bill → MỘT voucher theo mẫu, chỉ cho khách có tài khoản tạo SAU lúc in bill (Q2 · Q9)');
  await chay('Q2', async () => {
    await datCaiDat('signup_enabled', '1');
    const tm = await goi('POST', '/pos/rewards/mau', { ten: 'Khách mới V2', kieu: 'tien', gia_tri: 15000, tran: 0, don_toi_thieu: 0, ap_dung: 'tat_ca', han_ngay: 10, chinh_chu: 1 });
    const cd = await goi('PUT', '/pos/settings', { settings: { signup_mau_voucher_id: String(tm.id) } });
    const cdSai = await goi('PUT', '/pos/settings', { settings: { signup_mau_voucher_id: 'abc' } });
    k('Q2l cài mẫu khách mới: id mẫu → 200; chữ lạ → 400 CAI_DAT_KHONG_HOP_LE', cd.status === 200 && cdSai.status === 400 && cdSai.code === 'CAI_DAT_KHONG_HOP_LE',
      `${moTa(cd)} / ${moTa(cdSai)}`);
    const bill = async () => {
      const r = await ban({ items: [mon(2)] }, 20000);
      const s = r.order?.signup_code ? await mot('SELECT * FROM pos_signup_codes WHERE code = ?', [r.order.signup_code]) : null;
      if (!s) throw new Error('đơn không có mã bill: ' + moTa(r));
      return s;
    };
    let soQ2 = 0;
    const sdtQ2 = () => '09' + String(62000000 + (++soQ2)).padStart(8, '0');
    const taoTk = async (sdt, luc) => Number((await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sdt, 'Khách ' + sdt, luc || getNow()])).lastInsertRowid);
    const nhan = (ma, sdt) => goi('POST', '/pos/signup-codes/claim', { code: ma, phone: sdt });
    const truGiay = (luc, s) => new Date(new Date(luc + 'Z').getTime() - s * 1000).toISOString().slice(0, 19);
    const grantBill = (s) => mot("SELECT * FROM pos_voucher_grants WHERE nguon = 'khach_moi' AND nguon_id = ?", [s.id]);
    const daNhan = async (s) => !!(await mot('SELECT claimed_at FROM pos_signup_codes WHERE id = ?', [s.id])).claimed_at;

    const b1 = await bill(), s1 = sdtQ2();
    await taoTk(s1);
    const r1 = await nhan(b1.code, s1);
    const g1 = await grantBill(b1), d1 = r1.data ? await mot('SELECT * FROM pos_discount_codes WHERE code = ?', [r1.data.voucher_code]) : null;
    k('Q2a tài khoản tạo SAU bill → 200, voucher_code MỚI ≠ mã bill, 1 grant khach_moi đúng SĐT + mẫu, hạn = hôm nay + 10, luật mẫu chụp vào mã',
      r1.status === 200 && !!g1 && r1.data.voucher_code !== b1.code && g1.code === r1.data.voucher_code && g1.customer_phone === s1
      && Number(g1.mau_id) === Number(tm.id) && g1.expires_at === addDaysToDateString(getToday(), 10) && !!d1 && Number(d1.discount_value) === 15000
      && d1.discount_type === 'fixed' && Number(d1.chinh_chu) === 1 && Number(d1.usage_limit) === 1 && r1.data.valid_to === g1.expires_at,
    `${moTa(r1)} ${JSON.stringify(g1)}`);
    k('Q2d mã bill KHÔNG còn là mã giảm: không có dòng pos_discount_codes cùng chữ; gõ ở ô mã → tinh-thu MA_KHONG_TON_TAI, đơn đủ giá',
      !(await mot('SELECT id FROM pos_discount_codes WHERE UPPER(code) = UPPER(?)', [b1.code]))
      && (await tinhThu({ items: [mon(0)], discount_code: b1.code })).ma_loi_code === 'MA_KHONG_TON_TAI'
      && (await tongDon(await ban({ items: [mon(0)], discount_code: b1.code }, 50000))) === 50000);

    const b2 = await bill(), s2 = sdtQ2();
    await taoTk(s2, b2.issued_at);
    const r2 = await nhan(b2.code, s2);
    k('Q2a2 tài khoản tạo CÙNG giây in bill → vẫn nhận (≥, không >)', r2.status === 200 && !!(await grantBill(b2)), moTa(r2));

    const b3 = await bill(), s3 = sdtQ2(), s3b = sdtQ2();
    await taoTk(s3, truGiay(b3.issued_at, 1));
    await taoTk(s3b, '2026-01-01 08:00:00');
    const r3 = await nhan(b3.code, s3), r3b = await nhan(b3.code, s3b);
    k('Q2b tài khoản có TRƯỚC bill 1 giây (và dạng giờ cũ có dấu cách) → 400 KHACH_DA_CO_TAI_KHOAN, không grant, mã bill chưa bị chiếm',
      [r3, r3b].every((r) => r.status === 400 && r.code === 'KHACH_DA_CO_TAI_KHOAN') && !(await grantBill(b3)) && !(await daNhan(b3)), `${moTa(r3)} / ${moTa(r3b)}`);
    const r4 = await nhan(b3.code, sdtQ2());
    k('Q2c SĐT chưa có tài khoản → 400 CAN_TAO_TAI_KHOAN, mã chưa bị chiếm', r4.status === 400 && r4.code === 'CAN_TAO_TAI_KHOAN' && !(await daNhan(b3)), moTa(r4));

    await goi('PUT', `/pos/rewards/mau/${tm.id}`, { bat: 0 });
    const s5 = sdtQ2(); await taoTk(s5);
    const r5 = await nhan(b3.code, s5);
    await goi('PUT', `/pos/rewards/mau/${tm.id}`, { bat: 1 });
    await datCaiDat('signup_mau_voucher_id', '');
    const r5b = await nhan(b3.code, s5);
    await datCaiDat('signup_mau_voucher_id', String(tm.id));
    k('Q2h mẫu đang tắt / chưa chọn mẫu → 400 UU_DAI_CHUA_CO_MAU, mã chưa bị chiếm', [r5, r5b].every((r) => r.status === 400 && r.code === 'UU_DAI_CHUA_CO_MAU')
      && !(await daNhan(b3)), `${moTa(r5)} / ${moTa(r5b)}`);

    const b6 = await bill(), s6a = sdtQ2(), s6b = sdtQ2();
    await taoTk(s6a); await taoTk(s6b);
    let r6b = null;
    co.mocTruocTx = async () => { r6b = await nhan(b6.code, s6b); };
    const r6a = await nhan(b6.code, s6a);
    const n6 = await so("SELECT COUNT(*) AS n FROM pos_voucher_grants WHERE nguon = 'khach_moi' AND nguon_id = ?", [b6.id]);
    k('Q2f hai SĐT nhận CÙNG mã bill chồng nhau → một 200, một 409 MA_DA_DUNG, đúng 1 grant', r6b?.status === 200 && r6a.status === 409 && r6a.code === 'MA_DA_DUNG'
      && n6 === 1, `${moTa(r6a)} / ${r6b && moTa(r6b)} · grant ${n6}`);

    const rs = await goi('POST', `/pos/signup-codes/${b1.id}/reset`, {});
    k('Q2e hoàn tác lần nhận → 200, xoá grant + mã voucher mới, mã bill nhận lại được', !!g1 && rs.status === 200 && !(await grantBill(b1))
      && !(await mot('SELECT id FROM pos_discount_codes WHERE code = ?', [r1.data.voucher_code])) && !(await daNhan(b1)), moTa(rs));
    const v2 = (await grantBill(b2)).code;
    const dung = await ban({ customer_phone: s2, items: [mon(0)], vouchers: [v2] }, 35000);
    const rs2 = await goi('POST', `/pos/signup-codes/${b2.id}/reset`, {});
    k('Q2e2 voucher đã dùng trong đơn → hoàn tác 400, grant + mã còn nguyên', dung.status === 200 && rs2.status === 400 && (await grantBill(b2))?.status === 'used'
      && !!(await mot('SELECT id FROM pos_discount_codes WHERE code = ?', [v2])), `${moTa(dung)} / ${moTa(rs2)}`);

    const b7 = await bill(), s7 = sdtQ2();
    const tk7 = kyTokenKhach(await taoTk(s7));
    const r7 = await goiTk(tk7, 'POST', '/kh/nhan-ma-bill', { ma: b7.code });
    const vi7 = await goiTk(tk7, 'GET', '/kh/voucher');
    const dv7 = (vi7.data || []).find((x) => x.code === r7.data?.voucher_code);
    k('Q2g App /kh/nhan-ma-bill (CÙNG hàm) → 200, voucher mới nằm trong ví App, nguon khach_moi, mo_ta từ mẫu', r7.status === 200 && !!dv7 && dv7.nguon === 'khach_moi'
      && dv7.mo_ta === 'Giảm 15.000đ · HSD ' + addDaysToDateString(getToday(), 10).split('-').reverse().join('/'), `${moTa(r7)} ${JSON.stringify(dv7)}`);

    const b8 = await bill(), s8 = sdtQ2();
    await taoTk(s8);
    const v8 = (await nhan(b8.code, s8)).data?.voucher_code;
    await goi('PUT', `/pos/orders/${b8.order_id}/cancel`, { reason: 'thử Q2i' });
    const tr8 = await soDon();
    const r8 = await ban({ customer_phone: s8, items: [mon(0)], vouchers: [v8] }, 35000);
    const r8b = await ban({ customer_phone: s8, items: [mon(0)], discount_code: v8 }, 35000);
    k('Q2i P20b: đơn gốc của mã bill đã huỷ → voucher mới bị chặn 400 MA_DON_GOC_KHONG_HOP_LE (cả danh sách voucher lẫn ô mã), không đơn, không tiêu',
      [r8, r8b].every((r) => r.status === 400 && r.code === 'MA_DON_GOC_KHONG_HOP_LE') && (await soDon()) === tr8 && (await grant(v8))?.status === 'available',
      `${moTa(r8)} / ${moTa(r8b)}`);

    let b026 = null;
    try { b026 = require(path.join(MAY_CHU, 'nang_cap', '026_voucher.js')); } catch { /* gốc chưa có bước 026 */ }
    const chay026 = async (cfg) => {
      for (const [key, v] of Object.entries(cfg)) await datCaiDat(key, v);
      await db.run("DELETE FROM pos_settings WHERE key = 'signup_mau_voucher_id'");
      const truoc = await so('SELECT COALESCE(MAX(id), 0) AS n FROM pos_mau_voucher');
      const tx = await db.beginTransaction();
      try { await b026.chay(tx, { themCot: async () => {} }); await tx.commit(); } catch (e) { await tx.rollback(); throw e; }
      return { moi: await mot('SELECT * FROM pos_mau_voucher WHERE id > ?', [truoc]), id: (await mot("SELECT value FROM pos_settings WHERE key = 'signup_mau_voucher_id'"))?.value };
    };
    const m1 = b026 ? await chay026({ signup_scope: 'order', signup_discount_type: 'percent', signup_discount_value: '10', signup_min_order: '50000', signup_voucher_valid_days: '15' }) : {};
    const m2 = b026 ? await chay026({ signup_scope: 'item' }) : {};
    await datCaiDat('signup_mau_voucher_id', String(tm.id));
    k('Q2j bước 026: ưu đãi giảm cả đơn 10 % từ 50.000, hạn 15 ngày → tạo SẴN mẫu y cấu hình (chia sẻ được) + ghi signup_mau_voucher_id; kiểu giảm 1 món → không tạo',
      !!m1.moi && m1.moi.kieu === 'phan_tram' && Number(m1.moi.gia_tri) === 10 && Number(m1.moi.don_toi_thieu) === 50000 && Number(m1.moi.han_ngay) === 15
      && Number(m1.moi.chinh_chu) === 0 && m1.id === String(m1.moi.id) && !m2.moi && !m2.id, JSON.stringify({ m1, m2 }));

    const kh = (() => { try { return fs.readFileSync(path.join(MAY_CHU, '..', 'client', 'src', 'pages', 'Customers.jsx'), 'utf8'); } catch { return ''; } })();
    k('Q2k quầy: form Thêm khách mới có ô "Mã trên bill (nếu có)", lưu khách xong gọi /signup-codes/claim qua utils/api.js', /Mã trên bill \(nếu có\)/.test(kh)
      && /api\.post\('\/signup-codes\/claim'/.test(kh));
    await datCaiDat('signup_enabled', '0');
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[K5] Không đổi: đơn không voucher, mã chung trên đơn chỉ món, đơn lấy từ gói + voucher');
  await chay('K5', async () => {
    const a = await khach();
    const r = await ban({ customer_phone: a.sdt, items: [mon(0), mon(1)] }, 83333);
    k('K1 đơn không voucher, không mã → 83.333 y hệt', r.status === 200 && (await tongDon(r)) === 83333, moTa(r));
    const m = await maChung('percent', 10);
    const r2 = await ban({ customer_phone: a.sdt, items: [mon(0), mon(1)], discount_code: m }, 75000);
    k('K3 mã chung 10 % trên đơn chỉ món → 83.333 − 8.333 = 75.000 y hệt cũ', r2.status === 200 && (await tongDon(r2)) === 75000, moTa(r2));
    const b = await khach();
    const g = await ban({ customer_phone: b.sdt, items: [], package_buy: { package_id: goiId } }, 300000);
    const cp = g.order ? await mot('SELECT id FROM pos_customer_packages WHERE order_id = ?', [g.order.id]) : null;
    const vt = await phat(b.sdt, 'tien', 10000);
    const r3 = cp ? await ban({ customer_phone: b.sdt, customer_package_id: cp.id, items: [mon(2, 1, { from_package: true }), mon(0)], vouchers: [vt] }, 40000) : {};
    k('K5 lấy từ gói (dòng 0đ) + món 50.000 + voucher 10.000 → 200, 40.000 (không chặn oan)', r3.status === 200 && (await tongDon(r3)) === 40000, moTa(r3));
    const f = typeof tinhUuDai === 'function' ? tinhUuDai : () => ({});
    const D = (gia, sl, tl) => ({ unit_price: gia, quantity: sl, ti_le_hang: tl });
    const x = f({ dong: [D(39000, 2, 10)], ma: { loai: 'fixed', gia_tri: 5000, tran: 0, mot_mon: null }, dungChung: false });
    k('K2 tinhUuDai không voucher: bộ số UUDAI-1 A4 (hạng 7.800, mã 0) giữ nguyên', x.cach === 'hang' && x.giam_hang === 7800 && x.giam_ma === 0, JSON.stringify(x));
  });

  sv.close();
  console.log(`\nVOUCHER-2: ${dat} đạt · ${hong} hỏng`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* — */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.error('✗ bài sập:', e); console.log(`\nVOUCHER-2: ${dat} đạt · ${hong + 1} hỏng`); process.exit(1); });
