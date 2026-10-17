# TU-CHAY-8 — trạng thái

## Bước 1 — đối chiếu bản chụp (17.10.2026)
- Nhánh: `viec/TU-CHAY-8`; cây sạch.
- HEAD `41ad9ab` · FETCH_HEAD `41ad9ab` (bằng nhau → không kéo).
- `git log --oneline -3`:
  ```
  41ad9ab PHIEU: TU-CHAY-8
  2b65db4 TIEN-DO: LUOI-4 (8ac79a7), MA-GIAM-1 (5a6fc0f), TU-CHAY-7 (49f9140) xong; mo LUOI-5 + TU-CHAY-8; them TU-CHAY-9, DONG-GOI-1, MA-GIAM-2 — so v36
  49f9140 Merge pull request #31 from pos-tuquyduong/viec/TU-CHAY-7
  ```
- Kho không có ref `origin/main` (`git branch -a` chỉ có `viec/TU-CHAY-8`) → mốc cổng = `41ad9ab^`.

## Bước 3 — kế hoạch
`viec/TU-CHAY-8/ke_hoach.md`. Phiếu dặn **chờ duyệt kế hoạch** → dừng ở đây.

- Soát kế hoạch bằng agent phụ: 4 câu, đã nhận vào cuối `ke_hoach.md`.
- Cổng chạy thử trên máy mây: `✓ CỔNG CHẠY ĐẠT` (~5 phút) — A2 không cần sửa code.

## Câu hỏi
Xem mục `## Câu hỏi` của `ke_hoach.md` (Q1–Q6) — gom một lần. **Chủ quán đã trả lời 17.10** (xem dưới).

## Làm tiếp (tiep) — 17.10.2026

### Bước 1 — đối chiếu bản chụp
- Nhánh `viec/TU-CHAY-8`; cây sạch. HEAD `372ee54` · FETCH_HEAD `372ee54` (bằng nhau → không kéo; hook mở phiên đã kéo 41ad9ab → 372ee54).
- `git log --oneline -3`:
  ```
  372ee54 PHIEU: TU-CHAY-8 Q1 mo thu_gia_lap.js + Q4 mien thu_cong.js (Bai thu cu sua)
  b765688 TU-CHAY-8 trang thai: sua dong Cau hoi bi lap
  6dd324f TU-CHAY-8 ke hoach: nhan soat agent phu (duong song song -r, dong tong cuoi, stub TOCDO1, Q6 banh coc)
  ```

### Chủ quán trả lời (17.10)
Q1 sửa bài giả thu_gia_lap + thêm ca "bài giả im lặng thoát 0 → FAIL" (đỏ trên gốc) · Q2 dạng tổng thứ 4 (giả lập) · Q3 điều phối
trong thu_cong.js, bộ kiểm tự đếm phần · Q4 thu_cong.js miễn, bản gốc chạy trên code PR phải xanh · Q5a chấp nhận · Q5b không làm
(Phát hiện) · Q6 thêm bánh cóc NGUONG_THU_CONG_DON_VI · thêm **A7**: người gác cho `git checkout viec/<MÃ>` khi HEAD tách rời trỏ đúng
commit của nhánh local có phiếu.

### Bước 4 — bài thử trước (đỏ trên gốc `372ee54`)
Bằng chứng: `bang_chung_do.txt`. Đỏ đúng chỗ, không đỏ vì sập:
- `cong_cu/thu_TOCDO1.js` — C3, C4a, C4c (×3), P0–P10 đỏ (bộ kiểm gốc không có `kiemPhanThuCong`, không đòi dòng tổng).
- `cong_cu/thu_gia_lap.js` — C3i đỏ (Q1: bài giả C3 nay in dòng tổng; thêm ca bài im lặng thoát 0; worker ghi thêm lý do FAIL để ca so
  đúng câu kết luận — K3).
- `tu_chay/thu_cong_cu.js` — 4 phép skill TU-CHAY-8 (A2 ×2, A3, A7) đỏ; phép PHIEN_BAN mới (không ghim) xanh trên gốc (1.7.0 có mục THIET_KE).
- `tu_chay/thu_nguoi_gac.js` — 21 ca A3 / A7 đỏ + biến thể tự sinh của `cd <nháp> && node s.js`.
- `tu_chay/thu_cong.js` — miễn (phiếu `## Bài thử cũ sửa`, Q4): không thêm ca; chia lượt bắt bằng `kiemPhanThuCong` của bộ kiểm
  (thu_TOCDO1 mục P) + đột biến `thu_cong_phan` trong `dot_bien.py`.

### Bước 5 — sửa
- `kiem_tra_truoc_khi_giao.js`: `chayBaiThat` đòi dòng tổng (A4, 4 dạng — Q2); `NGUONG_THU_CONG_DON_VI = 126` + `kiemPhanThuCong`, lời gọi
  thu_cong giữ nguyên chữ (C3f / E1) nhưng bọc trong `kiemPhanThuCong(…)`.
- `tu_chay/thu_cong.js`: `--phan i/n` (T = 126 đơn vị = 4 bài nhỏ + 4 khối riêng của baiCong + 118 lời gọi `ca()` lúc chạy, kể cả trong vòng lặp), điều phối 3 phần song song.
- `tu_chay/nguoi_gac.js`: `xetTep` (A3) ở node (script + `-r/--require/--import/--loader`), python3, bash/sh; `RE_BIMAT` một biểu thức; luật mới
  `GIT-CHECKOUT-TACH` (A7) + `veNhanhViec`; `gitGac` (bỏ GIT_*, GIT_CEILING_DIRECTORIES, hạn 10 s).
- `tu_chay/skill_lam_viec.md` (luật cứng A3, bước 1.1 A7, bước 4 + 11.4 A2), `PHIEN_BAN` 1.8.0, `THIET_KE.md` mục TU-CHAY-8.
- Sửa phép cũ `thu_nguoi_gac.js` TU-CHAY-5 B4 (đỏ khi code đúng — K2): nó chấm MỌI lệnh git bước 1 trong kho đang đứng trên nhánh; lệnh
  `git checkout viec/$0` mới chỉ chạy khi HEAD tách rời → chấm lệnh checkout trong `KHO_A7` (tách rời đúng commit). Kho git thật dời lên đầu bài.

### Đo A1 (máy mây 4 lõi, 17.10)
- Chạy liền `--phan 1/1`: 126/126 đơn vị · **337 phép** (= số phép trước khi chia) · 71,7 s.
- Điều phối 3 phần: 337 phép (42 + 42 + 42 đơn vị · 128 + 109 + 100 phép) — 25,7 / 24,2 / 24,2 s (3 lần).
- Từng phần chạy riêng (3 lần): 1/3 22,7 / 22,8 / 24,4 s · 2/3 24,9 / 24,1 / 24,6 s · 3/3 24,3 / 23,8 / 24,6 s — mọi phần < 60 s (50 % hạn 120 s).
- Trong `npm test`: thu_cong 25,3–26,4 s (trước: ~52–96 s).

### Đột biến (`python3 viec/TU-CHAY-8/dot_bien.py`) — bảng chỗ vá → đột biến
Đối chứng 7 bài xanh (thu_TOCDO1 chỉ đỏ đúng D6 đỏ sẵn — tha đúng dòng đó). Vòng 1: **34/35 bị bắt**; `VS-TUCHAY8-DONG-TONG-KHONG-NEO-SO`
SỐNG (chưa ca dòng "đạt · hỏng" không số) → thêm ca C4c (`2223a86`), chạy lại riêng: bị bắt → **35/35**.

| Chỗ vá | Đột biến (bài bắt) |
|---|---|
| kiem_tra `chayBaiThat` đòi dòng tổng (A4) | BV-TUCHAY8-DONG-TONG (thu_TOCDO1 C4a + thu_gia_lap C3i) · VS-TUCHAY8-DONG-TONG-BO-GIA-LAP (C4b) · VS-TUCHAY8-DONG-TONG-KHONG-NEO-SO (C4c) |
| kiem_tra `kiemPhanThuCong` + bánh cóc (A1, Q6) | BV-TUCHAY8-KIEM-PHAN (P2) · VS-TUCHAY8-KIEM-PHAN-CHI-DEM-SO-PHAN (P4) · VS-TUCHAY8-KIEM-PHAN-DEM-DONG (P3) · BV-TUCHAY8-BANH-COC (P7) · VS-TUCHAY8-BANH-COC-LECH-MOT (P7) |
| thu_cong.js chia lượt + điều phối (A1) | BV-TUCHAY8-PHAN-KHONG-CHIA · VS-TUCHAY8-PHAN-LECH-MOT · BV-TUCHAY8-CA-KHONG-LA-DON-VI · VS-TUCHAY8-DIEU-PHOI-BO-PHAN (thu_cong_phan: Σ 378 ≠ 126 / 84 ≠ 126 / 8 < 126 / phần 1,2) · BV-TUCHAY8-DB-THEO-PHAN (thu_cong: thiếu ca) · VS-TUCHAY8-HAN-PHAN-NOI (thu_TOCDO1 P10) |
| nguoi_gac.js `xetTep` (A3) | BV-TUCHAY8-SOI-TEP-NODE · VS-TUCHAY8-SOI-BO-PYTHON · VS-TUCHAY8-SOI-BO-BASH · VS-TUCHAY8-SOI-BO-NAP-KEM · VS-TUCHAY8-MIEN-FILE-SUA-DO · VS-TUCHAY8-MIEN-KHI-GIT-LOI · VS-TUCHAY8-TEP-TO-VAN-DOC · BV-TUCHAY8-SOI-FILE-BI-MAT (thu_nguoi_gac, đúng ca) |
| nguoi_gac.js `veNhanhViec` / GIT-CHECKOUT-TACH (A7) | BV-TUCHAY8-A7 · VS-TUCHAY8-A7-KHONG-SO-SHA · VS-TUCHAY8-A7-CA-KHI-DUNG-TREN-NHANH · VS-TUCHAY8-A7-KHONG-DOI-PHIEU · VS-TUCHAY8-A7-NHIEU-DOI-SO · VS-TUCHAY8-A7-NGOAI-KHO |
| skill (chữ) A2 / A3 / A7 | BV-TUCHAY8-SKILL-B11-CONG-CHAY · BV-TUCHAY8-SKILL-B4-TU-THU · BV-TUCHAY8-SKILL-EDIT · BV-TUCHAY8-SKILL-B1-TACH-ROI (thu_cong_cu) |
| PHIEN_BAN + THIET_KE (chữ, A5) | BV-TUCHAY8-PHIENBAN (thu_cong_cu + thu_nguoi_gac) · BV-TUCHAY8-THIETKE-TIEU-DE (thu_cong_cu + kiem_chu) · BV-TUCHAY8-THIETKE-A3 (kiem_chu) |

### Q4 — bản gốc thu_cong.js trên code PR
`git show 372ee54:tu_chay/thu_cong.js` chép vào cây HEAD giải nén trong nháp, chạy: `thu_cong: 337 phép · 0 chỗ hỏng` — XANH.

## Phát hiện
1. **D6 của `cong_cu/thu_TOCDO1.js` đỏ SẴN trên main** (không do việc này): chú thích trỏ số dòng cứng đếm được 5 > `NGUONG_DONG_CUNG = 4`
   (`grep -n "NGUONG_DONG_CUNG = " kiem_tra_truoc_khi_giao.js`) — `server/routes/orders.js:1640`, `cong_cu/thu_P20.js:432`, `cong_cu/thu_P26c.js:12`, `:357`, `:886`
   (MA-GIAM-1 / LUOI-4 gộp sau TU-CHAY-7). Bộ kiểm chỉ CẢNH BÁO (đúng thiết kế E15) nên `npm test` xanh; nhưng thu_TOCDO1 là bài thử ĐỔI
   trong PR này → cổng `chay` chạy nó trên code PR → đỏ. Sửa nằm ngoài Phạm vi (`server/`, `cong_cu/thu_P*.js` — Cấm, LUOI-5). Xem Câu hỏi Q7.
2. Q5b (chủ quán: không làm): `node < f`, `… | node`, `python3 < f` vẫn chạy nội dung file mà người gác không soi.
3. `npm run <x>` / `npm test` chạy script của `package.json` — không soi (file luật, sửa phải ghi đúng tên trong Phạm vi). Ghi ở THIET_KE.
4. File do script `require`/`import` không soi (bắc cầu) — ghi ở THIET_KE "lỗ còn hở".
5. Hệ quả Q5a đã thấy ngay trong việc này: máy không chạy được lệnh `python3 - <<EOF` có chữ SECRET/TOKEN (B-BIMAT-CHU, luật cũ) → sửa
   bằng công cụ Edit — đúng câu skill mới. Bài thử / bộ kiểm đang sửa có cụm đó: dưới người gác mới phải commit trước hoặc chạy qua `npm test`.

## Câu hỏi
- **Q7 (D6 đỏ sẵn × cổng chạy):** CỔNG CHẠY của PR này sẽ có `✗ [A11]` "cong_cu/thu_TOCDO1.js ĐỎ trên code PR" chỉ vì D6 (Phát hiện 1).
  Chọn: (a) **[đề xuất]** việc sau (hoặc LUOI-5 đang giữ thu_P*.js) đổi 5 chú thích đó sang tên hàm / mẫu grep — PR này chờ nó gộp, rồi
  gộp main vào nhánh; (b) chủ quán duyệt nâng `NGUONG_DONG_CUNG` 4 → 5 trong PR này (nới bánh cóc — KHÔNG tự làm); (c) chấp nhận A11 đỏ
  vì lý do ngoài PR. Máy không sửa D6, không nới ngưỡng.

## Soát độc lập (bước 8)

### Vòng 1 — báo cáo nguyên văn của agent soát (HEAD lúc soát 2766e72)
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. tu_chay/nguoi_gac.js:543-550 (cùng xetBash :358-368) — A3 lách được bằng ghi rồi chạy trong CÙNG một lệnh: người gác đọc file
   lúc xét, trước khi lệnh chạy; file chưa có → catch return null cho qua; file đang vô hại cũng qua. Đo được CHO cả bốn:
   `cp <nháp>/s.js <nháp>/b.js; node <nháp>/b.js` · `cp <nháp>/s.js <nháp>/vo_hai.js && node <nháp>/vo_hai.js` ·
   `cat <nháp>/s.js > <nháp>/c.js && node <nháp>/c.js` · `echo 'console.log(process.env)' > <nháp>/moi.js && node <nháp>/moi.js`.
   Bài thử còn khoá hành vi nguy hiểm: thu_nguoi_gac.js:635 [node ${N}/khong_co.js, 'CHO']. Đường miễn cũng lọt:
   `cp <nháp>/s.js viec/X/dot_bien.py && python3 viec/X/dot_bien.py`. K3 + K4.
2. tu_chay/nguoi_gac.js:538-539 — ngoài kho + ngoài nháp thì không soi, nhưng ~/.claude/plans máy Write được (G-PLANS :181):
   `node ~/.claude/plans/p.js` CHO. THIET_KE "Lỗ còn hở" không ghi. K4.
3. tu_chay/nguoi_gac.js:495, :503-507, :511 — `node --experimental-loader=<nháp>/s.js …`, `node --test-reporter=<nháp>/s.js --test …`,
   `cd <nháp> && node --test` đều CHO. K4.
4. tu_chay/nguoi_gac.js:504 — `node --import 'data:text/javascript,console.log(process.env)' -e 1` CHO. K4.
5. tu_chay/nguoi_gac.js:494,499 (có từ trước) — `node -pe 'process.env'` CHO trong khi `node -e 'process.env'` CHẶN. K4.
6. tu_chay/skill_lam_viec.md:23-25, :57-67 — chặn nhầm luồng chạy bài thử trên cây gốc giải nén trong nháp (bước 4, chính việc này
   dùng: bang_chung_do.txt:12, :46): nháp luôn soi mà 11 file thu_*.js đều có cụm cấm. ke_hoach.md:110-113 không liệt kê luồng này. K5.
7. viec/TU-CHAY-8/trang_thai.md:85 — trích kiem_tra_truoc_khi_giao.js:573, ở HEAD là :576. K1.
8. viec/TU-CHAY-8/ke_hoach.md:150-151 — "phép THIET_KE là thứ duy nhất làm 'quên đổi phiên bản' lộ ra" sai: phép chỉ bắt "nâng
   PHIEN_BAN mà quên ghi THIET_KE". K1 (nhẹ).
NGHI NGỜ: thu_gia_lap.js:175-178 sửa C3_WORKER (ghi.ly, callback chac) — cần chủ quán xác nhận nằm trong Q1 · "chạy SONG SONG" của A1
   chưa có ca hành vi (P10 chỉ regex tĩnh; điều phối tuần tự hay dòng chú thích vẫn xanh) — song song chứng minh bằng số đo · luật nội
   dung là regex, chuỗi ghép `process['en'+'v']` qua được (có sẵn, THIET_KE không ghi) · git status không --literal-pathspecs.
NGHIỆM THU: 5/7 mục có bằng chứng · mục thiếu: A3 (ca chính lách được — lỗi 1–4), A6 (chưa có CỔNG CHẠY trên HEAD; theo Q7 sẽ ✗ [A11]).
CHƯA SOÁT ĐƯỢC: hook thật vẫn bản 1.7.0 (A3/A7 chỉ chứng minh qua xet()) · không chạy lại dot_bien / cổng chạy · Replit 1 lõi ·
   node --test dựa tài liệu · A7 trên phiên máy mây thật mở ở HEAD tách rời.
BÀI HỌC: KHOÁ — ca ghi-rồi-chạy cùng lệnh; node <nháp>/khong_co.js; ~/.claude/plans; --experimental-loader= / --test-reporter= /
   --import data:; node --test; node -pe 'process.env'. NGUYÊN TẮC (K3/K4) — phép "đọc file rồi cho chạy" xét trạng thái TRƯỚC khi lệnh
   chạy: phải xét cả việc chính lệnh đó ghi file (TOCTOU); "không đọc được → cho" là mở cửa; chọn "nơi soi" phải liệt kê MỌI chỗ máy ghi
   được. NGUYÊN TẮC (K5) — luật người gác mới phải liệt kê luồng "chạy bài thử trên cây gốc trong nháp".
```
(Bản trên rút gọn phần "ĐÃ XÁC NHẬN" — K4 A4 11 lời gọi chung một hàm, mọi bài in dòng tổng; K4 A1 118 + 4 + 4 = 126; K4 A7 một chỗ
checkout; không đụng server/ client/src; 15 file trong Phạm vi; D6/Q7 đúng — và mục ĐƠN GIẢN: thu_cong.js:785 viết gọn.)

### Sửa vòng 1
- Lỗi 1: `motMinh` — lệnh chạy file script phải đứng MỘT MÌNH (chỉ `cd … &&` trước; sau chỉ head/tail/grep/wc/cut/tr/nl/cat, không
  chuyển hướng ghi, không `$( )`), một lệnh một file. Vì vậy file "không có lúc xét" không còn ai tạo kịp → giữ "không có → cho" cho script.
- Lỗi 2: soi MỌI nơi (bỏ "ngoài kho + nháp thì thôi") — gồm ~/.claude/plans và /tmp (mã viết thẳng ghi được).
- Lỗi 3–5: `NODE_NAP` thêm `--experimental-loader`, `--test-reporter`; `--x=<file có thật>` (vd `--env-file=.env` → B-BIMAT-FILE) và
  `data:`/`file:` là nạp kèm; giá trị nạp kèm không phải file → soi chính chữ; `node --test` chặn; `-pe` gộp cờ đọc mã.
- Lỗi 6: miễn đổi từ "git status rỗng" sang "NỘI DUNG file là blob trong lịch sử HEAD" (`git hash-object` + `git rev-list --objects HEAD`,
  22 ms ở kho nông này): file đã commit sạch, bản cũ trong lịch sử, bản sao cây gốc trong nháp đều miễn; blob chỉ trong chỉ mục (add rồi
  restore --staged) KHÔNG miễn. Skill + THIET_KE ghi lại.
- Lỗi 7, 8: sửa trích số dòng (grep), ghi chú câu sai trong ke_hoach.md. Mục ĐƠN GIẢN thu_cong.js: viết gọn.
- Nghi ngờ: thu_gia_lap C3_WORKER — chỉ thêm `ghi.ly` + đối số thứ ba của `chac` để C3i so câu kết luận (K3), không đổi ca / neo khác —
  báo chủ quán xác nhận thuộc Q1. "Song song": giữ chứng minh bằng số đo (ghi CHƯA KIỂM). Chuỗi ghép: thêm vào "Lỗ còn hở" THIET_KE.
  `--literal-pathspecs`: hết đối tượng (bỏ `git status`).
- Bài thử: thu_nguoi_gac 968 → 1003 ca (ghi-rồi-chạy cùng lệnh, K5 đứng một mình, plans / ngoài kho, cờ node, `data:`, -pe, --test,
  miễn theo lịch sử, cp qua file đã commit); bản cuối trên gốc 956/1003 (đỏ, bang_chung_do.txt). Đột biến A3 viết lại theo code mới.
- Đột biến lượt 2 (cả bộ, code sau vòng 1): **47/48**; `BV-TUCHAY8-NODE-TEST` bị bắt nhưng ở ca khác (`cd <nháp> && node --test` vẫn chặn
  nhờ nhánh thư mục) → neo lại vào ca `node --test <nháp>/vo_hai.js`, chạy riêng: bị bắt → **48/48**. Tên mới vòng 1: BV-TUCHAY8-MIEN-LICH-SU ·
  VS-TUCHAY8-MIEN-MOI-BLOB · VS-TUCHAY8-MIEN-KHI-GIT-LOI (viết lại) · BV-TUCHAY8-MOT-MINH · VS-TUCHAY8-MOT-MINH-TRUOC-BAT-KY ·
  VS-TUCHAY8-MOT-MINH-SAU-TU-DO · VS-TUCHAY8-MOT-MINH-SAU-GHI-FILE · VS-TUCHAY8-MOT-MINH-CHO-CON · VS-TUCHAY8-CHI-SOI-KHO-NHAP ·
  BV-TUCHAY8-MOT-TEP · BV-TUCHAY8-NODE-TEST · VS-TUCHAY8-KEM-DATA-KHONG-SOI · VS-TUCHAY8-BO-CO-GIA-TRI-FILE · VS-TUCHAY8-NAP-THIEU-LOADER ·
  BV-TUCHAY8-NODE-PE. Bỏ: VS-TUCHAY8-MIEN-FILE-SUA-DO (hết `git status`).
- `npm test -- --day-du` sau vòng 1: PASS 67 · FAIL 0 · CẢNH BÁO 4 (route GET ghi, chú thích số dòng 5 > 4, hai cảnh báo chờ cài `.claude/`).
