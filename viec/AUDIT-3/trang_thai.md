# AUDIT-3 — trạng thái

## Bước 1 · đối chiếu bản chụp (15.10.2026, máy mây)
- `git branch --show-current` → `viec/AUDIT-3`; `git status --short` → rỗng (cây sạch).
- `git fetch origin viec/AUDIT-3` → HEAD `a13d8ad` · FETCH_HEAD `a13d8ad` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  a13d8ad PHIEU: AUDIT-3
  142d5e5 TIEN-DO: SO-LUONG-1 xong (31a5810), mo AUDIT-3, them BAN-HANG-1, TU-CHAY-6 (6)(7) — so v31
  31a5810 Merge pull request #21 from pos-tuquyduong/viec/SO-LUONG-1
  ```
- Có commit `PHIEU: AUDIT-3` (a13d8ad). Phiếu: **chờ duyệt kế hoạch** — dừng ở bước 3 sau khi commit + push `ke_hoach.md`.

## Bước 2 · đã đọc (lượt này)
- `viec/AUDIT-3/phieu.md`; `viec/AUDIT-1/phieu.md` (định nghĩa BẮT/SỐNG/HỎNG/LẠC/NẶNG/NHẸ); `viec/AUDIT-2/phieu.md`, `bao_cao.md`,
  `ke_hoach.md` (mục 0, 2, 5), `trang_thai.md:24–60` (số đo), `dot_bien.py`, `dot_bien_bb.py:1–80`, `kiem_neo.py`, `lach.js`, `lach.json`,
  `bang_chung_do.txt:1–25`, `a3_bang.md` (mục 4 lách).
- Bộ đột biến từng việc: `viec/AUDIT-1/dot_bien.py` (khung: `cham`, `kiem_sach`, `LENH`, `anh_kho`), `P26b`, `P26c`, `GOI-1`, `GOI-2`,
  `SO-LUONG-1`, `LUOI-1`, `TACH-GL`, `TOC-DO-1` (`dot_bien.py` của mỗi việc, đọc nguyên file).
- Hồ sơ lạc đã ghi: `viec/GOI-2/trang_thai.md:97–125`, `viec/SO-LUONG-1/trang_thai.md:72–80`, `viec/LUOI-2/trang_thai.md:110–112, 246`,
  `viec/TOC-DO-1/trang_thai.md:67–76, 166–168` (K3: bộ đột biến báo BẮT khi bài thử sập).
- Code thật: `server/utils/goiKhach.js`, `server/utils/tienDaTra.js` (nguyên file); `server/routes/orders.js:186–280, 400–445, 860–935,
  1030–1062, 1338–1352, 1372–1465, 1550–1600`; `server/routes/packages.js:241–275`; `git diff 4d175bc..HEAD -- server/routes/wallets.js
  refunds.js damages.js database.js`; `tu_chay/nguoi_gac.js` (bảng `LUAT` 76 mã — so với `4d175bc`: không mã mới, không mã bỏ;
  `git diff --stat 4d175bc..HEAD -- tu_chay/` rỗng).

## Bước 3 · kế hoạch (chờ duyệt)
- `ke_hoach.md` bản 1 commit `ed27aae`; agent soát độc lập (chỉ đọc, Explore) trả lời 4 câu → **KHÔNG ĐẠT** (neo A4 viết tắt sai 1, số dòng
  lệch 8, GOI-1 / SO-LUONG-1 chưa chắc đủ 3 ở chỗ mới, `D2K-da-biet` HỎNG chưa lường, A1 chưa tách LẠC-sập ở bộ khung, sót `meTra` và đường
  nhiều gói). Bản 2 sửa theo từng điểm — mục 8 của `ke_hoach.md`; mọi neo A4 đã `grep -F` trên HEAD (1 lần, đúng dòng).
- Phát hiện lúc lập kế hoạch (đo thật): kho máy mây NÔNG (không `9521cec`) → `viec/LUOI-1/dot_bien.py` không nạp, `viec/AUDIT-2/kiem_neo.py`
  sập (Câu hỏi 1); AUDIT-2 `D2K-da-biet` HỎNG trên HEAD (neo rữa vì P26c C1). Người gác chặn: `git fetch --deepen` (GIT-KEO), `git rev-list`
  (GIT-LENH), `$S` đích ghi (B-DICHCHU), `<( )` (B-PHANTICH), heredoc nhắc sổ việc (B-MANOI), `cd` giữa lệnh (B-CD-VITRI) — đều làm cách khác,
  không lách.
- Máy mây không có `.git/hooks/pre-commit` (chỉ file mẫu) → commit ở đây không qua tầng 3; đã chạy `node kiem_tra_truoc_khi_giao.js`
  (99,7 s, thoát 0) và `--day-du` (191,6 s, thoát 0) lúc đo. `ke_hoach.md` / `trang_thai.md` được ghi trong lúc `--day-du` đang chạy (bộ kiểm
  không soi `viec/`; các bộ đột biến chưa chạy) — ghi để minh bạch.
- Dừng ở bước 3 theo phiếu ("Chờ duyệt kế hoạch").

## Lượt 2 (`tiep`, 15.10) · bước 1 — bản chụp
- `viec/AUDIT-3`, cây sạch; `git fetch origin viec/AUDIT-3` → HEAD `35fa701` · FETCH_HEAD `35fa701` (bằng nhau, không kéo).
  ```
  35fa701 AUDIT-3: trạng thái bước 3 — soát kế hoạch, phát hiện kho nông, lệnh bị gác chặn
  aec49af AUDIT-3: kế hoạch bản 2 theo soát độc lập — neo A4 nguyên văn, bọc gọi chay1, --xep/--c2luoi, D2K-da-biet, K4 meTra + nhiều gói
  a2b044d AUDIT-3: trạng thái bước 1–2 — bản chụp a13d8ad, danh sách đã đọc
  ```
- Chủ quán duyệt kế hoạch bản 2 (35fa701): Câu hỏi 1 → (b) `boc.py --luoi1`, 2 `GOC-*` CHƯA KIỂM, `kiem_neo.py` bọc `try`; Câu hỏi 2 →
  `viec/AUDIT-3/bb_neo.json` là ảnh mới, báo cáo có bảng tên mới / tên trôi so ảnh AUDIT-2 + đề xuất B4; `D2K-da-biet` → phát hiện AU3-n
  NHẸ kèm neo đề xuất; giữ bảng A4 25 dòng, SỐNG tiền = NẶNG không hạ mức. Làm tới hết, mỗi nhóm commit + push.

## A1 · đối chứng (`viec/AUDIT-3/boc.py`, 179 dòng — VƯỢT ngân sách 60–120: 5 chế độ `<bộ>` / `--sap` / `--xep` / `--c2luoi` / `--luoi1`; ghi ở Bài học)
- `python3 viec/AUDIT-3/boc.py GOI-1 BV-GOI1-TONG` → đối chứng `thu` (thu_GOI1.js) 101 đạt · 0 hỏng ✓ · BẮT 1 · kho thật không đổi.
- `python3 viec/AUDIT-3/boc.py --sap` (nháp `a1_sap.txt`, chép vào `bang_chung_do.txt` mục 1) → **0 bộ báo BẮT khi bài thử sập — ĐẠT**:
  P26b / P26c / GOI-1 / GOI-2: `SAP-<bộ>` → HỎNG-sập ("Bài thử sập · thoát 2"), `SAI-<bộ>` → HỎNG (neo 0 lần); AUDIT-2 `SAP-AUDIT2` (mẫu rộng
  `✗ ` cố ý) → LẠC, `chi` = "Giả lập: SẬP … ✖ Bài thử sập" (bài in `✖`, không phải `✗` → mẫu rộng không khớp); LUOI-1 `SAP-LUOI-1` (kb1) → LẠC
  thiếu mẫu; TACH-GL `SAP-TACH-GL` (gl29) → LẠC thiếu mẫu; SO-LUONG-1 `SAP-SOLUONG1` → "bài thử SẬP (không phải đột biến bị bắt)".
  `G3-sap` (AUDIT-1) và `D2-sap` (bb) lấy từ A2. Đối chứng mỗi cách chạy của 4 bộ khuôn: 105 / 101 / 66 đạt · 0 hỏng (khớp mục 0).
- LUOI-1 trên kho nông: `boc.py --luoi1` thay `KB10_GOC` bằng `''` trong bộ nhớ (lời duyệt (b)); 2 `GOC-*` CHƯA KIỂM.

## A5 · `viec/AUDIT-3/kiem_neo.py` (176 dòng, +43 so bản AUDIT-2) — chạy trên HEAD 35fa701 + file lượt này, thoát 0
- Nạp thêm GOI-1 49 · GOI-2 59 · P26c 93 · SO-LUONG-1 17 · TOC-DO-1 10 · AUDIT-3 25; LUOI-1 nạp được trên kho nông (dòng `git show` → `''`,
  2 `GOC-*` không rà như AUDIT-2). LUOI-2 không có `dot_bien*.py` / `do_*.js` (đột biến LUOI-2 = AUDIT-2 A3L, đã rà).
- Neo khớp / mục có neo: AUDIT-1 173/175 · P26b 50/59 · P26c 89/93 · GOI-1 40/49 · GOI-2 59/59 · SO-LUONG-1 17/17 · AUDIT-3 24/25 ·
  TOC-DO-1 10/10 · HOC-1 17/17 · HOC-2 22/23 · TU-CHAY-4 9/9 · HOC-2b 18/20 · LUOI-1 78/78 · TACH-GL 26/29 · TU-CHAY-5 34/34 · AUDIT-2 30/34 ·
  AUDIT-2 bb 178/179 (so ảnh AUDIT-3) · do_*.js 6/6. **HỎNG ngoài danh sách: 0**; mẫu nghi rữa: 0. Mọi tên rữa đều có lý do "đã thay bằng …"
  trong `RUA_CO_Y` (P26b 9 → P26c; P26c 4 → GOI-2; GOI-1 7 → GOI-2 + 2 → SO-LUONG-1; TACH-GL 3 → P26c; AUDIT-1 `G3-da-biet`, HOC-2b 2 → P26c;
  cố ý 4 sai chuỗi + HOC-2 `VS-E3-phien-ban-cu`).
- Lần chạy đầu (trước khi sửa `RUA_CO_Y`) lộ: (1) **AU3-3** — AUDIT-2 `A3L-goi-giao-them-1` (neo `[deliveredQty, deliveredQty, now,
  customer_package_id]`, 0 lần — P26c A2 dời trừ lượt vào giao dịch) và `A3L-deliver-bo-chan-am` (neo `/deliver`, 0 lần — P26c A4 bỏ route)
  rữa mà KHÔNG hồ sơ nào ghi (grep `viec/LUOI-2/trang_thai.md`, `viec/P26c/trang_thai.md`: 0) → phát hiện; bản thay cùng ý: P26c
  `BV-A2-bo-tran` / `VS-A2-bo-kiem-changes`, `BV-A4-deliver-song-lai`. (2) 3 tên hồ sơ ghi "lạc" nhưng neo VẪN khớp HEAD: P26b
  `hong-tran-theo-man-hinh`, `hong-lay-dong-dau` (P26c bảng "Đột biến cũ đổi" ghi chuyển), TACH-GL `VS-luot-thieu-bat-bien` (LUOI-2 ghi LẠC
  = kết quả chạy, không phải neo) → bỏ khỏi `RUA_CO_Y`, A2 chấm bằng chạy thật.
- Ảnh neo bb: `viec/AUDIT-3/bb_neo.json` (175 tên, sinh `dot_bien_bb.py --liet-ke --json`, HEAD) so ảnh AUDIT-2 (148): **tên mới 27**
  (`BB-I2-sql-1..3-bo-ve`, `BB-I7-js-1..2-bo-ve`, `BB-I11-sql-1..2-bo-ve`, `BB-I13-sql-4-bo-ve`, `BB-I18-sql-1..11-bo-ve`, `BB-I18-js-1..2-bo-ve`,
  `BB-I18-js-1..2-duong/am`, `BB-I19-sql-1..2-bo-ve`) · tên mất 0 · **tên trôi khác vế 3** (`BB-I13-sql-1..3-bo-ve`) · chỉ dời dòng 132.

## A2 · chạy lại ĐỦ trên HEAD (script nháp `chay_a2.py`, tuần tự, đo riêng; 12 bước, mỗi bước `git status` 0 dòng — từng tên ở `a2_bang.md`)
| bộ | lệnh | thời gian | kết quả | khác AUDIT-2 |
|---|---|---|---|---|
| P26b 59 (bọc) | `boc.py P26b -j 4` | 172 s | BẮT 48 · SỐNG 1 · HỎNG 9 · LẠC 1 | 9 HỎNG + 1 LẠC + 1 SỐNG đều "đã thay" P26c (bảng "Đột biến cũ đổi"); đối chứng 7 cách xanh |
| P26c 93 (bọc) | `boc.py P26c -j 4` | 426 s | BẮT 88 · HỎNG 4 · HỎNG-sập 1 | 4 đã thay (GOI-2 Q-F); `VS-Q9-hoan-me-ngoai-tx` ✗ M5 rồi sập → AU3-6 (bộ cũ đếm 89/93) |
| GOI-1 49 (bọc) | `boc.py GOI-1 -j 4` | 43 s | BẮT 40 · HỎNG 9 | 7 → GOI-2, 2 → SO-LUONG-1 (đã thay) |
| GOI-2 59 (bọc) · SO-LUONG-1 17 | `boc.py GOI-2 -j 4` · `viec/SO-LUONG-1/dot_bien.py` | 63 s · 26 s | 59/59 · 17/17 | — |
| AUDIT-2 A3L B3 A3P D2K (30) | `viec/AUDIT-2/dot_bien.py A3L B3 A3P D2K -j 3` | 406 s | A3L BẮT 15 · SỐNG 3 · HỎNG 2 / A3P SỐNG 1 / B3 BẮT 3 · SỐNG 2 · LẠC 1 / D2K HỎNG 2 · SỐNG 1 | A3L 5 NẶNG-lưới AU2-2 → BẮT; A3P SỐNG = AU2-1 đóng; `D2K-da-biet` HỎNG (AU3-2); 2 HỎNG (AU3-3); `BK-KB21` BẮT → LẠC (AU3-4); A3B bỏ (không đụng tiền) |
| LUOI-1 78 HEAD | `boc.py --luoi1 -j 4` | 88 s | 78/78 đúng mong đợi | 2 `GOC-*` CHƯA KIỂM (kho nông, lời duyệt (b)) |
| TACH-GL 29 | `viec/TACH-GL/dot_bien.py` | 753 s | BẮT 25 · HỎNG 3 · LẠC 1 | như LUOI-2 ghi (4 đã thay P26c) |
| AUDIT-1 trừ C2F 88 | `viec/AUDIT-1/dot_bien.py G3 A3 B1 C2 D1 -j 3` | 988 s | A3 16 · B1 8 · C2 3 · D1 55 + 2 LẠC; G3 HỎNG 2 · SỐNG 1 · LẠC-sập 1 | `G3-da-biet` HỎNG (đã thay) — còn lại y AUDIT-2 |
| C2F 87 + A3L c2full 13 bằng `c2luoi` | `boc.py --c2luoi -j 3` | 1199 s | C2F BẮT 64 · SỐNG 22 · HỎNG-sập 1; A3L BẮT 8 · SỐNG 3 · HỎNG 2 | 22 SỐNG = 23 cũ − 2 BẮT nhờ thu_P26c + 1 câu mới GOI-2 (AU3-19); tên C2F trượt theo vị trí (AU3-7) |
| bb 175 + 4 D2 | `viec/AUDIT-2/dot_bien_bb.py -j 4` | 742 s | BẮT 125 · SỐNG 50 · HỎNG 1 · LẠC 3 | 50 = 48 cũ + 2 mới (AU3-18); LẠC 2 `BB-I2-sql-2/3` thực chất bắt (AU3-5); `D2-sap` LẠC-sập |
| A4 AUDIT-3 25 | `viec/AUDIT-3/dot_bien.py` | 32 s | BẮT 11 · SỐNG 11 · HỎNG 3 | 10 SỐNG tiền / gói = NẶNG-lưới (AU3-8…17), 1 SỐNG = D2 vô hại; HỎNG = D2 sai chuỗi, D2 sập, `HUY-ME-TRA-0` sập sau ✗ M2/M3 (AU3-6) |
Tổng thời gian máy 12 bước: 4.938 s ≈ 82 phút (kế hoạch ước ~85). `--xep` áp cho AUDIT-1 / AUDIT-2 / LUOI-1 / TACH-GL / bb khi sinh `a2_bang.md`
(dòng LẠC có dấu sập → HỎNG-sập: `G3-sap`, `C2F-orders-02-insert-quay`, `D2-sap`).

## A3 · đóng sổ AUDIT-2
- **AU2-1** (lấy vượt lượt): `A3P-goi-lay-vuot-luot` → SỐNG (ngược nghĩa = máy chủ trả 400 cho gói 3 lượt xin 4); P26c `BV-A2-bo-tran`,
  `VS-A2-bo-kiem-changes`, `BV-A2-lay-ngay-bo-tran` → BẮT (`a1_P26c.txt`); ca `thu_P26c.js` A2a `:199`, A2d `:210`. **Đóng.**
- **AU2-2** (5 A3L): `A3L-redeem-thieu-1-diem` (L1a), `A3L-earn-flash-van-cong` (L2a), `A3L-nhandiem-cong-doi` (L3a), `A3L-goi-bo-kiem-chu`
  (L4a), `A3L-goi-huy-dem-ca-mon-tra-tien` (L5a) → BẮT ×5 trong lần chạy A2 AUDIT-2. **Đóng.**
- **AU2-11** (số lượt quầy gõ): P26c `BV-A6-so-man-hinh`, `VS-A6-chi-sua-ten-dong`, `BV-A6-o-nhap-so-luot` → BẮT (A6a `:324`, A6b `:326`);
  SO-LUONG-1 `BV-SOLUONG1-GOI`, `VS-SOLUONG1-GOI-LAM-TRON` → bắt (S2b, S2d). **Đóng.**

## A4 · đột biến độc lập `viec/AUDIT-3/dot_bien.py` (125 dòng; 25 tên — cổng A17; việc không vá code nên không có bảng "chỗ vá")
Đối chứng: thu_P26c 105/0 · thu_GOI1 101/0 · thu_P26b 66/0. Kết quả từng tên (`a4_AUDIT-3.txt`, 32 s):
| tên | kq | ghi chú |
|---|---|---|
| `D2-AU3-sai-chuoi` · `D2-AU3-da-biet` · `D2-AU3-vo-hai` · `D2-AU3-sap` | HỎNG · BẮT (S1c) · SỐNG · HỎNG-sập | D2 đúng 4 trạng thái (`bang_chung_do.txt` 1) |
| `BV-AU3-P26C-DATRA-BO-TRU-SHIP` | **SỐNG** | AU3-8 — không bài nào có phí ship |
| `VS-AU3-P26C-DATRA-GIA-GOC` | **SỐNG** | AU3-9 — ca B1a chỉ một dòng flash |
| `VS-AU3-P26C-DEN-GIAM-BO-FLASH` | **SỐNG** | AU3-10 — chặn oan, không ca flash + mã món |
| `VS-AU3-P26C-DEN-TRAN-CA-DON` | BẮT | B1c |
| `VS-AU3-P26C-DUYET-VI-DA-TRA-CHI-CON` | BẮT | M5 (thu_P26b) |
| `VS-AU3-P26C-HUY-ME-TRA-0` | HỎNG-sập | ✗ M2, ✗ M3 đỏ rồi "không tạo được đơn: SO_DU_KHONG_DU" (script nháp `metra.py`) — AU3-6 |
| `VS-AU3-GOI1-LOAI-KHONG-CONG-DON` | **SỐNG** | AU3-11 — không ca hai dòng cùng loại |
| `BV-AU3-GOI1-LOAI-BO-DA-LAY` · `VS-AU3-GOI1-DEM-DONG-THAY-SL` | BẮT · BẮT | A2a |
| `VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN` | **SỐNG** | AU3-12 — chặn oan loại SL 0 (dữ liệu cũ) |
| `BV-AU3-GOI2-BO-TRAN-DA-NHAN` | **SỐNG** | AU3-13 — chưa dựng được ca vượt total (có thể vế thừa) |
| `VS-AU3-GOI2-HOAN-CA-DA-LAY` | BẮT | B3a (hoan-du-kien) |
| `VS-AU3-GOI2-NHAN-BO-DEN` | **SỐNG** | AU3-14 — không ca đền rồi kết thúc gói |
| `VS-AU3-GOI2-GHI-HOAN-PHAN-VI-HOAN-GOI` | BẮT | B3e |
| `VS-AU3-SL-TIEN-MOT-GOI` · `VS-AU3-SL-TAO-MOT-GOI` | BẮT · BẮT | S2f |
| `VS-AU3-SL-DONG-GOI-SL-1` | **SỐNG** | AU3-15 — không ca huỷ / kết thúc trên đơn 2 gói |
| `VS-AU3-SL-DONG-GOI-TONG-1` | **SỐNG** | AU3-16 — `total_price` chỉ vào báo cáo doanh thu, không bất biến |
| `VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL` | **SỐNG** | AU3-17 — cùng ca thiếu AU3-15 |
| `BV-AU3-SL-HAM-LUON-DUNG` · `BV-AU3-SL-THE-BO-CONG` (bổ sung, cùng neo SO-LUONG-1) | BẮT · BẮT | S1a · S4c |
Đếm chỗ MỚI (không trùng neo bộ cũ): P26c 6 (3 BẮT · 3 SỐNG — kể `HUY-ME-TRA-0` sập), GOI-1 4 (2 · 2), GOI-2 4 (2 · 2), SO-LUONG-1 5 (2 · 3) — mỗi việc
≥ 3, có VS + BV. K4: `soTienHoan` 3 đường (huỷ, xoá, duyệt) — đột biến `tienDaTra.js` SỐNG là SỐNG ở CẢ ba đường (không ca nào); `ghiHoan` 2 chỗ gọi
(B3e bắt ở kết thúc gói; huỷ đơn gói A5c2 của thu_P26c không chạy trong cách `thu` — ghi CHƯA KIỂM đường huỷ cho đột biến này).

## A6 · lách
`LUAT` 76 mã, 0 mã mới (mục 0 kế hoạch) → không thêm ca; `node viec/AUDIT-2/lach.js` (0,1 s) → CHẶN 14 · LỌT ĐÃ BIẾT 1 (CC-DOC, AU2-7) · LỌT 0 ·
SAI MÃ 0 · TẮT KHÔNG ĐỔI 0 — như AUDIT-2.

## Sản phẩm D
- D1 `bao_cao.md` 77 dòng (≤ 200): kết luận **chưa đạt điểm dừng** (10 NẶNG-lưới AU3-8…17, 0 NẶNG-code), bảng AU3-1…19, tỷ lệ theo nhóm, đề xuất.
- D2 `bang_chung_do.txt` 74 dòng: D2 của `dot_bien.py` (HỎNG · BẮT · SỐNG · HỎNG-sập), `boc.py --sap` nguyên văn, `boc.py GOI-1 BV-GOI1-TONG`,
  lần chạy đầu `kiem_neo.py` báo HỎNG thật, ngắt SIGINT. Phiếu "Bài thử đỏ: không" → không dòng `SỐ CA`.
- Người gác chặn trong lượt 2: `for` (B-CHUONGTRINH), `$"` trong grep (B-PHANTICH), `cd … &&` không ở đầu (B-CD-VITRI) — đều viết lại, không lách.

## Nghiệm thu — đếm từng mục (bằng chứng trên HEAD, lượt 2)
| mục | bằng chứng |
|---|---|
| A1 đối chứng + sập | `boc.py --sap` → 0/10 bộ BẮT khi sập (`bang_chung_do.txt` 2; `G3-sap`, `D2-sap` từ A2 = LẠC-sập); 4 bộ khuôn chạy qua bọc với đối chứng đếm số khớp mục 0 (105 / 101 / 66 / ĐẠT — `a2_bang.md` + nháp `a1_*.txt`); `--xep` tách LẠC-sập trong `a2_bang.md` |
| A2 chạy lại đủ | 11 lần chạy (bảng A2 trên, `a2_bang.md` từng tên 11 bộ: 88 + 100 + 30 + 179 + 59 + 93 + 49 + 59 + 17 + 78 + 29 = 781 tên); mọi LẠC / HỎNG ghi "đã thay bằng" hoặc mã AU3; khác AUDIT-2 → cột "vì sao" |
| A3 đóng sổ | mục A3: AU2-1 (A3P SỐNG + 3 P26c BẮT, ca A2a/A2d), AU2-2 (5 BẮT, L1a–L5a), AU2-11 (3 P26c + 2 SO-LUONG-1 BẮT, A6a/A6b/S2b/S2d) |
| A4 đột biến độc lập | `viec/AUDIT-3/dot_bien.py` 25 tên (bảng A4): P26c 6 · GOI-1 4 · GOI-2 4 · SO-LUONG-1 5 ở chỗ mới + 2 bổ sung + 4 D2; có đối chứng; 10 SỐNG tiền / gói = NẶNG AU3-8…17 trong `bao_cao.md` |
| A5 kiem_neo | `python3 viec/AUDIT-3/kiem_neo.py` thoát 0 (mục A5): 18 bộ, 0 HỎNG ngoài danh sách, lần đầu lộ AU3-3 (`bang_chung_do.txt` 4); ảnh bb mới `bb_neo.json` + bảng tên mới / trôi |
| A6 lách | mục A6: 0 mã mới (`LUAT` 76 so `4d175bc`), `lach.js` CHẶN 14 · LỌT ĐÃ BIẾT 1 |
| D1 | `bao_cao.md` 77 dòng: kết luận một dòng, bảng AU3-1…19, NẶNG/NHẸ, file:dòng, lệnh thấy lại, đề xuất khoá, tỷ lệ theo nhóm |
| D2 | `bang_chung_do.txt`: sai chuỗi → HỎNG, đã biết → BẮT, vô hại → SỐNG, sập → HỎNG(-sập) |
| D3 | `npm test` thoát 0 · PASS 63 · FAIL 0 · CẢNH BÁO 0 (96,6 s); `--day-du` ghi dưới; `git status` 0 dòng sau 12/12 bước + SIGINT 0 thư mục sót; `git diff --stat a13d8ad..HEAD -- ':!viec/AUDIT-3/'` rỗng |

## Báo cáo 7 mục
```
VIỆC:        AUDIT-3 — Audit đợt 3: chạy lại lưới trên code sau P26c · GOI-1 · LUOI-2 · GOI-2 · SO-LUONG-1
ĐÃ SỬA:      không đổi code chạy thật. Mới trong viec/AUDIT-3/: boc.py (179 dòng — lớp bọc đối chứng / --sap / --xep / --c2luoi / --luoi1),
             dot_bien.py (125 — 25 đột biến độc lập), kiem_neo.py (176 — +6 bộ, kho nông, ảnh bb mới), bb_neo.json, a2_bang.md, bao_cao.md,
             bang_chung_do.txt, ke_hoach.md, trang_thai.md.
BÀI THỬ:     phiếu "Bài thử đỏ: không". Công cụ tự chứng minh (bang_chung_do.txt): D2 sai chuỗi → HỎNG · đã biết → BẮT · vô hại → SỐNG · sập →
             HỎNG; --sap 10 bộ không bộ nào BẮT; kiem_neo lần đầu đỏ thật (AU3-3) rồi xanh sau khi ghi lý do.
ĐÃ RÀ K4:    soTienHoan 3 đường (huỷ / xoá / duyệt) + ghiHoan 2 chỗ gọi + vuotTheoLoai 2 chỗ + pkgQty 4 chỗ + mẫu số tienDaTra.js:43 → bảng A4
             (grep -F từng neo, 1 lần, 0 file dot_bien*.py cũ chứa); RUA_CO_Y: grep từng tên hồ sơ ghi "lạc" — 3 tên neo vẫn khớp → bỏ.
CHƯA KIỂM:   - 2 đột biến LUOI-1 GOC-* (kho nông, không có 9521cec) — chạy nguyên bản trên kho đủ sâu.
             - AU3-13 / AU3-14: chưa dựng được ca tiền vượt total để biết trần "đã nhận" là lỗ hay vế thừa — xếp NẶNG theo luật phiếu.
             - Đột biến tienDaTra.js / ghiHoan SỐNG ở đường HUỶ đơn mua gói chỉ qua thu_P26c (cách p26c); cách `thu` (thu_GOI1) không chạy A5c2.
             - AUDIT-2 A3B (4, bundle) không chạy lại (phiếu không đòi, không đụng tiền); HOC-1 / HOC-2 / TOC-DO-1 không chạy (ngoài danh sách A2).
             - Thời gian máy đo trên máy mây khi không tải song song; máy chủ quán có thể khác.
             - Hook pre-commit không có trên máy mây (chỉ file mẫu) → tầng 3 không chạy ở đây; bộ kiểm chạy tay (D3).
             - BẮT của 4 bộ khuôn qua lớp bọc dựa vào `chay1` của bộ (dòng khớp đầu tiên) — bọc chỉ thêm đối chứng + sập, không đổi mẫu.
GIT:         (git log --oneline -2 ở câu trả lời sau commit cuối)
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 3 · BỎ 3 — chi tiết ở ## Bài học dưới đây
```

## Bài học (bước 11)
### 1. Sự cố gom được
a. Kho máy mây nông → `viec/LUOI-1/dot_bien.py` và `viec/AUDIT-2/kiem_neo.py` sập lúc nạp; người gác chặn `git fetch --deepen` → phải hỏi (Câu hỏi 1).
b. Bộ khuôn GOI-1 cũ đếm "bị bắt" khi bài thử sập SAU ca đỏ (P26c 89/93; AU3-6) — lớp bọc mới ra HỎNG-sập.
c. Agent soát kế hoạch bản 1: KHÔNG ĐẠT — neo A4 viết tắt (1 sai, 2 viết tắt), 8 số dòng lệch, sót K4 (`meTra`, nhiều gói), chưa tách LẠC-sập.
d. `RUA_CO_Y` chép theo bảng hồ sơ P26c / LUOI-2 → 3 tên "lạc" mà neo vẫn khớp HEAD (kiem_neo tự báo).
e. `boc.py` 179 dòng, vượt ngân sách 60–120 (kế hoạch ước 80–100).
f. Người gác chặn: GIT-KEO (`--deepen`), GIT-LENH (`rev-list`), B-DICHCHU (`$S`), B-PHANTICH (`<( )`, `$"`), B-MANOI (heredoc nhắc sổ việc),
   B-CHUONGTRINH (`for`), B-CD-VITRI (`cd` giữa lệnh) ×2 — đều có cách khác.
g. Tên C2F của AUDIT-1 trượt theo vị trí (AU3-7); mẫu AUDIT-2 KB21 rữa vì P26c đổi câu chữ ca (AU3-4) — `kiem_neo` so TỪ không bắt được.
h. Ghi `ke_hoach.md` / `trang_thai.md` lúc `--day-du` đang đo (không ảnh hưởng, nhưng trái luật tự đặt).

### 2. Xếp ngăn
- **KHOÁ** (trong Phạm vi, đã làm): (b) `boc.py` đối chứng đếm số + sập = HỎNG + `--xep`; (d) `kiem_neo.py` in "RUA_CO_Y có N tên KHÔNG còn hỏng"
  (ca đỏ: lần chạy đầu in 3 tên — `bang_chung_do.txt` 4). Đề xuất ngoài Phạm vi: (a) `viec/LUOI-1/dot_bien.py:26` bọc `try` + bỏ `GOC-*` khi
  thiếu commit — ca đỏ: kho không có `9521cec` → thoát 0; (b) đưa lớp bọc vào `cong_cu/` cho mọi `viec/*/dot_bien.py` (TU-CHAY-6 (3)); (g)
  AUDIT-1 `sinh_c2full` đặt tên theo bảng + loại; mẫu đột biến neo MÃ ca / mã lỗi (`KB21 → .*GOI_DA_KET_THUC|DON_KHONG_HUY_DUOC`) thay câu chữ.
- **NGUYÊN TẮC** (đề xuất `KHUON_LOI.md`, không sửa — đã 120/120, gộp vào K1 / K3 / K4 thay vì thêm mục):
  K1 thêm "Chặn": neo đột biến trong kế hoạch = chuỗi `grep -F` nguyên văn kèm số lần + số dòng đọc trong lượt (bản 1 viết tắt → 1 sai, 8 lệch);
  "đã thay" của một đột biến lạc phải kiểm bằng neo trên HEAD, không chép bảng hồ sơ (d).
  K3 thêm "Chặn": bộ đột biến xếp "sập" = HỎNG kể cả khi ca đỏ in TRƯỚC khi sập; bài thử dài phải in ✗ rồi đi tiếp, không ném (AU3-6).
  K4 thêm ví dụ: phần ví mẹ tính ở HAI chỗ (`orders.js:1343` `meTra`, `refunds.js:164`) — soát độc lập bắt (c).
- **BỎ**: (e) gom 5 chế độ vào một file để không thêm file — chủ quán quyết tách nếu muốn; (f) người gác chặn đều có đường khác; (h) một lần,
  bộ kiểm không soi `viec/`.

### 3. Dọn
`KHUON_LOI.md` 120/120: không thêm mục; đề xuất gộp vào K1 / K3 / K4 như trên. Không lời dặn nào trong `CLAUDE.md` / `KHUON_LOI.md` đã có phép
làm thay mà phát hiện ở việc này (việc không đụng bộ kiểm chính).
