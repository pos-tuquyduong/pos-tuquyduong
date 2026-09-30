# TU-CHAY-1 — trạng thái

**Bước hiện tại:** đã commit C4, chờ chủ quán cài bằng cai_dat.sh và phá thử sống.
**Vòng sửa:** 5 (C4c là một vòng vá theo biên bản soát độc lập).

## Đã làm
- C1 `b8afffd`: phiếu + kế hoạch.
- C2 `d1d1b61`: bài phá thử viết TRƯỚC, kèm bằng chứng ĐỎ trên người gác rỗng và trình cài rỗng
  (`bang_chung_do.txt`: 0/400 ca đúng, 426 chỗ hỏng).
- **Sau C2 có sửa một ca thử:** `tar server` → `tar -v server`. Chữ `server` bị hiểu
  là chùm cờ kiểu cũ của tar (s e r v e r), có `r` = chế độ append, nên ca đó không
  thử được ý "không rõ chế độ". Đã sửa trước khi viết xong người gác.
- Người gác xanh 482/482 ca. Tắt từng mã trong 68 luật đều làm bài đỏ. Bài tự sinh
  có 629 biến thể, tất cả bị chặn. Có 21 ca đối chiếu với bash thật.
  (Số luật đếm bằng `require('./tu_chay/nguoi_gac.js').LUAT.length`. Bản đầu ghi nhầm 62;
  sau C3 là 65, sau C4 là 66, sau C4b là 68, **sau C4c là 71**.)
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
| tu_chay/nguoi_gac.js | ~550 | 912 | ×1,66 — **VƯỢT ngưỡng cảnh báo 1,5** (cd, FILE-C, B-BASHTHEM, viết tắt, cd chặt, tep_bash_them; +C4c: LN-CUNG, G-LIENKET, PY-M, curl proxy, ps/grep/process.env) |
| tu_chay/thu_nguoi_gac.js | ~650 | 711 | +tự sinh, +đối chiếu bash thật, +ca C4c |
| tu_chay/cai_dat.js | ~180 | 130 | |
| tu_chay/cai_dat.sh | ~15 | 14 | |
| tu_chay/cau_hinh.json | 25 | 19 | |
| tu_chay/PHIEN_BAN | 1 | 1 | |
| tu_chay/THIET_KE.md | v1.1 + ~90 | 476 + 92 | v1.1 nguyên văn (đã so diff) |
| kiem_tra_truoc_khi_giao.js | +~35 | +32 / −1 | |
| .gitignore | +2 | +2 | |

**Code (không tính thử, tài liệu):** ~772 ngân sách, ~1058 thật (×1,37).

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
   - Sau vá: bài thử xanh. **NHƯNG VÁ CHƯA ĐỦ** — soát gọn vòng C4 tìm ra `|` cuối dòng,
     `timeout cd`, `cd` có điều kiện, `… && ls &` vẫn lọt. Xem vòng C4b.
2. **Lưu bản trước khi vá (`<file>.truoc_<ĐỢT>`, CLAUDE.md §4 bước 5) bị chặn G5**,
   trừ khi phiếu ghi đúng tên file đó → **đưa vào mục Câu hỏi**. Không tự mở quyền.
3. **`file -C` ghi file `.mgc` mà không qua ghiDuoc** → thêm luật FILE-C.
   Ca thử ĐỎ trước khi vá, XANH sau khi vá, có đột biến. **Vá chưa đủ:** `file --comp`
   (viết tắt) vẫn lọt. Xem vòng C4b.
4. **"62 luật" ghi sai** → đã sửa, thật là 65 sau khi thêm FILE-C (64 trước đó).

Ba điểm "nghi ngờ" của bản soát (`npm test`/`ci` chạy script, `mkdir` ngoài phạm vi,
TOKEN chặn oan `grep`) đã ghi vào THIET_KE B13.

## Câu hỏi
(trống — hai câu ngày 28.09 đã được chủ quán trả lời, xem vòng C4)

## Vòng C4 (28.09) — trả lời của chủ quán
1. **Bản lưu `.truoc_*`:** KHÔNG mở ghi trong kho, đặt trong nháp. B13 mục 18 ghi
   rằng CLAUDE.md §4 bước 5 sẽ sửa cho khớp ở TU-CHAY-2.
2. **MỞ `bash ban_mau_pos/chay_thu.sh`:** cau_hinh.json có thêm
   `"tep_bash_them": ["ban_mau_pos/chay_thu.sh"]`; luật B-BASHTHEM so nguyên đường dẫn.
   - **Ca thử viết TRƯỚC, ĐỎ trên bản chưa vá** (`bang_chung_do_C4.txt`: 7 chỗ hỏng):
     - được qua: `bash`/`sh` gọi file đó, `./…`, `cd ban_mau_pos && bash chay_thu.sh`;
     - bị chặn: `bash ban_mau_pos/khac.sh`, có tham số, glob, `-c`, `.truoc_X`, và
       khi cấu hình ghi glob `ban_mau_pos/*.sh`;
     - file_luat vẫn chặn Edit / `>` / cp vào `ban_mau_pos/chay_thu.sh` (G-LUAT);
     - cấu hình thiếu tep_bash_them → NG-CAUHINH.
   - **Sau vá: XANH.**

## Vòng C4b (28.09) — vòng vá thứ 4, chủ quán duyệt
Soát gọn vòng C4 ra KHÔNG ĐẠT. Agent tự kiểm thêm thì thấy tuỳ chọn dài viết tắt lọt
hết (`git commit --no-verif` bỏ qua pre-commit, đã thử thật trong kho tạm).

**Ca thử viết TRƯỚC, ĐỎ trên bản chưa vá** (`bang_chung_do_C4b.txt`: 63 chỗ hỏng; đối
chiếu bash thật cho thấy file rơi vào gốc kho trong khi người gác CHO). Vá 8 điểm:
1. hàm chung `laDai` cho tuỳ chọn dài viết tắt, áp cho mọi chỗ so tuỳ chọn dài;
2. `|` / `|&` cuối dòng (kể cả sau `#`) vẫn nối pipeline sang dòng sau;
3. lệnh trong `timeout` xét với bản sao cwd;
4. cd chỉ đổi cwd khi đứng đầu lệnh, không chuyển hướng, chỉ nối bằng `&&`
   → mã B-CD-VITRI;
5. cấm cd vào `.git/`, `.claude/` → mã B-CD-KHUNG;
6. kiểm từng mục `tep_bash_them`;
7. thêm `SHELLOPTS` / `BASHOPTS` / `PS4` vào danh sách biến nguy hiểm;
8. trình cài thêm deny `Bash(git *--no-v*)`, có phép thử trình cài.

Bài thử có thêm:
- (9) tự sinh 629 biến thể (xuống dòng, `\` nối dòng, `| # chú thích`, mọi tiền tố
  của tuỳ chọn dài bị cấm, cờ gộp) — mọi biến thể phải bị chặn;
- (10) 21 ca đối chiếu với bash thật.

Bài đối chiếu còn bắt thêm một dạng chưa ai nêu: `cd viec/X && ls & touch z` (`&`
đưa CẢ danh sách `&&` ra nền) → đã vá cùng lúc.

**Sau vá: XANH.**
- Bài người gác: 482/482 ca, 129 phép khác.
- `npm test`: 50 đạt · 0 hỏng. `--day-du`: 51 đạt · 0 hỏng.

## Vòng C4c (28.09) — vá theo biên bản soát độc lập (do chat làm người soát)

**Soát độc lập lần này do CHAT làm**, không phải agent trong Claude Code: agent soát
trong Claude Code bị **bộ lọc an toàn dừng giữa chừng**, nên chat đóng vai người soát
độc lập, soát trên gói `tu_chay_soat.tgz`. **Kết luận: KHÔNG ĐẠT — 4 chỗ hở loại A**
(hậu quả không hiện trong `git diff` / không lùi được):
1. **liên kết cứng** ghi vào cùng inode file được bảo vệ (lách kiểm đích ghi);
2. **cờ proxy của `curl`** (`-x`, `--proxy`, `--socks*`…) — đẩy dữ liệu ra ngoài;
3. **`python3 -m`** — chạy pip/venv/http.server và nạp mã tuỳ ý;
4. **đọc toàn bộ biến môi trường** (`node -e process.env`, `ps e`) / **`grep` đệ quy
   vào thư mục có `.env`** — rò bí mật.

Vá mỗi chỗ một quy tắc (mã riêng / mở rộng mã cũ) + ca thử. **Ca thử viết TRƯỚC,
chạy trên bản CHƯA vá → ĐỎ** (`bang_chung_do_C4c.txt`: 41 chỗ hỏng — đúng 41 ca từ
chối mới, mọi ca cho-qua đã xanh sẵn nên không có báo động giả; bổ sung sau đó 3 ca
`grep` đệ quy không đường dẫn cũng ĐỎ trước, XANH sau).

1. **LN-CUNG** (mã mới): `ln` không `-s` → chặn; `cp -l`/`--link` (gộp `-al`, viết
   tắt `--li`) → chặn. Đặt ở đầu `chepChuyen`.
2. **G-LIENKET** (mã mới): trong `ghiDuoc`, đích tồn tại là file thường `nlink > 1`
   → chặn. Đặt TRƯỚC nhánh cho-qua nháp/phạm vi (bắt cả liên kết cứng có sẵn).
   Ca: Edit / `>` / `cp` vào `server/a.js` khi nó có nlink 2 (kho riêng `KHO_LK`).
3. **PY-M** (mã mới): `python3 -m` (gộp `-sm`, `-Im`) → chặn. `python3 x.py -m`,
   `python3 -c` cho qua.
4. **CURL-CAM mở rộng**: thêm `-x`, `--proxy`, `--preproxy`, `--socks4/4a/5`,
   `--socks5-hostname`, `--proxy1.0` (viết tắt qua `laDai`).
5. **B-BIMAT-CHU mở rộng** (cùng mã cũ, 3 chỗ):
   - `ps` đối số BSD (không gạch đầu) chứa `e` → chặn; `ps -e`/`-ef`/`aux` cho qua.
   - `node -e/-p`, `python3 -c` có `process.env` không theo `.`/`[` → chặn;
     `process.env.PORT`, `process.env[0]` cho qua.
   - `grep` đệ quy vào thư mục chứa TRỰC TIẾP file `file_bi_mat`, không `--exclude`
     khớp → chặn kèm gợi ý; `grep -rn x server/`, `grep -rn x . --exclude='.env*'` qua.

Ghi vào THIET_KE B13 mục 22 (4 quy tắc) + mục 23 (**TU-CHAY-2 `chay.sh` sẽ mở
`claude` với biến bí mật đã gỡ khỏi `environ`** — lớp chắc chắn nhất cho việc đọc
bí mật, bù cho chỗ người gác không giới hạn `Read`).

**Sau vá: XANH.**
- Bài người gác: **538/538 ca, 132 phép khác** (thêm 3 đột biến cho 3 mã mới).
- `npm test`: **50 đạt · 0 hỏng · 0 cảnh báo** (nhóm T chạy thật bài người gác, 5,5 s).
- `LUAT.length` = **71**; `node --check` cú pháp OK.

### ĐÃ RÀ K4 (chỗ song song cùng khuôn)
- `laDai` (tuỳ chọn dài viết tắt) đã dùng sẵn cho curl proxy — không cần thêm chỗ.
- Đường ghi liên kết cứng: G-LIENKET đặt trong `ghiDuoc` — MỌI đường ghi (Edit/Write,
  `>`/`>>`, tee, cp/mv, tar, git checkout, touch/chmod…) đi qua đây nên phủ hết một chỗ.
- LN-CUNG đặt trong `chepChuyen` dùng chung cho cả `cp`/`mv`/`ln`.

### CHƯA KIỂM (máy không kiểm được)
- G-LIENKET đọc `nlink` lúc người gác chạy — **TOCTOU vẫn hở**: tạo liên kết cứng
  SAU khi người gác xét thì không bắt được (cùng lớp với TOCTOU symlink đã nêu B13).
- `process.env` chỉ soi trong `ma` của `-e/-p/-c`; script `.js`/`.py` tự đọc
  `process.env`/`os.environ` rồi in ra thì người gác không thấy (lớp script, B13).
  → Đây là lý do mục 23: gỡ bí mật khỏi `environ` ở TU-CHAY-2.
- `grep` chỉ soi thư mục chứa TRỰC TIẾP file bí mật; `grep -r . ` vào thư mục con
  cách một tầng vẫn đọc được nếu bí mật nằm sâu hơn (POS: bí mật ở gốc kho nên đủ).
- Chưa chạy trên claude thật (mới `npm test` + bài người gác trong tiến trình).

**Chặn oan có chủ ý:** `cd client && npm run build && cd ..` (CLAUDE.md §3) bị chặn.
Dạng thay `(cd client && npm run build)` được qua. CLAUDE.md §3 sẽ sửa ở TU-CHAY-2
(ghi ở B13 mục 20).

## Soát độc lập lần 2 (chat, 28.09): ĐẠT

Chat đóng vai người soát độc lập lần thứ hai (kho POS, nhánh `viec/TU-CHAY-1`),
soát trên cây làm việc đã có bản vá cuối do chủ quán dán trong Shell. **Kết
luận: ĐẠT** — 4 chỗ hở loại A của vòng C4c (liên kết cứng, cờ proxy `curl`,
`python3 -m`, đọc toàn bộ biến môi trường / `grep` đệ quy vào thư mục có
`.env`) đã đóng đủ.

**Bản vá cuối:**
- thêm `CURL_HOME` và `*_proxy` (http/https/ftp/all/no, không phân biệt hoa
  thường) vào `BIEN_NGUY` (`tu_chay/nguoi_gac.js:109`);
- sửa kỳ vọng ca `grep -rn x -e y` thành **CHO** (có `-e` thì `x` là đường dẫn,
  không phải mẫu tìm).

**Vân tay hai file (sha256, 16 ký tự đầu):**
- `tu_chay/nguoi_gac.js`: `6bb989c6cb18c56f`
- `tu_chay/thu_nguoi_gac.js`: `d3a6355e842feff4`

**Bài thử:** 6 ca proxy (`http_proxy`, `HTTPS_PROXY`, `ALL_PROXY`, `all_proxy`,
`no_proxy`, `CURL_HOME` gán trước `curl`) **ĐỎ trên bản chưa vá**, **XANH sau
vá**: 551/551 ca người gác đúng mã, 132 phép khác.

**Cách vượt còn lại** (thuộc loại cố ý, không phải sơ suất): `process['env']`
(truy cập bằng chuỗi thay vì `.env`), destructuring `const { env } = process`,
`python3 -c` gọi `runpy`. Ba đường này chưa đóng — xử lý tận gốc ở TU-CHAY-2
bằng `chay.sh` gỡ bí mật khỏi môi trường tiến trình (đã ghi ở THIET_KE B13
mục 23), thay vì cố liệt kê hết mọi cách viết lại `process.env` trong người gác.

## Phát hiện
- Luật deny sẵn có `Bash(rm -rf:*)` chặn cả lệnh `rm -rf` trong thư mục nháp. Đúng ý
  lớp 1; agent đã tránh bằng thư mục nháp mới, không xoá.
- File lạ ở gốc kho, không thuộc việc này, không add: `ke_hoach_TU-CHAY-1.md`,
  `server/sua_doi_P13.md`.
