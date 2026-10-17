#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ GOI-1 — gói sản phẩm: tổng tự khớp từng loại, chặn theo loại ở máy chủ, xem / dừng gói (chủ quán chốt 13.10)
 *  + GOI-2 (mục B1–B7, chủ quán chốt 13–14.10): mỗi khách một dòng, Kết thúc gói hoàn / không hoàn, chặn hoàn hai lần, 4 đường bấm.
 *  GOI-2 đổi có chủ ý 4 phép tĩnh GOI-1 (A4b, A4b2, A4c2, A5h) theo màn mới — ghi ở viec/GOI-2/trang_thai.md.
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
// Phép tĩnh soi mã SAU khi bỏ chú thích CẢ DÒNG (`//…`) và khối (`/* … */`, `{/* … */}`); chú thích cuối dòng / chuỗi thuộc tính
// không bỏ được ở đây — A1e soi ĐÚNG thẻ <input> của ô Tổng (bỏ chuỗi trong ngoặc kép, chỉ xét đoạn giữa `<input` và `/>`);
// A4d neo đầu dòng (K3, E2). Chat soát thay (Q-A) 13.10.
const boChuThich = (s) => s.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '').replace(/^\s*\/\/.*$/gm, '');
const docTrang = (ten) => { try { return boChuThich(fs.readFileSync(path.join(CLIENT, 'src', 'pages', ten), 'utf8')); } catch { return ''; } };

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
  for (const r of ['orders', 'wallets', 'packages', 'damages']) app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();

  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => (a.some((x) => x === undefined || (typeof x === 'number' && !Number.isFinite(x)))   // LUOI-4 (AU4-8): id rỗng
    ? NaN : Number(Object.values((await mot(sql, a)) || { x: NaN })[0]));   // của ca trước → NaN, ca đỏ rồi đi tiếp, không sập
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
    const g = { code: ma(), name: 'Gói GOI1', price: 300000, unit: 'túi', total_qty: items.reduce((s, i) => s + i.qty, 0), package_items: items, ...them };
    const r = await goi('POST', '/packages', g);
    if (r.status === 200 && r.data?.id) return r.data.id;
    // LUOI-5 (AU4-21 packages-01): route không tạo được gói → một dòng ✗, rồi tạo gói thẳng (đủ items + them) và đi tiếp; ném thì cả bài sập, ca sau mất bằng chứng.
    k('dựng taoGoi: POST /packages → 200 và có gói', false, moTa(r));
    return Number((await db.run('INSERT INTO pos_packages (code, name, price, unit, total_qty, package_items, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [g.code, g.name, g.price, g.unit, g.total_qty, JSON.stringify(g.package_items)])).lastInsertRowid);
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
  // LUOI-4 (AU4-8): lấy-từ-gói ở bước DỰNG hỏng → một dòng ✗ rồi đi tiếp (ném thì cả bài sập, ca sau mất bằng chứng).
  const dungGoi = (r, ten) => { if (r.status !== 200) k(`dựng ${ten}`, false, moTa(r)); return r; };
  // Khách mới + một gói đã mua (CT1 5 + CT2 5) + đã lấy CT1 `ct1` túi.
  const coGoi = async (ct1 = 0, items) => {
    const sdt = sdtMoi();
    const m = await muaGoi(sdt, await taoGoi(items));
    if (!m.success) throw new Error('không mua được gói: ' + moTa(m));
    const cp = await goiCua(m.order.id);
    let donLay = null;
    if (ct1) {
      donLay = dungGoi(await lay(sdt, cp, [[0, ct1]]), `coGoi lấy ${ct1} CT1`).order?.id ?? null;
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
    // Q-A (chat soát thay): đúng MỘT dòng mang ô Tổng; readOnly phải nằm TRONG thẻ <input> đó (giữa `<input` và `/>`),
    // sau khi bỏ chuỗi trong ngoặc kép — chú thích cuối dòng hay chuỗi thuộc tính ghi hộ không còn làm xanh oan.
    const oTongKhoa = (s) => {
      const ds = s.split('\n').filter((d) => d.includes('value={pkgForm.total_qty}'));
      if (ds.length !== 1) return false;
      const d = ds[0].replace(/"[^"]*"/g, '""');
      const dau = d.indexOf('<input'), cuoi = d.indexOf('/>', dau);
      return dau >= 0 && cuoi > dau && /\sreadOnly=\{pkgForm\.package_items\.length > 0\}[\s/]/.test(d.slice(dau, cuoi + 1));
    };
    const luu = (src.match(/const savePkg = async[\s\S]*?setSaving\(true\)/) || [''])[0];
    const gui = (src.match(/const body = \{\s*\.\.\.pkgForm[\s\S]*?\};/) || [''])[0];
    k('A1e Settings.jsx: ô Tổng readOnly khi có loại; đổi loại thì tổng = cộng SL; savePkg chặn loại SL < 1 + return; không lọc âm thầm',
      oTongKhoa(src)
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

    const am = await coGoi(3);
    const truocAm = await so('SELECT COUNT(*) FROM pos_orders');
    const a7 = await lay(am.sdt, am.cp, [[0, 7], [0, -5]]);
    const a0 = await lay(am.sdt, am.cp, [[0, 2], [1, 0]]);
    const ale = await lay(am.sdt, am.cp, [[0, 1.5]]);
    k('A2j lấy từ gói có dòng SL âm / 0 / lẻ (CT1 7 + CT1 −5; CT2 0; CT1 1.5) → 400 GOI_SL_KHONG_HOP_LE, không đơn mới, CT1 vẫn 3',
      [a7, a0, ale].every((r) => r.status === 400 && r.code === 'GOI_SL_KHONG_HOP_LE') && await so('SELECT COUNT(*) FROM pos_orders') === truocAm
        && await daLayLoai(am.cp, 0) === 3, `${moTa(a7)} / ${moTa(a0)} / ${moTa(ale)} · CT1 ${await daLayLoai(am.cp, 0)}`);

    const sdtC = sdtMoi();
    const mc = await muaGoi(sdtC, await taoGoi(), { items: [{ ...mon(0, 0), quantity: ' 5' }] });
    const cpC = await goiCua(mc.order?.id);
    const lc = await lay(sdtC, cpC, [[0, 5]]);
    const tdo = await goi('POST', '/packages', { code: ma(), name: 'Gói tự do A2k', price: 300000, unit: 'túi', total_qty: 10 });
    const sdtD = sdtMoi();
    const cpD = await goiCua((await muaGoi(sdtD, tdo.data?.id)).order?.id);
    const ld = await goiAi('chu', 'POST', '/orders', { customer_phone: sdtD, customer_name: 'Khách GOI1', items: [{ ...mon(6, 0), quantity: ' 7' }],
      customer_package_id: cpD, payment_method: 'cash', cash_amount: 0 });
    k('A2k SL dạng chuỗi " 5" khi mua + lấy ngay → gói ghi giao 5, lấy tiếp 5 CT1 → 400 GOI_HET_LUOT_LOAI; gói KHÔNG danh sách lấy " 7" → giao 7',
      mc.status === 200 && await daGiao(cpC) === 5 && lc.status === 400 && lc.code === 'GOI_HET_LUOT_LOAI' && ld.status === 200 && await daGiao(cpD) === 7,
      `${moTa(mc)} · giao ${await daGiao(cpC)} / ${moTa(lc)} / ${moTa(ld)} · giao ${await daGiao(cpD)}`);

    const sdt = sdtMoi();
    const goiE = await taoGoi();
    const e = await muaGoi(sdt, goiE, { items: [mon(0, 6)] });
    k('A2e mua gói (CT1 cài 5, tổng 10) + lấy ngay 6 CT1 → 400 GOI_HET_LUOT_LOAI, không tạo gói', e.status === 400
      && e.code === 'GOI_HET_LUOT_LOAI' && await so('SELECT COUNT(*) FROM pos_customer_packages WHERE customer_phone = ?', [sdt]) === 0, moTa(e));
    const sdt2 = sdtMoi();
    const g2 = await muaGoi(sdt2, goiE, { items: [mon(0, 6)], package_buy: { package_id: goiE, total_qty: 10, pkg_qty: 2 }, cash_amount: 600000 });
    k('A2g mua 2 gói + lấy ngay 6 CT1 → 400 GOI_HET_LUOT_LOAI (trần 5 của MỘT gói, không phải 10)', g2.status === 400
      && g2.code === 'GOI_HET_LUOT_LOAI' && await so('SELECT COUNT(*) FROM pos_customer_packages WHERE customer_phone = ?', [sdt2]) === 0, moTa(g2));
    // LUOI-3 — AU3-11: trần loại CỘNG DỒN mọi dòng cùng loại (vd 2 ghi chú ly = 2 dòng); AU3-12: loại cài SL 0 (gói cũ) không chặn.
    const cd = await coGoi(2);
    const cdA = await lay(cd.sdt, cd.cp, [[0, 2], [0, 2]]);
    k('A2l CT1 cài 5, đã lấy 2 (còn 3); một đơn 2 dòng CT1 2 + CT1 2 → 400 GOI_HET_LUOT_LOAI, đã giao vẫn 2', cdA.status === 400
      && cdA.code === 'GOI_HET_LUOT_LOAI' && await daGiao(cd.cp) === 2, `${moTa(cdA)} · giao ${await daGiao(cd.cp)}`);
    const cdB = await lay(cd.sdt, cd.cp, [[0, 1], [0, 2]]);
    k('A2m (K5) cùng gói, 2 dòng CT1 1 + CT1 2 (= đúng 3 còn) → 200, CT1 đã lấy 5', cdB.status === 200 && await daLayLoai(cd.cp, 0) === 5,
      `${moTa(cdB)} · CT1 ${await daLayLoai(cd.cp, 0)}`);
    const cu0 = await coGoi(0);
    await db.run('UPDATE pos_packages SET package_items = ? WHERE id = (SELECT package_id FROM pos_customer_packages WHERE id = ?)',
      [JSON.stringify([loai(0, 0), loai(1, 5)]), cu0.cp]);   // dữ liệu cũ: trước GOI-1 A1d gói lưu được loại SL 0 (nay tạo / sửa bị chặn)
    const cu1 = await lay(cu0.sdt, cu0.cp, [[0, 1]]);
    k('A2n gói cũ cài CT1 0 + CT2 5 (dữ liệu trước GOI-1) → lấy 1 CT1 → 200 (loại SL 0 không chặn), CT1 đã lấy 1', cu1.status === 200
      && await daLayLoai(cu0.cp, 0) === 1, `${moTa(cu1)} · CT1 ${await daLayLoai(cu0.cp, 0)}`);
    // LUOI-4 — AU4-6: khoá loại phân biệt KIỂU SX (id SX đánh theo từng kiểu: juice 1 ≠ tea 1). "Đã lấy" dựng bằng INSERT (khuôn A2d2 — qua
    // POST /orders thì bước dựng đã bị đột biến chặn). daLayTheoLoai không ORDER BY → A2p / A2p2 đảo vai, dòng loại KIA chèn TRƯỚC.
    const ne = { id: Number((await db.run(`INSERT INTO pos_products (code, name, category, price, unit, sx_product_type, sx_product_id, is_active)
      VALUES ('NE1_LUOI4', 'Trà thử LUOI-4', 'tea', 25000, 'ly', 'tea', ?, 1)`, [sp[0].sx_product_id])).lastInsertRowid), code: 'NE1_LUOI4',
      name: 'Trà thử LUOI-4', sx_product_type: 'tea', sx_product_id: sp[0].sx_product_id };   // CÙNG id SX với CT1, khác kiểu (soát vòng 1)
    const loaiNe = (qty) => ({ sx_product_type: ne.sx_product_type, sx_product_id: ne.sx_product_id, code: ne.code, name: ne.name, qty });
    const chenDaLay = async (g, p, sl) => {   // một đơn lấy từ gói ĐÃ ghi (đúng như POST /orders ghi)
      const id = Number((await db.run(`INSERT INTO pos_orders (code, customer_phone, customer_name, subtotal, total, payment_method, payment_status,
        customer_package_id, status, created_by, created_at) VALUES (?, ?, 'Khách GOI1', 0, 0, 'cash', 'paid', ?, 'completed', 'thu', '2026-01-03 08:00:00')`,
      ['L4_' + ma(), g.sdt, g.cp])).lastInsertRowid);
      await db.run(`INSERT INTO pos_order_items (order_id, product_id, product_code, product_name, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, 0, 0)`, [id, p.id, p.code, p.name, sl]);
      await db.run('UPDATE pos_customer_packages SET delivered_qty = delivered_qty + ? WHERE id = ?', [sl, g.cp]);
    };
    const layP = (g, p, sl) => goiAi('chu', 'POST', '/orders', { customer_phone: g.sdt, customer_name: 'Khách GOI1', customer_package_id: g.cp,
      items: [{ product_id: p.id, sx_product_type: p.sx_product_type, sx_product_id: p.sx_product_id, quantity: sl, from_package: true }], payment_method: 'cash', cash_amount: 0 });
    const daLayP = (g, p) => so(`SELECT COALESCE(SUM(oi.quantity), 0) FROM pos_order_items oi JOIN pos_orders o ON o.id = oi.order_id
      WHERE o.customer_package_id = ? AND o.status != 'cancelled' AND oi.product_id = ? AND oi.unit_price = 0`, [g.cp, p.id]);
    const ko = await coGoi(0, [loai(0, 2), loaiNe(5)]);
    await chenDaLay(ko, ne, 4);
    const ro = await layP(ko, sp[0], 2);
    k('A2o gói CT1 (juice 1) cài 2 + NE1 (tea 1) cài 5, đã lấy 4 NE1 → lấy 2 CT1 → 200, CT1 đã lấy 2 (không chặn oan vì loại khác kiểu)',
      ro.status === 200 && await daLayP(ko, sp[0]) === 2, `${moTa(ro)} · CT1 ${await daLayP(ko, sp[0])}`);
    const kp = await coGoi(0, [loaiNe(2), loai(0, 5)]);
    await chenDaLay(kp, sp[0], 1); await chenDaLay(kp, ne, 2);
    const rp = await layP(kp, ne, 1);
    k('A2p NE1 cài 2 + CT1 cài 5, đã lấy CT1 1 + NE1 2 → lấy 1 NE1 → 400 GOI_HET_LUOT_LOAI, NE1 vẫn 2 (không giao vượt)',
      rp.status === 400 && rp.code === 'GOI_HET_LUOT_LOAI' && await daLayP(kp, ne) === 2, `${moTa(rp)} · NE1 ${await daLayP(kp, ne)}`);
    const kq = await coGoi(0, [loai(0, 2), loaiNe(5)]);
    await chenDaLay(kq, ne, 1); await chenDaLay(kq, sp[0], 2);
    const rq = await layP(kq, sp[0], 1);
    k('A2p2 (đảo vai A2p) CT1 cài 2 + NE1 cài 5, đã lấy NE1 1 + CT1 2 → lấy 1 CT1 → 400 GOI_HET_LUOT_LOAI, CT1 vẫn 2',
      rq.status === 400 && rq.code === 'GOI_HET_LUOT_LOAI' && await daLayP(kq, sp[0]) === 2, `${moTa(rq)} · CT1 ${await daLayP(kq, sp[0])}`);
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
    k('A4b Reports.jsx: mở thẳng tab + lọc gói từ URL (GOI-2: gửi goi lên máy chủ); tên khách là Link tới /customers?phone=; tìm theo tên + SĐT',
      /searchParams\.get\('tab'\)/.test(rp) && /searchParams\.get\('goi'\)/.test(rp) && /qs\.set\('goi', goiLoc\)/.test(rp)
        && /to=\{`\/customers\?phone=\$\{encodeURIComponent\(kh\.customer_phone\)\}`\}/.test(rp)
        && /\(p\.customer_name \|\| ''\)\.toLowerCase\(\)\.includes\(s\)/.test(rp) && /\(p\.customer_phone \|\| ''\)\.includes\(s\)/.test(rp));
    k('A4b2 Reports.jsx: ngày mua + lần lấy gần nhất + trạng thái của gói; lần lấy gần nhất của KHÁCH (moc_lay, GOI-2); > 100 % tô đỏ',
      /fmtDate\(pkg\.created_at\)/.test(rp) && /pkg\.last_delivery_at \? fmtDate\(pkg\.last_delivery_at\) : 'chưa lấy'/.test(rp)
        && /TRANG_THAI\[pkg\.status\]/.test(rp) && /kh\.moc_lay \? fmtDate\(kh\.moc_lay\)/.test(rp) && /const vuot = pct > 100/.test(rp)
        && /vuot \? '#dc2626'/.test(rp));
    const st = docTrang('Settings.jsx');
    k('A4c Settings.jsx: "N KH" là Link tới /reports?tab=packages&goi=<mã gói>',
      /<Link to=\{`\/reports\?tab=packages&goi=\$\{pkg\.id\}`\}[^>]*>🔒 \{pkg\.active_users\} KH<\/Link>/.test(st));
    k('A4c2 Reports.jsx: mở từ "N KH" (có goi) thì lọc "Đang dùng" (C2; GOI-2 Q2: mặc định luôn Đang dùng)',
      /useState\('dang_dung'\)/.test(rp));
    const kh = docTrang('Customers.jsx');
    const moKh = (kh.match(/useEffect\(\(\) => \{\s*if \(!sdtMo \|\| loading\) return;[\s\S]*?\}, \[sdtMo, loading\]\);/) || [''])[0];
    k('A4d Customers.jsx: đọc phone từ URL, tải xong danh sách thì mở đúng khách (openDetailModal) MỘT lần — xoá tham số trước khi mở',
      /const sdtMo = searchParams\.get\('phone'\)/.test(kh) && /const kh = customers\.find\(c => c\.phone === sdtMo\);/.test(moKh)
        && /if \(kh\) openDetailModal\(kh\);/.test(moKh)
        && /^\s*setSearchParams\(\{\}, \{ replace: true \}\);\s*$/m.test(moKh)
        && moKh.search(/^\s*setSearchParams\(\{\}, \{ replace: true \}\);\s*$/m) < moKh.indexOf('openDetailModal'));
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
    k('A5h Reports.jsx: nút kết thúc gói chỉ khi có quyền refund_package + gói active (GOI-2: hộp xác nhận thay window.prompt, lý do rỗng không gửi — B5c)',
      /hasPermission\('refund_package'\) && pkg\.status === 'active' && pkg\.delivered_qty < pkg\.total_qty/.test(rp)
        && !/window\.prompt/.test(rp) && /reason: kt\.lyDo\.trim\(\)/.test(rp));
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
    // LUOI-5 (AU4-21 packages-03): xoá gói ĐÃ có lịch sử bán (goiId: A6a mua, A6b lấy đủ → completed, 0 khách đang dùng) → chỉ ngừng bán, quầy không bán được nữa.
    const xj = await goi('DELETE', `/packages/${goiId}`);
    const sdtJ = sdtMoi();
    const mj = await muaGoi(sdtJ, goiId);
    k('A6j xoá gói đã có lịch sử bán (khách lấy đủ) → 200, còn dòng, is_active 0; mua lại gói đó → 400, không đơn', xj.status === 200
      && await so('SELECT is_active FROM pos_packages WHERE id = ?', [goiId]) === 0 && mj.status === 400
      && await so('SELECT COUNT(*) FROM pos_orders WHERE customer_phone = ?', [sdtJ]) === 0, `${moTa(xj)} / ${moTa(mj)}`);
    const sdt4 = sdtMoi();
    const m4 = await muaGoi(sdt4, cu, { cash_amount: 0 });
    const cp4 = await goiCua(m4.order?.id);
    const l4 = await lay(sdt4, cp4, [[0, 2]]);
    k('A6i gói cũ tổng 30 lệch danh sách (10) vẫn bán được, lấy trong giới hạn loại được; gói của khách lưu 30 lượt như đã cài', m4.status === 200 && l4.status === 200
      && await so('SELECT total_qty FROM pos_customer_packages WHERE id = ?', [cp4]) === 30, `${moTa(m4)} / ${moTa(l4)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  //  GOI-2 — báo cáo gói mỗi khách một dòng, "Kết thúc gói" (hoàn / không hoàn), chặn hoàn hai lần, 4 đường bấm (chủ quán chốt
  //  13–14.10: Q-A ví mẹ trước + trần cộng dồn theo đơn, Q-B đơn còn nợ không hoàn, Q-C huỷ đơn lấy không trả túi về gói đã kết thúc).
  // ═════════════════════════════════════════════════════════════════════════
  const theoKhach = async (qs = '') => goi('GET', `/packages/customer-packages/theo-khach${qs ? '?' + qs : ''}`);
  const khach = async (sdt, qs) => ((await theoKhach(qs)).data || []).find((x) => x.customer_phone === sdt);
  const ketThuc = (cp, body, ai = 'chu') => goiAi(ai, 'PUT', `/packages/customer-packages/${cp}/cancel`, body);
  const duKien = (cp) => goi('GET', `/packages/customer-packages/${cp}/hoan-du-kien`);
  const vi = (sdt) => so('SELECT COALESCE((SELECT balance FROM pos_wallets WHERE phone = ?), 0)', [sdt]);
  const tieu = (sdt) => so('SELECT COALESCE((SELECT total_spent FROM pos_wallets WHERE phone = ?), 0)', [sdt]);
  const soDong = (don, cach, sdt = null) => so(`SELECT COALESCE(SUM(amount), 0) FROM pos_balance_transactions WHERE order_id = ? AND type = 'refund'
    AND COALESCE(payment_method, '') = ? AND (? IS NULL OR customer_phone = ?)`, [don, cach, sdt, sdt]);
  const ttGoi = (cp) => mot('SELECT status, notes, delivered_qty FROM pos_customer_packages WHERE id = ?', [cp]);
  const ttDon = (id) => mot('SELECT status FROM pos_orders WHERE id = ?', [id]);
  const nap = async (sdt, tien) => {
    const r = await goi('POST', '/wallets/topup', { phone: sdt, amount: tien, customer_name: 'Khách GOI2', payment_method: 'cash' });
    if (r.status !== 200) throw new Error('không nạp được ví: ' + moTa(r));
  };
  // Gói 30 túi (CT1 15 + CT2 15) giá 1.350.000 — đúng ví dụ của phiếu (lấy 10/30 → hoàn 900.000).
  const G30 = await taoGoi([loai(0, 15), loai(1, 15)], { price: 1350000, name: 'Gói 30 túi' });
  const mua30 = async (sdt, them = {}) => {
    const m = await muaGoi(sdt, G30, { cash_amount: 1350000, ...them });
    if (m.status !== 200) throw new Error('không mua được gói 30: ' + moTa(m));
    return { don: m.order.id, ma: m.order.code, cp: await goiCua(m.order.id) };
  };
  const { BAT_BIEN } = require(path.join(GOC, 'cong_cu', 'gia_lap', 'bat_bien.js'));
  const batBien = async () => [...await BAT_BIEN.I11((s) => db.query(s)), ...await BAT_BIEN.I19((s) => db.query(s))];

  muc('[B1] GOI-2: mỗi khách một dòng — còn lại, lâu chưa lấy, 3 lọc, lọc theo gói / khách (Q1, Q2)');
  {
    const x = sdtMoi();
    const x1 = await mua30(x);
    dungGoi(await lay(x, x1.cp, [[0, 10]]), 'B1 lấy 10 CT1');
    const x2 = await mua30(x);
    const g5 = await taoGoi([loai(0, 5)]);
    const x3 = await goiCua((await muaGoi(x, g5)).order?.id);
    dungGoi(await lay(x, x3, [[0, 5]]), 'B1 lấy 5 CT1');
    const kx = await khach(x);
    const soDongX = ((await theoKhach()).data || []).filter((r) => r.customer_phone === x).length;
    k('B1a khách 3 gói (10/30 đang dùng · 0/30 đang dùng · 5/5 xong) → MỘT dòng: so_goi 3, so_dang_dung 2, con_lai 50, có danh sách gói',
      soDongX === 1 && kx?.so_goi === 3 && kx.so_dang_dung === 2 && kx.con_lai === 50 && Array.isArray(kx.goi) && kx.goi.length === 3,
      JSON.stringify({ dong: soDongX, so_goi: kx?.so_goi, dd: kx?.so_dang_dung, con: kx?.con_lai }));
    const dung = await ketThuc(x2.cp, { reason: 'thử B1b' });
    const kxb = await khach(x);
    k('B1b gói đã kết thúc KHÔNG cộng "còn lại": 50 → 20, so_dang_dung 1, so_goi vẫn 3', dung.status === 200 && kxb?.con_lai === 20
      && kxb.so_dang_dung === 1 && kxb.so_goi === 3, `${moTa(dung)} · ${JSON.stringify({ con: kxb?.con_lai, dd: kxb?.so_dang_dung })}`);

    const luc = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 19).replace('T', ' ');
    const khachMoc = async (ngayMua, ngayLay) => {   // gói mua `ngayMua` ngày trước; có `ngayLay` → một đơn lấy 1 CT1 `ngayLay` ngày trước
      const g = await coGoi(ngayLay == null ? 0 : 1);
      await db.run('UPDATE pos_customer_packages SET created_at = ? WHERE id = ?', [luc(ngayMua), g.cp]);
      if (ngayLay != null) await db.run('UPDATE pos_orders SET created_at = ? WHERE id = ?', [luc(ngayLay), g.donLay]);
      return g.sdt;
    };
    const y = await khachMoc(31), z = await khachMoc(30), w = await khachMoc(60, 31), v = await khachMoc(60, 5);
    const ky = await khach(y), kz = await khach(z), kw = await khach(w), kv = await khach(v);
    k('B1c "lâu chưa lấy" > 30 ngày, chưa lấy tính theo ngày mua: 31 ngày → lau + ngay_chua_lay 31; 30 ngày → không (ngay trên / ngay dưới)',
      ky?.lau === true && ky.ngay_chua_lay === 31 && kz?.lau === false && kz.ngay_chua_lay === 30,
      JSON.stringify({ y: [ky?.lau, ky?.ngay_chua_lay], z: [kz?.lau, kz?.ngay_chua_lay] }));
    k('B1c2 đã lấy thì tính theo LẦN LẤY gần nhất: mua 60 lấy 31 → lau; mua 60 lấy 5 → không', kw?.lau === true && kv?.lau === false,
      JSON.stringify({ w: kw?.lau, v: kv?.lau }));
    const q = (await coGoi(0)).sdt;
    await ketThuc((await mot('SELECT id FROM pos_customer_packages WHERE customer_phone = ?', [q])).id, { reason: 'thử B1d' });
    const sdtCua = async (qs) => ((await theoKhach(qs)).data || []).map((r) => r.customer_phone);
    const macDinh = await sdtCua(''), dangDung = await sdtCua('loc=dang_dung'), lau = await sdtCua('loc=lau'), xong = await sdtCua('loc=xong');
    k('B1d mặc định = Đang dùng: có X, Y, Z (gói active), KHÔNG có Q (chỉ gói đã kết thúc)', macDinh.includes(x) && macDinh.includes(y)
      && macDinh.includes(z) && !macDinh.includes(q) && JSON.stringify(macDinh) === JSON.stringify(dangDung), JSON.stringify({ q: macDinh.includes(q) }));
    k('B1d2 loc=lau: chỉ Y, W — không Z, V, X', lau.includes(y) && lau.includes(w) && !lau.includes(z) && !lau.includes(v) && !lau.includes(x),
      JSON.stringify({ y: lau.includes(y), w: lau.includes(w), z: lau.includes(z), v: lau.includes(v), x: lau.includes(x) }));
    k('B1d3 loc=xong: khách có gói xong / kết thúc (X, Q) — không khách chỉ đang dùng (Y)', xong.includes(x) && xong.includes(q) && !xong.includes(y),
      JSON.stringify({ x: xong.includes(x), q: xong.includes(q), y: xong.includes(y) }));
    const g7 = await taoGoi([loai(0, 7)]);   // gói chỉ X mua, đang dùng — lọc theo gói giữ lọc Đang dùng (như "🔒 N KH")
    await muaGoi(x, g7);
    const theoGoi = (await theoKhach(`goi=${g7}`)).data || [];
    const theoSdt = (await theoKhach(`phone=${y}`)).data || [];
    k('B1f ?goi=<gói 7 túi> → chỉ khách có gói đó (X), danh sách gói chỉ gói đó; ?phone=<Y> → đúng một dòng Y',
      theoGoi.length === 1 && theoGoi[0].customer_phone === x && theoGoi[0].so_goi === 1 && theoSdt.length === 1 && theoSdt[0].customer_phone === y,
      JSON.stringify({ goi: theoGoi.map((r) => [r.customer_phone, r.so_goi]), sdt: theoSdt.map((r) => r.customer_phone) }));
    k('B1h mỗi gói trong dòng khách có mã đơn mua (order_code) để bấm sang màn Đơn hàng', kx?.goi?.every((g) => g.order_code) === true
      && kx.goi.some((g) => g.order_code === x1.ma), JSON.stringify(kx?.goi?.map((g) => g.order_code)));
    const rp = docTrang('Reports.jsx');
    const nutLoc = (rp.match(/\[\{ k: '[^']+', l: '[^']+' \}(?:, \{ k: '[^']+', l: '[^']+' \})*\]\.map\(f => \(/) || [''])[0];
    k('B1g Reports.jsx: gọi theo-khach với loc + goi + phone từ URL; ĐÚNG 3 nút lọc dang_dung / lau / xong (không "all", "near"); tìm tên + SĐT tại màn',
      /api\.get\(`\/packages\/customer-packages\/theo-khach\?\$\{qs\}`\)/.test(rp) && /qs\.set\('goi', goiLoc\)/.test(rp) && /qs\.set\('phone', sdtLoc\)/.test(rp)
        && /const sdtLoc = searchParams\.get\('phone'\)/.test(rp) && /useState\('dang_dung'\)/.test(rp)
        && (nutLoc.match(/k: '/g) || []).length === 3 && /k: 'dang_dung'/.test(nutLoc) && /k: 'lau'/.test(nutLoc) && /k: 'xong'/.test(nutLoc)
        && !/k: 'all'|k: 'near'/.test(rp) && /\(p\.customer_name \|\| ''\)\.toLowerCase\(\)\.includes\(s\)/.test(rp) && /\(p\.customer_phone \|\| ''\)\.includes\(s\)/.test(rp),
      nutLoc || 'không thấy mảng nút lọc');
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B2] GOI-2: gói active mà đã lấy đủ → Đã xong, kể cả dữ liệu cũ (Q3)');
  {
    const cu = await coGoi(0, [loai(0, 5)]);
    await db.run("UPDATE pos_customer_packages SET delivered_qty = 5 WHERE id = ?", [cu.cp]);   // dữ liệu cũ: đủ 5/5 mà vẫn 'active'
    const gan = await coGoi(4, [loai(0, 5)]);
    const truoc = await so('SELECT COUNT(*) FROM pos_customer_packages');
    await theoKhach();
    k('B2a sau khi mở Báo cáo (theo-khach): gói active 5/5 → completed; gói 4/5 vẫn active; không mất dòng nào',
      (await ttGoi(cu.cp)).status === 'completed' && (await ttGoi(gan.cp)).status === 'active' && await so('SELECT COUNT(*) FROM pos_customer_packages') === truoc,
      `${(await ttGoi(cu.cp)).status} / ${(await ttGoi(gan.cp)).status}`);
    const cu2 = await coGoi(0, [loai(0, 5)]);
    await db.run("UPDATE pos_customer_packages SET delivered_qty = 5 WHERE id = ?", [cu2.cp]);
    const r = await ketThuc(cu2.cp, { reason: 'thử B2b', hoan: false });
    k('B2b kết thúc gói active mà đã đủ 5/5 (chưa nắn) → 400, không thành cancelled', r.status === 400 && (await ttGoi(cu2.cp)).status !== 'cancelled', moTa(r));
    const rp = docTrang('Reports.jsx');
    k('B2c Reports.jsx: completed hiện "Đã xong", cancelled hiện "Đã kết thúc"',
      /const TRANG_THAI = \{ active: '[^']*Đang dùng', completed: '[^']*Đã xong', cancelled: '[^']*Đã kết thúc' \};/.test(rp));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B3] GOI-2: Kết thúc gói — hoàn phần còn lại theo giá ĐÃ TRẢ, ví mẹ trước, trần cộng dồn, một lần (Q4a, Q-A, Q-B)');
  {
    const a = sdtMoi();
    const ga = await mua30(a);
    dungGoi(await lay(a, ga.cp, [[0, 10]]), 'B3 lấy 10 CT1');
    const dk = await duKien(ga.cp);
    k('B3a hoan-du-kien: 1.350.000, đã lấy 10/30 → tong 900.000 = tien_mat 900.000, vi 0, me 0', dk.status === 200 && dk.data?.tong === 900000
      && dk.data.tien_mat === 900000 && dk.data.vi === 0 && dk.data.me === 0, `${moTa(dk)} · ${JSON.stringify(dk.data)}`);
    const viA = await vi(a);
    const r = await ketThuc(ga.cp, { reason: 'khách chuyển nhà', hoan: true, so_tien: 900000 });
    const s = await ttGoi(ga.cp);
    k('B3a2 kết thúc có hoàn → 200; ví +900.000 (dòng hoan_goi, total_spent không đổi); gói cancelled; notes: lý do + người + thời điểm + 900000',
      r.status === 200 && await vi(a) === viA + 900000 && await soDong(ga.don, 'hoan_goi') === 900000 && await soDong(ga.don, 'cash') === 0
        && await tieu(a) === 0 && s.status === 'cancelled' && /khách chuyển nhà/.test(s.notes) && String(s.notes).includes(chu.username)
        && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s.notes) && String(s.notes).includes('900000'),
      `${moTa(r)} · ví ${await vi(a)} · ${JSON.stringify(s)}`);
    const dongVi = await mot("SELECT notes FROM pos_balance_transactions WHERE order_id = ? AND type = 'refund'", [ga.don]);
    k('B3k dòng ví ghi mã gói khách #cp + mã đơn mua (đối soát)', String(dongVi?.notes).includes(`#${ga.cp}`) && String(dongVi?.notes).includes(ga.ma), String(dongVi?.notes));

    const b = sdtMoi();
    const gb = await mua30(b);
    const rb = await ketThuc(gb.cp, { reason: 'chưa lấy', hoan: true, so_tien: 1350000 });
    k('B3b chưa lấy lần nào → hoàn đủ giá đã trả 1.350.000', rb.status === 200 && await vi(b) === 1350000, `${moTa(rb)} · ví ${await vi(b)}`);

    const c = sdtMoi();   // chiết khấu đơn do máy chủ tra từ hồ sơ khách (orders.js, LO 2) — không tin tờ khai
    await db.run("INSERT INTO pos_customers (phone, name, sx_status, discount_type, discount_value) VALUES (?, 'Khách CK GOI2', 'active', 'percent', 10)", [c]);
    const gc = await mua30(c, { cash_amount: 1215000 });
    dungGoi(await lay(c, gc.cp, [[0, 10]]), 'B3c lấy 10 CT1');
    const dkc = await duKien(gc.cp);
    k('B3c mua có giảm 10 % (trả 1.215.000), đã lấy 10/30 → hoàn theo giá ĐÃ TRẢ 1.215.000 × 20/30 = 810.000 (giá niêm yết ra 900.000)', dkc.data?.tong === 810000
      && (await ketThuc(gc.cp, { reason: 'thử', hoan: true, so_tien: 810000 })).status === 200 && await vi(c) === 810000, `${JSON.stringify(dkc.data)} · ví ${await vi(c)}`);

    const d = sdtMoi();
    const md = await muaGoi(d, G30, { package_buy: { package_id: G30, total_qty: 30, pkg_qty: 2 }, cash_amount: 2700000 });
    const cpsD = (await db.query('SELECT id FROM pos_customer_packages WHERE order_id = ? ORDER BY id', [md.order?.id])).map((r) => r.id);
    const dkd = await duKien(cpsD[1]);
    const rd = await ketThuc(cpsD[1], { reason: 'thử', hoan: true, so_tien: 1350000 });
    k('B3d một dòng mua 2 gói (2.700.000) → kết thúc gói thứ hai hoàn MỘT NỬA 1.350.000; gói thứ nhất vẫn active', md.status === 200 && cpsD.length === 2
      && dkd.data?.tong === 1350000 && rd.status === 200 && await vi(d) === 1350000 && (await ttGoi(cpsD[0])).status === 'active',
      `${moTa(md)} · ${JSON.stringify(dkd.data)} · ${moTa(rd)} · ví ${await vi(d)}`);

    const me = sdtMoi(), con = sdtMoi();
    await nap(me, 500000); await nap(con, 400000);
    const ge = await mua30(con, { cash_amount: 450000, balance_amount: 400000, parent_phone: me, parent_balance_amount: 500000 });
    const dke = await duKien(ge.cp);
    const re = await ketThuc(ge.cp, { reason: 'thử', hoan: true, so_tien: 1350000 });
    k('B3e trả ví mẹ 500.000 + ví con 400.000 + tiền mặt 450.000, chưa lấy → mẹ +500.000 (về ví mẹ), con +400.000 dòng cash (giảm total_spent) + 450.000 dòng hoan_goi',
      dke.data?.me === 500000 && dke.data.vi === 400000 && dke.data.tien_mat === 450000 && re.status === 200 && await vi(me) === 500000 && await vi(con) === 850000
        && await soDong(ge.don, 'cash', con) === 400000 && await soDong(ge.don, 'hoan_goi', con) === 450000 && await tieu(con) === 0 && await tieu(me) === 0,
      `${JSON.stringify(dke.data)} · ${moTa(re)} · mẹ ${await vi(me)} · con ${await vi(con)} · cash con ${await soDong(ge.don, 'cash', con)} · chi con ${await tieu(con)}`);

    const me1 = sdtMoi(), con1 = sdtMoi();
    await nap(me1, 500000); await nap(con1, 400000);
    const ge2 = await mua30(con1, { cash_amount: 450000, balance_amount: 400000, parent_phone: me1, parent_balance_amount: 500000 });
    dungGoi(await lay(con1, ge2.cp, [[0, 15], [1, 5]]), 'B3e2 lấy 20 túi');
    const dke2 = await duKien(ge2.cp);
    const re2 = await ketThuc(ge2.cp, { reason: 'thử', hoan: true, so_tien: 450000 });
    k('B3e2 đã lấy 20/30 → chỉ hoàn 450.000: VÍ MẸ TRƯỚC (mẹ +450.000), ví con 0, tiền mặt 0 (Q-A: mẹ trước tối đa phần mẹ đã trả)',
      dke2.data?.tong === 450000 && dke2.data.me === 450000 && dke2.data.vi === 0 && dke2.data.tien_mat === 0 && re2.status === 200
        && await vi(me1) === 450000 && await vi(con1) === 0, `${JSON.stringify(dke2.data)} · ${moTa(re2)} · mẹ ${await vi(me1)} · con ${await vi(con1)}`);

    const me2 = sdtMoi(), con2 = sdtMoi();
    await nap(me2, 500000); await nap(con2, 400000);
    const ml = await muaGoi(con2, G30, { package_buy: { package_id: G30, total_qty: 30, pkg_qty: 2 }, cash_amount: 1800000, balance_amount: 400000,
      parent_phone: me2, parent_balance_amount: 500000 });
    const cpsL = (await db.query('SELECT id FROM pos_customer_packages WHERE order_id = ? ORDER BY id', [ml.order?.id])).map((r) => r.id);
    const l1 = await ketThuc(cpsL[0], { reason: 'thử', hoan: true, so_tien: 1350000 });
    const dkl = await duKien(cpsL[1]);
    const l2 = await ketThuc(cpsL[1], { reason: 'thử', hoan: true, so_tien: 1350000 });
    k('B3l kết thúc LẦN LƯỢT 2 gói cùng đơn (mẹ 500.000 + ví 400.000 + mặt 1.800.000): lần 2 mẹ 0, ví 0, mặt 1.350.000 (trần cộng dồn); tổng mẹ 500.000, cash con 400.000, hoan_goi 1.800.000',
      ml.status === 200 && l1.status === 200 && dkl.data?.me === 0 && dkl.data.vi === 0 && dkl.data.tien_mat === 1350000 && l2.status === 200
        && await vi(me2) === 500000 && await soDong(ml.order?.id, 'cash', con2) === 400000 && await soDong(ml.order?.id, 'hoan_goi', con2) === 1800000,
      `${moTa(ml)} · ${JSON.stringify(dkl.data)} · mẹ ${await vi(me2)} · cash con ${await soDong(ml.order?.id, 'cash', con2)} · hoan_goi ${await soDong(ml.order?.id, 'hoan_goi', con2)}`);

    const f = sdtMoi();
    const mf = await muaGoi(f, G30, { items: [mon(2, 1, false)], cash_amount: 1375000 });
    const cpF = await goiCua(mf.order?.id);
    const rf = await ketThuc(cpF, { reason: 'thử', hoan: true, so_tien: 1350000 });
    const den = await goi('POST', '/damages', { order_id: mf.order?.id, product_code: sp[2].code, quantity: 1, reason: 'hỏng', action: 'refund', refund_amount: 25000 });
    k('B3m đền bù món lẻ (25.000) SAU khi kết thúc gói (1.350.000) trên đơn 1.375.000 → 200, khách nhận đúng 1.375.000 (I19 vẫn đúng)',
      mf.status === 200 && rf.status === 200 && den.status === 200 && await vi(f) === 1375000, `${moTa(mf)} · ${moTa(rf)} · ${moTa(den)} · ví ${await vi(f)}`);

    const g = sdtMoi();
    const gg = await mua30(g);
    const nv = await ketThuc(gg.cp, { reason: 'thử', hoan: true, so_tien: 1350000 }, 'staff');
    const ql = await ketThuc(gg.cp, { reason: 'thử', hoan: true, so_tien: 1350000 }, 'manager');
    const thieu = await ketThuc(gg.cp, { hoan: true, so_tien: 1350000 });
    const dkNv = await goiAi('staff', 'GET', `/packages/customer-packages/${gg.cp}/hoan-du-kien`);
    k('B3g nhân viên / quản lý (không refund_package) → 403 (cả hoan-du-kien); chủ quán thiếu lý do → 400 GOI_THIEU_LY_DO; ví không đổi, gói active',
      nv.status === 403 && ql.status === 403 && dkNv.status === 403 && thieu.status === 400 && thieu.code === 'GOI_THIEU_LY_DO' && await vi(g) === 0 && (await ttGoi(gg.cp)).status === 'active',
      `${moTa(nv)} / ${moTa(ql)} / ${moTa(thieu)}`);
    const lech = await ketThuc(gg.cp, { reason: 'thử', hoan: true, so_tien: 900000 });
    k('B3h so_tien gửi lên lệch số máy chủ tính (900.000 ≠ 1.350.000) → 409 GOI_HOAN_DOI_SO kèm số mới; ví không đổi, gói active',
      lech.status === 409 && lech.code === 'GOI_HOAN_DOI_SO' && lech.hoan_du_kien?.tong === 1350000 && await vi(g) === 0 && (await ttGoi(gg.cp)).status === 'active',
      `${moTa(lech)} · ${JSON.stringify(lech.hoan_du_kien)}`);

    const n = sdtMoi();
    const gn = await mua30(n, { payment_method: 'debt', cash_amount: 0, debt_amount: 1350000 });
    const dkn = await duKien(gn.cp);
    const rn = await ketThuc(gn.cp, { reason: 'thử', hoan: true });
    const rn2 = await ketThuc(gn.cp, { reason: 'thử', hoan: false });
    k('B3n (Q-B) đơn mua gói còn NỢ: hoan-du-kien 400 DON_CON_NO; kết thúc có hoàn → 400 DON_CON_NO, gói active; kết thúc KHÔNG hoàn → 200',
      dkn.status === 400 && dkn.code === 'DON_CON_NO' && rn.status === 400 && rn.code === 'DON_CON_NO' && rn2.status === 200
        && (await ttGoi(gn.cp)).status === 'cancelled' && await vi(n) === 0, `${moTa(dkn)} / ${moTa(rn)} / ${moTa(rn2)}`);

    const o = sdtMoi();
    const go = await mua30(o);
    await db.run("UPDATE pos_orders SET status = 'cancelled' WHERE id = ?", [go.don]);   // dữ liệu lệch: đơn mua đã huỷ mà gói còn active
    const dko = await duKien(go.cp);
    const ro = await ketThuc(go.cp, { reason: 'thử', hoan: true });
    const ro2 = await ketThuc(go.cp, { reason: 'thử', hoan: false });
    k('B3o đơn mua không còn hiệu lực (đã huỷ) mà gói còn active → hoan-du-kien / kết thúc có hoàn 400 GOI_KHONG_CO_DON_MUA, ví 0; kết thúc không hoàn → 200',
      dko.status === 400 && dko.code === 'GOI_KHONG_CO_DON_MUA' && ro.status === 400 && ro.code === 'GOI_KHONG_CO_DON_MUA' && await vi(o) === 0 && ro2.status === 200,
      `${moTa(dko)} / ${moTa(ro)} / ${moTa(ro2)}`);

    const h = sdtMoi();
    const gh = await mua30(h);
    const [h1, h2] = await Promise.all([ketThuc(gh.cp, { reason: 'quầy 1', hoan: true, so_tien: 1350000 }), ketThuc(gh.cp, { reason: 'quầy 2', hoan: true, so_tien: 1350000 })]);
    k('B3i hai chủ quán cùng bấm kết thúc có hoàn → đúng một 200, ví +1.350.000 đúng MỘT lần',
      [h1, h2].filter((x) => x.status === 200).length === 1 && await vi(h) === 1350000, `${moTa(h1)} / ${moTa(h2)} · ví ${await vi(h)}`);

    const lechBB = await batBien();
    k('B3j bất biến đối soát I11 (mỗi ví ≤ đã trả) + I19 (mỗi đơn: nhận ≤ đã trả) sạch sau mọi ca hoàn', lechBB.length === 0, lechBB.slice(0, 3).join(' | '));
    // LUOI-3 — AU3-13 / AU3-14: trần "hoàn ≤ total − đã nhận (hoàn + ĐỀN)" chỉ chặn khi sổ có khoản đền VƯỢT số đã trả của dòng — đó là
    // DỮ LIỆU TRƯỚC P26c 12.10 (trần đền theo giá gốc), còn trên production; qua API hiện nay không dựng được (viec/LUOI-3/ke_hoach.md mục 0).
    const p = sdtMoi();
    await db.run("INSERT INTO pos_customers (phone, name, sx_status, discount_type, discount_value) VALUES (?, 'Khách CK LUOI3', 'active', 'percent', 10)", [p]);
    const gp = await mua30(p, { items: [mon(2, 1, false)], cash_amount: 1237500 });
    await db.run("UPDATE pos_orders SET created_at = '2026-09-30 08:00:00' WHERE id = ?", [gp.don]);   // đơn cũ: mua trước, đền sau, cả hai trước P26c
    await db.run(`INSERT INTO pos_damage_logs (order_id, order_code, customer_phone, product_code, product_name, quantity, unit_price, damage_value,
      reason, action, refund_amount, returned_to_stock, created_at) VALUES (?, ?, ?, ?, ?, 1, 25000, 25000, 'damaged', 'refund', 25000, 0, '2026-10-01 09:00:00')`,
    [gp.don, gp.ma, p, sp[2].code, sp[2].name]);
    const { ghiVi, trongGiaoDich } = require(path.join(MAY_CHU, 'routes', 'wallets.js'));   // ví khớp sổ như đền thật
    await trongGiaoDich((tx) => ghiVi(tx, { phone: p, loai: 'compensation', soTien: 25000, orderId: gp.don, ghiChu: 'Đền bù cũ trước P26c (giá gốc)',
      nguoi: 'thu', luc: '2026-10-01 09:00:00' }));
    const dkp = await duKien(gp.cp);
    const rp = await ketThuc(gp.cp, { reason: 'thử', hoan: true, so_tien: 1212500 });
    k('B3p dữ liệu trước P26c 12.10: gói + CT3 giảm 10 % (1.237.500), đền cũ 25.000 > đã trả 22.500 → kết thúc hoàn 1.212.500, khách nhận đúng total',
      dkp.data?.tong === 1212500 && rp.status === 200 && await vi(p) === 1237500, `${JSON.stringify(dkp.data)} · ${moTa(rp)} · ví ${await vi(p)}`);
    // LUOI-4 — AU4-4 (VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN): gói 7 túi 300.000, lấy 1 → hoàn ⌊300.000 × 6 / 7⌋ = ⌊257.142,86⌋ = 257.142 (lên: 257.143).
    const q = sdtMoi();
    const gq = await muaGoi(q, await taoGoi([loai(0, 4), loai(1, 3)]));
    const cpQ = await goiCua(gq.order?.id);
    const lq = await lay(q, cpQ, [[0, 1]]);
    const dkq = await duKien(cpQ);
    const rq = await ketThuc(cpQ, { reason: 'thử', hoan: true, so_tien: 257142 });
    k('B3q gói 7 túi (CT1 4 + CT2 3) 300.000, lấy 1 → hoan-du-kien 257.142 (⌊300.000 × 6/7⌋); kết thúc có hoàn → 200, ví +257.142',
      gq.status === 200 && lq.status === 200 && dkq.data?.tong === 257142 && rq.status === 200 && await vi(q) === 257142,
      `${moTa(gq)} · ${moTa(lq)} · ${JSON.stringify(dkq.data)} · ${moTa(rq)} · ví ${await vi(q)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B4] GOI-2: không hoàn hai lần — đơn mua có gói đã kết thúc thì Huỷ / Xoá đơn bị chặn (A4)');
  {
    const CAU = 'Gói đã kết thúc — xử lý ở Báo cáo → Gói SP';
    const a = sdtMoi();
    const ga = await mua30(a);
    await lay(a, ga.cp, [[0, 10]]);
    const kt = await ketThuc(ga.cp, { reason: 'thử', hoan: true, so_tien: 900000 });
    const viA = await vi(a);
    const hy = await huy(ga.don);
    k('B4a kết thúc có hoàn (900.000) rồi HUỶ đơn mua → 400 GOI_DA_KET_THUC đúng câu; đơn vẫn completed; ví không đổi',
      kt.status === 200 && hy.status === 400 && hy.code === 'GOI_DA_KET_THUC' && hy.error === CAU && (await ttDon(ga.don)).status === 'completed' && await vi(a) === viA,
      `${moTa(kt)} · ${moTa(hy)} · ví ${await vi(a)}`);
    const xo = await goi('DELETE', `/orders/${ga.don}`);
    k('B4b … rồi XOÁ đơn mua → 400 GOI_DA_KET_THUC, đơn còn, ví không đổi', xo.status === 400 && xo.code === 'GOI_DA_KET_THUC' && xo.error === CAU
      && (await ttDon(ga.don))?.status === 'completed' && await vi(a) === viA, `${moTa(xo)} · ví ${await vi(a)}`);
    const b = sdtMoi();
    const gb = await mua30(b);
    await ketThuc(gb.cp, { reason: 'thử', hoan: false });
    const hb = await huy(gb.don), xb = await goi('DELETE', `/orders/${gb.don}`);
    k('B4c kết thúc KHÔNG hoàn rồi huỷ / xoá đơn mua → 400 GOI_DA_KET_THUC cả hai, ví không đổi', hb.status === 400 && hb.code === 'GOI_DA_KET_THUC'
      && xb.status === 400 && xb.code === 'GOI_DA_KET_THUC' && await vi(b) === 0, `${moTa(hb)} / ${moTa(xb)}`);
    const d = sdtMoi();
    const gd = await mua30(d);
    await lay(d, gd.cp, [[0, 10]]);
    const [d1, d2] = await Promise.all([ketThuc(gd.cp, { reason: 'quầy 1', hoan: true, so_tien: 900000 }), huy(gd.don)]);
    k('B4d CÙNG LÚC kết thúc có hoàn ‖ huỷ đơn mua → đúng một 200, khách nhận đúng MỘT khoản 900.000',
      [d1, d2].filter((x) => x.status === 200).length === 1 && await vi(d) === 900000, `${moTa(d1)} / ${moTa(d2)} · ví ${await vi(d)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B5] GOI-2: Kết thúc không hoàn (Q4b) + hộp xác nhận ở màn Báo cáo');
  {
    const a = sdtMoi();
    const ga = await mua30(a);
    const chup = async () => JSON.stringify(await mot(`SELECT (SELECT COUNT(*) FROM pos_balance_transactions) AS so, (SELECT COALESCE(SUM(balance), 0) FROM pos_wallets) AS vi`));
    const truoc = await chup();
    const r = await ketThuc(ga.cp, { reason: 'khách bỏ', hoan: false });
    const s = await ttGoi(ga.cp);
    k('B5a hoan: false → 200, cancelled, notes "không hoàn" + lý do; sổ ví / ví không đổi', r.status === 200 && s.status === 'cancelled'
      && /không hoàn/.test(s.notes) && /khách bỏ/.test(s.notes) && await chup() === truoc, `${moTa(r)} · ${s.notes}`);
    const rp = docTrang('Reports.jsx');
    const hop = (rp.match(/\{ketThuc\?\.cp === pkg\.id && \([\s\S]*?Xác nhận kết thúc/) || [''])[0];
    k('B5b Reports.jsx: nút "Kết thúc gói…" chỉ khi refund_package + gói active còn túi, nằm TRONG phần mở ra; hộp 2 lựa chọn (hoàn / không hoàn) + "không mở lại được"; hết window.prompt / "Dừng gói"',
      /\{dO && <div[\s\S]*?hasPermission\('refund_package'\) && pkg\.status === 'active' && pkg\.delivered_qty < pkg\.total_qty && ketThuc\?\.cp !== pkg\.id &&[\s\S]*?onClick=\{\(\) => moKetThuc\(pkg\)\}>Kết thúc gói…<\/button>/.test(rp)
        && hop !== '' && /checked=\{ketThuc\.hoan === true\}/.test(hop) && /checked=\{ketThuc\.hoan === false\}/.test(hop) && /không mở lại được/.test(hop)
        && /Hoàn phần còn lại vào ví khách: <strong>\{ketThuc\.duKien \? formatPrice\(ketThuc\.duKien\.tong\)/.test(hop) && !/window\.prompt|Dừng gói/.test(rp),
      hop ? '' : 'không thấy hộp xác nhận');
    const xn = (rp.match(/const xacNhanKetThuc = async \(\) => \{[\s\S]*?\n  \};/) || [''])[0];
    k('B5c Reports.jsx xacNhanKetThuc: chưa chọn / chưa lý do → ghi lỗi tại chỗ (setKetThuc loi) + return TRƯỚC api.put; lỗi hiện trong hộp; gửi so_tien đã xem',
      /if \(kt\.hoan === null\) return setKetThuc\(\{ \.\.\.kt, loi: '[^']+' \}\);/.test(xn) && /if \(!kt\.lyDo\.trim\(\)\) return setKetThuc\(\{ \.\.\.kt, loi: '[^']+' \}\);/.test(xn)
        && xn.indexOf('kt.hoan === null') < xn.indexOf('api.put') && /api\.put\(`\/packages\/customer-packages\/\$\{kt\.cp\}\/cancel`, \{ reason: kt\.lyDo\.trim\(\), hoan: kt\.hoan, so_tien: kt\.hoan \? kt\.duKien\?\.tong : undefined \}\)/.test(xn)
        && /\{ketThuc\.loi && <div/.test(hop), xn ? '' : 'không thấy xacNhanKetThuc');
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B6] GOI-2: 4 đường bấm giữa các màn (Q5)');
  {
    const st = docTrang('Settings.jsx'), rp = docTrang('Reports.jsx'), kh = docTrang('Customers.jsx'), od = docTrang('Orders.jsx');
    k('B6a Settings.jsx: TÊN gói là Link tới /reports?tab=packages&goi=<mã gói> (ngoài "🔒 N KH")',
      /<Link style=\{\{ color: 'inherit' \}\} to=\{`\/reports\?tab=packages&goi=\$\{pkg\.id\}`\}>\{pkg\.name\}<\/Link>/.test(st));
    k('B6b Reports.jsx: tên khách là Link tới /customers?phone= (giữ từ GOI-1)', /to=\{`\/customers\?phone=\$\{encodeURIComponent\(kh\.customer_phone\)\}`\}/.test(rp));
    k('B6c Customers.jsx: chi tiết khách có "Gói đang dùng: N gói · còn X túi →" là Link tới /reports?tab=packages&phone=<SĐT>, chỉ khi N > 0, số lấy từ theo-khach',
      /\{goiDangDung\?\.so_dang_dung > 0 && \(/.test(kh) && /<Link to=\{`\/reports\?tab=packages&phone=\$\{encodeURIComponent\(selectedCustomer\.phone\)\}`\}/.test(kh)
        && /Gói đang dùng: \{goiDangDung\.so_dang_dung\} gói · còn \{goiDangDung\.con_lai\} túi →/.test(kh)
        && /api\.get\(`\/packages\/customer-packages\/theo-khach\?phone=\$\{encodeURIComponent\(customer\.phone\)\}`\)/.test(kh));
    k('B6d Reports.jsx: ngày mua và từng lần giao là Link tới /orders?code=<mã đơn>&ngay=<ngày đơn>',
      /<Link to=\{`\/orders\?code=\$\{encodeURIComponent\(pkg\.order_code \|\| ''\)\}&ngay=\$\{ngay\(pkg\.created_at\)\}`\}/.test(rp)
        && /<Link to=\{`\/orders\?code=\$\{encodeURIComponent\(d\.order_code\)\}&ngay=\$\{ngay\(d\.created_at\)\}`\}/.test(rp));
    k('B6e Orders.jsx: đọc ?code= vào ô tìm và ?ngay= vào khoảng ngày (màn chỉ tải đơn theo ngày)',
      /useState\(searchParams\.get\('code'\) \|\| ''\)/.test(od) && /const ngayMo = searchParams\.get\('ngay'\) \|\| today;/.test(od)
        && /useState\(ngayMo\)/.test(od) && (od.match(/useState\(ngayMo\)/g) || []).length === 2 && /useSearchParams/.test(od));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B7] GOI-2: luồng hợp lệ KHÔNG bị chặn (K5) + Q-C huỷ đơn lấy không trả túi về gói đã kết thúc');
  {
    const a = sdtMoi();
    const ga = await mua30(a);
    await lay(a, ga.cp, [[0, 10]]);
    const hy = await huy(ga.don);
    k('B7a (K5) huỷ đơn mua gói CHƯA kết thúc → 200, hoàn như P26c: 1.350.000 − đã dùng 450.000 = 900.000; gói cancelled', hy.status === 200
      && await vi(a) === 900000 && (await ttGoi(ga.cp)).status === 'cancelled', `${moTa(hy)} · ví ${await vi(a)}`);
    const b = sdtMoi();
    const gb = await mua30(b);
    const xb = await goi('DELETE', `/orders/${gb.don}`);
    k('B7b (K5) xoá đơn mua gói chưa kết thúc, chưa lấy → 200, hoàn 1.350.000, gói bị xoá', xb.status === 200 && await vi(b) === 1350000
      && (await ttGoi(gb.cp)) == null, `${moTa(xb)} · ví ${await vi(b)}`);
    const xa = await goi('DELETE', `/orders/${ga.don}`);
    k('B7c (K5) xoá đơn mua ĐÃ HUỶ (gói cancelled do chính lệnh huỷ) → 200, ví không cộng thêm', xa.status === 200 && await vi(a) === 900000, `${moTa(xa)} · ví ${await vi(a)}`);
    const c = sdtMoi();
    const gc = await mua30(c);
    await huy(gc.don);
    const hc = await huy(gc.don);
    k('B7d (K5) huỷ đơn mua gói đã huỷ → 400 DON_KHONG_HUY_DUOC (lời cũ, không phải GOI_DA_KET_THUC)', hc.status === 400 && hc.code === 'DON_KHONG_HUY_DUOC', moTa(hc));
    const e = await coGoi(3);
    const le = await lay(e.sdt, e.cp, [[1, 2]]);
    const dl = Number((await ttGoi(e.cp)).delivered_qty);
    k('B7e (K5) lấy từ gói đang dùng → 200, giao 5', le.status === 200 && dl === 5, `${moTa(le)} · giao ${dl}`);

    const g = sdtMoi();
    const gg = await mua30(g);
    const lg = await lay(g, gg.cp, [[0, 10]]);
    const kt = await ketThuc(gg.cp, { reason: 'thử', hoan: true, so_tien: 900000 });
    const hg = await huy(lg.order?.id);
    const sg = await ttGoi(gg.cp);
    k('B7g (Q-C) huỷ đơn LẤY 10 túi từ gói ĐÃ KẾT THÚC → 200 (được huỷ) nhưng gói vẫn cancelled 10/30 — không trả túi; ví không đổi',
      kt.status === 200 && hg.status === 200 && sg.status === 'cancelled' && Number(sg.delivered_qty) === 10 && await vi(g) === 900000,
      `${moTa(kt)} · ${moTa(hg)} · ${JSON.stringify(sg)} · ví ${await vi(g)}`);
    const g2 = sdtMoi();
    const gg2 = await mua30(g2);
    const lg2 = await lay(g2, gg2.cp, [[0, 10]]);
    await ketThuc(gg2.cp, { reason: 'thử', hoan: false });
    const xg = await goi('DELETE', `/orders/${lg2.order?.id}`);
    const sg2 = await ttGoi(gg2.cp);
    k('B7g2 (Q-C) xoá đơn lấy từ gói đã kết thúc → 200, gói vẫn cancelled 10/30', xg.status === 200 && sg2.status === 'cancelled' && Number(sg2.delivered_qty) === 10,
      `${moTa(xg)} · ${JSON.stringify(sg2)}`);
    const h = await coGoi(5, [loai(0, 5)]);
    const hh = await huy(h.donLay);
    const sh = await ttGoi(h.cp);
    k('B7h (K5) huỷ đơn lấy đủ 5/5 (gói Đã xong) → gói về active 0/5 như cũ', hh.status === 200 && sh.status === 'active' && Number(sh.delivered_qty) === 0,
      `${moTa(hh)} · ${JSON.stringify(sh)}`);
    const lechBB = await batBien();
    k('B7j I11 + I19 sạch sau mọi ca GOI-2', lechBB.length === 0, lechBB.slice(0, 3).join(' | '));
  }

  // ═════════════════════════════════════════════════════════════════════════
  // LUOI-4 — AU4-7 (BV-AU4-L3-B3P-BO-SAN-0). Dữ liệu CỐ Ý lệch I19 (đền cũ 50.000 > total 30.000 — chỉ khi đó sàn 0 mới có tác dụng; dữ liệu
  // trước P26c còn trên production) → đặt CUỐI bài, sau mọi batBien() (B3j, B7j). Sổ append-only: không xoá dòng sau ca.
  muc('[B8] LUOI-4: kết thúc gói khi khách đã nhận (đền cũ) > total → hoàn 0, không âm');
  {
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active)
      VALUES ('GIAM320K_LUOI4', 'fixed', 320000, 0, 0, 0, 0, 1)`);
    const r = sdtMoi();
    const gr = await muaGoi(r, await taoGoi(), { items: [mon(2, 2, false)], discount_code: 'GIAM320K_LUOI4', cash_amount: 30000 });
    let lech = false, dkr = {}, rr = {}, sr = {}, truoc = NaN, sau = NaN;
    if (gr.status === 200) {
      const cpR = await goiCua(gr.order.id);
      await db.run("UPDATE pos_orders SET created_at = '2026-09-30 08:00:00' WHERE id = ?", [gr.order.id]);   // đơn + đền đều trước P26c
      await db.run(`INSERT INTO pos_damage_logs (order_id, order_code, customer_phone, product_code, product_name, quantity, unit_price, damage_value,
        reason, action, refund_amount, returned_to_stock, created_at) VALUES (?, ?, ?, ?, ?, 2, 25000, 50000, 'damaged', 'refund', 50000, 0, '2026-10-01 09:00:00')`,
      [gr.order.id, gr.order.code, r, sp[2].code, sp[2].name]);
      const { ghiVi, trongGiaoDich } = require(path.join(MAY_CHU, 'routes', 'wallets.js'));   // ví khớp sổ như đền thật (khuôn B3p)
      await trongGiaoDich((tx) => ghiVi(tx, { phone: r, loai: 'compensation', soTien: 50000, orderId: gr.order.id, ghiChu: 'Đền bù cũ trước P26c (giá gốc)',
        nguoi: 'thu', luc: '2026-10-01 09:00:00' }));
      lech = (await BAT_BIEN.I19((s) => db.query(s))).some((l) => l.includes(gr.order.code));
      truoc = await so('SELECT COUNT(*) FROM pos_balance_transactions WHERE order_id = ?', [gr.order.id]);
      dkr = await duKien(cpR);
      rr = await ketThuc(cpR, { reason: 'thử', hoan: true });
      sr = await ttGoi(cpR);
      sau = await so('SELECT COUNT(*) FROM pos_balance_transactions WHERE order_id = ?', [gr.order.id]);
    }
    k('B3r gói 300.000 + 2 CT3, mã giảm 320.000 → tổng 30.000; đền cũ 50.000 (lệch I19) → hoan-du-kien 0, kết thúc có hoàn → 200 hoan 0, ghi chú "hoàn 0đ", sổ + ví không đổi',
      Number(gr.order?.total) === 30000 && lech && dkr.data?.tong === 0 && rr.status === 200 && rr.hoan === 0 && String(sr?.notes).includes('(hoàn 0đ)')
        && sau === truoc && await vi(r) === 50000,
      `${moTa(gr)} · tổng ${gr.order?.total} · lệch I19 ${lech} · ${JSON.stringify(dkr.data)} · ${moTa(rr)} hoan ${rr.hoan} · sổ ${truoc} → ${sau} · ví ${await vi(r)}`);
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
