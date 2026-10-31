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
  CAN_TEN: [400, 'Nhập tên và cách xưng hô để tạo tài khoản'],
  TEN_KHONG_HOP_LE: [400, `Tên phải từ 1 đến ${GIOI_HAN.TEN_TOI_DA} ký tự`],
  XUNG_HO_SAI: [400, 'Cách xưng hô không hợp lệ'],
  DIA_CHI_QUA_DAI: [400, `Địa chỉ tối đa ${GIOI_HAN.DIA_CHI_TOI_DA} ký tự`],
  KHONG_THAY_DON: [404, 'Không tìm thấy đơn'],
  KHONG_TIM_THAY: [404, 'Không có chức năng này'],
  YEU_CAU_KHONG_HOP_LE: [400, 'Yêu cầu không hợp lệ'],
  LOI_MAY_CHU: [500, 'Lỗi máy chủ, thử lại sau'],
  // KH-MUA-1 — đặt đơn App
  CHUA_GIAO: [400, 'Chưa nhận giao hàng qua App — chọn nhận tại quán'],
  NGOAI_GIO: [400, 'Quán đang ngoài giờ mở cửa — chưa nhận đơn'],
  QUA_GIO_NHAN_DON: [400, 'Quán sắp đóng cửa — đã ngừng nhận đơn qua App'],
  HET_HANG: [400, 'Món đã hết hàng'],
  MON_KHONG_BAN: [400, 'Món này hiện không bán'],
  KHOA_GUI_SAI: [400, 'Khoá gửi không hợp lệ'],
  KHOA_GUI_DA_DUNG: [409, 'Khoá gửi đã dùng cho một đơn khác'],
  DANG_XU_LY: [503, 'Đơn đang được xử lý — thử lại sau giây lát'],
  GIA_DA_DOI: [409, 'Giá đơn vừa thay đổi — xem lại tổng tiền rồi đặt lại'],
  VI_KHONG_DU: [400, 'Ví không đủ trả cả đơn'],
  DA_TRA_GOI_QUAN: [400, 'Đơn đã trả tiền — muốn huỷ hãy gọi quán'],
  DON_KHONG_HOP_LE: [400, 'Đơn không hợp lệ'],
};

/** { status, body } của một lỗi — `them` thêm trường (ma, thu_lai_sau_giay, bao_gia) hoặc thay `error` bằng lời cụ thể hơn. */
function thanLoi(code, them = {}) {
  const [status, error] = LOI[code];
  return { status, body: { error, code, ...them } };
}

function bao(res, code, them) {
  const t = thanLoi(code, them);
  return res.status(t.status).json(t.body);
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

module.exports = { bao, thanLoi, loiMayChu, loiTangKh };
