# Kế hoạch QUAY-AN-1

Code đọc 24.10 (client/src/pages/Sales.jsx): state isDebt/choThuTaiQuay/dueDate (50–55), laGhiNo/cachGhiSo (57–60), reset (341–342, 399–400, 663–665, 815–817),
validate + payload (677–743, 781–786), hộp thanh toán (1970–2060, 2067, 2133–2178, 2189–2202, 2253–2276). Server đã mặc định debt_amount=0,
due_date=null, payment_status='paid' (orders.js 182–184) nên payload không cần gửi ba trường đó.

## Phương án
- A (chọn): gỡ hẳn state + mọi nhánh dùng; cachGhiSo → paymentMethod; payload bỏ debt_amount/due_date/payment_status. ~−90/+5 dòng, 1 file.
- B: giữ state, chỉ xoá hai nút → cờ còn đó, nhưng không đường nào bật; để lại code chết. Ít dòng đổi hơn nhưng trái "gỡ hẳn".
Chọn A: ngân sách phiếu −60/+10 nhưng phần lớn là khối JSX bị xoá; code chết bị cấm (LUAT 3).

## Ánh xạ nghiệm thu → cách kiểm (phiếu: không bài thử đỏ, việc giao diện)
- A: đọc lại JSX hộp thanh toán: chỉ còn 2 nút + số dư; grep "Ghi nợ|Chưa thu" = 0 trong hộp.
- B: grep "isDebt|choThuTaiQuay|setIsDebt|laGhiNo|cho_thu|'debt'|debt_amount|due_date" Sales.jsx = 0 (trừ hiển thị nợ khách dòng total_debt).
- C (K5): đọc 5 luồng trong handleSubmit sau sửa: tiền mặt, CK, số dư đủ/một phần+tiền mặt, giao từ gói 0đ, mua gói — payload cash_amount/transfer_amount giữ nguyên.
- D/E: git diff --stat chỉ Sales.jsx + dist + viec/.
Đường song song: mọi chỗ reset (4 nơi) đều xoá; nút Tiền mặt/CK còn setIsDebt → gỡ.
