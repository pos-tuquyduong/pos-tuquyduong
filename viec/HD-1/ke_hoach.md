# HD-1 — kế hoạch (27.10.2026)

Bản chụp: HEAD = FETCH_HEAD = `f1fea71` (có `PHIEU: HD-1`).

## Phương án (A = ít dòng hơn, B = nhiều hơn) — chọn A ở mọi phần

| Phần | A (chọn) | B | Lý do chọn A |
|---|---|---|---|
| Cửa dữ liệu hoá đơn (A) | 1 file `routes/hoaDon.js` (~150 dòng) chỉ đọc, mount 1 dòng | gắn thêm trường vào phản hồi `POST /orders` | orders.js đang bị UUDAI-1 / COMBO-1a sửa; in lại cần đúng số lúc mua |
| N điểm mã (D) | tách phần TÍNH của `/nhan-diem` ra `utils/nhanDiem.js` (hàm thuần `tinhDiemNhanMa`), route cũ + cửa hoá đơn cùng gọi | chép công thức sang hoaDon.js | đúng luật "một quy tắc một hàm"; giữ nguyên literal `tienTinhDiem(don)` ở signup-codes.js (cổng A2 của thu_DIEMTHAT1) |
| Hàm thuần (G) | 1 file `client/src/utils/hoaDon.js` (~250 dòng) | rải trong component | bài thử gọi thẳng |
| QR (C) | `utils/veQr.js` bọc `qrcode-generator` 1.4.4 (~30 dòng) | tự viết bộ mã QR (> 50 dòng, kém an toàn) | phiếu cho phép thư viện |
| Chữ tuỳ chỉnh (E) | mỗi chữ một khoá `invoice_chu_<k>`, ẩn = `invoice_an_<k>`; thiếu khoá → chữ cũ (`invoice_thank_you`, `store_*`) → mặc định trong code | một khoá JSON | đúng chữ "seed khoá `invoice_*`"; dữ liệu cũ trên production không mất chữ đã sửa (K5) |
| Từ chối khoá ẩn mục bắt buộc | 1 đoạn trong PUT `settings.js` (~8 dòng) | — | phiếu: máy chủ cũng từ chối |
| 2 tờ | `invoice_so_to` (1/2, mặc định 2) nhân trong component; `bill.ban` của P16 giữ nguyên nghĩa (ca cũ giữ) | đổi mặc định `bill.ban` = 2 | thu_P16 C1/D2 khẳng định bill.ban = 1 |
| Tem (F) | thêm 2 dòng chữ tuỳ chỉnh (`invoice_chu_tem_dau`, `_tem_chan`, rỗng = không in) + `#số bill` to | — | giữ khuôn tem hiện có |

## Ca thử ↔ Nghiệm thu (cong_cu/thu_HD1.js)
- A: đơn thật qua POST /orders → GET /hoa-don/:id: số bill = số đơn; chưa đăng nhập → 401; đơn không có → 404; tổng các dòng thanh toán = tổng; N = số `/nhan-diem` cộng thật; trước/cộng/hiện có của khách quen.
- B + G: hàm thuần — khách quen có hạng, khách lẻ có mã, phí giao, tài khoản + tài khoản mẹ, tiền mặt có trả lại, in lại lần 2, tờ khách có cảm ơn / tờ lưu không, nhãn 2 tờ, số tờ 1/2.
- C: đường dẫn QR (`{ma}` có / không mã, ô trống → không QR); `veQr` → giải mã bằng `jsqr` ra đúng đường dẫn.
- D: N = 0 (Flash, 0 điểm, chương trình tắt) → không ô hứa điểm; khách quen: trước · đổi quà · cộng · hiện có, in lại không đổi.
- E: 5 nhóm, đếm > 42 báo, chữ tự điền, KHÔNG ẩn được 7 mục, máy chủ từ chối `invoice_an_*` của mục bắt buộc (400 `KHOA_KHONG_AN_DUOC`), danh sách mục bắt buộc client = máy chủ.
- F: tem: dau / chan tuỳ chỉnh, cắt 40 ký tự.
- H (K5): đơn cũ (cột mới NULL), khách lẻ không mã, đơn trừ hết bằng tài khoản, đơn đã huỷ, đơn nợ — không vỡ; thiếu địa chỉ App KH → không QR, vẫn đủ phần còn lại.
- Đường song song: `/nhan-diem` (nay gọi hàm tách) — chạy lại thu_P20, thu_P2223, thu_P24, thu_DIEMTHAT1, thu_KH1 không đổi kết quả.

## Soát kế hoạch (4 câu)
1. Ngoài phạm vi? Không: `api.js` KHÔNG sửa (code mới gọi `api.get` có sẵn); orders.js / Sales.jsx / BanHang/** không đụng — `InvoicePrint` giữ nguyên props.
2. Cách ngắn hơn? Đã chọn ít dòng nhất ở bảng trên.
3. Ca chưa có bài thử? Xem mục trên; in thật trên máy in KHÔNG kiểm được (ghi CHƯA KIỂM).
4. Đường song song? `/nhan-diem` và hàm điểm (xem trên); `invoice_config` cũ của InvoicePreview còn dùng làm phương án dự phòng khi cửa hoá đơn lỗi.
