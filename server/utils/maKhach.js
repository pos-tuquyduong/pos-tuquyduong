/**
 * KH-API-1 (A, B, D) — mã đăng nhập App KH: sinh, cấp ở quầy, App xin, xác minh. Bảng pos_kh_ma_dang_nhap (database.js).
 * - Mã 6 chữ số (crypto.randomInt), lưu HMAC-SHA256 khoá KH_JWT_SECRET — lộ bảng mà không có khoá thì không dò ngược được.
 * - Giờ: `now` = getNow() một lần mỗi yêu cầu; mốc lùi / hạn tính TRONG SQL bằng strftime trên chính chuỗi đó → cùng định dạng cột.
 * - Giới hạn B chỉ đếm và chỉ chặn mã App xin (nguon 'gui'); mã quầy cấp luôn dùng được, chỉ giữ trần THU_MOI_MA (chủ quán Q7).
 */
const crypto = require('crypto');
const { queryOne, run, beginTransaction } = require('../database');
const { getNow, normalizePhone, isValidPhone, generateQRCode } = require('./helpers');
const { guiMaKhach, coKenhGui } = require('./guiMaKhach');
const { khoaKhach } = require('../middleware/khachAuth');

const GIOI_HAN = {
  HAN_MA_PHUT: 5,     // mã sống 5 phút
  CACH_GIAY: 60,      // App xin lại mã cho cùng SĐT: cách ≥ 60 giây
  SDT_GIO: 5,         // App xin ≤ 5 mã / SĐT / giờ
  IP_GIO: 20,         // App xin ≤ 20 mã / IP / giờ
  THU_MOI_MA: 5,      // ≤ 5 lần thử / mã (sai 5 lần → mã chết)
  SAI_SDT_GIO: 10,    // ≤ 10 lần sai / SĐT / giờ trên mã App
  TEN_TOI_DA: 50,     // tên khách 1–50 ký tự
};

const DANG_GIO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/;
const GIO = "strftime('%Y-%m-%dT%H:%M:%S', ?, ?)";   // (now, '-60 seconds') → cùng dạng getNow()

function bayGio() {
  const now = getNow();
  if (!DANG_GIO.test(now)) throw new Error('getNow sai dạng');   // strftime ra NULL → mọi phép giới hạn thành MỞ
  return now;
}

/** SĐT chuẩn (0xxxxxxxxx) hoặc null — cùng cặp hàm đường quầy tạo khách dùng. */
function chuanSdt(sdt) {
  const s = typeof sdt === 'string' ? normalizePhone(sdt) : null;
  return s && isValidPhone(s) ? s : null;
}

/** Tên khách sau trim (NFC), 1–TEN_TOI_DA ký tự, hoặc null. */
function chuanTen(ten) {
  const t = typeof ten === 'string' ? ten.normalize('NFC').trim() : '';
  return t && [...t].length <= GIOI_HAN.TEN_TOI_DA ? t : null;
}

function bamMa(sdt, ma) {
  const khoa = khoaKhach();
  if (!khoa) throw new Error('KH_JWT_SECRET chưa cấu hình');
  return crypto.createHmac('sha256', khoa).update(`${sdt}:${ma}`).digest('hex');
}

const sinhMa = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
const hanMa = () => `+${GIOI_HAN.HAN_MA_PHUT} minutes`;

/** D — nhân viên cấp mã tại quầy: không giới hạn lượt xin. */
async function capMaQuay(sdt, nguoiCap, ip) {
  const ma = sinhMa(), now = bayGio();
  await run(`INSERT INTO pos_kh_ma_dang_nhap (sdt, ma_bam, nguon, cap_boi, ip, tao_luc, het_han)
    VALUES (?, ?, 'quay', ?, ?, ?, ${GIO})`, [sdt, bamMa(sdt, ma), nguoiCap, ip, now, now, hanMa()]);
  return { ma, het_han_giay: GIOI_HAN.HAN_MA_PHUT * 60 };
}

/**
 * B1 — App xin mã: ba giới hạn + chèn trong MỘT câu (không đua; lần bị từ chối không chèn nên không tự tính thêm).
 * Chế độ không gửi (quay) → dòng chèn sẵn huy_luc: vẫn đếm giới hạn, không che mã quầy cấp. → { loi } | { layMaTaiQuay }.
 */
async function xinMaGui(sdt, ip) {
  const ma = sinhMa(), now = bayGio(), guiDuoc = coKenhGui();
  const kq = await run(`INSERT INTO pos_kh_ma_dang_nhap (sdt, ma_bam, nguon, ip, tao_luc, het_han, huy_luc)
    SELECT ?, ?, 'gui', ?, ?, ${GIO}, ?
    WHERE NOT EXISTS (SELECT 1 FROM pos_kh_ma_dang_nhap WHERE nguon = 'gui' AND sdt = ? AND tao_luc > ${GIO})
      AND (SELECT COUNT(*) FROM pos_kh_ma_dang_nhap WHERE nguon = 'gui' AND sdt = ? AND tao_luc > ${GIO}) < ?
      AND (SELECT COUNT(*) FROM pos_kh_ma_dang_nhap WHERE nguon = 'gui' AND ip = ? AND tao_luc > ${GIO}) < ?`,
  [sdt, bamMa(sdt, ma), ip, now, now, hanMa(), guiDuoc ? null : now,
    sdt, now, `-${GIOI_HAN.CACH_GIAY} seconds`,
    sdt, now, '-1 hour', GIOI_HAN.SDT_GIO,
    ip, now, '-1 hour', GIOI_HAN.IP_GIO]);
  if (kq.changes !== 1) return { loi: 'QUA_NHIEU_LAN' };
  if (guiDuoc) await guiMaKhach(sdt, ma);
  return { layMaTaiQuay: !guiDuoc };
}

/**
 * A2–A4, B2 — xác minh → { khachId } | { loi }. Thứ tự:
 *  1. mã MỚI NHẤT còn hiệu lực của SĐT; không có → MA_HET_HAN;
 *  2. mã App → trần lượt sai theo SĐT (tính theo lúc tạo mã; mã sống 5 phút nên lệch tối đa chừng đó);
 *  3. mã đúng + SĐT chưa là khách + thiếu tên → CAN_TEN, KHÔNG ghi gì (mã còn nguyên; chỉ người cầm mã đúng thấy câu này);
 *  4. giữ một lượt thử bằng câu có điều kiện (100 lần đoán song song cũng chỉ 5 lượt) → sai → MA_SAI;
 *  5. giao dịch: chiếm mã `AND dung_luc IS NULL` + kiểm changes → tạo khách nếu chưa có (như quầy: khách lẻ, không xuất SX).
 */
async function xacMinhMa(sdt, ma, ten) {
  const now = bayGio();
  const dong = await queryOne(`SELECT id, ma_bam, nguon FROM pos_kh_ma_dang_nhap
    WHERE sdt = ? AND dung_luc IS NULL AND huy_luc IS NULL AND het_han > ? AND so_lan_thu < ?
    ORDER BY id DESC LIMIT 1`, [sdt, now, GIOI_HAN.THU_MOI_MA]);
  if (!dong) return { loi: 'MA_HET_HAN' };
  if (dong.nguon === 'gui') {
    const sai = await queryOne(`SELECT COALESCE(SUM(so_lan_thu), 0) - COUNT(dung_luc) AS n FROM pos_kh_ma_dang_nhap
      WHERE nguon = 'gui' AND sdt = ? AND tao_luc > ${GIO}`, [sdt, now, '-1 hour']);
    if (Number(sai.n) >= GIOI_HAN.SAI_SDT_GIO) return { loi: 'QUA_NHIEU_LAN' };
  }
  const bam = /^\d{6}$/.test(ma) ? bamMa(sdt, ma) : '';
  const dung = bam.length === dong.ma_bam.length && crypto.timingSafeEqual(Buffer.from(bam), Buffer.from(dong.ma_bam));
  const khach = await queryOne('SELECT id FROM pos_customers WHERE phone = ?', [sdt]);
  const tenMoi = chuanTen(ten);
  if (dung && !khach && !tenMoi) return { loi: 'CAN_TEN' };

  const giu = await run(`UPDATE pos_kh_ma_dang_nhap SET so_lan_thu = so_lan_thu + 1
    WHERE id = ? AND so_lan_thu < ? AND dung_luc IS NULL`, [dong.id, GIOI_HAN.THU_MOI_MA]);
  if (giu.changes !== 1) return { loi: 'MA_HET_HAN' };
  if (!dung) return { loi: 'MA_SAI' };

  const tx = await beginTransaction();
  try {
    const chiem = await tx.run(`UPDATE pos_kh_ma_dang_nhap SET dung_luc = ?
      WHERE id = ? AND dung_luc IS NULL AND huy_luc IS NULL`, [now, dong.id]);
    if (!chiem || chiem.changes !== 1) { await tx.rollback(); return { loi: 'MA_HET_HAN' }; }
    if (!khach) {
      await tx.run(`INSERT INTO pos_customers (phone, name, qr_code, customer_type, sync_status, created_by, created_at)
        VALUES (?, ?, ?, 'retail', 'retail_only', 'app_kh', ?) ON CONFLICT DO NOTHING`, [sdt, tenMoi, generateQRCode(sdt), now]);
    }
    const kh = await tx.queryOne('SELECT id FROM pos_customers WHERE phone = ?', [sdt]);
    if (!kh) throw new Error('không tạo được khách');
    await tx.commit();
    return { khachId: kh.id };
  } catch (err) {
    try { await tx.rollback(); } catch { /* đã đóng */ }
    throw err;
  }
}

module.exports = { GIOI_HAN, chuanSdt, chuanTen, capMaQuay, xinMaGui, xacMinhMa };
