/**
 * Bước 004 (KHACH-CK-1): bỏ chiết khấu riêng từng khách (chủ quán 29.10) — đổi DỮ LIỆU, không đổi cột.
 * Có khách mức ≠ 0 → chép cả bảng sang _sao_luu_004_pos_customers (cùng khuôn themCot) rồi đặt discount_value = 0, discount_type về mặc
 * định cột 'percent'. discount_note ("Ghi chú khách", in trên hoá đơn) giữ nguyên. Không có ai ≠ 0 (hoặc chưa có cột) → không tạo bảng,
 * không ghi gì.
 */
const CO_MUC = 'COALESCE(discount_value, 0) <> 0';

module.exports.chay = async (tx) => {
  // Kho chưa có bảng / cột (kho trống dựng riêng cho bộ chạy) → không có gì để đặt lại.
  if (!(await tx.query('PRAGMA table_info(pos_customers)')).some((c) => c.name === 'discount_value')) return;
  if (!(await tx.queryOne(`SELECT 1 AS co FROM pos_customers WHERE ${CO_MUC} LIMIT 1`))) return;
  await tx.run('CREATE TABLE IF NOT EXISTS _sao_luu_004_pos_customers AS SELECT * FROM pos_customers');
  const kq = await tx.run(`UPDATE pos_customers SET discount_value = 0, discount_type = 'percent' WHERE ${CO_MUC}`);
  console.log(`🔧 Nâng cấp 004: đặt lại chiết khấu riêng của ${kq.changes} khách về 0 (sao lưu _sao_luu_004_pos_customers)`);
};
