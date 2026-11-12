/**
 * UUDAI-1 — MỘT hàm quyết giảm hạng + giảm mã của một đơn (chủ quán chốt 26.10, DAC_TA_BAN_HANG_2410 mục 1.5–1.6).
 * Hàm thuần: không đọc DB, không đọc giờ. Tạo đơn, tinh-thu, phiên payOS đều đi qua taoDon (orders.js) → gọi đúng hàm này.
 * - Dùng chung: hạng tính trước, mã tính trên phần CÒN LẠI sau hạng (mã 1 món: trên giá đơn vị đã giảm hạng của món đó).
 * - Không dùng chung: tính hai cách (chỉ hạng / chỉ mã), lấy tổng THẤP hơn; bằng nhau → giữ hạng.
 */
const { computeItemDiscountAmount } = require('./itemScopeDiscount');

const inTien = (n) => `${Math.round(n).toLocaleString('vi-VN')}đ`;

/**
 * @param {object} p
 * @param {Array<{unit_price:number, quantity:number, ti_le_hang:number}>} p.dong  ti_le_hang đã kẹp 0–90; 0 = món không giảm hạng
 * @param {null|{loai:'percent'|'fixed', gia_tri:number, tran:number, mot_mon:number|null}} p.ma  mot_mon = chỉ số dòng được giảm 1 món
 * @param {boolean} p.dungChung  cài đặt của loại mã (quà đổi điểm: người gọi truyền true)
 * @param {number} [p.truTruoc]  giảm Flash đã trừ trước
 * VOUCHER-2 (chủ quán 08–12.11): dong[].khong_giam = dòng thẻ hạng / gói / nạp — mã và voucher KHÔNG tính trên dòng đó (luật 10.11);
 *   dong[].flash = giá Flash một đơn vị (nếu có). Voucher (luôn dùng chung với giá hạng, như quà đổi điểm trước đây) tính SAU mã chung:
 *   voucher TIỀN theo thứ tự gửi → MỘT voucher % trên phần còn lại; voucher có `dong` (chỉ số dòng — nhóm / món chọn) tính trên tiền các dòng đó;
 *   mỗi khoản ≤ phần món còn lại → tổng giảm ≤ tiền món thường. Voucher ship chỉ giảm phí giao, cộng dồn ≤ phiGiao.
 * @param {Array<{loai:'percent'|'fixed', gia_tri:number, tran:number, ship:boolean, dong:number[]|null}>} [p.vouchers]
 * @param {number} [p.phiGiao]
 * @returns {{ giam_hang:number, gia_hang:Array<number|null>, giam_ma:number, cach:'ca_hai'|'hang'|'ma'|'khong', loi_hon:number, cau_ghi:string,
 *   giam_voucher:number[], giam_ship:number }}  giam_voucher[i] = tiền voucher thứ i giảm (cùng thứ tự `vouchers`)
 */
function tinhUuDai({ dong, ma, dungChung, truTruoc = 0, tenHang = '', tenMa = '', vouchers = [], phiGiao = 0 }) {
  const tamTinh = dong.reduce((s, d) => s + (d.khong_giam ? 0 : d.unit_price * d.quantity), 0);
  const giaHangDong = dong.map((d) => (d.ti_le_hang > 0 ? Math.round(d.unit_price * (1 - d.ti_le_hang / 100)) : null));
  const giamHang = dong.reduce((s, d) => s + (d.ti_le_hang > 0 ? Math.round(d.unit_price * d.quantity * d.ti_le_hang / 100) : 0), 0);

  const tinhMa = (coHang) => {
    const conLai = Math.max(0, tamTinh - truTruoc - (coHang ? giamHang : 0));
    let g;
    if (ma.mot_mon != null) {
      const gia = coHang && giaHangDong[ma.mot_mon] != null ? giaHangDong[ma.mot_mon] : dong[ma.mot_mon].unit_price;
      g = computeItemDiscountAmount(ma.loai, ma.gia_tri, gia);
    } else if (ma.loai === 'percent') {
      g = Math.round(conLai * ma.gia_tri / 100);
      if (ma.tran > 0) g = Math.min(g, ma.tran);
    } else {
      g = Math.max(0, Number(ma.gia_tri) || 0);
    }
    return Math.min(g, conLai);
  };

  let cach, loiHon = 0;
  if (!ma) cach = giamHang > 0 ? 'hang' : 'khong';
  else if (giamHang === 0) cach = 'ma';
  else if (dungChung) cach = 'ca_hai';
  else {
    const chiMa = tinhMa(false);
    loiHon = Math.abs(chiMa - giamHang);
    cach = chiMa > giamHang ? 'ma' : 'hang';
  }
  const giam_hang = cach === 'hang' || cach === 'ca_hai' ? giamHang : 0;
  const giam_ma = cach === 'ma' || cach === 'ca_hai' ? tinhMa(cach === 'ca_hai') : 0;

  let cau_ghi = '';
  if (cach === 'ca_hai') cau_ghi = `Giá hạng ${tenHang} và mã ${tenMa} dùng chung`;
  else if (ma && giamHang > 0 && cach === 'ma') {
    cau_ghi = `Dùng mã ${tenMa} (giảm ${inTien(giam_ma)}) thay giá hạng ${tenHang} — lợi hơn ${inTien(loiHon)}`;
  } else if (ma && cach === 'hang') {
    cau_ghi = `Dùng giá hạng ${tenHang} (giảm ${inTien(giamHang)}), không dùng mã ${tenMa} — lợi hơn ${inTien(loiHon)}`;
  }
  const { giam_voucher, giam_ship } = tinhVoucher(dong, vouchers, Math.max(0, tamTinh - truTruoc - giam_hang - giam_ma), phiGiao,
    (i) => (dong[i].flash ?? (giam_hang > 0 && giaHangDong[i] != null ? giaHangDong[i] : dong[i].unit_price)) * dong[i].quantity);
  return { giam_hang, gia_hang: giam_hang > 0 ? giaHangDong : dong.map(() => null), giam_ma, cach, loi_hon: loiHon, cau_ghi, giam_voucher, giam_ship };
}

/** Phần voucher của tinhUuDai (thứ tự: tiền → % → ship). con = tiền món thường còn lại sau Flash / hạng / mã; giaDong(i) = tiền dòng i sau Flash / hạng. */
function tinhVoucher(dong, vouchers, con, phiGiao, giaDong) {
  const giam_voucher = vouchers.map(() => 0);
  const coSo = (v) => (v.dong ? Math.min(con, v.dong.reduce((s, i) => s + (dong[i].khong_giam ? 0 : giaDong(i)), 0)) : con);
  for (const loai of ['fixed', 'percent']) {
    vouchers.forEach((v, i) => {
      if (v.ship || v.loai !== loai) return;
      let g = loai === 'fixed' ? Math.max(0, Number(v.gia_tri) || 0) : Math.round(coSo(v) * v.gia_tri / 100);
      if (loai === 'percent' && v.tran > 0) g = Math.min(g, v.tran);
      g = Math.min(g, coSo(v));
      giam_voucher[i] = g;
      con -= g;
    });
  }
  let phi = Math.max(0, Number(phiGiao) || 0);
  vouchers.forEach((v, i) => {
    if (!v.ship) return;
    let g = v.loai === 'fixed' ? Math.max(0, Number(v.gia_tri) || 0) : Math.round(phiGiao * v.gia_tri / 100);
    if (v.loai === 'percent' && v.tran > 0) g = Math.min(g, v.tran);
    g = Math.min(g, phi);
    giam_voucher[i] = g;
    phi -= g;
  });
  return { giam_voucher, giam_ship: Math.max(0, Number(phiGiao) || 0) - phi };
}

module.exports = { tinhUuDai };
