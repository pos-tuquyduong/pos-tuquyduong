/**
 * QuanLy/menu.js — menu POS (BH-2, chủ quán duyệt 27.10) và 6 nhóm trang Quản lý (GIAO-DIEN-2). HÀM THUẦN: không React, không mạng.
 * Chỉ dời đường dẫn: mọi đường cũ vẫn mở được (App.jsx), quyền giữ đúng như từng mục cũ. Bài thử: cong_cu/thu_BH2.js.
 * `coQuyen(tên)` = hasPermission của AuthContext. Icon do Layout.jsx gắn theo đường dẫn.
 */

const hien = (coQuyen, quyen) => !quyen || coQuyen(quyen);

const MAY_TINH = [
  { to: '/', ten: 'Bán hàng' },
  { to: '/hom-nay', ten: 'Hôm nay', quyen: 'view_reports' },
  { to: '/orders', ten: 'Đơn hàng' },
  { to: '/don-app', ten: 'Đơn App' },   // GIAO-DIEN-1 B: máy chủ chỉ đòi đăng nhập → không đặt quyền; điện thoại thấy ở bảng "Thêm"
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

/** Số đỏ cạnh mục menu: chỉ "Đơn App" có, bằng số đơn mới; 0 / thiếu → 0 (không hiện). */
export const soDo = (to, so) => (to === '/don-app' && Number(so?.donApp) > 0 ? Number(so.donApp) : 0);

// Lối thêm trên màn đã có (App.jsx bọc ThanhLoi quanh màn, không sửa màn): Đơn hàng → Hoàn tiền. (Số dư đã gộp vào trang Khách hàng — GIAO-DIEN-1 C.)
const LOI_THEM = {
  orders: [{ to: '/refunds', ten: 'Hoàn tiền', quyen: 'approve_refund' }],
};
export const loiThem = (man, coQuyen) => (LOI_THEM[man] || []).filter((l) => hien(coQuyen, l.quyen));

// GIAO-DIEN-2: 6 nhóm của trang Quản lý (M1), mỗi nút mở THẲNG đúng màn. `quyen` = ĐÚNG quyền thẻ / màn trước đây; `tuKhoa` cho ô tìm nhanh.
// GIAO-DIEN-4 E1: mỗi nhóm có `icon` (TÊN icon lucide — QuanLy.jsx ánh xạ, menu.js vẫn thuần) và `mau` (vang · lam · do · luc = lớp .ql-mau-* ở index.css).
// `?the=` = mã thẻ trong Settings.jsx (NHOM_THE). Thẻ `packages` (gói tạm ngưng) cố ý không có nút; `signup`, `rewards` mở từ màn Điểm & quà.
const NHOM_QUAN_LY = [
  { ten: 'Món & giá', icon: 'Coffee', mau: 'vang', nut: [
    { ten: 'Món, giá & công thức', to: '/kho', tuKhoa: ['san pham', 'cong thuc', 'mon', 'gia', 'nguyen lieu', 'ton kho'] },
    { ten: 'Giá bán & nhóm món', to: '/settings?the=products', quyen: 'manage_settings', tuKhoa: ['nhom dac biet', 'mon tang khach moi', 'gia ban'] },
    { ten: 'Gói nạp tiền', to: '/settings?the=goiNap', quyen: 'manage_products', tuKhoa: ['nap tien', 'goi nap'] },
  ] },
  { ten: 'Khách & thẻ', icon: 'Users', mau: 'lam', nut: [
    { ten: 'Danh sách khách', to: '/customers', tuKhoa: ['khach hang', 'vi', 'so du', 'diem', 'sinh nhat', 'nap tien'] },
    { ten: 'Hạng thành viên', to: '/settings?the=tiers', quyen: 'manage_promotions', tuKhoa: ['hang vang', 'kim cuong', 'the thanh vien', 'goi hang'] },
    { ten: 'Điểm & quà', to: '/settings?the=loyalty', quyen: 'manage_settings', tuKhoa: ['tich diem', 'doi qua', 'kho qua', 'khach moi'] },
  ] },
  { ten: 'Khuyến mãi', icon: 'Megaphone', mau: 'do', nut: [
    { ten: 'Mã giảm giá', to: '/discount-codes', quyen: 'manage_users', tuKhoa: ['ma chiet khau', 'voucher', 'khuyen mai'] },
    { ten: 'Giờ vàng', to: '/settings?the=flash', quyen: 'manage_settings', tuKhoa: ['flash sale', 'giam gia gio'] },
    { ten: 'Chương trình', to: '/settings?the=chuongTrinh', quyen: 'manage_promotions', tuKhoa: ['khuyen mai', 'combo'] },
    { ten: 'Quảng cáo trên App', to: '/settings?the=quangCao', quyen: 'manage_settings', tuKhoa: ['banner', 'app khach'] },
  ] },
  { ten: 'Tiền & báo cáo', icon: 'Wallet', mau: 'luc', nut: [
    { ten: 'Đối soát tiền', to: '/reports?tab=doisoat', quyen: 'view_reports', tuKhoa: ['doi soat', 'chot ca', 'tien mat', 'chuyen khoan'] },
    { ten: 'Hoàn tiền', to: '/refunds', quyen: 'approve_refund', tuKhoa: ['tra tien', 'huy don'] },
    { ten: 'Báo cáo doanh thu', to: '/reports', quyen: 'view_reports', tuKhoa: ['doanh thu', 'thuc thu', 'bao cao'] },
  ] },
  { ten: 'Nhân viên', icon: 'UserCog', mau: 'lam', nut: [
    { ten: 'Tài khoản nhân viên', to: '/settings?the=users', quyen: 'manage_users', tuKhoa: ['nguoi dung', 'mat khau', 'tai khoan'] },
    { ten: 'Ai được làm gì', to: '/settings?the=permissions', quyen: 'manage_permissions', tuKhoa: ['phan quyen', 'quyen han'] },
  ] },
  { ten: 'Cài đặt quán', icon: 'Store', mau: 'vang', nut: [
    { ten: 'Giờ mở cửa', to: '/settings?the=gioHoatDong', quyen: 'manage_settings', tuKhoa: ['gio hoat dong', 'dong cua', 'chuong don app'] },
    { ten: 'Giao hàng', to: '/settings?the=giaoHang', quyen: 'manage_settings', tuKhoa: ['ship', 'ahamove', 'phi giao'] },
    { ten: 'In bill & tem', to: '/invoice-settings', quyen: 'manage_users', tuKhoa: ['may in', 'hoa don', 'tem', 'bill'] },
    { ten: 'In phiếu kho', to: '/settings?the=inPhieu', quyen: 'manage_settings', tuKhoa: ['may in', 'kho giay', 'phieu kho'] },
    { ten: 'Màn khách', to: '/settings?the=manKhach', quyen: 'manage_settings', tuKhoa: ['man hinh khach', 'may tinh bang'] },
    { ten: 'PIN chủ quán', to: '/settings?the=pin', quyen: 'chi_chu_quan', tuKhoa: ['ma pin', 'doi pin', 'mat khau'] },   // chỉ chủ quán: không vai trò nào có quyền này
    { ten: 'Sao lưu', to: '/settings?the=backup', quyen: 'export_data', tuKhoa: ['backup', 'khoi phuc', 'google drive'] },
    { ten: 'App khách hàng', to: '/settings?the=appKh', quyen: 'chi_chu_quan', tuKhoa: ['app', 'noi dung app'] },
  ] },
];

/** Lưới trang Quản lý: nút cần quyền mà người dùng không có bị ẩn; nhóm hết nút thì ẩn cả nhóm. */
export function luoiQuanLy(coQuyen) {
  return NHOM_QUAN_LY.map((g) => ({ ...g, nut: g.nut.filter((n) => hien(coQuyen, n.quyen)) })).filter((g) => g.nut.length > 0);
}

/** Bỏ dấu + chữ thường: "Giờ Mở Cửa" → "gio mo cua". */
export const boDau = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

/** Ô tìm nhanh: chuỗi rỗng → đủ nhóm; ngược lại chỉ còn nút có tên / từ khoá chứa chuỗi (không dấu). Quyền áp như luoiQuanLy. */
export function timMuc(chuoi, coQuyen) {
  const q = boDau(chuoi);
  const luoi = luoiQuanLy(coQuyen);
  if (!q) return luoi;
  return luoi.map((g) => ({ ...g, nut: g.nut.filter((n) => boDau([n.ten, ...n.tuKhoa].join(' ')).includes(q)) })).filter((g) => g.nut.length > 0);
}

/** Enter trong ô tìm: còn ĐÚNG một nút thì trả nút đó, ngược lại null. */
export function nutDuyNhat(nhom) {
  const nut = nhom.flatMap((g) => g.nut);
  return nut.length === 1 ? nut[0] : null;
}
