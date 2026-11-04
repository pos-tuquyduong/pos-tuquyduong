/**
 * Bước 017 (CT-1a): chương trình đặc biệt + ngày sinh khách. Chỉ THÊM — không xoá / đổi dữ liệu có sẵn.
 *   pos_chuong_trinh:   cấu hình MỘT chương trình (ưu đãi · điều kiện · thời gian chạy). CT-1a chỉ lưu + hiển thị; áp tại quầy là CT-1b.
 *   pos_customers.ngay_sinh: 'YYYY-MM-DD' hoặc NULL — nhập MỘT lần (App hoặc quầy), sau đó chỉ chủ quán sửa. KHÔNG lưu số căn cước.
 *   pos_ngay_sinh_sua:  sổ chỉ-thêm-dòng mỗi lần đặt / sửa ngày sinh (ai · lúc nào · giá trị cũ · mới · lý do).
 *   Quyền sua_ngay_sinh: chủ quán 1, quản lý 0, nhân viên 0 (INSERT OR IGNORE — không đè quyền chủ quán đã chỉnh).
 * Hai chương trình mẫu (TẮT sẵn) theo chủ quán chốt 01–02.11: Học sinh giỏi, Sinh nhật. Cột giờ ghi bằng getNow().
 */
const { getNow } = require('../utils/helpers');

const CAU = [
  `CREATE TABLE IF NOT EXISTS pos_chuong_trinh (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ma TEXT UNIQUE NOT NULL,
    ten TEXT NOT NULL,
    mo_ta TEXT NOT NULL DEFAULT '',
    loai TEXT NOT NULL DEFAULT 'khac',
    mien_so_mon INTEGER NOT NULL DEFAULT 0,
    mien_gia_toi_da INTEGER,
    giam_ca_don_pt INTEGER NOT NULL DEFAULT 0,
    giam_con_lai_pt INTEGER NOT NULL DEFAULT 0,
    chi_tai_quan INTEGER NOT NULL DEFAULT 1,
    can_xem_giay_to INTEGER NOT NULL DEFAULT 0,
    gioi_han_ky TEXT NOT NULL DEFAULT 'nam',
    gioi_han_so INTEGER NOT NULL DEFAULT 1,
    bat_dau TEXT,
    ket_thuc TEXT,
    dang_bat INTEGER NOT NULL DEFAULT 0,
    tao_luc TEXT NOT NULL,
    sua_luc TEXT,
    sua_boi TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS pos_ngay_sinh_sua (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    cu TEXT,
    moi TEXT NOT NULL,
    ly_do TEXT,
    boi TEXT NOT NULL,
    luc TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS idx_ngay_sinh_sua_phone ON pos_ngay_sinh_sua(phone)',
];

// [ma, ten, mo_ta, loai, mien_so_mon, giam_ca_don_pt, giam_con_lai_pt, gioi_han_ky]
const MAU = [
  ['hoc_sinh_gioi', 'Học sinh giỏi', 'Mang giấy khen: học sinh được miễn 1 đồ uống; người đi kèm giảm 50% phần còn lại của cùng một hoá đơn.', 'hoc_sinh_gioi', 1, 0, 50, 'nam_hoc'],
  ['sinh_nhat', 'Sinh nhật', 'Đúng ngày sinh nhật: giảm 50% cả đơn, đối chiếu căn cước.', 'sinh_nhat', 0, 50, 0, 'nam'],
];

// Máy thật luôn có pos_customers / pos_permissions (database.js chạy createTables() trước chayNangCap); chỉ kho thử toàn bảng kho
// (thu_KHO2a E6b chạy cả thư mục nang_cap) mới thiếu — cùng khuôn bước 003.
const co = async (tx, bang) => !!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = ?", [bang]));

module.exports.chay = async (tx, { themCot }) => {
  for (const c of CAU) await tx.run(c);
  if (await co(tx, 'pos_customers')) await themCot('pos_customers', 'ngay_sinh TEXT');
  for (const m of MAU) {
    await tx.run(`INSERT OR IGNORE INTO pos_chuong_trinh (ma, ten, mo_ta, loai, mien_so_mon, giam_ca_don_pt, giam_con_lai_pt, chi_tai_quan, can_xem_giay_to,
      gioi_han_ky, gioi_han_so, dang_bat, tao_luc) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, 1, 0, ?)`, [...m, getNow()]);
  }
  if (!(await co(tx, 'pos_permissions'))) return;
  for (const [vaiTro, duoc] of [['owner', 1], ['manager', 0], ['staff', 0]]) {
    await tx.run("INSERT OR IGNORE INTO pos_permissions (role, permission, allowed, created_at) VALUES (?, 'sua_ngay_sinh', ?, ?)", [vaiTro, duoc, getNow()]);
  }
};
