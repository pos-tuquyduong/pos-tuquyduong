/**
 * HANG-1 (Q1-a, chủ quán 03.11) — PIN CHỦ QUÁN 4–6 số: MỘT chỗ đặt / kiểm cho thao tác chỉ chủ quán làm (cấp / thu hồi hạng, lưu / xoá Cài đặt
 * hạng — chủ quán 04.11; DONVI-1 dùng lại).
 * Lưu BĂM bcrypt ở bảng riêng pos_pin_chu_quan (một dòng id = 1, bước nâng cấp 013) — KHÔNG ở pos_settings: GET /api/pos/settings trả
 * mọi khoá cho mọi nhân viên (lộ băm → dò 10⁶ PIN) và PUT /settings cho quản lý ghi đè (đặt PIN của mình).
 * Đặt / đổi: chỉ tài khoản owner, gõ lại mật khẩu đăng nhập; ĐÃ có PIN thì phải gõ cả PIN cũ (chủ quán 05.11 b1 — mật khẩu đặt lại được ở trang
 * Nhân viên, không đủ). Quên PIN: không có nút — chủ quán nhờ chat soạn cách xoá PIN trong kho. Sai PIN_SAI_TOI_DA lần liền → khoá
 * PIN_KHOA_PHUT phút (khuôn pinKhach.js).
 * Lỗi trả { loi: [status, code, lời] } để route gói thành { error, code }.
 */
const bcrypt = require('bcryptjs');
const { queryOne, run } = require('../database');
const { getNow } = require('./helpers');

const PIN_SAI_TOI_DA = 5;
const PIN_KHOA_PHUT = 15;
const MAU_PIN = /^\d{4,6}$/;
const GIO = "strftime('%Y-%m-%dT%H:%M:%S', ?, ?)";   // (now, '+15 minutes') → cùng dạng getNow()

const LOI = {
  CHI_CHU_QUAN: [403, 'Chỉ tài khoản chủ quán đặt được PIN chủ quán'],
  MAT_KHAU_SAI: [400, 'Mật khẩu đăng nhập không đúng'],
  PIN_CHU_QUAN_KHONG_HOP_LE: [400, 'PIN chủ quán phải từ 4 đến 6 chữ số'],
  PIN_KHONG_KHOP: [400, 'Hai lần nhập PIN không giống nhau'],
  CHUA_CO_PIN_CHU_QUAN: [400, 'Chưa đặt PIN chủ quán — chủ quán đặt ở Cài đặt → Hạng thành viên'],
  PIN_CHU_QUAN_SAI: [400, 'PIN chủ quán không đúng'],
  PIN_CHU_QUAN_KHOA: [423, `Sai PIN chủ quán ${PIN_SAI_TOI_DA} lần — tạm khoá ${PIN_KHOA_PHUT} phút`],
};
const loi = (code) => ({ loi: [LOI[code][0], code, LOI[code][1]] });
const docPin = () => queryOne('SELECT pin_bam, sai, khoa_den FROM pos_pin_chu_quan WHERE id = 1');

async function coPinChuQuan() {
  return String((await docPin())?.pin_bam || '').startsWith('$2');
}

/** Đặt / đổi PIN — `user` là req.user. Đã có PIN → `pinCu` kiểm qua kiemPinChuQuan (tốn lượt, đang khoá thì 423) SAU phần kiểm dữ liệu.
 *  Đổi xong đặt lại bộ đếm (PIN cũ vừa đúng). */
async function datPinChuQuan(user, matKhau, pin, pinLai, pinCu) {
  if (user?.role !== 'owner') return loi('CHI_CHU_QUAN');
  const u = await queryOne('SELECT password FROM pos_users WHERE id = ?', [user.id]);
  if (!u || !bcrypt.compareSync(String(matKhau ?? ''), String(u.password || ''))) return loi('MAT_KHAU_SAI');
  if (!MAU_PIN.test(String(pin ?? ''))) return loi('PIN_CHU_QUAN_KHONG_HOP_LE');
  if (String(pin) !== String(pinLai ?? '')) return loi('PIN_KHONG_KHOP');
  if (await coPinChuQuan()) {
    const cu = await kiemPinChuQuan(pinCu);
    if (cu.loi) return cu;
  }
  await run(`INSERT INTO pos_pin_chu_quan (id, pin_bam, sai, khoa_den, dat_boi, dat_luc) VALUES (1, ?, 0, NULL, ?, ?)
    ON CONFLICT(id) DO UPDATE SET pin_bam = excluded.pin_bam, sai = 0, khoa_den = NULL, dat_boi = excluded.dat_boi, dat_luc = excluded.dat_luc`,
  [await bcrypt.hash(String(pin), 10), user.username, getNow()]);
  return {};
}

/** Kiểm PIN. MỘT câu ghi giữ chỗ lượt thử TRƯỚC khi so (bcrypt chậm): đếm cộng TƯƠNG ĐỐI, tới ngưỡng thì đặt khoá ngay trong câu đó, đang
 *  khoá thì changes = 0 → 423 — gửi nhiều lượt cùng lúc cũng chỉ được so tối đa PIN_SAI_TOI_DA lượt. Hết khoá thì đếm lại từ 1. Đúng → 0. */
async function kiemPinChuQuan(pin) {
  const p = await docPin();
  if (!String(p?.pin_bam || '').startsWith('$2')) return loi('CHUA_CO_PIN_CHU_QUAN');
  const now = getNow();
  const dem = 'CASE WHEN khoa_den IS NULL THEN sai + 1 ELSE 1 END';
  const giu = await run(`UPDATE pos_pin_chu_quan SET sai = ${dem}, khoa_den = CASE WHEN ${dem} >= ? THEN ${GIO} ELSE NULL END
    WHERE id = 1 AND (khoa_den IS NULL OR khoa_den <= ?)`, [PIN_SAI_TOI_DA, now, `+${PIN_KHOA_PHUT} minutes`, now]);
  if (giu.changes !== 1) return loi('PIN_CHU_QUAN_KHOA');
  if (!(await bcrypt.compare(String(pin ?? ''), p.pin_bam))) return loi('PIN_CHU_QUAN_SAI');
  await run('UPDATE pos_pin_chu_quan SET sai = 0, khoa_den = NULL WHERE id = 1');
  return {};
}

module.exports = { coPinChuQuan, datPinChuQuan, kiemPinChuQuan, PIN_SAI_TOI_DA, PIN_KHOA_PHUT };
