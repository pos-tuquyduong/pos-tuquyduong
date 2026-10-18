# DOI-SOAT-1 — kế hoạch (bản 2 — ĐÃ DUYỆT 18.10 với 8 quyết định ở `quyet_dinh.md`; chỗ nào khác nhau thì `quyet_dinh.md` thắng)

Nền: HEAD `2123b69` (nhánh `viec/DOI-SOAT-1`, kho NÔNG — nhiều commit trong sổ như `9a68ab6`, `28638d0` không có trong kho, chỉ đọc được code HEAD).
Số dòng dưới đây đọc trong lượt này; dòng nào ghi `?` là chưa đọc. Phiếu dặn "Chờ duyệt kế hoạch" → dừng sau commit + push kế hoạch này.
Không có dữ liệu thật trong máy mây (không Turso) → mọi phép đo bên dưới là trên KHO TẠM; chỗ phụ thuộc dữ liệu thật ghi ở mục 8.

## 0. Sự thật đã đọc (nền của kế hoạch)

1. **Bất biến**: `cong_cu/gia_lap/bat_bien.js` 320 dòng, `BAT_BIEN` có 18 hàm I1–I9, I11–I19 (không có I10), xuất `{ BAT_BIEN, LOAI_TINH_VAO_VI }` (:320). Không có `require` nào (grep `require\(` trong file: 0) → nạp được từ `server/` không kéo theo gì.
   Mỗi hàm `I<n>(q, ctx)` trả **mảng chuỗi** (không có ngày). Câu SQL đều SELECT.
2. **Bốn hàm cần `ctx` do giả lập dựng**, không có trên dữ liệu thật: `I7` (`ctx.nhanKho`, `ctx.sxGia` — :80, :91, :96, :115), `I9` (`ctx.soQuay.thu/doi` — :160, :165, :172), `I13` (`ctx.soQuay.tangMa` — :227), `I14` (`ctx.soQuay.giaoGoi` — :242): tám dòng `ctx.` (grep `ctx\.` → 91, 96, 115, 160, 165, 172, 227, 242). Đây là "số quầy giả lập tự đếm", thật không có.
   → "dùng đúng các hàm giả lập" chạy được NGUYÊN VĂN cho 14 hàm; 3 hàm rút gọn, 1 hàm bỏ (mục 1.1).
3. **Nơi gọi hiện có**: `chay.js:268` nạp `BAT_BIEN`, `:291` gọi `BAT_BIEN[ten](q, ctx)`; `thu_gia_lap.js:420–424` gọi `BAT_BIEN.I2(q, {})`, `:590` gọi từng hàm; `kiem_tra_truoc_khi_giao.js:886` ĐỌC CHỮ của `cong_cu/gia_lap/bat_bien.js` (`dsVi`) để so danh sách ví với `wallets.js`; `:868` bánh cóc `NGUONG_BAT_BIEN = 18`.
4. **Neo đột biến của các việc trước**: grep `bat_bien\.js` trong `viec/**/*.py` → **31 chỗ / 11 file / 8 thư mục việc** (AUDIT-1, AUDIT-2, AUDIT-3, AUDIT-4, HOC-2b, LUOI-1, P26b, P26c, TU-CHAY-4; agent soát đếm lại cũng ra 31 / 11). Tất cả neo CHỮ trong `cong_cu/gia_lap/bat_bien.js`.
5. **Báo cáo hiện có** (`server/routes/reports.js`, 353 dòng): mount `index.js:91` `/api/pos/reports`; mọi route `authenticate, checkPermission('view_reports')` (:23, :102, :165, :211, :257, :295). Quyền `view_reports`: owner 1 (`database.js:932`), manager 1 (:959), staff 0 (:945). `checkPermission` cho owner qua (`middleware/auth.js:84–90`).
6. **"Tiền mặt theo sổ" của báo cáo** = `SUM(CASE WHEN status='completed' THEN cash_amount …)` theo `DATE(created_at)` của ĐƠN (`reports.js:34`, khoảng `:127`, `:142`; chuyển khoản `:35/:128/:143`), lọc `(customer_package_id IS NULL OR total > 0)` (:41).
   Giờ: `created_at` ghi bằng `getNow()` = giờ VN không hậu tố (`helpers.js:134–136`, `Asia/Ho_Chi_Minh`); `getToday()` giờ VN (:113–115). SQL `DATE(created_at)` đã là ngày VN. `Reports.jsx:11` lấy "hôm nay" bằng `new Date().toISOString()` = UTC — **Phát hiện**, không sửa ở đây.
7. **Tiền mặt vào két KHÔNG chỉ nằm ở con số trên** (nguồn của Câu hỏi 1):
   - thu nợ cộng THẲNG vào `cash_amount`/`transfer_amount` của đơn GỐC (`orders.js:1305–1310`, `pay-debt`) → nằm ở ngày TẠO đơn, không ở ngày thu; có dòng nhật ký `pos_order_log` loại `thu` kèm `{cach, so_tien}` (`orders.js:1317–1320`) và `luc`.
   - nạp ví: `pos_balance_transactions.payment_method` mặc định `'cash'` (`database.js:333`; `wallets.js:123–136` ghi `payment_method || 'cash'`) — tiền mặt nạp ví **không có** trong con số báo cáo.
   - đổi cách trả (`don-mo-rong.js:133–149`) dịch tiền giữa tiền mặt ↔ CK trên đơn gốc.
8. **Đường tạo bảng**: `createTables` kết thúc ở `database.js:905–906`; `seedDefaultData` bắt đầu `:911`. Thêm bảng ở TRƯỚC dòng 905 (sau khối index `idx_cp_*` :898–903).
9. **Mã bill D1**: `claimed_phone` có chặn "một SĐT một lần" bằng `NOT EXISTS` (`signup-codes.js:398–399`, P20c); `diem_nhan_phone` chỉ chặn khi `nhandiem_chi_lan_dau` ≠ '0' (`signup-codes.js:120`, `:259–261`).
10. **Điểm D2**: `orders.js:827–836` `điểm = floor(total / per)` nếu có SĐT, `total > 0`, không flash; mua thẻ / gói đi đường này theo `total` (AUDIT-4 `bao_cao.md:40` AU4-16; chủ quán chốt A "giữ code"). `I8` (`bat_bien.js:120–152`) ĐÃ kiểm đúng công thức này cho MỌI đơn (đơn mua thẻ total > 0; đơn lấy-từ-gói total 0 → 0 điểm).
11. **Khuôn bài thử**: `thu_P26c.js` — nạp `database.js` thật + libsql trên kho tạm, ghi đè `ketNoiKho` (`:31–40`), dựng express với route thật (`:86–93`), 3 người owner/manager/staff (`:98–104`). Bài thật gọi từ `kiem_tra_truoc_khi_giao.js:495`; `chayBaiThat` đòi dòng tổng khớp `\d+ đạt · \d+ hỏng` (`:486`). Nhóm "K · KHO THỬ" mở ở `:786`.
12. **Phiếu về `kiem_tra_truoc_khi_giao.js`**: chỉ được THÊM MỘT dòng gọi bài (Cấm, phieu.md dòng cuối mục Cấm) — **không** được sửa `:886`. (Bản 1 của kế hoạch hiểu sai chỗ này; lý do bỏ phương án B giờ chỉ còn 31 neo.)

## 1. Phương án

### 1.1 Phần A — dùng lại bất biến, MỘT bản (nghiệm thu A)

| | **A (chọn)**: để nguyên `bat_bien.js`, `doiSoat.js` `require('../../cong_cu/gia_lap/bat_bien.js')` | B: chuyển lõi sang `server/utils/batBien.js`, `bat_bien.js` thành `module.exports = require(…)` |
|---|---|---|
| dòng | 0 dòng di chuyển; `bat_bien.js` +~8 dòng (nhánh `ctx.thuc`, dưới) | +320/−320 dòng di chuyển |
| neo cũ | còn nguyên (kiểm lại bằng `kiem_neo.py` sau khi sửa, mục 6) | **hỏng 31 neo / 11 file / 8 việc** (ngoài Phạm vi — chỉ `viec/DOI-SOAT-1/**`) |
| `kiem_tra:886` | không đụng | đọc chữ file cũ → đỏ; phiếu không cho sửa dòng đó (mục 0.12) |
| hướng phụ thuộc | `server/` nạp từ `cong_cu/` (ngược quy ước `LUAT_XAY_APP.md` §3) | đúng quy ước |
| rủi ro | file nằm trong kho nên Render có (deploy nguyên cây); nếu sau này tách `cong_cu/` khỏi deploy, màn Đối soát sập | K4 TU-CHAY-5: dời khối → neo `dot_bien.py` chết im lặng |

Chọn **A**. Nếu chủ quán không duyệt A thì trong Phạm vi hiện tại KHÔNG có phương án B chạy được → phải mở việc chuyển lõi riêng với Phạm vi rộng hơn (**Câu hỏi 3**).

**Ba hàm rút gọn, một hàm bỏ.** `doiSoat.js` truyền `ctx.thuc = true`; mặc định `undefined` nên giả lập KHÔNG đổi hành vi (`thu_gia_lap.js:421/424` truyền `{}`). Cách khác đã cân nhắc — để `doiSoat.js` tự dựng `ctx` giả từ sổ (`tangMa = max(0, used − so_don)`, `giaoGoi = max(0, delivered − da_lay)`, `soQuay.thu/doi` dựng từ chính `pos_order_log`) để khỏi sửa `bat_bien.js`: ngắn hơn một chút nhưng PHẢI chép lại hai câu con `so_don` (:223–:224) và `da_lay` (:238) vào `doiSoat.js` → quy tắc ở hai nơi, đổi một nơi (vd P22/P24 sửa I8 cùng lúc) thì nơi kia trôi im lặng. Chọn nhánh `ctx.thuc` để công thức chỉ ở một chỗ:
- `I9` (:155): với `ctx.thuc` dùng `quayThu = quayDoi = rỗng` NGAY ĐẦU (kể cả danh sách `ids` ở :160 và `quay` ở :165, `doi` ở :172 — bản 1 bỏ sót :160, `ctx.soQuay` undefined sẽ ném `TypeError`); **giữ** vế `debt_payment` ↔ dòng nhật ký `thu` (:173–:175, dùng `thu` ở :164, không dùng `quay`). Nhãn "rút gọn".
- `I13` (:221): thay `used_count = số đơn đã áp + tangMa` bằng `used_count ≥ số đơn đã áp` và `used_count ≤ usage_limit` (:227–:228). Nhãn "rút gọn".
- `I14` (:235): thay `delivered = da_lay + giao tay` bằng `delivered ≥ da_lay` (:242); các vế khác giữ. Nhãn "rút gọn".
- `I7`: bỏ trên dữ liệu thật; màn ghi "đối chiếu kho SX↔POS: dùng `doi-chieu.js` có sẵn".

**ĐỎ OAN đã biết** (so với trạng thái HIỆN TẠI, không phải với quy tắc lúc ghi; agent soát chỉ ra, tôi đọc lại code xác nhận): `I8` đọc `pos_settings` hiện tại (`loyalty_enabled`, `loyalty_earn_per_amount`, `nhandiem_he_so` — :121–:124) → đổi hệ số / bật tắt loyalty thì đơn cũ đỏ; `I12` so với `pos_reward_catalog` hiện tại (chú thích :197); `I13` so với loại / trị giá mã hiện tại (:219–:220) và `usage_limit` hiện tại (chủ quán hạ giới hạn sau khi mã đã dùng → đỏ); `I13` rút gọn: `so_don` (:223–:224) có thể đếm thừa vì máy chủ lưu `discount_code` cả khi mã không được áp (chú thích :217–:220); `I14` rút gọn: `da_lay` tính cả đơn `refunded` (`x.status <> 'cancelled'` — :238) trong khi hoàn không giảm `delivered_qty`. Cách xử lý đề xuất: dòng của các bất biến này hiện kèm nhãn "rút gọn / theo cài đặt hiện tại — có thể oan" nhưng vẫn ĐỎ (K3: xanh oan nguy hơn); chủ quán chốt ở **Câu hỏi 4**.

### 1.2 Phần B — lọc theo khoảng + giờ VN (nghiệm thu B)

Bất biến chạy trên TOÀN sổ, rồi **lọc dòng lệch theo kỳ**. Ba lớp bất biến (bản 1 lẫn lộn, soát độc lập chỉ ra mâu thuẫn):

| lớp | bất biến | kỳ | màu |
|---|---|---|---|
| 1 — có khoá, có ngày | I1, I3, I6, I8 (vế đơn + vế đổi điểm), I9, I11, I12, I14, I15, I16, I17, I19, D1 | lọc theo kỳ | vàng nếu ngày `< AP_DUNG_TU`, đỏ nếu ≥ |
| 2 — toàn sổ, có khoá | I2, I4, I13, I18 | KHÔNG lọc kỳ, nhãn "toàn sổ" | vàng theo ngày thực thể (mục dưới) |
| 3 — gộp, không khoá | I5 (`loại dòng ví lạ`), I8 (`loại dòng điểm lạ`) | KHÔNG lọc kỳ, nhãn "toàn sổ" | ĐỎ luôn (không ngày để so) |

**Khoá → ngày: bảng RIÊNG từng bất biến, không một regex chung** (agent soát: "mã X" mang 3 nghĩa — mã bill ở I1:33/I2:39, mã giảm ở I13:229, mã quà ở I12:212; "đơn mua gói/thẻ CODE" ở I14:258 / I15:268 bị regex `đơn (\S+)` bắt nhầm; `#N` mang 6 nghĩa). Dạng: `KHOA = { I1: { re: /^mã (\S+) đã dùng/, ngay: 'SELECT … WHERE code = ?' }, … }` (~35 dòng). Dòng không khớp khoá nào → "không rõ ngày" → **ĐỎ ở mọi kỳ** (an toàn: không bao giờ ẩn lệch). Ca C4 chặn đổi chữ mô tả: mỗi bất biến lớp 1–2 cấy một lệch phải ra ngày.
- Đơn đã XOÁ (I9:163, I11:183/:192 soát cả đơn đã xoá → không còn `pos_orders`): ngày lấy từ nguồn khác — I11: `MIN(pos_balance_transactions.created_at)` theo `order_id`; I9: `MIN(pos_order_log.luc)` theo `order_id`.
- Cột ngày (đã đọc ✓ / `?` sẽ mở schema trước khi viết): đơn `pos_orders.created_at` ✓(`getNow`); gói `pos_customer_packages.created_at` ✓ (database.js:850); thẻ `pos_membership_purchases.purchased_at` ✓ (:1185); mã bill `pos_signup_codes.issued_at` ✓ (:1242); điểm `pos_point_transactions.created_at` ✓ (:358); yêu cầu hoàn `requested_at/processed_at` (agent soát: `refunds.js:122–124`, tôi chưa đọc `?`); quà `granted_at` (`loyalty.js:189–191` `?`); mã giảm `?`.
- Lớp 2 — ngày thực thể: I4/I18 theo ngày dòng ví MỚI NHẤT của ví (giới hạn: ví có lệch cũ + giao dịch mới thì đỏ dù lỗi gốc cũ — chỉ biết khi thử bản sao thật, Câu hỏi 2); I2 theo `issued_at`; I13 theo ngày tạo mã `?`.
- Kỳ: ngày = `YYYY-MM-DD`; tuần = thứ 2 → CN tính bằng `Date.UTC` trên chuỗi ngày (khuôn `addDaysToDateString`, `helpers.js:124–129`); tháng = ngày 1 → cuối tháng. "Hôm nay" do MÁY CHỦ trả (`getToday()`), màn không tự tính.

### 1.3 Phần C — dữ liệu cũ (nghiệm thu C)

`AP_DUNG_TU` trong `doiSoat.js`: bảng tên → ngày. Lệch có ngày `< AP_DUNG_TU[tên]` → nhóm **"LỆCH CŨ (trước bản vá)"** (vàng), không làm ĐỎ; `≥` hoặc không rõ ngày → ĐỎ.

Phiếu đòi "ngày kèm commit cho từng bất biến": kho nông + sổ không ghi commit cho mọi bản vá → cột commit dưới đây chỉ có chỗ sổ ghi; chỗ `—` cần chủ quán/bản sao thật (Câu hỏi 2). Quy ước đề xuất: **ngày đầu tiên bản vá chạy trọn = ngày gộp + 1**.

| bất biến | bản vá | commit (sổ) | ngày gộp (sổ) | AP_DUNG_TU đề xuất |
|---|---|---|---|---|
| I1 mã bill | P20 | `9263ce5, 619836f, 2ce7c31, e699e93, a9f1bbe` | 2026-09-27 | 2026-09-28 |
| I2 mã mồ côi | P26c H5 (chú thích `bat_bien.js:35`) | `9a68ab6` | 2026-10-13 | 2026-10-14 |
| I4, I5 | P21 | `59cec89…` | 2026-09-27 | 2026-09-28 |
| I8 (+D2) | luật chốt 02.10 (`bat_bien.js:2–10`) | — | 2026-10-02 | 2026-10-03 |
| I9 | P19 `POS-NEN-v1` | null trong sổ | 2026-09-23 | 2026-09-24 |
| I11, I17 | P26b | `c3d5816` | 2026-10-03 | 2026-10-04 |
| I13 | P26c H7 (+ MA-GIAM-1) | `9a68ab6`, `5a6fc0f` | 2026-10-13 / 10-17 | 2026-10-14 |
| I14 | GOI-1 / GOI-2 | `28f65d1`, `83872a4` | 2026-10-13 / 14 | 2026-10-15 |
| I18, I19 | P26c (`bat_bien.js:295–298`) | `9a68ab6` | 2026-10-13 | 2026-10-14 |
| D1 | P20c | `d47b81c` | 2026-10-16 | 2026-10-17 |
| **I3, I6, I12, I15, I16** | `?` | `?` | `?` | `?` — mặc định KHÔNG vàng (đỏ nếu lệch) |

### 1.4 Phần D — hai phép (nghiệm thu D)

- **D1** (~12 dòng SQL): `claimed_phone` và `diem_nhan_phone` — **cả hai cột, đếm SĐT có ≥ 2 dòng** như phiếu (bản 1 lọc `diem_nhan_phone` theo cài đặt hiện tại → chủ quán tắt rồi bật lại thì dấu vết cũ bị ẩn/hiện sai; bỏ). Riêng `diem_nhan_phone` khi cài đặt `nhandiem_chi_lan_dau = '0'` (cho phép nhiều lần, `signup-codes.js:120`): dòng hiện **vàng** kèm nhãn "cài đặt đang cho nhận nhiều lần", không đỏ. Ngày = `claimed_at` / `diem_nhan_luc` lớn nhất của nhóm; vàng nếu `< AP_DUNG_TU.D1`.
- **D2**: không viết phép mới — `I8` đã kiểm đúng "điểm tích theo tiền thực trả lúc mua" ở nghĩa `total` (mục 0.10). Thêm nhãn "D2 — đơn mua thẻ / gói" cho dòng I8 của đơn có món thẻ (`product_id ≤ −1000000`, điều kiện ở `bat_bien.js:265`) hoặc gói (`pos_customer_packages.order_id`), ~8 dòng. Thành thật: D2a–c thử hành vi `I8` hiện có; điều phiếu thật sự hỏi ("tiền thực trả" của đơn còn nợ) phụ thuộc **Câu hỏi 5** — có ca ghi lại hành vi HIỆN TẠI của đơn thẻ còn nợ (điểm theo `total`) để đổi khi chủ quán chốt.

### 1.5 Phần E/F — ô két, đối chiếu tuần/tháng

**Một bảng** `pos_doi_soat_ghi` (cuối `createTables`, trước `:905`), **chỉ thêm dòng, không UPDATE/DELETE**:
`id, loai ('ket'|'sao_ke'), ky (ngày YYYY-MM-DD cho két; THỨ 2 của tuần cho sao kê), so_tien INTEGER NULL, da_so INTEGER NULL, ghi_chu TEXT, nguoi TEXT, luc TEXT` + index `(loai, ky, id)` (index của CHÍNH bảng mới, trong Phạm vi). Dòng mới nhất theo `id` là hiện hành; dòng cũ làm lịch sử. `luc` = `getNow()`.
Validate máy chủ: `ky` đúng dạng, không ở tương lai (VN); sao kê: `ky` phải là thứ 2; két: `Number.isInteger(so_tien)`, `0 ≤ so_tien ≤ TRAN_KET` (hằng số có tên — **ngoài phiếu**, thêm vì số tiền nhập tay cần trần; đề xuất 1.000.000.000); mã lỗi `DOI_SOAT_KY_SAI`, `DOI_SOAT_SO_TIEN_SAI` (400, `{error, code}` — theo `LUAT_XAY_APP.md` §2). Một INSERT đơn lẻ là một giao dịch.

| E: "tiền mặt theo sổ" | **A (chọn tạm)**: đúng câu báo cáo (`reports.js:34` + lọc :41), hàm `tienTheoSo` trong `doiSoat.js`, ca đối chứng với `/daily` | B: cộng nạp ví tiền mặt (`payment_method='cash'`, `wallets.js:136`) và thu nợ tiền mặt theo NGÀY THU (`pos_order_log` loại `thu`), trừ phần thu nợ đã nằm trong `cash_amount` đơn gốc |
|---|---|---|
| dòng | ~12 | ~30 SQL, vẫn gần đúng nếu có "đổi cách trả" (`don-mo-rong.js:133–149`) |
| đúng với két? | **không** (mục 0.7) | gần đúng hơn |

Agent soát đề nghị trích câu SUM ở `reports.js:34–35, :41` thành hàm dùng chung cho cả `/daily` để "cùng hàm" đúng thật. Tôi **không** làm: đó là sửa đường số tiền báo cáo đang chạy thật ở 3 khối (:34, :127, :142) khi chưa cần; thay bằng ca đối chứng E7 (bắt trôi). Nếu chủ quán muốn đúng chữ "cùng hàm" thì ghi lại.
Mặc định A **và hiện cạnh số tiền mặt hai khoản "nạp ví tiền mặt trong ngày" và "thu nợ tiền mặt trong ngày"** (chỉ hiển thị, không cộng vào chênh; **ngoài phiếu**) cho đến khi chủ quán trả lời **Câu hỏi 1**.
- Chênh = `so_dem − tien_mat_theo_so`; `≠ 0` → ĐỎ kèm số; chưa có dòng két → "chưa đếm két" (vàng).
- **F tuần**: `chuyen_khoan` theo sổ của tuần (cùng `tienTheoSo`); dòng `sao_ke` mới nhất: `da_so`, `ghi_chu`; chưa so → vàng "chưa so sao kê".
- **F tháng**: 4 nhóm — tiền mặt, chuyển khoản (`tienTheoSo`), ví (`SUM(balance_amount)` đơn completed — `reports.js:36`), điểm (`SUM(points)` theo `type` trong `pos_point_transactions`) — và dòng nhắc "kiểm kê kho thật" (chữ cố định).

### 1.6 Phần G/H — quyền, hiệu năng

- **G**: hai route mới trong `reports.js` đúng khuôn `authenticate, checkPermission('view_reports')`; màn là tab trong `Reports.jsx` (`Layout.jsx:73` đã ẩn menu theo quyền); nút ghi trong `DoiSoat.jsx` ẩn khi `user` thiếu `view_reports`. Chỉ ẩn nút là phụ; máy chủ kiểm là chính (G1–G4). Ca G5 tĩnh khoá việc ẩn nút bằng cách bắt dấu hiệu `view_reports` trong `DoiSoat.jsx` (marker + mẫu nguy hiểm biến mất, E11–E13) + thử tay.
- **H**: SỬA bản 1 ("tuyến tính theo tổng đơn" sai). Các bất biến tải toàn bảng rồi tính, và nhiều câu con tương quan trên cột KHÔNG có chỉ mục: I8 `pos_point_transactions.order_id`, `pos_signup_codes.order_id` (:126–127; index hiện có chỉ `(customer_phone, expires_at)` — `database.js:362` — và `code`, `claimed_phone` — :1247–:1248); I19 `pos_balance_transactions.order_id` (:313); I15 `pos_order_items.order_id` (:263–:265) — chi phí gần tích N × M. Ca H1 phải dựng N đơn **kèm** dòng điểm, dòng ví, mã bill, món tương ứng (không chỉ đơn), N = 2.000 / 20.000 / 100.000, in thời gian + số câu + số dòng trả về. `< 10 s` trên file cục bộ chỉ là cận dưới; độ trễ Turso CHƯA KIỂM. Nếu chậm: thêm index vào BẢNG CŨ (`database.js`) là **ngoài** "chỉ thêm bảng" của phiếu → phải xin duyệt riêng (**Câu hỏi 8**). Cache kết quả (bản 1 đề xuất ghi vào `pos_doi_soat_ghi`) **bỏ** — dùng bảng sai mục đích.

## 2. Chỉ ĐỌC — cách chứng minh (nghiệm thu A)

- `doiSoat.js` đưa vào bất biến hàm `q` bọc: ném lỗi nếu SQL không bắt đầu `SELECT`/`WITH` (sau khi bỏ khoảng trắng/chú thích).
- Hàm ghi duy nhất là `ghiMoi` (INSERT `pos_doi_soat_ghi`), tách khỏi đường chạy bất biến.
- Bài thử: (1) bọc `db.query/queryOne/run` **TRƯỚC khi `require` doiSoat.js** (nếu `doiSoat.js` destructure lúc nạp, bọc muộn không chặn được) và ghi MỌI câu SQL của một lượt ngày/tuần/tháng → tất cả bắt đầu `SELECT|WITH`; (2) **băm NỘI DUNG** mọi bảng `pos_*` (trừ `pos_doi_soat_ghi`) trước/sau bằng nhau — đếm hàng KHÔNG đủ vì UPDATE không đổi số hàng; (3) tiêm một bất biến giả có `UPDATE` vào danh sách chạy → phải bị ném lỗi và băm không đổi (ca A2b — bắt đột biến bỏ chặn); (4) tĩnh: `doiSoat.js` không chứa `reconcile`, và `INSERT|UPDATE|DELETE` chỉ trong `ghiMoi`.

## 3. Ca thử ↔ nghiệm thu (1-1) — `cong_cu/thu_DOISOAT1.js` (~280 dòng)

Dữ liệu SẠCH dựng bằng route thật (đơn tiền mặt, đơn nợ + thu nợ, đơn huỷ, duyệt hoàn, mua thẻ, mua gói + lấy hàng, đổi điểm lấy quà); lệch cấy bằng UPDATE/INSERT trực tiếp rồi hoàn lại. Giờ giả: bọc `Date`.

| NT | ca | khẳng định |
|---|---|---|
| A | A1 | `doiSoat` chạy đúng `Object.keys(BAT_BIEN)` trừ `I7` (ghi lý do): 17 chạy + 1 bỏ = 18 |
| A | A2 | mọi câu SQL một lượt chạy (ngày/tuần/tháng) bắt đầu `SELECT\|WITH` (bọc trước `require`) |
| A | A2b | bất biến giả có `UPDATE` → bị chặn, nội dung bảng không đổi |
| A | A3 | băm nội dung mọi bảng `pos_*` (trừ bảng mới) trước = sau |
| A | A4 | tĩnh: không `reconcile`; ghi chỉ trong `ghiMoi` |
| A | A5 | `chay.js` và `thu_gia_lap.js` đạt, dòng tổng "Giả lập: N kịch bản · M bất biến" không đổi (số trước/sau ghi vào `bang_chung_do.txt`) |
| B | B0 | **dữ liệu sạch dựng bằng luồng thật (nợ rồi thu sau, huỷ, duyệt hoàn, mua thẻ, mua gói + lấy, đổi điểm) → XANH ở CẢ BA kỳ** ngày / tuần / tháng (mỗi luồng K5 một dòng kiểm riêng) |
| B | B1 | ngày 18.10: chỉ thấy lệch đơn 18.10, không thấy đơn 17.10 |
| B | B2 | tuần: đơn CN 25.10 23:59:59 trong tuần 19→25; đơn T2 26.10 00:00:00 ngoài; tuần vắt sang tháng khác (29.09→05.10) tính đúng |
| B | B3 | tháng 10: 31.10 trong, 01.11 ngoài; tháng 02 của 2028 (nhuận) và 2027 |
| B | B4 | đồng hồ giả 2026-10-18T18:30:00Z (= 01:30 T2 19.10 VN): "hôm nay" = 19.10, tuần = 19→25 (UTC sẽ ra 18.10 / 12→18) |
| B | B5 | lớp 2: lệch I2, I4, I13, I18 ngoài kỳ vẫn hiện, nhãn "toàn sổ" (mỗi bất biến một ca); lớp 3: dòng "loại dòng ví lạ" / "điểm lạ" → ĐỎ ở mọi kỳ |
| C | C1 | lệch ngày `< AP_DUNG_TU` → nhóm vàng, `ket_qua = XANH` |
| C | C2 | cùng lệch ở ngày `=` AP_DUNG_TU → ĐỎ; `−1` ngày → vàng |
| C | C3 | tĩnh: `AP_DUNG_TU` có khoá cho mọi bất biến chạy (trừ I7) hoặc `null` có lý do |
| C | C4 | MỖI bất biến lớp 1–2 (≈ 16): cấy lệch → dòng phân giải ra ngày (không rơi "không rõ ngày"), kể cả đơn đã xoá cho I9, I11 |
| C | C5 | dòng không phân giải được ngày → ĐỎ ở mọi kỳ |
| D | D1a | SĐT 2 dòng `claimed_phone` ngày ≥ P20c → ĐỎ; ngày < → vàng |
| D | D1b | `diem_nhan_phone` ×2, `nhandiem_chi_lan_dau` ≠ '0' → ĐỎ; `= '0'` → vàng kèm nhãn (không đỏ) |
| D | D2a | mua thẻ 500.000 → 500 điểm XANH; cấy 600 → ĐỎ "đơn X: 600 điểm, đúng luật là 500" |
| D | D2b | đơn lấy-từ-gói (total 0) có 5 điểm → ĐỎ |
| D | D2c | mua gói rồi lấy ngay: điểm theo tiền mua, không cộng thêm → XANH |
| D | D2d | đơn thẻ còn nợ: điểm theo `total` hiện tại → XANH (ghi lại hành vi hiện tại; đổi khi Câu hỏi 5 có đáp) |
| E | E1 | chưa đếm → "chưa đếm két", XANH |
| E | E2 | đếm = sổ → chênh 0, XANH |
| E | E3 | đếm = sổ + 1 → ĐỎ đúng "+1" và tiền mặt theo sổ |
| E | E3b | **dựng nạp ví tiền mặt + thu nợ ngày sau**: màn hiện hai khoản "ngoài sổ" đúng số (ghi lại sự lệch của A so với két thật, Câu hỏi 1) |
| E | E4 | ghi lần 2 → 2 dòng, cột `nguoi` và `luc` có giá trị, màn lấy dòng mới, không có UPDATE |
| E | E5 | số âm, lẻ (`100.5`), chuỗi, `TRAN_KET+1` → 400 `DOI_SOAT_SO_TIEN_SAI`; `0` và `TRAN_KET` → 201 |
| E | E6 | ngày tương lai / sai dạng → 400 `DOI_SOAT_KY_SAI` |
| E | E7 | `tienTheoSo(ngày)` = `order_stats.cash_revenue` của `/reports/daily?date=` cùng ngày; ca tương tự cho khoảng tuần với `/sales` |
| F | F1 | tuần: tổng CK = tổng `transfer_amount` đơn completed trong tuần (seed 3 đơn) |
| F | F2 | chưa so → vàng, không đỏ; đánh dấu "đã so" + ghi chú; lần 2 thêm dòng, hiện dòng mới; `ky` không phải thứ 2 → 400 |
| F | F3 | tháng: 4 nhóm đúng GIÁ TRỊ (tiền mặt, CK, ví = `SUM(balance_amount)`, điểm = `SUM(points)` theo loại) + dòng nhắc kiểm kê kho, không số kho |
| G | G1–G4 | staff GET+POST → 403; manager → 200/201; không token → 401; owner → 200 |
| G | G5 | tĩnh: `DoiSoat.jsx` ẩn nút ghi theo `view_reports` (marker) |
| H | H1 | N đơn **kèm** dòng điểm / ví / mã bill / món: in thời gian + số câu + số dòng; `< 10 s` trên kho cục bộ (cận dưới) |
| I | — | bộ này + `dot_bien.py` (mục 6) |

## 4. Đường song song cần canh (K4)

- Mọi chỗ tính tiền mặt/CK theo ngày: `reports.js:34–35`, `:127–128`, `:142–143` (3 khối cùng khuôn `SUM(CASE … cash_amount)`) — `tienTheoSo` là bản thứ tư; E7 canh.
- Mọi chỗ tính "hôm nay"/tuần bằng UTC: `Reports.jsx:11` (Phát hiện). `DoiSoat.jsx` lấy "hôm nay" từ máy chủ.
- Tám dòng `ctx.` (mục 0.2) — nhánh `ctx.thuc` phải phủ CẢ tám (I7 bỏ nguyên hàm; I9: :160, :165, :172; I13: :227; I14: :242).
- `fetch` trần: `DoiSoat.jsx` chỉ gọi qua `utils/api.js` (`api.get/post` — `api.js:175/179`), bánh cóc `NGUONG_FETCH`.
- Đăng ký màn mới: build `client/dist` (P1) rồi `--day-du`.

## 5. Luồng hợp lệ PHẢI KHÔNG đỏ oan / không bị chặn (K5) — mỗi dòng gắn ca

1. đơn tiền mặt bình thường → B0
2. đơn nợ rồi thu sau bằng `pay-debt` → B0 (I6, I9 vế `debt_payment`)
3. huỷ đơn / duyệt hoàn → B0 (I11, I17, I19)
4. mua thẻ → điểm `floor(total/per)`; mua gói + lấy ngay → B0, D2a, D2c
5. đổi điểm lấy quà → B0 (I8 vế đổi, I12)
6. mã bill dùng đúng một lần; `nhandiem_chi_lan_dau='0'` nhận điểm nhiều lần → D1b (vàng, không đỏ)
7. ngày không có đơn → E1, B0
8. manager xem + ghi két; owner luôn qua → G2, G4
9. lệch CŨ trước ngày áp dụng → C1
10. tuần vắt sang tháng khác / năm nhuận → B2, B3

## 6. Đột biến — `viec/DOI-SOAT-1/dot_bien.py` (mỗi dòng `('<tên>', …)`, tên là NGUYÊN chuỗi đầu)

| tên | chỗ vá | đột biến | ca phải đỏ |
|---|---|---|---|
| `BV-DS-BO-BAT-BIEN` | danh sách chạy | bỏ một bất biến (I6) khỏi vòng chạy | A1 + ca cấy lệch I6 |
| `BV-DS-BO-LOC-KY` | lọc kỳ | bỏ lọc theo khoảng | B1, B2, B3 |
| `VS-DS-GIO-UTC` | "hôm nay"/tuần | `new Date().toISOString()` thay `getToday()` | B4 |
| `VS-DS-TUAN-CN` | tuần | bắt đầu tuần CN thay thứ 2 | B2 |
| `BV-DS-BO-QUYEN-GET`, `BV-DS-BO-QUYEN-POST` | route | bỏ `checkPermission('view_reports')` mỗi route | G1 |
| `BV-DS-BO-AP-DUNG-TU` | nhóm vàng | mọi lệch đều đỏ | C1 |
| `VS-DS-AP-DUNG-NGUOC` | nhóm vàng | `<=` thay `<` | C2 |
| `BV-DS-AN-KHONG-RO-NGAY` | fail-safe | dòng không rõ ngày bị loại | C5 |
| `VS-DS-GHI-DE` | `ghiMoi` | `UPDATE` thay `INSERT` | E4 |
| `BV-DS-BO-KIEM-SO-TIEN` | validate | bỏ kiểm số nguyên / trần | E5 |
| `BV-DS-GHI-DUOC` | q bọc | bỏ chặn không-SELECT | **A2b** (tiêm bất biến giả có UPDATE) |
| `VS-DS-TIEN-MAT-NGAY-TAO` | `tienTheoSo` | đổi lọc ngày | E7 |
| `BV-DS-D1-BO-DIEM-NHAN` | D1 | chỉ đếm `claimed_phone` | D1b |
| `VS-DS-D1-VANG-NGUOC` | D1 | vàng/đỏ đảo nhánh `chi_lan_dau` | D1b |
| `BV-DS-F-BO-DA-SO` | F | bỏ đọc dòng `sao_ke` mới nhất | F2 |
| `VS-DS-F-THANG-NHOM` | F | tháng đổi `SUM(points)` thành `COUNT` | F3 |
| `BV-DS-THUC-I13` | `ctx.thuc` | bỏ nhánh `ctx.thuc` ở I13 | B0 (đỏ oan) |

Mỗi đột biến chạy được TỪNG TÊN, có ĐỐI CHỨNG (bản chưa đột biến xanh), bài sập ≠ BẮT (TOC-DO-1). Nạp theo khuôn `viec/LUOI-3/dot_bien.py` (`sys.dont_write_bytecode = True`). Sau khi sửa `bat_bien.js` chạy `python3 viec/HOC-2b/kiem_neo.py` (và `AUDIT-2/3/4`) trên HEAD để chắc 31 neo cũ còn khớp.

## 7. Ngân sách

| file | dòng thêm |
|---|---|
| `server/utils/doiSoat.js` (mới) | ~170 (khoá→ngày theo bất biến ~35, AP_DUNG_TU ~20, D1 ~12, tienTheoSo ~12, kỳ ~15, q bọc + ghiMoi ~20…) |
| `server/routes/reports.js` | ~55 (2 route) |
| `server/database.js` | ~12 |
| `cong_cu/gia_lap/bat_bien.js` | ~8 |
| `client/src/components/DoiSoat.jsx` (mới) | ~150 |
| `client/src/pages/Reports.jsx` | ~8 |
| `kiem_tra_truoc_khi_giao.js` | 1 dòng gọi bài |
| **tổng code** | **~400** — vượt ~300 của phiếu ~30 % |
| `cong_cu/thu_DOISOAT1.js` | ~280 |

Cách cắt về ~300: bỏ nhãn D2 (−8), bỏ hai khoản "ngoài sổ" hiển thị (−15), gộp tuần/tháng thành một khối (−25), bỏ lịch sử trong màn (−20), bỏ nhãn "rút gọn" từng dòng (−10).

## 8. CHƯA KIỂM (nói thẳng)

- **Dữ liệu thật / Turso**: không có trong máy mây → chưa biết bất biến nào ĐỎ trên dữ liệu cũ; `AP_DUNG_TU` mới là đề xuất; độ trễ mạng của ~35 câu và chi phí tích N × M trên Turso.
- **Ngày gộp ≠ ngày deploy**; commit trong sổ không đối chiếu được (kho nông).
- Chênh két phụ thuộc Câu hỏi 1.
- Đỏ oan đã biết (mục 1.1) có thể còn nhiều hơn khi chạy bản sao thật.
- Cột ngày của yêu cầu hoàn / quà / mã giảm chưa đọc (`?` ở 1.2).
- Giao diện: không có điện thoại; sẽ ghi 1–3 thao tác thử tay ở `trang_thai.md`.
- `I7` (SX) không chạy trên dữ liệu thật.

## 9. Câu hỏi cho chủ quán (cũng ghi ở `trang_thai.md`)

1. **Tiền mặt theo sổ của ngày**: (A) đúng con số báo cáo hiện có (`reports.js:34`), hay (B) cộng nạp ví tiền mặt + thu nợ tiền mặt đúng ngày thu? Số két đếm có gồm **tiền để lại từ hôm trước** không (nếu có, chênh luôn lệch một khoản cố định)? Gợi ý: một ô "tiền mặt thu được trong ngày = két cuối ngày − tiền để lại đầu ngày".
2. **Ngày áp dụng**: bảng 1.3 đúng chưa; "ngày gộp + 1"; ai chạy bất biến trên BẢN SAO dữ liệu thật để chốt `I3, I6, I12, I15, I16` và ví lệch cũ (I4/I18)?
3. **Vị trí lõi bất biến**: duyệt A (server nạp thẳng `cong_cu/gia_lap/bat_bien.js`)? Nếu không, phải mở việc riêng chuyển sang `server/utils/` (cập nhật 31 neo; phiếu này không cho sửa `kiem_tra:886`).
4. **Rút gọn / bỏ + đỏ oan đã biết**: chấp nhận I7 bỏ, I9/I13/I14 rút gọn, và các dòng so với cài đặt hiện tại (I8, I12, I13, I14 — mục 1.1) hiện ĐỎ kèm nhãn "có thể oan"? Hay thêm nhóm "cần xem" riêng (phiếu chỉ có đỏ / vàng)?
5. **D2**: giữ `điểm = floor(total / per)` như `I8`, hay "tiền thực trả" = `total − nợ`?
6. Chênh két `≠ 0` → ĐỎ ngay, không ngưỡng (đúng phiếu) — chắc chưa?
7. Ngân sách ~400 dòng vượt ~300: cắt (mục 7) hay chấp nhận?
8. Nếu đo thấy chậm: cho thêm index vào bảng cũ (`order_id` của điểm, ví, mã bill, món) trong `database.js` — ngoài "chỉ thêm bảng" của phiếu?

## 10. Phát hiện ngoài Phạm vi (không sửa)

- `Reports.jsx:11` mặc định "hôm nay" theo UTC → 0:00–7:00 sáng VN tab Ngày hiện hôm qua.
- Báo cáo ngày (`reports.js:34`) tính thu nợ vào NGÀY TẠO đơn (mục 0.7): doanh thu tiền mặt của ngày cũ đổi về sau.
- Chú thích `bat_bien.js:217` ghi "orders.js:450" — dòng đó nay là `sx_product_id: null` (agent soát) → chú thích lệch số dòng (K1 TU-CHAY-6), sửa khi có việc chạm `bat_bien.js`.
- Hướng phụ thuộc ngược `server/ → cong_cu/` nếu chọn phương án A (1.1).
