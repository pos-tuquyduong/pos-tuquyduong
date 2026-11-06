/**
 * Điểm thưởng tính trên tiền khách trả cho đơn: tiền mặt + chuyển khoản + trừ tài khoản (tài khoản khách / tài khoản mẹ — CẢ hai ngăn tiền nạp
 * và thưởng nạp), KHÔNG tính phí giao. NAP-1 (chủ quán 01.11) đổi luật DIEM-THAT-1 24.10: phần trả bằng tài khoản nay CÓ điểm như tiền mặt
 * (lúc nạp KHÔNG tích — đơn nạp không cộng điểm ở orders.js, không phát mã bill).
 * Trần total: phép kiểm tổng của POST /orders cho lệch ±1đ, tiền mặt máy khách gửi thừa 1đ không được thêm điểm (chủ quán chốt 25.10 giữ trần
 * trong hàm chung — cả pay-debt, /nhan-diem). Thiếu `total` → trần 0 → 0 điểm (thà thiếu điểm hơn cộng sai).
 * MỘT hàm cho mọi chỗ cộng điểm: POST /orders, pay-debt (orders.js) và /nhan-diem (signup-codes.js).
 * `dong` là một dòng pos_orders (hoặc cùng các trường dưới); số nguyên đồng, không âm.
 */
const tienTinhDiem = (dong) => {
  const tra = (Number(dong.cash_amount) || 0) + (Number(dong.transfer_amount) || 0)
    + (Number(dong.balance_amount) || 0) + (Number(dong.parent_balance_amount) || 0);
  return Math.max(0, Math.round(Math.min(tra, Number(dong.total) || 0) - (Number(dong.shipping_fee) || 0)));
};

module.exports = { tienTinhDiem };
