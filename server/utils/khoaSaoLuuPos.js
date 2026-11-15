/**
 * SAOLUU-DEM-1 — khoá sao lưu tự động của POS: MỘT khoá chỉ đọc `posk_…` cho Google Apps Script mỗi đêm lấy đúng tệp "Sao lưu toàn bộ"
 * (GET /api/pos/backup/tu-dong). Khoá chỉ mở đúng cửa đó (vé POS thường, khoá `ndk_` của nội dung App đều không mở được).
 * Lưu MỘT dòng trong pos_settings (không bảng): chỉ băm SHA-256 + lúc tạo + người tạo + lần lấy gần nhất + cỡ tệp lần đó.
 * Dòng này không bao giờ ra ngoài qua cửa Cài đặt / tệp xuất / khôi phục (settings.js, backup.js dùng KHOA_CAI_DAT để lọc).
 * Trần lượt: TRAN_LUOT lần / giờ / IP (đúng lẫn sai), đếm trong bộ nhớ như utils/gioiHanDangNhap.js.
 * Không ghi khoá hay tiêu đề Authorization ra log ở đâu cả.
 */
const crypto = require('crypto');
const { queryOne, run } = require('../database');
const { getNow } = require('./helpers');

const KHOA_CAI_DAT = 'khoa_sao_luu_pos';
const TIEN_TO = 'posk_';
const TRAN_LUOT = 6;
const CUA_SO_PHUT = 60;
const TRAN_MUC = 5000;

const bam = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const luot = new Map();   // ip → { dem, hetHan }

/** Giữ một lượt cho IP. true = đã quá trần (chặn). Ghi lượt TRƯỚC khi so khoá — gửi nhiều yêu cầu cùng lúc cũng không vượt trần. */
function chanLuot(ip, now = Date.now()) {
  for (const [k, m] of luot) if (m.hetHan <= now) luot.delete(k);
  const m = luot.get(ip);
  if (m) return m.dem++ >= TRAN_LUOT;
  if (luot.size >= TRAN_MUC) luot.delete(luot.keys().next().value);
  luot.set(ip, { dem: 1, hetHan: now + CUA_SO_PHUT * 60 * 1000 });
  return false;
}

const docDong = async () => {
  const r = await queryOne('SELECT value FROM pos_settings WHERE key = ?', [KHOA_CAI_DAT]);
  try { return r ? JSON.parse(r.value) : null; } catch { return null; }
};

/** Trạng thái cho chủ quán — KHÔNG có băm. */
async function trangThai() {
  const d = await docDong();
  return d ? { co_khoa: true, tao_luc: d.tao_luc, tao_boi: d.tao_boi, lay_luc: d.lay_luc ?? null, lay_co: d.lay_co ?? null } : { co_khoa: false };
}

/** Tạo khoá mới = thay khoá cũ (một dòng). Trả chuỗi khoá — chỉ hiện một lần. */
async function taoKhoa(nguoi) {
  const khoa = TIEN_TO + crypto.randomBytes(32).toString('base64url');
  const gia = JSON.stringify({ ma_bam: bam(khoa), tao_luc: getNow(), tao_boi: nguoi, lay_luc: null, lay_co: null });
  await run(`INSERT INTO pos_settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`, [KHOA_CAI_DAT, gia, getNow()]);
  return khoa;
}

/** Thu hồi: xoá dòng. true nếu có khoá để thu hồi. */
const thuHoiKhoa = async () => (await run('DELETE FROM pos_settings WHERE key = ?', [KHOA_CAI_DAT])).changes === 1;

/** So khoá gửi lên với băm đang giữ bằng phép so thời gian không đổi. Không có khoá đang dùng vẫn so với băm giả (thời gian như nhau). */
async function khoaDung(chuoi) {
  const d = await docDong();
  const a = Buffer.from(bam(chuoi), 'hex');
  const b = Buffer.from(/^[0-9a-f]{64}$/.test(d?.ma_bam || '') ? d.ma_bam : bam(''), 'hex');
  return crypto.timingSafeEqual(a, b) && !!d && typeof chuoi === 'string' && chuoi.startsWith(TIEN_TO);
}

/** Ghi lần lấy gần nhất — chỉ khi dòng vẫn là khoá vừa dùng (khoá mới tạo xen giữa thì không ghi đè). */
const ghiLanLay = (khoa, coTep) => run(`UPDATE pos_settings SET value = json_set(value, '$.lay_luc', ?, '$.lay_co', ?)
  WHERE key = ? AND json_extract(value, '$.ma_bam') = ?`, [getNow(), coTep, KHOA_CAI_DAT, bam(khoa)]);

/** Dòng khoá HIỆN TẠI nguyên văn — khôi phục chèn lại vào kế hoạch để cùng giao dịch DELETE + INSERT giữ nguyên khoá. */
const dongHienTai = () => queryOne('SELECT key, value, updated_at FROM pos_settings WHERE key = ?', [KHOA_CAI_DAT]);

module.exports = { KHOA_CAI_DAT, TIEN_TO, TRAN_LUOT, chanLuot, trangThai, taoKhoa, thuHoiKhoa, khoaDung, ghiLanLay, dongHienTai };
