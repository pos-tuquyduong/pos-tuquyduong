/**
 * HD-1: MỘT hàm tính "mã bill sẽ cộng bao nhiêu điểm" — /nhan-diem (signup-codes.js) và hoá đơn (routes/hoaDon.js) cùng gọi.
 * Tách NGUYÊN từ thân nhanDiemMaBill, không đổi thứ tự kiểm hay lời báo. Số điểm gốc `tienDiem` = floor(tienTinhDiem(don)) do
 * chỗ gọi truyền vào (DIEM-THAT-1: tiền khách trả thật, một hàm riêng ở utils/diemThat.js).
 */
const { query, queryOne } = require('../database');

/** Cấu hình tích điểm đang chạy + đơn này đã được cộng điểm lúc bán chưa. */
async function docDuLieuNhanDiem(donId) {
  const rows = await query(
    "SELECT key, value FROM pos_settings WHERE key IN ('loyalty_enabled','loyalty_earn_per_amount','loyalty_expiry_mode')",
  );
  const loy = {};
  for (const r of rows) loy[r.key] = r.value;
  const daCong = await queryOne(
    "SELECT id FROM pos_point_transactions WHERE order_id = ? AND type = 'earn' LIMIT 1",
    [donId],
  );
  return { loy, daCong: !!daCong };
}

const loi = (status, code, error) => ({ loi: { status, code, error } });

/**
 * { diemGoc, diemCong } hoặc { loi: { status, code, error } }.
 * `ch` = docCauHinhNhanDiem() (heSo); `loy` = từ docDuLieuNhanDiem; `daCong` = đơn đã cộng điểm lúc bán (chỉ cộng BÙ phần còn thiếu).
 */
function tinhDiemNhanMa({ don, tienDiem, ch, loy, daCong }) {
  // P22-23 (chủ quán chốt 13.10): đơn giảm Flash 0 điểm — cả lúc bán lẫn nhận bằng mã bill.
  if (Number(don.flash_discount) > 0) {
    return loi(400, 'DON_FLASH_KHONG_DIEM', 'Đơn có giảm Flash sale không được cộng điểm.');
  }
  if (loy.loyalty_enabled !== '1' && loy.loyalty_enabled !== 'true') {
    return loi(400, 'TICH_DIEM_DANG_TAT', 'Chương trình tích điểm đang tắt.');
  }
  const moiBaoNhieu = Number(loy.loyalty_earn_per_amount);
  if (!Number.isFinite(moiBaoNhieu) || moiBaoNhieu < 1) {
    return loi(400, 'CAU_HINH_DIEM_SAI', 'Cấu hình tích điểm chưa hợp lệ.');
  }
  const diemGoc = Math.floor(tienDiem / moiBaoNhieu);
  if (diemGoc <= 0) return loi(400, 'DON_KHONG_DU_DIEM', 'Đơn này không đủ để tính điểm.');
  const diemCong = daCong ? Math.round(diemGoc * (ch.heSo - 1)) : Math.round(diemGoc * ch.heSo);
  if (diemCong <= 0) return loi(400, 'KHONG_THEM_DIEM', 'Hệ số hiện tại không cộng thêm điểm nào cho đơn này.');
  return { diemGoc, diemCong };
}

module.exports = { docDuLieuNhanDiem, tinhDiemNhanMa };
