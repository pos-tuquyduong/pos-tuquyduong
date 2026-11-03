/**
 * Bước 013 (HANG-1): hạng thẻ có thứ bậc, gói thời hạn, hạng chỉ cấp, PIN chủ quán. Chỉ THÊM cột / bảng; đổi dữ liệu hạng thì sao lưu trước.
 *   pos_membership_tiers.cach_co  'ban' (bán theo gói) | 'chi_cap' (chỉ chủ quán cấp). Thứ bậc = sort_order có sẵn (lớn = cao).
 *   pos_membership_tiers.goi      JSON [{ so_thang 1–60, gia (null = chưa đặt giá → không bán), bat }]. card_price thôi dùng (giữ cột).
 *   pos_membership_purchases.loai 'ban' | 'cap' | 'thu_hoi'; .so_thang (NULL ở dòng cấp = không thời hạn, dòng cũ = đọc theo expires_at).
 *   pos_pin_chu_quan              một dòng (id = 1): băm PIN chủ quán + bộ đếm sai / khoá (utils/pinChuQuan.js).
 *   quyền cap_hang                owner 1 · manager 0 · staff 0 (INSERT OR IGNORE — không đè quyền chủ quán đã chỉnh).
 * Dữ liệu (chủ quán chốt 02.11, chỉ khi TÊN KHỚP đúng và gói còn rỗng — chạy lại không đè cài đặt chủ quán):
 *   'Vàng' → ban, gói 1 tháng + 3 tháng giá trống; 'Kim Cương' → chi_cap.
 *   Thứ bậc các hạng đang bật đánh lại 1..n theo thứ tự đang hiện (sort_order, card_price, id) — kho có 0 / trùng thì "cao nhất" không mơ hồ.
 * Bảng chưa có → bỏ qua phần của bảng đó (khuôn 003: máy thật luôn có — database.js tạo bảng trước chayNangCap; chỉ kho thử toàn bảng kho
 * của thu_KHO2a E6b / thu_KHAPI3 C4b mới thiếu).
 */
const { getNow } = require('../utils/helpers');

const GOI_VANG = JSON.stringify([{ so_thang: 1, gia: null, bat: true }, { so_thang: 3, gia: null, bat: true }]);

module.exports.chay = async (tx, { themCot }) => {
  const coBang = async (ten) => !!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = ?", [ten]));
  if (await coBang('pos_membership_purchases')) {
    await themCot('pos_membership_purchases', "loai TEXT NOT NULL DEFAULT 'ban'");
    await themCot('pos_membership_purchases', 'so_thang INTEGER');
  }
  await tx.run(`CREATE TABLE IF NOT EXISTS pos_pin_chu_quan (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    pin_bam TEXT NOT NULL,
    sai INTEGER NOT NULL DEFAULT 0,
    khoa_den TEXT,
    dat_boi TEXT,
    dat_luc TEXT NOT NULL
  )`);
  for (const [role, allowed] of (await coBang('pos_permissions')) ? [['owner', 1], ['manager', 0], ['staff', 0]] : []) {
    await tx.run("INSERT OR IGNORE INTO pos_permissions (role, permission, allowed, created_at) VALUES (?, 'cap_hang', ?, ?)", [role, allowed, getNow()]);
  }
  if (!(await coBang('pos_membership_tiers'))) return;
  await themCot('pos_membership_tiers', "cach_co TEXT NOT NULL DEFAULT 'ban'");
  await themCot('pos_membership_tiers', "goi TEXT NOT NULL DEFAULT '[]'");
  const dsHang = await tx.query('SELECT id FROM pos_membership_tiers WHERE is_active = 1 ORDER BY sort_order, card_price, id');
  if (!dsHang.length) return;
  await tx.run('CREATE TABLE IF NOT EXISTS _sao_luu_013_pos_membership_tiers AS SELECT * FROM pos_membership_tiers');
  await tx.run("UPDATE pos_membership_tiers SET goi = ? WHERE name = 'Vàng' AND cach_co = 'ban' AND goi = '[]'", [GOI_VANG]);
  await tx.run("UPDATE pos_membership_tiers SET cach_co = 'chi_cap' WHERE name = 'Kim Cương' AND goi = '[]'");
  for (const [i, h] of dsHang.entries()) await tx.run('UPDATE pos_membership_tiers SET sort_order = ? WHERE id = ?', [i + 1, h.id]);
};
