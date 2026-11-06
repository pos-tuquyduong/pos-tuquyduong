# TINGEE-1 — trạng thái

## Đối chiếu bản chụp (06.11.2026)
- Nhánh: viec/TINGEE-1; cây sạch; fetch origin viec/TINGEE-1 xong.
- HEAD e9b7036 · FETCH_HEAD e9b7036 (bằng nhau, không kéo).
- `git log --oneline -3`:
  - e9b7036 PHIEU: TINGEE-1
  - f464cea Merge pull request #74 from pos-tuquyduong/viec/HANG-1
  - 7c0c682 GOP-HANG-1 HEAD DA KIEM 84480a7 (chat soat)

## Bước đang ở
Bước 3 — kế hoạch `ke_hoach.md` xong, **DỪNG chờ duyệt** (phiếu: "Chờ duyệt kế hoạch").

## Soát kế hoạch (agent phụ chỉ đọc, 06.11)
4 câu: (1) ngoài Phạm vi — không; (2) ngắn hơn — gom `TEN_CONG` + `congCuaKhoa` về một bảng ở `congQr.js`, chốt `LECH_TOI_DA_GIAY` dùng chung,
bỏ nhánh "gốc UAT" không bao giờ chạy — ĐÃ nhận cả ba; (3) ca thiếu — chiều ngược "webhook luôn mở", JSON hỏng, nội dung mới CK-NOIDUNG-1,
sát mốc hết hạn, hai cổng payOS+Tingee, ví / điểm không đổi, khoá trong sao lưu — ĐÃ thêm T20–T25 + T3; (4) sót — `doiSoat.js:233 slice(6)`
viết cứng cho `'sepay:'`, địa chỉ Webhook phải có `www`, thêm chú thích cần sửa — ĐÃ ghi vào kế hoạch. Số dòng trích đã kiểm lại bằng grep.

## Câu hỏi
1. **Tài liệu Tingee — máy không đọc được.** Người gác chặn `curl` ra ngoài (CURL-HOST); agent đọc web báo `ENOTFOUND developers.tingee.vn`
   (mạng phiên không có tên miền này). Để viết `docBao` đúng mà không đoán, cần MỘT trong hai:
   (a) bạn dán vào phiếu (hoặc file `viec/TINGEE-1/tai_lieu_tingee.md`) nguyên trang "Webhook Payment Callback": ví dụ thân JSON đầy đủ, cách tính
   chữ ký (thân thô hay đã chuẩn hoá, hex hoa hay thường), câu trả lời Tingee chờ (chỉ HTTP 200, hay cần thân như `{"code":"00"}`), và gửi lại có ký
   lại mốc giờ mới không; hoặc (b) cho phép tên miền developers.tingee.vn trong mạng của môi trường.
   Tên trường cần biết ở bảng mục 2 của `ke_hoach.md`.
2. **QR:** kế hoạch chọn tự dựng VietQR tới đúng tài khoản ngân hàng (như SePay, không gọi API Tingee). Đúng khi Tingee báo cho MỌI tiền vào tài khoản
   đó (không bắt tiền phải vào tài khoản ảo VA của Tingee). Đề xuất: giữ cách này; tài liệu nói phải dùng VA thì đổi sang gọi API tạo QR.
3. **Phụ thuộc CK-NOIDUNG-1:** chưa gộp vào main (sepay.js vẫn đọc `TQD<số>`). Đề xuất: duyệt kế hoạch xong, chờ CK-NOIDUNG-1 gộp rồi mở phiên `tiep`
   kéo main mới — bước code dùng lại đúng hàm đọc nội dung và luật cộng ví của CK-NOIDUNG-1.
4. **Thứ tự chuyển (nghiệm thu F):** kế hoạch đề xuất chuyển thử 2.000đ khi VẪN `CONG_QR=sepay` (QR hai cổng giống hệt vì cùng tài khoản + nội dung;
   webhook Tingee vẫn chốt phiên), thấy tự xác nhận mới đặt `CONG_QR=tingee` — đúng thứ tự phiếu. Bạn chỉ cần xác nhận.

## Phát hiện
- (chưa có)
