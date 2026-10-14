/**
 * P26c — tiền khách ĐÃ TRẢ (chủ quán chốt Q2, Q4, H2 = 1B, H4 = 3A — 12.10.2026).
 * MỘT nơi tính cho đền bù (damages.js), huỷ / xoá đơn (orders.js), duyệt hoàn (refunds.js). Mọi hàm đọc qua `tx` của nơi gọi.
 */

/**
 * Mỗi dòng của đơn kèm `da_tra`: giá sau flash / hạng × số lượng, chia theo tỉ lệ tiền hàng khách trả (total − phí ship) —
 * nên gồm cả giảm cấp đơn (mã, giảm tay). Làm tròn xuống: tổng các dòng không bao giờ vượt số khách trả.
 * `chanTren` (trần đền — damages.js): đơn có mã giảm 1 MÓN thì không biết món nào được giảm (giảm không ghi xuống dòng) →
 * MỌI dòng "đã trả = giá dòng − toàn bộ giảm của mã" — không bao giờ đền quá (chủ quán chốt Câu hỏi 2, 12.10; làm đúng cần cột
 * giảm theo dòng → P26d).
 */
async function tienDaTraTheoDong(tx, order, chanTren = false) {
  const dong = await tx.query(`SELECT product_id, product_code, quantity, unit_price, flash_unit_price, tier_unit_price
    FROM pos_order_items WHERE order_id = ? ORDER BY id`, [order.id]);
  const gia = dong.map((d) => Number(d.flash_unit_price || d.tier_unit_price || d.unit_price || 0) * Number(d.quantity));
  const tong = gia.reduce((a, b) => a + b, 0);
  const tra = Math.min(tong, Math.max(0, Number(order.total || 0) - Number(order.shipping_fee || 0)));
  const ma = chanTren && order.discount_code
    ? await tx.queryOne('SELECT discount_scope FROM pos_discount_codes WHERE UPPER(code) = UPPER(?)', [order.discount_code]) : null;
  if (ma?.discount_scope === 'item') {
    const giam = Number(order.discount || 0) - Number(order.flash_discount || 0) - Number(order.tier_discount || 0);
    return dong.map((d, i) => ({ ...d, da_tra: Math.max(0, gia[i] - giam) }));
  }
  return dong.map((d, i) => ({ ...d, da_tra: tong > 0 ? Math.floor((gia[i] * tra) / tong) : 0 }));
}

/**
 * Khoản hoàn VÍ khi huỷ / xoá / duyệt hoàn → { me, con, coGoi }.
 * - Đơn có gói mua: khách đã trả (total − nợ) − giá trị gói đã dùng (giá đã trả gói × lượt đã lấy ÷ tổng lượt) — Q4, H2.
 *   Đơn khác: `viDaTra` (phần đơn đã trả bằng ví — như trước P26c).
 * - Trừ số đã đền của đơn (báo sự cố "Hoàn tiền"), không dưới 0 — H4.
 * - Ví mẹ nhận trước, tối đa phần mẹ đã trả; phần còn lại vào ví khách của đơn.
 */
async function soTienHoan(tx, order, viDaTra) {
  const goi = await tx.query('SELECT package_id, total_qty, delivered_qty FROM pos_customer_packages WHERE order_id = ?', [order.id]);
  let tong = viDaTra;
  if (goi.length) {
    const dong = await tienDaTraTheoDong(tx, order);
    let daDung = 0;
    for (const g of goi) {
      const d = dong.find((x) => Number(x.product_id) === -Number(g.package_id));
      if (d && Number(g.total_qty) > 0) daDung += (d.da_tra * Number(g.delivered_qty)) / (Number(d.quantity) * Number(g.total_qty));
    }
    tong = Number(order.total || 0) - Number(order.debt_amount || 0) - Math.ceil(daDung);
  }
  const den = await tx.queryOne(`SELECT COALESCE(SUM(refund_amount), 0) AS n FROM pos_damage_logs WHERE order_id = ? AND action = 'refund'`,
    [order.id]);
  tong = Math.max(0, tong - Number(den.n));
  const me = order.parent_phone ? Math.min(Number(order.parent_balance_amount || 0), tong) : 0;
  return { me, con: tong - me, coGoi: goi.length > 0 };
}

/**
 * Đơn đã áp mã bị huỷ / xoá / duyệt hoàn → trả một lượt mã (không dưới 0), voucher đổi điểm về `available`; điểm không hoàn
 * (H7 = 4A). Đơn cũ (trước P26c máy chủ lưu mã cả khi không áp) chỉ trả khi loại + trị giá giảm của đơn khớp mã.
 */
async function traLuotMa(tx, order) {
  if (!order.discount_code) return;
  await tx.run(`UPDATE pos_discount_codes SET used_count = MAX(0, used_count - 1)
    WHERE UPPER(code) = UPPER(?) AND discount_type = ? AND discount_value = ?`, [order.discount_code, order.discount_type, order.discount_value]);
  await tx.run(`UPDATE pos_voucher_grants SET status = 'available', used_order_id = NULL, used_at = NULL WHERE used_order_id = ?`, [order.id]);
}

/**
 * GOI-2 (Q4a; chủ quán chốt Q-A, Q-B 14.10.2026) — hoàn phần còn lại của MỘT gói khách khi kết thúc gói →
 * { tong, me, vi, tien_mat, don } hoặc { loi, error }.
 * - gốc = giá khách ĐÃ TRẢ cho gói (da_tra của dòng gói ÷ số gói trên dòng — một dòng mua nhiều gói chia đều) × túi còn ÷ tổng túi,
 *   làm tròn xuống (không bao giờ hoàn quá; cùng chiều soTienHoan làm tròn LÊN phần đã dùng);
 * - trần cộng dồn theo đơn mua: ≤ (total − nợ) − đã hoàn − đã đền của đơn (I19); đơn còn nợ → không hoàn (Q-B);
 * - ví mẹ TRƯỚC, tối đa phần mẹ đã trả chưa hoàn (1B); phần khách trả bằng ví tối đa `balance_amount` chưa hoàn (dòng 'cash', giảm
 *   total_spent — I11); còn lại là tiền mặt / CK → dòng 'hoan_goi'. Huỷ / xoá / duyệt hoàn đều bị chặn khi đơn có gói đã kết thúc
 *   (orders.js A4, refunds.js DON_CO_GOI) nên mọi dòng hoàn của đơn này đều do kết thúc gói → cộng dồn đúng.
 */
async function soTienHoanGoi(tx, cp) {
  const don = await tx.queryOne('SELECT * FROM pos_orders WHERE id = ?', [cp.order_id]);
  const dong = don && don.status === 'completed' ? (await tienDaTraTheoDong(tx, don)).find((d) => Number(d.product_id) === -Number(cp.package_id)) : null;
  if (!dong || !(Number(cp.total_qty) > 0)) return { loi: 'GOI_KHONG_CO_DON_MUA', error: 'Không tìm thấy đơn mua gói còn hiệu lực — chỉ kết thúc KHÔNG hoàn được' };
  if (Number(don.debt_amount || 0) > 0) return { loi: 'DON_CON_NO', error: 'Đơn mua gói còn nợ — thu nợ trước, hoặc chọn Không hoàn' };
  const con = Math.max(0, Number(cp.total_qty) - Number(cp.delivered_qty));
  const goc = Math.floor(((dong.da_tra / Number(dong.quantity)) * con) / Number(cp.total_qty));
  const so = await tx.queryOne(`SELECT
      COALESCE(SUM(CASE WHEN type IN ('refund', 'compensation') THEN amount END), 0) AS nhan,
      COALESCE(SUM(CASE WHEN type = 'refund' AND customer_phone = ? THEN amount END), 0) AS me,
      COALESCE(SUM(CASE WHEN type = 'refund' AND customer_phone = ? AND COALESCE(payment_method, '') <> 'hoan_goi' THEN amount END), 0) AS vi
    FROM pos_balance_transactions WHERE order_id = ?`, [don.parent_phone || '', don.customer_phone, don.id]);
  const tong = Math.max(0, Math.min(goc, Number(don.total || 0) - Number(so.nhan)));
  const me = don.parent_phone ? Math.max(0, Math.min(Number(don.parent_balance_amount || 0) - Number(so.me), tong)) : 0;
  const vi = Math.max(0, Math.min(Number(don.balance_amount || 0) - Number(so.vi), tong - me));
  return { tong, me, vi, tien_mat: tong - me - vi, don };
}

module.exports = { tienDaTraTheoDong, soTienHoan, soTienHoanGoi, traLuotMa };
