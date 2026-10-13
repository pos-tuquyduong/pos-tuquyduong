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

module.exports = { tienDaTraTheoDong, soTienHoan, traLuotMa };
