/**
 * SEPAY-1 — cổng QR SePay. SePay KHÔNG tạo lệnh thu: POS tự dựng VietQR (vietQr.js) tới tài khoản quán, SePay theo dõi tài khoản và gửi
 * webhook cho mỗi giao dịch. Biến môi trường (đọc lúc gọi, không bao giờ ghi vào log / câu trả): SEPAY_BIN (mã BIN ngân hàng, 6 số),
 * SEPAY_SO_TK (số tài khoản nhận), SEPAY_KHOA_WEBHOOK (khoá bí mật HMAC-SHA256 của webhook).
 * Xác thực theo developer.sepay.vn (viec/SEPAY-1/tai_lieu_sepay.md): X-SePay-Signature = "sha256=" + hex HMAC-SHA256(khoá, ts + "." + thân THÔ),
 * X-SePay-Timestamp = giây Unix; lệch giờ máy chủ quá LECH_TOI_DA_GIAY (cả hai phía) → từ chối.
 */
const crypto = require('crypto');
const { dungVietQr } = require('./vietQr');

const LECH_TOI_DA_GIAY = 300;
const MA_PHIEN = /TQD(\d{1,6})(?!\d)/i;   // nội dung CK = TQD<mã phiên> (giuCho.js) — khách thêm chữ quanh mã vẫn khớp

const cauHinh = () => ({ bin: (process.env.SEPAY_BIN || '').trim(), soTk: (process.env.SEPAY_SO_TK || '').trim(), khoa: process.env.SEPAY_KHOA_WEBHOOK || '' });
// BIN / số TK sai dạng = chưa cài (không dựng QR hỏng cho khách quét).
const daCauHinh = () => { const c = cauHinh(); return /^\d{6}$/.test(c.bin) && /^[0-9A-Za-z]{1,19}$/.test(c.soTk) && !!c.khoa; };

async function taoQr({ soTien, noiDung }) {
  const c = cauHinh();
  return { qr: dungVietQr({ bin: c.bin, soTk: c.soTk, soTien, noiDung }), checkout_url: null };
}

/** Báo đúng chữ ký + mốc giờ còn hạn. than = Buffer thân thô. Khoá rỗng → luôn sai. */
function kiemBao(headers, than, giayBayGio = Date.now() / 1000) {
  const khoa = cauHinh().khoa, ts = String(headers['x-sepay-timestamp'] || ''), chuKy = headers['x-sepay-signature'];
  if (!khoa || !Buffer.isBuffer(than) || typeof chuKy !== 'string' || !/^\d{1,12}$/.test(ts)
    || Math.abs(giayBayGio - Number(ts)) > LECH_TOI_DA_GIAY) return false;
  const a = Buffer.from('sha256=' + crypto.createHmac('sha256', khoa).update(ts + '.').update(than).digest('hex')), b = Buffer.from(chuKy);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Thân báo → dữ liệu chung của tiền về. Mã phiên tìm trong `code` (SePay tách sẵn, có thể null) rồi tới `content`. */
function docBao(b) {
  const m = MA_PHIEN.exec(String(b.code ?? '')) || MA_PHIEN.exec(String(b.content ?? ''));
  return { khoa: `sepay:${b.id}`, vao: b.transferType === 'in', ma: m ? Number(m[1]) : null, soTien: Number(b.transferAmount) || 0, luc: b.transactionDate };
}

module.exports = { daCauHinh, taoQr, kiemBao, docBao };
