/**
 * Bước 037 (ANH-MON-1): bảng ảnh món — MỘT ảnh / món (product_id duy nhất), lưu trong CSDL (không đĩa Render).
 * du_lieu = base64 của byte ảnh (chạy chắc trên file SQLite thử lẫn Turso); phien_ban = 12 ký tự đầu băm SHA-256 nội dung (vào đường dẫn ảnh).
 * Chỉ THÊM bảng; chạy lại không đổi gì. Bảng này KHÔNG nằm trong danh sách xuất Excel hằng ngày (server/routes/backup.js).
 */
module.exports.chay = async (tx) => {
  await tx.run(`CREATE TABLE IF NOT EXISTS pos_anh_mon (
    product_id INTEGER PRIMARY KEY,
    kieu TEXT NOT NULL,
    du_lieu TEXT NOT NULL,
    co INTEGER NOT NULL,
    phien_ban TEXT NOT NULL,
    sua_luc TEXT NOT NULL
  )`);
};
