# UUDAI-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (26.10.2026)
- Nhánh: `viec/UUDAI-1`; cây sạch; HEAD `8b436c0` · FETCH_HEAD `8b436c0` (bằng nhau → không kéo).
- `git log --oneline -3`:
  ```
  8b436c0 PHIEU: UUDAI-1
  40e07ce TIEN-DO: P3 (56e090d), BH-1 (9fd32af), DIEM-THAT-1 xong; mo UUDAI-1; them COMBO-1a, COMBO-1b + 4 viec nho; lich — so v41
  66605d1 Merge pull request #46 from pos-tuquyduong/viec/DIEM-THAT-1
  ```

## Bước 2–3 — đọc + kế hoạch
- Kế hoạch: `ke_hoach.md` (agent phụ chỉ đọc đã soát theo 4 câu — mục 8 của kế hoạch). Phiếu dặn **chờ duyệt kế hoạch** → DỪNG ở đây.
- Chưa sửa code, chưa viết bài thử.

## Câu hỏi
- **Q1 (CHẶN):** màn Bán hàng đang chạy (`client/src/pages/Sales.jsx:586-610`, màn trang chủ mặc định — `BanHang/index.jsx:34`) tự tính
  tổng: giảm mã của `/discount-codes/validate` (trên subtotal GỐC) cộng giảm hạng. Máy chủ đổi công thức (mã % sau hạng; chế độ tắt chỉ
  lấy một) → tiền gửi lệch tổng → `orders.js:850` trả 400 "không khớp tổng". Ví dụ ở mặc định '1': Vàng 10% + mã 10%, 2 × 50.000 → màn
  gửi 80.000, máy chủ 81.000 → quầy không bán được. `Sales.jsx` ngoài Phạm vi. Chọn: **Q1-a** thêm `client/src/pages/Sales.jsx` vào Phạm vi
  (có mã → hỏi `POST /orders/tinh-thu` qua client `api` có sẵn, ~20 dòng; không mã → không đổi) — đề xuất; **Q1-b** chờ BH-2 thay màn cũ rồi
  mới gộp; **Q1-c** sửa nghiệm thu B. Chi tiết: `ke_hoach.md` mục 1.
- Q2–Q3 và mốc `min_order`, làm tròn: đã chọn phương án trong `ke_hoach.md` mục 2 (không chặn) — chủ quán sửa nếu khác ý.

## Phát hiện (ngoài Phạm vi, không sửa)
- `discount-codes.js /validate` (`:145-157`) xem trước tiền giảm trên subtotal gốc — sẽ lệch số máy chủ mới với khách có hạng. Màn mới nên
  dùng `tinh-thu`.
- Chốt phiên payOS (`giuCho.js:97`) chạy lại `taoDon`: cài đặt / lượt mã / giá đổi giữa lúc tạo phiên và lúc tiền về → chốt 400, phiên
  'loi' sau khi khách đã trả (`giuCho.js:114-118`). Có từ trước (giá, Flash); việc này thêm một nguồn.
- `discount-codes.js /increment-usage` (`:355`) — đường tiêu mã thứ hai, không màn nào gọi.
- Giảm riêng của khách (`orders.js:610-627` → `:714`) không làm tròn đồng.
