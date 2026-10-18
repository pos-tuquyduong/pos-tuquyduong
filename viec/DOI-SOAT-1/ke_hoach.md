# DOI-SOAT-1 — kế hoạch (CHỜ DUYỆT)

Nền: HEAD `2123b69` (nhánh `viec/DOI-SOAT-1`, kho NÔNG — nhiều commit trong sổ như `9a68ab6`, `28638d0` không có trong kho, chỉ đọc được code HEAD).
Số dòng dưới đây đọc trong lượt này; dòng nào ghi `?` là chưa đọc. Phiếu dặn "Chờ duyệt kế hoạch" → dừng sau commit + push kế hoạch này.
Không có dữ liệu thật trong máy mây (không Turso) → mọi phép đo bên dưới là trên KHO TẠM; chỗ phụ thuộc dữ liệu thật ghi ở mục 8.

## 0. Sự thật đã đọc (nền của kế hoạch)

1. **Bất biến**: `cong_cu/gia_lap/bat_bien.js` 320 dòng, `BAT_BIEN` có 18 hàm I1–I9, I11–I19 (không có I10), xuất `{ BAT_BIEN, LOAI_TINH_VAO_VI }` (:320). Không có `require` nào (grep `require\(` trong file: 0) → nạp được từ `server/` không kéo theo gì.
   Mỗi hàm `I<n>(q, ctx)` trả **mảng chuỗi** (không có ngày). Câu SQL đều SELECT.
2. **Bốn hàm cần `ctx` do giả lập dựng**, không có trên dữ liệu thật: `I7` (`ctx.nhanKho`, `ctx.sxGia` — :80, :91, :96), `I9` (`ctx.soQuay.thu/doi` — :155–:172), `I13` (`ctx.soQuay.tangMa` — :221–:227), `I14` (`ctx.soQuay.giaoGoi` — :235–:242). Đây là "số quầy giả lập tự đếm", thật không có.
   → "dùng đúng các hàm giả lập" chạy được NGUYÊN VĂN cho 14 hàm; 3 hàm rút gọn, 1 hàm bỏ (mục 1.1).
3. **Nơi gọi hiện có**: `chay.js:268` nạp `BAT_BIEN`, `:291` gọi `BAT_BIEN[ten](q, ctx)`; `thu_gia_lap.js:420–424` gọi `BAT_BIEN.I2(q, {})`, `:590` gọi từng hàm; `kiem_tra_truoc_khi_giao.js:886` ĐỌC CHỮ của `cong_cu/gia_lap/bat_bien.js` (`dsVi`) để so danh sách ví với `wallets.js`; `kiem_tra_truoc_khi_giao.js:868` bánh cóc `NGUONG_BAT_BIEN = 18`.
4. **Neo đột biến của các việc trước**: grep `bat_bien\.js` trong `viec/**/*.py` → **31 chỗ / 11 file / 8 thư mục việc** (AUDIT-1, AUDIT-2, AUDIT-3, AUDIT-4, HOC-2b, LUOI-1, P26b, P26c, TU-CHAY-4). Tất cả neo CHỮ trong `cong_cu/gia_lap/bat_bien.js`.
5. **Báo cáo hiện có** (`server/routes/reports.js`, 353 dòng): mount `index.js:91` `/api/pos/reports`; mọi route `authenticate, checkPermission('view_reports')` (:23, :102, :165, :211, :257, :295). Quyền `view_reports`: owner 1 (`database.js:932`), manager 1 (:959), staff 0 (:945). `checkPermission` cho owner qua (`middleware/auth.js:84–90`).
6. **"Tiền mặt theo sổ" của báo cáo** = `SUM(CASE WHEN status='completed' THEN cash_amount …)` theo `DATE(created_at)` của ĐƠN (`reports.js:34`, tuần/khoảng `:127`, `:142`; chuyển khoản `:35/:128/:143`), lọc `(customer_package_id IS NULL OR total > 0)` (:41).
   Giờ: `created_at` ghi bằng `getNow()` = giờ VN không hậu tố (`helpers.js:134–136`, `Asia/Ho_Chi_Minh`); `getToday()` giờ VN (:113–115). SQL `DATE(created_at)` đã là ngày VN. `Reports.jsx:11` lấy "hôm nay" bằng `new Date().toISOString()` = UTC (lệch 0:00–7:00 sáng VN) — **Phát hiện**, không sửa ở đây.
7. **Tiền mặt vào két KHÔNG chỉ nằm ở con số trên** (nguồn của Câu hỏi 1):
   - thu nợ cộng THẲNG vào `cash_amount`/`transfer_amount` của đơn GỐC (`orders.js:1305–1309`, `pay-debt`) → nằm ở ngày TẠO đơn, không ở ngày thu; có dòng nhật ký `pos_order_log` loại `thu` kèm `{cach, so_tien}` (`orders.js:1317–1320`) và `luc`.
   - nạp ví: `pos_balance_transactions.payment_method` mặc định `'cash'` (`database.js:333`; `wallets.js:123–136` ghi `payment_method || 'cash'`) — tiền mặt nạp ví **không có** trong con số báo cáo.
   - đổi cách trả (`don-mo-rong.js:133–149`) dịch tiền giữa tiền mặt ↔ CK trên đơn gốc.
8. **Đường tạo bảng**: `createTables` kết thúc ở `database.js:905–906` (`console.log('✅ Đã tạo tất cả các bảng')`); `seedDefaultData` bắt đầu `:911`. Thêm bảng ở TRƯỚC dòng 905 (sau khối index `idx_cp_*` :898–903).
9. **Mã bill D1**: `claimed_phone` đã có chặn "một SĐT một lần" bằng `NOT EXISTS` (`signup-codes.js:398–399`, P20c); `diem_nhan_phone` chỉ chặn khi `nhandiem_chi_lan_dau` ≠ '0' (`signup-codes.js:120`, `:259–261`) → đếm `diem_nhan_phone ≥ 2` chỉ có nghĩa khi cài đặt đó bật.
10. **Điểm D2**: `orders.js:827–836` `điểm = floor(total / per)` nếu có SĐT, `total > 0`, không flash; **mua thẻ / gói cũng đi đường này theo `total`** (AUDIT-4 `bao_cao.md:40` AU4-16; chủ quán chốt A "giữ code" — `TIEN_DO_POS.json` dòng của DOI-SOAT-1/AUDIT-4). `I8` (`bat_bien.js:120–153`) ĐÃ kiểm đúng công thức này cho MỌI đơn, kể cả đơn mua thẻ (total > 0) và đơn lấy-từ-gói (total 0 → 0 điểm).
11. **Khuôn bài thử**: `thu_P26c.js` — nạp `database.js` thật + libsql trên kho tạm, ghi đè `ketNoiKho` (`:31–40`), dựng express với route thật (`:86–93`), 3 người owner/manager/staff (`:98–104`). Bài thật gọi từ `kiem_tra_truoc_khi_giao.js:495`, hàm `chayBaiThat` đòi dòng tổng khớp `\d+ đạt · \d+ hỏng` (`:486`). Nhóm "K · KHO THỬ" mở ở `:786`.

## 1. Phương án

### 1.1 Phần A — dùng lại bất biến, MỘT bản (nghiệm thu A)

| | **A (chọn)**: để nguyên `bat_bien.js`, `doiSoat.js` `require('../../cong_cu/gia_lap/bat_bien.js')` | B: chuyển lõi sang `server/utils/batBien.js`, `bat_bien.js` thành `module.exports = require(…)` |
|---|---|---|
| file / dòng | 0 dòng di chuyển; `bat_bien.js` +~6 dòng (3 nhánh `ctx.thuc`, mục dưới) | +320/−320 dòng di chuyển |
| neo cũ | còn nguyên | **hỏng 31 neo / 11 file / 8 việc** (mục 0.4) — ngoài Phạm vi (chỉ `viec/DOI-SOAT-1/**`), `kiem_tra:886` (`dsVi('cong_cu/gia_lap/bat_bien.js')`) đọc chữ file cũ sẽ báo đỏ — phiếu cho sửa đúng MỘT dòng ở `kiem_tra` |
| hướng phụ thuộc | `server/` nạp từ `cong_cu/` (ngược quy ước `LUAT_XAY_APP.md` §3 "dùng lại ≥ 2 chỗ → `utils/`") | đúng quy ước |
| rủi ro | file nằm trong kho nên Render có (kho deploy nguyên cây); nếu sau này tách `cong_cu/` khỏi deploy, màn Đối soát sập | K4 TU-CHAY-5: đổi tên/dời khối → mọi neo `dot_bien.py` chết im lặng |

Chọn **A** vì B bắt buộc sửa file ngoài Phạm vi để không làm hỏng bộ kiểm. Nhược điểm ghi thẳng (hướng phụ thuộc ngược) → **Câu hỏi 3**: chủ quán duyệt A tạm, hoặc mở việc riêng "chuyển lõi" có Phạm vi rộng hơn (cập nhật 31 neo + `kiem_tra:886`).

**Ba hàm rút gọn, một hàm bỏ** (nhãn hiện trên màn, không giấu): `ctx.thuc = true` do `doiSoat.js` truyền; mặc định `undefined` nên giả lập KHÔNG đổi hành vi (`thu_gia_lap.js:421/424` truyền `{}`):
- `I9` (:155): bỏ vế "nhật ký so với số quầy tự đếm" (:165–:172); **giữ** vế `debt_payment` ↔ dòng nhật ký `thu` (:173–:175). Nhãn: "rút gọn".
- `I13` (:221): thay `used_count = số đơn đã áp + tangMa` bằng `used_count ≥ số đơn đã áp` và `used_count ≤ usage_limit`. Nhãn: "rút gọn".
- `I14` (:235): thay `delivered = da_lay + giao tay` bằng `delivered ≥ da_lay`; các vế khác giữ. Nhãn: "rút gọn".
- `I7` (SX nhận đúng một lần): cần dữ liệu SX → **bỏ trên dữ liệu thật**, màn ghi "đối chiếu kho SX↔POS: dùng `doi-chieu.js` có sẵn"; không viết đường mới.

### 1.2 Phần B — lọc theo khoảng + giờ VN (nghiệm thu B)

Bất biến chạy trên TOÀN sổ (câu hỏi không thể thu hẹp mà không sửa 18 hàm), rồi **lọc dòng lệch theo kỳ**: mỗi dòng lệch quy về một thực thể (đơn / ví / gói …) có cột ngày; giữ dòng có ngày ∈ [từ, đến].

| | **A (chọn)**: suy thực thể + ngày từ CHỮ của dòng lệch (một biểu thức chính quy + một câu SELECT cho mỗi loại khoá) | B: đổi 18 hàm trả `{mo_ta, ngay}` |
|---|---|---|
| dòng | ~40 trong `doiSoat.js` | ~60 sửa trong `bat_bien.js` |
| giả lập | không đổi | mô tả/số bất biến giữ được nhưng đổi cả 18 chữ ký → phá neo như B ở 1.1 |
| rủi ro | đổi chữ mô tả → khoá hỏng → **chặn bằng ca thử** từng bất biến ra đúng một khoá phân giải được (C4); dòng KHÔNG phân giải được ngày → hiện **ĐỎ ở mọi kỳ** (an toàn: không bao giờ ẩn một lệch) | — |

- Khoá → cột ngày (đọc `?` = chưa mở schema, sẽ đọc trước khi viết): đơn theo `code`/`id` → `pos_orders.created_at`; gói → `pos_customer_packages.created_at` (:850); thẻ → `pos_membership_purchases.purchased_at` (:1185); mã bill → `pos_signup_codes.issued_at` (:1242); điểm → `pos_point_transactions.created_at` (:358); yêu cầu hoàn / quà / mã giảm → cột ngày `?`.
- Bất biến "toàn sổ" (số dư ví **I4**, tổng ví **I18**, loại dòng lạ **I5**, mã mồ côi **I2**, mã giảm **I13**): không có một ngày duy nhất → chạy cả sổ, nhãn **"toàn sổ"**, không lọc kỳ (nghiệm thu B). Với I4/I18 "ngày áp dụng" lấy theo ngày dòng ví MỚI NHẤT của ví đó (ví hoạt động sau bản vá thì lệch là đỏ) — **giới hạn**: ví có lệch cũ + giao dịch mới sẽ đỏ dù lỗi gốc cũ; chỉ biết khi thử trên bản sao thật (Câu hỏi 2).
- Kỳ: ngày = `YYYY-MM-DD`; tuần = thứ 2 → CN tính bằng `Date.UTC` trên chuỗi ngày (khuôn `addDaysToDateString`, `helpers.js:124–129`, không dính múi giờ máy); tháng = ngày 1 → cuối tháng. "Hôm nay" mặc định do MÁY CHỦ trả (`getToday()`), màn không tự tính (tránh lỗi UTC của `Reports.jsx:11`).

### 1.3 Phần C — dữ liệu cũ (nghiệm thu C)

`AP_DUNG_TU` trong `doiSoat.js`: một bảng tên → ngày. Dòng lệch có ngày `< AP_DUNG_TU[tên]` → nhóm **"LỆCH CŨ (trước bản vá)"** (vàng), không làm kết quả ĐỎ; `≥` hoặc không phân giải được → ĐỎ. Mặc định an toàn nghiêng về ĐỎ (xanh oan nguy hơn đỏ oan — K3).

Đề xuất ngày (cột "nguồn": đọc được = ✓, ngày lấy từ `TIEN_DO_POS.json` trường `ngay`, không kiểm được commit vì kho nông; `?` = chưa có nguồn, chờ Câu hỏi 2). Quy ước đề xuất: **ngày đầu tiên bản vá chạy trọn = ngày gộp + 1** (ngày gộp có thể có đơn trước giờ deploy; chủ quán chốt):

| bất biến | bản vá | ngày gộp (sổ) | AP_DUNG_TU đề xuất | nguồn |
|---|---|---|---|---|
| I1 mã bill | P20 (`9263ce5…a9f1bbe`) | 2026-09-27 | 2026-09-28 | ✓ sổ P20 |
| I2 mã mồ côi | P26c H5 (`9a68ab6`) | 2026-10-13 | 2026-10-14 | ✓ chú thích `bat_bien.js:35`, sổ P26c |
| I4, I5 số dư/loại ví | P21 (`59cec89…`) | 2026-09-27 | 2026-09-28 | ✓ sổ P21 |
| I8 điểm đơn (+D2) | luật chốt 02.10 | 2026-10-02 | 2026-10-03 | ✓ chú thích `bat_bien.js:2–10` |
| I9 nhật ký | P19 (`POS-NEN-v1`) | 2026-09-23 | 2026-09-24 | ✓ sổ P19 |
| I11, I17 hoàn theo ví | P26b (`c3d5816`) | 2026-10-03 | 2026-10-04 | ✓ sổ P26b |
| I13 lượt mã | P26c H7 (+ MA-GIAM-1 10-17) | 2026-10-13 | 2026-10-14 | ✓ chú thích `:216`, sổ |
| I14 gói | GOI-1 / GOI-2 | 2026-10-13 / 14 | 2026-10-15 | ✓ sổ |
| I18, I19 tổng ví / hoàn ≤ đã trả | P26c | 2026-10-13 | 2026-10-14 | ✓ chú thích `:296–:298` |
| D1 SĐT nhận ≥ 2 | P20c (`d47b81c`) | 2026-10-16 | 2026-10-17 | ✓ sổ |
| **I3, I6, I12, I15, I16** | `?` | `?` | `?` | chưa có nguồn — **Câu hỏi 2** |

Chưa có nguồn thì mặc định KHÔNG vàng (đỏ nếu lệch). Cảnh báo trước: sổ ghi "thử từng bất biến trên BẢN SAO dữ liệu thật" — máy mây không có, nên bảng này chưa kiểm trên dữ liệu cũ.

### 1.4 Phần D — hai phép mới (nghiệm thu D)

- **D1** (~12 dòng SQL trong `doiSoat.js`): `SELECT claimed_phone, COUNT(*) FROM pos_signup_codes WHERE claimed_phone IS NOT NULL GROUP BY claimed_phone HAVING COUNT(*) > 1` (+ `diem_nhan_phone` CHỈ khi `nhandiem_chi_lan_dau` ≠ '0', mục 0.9); mô tả dòng có SĐT + các mã. Ngày = `claimed_at` lớn nhất của nhóm; vàng nếu `< AP_DUNG_TU.D1`. Cấy hai dòng cùng SĐT trực tiếp trong bài thử (đường API đã chặn từ P20c).
- **D2**: **không viết phép mới** — `I8` đã kiểm đúng quy tắc A (mục 0.10) cho mọi đơn. Việc của kế hoạch: (a) đặt nhãn "D2 — đơn mua thẻ / gói" cho dòng I8 của đơn có món thẻ (`product_id ≤ −1000000`, khuôn `bat_bien.js:262`) hoặc gói (`pos_customer_packages.order_id`), ~8 dòng; (b) ca thử riêng chứng minh 3 đường (mục 3 D2a–c). Nếu chủ quán muốn "tiền thực trả" = `total − nợ` (khác `total`) thì D2 trái I8 ở đơn còn nợ → **Câu hỏi 5**.

### 1.5 Phần E/F — ô két, đối chiếu tuần/tháng

**Một bảng** `pos_doi_soat_ghi` (thêm ở cuối `createTables`, trước `:905`), **chỉ thêm dòng, không UPDATE/DELETE** (đường duy nhất là INSERT):
`id, loai ('ket'|'sao_ke'), ky (ngày YYYY-MM-DD cho két; ngày thứ 2 của tuần cho sao kê), so_tien INTEGER NULL, da_so INTEGER NULL, ghi_chu TEXT, nguoi TEXT, luc TEXT` + index `(loai, ky, id)`. Dòng mới nhất theo `id` là giá trị hiện hành; các dòng cũ còn đó làm lịch sử (hiện trong màn). Khuôn `luc` = `getNow()`.
Validate máy chủ: `ky` đúng dạng và không ở tương lai (VN); két: `Number.isInteger(so_tien)`, `0 ≤ so_tien ≤ TRAN_KET` (hằng số có tên, đề xuất 1.000.000.000); mã lỗi `DOI_SOAT_KY_SAI`, `DOI_SOAT_SO_TIEN_SAI` (400, `{error, code}`).

| E: "tiền mặt theo sổ" | **A (chọn tạm)**: đúng câu báo cáo (`reports.js:34` + lọc :41), gọi hàm `tienTheoSo` trong `doiSoat.js`; test ĐỐI CHỨNG hai số bằng nhau | B: cộng thêm nạp ví tiền mặt (`payment_method='cash'`, `wallets.js:136`) và thu nợ tiền mặt theo NGÀY THU (`pos_order_log` loại `thu`, `orders.js:1317`), trừ phần thu nợ đã nằm trong `cash_amount` đơn gốc |
|---|---|---|
| dòng | ~12 | ~30 SQL phức tạp, vẫn gần đúng nếu có "đổi cách trả" (`don-mo-rong.js:133–149`) |
| đúng với két? | **không**: bỏ nạp ví tiền mặt, tính thu nợ vào ngày tạo đơn (mục 0.7) | gần đúng hơn |

Điều này quyết định chênh lệch hiện ĐỎ có oan không → **Câu hỏi 1** (kèm tiền lẻ đầu ngày: số két đếm cuối ngày có gồm tiền để lại từ hôm trước không).
Mặc định tôi làm A **và hiện cạnh số tiền mặt hai khoản "nạp ví tiền mặt trong ngày" và "thu nợ tiền mặt trong ngày"** (chỉ hiển thị để người so, không cộng vào chênh) — cho đến khi chủ quán trả lời.
- Chênh lệch = `so_dem − tien_mat_theo_so`; `≠ 0` → ĐỎ kèm số; chưa có dòng két của ngày → "chưa đếm két" (vàng, không đỏ).
- **F tuần**: `chuyen_khoan` theo sổ của tuần (cùng `tienTheoSo`, tuần thứ 2→CN); dòng `sao_ke` mới nhất của tuần: `da_so`, `ghi_chu`. Không đỏ khi chưa so (vàng "chưa so sao kê").
- **F tháng**: 4 nhóm — tiền mặt, chuyển khoản (cùng `tienTheoSo`), ví (`SUM(balance_amount)` đơn completed trong tháng — `reports.js:36`), điểm (`SUM(points)` theo `type` trong tháng từ `pos_point_transactions`) — và dòng nhắc "kiểm kê kho thật" (chữ cố định, không số kho).

### 1.6 Phần G/H — quyền, hiệu năng

- **G**: hai route mới trong `reports.js` đúng khuôn `authenticate, checkPermission('view_reports')` (GET và POST đều); màn là tab trong `Reports.jsx` (menu "Báo cáo" đã ẩn theo quyền — `Layout.jsx:73`), nút ghi cũng ẩn khi `user` không có `view_reports`. Chỉ ẩn nút là phụ; máy chủ kiểm là chính (ca G1–G3).
- **H**: bất biến tải **toàn bảng** về rồi lọc trong JS (I3, I6, I8, I9 `SELECT … FROM pos_orders`/`pos_order_log` không WHERE) — chi phí ~tuyến tính theo tổng đơn, KHÔNG theo kỳ. Đo trên kho tạm với N đơn dựng hàng loạt (2.000 / 20.000 / 100.000, `INSERT` thẳng) + in **số câu SQL** và **số dòng trả về**. Tiêu chí `< 10 s` đo trên file cục bộ chỉ là cận dưới: Turso thật có độ trễ mạng mỗi câu (~35 câu + dòng truyền) → **CHƯA KIỂM trên Turso**; nếu cận dưới đã > 3 s ở N hiện có của chủ quán thì phương án giảm: (i) cache kết quả "XANH đến ngày X" (thêm dòng vào `pos_doi_soat_ghi`), (ii) lọc ngày trong SQL các bất biến nặng (sửa `bat_bien.js`, cần duyệt riêng). Chưa làm sớm khi chưa đo.

## 2. Chỉ ĐỌC — cách chứng minh (nghiệm thu A)

- `doiSoat.js` đưa vào bất biến một hàm `q` bọc: ném lỗi nếu câu SQL không bắt đầu bằng `SELECT` hoặc `WITH` (sau khi bỏ khoảng trắng/chú thích).
- Hàm ghi duy nhất là `ghiMoi` (INSERT vào `pos_doi_soat_ghi`), tách khỏi đường chạy bất biến.
- Bài thử: (1) bọc `db.query/queryOne/run` ghi lại MỌI câu SQL của một lượt chạy ngày/tuần/tháng → tất cả bắt đầu `SELECT|WITH`; (2) đếm hàng mọi bảng `pos_*` (trừ `pos_doi_soat_ghi`) trước/sau = nhau; (3) tĩnh: `doiSoat.js` không chứa `reconcile`, và `INSERT|UPDATE|DELETE` chỉ xuất hiện trong `ghiMoi`.

## 3. Ca thử ↔ nghiệm thu (1-1) — `cong_cu/thu_DOISOAT1.js` (~250 dòng)

Dữ liệu SẠCH dựng bằng route thật (đơn tiền mặt, đơn nợ + thu nợ, đơn huỷ, mua thẻ, mua gói + lấy hàng, đổi điểm) — để "xanh" là xanh trên luồng thật (K5); lệch cấy bằng UPDATE/INSERT trực tiếp rồi hoàn lại. Giờ giả: bọc `Date` (B4).

| NT | ca | khẳng định |
|---|---|---|
| A | A1 | `doiSoat` chạy đúng danh sách `Object.keys(BAT_BIEN)` trừ `I7` (ghi lý do), số bất biến báo = 17 + 1 "bỏ" = 18 |
| A | A2 | mọi câu SQL một lượt chạy (ngày/tuần/tháng) bắt đầu `SELECT\|WITH` |
| A | A3 | số hàng mọi bảng `pos_*` (trừ bảng mới) trước = sau |
| A | A4 | tĩnh: không `reconcile`; ghi chỉ trong `ghiMoi` |
| A | A5 | `chay.js` và `thu_gia_lap.js` (cổng có sẵn) vẫn đạt, dòng tổng "Giả lập: N kịch bản · M bất biến" không đổi (số trước/sau ghi vào `bang_chung_do.txt`) |
| B | B1 | ngày 18.10: chỉ thấy lệch của đơn 18.10, không thấy của đơn 17.10 |
| B | B2 | tuần: đơn CN 25.10 23:59:59 trong tuần 19→25; đơn T2 26.10 00:00:00 ngoài (ca ngay trên + ngay dưới) |
| B | B3 | tháng 10: đơn 31.10 trong, 01.11 ngoài; tháng 02 năm nhuận/không nhuận không sai (chọn 2028 và 2027) |
| B | B4 | đồng hồ giả 2026-10-18T18:30:00Z (= 01:30 T2 19.10 VN): "hôm nay" = 19.10, tuần = 19→25 (UTC sẽ ra 18.10 / 12→18) |
| B | B5 | I4 lệch ví ngoài kỳ vẫn hiện, nhãn "toàn sổ" |
| C | C1 | lệch ở dòng ngày `< AP_DUNG_TU` → nhóm vàng, `ket_qua = XANH` |
| C | C2 | cùng lệch ở ngày `=` AP_DUNG_TU → ĐỎ; `−1` ngày → vàng (ngay trên/dưới) |
| C | C3 | tĩnh: `AP_DUNG_TU` có đủ khoá cho mọi bất biến chạy (trừ I7) hoặc ghi `null` có lý do |
| C | C4 | với MỖI bất biến có thể cấy lệch (≈ 14): dòng lệch phân giải ra ngày (không rơi vào "không rõ ngày") |
| C | C5 | dòng không phân giải được ngày → ĐỎ ở mọi kỳ (đổi chữ mô tả giả → vẫn đỏ, không ẩn) |
| D | D1a/b/c | SĐT 2 dòng `claimed_phone` ngày ≥ P20c → ĐỎ; ngày < → vàng; `diem_nhan_phone` ×2 với `nhandiem_chi_lan_dau='0'` → KHÔNG lệch (K5) |
| D | D2a | mua thẻ 500.000 → 500 điểm: XANH; cấy 600 → ĐỎ "đơn X: 600 điểm, đúng luật là 500" |
| D | D2b | đơn lấy-từ-gói (total 0) có 5 điểm → ĐỎ |
| D | D2c | mua gói rồi lấy ngay: điểm theo tiền mua, không cộng thêm → XANH |
| E | E1 | chưa đếm → "chưa đếm két", `ket_qua` XANH |
| E | E2/E3 | đếm = sổ → chênh 0 XANH; đếm = sổ + 1 → ĐỎ đúng "+1" và tiền mặt theo sổ |
| E | E4 | ghi lần 2 → 2 dòng trong bảng, màn lấy dòng mới, lịch sử có cả hai; không có UPDATE |
| E | E5 | số âm, lẻ (`100.5`), chuỗi, `TRAN_KET+1` → 400 `DOI_SOAT_SO_TIEN_SAI`; `0` và `TRAN_KET` → 201 |
| E | E6 | ngày tương lai / sai dạng → 400 `DOI_SOAT_KY_SAI` |
| E | E7 | `tienTheoSo(ngày)` = `order_stats.cash_revenue` của `/reports/daily?date=` cùng ngày (đối chứng không chép công thức lệch) |
| F | F1 | tuần: tổng CK = tổng `transfer_amount` đơn completed trong tuần (seed 3 đơn) |
| F | F2 | đánh dấu "đã so" + ghi chú; ghi lần 2 thêm dòng, hiện dòng mới |
| F | F3 | tháng: đủ 4 nhóm + dòng nhắc kiểm kê kho, không số kho |
| G | G1/G2/G3/G4 | staff GET+POST → 403; manager → 200/201; không token → 401; owner → 200 |
| H | H1 | N đơn dựng hàng loạt: in thời gian + số câu + số dòng; `< 10 s` trên kho cục bộ (ngưỡng ghi là cận dưới) |
| I | — | bộ này + `dot_bien.py` (mục 6) |

## 4. Đường song song cần canh (K4)

- Mọi chỗ tính tiền mặt/CK theo ngày: `reports.js:34–35`, `:127–128`, `:142–143` (3 khối cùng khuôn `SUM(CASE … cash_amount)`) — `tienTheoSo` là bản thứ tư; ca E7 đối chiếu với `/daily`; thêm ca tương tự cho `/sales` (khoảng) để khoảng tuần cũng khớp.
- Mọi chỗ tính "hôm nay"/tuần bằng UTC: `Reports.jsx:11` (Phát hiện). `DoiSoat.jsx` lấy "hôm nay" từ máy chủ.
- Mọi hàm bất biến dùng `ctx.`: `grep "ctx\." bat_bien.js` → :91, :96, :115, :160, :165, :172, :227, :242 (8 dòng, 4 hàm: I7, I9, I13, I14) — đúng 3 hàm sửa + 1 bỏ.
- `fetch` trần trong `DoiSoat.jsx`: chỉ gọi qua `utils/api.js` (`api.get/post` — `api.js:175/179`), bánh cóc `NGUONG_FETCH`.

## 5. Luồng hợp lệ PHẢI KHÔNG bị chặn / đỏ oan (K5)

1. đơn tiền mặt bình thường → XANH.
2. đơn nợ rồi thu sau bằng `pay-debt` → XANH (`I6`, `I9` vế `debt_payment`).
3. huỷ đơn / duyệt hoàn → XANH (I11, I17, I19).
4. mua thẻ → +điểm đúng `floor(total/per)`; mua gói + lấy ngay → XANH.
5. đổi điểm lấy quà → XANH (I8 vế đổi, I12).
6. mã bill dùng đúng một lần / `nhandiem_chi_lan_dau='0'` cho nhận điểm nhiều lần → XANH (D1b).
7. ngày không có đơn nào → XANH, "chưa đếm két".
8. manager (có `view_reports`) xem + ghi két; owner luôn qua.
9. lệch CŨ trước ngày áp dụng → vàng, không đỏ.
10. kỳ trống / tuần vắt sang tháng khác → tính đúng.

## 6. Đột biến — `viec/DOI-SOAT-1/dot_bien.py` (mỗi dòng `('<tên>', …)`, tên là NGUYÊN chuỗi đầu)

| tên | chỗ vá | đột biến | ca phải đỏ |
|---|---|---|---|
| `BV-DS-BO-BAT-BIEN` | danh sách chạy | bỏ một bất biến (thử I6) khỏi vòng chạy | A1 + ca cấy lệch I6 |
| `BV-DS-BO-LOC-KY` | lọc kỳ | bỏ lọc theo khoảng | B1, B2, B3 |
| `VS-DS-GIO-UTC` | "hôm nay"/tuần | `new Date().toISOString()` thay `getToday()` | B4 |
| `VS-DS-TUAN-CN` | tuần | bắt đầu tuần CN thay thứ 2 | B2 |
| `BV-DS-BO-QUYEN` | route | bỏ `checkPermission('view_reports')` ở GET hoặc POST (hai đột biến) | G1 |
| `BV-DS-BO-AP-DUNG-TU` | nhóm vàng | mọi lệch đều đỏ | C1 |
| `VS-DS-AP-DUNG-NGUOC` | nhóm vàng | `<=` thay `<` (ca ngay trên/dưới) | C2 |
| `BV-DS-AN-KHONG-RO-NGAY` | fail-safe | dòng không rõ ngày bị loại | C5 |
| `VS-DS-GHI-DE` | `ghiMoi` | `UPDATE` thay `INSERT` | E4 |
| `BV-DS-BO-KIEM-SO-TIEN` | validate | bỏ kiểm số nguyên / trần | E5 |
| `BV-DS-GHI-DUOC` | q bọc | bỏ chặn không-SELECT | A2/A3 |
| `VS-DS-TIEN-MAT-THEO-NGAY-TAO` | `tienTheoSo` | đổi lọc ngày | E7 |

Mỗi đột biến chạy được TỪNG TÊN, có ĐỐI CHỨNG (bản chưa đột biến xanh), bài sập ≠ BẮT (K3 TOC-DO-1). Nạp theo khuôn `viec/LUOI-3/dot_bien.py` (nhập `ap/ban_sao/chay_bai` từ file có sẵn, đặt `sys.dont_write_bytecode = True`). Neo chữ ngắn, riêng; chạy `python3 viec/HOC-2b/kiem_neo.py` (và `AUDIT-2/3/4`) trên HEAD sau khi sửa `bat_bien.js` để chắc 31 neo cũ còn khớp.

## 7. Ngân sách

| file | dòng thêm |
|---|---|
| `server/utils/doiSoat.js` (mới) | ~150 |
| `server/routes/reports.js` | ~55 (2 route) |
| `server/database.js` | ~12 |
| `cong_cu/gia_lap/bat_bien.js` | ~6 |
| `client/src/components/DoiSoat.jsx` (mới) | ~150 |
| `client/src/pages/Reports.jsx` | ~8 |
| `kiem_tra_truoc_khi_giao.js` | 1 |
| **tổng code** | **~380** — vượt ~300 của phiếu ~25 % (phần lớn là `doiSoat.js`: khoá→ngày, bảng áp dụng, D1) |
| `cong_cu/thu_DOISOAT1.js` | ~250–300 |

Cách cắt nếu chủ quán muốn đúng ~300: bỏ nhãn D2 (−8), gộp tuần/tháng thành một khối hiển thị (−25), bỏ lưu lịch sử hiển thị trong màn (−20).

## 8. CHƯA KIỂM (nói thẳng)

- **Dữ liệu thật / Turso**: không có trong máy mây → chưa biết bất biến nào ĐỎ trên dữ liệu cũ, bảng `AP_DUNG_TU` mới là đề xuất; độ trễ mạng của ~35 câu.
- **Ngày gộp ≠ ngày deploy**: lấy từ sổ; kho nông, không đối chiếu được với commit.
- Chênh lệch két phụ thuộc Câu hỏi 1 (nạp ví tiền mặt, thu nợ ngày sau, tiền để lại đầu ngày).
- Giao diện: không có điện thoại; sẽ ghi 1–3 thao tác thử tay ở `trang_thai.md`.
- `I7` (SX) không chạy trên dữ liệu thật.

## 9. Câu hỏi cho chủ quán (cũng ghi ở `trang_thai.md`)

1. **Tiền mặt theo sổ của ngày**: (A) đúng con số báo cáo hiện có (`reports.js:34`), hoặc (B) cộng thêm nạp ví tiền mặt và thu nợ tiền mặt đúng ngày thu? Và số két đếm có gồm **tiền để lại từ hôm trước** không (nếu có, chênh luôn lệch một khoản cố định)? Gợi ý: nhập "tiền mặt thu được trong ngày = két cuối ngày − tiền để lại đầu ngày" — một ô.
2. **Ngày áp dụng**: bảng 1.3 đúng chưa; quy ước "ngày gộp + 1"; ai chạy bất biến trên BẢN SAO dữ liệu thật để chốt `I3, I6, I12, I15, I16` và các ví lệch cũ (I4/I18) trước khi bật?
3. **Vị trí lõi bất biến**: duyệt phương án A (server nạp thẳng `cong_cu/gia_lap/bat_bien.js`, không chuyển) hay mở việc riêng để chuyển sang `server/utils/` (cần cập nhật 31 neo + `kiem_tra:886`)?
4. **Nhãn rút gọn** cho I9, I13, I14 và **bỏ I7** trên dữ liệu thật — chấp nhận?
5. **D2**: giữ "điểm = floor(total/per)" như I8 (không viết phép mới) hay "tiền thực trả" = `total − nợ`? (hai cách khác nhau ở đơn thẻ/gói còn nợ.)
6. **Tiền két chênh ≠ 0 → ĐỎ ngay (không ngưỡng)** như phiếu — chắc chưa? (tiền lẻ vài trăm đồng cũng đỏ.)
7. Ngân sách ~380 dòng vượt ~300: cắt theo mục 7 hay chấp nhận?

## 10. Phát hiện ngoài Phạm vi (không sửa)

- `Reports.jsx:11` mặc định "hôm nay" theo UTC → 0:00–7:00 sáng VN tab Ngày hiện hôm qua.
- Báo cáo ngày (`reports.js:34`) tính thu nợ vào NGÀY TẠO đơn (mục 0.7): doanh thu tiền mặt của ngày cũ thay đổi về sau.
- Hướng phụ thuộc ngược `server/ → cong_cu/` nếu chọn phương án A (1.1).
