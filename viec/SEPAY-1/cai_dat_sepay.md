# Cài SePay cho quầy — hướng dẫn cho chủ quán (SEPAY-1)

**Việc này là gì:** sau khi gộp SEPAY-1, quầy và App có thể thu tiền QR qua SePay (phí thấp hơn payOS). Máy chủ tự vẽ mã QR chuyển khoản tới
tài khoản quán; khi tiền về, SePay báo cho máy chủ và đơn tự chốt — y như payOS hôm nay. payOS vẫn còn trong code (bật lại theo mục 4 — nhớ tắt webhook SePay trước).

**Gộp xong mà chưa làm các bước dưới:** công tắc mặc định vẫn là payOS (bạn chốt 01.11). Kênh payOS đã xoá 03.11 nên cho tới khi làm xong mục 1–3 và đặt `CONG_QR=sepay`, QR tự chốt không chạy: quầy dùng QR tĩnh + xác nhận tay.

## 1. Trên trang SePay (my.sepay.vn)

1. Liên kết tài khoản ngân hàng nhận tiền của quán (nếu chưa).
2. **Cấu trúc mã thanh toán** (trong phần cấu hình công ty của SePay — tên menu theo trang SePay, máy chưa đọc được trang): tiền tố `TQD`, phần sau là **số**, dài 1 đến 6 chữ số. (Máy chủ ghi nội dung chuyển khoản
   dạng `TQD123`.)
3. **Tích hợp webhook → Thêm webhook:**
   - Địa chỉ gọi: `https://www.pos-tuquyduong.io.vn/api/sepay/webhook`
   - Kiểu nội dung: `application/json`
   - Sự kiện: **chỉ tiền vào**
   - **Bỏ qua giao dịch không có mã thanh toán:** TẮT (chủ quán chốt 01.11 — khoản không có mã vẫn báo về máy chủ, hiện ở Đối soát mục CẦN XEM; xem mục 5)
   - Bảo mật / xác thực: **HMAC-SHA256** → SePay hiện **Secret Key** đúng MỘT lần: chép ngay vào ô `SEPAY_KHOA_WEBHOOK` ở Render (bước 2).
     Không dán khoá vào chat, tin nhắn hay file nào khác.

## 2. Trên Render (Environment của dịch vụ POS)

| Tên biến | Điền gì |
|---|---|
| `SEPAY_BIN` | mã BIN của ngân hàng nhận tiền — đúng 6 chữ số (tra bảng BIN VietQR của ngân hàng; vd Vietcombank, BIDV… mỗi ngân hàng một mã) |
| `SEPAY_SO_TK` | số tài khoản nhận tiền, chỉ chữ số / chữ, không dấu cách |
| `SEPAY_KHOA_WEBHOOK` | Secret Key vừa chép ở bước 1.3 |
| `CONG_QR` | `sepay` — đặt ở bước 3.1 khi bắt đầu thử (thử không được thì xem mục 4 trước khi đổi cổng) |

Thiếu hoặc sai dạng một trong ba biến SePay mà `CONG_QR=sepay` → quầy báo "Chưa cài cổng QR chuyển khoản" (mã `PAYOS_CHUA_CAU_HINH`) và
dùng QR tĩnh + xác nhận tay như khi payOS chưa cài. Không mất tiền, chỉ chậm.

## 3. Thử một đơn 2.000đ

1. Render: điền `SEPAY_BIN`, `SEPAY_SO_TK`, `SEPAY_KHOA_WEBHOOK`, đặt `CONG_QR=sepay`, lưu (Render khởi động lại ~1 phút).
2. Tạm đặt một món giá 2.000đ (ở chỗ bạn vẫn sửa giá món; thử xong trả giá cũ). Quầy: bán đúng món đó, chọn QR.
3. Dùng app ngân hàng quét QR: tên tài khoản phải là của quán, số tiền 2.000, nội dung `TQD…` — **không sửa nội dung**, chuyển.
4. Sau khi chuyển, chờ vài chục giây: màn quầy phải tự báo đã thu và in bill. Quản lý → Đối soát hôm nay KHÔNG có dòng đỏ "SePay giao dịch…".
5. Không tự chốt sau 1–2 phút → mở trang SePay xem lịch sử webhook của giao dịch đó (mã trả về): 401 = chữ ký không qua (thường là khoá sai →
   dán lại Secret Key; hiếm hơn là đồng hồ hai bên lệch quá 5 phút); 404 = địa chỉ sai. Trong lúc đó xác nhận tay đơn thử như bình thường.

## 4. Chỉ MỘT cổng được bật webhook — payOS và SePay không bao giờ cùng bật (chủ quán chốt 03.11)

Ngày 03.11 bạn đã **xoá kênh thanh toán trên payOS**, quầy chỉ dùng SePay. Vì vậy:

- **Muốn bật lại payOS** (tạo lại kênh, điền khoá payOS, đặt `CONG_QR=payos`): **TẮT webhook SePay trên trang SePay TRƯỚC**, rồi mới bật payOS.
- **Muốn dùng lại SePay sau khi đã bật payOS:** **TẮT webhook payOS TRƯỚC**, rồi mới bật webhook SePay và đặt `CONG_QR=sepay`.
- Lý do: nếu cả hai cùng theo dõi một tài khoản, một lần chuyển khoản bị báo hai lần. Khoản tạo được đơn thì máy gộp đúng (một dòng vàng, KHÔNG
  hoàn). Nhưng khoản KHÔNG tạo đơn (chuyển lệch số, trả muộn quá 10 phút, trả sau khi đã huỷ, chuyển thêm lần nữa) có thể hiện **HAI dòng đỏ** ở
  Đối soát cho CÙNG một khoản — **đừng hoàn hai lần**: đối chiếu sao kê ngân hàng, mỗi lần chuyển thật chỉ hoàn một lần.
- Máy KHÔNG khoá được điều này bằng code (chủ quán chấp nhận rủi ro còn lại — xem `trang_thai.md`, Q6), nên đây là bước làm tay bắt buộc.
- Đổi cổng thì giữ nguyên ba biến cổng cũ ít nhất một ngày: QR khách quét trước lúc đổi mà trả trong hạn 10 phút vẫn tự chốt. Xoá khoá thì báo bị
  từ chối: không tự chốt, không có dấu vết trong Đối soát.

## 5. Điều nên biết

- Khách **xoá** mã `TQD…` khỏi nội dung khi chuyển → vì đã TẮT "Bỏ qua giao dịch không có mã thanh toán", SePay VẪN báo về máy chủ: đơn không
  tự chốt, nhưng Đối soát (mục CẦN XEM) có dòng "không thuộc phiên nào" cho khoản đó. Nhân viên đối chiếu app ngân hàng rồi quản lý xác nhận tay. Mọi tiền vào
  tài khoản (kể cả không liên quan đơn) cũng hiện ở CẦN XEM — nhiều dòng hơn nhưng không sót tiền. Đơn App mà
  khách xoá mã → hết 10 phút đơn thành "đã huỷ", App KHÔNG báo "quán đã nhận tiền" — khách phải gọi quán. Khách chỉ **thêm chữ** quanh mã
  (vd "CK TQD123 tra sua") thì vẫn tự chốt.
- Chuyển thiếu / dư, chuyển sau khi QR hết hạn 10 phút, hoặc sau khi đơn đã huỷ → không tạo đơn, Đối soát hiện dòng đỏ để hoàn hoặc nạp vào tài
  khoản khách — như payOS.
- Máy chủ SO số tài khoản nhận trong báo SePay (`accountNumber`, bỏ khoảng trắng) với `SEPAY_SO_TK` (chủ quán chốt 01.11). Khác hoặc báo thiếu số → KHÔNG chốt
  đơn; Đối soát mục CẦN XEM hiện "chưa khớp đơn — tiền vào tài khoản khác <số>": đối chiếu sao kê, tiền đã vào tài khoản đó thật nên không tự hoàn.
  Nếu SePay của quán theo dõi nhiều tài khoản, `SEPAY_SO_TK` phải đúng tài khoản in trên QR. Mọi đơn QR đều phải xác nhận tay mà Đối soát toàn dòng
  "tài khoản khác" → xem `SEPAY_SO_TK` có đúng số tài khoản SePay đang báo (`accountNumber`) không.
- Chữ "Chuyển khoản (payOS)" trên bill in là chữ mặc định của cài đặt chữ hoá đơn (khoá `invoice_chu_ck`): đổi ở phần cài đặt chữ hoá đơn, vd "Chuyển khoản".
