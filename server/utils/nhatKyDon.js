/**
 * POS-NEN-v1 (P19) — ghi một dòng vào nhật ký đơn.
 *
 * Nhật ký chỉ ghi những việc CHƯA có chỗ lưu: thu tiền sau, đổi cách trả,
 * (sau này) in lại. Giờ tạo / người tạo / giờ huỷ / lý do huỷ ĐÃ nằm sẵn trong
 * pos_orders — ghi lại ở đây là hai nơi giữ cùng một sự thật, nên không ghi.
 * Khi xem, đường /orders/:id/nhat-ky ghép cả hai nguồn.
 *
 * KHÔNG BAO GIỜ ném lỗi: nhật ký hỏng thì thao tác chính (thu tiền, đổi cách trả)
 * vẫn phải thành công — mất một dòng nhật ký đỡ hại hơn mất một lần thu tiền.
 */
const { run } = require('../database');
const { getNow } = require('./helpers');

async function ghiNhatKy(orderId, loai, noiDung, nguoi, chiTiet) {
  try {
    await run(
      `INSERT INTO pos_order_log (order_id, loai, noi_dung, chi_tiet, nguoi, luc)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, loai, noiDung, chiTiet ? JSON.stringify(chiTiet) : null, nguoi || null, getNow()],
    );
  } catch (e) {
    console.error('⚠️ Không ghi được nhật ký đơn', orderId, loai, e.message);
  }
}

const tenCach = (c) => (c === 'cash' ? 'tiền mặt' : c === 'transfer' ? 'chuyển khoản' : c);
const tien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

module.exports = { ghiNhatKy, tenCach, tien };
