# QUAY-AN-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: viec/QUAY-AN-1; HEAD = FETCH_HEAD = 10132b8
- 10132b8 PHIEU: QUAY-AN-1
- 99f5894 TIEN-DO: P22-23 (c4fabcd), KH-QUAY-1 (168b481), P15-QR (423624b), KH-UI-1 (bd9b920) xong; ...
- bd9b920 Merge pull request #41 from pos-tuquyduong/viec/KH-UI-1

## Đã làm
- Sales.jsx: gỡ hẳn state `isDebt`, `choThuTaiQuay`, `dueDate`, biến `laGhiNo`, `cachGhiSo`; xoá nút "Chưa thu" + "Ghi nợ",
  khối "Hạn thanh toán", dòng tóm tắt nợ, nhánh validate nợ, màu/chữ nút xác nhận theo nợ; 4 chỗ reset bỏ.
- Payload không còn gửi `debt_amount`, `due_date`, `payment_status` (máy chủ mặc định 0 / null / 'paid' — orders.js 182–184);
  `payment_method` = `paymentMethod` (chỉ cash / transfer / balance từ nút giỏ hàng như cũ).
- Bỏ import `AlertCircle`, `FileText` (hết dùng). Dựng lại client/dist.
- Không đổi: server/**, Orders.jsx, components/ (InvoicePrint đọc `successInfo.debtAmount > 0` → undefined → ẩn dòng nợ).

## Cách đã kiểm (phiếu không có bài thử đỏ)
- B: `grep -n "isDebt|choThuTaiQuay|laGhiNo|cachGhiSo|dueDate|debtAmountFinal|cho_thu|'debt'|setDueDate" client/src/pages/Sales.jsx` → 0 dòng.
- A: đọc lại JSX hộp thanh toán — chỉ còn nút Tiền mặt, Chuyển khoản (số dư/ví giữ nguyên).
- C (đọc lại handleSubmit): tiền mặt → cash_amount=remaining; CK → transfer_amount=remaining; số dư đủ → remaining=0 nên cả hai =0;
  số dư một phần + tiền mặt → cash_amount=phần còn lại, vẫn chặn khi tiền đưa thiếu; giao từ gói (total 0) và mua gói → không đi qua nhánh nợ nào.
- `npm test` → PASS 69 · FAIL 0 · CẢNH BÁO 1; build dist OK.
- Plan do agent phụ soát: bỏ qua (việc nhỏ, một file); /ra-soat sẽ soát cả diff.
