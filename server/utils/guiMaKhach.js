/**
 * KH-API-1 (C) — MỘT chỗ gửi mã đăng nhập App KH. Chế độ theo biến môi trường GUI_MA_KHACH, đọc LÚC GỌI:
 *   quay (mặc định) — không gửi đi đâu, khách lấy mã tại quầy (POST /api/pos/kh/cap-ma);
 *   gia — CHỈ cho bài thử: giữ mã cuối trong bộ nhớ, đọc bằng layMaGiaCuoi() (không có đường HTTP nào tới hàm này).
 * Giá trị lạ → như quay + cảnh báo (chỉ in tên chế độ, KHÔNG in mã). KH-OTP-1 thêm chế độ `zns` ở ĐÚNG file này.
 */
const CHE_DO = ['quay', 'gia'];
let maGiaCuoi = null;

function cheDo() {
  const v = process.env.GUI_MA_KHACH || 'quay';
  if (CHE_DO.includes(v)) return v;
  console.warn(`GUI_MA_KHACH="${v}" không hợp lệ — coi như "quay"`);
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
