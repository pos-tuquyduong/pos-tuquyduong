# TU-CHAY-4 — Kế hoạch (bước 3, CHỜ DUYỆT)

Nền: `9d7a4b4 PHIEU: TU-CHAY-4` trên `d047037` (main). Mọi file:dòng dưới đây đọc trong lượt này (02.10.2026).
Chưa viết code, chưa viết bài thử — phiếu dặn dừng ở bước 3.

## 0. Sự thật từ code — ảnh hưởng thiết kế

| # | Sự thật | file:dòng |
|---|---|---|
| S1 | `server/index.js` không `module.exports`, tự gọi `require('dotenv').config()` (:10), tự `initDatabase` + `app.listen(PORT)` (:174–198). Thứ tự mount có ý nghĩa: `don-mo-rong` trước `orders` (:86–87), móc `doNeuDenLuc` trước mọi `/api/pos` (:76–79). | index.js |
| S2 | `initDatabase()` không nhận tham số (bỏ qua `DB_PATH`), nối qua `ketNoiKho.cauHinhTurso()` rồi `createClient` của `@libsql/client`. | database.js:15–27 |
| S3 | `sxApi` đọc `diaChiSX()` **lúc nạp module** và `SX_API_KEY` từ biến môi trường. | sxApi.js:9–10 |
| S4 | Vân tay kho: bán `POS:<id>:out:<stt>` (stt = vị trí món trong mảng), huỷ `POS:<id>:in:<stt>`; lỗi SX → ghi `pos_stock_pending`. | orders.js:989–1004, :1513–1528 (DELETE :1690) |
| S5 | pay-debt chặn thu hai lần bằng `WHERE id = ? AND debt_amount = ? AND payment_status != 'paid' AND status != 'cancelled'` + `changes !== 1` → 409 `DA_THU_ROI`; ghi nhật ký `thu` (:1296) và dòng sổ `debt_payment` số dương, balance 0/0, chỉ khi đơn có SĐT (:1303–1320). | orders.js:1285–1294 |
| S6 | Đổi cách trả ghi nhật ký `doi`, chống đổi hai lần bằng so số tiền. | don-mo-rong.js:142–157 |
| S7 | Danh sách trắng ví `LOAI_TINH_VAO_VI = ['topup','purchase','refund','adjust','compensation']` — **không export**. Đối soát 1 khách / toàn bộ chỉ cộng loại trong danh sách. | wallets.js:240–262, :284–297 |
| S8 | Mã bill dùng được khi đơn `status='completed' AND payment_status='paid'` (danh sách trắng). Chiếm mã: `AND claimed_at IS NULL` (claim), `AND diem_nhan_luc IS NULL` (nhận điểm), cả hai trong giao dịch, phép kiểm đơn nằm NGOÀI giao dịch. | signup-codes.js:44, :58, :385, :246–249 |
| S9 | Điểm KHÔNG có số dư lưu rời — chỉ `SUM(points)` dòng còn hạn. Bán có SĐT, total > 0, không flash → 1 dòng `earn` = floor(total / loyalty_earn_per_amount), **kể cả đơn chưa thu** (P22 chưa làm). Nhận điểm mã bill → thêm 1 dòng `earn` bù để tổng = gốc × hệ số. Huỷ đơn không trừ điểm (P24 chưa làm). | database.js:342–356; orders.js:774–797, :955–962; signup-codes.js:197–214 |
| S10 | Trạng thái tiền chỉ do máy chủ tính: `debt_amount > 0` → `partial` (có ví) / `pending`; ngược lại `paid`. Tổng thanh toán phải khớp `total` ±1đ. | orders.js:727–752 |
| S11 | Duyệt hoàn tiền: cộng ví + dòng `refund` + `status='refunded'`, `payment_status` giữ `paid`. | refunds.js:174–219 |
| S12 | Nhật ký đơn chỉ ghi việc chưa có chỗ lưu (thu sau, đổi cách trả); giờ huỷ nằm trong `pos_orders`. | nhatKyDon.js:1–10 |
| S13 | 6 câu SQL "27.09" **không có trong kho** (grep 27.09 ngoài attached_assets/client: chỉ THIET_KE.md và sổ việc). Câu SQL I1–I5 viết lại từ schema thật ở mục 3. | — |

## 1. Sân khấu (B1–B4) — phương án

**B1 · máy chủ thật**
- **A (chọn):** nạp NGUYÊN `server/index.js` trong cùng tiến trình, sau khi đặt sẵn vào `require.cache`: `ketNoiKho`
  thay thế (kho = file tạm, `diaChiSX` = SX giả — đúng cách `thu_P20.js:29–40`), `dotenv` thay bằng hàm rỗng (để
  `.env` của máy không bao giờ được nạp — S1). `PORT` = cổng trống lấy từ `listen(0)`. Chờ `/api/pos/health` trả 200
  (index.js chỉ listen SAU `initDatabase`, nên health trả lời = kho sẵn sàng). ~25 dòng.
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
bảng × 40 ms = 12 s vô ích). Thêm `AsyncLocalStorage`: middleware đầu tiên gắn mã yêu cầu, lớp bọc ghi `(mã yêu cầu,
đầu câu SQL)` → bằng chứng chồng nhau cho kịch bản 10 (mục 2). ~25 dòng.

**B4 · dữ liệu mẫu cố định** (qua route thật khi có, SQL thẳng chỉ cho cấu hình/danh mục — như `thu_P20.js:91–102`):
cấu hình mã bill + điểm y `thu_P20.js:93–99`; 5 món đầu của seed (database.js:981–996) đặt giá 25.000 / 20.000 /
30.000 / 15.000 / 35.000 đ; 1 gói `GOI_GL` 300.000 đ / 10 ly; 1 nhân viên thứ hai (`role='staff'`) để kịch bản 10, 11 là
HAI người thật; khách quen: `pos_customers` + **nạp 200.000 đ qua `POST /wallets/topup`** (sổ và ví khớp từ đầu);
khách nợ: `pos_customers` + **đơn ghi nợ 50.000 đ qua `POST /orders`**; khách mới: chỉ có SĐT. ~35 dòng.

**A1/A2 · an toàn** (~30 dòng, chạy TRƯỚC mọi `require` của server):
- Từ chối (thoát 3, in tên biến, KHÔNG in giá trị) khi có biến tên khớp `^TURSO_`, `DATABASE_URL`, `SX_API_URL`,
  `SX_API_URL_THU`, `SX_API_KEY`, `JWT_SECRET`, `POS_SERVICE_API_KEY`, hoặc biến bất kỳ có giá trị chứa một chuỗi trong
  `ten_mien_production` (đọc từ `tu_chay/cau_hinh.json`; đọc hỏng → từ chối). **Xem Câu hỏi 1 — chỗ này đụng Replit.**
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
| 4 | Khách nợ trả nợ cũ 2 lần: 20.000 (`partial`) rồi 30.000 (`paid`); khách quen ghi nợ 30.000 rồi trả đủ (CK) | 200 × 3 |
| 5 | Khách quen trả ví 25.000 → huỷ đơn | ví hoàn lại, SX nhận vân tay `in` |
| 6 | Khách quen trả tiền mặt 20.000 → yêu cầu hoàn → duyệt | `refunded`, ví +20.000 |
| 7 | Khách mới dùng mã bill: bill kịch bản 1 (đã thu) → `/claim` 200; bill `cho_thu` mới → 400 `BILL_CHUA_THANH_TOAN` | đúng 2 kết quả |
| 8 | Khách quen nạp 100.000 → mua 45.000 bằng ví → chủ quán bấm đối soát ví khách đó (`POST /wallets/:phone/reconcile`) | số dư trước = sau đối soát |
| 9 | Khách quen mua gói `GOI_GL` + lấy 1 ly ngay từ gói (luồng K5 đã từng gãy) | 200, gói `delivered_qty=1` |
| 10 | Bill `cho_thu` 25.000 → hai nhân viên cùng pay-debt (`Promise.all`, trễ 40 ms) | đúng một 200 + một 409 `DA_THU_ROI` |
| 11 | Mã bill đã thu → (a) hai SĐT cùng `/claim`, (b) hai SĐT cùng `/nhan-diem`, chồng nhau bằng móc trước giao dịch như `thu_P20.js:63–75` | (a) 200 + 409 `MA_DA_DUNG`; (b) 200 + 400 `MA_DA_NHAN_DIEM` |

**Bằng chứng chồng nhau** (không có thì kịch bản đó KHÔNG ĐẠT, dù kết quả HTTP đúng):
- KB10: nhật ký AsyncLocalStorage phải cho thấy **cả hai** yêu cầu đã chạy `SELECT * FROM pos_orders WHERE id` TRƯỚC khi
  yêu cầu nào chạy `UPDATE pos_orders SET`. Thêm tự kiểm: trung vị thời gian một lệnh kho ≥ 35 ms (trễ đang bật).
- KB11: móc đã chạy (người chen vào có kết quả) trước khi người kia mở giao dịch — như `thu_P20.js:211`, `:239`.

Thứ tự 4 → 8 có chủ ý: khách quen có dòng `debt_payment` trước lần đối soát ở KB8 (để đột biến danh sách trắng lộ ra).

## 3. Chín bất biến (D) — SQL chỉ đọc, mỗi cái một hàm `I1…I9` (~80 dòng)

Mỗi hàm trả mảng dòng lệch `{mo_ta, tien?}`; 0 phần tử = đạt. Chạy sau MỖI kịch bản và ở cuối.

- **I1** mã đã dùng (`claimed_at` hoặc `diem_nhan_luc` khác NULL) ⇒ đơn gốc `payment_status='paid'` VÀ (`status='completed'`
  HOẶC huỷ/hoàn SAU lúc dùng mã: `cancelled_at` > lúc dùng / `pos_refund_requests.processed_at` > lúc dùng).
  Nguồn: S8; ngoại lệ "sau lúc dùng" vì huỷ đơn sau khi khách đã đổi mã là luồng hợp lệ (K5).
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
- **I8** điểm mỗi đơn = `SUM(points WHERE order_id)` phải bằng: mã bill của đơn đã nhận điểm → `floor(total/per) × hệ số`;
  chưa nhận và đơn có SĐT, total > 0, không flash → `floor(total/per)`; còn lại → 0. Nguồn S9. **Xem Câu hỏi 2.**
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
  | M3 đối soát cộng mọi loại: `` `type IN ( `` → `` `1=1 OR type IN ( `` (danh sách trắng P21) | wallets.js:241 | KB8 → **I4** |
  | M4 vân tay chiều huỷ trùng chiều bán: `:in:${sttMon}` → `:out:${sttMon}` (2 chỗ) | orders.js:1513, :1690 | KB5 → **I7** |
  | M5 bỏ `AND diem_nhan_luc IS NULL` | signup-codes.js:248 | KB11b → **I8** |
  | M6 bỏ lệnh `ghiNhatKy(... "thu" ...)` của pay-debt | orders.js:1296–1299 | KB3 → **I9** |

  Không có đột biến tự nhiên — ghi lý do: **I2** (máy chủ không có chặn nào giữ mã gắn đơn; mồ côi chỉ sinh khi xoá
  đơn — DELETE không thuộc 11 kịch bản), **I3** (trạng thái do máy chủ tự đặt từ hằng số, không có chặn để bỏ), **I5**
  (máy chủ không kiểm loại dòng ví; danh sách là của giả lập). Ba cái này là lưới cho mã MỚI sau này.
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
  bảng I1–I9 ghi nguồn là `bat_bien.js`. `tu_chay/PHIEN_BAN` → `tu-chay 1.3.2`.

## 6. Ca thử ↔ Nghiệm thu (1-1)

| Nghiệm thu | Ca | Đỏ trên gốc? |
|---|---|---|
| A1 | E3: 9 ca từ chối + 1 cấu hình hỏng + 4 ca cho qua | đỏ (giả lập chưa có) |
| A2 | E1 kèm so `data/` + tmp đã dọn, cả khi sập | đỏ |
| A3 | `git diff --stat main -- server client` rỗng (bộ kiểm / tự rà trước commit) | — |
| B1–B4 | E1 ĐẠT (máy chủ thật, SX giả, trễ, dữ liệu mẫu) + tự kiểm trễ ≥ 35 ms | đỏ |
| C1–C11 | mỗi kịch bản có mong đợi HTTP; KB10/11 có bằng chứng chồng nhau | đỏ |
| D I1–I9 | E2 M1–M6 (6/9 bất biến có đột biến), lý do cho I2, I3, I5 | đỏ |
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
- Bất biến không được báo lệch oan với luồng hợp lệ: huỷ đơn SAU khi đã đổi mã (I1), đơn 0đ lấy từ gói (I6, I8 = 0),
  đơn ghi nợ có ví một phần (`partial`, I3), dòng `debt_payment` (I5), khách chỉ có dòng nợ không có ví (I4: tổng trắng = 0).
  Mỗi luồng này có mặt trong 11 kịch bản (KB4, KB9, KB5) → E1 ĐẠT là ca "không bị chặn".

## 8. Đường song song (K4)

- Vân tay `in` có HAI chỗ (cancel :1513, DELETE :1690) — M4 sửa cả hai; DELETE không thuộc 11 kịch bản → ghi CHƯA KIỂM.
- Chiếm mã có HAI đường (claim, nhận điểm) — KB11 chạy cả hai.
- Ghi ví có 5 đường (bán, huỷ, xoá, duyệt hoàn, nạp) + đối soát — 11 kịch bản phủ bán/huỷ/duyệt hoàn/nạp/đối soát; xoá
  đơn và `/wallets/deduct|adjust` → CHƯA KIỂM.
- Danh sách trắng ví có 2 bản (wallets.js, bat_bien.js) → F2 phép tĩnh so khớp.

## 9. Ngân sách dự kiến

| Phần | Phiếu | Dự kiến |
|---|---|---|
| `cong_cu/gia_lap/` | ~450 | ~470 (3 file) |
| `thu_gia_lap.js` | ~200 | ~200 |
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

## Soát kế hoạch (agent phụ, chỉ đọc)

(điền sau khi soát)
