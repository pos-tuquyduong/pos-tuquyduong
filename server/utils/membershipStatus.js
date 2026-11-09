/**
 * Hạng thành viên — trạng thái dùng chung (TIER-1c/TIER-2, HANG-1).
 * MỘT NGUỒN cho quầy (membership.js, orders.js — giá hạng + chặn bán hạng thấp hơn), App KH (kh/index.js), danh sách khách (customers-v2.js),
 * xoá hạng (tiers.js) → không nơi nào tính khác nhau.
 *
 * Sổ pos_membership_purchases CHỈ THÊM DÒNG (huỷ / xoá đơn mua thẻ xoá đúng dòng của đơn đó — P26c). Hạn KHÔNG lưu sẵn mà cộng lại
 * từ sổ mỗi lần đọc (HANG-1, kế hoạch mục 2): mua cộng nối, huỷ đơn ở giữa, hai quầy cùng bán đều tự ra đúng.
 *   loai 'ban' (so_thang): hạn = (hạn đang còn nếu > lúc mua, không thì lúc mua) + số tháng — CỘNG NỐI;
 *              dòng cũ không so_thang: hạn = lớn hơn của hạn đang có và expires_at đã ghi.
 *   loai 'cap': hạn = lúc cấp + số tháng (ĐẶT LẠI), so_thang NULL = không thời hạn (HAN_VO_HAN).
 *   loai 'thu_hoi': hạng đó hết.
 * Hạng hiện tại = hạng có THỨ BẬC (sort_order) CAO NHẤT còn hạn; hạng trên hết hạn → tự về hạng dưới.
 * Giờ = chuỗi giờ VN `YYYY-MM-DDTHH:mm:ss` (GIO-VN-1) — so chuỗi, cộng tháng bằng phép UTC (không theo múi giờ máy).
 */
const { addMonthsSafe } = require('./helpers');
const { ID_NAP_TU } = require('./viKhach');

const HAN_VO_HAN = '9999-12-31T23:59:59';   // cột expires_at NOT NULL — vô hạn ghi bằng hằng này; mọi chỗ trả ra đổi thành null
const NGAY_MS = 24 * 60 * 60 * 1000;
const SAP_HET_NGAY = 7;
// Dòng hàng thẻ hạng của đơn (orders.js: product_id = −1000000 − mã hạng; dải gói ở trên, dải nạp từ ID_NAP_TU trở xuống — cùng dải I15).
const ID_THE_TU = -1000000;
const laDongThe = (productId) => Number(productId) <= ID_THE_TU && Number(productId) > ID_NAP_TU;

const gio = (s) => String(s || '').replace(' ', 'T').slice(0, 19);
const congThang = (tu, n) => addMonthsSafe(new Date(gio(tu) + 'Z'), n).toISOString().slice(0, 19);

/** Gói của hạng (cột JSON `goi`) — hỏng / không phải mảng → []. */
function docGoi(s) {
  try { const a = JSON.parse(s || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
}

/** MỘT vị từ "gói bán được": hạng `ban`, gói bật, giá nguyên > 0 — bán ở quầy (orders.js) và App KH /hang (kh/index.js) cùng gọi. */
function goiBanDuoc(hang) {
  if (!hang || hang.cach_co !== 'ban') return [];
  return docGoi(hang.goi).filter((g) => g.bat === true && Number.isInteger(g.gia) && g.gia > 0).sort((a, b) => a.so_thang - b.so_thang);
}

/** Hạn từng hạng sau khi đi hết sổ của MỘT khách (dòng xếp purchased_at, id). Map tier_id → { han | null, ten }. */
function hanCacHang(dong) {
  const han = new Map();
  for (const d of dong) {
    const id = Number(d.tier_id);
    const cu = han.get(id)?.han ?? null;
    const luc = gio(d.purchased_at);
    let moi;
    if (d.loai === 'thu_hoi') moi = null;
    else if (d.loai === 'cap') moi = d.so_thang == null ? HAN_VO_HAN : congThang(luc, Number(d.so_thang));
    else if (cu === HAN_VO_HAN) moi = cu;
    else if (d.so_thang != null) moi = congThang(cu && cu > luc ? cu : luc, Number(d.so_thang));
    else moi = cu && cu > gio(d.expires_at) ? cu : gio(d.expires_at);
    han.set(id, { han: moi, ten: d.tier_name });
  }
  return han;
}

/** Hàm thuần: sổ của MỘT khách + mọi hạng (cả hạng đã tắt) + bây giờ → trạng thái hạng. */
function tinhHang(dong, dsHang, bayGio) {
  const khong = { tier_id: null, tier_name: null, status: 'none' };
  const bac = new Map(dsHang.map((h) => [Number(h.id), Number(h.sort_order) || 0]));
  const now = gio(bayGio);
  let dung = null, het = null;
  for (const [id, { han, ten }] of hanCacHang(dong)) {
    if (han === null) continue;
    const x = { id, ten, han, bac: bac.get(id) ?? 0 };
    if (han > now) { if (!dung || x.bac > dung.bac) dung = x; } else if (!het || han > het.han) het = x;
  }
  const x = dung || het;
  if (!x) return khong;
  const voHan = x.han === HAN_VO_HAN;
  const ngay = voHan ? null : Math.ceil((Date.parse(x.han + 'Z') - Date.parse(now + 'Z')) / NGAY_MS);
  const status = !dung ? 'expired' : !voHan && ngay <= SAP_HET_NGAY ? 'expiring_soon' : 'active';
  return { tier_id: x.id, tier_name: x.ten, expires_at: voHan ? null : x.han, days_remaining: ngay, status, vo_han: voHan, thu_bac: x.bac };
}

const SO_CUA = 'SELECT * FROM pos_membership_purchases WHERE customer_phone = ? ORDER BY purchased_at, id';
const HANG = 'SELECT id, sort_order FROM pos_membership_tiers';

async function getMembershipStatus(query, queryOne, getNow, phone) {
  const dong = await query(SO_CUA, [phone]);
  return tinhHang(dong, await query(HANG), getNow());
}

/** Trạng thái hạng của MỌI khách có hạng (còn hoặc đã hết) — 2 câu đọc, cùng tinhHang (danh sách khách). { sdt: trạng thái }; khách bị thu
 *  hồi hết hạng ('none') không có mặt — danh sách hiện "-" như khách chưa từng có hạng. */
async function hangNhieuKhach(query, getNow) {
  const dong = await query('SELECT * FROM pos_membership_purchases ORDER BY customer_phone, purchased_at, id');
  const dsHang = await query(HANG);
  const theoSdt = new Map();
  for (const d of dong) {
    if (!theoSdt.has(d.customer_phone)) theoSdt.set(d.customer_phone, []);
    theoSdt.get(d.customer_phone).push(d);
  }
  const now = getNow();
  return Object.fromEntries([...theoSdt].map(([sdt, ds]) => [sdt, tinhHang(ds, dsHang, now)]).filter(([, m]) => m.status !== 'none'));
}

/** Số khách đang GIỮ hạng `tierId` còn hạn — kể cả khi hạng đó không phải hạng hiện tại (khách có hạng cao hơn): hạng trên hết hạn / bị thu
 *  hồi thì khách quay về hạng này (soát HANG-1 vòng 1). Cùng hanCacHang; hạn mỗi hạng chỉ phụ thuộc dòng của chính hạng đó. */
async function soKhachGiuHang(query, getNow, tierId) {
  const dong = await query('SELECT * FROM pos_membership_purchases WHERE tier_id = ? ORDER BY customer_phone, purchased_at, id', [tierId]);
  const theoSdt = new Map();
  for (const d of dong) theoSdt.set(d.customer_phone, [...(theoSdt.get(d.customer_phone) || []), d]);
  const now = gio(getNow());
  return [...theoSdt.values()].filter((ds) => (hanCacHang(ds).get(Number(tierId))?.han ?? '') > now).length;
}

/** Hạn của hạng `tierId` ngay sau dòng sắp ghi (cột expires_at — chỉ API /nhat-ky trả ra, màn nhật ký không hiện) — đọc sổ TRONG giao dịch
 *  ghi. Hàm hạng không dùng nó. */
async function hanSauDong(tx, phone, dongMoi) {
  const dong = await tx.query(SO_CUA, [phone]);
  return hanCacHang([...dong, dongMoi]).get(Number(dongMoi.tier_id))?.han ?? dongMoi.purchased_at;
}

// TIER-2: hạng còn dùng được để áp giá = active HOẶC expiring_soon (chỉ 'expired'/'none' là hết quyền lợi)
function isTierUsable(status) {
  return status === 'active' || status === 'expiring_soon';
}

module.exports = { getMembershipStatus, isTierUsable, hangNhieuKhach, soKhachGiuHang, hanSauDong, tinhHang, hanCacHang, docGoi, goiBanDuoc, laDongThe, HAN_VO_HAN };
