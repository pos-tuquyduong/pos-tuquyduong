/**
 * KHO-1 — phép tính THUẦN của mục kho: không đọc CSDL, không đọc giờ. Dùng lại ở KHO-2 (phiếu xuất, đặt hàng) và KHO-3 (bán trừ kho).
 */

const KIEU_SAN_PHAM = ['pha_tai_cho', 'lam_san', 'chua_dinh_luong'];

/** Tên gọn: NFC, cắt đầu / cuối, gộp khoảng trắng — giữ hoa / thường. */
function gonTen(ten) {
  return String(ten ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
}

/** Khoá so tên: gonTen + chữ thường — GIỮ dấu ("Táo tươi" ≠ "Táo đỏ"). */
function chuanHoaTen(ten) {
  return gonTen(ten).toLocaleLowerCase('vi');
}

/** Tên để hiện: như chuanHoaTen rồi viết hoa chữ đầu ("lá  DỨA" → "Lá dứa"). */
function chuanTenHienThi(ten) {
  const t = chuanHoaTen(ten);
  return t.charAt(0).toLocaleUpperCase('vi') + t.slice(1);
}

/** Đổi đơn vị: 1 đơn vị hiện = heSo đơn vị lưu. Mặc định lưu → hiện; veLuu = true thì hiện → lưu. */
function doiDonVi(so, heSo, veLuu = false) {
  return veLuu ? so * heSo : so / heSo;
}

/**
 * Triển khai công thức ra nguyên liệu gốc, cộng dồn. congThuc = { goc: <pos_product_id>, bang: { [spId]: [dòng] } },
 * dòng = { nguyen_lieu_id, luong } hoặc { thanh_phan_id, luong } (lượng cho 1 đơn vị). Trả [{ nguyen_lieu_id, luong }].
 * Gặp vòng (kể cả A→A) → ném lỗi code CONG_THUC_VONG_LAP, `chuoi` = các id từ gốc tới chỗ lặp. Hình kim cương không phải vòng.
 */
function trienKhai(congThuc, soPhan) {
  const tong = new Map();
  const di = (spId, he, duong) => {
    for (const d of congThuc.bang[spId] || []) {
      if (d.nguyen_lieu_id != null) {
        tong.set(d.nguyen_lieu_id, (tong.get(d.nguyen_lieu_id) || 0) + he * d.luong);
      } else if (duong.includes(d.thanh_phan_id)) {
        const loi = new Error('Công thức vòng lặp');
        loi.code = 'CONG_THUC_VONG_LAP';
        loi.chuoi = [...duong, d.thanh_phan_id];
        throw loi;
      } else {
        di(d.thanh_phan_id, he * d.luong, [...duong, d.thanh_phan_id]);
      }
    }
  };
  di(congThuc.goc, soPhan, [congThuc.goc]);
  return [...tong].map(([nguyen_lieu_id, luong]) => ({ nguyen_lieu_id, luong }));
}

/** Lỗi do đụng khoá duy nhất / khoá chính (tên trùng, bước nâng cấp đã chạy). */
function laTrungKhoa(loi) {
  return /SQLITE_CONSTRAINT_(UNIQUE|PRIMARYKEY)/.test(String(loi && loi.code)) || /UNIQUE constraint|PRIMARY KEY/i.test(String(loi && loi.message));
}

module.exports = { KIEU_SAN_PHAM, gonTen, chuanHoaTen, chuanTenHienThi, doiDonVi, trienKhai, laTrungKhoa };
