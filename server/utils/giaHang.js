/**
 * KH-API-2 (A) — MỘT hàm % hạng từng món + giá hạng một món. orders.js (tạo đơn, tinh-thu, phiên payOS) và /api/kh/menu cùng gọi.
 * Phép làm tròn giá hạng nằm ở tinhUuDai (uuDai.js) — ở đây GỌI hàm đó, không chép công thức.
 */
const { tinhUuDai } = require('./uuDai');

const HANG_TOI_DA = 90;

/** % giảm của hạng cho một món, đã kẹp 0–90. Kẹp là phòng vệ lớp 2 — Cài đặt đã chặn 0–90 lúc lưu, nhưng dữ liệu lỡ hỏng (nhập tay vào
 *  DB) cũng không để giá sau giảm thành ÂM. */
function tiLeHangMon(hang, laNhomDacBiet) {
  const tho = Number(laNhomDacBiet ? hang.special_discount_percent : hang.discount_percent) || 0;
  return Math.min(HANG_TOI_DA, Math.max(0, tho));
}

/** Giá MỘT ly sau giảm hạng — đúng số quầy ghi vào tier_unit_price. Không giảm được (0 %, hoặc tiền giảm làm tròn về 0) → giá gốc. */
function giaHangMon(gia, tiLe) {
  return tinhUuDai({ dong: [{ unit_price: gia, quantity: 1, ti_le_hang: tiLe }], ma: null, dungChung: false }).gia_hang[0] ?? gia;
}

/** Giá một món theo từng hạng `[{ hang_id, gia }]`; giá không phải số > 0 → []. */
function giaCacHang(gia, laNhomDacBiet, dsHang) {
  if (!(typeof gia === 'number' && gia > 0)) return [];
  return dsHang.map((h) => ({ hang_id: h.id, gia: giaHangMon(gia, tiLeHangMon(h, laNhomDacBiet)) }));
}

module.exports = { tiLeHangMon, giaHangMon, giaCacHang };
