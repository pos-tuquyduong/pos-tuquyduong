/**
 * QC-APP-1 — "Quảng cáo trên App": chủ quán tự chọn hôm nay / khung giờ nào App hiện chữ quảng cáo gì.
 *   quầy  /api/pos/quang-cao — JWT nhân viên + quyền manage_settings: GET đọc cả danh sách (+ món đang bán để chọn, + công tắc Giờ vàng);
 *         PUT lưu CẢ danh sách một lần (kiểm HẾT → PIN chủ quán → ghi trong MỘT giao dịch; thứ tự mảng = uu_tien 1..n; dòng có id mà
 *         không còn trong mảng bị xoá). Quảng cáo không phải sổ tiền nên được xoá.
 *   hàm dùng chung (xuất ra): dsCongKhai — cửa `GET /api/kh/quang-cao` (routes/kh/index.js) gọi; kiemDong / GIOI_HAN cho bài thử.
 * Máy chủ tự kiểm mọi luật (không tin màn). Ngày hôm nay = giờ Việt Nam (getNow). Khung giờ do App tự so với `bay_gio`.
 */
const express = require('express');
const { query, queryOne, beginTransaction } = require('../database');
const { authenticate, checkPermission } = require('../middleware/auth');
const { getNow } = require('../utils/helpers');
const { kiemPinChuQuan } = require('../utils/pinChuQuan');
const { layMenuQuay } = require('./products');
const { loiGhi } = require('./wallets');

const router = express.Router();

const GIOI_HAN = { chu_dai: 32, tieu_de: 40, phu: 80, chu_nut: 20, so_dong: 20 };
const DICH = ['menu', 'mon', 'uudai', 'tracnghiem', ''];
const KIEU_NGAY = ['hang_ngay', 'thu', 'khoang'];
const KHOA_GIO_VANG = 'quang_cao_gio_vang';
const MAU_GIO = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAU_NGAY = /^\d{4}-\d{2}-\d{2}$/;
const DIEU_KHIEN = /[\u0000-\u001f\u007f]/;
const BO_TACH = new Intl.Segmenter('vi', { granularity: 'grapheme' });

/** Số ký tự NHÌN THẤY (biểu tượng, chữ Việt gõ tổ hợp = 1). */
const demKyTu = (s) => Array.from(BO_TACH.segment(String(s ?? ''))).length;
const laNgayThat = (s) => {
  if (typeof s !== 'string' || !MAU_NGAY.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
};
/** Thứ của ngày 'YYYY-MM-DD': 1 = thứ Hai … 7 = Chủ nhật. */
const thuCua = (ngay) => { const [y, m, d] = ngay.split('-').map(Number); return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7 + 1; };
const trong = (v) => v === null || v === undefined || v === '';

/** Kiểm MỘT dòng gửi lên → { dong } đã chuẩn hoá hoặc { loi, truong }. `tonTai(ma)` = món có trong kho. */
async function kiemDong(d, tonTai) {
  const sai = (truong, loi) => ({ truong, loi });
  const chu = (truong, ten, toiDa, batBuoc) => {
    const v = trong(d?.[truong]) && !batBuoc ? '' : d?.[truong];
    if (typeof v !== 'string') return sai(truong, `${ten} phải là chữ`);
    const s = v.trim();
    if (batBuoc && !s) return sai(truong, `Nhập ${ten.toLowerCase()}`);
    if (DIEU_KHIEN.test(s)) return sai(truong, `${ten} không được xuống dòng hay có ký tự điều khiển`);
    if (demKyTu(s) > toiDa) return sai(truong, `${ten} tối đa ${toiDa} ký tự`);
    return { s };
  };
  const o = {};
  for (const [truong, ten, toiDa, batBuoc] of [['chu_dai', 'Chữ dải', GIOI_HAN.chu_dai, true], ['tieu_de', 'Tiêu đề', GIOI_HAN.tieu_de, false],
    ['phu', 'Dòng phụ', GIOI_HAN.phu, false], ['chu_nut', 'Chữ nút', GIOI_HAN.chu_nut, false]]) {
    const r = chu(truong, ten, toiDa, batBuoc);
    if (r.loi) return r;
    o[truong] = r.s;
  }
  const dich = trong(d?.dich) ? '' : d.dich;
  if (!DICH.includes(dich)) return sai('dich', 'Nơi mở khi bấm không hợp lệ');
  o.dich = dich;
  o.ma_mon = null;
  if (dich === 'mon') {
    if (typeof d.ma_mon !== 'string' || !d.ma_mon) return sai('ma_mon', 'Chọn món để mở');
    if (!(await tonTai(d.ma_mon))) return sai('ma_mon', 'Món này không có trong danh sách món');
    o.ma_mon = d.ma_mon;
  }
  const kieu = d?.kieu_ngay ?? 'hang_ngay';
  if (!KIEU_NGAY.includes(kieu)) return sai('kieu_ngay', 'Cách chọn ngày không hợp lệ');
  o.kieu_ngay = kieu; o.cac_thu = []; o.tu_ngay = null; o.den_ngay = null;
  if (kieu === 'thu') {
    const ds = d.cac_thu;
    if (!Array.isArray(ds) || !ds.length || ds.some((t) => !Number.isInteger(t) || t < 1 || t > 7)) return sai('cac_thu', 'Chọn ít nhất một thứ trong tuần (thứ Hai đến Chủ nhật)');
    o.cac_thu = [...new Set(ds)].sort((a, b) => a - b);
  } else if (kieu === 'khoang') {
    if (!laNgayThat(d.tu_ngay)) return sai('tu_ngay', 'Chọn ngày bắt đầu đúng (năm-tháng-ngày, ngày có thật)');
    if (!laNgayThat(d.den_ngay)) return sai('den_ngay', 'Chọn ngày kết thúc đúng (năm-tháng-ngày, ngày có thật)');
    if (d.den_ngay < d.tu_ngay) return sai('den_ngay', 'Ngày kết thúc phải từ ngày bắt đầu trở đi');
    o.tu_ngay = d.tu_ngay; o.den_ngay = d.den_ngay;
  }
  o.tu_gio = null; o.den_gio = null;
  if (!(trong(d?.tu_gio) && trong(d?.den_gio))) {
    if (trong(d.tu_gio)) return sai('tu_gio', 'Nhập giờ bắt đầu (hoặc để trống cả hai ô giờ = cả ngày)');
    if (trong(d.den_gio)) return sai('den_gio', 'Nhập giờ kết thúc (hoặc để trống cả hai ô giờ = cả ngày)');
    if (typeof d.tu_gio !== 'string' || !MAU_GIO.test(d.tu_gio)) return sai('tu_gio', 'Giờ bắt đầu phải dạng 08:30');
    if (typeof d.den_gio !== 'string' || !MAU_GIO.test(d.den_gio)) return sai('den_gio', 'Giờ kết thúc phải dạng 17:00');
    if (d.den_gio <= d.tu_gio) return sai('den_gio', 'Giờ kết thúc phải sau giờ bắt đầu (không vắt qua nửa đêm)');
    o.tu_gio = d.tu_gio; o.den_gio = d.den_gio;
  }
  if (typeof d?.bat !== 'boolean') return sai('bat', 'Bật hoặc tắt dòng này');
  o.bat = d.bat;
  return { dong: o };
}

/** Dòng có hiện vào NGÀY của `bayGio` ('YYYY-MM-DDTHH:mm:ss', giờ VN) không — chưa xét giờ (App tự so). */
function homNayHop(d, bayGio) {
  const ngay = bayGio.slice(0, 10);
  if (d.kieu_ngay === 'thu') return String(d.cac_thu).split(',').map(Number).includes(thuCua(ngay));
  if (d.kieu_ngay === 'khoang') return !!d.tu_ngay && !!d.den_ngay && d.tu_ngay <= ngay && ngay <= d.den_ngay;
  return true;
}

/** Món ĐANG BÁN (cùng hàm + cùng vị từ `sellable` với /api/kh/menu) → [{ ma, ten }]. */
const monDangBan = async () => (await layMenuQuay()).filter((p) => p.sellable).map((p) => ({ ma: p.unique_id, ten: p.name }));

/** Cửa App: dòng đang bật VÀ hợp ngày hôm nay, theo uu_tien. Món không còn bán được → mở Menu. Danh sách trắng trường. */
async function dsCongKhai(bayGio) {
  const hang = (await query('SELECT * FROM pos_quang_cao WHERE bat = 1 ORDER BY uu_tien ASC, id ASC')).filter((d) => homNayHop(d, bayGio));
  const ban = hang.some((d) => d.dich === 'mon') ? new Set((await monDangBan()).map((m) => m.ma)) : new Set();
  return hang.map((d) => {
    const mon = d.dich === 'mon' && ban.has(d.ma_mon);
    return { id: d.id, chu_dai: d.chu_dai, tieu_de: d.tieu_de, phu: d.phu, chu_nut: d.chu_nut, dich: d.dich === 'mon' && !mon ? 'menu' : d.dich,
      ma_mon: mon ? d.ma_mon : null, tu_gio: d.tu_gio || null, den_gio: d.den_gio || null, uu_tien: d.uu_tien };
  });
}

const quyen = [authenticate, checkPermission('manage_settings')];
const baoPin = (res, [status, code, error]) => res.status(status).json({ error, code });
const tuChoi = (res, error, loiO) => res.status(400).json({ error, code: 'QUANG_CAO_KHONG_HOP_LE', ...(loiO ? { loi_o: loiO } : {}) });

router.get('/', ...quyen, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM pos_quang_cao ORDER BY uu_tien ASC, id ASC');
    const gv = await queryOne('SELECT value FROM pos_settings WHERE key = ?', [KHOA_GIO_VANG]);
    res.json({ success: true, gioi_han: GIOI_HAN, gio_vang: gv?.value === '1', mon: await monDangBan(),
      dong: rows.map((d) => ({ id: d.id, chu_dai: d.chu_dai, tieu_de: d.tieu_de, phu: d.phu, chu_nut: d.chu_nut, dich: d.dich, ma_mon: d.ma_mon,
        kieu_ngay: d.kieu_ngay, cac_thu: String(d.cac_thu).split(',').filter(Boolean).map(Number), tu_ngay: d.tu_ngay, den_ngay: d.den_ngay,
        tu_gio: d.tu_gio, den_gio: d.den_gio, bat: !!d.bat })) });
  } catch (err) {
    console.error('quang-cao GET:', err.message);
    res.status(500).json({ error: 'Lỗi máy chủ, thử lại sau', code: 'LOI_MAY_CHU' });
  }
});

router.put('/', ...quyen, async (req, res) => {
  try {
    const { dong, gio_vang } = req.body || {};
    if (!Array.isArray(dong)) return tuChoi(res, 'Thiếu danh sách quảng cáo');
    if (typeof gio_vang !== 'boolean') return tuChoi(res, 'Công tắc Giờ vàng phải là bật hoặc tắt');
    if (dong.length > GIOI_HAN.so_dong) return tuChoi(res, `Tối đa ${GIOI_HAN.so_dong} dòng quảng cáo`, { dong: GIOI_HAN.so_dong, truong: 'chu_dai' });
    const tonTai = async (ma) => !!(await queryOne("SELECT 1 AS co FROM pos_products WHERE sx_product_type || '_' || sx_product_id = ?", [ma]));
    const ds = [];
    for (const [i, d] of dong.entries()) {
      const k = await kiemDong(d, tonTai);
      if (k.loi) return tuChoi(res, `Dòng ${i + 1}: ${k.loi}`, { dong: i, truong: k.truong });
      const id = trong(d.id) ? null : Number(d.id);
      if (id !== null && !Number.isInteger(id)) return tuChoi(res, `Dòng ${i + 1}: mã dòng không hợp lệ`, { dong: i, truong: 'chu_dai' });
      ds.push({ ...k.dong, id });
    }
    const pin = await kiemPinChuQuan(req.body.pin);
    if (pin.loi) return baoPin(res, pin.loi);

    const now = getNow();
    const tx = await beginTransaction();
    try {
      const giu = ds.map((d) => d.id).filter((id) => id !== null);
      await tx.run(`DELETE FROM pos_quang_cao${giu.length ? ` WHERE id NOT IN (${giu.map(() => '?').join(',')})` : ''}`, giu);
      for (const [i, d] of ds.entries()) {
        const gt = [d.chu_dai, d.tieu_de, d.phu, d.chu_nut, d.dich, d.ma_mon, d.kieu_ngay, d.cac_thu.join(','), d.tu_ngay, d.den_ngay, d.tu_gio, d.den_gio, i + 1, d.bat ? 1 : 0];
        if (d.id === null) {
          await tx.run(`INSERT INTO pos_quang_cao (chu_dai, tieu_de, phu, chu_nut, dich, ma_mon, kieu_ngay, cac_thu, tu_ngay, den_ngay, tu_gio, den_gio, uu_tien, bat, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [...gt, now, now]);
          continue;
        }
        const r = await tx.run(`UPDATE pos_quang_cao SET chu_dai=?, tieu_de=?, phu=?, chu_nut=?, dich=?, ma_mon=?, kieu_ngay=?, cac_thu=?, tu_ngay=?, den_ngay=?, tu_gio=?, den_gio=?,
          uu_tien=?, bat=?, updated_at=? WHERE id = ?`, [...gt, now, d.id]);
        if (!r.changes) { await tx.rollback(); return tuChoi(res, `Dòng ${i + 1}: dòng này không còn trong kho — tải lại trang`, { dong: i, truong: 'chu_dai' }); }
      }
      await tx.run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
        [KHOA_GIO_VANG, gio_vang ? '1' : '0', now]);
      await tx.commit();
    } catch (e) { await tx.rollback(); throw e; }
    res.json({ success: true });
  } catch (err) {
    loiGhi(res, err);
  }
});

module.exports = router;
module.exports.dsCongKhai = dsCongKhai;
module.exports.kiemDong = kiemDong;
module.exports.GIOI_HAN = GIOI_HAN;
module.exports.KHOA_GIO_VANG = KHOA_GIO_VANG;
module.exports.demKyTu = demKyTu;
