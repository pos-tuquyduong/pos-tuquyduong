/**
 * ND-API-1 — cầu nối DUY NHẤT từ "nhà riêng" nd sang BẢNG / quyền / vé POS (nghiệm thu A). Bê nd sang máy chủ App: viết lại tệp này, cấp lại
 * hai mô-đun hạ tầng các tệp nd dùng thẳng (../database: query / run / beginTransaction; ../utils/helpers: getNow), và xoá chỗ backup.js gọi xuat().
 * Chỉ ĐỌC: pos_users (đăng nhập + đọc lại MỖI lần gọi — khoá tài khoản là hết ngay) và pos_permissions (quyền — thu quyền là hết ngay).
 * Chuyển tiếp của POS (Q-H): xác thực vé POS và kiểm PIN chủ quán cho thẻ Cài đặt khoá sao lưu — không câu SQL nào vào bảng PIN.
 * Bộ kiểm (cong_cu/thu_NDAPI1.js A1) khoá: tệp nào khác trong server/nd/ có chữ "pos" + "_" là đỏ.
 */
const { queryOne } = require('../database');
const { authenticate } = require('../middleware/auth');
const { kiemPinChuQuan } = require('../utils/pinChuQuan');

const COT = 'id, username, display_name, role, is_active';
const timNguoiDung = (ten) => queryOne(`SELECT ${COT}, password FROM pos_users WHERE username = ?`, [ten]);
const docNguoiDung = (id) => queryOne(`SELECT ${COT} FROM pos_users WHERE id = ?`, [id]);

/** Cùng luật checkPermission của POS (middleware/auth.js): chủ quán (owner) có mọi quyền; vai trò khác đọc pos_permissions. */
async function coQuyen(role, quyen) {
  if (role === 'owner') return true;
  const r = await queryOne('SELECT allowed FROM pos_permissions WHERE role = ? AND permission = ?', [role, quyen]);
  return !!(r && Number(r.allowed));
}

/** Khoá ký vé POS — nd chỉ DẪN khoá riêng từ nó (tinh.js khoaVe, Q-E), không bao giờ ký bằng nó. */
const khoaVePos = () => process.env.JWT_SECRET;

module.exports = { timNguoiDung, docNguoiDung, coQuyen, khoaVePos, xacThucPos: authenticate, kiemPinChuQuan };
