/** GIO-VN-1 — chỗ DUY NHẤT của màn quầy đọc / tính / in ngày giờ: luôn theo giờ Việt Nam, không theo đồng hồ hay múi giờ của điện thoại
 *  (chủ quán 03.11: một múi giờ duy nhất). Máy chủ trả giờ VN `YYYY-MM-DDTHH:mm:ss` không hậu tố (getNow) — `new Date(chuỗi đó)` đọc theo
 *  múi của điện thoại, sai khi máy không đặt giờ VN. Bài thử cong_cu/thu_GIOVN1.js A3, G2, G3; phép quét G1 chặn chỗ khác trong client/src. */
const MUI = 'Asia/Ho_Chi_Minh';

/** Ngày "YYYY-MM-DD" theo giờ Việt Nam của thời điểm `d` (mặc định bây giờ). Không dùng toISOString() — đó là giờ UTC,
 *  từ 0 tới 7 giờ sáng ra ngày hôm qua. */
export function ngayVN(d = new Date()) {
  return d.toLocaleDateString('sv-SE', { timeZone: MUI });
}

/** Giờ máy chủ → Date. Không hậu tố = giờ VN (gắn +07:00); dấu cách của dữ liệu cũ đổi T; ngày thuần = 00:00 giờ VN;
 *  có Z / +hh:mm thì giữ nguyên; Date truyền vào trả lại chính nó. Rỗng / lạ → Date không hợp lệ. */
export function docGioVN(s) {
  if (s instanceof Date) return s;
  const t = String(s ?? '').trim().replace(' ', 'T');
  if (!t) return new Date(NaN);
  if (t.length > 10 && /(Z|[+-]\d\d:?\d\d)$/i.test(t)) return new Date(t);
  return new Date(t.length === 10 ? `${t}T00:00:00+07:00` : `${t}+07:00`);
}

function inVN(s, cach, tuy = {}) {
  const d = docGioVN(s);
  return Number.isNaN(d.getTime()) ? '' : d[cach]('vi-VN', { ...tuy, timeZone: MUI });
}
/** In ngày / giờ / ngày giờ theo giờ VN (tuỳ chọn như toLocale*String, múi luôn là giờ VN). Rỗng / lạ → "". */
export function hienNgay(s, tuy) { return inVN(s, 'toLocaleDateString', tuy); }
export function hienGio(s, tuy) { return inVN(s, 'toLocaleTimeString', tuy); }
export function hienNgayGio(s, tuy) { return inVN(s, 'toLocaleString', tuy); }

/** Cộng n ngày vào ngày lịch "YYYY-MM-DD" — phép trên lịch thuần, không múi giờ. */
export function congNgay(ngay, n) {
  const [y, m, d] = ngay.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** [từ ngày, tới ngày] của nút lọc nhanh Lịch sử đơn, tính từ hôm nay giờ VN: today · yesterday · 7days · thisMonth · lastMonth. */
export function khoangNgay(loai, homNay = ngayVN()) {
  const dauThang = homNay.slice(0, 8) + '01';
  switch (loai) {
    case 'yesterday': { const h = congNgay(homNay, -1); return [h, h]; }
    case '7days': return [congNgay(homNay, -6), homNay];
    case 'thisMonth': return [dauThang, homNay];
    case 'lastMonth': { const cuoi = congNgay(dauThang, -1); return [cuoi.slice(0, 8) + '01', cuoi]; }
    default: return [homNay, homNay];
  }
}
