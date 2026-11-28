/** KHO-2a — hàm hiển thị dùng chung của màn Kho (không có quy tắc nghiệp vụ: máy chủ tính hết). */
export const boDau = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
export const so = (x) => (x == null ? '—' : Number(Number(x).toFixed(3)).toLocaleString('vi-VN'));
/** KHO-GON-2 D5: số gọn cho Ô NHẬP (không dấu nghìn — ô number đọc được): bỏ đuôi lỗi số thực (4.199999999999999 → '4.2') theo 12 CHỮ SỐ CÓ NGHĨA,
 *  KHÔNG cắt số chữ số thập phân — 1/30 giữ 0.0333333333333, 0.0004 giữ 0.0004 (soát vòng 1: cắt 3 chữ số làm đổi lượng công thức khi bấm Sửa → Lưu). */
export const soGon = (x) => (x == null || x === '' ? '' : String(Number(Number(x).toPrecision(12))));
export const tien = (x) => (x == null ? '—' : Number(x).toLocaleString('vi-VN') + 'đ');
/** '2026-11-07T06:00:00' → '06:00 07/11' (chuỗi giờ VN của máy chủ, không đổi múi giờ). */
export const gio = (luc) => (luc ? `${luc.slice(11, 16)} ${luc.slice(8, 10)}/${luc.slice(5, 7)}` : '—');
/** Mã mỗi lần mở màn xác nhận — bấm "Xuất kho nguyên liệu" hai lần máy chủ trả cùng một phiếu. */
export const maGuiMoi = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
export const TRANG_THAI = { nhap: 'Nháp', cho_duyet: 'Chờ duyệt', da_duyet: 'Đã duyệt', huy: 'Đã huỷ' };
export const THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
/** KHO-2b: lượng gõ theo đơn vị HIỆN → đơn vị LƯU gửi máy chủ (1 đơn vị hiện = he_so_doi đơn vị lưu) và ngược lại. */
export const veLuu = (x, heSo) => Number(x) * (heSo || 1);
export const raHien = (x, heSo) => Number(x) / (heSo || 1);
export const SU_CO = { hong: 'Hỏng', do_vo: 'Đổ vỡ', het_han: 'Hết hạn', noi_bo: 'Dùng nội bộ', khac: 'Khác' };
// KHO-3a: nhãn để ĐỌC — thêm phiếu bán (máy ghi khi bán; không có trong danh sách chọn của màn Phát sinh)
export const TEN_SU_CO = { ...SU_CO, ban_hang: 'Bán hàng' };
