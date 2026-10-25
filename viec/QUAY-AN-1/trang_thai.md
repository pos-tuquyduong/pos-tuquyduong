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
- B: `grep -n "debt|cho_thu|dueDate|due_date|isDebt|choThuTaiQuay|laGhiNo|cachGhiSo|setDueDate" client/src/pages/Sales.jsx` → chỉ còn dòng 1658–1659 (hiển thị `customer.total_debt`, phiếu cho phép). (Bản đầu của mẫu thiếu `debtAmount` nên bỏ sót 2 dòng chết — soát vòng 1 bắt, đã xoá.)
- A: đọc lại JSX hộp thanh toán — chỉ còn nút Tiền mặt, Chuyển khoản (số dư/ví giữ nguyên).
- C (đọc lại handleSubmit): tiền mặt → cash_amount=remaining; CK → transfer_amount=remaining; số dư đủ → remaining=0 nên cả hai =0;
  số dư một phần + tiền mặt → cash_amount=phần còn lại, vẫn chặn khi tiền đưa thiếu; giao từ gói (total 0) và mua gói → không đi qua nhánh nợ nào.
- Sau vòng sửa: `npm test` PASS 69 · FAIL 0 · CẢNH BÁO 1; `--day-du` PASS 73 · FAIL 0 · CẢNH BÁO 1; build dist OK.
- Kế hoạch không nhờ agent phụ soát riêng (việc nhỏ, một file); /ra-soat soát cả diff.

## Soát độc lập (/ra-soat) — vòng 1: KHÔNG ĐẠT (nhẹ) → đã sửa
LỖI: Sales.jsx:2293, 2305 còn `debt_amount: completedOrder.debtAmount || 0` và `debtAmount: completedOrder.debtAmount` (code chết sau khi bỏ khỏi setCompletedOrder) — K4. Đã xoá ở commit 5040697, dựng lại dist ở 950ff8a.
Mẫu grep trong trang_thai.md thiếu `debtAmount` — K1/K3. Đã sửa mẫu (mục "Cách đã kiểm" B).
NGHI NGỜ (có từ bản gốc, ghi Phát hiện): nút giỏ hàng 'balance' (Sales.jsx ~1550) khi số dư không đủ → modal không nút nào sáng, cash/transfer = 0, server trả 400; trước vá có thêm lối thoát "Ghi nợ".
NGHIỆM THU: 5/5 (A–E) có bằng chứng đọc code; D, E: `git diff` Orders.jsx, components, server rỗng.
Không chạy lại vòng 2 (sửa chỉ xoá 2 dòng chết, grep + `npm test` + `--day-du` xanh).

## Phát hiện (ngoài phạm vi, không sửa)
- InvoicePrint.jsx:446–447 còn đọc `successInfo.debtAmount` — nay không bao giờ có từ màn Bán hàng (components ngoài phạm vi).
- Nút 'balance' ở giỏ hàng khi số dư thiếu (xem Nghi ngờ) — nên xử lý ở BH-1.
- Máy chủ vẫn nhận `debt_amount` từ API trực tiếp — chặn làm cùng BH-1 / P3 (phiếu mục E).

## Báo cáo
VIỆC:        QUAY-AN-1 — Màn Bán hàng: ẩn nút "Ghi nợ" và "Chưa thu"
ĐÃ SỬA:      client/src/pages/Sales.jsx — gỡ state isDebt/choThuTaiQuay/dueDate, hai nút, khối hạn thanh toán, nhánh validate/payload nợ, 2 dòng debtAmount chết; client/dist dựng lại (index-CQ4uHu_z.js)
BÀI THỬ:     không có bài thử đỏ (phiếu miễn: việc giao diện). Kiểm bằng grep (mục B) + đọc lại handleSubmit 5 luồng C + `npm test` 69 xanh + `--day-du` 73 xanh
ĐÃ RÀ K4:    grep "debt|cho_thu|dueDate|due_date|isDebt|choThuTaiQuay|laGhiNo|cachGhiSo" Sales.jsx → 2 chỗ còn (total_debt hiển thị, được phép); 4 chỗ reset đã bỏ hết
CHƯA KIỂM:   chưa bấm thử trên trình duyệt/điện thoại; chưa chạy đơn thật qua 5 luồng C (chỉ đọc code); chưa đọc Orders.jsx để xác nhận đơn nợ cũ vẫn thu được (chỉ xác nhận file không đổi); chưa xác nhận nút 'balance' thiếu số dư
GIT:         950ff8a QUAY-AN-1: dựng lại client/dist sau soát vòng 1 · 5040697 QUAY-AN-1: bỏ hai dòng debtAmount chết trong Sales.jsx (soát vòng 1)
BÀI HỌC:     KHOÁ 0 · NGUYÊN TẮC 1 · BỎ 0

## Bài học
- NGUYÊN TẮC (đề xuất, KHUON_LOI.md ngoài Phạm vi — chat soát duyệt, thuộc K4/K1): gỡ hẳn một trường khỏi `setCompletedOrder` thì grep TÊN TRƯỜNG đó ở mọi chỗ đọc `completedOrder.*` (đường song song cách ~1500 dòng); mẫu grep dùng dạng ngắn `debt`, nếu không "0 dòng" là bằng chứng rỗng. Đã gây: QUAY-AN-1 sót `debtAmount` ở 2293/2305.
- KHOÁ: không đề xuất (việc giao diện, không phép kiểm tĩnh tự nhiên).

## Cổng
✓ CỔNG CHẠY ĐẠT (`node tu_chay/cong.js chay . 10132b8^ HEAD viec/QUAY-AN-1` tại HEAD 950ff8a, cây sạch)

Thử tay cho chủ quán (điện thoại/quầy): 1) mở Bán hàng, thêm món, bấm Thanh toán → chỉ thấy Tiền mặt / Chuyển khoản (và số dư nếu khách có). 2) Thu tiền mặt rồi chuyển khoản một đơn → bill ra bình thường.

HEAD ĐÃ KIỂM: 950ff8a
