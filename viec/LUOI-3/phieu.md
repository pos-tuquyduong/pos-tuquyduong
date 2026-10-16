# LUOI-3 — Vá lưới: bắt 10 đột biến NẶNG-lưới của AUDIT-3 (AU3-8…17) — chỉ thêm bài thử, không sửa code quầy

<!-- Phiếu do chat soạn 16.10.2026. Nền: main sau sổ việc v33 (cha 024dab9 = Merge PR #24 TU-CHAY-6; AUDIT-3 PR #23, BAN-HANG-1 PR #22
     đã gộp). Nguồn ĐỌC NGUYÊN VĂN: viec/AUDIT-3/bao_cao.md bảng AU3-8…AU3-17 (cột "ca đỏ đề xuất" là gợi ý, máy kiểm lại trên
     code HEAD), viec/AUDIT-3/dot_bien.py (10 đột biến SỐNG + đối chứng, chạy được từng tên), viec/LUOI-2/ (khuôn việc vá lưới).
     P20b chạy SONG SONG (orders.js, signup-codes.js, thu_P20.js) — KHÔNG chung file. AUDIT-4 chạy SAU khi LUOI-3 gộp. -->

**Chờ duyệt kế hoạch:** viết `viec/LUOI-3/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Lưới bắt được 10 lỗi tiền / gói / báo cáo mà hiện nay code đang ĐÚNG nhưng nếu hỏng thì không bài thử nào kêu — điều kiện để
AUDIT-4 đạt điểm dừng. Chỉ thêm ca / bất biến; KHÔNG sửa logic quầy. Lộ code đang SAI → DỪNG, ghi `## Câu hỏi`.

## Nghiệm thu
Mỗi đột biến dưới (tên đúng trong `viec/AUDIT-3/dot_bien.py`): SỐNG trên HEAD trước việc này (in bằng chứng) → BẮT sau, đỏ ĐÚNG
ca của nó (so câu lỗi, không phải sập, không phải ca khác chặn hộ). Ưu tiên ca trong `cong_cu/thu_P26c.js` / `thu_GOI1.js`.
- N1 AU3-8 `BV-AU3-P26C-DATRA-BO-TRU-SHIP`: đơn có `shipping_fee` — đền trần = tổng hàng (không gồm ship); huỷ → hoàn cả ship.
- N2 AU3-9 `VS-AU3-P26C-DATRA-GIA-GOC`: đơn 2 dòng (1 flash + 1 thường) — trần đền từng dòng theo giá ĐÃ TRẢ của dòng đó.
- N3 AU3-10 `VS-AU3-P26C-DEN-GIAM-BO-FLASH`: đơn flash + mã giảm 1 món — đền đúng số đã trả (không chặn oan).
- N4 AU3-11 `VS-AU3-GOI1-LOAI-KHONG-CONG-DON`: 2 dòng CÙNG loại từ gói vượt trần loại → 400, gói không đổi.
- N5 AU3-12 `VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN`: gói cũ có loại cài SL 0 → vẫn lấy được loại đó.
- N6 AU3-13 `BV-AU3-GOI2-BO-TRAN-DA-NHAN`: đền món lẻ rồi "Kết thúc gói" → hoàn ≤ total − đã nhận.
- N7 AU3-14 `VS-AU3-GOI2-NHAN-BO-DEN`: cùng ca N6 (đã nhận gồm `compensation`).
- N8 AU3-15 `VS-AU3-SL-DONG-GOI-SL-1`: mua 2 gói một dòng rồi huỷ / kết thúc → hoàn đúng 1 lần, không gấp N.
- N9 AU3-16 `VS-AU3-SL-DONG-GOI-TONG-1`: bất biến `SUM(total_price)` dòng = `subtotal` đơn (báo cáo doanh thu đủ N gói) — thêm vào
  `cong_cu/gia_lap/bat_bien.js` chỉ nếu một bất biến bắt được cả N8/N10; không thì ca trong `thu_P26c.js`.
- N10 AU3-17 `VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL`: cùng ca N8 (huỷ đơn 2 gói đã lấy một phần → hoàn đúng phần chưa dùng).
- N0 Trước khi viết ca: chạy lại 10 tên trên HEAD, kèm đối chứng (`viec/AUDIT-3/boc.py` nếu cần); neo rữa → ghi `## Câu hỏi`,
  KHÔNG sửa `viec/AUDIT-3/`. Ghi trước / sau vào `trang_thai.md` (bảng 10 dòng: tên · SỐNG trước · BẮT sau · ca đỏ · câu lỗi).
- N11 Đột biến cũ đang BẮT vẫn BẮT (`viec/P26c`, `viec/GOI-1`, `viec/GOI-2`, `viec/SO-LUONG-1`, `viec/BAN-HANG-1`, `viec/LUOI-2`
  dot_bien.py — kể cả các "không áp được" đã biết, không tăng); thêm bất biến → sửa cả `DONG_DAT` / `NGUONG_*` (chỉ tăng). `npm test`,
  `--day-du` xanh; mỗi bài < 80 % hạn (đo riêng 3 lần, ghi số).

## Bài thử đỏ
không — LUOI-3 chỉ thêm ca hồi quy cho code ĐANG ĐÚNG (0 dòng code quầy); đỏ chứng minh bằng 10 đột biến AUDIT-3 (bang_chung_do.txt)

## Bài thử cũ sửa
- cong_cu/thu_P26c.js — LUOI-3 chỉ thêm ca hồi quy cho code ĐANG ĐÚNG nên xanh trên gốc; đỏ chứng minh bằng đột biến AU3-8…10, 13…17
- cong_cu/thu_GOI1.js — LUOI-3 chỉ thêm ca hồi quy cho code ĐANG ĐÚNG nên xanh trên gốc; đỏ chứng minh bằng đột biến AU3-11, 12

## Phạm vi
- viec/LUOI-3/**
- cong_cu/thu_P26c.js
- cong_cu/thu_GOI1.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/thu_gia_lap.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~150–250 dòng thử; 0 dòng code quầy. Kế hoạch ước lượng thời gian máy (đo, không đoán).
**Phương án đơn giản nhất đã xét:** mỗi đột biến một ca nhỏ nhất bắt được nó, gom ca chung khi cùng gốc (N6+N7, N8+N10); không thêm
file bài thử mới; bất biến chỉ khi bắt được ≥ 2 đột biến; không sửa `viec/AUDIT-3/`.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- KHÔNG sửa `server/`, `client/` — lộ code đang SAI thì DỪNG, ghi `## Câu hỏi`.
- KHÔNG sửa `cong_cu/thu_P20.js`, `server/routes/signup-codes.js` (P20b đang chạy song song), `viec/AUDIT-3/**`, `.claude/`,
  `.github/`, `tu_chay/`, `CLAUDE.md`, sổ việc.
- Không nới hạn (120 s bộ kiểm, 110 s giả lập con, 180 s mỗi lượt), không hạ ngưỡng, không bớt ca / bất biến / `c.mong`; bánh cóc chỉ tăng.
- Chỉ push đúng `git push -u origin viec/LUOI-3`. Không đụng `main`, không merge, không tạo PR.
