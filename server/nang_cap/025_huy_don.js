/**
 * Bước 025 (HUY-1): huỷ đơn hoàn toàn bộ tiền đã trả — chủ quán chốt 05.11. Chỉ THÊM + đổi dữ liệu quyền (khuôn 018):
 *   pos_hoan_tien_mat:   khoản trả TIỀN MẶT từ két cho khách lẻ (không SĐT) khi huỷ đơn — lối DUY NHẤT lấy tiền mặt ra khỏi két
 *                        (orders.js, route huỷ). UNIQUE order_id: một đơn một khoản.
 *   pos_orders.huy_ly_do_ma: mã lý do huỷ (LY_DO_HUY ở orders.js); NULL = đơn huỷ trước HUY-1 → Đối soát giữ công thức két cũ.
 *   Quyền cancel_order của staff → 0 (huỷ chỉ quản lý / chủ quán). Chạy MỘT lần: chủ quán bật lại ở màn Phân quyền thì không đè.
 * Kho thử chỉ có bảng kho (thu_KHO2a E6b chạy cả thư mục nang_cap) → bỏ qua (khuôn 018).
 */
const CO_MUC = "permission = 'cancel_order' AND role = 'staff' AND allowed <> 0";

module.exports.chay = async (tx, { themCot }) => {
  if (!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = 'pos_orders'"))) return;
  await tx.run(`CREATE TABLE IF NOT EXISTS pos_hoan_tien_mat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER UNIQUE NOT NULL,
    so_tien INTEGER NOT NULL,
    ly_do_ma TEXT,
    ly_do TEXT,
    nguoi TEXT,
    luc TEXT NOT NULL
  )`);
  await themCot('pos_orders', 'huy_ly_do_ma TEXT');
  if (!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = 'pos_permissions'"))) return;
  if (!(await tx.queryOne(`SELECT 1 AS co FROM pos_permissions WHERE ${CO_MUC} LIMIT 1`))) return;
  await tx.run('CREATE TABLE IF NOT EXISTS _sao_luu_025_pos_permissions AS SELECT * FROM pos_permissions');
  const kq = await tx.run(`UPDATE pos_permissions SET allowed = 0 WHERE ${CO_MUC}`);
  console.log(`🔧 Nâng cấp 025: tắt quyền huỷ đơn của staff (${kq.changes} dòng, sao lưu _sao_luu_025_pos_permissions)`);
};
