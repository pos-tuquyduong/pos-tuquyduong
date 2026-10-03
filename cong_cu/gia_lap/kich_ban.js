/**
 * GIẢ LẬP QUẦY (TU-CHAY-4) — dữ liệu mẫu cố định + kịch bản quầy.
 *
 * Mỗi kịch bản gọi API ĐÚNG như nhân viên bấm (không chép logic máy chủ), ghi
 * mong đợi HTTP bằng status + `code` (không dò chữ — E12), và ghi SỔ PHÍA QUẦY
 * (lệnh thu / đổi cách trả trả 200) để bat_bien.js I9 đối chiếu nhật ký đơn.
 *
 * LUẬT: việc sau THÊM kịch bản mới vào cuối, KHÔNG xoá kịch bản cũ — chúng là
 * lưới chống lỗi quay lại. Bộ kiểm có bánh cóc số kịch bản (chỉ được tăng).
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
    const d = await c.taoDon('KB10', { items: [c.mon(0)], payment_method: 'cho_thu', debt_amount: 25000 });
    const ra = await Promise.all([c.thu('chu', d.id, 'cash'), c.thu('nv', d.id, 'transfer')]);
    // Bằng chứng chồng nhau: tuần tự thì người sau ra 400 không có code (đã paid, orders.js:1245);
    // chỉ khi cả hai cùng qua phép đọc ngoài giao dịch thì người sau mới ra 409 DA_THU_ROI.
    const st = ra.map((r) => r.status).sort().join(',');
    c.mong('hai lệnh thu chồng nhau → đúng một 200 + một 409 DA_THU_ROI', st === '200,409' && ra.some((r) => r.code === 'DA_THU_ROI'),
      ra.map(c.ma).join(' / '));
    const tl = [...c.doLenh].sort((a, b) => a - b);
    const giua = tl.length ? tl[Math.floor(tl.length / 2)] : 0;
    c.mong('trễ kho đang bật (trung vị một lệnh ≥ 35 ms)', giua >= 35, `trung vị ${giua} ms trên ${tl.length} lệnh`);
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
];

module.exports = { KICH_BAN, dungDuLieu, KH };
