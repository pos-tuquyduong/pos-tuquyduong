/**
 * inPhieu.js — dựng nội dung bộ in sau thanh toán: bill khách · tem cốc · phiếu pha chế (P16).
 *
 * HÀM THUẦN: đầu vào là đơn + cài đặt, đầu ra là danh sách trang cần in. Không chạm DOM, mạng, đồng hồ.
 * Phần vẽ nằm ở components/InPhieu.jsx. Bài thử: cong_cu/thu_P16.js (gọi thẳng file này).
 *
 * Đơn có hai nguồn, khác tên trường ghi chú — hàm xử lý cả hai:
 *   vừa tạo (POST /orders): `note`; đã lưu (GET /orders/:id): `notes`
 */

import { chuTem } from './hoaDon.js';

export const KHOA_BO_IN = 'invoice_print_set';
export const LOAI_IN = ['bill', 'tem', 'pha_che'];
export const NHAN_LOAI = { bill: 'Bill khách', tem: 'Tem cốc', pha_che: 'Phiếu pha chế' };
export const NHAN_NHOM = { juice: 'Nước ép', tea: 'Trà' };   // nhãn hiển thị; nhóm lạ hiện đúng mã của nó
export const KHO_BILL = ['58mm', '80mm', 'a5', 'a4'];
export const KHO_TEM = ['40x30'];
export const KHO_PHIEU = ['80mm', '58mm'];
export const SO_BAN_TOI_DA = 3;
export const TEM_TOI_DA_KY_TU = 40;   // DAC_TA mục 4: ước lượng, chưa in thử tem thật
const DON_KHONG_PHA = ['cancelled', 'refunded'];   // pos_orders.status đã huỷ (orders.js) / đã hoàn tiền (refunds.js)
const KHACH_LE = 'Khách lẻ';          // chuỗi máy chủ gán khi đơn không có tên (orders.js)

export const MAC_DINH_BO_IN = {
  bill: { bat: true, ban: 1, kho: 'a5' },   // khổ bill thiếu cài đặt → invoice_default_size (nếu hợp lệ) → khổ này
  tem: { bat: true, ban: 1, kho: KHO_TEM[0] },
  pha_che: { bat: true, ban: 1, kho: KHO_PHIEU[0] },
  khong_pha: [],                            // nhóm món KHÔNG phải đồ uống pha: không tem, không vào phiếu pha chế
  tu_mo: false,
};

const soBan = (v, macDinh) => {
  const n = Number(v);
  if (v === null || v === '' || !Number.isFinite(n)) return macDinh;
  return Math.min(SO_BAN_TOI_DA, Math.max(1, Math.floor(n)));
};
const chonKho = (v, ds, macDinh) => (ds.includes(v) ? v : macDinh);

/** Đọc cài đặt bộ in; thiếu / hỏng → mặc định. Luôn trả bản mới, không dùng chung với MAC_DINH_BO_IN. */
export function docBoIn(settings) {
  let luu = {};
  try {
    const x = JSON.parse(settings?.[KHOA_BO_IN] || '{}');
    if (x && typeof x === 'object') luu = x;
  } catch { /* JSON hỏng → mặc định */ }
  const D = MAC_DINH_BO_IN;
  const loai = (ten, dsKho, khoMacDinh) => ({
    bat: luu[ten]?.bat === undefined ? D[ten].bat : !!luu[ten].bat,
    ban: soBan(luu[ten]?.ban, D[ten].ban),
    kho: chonKho(luu[ten]?.kho, dsKho, khoMacDinh),
  });
  return {
    bill: loai('bill', KHO_BILL, chonKho(settings?.invoice_default_size, KHO_BILL, D.bill.kho)),
    tem: loai('tem', KHO_TEM, D.tem.kho),
    pha_che: loai('pha_che', KHO_PHIEU, D.pha_che.kho),
    khong_pha: Array.isArray(luu.khong_pha) ? luu.khong_pha.filter((g) => typeof g === 'string') : [],
    tu_mo: luu.tu_mo === undefined ? D.tu_mo : !!luu.tu_mo,
  };
}

const ghiChuMon = (m) => String(m.note ?? m.notes ?? '').trim();
const soLy = (m) => Math.max(0, Math.floor(Number(m.quantity)) || 0);
const cat = (s) => (s.length > TEM_TOI_DA_KY_TU ? s.slice(0, TEM_TOI_DA_KY_TU - 1) + '…' : s);
const gioHHmm = (s) => { const m = /(\d{1,2}):(\d{2})/.exec(String(s || '')); return m ? m[1].padStart(2, '0') + ':' + m[2] : ''; };
const rutGonMa = (code) => String(code || '').split('-').pop();

/** Món là đồ uống phải pha? Gói / thẻ: không. Nhóm bị tắt: không. Tra không ra nhóm: có (mặc định bật). */
function laMonPha(m, nhomTheoMa, cfg) {
  if (Number(m.product_id) < 0) return false;   // gói = -pkg.id, thẻ = -1000000 - tier.id (orders.js), cả đơn vừa tạo lẫn đã lưu
  const nhom = nhomTheoMa?.[m.product_code];
  return !(nhom && cfg.khong_pha.includes(nhom));
}

function khachTem(don) {
  const ten = String(don?.customer_name || '').trim();
  const sdt = String(don?.customer_phone || '').replace(/\D/g, '');
  return [ten && ten !== KHACH_LE ? ten : '', sdt ? sdt.slice(-4) : ''].filter(Boolean).join(' · ');
}

/**
 * Mỗi đơn vị ly một tem, "1/n"…"n/n" tính riêng từng dòng món.
 * HD-1: `settings` (tuỳ chọn) mang chữ dòng đầu / cuối tem (invoice_chu_tem_dau / tem_chan, tự điền {ten_khach}, ≤ 40 ký tự); không có → không dòng.
 */
export function dungTem(don, nhomTheoMa, cfg, inLai = false, settings = null) {
  const tem = [];
  const tenKhach = String(don?.customer_name || '').trim() === KHACH_LE ? '' : String(don?.customer_name || '').trim();
  const dau = settings ? chuTem(settings, 'tem_dau', tenKhach) : '';
  const chan = settings ? chuTem(settings, 'tem_chan', tenKhach) : '';
  for (const m of don?.items || []) {
    if (!laMonPha(m, nhomTheoMa, cfg)) continue;
    const n = soLy(m);
    for (let i = 1; i <= n; i++) {
      tem.push({
        kieu: 'tem', ten: cat(String(m.product_name || '')), ghiChu: cat(ghiChuMon(m)), khach: khachTem(don),
        ma: rutGonMa(don.code), gio: gioHHmm(don.created_at), stt: `${i}/${n}`, inLai, dau, chan,
      });
    }
  }
  return tem;
}

/** Gộp cùng món + cùng ghi chú; không giá tiền. */
export function dungPhieuPhaChe(don, nhomTheoMa, cfg, inLai = false) {
  const gop = new Map();
  for (const m of don?.items || []) {
    const sl = laMonPha(m, nhomTheoMa, cfg) ? soLy(m) : 0;
    if (!sl) continue;
    const ghiChu = ghiChuMon(m);
    const khoa = `${m.product_code || m.product_name}\u0000${ghiChu}`;
    const dong = gop.get(khoa) || { sl: 0, ten: String(m.product_name || ''), ghiChu };
    dong.sl += sl;
    gop.set(khoa, dong);
  }
  return { kieu: 'pha_che', ma: String(don?.code || ''), gio: gioHHmm(don?.created_at), dong: [...gop.values()], inLai };
}

/**
 * Danh sách việc in theo thứ tự bill → tem → phiếu pha chế: [{ loai, kho, inLai, trang[] }].
 * `trang` đã nhân số bản. `loai` (mảng) chọn loại thay cho cờ bật của cài đặt (màn In lại). Loại không có gì để in bị bỏ.
 */
export function dungBoIn(don, settings, { nhomTheoMa = {}, loai, inLai = false } = {}) {
  const cfg = docBoIn(settings);
  const viec = [];
  for (const ten of LOAI_IN) {
    if (loai ? !loai.includes(ten) : !cfg[ten].bat) continue;
    if (ten !== 'bill' && DON_KHONG_PHA.includes(don?.status)) continue;   // đơn huỷ / hoàn tiền: chỉ còn bill, tem + phiếu làm người pha pha thừa ly
    let moi;
    if (ten === 'bill') moi = [{ kieu: 'bill', inLai }];
    else if (ten === 'tem') moi = dungTem(don, nhomTheoMa, cfg, inLai, settings);
    else {
      const p = dungPhieuPhaChe(don, nhomTheoMa, cfg, inLai);
      moi = p.dong.length ? [p] : [];
    }
    const trang = Array.from({ length: cfg[ten].ban }, () => moi).flat();
    if (trang.length) viec.push({ loai: ten, kho: cfg[ten].kho, inLai, trang });
  }
  return viec;
}

// Đơn mẫu cho nút Xem trước ở Cài đặt hoá đơn
export const DON_MAU = {
  id: 0, code: 'ORD-20260101-001', created_at: '2026-01-01T09:30:00', created_by: 'Thu ngân',
  customer_name: 'Nguyễn Lan', customer_phone: '0912345678',
  items: [
    { product_id: 1, product_code: 'EP-CAM', product_name: 'Nước ép cam', unit: 'túi', quantity: 2, unit_price: 35000, note: 'Ít đường' },
    { product_id: 2, product_code: 'TRA-GUNG', product_name: 'Trà gừng', unit: 'gói', quantity: 1, unit_price: 30000, note: 'Không đá' },
  ],
  subtotal: 100000, total: 100000, payment_method: 'cash', cash_received: 100000, change_amount: 0,
};
export const NHOM_MAU = { 'EP-CAM': 'juice', 'TRA-GUNG': 'tea' };
