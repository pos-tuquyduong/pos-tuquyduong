#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  THỬ P26b — lỗ tiền ví: hoàn hai lần, ghi ngoài giao dịch, báo hỏng tin số
 *  màn hình gửi, hoàn đơn có gói, kho bận
 * ═══════════════════════════════════════════════════════════════════════════
 *  BÀI NÀY PHẢI ĐỎ TRƯỚC KHI VÁ (K3). Chạy ở GỐC kho POS:
 *      node cong_cu/thu_P26b.js [--may-chu <thư mục server>]
 *  --may-chu: chạy trên bản sao server/ (đột biến, viec/P26b/dot_bien.py).
 *
 *  CHẠY THẬT như thu_P26a.js: database.js thật + libsql thật trên file kho TẠM,
 *  SX tắt (nên hoàn kho thật đẻ dòng nợ kho 'in' — dùng để thấy lệnh thua có
 *  chạm khối hoàn kho không). Hai công tắc bọc database.js TRƯỚC khi nạp route:
 *    co.ban       — lần mở giao dịch kế tiếp ném lỗi mã SQLITE_BUSY (ca K1)
 *    co.camNgoai  — run() NGOÀI giao dịch khớp mẫu này thì ném lỗi: bắt mọi lệnh
 *                   ghi lọt ra ngoài giao dịch (A4b, C4b)
 *  Chỉ so HTTP status, code và kho — không dò chữ (E12).
 * ═══════════════════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOC = path.join(__dirname, '..');
const iMC = process.argv.indexOf('--may-chu');
const MAY_CHU = path.resolve(iMC > 0 ? process.argv[iMC + 1] : path.join(GOC, 'server'));
const THU_MUC = fs.mkdtempSync(path.join(os.tmpdir(), 'thu_p26b_'));
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
process.env.JWT_SECRET = 'thu_p26b_' + Date.now();
process.env.POS_SERVICE_API_KEY = 'khoa_dich_vu_thu_p26b';

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

  // Công tắc — đặt TRƯỚC khi nạp route (route lấy hàm bằng destructuring lúc require).
  const co = { ban: false, camNgoai: null };
  const txGoc = db.beginTransaction, runGoc = db.run;
  db.beginTransaction = async (...a) => {
    if (co.ban) { co.ban = false; const e = new Error('SQLITE_BUSY: database is locked (giả)'); e.code = 'SQLITE_BUSY'; throw e; }
    return txGoc(...a);
  };
  db.run = async (sql, a) => {
    if (co.camNgoai && co.camNgoai.test(sql)) throw new Error('ghi ngoài giao dịch: ' + String(sql).trim().slice(0, 50));
    return runGoc(sql, a);
  };

  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'refunds', 'wallets', 'damages', 'packages']) {
    app.use('/api/pos/' + r, require(path.join(MAY_CHU, 'routes', r + '.js')));
  }
  const sv = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
  const goc = `http://127.0.0.1:${sv.address().port}/api/pos`;
  noiLai();

  const chu = await db.queryOne("SELECT id FROM pos_users WHERE role = 'owner' ORDER BY id LIMIT 1");
  const token = jwt.sign({ userId: chu.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const goi = async (method, url, body) => {
    imLang();
    try {
      const r = await fetch(goc + url, { method, body: body ? JSON.stringify(body) : undefined,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } });
      let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
      return { ...j, status: r.status };
    } finally { noiLai(); }
  };
  const moTa = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;
  const mot = async (sql, a = []) => db.queryOne(sql, a);
  const so = async (sql, a = []) => Number(Object.values((await mot(sql, a)) || { x: NaN })[0]);
  const vi = (sdt) => so('SELECT COALESCE(balance, 0) FROM pos_wallets WHERE phone = ?', [sdt]);

  // Dữ liệu nền. Đẩy id mỗi bảng đi một mốc khác (bài học P26a: bảng trống thì id trùng nhau, so nhầm vẫn xanh).
  for (const [i, bang] of ['pos_orders', 'pos_refund_requests', 'pos_balance_transactions', 'pos_damage_logs',
    'pos_customer_packages', 'pos_stock_pending'].entries()) await db.run('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)', [bang, 1000 * (i + 1)]);
  const sp = await db.query('SELECT * FROM pos_products WHERE is_active = 1 ORDER BY id LIMIT 2');
  await db.run('UPDATE pos_products SET price = 25000 WHERE id = ?', [sp[0].id]);
  await db.run('UPDATE pos_products SET price = 20000 WHERE id = ?', [sp[1].id]);
  const mon = (i, sl = 1, tuGoi = false) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type,
    sx_product_id: sp[i].sx_product_id, quantity: sl, from_package: tuGoi });
  let soSdt = 0;
  const sdtMoi = () => '0926' + String(100000 + (++soSdt));
  const nap = async (sdt, tien) => {
    const r = await goi('POST', '/wallets/topup', { phone: sdt, amount: tien, customer_name: 'Khách P26b', payment_method: 'cash' });
    if (r.status !== 200) throw new Error('không nạp được ví: ' + moTa(r));
  };
  const taoDon = async (body) => {
    const r = await goi('POST', '/orders', body);
    if (!r.success) throw new Error('không tạo được đơn: ' + moTa(r));
    return r.order.id;
  };
  const donVi = async (sdt, i = 0) => taoDon({ customer_phone: sdt, customer_name: 'Khách P26b', items: [mon(i)],
    payment_method: 'balance', balance_amount: i === 0 ? 25000 : 20000 });
  const donTien = async (sdt, items) => taoDon({ customer_phone: sdt, customer_name: 'Khách P26b', items, payment_method: 'cash',
    cash_amount: items.reduce((t, m) => t + (m.product_id === sp[0].id ? 25000 : 20000) * m.quantity, 0) });
  const huy = (id) => goi('PUT', `/orders/${id}/cancel`, { reason: 'thử P26b' });
  const xoa = (id) => goi('DELETE', `/orders/${id}`);
  const yeuCau = (id) => goi('POST', '/refunds', { order_id: id, reason: 'thử P26b' });
  const duyet = (id) => goi('POST', `/refunds/${id}/approve`, {});
  const hoan = async (id) => {
    const y = await yeuCau(id);
    const d = await duyet(y.refund_id);
    if (d.status !== 200) throw new Error('không hoàn được đơn: ' + moTa(y) + ' / ' + moTa(d));
  };
  const ycCu = async (id) => {   // yêu cầu `pending` có sẵn trong kho (dữ liệu trước bản vá)
    const o = await mot('SELECT * FROM pos_orders WHERE id = ?', [id]);
    await db.run(`INSERT INTO pos_refund_requests (order_id, customer_phone, order_total, balance_paid, refund_amount, status,
      requested_by, requested_at, reason) VALUES (?, ?, ?, ?, ?, 'pending', 'thu', datetime('now'), 'dữ liệu cũ')`,
    [id, o.customer_phone, o.total, o.balance_amount, o.balance_amount]);
    return so('SELECT MAX(id) FROM pos_refund_requests WHERE order_id = ?', [id]);
  };
  const dongHoan = (id) => so("SELECT COUNT(*) FROM pos_balance_transactions WHERE order_id = ? AND type = 'refund'", [id]);
  const noKho = (id) => so('SELECT COUNT(*) FROM pos_stock_pending WHERE order_id = ?', [id]);
  const baoHong = (id, body) => goi('POST', '/damages', { order_id: id, reason: 'damaged', reason_note: 'thử P26b', ...body });

  console.log('\nTHỬ P26b — vá lỗ tiền ví');

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A1] huỷ đơn đã hoàn → 400, ví không đổi; huỷ đơn completed vẫn chạy (K5)');
  const s1 = sdtMoi(); await nap(s1, 500000);
  {
    const d = await donVi(s1); await hoan(d);
    const v = await vi(s1), nk = await noKho(d);
    const h = await huy(d);
    k('A1a huỷ đơn đã hoàn → 400 DON_KHONG_HUY_DUOC, ví không đổi, chỉ 1 dòng hoàn, không chạm hoàn kho',
      h.status === 400 && h.code === 'DON_KHONG_HUY_DUOC' && await vi(s1) === v && await dongHoan(d) === 1 && await noKho(d) === nk,
      `${moTa(h)} · ví ${v} → ${await vi(s1)} · dòng hoàn ${await dongHoan(d)} · nợ kho ${nk} → ${await noKho(d)}`);
    const d2 = await donVi(s1); const v2 = await vi(s1);
    const h2 = await huy(d2);
    k('A1b huỷ đơn ví completed → 200, ví +25.000, đúng 1 dòng hoàn', h2.status === 200 && await vi(s1) === v2 + 25000 && await dongHoan(d2) === 1,
      `${moTa(h2)} · ví ${v2} → ${await vi(s1)}`);
    const d3 = await donTien(s1, [mon(0)]);
    const h3 = await huy(d3);
    k('A1c huỷ đơn tiền mặt completed → 200', h3.status === 200, moTa(h3));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A2] duyệt hoàn khi đơn không còn completed → 400, ví không đổi, yêu cầu không approved');
  {
    const d = await donVi(s1); const y = await yeuCau(d);
    await db.run("UPDATE pos_orders SET status = 'cancelled' WHERE id = ?", [d]);   // dữ liệu trước bản vá: huỷ không từ chối yêu cầu
    const v = await vi(s1); const r = await duyet(y.refund_id);
    const st = (await mot('SELECT status FROM pos_refund_requests WHERE id = ?', [y.refund_id]))?.status;
    k('A2a đơn đã huỷ → duyệt 400 DON_KHONG_CON_HOAN_DUOC, ví không đổi, yêu cầu không approved',
      r.status === 400 && r.code === 'DON_KHONG_CON_HOAN_DUOC' && await vi(s1) === v && st !== 'approved', `${moTa(r)} · ví ${v} → ${await vi(s1)} · ${st}`);
    const d2 = await donVi(s1); await hoan(d2); const id2 = await ycCu(d2);
    const v2 = await vi(s1); const r2 = await duyet(id2);
    const st2 = (await mot('SELECT status FROM pos_refund_requests WHERE id = ?', [id2]))?.status;
    k('A2b đơn đã hoàn → duyệt yêu cầu thứ hai 400 DON_KHONG_CON_HOAN_DUOC, ví không đổi',
      r2.status === 400 && r2.code === 'DON_KHONG_CON_HOAN_DUOC' && await vi(s1) === v2 && st2 !== 'approved', `${moTa(r2)} · ví ${v2} → ${await vi(s1)} · ${st2}`);
    const d3 = await donVi(s1); const v3 = await vi(s1); const y3 = await yeuCau(d3); const r3 = await duyet(y3.refund_id);
    const o3 = await mot('SELECT status FROM pos_orders WHERE id = ?', [d3]);
    k('A2c duyệt bình thường → 200, ví +25.000, đơn refunded (K5)', r3.status === 200 && await vi(s1) === v3 + 25000 && o3.status === 'refunded',
      `${moTa(r3)} · ví ${v3} → ${await vi(s1)} · ${o3.status}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A3] xoá đơn chỉ hoàn ví khi đơn còn completed');
  {
    const d = await donVi(s1); await hoan(d); const v = await vi(s1);
    const r = await xoa(d);
    k('A3a xoá đơn đã hoàn → 200, ví không đổi', r.status === 200 && await vi(s1) === v, `${moTa(r)} · ví ${v} → ${await vi(s1)}`);
    const d2 = await donVi(s1); await huy(d2); const v2 = await vi(s1);
    const r2 = await xoa(d2);
    k('A3b xoá đơn đã huỷ → 200, ví không đổi', r2.status === 200 && await vi(s1) === v2, `${moTa(r2)} · ví ${v2} → ${await vi(s1)}`);
    const d3 = await donVi(s1); const v3 = await vi(s1);
    const r3 = await xoa(d3);
    k('A3c xoá đơn ví completed → 200, ví +25.000, đúng 1 dòng hoàn (K5)', r3.status === 200 && await vi(s1) === v3 + 25000 && await dongHoan(d3) === 1,
      `${moTa(r3)} · ví ${v3} → ${await vi(s1)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A4] huỷ / xoá đơn → yêu cầu hoàn pending không còn duyệt được, CÙNG giao dịch');
  {
    const d = await donVi(s1); const y = await yeuCau(d); await huy(d);
    const r = await mot('SELECT status, rejection_reason FROM pos_refund_requests WHERE id = ?', [y.refund_id]);
    k("A4a huỷ đơn → yêu cầu rejected, lý do 'Đơn đã huỷ'", r?.status === 'rejected' && r.rejection_reason === 'Đơn đã huỷ', JSON.stringify(r));
    const d2 = await donVi(s1); const y2 = await yeuCau(d2);
    co.camNgoai = /pos_refund_requests/;
    const h2 = await huy(d2);
    co.camNgoai = null;
    const r2 = await mot('SELECT status FROM pos_refund_requests WHERE id = ?', [y2.refund_id]);
    k('A4b từ chối yêu cầu nằm TRONG giao dịch huỷ (ghi ngoài giao dịch bị cấm) → 200, rejected', h2.status === 200 && r2?.status === 'rejected',
      `${moTa(h2)} · ${r2?.status}`);
    const d3 = await donVi(s1); await yeuCau(d3); await xoa(d3);
    k('A4c xoá đơn → không còn yêu cầu pending của đơn', await so("SELECT COUNT(*) FROM pos_refund_requests WHERE order_id = ? AND status = 'pending'", [d3]) === 0);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[Q8] đơn có gói / thẻ hội viên → không hoàn qua yêu cầu (dùng Huỷ đơn)');
  {
    const goiId = Number((await db.run(`INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active)
      VALUES ('GOI_P26B', 'Gói P26b', 50000, 'ly', 10, 1)`)).lastInsertRowid);
    const d = await taoDon({ customer_phone: s1, customer_name: 'Khách P26b', items: [], package_buy: { package_id: goiId, total_qty: 10, pkg_qty: 1 },
      payment_method: 'balance', balance_amount: 50000 });
    const y = await yeuCau(d);
    k('Q8a POST /refunds đơn mua gói → 400 DON_CO_GOI', y.status === 400 && y.code === 'DON_CO_GOI', moTa(y));
    const id = await ycCu(d); const v = await vi(s1);
    const r = await duyet(id);
    k('Q8b duyệt yêu cầu có sẵn của đơn mua gói → 400 DON_CO_GOI, ví không đổi', r.status === 400 && r.code === 'DON_CO_GOI' && await vi(s1) === v,
      `${moTa(r)} · ví ${v} → ${await vi(s1)}`);
    const d2 = await donVi(s1);
    await db.run(`INSERT INTO pos_membership_purchases (customer_phone, tier_id, tier_name, price_paid, order_id, purchased_at, expires_at)
      VALUES (?, 1, 'Vàng', 25000, ?, datetime('now'), datetime('now', '+30 days'))`, [s1, d2]);
    const y2 = await yeuCau(d2);
    k('Q8c POST /refunds đơn mua thẻ hội viên → 400 DON_CO_GOI', y2.status === 400 && y2.code === 'DON_CO_GOI', moTa(y2));
    const h = await huy(d);
    k('Q8 K5: huỷ đơn mua gói vẫn 200 (đường hoàn đúng)', h.status === 200, moTa(h));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[C] báo hỏng — máy chủ quyết số tiền đền');
  const s2 = sdtMoi(); await nap(s2, 10000);
  {
    const d = await donTien(s2, [mon(1, 3)]);   // 3 × 20.000
    const ma = sp[1].code;
    const v = await vi(s2), nLog = await so('SELECT COUNT(*) FROM pos_damage_logs WHERE order_id = ?', [d]);
    const a = await baoHong(d, { product_code: ma, quantity: 1, action: 'refund', refund_amount: 50000 });
    k('C1a đền 50.000 cho 1 món 20.000 → 400 VUOT_GIA, ví không đổi', a.status === 400 && a.code === 'VUOT_GIA' && await vi(s2) === v, `${moTa(a)} · ví ${v} → ${await vi(s2)}`);
    const b = await baoHong(d, { product_code: ma, quantity: 1, action: 'refund', refund_amount: 50000, unit_price: 999999, damage_value: 999999 });
    k('C1b màn hình gửi kèm giá giả 999.999 → vẫn 400 VUOT_GIA (trần theo giá trong kho)', b.status === 400 && b.code === 'VUOT_GIA' && await vi(s2) === v, moTa(b));
    const am = await baoHong(d, { product_code: ma, quantity: 1, action: 'refund', refund_amount: -5000 });
    k('C1d đền số âm → 400, không thêm dòng log', am.status === 400 && await so('SELECT COUNT(*) FROM pos_damage_logs WHERE order_id = ?', [d]) === nLog, moTa(am));
    const vc = await vi(s2);
    const c1 = await baoHong(d, { product_code: ma, quantity: 1, action: 'refund', refund_amount: 7000 });
    const c2 = await baoHong(d, { product_code: ma, quantity: 1, action: 'refund', refund_amount: 20000 });
    k('C1c đền 7.000 rồi đền đúng giá 20.000 → 200, 200, ví +27.000 (K5)', c1.status === 200 && c2.status === 200 && await vi(s2) === vc + 27000,
      `${moTa(c1)} / ${moTa(c2)} · ví ${vc} → ${await vi(s2)}`);
    const dong = await mot("SELECT COUNT(*) AS n, MIN(order_id) AS o FROM pos_balance_transactions WHERE customer_phone = ? AND type = 'compensation'", [s2]);
    k('C4a dòng sổ compensation ghi order_id của đơn', Number(dong.n) === 2 && Number(dong.o) === d, JSON.stringify(dong));
  }
  {
    const d = await donTien(s2, [mon(0, 2)]);   // 2 × 25.000
    const ma = sp[0].code;
    const a = await baoHong(d, { product_code: ma, quantity: 1, action: 'return_stock', return_to_stock: true });
    const b = await baoHong(d, { product_code: ma, quantity: 1, action: 'refund' });
    const c = await baoHong(d, { product_code: ma, quantity: 1, action: 'none' });
    k('C2a món qty 2: báo return_stock 1 → 200, refund 1 → 200, none 1 → 400 VUOT_SO_LUONG',
      a.status === 200 && b.status === 200 && c.status === 400 && c.code === 'VUOT_SO_LUONG', `${moTa(a)} / ${moTa(b)} / ${moTa(c)}`);
  }
  {
    const d = await donTien(s2, [mon(0)]); await huy(d); const v = await vi(s2);
    const a = await baoHong(d, { product_code: sp[0].code, quantity: 1, action: 'refund' });
    k('C3a đơn đã huỷ → báo hỏng hoàn tiền 400 DON_KHONG_DEN_DUOC, ví không đổi', a.status === 400 && a.code === 'DON_KHONG_DEN_DUOC' && await vi(s2) === v, moTa(a));
    const b = await baoHong(d, { product_code: sp[0].code, quantity: 1, action: 'none' });
    k('C3b đơn đã huỷ → báo hỏng chỉ ghi nhận (none) → 200 (K5)', b.status === 200, moTa(b));
    await nap(s2, 25000);
    const d2 = await donVi(s2); await hoan(d2); const v2 = await vi(s2);
    const c = await baoHong(d2, { product_code: sp[0].code, quantity: 1, action: 'refund' });
    k('C3c đơn đã hoàn → báo hỏng hoàn tiền 400 DON_KHONG_DEN_DUOC, ví không đổi', c.status === 400 && c.code === 'DON_KHONG_DEN_DUOC' && await vi(s2) === v2, moTa(c));
  }
  {
    const d = await donTien(s2, [mon(1)]); const v = await vi(s2);
    co.camNgoai = /INSERT INTO pos_damage_logs/;
    const a = await baoHong(d, { product_code: sp[1].code, quantity: 1, action: 'refund' });
    co.camNgoai = null;
    k('C4b dòng log báo hỏng ghi TRONG giao dịch cùng ví + sổ (ghi ngoài giao dịch bị cấm) → 200, ví +20.000, có log',
      a.status === 200 && await vi(s2) === v + 20000 && await so('SELECT COUNT(*) FROM pos_damage_logs WHERE order_id = ?', [d]) === 1,
      `${moTa(a)} · ví ${v} → ${await vi(s2)}`);
  }
  {
    // Q6: đơn có 1 dòng lấy từ gói (0đ, đứng TRƯỚC) + 1 dòng trả tiền CÙNG mã → trần theo mọi dòng, không theo dòng đầu.
    const goiId = Number((await db.run(`INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active)
      VALUES ('GOI_P26B_2', 'Gói P26b 2', 50000, 'ly', 10, 1)`)).lastInsertRowid);
    const cp = Number((await db.run(`INSERT INTO pos_customer_packages (customer_phone, package_id, status, total_qty, delivered_qty, created_at)
      VALUES (?, ?, 'active', 10, 0, datetime('now'))`, [s2, goiId])).lastInsertRowid);
    const d = await taoDon({ customer_phone: s2, customer_name: 'Khách P26b', items: [mon(0, 1, true), mon(0)], customer_package_id: cp,
      payment_method: 'cash', cash_amount: 25000 });
    const v = await vi(s2);
    const a = await baoHong(d, { product_code: sp[0].code, quantity: 1, action: 'refund', refund_amount: 25000 });
    k('C6a đơn 1 dòng từ gói + 1 dòng trả tiền cùng mã → đền đúng giá dòng trả tiền 25.000 → 200 (K5)', a.status === 200 && await vi(s2) === v + 25000,
      `${moTa(a)} · ví ${v} → ${await vi(s2)}`);
    const b = await baoHong(d, { product_code: sp[0].code, quantity: 1, action: 'refund' });
    k('C6b báo tiếp món còn lại (từ gói) đền 25.000 → 400 VUOT_GIA (tổng đền ≤ tổng giá các dòng = 25.000)',
      b.status === 400 && b.code === 'VUOT_GIA' && await vi(s2) === v + 25000, `${moTa(b)} · ví → ${await vi(s2)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[D] POST /packages/buy đã bỏ');
  {
    const truoc = await so('SELECT COUNT(*) FROM pos_customer_packages');
    const r = await goi('POST', '/packages/buy', { customer_phone: s1, package_id: 1, total_qty: 10 });
    k('D POST /packages/buy → 404, không thêm dòng pos_customer_packages', r.status === 404 && await so('SELECT COUNT(*) FROM pos_customer_packages') === truoc,
      moTa(r));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[A5] hoàn vào ví của mỗi đơn ≤ số đơn đó đã trả bằng ví (mọi ví, kể cả đơn đã xoá)');
  {
    const ds = await db.query(`SELECT order_id, SUM(CASE WHEN type = 'refund' THEN amount ELSE 0 END) AS hoan,
        -SUM(CASE WHEN type = 'purchase' THEN amount ELSE 0 END) AS tra
      FROM pos_balance_transactions WHERE order_id IS NOT NULL GROUP BY order_id HAVING hoan > tra + 0.5`);
    k('A5 không đơn nào được hoàn vào ví nhiều hơn số đã trả bằng ví', ds.length === 0, JSON.stringify(ds));
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[K1] kho bận (SQLITE_BUSY) → 409 KHO_BAN, kho KHÔNG đổi — từng route');
  {
    const s3 = sdtMoi(); await nap(s3, 500000);
    const dHuy = await donVi(s3), dXoa = await donVi(s3), dYc = await donVi(s3), dDuyet = await donVi(s3);
    const yc = await yeuCau(dDuyet);
    const dHong = await donTien(s3, [mon(1)]);
    const chup = async () => JSON.stringify(await mot(`SELECT
      (SELECT COUNT(*) FROM pos_orders) AS don, (SELECT GROUP_CONCAT(status) FROM pos_orders) AS tt_don,
      (SELECT COUNT(*) FROM pos_balance_transactions) AS so, (SELECT COALESCE(SUM(balance), 0) FROM pos_wallets) AS vi,
      (SELECT COUNT(*) FROM pos_refund_requests) AS yc, (SELECT GROUP_CONCAT(status) FROM pos_refund_requests) AS tt_yc,
      (SELECT COUNT(*) FROM pos_damage_logs) AS hong, (SELECT COUNT(*) FROM pos_stock_pending) AS no_kho`));
    const LENH = [
      ['tạo đơn', () => goi('POST', '/orders', { customer_phone: s3, customer_name: 'K', items: [mon(0)], payment_method: 'balance', balance_amount: 25000 })],
      ['huỷ đơn', () => huy(dHuy)],
      ['xoá đơn', () => xoa(dXoa)],
      ['tạo yêu cầu hoàn', () => yeuCau(dYc)],
      ['duyệt hoàn', () => duyet(yc.refund_id)],
      ['từ chối hoàn', () => goi('POST', `/refunds/${yc.refund_id}/reject`, { reason: 'thử kho bận' })],
      ['nạp ví', () => goi('POST', '/wallets/topup', { phone: s3, amount: 10000, payment_method: 'cash' })],
      ['trừ tay', () => goi('POST', '/wallets/deduct', { phone: s3, amount: 10000 })],
      ['điều chỉnh', () => goi('POST', '/wallets/adjust', { phone: s3, amount: 10000, reason: 'thử kho bận' })],
      ['đối soát', () => goi('POST', `/wallets/${s3}/reconcile`, {})],
      ['đối soát toàn bộ', () => goi('POST', '/wallets/reconcile-all', {})],
      ['báo hỏng', () => baoHong(dHong, { product_code: sp[1].code, quantity: 1, action: 'refund' })],
    ];
    for (const [ten, lam] of LENH) {
      const truoc = await chup();
      co.ban = true;
      const r = await lam();
      const conBat = co.ban;
      co.ban = false;
      const sau = await chup();
      k(`K1 ${ten}: kho bận → 409 KHO_BAN, kho không đổi`, r.status === 409 && r.code === 'KHO_BAN' && sau === truoc,
        `${moTa(r)}${conBat ? ' · lệnh không mở giao dịch nào' : ''}${sau !== truoc ? ' · kho đổi' : ''}`);
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
