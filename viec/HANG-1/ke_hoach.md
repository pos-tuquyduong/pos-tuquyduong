# HANG-1 — kế hoạch (chờ chủ quán duyệt)

**Nói ngắn:** mình giữ "sổ thẻ" như hiện nay (mỗi lần mua / cấp là một dòng mới), thêm vào đó loại dòng (bán / cấp / thu hồi) và số
tháng. Hạn của từng hạng KHÔNG lưu sẵn mà máy **cộng lại từ sổ** mỗi lần đọc — nên mua cộng nối, huỷ đơn ở giữa, hai quầy cùng bán đều tự
ra đúng, không phải sửa đường huỷ đơn. Gói của hạng nằm ngay trong hàng của hạng. Có 3 câu cần bạn trả lời (mục 9) — quan trọng nhất là
**PIN chủ quán chưa có trong hệ thống**.

## 0. Hiện trạng (đọc trong lượt này, HEAD `c26b4e0`)
- `server/database.js:1292-1302` bảng `pos_membership_tiers (name, card_price, discount_percent, special_discount_percent, sort_order,
  is_active)`; seed kho trống `:1325-1328` Vàng 500.000 + Bạch Kim. `:1355-1366` `pos_membership_purchases (customer_phone, tier_id,
  tier_name, price_paid, order_id, purchased_at, expires_at NOT NULL, created_by)`.
- `server/routes/tiers.js:44-87` PUT chỉ UPDATE hạng có `id` (không thêm được), `:90-101` DELETE ẩn mềm, không kiểm khách đang giữ.
  `tier_card_valid_months` dùng chung mọi hạng (`:36`, `:73`).
- `server/utils/membershipStatus.js:10-32` hạng = dòng MỚI NHẤT (không phải hạng cao nhất), so `expires_at`.
- `server/routes/orders.js:233` cổng `membership_buy` (BAN-HANG-1), `:485-503` dòng hàng giá `card_price`, `:631-651` giảm hạng,
  `:1055-1073` ghi sổ hạn = bây giờ + `tier_card_valid_months`. Huỷ `:1525-1531` và xoá đơn `:1715` **XOÁ** dòng sổ của đơn.
  Một hàm `taoDon` dùng cho POST `/orders`, `/tinh-thu` (`:1265-1269`) và phiên thanh toán (`utils/giuCho.js:20` chuyển nguyên
  `membership_buy`). `refunds.js:24-27` đã chặn hoàn qua yêu cầu cho đơn có thẻ (chỉ Huỷ / Xoá đơn).
- Người đọc hạng: `routes/membership.js:22-31` (quầy, màn Khách), `routes/kh/index.js:48-52` (`/toi`, `/menu`), `routes/kh/index.js:90-97`
  (`/hang`), `routes/customers-v2.js:230-246` (danh sách khách — câu SQL RIÊNG "dòng mới nhất", đường song song của hàm chung).
- Giao diện: bán thẻ chỉ ở `client/src/pages/Sales.jsx:520-540, 967-993` (màn mới `BanHang/` không bán thẻ); Cài đặt hạng
  `Settings.jsx:660-731, 2065-2160` (bảng, xoá bằng `window.confirm`); màn Khách `Customers.jsx:44-58, 700-722` (chỉ xem).
- **Không có PIN chủ quán** ở đâu cả (grep `pin` trong `server/`: chỉ `utils/pinKhach.js` của KHÁCH).

## 1. Dữ liệu — bước nâng cấp `server/nang_cap/013_hang.js`

| | Phương án A — bảng gói riêng `pos_membership_tier_goi` | Phương án B (CHỌN) — cột `goi` (JSON) trong hàng hạng |
|---|---|---|
| file | 013 + tiers.js + backup.js (BACKUP_TABLES) | 013 + tiers.js |
| dòng | ~45 (bảng, chỉ mục, CRUD đồng bộ thêm / xoá từng gói) | ~25 |
| rủi ro | đồng bộ danh sách gói (xoá gói thừa) dễ sót; thêm một bảng phải sao lưu | không ràng buộc ở mức CSDL → một hàm kiểm duy nhất ở tiers.js |

Chọn **B**: gói luôn đọc / ghi cùng hạng (PUT gửi cả danh sách), không nối bảng, sao lưu đi kèm hàng hạng có sẵn trong BACKUP_TABLES
(`backup.js:84`). Phiếu ghi "bảng gói hạng" — đây là chỗ mình đề nghị khác phiếu, cần bạn duyệt. Khuôn có sẵn: cột JSON `hien` của bước 009.

013 (chỉ THÊM, cột qua `themCot` → tự chép bảng sao lưu trước):
- `pos_membership_tiers`: `cach_co TEXT NOT NULL DEFAULT 'ban'` (`ban` | `chi_cap`), `goi TEXT NOT NULL DEFAULT '[]'`
  (`[{ so_thang, gia, bat }]`, `gia` null = chưa đặt giá). **Thứ bậc = cột `sort_order` có sẵn** (lớn = cao — seed đã là Vàng 1 < Bạch Kim 2;
  `/hang` đã trả nó là `thu_tu`). Không thêm cột thứ bậc.
- `pos_membership_purchases`: `loai TEXT NOT NULL DEFAULT 'ban'` (`ban` | `cap` | `thu_hoi`), `so_thang INTEGER`. **Không thêm cột
  `vo_han`** (soát kế hoạch): cấp không thời hạn = `loai='cap'`, `so_thang` NULL, `expires_at = HAN_VO_HAN` — một cách ghi, không hai. Người cấp = `created_by` có sẵn, lúc cấp = `purchased_at` có sẵn. Dòng cũ (không `so_thang`) vẫn đọc đúng theo `expires_at`.
- Dữ liệu: `Vàng` (đúng tên) → `cach_co='ban'`, `goi` = 1 tháng + 3 tháng, giá trống, bật; `Kim Cương` (nếu có) → `chi_cap`, `goi='[]'`.
  Chỉ đổi khi `goi` còn `'[]'` (chạy lại không đè cài đặt chủ quán).
- Thứ bậc: đánh lại `sort_order` của các hạng đang bật thành 1..n theo thứ tự đang hiện (`sort_order, card_price, id`) — kho có hạng
  `sort_order` 0 (mặc định cột) hoặc trùng thì lần Lưu đầu không bị 400 oan; "cao nhất" không mơ hồ. Kim Cương thêm tay mà đứng dưới Vàng
  thì chủ quán bấm ▲ (không tự đoán thứ bậc thay chủ quán).
- Quyền mới `cap_hang`: owner 1 · manager 0 · staff 0 (`INSERT OR IGNORE pos_permissions`, như khuôn `database.js:1106-1110`).
- Dòng mua / cấp thẻ vẫn CHẶN khôi phục như nay (`backup.js:126`) — không đổi `backup.js`. Không có bảng mới → SAOLUU-2 không phải thêm.
- `chay.js`: không phải sửa (bước 013 theo đúng khuôn `chay(tx, { themCot })`).

## 2. Một hàm "hạng hiện tại" — `server/utils/membershipStatus.js` (nghiệm thu D, E)

| | A — lưu hạn cộng dồn vào từng dòng lúc ghi | B (CHỌN) — cộng lại hạn từ sổ mỗi lần đọc |
|---|---|---|
| ghi | đọc hạn cũ rồi ghi hạn mới: hai quầy cùng bán → cả hai cộng trên CÙNG hạn cũ → mất một kỳ (đua) | chỉ thêm dòng, không đọc trước → không đua |
| huỷ đơn | phải thêm cổng "có lần mua sau thì chặn huỷ" ở CẢ huỷ (`:1525`) lẫn xoá đơn (`:1715`) | KHÔNG đổi: xoá dòng của đơn → lần đọc sau tự tính lại hạn các lần sau |
| dòng | ~+40 ghi + ~+25 hai cổng huỷ | ~+60 một hàm thuần |

Chọn **B**. Hàm thuần `tinhHang(dongSo, dsHang, bayGio)` (không đụng CSDL, dễ thử) đi qua sổ của MỘT khách theo `purchased_at, id`:
- `ban` có `so_thang`: hạn = cộng tháng (lớn hơn của hạn đang còn và lúc mua) — **cộng nối**; dòng cũ không `so_thang`: hạn = lớn hơn của
  hạn đang có và `expires_at`.
- `cap`: hạn = (`so_thang` NULL) ? vô hạn : lúc cấp + số tháng (ĐẶT LẠI, như demo tab 2 — `demo_dot2.html` dòng `KH.the.filter(...)` rồi `push`).
- `thu_hoi`: hạng đó hết.
- Kết quả: hạng dùng được = vô hạn hoặc hạn > bây giờ; **hạng hiện tại = `sort_order` lớn nhất** trong các hạng dùng được (hạng trên hết
  hạn → tự về hạng dưới). Không hạng nào còn hạn mà sổ có dòng → `status 'expired'` với hạng hết gần nhất (màn Khách hiện như nay).
- Trả thêm `vo_han` (bool), `thu_bac` (khoá gói ở quầy chỉ cần số này). Bỏ `cac_hang[]` / "Còn giữ: …" của demo — không có trong nghiệm
  thu (soát kế hoạch câu 2); giữ nguyên `tier_id, tier_name, expires_at, days_remaining, status` (vô hạn: `expires_at`/`days_remaining` = null, status `active`).
- `getMembershipStatus(query, queryOne, getNow, phone)` GIỮ chữ ký → `orders.js`, `kh/index.js`, `membership.js` không đổi lời gọi.
  Thêm `hangNhieuKhach(query, getNow)` (2 câu SQL, gom theo SĐT, gọi CÙNG `tinhHang`) cho `customers-v2.js` — xoá câu SQL riêng ở đó.
- Cộng tháng `congThang(chuoiGioVN, n)` tính trên chuỗi `YYYY-MM-DDTHH:mm:ss` (Date.UTC) — không lệch theo múi giờ máy (thay
  `addMonthsSafe + toISOString` ở `orders.js:1062-1064`). Hạn vô hạn ghi vào `expires_at` (cột NOT NULL) bằng hằng số có tên `HAN_VO_HAN =
  '9999-12-31T23:59:59'`; người đọc cũ nào sót cũng hiểu là "còn hạn" (chiều an toàn). Mọi chỗ trả ra ngoài đổi nó thành `null`
  (`kh/index.js:51` đang `String(m.expires_at)` → phải sửa đúng dòng này, không để ra `"null"` hay `9999-…`).
- `expires_at` của dòng mới = hạn của hạng đó NGAY SAU dòng này (để nhật ký hiện "đến …"); chỉ để xem, hàm không dùng nó cho dòng mới.

## 3. Cài đặt hạng — `server/routes/tiers.js` (nghiệm thu A)
- `card_price` thôi dùng (giữ cột, không đọc / không ghi): bỏ cổng `card_price` ở PUT (`tiers.js:54-58` — giữ thì hạng mới 400), xếp
  `ORDER BY sort_order, id` ở `tiers.js:25` và `kh/index.js:45`; Settings / Sales thôi hiện ô giá thẻ.
- GET: thêm `cach_co`, `goi` (mảng), bỏ `valid_months` (hạn theo gói). Trả được nguyên vào PUT (bài P26a C9 gửi lại GET → 200).
- PUT `{ tiers[] }`: một hàm `kiemHang(t)` kiểm HẾT trước khi ghi (tên khác rỗng, `sort_order` nguyên ≥ 1 và **không trùng** giữa các hạng
  đang bật — trùng thì "cao nhất" mơ hồ; % 0–90 như cũ; `cach_co` ∈ ban/chi_cap; gói: `so_thang` nguyên 1–60 không trùng trong hạng, `gia`
  null hoặc số nguyên > 0, `bat` bool; `chi_cap` → lưu `goi=[]`). Sai → 400 `{ error, code: 'HANG_KHONG_HOP_LE' }`. Hạng không `id` → THÊM.
  Ghi trong MỘT giao dịch (hiện ghi từng câu rời — hỏng giữa chừng còn nửa cũ nửa mới).
- DELETE: **từ chối** 409 `HANG_CON_KHACH` khi còn khách đang giữ hạng còn hạn (đọc qua `hangNhieuKhach`, cùng hàm). Lý do chọn từ chối
  (không chỉ ẩn): hạng ẩn mà khách vẫn được giảm thì Cài đặt không còn thấy hạng đang có hiệu lực — khó đối soát; trước khai trương chưa
  bán thẻ nào nên gần như không bao giờ gặp. Hết khách giữ → ẩn mềm như cũ.
- Quyền: `manage_promotions` như cũ.

## 4. Bán gói ở quầy — `server/routes/orders.js` (nghiệm thu B)
- `membership_buy: { tier_id, so_thang }`; thiếu `so_thang` → 400 `THE_MUA_THIEU_THONG_TIN` (mở rộng đúng cổng `:233`).
- `:485-503`: hạng phải `is_active` + `cach_co='ban'` (khác → 400 `HANG_CHI_CAP`); gói khớp `so_thang`, `bat`, `gia > 0` (khác → 400
  `GOI_HANG_KHONG_BAN`); giá dòng = `gia` của gói **máy chủ tra** (không đọc giá máy khách). Khách có hạng còn hạn `sort_order` cao hơn →
  400 `DA_CO_HANG_CAO_HON` (gọi `getMembershipStatus`). Cùng hạng → cho, hạn cộng nối (mục 2). Tên dòng "🎟️ Thẻ hội viên Vàng · 3 tháng".
- `:1055-1073`: ghi `loai='ban', so_thang, price_paid = gia gói`; bỏ đọc `tier_card_valid_months`.
- Huỷ (`:1525`) / xoá đơn (`:1715`): **không đổi** (vẫn xoá dòng của đơn — mục 2 tính lại). `/tinh-thu`, phiên thanh toán đi cùng `taoDon`.

## 5. Cấp / thu hồi hạng — `server/routes/membership.js` (nghiệm thu C) — phụ thuộc câu hỏi Q1
- `POST /cap { phone, tier_id, so_thang | null (= không thời hạn), pin }` — `checkPermission('cap_hang')` + PIN chủ quán. Hạng phải `chi_cap`
  (khác → 400 `HANG_KHONG_PHAI_CHI_CAP`), SĐT chuẩn hoá được (cùng điều kiện với mua thẻ `orders.js:233` — màn Khách gộp cả khách SX chưa có
  dòng `pos_customers`, đòi dòng đó là chặn oan; chỉ ghi sổ thẻ, không tạo khách), `so_thang` nguyên 1–60.
  Ghi một dòng `loai='cap', price_paid=0, order_id=NULL, created_by=<người cấp>`. Không thu tiền, không qua đơn.
- `POST /thu-hoi { phone, tier_id, pin }` — cùng quyền + PIN; chỉ khi khách đang giữ hạng `chi_cap` đó → dòng `loai='thu_hoi'`.
- `GET /nhat-ky/:phone` (đăng nhập) — các dòng sổ của khách, mới trước (loại, hạng, số tháng / vô hạn, giá, đơn, lúc, ai).
- PIN sai / khoá → 400 `PIN_CHU_QUAN_SAI` / 423 `PIN_CHU_QUAN_KHOA`; chưa đặt PIN → 400 `CHUA_CO_PIN_CHU_QUAN`.

## 6. App KH — `server/routes/kh/index.js` + `HOP_DONG_API_KH.md` + `cong_cu/thu_HOPDONG_KH.js` (nghiệm thu F)
- `GET /hang`: thêm `chi_cap` (bool), `goi[] { so_thang, gia }` (chỉ gói bật + có giá, xếp theo tháng; `[]` khi chi_cap), `thu_bac`
  (= `sort_order`); `gia_the` = giá gói ngắn nhất, `null` khi chi_cap HOẶC chưa gói nào có giá (ghi rõ trong hợp đồng); giữ `thu_tu`.
- `/toi.khach.hang`: hạng CAO NHẤT còn hạn (qua hàm chung), `het_han` = null khi vô hạn. `/menu` đổi theo cùng hàm, không đổi trường.
- Hợp đồng: chuyển phần HANG-1 từ "Đã hẹn — v7" lên bảng cửa + khối JSON, tăng `PHIEN_BAN` lên 1 (5 → 6 nếu lúc làm chưa việc nào tăng),
  ghi nhật ký. `thu_HOPDONG_KH.js` thêm trường mới vào danh sách đối chiếu.

## 7. Giao diện (nghiệm thu G) — `client/src/**`, build `client/dist/**`
- `Settings.jsx` thẻ Hạng: mỗi hạng một thẻ (tên, "Thứ bậc n", ▲▼ đổi bậc, % thường, % nhóm đặc biệt, nút đôi Bán / Chỉ cấp, danh sách gói
  ☐Bán · tháng · giá · Xoá gói · ＋ Thêm gói), ＋ Thêm hạng, 💾 Lưu; Xoá hạng **bấm 2 lần** ("Bấm lần nữa để xoá"), bỏ `window.confirm`;
  bỏ ô "số tháng hiệu lực". Không có ô % combo (COMBO-1a — Cấm). Ô đặt PIN chủ quán (nếu Q1-a). Gọi máy chủ qua `utils/api.js`.
- `Sales.jsx` "🎟️ Mua thẻ": `unique_key` và `khoaGio` (`:160`, `:524`) thêm `so_thang` — đổi 1 → 3 tháng phải hỏi lại `/tinh-thu`;
  mỗi gói một nút "Vàng 3 tháng · 300.000đ"; gói chưa giá không hiện; khách có hạng cao hơn → nút khoá + lý do
  "Khách đang có hạng cao hơn"; giỏ gửi `{ tier_id, so_thang }`. Giá hiện trên giỏ chỉ để xem (máy chủ tự tính).
- `Customers.jsx`: danh sách (`:494-495`) và chi tiết: hạng hiện tại + hạn ("Không thời hạn" — không để "Còn null ngày"); khối "Cấp hạng" chỉ hiện khi `hasPermission('cap_hang')` (chọn
  hạng chi_cap, 1/3/6/12 tháng hoặc Không thời hạn, ô PIN, Cấp; Thu hồi cạnh hạng đã cấp); "Nhật ký hạng".
- Chủ quán thử tay trên điện thoại (LUAT §6.4): (1) Cài đặt → Hạng: thêm hạng, ▲▼, đặt giá gói Vàng, Lưu; (2) Bán hàng: chọn khách →
  Mua thẻ → Vàng 1 tháng → thu; (3) Khách hàng → khách đó → Cấp Kim Cương không thời hạn bằng PIN → thấy hạng đổi + nhật ký.

## 8. Bài thử `cong_cu/thu_HANG1.js` (khuôn `thu_P2223.js`: database.js + libsql thật trên kho tạm, route thật) — ánh xạ nghiệm thu

| Nghiệm thu | Ca (ca chặn / ca hành vi mới ĐỎ trên gốc; ca K5 "phải KHÔNG bị chặn" — A5b, A7, B4b, K1–K5 — vốn xanh trên gốc, là đối chứng) |
|---|---|
| A | A1 PUT thêm hạng không id + 2 gói → 200, GET thấy; A2 sửa gói (xoá một, thêm một) → đúng danh sách; A3 ngưỡng `so_thang` 0 / 1 / 60 / 61 / 1,5 → 400/200/200/400/400; A4 giá âm, giá lẻ, `cach_co` lạ, `sort_order` trùng → 400 `HANG_KHONG_HOP_LE`; A5 xoá hạng có khách còn hạn → 409 `HANG_CON_KHACH`, hạng vẫn bật; A5b (K5) xoá hạng khách đã hết hạn → 200; A6 `chi_cap` gửi kèm gói → lưu `[]`; A7 staff PUT → 403 |
| B | B1 bán Vàng 3 tháng, máy khách gửi giá giả ở CẢ `membership_buy.gia` / `unit_price` lẫn một dòng giỏ cùng `product_id` thẻ → tổng = giá gói máy chủ; B2 gói chưa giá / gói tắt / tháng không có → 400 `GOI_HANG_KHONG_BAN`; B3 hạng chi_cap → 400 `HANG_CHI_CAP`; B4 có Kim Cương còn hạn mua Vàng → 400 `DA_CO_HANG_CAO_HON`; B4b (K5) Kim Cương HẾT hạn mua Vàng → 200; B4c (K5) **lên hạng**: có Vàng còn hạn mua hạng `ban` cao hơn → 200, hạng hiện tại = hạng mới; B5 mua Vàng 1 tháng hai lần → hạn = lần 1 + 1 tháng + 1 tháng (cộng nối, so BẰNG chuỗi); B5b mua lần 2 sau khi lần 1 hết hạn → tính từ lúc mua; B6 **hai quầy cùng bấm** (co.mocTruocTx: lệnh 2 chạy trọn trước giao dịch lệnh 1) → 2 dòng, hạn = +2 kỳ (luật LUAT §6 đòi ca hai người cùng bấm cho việc tiền; canh luôn ai sau này đổi sang lưu hạn lúc ghi); B7 thiếu `so_thang` → 400; B8 `/tinh-thu` cùng giá + cùng mã lỗi |
| C | C1 manager / staff cấp → 403; C2 owner sai PIN → 400, 5 lần → 423; C3 owner + PIN đúng cấp Kim Cương vô hạn → 1 dòng `cap`, `vo_han=1`, `created_by`, `price_paid=0`, KHÔNG đơn nào; C4 cấp hạng `ban` → 400; C5 cấp 3 tháng → hạn = lúc cấp + 3 tháng; C6 thu hồi → dòng `thu_hoi`, hạng về hạng dưới; C6b thu hồi bởi manager / staff → 403, sai PIN → 400; C7 SĐT không chuẩn hoá được → 400; C7b (K5) khách chỉ có ở SX (không dòng `pos_customers`) cấp được, KHÔNG sinh dòng `pos_customers` |
| D | D1 Vàng + Kim Cương còn hạn → Kim Cương ở 5 chỗ (`/membership/status`, `/toi`, `/menu` `gia_hang` của khách, giá trên đơn, danh sách `customers-v2`); D2 Kim Cương có hạn hết, Vàng còn → Vàng ở cả 5 chỗ; D3 vô hạn → `expires_at` null, `status active`; D4 đổi thứ bậc (▲▼) → hạng hiện tại đổi theo; D5 đối chứng: mua Vàng SAU khi cấp Kim Cương (dòng mới nhất là Vàng) vẫn ra Kim Cương — ca bắt hàm cũ "dòng mới nhất" |
| E | E1 mua 1 tháng (lần 1) + 3 tháng (lần 2), huỷ lần 1 → hạn = lúc mua lần 2 + 3 tháng; E2 cùng ca qua XOÁ đơn; E3 huỷ lần 2 → hạn = lần 1 |
| F | F1 `/hang` đúng danh sách trường (so BẰNG) + `goi` chỉ gói bật có giá + `gia_the` = gói ngắn nhất / null; F2 `/toi.hang.het_han` null khi vô hạn; F3 `thu_HOPDONG_KH` xanh (chạy trong `npm test`) — dữ liệu mẫu của bài đặt giá cho một gói để `data[].goi[].so_thang` / `.gia` không rỗng (`coDuong` `thu_HOPDONG_KH.js:207` đòi mảng không rỗng) |
| G | bài tĩnh trên `client/src`, KHOANH đúng khối thẻ Hạng (Settings còn `confirm` ở chỗ khác — `:262, 391, 441, 605, 808` — không quét cả file): không `window.confirm`, xoá 2 lần; có ▲▼ và ＋ Thêm hạng; Sales: gói chưa giá không thành nút, gói khoá kèm lý do khi `thu_bac` khách cao hơn, gửi `so_thang`, `khoaGio` có `so_thang`; Customers: khối Cấp hạng sau `hasPermission('cap_hang')`, Nhật ký hạng, không "null ngày"; `--day-du` so băm dist |
| K5 | K1 khách đúng một hạng còn hạn: giá hạng trên đơn = trước khi vá (cùng số `tier_unit_price`); K2 điểm của đơn có giảm hạng không đổi; K3 đơn không mua thẻ không đổi; K4 dòng sổ CŨ (không `so_thang`) vẫn ra đúng hạng / hạn; K5 P26a C9 PUT lại GET → 200; bài cũ trong `npm test` xanh |
| Dữ liệu | N1 013 trên kho có Vàng + Kim Cương → Vàng ban 2 gói giá trống, KC chi_cap; N2 gọi THẲNG `chay()` của 013 lần hai (bộ chạy bỏ qua bước đã ghi ở `pos_nang_cap`, `chay.js:33-40` — đi qua bộ chạy là xanh oan) → không đè gói chủ quán đặt; N2b hạng `sort_order` 0 / trùng → 1..n, PUT lại GET → 200; N3 tên khác ("Vàng " có khoảng trắng) → không đổi; N4 có bảng `_sao_luu_013_*`; N5 Bạch Kim (seed) → `ban`, gói rỗng, không bán được (400 `GOI_HANG_KHONG_BAN`) |
| Đối soát | O1 cấp + thu hồi (dòng `order_id` NULL) → bất biến I15 KHÔNG báo lệch; O2 dòng `ban` mất đơn vẫn báo như cũ |

Đột biến `viec/HANG-1/dot_bien.py` (mỗi tên một dòng, chạy từng tên, có đối chứng):
`VS-hang-moi-nhat` (hạng = dòng mới nhất, như cũ — thay luôn `BV-tinhHang`, trùng nghĩa) · `VS-chieu-cao-hon` (lật chiều: chặn lên hạng) · `VS-khong-cong-noi` (hạn tính từ lúc mua, bỏ hạn đang còn) · `VS-gia-may-khach`
(giá dòng thẻ lấy `unit_price` gửi lên) · `VS-cao-hon-bang` (chặn cả cùng hạng: `>=` thay `>`) · `VS-cap-khong-pin` (bỏ kiểm PIN) ·
`VS-cap-quyen-chung` (cấp dùng `manage_promotions`) · `VS-vo-han-het` (vô hạn coi như hết) · `VS-xoa-hang-an` (xoá hạng còn khách vẫn ẩn) ·
`VS-goi-chua-gia-ban` (gói giá null bán 0đ) · `VS-thang-61` (nới 60 → 61) · `VS-thu-hoi-khong-pin` · `VS-khoa-gio-thieu-thang`
(Sales `khoaGio` bỏ `so_thang`) · `VS-I15-cap` (I15 bỏ lọc dòng cấp) · `BV-chi-cap` (bỏ cổng chi_cap ở bán) · `BV-cao-hon` (bỏ cổng hạng cao hơn) · `BV-xoa-hang` (bỏ cổng xoá) ·
`BV-customers-v2` (trả câu SQL riêng cũ) · `BV-hang-kh` (`/hang` trả như cũ).

**Đường song song cần canh (K4):** mọi chỗ đọc hạng (4 chỗ ở mục 0 — `customers-v2` là chỗ dễ sót) + bất biến Đối soát I15
(`cong_cu/gia_lap/bat_bien.js:296-302`, chạy cả ở màn Đối soát thật qua `utils/doiSoat.js:15`): dòng cấp / thu hồi không có đơn → phải lọc
`loai = 'ban'`, nếu không màn Đối soát đỏ oan mỗi lần cấp hạng; mọi chỗ ghi sổ thẻ (bán `:1055`, cấp,
thu hồi); mọi chỗ xoá sổ thẻ (huỷ `:1525`, xoá đơn `:1715`); `/tinh-thu` + phiên thanh toán (cùng `taoDon`); hai màn bán (chỉ `Sales.jsx`
bán thẻ); `refunds.js` (đã chặn, không đổi); mọi chỗ đọc `card_price` (`tiers.js:25, 54-58`, `kh/index.js:45, 93`, `Settings.jsx:680-689,
2117`, `Sales.jsx:530, 989`).
**Rủi ro biết trước, không thêm xử lý:** phiên QR payOS (`giuCho.js:20`) chạy lại `taoDon` lúc chốt — nếu giữa lúc mở phiên và lúc chốt chủ
quán tắt gói / đổi giá, hoặc khách vừa được cấp hạng cao hơn, đơn bị 400 sau khi khách đã chuyển. Đúng khuôn gói sản phẩm hiện nay (đổi giá
gói giữa chừng cũng vậy); cực hiếm trước khai trương — ghi vào CHƯA KIỂM / Phát hiện, không mở đường riêng.

**Luồng hợp lệ phải KHÔNG bị chặn (K5):** mua cùng hạng để gia hạn (B5); mua hạng thấp khi hạng cao đã hết hạn (B4b); mua thẻ + món cùng đơn
(P26c S4b — giá thẻ nay theo gói); **lên hạng** khi đang có hạng thấp còn hạn (B4c); cấp cho khách chỉ có ở SX (C7b); mua thẻ trả tài khoản (P2223, P24, HD1); khách không hạng mua đơn thường (K3); PUT lại nguyên GET (P26a C9);
xoá hạng không còn ai giữ (A5b); dòng sổ cũ không `so_thang` (K4); manager vẫn sửa Cài đặt hạng nếu có `manage_promotions`.

## 9. Câu hỏi cho chủ quán (đề xuất của mình in đậm — bạn chỉ cần xác nhận)
**Q1 — PIN chủ quán chưa có.** Phiếu đòi "cấp có PIN chủ quán" nhưng hệ thống chưa có PIN này (chỉ có PIN của khách).
- **Q1-a (đề xuất):** PIN 4–6 số của quán, lưu dạng băm (không ai đọc ra được), đặt / đổi ở Cài đặt → Hạng — chỉ tài khoản chủ quán, phải gõ
  mật khẩu đăng nhập; sai 5 lần khoá 15 phút. Một file chung `server/utils/pinChuQuan.js` để DONVI-1 (đổi đơn vị bán) dùng lại.
  Bộ đếm sai / khoá lưu ở `pos_settings` (không bảng mới); route đặt PIN `POST /api/pos/membership/pin-chu-quan` ở `membership.js`
  (trong Phạm vi; nếu bạn muốn nó ở Cài đặt chung thì thêm `server/routes/settings.js`).
  → bạn thêm dòng `- server/utils/pinChuQuan.js` vào `## Phạm vi` của phiếu.
- Q1-b: không làm PIN riêng, cấp hạng gõ lại **mật khẩu đăng nhập** của chủ quán (ít code nhất, không cần thêm file; nhưng khác demo).

**Q2 — 8 bài thử cũ + 1 bất biến Đối soát phải sửa** vì cách mua thẻ đổi (bạn đã duyệt đổi → là bài sửa bình thường, ghi `SỐ CA`): các bài này mua thẻ bằng
`{ tier_id }` với giá `card_price`, hoặc khoá `gia_the = card_price`; sau HANG-1 Vàng chưa có giá gói nên bán sẽ bị chặn. Mình chỉ sửa phần
dựng dữ liệu (đặt giá một gói, gửi `so_thang`) và danh sách trường `/hang`, KHÔNG đổi điều các bài đó canh.
→ thêm vào `## Phạm vi`: `cong_cu/thu_DOISOAT1.js`, `cong_cu/thu_HD1.js`, `cong_cu/thu_P2223.js`, `cong_cu/thu_P24.js`, `cong_cu/thu_P26c.js`,
`cong_cu/thu_KHAPI2.js`, `cong_cu/thu_UUDAI1.js` (`:371`, `:438`), `cong_cu/thu_P3.js` (`:591`), `cong_cu/gia_lap/kich_ban.js` (KB22 `:479`,
KB32 `:682`, KB33 `:696` — chạy ở `--day-du`), và `cong_cu/gia_lap/bat_bien.js` (I15 `:296-302`: dòng CẤP hạng không có đơn sẽ bị màn
Đối soát thật báo "dòng mua thẻ của đơn không còn" — sửa: chỉ xét `loai = 'ban'`).

**Q3 — KH-SDT-1 chưa gộp** (phiếu ghi "mở sau khi KH-SDT-1 gộp"). **Đề xuất:** làm luôn — luật hai việc không dính nhau; chỉ có thể vướng
khi gộp ở `customers-v2.js` / `kh/index.js` / `PHIEN_BAN`, chat soát xử lý lúc gộp.

**Đã tự chọn (nêu để bạn biết, không cần trả lời):** gói nằm trong hàng hạng thay vì bảng riêng (mục 1); xoá hạng còn khách → từ chối
(mục 3); huỷ đơn → tự tính lại hạn các lần sau, không chặn huỷ (mục 2); cấp lại cùng hạng → đặt lại hạn từ lúc cấp, như demo (mục 2).

## 10. Ngân sách (phiếu ~280 máy chủ · ~250 giao diện · ~450 thử)
- Máy chủ ~310: membershipStatus +70 · tiers +70 · membership +60 · orders +20 · customers-v2 −10 · kh/index +10 · 013 +40 ·
  pinChuQuan +50 (nếu Q1-a). Vượt ~30 dòng do PIN chủ quán (phiếu chưa tính phần đặt PIN).
- Giao diện ~300: Settings +170 (thay bảng cũ ~95 dòng) · Sales +40 · Customers +90. Vượt ~50 vì Cấp hạng + Nhật ký là khối mới hẳn.
- Thử ~520 (`thu_HANG1.js`) + ~45 dòng sửa 8 bài cũ + I15.

## 11. Soát kế hoạch (agent phụ chỉ đọc, 4 câu — 02.11)
Đã sửa kế hoạch theo các phát hiện (mình kiểm lại các dòng chính trước khi nhận):
- Ngoài Phạm vi bị sót: `thu_UUDAI1.js`, `thu_P3.js`, `gia_lap/kich_ban.js` (mua thẻ `{ tier_id }`), bất biến I15 `gia_lap/bat_bien.js`
  (dòng cấp không có đơn → Đối soát đỏ oan) → gộp vào Q2. Route + nơi lưu bộ đếm của PIN chủ quán → ghi rõ ở Q1.
- Ngắn hơn: bỏ `cac_hang[]` / "Còn giữ"; bỏ cột `vo_han` (chỉ một cách ghi vô hạn); gộp `BV-tinhHang` vào `VS-hang-moi-nhat`; bỏ ca E4.
  GIỮ ca B6 (LUAT §6 / skill bước 3 đòi ca hai người cùng bấm cho việc tiền) và PUT một giao dịch (PUT nay có thêm hạng mới).
- Ca thiếu / xanh oan: B1 gửi giá giả ở cả `membership_buy` lẫn dòng giỏ; thêm B4c lên hạng + `VS-chieu-cao-hon`; C6b quyền / PIN của thu hồi
  + `VS-thu-hoi-khong-pin`; D thêm `/menu`; F3 dữ liệu mẫu có gói có giá; G khoanh đúng thẻ Hạng, đủ ▲▼ / Thêm hạng / khoá gói / Nhật ký;
  N2 gọi thẳng `chay()`; thêm N5 Bạch Kim; nhãn "mỗi ca đỏ trên gốc" sửa thành ca chặn đỏ / ca K5 đối chứng.
- Đường song song: `card_price` mọi chỗ đọc (bỏ cổng PUT `tiers.js:54-58`); `Sales.jsx` `khoaGio`/`unique_key` thêm `so_thang`;
  danh sách khách `Customers.jsx:494-495` với vô hạn; `kh/index.js:51` `het_han`; 013 đánh lại `sort_order` 1..n; cấp không đòi dòng
  `pos_customers` (khách SX); phiên payOS ghi là rủi ro biết trước.
- Ghi để biết, không làm: quyền `cap_hang` chưa có nhãn ở `server/routes/users.js:156-171` (ngoài Phạm vi — `refund_package`,
  `xoa_pin_khach` cũng vậy); owner luôn qua `checkPermission` (`middleware/auth.js:90`).

## 12. Câu 4 (chủ quán 05.11: a theo đề xuất, b1) — vòng sửa sau soát vòng 3 + soát bảo mật lần 1
| Phần | A (chọn) | B (bỏ) |
|---|---|---|
| (a) khôi phục file đổi hạng | `pos_membership_tiers` vào `BANG_KHONG_KHOI_PHUC` (backup.js, 1 dòng) — xem trước + khôi phục 400 như ví / đơn / sổ thẻ | `restore` đòi PIN + chạy `kiemHang` từng dòng — thêm đường ghi hạng thứ hai (K4), nhiều dòng |
| (b1) đổi PIN | `datPinChuQuan(…, pinCu)`: đã có PIN → `kiemPinChuQuan(pinCu)` SAU kiểm dữ liệu (cùng bộ đếm / khoá) — ~4 dòng | hàm so PIN riêng — mất bộ đếm, đổi PIN thành chỗ dò PIN |
| băm PIN | `boCot: ['pin_bam']` ở dòng bảng + `readTablePaged` bỏ cột (2 chỗ gọi) — bảng vẫn sao lưu (E8 / D2c) | bỏ bảng khỏi BACKUP_TABLES — phạm E8 / SAOLUU-2 D2c |
| giao diện | ô "PIN cũ" chỉ khi đã có PIN, gửi `pin_cu`; KHÔNG nút quên PIN | — |
Ca thử (thu_HANG1 mục [S] + G1e/G1g): S1 (xem trước + khôi phục trang hạng → 400, hạng không đổi) · S1b K5 (file không trang hạng → 200) ·
S2 / S2b (xuất tất cả / xuất riêng: không cột pin_bam, không băm; bảng vẫn có) · S3 (không PIN cũ → 400) · S3b (PIN cũ sai) · S3c (PIN mới sai dạng
không tốn lượt) · S4 (sai 5 lần → 423, đổi PIN không gỡ khoá) · S5 K5 (đúng PIN cũ → 200) · S5b (sai mật khẩu) · S5c (quản lý → 403) ·
C0e K5 (lần đầu chưa có PIN → đặt không cần PIN cũ) · G1g.
Đường song song (K4): ghi `pos_membership_tiers` — chỉ tiers.js (PIN), khôi phục (nay chặn), bước 013, seed database.js; ghi `pos_pin_chu_quan` —
chỉ pinChuQuan.js; khôi phục bảng PIN đã chặn từ trước. Xuất bảng: export-all + export/:table (cả hai bỏ cột).
Luồng hợp lệ (K5): đặt PIN lần đầu; đổi PIN đúng PIN cũ; khôi phục file không có trang hạng; xuất sao lưu vẫn có bảng PIN.
Ngoài Phạm vi bị chặn theo: bài cũ khôi phục NGUYÊN file "xuất tất cả" (trang hạng luôn có dòng) — `thu_SAOLUU2` F1, `thu_KHO1` J3/J5/J6/J7,
`thu_KHO2b` H4 → câu hỏi 5.
