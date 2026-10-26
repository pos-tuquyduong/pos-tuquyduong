# UUDAI-1 — kế hoạch (chờ chủ quán duyệt)

Nền: `8b436c0` (PHIEU: UUDAI-1). Mọi số dòng dưới đây đọc trong lượt này ở `8b436c0`.

## 0. Hiện trạng đã đọc (K1)

| Chỗ | File:dòng | Đang làm gì |
|---|---|---|
| Đọc mã | `server/routes/orders.js:547-597` | mã hợp lệ → `finalDiscountType/Value/Code`, `discountCodeId`, scope, nhóm. Mã sai / hết hạn / hết lượt / dưới `min_order` → **lặng lẽ bỏ, đơn vẫn 200** (bài cũ `thu_P26c.js:644` D3 khoá hành vi này). `min_order` so với `subtotal` GỐC (`:584`). |
| Giảm riêng của khách | `orders.js:610-627` | KHÔNG có mã hợp lệ → đọc `pos_customers.discount_type/value` (giảm riêng). |
| Giảm hạng | `orders.js:632-668` | `!flashApplied && phone`, hạng usable → mỗi dòng trừ gói/thẻ: `rate` = `special_discount_percent` (nhóm đặc biệt) hoặc `discount_percent`, kẹp 0–90; `tierDiscountAmount += round(unit×qty×rate/100)`, `tier_unit_price = round(unit×(1−rate/100))`. |
| Flash chặn % | `orders.js:688-693` | đơn dính Flash + loại % → 400. |
| Mã 1 món | `orders.js:698-711` + `server/utils/itemScopeDiscount.js:21-49` | chọn món đắt nhất trong nhóm (theo `unit_price` gốc), giảm trên `unit_price` GỐC của 1 đơn vị. |
| Mã % | `orders.js:714-727` | `subtotal × v / 100` — trên subtotal GỐC, **không làm tròn**; trần `max_discount`. |
| Trần chung | `orders.js:733-737` | chiết khấu ≤ `subtotal − flash − hạng`. |
| Tổng | `orders.js:748-755` | `total = subtotal − flash − hạng − ck + ship`. |
| Chỉ tính (payOS) | `orders.js:838` + `server/utils/giuCho.js:43` | `taoDon(..., { chiTinh: true })` trả `{ total }` sau mọi phép kiểm, không ghi. **Đi qua `checkStock` (gọi SX) ở `orders.js:382`.** |
| Tiêu mã | `orders.js:993-1027` | trong giao dịch: đọc lại `used_count`, hết lượt → 409-kiểu 400 `DISCOUNT_CODE_LIMIT_REACHED`; `used_count+1`; voucher đổi điểm → `used`. |
| Trả lượt mã | `server/utils/tienDaTra.js:58-63` | chỉ khi `order.discount_code` có → đơn không ghi mã thì huỷ/hoàn KHÔNG trả lượt (đúng ý C). |
| Cài đặt | `server/routes/settings.js:88-125` | `PUT /` có `checkPermission('manage_settings')` + role owner/manager, ghi MỌI khoá, **không kiểm giá trị**. |
| Seed | `server/database.js:1108` | khuôn `INSERT OR IGNORE INTO pos_settings (key, value) VALUES (...)` chạy mỗi lần khởi động. |
| Màn cũ tự tính tổng | `client/src/pages/Sales.jsx:586-610` | giảm mã = `discount_amount` của `/discount-codes/validate` (tính trên `order_subtotal` GỐC — `discount-codes.js:148`) rồi CỘNG thêm giảm hạng. Tiền gửi lên = tổng này. |
| Đối chiếu tiền | `orders.js:845-856` | `|tiền gửi − total máy chủ| > 1` → 400 "không khớp tổng đơn hàng thật". |
| Màn mới BH-1 | `client/src/pages/BanHang/tinh.js:143` | gửi `discount_code: null` (chưa có mã — BH-2 làm). Màn trang chủ mặc định là `Sales.jsx` (`BanHang/index.jsx:34`). |

## 1. CÂU HỎI CHẶN — Q1 (phải trả lời trước khi vá)

Đổi công thức máy chủ mà `Sales.jsx` vẫn tính theo công thức cũ → tổng lệch → **quầy bị 400 "không khớp tổng"**:
- Dùng chung (mặc định '1'): khách Vàng 10% + mã 10%, 2 × 50.000: màn cũ gửi 80.000, máy chủ mới tính 81.000 → chặn.
  Mã 1 món trên món có giá hạng cũng lệch. Mã tiền không lệch.
- Không dùng chung: mọi đơn khách hạng + mã đều lệch (màn cũ trừ cả hai).

`Sales.jsx` và `discount-codes.js` KHÔNG nằm trong Phạm vi (discount-codes.js còn nằm trong Cấm). Đề xuất (chọn một):
- **Q1-a (đề xuất):** thêm `client/src/pages/Sales.jsx` vào Phạm vi. Khi có mã hợp lệ: gọi `POST /orders/tinh-thu` qua client chung `api` đã export ở `client/src/utils/api.js:242` (KHÔNG sửa api.js — nó ngoài Phạm vi; không thêm `fetch` trần)
  mỗi lần giỏ / khách / mã đổi, dùng `total`, `tier_discount`, `discount_amount` máy chủ trả để hiện và để tính tiền thu; không mã → giữ
  nguyên cách tính hiện tại (số không đổi — G). Ước ~20 dòng. Màn cũ là màn đang bán thật nên không vá thì không bật được việc này.
- **Q1-b:** giữ `Sales.jsx`, chỉ lên máy chủ khi BH-2 thay màn cũ — nghĩa là UUDAI-1 nằm chờ, không gộp main trước BH-2.
- **Q1-c:** gộp nhưng để cả 3 khoá mặc định tắt-tính-năng (vẫn cộng như cũ, mã % vẫn trên giá gốc) cho tới khi màn cũ được vá — trái
  nghiệm thu B ("hạng tính trước") nên phải sửa phiếu.

## 2. Câu hỏi không chặn (đã chọn phương án, chủ quán sửa nếu muốn)

- **Q2 — "mã sai vẫn báo lỗi như cũ":** "như cũ" ở `POST /` là 200 + bỏ mã (D3 `thu_P26c.js:644`), lỗi chỉ hiện ở `/discount-codes/validate`.
  Chọn: **`POST /` giữ nguyên** (không thêm 400 — K5, D3 vẫn xanh); `tinh-thu` trả thêm `ma_loi` (lời tiếng Việt) + `ma_loi_code` khi mã gõ
  vào mà không áp được, và KHÔNG bao giờ trả `cach: 'hang'` vì mã sai — mã sai → `cach` tính như không có mã, kèm `ma_loi`. Như vậy giỏ
  "báo sai, không lặng lẽ bỏ", mà đường tạo đơn không đổi hành vi.
- **Q3 — giảm riêng của khách (`pos_customers.discount_value`):** không phải mã, hiện chỉ áp khi KHÔNG có mã hợp lệ, cộng với hạng, tính
  trên subtotal gốc. Chọn: **giữ y nguyên** (G "đơn không mã cho số y như cũ"; màn mới `BanHang/tinh.js:90` cũng tính đúng như vậy).
  Khi máy chọn hạng (C) thì giảm riêng KHÔNG bật lại — khách đã gõ mã, đơn chỉ có hạng.
- **Mốc `min_order`:** so với **subtotal gốc** (như cũ, `orders.js:584`). Lý do: không đổi hành vi; mốc "sau hạng" sẽ làm mã đang dùng được
  của khách Vàng bỗng không đạt ngưỡng (K5). Cùng mốc với `/validate` (`discount-codes.js:138`).
- **Làm tròn:** tiền giảm của mã % làm tròn `Math.round` về đồng (cũ không làm tròn). Chỉ đổi trên đơn có mã %; giảm riêng của khách giữ
  như cũ (không làm tròn) — ghi Phát hiện.
- **Mã % tính trên gì:** phần còn lại sau hạng = `subtotal − flash − giảm hạng` (gồm cả dòng gói / thẻ như cũ — mã % xưa nay áp cả dòng
  gói). Flash và mã % không cùng đơn (đã chặn `:688`), flash và hạng không cùng đơn (`:636`).
- **Mã bill / ưu đãi khách mới (P20b, `signup_*`)**: là dòng `pos_discount_codes` bình thường → theo cài đặt của loại tương ứng. Chỉ dòng
  có `pos_voucher_grants` cùng mã mới là "quà đổi điểm" luôn dùng chung (D).
- **Loại cài đặt của mã:** `discount_scope = 'item'` → khoá "giảm 1 món" (bất kể % hay tiền); còn lại theo `discount_type`
  (`percent` / `fixed`).

## 3. Phương án

### Phần 1 — hàm `tinhUuDai` (A, B, C, D)
- **A (chọn):** file mới `server/utils/uuDai.js`, một hàm thuần, ~70 dòng:
  ```
  tinhUuDai({ dong: [{ unit_price, quantity, ti_le_hang }],   // ti_le_hang đã kẹp 0–90; 0 cho gói/thẻ/flash/khách không hạng
              ma: null | { loai: 'percent'|'fixed', gia_tri, tran, chi_mot_mon: idx|null },
              dungChung: bool, truTruoc: flash, tenHang, tenMa })
  → { giam_hang, gia_hang: [tier_unit_price|null theo dòng], giam_ma, cach: 'ca_hai'|'hang'|'ma'|'khong', loi_hon, cau_ghi }
  ```
  Bên trong: một hàm con `tinhMa(nen, giaMon)` dùng cho cả ba lần tính (cả hai / chỉ mã) — không chép công thức. Chọn mã khi
  `tong_chi_ma < tong_chi_hang` (bằng → hạng). Mã 1 món dùng lại `computeItemDiscountAmount` (itemScopeDiscount.js) trên giá ĐÃ giảm hạng
  (dùng chung) hoặc giá gốc (chỉ mã). Việc chọn MÓN vẫn ở `findEligibleItemForGroup` (đọc DB) — orders.js gọi trước, truyền chỉ số dòng.
- B: viết thẳng vào orders.js (0 file mới) — loại: phiếu đòi file mới + COMBO-1a dùng lại.

### Phần 2 — nối vào `taoDon` (A, C, G)
- **A (chọn):** orders.js: thay khối tính hạng `:632-668` (giữ phần đọc hạng, chỉ còn tính `ti_le_hang` từng dòng) và khối số tiền mã
  `:698-737` bằng MỘT lời gọi `tinhUuDai`; đọc 3 khoá cài đặt + có-dòng-`pos_voucher_grants` bằng 2 câu `queryOne` ngay sau khi biết mã hợp lệ.
  Kết quả `cach === 'hang'` → `discountCodeId = null`, `finalDiscountCode = null`, `finalDiscountType/Value = null/0`, xoá `signup_unit_price` của món đã đánh dấu (`orders.js:711, 742` — không thì bill hiện giá mã chưa áp) (mã không tiêu:
  `used_count` không tăng, voucher không đổi, đơn không ghi mã, `traLuotMa` không trả). `cach === 'ma'` (không dùng chung) →
  `tierDiscountAmount = 0`, bỏ `tier_unit_price` mọi dòng, vẫn ghi `customer_tier`. Ước +35 / −45 dòng.
- B: chạy `taoDon` hai lần (một lần hạng, một lần mã) rồi so — loại: chậm gấp đôi, gọi SX hai lần.

### Phần 3 — `POST /orders/tinh-thu` (F)
- **A (chọn):** dùng lại chế độ chỉ tính có sẵn: route mới lọc thân theo danh sách trắng (món, SĐT, tên, mã, phí giao, gói, thẻ, mã gói —
  không có trường tiền nên mọi nhánh ví / CK / nợ không chạy) rồi gọi `taoDon(req, res, { chiTinh: true, tinhThu: true })`. `tinhThu` →
  bỏ qua `checkStock` (không gọi SX); dòng `:838` trả thêm khối chi tiết (subtotal, flash, hạng, mã, total, cach, cau_ghi, ma_loi, giá hạng
  từng món). giuCho.js chỉ đọc `total` → không đổi. Cùng hàm, cùng phép kiểm ⇒ "số tinh-thu = số POST /" đúng theo cấu tạo. Ước ~20 dòng.
- B: hàm tính riêng cho tinh-thu — loại: hai đường tính sẽ lệch (K4 "MỘT vị từ").

### Phần 4 — cài đặt (E)
- `database.js`: 1 vòng seed 3 khoá `uudai_chung_hang_percent`, `uudai_chung_hang_fixed`, `uudai_chung_hang_item` = '1' (~3 dòng).
- `settings.js` `PUT /`: TRƯỚC khi ghi bất kỳ khoá nào, khoá nào bắt đầu `uudai_chung_hang_` mà giá trị không phải '0'/'1' → 400
  `{ error, code: 'CAI_DAT_KHONG_HOP_LE' }`, không ghi gì (~6 dòng). Quyền: cổng `manage_settings` đã có.
- `Settings.jsx`: khối "Mã giảm & giá hạng" trong thẻ Hạng (`tab === 'tiers'`), 3 ô tích "Dùng chung với giá hạng", dòng giải thích, dòng
  "Quà đổi điểm: luôn dùng chung"; nạp/lưu qua `pkgApi('GET'|'PUT', '/api/pos/settings')` như `saveNhanDiemCfg` (~40 dòng). Build `dist`.

### Phần 5 — (nếu Q1-a) `Sales.jsx` ~20 dòng — xem Q1.

Tổng ước: ~150 dòng code máy chủ · ~40 giao diện (+20 nếu Q1-a) · ~300 dòng thử — trong ngân sách.

## 4. Ca thử ↔ nghiệm thu (`cong_cu/thu_UUDAI1.js`, khuôn `thu_DIEMTHAT1.js`: database.js + libsql thật trên kho tạm, SX giả)

| Nghiệm thu | Ca |
|---|---|
| A | A1 nạp `server/utils/uuDai.js`, có `tinhUuDai`; A2 hàm thuần: nguồn không `require` database / helpers, không `getNow`/`Date`; A3 POST / và tinh-thu cùng gọi `tinhUuDai` (grep orders.js: đúng 1 chỗ gọi, không còn `subtotal * finalDiscountValue`); A4 trả đủ 4 giá trị `cach`. |
| B | B1 2×50.000, Vàng 10%, mã 10%, bật → tier 10.000, mã 9.000, total 81.000 (POST / thật); B2 trần `max_discount` 5.000 → 85.000; B3 `min_order` = 100.000 → đạt (gốc 100.000) / `min_order` 100.001 → mã không áp; B4 mã tiền 95.000 → giảm 90.000 (không vượt phần còn lại), total 0; B5 mã 1 món 20% trên món 50.000 Vàng → giảm round(45.000×20%) = 9.000. |
| C | C1 2×39.000 tắt, mã 20.000 → `cach 'ma'`, total 58.000, `tier_discount` 0, `customer_tier` = 'Vàng', mọi `tier_unit_price` NULL; C2 mã 5.000 → `cach 'hang'`, total 70.200, `used_count` không đổi, đơn `discount_code` NULL; C3 bằng nhau (mã 7.800) → hạng; ngay trên (7.801) → mã; C4 mã thường `usage_limit` 1, đơn chọn hạng → đơn sau (khách không hạng) vẫn dùng được mã; C5 huỷ đơn chọn hạng → `used_count` không đổi; C5b duyệt hoàn (`refunds.js:172` → `traLuotMa`) đơn chọn hạng → `used_count` không đổi; C7 đơn chọn hạng với mã 1 món → không dòng nào có `signup_unit_price`; C6 tắt chỉ loại % — mã tiền vẫn cộng. |
| D | D1 voucher đổi điểm (có `pos_voucher_grants`), cả 3 khoá '0' → `cach 'ca_hai'`, voucher → `used`. |
| E | E1 khởi động kho mới → 3 khoá = '1'; E2 nhân viên (không `manage_settings`) PUT → 403; E3 chủ PUT '2' / 'true' / '' → 400 `CAI_DAT_KHONG_HOP_LE`, khoá KHÔNG đổi (kể cả khoá hợp lệ đi cùng yêu cầu); E4 PUT '0' → 200, đọc lại '0'; E5 cấu trúc `Settings.jsx`: đủ 3 khoá, chữ "Dùng chung với giá hạng", "Quà đổi điểm: luôn dùng chung"; `dist` khớp `src` (`--day-du`). |
| F | F1 tinh-thu trả đủ trường; F2 không ghi: số dòng `pos_orders`, `used_count`, `pos_voucher_grants.status`, `pos_phien_thanh_toan` không đổi; F3 không gọi SX (SX giả đếm lần gọi = 0); F4 cùng giỏ ở 6 cấu hình (bật/tắt × %/tiền/1 món) → số tinh-thu == số POST / ghi vào đơn; F5 chưa đăng nhập → 401; F6 mã sai → `ma_loi`, không `cach 'hang'`. |
| G | G1 Flash + mã tiền: không hạng, như cũ; G2 thẻ hết hạn → không hạng; G2b khách lẻ (không SĐT) + mã → không hạng, mã áp như cũ; G3 dòng gói / thẻ không giá hạng; G4 nhóm đặc biệt dùng `special_discount_percent`; G5 đơn KHÔNG mã (khách Vàng, có / không giảm riêng) → số y bản gốc (so với bản gốc chạy cùng giỏ); G6 điểm = `tinhDiemDon` trên total mới; G7 phí giao không giảm hạng, không áp mã. |
| K5 | K1 khách không hạng + mã → mã áp bình thường (cả bật lẫn tắt); K2 mã hết lượt → đơn 200 không mã như cũ (D3), tinh-thu có `ma_loi`; K3 đường payOS (`/thanh-toan` tạo phiên) với khách hạng + mã, tắt → `tong` phiên = total tinh-thu; K3b CHỐT phiên (`giuCho.js:97`, chạy lại `taoDon` đủ) cùng cài đặt → đơn ghi đúng `tong` phiên, `cach` như lúc tạo phiên. |
| Hai người cùng bấm | H1 mã còn 1 lượt, chế độ tắt: đơn A chọn hạng + đơn B chọn mã chồng nhau (khuôn `co.mocTruocTx`) → cả hai 200, `used_count` = 1; H2 hai đơn cùng chọn mã lượt cuối → một 200, một 400 `DISCOUNT_CODE_LIMIT_REACHED` (đường cũ giữ). H3 chủ đổi cài đặt giữa tinh-thu và POST → POST theo cài đặt mới; tiền gửi theo số cũ → 400 "không khớp" (không ghi sai). |

Bài cũ có thể đổi (Phạm vi): `thu_P26c.js` (mã % / 1 món trên khách có hạng nếu có), `thu_P3.js` (phiên chỉ tính), `thu_BH1.js` (cấu trúc),
`gia_lap/kich_ban.js` + `bat_bien.js` (thêm kịch bản khách hạng + mã chế độ tắt; bất biến dòng `bat_bien.js:249-257` "loại/trị giá đơn =
của mã" vẫn đúng vì đơn chọn hạng không ghi mã). Sẽ thăm dò (vá tạm, chạy, hoàn lại) trước khi viết bài để biết bài nào vỡ; bài cũ sửa
mà xanh trên gốc → xin `## Bài thử cũ sửa`.

## 5. Đường song song (K4)
- `discount-codes.js /validate` tính xem trước trên subtotal gốc (`:145-157`) — Cấm sửa → ghi Phát hiện; Q1-a cho màn cũ dùng tinh-thu thay.
- `giuCho.js` chỉ tính (`:43`) / chốt phiên (`:97`) → đi qua `taoDon`, tự theo. RỦI RO đã biết (không do việc này sinh ra, chỉ thêm một nguồn): chủ đổi cài đặt / mã hết lượt GIỮA lúc tạo phiên và lúc tiền payOS về → tổng đổi → chốt 400, phiên 'loi' (`giuCho.js:114-118`) dù khách đã trả. Cùng loại với giá món / Flash đổi giữa chừng hôm nay. Không vá ở đây (thanh-toan.js Cấm, giuCho.js ngoài Phạm vi) → ghi Phát hiện; ca K3b khoá đường bình thường.
- `damages.js:173` → `tienDaTraTheoDong` (`tienDaTra.js:21-23`) suy tiền giảm mã 1 món = `discount − flash − tier` → vẫn đúng với cả ba `cach` (đơn chọn mã có tier 0; chọn hạng không có mã); bài thử G có một ca đền bù trên đơn chọn mã để canh.
- `discount-codes.js /increment-usage` (`:355`) — đường tiêu mã thứ hai, không màn nào gọi, file Cấm → Phát hiện.
- `server/routes/kh/index.js:135` hiện `tier_unit_price || unit_price` → đơn chọn mã (tier NULL) hiện giá gốc, đúng.
- `refunds.js` / huỷ / xoá (`orders.js:1495, 1669`) → `traLuotMa` theo `order.discount_code` → tự đúng khi đơn chọn hạng không ghi mã.
- `pay-debt` không tính lại giảm → không đụng.
- `BanHang/tinh.js` (màn mới) chưa có mã → BH-2 dùng tinh-thu.
- App KH (`app_kh/`, `/api/kh`) — chưa tạo đơn có mã (grep khi vá; có thì đi `taoDon` nên tự theo).

## 6. Luồng hợp lệ phải KHÔNG bị chặn (K5)
Đơn không mã (khách lẻ / hạng / giảm riêng) · khách không hạng + mã · mã tiền + Flash · mua gói / thẻ + mã · lấy từ gói · đơn payOS · mã hết
lượt (200 như cũ) · cài đặt mặc định '1' với mã tiền (số không đổi) · PUT cài đặt các khoá khác (không bị kiểm '0'/'1') · Sales.jsx có mã (Q1).

## 7. Đột biến dự kiến (`dot_bien.py`)
`VS-MA-TREN-GOC` (mã % tính trên subtotal gốc) · `VS-BANG-CHON-MA` (`<` → `<=`) · `VS-CHON-HANG-VAN-TIEU-MA` · `VS-QUA-THEO-CAI-DAT` ·
`VS-MOT-MON-GIA-GOC` · `VS-CHON-MA-GIU-GIA-HANG` · `VS-TINHTHU-GOI-SX` · `VS-CAI-DAT-NHAN-MOI-GIA-TRI` · `VS-CAI-DAT-GHI-TRUOC-KIEM` ·
`BV-HAM` (taoDon không gọi tinhUuDai) · `BV-CAI-DAT` (bỏ phép kiểm '0'/'1') · `BV-SEED` · `BV-TINHTHU-CHI-TINH` (tinh-thu đi đường ghi).

## 8. Soát kế hoạch (agent phụ chỉ đọc, 26.10)
- Ngoài Phạm vi: Q1-a từng ghi "qua utils/api.js" (ngoài Phạm vi) → đổi thành dùng `api` đã export, không sửa api.js.
- Ngắn hơn: không có cách ngắn hơn đáng kể. Gợi ý bỏ làm tròn % — GIỮ làm tròn vì phiếu chốt "mọi số tiền là số nguyên đồng"; `ma_loi` dùng lại đúng câu của `/validate` nếu được, không thì một câu chung + `code`.
- Ca thiếu → đã thêm: C5b (duyệt hoàn), C7 (`signup_unit_price`), G2b (khách lẻ), K3b (chốt phiên).
- Đường song song sót → đã thêm vào mục 5: chốt phiên payOS, `damages.js` / `tienDaTraTheoDong`, `/increment-usage`, `kh/index.js`.
