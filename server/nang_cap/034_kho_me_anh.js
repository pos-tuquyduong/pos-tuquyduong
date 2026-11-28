/**
 * Bước 034 (KHO-GON-2): món đun theo nồi + ảnh hoá đơn phiếu nhận. Chỉ THÊM; chạy lại không đổi gì.
 * - kho_san_pham.me_ra REAL — mỗi mẻ (nồi) ra bao nhiêu đơn vị; NULL = không theo mẻ (màn Pha chế nhập theo đơn vị như cũ).
 * - kho_san_pham.me_ghi TEXT — ghi chú mẻ (vd "+ 5 L nước"), ≤ 60 ký tự (kiểm ở PUT /san-pham/:id).
 * - kho_anh_phieu — ảnh hoá đơn gắn phiếu nhận, base64 trong CSDL (không đĩa Render — mất khi deploy), như pos_anh_mon (bước 037).
 *   Bảng này KHÔNG nằm trong danh sách xuất Excel hằng ngày (server/routes/backup.js BANG_KHONG_XUAT_EXCEL — chủ quán duyệt 28.11).
 * Phiếu nhận cũ đang chờ duyệt KHÔNG bị đụng (E3): vẫn chờ, duyệt như cũ.
 */
module.exports.chay = async (tx, { themCot }) => {
  await themCot('kho_san_pham', 'me_ra REAL');
  await themCot('kho_san_pham', 'me_ghi TEXT');
  await tx.run(`CREATE TABLE IF NOT EXISTS kho_anh_phieu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phieu_id INTEGER NOT NULL,
    kieu TEXT NOT NULL,
    du_lieu TEXT NOT NULL,
    co INTEGER NOT NULL,
    nguoi TEXT,
    tao_luc TEXT NOT NULL
  )`);
  await tx.run('CREATE INDEX IF NOT EXISTS ix_kho_anh_phieu ON kho_anh_phieu(phieu_id)');
};
