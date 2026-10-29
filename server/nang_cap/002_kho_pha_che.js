/**
 * Bước 002 (KHO-2a): pha chế · phiếu xuất có duyệt · kết quả. Chỉ THÊM cột (qua themCot — tự sao lưu bảng có dòng) và chỉ mục.
 * Không thêm bảng: backup.js sao lưu theo danh sách bảng cứng, cột mới tự đi theo SELECT *.
 * kho_phieu_dong.loai: 'xuat' (nguyên liệu ra, cho_mon_id = món dùng nó) · 'thanh_pham' (lô món vào) · 'ket_qua' (số thực − chuẩn, cùng lo_id).
 */
module.exports.chay = async (tx, { themCot }) => {
  await themCot('kho_san_pham', 'han_ngay INTEGER');   // hạn dùng thành phẩm (ngày); NULL = lô không hạn
  await themCot('kho_nhom_cong_thuc', 'lech_cho_phep REAL');   // % lệch cho phép giữa số thực ra và số chuẩn; NULL = không cảnh báo
  await themCot('kho_phieu', 'so_lan_in INTEGER NOT NULL DEFAULT 0');
  await themCot('kho_phieu', 'ma_gui TEXT');   // mã mỗi lần bấm "Xuất kho nguyên liệu" — bấm hai lần ra một phiếu
  await themCot('kho_phieu_dong', "loai TEXT CHECK (loai IN ('xuat', 'thanh_pham', 'ket_qua'))");
  await themCot('kho_phieu_dong', 'cho_mon_id INTEGER');
  await themCot('kho_phieu_dong', 'nguoi TEXT');
  await themCot('kho_phieu_dong', 'luc TEXT');
  await tx.run('CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_phieu_ma_gui ON kho_phieu(ma_gui) WHERE ma_gui IS NOT NULL');
  await tx.run("CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_ket_qua_lo ON kho_phieu_dong(lo_id) WHERE loai = 'ket_qua'");
  await tx.run('CREATE INDEX IF NOT EXISTS idx_kho_phieu_dong_lo ON kho_phieu_dong(lo_id)');
};
