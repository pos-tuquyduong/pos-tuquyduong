// Hàm thuần của App KH (không đụng DOM / mạng) — bài thử cong_cu/thu_KHUI1.js nạp thẳng file này.

/** 25000 → "25.000đ". Không phải số → "" (không bịa số, CLAUDE.md §5.8). */
export function dinhDangGia(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '';
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

/** Mô tả mức giảm của mã: percent → "giảm 10%", loại khác → "giảm 20.000đ". */
export function moTaGiam(loai, giaTri) {
  return loai === 'percent' ? `giảm ${giaTri}%` : `giảm ${dinhDangGia(Number(giaTri))}`;
}

/** "2026-10-22T14:05:00" (giờ VN từ máy chủ) → "14:05 22/10/2026". Không đọc được → "". */
export function dinhDangNgay(chuoi) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(String(chuoi || ''));
  if (!m) return '';
  const ngay = `${m[3]}/${m[2]}/${m[1]}`;
  return m[4] ? `${m[4]}:${m[5]} ${ngay}` : ngay;
}

// Lời dự phòng khi máy chủ không trả `error` (mất mạng, 5xx không phải JSON…). Có `error` của máy chủ thì LUÔN dùng nó.
const LOI_DU_PHONG = {
  MANG_LOI: 'Không kết nối được. Kiểm tra mạng rồi thử lại.',
  KH_CHUA_CAU_HINH: 'App khách chưa sẵn sàng. Vui lòng quay lại sau.',
  KH_TOKEN_SAI: 'Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.',
  LOI_MAY_CHU: 'Máy chủ đang bận. Thử lại sau ít phút.',
};
const LOI_CHUNG = 'Có lỗi xảy ra. Thử lại sau.';

export function loiTheoCode(code, error) {
  if (typeof error === 'string' && error.trim()) return error;
  return LOI_DU_PHONG[code] || LOI_CHUNG;
}
