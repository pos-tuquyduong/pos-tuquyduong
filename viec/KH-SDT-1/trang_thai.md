# KH-SDT-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (31.10.2026)
- Nhánh: `viec/KH-SDT-1`; cây sạch.
- HEAD `87aa996` · FETCH_HEAD `87aa996` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  87aa996 PHIEU: KH-SDT-1
  18ee394 TIEN-DO: KHO-2b, BH-CKTAY-1, KH-QUAY-2, KH-MUA-1 xong; mo SEPAY-1, MANKHACH-1, KHO-IN-1, KH-SDT-1, them KHO-2c; quyet dinh 31.10 (SePay, man khach, SDT moi tu 0, khoi phuc khi dong cua, sua phieu nhan) — so v51
  596c346 Merge pull request #60 from pos-tuquyduong/viec/KH-MUA-1
  ```

## Bước 2–3 — đọc + kế hoạch
- Đã đọc phiếu, QUYET_DINH_CHU_QUAN.md (mục 31.10), code: xem `ke_hoach.md` (mọi khẳng định kèm file:dòng).
- Phiếu dặn **Chờ duyệt kế hoạch** → commit + push `ke_hoach.md`, DỪNG ở bước 3. Câu hỏi cho chủ quán ở `ke_hoach.md` mục 6 (chép lại dưới).

## Câu hỏi
Xem `ke_hoach.md` mục 6 — Q1…Q6, mỗi câu có đề xuất của máy để chủ quán chỉ cần xác nhận.

## Phát hiện
- `server/routes/sync.js:289` (nhập khách từ SX) và `server/routes/customers-v2.js:58` (`cacheCustomersToLocal`) tạo hồ sơ với
  `created_at` = `CURRENT_TIMESTAMP` (giờ UTC, dạng có dấu cách) hoặc không ghi — trái luật giờ VN (LUAT §2). Không sửa trong việc này
  (sync.js ngoài Phạm vi); kế hoạch KHÔNG dùng `pos_customers.created_at` làm ranh giới vì lẽ đó.

## Soát kế hoạch (agent phụ, chỉ đọc)
Bắt và đã sửa vào `ke_hoach.md`: `customers.js:225/234` lọc theo `customer_id` (bỏ sửa); `customers-v2.js:327/367` tạo hồ sơ cho SĐT bất kỳ
(chuyển sang gắn mốc); huỷ / hoàn đơn cũ trả lượt voucher (`tienDaTra.js:62`) → khoá cả mã đã dùng bằng `is_active=0`; `huyDon`
(`donApp.js:292`) chưa lọc mốc; thêm ca T3 (đủ 4 đường quầy), T7/T7b, T10 (file), T15 (hoàn, báo cáo), T18 (cùng giao dịch).
DỪNG ở bước 3 — chờ chủ quán duyệt kế hoạch + trả lời Q1–Q6.
