/**
 * Bước 005 (KH-SP-1): thông tin ngắn của món ở pos_products — nhu_cau, the_chat (chuỗi JSON mảng mã), mo_ta, cong_dung, thanh_phan (chữ).
 * Món cũ để NULL; không đổi dữ liệu cũ. themCot tự sao lưu bảng trước khi ALTER. Mã hợp lệ: server/utils/thongTinMon.js.
 * Chưa có bảng pos_products → bỏ qua (chỉ kho thử toàn bảng kho — thu_KHO2a E6b chạy cả thư mục nang_cap).
 */
async function chay(tx, { themCot }) {
  if (!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = 'pos_products'"))) return;
  for (const cot of ['nhu_cau', 'the_chat', 'mo_ta', 'cong_dung', 'thanh_phan']) await themCot('pos_products', `${cot} TEXT`);
}

module.exports = { chay };
