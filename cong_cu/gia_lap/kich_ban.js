/**
 * GIẢ LẬP QUẦY (TU-CHAY-4) — dữ liệu mẫu cố định + kịch bản quầy.
 *
 * Mỗi kịch bản gọi API ĐÚNG như nhân viên bấm (không chép logic máy chủ), ghi
 * mong đợi HTTP bằng status + `code` (không dò chữ — E12), và ghi SỔ PHÍA QUẦY
 * (lệnh thu / đổi cách trả trả 200) để bat_bien.js I9 đối chiếu nhật ký đơn.
 *
 * LUẬT: việc sau THÊM kịch bản mới vào cuối, KHÔNG xoá kịch bản cũ — chúng là
 * lưới chống lỗi quay lại. Bộ kiểm có bánh cóc số kịch bản (chỉ được tăng).
 * Kịch bản mới phải vào đúng MỘT lượt trong LUOT (cuối file — TACH-GL).
 */
const KH = { quen: '0900000001', no: '0900000002', moi: '0900000003' };
const GIA = [25000, 20000, 30000, 15000, 35000];
let soSdt = 0;
const sdtMoi = () => '09' + String(20000000 + (++soSdt));

/** Gắn công cụ quầy vào ctx rồi dựng dữ liệu mẫu B4. Sai bất kỳ khẳng định nào → ném lỗi (giả lập sập). */
async function dungDuLieu(c) {
  const { db, goi } = c;
  // E4 (P26b): đẩy id mỗi bảng đi một mốc khác — id máy chủ trả mà trùng nhầm id bảng khác thì kịch bản vẫn xanh (bài học P26a).
  for (const [i, bang] of ['pos_orders', 'pos_refund_requests', 'pos_balance_transactions', 'pos_damage_logs'].entries()) {
    if (!(await db.run('UPDATE sqlite_sequence SET seq = ? WHERE name = ?', [1000 * (i + 1), bang])).changes) {
      await db.run('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)', [bang, 1000 * (i + 1)]);
    }
  }
  c.taoDon = async (ten, body, ai = 'chu') => {
    const r = await goi(ai, 'POST', '/orders', body);
    if (!r.success) throw new Error(`không tạo được đơn "${ten}": HTTP ${r.status} ${r.error || ''}`);
    return { ...(await db.queryOne('SELECT * FROM pos_orders WHERE id = ?', [r.order.id])), ma: r.order.signup_code };
  };
  c.thu = async (ai, id, cach, soTien) => {
    const r = await goi(ai, 'POST', `/orders/${id}/pay-debt`, { payment_method: cach, amount: soTien });
    if (r.status === 200) c.soQuay.thu.set(id, [...(c.soQuay.thu.get(id) || []), r.data.paid_amount]);
    return r;
  };
  c.doi = async (id, sang, lyDo) => {
    const r = await goi('chu', 'POST', `/orders/${id}/doi-cach-tra`, { sang, ly_do: lyDo });
    if (r.status === 200) c.soQuay.doi.set(id, (c.soQuay.doi.get(id) || 0) + 1);
    return r;
  };
  c.claim = (ma, phone = sdtMoi()) => goi('dv', 'POST', '/signup-codes/claim', { code: ma, phone });
  c.nhanDiem = (ma, phone = sdtMoi()) => goi('dv', 'POST', '/signup-codes/nhan-diem', { code: ma, phone });
  c.vi = async (sdt) => Number((await db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [sdt]))?.balance ?? NaN);
  c.so = async (sql, a = []) => Number(Object.values((await db.queryOne(sql, a)) || { x: NaN })[0]);
  c.dongHoan = (id) => c.so("SELECT COUNT(*) FROM pos_balance_transactions WHERE order_id = ? AND type = 'refund'", [id]);
  c.nap = (sdt, tien) => goi('chu', 'POST', '/wallets/topup', { phone: sdt, amount: tien, customer_name: 'Khách', payment_method: 'cash' });
  c.huy = (id) => goi('chu', 'PUT', `/orders/${id}/cancel`, { reason: 'giả lập' });
  c.yeuCau = (id) => goi('nv', 'POST', '/refunds', { order_id: id, reason: 'giả lập' });
  c.duyet = (id) => goi('chu', 'POST', `/refunds/${id}/approve`, {});
  c.baoHong = (id, body) => goi('chu', 'POST', '/damages', { order_id: id, reason: 'damaged', reason_note: 'giả lập', ...body });
  // Chồng nhau TẤT ĐỊNH (như KB11): `chen` chạy NGUYÊN một lệnh khác ngay trước khi lệnh `lam` mở giao dịch.
  // Lệnh không mở giao dịch nào thì móc không chạy → trả null (kịch bản phải coi là lệch).
  c.chong = async (chen, lam) => {
    let r1 = null;
    c.moc.truocTx = async () => { r1 = await chen(); };
    try { const r2 = await lam(); return [r1, r2]; } finally { c.moc.truocTx = null; }
  };
  c.ma = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;

  const dat = (k, v) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [k, v]);
  for (const [k, v] of [['signup_enabled', '1'], ['signup_discount_type', 'percent'], ['signup_discount_value', '10'],
    ['nhandiem_enabled', '1'], ['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['flash_enabled', 'false']]) await dat(k, v);
  const sp = await db.query("SELECT * FROM pos_products WHERE is_active = 1 AND COALESCE(sx_product_type, '') <> '' ORDER BY id LIMIT 5");
  if (sp.length !== 5) throw new Error(`dữ liệu mẫu: cần 5 món có mã SX, có ${sp.length}`);
  for (const [i, p] of sp.entries()) await db.run('UPDATE pos_products SET price = ? WHERE id = ?', [GIA[i], p.id]);
  c.sp = sp;
  // P26b (KB14): món KHÔNG mã SX — xoá đơn có món SX làm I7 lệch vì vân tay kho (lỗi có sẵn, ke_hoach Phát hiện 4).
  const mk = await db.run(`INSERT INTO pos_products (code, name, category, price, unit, is_active)
    VALUES ('MON_KHONG_SX', 'Món không mã SX', 'khac', 10000, 'ly', 1)`);
  c.monKhongSx = { product_id: Number(mk.lastInsertRowid), quantity: 1 };
  c.mon = (i, sl = 1, tuGoi = false) => ({ product_id: sp[i].id, sx_product_type: sp[i].sx_product_type,
    sx_product_id: sp[i].sx_product_id, quantity: sl, from_package: tuGoi });
  c.goiId = Number((await db.run(`INSERT INTO pos_packages (code, name, price, unit, total_qty, is_active)
    VALUES ('GOI_GL', 'Gói giả lập', 300000, 'ly', 10, 1)`)).lastInsertRowid);
  for (const [sdt, ten] of [[KH.quen, 'Khách quen'], [KH.no, 'Khách nợ']]) await db.run('INSERT INTO pos_customers (phone, name) VALUES (?, ?)', [sdt, ten]);
  c.goiCoSan = Number((await db.run(`INSERT INTO pos_customer_packages (customer_phone, package_id, status, total_qty, delivered_qty, created_at)
    VALUES (?, ?, 'active', 10, 0, datetime('now'))`, [KH.quen, c.goiId])).lastInsertRowid);
  const nap = await goi('chu', 'POST', '/wallets/topup', { phone: KH.quen, amount: 200000, customer_name: 'Khách quen', payment_method: 'cash' });
  c.donNo = await c.taoDon('nợ mẫu', { customer_phone: KH.no, customer_name: 'Khách nợ', items: [c.mon(0, 2)],
    payment_method: 'debt', debt_amount: 50000 });
  const sai = [];
  if (nap.status !== 200 || await c.vi(KH.quen) !== 200000) sai.push(`ví khách quen ≠ 200.000 (${c.ma(nap)})`);
  if (c.donNo.payment_status !== 'pending' || Number(c.donNo.debt_amount) !== 50000) sai.push(`nợ mẫu ≠ 50.000 pending`);
  const gia = (await db.query(`SELECT price FROM pos_products WHERE id IN (${sp.map((p) => p.id).join(',')}) ORDER BY id`)).map((r) => Number(r.price));
  if (gia.join() !== GIA.join()) sai.push('giá 5 món: ' + gia.join());
  if (sai.length) throw new Error('dữ liệu mẫu sai: ' + sai.join(' · '));
}

const KICH_BAN = [
  { ten: 'tiền mặt 45.000đ', chay: async (c) => {
    const d = await c.taoDon('KB1', { items: [c.mon(0), c.mon(1)], payment_method: 'cash', cash_amount: 45000, cash_received: 50000, change_amount: 5000 });
    c.mong('đơn tiền mặt 45.000 paid', d.payment_status === 'paid' && Number(d.total) === 45000, `${d.payment_status} · ${d.total}`);
    c.billDaThu = d;
  } },
  { ten: 'chuyển khoản rồi đổi sang tiền mặt', chay: async (c) => {
    const d = await c.taoDon('KB2', { items: [c.mon(2)], payment_method: 'transfer', transfer_amount: 30000 });
    const r = await c.doi(d.id, 'cash', 'khách trả lại bằng tiền mặt');
    c.mong('đổi cách trả → 200', r.status === 200, c.ma(r));
  } },
  { ten: 'chưa thu rồi thu', chay: async (c) => {
    const d = await c.taoDon('KB3', { items: [c.mon(0)], payment_method: 'cho_thu', debt_amount: 25000 });
    c.mong('bill chưa thu → pending', d.payment_status === 'pending', d.payment_status);
    const r = await c.thu('nv', d.id, 'cash');
    c.mong('thu bill chưa thu → 200 paid', r.status === 200 && r.data?.payment_status === 'paid', c.ma(r));
  } },
  { ten: 'ghi nợ rồi trả nợ', chay: async (c) => {
    const a = await c.thu('chu', c.donNo.id, 'cash', 20000);
    c.mong('khách nợ trả 20.000 → partial', a.status === 200 && a.data?.payment_status === 'partial', c.ma(a));
    const b = await c.thu('chu', c.donNo.id, 'transfer', 30000);
    c.mong('khách nợ trả nốt 30.000 → paid', b.status === 200 && b.data?.payment_status === 'paid', c.ma(b));
    const d = await c.taoDon('KB4', { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(0), c.mon(3)],
      payment_method: 'debt', balance_amount: 10000, debt_amount: 30000 });
    c.mong('ví 10.000 + nợ 30.000 → partial', d.payment_status === 'partial', d.payment_status);
    const t = await c.thu('chu', d.id, 'transfer');
    c.mong('trả đủ nợ → 200 paid', t.status === 200 && t.data?.payment_status === 'paid', c.ma(t));
  } },
  { ten: 'huỷ đơn', chay: async (c) => {
    const d = await c.taoDon('KB5a', { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(0)], payment_method: 'balance', balance_amount: 25000 });
    const truoc = await c.vi(KH.quen);
    const h = await c.goi('chu', 'PUT', `/orders/${d.id}/cancel`, { reason: 'giả lập huỷ' });
    c.mong('huỷ đơn trả ví → 200, ví +25.000', h.status === 200 && await c.vi(KH.quen) === truoc + 25000, c.ma(h));
    const d2 = await c.taoDon('KB5b', { items: [c.mon(3)], payment_method: 'cash', cash_amount: 15000 });
    const m = await c.claim(d2.ma);
    const h2 = await c.goi('chu', 'PUT', `/orders/${d2.id}/cancel`, { reason: 'huỷ sau khi khách đã dùng mã' });
    c.mong('dùng mã rồi mới huỷ đơn → 200, 200', m.status === 200 && h2.status === 200, `${c.ma(m)} / ${c.ma(h2)}`);
  } },
  // KB6 đi ĐÚNG đường quầy dùng: Lịch sử đơn → báo hỏng → Hoàn tiền (Orders.jsx:310–322 → damages.js), cộng ví khách.
  // (chủ quán chốt 02.10.2026). POST /refunds (chưa có màn hình gọi) chạy ở KB12.
  { ten: 'hoàn tiền (báo hỏng)', chay: async (c) => {
    const d = await c.taoDon('KB6', { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(1)], payment_method: 'cash', cash_amount: 20000 });
    const truoc = await c.vi(KH.quen);
    const h = await c.goi('chu', 'POST', '/damages', { order_id: d.id, product_code: c.sp[1].code, quantity: 1, reason: 'damaged',
      reason_note: 'giả lập', action: 'refund', refund_amount: 20000, return_to_stock: false });
    c.mong('báo hỏng → hoàn 20.000 vào ví → 200, ví +20.000', h.status === 200 && h.success === true
      && await c.vi(KH.quen) === truoc + 20000, `${c.ma(h)} · ví ${truoc} → ${await c.vi(KH.quen)}`);
  } },
  { ten: 'khách mới dùng mã in trên bill', chay: async (c) => {
    const a = await c.claim(c.billDaThu.ma, KH.moi);
    c.mong('bill đã thu → /claim 200', a.status === 200, c.ma(a));
    const d = await c.taoDon('KB7', { items: [c.mon(1)], payment_method: 'cho_thu', debt_amount: 20000 });
    const b = await c.claim(d.ma);
    c.mong('bill chưa thu → /claim 400 BILL_CHUA_THANH_TOAN', b.status === 400 && b.code === 'BILL_CHUA_THANH_TOAN', c.ma(b));
    const n = await c.nhanDiem(d.ma);
    c.mong('bill chưa thu → /nhan-diem 400 BILL_CHUA_THANH_TOAN', n.status === 400 && n.code === 'BILL_CHUA_THANH_TOAN', c.ma(n));
  } },
  { ten: 'nạp ví rồi tiêu ví', chay: async (c) => {
    const n = await c.goi('chu', 'POST', '/wallets/topup', { phone: KH.quen, amount: 100000, customer_name: 'Khách quen', payment_method: 'transfer' });
    c.mong('nạp 100.000 → 200', n.status === 200, c.ma(n));
    await c.taoDon('KB8', { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(0), c.mon(1)], payment_method: 'balance', balance_amount: 45000 });
    // Chủ quán bấm đối soát ví (chốt 02.10.2026: thao tác của chủ quán) — sổ đúng thì số dư không đổi.
    const ds = await c.goi('chu', 'POST', `/wallets/${KH.quen}/reconcile`, {});
    c.mong('đối soát ví → 200, số dư không đổi', ds.status === 200 && ds.balance_before === ds.balance_after,
      `${c.ma(ds)} · ${ds.balance_before} → ${ds.balance_after}`);
  } },
  { ten: 'mua gói', chay: async (c) => {
    const d = await c.taoDon('KB9a', { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(0, 1, true)],
      package_buy: { package_id: c.goiId, total_qty: 10, pkg_qty: 1 }, payment_method: 'cash', cash_amount: 300000 });
    const g = await c.db.queryOne('SELECT delivered_qty FROM pos_customer_packages WHERE order_id = ?', [d.id]);
    c.mong('mua gói + lấy 1 ly ngay → gói mới delivered_qty = 1', Number(g?.delivered_qty) === 1, JSON.stringify(g));
    await c.taoDon('KB9b', { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(1, 1, true)],
      customer_package_id: c.goiCoSan, payment_method: 'cash' });
    const g2 = await c.db.queryOne('SELECT delivered_qty FROM pos_customer_packages WHERE id = ?', [c.goiCoSan]);
    c.mong('lấy 1 ly 0đ từ gói có sẵn → delivered_qty = 1', Number(g2?.delivered_qty) === 1, JSON.stringify(g2));
  } },
  { ten: 'hai người cùng bấm thu một bill', chay: async (c) => {
    const dau = c.doLenh.length;   // LUOI-1: đo trễ trên lệnh của CHÍNH KB10 (trước đây cả phiên — trễ tắt giữa chừng vẫn đạt)
    const d = await c.taoDon('KB10', { items: [c.mon(0)], payment_method: 'cho_thu', debt_amount: 25000 });
    const ra = await Promise.all([c.thu('chu', d.id, 'cash'), c.thu('nv', d.id, 'transfer')]);
    // Bằng chứng chồng nhau: tuần tự thì người sau ra 400 không có code (đã paid, orders.js:1245);
    // chỉ khi cả hai cùng qua phép đọc ngoài giao dịch thì người sau mới ra 409 DA_THU_ROI.
    const st = ra.map((r) => r.status).sort().join(',');
    c.mong('hai lệnh thu chồng nhau → đúng một 200 + một 409 DA_THU_ROI', st === '200,409' && ra.some((r) => r.code === 'DA_THU_ROI'),
      ra.map(c.ma).join(' / '));
    const tl = c.doLenh.slice(dau).sort((a, b) => a - b);
    const giua = tl.length ? tl[Math.floor(tl.length / 2)] : 0;
    c.mong('trễ kho đang bật (trung vị một lệnh của KB10 ≥ 35 ms)', giua >= 35, `trung vị ${giua} ms trên ${tl.length} lệnh của KB10`);
  } },
  { ten: 'hai người cùng nhập một mã', chay: async (c) => {
    const d = await c.taoDon('KB11a', { items: [c.mon(0)], payment_method: 'cash', cash_amount: 25000 });
    let chen = null;
    c.moc.truocTx = async () => { chen = await c.claim(d.ma); };
    const r = await c.claim(d.ma);
    c.moc.truocTx = null;
    c.mong('hai người /claim chồng nhau → 200 + 409 MA_DA_DUNG', chen?.status === 200 && r.status === 409 && r.code === 'MA_DA_DUNG',
      `${chen ? c.ma(chen) : 'móc không chạy'} / ${c.ma(r)}`);
    const d2 = await c.taoDon('KB11b', { items: [c.mon(1)], payment_method: 'cash', cash_amount: 20000 });
    let chen2 = null;
    c.moc.truocTx = async () => { chen2 = await c.nhanDiem(d2.ma); };
    const r2 = await c.nhanDiem(d2.ma);
    c.moc.truocTx = null;
    c.mong('hai người /nhan-diem chồng nhau → 200 + 400 MA_DA_NHAN_DIEM', chen2?.status === 200 && r2.status === 400 && r2.code === 'MA_DA_NHAN_DIEM',
      `${chen2 ? c.ma(chen2) : 'móc không chạy'} / ${c.ma(r2)}`);
  } },
  // KB12 (P26a): yêu cầu hoàn tiền → duyệt, dùng refund_id máy chủ trả về (KHÔNG tra kho). Trước P26a: 500 BigInt.
  { ten: 'hoàn tiền về ví qua yêu cầu + duyệt', chay: async (c) => {
    const d = await c.taoDon('KB12', { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(2)], payment_method: 'balance', balance_amount: 30000 });
    const truoc = await c.vi(KH.quen);
    const yc = await c.goi('nv', 'POST', '/refunds', { order_id: d.id, reason: 'giả lập' });
    if (!c.mong('POST /refunds → 200, refund_id là số', yc.status === 200 && typeof yc.refund_id === 'number', c.ma(yc))) return;
    const dy = await c.goi('chu', 'POST', `/refunds/${yc.refund_id}/approve`, {});
    c.mong('duyệt hoàn tiền → 200, ví +30.000', dy.status === 200 && await c.vi(KH.quen) === truoc + 30000,
      `${c.ma(dy)} · ví ${truoc} → ${await c.vi(KH.quen)}`);
  } },
  // ── P26b: lỗ tiền ví. Mỗi kịch bản ĐỎ trên code trước P26b (viec/P26b/bang_chung_do.txt). ──
  // KB13 cũng là kịch bản phủ nhánh 'refunded' của I1 (dùng mã rồi hoàn qua yêu cầu + duyệt).
  { ten: 'dùng mã, hoàn tiền rồi huỷ đơn', chay: async (c) => {
    const d = await c.taoDon('KB13', { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(0)], payment_method: 'balance', balance_amount: 25000 });
    const m = await c.claim(d.ma);
    const yc = await c.yeuCau(d.id);
    const dy = await c.duyet(yc.refund_id);
    c.mong('dùng mã → yêu cầu hoàn → duyệt: 200, 200, 200', m.status === 200 && yc.status === 200 && dy.status === 200,
      `${c.ma(m)} / ${c.ma(yc)} / ${c.ma(dy)}`);
    const truoc = await c.vi(KH.quen);
    const h = await c.huy(d.id);
    c.mong('huỷ đơn đã hoàn → 400 DON_KHONG_HUY_DUOC, ví không đổi', h.status === 400 && h.code === 'DON_KHONG_HUY_DUOC'
      && await c.vi(KH.quen) === truoc, `${c.ma(h)} · ví ${truoc} → ${await c.vi(KH.quen)}`);
  } },
  { ten: 'xoá đơn đã hoàn; xoá chồng lên huỷ', chay: async (c) => {
    const n = await c.nap(KH.moi, 50000);
    const body = { customer_phone: KH.moi, customer_name: 'Khách mới', items: [c.monKhongSx], payment_method: 'balance', balance_amount: 10000 };
    const d = await c.taoDon('KB14a', body);
    c.mong('nạp 200; đơn của khách đã claim không sinh mã bill (I2)', n.status === 200 && !d.ma, `${c.ma(n)} · mã ${d.ma}`);
    const yc = await c.yeuCau(d.id);
    const dy = await c.duyet(yc.refund_id);
    const truoc = await c.vi(KH.moi);
    const x = await c.goi('chu', 'DELETE', `/orders/${d.id}`);
    c.mong('xoá đơn đã hoàn → 200, ví không đổi', yc.status === 200 && dy.status === 200 && x.status === 200 && await c.vi(KH.moi) === truoc,
      `${c.ma(yc)} / ${c.ma(dy)} / ${c.ma(x)} · ví ${truoc} → ${await c.vi(KH.moi)}`);
    const d2 = await c.taoDon('KB14b', body);
    const truoc2 = await c.vi(KH.moi);
    const [chen, x2] = await c.chong(() => c.huy(d2.id), () => c.goi('chu', 'DELETE', `/orders/${d2.id}`));
    c.mong('xoá chồng lên huỷ → huỷ 200, xoá 200, ví +10.000 đúng một lần', chen?.status === 200 && x2.status === 200
      && await c.vi(KH.moi) === truoc2 + 10000 && await c.dongHoan(d2.id) === 1,
    `${chen ? c.ma(chen) : 'móc không chạy'} / ${c.ma(x2)} · ví ${truoc2} → ${await c.vi(KH.moi)} · ${await c.dongHoan(d2.id)} dòng hoàn`);
  } },
  { ten: 'bấm trùng huỷ đơn / tạo yêu cầu hoàn', chay: async (c) => {
    const d = await c.taoDon('KB15a', { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(0)], payment_method: 'balance', balance_amount: 25000 });
    const truoc = await c.vi(KH.quen);
    const [chen, h] = await c.chong(() => c.huy(d.id), () => c.huy(d.id));
    c.mong('hai lệnh huỷ chồng nhau → 200 + 400 DON_KHONG_HUY_DUOC, ví +25.000 đúng một lần', chen?.status === 200 && h.status === 400
      && h.code === 'DON_KHONG_HUY_DUOC' && await c.vi(KH.quen) === truoc + 25000 && await c.dongHoan(d.id) === 1,
    `${chen ? c.ma(chen) : 'móc không chạy'} / ${c.ma(h)} · ví ${truoc} → ${await c.vi(KH.quen)}`);
    const d2 = await c.taoDon('KB15b', { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(1)], payment_method: 'balance', balance_amount: 20000 });
    const [chen2, y] = await c.chong(() => c.yeuCau(d2.id), () => c.yeuCau(d2.id));
    const cho = await c.so("SELECT COUNT(*) FROM pos_refund_requests WHERE order_id = ? AND status = 'pending'", [d2.id]);
    c.mong('hai lệnh tạo yêu cầu chồng nhau → 200 + 400, đúng 1 yêu cầu chờ duyệt', chen2?.status === 200 && y.status === 400 && cho === 1,
      `${chen2 ? c.ma(chen2) : 'móc không chạy'} / ${c.ma(y)} · ${cho} yêu cầu chờ`);
  } },
  { ten: 'bấm trùng duyệt hoàn / duyệt chồng huỷ / từ chối chồng duyệt', chay: async (c) => {
    const don = (ten, i, tien) => c.taoDon(ten, { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(i)], payment_method: 'balance', balance_amount: tien });
    const d = await don('KB16a', 2, 30000);
    const y = await c.yeuCau(d.id);
    const truoc = await c.vi(KH.quen);
    const [chen, a] = await c.chong(() => c.duyet(y.refund_id), () => c.duyet(y.refund_id));
    c.mong('hai lệnh duyệt chồng nhau → 200 + 400, ví +30.000, đúng 1 dòng hoàn', chen?.status === 200 && a.status === 400
      && await c.vi(KH.quen) === truoc + 30000 && await c.dongHoan(d.id) === 1,
    `${chen ? c.ma(chen) : 'móc không chạy'} / ${c.ma(a)} · ví ${truoc} → ${await c.vi(KH.quen)} · ${await c.dongHoan(d.id)} dòng hoàn`);
    const d2 = await don('KB16b', 0, 25000);
    const y2 = await c.yeuCau(d2.id);
    const truoc2 = await c.vi(KH.quen);
    const [chen2, a2] = await c.chong(() => c.huy(d2.id), () => c.duyet(y2.refund_id));
    const r2 = await c.db.queryOne('SELECT status, rejection_reason FROM pos_refund_requests WHERE id = ?', [y2.refund_id]);
    c.mong("duyệt chồng lên huỷ → huỷ 200, duyệt 400, yêu cầu rejected 'Đơn đã huỷ', ví +25.000 đúng một lần", chen2?.status === 200
      && a2.status === 400 && r2?.status === 'rejected' && r2.rejection_reason === 'Đơn đã huỷ' && await c.vi(KH.quen) === truoc2 + 25000
      && await c.dongHoan(d2.id) === 1, `${chen2 ? c.ma(chen2) : 'móc không chạy'} / ${c.ma(a2)} · ${JSON.stringify(r2)} · ví ${truoc2} → ${await c.vi(KH.quen)}`);
    const d3 = await don('KB16c', 0, 25000);
    const y3 = await c.yeuCau(d3.id);
    const [chen3, t] = await c.chong(() => c.duyet(y3.refund_id), () => c.goi('chu', 'POST', `/refunds/${y3.refund_id}/reject`, { reason: 'giả lập từ chối' }));
    const r3 = await c.db.queryOne('SELECT status FROM pos_refund_requests WHERE id = ?', [y3.refund_id]);
    c.mong('từ chối chồng lên duyệt → duyệt 200, từ chối 400, yêu cầu vẫn approved', chen3?.status === 200 && t.status === 400 && r3?.status === 'approved',
      `${chen3 ? c.ma(chen3) : 'móc không chạy'} / ${c.ma(t)} · ${r3?.status}`);
    const d4 = await don('KB16d', 0, 25000);
    const y4 = await c.yeuCau(d4.id);
    const truoc4 = await c.vi(KH.quen);
    const [chen4, a4] = await c.chong(() => c.goi('chu', 'POST', `/refunds/${y4.refund_id}/reject`, { reason: 'giả lập từ chối' }), () => c.duyet(y4.refund_id));
    const r4 = await c.db.queryOne('SELECT status FROM pos_refund_requests WHERE id = ?', [y4.refund_id]);
    c.mong('duyệt chồng lên từ chối → từ chối 200, duyệt 400, yêu cầu rejected, ví không đổi', chen4?.status === 200 && a4.status === 400
      && r4?.status === 'rejected' && await c.vi(KH.quen) === truoc4, `${chen4 ? c.ma(chen4) : 'móc không chạy'} / ${c.ma(a4)} · ${r4?.status} · ví ${truoc4} → ${await c.vi(KH.quen)}`);
  } },
  { ten: 'ghi ví chồng nhau: nạp / trừ tay / điều chỉnh / đối soát / duyệt / báo hỏng; hai đơn ví vượt số dư', chay: async (c) => {
    const S = sdtMoi(), S2 = sdtMoi();
    await c.nap(S, 30000);
    const ban = () => c.goi('chu', 'POST', '/orders', { customer_phone: S, customer_name: 'Khách KB17', items: [c.mon(0)], payment_method: 'balance', balance_amount: 25000 });
    const buoc = async (ten, chen, lam, doi) => {
      const truoc = await c.vi(S);
      const [r1, r2] = await c.chong(chen, lam);
      c.mong(`${ten} → cả hai 200, ví ${doi >= 0 ? '+' : ''}${doi}`, r1?.status === 200 && r2.status === 200 && await c.vi(S) === truoc + doi,
        `${r1 ? c.ma(r1) : 'móc không chạy'} / ${c.ma(r2)} · ví ${truoc} → ${await c.vi(S)}`);
    };
    await buoc('nạp 100.000 chồng lên bán đơn ví 25.000', ban, () => c.nap(S, 100000), 75000);
    await buoc('trừ tay 5.000 chồng lên nạp 10.000', () => c.nap(S, 10000), () => c.goi('chu', 'POST', '/wallets/deduct', { phone: S, amount: 5000 }), 5000);
    await buoc('điều chỉnh +5.000 chồng lên nạp 10.000', () => c.nap(S, 10000),
      () => c.goi('chu', 'POST', '/wallets/adjust', { phone: S, amount: 5000, reason: 'giả lập' }), 15000);
    await buoc('đối soát chồng lên bán đơn ví 25.000', ban, () => c.goi('chu', 'POST', `/wallets/${S}/reconcile`, {}), -25000);
    const dDuyet = (await ban()).order?.id;
    const y = await c.yeuCau(dDuyet);
    await buoc('duyệt hoàn 25.000 chồng lên nạp 10.000', () => c.nap(S, 10000), () => c.duyet(y.refund_id), 35000);
    const dHong = await c.taoDon('KB17 báo hỏng', { customer_phone: S, customer_name: 'Khách KB17', items: [c.mon(1)], payment_method: 'cash', cash_amount: 20000 });
    await buoc('báo hỏng đền 20.000 chồng lên nạp 10.000', () => c.nap(S, 10000),
      () => c.baoHong(dHong.id, { product_code: c.sp[1].code, quantity: 1, action: 'refund' }), 30000);
    // Chiều trừ: số dư bị trừ ngay trước khi lệnh trừ ghi → lệnh trừ phải thua, số dư không âm.
    for (const [ten, lam] of [['trừ tay hết số dư', (v) => c.goi('chu', 'POST', '/wallets/deduct', { phone: S, amount: v })],
      ['điều chỉnh âm hết số dư', (v) => c.goi('chu', 'POST', '/wallets/adjust', { phone: S, amount: -v, reason: 'giả lập' })]]) {
      const v = await c.vi(S);
      const [r1, r2] = await c.chong(ban, () => lam(v));
      c.mong(`${ten} chồng lên bán đơn ví → bán 200, ${ten} 400 SO_DU_KHONG_DU, ví ${v} − 25.000 ≥ 0`, r1?.status === 200 && r2.status === 400
        && r2.code === 'SO_DU_KHONG_DU' && await c.vi(S) === v - 25000, `${r1 ? c.ma(r1) : 'móc không chạy'} / ${c.ma(r2)} · ví ${v} → ${await c.vi(S)}`);
    }
    // Chuỗi sổ: dòng sau bắt đầu từ số dư dòng trước để lại, mỗi dòng after = before + amount.
    const dong = await c.db.query(`SELECT id, type, amount, balance_before, balance_after FROM pos_balance_transactions
      WHERE customer_phone = ? AND type IN ('topup', 'purchase', 'refund', 'adjust', 'compensation') ORDER BY id`, [S]);
    const gay = dong.filter((r, i) => Number(r.balance_after) !== Number(r.balance_before) + Number(r.amount)
      || Number(r.balance_before) !== (i ? Number(dong[i - 1].balance_after) : 0));
    c.mong('chuỗi sổ ví liền: before dòng sau = after dòng trước, after = before + amount', gay.length === 0,
      gay.map((r) => `#${r.id} ${r.type} ${r.amount}: ${r.balance_before} → ${r.balance_after}`).join(' · '));
    // B5 ví mẹ (soát vòng 3): ví mẹ 30.000, hai đơn trừ ví mẹ 25.000 chồng nhau → một đơn bị chặn, ví mẹ không âm.
    const ME = sdtMoi();
    await c.nap(ME, 30000);
    const banMe = () => c.goi('chu', 'POST', '/orders', { customer_phone: S, customer_name: 'Khách KB17', parent_phone: ME, items: [c.mon(0)],
      payment_method: 'cash', cash_amount: 0, parent_balance_amount: 25000 });
    const [m1, m2] = await c.chong(banMe, banMe);
    c.mong('hai đơn trừ ví mẹ 25.000 chồng nhau, ví mẹ 30.000 → 200 + 400 SO_DU_KHONG_DU, ví mẹ 5.000', m1?.status === 200 && m2.status === 400
      && m2.code === 'SO_DU_KHONG_DU' && await c.vi(ME) === 5000, `${m1 ? c.ma(m1) : 'móc không chạy'} / ${c.ma(m2)} · ví mẹ ${await c.vi(ME)}`);
    // Q9 = (a): đơn ví con 5.000 + ví mẹ 20.000 → duyệt hoàn trả cả phần mẹ (I11 soát theo TỪNG ví).
    await c.nap(ME, 20000);
    const tQ9 = await c.goi('chu', 'POST', '/orders', { customer_phone: S, customer_name: 'Khách KB17', parent_phone: ME, items: [c.mon(0)],
      payment_method: 'cash', cash_amount: 0, balance_amount: 5000, parent_balance_amount: 20000 });
    c.mong('đơn ví con 5.000 + ví mẹ 20.000 tạo được (200)', tQ9.status === 200 && !!tQ9.order?.id, c.ma(tQ9));
    const dQ9 = tQ9.order?.id;
    const vMe = await c.vi(ME), vCon = await c.vi(S);
    const yQ9 = await c.yeuCau(dQ9);
    const rQ9 = await c.duyet(yQ9.refund_id);
    c.mong('đơn ví con 5.000 + ví mẹ 20.000 → duyệt hoàn → 200, ví mẹ +20.000, ví con +5.000', rQ9.status === 200
      && await c.vi(ME) === vMe + 20000 && await c.vi(S) === vCon + 5000, `${c.ma(rQ9)} · ví mẹ ${vMe} → ${await c.vi(ME)} · ví con ${vCon} → ${await c.vi(S)}`);
    // B5: số dư 30.000, hai đơn ví 25.000 chồng nhau → một đơn bị chặn.
    await c.nap(S2, 30000);
    const ban2 = () => c.goi('chu', 'POST', '/orders', { customer_phone: S2, customer_name: 'Khách KB17', items: [c.mon(0)], payment_method: 'balance', balance_amount: 25000 });
    const [b1, b2] = await c.chong(ban2, ban2);
    c.mong('hai đơn ví 25.000 chồng nhau, số dư 30.000 → 200 + 400 SO_DU_KHONG_DU, ví 5.000', b1?.status === 200 && b2.status === 400
      && b2.code === 'SO_DU_KHONG_DU' && await c.vi(S2) === 5000, `${b1 ? c.ma(b1) : 'móc không chạy'} / ${c.ma(b2)} · ví ${await c.vi(S2)}`);
  } },
  { ten: 'báo hỏng chồng nhau vượt số lượng; báo hỏng đơn đã huỷ', chay: async (c) => {
    const d = await c.taoDon('KB18a', { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(1, 2)], payment_method: 'cash', cash_amount: 40000 });
    const ma = c.sp[1].code;
    const a = await c.baoHong(d.id, { product_code: ma, quantity: 1, action: 'return_stock', return_to_stock: true });
    const [chen, b] = await c.chong(() => c.baoHong(d.id, { product_code: ma, quantity: 1, action: 'none' }),
      () => c.baoHong(d.id, { product_code: ma, quantity: 1, action: 'refund' }));
    const tong = await c.so('SELECT COALESCE(SUM(quantity), 0) FROM pos_damage_logs WHERE order_id = ?', [d.id]);
    c.mong('báo hỏng chồng nhau vượt số lượng → 200, 200, 400 VUOT_SO_LUONG, tổng đã báo 2', a.status === 200 && chen?.status === 200
      && b.status === 400 && b.code === 'VUOT_SO_LUONG' && tong === 2, `${c.ma(a)} / ${chen ? c.ma(chen) : 'móc không chạy'} / ${c.ma(b)} · tổng ${tong}`);
    const d2 = await c.taoDon('KB18b', { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(3)], payment_method: 'cash', cash_amount: 15000 });
    await c.huy(d2.id);
    const truoc = await c.vi(KH.quen);
    const h = await c.baoHong(d2.id, { product_code: c.sp[3].code, quantity: 1, action: 'refund' });
    c.mong('báo hỏng hoàn tiền trên đơn đã huỷ → 400 DON_KHONG_DEN_DUOC, ví không đổi', h.status === 400 && h.code === 'DON_KHONG_DEN_DUOC'
      && await c.vi(KH.quen) === truoc, `${c.ma(h)} · ví ${truoc} → ${await c.vi(KH.quen)}`);
  } },
  // ── LUOI-1: lưới tiền/kho cho AU-G1/G2/G3/G6 + AU-G4 (viec/LUOI-1). Mỗi kịch bản tự dựng dữ liệu — dungDuLieu không đổi. ──
  // Màn hình gọi: đổi điểm Customers.jsx:199 · mã Sales.jsx:234/:728 · gói/thẻ Sales.jsx:744–751 · huỷ Orders.jsx:263 (nhân
  // viên có quyền cancel_order) · đẩy sổ nợ Layout.jsx:53. /increment-usage, /deliver, đối soát: KHÔNG màn hình gọi (phủ qua API).
  { ten: 'đổi điểm lấy mã rồi dùng mã khi bán', chay: async (c) => {
    const S = sdtMoi();
    const kh = { customer_phone: S, customer_name: 'Khách KB19' };
    const qua = await c.goi('chu', 'POST', '/rewards', { name: 'Quà KB19', points_cost: 3, discount_type: 'fixed', discount_value: 5000, valid_days: 30 });
    await c.taoDon('KB19 tích điểm', { ...kh, items: [c.mon(2)], payment_method: 'cash', cash_amount: 30000 });
    const doi = await c.goi('nv', 'POST', '/loyalty/redeem', { phone: S, reward_id: qua.id });
    c.mong('tạo quà 200; tích 3 điểm rồi đổi quà 3 điểm → 200, còn 0 điểm', qua.status === 200 && doi.status === 200 && doi.data?.points_left === 0,
      `${c.ma(qua)} / ${c.ma(doi)} · còn ${doi.data?.points_left}`);
    const lan2 = await c.goi('nv', 'POST', '/loyalty/redeem', { phone: S, reward_id: qua.id });
    c.mong('đổi lần hai khi đã hết điểm → 400 (máy chủ không trả code)', lan2.status === 400, c.ma(lan2));
    const ma = doi.data?.code;
    const v = await c.goi('nv', 'POST', '/discount-codes/validate', { code: ma, order_subtotal: 25000 });
    const b = await c.goi('nv', 'POST', '/orders', { ...kh, items: [c.mon(0)], discount_code: ma, payment_method: 'cash', cash_amount: 20000 });
    const db = b.order?.id ? await c.db.queryOne('SELECT total, discount_amount FROM pos_orders WHERE id = ?', [b.order.id]) : null;
    c.mong('mã đổi điểm: validate → 200 hợp lệ; bán 25.000 dùng mã → 200, giảm 5.000, thu 20.000', v.status === 200 && v.valid === true
      && b.status === 200 && Number(db?.discount_amount) === 5000 && Number(db?.total) === 20000, `${c.ma(v)} / ${c.ma(b)} · ${JSON.stringify(db)}`);
  } },
  { ten: 'mã dùng-một-lần: hai quầy cùng dùng, dùng lại, tăng lượt tay', chay: async (c) => {
    const tao = (code, gioiHan) => c.goi('chu', 'POST', '/discount-codes', { code, discount_type: 'fixed', discount_value: 5000, usage_limit: gioiHan });
    const t = await tao('KB20MOTLAN', 1);
    const kh = { customer_phone: sdtMoi(), customer_name: 'Khách KB20' };
    const ban = () => c.goi('chu', 'POST', '/orders', { ...kh, items: [c.mon(0)], discount_code: 'KB20MOTLAN', payment_method: 'cash', cash_amount: 20000 });
    // Q6 = (a) siết, chủ quán chốt 09.10: mã đơn sinh NGOÀI giao dịch (helpers.js:24–46, orders.js:759) → đơn thua vấp UNIQUE
    // pos_orders.code TRƯỚC phép kiểm lại mã trong giao dịch (orders.js:880–893) = P26d (10). Đơn thua CHỈ được là một trong
    // hai dạng dưới; nhánh kiểm lại trong giao dịch CHƯA KIỂM. P26d sửa xong (10) → siết về đúng 200 + 400.
    const dem = async () => [await c.so('SELECT COUNT(*) FROM pos_balance_transactions'), await c.so('SELECT COUNT(*) FROM pos_point_transactions'),
      await c.so('SELECT COUNT(*) FROM pos_stock_pending'), c.nhanKho.length];
    const truoc = await dem();
    const [r1, r2] = await c.chong(ban, ban);
    const ra = [r1, r2].filter(Boolean);
    const thang = ra.filter((r) => r.status === 200);
    const thua = ra.filter((r) => r.status !== 200);
    const thuaDung = thua.length === 1 && ((thua[0].status === 400 && thua[0].code === 'DISCOUNT_CODE_LIMIT_REACHED')
      || (thua[0].status === 500 && String(thua[0].error || '').includes('pos_orders.code')));
    const id = thang[0]?.order?.id;
    const sau = await dem();
    const mangMa = await c.so("SELECT COUNT(*) FROM pos_orders WHERE UPPER(discount_code) = 'KB20MOTLAN'");
    const daDung = await c.so("SELECT used_count FROM pos_discount_codes WHERE code = 'KB20MOTLAN'");
    // Dấu vết đơn thua: ví / điểm / nợ kho / lệnh kho SX mới đều phải thuộc đơn thắng (đơn thắng: tiền mặt, có SĐT, 1 món SX).
    const diemMoi = await c.so('SELECT COUNT(*) FROM pos_point_transactions WHERE order_id = ?', [id]);
    const khoMoi = c.nhanKho.slice(truoc[3]);
    c.mong('tạo mã 200; hai đơn cùng mã dùng-một-lần chồng nhau → đúng một 200, đơn kia CHỈ 400 DISCOUNT_CODE_LIMIT_REACHED hoặc 500 '
      + 'pos_orders.code; một đơn mang mã, used_count = 1; đơn thua không để lại dòng ví / điểm / nợ kho / lệnh kho', t.status === 200
      && ra.length === 2 && thang.length === 1 && thuaDung && mangMa === 1 && daDung === 1 && sau[0] === truoc[0]
      && sau[1] === truoc[1] + diemMoi && diemMoi === 1 && sau[2] === truoc[2] && khoMoi.length === 1 && khoMoi[0].van_tay === `POS:${id}:out:0`,
    `${c.ma(t)} / ${r1 ? c.ma(r1) : 'móc không chạy'} / ${c.ma(r2)} · ${mangMa} đơn mang mã · used_count ${daDung} · ví/điểm/nợ/kho `
      + `${truoc.join(',')} → ${sau.join(',')} · ${khoMoi.map((k) => k.van_tay).join(' ')}`);
    // Q1 = (a), chủ quán chốt 09.10: màn hình chặn ở validate (400, không code); gửi thẳng mã đã hết lượt thì máy chủ bỏ mã, tính đủ giá.
    const v = await c.goi('chu', 'POST', '/discount-codes/validate', { code: 'KB20MOTLAN', order_subtotal: 25000 });
    const lai = await c.goi('chu', 'POST', '/orders', { ...kh, items: [c.mon(0)], discount_code: 'KB20MOTLAN', payment_method: 'cash', cash_amount: 25000 });
    const dl = lai.order?.id ? await c.db.queryOne('SELECT total, discount_amount FROM pos_orders WHERE id = ?', [lai.order.id]) : null;
    c.mong('mã hết lượt: validate → 400; đơn gửi thẳng mã đó → 200, bỏ mã, đủ giá 25.000', v.status === 400 && lai.status === 200
      && Number(dl?.total) === 25000 && Number(dl?.discount_amount) === 0, `${c.ma(v)} / ${c.ma(lai)} · ${JSON.stringify(dl)}`);
    const t2 = await tao('KB20TANGTAY', 5);
    const tang = await c.goi('chu', 'POST', `/discount-codes/${t2.id}/increment-usage`, {});
    if (tang.status === 200) c.soQuay.tangMa.set('KB20TANGTAY', (c.soQuay.tangMa.get('KB20TANGTAY') || 0) + 1);
    c.mong('tăng lượt tay (/increment-usage) → 200', t2.status === 200 && tang.status === 200, `${c.ma(t2)} / ${c.ma(tang)}`);
  } },
  { ten: 'gói: mua → lấy tới hết lượt → lấy thêm bị chặn → nhân viên huỷ đơn lấy / huỷ đơn mua (chồng nhau)', chay: async (c) => {
    const kh = { customer_phone: sdtMoi(), customer_name: 'Khách KB21' };
    const gia = await c.so('SELECT price FROM pos_packages WHERE id = ?', [c.goiId]);
    const nap = await c.nap(kh.customer_phone, 2 * gia);
    const mua = (ten) => c.taoDon(ten, { ...kh, items: [], package_buy: { package_id: c.goiId, total_qty: 3, pkg_qty: 1 },
      payment_method: 'balance', balance_amount: gia });
    const goiCua = (d) => c.so('SELECT id FROM pos_customer_packages WHERE order_id = ?', [d.id]);
    const lay = (goi, sl) => c.goi('chu', 'POST', '/orders', { ...kh, items: [c.mon(0, sl, true)], customer_package_id: goi, payment_method: 'cash', cash_amount: 0 });
    const huy = (id) => c.goi('nv', 'PUT', `/orders/${id}/cancel`, { reason: 'giả lập' });
    const daGiao = (g) => c.so('SELECT delivered_qty FROM pos_customer_packages WHERE id = ?', [g]);
    const m1 = await mua('KB21 mua gói 1');
    const g1 = await goiCua(m1);
    const l1 = await lay(g1, 2), l2 = await lay(g1, 1), l3 = await lay(g1, 1);
    c.mong('nạp 200; gói 3 lượt: lấy 2 rồi 1 → 200, 200; lấy thêm → 400 GOI_HET_HIEU_LUC', nap.status === 200 && l1.status === 200
      && l2.status === 200 && l3.status === 400 && l3.code === 'GOI_HET_HIEU_LUC', `${c.ma(nap)} / ${c.ma(l1)} / ${c.ma(l2)} / ${c.ma(l3)}`);
    const h2 = await huy(l2.order?.id);
    c.mong('nhân viên huỷ đơn lấy 1 ly → 200, gói còn giao 2', h2.status === 200 && await daGiao(g1) === 2, `${c.ma(h2)} · giao ${await daGiao(g1)}`);
    // Q8 = (b), chủ quán chốt 09.10: gói ĐÃ GIAO một phần — hoàn BAO NHIÊU chưa chốt (P26c) → KHÔNG khẳng định số tiền, chỉ:
    // hoàn đúng MỘT lần (một dòng hoàn), gói chuyển cancelled, không lấy thêm được. Gói CHƯA giao (gói 2) vẫn khẳng định hoàn trọn.
    const [x1, x2] = await c.chong(() => huy(m1.id), () => huy(m1.id));
    const tt = await c.db.queryOne('SELECT status FROM pos_customer_packages WHERE id = ?', [g1]);
    c.mong('hai nhân viên huỷ đơn mua gói đã giao 2/3 chồng nhau → 200 + 400 DON_KHONG_HUY_DUOC, đúng một dòng hoàn, gói cancelled', x1?.status === 200
      && x2.status === 400 && x2.code === 'DON_KHONG_HUY_DUOC' && await c.dongHoan(m1.id) === 1 && tt?.status === 'cancelled',
    `${x1 ? c.ma(x1) : 'móc không chạy'} / ${c.ma(x2)} · ${await c.dongHoan(m1.id)} dòng hoàn · gói ${tt?.status}`);
    const l4 = await lay(g1, 1);
    c.mong('lấy từ gói của đơn mua đã huỷ → 400 GOI_HET_HIEU_LUC', l4.status === 400 && l4.code === 'GOI_HET_HIEU_LUC', c.ma(l4));
    const m2 = await mua('KB21 mua gói 2');
    const g2 = await goiCua(m2);
    const l5 = await lay(g2, 1);
    const h5 = await huy(l5.order?.id);
    const vi = await c.vi(kh.customer_phone);
    const h6 = await huy(m2.id);
    const con = await c.so('SELECT COUNT(*) FROM pos_customer_packages WHERE id = ?', [g2]);
    const tro = await c.so('SELECT COUNT(*) FROM pos_orders WHERE customer_package_id = ?', [g2]);
    c.mong('gói không còn lượt nào đã giao: huỷ đơn lấy rồi huỷ đơn mua → 200, 200; ví + TRỌN giá gói; gói bị xoá, không đơn nào trỏ tới',
      l5.status === 200 && h5.status === 200 && h6.status === 200 && await c.vi(kh.customer_phone) === vi + gia && con === 0 && tro === 0,
      `${c.ma(l5)} / ${c.ma(h5)} / ${c.ma(h6)} · ví ${vi} → ${await c.vi(kh.customer_phone)} · gói còn ${con} · ${tro} đơn trỏ`);
  } },
  { ten: 'mua thẻ hội viên bằng ví rồi nhân viên huỷ', chay: async (c) => {
    const kh = { customer_phone: sdtMoi(), customer_name: 'Khách KB22' };   // khách MỚI: hạng thẻ giảm giá đơn sau (orders.js:529)
    const hang = await c.db.queryOne('SELECT id, card_price FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order, id LIMIT 1');
    if (!hang) throw new Error('không có hạng thẻ nào đang bật');
    const gia = Number(hang.card_price);
    await c.nap(kh.customer_phone, gia);
    const d = await c.taoDon('KB22 mua thẻ', { ...kh, items: [], membership_buy: { tier_id: hang.id }, payment_method: 'balance', balance_amount: gia });
    const co = await c.so('SELECT COUNT(*) FROM pos_membership_purchases WHERE order_id = ?', [d.id]);
    const truoc = await c.vi(kh.customer_phone);
    const h = await c.goi('nv', 'PUT', `/orders/${d.id}/cancel`, { reason: 'giả lập' });
    const con = await c.so('SELECT COUNT(*) FROM pos_membership_purchases WHERE order_id = ?', [d.id]);
    c.mong('mua thẻ → 1 dòng mua thẻ; nhân viên huỷ → 200, ví + giá thẻ, dòng mua thẻ bị gỡ', co === 1 && h.status === 200
      && await c.vi(kh.customer_phone) === truoc + gia && con === 0, `${co} dòng / ${c.ma(h)} · ví ${truoc} → ${await c.vi(kh.customer_phone)} · còn ${con}`);
  } },
  // Xoá (owner): KH.moi đã claim ở KB7 → đơn không sinh mã bill; món KHÔNG mã SX; xoá đơn lấy CHƯA huỷ — tránh lỗi đã biết P26c (4), (14).
  { ten: 'chủ xoá đơn lấy từ gói, xoá đơn mua gói có lấy ngay', chay: async (c) => {
    const kh = { customer_phone: KH.moi, customer_name: 'Khách mới' };
    const tuGoi = { ...c.monKhongSx, from_package: true };
    const gia = await c.so('SELECT price FROM pos_packages WHERE id = ?', [c.goiId]);
    const m = await c.taoDon('KB23 mua gói lấy ngay', { ...kh, items: [tuGoi], package_buy: { package_id: c.goiId, total_qty: 5, pkg_qty: 1 },
      payment_method: 'cash', cash_amount: gia });
    const g = await c.so('SELECT id FROM pos_customer_packages WHERE order_id = ?', [m.id]);
    const lay = () => c.goi('chu', 'POST', '/orders', { ...kh, items: [tuGoi], customer_package_id: g, payment_method: 'cash', cash_amount: 0 });
    const xoa = (id) => c.goi('chu', 'DELETE', `/orders/${id}`);
    const z = await lay();
    const xz = await xoa(z.order?.id);
    const giao = await c.so('SELECT delivered_qty FROM pos_customer_packages WHERE id = ?', [g]);
    c.mong('mua gói lấy ngay 1, lấy thêm 1, chủ xoá đơn lấy → 200, 200, gói còn giao 1', z.status === 200 && xz.status === 200 && giao === 1,
      `${c.ma(z)} / ${c.ma(xz)} · giao ${giao}`);
    const z2 = await lay();
    const xm = await xoa(m.id);
    const con = await c.so('SELECT COUNT(*) FROM pos_customer_packages WHERE id = ?', [g]);
    const tro = await c.so('SELECT COUNT(*) FROM pos_orders WHERE customer_package_id = ?', [g]);
    c.mong('chủ xoá đơn mua gói → 200, gói bị xoá, đơn lấy còn lại không trỏ gói', z2.status === 200 && xm.status === 200 && con === 0 && tro === 0,
      `${c.ma(z2)} / ${c.ma(xm)} · gói còn ${con} · ${tro} đơn trỏ`);
  } },
  // KB24 để công tắc SX lỗi BẬT tới hết kịch bản: KB25 chỉ đẩy được sổ nợ nếu chay.js tự tắt lỗi trước kịch bản.
  { ten: 'SX lỗi lúc bán / huỷ đơn → nợ kho', chay: async (c) => {
    const C = await c.taoDon('KB24 bán lúc SX tốt', { items: [c.mon(3)], payment_method: 'cash', cash_amount: 15000 });
    c.batSxLoi();
    const A = await c.taoDon('KB24 bán lúc SX lỗi', { items: [c.mon(0), c.mon(1)], payment_method: 'cash', cash_amount: 45000 });
    const h = await c.goi('nv', 'PUT', `/orders/${C.id}/cancel`, { reason: 'giả lập' });
    const no = await c.so("SELECT COUNT(*) FROM pos_stock_pending WHERE status = 'pending' AND order_id IN (?, ?)", [A.id, C.id]);
    c.mong('bán + huỷ lúc SX lỗi → đơn vẫn tạo, huỷ 200, 3 dòng nợ kho chờ đẩy', A.status === 'completed' && h.status === 200 && no === 3,
      `${A.status} / ${c.ma(h)} · ${no} dòng nợ`);
    c.kbSxLoi = c.sxGia.kb;   // KB25 soát: chay.js đánh số kịch bản và tự tắt lỗi trước kịch bản sau
  } },
  { ten: 'đẩy sổ nợ kho (SX đã hết lỗi): hai người cùng bấm; bấm lại', chay: async (c) => {
    c.mong('chay.js: công tắc SX tự tắt, kịch bản này đánh số ngay sau KB bật lỗi', !c.sxGia.loi && c.kbSxLoi > 0 && c.sxGia.kb === c.kbSxLoi + 1,
      `lỗi ${c.sxGia.loi} · KB bật lỗi ${c.kbSxLoi} · KB này ${c.sxGia.kb}`);
    const truoc = c.nhanKho.length;
    const day = () => c.goi('nv', 'POST', '/so-no/doi-ngay', {});
    // Hai người cùng bấm ở lần đẩy ĐẦU (còn 3 dòng nợ) — khoá dangChay (doSoNo.js:39) phải để đúng một lượt gửi; soát LUOI-1
    // vòng 3 lỗi 3: bấm chồng lúc sổ nợ đã rỗng thì bỏ khoá vẫn xanh. Đột biến VS-SRV-bo-khoa-dangChay phải ĐỎ.
    const [r1, r2] = await Promise.all([day(), day()]);
    const r3 = await day();
    const con = await c.so("SELECT COUNT(*) FROM pos_stock_pending WHERE status <> 'resolved'");
    const xong = [r1, r2].map((r) => r.xong || 0).sort();
    c.mong('hai người cùng bấm đẩy (còn 3 nợ) → cả hai 200, đúng một lượt xong 3, lượt kia không gửi; bấm lại → xong 0; SX nhận đúng 3, sổ nợ hết',
      [r1, r2, r3].every((r) => r.status === 200) && xong[0] === 0 && xong[1] === 3 && !r3.xong && c.nhanKho.length === truoc + 3 && con === 0,
    `${[r1, r2, r3].map((r) => `${c.ma(r)} xong ${r.xong}`).join(' / ')} · SX nhận thêm ${c.nhanKho.length - truoc} · còn nợ ${con}`);
  } },
  { ten: 'đối soát ví khách chưa có ví; giao tay 1 ly từ gói (/deliver)', chay: async (c) => {
    const coVi = await c.so('SELECT COUNT(*) FROM pos_wallets WHERE phone = ?', [KH.no]);
    const ds = await c.goi('chu', 'POST', `/wallets/${KH.no}/reconcile`, {});
    const vi = await c.db.queryOne('SELECT balance FROM pos_wallets WHERE phone = ?', [KH.no]);
    c.mong('đối soát khách nợ CHƯA có ví → 200, ví được tạo = tổng sổ', coVi === 0 && ds.status === 200 && ds.balance_before === null
      && !!vi && Number(vi.balance) === Number(ds.ledger_sum), `có ví trước: ${coVi} · ${c.ma(ds)} · ví ${JSON.stringify(vi)} · sổ ${ds.ledger_sum}`);
    const g = c.goiCoSan;
    const giao = () => c.so('SELECT delivered_qty FROM pos_customer_packages WHERE id = ?', [g]);
    const truoc = await giao();
    // Q2 = (a), chủ quán chốt 09.10: phủ /deliver TRONG hạn lượt (đường này không trần — Phát hiện 4).
    const gt = await c.goi('nv', 'PUT', `/packages/customer-packages/${g}/deliver`, { delivered_qty: 1 });
    if (gt.status === 200) c.soQuay.giaoGoi.set(g, (c.soQuay.giaoGoi.get(g) || 0) + 1);
    c.mong('giao tay 1 ly từ gói còn lượt (/deliver) → 200, gói +1', gt.status === 200 && await giao() === truoc + 1, `${c.ma(gt)} · ${truoc} → ${await giao()}`);
  } },
  // KB27 PHẢI LÀ KỊCH BẢN CUỐI CỦA LƯỢT NÓ (LUOT): nợ kho của đơn ĐÃ XOÁ mà được đẩy (nút, hoặc tự đẩy 3 phút — index.js:76) thì SX nhận vân tay
  // của đơn không còn → I7 "vân tay lạ" = lỗi đã biết P26c (4). Kịch bản thêm SAU KB27 không được đẩy sổ nợ.
  { ten: 'SX lỗi: bán rồi chủ xoá đơn → nợ kho out + in', chay: async (c) => {
    c.batSxLoi();
    const d = await c.taoDon('KB27', { customer_phone: KH.moi, customer_name: 'Khách mới', items: [c.mon(2)], payment_method: 'cash', cash_amount: 30000 });
    const x = await c.goi('chu', 'DELETE', `/orders/${d.id}`);
    const no = await c.so('SELECT COUNT(*) FROM pos_stock_pending WHERE order_id = ?', [d.id]);
    c.mong('bán lúc SX lỗi, chủ xoá đơn → 200, 2 dòng nợ kho (out lúc bán + in lúc xoá)', x.status === 200 && no === 2, `${c.ma(x)} · ${no} dòng nợ`);
  } },
  // ── TACH-GL: hai phần LUOI-1 phải bỏ vì thời gian (Phát hiện 13, 14) — thêm lại sau khi chia lượt. ──
  { ten: 'tiền mặt rồi đổi sang chuyển khoản', chay: async (c) => {
    const d = await c.taoDon('KB28', { items: [c.mon(2)], payment_method: 'cash', cash_amount: 30000 });
    const r = await c.doi(d.id, 'transfer', 'khách chuyển khoản lại');
    const sau = await c.db.queryOne('SELECT cash_amount, transfer_amount FROM pos_orders WHERE id = ?', [d.id]);
    c.mong('đơn tiền mặt 30.000 đổi sang chuyển khoản → 200, tiền mặt 0 · CK 30.000', r.status === 200 && Number(sau?.cash_amount) === 0
      && Number(sau?.transfer_amount) === 30000, `${c.ma(r)} · ${JSON.stringify(sau)}`);
  } },
  // Quà % có trần: tạo bằng POST /rewards — route của màn quản trị (Settings.jsx:565), nhưng màn hình KHÔNG gửi max_discount
  // (Q1 = a, chủ quán chốt 10.10: phủ đường máy chủ qua API; màn hình thiếu ô trần = Phát hiện 1 của TACH-GL).
  { ten: 'quà % có trần: đổi điểm 2 lần, bán đơn vượt trần và dưới trần', chay: async (c) => {
    const kh = { customer_phone: sdtMoi(), customer_name: 'Khách KB29' };
    const qua = await c.goi('chu', 'POST', '/rewards', { name: 'Quà KB29', points_cost: 3, discount_type: 'percent', discount_value: 50,
      max_discount: 7000, valid_days: 30 });
    await c.taoDon('KB29 tích điểm', { ...kh, items: [c.mon(2, 2)], payment_method: 'cash', cash_amount: 60000 });
    const doi = () => c.goi('nv', 'POST', '/loyalty/redeem', { phone: kh.customer_phone, reward_id: qua.id });
    const d1 = await doi(), d2 = await doi();
    c.mong('tạo quà 50 % trần 7.000 → 200; tích 6 điểm, đổi 2 lần → 200, 200, còn 0 điểm', qua.status === 200 && d1.status === 200
      && d2.status === 200 && d2.data?.points_left === 0, `${c.ma(qua)} / ${c.ma(d1)} / ${c.ma(d2)} · còn ${d2.data?.points_left}`);
    const ban = async (mon, ma, tien) => {
      const b = await c.goi('nv', 'POST', '/orders', { ...kh, items: [mon], discount_code: ma, payment_method: 'cash', cash_amount: tien });
      return [b, b.order?.id ? await c.db.queryOne('SELECT total, discount_amount FROM pos_orders WHERE id = ?', [b.order.id]) : null];
    };
    const [b1, r1] = await ban(c.mon(4), d1.data?.code, 28000);
    c.mong('bán 35.000 + mã quà 50 % (17.500 VƯỢT trần) → 200, giảm đúng trần 7.000, thu 28.000', b1.status === 200
      && Number(r1?.discount_amount) === 7000 && Number(r1?.total) === 28000, `${c.ma(b1)} · ${JSON.stringify(r1)}`);
    const [b2, r2] = await ban(c.monKhongSx, d2.data?.code, 5000);
    c.mong('bán 10.000 + mã quà 50 % (5.000 DƯỚI trần) → 200, giảm 5.000, thu 5.000', b2.status === 200
      && Number(r2?.discount_amount) === 5000 && Number(r2?.total) === 5000, `${c.ma(b2)} · ${JSON.stringify(r2)}`);
  } },
];

// TACH-GL — chia lượt: mỗi lượt một tiến trình, các lượt chạy CÙNG LÚC (chay.js); mỗi KB đúng một lượt (chay.js kiểm lúc chạy),
// trong lượt chạy theo số tăng. Phụ thuộc PHẢI cùng lượt, KB nhỏ trước: {1, 7, 14, 23, 27} (c.billDaThu → KH.moi đã claim), {24, 25}
// liền nhau và trước 27, {4, 8} (dòng debt_payment của KH.quen — M3 của thu_gia_lap chỉ bắt ở KB8 khi đã có). KB mới: vào lượt
// ngắn nhất trừ khi dựa vào KB khác; đổi LUOT thì chạy lại E2 của thu_gia_lap (viec/TACH-GL/do_chia_e2.js). Bảng đủ + số đo:
// viec/TACH-GL/ke_hoach.md mục 2–3.
const LUOT = [[2, 15, 17, 28], [3, 10, 16, 18, 21], [1, 4, 5, 6, 7, 8, 14, 23, 24, 25, 26, 27], [9, 11, 12, 13, 19, 20, 22, 29]];

module.exports = { KICH_BAN, dungDuLieu, KH, LUOT };
