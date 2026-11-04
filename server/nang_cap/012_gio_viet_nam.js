/**
 * Bước 012 (GIO-VN-1): đổi giờ CŨ sang giờ Việt Nam `YYYY-MM-DDTHH:mm:ss` — đổi DỮ LIỆU, không đổi cột. Quy tắc (loại nhận biết, bảng / cột,
 * sao lưu _sao_luu_012_<bảng>) ở server/utils/chuanHoaGio.js — cùng hàm khôi phục bản sao lưu cũ dùng.
 */
const { chuanHoaGio } = require('../utils/chuanHoaGio');

module.exports.chay = (tx) => chuanHoaGio(tx);
