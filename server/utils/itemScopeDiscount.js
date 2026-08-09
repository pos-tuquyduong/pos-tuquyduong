/**
 * Bước 5 — Logic dùng chung cho voucher "giảm 1 món" (discount_scope='item').
 * DÙNG CHUNG giữa discount-codes.js (/validate — chỉ xem trước) và orders.js
 * (tính tiền thật lúc thanh toán) — đúng nguyên tắc "client chỉ preview, server
 * luôn tính lại", nhưng ở đây còn chặt hơn: CẢ HAI ĐẦU SERVER cũng phải cùng
 * gọi đúng 1 hàm này, không viết 2 bản logic dễ lệch nhau.
 */

/**
 * Tìm món "đắt nhất" trong giỏ hàng thuộc nhóm sản phẩm được áp voucher.
 * @param {Function} query - hàm query() từ database.js
 * @param {number} groupId - id nhóm sản phẩm (pos_product_groups.id)
 * @param {Array} items - giỏ hàng, mỗi item cần có sx_product_type, sx_product_id, unit_price
 * @returns {object|null} - item được chọn (đối tượng gốc trong mảng items), hoặc null nếu
 *   giỏ không có món nào thuộc nhóm.
 */
async function findEligibleItemForGroup(query, groupId, items) {
  if (!groupId || !Array.isArray(items) || items.length === 0) return null;

  const members = await query(
    'SELECT sx_product_type, sx_product_id FROM pos_product_group_members WHERE group_id = ?',
    [groupId]
  );
  const memberKeys = new Set(members.map(m => `${m.sx_product_type}_${m.sx_product_id}`));

  let best = null;
  for (const it of items) {
    if (it.sx_product_type == null || it.sx_product_id == null) continue;
    const key = `${it.sx_product_type}_${it.sx_product_id}`;
    if (!memberKeys.has(key)) continue;
    const price = Number(it.unit_price) || 0;
    if (!best || price > (Number(best.unit_price) || 0)) best = it;
  }
  return best;
}

/**
 * Tính số tiền giảm cho ĐÚNG 1 đơn vị của món được chọn (không nhân số lượng).
 * fixed: không vượt quá giá của chính món đó (tránh giảm ra số âm nếu owner lỡ cấu hình
 * giá trị giảm lớn hơn giá món).
 */
function computeItemDiscountAmount(discountType, discountValue, unitPrice) {
  const price = Number(unitPrice) || 0;
  const value = Number(discountValue) || 0;
  if (discountType === 'percent') {
    return Math.round((price * Math.min(100, Math.max(0, value))) / 100);
  }
  // fixed
  return Math.min(Math.max(0, value), price);
}

module.exports = { findEligibleItemForGroup, computeItemDiscountAmount };
