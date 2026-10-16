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
chủ quán giữ AUDIT-1 81/83 (cách AUDIT-3: "khớp phép tĩnh riêng = BẮT"). Máy báo theo luật (a) chữ (77/83) và ghi kèm 81/83; chủ quán chọn
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
| AUDIT-3 `dot_bien.py` 26 | BẮT 15 · LẠC 5 · HỎNG 5 · SỐNG 1 | (10 SỐNG) | — | 10 AU3-8…17 hết SỐNG; 5 LẠC-mẫu (mẫu AUDIT-3 ≠ tên ca LUOI-3); `BV-AU3-SL-THE-BO-CONG` HỎNG (AU4-2); D2 cố ý |
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
+3 (`VS-SOLUONG1-THE-SDT-THO` đã thay BAN-HANG-1; `BV-AU3-SL-THE-BO-CONG` hồ sơ không ghi → AU4-2; `D2-AU4-sai-chuoi` cố ý). Ca đỏ: bản AUDIT-3
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
| `items: []` + `membership_buy: {}` / `package_buy: {}` | đã có ca: T1b (`thu_P26c.js:896`), S2g (`:849`) → 400, không đơn; A2 chạy lại bộ BAN-HANG-1 / SO-LUONG-1 BẮT | — |
| R5 1 món + mã 100 % | 200, đơn completed total 0 (subtotal 25.000, 1 dòng), 0 điểm (`orders.js:827` `total > 0`), 0 dòng ví; báo cáo +1 đơn, doanh thu +0, giảm +25.000 | — sổ đúng (mã do chủ quán tạo) |
| R6 chỉ mua thẻ 500.000 | 200, đơn 1 dòng thẻ, doanh thu +500.000, **+500 điểm** | K5 qua; điểm khi mua thẻ = câu hỏi chính sách → Phát hiện |
| R8a mua gói 300.000 / R8b lấy 1 ly 0đ | 200 / 200; gói +300 điểm lúc mua, lấy 0 điểm; R8b KHÔNG vào đếm đơn báo cáo (thiết kế `reports.js:43`) | K5 qua; như R6 |
Đối chiếu báo cáo: Δ doanh thu 800.000 = tổng total 4 đơn; Δ đơn 3 = 4 − 1 đơn giao từ gói 0đ. **0 NẶNG-code, 0 rác** ở A6 (không đường nào tạo đơn
0 dòng). Điểm khi mua thẻ / gói: không quyết thay chủ quán — ghi Phát hiện (đối soát: điểm theo `total`, không theo loại hàng).

## Nhóm đã xong
A1 · A3 · A2 · A4 · A5 · A6
