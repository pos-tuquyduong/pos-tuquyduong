/**
 * Bước 003 (KH-API-3): cột xung_ho ở pos_customers — cách xưng hô khách chọn khi đăng ký App (anh · chi · co · chu · bac · em · ban,
 * kiểm ở utils/maKhach.js chuanXungHo). Khách cũ để NULL; không đổi dữ liệu cũ. themCot tự sao lưu bảng trước khi ALTER.
 * (Số 002 đã giữ cho KHO-2a.)
 * Chưa có bảng pos_customers → bỏ qua. Máy thật không gặp (database.js chạy createTables() trước chayNangCap); chỉ kho thử
 * toàn bảng kho (thu_KHO2a E6b chạy cả thư mục nang_cap) mới thiếu bảng khách.
 */
async function chay(tx, { themCot }) {
  if (!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = 'pos_customers'"))) return;
  await themCot('pos_customers', 'xung_ho TEXT');
}

module.exports = { chay };
