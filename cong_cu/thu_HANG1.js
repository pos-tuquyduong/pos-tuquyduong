#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ HANG-1 — hạng thẻ: thêm hạng, thứ bậc, gói thời hạn (bán), hạng chỉ cấp, cấp có PIN chủ quán, hạng cao nhất còn hạn
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRÊN CODE CHƯA VÁ (PUT không thêm hạng, chưa có gói / cấp / PIN, hạng = dòng mới nhất). Xanh ngay = vô giá trị (K3).
 *
 *  Chạy ở GỐC kho POS:   node cong_cu/thu_HANG1.js [--goc <thư mục gốc bản sao>]
 *  Khuôn thu_P2223.js: database.js thật + libsql thật trên kho TẠM (bước nâng cấp chạy thật), route thật qua HTTP, SX giả. Đồng hồ giả
 *  (khuôn thu_GIOVN1.js): datVN('…') = giờ Việt Nam máy chủ thấy. co.mocTruocTx: chạy TRỌN một lệnh khác trước khi giao dịch kế tiếp mở
 *  (hai quầy cùng bán — tất định). Giao diện: đọc nguồn client/src (khoanh đúng file thẻ hạng / cấp hạng).
 *  Bản đột biến: --goc <thư mục> (viec/HANG-1/dot_bien.py chép server/, cong_cu/gia_lap/, client/src/ ra thư mục tạm).
 * ═══════════════════════════════════════════════════════════════════════════
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const os = require('os');
const path = require('path');

const iG = process.argv.indexOf('--goc');
const GOC = iG > 0 ? path.resolve(process.argv[iG + 1]) : path.join(__dirname, '..');
const MAY_CHU = path.join(GOC, 'server');
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_hang1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
const KHOA_NV = 'thu_hang1_nv_' + Date.now();
process.env.JWT_SECRET = KHOA_NV;
process.env.KH_JWT_SECRET = 'thu_hang1_kh_' + Date.now();
delete process.env.SX_API_KEY;   // customers-v2 đọc khách từ pos_customers (không gọi SX)

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const bang = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const doc = (f) => { try { return fs.readFileSync(path.join(GOC, f), 'utf8'); } catch { return ''; } };
const sach = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

// Đồng hồ giả (khuôn thu_GIOVN1.js): mọi new Date() / Date.now() của máy chủ đọc `gio`.
const DateGoc = Date;
let gio = DateGoc.UTC(2026, 10, 3, 3, 0, 0);
global.Date = class extends DateGoc {
  constructor(...a) { if (a.length === 0) super(gio); else super(...a); }
  static now() { return gio; }
};
const BAY_GIO_UTC = 7 * 60 * 60 * 1000;
const datVN = (s) => { gio = DateGoc.parse(s + 'Z') - BAY_GIO_UTC; };
const HAN_VO_HAN = '9999-12-31T23:59:59';

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const bcrypt = require(path.join(GOC, 'node_modules', 'bcryptjs'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  datVN('2026-11-03T10:00:00');
  await db.initDatabase();

  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const sxGia = async () => ({ ok: true });
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true, checkStock: async () => ({ sufficient: true, stock: 999 }),
    outStockFIFO: sxGia, inStockReturn: sxGia, callSxApi: async () => { throw new Error('SX tắt (thử)'); } };

  const co = { mocTruocTx: null };
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const moc = co.mocTruocTx; co.mocTruocTx = null;
    if (moc) await moc();
    return txGoc(...a);
  };

  const app = express();
  app.use(express.json());
  const gan = (duong, tep) => { try { app.use(duong, require(path.join(MAY_CHU, 'routes', tep))); } catch (e) { loiGoc(`(không nạp được ${tep}: ${e.message})`); } };
  gan('/api/pos/orders', 'orders.js');
  gan('/api/pos/tiers', 'tiers.js');
  gan('/api/pos/membership', 'membership.js');
  gan('/api/pos/v2/customers', 'customers-v2.js');
  gan('/api/kh', 'kh/index.js');
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  const { kyTokenKhach } = require(path.join(MAY_CHU, 'middleware', 'khachAuth.js'));
  const { tiLeHangMon, giaHangMon } = require(path.join(MAY_CHU, 'utils', 'giaHang.js'));
  const { BAT_BIEN } = require(path.join(GOC, 'cong_cu', 'gia_lap', 'bat_bien.js'));
  noiLai();

  const mot = (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const chu = await mot("SELECT id, username FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  await db.run('UPDATE pos_users SET password = ? WHERE id = ?', [bcrypt.hashSync('mk_chu_quan', 4), chu.id]);
  const nguoi = async (ten, vai) => Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)",
    [ten, ten, vai])).lastInsertRowid);
  const ky = (id) => jwt.sign({ userId: id }, KHOA_NV, { expiresIn: '1h' });
  const TK = { chu: ky(chu.id), ql: ky(await nguoi('ql_hang1', 'manager')), nv: ky(await nguoi('nv_hang1', 'staff')) };
  const goi = async (method, url, body, token = TK.chu) => {
    imLang();
    try {
      const h = { 'Content-Type': 'application/json' };
      if (token) h.Authorization = 'Bearer ' + token;
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined, headers: h });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } catch (e) { return { status: 0, error: e.message }; } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;
  const thu = async (ten, f) => { try { await f(); } catch (e) { k(`${ten} (bài sập giữa chừng)`, false, e.message); } };

  for (const [key, v] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', 1000], ['loyalty_expiry_mode', 'none'], ['flash_enabled', 'false']]) {
    await db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
  }
  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 1');
  await db.run('UPDATE pos_products SET price = 25000, is_special_group = 0 WHERE id = ?', [sp[0].id]);
  const mon = () => ({ product_id: sp[0].id, sx_product_type: sp[0].sx_product_type, sx_product_id: sp[0].sx_product_id, quantity: 1 });
  let soSdt = 0;
  const sdtMoi = () => '0939' + String(100000 + (++soSdt));
  const khach = async (sdt) => { await db.run("INSERT INTO pos_customers (phone, name, sx_status, created_at, updated_at) VALUES (?, 'Khách HANG-1', 'active', ?, ?)", [sdt, '2026-11-01T10:00:00', '2026-11-01T10:00:00']); return sdt; };
  const ban = (body) => goi('POST', '/pos/orders', { customer_name: 'Khách HANG-1', payment_method: 'cash', ...body });
  const muaThe = (sdt, tierId, soThang, tien, them = {}) => ban({ customer_phone: sdt, items: [], membership_buy: { tier_id: tierId, so_thang: soThang }, cash_amount: tien, ...them });
  const hangCua = async (sdt) => (await goi('GET', '/pos/membership/status/' + sdt)).data || {};
  const dongThe = (sdt) => db.query('SELECT * FROM pos_membership_purchases WHERE customer_phone = ? ORDER BY id', [sdt]);
  const ghiThe = (sdt, tierId, ten, luc, han) => db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
    VALUES (?, ?, ?, 0, NULL, ?, ?)`, [sdt, tierId, ten, luc, han]);
  const tiers = async () => ((await goi('GET', '/pos/tiers')).data?.tiers) || [];
  const tim = (ds, ten) => ds.find((t) => t.name === ten);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[N] bước nâng cấp 013 trên kho mới (seed Vàng + Bạch Kim)');
  let V = null, BK = null, KC = null;
  await thu('N', async () => {
    const ds = await tiers();
    V = tim(ds, 'Vàng'); BK = tim(ds, 'Bạch Kim');
    k('N1 Vàng → cach_co ban, đúng 2 gói 1 tháng + 3 tháng, giá trống, đang bán', V?.cach_co === 'ban'
      && bang(V?.goi, [{ so_thang: 1, gia: null, bat: true }, { so_thang: 3, gia: null, bat: true }]), JSON.stringify(V));
    k('N5 Bạch Kim (seed) → cach_co ban, gói rỗng', BK?.cach_co === 'ban' && bang(BK?.goi, []), JSON.stringify(BK));
    const s = sdtMoi();
    const r = await muaThe(s, BK?.id, 1, 2000000);
    k('N5b mua Bạch Kim (chưa gói nào) → 400 GOI_HANG_KHONG_BAN, không dòng thẻ', r.status === 400 && r.code === 'GOI_HANG_KHONG_BAN' && (await dongThe(s)).length === 0, moTa(r));
    const r2 = await muaThe(s, V?.id, 1, 500000);
    k('N1b mua Vàng 1 tháng khi gói chưa có giá → 400 GOI_HANG_KHONG_BAN (không bán theo giá thẻ cũ 500.000)', r2.status === 400 && r2.code === 'GOI_HANG_KHONG_BAN', moTa(r2));
    k('N4 có bảng sao lưu _sao_luu_013_pos_membership_tiers', await so("SELECT COUNT(*) FROM sqlite_master WHERE name = '_sao_luu_013_pos_membership_tiers'") === 1);
    const q = await db.query("SELECT role, allowed FROM pos_permissions WHERE permission = 'cap_hang' ORDER BY role");
    k('N6 quyền cap_hang: manager 0, owner 1, staff 0', bang(q.map((x) => x.role + ':' + x.allowed), ['manager:0', 'owner:1', 'staff:0']), JSON.stringify(q));
    const h0 = await goi('GET', '/kh/hang', null, null);
    const hv = (h0.data || []).find((x) => x.id === V?.id);
    k('N7 /kh/hang lúc chưa gói nào có giá: Vàng gia_the null, goi []', hv?.gia_the === null && bang(hv?.goi, []), JSON.stringify(hv));
  });

  // Gọi THẲNG chay() của 013 lần hai (bộ chạy bỏ qua bước đã ghi — đi qua bộ chạy là xanh oan).
  await thu('N2', async () => {
    const buoc = require(path.join(MAY_CHU, 'nang_cap', '013_hang.js'));
    const chay2 = async () => {
      const tx = await txGoc();
      try { await buoc.chay(tx, { themCot: async () => {} }); await tx.commit(); } catch (e) { await tx.rollback(); throw e; }
    };
    const kcCu = Number((await db.run(`INSERT INTO pos_membership_tiers (name, card_price, discount_percent, sort_order, is_active, created_at, updated_at)
      VALUES ('Kim Cương', 0, 15, 2, 1, '2026-11-01T10:00:00', '2026-11-01T10:00:00')`)).lastInsertRowid);
    const vCach = Number((await db.run(`INSERT INTO pos_membership_tiers (name, card_price, discount_percent, sort_order, is_active, created_at, updated_at)
      VALUES ('Vàng ', 0, 1, 0, 1, '2026-11-01T10:00:00', '2026-11-01T10:00:00')`)).lastInsertRowid);
    await db.run(`UPDATE pos_membership_tiers SET goi = '[{"so_thang":2,"gia":90000,"bat":true}]' WHERE id = ?`, [V?.id]);
    await chay2();
    const ds = await db.query('SELECT id, name, cach_co, goi, sort_order FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order, id');
    const x = (id) => ds.find((t) => t.id === id) || {};
    k('N2 chạy lại 013: gói chủ quán đã đặt cho Vàng giữ nguyên', x(V?.id).goi === '[{"so_thang":2,"gia":90000,"bat":true}]', x(V?.id).goi);
    k('N1c Kim Cương (tên khớp) → chi_cap, gói rỗng', x(kcCu).cach_co === 'chi_cap' && x(kcCu).goi === '[]', JSON.stringify(x(kcCu)));
    k('N3 "Vàng " (có khoảng trắng) → không đổi (ban, gói rỗng)', x(vCach).cach_co === 'ban' && x(vCach).goi === '[]', JSON.stringify(x(vCach)));
    k('N2b thứ bậc 0 / trùng → đánh lại 1..n theo thứ tự đang hiện', bang(ds.map((t) => t.sort_order), ds.map((_, i) => i + 1))
      && ds[0].id === vCach, JSON.stringify(ds.map((t) => [t.name, t.sort_order])));
    await db.run('DELETE FROM pos_membership_tiers WHERE id IN (?, ?)', [kcCu, vCach]);
    await db.run('UPDATE pos_membership_tiers SET sort_order = 1 WHERE id = ?', [V?.id]);
    await db.run('UPDATE pos_membership_tiers SET sort_order = 2 WHERE id = ?', [BK?.id]);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] Cài đặt hạng: thêm / sửa / xoá, gói, thứ bậc');
  const vangGoi = [{ so_thang: 1, gia: 100000, bat: true }, { so_thang: 3, gia: 270000, bat: true }, { so_thang: 6, gia: null, bat: true }, { so_thang: 12, gia: 500000, bat: false }];
  const dsMau = (doi = {}) => [
    { id: V?.id, name: 'Vàng', sort_order: 1, discount_percent: 10, special_discount_percent: 5, cach_co: 'ban', goi: vangGoi, ...(doi.V || {}) },
    { id: BK?.id, name: 'Bạch Kim', sort_order: 2, discount_percent: 12, special_discount_percent: 6, cach_co: 'ban', goi: [{ so_thang: 1, gia: 150000, bat: true }], ...(doi.BK || {}) },
    ...(KC ? [{ id: KC.id, name: 'Kim Cương', sort_order: 3, discount_percent: 15, special_discount_percent: 10, cach_co: 'chi_cap', goi: [], ...(doi.KC || {}) }] : []),
  ];
  const luu = (ds, token) => goi('PUT', '/pos/tiers', { tiers: ds, round_to: 500, round_mode: 'nearest' }, token);
  await thu('A', async () => {
    const r = await luu([...dsMau(), { name: 'Kim Cương', sort_order: 3, discount_percent: 15, special_discount_percent: 10, cach_co: 'chi_cap', goi: [{ so_thang: 1, gia: 1000, bat: true }] }]);
    const ds = await tiers();
    KC = tim(ds, 'Kim Cương'); V = tim(ds, 'Vàng'); BK = tim(ds, 'Bạch Kim');
    k('A1 PUT thêm hạng không id → 200, GET thấy Kim Cương (thứ bậc 3, chi_cap)', r.status === 200 && !!KC && KC.sort_order === 3 && KC.cach_co === 'chi_cap', moTa(r));
    k('A6 hạng chi_cap gửi kèm gói → lưu gói rỗng', bang(KC?.goi, []), JSON.stringify(KC?.goi));
    k('A1b Vàng lưu đủ 4 gói (giá trống / tắt giữ nguyên)', bang(V?.goi, vangGoi), JSON.stringify(V?.goi));
    const r2 = await luu(dsMau({ V: { goi: [vangGoi[0], { so_thang: 2, gia: 190000, bat: true }, vangGoi[1]] } }));
    k('A2 sửa gói (bỏ 6 + 12 tháng, thêm 2 tháng) → đúng danh sách, xếp theo tháng', r2.status === 200
      && bang(tim(await tiers(), 'Vàng')?.goi.map((g) => g.so_thang), [1, 2, 3]), moTa(r2));
    for (const [n, mong] of [[0, 400], [1, 200], [60, 200], [61, 400], [1.5, 400]]) {
      const x = await luu(dsMau({ V: { goi: [{ so_thang: n, gia: 100000, bat: true }] } }));
      k(`A3 gói ${n} tháng → ${mong}${mong === 400 ? ' HANG_KHONG_HOP_LE' : ''}`, x.status === mong && (mong === 200 || x.code === 'HANG_KHONG_HOP_LE'), moTa(x));
    }
    const truoc = JSON.stringify(await tiers());
    for (const [ten, doi] of [['giá âm', { V: { goi: [{ so_thang: 1, gia: -5, bat: true }] } }], ['giá lẻ 1000,5', { V: { goi: [{ so_thang: 1, gia: 1000.5, bat: true }] } }],
      ['giá 0', { V: { goi: [{ so_thang: 1, gia: 0, bat: true }] } }], ['hai gói cùng 1 tháng', { V: { goi: [vangGoi[0], vangGoi[0]] } }],
      ['cach_co lạ', { V: { cach_co: 'tang' } }], ['thứ bậc trùng (Vàng 2 = Bạch Kim 2)', { V: { sort_order: 2 } }], ['thứ bậc 0', { V: { sort_order: 0 } }],
      ['tên trống', { BK: { name: '  ' } }], ['% 91', { BK: { discount_percent: 91 } }]]) {
      const x = await luu(dsMau(doi));
      k(`A4 ${ten} → 400 HANG_KHONG_HOP_LE`, x.status === 400 && x.code === 'HANG_KHONG_HOP_LE', moTa(x));
    }
    k('A4b các lần 400 không ghi gì (kể cả hạng hợp lệ đứng trước trong danh sách)', JSON.stringify(await tiers()) === truoc);
    const nv = await luu(dsMau(), TK.nv);
    k('A7 nhân viên PUT → 403', nv.status === 403, moTa(nv));
    const ql = await luu(dsMau(), TK.ql);
    k('A7b (K5) quản lý (có manage_promotions) PUT → 200', ql.status === 200, moTa(ql));
    const lai = await goi('GET', '/pos/tiers');
    const pl = await goi('PUT', '/pos/tiers', { tiers: lai.data?.tiers, round_to: lai.data?.round_to, round_mode: lai.data?.round_mode });
    k('K5 PUT lại nguyên GET → 200, không đổi', pl.status === 200 && JSON.stringify((await goi('GET', '/pos/tiers')).data?.tiers) === JSON.stringify(lai.data?.tiers), moTa(pl));
    const r3 = await luu(dsMau());
    k('A (dựng) đặt lại Vàng 4 gói', r3.status === 200, moTa(r3));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] Bán gói ở quầy');
  await thu('B', async () => {
    datVN('2026-11-03T10:00:00');
    const s1 = sdtMoi();
    const b1 = await ban({ customer_phone: s1, items: [], membership_buy: { tier_id: V?.id, so_thang: 3, gia: 1, unit_price: 1, card_price: 1 }, unit_price: 1, cash_amount: 270000 });
    const d1 = (await dongThe(s1))[0] || {};
    k('B1 mua Vàng 3 tháng, máy khách gửi giá giả → 200, tổng = 270.000 (giá gói máy chủ), sổ ghi ban · 3 tháng · 270.000',
      b1.status === 200 && Number(b1.order?.total) === 270000 && d1.loai === 'ban' && Number(d1.so_thang) === 3 && Number(d1.price_paid) === 270000, `${moTa(b1)} · ${JSON.stringify(d1)}`);
    const b1b = await ban({ customer_phone: sdtMoi(), items: [{ product_id: -1000000 - V?.id, quantity: 1, unit_price: 1 }], membership_buy: { tier_id: V?.id, so_thang: 1 }, cash_amount: 100001 });
    k('B1b dòng giỏ giả cùng product_id thẻ giá 1đ → không thành đơn rẻ hơn giá gói', b1b.status !== 200 || Number(b1b.order?.total) >= 100000, moTa(b1b));
    for (const [ten, st] of [['gói 6 tháng chưa có giá', 6], ['gói 12 tháng đang tắt', 12], ['2 tháng (không có gói)', 2]]) {
      const s = sdtMoi(); const x = await muaThe(s, V?.id, st, 0);
      k(`B2 ${ten} → 400 GOI_HANG_KHONG_BAN, không dòng thẻ`, x.status === 400 && x.code === 'GOI_HANG_KHONG_BAN' && (await dongThe(s)).length === 0, moTa(x));
    }
    const s3 = sdtMoi(); const b3 = await muaThe(s3, KC?.id, 1, 0);
    k('B3 bán hạng chi_cap → 400 HANG_CHI_CAP', b3.status === 400 && b3.code === 'HANG_CHI_CAP' && (await dongThe(s3)).length === 0, moTa(b3));
    const b7 = await ban({ customer_phone: sdtMoi(), items: [], membership_buy: { tier_id: V?.id }, cash_amount: 100000 });
    k('B7 thiếu so_thang → 400 THE_MUA_THIEU_THONG_TIN', b7.status === 400 && b7.code === 'THE_MUA_THIEU_THONG_TIN', moTa(b7));
    const t1 = await goi('POST', '/pos/orders/tinh-thu', { customer_phone: sdtMoi(), items: [], membership_buy: { tier_id: V?.id, so_thang: 3, gia: 1 } });
    const t2 = await goi('POST', '/pos/orders/tinh-thu', { customer_phone: sdtMoi(), items: [], membership_buy: { tier_id: KC?.id, so_thang: 1 } });
    k('B8 /tinh-thu cùng giá gói (270.000) + cùng mã lỗi HANG_CHI_CAP', t1.status === 200 && Number(t1.total ?? t1.data?.total) === 270000
      && t2.status === 400 && t2.code === 'HANG_CHI_CAP', `${moTa(t1)} ${JSON.stringify(t1).slice(0, 120)} · ${moTa(t2)}`);

    // cộng nối
    const s5 = sdtMoi();
    datVN('2026-11-03T10:00:00'); const m1 = await muaThe(s5, V?.id, 1, 100000);
    datVN('2026-11-04T09:00:00'); const m2 = await muaThe(s5, V?.id, 1, 100000);
    const h5 = await hangCua(s5);
    k('B5 mua Vàng 1 tháng hai lần (lần 2 khi còn hạn) → hạn = 03.11 + 1 tháng + 1 tháng = "2027-01-03T10:00:00"', m1.status === 200 && m2.status === 200
      && h5.expires_at === '2027-01-03T10:00:00' && h5.tier_id === V?.id, `${moTa(m1)} ${moTa(m2)} · ${JSON.stringify(h5)}`);
    const s5b = sdtMoi();
    datVN('2026-11-03T10:00:00'); await muaThe(s5b, V?.id, 1, 100000);
    datVN('2027-01-10T08:30:00'); const m3 = await muaThe(s5b, V?.id, 1, 100000);
    const h5b = await hangCua(s5b);
    k('B5b mua lần 2 SAU khi lần 1 hết hạn → tính từ lúc mua: "2027-02-10T08:30:00"', m3.status === 200 && h5b.expires_at === '2027-02-10T08:30:00', JSON.stringify(h5b));
    // hai quầy cùng bấm
    datVN('2026-11-03T10:00:00');
    const s6 = sdtMoi(); let m6b = null;
    co.mocTruocTx = async () => { m6b = await muaThe(s6, V?.id, 1, 100000); };
    const m6a = await muaThe(s6, V?.id, 1, 100000);
    const h6 = await hangCua(s6);
    k('B6 hai quầy cùng bán Vàng 1 tháng cho một khách → 2 đơn, 2 dòng, hạn cộng ĐỦ 2 kỳ "2027-01-03T10:00:00"', m6a.status === 200 && m6b?.status === 200
      && (await dongThe(s6)).length === 2 && h6.expires_at === '2027-01-03T10:00:00', `${moTa(m6a)} ${m6b && moTa(m6b)} · ${JSON.stringify(h6)}`);

    // chặn hạng thấp hơn
    const s4 = sdtMoi();
    await ghiThe(s4, KC?.id, 'Kim Cương', '2026-11-01T10:00:00', '2027-11-01T10:00:00');
    const b4 = await muaThe(s4, V?.id, 1, 100000);
    k('B4 khách đang có Kim Cương còn hạn mua Vàng → 400 DA_CO_HANG_CAO_HON, không dòng mới', b4.status === 400 && b4.code === 'DA_CO_HANG_CAO_HON' && (await dongThe(s4)).length === 1, moTa(b4));
    const s4b = sdtMoi();
    await ghiThe(s4b, KC?.id, 'Kim Cương', '2026-09-01T10:00:00', '2026-10-01T10:00:00');
    const b4b = await muaThe(s4b, V?.id, 1, 100000);
    k('B4b (K5) Kim Cương ĐÃ hết hạn → mua Vàng 200', b4b.status === 200, moTa(b4b));
    const s4c = sdtMoi();
    await muaThe(s4c, V?.id, 1, 100000);
    const b4c = await muaThe(s4c, BK?.id, 1, 150000);
    const h4c = await hangCua(s4c);
    k('B4c (K5) lên hạng: có Vàng còn hạn mua Bạch Kim → 200, hạng hiện tại Bạch Kim', b4c.status === 200 && h4c.tier_id === BK?.id, `${moTa(b4c)} · ${JSON.stringify(h4c)}`);
    globalThis.__s4c = s4c;
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] Cấp / thu hồi hạng — chỉ chủ quán + PIN chủ quán');
  const PIN = '246810';
  await thu('C', async () => {
    datVN('2026-11-03T10:00:00');
    const p0 = await goi('POST', '/pos/membership/pin-chu-quan', { mat_khau: 'mk_chu_quan', pin: PIN, pin_lai: PIN }, TK.ql);
    k('C0a quản lý đặt PIN chủ quán → 403', p0.status === 403, moTa(p0));
    const p1 = await goi('POST', '/pos/membership/pin-chu-quan', { mat_khau: 'sai', pin: PIN, pin_lai: PIN });
    k('C0b chủ quán gõ sai mật khẩu đăng nhập → 400 MAT_KHAU_SAI', p1.status === 400 && p1.code === 'MAT_KHAU_SAI', moTa(p1));
    for (const pin of ['123', '1234567', '12a4']) {
      const x = await goi('POST', '/pos/membership/pin-chu-quan', { mat_khau: 'mk_chu_quan', pin, pin_lai: pin });
      k(`C0c PIN "${pin}" → 400 PIN_CHU_QUAN_KHONG_HOP_LE`, x.status === 400 && x.code === 'PIN_CHU_QUAN_KHONG_HOP_LE', moTa(x));
    }
    const sCap = sdtMoi();
    const c00 = await goi('POST', '/pos/membership/cap', { phone: sCap, tier_id: KC?.id, so_thang: null, pin: PIN });
    k('C0d chưa đặt PIN → 400 CHUA_CO_PIN_CHU_QUAN', c00.status === 400 && c00.code === 'CHUA_CO_PIN_CHU_QUAN', moTa(c00));
    const p2 = await goi('POST', '/pos/membership/pin-chu-quan', { mat_khau: 'mk_chu_quan', pin: PIN, pin_lai: PIN });
    const co2 = await goi('GET', '/pos/membership/pin-chu-quan', null, TK.nv);
    k('C0e chủ quán đặt PIN 6 số → 200; GET báo co_pin true (không trả PIN / băm)', p2.status === 200 && co2.data?.co_pin === true && !JSON.stringify(co2).includes('$2'), `${moTa(p2)} · ${JSON.stringify(co2)}`);
    k('C0f PIN chủ quán KHÔNG nằm trong pos_settings (GET /settings trả mọi khoá cho mọi nhân viên, PUT cho quản lý ghi đè)',
      await so("SELECT COUNT(*) FROM pos_settings WHERE key LIKE '%pin%' OR value LIKE '$2%'") === 0);

    for (const [ten, tk] of [['quản lý', TK.ql], ['nhân viên', TK.nv]]) {
      const x = await goi('POST', '/pos/membership/cap', { phone: sCap, tier_id: KC?.id, so_thang: null, pin: PIN }, tk);
      k(`C1 ${ten} cấp hạng (đúng PIN) → 403, không dòng thẻ`, x.status === 403 && (await dongThe(sCap)).length === 0, moTa(x));
    }
    const sKhoa = sdtMoi();
    for (let i = 1; i <= 5; i++) {
      const x = await goi('POST', '/pos/membership/cap', { phone: sKhoa, tier_id: KC?.id, so_thang: null, pin: '000000' });
      k(`C2 sai PIN lần ${i} → 400 PIN_CHU_QUAN_SAI`, x.status === 400 && x.code === 'PIN_CHU_QUAN_SAI', moTa(x));
    }
    const x6 = await goi('POST', '/pos/membership/cap', { phone: sKhoa, tier_id: KC?.id, so_thang: null, pin: PIN });
    k('C2b sau 5 lần sai, PIN đúng vẫn → 423 PIN_CHU_QUAN_KHOA, không dòng thẻ', x6.status === 423 && x6.code === 'PIN_CHU_QUAN_KHOA' && (await dongThe(sKhoa)).length === 0, moTa(x6));
    datVN('2026-11-03T10:14:00');
    const x7 = await goi('POST', '/pos/membership/cap', { phone: sKhoa, tier_id: KC?.id, so_thang: null, pin: PIN });
    datVN('2026-11-03T10:16:00');
    const x8 = await goi('POST', '/pos/membership/cap', { phone: sKhoa, tier_id: KC?.id, so_thang: 1, pin: PIN });
    k('C2c khoá 15 phút: 14 phút sau vẫn 423, 16 phút sau PIN đúng → 200', x7.status === 423 && x8.status === 200, `${moTa(x7)} · ${moTa(x8)}`);

    datVN('2026-11-03T11:00:00');
    const don0 = await so('SELECT COUNT(*) FROM pos_orders');
    const c3 = await goi('POST', '/pos/membership/cap', { phone: sCap, tier_id: KC?.id, so_thang: null, pin: PIN });
    const d3 = await dongThe(sCap);
    const h3 = await hangCua(sCap);
    k('C3 chủ quán + PIN cấp Kim Cương không thời hạn → 200, 1 dòng cap · vô hạn · 0đ · không đơn · ghi người cấp', c3.status === 200 && d3.length === 1
      && d3[0].loai === 'cap' && d3[0].so_thang === null && d3[0].expires_at === HAN_VO_HAN && Number(d3[0].price_paid) === 0 && d3[0].order_id === null
      && d3[0].created_by === chu.username && d3[0].purchased_at === '2026-11-03T11:00:00' && await so('SELECT COUNT(*) FROM pos_orders') === don0, `${moTa(c3)} · ${JSON.stringify(d3)}`);
    k('D3 vô hạn → hạng Kim Cương, expires_at null, days_remaining null, status active', h3.tier_id === KC?.id && h3.expires_at === null
      && h3.days_remaining === null && h3.status === 'active' && h3.vo_han === true, JSON.stringify(h3));
    const c4 = await goi('POST', '/pos/membership/cap', { phone: sdtMoi(), tier_id: V?.id, so_thang: 3, pin: PIN });
    k('C4 cấp hạng bán (Vàng) → 400 HANG_KHONG_PHAI_CHI_CAP', c4.status === 400 && c4.code === 'HANG_KHONG_PHAI_CHI_CAP', moTa(c4));
    const s5 = sdtMoi();
    const c5 = await goi('POST', '/pos/membership/cap', { phone: s5, tier_id: KC?.id, so_thang: 3, pin: PIN });
    k('C5 cấp 3 tháng lúc 03.11 11:00 → hạn "2027-02-03T11:00:00"', c5.status === 200 && (await hangCua(s5)).expires_at === '2027-02-03T11:00:00', moTa(c5));
    for (const [ten, st] of [['61 tháng', 61], ['0 tháng', 0], ['không gửi so_thang', undefined], ['"3"', '3x']]) {
      const s = sdtMoi(); const x = await goi('POST', '/pos/membership/cap', { phone: s, tier_id: KC?.id, so_thang: st, pin: PIN });
      k(`C5b cấp ${ten} → 400, không dòng thẻ`, x.status === 400 && (await dongThe(s)).length === 0, moTa(x));
    }
    const c7 = await goi('POST', '/pos/membership/cap', { phone: ' ', tier_id: KC?.id, so_thang: 1, pin: PIN });
    k('C7 SĐT trống → 400', c7.status === 400, moTa(c7));
    const sSx = sdtMoi();
    const c7b = await goi('POST', '/pos/membership/cap', { phone: sSx, tier_id: KC?.id, so_thang: 1, pin: PIN });
    k('C7b (K5) khách chưa có dòng pos_customers (chỉ có ở SX) → cấp 200, KHÔNG tạo khách', c7b.status === 200
      && await so('SELECT COUNT(*) FROM pos_customers WHERE phone = ?', [sSx]) === 0, moTa(c7b));

    // thu hồi
    const s6 = sdtMoi();
    datVN('2026-11-03T12:00:00');
    await muaThe(s6, V?.id, 3, 270000);
    await goi('POST', '/pos/membership/cap', { phone: s6, tier_id: KC?.id, so_thang: null, pin: PIN });
    const truoc6 = (await hangCua(s6)).tier_id;
    for (const [ten, tk] of [['quản lý', TK.ql], ['nhân viên', TK.nv]]) {
      const x = await goi('POST', '/pos/membership/thu-hoi', { phone: s6, tier_id: KC?.id, pin: PIN }, tk);
      k(`C6b ${ten} thu hồi → 403`, x.status === 403, moTa(x));
    }
    const x6s = await goi('POST', '/pos/membership/thu-hoi', { phone: s6, tier_id: KC?.id, pin: '111111' });
    k('C6b thu hồi sai PIN → 400 PIN_CHU_QUAN_SAI', x6s.status === 400 && x6s.code === 'PIN_CHU_QUAN_SAI', moTa(x6s));
    const c6 = await goi('POST', '/pos/membership/thu-hoi', { phone: s6, tier_id: KC?.id, pin: PIN });
    const d6 = await dongThe(s6);
    const h6 = await hangCua(s6);
    k('C6 thu hồi Kim Cương → 200, thêm dòng thu_hoi (không xoá dòng cũ), hạng về Vàng', truoc6 === KC?.id && c6.status === 200 && d6.length === 3
      && d6[2].loai === 'thu_hoi' && d6[2].created_by === chu.username && h6.tier_id === V?.id && h6.expires_at === '2027-02-03T12:00:00', `${moTa(c6)} · ${JSON.stringify(h6)}`);
    const c6c = await goi('POST', '/pos/membership/thu-hoi', { phone: s6, tier_id: V?.id, pin: PIN });
    k('C6c thu hồi hạng bán (Vàng) → 400', c6c.status === 400, moTa(c6c));
    const nk = await goi('GET', '/pos/membership/nhat-ky/' + s6, null, TK.nv);
    k('C8 nhật ký hạng: 3 dòng mới trước (thu_hoi, cap, ban) kèm người, lúc, số tháng, đơn', nk.status === 200
      && bang((nk.data || []).map((d) => d.loai), ['thu_hoi', 'cap', 'ban']) && (nk.data || []).every((d) => 'created_by' in d && 'purchased_at' in d && 'so_thang' in d && 'order_id' in d), JSON.stringify(nk).slice(0, 200));
    globalThis.__PIN = PIN;
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] Hạng hiện tại = thứ bậc CAO NHẤT còn hạn — 5 chỗ đọc');
  const namChoDoc = async (sdt) => {
    const st = (await hangCua(sdt)).tier_id;
    const tkKh = kyTokenKhach(Number((await mot('SELECT id FROM pos_customers WHERE phone = ?', [sdt])).id));
    const toi = (await goi('GET', '/kh/toi', null, tkKh)).khach?.hang?.id;
    const ds = await goi('GET', '/pos/v2/customers');
    const ten = (ds.customers || []).find((c) => c.phone === sdt)?.membership?.tier_name;
    const d = await ban({ customer_phone: sdt, items: [mon()], cash_amount: 25000 });
    const hangDon = d.order?.customer_tier;
    const ct = await mot('SELECT tier_unit_price FROM pos_order_items WHERE order_id = ? AND product_id > 0', [d.order?.id]);
    return { st, toi, ten, hangDon, giaHang: ct?.tier_unit_price ?? null };
  };
  await thu('D', async () => {
    datVN('2026-11-03T13:00:00');
    const s1 = await khach(sdtMoi());
    await muaThe(s1, V?.id, 3, 270000);
    await goi('POST', '/pos/membership/cap', { phone: s1, tier_id: KC?.id, so_thang: 1, pin: globalThis.__PIN });
    const a = await namChoDoc(s1);
    const giaKC = giaHangMon(25000, tiLeHangMon({ discount_percent: 15, special_discount_percent: 10 }, false));
    k('D1 Vàng + Kim Cương còn hạn → Kim Cương ở /membership/status, /kh/toi, danh sách khách, đơn (tên hạng + giá hạng)', a.st === KC?.id && a.toi === KC?.id
      && a.ten === 'Kim Cương' && a.hangDon === 'Kim Cương' && Number(a.giaHang) === giaKC, JSON.stringify(a));
    datVN('2026-12-05T13:00:00');
    const b = await namChoDoc(s1);
    const giaV = giaHangMon(25000, tiLeHangMon({ discount_percent: 10, special_discount_percent: 5 }, false));
    k('D2 Kim Cương hết hạn (1 tháng), Vàng còn (3 tháng) → về Vàng ở cả 5 chỗ', b.st === V?.id && b.toi === V?.id && b.ten === 'Vàng'
      && b.hangDon === 'Vàng' && Number(b.giaHang) === giaV, JSON.stringify(b));
    datVN('2026-11-03T13:00:00');
    const s5 = await khach(sdtMoi());
    await ghiThe(s5, KC?.id, 'Kim Cương', '2026-11-01T10:00:00', '2027-11-01T10:00:00');
    await ghiThe(s5, V?.id, 'Vàng', '2026-11-02T10:00:00', '2027-01-02T10:00:00');
    const c = await namChoDoc(s5);
    k('D5 dòng MỚI NHẤT là Vàng nhưng Kim Cương còn hạn → Kim Cương ở cả 5 chỗ (bắt hàm cũ "dòng mới nhất")', c.st === KC?.id && c.toi === KC?.id
      && c.ten === 'Kim Cương' && c.hangDon === 'Kim Cương' && Number(c.giaHang) === giaKC, JSON.stringify(c));
    const s4 = globalThis.__s4c;
    const d0 = (await hangCua(s4)).tier_id;
    const r = await luu(dsMau({ V: { sort_order: 2 }, BK: { sort_order: 1 } }));
    const d1 = (await hangCua(s4)).tier_id;
    await luu(dsMau());
    k('D4 đổi thứ bậc (Vàng ▲ trên Bạch Kim) → hạng hiện tại của khách có cả hai đổi theo', d0 === BK?.id && r.status === 200 && d1 === V?.id, `${d0} → ${moTa(r)} → ${d1}`);
    const tkKh = kyTokenKhach(Number((await mot('SELECT id FROM pos_customers WHERE phone = ?', [s5])).id));
    const menu = await goi('GET', '/kh/menu', null, tkKh);
    const m0 = (menu.data || [])[0];
    k('D1b /kh/menu có giá hạng Kim Cương (hạng chi_cap đang bật)', (m0?.gia_hang || []).some((g) => g.hang_id === KC?.id), JSON.stringify(m0?.gia_hang));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] Huỷ / xoá đơn mua gói — hạn các lần sau tính lại');
  await thu('E', async () => {
    for (const [ten, boDon, huyLan, mong] of [
      ['E1 huỷ lần 1 (1 tháng) → hạn = lúc mua lần 2 + 3 tháng', 'huy', 1, '2027-02-04T10:00:00'],
      ['E2 XOÁ đơn lần 1 → cùng kết quả', 'xoa', 1, '2027-02-04T10:00:00'],
      ['E3 huỷ lần 2 (3 tháng) → hạn = lần 1', 'huy', 2, '2026-12-03T10:00:00']]) {
      const s = sdtMoi();
      datVN('2026-11-03T10:00:00'); const l1 = await muaThe(s, V?.id, 1, 100000);
      datVN('2026-11-04T10:00:00'); const l2 = await muaThe(s, V?.id, 3, 270000);
      const truoc = (await hangCua(s)).expires_at;
      const id = (huyLan === 1 ? l1 : l2).order?.id;
      const x = boDon === 'huy' ? await goi('PUT', `/pos/orders/${id}/cancel`, { reason: 'thử HANG-1' }) : await goi('DELETE', `/pos/orders/${id}`);
      const sau = await hangCua(s);
      k(ten, truoc === '2027-03-03T10:00:00' && x.status === 200 && sau.expires_at === mong && sau.tier_id === V?.id, `${truoc} → ${moTa(x)} → ${JSON.stringify(sau)}`);
    }
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[F] App KH: /hang + /toi theo hợp đồng v7');
  await thu('F', async () => {
    datVN('2026-11-03T14:00:00');
    const h = await goi('GET', '/kh/hang', null, null);
    const x = (id) => (h.data || []).find((t) => t.id === id) || {};
    const TRUONG = ['chi_cap', 'gia_the', 'goi', 'id', 'phan_tram', 'phan_tram_nhom_dac_biet', 'ten', 'thu_bac', 'thu_tu'];
    k('F1 mỗi hạng ĐÚNG 9 trường (thêm chi_cap, goi, thu_bac; giữ gia_the, thu_tu)', h.status === 200 && (h.data || []).length >= 3
      && (h.data || []).every((t) => bang(Object.keys(t).sort(), TRUONG)), JSON.stringify(h.data?.[0]));
    k('F1b Vàng: goi = gói đang bán CÓ giá, xếp theo tháng; gia_the = gói ngắn nhất; thu_bac 1', bang(x(V?.id).goi, [{ so_thang: 1, gia: 100000 }, { so_thang: 3, gia: 270000 }])
      && x(V?.id).gia_the === 100000 && x(V?.id).chi_cap === false && x(V?.id).thu_bac === 1, JSON.stringify(x(V?.id)));
    k('F1c Kim Cương: chi_cap true, goi [], gia_the null, thu_bac 3', x(KC?.id).chi_cap === true && bang(x(KC?.id).goi, []) && x(KC?.id).gia_the === null
      && x(KC?.id).thu_bac === 3, JSON.stringify(x(KC?.id)));
    const s = await khach(sdtMoi());
    await goi('POST', '/pos/membership/cap', { phone: s, tier_id: KC?.id, so_thang: null, pin: globalThis.__PIN });
    const toi = await goi('GET', '/kh/toi', null, kyTokenKhach(Number((await mot('SELECT id FROM pos_customers WHERE phone = ?', [s])).id)));
    k('F2 /toi.khach.hang của khách vô hạn: Kim Cương, het_han null', toi.status === 200 && toi.khach?.hang?.id === KC?.id && toi.khach?.hang?.het_han === null
      && 'het_han' in (toi.khach?.hang || {}), JSON.stringify(toi.khach?.hang));
    const s2 = await khach(sdtMoi());
    await muaThe(s2, V?.id, 1, 100000);
    const toi2 = await goi('GET', '/kh/toi', null, kyTokenKhach(Number((await mot('SELECT id FROM pos_customers WHERE phone = ?', [s2])).id)));
    k('F2b (K5) khách mua Vàng 1 tháng: het_han = "2026-12-03T14:00:00"', toi2.khach?.hang?.het_han === '2026-12-03T14:00:00', JSON.stringify(toi2.khach?.hang));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A5] Xoá hạng');
  await thu('A5', async () => {
    datVN('2026-11-03T15:00:00');
    const x = await goi('DELETE', `/pos/tiers/${KC?.id}`);
    k('A5 xoá Kim Cương (còn khách giữ) → 409 HANG_CON_KHACH, hạng vẫn bật', x.status === 409 && x.code === 'HANG_CON_KHACH' && !!tim(await tiers(), 'Kim Cương'), moTa(x));
    const tam = await luu([...dsMau(), { name: 'Tạm', sort_order: 9, discount_percent: 1, special_discount_percent: 0, cach_co: 'ban', goi: [] }]);
    const T = tim(await tiers(), 'Tạm');
    await ghiThe(sdtMoi(), T?.id, 'Tạm', '2026-09-01T10:00:00', '2026-10-01T10:00:00');
    const y = await goi('DELETE', `/pos/tiers/${T?.id}`);
    k('A5b (K5) xoá hạng chỉ còn khách ĐÃ hết hạn → 200, ẩn', tam.status === 200 && y.status === 200 && !tim(await tiers(), 'Tạm'), `${moTa(tam)} · ${moTa(y)}`);
    const z = await goi('DELETE', `/pos/tiers/${KC?.id}`, null, TK.nv);
    k('A5c nhân viên xoá hạng → 403', z.status === 403, moTa(z));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[K5] không đổi: khách một hạng (dòng sổ CŨ), điểm, đơn thường');
  await thu('K', async () => {
    datVN('2026-11-03T16:00:00');
    const s = sdtMoi();
    await ghiThe(s, V?.id, 'Vàng', '2026-10-01 10:00:00', '2026-12-01 10:00:00');
    const h = await hangCua(s);
    k('K4 dòng sổ CŨ (không so_thang, giờ dấu cách) → Vàng, hạn "2026-12-01T10:00:00", expiring/active', h.tier_id === V?.id && h.expires_at === '2026-12-01T10:00:00'
      && ['active', 'expiring_soon'].includes(h.status), JSON.stringify(h));
    const d = await ban({ customer_phone: s, items: [mon()], cash_amount: 25000 });
    const giaV = giaHangMon(25000, tiLeHangMon({ discount_percent: 10, special_discount_percent: 5 }, false));
    const ct = await mot('SELECT tier_unit_price FROM pos_order_items WHERE order_id = ? AND product_id > 0', [d.order?.id]);
    const diem = await so("SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [d.order?.id]);
    k('K1 khách đúng một hạng còn hạn: giá hạng trên đơn như cũ', d.status === 200 && Number(ct?.tier_unit_price) === giaV && d.order?.customer_tier === 'Vàng', `${moTa(d)} · ${ct?.tier_unit_price} ≠ ${giaV}?`);
    k('K2 điểm của đơn có giảm hạng = tổng / 1.000', diem === Math.floor(Number(d.order?.total) / 1000), `${diem} · ${d.order?.total}`);
    const s3 = sdtMoi();
    const d3 = await ban({ customer_phone: s3, items: [mon()], cash_amount: 25000 });
    k('K3 khách không hạng mua đơn thường → 200, 25.000, không hạng', d3.status === 200 && Number(d3.order?.total) === 25000 && !d3.order?.customer_tier, moTa(d3));
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[O] Đối soát I15 — dòng cấp / thu hồi không có đơn');
  await thu('O', async () => {
    const q = (sql, a) => db.query(sql, a);
    const caps = await db.query("SELECT id FROM pos_membership_purchases WHERE order_id IS NULL AND loai IN ('cap', 'thu_hoi')");
    const lech = await BAT_BIEN.I15(q);
    k('O1 có dòng cấp + thu hồi (order_id NULL) → I15 không báo lệch dòng nào của chúng', caps.length >= 3
      && !lech.some((m) => caps.some((c) => m.includes(`#${c.id} `))), `${caps.length} dòng · ${lech.slice(0, 3).join(' | ')}`);
    const id = Number((await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at, loai)
      VALUES ('0939999999', ?, 'Vàng', 100000, 888881, '2026-11-03T10:00:00', '2026-12-03T10:00:00', 'ban')`, [V?.id])).lastInsertRowid);
    const lech2 = await BAT_BIEN.I15(q);
    k('O2 dòng BÁN mất đơn → I15 vẫn báo như cũ', lech2.some((m) => m.includes(`#${id} `) && m.includes('888881')), lech2.join(' | '));
    await db.run('DELETE FROM pos_membership_purchases WHERE id = ?', [id]);
  });

  // ═════════════════════════════════════════════════════════════════════════
  muc('[G] Giao diện (đọc nguồn client/src)');
  {
    const hang = sach(doc('client/src/components/CaiDatHang.jsx'));
    const cap = sach(doc('client/src/components/CapHang.jsx'));
    const caiDat = sach(doc('client/src/pages/Settings.jsx'));
    const banHang = sach(doc('client/src/pages/Sales.jsx'));
    const khachHang = sach(doc('client/src/pages/Customers.jsx'));
    k('G1 thẻ Hạng (CaiDatHang.jsx): ▲ ▼ thứ bậc, "+ Thêm hạng", "+ Thêm gói", Bán / Chỉ cấp, Lưu', hang.length > 0 && ['▲', '▼', '+ Thêm hạng', '+ Thêm gói', 'Chỉ cấp', 'chi_cap'].every((x) => hang.includes(x)));
    k('G1b xoá hạng bấm 2 lần ("Bấm lần nữa để xoá"), KHÔNG hộp thoại trình duyệt', hang.includes('Bấm lần nữa để xoá') && !/\bconfirm\s*\(|\balert\s*\(|\bprompt\s*\(/.test(hang));
    k('G1c không ô % combo (COMBO-1a), không ô số tháng hiệu lực chung, không giá thẻ cũ', !/combo/i.test(hang) && !hang.includes('valid_months') && !hang.includes('card_price'));
    k('G1d Settings.jsx dùng CaiDatHang, bỏ bảng hạng cũ (không còn card_price / valid_months / setTierValidMonths)', caiDat.includes('<CaiDatHang')
      && !caiDat.includes('card_price') && !caiDat.includes('valid_months') && !caiDat.includes('setTierValidMonths'));
    k('G1e đặt PIN chủ quán ở thẻ Hạng (chỉ chủ quán, gõ mật khẩu)', hang.includes('/membership/pin-chu-quan') && hang.includes('mat_khau'));
    const khoaGio = (banHang.match(/const khoaGio = [^\n]*/) || [''])[0];
    k('G2 Sales: giỏ gửi { tier_id, so_thang }, khoaGio có so_thang, unique_key có so_thang', /membership_buy:\s*membershipInCart\s*\?\s*\{\s*tier_id:\s*membershipInCart\.tier_id,\s*so_thang:\s*membershipInCart\.so_thang\s*\}/.test(banHang)
      && khoaGio.includes('so_thang') && /unique_key:\s*`membership_\$\{tier\.id\}_\$\{goi\.so_thang\}`/.test(banHang), khoaGio);
    k('G2b Sales: chỉ gói đang bán có giá thành nút; khoá gói khi khách có hạng cao hơn, ghi lý do', banHang.includes('Khách đang có hạng cao hơn')
      && /\.filter\(\s*\(?g\)?\s*=>\s*g\.bat\s*&&\s*Number\.isInteger\(g\.gia\)\s*&&\s*g\.gia\s*>\s*0\s*\)/.test(banHang) && banHang.includes('thu_bac') && !banHang.includes('card_price'));
    k('G3 Customers: khối Cấp hạng sau hasPermission(\'cap_hang\'), Nhật ký hạng, "Không thời hạn"', /hasPermission\(\s*['"]cap_hang['"]\s*\)\s*&&\s*\(?\s*<CapHang/.test(khachHang)
      && cap.includes('Nhật ký hạng') && cap.includes('/membership/cap') && cap.includes('/membership/thu-hoi') && (cap + khachHang).includes('Không thời hạn'));
    k('G3b Customers: không hiện "Còn null ngày" — số ngày chỉ hiện khi không vô hạn', /vo_han\s*\?\s*['"]Không thời hạn['"]/.test(khachHang));
    k('G4 hai file mới gọi máy chủ qua utils/api.js (không fetch trần)', hang.length > 0 && cap.length > 0 && !/\bfetch\s*\(/.test(hang + cap));
  }

  sv.close();
  console.log(`\n${dat} đạt · ${hong} hỏng`);
  fs.rmSync(THU_MUC, { recursive: true, force: true });
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.error('Bài thử sập:', e); console.log(`\n${dat} đạt · ${hong + 1} hỏng`); process.exit(1); });
