/**
 * KH-API-1 (G) — trả lỗi cho route khách: chỉ { error, code }, không bao giờ lời báo nội bộ.
 */
const { loiGhi } = require('../wallets');
const { GIOI_HAN } = require('../../utils/maKhach');

const LOI = {
  SDT_KHONG_HOP_LE: [400, 'Số điện thoại không hợp lệ'],
  QUA_NHIEU_LAN: [429, 'Thử quá nhiều lần — đợi một lúc rồi thử lại'],
  MA_SAI: [400, 'Mã không đúng'],
  MA_HET_HAN: [400, 'Mã đã hết hạn hoặc đã dùng — xin mã mới'],
  CAN_TEN: [400, 'Nhập tên để tạo tài khoản'],
  TEN_KHONG_HOP_LE: [400, `Tên phải từ 1 đến ${GIOI_HAN.TEN_TOI_DA} ký tự`],
  KHONG_THAY_DON: [404, 'Không tìm thấy đơn'],
  KHONG_TIM_THAY: [404, 'Không có chức năng này'],
  YEU_CAU_KHONG_HOP_LE: [400, 'Yêu cầu không hợp lệ'],
};

function bao(res, code) {
  const [status, error] = LOI[code];
  return res.status(status).json({ error, code });
}

/** Kho bận → 409 KHO_BAN (dùng lại loiGhi); lỗi khác → 500 LOI_MAY_CHU, lời báo chỉ vào log. */
function loiMayChu(res, err, noi) {
  if (err && err.code === 'SQLITE_BUSY') return loiGhi(res, err);
  console.error(`${noi}:`, err && err.message);
  return res.status(500).json({ error: 'Lỗi máy chủ, thử lại sau', code: 'LOI_MAY_CHU' });
}

/** Lỗi tầng ứng dụng dưới /api/kh (express.json: JSON hỏng 400, thân quá lớn 413 — ném TRƯỚC router) → { error, code }, giữ status 4xx.
 *  Gắn ở index.js NGAY SAU router /api/kh, trước bộ lỗi chung. */
function loiTangKh(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: LOI.YEU_CAU_KHONG_HOP_LE[1], code: 'YEU_CAU_KHONG_HOP_LE' });
  }
  return loiMayChu(res, err, 'kh');
}

module.exports = { bao, loiMayChu, loiTangKh };
