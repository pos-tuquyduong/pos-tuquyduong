/**
 * donAppDai.js — phép tính THUẦN của dải báo "Đơn App" (GIAO-DIEN-1 A): từ danh sách GET /kh/don-app ra số đơn mới, số dòng "vào ví",
 * đơn mới CŨ NHẤT bao nhiêu phút, và dòng chữ của dải. Cách đếm giữ đúng như nút nổi cũ: "mới" = đã trả chưa bấm "Đang làm".
 * `gio` là giờ Việt Nam không hậu tố (getNow máy chủ) — so với đồng hồ máy khách qua múi +07:00, không âm, giờ lạ → bỏ qua.
 */
const GIO_VN = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/;

export function tomDonApp(ds, bayGioMs) {
  const dong = Array.isArray(ds) ? ds : [];
  const moi = dong.filter((d) => d?.tien_trinh === 'da_tra');
  const phut = moi.filter((d) => GIO_VN.test(String(d.gio || ''))).map((d) => Math.max(0, Math.floor((bayGioMs - Date.parse(d.gio + '+07:00')) / 60000)));
  return {
    soMoi: moi.length,
    soViVe: dong.filter((d) => d?.tien_trinh === 'vao_vi').length,
    somNhatPhut: phut.length ? Math.max(...phut) : null,
  };
}

/** Không có đơn mới và không có tiền vào ví → dải không hiện gì. */
export const hienDai = (tom) => tom.soMoi > 0 || tom.soViVe > 0;

/** `rong`: màn đủ rộng mới nói "đơn sớm nhất X phút trước". */
export function chuDai(tom, rong) {
  const phan = [];
  if (tom.soMoi > 0) phan.push(`${tom.soMoi} đơn App mới`);
  if (tom.soViVe > 0) phan.push(`${tom.soViVe} vào ví`);
  if (rong && tom.soMoi > 0 && tom.somNhatPhut !== null) phan.push(`đơn sớm nhất ${tom.somNhatPhut} phút trước`);
  return phan.join(' · ');
}
