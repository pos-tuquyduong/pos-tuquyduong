/**
 * VI-ME-1 — MỘT hàm đối chiếu quan hệ mẹ–con trước khi đọc / giữ / trừ tài khoản mẹ. Nguồn DUY NHẤT pos_customers (chủ quán 10.11:
 * khách chỉ có trong danh sách đăng ký thì từ chối). Cho qua khi khách tồn tại VÀ parent_phone của khách = SĐT mẹ gửi lên (cả hai vế
 * chuẩn hoá). Gọi ở taoDon (orders.js) — tạo đơn quầy, tạo phiên giữ chỗ và chốt phiên đều đi qua đó.
 * Trả null (đúng mẹ) hoặc { status, body } để route trả thẳng.
 */
const { queryOne } = require('../database');
const { normalizePhone } = require('./helpers');

const LOI_KHONG_PHAI_ME = { status: 403, body: { error: 'Tài khoản này không phải tài khoản mẹ của khách', code: 'KHONG_PHAI_TK_ME' } };

async function kiemTraMe(phoneKhach, sdtMe) {
  const phone = normalizePhone(phoneKhach), me = normalizePhone(sdtMe);
  const kh = phone && me && await queryOne('SELECT parent_phone FROM pos_customers WHERE phone = ?', [phone]);
  return kh && normalizePhone(kh.parent_phone) === me ? null : LOI_KHONG_PHAI_ME;
}

module.exports = { kiemTraMe };
