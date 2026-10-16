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

## Dừng (lượt trước)
Phiếu dặn "chờ duyệt kế hoạch" → dừng ở bước 3 sau khi commit + push `ke_hoach.md`.

## Làm tiếp (16.10, chủ quán duyệt kế hoạch 04cea99; Câu hỏi 1 → A)
- bước 1: HEAD `04cea99` · FETCH_HEAD `04cea99` — bằng nhau, không kéo. `git log --oneline -3`:
  ```
  04cea99 LUOI-3: trang thai nen N11 (bo dot bien cu tren 8303c1b) + soat ke hoach
  012c221 LUOI-3: ke hoach sua theo soat (M2a loc dong, M3a discount 31.000, bytecode truoc importlib, K4 refunds, B3p ghi den cu)
  6bc3347 LUOI-3: ke hoach (cho duyet, ban nhap truoc soat)
  ```
- Câu hỏi 1: chủ quán chọn (A) — B3p ghi rõ "dữ liệu trước P26c 12.10, còn trên production", ví khớp sổ qua `trongGiaoDich`.

## Bước 4–5 — ca hồi quy + đột biến (không sửa code quầy)
Mọi tên đột biến (`viec/LUOI-3/dot_bien.py`, cặp thay chuỗi đọc từ `viec/AUDIT-3/dot_bien.py`):
BV-AU3-P26C-DATRA-BO-TRU-SHIP · VS-AU3-P26C-DATRA-GIA-GOC · VS-AU3-P26C-DEN-GIAM-BO-FLASH · VS-AU3-GOI1-LOAI-KHONG-CONG-DON ·
VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN · BV-AU3-GOI2-BO-TRAN-DA-NHAN · VS-AU3-GOI2-NHAN-BO-DEN · VS-AU3-SL-DONG-GOI-SL-1 ·
VS-AU3-SL-DONG-GOI-TONG-1 · VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL

| NT | tên | SỐNG trước (89172f3) | BẮT sau (2dd9ce9) | ca đỏ | câu lỗi (đột biến làm) |
|---|---|---|---|---|---|
| N1 | BV-AU3-P26C-DATRA-BO-TRU-SHIP | SỐNG 111/111 | BẮT | M1a, M1b | đền 45.001 → 200; huỷ ví +252.000 |
| N2 | VS-AU3-P26C-DATRA-GIA-GOC | SỐNG | BẮT | M2a, M2b | dòng flash 20.001 → 200; dòng thường 30.000 → 400 (trần 27.272) |
| N3 | VS-AU3-P26C-DEN-GIAM-BO-FLASH | SỐNG | BẮT | M3a | đền A 25.000 → 400 (trần 19.000) |
| N4 | VS-AU3-GOI1-LOAI-KHONG-CONG-DON | SỐNG 101/101 | BẮT | A2l (+ A2m hệ quả) | 2 + 2 CT1 → 200, giao 6 |
| N5 | VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN | SỐNG | BẮT | A2n | 400 GOI_HET_LUOT_LOAI "CT1 chỉ còn 0" |
| N6 | BV-AU3-GOI2-BO-TRAN-DA-NHAN | SỐNG | BẮT | B3p | hoàn 1.215.000 |
| N7 | VS-AU3-GOI2-NHAN-BO-DEN | SỐNG | BẮT | B3p | hoàn 1.215.000 |
| N8 | VS-AU3-SL-DONG-GOI-SL-1 | SỐNG | BẮT | M4a (+ M4b quantity 1) | ví +510.000 |
| N9 | VS-AU3-SL-DONG-GOI-TONG-1 | SỐNG | BẮT | M4b | SUM(total_price) 300.000 |
| N10 | VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL | SỐNG | BẮT | M4a | ví +486.000 |

Chi tiết nguyên văn: `bang_chung_do.txt`. Ca khác cùng đỏ (A2m, M4b) là hệ quả của cùng lỗi; ca mang tên đột biến luôn đỏ.

## Bước 6 — kiểm (trên 946120c — code / bài thử không đổi sau đó)
- `npm test`: PASS 64 · FAIL 0 · CẢNH BÁO 1 — cảnh báo có sẵn "route GET có lệnh ghi (3) — packages.js:194, products.js:57,
  sync.js:147" (`git diff 8303c1b --stat -- server client` rỗng → không do việc này).
- `node kiem_tra_truoc_khi_giao.js --day-du`: PASS 68 · FAIL 0 · CẢNH BÁO 1 (cùng cảnh báo).
- Thời gian (đo riêng 3 lần): `thu_P26c.js` 2,7 · 3,2 · 3,3 s (118 ca); `thu_GOI1.js` 2,3 · 2,2 · 2,1 s (105 ca) — < 3 % hạn 120 s.
- N11 sau khi thêm ca (chạy nối tiếp, không sửa file khi chạy): P26c 89/93 (241 s) · GOI-1 40/49 · GOI-2 59/59 · SO-LUONG-1 16/17 ·
  BAN-HANG-1 7/7 · LUOI-2 7/7 (`✓ kho thật không đổi`) — BẰNG nền; danh sách 14 "không áp được" giống hệt (diff rỗng).
- `node tu_chay/cong.js tinh . 8303c1b^ HEAD viec/LUOI-3`: chỉ `✗ [A19]` (chưa ghi HEAD ĐÃ KIỂM — bình thường trước 11.4).
- Số dòng: `thu_P26c.js` +61, `thu_GOI1.js` +29, `viec/LUOI-3/dot_bien.py` 65 → 155, trong khung 150–250; 0 dòng code quầy.

## Bước 8 — /ra-soat vòng 1 (agent độc lập, trên HEAD 4dd17a6) — báo cáo nguyên văn
```
ĐẠT. Các lỗi dưới đây đều nhỏ, không làm thiếu mục nghiệm thu nào. Nên sửa lỗi 1 trước khi gộp, việc sửa không đụng code quầy.

Tự chạy lại trên HEAD 4dd17a6: thu_P26c 118/0, thu_GOI1 105/0; dot_bien.py đối chứng xanh, 10 BẮT, thoát 0; npm test PASS 64 ·
FAIL 0 · CẢNH BÁO 1; --day-du PASS 68 · FAIL 0 · CẢNH BÁO 1; N11 P26c 89/93 · GOI-1 40/49 · GOI-2 59/59 · SO-LUONG-1 16/17 ·
BAN-HANG-1 7/7, 14 "không áp được" đúng tên; script nháp in đủ dòng ✗: M4a 510000 / 486000, B3p {"tong":1215000} + 409
GOI_HOAN_DOI_SO, M3a "Tiền đền tối đa: 19,000đ".

LỖI TÌM ĐƯỢC:
1. viec/LUOI-3/dot_bien.py:53, :65 — gõ sai tên đột biến thì không chạy gì mà vẫn xanh ("tổng 0 · BẮT 0 …", thoát 0) — K3.
   Sửa: if not chon or any(a not in CAP for a in sys.argv[1:]): sys.exit(2).
2. trang_thai.md:36 ↔ ke_hoach.md:113 — thời gian chạy 10 đột biến trỏ vòng, không ghi số đo — K1.
3. dot_bien.py:43 cắt dòng ✗ ở 150 ký tự → bang_chung_do.txt không chứa số lỗi thật (B3p, M3a, M4a, A2n) — K1.
4. ke_hoach.md:22 dẫn damages.js:171 (thật :172); ke_hoach.md:17 dẫn GOI_THE_KHONG_DEN :175 (thật :176) — K1 nhỏ.
5. thu_GOI1.js:701, :705 — B3p ghi đền ngày 2026-10-01 nhưng đơn mua tạo giờ hiện tại → đền trước khi mua — K1 nhỏ.

NGHI NGỜ:
- Mẫu ✗ M1[ab] / ✗ M2[ab] nhận một trong hai ca — M1b mất sức bắt vẫn báo BẮT nhờ M1a; muốn khoá cả hai vế cần hai mẫu.
- Lập luận "qua API trần kết thúc gói không chặn": không thấy phản ví dụ (mã 1 món), chưa chứng minh mọi tổ hợp.
- M3 phụ thuộc GIAM1MON / nhóm 77 của [B1] — dời B1 thì M3a ĐỎ (kiểm tổng 55.000), hướng hỏng an toàn.

K3 ca thêm, kiểm số tiền thật, biên trên/dưới đủ, chấm sập = HỎNG đúng; K4 0 chỗ sót (tienDaTraTheoDong 3 chỗ gọi, soTienHoan 2,
vuotTheoLoai 2, / dong.quantity có B3d); K5 không phép chặn mới, ca không ảnh hưởng ca sau; đường tiền / P1 không đụng server, client.
Đơn giản: dot_bien.py:33–47 viết lại phần chấm của AUDIT-3 (có thể gọi A.chay1, mất phần in mọi ✗); tên ca B3p ~250 ký tự → rút gọn.

NGHIỆM THU: 12/12 mục có bằng chứng · mục thiếu: không có.
CHƯA SOÁT ĐƯỢC: bộ LUOI-2 (7 A3L) không chạy lại; trạng thái TRƯỚC (89172f3) không tự chạy lại; lịch sử "trước P26c trần đền
theo giá gốc" (kho nông); thời gian npm test đo khi máy chạy song song.
BÀI HỌC:
- KHOÁ: mọi dot_bien.py nhận danh sách tên phải thoát ≠ 0 khi argv có tên lạ / chọn 0 đột biến (phép cổng tu_chay: chạy
  <dot_bien.py> __TEN_KHONG_CO__ phải thoát ≠ 0).
- NGUYÊN TẮC (K3): "chạy rỗng ≠ xanh" — bộ chấm phải có ca đầu vào rỗng / gõ sai, và ca đó đỏ.
- NGUYÊN TẮC (K1): file bằng chứng chứa nguyên văn số liệu bảng hồ sơ trích; không cắt dòng lỗi; không để hai hồ sơ trỏ vòng.
```
(Báo cáo gốc dài hơn ở phần trả lời từng mục; trên đây giữ nguyên mọi lỗi, nghi ngờ, nghiệm thu, chưa soát, bài học.)
