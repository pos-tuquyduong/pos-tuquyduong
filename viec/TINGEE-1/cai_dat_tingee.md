# Cài cổng QR Tingee — hướng dẫn chủ quán (TINGEE-1)

**Việc này là gì:** đổi chỗ báo "tiền đã về" từ SePay sang Tingee. Khách vẫn quét QR ở quầy / App như cũ; QR mới trỏ vào **số tài khoản ảo
(VA) của Tingee** (dạng VQR…), vì tài khoản MB hộ kinh doanh chỉ được Tingee báo khi tiền vào số VA. Tiền chuyển vào số gốc thì Tingee KHÔNG báo.

**Đổi lại lúc nào cũng được:** chỉ một biến `CONG_QR` trên Render. Lưu ý: bạn ĐÃ GỠ Webhook ở SePay (phiếu 05.11) — đổi lại `sepay` thì QR
về tài khoản cũ nhưng KHÔNG còn tự báo tiền về: mọi đơn QR phải xác nhận tay, cho tới khi khai lại Webhook SePay (`viec/SEPAY-1/cai_dat_sepay.md`).

## Bạn cần làm (theo thứ tự)

1. **Render → Environment** — cài 5 biến (bạn báo 06.11 đã cài `TINGEE_SO_TK` và `TINGEE_BIN` — kiểm lại đúng giá trị):
   - `TINGEE_SO_TK` = số VA (dạng VQR…, đúng như Tingee ghi ở "Tài khoản nhận tiền", viết liền, không dấu cách)
   - `TINGEE_BIN` = `970422` (MB Bank)
   - `TINGEE_CLIENT_ID` = Client ID ở app.tingee.vn → API Credentials
   - `TINGEE_SECRET_TOKEN` = Secret Token cùng chỗ (khoá bí mật — chỉ dán vào Render, không gửi qua chat)
   - `TINGEE_MOI_TRUONG` = `production` (không đặt cũng là production)
   - CHƯA đổi `CONG_QR` ở bước này.
2. **app.tingee.vn → mục Webhook** (thanh bên trái):
   - URL: `https://www.pos-tuquyduong.io.vn/api/tingee/webhook` (có `www`)
   - Phạm vi sự kiện: **QR Code** · Loại áp dụng: Tất cả
   - Kiểu chứng thực: **API Credentials** (không chọn None / API Key)
   - Bật gửi lại (Retry), lưu. Bấm "Kiểm tra kết nối": Tingee KÝ tin thử thì máy chủ trả "00" (Đối soát có một dòng "tin thử kết nối" ở CẦN XEM, bỏ qua được);
     Portal báo lỗi 401 / "09" nghĩa là tin thử không mang chữ ký — không sao, làm tiếp bước 3–5 (đơn thử 2.000đ mới là phép thử thật).
3. Chọn lúc **ngoài giờ bán**: Render → đặt `CONG_QR=tingee`, chờ Render khởi động lại (~1 phút).
4. Tạo **một đơn thử 2.000đ** trả bằng QR, tự quét bằng app ngân hàng và trả.
5. Nhìn màn QR:
   - **Tự báo "đã thu" trong vài giây** → xong, giữ `CONG_QR=tingee`. Màn Cài đặt hiện "Cổng QR: Tingee ✓".
   - **Không thấy sau 1 phút** → đổi lại `CONG_QR=sepay` NGAY (QR về tài khoản cũ; đơn QR xác nhận tay vì Webhook SePay đã gỡ), xác nhận tay đơn thử, báo chat (Đối soát hoặc lịch sử Webhook của Tingee có lý do).

## Máy làm gì khi tiền về
- Chỉ tin báo có chữ ký đúng (HMAC-SHA512 bằng Secret Token); sai chữ ký → từ chối, không ghi gì.
- Khớp đơn theo nội dung chuyển khoản (TQD… HD… / APP…) — ngân hàng chèn mã VA ở đầu nội dung vẫn khớp; đúng số tiền; đúng hạn QR.
- Tiền vào số khác số VA đã cài → không chốt đơn, Đối soát ghi "tiền vào tài khoản khác" ở CẦN XEM.
- Tingee gửi lại cùng một giao dịch → chỉ tính một lần.
- Một khoản báo qua hai cổng (SePay + Tingee) → không cộng ví hai lần; Đối soát CẦN XEM.
