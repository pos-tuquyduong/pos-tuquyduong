/**
 * Bước 007 (KHO-2b): đặt hàng · nhận hàng · phát sinh. Chỉ THÊM cột (qua themCot — tự sao lưu bảng có dòng) và chỉ mục; không bảng mới
 * (sao lưu Excel lấy bảng theo danh sách cứng trong backup.js).
 * kho_phieu.don_id: phiếu nhận PN trỏ đơn DH (mua lẻ = NULL) — phần còn lại của đơn TÍNH từ đây, không lưu trạng thái "đã đóng".
 * kho_phieu.su_co: loại chuyện của PS (hong · do_vo · het_han · noi_bo · khac) — không dùng ly_do vì huỷ / từ chối ghi đè ly_do.
 * kho_phieu_dong.han_dung: hạn lô ghi lúc TẠO phiếu nhận; lô chỉ sinh lúc duyệt.
 */
module.exports.chay = async (tx, { themCot }) => {
  if (!(await tx.query('PRAGMA table_info(kho_phieu)')).length) return;   // kho thử thiếu bảng kho (bước 001 chưa có) — không có gì để thêm
  await themCot('kho_phieu', 'don_id INTEGER');
  await themCot('kho_phieu', 'su_co TEXT');
  await themCot('kho_phieu_dong', 'han_dung TEXT');
  await tx.run('CREATE INDEX IF NOT EXISTS idx_kho_phieu_don ON kho_phieu(don_id)');
};
