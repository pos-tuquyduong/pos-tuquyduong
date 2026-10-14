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

// ── GOI-2 (chủ quán chốt Q1, Q2, Q-D, Q-E 13–14.10.2026) — báo cáo gói MỖI KHÁCH MỘT DÒNG ──
const NGAY_LAU_CHUA_LAY = 30;   // "lâu chưa lấy" khi quá số ngày này kể từ lần lấy gần nhất (chưa lấy: từ ngày mua) — hằng một chỗ (Q-E)

/** Danh sách gói (một dòng một gói, có `last_delivery_at`) → mỗi khách một dòng. "Còn lại" và mốc lấy chỉ tính gói đang dùng. */
function gomTheoKhach(dsGoi, bayGio = Date.now()) {
  const theo = new Map();
  for (const g of dsGoi) {
    if (!theo.has(g.customer_phone)) {
      theo.set(g.customer_phone, { customer_phone: g.customer_phone, customer_name: g.customer_name, so_goi: 0, so_dang_dung: 0, con_lai: 0, moc_lay: null, goi: [] });
    }
    const kh = theo.get(g.customer_phone);
    kh.so_goi++;
    kh.goi.push(g);
    if (g.status !== 'active') continue;
    kh.so_dang_dung++;
    kh.con_lai += Math.max(0, Number(g.total_qty) - Number(g.delivered_qty));
    const moc = g.last_delivery_at || g.created_at;
    if (!kh.moc_lay || new Date(moc) > new Date(kh.moc_lay)) kh.moc_lay = moc;
  }
  for (const kh of theo.values()) {
    kh.ngay_chua_lay = kh.moc_lay ? Math.floor((bayGio - new Date(kh.moc_lay).getTime()) / 86400000) : null;
    kh.lau = kh.ngay_chua_lay !== null && kh.ngay_chua_lay > NGAY_LAU_CHUA_LAY;
  }
  return [...theo.values()];
}

/** Ba lọc của màn (Q2): `dang_dung` (mặc định) · `lau` · `xong` = có gói đã xong / đã kết thúc (Q-D). */
const LOC_KHACH = {
  dang_dung: (kh) => kh.so_dang_dung > 0,
  lau: (kh) => kh.lau,
  xong: (kh) => kh.so_dang_dung < kh.so_goi,
};

/** GOI-2 (A4): đơn mua có gói đã kết thúc ở Báo cáo → Gói SP — tiền đã chốt theo gói, huỷ / xoá đơn không được hoàn lần hai. */
const goiDaKetThuc = (db, orderId) => db.queryOne("SELECT 1 FROM pos_customer_packages WHERE order_id = ? AND status = 'cancelled' LIMIT 1", [orderId]);
const LOI_GOI_DA_KET_THUC = { error: 'Gói đã kết thúc — xử lý ở Báo cáo → Gói SP', code: 'GOI_DA_KET_THUC' };

module.exports = { dieuKienLayTuGoi, daLayTheoLoai, vuotTheoLoai, gomTheoKhach, LOC_KHACH, goiDaKetThuc, LOI_GOI_DA_KET_THUC };
