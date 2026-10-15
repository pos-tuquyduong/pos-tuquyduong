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
  AUDIT-2 bb 178/179 so ảnh AUDIT-3 — ĐỒNG NGHĨA vì ảnh sinh từ chính HEAD (soát vòng 1): phép thật là dòng so ảnh AUDIT-2 bên dưới · do_*.js 6/6. **HỎNG ngoài danh sách: 0**; mẫu nghi rữa: 0. Mọi tên rữa đều có lý do "đã thay bằng …"
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
| AUDIT-1 trừ C2F 88 | `viec/AUDIT-1/dot_bien.py G3 A3 B1 C2 D1 -j 3` | 988 s | A3 16 · B1 8 · C2 3 · D1 54 + 1 HỎNG-sập + 2 LẠC; G3 HỎNG 2 · SỐNG 1 · HỎNG-sập 1 | `G3-da-biet` HỎNG (đã thay); `!D1-E11-P26b` ✗ A1b rồi `Bài thử sập` → HỎNG-sập (vòng 1, AU3-6) — còn lại y AUDIT-2 |
| C2F 87 + A3L c2full 13 bằng `c2luoi` | `boc.py --c2luoi -j 3` | 1199 s | C2F BẮT 63 · SỐNG 22 · HỎNG-sập 2 (`-02` dựng; `-10` KB30 `SẬP giữa kịch bản`, khung ghi BẮT → xếp lại vòng 1); A3L BẮT 8 · SỐNG 3 · HỎNG 2 | 22 SỐNG = 23 cũ − 2 BẮT nhờ thu_P26c + 1 câu mới GOI-2 (AU3-19); tên C2F trượt theo vị trí (AU3-7) |
| bb 175 + 4 D2 | `viec/AUDIT-2/dot_bien_bb.py -j 4` | 742 s | BẮT 125 · SỐNG 50 · HỎNG 1 · LẠC 3 | 50 = 48 cũ + 2 mới (AU3-18); LẠC 2 `BB-I2-sql-2/3` thực chất bắt (AU3-5); `D2-sap` LẠC-sập |
| A4 AUDIT-3 25 | `viec/AUDIT-3/dot_bien.py` | 32 s | BẮT 11 · SỐNG 11 · HỎNG 3 | 10 SỐNG tiền / gói = NẶNG-lưới (AU3-8…17), 1 SỐNG = D2 vô hại; HỎNG = D2 sai chuỗi, D2 sập, `HUY-ME-TRA-0` sập sau ✗ M2/M3 (AU3-6) |
Tổng thời gian máy 12 bước: 4.938 s ≈ 82 phút (kế hoạch ước ~85). `--xep` áp cho AUDIT-1 / AUDIT-2 / LUOI-1 / TACH-GL / bb khi sinh `a2_bang.md`
(dòng LẠC hay BẮT có dấu sập `Bài thử sập` / `Giả lập: SẬP` / `SẬP giữa kịch bản` → HỎNG-sập: `G3-sap`, `!D1-E11-P26b`, `C2F-orders-02-insert-quay`,
`C2F-orders-10-insert-quay`, `D2-sap`; ca T3…T10 của thu_gia_lap kiểm hành vi sập nên mô tả có chữ SẬP — không xếp).

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
Đếm chỗ MỚI (không trùng neo bộ cũ): P26c 6 (2 BẮT · 3 SỐNG · 1 HỎNG-sập), GOI-1 4 (2 · 2), GOI-2 4 (2 · 2), SO-LUONG-1 5 (2 · 3) — mỗi việc ≥ 3.
VS + BV: P26c / GOI-1 / GOI-2 có cả hai ở chỗ mới; **SO-LUONG-1 chỗ mới chỉ có VS-** (mọi cổng việc đó vá đều đã có BV- trong bộ của nó; 2 BV- của
AUDIT-3 cùng neo — dòng bổ sung) — thiếu so chữ phiếu "VS- + BV-" ở chỗ mới, ghi rõ (soát vòng 1, lỗi 4). K4: `soTienHoan` 3 đường (huỷ, xoá, duyệt) — đột biến `tienDaTra.js` SỐNG là SỐNG ở CẢ ba đường (không ca nào); `ghiHoan` 2 chỗ gọi
(B3e bắt ở kết thúc gói; huỷ đơn gói A5c2 của thu_P26c không chạy trong cách `thu` — ghi CHƯA KIỂM đường huỷ cho đột biến này). Phần ví mẹ
khi huỷ / xoá (`orders.js:1343` `meTra`): đột biến duy nhất neo dòng này (`VS-AU3-P26C-HUY-ME-TRA-0`) SẬP → **CHƯA KIỂM** cho tới khi thu_P26b
M2/M3 không sập (AU3-6).

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
ĐÃ SỬA:      không đổi code chạy thật. Mới trong viec/AUDIT-3/: boc.py (193 dòng — lớp bọc đối chứng / --sap 3 dạng sập / --xep / --c2luoi / --luoi1),
             dot_bien.py (125 — 25 đột biến độc lập), kiem_neo.py (176 — +6 bộ, kho nông, ảnh bb mới), bb_neo.json, a2_bang.md, bao_cao.md,
             bang_chung_do.txt, ke_hoach.md, trang_thai.md.
BÀI THỬ:     phiếu "Bài thử đỏ: không". Công cụ tự chứng minh (bang_chung_do.txt): D2 sai chuỗi → HỎNG · đã biết → BẮT · vô hại → SỐNG · sập →
             HỎNG; --sap 10 bộ × 3 dạng (nạp, ném giữa ca, đỏ-rồi-sập) không bộ nào BẮT oan; kiem_neo lần đầu đỏ thật (AU3-3) rồi xanh sau khi ghi lý do.
ĐÃ RÀ K4:    soTienHoan 3 đường (huỷ / xoá / duyệt) + ghiHoan 2 chỗ gọi + vuotTheoLoai 2 chỗ + pkgQty 4 chỗ + mẫu số tienDaTra.js:43 → bảng A4
             (grep -F từng neo, 1 lần, 0 file dot_bien*.py cũ chứa); RUA_CO_Y: grep từng tên hồ sơ ghi "lạc" — 3 tên neo vẫn khớp → bỏ.
CHƯA KIỂM:   - 2 đột biến LUOI-1 GOC-* (kho nông, không có 9521cec) — chạy nguyên bản trên kho đủ sâu.
             - AU3-13 / AU3-14: chưa dựng được ca tiền vượt total để biết trần "đã nhận" là lỗ hay vế thừa — xếp NẶNG theo luật phiếu.
             - Đột biến tienDaTra.js / ghiHoan SỐNG ở đường HUỶ đơn mua gói chỉ qua thu_P26c (cách p26c); cách `thu` (thu_GOI1) không chạy A5c2.
             - AUDIT-2 A3B (4, bundle) không chạy lại (phiếu không đòi, không đụng tiền); HOC-1 / HOC-2 / TOC-DO-1 không chạy (ngoài danh sách A2).
             - orders.js:1343 `meTra` (ví mẹ khi huỷ / xoá): đột biến duy nhất SẬP (AU3-6) → đường này chưa có đột biến nào chạy được canh.
             - Ca "đỏ rồi sập" cho --sap chỉ dựng được ở P26b / P26c (thu_P26b); GOI-1 / GOI-2 (thu_GOI1) chưa dựng được.
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
- **KHOÁ** (trong Phạm vi, đã làm): (b) `boc.py` đối chứng đếm số + sập = HỎNG (3 dấu: `Bài thử sập`, `Giả lập: SẬP`, `SẬP giữa kịch bản`) + `--xep`
  xét cả dòng BẮT; `--sap` 3 dạng (vòng 1); (d) `kiem_neo.py` tên thừa trong RUA_CO_Y → in + thoát 1 (vòng 1; ca đỏ: lần chạy đầu 3 tên — `bang_chung_do.txt` 4). Đề xuất ngoài Phạm vi: (a) `viec/LUOI-1/dot_bien.py:26` bọc `try` + bỏ `GOC-*` khi
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

## D3 · kiểm cuối (script nháp `d3.py`, tuần tự, HEAD 744ab60 — mọi commit từ a13d8ad chỉ đổi `viec/AUDIT-3/`)
- `npm test` → thoát 0 · ĐẾM PASS 63 · FAIL 0 · CẢNH BÁO 0 (96,6 s).
- `node kiem_tra_truoc_khi_giao.js --day-du` → thoát 0 · "dist đã commit KHỚP với src hiện tại" · ĐẾM PASS 67 · FAIL 0 · CẢNH BÁO 0 (187,2 s).
- `git status --porcelain` sau đo: rỗng; `git diff --stat a13d8ad..HEAD -- ':!viec/AUDIT-3/'` rỗng.

HEAD ĐÃ KIỂM: 744ab60

## Bước 8 · soát độc lập vòng 1 (`/ra-soat`, agent general-purpose, HEAD 4f0d83e) — chép nguyên
```
KHÔNG ĐẠT

(Soát nhánh viec/AUDIT-3, HEAD 4f0d83e; mốc a13d8ad. `git diff --stat a13d8ad^ HEAD -- ':!viec/AUDIT-3/'` RỖNG, `git status --short` rỗng trước và sau MỌI lệnh đo. Lệnh đo đã chạy tuần tự: kiem_neo.py (thoát 0, khớp A5), viec/P26c/dot_bien.py VS-Q9-hoan-me-ngoai-tx, boc.py P26c VS-Q9-hoan-me-ngoai-tx, viec/AUDIT-3/dot_bien.py 3 tên BẮT, node viec/AUDIT-2/lach.js, và 3 lần dò qua khung AUDIT-2 bằng script nháp NGOÀI kho /tmp/claude-0/-home-user-pos-tuquyduong/7e7af215-2d4b-5d78-b3f7-7b7110d21339/scratchpad/sap_giua_kb.py — không sửa file nào trong kho.)

LỖI TÌM ĐƯỢC:
1. viec/AUDIT-3/boc.py:21 (`SAP = 'Bài thử sập|bài thử sập|Giả lập: SẬP'`), boc.py:148 (`--xep` chỉ xếp lại dòng LẠC), bao_cao.md:14 ("A1: không bộ nào báo BẮT khi bài thử sập (10 bộ)") — Khung AUDIT-1/AUDIT-2 (dùng cho `--c2luoi` C2F 87 + A3L 13, AUDIT-1, AUDIT-2) chấm BẮT khi KỊCH BẢN NÉM GIỮA CHỪNG: cong_cu/gia_lap/chay.js:287 `catch (e) { ctx.http.push('SẬP giữa kịch bản: ' + e.message) }` → :289 thành dòng lệch `✗ KBn → HTTP: SẬP giữa kịch bản…` → :299 thoát 1; khung AUDIT-1 dot_bien.py:325–328 chấm BẮT khi thoát ≠ 0 và một dòng khớp mẫu; mẫu C2F là `r'✗ '` (AUDIT-1 dot_bien.py:200). CHẠY THẬT XÁC NHẬN: đột biến ném ở orders.js:416 (`subtotal += pkg.price * pkgQty;` → throw) qua khung AUDIT-2 cách `gl` → `BẮT · [chay.js] ✗ KB30 → HTTP: SẬP giữa kịch bản: không tạo được đơn "KB30 mua gói ví + tiền mặt": HTTP 500`. Cùng đột biến đặt ở `// 1. Tạo đơn hàng` thì phá dựng dữ liệu → `Giả lập: SẬP` thoát 2 → LẠC → `--xep` xếp HỎNG-sập đúng — tức công cụ chỉ bắt được sập LÚC NẠP/DỰNG, không bắt sập GIỮA KỊCH BẢN (phiếu: "ném ngoài ca" = HỎNG, không BẮT; và chính AUDIT-3 đã xếp thu_P26b "✗ M5 rồi sập" là HỎNG-sập — AU3-6 — nên phải nhất quán). `--sap` (boc.py:123–139) chỉ dùng lỗi cú pháp lúc nạp cho cả 10 bộ → kết luận "0/10 BẮT khi sập" chưa phủ dạng này. — K3 (ca "phải KHÔNG X" không đủ điều kiện kích hoạt X) + K4 (định nghĩa sập áp cho thu_*.js mà bỏ chay.js).
2. bang_chung_do.txt mục 2 (`--sap`) — ca KHÔNG PHÂN BIỆT bọc với bộ cũ: với đột biến cú pháp, thu_P26c/GOI1/P26b chỉ in `✖ Bài thử sập` (thu_P26c.js:829, thu_GOI1.js:817, thu_P26b.js:451, thoát 2), không có dòng `✗ ` → chay1 CŨ (viec/P26c/dot_bien.py:223–224 đòi `re.search(bat)` + thoát ≠ 0) cũng nói "không bắt". Ca phân biệt THẬT là "đỏ rồi sập": chạy lại `python3 viec/P26c/dot_bien.py VS-Q9-hoan-me-ngoai-tx` → bộ cũ "✓ … 1 đột biến bị bắt · 0 KHÔNG bị bắt" (thoát 0 = nói dối); `python3 viec/AUDIT-3/boc.py P26c VS-Q9-hoan-me-ngoai-tx -j 1` → đối chứng thub 66/0, `HỎNG-sập · Bài thử sập · thoát 2`. Cặp này có ở a2_bang.md:178 nhưng KHÔNG ở bang_chung_do.txt; D2 "sập → HỎNG không BẮT" hiện chỉ chứng minh cho dạng mà bộ cũ cũng không sai. — K3.
3. trang_thai.md:126 "P26c 6 (3 BẮT · 3 SỐNG — kể `HUY-ME-TRA-0` sập)" — đếm HỎNG-sập thành BẮT, trái định nghĩa phiếu; bảng trang_thai.md:108–113 cho thấy đúng là 2 BẮT · 3 SỐNG · 1 HỎNG-sập. Hệ quả K4/E6: neo `const meTra = order.parent_phone ? …` (orders.js:1343) chỉ có trong viec/AUDIT-3/dot_bien.py (grep -rlF toàn viec/*/dot_bien*.py) và đột biến đó SẬP → đường ví mẹ khi huỷ/xoá KHÔNG được đột biến nào chạy được canh — phải ghi vào CHƯA KIỂM (trang_thai.md:163–169 thiếu). — K4 / E6.
4. viec/AUDIT-3/dot_bien.py:46–50 — SO-LUONG-1 ở "chỗ mới" có 5 VS-, 0 BV-; trang_thai.md:126 "mỗi việc ≥ 3, có VS + BV" cho SO-LUONG-1 chỉ đúng nhờ 2 dòng bổ sung :52–53 mà bảng tự ghi "KHÔNG đếm" (cùng neo viec/SO-LUONG-1/dot_bien.py:17/:29 `soNguyenDuong` và :23/:54 `membership_buy`). Phiếu A4: "(VS- vá sai + BV- bỏ vá)". — K1 (khẳng định không khớp số).
5. viec/AUDIT-3/kiem_neo.py:172–176 — "RUA_CO_Y có N tên KHÔNG còn hỏng" chỉ `print`, mã thoát là `sys.exit(1 if hong else 0)` (hong không gồm thua) → tên thừa trong RUA_CO_Y không làm đỏ. trang_thai.md:187–188 gọi đây là KHOÁ (d); bang_chung_do.txt:71–72 "→ thoát 1" thực ra do 2 HỎNG (A3L-goi-giao-them-1, A3L-deliver-bo-chan-am), không do 3 tên thừa. Lời dặn "xem tay", không phải khoá. — C16 / K6 (NHẸ).
6. kiem_neo.py:137–145 — ảnh viec/AUDIT-3/bb_neo.json sinh từ chính HEAD rồi so với `bb.sinh()` trên cùng HEAD → "AUDIT-2 bb 178/179 khớp" (trang_thai.md:64–65, bao_cao.md:62) là đồng nghĩa, không mang thông tin ở đợt này; thông tin thật chỉ là dòng so ảnh AUDIT-2 (:147–148: mới 27 · mất 0 · trôi 3). Lời duyệt Câu hỏi 2 cho phép ảnh mới, nhưng báo cáo trình bày như một phép kiểm. — K3 (xanh oan về bản chất), NHẸ.
7. Số dòng lệch (K1, NHẸ): bao_cao.md:20 AU3-1 "viec/LUOI-1/dot_bien.py:26" → lệnh `git show 9521cec` ở :24 (:26 là chú thích); bao_cao.md:23 AU3-4 "orders.js:1392" → `if (doi.changes !== 1)` ở :1393; ke_hoach.md:81 "A3L c2full 14 dòng" → thật 13 (đếm viec/AUDIT-2/dot_bien.py:53–81; a2_bang/trang_thai ghi 13 đúng).
8. a2_bang.md:3–4 hứa "Mỗi tên không BẮT có cột vì sao" nhưng 48 dòng SỐNG bb (:89–138) để trống. Đã đối chiếu bằng máy: 48 tên đều có trong viec/AUDIT-2/b2_bang.md → nội dung "như AUDIT-2" đúng, chỉ thiếu chữ. NHẸ.

(Đã kiểm và KHÔNG thấy lỗi: boc.py `cham`/`doi_chung`/`Vo` chấm đúng cho 4 bộ khuôn (thread-local, đối chứng so DOI_CHUNG, ap từ chối → HỎNG); mẫu rộng A4 không bắt oan — 3 đột biến BẮT chạy lại khớp đúng ca ngữ nghĩa: TRAN-CA-DON → B1c "mỗi dòng trần 40.000 — 40.001 → 400", LOAI-BO-DA-LAY → A2a "giao 6", GHI-HOAN-PHAN-VI → B3e; `--sap` AUDIT-2 soi `startswith('BẮT ')` khớp định dạng khung (`{kq:4}`), LUOI-1/TACH-GL `[✓✗] BẮT` khớp :222/:162; K5: ap kiểm realpath trong tempdir, ban_sao chép vào mkdtemp, nap_khuon/nap_module không ghi gì, exec chỉ tới `if __name__`; neo AU3-8…17 đúng file:dòng HEAD (tienDaTra.js:16/18/22/43/83/87, goiKhach.js:24/26, orders.js:422/424, reports.js:67/175 `SUM(oi.total_price)`); `grep shipping_fee cong_cu/` = 0 (chỉ server/) → AU3-8 đúng; AU3-13 lập luận hợp lý theo code (damages.js:175 GOI_THE_KHONG_DEN, refunds.js:118/157 DON_CO_GOI, orders.js:1403/1559 goiDaKetThuc, soTienHoanGoi:77 đòi completed) nhưng trần đó chính là lớp đỡ cho lỗi kiểu AU3-15 nên "thừa" chỉ đúng khi code khác đúng — xếp NẶNG theo luật phiếu là hợp lý; K4 A4: soTienHoan 2 chỗ gọi (orders.js:1344 cho huỷ+xoá, refunds.js:164), ghiHoan 2 (orders.js:1348, packages.js:266), vuotTheoLoai 2 (orders.js:414, :869), soTienHoanGoi 2 (packages.js:212, :253), pkgQty :416/:422/:424/:1036 — bảng A4 phủ đủ; A3 ca A2a:199, A2d:210, A6a:324, A6b:326 đúng; A6 chạy lại CHẶN 14 · LỌT ĐÃ BIẾT 1 · LỌT 0, LUAT 76.)

NGHI NGỜ:
- Trong 64 BẮT C2F + 8 BẮT A3L (c2luoi), 82 BẮT AUDIT-1, 18 BẮT AUDIT-2, có bao nhiêu BẮT thực chất là "SẬP giữa kịch bản"? Không đếm được từ kho (nhật ký nháp không chép vào kho, a2_bang chỉ liệt tên BẮT). Nếu > 0 thì tỷ lệ bảng bao_cao.md:48–63 đổi.
- boc.py:55 coi mọi `returncode == 2` là sập: đúng với thu_*.js và chay.js:157, nhưng chay.js thoát 3 (TỪ CHỐI) sẽ thành LẠC; không thấy trong A2 nhưng chưa có ca.
- boc.py `chay_khuon` trả 0 kể cả khi có SỐNG/HỎNG (khác dot_bien.py A4 thoát 1 khi SỐNG/LẠC) — chủ ý đo, nhưng người dùng lệnh dễ đọc nhầm "thoát 0 = sạch".

NGHIỆM THU: 6/9 mục có bằng chứng đủ · mục thiếu: A1 (lỗi 1, 2 — `--sap` không phủ "ném giữa kịch bản" và không phân biệt bọc với bộ cũ), A4 (lỗi 3, 4 — SO-LUONG-1 chỗ mới không có BV-, P26c đếm HỎNG-sập thành BẮT, meTra chưa kiểm), D2 (lỗi 2 — bằng chứng "sập → HỎNG không BẮT" chỉ cho dạng cú pháp; dạng đỏ-rồi-sập không có trong bang_chung_do; dạng ném-giữa-kịch-bản → BẮT). Đủ: A2 (11 bộ, 781 tên, mọi dòng không BẮT có lý do trừ 48 dòng bb như AUDIT-2), A3 (ca + dòng xác nhận), A5 (chạy lại thoát 0, số khớp; kèm nghi ngờ 6), A6 (chạy lại khớp), D1 (77 dòng, đủ cột), D3 phần kiểm được (diff ngoài viec/AUDIT-3 rỗng, cây sạch sau mọi lệnh đo).

CHƯA SOÁT ĐƯỢC: `npm test` / `--day-du` (nặng, không chạy lại — tin trang_thai.md:203–206); bộ đầy đủ A2 (AUDIT-1, bb, TACH-GL, c2luoi — hàng chục phút) nên các con số BẮT/SỐNG từng bộ chỉ đối chiếu nội bộ (tổng cộng khớp) chứ không chạy lại; nhật ký nháp a1_*/a4_*/chay_a2.log không có trong kho; 2 GOC-* LUOI-1 (kho nông); thử ngắt SIGINT (bang_chung_do mục 5) không lặp lại; thời gian máy.

BÀI HỌC:
- KHOÁ (bài thử / người gác): (1) boc.py — thêm `SẬP giữa kịch bản` vào `SAP` và xét sập trên CẢ dòng BẮT (không chỉ LẠC ở `--xep`); `--sap` phải có, cho mỗi bộ, một ca "đỏ rồi sập" (kiểu VS-Q9-hoan-me-ngoai-tx) và một ca "ném giữa kịch bản" (kiểu throw ở orders.js:416, cách `gl`) — ca đỏ: bộ cũ báo "bị bắt"/BẮT; (2) kiem_neo.py — `thua` (tên RUA_CO_Y không còn hỏng) phải làm thoát 1; (3) ghi CHƯA KIỂM cho orders.js:1343 meTra cho tới khi thu_P26b M2/M3 không sập (AU3-6).
- NGUYÊN TẮC (KHUON_LOI.md, đề xuất gộp): K3 — ca "công cụ không nói dối" phải là ca mà công cụ CŨ/đối chứng nói dối (có sức phân biệt); ca mà cũ lẫn mới đều đúng không phải bằng chứng. K4 — một định nghĩa (ở đây "sập") đổi/thêm thì grep MỌI nơi sinh ra dấu hiệu đó (`Bài thử sập`, `Giả lập: SẬP`, `SẬP giữa kịch bản`) ở mọi khung chạy, không chỉ khung mình vừa bọc. K1 — không đếm một kết quả vào hai cột (HỎNG-sập đếm thành BẮT ở trang_thai.md:126).
- BỎ: lỗi 7, 8 (số dòng lệch nhỏ, cột trống nhưng nội dung đúng) — sửa chữ, không cần khoá.
```

### Sửa sau soát (vòng sửa 1/3)
- Lỗi 1 → `boc.py`: `SAP` thêm `SẬP giữa kịch bản`; `--xep` xếp HỎNG-sập cho cả dòng BẮT có dấu sập (trừ ca T3…T10 của thu_gia_lap — kiểm hành vi
  sập, mô tả có chữ SẬP); `--sap` thêm mỗi bộ ca NÉM giữa ca (`throw` ở `orders.js:416`; thu_* → sập, chay.js → `SẬP giữa kịch bản`, khung
  ghi BẮT → bọc xếp lại) và ca đỏ-rồi-sập (P26b `DOSAP-P26b` meTra, P26c `VS-Q9-hoan-me-ngoai-tx`). Đếm lại A2 bằng dấu mới: thêm 2 HỎNG-sập
  (`C2F-orders-10-insert-quay`, `!D1-E11-P26b`) — `a2_bang.md` sinh lại, tỷ lệ `bao_cao.md` đổi (C2F 63/85, D1 81/83).
  Sự cố khi sửa: chú thích chèn cuối dòng `return ten, 'HỎNG-sập', …` nuốt phần sau → tuple 2 phần tử, `--sap` sập (K7) — tự bắt khi chạy lại.
- Lỗi 2 → `bang_chung_do.txt` mục 2 thay bằng `--sap` mới (3 dạng), mục 6 cặp "bộ cũ nói dối ↔ bọc" cho đỏ-rồi-sập.
- Lỗi 3 → đếm P26c 2 BẮT · 3 SỐNG · 1 HỎNG-sập; CHƯA KIỂM thêm `meTra`.
- Lỗi 4 → ghi rõ SO-LUONG-1 chỗ mới chỉ VS- (lý do: mọi cổng của việc đó đã có BV- trong bộ của nó) ở A4, 7 mục, `bao_cao.md`.
- Lỗi 5 → `kiem_neo.py` thoát 1 khi `thua` (chạy lại: thoát 0, không tên thừa).
- Lỗi 6 → chữ "bb 178/179 khớp" ghi là đồng nghĩa; phép thật = so ảnh AUDIT-2.
- Lỗi 7, 8 → số dòng `:24`, `:1393`, `13 dòng`; cột "vì sao" 48 dòng bb = "như AUDIT-2 (b2_bang)".
- Nghi ngờ: "SẬP giữa kịch bản" trong BẮT = 1 (`C2F-orders-10`, grep nhật ký); thoát 3 chay.js: ghi chú trong `cham` (không phải sập);
  `chay_khuon` thoát 0 khi có SỐNG: chủ ý (bọc đo, không chấm) — ghi ở docstring? giữ nguyên, nêu ở đây.

### Kiểm lại sau vòng sửa 1 (bước 6)
- `python3 viec/AUDIT-3/kiem_neo.py` → thoát 0 (0 HỎNG ngoài danh sách, 0 tên thừa); `python3 viec/AUDIT-3/boc.py --sap` → ĐẠT (bang_chung_do.txt 2).
- `npm test` → thoát 0 · ĐẾM PASS 63 · FAIL 0 · CẢNH BÁO 0 (HEAD b9426a9; mọi commit chỉ đổi `viec/AUDIT-3/` — `--day-du` 67/0 ở HEAD 744ab60
  vẫn áp vì code chạy thật không đổi). `git status` sạch.

HEAD ĐÃ KIỂM: b9426a9

## Bước 8 · soát độc lập vòng 2 (`/ra-soat`, agent general-purpose, HEAD 1510449)
- Agent soát vòng 2 bị dừng giữa chừng vì giới hạn phiên của máy (HTTP 429 "session limit · resets 12pm UTC") → **báo cáo không về**.
  Theo luật `/ra-soat` bước 3: KHÔNG tự kết luận ĐẠT thay người soát. Trạng thái: 8 lỗi vòng 1 đã sửa (mục "Sửa sau soát" + "Kiểm lại"),
  chưa có xác nhận độc lập vòng 2 — chủ quán / chat soát chạy lại `/ra-soat AUDIT-3` khi hạn mức mở (vòng sửa còn 2/3).
