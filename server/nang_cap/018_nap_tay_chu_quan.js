/**
 * Bước 018 (GIAO-DIEN-1 E): nạp tay (quyền topup_balance) CHỈ chủ quán — chủ quán chốt 05.11. Đổi DỮ LIỆU quyền, không đổi cột.
 * manager / staff đang được nạp (allowed <> 0) → chép bảng quyền sang _sao_luu_018_pos_permissions (cùng khuôn bước 004) rồi đặt 0.
 * Chạy MỘT lần (bộ chạy ghi pos_nang_cap): chủ quán bật lại ở màn Phân quyền thì lần khởi động sau KHÔNG đè lại. owner không đụng.
 */
const CO_MUC = "permission = 'topup_balance' AND role IN ('manager', 'staff') AND allowed <> 0";

module.exports.chay = async (tx) => {
  // Kho thử chỉ có bảng kho (thu_KHO2a E6b chạy cả thư mục nang_cap) thì không có pos_permissions — cùng khuôn bước 013 / 019.
  if (!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = 'pos_permissions'"))) return;
  if (!(await tx.queryOne(`SELECT 1 AS co FROM pos_permissions WHERE ${CO_MUC} LIMIT 1`))) return;
  await tx.run('CREATE TABLE IF NOT EXISTS _sao_luu_018_pos_permissions AS SELECT * FROM pos_permissions');
  const kq = await tx.run(`UPDATE pos_permissions SET allowed = 0 WHERE ${CO_MUC}`);
  console.log(`🔧 Nâng cấp 018: tắt quyền nạp tay của manager / staff (${kq.changes} dòng, sao lưu _sao_luu_018_pos_permissions)`);
};
