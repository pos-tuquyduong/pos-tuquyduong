/**
 * Bước 036 (TOPPING-1): topping + ghi chú nhanh CÀI THEO TỪNG MÓN. Chỉ THÊM cột (themCot tự chép bảng sao lưu trước khi ALTER); hai bảng đã có
 * trong danh sách sao lưu (routes/backup.js) nên cột mới đi theo.
 *   pos_products.la_topping       1 = sản phẩm là topping (bán kèm ly; luật ở utils/topping.js). Giá thêm vào ly = cột price sẵn có.
 *   pos_products.gia_ban_rieng    giá bán riêng một phần (số nguyên đồng > 0); NULL = không bán riêng.
 *   pos_products.ghi_chu_nhanh    mảng JSON chữ (theo thứ tự) — nút ghi chú nhanh của món.
 *   pos_products.topping_cho_mon  mảng JSON id topping được thêm vào món này.
 *   pos_order_items.dong_cha_id   dòng topping → id dòng món cha trong cùng đơn; NULL = dòng thường (mọi đơn cũ).
 * Chép ghi chú: bộ THEO_NHOM viết cứng trước đây (client/src/pages/BanHang/ghiChuMacDinh.js, bỏ ở TOPPING-1) vào món CHƯA có ghi chú, để quầy không
 * mất nút ngày đầu (K5): tea / juice theo nhóm, nhóm khác bộ dự phòng (chat bàn 41 · Q6). Không đụng topping; chạy lại không đè.
 */
const THEO_NHOM = {
  tea: ['Ít đá', 'Không đá', 'Ít ngọt', 'Nóng'],
  juice: ['Ít đá', 'Không đá', 'Không đường'],
};
const DU_PHONG = ['Ít đá', 'Không đá', 'Ít đường', 'Không đường'];

module.exports.chay = async (tx, { themCot }) => {
  const coBang = async (ten) => !!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = ?", [ten]));
  if (await coBang('pos_order_items')) await themCot('pos_order_items', 'dong_cha_id INTEGER');
  if (!(await coBang('pos_products'))) return;
  for (const cot of ['la_topping INTEGER NOT NULL DEFAULT 0', 'gia_ban_rieng INTEGER', 'ghi_chu_nhanh TEXT', 'topping_cho_mon TEXT']) await themCot('pos_products', cot);
  for (const p of await tx.query('SELECT id, category FROM pos_products WHERE ghi_chu_nhanh IS NULL AND COALESCE(la_topping, 0) = 0')) {
    await tx.run('UPDATE pos_products SET ghi_chu_nhanh = ? WHERE id = ? AND ghi_chu_nhanh IS NULL', [JSON.stringify(THEO_NHOM[p.category] || DU_PHONG), p.id]);
  }
};
