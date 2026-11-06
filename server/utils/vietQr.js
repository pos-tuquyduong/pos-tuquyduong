/**
 * SEPAY-1 — dựng chuỗi VietQR (chuẩn EMVCo MPM theo NAPAS) cho chuyển khoản có số tiền + nội dung. Hàm thuần, không gọi mạng.
 * Trường: 00 phiên bản · 01 "12" (QR động, có số tiền) · 38 tài khoản NAPAS (00 AID, 01 {00 BIN, 01 số TK}, 02 dịch vụ chuyển nhanh đến TK)
 * · 53 tiền tệ 704 (VND) · 54 số tiền · 58 VN · 62/08 nội dung · 63 CRC-16/CCITT-FALSE (đa thức 0x1021, khởi 0xFFFF) trên cả chuỗi kèm "6304".
 */
const AID_NAPAS = 'A000000727';
const DICH_VU_DEN_TK = 'QRIBFTTA';

const truong = (id, giaTri) => id + String(giaTri.length).padStart(2, '0') + giaTri;

function crc16(chuoi) {
  let c = 0xffff;
  for (const byte of Buffer.from(chuoi, 'utf8')) {
    c ^= byte << 8;
    for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
  }
  return c.toString(16).toUpperCase().padStart(4, '0');
}

/** soTien: số nguyên đồng > 0; noiDung: chữ không dấu (mã phiên TQD<id>). */
function dungVietQr({ bin, soTk, soTien, noiDung }) {
  const taiKhoan = truong('00', AID_NAPAS) + truong('01', truong('00', bin) + truong('01', soTk)) + truong('02', DICH_VU_DEN_TK);
  const than = truong('00', '01') + truong('01', '12') + truong('38', taiKhoan) + truong('53', '704') + truong('54', String(soTien))
    + truong('58', 'VN') + truong('62', truong('08', noiDung)) + '6304';
  return than + crc16(than);
}

module.exports = { dungVietQr };
