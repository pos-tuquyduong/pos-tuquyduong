/**
 * GOI-1 — "đã lấy" của gói khách (chủ quán chốt Q1, 13.10.2026).
 * MỘT cách đếm cho chặn theo loại (orders.js), màn Bán hàng (`delivered_items`), lần lấy gần nhất và lịch sử giao (packages.js).
 */

// Món lấy từ gói = món thật (product_id > 0) giá 0 của đơn còn hiệu lực gắn gói — đúng điều kiện huỷ / xoá đơn trả lượt
// (orders.js, nhánh "giao từ gói"). Cần bí danh `o` = pos_orders, `oi` = pos_order_items; `goi` = id gói khách ('?' hoặc cột).
const dieuKienLayTuGoi = (goi = '?') => `o.customer_package_id = ${goi} AND o.status != 'cancelled' AND oi.product_id > 0
  AND (oi.unit_price = 0 OR oi.unit_price IS NULL)`;

const khoaLoai = (i) => `${i.sx_product_type}_${i.sx_product_id}`;

/** Đã lấy theo loại → [{ sx_product_type, sx_product_id, product_code, delivered_qty }]. `db` = { query } thường hoặc `tx`. */
const daLayTheoLoai = (db, cpId) => db.query(
  `SELECT p.sx_product_type, p.sx_product_id, MAX(p.code) AS product_code, SUM(oi.quantity) AS delivered_qty
     FROM pos_order_items oi JOIN pos_orders o ON o.id = oi.order_id JOIN pos_products p ON p.id = oi.product_id
    WHERE ${dieuKienLayTuGoi()}
    GROUP BY p.sx_product_type, p.sx_product_id`, [cpId]);

/** Loại đầu tiên vượt số đã cài → thân lỗi 400 (kèm `loai`, `con` = số còn được lấy), không vượt → null.
 *  Chỉ xét loại cài SL > 0 (như Sales.jsx). */
function vuotTheoLoai(dsGoi, daLay, monLay) {
  const xin = {};
  for (const m of monLay) xin[khoaLoai(m)] = (xin[khoaLoai(m)] || 0) + Number(m.quantity);
  for (const g of dsGoi) {
    if (!(Number(g.qty) > 0) || !xin[khoaLoai(g)]) continue;
    const da = daLay.find((d) => khoaLoai(d) === khoaLoai(g));
    const con = Number(g.qty) - Number(da?.delivered_qty || 0);
    if (xin[khoaLoai(g)] > con) {
      const loai = g.code || khoaLoai(g);
      return { error: `${loai} chỉ còn ${Math.max(0, con)} trong gói`, code: 'GOI_HET_LUOT_LOAI', loai, con: Math.max(0, con) };
    }
  }
  return null;
}

module.exports = { dieuKienLayTuGoi, daLayTheoLoai, vuotTheoLoai };
