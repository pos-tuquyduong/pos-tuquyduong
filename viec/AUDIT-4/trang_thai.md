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

## Nhóm đã xong
A1 · A3
