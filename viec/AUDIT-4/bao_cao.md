# AUDIT-4 — Báo cáo đợt 4

Đo 16.10.2026 trên máy mây (kho CHỤP NÔNG); code chạy thật = `0ee7346` (việc KHÔNG đổi byte nào ngoài `viec/AUDIT-4/` —
`git diff --stat d8e256e HEAD -- ':!viec/AUDIT-4/'` rỗng). Chi tiết: `a2_bang.md` (A2 từng tên), `trang_thai.md` (A1…A6, D3), `bang_chung_do.txt`
(D2 + ca đỏ A1). Công cụ: `boc.py` (A1 + bọc A2), `dot_bien.py` (A3 + `--bo`), `kiem_neo.py` (A4), `don_rong.js` (A6). Lời duyệt 16.10: Q1 (a) bọc đủ;
Q2 (a) SỐNG ở chỗ tiền = NẶNG-lưới, không hạ mức, kèm đường thật; Q3 A3 làm chiều ngược (`IS NULL`); thời gian máy thật ~2 h 15 (< 180 phút, không cắt).

## Kết luận một dòng
**CHƯA đạt điểm dừng: 0 NẶNG-code, 7 NẶNG-lưới** (A3: 7/14 đột biến độc lập ở đường tiền / gói SỐNG — 3 làm tròn ≤ 1đ, 1 chỉ qua API thẳng, 3 nhánh
dữ liệu hiếm; chủ quán chốt Q2 = a nên không hạ mức). 10 lỗ lưới AUDIT-3 (AU3-8…17) ĐÃ khoá thật: 10/10 BẮT, đỏ đúng ca LUOI-3, câu lỗi và số
quan sát trùng nguyên văn bằng chứng LUOI-3. Đường tiền mới P20b / BAN-HANG-1: bộ của việc 4/4 · 7/7, độc lập 6/7 BẮT (1 SỐNG = AU4-1). Công cụ
đo không nói dối: 3 lỗi AU3-22…24 vá, mỗi vá một ca đỏ (luật cũ sai / mới đúng trên cùng đầu vào), `--sap` 0 bộ BẮT / SỐNG khi sập; soát vòng 1
bắt thêm lỗ cùng dạng AU3-22 trong luật bản 1 (phép trừ `✗ T\d` nuốt dòng gộp `✗ bài chạy thật … ✗ T1a … | ✖ Bài thử sập` của kiem_tra) → vá, ca đỏ
thứ năm trong `--tu-thu`; soát vòng 2 bắt thêm 3 (vế trừ ca T chưa có ca đỏ "phải KHÔNG sập", dòng gộp `--day-du` của thu_gia_lap ✗ T3
chấm sập oan, dấu sập khối `baiX sập:` của thu_cong / thu_cong_cu vắng); soát vòng 3 thêm 2 (dòng gộp kiem_tra khi bài con sập không in ✗ —
chỉ còn `thoát mã N`; ngoại lệ phải theo NỘI DUNG chi tiết dòng ca, không theo tên ca T) → vá, `--tu-thu` 10/10 (`--khung D1` chạy lại: y hệt); chạy lại khung AUDIT-1 trừ C2F (88 tên — cách chạy đếm từ `DOT_BIEN`: kiem 53 · gac 16 · cong 12 · gl 3 · kb1 2 · kb10 1 · c2 1 (D1 = 53 kiem + 4 cong); 1151 s) theo luật vòng 2: y hệt từng tên (lỗ không che BẮT nào). 4 tên kiem / kiemdd của AUDIT-2 A3B ngoài A2 theo phiếu (A3L + B3) — không chạy. A6: không đường
nào tạo đơn 0 dòng; đơn tổng 0 vào sổ đúng.

## Bảng phát hiện (mọi file:dòng đọc trên HEAD `0ee7346` lượt này)

| mã | mức | ở HEAD | lệnh thấy lại | đường thật (Q2 a) · đề xuất khoá — ca đỏ ĐÃ TỰ TÍNH trên gốc và trên đột biến |
|---|---|---|---|---|
| **AU4-1** | **NẶNG-lưới** | `orders.js:512–515` cổng P20b tra `pos_signup_codes` bằng `codeRecord.code`; đột biến tra bằng `discount_code` thô (chưa trim) SỐNG — thu_P20 [G] chỉ gửi mã chuẩn | `python3 viec/AUDIT-4/dot_bien.py VS-AU4-P20B-TRA-MA-THO` → SỐNG 75/0 | Quầy gửi mã chuẩn lấy từ `/validate` (`Sales.jsx:735`) → chỉ lộ khi gọi API thẳng. `thu_P20.js` [G] thêm G8: voucher của đơn gốc ĐÃ HUỶ, gửi `discount_code` = `'  ' + ma + '  '` → 400 `MA_DON_GOC_KHONG_HOP_LE`, không đơn mới (đột biến: `:504` trim nên tìm thấy voucher, `UPPER(' MA ')` ≠ `MA` → bỏ cổng → 200 + giảm) |
| **AU4-2** | **NẶNG-lưới** | `tienDaTra.js:25` `Math.floor((gia[i] * tra) / tong)` — đổi `Math.ceil` SỐNG: mọi ca đền / huỷ đều chia hết | `… VS-AU4-L3-DATRA-LAM-TRON-LEN` → SỐNG (p26c 118/0, thu 105/0) | Đơn có giảm cấp đơn mà tổng không chia hết (thường gặp). `thu_P26c.js` [M]: món 25.000 + món 30.000, mã giảm 10.000 → total 45.000; trần dòng 25.000 = ⌊25.000 × 45.000 / 55.000⌋ = **20.454** (đột biến 20.455): đền 20.455 → 400 VUOT_GIA, 20.454 → 200 |
| **AU4-3** | **NẶNG-lưới** | `tienDaTra.js:45` `- Math.ceil(daDung)` — đổi `Math.floor` (hoàn dư 1đ) SỐNG | `… VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG` → SỐNG | Gói số lượt không chia hết giá. `thu_P26c.js` [M]: gói 300.000 / 7 lượt, lấy 1, owner huỷ → ví + 300.000 − ⌈300.000 / 7⌉ = **257.142** (đột biến 257.143) |
| **AU4-4** | **NẶNG-lưới** | `tienDaTra.js:81` `const goc = Math.floor(` (kết thúc gói) — đổi `Math.ceil` SỐNG; chỗ làm tròn thứ ba, chưa bộ nào đột biến (soát kế hoạch, K4) | `… VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN` → SỐNG | `thu_GOI1.js` B3: gói 300.000 / 7, lấy 1, kết thúc gói có hoàn → tong = ⌊300.000 × 6 / 7⌋ = **257.142** (đột biến 257.143); `hoan-du-kien` cùng số |
| **AU4-5** | **NẶNG-lưới** | `tienDaTra.js:19` `chanTren && order.discount_code` — bỏ `chanTren` (trần mã-1-món áp cả huỷ / kết thúc gói) SỐNG | `… VS-AU4-L3-CHAN-TREN-CA-HOAN` → SỐNG | Đơn mua gói + món có mã giảm 1 món. `thu_P26c.js` [M]: gói 300.000 / 10 + món 25.000, mã 1 món giảm 5.000 → total 320.000; lấy 1, owner huỷ → ví + 320.000 − ⌈⌊300.000 × 320.000 / 325.000⌋ / 10⌉ = **290.461** (đột biến: gói 300.000 − 5.000 → 290.500). CHƯA chạy: đơn gói + mã 1 món có qua cổng hiện tại không — xác nhận khi viết ca |
| **AU4-6** | **NẶNG-lưới** (chiều chặn oan, gói) | `goiKhach.js:11` khoá loại `${sx_product_type}_${sx_product_id}` — bỏ kiểu SỐNG | `… VS-AU4-L3-KHOA-LOAI-BO-KIEU` → SỐNG | Hai kiểu SX trùng `sx_product_id` (id theo bảng từng kiểu bên SX). `thu_GOI1.js` A2: gói cài CT1 (kiểu A, id 1) 2 + NE1 (kiểu B, id 1) 5; dựng "đã lấy 4 NE1" bằng INSERT trực tiếp đơn giao từ gói (khuôn B3p — qua `POST /orders` thì chính bước dựng đã bị đột biến chặn: `xin["1"]` gộp hai loại, 4 > 2 → bài sập, soát vòng 1); lấy 2 CT1 qua `POST /orders` → 200 (đột biến: "đã lấy" CT1 đọc nhầm dòng NE1 = 4 → còn −2 → 400). Chiều ngược (giao vượt — `find` lấy dòng đầu, `goiKhach.js:27`; `:18` không ORDER BY nên cố định / thử cả hai thứ tự), tự tính bởi soát vòng 2: X (kiểu xếp SAU, id 1) cài 2 + Y (kiểu xếp TRƯỚC, id 1) cài 5, đã lấy X 2 + Y 1 (INSERT), lấy 1 X → 400 (đột biến: đọc dòng Y = 1 → còn 1 → 200, X giao 3/2) |
| **AU4-7** | **NẶNG-lưới** | `tienDaTra.js:87` `Math.max(0, Math.min(goc, total − nhận))` — bỏ sàn 0 SỐNG | `… BV-AU4-L3-B3P-BO-SAN-0` → SỐNG | Chỉ khi "đã nhận" > total: dữ liệu đền TRƯỚC P26c (đền theo giá gốc, như B3p) + giảm lớn. `thu_GOI1.js` B3p': gói 300.000 + 2 món 25.000, mã giảm 320.000 → total 30.000, đền cũ 2 × 25.000; kết thúc gói có hoàn → phản hồi `hoan` **0**, ghi chú gói "hoàn 0đ". Đột biến: tong −20.000 nhưng `packages.js:265` `tien.tong > 0` chặn `ghiHoan` → SỔ KHÔNG ĐỔI; sai là phản hồi `hoan: −20000`, ghi chú "hoàn -20000đ" (`:261`) và lời báo "hoàn … vào ví" (`:273`) lệch sổ (soát vòng 1 — bản 1 ghi nhầm "ví bị trừ"; vế "không dòng hoàn âm" xanh cả hai bên nên bỏ) |
| AU4-8 | NHẸ-công cụ (AU3-6 tái diễn) | `goiKhach.js:29` đổi `>=` (chặn oan lấy đúng số còn): thu_GOI1 in ✗ A2b, A2c, A2d, A2d2 đúng ca rồi `✖ Bài thử sập: Only finite numbers…` | `… VS-AU4-L3-LOAI-CHAN-BANG` → HỎNG-sập (dòng ✗ trước khi sập: `bang_chung_do.txt` mục 5) | `thu_GOI1.js` khối A2: dựng dữ liệu ca sau không phụ thuộc ca trước thành công (in ✗ rồi đi tiếp) → đột biến chuyển BẮT |
| AU4-9 | NHẸ (hồ sơ) | `viec/AUDIT-3/dot_bien.py` `BV-AU3-SL-THE-BO-CONG` neo cổng thẻ cũ — BAN-HANG-1 thay cổng (`orders.js:190`) mà hồ sơ không ghi bản thay (như AU3-3) | `python3 viec/AUDIT-3/kiem_neo.py` → HỎNG 2 | ghi "đã thay = `BV-BANHANG1-THE-CONG`" ở việc đụng `viec/AUDIT-3/` kế; `viec/AUDIT-4/kiem_neo.py` đã ghi |
| AU4-10 | NHẸ-công cụ | `viec/AUDIT-3/dot_bien.py` mẫu `✗ B1` / `✗ (S2\|A5)` / `✗ A5` của 5 tên AU3-8…17 không khớp tên ca LUOI-3 (`M2a`, `M4a`…) → LẠC-mẫu dù đỏ đúng ca | `python3 viec/AUDIT-3/dot_bien.py` → LẠC 5 | dùng `viec/LUOI-3/dot_bien.py` (mẫu = tên ca) làm bộ chính; hoặc đổi mẫu AUDIT-3 (cấm ở việc này) |
| AU4-11 | NHẸ-luật (Câu hỏi 4) | vá AU3-22 đúng cột "cách vá" → 4 `D1-E*` (phép tĩnh riêng bắt, thu_P26c đồng thời sập) BẮT → HỎNG-sập: AUDIT-1 77/79 thay 81/83 | `python3 viec/AUDIT-4/boc.py --khung D1` | chủ quán chọn cách đọc luật (a); không đổi kết luận NẶNG |
| AU4-12 | NHẸ-công cụ | `kiem_tra_truoc_khi_giao.js:616` chạy `thu_cong.js` hạn 120 s (`:478`) không truyền `canhGan` → không cảnh báo "> 80 %" (`:487`); `:600` tự ghi "150–325 s khi máy bận". A5: bận nhẹ 103,3 s (86 %) | `nhap_nhay.py` (trang_thai A5) | Đề xuất bộ khung (1) |
| AU4-13 | NHẸ-công cụ | `tu_chay/thu_cong.js:24` `TAM` dọn duy nhất ở `:723` — bị giết / ném thì sót `/tmp/thu_cong_*`; `cong_cu/thu_gia_lap.js` SIGTERM để sót `/tmp/thu_gl_zTxA7g` (A5) | `ls /tmp` sau A5 | dọn ở `process.on('exit')` + bắt SIGINT / SIGTERM (khuôn `viec/AUDIT-4/don_rong.js`); ca đỏ: SIGTERM giữa bài → 0 thư mục sót |
| AU4-14 | NHẸ (K4 P20b) | `discount-codes.js:63` `/validate` không qua cổng P20b → màn Bán hàng báo voucher hợp lệ, `POST /orders` 400 lúc tạo đơn; `:341` `/:id/increment-usage` tăng `used_count` chỉ cần đăng nhập | đọc code (không chạy) | `/validate` gọi `kiemDonCuaMa` như `orders.js:516–519`; ca: voucher đơn gốc đã huỷ → `/validate` 400 |
| AU4-15 | NGHI (chưa chứng minh) | cổng P20b `orders.js:516–519` chạy NGOÀI giao dịch (`:1005` commit) → huỷ đơn gốc đúng lúc dùng voucher có thể lọt | đọc code; không dựng được tất định → CHƯA KIỂM, không đếm | kiểm lại trạng thái đơn gốc trong giao dịch hoặc ca chồng (khuôn KB10/KB11) |
| AU4-16 | Câu hỏi chính sách | A6: mua thẻ 500.000 được +500 điểm, mua gói 300.000 được +300 điểm (`orders.js:827` cộng điểm theo `total`, không theo loại hàng) | `node viec/AUDIT-4/don_rong.js` | chủ quán chốt: có tích điểm khi mua thẻ / gói không; đối soát điểm theo quyết định đó |

Mức các SỐNG CŨ ở chỗ tiền / gói (soát vòng 1 nghi ngờ): Q2 (a) áp cho đột biến ĐỘC LẬP của việc này (phiếu A3). SỐNG cũ giữ mức AUDIT-2 / AUDIT-3 đã
xét kèm lý do — `A3L-goi-bo-kiem-con-lai`, `A3L-redeem-bo-han-diem`, `A3L-nhandiem-he-so-mac-dinh`, `BK-KB16` (khoá hai lớp), `BK-KB20` (AU2-9 P26d),
P26b `hong-tran-theo-man-hinh` (đã thay P26c), 22 C2F (AU3-19, NHẸ) — không xếp lại ở đây; nếu chủ quán áp Q2 cho cả SỐNG cũ thì "7 NẶNG" là cận dưới.
Kết luận "chưa đạt" không đổi. Mã AU4-n chỉ đặt ở bảng này (file khác dẫn theo).

Còn mở từ AUDIT-3, đo lại y hệt (không đề xuất lại): AU3-4 (`BK-KB21` LẠC), AU3-5 (bb I2 LẠC ×2), AU3-6 (`VS-AU3-P26C-HUY-ME-TRA-0`,
`VS-Q9-hoan-me-ngoai-tx` đỏ-rồi-sập), AU3-18 (bb SỐNG mới ×2), AU3-19 + 21 C2F SỐNG (NHẸ), AU3-20 (bb `D2-vo-hai` BẮT trái hợp đồng), AU2-9 (KB20 SỐNG).

## Tỷ lệ BẮT / SỐNG / HỎNG / LẠC theo nhóm (tỷ lệ BẮT = BẮT / (tổng − HỎNG − HỎNG-sập − cố ý); so AUDIT-3)

| nhóm | BẮT | SỐNG | HỎNG (đã thay / cố ý) | HỎNG-sập | LẠC | tỷ lệ AUDIT-4 | AUDIT-3 |
|---|---|---|---|---|---|---|---|
| A1 `--sap` 4 bộ khuôn × 4 dạng + DOSAP + khung 5 dạng + LUOI-1 / TACH-GL | **0** BẮT / SỐNG | — | 4 sai chuỗi | mọi dạng (gồm NEM-, `!DOSAP-KIEM`) | 0 | ĐẠT · `--tu-thu` 10/10 | ĐẠT (3 lỗ AU3-22…24) |
| AUDIT-1 trừ C2F (88, khung đã bọc) | 77 | 1 (cố ý) | 2 | 6 (`G3-sap` cố ý, `!D1-E11-P26b`, 4 `D1-E*` — AU4-11) | 2 (`!D1-E11-P20/P26a`) | 77/79 (luật AUDIT-3: 81/83) | 81/83 |
| C2F (87, c2luoi) | 59 | 22 (NHẸ) | 0 | 6 | 0 | 59/81 | 59/81 |
| AUDIT-2 A3L (20, kể cả 13 c2luoi) · B3 (6) | 15 · 3 | 3 · 2 | 2 · 0 | 0 | 0 · 1 | 15/18 · 3/6 | 15/18 · 3/6 |
| bb (175 sinh + 4 D2), qua bọc lần đầu | 123 (+ D2 da-biet, vo-hai) | 50 | D2 sai chuỗi | D2 sập | 2 (AU3-5) | 123/175 | 123/175 (ngoài bọc) |
| P26b · P26c · GOI-1 · GOI-2 | 48 · 88 · 40 · 59 | 1 · 0 · 0 · 0 | 9 · 4 · 9 · 0 | 0 · 1 · 0 · 0 | 1 · 0 · 0 · 0 | 48/50 · 88/88 · 40/40 · 59/59 | như nhau |
| SO-LUONG-1 · BAN-HANG-1 · P20b | 16 · 7 · 4 | 0 | 1 (đã thay BAN-HANG-1) · 0 · 0 | 0 | 0 | 16/16 · 7/7 · 4/4 | 17/17 · — · — |
| LUOI-1 (78) · TACH-GL (29) | 78 · 25 | 0 | 0 · 3 | 0 | 0 · 1 (đã thay) | 78/78 · 25/26 | như nhau |
| AUDIT-3 `dot_bien.py` (21 + 5 D2) | 15 (+ 5 LẠC-mẫu = BẮT đúng ca LUOI-3) | 1 (D2) | 1 D2 + 1 AU4-9 | 3 (2 D2 + AU3-6) | 5 (AU4-10) | 20/20 đột biến tiền | 10/20 |
| LUOI-3 (10) | 10 | 0 | 0 | 0 | 0 | 10/10, câu lỗi trùng | — (0/10 trước LUOI-3) |
| A3 AUDIT-4 (14 + 5 D2) | 6 (P20b 3 · BAN-HANG-1 3) + D2 1 | **7 NẶNG-lưới** + D2 1 | D2 1 | 1 (AU4-8) + 2 D2 | 0 | 7/14 | 10/20 |
| A4 neo (`kiem_neo.py`, 22 bộ + do_*.js) | 936 khớp / 975 có neo | — | 39 đã thay / cố ý | — | — | 0 HỎNG ngoài danh sách · 0 mẫu nghi rữa | 881/917 |
| lách (`viec/AUDIT-2/lach.js`, 15 mã, 0 mã mới) | CHẶN 14 | LỌT ĐÃ BIẾT 1 (AU2-7) | — | — | — | như cũ | như cũ |

## Đề xuất khoá (một việc vá lưới kiểu LUOI-3, trước AUDIT-5)
7 ca ở cột "đề xuất khoá" AU4-1…7 (`thu_P20.js` 1 · `thu_P26c.js` 3 · `thu_GOI1.js` 3); ca đỏ = 7 đột biến `viec/AUDIT-4/dot_bien.py` chuyển BẮT
(`python3 viec/AUDIT-4/dot_bien.py` → "đúng mong 19/19", thoát 0 — vòng sửa 1 thêm `MONG`, hiện 11/19 thoát 1). Số đã tự tính trên gốc VÀ đột biến (bài học LUOI-3); AU4-5 cần xác nhận cổng
chấp nhận đơn gói + mã 1 món trước. Kèm AU4-8 (thu_GOI1 A2 đi tiếp khi ca đỏ) để `VS-AU4-L3-LOAI-CHAN-BANG` chuyển BẮT.

## Đề xuất bộ khung (không làm ở việc này)
1. TU-CHAY-6 Q5: chia `thu_cong.js` thành lượt song song (khuôn TACH-GL) VÀ truyền `canhGan` ở `kiem_tra_truoc_khi_giao.js:616` — A5 bận nhẹ 86 %
   hạn mà im lặng (AU4-12). Ca đỏ: thu_cong 97 s (> 80 % của 120 s) → `--day-du` phải in cảnh báo "gần hạn".
2. BAN-HANG-1: phép tĩnh cảnh báo số dòng cứng trong chú thích `server/`, `client/src/` (`(:NNNN)`, `dòng NNNN`, `:NNN–NNN`), bánh cóc như
   `NGUONG_FETCH` (đếm hiện trạng trước). Ca đỏ: `orders.js` bản `9294d40` có "(:1068)" trỏ sai ngay lúc commit (K3/K4: chú thích là khẳng định).
3. `sap_cua` + bọc đối chứng (`boc.py`) đưa vào khung chung `cong_cu/` — mọi bộ `viec/*/dot_bien.py` mới dùng chung luật sập; tên lạ / chọn 0 → thoát 2
   (LUOI-3 KHOÁ 1).
4. Bài dài (`thu_P26b`, `thu_P26c`, `thu_GOI1`) in ✗ rồi đi tiếp thay vì ném khi dựng dữ liệu ca sau (AU3-6, AU4-8); `thu_cong.js`, `thu_gia_lap.js`
   dọn thư mục tạm khi bị giết (AU4-13).

## K5 — luồng hợp lệ không bị ảnh hưởng
Việc không đổi code chạy thật. Công cụ chỉ ghi bản sao trong thư mục tạm (`realpath` kiểm); `git status` sạch sau 15 bước A2 + mọi lệnh A1, A3–A6;
thử ngắt SIGINT + SIGTERM `boc.py GOI-1`, `dot_bien.py`, `don_rong.js` → thoát 130, 0 thư mục `/tmp` sót (`trang_thai.md` D3). Sót duy nhất:
`/tmp/thu_gl_zTxA7g` do A5 SIGTERM vòng tạo tải (AU4-13) — người gác chặn `rm` ngoài nháp; chủ quán dọn: `rm -rf /tmp/thu_gl_zTxA7g`.
