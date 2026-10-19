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
 *    co.ban       — lần mở giao dịch kế tiếp ném lỗi mã SQLITE_BUSY (ca K1, kho file: BEGIN chạy ngay)
 *    co.banCauDau — câu lệnh ĐẦU TIÊN trong giao dịch kế tiếp ném SQLITE_BUSY (ca K1b: Turso gửi BEGIN lười,
 *                   gộp vào câu đầu — @libsql/client hrana.js — nên kho bận lộ ra ở câu đầu, không ở beginTransaction)
 *    co.camNgoai  — run() NGOÀI giao dịch khớp mẫu này thì ném lỗi: bắt mọi lệnh
 *                   ghi lọt ra ngoài giao dịch (A4b, C4b)
 *  Luôn bật: run() NGOÀI giao dịch trong lúc một giao dịch đang mở → ném lỗi ngay
 *  (trên kho file nó sẽ SQLITE_BUSY và làm hỏng kết nối — bài thử sập ở chỗ khác).
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
  // P26d: co.ban = true (SQLITE_BUSY) hoặc chuỗi mã (vd 'TRANSACTION_BUSY' — dạng Turso); co.banLan = n → lần mở giao dịch THỨ n
  // (đếm từ lúc đặt) ném SQLITE_BUSY. Cả hai ném ở lớp bọc NGOÀI hàm thật — bỏ qua vòng thử lại thật, đo "hết lượt → 409".
  const co = { ban: false, banCauDau: false, camNgoai: null, banLan: 0 };
  const txGoc = db.beginTransaction, runGoc = db.run;
  let dangMo = 0;
  db.beginTransaction = async (...a) => {
    if (co.banLan && --co.banLan === 0) { const e = new Error('SQLITE_BUSY: database is locked (giả, lần n)'); e.code = 'SQLITE_BUSY'; throw e; }
    if (co.ban) {
      const ma = co.ban === true ? 'SQLITE_BUSY' : co.ban;
      co.ban = false; const e = new Error(`${ma}: database is locked (giả)`); e.code = ma; throw e;
    }
    const tx = await txGoc(...a);
    dangMo++;
    let xong = false, cauDau = co.banCauDau;
    co.banCauDau = false;
    const dong = (f) => async () => { try { return await f(); } finally { if (!xong) { xong = true; dangMo--; } } };
    const lenh = (f) => async (...b) => {
      if (cauDau) { cauDau = false; const e = new Error('SQLITE_BUSY: database is locked (giả, câu đầu)'); e.code = 'SQLITE_BUSY'; throw e; }
      return f(...b);
    };
    return { ...tx, query: lenh(tx.query), queryOne: lenh(tx.queryOne), run: lenh(tx.run), commit: dong(tx.commit), rollback: dong(tx.rollback) };
  };
  db.run = async (sql, a) => {
    if (co.camNgoai && co.camNgoai.test(sql)) throw new Error('ghi ngoài giao dịch: ' + String(sql).trim().slice(0, 50));
    if (dangMo) throw new Error('run() ngoài giao dịch trong lúc giao dịch đang mở: ' + String(sql).trim().slice(0, 50));
    return runGoc(sql, a);
  };

  const app = express();
  app.use(express.json());
  for (const r of ['orders', 'refunds', 'wallets', 'damages', 'packages', 'backup']) {   // backup: P26d F
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
    const d4 = await donVi(s1); const y4 = await yeuCau(d4);
    await goi('POST', `/refunds/${y4.refund_id}/reject`, { reason: 'thử P26b' });
    const v4 = await vi(s1); const r4 = await duyet(y4.refund_id);
    const st4 = (await mot('SELECT status FROM pos_refund_requests WHERE id = ?', [y4.refund_id]))?.status;
    k('A2d duyệt yêu cầu đã bị từ chối (đơn vẫn completed) → 400 YEU_CAU_DA_XU_LY, ví không đổi, vẫn rejected',
      r4.status === 400 && r4.code === 'YEU_CAU_DA_XU_LY' && await vi(s1) === v4 && st4 === 'rejected', `${moTa(r4)} · ví ${v4} → ${await vi(s1)} · ${st4}`);
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
    // P26c Q3 (chủ quán chốt 12.10): "Hoàn tiền" BẮT BUỘC số > 0 — gửi 0 / không gửi số → 400, ví không đổi (trước P26c: đền ĐỦ giá).
    //   Đơn RIÊNG + ví riêng: trên gốc ca này đền đủ — dùng chung đơn thì C1c / C4a đỏ lây (K3: mỗi ca vi phạm đúng một phép).
    const sQ3 = sdtMoi();   // khách chưa có ví — vi() ra NaN, nên đếm dòng sổ ví
    const dongVi = (sdt) => so('SELECT COUNT(*) FROM pos_balance_transactions WHERE customer_phone = ?', [sdt]);
    const dQ3 = await donTien(sQ3, [mon(1, 2)]);
    const q0 = await baoHong(dQ3, { product_code: ma, quantity: 1, action: 'refund', refund_amount: 0 });
    const qt = await baoHong(dQ3, { product_code: ma, quantity: 1, action: 'refund' });
    k('C1e hoàn tiền gửi 0 / không gửi số → 400, 400, không dòng sổ ví nào, không thêm dòng log', q0.status === 400 && qt.status === 400
      && await dongVi(sQ3) === 0 && await so('SELECT COUNT(*) FROM pos_damage_logs WHERE order_id = ?', [dQ3]) === 0,
    `${moTa(q0)} / ${moTa(qt)} · ${await dongVi(sQ3)} dòng sổ ví`);
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
    const b = await baoHong(d, { product_code: ma, quantity: 1, action: 'refund', refund_amount: 25000 });   // P26c Q3: hoàn tiền phải có số
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
    const a = await baoHong(d, { product_code: sp[1].code, quantity: 1, action: 'refund', refund_amount: 20000 });   // P26c Q3
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
    const b = await baoHong(d, { product_code: sp[0].code, quantity: 1, action: 'refund', refund_amount: 25000 });   // P26c Q3
    k('C6b báo tiếp món còn lại (từ gói) đền 25.000 → 400 VUOT_GIA (tổng đền ≤ tổng giá các dòng = 25.000)',
      b.status === 400 && b.code === 'VUOT_GIA' && await vi(s2) === v + 25000, `${moTa(b)} · ví → ${await vi(s2)}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  muc('[MẸ] ví mẹ (parent_phone / parent_balance_amount — Sales.jsx gửi): trừ đúng, hoàn đúng MỘT lần (soát vòng 3)');
  {
    const me = sdtMoi(), con = sdtMoi(); await nap(me, 100000); await nap(con, 50000);
    const donMe = (conTra = 0) => taoDon({ customer_phone: con, customer_name: 'Con P26b', parent_phone: me, items: [mon(0)],
      payment_method: 'cash', cash_amount: 0, balance_amount: conTra, parent_balance_amount: 25000 - conTra });
    const v0 = await vi(me);
    const d = await donMe();
    k('M1 đơn trả ví mẹ 25.000 → ví mẹ −25.000 (K5)', await vi(me) === v0 - 25000, `ví mẹ ${v0} → ${await vi(me)}`);
    const h = await huy(d);
    k('M2 huỷ đơn trả ví mẹ → 200, ví mẹ +25.000 đúng một lần (K5)', h.status === 200 && await vi(me) === v0, `${moTa(h)} · ví mẹ ${v0} → ${await vi(me)}`);
    const v3 = await vi(me); const d3 = await donMe(); const x3 = await xoa(d3);
    k('M3 xoá đơn trả ví mẹ completed → 200, ví mẹ về như trước đơn (K5)', x3.status === 200 && await vi(me) === v3, `${moTa(x3)} · ví mẹ ${v3} → ${await vi(me)}`);
    const d4 = await donMe(); await huy(d4); const v4 = await vi(me); const x4 = await xoa(d4);
    k('M4 xoá đơn trả ví mẹ ĐÃ HUỶ → ví mẹ không đổi', x4.status === 200 && await vi(me) === v4, `${moTa(x4)} · ví mẹ ${v4} → ${await vi(me)}`);
    // Q9 = (a) (chủ quán chốt sau soát vòng 4): duyệt hoàn trả CẢ phần ví mẹ, cùng giao dịch, sau cổng đơn; yêu cầu vẫn
    // chỉ ghi phần ví con. Mỗi ca tự đỏ trên gốc, không nhờ trạng thái ca trước (K3).
    const dongHoanVi = (id, sdt) => so("SELECT COUNT(*) FROM pos_balance_transactions WHERE order_id = ? AND type = 'refund' AND customer_phone = ?", [id, sdt]);
    const d5 = await donMe(5000);   // con trả 5.000 ví, mẹ trả 20.000
    const vMe5 = await vi(me), vCon5 = await vi(con);
    const y5 = await yeuCau(d5); const r5 = await duyet(y5.refund_id);
    const yc5 = await mot('SELECT refund_amount FROM pos_refund_requests WHERE id = ?', [y5.refund_id]);
    k('M5 duyệt hoàn đơn con 5.000 + mẹ 20.000 → 200, ví mẹ +20.000 đúng MỘT dòng refund, ví con +5.000, yêu cầu ghi 5.000',
      r5.status === 200 && await vi(me) === vMe5 + 20000 && await dongHoanVi(d5, me) === 1 && await vi(con) === vCon5 + 5000
        && Number(yc5?.refund_amount) === 5000,
      `${moTa(r5)} · ví mẹ ${vMe5} → ${await vi(me)} (${await dongHoanVi(d5, me)} dòng) · ví con ${vCon5} → ${await vi(con)} · yêu cầu ${yc5?.refund_amount}`);
    const d6 = await donMe(5000); await hoan(d6);
    const v6 = await vi(me);
    const h6 = await huy(d6); const x6 = await xoa(d6);
    k('M6 đơn có ví mẹ đã duyệt hoàn → huỷ 400, xoá 200, ví mẹ KHÔNG được hoàn thêm (hoàn mẹ đúng 1 dòng)',
      h6.status === 400 && x6.status === 200 && await vi(me) === v6 && await dongHoanVi(d6, me) === 1,
      `${moTa(h6)} / ${moTa(x6)} · ví mẹ ${v6} → ${await vi(me)} · ${await dongHoanVi(d6, me)} dòng hoàn mẹ`);
    const d8 = await donMe(5000); const y8 = await yeuCau(d8);
    await db.run("UPDATE pos_orders SET status = 'cancelled' WHERE id = ?", [d8]);   // dữ liệu cũ: đơn huỷ, yêu cầu còn chờ
    const v8 = await vi(me); const r8 = await duyet(y8.refund_id);
    k('M8 đơn có ví mẹ đã huỷ (yêu cầu còn chờ) → duyệt 400 DON_KHONG_CON_HOAN_DUOC, ví mẹ không đổi',
      r8.status === 400 && r8.code === 'DON_KHONG_CON_HOAN_DUOC' && await vi(me) === v8, `${moTa(r8)} · ví mẹ ${v8} → ${await vi(me)}`);
    // HOC-2b (Q9): phần mẹ 0đ → không ghi dòng hoàn mẹ (phép `> 0`); yêu cầu cũ trên đơn có ví mẹ vẫn hoàn mẹ đúng 1 dòng.
    const d9 = await donMe(25000); const vMe9 = await vi(me);
    const r9 = await duyet((await yeuCau(d9)).refund_id);
    k('M9 đơn có ví mẹ, phần mẹ 0đ → duyệt 200, 0 dòng hoàn mẹ, ví mẹ không đổi',
      r9.status === 200 && await dongHoanVi(d9, me) === 0 && await vi(me) === vMe9,
      `${moTa(r9)} · ví mẹ ${vMe9} → ${await vi(me)} · ${await dongHoanVi(d9, me)} dòng hoàn mẹ`);
    const d10 = await donMe(5000); const vMe10 = await vi(me);
    const r10 = await duyet(await ycCu(d10));
    k('M10 yêu cầu cũ (dữ liệu trước bản vá) trên đơn có ví mẹ → duyệt 200, ví mẹ +20.000, hoàn mẹ đúng 1 dòng',
      r10.status === 200 && await vi(me) === vMe10 + 20000 && await dongHoanVi(d10, me) === 1,
      `${moTa(r10)} · ví mẹ ${vMe10} → ${await vi(me)} · ${await dongHoanVi(d10, me)} dòng hoàn mẹ`);
    const me2 = sdtMoi(); await nap(me2, 10000);
    const t = await goi('POST', '/orders', { customer_phone: con, customer_name: 'Con P26b', parent_phone: me2, items: [mon(0)],
      payment_method: 'cash', cash_amount: 0, parent_balance_amount: 25000 });
    k('M7 ví mẹ không đủ → 400 SO_DU_KHONG_DU, ví mẹ không đổi', t.status === 400 && t.code === 'SO_DU_KHONG_DU' && await vi(me2) === 10000, moTa(t));
  }

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
    for (const [ma, cong, kieu] of [['K1', 'ban', 'lúc mở giao dịch'], ['K1b', 'banCauDau', 'ở câu đầu trong giao dịch (Turso)']]) {
      for (const [ten, lam] of LENH) {
        const truoc = await chup();
        co[cong] = true;
        const r = await lam();
        const conBat = co[cong];
        co[cong] = false;
        const sau = await chup();
        k(`${ma} ${ten}: kho bận ${kieu} → 409 KHO_BAN, kho không đổi`, r.status === 409 && r.code === 'KHO_BAN' && sau === truoc,
          `${moTa(r)}${conBat ? ' · lệnh không mở giao dịch nào' : ''}${sau !== truoc ? ' · kho đổi' : ''}`);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // P26d — ví NULL / tổng chi âm (E), đối soát dừng giữa chừng (D), thử lại BEGIN + laLoiBan (A, B), khôi phục (F),
  // kho bận THẬT (A — CUỐI bài: trên gốc nó làm hỏng kết nối dùng chung, các ca sau sẽ đỏ sai câu).
  const BI_MAT = 'P26D_CHUOI_NOI_BO';
  const loiGia = (ma) => { const e = new Error(`${ma}: ${BI_MAT} (giả)`); e.code = ma; return e; };
  const tho = (sdt) => mot('SELECT balance, total_topup, total_spent FROM pos_wallets WHERE phone = ?', [sdt]);

  muc('[P26d E] ví: balance / cột tổng NULL đọc như 0; ví tạo lại lúc hoàn không có tổng chi âm');
  {
    const s = sdtMoi();
    await db.run('INSERT INTO pos_wallets (phone, balance, total_topup, total_spent) VALUES (?, NULL, 0, 0)', [s]);
    const r = await goi('POST', '/wallets/topup', { phone: s, amount: 10000, payment_method: 'cash' });
    const w = await tho(s);
    const d = await mot('SELECT balance_before AS t, balance_after AS s FROM pos_balance_transactions WHERE customer_phone = ? ORDER BY id DESC LIMIT 1', [s]);
    k('V1 ví balance NULL (dữ liệu cũ) → nạp 10.000 → 200, balance = 10.000 (không NULL), sổ 0 → 10.000',
      r.status === 200 && w?.balance !== null && Number(w?.balance) === 10000 && Number(d?.t) === 0 && Number(d?.s) === 10000,
      `${moTa(r)} · ${JSON.stringify(w)} · sổ ${JSON.stringify(d)}`);
    const s2 = sdtMoi();
    await db.run('INSERT INTO pos_wallets (phone, balance, total_topup, total_spent) VALUES (?, 50000, NULL, NULL)', [s2]);
    const a = await goi('POST', '/wallets/topup', { phone: s2, amount: 10000, payment_method: 'cash' });
    const b = await goi('POST', '/wallets/deduct', { phone: s2, amount: 5000 });
    const w2 = await tho(s2);
    k('V2 ví total_topup / total_spent NULL → nạp 10.000, trừ 5.000 → hai cột 10.000 / 5.000 (không NULL)', a.status === 200 && b.status === 200
      && w2?.total_topup !== null && w2?.total_spent !== null && Number(w2.total_topup) === 10000 && Number(w2.total_spent) === 5000,
    `${moTa(a)} / ${moTa(b)} · ${JSON.stringify(w2)}`);
    const s3 = sdtMoi(); await nap(s3, 30000);
    const d3 = await donVi(s3);
    await db.run('DELETE FROM pos_wallets WHERE phone = ?', [s3]);   // ví mất (xoá tay / khôi phục thiếu)
    const h3 = await huy(d3);
    const w3 = await tho(s3);
    k('V3 ví đã mất, huỷ đơn trả ví 25.000 → ví tạo lại: balance 25.000, total_spent 0 (không âm)', h3.status === 200
      && Number(w3?.balance) === 25000 && w3?.total_spent !== null && Number(w3?.total_spent) === 0, `${moTa(h3)} · ${JSON.stringify(w3)}`);
    const s4 = sdtMoi(); await nap(s4, 50000);
    const d4 = await donVi(s4);
    const chi = Number((await tho(s4)).total_spent);
    const h4 = await huy(d4);
    const w4 = await tho(s4);
    k('V4 (K5) ví đang có: mua 25.000 → tổng chi 25.000; huỷ → tổng chi 0, số dư 50.000 (cộng tương đối như cũ)', chi === 25000
      && h4.status === 200 && Number(w4.total_spent) === 0 && Number(w4.balance) === 50000, `chi ${chi} · ${moTa(h4)} · ${JSON.stringify(w4)}`);
  }

  muc('[P26d D] đối soát toàn bộ dừng giữa chừng → không 409 "chưa ghi gì", báo ví đã xong / ví dừng');
  {
    const lech = async () => new Map((await db.query(`SELECT w.phone, w.balance - COALESCE((SELECT SUM(t.amount) FROM pos_balance_transactions t
        WHERE t.customer_phone = w.phone AND t.type IN ('topup', 'purchase', 'refund', 'adjust', 'compensation')), 0) AS l FROM pos_wallets w
        WHERE w.phone IN (SELECT customer_phone FROM pos_balance_transactions WHERE type IN ('topup', 'purchase', 'refund', 'adjust', 'compensation'))`))
      .map((x) => [x.phone, Number(x.l)]));
    await db.run('UPDATE pos_wallets SET balance = COALESCE(balance, 0) + 1');
    const truoc = await lech();
    co.banLan = 2;
    const r = await goi('POST', '/wallets/reconcile-all', {});
    co.banLan = 0;
    const sau = await lech();
    const p1 = r.results?.[0]?.phone, p2 = r.dung_o;
    k('H2 lần mở giao dịch thứ 2 gặp bận → 500 DOI_SOAT_DO_DANG, checked 1; ví đã xong khớp sổ, ví dừng chưa đổi',
      r.status === 500 && r.code === 'DOI_SOAT_DO_DANG' && r.checked === 1 && !!p1 && !!p2 && p1 !== p2 && sau.get(p1) === 0
        && truoc.get(p2) !== 0 && sau.get(p2) === truoc.get(p2), `${moTa(r)} · checked ${r.checked} · ${p1}: ${truoc.get(p1)} → ${sau.get(p1)} · ${p2}: ${truoc.get(p2)} → ${sau.get(p2)}`);
    const r2 = await goi('POST', '/wallets/reconcile-all', {});
    const conLech = [...(await lech()).values()].filter((x) => x !== 0).length;
    k('H2b (K5) đối soát toàn bộ chạy lại → 200, mọi ví có sổ khớp sổ', r2.status === 200 && conLech === 0, `${moTa(r2)} · còn lệch ${conLech}`);
  }

  muc('[P26d A/B] thử lại BEGIN CHỈ khi bận; mã bận dùng chung (laLoiBan); 500 không lộ câu nội bộ');
  {
    const CHO = db.CHO_BEGIN_MS;
    k('D0 CHO_BEGIN_MS: ≥ 1 lượt, mỗi lượt > 0, tổng chờ ≤ 2.000 ms', Array.isArray(CHO) && CHO.length >= 1 && CHO.every((x) => x > 0)
      && CHO.reduce((t, x) => t + x, 0) <= 2000, JSON.stringify(CHO));
    const s = sdtMoi(); await nap(s, 100000);
    const napThu = () => goi('POST', '/wallets/topup', { phone: s, amount: 1000, payment_method: 'cash' });
    const soDu = async () => Number((await tho(s)).balance);
    // Vá tạm client libsql THẬT: mỗi lần mở giao dịch gọi lam(lần, mởThật). Thay kết nối (kho file, lỗi bận) thì vá tự rơi.
    const vaMo = (lam) => {
      const c = db.getDb(), goc = c.transaction;
      let lan = 0;
      c.transaction = async (...a) => { lan++; return lam(lan, () => goc.apply(c, a)); };
      return { lan: () => lan, go: () => { c.transaction = goc; } };
    };
    for (const ma of ['SQLITE_IOERR', 'TRANSACTION_CLOSED', 'TRANSACTION_TIMEOUT', 'SQLITE_BUSYX']) {
      const v0 = await soDu();
      const va = vaMo(() => { throw loiGia(ma); });
      const r = await napThu();
      va.go();
      k(`D4 mở giao dịch lỗi ${ma} (không phải bận) → 500 LOI_MAY_CHU, mở đúng 1 lần, không lộ câu nội bộ, ví không đổi`,
        r.status === 500 && r.code === 'LOI_MAY_CHU' && va.lan() === 1 && !JSON.stringify(r).includes(BI_MAT) && await soDu() === v0,
        `${moTa(r)} · mở ${va.lan()} lần`);
    }
    for (const ma of ['TRANSACTION_BUSY', 'SQLITE_BUSY_SNAPSHOT']) {
      const v0 = await soDu();
      const va = vaMo((lan, mo) => { if (lan === 1) throw loiGia(ma); return mo(); });
      const r = await napThu();
      va.go();
      k(`D5 mở giao dịch lần đầu lỗi bận ${ma} → thử lại → 200, ví +1.000`, r.status === 200 && await soDu() === v0 + 1000, moTa(r));
    }
    {
      const v0 = await soDu();
      let txHong = null;
      const va = vaMo(async (lan, mo) => {
        const tx = await mo();
        if (lan === 1) {   // BEGIN lười của Turso hỏng ở câu ĐẦU (hrana gộp BEGIN với câu đầu)
          txHong = tx;
          const exe = tx.execute.bind(tx);
          let dau = true;
          tx.execute = async (st) => { if (dau) { dau = false; throw loiGia('SQLITE_BUSY'); } return exe(st); };
        }
        return tx;
      });
      const r = await napThu();
      va.go();
      const r2 = await napThu();
      k('D8 câu ĐẦU trong giao dịch gặp bận (dạng Turso) → thử lại → 200; giao dịch hỏng đã đóng (lệnh kế tiếp 200), ví +2.000',
        r.status === 200 && r2.status === 200 && await soDu() === v0 + 2000, `${moTa(r)} / ${moTa(r2)}`);
      // Dọn SAU khi chấm: bản vá đã đóng thì không làm gì (close = ROLLBACK nếu còn mở); vá thiếu đóng thì khoá rò làm mọi ca sau sập.
      try { if (txHong) txHong.close(); } catch { /* đã đóng */ }
    }
    {
      const v0 = await soDu();
      co.ban = 'TRANSACTION_BUSY';
      const r = await napThu();
      co.ban = false;
      k('D9 kho bận dạng Turso (TRANSACTION_BUSY) hết lượt → loiGhi trả 409 KHO_BAN, ví không đổi', r.status === 409 && r.code === 'KHO_BAN'
        && await soDu() === v0, moTa(r));
    }
  }

  muc('[P26d F] khôi phục sao lưu KHÔNG ghi các trang tiền (ví, đơn, chi tiết đơn, sổ ví, yêu cầu hoàn, điểm, gói, thẻ, voucher, đền bù, mã giảm) — chặn trước mọi ghi');
  {
    const XLSX = require(path.join(GOC, 'node_modules', 'xlsx'));
    const khoiPhuc = async (trang) => {
      const wb = XLSX.utils.book_new();
      for (const [ten, dong] of trang) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dong), ten);
      const fd = new FormData();
      fd.append('file', new Blob([XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })]), 'p26d.xlsx');
      imLang();
      try {
        const r = await fetch(goc + '/backup/restore', { method: 'POST', body: fd, headers: { Authorization: 'Bearer ' + token } });
        let j = {}; try { j = await r.json(); } catch { /* không phải JSON */ }
        return { ...j, status: r.status };
      } finally { noiLai(); }
    };
    const chup = async (bang) => JSON.stringify(await db.query(`SELECT * FROM ${bang} ORDER BY rowid`));
    const nhatKy = [{ type: 'p26d', file_name: 'thu.xlsx', record_count: 1, status: 'success' }];
    // "Nhật ký đồng bộ" ĐỨNG TRƯỚC "Số dư" (cố ý): bản vá chặn trong vòng sẽ đã xoá + ghi trang trước rồi mới chặn.
    const nk0 = await chup('pos_sync_logs'), vi0 = await chup('pos_wallets');
    const a = await khoiPhuc([['Nhật ký đồng bộ', nhatKy], ['Số dư', [{ phone: '0999000001', balance: 999999, total_topup: 0, total_spent: 0 }]]]);
    k('F1 file có trang "Số dư" (sau một trang thường) → 400 KHOI_PHUC_VI_DON_BI_CHAN; pos_sync_logs VÀ pos_wallets không đổi',
      a.status === 400 && a.code === 'KHOI_PHUC_VI_DON_BI_CHAN' && await chup('pos_sync_logs') === nk0 && await chup('pos_wallets') === vi0, moTa(a));
    for (const [nhan, bang] of [['Đơn hàng', 'pos_orders'], ['Chi tiết đơn', 'pos_order_items'], ['Giao dịch số dư', 'pos_balance_transactions'],
      ['Yêu cầu hoàn tiền', 'pos_refund_requests'], ['Giao dịch điểm thưởng', 'pos_point_transactions'], ['Gói của khách', 'pos_customer_packages'],
      ['Lịch sử mua thẻ', 'pos_membership_purchases'], ['Voucher đã phát', 'pos_voucher_grants'], ['Hàng hỏng', 'pos_damage_logs'],
      ['Mã chiết khấu', 'pos_discount_codes']]) {
      const truoc = await chup(bang);
      const r = await khoiPhuc([[nhan, [{ id: 999999 }]]]);
      k(`F2 file có trang "${nhan}" → 400 KHOI_PHUC_VI_DON_BI_CHAN, ${bang} không đổi`, r.status === 400 && r.code === 'KHOI_PHUC_VI_DON_BI_CHAN'
        && await chup(bang) === truoc, moTa(r));
    }
    const c = await khoiPhuc([['Nhật ký đồng bộ', nhatKy]]);
    k('F3 (K5) file chỉ có trang không dính tiền (Nhật ký đồng bộ) → 200, khôi phục đúng 1 dòng',
      c.status === 200 && await so("SELECT COUNT(*) FROM pos_sync_logs WHERE type = 'p26d'") === 1, moTa(c));
  }

  muc('[P26d A] kho bận THẬT — client libsql thứ hai giữ khoá ghi trên cùng file kho');
  {
    const { createClient } = require(path.join(GOC, 'node_modules', '@libsql', 'client'));
    const c2 = createClient({ url: 'file:' + FILE_KHO });
    const doc2 = async (sql, a = []) => (await c2.execute({ sql, args: a })).rows[0];
    const s = sdtMoi(); await nap(s, 100000);
    const soDu2 = async () => Number((await doc2('SELECT balance FROM pos_wallets WHERE phone = ?', [s]))?.balance);
    const dem2 = async (loai) => Number((await doc2('SELECT COUNT(*) AS n FROM pos_sync_logs WHERE type = ?', [loai])).n);
    const napThu = () => goi('POST', '/wallets/topup', { phone: s, amount: 1000, payment_method: 'cash' });
    const ngu = (ms) => new Promise((ok) => setTimeout(ok, ms));

    const v1 = await soDu2();
    let giu = await c2.transaction('write');
    const nha = ngu(150).then(() => giu.rollback());
    const r1 = await napThu();
    await nha;
    k('D1 kho bận 150 ms (người khác đang ghi) → chờ rồi thử lại → 200, ví +1.000 (đọc bằng kết nối khác)', r1.status === 200
      && await soDu2() === v1 + 1000, `${moTa(r1)} · ví ${v1} → ${await soDu2()}`);

    const v2 = await soDu2();
    giu = await c2.transaction('write');
    const t0 = Date.now();
    const r2 = await napThu();
    const ms = Date.now() - t0;
    await giu.rollback();
    k('D2 kho bận suốt → 409 KHO_BAN sau khi chờ đủ lượt (1,4–2,5 s), ví không đổi', r2.status === 409 && r2.code === 'KHO_BAN'
      && ms >= 1400 && ms <= 2500 && await soDu2() === v2, `${moTa(r2)} · ${ms} ms`);

    const ghiNhatKy = async (loai) => { try { await db.run('INSERT INTO pos_sync_logs (type, file_name) VALUES (?, ?)', [loai, 'x']); return null; } catch (e) { return e; } };
    const r3 = await napThu();
    const e3 = await ghiNhatKy('p26d_d3');
    k('D3 sau một lần BEGIN bận: nạp → 200 và ví +1.000 THẬT; lệnh run sau đó ghi THẬT (kết nối không hỏng)', r3.status === 200 && !e3
      && await soDu2() === v2 + 1000 && await dem2('p26d_d3') === 1,
    `${moTa(r3)} · ví ${v2} → ${await soDu2()} · run ${e3 ? e3.code : 'ok'}, dòng ${await dem2('p26d_d3')}`);

    giu = await c2.transaction('write');
    const e7 = await ghiNhatKy('p26d_d7a');
    await giu.rollback();
    const e7b = await ghiNhatKy('p26d_d7b');
    k('D7 run ngoài giao dịch gặp bận thật → ném SQLITE_BUSY; run kế tiếp ghi THẬT (kết nối được thay)', e7?.code === 'SQLITE_BUSY' && !e7b
      && await dem2('p26d_d7a') === 0 && await dem2('p26d_d7b') === 1,
    `${e7?.code} / ${e7b ? e7b.code : 'ok'} · d7a ${await dem2('p26d_d7a')} · d7b ${await dem2('p26d_d7b')}`);
    c2.close();
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
