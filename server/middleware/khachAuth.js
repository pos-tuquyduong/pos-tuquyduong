/**
 * KH-API-1 (F) — xác thực KHÁCH của App KH, tách hẳn token nhân viên (middleware/auth.js không đổi).
 * - Token khách ký bằng KH_JWT_SECRET, mang { loai: 'kh', id }. Token nhân viên ký bằng JWT_SECRET → verify ở đây hỏng → 401;
 *   ngược lại token khách tới /api/pos/* cũng hỏng ở authenticate → 401.
 * - Thiếu KH_JWT_SECRET, hoặc trùng JWT_SECRET → coi như CHƯA cấu hình: 503 (đóng, không mở).
 * - Khách lấy từ hàng pos_customers theo id trong token — SĐT KHÔNG BAO GIỜ lấy từ tham số / thân yêu cầu.
 */
const jwt = require('jsonwebtoken');
const { queryOne } = require('../database');

const HAN_TOKEN = '30d';

/** Khoá ký token khách, hoặc null nếu chưa cấu hình đúng. Đọc lúc gọi. */
function khoaKhach() {
  const k = process.env.KH_JWT_SECRET;
  return k && k !== process.env.JWT_SECRET ? k : null;
}

function canCauHinhKhach(req, res, next) {
  if (!khoaKhach()) return res.status(503).json({ error: 'App khách chưa được cấu hình', code: 'KH_CHUA_CAU_HINH' });
  next();
}

function kyTokenKhach(id) {
  return jwt.sign({ loai: 'kh', id }, khoaKhach(), { expiresIn: HAN_TOKEN });
}

async function xacThucKhach(req, res, next) {
  const tuChoi = () => res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ — đăng nhập lại', code: 'KH_TOKEN_SAI' });
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return tuChoi();
  let tt;
  try { tt = jwt.verify(h.slice(7), khoaKhach()); } catch { return tuChoi(); }
  if (!tt || tt.loai !== 'kh') return tuChoi();
  try {
    // SELECT * (KH-API-3): không nêu tên cột của bước nâng cấp (xung_ho) — bước đó chưa chạy thì chỉ thiếu trường, không 500 mọi cửa.
    // Ra ngoài chỉ qua danh sách trắng hoSo (routes/kh/index.js).
    const khach = await queryOne('SELECT * FROM pos_customers WHERE id = ?', [tt.id]);
    if (!khach) return tuChoi();
    req.khach = khach;
    next();
  } catch (err) {
    console.error('xacThucKhach:', err.message);
    res.status(500).json({ error: 'Lỗi máy chủ, thử lại sau', code: 'LOI_MAY_CHU' });
  }
}

/** KH-API-3 — token KHÔNG bắt buộc: không gửi tiêu đề Authorization → req.khach = null; CÓ gửi → kiểm y như xacThucKhach (sai → 401). */
function tuyChonKhach(req, res, next) {
  if (req.headers.authorization === undefined) { req.khach = null; return next(); }
  return xacThucKhach(req, res, next);
}

/** Giờ hết hạn của token khách, giờ VN dạng YYYY-MM-DDTHH:mm:ss — cùng cách định dạng với getNow (utils/helpers.js). */
function hanTokenKhach(token) {
  return new Date(jwt.decode(token).exp * 1000).toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(' ', 'T');
}

module.exports = { khoaKhach, canCauHinhKhach, kyTokenKhach, xacThucKhach, tuyChonKhach, hanTokenKhach };
