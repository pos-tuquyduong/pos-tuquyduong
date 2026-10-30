# Kế hoạch BH-2 (đọc code thật 29.10: BanHangMoi.jsx, ThuTien.jsx, ManKetThuc.jsx, tinh.js, thanh-toan.js, giuCho.js, pinKhach.js, orders.js tinh-thu, hoaDon.js, Layout.jsx, App.jsx)

## Sự thật đã đọc (ảnh hưởng thiết kế)
- PIN KHÔNG có đường "kiểm" riêng: `kiemPin` chạy BÊN TRONG `POST /thanh-toan/phien` (thân `pin`, `pin_me`); `POST /thanh-toan/pin` chỉ ĐẶT PIN lần đầu.
  Lỗi PIN: `PIN_SAI` 400 · `PIN_DANG_KHOA` 423 · `CHUA_CO_PIN` 400. Màn gọi `/phien` kèm PIN; không có API "khách có PIN chưa" ở tìm khách → biết bằng `CHUA_CO_PIN`.
- `chotPhien` đi qua `taoDon` → trả đúng thân `POST /orders` (order). Mọi cách (tiền mặt, tài khoản, payOS) đi MỘT đường phiên → màn mới bỏ `ordersApi.create` (đơn có mã giảm cũng đúng, vì `discount_code` nằm trong danh sách trắng của phiên).
- `tiền mặt` / `tài khoản` với `con_lai = 0` ngoài cách `tai_khoan` bị `CACH_KHONG_KHOP` → đơn phải trả 0đ đi cách `tai_khoan`.
- `InvoicePrint.jsx` (cấm sửa) tự lấy `GET /hoa-don/:id`, có nút In + tự mở in khi `invoice_print_set.tu_mo`. Màn kết thúc vẽ tab Tờ khách / Tờ lưu / Tem bằng `dungHoaDon` + `HoaDonTo`, nút In mở `InvoicePrint` với cài đặt ghi đè (số tờ, tu_mo) → in ngay, xong báo `daIn`.
- `Reports.jsx`, `Settings.jsx`, `Kho/index.jsx` giữ tab bằng state, không đọc query → "Hôm nay" = route `/hom-nay` dùng lại `Reports` (mặc định đã là hôm nay); ô Quản lý chỉ dẫn tới trang, không tới tab. Lối Hoàn tiền / Số dư: thanh lối bọc ngoài `Orders` / `Customers` ở App.jsx (không sửa hai file đó).

## Phần 1 — Giá máy chủ tính (A)
A: gọi tinh-thu từ `BanHangMoi` bằng effect theo `khoaTinh` (tinh.js): 3 file đụng (tinh.js, BanHangMoi.jsx, api.js) ~120 dòng. B: hook riêng → thêm file, thừa. **Chọn A.**
Rủi ro: kết quả cũ về muộn → bộ đếm lượt. Thu tiền dùng số `mayChu.total` chứ không `tinhGio`.
## Phần 2 — Thu tiền (B–D)
A: một `ThuTien.jsx` ghi đè (tiền mặt + chọn cách + QR + PIN trong cùng file ~330 dòng). B: tách `ManQr.jsx`, `ManPin.jsx`. **Chọn B** (mỗi file một việc, <500 dòng). Hàm thuần (tờ tiền, chia tài khoản, nút sáng, lỗi PIN, đếm ngược, trạng thái phiên) ở tinh.js để thử.
## Phần 3 — Màn kết thúc (E) · ManKetThuc.jsx ~110 dòng (vẽ HD-1 + mở InvoicePrint để in).
## Phần 4 — Menu (F) · `QuanLy/menu.js` (hàm thuần, thử được) + `QuanLy/QuanLy.jsx` (lưới) + `QuanLy/ThanhLoi.jsx`; Layout.jsx / App.jsx chỉ xếp lại mục + 3 route (`/quan-ly`, `/hom-nay`).

## Ca thử ↔ Nghiệm thu (cong_cu/thu_BH2.js)
A: khoaTinh đổi theo giỏ/khách/mã, KHÔNG đổi khi ghi chú/tách dòng · thanTinhThu đúng khoá · nutThuSang tắt khi chưa có số máy chủ / số cũ · coGia(0)=false · ca thật: tinh-thu có `cach`, `ma_loi`.
B: tờ tiền/trả lại (giữ ca BH-1) · nút "Đã nhận tiền" chỉ sáng khi đủ.
C: conLaiGiay theo het_han · hanhDongPhien (cho/da_thu/het_han/huy/loi) · ca thật: /phien payos → huỷ → trạng thái huy · xac-nhan-tay cần quyền+lý do · cấu trúc: không có nút "đã nhận CK" ngoài xác nhận tay.
D: chiaTra · cachTraKhaDung (không đủ → còn tiền mặt/QR; đủ → chỉ tài khoản; 0đ → tài khoản) · xuLyLoiPin · datPinHopLe · ca thật: PIN sai 5 lần → 423, /pin đặt PIN, /phien + /chot tài khoản trừ đúng.
E: ca thật /hoa-don/:id · cấu trúc: ManKetThuc dùng dungHoaDon/HoaDonTo, nút "In hoá đơn (n tờ) + N tem".
F: dungMenu theo quyền (6 mục / 5 mục điện thoại, "Đăng ký mới" không có, Quyền giữ) · luoiQuanLy.
G: Sales.jsx / server/ không đổi (git diff rỗng) · công tắc mặc định TẮT · thu_BH1 còn đạt.
Luồng hợp lệ phải KHÔNG bị chặn (K5): khách lẻ tiền mặt đúng tờ; mã giảm hợp lệ; khách đủ tài khoản; đơn 0đ; phần còn lại sau tài khoản trả QR.
Đường song song: `ordersApi.create` còn dùng ở Sales.jsx (không đụng); `dungDonHang` thành mã chết ở màn mới → xoá cùng ca BH-1 liên quan (ghi bang_chung).
Soát kế hoạch bằng agent phụ: chưa làm (ghi ở trang_thai.md).
