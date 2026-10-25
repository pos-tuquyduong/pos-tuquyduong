/**
 * DIEM-THAT-1 (chủ quán chốt 24.10, DAC_TA_BAN_HANG_2410.md mục 1.14): điểm thưởng CHỈ tính trên tiền khách trả thật lần này —
 * tiền mặt + chuyển khoản, KHÔNG tính phần trừ tài khoản (tài khoản / tài khoản mẹ), KHÔNG tính phí giao.
 * Trần total − ví − ví mẹ (chủ quán chốt 25.10): phép kiểm tổng của POST /orders cho lệch ±1đ, tiền mặt máy khách gửi thừa 1đ
 * không được thêm điểm. Thiếu `total` → trần 0 → 0 điểm (thà thiếu điểm hơn cộng sai).
 * MỘT hàm cho mọi chỗ cộng điểm: POST /orders, pay-debt (orders.js) và /nhan-diem (signup-codes.js).
 * `dong` là một dòng pos_orders (hoặc cùng các trường dưới); số nguyên đồng, không âm.
 */
const tienTinhDiem = (dong) => {
  const traThat = (Number(dong.cash_amount) || 0) + (Number(dong.transfer_amount) || 0);
  const tran = (Number(dong.total) || 0) - (Number(dong.balance_amount) || 0) - (Number(dong.parent_balance_amount) || 0);
  return Math.max(0, Math.round(Math.min(traThat, tran) - (Number(dong.shipping_fee) || 0)));
};

module.exports = { tienTinhDiem };
