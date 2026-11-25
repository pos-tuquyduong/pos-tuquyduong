/**
 * Bước 031 (KHO-3a; số 030 đã thuộc GIAO-3): bán trừ kho POS. Chỉ THÊM cột (qua themCot — tự sao lưu bảng có dòng) và chỉ mục.
 * kho_san_pham.cho_ban_thieu: món pha tại chỗ được bán khi thiếu nguyên liệu (ghi âm, báo đỏ). Mặc định 0 = TẮT, chỉ chủ quán bật (B8).
 * kho_phieu.don_hang_id: phiếu bán (loai PS, su_co 'ban_hang') nối đơn pos_orders.id — khoá duy nhất: một đơn đúng MỘT phiếu bán.
 */
module.exports.chay = async (tx, { themCot }) => {
  if (!(await tx.query('PRAGMA table_info(kho_phieu)')).length) return;   // kho thử thiếu bảng kho — không có gì để thêm
  await themCot('kho_san_pham', 'cho_ban_thieu INTEGER NOT NULL DEFAULT 0');
  await themCot('kho_phieu', 'don_hang_id INTEGER');
  await tx.run('CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_phieu_don_hang ON kho_phieu(don_hang_id) WHERE don_hang_id IS NOT NULL');
};
