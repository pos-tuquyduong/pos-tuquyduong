/**
 * Bước 006 (KH-MUA-1): bảng đơn App KH — nối khách ↔ phiên thanh toán (pos_phien_thanh_toan). KHÔNG cột tiền, KHÔNG order_id: tiền ở
 * phiên, đơn thật ở pos_phien_thanh_toan.order_id (một nguồn sự thật). Chỉ tạo bảng / chỉ mục mới.
 *   ma            mã đơn App ('A' + 8 ký tự ngẫu nhiên) — khách xem / huỷ theo mã này
 *   khoa_gui      khoá chống gửi trùng của App, duy nhất THEO KHÁCH (UNIQUE phone + khoa_gui)
 *   bam           sha256 của giỏ (món, SL, ghi chú, mã giảm, cách nhận, cách trả) — so khoá trùng + lưới 10 giây; không có PIN
 *   than          bản chụp giỏ đã tính (JSON) — App xem đơn chưa trả; không có PIN
 *   phien_id      NULL = đang tạo (giữ khoá); có = đã có phiên thanh toán
 *   tien_trinh_quay  '' · dang_lam · xong (quầy bấm, ghi người + giờ)
 */
const CAU = [
  `CREATE TABLE IF NOT EXISTS pos_don_app (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ma TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    khoa_gui TEXT NOT NULL,
    bam TEXT NOT NULL,
    than TEXT NOT NULL,
    phien_id INTEGER,
    tien_trinh_quay TEXT NOT NULL DEFAULT '',
    nguoi_lam TEXT,
    luc_lam TEXT,
    nguoi_xong TEXT,
    luc_xong TEXT,
    tao_luc TEXT NOT NULL,
    UNIQUE (phone, khoa_gui)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_don_app_phien ON pos_don_app(phien_id)',
  'CREATE INDEX IF NOT EXISTS idx_don_app_phone ON pos_don_app(phone, tao_luc)',
];

module.exports.chay = async (tx) => {
  for (const c of CAU) await tx.run(c);
};
