# GIO-VN-1 — kế hoạch (chờ chủ quán duyệt)

**Nói gọn:** máy chủ quầy chạy ở giờ quốc tế (UTC, chậm hơn giờ Việt Nam 7 tiếng). Phần lớn code đã ghi giờ đúng bằng `getNow`
(giờ VN, dạng `2026-11-02T14:03:00`), nhưng còn **~45 chỗ** ghi giờ quốc tế hoặc giờ VN mà dùng dấu cách thay chữ `T`. Kế hoạch:
(A) sửa từng chỗ ghi cho về `getNow`; (B) một bước nâng cấp 012 đổi giờ CŨ trong kho — chỉ đổi dòng biết CHẮC là giờ quốc tế, có sao
lưu; (C) sửa các phép so hạn đang lệch; (D) bài thử quét chặn tái phạm; (E) hợp đồng App KH bỏ câu "Lỗi đã biết".

Mọi số dòng dưới đây đọc ở commit `36b98b8` (lượt này). `grep` tái lập ở cuối mỗi phần.

---

## A · Chỗ ghi giờ UTC / sai dạng trong `server/` — sửa TẠI CHỖ về `getNow()` / `getToday()`

Phương án A1 (chọn): truyền `getNow()` làm tham số `?` ở từng câu (đã có sẵn `const now = getNow()` ở phần lớn route). ~1 dòng/chỗ.
Phương án A2: đổi `DEFAULT CURRENT_TIMESTAMP` của cột — **không làm được**: SQLite không đổi DEFAULT của bảng đã có; muốn đổi phải dựng
lại bảng = đổi cấu trúc DB (phiếu cấm). A3: trigger SQLite tự đổi sau INSERT — cũng là đổi cấu trúc, và giấu luật vào CSDL. → A1.

### A.1 Ghi bằng hàm giờ của SQLite (UTC, dấu cách) hoặc `+7 hours` (giờ VN nhưng dấu cách)
| # | file:dòng | hiện tại | sửa thành |
|---|---|---|---|
| 1 | `server/routes/damages.js:195` | `created_at = datetime('now')` (UTC) | `?` ← `getNow()` |
| 2 | `server/utils/doSoNo.js:80` | `resolved_at = datetime('now')` (UTC) | `?` ← `getNow()` |
| 3 | `server/routes/products.js:167, 215, 314` | `updated_at = datetime("now")` (UTC) | `?` ← `getNow()` |
| 4 | `server/routes/products.js:174` | `created_at, updated_at = datetime("now")` | `?, ?` ← `getNow()` |
| 5 | `server/routes/products.js:51-52` | `ton_luc` = `new Date(Date.now()+7h).toISOString()…replace('T',' ')` (VN, dấu cách) | `getNow()` |
| 6 | `server/routes/customers-v2.js:59, 65` | `updated_at = CURRENT_TIMESTAMP` (UTC) + `created_at` bỏ trống → DEFAULT UTC | truyền `getNow()` cho cả hai |
| 7 | `server/routes/customers-v2.js:321, 328` | `updated_at` / `created_at = CURRENT_TIMESTAMP` | `?` ← `getNow()` |
| 8 | `server/routes/settings.js:315` | `printed_at = datetime('now','+7 hours')` (VN, dấu cách) | `?` ← `getNow()` |
| 9 | `server/routes/settings.js:423, 455` | `deleted_at = datetime('now','+7 hours')` | `?` ← `getNow()` |
| 10 | `server/database.js:1252, 1269, 1285, 1330, 1344` | `updated_at`/`created_at = datetime('now','+7 hours')` | `?` ← `getNow()` |

### A.2 `new Date().toISOString()` (UTC, đuôi `.sssZ`) dùng để GHI hay TRẢ RA
| # | file:dòng | cột / chỗ | sửa |
|---|---|---|---|
| 11 | `server/routes/packages.js:60, 118, 136` | `pos_packages.created_at/updated_at` | `getNow()` |
| 12 | `server/routes/packages.js:195, 247` | `pos_customer_packages.updated_at` (+ các cột `now` ở 247 dùng) | `getNow()` |
| 13 | `server/routes/settings.js:160, 205, 251` | `pos_settings.updated_at` | `getNow()` |
| 14 | `server/routes/backup.js:233` | `backup_date` trong file sao lưu | `getNow()` |
| 15 | `server/index.js:133` | `/api/pos/health` `timestamp` | `getNow()` |
| 16 | `server/index.js:69` | dòng log mỗi yêu cầu | `getNow()` (khỏi cần ngoại lệ) |
| 17 | `server/routes/backup.js:241, 274` · `sync.js:153` · `registrations.js:69, 94` | NGÀY trong tên file `toISOString().slice(0,10)` (0–7 giờ sáng ra ngày hôm qua) | `getToday()` |

### A.3 INSERT bỏ trống cột `DEFAULT CURRENT_TIMESTAMP` → cột nhận giờ UTC
Quét bằng `viec/GIO-VN-1` script (cùng phép sẽ nằm trong bài thử D): bảng → cột DEFAULT lấy từ `CREATE TABLE` của `database.js`, đối
chiếu danh sách cột của mọi `INSERT INTO <bảng> (…)` trong `server/`. Thiếu cột:
| # | file:dòng | bảng.cột |
|---|---|---|
| 18 | `server/database.js:1040` | `pos_users.created_at` (admin mặc định) |
| 19 | `server/database.js:1094, 1103, 1108` · `server/routes/users.js:215` | `pos_permissions.created_at` |
| 20 | `server/database.js:1112, 1115, 1120, 1447` | `pos_settings.updated_at` |
| 21 | `server/database.js:1139` · `server/kho/nhapSx.js:183` · `server/routes/products.js:220, 320` | `pos_products.created_at` |
| 22 | `server/database.js:1329` | `pos_membership_tiers.created_at` (đã có `updated_at` +7h ở #10) |
| 23 | `server/database.js:1401` | `pos_product_groups.created_at` |
| 24 | `server/routes/product-groups.js:77` | `pos_product_group_members.created_at` |
| 25 | `server/routes/registrations.js:102` | `pos_export_logs.created_at` |

### A.4 Dạng giờ VN nhưng dấu cách (so chuỗi với `getNow` sẽ sai — xem C)
| # | file:dòng | sửa |
|---|---|---|
| 26 | `server/routes/orders.js:1062-1064` | `pos_membership_purchases.expires_at`: `new Date(now)` + `addMonthsSafe` dùng giờ của MÁY rồi `toISOString` → chỉ đúng khi máy chạy UTC, và dấu cách. Sửa: tính trên `Date.parse(now + 'Z')` bằng phép UTC thuần (khuôn `manKhach.js:35`; cộng tháng chốt cuối tháng như `addMonthsSafe`), ra dạng `T` — đúng ở mọi múi giờ máy |

### A.5 "Hôm nay / bây giờ" lấy theo đồng hồ máy chủ (UTC)
| # | file:dòng | lỗi | sửa |
|---|---|---|---|
| 27 | `server/routes/orders.js:132` | thống kê đơn "hôm nay" `DATE('now','localtime')` — Render TZ UTC → 0–7 giờ sáng là hôm qua | `= ?` ← `getToday()` |
| 28 | `server/routes/sync.js:65, 79` | cảnh báo khách tồn > 1 / > 2 ngày so `datetime('now', …)` (UTC) | so với `strftime('%Y-%m-%dT%H:%M:%S', ?, '-1 day')` ← `getNow()` (khuôn `GIO` của `giuCho.js:21`) |
| 29 | `server/routes/damages.js:76-77` | tháng thống kê mặc định `new Date().getFullYear()/getMonth()` | `getToday().slice(0,4)` / `.slice(5,7)` |
| 30 | `server/routes/settings.js:270, 474` | năm số hoá đơn `new Date().getFullYear()` (đêm giao thừa 0–7 giờ sáng 01.01 ra năm cũ) | `Number(getToday().slice(0,4))` |

### A.6 Chỗ ĐỌC đang bù +7 giờ (đường song song K4 — sửa dữ liệu mà quên chỗ này thì lệch ngược)
| # | file:dòng | sửa |
|---|---|---|
| 31 | `server/utils/doiSoat.js:221` (phép DEN) | `DATETIME(created_at,'+7 hours')` → chỉ bù khi giá trị còn dạng cũ (dấu cách = UTC cũ của `pos_damage_logs`), dạng `T` lấy nguyên: `CASE WHEN created_at LIKE '%T%' THEN created_at ELSE DATETIME(created_at,'+7 hours') END`. Lý do giữ nhánh cũ: bước 012 hỏng thì quầy vẫn bán (chay.js), dữ liệu còn dạng cũ — vẫn đúng; và bài cũ `thu_DOISOAT1.js` DEN1/DEN2 (gieo `'2027-01-06 17:30:00'` UTC) giữ XANH, không phải sửa bài ngoài Phạm vi. Chú thích dòng 219 sửa cùng. |
| — | `server/routes/products.js:48-50` | chú thích "các cột khác dùng datetime('now') = UTC" sẽ SAI sau vá → sửa cùng dòng vá (K1 TU-CHAY-6). |

**Không sửa — đúng rồi, ghi để người soát khỏi hỏi** (cũng là danh sách ngoại lệ của bài thử D):
- `Date.now()` đo khoảng thời gian / bộ nhớ đệm trong RAM, không ghi, không so với giờ lưu: `manKhach.js:74,80,113,116`,
  `doSoNo.js:103,116,117`, `customers-v2.js:34,35`, `maKhach.js:77`, `donApp.js:60`, `backup.js:215,226,245`.
- `giuCho.js:52` `Date.now()/1000` = mốc giây tuyệt đối gửi payOS (payOS đòi epoch) — không phải chuỗi giờ.
- `toISOString()` trên Date dựng từ chuỗi giờ VN coi như UTC (`Date.parse(getNow()+'Z')`, `Date.UTC(...)`) — phép cộng/trừ thuần, kết
  quả vẫn giờ VN: `manKhach.js:35`, `gioHoatDong.js:21,25`, `donApp.js:44`, `helpers.js:122`, `loyalty.js:38`.
- `khachAuth.js:56` đổi `exp` của token ra giờ VN — đúng.
- `orders.js:573`, `settings.js:476`, `discount-codes.js:94`, `database.js:381,640,643`, `goiKhach.js:42` — chú thích kể lỗi cũ đã vá.
- `CREATE TABLE … DEFAULT CURRENT_TIMESTAMP` — giữ (không đổi cấu trúc); mọi INSERT đã truyền giờ nên DEFAULT không còn được dùng.

Tái lập: `grep -rn --include=*.js -E "CURRENT_TIMESTAMP|datetime\('now'|datetime\(\"now\"|date\('now'|localtime|toISOString\(\)|\+7 hours|7 \* 3600|new Date\(\)\.get" server/`

### A.7 Màn quầy (`client/src/`) — "hôm nay" lấy theo giờ UTC của điện thoại
`new Date().toISOString().slice(0,10)` ra ngày quốc tế → từ 0 giờ tới 7 giờ sáng giờ VN, màn mặc định lọc **ngày hôm qua**:
`client/src/pages/Orders.jsx:25, 78` (Lịch sử đơn), `client/src/pages/Reports.jsx:12, 14, 15` (Báo cáo). Sửa: lấy ngày theo
`toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })` (một hàm nhỏ trong `client/src/utils/`, dùng lại ở 2 màn). Tên file tải
về (`api.js:284, 420`, `Settings.jsx:859, 884`) dùng cùng hàm. Build `client/dist` + `--day-du`.
Phương án B: để nguyên client, ghi Phát hiện — rẻ hơn 8 dòng nhưng bỏ đúng lỗi "đối soát ngày" của mục tiêu. → sửa.

---

## B · Bước nâng cấp `server/nang_cap/012_gio_viet_nam.js` — dữ liệu cũ

Khuôn 004 (đổi DỮ LIỆU, không đổi cột): MỘT giao dịch do `chay.js` mở; mỗi bảng có dòng sẽ đổi → `CREATE TABLE IF NOT EXISTS
_sao_luu_012_<bảng> AS SELECT * FROM <bảng>` TRƯỚC khi UPDATE; không DELETE / DROP; bảng / cột chưa có (kho trống) → bỏ qua; in một dòng
`🔧 Nâng cấp 012: <bảng>.<cột> đổi n dòng (…); để nguyên m dòng không chắc` cho MỖI cột.

**Cách nhận biết — chỉ ba loại chắc chắn, còn lại để nguyên:**
1. **Đuôi `Z`** (`YYYY-MM-DDTHH:MM:SS(.sss)Z`, do `toISOString()`): chắc chắn UTC ở BẤT KỲ cột nào → `strftime('%Y-%m-%dT%H:%M:%S', cot, '+7 hours')`
   (SQLite hiểu hậu tố `Z`). Áp mọi cột giờ trong danh sách dưới.
2. **Dấu cách ở cột mà MỌI nơi ghi (code hiện tại + toàn bộ lịch sử git từ 03.01.2026) chỉ ghi UTC** → `+7 hours`, đổi sang `T`.
3. **Dấu cách ở cột mà MỌI nơi ghi chỉ ghi giờ VN** (`+7 hours`, `nowVn`, `orders.js:1064`) → chỉ thay dấu cách bằng `T`, KHÔNG cộng giờ.
- Cột **lẫn** (lịch sử có cả UTC dấu cách lẫn VN dấu cách) → **không đổi dòng dấu cách nào**, in số dòng để nguyên; ghi Phát hiện để chủ
  quán xem (đây là chỗ "không đoán").
- Mẫu khớp dùng `GLOB` chặt đủ 19 ký tự (`[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]:[0-9][0-9]:[0-9][0-9]`) — giá trị lạ / rỗng
  / chỉ ngày `YYYY-MM-DD` không khớp → không đụng.
- **Chạy lần hai không đổi gì**: sau lần 1 mọi giá trị đã đổi đều dạng `T` không đuôi → không khớp mẫu nào. (Thực tế `pos_nang_cap` chỉ
  cho chạy một lần; bài thử gọi thẳng `chay(tx)` lần hai để chứng minh 0 dòng.)

**Danh sách bảng / cột và loại** — BẢNG DƯỚI ĐIỀN TỪ RÀ LỊCH SỬ GIT (agent phụ, chỉ đọc), mỗi dòng có nơi ghi + commit:

Rà toàn bộ 1996 commit của `server/` và `pos-system/server/` (agent phụ chỉ đọc; mình kiểm lại tay: `getNow` chỉ đổi ở `9b3fa8e` 03.01 —
`toISOString()` đuôi Z — và `a9f177f` 07.01 03:26 UTC — giờ VN dạng `T`, tới nay; `damages.js:195` `datetime('now')`; khuôn P26b `17d403c`).
→ **`getNow` chưa bao giờ ra dấu cách**, nên dấu cách chỉ đến từ các nơi ghi kể dưới.

| Loại | bảng.cột | nơi ghi (code / commit) |
|---|---|---|
| 2 · UTC dấu cách → +7 | `pos_users.created_at` | DEFAULT `database.js:1040`; `users.js:57` getNow |
| 2 | `pos_permissions.created_at` | chỉ DEFAULT (`database.js:1094/1103/1108`, `users.js:215`) |
| 2 | `pos_customers.created_at`, `updated_at` | `customers-v2.js:58-65, 321, 328` CURRENT_TIMESTAMP / DEFAULT (`48d10ff`, `84cc683`, `71c2c00`→`486cc0a`); còn lại getNow |
| 2 | `pos_products.created_at`, `updated_at` | DEFAULT (`database.js:1139`, `kho/nhapSx.js:183`, `products.js:220, 320`); `datetime("now")` `products.js:167/174/215/314` |
| 2 | `pos_orders.created_at` | DEFAULT trong khoảng `36008e4` (06.01) → `8c239dc` (07.01); sau đó getNow |
| 2 | `pos_wallets.created_at`, `updated_at` · `pos_balance_transactions.created_at` | `damages.js` `datetime('now')` + DEFAULT (`13b1076` 07.02 → `17d403c` 03.10), DEFAULT `36008e4`→`ff25512`; còn lại getNow |
| 2 | `pos_damage_logs.created_at` | chỉ `damages.js:195` `datetime('now')` |
| 2 | `pos_stock_pending.resolved_at` | chỉ `doSoNo.js:80` `datetime('now')` |
| 2 | `pos_export_logs.created_at` · `pos_membership_tiers.created_at` · `pos_product_groups.created_at` · `pos_product_group_members.created_at` | chỉ DEFAULT |
| 3 · VN dấu cách → chỉ đổi `T` | `pos_products.ton_luc` | chỉ `products.js:51-52` (`58753d6`) |
| 3 | `pos_invoice_logs.printed_at`, `deleted_at` | chỉ `settings.js:315/423/455` `+7 hours` |
| 3 | `pos_membership_tiers.updated_at` | gieo `database.js:1330` `+7 hours`; `tiers.js` getNow |
| 3 | `pos_membership_purchases.expires_at` | chỉ `orders.js:1062-1064` (`e4b9bd4`) — giờ VN **khi máy chạy TZ UTC** (Render: có; xem Câu hỏi 2) |
| 3 | `pos_discount_codes.valid_to` | thường là ngày thuần (không khớp mẫu); riêng `a70b920`→`e72424c` (~2 giờ, 09.08) ghi VN dấu cách |
| **lẫn** → để nguyên dấu cách | `pos_settings.updated_at` | DEFAULT (UTC) + `+7 hours` (VN) + Z — chỉ đổi dòng đuôi Z; dòng dấu cách in số "để nguyên", ghi Phát hiện. Cột này không ai đọc để so (chỉ ghi chép). |
| 1 · chỉ đuôi Z | `pos_packages.created_at/updated_at`, `pos_customer_packages.created_at/updated_at`, `pos_settings.updated_at`, và MỌI cột getNow (Z trong 03.01–07.01: `pos_orders.*`, `pos_users.last_login`, …) | `packages.js:60-66, 118, 136, 194, 247`; `settings.js:160/205/251`; getNow cũ `9b3fa8e` |
| không đụng | cột chỉ getNow từ sau 07.01 (đơn, điểm, phiếu kho, phiên, mã…); ngày thuần (`due_date`, `valid_from`, `han_dung`, `pos_voucher_grants.expires_at`); giá trị từ ngoài (`sx_start_date/sx_end_date` từ CSV SX, `pos_payos_su_kien.luc` từ webhook) | — |

**Đường song song K4 — khôi phục sao lưu** (`server/utils/khoiPhuc.js:58-73` chép nguyên giá trị từ file Excel vào mọi bảng): khôi phục một
bản sao lưu CŨ (trước 012) sau khi 012 đã chạy sẽ đưa giờ UTC trở lại mà 012 không chạy lần nữa. Sửa: phần đổi của 012 viết thành hàm
`chuanHoaGio(tx, { saoLuu })` xuất ra; `thucHien` gọi nó cuối cùng giao dịch khôi phục (`saoLuu: false` — bản gốc chính là file vừa nạp).
Bản sao lưu MỚI (sau 012) toàn dạng `T` → hàm không đổi gì. Ca B6: khôi phục bản có giờ cũ → ra giờ VN.

**Tiền / sổ cái:** `pos_balance_transactions` là sổ chỉ-thêm (CLAUDE.md §5.4). Bước 012 chỉ đổi cột GIỜ `created_at` của các dòng ghi
UTC (không đổi số tiền, không thêm / xoá dòng), có bảng sao lưu. Xin chủ quán xác nhận ở Câu hỏi 1.

---

## C · Chỗ so chuỗi giờ — sửa gì, thử gì quanh 00:00 và 07:00 giờ VN

Bài thử dùng giờ GIẢ của máy chủ (thay `Date` toàn cục trong bài, cùng khuôn các bài cũ) ở bốn mốc: VN 23:59:59, 00:00:00 (= UTC 17:00 hôm
trước), 06:59:59, 07:00:00 (= UTC 00:00 — mốc đổi ngày UTC).
| Phép so | chỗ (file:dòng) | trạng thái | ca thử |
|---|---|---|---|
| Hạn điểm `expires_at > now` | `diemKhach.js:12`, `hoaDon.js:56`, `customers-v2.js:218` | hạn ghi `YYYY-MM-01T00:00:00` (`orders.js:60`, `signup-codes.js:226`) đúng dạng — đúng | C1: điểm hạn `2027-01-01T00:00:00`: 31.12 23:59:59 còn, 01.01 00:00:00 hết; 31.12 06:59:59 / 07:00:00 (mốc đổi ngày UTC) đều còn |
| Hạn mã giảm `valid_from/valid_to` vs `getToday()` | `orders.js:576-580`, `diemKhach.js:76` | ngày thuần, đúng | C2: mã `valid_to = hôm nay`: 23:59:59 dùng được; 00:00 hôm sau hết; 06:59 VN (UTC còn hôm qua) vẫn hết |
| Hạn mã bill (giờ) `issued_at` + hạn giờ | `signup-codes.js:175-176, 317-318`, `hoaDon.js:70` | cùng quy ước VN — đúng nếu `issued_at` VN (`orders.js:1182` ghi `now`) | C3: mã in lúc 07:00 hạn 24 giờ: hôm sau 06:59:59 dùng được, 07:00:00 hết |
| Hạn gói | `goiKhach.js:43-59` (mili-giây) | cùng quy ước — đúng; `packages.js` ghi `Z` → sửa A.2 #12 | C4: `updated_at` sau kết thúc gói dạng `T`; `ngay_chua_lay` quanh mốc: lần lấy cuối 23:59:59 / 06:59:59 → 1 giây sau vẫn 0 ngày, đủ 24 giờ → 1 ngày |
| Hạn thẻ hạng | `membershipStatus.js:17-19`, `customers-v2.js:237-239`, `kh/index.js:49-51` | so bằng mili-giây sau `.replace(' ','T')` — ĐÚNG trên Render (soát kế hoạch bắt: mình ghi nhầm là so chuỗi; `customers-v2.js:218` là câu đọc ĐIỂM). Lỗi thật chỉ là cách GHI phụ thuộc múi giờ máy (A.4 #26) | C5: thẻ mua 02.11 00:00:00 và 07:00:00 VN, hạn 3 tháng → `expires_at` = `2027-02-02T00:00:00` / `T07:00:00` dạng `T`, và đúng như vậy cả khi tiến trình chạy `TZ=Asia/Ho_Chi_Minh` (ca con chạy với biến TZ khác); 1 giây trước còn hạng, đúng mốc hết |
| Đối soát ngày | `doiSoat.js:221` (DEN) + mọi `DATE(created_at)` lọc ngày (`orders.js:89-130`, `reports.js:125`, `damages.js:41-46, 88-103`) | DEN bù +7 (A.6 #31); sự cố mới ghi UTC (A.1 #1) | C6: sự cố tạo lúc VN 00:30 ngày 07.01 (UTC 17:30 ngày 06.01) và lúc VN 06:59 / 07:00 → đối soát / thống kê sự cố ra ngày 07.01 VN cả ba |
| Thống kê "hôm nay" | `orders.js:132`, `damages.js:76-77`, `settings.js:270, 474` | **LỖI** (A.5) | C7: lúc VN 06:59 ngày 01.01.2027: đơn lúc 00:10 VN đếm vào hôm nay; số hoá đơn năm 2027 |
| Giờ vàng | `flashState.js:53` `getNow().slice(11,16)` | đúng | C8: khung 22:00–02:00 ở 00:00 VN đang chạy; khung 07:00–09:00: 06:59:59 chưa, 07:00:00 chạy (ca hồi quy) |
| Giờ hoạt động | `gioHoatDong.js` (getNow + phép thuần) | đúng | C9: khung 07:00–23:59: 06:59:59 đóng, 07:00:00 mở; khung 00:00–…: 23:59:59 hôm trước đóng, 00:00:00 mở |
| Phiên QR 10 phút | `giuCho.js:21, 52, 90, 101` | đúng (strftime trên getNow) | C10: phiên tạo 23:55 VN hết 00:05 VN; tạo 06:55 hết 07:05; `het_han` dạng `T` |
| Cảnh báo khách tồn | `sync.js:65, 79` | **LỖI** nhẹ (A.5 #28) | C11: khách tạo 25 giờ trước theo giờ VN → có cảnh báo; 23 giờ → không |

C8–C10 là ca HỒI QUY (đúng sẵn, xanh trên gốc) — đi cùng bài, không tính là ca đỏ.

---

## D · Chặn tái phạm — `cong_cu/thu_GIOVN1.js` phần QUÉT
Quét mọi `server/**/*.js` (trừ `node_modules`), bỏ chú thích (`//`, `/* */`, dòng `*`), ĐỎ khi gặp:
1. `CURRENT_TIMESTAMP` ngoài dòng định nghĩa cột `DEFAULT CURRENT_TIMESTAMP`;
2. KHÔNG phân biệt hoa thường: mọi `'now'` / `"now"` trong SQL (`datetime`, `date`, `strftime`, `julianday`…), `unixepoch(`, `'localtime'`, `'+7 hours'`;
3. `new Date().toISOString()`, `new Date(Date.now()`, `new Date().get…()` (đồng hồ máy chủ trần);
4. `.replace('T', ' ')` (dựng giờ dấu cách);
5. INSERT bỏ trống cột `DEFAULT CURRENT_TIMESTAMP` (cùng phép quét A.3) — bảng/cột DEFAULT đọc từ MỌI `CREATE TABLE` trong `server/**` (gồm `nang_cap/`, `kho/`), không riêng `database.js`.
Đăng ký bài: thêm `chayBaiThat('cong_cu/thu_GIOVN1.js')` vào `kiem_tra_truoc_khi_giao.js` (chỉ THÊM phép, cạnh dòng 495-501).
Ngoại lệ: danh sách `NGOAI_LE = [['file', 'mẫu', 'lý do'], …]` — đúng những chỗ ở "Không sửa" của A có khớp mẫu (hiện chỉ dự kiến:
`doiSoat.js` nhánh `'+7 hours'` cho dữ liệu cũ). Ngoại lệ không còn khớp → ĐỎ (khỏi để ngoại lệ chết).
Phá thử (K3): mỗi mẫu 1–5 một ca chuỗi giả phải ĐỎ + đúng tên mẫu; ca chú thích chứa mẫu → không đỏ; ca chuỗi `datetime('now'` GIỮA dòng.

## E · App KH
- Giờ ra `/api/kh`: `ngay_tao` (= `pos_customers.created_at`, `kh/index.js:33`), `ton_luc` (`products.js:51` dấu cách → A.1 #5),
  `hang.het_han` (`kh/index.js:51` đã `.replace(' ','T')` — sau vá thừa nhưng vô hại, giữ), `het_han` phiên / token, `ngay` đơn. Bài thử
  gọi các cửa có giờ trên kho thử có dữ liệu CŨ (gieo dạng UTC dấu cách + `Z`, chạy bước 012) rồi đi khắp JSON trả về: mọi chuỗi trông như
  giờ phải khớp `^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$`.
- `HOP_DONG_API_KH.md` dòng 22–23: bỏ câu "Lỗi đã biết…"; tăng `PHIEN_BAN` (đang 5 → số kế tiếp lúc commit — làn 2 HANG-1 cũng có thể
  tăng, chồng thì chat gộp); nhật ký cuối file một dòng. Không đổi trường nào. `cong_cu/thu_HOPDONG_KH.js` chỉ sửa nếu nó so số phiên bản
  cứng (đọc lúc làm).

## Ca thử ↔ Nghiệm thu (1-1)
| Nghiệm thu | Ca trong `cong_cu/thu_GIOVN1.js` | Đỏ trên gốc? |
|---|---|---|
| A | A1 quét D trên `server/` thật = 0 vi phạm (gốc: ~45) · A3 hàm ngày của màn quầy (`client/src/utils/`) chạy dưới `TZ=UTC` lúc VN 06:59 → ngày VN · A2 gọi route thật (tạo sự cố, đổi giá SX, đánh dấu tồn đọng xong, tạo gói, lưu cài đặt, in hoá đơn, xoá log in, khách từ SX, nhóm món, quyền) → giờ ghi dạng `T`, lệch `getNow` ≤ 2 giây | ĐỎ |
| B | B1 kho có dòng cũ ba loại + cột lẫn → đúng số dòng đổi mỗi bảng (đếm trong CSDL VÀ khớp dòng in `🔧 Nâng cấp 012: …`), đúng giá trị (+7 / chỉ đổi `T` / để nguyên) · B2 bảng `_sao_luu_012_<bảng>` có bản gốc · B3 chạy lần hai: 0 dòng đổi, dữ liệu bằng hệt · B4 dòng đã đúng giờ VN không đổi (K5) · B5 kho trống: không tạo bảng sao lưu · B6 khôi phục sao lưu có giờ cũ → giờ VN (đường `khoiPhuc.js`) | ĐỎ (chưa có bước 012) |
| C | C1–C11 ở bảng C | C5 (ca TZ khác), C6, C7, C11 ĐỎ; còn lại hồi quy |
| D | D1–D5 phá thử từng mẫu + ca chú thích + ca giữa dòng; D6 ngoại lệ chết → đỏ | ĐỎ (chưa có bài) |
| E | E1 đi khắp JSON `/api/kh` trên dữ liệu cũ đã nâng cấp · E2 hợp đồng không còn "Lỗi đã biết", `PHIEN_BAN` tăng, nhật ký có dòng | ĐỎ |
| K5 | `npm test` (mọi bài cũ, gồm `thu_DOISOAT1` DEN1/DEN2 dữ liệu cũ) xanh · B4 · đơn / điểm / ví / gói đã đúng giờ VN giữ nguyên tổng trước = sau bước 012 · K5b đối soát một ngày có dữ liệu dạng `T` (đơn, ví, điểm): kết quả JSON trước = sau bước 012 | — |
Đụng tiền? Không ghi tiền mới; bước 012 chỉ đổi cột giờ. "Hai người cùng bấm": bước 012 chạy trong một giao dịch có khoá `pos_nang_cap`
(chay.js) — hai máy cùng khởi động thì máy sau bỏ qua; ca đã có ở `thu_KHO1.js`, không viết lại.

**Đột biến** (`viec/GIO-VN-1/dot_bien.py`): VS-012-CONG-CA-LAN (cột lẫn cũng +7) · VS-012-VN-CONG7 (cột VN dấu cách cũng +7) · VS-DEN-BU-HAI-LAN
(bỏ CASE, luôn +7) · VS-THE-CACH (giữ `.replace('T',' ')`) · BV-012 (bước 012 rỗng) · BV-DAMAGES (trả `datetime('now')`) · BV-QUET-INSERT (gỡ
phép 5 của quét) · BV-HOM-NAY (trả `DATE('now','localtime')`) · BV-SYNC · BV-HOP-DONG (giữ câu "Lỗi đã biết").

## Luồng hợp lệ phải KHÔNG bị chặn / không đổi (K5)
- Đơn, điểm, ví, gói đã ghi bằng `getNow` (dạng `T`) — bước 012 không khớp mẫu → không đụng (B4).
- Ngày thuần `YYYY-MM-DD` (`valid_from`, `due_date`, `han_dung`…) — mẫu 19 ký tự không khớp.
- Bước 012 hỏng → `chay.js` rollback, quầy vẫn bán (đường cũ); `doiSoat` nhánh cũ vẫn đúng.
- Giá trị giờ do App / SX gửi (vd `sx_start_date`) — không thuộc loại 2/3 nếu lịch sử có nơi ghi từ ngoài → để nguyên.

## Ngân sách (ước)
A ~70 dòng sửa (≈45 chỗ × 1–2 dòng) · C ~10 · client ~12 + dist · B ~90 · D+E+C thử ~320. Hơi vượt phần thử (~300) vì ca C quanh hai
mốc × 11 phép.

## Vùng sửa (cho chat gộp với làn 2 HANG-1)
Rải 1 dòng ở: `database.js` (khối gieo dữ liệu 1036–1450), `routes/{damages,products,customers-v2,settings,packages,backup,sync,
registrations,users,product-groups,orders}.js`, `utils/{doSoNo,doiSoat,khoiPhuc}.js`, `kho/nhapSx.js`, `index.js`. `orders.js` chỉ dòng 132 và
1064 — HANG-1 (hạn thẻ cộng nối) gần như chắc đụng **`orders.js:1055-1072`** (khối mua thẻ) → chồng vùng, chat gộp.

## Câu hỏi cho chủ quán (cần xác nhận khi duyệt)
1. **Sổ ví** `pos_balance_transactions` (và `pos_wallets`): cho phép bước 012 đổi GIỜ (chỉ cột `created_at`, có sao lưu) của các dòng
   ghi theo giờ quốc tế? Số tiền không đổi. **Đề xuất: cho phép** — không đổi thì lịch sử ví hiện sớm 7 tiếng và đối soát theo ngày lệch.
2. **Hạn thẻ hạng** `pos_membership_purchases.expires_at` cũ: code cũ chỉ ra giờ VN khi máy chạy giờ UTC. Production (Render) chạy UTC → đúng;
   kho thử Replit có thể khác — không phải tiền thật. **Đề xuất:** coi dữ liệu cũ là giờ VN (chỉ đổi dấu cách → `T`); code mới (#26) hết phụ thuộc múi giờ.
3. `pos_settings.updated_at` dòng dấu cách không biết chắc → để nguyên (chỉ là giờ "lần sửa cuối" của cài đặt, không ai so). **Đề xuất: để nguyên.**

## Soát kế hoạch (agent độc lập, chỉ đọc) — đã sửa theo
- (1) không ra ngoài Phạm vi; thêm bước đăng ký bài ở `kiem_tra_truoc_khi_giao.js`.
- (2) #26 tính bằng phép UTC thuần thay vì chỉ bỏ `.replace` — không thêm dòng, hết phụ thuộc múi giờ máy.
- (3) C5 mình ghi nhầm "so chuỗi" (K1) → sửa mô tả, ca đỏ là ca múi giờ máy khác; thêm mốc 00:00 / 07:00 cho C1, C4, C6, C8, C9, C10; thêm K5b đối soát trước = sau; A3 ca hàm ngày màn quầy; B1 khớp dòng in.
- (4) phép quét D: không phân biệt hoa thường (`DATE('now'` ở `orders.js:132`), bắt mọi `'now'`, `unixepoch(`, đọc `CREATE TABLE` cả `nang_cap/`, `kho/`. Không có chỗ bù giờ hai lần ngoài `doiSoat.js:221`.
