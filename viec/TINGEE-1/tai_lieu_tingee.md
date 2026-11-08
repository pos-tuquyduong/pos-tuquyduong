# Tài liệu Tingee — chat đọc và tóm tắt 05.11.2026 (bàn 32) cho TINGEE-1

Nguồn (máy không vào được developers.tingee.vn; chat đọc qua mạng của chat):
- tingee.gitbook.io/tai-lieu-hdsd-va-tich-hop-tingee — mục "6.1. Tích hợp Webhook" (tài liệu HDSD chính thức của Tingee).
- developers.tingee.vn/docs/webhook-ipn (Webhook IPN) và /docs/sdk/webhook (SDK xác thực Webhook).
- tingee.vn (trang chủ — có ví dụ một tin báo đầy đủ).
- developers.tingee.vn/en/docs/payment-gateway/config (cấu hình cổng — IPN URL).

## 1. Tin báo tiền về (Payment Callback — biến động số dư QR & VA)
POST về Webhook URL khai ở app.tingee.vn → Developers (cửa hàng đã liên kết tài khoản ngân hàng).
Header: `x-signature` (HMAC-SHA512, hex) và `x-request-timestamp` (dạng yyyyMMddHHmmssSSS).
Thân JSON, các trường theo tài liệu HDSD:
- `clientId` string — Id merchant
- `transactionCode` string — mã giao dịch (ví dụ trang chủ: "FT26296081245731" — trùng dạng mã giao dịch ngân hàng)
- `amount` number — số tiền
- `content` string — nội dung chuyển khoản
- `bank` string — ngân hàng (ví dụ "BIDV")
- `accountNumber` string — số tài khoản nhận
- `vaAccountNumber` string — số tài khoản ảo (VA), có thể rỗng nếu không dùng VA
- `transactionDate` string — dạng yyyyMMddHHmmss
- `additionalData` list { name, value } — thông tin khác
Ví dụ trên trang chủ tingee.vn còn có `type: "credit"` (tiền vào). → Chỉ xét tiền VÀO; trường `type` có thể vắng — kế hoạch xử lý cả hai.

Ví dụ (trang chủ tingee.vn, rút gọn):
{"transactionCode":"FT26296081245731","amount":250000,"content":"HD2048 THANH TOAN","bank":"BIDV","accountNumber":"0123456789",
 "vaAccountNumber":"TGE0001234","transactionDate":"20261023094112","type":"credit"}

## 2. Chữ ký
- Chuỗi cần băm = `{x-request-timestamp}:{thân tin dạng chuỗi}`; HMAC-SHA512 với Secret Token; so với `x-signature` (hex).
- Mã mẫu SDK / Webhook IPN dùng `JSON.stringify(body)` (Node) / `json.dumps(body, separators=(',', ':'))` (Python) — tức là JSON GỌN, không dấu cách.
- Chat đề xuất: kiểm trên THÂN THÔ trước; nếu không khớp, kiểm thêm trên `JSON.stringify(JSON.parse(thân thô))`; khớp MỘT trong hai là hợp lệ
  (cả hai đều cần Secret Token, nên không mở cửa giả mạo). So sánh an toàn thời gian (timingSafeEqual). Ghi vào nhật ký cách nào khớp (không ghi khoá)
  để sau này bỏ cách thừa.

## 3. Trả lời cho Tingee
- Thân JSON `{ "code": "00", "message": "Success" }` — thành công.
- `"02"` = giao dịch đã được cập nhật thành công trước đó (dùng cho báo LẶP).
- `"09"` = chữ ký không hợp lệ.
- Mã khác = lỗi khác.
- Trả khác "00" / "02" → Tingee gửi lại 5 lần, mỗi lần cách 5 phút. Quá 10 giây không trả lời → gửi lại tối đa 5 lần, cách 1 phút.
  (Trang Webhook IPN ghi lịch khác: 30 giây, 2 phút, 10 phút, 1 giờ, 6 giờ — coi như có thể gửi lại sau NHIỀU GIỜ.)
- Chat đề xuất: HTTP 200 + `{"code":"00"}` khi đã ghi nhận lần đầu; HTTP 200 + `{"code":"02"}` khi báo lặp; sai chữ ký → HTTP 401 + `{"code":"09"}`.

## 4. Gửi lại có ký lại giờ mới không
Tài liệu KHÔNG nói rõ. Vì Tingee có thể gửi lại sau nhiều giờ, ĐỪNG từ chối báo chỉ vì `x-request-timestamp` cũ (cửa sổ 300 giây của SePay có thể làm
mất báo thật khi gửi lại). Chống phát lại bằng khoá sự kiện duy nhất `tingee:<transactionCode>` (báo lặp → "02", không ghi thêm) — chữ ký vẫn bắt
buộc. Nếu muốn giữ một ngưỡng giờ, đặt rộng (vd 24 giờ) và ghi lý do trong kế hoạch.

## 5. QR
Tingee báo biến động số dư của TÀI KHOẢN ĐÃ LIÊN KẾT (chủ quán đã liên kết cùng tài khoản SePay đang dùng, bật "Chuyển khoản VietQR"). → Tự dựng
VietQR như SePay là đúng (đề xuất của máy). Kiểm khớp tài khoản: `accountNumber` == TINGEE_SO_TK (bỏ khoảng trắng); nếu `accountNumber` rỗng mà
`vaAccountNumber` có giá trị thì không chốt, ghi CẦN XEM (chưa dùng VA).

## 6. Địa chỉ Webhook
https://www.pos-tuquyduong.io.vn/api/tingee/webhook (máy đã kiểm cần "www"). Chủ quán đã điền ở trang thiết lập Cổng thanh toán của Tingee (bước cuối).

## 7. Bổ sung 05.11 (chủ quán dán tài liệu đầy đủ — `tingee_tai_lieu_day_du.txt` cùng thư mục, bản 1.2.2)
- **Hai loại Webhook — dùng loại BIẾN ĐỘNG SỐ DƯ.** (a) mục "Webhook" ở sidebar Portal: báo giao dịch của tài khoản liên kết (thân transactionCode,
  amount, content, accountNumber, vaAccountNumber, transactionDate…) — ĐÚNG loại TINGEE-1 cần (QR tự dựng). (b) Webhook của "Cổng thanh toán"
  (Payment Gateway / create-link): thân khác hẳn (requestId, orderId, amount, paidAmount, status, statusCode, providerTransactionCode, paidAt…) —
  KHÔNG dùng. Đường /api/tingee/webhook chỉ cần hiểu (a); gặp thân dạng (b) → trả 200 + code 00, ghi CẦN XEM "dạng tin lạ", không chốt.
- **Cấu hình endpoint ở Portal** (chủ quán làm): Phạm vi sự kiện = QR Code, Loại áp dụng = Tất cả; Retry bật (timeout tối đa 10 giây, số lần 1–5,
  khoảng chờ 2–3600 giây); **Kiểu chứng thực = API Credentials** (Tingee ký x-signature / x-request-timestamp — các lựa chọn None / API Key KHÔNG
  được dùng). Có "Kiểm tra kết nối" — đường phải trả 200 cho tin thử (kế hoạch nêu cách nhận ra tin thử).
- **STK gốc hay tài khoản ảo (VA) — tuỳ NGÂN HÀNG + LOẠI TÀI KHOẢN.** Chỉ ACB, TPBank, VPBank (cá nhân / DN), OCB (DN / HKD), VietinBank (cá nhân /
  HKD), PGBank, Co-opBank liên kết được số tài khoản gốc. Ngân hàng khác: Tingee CHỈ báo khi tiền chuyển vào số VA Tingee cấp; chuyển vào số gốc →
  không có Webhook. ⇒ QR tự dựng phải trỏ vào số Tingee báo trong "Tài khoản nhận tiền" (VA nếu có) + đúng BIN; khớp tài khoản theo `vaAccountNumber`
  khi dùng VA, `accountNumber` khi dùng STK gốc. Biến môi trường: `TINGEE_SO_TK` = số khách chuyển vào (VA hoặc gốc), `TINGEE_BIN` = BIN của số đó.
  Chủ quán đang hỏi lại ngân hàng / loại tài khoản — kế hoạch viết để chạy được cả hai trường hợp.
- **VietinBank không gửi nội dung chuyển khoản** → không khớp được theo nội dung (chỉ CẦN XEM). Một số ngân hàng (vd MBBank) cho khách sửa số tiền /
  nội dung khi quét → khớp theo số tiền + nội dung THỰC NHẬN (luật hiện có đã làm vậy).
- QR động của Tingee (/v1/create-va, billId) chỉ có ở một số ngân hàng / loại tài khoản — CHƯA dùng; giữ QR tự dựng (QR tĩnh có số tiền + nội dung).
- Gọi API Tingee: luôn HTTP 200, xem trường `code` ("00" = thành công); mã lỗi chữ ký 90 / 91 / 92 / 97.
