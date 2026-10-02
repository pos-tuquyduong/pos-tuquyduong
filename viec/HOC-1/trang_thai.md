# HOC-1 — Trạng thái

## Bước 1 — đối chiếu bản chụp (02.10.2026)
Nhánh: `viec/HOC-1`
```
ecd44e2 PHIEU: HOC-1
c064f42 TIEN-DO: TU-CHAY-3 xong (03e1b48), kiem song cong DAT; them HOC-1, TIET-KIEM-1
03e1b48 Merge pull request #3 from pos-tuquyduong/viec/TU-CHAY-3
```
F1: hook mở phiên in "kéo nhánh: viec/HOC-1 đã có đủ commit của origin — không kéo" (lúc mở và lúc tiếp phiên).

## Bước 3 — kế hoạch
`ke_hoach.md`, agent phụ soát (5 điểm, đã sửa vào kế hoạch). Chủ quán duyệt 02.10.2026, phương án A mọi mục, thêm:
(1) bài thử đổi tên / bị PR xoá không được miễn — "dòng hỏng"; (2) chế độ `tinh` (A12) giữ nguyên; (3) bảng đột biến
ghi đúng lệnh chạy lại.

## Bước 4–6 — bài thử, sửa, kiểm
- Bài thử chạy trên code CHƯA vá → ĐỎ: `viec/HOC-1/bang_chung_do.txt` (`thu_cong` 21 chỗ, `thu_nguoi_gac` 4, `thu_cong_cu` 6).
- Sau vá: `thu_cong` 187 phép · 0 hỏng; `thu_nguoi_gac` 782/782 ca + 165 phép; `thu_cong_cu` 77 phép · 0 hỏng.
- `npm test` và `node kiem_tra_truoc_khi_giao.js --day-du`: PASS 54 · FAIL 0 · CẢNH BÁO 2 (T2, T3: bản cài `.claude/`
  lệch nguồn — chủ quán chạy `bash tu_chay/cai_dat.sh`). `thu_cong.js` 37,2 s trong giới hạn 120 s của `chayBaiThat`.
- Cổng TĨNH luật CŨ (bản `cong.js` của main lưu ở nháp) trên nhánh này, mốc `c064f42`: chỉ `[A8] bản cài lệch nguồn`
  (chờ chủ quán cài). Không A6 / A7 / A12.
- Chế độ `tinh` không đổi (duyệt 2): diff `cong.js` chỉ chèn trong nhánh `chay` (sau dòng 166; A12 tinh ở dòng 162 giữ nguyên) và hàm `mucBaiThuCu`.

### Ca đỏ trước, theo nhóm
| Nhóm | Ca | Đỏ trước bằng |
|---|---|---|
| A | A1, A1 backtick, A3, A4, A6 (thiếu lý do, `<lý do>`, khac.js, không có), xoá, đổi tên, A7, K5 thứ tự mục | code gốc (`bang_chung_do.txt`) + đột biến MA1–MA7, MX |
| B | B1, B2 (Edit + Bash), B4 | code gốc + đột biến MB, MB4 |
| C | C1, C2, C3 (thư mục con), symlink, symlink treo | code gốc + đột biến MC, MC2, MC3 |
| D | D1 (4 ca muc_gac), D2 (3 khoá) | xanh trên gốc (phép đã có) → đột biến M9, M10 |
| G | PHIEN_BAN 1.3.1 | code gốc |

### Bảng đột biến tay — chạy lại: `python3 viec/HOC-1/dot_bien.py [tên …]`
Script chép `tu_chay/`, `kiem_tra_truoc_khi_giao.js`, `CLAUDE.md`, `KHUON_LOI.md`, `.github/workflows/keep-alive.yml` vào
thư mục tạm, thay đúng MỘT chuỗi (ghi trong `DB` của script), chạy bài thử của bản chép. Ví dụ: `python3 viec/HOC-1/dot_bien.py M9 MA3`.
| Tên | Đột biến | Bài thử | Kết quả (02.10.2026) |
|---|---|---|---|
| M0-cong / M0-gac / M0-cc | không đột biến (đối chứng) | 3 bài | XANH cả ba (M0-cc lần đầu ĐỎ vì script chưa chép `KHUON_LOI.md` — lỗi script, đã sửa) |
| M9 | `cai_dat.js` bỏ `dung(...)` của phép muc_gac | thu_nguoi_gac | ĐỎ — 7 dòng muc_gac (ca "trỏ file khác" vẫn dừng nhờ phép khác, SAI câu → đỏ) |
| M10 | `cong.js` bỏ `throw` cấu hình thiếu khoá | thu_cong | ĐỎ — 3 ca D2 |
| MA1 | bỏ miễn | thu_cong | ĐỎ — HOC-1 A1 |
| MA3 | bỏ điều kiện "có ở mốc" | thu_cong | ĐỎ — HOC-1 A3 |
| MA4 | miễn bỏ luôn kiểm xanh trên PR | thu_cong | ĐỎ — HOC-1 A4 |
| MA6a / b / c | bỏ kiểm lý do / thu_*.js / "không có trong kho" | thu_cong | ĐỎ — HOC-1 A6 (MA6c chỉ đổi câu, không đổi kết quả miễn — xem NGHI NGỜ của soát) |
| MX | bỏ kiểm "bị PR xoá / đổi tên" | thu_cong | ĐỎ — duyệt (1) |
| MA7 | miễn tính là bài đỏ hợp lệ | thu_cong | ĐỎ — HOC-1 A7 |
| MB / MB4 | `cau_hinh.json` bỏ `package.json` | thu_nguoi_gac / thu_cong | ĐỎ — B2 / B4 |
| MC | T2 về bản cũ (đọc cả thư mục) | thu_cong_cu | ĐỎ — C1, C2, C3 |
| MC2 | T2 lọc `Dirent.isFile` | thu_cong_cu | ĐỎ — 2 ca symlink + treo |
| MC3 | T2 bỏ `try` quanh `statSync` | thu_cong_cu | ĐỎ — ca symlink treo (bộ kiểm sập ENOENT) |
Agent soát chạy thêm 9 đột biến riêng (S1–S9, script ở nháp của phiên, không vào kho): bỏ từng điều kiện muc_gac
(`cai_dat.js:86-87`), từng khoá (`cong.js:19`), lọc `coSan` của T2, kiểm `st === 'D'` — cả 9 ĐỎ đúng chỗ.

## Bước 8 — /ra-soat
F2: agent soát kế hoạch và agent `/ra-soat` đều nộp qua `SubagentHandback`, người gác KHÔNG chặn
(`.tu_chay_nhat_ky.jsonl`: 3 dòng SubagentHandback, cả 3 `CHO`).

### Vòng 1 — báo cáo nguyên văn
```
KHÔNG ĐẠT. Phần code và bài thử đạt. Phiếu mục G và lưu ý (3) của chủ quán đòi bảng đột biến ghi trong
trang_thai.md, nhưng ở HEAD a5004e9 bảng đó chưa có. Ngoài ra có một chỗ lệch khuôn nhỏ ở T2.

Căn cứ đã đọc và chạy: cong.js 1–263 (bản PR), kiem_tra_truoc_khi_giao.js 477–487 và 518–615, cai_dat.js 80–97,
thu_nguoi_gac.js 754–766 và 916–940; diff ecd44e2^..HEAD 15 file; phiếu, kế hoạch, trang_thai.md, bang_chung_do.txt,
dot_bien.py. Chạy trên code PR: thu_cong 187 phép 0 hỏng · thu_nguoi_gac 782/782 + 165 · thu_cong_cu 74 phép 0 hỏng.
python3 viec/HOC-1/dot_bien.py: 3 bản M0 xanh, mọi đột biến còn lại đỏ đúng chỗ. Thêm 9 đột biến riêng S1–S9, cả 9
đỏ đúng chỗ (S3: chỉ phép "lý do có câu muc_gac" bắt được — trình cài vẫn dừng vì phép khác, đúng như kế hoạch đoán).

1. K3: đạt — ba file bài thử đỏ trên bản chưa vá; ca xanh trên gốc (D1, D2, A3, A6, A7) có đột biến tay; bài thử
   kiểm hành vi thật (cổng trên kho tạm, T2 chạy khối mã thật); cổng luật cũ của PR này qua được.
2. K4: 4 chỗ liệt kê tu_chay/ (cai_dat.js:97, cong.js:120, cong.js:45-52 cacFile, T2 kiem_tra:530) đều bỏ thư mục
   con nhưng chưa cùng khuôn với symlink (lỗi 1). T3, T4 không cùng khuôn lỗi. mucMien / mucBaiThuCu cùng cách tách
   dòng. A12 chế độ tinh (cong.js:162) không đổi — đúng lưu ý (2).
3. K5: các luồng hợp lệ đều có ca "phải KHÔNG bị chặn"; không thấy luồng bị chặn oan; dòng hỏng chỉ là ghi.
4. K1: xem lỗi 2 và lỗi 1.
5. Đường tiền: không đụng server/. 6. P1: không đụng client/src/.

LỖI TÌM ĐƯỢC:
1. kiem_tra_truoc_khi_giao.js:530 — T2 lọc Dirent.isFile() (false với symlink), cai_dat.js:97 lọc
   statSync().isFile() (true). Symlink trong tu_chay/ vẫn được cài nhưng T2 không so byte; symlink thừa trong
   .claude/tu_chay/ không bị báo — nới T2 ngoài phạm vi C (K4, nhẹ). Sửa: statSync + ca symlink trong baiT2.
2. viec/HOC-1/trang_thai.md — thiếu bảng ca đỏ A–D (G), bảng đột biến kèm lệnh (lưu ý 3), F2 của /ra-soat, kết quả
   npm test / --day-du; bang_chung_do.txt dẫn tới bảng chưa có (K7).

NGHI NGỜ:
- cong.js:224 — miễn không kiểm PR chỉ THÊM ca: bài thử cũ được miễn có thể bị bỏ bớt ca, thay bằng process.exit(0),
  vẫn xanh hai bên và qua. Phiếu không đòi; là lối lách khi miễn được ghi cho file luật như tu_chay/thu_nguoi_gac.js.
- cong.js:61-71 — chép nguyên khối mẫu ## Bài thử cũ sửa từ MAU_PHIEU vào phiếu sinh 3 "dòng hỏng" giả; gạch nối
  thường / gạch ngắn thay "—" bị coi là dòng hỏng. Chỉ làm rối thông tin, không đổi kết quả.
- kiem_tra_truoc_khi_giao.js:479 — chayBaiThat 120 s/bài; thu_cong.js nay 38,1 s; máy GitHub chậm hơn thu hẹp dư.
- MA6c — bỏ nhánh "không có trong kho" chỉ đổi câu thông báo, không đổi hành vi chặn.

CHƯA SOÁT ĐƯỢC: cổng thật trên GitHub (F3, A8 sau cai_dat.sh, thời gian chạy); không tự chạy npm test / --day-du
toàn bộ.

BÀI HỌC:
- KHOÁ: ca symlink trong baiT2, T2 cùng phép statSync với cai_dat.js:97.
- KHOÁ (đề xuất, chủ quán quyết): miễn A11 đòi file được miễn không có dòng xoá (git diff --numstat) hoặc số ca
  không giảm.
- NGUYÊN TẮC (K4): "cùng khuôn X" phải so cả symlink và loại file — Dirent.isFile() khác statSync().isFile().
- NGUYÊN TẮC (K7): hồ sơ dẫn tới bảng ở tệp khác thì tệp kia phải có bảng trong cùng commit.
```
(Báo cáo đã rút gọn xuống dòng cho vừa khổ; nội dung, số dòng, kết luận giữ nguyên.)

### Sửa sau vòng 1
- Lỗi 1: ca C2 symlink lệch, C3 symlink thừa thêm vào `thu_cong_cu.js` → ĐỎ trên T2 `Dirent.isFile` (2 chỗ hỏng), rồi
  T2 đổi sang `statSync` như `cai_dat.js:97` → XANH. Tự soát thêm: symlink TREO làm `statSync` ném → sập cả bộ kiểm
  (bản cũ không sập, báo "thừa") → bọc `try`, coi như file; ca C3 symlink treo + đột biến MC3 đỏ đúng chỗ.
- Lỗi 2: file này (bảng ca đỏ, bảng đột biến, F2, kết quả kiểm).
- NGHI NGỜ: ghi `## Câu hỏi` / `## Phát hiện` dưới — không tự làm (ngoài nghiệm thu của phiếu).
Vòng sửa: 1/3. Không chạy lại `/ra-soat` vòng 2 trước khi chủ quán duyệt (đã hết việc trong nghiệm thu; xem Câu hỏi 1).

## Câu hỏi
1. **Miễn A11 có nên đòi "chỉ thêm ca"?** (NGHI NGỜ 1 của soát) Hiện miễn cho qua cả khi bài thử cũ bị BỚT ca
   (vẫn xanh hai bên). Phương án: (a) giữ như phiếu — chủ quán kiểm bằng mắt khi ghi mục miễn; (b) cổng đòi
   `git diff --numstat` của file được miễn có 0 dòng xoá (chặn cả sửa chú thích); (c) chỉ cấm miễn cho bài thử nằm
   trong `file_luat` (`tu_chay/thu_*.js`). Máy không tự chọn.

## Phát hiện
1. Chép nguyên mẫu `## Bài thử cũ sửa` từ `MAU_PHIEU.md` vào phiếu sinh "dòng hỏng" giả (chỉ là dòng `·` thông tin).
   Gạch `-`/`–` thay `—` cũng là dòng hỏng — câu báo "thiếu đường dẫn hoặc lý do sau —" đã chỉ đúng chỗ.
2. `thu_cong.js` chạy ~37 s, giới hạn `chayBaiThat` 120 s (`kiem_tra_truoc_khi_giao.js:479`); chưa đo trên GitHub.
3. `package-lock.json` KHÔNG đưa vào `file_luat` (phiếu cấm). `npm ci` theo lockfile của PR; đổi lockfile không tắt
   được `npm test` như dòng `"test"`, nên chưa thấy cần — ghi để chủ quán biết.

## Bài học (bước 11)
| # | Sự cố | Ngăn | Ở đâu / lý do |
|---|---|---|---|
| a | T2 vá thư mục con bằng `Dirent.isFile` → nới với symlink, khác trình cài (soát vòng 1, lỗi 1) | KHOÁ | ca symlink + treo trong `thu_cong_cu.js`, đột biến MC2, MC3 đỏ trước |
| b | Cùng lỗi (a) nhìn từ cách nghĩ: "cùng khuôn" chỉ so ca vừa gặp | NGUYÊN TẮC | `KHUON_LOI.md` K4 thêm dòng (109/120 dòng) |
| c | Hồ sơ dẫn tới bảng chưa có (soát vòng 1, lỗi 2) | BỎ | K7 đã có "lỗi giao nhận"; lần đầu viết bảng sau soát — luật chưa thiếu |
| d | Script đột biến thiếu `KHUON_LOI.md` → đối chứng M0 đỏ | KHOÁ (đã có) | M0 đối chứng trong script bắt ngay; K2 "truy nguyên trước" đã làm đúng |
| e | Người gác chặn 15 lệnh (B-CD-VITRI 5, B-MANOI 2, B-BIMAT-CHU 2, B-CHUONGTRINH 2, B-PHANTICH, B-DICHCHU, B-CD, GIT-LENH) — 6 của agent soát | BỎ | Người gác làm đúng việc; cách đúng (script Python trong nháp, `cd` đứng đầu) đã có |
| g | Gõ nhầm chạy lại script vá `KHUON_LOI.md` (không lũy đẳng) → chèn trùng dòng K4, chưa commit | BỎ | thấy ngay qua `wc -l` (111 ≠ 109), `git restore KHUON_LOI.md`; marker idempotent đã là `CHECKLIST_CODE.md` F2 (dòng 263) |
| f | Miễn A11 không kiểm "chỉ thêm ca" (soát, nghi ngờ) | KHOÁ (đề xuất) | Ngoài nghiệm thu → Câu hỏi 1; nếu (b)/(c): `cong.js` + ca trong `thu_cong.js`, ca đỏ = bài cũ được miễn bị thay bằng `process.exit(0)` |

Dọn: không có lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` vừa được phép kiểm làm thay trọn.
`CLAUDE.md` §2 ghi "36 phép lúc 24.09.2026" (bộ kiểm nay 54) — ngoài Phạm vi, đề xuất cập nhật ở việc sau.

## BÁO CÁO
```
VIỆC:        HOC-1 — miễn A11 cho bài thử cũ, package.json là file luật, T2 bỏ thư mục con
ĐÃ SỬA:      tu_chay/cong.js:61-71 — mucBaiThuCu đọc ## Bài thử cũ sửa; :200-208 — chế độ chay: dòng hỏng
             (thiếu lý do, không thu_*.js, xoá/đổi tên, mới, không có); :224 — miễn A11 khi xanh trên gốc,
             không tính doHopLe (A12 giữ); chế độ tinh không đổi
             tu_chay/cau_hinh.json:11 — file_luat thêm "package.json"
             kiem_tra_truoc_khi_giao.js:529-533 — T2 chỉ so file (statSync như cai_dat.js:97), symlink treo không sập
             tu_chay/PHIEN_BAN — tu-chay 1.3.1; MAU_PHIEU.md, skill_lam_viec.md, THIET_KE.md B15 (Phát hiện 5), KHUON_LOI.md K4
BÀI THỬ:     chạy trên bản chưa vá → ĐỎ: thu_cong 21 chỗ (A1, A3, A4, A6, xoá, đổi tên, A7, B4),
             thu_nguoi_gac 4 (B1, B2, PHIEN_BAN), thu_cong_cu 6 (C1–C3, tài liệu) — bang_chung_do.txt;
             D1/D2 và ca chỉ-hỏng-câu đỏ bằng 16 đột biến tay (python3 viec/HOC-1/dot_bien.py); sau vá XANH cả ba,
             npm test / --day-du PASS 54 FAIL 0
ĐÃ RÀ K4:    grep "readdirSync\|isFile" trong tu_chay/*.js + kiem_tra → 4 chỗ liệt kê tu_chay/ (cai_dat.js:97,
             cong.js:120 ls-tree, cong.js:45 cacFile, T2) — đã cùng khuôn (file, kể cả symlink); file_luat dùng ở
             nguoi_gac.js:189 + cong.js:145 — một mục phủ cả hai; mucMien / mucBaiThuCu cùng cách tách dòng
CHƯA KIỂM:   cổng thật trên GitHub (F3: hai check cong + cong-chay) — cần chủ quán chạy bash tu_chay/cai_dat.sh
             trên viec/HOC-1 trước, không thì A8 đỏ; thời gian thu_cong.js trên máy GitHub (37 s ở đây, giới hạn
             120 s); miễn A11 không chặn việc BỚT ca trong bài thử cũ được miễn (Câu hỏi 1); chế độ chay của cổng
             chạy trên kho THẬT (npm ci + toàn bộ) chưa chạy ở đây — chỉ chạy qua kho giả trong thu_cong.js
GIT:         28d7eb0 HOC-1: KHUON_LOI K4 cung khuon moi loai dau vao
             7d014b2 HOC-1: dot bien MC2, MC3, chep them KHUON_LOI.md
BÀI HỌC:     KHOÁ 2 (+1 đề xuất) · NGUYÊN TẮC 1 · BỎ 3 — chi tiết ở ## Bài học
```
