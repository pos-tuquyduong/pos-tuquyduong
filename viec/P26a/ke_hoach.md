# P26a — Kế hoạch

Phiếu dặn **chờ duyệt kế hoạch**: commit + push file này rồi DỪNG. Chưa sửa code, chưa viết bài thử.

## 0. Sự thật đã đọc trong lượt này (K1)

| Chỗ | Đọc thấy |
|---|---|
| `server/database.js:1351-1354` | `run()` trả `{ lastInsertRowid: result.lastInsertRowid, changes }` — không đổi kiểu |
| `server/database.js:1377-1380` | `run()` trong `beginTransaction()` — y hệt, không đổi kiểu |
| thử thật `@libsql/client` `:memory:` | `lastInsertRowid` là `bigint` ở INSERT, ở **cả UPDATE** (giữ rowid cũ của kết nối), và trong `tx.execute` |
| `server/routes/refunds.js:139` | `refund_id: result.lastInsertRowid` → `res.json` → 500 sau khi đã ghi |
| `server/routes/discount-codes.js:220` | `id: result.lastInsertRowid` → 500 sau khi đã ghi |
| `server/routes/settings.js:278` | `data.id: result.lastInsertRowid` (`POST /invoice/log`, bảng `pos_invoice_logs`) → 500 sau khi đã ghi |
| `server/routes/packages.js:178` | `data.id: result.lastInsertRowid` (`POST /buy`, bảng `pos_customer_packages`) → 500 sau khi đã ghi |
| `cong_cu/thu_P20.js:180-181` | đoạn lách: `yc.id \|\| yc.refund_id \|\| … \|\| SELECT id FROM pos_refund_requests` |
| `kiem_tra_truoc_khi_giao.js:488` | `for (const bai of ['cong_cu/thu_P20.js', 'cong_cu/thu_P21.js']) chayBaiThat(bai);` (bản nhanh) |
| `kiem_tra_truoc_khi_giao.js:715` | `const NGUONG_KICH_BAN = 11;` |
| `cong_cu/thu_gia_lap.js:31` | `DONG_DAT = 'Giả lập: 11 kịch bản · 9 bất biến · ĐẠT'` |
| `cong_cu/gia_lap/kich_ban.js:104-105` | chú thích "POST /refunds … đang trả 500 (BigInt, refunds.js:139) — việc vá BigInt thêm KB12" |

### Rà K4 — mọi chỗ dùng `lastInsertRowid` (`grep -rn lastInsertRowid server`)

20 dòng (3 ở database.js, 17 ở routes). Ngoài 4 route trên, mọi chỗ còn lại hoặc đã bọc `Number()` (orders.js:868, 1022; rewards.js:49;
loyalty.js:175, 202), hoặc chỉ dùng làm tham số SQL (users.js:61, refunds.js:216, packages.js:47, customers.js:372→413,
customers.js:632, registrations.js:244). Đổi sang `Number` ở gốc không làm hỏng chỗ nào: `Number(Number(x))` = `x`;
tham số SQL nhận số như BigInt (`sanitizeArgs` database.js:1298-1305 không xử lý riêng BigInt). Không route nào gọi
`db.execute` trực tiếp ngoài `database.js` (grep `\.execute(` trong `server/` ngoài database.js: 0 chỗ) — hai hàm `run()`
là **hai cửa duy nhất** trả `lastInsertRowid`.

Đường giao dịch: không route nào hiện đưa `tx.run(...).lastInsertRowid` ra JSON (orders.js bọc Number; refunds.js:216 dùng
làm tham số SQL). Vá vẫn làm ở đó để việc sau không dính (phiếu, K4).

**Lệch phiếu:** phiếu A2 nhắc `tiers.js` là "route đã tự bọc `Number()`", nhưng `tiers.js` không trả id nào ra JSON
(`tiers.js:88` chỉ `{ success, message }`; dòng 7 chỉ là chú thích). Ca A2 cho tiers chỉ kiểm "`PUT /tiers` vẫn 200";
thay vào đó thêm `rewards.js` (`POST /rewards`, dòng 49, có bọc `Number`) làm ca đúng nghĩa A2.

## 1. Phần sửa code — `server/database.js`

| | Cách | File | Dòng | Rủi ro |
|---|---|---|---|---|
| **A (chọn)** | một hàm nhỏ `const soDong = (v) => (v == null ? v : Number(v));` đặt trên `run()`, dùng ở cả hai `run()` | 1 | +1, ~2 sửa | gần 0 |
| B | viết thẳng biểu thức ba ngôi ở cả hai chỗ | 1 | 0, 2 sửa (dòng dài) | lặp luật ở 2 chỗ — sau sửa một quên một (K4) |

Chọn A: thêm đúng 1 dòng so với B nhưng luật "đổi kiểu" chỉ nằm một chỗ. Giữ `null`/`undefined` như phiếu dặn.
Rủi ro mất chính xác khi rowid > 2^53: không thực tế với kho quầy — ghi CHƯA KIỂM.

## 2. Bài thử mới `cong_cu/thu_P26a.js` (~90 dòng)

| | Cách | Rủi ro |
|---|---|---|
| **A (chọn)** | dựng như `thu_P20.js:28-83`: thay `ketNoiKho` trỏ file kho tạm, `database.js` thật, express gắn các route cần thử, JWT chủ quán | nhanh (~vài giây), chạy được trong bản nhanh của bộ kiểm |
| B | dựa vào giả lập (`gia_lap/chay.js`, nạp `index.js`) | giả lập 22 s, chỉ chạy ở `--day-du` → không đạt A6 (bản nhanh) |

Ca thử (mỗi ca so HTTP status + kiểu + so với kho, không dò chữ — E12):

| Ca | Nghiệm thu | Làm gì | Đỏ trên gốc vì |
|---|---|---|---|
| C1 | A1 | nạp ví → `POST /orders` trả bằng ví → `POST /refunds` → 200, `typeof refund_id === 'number'`, bằng `id` của `pos_refund_requests` theo `order_id` | 500 BigInt |
| C2 | A1 | `POST /discount-codes` → 200, `id` số, bằng `id` tra theo `code` | 500 BigInt |
| C3 | A1 | `POST /settings/invoice/log` → 200, `data.id` số, bằng `id` của `pos_invoice_logs` theo `invoice_number` | 500 BigInt |
| C4 | A1 | `POST /packages/buy` → 200, `data.id` số, bằng `id` của `pos_customer_packages` theo `customer_phone` | 500 BigInt |
| C5 | A1 (giao dịch) | `db.beginTransaction()` → `tx.run(INSERT …)` → `typeof lastInsertRowid === 'number'`, commit, bằng id trong kho | `bigint` |
| C7 | A2 / K5 | `POST /rewards` (đã bọc Number) → 200, `id` số, bằng id trong kho | **xanh trên gốc** — ca "phải KHÔNG hỏng" |
| C8 | A2 / K5 | `POST /loyalty/redeem` (điểm nạp thẳng vào `pos_point_transactions`) → 200, `grant_id` số, bằng id trong `pos_voucher_grants` | **xanh trên gốc** — ca "phải KHÔNG hỏng" |
| C9 | A2 / K5 | `PUT /tiers` lưu lại hạng có sẵn → 200 | **xanh trên gốc** — ca "phải KHÔNG hỏng" |

Kết luận đỏ của bài: dòng tổng `n đạt · m hỏng` với m > 0 do C1–C5; ghi vào `bang_chung_do.txt` các dòng ✗ thật (K3 —
khớp câu kết luận, không chỉ mã thoát). Nếu dựng C8 cần quá nhiều dữ liệu nền (vượt ~15 dòng), ghi `## Câu hỏi`, không
tự bỏ ca.

## 3. `cong_cu/thu_P20.js` (A4, ~−1 dòng)

Thay 2 dòng 180-181 (lách) bằng: `k('POST /refunds → 200, refund_id là số', yc.status === 200 && typeof yc.refund_id === 'number', moTa(yc))`
rồi dòng 182 (approve) dùng thẳng `yc.refund_id`. Đỏ trên gốc: ca mới ✗ (HTTP 500), và `approve` gọi `/refunds/undefined/approve` → 404 ✗.

## 4. Giả lập KB12 (A3, ~25 dòng) — `cong_cu/gia_lap/kich_ban.js`, `cong_cu/thu_gia_lap.js`

- Thêm kịch bản thứ 12 vào **cuối** `KICH_BAN` (không đụng 11 kịch bản cũ): khách quen tạo đơn trả bằng ví →
  `POST /refunds` → `c.mong` 200 + `refund_id` là số → `POST /refunds/${r.refund_id}/approve` (KHÔNG tra kho) →
  `c.mong` 200 và ví = trước + số đã trả. I4 (bat_bien.js:48-58, loại `refund` có trong danh sách trắng) tự kiểm sổ ví.
- Sửa chú thích `kich_ban.js:104-105` cho khỏi nói "đang trả 500".
- `thu_gia_lap.js:31`: `DONG_DAT` → `'Giả lập: 12 kịch bản · 9 bất biến · ĐẠT'`.
- Đỏ trên gốc: giả lập in `KB12 → HTTP: … HTTP 500` và `KHÔNG ĐẠT`; `thu_gia_lap` ✗ ở E1 (dòng tổng sai).

## 5. Bộ kiểm `kiem_tra_truoc_khi_giao.js` (A3 + A6, ±2 dòng) — chỉ THÊM / SIẾT

- Dòng 488: thêm `'cong_cu/thu_P26a.js'` vào danh sách bài chạy thật (bản nhanh, cạnh thu_P20/thu_P21).
- Dòng 715: `NGUONG_KICH_BAN = 12` (bánh cóc chỉ tăng).
- Không đổi phép kiểm nào khác (K8, CLAUDE.md §6).

## 6. Đột biến (A5) — chạy tay, ghi lệnh vào `trang_thai.md`

Mỗi đột biến làm trên bản sao `server/` trong thư mục nháp (không sửa file trong kho). Để chạy được trên bản sao,
`thu_P26a.js` nhận cờ `--may-chu <thư mục server>` (mặc định `server/` của kho) — cùng tên, cùng cách với
`gia_lap/chay.js:58` (~2 dòng). Lệnh mẫu: `cp -r server $NHAP/sv && sed -i … $NHAP/sv/database.js && node cong_cu/thu_P26a.js --may-chu $NHAP/sv`.
- M-a: bỏ `soDong(` ở `run()` thường → `thu_P26a` đỏ ở C1–C4, C5 vẫn xanh.
- M-b: bỏ `soDong(` ở `run()` giao dịch → `thu_P26a` đỏ ở **đúng C5**, C1–C4 vẫn xanh (mỗi phép chặn đúng ca của nó).
- M-c: M-a trên bản sao `server/` → giả lập (`--may-chu <bản sao>`) đỏ ở `KB12 → HTTP … 500`.
Không thêm M-c vào `DOT_BIEN` của `thu_gia_lap.js`: khung E2 ở đó đòi "đúng **bất biến** phải lệch", còn KB12 hỏng ở
HTTP, không ở bất biến — ép vào là lách khung (K3). Ghi làm đột biến tay.

## 7. Luồng hợp lệ phải KHÔNG bị chặn / hỏng (K5)

1. Route đã bọc `Number()` (rewards, loyalty, orders) — C7, C8; orders qua C1 (tạo đơn) và `thu_P20`/giả lập KB1–11.
2. Route chỉ dùng id làm tham số SQL (users, customers, registrations, packages:47, refunds:216) — refunds:216 qua
   `approve` trong C1/KB12/thu_P20; còn lại không có bài thử riêng → ghi CHƯA KIỂM từng route (rủi ro thấp: số và BigInt
   cùng được libsql nhận làm tham số).
3. `run()` cho UPDATE/DELETE — giả lập KB1–11 đầy UPDATE (không thêm ca riêng — soát kế hoạch: trùng).
4. `lastInsertRowid` null/undefined — libsql thật luôn trả bigint (đã thử) → nhánh giữ null không dựng được ca thật → CHƯA KIỂM.

## 8. Ca hai người cùng bấm (đụng tiền)

Việc này không đổi logic tiền; chỉ đổi kiểu số trả ra. `POST /refunds` hai lần cho cùng đơn đã có chặn ở
`refunds.js:113-119` (yêu cầu pending trùng → 400), nhưng là kiểm NGOÀI giao dịch — hai lệnh chồng nhau có thể tạo hai
yêu cầu. Đây là lỗi **ngoài phạm vi** (sửa ở `routes/`, bị cấm) → ghi `## Phát hiện`, không thêm ca chồng nhau cho route
này. Lưu ý: chính lỗi 500 hôm nay làm nhân viên dễ bấm lại → vá P26a giảm nguy cơ tạo trùng (mục tiêu phiếu).

## 8b. Phát hiện ngoài phạm vi sẽ ghi

- `cong_cu/gia_lap/bat_bien.js:21` (ngoài phạm vi): chú thích hẹn "KB12 POST /refunds … sẽ phủ" nhánh `refunded` của I1 —
  SAI DỰ ĐOÁN (soát vòng 2): I1 chỉ xét đơn có mã bill đã dùng (bat_bien.js:28), KB12 không dùng mã → không phủ. Xem trang_thai.md.
- `refunds.js:113-119` kiểm yêu cầu trùng ngoài giao dịch (mục 8).

## 9. Ngân sách

| File | Phiếu | Ước |
|---|---|---|
| server/database.js | ~4 | 3 |
| cong_cu/thu_P26a.js | ~90 | 90–110 (C8 cần dữ liệu nền điểm + quà) |
| kich_ban.js KB12 | ~25 | 15–20 |
| thu_P20.js | −3 | −1 |
| thu_gia_lap.js | ±2 | 1 |
| kiem_tra_truoc_khi_giao.js | ±4 | 2 |

## 10. Thứ tự làm (sau khi duyệt)

1. Viết `thu_P26a.js`, sửa `thu_P20.js`, thêm KB12 + `DONG_DAT` + bộ kiểm → chạy trên gốc, lưu đỏ vào `bang_chung_do.txt`.
2. Sửa `database.js`. 3. `npm test`, `--day-du`, `thu_P20`, `thu_P21`, `thu_gia_lap` xanh. 4. Đột biến M-a/b/c.
5. Commit từng file, `/ra-soat`, push, báo cáo 7 mục + Bài học.

## 11. Soát kế hoạch (agent phụ chỉ đọc, 02.10.2026) — ĐẠT

1. Ngoài phạm vi / Cấm: không.
2. Ngắn hơn: bỏ C6 (trùng C1–C4) và C10 (giả lập đã phủ) — **đã bỏ**. Phương án B ở database.js ít hơn 1 dòng, giữ A (lý do §1).
3. Phủ A1–A7: đủ. Lệch đã sửa: đột biến chưa chạy lại được trên bản sao → thêm cờ `--may-chu` (§6);
   đoạn lách ở `thu_P20.js:180-181`, không phải 181-182 (§3).
4. Đường song song: không sót (`lastInsertRowid` chỉ phát ra ở database.js:1352, 1379; không route nào gọi `getDb()`).
   Lệch đã sửa: grep ra 20 dòng, không phải 18. Thêm phát hiện `bat_bien.js:21` (§8b).
