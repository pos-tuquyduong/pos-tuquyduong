/**
 * NAP-1 — ví hai ngăn: TIỀN NẠP (khách trả thật) + THƯỞNG NẠP (phần gói nạp cho thêm, không hạn). Số dư = hai ngăn; ví chỉ lưu
 * `thuong`, tiền nạp = balance − thuong. Mọi lối ghi ví đi qua ghiVi (wallets.js) — ghiVi gọi hai hàm dưới để chia ngăn, chỗ gọi không tự tính.
 * - Trừ (trả đơn, ví mẹ, trừ tay, điều chỉnh âm): theo TỶ LỆ đang có (thuongKhiTru).
 * - Cộng lại theo đơn (huỷ, xoá, duyệt hoàn, đền bù, kết thúc gói): theo TỶ LỆ thưởng / ví của phần ĐÃ TRỪ cho đơn đó trên ví đó, không vượt
 *   phần thưởng đã trừ chưa trả lại (chủ quán 05.11 câu 3). Nạp tay, điều chỉnh cộng, tiền mặt / CK hoàn vào ví (hoan_goi) → tiền nạp.
 * - Đơn nạp: dòng hàng `product_id ≤ ID_NAP_TU` (−2000000 − mã gói; dải gói −1..−999999, thẻ −1000000..−1999999). Một vị từ (sqlDonNap /
 *   laDonNap) cho huỷ, xoá, báo cáo, két, bất biến.
 */
const ID_NAP_TU = -2000000;

/** Phần thưởng (≥ 0) của một khoản trừ `soTru` khỏi ví đang có `soDu`, trong đó `thuong` là thưởng. Tiền nạp sau trừ không âm. */
function thuongKhiTru(soDu, thuong, soTru) {
  if (!(soDu > 0) || !(thuong > 0) || !(soTru > 0)) return 0;
  if (soTru >= soDu) return thuong;
  return Math.min(thuong, Math.max(thuong - (soDu - soTru), Math.round((soTru * thuong) / soDu)));
}

/** Phần thưởng (≥ 0) của một khoản CỘNG LẠI `soTien` vào ví `phone` theo đơn `orderId` — đọc sổ của (ví, đơn) trong giao dịch `tx`. */
async function thuongKhiHoan(tx, phone, orderId, soTien) {
  const r = await tx.queryOne(`SELECT COALESCE(-SUM(CASE WHEN type = 'purchase' THEN amount END), 0) AS vi_tru,
      COALESCE(-SUM(CASE WHEN type = 'purchase' THEN thuong END), 0) AS thuong_tru,
      COALESCE(SUM(CASE WHEN type IN ('refund', 'compensation') THEN thuong END), 0) AS thuong_tra
    FROM pos_balance_transactions WHERE customer_phone = ? AND order_id = ?`, [phone, orderId]);
  const viTru = Number(r?.vi_tru || 0), thuongTru = Number(r?.thuong_tru || 0);
  const con = thuongTru - Number(r?.thuong_tra || 0);
  if (!(viTru > 0) || !(con > 0) || !(soTien > 0)) return 0;
  return Math.min(con, Math.round((soTien * thuongTru) / viTru));
}

/** Mẩu SQL: đơn `bi` (bí danh / tên bảng pos_orders) là đơn nạp. */
const sqlDonNap = (bi) => `EXISTS (SELECT 1 FROM pos_order_items oi_nap WHERE oi_nap.order_id = ${bi}.id AND oi_nap.product_id <= ${ID_NAP_TU})`;

async function laDonNap(q, orderId) {
  return !!(await q.queryOne(`SELECT 1 AS co FROM pos_order_items WHERE order_id = ? AND product_id <= ${ID_NAP_TU} LIMIT 1`, [orderId]));
}

const LOI_NAP_KHONG_HOAN = { error: 'Đơn nạp tiền không huỷ / xoá / hoàn được — tiền nạp không hoàn. Sai số thì chủ quán điều chỉnh số dư (ghi lý do).',
  code: 'NAP_KHONG_HOAN' };

module.exports = { ID_NAP_TU, thuongKhiTru, thuongKhiHoan, sqlDonNap, laDonNap, LOI_NAP_KHONG_HOAN };
