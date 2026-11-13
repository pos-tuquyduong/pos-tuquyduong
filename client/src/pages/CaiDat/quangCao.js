// QC-APP-1 — hàm thuần của thẻ "Quảng cáo trên App" (có bài thử chạy thật: cong_cu/thu_QCAPP1.js). Máy chủ (server/routes/quang-cao.js) vẫn kiểm lại hết;
// đây chỉ để báo đỏ ngay dưới ô trước khi hỏi PIN. Hằng số khớp máy chủ — bài thử so hai bên bằng nhau.
export const GIOI_HAN = { chu_dai: 32, tieu_de: 40, phu: 80, chu_nut: 20, so_dong: 20 };

const MAU_GIO = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Số ký tự NHÌN THẤY: biểu tượng, chữ Việt gõ tổ hợp = 1. */
export function demKyTu(s) {
  const t = String(s ?? '');
  return typeof Intl !== 'undefined' && Intl.Segmenter
    ? Array.from(new Intl.Segmenter('vi', { granularity: 'grapheme' }).segment(t)).length
    : Array.from(t).length;
}

/** Số ký tự còn được gõ ở ô chữ dải (âm = quá). */
export const conLai = (s) => GIOI_HAN.chu_dai - demKyTu(s);

function laNgayThat(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

const trong = (v) => v === '' || v === null || v === undefined;

/** Danh sách dòng quảng cáo → { '<khoa>:<ô>': câu lỗi, chung?: câu lỗi }. Rỗng = hợp lệ. */
export function kiemDong(ds) {
  const l = {};
  if (ds.length > GIOI_HAN.so_dong) l.chung = `Tối đa ${GIOI_HAN.so_dong} dòng quảng cáo`;
  for (const d of ds) {
    const o = (truong, cau) => { if (!l[`${d.khoa}:${truong}`]) l[`${d.khoa}:${truong}`] = cau; };
    if (!String(d.chu_dai || '').trim()) o('chu_dai', 'Nhập chữ chạy trên dải');
    else if (demKyTu(String(d.chu_dai).trim()) > GIOI_HAN.chu_dai) o('chu_dai', `Chữ dải tối đa ${GIOI_HAN.chu_dai} ký tự`);
    for (const [t, ten] of [['tieu_de', 'Tiêu đề'], ['phu', 'Dòng phụ'], ['chu_nut', 'Chữ nút']]) {
      if (demKyTu(String(d[t] || '').trim()) > GIOI_HAN[t]) o(t, `${ten} tối đa ${GIOI_HAN[t]} ký tự`);
    }
    if (d.dich === 'mon' && trong(d.ma_mon)) o('ma_mon', 'Chọn món để mở');
    if (d.kieu_ngay === 'thu' && !(d.cac_thu || []).length) o('cac_thu', 'Chọn ít nhất một thứ trong tuần');
    if (d.kieu_ngay === 'khoang') {
      if (!laNgayThat(d.tu_ngay)) o('tu_ngay', 'Chọn ngày bắt đầu');
      else if (!laNgayThat(d.den_ngay)) o('den_ngay', 'Chọn ngày kết thúc');
      else if (d.den_ngay < d.tu_ngay) o('den_ngay', 'Ngày kết thúc phải từ ngày bắt đầu trở đi');
    }
    if (!(trong(d.tu_gio) && trong(d.den_gio))) {
      if (trong(d.tu_gio)) o('tu_gio', 'Nhập giờ bắt đầu (hoặc để trống cả hai ô giờ = cả ngày)');
      else if (trong(d.den_gio)) o('den_gio', 'Nhập giờ kết thúc (hoặc để trống cả hai ô giờ = cả ngày)');
      else if (!MAU_GIO.test(d.tu_gio)) o('tu_gio', 'Giờ bắt đầu phải dạng 08:30');
      else if (!MAU_GIO.test(d.den_gio)) o('den_gio', 'Giờ kết thúc phải dạng 17:00');
      else if (d.den_gio <= d.tu_gio) o('den_gio', 'Giờ kết thúc phải sau giờ bắt đầu (không vắt qua nửa đêm)');
    }
  }
  return l;
}
