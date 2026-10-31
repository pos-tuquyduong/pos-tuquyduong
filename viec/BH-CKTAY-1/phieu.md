# BH-CKTAY-1 — Bỏ hẳn ô "Chiết khấu" giảm tay ở màn Bán hàng cũ

<!-- Phiếu do chat soạn 31.10.2026. Việc thường [Th] — Sonnet, chạy thẳng tới hết. Nền: main sau sổ v49. Chủ quán chốt 31.10
     (QUYET_DINH_CHU_QUAN.md mục Tiền, quầy): BỎ HẲN giảm tay ở quầy — ở quầy chỉ giảm qua mã giảm, hạng thành viên, Giờ vàng.
     Lý do: từ POS-CONGDON-v1 máy chủ KHÔNG nhận mức giảm màn hình gửi; gõ số vào ô này mà không có mã → màn trừ tiền, máy chủ không →
     tổng lệch → máy chủ từ chối, đơn không lưu (KHACH-CK-1 phát hiện 31.10).
     Hiện trạng chat đọc 31.10 trên main 4b52370 — client/src/pages/Sales.jsx:
     - state `discount` (~29, luôn 0), `discountType` / `discountValue` (~56–57); đặt lại ở ~366, ~416, ~790–798;
     - tính `discountAmount` nhánh giảm tay % / đ / `discount` cũ (~620–633);
     - ô "Chiết khấu" (select % / đ + input, chỉ hiện khi chưa có mã hợp lệ) ~1426–1457;
     - thân đơn: `discount`, `discount_reason`, `discount_type`, `discount_value` (~727–731).
     - Máy chủ: orders.js đã bỏ qua mọi mức giảm không mã (LO 2, LO 2b `if (false && …)`) — việc này KHÔNG sửa máy chủ.
     - Bài thử đang khoá ô này: thu_KHACHCK1.js F3a (phiếu KHACH-CK-1 dặn "giữ nguyên") → nay hành vi đổi có duyệt = bài SỬA thường
       (LUAT §6 mục 8, ghi SỐ CA). thu_BH1.js I10 so tập khoá `orderData` của Sales.jsx — GIỮ nguyên tập khoá (chỉ đổi giá trị gửi).
     Màn Bán hàng mới (BanHang/**) không có ô này. Báo cáo cho chủ quán theo LUAT §8. -->

## Mục tiêu
Màn Bán hàng cũ không còn ô "Chiết khấu" giảm tay. Tiền trên màn luôn khớp máy chủ khi không có mã giảm.

## Nghiệm thu
- A Không còn ô "Chiết khấu" (select % / đ + ô số) và không còn state / nhánh tính giảm tay (`discountType`, `discountValue`, nhánh
  `discount > 0`); dòng "Giảm giá" trên màn chỉ đến từ mã giảm (số máy chủ `tinh-thu` khi có).
- B Thân đơn GIỮ đủ các khoá cũ (thu_BH1 I10): không mã → `discount_type: null`, `discount_value: 0`, `discount: 0`; có mã → như cũ.
- C Đơn không mã: tổng trên màn = tổng máy chủ (bài thử tạo đơn thật với thân mà Sales.jsx dựng → không lỗi tổng lệch).
- D Ô "Mã giảm giá", phí vận chuyển, hạng, Giờ vàng, tiền khách đưa / thối, in hoá đơn chạy y như cũ.

## Phạm vi
- viec/BH-CKTAY-1/**
- client/src/pages/Sales.jsx
- client/dist/**
- cong_cu/thu_BHCKTAY1.js
- cong_cu/thu_KHACHCK1.js
- cong_cu/thu_BH1.js
- cong_cu/thu_UUDAI1.js
- cong_cu/thu_P26b.js
- cong_cu/thu_P26c.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_BHCKTAY1.js` ĐỎ trên code gốc: Sales.jsx không còn ô / state giảm tay (đọc nguồn, bắt theo hành vi — không chỉ một tên
biến: không ô nhập nào ghi vào mức giảm, không nhánh cộng giảm ngoài mã); thân không mã gửi `discount_value: 0`; tạo đơn thật bằng thân
đó → máy chủ nhận, tổng = tinh-thu.

## Ngân sách
~40 dòng giao diện (chủ yếu xoá) + ~120 dòng thử.
**Phương án đơn giản nhất đã xét:** xoá ô + state + nhánh tính; giữ tập khoá thân đơn để bài cũ và máy chủ không đổi.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- KHÔNG sửa máy chủ; KHÔNG đổi ô mã giảm, hạng, Giờ vàng, phí vận chuyển, thanh toán, in.
- KHÔNG sửa client/src/pages/BanHang/**.
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/BH-CKTAY-1`. Không đụng main, không merge,
  không tạo PR.
