# AUDIT-1 — kế hoạch (chờ chủ quán duyệt)

Việc chỉ ĐỌC + ĐO + BÁO CÁO. Mọi file sinh ra nằm trong `viec/AUDIT-1/`. Không đổi một byte nào ngoài thư mục này.

## 0. Số đo lúc lập kế hoạch (HEAD `ac7f2d0`, đo trong lượt này)

| Thứ | Số | Nguồn |
|---|---|---|
| mã trong `LUAT` người gác | 74 (NG 3 · CC 3 · G* 14 · B 20 · GIT 12 · NPM 1 · PY 3 · NODE 1 · RM/CP/MV/LN 5 · TAR 3 · SED/AWK 3 · FIND 1 · CURL 3 · MKDIR 1 · FILE 1) | `node -e` đọc `require('./tu_chay/nguoi_gac.js').LUAT` |
| mã cổng | A3–A14 (12 mã) | `grep -oE "\bA[0-9]+\b" tu_chay/cong.js` |
| khoá `cau_hinh.json` | 20 | `tu_chay/cau_hinh.json` |
| bất biến / đột biến giả lập | I1–I11 / M1–M13 | `cong_cu/gia_lap/bat_bien.js`, `cong_cu/thu_gia_lap.js:60-83` |
| chữ INSERT/UPDATE/DELETE ở 11 file routes tiền | 87 (orders 38 · signup-codes 8 · refunds 7 · packages 7 · discount-codes 6 · customers-v2 6 · wallets 5 · rewards 4 · loyalty 3 · damages 2 · don-mo-rong 1); `ghiVi(` 12 chỗ | Grep (đếm cả ghi chú — số câu thật đếm lại khi dựng) |
| routes còn lại | 61 chữ ghi ở 10 file → CHƯA KIỂM, chỉ ghi số | Grep |
| lời gọi `chac(` trong bộ kiểm | 48 (có cái nằm trong vòng lặp → số phép thật đếm từ đầu ra) | `kiem_tra_truoc_khi_giao.js` |
| đột biến cũ | HOC-1 20 · TU-CHAY-4 10 · P26b 48 = 78 | `viec/*/dot_bien.py` |
| thời gian (1 lần, chạy nối tiếp) | `npm test` 56,7 s · `--day-du` 205,7 s · giả lập 67,6 s · `thu_gia_lap` 70,6 s · `thu_cong` 44,3 s · `thu_nguoi_gac` 6,2 s · `thu_cong_cu` 3,6 s | script đo trong nháp |
| máy | 4 CPU, 17 GB | `os.cpus()` |

Phát hiện ngay lúc đo (sẽ kiểm lại ở C3): `kiem_tra_truoc_khi_giao.js:746` ghi "giả lập 22 s, thu_gia_lap 24 s"
mà đo hôm nay là 68 s / 71 s; hạn 110 s (`thu_gia_lap.js:53`) và 120 s (`kiem_tra…:479`) chỉ còn dư ~1,6 lần.

## 1. Khung chung — `dot_bien.py` (G2)

**Phương án A (chọn):** MỘT file `viec/AUDIT-1/dot_bien.py`, bảng đột biến theo khuôn đã có của `viec/P26b/dot_bien.py`
(`(tên, chạy, [(file, gốc, thay, số lần)], mẫu)`), thêm cột nhóm A–E. Nhóm E không chép lại đột biến cũ mà GỌI
`viec/*/dot_bien.py` có sẵn rồi đọc kết quả. Ước lượng ~650 dòng (bảng ~450, khung ~200).
**Phương án B:** mỗi nhóm một script (5 file, ~800 dòng) — thừa khung lặp lại 5 lần. Bỏ.

Khung:
- **Bản sao kho**: `tempfile.mkdtemp()` → chép các file `git ls-files` liệt kê (bỏ `attached_assets/`), liên kết mềm
  `node_modules` và `client/node_modules` vào kho thật (chỉ đọc). Áp đột biến trên bản sao; lệnh chạy với `cwd` = bản sao.
  Đột biến chỉ đụng `server/` hoặc `cong_cu/gia_lap/` thì chép đúng thư mục đó và chạy qua `--may-chu` / `--gia-lap`
  (rẻ hơn, giống P26b).
- **Áp đột biến**: chuỗi gốc phải khớp ĐÚNG số lần ghi sẵn, không thì **HỎNG** (không chạy lệnh, không bao giờ đếm BẮT).
- **Chấm**: BẮT = đầu ra có dòng khớp regex `mau` (đúng ca/đúng mã). Thoát ≠ 0 mà không khớp mẫu → **LẠC** (đếm riêng, coi
  như chưa bắt — K3), xanh → **SỐNG**. Quá giờ → **TREO** (đếm riêng).
- **Song song có giới hạn**: `ThreadPoolExecutor(max_workers=3)` (4 CPU, chừa 1). Tham số `-j N`.
- **Dọn**: `try/finally` + bắt SIGINT/SIGTERM → xoá mọi thư mục tạm; cuối lần chạy in `git status --porcelain` của kho
  thật trước/sau — khác nhau là in **KHO BẨN** và thoát 3.
- **Đầu ra**: một dòng mỗi đột biến `BẮT|SỐNG|HỎNG|LẠC|TREO  <nhóm> <tên>  (<giây> s) · <dòng khớp hoặc dòng cuối>`, rồi
  bảng tổng theo nhóm. `--json <file trong nháp>` để `bao_cao.md` lấy số.
- Chọn: `python3 viec/AUDIT-1/dot_bien.py A`, `… C2`, `… ten-dot-bien …`; `--g3` chạy 3 ca tự chứng minh.
- Không có file `thu_*.js` trong `viec/AUDIT-1/` (phiếu). Trình phụ JS nếu cần đặt tên `lach.js`, `doc_cau_hinh.js`.

**Kiểm sạch trước khi chạy (chống K3 do chạy song song):** mỗi lệnh chạy dùng làm đáp án được chạy trước trên bản sao
KHÔNG đột biến, 3 bản cùng lúc (`-j 3`) → phải xanh cả 3. Không xanh thì công cụ dừng, không chấm gì
(SỐNG/BẮT trên nền không sạch là vô giá trị).

## 2. Từng nhóm — cách làm, ước lượng thời gian

| Nhóm | Cách làm | Số đột biến | Thời gian máy |
|---|---|---|---|
| G3 | 3 ca tự chứng minh (§3) | 3 | ~2 phút |
| A1 | đọc `CA` của `thu_nguoi_gac.js` (nạp bằng trình phụ, KHÔNG sửa): mỗi mã → ca chặn đúng mã + ca CHO gần nhất (cùng chương trình / cùng loại công cụ). Ca CHO "gần nhất" do máy đề xuất theo tiền tố lệnh, người đọc lại — thiếu = phát hiện | 0 (bảng) | <1 phút |
| A2 | chạy `thu_nguoi_gac.js` có sẵn, đếm dòng "đột biến: tắt X" đạt / 74 | 0 | 6 s |
| A3 | VÁ SAI trên bản sao `nguoi_gac.js`, chạy `node tu_chay/thu_nguoi_gac.js --nguoi-gac <bản sao>`; ≥1 mỗi nhóm luật (15 nhóm) — dự kiến ~25: đảo điều kiện, nới glob `khop`, bỏ `path.resolve`/`realpath`, so khớp phân biệt hoa thường, bỏ kiểm `nlink`, bỏ dò `--` tiền tố tuỳ chọn dài… | ~25 | ~2 phút |
| A4 | `lach.js` nạp BẢN SAO người gác, dựng kho giả như `thu_nguoi_gac.js` (`kho(...)`), gọi `xet()` với ≥1 lệnh lách / mã (74+), chỉ là CHUỖI dữ liệu. Lọt (CHO) = phát hiện, ghi nguyên lệnh | 74+ chuỗi | <1 phút |
| B1 | `tat` từng mã có sẵn trong `thu_cong.js` (đọc đầu ra) + VÁ SAI ≥1 / mã trên bản sao kho, chạy `node tu_chay/thu_cong.js` của bản sao | ~15 | ~5 phút |
| B2 | grep từng khoá trong `tu_chay/*.js`, `cong_cu/**`, `kiem_tra…js`, `.claude/` (chỉ đọc) → bảng khoá → file:dòng đọc / chỉ tài liệu | 0 | <1 phút |
| B3 | `git ls-files` mọi `thu_*.js` → `laBaiThu()` của `cong.js` (nạp, gọi) → bảng có/không; file luật có thật vs `file_luat` | 0 | <1 phút |
| B4 | sau khi có báo cáo: `node tu_chay/cong.js tinh . origin/main HEAD viec/AUDIT-1` (`cong.js` của main = của nhánh này, nhánh chưa đổi nó) → ĐẠT, chép đầu ra | 0 | <1 phút |
| C1 | bảng I1–I11 ↔ M1–M13; bất biến chưa có đột biến (dự kiến I2 — chỉ có kho tay, I3, I5?, I9?) → thêm đột biến server bản sao + `--den-kb`; I10 ⊂ I11 ghi NHẸ | ~4 | ~3 phút |
| C2 | mỗi câu ghi ở 11 file routes tiền + 12 chỗ `ghiVi(`: bỏ câu (thay `await tx.run(…)` bằng `0 &&`/`void 0`, chuỗi gốc lấy nguyên câu) trên bản sao. Đáp án theo TẦNG để rẻ: (1) giả lập `--may-chu` + `thu_P26a` + `thu_P26b` `--may-chu`, song song; khớp mẫu → BẮT, dừng. (2) Chỉ đột biến còn SỐNG mới chạy `npm test` trên bản sao kho đủ (có `thu_P20`, `thu_P21` — hai bài này KHÔNG nhận `--may-chu`). SỐNG ở tiền/ví/điểm/kho = NẶNG | ~75 | ~35 phút |
| C3 | đo giả lập + `thu_gia_lap.js` 3 lần, NỐI TIẾP (không chạy gì khác cùng lúc) → so 110 s / 120 s | 0 | ~7 phút |
| D1 | đếm phép từ đầu ra `npm test` + `--day-du`; mỗi phép ≥1 đột biến (trên bản sao code, hoặc bản sao bộ kiểm khi phép soi file ngoài code — vd `.gitignore`), chạy `node kiem_tra_truoc_khi_giao.js` của bản sao, mẫu = `✗ <tên phép>`. Phép `--day-du` (dist khớp src, bánh cóc giả lập, 2 bài chạy giả lập) chạy riêng ~4 đột biến | ~55 + 4 | ~22 phút |
| E1 | chạy lại `viec/HOC-1`, `viec/TU-CHAY-4`, `viec/P26b` `dot_bien.py` trên HEAD (gọi nguyên, đọc dòng kết quả từng tên) → bảng BẮT/SỐNG/HỎNG; P26a/TU-CHAY-1..3 không có `dot_bien.py` → ghi "không có" | 78 (cũ) | ~20 phút |
| E2 | đếm ca trong `bang_chung_do.txt` từng việc vs số ca bài thử hiện tại; grep từng tên đột biến cũ trong `trang_thai.md` của việc đó | 0 | <1 phút |
| F1/F2 | đọc 6 tài liệu, grep từ khoá cơ chế (`chặn|cấm|bắt buộc|phải đỏ|tự kiểm|cổng bắt|không được|KHÔNG`) → mỗi câu: dẫn phép kiểm (file:dòng / tên ca) hoặc CHƯA KIỂM; câu nghi sai → thử thật bằng dữ liệu (A4/B) → NẶNG nếu sai. Ghi `f_tai_lieu.md` | 0 | đọc tay |

**Tổng máy ≈ 95 phút** (trước khi sửa theo §8; sau §8 ước ≈ 85 phút) (trên 90 phút của phiếu) → xem §5.

## 3. Ca thử ánh xạ 1-1 với mục Nghiệm thu

| Nghiệm thu | Ca / sản phẩm chứng minh |
|---|---|
| A1 | `a_bang_luat.md`: 74 dòng = mã · ca chặn (tên ca) · ca CHO gần nhất · THIẾU; số dòng = `LUAT.length` đọc từ code (máy so, lệch thì đỏ) |
| A2 | dòng `A2: <n>/74 mã tắt → thu_nguoi_gac đỏ` từ đầu ra thật |
| A3 | đột biến `A3-<nhóm>-<tên>` mỗi nhóm luật ≥1; máy kiểm đủ 15 nhóm có mặt trong bảng |
| A4 | `lach.js` in `LỌT|CHẶN <mã> <lệnh>`; mỗi mã ≥1 dòng (máy kiểm đủ 74) |
| B1 | bảng A3–A14: ca đỏ trong `thu_cong.js` · `tat` bị bắt · đột biến `B1-A<n>-…` ≥1 / mã |
| B2 | bảng 20 khoá → file:dòng đọc hoặc "chỉ tài liệu" |
| B3 | bảng mọi `thu_*.js` → `laBaiThu` có/không · đáng có không; file luật thiếu trong `file_luat` |
| B4 | đầu ra `cong.js tinh` chép vào `bao_cao.md` |
| C1 | bảng I1–I11 → đột biến BẮT (M cũ hoặc `C1-…` mới); I10 ⊂ I11 = phát hiện NHẸ |
| C2 | đột biến `C2-<file>-<n>` mỗi câu ghi ở 11 file + 12 `ghiVi`; bảng routes còn lại: số câu · CHƯA KIỂM |
| C3 | 3 số đo × 2 lệnh, so 110/120 s |
| D1 | `d_bang_phep.md`: phép → đột biến → dòng lệch; số phép đếm từ đầu ra (máy so) |
| E1 | bảng 78 tên cũ → BẮT/SỐNG/HỎNG (I10-bo dự kiến HỎNG) |
| E2 | bảng việc → số ca bằng chứng vs hiện tại; tên đột biến thiếu trong `trang_thai.md` |
| F1/F2 | `f_tai_lieu.md`: câu → phép kiểm / CHƯA KIỂM / SAI; danh sách đề xuất xoá |
| G1 | `bao_cao.md` ≤ 300 dòng, bảng `AU-<n>` đủ 6 cột + tỷ lệ theo nhóm |
| G2 | `dot_bien.py` chạy được từ gốc kho, theo nhóm / tên |
| G3 | `bang_chung_do.txt`: (1) `G3-sai-chuoi` (chuỗi không có trong file) → HỎNG; (2) `G3-da-biet` = M1 (pay-debt bỏ chặn thu hai lần) → BẮT; (3) `G3-vo-hai` (đổi chữ trong một dòng ghi chú `// ` của server) → SỐNG |
| G4 | `/ra-soat` chạy lại ≥10 tên ngẫu nhiên, kiểm lại ≥5 AU, tìm ≥1 lỗ mới |
| G5 | máy kiểm: mọi tên trong `dot_bien.py` có trong `trang_thai.md`; `npm test` + `--day-du` xanh; `git diff --stat origin/main -- . ':!viec/AUDIT-1'` rỗng |

**Đường song song cần canh (K4):** `cong.js` có hai chế độ `tinh` / `chay` — VÁ SAI phải phủ cả hai; người gác có hai
lối vào (`xet()` trong tiến trình và hook thật qua stdin) — A4 thử qua `xet()`, thêm ≥5 ca qua tiến trình thật của bản
sao để chắc hai lối giống nhau; ví có `ghiVi` và `reconcileWallet` — C2 phủ cả hai; bản cài `.claude/tu_chay/` vs nguồn
`tu_chay/` — chỉ so băm (đọc), không đụng `.claude/`.

**Luồng hợp lệ KHÔNG bị ảnh hưởng (K5):** (1) `git status --porcelain` của kho thật giống trước/sau mỗi lần chạy, kể
cả khi bấm Ctrl-C giữa chừng (thử một lần, ghi vào `bang_chung_do.txt`); (2) không thư mục `/tmp/*` nào của
`dot_bien.py` sót lại; (3) `data/` không đổi (chụp mtime như `thu_gia_lap.js`); (4) `npm test` + `--day-du` của kho
thật xanh cuối việc; (5) không chạy lệnh lách nào — A4 chỉ truyền chuỗi vào `xet()` của bản sao.

## 4. Ngân sách dòng
`dot_bien.py` ~650 · `lach.js` ~150 (đa số là bảng 74+ lệnh) · `bao_cao.md` ≤ 300 · file phụ (`a_bang_luat.md`,
`d_bang_phep.md`, `f_tai_lieu.md`, `ket_qua.json`) không tính vào ngân sách code.

## 5. Thời gian > 90 phút — xin chủ quán chọn (ghi ở `trang_thai.md` ## Câu hỏi)
- **(a) đề xuất:** chạy đủ, chia theo nhóm, mỗi nhóm xong commit + push (phiếu đã cho phép làm tiếp bằng `tiep`).
  Nhóm dài nhất C2 ~35 phút. Không chọn mẫu → không có chỗ nào "chưa đo" do cắt.
- (b) C2 chỉ chạy tầng 1 (giả lập + P26a/P26b); câu SỐNG ghi "SỐNG ở tầng 1, chưa chạy P20/P21" — tiết kiệm ~10 phút,
  nhưng một câu có thể bị ghi SỐNG oan.
- (c) E1 chỉ chạy P26b (48 tên, nhiều nhất về tiền) + 5 tên ngẫu nhiên mỗi việc kia — tiết kiệm ~8 phút.

## 6. Thứ tự làm và điểm dừng
1. G3 + khung → commit + push. 2. A → commit + push. 3. B (trừ B4). 4. C. 5. D. 6. E. 7. F. 8. `bao_cao.md` + B4.
9. `/ra-soat` (G4). 10. Bài học. Mỗi bước ghi vào `trang_thai.md` nhóm nào xong.

## 7. Rủi ro
- Chạy song song làm bài thật đỏ thất thường → kiểm sạch §1 trước mỗi nhóm; LẠC/TREO đếm riêng, không gộp vào BẮT.
- Đột biến "bỏ câu" làm vỡ cú pháp → bài đỏ vì sập chứ không vì phát hiện → mẫu `mau` phải là dòng lệch bất biến /
  `✗ <ca>`, không phải "thoát ≠ 0"; sập = LẠC.
- `thu_P20/P21` không nhận `--may-chu` → phải chạy trên bản sao kho đủ (chép ~ cả kho trừ `attached_assets/`).
- Người gác chặn lệnh của chính phiên (đã gặp B-PHANTICH) → mọi đo đạc viết thành script, không viết lệnh shell ghép.

## 8. Sửa sau vòng soát kế hoạch (agent chỉ đọc, 04.10.2026) — §8 THẮNG các dòng trên nếu lệch

Đã tự kiểm lại từng điểm bằng code trong lượt này trước khi nhận.

**Ra ngoài phạm vi (phải sửa):**
1. **E1 không gọi nguyên `viec/TU-CHAY-4/dot_bien.py`**: kiểu `tai_cho` của nó ghi THẲNG vào file thật rồi chép lại
   (`viec/TU-CHAY-4/dot_bien.py:32-36, 56-63`) → phạm "không đổi byte ngoài `viec/AUDIT-1/`". Chỉ gọi nó với lọc tên các
   mục chạy trên bản sao (`gl`); các mục `tai_cho` làm lại trên BẢN SAO kho trong `dot_bien.py` của AUDIT-1, cùng chuỗi.
   Bản thân việc một `dot_bien.py` cũ sửa file thật (ngắt giữa chừng = kho bẩn) ghi thành phát hiện nhóm E.
2. Ca người gác chạy bằng tiến trình thật: `CLAUDE_PROJECT_DIR` LUÔN trỏ vào kho giả trong thư mục tạm — hook ghi
   `.tu_chay_nhat_ky.jsonl` vào gốc đó (`tu_chay/nguoi_gac.js:942-948`), file bị `.gitignore` nên `git status` không thấy;
   K5 thêm phép: mtime + cỡ `.tu_chay_nhat_ky*.jsonl` của kho thật không đổi bởi `dot_bien.py`.
3. Không liên kết mềm `client/node_modules`; phép `--day-du` (build client) chạy NỐI TIẾP, chép `client/` riêng; K5 thêm
   chụp mtime `client/node_modules/.vite` (nếu có) trước/sau.
4. `cong_cu/thu_p1.js` ghi kho thật (nạp `server/ketNoiKho`) — KHÔNG BAO GIỜ chạy; B3 ghi nó là "khớp `laBaiThu` nhưng
   không phải bài thử an toàn" (ứng viên phát hiện).

**Cách ngắn hơn (nhận):**
- Bản sao theo NHU CẦU, không chép cả kho: C2 tầng 2 = bản sao `server/` + `cong_cu/thu_P20.js`, `thu_P21.js` + liên kết
  `node_modules` (hai bài lấy `GOC = __dirname/..`, `cong_cu/thu_P20.js:25`), chạy thẳng hai bài — không `npm test`
  (P26a/P26b đã chạy ở tầng 1). B1/A3 = chép `tu_chay/` + `.github/workflows/keep-alive.yml` theo khuôn
  `viec/HOC-1/dot_bien.py:9`. Chỉ D1 cần bản sao đủ kho.
- A1/B3: `thu_nguoi_gac.js` và `cong.js` không xuất `CA` / `laBaiThu` (`tu_chay/cong.js:259` chỉ `{ cong }`) → A1 đọc
  NGUỒN theo mẫu lời gọi `ca(` / `B(` / `E(` / `W(` và đối chiếu tên ca trong đầu ra; B3 dựng lại quy tắc từ code
  `laBaiThu` (`tu_chay/cong.js:36-37`) + `thu_muc_bai_thu`, ghi rõ là bản dựng lại, và kiểm chéo bằng một PR giả trong
  `thu_cong.js` nếu được — không thì ghi CHƯA KIỂM.

**Ca nghiệm thu bổ sung:**
- **B1:** `tat` có sẵn chỉ phủ A6–A14 (`tu_chay/thu_cong.js:336-347`); A3, A4, A5 không có ca `tat` → đó là PHÁT HIỆN,
  và B1 thêm đột biến "bỏ kiểm" + VÁ SAI riêng cho A3, A4, A5 trên bản sao `cong.js`. **A15** (bước chặn PR từ fork trong
  `tu_chay/cong_github.yml`, `thu_cong.js:416,457`) vào bảng B1 với ≥1 VÁ SAI trên bản sao yml.
- **A1/A4 với mã "cho qua"** (CC-DOC, G-NHAP, G-PLANS, G3-HOSO, G4-PHAMVI, G-HOANTAC, B-DEV, B-TIMEOUT, B-BASHTHEM…;
  máy liệt kê bằng các mã mà `xet()` trả `CHO`): ca bắt buộc đảo lại = ≥1 ca CHO đúng mã + ≥1 ca CHẶN gần nhất; "lách" =
  lệnh nguy hiểm khoác vỏ mã cho qua (vd ghi file luật qua đường nháp có `..`). NG-JSON/NG-GOC/NG-CAUHINH lách bằng JSON
  đầu vào / biến môi trường, không bằng lệnh. Máy kiểm "đủ 74" theo hai bảng (chặn / cho qua).
- **Lối hook:** NG-LOI, NG-GIO, NG-TRAN, NG-NHATKY có trong `MO_TA` mà không trong `LUAT` (`tu_chay/nguoi_gac.js:95-100`),
  chỉ tới được qua stdin → ca tiến trình thật nhắm đúng 4 mã này (≥1 mỗi mã) trên bản sao người gác.
- **A3 ↔ cổng:** `cong.js` nạp `nguoi_gac.js` (`tu_chay/cong.js:16`, `xetPhamVi`/`phamViTuChu`) → đột biến VÁ SAI ở hai
  hàm đó chạy CẢ `thu_nguoi_gac.js` lẫn `thu_cong.js`; BẮT nếu một trong hai bắt.
- **G3 thêm ca thứ tư `G3-sap`:** làm hỏng cú pháp `server/routes/orders.js` của bản sao → phải in **LẠC**, không phải
  BẮT (đây đúng là K3: đỏ vì sập ≠ bắt).
- **E1 ánh xạ đầu ra cũ:** HOC-1 `LỖI`→HỎNG, `ĐỎ nhưng SAI chỗ`→LẠC, `XANH — SỐNG`→SỐNG (`viec/HOC-1/dot_bien.py:50-60`);
  TU-CHAY-4 `LỖI`→HỎNG, `SAI`→SỐNG/LẠC tách theo mã thoát (`:70-71`); P26b dùng chung ✗ → tách theo chữ "không áp được"
  (HỎNG) và "thoát 0" (SỐNG), còn lại LẠC (`viec/P26b/dot_bien.py:186,197`). Ca đối chứng `M0` không đếm là đột biến.
  E1 chạy MỘT MÌNH (P26b tự mở 6 luồng, `:193`) — không chung hàng chờ với nhóm khác.
- **Kiểm sạch** chạy cho TỪNG loại bản sao (chỉ `server/`, chỉ `gia_lap/`, `tu_chay/`, đủ kho).
- **G1:** bảng tỷ lệ có 5 cột BẮT · SỐNG · HỎNG · LẠC · TREO; tỷ lệ BẮT = BẮT / (tổng − HỎNG); LẠC và TREO KHÔNG cộng vào
  BẮT, mỗi cái liệt kê tên để chạy lại.

**Song song / thư mục tạm:**
- Mỗi việc chạy đặt `TMPDIR` = thư mục con trong thư mục tạm của chính nó → `rmtree` dọn được cả `gia_lap_*` khi TREO
  (giả lập chỉ dọn ở `process.on('exit')`, `cong_cu/gia_lap/chay.js:52`); chạy con bằng `start_new_session=True` và giết
  cả nhóm tiến trình khi quá giờ.
- `viec/P26b/thu_kho_ban.js` dùng đường cố định `tmpdir()/p26b_kho_ban.db` (`:5`) — chỉ chạy qua E1 (một mình), TMPDIR
  riêng.
- `-j 3` mặc định; ngay trước C3 không chạy gì khác (đo nối tiếp).
