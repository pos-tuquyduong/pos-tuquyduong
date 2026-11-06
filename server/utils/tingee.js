/**
 * TINGEE-1 — cổng QR Tingee. Cùng dạng sepay.js: POS tự dựng VietQR (vietQr.js), Tingee theo dõi tài khoản và gửi Webhook biến động số dư.
 * Tài khoản MB hộ kinh doanh: Tingee CHỈ báo tiền chuyển vào SỐ TÀI KHOẢN ẢO (VA, dạng VQR…) → QR trỏ vào VA, khớp tài khoản theo vaAccountNumber
 * (accountNumber = số gốc, bỏ qua — chủ quán 06.11). Biến môi trường (đọc lúc gọi, không ghi vào log / câu trả): TINGEE_CLIENT_ID,
 * TINGEE_SECRET_TOKEN (khoá ký Webhook), TINGEE_SO_TK (số VA), TINGEE_BIN (BIN ngân hàng của số đó), TINGEE_MOI_TRUONG ('production' | 'uat',
 * không đặt = production; QR tự dựng không gọi API nên hai giá trị chạy như nhau).
 * Chữ ký (viec/TINGEE-1/tai_lieu_tingee.md mục 2): x-signature = hex HMAC-SHA512(khoá, "<x-request-timestamp>:<thân>"); thân là thân THÔ, hoặc
 * JSON.stringify của nó (mã mẫu Tingee ký trên bản gọn) — khớp MỘT trong hai. KHÔNG từ chối vì mốc giờ cũ (mục 4: Tingee gửi lại sau nhiều giờ);
 * báo lặp dừng ở khoá 'tingee:<transactionCode>'.
 */
const crypto = require('crypto');
const { dungVietQr } = require('./vietQr');
const { docNoiDung, NOI_DUNG_SO_HD } = require('./sepay');

const MOI_TRUONG = ['', 'production', 'uat'];
const DANG_TS = /^\d{17}$/;   // yyyyMMddHHmmssSSS (giờ VN) — đúng dạng tài liệu mục 1–2; KHÔNG so với giờ máy chủ (mục 4)

const cauHinh = () => ({ id: (process.env.TINGEE_CLIENT_ID || '').trim(), khoa: process.env.TINGEE_SECRET_TOKEN || '',
  soTk: (process.env.TINGEE_SO_TK || '').trim(), bin: (process.env.TINGEE_BIN || '').trim(), moiTruong: (process.env.TINGEE_MOI_TRUONG || '').trim().toLowerCase() });
// BIN / số TK sai dạng, môi trường lạ = chưa cài (không dựng QR hỏng cho khách quét).
const daCauHinh = () => { const c = cauHinh(); return !!c.id && !!c.khoa && /^\d{6}$/.test(c.bin) && /^[0-9A-Za-z]{1,19}$/.test(c.soTk) && MOI_TRUONG.includes(c.moiTruong); };

async function taoQr({ soTien, noiDung }) {
  const c = cauHinh();
  return { qr: dungVietQr({ bin: c.bin, soTk: c.soTk, soTien, noiDung }), checkout_url: null };
}

/** Đúng chữ ký → 'tho' | 'gon' (cách khớp — ghi nhật ký để sau bỏ cách thừa); sai → null. than = Buffer thân thô. Khoá rỗng → luôn sai. */
function kiemBao(headers, than) {
  const khoa = cauHinh().khoa, ts = String(headers['x-request-timestamp'] || ''), chuKy = headers['x-signature'];
  if (!khoa || !Buffer.isBuffer(than) || typeof chuKy !== 'string' || !DANG_TS.test(ts)) return null;
  const b = Buffer.from(chuKy.toLowerCase());
  const khop = (chuoi) => { const a = Buffer.from(crypto.createHmac('sha512', khoa).update(`${ts}:`).update(chuoi).digest('hex')); return a.length === b.length && crypto.timingSafeEqual(a, b); };
  if (khop(than)) return 'tho';
  let gon = null;
  try { gon = JSON.stringify(JSON.parse(than.toString('utf8'))); } catch { return null; }
  return khop(gon) ? 'gon' : null;
}

/** Thân Webhook biến động số dư → dữ liệu chung của tiền về. transactionDate yyyyMMddHHmmss giờ VN → 'YYYY-MM-DD HH:mm:ss'. */
function docBao(b) {
  const { noiDung, ma } = docNoiDung(b.content);
  const va = String(b.vaAccountNumber ?? '').replace(/\s+/g, '').toUpperCase();
  const d = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(String(b.transactionDate ?? ''));
  return { khoa: `tingee:${b.transactionCode}`, vao: b.type == null || String(b.type).toLowerCase() === 'credit', noiDung, ma, maGd: String(b.transactionCode ?? '').trim() || null,
    soTien: Number(b.amount) || 0, luc: d ? `${d[1]}-${d[2]}-${d[3]} ${d[4]}:${d[5]}:${d[6]}` : null,
    tkKhac: va && va === cauHinh().soTk.toUpperCase() ? null : va || '(trống)' };   // chưa cài số VA + VA rỗng → KHÔNG chốt
}

module.exports = { daCauHinh, taoQr, kiemBao, docBao, NOI_DUNG_SO_HD };
