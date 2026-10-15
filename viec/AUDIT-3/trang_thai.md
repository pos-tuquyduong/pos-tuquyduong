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
