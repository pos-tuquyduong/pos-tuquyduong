#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ GOI-1 — gói sản phẩm: tổng tự khớp từng loại, chặn theo loại ở máy chủ, xem / dừng gói (chủ quán chốt 13.10)
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_GOI1.js [--may-chu <thư mục server>] [--client <thư mục client>]
 *  --may-chu / --client: chạy trên bản sao server/ / client/ (đột biến, viec/GOI-1/dot_bien.py).
 *
 *  Khuôn thu_P26c.js: database.js thật + libsql thật trên kho TẠM, SX giả (luôn đủ hàng, trừ kho báo lỗi — không ảnh hưởng gói).
 *  Ba người: chủ (owner), quản lý (manager — được cấp manage_users, KHÔNG có refund_package), nhân viên (staff).
 *  Chỉ so status / code / trường JSON / kho — không dò chữ (E12). Phép tĩnh đọc <client>/src/pages (Settings, Reports, Customers).
 *  Ca ghi "(K5)" là luồng hợp lệ phải KHÔNG bị chặn — xanh cả trên gốc lẫn sau vá.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const iCL = process.argv.indexOf('--client');
const CLIENT = path.resolve(iCL > 0 ? process.argv[iCL + 1] : path.join(GOC, 'client'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_goi1_'));
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
process.env.JWT_SECRET = 'thu_goi1_' + Date.now();
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_goi1';

let dat = 0, hong = 0;
const k = (ten, dung, them = '') => {
  if (dung) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten}${them ? '  — ' + them : ''}`); }
};
const muc = (t) => console.log('\n' + t);
const logGoc = console.log, loiGoc = console.error, canhGoc = console.warn;
const imLang = () => { console.log = () => {}; console.error = () => {}; console.warn = () => {}; };
const noiLai = () => { console.log = logGoc; console.error = loiGoc; console.warn = canhGoc; };
const docTrang = (ten) => { try { return fs.readFileSync(path.join(CLIENT, 'src', 'pages', ten), 'utf8'); } catch { return ''; } };

async function main() {
  imLang();
  const express = require(path.join(GOC, 'node_modules', 'express'));
  const jwt = require(path.join(GOC, 'node_modules', 'jsonwebtoken'));
  const db = require(path.join(MAY_CHU, 'database.js'));
  await db.initDatabase();

  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const loiSX = async () => { throw new Error('SX lỗi (giả)'); };
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true, checkStock: async () => ({ sufficient: true, stock: 999 }),
    outStockFIFO: loiSX, inStockReturn: loiSX, callSxApi: loiSX };

  // Khe hở A2d2: quầy 2 ghi xong đơn lấy 2 CT1 ĐÚNG lúc quầy 1 vừa đọc "đã lấy theo loại". Đọc NGOÀI giao dịch (`query` của kho) →
  // khe hở có thật: chèn đơn quầy 2 ngay sau câu đọc. Đọc TRONG giao dịch ghi → quầy 2 bị khoá tới khi quầy 1 xong (Turso; libsql
  // cục bộ thì ném BUSY và sau một BEGIN hỏng MỌI giao dịch ghi sau đều BUSY — đo 13.10, Phát hiện ở viec/GOI-1/trang_thai.md),
  // nên không chèn được gì. Bọc TRƯỚC khi nạp route (route lấy `query` lúc require).
  const khe = { chen: null };
  const qGoc = db.query;
  db.query = async (sql, a) => {
    const kq = await qGoc(sql, a);
    if (khe.chen && /GROUP BY p\.sx_product_type/.test(String(sql))) { const f = khe.chen; khe.chen = null; await f(); }
    return kq;
  };

  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'wallets', 'packages']) app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();

  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const chu = await mot("SELECT id, username FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const nguoi = { chu: chu.id };
  for (const [ten, vaiTro] of [['ql_goi1', 'manager'], ['nv_goi1', 'staff']]) {
    nguoi[vaiTro] = Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)",
      [ten, ten, vaiTro])).lastInsertRowid);
  }
  // Quản lý có quyền sửa gói mẫu (manage_users) nhưng KHÔNG có quyền hoàn gói — đúng ca phân biệt hai quyền.
  await db.run("UPDATE pos_permissions SET allowed = 1 WHERE role = 'manager' AND permission = 'manage_users'");
  const the = Object.fromEntries(Object.entries(nguoi).map(([a, id]) => [a, jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '1h' })]));
  const goiAi = async (ai, method, url, body) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + the[ai] } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const goi = (method, url, body) => goiAi('chu', method, url, body);
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;

  for (const [i, bang] of ['pos_orders', 'pos_balance_transactions', 'pos_customer_packages', 'pos_packages'].entries()) {
    await db.run('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)', [bang, 1000 * (i + 1)]);
  }
  const sp = await db.query("SELECT * FROM pos_products WHERE is_active = 1 AND code LIKE 'CT%' ORDER BY sx_product_id LIMIT 8");
  if (sp.length < 6) throw new Error('kho thử thiếu sản phẩm mẫu CT1–CT6');
  for (const s of sp) await db.run('UPDATE pos_products SET price = 25000 WHERE id = ?', [s.id]);
  const loai = (i, qty) => ({ sx_product_type: sp[i].sx_product_type, sx_product_id: sp[i].sx_product_id, code: sp[i].code, name: sp[i].name, qty });
  const mon = (i, sl, tuGoi = true) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type,
    sx_product_id: sp[i].sx_product_id, quantity: sl, from_package: tuGoi });

  let soMa = 0, soSdt = 0;
  const ma = () => 'GOI1_' + (++soMa);
  const sdtMoi = () => '0938' + String(100000 + (++soSdt));
  // Gói mẫu CT1 5 + CT2 5, tổng gửi đúng 10 (để trên gốc ca chỉ ĐỎ vì đúng phép đang thử).
  const taoGoi = async (items = [loai(0, 5), loai(1, 5)], them = {}) => {
    const r = await goi('POST', '/packages', { code: ma(), name: 'Gói GOI1', price: 300000, unit: 'túi',
      total_qty: items.reduce((s, i) => s + i.qty, 0), package_items: items, ...them });
    if (r.status !== 200) throw new Error('không tạo được gói mẫu: ' + moTa(r));
    return r.data.id;
  };
  const muaGoi = (sdt, goiId, them = {}) => goi('POST', '/orders', { customer_phone: sdt, customer_name: 'Khách GOI1', items: [],
    package_buy: { package_id: goiId, total_qty: 10, pkg_qty: 1 }, payment_method: 'cash', cash_amount: 300000, ...them });
  const goiCua = (donId) => so('SELECT id FROM pos_customer_packages WHERE order_id = ? ORDER BY id LIMIT 1', [donId]);
  const lay = (sdt, cp, ds, ai = 'chu') => goiAi(ai, 'POST', '/orders', { customer_phone: sdt, customer_name: 'Khách GOI1',
    items: ds.map(([i, sl]) => mon(i, sl)), customer_package_id: cp, payment_method: 'cash', cash_amount: 0 });
  const daGiao = (cp) => so('SELECT delivered_qty FROM pos_customer_packages WHERE id = ?', [cp]);
  const daLayLoai = (cp, i) => so(`SELECT COALESCE(SUM(oi.quantity), 0) FROM pos_order_items oi JOIN pos_orders o ON o.id = oi.order_id
    WHERE o.customer_package_id = ? AND o.status != 'cancelled' AND oi.product_id = ? AND oi.unit_price = 0`, [cp, sp[i].id]);
  const huy = (id) => goi('PUT', `/orders/${id}/cancel`, { reason: 'thử GOI1' });
  // Khách mới + một gói đã mua (CT1 5 + CT2 5) + đã lấy CT1 `ct1` túi.
  const coGoi = async (ct1 = 0, items) => {
    const sdt = sdtMoi();
    const m = await muaGoi(sdt, await taoGoi(items));
    if (!m.success) throw new Error('không mua được gói: ' + moTa(m));
    const cp = await goiCua(m.order.id);
    let donLay = null;
    if (ct1) {
      const l = await lay(sdt, cp, [[0, ct1]]);
      if (l.status !== 200) throw new Error('không lấy được từ gói: ' + moTa(l));
      donLay = l.order.id;
    }
    return { sdt, cp, donMua: m.order.id, donLay };
  };
  const daLayCuaKhach = async (sdt, cp, code) => {
    const r = await goi('GET', `/packages/customer/${sdt}`);
    const g = (r.data || []).find((x) => x.id === cp);
    return Number(((g?.delivered_items || []).find((d) => d.product_code === code) || { delivered_qty: 0 }).delivered_qty);
  };

  console.log('\nTHỬ GOI-1 — gói sản phẩm');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A1] tổng tự tính từ danh sách loại (Q1)');
  {
    const a = await goi('POST', '/packages', { code: ma(), name: 'Gói A1a', price: 300000, unit: 'túi', total_qty: 30,
      package_items: [loai(0, 5), loai(1, 5), loai(2, 5), loai(3, 5), loai(4, 5), loai(5, 6)] });
    k('A1a thêm gói 5+5+5+5+5+6, gửi tổng 30 → 200, lưu 31', a.status === 200
      && await so('SELECT total_qty FROM pos_packages WHERE id = ?', [a.data?.id]) === 31, moTa(a));
    const idB = await taoGoi([loai(0, 2)]);
    const b = await goi('PUT', `/packages/${idB}`, { name: 'Gói A1b', price: 300000, total_qty: 99, package_items: [loai(0, 3), loai(1, 4)] });
    k('A1b sửa gói chưa có khách: danh sách 3+4, gửi tổng 99 → 200, lưu 7', b.status === 200
      && await so('SELECT total_qty FROM pos_packages WHERE id = ?', [idB]) === 7, moTa(b));
    const c12 = await goi('POST', '/packages', { code: ma(), name: 'Gói A1c', price: 300000, unit: 'túi', total_qty: 12 });
    const c0 = await goi('POST', '/packages', { code: ma(), name: 'Gói A1c0', price: 300000, unit: 'túi', total_qty: 0 });
    k('A1c (K5) gói KHÔNG danh sách: gửi 12 → 200 lưu 12; gửi 0 → 400 GOI_LUOT_KHONG_HOP_LE', c12.status === 200
      && await so('SELECT total_qty FROM pos_packages WHERE id = ?', [c12.data?.id]) === 12
      && c0.status === 400 && c0.code === 'GOI_LUOT_KHONG_HOP_LE', `${moTa(c12)} / ${moTa(c0)}`);
    const f8 = await goi('PUT', `/packages/${c12.data?.id}`, { name: 'Gói A1f', price: 300000, total_qty: 8 });
    const f0 = await goi('PUT', `/packages/${c12.data?.id}`, { name: 'Gói A1f', price: 300000, total_qty: 0 });
    k('A1f (K5) sửa gói KHÔNG danh sách: 8 → 200 lưu 8; 0 → 400', f8.status === 200 && f0.status === 400
      && await so('SELECT total_qty FROM pos_packages WHERE id = ?', [c12.data?.id]) === 8, `${moTa(f8)} / ${moTa(f0)}`);
    for (const [ten, sl] of [['SL 0', 0], ['SL −2', -2], ['SL 1.5', 1.5]]) {
      const truoc = await so('SELECT COUNT(*) FROM pos_packages');
      const d = await goi('POST', '/packages', { code: ma(), name: 'Gói A1d', price: 300000, unit: 'túi', total_qty: 10,
        package_items: [loai(0, 5), loai(1, sl)] });
      k(`A1d loại tích mà ${ten} → 400 GOI_LOAI_SL_SAI, không thêm gói`, d.status === 400 && d.code === 'GOI_LOAI_SL_SAI'
        && await so('SELECT COUNT(*) FROM pos_packages') === truoc, moTa(d));
    }
    const src = docTrang('Settings.jsx');
    const luu = (src.match(/const savePkg = async[\s\S]*?setSaving\(true\)/) || [''])[0];
    const gui = (src.match(/const body = \{\s*\.\.\.pkgForm[\s\S]*?\};/) || [''])[0];
    k('A1e Settings.jsx: ô Tổng readOnly khi có loại; đổi loại thì tổng = cộng SL; savePkg chặn loại SL < 1 + return; không lọc âm thầm',
      /readOnly=\{pkgForm\.package_items\.length > 0\}/.test(src)
        && /const doiLoai = \(items\) => setPkgForm\(\{ \.\.\.pkgForm, package_items: items, total_qty: items\.length \? items\.reduce\(\(s, i\) => s \+ \(i\.qty \|\| 0\), 0\) : pkgForm\.total_qty \}\);/.test(src)
        && (src.match(/doiLoai\(/g) || []).length >= 3
        && /if \(pkgForm\.package_items\.some\(i => !\(Number\.isInteger\(i\.qty\) && i\.qty >= 1\)\)\) \{[^}]*return; \}/.test(luu)
        && gui !== '' && !/filter\(i => i\.qty > 0\)/.test(gui), luu ? '' : 'không thấy savePkg');
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A2] máy chủ chặn lấy vượt TỪNG LOẠI (Q1)');
  {
    const g = await coGoi(3);
    const a = await lay(g.sdt, g.cp, [[0, 3]]);
    k('A2a CT1 cài 5, đã lấy 3, xin 3 → 400 GOI_HET_LUOT_LOAI, đã giao vẫn 3', a.status === 400 && a.code === 'GOI_HET_LUOT_LOAI'
      && await daGiao(g.cp) === 3, `${moTa(a)} · giao ${await daGiao(g.cp)}`);
    k('A2i lỗi nêu loại + số còn: loai = CT1, con = 2', a.loai === sp[0].code && a.con === 2, JSON.stringify({ loai: a.loai, con: a.con }));
    const b = await lay(g.sdt, g.cp, [[0, 2]]);
    k('A2b (K5 sau A2a) xin 2 → 200, CT1 đã lấy = 5, tổng giao 5', b.status === 200 && await daLayLoai(g.cp, 0) === 5 && await daGiao(g.cp) === 5,
      `${moTa(b)} · CT1 ${await daLayLoai(g.cp, 0)} · giao ${await daGiao(g.cp)}`);

    const h = await coGoi(3);
    const l2 = await lay(h.sdt, h.cp, [[1, 2]]);
    const hy = await huy(h.donLay);
    const ct1 = await daLayCuaKhach(h.sdt, h.cp, sp[0].code), ct2 = await daLayCuaKhach(h.sdt, h.cp, sp[1].code);
    const l5 = await lay(h.sdt, h.cp, [[0, 5]]);
    k('A2c đơn lấy 3 CT1 bị HUỶ → delivered_items CT1 = 0 (CT2 = 2, theo product_code); xin 5 CT1 → 200',
      l2.status === 200 && hy.status === 200 && ct1 === 0 && ct2 === 2 && l5.status === 200, `${moTa(hy)} · CT1 ${ct1} · CT2 ${ct2} · ${moTa(l5)}`);

    const n = await coGoi(3);
    await db.run(`INSERT INTO pos_orders (code, customer_phone, customer_name, subtotal, total, payment_method, payment_status,
      customer_package_id, status, created_by, created_at) VALUES ('GOI1_NULL', ?, 'Khách GOI1', 0, 0, 'cash', 'paid', ?, 'completed', 'thu', '2026-01-01 08:00:00')`,
    [n.sdt, n.cp]);
    const donNull = await so("SELECT id FROM pos_orders WHERE code = 'GOI1_NULL'");
    await db.run(`INSERT INTO pos_order_items (order_id, product_id, product_code, product_name, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, 1, NULL, 0)`, [donNull, sp[0].id, sp[0].code, sp[0].name]);
    k('A2h món unit_price NULL trong đơn gắn gói được đếm (cùng cách huỷ / xoá trả lượt): CT1 = 4',
      await daLayCuaKhach(n.sdt, n.cp, sp[0].code) === 4, `CT1 ${await daLayCuaKhach(n.sdt, n.cp, sp[0].code)}`);

    const d = await coGoi(3);
    const [d1, d2] = await Promise.all([lay(d.sdt, d.cp, [[0, 2]]), lay(d.sdt, d.cp, [[0, 2]])]);
    const tot = [d1, d2].filter((r) => r.status === 200).length;
    const thua = [d1, d2].filter((r) => r.status === 400 && r.code === 'GOI_HET_LUOT_LOAI').length;
    k('A2d hai quầy cùng xin 2 CT1 (cài 5, đã lấy 3) → một 200 + một 400 GOI_HET_LUOT_LOAI; CT1 = 5',
      tot === 1 && thua === 1 && await daLayLoai(d.cp, 0) === 5, `${moTa(d1)} / ${moTa(d2)} · CT1 ${await daLayLoai(d.cp, 0)}`);
    const q = await coGoi(3);
    khe.chen = async () => {   // quầy 2: một đơn lấy 2 CT1 đã ghi xong (đúng như POST /orders ghi)
      const id = Number((await db.run(`INSERT INTO pos_orders (code, customer_phone, customer_name, subtotal, total, payment_method,
        payment_status, customer_package_id, status, created_by, created_at) VALUES ('GOI1_QUAY2', ?, 'Khách GOI1', 0, 0, 'cash', 'paid', ?,
        'completed', 'thu', '2026-01-02 08:00:00')`, [q.sdt, q.cp])).lastInsertRowid);
      await db.run(`INSERT INTO pos_order_items (order_id, product_id, product_code, product_name, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, 2, 0, 0)`, [id, sp[0].id, sp[0].code, sp[0].name]);
      await db.run('UPDATE pos_customer_packages SET delivered_qty = delivered_qty + 2 WHERE id = ?', [q.cp]);
    };
    const q1 = await lay(q.sdt, q.cp, [[0, 2]]);
    const conChen = khe.chen !== null;
    khe.chen = null;
    const q2 = await lay(q.sdt, q.cp, [[0, 1]]);
    k('A2d2 quầy 2 ghi xong 2 CT1 đúng lúc quầy 1 vừa đọc "đã lấy" — đọc phải nằm TRONG giao dịch (không có khe hở): CT1 không vượt 5; xin thêm 1 → 400',
      await daLayLoai(q.cp, 0) <= 5 && (conChen ? q1.status === 200 : q1.status === 400) && q2.status === 400,
      `${moTa(q1)} / ${moTa(q2)} · CT1 ${await daLayLoai(q.cp, 0)} · ${conChen ? 'không có câu đọc ngoài giao dịch' : 'đọc NGOÀI giao dịch'}`);

    const sdt = sdtMoi();
    const goiE = await taoGoi();
    const e = await muaGoi(sdt, goiE, { items: [mon(0, 6)] });
    k('A2e mua gói (CT1 cài 5, tổng 10) + lấy ngay 6 CT1 → 400 GOI_HET_LUOT_LOAI, không tạo gói', e.status === 400
      && e.code === 'GOI_HET_LUOT_LOAI' && await so('SELECT COUNT(*) FROM pos_customer_packages WHERE customer_phone = ?', [sdt]) === 0, moTa(e));
    const sdt2 = sdtMoi();
    const g2 = await muaGoi(sdt2, goiE, { items: [mon(0, 6)], package_buy: { package_id: goiE, total_qty: 10, pkg_qty: 2 }, cash_amount: 600000 });
    k('A2g mua 2 gói + lấy ngay 6 CT1 → 400 GOI_HET_LUOT_LOAI (trần 5 của MỘT gói, không phải 10)', g2.status === 400
      && g2.code === 'GOI_HET_LUOT_LOAI' && await so('SELECT COUNT(*) FROM pos_customer_packages WHERE customer_phone = ?', [sdt2]) === 0, moTa(g2));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A3] không lưu gói giá 0đ (Q2)');
  {
    const tao = (gia) => goi('POST', '/packages', { code: ma(), name: 'Gói A3', price: gia, unit: 'túi', total_qty: 5 });
    const [r0, ra] = [await tao(0), await tao(-1)];
    k('A3a thêm gói giá 0 → 400 GOI_GIA_KHONG_HOP_LE', r0.status === 400 && r0.code === 'GOI_GIA_KHONG_HOP_LE', moTa(r0));
    k('A3a2 thêm gói giá −1 → 400 GOI_GIA_KHONG_HOP_LE', ra.status === 400 && ra.code === 'GOI_GIA_KHONG_HOP_LE', moTa(ra));
    const id = await taoGoi([loai(0, 2)]);
    const s = await goi('PUT', `/packages/${id}`, { name: 'Gói A3b', price: 0, total_qty: 2, package_items: [loai(0, 2)] });
    k('A3b sửa gói chưa có khách về giá 0 → 400, giá vẫn 300.000', s.status === 400 && s.code === 'GOI_GIA_KHONG_HOP_LE'
      && await so('SELECT price FROM pos_packages WHERE id = ?', [id]) === 300000, moTa(s));
    const luu = (docTrang('Settings.jsx').match(/const savePkg = async[\s\S]*?setSaving\(true\)/) || [''])[0];
    k('A3c Settings.jsx savePkg chặn giá ≤ 0 TRƯỚC khi gửi (điều kiện + return)',
      /if \(!\(parseFloat\(pkgForm\.price\) > 0\)\) \{[^}]*return; \}/.test(luu), luu ? '' : 'không thấy savePkg');
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A4] danh sách gói của khách: tên, lần lấy gần nhất, mở từ "N KH" (Q3, Q4)');
  {
    const a = await coGoi(2);
    await db.run("INSERT INTO pos_customers (phone, name, sx_status) VALUES (?, 'Chị Lan GOI1', 'active')", [a.sdt]);
    const l2 = await lay(a.sdt, a.cp, [[1, 1]]);
    await db.run("UPDATE pos_orders SET created_at = '2026-03-01 10:00:00' WHERE id = ?", [a.donLay]);
    await db.run("UPDATE pos_orders SET created_at = '2026-04-01 10:00:00' WHERE id = ?", [l2.order?.id]);
    await huy(l2.order?.id);
    const b = await coGoi(0);
    const ds = (await goi('GET', '/packages/customer-packages/all')).data || [];
    const ga = ds.find((x) => x.id === a.cp) || {}, gb = ds.find((x) => x.id === b.cp) || {};
    k('A4a có customer_name từ bảng khách (JOIN theo SĐT) và last_delivery_at = đơn lấy cuối CÒN hiệu lực (bỏ đơn huỷ)',
      ga.customer_name === 'Chị Lan GOI1' && ga.last_delivery_at === '2026-03-01 10:00:00', JSON.stringify({ t: ga.customer_name, l: ga.last_delivery_at }));
    k('A4e khách không có trong bảng khách → tên trên đơn mua gói; chưa lấy lần nào → last_delivery_at rỗng',
      gb.customer_name === 'Khách GOI1' && gb.last_delivery_at == null, JSON.stringify({ t: gb.customer_name, l: gb.last_delivery_at }));
    const ls = (await goi('GET', `/packages/customer-packages/${a.cp}/deliveries`)).data || [];
    k('A4f lịch sử giao bỏ đơn đã huỷ → 1 lần (khớp last_delivery_at)', ls.length === 1, `${ls.length} lần`);

    const rp = docTrang('Reports.jsx');
    k('A4b Reports.jsx: mở thẳng tab + lọc gói từ URL; tên khách là Link tới /customers?phone=; tìm theo tên + SĐT',
      /searchParams\.get\('tab'\)/.test(rp) && /searchParams\.get\('goi'\)/.test(rp) && /package_id\) === goiLoc/.test(rp)
        && /to=\{`\/customers\?phone=\$\{encodeURIComponent\(pkg\.customer_phone\)\}`\}/.test(rp)
        && /\(p\.customer_name \|\| ''\)\.toLowerCase\(\)\.includes\(s\)/.test(rp) && /\(p\.customer_phone \|\| ''\)\.includes\(s\)/.test(rp));
    k('A4b2 Reports.jsx: cột ngày mua + lần lấy gần nhất + trạng thái; sắp "Lâu chưa lấy" (chưa lấy tính theo ngày mua); > 100 % tô đỏ',
      /fmtDate\(pkg\.created_at\)/.test(rp) && /pkg\.last_delivery_at \? fmtDate\(pkg\.last_delivery_at\) : 'chưa lấy'/.test(rp)
        && /TRANG_THAI\[pkg\.status\]/.test(rp) && /\(p\.last_delivery_at \|\| p\.created_at\)/.test(rp) && /const vuot = pct > 100/.test(rp)
        && /vuot \? '#dc2626'/.test(rp));
    const st = docTrang('Settings.jsx');
    k('A4c Settings.jsx: "N KH" là Link tới /reports?tab=packages&goi=<mã gói>',
      /<Link to=\{`\/reports\?tab=packages&goi=\$\{pkg\.id\}`\}[^>]*>🔒 \{pkg\.active_users\} KH<\/Link>/.test(st));
    k('A4c2 Reports.jsx: mở từ "N KH" (có goi) thì đặt sẵn lọc "Đang giao" (chủ quán chốt C2)',
      /useState\(goiLoc \? 'active' : 'all'\)/.test(rp));
    const kh = docTrang('Customers.jsx');
    const moKh = (kh.match(/useEffect\(\(\) => \{\s*if \(!sdtMo \|\| loading\) return;[\s\S]*?\}, \[sdtMo, loading\]\);/) || [''])[0];
    k('A4d Customers.jsx: đọc phone từ URL, tải xong danh sách thì mở đúng khách (openDetailModal) MỘT lần — xoá tham số trước khi mở',
      /const sdtMo = searchParams\.get\('phone'\)/.test(kh) && /const kh = customers\.find\(c => c\.phone === sdtMo\);/.test(moKh)
        && /if \(kh\) openDetailModal\(kh\);/.test(moKh)
        && moKh.indexOf("setSearchParams({}, { replace: true });") >= 0 && moKh.indexOf("setSearchParams({}, { replace: true });") < moKh.indexOf('openDetailModal'));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A5] Dừng gói: chỉ người có quyền hoàn gói, bắt lý do, không đụng tiền (Q5)');
  {
    const dung = (cp, lyDo, ai = 'chu') => goiAi(ai, 'PUT', `/packages/customer-packages/${cp}/cancel`, lyDo === undefined ? {} : { reason: lyDo });
    const tt = (cp) => mot('SELECT status, notes, updated_at, delivered_qty FROM pos_customer_packages WHERE id = ?', [cp]);
    const g = await coGoi(2);
    const nv = await dung(g.cp, 'khách thôi', 'staff');
    k('A5a (K5 — gốc cũng chặn) nhân viên dừng gói → 403', nv.status === 403 && (await tt(g.cp)).status === 'active', moTa(nv));
    const ql = await dung(g.cp, 'khách thôi', 'manager');
    k('A5a2 quản lý có manage_users nhưng KHÔNG có refund_package → 403', ql.status === 403 && (await tt(g.cp)).status === 'active', moTa(ql));
    const r0 = await dung(g.cp, '');
    const rs = await dung(g.cp, '   ');
    k('A5b chủ quán, lý do rỗng → 400 GOI_THIEU_LY_DO, gói vẫn active', r0.status === 400 && r0.code === 'GOI_THIEU_LY_DO'
      && (await tt(g.cp)).status === 'active', moTa(r0));
    k('A5b2 chủ quán, lý do toàn dấu cách → 400 GOI_THIEU_LY_DO', rs.status === 400 && rs.code === 'GOI_THIEU_LY_DO', moTa(rs));
    const chup = async () => JSON.stringify(await mot(`SELECT (SELECT COUNT(*) FROM pos_orders) AS don,
      (SELECT COUNT(*) FROM pos_balance_transactions) AS so, (SELECT COALESCE(SUM(balance), 0) FROM pos_wallets) AS vi`));
    const truoc = await chup();
    const ok = await dung(g.cp, 'khách thôi');
    const sau = await tt(g.cp);
    k('A5c chủ quán dừng "khách thôi" → 200, cancelled, notes có lý do + người + thời điểm; đơn / sổ ví / ví / đã giao không đổi',
      ok.status === 200 && sau.status === 'cancelled' && String(sau.notes).includes('khách thôi') && String(sau.notes).includes(chu.username)
        && String(sau.notes).includes(sau.updated_at) && Number(sau.delivered_qty) === 2 && await chup() === truoc,
      `${moTa(ok)} · ${JSON.stringify(sau)}`);
    const lai = await dung(g.cp, 'lần hai');
    k('A5d dừng lại gói đã dừng → 400, notes giữ lý do đầu', lai.status === 400 && String((await tt(g.cp)).notes).includes('khách thôi')
      && !String((await tt(g.cp)).notes).includes('lần hai'), moTa(lai));
    const xong = await coGoi(5, [loai(0, 5)]);
    const rx = await dung(xong.cp, 'thử');
    k('A5d2 (K5 — gốc cũng chặn) dừng gói đã hoàn thành → 400, vẫn completed', rx.status === 400 && (await tt(xong.cp)).status === 'completed', moTa(rx));
    const c = await coGoi(0);
    const [c1, c2] = await Promise.all([dung(c.cp, 'quầy 1'), dung(c.cp, 'quầy 2')]);
    k('A5e hai chủ quán cùng dừng một gói → đúng một 200', [c1, c2].filter((r) => r.status === 200).length === 1, `${moTa(c1)} / ${moTa(c2)}`);
    const lf = await lay(g.sdt, g.cp, [[0, 1]]);
    k('A5f (K5 — có sẵn) lấy hàng từ gói đã dừng → 400 GOI_HET_HIEU_LUC', lf.status === 400 && lf.code === 'GOI_HET_HIEU_LUC', moTa(lf));
    await db.run("UPDATE pos_permissions SET allowed = 1 WHERE role = 'manager' AND permission = 'refund_package'");
    const m = await coGoi(0);
    const rm = await dung(m.cp, 'khách thôi', 'manager');
    await db.run("UPDATE pos_permissions SET allowed = 0 WHERE role = 'manager' AND permission = 'refund_package'");
    k('A5g (K5) quản lý được chủ quán cấp refund_package → 200', rm.status === 200 && (await tt(m.cp)).status === 'cancelled', moTa(rm));
    const rp = docTrang('Reports.jsx');
    k('A5h Reports.jsx: nút "Dừng gói" chỉ khi có quyền refund_package + gói active; lý do rỗng thì không gửi',
      /hasPermission\('refund_package'\) && pkg\.status === 'active' &&/.test(rp)
        && /const lyDo = window\.prompt\([^)]*\);\s*if \(!lyDo \|\| !lyDo\.trim\(\)\) return;/.test(rp)
        && /api\.put\(`\/packages\/customer-packages\/\$\{pkg\.id\}\/cancel`, \{ reason: lyDo\.trim\(\) \}\)/.test(rp));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A6] luồng hợp lệ KHÔNG bị chặn (K5)');
  {
    const sdt = sdtMoi();
    const goiId = await taoGoi([loai(0, 5), loai(1, 6)]);
    const m = await muaGoi(sdt, goiId);
    const cp = await goiCua(m.order?.id);
    k('A6a bán gói mới có danh sách (5 + 6) → 200, gói của khách 11 lượt', m.status === 200
      && await so('SELECT total_qty FROM pos_customer_packages WHERE id = ?', [cp]) === 11, moTa(m));
    const l = await lay(sdt, cp, [[0, 5], [1, 6]]);
    k('A6b lấy đúng giới hạn từng loại (CT1 5, CT2 6) → 200, completed', l.status === 200 && await daGiao(cp) === 11
      && (await mot('SELECT status FROM pos_customer_packages WHERE id = ?', [cp])).status === 'completed', moTa(l));
    const t = await goi('POST', '/packages', { code: ma(), name: 'Gói tự do', price: 300000, unit: 'túi', total_qty: 10 });
    const sdt2 = sdtMoi();
    const m2 = await muaGoi(sdt2, t.data?.id);
    const cp2 = await goiCua(m2.order?.id);
    const l2 = await lay(sdt2, cp2, [[6, 7], [7, 3]]);
    k('A6c gói KHÔNG danh sách lấy loại bất kỳ (CT7 7 + CT8 3) → 200', l2.status === 200 && await daGiao(cp2) === 10, moTa(l2));
    const h = await coGoi(4);
    const hy = await huy(h.donLay);
    k('A6d huỷ đơn lấy 4 CT1 → đã giao 0, lấy lại 5 CT1 → 200, giao 5', hy.status === 200 && await daGiao(h.cp) === 0
      && (await lay(h.sdt, h.cp, [[0, 5]])).status === 200 && await daGiao(h.cp) === 5, moTa(hy));
    const cu = Number((await db.run(`INSERT INTO pos_packages (code, name, price, unit, total_qty, package_items, is_active)
      VALUES (?, 'Gói cũ giá 0', 0, 'túi', 30, ?, 1)`, [ma(), JSON.stringify([loai(0, 5), loai(1, 5)])])).lastInsertRowid);
    const tat = await goi('PUT', `/packages/${cu}`, { is_active: 0 });
    const bat = await goi('PUT', `/packages/${cu}`, { is_active: 1 });
    k('A6e bật / tắt gói cũ (giá 0, tổng 30 lệch danh sách 10) → 200, dữ liệu cũ không bị sửa (tổng vẫn 30)', tat.status === 200
      && bat.status === 200 && await so('SELECT total_qty FROM pos_packages WHERE id = ?', [cu]) === 30, `${moTa(tat)} / ${moTa(bat)}`);
    const sdt3 = sdtMoi();
    const goi3 = await taoGoi();
    const m3 = await muaGoi(sdt3, goi3, { items: [mon(0, 5), mon(1, 2)] });
    k('A6f mua gói + lấy ngay trong giới hạn loại (CT1 5, CT2 2) → 200, giao 7', m3.status === 200
      && await daGiao(await goiCua(m3.order?.id)) === 7, moTa(m3));
    const gh = await coGoi(1);
    const r = await muaGoi(gh.sdt, await taoGoi(), { customer_package_id: gh.cp });
    k('A6g gia hạn (bật gói cũ, không lấy, mua gói mới) → 200, gói cũ vẫn giao 1', r.status === 200 && await daGiao(gh.cp) === 1, moTa(r));
    const xId = await taoGoi([loai(0, 3)]);
    const x = await goi('DELETE', `/packages/${xId}`);
    k('A6h xoá gói chưa ai mua → 200, mất dòng', x.status === 200 && await so('SELECT COUNT(*) FROM pos_packages WHERE id = ?', [xId]) === 0, moTa(x));
    const sdt4 = sdtMoi();
    const m4 = await muaGoi(sdt4, cu, { cash_amount: 0 });
    const cp4 = await goiCua(m4.order?.id);
    const l4 = await lay(sdt4, cp4, [[0, 2]]);
    k('A6i gói cũ tổng 30 lệch danh sách (10) vẫn bán được, lấy trong giới hạn loại được; gói của khách lưu 30 lượt như đã cài', m4.status === 200 && l4.status === 200
      && await so('SELECT total_qty FROM pos_customer_packages WHERE id = ?', [cp4]) === 30, `${moTa(m4)} / ${moTa(l4)}`);
  }

  sv.close();
  console.log(`\n  ${dat} đạt · ${hong} hỏng\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(hong ? 1 : 0);
}

main().catch((e) => {
  noiLai();
  console.error(`\n✖ Bài thử sập: ${e.message}\n`);
  try { fs.rmSync(THU_MUC, { recursive: true, force: true }); } catch { /* bỏ qua */ }
  process.exit(2);
});
