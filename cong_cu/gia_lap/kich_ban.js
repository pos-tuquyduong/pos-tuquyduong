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
  c.ma = (r) => `HTTP ${r.status}${r.code ? ' · ' + r.code : ''}${r.error ? ' · ' + r.error : ''}`;

  const dat = (k, v) => db.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [k, v]);
  for (const [k, v] of [['signup_enabled', '1'], ['signup_discount_type', 'percent'], ['signup_discount_value', '10'],
    ['nhandiem_enabled', '1'], ['loyalty_enabled', 'true'], ['loyalty_earn_per_amount', '10000'], ['flash_enabled', 'false']]) await dat(k, v);
  const sp = await db.query("SELECT * FROM pos_products WHERE is_active = 1 AND COALESCE(sx_product_type, '') <> '' ORDER BY id LIMIT 5");
  if (sp.length !== 5) throw new Error(`dữ liệu mẫu: cần 5 món có mã SX, có ${sp.length}`);
  for (const [i, p] of sp.entries()) await db.run('UPDATE pos_products SET price = ? WHERE id = ?', [GIA[i], p.id]);
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
  { ten: 'hoàn tiền', chay: async (c) => {
    const d = await c.taoDon('KB6', { customer_phone: KH.quen, customer_name: 'Khách quen', items: [c.mon(1)], payment_method: 'balance', balance_amount: 20000 });
    const truoc = await c.vi(KH.quen);
    const yc = await c.goi('nv', 'POST', '/refunds', { order_id: d.id, reason: 'giả lập hoàn' });
    const dy = await c.goi('chu', 'POST', `/refunds/${yc.refund_id}/approve`, {});
    const o = await c.db.queryOne('SELECT status FROM pos_orders WHERE id = ?', [d.id]);
    c.mong('yêu cầu + duyệt hoàn → 200, refunded, ví +20.000', yc.status === 200 && dy.status === 200 && o.status === 'refunded'
      && await c.vi(KH.quen) === truoc + 20000, `${c.ma(yc)} / ${c.ma(dy)} / ${o.status}`);
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
];

module.exports = { KICH_BAN, dungDuLieu, KH };
