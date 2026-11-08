/**
 * SEPAY-1 — MỘT chỗ chọn cổng QR tự xác nhận (phiên cach = 'payos'). Biến môi trường CONG_QR: 'sepay' | 'payos' | 'tingee' (TINGEE-1); không
 * đặt → payOS (chủ quán chốt 01.11). Giá trị lạ → null = coi như chưa cài (503 PAYOS_CHUA_CAU_HINH), không đoán. Mỗi cổng: daCauHinh() ·
 * taoQr({ id, soTien, noiDung, hetGiay }) → { qr, checkout_url }. Webhook của MỌI cổng luôn mở: phiên tạo trước khi đổi công tắc vẫn chốt được.
 */
const CONG = { payos: require('./payos'), sepay: require('./sepay'), tingee: require('./tingee') };
const MAC_DINH = 'payos';
// Tên cổng cho người đọc (lý do chua_khop, Đối soát, Cài đặt) — MỘT bảng; cổng mới thêm ở CONG thì thêm ở đây.
const TEN_CONG = { payos: 'payOS', sepay: 'SePay', tingee: 'Tingee' };

// Một khoản báo qua HAI cổng (cùng một phiên, hai cổng cùng báo): báo tới sau ghi chua_khop có cụm này; Đối soát xếp CẦN XEM.
const LY_DO_HAI_CONG = 'cùng một khoản báo qua hai cổng';
// Tiền về TÀI KHOẢN KHÁC với SEPAY_SO_TK / TINGEE_SO_TK (sổ QUYET_DINH 01.11 Q5; Tingee so số VA): không chốt đơn, ghi chua_khop có cụm này + số nhận; Đối soát xếp CẦN XEM.
const LY_DO_TK_KHAC = 'tiền vào tài khoản khác';
// CK-NOIDUNG-1 (Q1b + chủ quán 05.11 lượt 2): tiền về cho phiên App đã huỷ / hết hạn / lỗi vì đơn → ket_qua 'vao_vi' + cụm này + SĐT; tiền đã
// cộng vào ví khách; Đối soát xếp CẦN XEM.
const LY_DO_VAO_VI = 'đã cộng vào tài khoản';
// Cổng của một dòng pos_payos_su_kien suy từ khoá: SePay 'sepay:<id giao dịch>', Tingee 'tingee:<transactionCode>' (docBao từng cổng),
// payOS '<orderCode>:<reference>' (orderCode là số — không bao giờ trùng tiền tố chữ).
const congCuaKhoa = (khoa) => { const t = String(khoa).split(':')[0]; return t === 'sepay' || t === 'tingee' ? t : 'payos'; };

const tenCongQr = () => (process.env.CONG_QR || MAC_DINH).trim().toLowerCase();
const congQr = () => (Object.hasOwn(CONG, tenCongQr()) ? CONG[tenCongQr()] : null);

module.exports = { congQr, tenCongQr, TEN_CONG, LY_DO_HAI_CONG, LY_DO_TK_KHAC, LY_DO_VAO_VI, congCuaKhoa };
