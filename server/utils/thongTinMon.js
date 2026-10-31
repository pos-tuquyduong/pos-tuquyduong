/**
 * KH-SP-1 — thông tin NGẮN của món (nhu cầu, thể chất hợp, mô tả, công dụng, thành phần): kiểm đầu vào + đọc ra.
 * Hai danh sách mã là MỘT nguồn; bản sao cho giao diện ở client/src/utils/thongTinMon.js phải GIỐNG (bài thử cong_cu/thu_KHSP1.js so nguồn).
 * Thuần: không đụng CSDL. Cột pos_products: nhu_cau, the_chat (chuỗi JSON mảng mã), mo_ta, cong_dung, thanh_phan (chữ).
 */
const NHU_CAU = ['ngu_ngon', 'dep_da', 'am_bung', 'tinh_tao', 'bo_khi', 'giai_nhiet'];
const THE_CHAT = ['binh_hoa', 'khi_hu', 'duong_hu', 'am_hu', 'dam_thap', 'thap_nhiet', 'huyet_u', 'khi_uat', 'dac_bam'];
const GIOI_HAN = { mo_ta: 160, cong_dung: 160, thanh_phan: 200 };
const DANH_SACH = { nhu_cau: NHU_CAU, the_chat: THE_CHAT };
const COT_THONG_TIN = ['nhu_cau', 'the_chat', 'mo_ta', 'cong_dung', 'thanh_phan'];

const demKyTu = (s) => [...s].length;

/**
 * Kiểm thân yêu cầu. Trường nào có khoá trong `b` thì được ghi; trường vắng giữ nguyên.
 * Trả { loi: '<MA>' } hoặc { doi: { <cột>: <giá trị ghi: chuỗi hoặc null> } } (rỗng / [] / null → null = xoá).
 */
function chuanThongTin(b) {
  const doi = {};
  for (const cot of Object.keys(DANH_SACH)) {
    if (!(cot in b)) continue;
    const v = b[cot];
    if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) { doi[cot] = null; continue; }
    if (!Array.isArray(v) || v.some((m) => typeof m !== 'string' || !DANH_SACH[cot].includes(m)) || new Set(v).size !== v.length) {
      return { loi: 'MA_KHONG_HOP_LE' };
    }
    doi[cot] = JSON.stringify(v);
  }
  for (const cot of Object.keys(GIOI_HAN)) {
    if (!(cot in b)) continue;
    const v = b[cot];
    if (v === null || v === undefined) { doi[cot] = null; continue; }
    if (typeof v !== 'string') return { loi: 'YEU_CAU_KHONG_HOP_LE' };
    const chu = v.trim();
    if (demKyTu(chu) > GIOI_HAN[cot]) return { loi: 'QUA_DAI' };
    doi[cot] = chu || null;
  }
  return { doi };
}

const docMang = (s) => {
  try { const m = JSON.parse(s); return Array.isArray(m) ? m.filter((x) => typeof x === 'string') : []; } catch { return []; }
};

/** Hàng pos_products (hoặc undefined) → { nhu_cau[], the_chat[], mo_ta, cong_dung, thanh_phan } — chưa có: [] / null. */
function docThongTin(hang) {
  const h = hang || {};
  return {
    nhu_cau: docMang(h.nhu_cau), the_chat: docMang(h.the_chat),
    mo_ta: h.mo_ta || null, cong_dung: h.cong_dung || null, thanh_phan: h.thanh_phan || null,
  };
}

module.exports = { NHU_CAU, THE_CHAT, GIOI_HAN, COT_THONG_TIN, chuanThongTin, docThongTin };
