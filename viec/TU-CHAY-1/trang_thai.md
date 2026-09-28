# TU-CHAY-1 — trạng thái

**Bước hiện tại:** 6 — soát độc lập xong (KHÔNG ĐẠT, 4 điểm, đã xử lý như dưới), commit C3.
**Vòng sửa:** 2.

## Đã làm
- C1 `b8afffd`: phiếu + kế hoạch.
- C2 `d1d1b61`: bài phá thử viết TRƯỚC, kèm bằng chứng ĐỎ trên người gác rỗng và trình cài rỗng
  (`bang_chung_do.txt`: 0/400 ca đúng, 426 chỗ hỏng).
- **Sau C2 có sửa một ca thử:** `tar server` → `tar -v server`. Chữ `server` bị hiểu
  là chùm cờ kiểu cũ của tar (s e r v e r), có `r` = chế độ append, nên ca đó không
  thử được ý "không rõ chế độ". Đã sửa trước khi viết xong người gác.
- Người gác xanh 406/406 ca. Tắt từng mã trong 65 luật đều làm bài đỏ
  (con số đếm bằng `require('./tu_chay/nguoi_gac.js').LUAT.length`; bản trước ghi nhầm 62).
  Các phép chạy tiến trình thật đều đạt:
  - stdin treo → chặn trong < 3 s;
  - stdin > 20 MB → chặn;
  - nhật ký ghi đúng và xoay vòng ở 1 MB;
  - không ghi được nhật ký → chặn, lý do nói rõ;
  - `node … || exit 2` với người gác lỗi cú pháp → mã 2.
- Trình cài xanh (kho tạm + remote bare tạm). **Phá thử tay 5 cách, cả 5 đều làm bài ĐỎ:**
  - bỏ chặn CLAUDECODE;
  - giữ ask;
  - đè pre-push;
  - nhân đôi hook;
  - pre-push rỗng.
- `kiem_tra_truoc_khi_giao.js`: thêm nhóm T.
  - T1 chạy thật `tu_chay/thu_nguoi_gac.js` (3,6 s).
  - T2 so byte `.claude/tu_chay/` với `tu_chay/`. Cả hai nhánh (khớp / lệch + file thừa) đã thử trên bản sao trong nháp.
  - `npm test` và `--day-du`: 51 đạt · 0 hỏng · 0 cảnh báo.

## Số dòng — ngân sách / thật

| File | Ngân sách | Thật | Ghi chú |
|---|---|---|---|
| tu_chay/nguoi_gac.js | ~550 | 826 | ×1,50 — **chạm ngưỡng cảnh báo 1,5** (sau khi vá 2 lỗi của bản soát) |
| tu_chay/thu_nguoi_gac.js | ~650 | 543 | |
| tu_chay/cai_dat.js | ~180 | 128 | |
| tu_chay/cai_dat.sh | ~15 | 14 | |
| tu_chay/cau_hinh.json | 25 | 18 | |
| tu_chay/PHIEN_BAN | 1 | 1 | |
| tu_chay/THIET_KE.md | v1.1 + ~90 | 476 + 85 | v1.1 nguyên văn (đã so diff) |
| kiem_tra_truoc_khi_giao.js | +~35 | +32 / −1 | |
| .gitignore | +2 | +2 | |

**Code (không tính thử, tài liệu):** ~772 ngân sách, ~1019 thật (×1,32).

**Vì sao `nguoi_gac.js` vượt:** 62 luật, mỗi luật một mã và một câu hướng dẫn tiếng
Việt (65 dòng bảng). Bộ tách lệnh hiểu dấu nháy và heredoc (~200 dòng). 17 chương
trình có luật con (~300 dòng). Ước lượng ban đầu thấp.

**Đã cắt trùng lặp:**
- `relKho` (thay 3 chỗ `path.relative(nc.goc…)`);
- `khongChu` (thay 5 chỗ luật B-DICHCHU);
- `ngoaiKho` / `KHUNG` (thay 2 chỗ mẫu `.claude|.git`).

Hết lặp, nhưng số dòng không giảm (812 → 815), vì các hàm gom cũng tốn dòng.
Rà code chết: không có tên nào khai báo mà không dùng.

## Soát độc lập (/ra-soat, 28.09) — KHÔNG ĐẠT, đã xử lý
1. **`cd` trong một đoạn nối bằng `|` hoặc `&`** làm lệch cwd mà người gác theo dõi.
   Bash chạy các đoạn đó trong subshell, nên `cd server | cp x a.js` ghi ra gốc kho,
   trong khi người gác lại xét `server/a.js`.
   - **Ca thử viết trước, ĐỎ trên bản chưa vá** (3 ca: `cd server | cp`,
     `cd server & cp`, `ls | cd server; cp`).
   - **Vá:** mọi phần của pipeline và lệnh chạy nền được xét với một bản sao cwd riêng.
   - **Sau vá: XANH.**
2. **Lưu bản trước khi vá (`<file>.truoc_<ĐỢT>`, CLAUDE.md §4 bước 5) bị chặn G5**,
   trừ khi phiếu ghi đúng tên file đó → **đưa vào mục Câu hỏi**. Không tự mở quyền.
3. **`file -C` ghi file `.mgc` mà không qua ghiDuoc** → thêm luật FILE-C.
   Ca thử ĐỎ trước khi vá, XANH sau khi vá, có đột biến.
4. **"62 luật" ghi sai** → đã sửa, thật là 65 sau khi thêm FILE-C (64 trước đó).

Ba điểm "nghi ngờ" của bản soát (`npm test`/`ci` chạy script, `mkdir` ngoài phạm vi,
TOKEN chặn oan `grep`) đã ghi vào THIET_KE B13.

## Câu hỏi
1. **Lưu bản trước khi vá:** người gác hiện chặn ghi `server/x.js.truoc_DOT` nếu phiếu
   không ghi đúng tên đó. Có mở không?
   **Đề xuất:** cho ghi `<f>.truoc_<X>` khi `<f>` nằm trong phạm vi (file đã có trong
   `.gitignore`). Nếu không mở, mỗi phiếu phải ghi thêm tên các file `.truoc_*`.
2. **`bash ban_mau_pos/chay_thu.sh`** (CLAUDE.md §3) bị chặn theo B3. Có mở không?

## Phát hiện
- Luật deny sẵn có `Bash(rm -rf:*)` chặn cả lệnh `rm -rf` trong thư mục nháp. Đúng ý
  lớp 1; agent đã tránh bằng thư mục nháp mới, không xoá. Ghi lại để chủ quán biết.
- `bash ban_mau_pos/chay_thu.sh` (lệnh có trong CLAUDE.md §3) sẽ bị người gác chặn
  theo B3 (bash chỉ cho `.claude/tu_chay/*.sh` và `cong_cu/**/*.sh`). Chủ quán quyết
  có mở không (THIET_KE B13).
