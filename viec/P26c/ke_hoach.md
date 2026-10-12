# P26c — kế hoạch (CHỜ DUYỆT — chưa viết bài thử, chưa sửa code)

Số dòng dưới đây đọc trong lượt này trên HEAD `35f76b4` (= main `6c281f5` + phiếu). Số dòng trong phiếu / hồ sơ cũ đã trôi ít;
chỗ nào lệch thì ghi số thật.

## 0. Số đo thật (chạy RIÊNG, tuần tự, máy mây 12.10 — `scratchpad/do.js`)

| lệnh | thời gian | kết quả |
|---|---|---|
| `chay.js --luot 1` / `2` / `3` / `4` | 22,6 / 21,7 / 22,7 / 24,2 s | ĐẠT (hạn 180 s mỗi lượt) |
| `chay.js` (4 lượt song song) | 24,9 s | 29 KB · 16 bất biến · ĐẠT |
| `thu_gia_lap.js` | 42,3 s | 130 đạt (hạn 120 s, cảnh báo 96 s) |
| `thu_P26b.js` | 2,3 s | 65 đạt |
| `npm test` | 105,9 s | xanh |

Biên thời gian rộng: mỗi lượt còn ~155 s; thêm 4 KB (mỗi KB ~1–3 s) không chạm hạn nào.

## 1. Hàm dùng chung: "số tiền khách đã trả cho từng dòng" (Q2, Q4, B5)

Ba chỗ cần CÙNG phép tính: trần đền bù (`damages.js`), giá trị còn lại của gói khi huỷ / xoá (`orders.js` huỷ + xoá).

Công thức (đọc từ code tạo đơn — `orders.js:420–440` flash, `:524–556` hạng, `:630–651` tổng giảm):
- giá dòng sau flash / hạng: `e = COALESCE(flash_unit_price, tier_unit_price, unit_price) × quantity`
  (flash và hạng không cùng áp — `orders.js:532` `if (!flashApplied && phone)`);
- tiền hàng khách trả `T = pos_orders.total − shipping_fee` (= subtotal − TỔNG giảm, `orders.js:640–651`; cột `discount` đã gộp
  flash + hạng + mã, `:650`);
- tiền đã trả cho dòng = `floor(e × T / Σe)`. Chia theo tỉ lệ từ TỔNG đơn → tự gồm giảm cấp đơn (mã, giảm tay) và không bao giờ
  vượt số khách trả vì làm tròn (flash làm tròn trên tổng `:431`, giá từng ly làm tròn riêng `:436`).
- Kiểm hai ca phiếu: món 30.000 flash 25.000, đơn 1 món → e = 25.000, T = 25.000 → 25.000 ✓. Hai món 50.000 + 50.000, giảm đơn
  20.000 → T = 80.000 → mỗi dòng 40.000, tổng 80.000 ✓.

| | A: file mới `server/utils/tienDaTra.js` | B: hàm trong `orders.js`, `module.exports.tienDaTra = …` |
|---|---|---|
| số file | 1 mới + 2 chỗ gọi | 0 mới |
| dòng | ~20 | ~20 |
| rủi ro | **ngoài Phạm vi** — cần chủ quán thêm vào phiếu | `damages.js` nạp router đơn để lấy một hàm — ngược chiều, khó tìm |

**Chọn A nếu chủ quán cho thêm file vào Phạm vi (câu hỏi H1)**, không thì B. Cùng số dòng; A đặt đúng chỗ (định hướng 4).
Ca đơn giao từ gói: dòng giá 0 → e = 0 → đã trả 0 → trần đền 0 (như hiện nay: món từ gói không đền tiền).

## 2. Phần A — Gói

| Mục | Code hiện tại (đọc lượt này) | Sửa (phương án chọn) | ~dòng |
|---|---|---|---|
| A1 | xoá đơn trừ `delivered_qty` không xét trạng thái (`orders.js:1518–1534`); huỷ đã trừ (`:1376–1395`) | nhánh "giao từ gói" của xoá chỉ chạy khi `order.status !== 'cancelled'` (đơn `refunded` vẫn trừ — duyệt hoàn không đụng gói, `refunds.js:156` chỉ chặn đơn MUA gói) | 1 |
| A2 | cổng `conLai <= 0` không xét số lượng (`:222`); cộng `delivered_qty` SAU commit, ngoài giao dịch, không trần (`:1020–1038`) | dời câu cộng vào giao dịch đơn (sau INSERT món, trước commit) dạng `UPDATE … WHERE id = ? AND status = 'active' AND delivered_qty + ? <= total_qty`; `changes !== 1` → rollback, 400 `GOI_HET_LUOT`. Cổng ngoài giao dịch (`:222`) GIỮ NGUYÊN, không sửa (soát kế hoạch: sửa thêm là trùng) | ~12 |
| A3 | gửi cả `customer_package_id` lẫn `package_buy` → trừ cả hai gói, đơn bị ghi đè trỏ gói mới (`:975–985` + `:1021–1037`) | đầu route: có cả hai → 400 `GOI_MUA_VA_LAY_CUNG_DON` trước mọi ghi. Màn `Sales.jsx` KHÔNG sửa (phiếu chỉ đòi máy chủ; lỗi 400 hiện như mọi lỗi tạo đơn) | 5 |
| A4 | `PUT /customer-packages/:id/deliver` (`packages.js:170–185`), không màn hình gọi (grep `client/src`: 0) | xoá route + 1 dòng chú thích như `POST /buy` (`:168`) | −14 |
| A5 | huỷ đơn mua gói hoàn TRỌN `balance_amount` (`orders.js:1331–1341`), quyền `cancel_order` (nhân viên có — `database.js:950`) | xem mục 3 (Q4) | |

Đường song song A2 (K4): đơn MUA gói lấy ngay (`:973–987`) — `firstDeliveryQty` cũng không trần so với `total_qty`: thêm cổng
`firstDeliveryQty > total_qty → 400` trước giao dịch (2 dòng). Tạo gói vẫn sau commit như hiện nay (không đổi trong việc này —
Phát hiện 2).

## 3. Q4 — huỷ / xoá đơn mua gói

**Quyền mới** `refund_package` ("Hoàn gói trả trước"): `database.js` — thêm 3 dòng vào danh sách mặc định (`owner 1, manager 0,
staff 0`, `:930–967`) + MỘT vòng `INSERT OR IGNORE` cho 3 dòng đó NGOÀI khối `if count === 0` (`:927`) — kho đang chạy có quyền
mới, không đè quyền chủ quán đã chỉnh (bảng có `UNIQUE(role, permission)`, `:70`). Owner luôn qua (`auth.js:89`).

**Huỷ** (`orders.js` PUT `/:id/cancel`, trong giao dịch, ngay sau đọc đơn): đơn có gói mua (`pos_customer_packages.order_id`)
mà người bấm không phải owner và không có `refund_package` → rollback, 403 `PERMISSION_DENIED` (cùng mã với `checkPermission`),
không đổi gì. **Xoá** đã chỉ owner (`:1464`) → quyền mới luôn đạt; chỉ đổi số tiền.

**Số tiền** (Q4 + mục 1): mỗi gói của đơn: `giá đã trả gói × (total_qty − delivered_qty) ÷ total_qty` (giá đã trả gói = tiền đã
trả của dòng gói ÷ `pkg_qty`). Ca phiếu: 300.000 / 10 / lấy 4 → 180.000; chưa lấy → 300.000; lấy hết → 0.
Cách trả lại tiền khi đơn trả bằng nhiều nguồn và có món khác → **câu hỏi H2** (đề xuất ở đó; KHÔNG tự chọn).
Gói vẫn bị gỡ / huỷ như hiện nay (`:1344–1362`, `:1506–1516`).

## 4. Phần B — Báo sự cố đơn (`damages.js`, `Orders.jsx`)

| Mục | Code hiện tại | Sửa | ~dòng |
|---|---|---|---|
| B1 | trần theo `MAX(unit_price)` / `SUM(unit_price*quantity)` (`damages.js:152–154`) | đọc từng dòng cùng mã, tính "đã trả" (mục 1); trần lần này = `số lượng × MAX(đã trả/ly)`, trần cộng dồn = `Σ đã trả`; `damage_value` vẫn theo giá gốc (thống kê hỏng hàng — `:83`) | ~8 |
| B2 | `soGui \|\| damage_value` → gõ 0 = đền ĐỦ (`:162`) | `action === 'refund'` và `soGui <= 0` → 400 `TIEN_DEN_PHAI_LON_HON_0`; bỏ `\|\| damage_value`. `Orders.jsx`: ô tiền `min=1`, gợi ý sẵn = số máy chủ cho (xem dưới), lỗi 400 hiện nguyên lời máy chủ | 3 + ~6 |
| B3 | `return_stock` không xét trạng thái đơn (`:193`) | `(return_stock \|\| return_to_stock)` trên đơn `cancelled` → 400 `DON_DA_HUY_KHO` trong giao dịch, trước INSERT log | 2 |
| B4 | `refund` chỉ xét `status` (`:164`), đơn nợ vẫn cộng ví | **câu hỏi H3** | 1–3 |
| B5 | đền (`compensation`) rồi huỷ / xoá / duyệt hoàn → hoàn đủ phần ví | **câu hỏi H4** | ~10 |

Gợi ý số tiền ở `Orders.jsx:301`, `:1346`, `:1360` đang là `unit_price × số lượng` → sau B1 sẽ hay vượt trần (đơn có giảm).
Phương án ít dòng: màn hình tính gợi ý bằng `flash_unit_price || tier_unit_price || unit_price` của dòng (đã có trong chi tiết
đơn) — đúng với đơn không có giảm cấp đơn; đơn có giảm cấp đơn thì máy chủ trả 400 `VUOT_GIA` kèm số tối đa (`:166`, đã có).
Không thêm route mới.

## 5. Phần C — Đơn, ví, thu nợ

| Mục | Code hiện tại | Sửa | ~dòng |
|---|---|---|---|
| C1 | pay-debt cổng `status === "cancelled"` (`orders.js:1189`) + UPDATE `status != 'cancelled'` (`:1235`) | cả hai thành "chỉ `completed`" (đơn `refunded` → 400) | 2 |
| C2 mã bill | xoá đơn không đụng `pos_signup_codes` (`:1538–1543`) | **câu hỏi H5** (mã đã dùng thì sao) | 1–2 |
| C2 nợ kho | xoá đơn để nguyên `pos_stock_pending` của đơn; tự đẩy 3 phút (`doSoNo.js:46–53` không lọc đơn) gửi vân tay của đơn không còn | trong giao dịch xoá: nợ `out` CHƯA xong của đơn → `status = 'huy'` (hàng chưa từng ra khỏi SX) và sau commit KHÔNG gửi `in` cho đúng món đó (hai chiều triệt tiêu, SX không nghe gì). Nợ `in` còn chờ (huỷ lúc SX lỗi, `out` đã tới SX) → **câu hỏi H6** | ~8 |
| C3 | duyệt hoàn ghi ví không truyền `cot` (`refunds.js:159`, `:166`) | thêm `cot: 'total_spent', soCot: -số` cho ví con + ví mẹ (như huỷ, `orders.js:1335`, `:1340`). Bất biến mới I18 (mục 7) | 2 |
| C4 | thông báo chỉ phần ví con (`refunds.js:175–176`); `Refunds.jsx:55` chỉ `refund_amount` | thông báo cộng phần ví mẹ đã ghi + trường số `tong_hoan`. `Refunds.jsx` KHÔNG sửa (phiếu chỉ đòi thông báo) | 3 |
| C5 | xoá đơn không gỡ `pos_membership_purchases` (`orders.js:1536–1543`); huỷ có (`:1368–1374`) | thêm `DELETE FROM pos_membership_purchases WHERE order_id = ?` vào giao dịch xoá | 1 |

## 6. Phần D — Mã giảm giá, quà, hạng thẻ

| Mục | Code hiện tại | Sửa | ~dòng |
|---|---|---|---|
| D1 | `Settings.jsx:565–571` không gửi `max_discount`; máy chủ đã nhận + lưu + mang sang mã (`rewards.js:32`, `:47`; `loyalty.js:183`; trần áp ở `orders.js:614–624`) | thêm ô "Giảm tối đa" (hiện khi loại %), gửi `max_discount`; reset form gồm ô mới | ~8 |
| D2 | huỷ / xoá không trả lượt mã | **câu hỏi H7** | ~6 |
| D3 | `finalDiscountCode = discount_code` gán sẵn (`orders.js:450`) | gán `null`, chỉ ghi khi mã được áp (`:486`) | 1 |
| D4 | không chỗ nào đặt `pos_voucher_grants.status = 'used'` | trong giao dịch đơn, cạnh câu tăng `used_count` (`:894–897`): `UPDATE pos_voucher_grants SET status='used', used_order_id, used_at WHERE UPPER(code)=UPPER(?) AND status='available'`; nếu H7 chọn trả lượt thì huỷ / xoá đặt lại `available` | 2–4 |
| D5 | mặc định có `['Kim cương', …]` (`database.js:1144`) | xoá dòng đó. Chỉ chạy khi bảng rỗng (`:1140`) → không đụng dữ liệu đang có | 1 |

## 7. Bài thử, kịch bản, bất biến (E)

**Bài mới `cong_cu/thu_P26c.js`** — khuôn `thu_P26b.js` (database.js thật + libsql trên kho tạm, `--may-chu` cho đột biến).
Chỉ so status / code / kho, không dò chữ (E12). Ca ánh xạ 1-1 với nghiệm thu:

| Nghiệm thu | Ca (ĐỎ trên gốc ← vì sao) |
|---|---|
| A1 | giao 5, đơn lấy 2 → huỷ (còn 3) → xoá → vẫn 3 ← gốc còn 1 |
| A2 | gói 5 lượt đã lấy 4: lấy 2 → 400 `GOI_HET_LUOT`, `delivered_qty` 4 ← gốc 200, 6. Hai quầy (móc chồng như `thu_P26b`) mỗi bên lấy 1 khi còn 1 → 200 + 400, giao = tổng ← gốc 200 + 200. Đơn mua gói 3 lượt lấy ngay 4 → 400 |
| A3 | đơn có `package_buy` + `customer_package_id` → 400, gói cũ không đổi, không gói mới ← gốc 200 |
| A4 | `PUT /packages/customer-packages/1/deliver` → 404 ← gốc 200 |
| A5 | nhân viên huỷ đơn mua gói → 403, đơn + ví + gói không đổi ← gốc 200. Owner: 300.000 / 10 / lấy 4 → ví +180.000; chưa lấy → +300.000; lấy hết → +0 ← gốc +300.000 cả ba. Quản lý được cấp quyền → 200 (luồng hợp lệ). Xoá đơn mua gói (owner) cùng ba số |
| B1 | món 30.000 flash 25.000: đền 25.001 → 400, 25.000 → 200 (ca ngay trên / ngay đúng trần) ← gốc 200 ở 25.001. Đơn 2 món 50.000 giảm đơn 20.000: đền dồn 80.001 → 400, 80.000 → 200. Đơn không giảm: như cũ |
| B2 | `refund` số 0 / trống → 400, ví không đổi ← gốc 200 đền đủ. `none` → 200 (K5) |
| B3 | huỷ đơn → `return_stock` → 400, không thêm dòng nợ kho `in` / không gọi SX ← gốc gọi lần hai |
| B4 | theo H3 |
| B5 | theo H4: đền 10.000 rồi huỷ đơn trả ví 50.000 → tổng ví nhận ≤ 50.000 ← gốc 60.000; cùng ca cho duyệt hoàn và xoá |
| C1 | đơn nợ đã duyệt hoàn → pay-debt 400 ← gốc 200 |
| C2 | xoá đơn có mã bill → không còn dòng `pos_signup_codes` mồ côi ← gốc còn. Bán lúc SX lỗi rồi xoá → nợ `out` thành `huy`, không thêm `in`; gọi `doSoNo` → SX giả không nhận vân tay của đơn đó ← gốc nhận |
| C3 | duyệt hoàn 5.000 con + 20.000 mẹ → `total_spent` con −5.000, mẹ −20.000 ← gốc không đổi |
| C4 | thông báo duyệt có số 25.000 (so trường số trong JSON, không dò chữ: thêm trường `tong_hoan` — 1 dòng) ← gốc không có |
| C5 | xoá đơn mua thẻ → 0 dòng `pos_membership_purchases` ← gốc 1 |
| D1 | phép tĩnh trên `Settings.jsx`: thân `addReward` gửi `max_discount` ← gốc không. Máy chủ: quà 50 % trần 50.000, đơn 500.000 → giảm 50.000 (đã XANH trên gốc — máy chủ đúng sẵn, KB29 đã phủ; ghi rõ, không đếm là ca đỏ) |
| D2 | theo H7 |
| D3 | gõ mã hết hạn → đơn `discount_code` NULL ← gốc lưu mã |
| D4 | dùng mã đổi điểm → grant `used`, `used_order_id` = đơn ← gốc `available` |
| D5 | khởi tạo kho trống → hạng = {Vàng, Bạch Kim} ← gốc có "Kim cương" |
| G (5 quy tắc tạm) | mỗi quy tắc một ca "hết cần": (1) huỷ rồi xoá đơn giao từ gói = A1; (2) đơn đã huỷ báo sự cố: `refund` 400 (có sẵn), `return_stock` 400 = B3, `none` 200; (3) xoá đơn mua thẻ = C5; (4) huỷ đơn mua gói đã lấy = A5; (5) vừa mua vừa lấy = A3 |
| K5 (phải KHÔNG bị chặn) | bán thường; lấy từ gói trong lượt (lấy đúng số còn lại → 200); huỷ đơn thường (nhân viên → 200); "Chỉ ghi nhận"; "Hoàn kho SX" trên đơn `completed` → 200; hoàn tiền dưới trần; dùng mã / quà hợp lệ; owner huỷ đơn mua gói; đơn mua gói lấy ngay trong lượt; dữ liệu cũ: gói tạo trước việc này, đơn cũ có `discount_code` không áp |
| Kho bận (P26b K1b) | các nhánh mới trong giao dịch (A2, Q4, C2) — BUSY ở câu đầu → 409, không đổi gì (khuôn ca K1b có sẵn) |

**Giả lập** (`kich_ban.js`, `bat_bien.js`):
- KB đổi mong đợi CỐ Ý: KB21 (nhân viên huỷ đơn mua gói → 403; chủ huỷ → hoàn theo Q4, khẳng định số tiền cho ca đã giao 2/3),
  KB23 (xoá đơn mua gói: số tiền Q4), KB26 (bỏ `/deliver` → thay bằng ca `/deliver` 404), KB27 (sau C2 nợ kho của đơn xoá không
  còn bị đẩy → bỏ ràng buộc "KB27 phải cuối lượt"; giữ KB như cũ, đổi khẳng định số dòng nợ).
- KB mới (4, vào lượt 1 và 2 — ngắn nhất): KB30 gói (A1 + A2 chồng + A3), KB31 hoàn gói Q4 (owner / quản lý có quyền / nhân viên
  403), KB32 sự cố (B1 flash + giảm đơn, B2, B3, B5), KB33 (C1, C2, C5, D2–D4).
- Bất biến mới: **I18** cột tổng ví — `total_topup = Σ topup + Σ adjust>0`, `total_spent = −Σ purchase − Σ adjust<0 − Σ refund`
  (đền bù không tính); **I19** mỗi đơn: tổng khách nhận lại (refund + compensation theo `order_id`, mọi ví) ≤ số đã trả
  (ví + ví mẹ + tiền mặt + CK − ... theo H4). Đều chỉ ĐỌC (E1 — DOI-SOAT-1 chạy lại trên dữ liệu thật; **dữ liệu production cũ
  sẽ lệch I18** vì duyệt hoàn trước đây không giảm `total_spent` — DOI-SOAT-1 cần mốc ngày, ghi Phát hiện).
- Sửa bất biến có sẵn theo hành vi mới: I13 (nếu H7 trả lượt: đơn huỷ / xoá không đếm), I14 (bỏ vế `/deliver`), I7 (đơn đã xoá).
- E2: `NGUONG_KICH_BAN` 29 → 33, `NGUONG_BAT_BIEN` 16 → 18 (chỉ tăng); `DONG_DAT` + T9c (`thu_gia_lap.js:44`, `:320`) theo.

**Đột biến `viec/P26c/dot_bien.py`** — mỗi chỗ vá ≥ 1 `VS-` + 1 `BV-`, ước 24 chỗ vá → ~50 đột biến (thu_P26c ~3 s + lượt giả
lập ~23 s mỗi đột biến chạm giả lập). Ví dụ: `VS-A2-tran-ngoai-gd` (cổng số lượng chỉ ở ngoài giao dịch → ca hai quầy BẮT),
`VS-B1-gia-goc` (trần theo `unit_price`), `VS-Q4-hoan-tron`, `VS-C3-dau-soCot` (đổi dấu → I18 BẮT, đúng mong đợi phiếu C3),
`BV-A1-cong-trang-thai`, `BV-Q4-quyen`. Bộ cũ chạy lại: LUOI-1 80, TACH-GL 29, P26b — đột biến đổi mong đợi vì Q1–Q4 ghi
từng tên vào `trang_thai.md` (dự kiến chạm: các đột biến của KB21 / KB23 / KB26 / I14 vế `/deliver`).

## 8. Ngân sách và thời gian

| phần | ước lượng |
|---|---|
| máy chủ (`orders.js` ~110, `damages.js` ~20, `refunds.js` ~6, `packages.js` −14, `database.js` ~10, hàm chung ~20) | ~170 dòng |
| màn hình (`Settings.jsx` 8, `Orders.jsx` 6) | ~14 dòng |
| thử (`thu_P26c.js` ~380, KB ~130, bất biến ~40, sửa `thu_gia_lap` / ngưỡng ~6) | ~560 dòng — **vượt ~400 của phiếu ×1,4** (dưới 1,5): 20 mục nghiệm thu + 5 quy tắc G, mỗi mục cần cả ca đỏ lẫn ca K5 |

Thời gian MÁY (từ số đo mục 0): mỗi vòng kiểm `npm test` ~106 s + `--day-du` ~150 s (ước từ `npm test` + `thu_gia_lap` 42 s);
đột biến mới ~50 × (3–26 s) ≈ 12–20 phút; bộ cũ LUOI-1 80 + TACH-GL 29 + P26b ≈ 140 lần × ~25 s ≈ 60 phút. Một vòng đầy đủ
≈ 80–90 phút máy; với 2–3 vòng sửa (soát) cộng thời gian viết → **vượt ~180 phút** → câu hỏi H8 (đề xuất tách).

## 9. Câu hỏi cho chủ quán (chờ trả lời — KHÔNG tự chọn)

- **H1 (Phạm vi)** Cho thêm `server/utils/tienDaTra.js` (hàm "tiền khách đã trả từng dòng", ~20 dòng, dùng ở `damages.js` +
  `orders.js`)? Không thì để trong `orders.js` và xuất ra (phương án B mục 1). Đề xuất: cho thêm.
- **H2 (Q4 — cách trả lại khi huỷ / xoá đơn mua gói)** Đề xuất đơn giản nhất: tiền hoàn = tổng khách đã trả cho đơn − giá trị gói
  đã dùng (món khác trong đơn hoàn đủ như huỷ thường). Phần hoàn đi vào ví trước, tối đa phần đơn đã trả bằng ví (ví con trước,
  ví mẹ sau); phần còn lại (đơn trả tiền mặt / CK) máy KHÔNG ghi, chỉ trả về số `hoan_tay` để màn hình báo "trả tay khách X đ".
  Ví dụ: gói 300.000 trả ví 100.000 + tiền mặt 200.000, lấy 4/10 → hoàn 180.000 = ví +100.000, báo trả tay 80.000.
- **H3 (B4 — đền tiền trên đơn chưa thu)** Đề xuất: chặn — "Hoàn tiền" trên đơn chưa thu đủ (`payment_status ≠ paid`) → 400
  "thu tiền đơn trước rồi mới đền", "Chỉ ghi nhận" vẫn được. (Cách khác: trừ vào nợ đơn — đụng đường thu nợ, nhiều dòng hơn.)
- **H4 (B5 — đã đền rồi huỷ / xoá / duyệt hoàn)** Đề xuất: khoản hoàn VÍ lúc huỷ / xoá / duyệt hoàn trừ đi số đã đền của đơn
  (ví con trước rồi ví mẹ, không xuống dưới 0); phần đền vượt phần ví (đơn trả tiền mặt) thì `hoan_tay` (như H2) giảm tương ứng.
  Ví dụ: đơn ví 50.000, đã đền 10.000 → huỷ hoàn ví 40.000. Cách khác: chặn huỷ đơn đã đền (chặn luồng hợp lệ — không đề xuất).
- **H5 (C2 — mã bill khi xoá đơn)** Đề xuất: xoá mã CHƯA dùng; mã ĐÃ dùng (khách đã nhận ưu đãi / nhân điểm) giữ nguyên làm vết
  (orders.js:1076 dựa vào `claimed_phone` để không phát ưu đãi khách mới hai lần) và I2 chỉ coi mã chưa dùng là mồ côi.
- **H6 (C2 — nợ kho `in` của đơn đã huỷ rồi bị xoá)** Hàng đã ra khỏi SX (`out` đã tới), lệnh trả về (`in`) đang chờ đẩy. Không
  đẩy thì SX thiếu hàng thật. Đề xuất: VẪN đẩy (vân tay giữ nguyên), chỉ huỷ nợ `out` chưa tới SX như mục 5; I7 coi vân tay `in`
  của đơn đã xoá là hợp lệ khi có dòng nợ tương ứng. Phiếu ghi "KHÔNG còn bị tự đẩy" — xin xác nhận ngoại lệ này.
- **H7 (D2 — trả lượt mã khi huỷ / xoá)** Đề xuất: huỷ / xoá đơn ĐÃ áp mã (sau D3: `discount_code` khác NULL) → `used_count − 1`
  (không dưới 0) và voucher đổi điểm về `available` — khách giữ lại voucher, điểm không hoàn (điểm đã thành voucher). Đơn cũ
  trước D3 có thể lưu mã không áp → chỉ trả lượt khi `discount_type`/`discount_value` của đơn khớp mã (như I13 đang làm).
- **H8 (tách việc)** Ước thời gian vượt ~180 phút (mục 8). Đề xuất tách theo đường tiền:
  **P26c-1** = A1–A5, Q4, B1–B5, C1, G(1, 2, 4, 5), hàm chung, KB30–32, I19;
  **P26c-2** = C2–C5, D1–D5, G(3), KB33, I18. Hai phần không phụ thuộc nhau ngoài hàm chung (P26c-1 làm trước).
- **H9 (quyền Q4)** Quyền `refund_package` mặc định chỉ owner (đề xuất của chat) — xác nhận. Muốn cấp cho quản lý từ màn Phân
  quyền thì cần thêm 1 dòng vào danh sách quyền hiển thị `server/routes/users.js:158–171` — **ngoài Phạm vi**: cho thêm không?

## 10. Phát hiện (ngoài nghiệm thu — KHÔNG sửa)

1. `package_buy.total_qty` lấy từ màn hình (`Sales.jsx:747` ô `buyQty` sửa được; `orders.js:967` ghi thẳng), không so
   `pos_packages.total_qty` → trả giá gói 10 lượt mà ghi 100 lượt được. Q4 tính "giá trị còn lại" theo `total_qty` của gói khách
   → số hoàn cũng theo số này. Có từ trước. Nghiệp vụ: số lượt có được sửa ở quầy không?
2. Tạo gói khi mua (`orders.js:963–994`) và ghi mua thẻ (`:996–1017`) chạy SAU commit, lỗi chỉ log → khách trả tiền mà không có
   gói / thẻ. Có từ trước.
3. `PUT /customer-packages/:id/cancel` (`packages.js:188–199`) huỷ gói không hoàn tiền, không xét quyền Q4 (chỉ `manage_users`).
   Đúng với Q4 "mua rồi KHÔNG hoàn" — ghi để chủ quán biết.
4. `pay-debt` kho bận vẫn 500 (không qua `loiGhi`) — P26b Phát hiện 12, vế sau; ngoài nghiệm thu C1.
5. I18 trên dữ liệu production cũ sẽ lệch (duyệt hoàn trước P26c không giảm `total_spent`) — DOI-SOAT-1 cần mốc hoặc đối soát lại cột.

## 11. Luồng hợp lệ phải KHÔNG bị chặn (K5) — mỗi luồng một ca ở bảng mục 7, dòng K5
Bán thường · lấy từ gói trong lượt (kể cả lấy ĐÚNG số còn lại) · mua gói lấy ngay trong lượt · huỷ đơn thường (nhân viên) ·
"Chỉ ghi nhận" (cả đơn đã huỷ) · "Hoàn kho SX" đơn còn hiệu lực · hoàn tiền dưới / đúng trần · dùng mã / quà hợp lệ · owner và
quản lý có quyền huỷ đơn mua gói · thu nợ đơn `completed` · dữ liệu cũ (gói, mã trên đơn cũ, hạng đang có "Kim cương" giữ nguyên).

## 12. Soát kế hoạch (agent phụ, chỉ đọc) — CẦN SỬA 8 điểm, đã sửa ở đây

1. **Bất biến / `c.mong` đổi phải nêu từng chỗ + khẳng định thay thế ngang sức** (Cấm: không bớt bất biến / `c.mong`):
   - I14 vế "+ lần /deliver trả 200 (sổ quầy)": A4 bỏ route → `soQuay.giaoGoi` luôn 0; vế giữ nguyên trong code (vẫn cộng 0),
     KHÔNG xoá. Thay khẳng định KB26 "/deliver → 200, gói +1" bằng "/deliver → 404, gói không đổi" (cùng số `c.mong`).
   - I13 (chỉ khi H7 chọn trả lượt): "đếm đơn MỌI trạng thái" → "đếm đơn `completed`" — phép không bớt vế; đột biến "không trả
     lượt khi huỷ" phải BẮT bằng I13.
   - I7: thêm nhánh hợp lệ cho vân tay của đơn đã xoá (theo H6), không bớt vế nào; đột biến "xoá đơn vẫn gửi `in` khi `out`
     còn nợ" phải BẮT.
   - KB21: "nhân viên huỷ đơn mua gói đã giao 2/3 chồng nhau → 200 + 400" → "nhân viên → 403 (đơn, ví, gói không đổi)" + "hai
     owner chồng nhau → 200 + 400, ví + đúng 1/3 giá gói". Ca gói 2 (chưa giao) giữ "+ TRỌN giá gói" (owner). Số `c.mong` tăng.
   - KB23: thêm khẳng định số tiền Q4 (đơn trả tiền mặt → `hoan_tay` theo H2), không bớt khẳng định cũ.
   - KB27: "2 dòng nợ kho (out + in)" → "1 dòng nợ `out` trạng thái `huy`, SX không nhận gì sau khi đẩy sổ nợ" — chặt hơn.
2. **Mục H thiếu**: kế hoạch bổ sung — bước kiểm chạy `npm test`, `node kiem_tra_truoc_khi_giao.js --day-du` (0 CẢNH BÁO lúc
   chạy riêng), `thu_P26a`, `thu_P26b`, `thu_P20`, `thu_gia_lap`, `thu_P26c`; `(cd client && npm run build)` rồi commit `dist` (P1)
   vì sửa `Settings.jsx`, `Orders.jsx`.
3. **Ca kho bận** cho MỌI nhánh mới trong giao dịch: A2, A3 (trước ghi — không cần), Q4 quyền + số tiền, B2/B3 (trong
   `trongGiaoDich` của `damages.js`), C2, C3, C5, D3/D4 (giao dịch đơn), D2 nếu làm. Khuôn K1b của `thu_P26b` (BUSY ở câu đầu →
   409, kho không đổi) — mỗi route một ca, không mỗi nhánh (một route một giao dịch).
4. **K4 — đếm ly từ gói**: cộng theo `from_package` (`orders.js:1024`), trừ theo `unit_price = 0` (`:1383`, `:1522`). Đã xác
   minh: món 0đ chỉ có thể là món lấy từ gói — `orders.js:292` chặn `price <= 0` khi không `from_package`, giá dòng lấy từ
   `product.price` (`:349`), giảm mã 1-món không đổi `unit_price` (`:610`). Hai cách đếm trùng nhau → không sửa.
5. **K4 — duyệt hoàn cũng làm đơn mất hiệu lực** (`refunds.js:157`): H7 hỏi luôn cho đường duyệt hoàn (đề xuất: trả lượt mã như
   huỷ). Q2/B5 (H4) đã gồm duyệt hoàn.
6. **K4 — `return_stock` khi nợ `out` của món còn chờ** (hàng chưa ra khỏi SX mà hoàn về) → hoàn kho hai lần khi sổ nợ đẩy. Ngoài
   nghiệm thu B3 (phiếu chỉ nói đơn đã huỷ) → Phát hiện 6, không sửa.
7. **K5 thêm ca "phải KHÔNG bị chặn"**: (a) "Hoàn kho SX" trên đơn `refunded` → 200 (duyệt hoàn không trả kho); (b) owner xoá
   thẳng đơn giao từ gói `completed` → trừ `delivered_qty` đúng một lần; đơn `refunded` cũng vậy; (c) nhân viên huỷ đơn mua THẺ,
   đơn lấy từ gói → 200 (cổng Q4 chỉ bắt theo `pos_customer_packages.order_id`); (d) nếu H3 chọn chặn: đơn `partial` → "Hoàn
   tiền" 400, đơn `paid` sau khi trả nợ đủ → 200.
8. **B4, B5, D2** chờ H3 / H4 / H7: sau khi chủ quán trả lời, bổ sung ca có số tiền cụ thể (đỏ trên gốc → xanh) vào bảng mục 7
   TRƯỚC khi viết bài thử.

Tuỳ chọn soát nêu (đã làm): bỏ chặn sớm ở `Sales.jsx`, bỏ dòng ví mẹ ở `Refunds.jsx`, giữ nguyên cổng ngoài giao dịch của A2.
→ `Sales.jsx`, `Refunds.jsx` không còn đụng tới.

Phát hiện thêm (mục 10):
6. Báo sự cố "Hoàn kho SX" trên món mà nợ kho `out` của nó còn chờ (SX lỗi lúc bán) → khi sổ nợ đẩy, SX trừ một lần mà đã cộng
   một lần trước đó → hàng chưa từng ra khỏi SX được cộng về. Ngoài nghiệm thu B3.
