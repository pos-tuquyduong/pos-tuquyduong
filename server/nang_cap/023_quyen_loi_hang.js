/**
 * Bước 023 (KH-THE-1 F): quyền lợi của hạng — chữ chủ quán nhập ở Cài đặt → Hạng thành viên (mỗi dòng một ý), App KH đọc qua GET /hang
 * `quyen_loi[]`. Chỉ THÊM cột qua themCot (bảng có dòng → tự chép _sao_luu_023_pos_membership_tiers trước). Bảng chưa có → bỏ qua (khuôn 013).
 */
module.exports.chay = async (tx, { themCot }) => {
  if (!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = 'pos_membership_tiers'"))) return;
  await themCot('pos_membership_tiers', "quyen_loi TEXT NOT NULL DEFAULT ''");
};
