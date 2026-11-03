/**
 * SEPAY-1 — MỘT chỗ chọn cổng QR tự xác nhận (phiên cach = 'payos'). Biến môi trường CONG_QR: 'sepay' | 'payos'; không đặt → payOS (chủ quán
 * chốt 01.11). Giá trị lạ → null = coi như chưa cài (503 PAYOS_CHUA_CAU_HINH), không đoán. Mỗi cổng: daCauHinh() · taoQr({ id, soTien, noiDung,
 * hetGiay }) → { qr, checkout_url }. Webhook của CẢ HAI cổng luôn mở: phiên tạo trước khi đổi công tắc vẫn chốt được khi tiền về trong hạn.
 */
const CONG = { payos: require('./payos'), sepay: require('./sepay') };
const MAC_DINH = 'payos';

// Một khoản báo qua CẢ HAI cổng (một tài khoản, cả payOS lẫn SePay theo dõi): báo tới sau ghi chua_khop có cụm này; Đối soát xếp CẦN XEM.
const LY_DO_HAI_CONG = 'cùng một khoản báo qua hai cổng';
// Tiền SePay về TÀI KHOẢN KHÁC với SEPAY_SO_TK (sổ QUYET_DINH 01.11 Q5): không chốt đơn, ghi chua_khop có cụm này + số nhận; Đối soát xếp CẦN XEM.
const LY_DO_TK_KHAC = 'tiền vào tài khoản khác';
// Cổng của một dòng pos_payos_su_kien suy từ khoá: SePay 'sepay:<id giao dịch>' (sepay.js docBao), payOS '<orderCode>:<reference>'.
const congCuaKhoa = (khoa) => (String(khoa).startsWith('sepay:') ? 'sepay' : 'payos');

const congQr = () => { const ten = (process.env.CONG_QR || MAC_DINH).trim().toLowerCase(); return Object.hasOwn(CONG, ten) ? CONG[ten] : null; };

module.exports = { congQr, LY_DO_HAI_CONG, LY_DO_TK_KHAC, congCuaKhoa };
