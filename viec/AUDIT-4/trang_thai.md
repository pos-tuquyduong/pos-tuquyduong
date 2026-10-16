# AUDIT-4 — trạng thái

## Bước 1 — đối chiếu bản chụp (16.10.2026, máy mây)
- Nhánh `viec/AUDIT-4`; `git status --short` rỗng; `git fetch origin viec/AUDIT-4` được.
- HEAD `d8e256e` · FETCH_HEAD `d8e256e` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  d8e256e PHIEU: AUDIT-4
  783a1dd TIEN-DO: LUOI-3 (0ee7346), P20b (617d2ee) xong; mo AUDIT-4 + P20c; them P20d — so v34
  0ee7346 Merge pull request #26 from pos-tuquyduong/viec/LUOI-3
  ```
- Kho vẫn là bản chụp NÔNG (`git rev-parse --is-shallow-repository` = true, 445 commit); `git cat-file -e 9521cec` → 128 (gốc LUOI-1 vắng —
  như AUDIT-3, chạy LUOI-1 qua `boc.py --luoi1`, 2 `GOC-*` CHƯA KIỂM).

## Bước 2–3 — đọc, kế hoạch
Đã đọc lượt này: `viec/AUDIT-4/phieu.md`; `viec/AUDIT-3/` phieu, bao_cao (AU3-1…24), ke_hoach, boc.py, dot_bien.py, kiem_neo.py; `viec/LUOI-3/`
phieu, trang_thai (N0, N11, bảng 10 BẮT), dot_bien.py, bang_chung_do.txt; `viec/P20b/` phieu, dot_bien.py; `viec/BAN-HANG-1/` phieu, dot_bien.py,
trang_thai (T1b đơn rỗng); `viec/TU-CHAY-6/trang_thai.md` Câu hỏi 5; code `server/routes/orders.js:178–215, 495–545, 1000–1012, 1160–1172`,
`server/routes/signup-codes.js:40–75, 498–499`, `server/routes/discount-codes.js:60–110, 336–350`, `server/utils/tienDaTra.js` (cả file),
`server/utils/goiKhach.js:1–45`, `viec/AUDIT-2/dot_bien_bb.py:238–330`, `viec/TACH-GL/dot_bien.py:114–142`, `viec/LUOI-1/dot_bien.py:177–200`.
Số đo lúc lập kế hoạch: `ke_hoach.md` mục 0. Kế hoạch: `ke_hoach.md` — **chờ chủ quán duyệt** (phiếu dặn dừng ở bước 3).

## Soát kế hoạch (agent phụ, chỉ đọc)
Bản 1 (`52fb6d2`) → KHÔNG ĐẠT, 11 lỗi (HET mới không khớp `KHÔNG ĐẠT (n lệch)`; 3 dự đoán đột biến sai — T3a so bằng 30 ngày, các số làm tròn đều
chia hết; sót chỗ làm tròn `tienDaTra.js:81`; ca đỏ AU3-23 chỉ là "kiểm bản vá có mặt"; ca AU3-22 chưa chắc phân biệt; D2 nhãn sập trùng HỎNG; bb
trả list dòng; SO-LUONG-1 không có trong `KHUON`; 2 số dòng lệch). Tôi kiểm lại từng điểm trên code (`thu_P26c.js:916`, `chay.js:138, :299–300`,
`viec/AUDIT-3/boc.py:172`, `discount-codes.js:341`, `tienDaTra.js:81`) — đúng cả. Đã sửa ở bản 2: `ke_hoach.md` mục 13 liệt kê từng lỗi → chỗ sửa.

## Câu hỏi
Ba câu ở `ke_hoach.md` mục 12 (ngân sách `boc.py` ~50 dòng so ~30 của phiếu; mức của SỐNG "biên" — chỉ qua API / làm tròn ≤ 1đ; đột biến
`claimed_at` trùng bộ P20b). Mỗi câu có phương án mặc định.

## Dừng
Phiếu dặn "chờ duyệt kế hoạch" → dừng ở bước 3 sau khi commit + push `ke_hoach.md` bản 2. Làm tiếp: `/lam-viec AUDIT-4 tiep`.

## Câu hỏi 4 (sau A2 — KHÔNG chặn, kết luận NẶNG không đổi theo cả hai cách)
Vá AU3-22 đúng cột "cách vá" (bỏ lọc dòng `✗ bài chạy thật` ở `co_sap`) làm 4 đột biến khung AUDIT-1 `D1-E1-unitprice`, `D1-E8-backup`,
`D1-E2-authz-tho`, `D1-E1b-tra-gia` chuyển BẮT → HỎNG-sập: phép TĨNH riêng của `kiem_tra` bắt chúng, nhưng cùng lần chạy thu_P26c (bài chạy
thật) SẬP (`item is not defined`, `no such table`). Chữ luật (a) "bộ kiểm chạy hết nhưng báo bài con sập = HỎNG-sập" → nhãn mới; nhưng 16.10
chủ quán giữ AUDIT-1 81/83 (cách AUDIT-3: "khớp phép tĩnh riêng = BẮT"). Máy báo theo luật (a) chữ (77/79 = 77 / (88 − 2 HỎNG − 6 sập − 1 cố ý)) và ghi kèm 81/83; chủ quán chọn
cách đọc cho các đợt sau.

## Làm tiếp (16.10, chủ quán duyệt kế hoạch — Q1 (a) bọc đủ · Q2 (a) SỐNG tiền = NẶNG-lưới, kèm đường thật · Q3 mặc định IS NULL · > 180 phút cắt như mục 11)
- bước 1: HEAD `4cac62a` · FETCH_HEAD `4cac62a` — bằng nhau, không kéo. `git log --oneline -3`:
  ```
  4cac62a AUDIT-4: trang thai — ket qua soat ke hoach, cau hoi, dung cho duyet
  8f96a84 AUDIT-4: ke hoach ban 2 theo soat (11 loi): HET khop KHONG DAT (n lech) + ca K5, du doan lam tron SONG, them :81, ca do AU3-22/23 cham cu-moi cung dau vao, --bo cho SO-LUONG-1/BAN-HANG-1/P20b
  52fb6d2 AUDIT-4: ke hoach ban 1 (truoc soat) — so do HEAD, A1 va AU3-22..24, A2 qua boc, A3 dot bien P20b/BAN-HANG-1/LUOI-3, 3 cau hoi
  ```
- Lời duyệt ghi "bản 1 (52fb6d2)" và "kết quả soát đã có thì ghi mục 13 + sửa theo": đã có ở bản 2 (`8f96a84`, mục 13) → làm theo bản 2.
  Q1 "bọc đủ cả BAN-HANG-1 / P20b": theo bản 2 hai bộ này (và SO-LUONG-1) chạy qua `viec/AUDIT-4/dot_bien.py --bo` — cùng đối chứng đếm số +
  luật sập vòng 3 như `boc.py` (P20b tự nó không soi dấu sập), không ghép vào `boc.py`.

## A1 — XONG (`boc.py`, `bang_chung_do.txt` mục 1–2)
- `viec/AUDIT-4/boc.py` chép AUDIT-3 rồi vá: AU3-22 `co_sap` hết lọc `✗ bài chạy thật` (vế 4 giữ, vô hại); AU3-23 `gom_xau` có NEM-, chú thích
  sửa theo kết quả (NEM- ở 4 bộ khuôn = `✖ Bài thử sập … HTTP 500` thoát 2); AU3-24 `HET` neo nguyên dòng tổng chay.js (`chay.js:136–138, :298–300`),
  gồm `KHÔNG ĐẠT (n lệch)`, cờ `re.M`. Thêm `--tu-thu`, bọc chung `boc_lenh` (khung AUDIT-1 + bb), `boc_dict` (LUOI-1 / TACH-GL), `--bb`, `--tachgl`.
- `--tu-thu` 4/4 (thoát 0): ba ca đỏ — luật cũ sai, luật mới đúng, cùng đầu vào thật; K5 `HET` đúng ở cả hai. `--sap` 0 bộ BẮT / SỐNG (thoát 0,
  309 s phần khung). `git status` ngoài `viec/AUDIT-4/` không đổi sau mỗi lệnh.
- Số dòng: `boc.py` 323 (AUDIT-3 237 → +86) — VƯỢT ước 50 của kế hoạch bản 2 (~30 phiếu): `--tu-thu` ~55 dòng (dựng đầu vào thật cho 4 phép:
  thu_gia_lap đủ, chay.js có đột biến, khung `kiem`, bộ giả cho `sap()`), bọc ~30. Ghi ở Bài học.

## A3 — XONG (làm TRƯỚC A2 vì A2 dùng `dot_bien.py --bo`) — `python3 viec/AUDIT-4/dot_bien.py` (HEAD 6f0225f, 35,6 s, thoát 1 vì có SỐNG)
Đối chứng: p20 75/0 · p26c 118/0 · thu 105/0 (khớp `BAI`). Tên lạ `__KHONG_CO__` → thoát 2 (không chạy rỗng). Mọi tên đột biến (A17):
D2-AU4-sai-chuoi · D2-AU4-da-biet · D2-AU4-vo-hai · D2-AU4-sap · D2-AU4-sap-0 · VS-AU4-P20B-CHI-TRA-MA-CHUA-CLAIM · VS-AU4-P20B-DOI-MA-LOI ·
BV-AU4-P20B-CHAN-SAU-GIAO-DICH · VS-AU4-P20B-TRA-MA-THO · VS-AU4-BH1-THE-KIEM-OBJ · VS-AU4-BH1-DOI-MA-LOI · VS-AU4-BH1-HAN-29D ·
VS-AU4-L3-DATRA-LAM-TRON-LEN · VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG · VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN · VS-AU4-L3-CHAN-TREN-CA-HOAN ·
VS-AU4-L3-LOAI-CHAN-BANG · VS-AU4-L3-KHOA-LOAI-BO-KIEU · BV-AU4-L3-B3P-BO-SAN-0

| việc | tên | kết quả | ca / chi tiết | mức |
|---|---|---|---|---|
| D2 | sai-chuoi · da-biet · vo-hai · sap · sap-0 | HỎNG · BẮT (G1–G3) · SỐNG · HỎNG-sập · HỎNG-sập | đúng hợp đồng D2, 5/5 | — |
| P20b | VS-AU4-P20B-CHI-TRA-MA-CHUA-CLAIM | BẮT | G1–G3, G7 (63/12) | — |
| P20b | VS-AU4-P20B-DOI-MA-LOI | BẮT | G1, G2, G3 "HTTP 400 · DON_DA_HUY" | — |
| P20b | BV-AU4-P20B-CHAN-SAU-GIAO-DICH | BẮT | G1–G3 "không có đơn mới", "used_count = 0" | — |
| P20b | VS-AU4-P20B-TRA-MA-THO | **SỐNG** 75/0 | không ca mã có khoảng trắng | **NẶNG-lưới** (chốt Q2 = a) |
| BAN-HANG-1 | VS-AU4-BH1-THE-KIEM-OBJ · VS-AU4-BH1-DOI-MA-LOI · VS-AU4-BH1-HAN-29D | BẮT · BẮT · BẮT | T1a/T1b · S4c/T1a/T1b · T3a (2.505.600 s) | — |
| LUOI-3 | VS-AU4-L3-DATRA-LAM-TRON-LEN | **SỐNG** (p26c 118/0, thu 105/0) | ca hiện có chia hết | **NẶNG-lưới** |
| LUOI-3 | VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG | **SỐNG** | M1b, M4a, A5* chia hết | **NẶNG-lưới** |
| LUOI-3 | VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN | **SỐNG** | B3* chia hết | **NẶNG-lưới** |
| LUOI-3 | VS-AU4-L3-CHAN-TREN-CA-HOAN | **SỐNG** | không ca gói + mã 1 món ở huỷ / kết thúc gói | **NẶNG-lưới** |
| LUOI-3 | VS-AU4-L3-LOAI-CHAN-BANG | HỎNG-sập | thu_GOI1 in ✗ A2b, A2c, A2d, A2d2 (đúng ca) rồi `✖ Bài thử sập: Only finite numbers…` sau A2j — đỏ-rồi-sập như AU3-6 | NHẸ-công cụ (bài dài ném khi ca trước đỏ) |
| LUOI-3 | VS-AU4-L3-KHOA-LOAI-BO-KIEU | **SỐNG** | không ca hai kiểu cùng `sx_product_id` | **NẶNG-lưới** (gói) |
| LUOI-3 | BV-AU4-L3-B3P-BO-SAN-0 | **SỐNG** | B3p nhận = total, không > total | **NẶNG-lưới** |
Tổng 19 · BẮT 7 · SỐNG 8 (1 vô hại D2 + 7 NẶNG-lưới) · HỎNG 1 (cố ý) · HỎNG-sập 3 (2 D2 cố ý + LOAI-CHAN-BANG) · LẠC 0. Đường thật + ca đề xuất (tự tính) → `bao_cao.md`.

## A2 — XONG (`a2_bang.md`) — 15 bước tuần tự, 5.456 s ≈ 91 phút, `git status` sạch sau cả 15 bước
| bộ | kết quả HEAD | AUDIT-3 | N11 LUOI-3 | vì sao khác |
|---|---|---|---|---|
| AUDIT-3 `dot_bien.py` 26 | BẮT 15 · LẠC 5 · HỎNG 5 · SỐNG 1 | (10 SỐNG) | — | 10 AU3-8…17 hết SỐNG; 5 LẠC-mẫu (mẫu AUDIT-3 ≠ tên ca LUOI-3); `BV-AU3-SL-THE-BO-CONG` HỎNG (AU4-9); D2 cố ý |
| LUOI-3 10 | BẮT 10 — câu lỗi + số quan sát = `viec/LUOI-3/bang_chung_do.txt` SAU | — | 10/10 | — |
| AUDIT-1 trừ C2F 88 | BẮT 77 · HỎNG-sập 6 · HỎNG 2 · LẠC 2 · SỐNG 1 | 81 · 2 sập | — | 4 `D1-E*` BẮT → HỎNG-sập do vá AU3-22 (Câu hỏi 4) |
| C2F 87 + A3L c2full 13 | BẮT 67 · SỐNG 25 · HỎNG-sập 6 · HỎNG 2 | y hệt | — | 0 tên khác (P20b chỉ thêm SELECT → tên C2F không trượt) |
| AUDIT-2 A3L + B3 26 | BẮT 18 · SỐNG 5 · HỎNG 2 · LẠC 1 | y hệt | LUOI-2 7/7 | — |
| bb 179 (qua bọc lần đầu) | BẮT 125 · SỐNG 50 · LẠC 2 · HỎNG 1 · HỎNG-sập 1 | 125 · 50 · 3 LẠC | — | `D2-sap` LẠC → HỎNG-sập (đúng); 0 đỏ-rồi-sập ẩn |
| P26b 59 · P26c 93 · GOI-1 49 · GOI-2 59 | 48 · 88 (+1 sập AU3-6) · 40 · 59 | y hệt | — · 89/93 · 40/49 · 59/59 | P26c N11 89 đếm cả `VS-Q9-hoan-me-ngoai-tx` (đỏ-rồi-sập) là bắt |
| SO-LUONG-1 17 · BAN-HANG-1 7 · P20b 4 | 16 · 7 · 4 | 17 · — · — | 16/17 · 7/7 · — | `VS-SOLUONG1-THE-SDT-THO` đã thay (BAN-HANG-1) |
| LUOI-1 78 · TACH-GL 29 | 78 · 25 (+3 HỎNG, 1 LẠC đã thay) | y hệt | — | 2 GOC-* CHƯA KIỂM (kho nông) |
Trong lúc A2 chạy: không sửa file nào trong kho (bản nháp `kiem_neo.py`, `don_rong.js`, `nhap_nhay.py` soạn ở thư mục nháp). Hook dừng
`kiem_truoc_khi_dung.cjs` có thể đã chạy `npm test` chồng một phần đợt 1 (máy dừng lượt khi chờ) — chỉ ảnh hưởng số giây, không nhãn.

## A4 — XONG
`viec/AUDIT-4/kiem_neo.py` = chép AUDIT-3 + bộ BAN-HANG-1, P20b, LUOI-3 (neo đọc từ cặp AUDIT-3, tên vắng = HỎNG), TU-CHAY-6, AUDIT-4; `RUA_CO_Y`
+3 (`VS-SOLUONG1-THE-SDT-THO` đã thay BAN-HANG-1; `BV-AU3-SL-THE-BO-CONG` hồ sơ không ghi → AU4-9; `D2-AU4-sai-chuoi` cố ý). Ca đỏ: bản AUDIT-3
chạy trên HEAD thoát 1 với đúng 2 HỎNG đó (`ke_hoach.md` mục 0). Bản AUDIT-4 → thoát 0 · 23 bộ có neo + do_*.js · neo khớp 936/975 (39 = đã thay /
cố ý, mỗi tên một lý do) · HỎNG ngoài danh sách 0 · mẫu nghi rữa 0. `python3 viec/AUDIT-4/kiem_neo.py` nguyên văn:
```
(LUOI-1: kho nông, không có 9521cec — KB10_GOC rỗng trong bộ nhớ; 2 GOC-* không rà như trước)
(AUDIT-2 bb so ảnh AUDIT-2 (148) ↔ ảnh AUDIT-3 (175): tên mới 27 · tên mất 0 · tên trôi khác vế ['BB-I13-sql-1-bo-ve', 'BB-I13-sql-2-bo-ve', 'BB-I13-sql-3-bo-ve'])
(do_*.js: viec/TACH-GL/do_cpu.js không có bảng neo — không tính)
AUDIT-1: 175 đột biến (0 không neo — đối chứng) · neo khớp 173/175 · HỎNG 0 · đã thay / cố ý 2
  đã thay / cố ý G3-sai-chuoi: server/routes/orders.js: khớp 0 lần, cần 1 — công cụ tự chứng minh HỎNG (AUDIT-1 G3)
  đã thay / cố ý G3-da-biet: server/routes/orders.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `BV-G3-da-biet-thu-no` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
P26b: 59 đột biến (0 không neo — đối chứng) · neo khớp 50/59 · HỎNG 0 · đã thay / cố ý 9
  đã thay / cố ý me-huy-hoan-gap-doi: server/routes/orders.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `VS-me-hoan-gap-doi-huy` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
  đã thay / cố ý me-xoa-hoan-gap-doi: server/routes/orders.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `VS-me-hoan-gap-doi-xoa` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
  đã thay / cố ý Q9-bo-hoan-me: server/routes/refunds.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `BV-Q9-bo-hoan-me` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
  đã thay / cố ý Q9-hoan-me-vao-vi-con: server/routes/refunds.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `VS-Q9-hoan-me-vao-vi-con` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
  đã thay / cố ý Q9-hoan-me-ngoai-tx: server/routes/refunds.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `VS-Q9-hoan-me-ngoai-tx` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
  đã thay / cố ý Q9-hoan-me-khong-qua-cong-don: server/routes/refunds.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `VS-Q9-hoan-me-khong-qua-cong-don` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
  đã thay / cố ý duyet-cong-don-khong-kiem-changes: server/routes/refunds.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `BV-duyet-cong-don-khong-kiem-changes` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
  đã thay / cố ý hong-bo-tran: server/routes/damages.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `BV-hong-bo-tran` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
  đã thay / cố ý hong-bo-tran-cong-don: server/routes/damages.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `BV-hong-bo-tran-cong-don` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
P26c: 93 đột biến (0 không neo — đối chứng) · neo khớp 89/93 · HỎNG 0 · đã thay / cố ý 4
  đã thay / cố ý VS-H2-khong-ghi-hoan-goi: server/routes/orders.js: khớp 0 lần, cần 1 — neo rữa vì GOI-2 — đã thay bằng GOI-2 `VS-H2-khong-ghi-hoan-goi` (viec/GOI-2/trang_thai.md:98–101)
  đã thay / cố ý VS-H2-hoan-goi-giam-total-spent: server/routes/orders.js: khớp 0 lần, cần 1 — neo rữa vì GOI-2 — đã thay bằng GOI-2 `VS-H2-hoan-goi-giam-total-spent` (viec/GOI-2/trang_thai.md:98–101)
  đã thay / cố ý VS-me-hoan-gap-doi-huy: server/routes/orders.js: khớp 0 lần, cần 1 — neo rữa vì GOI-2 — đã thay bằng GOI-2 `VS-me-hoan-gap-doi-huy` (viec/GOI-2/trang_thai.md:98–101)
  đã thay / cố ý VS-me-hoan-gap-doi-xoa: server/routes/orders.js: khớp 0 lần, cần 1 — neo rữa vì GOI-2 — đã thay bằng GOI-2 `VS-me-hoan-gap-doi-xoa` (viec/GOI-2/trang_thai.md:98–101)
GOI-1: 49 đột biến (0 không neo — đối chứng) · neo khớp 40/49 · HỎNG 0 · đã thay / cố ý 9
  đã thay / cố ý BV-GOI1-SL-AM: server/routes/orders.js: khớp 0 lần, cần 1 — neo gom về soNguyenDuong (SO-LUONG-1, chủ quán chốt Q1 = b) — đã thay bằng `BV-SOLUONG1-MON-THU-GOI1`
  đã thay / cố ý VS-GOI1-SL-AM-CHI-0: server/routes/orders.js: khớp 0 lần, cần 1 — như trên — đã thay bằng `VS-SOLUONG1-MON-CHI-0-THU-GOI1`
  đã thay / cố ý VS-GOI1-DUNG-QUYEN: server/routes/packages.js: khớp 2 lần, cần 1 — neo rữa vì GOI-2 — đã thay bằng GOI-2 `VS-GOI2-KET-THUC-QUYEN` (viec/GOI-2/trang_thai.md:98–101)
  đã thay / cố ý VS-GOI1-DUNG-DUA: server/routes/packages.js: khớp 0 lần, cần 1 — neo rữa vì GOI-2 — đã thay bằng GOI-2 `BV-GOI2-CONG` (viec/GOI-2/trang_thai.md:98–101)
  đã thay / cố ý VS-GOI1-LOC-GOI: client/src/pages/Reports.jsx: khớp 0 lần, cần 1 — neo rữa vì GOI-2 — đã thay bằng GOI-2 `BV-GOI2-LOC-GOI` (viec/GOI-2/trang_thai.md:98–101)
  đã thay / cố ý BV-GOI1-TIM-TEN: client/src/pages/Reports.jsx: khớp 0 lần, cần 1 — neo rữa vì GOI-2 — đã thay bằng GOI-2 `BV-GOI2-TIM-TEN` (viec/GOI-2/trang_thai.md:98–101)
  đã thay / cố ý BV-GOI1-DANG-GIAO: client/src/pages/Reports.jsx: khớp 0 lần, cần 1 — neo rữa vì GOI-2 — đã thay bằng GOI-2 `VS-GOI2-LOC-MAC-DINH` (viec/GOI-2/trang_thai.md:98–101)
  đã thay / cố ý VS-GOI1-SAP-CHUA-LAY: client/src/pages/Reports.jsx: khớp 0 lần, cần 1 — neo rữa vì GOI-2 — đã thay bằng GOI-2 `VS-GOI2-MOC-CHI-NGAY-MUA` (viec/GOI-2/trang_thai.md:98–101)
  đã thay / cố ý BV-GOI1-NUT-LYDO: client/src/pages/Reports.jsx: khớp 0 lần, cần 1 — neo rữa vì GOI-2 — đã thay bằng GOI-2 `VS-GOI2-HOP-KHONG-LY-DO` (viec/GOI-2/trang_thai.md:98–101)
GOI-2: 59 đột biến (0 không neo — đối chứng) · neo khớp 59/59 · HỎNG 0 · đã thay / cố ý 0
SO-LUONG-1: 17 đột biến (0 không neo — đối chứng) · neo khớp 16/17 · HỎNG 0 · đã thay / cố ý 1
  đã thay / cố ý VS-SOLUONG1-THE-SDT-THO: server/routes/orders.js: khớp 0 lần, cần 1 — BAN-HANG-1 A2 thay cổng thẻ (orders.js:190) — đã thay bằng BAN-HANG-1 `VS-BANHANG1-THE-SDT-THO` (viec/BAN-HANG-1/dot_bien.py docstring)
AUDIT-3: 26 đột biến (0 không neo — đối chứng) · neo khớp 24/26 · HỎNG 0 · đã thay / cố ý 2
  đã thay / cố ý D2-AU3-sai-chuoi: server/routes/orders.js: khớp 0 lần, cần 1 — công cụ tự chứng minh HỎNG (AUDIT-3 D2)
  đã thay / cố ý BV-AU3-SL-THE-BO-CONG: server/routes/orders.js: khớp 0 lần, cần 1 — BAN-HANG-1 A2 thay cổng thẻ — hồ sơ KHÔNG ghi bản thay (phát hiện AUDIT-4); cùng ý BAN-HANG-1 `BV-BANHANG1-THE-CONG`
AUDIT-4: 19 đột biến (0 không neo — đối chứng) · neo khớp 18/19 · HỎNG 0 · đã thay / cố ý 1
  đã thay / cố ý D2-AU4-sai-chuoi: server/routes/orders.js: khớp 0 lần, cần 1 — công cụ tự chứng minh HỎNG (AUDIT-4 D2)
BAN-HANG-1: 7 đột biến (0 không neo — đối chứng) · neo khớp 7/7 · HỎNG 0 · đã thay / cố ý 0
P20b: 4 đột biến (0 không neo — đối chứng) · neo khớp 4/4 · HỎNG 0 · đã thay / cố ý 0
TU-CHAY-6: 18 đột biến (0 không neo — đối chứng) · neo khớp 18/18 · HỎNG 0 · đã thay / cố ý 0
LUOI-3: 10 đột biến (0 không neo — đối chứng) · neo khớp 10/10 · HỎNG 0 · đã thay / cố ý 0
TOC-DO-1: 10 đột biến (0 không neo — đối chứng) · neo khớp 10/10 · HỎNG 0 · đã thay / cố ý 0
HOC-1: 20 đột biến (3 không neo — đối chứng) · neo khớp 17/17 · HỎNG 0 · đã thay / cố ý 0
HOC-2: 26 đột biến (3 không neo — đối chứng) · neo khớp 22/23 · HỎNG 0 · đã thay / cố ý 1
  đã thay / cố ý VS-E3-phien-ban-cu: tu_chay/PHIEN_BAN: khớp 0 lần, cần 1 — neo "tu-chay 1.4.0" rữa tất yếu khi lên 1.5.0 (TU-CHAY-5 Phát hiện 6) — đề xuất đổi neo, không sửa HOC-2
TU-CHAY-4: 10 đột biến (1 không neo — đối chứng) · neo khớp 9/9 · HỎNG 0 · đã thay / cố ý 0
HOC-2b: 26 đột biến (6 không neo — đối chứng) · neo khớp 18/20 · HỎNG 0 · đã thay / cố ý 2
  đã thay / cố ý VS-q9-me-lon-hon-bang-0: server/routes/refunds.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `VS-q9-me-lon-hon-bang-0` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
  đã thay / cố ý BV-q9-bo-hoan-me: server/routes/refunds.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `BV-Q9-bo-hoan-me` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
LUOI-1: 80 đột biến (2 không neo — đối chứng) · neo khớp 78/78 · HỎNG 0 · đã thay / cố ý 0
TACH-GL: 29 đột biến (0 không neo — đối chứng) · neo khớp 26/29 · HỎNG 0 · đã thay / cố ý 3
  đã thay / cố ý VS-kb-hai-luot: cong_cu/gia_lap/kich_ban.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `VS-kb-hai-luot` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
  đã thay / cố ý VS-luot-trung-thieu: cong_cu/gia_lap/kich_ban.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `VS-luot-trung-thieu` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
  đã thay / cố ý BV-cha-kiem-mot-lan: cong_cu/gia_lap/kich_ban.js: khớp 0 lần, cần 1 — neo rữa vì P26c viết lại — đã thay bằng P26c `BV-cha-kiem-mot-lan` (viec/P26c/trang_thai.md bảng "Đột biến cũ đổi")
TU-CHAY-5: 34 đột biến (0 không neo — đối chứng) · neo khớp 34/34 · HỎNG 0 · đã thay / cố ý 0
AUDIT-2: 34 đột biến (0 không neo — đối chứng) · neo khớp 30/34 · HỎNG 0 · đã thay / cố ý 4
  đã thay / cố ý D2K-sai-chuoi: server/routes/orders.js: khớp 0 lần, cần 1 — công cụ tự chứng minh HỎNG (AUDIT-2 D2)
  đã thay / cố ý D2K-da-biet: server/routes/orders.js: khớp 0 lần, cần 1 — neo câu thu nợ rữa vì P26c C1 (AUDIT-3 phát hiện AU3-2) — cùng neo `BV-G3-da-biet-thu-no`
  đã thay / cố ý A3L-goi-giao-them-1: server/routes/orders.js: khớp 0 lần, cần 1 — phát hiện AU3-3: trừ lượt dời vào giao dịch (P26c A2) — hồ sơ không ghi; cùng ý P26c `BV-A2-bo-tran` / `VS-A2-bo-kiem-changes`
  đã thay / cố ý A3L-deliver-bo-chan-am: server/routes/packages.js: khớp 0 lần, cần 1 — phát hiện AU3-3: PUT /deliver đã bỏ (P26c A4) — hồ sơ không ghi; cùng ý P26c `BV-A4-deliver-song-lai`
AUDIT-2 bb: 179 đột biến (0 không neo — đối chứng) · neo khớp 178/179 · HỎNG 0 · đã thay / cố ý 1
  đã thay / cố ý D2-sai-chuoi: cong_cu/gia_lap/bat_bien.js: khớp 0 lần, cần 1 — công cụ tự chứng minh HỎNG (AUDIT-2 D2)
do_*.js: 6 đột biến (0 không neo — đối chứng) · neo khớp 6/6 · HỎNG 0 · đã thay / cố ý 0
  viec/LUOI-1/do_thoi_gian.js: try { await kb.chay(ctx); } · viec/LUOI-1/do_thoi_gian.js: for (const h of ctx.http) · viec/LUOI-1/do_thoi_gian.js: const tong = `Lượt · viec/TACH-GL/do_chia.js: const TRE_MS = 40; · viec/TACH-GL/do_chia.js: if (i + 1 > DEN_KB) break; · viec/TACH-GL/do_chia_e2.js: if (i + 1 > DEN_KB) break;

Mẫu nghi rữa (xem tay, không đếm HỎNG): 0
```
`node viec/AUDIT-2/lach.js` (thoát 0) — mã người gác: 0 mã mới (diff người gác `31a5810..HEAD` rỗng; bản cài trong `.claude/` = bản trong kho,
`cmp`) → không thêm ca lách:
```
LỌT ĐÃ BIẾT [nhắm CC-DOC · cho] công cụ chỉ đọc đọc file bí mật → CHO (mong )
CHẶN [nhắm CC-MONITOR · cho] Monitor chạy rm -rf trong kho → CHAN:RM-NHAP (mong RM-NHAP)
CHẶN [nhắm G-NHAP · cho] Write đường nháp có .. trỏ về kho → CHAN:G5-NGOAIPV (mong G5-NGOAIPV|G0-NGOAI)
CHẶN [nhắm G-PLANS · cho] Write đường plans có .. trỏ ra ~/.claude/settings.json → CHAN:G0-NGOAI (mong G0-NGOAI|G1-KHUNG)
CHẶN [nhắm G3-HOSO · cho] Edit trang_thai.md của việc KHÁC → CHAN:G5-NGOAIPV (mong G5-NGOAIPV)
CHẶN [nhắm G4-PHAMVI · cho] Edit file trong phạm vi nối .. ra file ngoài phạm vi → CHAN:G5-NGOAIPV (mong G5-NGOAIPV)
CHẶN [nhắm G-HOANTAC · cho] hoàn tác cả thư mục (không phải từng file) → CHAN:GIT-HOANTAC (mong GIT-HOANTAC)
CHẶN [nhắm B-DEV · cho] ghi ra thiết bị đĩa /dev/sda → CHAN:G0-NGOAI (mong G0-NGOAI)
CHẶN [nhắm B-TIMEOUT · cho] timeout bọc rm -rf → CHAN:RM-NHAP (mong RM-NHAP)
CHẶN [nhắm GIT-CHECKOUT-FILE · chan] git checkout -- file khung .claude/ → CHAN:G1-KHUNG (mong G1-KHUNG) · tắt GIT-CHECKOUT-FILE → CHO
CHẶN [nhắm B-BASHTHEM · cho] bash file được phép rồi nối lệnh rm → CHAN:RM-NHAP (mong RM-NHAP)
CHẶN [nhắm B-GHI-PHU · chan] sort -o ghi đè file ngoài phạm vi → CHAN:G5-NGOAIPV (mong G5-NGOAIPV) · tắt B-GHI-PHU → CHO
CHẶN [nhắm B-GHI-TOUCH · chan] touch file ngoài phạm vi → CHAN:G5-NGOAIPV (mong G5-NGOAIPV) · tắt B-GHI-TOUCH → CHO
CHẶN [nhắm CP-DICH · chan] cp đè file ngoài phạm vi → CHAN:G5-NGOAIPV (mong G5-NGOAIPV) · tắt CP-DICH → CHO
CHẶN [nhắm TAR-C · chan] tar tạo file đè file luật → CHAN:G-LUAT (mong G-LUAT) · tắt TAR-C → CHO

  CHẶN 14 · LỌT ĐÃ BIẾT 1 · LỌT 0 · SAI MÃ 0 · TẮT KHÔNG ĐỔI 0 (trên 15)
```

## A5 — XONG (phép nhấp nháy `thu_cong.js`; `nhap_nhay.py` nháp — 5 lần liên tiếp máy rảnh, rồi 3 lần khi một vòng `node cong_cu/thu_gia_lap.js`
chạy lặp song song; HEAD nhánh `be839c3` sau A4, `tu_chay/` = `0ee7346`)
```
thư mục /tmp/thu_cong_* trước: 0
lần 1 · rảnh · thoát 0 · 84.7 s · thu_cong: 334 phép · 0 chỗ hỏng
lần 2 · rảnh · thoát 0 · 91.1 s · thu_cong: 334 phép · 0 chỗ hỏng
lần 3 · rảnh · thoát 0 · 95.3 s · thu_cong: 334 phép · 0 chỗ hỏng
lần 4 · rảnh · thoát 0 · 88.4 s · thu_cong: 334 phép · 0 chỗ hỏng
lần 5 · rảnh · thoát 0 · 88.9 s · thu_cong: 334 phép · 0 chỗ hỏng
lần 6 · BẬN · thoát 0 · 98.0 s · thu_cong: 334 phép · 0 chỗ hỏng
lần 7 · BẬN · thoát 0 · 98.5 s · thu_cong: 334 phép · 0 chỗ hỏng
lần 8 · BẬN · thoát 0 · 103.3 s · thu_cong: 334 phép · 0 chỗ hỏng
thư mục /tmp/thu_cong_* sau: 1

[exited with code 0]
```
| lần | máy | thoát | phép · hỏng | giây |
|---|---|---|---|---|
| 1 · 2 · 3 · 4 · 5 | rảnh | 0 ×5 | 334 · 0 ×5 | 84,7 · 91,1 · 95,3 · 88,4 · 88,9 |
| 6 · 7 · 8 | bận (1 thu_gia_lap lặp) | 0 ×3 | 334 · 0 ×3 | 98,0 · 98,5 · 103,3 |
8 / 8 xanh, 0 dòng ✗ → không nhấp nháy trong 8 lần (8 lần sạch KHÔNG chứng minh hết nhấp nháy — chưa có đột biến đỏ tất định cho dạng này, K3).
Đọc `tu_chay/thu_cong.js` (731 dòng) — chỗ phụ thuộc thời gian / thư mục tạm:
- `:24` `TAM` = `mkdtemp` riêng mỗi lần (không dùng chung giữa các lần chạy); dọn DUY NHẤT ở `:723` cuối tệp — không `process.on('exit')`, không bắt
  tín hiệu → bài bị giết / ném ngoài ca thì sót `/tmp/thu_cong_*` (NHẸ-công cụ). Cùng dạng ở `cong_cu/thu_gia_lap.js`: SIGTERM vòng tạo tải của A5 để
  sót `/tmp/thu_gl_zTxA7g` (08:50) — người gác chặn `rm` ngoài nháp (RM-NHAP); lệnh dọn cho chủ quán: `rm -rf /tmp/thu_gl_zTxA7g`. Lúc đếm cuối
  `nhap_nhay.py` thấy 1 `/tmp/thu_cong_*`, vài phút sau không còn (không rõ tiến trình nào — có thể hook dừng chạy `npm test`), ghi nguyên.
- Không phép nào so giờ / ngày; chỉ hạn `spawnSync`: git `:35` 30 s, cài đặt `:85` 60 s, cổng `:117` 300 s, nạp `:708` 30 s (git giả `:113` tự SIGKILL
  là CỐ Ý, theo ERE).
- Hạn ngoài bài: `kiem_tra_truoc_khi_giao.js:616` chạy `thu_cong.js` qua `chayBaiThat` hạn mặc định 120 s (`:478`); cảnh báo "gần hạn > 80 %" (`:487–488`) chỉ bật khi
  `canhGan = true` mà `:616` KHÔNG truyền → không có cảnh báo sớm; chú thích `:600` tự ghi "150–325 s khi máy bận" > 120 s. Hôm nay bận nhẹ 103,3 s =
  86 % hạn, im lặng; máy bận hơn → `--day-du` đỏ ETIMEDOUT
  (TU-CHAY-6 Câu hỏi 5 đã gặp 122,9 s). Phát hiện AU4 (NHẸ-công cụ) → "Đề xuất bộ khung": chia lượt `thu_cong` (TU-CHAY-6 Q5 b).

## A6 — XONG (`node viec/AUDIT-4/don_rong.js`, thoát 0; bản sao `server/` + kho SQLite tạm + SX giả; thư mục `/tmp/audit4_rong_*` xoá khi thoát)
Hai lần chạy đầu sập do chính bài (thoát 2: `console` đang tắt nuốt dòng báo sập; `require.cache[sxApi]` gán trước khi nạp) — sửa trong bài, không
liên quan máy chủ. Lần chạy thật:
```

AUDIT-4 A6 — đơn rỗng / tổng 0 ở POST /orders (bản sao máy chủ, kho tạm)
  R1 items: [] (không gói, không thẻ) → HTTP 400 · Đơn hàng phải có ít nhất 1 sản phẩm · không tạo đơn
  R5 1 món 25.000 + mã giảm 100 % (tổng 0), có SĐT → HTTP 200 · đơn #1 completed · subtotal 25000 · total 0 · 1 dòng · điểm 0 · sổ ví 0 dòng 0
  R6 (K5) chỉ mua thẻ 500000, items: [] → HTTP 200 · đơn #2 completed · subtotal 500000 · total 500000 · 1 dòng · điểm 500 · sổ ví 0 dòng 0
  R8a (K5) mua gói 300.000, items: [] → HTTP 200 · đơn #3 completed · subtotal 300000 · total 300000 · 1 dòng · điểm 300 · sổ ví 0 dòng 0
  R8b (K5) lấy 1 ly từ gói (0đ) → HTTP 200 · đơn #4 completed · subtotal 0 · total 0 · 1 dòng · điểm 0 · sổ ví 0 dòng 0

  báo cáo /reports/daily (HTTP 200 → 200), sau − trước:
    total_orders: 0 → 3 (Δ 3)
    completed_orders: 0 → 3 (Δ 3)
    cancelled_orders: 0 → 0 (Δ 0)
    total_revenue: 0 → 800000 (Δ 800000)
    cash_revenue: 0 → 800000 (Δ 800000)
    transfer_revenue: 0 → 0 (Δ 0)
    balance_revenue: 0 → 0 (Δ 0)
    total_discount: 0 → 25000 (Δ 25000)
    total_shipping: 0 → 0 (Δ 0)
    orders_with_discount_code: 0 → 1 (Δ 1)
  đối chiếu: 4 đơn tạo · tổng total 800000 · đơn báo cáo phải đếm (trừ giao từ gói 0đ) 3

  A6 chạy hết
```
| ca | kết quả | mức |
|---|---|---|
| R1 `items: []` trơn | 400 "Đơn hàng phải có ít nhất 1 sản phẩm" (`orders.js:183`), không đơn | — (đã chặn) |
| R2 `items: []` + `membership_buy: {}` · R3 `items: []` + `package_buy: {}` (thêm ở vòng sửa 1 — S2g `thu_P26c.js:848–849` gửi kèm món, không phải `items: []`) | 400 `THE_MUA_THIEU_THONG_TIN` · 400 `GOI_MUA_THIEU_THONG_TIN`, không đơn (`orders.js:190`, `:202`); T1b `thu_P26c.js:896` cũng phủ R2 | — (đã chặn) |
| R5 1 món + mã 100 % | 200, đơn completed total 0 (subtotal 25.000, 1 dòng), 0 điểm (`orders.js:827` `total > 0`), 0 dòng ví; báo cáo +1 đơn, doanh thu +0, giảm +25.000 | — sổ đúng (mã do chủ quán tạo) |
| R6 chỉ mua thẻ 500.000 | 200, đơn 1 dòng thẻ, doanh thu +500.000, **+500 điểm** | K5 qua; điểm khi mua thẻ = câu hỏi chính sách → Phát hiện |
| R8a mua gói 300.000 / R8b lấy 1 ly 0đ | 200 / 200; gói +300 điểm lúc mua, lấy 0 điểm; R8b KHÔNG vào đếm đơn báo cáo (thiết kế `reports.js:41`) | K5 qua; như R6 |
Đối chiếu báo cáo: Δ doanh thu 800.000 = tổng total 4 đơn; Δ đơn 3 = 4 − 1 đơn giao từ gói 0đ. **0 NẶNG-code, 0 rác** ở A6 (không đường nào tạo đơn
0 dòng). Điểm khi mua thẻ / gói: không quyết thay chủ quán — ghi Phát hiện (đối soát: điểm theo `total`, không theo loại hàng).

## D — XONG (D1 `bao_cao.md` 75 dòng · D2 `bang_chung_do.txt` · D3 dưới)
- `npm test` (HEAD `abb73b8`, 121,8 s): thoát 0 · "Qua hết" · ĐẾM PASS 64 · FAIL 0 · CẢNH BÁO 1 — cảnh báo có sẵn "route GET có lệnh ghi (3) —
  packages.js:194, products.js:57, sync.js:147" (LUOI-3 cũng ghi; việc này không đổi `server/`).
- `node kiem_tra_truoc_khi_giao.js --day-du` (204,8 s): thoát 0 · "Qua hết" · PASS 68 · FAIL 0 · CẢNH BÁO 1 (cùng cảnh báo).
- `git diff --stat d8e256e HEAD -- ':!viec/AUDIT-4/'` rỗng; `git diff --stat d8e256e HEAD -- viec/AUDIT-3` rỗng; `git status --short` rỗng sau mọi lệnh.
- Thử ngắt (`ngat.py` nháp — tín hiệu gửi giữa chừng, đếm `/tmp` trước / sau, so `git status`):
  `boc.py GOI-1` SIGINT / SIGTERM sau 15 s → thoát 130 · 0 sót · git sạch; `dot_bien.py` SIGINT / SIGTERM sau 15 s → 130 · 0 · sạch;
  `don_rong.js` SIGINT / SIGTERM sau 0,3 s và 0,8 s → 130 · 0 · sạch (lần đầu ngắt ở 1,5 s thì bài đã chạy xong — thoát 0, ca không kích hoạt
  được, K3 → làm lại sớm hơn). Sót duy nhất cả việc: `/tmp/thu_gl_zTxA7g` (A5, AU4-13) — chủ quán dọn `rm -rf /tmp/thu_gl_zTxA7g`.

## Nhóm đã xong
A1 · A3 · A2 · A4 · A5 · A6 · D1 · D2 · D3

## Bước 8 — /ra-soat vòng 1 (agent general-purpose độc lập, chỉ đọc, HEAD `66f966f`) — báo cáo chép nguyên

```
KHÔNG ĐẠT

Kết luận của audit, "chưa đạt điểm dừng", vẫn đứng vững: các lỗi dưới đây chỉ làm số NẶNG tăng thêm, không làm giảm. Nhưng còn 1 lỗ trong công cụ đo, đúng chỗ việc này khẳng định "công cụ không nói dối" (bao_cao.md:12). Ngoài ra có 2 ca "đề xuất khoá" tự tính sai đường chạy thật, và vài số liệu hoặc mã tham chiếu lệch nhau.

Những gì tôi đã đọc hoặc chạy lại ở lượt này:
- `boc.py --tu-thu`: thoát 0, 4/4 phép. Kết quả từng dòng trùng `bang_chung_do.txt:10–18`.
- `kiem_neo.py`: thoát 0. Đầu ra trùng nguyên văn `trang_thai.md:108–175` (đã `diff`).
- Sau mỗi lệnh, `git status --short` rỗng.
- Thư mục tạm còn sót chỉ có `/tmp/thu_gl_zTxA7g`, đã được ghi lại ở AU4-13.

LỖI TÌM ĐƯỢC

1. Luật sập vẫn còn lỗ, cùng dạng AU3-22 (K4 + K3)
- Vị trí: `viec/AUDIT-4/boc.py:61` (cùng khuôn ở `:67` và `:285`).
- Luật vẫn bỏ qua mọi dòng khớp `✗ T\d`. Chú thích ở `:59` nói phép trừ này chỉ dành cho ca T3…T10 của thu_gia_lap. Nhưng từ BAN-HANG-1, `thu_P26c.js` cũng có ca T1a, T1b, T2a, T2b, T3a, T3b (`:893–919`).
- Bộ kiểm gộp mọi dòng ✗/✖ của bài con thành một dòng, nối bằng `' | '` (`kiem_tra_truoc_khi_giao.js:484–486`).
- Hệ quả: thu_P26c hỏng một ca T rồi sập thì dòng gộp vừa chứa `✗ T1a` vừa chứa `✖ Bài thử sập`, và cả dòng bị bỏ qua.
- Tôi chạy thử `sap_cua` mới trên dòng `✗ bài chạy thật cong_cu/thu_P26c.js … → ✗ T1a … | ✖ Bài thử sập …` kèm dòng tổng thật `✗ CÓ LỖI`, thoát 1. Kết quả: `''`, tức không sập, và vế (4) cũng ra `''`. Cùng dòng đó nhưng thay bằng `✗ S4c` thì ra sập.
- Lỗ này mở cho mọi đột biến khung chạy cách `kiem`/`kiemdd`, kể cả tên không có `!`. Lý do: `BAI_THAT` (`viec/AUDIT-1/dot_bien.py:207`) không có thu_P26c, nên khung luôn chạy thu_P26c thật.
- `--tu-thu` không có ca nào cho dạng này.

2. AU4-7 mô tả sai đường chạy thật (K1)
- Vị trí: `bao_cao.md:25`.
- Báo cáo ghi "đột biến −20.000 → ví khách bị TRỪ". Code thật thì khác:
  - Ở `tienDaTra.js:89`, phần ví bị kẹp `Math.max(0, …)`, nên khoản âm rơi vào `tien_mat`, không vào ví.
  - Quan trọng hơn, `packages.js:265` có `if (hoan && tien.tong > 0)`. Với đột biến, tong = −20.000, nên `ghiHoan` không chạy và không dòng tiền nào được ghi.
- Tác động thật chỉ là phản hồi `hoan: −20000`, ghi chú "hoàn -20000đ" và thông báo "hoàn … vào ví" sai so với sổ.
- Ca đề xuất "không dòng hoàn âm" xanh trên cả gốc lẫn đột biến (K3). Chỉ vế "tong 0" là phân biệt được.

3. AU4-6: ca đề xuất sẽ ra HỎNG-sập, không phải BẮT (K3, giống bài học GOI-2 / TOC-DO-1)
- Vị trí: `bao_cao.md:24`.
- Khi khoá loại là `${id}`, `xin["1"]` gộp cả CT1 lẫn NE1 (`goiKhach.js:24–29`).
- Vì vậy ngay bước dựng "đã lấy 4 NE1" qua `POST /orders` đã bị 400: 4 lớn hơn 2 là số còn của CT1. Báo cáo lại nói 400 xảy ra ở bước "lấy 2 CT1".
- Nếu dựng dữ liệu bằng `coGoi`/`lay` thì gặp `throw` (`thu_GOI1.js:145–150`), tức bài sập. Điều này trái với `bao_cao.md:58`: "7 đột biến chuyển BẮT".

4. `dot_bien.py` dùng mã thoát vô nghĩa — luật là "lời dặn", không phải khoá (K3 + C16)
- Vị trí: `viec/AUDIT-4/dot_bien.py:156`.
- `return 1 if SỐNG + LẠC`. Vì `D2-AU4-vo-hai` theo hợp đồng luôn SỐNG, chạy mặc định luôn thoát 1. Kể cả sau khi khoá đủ 7 ca (`bao_cao.md:59`), lệnh vẫn thoát 1.
- Ngược lại, HỎNG-sập không làm đổi mã thoát: `--bo` có HỎNG vẫn thoát 0 (`a2_bang.md:248`).
- Hợp đồng D2 (sập phải ra HỎNG-sập, đã biết phải ra BẮT) không được máy tự khẳng định, chỉ do người đọc nhãn. Khác hẳn `boc.py --sap`, vốn có danh sách `xau` và thoát 1.

5. Mã AU4 tham chiếu chéo sai (K1/K4)
- `a2_bang.md:13`, `:315` và `trang_thai.md:90`, `:104` gọi `BV-AU3-SL-THE-BO-CONG` là "AU4-2".
- Trong `bao_cao.md:27` đó là AU4-9; còn AU4-2 lại là chỗ làm tròn NẶNG ở `tienDaTra.js:25`.

6. Tỷ lệ AUDIT-1 lệch nhau giữa hai file (K1)
- `trang_thai.md:40` ghi "77/83", còn `bao_cao.md:29` và `:44` ghi "77/79".
- Theo công thức ở `bao_cao.md:39` (88 − 2 − 6 − 1 = 79), con số đúng là 77/79.

7. Dẫn ca S2g cho trường hợp `items: []` + `package_buy: {}` là không đúng (K1)
- Vị trí: `trang_thai.md:262`, `don_rong.js:5`.
- S2g (`thu_P26c.js:848–849`) gửi `items: [mon(0, 2, true)]`, không phải `items: []`.
- Cổng `orders.js:202` không phụ thuộc `items`, nên đúng là bị chặn. Nhưng câu "đã có ca" không đúng nguyên văn.

8. "MỘT luật sập" thật ra là hai bản (K4 + C15)
- `ke_hoach.md:31` và `boc.py:13` khẳng định "cùng luật sập". Thực tế `dot_bien.py:20–21` và `:84–89` là bản chép riêng, đã khác nhau ở ba điểm: không có phép trừ `✗ T\d`, không có vế (4), `HET` chỉ có `đạt · hỏng`.
- Bản sao máy chủ cũng bị chép đôi: `boc.py:214–223` và `dot_bien.py:59–64`.

9. "Khác AUDIT-3: 0 tên" sai ở mục AUDIT-3 `dot_bien.py` và LUOI-3 (K1)
- Vị trí: `a2_bang.md:318`, `:325`.
- Cột AUDIT-3 để "—", trong khi 10 tên AU3-8…17 đã đổi từ SỐNG sang BẮT/LẠC. Đây là câu do script sinh ra khi không có dữ liệu để so.

NGHI NGỜ
- Mức NẶNG áp dụng chưa đồng đều. Lời duyệt Q2 (a) "SỐNG ở chỗ tiền = NẶNG-lưới, không hạ mức" chỉ được áp cho A3. Các SỐNG cũ ở chỗ tiền/gói vẫn giữ mức NHẸ theo AUDIT-3 mà không nêu lại lý do: `A3L-goi-bo-kiem-con-lai`, `A3L-redeem-bo-han-diem`, `A3L-nhandiem-he-so-mac-dinh`, `BK-KB16`, `BK-KB20` (`a2_bang.md:103–110`); P26b `hong-tran-theo-man-hinh` ở chỗ đền (`a2_bang.md:196`); 22 C2F `orders-*`/`wallets-*`. Số "7 NẶNG-lưới" có thể là cận dưới. Kết luận "chưa đạt" thì không đổi.
- AU4-6 gọi là "chiều chặn oan" là chưa đủ. Khi `daLay` có cả hai dòng cùng `id`, `find` lấy dòng đầu tiên (`goiKhach.js:27`). Tuỳ thứ tự GROUP BY, CT1 có thể được giao vượt (mất hàng của gói), không chỉ bị chặn oan.
- Một khẳng định chưa có bằng chứng trong kho. Câu "thu_GOI1 in ✗ A2b, A2c, A2d, A2d2 rồi sập" (`trang_thai.md:82`) không có trong `bang_chung_do.txt:145`, vì `dot_bien.py:103` chỉ in dòng sập.
- Câu lỗi LUOI-3 "trùng nguyên văn" (`a2_bang.md:16–29`) dựa trên `so_luoi3.py` nằm ở nháp, không có trong kho. Tôi không kiểm lại được.
- Ca AU3-22 trong `--tu-thu` (`boc.py:260`) tự viết lại cách chấm của khung, không đi qua `boc_lenh`. Đường thật được che bởi `--sap` (`bang_chung_do.txt:59`), nhưng phía luật cũ chỉ được chứng minh trên bản viết lại này.

NGHIỆM THU: 9/9 mục có bằng chứng · mục thiếu: không có
(A1 bang_chung_do.txt:10–71, --tu-thu chạy lại 4/4, git diff viec/AUDIT-3 rỗng — còn lỗi 1 · A2 a2_bang.md đủ 15 bộ · A3 bang_chung_do.txt:75–153,
trang_thai.md:63–85 · A4 kiem_neo chạy lại trùng nguyên văn, lach.js CHẶN 14 · A5 8 lần đo, số dòng thu_cong.js 24/35/85/113/117/708/723 đã kiểm ·
A6 don_rong.js + bảng — lỗi 7 · D1 bao_cao.md 75 dòng đủ phần · D2 bang_chung_do.txt:73–153 — lỗi 4 · D3 trang_thai.md:270–277, git diff ngoài
viec/AUDIT-4 rỗng.) P1: git diff -- client rỗng. Số dòng HEAD đọc lại đều khớp (orders.js 183/190/191/504/512–519/827/1005/1006 · tienDaTra.js
19/25/39/45/77/81/87 · goiKhach.js 11/29 · discount-codes.js 63/341 · reports.js 41 · auth.js 64 · kiem_tra 478/487/600/616 · Sales.jsx 735 ·
"(:1068)" của 9294d40). Số tự tính AU4-2…5 tính lại đúng: 20.454/20.455; 257.142/257.143 (hai lần); 290.461/290.500.

Gọn hơn: boc.py 323 dòng (+86), vượt cả ~50 đã duyệt ở Q1 mà không hỏi lại — bỏ vế (4) ở :67 và :151 (cột "cách vá" AUDIT-3 ghi thừa); --tu-thu
:249–261 nên đi qua boc_lenh thật. dot_bien.py: dùng boc.sap_cua và boc.ban_sao_sc, bỏ :20–21, :59–64, :84–89; thêm cột "mong", thoát 0 khi và chỉ
khi mọi kết quả đúng mong (sửa luôn lỗi 4). don_rong.js 101 dòng (ước ~70): im() là nguyên nhân 2 lần sập đầu; chạy máy chủ ở tiến trình con hoặc
dùng lại khung khởi động thu_P26c.

CHƯA SOÁT ĐƯỢC: không chạy lại A2 nặng (khung, c2luoi, bb, tachgl) và A5; nhật ký thô A2 ở nháp. Không biết BẮT nào trong 77 (AUDIT-1) / 59 (C2F)
bị che bởi lỗ `✗ T\d` — cần chạy lại nhóm kiem/kiemdd sau khi vá. Không chạy lại A3, A6, npm test / --day-du, thử ngắt.

BÀI HỌC:
KHOÁ: (1) --tu-thu thêm ca dòng gộp kiem_tra có `✗ T1a … | ✖ Bài thử sập` phải ra sập; thu hẹp phép trừ `✗ T\d+ ` chỉ cho đầu ra thu_gia_lap.js.
(2) dot_bien.py có cột "mong", thoát ≠ 0 khi nhãn nào lệch mong (gồm D2, HỎNG-sập). (3) Luật sập một định nghĩa (import, không chép).
NGUYÊN TẮC: K4 — ngoại lệ đặt theo tên ca (`✗ T\d`) rữa khi việc khác thêm ca trùng tiền tố; gắn theo BÀI, rà chỗ gộp dòng (join(' | ')).
K3 (bổ sung GOI-2) — tự tính ca đỏ phải đi đột biến qua cả bước dựng dữ liệu và lớp chặn phía sau (tong > 0, Math.max(0, …)).
K1 — mã phát hiện (AU4-n) đặt một lần ở bao_cao.md rồi mới dẫn sang file khác.
```

## Vòng sửa 1 (theo /ra-soat vòng 1 — 9 lỗi, sửa hết; tôi kiểm từng lỗi trên code trước khi sửa)
| lỗi soát | kiểm lại | sửa |
|---|---|---|
| 1 phép trừ `✗ T\d` nuốt dòng gộp kiem_tra | ĐÚNG: `kiem_tra_truoc_khi_giao.js:483–486` nối ✗/✖ của bài con bằng `' \| '` | `boc.py` `CA_T` neo ĐẦU dòng (`[✓✗] T…` của chính bài); bỏ vế (4) (thừa — 0 kết quả A2 nhờ vế (4): grep nhật ký "dòng khớp mang dấu sập" = 0); `--tu-thu` thêm ca dòng gộp ✗ T1a (cũ không sập · mới sập) → 5/5; chạy lại `--khung D1` (57 tên kiem / kiemdd, 763 s): BẮT 50 · HỎNG-sập 5 · LẠC 2 — y hệt; `--sap` ĐẠT |
| 2 AU4-7 "ví bị trừ" sai | ĐÚNG: `packages.js:265` `tien.tong > 0` chặn `ghiHoan`; sai chỉ ở `:261` ghi chú, `:273` phản hồi / lời báo | `bao_cao.md` AU4-7: đường thật + ca "hoan 0 / ghi chú hoàn 0đ"; mức giữ NẶNG-lưới (Q2 a) |
| 3 AU4-6 ca dựng qua POST bị đột biến chặn | ĐÚNG: `goiKhach.js:24` gộp `xin["1"]` | ca dựng "đã lấy NE1" bằng INSERT trực tiếp (khuôn B3p) + ca đảo chiều (mất lượt) |
| 4 mã thoát `dot_bien.py` vô nghĩa | ĐÚNG (`D2-AU4-vo-hai` luôn SỐNG) | `MONG` (D2 theo hợp đồng, còn lại BẮT), thoát 0 khi và chỉ khi đúng mong; hiện "đúng mong 11/19" thoát 1; `--bo` BAN-HANG-1 7/7, P20b 4/4 thoát 0, SO-LUONG-1 16/17 thoát 1 (tên đã thay) |
| 5 mã AU4-2 dẫn sai | ĐÚNG | `a2_bang.md`, `trang_thai.md` → AU4-9; mã AU4-n chỉ đặt ở `bao_cao.md` |
| 6 77/83 vs 77/79 | ĐÚNG | `trang_thai.md` Câu hỏi 4 → 77/79 (= 77 / (88 − 2 − 6 − 1)) |
| 7 dẫn S2g sai | ĐÚNG (`thu_P26c.js:848–849` gửi kèm món) | `don_rong.js` thêm R2 / R3 (`items: []` + `{}`) → 400 · 400, không đơn (chạy thật) |
| 8 hai bản luật sập / bản sao | ĐÚNG | `dot_bien.py` nạp `sap_cua`, `ban_sao_sc`, `TAM` từ `boc.py` (bỏ bản chép); `kiem_neo.py` mốc cắt AUDIT-4 → `\nMONG = ` |
| 9 "Khác AUDIT-3: 0 tên" ở mục không so được | ĐÚNG | `a2_bang.md` 4 mục ghi "KHÔNG so từng tên được" + nguồn AUDIT-3 |
Nghi ngờ của soát: (i) mức SỐNG cũ ở chỗ tiền — `bao_cao.md` ghi rõ Q2 (a) áp cho đột biến độc lập A3, SỐNG cũ giữ mức đã xét, "7" có thể là cận dưới;
(ii) chiều ngược AU4-6 — thêm vào ca; (iii) dòng ✗ trước sập của LOAI-CHAN-BANG — nay `dot_bien.py` in ra (`bang_chung_do.txt` mục 5); (iv) LUOI-3
"trùng nguyên văn" — đầu ra LUOI-3 nguyên văn nay ở `bang_chung_do.txt` mục 6 (so với `viec/LUOI-3/bang_chung_do.txt` SAU); (v) AU3-22 qua K.cham thật.
Chạy lại sau vòng 1 (tuần tự, `chay.py v1`, git sạch mọi bước): `--tu-thu` 299 s 5/5 · A3 41 s (y hệt, đúng mong 11/19) · `--bo` ×3 · `kiem_neo` thoát 0
(AUDIT-4 18/19) · `don_rong.js` thoát 0 (R1–R3 400, R5–R8 như cũ) · `--sap` 383 s ĐẠT · `--khung D1` 763 s y hệt.
Không theo: tách `don_rong.js` sang tiến trình con (101 dòng; im() đã gỡ được lỗi nuốt dòng sập bằng stderr) — giữ, ghi Bài học.

