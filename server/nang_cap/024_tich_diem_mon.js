/**
 * Bước 024 (DIEM-MON-1): công tắc "Tích điểm" theo món / gói trả trước / hạng thẻ. Chỉ THÊM cột (themCot tự chép bảng sao lưu trước khi ALTER).
 *   pos_products.tich_diem, pos_packages.tich_diem, pos_membership_tiers.tich_diem   1 = bật (mặc định — dòng cũ tính điểm như trước), 0 = tắt.
 *   pos_orders.tien_hang_diem      phần tiền hàng (total − phí giao) thuộc dòng bật, tính lúc bán (utils/diemThat.js tienHangDiem). NULL = đơn cũ.
 *   pos_order_items.tich_diem      cờ của dòng LÚC BÁN (đổi công tắc sau không đổi đơn cũ). NULL = dòng cũ = bật.
 * Bảng chưa có → bỏ qua (kho thử chỉ có bảng kho — thu_KHO2a chạy cả thư mục nang_cap).
 */
module.exports.chay = async (tx, { themCot }) => {
  const coBang = async (ten) => !!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = ?", [ten]));
  for (const bang of ['pos_products', 'pos_packages', 'pos_membership_tiers']) {
    if (await coBang(bang)) await themCot(bang, 'tich_diem INTEGER NOT NULL DEFAULT 1');
  }
  if (await coBang('pos_orders')) await themCot('pos_orders', 'tien_hang_diem INTEGER');
  if (await coBang('pos_order_items')) await themCot('pos_order_items', 'tich_diem INTEGER');
};
