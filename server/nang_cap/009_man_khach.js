/**
 * Bước 009 (MANKHACH-1): ghép máy màn khách ↔ máy quầy. Chỉ tạo bảng / chỉ mục mới; KHÔNG cột tiền, KHÔNG dữ liệu khách.
 *   pos_man_khach_quay: mỗi máy quầy một dòng — id ngẫu nhiên (máy quầy tự nhớ), mã ghép 6 số + hạn, phiên QR quầy đang hiện
 *                       (phien_id) và bản hiển thị đã dựng ở máy chủ (hien, JSON — tên món, số lượng, thành tiền, dòng giảm).
 *   pos_man_khach_may:  mỗi màn khách đã ghép một dòng — khoá lưu dạng BĂM (sha256), không lưu khoá gốc; thu hồi = ghi thu_hoi_luc.
 */
const CAU = [
  `CREATE TABLE IF NOT EXISTS pos_man_khach_quay (
    id TEXT PRIMARY KEY,
    ma TEXT NOT NULL,
    ma_het_han TEXT NOT NULL,
    phien_id INTEGER,
    hien TEXT,
    tao_luc TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS pos_man_khach_may (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quay_id TEXT NOT NULL,
    ten TEXT NOT NULL,
    khoa_bam TEXT UNIQUE NOT NULL,
    tao_luc TEXT NOT NULL,
    thu_hoi_luc TEXT,
    thu_hoi_boi TEXT
  )`,
  'CREATE INDEX IF NOT EXISTS idx_man_khach_may_quay ON pos_man_khach_may(quay_id)',
];

module.exports.chay = async (tx) => {
  for (const c of CAU) await tx.run(c);
};
