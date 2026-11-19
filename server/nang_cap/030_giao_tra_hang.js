/**
 * Bước 030 (GIAO-3 B): hàng của chuyến giao lỗi trả về quán — Ahamove báo `sub_status` IN_RETURN (đang trả) / RETURNED (đã về quán).
 * Chỉ THÊM 2 cột vào pos_giao_chuyen (qua themCot — tự sao lưu bảng có dòng); KHÔNG thêm trạng thái thẻ (thẻ vẫn giao_loi, Đóng thẻ như cũ).
 *   tra_hang:     NULL | 'dang_tra' | 'da_ve' (một chiều — utils/giaoHang.js capNhatTraHang)
 *   tra_hang_luc: giờ VN hàng về quán (return_time của Ahamove; không có thì giờ POS biết)
 * Kho thử chỉ có bảng kho (thu_KHO2a chạy cả thư mục nang_cap) → bỏ qua (khuôn 025).
 */
module.exports.chay = async (tx, { themCot }) => {
  if (!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = 'pos_giao_chuyen'"))) return;
  await themCot('pos_giao_chuyen', 'tra_hang TEXT');
  await themCot('pos_giao_chuyen', 'tra_hang_luc TEXT');
};
