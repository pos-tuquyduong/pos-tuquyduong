# GIAO-DIEN-2 — kế hoạch (việc thường: không chờ duyệt)

Mốc: HEAD 7021e39 (main 7da9ba9, KHO-3a đã gộp). Chỉ `client/src` + `client/dist` + bài thử. KHÔNG đụng `server/`.

## Phương án (ít dòng nhất mà đạt nghiệm thu)

| Phần | A (chọn) | B (bỏ) |
|---|---|---|
| A · menu + tìm | Viết lại `QuanLy/menu.js` (hàm thuần: `NHOM`, `luoiQuanLy`, `timMuc`, `nutDuyNhat`); `QuanLy.jsx` vẽ một nguồn cho cả máy tính (lưới 3 cột) lẫn điện thoại (CSS `@media 768`, cùng dữ liệu). ~110 dòng | Hai danh sách riêng máy tính / điện thoại — trái A3 "không danh sách thứ hai" |
| B · mở thẳng | `Settings.jsx` nhận `?the=` (state `tab` khởi từ URL + đồng bộ), chế độ "thẻ riêng": ẩn hàng nhóm / thẻ, hiện "← Quản lý" + tiêu đề. Tái dùng 19 thẻ. ~45 dòng | Tách mỗi thẻ thành route riêng — viết lại 2.363 dòng |
| B4 · PIN | `CaiDat/PinChuQuan.jsx` (dời nguyên khối PIN khỏi HangThe), Settings thêm thẻ `pin` (quyền `chi_chu_quan`) → mở bằng `?the=pin`. ~70 dòng dời | Route mới trong App.jsx |
| C · gỡ SX | sửa chữ trong Customers / Orders (đúng 3 dòng) / Registrations xoá / CustomerInput xoá / App.jsx 2 route → `/customers`; api.js bỏ 5 hàm Đăng ký-export | — |
| D · Khách | Viết lại phần vẽ của `Customers.jsx`: danh sách + chip lọc + panel chi tiết dùng chung (máy tính ≥1024px hai cột; hẹp: danh sách → chi tiết toàn màn, Back trình duyệt qua `?khach=`). Hàm lọc thuần `QuanLy/locKhach.js` (đặt trong QuanLy/ vì phạm vi chỉ cho phép thư mục này tạo file mới). Giữ NGUYÊN mọi hàm gọi máy chủ | Bỏ modal chi tiết cũ → giữ modal: không đạt "toàn màn" |
| E · Hạng | `HangThe.jsx`: `dangSua` (một hạng mở, hạng khác một dòng + "Sửa"), hỏi khi còn thay đổi, `ThanhLuu` nhận thêm chữ (tham số MẶC ĐỊNH — lời gọi cũ giữ nguyên). Không đổi lưu / API | — |
| F | Reports.jsx: một dòng chữ + nhận `tab=doisoat` | — |

Ước lượng: ~450 dòng code (phần lớn dời / sắp lại JSX), ~300 dòng thử — đúng ngân sách.

## Bảng ánh xạ B1 (bài thử khoá ĐỦ từng dòng)
Nhóm Món & giá: Món, giá & công thức → `/kho` (không quyền) · Giá bán & nhóm món (tạm B2) → `/settings?the=products` manage_settings · Gói nạp tiền → `?the=goiNap` manage_products.
Khách & thẻ: Danh sách khách `/customers` · Hạng thành viên `?the=tiers` manage_promotions · Điểm & quà `?the=loyalty` manage_settings (+ liên kết sang `rewards` manage_promotions, `signup` manage_settings ngay đầu màn).
Khuyến mãi: Mã giảm giá `/discount-codes` manage_users (như ô cũ) · Giờ vàng `?the=flash` manage_settings · Chương trình `?the=chuongTrinh` manage_promotions · Quảng cáo trên App `?the=quangCao` manage_settings.
Tiền & báo cáo: Đối soát tiền `/reports?tab=doisoat` view_reports · Hoàn tiền `/refunds` approve_refund · Báo cáo doanh thu `/reports` view_reports.
Nhân viên: Tài khoản `?the=users` manage_users · Ai được làm gì `?the=permissions` manage_permissions.
Cài đặt quán: Giờ mở cửa `?the=gioHoatDong` · Giao hàng `?the=giaoHang` · In bill & tem `/invoice-settings` manage_users (như ô cũ) · In phiếu kho `?the=inPhieu` · Màn khách `?the=manKhach` (đều manage_settings) · PIN chủ quán `?the=pin` chi_chu_quan · Sao lưu `?the=backup` export_data · App khách hàng `?the=appKh` chi_chu_quan.
Thẻ NHOM_THE chưa có nút: `packages` (tạm ngưng — cố ý không nút, `?the=packages` vẫn mở), `signup`, `rewards` (liên kết từ Điểm & quà). Route App.jsx chưa có lối: `/don-thu` (ô riêng chủ quán, A4), `/hom-nay`, `/orders`, `/don-app` (menu trái), `/giao-hang` (nút Bán hàng), `/man-khach` (ngoài đăng nhập) → không thêm.

## Khối cũ của chi tiết khách → chỗ mới (D3, không khối nào biến mất)
Tên / SĐT / số dư / điểm / hạng → 3 ô số + tiêu đề · ViKhach (nạp, điều chỉnh, lịch sử, nạp tay) → nút "Nạp tiền" mở khu Ví · ghi chú khách + địa chỉ + ngày sinh CT-1a (+ nút Lưu cũ) → nút "Sửa thông tin" · CapHang (cấp / thu hồi hạng) · MaDangNhapApp · người thân (relationship / parent) · "Đổi quà" + kho quà → "Thêm…" · Ví voucher → tab Voucher · đơn gần đây (MỚI, qua `ordersApi.list({customer_phone})` — API có sẵn) → tab Đơn gần đây · "Gói đang dùng" → bỏ (C1) · badge `subscriptions` (máy chủ trả `[]` cố định — docKhach.js:34) → bỏ cùng cột Gói đăng ký.

## Ca thử (cong_cu/thu_GIAODIEN2.js) ánh xạ nghiệm thu
A1 6 nhóm tên / thứ tự / nút · ẩn theo quyền (nhân viên thường / quản lý / owner) · nhóm hết nút ẩn · A2 `timMuc` (không dấu, hoa thường, rỗng, không khớp, từ khoá "pin", "gio mo cua", "hang vang", "kim cuong", "may in", "vi", "so du", "nhan vien"; Enter 1 nút) · A3 QuanLy.jsx dùng đúng `luoiQuanLy` / `timMuc` một nguồn + có CSS 768 · A4 ô Dọn dữ liệu thử còn, ngoài 6 nhóm, chỉ owner · B1 mỗi `to` là route có trong App.jsx, mỗi `?the=` là thẻ có trong Settings, mỗi nút đúng quyền bảng trên · Settings đọc `?the=` · B2 nút tạm + ghi chú đầu thẻ products · B3 /settings chung không còn trong menu · B4 PinChuQuan.jsx có datPin, HangThe không còn `datPin`, còn dòng "Đặt / đổi PIN chủ quán" · C1–C5 chữ SX biến mất (kiểm mẫu nguy hiểm BIẾN MẤT) · C2 nhãn 'return_stock' cũ vẫn "Hoàn kho (cũ)" + ô chọn không còn · C3 file xoá + 2 route Navigate · D2 lọc ca biên (ngày sinh trống, hạng hết hạn hôm qua, tháng 12 / 1, số dư 0) · D1 `?khach=` + `?phone=` · E1 `dangSua`, ThanhLuu chữ mới · F1 chữ Thực thu + `tab=doisoat`.
Đột biến (K3): mỗi vế một `VS-` / `BV-` ở `dot_bien.py`.

## Đường song song / luồng hợp lệ (K4, K5)
- Quyền mỗi nút = quyền cũ (K5: nhân viên thường vẫn thấy Danh sách khách / Món giá công thức — hôm nay cũng mở được).
- `/settings` trần vẫn chạy (không `?the=`) · `/registrations`, `/sync` → `/customers` · `?the=` lạ hoặc không đủ quyền → rơi về thẻ đầu người đó xem được (không trang trống).
- Thêm khách vẫn gọi `registrationsApi.create` (máy chủ tạo khách thật).
- Dữ liệu cũ: dòng báo hỏng `return_stock` vẫn hiện nhãn; `damageForm` mặc định không phải `return_stock`.
- Khách không SĐT vẫn mở được chi tiết (chỉ không sửa ghi chú).
- Số `fetch` trần trong Customers (2 chỗ cũ) KHÔNG tăng (bánh cóc).

## Phát hiện (ghi sẵn, không sửa)
KHO-3b dời tick "nhóm đặc biệt" + "món tặng khách mới" về Kho rồi bỏ nút B2 · "gói kiểu mới" (thẻ `packages`) · nút "Bán cho khách này" (D4 → TOPPING-1) · `CongQr` chỉ hiện ở /settings trần (chế độ thẻ riêng ẩn) · `locKhach.js` nên dời sang `utils/` · Orders.jsx:301 `return_to_stock` giờ luôn false (không đụng — phiếu cấm) · Customers.jsx vẫn > 500 dòng (không có thư mục mới trong phạm vi để tách).
