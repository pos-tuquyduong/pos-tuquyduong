// BAO-1b — phép kiểm ô phía quầy (thuần JS, có bài thử chạy thật). Máy chủ vẫn kiểm lại hết; đây chỉ để báo đỏ ngay dưới ô trước khi hỏi PIN.
// Ngưỡng khớp máy chủ: tiers.js (% 0–90, tháng 1–60, không hai gói cùng số tháng), manKhach.js (giây 3–120), gioHoatDong.js (ngừng nhận đơn 0–600 phút).
export const PT_TOI_DA = 90, THANG_TOI_THIEU = 1, THANG_TOI_DA = 60, GIAY_TOI_THIEU = 3, GIAY_TOI_DA = 120, NGUNG_TOI_DA = 600;

const trongKhoang = (v, a, b) => v !== '' && v !== null && Number.isInteger(Number(v)) && Number(v) >= a && Number(v) <= b;

/** Nạp lại danh sách hạng sau một thao tác ghi cục bộ (xoá hạng): giữ NGUYÊN bản đang gõ của hạng còn tồn tại, bỏ hạng máy chủ đã xoá,
 *  giữ hạng chưa lưu (chưa có id), thêm hạng chỉ có ở máy chủ. */
export function ghepSauTai(cu, moi) {
  const conMayChu = new Set(moi.map((h) => h.id)), coCu = new Set(cu.map((h) => h.id));
  return [...cu.filter((h) => !h.id || conMayChu.has(h.id)), ...moi.filter((h) => !coCu.has(h.id))];
}

/** Hạng thành viên → { '<khoa>:name' | ':pt' | ':dacbiet' | ':goi': câu lỗi }. Rỗng = hợp lệ. */
export function kiemHang(ds) {
  const l = {};
  const ngoai = (v) => !(Number(v) >= 0 && Number(v) <= PT_TOI_DA);
  for (const h of ds) {
    if (!String(h.name || '').trim()) l[`${h.khoa}:name`] = 'Nhập tên hạng';
    if (ngoai(h.discount_percent)) l[`${h.khoa}:pt`] = `% giảm phải từ 0 đến ${PT_TOI_DA}`;
    if (ngoai(h.special_discount_percent ?? 0)) l[`${h.khoa}:dacbiet`] = `% giảm phải từ 0 đến ${PT_TOI_DA}`;
    if (h.cach_co === 'ban') {
      if (h.goi.some((g) => !trongKhoang(g.so_thang, THANG_TOI_THIEU, THANG_TOI_DA))) l[`${h.khoa}:goi`] = `Số tháng của gói phải là số nguyên từ ${THANG_TOI_THIEU} đến ${THANG_TOI_DA}`;
      else if (new Set(h.goi.map((g) => Number(g.so_thang))).size < h.goi.length) l[`${h.khoa}:goi`] = 'Hai gói không được cùng số tháng';
    }
  }
  return l;
}

/** Màn khách: số giây mỗi trang → { 'giay<i>': câu lỗi }. */
export function kiemGiay(trang) {
  const l = {};
  trang.forEach((t, i) => { if (!trongKhoang(t.giay, GIAY_TOI_THIEU, GIAY_TOI_DA)) l[`giay${i}`] = `Số giây phải từ ${GIAY_TOI_THIEU} đến ${GIAY_TOI_DA}`; });
  return l;
}

/** Giờ hoạt động: số phút ngừng nhận đơn (chuỗi rỗng = 0). */
export const ngungHopLe = (v) => trongKhoang(String(v).trim() || '0', 0, NGUNG_TOI_DA);
