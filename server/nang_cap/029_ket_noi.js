/**
 * Bước 029 (KET-NOI-1): mã lượt bấm của phiên thu tiền ở quầy. Quầy gửi lại CÙNG mã sau khi rớt mạng → máy chủ trả đúng phiên đã tạo, không
 * giữ ví / voucher / số hoá đơn lần nữa (khuôn 002: kho_phieu.ma_gui). Chỉ THÊM cột (qua themCot — tự sao lưu bảng có dòng) và chỉ mục.
 * Đơn App và lời gọi cũ không gửi mã → NULL, chỉ mục không xét. Kho thử chỉ có bảng kho (thu_KHO2a E6b chạy cả thư mục nang_cap) → bỏ qua (khuôn 025).
 */
module.exports.chay = async (tx, { themCot }) => {
  if (!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = 'pos_phien_thanh_toan'"))) return;
  await themCot('pos_phien_thanh_toan', 'ma_gui TEXT');
  await tx.run('CREATE UNIQUE INDEX IF NOT EXISTS ux_phien_ma_gui ON pos_phien_thanh_toan(ma_gui) WHERE ma_gui IS NOT NULL');
};
