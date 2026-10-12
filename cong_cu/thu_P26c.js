#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ P26c — lỗ tiền / gói / kho còn lại sau P26b (4 quyết định chủ quán 12.10)
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_P26c.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến, viec/P26c/dot_bien.py).
 *
 *  Khuôn thu_P26b.js: database.js thật + libsql thật trên kho TẠM, SX tắt (bán / hoàn kho đẻ dòng nợ kho — dùng để soát C2).
 *  Công tắc co.banCauDau: câu ĐẦU trong giao dịch kế tiếp ném SQLITE_BUSY (Turso gửi BEGIN lười — ca K1b của P26b).
 *  Ba người: chủ (owner), quản lý (manager), nhân viên (staff). Chỉ so status / code / kho — không dò chữ (E12).
 *  Hai phép tĩnh đọc client/src của KHO (không theo --may-chu): D1 Settings.jsx, A6 Sales.jsx.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_p26c_'));
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
process.env.JWT_SECRET = 'thu_p26c_' + Date.now();
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_p26c';

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

  const co = { banCauDau: false };
  const txGoc = db.beginTransaction;
  db.beginTransaction = async (...a) => {
    const tx = await txGoc(...a);
    let cauDau = co.banCauDau;
    co.banCauDau = false;
    const lenh = (f) => async (...b) => {
      if (cauDau) { cauDau = false; const e = new Error('SQLITE_BUSY: database is locked (giả, câu đầu)'); e.code = 'SQLITE_BUSY'; throw e; }
      return f(...b);
    };
    return { ...tx, query: lenh(tx.query), queryOne: lenh(tx.queryOne), run: lenh(tx.run) };
  };

  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'refunds', 'wallets', 'damages', 'packages']) {
    app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  }
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();

  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const chu = await mot("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const nguoi = { chu: chu.id };
  for (const [ten, vaiTro] of [['ql_p26c', 'manager'], ['nv_p26c', 'staff']]) {
    nguoi[vaiTro] = Number((await db.run("INSERT INTO pos_users (username, password, display_name, role, is_active) VALUES (?, 'x', ?, ?, 1)",
      [ten, ten, vaiTro])).lastInsertRowid);
  }
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
  const vi = (sdt) => so('SELECT COALESCE((SELECT balance FROM pos_wallets WHERE phone = ?), 0)', [sdt]);   // chưa có ví = 0

  for (const [i, bang] of ['pos_orders', 'pos_refund_requests', 'pos_balance_transactions', 'pos_damage_logs',
    'pos_customer_packages', 'pos_stock_pending', 'pos_discount_codes', 'pos_packages'].entries()) {
    await db.run('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)', [bang, 1000 * (i + 1)]);
  }
  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 4');
  const GIA = [25000, 20000, 50000, 30000];
  for (const [i, g] of GIA.entries()) await db.run('UPDATE pos_products SET price = ? WHERE id = ?', [g, sp[i].id]);
  const mon = (i, sl = 1, tuGoi = false) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type,
    sx_product_id: sp[i].sx_product_id, quantity: sl, from_package: tuGoi });
  let soSdt = 0;
  const sdtMoi = () => '0927' + String(100000 + (++soSdt));
  const nap = async (sdt, tien) => {
    const r = await goi('POST', '/wallets/topup', { phone: sdt, amount: tien, customer_name: 'Khách P26c', payment_method: 'cash' });
    if (r.status !== 200) throw new Error('không nạp được ví: ' + moTa(r));
  };
  const taoDon = async (body) => {
    const r = await goi('POST', '/orders', { customer_name: 'Khách P26c', ...body });
    if (!r.success) throw new Error('không tạo được đơn: ' + moTa(r));
    return r.order.id;
  };
  const huy = (id, ai = 'chu') => goiAi(ai, 'PUT', `/orders/${id}/cancel`, { reason: 'thử P26c' });
  const xoa = (id) => goi('DELETE', `/orders/${id}`);
  const yeuCau = (id) => goi('POST', '/refunds', { order_id: id, reason: 'thử P26c' });
  const duyet = (id) => goi('POST', `/refunds/${id}/approve`, {});
  const baoHong = (id, body) => goi('POST', '/damages', { order_id: id, reason: 'damaged', reason_note: 'thử P26c', ...body });
  const dongHoan = (id) => so("SELECT COUNT(*) FROM pos_balance_transactions WHERE order_id = ? AND type = 'refund'", [id]);

  // Gói: cài sẵn giá / lượt; mua qua POST /orders (package_buy) như quầy; lấy qua customer_package_id.
  let soGoi = 0;
  const taoGoi = async (gia, luot) => Number((await db.run(`INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active)
    VALUES (?, 'Gói P26c', ?, 'ly', ?, 1)`, [`GOI_P26C_${++soGoi}`, gia, luot])).lastInsertRowid);
  const muaGoi = (sdt, goiId, luot, tra, them = {}) => goi('POST', '/orders', { customer_phone: sdt, customer_name: 'Khách P26c',
    items: [], package_buy: { package_id: goiId, total_qty: luot, pkg_qty: 1 }, payment_method: 'cash', cash_amount: 0, ...tra, ...them });
  const goiCua = (donId) => so('SELECT id FROM pos_customer_packages WHERE order_id = ?', [donId]);
  const lay = (sdt, cp, sl, ai = 'chu') => goiAi(ai, 'POST', '/orders', { customer_phone: sdt, customer_name: 'Khách P26c',
    items: [mon(0, sl, true)], customer_package_id: cp, payment_method: 'cash', cash_amount: 0 });
  const daGiao = (cp) => so('SELECT delivered_qty FROM pos_customer_packages WHERE id = ?', [cp]);
  // Một đơn mua gói 300.000 / 10 lượt (trả theo `tra`), rồi lấy `daLay` ly qua các đơn lấy từ gói.
  const goiDaLay = async (tra, daLay, them = {}) => {
    const sdt = sdtMoi();
    await nap(sdt, 1000000);
    const goiId = await taoGoi(300000, 10);
    const m = await muaGoi(sdt, goiId, 10, tra, them);
    if (!m.success) throw new Error('không mua được gói: ' + moTa(m));
    const cp = await goiCua(m.order.id);
    for (let con = daLay; con > 0; con -= 5) {
      const l = await lay(sdt, cp, Math.min(5, con));
      if (l.status !== 200) throw new Error('không lấy được từ gói: ' + moTa(l));
    }
    return { sdt, don: m.order.id, cp, vi0: await vi(sdt) };
  };

  console.log('\nTHỬ P26c — lỗ tiền / gói / kho còn lại');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A1] huỷ rồi xoá đơn giao từ gói → delivered_qty chỉ hoàn MỘT lần');
  {
    const g = await goiDaLay({ cash_amount: 300000 }, 3);
    const l = await lay(g.sdt, g.cp, 2);
    const h = await huy(l.order?.id);
    const sauHuy = await daGiao(g.cp);
    const x = await xoa(l.order?.id);
    k('A1a giao 5 (3 + 2), huỷ đơn 2 ly → còn 3; xoá đơn đó → vẫn 3', l.status === 200 && h.status === 200 && sauHuy === 3
      && x.status === 200 && await daGiao(g.cp) === 3, `${moTa(l)} / ${moTa(h)} · ${sauHuy} / ${moTa(x)} · ${await daGiao(g.cp)}`);
    const l2 = await lay(g.sdt, g.cp, 2);
    const x2 = await xoa(l2.order?.id);
    k('A1b (K5) xoá thẳng đơn giao từ gói còn hiệu lực → trừ đúng 2 (5 → 3)', l2.status === 200 && x2.status === 200 && await daGiao(g.cp) === 3,
      `${moTa(x2)} · ${await daGiao(g.cp)}`);
    await nap(g.sdt, 0 + 25000);
    const l3 = await goi('POST', '/orders', { customer_phone: g.sdt, items: [mon(0, 1, true), mon(0)], customer_package_id: g.cp,
      payment_method: 'balance', balance_amount: 25000 });
    const y3 = await yeuCau(l3.order?.id); const d3 = await duyet(y3.refund_id);
    const x3 = await xoa(l3.order?.id);
    k('A1c (K5) đơn giao từ gói đã duyệt hoàn → xoá vẫn trừ 1 ly (4 → 3) — duyệt hoàn không đụng gói',
      d3.status === 200 && x3.status === 200 && await daGiao(g.cp) === 3, `${moTa(d3)} / ${moTa(x3)} · ${await daGiao(g.cp)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A2] lấy quá lượt gói theo SỐ LƯỢNG; hai quầy chồng nhau');
  {
    const g = await goiDaLay({ cash_amount: 300000 }, 8);
    const a = await lay(g.sdt, g.cp, 3);
    k('A2a còn 2 lượt, lấy 3 → 400 GOI_HET_LUOT, giao vẫn 8', a.status === 400 && a.code === 'GOI_HET_LUOT' && await daGiao(g.cp) === 8,
      `${moTa(a)} · giao ${await daGiao(g.cp)}`);
    const b = await lay(g.sdt, g.cp, 1);
    k('A2b (K5) còn 2, lấy 1 → 200, giao 9', b.status === 200 && await daGiao(g.cp) === 9, `${moTa(b)} · ${await daGiao(g.cp)}`);
    const [c1, c2] = await Promise.all([lay(g.sdt, g.cp, 1), lay(g.sdt, g.cp, 1)]);
    const tot = [c1, c2].filter((r) => r.status === 200).length;
    k('A2c hai quầy cùng lấy lượt cuối → đúng một 200, giao = 10 (≤ tổng)', tot === 1 && await daGiao(g.cp) === 10,
      `${moTa(c1)} / ${moTa(c2)} · giao ${await daGiao(g.cp)}`);
    const sdt = sdtMoi();
    const goiId = await taoGoi(300000, 10);
    const m = await muaGoi(sdt, goiId, 10, { cash_amount: 300000 }, { items: [mon(0, 11, true)] });
    k('A2d mua gói 10 lượt lấy ngay 11 → 400, không tạo gói', m.status === 400
      && await so('SELECT COUNT(*) FROM pos_customer_packages WHERE customer_phone = ?', [sdt]) === 0, moTa(m));
    const m2 = await muaGoi(sdt, goiId, 10, { cash_amount: 300000 }, { items: [mon(0, 10, true)] });
    k('A2e (K5) mua gói 10 lượt lấy ngay đủ 10 → 200, giao 10', m2.status === 200 && await daGiao(await goiCua(m2.order?.id)) === 10, moTa(m2));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A3] một đơn vừa MUA gói mới vừa LẤY từ gói cũ → 400, không trừ lượt gói nào');
  {
    const g = await goiDaLay({ cash_amount: 300000 }, 2);
    const truoc = await so('SELECT COUNT(*) FROM pos_customer_packages');
    const r = await muaGoi(g.sdt, await taoGoi(300000, 10), 10, { cash_amount: 300000 },
      { items: [mon(0, 1, true)], customer_package_id: g.cp });
    k('A3 → 400 GOI_MUA_VA_LAY_CUNG_DON, gói cũ vẫn giao 2, không thêm gói', r.status === 400 && r.code === 'GOI_MUA_VA_LAY_CUNG_DON'
      && await daGiao(g.cp) === 2 && await so('SELECT COUNT(*) FROM pos_customer_packages') === truoc, `${moTa(r)} · giao ${await daGiao(g.cp)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A4] PUT /packages/customer-packages/:id/deliver đã bỏ');
  {
    const g = await goiDaLay({ cash_amount: 300000 }, 1);
    const r = await goi('PUT', `/packages/customer-packages/${g.cp}/deliver`, { delivered_qty: 1 });
    k('A4 → 404, gói không đổi', r.status === 404 && await daGiao(g.cp) === 1, `${moTa(r)} · giao ${await daGiao(g.cp)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A5] huỷ / xoá đơn mua gói (Q4 + H2 = 1B): chỉ người có quyền; hoàn giá trị còn lại, TOÀN BỘ vào ví');
  {
    const tron = { cash_amount: 200000, balance_amount: 100000 };
    const g = await goiDaLay(tron, 4);
    const tt = async () => JSON.stringify(await mot(`SELECT o.status, (SELECT status || ':' || delivered_qty FROM pos_customer_packages
      WHERE order_id = o.id) AS goi FROM pos_orders o WHERE o.id = ?`, [g.don]));
    const t0 = await tt();
    const nv = await huy(g.don, 'staff');
    k('A5a nhân viên huỷ đơn mua gói → 403, đơn / gói / ví không đổi', nv.status === 403 && await tt() === t0 && await vi(g.sdt) === g.vi0,
      `${moTa(nv)} · ${t0} → ${await tt()} · ví ${g.vi0} → ${await vi(g.sdt)}`);
    const ql = await huy(g.don, 'manager');
    k('A5b quản lý CHƯA được cấp quyền huỷ đơn mua gói → 403', ql.status === 403 && await tt() === t0, moTa(ql));
    const h = await huy(g.don);
    k('A5c owner huỷ: gói 300.000 trả ví 100.000 + tiền mặt 200.000, lấy 4/10 → ví +180.000, gói cancelled',
      h.status === 200 && await vi(g.sdt) === g.vi0 + 180000
        && (await mot('SELECT status FROM pos_customer_packages WHERE id = ?', [g.cp]))?.status === 'cancelled',
      `${moTa(h)} · ví ${g.vi0} → ${await vi(g.sdt)}`);

    const g2 = await goiDaLay({ cash_amount: 300000 }, 0);
    const h2 = await huy(g2.don);
    k('A5d chưa lấy, trả tiền mặt 300.000 → owner huỷ: ví +300.000, gói bị gỡ', h2.status === 200 && await vi(g2.sdt) === g2.vi0 + 300000
      && await so('SELECT COUNT(*) FROM pos_customer_packages WHERE id = ?', [g2.cp]) === 0, `${moTa(h2)} · ví ${g2.vi0} → ${await vi(g2.sdt)}`);

    const g3 = await goiDaLay({ balance_amount: 300000 }, 10);
    const h3 = await huy(g3.don);
    k('A5e lấy hết 10/10, trả ví 300.000 → owner huỷ: ví +0', h3.status === 200 && await vi(g3.sdt) === g3.vi0,
      `${moTa(h3)} · ví ${g3.vi0} → ${await vi(g3.sdt)}`);

    const g4 = await goiDaLay({ balance_amount: 325000 }, 4, { items: [mon(0)] });
    const h4 = await huy(g4.don);
    k('A5f gói 300.000 + món 25.000 trả ví 325.000, lấy 4 → owner huỷ: ví +205.000', h4.status === 200 && await vi(g4.sdt) === g4.vi0 + 205000,
      `${moTa(h4)} · ví ${g4.vi0} → ${await vi(g4.sdt)}`);

    const me = sdtMoi(); await nap(me, 100000);
    const g5 = await goiDaLay({ balance_amount: 200000, parent_balance_amount: 100000 }, 4, { parent_phone: me });
    const vMe = await vi(me);
    const h5 = await huy(g5.don);
    k('A5g ví mẹ 100.000 + ví con 200.000, lấy 4 → mẹ +100.000, con +80.000', h5.status === 200 && await vi(me) === vMe + 100000
      && await vi(g5.sdt) === g5.vi0 + 80000, `${moTa(h5)} · mẹ ${vMe} → ${await vi(me)} · con ${g5.vi0} → ${await vi(g5.sdt)}`);

    const g6 = await goiDaLay(tron, 4);
    const x6 = await xoa(g6.don);
    k('A5h owner xoá đơn mua gói trả ví 100.000 + tiền mặt 200.000, lấy 4 → ví +180.000, gói bị xoá', x6.status === 200
      && await vi(g6.sdt) === g6.vi0 + 180000 && await so('SELECT COUNT(*) FROM pos_customer_packages WHERE id = ?', [g6.cp]) === 0,
    `${moTa(x6)} · ví ${g6.vi0} → ${await vi(g6.sdt)}`);

    await db.run("INSERT OR REPLACE INTO pos_permissions (role, permission, allowed) VALUES ('manager', 'refund_package', 1)");
    const g7 = await goiDaLay(tron, 4);
    const h7 = await huy(g7.don, 'manager');
    k('A5i (K5) quản lý được cấp refund_package → huỷ 200, ví +180.000', h7.status === 200 && await vi(g7.sdt) === g7.vi0 + 180000,
      `${moTa(h7)} · ví ${g7.vi0} → ${await vi(g7.sdt)}`);
    await db.run("UPDATE pos_permissions SET allowed = 0 WHERE role = 'manager' AND permission = 'refund_package'");

    const g8 = await goiDaLay(tron, 4);
    const [p1, p2] = await Promise.all([huy(g8.don), xoa(g8.don)]);
    k('A5j owner huỷ chồng owner xoá cùng đơn mua gói → ví +180.000 đúng một lần', [p1, p2].some((r) => r.status === 200)
      && await vi(g8.sdt) === g8.vi0 + 180000 && await dongHoan(g8.don) <= 1, `${moTa(p1)} / ${moTa(p2)} · ví ${g8.vi0} → ${await vi(g8.sdt)}`);

    const sdt = sdtMoi(); await nap(sdt, 50000);
    const dThe = await taoDon({ customer_phone: sdt, items: [mon(0)], payment_method: 'balance', balance_amount: 25000 });
    await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
      VALUES (?, 1, 'Vàng', 25000, ?, datetime('now'), datetime('now', '+30 days'))`, [sdt, dThe]);
    const hThe = await huy(dThe, 'staff');
    const dLay = (await goiDaLay({ cash_amount: 300000 }, 0));
    const lNv = await lay(dLay.sdt, dLay.cp, 1);
    const hLay = await huy(lNv.order?.id, 'staff');
    k('A5k (K5) nhân viên huỷ đơn mua THẺ, đơn LẤY từ gói → 200, 200 (cổng chỉ bắt đơn MUA gói)', hThe.status === 200 && hLay.status === 200,
      `${moTa(hThe)} / ${moTa(hLay)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A6] số lượt gói khi mua theo gói đã cài, bỏ qua số màn hình gửi');
  {
    const sdt = sdtMoi();
    const goiId = await taoGoi(300000, 10);
    const m = await muaGoi(sdt, goiId, 100, { cash_amount: 300000 });
    const luot = await so('SELECT total_qty FROM pos_customer_packages WHERE order_id = ?', [m.order?.id]);
    k('A6a gói cài 10 lượt, màn hình gửi 100 → gói khách 10 lượt', m.status === 200 && luot === 10, `${moTa(m)} · ${luot} lượt`);
    const m2 = await muaGoi(sdt, goiId, 100, { cash_amount: 300000 }, { items: [mon(0, 11, true)] });
    k('A6b màn hình gửi 100 lượt, lấy ngay 11 (gói cài 10) → 400', m2.status === 400, moTa(m2));
    const src = fs.readFileSync(path.join(GOC, 'client', 'src', 'pages', 'Sales.jsx'), 'utf8');
    k('A6c Sales.jsx: ô số lượt gói không còn là ô nhập (không có <input … value={buyQty})', !/<input[^>]*value=\{buyQty\}/.test(src));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B1] trần "Hoàn tiền" theo số khách ĐÃ TRẢ (flash / hạng / giảm đơn)');
  {
    const sdt = sdtMoi();
    const d = await taoDon({ customer_phone: sdt, items: [mon(3)], payment_method: 'cash', cash_amount: 30000 });
    // dữ liệu như đơn bán lúc flash (orders.js:431–437): món 30.000, giá flash 25.000, tổng 25.000.
    await db.run('UPDATE pos_orders SET total = 25000, discount = 5000, discount_amount = 5000, flash_discount = 5000, cash_amount = 25000 WHERE id = ?', [d]);
    await db.run('UPDATE pos_order_items SET flash_unit_price = 25000 WHERE order_id = ?', [d]);
    const a = await baoHong(d, { product_code: sp[3].code, quantity: 1, action: 'refund', refund_amount: 25001 });
    const b = await baoHong(d, { product_code: sp[3].code, quantity: 1, action: 'refund', refund_amount: 25000 });
    k('B1a món 30.000 giá flash 25.000: đền 25.001 → 400 VUOT_GIA; 25.000 → 200, ví +25.000', a.status === 400 && a.code === 'VUOT_GIA'
      && b.status === 200 && await vi(sdt) === 25000, `${moTa(a)} / ${moTa(b)} · ví ${await vi(sdt)}`);
    const d2 = await taoDon({ customer_phone: sdt, items: [mon(0)], payment_method: 'cash', cash_amount: 25000 });
    await db.run('UPDATE pos_orders SET total = 22500, discount = 2500, discount_amount = 2500, tier_discount = 2500, cash_amount = 22500 WHERE id = ?', [d2]);
    await db.run('UPDATE pos_order_items SET tier_unit_price = 22500 WHERE order_id = ?', [d2]);
    const c = await baoHong(d2, { product_code: sp[0].code, quantity: 1, action: 'refund', refund_amount: 22501 });
    k('B1b món 25.000 giá hạng 22.500: đền 22.501 → 400 VUOT_GIA', c.status === 400 && c.code === 'VUOT_GIA', moTa(c));
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active)
      VALUES ('GIAM20K', 'fixed', 20000, 0, 0, 0, 0, 1)`);
    const r = await goi('POST', '/orders', { customer_phone: sdt, items: [mon(2), { ...mon(0), product_id: sp[0].id, quantity: 2 }],
      discount_code: 'GIAM20K', payment_method: 'cash', cash_amount: 80000 });
    const v = await vi(sdt);
    const e1 = await baoHong(r.order?.id, { product_code: sp[2].code, quantity: 1, action: 'refund', refund_amount: 40001 });
    const e2 = await baoHong(r.order?.id, { product_code: sp[2].code, quantity: 1, action: 'refund', refund_amount: 40000 });
    const e3 = await baoHong(r.order?.id, { product_code: sp[0].code, quantity: 2, action: 'refund', refund_amount: 40001 });
    const e4 = await baoHong(r.order?.id, { product_code: sp[0].code, quantity: 2, action: 'refund', refund_amount: 40000 });
    k('B1c đơn 2 dòng 50.000 + 2×25.000 giảm đơn 20.000 (trả 80.000): mỗi dòng trần 40.000 — 40.001 → 400, 40.000 → 200; tổng ví +80.000',
      r.status === 200 && e1.status === 400 && e1.code === 'VUOT_GIA' && e2.status === 200 && e3.status === 400 && e4.status === 200
        && await vi(sdt) === v + 80000, `${moTa(r)} · ${[e1, e2, e3, e4].map(moTa).join(' / ')} · ví ${v} → ${await vi(sdt)}`);
    const d4 = await taoDon({ customer_phone: sdt, items: [mon(1, 2)], payment_method: 'cash', cash_amount: 40000 });
    const v4 = await vi(sdt);
    const f = await baoHong(d4, { product_code: sp[1].code, quantity: 2, action: 'refund', refund_amount: 40000 });
    k('B1d (K5) đơn không giảm: đền đúng giá 2 × 20.000 → 200, ví +40.000', f.status === 200 && await vi(sdt) === v4 + 40000, moTa(f));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B2] "Hoàn tiền" phải có số > 0 (Q3); "Chỉ ghi nhận" vẫn ghi được');
  {
    const sdt = sdtMoi();
    const d = await taoDon({ customer_phone: sdt, items: [mon(0, 3)], payment_method: 'cash', cash_amount: 75000 });
    const a = await baoHong(d, { product_code: sp[0].code, quantity: 1, action: 'refund', refund_amount: 0 });
    const b = await baoHong(d, { product_code: sp[0].code, quantity: 1, action: 'refund' });
    k('B2a hoàn tiền số 0 / trống → 400, 400, ví không đổi, không thêm log', a.status === 400 && b.status === 400 && await vi(sdt) === 0
      && await so('SELECT COUNT(*) FROM pos_damage_logs WHERE order_id = ?', [d]) === 0, `${moTa(a)} / ${moTa(b)} · ví ${await vi(sdt)}`);
    const c = await baoHong(d, { product_code: sp[0].code, quantity: 1, action: 'none' });
    k('B2b (K5) chỉ ghi nhận → 200', c.status === 200, moTa(c));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B3] "Hoàn kho SX" trên đơn đã huỷ → chặn (huỷ đã hoàn kho)');
  {
    const d = await taoDon({ items: [mon(1, 2)], payment_method: 'cash', cash_amount: 40000 });
    await huy(d);
    const no = await so("SELECT COUNT(*) FROM pos_stock_pending WHERE order_id = ? AND direction = 'in'", [d]);
    const a = await baoHong(d, { product_code: sp[1].code, quantity: 1, action: 'return_stock', return_to_stock: true });
    k('B3a đơn đã huỷ → hoàn kho SX 400 DON_DA_HUY_KHO, không thêm log', a.status === 400 && a.code === 'DON_DA_HUY_KHO'
      && await so('SELECT COUNT(*) FROM pos_damage_logs WHERE order_id = ?', [d]) === 0
      && await so("SELECT COUNT(*) FROM pos_stock_pending WHERE order_id = ? AND direction = 'in'", [d]) === no, moTa(a));
    const b = await baoHong(d, { product_code: sp[1].code, quantity: 1, action: 'none' });
    k('B3b (K5) đơn đã huỷ → chỉ ghi nhận 200', b.status === 200, moTa(b));
    const d2 = await taoDon({ items: [mon(1)], payment_method: 'cash', cash_amount: 20000 });
    const c = await baoHong(d2, { product_code: sp[1].code, quantity: 1, action: 'return_stock', return_to_stock: true });
    k('B3c (K5) đơn còn hiệu lực → hoàn kho SX 200', c.status === 200, moTa(c));
    const sdt = sdtMoi(); await nap(sdt, 20000);
    const d3 = await taoDon({ customer_phone: sdt, items: [mon(1)], payment_method: 'balance', balance_amount: 20000 });
    await duyet((await yeuCau(d3)).refund_id);
    const e = await baoHong(d3, { product_code: sp[1].code, quantity: 1, action: 'return_stock', return_to_stock: true });
    k('B3d (K5) đơn đã duyệt hoàn (không trả kho) → hoàn kho SX 200', e.status === 200, moTa(e));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B4] "Hoàn tiền" trên đơn CHƯA THU → chặn (H3 = 2A)');
  {
    const sdt = sdtMoi();
    const d = await taoDon({ customer_phone: sdt, items: [mon(0, 2)], payment_method: 'debt', debt_amount: 50000 });
    const a = await baoHong(d, { product_code: sp[0].code, quantity: 1, action: 'refund', refund_amount: 10000 });
    k('B4a đơn ghi nợ 50.000 → hoàn tiền 10.000 400 DON_CHUA_THU, ví không đổi', a.status === 400 && a.code === 'DON_CHUA_THU' && await vi(sdt) === 0,
      `${moTa(a)} · ví ${await vi(sdt)}`);
    const b = await baoHong(d, { product_code: sp[0].code, quantity: 1, action: 'none' });
    k('B4b (K5) đơn nợ → chỉ ghi nhận 200', b.status === 200, moTa(b));
    const d2 = await taoDon({ customer_phone: sdt, items: [mon(0)], payment_method: 'debt', debt_amount: 25000 });
    const t = await goi('POST', `/orders/${d2}/pay-debt`, { payment_method: 'cash', amount: 25000 });
    const v = await vi(sdt);
    const c = await baoHong(d2, { product_code: sp[0].code, quantity: 1, action: 'refund', refund_amount: 10000 });
    k('B4c (K5) thu nợ đủ rồi hoàn tiền 10.000 → 200, ví +10.000', t.status === 200 && c.status === 200 && await vi(sdt) === v + 10000,
      `${moTa(t)} / ${moTa(c)} · ví ${v} → ${await vi(sdt)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[B5] đã đền rồi huỷ / xoá / duyệt hoàn → khoản hoàn ví trừ số đã đền (H4 = 3A)');
  {
    const ca = async (lam) => {
      const sdt = sdtMoi(); await nap(sdt, 50000);
      const d = await taoDon({ customer_phone: sdt, items: [mon(0, 2)], payment_method: 'balance', balance_amount: 50000 });
      const r = await baoHong(d, { product_code: sp[0].code, quantity: 1, action: 'refund', refund_amount: 10000 });
      const v = await vi(sdt);
      const kq = await lam(d);
      return { sdt, d, r, v, kq, sau: await vi(sdt) };
    };
    const h = await ca((d) => huy(d));
    k('B5a đơn ví 50.000, đã đền 10.000 → huỷ: ví +40.000', h.r.status === 200 && h.kq.status === 200 && h.sau === h.v + 40000,
      `${moTa(h.kq)} · ví ${h.v} → ${h.sau}`);
    const x = await ca((d) => xoa(d));
    k('B5b … → xoá: ví +40.000', x.kq.status === 200 && x.sau === x.v + 40000, `${moTa(x.kq)} · ví ${x.v} → ${x.sau}`);
    const y = await ca(async (d) => duyet((await yeuCau(d)).refund_id));
    const yc = await mot("SELECT refund_amount FROM pos_refund_requests WHERE order_id = ? AND status = 'approved'", [y.d]);
    k('B5c … → duyệt hoàn: ví +40.000, yêu cầu ghi 40.000', y.kq.status === 200 && y.sau === y.v + 40000 && Number(yc?.refund_amount) === 40000,
      `${moTa(y.kq)} · ví ${y.v} → ${y.sau} · yêu cầu ${yc?.refund_amount}`);
    const sdt = sdtMoi();
    const d = await taoDon({ customer_phone: sdt, items: [mon(0, 2)], payment_method: 'cash', cash_amount: 50000 });
    await baoHong(d, { product_code: sp[0].code, quantity: 1, action: 'refund', refund_amount: 10000 });
    const v = await vi(sdt); const hh = await huy(d);
    k('B5d (K5) đơn tiền mặt đã đền 10.000 → huỷ 200, ví không đổi (không âm)', hh.status === 200 && await vi(sdt) === v, `${moTa(hh)} · ví ${v} → ${await vi(sdt)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C1] thu nợ đơn đã hoàn → chặn');
  {
    const sdt = sdtMoi(); await nap(sdt, 10000);
    const d = await taoDon({ customer_phone: sdt, items: [mon(0)], payment_method: 'debt', balance_amount: 10000, debt_amount: 15000 });
    await duyet((await yeuCau(d)).refund_id);
    const r = await goi('POST', `/orders/${d}/pay-debt`, { payment_method: 'cash', amount: 15000 });
    const o = await mot('SELECT status, debt_amount, cash_amount FROM pos_orders WHERE id = ?', [d]);
    k('C1a đơn nợ đã duyệt hoàn → thu nợ 400, đơn không đổi', r.status === 400 && Number(o.debt_amount) === 15000 && Number(o.cash_amount) === 0,
      `${moTa(r)} · ${JSON.stringify(o)}`);
    const d2 = await taoDon({ customer_phone: sdt, items: [mon(0)], payment_method: 'debt', debt_amount: 25000 });
    const r2 = await goi('POST', `/orders/${d2}/pay-debt`, { payment_method: 'cash', amount: 25000 });
    k('C1b (K5) thu nợ đơn completed → 200', r2.status === 200, moTa(r2));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C2] xoá đơn: không còn mã bill mồ côi; nợ kho out chưa tới SX thành huy, không gửi in');
  {
    const d = await taoDon({ items: [mon(1)], payment_method: 'cash', cash_amount: 20000 });
    await db.run("INSERT INTO pos_signup_codes (code, order_id, issued_at) VALUES ('MB_CHUA_DUNG', ?, datetime('now'))", [d]);
    const outTruoc = await so("SELECT COUNT(*) FROM pos_stock_pending WHERE order_id = ? AND direction = 'out' AND status = 'pending'", [d]);
    const x = await xoa(d);
    const conMa = await so("SELECT COUNT(*) FROM pos_signup_codes WHERE code = 'MB_CHUA_DUNG'");
    k('C2a xoá đơn có mã bill CHƯA dùng → mã bị xoá', x.status === 200 && conMa === 0, `${moTa(x)} · còn ${conMa}`);
    const cho = await so("SELECT COUNT(*) FROM pos_stock_pending WHERE order_id = ? AND status IN ('pending', 'can_xem')", [d]);
    const huyNo = await so("SELECT COUNT(*) FROM pos_stock_pending WHERE order_id = ? AND direction = 'out' AND status = 'huy'", [d]);
    k('C2b bán lúc SX lỗi (nợ out) rồi xoá → nợ out thành huy, không thêm nợ in, không còn nợ chờ đẩy', outTruoc === 1 && huyNo === 1 && cho === 0,
      `nợ out trước ${outTruoc} · huy ${huyNo} · còn chờ ${cho}`);
    const d2 = await taoDon({ items: [mon(1)], payment_method: 'cash', cash_amount: 20000 });
    await db.run("INSERT INTO pos_signup_codes (code, order_id, issued_at, claimed_at, claimed_phone) VALUES ('MB_DA_DUNG', ?, datetime('now'), datetime('now'), '0900000099')", [d2]);
    await xoa(d2);
    k('C2c (K5, H5) mã bill ĐÃ dùng giữ làm vết', await so("SELECT COUNT(*) FROM pos_signup_codes WHERE code = 'MB_DA_DUNG'") === 1);
    const d3 = await taoDon({ items: [mon(1)], payment_method: 'cash', cash_amount: 20000 });
    await db.run("UPDATE pos_stock_pending SET status = 'resolved' WHERE order_id = ? AND direction = 'out'", [d3]);   // out đã tới SX
    await huy(d3);   // SX tắt → nợ in chờ
    await xoa(d3);
    k('C2d (K5, H6) đơn huỷ (out đã tới SX, in còn nợ) rồi xoá → nợ in VẪN chờ đẩy',
      await so("SELECT COUNT(*) FROM pos_stock_pending WHERE order_id = ? AND direction = 'in' AND status = 'pending'", [d3]) === 1);
    const d4 = await taoDon({ items: [mon(1)], payment_method: 'cash', cash_amount: 20000 });
    await huy(d4);   // SX tắt: out lúc bán VÀ in lúc huỷ đều nợ — hàng chưa từng ra khỏi SX
    await xoa(d4);
    k('C2e bán + huỷ lúc SX lỗi rồi xoá → nợ out VÀ nợ in cùng món thành huy, không còn nợ chờ đẩy (K4: đường huỷ-rồi-xoá)',
      await so("SELECT COUNT(*) FROM pos_stock_pending WHERE order_id = ? AND status = 'huy'", [d4]) === 2
        && await so("SELECT COUNT(*) FROM pos_stock_pending WHERE order_id = ? AND status IN ('pending', 'can_xem')", [d4]) === 0);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C3 + C4] duyệt hoàn giảm total_spent (con + mẹ); thông báo có tổng hoàn');
  {
    const me = sdtMoi(), con = sdtMoi(); await nap(me, 20000); await nap(con, 5000);
    const d = await taoDon({ customer_phone: con, parent_phone: me, items: [mon(0)], payment_method: 'cash', cash_amount: 0,
      balance_amount: 5000, parent_balance_amount: 20000 });
    const tieu = (s) => so('SELECT total_spent FROM pos_wallets WHERE phone = ?', [s]);
    const tCon = await tieu(con), tMe = await tieu(me);
    const r = await duyet((await yeuCau(d)).refund_id);
    k('C3 duyệt hoàn 5.000 con + 20.000 mẹ → total_spent con −5.000, mẹ −20.000', r.status === 200 && await tieu(con) === tCon - 5000
      && await tieu(me) === tMe - 20000, `${moTa(r)} · con ${tCon} → ${await tieu(con)} · mẹ ${tMe} → ${await tieu(me)}`);
    k('C4 phản hồi duyệt có tong_hoan = 25.000', Number(r.tong_hoan) === 25000, JSON.stringify(r));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C5] xoá đơn mua thẻ → gỡ dòng mua thẻ');
  {
    const sdt = sdtMoi();
    const d = await taoDon({ customer_phone: sdt, items: [mon(0)], payment_method: 'cash', cash_amount: 25000 });
    await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
      VALUES (?, 1, 'Vàng', 25000, ?, datetime('now'), datetime('now', '+30 days'))`, [sdt, d]);
    const x = await xoa(d);
    k('C5 xoá đơn mua thẻ → 200, 0 dòng pos_membership_purchases', x.status === 200
      && await so('SELECT COUNT(*) FROM pos_membership_purchases WHERE order_id = ?', [d]) === 0, moTa(x));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D1] màn thêm quà gửi "Giảm tối đa" (max_discount)');
  {
    const src = fs.readFileSync(path.join(GOC, 'client', 'src', 'pages', 'Settings.jsx'), 'utf8');
    const than = (src.match(/const addReward = async[\s\S]*?\n  };/) || [''])[0];
    k('D1 Settings.jsx addReward gửi max_discount', /max_discount\s*:/.test(than), than ? '' : 'không thấy addReward');
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D2 + D3 + D4] mã giảm giá: trả lượt khi huỷ / xoá / duyệt hoàn; chỉ lưu mã khi áp; voucher used');
  {
    const ma = async (code) => {
      await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active)
        VALUES (?, 'fixed', 5000, 0, 0, 1, 0, 1)`, [code]);
    };
    const dung = (code, sdt) => goi('POST', '/orders', { customer_phone: sdt, items: [mon(0)], discount_code: code,
      payment_method: 'balance', balance_amount: 20000 });
    const sdt = sdtMoi(); await nap(sdt, 500000);
    const daDung = (code) => so('SELECT used_count FROM pos_discount_codes WHERE code = ?', [code]);
    for (const [i, [ten, lam]] of [['huỷ', (id) => huy(id)], ['xoá', (id) => xoa(id)], ['duyệt hoàn', async (id) => duyet((await yeuCau(id)).refund_id)]].entries()) {
      const code = 'MA1L_' + i;
      await ma(code);
      const a = await dung(code, sdt);
      const r = await lam(a.order?.id);
      const b = await dung(code, sdt);
      k(`D2 mã 1 lượt dùng → ${ten} đơn → used_count 0, dùng lại được (đơn mới giảm 5.000)`, a.status === 200 && r.status === 200
        && b.status === 200 && Number(b.order?.discount_amount) === 5000 && await daDung(code) === 1,
      `${moTa(a)} / ${moTa(r)} / ${moTa(b)} · giảm ${b.order?.discount_amount} · đã dùng ${await daDung(code)}`);
    }
    await ma('MA_CU');
    const c = await dung('MA_CU', sdt);
    await db.run("UPDATE pos_orders SET discount_type = NULL, discount_value = 0 WHERE id = ?", [c.order?.id]);   // đơn cũ: mã lưu mà không áp
    await huy(c.order?.id);
    k('D2b (K5 dữ liệu cũ) đơn lưu mã mà loại / trị giá không khớp mã → huỷ KHÔNG trả lượt', await daDung('MA_CU') === 1, `đã dùng ${await daDung('MA_CU')}`);

    await db.run("INSERT INTO pos_discount_codes (code, discount_type, discount_value, usage_limit, used_count, valid_to, is_active) VALUES ('MA_HET_HAN', 'fixed', 5000, 1, 0, '2000-01-01', 1)");
    const e = await goi('POST', '/orders', { customer_phone: sdt, items: [mon(0)], discount_code: 'MA_HET_HAN', payment_method: 'balance', balance_amount: 25000 });
    const luu = await mot('SELECT discount_code FROM pos_orders WHERE id = ?', [e.order?.id]);
    k('D3 gõ mã hết hạn → đơn 200, discount_code NULL', e.status === 200 && luu && luu.discount_code === null, `${moTa(e)} · ${JSON.stringify(luu)}`);

    await ma('VC_DIEM');
    await db.run("INSERT INTO pos_voucher_grants (code, customer_phone, status) VALUES ('VC_DIEM', ?, 'available')", [sdt]);
    const f = await dung('VC_DIEM', sdt);
    const g1 = await mot("SELECT status, used_order_id FROM pos_voucher_grants WHERE code = 'VC_DIEM'");
    k('D4 dùng voucher đổi điểm → grant used, used_order_id = đơn', f.status === 200 && g1?.status === 'used' && Number(g1.used_order_id) === f.order?.id,
      JSON.stringify(g1));
    await huy(f.order?.id);
    const g2 = await mot("SELECT status, used_order_id FROM pos_voucher_grants WHERE code = 'VC_DIEM'");
    k('D2c huỷ đơn dùng voucher → grant về available', g2?.status === 'available' && g2.used_order_id == null, JSON.stringify(g2));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D5] hạng thẻ mặc định: chỉ Vàng, Bạch Kim');
  {
    const ds = (await db.query('SELECT name FROM pos_membership_tiers ORDER BY sort_order')).map((r) => r.name);
    k('D5 kho mới khởi tạo → hạng = Vàng, Bạch Kim', JSON.stringify(ds) === JSON.stringify(['Vàng', 'Bạch Kim']), JSON.stringify(ds));
    const quyen = await db.query("SELECT role, allowed FROM pos_permissions WHERE permission = 'refund_package' ORDER BY role");
    k('Q4 quyền refund_package có trên kho mới: owner 1, manager 0, staff 0',
      JSON.stringify(quyen.map((r) => r.role + ':' + r.allowed)) === JSON.stringify(['manager:0', 'owner:1', 'staff:0']), JSON.stringify(quyen));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[K1b] kho bận ở câu đầu (Turso) trên các nhánh mới → 409 KHO_BAN, kho không đổi');
  {
    const chup = async () => JSON.stringify(await mot(`SELECT (SELECT COUNT(*) FROM pos_orders) AS don, (SELECT GROUP_CONCAT(status) FROM pos_orders) AS tt,
      (SELECT COUNT(*) FROM pos_balance_transactions) AS so, (SELECT COALESCE(SUM(balance), 0) FROM pos_wallets) AS vi,
      (SELECT GROUP_CONCAT(status || delivered_qty) FROM pos_customer_packages) AS goi, (SELECT COUNT(*) FROM pos_damage_logs) AS hong,
      (SELECT GROUP_CONCAT(status) FROM pos_stock_pending) AS no_kho, (SELECT SUM(used_count) FROM pos_discount_codes) AS ma`));
    const g = await goiDaLay({ cash_amount: 200000, balance_amount: 100000 }, 4);
    const g2 = await goiDaLay({ cash_amount: 300000 }, 1);
    const LENH = [
      ['huỷ đơn mua gói', () => huy(g.don)],
      ['xoá đơn mua gói', () => xoa(g.don)],
      ['lấy từ gói', () => lay(g2.sdt, g2.cp, 1)],
    ];
    for (const [ten, lam] of LENH) {
      const truoc = await chup();
      co.banCauDau = true;
      const r = await lam();
      co.banCauDau = false;
      const sau = await chup();
      k(`K1b ${ten}: BUSY ở câu đầu → 409 KHO_BAN, kho không đổi`, r.status === 409 && r.code === 'KHO_BAN' && sau === truoc,
        `${moTa(r)}${sau !== truoc ? ' · kho đổi' : ''}`);
    }
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
