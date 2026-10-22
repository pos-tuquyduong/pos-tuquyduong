#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ P26c — lỗ tiền / gói / kho còn lại sau P26b (4 quyết định chủ quán 12.10)
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_P26c.js [--may-chu <thư mục server>] [--client <thư mục client>]
 *  --may-chu / --client: chạy trên bản sao server/ / client/ (đột biến, viec/P26c/dot_bien.py).
 *
 *  Khuôn thu_P26b.js: database.js thật + libsql thật trên kho TẠM. SX GIẢ (thay utils/sxApi.js trước khi nạp route), ba chế độ
 *  `sx.che`: 'loi' (mặc định — báo lỗi, KHÔNG làm; bán / huỷ / xoá đẻ dòng nợ kho), 'song' (làm), 'het_gio' (LÀM rồi mới báo lỗi —
 *  quá 8 s, sxApi.js:41-61). Như SX thật, SX giả bỏ lệnh TRÙNG vân tay (sxApi.js:155-157); `sx.daLam` giữ +sl / −sl theo vân tay.
 *  Soát vòng 1 lỗi 1 + vòng 2 lỗi 1: SX tắt hẳn chỉ phủ nhánh "chưa tới SX" — ca C2 đo SX RÒNG = 0 sau khi đẩy sổ nợ.
 *  Công tắc co.banCauDau: câu ĐẦU trong giao dịch kế tiếp ném SQLITE_BUSY (Turso gửi BEGIN lười — ca K1b của P26b).
 *  Ba người: chủ (owner), quản lý (manager), nhân viên (staff). Chỉ so status / code / kho — không dò chữ (E12).
 *  Hai phép tĩnh đọc <client>/src/pages (mặc định client/ của kho): D1 Settings.jsx, A6 Sales.jsx.
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

  const sx = { che: 'loi', daLam: new Map() };
  const duongSX = require.resolve(path.join(MAY_CHU, 'utils', 'sxApi.js'));
  const sxThat = require(duongSX);
  const sxGia = (chieu) => async (loai, id, sl, ma, vt) => {
    if (sx.che === 'loi') throw new Error('SX lỗi (giả)');
    if (vt && !sx.daLam.has(vt)) sx.daLam.set(vt, chieu === 'in' ? Number(sl) : -Number(sl));   // trùng vân tay → SX bỏ qua
    if (sx.che === 'het_gio') throw new Error('SX không phản hồi (giả — đã làm)');
    return { ok: true };
  };
  require.cache[duongSX].exports = { ...sxThat, isSxConfigured: () => true, checkStock: async () => ({ sufficient: true, stock: 999 }),
    outStockFIFO: sxGia('out'), inStockReturn: sxGia('in'),
    callSxApi: async () => { if (sx.che === 'loi') throw new Error('SX lỗi (giả)'); return { ok: true }; } };

  // P26d: co.mocTruocTx — chạy TRỌN một lệnh khác trước khi giao dịch kế tiếp mở (khuôn thu_P20 — chồng nhau TẤT ĐỊNH), tự gỡ;
  //       co.nemGhi — câu ghi khớp mẫu (cả `db.run` lẫn `tx.run`, để gốc và bản vá cùng gặp) ném lỗi KHÔNG bận, kèm chuỗi lạ BI_MAT;
  //       co.banDoc — `db.query` (ngoài giao dịch) khớp mẫu ném SQLITE_BUSY một lần (không khớp câu của authenticate).
  const BI_MAT = 'P26D_CHUOI_NOI_BO';
  const co = { banCauDau: false, mocTruocTx: null, nemGhi: null, banDoc: null };
  const loiGiaGhi = (sql) => {
    if (co.nemGhi && co.nemGhi.test(String(sql))) { const e = new Error(`SQLITE_IOERR: ${BI_MAT} (giả)`); e.code = 'SQLITE_IOERR'; throw e; }
  };
  const txGoc = db.beginTransaction, runGoc = db.run, queryGoc = db.query;
  db.beginTransaction = async (...a) => {
    const moc = co.mocTruocTx; co.mocTruocTx = null;
    if (moc) await moc();
    const tx = await txGoc(...a);
    let cauDau = co.banCauDau;
    co.banCauDau = false;
    const lenh = (f) => async (...b) => {
      if (cauDau) { cauDau = false; const e = new Error('SQLITE_BUSY: database is locked (giả, câu đầu)'); e.code = 'SQLITE_BUSY'; throw e; }
      loiGiaGhi(b[0]);
      return f(...b);
    };
    return { ...tx, query: lenh(tx.query), queryOne: lenh(tx.queryOne), run: lenh(tx.run) };
  };
  db.run = async (sql, a) => { loiGiaGhi(sql); return runGoc(sql, a); };
  db.query = async (sql, a) => {
    if (co.banDoc && co.banDoc.test(String(sql))) { co.banDoc = null; const e = new Error('SQLITE_BUSY: database is locked (giả, đọc)'); e.code = 'SQLITE_BUSY'; throw e; }
    return queryGoc(sql, a);
  };

  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'refunds', 'wallets', 'damages', 'packages', 'rewards', 'loyalty', 'signup-codes', 'auth']) {
    app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  }
  app.use('/api/pos/v2/customers', require(path.join(MAY_CHU, 'routes', 'customers-v2.js')));   // LUOI-5 (X1): chiết khấu riêng của khách
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
  const tongHoan = (id) => so("SELECT COALESCE(SUM(amount), 0) FROM pos_balance_transactions WHERE order_id = ? AND type = 'refund'", [id]);

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
    // Sales.jsx:744 gửi gói cũ đang bật cả khi không lấy món nào từ nó (khách gia hạn) — soát vòng 1 lỗi 7.
    const r2 = await muaGoi(g.sdt, await taoGoi(300000, 10), 10, { cash_amount: 300000 }, { customer_package_id: g.cp });
    k('A3b (K5) gia hạn: bật gói cũ, KHÔNG lấy món nào, mua gói mới → 200, gói cũ vẫn giao 2, có gói mới', r2.status === 200
      && await daGiao(g.cp) === 2 && await so('SELECT COUNT(*) FROM pos_customer_packages') === truoc + 1, moTa(r2));
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
    const dongSo = JSON.stringify(await db.query("SELECT payment_method AS cach, amount FROM pos_balance_transactions WHERE order_id = ? AND type = 'refund' ORDER BY id", [g.don]));
    const tieu = (sdt) => so('SELECT total_spent FROM pos_wallets WHERE phone = ?', [sdt]);
    k('A5c2 sổ: 100.000 phần ví (cash) + 80.000 phần tiền mặt (hoan_goi); total_spent về 0 (mua 100.000 − hoàn 100.000), không âm',
      dongSo === JSON.stringify([{ cach: 'cash', amount: 100000 }, { cach: 'hoan_goi', amount: 80000 }]) && await tieu(g.sdt) === 0,
      `${dongSo} · total_spent ${await tieu(g.sdt)}`);

    const g2 = await goiDaLay({ cash_amount: 300000 }, 0);
    const h2 = await huy(g2.don);
    k('A5d chưa lấy, trả tiền mặt 300.000 → owner huỷ: ví +300.000, gói bị gỡ', h2.status === 200 && await vi(g2.sdt) === g2.vi0 + 300000
      && await so('SELECT COUNT(*) FROM pos_customer_packages WHERE id = ?', [g2.cp]) === 0 && await tieu(g2.sdt) === 0,
    `${moTa(h2)} · ví ${g2.vi0} → ${await vi(g2.sdt)} · total_spent ${await tieu(g2.sdt)} (đơn trả tiền mặt → không đổi)`);

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
      && await vi(g8.sdt) === g8.vi0 + 180000 && await tongHoan(g8.don) === 180000,
    `${moTa(p1)} / ${moTa(p2)} · ví ${g8.vi0} → ${await vi(g8.sdt)} · tổng hoàn ${await tongHoan(g8.don)}`);

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
    const src = fs.readFileSync(path.join(CLIENT, 'src', 'pages', 'Sales.jsx'), 'utf8');
    k('A6c Sales.jsx: ô số lượt gói không còn là ô nhập (không có <input … value={buyQty})', !/<input[^>]*value=\{buyQty\}/.test(src));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A7] gói phải có ít nhất 1 lượt (Câu hỏi 3, chủ quán chốt 12.10)');
  {
    const tao = (luot) => goi('POST', '/packages', { code: 'GOI_A7_' + (luot ?? 'X'), name: 'Gói A7', price: 100000, unit: 'ly',
      ...(luot === undefined ? {} : { total_qty: luot }) });
    const [r0, rx, r1] = [await tao(0), await tao(undefined), await tao(1)];
    k('A7a thêm gói 0 lượt / không gửi số lượt → 400 GOI_LUOT_KHONG_HOP_LE, 400; 1 lượt → 200', r0.status === 400 && r0.code === 'GOI_LUOT_KHONG_HOP_LE'
      && rx.status === 400 && rx.code === 'GOI_LUOT_KHONG_HOP_LE' && r1.status === 200, `${moTa(r0)} / ${moTa(rx)} / ${moTa(r1)}`);
    const id0 = await taoGoi(100000, 0);   // dữ liệu cũ: gói 0 lượt có sẵn trong kho
    const s0 = await goi('PUT', `/packages/${id0}`, { total_qty: 0, name: 'Gói cũ' });
    const s5 = await goi('PUT', `/packages/${id0}`, { total_qty: 5, name: 'Gói cũ' });
    const bat = await goi('PUT', `/packages/${await taoGoi(100000, 0)}`, { is_active: 0 });
    k('A7b sửa gói về 0 lượt → 400; sửa lên 5 lượt → 200, lưu 5; (K5) bật / tắt gói cũ 0 lượt (không gửi số lượt) → 200',
      s0.status === 400 && s0.code === 'GOI_LUOT_KHONG_HOP_LE' && s5.status === 200
        && await so('SELECT total_qty FROM pos_packages WHERE id = ?', [id0]) === 5 && bat.status === 200, `${moTa(s0)} / ${moTa(s5)} / ${moTa(bat)}`);
    const src = fs.readFileSync(path.join(CLIENT, 'src', 'pages', 'Settings.jsx'), 'utf8');
    const luu = (src.match(/const savePkg = async[\s\S]*?setSaving\(true\)/) || [''])[0];
    k('A7c Settings.jsx savePkg chặn Tổng SL SP < 1 TRƯỚC khi gửi (điều kiện + return)',
      /if \(!\(parseInt\(pkgForm\.total_qty\) >= 1\)\) \{[^}]*return; \}/.test(luu), luu ? '' : 'không thấy savePkg');
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
    // Soát vòng 1 lỗi 2: "Hoàn tiền" trên DÒNG GÓI = hoàn gói mà gói vẫn dùng được, không qua quyền Q4.
    const g = await goiDaLay({ cash_amount: 300000 }, 0);
    const ma = (await mot('SELECT code FROM pos_packages WHERE id = (SELECT package_id FROM pos_customer_packages WHERE id = ?)', [g.cp])).code;
    const e = await baoHong(g.don, { product_code: ma, quantity: 1, action: 'refund', refund_amount: 300000 });
    k('B1e hoàn tiền sự cố trên dòng GÓI của đơn mua gói → 400 GOI_THE_KHONG_DEN, ví không đổi', e.status === 400 && e.code === 'GOI_THE_KHONG_DEN'
      && await vi(g.sdt) === g.vi0, `${moTa(e)} · ví ${g.vi0} → ${await vi(g.sdt)}`);
    // Câu hỏi 2 (chủ quán chốt 12.10): mã giảm 1 MÓN — món A 50.000 (giảm 25.000 qua mã nhóm) + B 30.000, khách trả 55.000.
    // Không biết dòng nào được giảm → mọi dòng "đã trả = giá dòng − toàn bộ giảm": trần A 25.000 (chia đều thì 34.375 — đền quá).
    await db.run("INSERT INTO pos_product_groups (id, code, name) VALUES (77, 'NHOM_P26C', 'Nhóm thử P26c')");
    await db.run('INSERT INTO pos_product_group_members (group_id, sx_product_type, sx_product_id) VALUES (77, ?, ?)', [sp[2].sx_product_type, sp[2].sx_product_id]);
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active,
      discount_scope, applicable_group_id) VALUES ('GIAM1MON', 'fixed', 25000, 0, 0, 0, 0, 1, 'item', 77)`);
    const m1 = await goi('POST', '/orders', { customer_phone: sdt, items: [mon(2), mon(3)], discount_code: 'GIAM1MON', payment_method: 'cash', cash_amount: 55000 });
    const v1 = await vi(sdt);
    const f1 = await baoHong(m1.order?.id, { product_code: sp[2].code, quantity: 1, action: 'refund', refund_amount: 25001 });
    const f2 = await baoHong(m1.order?.id, { product_code: sp[2].code, quantity: 1, action: 'refund', refund_amount: 25000 });
    k('B1f đơn mã giảm 1 món (A 50.000 − 25.000 + B 30.000, trả 55.000): đền A 25.001 → 400 VUOT_GIA; 25.000 → 200, ví +25.000',
      m1.status === 200 && Number(m1.order?.total) === 55000 && f1.status === 400 && f1.code === 'VUOT_GIA' && f2.status === 200 && await vi(sdt) === v1 + 25000,
      `${moTa(m1)} · tổng ${m1.order?.total} · ${moTa(f1)} / ${moTa(f2)} · ví ${v1} → ${await vi(sdt)}`);
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
    // LUOI-5 (AU4-21 damages-03) — hoàn kho SX THÀNH CÔNG phải đánh dấu returned_to_stock = 1 (cột total_returned của báo cáo hỏng hàng, damages.js); SX lỗi (B3c) thì 0.
    // `sx.che = 'song'` chỉ bật quanh lệnh báo hỏng, try/finally trả 'loi' — ném giữa chừng không kẹt SX giả cho các khối sau.
    const d4 = await taoDon({ items: [mon(1)], payment_method: 'cash', cash_amount: 20000 });
    let f4;
    try { sx.che = 'song'; f4 = await baoHong(d4, { product_code: sp[1].code, quantity: 1, action: 'return_stock', return_to_stock: true }); } finally { sx.che = 'loi'; }
    const traKho = (id) => so('SELECT returned_to_stock FROM pos_damage_logs WHERE order_id = ?', [id]);
    k('B3e SX làm được → hoàn kho 200, log returned_to_stock = 1; B3c (SX lỗi) log vẫn 0', f4.status === 200 && await traKho(d4) === 1 && await traKho(d2) === 0,
      `${moTa(f4)} · d4 ${await traKho(d4)} · d2 ${await traKho(d2)}`);
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
  muc('[C2] xoá đơn: không còn mã bill mồ côi; kho SX RÒNG = 0 trong mọi trường hợp (Câu hỏi 4 = a)');
  {
    const d = await taoDon({ items: [mon(1)], payment_method: 'cash', cash_amount: 20000 });
    await db.run("INSERT INTO pos_signup_codes (code, order_id, issued_at) VALUES ('MB_CHUA_DUNG', ?, datetime('now'))", [d]);
    const x = await xoa(d);
    const conMa = await so("SELECT COUNT(*) FROM pos_signup_codes WHERE code = 'MB_CHUA_DUNG'");
    k('C2a xoá đơn có mã bill CHƯA dùng → mã bị xoá', x.status === 200 && conMa === 0, `${moTa(x)} · còn ${conMa}`);
    const d2 = await taoDon({ items: [mon(1)], payment_method: 'cash', cash_amount: 20000 });
    await db.run("INSERT INTO pos_signup_codes (code, order_id, issued_at, claimed_at, claimed_phone) VALUES ('MB_DA_DUNG', ?, datetime('now'), datetime('now'), '0900000099')", [d2]);
    await xoa(d2);
    k('C2c (K5, H5) mã bill ĐÃ dùng giữ làm vết', await so("SELECT COUNT(*) FROM pos_signup_codes WHERE code = 'MB_DA_DUNG'") === 1);
    // Kho SX ròng: mỗi ca bán (→ huỷ) → xoá theo chế độ SX từng bước, rồi SX sống và ĐẨY SỔ NỢ tới hết; SX ròng của đơn phải = 0,
    // không còn nợ chờ. Chủ quán chốt Câu hỏi 4 = (a): C2 / H6 hiểu là "kho SX ròng đúng trong mọi trường hợp", không phải "không đẩy".
    const doSoNo = require(path.join(MAY_CHU, 'utils', 'doSoNo.js')).doSoNo;   // nạp SAU khi thay sxApi
    const rong = (id) => [...sx.daLam].filter(([vt]) => vt.startsWith(`POS:${id}:`)).reduce((t, [, v]) => t + v, 0);
    const caKho = async (ten, cheBan, cheHuy, cheXoa) => {
      sx.che = cheBan;
      const id = await taoDon({ items: [mon(1)], payment_method: 'cash', cash_amount: 20000 });
      let h = { status: 200 };
      if (cheHuy) { sx.che = cheHuy; h = await huy(id); }
      sx.che = cheXoa;
      const xx = await xoa(id);
      sx.che = 'song';
      imLang();
      try { for (let i = 0; i < 100 && (await doSoNo()).daDoc > 0; i++); } finally { noiLai(); }
      sx.che = 'loi';
      const cho = await so("SELECT COUNT(*) FROM pos_stock_pending WHERE order_id = ? AND status IN ('pending', 'can_xem')", [id]);
      k(ten, h.status === 200 && xx.status === 200 && rong(id) === 0 && cho === 0,
        `${moTa(h)} / ${moTa(xx)} · SX ròng ${rong(id)} · ${JSON.stringify([...sx.daLam].filter(([vt]) => vt.startsWith(`POS:${id}:`)))} · nợ chờ ${cho}`);
    };
    await caKho('C2b bán lúc SX lỗi → xoá lúc SX lỗi → đẩy sổ nợ: SX ròng 0', 'loi', null, 'loi');
    await caKho('C2e bán + huỷ lúc SX lỗi → xoá → đẩy sổ nợ: SX ròng 0', 'loi', 'loi', 'loi');
    await caKho('C2f bán lúc SX lỗi → SX sống → huỷ (in tới SX) → xoá → đẩy: SX ròng 0 (soát vòng 1 lỗi 1)', 'loi', 'song', 'song');
    await caKho('C2g bán lúc SX HẾT GIỜ (đã trừ mà báo lỗi) → xoá → đẩy: SX ròng 0 (soát vòng 2 lỗi 1)', 'het_gio', null, 'song');
    await caKho('C2h bán lúc SX hết giờ → huỷ lúc SX lỗi → xoá → đẩy: SX ròng 0 (soát vòng 2 lỗi 1, nhánh đơn đã huỷ)', 'het_gio', 'loi', 'loi');
    await caKho('C2i (K5) bán + xoá lúc SX sống: SX ròng 0, không nợ', 'song', null, 'song');
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
    const src = fs.readFileSync(path.join(CLIENT, 'src', 'pages', 'Settings.jsx'), 'utf8');
    // Chỉ soi THÂN lệnh gửi (dòng reset form cũng có chữ max_discount — soi cả hàm thì xanh oan, đột biến BV-D1 sống).
    const goiDi = (src.match(/pkgApi\('POST', '\/api\/pos\/rewards', \{[^}]*\}\)/) || [''])[0];
    // Soát vòng 1 lỗi 6 + vòng 2 lỗi 2: khớp ĐÚNG biểu thức gửi (số gõ ở ô, không điều kiện) — `max_discount: 0` hay đảo nhánh
    // `percent ? 0 : …` đều đỏ.
    k('D1a Settings.jsx: thân POST /api/pos/rewards gửi `max_discount: parseInt(rewardForm.max_discount) || 0`',
      /max_discount:\s*parseInt\(rewardForm\.max_discount\)\s*\|\|\s*0\s*,/.test(goiDi), goiDi || 'không thấy lệnh gửi');
    // Ca số tiền của phiếu (Q1), phía MÁY CHỦ: thân lệnh gõ tay theo đúng các trường màn hình gửi (giá trị màn hình gửi do D1a khoá) —
    // quà 50 % trần 50.000 → đổi điểm → đơn 500.000 → giảm 50.000. Xanh cả trên gốc (máy chủ đúng sẵn) — canh hồi quy.
    const sdt = sdtMoi(); await nap(sdt, 500000);
    const q = await goi('POST', '/rewards', { name: 'Quà 50% P26c', points_cost: 1, discount_type: 'percent', discount_value: 50, max_discount: 50000, valid_days: 30 });
    await db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, reason, created_at) VALUES (?, 'earn', 5, 'thử P26c', datetime('now'))", [sdt]);
    const doi = await goi('POST', '/loyalty/redeem', { phone: sdt, reward_id: q.id });
    const sp5 = Number((await db.run(`INSERT INTO pos_products (code, name, category, price, unit, sx_product_type, sx_product_id, is_active)
      VALUES ('MON500K', 'Món 500.000', 'khac', 500000, 'ly', 'tea', 9999, 1)`)).lastInsertRowid);
    const ban = await goi('POST', '/orders', { customer_phone: sdt, customer_name: 'Khách P26c', items: [{ product_id: sp5, quantity: 1 }],
      discount_code: doi.data?.code, payment_method: 'balance', balance_amount: 450000 });
    k('D1b quà 50 % trần 50.000 → đơn 500.000 giảm 50.000 (không phải 250.000)', q.status === 200 && doi.status === 200 && ban.status === 200
      && Number(ban.order?.discount_amount) === 50000, `${moTa(q)} / ${moTa(doi)} / ${moTa(ban)} · giảm ${ban.order?.discount_amount}`);
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
    k('Q4a quyền refund_package có trên kho mới: owner 1, manager 0, staff 0',
      JSON.stringify(quyen.map((r) => r.role + ':' + r.allowed)) === JSON.stringify(['manager:0', 'owner:1', 'staff:0']), JSON.stringify(quyen));
    // Kho ĐANG CHẠY: bảng quyền đã có dữ liệu nhưng chưa có quyền mới → khởi động lại phải chèn; quyền chủ quán đã chỉnh giữ nguyên.
    await db.run("DELETE FROM pos_permissions WHERE permission = 'refund_package' AND role IN ('owner', 'staff')");
    await db.run("UPDATE pos_permissions SET allowed = 1 WHERE permission = 'refund_package' AND role = 'manager'");
    imLang(); await db.initDatabase(); noiLai();
    const q2 = await db.query("SELECT role, allowed FROM pos_permissions WHERE permission = 'refund_package' ORDER BY role");
    k('Q4b kho đang chạy thiếu quyền mới → khởi động lại chèn owner 1 / staff 0, giữ manager 1 chủ quán đã cấp',
      JSON.stringify(q2.map((r) => r.role + ':' + r.allowed)) === JSON.stringify(['manager:1', 'owner:1', 'staff:0']), JSON.stringify(q2));
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Ca HỒI QUY: code quầy đang đúng — mỗi ca đỏ khi đột biến A3L tương ứng (viec/AUDIT-2/dot_bien.py, cách chạy c2luoi).
  muc('[L] LUOI-2 — biên đổi điểm, điểm đơn flash, nhân điểm mã bill, gói đúng chủ, huỷ đơn gói + món lẻ, hoàn gói còn nợ');
  {
    // Tích điểm dùng mặc định của kho (database.js: bật, 10.000đ = 1 điểm) — L2b canh nó đang bật.
    const KHOA = ['nhandiem_enabled', 'nhandiem_he_so', 'flash_enabled', 'flash_start', 'flash_end', 'flash_percent', 'flash_product_keys'];
    const cu = await db.query(`SELECT key, value FROM pos_settings WHERE key IN (${KHOA.map(() => '?').join(',')})`, KHOA);
    const datCaiDat = (key, v) => db.run('INSERT OR REPLACE INTO pos_settings (key, value) VALUES (?, ?)', [key, String(v)]);
    for (const [key, v] of [['nhandiem_enabled', 1], ['nhandiem_he_so', 2]]) await datCaiDat(key, v);
    const diem = (sdt) => so('SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE customer_phone = ?', [sdt]);
    const diemDon = (id) => so("SELECT COALESCE(SUM(points), 0) FROM pos_point_transactions WHERE order_id = ? AND type = 'earn'", [id]);
    const ban = (sdt, i, tien) => goi('POST', '/orders', { customer_phone: sdt, customer_name: 'Khách P26c', items: [mon(i)],
      payment_method: 'cash', cash_amount: tien });
    const themDiem = (sdt, n) => db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, reason, created_at) VALUES (?, 'earn', ?, 'thử LUOI-2', datetime('now'))", [sdt, n]);

    // N1 (A3L-redeem-thieu-1-diem) — đổi điểm `balance < cost`: biên ĐÚNG cost − 1.
    const q = await goi('POST', '/rewards', { name: 'Quà 3 điểm LUOI-2', points_cost: 3, discount_type: 'percent', discount_value: 10, valid_days: 30 });
    const s1 = sdtMoi(); await themDiem(s1, 2);
    const d1 = await goi('POST', '/loyalty/redeem', { phone: s1, reward_id: q.id });
    const ve = () => so('SELECT COUNT(*) FROM pos_voucher_grants WHERE customer_phone = ?', [s1]);
    k('L1a quà 3 điểm, khách có ĐÚNG 2 → đổi 400, điểm vẫn 2, 0 voucher', q.status === 200 && d1.status === 400 && await diem(s1) === 2
      && await ve() === 0, `${moTa(q)} / ${moTa(d1)} · điểm ${await diem(s1)} · voucher ${await ve()}`);
    await themDiem(s1, 1);
    const d1b = await goi('POST', '/loyalty/redeem', { phone: s1, reward_id: q.id });
    k('L1b (K5) đủ 3 điểm → đổi 200, điểm 0', d1b.status === 200 && await diem(s1) === 0, `${moTa(d1b)} · điểm ${await diem(s1)}`);

    // LUOI-5 N1 (A3L-redeem-bo-han-diem) — điểm HẾT HẠN không đổi được (chế độ `quarter` ghi expires_at). Dòng hết hạn dựng bằng INSERT:
    // đường quầy không đi được (cần thời gian trôi) — khuôn B3p. Số dư = SUM điểm còn hạn (hằng BALANCE_SQL của loyalty.js) ở CẢ xem điểm lẫn đổi quà.
    const s7 = sdtMoi();
    await db.run("INSERT INTO pos_point_transactions (customer_phone, type, points, expires_at, reason, created_at) VALUES (?, 'earn', 5, '2020-01-01T00:00:00', 'thử LUOI-5 hết hạn', datetime('now'))", [s7]);
    await themDiem(s7, 2);
    const p7 = await goi('GET', `/loyalty/points/${s7}`);
    const d7 = await goi('POST', '/loyalty/redeem', { phone: s7, reward_id: q.id });
    k('L7a khách có 5 điểm HẾT HẠN + 2 điểm còn hạn, quà 3 điểm → xem điểm = 2; đổi 400, 0 voucher', p7.points === 2 && d7.status === 400
      && await so('SELECT COUNT(*) FROM pos_voucher_grants WHERE customer_phone = ?', [s7]) === 0, `${moTa(p7)} · ${p7.points} / ${moTa(d7)}`);

    // LUOI-5 N1 (C2F-rewards-02) — sửa giá điểm của quà có hiệu lực ở lần đổi sau: 3 → 5.
    const q9 = await goi('POST', '/rewards', { name: 'Quà sửa giá LUOI-5', points_cost: 3, discount_type: 'percent', discount_value: 10, valid_days: 30 });
    const u9 = await goi('PUT', `/rewards/${q9.id}`, { points_cost: 5 });
    const s9 = sdtMoi(); await themDiem(s9, 4);
    const d9 = await goi('POST', '/loyalty/redeem', { phone: s9, reward_id: q9.id });
    const sau9 = await diem(s9);
    await themDiem(s9, 1);
    const d9b = await goi('POST', '/loyalty/redeem', { phone: s9, reward_id: q9.id });
    k('L9a quà 3 điểm sửa thành 5 → 200; khách 4 điểm đổi 400 (điểm vẫn 4); thêm 1 điểm → đổi 200, điểm 0', q9.status === 200 && u9.status === 200
      && d9.status === 400 && sau9 === 4 && d9b.status === 200 && await diem(s9) === 0, `${moTa(q9)} / ${moTa(u9)} / ${moTa(d9)} · ${sau9} / ${moTa(d9b)} · ${await diem(s9)}`);

    // LUOI-5 N1 (C2F-rewards-03) — quà bị ẩn (DELETE là xoá mềm) không đổi được nữa.
    const q9b = await goi('POST', '/rewards', { name: 'Quà ẩn LUOI-5', points_cost: 3, discount_type: 'percent', discount_value: 10, valid_days: 30 });
    const x9 = await goi('DELETE', `/rewards/${q9b.id}`);
    const s9b = sdtMoi(); await themDiem(s9b, 3);
    const d9c = await goi('POST', '/loyalty/redeem', { phone: s9b, reward_id: q9b.id });
    k('L9b quà bị ẩn → 200; khách đủ 3 điểm đổi 404, điểm vẫn 3, 0 voucher', q9b.status === 200 && x9.status === 200 && d9c.status === 404
      && await diem(s9b) === 3 && await so('SELECT COUNT(*) FROM pos_voucher_grants WHERE customer_phone = ?', [s9b]) === 0,
      `${moTa(q9b)} / ${moTa(x9)} / ${moTa(d9c)} · điểm ${await diem(s9b)}`);

    // N2 (A3L-earn-flash-van-cong) — `!flashApplied` (F2): đơn có giảm flash KHÔNG cộng điểm. Flash chỉ bật quanh L2a (giờ VN: giờ này → +2 giờ).
    const gio = Number(new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(11, 13));
    for (const [key, v] of [['flash_enabled', 'true'], ['flash_start', `${String(gio).padStart(2, '0')}:00`],
      ['flash_end', `${String((gio + 2) % 24).padStart(2, '0')}:00`], ['flash_percent', 20],
      ['flash_product_keys', JSON.stringify([`${sp[0].sx_product_type}_${sp[0].sx_product_id}`])]]) await datCaiDat(key, v);
    const f = await ban(sdtMoi(), 0, 20000);
    await datCaiDat('flash_enabled', 'false');
    k('L2a đơn có SĐT, món flash 25.000 − 20 % → 200, flash 5.000, 0 điểm', f.status === 200 && Number(f.order?.flash_discount) === 5000
      && await diemDon(f.order?.id) === 0, `${moTa(f)} · flash ${f.order?.flash_discount} · điểm ${await diemDon(f.order?.id)}`);
    const f2 = await ban(sdtMoi(), 1, 20000);
    k('L2b (K5) đơn có SĐT, món KHÔNG flash 20.000 → 2 điểm (tích điểm đang bật — L2a không xanh oan)', f2.status === 200
      && await diemDon(f2.order?.id) === 2, `${moTa(f2)} · điểm ${await diemDon(f2.order?.id)}`);

    // N3 (A3L-nhandiem-cong-doi) — đơn ĐÃ có điểm lúc bán → nhân điểm mã bill chỉ cộng BÙ, tổng = điểm gốc × hệ số.
    const s3 = sdtMoi();
    const b3 = await ban(s3, 2, 50000);
    const luc = await diem(s3);
    const n3 = await goi('POST', '/signup-codes/nhan-diem', { code: b3.order?.signup_code, phone: s3 });
    k('L3a bán 50.000 có SĐT (5 điểm lúc bán) → nhận điểm mã bill 200, tổng 5 × 2 = 10', b3.status === 200 && luc === 5 && n3.status === 200
      && await diem(s3) === 10, `${moTa(b3)} · lúc bán ${luc} / ${moTa(n3)} · tổng ${await diem(s3)}`);
    // LUOI-5 N1 (A3L-nhandiem-he-so-mac-dinh) — chưa cài hệ số (nhandiem_he_so) → mặc định 2 (signup-codes.js docCauHinhNhanDiem). Ca KHÔNG truyền
    // hệ số: giá trị mặc định là hành vi (K3). Vòng trả cài đặt ngay dưới khôi phục khoá.
    await db.run("DELETE FROM pos_settings WHERE key = 'nhandiem_he_so'");
    const s8 = sdtMoi();
    const b8 = await ban(s8, 2, 50000);
    const luc8 = await diem(s8);
    const n8 = await goi('POST', '/signup-codes/nhan-diem', { code: b8.order?.signup_code, phone: s8 });
    k('L8a chưa cài hệ số nhân điểm: bán 50.000 có SĐT (5 điểm lúc bán) → nhận điểm mã bill 200, tổng 5 × 2 = 10', b8.status === 200 && luc8 === 5
      && n8.status === 200 && await diem(s8) === 10, `${moTa(b8)} · lúc bán ${luc8} / ${moTa(n8)} · tổng ${await diem(s8)}`);
    for (const key of KHOA) await db.run('DELETE FROM pos_settings WHERE key = ?', [key]);
    for (const r of cu) await datCaiDat(r.key, r.value);

    // N4 (A3L-goi-bo-kiem-chu) — gói phải ĐÚNG CHỦ.
    const g4 = await goiDaLay({ cash_amount: 300000 }, 1);
    const l4 = await lay(sdtMoi(), g4.cp, 1);
    k('L4a lấy gói của khách A bằng SĐT khác → 400 GOI_KHONG_DUNG_CHU, gói A vẫn giao 1', l4.status === 400 && l4.code === 'GOI_KHONG_DUNG_CHU'
      && await daGiao(g4.cp) === 1, `${moTa(l4)} · giao ${await daGiao(g4.cp)}`);

    // N5 (A3L-goi-huy-dem-ca-mon-tra-tien) — huỷ đơn lấy gói chỉ trả lượt cho món LẤY TỪ GÓI, không đếm món trả tiền.
    const g5 = await goiDaLay({ cash_amount: 300000 }, 2);
    const l5 = await goi('POST', '/orders', { customer_phone: g5.sdt, customer_name: 'Khách P26c', items: [mon(0, 1, true), mon(1)],
      customer_package_id: g5.cp, payment_method: 'cash', cash_amount: 20000 });
    const sau5 = await daGiao(g5.cp);
    const h5 = await huy(l5.order?.id);
    k('L5a gói giao 2; đơn 1 ly gói + 1 món lẻ → giao 3; huỷ → giao 2 (trả đúng 1 lượt)', l5.status === 200 && sau5 === 3 && h5.status === 200
      && await daGiao(g5.cp) === 2, `${moTa(l5)} · ${sau5} / ${moTa(h5)} · ${await daGiao(g5.cp)}`);

    // N6 (A3L-hoan-goi-bo-tru-no) — soTienHoan: hoàn đơn mua gói trừ phần còn NỢ (khách chưa trả thì không hoàn).
    // P22-23: mua gói ghi nợ nay 400 (L6b) — đơn nợ CŨ trên production vẫn có thể còn: mua trả đủ rồi đưa về dạng nợ cũ bằng UPDATE.
    const s6 = sdtMoi();
    const goi6 = await taoGoi(300000, 10);
    const l6b = await muaGoi(s6, goi6, 10, { cash_amount: 100000, debt_amount: 200000 });
    k('L6b mua gói 300.000 trả 100.000 + nợ 200.000 → 400 GOI_THE_CHUA_THU_DU', l6b.status === 400 && l6b.code === 'GOI_THE_CHUA_THU_DU', moTa(l6b));
    const m6 = await muaGoi(s6, goi6, 10, { cash_amount: 300000 });
    await db.run("UPDATE pos_orders SET cash_amount = 100000, debt_amount = 200000, payment_status = 'pending' WHERE id = ?", [m6.order?.id]);
    const h6 = await huy(m6.order?.id);
    k('L6a gói 300.000 trả 100.000 + nợ 200.000, chưa lấy → owner huỷ: ví +100.000, tổng hoàn 100.000', m6.status === 200 && h6.status === 200
      && await vi(s6) === 100000 && await tongHoan(m6.order?.id) === 100000,
    `${moTa(m6)} / ${moTa(h6)} · ví ${await vi(s6)} · tổng hoàn ${await tongHoan(m6.order?.id)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Ca HỒI QUY LUOI-5: code quầy đang đúng — mỗi ca đỏ khi đột biến AU4-21 tương ứng (viec/LUOI-5/dot_bien.py).
  muc('[X] LUOI-5 — chiết khấu riêng của khách (PUT /v2/customers/:sdt/discount): máy chủ tự áp khi bán');
  {
    const ck = (sdt, body) => goi('PUT', `/v2/customers/${sdt}/discount`, body);
    const sdt = sdtMoi();
    const chuaCoHoSo = await so('SELECT COUNT(*) FROM pos_customers WHERE phone = ?', [sdt]) === 0;   // PUT đầu đi nhánh INSERT
    const c1 = await ck(sdt, { discount_type: 'fixed', discount_value: 5000 });
    const x1 = await goi('POST', '/orders', { customer_phone: sdt, customer_name: 'Khách P26c', items: [mon(0)], payment_method: 'cash', cash_amount: 20000 });
    k('X1a khách chưa có hồ sơ, đặt chiết khấu cố định 5.000 → 200; đơn 25.000 → tổng 20.000 (máy chủ tự áp từ hồ sơ)', chuaCoHoSo && c1.status === 200
      && x1.status === 200 && Number(x1.order?.total) === 20000, `${moTa(c1)} / ${moTa(x1)} · tổng ${x1.order?.total}`);
    // Hồ sơ đã có (PUT đầu) → PUT sau đi nhánh UPDATE. 20 % (không phải 10 %: 50.000 × 0,9 = 45.000 trùng 50.000 − 5.000 → đột biến lọt).
    const c2 = await ck(sdt, { discount_type: 'percent', discount_value: 20 });
    const x2 = await goi('POST', '/orders', { customer_phone: sdt, customer_name: 'Khách P26c', items: [mon(2)], payment_method: 'cash', cash_amount: 40000 });
    k('X1b sửa sang 20 % → 200; đơn 50.000 → tổng 40.000', c2.status === 200 && x2.status === 200 && Number(x2.order?.total) === 40000,
      `${moTa(c2)} / ${moTa(x2)} · tổng ${x2.order?.total}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Ca HỒI QUY LUOI-3: code quầy đang đúng — mỗi ca đỏ khi đột biến AU3-8…10, 15…17 tương ứng (viec/LUOI-3/dot_bien.py).
  muc('[M] LUOI-3 — trần đền / hoàn đơn có ship, đơn 2 dòng có flash, flash + mã 1 món, một dòng mua 2 gói');
  {
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active)
      VALUES ('GIAM10_LUOI3', 'percent', 10, 0, 0, 0, 0, 1)`);
    const sdt = sdtMoi();
    // N1 (BV-AU3-P26C-DATRA-BO-TRU-SHIP) — tiền hàng đã trả = total − ship; bỏ "− ship" chỉ lộ khi đơn CÓ GIẢM (không giảm: min(tổng hàng, total) như nhau).
    const d1 = await goi('POST', '/orders', { customer_phone: sdt, customer_name: 'Khách P26c', items: [mon(2)], shipping_fee: 10000,
      discount_code: 'GIAM10_LUOI3', payment_method: 'cash', cash_amount: 55000 });
    const v1 = await vi(sdt);
    const a1 = await baoHong(d1.order?.id, { product_code: sp[2].code, quantity: 1, action: 'refund', refund_amount: 45001 });
    const b1 = await baoHong(d1.order?.id, { product_code: sp[2].code, quantity: 1, action: 'refund', refund_amount: 45000 });
    k('M1a món 50.000 + ship 10.000, mã 10 % → tổng 55.000; đền 45.001 → 400 VUOT_GIA, 45.000 → 200, ví +45.000 (trần = total − ship)',
      Number(d1.order?.total) === 55000 && a1.status === 400 && a1.code === 'VUOT_GIA' && b1.status === 200 && await vi(sdt) === v1 + 45000,
      `${moTa(d1)} · tổng ${d1.order?.total} · ${moTa(a1)} / ${moTa(b1)} · ví ${v1} → ${await vi(sdt)}`);
    const g1 = await goiDaLay({ cash_amount: 280000 }, 1, { shipping_fee: 10000, discount_code: 'GIAM10_LUOI3' });
    const tong1 = await so('SELECT total FROM pos_orders WHERE id = ?', [g1.don]);
    const h1 = await huy(g1.don);
    k('M1b gói 300.000 + ship 10.000, mã 10 % → tổng 280.000; lấy 1/10, owner huỷ → ví +253.000 (280.000 − ⌈270.000 × 1/10⌉ — hoàn GỒM ship)',
      tong1 === 280000 && h1.status === 200 && await vi(g1.sdt) === g1.vi0 + 253000, `tổng ${tong1} · ${moTa(h1)} · ví ${g1.vi0} → ${await vi(g1.sdt)}`);

    // N2 (VS-AU3-P26C-DATRA-GIA-GOC) — giá đã trả theo TỪNG dòng. Dữ liệu như đơn bán lúc flash (B1a) nhưng CHỈ dòng flash đổi giá.
    const d2 = await taoDon({ customer_phone: sdt, items: [mon(0), mon(3)], payment_method: 'cash', cash_amount: 55000 });
    await db.run('UPDATE pos_orders SET total = 50000, discount = 5000, discount_amount = 5000, flash_discount = 5000, cash_amount = 50000 WHERE id = ?', [d2]);
    await db.run('UPDATE pos_order_items SET flash_unit_price = 20000 WHERE order_id = ? AND product_id = ?', [d2, sp[0].id]);
    const v2 = await vi(sdt);
    const a2 = await baoHong(d2, { product_code: sp[0].code, quantity: 1, action: 'refund', refund_amount: 20001 });
    const b2 = await baoHong(d2, { product_code: sp[0].code, quantity: 1, action: 'refund', refund_amount: 20000 });
    k('M2a đơn 2 dòng (món 25.000 giá flash 20.000 + món 30.000, trả 50.000): đền dòng flash 20.001 → 400 VUOT_GIA, 20.000 → 200',
      a2.status === 400 && a2.code === 'VUOT_GIA' && b2.status === 200, `${moTa(a2)} / ${moTa(b2)}`);
    const c2 = await baoHong(d2, { product_code: sp[3].code, quantity: 1, action: 'refund', refund_amount: 30000 });
    k('M2b (K5) cùng đơn, đền dòng thường đủ 30.000 → 200; ví tổng +50.000', c2.status === 200 && await vi(sdt) === v2 + 50000,
      `${moTa(c2)} · ví ${v2} → ${await vi(sdt)}`);

    // N3 (VS-AU3-P26C-DEN-GIAM-BO-FLASH) — mã 1 món + flash: giảm của mã = discount − flash − hạng (cột discount là TỔNG giảm, orders.js).
    const m3 = await goi('POST', '/orders', { customer_phone: sdt, items: [mon(2), mon(3)], discount_code: 'GIAM1MON', payment_method: 'cash', cash_amount: 55000 });
    await db.run('UPDATE pos_orders SET total = 49000, discount = 31000, discount_amount = 31000, flash_discount = 6000, cash_amount = 49000 WHERE id = ?', [m3.order?.id]);
    await db.run('UPDATE pos_order_items SET flash_unit_price = 24000 WHERE order_id = ? AND product_id = ?', [m3.order?.id, sp[3].id]);
    const v3 = await vi(sdt);
    const a3 = await baoHong(m3.order?.id, { product_code: sp[2].code, quantity: 1, action: 'refund', refund_amount: 25001 });
    const b3 = await baoHong(m3.order?.id, { product_code: sp[2].code, quantity: 1, action: 'refund', refund_amount: 25000 });
    k('M3a mã 1 món (A 50.000 − 25.000) + B 30.000 giá flash 24.000, trả 49.000: đền A 25.001 → 400, 25.000 → 200 (không chặn oan), ví +25.000',
      Number(m3.order?.total) === 55000 && a3.status === 400 && a3.code === 'VUOT_GIA' && b3.status === 200 && await vi(sdt) === v3 + 25000,
      `${moTa(m3)} · ${moTa(a3)} / ${moTa(b3)} · ví ${v3} → ${await vi(sdt)}`);

    // N8 (VS-AU3-SL-DONG-GOI-SL-1), N9 (…-TONG-1), N10 (VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL) — MỘT dòng mua 2 gói: số lượng dòng, tiền dòng,
    // mẫu số "đã dùng" quantity × total_qty. Có giảm: dòng ghi 1 gói thì đã trả mỗi gói 300.000 thay vì 270.000 (không giảm thì như nhau).
    const s4 = sdtMoi(), goi4 = await taoGoi(300000, 10);
    const m4 = await muaGoi(s4, goi4, 10, { cash_amount: 540000 }, { package_buy: { package_id: goi4, total_qty: 10, pkg_qty: 2 }, discount_code: 'GIAM10_LUOI3' });
    const dong4 = await mot(`SELECT oi.quantity, o.subtotal, (SELECT SUM(total_price) FROM pos_order_items WHERE order_id = o.id) AS tien
      FROM pos_orders o JOIN pos_order_items oi ON oi.order_id = o.id AND oi.product_id < 0 WHERE o.id = ?`, [m4.order?.id]);
    const l4 = await lay(s4, await goiCua(m4.order?.id), 1);
    const h4 = await huy(m4.order?.id);
    k('M4a 2 gói × 300.000 một dòng, mã 10 % (trả 540.000), lấy 1 → owner huỷ: ví +513.000 (540.000 − ⌈540.000 × 1/(2×10)⌉), tổng hoàn 513.000',
      Number(m4.order?.total) === 540000 && l4.status === 200 && h4.status === 200 && await vi(s4) === 513000 && await tongHoan(m4.order?.id) === 513000,
      `${moTa(m4)} · tổng ${m4.order?.total} · ${moTa(l4)} · ${moTa(h4)} · ví ${await vi(s4)} · tổng hoàn ${await tongHoan(m4.order?.id)}`);
    k('M4b cùng đơn (đọc trước khi huỷ): dòng gói quantity 2; SUM(total_price) các dòng = subtotal = 600.000 (báo cáo doanh thu cộng cột này)',
      Number(dong4?.quantity) === 2 && Number(dong4?.tien) === 600000 && Number(dong4?.subtotal) === 600000, JSON.stringify(dong4));
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Ca HỒI QUY LUOI-4: code quầy đang đúng — mỗi ca đỏ khi đột biến AU4-2, 3, 5 tương ứng (viec/LUOI-4/dot_bien.py). Dựng không ném.
  muc('[N] LUOI-4 — làm tròn trần đền / phần đã dùng khi huỷ gói, trần mã 1 món không áp sang huỷ gói');
  {
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active)
      VALUES ('GIAM10K_LUOI4', 'fixed', 10000, 0, 0, 0, 0, 1)`);
    // N1 (VS-AU4-L3-DATRA-LAM-TRON-LEN) — giảm CẤP ĐƠN, tổng không chia hết: trần dòng 25.000 = ⌊25.000 × 45.000 / 55.000⌋ = 20.454 (lên: 20.455).
    const s1 = sdtMoi();
    const d1 = await goi('POST', '/orders', { customer_phone: s1, customer_name: 'Khách P26c', items: [mon(0), mon(3)], discount_code: 'GIAM10K_LUOI4',
      payment_method: 'cash', cash_amount: 45000 });
    const a1 = await baoHong(d1.order?.id, { product_code: sp[0].code, quantity: 1, action: 'refund', refund_amount: 20455 });
    const b1 = await baoHong(d1.order?.id, { product_code: sp[0].code, quantity: 1, action: 'refund', refund_amount: 20454 });
    k('N1a món 25.000 + 30.000, mã giảm đơn 10.000 → tổng 45.000; đền món 25.000: 20.455 → 400 VUOT_GIA, 20.454 → 200, ví +20.454 (⌊25.000 × 45.000 / 55.000⌋)',
      Number(d1.order?.total) === 45000 && a1.status === 400 && a1.code === 'VUOT_GIA' && b1.status === 200 && await vi(s1) === 20454,
      `${moTa(d1)} · tổng ${d1.order?.total} · ${moTa(a1)} / ${moTa(b1)} · ví ${await vi(s1)}`);

    // N2 (VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG) — gói 300.000 / 7 lượt: đã dùng ⌈300.000 / 7⌉ = 42.858 → hoàn 257.142 (xuống: 257.143).
    const s2 = sdtMoi(), goi2 = await taoGoi(300000, 7);
    const m2 = await muaGoi(s2, goi2, 7, { cash_amount: 300000 });
    const l2 = await lay(s2, await goiCua(m2.order?.id), 1);
    const h2 = await huy(m2.order?.id);
    k('N2a gói 300.000 / 7 lượt (trả 300.000), lấy 1 → owner huỷ: ví +257.142 (300.000 − ⌈300.000 × 1/7⌉ = 300.000 − 42.858)',
      m2.status === 200 && l2.status === 200 && h2.status === 200 && await vi(s2) === 257142,
      `${moTa(m2)} · ${moTa(l2)} · ${moTa(h2)} · ví ${await vi(s2)}`);

    // N4 (VS-AU4-L3-CHAN-TREN-CA-HOAN) — đơn mua gói + món có mã giảm 1 MÓN: trần "giá dòng − toàn bộ giảm" CHỈ cho đền (chanTren),
    // huỷ chia tỉ lệ: dòng gói đã trả ⌊300.000 × 320.000 / 325.000⌋ = 295.384, đã dùng ⌈29.538,4⌉ = 29.539 → hoàn 290.461 (đb: 290.500).
    await db.run("INSERT INTO pos_product_groups (id, code, name) VALUES (78, 'NHOM_LUOI4', 'Nhóm thử LUOI-4')");
    await db.run('INSERT INTO pos_product_group_members (group_id, sx_product_type, sx_product_id) VALUES (78, ?, ?)', [sp[0].sx_product_type, sp[0].sx_product_id]);
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, min_order, max_discount, usage_limit, used_count, is_active,
      discount_scope, applicable_group_id) VALUES ('GIAM5K_1MON_LUOI4', 'fixed', 5000, 0, 0, 0, 0, 1, 'item', 78)`);
    const s4 = sdtMoi(), goi4 = await taoGoi(300000, 10);
    const m4 = await muaGoi(s4, goi4, 10, { cash_amount: 320000 }, { items: [mon(0)], discount_code: 'GIAM5K_1MON_LUOI4' });
    const l4 = await lay(s4, await goiCua(m4.order?.id), 1);
    const h4 = await huy(m4.order?.id);
    k('N4a gói 300.000 / 10 + món 25.000, mã giảm 1 món 5.000 → tổng 320.000; lấy 1 → owner huỷ: ví +290.461 (320.000 − ⌈⌊300.000 × 320.000 / 325.000⌋ / 10⌉)',
      Number(m4.order?.total) === 320000 && l4.status === 200 && h4.status === 200 && await vi(s4) === 290461,
      `${moTa(m4)} · tổng ${m4.order?.total} · ${moTa(l4)} · ${moTa(h4)} · ví ${await vi(s4)}`);
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

  // ═════════════════════════════════════════════════════════════════════════
  // SO-LUONG-1 (chủ quán chốt 14.10): mọi số lượng máy chủ nhận — `quantity` món, `pkg_qty` gói — phải là số NGUYÊN ≥ 1 (chuỗi số
  // nguyên vẫn nhận); mua gói phải đủ mã gói + SĐT khách. Mỗi ca chặn gửi `cash_amount` = số tiền SAI mà GỐC tự tính (orders.js
  // :773 đòi tiền trả khớp tổng — gửi số đúng thì gốc cũng 400 vì lệch tổng → xanh oan, K3). So status / code / số đếm, không dò chữ.
  muc('[S1] món lẻ: quantity phải nguyên ≥ 1');
  {
    const demDon = () => so('SELECT COUNT(*) FROM pos_orders');
    const demKho = () => so('SELECT COUNT(*) FROM pos_stock_pending');
    const ban = (sl, tien) => goi('POST', '/orders', { customer_name: 'Khách S1', items: [mon(2), mon(0, sl)], payment_method: 'cash', cash_amount: tien });
    for (const [chu, sl, tien, goc] of [['a', 0, 50000], ['b', -1, 25000], ['c', 0.5, 62500], ['d', 1.5, 87500], ['e', '2a', 50000, '500 NaN vào DB'], ['f', '', 50000]]) {
      const d0 = await demDon(), k0 = await demKho();
      const r = await ban(sl, tien);
      k(`S1${chu} món 50.000 + món 25.000 × ${JSON.stringify(sl)} (gốc ${goc || 'tạo đơn ' + tien.toLocaleString('vi-VN') + 'đ'}) → 400 SL_KHONG_HOP_LE, không đơn, kho không đổi`,
        r.status === 400 && r.code === 'SL_KHONG_HOP_LE' && await demDon() === d0 && await demKho() === k0, `${moTa(r)} · tổng ${r.order?.total}`);
    }
    const a = await ban(2, 100000), b = await ban('2', 100000);
    k('S1g (K5) quantity 2 → 200, tổng 100.000', a.status === 200 && Number(a.order?.total) === 100000, moTa(a));
    k('S1h (K5) quantity "2" (chuỗi số nguyên) → 200, tổng 100.000', b.status === 200 && Number(b.order?.total) === 100000, moTa(b));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[S2] mua gói: pkg_qty nguyên ≥ 1 (thiếu → 1); phải đủ mã gói + SĐT khách');
  {
    const goiId = await taoGoi(300000, 10);
    const demDon = () => so('SELECT COUNT(*) FROM pos_orders');
    const demGoi = (donId) => so('SELECT COUNT(*) FROM pos_customer_packages' + (donId ? ' WHERE order_id = ?' : ''), donId ? [donId] : []);
    const mua = (body, tien) => goi('POST', '/orders', { customer_phone: sdtMoi(), customer_name: 'Khách S2', items: [], payment_method: 'cash', cash_amount: tien, ...body });
    for (const [chu, v, tien] of [['a', 0, 300000], ['b', 0.002, 600], ['c', -1, 0], ['d', 1.5, 450000]]) {
      const d0 = await demDon(), g0 = await demGoi();
      const r = await mua({ package_buy: { package_id: goiId, total_qty: 10, pkg_qty: v } }, tien);
      k(`S2${chu} gói 300.000 × pkg_qty ${v} (gốc tính ${tien.toLocaleString('vi-VN')}đ) → 400 SL_KHONG_HOP_LE, không đơn, không gói mới`,
        r.status === 400 && r.code === 'SL_KHONG_HOP_LE' && await demDon() === d0 && await demGoi() === g0, `${moTa(r)} · tổng ${r.order?.total}`);
    }
    const e = await mua({ package_buy: { package_id: goiId } }, 300000);   // thiếu cả total_qty — máy chủ không dùng (P26c A6)
    k('S2e (K5) chỉ gửi package_id (thiếu pkg_qty, total_qty) → 200, 1 gói khách, tổng 300.000', e.status === 200 && Number(e.order?.total) === 300000 && await demGoi(e.order?.id) === 1, moTa(e));
    const f = await mua({ package_buy: { package_id: goiId, total_qty: 10, pkg_qty: 2 } }, 600000);
    k('S2f (K5) pkg_qty 2 → 200, 2 gói khách, tổng 600.000', f.status === 200 && Number(f.order?.total) === 600000 && await demGoi(f.order?.id) === 2, moTa(f));
    // Hai phát hiện (chủ quán chốt vá 14.10): `package_buy: {}` lọt cổng :338 (`{}` truthy) → món từ gói 0đ không trừ lượt; thiếu SĐT → thu tiền mà không tạo gói (:1019).
    const d0 = await demDon(), k0 = await so('SELECT COUNT(*) FROM pos_stock_pending'), g0 = await demGoi();
    const g = await mua({ items: [mon(0, 2, true)], package_buy: {} }, 0);
    k('S2g package_buy: {} + 2 ly khai từ gói (gốc tạo đơn 0đ, không trừ lượt) → 400 GOI_MUA_THIEU_THONG_TIN, không đơn, kho không đổi',
      g.status === 400 && g.code === 'GOI_MUA_THIEU_THONG_TIN' && await demDon() === d0 && await so('SELECT COUNT(*) FROM pos_stock_pending') === k0, moTa(g));
    const h = await mua({ customer_phone: undefined, package_buy: { package_id: goiId, total_qty: 10, pkg_qty: 1 } }, 300000);
    k('S2h mua gói 300.000 không SĐT (gốc thu 300.000 mà không tạo gói) → 400 GOI_MUA_THIEU_THONG_TIN, không đơn, không gói',
      h.status === 400 && h.code === 'GOI_MUA_THIEU_THONG_TIN' && await demDon() === d0 && await demGoi() === g0, moTa(h));
    // Soát độc lập vòng 1: cổng kiểm SĐT thô, khối tạo gói dùng normalizePhone → " " lọt cổng mà không tạo gói.
    const i = await mua({ customer_phone: ' ', package_buy: { package_id: goiId, total_qty: 10, pkg_qty: 1 } }, 300000);
    k('S2i mua gói 300.000 với SĐT " " (gốc thu 300.000 mà không tạo gói) → 400 GOI_MUA_THIEU_THONG_TIN, không đơn, không gói',
      i.status === 400 && i.code === 'GOI_MUA_THIEU_THONG_TIN' && await demDon() === d0 && await demGoi() === g0, moTa(i));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[S3 + S4] món lấy từ gói giữ mã GOI_SL_KHONG_HOP_LE (GOI-1); luồng hợp lệ: 10 ly, mua thẻ');
  {
    const gl = await goiDaLay({ cash_amount: 300000 }, 2);
    const l = await lay(gl.sdt, gl.cp, 0.5);
    k('S3 lấy từ gói 0,5 ly → 400 GOI_SL_KHONG_HOP_LE, giao vẫn 2', l.status === 400 && l.code === 'GOI_SL_KHONG_HOP_LE' && await daGiao(gl.cp) === 2, moTa(l));
    const m10 = await goi('POST', '/orders', { customer_name: 'Khách S4', items: [mon(0, 10)], payment_method: 'cash', cash_amount: 250000 });
    k('S4a (K5) bán 10 ly 25.000 → 200, tổng 250.000', m10.status === 200 && Number(m10.order?.total) === 250000, moTa(m10));
    const the = await mot('SELECT id, card_price FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order LIMIT 1');
    const tien = 25000 + Number(the.card_price);
    const mt = await goi('POST', '/orders', { customer_phone: sdtMoi(), customer_name: 'Khách S4', items: [mon(0)], membership_buy: { tier_id: the.id },
      payment_method: 'cash', cash_amount: tien });
    k(`S4b (K5) 1 ly 25.000 + mua thẻ ${Number(the.card_price).toLocaleString('vi-VN')} → 200, tổng ${tien.toLocaleString('vi-VN')}`,
      mt.status === 200 && Number(mt.order?.total) === tien, moTa(mt));
    // Cùng khuôn cổng mua thẻ (:187 ↔ :1067 `membershipTier && phone`): SĐT " " → gốc thu tiền thẻ mà không ghi thẻ.
    const dThe = await so('SELECT COUNT(*) FROM pos_orders');
    const mk = await goi('POST', '/orders', { customer_phone: ' ', customer_name: 'Khách S4', items: [mon(0)], membership_buy: { tier_id: the.id },
      payment_method: 'cash', cash_amount: tien });
    k(`S4c mua thẻ với SĐT " " (gốc thu ${tien.toLocaleString('vi-VN')} mà không ghi thẻ) → 400 THE_MUA_THIEU_THONG_TIN, không đơn`,
      mk.status === 400 && mk.code === 'THE_MUA_THIEU_THONG_TIN' && await so('SELECT COUNT(*) FROM pos_orders') === dThe, moTa(mk));   // BAN-HANG-1: thêm mã
  }

  // ═════════════════════════════════════════════════════════════════════════
  // BAN-HANG-1 (chủ quán chốt 15.10): có `membership_buy` thì phải đủ hạng thẻ + SĐT đã chuẩn hoá (cùng khuôn cổng gói S2g–S2i) — cổng cũ
  // chỉ chạy khi có `tier_id` nên `{}` lọt. Hạn đăng nhập mặc định 30 ngày, biến môi trường vẫn ưu tiên. So status / code / số đếm / số giây.
  muc('[T1 + T2] mua thẻ thiếu hạng → 400 THE_MUA_THIEU_THONG_TIN, không đơn; luồng hợp lệ: thẻ riêng, không thẻ');
  {
    const demDon = () => so('SELECT COUNT(*) FROM pos_orders');
    const hang = await mot('SELECT id, card_price FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order LIMIT 1');
    const gia = Number(hang.card_price);
    const muaThe = (body, tien) => goi('POST', '/orders', { customer_phone: sdtMoi(), customer_name: 'Khách T1', items: [mon(0)], payment_method: 'cash', cash_amount: tien, ...body });
    const d0 = await demDon();
    const a = await muaThe({ membership_buy: {} }, 25000);
    k('T1a membership_buy: {} + 1 ly 25.000 (gốc tạo đơn thường 25.000) → 400 THE_MUA_THIEU_THONG_TIN, không đơn',
      a.status === 400 && a.code === 'THE_MUA_THIEU_THONG_TIN' && await demDon() === d0, `${moTa(a)} · tổng ${a.order?.total}`);
    const b = await muaThe({ items: [], membership_buy: {} }, 0);
    k('T1b membership_buy: {} + items [] (gốc tạo đơn rỗng 0đ) → 400 THE_MUA_THIEU_THONG_TIN, không đơn',
      b.status === 400 && b.code === 'THE_MUA_THIEU_THONG_TIN' && await demDon() === d0, `${moTa(b)} · tổng ${b.order?.total}`);
    const c = await muaThe({ items: [], membership_buy: { tier_id: hang.id } }, gia);
    k(`T2a (K5) mua thẻ riêng, items [] → 200, tổng ${gia.toLocaleString('vi-VN')}`, c.status === 200 && Number(c.order?.total) === gia, moTa(c));
    const d = await muaThe({ customer_phone: undefined, membership_buy: null }, 25000);
    k('T2b (K5) membership_buy: null + 1 ly, không SĐT → 200, tổng 25.000', d.status === 200 && Number(d.order?.total) === 25000, moTa(d));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[T3] hạn đăng nhập: mặc định 30 ngày (auth.js), biến môi trường JWT_EXPIRES_IN ưu tiên');
  {
    const dangNhap = async () => {   // admin/admin123 do database.js seedDefaultData tạo trong kho tạm; so status TRƯỚC, không ném khi thiếu token
      const r = await goi('POST', '/auth/login', { username: 'admin', password: 'admin123' });
      const t = r.token ? jwt.decode(r.token) : null;
      return { status: r.status, giay: t ? t.exp - t.iat : NaN };
    };
    const bienCu = process.env.JWT_EXPIRES_IN;
    try {
      delete process.env.JWT_EXPIRES_IN;
      const a = await dangNhap();
      k('T3a không có biến môi trường → đăng nhập 200, hạn ĐÚNG 30 ngày = 2.592.000 s (gốc 8 h = 28.800 s)', a.status === 200 && a.giay === 30 * 86400, `HTTP ${a.status} · ${a.giay} s`);   // so BẰNG, không ngưỡng một chiều (K3)
      process.env.JWT_EXPIRES_IN = '2h';   // 2h chứ không 8h: 8h trùng mặc định CŨ, không phân biệt được "đọc biến" với "rơi về mặc định" (K3)
      const b = await dangNhap();
      k('T3b (K5) biến môi trường 2h → hạn đúng 7.200 s (biến ưu tiên)', b.status === 200 && b.giay === 7200, `HTTP ${b.status} · ${b.giay} s`);
    } finally {
      if (bienCu === undefined) delete process.env.JWT_EXPIRES_IN; else process.env.JWT_EXPIRES_IN = bienCu;
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // P26d — mã đơn trong giao dịch (C), KB20 siết (G), huỷ báo đúng sự thật (H1), gói / thẻ trong giao dịch đơn (I), thu nợ một giao dịch (P).
  const NGAY = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(/-/g, '');
  const soDon = () => so('SELECT COUNT(*) FROM pos_orders');
  const donTienMat = (them = {}) => goi('POST', '/orders', { customer_name: 'Khách P26d', items: [mon(0)], payment_method: 'cash',
    cash_amount: 25000, ...them });

  muc('[P26d C] mã đơn sinh TRONG giao dịch ghi — hai đơn chồng nhau không trùng mã');
  {
    let r2 = null;
    co.mocTruocTx = async () => { r2 = await donTienMat(); };
    const r1 = await donTienMat();
    co.mocTruocTx = null;
    const m1 = String(r1.order?.code || ''), m2 = String(r2?.order?.code || '');
    const dang = new RegExp(`^ORD-${NGAY}-\\d{3,}$`);
    k('C1 hai đơn tiền mặt chồng nhau (đơn 2 chạy trọn giữa phép kiểm và giao dịch đơn 1) → cả hai 200, hai mã khác nhau đúng dạng, số liền nhau',
      r1.status === 200 && r2?.status === 200 && m1 !== m2 && dang.test(m1) && dang.test(m2)
        && Number(m1.split('-')[2]) === Number(m2.split('-')[2]) + 1,
      `${moTa(r1)} ${m1} / ${r2 ? moTa(r2) : 'móc không chạy'} ${m2}`);
    const truoc = await soDon();
    co.banCauDau = true;
    const r3 = await donTienMat();
    co.banCauDau = false;
    k('C3 kho bận ở câu đầu giao dịch tạo đơn (câu đọc mã) → 409 KHO_BAN, không đơn mới', r3.status === 409 && r3.code === 'KHO_BAN'
      && await soDon() === truoc, `${moTa(r3)} · đơn ${truoc} → ${await soDon()}`);
    await db.run(`INSERT INTO pos_orders (code, customer_name, total, payment_method, status, created_at)
      VALUES (?, 'mã cũ', 0, 'cash', 'completed', datetime('now'))`,
      [`ORD-${NGAY}-999`]);
    const r4 = await donTienMat();
    k('C2 (K5) ngày có mã cũ ORD-<ngày>-999 → đơn mới ORD-<ngày>-1000', r4.status === 200 && r4.order?.code === `ORD-${NGAY}-1000`,
      `${moTa(r4)} · ${r4.order?.code}`);
  }

  muc('[P26d G] KB20 siết — mã dùng-một-lần, hai đơn chồng nhau → đúng 200 + 400 DISCOUNT_CODE_LIMIT_REACHED');
  {
    await db.run(`INSERT INTO pos_discount_codes (code, discount_type, discount_value, usage_limit, used_count, is_active)
      VALUES ('P26DMOTLAN', 'fixed', 5000, 1, 0, 1)`);
    const ban = () => donTienMat({ discount_code: 'P26DMOTLAN', cash_amount: 20000 });
    let r2 = null;
    co.mocTruocTx = async () => { r2 = await ban(); };
    const r1 = await ban();
    co.mocTruocTx = null;
    const mangMa = await so("SELECT COUNT(*) FROM pos_orders WHERE UPPER(discount_code) = 'P26DMOTLAN'");
    const daDung = await so("SELECT used_count FROM pos_discount_codes WHERE code = 'P26DMOTLAN'");
    k('G1 đơn 2 dùng mã trước → 200; đơn 1 → 400 DISCOUNT_CODE_LIMIT_REACHED (không 500); một đơn mang mã, used_count = 1',
      r2?.status === 200 && r1.status === 400 && r1.code === 'DISCOUNT_CODE_LIMIT_REACHED' && mangMa === 1 && daDung === 1,
      `${r2 ? moTa(r2) : 'móc không chạy'} / ${moTa(r1)} · ${mangMa} đơn mang mã · used_count ${daDung}`);
  }

  muc('[P26d H1] huỷ đơn: lỗi đọc món SAU commit không được báo 409 "chưa ghi gì"');
  {
    const d = await taoDon({ items: [mon(0)], payment_method: 'cash', cash_amount: 25000 });
    const noIn = () => so("SELECT COUNT(*) FROM pos_stock_pending WHERE order_id = ? AND direction = 'in'", [d]);
    co.banDoc = /FROM pos_order_items oi/;
    const h = await huy(d);
    co.banDoc = null;
    const st = (await mot('SELECT status FROM pos_orders WHERE id = ?', [d]))?.status;
    k('H1 huỷ đơn có món SX, câu đọc món ngoài giao dịch gặp bận → 200, đơn cancelled, có nợ kho "in" (kho SX được hoàn)',
      !!sp[0].sx_product_type && h.status === 200 && st === 'cancelled' && await noIn() === 1, `${moTa(h)} · ${st} · nợ kho in ${await noIn()}`);
  }

  muc('[P26d I] mua gói / thẻ hội viên ghi TRONG giao dịch đơn — lỗi ghi thì không báo thành công');
  {
    const sdt = sdtMoi();
    const goiId = await taoGoi(300000, 10);
    const truoc = await soDon();
    co.nemGhi = /INSERT INTO pos_customer_packages/;
    const a = await muaGoi(sdt, goiId, 10, { cash_amount: 300000 });
    co.nemGhi = null;
    const goiKhach = () => so('SELECT COUNT(*) FROM pos_customer_packages WHERE customer_phone = ?', [sdt]);
    const diem = () => so('SELECT COUNT(*) FROM pos_point_transactions WHERE customer_phone = ?', [sdt]);
    k('I1 ghi gói hỏng → 500 LOI_MAY_CHU (không 200), không đơn mới, không gói, không điểm, không lộ câu nội bộ',
      a.status === 500 && a.code === 'LOI_MAY_CHU' && !JSON.stringify(a).includes(BI_MAT) && await soDon() === truoc
        && await goiKhach() === 0 && await diem() === 0, `${moTa(a)} · đơn ${truoc} → ${await soDon()} · gói ${await goiKhach()}`);
    const b = await muaGoi(sdt, goiId, 10, { cash_amount: 300000 }, { items: [mon(0, 3, true)] });
    const cp = await goiCua(b.order?.id);
    const gan = (await mot('SELECT customer_package_id FROM pos_orders WHERE id = ?', [b.order?.id]))?.customer_package_id;
    k('I3 (K5) mua gói 10 lượt + lấy ngay 3 → 200, gói giao 3, đơn gắn customer_package_id của gói vừa mua',
      b.status === 200 && cp > 0 && await daGiao(cp) === 3 && Number(gan) === cp, `${moTa(b)} · gói ${cp} · giao ${await daGiao(cp)} · gắn ${gan}`);
    const the = await mot('SELECT id, card_price FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order LIMIT 1');
    const tien = 25000 + Number(the.card_price);
    const s2 = sdtMoi();
    const muaThe = (sdtThe) => goi('POST', '/orders', { customer_phone: sdtThe, customer_name: 'Khách P26d', items: [mon(0)],
      membership_buy: { tier_id: the.id }, payment_method: 'cash', cash_amount: tien });
    const theKhach = (x) => so('SELECT COUNT(*) FROM pos_membership_purchases WHERE customer_phone = ?', [x]);
    const truoc2 = await soDon();
    co.nemGhi = /INSERT INTO pos_membership_purchases/;
    const c = await muaThe(s2);
    co.nemGhi = null;
    k('I2 ghi thẻ hội viên hỏng → 500 LOI_MAY_CHU (không 200), không đơn mới, không thẻ', c.status === 500 && c.code === 'LOI_MAY_CHU'
      && await soDon() === truoc2 && await theKhach(s2) === 0, `${moTa(c)} · đơn ${truoc2} → ${await soDon()} · thẻ ${await theKhach(s2)}`);
    const dd = await muaThe(s2);
    const hh = await mot('SELECT expires_at FROM pos_membership_purchases WHERE order_id = ?', [dd.order?.id]);
    k('I4 (K5) mua thẻ hội viên → 200, đúng 1 dòng thẻ gắn đơn, có hạn', dd.status === 200 && await theKhach(s2) === 1 && !!hh?.expires_at,
      `${moTa(dd)} · thẻ ${await theKhach(s2)} · hạn ${hh?.expires_at}`);
  }

  muc('[P26d P] thu nợ (pay-debt) — ba lệnh ghi một giao dịch, lỗi không lộ câu nội bộ');
  {
    const sdt = sdtMoi();
    const donNo = () => taoDon({ customer_phone: sdt, items: [mon(0)], payment_method: 'debt', debt_amount: 25000 });
    const thu = (d) => goi('POST', `/orders/${d}/pay-debt`, { payment_method: 'cash', amount: 25000 });
    const anh = async (d) => {
      const o = await mot('SELECT debt_amount, cash_amount, payment_status FROM pos_orders WHERE id = ?', [d]);
      return { no: Number(o.debt_amount), tm: Number(o.cash_amount), tt: o.payment_status,
        nk: await so("SELECT COUNT(*) FROM pos_order_log WHERE order_id = ? AND loai = 'thu'", [d]),
        so: await so("SELECT COUNT(*) FROM pos_balance_transactions WHERE order_id = ? AND type = 'debt_payment'", [d]) };
    };
    const khongDoi = (x) => x.no === 25000 && x.tm === 0 && x.tt !== 'paid' && x.nk === 0 && x.so === 0;
    for (const [ma, mau, ten] of [['P1', /INSERT INTO pos_balance_transactions/, 'ghi sổ debt_payment'], ['P2', /INSERT INTO pos_order_log/, 'ghi nhật ký']]) {
      const d = await donNo();
      co.nemGhi = mau;
      const r = await thu(d);
      co.nemGhi = null;
      const x = await anh(d);
      k(`${ma} thu nợ, ${ten} hỏng → 500 LOI_MAY_CHU không lộ câu nội bộ; nợ, tiền mặt, nhật ký, sổ KHÔNG đổi`,
        r.status === 500 && r.code === 'LOI_MAY_CHU' && !JSON.stringify(r).includes(BI_MAT) && khongDoi(x), `${moTa(r)} · ${JSON.stringify(x)}`);
    }
    const d3 = await donNo();
    co.banCauDau = true;
    const r3 = await thu(d3);
    co.banCauDau = false;
    const x3 = await anh(d3);
    k('P3 thu nợ, kho bận ở câu đầu giao dịch → 409 KHO_BAN, nợ không đổi', r3.status === 409 && r3.code === 'KHO_BAN' && khongDoi(x3),
      `${moTa(r3)} · ${JSON.stringify(x3)}`);
    const d4 = await donNo();
    const r4 = await thu(d4);
    const x4 = await anh(d4);
    k('P4 (K5) thu nợ thường → 200, nợ 0, paid, tiền mặt 25.000, đúng 1 nhật ký "thu", đúng 1 dòng debt_payment',
      r4.status === 200 && x4.no === 0 && x4.tt === 'paid' && x4.tm === 25000 && x4.nk === 1 && x4.so === 1, `${moTa(r4)} · ${JSON.stringify(x4)}`);
    const r5 = await thu(d4);
    k('P5 (K5) thu lại đơn đã thu → 400 DA_THU_ROI, không thêm dòng', r5.status === 400 && r5.code === 'DA_THU_ROI' && (await anh(d4)).so === 1, moTa(r5));
    // P26d Q8c: các nhánh 400 cũ của pay-debt có `code` (LUAT §2 — cùng tình huống, cùng mã với route khác).
    {
      const d10 = await donNo();
      const r10 = await goi('POST', `/orders/${d10}/pay-debt`, { payment_method: 'momo', amount: 25000 });
      k('P10 thu nợ cách trả "momo" → 400 CACH_TRA_LA, không ghi gì', r10.status === 400 && r10.code === 'CACH_TRA_LA' && khongDoi(await anh(d10)), moTa(r10));
      const d11 = await donNo();
      const r11 = await goi('POST', `/orders/${d11}/pay-debt`, { payment_method: 'cash', amount: 30000 });
      k('P11 thu nợ 30.000 > nợ 25.000 → 400 VUOT_QUA_NO, không ghi gì', r11.status === 400 && r11.code === 'VUOT_QUA_NO' && khongDoi(await anh(d11)), moTa(r11));
      const d12 = await taoDon({ customer_phone: sdt, items: [mon(0)], payment_method: 'cash', cash_amount: 25000 });
      const r12 = await goi('POST', `/orders/${d12}/pay-debt`, { payment_method: 'cash', amount: 1000 });
      k('P12 thu nợ đơn trả đủ (paid) → 400 DA_THU_ROI', r12.status === 400 && r12.code === 'DA_THU_ROI', moTa(r12));
      const d13 = await donNo();
      await db.run("UPDATE pos_orders SET debt_amount = 0, payment_status = 'partial' WHERE id = ?", [d13]);
      const r13 = await goi('POST', `/orders/${d13}/pay-debt`, { payment_method: 'cash', amount: 1000 });
      k('P13 thu nợ đơn chưa paid mà nợ 0 → 400 DON_KHONG_NO', r13.status === 400 && r13.code === 'DON_KHONG_NO', moTa(r13));
      const d14 = await donNo();
      const h14 = await huy(d14);
      const r14 = await goi('POST', `/orders/${d14}/pay-debt`, { payment_method: 'cash', amount: 25000 });
      k('P14 thu nợ đơn đã huỷ → 400 DON_KHONG_HOP_LE', h14.status === 200 && r14.status === 400 && r14.code === 'DON_KHONG_HOP_LE', `${moTa(h14)} / ${moTa(r14)}`);
      const r15 = await goi('POST', '/orders/999999999/pay-debt', { payment_method: 'cash', amount: 1000 });
      k('P15 thu nợ đơn không có → 404 KHONG_TIM_THAY_DON', r15.status === 404 && r15.code === 'KHONG_TIM_THAY_DON', moTa(r15));
    }
    // P26d (chủ quán 19.10): amount không phải số nguyên dương hữu hạn → 400 SO_TIEN_KHONG_HOP_LE, không ghi gì.
    for (const [ten, so_] of [['chuỗi lạ "abc"', 'abc'], ['số âm −5.000', -5000], ['số lẻ 1.000,5', 1000.5], ['số 0', 0], ['chuỗi số "5000"', '5000']]) {
      const d = await donNo();
      const r = await goi('POST', `/orders/${d}/pay-debt`, { payment_method: 'cash', amount: so_ });
      const x = await anh(d);
      k(`P6 thu nợ amount ${ten} → 400 SO_TIEN_KHONG_HOP_LE; nợ, tiền mặt, nhật ký, sổ KHÔNG đổi`,
        r.status === 400 && r.code === 'SO_TIEN_KHONG_HOP_LE' && khongDoi(x), `${moTa(r)} · ${JSON.stringify(x)}`);
    }
    const d7 = await donNo();
    const r7 = await goi('POST', `/orders/${d7}/pay-debt`, { payment_method: 'transfer' });
    k('P7 (K5) thu nợ KHÔNG gửi amount → 200 thu đủ 25.000', r7.status === 200 && (await anh(d7)).no === 0, moTa(r7));
    const d8 = await donNo();
    const r8 = await goi('POST', `/orders/${d8}/pay-debt`, { payment_method: 'cash', amount: 10000 });
    const x8 = await anh(d8);
    k('P8 (K5) thu một phần 10.000 (số nguyên) → 200, còn nợ 15.000', r8.status === 200 && x8.no === 15000 && x8.tm === 10000, `${moTa(r8)} · ${JSON.stringify(x8)}`);
    // Nợ lẻ (chiết khấu % không làm tròn; nợ lấy từ máy khách lúc tạo đơn) — Q8b chủ quán GIỮ: màn Lịch sử đơn gửi amount = debt_amount trong sổ → vẫn phải thu được.
    const d9 = await donNo();
    await db.run('UPDATE pos_orders SET debt_amount = 12500.5 WHERE id = ?', [d9]);
    const r9 = await goi('POST', `/orders/${d9}/pay-debt`, { payment_method: 'cash', amount: 12500.5 });
    const x9 = await anh(d9);
    k('P9 (K5) nợ cũ lẻ 12.500,5, amount = đúng nợ trong sổ → 200, nợ 0, paid', r9.status === 200 && x9.no === 0 && x9.tt === 'paid',
      `${moTa(r9)} · ${JSON.stringify(x9)}`);
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
