# Cài SePay cho quầy — hướng dẫn cho chủ quán (SEPAY-1)

**Việc này là gì:** sau khi gộp SEPAY-1, quầy và App có thể thu tiền QR qua SePay (phí thấp hơn payOS). Máy chủ tự vẽ mã QR chuyển khoản tới
tài khoản quán; khi tiền về, SePay báo cho máy chủ và đơn tự chốt — y như payOS hôm nay. payOS vẫn còn nguyên, bật lại bằng một biến.

**Gộp xong mà chưa làm các bước dưới:** quầy vẫn chạy payOS như hôm nay (mặc định là payOS — bạn đã chốt 01.11).

## 1. Trên trang SePay (my.sepay.vn)

1. Liên kết tài khoản ngân hàng nhận tiền của quán (nếu chưa).
2. **Cấu trúc mã thanh toán** (trong phần cấu hình công ty của SePay — tên menu theo trang SePay, máy chưa đọc được trang): tiền tố `TQD`, phần sau là **số**, dài 1 đến 6 chữ số. (Máy chủ ghi nội dung chuyển khoản
   dạng `TQD123`.)
3. **Tích hợp webhook → Thêm webhook:**
   - Địa chỉ gọi: `https://www.pos-tuquyduong.io.vn/api/sepay/webhook`
   - Kiểu nội dung: `application/json`
   - Sự kiện: **chỉ tiền vào**
   - **Bỏ qua giao dịch không có mã thanh toán:** bật (theo phiếu — xem mục 5 điều này có nghĩa gì)
   - Bảo mật / xác thực: **HMAC-SHA256** → SePay hiện **Secret Key** đúng MỘT lần: chép ngay vào ô `SEPAY_KHOA_WEBHOOK` ở Render (bước 2).
     Không dán khoá vào chat, tin nhắn hay file nào khác.

## 2. Trên Render (Environment của dịch vụ POS)

| Tên biến | Điền gì |
|---|---|
| `SEPAY_BIN` | mã BIN của ngân hàng nhận tiền — đúng 6 chữ số (tra bảng BIN VietQR của ngân hàng; vd Vietcombank, BIDV… mỗi ngân hàng một mã) |
| `SEPAY_SO_TK` | số tài khoản nhận tiền, chỉ chữ số / chữ, không dấu cách |
| `SEPAY_KHOA_WEBHOOK` | Secret Key vừa chép ở bước 1.3 |
| `CONG_QR` | `sepay` — chỉ đặt SAU khi đã thử xong bước 3 |

Thiếu hoặc sai dạng một trong ba biến SePay mà `CONG_QR=sepay` → quầy báo "Chưa cài cổng QR chuyển khoản" (mã `PAYOS_CHUA_CAU_HINH`) và
dùng QR tĩnh + xác nhận tay như khi payOS chưa cài. Không mất tiền, chỉ chậm.

## 3. Thử một đơn 2.000đ trước khi bỏ payOS

1. Render: điền `SEPAY_BIN`, `SEPAY_SO_TK`, `SEPAY_KHOA_WEBHOOK`, đặt `CONG_QR=sepay`, lưu (Render khởi động lại ~1 phút).
2. Tạm đặt một món giá 2.000đ (ở chỗ bạn vẫn sửa giá món; thử xong trả giá cũ). Quầy: bán đúng món đó, chọn QR.
3. Dùng app ngân hàng quét QR: tên tài khoản phải là của quán, số tiền 2.000, nội dung `TQD…` — **không sửa nội dung**, chuyển.
4. Trong khoảng 5–30 giây màn quầy phải tự báo đã thu và in bill. Quản lý → Đối soát hôm nay KHÔNG có dòng đỏ "SePay giao dịch…".
5. Không tự chốt sau 1 phút → mở trang SePay xem lịch sử webhook của giao dịch đó (mã trả về): 401 = khoá sai → dán lại Secret Key; 404 =
   địa chỉ sai. Trong lúc đó xác nhận tay đơn thử như bình thường.

## 4. Quay về payOS (một bước)

Render: đặt `CONG_QR=payos` (hoặc xoá biến). **Giữ nguyên ba biến SePay ít nhất một ngày**: QR SePay khách quét trước lúc đổi mà trả trong
hạn 10 phút vẫn tự chốt; trả muộn hơn thì (như payOS) không tạo đơn nhưng vẫn được ghi vào Đối soát để hoàn / nạp. Xoá khoá thì báo SePay bị
từ chối: không tự chốt, không có dấu vết trong Đối soát.

**Khi đã quay về payOS lâu dài:** tắt webhook trên trang SePay. Nếu để cả hai cổng cùng theo dõi một tài khoản, một lần chuyển khoản có thể được
báo hai lần (payOS và SePay): đơn vẫn chỉ tạo MỘT lần, báo thứ hai hiện ở Đối soát mục CẦN XEM (vàng, không phải đỏ) dòng "đã chốt bằng
báo payOS … cùng một khoản báo qua hai cổng: đối chiếu sao kê, KHÔNG hoàn" — **không hoàn tiền** cho dòng đó. Việc này cũng xảy ra trong lúc
cài (bước 1 bật webhook SePay khi quầy còn chạy payOS) — bình thường, không hoàn.

## 5. Điều nên biết

- Khách **xoá** mã `TQD…` khỏi nội dung khi chuyển → vì đã bật "Bỏ qua giao dịch không có mã thanh toán", SePay KHÔNG báo về máy chủ: đơn không
  tự chốt và Đối soát KHÔNG có dòng nào cho khoản đó. Nhân viên xem app ngân hàng của quán rồi quản lý xác nhận tay (như hôm nay). Đơn App mà
  khách xoá mã → hết 10 phút đơn thành "đã huỷ", App KHÔNG báo "quán đã nhận tiền" — khách phải gọi quán. Khách chỉ **thêm chữ** quanh mã
  (vd "CK TQD123 tra sua") thì vẫn tự chốt.
- Chuyển thiếu / dư, chuyển sau khi QR hết hạn 10 phút, hoặc sau khi đơn đã huỷ → không tạo đơn, Đối soát hiện dòng đỏ để hoàn hoặc nạp vào tài
  khoản khách — như payOS.
- Máy chủ KHÔNG so số tài khoản trong báo SePay với `SEPAY_SO_TK` (chữ ký đã chống báo giả; so số dễ lệch định dạng làm mọi QR phải xác nhận tay).
- Chữ "Chuyển khoản (payOS)" trên bill in là chữ mặc định của cài đặt chữ hoá đơn (khoá `invoice_chu_ck`): đổi ở phần cài đặt chữ hoá đơn, vd "Chuyển khoản".
