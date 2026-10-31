# Kế hoạch BH-CKTAY-1

Phương án A (chọn): xoá ô + state + nhánh tính trong `Sales.jsx` (1 file, ~−55 dòng), giữ tập khoá `orderData`; thân không mã gửi
`discount: 0`, `discount_type: null`, `discount_value: 0`. Phương án B: giữ state nhưng ẩn ô — thừa, để lại nhánh chết → loại.

Ca thử ↔ nghiệm thu (`cong_cu/thu_BHCKTAY1.js`): A ← A1–A4 · B ← B1–B3 (B3 = K5: có mã vẫn gửi như cũ) · C ← C1–C2 (đơn thật qua máy chủ,
tổng = tinh-thu) · D ← không đụng ô mã / phí / thanh toán / in: bài cũ thu_BH1 (I10–I11 khoá tập khoá), thu_UUDAI1, thu_P26b/c vẫn xanh trong `npm test`.
Bài cũ sửa: thu_KHACHCK1 F3a (hành vi đổi có duyệt — LUAT §6 mục 8, đỏ trên gốc, SỐ CA 37).
Đường song song (K4): `grep discount` Sales.jsx — dòng "Giảm giá" ở màn thanh toán (dùng `discount` luôn 0) đổi sang `discountAmount`; không có đường thứ hai ghi mức giảm.
Chưa dùng agent phụ soát kế hoạch (kế hoạch viết sau khi đọc code, việc xoá thuần) — `/ra-soat` ở bước 8 là lần soát độc lập.
