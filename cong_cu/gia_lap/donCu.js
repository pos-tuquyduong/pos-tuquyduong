/**
 * BO-MAN-CU-1 — dựng "ĐƠN CŨ" cho bài thử: đơn trừ ví (cả một phần), ví mẹ, chuyển khoản, ghi nợ, mua / lấy gói — đúng loại đơn quầy cũ
 * đã ghi và đang nằm trên quầy thật. Từ BO-MAN-CU-1 đường thẳng POST /orders chặn các loại này (cửa chặn `taoDon`), nên bài thử dựng
 * chúng bằng THÂN `taoDonGoc` (chính mã đã ghi dữ liệu cũ), gọi trong cùng tiến trình — không lối HTTP nào tới được thân này.
 * `mayChu` = thư mục server/ mà app thử đang nạp (cùng module → chạy đúng trên bản sao đột biến). Trả { status, body } như gọi HTTP.
 */
const path = require('path');

async function donCu(mayChu, than, nguoi = { username: 'chu', display_name: 'Chủ quán' }) {
  const { taoDonGoc } = require(path.join(mayChu, 'routes', 'orders.js'));
  if (typeof taoDonGoc !== 'function') throw new Error('donCu: orders.js chưa có taoDonGoc (code chưa tách cửa chặn BO-MAN-CU-1)');
  const res = { statusCode: 200, body: undefined, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  await taoDonGoc({ body: JSON.parse(JSON.stringify(than)), user: nguoi }, res);
  return { status: res.statusCode, body: res.body };
}

module.exports = { donCu };
