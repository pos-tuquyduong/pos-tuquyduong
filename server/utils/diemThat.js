/**
 * DIEM-THAT-1 (chủ quán chốt 24.10, DAC_TA_BAN_HANG_2410.md mục 1.14): điểm thưởng CHỈ tính trên tiền khách trả thật lần này —
 * tiền mặt + chuyển khoản, KHÔNG tính phần trừ tài khoản (tài khoản / tài khoản mẹ), KHÔNG tính phí giao.
 * MỘT hàm cho mọi chỗ cộng điểm: POST /orders, pay-debt (orders.js) và /nhan-diem (signup-codes.js).
 * `dong` là một dòng pos_orders (hoặc cùng ba trường); số nguyên đồng, không âm.
 */
const tienTinhDiem = (dong) => Math.max(0, Math.round(
  (Number(dong.cash_amount) || 0) + (Number(dong.transfer_amount) || 0) - (Number(dong.shipping_fee) || 0)));

module.exports = { tienTinhDiem };
