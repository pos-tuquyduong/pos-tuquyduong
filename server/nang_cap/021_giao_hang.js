/**
 * Bước 021 (GIAO-1): giao hàng Ahamove ở quầy. Chỉ THÊM bảng — không đụng bảng / dữ liệu có sẵn. Không cột nào chứa khoá Ahamove.
 *   pos_giao_bao_phi: mỗi lần "Tính phí" (máy chủ hỏi Ahamove) — đơn giao lấy phí ship TỪ ĐÂY (màn hình không gửi được số phí). order_id NULL
 *                     tới khi một đơn dùng nó (UNIQUE: một báo phí — một đơn).
 *   pos_giao_chuyen:  một đơn giao một dòng — người nhận, trạng thái + giờ từng bước, chuyến Ahamove, tài xế, phí khách trả / phí thật / chênh,
 *                     phí huỷ chuyến, đồ đã pha khi huỷ (dung_lai | bo_di). Trạng thái chỉ đổi qua utils/giaoHang.js.
 *   pos_giao_tin:     nhật ký tin Ahamove báo về — khoá (mã chuyến, trạng thái ĐỌC LẠI, trạng thái điểm giao) chống xử lý lặp. Không lưu header.
 */
const CAU = [
  `CREATE TABLE IF NOT EXISTS pos_giao_bao_phi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ma TEXT UNIQUE NOT NULL,
    dia_chi TEXT NOT NULL,
    lat REAL,
    lng REAL,
    km REAL NOT NULL,
    loai_xe TEXT NOT NULL,
    phi INTEGER NOT NULL,
    het_han TEXT NOT NULL,
    nguoi_tao TEXT,
    tao_luc TEXT NOT NULL,
    order_id INTEGER UNIQUE
  )`,
  `CREATE TABLE IF NOT EXISTS pos_giao_chuyen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER UNIQUE NOT NULL,
    ma_bao_phi TEXT,
    ten_nhan TEXT NOT NULL,
    sdt_nhan TEXT NOT NULL,
    dia_chi TEXT NOT NULL,
    lat REAL,
    lng REAL,
    km REAL,
    ghi_chu TEXT,
    loai_xe TEXT NOT NULL,
    trang_thai TEXT NOT NULL,
    nhan_luc TEXT,
    goi_luc TEXT,
    co_xe_luc TEXT,
    lay_hang_luc TEXT,
    xong_luc TEXT,
    huy_luc TEXT,
    ma_ahamove TEXT,
    ma_theo_doi TEXT,
    lan_tim INTEGER NOT NULL DEFAULT 0,
    tu_tim_lai INTEGER NOT NULL DEFAULT 0,
    loi_mang INTEGER NOT NULL DEFAULT 0,
    tai_xe_ten TEXT,
    tai_xe_sdt TEXT,
    tai_xe_bien_so TEXT,
    phi_khach INTEGER NOT NULL DEFAULT 0,
    phi_that INTEGER,
    chenh INTEGER,
    phi_huy INTEGER NOT NULL DEFAULT 0,
    do_da_pha TEXT,
    ly_do_huy TEXT,
    loi TEXT,
    doc_luc TEXT,
    in_tem_luc TEXT,
    lan_in_tem INTEGER NOT NULL DEFAULT 0,
    tao_luc TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_giao_chuyen_trang_thai ON pos_giao_chuyen(trang_thai)',
  'CREATE INDEX IF NOT EXISTS idx_giao_chuyen_ma_ahamove ON pos_giao_chuyen(ma_ahamove)',
  `CREATE TABLE IF NOT EXISTS pos_giao_tin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_ahamove TEXT NOT NULL,
    trang_thai TEXT NOT NULL,
    phu TEXT NOT NULL DEFAULT '',
    luc TEXT NOT NULL,
    UNIQUE (ma_ahamove, trang_thai, phu)
  )`,
];

module.exports.chay = async (tx) => {
  for (const c of CAU) await tx.run(c);
};
