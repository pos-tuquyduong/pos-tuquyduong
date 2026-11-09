#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ DIEM-MON-1 — công tắc "Tích điểm" theo món / hạng thẻ / gói trả trước; điểm chỉ cộng phần tiền của dòng đang bật
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_DIEMMON1.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến, viec/DIEM-MON-1/dot_bien.py). bat_bien.js nạp từ <may-chu>/../cong_cu/gia_lap.
 *
 *  Khuôn thu_NAP1.js: database.js thật + libsql thật trên kho TẠM, SX giả. co.mocTruocTx chạy TRỌN một lệnh khác trước khi giao dịch kế
 *  tiếp mở (hai người bấm chồng nhau TẤT ĐỊNH). Mã ca T1…T19 = bảng ca của viec/DIEM-MON-1/ke_hoach.md (mục 3 + 6.1).
 *  Cài đặt: 1.000đ = 1 điểm, hệ số mã bill 2. Món X 40.000 TẮT điểm, món Y 60.000 BẬT.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_diemmon1_'));
const FILE_KHO = path.join(THU_MUC, 'kho.db');
process.on('exit', () => { try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ } });

const duongKN = require.resolve(path.join(MAY_CHU, 'ketNoiKho.js'));
require.cache[duongKN] = {
  id: duongKN, filename: duongKN, loaded: true,
  exports: { laMayThu: () => true, cauHinhTurso: () => ({ laMayThu: true, cauHinh: { url: 'file:' + FILE_KHO } }), diaChiSX: () => '', FILE_THU: FILE_KHO },
};
process.env.JWT_SECRET = 'thu_diemmon1_' + Date.now();
process.env.KH_JWT_SECRET = 'thu_diemmon1_kh_' + Date.now();

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
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();

  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const sxGia = async () => ({ ok: true });
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true, checkStock: async () => ({ sufficient: true, stock: 999 }),
    outStockFIFO: sxGia, inStockReturn: sxGia,
    callSxApi: async (url, ...a) => { if (/products-with-stock/.test(url)) throw new Error('SX giả: menu lấy từ POS'); return sxGia(url, ...a); } };

  const co = { mocTruocTx: null };
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const moc = co.mocTruocTx; co.mocTruocTx = null;
    if (moc) await moc();
    return txGoc(...a);
  };

  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'wallets', 'signup-codes', 'refunds', 'damages', 'packages', 'loyalty']) {
    app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  }
  app.use('/api/pos/hoa-don', require(path.join(MAY_CHU, 'routes', 'hoaDon.js')));
  app.use('/api/pos/thanh-toan', require(path.join(MAY_CHU, 'routes', 'thanh-toan.js')));
  app.use('/api/kh', require(path.join(MAY_CHU, 'routes', 'kh')));
  app.use('/api/kh', require(path.join(MAY_CHU, 'routes', 'kh', 'loi.js')).loiTangKh);
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api`;
  const { BAT_BIEN } = require(path.join(MAY_CHU, '..', 'cong_cu', 'gia_lap', 'bat_bien.js'));
  const { tienTinhDiem } = require(path.join(MAY_CHU, 'utils', 'diemThat.js'));
  const { kyTokenKhach } = require(path.join(MAY_CHU, 'middleware', 'khachAuth.js'));
  const { getNow } = require(path.join(MAY_CHU, 'utils', 'helpers.js'));
  noiLai();

  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => { try { return Number(Object.values((await mot(sql, a)) || { x: NaN })[0]); } catch { return NaN; } };
  const nguoi = async (ten, vai) => Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)",
    [ten, ten, vai])).lastInsertRowid);
  const chu = await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const ky = (id) => jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const THE_CHU = ky(chu.id), THE_NV = ky(await nguoi('nv_dm1', 'staff')), THE_QL = ky(await nguoi('ql_dm1', 'manager'));
  const goi = async (method, url, body, the = THE_CHU) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', ...(the ? { Authorization: 'Bearer ' + the } : {}) } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return Array.isArray(j) ? { data: j, status: r.status } : { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;
  const datCaiDat = (key, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
  for (const [key, v] of [['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', 1000], ['loyalty_expiry_mode', 'none'], ['flash_enabled', 'false'],
    ['nhandiem_enabled', 1], ['nhandiem_he_so', 2], ['thanh_toan_payos_bat_buoc', '0']]) await datCaiDat(key, v);

  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 2');
  const [X, Y] = sp;
  await db.run('UPDATE pos_products SET price = 40000 WHERE id = ?', [X.id]);
  await db.run('UPDATE pos_products SET price = 60000 WHERE id = ?', [Y.id]);
  const mon = (p, sl = 1) => ({ product_id: p.id, sx_product_type: p.sx_product_type, sx_product_id: p.sx_product_id, quantity: sl });
  const XY = [mon(X), mon(Y)];
  let soSdt = 0;
  const sdtMoi = () => '0937' + String(500000 + (++soSdt));
  const ban = (body) => goi('POST', '/pos/orders', { customer_name: 'Khách DIEM-MON-1', items: XY, payment_method: 'cash', ...body });
  const diemDon = (id) => so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ?', [id]);
  const diemCua = async (r) => (r.order ? diemDon(r.order.id) : NaN);
  const datCo = async (bang, id, bat) => { try { await db.run(`UPDATE ${bang} SET tich_diem = ? WHERE id = ?`, [bat ? 1 : 0, id]); } catch { /* gốc chưa có cột → ca đỏ */ } };
  const napTay = (sdt, tien) => goi('POST', '/pos/wallets/topup', { phone: sdt, amount: tien, customer_name: 'Khách DIEM-MON-1', payment_method: 'cash' });
  const den = (o, p, tien, sl = 1) => goi('POST', '/pos/damages', { order_id: o.id, product_code: p.code, quantity: sl, reason: 'damaged', action: 'refund', refund_amount: tien });
  const nhanMa = (o, sdt) => goi('POST', '/pos/signup-codes/nhan-diem', { code: o.signup_code, phone: sdt });
  const q = (sql, a) => db.query(sql, a);
  const lechI8 = async () => { try { return await BAT_BIEN.I8(q, {}); } catch (e) { return [`I8 sập: ${e.message}`]; } };
  const tatCaDon = [];
  const ghi = (r) => { if (r.order) tatCaDon.push(r.order.code); return r; };

  console.log('\nTHỬ DIEM-MON-1 — tích điểm theo món / hạng / gói');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] Bước nâng cấp 024: cờ tich_diem (mặc định 1) ở món / gói / hạng; đơn ghi tien_hang_diem, dòng đơn ghi tich_diem');
  {
    const cot = async (bang) => { try { return await db.query(`PRAGMA table_info(${bang})`); } catch { return []; } };
    const coCo = async (bang) => (await cot(bang)).find((c) => c.name === 'tich_diem');
    const ba = [];
    for (const b of ['pos_products', 'pos_packages', 'pos_membership_tiers']) {
      const c = await coCo(b);
      ba.push(`${b}:${c ? `${c.notnull}/${c.dflt_value}` : 'không'}:${await so(`SELECT COUNT(*) FROM ${b} WHERE tich_diem IS NOT 1`)}`);
    }
    const coDon = (await cot('pos_orders')).some((c) => c.name === 'tien_hang_diem');
    const coDong = (await cot('pos_order_items')).some((c) => c.name === 'tich_diem');
    const { chayNangCap } = require(path.join(MAY_CHU, 'nang_cap', 'chay.js'));
    imLang(); const lai = await chayNangCap(db); noiLai();
    k('T1 cột tich_diem NOT NULL mặc định 1 ở 3 bảng, mọi dòng cũ = 1; pos_orders.tien_hang_diem, pos_order_items.tich_diem; bước 024 chạy đúng 1 lần, chạy lại không hỏng; có bảng sao lưu',
      ba.every((x) => /:1\/1:0$/.test(x)) && coDon && coDong && !lai.hong
        && (await so("SELECT COUNT(*) FROM pos_nang_cap WHERE ten = '024_tich_diem_mon'")) === 1
        && (await so("SELECT COUNT(*) FROM sqlite_master WHERE name = '_sao_luu_024_pos_products'")) === 1,
      `${ba.join(' · ')} · đơn ${coDon} · dòng ${coDong} · ${JSON.stringify(lai)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B] MỘT hàm tính tiền tích điểm theo dòng — quầy, App, nhận điểm bằng mã bill, thu nợ');
  const sA = sdtMoi();
  const t2 = ghi(await ban({ customer_phone: sA, cash_amount: 100000 }));
  const t2Ham = [tienTinhDiem({ cash_amount: 100000, total: 100000 }), tienTinhDiem({ cash_amount: 100000, total: 100000, tien_hang_diem: null }),
    tienTinhDiem({ cash_amount: 100000, total: 100000, tien_hang_diem: 100000 }), tienTinhDiem({ cash_amount: 25000, shipping_fee: 5000, total: 25000, tien_hang_diem: 20000 }),
    tienTinhDiem({ total: 0, tien_hang_diem: 0 }), tienTinhDiem({ cash_amount: 5000, shipping_fee: 5000, total: 5000, tien_hang_diem: 0 })];
  k('T2 (đối chứng) mọi món bật: X + Y tiền mặt 100.000 → 100 điểm; đơn cũ (không cột / cột NULL) và đơn bật hết tính như hôm nay; tiền hàng 0 → 0 (không NaN)',
    t2.status === 200 && (await diemCua(t2)) === 100 && JSON.stringify(t2Ham) === '[100000,100000,100000,20000,0,0]', `${moTa(t2)} · ${await diemCua(t2)} · ${JSON.stringify(t2Ham)}`);
  // T2b: đơn CŨ (trước bước 024 — dòng không cờ, đơn không tien_hang_diem) → đền trừ như hôm nay, dù món đó nay đã tắt.
  const t2b = ghi(await ban({ customer_phone: sdtMoi(), cash_amount: 100000 }));
  if (t2b.order) {
    await db.run('UPDATE pos_orders SET tien_hang_diem = NULL WHERE id = ?', [t2b.order.id]).catch(() => {});
    await db.run('UPDATE pos_order_items SET tich_diem = NULL WHERE order_id = ?', [t2b.order.id]).catch(() => {});
  }

  await datCo('pos_products', X.id, false);
  const r2b = t2b.order ? await den(t2b.order, X, 30000) : t2b;
  k('T2b đơn cũ (không cờ dòng, không tien_hang_diem) 100 điểm, đền X 30.000 sau khi X đã tắt → trừ 30 như hôm nay → 70',
    r2b.status === 200 && (await diemCua(t2b)) === 70, `${moTa(r2b)} · ${await diemCua(t2b)}`);
  const t3 = ghi(await ban({ customer_phone: sdtMoi(), cash_amount: 100000 }));
  const luu3 = t3.order ? await mot('SELECT tien_hang_diem FROM pos_orders WHERE id = ?', [t3.order.id]).catch(() => null) : null;
  const dong3 = t3.order ? (await q('SELECT tich_diem FROM pos_order_items WHERE order_id = ? ORDER BY id', [t3.order.id]).catch(() => [])).map((r) => r.tich_diem) : [];
  k('T3 X TẮT + Y bật, tiền mặt 100.000 → 60 điểm; đơn lưu tien_hang_diem 60.000, dòng đơn lưu cờ [0, 1]',
    t3.status === 200 && (await diemCua(t3)) === 60 && Number(luu3?.tien_hang_diem) === 60000 && JSON.stringify(dong3) === '[0,1]',
    `${moTa(t3)} · ${await diemCua(t3)} · ${JSON.stringify(luu3)} · ${JSON.stringify(dong3)}`);

  const sV = sdtMoi();
  await napTay(sV, 100000);
  const t4a = ghi(await ban({ customer_phone: sV, payment_method: 'balance', balance_amount: 100000 }));
  const t4b = ghi(await ban({ customer_phone: sdtMoi(), payment_method: 'transfer', transfer_amount: 100000 }));
  k('T4 cùng giỏ trả ví 100.000 → 60; trả CK → 60', t4a.status === 200 && t4b.status === 200 && (await diemCua(t4a)) === 60 && (await diemCua(t4b)) === 60,
    `${moTa(t4a)} ${await diemCua(t4a)} · ${moTa(t4b)} ${await diemCua(t4b)}`);

  await db.run("INSERT INTO pos_discount_codes (code, discount_type, discount_value, usage_limit, used_count, is_active) VALUES ('DM1GIAM10', 'percent', 10, 0, 0, 1)");
  const t5 = ghi(await ban({ customer_phone: sdtMoi(), cash_amount: 90000, discount_code: 'DM1GIAM10' }));
  k('T5 mã giảm 10% cả đơn: 90.000 → 54 (chia theo tỷ lệ)', t5.status === 200 && t5.order?.total === 90000 && (await diemCua(t5)) === 54, `${moTa(t5)} · ${t5.order?.total} · ${await diemCua(t5)}`);

  const vang = await mot("SELECT * FROM pos_membership_tiers WHERE name = 'Vàng'");
  await db.run('UPDATE pos_membership_tiers SET discount_percent = 10, special_discount_percent = 50 WHERE id = ?', [vang.id]);
  await db.run('UPDATE pos_products SET is_special_group = 1 WHERE id = ?', [X.id]);
  const sH = sdtMoi();
  await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
    VALUES (?, ?, 'Vàng', 1000, NULL, ?, '2099-12-31T00:00:00')`, [sH, vang.id, getNow()]);
  const t6 = ghi(await ban({ customer_phone: sH, cash_amount: 74000 }));
  await db.run('UPDATE pos_products SET is_special_group = 0 WHERE id = ?', [X.id]);
  k('T6 khách hạng (X nhóm đặc biệt giảm 50%, Y giảm 10%): X 20.000 + Y 54.000 = 74.000 → 54 (tỷ lệ trên giá SAU giảm hạng từng món)',
    t6.status === 200 && t6.order?.total === 74000 && (await diemCua(t6)) === 54, `${moTa(t6)} · ${t6.order?.total} · ${await diemCua(t6)}`);

  await db.run("INSERT INTO pos_product_groups (id, code, name, created_at) VALUES (771, 'DM1NHOM', 'Nhóm thử DIEM-MON-1', ?)", [getNow()]);
  await db.run('INSERT INTO pos_product_group_members (group_id, sx_product_type, sx_product_id, created_at) VALUES (771, ?, ?, ?)', [Y.sx_product_type, Y.sx_product_id, getNow()]);
  await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, usage_limit, used_count, is_active, discount_scope, applicable_group_id)
    VALUES ('DM1MON10K', 'fixed', 10000, 0, 0, 1, 'item', 771)`);
  const t6b = ghi(await ban({ customer_phone: sdtMoi(), cash_amount: 90000, discount_code: 'DM1MON10K' }));
  k('T6b mã giảm 1 món 10.000: X + Y = 90.000 → floor(60.000 × 90.000 / 100.000) = 54.000 → 54',
    t6b.status === 200 && t6b.order?.total === 90000 && (await diemCua(t6b)) === 54, `${moTa(t6b)} · ${t6b.order?.total} · ${await diemCua(t6b)}`);

  // App KH: đơn trả ví đi phiên thanh toán → taoDon (cùng đường quầy).
  const sApp = sdtMoi();
  const idKh = Number((await db.run('INSERT INTO pos_customers (phone, name, created_at) VALUES (?, ?, ?)', [sApp, 'Khách App DM1', getNow()])).lastInsertRowid);
  await napTay(sApp, 100000);
  await goi('POST', '/pos/thanh-toan/pin', { phone: sApp, pin: '1357', pin_lai: '1357' });
  const gioApp = { mon: [X, Y].map((p) => ({ ma: `${p.sx_product_type}_${p.sx_product_id}`, so_luong: 1 })), cach_nhan: 'tai_quan' };
  const tkApp = kyTokenKhach(idKh);
  const bg = await goi('POST', '/kh/gio/bao-gia', gioApp, tkApp);
  const t7 = await goi('POST', '/kh/don', { ...gioApp, khoa_gui: 'khoa-dm1-0000000001', cach_tra: 'vi', pin: '1357', tong_da_xem: bg.tong }, tkApp);
  const don7 = await mot("SELECT id, code FROM pos_orders WHERE customer_phone = ? ORDER BY id DESC LIMIT 1", [sApp]);
  if (don7) tatCaDon.push(don7.code);
  k('T7 đơn App (ví) cùng giỏ X + Y → 60', t7.status === 200 && !!don7 && (await diemDon(don7?.id)) === 60, `${moTa(bg)} ${bg.tong} · ${moTa(t7)} · ${don7 ? await diemDon(don7.id) : 'không đơn'}`);

  const t8 = ghi(await ban({ cash_amount: 100000 }));
  const hd8 = t8.order ? (await goi('GET', `/pos/hoa-don/${t8.order.id}`)).hoa_don?.ma_nhan_diem : null;
  await datCo('pos_products', X.id, true);   // đổi cờ SAU khi bán: đơn cũ giữ số đã lưu
  const s8 = sdtMoi();
  const n8 = t8.order ? await nhanMa(t8.order, s8) : t8;
  await datCo('pos_products', X.id, false);
  k('T8 đơn không SĐT X + Y, hoá đơn báo mã được 120; bật lại X SAU khi bán rồi nhận mã ×2 → vẫn 120 (đọc số đã lưu, không đọc cờ hiện tại)',
    t8.status === 200 && hd8?.diem === 120 && n8.status === 200 && n8.diem_cong === 120 && (await diemCua(t8)) === 120,
    `${moTa(t8)} · hoá đơn ${JSON.stringify(hd8)} · ${moTa(n8)} cộng ${n8.diem_cong} · ${await diemCua(t8)}`);

  const t9 = ghi(await ban({ customer_phone: sdtMoi(), payment_method: 'debt', debt_amount: 100000 }));
  const d9a = await diemCua(t9);
  const thu9 = t9.order ? await goi('POST', `/pos/orders/${t9.order.id}/pay-debt`, { payment_method: 'cash' }) : t9;
  k('T9 đơn nợ X + Y: lúc tạo 0 điểm (K5); thu đủ → 60', t9.status === 200 && d9a === 0 && thu9.status === 200 && (await diemCua(t9)) === 60,
    `${moTa(t9)} · tạo ${d9a} · ${moTa(thu9)} · ${await diemCua(t9)}`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A] Gói trả trước, thẻ hạng có công tắc; gói nạp và phí giao không điểm (như nay)');
  const goiG = Number((await db.run("INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active) VALUES ('DM1G', 'Gói G thử', 300000, 'ly', 10, 1)")).lastInsertRowid);
  const goiB = Number((await db.run("INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active) VALUES ('DM1B', 'Gói B thử', 300000, 'ly', 10, 1)")).lastInsertRowid);
  await datCo('pos_packages', goiG, false);
  const banGoi = (pkg, items, tien, sdt = sdtMoi()) => ban({ customer_phone: sdt, items, package_buy: { package_id: pkg }, cash_amount: tien });
  const t10a = ghi(await banGoi(goiG, [], 300000));
  const t10b = ghi(await banGoi(goiG, [mon(Y)], 360000));
  k('T10 gói G TẮT 300.000 → 0 điểm; G + Y = 360.000 → 60', t10a.status === 200 && t10b.status === 200 && (await diemCua(t10a)) === 0 && (await diemCua(t10b)) === 60,
    `${moTa(t10a)} ${await diemCua(t10a)} · ${moTa(t10b)} ${await diemCua(t10b)}`);

  await db.run(`UPDATE pos_membership_tiers SET goi = '[{"so_thang":3,"gia":200000,"bat":true}]' WHERE id = ?`, [vang.id]);
  await datCo('pos_membership_tiers', vang.id, false);
  const muaThe = (items, tien) => ban({ customer_phone: sdtMoi(), items, membership_buy: { tier_id: vang.id, so_thang: 3 }, cash_amount: tien });
  const t11a = ghi(await muaThe([], 200000));
  const t11b = ghi(await muaThe([mon(Y)], 260000));
  k('T11 hạng Vàng TẮT, gói 3 tháng 200.000 → 0 điểm; thẻ + Y = 260.000 → 60', t11a.status === 200 && t11b.status === 200 && (await diemCua(t11a)) === 0 && (await diemCua(t11b)) === 60,
    `${moTa(t11a)} ${await diemCua(t11a)} · ${moTa(t11b)} ${await diemCua(t11b)}`);
  await datCo('pos_membership_tiers', vang.id, true);

  const cp10 = t10a.order ? await mot('SELECT id, customer_phone FROM pos_customer_packages WHERE order_id = ?', [t10a.order.id]) : null;
  const t12c = ghi(await ban({ customer_phone: cp10?.customer_phone, items: [{ ...mon(Y), from_package: true }], customer_package_id: cp10?.id }));
  k('T12b (K5) đơn chỉ lấy từ gói (0đ) → 200, 0 điểm (tiền hàng 0, không NaN)', t12c.status === 200 && t12c.order?.total === 0 && (await diemCua(t12c)) === 0,
    `${moTa(t12c)} · ${t12c.order?.total} · ${await diemCua(t12c)}`);
  const t12a = ghi(await ban({ customer_phone: sdtMoi(), cash_amount: 120000, shipping_fee: 20000 }));
  const t12b = ghi(await ban({ customer_phone: sdtMoi(), items: [mon(Y)], cash_amount: 80000, shipping_fee: 20000 }));
  k('T12 (đối chứng phí giao) X + Y + phí giao 20.000 → 60; Y + phí giao → 60 (phí giao không điểm)',
    t12a.status === 200 && (await diemCua(t12a)) === 60 && t12b.status === 200 && (await diemCua(t12b)) === 60, `${moTa(t12a)} ${await diemCua(t12a)} · ${moTa(t12b)} ${await diemCua(t12b)}`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] Trừ điểm (CÁCH 2): đền / kết thúc gói trừ theo DÒNG được trả; duyệt hoàn theo toàn đơn; không bao giờ quá điểm đã cộng');
  const X2Y = [mon(X), mon(Y, 2)];
  const s13 = sdtMoi();
  const t13 = ghi(await ban({ customer_phone: s13, items: X2Y, cash_amount: 160000 }));
  const d13 = [await diemCua(t13)];
  const r13 = [];
  for (const [p, tien] of [[Y, 30000], [Y, 60000], [X, 40000]]) { r13.push(t13.order ? await den(t13.order, p, tien) : t13); d13.push(await diemCua(t13)); }
  k('T13 X tắt + 2 Y (160.000 tiền mặt) → 120; đền Y 30.000 → 90; đền Y 60.000 → 30; T13d đền X (tắt) 40.000 → vẫn 30',
    r13.every((r) => r.status === 200) && JSON.stringify(d13) === '[120,90,30,30]', `${r13.map(moTa).join(' · ')} · ${JSON.stringify(d13)}`);

  const s13b = sdtMoi();
  await napTay(s13b, 50000);
  const t13b = ghi(await ban({ customer_phone: s13b, balance_amount: 50000, cash_amount: 50000 }));
  const y13b = t13b.order ? await goi('POST', '/pos/refunds', { order_id: t13b.order.id, reason: 'thử DIEM-MON-1' }) : t13b;
  const a13b = y13b.refund_id ? await goi('POST', `/pos/refunds/${y13b.refund_id}/approve`) : y13b;
  k('T13b ví 50.000 + tiền mặt 50.000 (60 điểm), duyệt hoàn trả 50.000 vào ví (không gắn dòng) → trừ ceil(60 × 50.000 / 100.000) = 30 → 30',
    a13b.status === 200 && (await diemCua(t13b)) === 30, `${moTa(y13b)} · ${moTa(a13b)} · ${await diemCua(t13b)}`);

  const s13c = sdtMoi();
  const t13c = ghi(await ban({ customer_phone: s13c, items: X2Y, cash_amount: 160000 }));
  const r13c = t13c.order ? await den(t13c.order, Y, 30000) : t13c;
  const n13c = t13c.order ? await nhanMa(t13c.order, s13c) : t13c;
  k('T13c đơn có SĐT (120), đền Y 30.000 → 90; nhận mã ×2: +120, trừ thêm 30 cùng lúc → 180 (báo cộng 90)',
    r13c.status === 200 && n13c.status === 200 && n13c.diem_cong === 90 && (await diemCua(t13c)) === 180, `${moTa(r13c)} · ${moTa(n13c)} cộng ${n13c.diem_cong} · ${await diemCua(t13c)}`);

  const ketThuc = async (r) => {
    const cp = r.order ? await mot('SELECT id FROM pos_customer_packages WHERE order_id = ?', [r.order.id]) : null;
    return cp ? goi('PUT', `/pos/packages/customer-packages/${cp.id}/cancel`, { reason: 'thử DIEM-MON-1', hoan: true }) : { status: 0 };
  };
  const t14 = ghi(await banGoi(goiG, [mon(Y)], 360000));
  const d14a = await diemCua(t14);
  const k14 = await ketThuc(t14);
  const tru14 = t14.order ? await so("SELECT COUNT(*) FROM pos_point_transactions WHERE order_id = ? AND type = 'adjust'", [t14.order.id]) : NaN;
  k('T14 gói G TẮT 300.000 + Y 60.000 → 60; kết thúc gói hoàn 300.000 → trừ 0 (khoản hoàn thuộc dòng tắt), không ghi dòng trừ',
    k14.status === 200 && k14.hoan === 300000 && d14a === 60 && (await diemCua(t14)) === 60 && tru14 === 0, `${moTa(k14)} hoàn ${k14.hoan} · ${d14a} → ${await diemCua(t14)} · dòng trừ ${tru14}`);
  const t14b = ghi(await banGoi(goiB, [mon(X)], 340000));
  const d14b = await diemCua(t14b);
  const k14b = await ketThuc(t14b);
  k('T14b gói B bật 300.000 + X tắt 40.000 → 300; kết thúc gói hoàn 300.000 → trừ 300 → 0',
    k14b.status === 200 && d14b === 300 && (await diemCua(t14b)) === 0, `${moTa(k14b)} · ${d14b} → ${await diemCua(t14b)}`);

  const s15 = sdtMoi();
  const t15 = ghi(await ban({ customer_phone: s15, items: X2Y, cash_amount: 160000 }));
  let r15b = null;
  co.mocTruocTx = async () => { r15b = t15.order ? await den(t15.order, Y, 60000) : t15; };
  const r15a = t15.order ? await den(t15.order, Y, 60000) : t15;
  k('T15 hai lệnh đền Y 60.000 chồng nhau (đơn 120 điểm) → tổng trừ 120 → 0, không âm, không trừ quá',
    r15a.status === 200 && r15b?.status === 200 && (await diemCua(t15)) === 0, `${moTa(r15a)} · ${r15b ? moTa(r15b) : 'không chạy'} · ${await diemCua(t15)}`);

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] Cài đặt → Điểm thưởng: GET /loyalty/tich-diem (3 nhóm), PUT chọn nhiều — cần manage_promotions');
  {
    const g = await goi('GET', '/pos/loyalty/tich-diem');
    const g403 = await goi('GET', '/pos/loyalty/tich-diem', null, THE_NV);
    const nhom = ['mon', 'goi', 'hang'].map((n) => (Array.isArray(g[n]) ? g[n] : null));
    const coVon = JSON.stringify(g).match(/gia_von|cost|ton_kho/);
    const dongX = nhom[0]?.find((m) => Number(m.id) === X.id);
    k('T17 GET trả 3 nhóm mon / goi / hang, mỗi dòng id, ten, tich_diem; X đang 0; không có giá vốn; nhân viên không quyền xem Cài đặt → 403',
      g.status === 200 && g403.status === 403 && nhom.every(Boolean) && dongX?.tich_diem === 0 && typeof dongX?.ten === 'string' && !coVon
        && nhom[1].some((x) => Number(x.id) === goiG) && nhom[2].some((x) => Number(x.id) === vang.id), `${moTa(g)} · nhân viên ${moTa(g403)} · ${JSON.stringify(g).slice(0, 200)}`);
    const p403 = await goi('PUT', '/pos/loyalty/tich-diem', { loai: 'mon', ids: [Y.id], bat: false }, THE_NV);
    await db.run("UPDATE pos_permissions SET allowed = 1 WHERE role = 'staff' AND permission = 'manage_settings'").catch(() => {});
    const p403b = await goi('PUT', '/pos/loyalty/tich-diem', { loai: 'mon', ids: [Y.id], bat: false }, THE_NV);
    const yVan = await so('SELECT tich_diem FROM pos_products WHERE id = ?', [Y.id]);
    const sai = [];
    for (const b of [{ loai: 'nap', ids: [1], bat: false }, { loai: 'mon', ids: ['1 OR 1=1'], bat: false }, { loai: 'mon', ids: [], bat: true },
      { loai: 'mon', ids: [1.5], bat: true }, { loai: 'mon', ids: [Y.id], bat: 'co' }, { loai: 'pos_users', ids: [1], bat: true }]) {
      const r = await goi('PUT', '/pos/loyalty/tich-diem', b);
      if (!(r.status === 400 && r.code === 'TICH_DIEM_SAI')) sai.push(`${JSON.stringify(b)} → ${moTa(r)}`);
    }
    const p200 = await goi('PUT', '/pos/loyalty/tich-diem', { loai: 'mon', ids: [X.id, Y.id], bat: false }, THE_QL);
    const sau = [await so('SELECT tich_diem FROM pos_products WHERE id = ?', [X.id]), await so('SELECT tich_diem FROM pos_products WHERE id = ?', [Y.id]),
      await so('SELECT COUNT(*) FROM pos_products WHERE tich_diem = 0')];
    const p200b = await goi('PUT', '/pos/loyalty/tich-diem', { loai: 'goi', ids: [goiB], bat: false });
    const p200c = await goi('PUT', '/pos/loyalty/tich-diem', { loai: 'hang', ids: [vang.id], bat: false });
    const ba = [await so('SELECT tich_diem FROM pos_packages WHERE id = ?', [goiB]), await so('SELECT tich_diem FROM pos_membership_tiers WHERE id = ?', [vang.id]),
      await so('SELECT tich_diem FROM pos_packages WHERE id = ?', [goiG])];
    k('T16 PUT: nhân viên (không manage_promotions, kể cả có manage_settings) → 403, Y giữ 1; loại lạ / id không nguyên / rỗng / bat không bool → 400 TICH_DIEM_SAI; quản lý tắt [X, Y] → đúng 2 món 0; gói B, hạng Vàng tắt được, gói G không đổi',
      p403.status === 403 && p403b.status === 403 && yVan === 1 && sai.length === 0 && p200.status === 200 && JSON.stringify(sau) === '[0,0,2]'
        && p200b.status === 200 && p200c.status === 200 && JSON.stringify(ba) === '[0,0,0]',
      `${moTa(p403)} · ${moTa(p403b)} · Y ${yVan} · ${sai.join(' | ')} · ${moTa(p200)} ${JSON.stringify(sau)} · ${moTa(p200b)} ${moTa(p200c)} ${JSON.stringify(ba)}`);
    await goi('PUT', '/pos/loyalty/tich-diem', { loai: 'mon', ids: [Y.id], bat: true });
    await goi('PUT', '/pos/loyalty/tich-diem', { loai: 'hang', ids: [vang.id], bat: true });
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[E] Đối soát: điểm đơn = điểm đã ghi sổ; I8 (trọng tài) nhận luật mới');
  {
    const t18 = ghi(await ban({ cash_amount: 100000 }));
    const hd = t18.order ? (await goi('GET', `/pos/hoa-don/${t18.order.id}`)).hoa_don?.ma_nhan_diem : null;
    const n18 = t18.order ? await nhanMa(t18.order, sdtMoi()) : t18;
    const l = await lechI8();
    const cuaBai = l.filter((x) => tatCaDon.some((m) => x.includes(m)) || x.includes('sập'));
    k('T18 hoá đơn không SĐT báo mã được N = điểm /nhan-diem ghi sổ (120); I8 0 lệch trên MỌI đơn của bài (món / gói / hạng tắt, đền, kết thúc gói, duyệt hoàn, mã bill)',
      hd?.diem === 120 && n18.status === 200 && (await diemCua(t18)) === 120 && tatCaDon.length >= 20 && cuaBai.length === 0,
      `hoá đơn ${JSON.stringify(hd)} · ${moTa(n18)} · ${tatCaDon.length} đơn · ${cuaBai.join(' | ')}`);
    const dongT13 = t13.order ? await mot("SELECT id FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [t13.order.id]) : null;
    if (dongT13) await db.run('UPDATE pos_point_transactions SET points = points + 1 WHERE id = ?', [dongT13.id]);
    const l2 = await lechI8();
    if (dongT13) await db.run('UPDATE pos_point_transactions SET points = points - 1 WHERE id = ?', [dongT13.id]);
    k('T18b I8 bắt lệch MỘT điểm ở đơn có món tắt + đền (T13)', !!dongT13 && l2.some((x) => x.includes(t13.order.code)), l2.join(' | ').slice(0, 300));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[K5] Không đổi: tiền đơn, giảm hạng, gói nạp 0 điểm');
  {
    const tien = [t3.order?.total, t3.order?.subtotal, t6.order?.total, t6.order?.tier_discount, t5.order?.total, t10b.order?.total];
    const goiNap = Number((await db.run(`INSERT INTO pos_goi_nap (ten, khach_tra, vao_tk, is_active, thu_tu, created_at, updated_at)
      VALUES ('Nạp DM1', 100000, 105000, 1, 0, ?, ?)`, [getNow(), getNow()])).lastInsertRowid);
    const nap = ghi(await goi('POST', '/pos/orders', { customer_phone: sdtMoi(), customer_name: 'Khách DIEM-MON-1', items: [], goi_nap_id: goiNap, payment_method: 'cash', cash_amount: 100000 }));
    k('T19 tổng / tạm tính / giảm hạng như gốc (100.000 · 100.000 · 74.000 · 26.000 · 90.000 · 360.000); gói nạp vẫn 0 điểm',
      JSON.stringify(tien) === '[100000,100000,74000,26000,90000,360000]' && nap.status === 200 && (await diemCua(nap)) === 0, `${JSON.stringify(tien)} · ${moTa(nap)} ${await diemCua(nap)}`);
  }

  console.log(`\n  ${dat} đạt · ${hong} hỏng\n`);
  sv.close();
  process.exit(hong ? 1 : 0);
}

main().catch((e) => { noiLai(); console.log('SẬP:', e.stack || e.message); process.exit(2); });
