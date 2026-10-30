/**
 * Bước 003 (KH-API-3): cột xung_ho ở pos_customers — cách xưng hô khách chọn khi đăng ký App (anh · chi · co · chu · bac · em · ban,
 * kiểm ở utils/maKhach.js chuanXungHo). Khách cũ để NULL; không đổi dữ liệu cũ. themCot tự sao lưu bảng trước khi ALTER.
 * (Số 002 đã giữ cho KHO-2a.)
 */
async function chay(tx, { themCot }) {
  await themCot('pos_customers', 'xung_ho TEXT');
}

module.exports = { chay };
