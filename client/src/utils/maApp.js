/**
 * KH-QUAY-1 — hàm thuần cho hộp "Mã đăng nhập App" (components/MaDangNhapApp.jsx).
 * Không đụng mạng / React; thử bằng `node cong_cu/thu_KHQUAY1.js`.
 */

const LOI_MAC_DINH = 'Không lấy được mã — thử lại';

/** Số giây → "m:ss"; âm, lẻ, không phải số đều an toàn ("0:00"). */
export function dinhDangDemNguoc(giay) {
  const g = Number.isFinite(giay) ? Math.max(0, Math.floor(giay)) : 0;
  return `${Math.floor(g / 60)}:${String(g % 60).padStart(2, '0')}`;
}

/** Giây còn lại tới mốc hết hạn (ms), làm tròn LÊN; 0 = đã hết hạn. Mốc hỏng → 0 (không treo một mã không rõ hạn). */
export function giayConLai(hetHanLuc, bayGio) {
  if (!Number.isFinite(hetHanLuc) || !Number.isFinite(bayGio)) return 0;
  return Math.max(0, Math.ceil((hetHanLuc - bayGio) / 1000));
}

/** Lỗi của POST /kh/cap-ma → lời cho thu ngân. */
export function loiMaApp(err) {
  if (err && err.code === 'KH_CHUA_CAU_HINH') return 'App khách chưa bật — báo quản lý';
  if (err && err.status === 503) return 'Máy chủ chưa sẵn sàng, thử lại sau';
  if (err && err.code === 'SDT_KHONG_HOP_LE') return 'SĐT của khách này không hợp lệ — kiểm tra lại số điện thoại';
  return (err && err.message) || LOI_MAC_DINH;
}
