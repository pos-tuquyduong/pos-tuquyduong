/**
 * Bước 027 (ND-API-1): kho nội dung App KH — "nhà riêng" của server/nd/. CHỈ tạo bảng / chỉ mục MỚI nd_* (không khoá ngoại sang bảng POS)
 * + gieo 4 quyền nhóm "App khách hàng — nội dung" (INSERT OR IGNORE: owner 1, manager / staff 0 — chủ quán bật ở màn Phân quyền thì
 * không đè). Không đụng bảng cũ. Kho thử chỉ có bảng kho (thu_KHO2a E6b) → bỏ qua phần quyền (khuôn 018 / 025).
 *   nd_ban          phiên bản đã cập nhật — giữ MỌI bản; chỉ mục nd_ban_mot_dang_chay: đúng MỘT bản dang_chay = 1
 *   nd_nhap         nháp đang sửa, một dòng / khoá
 *   nd_anh          ảnh (mã = SHA-256 nội dung), dữ liệu ảnh nằm ngay trong bảng
 *   nd_nhat_ky      ai · lúc · việc (luu / bo_nhap / cap_nhat / quay_lai / xuat / nhap) · số bản · số khoá
 *   nd_khoa_sao_luu khoá sao lưu chỉ đọc — chỉ BĂM của khoá, lúc tạo, lúc thu hồi
 *   nd_lan_sai      đếm đăng nhập /api/nd sai (khoá 'ip:<ip>' | 'cap:<tên>|<ip>')
 */
const { getNow } = require('../utils/helpers');
const { QUYEN, VIEC } = require('../nd/tinh');

const CAU = [
  `CREATE TABLE IF NOT EXISTS nd_ban (
    so_ban INTEGER PRIMARY KEY,
    gia_tri TEXT NOT NULL,
    ghi_chu TEXT,
    tom_tat TEXT,
    nguoi TEXT,
    luc TEXT NOT NULL,
    tu_ban INTEGER,
    dang_chay INTEGER NOT NULL DEFAULT 0 CHECK (dang_chay IN (0, 1))
  )`,
  'CREATE UNIQUE INDEX IF NOT EXISTS nd_ban_mot_dang_chay ON nd_ban (dang_chay) WHERE dang_chay = 1',
  `CREATE TABLE IF NOT EXISTS nd_nhap (
    khoa TEXT PRIMARY KEY,
    gia_tri TEXT NOT NULL,
    nguoi TEXT,
    luc TEXT NOT NULL,
    ban_goc INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS nd_anh (
    ma TEXT PRIMARY KEY,
    loai TEXT NOT NULL,
    kich_thuoc INTEGER NOT NULL,
    du_lieu BLOB NOT NULL,
    luc TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS nd_nhat_ky (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nguoi TEXT,
    luc TEXT NOT NULL,
    viec TEXT NOT NULL CHECK (viec IN (${VIEC.map((v) => `'${v}'`).join(', ')})),
    so_ban INTEGER,
    so_khoa INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS nd_khoa_sao_luu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ten TEXT,
    ma_bam TEXT UNIQUE NOT NULL,
    tao_luc TEXT NOT NULL,
    tao_boi TEXT,
    thu_hoi_luc TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS nd_lan_sai (
    khoa TEXT PRIMARY KEY,
    sai INTEGER NOT NULL,
    khoa_den TEXT
  )`,
];

module.exports.chay = async (tx) => {
  for (const c of CAU) await tx.run(c);
  if (!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = 'pos_permissions'"))) return;
  for (const quyen of QUYEN) {
    for (const [role, allowed] of [['owner', 1], ['manager', 0], ['staff', 0]]) {
      await tx.run('INSERT OR IGNORE INTO pos_permissions (role, permission, allowed, created_at) VALUES (?, ?, ?, ?)', [role, quyen, allowed, getNow()]);
    }
  }
};
