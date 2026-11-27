/**
 * GIAO-1 — nói chuyện với Ahamove (API đối tác v3). CHỈ máy chủ gọi; khoá CHỈ ở biến môi trường (chủ quán 29.10), đọc lúc gọi, không bao giờ
 * ghi vào log / DB / câu trả: AHAMOVE_API_KEY + AHAMOVE_SDT (lấy token), AHAMOVE_MOI_TRUONG ('production' = bản thật, còn lại = bản thử),
 * AHAMOVE_DIA_CHI_URL + AHAMOVE_DIA_CHI_KHOA (gợi ý địa chỉ — chủ quán đang xin Ahamove; chưa có thì ô địa chỉ dùng cách 2, giaoHang.js).
 * AHAMOVE_BASE_URL chỉ để bài thử trỏ về Ahamove giả (khuôn PAYOS_BASE_URL).
 * Dạng tin đọc theo tài liệu tóm tắt (viec/GIAO-1/ke_hoach.md mục 2) — đọc RỘNG tay (vài tên trường) vì CHƯA đối chiếu tin Ahamove thật.
 * Lỗi ném { code, status }: AHAMOVE_CHUA_CAI · AHAMOVE_TU_CHOI (Ahamove trả lời rõ là không) · AHAMOVE_MAT_MANG (không biết Ahamove đã làm chưa).
 */
const GOC = { thu: 'https://partner-apistg.ahamove.com', that: 'https://partner-api.ahamove.com' };
const HAN_GOI_MS = 10000;   // mặc định mỗi lần gọi (cả lấy token); đọc lại trong GET danh sách truyền `han` riêng (giaoHang.js HAN_DOC_LAI_MS)

const ban = () => (String(process.env.AHAMOVE_MOI_TRUONG || '').trim().toLowerCase() === 'production' ? 'that' : 'thu');
const gocAhamove = () => process.env.AHAMOVE_BASE_URL || GOC[ban()];
const daCai = () => !!(process.env.AHAMOVE_API_KEY && process.env.AHAMOVE_SDT);
const coGoiY = () => !!(process.env.AHAMOVE_DIA_CHI_URL && process.env.AHAMOVE_DIA_CHI_KHOA);
const loi = (code, status = 0) => Object.assign(new Error(`Ahamove ${code} (HTTP ${status})`), { code, status });

let token = null;

/** Một lần gọi HTTP. Không đọc được câu trả (đứt mạng, hết giờ, thân hỏng) → AHAMOVE_MAT_MANG; HTTP lỗi → AHAMOVE_TU_CHOI (404 → null nếu cho). */
async function goiTho(url, { method = 'GET', than, headers = {}, khong404 = false, han = HAN_GOI_MS } = {}) {
  let r, tho;
  try {
    r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: than ? JSON.stringify(than) : undefined,
      signal: AbortSignal.timeout(han) });
    tho = await r.text();
  } catch {
    throw loi('AHAMOVE_MAT_MANG', r?.status || 0);
  }
  if (r.status === 404 && khong404) return null;
  if (!r.ok) throw loi('AHAMOVE_TU_CHOI', r.status);
  try { return tho ? JSON.parse(tho) : {}; } catch { throw loi('AHAMOVE_MAT_MANG', r.status); }
}

/** Gọi API đối tác bằng token của quán; token hết hạn (401) → lấy lại MỘT lần. */
async function goi(duong, tuy = {}) {
  if (!daCai()) throw loi('AHAMOVE_CHUA_CAI');
  for (let lan = 0; ; lan++) {
    if (!token) {
      const j = await goiTho(gocAhamove() + '/v3/accounts/token', { method: 'POST', than: { mobile: process.env.AHAMOVE_SDT, api_key: process.env.AHAMOVE_API_KEY }, han: tuy.han });
      if (!j?.token) throw loi('AHAMOVE_TU_CHOI');
      token = j.token;
    }
    try {
      return await goiTho(gocAhamove() + duong, { ...tuy, headers: { Authorization: 'Bearer ' + token } });
    } catch (e) {
      if (e.status !== 401 || lan > 0) throw e;
      token = null;
    }
  }
}

const so = (x) => (x == null || x === '' || !Number.isFinite(Number(x)) ? null : Number(x));
/** GIAO-3 C: phí CHUYẾN quán trả — chỉ nhận số > 0; 0 / rỗng / chữ = "không biết" (null) → nơi ghi giữ phí đang có (COALESCE). MỘT quy tắc
 *  cho tạo chuyến + đọc chuyến. Đọc `total_price`; `total_fee` (tài liệu: phí trước khuyến mãi) CHƯA đối chiếu dữ liệu thật — chỉ đưa vào log. */
const phiDuong = (x) => (so(x) > 0 ? Math.round(so(x)) : null);
/** Chữ Ahamove gửi (lý do thất bại / huỷ): bỏ ký tự điều khiển, cắt 200 ký tự; rỗng → null. Màn hiện như chữ thường (React không chèn HTML). */
const chuAha = (x) => (typeof x === 'string' && x.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 200)) || null;
/** Giờ Ahamove (giây hoặc mili-giây unix) → giờ VN 'YYYY-MM-DDTHH:mm:ss' (cùng quy ước getNow); không phải số → null. */
const gioAha = (x) => (so(x) > 0 ? new Date(so(x) < 1e12 ? so(x) * 1000 : so(x)).toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(' ', 'T') : null);
const TRA_HANG = { IN_RETURN: 'dang_tra', RETURNED: 'da_ve' };   // sub_status của COMPLETED (tài liệu Order Status Flow)
/** Điểm trên đường đi của Ahamove: { address, lat, lng, name, mobile, remarks, tracking_number } — bỏ trường rỗng. */
const diem = (d) => Object.fromEntries(Object.entries({ address: d.dia_chi, lat: so(d.lat), lng: so(d.lng), name: d.ten, mobile: d.sdt,
  remarks: d.ghi_chu, tracking_number: d.ma_theo_doi }).filter(([, v]) => v != null && v !== ''));

/** Báo phí một loại xe: { km, phi, dia_chi (Ahamove hiểu, nếu trả), lat, lng, phi_tho }. phi có thể ≤ 0 — nơi gọi tự quyết (giaoHang.js). */
async function baoPhi({ lay, giao, loaiXe }) {
  const j = await goi('/v3/orders/estimates', { method: 'POST',
    than: { order_time: 0, path: [diem(lay), diem(giao)], services: [{ _id: loaiXe }], payment_method: 'BALANCE' } });
  const ds = Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : [j];
  const m = ds.find((x) => (x?._id || x?.service_id) === loaiXe) || ds[0];
  const d = m?.data || m || {};
  const km = so(d.distance), phi = so(d.total_price ?? d.total_fee);
  if (km == null || phi == null) throw loi('AHAMOVE_TU_CHOI', 200);
  const den = d.path?.[1] || {};
  return { km, phi: Math.round(phi), dia_chi: den.address || null, lat: so(den.lat), lng: so(den.lng),
    phi_tho: { total_price: so(d.total_price), total_fee: so(d.total_fee) } };   // GIAO-4: chỉ số, cho log [GIAO] phi_0
}

/** Tạo chuyến — KHÔNG thu hộ (không gửi cod). Trả { ma, phi|null }. */
async function taoChuyen({ lay, giao, loaiXe }) {
  const j = await goi('/v3/orders', { method: 'POST', than: { order_time: 0, service_id: loaiXe, path: [diem(lay), diem(giao)], payment_method: 'BALANCE' } });
  const ma = j?.order_id || j?._id;
  if (!ma) throw loi('AHAMOVE_MAT_MANG', 200);   // trả 200 mà không có mã: không biết đã tạo chưa → kiểm theo mã theo dõi
  return { ma: String(ma), phi: phiDuong(j.order?.total_price ?? j.total_price) };
}

/** Một chuyến trong câu trả của Ahamove: gỡ mảng / { order } (GIAO-2 — dạng thật CHƯA đối chiếu; một hàm cho mọi đường đọc chuyến). */
const motChuyen = (j) => { const o = Array.isArray(j) ? j[0] : j; return o && !(o._id || o.order_id) && o.order ? o.order : o; };

/** Đọc một chuyến (trạng thái THẬT — tin báo về không được tin thân). null = Ahamove không có. `han` (ms): đường đọc lại của màn truyền hạn ngắn. */
async function docChuyen(ma, han) {
  const o = motChuyen(await goi('/v3/orders/' + encodeURIComponent(ma), { khong404: true, han }));
  return o ? tomChuyen(o) : null;
}

/** Tìm chuyến theo mã theo dõi của quán (kiểm trước khi tạo lại sau lỗi mạng). null = chưa có. */
async function traTheoMa(maTheoDoi) {
  const j = await goi('/v3/orders/tracks/' + encodeURIComponent(maTheoDoi), { khong404: true });
  const o = motChuyen(j);
  return o && (o._id || o.order_id) ? tomChuyen(o) : null;
}

/** Huỷ chuyến (Ahamove chỉ cho khi tài xế chưa lấy hàng). */
const huyChuyen = (ma, lyDo) => goi('/v3/orders/' + encodeURIComponent(ma), { method: 'DELETE', than: { comment: lyDo } });

function tomChuyen(o) {
  const den = Array.isArray(o.path) ? o.path[1] || {} : {};
  return {
    ma: String(o._id || o.order_id), trang_thai: String(o.status || ''), diem_giao: String(den.status || ''),
    tai_xe: { ten: o.supplier_name || null, sdt: o.supplier_id || null, bien_so: o.supplier_plate || o.vehicle_plate || o.supplier_license_plate || null },
    phi: phiDuong(o.total_price), phi_tho: { total_price: so(o.total_price), total_fee: so(o.total_fee) },   // phi_tho: chỉ số, cho log [GIAO] phi
    phi_huy: so(o.cancel_fee) ?? 0, nguoi_huy_la_quan: o.cancel_by_user !== false,
    ly_do: chuAha(den.fail_comment), ly_do_huy: chuAha(o.cancel_comment), tra_hang: Object.hasOwn(TRA_HANG, String(o.sub_status)) ? TRA_HANG[o.sub_status] : null, tra_luc: gioAha(den.return_time),
  };
}

// ─── Gợi ý địa chỉ (cách 1): GET <url>/dplaces/web/v2/autocomplete?text=…, chi tiết <url>/gplaces/web/v2/detail — header apikey ───
const goiDiaChi = (duong) => goiTho(process.env.AHAMOVE_DIA_CHI_URL + duong, { headers: { apikey: process.env.AHAMOVE_DIA_CHI_KHOA }, khong404: true });
function tomDiaChi(f) {
  const p = f?.properties || f || {};
  const c = f?.geometry?.coordinates;
  return { ma: String(p.ref_id ?? p.id ?? f?.id ?? p.place_id ?? ''), dia_chi: String(p.label || p.name || p.address || f?.description || ''),
    lat: so(Array.isArray(c) ? c[1] : p.lat ?? p.location?.lat), lng: so(Array.isArray(c) ? c[0] : p.lng ?? p.lon ?? p.location?.lng) };
}
const dsDiaChi = (j) => (Array.isArray(j) ? j : j?.features || j?.data || j?.results || []).map(tomDiaChi).filter((x) => x.ma && x.dia_chi);

async function goiYDiaChi(chu) {
  return dsDiaChi(await goiDiaChi('/dplaces/web/v2/autocomplete?text=' + encodeURIComponent(chu))).map(({ ma, dia_chi }) => ({ ma, dia_chi }));
}
/** Địa chỉ chuẩn + toạ độ của một gợi ý. null = không có gợi ý đó / thiếu toạ độ. */
async function chiTietDiaChi(ma) {
  const d = dsDiaChi(await goiDiaChi('/gplaces/web/v2/detail?id=' + encodeURIComponent(ma)))[0];
  return d && d.lat != null && d.lng != null ? { dia_chi: d.dia_chi, lat: d.lat, lng: d.lng } : null;
}

module.exports = { ban, gocAhamove, daCai, coGoiY, baoPhi, taoChuyen, docChuyen, traTheoMa, huyChuyen, goiYDiaChi, chiTietDiaChi };
