# Tài liệu SePay — phần Webhook + Xác thực HMAC-SHA256 (chat POS lấy 01.11.2026)

Nguồn (chat đọc bằng công cụ web ngày 01.11.2026 — máy mây không mở được hai tên miền này):
- https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook
- https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc
- https://developer.sepay.vn/vi/sepay-webhooks/bao-mat
Bản dưới là tóm tắt kỹ thuật (chat viết lại), không phải bản chép nguyên trang. Chỗ nào tài liệu không nói, ghi rõ "TÀI LIỆU KHÔNG NÓI".

## 1. SePay gọi về thế nào
- Mỗi giao dịch khớp cấu hình webhook → SePay gửi `POST` tới địa chỉ đã cài. Mặc định `Content-Type: application/json`
  (có thể cài form-urlencoded / multipart — quán dùng JSON).
- Một giao dịch có thể tới NHIỀU LẦN: tự gửi lại khi lỗi (tối đa 7 lần, kéo dài khoảng 33 phút), người quản trị bấm gửi lại
  thủ công (kể cả bản đã thành công), hoặc nhiều webhook trỏ cùng địa chỉ. → BẮT BUỘC chống trùng theo `id`.

## 2. Thân báo (JSON)
| Trường | Kiểu | Rỗng / null? | Ý nghĩa |
|---|---|---|---|
| `id` | số nguyên | không | Mã giao dịch phía SePay; KHÔNG đổi qua mọi lần gửi lại → dùng làm khoá chống trùng |
| `gateway` | chuỗi | không | Tên ngân hàng (vd Vietcombank, BIDV, TPBank) |
| `transactionDate` | chuỗi | không | `YYYY-MM-DD HH:mm:ss`, giờ Việt Nam |
| `accountNumber` | chuỗi | không | Số tài khoản nhận |
| `subAccount` | chuỗi | có thể `""` | Tài khoản ảo (VA) khớp; `""` nếu không khớp |
| `code` | chuỗi | có thể `null` | Mã thanh toán SePay tách từ nội dung theo "Cấu trúc mã thanh toán" (quán đặt tiền tố `TQD`); `null` = không khớp |
| `content` | chuỗi | không | Nội dung chuyển khoản gốc từ ngân hàng |
| `transferType` | chuỗi | không | `in` (tiền vào) hoặc `out` (tiền ra) — chỉ xử lý `in` |
| `description` | chuỗi | có thể `""` | Mô tả đầy đủ từ ngân hàng (có ngân hàng không gửi) |
| `transferAmount` | số nguyên | không | Số tiền VNĐ, luôn dương |
| `accumulated` | số nguyên | có thể `0` | Số dư sau giao dịch (có ngân hàng không gửi → 0) |
| `referenceCode` | chuỗi | có thể `""` | Mã tham chiếu ngân hàng |

Ví dụ hình dạng (số liệu bịa):
```json
{"id":92704,"gateway":"Vietcombank","transactionDate":"2024-07-02 11:08:33","accountNumber":"1017588888","subAccount":"",
 "code":"TQD123","content":"TQD123 chuyen tien","transferType":"in","description":"NGUYEN VAN A chuyen tien",
 "transferAmount":50000,"accumulated":105000000,"referenceCode":"FT24012345678"}
```
Lưu ý: `code === null` khác `code === ""` — kiểm bằng `=== null`, không dùng `if (code)`.

## 3. Trả lời thế nào thì SePay coi là thành công
Đủ CẢ BA: HTTP 200 hoặc 201 · thân JSON đúng `{"success": true}` · trong vòng 30 giây.
Mọi thứ khác (202, chuyển hướng, 4xx, 5xx, thân khác hoặc rỗng, quá 30 giây) = thất bại → SePay gửi lại.
Báo trùng (đã xử lý rồi) → vẫn trả `200 {"success": true}` để SePay thôi gửi lại.
TÀI LIỆU KHÔNG NÓI: nên trả gì khi chữ ký sai — mẫu của SePay trả `401` + `{"success": false, ...}` (SePay sẽ gửi lại theo lịch, vô hại).

## 4. Xác thực HMAC-SHA256 (cách quán dùng)
Header SePay gửi:
- `X-SePay-Signature`: dạng `sha256=<hex>`
- `X-SePay-Timestamp`: giây Unix lúc ký (chuỗi số)

SePay ký:
1. lấy giây Unix hiện tại `ts`;
2. ghép chuỗi `ts + "." + <thân THÔ, đúng từng byte>`;
3. HMAC-SHA256 với Secret Key → hex thường;
4. gửi `sha256=<hex>` và `ts` ở hai header trên.

Máy chủ kiểm:
- Đọc THÂN THÔ trước khi bất kỳ bộ phân tích JSON nào chạm vào (Express: `express.raw({ type: 'application/json' })` cho riêng
  route này). Không được `JSON.stringify(req.body)` rồi ký lại — lệch thứ tự khoá, khoảng trắng, cách thoát Unicode.
- Từ chối khi `|giờ máy chủ − ts| > 300 giây` (chống gửi lại báo cũ).
- So `sha256=` + HMAC tự tính với header bằng phép so sánh thời gian hằng (`crypto.timingSafeEqual`, cùng độ dài trước khi so).
- Khoá bí mật để trong biến môi trường (tài liệu gợi ý tên `SEPAY_WEBHOOK_SECRET`; tên thật theo kế hoạch SEPAY-1). SePay chỉ
  hiện khoá đầy đủ MỘT lần lúc tạo; sau đó chỉ thấy 4 ký tự cuối.
- Webhook form-encoded thì SePay ký chuỗi form-encoded thô — quán dùng JSON nên không áp dụng.

Mẫu Node (chat viết theo công thức trên, máy tự viết bản thật + bài thử):
```js
const crypto = require('crypto');
function kyDung(than, ts, chuKy, khoa) {
  if (!/^\d+$/.test(String(ts)) || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const mong = 'sha256=' + crypto.createHmac('sha256', khoa).update(String(ts) + '.' + than).digest('hex');
  const a = Buffer.from(mong), b = Buffer.from(String(chuKy || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
```

## 5. Bảo mật khác tài liệu khuyên
HTTPS hợp lệ (Render có sẵn) · luôn kiểm chữ ký · có thể chặn theo danh sách IP SePay (trang https://developer.sepay.vn/vi/dia-chi-ip —
TÙY CHỌN, phiếu SEPAY-1 không bắt buộc) · kiểm số tiền + số tài khoản nhận khớp · chống trùng · đối soát định kỳ.

## 6. Các cách xác thực khác (quán KHÔNG dùng)
"Không xác thực" (chỉ để thử), "API Key" (`Authorization: Apikey <khoá>` — không chống sửa thân báo), "OAuth 2.0". Quán chọn HMAC-SHA256
ở bước Bảo mật khi tạo webhook.
