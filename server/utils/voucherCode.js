/**
 * Sinh mã 6 ký tự dùng chung cho mọi loại voucher/mã trong hệ thống
 * (voucher đổi điểm ở loyalty.js, mã khách-mới ở signup-codes.js...).
 * Bỏ ký tự dễ nhìn nhầm O/0, I/1/L. Không phân biệt hoa/thường
 * (toàn hệ so mã bằng UPPER). ~887 triệu tổ hợp → hiếm trùng;
 * nơi gọi vẫn nên tự kiểm tra trùng trong DB trước khi lưu (xem loyalty.js /redeem).
 */
function generateVoucherCode() {
  const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // đã bỏ O,0,I,1,L
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

module.exports = { generateVoucherCode };
