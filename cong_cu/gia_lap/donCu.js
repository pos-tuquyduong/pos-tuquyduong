/**
 * BO-MAN-CU-1 — dựng "ĐƠN CŨ" cho bài thử: đơn trừ ví (cả một phần), ví mẹ, chuyển khoản, ghi nợ, mua / lấy gói — đúng loại đơn quầy cũ
 * đã ghi và đang nằm trên quầy thật. Từ BO-MAN-CU-1 đường thẳng POST /orders chặn các loại này (cửa chặn `taoDon`), nên bài thử dựng
 * chúng bằng THÂN `taoDonGoc` (chính mã đã ghi dữ liệu cũ), gọi trong cùng tiến trình — không lối HTTP nào tới được thân này.
 * `mayChu` = thư mục server/ mà app thử đang nạp (cùng module → chạy đúng trên bản sao đột biến). Trả { status, body } như gọi HTTP.
 * KHOÁ (soát vòng 1): trước khi dựng, đưa ĐÚNG thân đó qua cửa chặn `taoDon` (đường thẳng, phien null) — quầy hôm nay phải từ chối bằng
 * một mã chặn; không từ chối → ném lỗi. donCu không bao giờ dựng hộ một đơn mà quầy thật vẫn nhận (bài thử khỏi che đường thật), và trên
 * code gốc (chưa có cửa chặn) mọi bài dùng donCu đỏ đúng lý do "đường thẳng còn nhận thân này".
 * `laDonCu(than)`: thân cửa chặn sẽ từ chối ở đường thẳng → bài thử dựng bằng donCu; đơn tiền mặt thường vẫn đi HTTP thật.
 * Bài thử chặn (thu_BOMANCU1) KHÔNG dùng vị từ này — nó so trực tiếp câu trả của máy chủ.
 */
const path = require('path');

const MA_CHAN = ['GOI_TAM_DUNG', 'VI_PHAI_QUA_PIN', 'CK_PHAI_QUA_PAYOS', 'KHONG_GHI_NO'];   // mã của cửa chặn taoDon (server/routes/orders.js)

const laDonCu = (b = {}) => !!(b.package_buy || b.customer_package_id || (Array.isArray(b.items) && b.items.some((i) => i && i.from_package))
  || Number(b.balance_amount) > 0 || Number(b.parent_balance_amount) > 0 || (Number(b.transfer_amount) || 0) !== 0 || Number(b.debt_amount) > 0
  || ['balance', 'transfer', 'debt', 'cho_thu'].includes(b.payment_method));

// res giả: json() đi qua JSON như res.json của express (BigInt ném lỗi y như thật — thu_P26a canh lỗi đó), giữ thân đã qua dây.
const resGia = () => ({ statusCode: 200, body: undefined, status(c) { this.statusCode = c; return this; }, json(b) { this.body = JSON.parse(JSON.stringify(b)); return this; } });

async function donCu(mayChu, than, nguoi = { username: 'chu', display_name: 'Chủ quán' }) {
  const m = require(path.join(mayChu, 'routes', 'orders.js'));
  const taoDonGoc = m.taoDonGoc;
  if (typeof taoDonGoc !== 'function') throw new Error('donCu: orders.js chưa có taoDonGoc (code chưa tách cửa chặn BO-MAN-CU-1)');
  const chan = resGia();
  await m.taoDon({ body: JSON.parse(JSON.stringify(than)), user: nguoi }, chan);
  if (chan.statusCode !== 400 || !MA_CHAN.includes(chan.body?.code)) {
    throw new Error(`donCu: đường thẳng KHÔNG chặn thân này (HTTP ${chan.statusCode}${chan.body?.code ? ' · ' + chan.body.code : ''}) — chỉ dựng đơn cũ cho thân quầy hôm nay từ chối`);
  }
  const res = resGia();
  await taoDonGoc({ body: JSON.parse(JSON.stringify(than)), user: nguoi }, res);
  return { status: res.statusCode, body: res.body };
}

module.exports = { donCu, laDonCu, MA_CHAN };
