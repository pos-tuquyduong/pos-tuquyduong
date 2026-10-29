/**
 * BanHang/tinh.js — phép tính THUẦN của màn Bán hàng mới (không React, không gọi máy chủ).
 * Bài thử: cong_cu/thu_BH1.js, cong_cu/thu_BH2.js. Tiền luôn do máy chủ quyết; ở đây chỉ để hiển thị và dựng thân yêu cầu.
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
export const duDuoc = (phaiTra, dua) => so(dua) >= so(phaiTra);   // phải trả 0đ (giảm hết) vẫn thu được, như màn cũ

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

/** Món có giá bán dùng được? 0 / âm / thiếu / chữ → "Chưa có giá", không chạm được. */
export const coGia = (sp) => typeof sp?.price === 'number' && sp.price > 0;

// ── Thêm vào giỏ / ghi chú ──────────────────────────────────────────────────
/** Trả chuỗi lỗi (tiếng Việt) hoặc null nếu thêm được. soDangCo = số lượng món này đã trong giỏ. */
export function kiemTraThem(sp, soDangCo, them = 1) {
  if (!coGia(sp)) return `${sp.name} chưa có giá bán`;
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

// ── Giá do máy chủ tính (POST /orders/tinh-thu) ─────────────────────────────
const chuanMa = (ma) => String(ma || '').trim().toUpperCase();

/** Khoá phần giỏ ảnh hưởng tiền: SĐT + tổng số lượng từng món + mã. Ghi chú / tách dòng KHÔNG đổi khoá → không gọi lại máy chủ. */
export function khoaTinh(gio, khach, ma) {
  const soLuong = {};
  for (const m of gio) soLuong[m.product_id] = (soLuong[m.product_id] || 0) + m.quantity;
  const mon = Object.keys(soLuong).sort((a, b) => a - b).map((id) => [Number(id), soLuong[id]]);
  return JSON.stringify({ sdt: khach?.phone || null, mon, ma: chuanMa(ma) });
}

/** Thân tinh-thu / phần `don` của phiên: CHỈ khách, món, mã — không trường tiền nào (máy chủ tự tra giá). */
export function thanTinhThu(gio, khach, ma) {
  return {
    customer_phone: khach?.phone || null,
    customer_name: khach?.name || 'Khách lẻ',
    items: gio.map((m) => ({
      product_id: m.product_id,
      sx_product_type: m.sx_product_type,
      sx_product_id: m.sx_product_id,
      quantity: m.quantity,
      from_package: false,
      note: m.note ? String(m.note).trim().slice(0, GHI_CHU_TOI_DA) : null,
    })),
    discount_code: chuanMa(ma) || null,
  };
}

/** Có số máy chủ cho ĐÚNG giỏ đang hiện? (số của giỏ cũ về muộn / chưa về → không thu). */
export const coSoMayChu = (mayChu, khoa) => !!mayChu && mayChu.khoa === khoa && Number.isFinite(mayChu.total);

// ── Chia tiền: tài khoản khách / mẹ / phần còn lại ──────────────────────────
export function chiaTra({ tong, khach, dungTK, dungMe }) {
  const t = Math.max(0, so(tong));
  const soDuDung = dungTK ? Math.min(Math.max(0, so(khach?.balance)), t) : 0;
  const soDuMeDung = dungMe ? Math.min(Math.max(0, so(khach?.parent_balance)), t - soDuDung) : 0;
  return { soDuDung, soDuMeDung, phaiTra: t - soDuDung - soDuMeDung };
}

/** Cách trả còn lại sau khi trừ tài khoản: còn phải trả → tiền mặt hoặc QR (không trộn); hết (kể cả đơn 0đ) → chỉ "tai_khoan". */
export const cachTraKhaDung = ({ phaiTra }) => (so(phaiTra) > 0 ? ['tien_mat', 'chuyen_khoan'] : ['tai_khoan']);

/** Nút thu sáng? Chưa có số máy chủ (coSo) thì KHÔNG bao giờ sáng. */
export function nutThuSang({ coSo, dangGui, cach, phaiTra, dua }) {
  if (!coSo || dangGui) return false;
  if (cach === 'tien_mat') return duDuoc(phaiTra, dua);
  if (cach === 'chuyen_khoan') return so(phaiTra) > 0;
  return cach === 'tai_khoan';
}

/** Thân POST /thanh-toan/phien. PIN chỉ gửi khi có trừ tài khoản (máy chủ kiểm PIN của CHỦ tài khoản bị trừ). */
export function thanPhien({ gio, khach, ma, cach, dungTK, dungMe, pin, pinMe }) {
  const don = thanTinhThu(gio, khach, ma);
  if (dungMe && khach?.parent_phone) don.parent_phone = khach.parent_phone;
  const than = { cach, don, tru_tai_khoan: !!dungTK, tru_tai_khoan_me: !!dungMe };
  if (dungTK) than.pin = pin;
  if (dungMe) than.pin_me = pinMe;
  return than;
}

// ── PIN khách ───────────────────────────────────────────────────────────────
export const DO_DAI_PIN = 4;

/** Lỗi PIN của máy chủ → việc màn phải làm. */
export function xuLyLoiPin(code) {
  if (code === 'PIN_SAI') return 'nhap_lai';
  if (code === 'PIN_DANG_KHOA') return 've_gio';
  if (code === 'CHUA_CO_PIN') return 'dat_pin';
  return 'loi';
}

/** Đặt PIN tại quầy (gõ 2 lần): trả mã lỗi (cùng mã máy chủ) hoặc null. */
export function datPinHopLe(pin, lai) {
  if (!/^\d{4}$/.test(String(pin ?? ''))) return 'PIN_KHONG_HOP_LE';
  return String(pin) === String(lai ?? '') ? null : 'PIN_KHONG_KHOP';
}

/** Bàn phím PIN: chữ số thêm tới tối đa 4, ⌫ xoá một, phím lạ bỏ qua. */
export function nhapPhim(hienTai, phim) {
  const cur = String(hienTai || '');
  if (phim === '⌫') return cur.slice(0, -1);
  return /^\d$/.test(phim) && cur.length < DO_DAI_PIN ? cur + phim : cur;
}

// ── QR payOS: đếm ngược theo het_han MÁY CHỦ trả, trạng thái phiên ───────────
const MUI_VN = '+07:00';   // het_han là giờ Việt Nam không hậu tố (getNow của máy chủ)

/** Số giây còn lại tới het_han (làm tròn lên, không âm); hạn lạ / rỗng → 0. */
export function conLaiGiay(hetHan, bayGioMs) {
  const m = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/.test(String(hetHan || '')) ? Date.parse(hetHan + MUI_VN) : NaN;
  if (!Number.isFinite(m)) return 0;
  return Math.max(0, Math.ceil((m - bayGioMs) / 1000));
}

export function dinhDangDemNguoc(giay) {
  const g = Math.max(0, Math.floor(so(giay)));
  return `${String(Math.floor(g / 60)).padStart(2, '0')}:${String(g % 60).padStart(2, '0')}`;
}

/** Trạng thái phiên máy chủ báo → việc màn phải làm: doi · xong (sang màn kết thúc) · nha (quay về giỏ). Lạ → doi. */
export function hanhDongPhien(trangThai) {
  if (trangThai === 'da_thu') return 'xong';
  return ['het_han', 'huy', 'loi'].includes(trangThai) ? 'nha' : 'doi';
}
