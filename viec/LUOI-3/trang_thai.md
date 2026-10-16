# LUOI-3 — trạng thái

## Bước 1 — đối chiếu bản chụp (16.10.2026)
- nhánh: `viec/LUOI-3`; `git status --short` sạch
- HEAD `8303c1b` · FETCH_HEAD `8303c1b` — bằng nhau, không kéo
- `git log --oneline -3`:
  ```
  8303c1b PHIEU: LUOI-3
  09ddeb0 TIEN-DO: AUDIT-3 (bf2201d), TU-CHAY-6 (024dab9), BAN-HANG-1 (5d2294c) xong; them LUOI-3 + AUDIT-4; mo P20b — so v33
  024dab9 Merge pull request #24 from pos-tuquyduong/viec/TU-CHAY-6
  ```

## N0 — 10 đột biến AUDIT-3 chạy lại trên HEAD `8303c1b` (trước mọi sửa)
`python3 viec/AUDIT-3/dot_bien.py <10 tên>` (thoát 1 vì có SỐNG — đúng mong đợi):
```
  ✓ đối chứng (bản sao chưa đột biến phải xanh): cong_cu/thu_P26c.js: 111 đạt · 0 hỏng
  ✓ đối chứng (bản sao chưa đột biến phải xanh): cong_cu/thu_GOI1.js: 101 đạt · 0 hỏng
  SỐNG  BV-AU3-P26C-DATRA-BO-TRU-SHIP: thoát 0, KHÔNG thấy /✗ / ·   111 đạt · 0 hỏng
  SỐNG  VS-AU3-P26C-DATRA-GIA-GOC: thoát 0, KHÔNG thấy /✗ B1/ ·   111 đạt · 0 hỏng
  SỐNG  VS-AU3-P26C-DEN-GIAM-BO-FLASH: thoát 0, KHÔNG thấy /✗ B1/ ·   111 đạt · 0 hỏng
  SỐNG  VS-AU3-GOI1-LOAI-KHONG-CONG-DON: thoát 0, KHÔNG thấy /✗ A2/ ·   101 đạt · 0 hỏng
  SỐNG  VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN: thoát 0, KHÔNG thấy /✗ A[12]/ ·   101 đạt · 0 hỏng
  SỐNG  BV-AU3-GOI2-BO-TRAN-DA-NHAN: thoát 0, KHÔNG thấy /✗ B[37]/ ·   101 đạt · 0 hỏng
  SỐNG  VS-AU3-GOI2-NHAN-BO-DEN: thoát 0, KHÔNG thấy /✗ B[37]/ ·   101 đạt · 0 hỏng
  SỐNG  VS-AU3-SL-DONG-GOI-SL-1: thoát 0, KHÔNG thấy /✗ (S2|A5)/ ·   111 đạt · 0 hỏng
  SỐNG  VS-AU3-SL-DONG-GOI-TONG-1: thoát 0, KHÔNG thấy /✗ (S2|A5|I)/ ·   111 đạt · 0 hỏng
  SỐNG  VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL: thoát 0, KHÔNG thấy /✗ A5/ ·   111 đạt · 0 hỏng

  tổng 10 · BẮT 0 · SỐNG 10 · HỎNG 0 · LẠC 0
```
- Neo: cả 10 áp được (không HỎNG) → **không neo lại**, không đụng `viec/AUDIT-3/`.

## Thời gian máy (đo riêng, HEAD `8303c1b`, 3 lần mỗi bài)
- `node cong_cu/thu_P26c.js`: 2,5 · 2,6 · 2,5 s (111 ca) — hạn bộ kiểm 120 s (`kiem_tra_truoc_khi_giao.js:477`), 80 % = 96 s
- `node cong_cu/thu_GOI1.js`: 2,0 · 2,3 · 2,6 s (101 ca) — cùng hạn
- 10 đột biến AUDIT-3 (4 luồng song song): xem `ke_hoach.md` mục 6

## Câu hỏi
(xem `ke_hoach.md` mục 5 — gửi kèm lần duyệt kế hoạch)

## Dừng
Phiếu dặn "chờ duyệt kế hoạch" → dừng ở bước 3 sau khi commit + push `ke_hoach.md`.
