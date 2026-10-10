# TACH-GL — trạng thái

## Bản chụp lúc mở phiên (10.10.2026) — E1
`git branch --show-current` → `viec/TACH-GL`
```
2237259 PHIEU: TACH-GL
263f2ca TIEN-DO: LUOI-1 xong (28638d0), TACH-GL mo phieu — so v25
28638d0 Merge pull request #12 from pos-tuquyduong/viec/LUOI-1
```
Có commit `PHIEU: TACH-GL`, cha là commit sổ v25 (`263f2ca`).

## Bước đang làm
Bước 3 (kế hoạch) — phiếu dặn **chờ duyệt kế hoạch**: `ke_hoach.md` đã viết, commit, push, DỪNG. Chưa viết bài thử, chưa
sửa code.

## Soát kế hoạch (agent phụ, chỉ đọc, 10.10) — CẦN SỬA 7 điểm, đã sửa trong ke_hoach.md
1. Cách chia C cũ tách KB4 (lượt 3) / KB8 (lượt 4) → M3 (đối soát cộng debt_payment, `thu_gia_lap` E2) SỐNG: KB4 ghi dòng
   `debt_payment` của KH.quen (`server/routes/orders.js:1257`), M3 chỉ lệch ở KB8 khi dòng đó có. Bằng chứng: `do_chia_e2.js` trên C
   → 12/13 (M3 SỐNG), trên C' (KB8 sang lượt 3) → 13/13 BẮT. Đổi sang C'; bảng B1 thêm cột "cần để đột biến vẫn bắt".
2. Thêm phép B6 trước khi chốt cách chia (`do_chia_e2.js`); C2F 87 chạy ở D3 sau khi làm — SỐNG mới thì đổi `LUOT`, không nới.
3. Ghi rõ: M lấy từ con (giữ E4c), cha không in lại dòng tổng của con (bánh cóc lấy kết quả khớp đầu), ca "đúng một dòng tổng".
4. LUOI-1: thêm 28 vào vòng `LENH` (`dot_bien.py:140`).
5. Bước còn thiếu: `npm test` (F), E1, E2 CHƯA KIỂM, cột soQuay/nhanKho trong B1.
6. Ước CPU 1 lõi cộng tiến trình con của T1–T5.
7. KB28 sang lượt 1 (bỏ ràng buộc "sau KB27").

## Câu hỏi
Xem `ke_hoach.md` mục 10 (Q1–Q2) — trả lời cùng lời duyệt kế hoạch.

## Phát hiện (ngoài phạm vi — KHÔNG sửa)
1. Màn quản trị thêm quà (`client/src/pages/Settings.jsx:565–571`) gửi `POST /api/pos/rewards` KHÔNG kèm `max_discount`; sửa
   quà (`:581`) chỉ gửi `is_active`. Máy chủ nhận được trần (`server/routes/rewards.js:32`, `:47`, `:65`) nhưng từ màn hình
   KHÔNG đặt được trần cho quà % → quà % tạo ở quầy luôn KHÔNG trần (khách đổi quà 50 % mua đơn lớn được giảm 50 % không giới
   hạn). Nghiệp vụ — chủ quán quyết có cần ô "giảm tối đa" trên màn thêm quà không.
