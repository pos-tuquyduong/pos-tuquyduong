# QUAY-AN-1 — Màn Bán hàng hiện tại: ẩn nút "Ghi nợ" và "Chưa thu"

<!-- Phiếu do chat soạn 24.10.2026. Việc thường [Th] — Sonnet, chạy thẳng. Nền: main `bd9b920` (M3 đã gộp).
     Chủ quán chốt 22.10: bán hàng KHÔNG có công nợ, gọi món và trả tiền luôn tại quầy (bỏ "mang ra bàn / chưa thu").
     Màn Bán hàng mới (BH-1) làm sau; việc này để nhân viên tập đúng từ tuần chạy thử trên màn hiện tại.
     Code đọc 24.10: client/src/pages/Sales.jsx — hộp thanh toán, dòng "Thanh toán phần còn lại" (~2005–2060) có 4 nút
     Tiền mặt / Chuyển khoản / Chưa thu (choThuTaiQuay) / Ghi nợ (isDebt, chỉ hiện khi có khách); chữ tóm tắt ~2144, ~2198. -->

## Mục tiêu
Nhân viên ở quầy không còn tạo được đơn chưa thu / ghi nợ từ màn Bán hàng. Đơn nợ CŨ (tạo trước) vẫn thu được ở Lịch sử đơn như hiện nay.

## Nghiệm thu
- A Hộp thanh toán chỉ còn "Tiền mặt" và "Chuyển khoản" ở dòng "Thanh toán phần còn lại"; dùng số dư (ví) như cũ.
- B Không còn đường nào trong Sales.jsx đặt `isDebt = true` hoặc `choThuTaiQuay = true` (kể cả giá trị mặc định, phím tắt, khôi phục giỏ);
  payload gửi máy chủ không bao giờ mang cờ nợ / chờ thu từ màn này.
- C K5: bán tiền mặt, chuyển khoản, trừ số dư (đủ / một phần + tiền mặt), giao từ gói (0đ), mua gói trả đủ — chạy như cũ.
- D Lịch sử đơn (`Orders.jsx`) KHÔNG đổi: đơn nợ cũ vẫn hiện và thu được.
- E Máy chủ KHÔNG đổi (chặn nợ ở máy chủ làm cùng BH-1 / P3).

## Phạm vi
- viec/QUAY-AN-1/**
- client/src/pages/Sales.jsx
- client/dist/**

## Bài thử đỏ
không — việc giao diện: chỉ gỡ hai nút và hai cờ ở màn Bán hàng, không đổi máy chủ / tiền; ghi trong trang_thai.md cách đã kiểm (dựng dist,
`--day-du`, đọc lại 4 ca C)

## Ngân sách
Sales.jsx ~−60 / +10 dòng; dựng lại client/dist.
**Phương án đơn giản nhất đã xét:** gỡ hẳn hai nút và mọi chỗ bật cờ trong Sales.jsx (không ẩn bằng CSS, không thêm cài đặt bật/tắt).

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- KHÔNG sửa server/**, client/src/pages/Orders.jsx, client/src/components/** ngoài phạm vi.
- Mặc định: không sửa .claude/, không merge, không tạo PR, không đụng main, chỉ push `git push -u origin viec/QUAY-AN-1`, không sửa sổ việc.
