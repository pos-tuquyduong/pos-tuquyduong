/**
 * KH-API-1 (C) — MỘT chỗ gửi mã đăng nhập App KH. Chế độ theo biến môi trường GUI_MA_KHACH, đọc LÚC GỌI:
 *   quay (mặc định) — không gửi đi đâu, khách lấy mã tại quầy (POST /api/pos/kh/cap-ma);
 *   gia — CHỈ cho bài thử: giữ mã cuối trong bộ nhớ, đọc bằng layMaGiaCuoi() (không có đường HTTP nào tới hàm này). Ngoài máy thử
 *   (laMayThu — Render) `gia` bị KHOÁ như giá trị lạ — lỡ đặt thì App báo "mã đã gửi" mà không tin nào đi.
 * Giá trị lạ → như quay + cảnh báo (chỉ in tên chế độ, KHÔNG in mã). KH-OTP-1 thêm chế độ `zns` ở ĐÚNG file này.
 */
const { laMayThu } = require('../ketNoiKho');

let maGiaCuoi = null;

function cheDo() {
  const v = process.env.GUI_MA_KHACH || 'quay';
  if (v === 'quay' || (v === 'gia' && laMayThu())) return v;
  console.warn(`GUI_MA_KHACH="${v}" không dùng được ở máy này — coi như "quay"`);
  return 'quay';
}

/** Chế độ hiện tại có gửi mã tới khách không (quay = không). */
function coKenhGui() {
  return cheDo() !== 'quay';
}

async function guiMaKhach(sdt, ma) {
  if (cheDo() === 'gia') maGiaCuoi = { sdt, ma };
}

module.exports = { guiMaKhach, coKenhGui, layMaGiaCuoi: () => maGiaCuoi };
