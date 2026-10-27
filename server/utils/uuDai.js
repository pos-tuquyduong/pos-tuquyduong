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
 * @returns {{ giam_hang:number, gia_hang:Array<number|null>, giam_ma:number, cach:'ca_hai'|'hang'|'ma'|'khong', loi_hon:number, cau_ghi:string }}
 */
function tinhUuDai({ dong, ma, dungChung, truTruoc = 0, tenHang = '', tenMa = '' }) {
  const tamTinh = dong.reduce((s, d) => s + d.unit_price * d.quantity, 0);
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
  return { giam_hang, gia_hang: giam_hang > 0 ? giaHangDong : dong.map(() => null), giam_ma, cach, loi_hon: loiHon, cau_ghi };
}

module.exports = { tinhUuDai };
