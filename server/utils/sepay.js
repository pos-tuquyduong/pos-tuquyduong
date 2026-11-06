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
const MA_PHIEN = /TQD(\d{1,6})(?!\d)/i;   // mẫu CŨ TQD<mã phiên> (phiên payOS, phiên tạo trước CK-NOIDUNG-1) — khách thêm chữ quanh mã vẫn khớp
// CK-NOIDUNG-1: nội dung TQD<MMM><DD> HD|APP<4 số> (helpers noiDungCk). Ngân hàng hay bỏ dấu cách / đổi hoa thường / chèn . - _ → chịu được;
// dính thêm chữ số sau 4 số → không khớp. Khớp thì dựng lại chuỗi CHUẨN, so BẰNG với noi_dung đã lưu của phiên (thanh-toan.js).
const MAU_SO_HD = /TQD[\s._-]*([A-Z]{3})[\s._-]*(\d{2})[\s._-]*(HD|APP)[\s._-]*(\d{4})(?!\d)/i;
const NOI_DUNG_SO_HD = true;   // giuCho.js: cổng này ghi nội dung số hoá đơn (VietQR 62/08 cho tới 25 ký tự)

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

/** Nội dung số hoá đơn (rồi mẫu cũ mã phiên) tìm lần lượt trong từng chuỗi → { noiDung (chuỗi CHUẨN) | null, ma | null }. MỘT hàm cho SePay
 *  và Tingee (TINGEE-1: ngân hàng chèn mã VA trước nội dung — mẫu tìm ở bất kỳ đâu trong chuỗi nên vẫn khớp). */
function docNoiDung(...chuoi) {
  const tim = (mau) => chuoi.reduce((kq, c) => kq || mau.exec(String(c ?? '')), null);
  const h = tim(MAU_SO_HD), m = h ? null : tim(MA_PHIEN);
  return { noiDung: h ? `TQD${h[1].toUpperCase()}${h[2]} ${h[3].toUpperCase()}${h[4]}` : null, ma: m ? Number(m[1]) : null };
}

/** Thân báo → dữ liệu chung của tiền về. Nội dung tìm trong `code` (SePay tách sẵn, có thể null) rồi `content`. */
function docBao(b) {
  const tk = String(b.accountNumber ?? '').replace(/\s+/g, '');   // số tài khoản nhận (bỏ khoảng trắng) phải BẰNG SEPAY_SO_TK — tkKhac = số nhận sai, null nếu đúng
  return { khoa: `sepay:${b.id}`, vao: b.transferType === 'in', ...docNoiDung(b.code, b.content), maGd: String(b.referenceCode ?? '').trim() || null, soTien: Number(b.transferAmount) || 0, luc: b.transactionDate,
    tkKhac: tk === cauHinh().soTk ? null : tk || '(trống)' };
}

module.exports = { daCauHinh, taoQr, kiemBao, docBao, docNoiDung, NOI_DUNG_SO_HD };
