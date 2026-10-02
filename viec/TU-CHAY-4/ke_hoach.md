# TU-CHAY-4 — Kế hoạch (bước 3, ĐÃ DUYỆT 02.10.2026)

> **Đã đổi SAU khi duyệt** (đọc mục này trước — phần dưới giữ nguyên văn bản đã duyệt, chỗ lệch đánh dấu ⟶):
> - KB6: đường `POST /refunds` → **báo hỏng → hoàn ví** (`POST /damages`), chủ quán chốt (c) ở Câu hỏi 4. Không kịch bản nào
>   còn gọi `/refunds/:id/approve` → nhánh `refunded` của I1 chưa có kịch bản chạy qua (KB12 của việc vá BigInt).
> - Thêm đột biến **M10** (damages ghi loại dòng ngoài danh sách trắng → KB6 → I4). Tổng 10 đột biến.
> - E3 thật: **10 ca từ chối + 2 cấu hình hỏng + 3 ca cho qua** (không phải 9 + 1 + 4).
> - F1 đã đo: giả lập 22 s, `thu_gia_lap` 24 s → **chỉ `--day-du`** (chủ quán chốt).
> - Cổng KHÔNG đọc `lenh_gia_lap` (`tu_chay/cong.js:234`) — giả lập vào cổng chỉ qua `--day-du`.
> - Đường ghi ví: 13 chỗ; 11 kịch bản phủ 5 (bán :887, huỷ :1383, damages :168, nạp :79, đối soát :256), CHƯA phủ 8 —
>   xem CHƯA KIỂM trong `trang_thai.md`. Câu "phủ duyệt hoàn" ở §8 là SAI sau quyết định (c).


Nền: `9d7a4b4 PHIEU: TU-CHAY-4` trên `d047037` (main). Mọi file:dòng dưới đây đọc trong lượt này (02.10.2026).
Chưa viết code, chưa viết bài thử — phiếu dặn dừng ở bước 3.

## 0. Sự thật từ code — ảnh hưởng thiết kế

| # | Sự thật | file:dòng |
|---|---|---|
| S1 | `server/index.js` không `module.exports`, tự gọi `require('dotenv').config()` (:10), tự `initDatabase` + `app.listen(PORT)` (:174–198). Thứ tự mount có ý nghĩa: `don-mo-rong` trước `orders` (:86–87), móc `doNeuDenLuc` trước mọi `/api/pos` (:76–79). | index.js |
| S2 | `initDatabase()` không nhận tham số (bỏ qua `DB_PATH`), nối qua `ketNoiKho.cauHinhTurso()` rồi `createClient` của `@libsql/client`. | database.js:15–27 |
| S3 | `sxApi` đọc `diaChiSX()` **lúc nạp module** và `SX_API_KEY` từ biến môi trường. | sxApi.js:9–10 |
| S4 | Vân tay kho: bán `POS:<id>:out:<stt>` (bán: stt = vị trí món trong mảng `orderItems`; huỷ: thứ tự SELECT không ORDER BY = rowid — hai cách trùng nhau vì món INSERT đúng thứ tự mảng, :872–881, :1502–1508), huỷ `POS:<id>:in:<stt>`; lỗi SX → ghi `pos_stock_pending`. | orders.js:989–1004, :1513–1528 (DELETE :1690) |
| S5 | pay-debt chặn thu hai lần bằng `WHERE id = ? AND debt_amount = ? AND payment_status != 'paid' AND status != 'cancelled'` + `changes !== 1` → 409 `DA_THU_ROI`; ghi nhật ký `thu` (:1296) và dòng sổ `debt_payment` số dương, balance 0/0, chỉ khi đơn có SĐT (:1303–1320). | orders.js:1285–1294 |
| S6 | Đổi cách trả ghi nhật ký `doi`, chống đổi hai lần bằng so số tiền. | don-mo-rong.js:142–157 |
| S7 | Danh sách trắng ví `LOAI_TINH_VAO_VI = ['topup','purchase','refund','adjust','compensation']` — **không export**. Đối soát 1 khách / toàn bộ chỉ cộng loại trong danh sách. | wallets.js:240–262, :284–297 |
| S8 | Mã bill dùng được khi đơn `status='completed' AND payment_status='paid'` (danh sách trắng). Chiếm mã: `AND claimed_at IS NULL` (claim), `AND diem_nhan_luc IS NULL` (nhận điểm), cả hai trong giao dịch, phép kiểm đơn nằm NGOÀI giao dịch. | signup-codes.js:45, :58, :385, :246–249 |
| S9 | Điểm KHÔNG có số dư lưu rời — chỉ `SUM(points)` dòng còn hạn. Bán có SĐT, total > 0, không flash → 1 dòng `earn` = floor(total / loyalty_earn_per_amount), **kể cả đơn chưa thu** (P22 chưa làm). Nhận điểm mã bill → thêm 1 dòng `earn` bù để tổng = gốc × hệ số. Huỷ đơn không trừ điểm (P24 chưa làm). | database.js:342–356; orders.js:774–797, :955–962; signup-codes.js:197–214 |
| S10 | Trạng thái tiền chỉ do máy chủ tính: `debt_amount > 0` → `partial` (có ví) / `pending`; ngược lại `paid`. Tổng thanh toán phải khớp `total` ±1đ. | orders.js:727–752 |
| S11 | Yêu cầu hoàn tiền CHỈ nhận đơn trả bằng ví (`balance_amount > 0`, :107) và chưa huỷ/hoàn (:103). Duyệt: cộng ví + dòng `refund` + `status='refunded'`, `payment_status` giữ `paid`. | refunds.js:103–107, :174–219 |
| S12 | Nhật ký đơn chỉ ghi việc chưa có chỗ lưu (thu sau, đổi cách trả); giờ huỷ nằm trong `pos_orders`. | nhatKyDon.js:1–10 |
| S13 | 6 câu SQL "27.09" **không có trong kho** (grep 27.09 ngoài attached_assets/client: chỉ THIET_KE.md và sổ việc). Câu SQL I1–I5 viết lại từ schema thật ở mục 3. | — |

## 1. Sân khấu (B1–B4) — phương án

**B1 · máy chủ thật**
- **A (chọn):** nạp NGUYÊN `server/index.js` trong cùng tiến trình, sau khi đặt sẵn vào `require.cache`: `ketNoiKho`
  thay thế (kho = file tạm, `diaChiSX` = SX giả — đúng cách `thu_P20.js:29–40`), `dotenv` thay bằng hàm rỗng (để
  `.env` của máy không bao giờ được nạp — S1). `PORT` = cổng trống lấy từ `listen(0)`. Chờ `/api/pos/health` trả 200
  (index.js chỉ listen SAU `initDatabase`, nên health trả lời = kho sẵn sàng). Móc trước giao dịch (KB11): nạp
  `database.js` TRƯỚC, thay `db.beginTransaction` bằng bản có móc, rồi mới nạp `index.js` — các route lấy
  `beginTransaction` bằng destructuring lúc nạp (orders.js:13), như `thu_P20.js:63–75`. ~25 dòng.
  Được: đúng 100% route, middleware, thứ tự mount như production — kể cả móc `doNeuDenLuc`.
- **B:** tự mount danh sách route như `thu_P20.js:73–78`. ~20 dòng. Loại vì chép lại thứ tự mount — đúng khuôn K3
  "bài thử tự gắn middleware vào đúng chỗ" (S1: don-mo-rong phải đứng trước orders).
- Rủi ro A: cổng lấy rồi đóng có thể bị tiến trình khác chiếm (hiếm; health không lên trong 10 s → giả lập báo sập,
  thoát ≠ 0, không bao giờ báo ĐẠT). `app.listen(PORT)` nghe mọi giao diện mạng trong lúc chạy vài giây.

**B2 · SX giả:** một express nhỏ, cổng ngẫu nhiên, 3 đường: `GET /api/finished-products/check-stock` → `{sufficient:true,
stock:999}` (số giả CHỈ trong SX giả, không vào POS); `POST /api/pos/stock/out|in` → ghi `{chieu, van_tay, ma_don,
so_luong}` vào mảng, trả `{success:true}`, gặp lại vân tay thì trả `da_lam_roi:true` như SX thật (sxApi.js:174–178) nhưng
VẪN đếm. ~20 dòng.

**B3 · trễ mạng:** thay `@libsql/client` trong `require.cache` bằng bản bọc: `createClient` trả client có `execute`,
`transaction()` và `tx.execute/commit/rollback` chờ 40 ms trước khi gọi bản thật. Bật SAU `initDatabase` (≈300 lệnh tạo
bảng × 40 ms = 12 s vô ích). ~15 dòng. (Bản đầu có AsyncLocalStorage làm bằng chứng chồng nhau — soát kế hoạch chỉ ra mã trả về đã là bằng
chứng, xem mục 2; bỏ đi, bớt ~15 dòng và khỏi phải vá `express` để chèn middleware đứng đầu `index.js`.)

**B4 · dữ liệu mẫu cố định** (qua route thật khi có, SQL thẳng chỉ cho cấu hình/danh mục — như `thu_P20.js:91–102`):
cấu hình mã bill + điểm y `thu_P20.js:93–99`; 5 món đầu của seed (database.js:981–996) đặt giá 25.000 / 20.000 /
30.000 / 15.000 / 35.000 đ; 1 gói `GOI_GL` 300.000 đ / 10 ly; 1 nhân viên thứ hai (`role='staff'`) để kịch bản 10, 11 là
HAI người thật; khách quen: `pos_customers` + **nạp 200.000 đ qua `POST /wallets/topup`** (sổ và ví khớp từ đầu);
khách nợ: `pos_customers` + **đơn ghi nợ 50.000 đ qua `POST /orders`** (đặt cấu hình điểm TRƯỚC đơn này, nếu không
I8 lệch oan); khách mới: chỉ có SĐT; khách quen thêm 1 gói có sẵn (`pos_customer_packages`, như `thu_P20.js:296–299`)
cho KB9b. Dựng xong thì **tự khẳng định**: ví khách quen = 200.000, nợ khách nợ = 50.000, đủ 5 món giá đúng — sai thì
sập (thoát 2), không chạy kịch bản. ~40 dòng.

**A1/A2 · an toàn** (~30 dòng, chạy TRƯỚC mọi `require` của server):
- Từ chối (thoát 3, in tên biến, KHÔNG in giá trị) khi có biến tên khớp `^TURSO_`, `DATABASE_URL`, `SX_API_URL`,
  `SX_API_URL_THU`, `SX_API_KEY`, `JWT_SECRET`, `POS_SERVICE_API_KEY`, hoặc biến bất kỳ có giá trị chứa một chuỗi trong
  `ten_mien_production` (đọc từ `tu_chay/cau_hinh.json`; đọc hỏng → từ chối). **Xem Câu hỏi 1 — chỗ này đụng Replit.**
- Khoá thử (JWT, khoá dịch vụ, khoá SX — đều giả) chỉ được đặt SAU phép kiểm A1, như `thu_P20.js:40–41`.
- Kho: `fs.mkdtempSync(os.tmpdir()/gia_lap_)`, xoá trong `finally` + `process.on('exit')`. Không đọc `.env`, không chạm `data/`.

**Bố cục file — phương án**
- **A (chọn):** `cong_cu/gia_lap/chay.js` (an toàn + sân khấu + in kết quả, ~190) · `kich_ban.js` (~200) ·
  `bat_bien.js` (~80). Tổng ~470.
- **B:** một file `chay.js` ~460. Ít hơn ~10 dòng (bớt `require`/`module.exports`).
- Chọn A dù nhiều hơn ~10 dòng: F3 bắt việc sau ghi ĐÚNG TÊN file trong phiếu — việc P22/P24 thêm kịch bản/sửa I8 chỉ
  mở `kich_ban.js`/`bat_bien.js`, không mở được phần an toàn A1 nằm trong `chay.js`. Khoá theo file chỉ có nghĩa khi
  phần an toàn tách khỏi phần hay sửa.

## 2. Mười một kịch bản (C) — gọi API như nhân viên (~200 dòng)

Mỗi kịch bản: chuỗi lệnh HTTP + mong đợi status/`code` (không dò chữ — E12) → sau đó chạy 9 bất biến. Giả lập tự ghi
**sổ phía quầy**: mỗi lệnh thu nợ / đổi cách trả trả 200 (dùng cho I9).

| # | Thao tác | Mong đợi |
|---|---|---|
| 1 | Khách lẻ: món 25.000 + món 20.000, tiền mặt 45.000, khách đưa 50.000, thối 5.000 | 200, `paid` |
| 2 | Chuyển khoản 30.000 → đổi sang tiền mặt có lý do (`/doi-cach-tra`) | 200, 200 |
| 3 | "Chưa thu · in bill" (`cho_thu`, debt = total) → thu tiền mặt qua pay-debt | `pending` → 200 → `paid` |
| 4 | Khách nợ trả nợ cũ 2 lần: 20.000 (`partial`) rồi 30.000 (`paid`); khách quen trả 10.000 bằng ví + ghi nợ 30.000 (tạo ra `partial`, orders.js:731) rồi trả đủ (CK) | 200 × 4 |
| 5 | (a) Khách quen trả ví 25.000 → huỷ đơn; (b) đơn tiền mặt → khách mới `/claim` mã bill → huỷ đơn SAU khi đã dùng mã (luồng hợp lệ của I1) | ví hoàn lại, SX nhận vân tay `in`; (b) 200, 200 |
| 6 | Khách quen trả **bằng ví** 20.000 → yêu cầu hoàn → duyệt (refunds.js:107 chỉ nhận đơn trả ví) | `refunded`, ví +20.000 |
| 7 | Khách mới dùng mã bill: bill kịch bản 1 (đã thu) → `/claim` 200; bill `cho_thu` mới → `/claim` và `/nhan-diem` đều 400 `BILL_CHUA_THANH_TOAN` (hai đường cùng `kiemDonCuaMa`) | đúng 3 kết quả |
| 8 | Khách quen nạp 100.000 → mua 45.000 bằng ví → chủ quán bấm đối soát ví khách đó (`POST /wallets/:phone/reconcile`) | số dư trước = sau đối soát |
| 9 | (a) Khách quen mua gói `GOI_GL` + lấy 1 ly ngay từ gói (`package_buy`, luồng K5 đã từng gãy); (b) lấy 1 ly 0đ từ gói CÓ SẴN (`customer_package_id`, orders.js:192–227) | 200, 200; `delivered_qty` đúng |
| 10 | Bill `cho_thu` 25.000 → hai nhân viên cùng pay-debt (`Promise.all`, trễ 40 ms) | đúng một 200 + một 409 `DA_THU_ROI` |
| 11 | Mã bill đã thu → (a) hai SĐT cùng `/claim`, (b) hai SĐT cùng `/nhan-diem`, chồng nhau bằng móc trước giao dịch như `thu_P20.js:63–75` | (a) 200 + 409 `MA_DA_DUNG`; (b) 200 + 400 `MA_DA_NHAN_DIEM` |

**Bằng chứng chồng nhau** (không có thì kịch bản đó KHÔNG ĐẠT, dù tiền không lệch) — chính mã trả về:
- KB10: chạy tuần tự thì người sau đọc thấy `paid` → **400 không có `code`** (orders.js:1245–1249); chỉ khi cả hai đã qua
  phép đọc ngoài giao dịch thì người sau mới ra **409 `DA_THU_ROI`** (:1290–1294). Đòi đúng 409 `DA_THU_ROI`. Thêm tự kiểm:
  trung vị thời gian một lệnh kho ≥ 35 ms (trễ đang bật).
- KB11a: tuần tự → 400 không `code` (signup-codes.js:316–318); chồng nhau → 409 `MA_DA_DUNG` (:386–389). Đòi 409.
- KB11b: hai đường đều ra `MA_DA_NHAN_DIEM` (:139–145, :250–256) → đòi thêm cờ "móc đã chạy và người chen vào 200" như
  `thu_P20.js:239–245`.

**Lệch HTTP không làm dừng kịch bản**: mỗi mong đợi sai in riêng `KB<n> → HTTP: <mong đợi> ≠ <nhận>`, kịch bản chạy tiếp
phần còn lại nếu được, rồi 9 bất biến vẫn chạy — để đột biến M1, M2, M5 (làm lệch cả HTTP) vẫn in được `KB<n> → I<k>`.
Lệch HTTP cũng làm KHÔNG ĐẠT.

Thứ tự 4 → 8 có chủ ý: khách quen có dòng `debt_payment` trước lần đối soát ở KB8 (để đột biến danh sách trắng lộ ra).

## 3. Chín bất biến (D) — SQL chỉ đọc, mỗi cái một hàm `I1…I9` (~80 dòng)

Mỗi hàm trả mảng dòng lệch `{mo_ta, tien?}`; 0 phần tử = đạt. Chạy sau MỖI kịch bản và ở cuối.

- **I1** mã đã dùng (`claimed_at` hoặc `diem_nhan_luc` khác NULL) ⇒ đơn gốc `payment_status='paid'` VÀ (`status='completed'`
  HOẶC huỷ/hoàn SAU lúc dùng mã: `cancelled_at` >= lúc dùng / `pos_refund_requests.processed_at` >= lúc dùng — `>=`
  vì cả hai là `getNow()` theo giây, helpers.js:134). Nguồn: S8; ngoại lệ chạy thật ở KB5b (K5).
- **I2** mã bill mồ côi: `order_id IS NULL` hoặc không có đơn `pos_orders.id` tương ứng. Kho tạm mới nên mọi mã đều "mới".
- **I3** đơn lạ: `payment_status NOT IN ('paid','partial','pending')`; `status NOT IN ('completed','cancelled','refunded')`;
  `paid` mà `debt_amount <> 0`; `partial/pending` mà `debt_amount <= 0`. Nguồn: S10, S11.
- **I4** mỗi SĐT: `pos_wallets.balance` = `SUM(amount)` các dòng loại thuộc `LOAI_TINH_VAO_VI` (bản CHÉP trong
  `bat_bien.js`, so khớp với wallets.js ở bộ kiểm — xem F); SĐT có dòng trắng mà không có ví → lệch nếu tổng ≠ 0. In số tiền lệch.
- **I5** `type NOT IN (LOAI_TINH_VAO_VI ∪ {'debt_payment'})`. `debt_payment` là loại đã biết, không tính vào ví (S5, S7).
- **I6** mỗi đơn: `|cash + transfer + balance + parent_balance + debt − total| ≤ 1`. Thu hai lần làm vế trái vượt đúng
  số tiền thu thừa — in số đó.
- **I7** mỗi món có `sx_product_type` của mỗi đơn có đúng **1** lần SX giả nhận vân tay `out` (stt = thứ hạng `id` trong
  đơn, khớp S4); đơn `cancelled` thêm đúng 1 lần `in`; không có vân tay nào nhận > 1 lần; không có dòng `pos_stock_pending`
  (SX giả không bao giờ lỗi → có dòng nợ là lệch).
- **I8** điểm mỗi đơn = `SUM(points WHERE order_id)` phải bằng, với g = `floor(total/per)`, k = hệ số: mã bill đã nhận
  điểm → `g + round(g×(k−1))` nếu đơn có dòng điểm lúc bán, `round(g×k)` nếu không (chép đúng `Math.round` của
  signup-codes.js:212–214); chưa nhận và đơn có SĐT, total > 0, không flash → g; còn lại → 0. Nguồn S9. **Xem Câu hỏi 2.**
- **I9** mỗi đơn: số dòng nhật ký `thu` và `SUM(chi_tiet.so_tien)` = sổ phía quầy (lệnh thu trả 200); số dòng `doi` = số
  lệnh đổi trả 200; đơn có SĐT: số dòng `debt_payment` = số dòng `thu`. Nguồn S5, S6, S12.

Kết quả: một dòng `Giả lập: 11 kịch bản · 9 bất biến · ĐẠT` (đếm từ độ dài danh sách thật, không viết số cứng), thoát 0.
Không đạt: mỗi lệch một dòng `KB<n> → I<k>: <mô tả>, lệch <tiền>đ / <n> dòng`, rồi dòng tổng `· KHÔNG ĐẠT`, thoát 1.
Sập/an toàn: thoát 2/3. Gặp lệch trên code THẬT → làm đúng mục G phiếu (dừng, ghi Câu hỏi, không sửa server).

## 4. Phá thử `cong_cu/thu_gia_lap.js` (E) — ~200 dòng

Giả lập nhận `--may-chu <thư mục server>` (mặc định `server/`). Mỗi lần chạy là một tiến trình con mới (module sạch).

- **E1** giả lập trên code thật → thoát 0 và dòng cuối khớp ĐÚNG `Giả lập: 11 kịch bản · 9 bất biến · ĐẠT`.
- **E2** chép `server/` vào thư mục tạm (+ symlink `node_modules`), thay chuỗi; mỗi chuỗi PHẢI khớp đúng số lần dự kiến,
  không khớp → ✗ "đột biến không áp được" (không bao giờ đếm là đạt). Mong đợi: thoát 1 và có dòng `KB<n> → I<k>`:

  | Đột biến (bỏ một chặn có thật) | file:dòng | Lộ ở |
  |---|---|---|
  | M1 bỏ `AND debt_amount = ? AND payment_status != 'paid' AND status != 'cancelled'` (giữ số tham số) | orders.js:1287 | KB10 → **I6** |
  | M2 bỏ `&& don.payment_status === TRANG_THAI_DUNG_MA.payment_status` | signup-codes.js:58 | KB7 → **I1** |
  | M3 thêm `'debt_payment'` vào `LOAI_TINH_VAO_VI` (đúng lỗi P21) | wallets.js:240 | KB8 → **I4** |
  | M4 vân tay chiều huỷ trùng chiều bán: `:in:${sttMon}` → `:out:${sttMon}` (2 chỗ) | orders.js:1513, :1690 | KB5 → **I7** |
  | M5 bỏ `AND diem_nhan_luc IS NULL` | signup-codes.js:248 | KB11b → **I8** |
  | M6 bỏ lệnh `ghiNhatKy(... "thu" ...)` của pay-debt | orders.js:1296–1299 | KB3 → **I9** |
  | M7 bỏ lệnh `ghiNhatKy(id, 'doi', ...)` | don-mo-rong.js:156–157 | KB2 → **I9** |
  | M8 đảo `remainingDebt <= 0 ? "paid" : "partial"` | orders.js:1275 | KB3 → **I3** |
  | M9 `'debt_payment'` → `'tra_no'` | orders.js:1309 | KB4 → **I5** |

  Không có đột biến tự nhiên: **I2** — máy chủ không có chặn nào giữ mã gắn đơn; mồ côi chỉ sinh khi xoá đơn (DELETE
  không thuộc 11 kịch bản). Ghi CHƯA KIỂM bằng đột biến; câu SQL I2 chỉ được thử bằng ca dữ liệu tay trong
  `thu_gia_lap` (chèn 1 mã `order_id` NULL vào kho tạm → hàm I2 trả đúng 1 dòng).

  **Thời gian (F1, H):** `chayBaiThat` cắt ở 120 s (kiem_tra_truoc_khi_giao.js:479). Ước lượng chưa đo: 1 lần giả lập
  20–60 s. Đột biến chạy SONG SONG (tiến trình con riêng, kho tạm riêng, cổng riêng) và giả lập nhận `--den-kb <n>`
  để dừng ngay sau kịch bản cần lộ. Đo thật sau khi viết; vẫn > 120 s thì ghi Câu hỏi, không tự nới `chayBaiThat`.
- **E3** A1: tiến trình con với từng loại biến (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `DATABASE_URL`, `SX_API_URL`,
  `SX_API_KEY`, `JWT_SECRET`, `POS_SERVICE_API_KEY`, biến tên vô hại có giá trị chứa `turso.io`, chứa `pos-tuquyduong.io.vn`)
  → thoát 3 và câu kết luận nêu đúng tên biến (K3: khớp câu kết luận, không chỉ mã thoát); thêm ca `cau_hinh.json`
  hỏng (trỏ `--cau-hinh` vào file hỏng) → thoát 3. Ca **phải KHÔNG bị chặn** (K5): `PATH`, `HOME`, `NODE_ENV=development`,
  biến có chữ `turso` nhưng không có tên miền.
- **A2** (trong E1): danh sách + mtime `data/` trước/sau bằng nhau; thư mục `gia_lap_*` mới trong tmp đã bị xoá — cả ở
  một lần chạy cố ý sập (`--may-chu` trỏ thư mục rỗng → thoát 2).
- **E4** đột biến vào chính giả lập (chép `cong_cu/gia_lap/` ra tạm; `thu_gia_lap.js --gia-lap <thư mục>`):
  (a) `I7` trả `[]` → M4 không còn lộ → `thu_gia_lap` ĐỎ; (b) trễ = 0 → KB10 mất bằng chứng chồng nhau (hoặc tự kiểm
  trễ hỏng) → E1 ĐỎ. Chạy tay, ghi lệnh chạy lại + kết quả vào `trang_thai.md` (không nhúng vào `thu_gia_lap` để khỏi
  chạy đệ quy). Thêm (c): bỏ một hàm khỏi danh sách bất biến → dòng tổng thành "8 bất biến" → E1 ĐỎ.

## 5. Nối vào bộ kiểm (F)

- **F1** `kiem_tra_truoc_khi_giao.js`: thêm nhóm, gọi `chayBaiThat('cong_cu/gia_lap/chay.js')` và
  `chayBaiThat('cong_cu/thu_gia_lap.js')` (hàm có sẵn :477–485). Đo thật sau khi viết: giả lập ≤ 15 s → chạy cả bản nhanh;
  dài hơn → chỉ khi `--day-du`. `thu_gia_lap` ≈ (2 + 6 đột biến + E3 nhanh) lần chạy → gần như chắc > 15 s → chỉ `--day-du`.
  Số đo ghi vào `trang_thai.md` và sửa lại câu này.
- **F2** bánh cóc: đọc dòng tổng của giả lập, đỏ khi kịch bản < 11 hoặc bất biến < 9 (hằng `NGUONG_KICH_BAN = 11`,
  `NGUONG_BAT_BIEN = 9` — chỉ tăng). Thêm một phép tĩnh: danh sách `LOAI_TINH_VAO_VI` trong `bat_bien.js` = trong
  wallets.js (hai bản chép phải đi cùng nhau; lệch = đỏ, buộc việc sau sửa cả hai).
- **F3** `tu_chay/cau_hinh.json` `file_luat` += `cong_cu/gia_lap/**`, `cong_cu/thu_gia_lap.js`. `tu_chay/thu_nguoi_gac.js:595–597`:
  ca "file luật" đòi thêm hai mục này (đổi nhãn "7 file luật"); thêm 1 ca người gác: `Edit cong_cu/gia_lap/kich_ban.js`
  khi phạm vi chỉ ghi `cong_cu/gia_lap/**` → chặn `G-LUAT` (nguoi_gac.js:189 so `pv.includes(rel)` — đúng tên, không glob);
  và 1 ca phải cho qua: phạm vi ghi đúng `cong_cu/gia_lap/kich_ban.js`.
- **F4** `tu_chay/THIET_KE.md` B10: `chay.sh` → `cong_cu/gia_lap/chay.js`, nối qua bộ kiểm (`--day-du`, cổng `cong-chay`),
  `lenh_gia_lap` để trống; bỏ câu "dùng lại `tre_mang.cjs`"; giữ "việc sau thêm kịch bản mới, không xoá kịch bản cũ";
  bảng I1–I9 ghi nguồn là `bat_bien.js`. Sửa luôn các chỗ khác nhắc `lenh_gia_lap` (THIET_KE.md:204, :305, :335) cho khớp
(K4 tài liệu). `tu_chay/PHIEN_BAN` → `tu-chay 1.3.2`.

## 6. Ca thử ↔ Nghiệm thu (1-1)

| Nghiệm thu | Ca | Đỏ trên gốc? |
|---|---|---|
| A1 | E3: 9 ca từ chối + 1 cấu hình hỏng + 4 ca cho qua | đỏ (giả lập chưa có) |
| A2 | E1 kèm so `data/` + tmp đã dọn, cả khi sập | đỏ |
| A3 | `git diff --stat main -- server client` rỗng (bộ kiểm / tự rà trước commit) | — |
| B1–B4 | E1 ĐẠT (máy chủ thật, SX giả, trễ, dữ liệu mẫu) + tự kiểm trễ ≥ 35 ms | đỏ |
| C1–C11 | mỗi kịch bản có mong đợi HTTP; KB10/11 có bằng chứng chồng nhau | đỏ |
| D I1–I9 | E2 M1–M9 (8/9 bất biến có đột biến), I2 bằng ca dữ liệu tay | đỏ |
| E1–E4 | như mục 4 | đỏ |
| F1 | `npm test` / `--day-du` có dòng "bài chạy thật cong_cu/gia_lap/chay.js xanh (x s)" | — |
| F2 | đột biến tay: giả lập in "10 kịch bản" → bộ kiểm đỏ | ghi ở trang_thai |
| F3 | `thu_nguoi_gac.js` ca file_luat + 2 ca người gác | **đỏ trên gốc** (cau_hinh gốc thiếu 2 mục) |
| F4 | đọc lại tài liệu (không máy kiểm) | — |
| H | `npm test`, `--day-du`, `thu_nguoi_gac`/`thu_cong_cu`/`thu_cong` xanh | — |

Cổng của PR này chấm theo luật main 1.3.1: `thu_gia_lap.js` (mới) đỏ trên gốc vì `cong_cu/gia_lap/` chưa có — dòng
kết luận phải là ✗ E1 nêu rõ "không thấy giả lập", không phải sập im (K3 · thu_cong.js); `thu_nguoi_gac.js` (sửa) đỏ trên
gốc nhờ ca F3. File giả lập không mang tên `thu_*.js`.

## 7. Luồng hợp lệ phải KHÔNG bị chặn (K5)

Giả lập không thêm chặn nào vào máy chủ. "Chặn" mới duy nhất là A1 và bánh cóc F2:
- A1 không được chặn: chạy trong máy mây này, chạy trong GitHub Actions (`cong-chay` không truyền bí mật), `npm test` trên
  Replit — **ca cuối đụng Câu hỏi 1**.
- Bất biến không được báo lệch oan với luồng hợp lệ: huỷ đơn SAU khi đã đổi mã (I1 — KB5b), đơn 0đ lấy từ gói có sẵn và
  mua gói kèm ly 0đ (I6, I8 = 0 — KB9a/b), đơn ví + nợ `partial` lúc tạo (I3 — KB4), dòng `debt_payment` (I5 — KB4),
  khách chỉ có dòng nợ không có ví (I4 — khách nợ), đơn tiền mặt có tiền thối (I6 — KB1), đơn huỷ (I6, I7 — KB5).
  E1 ĐẠT là ca "không bị chặn" cho tất cả.

## 8. Đường song song (K4)

- Vân tay `in` có HAI chỗ (cancel :1513, DELETE :1690) — M4 sửa cả hai; DELETE không thuộc 11 kịch bản → ghi CHƯA KIỂM.
- Chiếm mã có HAI đường (claim, nhận điểm) — KB11 chạy cả hai; mã bill chưa thu cũng HAI đường — KB7 chạy cả hai.
- Lấy từ gói có HAI đường (`package_buy` cùng đơn, `customer_package_id` gói có sẵn) — KB9a, KB9b.
- Nhật ký đơn có HAI chỗ ghi (`thu`, `doi`) — M6, M7.
- Ghi ví có 5 đường (bán, huỷ, xoá, duyệt hoàn, nạp) + đối soát — 11 kịch bản phủ bán/huỷ/duyệt hoàn/nạp/đối soát; xoá
  đơn và `/wallets/deduct|adjust` → CHƯA KIỂM. ⟶ SAI sau (c): không phủ duyệt hoàn; thêm damages :168 (phủ) và ví mẹ (chưa).
- Danh sách trắng ví có 2 bản (wallets.js, bat_bien.js) → F2 phép tĩnh so khớp.

## 9. Ngân sách dự kiến

| Phần | Phiếu | Dự kiến |
|---|---|---|
| `cong_cu/gia_lap/` | ~450 | ~470 (3 file; bỏ ALS −15, thêm KB5b/7/9b + tự khẳng định B4 +15) |
| `thu_gia_lap.js` | ~200 | ~210 (9 đột biến chạy song song) |
| bộ kiểm | ±30 | ~25 |
| cấu hình | ±2 | 1 |
| `thu_nguoi_gac.js` | ±5 | ~8 (thêm 2 ca người gác — vượt 3 dòng, vẫn < 1,5×) |
| tài liệu | ~30 | ~25 |

## 10. Câu hỏi cần chủ quán chốt trước khi viết code

1. **A1 trên Replit.** Tab Secrets của Replit nhiều khả năng có `SX_API_URL`/`JWT_SECRET`/… (sxApi.js:5–7 nhắc "biến
   trong tab Secrets của Replit"). Nếu A1 từ chối khi thấy chúng và giả lập chạy trong bản nhanh, thì `npm test` (hook
   pre-commit) trên Replit đỏ vĩnh viễn. Máy mây này không xem được biến môi trường (người gác chặn `B-BIMAT-CHU`, đúng
   luật). Ba hướng:
   (a) A1 đúng chữ phiếu; giả lập CHỈ nằm ở `--day-du` (cổng GitHub) — Replit chạy `--day-du` cũng đỏ;
   (b) bộ kiểm gọi giả lập với **môi trường đã lọc sạch** (chỉ `PATH`, `HOME`, `TMPDIR`, `NODE_*`); giả lập vẫn tự từ
       chối khi chạy tay có khoá — giả lập không bao giờ cầm khoá thật, kể cả trên Replit; **(đề xuất)**
   (c) Replit bỏ qua giả lập (nhận ra bằng `REPL_ID`) — không đề xuất: thêm một nhánh "bỏ qua".
2. **I8 chép luật điểm HIỆN TẠI.** Bảng điểm không có số dư rời (database.js:342), nên "điểm khách = tổng dòng điểm" đúng
   theo định nghĩa — không bắt được gì. Kế hoạch đổi thành "điểm mỗi đơn = điểm gốc × (hệ số nếu đã nhận điểm)" — bắt
   cộng đôi (M5). Nhưng luật hiện tại cho đơn **chưa thu** và đơn **đã huỷ** vẫn giữ điểm (S9; P22, P24 còn mở). Đồng ý
   để I8 mô tả luật hiện tại, và P22/P24 bắt buộc sửa I8 (ghi `cong_cu/gia_lap/bat_bien.js` trong phiếu) — hay muốn I8
   loại đơn huỷ/chưa thu ngay bây giờ (khi đó I8 đỏ trên code thật → mục G, KB5/KB3 "chờ P22/P24")?
3. **KB8 dùng đối soát ví.** `POST /wallets/:phone/reconcile` chưa có nút trên màn hình (`grep reconcile client/src` = 0 dòng, 02.10.2026; P25 còn mở).
   Đưa nó vào KB8 để đột biến danh sách trắng (P21) có chỗ lộ ra. Đồng ý coi đây là "thao tác của chủ quán" trong giả lập?

## Soát kế hoạch (agent phụ, chỉ đọc) — CẦN SỬA → đã sửa vào bản này

Câu 1 (ngoài phạm vi): không. Câu 2 (ngắn hơn): có — bỏ AsyncLocalStorage, dùng mã 409 làm bằng chứng chồng nhau.
Câu 3–4 và K1: 11 việc. Đã tự đọc lại code từng điểm trước khi sửa (K1/K2):

| # | Soát nói | Đọc lại | Xử lý |
|---|---|---|---|
| 1 | KB6 tiền mặt không hoàn được | refunds.js:107 đúng — chỉ đơn trả ví | KB6 trả ví; S11 thêm điều kiện |
| 2 | lệch HTTP có thể chặn mất dòng `KB→I` | đúng, kế hoạch chưa nói | mục 2: lệch HTTP báo riêng, bất biến vẫn chạy |
| 3 | I3, I5, nhánh `doi` của I9 có đột biến tự nhiên | đúng | thêm M7, M8, M9; I3 là orders.js:**1275** (soát ghi :1281 — lệch) |
| 4 | M3 sai thứ tự toán tử, không phải lỗi P21 | đúng (`customer_phone = ? AND 1=1 OR …`) | M3 = thêm `'debt_payment'` vào danh sách |
| 5 | I1 `>` oan khi cùng giây; I8 làm tròn | đúng (getNow theo giây; Math.round) | `>=`; I8 chép `Math.round` |
| 6 | §7 khẳng định luồng không có trong kịch bản | đúng | thêm KB5b, KB9b, `partial` ở KB4, `/nhan-diem` ở KB7 |
| 7 | thời gian vs 120 s / 300 s | chưa đo được | đột biến song song + `--den-kb`; đo rồi mới chốt |
| 8 | bỏ ALS | đồng ý | đã bỏ |
| 9 | móc khi nạp nguyên index.js; khoá giả sau A1; khẳng định B4 | đúng | ghi vào B1, A1, B4 |
| 10 | THIET_KE.md còn :204, :305, :335 | đúng (grep) | F4 sửa cả ba |
| 11 | S8 :44 → :45 | đúng | đã sửa |
