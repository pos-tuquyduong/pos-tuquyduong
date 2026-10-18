# P16 — kế hoạch

## Phần 1 · Hàm thuần `client/src/utils/inPhieu.js` (~120 dòng)
- A (chọn): một file, hàm thuần: `docBoIn(settings)` (đọc khoá `invoice_print_set`, mặc định + kẹp số bản 1–3), `dungTem`, `dungPhieuPhaChe`,
  `dungBoIn(order, settings, {nhomTheoMa, loai, inLai})` → danh sách việc in `[{loai, kho, trang[]}]` (trang đã nhân số bản), `DON_MAU`.
- B: tách `tem.js` + `phieu.js`. Hơn 1 file mà không ai dùng riêng → bỏ.
- Rủi ro: lọc món. Đơn lưu không mang nhóm (database.js:273-288) → tra `category` từ danh sách sản phẩm bằng `product_code`; gói/thẻ nhận
  ra bằng `product_id < 0` (có ở CẢ đơn vừa tạo lẫn đã lưu — orders.js:421,442) hoặc cờ `is_package_item`/`is_membership_item` (chỉ đơn vừa tạo). Món lấy từ gói ở đơn đã lưu không có cờ `from_package`, nhưng `product_id > 0` nên vẫn ra tem.

## Bổ sung sau soát độc lập (agent phụ)
- Thêm ca: món lấy từ gói trong đơn ĐÃ LƯU (giá 0, product_id > 0) vẫn ra tem; khổ đọc lại đúng; `DON_MAU` đủ ba loại.
- `handlePrint` in xong (không lỗi) thì gọi `onPrintComplete` như cũ (Orders còn `loadOrders()`); in hỏng thì báo lỗi, KHÔNG đụng đơn.
- Lưu khoá `invoice_print_set` (qua `saveConfig`) và "Tự mở in" không kiểm được bằng hàm thuần → ghi CHƯA KIỂM, đưa vào thao tác chủ quán thử tay.
- Giữ chip + xem trước trong modal (nghiệm thu E đòi "chọn loại", C đòi xem trước). Không sửa `api.js` (chỉ gọi `productsApi.list`).

## Phần 2 · Vẽ + in `client/src/components/InPhieu.jsx` (~150 dòng)
- A (chọn): `TrangTem`, `TrangPhieu` (CSS in), hook `useNhomTheoMa(bietSan)` (gọi `productsApi.list()` qua api.js khi nơi gọi chưa có bảng nhóm; Sales truyền sẵn; thôi chờ sau 4 giây),
  `inQuaIframe(taiLieu)`; `InvoicePrint.handlePrint` gọi lần lượt từng loại (mỗi loại một lần thử riêng) bằng iframe ẩn (mỗi loại một hộp in → chọn được máy in khác nhau; iframe không dính chặn popup
  như `window.open` sau khi hộp in đầu đóng quá 5 giây).
- B: gộp ba loại vào một cửa sổ in bằng `@page` đặt tên. Một hộp in cho ba loại khổ khác nhau → không chọn được máy in riêng. Bỏ.

## Phần 3 · `InvoicePrint.jsx` (vỏ modal dùng chung Sales + Orders, +~90 dòng)
- Thêm dãy chip ba loại (bật/tắt theo cài đặt, bấm đổi), xem trước loại đang chọn, nút In → `inCacViec` (bill đi đường cũ: số hoá đơn
  + log `invoice/log` rồi mới in); prop `inLai` → thêm dải "IN LẠI" vào bill + tiêu đề; "Tự mở in" chạy một lần sau khi modal mở.
- A (chọn): sửa vỏ có sẵn. B: vỏ mới `InPhieu` thay InvoicePrint ở 2 chỗ gọi → phải chép lại header/size/log, nhiều dòng hơn → bỏ.

## Phần 4 · Cài đặt (`InvoiceSettings.jsx`, +~110 dòng): khối "Bộ in sau thanh toán"
- Ba hàng (Bật/Tắt · Số bản 1–3 · Khổ) + nhóm món không pha + "Tự mở in sau thanh toán" + nút Xem trước (đơn mẫu). Lưu cùng nút
  "Lưu cài đặt" hiện có: `api.saveConfig` thêm khoá `invoice_print_set` vào CÙNG một `PUT /api/pos/settings` (không `fetch` mới).

## Phần 5 · `Sales.jsx` / `Orders.jsx`
- Sales: không đổi luồng thu tiền. Đơn vừa lưu đã mở InvoicePrint sau thanh toán (Sales.jsx:~801) → chỉ truyền thêm không gì,
  hoặc 0–2 dòng. Orders: nút "In hóa đơn" có sẵn (Orders.jsx:~1024) → truyền `inLai` vào InvoicePrint (1 dòng) và đổi nhãn "In lại".

## Ca thử ↔ nghiệm thu (`cong_cu/thu_P16.js`, gọi thẳng `inPhieu.js`)
| Nghiệm thu | Ca |
|---|---|
| A | 2 ly cùng món → 2 tem "1/2","2/2"; ghi chú vào tem; tên/4 số cuối SĐT; mã rút gọn; giờ HH:mm; gói/thẻ → 0 tem; nhóm bị tắt → 0 tem; ghi chú dài → cắt "…" |
| B | gộp cùng món + cùng ghi chú ("2 × Trà gừng — Ít đường"); khác ghi chú → tách dòng; không chứa giá; gói/thẻ không vào phiếu |
| C | thiếu khoá → mặc định (bill 1 · tem bật · phiếu bật · tự mở tắt); số bản kẹp 1–3 (0,4,"x" → ngay trên/dưới ngưỡng); JSON hỏng → mặc định; loại tắt → không có việc |
| D | thứ tự bill → tem → phiếu; số bản nhân trang (tem 2 ly × 2 bản = 4); tắt hết → danh sách rỗng |
| E | `inLai` → job bill đánh dấu `inLai`; chọn `loai` → chỉ loại đó |
| F | hàm thuần chạy bằng node, dòng tổng "n đạt · 0 hỏng" |
| G | `npm run build`, `npm test`, `--day-du`; tắt hết in → bộ dựng trả rỗng (Sales thao tác như cũ) |
Luồng hợp lệ KHÔNG bị chặn (K5): đơn có cả gói + món (món vẫn ra tem); đơn cũ lưu `notes` thay `note`; khách lẻ không SĐT; `created_at` thiếu;
sản phẩm tra không ra nhóm → vẫn in tem (mặc định bật); đơn mua gói + lấy ngay (`from_package`) → món lấy ngay vẫn ra tem.
Đường song song (K4): hai nguồn đơn — vừa tạo (`note`, `is_package_item`) và đã lưu (`notes`, `product_id<0`) → một hàm `laMonPha` xử lý cả hai.
Không đụng tiền → không cần ca hai người cùng bấm; không `server/`.
