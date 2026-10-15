# BAN-HANG-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (15.10.2026)
- HEAD: 328a4eb · FETCH_HEAD (origin/viec/BAN-HANG-1): 328a4eb — bằng nhau, không kéo.
- git log --oneline -3:
```
328a4eb PHIEU: BAN-HANG-1
8f6d43e TIEN-DO: mo TU-CHAY-6 + BAN-HANG-1 (song song AUDIT-3), DANG-NHAP-1 gop vao BAN-HANG-1 — so v32
142d5e5 TIEN-DO: SO-LUONG-1 xong (31a5810), mo AUDIT-3, them BAN-HANG-1, TU-CHAY-6 (6)(7) — so v31
```
- Phiếu dặn "Chờ duyệt kế hoạch" → lượt này dừng ở bước 3 sau khi commit + push `ke_hoach.md`.

## Bước 3 — kế hoạch (15.10.2026)
- Bản 1 commit `2c55d53`. Soát độc lập (agent chỉ đọc, 4 câu) kết luận CẦN SỬA — 6 điểm, đã sửa thành bản 2:
  1. đếm sai: `viec/SO-LUONG-1/dot_bien.py` có 17 đột biến → sau A2 còn 16 bị bắt + 1 "không áp được", script thoát mã 1 (ngoài `npm test`).
  2. `VS-BANHANG1-THE-SIET-DOI-MON` phải ghi nguyên chuỗi, `items.length` nằm TRONG `!(…)`.
  3. `VS-BANHANG1-THE-NULL-CHAN`: gửi `null` ra TypeError → 5xx, không phải 400 — T2b vẫn bắt; sửa mô tả.
  4. T3b dùng `2h` (7200 s) thay `8h` (trùng mặc định cũ → K3); T3a so `status === 200` trước khi giải mã.
  5. K4 sót: bỏ chọn khách khi giỏ có món lấy từ gói CŨ (`activePkgId`) → `orders.js:354` 400 → Câu hỏi 3.
  6. Bớt: dòng `setCategory` (A1), đột biến `VS-BANHANG1-THE-CHI-HANG` (trùng ca bắt S4c). T1b giữ làm bằng chứng phụ.
- Mọi khẳng định của agent soát đã đối chiếu lại trên code lượt này: `orders.js:354`, `Sales.jsx:504, :716`, `orders.js:150`, `package.json:24` (express 5).
- Dừng ở bước 3 theo phiếu ("Chờ duyệt kế hoạch"). 3 câu hỏi chờ chủ quán ở cuối `ke_hoach.md`.

## Bước 1 (lượt `tiep`, 15.10.2026) — đối chiếu bản chụp
- HEAD: 4aa5935 · FETCH_HEAD: 4aa5935 — bằng nhau, không kéo.
```
4aa5935 BAN-HANG-1: trang thai buoc 3 — ket qua soat ke hoach, dung cho duyet
3396154 BAN-HANG-1: ke hoach ban 2 — sua 6 diem theo soat doc lap
2c55d53 BAN-HANG-1: ke hoach ban 1 (cho duyet) + trang thai buoc 1
```
- Chủ quán duyệt bản 2 (`3396154`): Câu hỏi 1 → có; Câu hỏi 2 → (b); Câu hỏi 3 → có, gộp cả `is_membership` (điều kiện
  `is_pkg || fromPkg || is_membership`, một câu báo); T3b dùng `2h`.

## Bước 4–7 — bài thử, đột biến, vá, kiểm, commit (15.10.2026)
- Bài thử `cong_cu/thu_P26c.js`: mount thêm `auth` (:88), S4c thêm `code`, mục mới [T1+T2] 4 ca + [T3] 2 ca. Trên gốc: **107 đạt · 4 hỏng**
  (S4c, T1a, T1b, T3a — `bang_chung_do.txt`; T1b xác nhận gốc tạo đơn rỗng 0đ). Sau vá: **111 đạt · 0 hỏng**.
- Đột biến `viec/BAN-HANG-1/dot_bien.py` — đối chứng 111 đạt · 0 hỏng, **7/7 bị bắt**. Bảng chỗ vá → đột biến (A17/A18):

| Chỗ vá | Đột biến | Ca bắt (đã chạy) |
|---|---|---|
| `orders.js:187` cổng thẻ | `BV-BANHANG1-THE-CONG` | T1a |
| | `VS-BANHANG1-THE-CONG-CU` | T1a |
| | `VS-BANHANG1-THE-SDT-THO` (dựng lại `VS-SOLUONG1-THE-SDT-THO`) | S4c |
| | `VS-BANHANG1-THE-SIET-DOI-MON` (K5) | T2a |
| | `VS-BANHANG1-THE-NULL-CHAN` (K5 — bắt bằng 5xx TypeError) | T2b |
| `auth.js:64` hạn đăng nhập | `BV-BANHANG1-HAN-DN-8H` | T3a |
| | `VS-BANHANG1-HAN-DN-BO-BIEN` | T3b |
| `Sales.jsx:385` A1 | không có — bài chạy thật không chạy React (CHƯA KIỂM bằng máy) | — |

- `viec/SO-LUONG-1/dot_bien.py` chạy lại: 16 bị bắt · **1 "không áp được"** (`VS-SOLUONG1-THE-SDT-THO` neo nguyên dòng cổng cũ :187 đã thay) →
  script đó thoát mã 1 từ nay (ngoài `npm test`). Chủ quán chốt (b) 15.10: không sửa file cũ, đột biến dựng lại ở bảng trên.
- Kiểm: `npm test` 63/63 · `(cd client && npm run build)` · `node kiem_tra_truoc_khi_giao.js --day-du` 67/67, 0 cảnh báo.
- Số dòng (`git diff --numstat 4aa5935 fcc75f5`): `Sales.jsx` +6/−0 (2 chú thích + 4 code) · `orders.js` +4/−2 (2 chú thích) ·
  `auth.js` +1/−1 · `thu_P26c.js` +46/−3 · `dot_bien.py` 105 dòng — trong ngân sách phiếu (15–25 code, ~50 thử). [sửa theo soát: bản đầu ghi
  +5/−3 và 98 bằng trí nhớ — K1]
- **Thử tay A1 ở quầy (A4):** đăng nhập → Bán hàng → chọn khách (có SĐT) → tab Gói → bấm một gói (giỏ có dòng gói) → bấm ✕ bỏ chọn
  khách → giỏ KHÔNG còn dòng gói (và món 0đ lấy từ gói, thẻ nếu có), dòng đỏ "Đã gỡ gói, thẻ và món lấy từ gói khỏi giỏ vì bỏ chọn
  khách"; món lẻ vẫn nguyên. Chọn lại khách → thêm gói lại bình thường.

## Bước 8 — soát độc lập `/ra-soat` (15.10.2026, trên HEAD 9294d40; lần chạy đầu chết vì giới hạn phiên 429, chạy lại)

Báo cáo của agent soát (chép nguyên):

```
ĐẠT (có 3 điểm nhỏ cần ghi nhận, không điểm nào chặn giao — chi tiết dưới)

Mọi file:dòng dưới đây đọc trong lượt này trên HEAD 9294d40 (cây sạch; `git log origin/viec/BAN-HANG-1..HEAD` rỗng).

LỖI TÌM ĐƯỢC:
1. server/routes/orders.js:188 — chú thích trong CODE ghi "khối ghi thẻ (:1068)" nhưng khối `if (membershipTier && phone)` thật nằm ở :1070 (chính 2 dòng chú thích mới chèn làm trôi). Số dòng cứng trong chú thích code đã sai NGAY lúc commit; CLAUDE.md mục 8 đã cảnh báo số dòng hay trôi. Sửa gọn: bỏ "(:1068)", chỉ ghi "khối ghi thẻ `membershipTier && phone`" (grep được, không trôi). — K1 (số dòng ghi lệch code thật) / K7.
2. cong_cu/thu_P26c.js:856 T3a so `a.giay >= 29 * 86400` — phép NGƯỠNG một chiều: đột biến `'30d'` → `'365d'` hay `'29d'` vẫn xanh. Phiếu A3 ghi đúng "≥ 29 × 86400" nên đây là theo phiếu, không phải sai, nhưng KHUON_LOI K3 đòi phép ngưỡng phải có ca ngay trên + ngay dưới. Cách gọn hơn mà vẫn đúng: so bằng `b.giay === 30 * 86400` (jsonwebtoken '30d' = 2.592.000 s chính xác — đầu ra đột biến BO-BIEN in đúng 2592000 s) — 1 dòng, khoá chặt hơn. — K3 (nhẹ, phiếu cho phép).
3. client/src/pages/Sales.jsx:388–389 — điều kiện 3 cờ lặp hai lần (`some` rồi `filter` với cùng vị từ phủ định). Gọn hơn vẫn đúng: `const conLai = cart.filter(c => !c.is_pkg && !c.fromPkg && !c.is_membership); if (conLai.length !== cart.length) { setCart(conLai); setError(...); }` — một vị từ, không thể lệch nhau khi thêm cờ thứ tư sau này (K4 phòng xa). Tuỳ chọn, không bắt buộc. — Đơn giản.

Không tìm thấy lỗi chặn giao. Căn cứ theo từng mục soát:

[1 K3 — bài thử có giá trị]
- Tự chạy lại trên bản CHƯA vá (chép server/ ra thư mục tạm, thay orders.js + auth.js bằng `git show 328a4eb^:…`, `--may-chu`): 107 đạt · 4 hỏng — S4c (HTTP 400 không code), T1a (HTTP 200 tổng 25000), T1b (HTTP 200 tổng 0 — gốc tạo ĐƠN RỖNG 0đ thật), T3a (28800 s). Khớp từng dòng `viec/BAN-HANG-1/bang_chung_do.txt`. Trên HEAD: 111 đạt · 0 hỏng (tự chạy).
- Các ca kiểm HÀNH VI (status / `code` / COUNT(pos_orders) / `order.total` / `exp − iat`), thu_P26c.js:831–840, 851–858 — không có phép tĩnh nào soi marker "BAN-HANG-1" → marker suông KHÔNG làm xanh được. Không dò chữ thông báo (E12 sạch — `mk.code`, không `mk.error`).
- `dot_bien.py` tự chạy: đối chứng 111/0, 7/7 bị bắt, mỗi đột biến bắt đúng ca ghi trong bảng trang_thai.md:39–47 (đã đối chiếu từng dòng đầu ra). NULL-CHAN bắt bằng HTTP 500 TypeError đúng như kế hoạch mô tả.
- T3a/T3b không xanh oan: T3b dùng '2h' = 7200 ≠ mặc định cũ 28800 ≠ mặc định mới 2592000 — đột biến BO-BIEN cho 2592000 s → đỏ đúng. T3a: gốc 28800 < 2505600 → đỏ. Nhược điểm ngưỡng một chiều ghi ở LỖI 2.
- T2b (thu_P26c.js:839): spread `{ customer_phone: sdtMoi(), …, ...{ customer_phone: undefined } }` → giá trị `undefined`; `goiAi` (:107) dùng `JSON.stringify(body)` → khoá bị bỏ → máy chủ nhận KHÔNG có `customer_phone` (phân rã :147 → `undefined`). Đúng là "không SĐT". Khoá `membership_buy: null` vẫn được stringify giữ (null) → đột biến NULL-CHAN (`'membership_buy' in req.body`) có ý nghĩa.
- Bài không nạp dotenv (thu_P26c.js:1–45, không có `require('dotenv')`), T3a `delete process.env.JWT_EXPIRES_IN` trước khi gọi, `finally` :860 trả lại — không phụ thuộc shell cha.

[2 K4 — đường song song]
- `grep membership_buy|membershipTier server/routes/orders.js` → :178 (phân rã), :182 (cho items rỗng), :187–189 (cổng mới), :434–443 (tạo dòng thẻ, chỉ khi `membership_buy.tier_id` — tập con sau cổng), :1070–1088 (ghi thẻ khi `membershipTier && phone`, `phone = normalizePhone(customer_phone)` :540 — tập con sau cổng). 2 chỗ sau cổng đều là tập con của điều kiện cổng → không cần vá. Ngoài orders.js: `membership_buy` chỉ xuất hiện trong chú thích server/routes/membership.js:6; `pos_membership_purchases` chỉ được INSERT ở orders.js:1081 (backup/customers-v2/refunds/membershipStatus chỉ đọc) → không đường ghi thẻ song song.
- `grep expiresIn server/` → duy nhất auth.js:64. Client: `grep -rn loginTime client/src/` = 0 (CHECKLIST A4 — POS không giữ hạn phiên phía client) → không lệch hạn client/server. AuthContext.jsx không giải mã `exp`.
- Sales.jsx chỗ gỡ gói/thẻ/món từ gói: updateQuantity :561 (gói về 0 → lọc fromPkg), removeFromCart :568–569 (xoá gói → lọc fromPkg), handleSelectCustomer :364–366 (đổi khách → chỉ lọc fromPkg), handleClearCustomer :388–389 (mới: cả 3 cờ), banner gói :936–937, :969 (tắt gói → lọc fromPkg). handleSelectCustomer GIỮ `is_pkg` + `is_membership` khi ĐỔI khách: đây là chủ ý có cơ sở — khi đổi khách, `customer_phone` mới vẫn được gửi (Sales.jsx:715) cùng `package_buy` (:751) / `membership_buy` (:758) → máy chủ tạo gói/thẻ cho khách MỚI, hợp lệ; chỉ `fromPkg` (của gói khách CŨ) mới sai. Khác với bỏ chọn khách (phone = null → 400). KHÔNG cùng dạng lỗi. Đã ghi trong ke_hoach.md:13, :102.
- CustomerSearch.jsx:153–160 `handleClear` chỉ gọi từ nút ✕ (:335) — `onClear` KHÔNG bắn khi gõ tìm khách khác, nên A1 không gỡ giỏ ngoài ý nhân viên.

[3 K5 — chặn nhầm]
Luồng qua cổng orders.js:189: (a) Sales.jsx:758 gửi `{ tier_id }` khi có thẻ trong giỏ — addMembershipToCart :515 đòi `customer`, A1 gỡ thẻ khi bỏ chọn khách → luôn đủ phone; gửi `null` khi không thẻ → `null &&` ngắn mạch, qua. (b) kich_ban.js:471 KB22 (`...kh` có phone, tier_id), :672 KB32 (sdtMoi + tier_id) — đủ; giả lập chạy xanh trong `--day-du` (chay.js 34,9 s). (c) thu_P26c S4b :809 (đủ) → 200 xác nhận; S4c :815 phone " " → 400 chủ ý. (d) các `thu_*.js` khác: grep cong_cu/ → không file nào khác gửi `membership_buy`. (e) Không gửi khoá → mặc định `null` :178 → qua (S1g…, T2b). Không luồng nào bị chặn oan. Dữ liệu cũ production: cổng chỉ đọc body yêu cầu, không đọc DB.
A1 khi giỏ CHỈ có món lẻ: `cart.some(...)` :388 sai → không `setCart`, không `setError` → không lời báo oan. `fromPkg` trên món lẻ là `false` (:483) → đúng.

[4 K1 — khẳng định không căn cứ]
Đã đối chiếu: thu_P26c.js:103 ký token 1h (đúng), database.js:917–922 seed admin/admin123 (đúng), kiem_tra_truoc_khi_giao.js:492 chỉ chạy thu_* (đúng — SO-LUONG-1 dot_bien.py ngoài npm test), orders.js TU_GOI_NHUNG_THIEU_GOI :361 (ke_hoach ghi :354 trên bản chưa vá, +2 dòng vá + lệch nhỏ — chấp nhận), `grep orderItems.length orders.js` = 0 (đúng, Phát hiện ke_hoach.md:123). Tự chạy `viec/SO-LUONG-1/dot_bien.py`: 16 bị bắt · 1 "không áp được" (VS-SOLUONG1-THE-SDT-THO, khớp 0 lần) — đúng trang_thai.md:50. Số dòng numstat (Sales +6/0, orders +4/−2, auth 1/1, thu_P26c +46/−3, dot_bien 105) — trang_thai.md:53 ghi orders "+5/−3" và dot_bien "98 dòng" lệch nhẹ với numstat thật (+4/−2, 105) — sai sót ghi chép, không ảnh hưởng. Lệch duy nhất đáng ghi: chú thích code :188 "(:1068)" (LỖI 1).

[5 Đường tiền]
Cổng :189 chạy trước mọi tính tiền, chỉ đọc body, trả 400 sớm — không đổi đường tiền. Giá thẻ vẫn server tự tra `pos_membership_tiers` :436–438 (P4 giữ nguyên). Không trường tiền mới, không tính năng tiền mới → không cần quy tắc đối soát mới. Hệ quả tốt: đóng đường tạo đơn rỗng 0đ qua `membership_buy: {}` (T1b).

[6 P1 — dist]
`grep -c 'Đã gỡ gói, thẻ và món lấy từ gói' client/dist/assets/index-jf7t_7gd.js` = 1; index.html trỏ đúng `index-jf7t_7gd.js`; assets chỉ có 1 js. `node kiem_tra_truoc_khi_giao.js --day-du` tự chạy: PASS 67 · FAIL 0 · CẢNH BÁO 0, exit 0 (gồm D5 build lại so băm). `npm test` = cùng script không `--day-du` (package.json:9) → tập con.

[7 Nghiệm thu — đếm đủ]
- A1: Sales.jsx:388–390 lọc `is_pkg || fromPkg || is_membership`, câu báo mới — theo quyết định duyệt mở rộng (trang_thai.md:31–32); dòng lẻ/số dư/nợ: các `set…` :391–407 nguyên; dist build (mục 6); không nút mới (diff Sales.jsx chỉ +6 dòng trong hàm). Bằng chứng máy: KHÔNG có (ke_hoach.md:44–46 nói thẳng, CHƯA KIỂM); thử tay ghi trang_thai.md:55–57. ✔ (phần máy kiểm được)
- A2: orders.js:189–190 đúng khuôn :205 cổng gói; ca T1a/T1b/S4c đỏ trên gốc (tự chạy), T2a/T2b/S4b K5 xanh; S4c chỉ thêm `code` (phiếu cho phép). ✔
- A3: auth.js:64 `|| '30d'`; T3a đỏ trên gốc (28800), T3b '2h' → 7200. Điều kiện DỪNG (không bỏ được biến) không gặp. ✔
- A4: npm test/--day-du xanh (tự chạy 67/67); dot_bien.py 7/7 có ≥1 VS + 1 BV cho A2 (1 BV + 4 VS) và A3 (1 BV + 1 VS), có đối chứng; thử tay A1 ghi trang_thai.md:55. ✔
NGHIỆM THU: 4/4 mục có bằng chứng · mục thiếu: không.

[8 Đơn giản]
Code vá ~8 dòng, đúng ngân sách, đúng chỗ, cùng khuôn có sẵn. Hai điểm gọn hơn ghi ở LỖI 2, 3 (tuỳ chọn). Không lan man ra ngoài phiếu; phát hiện ngoài phạm vi ghi ở ke_hoach.md:120–123 không tự sửa (đúng định hướng 3).

NGHI NGỜ:
- A1 chỉ thử tay — không có bằng chứng máy; chưa có cách thử React trong bộ thử hiện tại (ke_hoach.md:44 nêu rõ). Chấp nhận theo phiếu nhưng là lỗ hổng lâu dài cho mọi việc đụng Sales.jsx.
- Câu báo "Đã gỡ gói, thẻ và món lấy từ gói" hiện cả khi chỉ gỡ món từ gói CŨ (activePkgId) — hơi rộng, chủ quán đã duyệt "một câu báo".

CHƯA SOÁT ĐƯỢC:
- Hành vi màn hình thật A1 (React) — không có bài máy, không chạy trình duyệt từ đây.
- Hạn 30 ngày trên Render thật (biến JWT_EXPIRES_IN=30d đã đặt 12.10 → mặc định mới chỉ là lưới dự phòng, không kiểm production được từ đây).
- Chưa rà huỷ đơn/hoàn tiền với đơn mua thẻ (ngoài phiếu, CLAUDE.md mục 8 ghi vùng chưa rà).

BÀI HỌC (đầu vào bước 11):
- KHOÁ: thêm phép tĩnh vào kiem_tra_truoc_khi_giao.js hoặc người gác: chú thích code dạng `(:NNNN)` / `dòng NNNN` trong server/ và client/src/ bị cảnh báo — số dòng trong code chắc chắn trôi (lần này sai ngay lúc commit).
- NGUYÊN TẮC (KHUON_LOI K3): phép ngưỡng về hằng số mặc định (expiresIn, timeout) → so BẰNG giá trị tất định thay vì `>=`, khi thư viện cho số chính xác.
- NGUYÊN TẮC (K4): khi cùng một vị từ xuất hiện ở `some` và `filter`, gom về MỘT vị từ/biến — thêm cờ thứ tư sau này không thể lệch nhau.
- Nhẹ: khi báo cáo số dòng, chép numstat thật vào trang_thai (lần này ghi +5/−3 trong khi numstat +4/−2; 98 vs 105).
```

**Xử lý (vòng sửa 1/3)** — cả 3 điểm trong Phạm vi, đã sửa và kiểm lại:
1. `orders.js:188` chú thích bỏ số dòng cứng, neo theo biểu thức `membershipTier && phone` (`1f6ae39`).
2. `thu_P26c.js` T3a so BẰNG `30 × 86400` (`f68acad`). Đổi bài sau khi ghi bằng chứng → cổng A16: chạy lại trên server GỐC (bản sao
   `orders.js` + `auth.js` từ `git show 328a4eb^:…`, `--may-chu`) → **107 đạt · 4 hỏng** (S4c, T1a, T1b, T3a = 28.800 s); trên HEAD **111 đạt · 0 hỏng**;
   `bang_chung_do.txt` chép lại cả hai. `dot_bien.py` chạy lại: 7/7 bị bắt.
3. `Sales.jsx` một vị từ `monLe` cho cả "có gì để gỡ" và "gỡ" (`99391e4`), build lại `client/dist` (`index-B9Vi2Xgu.js`).
   `node kiem_tra_truoc_khi_giao.js --day-du` → PASS 67 · FAIL 0 · CẢNH BÁO 0.
- Số dòng ghi ở bước 4–7 sửa theo `git diff --numstat 4aa5935 99391e4` (K1): `Sales.jsx` +7/−0 (2 chú thích + 5 code) · `orders.js` +4/−2
  (2 chú thích) · `auth.js` +1/−1 · `thu_P26c.js` +46/−3 · `dot_bien.py` 105 dòng.

## Bước 10 — báo cáo 7 mục

Đếm nghiệm thu (mỗi mục một dòng, bằng chứng đã chạy trên HEAD 99391e4):
- **A1** `Sales.jsx:385–392` lọc `is_pkg || fromPkg || is_membership`, một câu báo (theo duyệt 15.10 mở rộng phiếu); dòng lẻ / số dư / nợ: các `set…` sau đó
  nguyên; `client/dist` build (`--day-du` D5 so băm xanh); không nút mới (diff chỉ +7 dòng trong hàm). Bằng chứng MÁY: không có — thử tay ghi ở bước 4–7.
- **A2** `orders.js:187–190` cổng `membership_buy && !(tier_id && normalizePhone(customer_phone))` → 400 `THE_MUA_THIEU_THONG_TIN`; ca T1a (`{}` + 1 món, gốc 200),
  T1b (`{}` + `items: []`, gốc 200 đơn rỗng 0đ), S4c (`{tier_id}` SĐT `" "`, gốc 400 không mã) đỏ trên gốc; K5 T2a (thẻ riêng), T2b (`null`), S4b (thẻ + món) 200.
- **A3** `auth.js:64` `|| '30d'`; T3a (xoá biến → 2.592.000 s, gốc 28.800 s đỏ); T3b (`JWT_EXPIRES_IN=2h` → 7.200 s, biến ưu tiên). Điều kiện DỪNG không gặp
  (handler đọc `process.env` lúc xử lý; bài cùng tiến trình).
- **A4** `npm test` 63/63 · `--day-du` 67/67 · `dot_bien.py` 7/7 (A2: 1 BV + 4 VS; A3: 1 BV + 1 VS; đối chứng 111/0) · thử tay A1 ghi bước 4–7.

```
VIỆC:        BAN-HANG-1 — Quầy: bỏ chọn khách thì gỡ gói khỏi giỏ; cổng mua thẻ cùng khuôn cổng gói; token mặc định 30 ngày
ĐÃ SỬA:      client/src/pages/Sales.jsx:385–392 — handleClearCustomer gỡ gói / thẻ / món lấy từ gói khỏi giỏ, một câu báo (+ build client/dist)
             server/routes/orders.js:187–190 — cổng thẻ cùng khuôn cổng gói: thiếu tier_id hoặc SĐT → 400 THE_MUA_THIEU_THONG_TIN
             server/routes/auth.js:64 — expiresIn mặc định '8h' → '30d' (biến môi trường vẫn ưu tiên)
             cong_cu/thu_P26c.js:88 mount auth; :817 S4c thêm mã; :820–862 mục [T1+T2] (4 ca) + [T3] (2 ca)
BÀI THỬ:     chạy trên bản chưa vá → ĐỎ ở S4c (400 không mã), T1a (200 đơn thường), T1b (200 đơn rỗng 0đ), T3a (28.800 s) — 107 đạt · 4 hỏng;
             sau khi vá → XANH 111 đạt · 0 hỏng; đột biến 7/7 bị bắt (viec/BAN-HANG-1/dot_bien.py, đối chứng trước)
ĐÃ RÀ K4:    grep "membership_buy\|membershipTier" server/routes/orders.js → 6 chỗ (:178, :182, :187, :434, :1070, :1081) — 2 khối sau cổng là tập con, giữ;
             grep "expiresIn" server → 1 chỗ (auth.js:64); grep "fromPkg\|is_pkg\|is_membership" chỗ gỡ giỏ Sales.jsx → updateQuantity, removeFromCart,
             handleSelectCustomer (đổi khách giữ gói/thẻ cho khách mới — chủ ý), banner gói, handleClearCustomer (mới) — đã xử lý hết
CHƯA KIỂM:   (1) A1 hành vi màn hình thật — không có bài máy chạy React, chỉ thử tay (cách thử ở bước 4–7); (2) hạn 30 ngày trên Render thật —
             Render đã đặt JWT_EXPIRES_IN=30d từ 12.10 nên mặc định mới chỉ là lưới dự phòng, chưa kiểm production; (3) huỷ đơn / hoàn tiền
             với đơn mua thẻ — ngoài phiếu, vùng chưa rà (CLAUDE.md §8); (4) viec/SO-LUONG-1/dot_bien.py từ nay thoát mã 1
             (1 "không áp được", chủ quán chốt (b) — ngoài npm test)
GIT:         99391e4 BAN-HANG-1 A1 (soat vong 1): mot vi tu cho ca 'co gi de go' va 'go' + build dist
             f68acad BAN-HANG-1 (soat vong 1): T3a so BANG 30 ngay thay vi nguong mot chieu; bang chung do chay lai (A16)
BÀI HỌC:     KHOÁ 1 · NGUYÊN TẮC 2 · BỎ 4 — chi tiết ở ## Bài học
```

## Bài học (bước 11)

Sự cố gom được: (a) agent soát bắt 3 điểm (số dòng cứng trong chú thích code sai ngay lúc commit; T3a ngưỡng một chiều; vị từ lặp
`some`/`filter`); (b) kế hoạch bản 1 đếm sai số đột biến SO-LUONG-1 (17 → "17 còn lại" thay vì 16) và bước 4–7 ghi số dòng lệch numstat;
(c) người gác chặn 7 lệnh trong lượt này: `B-BIMAT-CHU` ×2 (heredoc chứa tên biến khoá ký / chữ TOKEN; grep đệ quy đụng `.replit`),
`B-PHANTICH` (`<( )`), `B-DICHCHU` (biến `$NHAP` làm đích), `G0-NGOAI` (ghi tạm ngoài nháp), `B-CD-VITRI` (`cd` giữa lệnh), `B-MANOI`
(python3 -c nhắc file bảo vệ); (d) agent soát lần 1 chết vì giới hạn phiên 429, chạy lại; (e) lệnh gộp dài bị từ chối quyền, phải tách.

- **KHOÁ (đề xuất, ngoài Phạm vi — file `kiem_tra_truoc_khi_giao.js` bị cấm trong phiếu):** phép tĩnh cảnh báo chú thích code trong `server/` và
  `client/src/` chứa số dòng cứng dạng `(:NNNN)` / `dòng NNNN` / `:NNN–NNN` (trừ chú thích đầu file đã có sẵn — đếm hiện trạng trước rồi đặt
  bánh cóc như `NGUONG_FETCH`). Ca đỏ: `orders.js` bản `9294d40` có "(:1068)" trỏ sai ngay lúc commit. Nguyên tắc có sẵn ở CLAUDE.md §8 ("số
  dòng hay bị lệch") nhưng chưa có phép máy.
- **NGUYÊN TẮC (đề xuất thêm 1 dòng vào `KHUON_LOI.md` K3 — ngoài Phạm vi):** "Phép ngưỡng về HẰNG SỐ tất định (hạn token `expiresIn`, timeout,
  giá mặc định) → so BẰNG, không `>=`: `'30d'` → `'365d'` vẫn qua `>= 29 ngày` (BAN-HANG-1 T3a, soát bắt)." Khớp dòng K3 hiện có "phép so bằng /
  NGƯỠNG → ca ngay trên + ngay dưới".
- **NGUYÊN TẮC (đề xuất thêm 1 dòng vào K4):** "Cùng một vị từ ở `some` rồi `filter` (hoặc `if` rồi hành động) → gom về MỘT vị từ / biến; thêm cờ
  thứ tư sau này không thể lệch nhau (BAN-HANG-1 Sales.jsx `monLe`)."
- **BỎ:** đếm sai 17/16 và số dòng lệch numstat — K1 đã có ("đếm bằng `grep -c` / numstat, không nhớ"), lần này sửa ngay theo soát; không thêm luật.
- **BỎ:** 7 lệnh bị người gác chặn — đều là cách viết lệnh (heredoc chứa tên biến bí mật, `<( )`, biến làm đích, `cd` giữa lệnh), mỗi lần đọc lý do rồi
  viết lại là qua; người gác đã là KHOÁ, không cần luật thêm.
- **BỎ:** 429 giới hạn phiên và từ chối quyền lệnh gộp — sự cố môi trường, một lần.
- **Dọn:** không có lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` được phép máy mới làm thay trong việc này (không thêm phép máy ngoài bài thử).
  `KHUON_LOI.md` 104 dòng < 120 (`khuon_loi_toi_da`).
- Bước 11 không đổi file ngoài `viec/BAN-HANG-1/` (mọi đề xuất chờ chat soát duyệt). Lần kiểm cuối chạy trên cây = `99391e4`
  (`--day-du` 67/67, `dot_bien.py` 7/7, `thu_P26c.js` 111/0).

HEAD ĐÃ KIỂM: 99391e4
