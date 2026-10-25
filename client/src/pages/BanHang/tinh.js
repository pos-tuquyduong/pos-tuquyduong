/**
 * BanHang/tinh.js — phép tính THUẦN của màn Bán hàng mới (không React, không gọi máy chủ).
 * Bài thử: cong_cu/thu_BH1.js. Tiền luôn do máy chủ quyết; ở đây chỉ để hiển thị và dựng payload đúng như Sales.jsx.
 */

export { ghiChuMacDinh } from './ghiChuMacDinh.js';

export const KHOA_CONG_TAC ='pos_man_ban_hang_moi';
export const KHOA_KIEU = 'pos_man_ban_hang_kieu';
export const KIEU_MAN = ['tudong', 'dienthoai', 'maytinhbang'];
export const NGUONG_DIEN_THOAI = 600;                       // hẹp HƠN số này (px) → hai trang Món ↔ Giỏ
export const TO_TIEN = [50000, 100000, 200000, 500000];
export const SO_NUT_TIEN_TOI_DA = 4;                        // "Đúng tiền" + các tờ lớn hơn
const HANG_TOI_DA = 90;                                     // khớp máy chủ (orders.js): không để giá âm
const GHI_CHU_TOI_DA = 200;

const so = (n) => (Number.isFinite(Number(n)) ? Number(n) : 0);

// ── Thu tiền mặt ────────────────────────────────────────────────────────────
export const traLai = (phaiTra, dua) => Math.max(0, so(dua) - so(phaiTra));
export const conThieu = (phaiTra, dua) => Math.max(0, so(phaiTra) - so(dua));
export const duDuoc = (phaiTra, dua) => so(phaiTra) > 0 && so(dua) >= so(phaiTra);

/** "Đúng tiền" + các tờ LỚN HƠN số phải trả, mỗi nút ghi sẵn trả lại. */
export function danhSachTo(phaiTra) {
  const can = so(phaiTra);
  if (can <= 0) return [];
  const dsTo = TO_TIEN.filter((t) => t > can).map((t) => ({ dua: t, traLai: t - can, dungTien: false }));
  return [{ dua: can, traLai: 0, dungTien: true }, ...dsTo].slice(0, SO_NUT_TIEN_TOI_DA);
}

// ── Công tắc theo máy ───────────────────────────────────────────────────────
/** Điện thoại / máy tính bảng. kieu lạ → Tự động. */
export function tachTrang(rong, kieu) {
  if (kieu === 'dienthoai') return 'hai-trang';
  if (kieu === 'maytinhbang') return 'hai-cot';
  return so(rong) < NGUONG_DIEN_THOAI ? 'hai-trang' : 'hai-cot';
}

/** kho = localStorage (hoặc giả). Hỏng / lạ → tắt + Tự động. Bật CHỈ khi đúng chuỗi '1'. */
export function docCongTac(kho) {
  try {
    const bat = kho.getItem(KHOA_CONG_TAC) === '1';
    const kieu = kho.getItem(KHOA_KIEU);
    return { bat, kieu: KIEU_MAN.includes(kieu) ? kieu : 'tudong' };
  } catch {
    return { bat: false, kieu: 'tudong' };
  }
}

export function ghiCongTac(kho, bat, kieu) {
  try {
    kho.setItem(KHOA_CONG_TAC, bat ? '1' : '0');
    kho.setItem(KHOA_KIEU, KIEU_MAN.includes(kieu) ? kieu : 'tudong');
  } catch { /* kho bị chặn: coi như không lưu được, máy vẫn bán bình thường */ }
}

// ── Giá hạng / giỏ (cùng cách Sales.jsx tính; máy chủ luôn tính lại) ─────────
/** % giảm của hạng cho một món; hạng không dùng được → 0. */
export function phanTramHang(hang, laNhomDacBiet) {
  if (!hang || !hang.usable) return 0;
  const tho = laNhomDacBiet ? hang.special_discount_percent : hang.discount_percent;
  return Math.min(HANG_TOI_DA, Math.max(0, so(tho)));
}

export function giaHang(giaGoc, phanTram) {
  const goc = so(giaGoc);
  const pt = Math.min(HANG_TOI_DA, Math.max(0, so(phanTram)));
  const hang = pt ? Math.round(goc * (1 - pt / 100)) : goc;
  return { goc, hang, coGiam: hang < goc };
}

const khoaMon = (m) => `${m.sx_product_type}_${m.sx_product_id}`;

/**
 * gio: [{ sx_product_type, sx_product_id, unit_price, quantity, is_special_group }]
 * ctx: { flash: {is_flash_now, percent, product_keys}, hang: {usable,…}, khachGiam: {loai:'percent'|'fixed', gia_tri} }
 */
export function tinhGio(gio, ctx = {}) {
  const { flash, hang, khachGiam } = ctx;
  const flashChay = !!(flash && flash.is_flash_now && flash.percent);
  const giaFlash = (m) => (flashChay && flash.product_keys?.includes(khoaMon(m))
    ? Math.round(m.unit_price * (1 - flash.percent / 100)) : null);
  const tamTinh = gio.reduce((s, m) => s + m.quantity * m.unit_price, 0);
  const giamFlash = gio.reduce((s, m) => { const g = giaFlash(m); return g == null ? s : s + (m.unit_price - g) * m.quantity; }, 0);
  const giaHangMon = (m) => (giamFlash > 0 ? m.unit_price : giaHang(m.unit_price, phanTramHang(hang, m.is_special_group)).hang);   // đơn dính Flash → hạng không cộng
  const giamHang = gio.reduce((s, m) => s + (m.unit_price - giaHangMon(m)) * m.quantity, 0);

  let giamKhach = 0;
  if (khachGiam && so(khachGiam.gia_tri) > 0) {
    giamKhach = khachGiam.loai === 'fixed' ? so(khachGiam.gia_tri) : (tamTinh * so(khachGiam.gia_tri)) / 100;
  }
  giamKhach = Math.min(giamKhach, Math.max(0, tamTinh - giamFlash - giamHang));
  const tong = Math.max(0, tamTinh - giamFlash - giamHang - giamKhach);
  const dong = gio.map((m) => ({ ...m, giaHang: giaHangMon(m), giaFlash: giaFlash(m) }));
  return { tamTinh, giamFlash, giamHang, giamKhach, tong, dong };
}

// ── Thêm vào giỏ / ghi chú ──────────────────────────────────────────────────
/** Trả chuỗi lỗi (tiếng Việt) hoặc null nếu thêm được. soDangCo = số lượng món này đã trong giỏ. */
export function kiemTraThem(sp, soDangCo, them = 1) {
  if (!(typeof sp.price === 'number' && sp.price > 0)) return `${sp.name} chưa có giá bán`;
  if (sp.khong_quan_kho) return null;
  if (sp.stock_quantity === 0) return `${sp.name} hiện hết hàng trong kho SX`;
  if (sp.stock_quantity > 0 && soDangCo + them > sp.stock_quantity) return `Không đủ hàng. Tồn kho: ${sp.stock_quantity}`;
  return null;
}

/** Nhãn đã chọn + ô tự gõ → một chuỗi ghi chú (bỏ trùng không phân biệt hoa thường, cắt 200 ký tự). */
export function ghepGhiChu(nhan, tuGo) {
  const dsTho = [...nhan, ...String(tuGo || '').split(',')].map((s) => s.trim()).filter(Boolean);
  const thay = new Set();
  const ds = dsTho.filter((s) => { const x = s.toLowerCase(); if (thay.has(x)) return false; thay.add(x); return true; });
  return ds.join(', ').slice(0, GHI_CHU_TOI_DA);
}

// ── Payload POST /orders — cùng khoá với orderData của Sales.jsx ─────────────
/**
 * cach: 'cash' | 'transfer' | 'balance'. soDuDung/soDuMeDung: số tiền trừ tài khoản (đã chặn ≤ tổng ở nơi gọi).
 * Đợt 1 không gói / thẻ / phí giao / mã giảm giá → các khoá đó giữ giá trị rỗng như Sales.jsx khi không dùng.
 */
export function dungDonHang({ gio, tamTinh, cach, khach, soDuDung = 0, soDuMeDung = 0, khachDua = 0 }) {
  const tong = tamTinh.tong;
  const conLai = tong - soDuDung - soDuMeDung;
  const coKhachGiam = so(khach?.discount_value) > 0 && tamTinh.giamKhach > 0;
  return {
    customer_phone: khach?.phone || null,
    customer_name: khach?.name || 'Khách lẻ',
    is_new_customer: khach?.isNew || false,
    items: gio.map((m) => ({
      product_id: m.product_id,
      sx_product_type: m.sx_product_type,
      sx_product_id: m.sx_product_id,
      quantity: m.quantity,
      from_package: false,
      note: m.note ? String(m.note).trim().slice(0, GHI_CHU_TOI_DA) : null,
    })),
    payment_method: cach,
    discount: 0,
    discount_reason: tamTinh.giamKhach > 0 ? 'Giảm giá' : null,
    discount_type: coKhachGiam ? (khach.discount_type || 'percent') : null,
    discount_value: coKhachGiam ? khach.discount_value : 0,
    discount_code: null,
    shipping_fee: 0,
    balance_amount: soDuDung,
    cash_amount: cach === 'cash' ? conLai : 0,
    transfer_amount: cach === 'transfer' ? conLai : 0,
    parent_phone: soDuMeDung > 0 ? khach?.parent_phone || null : null,
    parent_balance_amount: soDuMeDung,
    cash_received: cach === 'cash' ? so(khachDua) : 0,
    change_amount: cach === 'cash' ? traLai(conLai, khachDua) : 0,
    customer_package_id: null,
    package_buy: null,
    membership_buy: null,
  };
}
