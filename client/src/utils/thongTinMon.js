/**
 * KH-SP-1 — danh sách mã "thông tin món" + tên tiếng Việt cho nút bấm. Mã PHẢI giống server/utils/thongTinMon.js
 * (cong_cu/thu_KHSP1.js so hai nguồn); đổi mã thì sửa CẢ hai chỗ. Màn Sản phẩm (nhập) và thẻ ⓘ ở quầy (xem) dùng chung file này.
 */
export const NHU_CAU = [
  { ma: 'ngu_ngon', ten: 'Ngủ ngon' },
  { ma: 'dep_da', ten: 'Đẹp da' },
  { ma: 'am_bung', ten: 'Ấm bụng' },
  { ma: 'tinh_tao', ten: 'Tỉnh táo' },
  { ma: 'bo_khi', ten: 'Bổ khí' },
  { ma: 'giai_nhiet', ten: 'Giải nhiệt' },
];

export const THE_CHAT = [
  { ma: 'binh_hoa', ten: 'Bình hoà' },
  { ma: 'khi_hu', ten: 'Khí hư' },
  { ma: 'duong_hu', ten: 'Dương hư' },
  { ma: 'am_hu', ten: 'Âm hư' },
  { ma: 'dam_thap', ten: 'Đàm thấp' },
  { ma: 'thap_nhiet', ten: 'Thấp nhiệt' },
  { ma: 'huyet_u', ten: 'Huyết ứ' },
  { ma: 'khi_uat', ten: 'Khí uất' },
  { ma: 'dac_bam', ten: 'Đặc bẩm' },
];

export const GIOI_HAN = { mo_ta: 160, cong_dung: 160, thanh_phan: 200 };

const tenCua = (ds, ma) => ds.find((x) => x.ma === ma)?.ten || ma;
export const tenNhuCau = (ma) => tenCua(NHU_CAU, ma);
export const tenTheChat = (ma) => tenCua(THE_CHAT, ma);

/** Đếm ký tự thật (chữ ngoài BMP tính 1) — cùng cách đếm của máy chủ. */
export const demKyTu = (s) => [...(s || '')].length;

/** Món có ít nhất một thông tin để hiện không (quầy: không có thì không có dấu ⓘ). */
export const coThongTin = (m) => !!m && ((m.nhu_cau || []).length > 0 || (m.the_chat || []).length > 0 || !!m.mo_ta || !!m.cong_dung || !!m.thanh_phan);
