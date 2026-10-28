/**
 * Bước 001 (KHO-1): các bảng kho_*. Chỉ tạo bảng / chỉ mục mới — không đụng bảng cũ.
 * Món bán vẫn là MỘT dòng pos_products; kho_san_pham chỉ giữ thuộc tính kho của đúng dòng đó (không tên, không giá).
 * Tồn KHÔNG có ô: tồn = Σ kho_phieu_dong.so_luong (có dấu) của phiếu da_duyet — sổ chỉ thêm (CLAUDE.md §5.4). Phiếu / lô / định mức:
 * KHO-1 chỉ tạo bảng, luồng ở KHO-2. Giờ là chuỗi getNow; tiền là số nguyên đồng; lượng theo đơn vị LƯU của nguyên liệu.
 * KHÔNG khai khoá ngoại: libsql bật kiểm khoá ngoại, khôi phục Excel xoá cả bảng pos_products / bảng cha → 500 giữa chừng (bài thử J3).
 * Toàn vẹn giữ ở code: xoá nguyên liệu kiểm NOT EXISTS, lưu công thức kiểm món / nguyên liệu có thật.
 */
const CAU = [
  `CREATE TABLE IF NOT EXISTS kho_nhom_nguyen_lieu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten TEXT UNIQUE NOT NULL,
    ten_sx TEXT UNIQUE,
    thu_tu INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS kho_nha_cung_cap (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten TEXT UNIQUE NOT NULL,
    sdt TEXT,
    ghi_chu TEXT,
    dang_dung INTEGER NOT NULL DEFAULT 1
  )`,
  // he_so_doi: 1 đơn vị hiện = he_so_doi đơn vị lưu (g → kg: 0.001). gia_nhap: đồng / 1 đơn vị lưu, NULL = chưa có giá.
  `CREATE TABLE IF NOT EXISTS kho_nguyen_lieu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten TEXT NOT NULL,
    ten_chuan TEXT UNIQUE NOT NULL,
    nhom_id INTEGER,
    nha_cung_cap_id INTEGER,
    don_vi_luu TEXT NOT NULL,
    don_vi_hien TEXT,
    he_so_doi REAL NOT NULL DEFAULT 1 CHECK (he_so_doi > 0),
    gia_nhap INTEGER,
    ton_toi_thieu REAL,
    han_ngay INTEGER,
    ghi_chu TEXT,
    dang_dung INTEGER NOT NULL DEFAULT 1,
    sx_id INTEGER UNIQUE,
    tao_luc TEXT NOT NULL,
    sua_luc TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS kho_nhom_cong_thuc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten TEXT UNIQUE NOT NULL,
    ten_sx TEXT UNIQUE,
    thu_tu INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS kho_san_pham (
    pos_product_id INTEGER PRIMARY KEY,
    kieu TEXT NOT NULL CHECK (kieu IN ('pha_tai_cho', 'lam_san', 'chua_dinh_luong')),
    nhom_id INTEGER,
    sua_luc TEXT
  )`,
  // Một dòng = nguyên liệu HOẶC sản phẩm con (lồng), lượng cho 1 đơn vị sản phẩm. Lưu số thật, làm tròn chỉ khi hiển thị.
  `CREATE TABLE IF NOT EXISTS kho_cong_thuc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    san_pham_id INTEGER NOT NULL,
    nguyen_lieu_id INTEGER,
    thanh_phan_id INTEGER,
    luong REAL NOT NULL CHECK (luong > 0),
    CHECK ((nguyen_lieu_id IS NULL) <> (thanh_phan_id IS NULL))
  )`,
  'CREATE INDEX IF NOT EXISTS idx_kho_cong_thuc_sp ON kho_cong_thuc(san_pham_id)',
  // thu: 0–6 (chủ nhật = 0), NULL = mọi ngày.
  `CREATE TABLE IF NOT EXISTS kho_dinh_muc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    san_pham_id INTEGER NOT NULL,
    thu INTEGER CHECK (thu BETWEEN 0 AND 6),
    so_luong REAL NOT NULL,
    UNIQUE (san_pham_id, thu)
  )`,
  // ĐH đặt hàng · PX xuất · PN nhập · PS phát sinh · KK kiểm kê. Sửa = phiếu mới trỏ thay_cho_id, phiếu cũ giữ (chuyển 'huy').
  `CREATE TABLE IF NOT EXISTS kho_phieu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loai TEXT NOT NULL CHECK (loai IN ('DH', 'PX', 'PN', 'PS', 'KK')),
    so_phieu TEXT UNIQUE NOT NULL,
    trang_thai TEXT NOT NULL DEFAULT 'nhap' CHECK (trang_thai IN ('nhap', 'cho_duyet', 'da_duyet', 'huy')),
    nha_cung_cap_id INTEGER,
    nguoi_tao TEXT NOT NULL,
    tao_luc TEXT NOT NULL,
    nguoi_duyet TEXT,
    duyet_luc TEXT,
    thay_cho_id INTEGER,
    ly_do TEXT,
    ghi_chu TEXT
  )`,
  // Lô nguyên liệu hoặc thành phẩm. so_luong = lượng lúc vào lô (không trừ dần); còn lại = Σ dòng phiếu đã duyệt theo lo_id.
  `CREATE TABLE IF NOT EXISTS kho_lo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nguyen_lieu_id INTEGER,
    san_pham_id INTEGER,
    so_luong REAL NOT NULL,
    han_dung TEXT,
    gia_von INTEGER,
    phieu_id INTEGER NOT NULL,
    tao_luc TEXT NOT NULL,
    CHECK ((nguyen_lieu_id IS NULL) <> (san_pham_id IS NULL))
  )`,
  // so_luong có dấu: + vào kho, − ra kho.
  `CREATE TABLE IF NOT EXISTS kho_phieu_dong (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phieu_id INTEGER NOT NULL,
    nguyen_lieu_id INTEGER,
    san_pham_id INTEGER,
    lo_id INTEGER,
    so_luong REAL NOT NULL,
    don_gia INTEGER,
    ghi_chu TEXT,
    CHECK ((nguyen_lieu_id IS NULL) <> (san_pham_id IS NULL))
  )`,
  'CREATE INDEX IF NOT EXISTS idx_kho_phieu_dong_phieu ON kho_phieu_dong(phieu_id)',
];

module.exports.chay = async (tx) => {
  for (const cau of CAU) await tx.run(cau);
};
