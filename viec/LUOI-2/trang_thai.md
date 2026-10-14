# LUOI-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (13.10.2026)
- nhánh: `viec/LUOI-2`; `git status --short` sạch
- HEAD `fd919fd` · FETCH_HEAD `fd919fd` — bằng nhau, không kéo
- `git log --oneline -3`:
  ```
  fd919fd PHIEU: LUOI-2
  7f8656d TIEN-DO: P26c xong (9a68ab6), AUDIT-2 xong (bcfb509), mo GOI-1 + LUOI-2, them AUDIT-3 + DANG-NHAP-1 — so v28
  9a68ab6 Merge pull request #16 from pos-tuquyduong/viec/P26c
  ```

## N0 — 5 đột biến A3L chạy lại trên HEAD `fd919fd` (trước mọi sửa)
`python3 viec/AUDIT-2/dot_bien.py A3L-redeem-thieu-1-diem A3L-earn-flash-van-cong A3L-nhandiem-cong-doi A3L-goi-bo-kiem-chu A3L-goi-huy-dem-ca-mon-tra-tien -j 3`
```
SỐNG  A3L A3L-redeem-thieu-1-diem  (41 s) · mọi lệnh thoát 0
SỐNG  A3L A3L-earn-flash-van-cong  (41 s) · mọi lệnh thoát 0
SỐNG  A3L A3L-nhandiem-cong-doi  (41 s) · mọi lệnh thoát 0
SỐNG  A3L A3L-goi-bo-kiem-chu  (39 s) · mọi lệnh thoát 0
SỐNG  A3L A3L-goi-huy-dem-ca-mon-tra-tien  (39 s) · mọi lệnh thoát 0
  tổng 5 · thời gian 124 s
  A3L BẮT 0 · SỐNG 5 · HỎNG 0 · LẠC 0 · TREO 0
  ✓ kho thật không đổi
```
- Neo: cả 5 áp được (không HỎNG) → **không neo lại**; neo trước = neo sau. Vị trí trên HEAD: `loyalty.js:163`, `orders.js:783`
  (AUDIT-2 ghi 770), `signup-codes.js:213`, `orders.js:214` (ghi 208), `orders.js:1412` (lần khớp 0 / 2 = huỷ; lần 1 = xoá `:1543`).
- Cách chạy `c2full` (`viec/AUDIT-1/dot_bien.py:222`) KHÔNG chạy `cong_cu/thu_P26c.js`. Đo thêm bằng công cụ nháp (bản sao `server/`
  + `node cong_cu/thu_P26c.js --may-chu <bản sao>`): N1–N6 (gồm N6 `tienDaTra.js` bỏ `− debt_amount`) đều `76 đạt · 0 hỏng` → SỐNG.

## Câu hỏi
1. (CHẶN bước 4) Phiếu cần mục `## Bài thử cũ sửa` cho `cong_cu/thu_P26c.js` — cổng A11 (`tu_chay/cong.js:261–280`) đòi bài
   thử bị sửa phải ĐỎ trên gốc; ca của LUOI-2 là ca hồi quy, code đang đúng nên xanh trên gốc, đỏ chỉ qua đột biến. Chi tiết
   `ke_hoach.md` mục 5. Máy không tự sửa phiếu.

## Câu hỏi 2 (soát vòng 3 — CHẶN giao: cổng A12)
Câu hỏi 1 xin THIẾU. `tu_chay/cong.js:39` tính `cong_cu/thu_P26c.js` là code → `coCode`; bài được miễn A11 mà xanh trên gốc KHÔNG
cộng `doHopLe` (`:279` "A12 giữ"); `:285` `if (coCode && !mien && !doHopLe) doLy('A12', …)`; `mucMien` (`:52–59`) chỉ đọc mục
`## Bài thử đỏ` dòng "không — <lý do>". `tu_chay/MAU_PHIEU.md:48`: "Miễn này KHÔNG thay A12 … hoặc mục ## Bài thử đỏ".
LUOI-2 không có bài nào đỏ trên code gốc (mọi ca là hồi quy) → **xin chủ quán thêm vào phiếu** (máy không tự sửa phiếu):
```
## Bài thử đỏ
- không — LUOI-2 chỉ thêm ca hồi quy cho code ĐANG ĐÚNG; đỏ chứng minh bằng đột biến N1–N6 (bang_chung_do.txt)
```
Hệ quả cần biết: có mục này thì A18 (đột biến VS-) cũng không áp — việc không đổi `server/`, `client/src/` nên A18 vốn không áp.

## Phát hiện
1. `server/routes/signup-codes.js:197` — `/nhan-diem` tính `diemGoc = floor(don.total / per)` không xét đơn có flash; luật F2
   (`orders.js:782–783`) không cộng điểm cho đơn flash lúc bán, nhưng mã bill của đơn đó vẫn nhân `diemGoc × heSo`. Chưa chạy;
   cố ý hay không là câu hỏi nghiệp vụ. Không sửa (phiếu cấm `server/`).
2. (K4 của N2, kế hoạch mục 3 đã hứa ghi) `server/routes/orders.js:545` `if (!flashApplied && phone)` — luật "đơn flash không giảm
   hạng" CHƯA có ca nào canh: người soát đo đổi thành `if (phone)` → `thu_P26c` vẫn 84/84; ngoài khối [L] không bài nào bật flash
   (`thu_P20.js:97`, `thu_P21.js:77`, `kich_ban.js:63` đặt `flash_enabled=false`). Đề xuất việc sau: đột biến `A3L-tier-flash-van-giam`
   + ca "khách có hạng mua món flash → tier_discount 0". Không mở rộng LUOI-2.
3. (người soát) `server/routes/orders.js:1148` in hệ số nhân điểm trên bill bằng `Number(c.nhandiem_he_so) || 2`, còn
   `signup-codes.js:108` cộng điểm thật bằng `heSo >= 1 ? heSo : 2` — hai luật cho cùng một giá trị: hệ số < 1 (vd 0.5) thì bill in
   "gấp 0.5" mà máy cộng ×2. Chưa đọc màn Cài đặt có chặn giá trị < 1 không. Không sửa.

## Soát kế hoạch (agent phụ, chỉ đọc)
Không ngoài Phạm vi; không có cách ngắn hơn đáng kể. Đã sửa theo soát: `c2luoi` khai trong `viec/AUDIT-2/dot_bien.py`, giữ tầng 2;
L3a khẳng định có dòng earn trước khi nhận điểm (chống xanh oan); flash chỉ bật quanh L2a (chống sập L5a). Thêm Phát hiện 1.
Tên đột biến mới sẽ dùng: `A3L-hoan-goi-bo-tru-no`, `A3L-goi-xoa-dem-ca-mon-tra-tien`.

## Làm tiếp (13.10, chủ quán duyệt kế hoạch 5897b49; Câu hỏi 1 đã trả lời: phiếu có ## Bài thử cũ sửa)
- bước 1: HEAD `5897b49` · FETCH_HEAD `0ee508e` — HEAD là tổ tiên → `git pull --ff-only`. `git log --oneline -3`:
  ```
  0ee508e PHIEU: LUOI-2
  5897b49 LUOI-2: ke hoach sua theo soat (L3a chong xanh oan, flash chi quanh L2a, c2luoi o AUDIT-2) + Cau hoi 1 + Phat hien 1
  c96236d LUOI-2: ke hoach (cho duyet) + trang thai N0
  ```
- Phát hiện 1: chủ quán dặn ghi lại, không sửa ở việc này.

## Dừng (lượt trước)
Phiếu dặn "chờ duyệt kế hoạch" → dừng ở bước 3, chờ chủ quán duyệt + trả lời Câu hỏi 1.

## Bước 4–5 — ca hồi quy + đột biến (không sửa code quầy)
Chỗ canh → đột biến (`viec/AUDIT-2/dot_bien.py`, cách chạy `c2luoi` = c2full + `thu_P26c.js --client <kho>/client`):

| NT | chỗ code (đọc HEAD) | đột biến | ca bắt | trước | sau |
|---|---|---|---|---|---|
| N1 | `loyalty.js:163` | `A3L-redeem-thieu-1-diem` | L1a | SỐNG | BẮT `✗ L1a` |
| N2 | `orders.js:783` | `A3L-earn-flash-van-cong` | L2a | SỐNG | BẮT `✗ L2a` |
| N3 | `signup-codes.js:213` | `A3L-nhandiem-cong-doi` | L3a | SỐNG | BẮT `✗ L3a` |
| N4 | `orders.js:214` | `A3L-goi-bo-kiem-chu` | L4a | SỐNG | BẮT `✗ L4a` |
| N5 | `orders.js:1412` (huỷ) | `A3L-goi-huy-dem-ca-mon-tra-tien` | L5a | SỐNG | BẮT `✗ L5a` |
| K4 | `orders.js:1543` (xoá) | `A3L-goi-xoa-dem-ca-mon-tra-tien` (mới) | A1c (sẵn có) | BẮT | BẮT `✗ A1c` |
| N6 | `tienDaTra.js:45` | `A3L-hoan-goi-bo-tru-no` (mới) | L6a | SỐNG | BẮT `✗ L6a` |

Đầy đủ: `bang_chung_do.txt` (trước: 6 SỐNG · 1 BẮT; sau: BẮT 7 · SỐNG 0 · HỎNG 0 · LẠC 0). Công cụ nháp (bản sao server/ + thu_P26c)
cũng cho từng đột biến đỏ ĐÚNG ca, đúng lý do (N1: điểm −1, voucher 1 · N2: điểm 2 · N3: tổng 15 · N4: 200, giao 2 · N5: còn 1 ·
N6: ví 300.000). N1 làm đỏ thêm L1b (điểm đã âm) — hệ quả, không phải ca chặn hộ: L1a đỏ trước.
m2 (`Math.floor → Math.ceil` trong `tienDaTraTheoDong`, 1 đ) — theo phiếu chỉ ghi, không bắt.

## Bước 6 — kiểm
- `node cong_cu/thu_P26c.js` → 84 đạt · 0 hỏng (76 + 8), ~4 s.
- `npm test` → PASS 62 · FAIL 0 · CẢNH BÁO 0. `node kiem_tra_truoc_khi_giao.js --day-du` → PASS 66 · FAIL 0 · CẢNH BÁO 0.
- N7 `python3 viec/P26c/dot_bien.py` → 93 đột biến bị bắt · 0 KHÔNG (trên 93) — bằng bản ghi P26c (`viec/P26c/trang_thai.md:545`) Đo ở `0714b66` (trước vòng
  sửa 1); người soát vòng 2 chạy lại trên HEAD `9efb702` (sau commit đổi `thu_P26c.js` của vòng sửa): vẫn 93 · 0 không.
- K4 N6 (kế hoạch mục 3 hứa "ghi Phát hiện nếu đọc thấy lỗ"): ĐÃ ĐỌC, KHÔNG LỖ — duyệt hoàn đơn có gói bị chặn hẳn, cả lúc tạo
  (`server/routes/refunds.js:118`) lẫn lúc duyệt (`:157`), mã `DON_CO_GOI` (`:20–25`) → `soTienHoan` ở `refunds.js:164` không bao giờ
  chạy với đơn mua gói (còn nợ hay không).
- N7 `viec/LUOI-1/dot_bien.py` và `viec/AUDIT-2/kiem_neo.py` KHÔNG CHẠY ĐƯỢC ở máy này: kho nông thiếu commit `9521cec`
  (`viec/LUOI-1/dot_bien.py:17, 24` `git show 9521cec:...` → 128); người gác chặn `git fetch --deepen` (GIT-KEO).
  **Lý lẽ bù (soát vòng 1, đã kiểm lại):** (a) LUOI-1 chỉ chạy `cong_cu/gia_lap/chay.js` và `cong_cu/thu_gia_lap.js`
  (`viec/LUOI-1/dot_bien.py:18, 138–140`); (b) không file nào trong `cong_cu/`, `tu_chay/`, `viec/LUOI-1/` NẠP `thu_P26c.js`
  (`grep -rln thu_P26c` → chỉ `kich_ban.js` — một dòng chú thích — và chính nó); (c) `git diff --stat 6441651 fd919fd -- server cong_cu`
  rỗng, mà `6441651` đã ghi "`viec/LUOI-1/dot_bien.py` → đúng mong đợi 80/80" (`viec/P26c/trang_thai.md:543–546` "lần chạy cuối (HEAD `6441651`)" — sửa căn cứ ở vòng 3);
  LUOI-2 chỉ đổi `cong_cu/thu_P26c.js` trong hai thư mục đó → 80/80 giữ nguyên theo cấu trúc. Vẫn là CHƯA CHẠY trên HEAD.
  `kiem_neo.py`: bù một phần — 7 dòng AUDIT-2 đổi / thêm đều áp được (HỎNG 0, `bang_chung_do.txt`); mọi bộ khác không đổi file neo
  ngoài `thu_P26c.js` (chỉ THÊM dòng; neo P26c vẫn khớp — 93/93 không HỎNG).
- N7 `python3 viec/TACH-GL/dot_bien.py` → 29 · BẮT 25 · LẠC 1 · HỎNG 3 · đúng mong đợi 25/29 (755 s, đo ở `0714b66`; TACH-GL không chạy `thu_P26c.js` nên vòng sửa không đổi kết quả). Lệch = đúng 4 đột biến P26c
  đã ghi tên (`viec/P26c/trang_thai.md:547–548`); cách chia — VS-kb-hai-luot, VS-luot-trung-thieu, BV-cha-kiem-mot-lan HỎNG neo;
  VS-luot-thieu-bat-bien LẠC — là từ lần chạy của LUOI-2 (`0714b66`), không phải từ bản ghi P26c) — việc này không đổi `kich_ban.js` / `thu_gia_lap.js` (`git diff --stat fd919fd HEAD`), TACH-GL không chạy `thu_P26c.js`.
- Hook pre-commit (tầng 3) không cài ở máy mây này (chỉ `*.sample`) — đã tự chạy `npm test` trước commit.

## Soát độc lập vòng 1 (/ra-soat, agent general-purpose, HEAD ec243b1) — báo cáo nguyên văn
```
ĐẠT / KHÔNG ĐẠT: KHÔNG ĐẠT

LỖI TÌM ĐƯỢC:
- viec/LUOI-2/trang_thai.md:80 — N7: LUOI-1 ghi "CHƯA KIỂM" mà không nêu lý lẽ bù, nên theo phiếu (phieu.md:31) mục này vẫn thiếu.
  Lý lẽ bù CÓ THẬT, tôi đã kiểm:
  (a) viec/LUOI-1/dot_bien.py:18,138–140 chỉ chạy cong_cu/gia_lap/chay.js và cong_cu/thu_gia_lap.js, trên bản sao server/ + cong_cu/.
  (b) Không file nào trong cong_cu/ hay tu_chay/ nạp thu_P26c.js; chỉ có một dòng chú thích ở kich_ban.js:627.
  (c) `git diff --stat 6441651 fd919fd -- server cong_cu` rỗng, và LUOI-2 chỉ đổi cong_cu/thu_P26c.js.
  → Kết quả 80/80 ghi ở viec/P26c/trang_thai.md:546 giữ nguyên theo cấu trúc. Phải ghi lý lẽ này vào hồ sơ — K1/K3 (hồ sơ).
- viec/LUOI-2/ke_hoach.md:66 — kế hoạch hứa: "N2: `!flashApplied` còn ở giảm hạng orders.js:545 … chỉ ghi Phát hiện nếu chưa có ca".
  Mục ## Phát hiện (trang_thai.md:35–38) không có dòng này. Đã đo: đổi orders.js:545 `if (!flashApplied && phone)` → `if (phone)` thì
  thu_P26c vẫn 84/84. Ngoài khối [L], không bài nào bật flash (thu_P20.js:97, thu_P21.js:77, kich_ban.js:63 đều đặt flash_enabled=false).
  → Đường song song chưa được canh mà cũng không ghi lại — K4.
- viec/LUOI-2/ke_hoach.md:54 — N7 tự hứa thêm "`python3 viec/AUDIT-2/kiem_neo.py` 0 HỎNG mới", nhưng trang_thai.md:80 ghi không chạy
  được. Không phải yêu cầu của phiếu, nhưng là lời hứa chưa giữ. Bù được một phần: 7 dòng AUDIT-2 vừa đổi đều đã chạy, HỎNG 0
  (bang_chung_do.txt:26–27) — K1.
- viec/LUOI-2/ke_hoach.md:51 — L5a ghi "1 món lẻ (25.000 tiền mặt)". Code thật (thu_P26c.js:707–708) dùng mon(1) = 20.000 và
  cash_amount 20000. Lệch số liệu, không ảnh hưởng ca — K1.

NGHI NGỜ:
- Ngoài phạm vi, đề xuất ghi Phát hiện — server/routes/orders.js:1148 tính `heSo = Number(c.nhandiem_he_so) || 2` để in chữ trên bill;
  signup-codes.js:108 dùng `Number.isFinite(heSo) && heSo >= 1 ? heSo : 2` để cộng điểm thật. he_so < 1 (vd 0.5): bill in "gấp 0.5"
  mà máy cộng ×2. Chưa đọc Settings có chặn giá trị này lúc lưu không.
- Nhánh không SĐT lúc bán (signup-codes.js:214, daCong = null): đột biến diemGoc*heSo → diemGoc*(heSo−1) vẫn 84/84 với thu_P26c. Có thể
  giả lập bắt; không chạy để xác nhận. Ngoài 6 đột biến của phiếu.
- tienDaTra.js:45 Math.ceil(daDung) → Math.floor vẫn 84/84. Lệch 1 đồng, cùng loại m2 mà phiếu cho phép chỉ ghi.
- K5: khối [L] trả cài đặt bằng DELETE rồi INSERT lại (thu_P26c.js:696–697), không bọc try/finally. Một ca ném lỗi giữa khối thì cài đặt
  không được trả; bài đằng nào cũng dừng nên không đổi kết quả. updated_at bị đặt lại — vô hại.

NGHIỆM THU: 7/8 mục có bằng chứng · mục thiếu: N7 (một phần — LUOI-1 thiếu lý lẽ trong hồ sơ). N0–N6 có (tự chạy lại bằng bản sao
server/ + thu_P26c: 7 đột biến đỏ đúng ca, đúng câu; mỗi đột biến chỉ đỏ ca của nó, riêng N1 thêm L1b). P26c 93/93, npm test 62/0/0,
--day-du 66/0/0 tự chạy lại.

CHƯA SOÁT ĐƯỢC: không chạy lại TACH-GL (755 s) và cả bộ AUDIT-2 c2luoi; không chạy được LUOI-1, kiem_neo (kho nông); không chạy cổng A11
với mục ## Bài thử cũ sửa; hook pre-commit không cài; diff không đụng server/ client/ (P3/P4, P1 không phát sinh).

ĐƠN GIẢN: thu_P26c.js chú thích ghi số dòng (trôi) → neo bằng tên đột biến; `const dat` che bộ đếm `let dat` (dòng 44) → đổi `datCaiDat`;
đặt lại loyalty_enabled / earn 10000 thừa (database.js:1085–1086 mặc định đúng vậy).

BÀI HỌC:
- NGUYÊN TẮC (K4): mỗi câu "ghi Phát hiện nếu …" trong ke_hoach.md phải có dòng ở ## Phát hiện, hoặc "đã có ca X" kèm file:dòng.
- NGUYÊN TẮC (K1/K3): bộ đột biến không chạy được (kho nông) → ghi lý lẽ bù kiểm được (diff rỗng từ mốc bản ghi cũ + bộ đó không nạp
  file đã đổi); không bù được mới là thiếu.
- KHOÁ (có thể): đột biến A3L-tier-flash-van-giam (orders.js:545) + ca L2c — để việc sau quyết.
```
(Rút gọn phần mở đầu và chi tiết lặp của mục NGHIỆM THU / CHƯA SOÁT; nội dung kết luận giữ nguyên.)

### Xử lý vòng sửa 1
- LỖI 1 → ghi lý lẽ bù LUOI-1 ở Bước 6 (đã tự kiểm lại: `viec/LUOI-1/dot_bien.py:17–18, 138–140` (số dòng sửa ở vòng 2); `git diff --stat 6441651 fd919fd --
  server cong_cu` rỗng; `git show 6441651:viec/P26c/trang_thai.md` dòng 105 "đúng mong đợi 80/80").
- LỖI 2 → Phát hiện 2. NGHI NGỜ 1 → Phát hiện 3. LỖI 3 → bù một phần ghi ở Bước 6. LỖI 4 → sửa `ke_hoach.md`.
- ĐƠN GIẢN → làm cả ba ở `thu_P26c.js` (chú thích neo tên đột biến, `datCaiDat`, bỏ đặt lại tích điểm — L2b vẫn canh tích điểm bật).
- NGHI NGỜ 2, 3 (nhánh không SĐT, ceil/floor) → ngoài 6 đột biến của phiếu, chỉ ghi (m2 phiếu cho phép). NGHI NGỜ 4 (không try/finally)
  → giữ: bài dừng khi ca ném lỗi, không đổi kết quả; thêm try/finally là thêm dòng không chặn được gì.

## Soát độc lập vòng 2 (/ra-soat, HEAD 9efb702) — báo cáo (giữ kết luận, rút gọn phần lặp)
```
ĐẠT / KHÔNG ĐẠT: KHÔNG ĐẠT — chỉ lỗi hồ sơ; code thử + đột biến đạt, 6 ca L1a–L6a vẫn đỏ đúng câu, không ca nào xanh oan.
LỖI TÌM ĐƯỢC:
- viec/LUOI-2/ke_hoach.md:39, :41 — vòng sửa bỏ đặt lại tích điểm nhưng kế hoạch vẫn ghi "loyalty_enabled=true…" và "Tích điểm trả về
  như cũ sau L3a" — K4 (tài liệu), K1.
- viec/LUOI-2/ke_hoach.md:76 — "ca sau (D1b, K1b)": D1b (thu_P26c.js:586) nằm TRƯỚC khối [L] (:652); chỉ [K1b] (:724) sau — K1.
- viec/LUOI-2/trang_thai.md:88, :90, :151 — số dòng viec/LUOI-1/dot_bien.py lệch 1 (NEN :17, git show :24; CH/TG :18; LENH 138–140) — K1.
NGHI NGỜ:
- ke_hoach.md:64–65 hứa "duyệt hoàn đơn gói CÒN NỢ … ghi Phát hiện nếu đọc thấy lỗ" — hồ sơ không nói đã đọc refunds.js:164 chưa.
- trang_thai.md:86 P26c 93/93 đo trước commit vòng sửa 8e72c82; người soát chạy lại trên HEAD 9efb702: 93 · 0 — đúng, nhưng hồ sơ chưa ghi.
- TACH-GL 25/29 cũng đo trước vòng sửa; không chạy thu_P26c nên giữ theo cấu trúc; chưa chạy lại.
SOÁT: K3 tự chạy thu26c.py: N1→L1a (+L1b hệ quả), N2→L2a, N3→L3a, N4→L4a, N5→L5a, N6→L6a; thêm V1 `balance <= cost` đỏ riêng L1b (biên
trên + dưới đều có ca), V3 trừ nợ 2 lần đỏ L6a, V2 orders.js:545 84/84 (khớp Phát hiện 2). Khung giờ flash qua nửa đêm đúng
(flashState.js:18–19). K4: Phát hiện 2, 3 đúng; lý lẽ bù LUOI-1 kiểm bằng lệnh (bản sao LUOI-1 chỉ chép server, cong_cu,
tu_chay/cau_hinh.json — viec/LUOI-1/dot_bien.py:150–154; diff 6441651..HEAD trên các thư mục đó chỉ thu_P26c.js). K5: chụp 7 khoá, trả
sau L3a; chỉ K1b sau khối. P3/P4, P1: không đổi server/, client/. npm test 62/0/0, --day-du 66/0/0, thu_P26c 84/0.
ĐƠN GIẢN: trang_thai.md lặp câu "Phát hiện 1 — chủ quán dặn ghi lại" (:49, :59, :81); báo cáo vòng 1 chép dài.
NGHIỆM THU: 8/8 (N0–N7) có bằng chứng · mục thiếu: không.
CHƯA SOÁT ĐƯỢC: TACH-GL và cả bộ AUDIT-2 c2luoi chưa chạy lại trên HEAD; LUOI-1, kiem_neo (kho nông); cổng A11; hook pre-commit;
đường duyệt hoàn đơn gói còn nợ chưa dựng ca.
BÀI HỌC: NGUYÊN TẮC (K4 hồ sơ) — vòng sửa đổi hành vi bài thử thì grep ke_hoach.md + trang_thai.md tìm mọi câu tả hành vi cũ.
NGUYÊN TẮC (K3) — con số N7 đo trước commit đổi bài thử phải ghi "đo ở <commit>" hoặc chạy lại trên HEAD.
KHOÁ (việc sau): A3L-tier-flash-van-giam (orders.js:545) + ca canh.
```
### Xử lý vòng sửa 2
- ke_hoach.md:39, :41, :76 sửa (grep cả file `loyalty_enabled`, `Tích điểm trả về`, `D1b, K1b` — 0 còn sót).
- trang_thai.md số dòng LUOI-1 sửa; câu lặp Phát hiện 1 bỏ một chỗ; ghi "đo ở `0714b66`" cho P26c, TACH-GL.
- NGHI NGỜ 1 → đã đọc `refunds.js:20–27, 118, 157`: đơn có gói bị chặn hẳn ở duyệt hoàn → không lỗ, ghi ở Bước 6.
- Bộ AUDIT-2 c2luoi ĐÃ chạy lại trên cây sạch sau vòng sửa 1 (`a58e3a8`, cây = HEAD vòng sửa 1 về code): BẮT 7 (`bang_chung_do.txt`).

## Soát độc lập vòng 3 (/ra-soat, HEAD 369c402) — báo cáo (giữ kết luận, rút gọn phần lặp)
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
- viec/LUOI-2/ke_hoach.md:80–87 (cùng trang_thai.md Câu hỏi 1): xin chủ quán CHỈ "## Bài thử cũ sửa" là không đủ — cổng đỏ A12.
  tu_chay/cong.js:39 laCode → thu_P26c.js là code, coCode = true (:112); mucMien (:52–59) null vì phiếu không có "## Bài thử đỏ";
  bài miễn xanh trên gốc không cộng doHopLe (:279 "A12 giữ"); :285 doLy('A12'). tu_chay/MAU_PHIEU.md:48 "Miễn này KHÔNG thay A12".
  tu_chay/thu_cong.js:270–290: mọi ca HOC-1 ĐẠT đều kèm một bài đỏ hợp lệ khác. → Câu hỏi xin "## Bài thử đỏ / không — …". K1 + K6.
- viec/LUOI-2/ke_hoach.md:21: ô rủi ro còn "loyalty … trả về như cũ cuối khối" — code không đặt loyalty (thu_P26c.js:654), trả sau L3a
  (:696–697). K4 (grep theo NGHĨA) + K1.
- viec/LUOI-2/ke_hoach.md:34: dẫn viec/AUDIT-1/dot_bien.py:246–248; đúng là :248–249. K1 (nhẹ).
NGHI NGỜ: ke_hoach.md:11 bỏ qua cổng owner/refund_package (orders.js:1346–1355), UPDATE ở :1356–1368 — L6a dùng owner nên đúng;
viec/AUDIT-2/dot_bien.py:51 chú thích nhóm A3L cũ; trang_thai.md:95 căn cứ 80/80 nên dẫn viec/P26c/trang_thai.md:543–545; :99–100
phân loại HỎNG/LẠC dẫn :547 (dòng đó chỉ liệt kê tên).
SOÁT: K3 thu26c.py trên HEAD N1–N6 đỏ đúng ca, đúng lý do; khung thật A3L-hoan-goi-bo-tru-no + A3L-goi-xoa-dem-ca-mon-tra-tien → BẮT 2.
K4/K5/K1/P3/P4/P1 đạt (số dòng kiểm đúng liệt kê đủ). --day-du 66/0/0 chạy lại.
NGHIỆM THU: 8/8 (N0–N7) có bằng chứng · mục thiếu: không. KHÔNG ĐẠT vì LỖI 1 (A12 sẽ chặn PR) và LỖI 2.
CHƯA SOÁT ĐƯỢC: chưa chạy cổng tu_chay/cong.js đầu-cuối (kết luận A12 từ đọc code :39, 52–59, 112–113, 279, 285 + mô phỏng điều kiện
+ MAU_PHIEU.md:48); LUOI-1, kiem_neo (kho nông); TACH-GL, P26c, 5/7 c2luoi không chạy lại bằng khung thật; hook pre-commit.
BÀI HỌC: NGUYÊN TẮC (K1) — xin chủ quán sửa phiếu để qua cổng thì đọc HẾT các phép cổng chạm tới file (A11, A12, A16, A19) + MAU_PHIEU.md,
không dừng ở chú thích một dòng. KHOÁ (ngoài Phạm vi) — skill lam-viec bước 4 thêm vế "PR không còn bài nào đỏ trên gốc thì xin thêm
## Bài thử đỏ (A12)", hoặc phép tự kiểm: phiếu có Bài thử cũ sửa, không có Bài thử đỏ, mọi bài đổi đều được miễn → cảnh báo từ bước 4.
NGUYÊN TẮC (K4 hồ sơ) — sửa câu tài liệu thì grep theo NGHĨA ("trả về", "khối", "loyalty").
```
### Xử lý vòng sửa 3 (vòng cuối theo so_vong_sua_toi_da)
- LỖI 1 (đã tự đọc lại `tu_chay/cong.js:39, 52–59, 283–285`, `tu_chay/MAU_PHIEU.md:44–50`) → **Câu hỏi 2**, máy không tự sửa phiếu.
- LỖI 2, 3 + NGHI NGỜ :11, chú thích `viec/AUDIT-2/dot_bien.py:51`, căn cứ 80/80 → sửa. Grep theo nghĩa `cuối khối|trả về|loyalty` trong
  ke_hoach.md: chỉ còn câu đã sửa.

## Dừng (vòng 3)
Chờ chủ quán trả lời Câu hỏi 2 (thêm `## Bài thử đỏ` vào phiếu). Khi làm tiếp: chạy lại bước 6 trên HEAD, soát lại, rồi bước 10–11
(báo cáo 7 mục, Bài học, dòng HEAD ĐÃ KIỂM). Code thử + đột biến đã đạt cả ba vòng soát; mọi lỗi còn lại là hồ sơ / phiếu.

## Làm tiếp lần 3 (13.10 — Câu hỏi 2 đã trả lời: phiếu có `## Bài thử đỏ` "không — …", commit d3a6d52)
- bước 1: HEAD `d3a6d52` · FETCH_HEAD `d3a6d52` — bằng nhau (hook mở phiên đã kéo 2c20a78 → d3a6d52). `git log --oneline -3`:
  ```
  d3a6d52 PHIEU: LUOI-2
  2c20a78 LUOI-2: trang thai — bao cao soat vong 3, Cau hoi 2 (cong A12 can ## Bai thu do), dung
  add0426 LUOI-2: ke hoach — sua theo soat vong 3 (o rui ro, so dong, cong huy don goi)
  ```
- `phieu.md:35–36` dòng "không — LUOI-2 chỉ thêm ca hồi quy …" khớp `mucMien` (`tu_chay/cong.js:58`, gạch đầu dòng tuỳ chọn).
- Bước 6 chạy lại trên HEAD `d3a6d52` (cây sạch, không sửa file nào trong lúc chạy):
  - `npm test` → PASS 62 · FAIL 0 · CẢNH BÁO 0 · `node cong_cu/thu_P26c.js` → 84 đạt · 0 hỏng
  - `python3 viec/AUDIT-2/dot_bien.py <7 tên> -j 4` → A3L BẮT 7 · SỐNG 0 · HỎNG 0 · LẠC 0 · TREO 0 · ✓ kho thật không đổi (134 s)
  - `python3 viec/P26c/dot_bien.py` → 93 đột biến bị bắt · 0 KHÔNG (trên 93)
  - `node kiem_tra_truoc_khi_giao.js --day-du` → PASS 66 · FAIL 0 · CẢNH BÁO 0

## Soát cuối (/ra-soat, HEAD f61c6cf) — báo cáo (giữ kết luận, rút gọn phần lặp)
```
ĐẠT
LỖI TÌM ĐƯỢC: không. Cổng tĩnh `node tu_chay/cong.js tinh <kho> 7f8656d HEAD viec/LUOI-2` → 1 lý do A19 (chờ dòng HEAD ĐÃ KIỂM) +
"miễn bài thử đỏ (phiếu ## Bài thử đỏ)". A5 qua (phieu.md:35–36 khớp cong.js:58) · A6 qua · A7 qua · A11 miễn (mucBaiThuCu, thu_P26c
84/0 trên PR) · A12 qua nhờ mien (:285) · A16 bỏ qua (có mien) · A17 qua (không có viec/LUOI-2/dot_bien.py) · A18 không áp · A19 cần dòng
trần "HEAD ĐÃ KIỂM: <SHA>" (lần khớp CUỐI), SHA trong 7f8656d..head sau 1faaa92 (commit cuối đổi file ngoài viec/LUOI-2/), không dùng
"+ commit này"; nên ghi f61c6cf.
K3: tự chạy lại `python3 viec/AUDIT-2/dot_bien.py <7 tên> -j 4` trên f61c6cf → BẮT 7, đúng câu ✗ L1a/L2a/L3a/L4a/L5a/A1c/L6a, kho không
đổi (128 s). K4/K5/K1/P3/P4/P1 đạt (số dòng hồ sơ kiểm đúng). --day-du 66/0/0 tự chạy lại.
NGHI NGỜ: trang_thai.md:111 chia HỎNG/LẠC dẫn :547 (dòng đó chỉ có tên); ke_hoach.md:11 "status = 'completed'" là điều kiện WHERE;
ke_hoach.md:21 "khuôn A5i" gần đúng; ke_hoach.md:1 còn "(chờ duyệt)"; c2luoi dựng bằng chỉ số K.LENH['c2full'][1][0] — AUDIT-1 đổi
cấu trúc thì rữa, nhưng kiem_sach + mẫu ✗ L<n> lộ ra.
NGHIỆM THU: 8/8 (N0–N7) · mục thiếu: không (N7 LUOI-1 chỉ có lý lẽ bù).
CHƯA SOÁT ĐƯỢC: cổng chế độ `chay` đầu-cuối (A11 trên git archive mốc, HOC-1(d)); LUOI-1, kiem_neo (kho nông); TACH-GL, P26c không tự
chạy lại; origin/main (nếu main đã tiến thì A11 trên gốc chạy với code main mới — chưa kiểm); hook pre-commit; dòng A19 chưa có.
BÀI HỌC: NGUYÊN TẮC (K1/K6) — trước khi xin chủ quán sửa phiếu để qua cổng, chạy `node tu_chay/cong.js tinh …` (chỉ đọc git, ~1 s).
NGUYÊN TẮC (A19) — dòng trần, không backtick, không "+ commit này", commit chỉ đụng viec/LUOI-2/. KHOÁ (việc sau) — A3L-tier-flash-van-giam.
```
Xử lý: 4 NGHI NGỜ hồ sơ đầu → sửa câu (`ke_hoach.md:1, 11, 21`; `trang_thai.md` dòng TACH-GL ghi rõ cách chia là của LUOI-2). Chỉ đổi
`viec/LUOI-2/` → không đụng điều kiện A19. NGHI NGỜ c2luoi → giữ (đã có kiem_sach + mẫu riêng lộ ra; dựng lại tay là lặp danh sách).

## Báo cáo
```
VIỆC:        LUOI-2 — Vá lưới: bắt 5 đột biến NẶNG-lưới của AUDIT-2 + 1 của chat soát P26c (chỉ thêm bài thử, 0 dòng code quầy)
ĐÃ SỬA:      cong_cu/thu_P26c.js:652–722 — khối [L] 8 ca: L1a–L6a (bắt N1–N6) + L1b, L2b (K5, chống xanh oan); :88 gắn route signup-codes
             viec/AUDIT-2/dot_bien.py:23–25 — cách chạy c2luoi = c2full + thu_P26c (--client <kho>/client); 5 dòng A3L N1–N5 đổi sang
             c2luoi + mẫu đúng ca `✗ L<n> `; :76, :79 — 2 đột biến mới A3L-goi-xoa-dem-ca-mon-tra-tien (K4 đường xoá), A3L-hoan-goi-bo-tru-no (N6)
BÀI THỬ:     ca hồi quy (code đúng → thu_P26c xanh trên gốc, phiếu ## Bài thử cũ sửa + ## Bài thử đỏ "không"); đỏ chứng minh bằng đột biến:
             trước khối [L] (fb2d172) → 6 SỐNG + A1c BẮT; sau → BẮT 7/7 đúng ca (✗ L1a, L2a, L3a, L4a, L5a, A1c, L6a); chạy lại trên
             HEAD d3a6d52 → BẮT 7, kho không đổi (bang_chung_do.txt; trang_thai.md "Làm tiếp lần 3")
ĐÃ RÀ K4:    N5 bộ lọc `i.product_id > 0 && (i.unit_price === 0 …)` trong orders.js → 2 chỗ (:1412 huỷ, :1543 xoá), cả hai có đột biến BẮT;
             soTienHoan → 3 nơi gọi (orders.js:1305 qua hoanVi cho huỷ + xoá, refunds.js:164 — đơn có gói bị chặn trước ở :118, :157);
             `!flashApplied` → 2 chỗ (:783 canh bằng L2a; :545 giảm hạng CHƯA canh → Phát hiện 2); N1, N3, N4 mỗi phép một chỗ
CHƯA KIỂM:   viec/LUOI-1/dot_bien.py + viec/AUDIT-2/kiem_neo.py KHÔNG chạy được (kho nông thiếu 9521cec, người gác chặn --deepen) — chỉ có lý lẽ
             bù (LUOI-1 không nạp thu_P26c, server/cong_cu không đổi từ lần 80/80); TACH-GL 25/29 đo ở 0714b66 (lệch = 4 đột biến P26c
             đã biết); cổng tu_chay/cong.js chế độ `chay` đầu-cuối chưa chạy (chỉ `tinh`); nếu main đã tiến (GOI-1) thì A11 trên gốc mới
             chưa kiểm; hook pre-commit không cài ở máy mây (đã tự chạy npm test trước commit); m2 (Math.floor/ceil 1 đ) và nhánh nhân điểm
             đơn không SĐT không có ca (ngoài phiếu)
GIT:         f61c6cf LUOI-2: trang thai — lam tiep lan 3, buoc 6 chay lai tren HEAD d3a6d52
             d3a6d52 PHIEU: LUOI-2
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 3 · BỎ 3 — chi tiết ở ## Bài học
```

Nghiệm thu — đếm từng mục:
- N0 — `trang_thai.md` mục N0: 5 A3L SỐNG trên fd919fd, neo khớp, không neo lại.
- N1 — L1a; `A3L-redeem-thieu-1-diem` SỐNG → BẮT `✗ L1a` (điểm −1, voucher 1).
- N2 — L2a (+ L2b K5); `A3L-earn-flash-van-cong` → BẮT `✗ L2a` (điểm 2).
- N3 — L3a (khẳng định 5 điểm lúc bán); `A3L-nhandiem-cong-doi` → BẮT `✗ L3a` (tổng 15).
- N4 — L4a; `A3L-goi-bo-kiem-chu` → BẮT `✗ L4a` (HTTP 200, giao 2).
- N5 — L5a; `A3L-goi-huy-dem-ca-mon-tra-tien` → BẮT `✗ L5a` (còn 1); đường xoá `A3L-goi-xoa-dem-ca-mon-tra-tien` → BẮT `✗ A1c`.
- N6 — L6a; mua gói ghi nợ được (m6 200); `A3L-hoan-goi-bo-tru-no` → BẮT `✗ L6a` (ví 300.000).
- N7 — P26c 93/93 (HEAD d3a6d52) · TACH-GL 25/29 như bản ghi · LUOI-1 lý lẽ bù (CHƯA KIỂM) · không thêm KB / bất biến (LUOT, T9c,
  DONG_DAT, NGUONG không phát sinh) · npm test 62/0/0, --day-du 66/0/0, 0 CẢNH BÁO.

## Bài học
Sự cố gom: (1) Câu hỏi sửa phiếu xin thiếu — chỉ đọc A11, sót A12 (soát vòng 3 bắt) → thêm một lượt hỏi chủ quán. (2) Hồ sơ sửa câu
người soát chỉ ra mà không grep câu cùng nghĩa (vòng 2: loyalty còn ở :39/:41; vòng 3: còn ở :21). (3) Kế hoạch hứa "ghi Phát hiện
nếu…" mà không ghi (vòng 1, 2). (4) Bộ đột biến LUOI-1 + kiem_neo không chạy được trên kho nông. (5) Bộ chạy `c2full` của AUDIT-1 không
chạy thu_P26c → mọi phán "SỐNG" của C2F/A3L sau P26c bỏ qua 76 ca P26c. (6) dot_bien báo KHO BẨN vì tôi sửa hồ sơ trong lúc nó chạy.
(7) Người gác chặn cú pháp (B-CHUONGTRINH ×3 `time`/`for`, B-PHANTICH ×2 `$(( ))`/`$'…'`, B-CD-VITRI ×3, B-MANOI ×1, CC-LA ×1,
GIT-KEO ×1 `--deepen`). (8) Số dòng trong hồ sơ lệch 1 (vòng 2, 3). (9) Phát hiện 2: luật flash–giảm hạng không có ca.

- **KHOÁ** (đề xuất — ngoài Phạm vi, máy KHÔNG tự làm):
  - (1) `tu_chay/skill_lam_viec.md` bước 4: sau câu "báo chủ quán thêm mục ## Bài thử cũ sửa" thêm "chạy `node tu_chay/cong.js tinh <kho>
    <mốc> HEAD viec/<MÃ>`; PR không còn bài nào đỏ trên gốc thì xin thêm `## Bài thử đỏ` (A12)". Hoặc phép trong cong.js `tinh`: phiếu có
    Bài thử cũ sửa, không có Bài thử đỏ, mọi bài đổi đều được miễn → cảnh báo. Ca đỏ: phiếu LUOI-2 ở 0ee508e (chỉ Bài thử cũ sửa) → phải
    cảnh báo / A12.
  - (5) `viec/AUDIT-1/dot_bien.py:222` `c2full` thêm `cong_cu/thu_P26c.js --client <kho>/client` (như `c2luoi`), rồi chạy lại C2F + A3L
    còn SỐNG. Ca đỏ: `A3L-hoan-goi-bo-tru-no` qua `c2full` hiện SỐNG, phải BẮT.
  - (9) Đột biến `A3L-tier-flash-van-giam` (`orders.js:545` `!flashApplied && phone` → `phone`) + ca "khách có hạng mua món flash →
    tier_discount 0" (Phát hiện 2). Ca đỏ: đột biến hiện 84/84 xanh.
- **NGUYÊN TẮC** (đề xuất cho `KHUON_LOI.md` — ngoài Phạm vi; 104/120 dòng, đủ chỗ):
  - (2)+(3) bổ sung ví dụ vào K4 dòng "Sửa / phủ định một câu tài liệu → grep CẢ FILE": "Đã gây (LUOI-2): bỏ đặt lại tích điểm khỏi bài
    thử, sửa đúng câu người soát chỉ, sót câu cùng nghĩa ở ô rủi ro (2 vòng soát); kế hoạch hứa 'ghi Phát hiện nếu…' không ghi. Chặn: grep
    theo TỪ KHOÁ hành vi, và mỗi câu 'ghi Phát hiện nếu…' phải có dòng ## Phát hiện hoặc 'đã đọc, không lỗ' + file:dòng."
  - (4) vào K3: "Bộ đột biến không chạy được (kho nông…) → không chỉ ghi CHƯA KIỂM: ghi lý lẽ bù kiểm được (`git diff --stat <mốc bản ghi
    cũ> <gốc> -- <thư mục bản sao>` rỗng + bộ đó không nạp file đã đổi); không bù được mới là thiếu." Kèm đề xuất KHOÁ phụ: bộ đột biến
    đọc gốc bằng `git show <SHA>` lưu ảnh file vào `viec/<MÃ>/` (như `bb_neo.json`) để chạy được trên kho nông.
  - (1) vào K1: "Khẳng định về cổng mà chưa chạy cổng — LUOI-2 đọc A11, sót A12 ngay 6 dòng dưới (`cong.js:279` ghi 'A12 giữ'). Chặn:
    chạy `cong.js tinh` trước khi kết luận cổng qua."
- **BỎ**:
  - (6) KHO BẨN do tự sửa file khi bộ đo chạy — một lần, công cụ báo đúng; đã chạy lại trên cây sạch.
  - (7) người gác chặn cú pháp — mỗi lần viết lại lệnh đơn giản là qua; lý do in rõ, không cần khoá thêm.
  - (8) số dòng lệch 1 — người soát bắt và đã sửa; K1 đã có lời dặn.
- Dọn: không thấy lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` có phép kiểm làm thay mới ở việc này.
- Bước 11 không đổi file ngoài `viec/LUOI-2/` → không chạy lại bước 6. Lần kiểm cuối: bước 6 trên d3a6d52 + soát cuối trên f61c6cf
  (f61c6cf chỉ thêm trang_thai.md so với d3a6d52).

HEAD ĐÃ KIỂM: f61c6cf
