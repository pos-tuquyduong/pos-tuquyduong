/**
 * CT-1a — chương trình đặc biệt (học sinh giỏi · sinh nhật · khác) + ngày sinh khách.
 * Việc này CHỈ lưu cấu hình + hiển thị; ÁP ưu đãi tại quầy là CT-1b (không đụng giá / điểm / đơn nào).
 *
 * Cổng:
 *   · quầy /api/pos/chuong-trinh — JWT nhân viên + quyền manage_promotions (xem · thêm · sửa · bật/tắt · xoá · khoảng tuổi)
 *   · hàm dùng chung (xuất ra): datNgaySinh (App `PUT /api/kh/toi` và quầy `PUT /api/pos/v2/customers/:phone/ngay-sinh` cùng MỘT hàm),
 *     dsCongKhai (`GET /api/kh/chuong-trinh`), thanLoi (mã lỗi ngày sinh dùng chung hai cổng).
 * Ngày sinh nhập MỘT lần; đã có thì chỉ người có quyền sua_ngay_sinh sửa, bắt lý do; mỗi lần đặt / sửa ghi một dòng vào pos_ngay_sinh_sua
 * (chỉ thêm). KHÔNG lưu số căn cước. Ngày = giờ Việt Nam (getNow).
 */
const crypto = require('crypto');
const express = require('express');
const { query, queryOne, run, beginTransaction } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');

const GIOI_HAN = {
  TEN_TOI_DA: 80, MO_TA_TOI_DA: 200, LY_DO_TOI_DA: 200,
  MIEN_MON_TOI_DA: 20,          // số món miễn / lần
  GIA_MIEN_TOI_DA: 10000000,    // trần "giá tối đa món miễn" (đồng)
  SO_LAN_TOI_DA: 99,            // số lần / kỳ
  TUOI_TRAN: 150,               // trần cứng của cài đặt khoảng tuổi
  NAM_NHO_NHAT: 1900,           // ngày trước năm này coi là gõ sai
};
const TUOI_MAC_DINH = { toi_thieu: 5, toi_da: 100 };   // chủ quán chốt 02.11; đổi ở thẻ Chương trình (khoá bên dưới)
const KHOA_TUOI = { toi_thieu: 'ct_tuoi_toi_thieu', toi_da: 'ct_tuoi_toi_da' };
const LOAI = ['sinh_nhat', 'hoc_sinh_gioi', 'khac'];
const KY_GIOI_HAN = ['moi_khach', 'ngay', 'nam_hoc', 'nam'];

// Mã lỗi ngày sinh — DÙNG CHUNG App (/api/kh/toi) và quầy: cùng tình huống → cùng code (LUAT_XAY_APP §2).
const LOI_NGAY_SINH = {
  NGAY_SINH_SAI: [400, 'Ngày sinh không đúng — nhập dạng năm-tháng-ngày, không ở tương lai, tuổi trong khoảng quán cho phép'],
  NGAY_SINH_DA_CO: [409, 'Ngày sinh đã nhập — chỉ quán sửa được, hãy đưa căn cước cho nhân viên'],
  KHACH_KHONG_TON_TAI: [404, 'Không tìm thấy khách'],
};
const LOI_QUAY = {
  LY_DO_BAT_BUOC: [400, `Sửa ngày sinh phải ghi lý do (1–${GIOI_HAN.LY_DO_TOI_DA} ký tự)`],
  CHUONG_TRINH_SAI: [400, 'Chương trình không hợp lệ'],
  CHUONG_TRINH_KHONG_CO: [404, 'Không tìm thấy chương trình'],
  SDT_KHONG_HOP_LE: [400, 'SĐT không hợp lệ'],
};
/** { status, error, code } của một mã lỗi; `loi` thay lời mặc định bằng lời cụ thể hơn. */
function thanLoi(code, loi) {
  const [status, error] = LOI_NGAY_SINH[code] || LOI_QUAY[code];
  return { status, error: loi || error, code };
}
const traLoi = (res, l) => res.status(l.status).json({ success: false, error: l.error, code: l.code });

// ── Ngày ──────────────────────────────────────────────────────────────────
const homNay = () => getNow().slice(0, 10);

/** 'YYYY-MM-DD' đúng dạng VÀ là ngày có thật trên lịch (không 30.2, không 29.2 năm thường). */
function laNgayThat(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (y < GIOI_HAN.NAM_NHO_NHAT) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Tuổi tròn của người sinh `ngaySinh` vào ngày `ngay` (cả hai 'YYYY-MM-DD'). */
function tuoiTai(ngaySinh, ngay) {
  const [y, m, d] = ngaySinh.split('-').map(Number);
  const [y2, m2, d2] = ngay.split('-').map(Number);
  return y2 - y - (m2 < m || (m2 === m && d2 < d) ? 1 : 0);
}

/** Khoảng tuổi cho phép: cài đặt của quán; thiếu / hỏng (chữ, min > max, quá trần) → mặc định. */
async function docKhoangTuoi() {
  const dong = await query('SELECT key, value FROM pos_settings WHERE key IN (?, ?)', [KHOA_TUOI.toi_thieu, KHOA_TUOI.toi_da]);
  const v = Object.fromEntries(dong.map((r) => [r.key, String(r.value ?? '').trim()]));
  const so = (s) => (/^\d{1,3}$/.test(s || '') ? Number(s) : NaN);
  const toiThieu = so(v[KHOA_TUOI.toi_thieu]), toiDa = so(v[KHOA_TUOI.toi_da]);
  return Number.isInteger(toiThieu) && Number.isInteger(toiDa) && toiThieu <= toiDa && toiDa <= GIOI_HAN.TUOI_TRAN
    ? { toi_thieu: toiThieu, toi_da: toiDa } : { ...TUOI_MAC_DINH };
}

/** Ngày sinh hợp lệ: ngày thật, không ở tương lai, tuổi hôm nay trong khoảng. */
function ngaySinhHopLe(giaTri, khoang) {
  if (!laNgayThat(giaTri) || giaTri > homNay()) return false;
  const tuoi = tuoiTai(giaTri, homNay());
  return tuoi >= khoang.toi_thieu && tuoi <= khoang.toi_da;
}

/**
 * Đặt / sửa ngày sinh của khách — MỘT hàm cho App và quầy, MỘT giao dịch: đọc giá trị cũ, ghi có điều kiện `ngay_sinh IS <cũ>` (hai máy cùng
 * lúc → một máy changes = 0 → NGAY_SINH_DA_CO), thêm dòng sổ. `choPhepSua` = chỗ gọi ĐÃ kiểm quyền sua_ngay_sinh; false thì chỉ ghi khi đang trống.
 * → { ngay_sinh } | { loi: { status, error, code } }
 */
async function datNgaySinh({ phone, ngaySinh, nguoi, lyDo, choPhepSua }) {
  if (!ngaySinhHopLe(ngaySinh, await docKhoangTuoi())) return { loi: thanLoi('NGAY_SINH_SAI') };
  const tx = await beginTransaction();
  try {
    const kh = await tx.queryOne('SELECT ngay_sinh FROM pos_customers WHERE phone = ?', [phone]);
    const tuChoi = async (code) => { await tx.rollback(); return { loi: thanLoi(code) }; };
    if (!kh) return await tuChoi('KHACH_KHONG_TON_TAI');
    const cu = kh.ngay_sinh ?? null;
    const lyDoSach = typeof lyDo === 'string' ? lyDo.trim() : '';
    if (cu !== null && !choPhepSua) return await tuChoi('NGAY_SINH_DA_CO');
    if (cu !== null && (!lyDoSach || [...lyDoSach].length > GIOI_HAN.LY_DO_TOI_DA)) return await tuChoi('LY_DO_BAT_BUOC');
    const luc = getNow();
    const ghi = await tx.run('UPDATE pos_customers SET ngay_sinh = ?, updated_at = ? WHERE phone = ? AND ngay_sinh IS ?', [ngaySinh, luc, phone, cu]);
    if (!ghi.changes) return await tuChoi('NGAY_SINH_DA_CO');
    await tx.run('INSERT INTO pos_ngay_sinh_sua (phone, cu, moi, ly_do, boi, luc) VALUES (?, ?, ?, ?, ?, ?)', [phone, cu, ngaySinh, cu === null ? null : lyDoSach, nguoi, luc]);
    await tx.commit();
    return { ngay_sinh: ngaySinh };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

// ── Chương trình ──────────────────────────────────────────────────────────
const so = (v, tu, den) => typeof v === 'number' && Number.isInteger(v) && v >= tu && v <= den;
const laBool = (v) => v === true || v === false || v === 1 || v === 0;
const ngayHoacTrong = (v) => (v === undefined || v === null || v === '' ? null : v);
const MAC_DINH = { mo_ta: '', loai: 'khac', mien_so_mon: 0, mien_gia_toi_da: null, giam_ca_don_pt: 0, giam_con_lai_pt: 0, chi_tai_quan: true, can_xem_giay_to: false,
  gioi_han_ky: 'nam', gioi_han_so: 1, bat_dau: null, ket_thuc: null, dang_bat: false };
const TRUONG = ['ten', ...Object.keys(MAC_DINH)];

/** Dòng kho → dạng trả ra (cờ 0/1 thành true/false). */
const dangApi = (r) => ({
  id: r.id, ma: r.ma, ten: r.ten, mo_ta: r.mo_ta || '', loai: r.loai,
  mien_so_mon: Number(r.mien_so_mon), mien_gia_toi_da: r.mien_gia_toi_da == null ? null : Number(r.mien_gia_toi_da),
  giam_ca_don_pt: Number(r.giam_ca_don_pt), giam_con_lai_pt: Number(r.giam_con_lai_pt),
  chi_tai_quan: !!r.chi_tai_quan, can_xem_giay_to: !!r.can_xem_giay_to, gioi_han_ky: r.gioi_han_ky, gioi_han_so: Number(r.gioi_han_so),
  bat_dau: r.bat_dau || null, ket_thuc: r.ket_thuc || null, dang_bat: !!r.dang_bat, tao_luc: r.tao_luc, sua_luc: r.sua_luc || null, sua_boi: r.sua_boi || null,
});

/**
 * Kiểm TOÀN BỘ chương trình (thêm: mặc định + thân; sửa: dòng hiện có + thân). Thân chỉ nhận các trường trong TRUONG, kiểu phải ĐÚNG
 * (số là số nguyên, cờ là true/false). → { gt } (giá trị sạch, cờ thành 0/1) | { loi }
 */
function kiemChuongTrinh(goc, than) {
  const g = { ...MAC_DINH, ...goc };
  for (const t of TRUONG) if (than && t in than && than[t] !== undefined) g[t] = than[t];
  const ten = typeof g.ten === 'string' ? g.ten.trim() : '';
  const moTa = g.mo_ta == null ? '' : g.mo_ta;
  const batDau = ngayHoacTrong(g.bat_dau), ketThuc = ngayHoacTrong(g.ket_thuc);
  const dung = [
    ten && [...ten].length <= GIOI_HAN.TEN_TOI_DA,
    typeof moTa === 'string' && [...moTa.trim()].length <= GIOI_HAN.MO_TA_TOI_DA,
    LOAI.includes(g.loai),
    so(g.mien_so_mon, 0, GIOI_HAN.MIEN_MON_TOI_DA),
    g.mien_gia_toi_da === null || so(g.mien_gia_toi_da, 1, GIOI_HAN.GIA_MIEN_TOI_DA),
    so(g.giam_ca_don_pt, 0, 100), so(g.giam_con_lai_pt, 0, 100),
    g.mien_so_mon > 0 || g.giam_ca_don_pt > 0 || g.giam_con_lai_pt > 0,   // ít nhất một ưu đãi
    laBool(g.chi_tai_quan), laBool(g.can_xem_giay_to), laBool(g.dang_bat),
    KY_GIOI_HAN.includes(g.gioi_han_ky), so(g.gioi_han_so, 1, GIOI_HAN.SO_LAN_TOI_DA),
    batDau === null || laNgayThat(batDau), ketThuc === null || laNgayThat(ketThuc),
    batDau === null || ketThuc === null || batDau <= ketThuc,
  ];
  if (!dung.every(Boolean)) return { loi: thanLoi('CHUONG_TRINH_SAI') };
  return { gt: {
    ten, mo_ta: moTa.trim(), loai: g.loai, mien_so_mon: g.mien_so_mon, mien_gia_toi_da: g.mien_so_mon > 0 ? g.mien_gia_toi_da : null,
    giam_ca_don_pt: g.giam_ca_don_pt, giam_con_lai_pt: g.giam_con_lai_pt, chi_tai_quan: g.chi_tai_quan ? 1 : 0, can_xem_giay_to: g.can_xem_giay_to ? 1 : 0,
    gioi_han_ky: g.gioi_han_ky, gioi_han_so: g.gioi_han_so, bat_dau: batDau, ket_thuc: ketThuc, dang_bat: g.dang_bat ? 1 : 0,
  } };
}

/**
 * Danh sách cho App (GET /api/kh/chuong-trinh): chỉ chương trình ĐANG BẬT và TRONG thời gian chạy (ngày bắt đầu / kết thúc tính CẢ ngày đó,
 * giờ VN). Danh sách TRẮNG năm trường — không lộ mức ưu đãi, điều kiện.
 */
async function dsCongKhai() {
  const nay = homNay();
  const dong = await query(`SELECT ma, ten, mo_ta, loai FROM pos_chuong_trinh
    WHERE dang_bat = 1 AND (bat_dau IS NULL OR bat_dau <= ?) AND (ket_thuc IS NULL OR ket_thuc >= ?) ORDER BY id`, [nay, nay]);
  return dong.map((r) => ({ ma: r.ma, ten: r.ten, mo_ta: r.mo_ta || '', loai: r.loai, dang_bat: true }));
}

const CAC_COT = ['ten', 'mo_ta', 'loai', 'mien_so_mon', 'mien_gia_toi_da', 'giam_ca_don_pt', 'giam_con_lai_pt', 'chi_tai_quan', 'can_xem_giay_to', 'gioi_han_ky', 'gioi_han_so', 'bat_dau', 'ket_thuc', 'dang_bat'];

const router = express.Router();
const quyen = [authenticate, checkPermission('manage_promotions')];
const bao = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error('Chương trình lỗi:', err.message);
    res.status(500).json({ success: false, error: 'Lỗi máy chủ', code: 'LOI_MAY_CHU' });
  }
};
const docDong = async (id) => (/^\d+$/.test(String(id)) ? queryOne('SELECT * FROM pos_chuong_trinh WHERE id = ?', [Number(id)]) : null);

router.get('/', ...quyen, bao(async (req, res) => {
  const ds = await query('SELECT * FROM pos_chuong_trinh ORDER BY id');
  res.json({ success: true, data: ds.map(dangApi), khoang_tuoi: await docKhoangTuoi() });
}));

// Khoảng tuổi cho ngày sinh (hai khoá cài đặt, ghi CÙNG LÚC trong một giao dịch). Đứng TRƯỚC /:id.
router.put('/khoang-tuoi', ...quyen, bao(async (req, res) => {
  const { toi_thieu: toiThieu, toi_da: toiDa } = req.body || {};
  if (!so(toiThieu, 0, GIOI_HAN.TUOI_TRAN) || !so(toiDa, 0, GIOI_HAN.TUOI_TRAN) || toiThieu > toiDa) return traLoi(res, thanLoi('CHUONG_TRINH_SAI', 'Khoảng tuổi không hợp lệ (số nguyên 0–150, tối thiểu ≤ tối đa)'));
  const tx = await beginTransaction();
  try {
    for (const [khoa, v] of [[KHOA_TUOI.toi_thieu, toiThieu], [KHOA_TUOI.toi_da, toiDa]]) {
      await tx.run('INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at', [khoa, String(v), getNow()]);
    }
    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }
  res.json({ success: true, khoang_tuoi: { toi_thieu: toiThieu, toi_da: toiDa } });
}));

router.post('/', ...quyen, bao(async (req, res) => {
  const kq = kiemChuongTrinh({}, req.body);
  if (kq.loi) return traLoi(res, kq.loi);
  const g = kq.gt;
  const ma = 'ct_' + crypto.randomBytes(4).toString('hex');
  const ghi = await run(`INSERT INTO pos_chuong_trinh (ma, ${CAC_COT.join(', ')}, tao_luc, sua_boi) VALUES (?, ${CAC_COT.map(() => '?').join(', ')}, ?, ?)`,
    [ma, ...CAC_COT.map((c) => g[c]), getNow(), req.user.username]);
  res.json({ success: true, chuong_trinh: dangApi(await queryOne('SELECT * FROM pos_chuong_trinh WHERE id = ?', [ghi.lastInsertRowid])) });
}));

router.put('/:id', ...quyen, bao(async (req, res) => {
  const dong = await docDong(req.params.id);
  if (!dong) return traLoi(res, thanLoi('CHUONG_TRINH_KHONG_CO'));
  const kq = kiemChuongTrinh(dangApi(dong), req.body);
  if (kq.loi) return traLoi(res, kq.loi);
  const g = kq.gt;
  await run(`UPDATE pos_chuong_trinh SET ${CAC_COT.map((c) => `${c} = ?`).join(', ')}, sua_luc = ?, sua_boi = ? WHERE id = ?`,
    [...CAC_COT.map((c) => g[c]), getNow(), req.user.username, dong.id]);
  res.json({ success: true, chuong_trinh: dangApi(await queryOne('SELECT * FROM pos_chuong_trinh WHERE id = ?', [dong.id])) });
}));

router.delete('/:id', ...quyen, bao(async (req, res) => {
  const dong = await docDong(req.params.id);
  if (!dong) return traLoi(res, thanLoi('CHUONG_TRINH_KHONG_CO'));
  const xoa = await run('DELETE FROM pos_chuong_trinh WHERE id = ?', [dong.id]);
  if (!xoa.changes) return traLoi(res, thanLoi('CHUONG_TRINH_KHONG_CO'));
  res.json({ success: true });
}));

module.exports = router;
module.exports.datNgaySinh = datNgaySinh;
module.exports.dsCongKhai = dsCongKhai;
module.exports.thanLoi = thanLoi;
