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
| A2 thu_gia_lap.js exit / pid (vòng sửa 4, Q3c) | BV-TUCHAY7-DON-EXIT-GL · BV-TUCHAY7-DON-PID-CHET-GL · VS-TUCHAY7-DON-CA-PID-SONG-GL · VS-TUCHAY7-DON-TAM-KHONG-PID-GL | thu_gia_lap "DON con het" |
| chế độ con qua argv (vòng sửa 3) | VS-TUCHAY7-CON-QUA-ENV · VS-TUCHAY7-GL-CON-QUA-ENV | thu_cong / thu_gia_lap phép tĩnh "không đọc biến môi trường *_CON" |
| (đã bỏ ở vòng sửa 4 — cơ chế tín hiệu không còn) | VS-TUCHAY7-DON-GL-CHI-SIGINT · BV-TUCHAY7-DON-GL-TINHIEU · VS-TUCHAY7-DON-GL-QUEN-EXIT · BV-TUCHAY7-DON-GL-KHONG-DUNG-CON · VS-TUCHAY7-DON-GL-DUNG-MOT-CON | — |
| A3 kiem_tra E15 | BV-TUCHAY7-DONG-CUNG-BO-CANH · VS-TUCHAY7-DONG-CUNG-GACH · VS-TUCHAY7-DONG-CUNG-NGUONG · VS-TUCHAY7-DONG-CUNG-LAN · VS-TUCHAY7-DONG-CUNG-FAIL · VS-TUCHAY7-DONG-CUNG-VUNG · VS-TUCHAY7-DONG-CUNG-CA-DONG | D2 · D3 · D1 · D7 · D9 · D8 · D4 |
| A4 KHUON_LOI (chữ) | BV-TUCHAY7-KHUONLOI-SO-BANG · BV-TUCHAY7-KHUONLOI-VI-TU · BV-TUCHAY7-KHUONLOI-TUNG-TEN · BV-TUCHAY7-KHUONLOI-101-DONG | kiem_chu (bài trong dot_bien.py) |
| A5 PHIEN_BAN / THIET_KE (chữ) | BV-TUCHAY7-PHIENBAN-CU · BV-TUCHAY7-THIETKE | thu_cong_cu E3 + thu_nguoi_gac · kiem_chu |
Không đưa vào (không tất định — K3, ghi CHƯA KIỂM): bỏ cờ `NGAT` (thoát 1 thay 130 ở 3/6 ca); `CON.add` ở chayDon (chỉ có tác dụng khi bị
ngắt đúng đợt DON). Vế dừng con: từ vòng sửa 2 CÓ đột biến tất định (dòng trên). VS-TUCHAY7-CON-KHONG-KIEM-CHA (vòng sửa 1) đã bỏ — cơ chế
biến môi trường + pid cha được thay bằng cờ argv ở vòng sửa 2.

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
   Năm câu lại mỗi câu một dòng. Tự soát thêm (ngoài báo cáo): bản vòng 0 còn mất 7 ý khác — đã khôi phục (xem bảng dưới, cột "khôi phục");
   commit 0ee95d1 ghi "8 ý" = 1 (lỗi 2) + 7.
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
   (đổi danh sách bài của bộ kiểm = đổi khung kiểm) → đề xuất ở Bài học. conChau: lúc đầu giữ; rồi `--day-du` sau vòng sửa ĐỎ ở `DON SIGINT … con cháu lúc giết 0` — giả lập cha tạo kho
   TRƯỚC khi sinh con (như T6) nên lúc giết có thể chưa có con: điều kiện `chau.length > 0` đỏ oan → BỎ hẳn conChau (soát cũng đề nghị bỏ). Sau
   khi bỏ: gốc ĐỎ đúng (bang_chung_do LẦN 3), bản vá xanh 3/3 lần chạy riêng.

### Kiểm sau vòng sửa 1
- `python3 viec/TU-CHAY-7/dot_bien.py` → 24 bị bắt · 0 KHÔNG bị bắt (trên 24), đối chứng 6 bài xanh (KHUON_LOI đổi câu K6 giữa lần chạy → chạy lại
  5 đột biến chữ: 5/5; bỏ conChau → chạy lại 3 đột biến thu_gia_lap: 3/3). Không sót thư mục tạm mới.
- `node kiem_tra_truoc_khi_giao.js --day-du` lần 1 sau sửa: FAIL 1 (DON SIGINT, conChau đỏ oan — đã bỏ); lần 2: thoát 0 · PASS 68 · FAIL 0 ·
  CẢNH BÁO 2 (GET-ghi có sẵn + khớp byte chờ cài). thu_cong 90,8 s · giả lập 33,7 s · thu_gia_lap 58,9 s.

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
| 46–48 K3 | gộp câu phiếu "bộ đột biến chạy được TỪNG TÊN, có ĐỐI CHỨNG và luật sập rõ (bài sập ≠ BẮT, không in dòng tổng ≠ BẮT) — không dò chuỗi; chỗ còn dò (chờ TU-CHAY-8) ghi ngoại lệ tạm"; bỏ "nên vá sai công thức vẫn ra đúng số" | giải thích của con số đã nêu; vế "không in dòng tổng" khôi phục ở vòng sửa 2 |
| 51–53 K4 | thân giữ nguyên, "Chỗ thứ hai thường trong cùng hàm hoặc cách chưa tới 150 dòng" thành "— thường trong cùng hàm …" (một câu); Dấu hiệu giữ "… cùng dạng X trong cùng file" | cùng nghĩa (ví dụ TU-CHAY-7 "2/3 chỗ spawn" thêm ở vòng 1, BỎ ở vòng 2; "trong cùng file" rơi ở vòng 1, khôi phục ở vòng 3) |
| 54–56 K4 | giữ đủ; "`statSync` giữ" rơi ở vòng 1 — khôi phục ở vòng 3 | soát vòng 3 lỗi 4 |
| 57–58 K4 | thêm "bỏ một lời dặn vì 'máy đã làm' thì phép phải phủ ĐỦ đối tượng" | bài học soát vòng 1 (lỗi 2); khôi phục "không theo một nhánh kết quả" |
| 59–60 K4 argv | giữ đủ 3 vế (chuyển tiếp nguyên đối số, lấy lần đầu, phép cấp module chạy cả ở cha); ví dụ TACH-GL rút gọn; thêm "cờ qua biến môi trường thì kế thừa từ shell — dùng argv (TU-CHAY-7)" | vòng sửa 1 làm rơi "lấy lần đầu" — khôi phục ở vòng 2 |
| 61–63 K4 | bỏ "khối lọc màu chép sang hàm mới →" | còn ba ví dụ cùng loại; "mẫu +" và "đổi tên phép → mẫu đột biến LẠC" khôi phục ở vòng 2 |
| 64–65 K4 SO-LUONG-1 | gộp với câu phiếu "MỘT vị từ cho cả 'có gì để làm' và 'làm'"; bỏ "SĐT đã chuẩn hoá, không phải giá trị thô", "ở orders.js:198" | ví dụ `" "` lọt qua `customer_phone` thô đã nói đủ; khôi phục "chép cổng có sẵn thì chép luôn lỗ của nó" |
| 66–67 K4 TU-CHAY-6 | bỏ "→ INSERT" | giữ "ghi ngay giới hạn", "liệt kê hàm phụ có ghi", "đường song song của mọi phép quét route" (vòng 1 làm rơi — khôi phục ở vòng 2) |
| 73–75 K5 | — | khôi phục "luồng đổi chính thứ làm chuẩn so sánh" |
| 76–78 K5 | bỏ "(có bản sao chỉ chép tu_chay/ hoặc server/)" | ví dụ |
| 80–83 K6 | Dấu hiệu "giao xong mới chạy bộ kiểm" → "cổng PR (A13) + hook pre-commit khi đã cài — máy mây KHÔNG có hook: tự chạy `npm test` trước commit" | cổng A13 (cong.js chạy lenh_bai_thu trên code PR) cưỡng chế ở PR; hook chỉ ở máy đã chạy `cai_git_hook.sh`; thêm "công cụ của việc theo luật việc vừa ghi" (soát lỗi 6) |
| 85–92 K7 | gộp Dấu hiệu vào Chặn; "bảo chạy npm run kiem ở POS" → "lệnh theo trí nhớ kho kia (CLAUDE.md §3)"; bỏ "→ Everything up-to-date", "require('./kich_ban.js') hỏng văng thô" | trùng CLAUDE.md §3; chi tiết ví dụ |
| 93–94 K7 GOI-2 | gộp vào gạch Chặn trên; bỏ "ở ngưỡng 30 ngày", "trong code", "chuỗi" | chi tiết ví dụ; giữ `getNow`, cùng quy ước với cột, lệch 7 giờ |
| 101–102 K8 | "chiều ngược" gộp vào Chặn | giữ ngữ cảnh "HOC-2b: đo lúc máy chạy việc khác ra 91 s thay vì 51 s" (vòng 1 làm mất — khôi phục ở vòng 2) |
| 114–116 | "Phát hiện lỗi mới: …mở K9 — ghi ngay" gộp vào dòng cuối | trùng skill bước 11.2 |

## /ra-soat vòng 2 — báo cáo agent soát (chép nguyên, rút dòng trống)
```
KHÔNG ĐẠT
Tình trạng 8 lỗi vòng 1: lỗi 2 sửa đúng (KHUON_LOI 13-15); lỗi 3 sửa, vá đúng lỗ (thu_cong 36-37) — còn 2 lỗi mới (4, 5); lỗi 4 sửa (3/3 spawn có
CON.add); lỗi 5 sửa thật (gói cả hai ở khổ 126: gốc 120, HEAD 100; dài nhất 136 → 126; > 125 ký tự 13 → 9); lỗi 7 sửa; lỗi 1 có nhưng sai vài
dòng (lỗi 3); lỗi 6 chỉ bị che (lỗi 1); lỗi 8 sửa xong lại lệch số đo mới (lỗi 2).
LỖI TÌM ĐƯỢC:
1. KHUON_LOI.md:39-40 + dot_bien.py:155 — lỗi 6 vòng 1 bị che: câu phiếu "luật sập rõ (bài sập ≠ BẮT) — không dò chuỗi" thu hẹp thành "không dò
   chuỗi trong chi tiết dòng ca (AU4-17)"; dot_bien vẫn vi phạm (thu_TOCDO1:72 đưa 'khối ném: ' vào chi tiết dòng ca, regex \bném: khớp đúng
   nó); trang_thai ý 4 "không dò chi tiết ca" sai; AU4-17 hiểu ngược chiều (boc.py MIỄN dấu sập trong chi tiết ca → bỏ sót bài sập). K8, K1.
2. tu_chay/THIET_KE.md:906 — "88,9–92,7 s (74–77 %)" trong khi cùng vòng đo 94 s = 78 %; số cũ còn ở trang_thai 187 (92,7) và 188 (89,5). K4, K1.
3. KHUON_LOI.md — A4 vẫn mất nghĩa, bảng không ghi: :55 bỏ "lấy lần đầu" (gốc :59; thu_gia_lap:41 dùng argv.indexOf); :57-58 bỏ "mẫu" và "đổi
   tên phép → mẫu đột biến LẠC"; :60 bỏ "liệt kê hàm phụ có ghi", "đường song song của mọi phép quét route" (bảng ghi "rút còn 2 dòng | cùng
   nghĩa" — thật 1 dòng, nghĩa khác); :39 bỏ "không in dòng tổng ≠ BẮT" (gốc :46; dot_bien:157 vẫn dùng); :89 "91 s thay vì 51 s" mất ngữ cảnh. K1, K4.
4. tu_chay/thu_cong.js:748 — ca "lạc" để lại tiến trình mồ côi: SIGTERM con sau 3 s, cháu trong spawnSync không bị giết (thử thật: cong.js tinh
   …/thu_cong_<pid con>_…/kho còn chạy ppid 1, TAM con sót); chú thích 746-747 tự nhận rồi dời ca xuống cuối = giấu, không sửa; tốn ~3 s. K3, K4.
5. tu_chay/thu_cong.js:37 — vế `+CHE_CON[2] === process.ppid` không ca nào khoá (ca "lạc" truyền 'het' không pid); đột biến thay vế so bằng true
   SỐNG; thiếu ca het:<pid sai>. K3.
6. Phiếu A6 — CON/NGAT (thu_gia_lap 47-56) và CON.add mới (75, 91, 115) không có VS-/BV- nào. K3/K6.
NGHI NGỜ: gốc gói 126 ra 120 (trang_thai ghi 119) — kết luận không đổi; "8 ý" (commit) vs "7 ý" (trang_thai); THU_GL_CON lọt từ shell khi chạy
  tay bỏ 3 ca DON (bộ kiểm lọc qua MT_SACH kiem_tra:841); dot_bien.py:118 os.putenv chỉ an toàn vì chạy tuần tự; /tmp/thu_gl_p24O0w còn.
NGHIỆM THU: 4/6 · thiếu: A4 (mất nghĩa + bảng sai; câu luật sập thu hẹp), A6 (CON/NGAT không đột biến).
CHƯA SOÁT ĐƯỢC: không chạy npm test / --day-du / thu_cong / thu_gia_lap / dot_bien (lúc soát có thu_cong khác chạy, pid 771); không thử giết
  thu_gia_lap thật trong đợt DON; tiền, P1 không áp dụng; K5 không thấy luồng hợp lệ bị chặn.
ĐƠN GIẢN: chế độ con dùng cờ argv (--con-het / --con-nem) — argv không kế thừa từ shell, bỏ được vế so pid và ca "lạc" (lỗi 4, 5 tự hết);
  dot_bien:155 ghi thẳng "luật sập tạm dò chuỗi tới TU-CHAY-8", giữ nguyên câu phiếu.
BÀI HỌC: KHOÁ — ca "chạy N giây rồi giết" trong bài đồng bộ phải giết cả nhóm tiến trình hoặc tránh; KHOÁ — một đột biến cho mỗi vế của cổng nhiều
  điều kiện; NGUYÊN TẮC K8 — người soát báo công cụ trái luật thì sửa công cụ hoặc ghi ngoại lệ tạm có hạn, không viết lại luật cho vừa công cụ;
  NGUYÊN TẮC K4/K1 — rút gọn tài liệu thì so từng vế liệt kê của câu gốc ("gộp cùng nghĩa" hay rơi đúng một vế); NGUYÊN TẮC K3 — đỏ oan do tiến
  trình sót thì sửa cho hết sót, không dời thứ tự ca để không thấy.
```

### Xử lý vòng sửa 2 (2/3)
1. **Lỗi 4, 5** — làm theo gợi ý ĐƠN GIẢN: chế độ con của thu_cong qua cờ argv `--con-het` / `--con-nem`; bỏ biến THU_CONG_CON, vế so pid và ca
   "lạc" (hết mồ côi, bớt ~3 s). Bộ kiểm gọi thu_cong không đối số → không vào chế độ con được. Đã kiểm `ps aux`: không còn tiến trình
   thu_cong / cong.js / gia_lap nào sót sau soát. pid 771 lúc soát: không xác định được nguồn (phiên chính không chạy gì lúc đó; có thể là
   con "lạc" của lần chạy trước — đúng lỗi 4).
2. **Lỗi 1** — KHUON_LOI giữ ĐÚNG câu phiếu "luật sập rõ (bài sập ≠ BẮT …) — không dò chuỗi" + "chỗ còn dò (chờ TU-CHAY-8) ghi ngoại lệ tạm";
   dot_bien.py ghi NGOẠI LỆ TẠM ngay dòng dò. Câu "đúng cái dot_bien đang làm" ở Xử lý vòng 1 ý 4 là SAI — giữ lại làm vết, sửa ở đây.
3. **Lỗi 2** — THIET_KE "88,9–94 s (74–78 %)"; Phát hiện dòng 187/188 sửa; các số khác trong trang_thai là số đo có ghi lần đo (giữ).
4. **Lỗi 3** — khôi phục 5 vế (bảng A4 cập nhật từng dòng); lấy chỗ bằng bỏ ví dụ TU-CHAY-7 tự thêm (K3 "DON sót 2/3", K4 "2/3 chỗ spawn",
   "THU_CONG_CON lọt") và gộp GOI-2 vào gạch Chặn K7. Vẫn 100 dòng ở khổ 126.
5. **Lỗi 6** — ca DON đòi "đóng < 9 s sau tín hiệu": đo bản vá 2 252 / 2 435 ms; bỏ bước dừng con thì handler chờ đủ 10 s (setTimeout) → đỏ TẤT
   ĐỊNH. Thêm BV-TUCHAY7-DON-GL-KHONG-DUNG-CON, VS-TUCHAY7-DON-GL-DUNG-MOT-CON. NGAT và CON.add ở chayDon: vẫn CHƯA KIỂM (ghi ở bảng đột biến).
6. Kiểm sau vòng sửa 2: `python3 viec/TU-CHAY-7/dot_bien.py` → 25 bị bắt · 0 KHÔNG bị bắt (trên 25), đối chứng 6 bài xanh; chạy tay
   BV-TUCHAY7-DON-GL-KHONG-DUNG-CON: đóng sau 10 610 / 10 768 ms (đỏ đúng lý do). `--day-du`: thoát 0 · PASS 68 · FAIL 0 · CẢNH BÁO 2 (GET-ghi
   có sẵn + khớp byte chờ cài); thu_cong 94,6 s (79 %, sát 96 s), giả lập 33,9 s, thu_gia_lap 61,4 s. THIET_KE → "88,9–94,6 s (74–79 %)"
   (mục 3 trên ghi 94 s là trước lần đo này). 0 thư mục tạm mới (còn /tmp/thu_gl_p24O0w cũ chờ chủ quán dọn).
7. Nghi ngờ os.putenv: đúng — chỉ an toàn vì dot_bien chạy tuần tự; ghi ở đây, không song song hoá.

## /ra-soat vòng 3 — báo cáo agent soát (chép nguyên, rút dòng trống)
```
KHÔNG ĐẠT (lỗi còn lại đều nhỏ: hồ sơ, độ chắc của bài thử, một câu Cấm chưa hỏi chủ quán. Không lỗi nào chạm tiền hay quầy.)
(a) sáu lỗi vòng 2: 1 luật sập ĐÃ SỬA ĐÚNG (KHUON_LOI 39-41 đúng câu phiếu + ngoại lệ tạm; dot_bien 157-159 ghi ngoại lệ; regex \bném: khớp
'khối ném: ' của C1 theo hướng an toàn — chấp nhận); 2 số đo ĐÃ SỬA (THIET_KE 906 "88,9–94,6 s (74–79 %)"); 3 năm vế ĐÃ KHÔI PHỤC ĐỦ (:40, :55,
:57-59, :60-61, :89-90) — bảng A4 vẫn sai (lỗi 3 dưới); 4 mồ côi ca "lạc" ĐÃ SỬA THẬT (bỏ ca, cờ argv thu_cong 34-37); 5 vế so pid hết vì cơ chế
thay — nhưng tính chất lỗi 3 vòng 1 đòi không còn phép nào giữ (lỗi 5 dưới); 6 dừng con có ca "< 9 s" + 2 đột biến tất định (25/25 neo khớp trên
HEAD); NGAT và CON.add chayDon CHƯA KIỂM — lý do xác đáng (bỏ NGAT đỏ 3/6; thử CON.add cần thêm một tầng tiến trình ~60 s).
LỖI TÌM ĐƯỢC:
1. cong_cu/thu_gia_lap.js:313 + :316-317 — ca "đóng < 9 s sau tín hiệu" đo khi máy nặng: dTerm và dInt chạy CÙNG LÚC (Promise.all), mỗi con bị
   giết đúng lúc đợt nặng (~19 giả lập) khởi động; chú thích :307-309 ghi máy 1 lõi lượt con kẹt khởi động quá 10 s mới đáp SIGTERM → bản vá cũng
   ≥ 10 s → ĐỎ OAN. Số đo chỉ từ máy 4 lõi (2,25–2,44 s). Trái KHUON_LOI 33-34. K3 (đỏ oan), K8 chiều ngược. Gọn: chạy dTerm rồi dInt tuần tự,
   hoặc khoá "dừng con" bằng dấu vết (handler in số con đã gửi SIGTERM) thay đo giờ.
2. cong_cu/thu_gia_lap.js:90 + :312 — vẫn cờ biến môi trường THU_GL_CON: lọt từ shell thì lặng lẽ bỏ 3 ca DON (145 ca vẫn xanh). Vòng 2 vừa ghi
   KHUON_LOI:56 "dùng argv" và :75 "công cụ của việc theo luật việc vừa ghi". Lý do miễn ở THIET_KE 911-912 chỉ đúng cho kiem_tra:854 (MT_SACH),
   không đúng cho cổng (cong.js:23-24 envCon kế thừa mọi biến trừ GITHUB_/ACTIONS_/CLAUDE; A11 chạy thu_gia_lap) và chạy tay. K4/K6. Gọn: cờ argv --con.
3. viec/TU-CHAY-7/trang_thai.md:143 — bảng A4 vẫn ghi "thêm ví dụ TU-CHAY-7 (2/3 chỗ spawn)" — ví dụ đã bỏ ở vòng 2 (:197 nói "bảng A4 cập nhật
   từng dòng"). K4, K1.
4. KHUON_LOI.md:49 — bỏ vế "`statSync` giữ" (gốc :56) — chỉ ra API đúng; bảng A4 không có dòng cho gốc 54-56 (grep statSync trang_thai → 0).
   "khuôn K4: … trong cùng file" (gốc :53) cũng bỏ mà bảng không ghi. K1/K4.
5. tu_chay/thu_cong.js:34-37 — sửa lỗi 3 vòng 1 (thoát 0 sớm khi cờ lọt từ shell) giờ không ca / đột biến nào giữ; đổi lại process.env.X chỉ đỏ
   vì lý do khác (con chạy đệ quy tới hạn 20 s) — trái KHUON_LOI:35. Gọn: phép tĩnh "thu_cong.js không đọc process.env để vào chế độ con". K3.
6. cong_cu/thu_gia_lap.js:51-53 (có từ vòng 0, chưa từng hỏi) — handler SIGTERM gỡ chết-ngay: kiem_tra:854 hết hạn 120 s gửi SIGTERM, bài chạy
   thêm tới 10 s → hạn thật tới 130 s. Phiếu Cấm "Không nới hạn 120 s". thu_cong cùng cơ chế đã coi là "nới hạn (Cấm)" và hỏi chủ quán (Q2); thu_gia_lap
   tự quyết ("có giới hạn"), không vào Câu hỏi. Vòng 1 đã nêu, chưa ai xử lý. K1/K6: chỗ chưa chốt mà tự quyết.
NGHI NGỜ: lỗi 1 chưa đo được trên máy 1 lõi (taskset bị chặn); E15 `:\d+[–-]\d+` đếm cả giờ "// mở 7:00-22:00" — không ca, nguồn báo oan về sau;
  thu_cong 25-29 dọn theo process.kill(pid,0) — /tmp chung giữa hai không gian pid có thể xoá TAM sống (chưa thấy cách xảy ra ở đây); dot_bien gọi
  VS-…-QUEN-EXIT là "vá sai" — thật là bỏ vá exit (tên).
NGHIỆM THU: 5/6 · thiếu: A4 (danh sách dòng bỏ sai/thiếu + mất một vế nghĩa — lỗi 3, 4). A1 ✓ (chạy lại thu_TOCDO1 54 đạt); A2 ✓ (kèm lỗi 1, 6);
  A3 ✓; A5 ✓; A6 ✓ theo hồ sơ (25/25, PASS 68; CHƯA KIỂM có lý do xác đáng).
CHƯA SOÁT ĐƯỢC: không chạy npm test / --day-du / thu_cong / thu_gia_lap / dot_bien; không đo DON máy 1 lõi; không dựng lại bản gốc (dung_goc.py
  không có trong kho); không giết thu_gia_lap thật trong đợt DON; đã tự dọn.
ĐƠN GIẢN: một kiểu cờ argv cho cả hai bài; DON tuần tự thay đo giờ khi máy nặng; KHUON_LOI:15 hai cặp ngoặc liền nhau nên gộp.
BÀI HỌC: KHOÁ — chayBaiThat (kiem_tra:478) đòi thấy dòng tổng của bài, không chỉ mã thoát 0 (gốc chung lỗi 3 vòng 1, lỗi 2 & 5 vòng 3: mọi kiểu "thoát
  0 sớm" xanh oan); KHOÁ — thu_cong_cu / người gác thêm phép tĩnh "bài thu_* không vào chế độ con bằng process.env"; NGUYÊN TẮC (K3) — ca có ngưỡng
  thời gian chỉ đo khi không có tiến trình nặng song song, kể cả bên trong con đang đo; chuộng dấu vết hơn đồng hồ; NGUYÊN TẮC (K1/K4) — rút gọn
  tài liệu thì đối chiếu bảng "dòng bỏ" với diff theo từng dòng gốc (ba vòng liền lòi một vế rơi); NGUYÊN TẮC (K6) — đánh đổi đã hỏi chủ quán ở
  chỗ A thì cùng đánh đổi ở chỗ B cũng phải hỏi.
```

### Xử lý vòng sửa 3 (3/3 — vòng cuối)
1. **Lỗi 2** — thu_gia_lap vào chế độ con bằng cờ argv `--con` (bỏ THU_GL_CON); **lỗi 5** — cả hai bài có phép tĩnh "không đọc biến môi trường
   *_CON" (thu_cong trong baiDonTam, thu_gia_lap ngay trước khối DON). Đột biến đưa ĐÚNG lỗi cũ trở lại: VS-TUCHAY7-CON-QUA-ENV,
   VS-TUCHAY7-GL-CON-QUA-ENV. Hai phép tĩnh này XANH trên bản gốc dựng (dung_goc giữ chế độ con argv — hạ tầng thử): chúng canh hồi quy của
   chính khung thử, bằng chứng là hai đột biến trên (K5-kiểu ca "phải giữ"), không tính là bài đỏ.
2. **Lỗi 3, 4** — bảng A4 dòng 51–53 sửa, thêm dòng 54–56; KHUON_LOI khôi phục "`statSync` giữ" và "trong cùng file" (vẫn 100 dòng khổ 126).
3. **Lỗi 1, 6 — KHÔNG sửa, hỏi chủ quán (Q3)**: hai lỗi dính nhau (cách xử lý tín hiệu của thu_gia_lap quyết định ca DON đo gì). Đây là chỗ phiếu
   chưa chốt (Cấm "không nới hạn" × A2 "bắt SIGINT/SIGTERM"); tôi đã tự quyết ở vòng 0 — sai luật cứng của skill. Dừng ở đây.
4. Kiểm sau vòng sửa 3: 8 đột biến (2 mới + 5 chữ + KHONG-DUNG-CON) 8/8 bị bắt, đối chứng thu_cong / thu_gia_lap (149) / kiem_chu xanh; `--day-du`
   thoát 0 · PASS 68 · FAIL 0 · CẢNH BÁO 2; thu_cong 95,5 s trong --day-du, 96 s chạy riêng (337 phép) = ĐÚNG ngưỡng cảnh báo 80 % — lần sau
   máy bận là kêu (đúng thiết kế A1; chia lượt thu_cong ở Phát hiện nay là việc cần làm sớm).
5. Nghi ngờ E15 đếm giờ dạng `7:00-22:00`: đúng — chỉ CẢNH BÁO; ghi Phát hiện. Tên VS-…-QUEN-EXIT: giữ (đổi tên = đổi bảng A17, không thêm giá trị).

## Vòng sửa 4 (chủ quán chốt Q3 = c, 16.10.2026)
- Bước 1: HEAD 6aed984 · FETCH_HEAD 6aed984 → bằng nhau, không kéo (6aed984 TU-CHAY-7 soat vong 3: ket qua kiem … · 90bc4ba … · 0e0d631 …).
- `cong_cu/thu_gia_lap.js`: bỏ CON / NGAT / bắt SIGINT-SIGTERM / chayDon / moTaDon / 4 ca DON tín hiệu; thêm khuôn thu_cong.js: vòng dọn
  `thu_gl_<pid chết>_*` đầu bài, TAM `thu_gl_<pid>_`, `process.on('exit')`, chế độ con `--con-het` / `--con-nem`, ca "DON con het / nem"
  (TMPDIR riêng có sẵn thư mục pid chết + pid sống). −19 dòng ròng. Không còn nới hạn: bị giết thì chết ngay (hành vi mặc định), sót tới
  lần chạy sau. Gốc dựng: ĐỎ C3f + DON con het + DON con nem (bang_chung_do LẦN 5); bản vá 148 đạt · 0.
- Lỗi soát vòng 3 số 1 (ca "< 9 s" đỏ oan máy 1 lõi) và 6 (nới hạn) HẾT theo cơ chế — không còn ca đo giờ, không còn handler.
- dot_bien.py: bỏ 5 đột biến tín hiệu, thêm 4 đột biến exit/pid cho thu_gia_lap (khuôn thu_cong) — 26 tên, mọi neo khớp đúng số lần.
- THIET_KE A2 viết lại: hai bài cùng một cách.
- Kiểm vòng sửa 4: `python3 viec/TU-CHAY-7/dot_bien.py` → 26 bị bắt · 0 KHÔNG bị bắt (trên 26), đối chứng 6 bài xanh. `--day-du` → thoát 0 ·
  PASS 68 · FAIL 0 · CẢNH BÁO 2 (GET-ghi có sẵn + khớp byte chờ cài); thu_cong 82,2 s (lần này máy rảnh hơn — dải đo cả việc 82,2–96 s), giả
  lập 33,3 s, thu_gia_lap 50,4 s (= gốc 50,5 s: 4 ca DON tín hiệu nặng đã bỏ). Không thư mục tạm mới (còn /tmp/thu_gl_p24O0w kiểu tên cũ).

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
- **Q3 — ĐÃ CHỐT (c), lệch chữ phiếu A2 được duyệt, cho thêm một vòng sửa + soát (vòng 4) — (A2 thu_gia_lap.js × Cấm "Không nới hạn 120 s/110 s") — soát vòng 1 đã nêu, vòng 3 chỉ ra tôi TỰ QUYẾT, chưa hỏi:** thu_gia_lap bắt
  SIGINT/SIGTERM (đúng phiếu A2, chủ quán chốt "làm đúng phiếu" ở lượt tiep), nhưng muốn không sót thư mục thì handler phải DỪNG giả lập con và
  CHỜ chúng đóng (đo: 2,3–2,4 s; tối đa 10 s rồi SIGKILL). Khi bộ kiểm hết hạn 120 s (`spawnSync` gửi SIGTERM) bài còn chạy thêm tới 10 s → hạn
  thật tới 130 s. Không chờ thì sót `thu_gl_*` (đo: 1/3–2/3 lần). Ca DON "< 9 s" còn có thể đỏ oan trên máy 1 lõi (con kẹt khởi động > 10 s — chú
  thích T3–T6) — chưa đo được ở đây. Ba cách:
  (a) Giữ như hiện tại — chấp nhận hạn thật tới 130 s khi bị ngắt (kết quả vẫn là FAIL "quá giờ", không nới điều kiện qua); sửa ca DON chạy
      SIGTERM rồi SIGINT tuần tự + khoá "dừng con" bằng dấu vết (handler in số con đã gửi SIGTERM) thay vì đo giờ.
  (b) Không chờ: handler SIGKILL mọi con rồi thoát ngay — không nới hạn, nhưng có thể sót thư mục (lần chạy sau không dọn).
  (c) Như thu_cong (Q2a): bỏ bắt tín hiệu; TAM mang pid, đầu lần chạy dọn thư mục `thu_gl_<pid chết>_*` — không nới hạn, không sót lâu, hai bài
      cùng một cách, bớt ~20 dòng (CON, NGAT, handler, ca DON tín hiệu → ca pid chết/sống như thu_cong). Trái chữ phiếu A2 ("bắt SIGINT/SIGTERM").
  Máy đề xuất (c) — đơn giản nhất, không nới hạn, đồng nhất hai bài; nhưng đổi chữ phiếu nên cần chủ quán chốt. Chọn xong: lượt `tiep` làm, chạy lại
  bước 6 và `/ra-soat` (cần chủ quán cho thêm vòng soát — đã dùng 3/3).
- **Q1 (Phạm vi — A5) — ĐÃ CHỐT (839ba54: thêm 2 file vào Phạm vi):** đổi `tu_chay/PHIEN_BAN` sang `tu-chay 1.7.0` thì `tu_chay/thu_cong_cu.js:459` và `tu_chay/thu_nguoi_gac.js:709` (cả hai
  chạy trong `npm test`) đỏ vì đòi đúng chữ `tu-chay 1.6.0`. Hai file ngoài Phạm vi. Đề xuất: thêm cả hai vào `## Phạm vi`, mỗi file sửa một
  dòng (1.6.0 → 1.7.0, ghi "TU-CHAY-7 A5"). Không thêm thì A5 + A6 không đạt cùng lúc.
- **Q2 (A2 thu_cong.js — cách làm khác phiếu) — ĐÃ CHỐT (a):** `thu_cong.js` chạy đồng bộ liền một mạch, Node chỉ chạy hàm nghe SIGINT/SIGTERM khi vòng sự kiện
  quay → hàm nghe không bao giờ chạy trước khi bài xong. Cài hàm nghe còn GỠ chết-ngay mặc định: hết hạn 120 s, `spawnSync` của bộ kiểm gửi
  SIGTERM mà con vẫn chạy tới hết = nới hạn (Cấm), Ctrl-C không dừng được. Đề xuất: (a) `process.on('exit')` (bắt đường ném) + TAM đặt tên kèm
  pid, đầu bài dọn các `thu_cong_<pid>_*` của pid ĐÃ CHẾT; không cài hàm nghe tín hiệu. Ca đỏ: thư mục giả của pid chết → bị dọn; của pid
  còn sống → giữ. (b) Đổi thu_cong sang bất đồng bộ — đụng ~700 dòng, ngoài ngân sách. (c) Bỏ vế thu_cong khỏi A2, chỉ làm thu_gia_lap.
  Máy chọn (a) nếu chủ quán duyệt; phiếu ghi "dọn ở exit + bắt SIGINT / SIGTERM" nên cần chủ quán chốt.

## Phát hiện
- (TU-CHAY-7, soát vòng 3) E15 mẫu `:\d+[–-]\d+` đếm cả giờ trong chú thích (`// mở 7:00-22:00`) — hiện 0 chỗ, chỉ CẢNH BÁO; nếu báo oan thì
  thêm ca + siết mẫu (việc sau).
- (TU-CHAY-7, quan trọng) Máy mây KHÔNG có hook pre-commit (`.git/hooks` chỉ `*.sample`): tầng 3 của CLAUDE.md §2 không chạy khi máy
  commit — commit đỏ vẫn vào được nhánh, chỉ cổng PR (A13) chặn. Đề xuất khung: SessionStart cài hook (hoặc người gác đòi `npm test` xanh gần
  nhất trước `git commit`); ca đỏ: phiên mới, sửa làm bộ kiểm đỏ, `git commit` → phải bị chặn.
- (TU-CHAY-7) Neo rữa do đổi chữ lời gọi thu_cong: `viec/HOC-2b/dot_bien.py` VS-C3-bat-qua-bien, `viec/TOC-DO-1/dot_bien.py` dòng 31 — hồ sơ
  đã đóng; nếu cần chạy lại hai bộ đó thì sửa neo sang tiền tố `chayBaiThat('tu_chay/thu_cong.js'`.
- (TU-CHAY-7) A3 đếm 3 dòng trong `cong_cu/thu_P26c.js` (việc song song LUOI-4) — LUOI-4 dọn thì bộ kiểm nhắc hạ `NGUONG_DONG_CUNG`.
- (TU-CHAY-7) `thu_gia_lap.js` thêm ~12 s (58,9–62,6 s ≈ 49–52 % hạn); chia lượt thu_cong (88,9–94,6 s ≈ 74–79 % qua các lần đo) — việc sau, theo chủ quán chốt.
- thu_cong.js 89,5 s chạy riêng ở GỐC (75 % hạn), 88,9–94,6 s sau vá; máy bận nhẹ là vượt 80 % → cảnh báo A1 sẽ hiện thường. Chia lượt thu_cong (TU-CHAY-6 Q5) nên vào
  việc sau — KHÔNG làm ở việc này (phiếu: Ngân sách).
- Cùng khuôn "TAM chỉ dọn ở cuối": `cong_cu/thu_TOCDO1.js:17/:189`, `tu_chay/thu_nguoi_gac.js:1126` — ngoài nghiệm thu A2.
- `thu_gia_lap.js` bị giết thì giả lập con đang chạy thành mồ côi (tự sập khi TMPDIR mất) — ngoài nghiệm thu.
- Hồ sơ cũ neo chữ lời gọi `chayBaiThat('tu_chay/thu_cong.js');`: `viec/HOC-2b/dot_bien.py:61`, `viec/TOC-DO-1/dot_bien.py:31` — đổi `:616`
  làm hai đột biến cũ đó LẠC (chạy `python3 viec/HOC-2b/kiem_neo.py` khi làm, ghi kết quả).
