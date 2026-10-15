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
- Neo khớp / mục có neo: AUDIT-1 173/175 · P26b 50/59 · P26c 89/93 · GOI-1 40/49 · GOI-2 59/59 · SO-LUONG-1 17/17 · AUDIT-3 25/26 ·
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
| AUDIT-2 A3L B3 A3P D2K (30; vòng 2: qua bọc khung, kết quả y hệt) | `boc.py --audit2 A3L B3 A3P D2K -j 3` | 409 s | A3L BẮT 15 · SỐNG 3 · HỎNG 2 / A3P SỐNG 1 / B3 BẮT 3 · SỐNG 2 · LẠC 1 / D2K HỎNG 2 · SỐNG 1 | A3L 5 NẶNG-lưới AU2-2 → BẮT; A3P SỐNG = AU2-1 đóng; `D2K-da-biet` HỎNG (AU3-2); 2 HỎNG (AU3-3); `BK-KB21` BẮT → LẠC (AU3-4); A3B bỏ (không đụng tiền) |
| LUOI-1 78 HEAD | `boc.py --luoi1 -j 4` | 88 s | 78/78 đúng mong đợi | 2 `GOC-*` CHƯA KIỂM (kho nông, lời duyệt (b)) |
| TACH-GL 29 | `viec/TACH-GL/dot_bien.py` | 753 s | BẮT 25 · HỎNG 3 · LẠC 1 | như LUOI-2 ghi (4 đã thay P26c) |
| AUDIT-1 trừ C2F 88 (vòng 3: qua bọc khung, luật `sap_cua`) | `boc.py --khung G3 A3 B1 C2 D1 -j 3` | 986 s | A3 16 · B1 8 · C2 3 · D1 54 + HỎNG-sập 1 + LẠC 2; G3 HỎNG 2 · SỐNG 1 · HỎNG-sập 1 | `G3-da-biet` HỎNG (đã thay); `!D1-E11-P26b` HỎNG-sập (dòng ✗ của `kiem_tra` mang `✖ Bài thử sập` của thu_P26b — vế 4, soát vòng 3 bác luật "harness chết" của vòng 2); 4 `D1-E*` còn lại BẮT nhờ phép tĩnh riêng; `!D1-E11-P20/P26a` LẠC như AUDIT-2 |
| C2F 87 + A3L c2full 13 bằng `c2luoi` (vòng 2: qua bọc khung) | `boc.py --c2luoi -j 3` | 1197 s | C2F BẮT 59 · SỐNG 22 · HỎNG-sập 6; A3L BẮT 8 · SỐNG 3 · HỎNG 2 | HỎNG-sập: `orders-02`, `wallets-01/02/06` (giả lập không dựng được dữ liệu), `orders-10` (SẬP giữa kịch bản), **`wallets-05` đỏ-rồi-sập ẩn** (thu_P26b ✗ M2 rồi sập) — vòng 1 ghi BẮT cả 4 wallets; 22 SỐNG không đổi | 22 SỐNG = 23 cũ − 2 BẮT nhờ thu_P26c + 1 câu mới GOI-2 (AU3-19); tên C2F trượt theo vị trí (AU3-7) |
| bb 175 + 4 D2 | `viec/AUDIT-2/dot_bien_bb.py -j 4` | 742 s | BẮT 125 · SỐNG 50 · HỎNG 1 · LẠC 3 | 50 = 48 cũ + 2 mới (AU3-18); LẠC 2 `BB-I2-sql-2/3` thực chất bắt (AU3-5); `D2-sap` LẠC-sập |
| A4 AUDIT-3 25 | `viec/AUDIT-3/dot_bien.py` | 32 s | BẮT 11 · SỐNG 11 · HỎNG 3 | 10 SỐNG tiền / gói = NẶNG-lưới (AU3-8…17), 1 SỐNG = D2 vô hại; HỎNG = D2 sai chuỗi, D2 sập, `HUY-ME-TRA-0` sập sau ✗ M2/M3 (AU3-6) |
Tổng thời gian máy 12 bước: 4.938 s ≈ 82 phút (kế hoạch ước ~85); vòng 2 chấm lại khung + --sap + npm test: 2.867 s + 202 s ≈ 51 phút. Vòng 3 chạy lại TUẦN TỰ 10 bước (`chay_vong3.py`, HEAD 9de6829): 3.682 s ≈ 61 phút — mọi bộ qua `cham` / `boc_khung` + A4 + `npm test`; P26b · P26c · GOI-1 · GOI-2 · c2luoi · AUDIT-2 y vòng 2 từng tên, AUDIT-1 chỉ đổi `!D1-E11-P26b`.
**KHO BẨN (vòng 2):** khung AUDIT-1 in "✗ KHO BẨN" ở hai lần chạy (`--sap` và `--khung`) đúng lúc tôi đang sửa / commit file trong `viec/AUDIT-3/`
song song; lớp bọc ngoài (lọc `viec/AUDIT-3/`) và `git status` của script điều khiển đều sạch, `data/` không đổi, không thư mục tạm sót. Thử lại
riêng (script nháp `kho_ban.py`: cùng 2 ca, không sửa file) → "ảnh kho giống nhau"; thử sửa file theo dõi / tạo file lạ trong `viec/AUDIT-3/`
giữa hai lần chụp → bộ lọc đúng. Chưa truy được nguyên nhân (nghi: `git status` của khung chạy trùng lúc `git commit` giữ `index.lock`) →
CHƯA KIỂM; luật tự đặt: KHÔNG sửa / commit gì trong lúc bộ đo chạy (vi phạm ở vòng 2, K7). `--xep` áp cho AUDIT-1 / AUDIT-2 / LUOI-1 / TACH-GL / bb khi sinh `a2_bang.md`
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
- D1 `bao_cao.md` ≤ 200 dòng (số thật ở câu trả lời cuối): kết luận **chưa đạt điểm dừng** (10 NẶNG-lưới AU3-8…17, 0 NẶNG-code), bảng AU3-1…21, tỷ lệ theo nhóm, đề xuất.
- D2 `bang_chung_do.txt` 74 dòng: D2 của `dot_bien.py` (HỎNG · BẮT · SỐNG · HỎNG-sập), `boc.py --sap` nguyên văn, `boc.py GOI-1 BV-GOI1-TONG`,
  lần chạy đầu `kiem_neo.py` báo HỎNG thật, ngắt SIGINT. Phiếu "Bài thử đỏ: không" → không dòng `SỐ CA`.
- Người gác chặn trong lượt 2: `for` (B-CHUONGTRINH), `$"` trong grep (B-PHANTICH), `cd … &&` không ở đầu (B-CD-VITRI) — đều viết lại, không lách.

## Nghiệm thu — đếm từng mục (bằng chứng trên HEAD, lượt 2)
| mục | bằng chứng |
|---|---|
| A1 đối chứng + sập | `boc.py --sap` → 0/10 bộ BẮT khi sập (`bang_chung_do.txt` 2; `G3-sap`, `D2-sap` từ A2 = LẠC-sập); 4 bộ khuôn chạy qua bọc với đối chứng đếm số khớp mục 0 (105 / 101 / 66 / ĐẠT — `a2_bang.md` + nháp `a1_*.txt`); `--xep` tách LẠC-sập trong `a2_bang.md` |
| A2 chạy lại đủ | 11 lần chạy (bảng A2 trên, `a2_bang.md` từng tên 11 bộ: 88 + 100 + 30 + 179 + 59 + 93 + 49 + 59 + 17 + 78 + 29 = 781 dòng, 768 tên — 13 A3L c2full có mặt ở cả AUDIT-2 lẫn c2luoi); mọi LẠC / HỎNG ghi "đã thay bằng" hoặc mã AU3; khác AUDIT-2 → cột "vì sao" |
| A3 đóng sổ | mục A3: AU2-1 (A3P SỐNG + 3 P26c BẮT, ca A2a/A2d), AU2-2 (5 BẮT, L1a–L5a), AU2-11 (3 P26c + 2 SO-LUONG-1 BẮT, A6a/A6b/S2b/S2d) |
| A4 đột biến độc lập | `viec/AUDIT-3/dot_bien.py` 25 tên (bảng A4): P26c 6 · GOI-1 4 · GOI-2 4 · SO-LUONG-1 5 ở chỗ mới + 2 bổ sung + 4 D2; có đối chứng; 10 SỐNG tiền / gói = NẶNG AU3-8…17 trong `bao_cao.md` |
| A5 kiem_neo | `python3 viec/AUDIT-3/kiem_neo.py` thoát 0 (mục A5): 18 bộ, 0 HỎNG ngoài danh sách, lần đầu lộ AU3-3 (`bang_chung_do.txt` 4); ảnh bb mới `bb_neo.json` + bảng tên mới / trôi |
| A6 lách | mục A6: 0 mã mới (`LUAT` 76 so `4d175bc`), `lach.js` CHẶN 14 · LỌT ĐÃ BIẾT 1 |
| D1 | `bao_cao.md` ≤ 200 dòng: kết luận một dòng, bảng AU3-1…21, NẶNG/NHẸ, file:dòng, lệnh thấy lại, đề xuất khoá, tỷ lệ theo nhóm |
| D2 | `bang_chung_do.txt`: sai chuỗi → HỎNG, đã biết → BẮT, vô hại → SỐNG, sập → HỎNG(-sập) |
| D3 | `npm test` thoát 0 · PASS 63 · FAIL 0 · CẢNH BÁO 0 (96,6 s); `--day-du` ghi dưới; `git status` 0 dòng sau 12/12 bước + SIGINT 0 thư mục sót; `git diff --stat a13d8ad..HEAD -- ':!viec/AUDIT-3/'` rỗng |

## Báo cáo 7 mục
```
VIỆC:        AUDIT-3 — Audit đợt 3: chạy lại lưới trên code sau P26c · GOI-1 · LUOI-2 · GOI-2 · SO-LUONG-1
ĐÃ SỬA:      không đổi code chạy thật. Mới trong viec/AUDIT-3/: boc.py (224 dòng — lớp bọc đối chứng / --sap 4 dạng sập / --xep / bọc KHUNG AUDIT-1
             --khung --c2luoi --audit2 / --luoi1), dot_bien.py (128 — 25 đột biến độc lập + D2 sập mã 0; SO-LUONG-1 chỗ mới chỉ VS-, 2 BV- cùng neo bộ cũ), kiem_neo.py (176 — +6 bộ, kho nông, ảnh bb mới), bb_neo.json, a2_bang.md, bao_cao.md,
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
             - bb (dot_bien_bb.py) KHÔNG chạy qua bọc khung → trong 123 BẮT có thể còn đỏ-rồi-sập ẩn (thu_gia_lap ca tay / chay.js) — chưa đếm.
             - Ném ngoài main() của thu_*.js (timer / sự kiện, không có uncaughtException) thoát 1 không dấu sập → sau một ✗ bất kỳ = BẮT ở mọi công cụ (soát vòng 2 đọc code, chưa dựng ca).
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

## Bước 8 · soát độc lập vòng 2 (`/ra-soat`, agent general-purpose mới, HEAD 68274ad — lần đầu bị cắt vì 429, người gác chặn SendMessage nên mở agent mới) — chép nguyên
```
KHÔNG ĐẠT

(Soát vòng 2 nhánh viec/AUDIT-3, HEAD 68274ad, mốc a13d8ad. Xác nhận: `git diff --stat a13d8ad^ HEAD -- ':!viec/AUDIT-3/'` RỖNG; `git diff --stat 744ab60 HEAD -- ':!viec/AUDIT-3/'` rỗng (code chạy thật không đổi từ HEAD --day-du 67/0); `git diff --stat b9426a9 HEAD` chỉ trang_thai.md. `git status --short` RỖNG trước và sau MỌI lệnh đo. Lệnh đã chạy tuần tự: kiem_neo.py (thoát 0), boc.py --xep trên file mẫu ngoài kho, boc.py GOI-1 BV-GOI1-TONG (BẮT, đối chứng 101/0), dot_bien.py 2 tên SỐNG, node viec/AUDIT-2/lach.js (CHẶN 14 · LỌT ĐÃ BIẾT 1), và 2 script nháp NGOÀI kho /tmp/claude-0/-home-user-pos-tuquyduong/7e7af215-2d4b-5d78-b3f7-7b7110d21339/scratchpad/{sap0.py,dosap_khung.py} nạp boc.py/dot_bien.py làm module. Không sửa file nào trong kho.)

1. TỪNG LỖI VÒNG 1 ĐÃ SỬA ĐÚNG CHƯA (diff 4f0d83e..HEAD -- viec/AUDIT-3/):
- (1) boc.py:22 SAP có `SẬP giữa kịch bản` ✓; :162 `--xep` xét cả BẮT ✓; :130–133 `--sap` thêm NEM-/DOSAP-/VS-Q9 ✓. NHƯNG sửa NỬA VỜI (K4) — xem LỖI 1 dưới: dạng "đỏ rồi sập" chỉ được dựng cho 4 bộ khuôn qua `cham` (đọc cả đầu ra); với KHUNG AUDIT-1/AUDIT-2 (c2luoi, p26b, kiem, bb) khung chỉ in dòng khớp ĐẦU TIÊN (viec/AUDIT-1/dot_bien.py:325–328) nên dấu sập của thu_*.js không bao giờ lên dòng BẮT → `--xep` mù, `--sap` không có ca này cho khung. Loại trừ `✗ T\d` (:162) hợp lý cho dòng BẮT của thu_gia_lap (bb TANG :251 mẫu đã `(?!.*SẬP)`), nhưng dòng LẠC ghép nhiều tầng bằng ' | ' (dot_bien_bb.py:271–272) có `✗ T2` ở tầng 1 + `Giả lập: SẬP` ở tầng 2 sẽ bị bỏ qua — đã thử trên file mẫu: dòng đó đếm LẠC (PLAUSIBLE, chưa thấy trong A2). `xau` :133/:150 bỏ NEM- là chấp nhận được (500 là ca đỏ thật); nhánh `elif 'SAP-AUDIT2'` :141 đúng.
- (2) bang_chung_do.txt mục 6 ✓ có ca phân biệt thật (bộ cũ P26c "bị bắt" ↔ bọc HỎNG-sập; khung NEM "BẮT…SẬP giữa kịch bản" ↔ bọc xếp lại). Mục 2 vẫn là dạng mà bộ cũ cũng không sai (SAP-/SAI-/NEM- thu_*) — chỉ mục 6 mang sức phân biệt.
- (3) ✓ trang_thai.md:126 "P26c 6 (2 BẮT · 3 SỐNG · 1 HỎNG-sập)"; CHƯA KIỂM meTra ghi ở :130–131 và 7 mục :170.
- (4) NỬA: ghi ở A4 (trang_thai.md:128–129) và bao_cao.md:63; 7 mục (trang_thai.md:156–176) KHÔNG có chữ nào về SO-LUONG-1 chỉ VS- (grep "chỉ VS-|chỉ có VS-" chỉ ra :128, :257) — câu "ở A4, 7 mục, bao_cao.md" (:257) sai một vế. K1.
- (5) ✓ kiem_neo.py:176 `sys.exit(1 if hong or thua else 0)`; chạy lại thoát 0, 0 tên thừa.
- (6) ✓ trang_thai.md:64, bao_cao.md:64 ghi "ĐỒNG NGHĨA", phép thật = so ảnh AUDIT-2.
- (7) ✓ LUOI-1 `git show` ở viec/LUOI-1/dot_bien.py:24; orders.js:1393 `doi.changes !== 1`, :1403 `goiDaKetThuc`; ke_hoach.md:74 "13 dòng".
- (8) NỬA: 48 dòng bb cũ đã có "như AUDIT-2 (b2_bang.md…)" nhưng HAI dòng HỎNG-sập MỚI thêm ở vòng sửa 1 để trống cột "vì sao": a2_bang.md:19 `!D1-E11-P26b`, :31 `C2F-orders-10-insert-quay` — cùng khuôn lỗi 8 lặp lại ở chỗ mới. K4.

LỖI TÌM ĐƯỢC:
1. viec/AUDIT-3/boc.py:155–165 (`--xep`) + :133–145 (`--sap` không có ca đỏ-rồi-sập đi qua KHUNG) + bao_cao.md:14–15 ("không bộ nào ra BẮT mà dòng khớp không phải dấu sập") + trang_thai.md:260 ("SẬP giữa kịch bản trong BẮT = 1, grep nhật ký") — CHẠY THẬT XÁC NHẬN: DOSAP_KHUON (meTra = 0, boc.py:29) đưa qua khung AUDIT-1 cách `p26b` (dosap_khung.py, cách làm y như sap() với SAP-/NEM-AUDIT2) → khung in `BẮT   D2K DOSAP-KHUNG  (2 s) · [cong_cu/thu_P26b.js] ✗ M2 huỷ đơn trả ví mẹ → 200 … ví mẹ 100000 → 75000` (thu_P26b sập thoát 2 SAU ✗ M2/M3 — chính ca mà AUDIT-3 xếp HỎNG-sập ở AU3-6), rồi `boc.py --xep` trên đầu ra đó → `--xep: BẮT 1`. Nguyên nhân: viec/AUDIT-1/dot_bien.py:325–328 trả BẮT khi thoát ≠ 0 và có dòng khớp, chi = `trung[0][:220]`, không nhìn mã thoát 2, không nhìn `✖ Bài thử sập`; nên "SẬP giữa kịch bản" chỉ lộ vì chay.js tự ghép nó VÀO dòng lệch (chay.js:287), còn thu_*.js in dấu sập ở dòng KHÁC → vô hình. Hệ quả: con số "= 1" là CẬN DƯỚI; trong 71 BẮT c2luoi + 81 AUDIT-1 + 18 AUDIT-2 + 125 bb có thể còn đỏ-rồi-sập ẩn (c2luoi tầng 1 có thu_P26a/P26b/P26c; `kiem` chạy thu_P26b). — K4 (sửa định nghĩa sập cho `cham` của bọc, quên khung in dòng đầu) + K3 (ca "phải KHÔNG BẮT oan" không đủ điều kiện kích hoạt).
2. viec/AUDIT-3/dot_bien.py:93–95 và boc.py:59–60 — "sập mã 0" chấm SỐNG. thu_P26c.js:91 chạy máy chủ TRONG tiến trình bài thử; đột biến `// 1. Tạo đơn hàng` → `process.exit(0);` (sap0.py) → dot_bien.py chay1: `('SOAT2-exit0', 'SỐNG', 'thoát 0, KHÔNG thấy /✗ / · [A1] huỷ rồi xoá đơn giao từ gói → …')`; boc.py cham: cùng SỐNG. Dòng cuối là tên ca, KHÔNG có dòng `… đạt · … hỏng`, cả hai công cụ không đòi dòng tổng khi chấm (chỉ đòi ở đối chứng: boc.py:66–69, dot_bien.py:104). Theo luật phiếu SỐNG tiền = NẶNG → một sập dạng này sẽ thành NẶNG-lưới giả. Khoá rẻ: SỐNG chỉ khi có `(\d+) đạt · 0 hỏng` khớp DOI_CHUNG (đã có sẵn :23). Cùng dạng (đọc code, chưa dựng ca): thu_P26c/P26b/GOI1 không có `process.on('uncaughtException'|'unhandledRejection')` (grep 0) → ném ngoài `main()` (timer/sự kiện) thoát 1 không dấu sập → sau một ✗ bất kỳ = BẮT ở mọi công cụ. — K3.
3. a2_bang.md:146 + bao_cao.md:58 + trang_thai.md:31 — bb `D2-vo-hai` (dot_bien_bb.py:205 đổi 'SX nhận vân tay lạ' → 'SX nhan van tay la', hợp đồng D2 "vô hại → SỐNG", AUDIT-2 bang_chung_do.txt:8 SỐNG) nằm trong danh sách BẮT của a2_bang (đếm máy: 125 tên, gồm cả `D2-da-biet` và `D2-vo-hai`), không một chữ giải thích ở a2_bang/trang_thai/bao_cao/bang_chung_do (grep "D2-vo-hai" trong viec/AUDIT-3 chỉ ra dòng 146). Lý do thật: cong_cu/thu_gia_lap.js:467 ca tay I7 so CHỮ `/SX nhận vân tay lạ POS:9:in:0/` (thêm sau AUDIT-2) → "vô hại" không còn vô hại trên HEAD — bằng chứng D2 của bb HỎNG, cùng loại AU3-2 (D2K-da-biet rữa) nhưng không được báo. Kéo theo số: bao_cao.md:58 "A2 bb (175 sinh) | 125 | 50 | 0 | 0 | 2 | 125/175" — 125 + 50 + 2 = 177 ≠ 175; đúng là 123/175 (bỏ 2 D2) hoặc 125/177. — K1 + K3 (phép tự-kiểm D2 báo khác mong đợi mà không ai đọc).
4. bao_cao.md:63 tỷ lệ A4 "11/20": 25 tên − HỎNG 1 − sập 2 = 22; muốn mẫu 20 phải trừ 2 D2 cố ý (da-biet, vo-hai) nhưng tử 11 vẫn gồm D2 da-biet → phải là 10/20 hoặc 11/21. — K1 (nhỏ).
5. trang_thai.md:156–176 (7 mục) không ghi SO-LUONG-1 chỗ mới chỉ VS- dù :257 nói đã ghi "ở A4, 7 mục, bao_cao.md". — K1.
6. a2_bang.md:19, :31 — cột "vì sao / so AUDIT-2" trống ở hai dòng HỎNG-sập mới, trái lời hứa a2_bang.md:3–4; lặp đúng khuôn lỗi 8 vòng 1 ở chỗ vừa thêm. — K4.
7. bao_cao.md:52 gọi LUOI-1/TACH-GL là "LẠC-sập": bang_chung_do.txt:56, :60 dòng cuối là `Node.js v22.22.0 · thiếu mẫu: KB\d+ →` — KHÔNG có dấu sập nào, `--xep` không thể xếp HỎNG-sập (thử trên file mẫu: giữ LẠC). Phiếu A1 "đột biến cố ý sập → phải ra HỎNG": với 2 bộ này chỉ đạt vế "không BẮT", không đạt vế "ra HỎNG"; báo cáo nên nói thẳng thay vì đặt tên "LẠC-sập". — K1.

NGHI NGỜ:
- boc.py:59 `cham` dò SAP trên TOÀN đầu ra nhưng không loại `✗ T\d` như `--xep` :162: đột biến cách `thugl` (P26c `VS-kb-hai-luot`, `BV-cha-kiem-mot-lan`…) nếu làm T5/T6 đỏ thì moTa in dòng thật "Giả lập: SẬP — cha nhận SIGTERM" → bọc chấm HỎNG-sập thay vì BẮT (giấu BẮT). A2 P26c 88 BẮT nên chưa xảy ra; hai hàm cùng định nghĩa mà hai luật.
- 8/10 SỐNG A4 còn lại chưa xem dòng cuối có "105/101 đạt · 0 hỏng" (nhật ký a4 không trong kho); 2 tên chạy lại (`BV-AU3-P26C-DATRA-BO-TRU-SHIP` → "105 đạt · 0 hỏng", `VS-AU3-GOI1-LOAI-KHONG-CONG-DON` → "101 đạt · 0 hỏng") là SỐNG thật.
- bao_cao.md:11 "AUDIT-2 30" và trang_thai:89 "781 tên": 13 A3L c2full được đếm HAI lần (trong 30 của AUDIT-2 và trong 100 của c2luoi) — tổng cộng đúng nội bộ nhưng số "781" phồng 13.
- bao_cao.md 79 dòng (trang_thai:80 ghi 77) — ≤ 200, chỉ lệch chữ.
- `chay_khuon` thoát 0 khi có SỐNG (boc.py:92) — chủ ý đo, đã nêu ở trang_thai:262; giữ.

NGHIỆM THU: 7/9 mục có bằng chứng · mục thiếu: A1 (lỗi 1: đỏ-rồi-sập qua khung = BẮT không dấu, `--xep` mù — chạy thật; lỗi 2: sập mã 0 = SỐNG ở cả hai công cụ — chạy thật; lỗi 7: 2 bộ không ra HỎNG), D2 (bang_chung_do "bài thử sập → HỎNG" chỉ đúng cho dạng có dấu; bb `D2-vo-hai` BẮT trái hợp đồng D2 mà không ghi — lỗi 3). Đủ: A2 (a2_bang 11 bộ, dòng Tổng khớp bảng bao_cao trừ bb — lỗi 3/4, 2 ô trống — lỗi 6), A3 (ca + dòng xác nhận như vòng 1), A4 (bảng 25 tên, 2 SỐNG chạy lại khớp; thiếu chữ ở 7 mục — lỗi 5), A5 (chạy lại thoát 0, 18 bộ, 0 HỎNG ngoài danh sách, 0 tên thừa), A6 (chạy lại CHẶN 14 · LỌT ĐÃ BIẾT 1 · LỌT 0), D1 (79 dòng, đủ cột), D3 (diff ngoài viec/AUDIT-3 rỗng, code thật không đổi từ 744ab60 nên --day-du 67/0 còn giá trị, npm test 63/0 ở b9426a9 và từ đó chỉ trang_thai.md đổi; cây sạch sau mọi lệnh của tôi).

ĐƠN GIẢN (boc.py 193 / ngân sách 60–120): phần có thể bỏ mà vẫn đạt A1/A2: (a) `nap_module` :95–97, `nap_luoi1` :100–107, `goi_main` :110–116, `nap_m2` :119–124, nhánh `--c2luoi` :176–180, `--luoi1` :181–184 ≈ 40 dòng chỉ là "gọi main() của bộ khác với argv khác + lọc git status" — không phải bọc đối chứng; dời sang script nháp chạy A2 (chay_a2.py đã có ngoài kho) hoặc gộp thành MỘT hàm bảng (bộ → file, argv, vá nguồn); (b) `sap()` :127–152 26 dòng → bảng dữ liệu (bộ, cách, cặp vá, mẫu, kỳ vọng) + một vòng chấm ≈ 12 dòng; (c) `doi_chung` :67–70 dò tên bài từ `r.args` có thể bỏ nếu đòi thẳng dòng `(\d+) đạt · 0 hỏng` cho MỌI lần chấm (đồng thời bịt lỗi 2). Ước còn ~140 dòng — vẫn > 120 nếu giữ `--c2luoi`/`--luoi1` trong kho; nói thẳng với chủ quán: ngân sách chỉ đạt khi hai chế độ đó ra ngoài boc.py. Tôi không đề nghị bỏ `--xep` (11 dòng) — nó là cách duy nhất đếm lại khung cũ, chỉ cần ghi rõ giới hạn (lỗi 1).

CHƯA SOÁT ĐƯỢC: không chạy lại `npm test` / `--day-du` (tin trang_thai + diff code rỗng); không chạy bộ đầy đủ A2 (AUDIT-1 988 s, c2luoi 1199 s, bb 742 s, TACH-GL 753 s) nên các số BẮT/SỐNG từng tên chỉ đối chiếu nội bộ với dòng Tổng; không đếm được bao nhiêu BẮT của khung là đỏ-rồi-sập ẩn (nhật ký nháp không trong kho và khung cũng không in dấu); `dot_bien_bb.py --chi D2-vo-hai` không chạy lại (kiểm sạch 3 bản quá 2 phút) — kết luận lỗi 3 suy từ a2_bang.md:146 + thu_gia_lap.js:467; 2 GOC-* LUOI-1 (kho nông); SIGINT (mục 5) không lặp lại; thời gian máy.

BÀI HỌC:
- KHOÁ: (1) boc.py/dot_bien.py: SỐNG chỉ khi có dòng tổng `N đạt · 0 hỏng` với N = DOI_CHUNG (bịt sập mã 0; ca đỏ: sap0.py → phải HỎNG-sập); (2) `--sap` thêm cho KHUNG AUDIT-1 ca đỏ-rồi-sập cách `p26b` (DOSAP_KHUON) và ghi nhận giới hạn: khung in dòng khớp đầu nên `--xep` KHÔNG thể tách dạng này — muốn tách phải chấm lại bằng bọc (đọc cả đầu ra + mã thoát 2) chứ không đọc nhật ký; (3) bang_chung_do: D2 của bb trên HEAD (`D2-vo-hai` BẮT vì thu_gia_lap.js:467 so chữ) phải thành phát hiện AU3-n như AU3-2, và tỷ lệ bb sửa 123/175.
- NGUYÊN TẮC (đề xuất gộp KHUON_LOI): K4 — khi định nghĩa "sập" sống ở HAI nơi (bọc đọc đầu ra vs. khung in một dòng), sửa một nơi phải đặt ca thử ở nơi kia bằng cùng đột biến (DOSAP qua khung); K3 — "công cụ không nói dối" phải dò cả chiều "SỐNG oan" (thoát 0 mà chưa chạy hết), không chỉ "BẮT oan"; K1 — kết quả D2 nào lệch hợp đồng (vô hại → BẮT) là phát hiện, không được rơi vào danh sách BẮT lặng lẽ.
- BỎ: lỗi 4, 5, 6, 7 ở trên và nghi ngờ "781 tên" — sửa chữ/số, không cần khoá.
```

### Sửa sau soát (vòng sửa 2/3)
- Lỗi 1 → `boc.py` `boc_khung(m2)`: bọc `K.chay_lenh` + `K.cham` của khung AUDIT-1 — mỗi lệnh con có thoát 2 / dấu sập (theo dòng, trừ `✗ T\d`) /
  thoát 0 không dòng tổng → kết quả BẮT / SỐNG / LẠC đổi thành HỎNG-sập (chi ghi lệnh nào sập). Áp cho `--c2luoi` và hai chế độ mới `--khung`
  (bảng AUDIT-1 trừ C2F), `--audit2`. A2 khung CHẤM LẠI qua bọc (`chay_vong2.py`: AUDIT-1 88, c2luoi 100, AUDIT-2 30) — `a2_bang.md` sinh lại từ
  log vòng 2; `--sap` thêm `DOSAP-AUDIT2` (p26b, meTra) + `SAP0-AUDIT2` qua khung → phải HỎNG-sập. bb không bọc (công cụ riêng) → CHƯA KIỂM.
- Lỗi 2 → `boc.cham` và `dot_bien.chay1`: SỐNG chỉ khi có dòng tổng (`TONG`: `N đạt · 0 hỏng` / `· ĐẠT` / `Qua hết` / `PASS n` / `✓ XANH`); thêm
  `D2-AU3-sap-0` và `SAP0-<bộ>` (process.exit(0)) → HỎNG / HỎNG-sập (`bang_chung_do.txt` 7). `cham` nay dò dấu sập theo DÒNG, trừ `✗ T\d`
  (nghi ngờ 1 của người soát — hai hàm cùng luật).
- Lỗi 3 → AU3-20 (bb `D2-vo-hai` BẮT trái hợp đồng vì thu_gia_lap.js:467); tỷ lệ bb 123/175; `a2_bang.md` đưa mọi `D2-*` vào bảng kèm lý do.
- Lỗi 4 → A4 10/20. Lỗi 5 → 7 mục ĐÃ SỬA ghi "SO-LUONG-1 chỗ mới chỉ VS-". Lỗi 6 → cột vì sao cho `!D1-E11-P26b`, `C2F-orders-10-insert-quay`.
- Lỗi 7 → `SAP` thêm `Node\.js v\d` (node văng thô khi chay.js hỏng cú pháp) → `--xep` xếp LUOI-1 / TACH-GL `SAP-*` thành HỎNG-sập; nếu không
  (dòng cuối khác) thì ghi thẳng "LẠC không dấu, chỉ đạt vế không BẮT".
- Nghi ngờ "781 tên" → 768 tên (13 A3L đếm hai lần); "77 dòng" → bỏ số cứng.

### Bài học bổ sung sau soát vòng 2 (đầu vào bước 11 — gộp với mục Bài học ở trên)
- Sự cố: (i) khung AUDIT-1 mù "đỏ-rồi-sập" và "sập mã 0" — soát vòng 2 dựng ca thật; (ii) chú thích chèn cuối dòng `return …,` nuốt phần
  sau → tuple 2 phần tử (K7, tự bắt khi chạy lại); (iii) sửa / commit file trong lúc bộ đo chạy → khung in "KHO BẨN" 2 lần, chưa truy được
  nguyên nhân; (iv) tinh luật sập lần hai: dòng `✗ bài chạy thật …` của `kiem_tra` chứa dấu sập của bài con → 5 D1 bị xếp HỎNG-sập oan, phải
  chấm lại; (v) ca "công cụ không nói dối" bản 1 chỉ dò chiều BẮT oan, không dò SỐNG oan (thoát 0 chưa chạy hết).
- **KHOÁ** (trong Phạm vi, đã làm): `boc_khung` (chấm lại khung qua từng lệnh con), SỐNG cần dòng tổng (`TONG`), D2 `sap-0`, `--sap` 4 dạng qua
  cả khung; `co_sap` một luật cho `cham` và `--xep`. Đề xuất ngoài Phạm vi: đưa `boc_khung` vào `viec/AUDIT-1/dot_bien.py` (khung chung) — ca đỏ:
  DOSAP (meTra = 0, cách p26b) phải HỎNG-sập, SAP0 (process.exit(0)) phải HỎNG-sập; `thu_P26b/P26c/GOI1` in ✗ rồi đi tiếp thay vì ném (AU3-6).
- **NGUYÊN TẮC** (đề xuất gộp `KHUON_LOI.md`): K3 — ca "công cụ không nói dối" phải có sức phân biệt (bộ cũ / đối chứng nói dối ở ca đó) và dò CẢ
  hai chiều (BẮT oan, SỐNG oan); K4 — một định nghĩa (sập) sống ở hai nơi thì ca thử phải đặt ở cả hai (bọc và khung); K7 — không sửa / commit
  trong lúc bộ đo đang so ảnh kho.
- **BỎ**: (ii) tuple nuốt bởi chú thích; "781 tên" phồng 13.

### Kiểm lại sau vòng sửa 2 (bước 6)
- `python3 viec/AUDIT-3/kiem_neo.py` → thoát 0; `boc.py --sap` (4 dạng, qua cả khung đã bọc) → ĐẠT; `boc.py --khung / --c2luoi / --audit2` chạy
  lại đủ (bảng A2, `a2_bang.md`); `python3 viec/AUDIT-3/dot_bien.py` 5 D2 → HỎNG · BẮT · SỐNG · HỎNG · HỎNG (sập mã 0).
- `npm test` → thoát 0 · ĐẾM PASS 63 · FAIL 0 · CẢNH BÁO 0 (HEAD 4f8e1f1, mọi commit từ a13d8ad chỉ đổi `viec/AUDIT-3/`; `--day-du` 67/0 ở
  744ab60 vẫn áp vì code chạy thật không đổi — `git diff --stat 744ab60 HEAD -- ':!viec/AUDIT-3/'` rỗng). `git status` sạch.

HEAD ĐÃ KIỂM: 4f8e1f1

## Bước 8 · soát độc lập vòng 3 (`/ra-soat`, agent general-purpose mới, HEAD ea0b90f) — chép nguyên
```
KHÔNG ĐẠT

(Soát vòng 3 nhánh viec/AUDIT-3, HEAD ea0b90f, mốc a13d8ad. Xác nhận: `git diff --stat a13d8ad^ HEAD -- ':!viec/AUDIT-3/'` RỖNG; `git diff --stat 744ab60 HEAD -- ':!viec/AUDIT-3/'` và `4f8e1f1 HEAD -- ':!viec/AUDIT-3/'` rỗng (code chạy thật không đổi từ HEAD --day-du 67/0 và npm test 63/0). `git status --short` RỖNG trước và sau MỌI lệnh. Đã chạy tuần tự: `boc.py --xep` trên file nháp ngoài kho; `kiem_neo.py` ×2 (thoát 0, 18 bộ, 0 HỎNG ngoài danh sách, 0 tên thừa); `dot_bien.py D2-AU3-sap-0 D2-AU3-vo-hai` (HỎNG sập mã 0 · SỐNG — khớp bang_chung mục 7); `node viec/AUDIT-2/lach.js` (CHẶN 14 · LỌT ĐÃ BIẾT 1 · LỌT 0); `boc.py --audit2 D2K -j 3` (kiểm sạch kb10 qua bọc XANH, HỎNG 2 · SỐNG 1, "✓ kho thật không đổi" — KHÔNG có KHO BẨN khi chạy yên); 4 script nháp NGOÀI kho nạp boc.py/dot_bien.py làm module (/tmp/claude-0/-home-user-pos-tuquyduong/7e7af215-2d4b-5d78-b3f7-7b7110d21339/scratchpad/soat3_vangtho.py, soat3_vangtho2.py, soat3_vangtho3.py, soat3_sap1.py). Không sửa file nào trong kho.)

1. BẢY LỖI VÒNG 2 ĐÃ SỬA ĐÚNG CHƯA (diff 68274ad..HEAD -- viec/AUDIT-3/):
- (1) boc_khung — ĐÚNG về cơ chế: boc.py:130–143 thay `K.chay_lenh`/`K.cham`; khung gọi hai tên này qua biến toàn cục (viec/AUDIT-1/dot_bien.py:316 trong `cham`, :340 trong `kiem_sach`, :393/:397 trong `main`) nên bắt đủ mọi lệnh con kể cả kiểm sạch; `tl.sap` reset ở :139 đầu mỗi `cham`, thread-local nên -j an toàn; thoát 3 chay.js không tính sập (đúng chủ ý). NHƯNG luật "sập = harness chết; `✗ bài chạy thật` của kiem_tra = BẮT" là ĐỊNH NGHĨA MỚI do agent tự đặt, trái chữ phiếu ("đột biến làm BÀI THỬ sập = HỎNG") và KHÔNG nhất quán với AU3-6 — xem LỖI 2. Bài con sập mà kiem_tra thoát 0 thì không thể xảy ra (kiem_tra_truoc_khi_giao.js:481–485 `xanh = r.status === 0 && !r.error`, sập → ✗ → thoát 1).
- (2) SỐNG cần dòng tổng — `TONG` boc.py:25 khớp mọi bài trong khung: thu_P20.js:322, thu_P21.js:181, thu_P26a.js:135, thu_P26b.js:444, thu_P26c.js:822, thu_GOI1.js:810, thu_gia_lap.js:53 ("N đạt · M hỏng"), chay.js:138/:300 ("· ĐẠT"), kiem_tra:801/:810 ("PASS n"/"Qua hết"), thu_nguoi_gac.js:1138 và thu_cong.js:707 ("✓ XANH"); `congcu` không dùng trong bảng. `--audit2 D2K` kiểm sạch kb10 xanh qua bọc. ✓. NHƯNG chỉ sửa NỬA — BẮT không đòi dòng tổng (LỖI 1).
- (3) ✓ AU3-20 bao_cao.md:41; bb 123/175 bao_cao.md:61 (đếm máy a2_bang: danh sách BẮT 125 gồm `D2-da-biet`, `D2-vo-hai` ở vị trí 124–125 → 123 đúng).
- (4) ✓ A4 10/20 bao_cao.md:66 (26 tên = 21 + 5 D2; 10 BẮT / (21 − 1 sập) đúng).
- (5) ✓ trang_thai.md:159 "SO-LUONG-1 chỗ mới chỉ VS-".
- (6) ✓ a2_bang.md:30 (`C2F-orders-10`) và :37 (`wallets-05`) có cột vì sao.
- (7) ✓ `Node\.js v\d` vào SAP (boc.py:24); thử `--xep` file nháp: dòng `✓ LẠC (mong LẠC) SAP-LUOI-1 … Node.js v22.22.0 · thiếu mẫu` → HỎNG-sập.

LỖI TÌM ĐƯỢC:
1. viec/AUDIT-3/boc.py:69–71 và viec/AUDIT-3/dot_bien.py:92–98 — "SẬP MÃ 1 KHÔNG DẤU" → CẢ HAI công cụ chấm BẮT. CHẠY THẬT (soat3_sap1.py): đột biến `D2-AU3-da-biet` (✗ S1a–c thật) + `process.exit(1);` chèn sau `if (membership_buy && membership_buy.tier_id && !normalizePhone(customer_phone)) {` (orders.js, nhánh S4c chạy SAU S1) → thu_P26c in 7 ✗, chết thoát 1 KHÔNG "✖ Bài thử sập", KHÔNG "Node.js v", KHÔNG dòng tổng → dot_bien.py chay1: `BẮT · ✗ S1a …`; boc.py cham: `BẮT · ✗ S1a …`. Vì dòng tổng chỉ bị đòi khi `returncode == 0` (boc.py:70, dot_bien.py:96–97); đường BẮT (dot_bien.py:95 trước :96; boc.py:71) không đòi. Phiếu: sập (mã thoát lạ) = HỎNG, KHÔNG BẮT. Cùng khuôn với "sập mã 0" vòng 2 nhưng ở chiều BẮT oan — K4 (sửa một chiều) + K3.
2. viec/AUDIT-3/dot_bien.py:92 chỉ dò `'Bài thử sập'` — VĂNG THÔ (ném ngoài vòng request) sau một ✗ → A4 chấm BẮT. CHẠY THẬT (soat3_vangtho3.py): da-biet + `process.nextTick(() => { throw new Error(…) })` ở cùng neo → thu_P26c thoát 1, in stack + `Node.js v22.22.0`, không dòng tổng → dot_bien.py: `BẮT · ✗ S1a …`; boc.py cham: `HỎNG-sập · Node.js v22.22.0 · thoát 1` (đúng). Dấu `Node\.js v\d` (sửa lỗi 7 vòng 2) chỉ vào boc.py:24, không vào dot_bien.py — K4. (trang_thai.md:302 ghi ca này là CHƯA KIỂM "ở mọi công cụ" — nay là lỗi thật ở công cụ A4.)
3. viec/AUDIT-3/boc.py:57 (`co_sap` loại `✗ bài chạy thật`) + bao_cao.md:16 ("Sập = HARNESS chết") + :56 ("82/84 — y AUDIT-2") + a2_bang.md:20 (`!D1-E11-P26b` trong BẮT) ↔ a2_bang.md:37 (`C2F-wallets-05-ghiVi-quay` HỎNG-sập) + bang_chung_do.txt:122–123 — MỘT hành vi (thu_P26b in ✗ rồi `✖ Bài thử sập`) được dán HAI nhãn tuỳ vỏ bọc: qua `c2luoi`/`p26b` = HỎNG-sập (AU3-6, wallets-05, DOSAP-AUDIT2), qua `kiem` = BẮT. Với 4 D1-E* (`D1-E1-unitprice`, `D1-E8-backup`, `D1-E2-authz-tho`, `D1-E1b-tra-gia`) BẮT là đúng vì mẫu khớp PHÉP TĨNH riêng (viec/AUDIT-1 DOT_BIEN: mẫu `✗ orders.js KHÔNG tính tiền theo item.unit_price` …); riêng `!D1-E11-P26b` mẫu là `✗ bài chạy thật cong_cu/thu_P26b.js` — chính dòng kiem_tra báo bài con sập (kiem_tra:483 ghép mọi dòng ✗/✖ của bài con vào) → đây là "đỏ-rồi-sập" đúng định nghĩa AU3-6, phải HỎNG-sập; đúng ra AUDIT-1 = 81/83 như sau vòng sửa 1. Luật "harness chết" KHÔNG có trong phiếu, agent tự chốt thay chủ quán (CLAUDE.md mục 9: chưa chốt → hỏi). — K1 + K4 (loại trừ viết quá rộng: đúng cho 4, sai cho 1).
4. viec/AUDIT-3/boc.py:191 (`xep`) ↔ :57 (`co_sap`) — HAI luật sập: `xep` có regex riêng chỉ loại `✗ T\d`, KHÔNG loại `✗ bài chạy thật`, không gọi `co_sap`. CHẠY THẬT `--xep` file nháp: dòng `BẮT D1 !D1-E11-P26b … ✗ bài chạy thật … ✖ Bài thử sập` → `--xep` xếp HỎNG-sập, trong khi `boc_khung` giữ BẮT. trang_thai.md:317 "`co_sap` một luật cho `cham` và `--xep`" là SAI. — K4 + K1.
5. viec/AUDIT-3/boc.py:39–40 (`Vo.run` không đặt TMPDIR) và dot_bien.py:79–81 (`chay_bai` không đặt TMPDIR) ↔ khung AUDIT-1 có `moi_truong` (viec/AUDIT-1/dot_bien.py:285–290 TMPDIR = tam/tmp) — bài chết (process.exit trong route, văng thô) không chạy `fs.rmSync(THU_MUC)` (thu_P26c.js:823/:831) → /tmp còn `thu_p26c_*/kho.db` (360 KB). Thấy thật: /tmp có `thu_p26c_{gvO2F8 12:10:48, UvNDjR 12:10:49, YKTlV9 12:18:27, AauWKW 12:19:27}`, `thu_p26b_Q70f8g 12:19:18`, `thu_goi1_{BxlshX 12:19:32, pKrd8L 12:19:37}` + 4 `thu_goi1_*` 08:45 — khớp giờ các lần chạy D2 sập mã 0 / `--sap` vòng 2 của agent (bang_chung mục 2, 7). bao_cao.md:81 "0 thư mục tạm sót" và bang_chung_do.txt:92 chỉ soi `/tmp/goi1_db_*`. Phiếu D3 "(thư mục tạm xoá kể cả khi bị ngắt)" không đạt vế này. — K3 (phép kiểm soi sai prefix) · NHẸ. (Các ca sập của tôi cũng để lại 6 `thu_p26c_*` 13:29–13:3x + `/tmp/audit1_7q51vrw7` 13:23 — người gác chặn `rm` ngoài thư mục nháp nên tôi KHÔNG xoá được; chủ quán dọn.)
6. viec/AUDIT-3/boc.py:168 `_, ra = goi_main(m2.K.main, …)` bỏ mã thoát của khung → `--sap` in "ĐẠT" dù khung trả 3: bang_chung_do.txt:61 "✗ KHO BẨN" nằm giữa khối bằng chứng mục 2 được kết luận ĐẠT (:74). Kết luận của công cụ bỏ qua một tín hiệu đỏ — K3 · NHẸ (chạy yên `--audit2 D2K` không KHO BẨN → giả thuyết "commit song song" của agent hợp lý nhưng vẫn CHƯA KIỂM).
7. Số liệu (K1, NHẸ): bao_cao.md:67 "1.067 neo khớp / 1.105 mục có neo" — cộng máy từ đầu ra `kiem_neo.py` 18 dòng "neo khớp a/b" = 881/917, không ra được 1.067/1.105 từ bất kỳ cách cộng nào (cộng "N đột biến" = 932); trang_thai.md:60 "AUDIT-3 24/25" đã cũ (nay 26 tên, 25/26 sau khi thêm `D2-AU3-sap-0`).

(Đã kiểm và KHÔNG thấy lỗi: đếm máy a2_bang.md 11 mục khớp dòng Tổng và bảng bao_cao:56–65 — AUDIT-1 82/84 (theo luật hiện hành), C2F 59/81 (87 − 6 sập; 67 BẮT c2luoi = 59 + 8 A3L), A3L 15/18, AUDIT-2 30, bb 125 gồm 2 D2 → 123/175, P26b 48/50, P26c 88/88, GOI-1 40/40, TACH-GL 25/26, A4 26 = 11 BẮT + 11 SỐNG + 1 HỎNG + 3 sập; a2_bang bb "Tổng 179" nhất quán (2 dòng D2 trong bảng là chú giải trùng tên với danh sách BẮT). A3: ca thu_P26c.js:199 A2a, :210 A2d, :324 A6a, :326 A6b đúng. `k()` của thu_gia_lap.js:48 chỉ in moTa khi ✗ → dòng ✓ T không chứa "Giả lập: SẬP"; `--chi-du-lieu-tay` (thu_gia_lap.js:183) chỉ chạy I2 + LUOI-1 nên dòng ghép ' | ' của bb không có `✗ T\d` trên thực tế. kiem_neo.py:176 thoát 1 khi `thua` ✓; chạy lại không sót `audit1_*` (thư mục 13:23 là của script đếm nhóm của tôi).)

NGHI NGỜ:
- boc.py:70 / dot_bien.py:96 chỉ đòi CÓ dòng tổng, không đòi N = DOI_CHUNG (KHOÁ (1) vòng 2 ghi "với N = DOI_CHUNG", trang_thai.md:265 cài thành "có dòng tổng"): nháp giả đầu ra `3 đạt · 0 hỏng` thoát 0 → `cham` trả SỐNG. Chưa dựng được đột biến THẬT làm thu_P26c bỏ bớt ca mà vẫn thoát 0 (thu_P26c không tự kiểm số ca — chỉ `process.exit(hong ? 1 : 0)` :824) → giữ ở NGHI NGỜ.
- 10 BẮT của A4 và 88 BẮT P26c qua bọc chưa được xác nhận "có dòng tổng" (nhật ký nháp không trong kho) — sau LỖI 1 mọi BẮT thoát 1 không tổng đều đáng ngờ về nguyên tắc, dù các đột biến VS-/BV- ở tienDaTra/goiKhach khó gây exit giữa chừng.
- bb (dot_bien_bb.py) vẫn không qua bọc → đỏ-rồi-sập / sập mã 0 / sập mã 1 ẩn trong 125 BẮT CHƯA KIỂM (agent đã ghi).
- Nháp soat3_vangtho.py (setTimeout 0) thoát 1 không "Node.js v", không rõ vì sao bài không dọn thư mục — không dùng làm bằng chứng; ca nextTick (soat3_vangtho3.py) là bằng chứng.

NGHIỆM THU: 6/9 mục có bằng chứng · mục thiếu: A1 (lỗi 1, 2 — vẫn có dạng sập ra BẮT ở cả hai công cụ; lỗi 3/4 — định nghĩa sập hai luật, tự đặt thay phiếu), D2 (bang_chung "bài thử sập → HỎNG" chỉ đúng cho sập có dấu hoặc thoát 0/2; sập mã 1 và văng thô ở A4 → BẮT), D3 (vế "thư mục tạm xoá" — lỗi 5; phần git status / diff ngoài viec/AUDIT-3 ĐẠT, npm test 63/0 + --day-du 67/0 tin theo trang_thai vì diff code rỗng). Đủ: A2 (số liệu đếm máy khớp; chỉ 82/84 ↔ 81/83 phụ thuộc lỗi 3), A3, A4 (25+1 tên, đối chứng, SỐNG tiền = NẶNG liệt kê đủ; công cụ có lỗi 1–2 nhưng chưa thấy ảnh hưởng tới 10 SỐNG), A5 (chạy lại thoát 0), A6 (chạy lại khớp), D1 (82 dòng, đủ cột; số :67 sai — lỗi 7).

ĐƠN GIẢN (boc.py 224 / ngân sách 60–120): nói thẳng — ngân sách KHÔNG đạt với phạm vi hiện tại vì soát vòng 2 đòi thêm bọc khung + chấm lại A2 (`boc_khung`, `--khung/--audit2/--c2luoi`, ~55 dòng). Bỏ được mà vẫn đạt nghiệm thu: docstring 17 → ~6 dòng; `sap()` :155–181 thành bảng dữ liệu (bộ, cách, cặp vá, kỳ vọng) + một vòng chấm (−10); `nap_luoi1` + nhánh `--luoi1` (:111–118, :212–215, −12) sang script nháp A2 vì LUOI-1 không phải bộ khuôn và kết quả đã ghi; `doi_chung` dò tên bài từ `r.args` (:78–79) thay bằng bảng cách → bài (−3). Còn ~170–180 dòng; muốn ≤ 120 phải đưa `boc_khung` vào `viec/AUDIT-1/dot_bien.py` (ngoài Phạm vi, agent đã đề xuất). Quan trọng hơn giảm dòng: gom MỘT hàm `sap_cua(ma, ra)` trả HỎNG-sập cho `cham`, `boc_khung` và `xep` (bịt lỗi 1, 4 cùng lúc, −8 dòng).

CHƯA SOÁT ĐƯỢC: không chạy lại `npm test` / `--day-du` (tin trang_thai + diff code rỗng); không chạy đủ A2 (AUDIT-1, c2luoi, bb, TACH-GL, P26b, P26c — hàng chục phút) nên từng tên chỉ đối chiếu nội bộ; không đếm được bao nhiêu BẮT hiện có là "sập mã 1 không tổng" (nhật ký nháp không trong kho, khung không in dòng tổng); 2 GOC-* LUOI-1 (kho nông); KHO BẨN chỉ kiểm chiều "chạy yên thì sạch"; SIGINT (bang_chung mục 5) không lặp; thời gian máy.

BÀI HỌC:
- KHOÁ: (1) boc.py `cham` + `boc_khung.chay_lenh` + dot_bien.py `chay1`: MỌI kết quả (BẮT lẫn SỐNG) đòi dòng tổng khớp DOI_CHUNG (N đạt · M hỏng, hoặc `· ĐẠT`/`Qua hết`/`✓ XANH`); thiếu = HỎNG-sập — ca đỏ: soat3_sap1.py phải HỎNG-sập ở cả hai, soat3_vangtho3.py phải HỎNG ở dot_bien.py; dot_bien.py:92 dò bằng `SAP` của boc.py (kể cả `Node\.js v\d`). (2) MỘT hàm sập dùng chung cho `cham`/`boc_khung`/`xep`; BẮT → HỎNG-sập khi dòng khớp mang dấu sập HOẶC lệnh sinh dòng đó chết (thoát 2 / dấu / không tổng) — `!D1-E11-P26b` thành HỎNG-sập (81/83) HOẶC hỏi chủ quán chốt luật "harness chết" rồi ghi vào phiếu AUDIT-4, không tự quyết. (3) `Vo.run` và `chay_bai` đặt TMPDIR = thư mục tạm của công cụ (như `moi_truong` AUDIT-1) — ca đỏ: `SAP0-P26c` chạy xong không còn `/tmp/thu_p26c_*`; D3 soi thêm `os.tmpdir()`.
- NGUYÊN TẮC (đề xuất gộp KHUON_LOI): K3 — "công cụ không nói dối" phải phủ sập KHÔNG DẤU (thoát ≠ 0 mà không dòng tổng), không chỉ sập có dấu/thoát 0/thoát 2; K4 — thêm một dấu sập hay một luật thì grep MỌI công cụ cùng việc (boc.py / dot_bien.py / xep) chứ không chỉ file vừa sửa; K1 — định nghĩa trong phiếu (bài thử sập = HỎNG) không được tái định nghĩa trong báo cáo; chỗ phiếu chưa rõ (harness ↔ bài con) là câu hỏi cho chủ quán.
- BỎ: lỗi 6, 7 (sửa chữ/số); dòng ghép ' | ' có `✗ T\d` (không xảy ra với `--chi-du-lieu-tay`).
```

### Sửa sau soát (vòng sửa 3/3)
- Lỗi 1 + 2 + 4 → `boc.py` MỘT hàm `sap_cua(ma, ra, chi)` cho `cham` và `boc_khung` (chay_lenh + cham), `--xep` ghi rõ là vế (4) của cùng luật, cận
  dưới: (1) dấu sập theo dòng (`SAP`, trừ `✗ T\d` / `✗ bài chạy thật` ở vế này) · (2) thoát 2 · (3) KHÔNG có dòng "chạy hết" (`HET`: `N đạt · M hỏng`,
  `· ĐẠT` / `· KHÔNG ĐẠT`, `Qua hết` / `CÓ LỖI`, `PASS n`, `✓ XANH` / `ĐỎ — n chỗ hỏng`) — áp cho MỌI kết quả, BẮT lẫn SỐNG · (4) dòng khớp mang dấu
  sập (trừ `✗ T\d`). `dot_bien.py` cùng luật: `SAP` (kể cả `Node\.js v\d`) + `HET` + thoát 2 → HỎNG trước khi xét BẮT. Ca đỏ của người soát
  (`soat3_sap1.py`, `soat3_vangtho3.py`, nháp) → HỎNG-sập / HỎNG ở cả hai (`bang_chung_do.txt` 9).
- Lỗi 3 → luật "harness chết" bỏ; `!D1-E11-P26b` HỎNG-sập (vế 4), AUDIT-1 81/83; 4 `D1-E*` khớp phép tĩnh riêng giữ BẮT. Chốt hẳn → mục Câu hỏi.
- Lỗi 5 → `Vo.run` đặt `TMPDIR` = `TAM` (mkdtemp, xoá ở atexit); `chay_bai` đặt `TMPDIR` = thư mục tạm của đột biến. Vòng 3 chạy đủ: 0 thư mục mới.
- Lỗi 6 → `--sap` nhận mã thoát của khung; ≠ 0 → xấu. Lỗi 7 → A5 881/917 (bao_cao.md), AUDIT-3 25/26 (A5 ở trên).
- Lỗi TỰ GÂY khi áp (K7): vế (4) gọi `sap_cua(1, 'ĐẠT', chi)` nhưng `'ĐẠT'` không khớp `HET` → mọi kết quả khung thành HỎNG-sập; `--audit2 D2K` DỪNG
  ở kiểm sạch → sửa `ra=None` (chỉ soi vế 4); `sap_cua` thử 14 dạng đầu ra → 14/14.
- Chạy lại TUẦN TỰ sau khi commit công cụ (`chay_vong3.py`, HEAD 9de6829, 3.682 s, không sửa / commit trong lúc chạy): `--sap` ĐẠT (khung thoát 0) ·
  A4 11/11/4 · P26b 48/1/9/0/1 · P26c 88/0/4/1 · GOI-1 40/9 · GOI-2 59 · khung AUDIT-1 81 BẮT · HỎNG-sập 2 (`G3-sap`, `!D1-E11-P26b`) · LẠC 2 ·
  c2luoi 67/25/6 sập/2 (y vòng 2 từng tên) · AUDIT-2 18/7/4/1 (y vòng 2 từng tên) · `npm test` 63/0; `git status` 0 dòng sau mỗi bước; KHÔNG "KHO BẨN".
  `a2_bang.md` sinh lại từ log vòng 3 (bb · SO-LUONG-1 · LUOI-1 · TACH-GL không qua luật mới → giữ log vòng 2).

### Câu hỏi cho chủ quán (chờ chốt — không tự quyết, CLAUDE.md mục 9)
1. **Luật sập khi BỘ KIỂM chạy hết nhưng BÁO bài con sập** (`kiem_tra_truoc_khi_giao.js` in `✗ bài chạy thật … → ✖ Bài thử sập`): phiếu chỉ nói
   "đột biến làm bài thử sập = HỎNG". Vòng 2 tôi tự áp "harness chết mới là sập" (→ BẮT), người soát vòng 3 bác. Nay áp HỎNG-sập (dòng khớp mang
   dấu sập). Đề nghị chốt vào phiếu AUDIT-4 một trong hai: (a) HỎNG-sập như hiện tại (81/83) · (b) BẮT khi bộ kiểm chạy hết (82/84).
2. **18 thư mục tạm sót ở `/tmp`** từ các lần chạy sập TRƯỚC vòng 3 (`thu_p26c_*` ×10, `thu_goi1_*` ×6, `thu_p26b_Q70f8g`, `audit1_7q51vrw7`, mỗi
   cái ~360 KB `kho.db`): người gác chặn `rm` ngoài thư mục nháp nên tôi không xoá được — chủ quán dọn bằng `rm -rf /tmp/thu_p26c_* /tmp/thu_goi1_*
   /tmp/thu_p26b_* /tmp/audit1_*` khi không có bộ đo nào chạy.

### Bài học bổ sung sau soát vòng 3
- Sự cố: (i) sửa luật sập NỬA chiều lần hai — vòng 2 đòi dòng tổng chỉ khi thoát 0, để sập mã 1 không dấu thành BẮT (K4 cùng khuôn với vòng 2);
  (ii) thêm dấu `Node\.js v\d` vào boc.py mà quên dot_bien.py (K4); (iii) tự đặt định nghĩa thay phiếu (K1) — chỗ chưa chốt phải là Câu hỏi;
  (iv) `--xep` và `co_sap` hai luật (K4); (v) phép "0 thư mục sót" soi sai tiền tố (K3); (vi) `--sap` bỏ mã thoát khung (K3); (vii) tự gây: sentinel
  `'ĐẠT'` không khớp `HET` — đối chứng của công cụ bắt ngay (K7, bằng chứng mục 9).
- **KHOÁ** (đã làm, trong Phạm vi): `sap_cua` một hàm · `HET` cho mọi kết quả · `SAP` chung hai công cụ · TMPDIR · mã thoát khung · ca đỏ của người
  soát chạy lại trên HEAD. Đề xuất AUDIT-4: đưa `sap_cua` + ca 14 dạng đầu ra vào khung chung `viec/AUDIT-1/dot_bien.py` (ngoài Phạm vi).
- **NGUYÊN TẮC** (đề xuất gộp `KHUON_LOI.md`): K3 — phép "công cụ không nói dối" phải phủ sập KHÔNG DẤU (thoát ≠ 0 mà không dòng chạy hết);
  K4 — thêm một dấu / một luật thì grep MỌI công cụ cùng việc; K1 — định nghĩa trong phiếu không được tái định nghĩa trong báo cáo.
- **BỎ**: lỗi 6, 7 (chữ / số); số 19 thoáng qua khi đếm thư mục tạm ngay lúc tiến trình thoát (CHƯA KIỂM nguyên nhân, không ảnh hưởng kết quả).

### Kiểm lại sau vòng sửa 3 (bước 6)
- `python3 viec/AUDIT-3/dot_bien.py` 5 D2 → HỎNG · BẮT · SỐNG · HỎNG · HỎNG; `boc.py GOI-1 BV-GOI1-TONG` → BẮT; `boc.py --audit2 D2K` → HỎNG 2 · SỐNG 1;
  `soat3_sap1.py` → HỎNG (A4) / HỎNG-sập (boc); `soat3_vangtho3.py` → HỎNG / HỎNG-sập. Chạy đủ 10 bước `chay_vong3.py` (số ở "Sửa sau soát").
- `npm test` → thoát 0 · ĐẾM PASS 63 · FAIL 0 · CẢNH BÁO 0 (HEAD 9de6829 = HEAD của mọi lần đo vòng 3; mọi commit từ a13d8ad chỉ đổi `viec/AUDIT-3/`;
  `--day-du` 67/0 ở 744ab60 vẫn áp vì code chạy thật không đổi — `git diff --stat 744ab60 HEAD -- ':!viec/AUDIT-3/'` rỗng). `git status` sạch.

HEAD ĐÃ KIỂM: 9de6829
