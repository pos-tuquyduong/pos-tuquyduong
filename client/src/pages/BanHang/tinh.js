/**
 * BanHang/tinh.js — phép tính THUẦN của màn Bán hàng mới (không React, không gọi máy chủ).
 * Bài thử: cong_cu/thu_BH1.js, cong_cu/thu_BH2.js. Tiền luôn do máy chủ quyết; ở đây chỉ để hiển thị và dựng thân yêu cầu.
 */

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
export const duDuoc = (phaiTra, dua) => so(dua) >= so(phaiTra);   // phải trả 0đ (giảm hết) vẫn thu được

/** "Đúng tiền" + các tờ LỚN HƠN số phải trả, mỗi nút ghi sẵn trả lại. */
export function danhSachTo(phaiTra) {
  const can = so(phaiTra);
  if (can <= 0) return [];
  const dsTo = TO_TIEN.filter((t) => t > can).map((t) => ({ dua: t, traLai: t - can, dungTien: false }));
  return [{ dua: can, traLai: 0, dungTien: true }, ...dsTo].slice(0, SO_NUT_TIEN_TOI_DA);
}

// ── Kiểu bố cục theo máy ────────────────────────────────────────────────────
/** Điện thoại / máy tính bảng. kieu lạ → Tự động. */
export function tachTrang(rong, kieu) {
  if (kieu === 'dienthoai') return 'hai-trang';
  if (kieu === 'maytinhbang') return 'hai-cot';
  return so(rong) < NGUONG_DIEN_THOAI ? 'hai-trang' : 'hai-cot';
}

/** kho = localStorage (hoặc giả). Hỏng / thiếu / lạ → Tự động. */
export function docKieu(kho) {
  try {
    const kieu = kho.getItem(KHOA_KIEU);
    return KIEU_MAN.includes(kieu) ? kieu : 'tudong';
  } catch {
    return 'tudong';
  }
}

export function ghiKieu(kho, kieu) {
  try {
    kho.setItem(KHOA_KIEU, KIEU_MAN.includes(kieu) ? kieu : 'tudong');
  } catch { /* kho bị chặn: coi như không lưu được, máy vẫn bán bình thường */ }
}

// ── Giá hạng / giỏ (chỉ để hiển thị; máy chủ luôn tính lại) ──────────────────
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
 * ctx: { flash: {is_flash_now, percent, product_keys}, hang: {usable,…} } — KHACH-CK-1: không còn chiết khấu riêng của khách.
 */
export function tinhGio(gio, ctx = {}) {
  const { flash, hang } = ctx;
  const flashChay = !!(flash && flash.is_flash_now && flash.percent);
  const giaFlash = (m) => (flashChay && flash.product_keys?.includes(khoaMon(m))
    ? Math.round(m.unit_price * (1 - flash.percent / 100)) : null);
  const det = datDong(gio);   // TOPPING-1: topping là dòng riêng như máy chủ ghi (Flash / hạng theo chính topping)
  const tamTinh = det.reduce((s, m) => s + m.quantity * m.unit_price, 0);
  const giamFlash = det.reduce((s, m) => { const g = giaFlash(m); return g == null ? s : s + (m.unit_price - g) * m.quantity; }, 0);
  const giaHangMon = (m) => (giamFlash > 0 || m.goi_nap_id || m.the ? m.unit_price : giaHang(m.unit_price, phanTramHang(hang, m.is_special_group)).hang);   // đơn dính Flash / gói nạp (NAP-1) / dòng thẻ (QUAY-UI-1: máy chủ không giảm giá thẻ) → hạng không cộng
  const giamHang = det.reduce((s, m) => s + (m.unit_price - giaHangMon(m)) * m.quantity, 0);
  const tong = Math.max(0, tamTinh - giamFlash - giamHang);
  const dong = gio.map((m) => ({ ...m, giaHang: giaHangMon(m), giaFlash: giaFlash(m),
    topping: (m.topping || []).map((t) => ({ ...t, giaHang: giaHangMon(t) })) }));
  return { tamTinh, giamFlash, giamHang, tong, dong };
}

// ── TOPPING-1: topping + ghi chú nhanh theo từng món (cài ở Kho › Sản phẩm; máy chủ tự tra giá, ở đây chỉ hiện) ──
/** Dòng giỏ → các dòng máy chủ sẽ ghi: dòng món, rồi mỗi topping một dòng (số lượng = phần × số ly). */
export const datDong = (gio) => gio.flatMap((m) => [m, ...(m.topping || []).map((t) => ({ ...t, quantity: t.so_phan * m.quantity }))]);
/** Món có tuỳ chọn (topping hoặc ghi chú nhanh) → mở khung; không có → chạm là vào giỏ (DAC_TA 2410 mục 7). */
export const coTuyChon = (sp) => !!(sp?.topping?.length || sp?.ghi_chu_nhanh?.length);
/** Khoá gộp dòng: cùng món + cùng topping (cùng phần) + cùng ghi chú → gộp số ly; khác → dòng riêng. */
export const khoaGop = (m) => `${m.product_id}|${(m.topping || []).map((t) => `${t.product_id}x${t.so_phan}`).sort().join(',')}|${m.note || ''}`;
/** Phần topping `tpId` cả giỏ đang cần (topping trong ly × số ly + dòng bán riêng), bỏ dòng `boKey` (dòng đang sửa). */
export const tpCanTrongGio = (gio, tpId, boKey) => gio.reduce((s, m) => (m.key === boKey ? s
  : s + ((m.topping || []).find((t) => t.product_id === tpId)?.so_phan || 0) * m.quantity + (m.product_id === tpId ? m.quantity : 0)), 0);
/** Số dòng máy chủ trả cho giỏ (món + topping + thẻ) — so với `items` của tinh-thu để biết số đã về đúng giỏ chưa. */
export const soDongMayChu = (gio) => gio.reduce((s, m) => s + 1 + (m.the ? 0 : m.topping?.length || 0), 0);

/** Món có giá bán dùng được? 0 / âm / thiếu / chữ → "Chưa có giá", không chạm được. */
export const coGia = (sp) => typeof sp?.price === 'number' && sp.price > 0;

/** GIAO-DIEN-4 D1: nhãn tồn góc thẻ món — chỉ ĐỌC hai trường món đã có (khong_quan_kho, stock_quantity), không tính gì thêm.
 *  Không quản kho → "Pha ngay"; tồn 0 → "Hết"; còn n → "Còn n"; không có số tồn → rỗng (không bịa "Hết"). Khớp điều kiện `het` ở BanHangMoi (quản kho + tồn === 0). */
export function nhanTon(sp) {
  if (sp?.khong_quan_kho) return 'Pha ngay';
  const n = sp?.stock_quantity;
  if (typeof n !== 'number' || !Number.isFinite(n)) return '';
  return n === 0 ? 'Hết' : n > 0 ? `Còn ${n}` : '';
}

// ── Thêm vào giỏ / ghi chú ──────────────────────────────────────────────────
/** Trả chuỗi lỗi (tiếng Việt) hoặc null nếu thêm được. soDangCo = số lượng món này đã trong giỏ. */
export function kiemTraThem(sp, soDangCo, them = 1) {
  if (!coGia(sp)) return `${sp.name} chưa có giá bán`;
  if (sp.chua_cong_thuc) return `${sp.name} chưa có công thức — chưa bán được`;   // KHO-3a B3
  if (sp.khong_quan_kho) return null;
  if (sp.stock_quantity === 0) return `${sp.name} hiện hết hàng`;
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
export function khoaTinh(gio, khach, ma, giao = null, vouchers = []) {
  const soLuong = {};
  for (const m of gio) soLuong[m.product_id] = (soLuong[m.product_id] || 0) + m.quantity;
  const mon = Object.keys(soLuong).sort((a, b) => a - b).map((id) => [Number(id), soLuong[id]]);
  const the = layThe(gio);   // QUAY-UI-1: cùng hạng khác số tháng = giá khác → đổi khoá
  const tp = gio.filter((m) => m.topping?.length).map((m) => [m.product_id, m.quantity, (m.topping || []).map((t) => [t.product_id, t.so_phan])]);   // TOPPING-1
  return JSON.stringify({ sdt: khach?.phone || null, mon, ma: chuanMa(ma), ...(giao ? { giao: giao.ma_bao_phi } : {}), ...(the ? { the: [the.the.tier_id, the.the.so_thang] } : {}),
    ...(tp.length ? { tp } : {}),   // chỉ khi có — giỏ không topping giữ khoá cũ
    ...(vouchers.length ? { vc: vouchers } : {}) });   // NAP-1: gói nạp nằm trong `mon` (product_id −2000000 − mã gói). VOUCHER-2: chọn / bỏ voucher → hỏi lại
}
/** VOUCHER-2: voucher máy chủ báo không dùng được (tinh-thu voucher_loi[]) → bỏ khỏi danh sách chọn (đơn KHÔNG gửi voucher hỏng — POST sẽ 400)
 *  + lý do theo mã để chip viền đỏ. → { chon, loi: { MÃ: lời máy chủ } } */
export function boVoucherLoi(chon, voucherLoi = []) {
  const loi = Object.fromEntries((voucherLoi || []).map((x) => [x.ma, x.error]));
  return { chon: chon.filter((m) => !(m in loi)), loi };
}
/** NAP-1: dòng gói nạp trong giỏ (giỏ nạp chỉ có đúng một dòng này) hoặc null. */
export const layGoiNap = (gio) => gio.find((m) => m.goi_nap_id) || null;
/** NAP-1: chạm gói nạp → lỗi (chuỗi) hoặc null. Chưa chọn khách → báo chọn khách; giỏ đang có món → nạp làm đơn riêng. */
export function kiemTraNap(gio, khach) {
  if (!khach?.phone) return 'Chọn khách trước khi nạp tiền';
  if (gio.some((m) => !m.goi_nap_id)) return 'Nạp tiền làm đơn riêng — thu xong giỏ món (hoặc xoá giỏ) rồi nạp';
  return null;
}

// ── Thẻ thành viên (QUAY-UI-1): bán như một dòng giỏ; máy chủ tự tra giá gói (orders.js membership_buy) ──
/** Dòng thẻ trong giỏ (tối đa một) hoặc null. */
export const layThe = (gio) => gio.find((m) => m.the) || null;
/** Gói đang bán của các hạng `ban` (gói bật, giá nguyên > 0 — cùng vị từ máy chủ goiBanDuoc), xếp theo hạng rồi số tháng. */
export const dsGoiThe = (dsHang) => dsHang.filter((t) => t.cach_co === 'ban').flatMap((tier) => (tier.goi || [])
  .filter((g) => g.bat === true && Number.isInteger(g.gia) && g.gia > 0).sort((a, b) => a.so_thang - b.so_thang)
  .map((g) => ({ tier, so_thang: g.so_thang, gia: g.gia })));
/** Hạng chỉ chủ quán cấp (`chi_cap` — CACH_CO của server/routes/tiers.js) — hiện mờ, không bán. */
export const hangChiCap = (dsHang) => dsHang.filter((t) => t.cach_co === 'chi_cap');
/** Máy chủ đẩy dòng thẻ CUỐI `items` (orders.js) — vị trí dòng máy chủ ứng với từng dòng giỏ (món theo thứ tự giỏ, thẻ sau cùng). */
export function viTriMayChu(gio) {
  const viTriMon = [];
  let vt = 0;
  for (const m of gio) if (!m.the) { viTriMon.push(vt); vt += 1 + (m.topping?.length || 0); }   // TOPPING-1: dòng topping đứng ngay sau dòng món
  let mon = 0, the = 0;
  return gio.map((m) => (m.the ? vt + the++ : viTriMon[mon++]));
}
/** Dòng giỏ cho một gói thẻ. Giá chỉ để hiện — thân gửi máy chủ KHÔNG mang giá (thanTinhThu). */
export const dongThe = (tier, goi) => ({ key: `the_${tier.id}_${goi.so_thang}`, product_id: -1000000 - tier.id,
  product_name: `Thẻ ${tier.name} · ${goi.so_thang} tháng`, unit_price: goi.gia, quantity: 1, note: '', the: { tier_id: tier.id, so_thang: goi.so_thang } });
/** Chạm gói thẻ → lỗi (chuỗi) hoặc null. hang = trạng thái hạng của khách đang chọn ({ usable, thu_bac, tier_name }). Máy chủ vẫn kiểm lại. */
export function kiemTraThe(gio, khach, hang, tier) {
  if (!khach?.phone) return 'Chọn khách trước khi bán thẻ thành viên';
  if (tier.cach_co !== 'ban') return `Hạng ${tier.name}: Chủ quán cấp — không bán ở quầy`;
  if (layGoiNap(gio)) return 'Giỏ đang là gói nạp — thu xong hoặc xoá giỏ rồi mới bán thẻ';
  if (layThe(gio)) return 'Giỏ đã có một thẻ thành viên — xoá thẻ cũ trước nếu muốn đổi';
  if (hang?.usable && Number(hang.thu_bac) > Number(tier.sort_order)) return `Khách đang có hạng ${hang.tier_name} cao hơn — không bán hạng ${tier.name}`;
  return null;
}

/** Thân tinh-thu / phần `don` của phiên: CHỈ khách, món, mã — không trường tiền nào (máy chủ tự tra giá).
 *  GIAO-1: `giao` = { ma_bao_phi, ten, sdt, ghi_chu } — phí ship máy chủ lấy từ báo phí, màn hình không gửi số phí. */
export function thanTinhThu(gio, khach, ma, giao = null, vouchers = []) {
  const nap = layGoiNap(gio);   // NAP-1: giỏ nạp — đơn riêng, không giao
  if (nap) return { customer_phone: khach?.phone || null, customer_name: khach?.name || 'Khách lẻ', items: [], goi_nap_id: nap.goi_nap_id };
  const the = layThe(gio);   // QUAY-UI-1: thẻ đi bằng membership_buy, không nằm trong items
  return {
    ...(giao ? { giao } : {}),
    ...(the ? { membership_buy: { tier_id: the.the.tier_id, so_thang: the.the.so_thang } } : {}),
    customer_phone: khach?.phone || null,
    customer_name: khach?.name || 'Khách lẻ',
    items: gio.filter((m) => !m.the).map((m) => ({
      product_id: m.product_id,
      sx_product_type: m.sx_product_type,
      sx_product_id: m.sx_product_id,
      quantity: m.quantity,
      from_package: false,
      note: m.note ? String(m.note).trim().slice(0, GHI_CHU_TOI_DA) : null,
      ...(m.topping?.length ? { topping: m.topping.map((t) => ({ product_id: t.product_id, sx_product_type: t.sx_product_type, sx_product_id: t.sx_product_id,
        so_phan: t.so_phan })) } : {}),   // TOPPING-1: không gửi giá — máy chủ tự tra
    })),
    discount_code: chuanMa(ma) || null,
    ...(vouchers.length ? { vouchers } : {}),   // VOUCHER-2: chỉ khi có chọn — giỏ không voucher gửi thân y cũ
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

/** QUAY-UI-1: cách trả mặc định — KHÔNG tự trừ tài khoản dù khách có số dư; chỉ bấm "Trừ tài khoản" mới trừ. */
export const CACH_TRA_MAC_DINH = 'tien_mat';
/** Nút "Trừ tài khoản" mờ → lý do (chuỗi); bấm được → null. Đơn nạp chỉ tiền mặt / chuyển khoản (NAP-1). */
export function lyDoKhongTru({ khach, laNap, laThe = false }) {
  if (laNap) return 'Đơn nạp chỉ trả tiền mặt hoặc chuyển khoản';
  if (laThe) return 'Thẻ hội viên chỉ trả tiền mặt hoặc chuyển khoản';   // KH-NAP-1 (chủ quán 14.11) — máy chủ chặn THE_KHONG_TRA_VI
  if (!khach) return 'Chọn khách để trừ tài khoản';
  if (so(khach.balance) + so(khach.parent_balance) <= 0) return 'Khách chưa có số dư';
  return null;
}

/** Cách trả còn lại sau khi trừ tài khoản: còn phải trả → tiền mặt hoặc QR (không trộn); hết (kể cả đơn 0đ) → chỉ "tai_khoan". */
export const cachTraKhaDung = ({ phaiTra }) => (so(phaiTra) > 0 ? ['tien_mat', 'chuyen_khoan'] : ['tai_khoan']);

/** KET-NOI-1 E1: khối nút thu vẽ nhánh nào — 'cho' (chưa có số máy chủ cho đúng giỏ: KHÔNG vẽ nút, kể cả "Đơn 0đ") · 'het' (máy chủ tính ra 0) · 'tra'. */
export function nhanhNutThu({ coSo, phaiTra }) {
  if (!coSo) return 'cho';
  return so(phaiTra) <= 0 ? 'het' : 'tra';
}

/** Nút thu sáng? Chưa có số máy chủ (coSo) thì KHÔNG bao giờ sáng. */
export function nutThuSang({ coSo, dangGui, cach, phaiTra, dua }) {
  if (!coSo || dangGui) return false;
  if (cach === 'tien_mat') return duDuoc(phaiTra, dua);
  if (cach === 'chuyen_khoan') return so(phaiTra) > 0;
  return cach === 'tai_khoan';
}

/** Thân POST /thanh-toan/phien. PIN chỉ gửi khi có trừ tài khoản (máy chủ kiểm PIN của CHỦ tài khoản bị trừ). */
export function thanPhien({ gio, khach, ma, cach, dungTK, dungMe, pin, pinMe, giao = null, vouchers = [], maGui }) {
  const don = thanTinhThu(gio, khach, ma, giao, vouchers);
  if (dungMe && khach?.parent_phone) don.parent_phone = khach.parent_phone;
  const than = { cach, don, tru_tai_khoan: !!dungTK, tru_tai_khoan_me: !!dungMe };
  if (maGui) than.ma_gui = maGui;   // KET-NOI-1 B1: mã lượt bấm — gửi lại cùng mã ra đúng phiên đã tạo
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

/** KHO-3a B3c: câu báo khi phiên QR thôi giữ. Hỏng vì HẾT HÀNG (máy chủ trả het_hang) — tiền khách đã chuyển, KHÔNG phải "đã huỷ": nói rõ đã hoàn vào
 *  ví khách hay phải hoàn tay. Còn lại: hết hạn / đã huỷ như cũ. */
/** KHO-3a (soát vòng 4): phiên hết hàng mà máy chủ CHƯA ghi dòng hoàn (khe giữa câu đóng phiên và câu ghi hoàn) → màn QR hỏi thêm vài lượt
 *  trước khi chốt câu (SO_LUOT_CHO_HOAN trong ManQr) — không để thu ngân đọc "CHƯA hoàn" rồi trả tiền mặt trong khi ví sắp được cộng. */
export const choDongHoan = (p) => !!p?.het_hang && !p.het_hang.vao_vi && !p.het_hang.hoan_tay;

export function cauNhaPhien(p) {
  const h = p?.het_hang;
  if (h) {   // máy chủ tra dòng hoàn THẬT (vao_vi / hoan_tay) — không suy từ việc có SĐT
    const tien = Number(h.so_tien || 0).toLocaleString('vi-VN') + 'đ';
    const sau = h.vao_vi ? `đã hoàn vào ví khách${h.sdt ? ' ' + h.sdt : ''}: ${tien}`
      : h.hoan_tay ? `— khách chưa có tài khoản: HOÀN TIỀN TAY ${tien} cho khách`
        : `${tien} CHƯA hoàn tự động — xem Đối soát trước khi trả khách`;
    return `⛔ Hết ${h.mon} — KHÔNG tạo đơn. Tiền khách đã chuyển ${sau}.`;
  }
  return p?.trang_thai === 'het_han' ? 'QR đã hết hạn — chưa nhận được tiền. Giỏ còn nguyên.' : 'Đã huỷ chuyển khoản. Giỏ còn nguyên.';
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

// ── KET-NOI-1: mất kết nối khi thu / khi hỏi giá ─────────────────────────────
/** B5 — MỘT chỗ dựng câu: hết lượt gửi lại mà vẫn không biết máy chủ đã ghi chưa. */
export const CAU_CHUA_BIET_DON = 'Mất kết nối — chưa biết đơn đã ghi chưa. Đừng thu lại: mở Đơn hàng kiểm đơn mới nhất.';
const laMatKetNoi = (e) => ['MAT_KET_NOI', 'KHO_MAT_KET_NOI'].includes(e?.code);   // api.js đã gửi lại hết lượt
// Tạo phiên hỏng mà máy chủ có thể đã ghi: mất kết nối, hoặc phiên QR còn đang tạo (DANG_XU_LY hết lượt — bấm lại ra mã mới = phiên thứ hai).
const chuaBietDaGhi = (e) => laMatKetNoi(e) || e?.code === 'DANG_XU_LY';
/** E2: lời dưới giỏ khi hỏi giá hỏng — mất kết nối thì câu ngắn (không chữ kỹ thuật); lỗi nghiệp vụ giữ lời máy chủ. */
export const loiTinhGia = (e) => (laMatKetNoi(e) ? 'Mất kết nối, bấm Thử lại' : e?.message || 'Không tính được giá');
/** Thu hỏng (api.js đã gửi lại hết lượt) → việc màn phải làm: { viec, phien }. phienId: phiên đã tạo (hỏng ở chốt) hoặc null (hỏng lúc tạo);
 *  hoi(id) → phiên máy chủ / ném; huy(id) → nhả phiên / ném (409 = phiên không còn chờ). Không biết máy chủ đã ghi chưa → KHÔNG nhả, bao_chua_biet.
 *  Phiên còn chờ ('cho') mới huỷ; huỷ bị từ chối (lệnh chốt trước còn chạy ở máy chủ và vừa ghi xong — soát vòng 1) → hỏi lại: đã thu → xong,
 *  không thì bao_chua_biet. Phiên đã thôi giữ (loi / huy / het_han — vd chốt hỏng vì đơn) → bao_loi, không huỷ (soát vòng 2).
 *  viec: xong (sang màn kết thúc) · bao_chua_biet (câu B5) · bao_loi (đã nhả hoặc lỗi lúc tạo — báo lời máy chủ). */
export async function xuLyThuHong({ loi, phienId, hoi, huy }) {
  if (!phienId) return { viec: chuaBietDaGhi(loi) ? 'bao_chua_biet' : 'bao_loi' };
  const daThu = async () => { const p = await hoi(phienId).catch(() => null); return { p, xong: hanhDongPhien(p?.trang_thai) === 'xong' }; };
  const lan1 = await daThu();
  if (lan1.xong) return { viec: 'xong', phien: lan1.p };
  if (!lan1.p) return { viec: 'bao_chua_biet' };
  if (hanhDongPhien(lan1.p.trang_thai) === 'nha') return { viec: 'bao_loi' };   // loi / huy / het_han: máy chủ đã thôi giữ — báo lời máy chủ (như cũ)
  if (await huy(phienId).then(() => true, () => false)) return { viec: 'bao_loi' };
  const lan2 = await daThu();
  return lan2.xong ? { viec: 'xong', phien: lan2.p } : { viec: 'bao_chua_biet' };
}
