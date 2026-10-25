/**
 * P3 — PIN khách 4 số: MỘT chỗ đặt (quầy + App KH), kiểm, xoá. Lưu BĂM bcrypt ở pos_customers.pin_code; giá trị không mở đầu `$2`
 * (dữ liệu cũ) coi như CHƯA đặt — không bao giờ so chuỗi thô (chủ quán chốt Q7). Sai PIN_SAI_TOI_DA lần liền → khoá PIN_KHOA_PHUT phút.
 * Lỗi trả { loi: [status, code, lời] } để route gói thành { error, code }.
 */
const bcrypt = require('bcryptjs');
const { queryOne, run } = require('../database');
const { getNow, normalizePhone } = require('./helpers');

const PIN_SAI_TOI_DA = 5;
const PIN_KHOA_PHUT = 15;
const GIO = "strftime('%Y-%m-%dT%H:%M:%S', ?, ?)";   // (now, '+15 minutes') → cùng dạng getNow()

const LOI = {
  PIN_KHONG_HOP_LE: [400, 'PIN phải đúng 4 chữ số'],
  PIN_KHONG_KHOP: [400, 'Hai lần nhập PIN không giống nhau'],
  PIN_DA_CO: [409, 'Khách đã có PIN — đổi PIN trong App, quên PIN thì chủ quán / quản lý xoá PIN'],
  KHACH_KHONG_TON_TAI: [404, 'Không tìm thấy khách'],
  CHUA_CO_PIN: [400, 'Khách chưa đặt PIN — đặt PIN trước khi trừ tài khoản'],
  PIN_SAI: [400, 'PIN không đúng'],
  PIN_DANG_KHOA: [423, `Sai PIN ${PIN_SAI_TOI_DA} lần — tạm khoá dùng tài khoản ${PIN_KHOA_PHUT} phút`],
};
const loi = (code) => ({ loi: [LOI[code][0], code, LOI[code][1]] });
const laBam = (v) => String(v || '').startsWith('$2');

/** Đặt PIN. `lanDau`: quầy chỉ đặt khi khách CHƯA có PIN (Q6); App KH đổi được. Câu ghi tự giữ điều kiện "chưa có" (hai quầy cùng đặt). */
async function datPin(sdt, pin, pinLai, { lanDau, viec, nguoi }) {
  const phone = normalizePhone(sdt);
  if (!/^\d{4}$/.test(String(pin ?? ''))) return loi('PIN_KHONG_HOP_LE');
  if (String(pin) !== String(pinLai ?? '')) return loi('PIN_KHONG_KHOP');
  const bam = await bcrypt.hash(String(pin), 10);
  const r = await run(`UPDATE pos_customers SET pin_code = ?, pin_sai = 0, pin_khoa_den = NULL, updated_at = ?
    WHERE phone = ?${lanDau ? " AND COALESCE(pin_code, '') NOT LIKE '$2%'" : ''}`, [bam, getNow(), phone]);
  if (r.changes !== 1) return loi((await queryOne('SELECT id FROM pos_customers WHERE phone = ?', [phone])) ? 'PIN_DA_CO' : 'KHACH_KHONG_TON_TAI');
  await run('INSERT INTO pos_nhat_ky_pin (phone, viec, nguoi, luc) VALUES (?, ?, ?, ?)', [phone, viec, nguoi, getNow()]);
  return {};
}

/** Kiểm PIN của CHỦ tài khoản bị trừ. MỘT câu ghi giữ chỗ lượt thử TRƯỚC khi so (bcrypt chậm): đếm cộng TƯƠNG ĐỐI, tới ngưỡng thì đặt
 *  khoá ngay trong câu đó, đang khoá thì changes = 0 → 423 — gửi nhiều lượt cùng lúc cũng chỉ được so tối đa PIN_SAI_TOI_DA lượt.
 *  Hết khoá thì đếm lại từ 1. PIN đúng → đếm về 0, gỡ khoá. */
async function kiemPin(sdt, pin) {
  const phone = normalizePhone(sdt);
  const kh = phone && await queryOne('SELECT pin_code FROM pos_customers WHERE phone = ?', [phone]);
  if (!kh || !laBam(kh.pin_code)) return loi('CHUA_CO_PIN');
  const now = getNow();
  const dem = 'CASE WHEN pin_khoa_den IS NULL THEN COALESCE(pin_sai, 0) + 1 ELSE 1 END';
  const giu = await run(`UPDATE pos_customers SET pin_sai = ${dem}, pin_khoa_den = CASE WHEN ${dem} >= ? THEN ${GIO} ELSE NULL END
    WHERE phone = ? AND (pin_khoa_den IS NULL OR pin_khoa_den <= ?)`, [PIN_SAI_TOI_DA, now, `+${PIN_KHOA_PHUT} minutes`, phone, now]);
  if (giu.changes !== 1) return loi('PIN_DANG_KHOA');
  if (!(await bcrypt.compare(String(pin ?? ''), kh.pin_code))) return loi('PIN_SAI');
  await run('UPDATE pos_customers SET pin_sai = 0, pin_khoa_den = NULL WHERE phone = ?', [phone]);
  return {};
}

/** Xoá PIN (khách quên) — owner / manager, lý do bắt buộc ở route. */
async function xoaPin(sdt, lyDo, nguoi) {
  const phone = normalizePhone(sdt);
  const r = await run('UPDATE pos_customers SET pin_code = NULL, pin_sai = 0, pin_khoa_den = NULL, updated_at = ? WHERE phone = ?', [getNow(), phone]);
  if (r.changes !== 1) return loi('KHACH_KHONG_TON_TAI');
  await run("INSERT INTO pos_nhat_ky_pin (phone, viec, ly_do, nguoi, luc) VALUES (?, 'xoa', ?, ?, ?)", [phone, lyDo, nguoi, getNow()]);
  return {};
}

/** Bỏ `password`, `pin_code` khỏi mọi mức của câu trả (mảng, customer, children); có pin_code thì thêm `co_pin`. */
function boMat(x) {
  if (Array.isArray(x)) return x.map(boMat);
  if (!x || typeof x !== 'object' || Object.getPrototypeOf(x) !== Object.prototype) return x;
  const ra = {};
  for (const [kk, v] of Object.entries(x)) if (kk !== 'password' && kk !== 'pin_code') ra[kk] = boMat(v);
  if ('pin_code' in x) ra.co_pin = laBam(x.pin_code);
  return ra;
}

module.exports = { datPin, kiemPin, xoaPin, boMat, PIN_SAI_TOI_DA, PIN_KHOA_PHUT };
