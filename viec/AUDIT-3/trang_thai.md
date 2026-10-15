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
