# TU-CHAY-7 — trạng thái

## Bước 1 — đối chiếu bản chụp (16.10.2026)
- nhánh: viec/TU-CHAY-7 · cây sạch trước khi ghi
- HEAD 6cb52fa · FETCH_HEAD 6cb52fa → bằng nhau, không kéo
- git log --oneline -3:
  - 6cb52fa PHIEU: TU-CHAY-7
  - 8194c9c TIEN-DO: AUDIT-4 (ddc42d2), P20c (d47b81c) xong; AU4-16 = A; mo LUOI-4 + MA-GIAM-1 + TU-CHAY-7; them LUOI-5, AUDIT-5 — so v35
  - ddc42d2 Merge pull request #28 from pos-tuquyduong/viec/AUDIT-4

## Bước 3 — kế hoạch
- `ke_hoach.md` bản 1 commit 25f1429 (hook Stop đòi commit file chưa theo dõi trước khi soát xong); bản 2 sửa theo soát.
- Phiếu dặn "Chờ duyệt kế hoạch" → DỪNG. Thêm: hai chỗ CHẶN cần chủ quán quyết (Q1, Q2).

## Làm tiếp (tiep) — 16.10.2026
- Bước 1: HEAD f6fa48d · FETCH_HEAD 839ba54 → HEAD là tổ tiên → `git pull --no-rebase --ff-only` → 839ba54
  (839ba54 PHIEU: TU-CHAY-7 mo Pham vi (Cau hoi 1: 2 dong ghim PHIEN_BAN) · f6fa48d TU-CHAY-7: ke hoach ban 2 … · 25f1429 TU-CHAY-7: ke hoach …).
- Chủ quán chốt: Q1 → thêm `tu_chay/thu_cong_cu.js`, `tu_chay/thu_nguoi_gac.js` vào Phạm vi, CHỈ đổi dòng ghim PHIEN_BAN. Q2 → (a). Chia lượt
  thu_cong: chỉ ghi Phát hiện. Bài thử ~100 dòng: chấp nhận. Giữ nguyên 12 cụm chữ KHUON_LOI mà thu_cong_cu.js kiểm.
- Đếm lại A3 theo DÒNG với regex thật của bộ kiểm: 4 dòng (`server/routes/orders.js:1633`, `cong_cu/thu_P26c.js` dòng 12, 357, 846) →
  `NGUONG_DONG_CUNG = 4` (bản trước ghi "4 lần khớp, :12 có 2 lần" — dòng 846 cũng khớp, nên theo dòng vẫn 4).

### Lệch so với kế hoạch bản 2 (ghi rõ)
1. `thu_gia_lap.js` A2 cần THÊM bước dừng giả lập con khi bị ngắt (`CON` + `NGAT`, ~10 dòng) — bản chỉ có exit + tín hiệu (khuôn don_rong.js)
   chạy 3 lần: SIGTERM/SIGINT sót `thu_gl_*` 1/3, 2/3, 1/3 lần (giả lập con còn ghi vào TAM sau khi dọn); thêm dừng con → exit 1 thay 130 ở
   3/6 ca (luồng chính chạy tới `ket()` trước) → cờ `NGAT`. Sau cả hai: 3/3 lần xanh (148 đạt). Hạn thật của bộ kiểm khi bị ngắt: thêm tối đa
   10 s chờ con (SIGKILL sau 10 s) — có giới hạn, không phải nới vô hạn như hàm nghe tín hiệu ở bài đồng bộ.
2. `thu_TOCDO1.js` regex dòng gọi trần (bản trước TOC-DO-1) KHÔNG đổi — chỉ dùng khi bộ kiểm chưa có `lyDoChayThuCong`; neo `GOI` (E1) đổi
   sang tiền tố, đủ.
3. Ca "con cháu lúc giết đã chết" (DON) xanh cả trên gốc (mồ côi tự chết < 2 s) → không phải bằng chứng cho vế dừng con; đột biến bỏ dừng
   con KHÔNG tất định (sót 1/3–2/3) → CHƯA KIỂM, không đưa vào dot_bien.py (K3).

### Đột biến — `python3 viec/TU-CHAY-7/dot_bien.py` → 23 bị bắt · 0 KHÔNG bị bắt (trên 23); đối chứng 6 bài xanh trước
| chỗ vá | đột biến | ca bắt |
|---|---|---|
| A1 kiem_tra lời gọi thu_cong | BV-TUCHAY7-CANH-THUCONG · VS-TUCHAY7-CANH-FALSE · VS-TUCHAY7-HAN-NOI | thu_TOCDO1 C1 · C1 · C2 |
| A2 thu_cong.js exit / pid | BV-TUCHAY7-DON-EXIT-THUCONG · BV-TUCHAY7-DON-PID-CHET · VS-TUCHAY7-DON-CA-PID-SONG · VS-TUCHAY7-DON-TAM-KHONG-PID | thu_cong "TU-CHAY-7 A2 con het" |
| A2 thu_gia_lap.js tín hiệu / exit | BV-TUCHAY7-DON-GL-TINHIEU · VS-TUCHAY7-DON-GL-CHI-SIGINT · VS-TUCHAY7-DON-GL-QUEN-EXIT | DON SIGTERM · DON SIGTERM · DON chạy hết |
| A3 kiem_tra E15 | BV-TUCHAY7-DONG-CUNG-BO-CANH · VS-TUCHAY7-DONG-CUNG-GACH · VS-TUCHAY7-DONG-CUNG-NGUONG · VS-TUCHAY7-DONG-CUNG-LAN · VS-TUCHAY7-DONG-CUNG-FAIL · VS-TUCHAY7-DONG-CUNG-VUNG · VS-TUCHAY7-DONG-CUNG-CA-DONG | D2 · D3 · D1 · D7 · D9 · D8 · D4 |
| A4 KHUON_LOI (chữ) | BV-TUCHAY7-KHUONLOI-SO-BANG · BV-TUCHAY7-KHUONLOI-VI-TU · BV-TUCHAY7-KHUONLOI-TUNG-TEN · BV-TUCHAY7-KHUONLOI-101-DONG | kiem_chu (bài trong dot_bien.py) |
| A5 PHIEN_BAN / THIET_KE (chữ) | BV-TUCHAY7-PHIENBAN-CU · BV-TUCHAY7-THIETKE | thu_cong_cu E3 + thu_nguoi_gac · kiem_chu |
Không đưa vào (không tất định — K3, ghi CHƯA KIỂM): bỏ bước dừng giả lập con (sót 1/3–2/3 lần), bỏ cờ `NGAT` (thoát 1 thay 130 ở 3/6 ca).

### Kiểm (bước 6)
- `node kiem_tra_truoc_khi_giao.js --day-du` → thoát 0 · PASS 68 · FAIL 0 · CẢNH BÁO 2: (1) route GET có lệnh ghi (có sẵn, TU-CHAY-6);
  (2) `.claude/tu_chay/` khớp từng byte — lệch PHIEN_BAN, THIET_KE.md, thu_cong.js, thu_cong_cu.js, thu_nguoi_gac.js (chờ chủ quán `cai_dat.sh`).
  Thời gian: thu_cong 92,7 s (77 %, chưa tới 96 s → không cảnh báo A1), giả lập 34,0 s, thu_gia_lap 62,6 s.
- Đo riêng thu_gia_lap: gốc 839ba54 50,5 s · bản vá 62,4 s → DON thêm ~12 s (52 % hạn). Hồ sơ TACH-GL ghi 36,9–38,4 s — máy này chậm hơn.
- ~~`npm test` chạy trong hook pre-commit của 4 commit …~~ SAI (K1, tự bắt ở vòng sửa 1): máy mây KHÔNG cài hook — `.git/hooks/` chỉ có
  `*.sample`, `git rev-parse --git-path hooks` = `.git/hooks`. Bộ kiểm chỉ chạy khi gọi tay: `node kiem_tra_truoc_khi_giao.js` sau khi vá
  (PASS 64 · FAIL 0 · CẢNH BÁO 2, thu_cong 88,9 s) và `--day-du` ở trên.
- `node tu_chay/cong.js tinh . 6cb52fa^ HEAD viec/TU-CHAY-7` (trước khi ghi bảng này): ✗ A8 (bình thường — chủ quán cài sau), ✗ A17 (đã ghi bảng
  trên), ✗ A19 (bước 11.4).
- K4 neo hồ sơ cũ: `python3 viec/HOC-2b/kiem_neo.py` gốc vs HEAD — đúng MỘT neo mới rữa: HOC-2b `VS-C3-bat-qua-bien` (neo nguyên chữ lời gọi
  thu_cong cũ). Cùng khuôn ngoài kiem_neo: `viec/TOC-DO-1/dot_bien.py` dòng 31. Hồ sơ đã đóng, ngoài Phạm vi → Phát hiện. Ý canh của
  VS-C3 (cờ bật qua biến) vẫn được C3f giữ: lời gọi mới viết chữ `true` thẳng.

## /ra-soat vòng 1 — báo cáo agent soát (chép nguyên)
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. viec/TU-CHAY-7/trang_thai.md — thiếu hẳn danh sách "từng dòng bỏ và lý do", điều kiện bắt buộc của A4 (grep chỉ ra dòng 19, 40, 65). K1/K6.
2. KHUON_LOI.md:13-14 (K1) — mất nghĩa: bỏ "Số dòng trích của file ĐANG sửa trong cùng việc: kiểm lại ở commit cuối (B5 thu_cong.js
   643 → 648 → 647)", thay bằng "số dòng cứng trong chú thích ← phép E15" — E15 (kiem_tra:573-593) chỉ quét CHÚ THÍCH CODE dạng (:N) / :N–M;
   số dòng trong hồ sơ / báo cáo / trang_thai và dạng file.js:NNN không máy nào canh. K4: phép mới không phủ đủ đối tượng câu cũ hứa.
3. tu_chay/thu_cong.js:35 — đặt biến THU_CONG_CON thì cả bài in một dòng rồi process.exit(0) trước mọi phép. kiem_tra:641 gọi với env =
   undefined (kế thừa môi trường); chayBaiThat (478-490) chỉ xét mã thoát 0 và dòng ✗, không đòi dòng tổng → `THU_CONG_CON=het npm test` cho
   thu_cong "xanh" 0 phép, kể cả trong hook pre-commit. K3 (xanh oan), khoá hở (C16). Cùng khuôn nhẹ hơn: THU_GL_CON ở thu_gia_lap.js:319
   (thu_gia_lap chạy với MT_SACH — chưa đọc xem có lọc không).
4. cong_cu/thu_gia_lap.js:90 (chayDon) — con sinh ở đây KHÔNG vào CON (3 chỗ spawn: 74, 90, 123; chỉ 74, 123 có CON.add). Bị ngắt trong đợt
   DON → handler thấy CON rỗng, thoát 130, xoá TAM; ba con thu_gia_lap chạy mồ côi tới 90 s. K4.
5. KHUON_LOI.md — giảm số dòng chủ yếu nhờ nới khổ dòng (dòng > 125 ký tự: gốc 13, HEAD 28; dài nhất 136 → 141; tổng ký tự −2,5 %, số dòng
   −14 %); năm câu tự hỏi dồn 2 câu một dòng; hai dòng `---` bị xoá. K1/K6.
6. viec/TU-CHAY-7/dot_bien.py:146 — trái luật vừa ghi (KHUON_LOI:41-43 "không dò chuỗi"): nhận bài sập bằng regex `\bsập: |\bném: `, không
   khớp dòng sập của thu_gia_lap (`✗ bài thử sập  — …`). K6.
7. tu_chay/thu_cong.js:28 và :31 — fs.rmSync không bọc try (khác thu_gia_lap.js:45): vòng dọn đầu bài gặp thư mục người dùng khác (EACCES) thì
   sập ở đầu file; hàm dọn lúc thoát ném thì đổi mã thoát. K4/K7.
8. tu_chay/THIET_KE.md:906 — "88,9–89,5 s" không có trong hồ sơ TU-CHAY-7 (trang_thai chỉ ghi 89,5 s và 92,7 s). K1.
NGHI NGỜ: cảnh báo A1 có thể kêu thường (npm test của người soát: thu_cong 96,3 s, có thể bị phình vì lần chạy trước còn song song) — K8
  chiều ngược, cần số đo Replit; lỗ phủ E15 (khối chú thích nhiều dòng không mở bằng *, chuỗi có // rồi (:N), D4 không ca chuỗi chứa //);
  thu_TOCDO1 (C, D) không do npm test / cổng chạy (khuôn có từ mục R TU-CHAY-6); ca "con het/nem" gộp 3 điều kiện; C1 dư 0,75 s; hạn thực tế
  dài thêm ≤ 10 s khi bị ngắt — chủ quán chưa chốt; conChau (/proc) thêm phức tạp mà không phải bằng chứng.
NGHIỆM THU: 4/6 · thiếu: A4 (danh sách dòng bỏ, mất nghĩa K1, nới khổ), A6 (npm test của người soát 3 cảnh báo; chưa HEAD ĐÃ KIỂM; CON/NGAT
  không VS-/BV-).
CHƯA SOÁT ĐƯỢC: không chạy dot_bien.py, --day-du, thu_gia_lap; không thử giết thu_gia_lap thật trong đợt DON; không xác minh hook pre-commit
  đang cài; đường tiền, P1 không áp dụng; K5 không thấy luồng hợp lệ bị chặn.
BÀI HỌC: KHOÁ — bộ kiểm chạy bài thật nên đòi dòng tổng hoặc gỡ biến *_CON khỏi môi trường con; KHOÁ — F3 thêm trần độ dài dòng (khuon_loi
  ăn gian được bằng nới khổ); KHOÁ — thu_TOCDO1.js chạy trong bộ kiểm (1,7 s); NGUYÊN TẮC (K4) — thêm tập theo dõi con thì grep MỌI chỗ
  spawn; NGUYÊN TẮC (K1/K4) — bỏ câu KHUON_LOI vì "máy đã thay" thì phép phải phủ ĐỦ đối tượng câu hứa, kèm grep; NGUYÊN TẮC (K6) — công cụ
  của chính việc theo luật việc vừa ghi.
```

### Xử lý vòng sửa 1 (1/3)
1. **Lỗi 1, 2, 5** — KHUON_LOI viết lại theo ĐOẠN, gói bằng công cụ ở khổ cố định 126 ký tự (dài nhất 126 < 136 của gốc; 9 dòng > 125 so với
   13 ở gốc). Đo công bằng: gốc gói cùng khổ = 119 dòng → bản mới 100 dòng = giảm THẬT 19 dòng (bản vòng 0: 111 ở cùng khổ — agent soát đúng).
   Năm câu lại mỗi câu một dòng. Tự soát thêm (ngoài báo cáo): bản vòng 0 còn mất 7 ý khác — đã khôi phục (xem bảng dưới, cột "khôi phục").
2. **Lỗi 3** — chế độ con chỉ nhận `THU_CONG_CON=<het|nem>:<pid cha>` và `process.ppid` khớp; ca mới "THU_CONG_CON lạc (không pid cha) →
   không vào chế độ con" (chạy SAU hai lượt het/nem — đặt trước thì lần chạy đầu đỏ oan: con bị giết chưa chết hẳn, lượt het chưa dọn được
   thư mục của nó; và ca bản đầu quên tạo TMPDIR của con → con nào cũng chết ở mkdtemp, đỏ oan cả trên bản vá — K3, đã sửa). Đỏ trên gốc
   đúng lý do: "thoát 0 · TAM …" (bang_chung_do.txt). Đột biến VS-TUCHAY7-CON-KHONG-KIEM-CHA đưa ĐÚNG lỗi cũ trở lại. THU_GL_CON: bộ kiểm
   chạy thu_gia_lap với MT_SACH (kiem_tra :841 lọc còn PATH|HOME|TMPDIR|LANG|LC_ALL|SYSTEMROOT) → không lọt qua bộ kiểm; chạy tay với biến
   lạc chỉ bỏ 3 ca DON — ghi, không vá.
3. **Lỗi 4** — chayDon thêm `CON.add` (3/3 chỗ spawn). Không có đột biến tất định (cùng lý do CON/NGAT — CHƯA KIỂM).
4. **Lỗi 6** — luật sập của dot_bien.py thêm `✗ bài thử sập` (dòng sập của thu_gia_lap). Vẫn là dò chuỗi — tạm tới TU-CHAY-8 (quy ước mã thoát
   2 = sập); câu KHUON_LOI sửa thành "không dò chuỗi trong chi tiết dòng ca (AU4-17)" — đúng cái dot_bien đang làm (dò dòng sập riêng, không
   dò chi tiết ca).
5. **Lỗi 7** — hai fs.rmSync của thu_cong.js bọc try.
6. **Lỗi 8** — 88,9 s là lần `node kiem_tra_truoc_khi_giao.js` đầu tiên của lượt làm tiếp (bộ kiểm in "thu_cong.js xanh (88.9 s)", chạy riêng);
   THIET_KE sửa thành "88,9–92,7 s (74–77 %, số đo ghi ở viec/TU-CHAY-7/trang_thai.md)". Số đo vòng sửa 1: thu_cong 94 s (337 phép, chạy
   riêng — ca "lạc" thêm ~3 s) = 78 %, sát ngưỡng cảnh báo 96 s.
7. **Thêm (tự tìm khi sửa lỗi 4):** lần chạy dot_bien.py đầu để sót `/tmp/thu_gl_p24O0w` (đột biến VS-TUCHAY7-DON-GL-QUEN-EXIT gỡ đúng phần
   dọn, bài chạy với /tmp chung). dot_bien.py giờ đặt TMPDIR trong bản sao (os.putenv) → sót gì cũng bị rmtree xoá; chạy lại đột biến đó: 0 sót
   mới. Thư mục cũ: người gác chặn rm ngoài nháp → chủ quán dọn `rm -rf /tmp/thu_gl_p24O0w`.
8. Nghi ngờ "cảnh báo A1 kêu thường": số đo chạy riêng 88,9–94 s (74–78 %) — đúng hành vi phiếu muốn (báo trước khi chạm hạn); kêu khi máy bận
   là đúng thiết kế, KHÔNG nới — chia lượt thu_cong (Phát hiện) là cách hạ. Nghi ngờ "thu_TOCDO1 không do npm test chạy": ngoài Phạm vi việc này
   (đổi danh sách bài của bộ kiểm = đổi khung kiểm) → đề xuất ở Bài học. conChau: giữ — rẻ, canh con mồ côi treo (không phải bằng chứng vế dừng con).

### A4 — từng chỗ bỏ / gộp (gốc 116 dòng → 100; ở cùng khổ 126: 119 → 100)
| gốc (dòng) | xử lý | lý do / phép máy thay |
|---|---|---|
| 3–6 lời mở | bỏ "Biết khuôn thì chặn được trước khi giao."; thêm "kiểm lại trên HEAD ← A19" | câu hiển nhiên (tiêu đề đã "đọc TRƯỚC"); A19 cưỡng chế (cong.js A19) |
| 8, 104 `---` + dòng trống | bỏ | trang trí, không nghĩa |
| 13–14 Dấu hiệu K1 | rút "về file đọc", "trong" | câu ngắn hơn, cùng nghĩa |
| 17–19 K1 TU-CHAY-6 | gộp; giữ đủ 3 ý (chú thích = khẳng định; phiếu = hồ sơ, mở hồ sơ gốc kiểm lại; số dòng file đang sửa kiểm lại ở commit cuối) + ghi E15 chỉ canh chú thích code | khôi phục (lỗi soát 2) |
| 30–33 K3 | bỏ ví dụ "(thiếu file cũng thoát 1)", "ca gộp luôn đỏ nhờ phép khác; hai cổng chồng nhau cũng thế" gộp vào "(P26b: cổng đơn che cổng yêu cầu)" | ví dụ trùng ý câu chính |
| 34–36 K3 | bỏ "không chỉ soi chữ ký hàm", "C3g, C3h" → "HOC-2b"; THÊM câu phiếu "Ngưỡng về hằng số TẤT ĐỊNH thì so bằng, không so một chiều" | "khoá bằng ca KHÔNG truyền đối số" đã nói đủ; khôi phục "so bằng /", "Kịch bản X phủ nhánh Y" |
| 37–39 K3 | bỏ "con số 'đạt' phải kèm lần chạy lại trên HEAD" (← A19, ghi ở lời mở), "(neo dài rữa sau vài việc)" | A19 cưỡng chế; lý do của câu, không phải luật — khôi phục "không đếm là phép" |
| 40–42 K3 TACH-GL | bỏ "(T9)", "(T9 vòng 3:" | mã ca cũ; giữ ví dụ `lượt k/L pid` |
| 43–45 K3 TU-CHAY-5 | bỏ "(ca theo từng lệnh trong skill →", "cổng so số ca báo oan", "A19 `.pop()`" | giữ con số 927/933 và `cong.yml` — ví dụ còn đủ |
| 46–48 K3 | gộp câu phiếu "bộ đột biến chạy được TỪNG TÊN + ĐỐI CHỨNG + luật sập rõ — không dò chuỗi (AU4-17)"; bỏ "nên vá sai công thức vẫn ra đúng số" | giải thích của con số đã nêu |
| 51–53 K4 | thân + Dấu hiệu gộp lại; thêm ví dụ TU-CHAY-7 (2/3 chỗ spawn) | cùng nghĩa |
| 57–58 K4 | thêm "bỏ một lời dặn vì 'máy đã làm' thì phép phải phủ ĐỦ đối tượng" | bài học soát vòng 1 (lỗi 2); khôi phục "không theo một nhánh kết quả" |
| 59–60 K4 argv | mở rộng sang biến môi trường; ví dụ TACH-GL rút gọn + TU-CHAY-7 THU_CONG_CON | bài học soát vòng 1 (lỗi 3) |
| 61–63 K4 | bỏ "khối lọc màu chép sang hàm mới →", "đổi tên phép → mẫu đột biến LẠC" | còn hai ví dụ cùng loại |
| 64–65 K4 SO-LUONG-1 | gộp với câu phiếu "MỘT vị từ cho cả 'có gì để làm' và 'làm'"; bỏ "SĐT đã chuẩn hoá, không phải giá trị thô", "ở orders.js:198" | ví dụ `" "` lọt qua `customer_phone` thô đã nói đủ; khôi phục "chép cổng có sẵn thì chép luôn lỗ của nó" |
| 66–67 K4 TU-CHAY-6 | rút còn 2 dòng | cùng nghĩa |
| 73–75 K5 | — | khôi phục "luồng đổi chính thứ làm chuẩn so sánh" |
| 76–78 K5 | bỏ "(có bản sao chỉ chép tu_chay/ hoặc server/)" | ví dụ |
| 80–83 K6 | Dấu hiệu "giao xong mới chạy bộ kiểm" → "cổng PR (A13) + hook pre-commit khi đã cài — máy mây KHÔNG có hook: tự chạy `npm test` trước commit" | cổng A13 (cong.js chạy lenh_bai_thu trên code PR) cưỡng chế ở PR; hook chỉ ở máy đã chạy `cai_git_hook.sh`; thêm "công cụ của việc theo luật việc vừa ghi" (soát lỗi 6) |
| 85–92 K7 | gộp Dấu hiệu vào Chặn; "bảo chạy npm run kiem ở POS" → "lệnh theo trí nhớ kho kia (CLAUDE.md §3)"; bỏ "→ Everything up-to-date", "require('./kich_ban.js') hỏng văng thô" | trùng CLAUDE.md §3; chi tiết ví dụ |
| 93–94 K7 GOI-2 | bỏ "ở ngưỡng 30 ngày" | chi tiết ví dụ |
| 101–102 K8 | "chiều ngược" gộp vào Chặn; bỏ "đo lúc máy chạy việc khác ra" | giữ con số 91 s / 51 s |
| 114–116 | "Phát hiện lỗi mới: …mở K9 — ghi ngay" gộp vào dòng cuối | trùng skill bước 11.2 |

## Số đo (máy mây 4 lõi, chạy riêng, gốc 6cb52fa)
- `node tu_chay/thu_cong.js`: 89,5 s (334 phép, xanh) = 75 % hạn 120 s.
- `node cong_cu/thu_TOCDO1.js`: 1,7 s (42 đạt) — bộ kiểm không gọi bài này qua `chayBaiThat` (chỉ nhắc ở chú thích `kiem_tra :529`, `:602`).
- A3: mẫu `\(:\d+\)|:\d+[–-]\d+` trong chú thích của 79 file phạm vi → 4 lần khớp (`server/routes/orders.js:1633`, `cong_cu/thu_P26c.js` ×3,
  trong đó `:12` có 2 lần) — ngưỡng đếm theo DÒNG, chốt lại khi làm.

## Soát kế hoạch (agent phụ chỉ đọc) — lỗi bản 1, đã sửa ở bản 2
1. A5 đổi PHIEN_BAN làm đỏ `tu_chay/thu_cong_cu.js:459` + `tu_chay/thu_nguoi_gac.js:709` (ngoài Phạm vi) — đã kiểm bằng sed, đúng → Q1.
2. `thu_cong.js` đồng bộ: hàm nghe tín hiệu không chạy được, còn gỡ chết-ngay mặc định → nới hạn 120 s → Q2. Bản 1 nói "+1–3 s" là SAI.
3. KHUON_LOI có 12 cụm bị `thu_cong_cu.js:457–458, :467–468` neo → giữ nguyên khi gộp.
4. Mục R `thu_TOCDO1.js:119–126` cắt `xetBanhCoc`…`\n}\n` và đếm `xetBanhCoc(` = 2 → hàm A3 đặt sau khối, không dùng lại xetBanhCoc.
5. Ca thiếu: SIGINT, đường `exit` khi chạy hết, giết giữa lúc giả lập con chạy, danh sách file quét A3, vế "không FAIL", đếm theo dòng.
6. Ca tín hiệu thu_gia_lap không chạy chung đợt T3–T6 (`thu_gia_lap.js:271–272`).
7. Số dòng sai: thu_TOCDO1 regex `:27` (không :28); don_rong `:14–16`; K1 `:17–19`; K5 `:76–78`; T3 skill không cảnh báo.
8. C1 dùng cặp 4,25 s / 5 s (bản 1: 1,7 / 2 s dư quá mỏng).

## Câu hỏi
- **Q1 (Phạm vi — A5):** đổi `tu_chay/PHIEN_BAN` sang `tu-chay 1.7.0` thì `tu_chay/thu_cong_cu.js:459` và `tu_chay/thu_nguoi_gac.js:709` (cả hai
  chạy trong `npm test`) đỏ vì đòi đúng chữ `tu-chay 1.6.0`. Hai file ngoài Phạm vi. Đề xuất: thêm cả hai vào `## Phạm vi`, mỗi file sửa một
  dòng (1.6.0 → 1.7.0, ghi "TU-CHAY-7 A5"). Không thêm thì A5 + A6 không đạt cùng lúc.
- **Q2 (A2 thu_cong.js — cách làm khác phiếu):** `thu_cong.js` chạy đồng bộ liền một mạch, Node chỉ chạy hàm nghe SIGINT/SIGTERM khi vòng sự kiện
  quay → hàm nghe không bao giờ chạy trước khi bài xong. Cài hàm nghe còn GỠ chết-ngay mặc định: hết hạn 120 s, `spawnSync` của bộ kiểm gửi
  SIGTERM mà con vẫn chạy tới hết = nới hạn (Cấm), Ctrl-C không dừng được. Đề xuất: (a) `process.on('exit')` (bắt đường ném) + TAM đặt tên kèm
  pid, đầu bài dọn các `thu_cong_<pid>_*` của pid ĐÃ CHẾT; không cài hàm nghe tín hiệu. Ca đỏ: thư mục giả của pid chết → bị dọn; của pid
  còn sống → giữ. (b) Đổi thu_cong sang bất đồng bộ — đụng ~700 dòng, ngoài ngân sách. (c) Bỏ vế thu_cong khỏi A2, chỉ làm thu_gia_lap.
  Máy chọn (a) nếu chủ quán duyệt; phiếu ghi "dọn ở exit + bắt SIGINT / SIGTERM" nên cần chủ quán chốt.

## Phát hiện
- (TU-CHAY-7, quan trọng) Máy mây KHÔNG có hook pre-commit (`.git/hooks` chỉ `*.sample`): tầng 3 của CLAUDE.md §2 không chạy khi máy
  commit — commit đỏ vẫn vào được nhánh, chỉ cổng PR (A13) chặn. Đề xuất khung: SessionStart cài hook (hoặc người gác đòi `npm test` xanh gần
  nhất trước `git commit`); ca đỏ: phiên mới, sửa làm bộ kiểm đỏ, `git commit` → phải bị chặn.
- (TU-CHAY-7) Neo rữa do đổi chữ lời gọi thu_cong: `viec/HOC-2b/dot_bien.py` VS-C3-bat-qua-bien, `viec/TOC-DO-1/dot_bien.py` dòng 31 — hồ sơ
  đã đóng; nếu cần chạy lại hai bộ đó thì sửa neo sang tiền tố `chayBaiThat('tu_chay/thu_cong.js'`.
- (TU-CHAY-7) A3 đếm 3 dòng trong `cong_cu/thu_P26c.js` (việc song song LUOI-4) — LUOI-4 dọn thì bộ kiểm nhắc hạ `NGUONG_DONG_CUNG`.
- (TU-CHAY-7) `thu_gia_lap.js` thêm ~12 s (62 s ≈ 52 % hạn); chia lượt thu_cong (92,7 s ≈ 77 %) — việc sau, theo chủ quán chốt.
- thu_cong.js 89,5 s chạy riêng = 75 % hạn; máy bận nhẹ là vượt 80 % → cảnh báo A1 sẽ hiện thường. Chia lượt thu_cong (TU-CHAY-6 Q5) nên vào
  việc sau — KHÔNG làm ở việc này (phiếu: Ngân sách).
- Cùng khuôn "TAM chỉ dọn ở cuối": `cong_cu/thu_TOCDO1.js:17/:189`, `tu_chay/thu_nguoi_gac.js:1126` — ngoài nghiệm thu A2.
- `thu_gia_lap.js` bị giết thì giả lập con đang chạy thành mồ côi (tự sập khi TMPDIR mất) — ngoài nghiệm thu.
- Hồ sơ cũ neo chữ lời gọi `chayBaiThat('tu_chay/thu_cong.js');`: `viec/HOC-2b/dot_bien.py:61`, `viec/TOC-DO-1/dot_bien.py:31` — đổi `:616`
  làm hai đột biến cũ đó LẠC (chạy `python3 viec/HOC-2b/kiem_neo.py` khi làm, ghi kết quả).
