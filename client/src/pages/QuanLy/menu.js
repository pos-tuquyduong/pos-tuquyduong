/**
 * QuanLy/menu.js — menu POS 6 mục (BH-2, chủ quán duyệt 27.10) và lưới trang Quản lý. HÀM THUẦN: không React, không mạng.
 * Chỉ dời đường dẫn: mọi đường cũ vẫn mở được (App.jsx), quyền giữ đúng như từng mục cũ. Bài thử: cong_cu/thu_BH2.js.
 * `coQuyen(tên)` = hasPermission của AuthContext. Icon do Layout.jsx gắn theo đường dẫn.
 */

const hien = (coQuyen, quyen) => !quyen || coQuyen(quyen);

const MAY_TINH = [
  { to: '/', ten: 'Bán hàng' },
  { to: '/hom-nay', ten: 'Hôm nay', quyen: 'view_reports' },
  { to: '/orders', ten: 'Đơn hàng' },
  { to: '/customers', ten: 'Khách hàng' },
  { to: '/kho', ten: 'Kho' },
  { to: '/quan-ly', ten: 'Quản lý' },
];
// Điện thoại: "Thêm" (to: null) mở bảng đủ 6 mục + Đăng xuất.
const DIEN_THOAI = [
  { to: '/', ten: 'Bán hàng' },
  { to: '/hom-nay', ten: 'Hôm nay', quyen: 'view_reports' },
  { to: '/orders', ten: 'Đơn' },
  { to: '/customers', ten: 'Khách' },
  { to: null, ten: 'Thêm' },
];

export function dungMenu(coQuyen) {
  const loc = (ds) => ds.filter((m) => hien(coQuyen, m.quyen));
  return { mayTinh: loc(MAY_TINH), dienThoai: loc(DIEN_THOAI) };
}

// Lối thêm trên màn đã có (App.jsx bọc ThanhLoi quanh màn, không sửa màn): Đơn hàng → Hoàn tiền, Khách hàng → Số dư.
const LOI_THEM = {
  orders: [{ to: '/refunds', ten: 'Hoàn tiền', quyen: 'approve_refund' }],
  customers: [{ to: '/balance', ten: 'Số dư', quyen: 'view_customer_balance' }],
};
export const loiThem = (man, coQuyen) => (LOI_THEM[man] || []).filter((l) => hien(coQuyen, l.quyen));

const O_QUAN_LY = [
  { ten: 'Sản phẩm & công thức', ghiChu: 'Món, công thức, giá', loi: [{ to: '/kho', ten: 'Mở Kho' }] },
  { ten: 'Nguyên liệu', ghiChu: 'Tồn, lô, hạn dùng', loi: [{ to: '/kho', ten: 'Mở Kho' }] },
  { ten: 'Khuyến mãi & thành viên', ghiChu: 'Mã giảm giá, hạng thẻ', loi: [{ to: '/discount-codes', ten: 'Mã chiết khấu', quyen: 'manage_users' }, { to: '/settings', ten: 'Hạng thành viên', quyen: 'manage_users' }] },
  { ten: 'Con người', ghiChu: 'Người dùng, phân quyền', loi: [{ to: '/settings', ten: 'Người dùng', quyen: 'manage_users' }] },
  { ten: 'Báo cáo', ghiChu: 'Doanh thu, đối soát', loi: [{ to: '/reports', ten: 'Báo cáo', quyen: 'view_reports' }] },
  { ten: 'Cài đặt', ghiChu: 'Cài đặt chung, hoá đơn', loi: [{ to: '/settings', ten: 'Cài đặt', quyen: 'manage_users' }, { to: '/invoice-settings', ten: 'Cài đặt hoá đơn', quyen: 'manage_users' }] },
];

/** Lưới trang Quản lý: lối cần quyền mà người dùng không có bị ẩn; ô không còn lối nào thì ẩn cả ô. */
export function luoiQuanLy(coQuyen) {
  return O_QUAN_LY.map((o) => ({ ...o, loi: o.loi.filter((l) => hien(coQuyen, l.quyen)) })).filter((o) => o.loi.length > 0);
}
