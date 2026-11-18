/**
 * Bước 032 (KHO-3a A3b, chủ quán 18.11): menu chuyển từ SX sang pos_products — 4 món nước ép trong POS còn tên tạm, quầy đang hiện tên SX.
 * Đổi ĐÚNG 4 dòng theo khoá SX, CHỈ khi tên hiện tại đúng bằng tên tạm (tên đã sửa tay giữ nguyên); chạy lại không đổi gì thêm.
 * Nguồn: tệp sao lưu SX 18.11 11:06, bảng recipes. Chưa có bảng pos_products → bỏ qua (kho thử toàn bảng kho).
 */
const { getNow } = require('../utils/helpers');

const TEN_MON_SX = [   // [loại, mã SX, tên tạm trong POS, tên đúng]
  ['juice', 5, 'Công thức 5', 'Thanh Tân Dưỡng'],
  ['juice', 6, 'Công thức 6', 'Tĩnh Nguyên Thủy'],
  ['juice', 7, 'Công thức 7', 'Ôn Dương Lộ'],
  ['juice', 8, 'Công thức 8', 'Tâm Vệ Lộ'],
];

module.exports.chay = async (tx) => {
  if (!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = 'pos_products'"))) return;
  for (const [loai, ma, tenTam, tenDung] of TEN_MON_SX) {
    await tx.run('UPDATE pos_products SET name = ?, updated_at = ? WHERE sx_product_type = ? AND sx_product_id = ? AND name = ?', [tenDung, getNow(), loai, ma, tenTam]);
  }
};
