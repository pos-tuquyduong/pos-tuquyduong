/** KHO-2a — hàm hiển thị dùng chung của màn Kho (không có quy tắc nghiệp vụ: máy chủ tính hết). */
export const boDau = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
export const so = (x) => (x == null ? '—' : Number(Number(x).toFixed(3)).toLocaleString('vi-VN'));
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
