/**
 * Bước 019 (CK-NOIDUNG-1): sổ số hoá đơn theo ngày + mã giao dịch ngân hàng của đơn. Chỉ THÊM.
 *   pos_so_hoa_don: MỘT dòng mỗi số đã cấp — ngày giờ VN ('YYYY-MM-DD'), số trong ngày, kênh ('HD' quầy | 'APP' đơn App), phiên QR đã
 *     giữ số (NULL nếu số cấp lúc tạo đơn), đơn nhận số (NULL tới khi có đơn). Cấp số: helpers.js capSoHoaDon (một câu INSERT … MAX + 1
 *     trong giao dịch ghi). UNIQUE (ngay, so) = chốt cuối chống trùng số; UNIQUE phien_id = một phiên tối đa một số.
 *   pos_orders.ma_gd: mã giao dịch ngân hàng (SePay referenceCode / payOS reference) — ghi lúc webhook chốt đơn.
 */
const CAU = [
  `CREATE TABLE IF NOT EXISTS pos_so_hoa_don (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ngay TEXT NOT NULL,
    so INTEGER NOT NULL,
    kenh TEXT NOT NULL,
    phien_id INTEGER,
    order_id INTEGER,
    luc TEXT NOT NULL
  )`,
  'CREATE UNIQUE INDEX IF NOT EXISTS ux_so_hoa_don_ngay_so ON pos_so_hoa_don(ngay, so)',
  'CREATE UNIQUE INDEX IF NOT EXISTS ux_so_hoa_don_phien ON pos_so_hoa_don(phien_id) WHERE phien_id IS NOT NULL',
];

// Kho thử chỉ có bảng kho (thu_KHO2a E6b chạy cả thư mục nang_cap) thì không có pos_orders — cùng khuôn bước 017.
const co = async (tx, bang) => !!(await tx.queryOne("SELECT 1 AS co FROM sqlite_master WHERE type = 'table' AND name = ?", [bang]));

module.exports.chay = async (tx, { themCot }) => {
  for (const c of CAU) await tx.run(c);
  if (await co(tx, 'pos_orders')) await themCot('pos_orders', 'ma_gd TEXT');
};
