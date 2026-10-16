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

## Nền N11 — bộ đột biến cũ chạy lại trên HEAD `8303c1b` (trước mọi sửa; từng bộ chạy riêng, nối tiếp)
| bộ | bị bắt / tổng | không bị bắt | thời gian |
|---|---|---|---|
| `viec/P26c/dot_bien.py` | 89 / 93 | 4 — đều "không áp được" (VS-H2-khong-ghi-hoan-goi, VS-H2-hoan-goi-giam-total-spent, VS-me-hoan-gap-doi-huy, VS-me-hoan-gap-doi-xoa) | 231 s |
| `viec/GOI-1/dot_bien.py` | 40 / 49 | 9 — đều "không áp được" (BV-GOI1-SL-AM, VS-GOI1-SL-AM-CHI-0, VS-GOI1-DUNG-QUYEN, VS-GOI1-DUNG-DUA, VS-GOI1-LOC-GOI, BV-GOI1-TIM-TEN, BV-GOI1-DANG-GIAO, VS-GOI1-SAP-CHUA-LAY, BV-GOI1-NUT-LYDO) | 33 s |
| `viec/GOI-2/dot_bien.py` | 59 / 59 | 0 | 46 s |
| `viec/SO-LUONG-1/dot_bien.py` | 16 / 17 | 1 — "không áp được" (VS-SOLUONG1-THE-SDT-THO) | 24 s |
| `viec/BAN-HANG-1/dot_bien.py` | 7 / 7 | 0 | 11 s |
| LUOI-2: `viec/AUDIT-2/dot_bien.py <7 tên A3L> -j 4` | 7 / 7 (L1a, L2a, L3a, L4a, L5a, A1c, L6a) | 0 | 128 s |

LUOI-2 thoát 3 với dòng `✗ KHO BẨN`: chính máy sửa `viec/LUOI-3/ke_hoach.md`, `trang_thai.md` (theo soát kế hoạch) TRONG lúc bộ chạy;
`git status --short` sau đó chỉ có hai file đó, `data/` không có file. Lần chạy N11 thật (bước 6) sẽ không sửa file khi bộ đang chạy.

Sau khi thêm ca: phải BẰNG các số trên (bắt không giảm, "không áp được" không tăng).

## Soát kế hoạch (agent phụ, chỉ đọc)
Không ngoài Phạm vi; tự tính lại tiền mọi ca trên gốc + đột biến → không ca nào xanh oan nếu dữ liệu đúng; lập luận "qua API trần
kết thúc gói không chặn" đúng (rà 4 nơi ghi `refund` / `compensation`). Đã sửa `ke_hoach.md` theo soát:
1. M2a lọc `flash_unit_price` theo `product_id`; M3a `discount` 31.000 (không chép khuôn B1a) — không thì ca đỏ trên gốc.
2. `sys.dont_write_bytecode = True` trước khi nạp AUDIT-3 (không đẻ `__pycache__` trong thư mục Cấm).
3. Dẫn chứng K4: `refunds.js:164` không tới `tienDaTraTheoDong`; N3 chỉ ở đường đền.
4. B3p ghi khoản đền cũ bằng `pos_damage_logs` + `ghiVi` trong `trongGiaoDich`, cuối khối B3.
Không theo: gộp M1b vào M4a (bớt ~6 dòng nhưng một ca mang 3 đột biến → "đỏ đúng ca" kém rõ).

## Câu hỏi
(xem `ke_hoach.md` mục 5 — gửi kèm lần duyệt kế hoạch)

## Dừng
Phiếu dặn "chờ duyệt kế hoạch" → dừng ở bước 3 sau khi commit + push `ke_hoach.md`.
