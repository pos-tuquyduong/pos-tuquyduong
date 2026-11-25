/**
 * KHO-3a (chủ quán 17.11): POS NGẮT HẲN SX — không còn lời gọi mạng nào sang SX; không đọc biến SX nào.
 * File GIỮ chỉ vì bước nâng cấp 020_chep_khach_sx.js (đã chạy trên production, luật nâng cấp: không sửa bước cũ) `require` nó lúc nạp:
 * gọi tới thì ném ngay → bước 020 HOÃN như khi SX không trả lời, không gọi mạng.
 */
async function callSxApi() {
  throw Object.assign(new Error('Đã ngắt kết nối SX (KHO-3a)'), { code: 'SX_DA_NGAT' });
}

module.exports = { callSxApi };
