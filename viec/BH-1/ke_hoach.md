# BH-1 — kế hoạch

## Phương án
| Phần | A (chọn) | B | Lý do |
|---|---|---|---|
| Chọn màn theo công tắc | `BanHang/index.jsx` (`TrangChu`) đọc công tắc rồi trả `Sales` hoặc `BanHangMoi`; `App.jsx` đổi đúng 1 phần tử route index | sửa `Sales.jsx` | A: ~25 dòng, không đụng màn cũ (phiếu cấm sửa `Sales.jsx`) |
| Chỗ bật/tắt công tắc | Panel ⚙ trong màn mới (bật/tắt + Kiểu màn hình) + địa chỉ `/?man=moi` / `/?man=cu` đặt công tắc rồi bỏ query | thêm mục vào `Settings.jsx` / `Layout.jsx` | `Settings.jsx`, `Layout.jsx` ngoài Phạm vi; màn cũ giữ NGUYÊN (A: "y như hôm nay") → chỗ bật là địa chỉ. Ghi `## Câu hỏi` để chủ quán quyết có thêm mục ở Cài đặt không |
| Phép tính | `BanHang/tinh.js` thuần (ESM, không React) — bài thử nạp bằng `import()` | tính rải trong component | H bắt buộc một file; thuần mới thử được |
| Ghi chú nhanh | `BanHang/ghiChuMacDinh.js` hằng theo nhóm sản phẩm | gọi API | đợt 1 chưa có API; TOPPING-1 thay |
| Khách | ô tìm riêng trong `ThanhKhach.jsx` gọi `customersV2Api.search`, `customersApi.getByQR`, `QrScanModal` | dùng `CustomerSearch` | `CustomerSearch` có nút "Thêm khách mới" → vi phạm luật 6 (không tạo khách ở quầy) |
| Gọi máy chủ | chỉ qua `utils/api.js` (`api.get`, `productsApi`, `ordersApi`, `customersV2Api`) | `fetch` trần | bánh cóc NGUONG_FETCH |

Ước lượng: `tinh.js` ~150, giao diện ~700 (6 file), `index.jsx` ~30, css ~120, bài thử ~220. Số dòng giao diện vượt ngân sách ~900 → báo ở CHƯA KIỂM nếu vượt.

## Ca thử ↔ Nghiệm thu (bài `cong_cu/thu_BH1.js`)
- A: `docCongTac` kho hỏng/giá trị lạ → tắt + Tự động; ghi rồi đọc lại; `App.jsx` index trỏ `TrangChu`, `Sales.jsx` không nhắc BanHang.
- B: `tachTrang` 599 / 600 / 601 + 3 kiểu; kiểu ép thắng độ rộng.
- C: không cần phép tính (giao diện) — canh cấu trúc: `ThanhKhach.jsx` không có `registrations` / "Thêm khách".
- D: `giaHang` (làm tròn, chặn 0–90, nhóm đặc biệt), `tinhGio` (Flash chặn hạng, như `Sales.jsx`).
- E: `ghiChuMacDinh` có mọi nhóm + dự phòng; `kiemTraThem` (không giá, hết hàng, quá tồn, khong_quan_kho).
- F: `traLai`, `conThieu`, `danhSachTo` (ngay trên / ngay dưới số phải trả, tối đa 4, "Đúng tiền" đầu), không chữ "thối", không "Ghi nợ/Chưa thu" trong `BanHang/`.
- G: cấu trúc: màn kết thúc dùng `InvoicePrint`, lưới khoá khi `daIn` false.
- H: mọi ca trên chạy trên `tinh.js`.
- I (K5): `dungDonHang` 4 ca (tiền mặt đúng tiền · tiền mặt số khác · chuyển khoản · khách quen trừ số dư một phần + tiền mặt) + tập khoá của payload == tập khoá `orderData` đọc từ `Sales.jsx` (đúng "y như màn cũ"); ca ĐẢO: số dư đủ → `payment_method:'balance'`.
- Không dùng `fetch(` trần trong `BanHang/`; `localStorage` chỉ trong `try`.
Đụng tiền? Đơn tạo qua `POST /orders` cũ, server tự tra giá (ràng buộc 1) — không thêm đường ghi tiền mới → không cần ca hai-người-cùng-bấm; nút "Đã nhận tiền" khoá khi `dangGui` (chống bấm đôi).

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
Khách lẻ tiền mặt; khách quen trừ số dư một phần; số dư đủ trả hết; khách có chiết khấu riêng; đơn có món Flash; tắt công tắc → màn cũ.

## Đột biến (`dot_bien.py`)
Cho `tinh.js` (code chạy thật ở client/src): VS-… và BV-… ghi ở trang_thai.md.
