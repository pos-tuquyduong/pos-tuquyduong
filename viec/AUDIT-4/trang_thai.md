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
- `viec/AUDIT-4/boc.py` chép AUDIT-3 rồi vá: AU3-22 `co_sap` hết lọc `✗ bài chạy thật` (vế 4 giữ lúc đầu — bỏ ở vòng sửa 1); AU3-23 `gom_xau` có NEM-, chú thích
  sửa theo kết quả (NEM- ở 4 bộ khuôn = `✖ Bài thử sập … HTTP 500` thoát 2); AU3-24 `HET` neo nguyên dòng tổng chay.js (`chay.js:136–138, :298–300`),
  gồm `KHÔNG ĐẠT (n lệch)`, cờ `re.M`. Thêm `--tu-thu`, bọc chung `boc_lenh` (khung AUDIT-1 + bb), `boc_dict` (LUOI-1 / TACH-GL), `--bb`, `--tachgl`.
- `--tu-thu` 4/4 lúc đầu (sau vòng sửa 1: 5/5, vòng sửa 2: 8/8 — mục Vòng sửa): ba ca đỏ — luật cũ sai, luật mới đúng, cùng đầu vào thật; K5 `HET` đúng ở cả hai. `--sap` 0 bộ BẮT / SỐNG (thoát 0,
  309 s phần khung). `git status` ngoài `viec/AUDIT-4/` không đổi sau mỗi lệnh.
- Số dòng: `boc.py` 323 lúc A1 (AUDIT-3 237 → +86; sau vòng sửa 3: 368, +131 — Bài học) — VƯỢT ước 50 của kế hoạch bản 2 (~30 phiếu): `--tu-thu` ~55 dòng (dựng đầu vào thật cho 4 phép:
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
| LUOI-3 | VS-AU4-L3-LOAI-CHAN-BANG | HỎNG-sập | thu_GOI1 in ✗ A2b, A2c, A2d, A2d2 (đúng ca) rồi `✖ Bài thử sập: Only finite numbers…` (`bang_chung_do.txt` mục 5) — đỏ-rồi-sập như AU3-6 | NHẸ-công cụ (bài dài ném khi ca trước đỏ) |
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
chạy trên HEAD thoát 1 với đúng 2 HỎNG đó (`ke_hoach.md` mục 0). Bản AUDIT-4 → thoát 0 · 22 bộ có neo + do_*.js · neo khớp 936/975 (39 = đã thay /
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
| 1 phép trừ `✗ T\d` nuốt dòng gộp kiem_tra | ĐÚNG: `kiem_tra_truoc_khi_giao.js:483–486` nối ✗/✖ của bài con bằng `' \| '` | `boc.py` `CA_T` neo ĐẦU dòng (`[✓✗] T…` của chính bài); bỏ vế (4) (thừa — 0 kết quả A2 nhờ vế (4): grep nhật ký "dòng khớp mang dấu sập" = 0); `--tu-thu` thêm ca dòng gộp ✗ T1a (cũ không sập · mới sập) → 5/5; chạy lại `--khung D1` (57 tên nhóm D1 = 53 kiem + 4 cong, 763 s): BẮT 50 · HỎNG-sập 5 · LẠC 2 — y hệt; `--sap` ĐẠT |
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

## Bước 8 — /ra-soat vòng 2 (agent general-purpose MỚI, độc lập, chỉ đọc, HEAD `26cfd2f`) — báo cáo chép nguyên

```
KHÔNG ĐẠT

Kết luận chính của audit vẫn đứng: "chưa đạt điểm dừng". Các lỗi dưới đây không làm số NẶNG giảm đi. Nhưng vòng sửa 1 lại để lộ lỗ mới đúng ở chỗ việc này khẳng định "công cụ đo không nói dối", và vài con số đã cũ.

Những gì tôi đã chạy lại ở lượt này (HEAD 26cfd2f). Sau mỗi lệnh, `git status --short` đều rỗng; trong /tmp chỉ còn thư mục đã ghi nhận /tmp/thu_gl_zTxA7g.
- `boc.py --tu-thu`: thoát 0, 5/5. Từng dòng trùng `bang_chung_do.txt:161–171`.
- `kiem_neo.py`: thoát 0. Đầu ra trùng nguyên văn `trang_thai.md:107–175` (đã diff); tổng neo khớp 936/975.
- `don_rong.js`: thoát 0. R1/R2/R3 trả 400 và không tạo đơn; R5–R8 cho kết quả như bảng.
- Thử ngắt `dot_bien.py` sau vòng sửa (vì nay nó dùng TAM của boc.py), cả SIGTERM lẫn SIGINT ở giây thứ 6: thoát 130, không sót thư mục nào, git sạch. Trước đó chưa ai ghi lại phép thử này sau vòng sửa.
- Script nháp `thu_sap.py` chấm `sap_cua` (luật mới, AUDIT-4) và luật cũ AUDIT-3 trên 16 dạng dòng thật: dòng tổng của chay.js (`Giả lập: …`, `Lượt k: KB …`, `KHÔNG ĐẠT (n lệch)`), thu_gia_lap T3, dòng gộp của kiem_tra, thu_P26c T1a, thu_cong, thu_cong_cu, thu_nguoi_gac.

LỖI TÌM ĐƯỢC:
1. `viec/AUDIT-4/boc.py:59–65`, `:234–282` — không có ca nào khoá vế "phải KHÔNG sập" của `CA_T` — K3.
   - Dòng ✗ T3/T4/T6/T10 của thu_gia_lap khi đỏ thật có chứa "Giả lập: SẬP": mô tả `moTaT`/`moTa` gắn thêm `cuoi(r)` (`thu_gia_lap.js:114–117`).
   - Mẫu bắt các tên TACH-GL dựa đúng vào những dòng này (`viec/TACH-GL/dot_bien.py:41–60`).
   - Gỡ hẳn `CA_T` thì `--tu-thu` vẫn 5/5. Tôi đã đo: gỡ `CA_T` thì dòng "✗ T3 … Giả lập: SẬP" bị chấm thành sập.
   - Tức là 25 BẮT của TACH-GL chỉ dựa vào một vế không có ca đỏ.
2. `viec/AUDIT-4/boc.py:291` (`--xep`) — vòng sửa làm hỏng, cùng khuôn K4 ("đổi phép thì mọi chỗ gọi là một chỗ vá riêng").
   - `CA_T` neo đầu dòng nên không bao giờ khớp dòng nhật ký (dòng nhật ký mở đầu bằng "✓ BẮT …").
   - Tôi đã đo trên cùng một dòng TACH-GL "✓ BẮT BV-cha-khong-dung-con-SIGTERM · ✗ T3 … Giả lập: SẬP": AUDIT-3 ra `--xep: BẮT 1`, AUDIT-4 ra `HỎNG-sập 1` (sai).
   - Hiện chưa kết quả nào dùng `--xep`, nên tác động là NHẸ.
3. `viec/AUDIT-4/boc.py:59` — chấm sập oan trên dòng gộp của `--day-du` — K5.
   - `kiem_tra_truoc_khi_giao.js:829` chạy thu_gia_lap; `:483–486` nối các dòng ✗ của bài con thành một dòng.
   - Dòng gộp "✗ bài chạy thật cong_cu/thu_gia_lap.js … → ✗ T3 … Giả lập: SẬP" là đỏ thật, nhưng luật mới chấm sập. Luật cũ chấm không sập.
   - Cùng một dòng ✗ T3 thì chạy thẳng không sập, đi qua kiem_tra lại sập.
   - Hiện chỉ có 1 tên dùng `kiemdd` là `A3B-D5` (`viec/AUDIT-2/dot_bien.py:48`, chỉ đụng client), nên chưa có tên nào bị ảnh hưởng.
4. `bao_cao.md:14`, `a2_bang.md:15`, `trang_thai.md:381` — câu "chạy lại 57 tên khung cách kiem / kiemdd" sai — K1 + K4.
   - Nhóm D1 có 53 tên `kiem` cộng 4 tên `cong` (grep `'D1', 'kiem'` = 53, `'D1', 'cong'` = 4).
   - 4 tên thật sự dùng kiem/kiemdd của AUDIT-2 A3B chưa chạy lại theo luật mới: `A3B-D2`, `A3B-D3`, `A3B-D4` (kiem) và `A3B-D5` (kiemdd), `viec/AUDIT-2/dot_bien.py:43–48`.
5. `bao_cao.md:50` — dòng A1 vẫn ghi "`--tu-thu` 4/4", trong khi `:13–14` và `bang_chung_do.txt:171` ghi 5/5 — K1/K4 (chạy lại nhưng chưa grep hết câu trích số cũ).
6. `viec/AUDIT-4/boc.py:11–12` — chú thích đầu file vẫn ghi luật sập có vế "dòng khớp mang dấu sập", nhưng `:69–71` đã bỏ vế này — K1 (chú thích cũng là khẳng định, TU-CHAY-6).
7. `viec/AUDIT-4/dot_bien.py:144–146` — mã thoát của `--bo SO-LUONG-1` luôn là 1 — K3/K4, cùng khuôn lỗi 4 vòng 1 nhưng ở chế độ `--bo`.
   - Tên đã thay `VS-SOLUONG1-THE-SDT-THO` ra HỎNG, mà `MONG` không biết danh sách đã thay (`RUA_CO_Y` chỉ nằm ở kiem_neo.py).
   - Bản sửa lỗi 4 mới áp cho chế độ mặc định.
8. `bao_cao.md:26` (AU4-6) — ca chiều ngược chưa tự tính — K3 (bài học GOI-2).
   - Ca chính đúng. Tôi đã tự tính: gốc 200; đột biến làm CT1 đọc nhầm dòng NE1 = 4, còn −2, ra 400. Bước dựng bằng INSERT tránh được đột biến. Lớp chặn sau (`orders.js:247`, `:941`) không đổi kết quả.
   - "Ca thứ hai đảo vai CT1/NE1" hiểu theo chữ (đã lấy 4 CT1, lấy 2 NE1) vẫn ra 400, tức vẫn là chặn oan, không phải "mất lượt".
   - Muốn ra chiều giao vượt cần hai dòng "đã lấy", và dòng của loại xin lấy không đứng đầu trong GROUP BY. Ví dụ: X(kiểu sau, id 1) cài 2 + Y(kiểu trước, id 1) cài 5; đã lấy X 2 + Y 1; lấy 1 X. Gốc ra 400; đột biến ra 200, X giao 3/2.
   - `goiKhach.js:18` không có ORDER BY, nên ca phải cố định thứ tự hoặc thử cả hai thứ tự.
   - AU4-7 tôi tự tính lại đúng: gốc tong 0, đột biến −20.000; `packages.js:265` chặn `ghiHoan`; ca phân biệt được qua phản hồi `hoan` và ghi chú ở `:261`/`:273`.
9. `trang_thai.md` khối A6 nguyên văn (sau `:236`) — thiếu R2/R3, nên lời "chạy thật" ở `:381` không có đầu ra trong kho (bản tôi chạy lại thì khớp). Thêm nữa, "23 bộ có neo + do_*.js" (`bao_cao.md:61`, `trang_thai.md:105`) thực ra là 22 bộ + do_*.js = 23 nhóm. Cả hai thuộc K1.

NGHI NGỜ:
- Dấu sập `SAP` (`boc.py:21`, chép từ AUDIT-3) không phủ dạng sập của cả một khối "<tên khối> sập: …" ở `tu_chay/thu_cong.js:721` và `thu_cong_cu.js:510`. Script đo: chạy thẳng và qua dòng gộp đều ra "không sập". Chưa biết BẮT nào trong nhóm A3/B1/`!D1-T1*` là bắt nhờ khối sập (nhật ký ở nháp).
- `dot_bien.py:96` gọi `TONG.search(ra).group(0)`: nếu `HET` khớp nhờ vế khác (`PASS n`, `✓ XANH`) mà không có dòng "n đạt · n hỏng" thì AttributeError làm sập cả lệnh.
- `boc.py:224` kiểm realpath bằng `assert` và không có `os.sep`; trong khi `dot_bien.py:67` có `os.sep`. Hai phép kiểm cùng việc nhưng chặt khác nhau.
- "rồi sập sau A2j" (`bao_cao.md:28`, `trang_thai.md:82`) không có bằng chứng: `bang_chung_do.txt:252–256` chỉ in dòng ✗.
- Mức các SỐNG cũ ở chỗ tiền giữ theo AUDIT-2/3 (`bao_cao.md:38–41`). Chủ quán có áp Q2 (a) cho các SỐNG này không thì cần chủ quán xác nhận; kết luận "chưa đạt" không đổi.

NGHIỆM THU: 9/9 mục có bằng chứng · mục thiếu: không có (nhưng còn lỗi ở A1, A2, A6, D1).
- A1: bang_chung_do.txt mục 1, 2, 4; --tu-thu chạy lại 5/5; diff viec/AUDIT-3 rỗng. Còn lỗi 1 và 2. · A2: a2_bang.md đủ 15 bước. Còn lỗi 4.
- A3: bang_chung_do.txt:174–264, đúng mong 11/19, cộng lại khớp bao_cao.md:60. · A4: kiem_neo chạy lại trùng nguyên văn; lach.js CHẶN 14.
- A5: 8 lần đo; số dòng thu_cong.js:24 và :723 đã kiểm. · A6: don_rong.js chạy lại, khớp bảng. Còn lỗi 9. · D1: bao_cao.md 82 dòng, đủ phần. Còn lỗi 5.
- D2: bang_chung_do.txt mục 3 và 5, hợp đồng MONG. · D3: npm test/--day-du chạy ở abb73b8; kiem_tra không quét viec/ (grep), nên vòng sửa không
  ảnh hưởng. Diff ngoài viec/AUDIT-4 rỗng. Thử ngắt sau vòng sửa: sạch. · P1: git diff d8e256e^ HEAD -- client server rỗng.
- Số dòng HEAD đọc lại đều khớp (packages.js 261/265/273; kiem_tra 478/483–486/487/600/616/829; thu_P26c 848–849/896; goiKhach 11/24/27/29; orders.js
  183/190/202/247/504/512–519/827/884/941/1005; tienDaTra 19/25/45/81/87; auth.js 64; reports.js 41; discount-codes.js 63/341; Sales.jsx 735).
  Số tự tính đều đúng: AU4-2 20.454/20.455; AU4-3, AU4-4 257.142/257.143; AU4-5 290.461/290.500.

CHƯA SOÁT ĐƯỢC: không chạy lại A2 nặng, A5, --sap, npm test; chưa biết 4 tên A3B kiem/kiemdd ra nhãn gì theo luật mới; chưa biết BẮT nào của
tu_chay là bắt nhờ khối sập (nhật ký thô ở nháp); so_luoi3.py ở nháp — câu lỗi LUOI-3 chỉ so được với bang_chung_do.txt mục 6.

BÀI HỌC:
- KHOÁ: (1) --tu-thu thêm ca "phải KHÔNG sập": đầu ra thật của thu_gia_lap có dòng ✗ T3 đỏ mang "Giả lập: SẬP", thoát 1, có dòng tổng; thêm đột
  biến gỡ CA_T để chứng minh ca đó ra ĐỎ. (2) Ca dòng gộp --day-du của thu_gia_lap ✗ T: định nghĩa ngoại lệ theo BÀI (→ ✗ T… sau "bài chạy thật
  cong_cu/thu_gia_lap.js"), hoặc ghi rõ là sập có chủ ý. (3) Bỏ --xep, hoặc thêm ca cho nó.
- NGUYÊN TẮC: K4 — ngoại lệ neo đầu dòng chỉ đúng với dòng gốc của bài; mỗi nơi dòng đó xuất hiện lại (dòng gộp kiem_tra, nhật ký --xep) là một
  chỗ vá riêng. K3 — vá một phép trừ thì phải có ca cho CẢ HAI vế: dòng bị trừ oan, và dòng phải được trừ. K1 — chạy lại một tập con thì đếm tên
  theo CÁCH chạy (grep), không theo nhóm; con số "đã chạy lại N" phải khớp đúng tập bị ảnh hưởng.
- BỎ: không có.
```

## Vòng sửa 2 (theo /ra-soat vòng 2 — 9 lỗi + 5 nghi ngờ; tôi kiểm trên code: thu_gia_lap.js:114–117, kiem_tra :483–486 / :829,
## thu_cong.js:721, thu_cong_cu.js:510 — đúng cả)
| lỗi soát | sửa |
|---|---|
| 1 vế trừ ca T không ca "phải KHÔNG sập" | `--tu-thu` thêm ca: thu_gia_lap ĐỎ THẬT (đột biến TACH-GL `BV-cha-khong-dung-con-SIGTERM`, ✗ T3 mang "Giả lập: SẬP") → không sập; gỡ vế trừ → sập (ca đỏ của chính vế) |
| 2 `--xep` hỏng sau vòng 1 | bỏ `--xep` (không kết quả nào dùng) |
| 3 dòng gộp `--day-du` thu_gia_lap ✗ T3 chấm sập oan | phép trừ ca T theo ĐOẠN (`doan`: bỏ đầu "… bài chạy thật <bài> xanh (…)  →", tách ` \| `) — ca mới: dòng gộp từ đầu ra thật → không sập; ca vòng 1 (✗ T1a … \| ✖ Bài thử sập) vẫn sập |
| 4 "57 tên kiem / kiemdd" sai | sửa chữ (D1 = 53 kiem + 4 cong); chạy lại khung AUDIT-1 trừ C2F ĐỦ 88 tên theo luật vòng 2 (1151 s): y hệt từng tên. A3B (4 kiem / kiemdd) ngoài A2 theo phiếu — ghi rõ |
| 5 `bao_cao.md:50` 4/4 | → 8/8 |
| 6 chú thích đầu `boc.py` còn vế (4) | sửa docstring |
| 7 `--bo SO-LUONG-1` luôn thoát 1 | `MONG` thêm `VS-SOLUONG1-THE-SDT-THO: HỎNG` (đã thay) → đúng mong 17/17, thoát 0 |
| 8 AU4-6 chiều ngược chưa tự tính | dùng ca soát tự tính (X sau / Y trước, đã lấy X 2 + Y 1, lấy 1 X: gốc 400, đột biến 200) + ghi `goiKhach.js:18` không ORDER BY |
| 9 A6 thiếu R2/R3 nguyên văn; "23 bộ" | chép đầu ra `don_rong.js` vòng 1 dưới; "22 bộ + do_*.js" |
| nghi ngờ: dấu sập khối `baiX sập:` | ĐÚNG — `SAP` thêm `\bbai[A-Z]\w* sập: ` (chỉ 2 nơi sinh, grep); ca `--tu-thu`: khối baiT2 của thu_cong_cu ném → cũ không sập · mới sập |
| nghi ngờ: `TONG.search(...)` ném khi vắng | dòng tổng vắng → lấy dòng đầu, không ném |
| nghi ngờ: `assert` realpath thiếu `os.sep` | `ban_sao_sc` kiểm `realpath + os.sep`, `SystemExit` (không assert) |
| nghi ngờ: "sau A2j" không bằng chứng | bỏ chữ; bằng chứng ✗ trước sập ở `bang_chung_do.txt` mục 5 |
| nghi ngờ: mức SỐNG cũ | Câu hỏi 5 (không chặn) |
Chạy lại sau vòng 2 (tuần tự `chay.py v2`, git sạch mọi bước): `--tu-thu` 354,7 s 8/8 · A3 40,2 s y hệt (đúng mong 11/19) · `--bo SO-LUONG-1` 17/17 thoát 0 ·
`--sap` 382,3 s ĐẠT · `--khung G3 A3 B1 C2 D1` 1151,4 s y hệt từng tên (77 · 6 sập · 2 · 2 · 1).

A6 — `node viec/AUDIT-4/don_rong.js` sau vòng sửa 1 (có R2, R3), nguyên văn:
```
$ node viec/AUDIT-4/don_rong.js
# thoát 0 · 1.2 s

AUDIT-4 A6 — đơn rỗng / tổng 0 ở POST /orders (bản sao máy chủ, kho tạm)
  R1 items: [] (không gói, không thẻ) → HTTP 400 · Đơn hàng phải có ít nhất 1 sản phẩm · không tạo đơn
  R2 items: [] + membership_buy: {} → HTTP 400 · THE_MUA_THIEU_THONG_TIN · Mua thẻ cần chọn hạng thẻ và khách hàng · không tạo đơn
  R3 items: [] + package_buy: {} → HTTP 400 · GOI_MUA_THIEU_THONG_TIN · Mua gói cần chọn gói và khách hàng · không tạo đơn
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

## Câu hỏi 5 (sau soát vòng 2 — KHÔNG chặn, kết luận "chưa đạt" không đổi)
Q2 (a) "SỐNG ở chỗ tiền = NẶNG-lưới" máy áp cho đột biến ĐỘC LẬP của việc này (phiếu A3). Các SỐNG CŨ ở chỗ tiền / gói (A3L `goi-bo-kiem-con-lai`,
`redeem-bo-han-diem`, `nhandiem-he-so-mac-dinh`; B3 KB16, KB20; P26b `hong-tran-theo-man-hinh`; 22 C2F) giữ mức AUDIT-2 / AUDIT-3 đã xét kèm lý do.
Chủ quán có áp Q2 (a) cho cả SỐNG cũ không? Có → "7 NẶNG" là cận dưới (bao_cao.md đã ghi).

## Bước 8 — /ra-soat vòng 3 (agent general-purpose MỚI, độc lập, chỉ đọc, HEAD `c6cec45`) — báo cáo chép nguyên

```
KHÔNG ĐẠT (lỗi nhẹ, ở công cụ đo; kết luận "chưa đạt điểm dừng: 0 NẶNG-code, 7 NẶNG-lưới" vẫn đứng)

Những gì tôi đã chạy lại trên HEAD c6cec45. Sau mỗi lệnh `git status --short` đều rỗng, và thư mục tạm trong nháp không sót gì.
- `boc.py --tu-thu`: thoát 0, 8/8. Từng dòng trùng `bang_chung_do.txt` mục 7.
- `kiem_neo.py`: thoát 0. Đầu ra trùng nguyên văn `trang_thai.md:108–175` (đã diff). Tôi tự cộng lại: 936/975, 39 tên "đã thay / cố ý", 22 bộ.
- `dot_bien.py` chỉ chạy 5 tên D2: thoát 0, đúng mong 5/5.
- `don_rong.js`: thoát 0. R1/R2/R3 trả 400 và không tạo đơn; R5–R8b và báo cáo khớp `trang_thai.md` A6.
- Thử ngắt `dot_bien.py` bằng SIGTERM ở giai đoạn chấm (sau đối chứng): thoát 130 sau 0,8 s, không sót thư mục, không sót tiến trình node.
- Script nháp `thu_sap.py`: chấm `sap_cua` của AUDIT-4 và của AUDIT-3 trên 21 dạng dòng. Đầu ra crash là thật: chay.js sập với `--may-chu` rỗng (thoát 2), và node văng thô. Kết quả: 16 dạng đúng, 5 dạng sai, nêu ở dưới.
- Script nháp `dot_luat.py`: gây đột biến lên chính luật sập.

LỖI TÌM ĐƯỢC:
1. `viec/AUDIT-4/boc.py:63–71` (`doan`, `co_sap`) — luật sập để lọt dòng gộp của kiem_tra khi bài con sập mà không in dòng ✗ hay ✖ nào. Khuôn K3, cùng họ AU3-22.
   - `kiem_tra_truoc_khi_giao.js:482–486` chỉ giữ lại các dòng có ✗/✖. Không có dòng nào thì phần chi tiết chỉ còn `thoát mã N`; bài hết giờ thì chỉ còn chữ ETIMEDOUT.
   - Dòng "Giả lập: SẬP — …" của chay.js (kiemdd, `:825`) và đoạn "Node.js v…" của node văng thô đều không có ✗, nên biến mất khỏi dòng gộp.
   - Đo bằng đầu ra thật: dòng gộp `✗ bài chạy thật cong_cu/gia_lap/chay.js xanh (…)  → thoát mã 2` bị chấm "không sập", luật cũ cũng vậy. Dòng gộp `… thu_P26c.js … → thoát mã 1` khi bài văng thô cũng "không sập".
   - Khung `kiem` không thay thu_P26c / thu_GOI1 bằng bài rỗng (`viec/AUDIT-1/dot_bien.py:206–207` BAI_THAT không có hai bài này). Vì vậy dạng này với tới được cả 53 tên D1.
   - Cách vá: trong luật sập, coi đoạn gộp đúng bằng `thoát mã \d+` hoặc có `ETIMEDOUT` là sập (hoặc TREO), và thêm một ca `--tu-thu` dùng đầu ra thật của chay.js sập.
2. `boc.py:59` (`CA_T`) — ngoại lệ "dòng ca kiểm hành vi sập" chỉ xét theo tên ca bắt đầu bằng T. Khuôn K4/K5, cùng dạng lỗi 1 và lỗi 3 của vòng 2.
   - Các ca không có tiền tố T của thu_gia_lap cũng nhúng "Giả lập: SẬP" vào chi tiết khi đỏ thật: E1 `thu_gia_lap.js:278–279` (moTa(e1)), "máy chủ hỏng" `:360` (moTa(sap)), các dòng M ở E2 `:368–369`.
   - Đo: dòng `✗ máy chủ hỏng … — thoát 1 · Giả lập: SẬP — …` (chay.js thoát 1 thay vì 2) bị chấm sập khi chạy thẳng, và cả qua dòng gộp. Dòng gộp: luật cũ "không sập", luật mới "sập".
   - Chú thích ở `boc.py:59` khẳng định T3…T10 là nơi duy nhất mang dấu này, tức chú thích sai (K1). Chưa có kết quả A2 nào bị ảnh hưởng (TACH-GL 25 BẮT, 0 HỎNG-sập).
3. `boc.py:76` vế (2) `ma == 2` không có ca phân biệt nào. Khuôn K3.
   - Đột biến bỏ vế này: 0 trên 21 dạng dòng thật đổi nhãn. Mọi đường thoát 2 thật (chay.js, thu_*) đều đã in dấu sập.
   - `--tu-thu` không có ca nào đỏ khi gỡ vế này. Cần thêm một ca, hoặc bỏ vế và ghi rõ lý do.
4. D2 của `dot_bien.py:145–147`: chạy đủ thì luôn thoát 1 vì 7 SỐNG NẶNG, nên công cụ dán nhãn D2 sai cũng không làm đổi mã thoát. Khuôn K3 ("cổng đơn che cổng yêu cầu").
   - Lệnh chạy riêng 5 tên D2 (thoát 0, tôi vừa chạy) là cách duy nhất để máy phân biệt, nhưng lệnh này không có trong `bang_chung_do.txt`.
5. K1, hồ sơ cũ hoặc lệch:
   - `trang_thai.md:55` ghi "vế 4 giữ, vô hại", nhưng vế 4 đã bỏ từ vòng 1.
   - `trang_thai.md:60` ghi "boc.py 323 (+86)", HEAD là 351 dòng (+114).
   - `bao_cao.md:15` (và `a2_bang.md:15`) ghi cách chạy của 88 tên là "kb, gac, cong, congcu…". Đếm bằng grep: gac 16, cong 12, kiem 53, gl 3, c2 1, kb1 2, kb10 1 — không có congcu.
   - `bao_cao.md:59` và `:61` áp công thức tỷ lệ không giống nhau: hàng AUDIT-3 (20/20) tính cả `D2-AU3-da-biet`, hàng A3 (6/13) bỏ D2 da-biet; theo công thức chung hàng A3 phải là 7/14.

NGHI NGỜ:
- Sau thay đổi luật ở vòng 1 và 2 chỉ khung 88 tên được chạy lại. Tôi tự rà thì thấy CA_T neo đầu dòng, `doan` và dấu `baiX` chỉ đổi kết quả trên dòng gộp hoặc trên đầu ra thu_cong / thu_cong_cu, nên các bộ khác (TACH-GL, LUOI-1, bb, khuôn, c2luoi) không đổi. Nhưng lập luận này không được ghi trong hồ sơ.
- thu_cong.js `:133` ghép đầu ra của cong.js (`ra`, 400 ký tự, nhiều dòng) vào dòng ✗. Nếu cong.js (hệ đang kiểm) văng thô mà "Node.js v" lọt vào 400 ký tự đầu, luật sẽ chấm sập oan. Đây là cùng khuôn lỗi 2; với đường dẫn tạm dài thì ít khả năng xảy ra.
- `boc.py:98` có vế `KB\d+ · \d+ bất biến · ĐẠT` không bao giờ khớp dòng `Lượt k: KB a,b · …` (vế chết). Vế kia không neo đầu dòng, khớp được tên ca T0 của thu_gia_lap; hiện đang được che bởi điều kiện `kq == 'SỐNG'`.
- `MONG` (`dot_bien.py:56`) chép lại thông tin của `RUA_CO_Y` (`kiem_neo.py:28`), thành hai nguồn sự thật.

NGHIỆM THU: 9/9 mục có bằng chứng · mục thiếu: không có (A1, D2 còn lỗi 1–4; D1 còn lỗi 5)
- A1: --tu-thu chạy lại 8/8; bang_chung_do.txt mục 1, 2, 4, 7; không có thay đổi nào trong viec/AUDIT-3. · A2: a2_bang.md đủ 15 bước; tự cộng lại
  các tổng (88, 87, 26, 59/93/49/59, 29) đều khớp bao_cao.md:52–58. · A3: 19 tên, mỗi việc ≥ 3 tên, có đối chứng; Q3 IS NULL là dot_bien.py:36.
- A4: kiem_neo.py trùng nguyên văn; lach.js CHẶN 14, LỌT ĐÃ BIẾT 1. · A5: 8 lần đo; số dòng thu_cong.js:24, :723 và kiem_tra :478/:487/:600/:616 đúng.
- A6: chạy lại, khớp. · D1: bao_cao.md 83 dòng. · D2: D2 5/5 thoát 0 (tôi chạy lại). · D3: npm test và --day-du chạy ở abb73b8, không chạy ở HEAD.
  Máy này không có .git/hooks/pre-commit, nên các commit sau đó không qua cổng. Tuy vậy kiem_tra chỉ quét server/ và client/src/ (:97), còn việc
  chỉ đổi viec/AUDIT-4.
Đường tiền / mức: AU4-1…7 NẶNG-lưới theo Q2 (a), đúng phiếu. Tự tính lại đều đúng: AU4-2 20.454 / 20.455 (trần damages.js:177–181, nhánh
tienDaTra.js:25); AU4-3, AU4-4 257.142 / 257.143; AU4-5 290.461 / 290.500 (món giảm do findEligibleItemForGroup, orders.js:653–664; cổng có nhận
đơn này không — bao_cao ghi CHƯA chạy); AU4-6 chiều chính gốc 200 / đột biến 400, chiều ngược gốc 400 / đột biến 200, bất kể thứ tự dsGoi
(goiKhach.js:18, :24–29); AU4-7 gốc 0 / đột biến −20.000, packages.js:265 chặn ghi sổ, sai ở :261 và :273; AU4-1 orders.js:504, :512–519 đúng.
P1: git diff --name-only d8e256e^ HEAD -- client server rỗng. Toàn nhánh chỉ 10 file, đều trong viec/AUDIT-4/.
Đơn giản: boc.py 351 dòng, +114 so với AUDIT-3, ngân sách duyệt ở Q1 ~50 (phiếu ~30); riêng --tu-thu ~78 dòng (kế hoạch ước ~12), chạy 6 phút;
chỗ vượt không có Câu hỏi mới. Gọn hơn: chụp đầu ra thật một lần vào tệp mẫu rồi chấm luật cũ / mới / đột biến luật trên đó (như thu_sap.py:
21 dạng ~60 dòng, < 1 s); chỉ giữ chạy thật cho ca khung AU3-22.

CHƯA SOÁT ĐƯỢC: không chạy A2 nặng, --sap, A5, npm test; không biết tên BẮT nào trong 53 D1 kiem che một lần bài con văng thô / "thoát mã N"
(lỗi 1), vì nhật ký khung ở nháp; các dòng thu_gia_lap đỏ dùng thử là dựng theo định dạng code (:49, :114–117, :360), không từ đột biến thật;
đầu ra chay.js sập và node văng thô là thật.

BÀI HỌC:
- KHOÁ: ca --tu-thu "dòng gộp kiem_tra với bài con sập không có dòng ✗" (→ thoát mã 2, đầu ra thật của chay.js) phải ra sập. Mỗi vế của sap_cua
  (kể cả ma == 2) phải có một ca đỏ khi gỡ vế đó. D2 có một lệnh riêng mà mã thoát chỉ phụ thuộc D2.
- NGUYÊN TẮC (K4): định nghĩa ngoại lệ theo nội dung ("chi tiết dòng ✗ chứa đầu ra của hệ đang kiểm"), không theo tên ca. Mọi chỗ bài nhúng đầu
  ra của tiến trình con (thu_gia_lap E1/A2/E2, thu_cong `ra`) là cùng một khuôn. Với dòng gộp: thứ kiem_tra LỌC BỎ cũng là một dạng đầu vào phải
  soát, không chỉ thứ nó nối lại.
- BỎ: vế chết `KB\d+ · …` ở boc.py:98.
```

## Vòng sửa 3 (theo /ra-soat vòng 3 — 5 lỗi + 4 nghi ngờ; vòng sửa CUỐI được phép, `so_vong_sua_toi_da` = 3)
| lỗi soát | sửa |
|---|---|
| 1 dòng gộp kiem_tra khi bài con sập không in ✗ (`→ thoát mã N`, ETIMEDOUT) lọt | `co_sap`: dòng gộp có đoạn đúng bằng `thoát mã N` / `null` hoặc chứa ETIMEDOUT = sập (theo `kiem_tra_truoc_khi_giao.js:486`); ca `--tu-thu` từ đầu ra THẬT của chay.js `--may-chu` rỗng (thoát 2, không ✗) → cũ không sập · mới sập |
| 2 ngoại lệ theo tên ca T | bỏ `CA_T`; ngoại lệ theo NỘI DUNG (`chi_tiet`): dấu sập nằm SAU ` — ` của một dòng ca ✓/✗ = đầu ra hệ đang kiểm nhúng vào; ca "máy chủ hỏng" (dựng theo `thu_gia_lap.js:49`, `:360`) → cũ sập · mới không sập; ca T3 đỏ thật vẫn không sập, gỡ ngoại lệ → sập |
| 3 vế `ma == 2` không ca | bỏ vế (mọi đường thoát 2 thật đều in dấu sập — soát đo 0/21 dạng đổi nhãn) |
| 4 D2 không có lệnh riêng | docstring `dot_bien.py` + `bang_chung_do.txt` mục 9: lệnh 5 tên D2 → đúng mong 5/5, thoát 0 |
| 5 hồ sơ cũ / lệch | "vế 4 giữ" → ghi đã bỏ; boc.py 368 dòng; cách chạy 88 tên đếm từ code (kiem 53 · gac 16 · cong 12 · gl 3 · kb1 2 · kb10 1 · c2 1); tỷ lệ A3 7/14 (cùng công thức với hàng AUDIT-3) |
| nghi ngờ: các bộ khác không chạy lại sau đổi luật | Lập luận (ghi theo đề nghị): vòng 1–3 chỉ (i) BỚT sập ở dòng có dấu sập trong CHI TIẾT dòng ca — không lật được BẮT; lật HỎNG-sập → khác chỉ khi lý do sập cũ nằm trong chi tiết: rà mọi lý do HỎNG-sập A2 (khung 6, c2luoi 6, bb 1, P26c 1 — `a2_bang.md`): `Giả lập: SẬP — …` (không phải dòng ca), `✗ KB30 → HTTP: SẬP giữa kịch bản` (dấu trước mọi ` — `), `✖ Bài thử sập` (dòng ✖), `✗ bài thử sập  — …` (dấu ở TÊN) → 0 lật; (ii) THÊM sập chỉ trên dòng gộp kiem_tra (cách kiem / kiemdd → `--khung D1` chạy lại cả 3 vòng: y hệt) và trên đầu ra thu_cong / thu_cong_cu (cách gac / cong → `--khung` 88 vòng 2: y hệt) |
| nghi ngờ: thu_cong `:133` nhúng đầu ra cong.js | nay nằm trong CHI TIẾT dòng ca (sau ` — `) → ngoại lệ nội dung phủ |
| nghi ngờ: vế chết `KB\d+ · …` ở đối chứng | bỏ; đối chứng dùng dòng tổng chay.js neo nguyên dòng |
| nghi ngờ: `MONG` chép `RUA_CO_Y` | giữ (một tên, có chú thích trỏ `kiem_neo.py`) — ghi Phát hiện: nên một nguồn ở khung chung |
Chạy lại sau vòng 3 (tuần tự `chay.py v3`, git sạch mọi bước): `--tu-thu` 355,0 s 10/10 · D2 riêng 4,6 s đúng mong 5/5 thoát 0 · A3 44,3 s y hệt
(11/19) · `--sap` 384,6 s ĐẠT · `--khung D1` 783,1 s y hệt từng tên.
`npm test` + `--day-du` ở `c6cec45` (sau vòng sửa 2): PASS 64 · FAIL 0 · CẢNH BÁO 1 (110,3 s) · PASS 68 · FAIL 0 · CẢNH BÁO 1 (202,9 s).

## Bước 6 sau vòng sửa 3 (HEAD `fcb53a1`)
`npm test`: thoát 0 · PASS 64 · FAIL 0 · CẢNH BÁO 1 (121,9 s) · `node kiem_tra_truoc_khi_giao.js --day-du`: thoát 0 · PASS 68 · FAIL 0 · CẢNH BÁO 1
(204,2 s) · `git status --short` rỗng.

## Bước 8 — /ra-soat vòng 4 (agent general-purpose MỚI, độc lập, chỉ đọc, HEAD `fcb53a1`) — báo cáo chép nguyên

```
KHÔNG ĐẠT. Lỗi nặng nhất là một hồi quy do chính vòng sửa 3 gây ra trong công cụ đo. Lỗi này KHÔNG đổi kết luận audit ("chưa đạt điểm dừng: 0 NẶNG-code, 7 NẶNG-lưới" vẫn đúng), nhưng làm sai lời hứa A1/D2 của `boc.py` là "đột biến cố ý sập ra HỎNG-sập, không BẮT". Đây là vòng sửa cuối, nên các lỗi dưới đây cần đưa vào Câu hỏi cho chủ quán.

Đã chạy trên HEAD fcb53a1. Sau mỗi lệnh `git status --short` đều rỗng, và /tmp chỉ còn `thu_gl_zTxA7g` đã biết từ trước:
- `--tu-thu`: tôi chạy qua một vỏ ghi lại đầu vào của `sap_cua`. Kết quả 10/10, trùng `bang_chung_do.txt` mục 8.
- `kiem_neo.py`: thoát 0, đầu ra trùng nguyên văn `trang_thai.md:108–175`. Tự cộng lại được 936/975, 39 tên đã thay / cố ý, 22 bộ.
- `don_rong.js`: trùng A6.
- Bộ 21 dạng dòng của người soát vòng 3: nay 21/21 đúng.
- Thêm ba script nháp ở scratchpad: `ca_soat4.py`, `sap_thugl.py`, `sap_thugl_khung.py`.
- Lưu ý: tôi đã ghi đè `dot_luat.py` trong scratchpad dùng chung (nháp của người soát vòng 3, không phải file trong kho).

LỖI TÌM ĐƯỢC:
1. `viec/AUDIT-4/boc.py:66–67` (`chi_tiet`) cùng `:76–77` — đột biến cố ý sập nay bị chấm BẮT khi đi qua cách `thugl`. Khuôn K3 (báo BẮT oan) và K4 (cùng đột biến, cách chạy song song). Mức: đổi nghiệm thu A1/D2 của công cụ, không đổi kết luận NẶNG.
   - Đo thật trên hai tầng:
     - Tầng bài thử: lấy đúng đột biến `SAP-TACH-GL` của `--sap` (`boc.py:223`, chay.js không nạp được) nhưng chạy bằng `thugl`. thu_gia_lap thoát 1, dòng tổng "96 đạt · 49 hỏng". 47 dòng ✗ mang "— thoát 1 · Node.js v22.22.0" trong phần chi tiết. Luật HEAD chấm "không sập"; luật AUDIT-3 chấm sập.
     - Tầng khung đã bọc: đưa đột biến này qua `boc_dict` + TACH-GL `main` (khuôn `boc.py:222–225`) → `✗ BẮT (mong LẠC) SAP-TACH-GL-thugl`.
   - Vì sao lọt: ngoại lệ theo nội dung không phân biệt được "hệ sập đúng như ca mong" (T3) với "hệ bị đột biến phá hỏng". Luật CA_T của vòng 2 vẫn bắt được trường hợp này, vì dòng `✗ TURSO_DATABASE_URL …` không phải ca T.
   - Vì sao `--sap` không thấy: `--sap` chỉ thử sập qua `gl29`, trong khi 22/29 đột biến TACH-GL chạy bằng `thugl` (`viec/TACH-GL/dot_bien.py:28–75`).
   - Cùng khuôn ở thu_cong: `tu_chay/thu_cong.js:21` cắt đầu ra cong.js 400 ký tự vào chi tiết, và `:131` lấy đúng đầu ra đó. cong.js văng thô thì dòng ✗ cũng được miễn. Chỗ này tôi chưa đo.
   - Kết quả A2 không đổi: TACH-GL 25 BẮT đo bằng luật bản 1, mà luật đó bắt được dạng này. Nhưng công cụ đề xuất đưa vào khung chung (`bao_cao.md:76`) lại mang lỗ này.
2. `boc.py:73–74` — dạng "in ✗ rồi sập" đi qua dòng gộp của kiem_tra vẫn lọt. Khuôn K4 (vòng 3 chỉ vá trường hợp không có ✗ nào). Mức: chỉ công cụ / hồ sơ.
   - Nguồn gốc: `kiem_tra_truoc_khi_giao.js:482–486` bỏ mọi dòng không có ✗/✖, và bỏ luôn mã thoát khi đã có ✗.
   - Đường thật thứ nhất: chay.js dừng sớm (`chay.js:115–119`) in ✗ của lượt đã xong, rồi in "Giả lập: SẬP" và thoát 2. Qua cách kiemdd chỉ còn `→ ✗ KB2 → I3: …`, bị chấm "không sập".
   - Đường thật thứ hai: thu_* in ✗ rồi node văng thô ngoài `main().catch` cũng bị chấm "không sập" (`ca_soat4.py`, đầu vào dựng theo code).
   - Từ đầu ra kiem_tra không thể phân biệt dạng này với "đỏ đúng ca", nên phải ghi CHƯA KIỂM. Hiện chưa ghi ở đâu.
   - Không đổi kết luận: kiemdd chỉ dùng cho A3B-D5, ngoài A2. Nếu một tên D1 kiem bị che thì chỉ chuyển BẮT → HỎNG-sập, giống AU4-11.
3. Một số vế / điều kiện của luật không có ca đỏ khi gỡ hoặc nới. Khuôn K3. Mức: chỉ công cụ. Tôi chạy đột biến luật trên 9 đầu vào thật của `--tu-thu`:
   - SỐNG (không ca nào đỏ): nới `chi_tiet` thành "' — ' ở bất kỳ đâu trong dòng" (dòng thật bị hại: `thu_gia_lap.js:566` `✗ bài thử sập  — <stack>`, chính là bb `D2-sap` ở `a2_bang.md:179`; tôi kiểm thì hiện nó vẫn sập); bỏ vế `ETIMEDOUT`; bỏ `null`; đổi fullmatch thành search; bỏ ✓ khỏi ngoại lệ (phần này chết); bỏ dấu `Node.js v` / `Giả lập: SẬP` khỏi `SAP` (thừa vì đã có vế "không dòng chạy hết").
   - BẮT (có ca đỏ): tắt `chi_tiet`; bỏ điều kiện ` — `; bỏ vế thoát mã; bỏ `HET`; bỏ `bai[A-Z]`; bỏ "Bài thử sập".
   - Ngoài ra, bài con quá giờ (ETIMEDOUT) bị gắn nhãn HỎNG-sập, trong khi docstring `boc.py:11` định nghĩa "TREO = quá giờ".
4. Hồ sơ lệch hoặc cũ (K1/K4). Mức: chỉ hồ sơ.
   - `trang_thai.md:57` ghi "`--tu-thu` … vòng sửa 2: 8/8", thiếu 10/10 của vòng 3.
   - `trang_thai.md:269` ghi "bao_cao.md 75 dòng"; thực tế 84 dòng.
   - `trang_thai.md:60` ghi "Ghi ở Bài học", nhưng `trang_thai.md` chưa có mục `## Bài học`.
   - `a2_bang.md:5–6` ghi "luật sập vòng 3" — nay dễ nhầm với vòng sửa 3 của AUDIT-4, trong khi A2 đo ở 6f0225f bằng luật bản 1.
   - Lập luận "các bộ khác không đổi" ở bảng Vòng sửa 3: kết quả đúng (tôi đối chiếu nhật ký nháp: D1 57 tên v1 = v3 = A2; khung 88 A2 = v2). Nhưng lập luận không nhắc việc bỏ vế `ma == 2`, không nhắc `--bo`, và chỉ đúng cho kết quả đã ghi, không cho lần chạy sau (xem lỗi 1).
   - Bằng chứng chạy lại sau vòng 3 (`--sap`, `--khung D1`) chỉ có trong nhật ký nháp `scratchpad/log/v3_*.txt`, không có trong kho.

NGHI NGỜ:
- Ca vòng 2(a) ở `boc.py:291` tự viết lại "co_sap không ngoại lệ" bằng tay, chứ không gây đột biến lên `chi_tiet` thật. Luật đổi thì ca này không đổi theo.
- Ca vòng 3(b) ở `boc.py:317` là chuỗi dựng tay.
- `HET` còn vế `\d+ đạt · \d+ hỏng` không neo đầu dòng (`boc.py:24`). Có thể khớp vào chi tiết nhúng đầu ra của công cụ khác (ví dụ thu_cong_cu). Chưa dựng được ca thật.
- `dot_bien.py:79`: `timeout=300` ném `TimeoutExpired` thì làm sập cả bộ, không ra nhãn TREO.
- thu_cong: cùng khuôn lỗi 1, chưa đo.

NGHIỆM THU: 9/9 mục có bằng chứng · mục thiếu: không có, nhưng A1 và D2 còn lỗi 1, D3 có chỗ chưa trọn.
- A1: --tu-thu 10/10 chạy lại; lời hứa "cố ý sập → HỎNG-sập" sai với cách thugl (lỗi 1). · A2: a2_bang.md; tổng mỗi hàng bao_cao.md:52–64 tự cộng
  đều khớp; 88 tên đếm theo cách chạy đúng (kiem 53, gac 16, cong 12, gl 3, kb1 2, kb10 1, c2 1); D1 = 53 kiem + 4 cong. · A3: 19 tên, P20b 4 /
  BAN-HANG-1 3 / LUOI-3 7, có đối chứng; Q3 IS NULL ở dot_bien.py:37. · A4: kiem_neo.py trùng nguyên văn; mốc cắt '\nMONG = ' (kiem_neo.py:113) khớp
  dot_bien.py:56. · A5: trang_thai.md:199–231, 8 lần. · A6: chạy lại, trùng. · D1: 84 dòng. · D2: mục 9, thoát 0, 5/5; nhưng D2 "sập → HỎNG-sập"
  chỉ được chứng minh cho cách p20. · D3: git diff d8e256e^ HEAD -- ':!viec/AUDIT-4/' rỗng; npm test + --day-du chạy ở c6cec45, không phải HEAD;
  kiem_tra không đọc viec/ (grep chỉ thấy .claude/skills), nên rủi ro thấp.
Đường tiền / mức: AU4-1…7 NẶNG-lưới, đúng phiếu A3 và Q2 (a). Tự tính lại số các ca đề xuất đều đúng: AU4-2 ⌊25.000×45.000/55.000⌋ = 20.454 /
đột biến 20.455 (tienDaTra.js:25, damages.js:177); AU4-3 257.142 / 257.143 (tienDaTra.js:45); AU4-4 257.142 / 257.143 (tienDaTra.js:81); AU4-5
290.461 / 290.500 (tienDaTra.js:19–23; huỷ gọi không có chanTren ở :39); AU4-6 chiều chính 200 / 400, chiều ngược 400 / 200 (goiKhach.js:11, :18, :27);
AU4-7 0 / −20.000 (packages.js:265 chặn ghi sổ, sai ở :261, :273); AU4-1 orders.js:504, :512–519 đúng. AU4-2 chỉ đúng khi mã giảm là mã cấp đơn,
không phải mã một món; bao_cao.md:24 chưa ghi rõ điều này.
P1: git diff --name-only d8e256e^ HEAD -- client server rỗng; cả nhánh chỉ có 10 file, đều trong viec/AUDIT-4/.
Đơn giản: boc.py dài 368 dòng, nhiều hơn AUDIT-3 131 dòng. Phiếu ước ~30, kế hoạch ~50. Phần --tu-thu khoảng 90 dòng, chạy 6 phút. Chỗ vượt
ngân sách chưa có Câu hỏi hay lý do ghi lại (trang_thai.md:60 trỏ tới mục Bài học chưa có).

CHƯA SOÁT ĐƯỢC: không chạy A2 nặng, --sap, A5, npm test; lỗi 2 dựng đầu vào theo code (chay.js:115–119), không từ một lần chạy thật, vì đường
dừng sớm phụ thuộc thời gian; chưa đo dạng cong.js văng thô qua thu_cong (cùng khuôn lỗi 1); chưa biết tên BẮT nào trong 53 tên D1 kiem có che
dạng "in ✗ rồi sập không ✖".

BÀI HỌC:
- KHOÁ: --sap phải chạy mỗi dạng sập qua MỌI cách chạy mà bộ dùng (thugl, gac/cong, kiemdd), không chỉ một cách. Ca SAP-TACH-GL qua thugl phải ra
  HỎNG-sập.
- KHOÁ: mỗi điều kiện của luật phải có một đột biến "nới" bị bắt: ` — ` ở bất kỳ đâu, bỏ ETIMEDOUT, bỏ null.
- NGUYÊN TẮC (K3/K5): nới một ngoại lệ "phải KHÔNG X" thì phải kèm ca "vẫn phải X" có cùng hình dạng dòng, tức đột biến cố ý sập đi đúng đường được
  miễn. Khi nội dung không phân biệt được hai trường hợp, hãy hẹp ngoại lệ lại (chỉ ca tự mong SẬP) hoặc hỏi chủ quán, đừng tự mở rộng.
- NGUYÊN TẮC (K1): giới hạn cấu trúc của nguồn đo (kiem_tra lọc dòng và bỏ mã thoát khi đã có ✗) phải ghi thành CHƯA KIỂM, không để ngầm.
```

## Câu hỏi 6 (sau soát vòng 4 — đã hết 3 vòng sửa, `so_vong_sua_toi_da` = 3 → máy DỪNG, không sửa tiếp)
Kết luận audit KHÔNG đổi qua cả 4 vòng soát: **chưa đạt điểm dừng — 0 NẶNG-code, 7 NẶNG-lưới (AU4-1…7)**; 10 lỗ AU3-8…17 đã khoá thật; mọi số A2
đo bằng luật bản 1 (vòng 1–3 chạy lại khung D1 / 88 tên: y hệt từng tên). Phần còn hở là CÔNG CỤ luật sập trong `viec/AUDIT-4/boc.py`:
1. (soát 4 lỗi 1 — hồi quy của vòng sửa 3) ngoại lệ "dấu sập trong chi tiết dòng ca" (`boc.py:66–67`) miễn cả đầu ra của hệ BỊ ĐỘT BIẾN PHÁ HỎNG:
   `SAP-TACH-GL` qua cách `thugl` → BẮT (luật vòng 2 `CA_T` bắt được); `--sap` chỉ thử `gl29`.
2. (lỗi 2) "in ✗ rồi sập" đi qua dòng gộp kiem_tra không phân biệt được với "đỏ đúng ca" (kiem_tra bỏ dòng không ✗ và mã thoát — `:482–486`) →
   phải ghi CHƯA KIỂM.
3. (lỗi 3) 6 điều kiện của luật không ca đỏ khi gỡ / nới; ETIMEDOUT gắn HỎNG-sập thay vì TREO.
4. (lỗi 4) 6 chỗ hồ sơ lệch (8/8 → 10/10, 75 → 84 dòng, mục Bài học chưa có, "luật sập vòng 3" dễ nhầm, lập luận vòng 3 thiếu `ma == 2` / `--bo`,
   bằng chứng chạy lại vòng 3 chỉ ở nháp) + `boc.py` 368 dòng (+131, ngân sách ~30 / ~50) chưa có lý do ghi.
Chủ quán chọn:
- (a) Cho một vòng sửa 4 ngắn (vượt `so_vong_sua_toi_da`): hẹp ngoại lệ về đúng ca TỰ MONG SẬP (tên ca thu_gia_lap đọc từ code: T3…T10, E1, "máy chủ
  hỏng") + dấu "Giả lập: SẬP" (không miễn `Node.js v`), `--sap` thêm cách `thugl` / `cong`, ca "nới" cho từng điều kiện, ETIMEDOUT → TREO, ghi CHƯA KIỂM
  lỗi 2, sửa 6 chỗ hồ sơ; rồi bước 10–11 đóng việc.
- (b) Đóng AUDIT-4 như hiện tại (như AUDIT-3 chốt 16.10 với AU3-22…24): lỗi 1–4 thành phát hiện AU4-17…20 (NHẸ-công cụ / hồ sơ) chuyển sang việc khung
  chung (`bao_cao.md` "Đề xuất bộ khung" 3) — không đưa `boc.py` bản hiện tại vào khung chung khi chưa vá lỗi 1; máy làm bước 10–11 (đếm nghiệm thu,
  báo cáo 7 mục, Bài học, HEAD ĐÃ KIỂM).
Máy đề nghị (b): kết luận và 7 ca khoá đề xuất không phụ thuộc lỗi công cụ; việc vá lưới AU4-1…7 (trước AUDIT-5) và việc khung chung là nơi đúng
cho luật sập. Câu hỏi 4 (D1-E* 77/79 vs 81/83) và 5 (mức SỐNG cũ) vẫn chờ, không chặn.

## Dừng (lượt này)
Hết 3 vòng sửa; soát vòng 4 KHÔNG ĐẠT (không đổi kết luận) → ghi Câu hỏi 6, commit, push, DỪNG. Chưa làm bước 10–11 (báo cáo 7 mục, Bài học,
HEAD ĐÃ KIỂM) — chờ chủ quán chọn (a) / (b). Nháp bước 10 (đếm nghiệm thu 9/9) ở thư mục nháp phiên này.
