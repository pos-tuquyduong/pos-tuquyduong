/**
 * Bước 028 (QC-APP-1): bảng dòng quảng cáo trên App KH (Cài đặt → "Quảng cáo trên App"). CHỈ tạo bảng mới — không đụng bảng cũ, không dữ liệu.
 *   pos_quang_cao: một dòng = chữ dải + (tuỳ chọn) tiêu đề / dòng phụ / chữ nút banner Trang chủ, nơi mở khi bấm, khi nào hiện
 *   (kieu_ngay: hang_ngay | thu | khoang; cac_thu = '1,3,5' với 1 = thứ Hai … 7 = Chủ nhật; ngày YYYY-MM-DD; giờ HH:mm, rỗng = cả ngày),
 *   thứ tự uu_tien (nhỏ = trước), bat 1/0. Giờ ghi bằng getNow ở route (giờ Việt Nam) — không có DEFAULT giờ của SQLite.
 * Công tắc "Giờ vàng tự động" nằm ở pos_settings (khoá quang_cao_gio_vang), không cần bảng.
 */
module.exports.chay = async (tx) => {
  await tx.run(`CREATE TABLE IF NOT EXISTS pos_quang_cao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chu_dai TEXT NOT NULL,
    tieu_de TEXT NOT NULL DEFAULT '',
    phu TEXT NOT NULL DEFAULT '',
    chu_nut TEXT NOT NULL DEFAULT '',
    dich TEXT NOT NULL DEFAULT '',
    ma_mon TEXT,
    kieu_ngay TEXT NOT NULL DEFAULT 'hang_ngay',
    cac_thu TEXT NOT NULL DEFAULT '',
    tu_ngay TEXT,
    den_ngay TEXT,
    tu_gio TEXT,
    den_gio TEXT,
    uu_tien INTEGER NOT NULL DEFAULT 0,
    bat INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
};
