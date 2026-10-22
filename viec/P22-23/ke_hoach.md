# P22-23 — kế hoạch (chờ chủ quán duyệt)

Nền: `97324a8` (PHIEU: P22-23) trên `fabe583`. Mọi số dòng dưới đây đọc trong lượt này (22.10), sẽ trôi khi sửa.

## 0. Code hiện tại — đọc trong lượt này

| Điều | Chỗ đọc |
|---|---|
| Trạng thái tiền của đơn mới CHỈ do `debt_amount > 0` quyết (`finalPaymentStatus`), không tin `payment_status` máy khách gửi | orders.js:779-789 |
| Khối LOY-1 cộng điểm cho MỌI đơn có SĐT, total > 0, không flash — không xét đã thu | orders.js:820-855 (chuẩn bị), 1051-1065 (ghi `earn` trong tx, bọc try/catch) |
| `pay-debt` không cộng điểm; chặn thu hai lần bằng `WHERE … debt_amount = ? AND payment_status != 'paid'` + `changes !== 1` → 409 `DA_THU_ROI` | orders.js:1239-1385 (UPDATE ở 1308-1319) |
| Đường DUY NHẤT chuyển đơn thành `paid` sau lúc tạo là `pay-debt` (grep `payment_status = ?` / `debt_amount =` trong `server/`: chỉ orders.js:1309) | grep trong lượt này |
| Cổng mua gói / thẻ đầu `POST /`: thiếu thông tin → 400 `GOI_MUA_THIEU_THONG_TIN` / `THE_MUA_THIEU_THONG_TIN`; KHÔNG xét nợ | orders.js:188-208 |
| Hệ số nhân điểm: chỗ in bill `Number(c.nhandiem_he_so) \|\| 2` (0.5 → in "gấp 0.5"), `nhandiem_enabled === '1'`, `Number(han_gio) \|\| 24`; `/nhan-diem` dùng `docCauHinhNhanDiem`: `heSo >= 1 ? heSo : 2`, bật khi `'1'` hoặc `'true'`, `hanGio > 0 ? : 24` → lệch cả ba | orders.js:1197-1220; signup-codes.js:115-128 |
| `/nhan-diem` KHÔNG xét Flash: đơn Flash (lúc bán 0 điểm) nhận mã → cộng `round(g × k)` | signup-codes.js:203-238 |
| **E(3): `/nhan-diem` ĐÃ chặn bill chưa thu đủ** — `kiemDonCuaMa` (danh sách trắng `completed` + `paid`) gọi trước mọi lệnh ghi → 400 `BILL_CHUA_THANH_TOAN`. Kịch bản KB7 của giả lập canh (kich_ban.js:141-145). → **không cần hỏi, không đổi** | signup-codes.js:44-70, 196-199 |
| orders.js đã nạp `kiemDonCuaMa` từ signup-codes.js (khuôn export có sẵn) | orders.js:32; signup-codes.js cuối file |
| I8 tính "lúc bán có điểm" không xét `payment_status`; đơn Flash có nhận mã → `round(g × k)` | bat_bien.js:118-135 |
| Đối soát thật gọi CÙNG `bat_bien.js` với `ctx.thuc = true`; dòng lệch trước `AP_DUNG_TU.I8 = '2026-10-03'` thành "LỆCH CŨ" (vàng) theo ngày sự việc MỚI NHẤT của đơn | doiSoat.js:15, 33-36, 150-166, 227 |
| Huỷ đơn KHÔNG đổi `payment_status` (grep) → đơn huỷ giữ trạng thái tiền lúc huỷ | grep orders.js |

## 1. Từng phần — phương án A / B

### P1. Cổng D: mua gói / thẻ mà chưa thu đủ → 400 (orders.js, đầu `POST /`)
- **A (chọn)** — một `if` ngay sau cổng SO-LUONG-1 (~orders.js:208):
  `if ((package_buy || membership_buy) && debt_amount > 0) return 400 { error: 'Mua gói / thẻ hội viên phải thu đủ tiền — không ghi nợ, không để chưa thu', code: 'GOI_THE_CHUA_THU_DU' }`.
  Vị từ `debt_amount > 0` là ĐÚNG biểu thức quyết `finalPaymentStatus` ở orders.js:783 (cùng biến, chưa bị gán lại) — K4 "một vị từ".
  Đứng trước mọi lệnh đọc / ghi → không đơn, không gói, không ví, không kho. 1 file, ~4 dòng. Rủi ro: ai đó đổi luật ở :783 mà quên cổng này
  → ca D3b (máy khách nói dối `payment_status: 'paid'` kèm nợ) + đột biến VS canh.
- B — đặt cổng sau khi tính `finalPaymentStatus` (`finalPaymentStatus !== 'paid'`, ~:790). Dùng đúng một biến, nhưng nằm sau ~600 dòng đọc
  (giá, voucher, flash, ví) và ngoài vùng "cổng đầu" phiếu cho phép. ~4 dòng. Không chọn vì phiếu khoanh vùng sửa.
- Ghi chú K5: `membership_buy`/`package_buy` = `{}` đã bị cổng trước chặn (400 THIẾU THÔNG TIN) — thứ tự không đổi.

### P2. Điểm lúc tạo đơn chỉ khi thu đủ + MỘT hàm tính điểm (orders.js, khối LOY-1)
- **A (chọn)** — tách phần tính điểm + hạn (orders.js:829-850) thành hàm `tinhDiemDon(tong, luc)` đặt trong orders.js (trên `POST /`),
  trả `{ diem, han }` hoặc `null` (tắt / per sai / 0 điểm); đọc `pos_settings` mỗi lần gọi (= cài đặt LÚC GỌI). Khối LOY-1 gọi hàm khi
  `phone && finalPaymentStatus === 'paid' && !flashApplied`. Giữ nguyên try/catch quanh lời gọi và nguyên câu INSERT `earn` lúc tạo
  (số điểm, hạn, `reason`, `created_by` không đổi — nghiệm thu A). ~25 dòng chuyển chỗ + ~6 dòng mới.
- B — thêm `&& finalPaymentStatus === 'paid'` (1 dòng) và CHÉP công thức sang `pay-debt` (~25 dòng chép). Ít dòng hơn ở P2 nhưng hai
  bản công thức (trái LUAT_XAY_APP §2 "một quy tắc — một hàm", K4). Không chọn.
- Không export hàm sang signup-codes.js (signup-codes.js bị orders.js nạp → nạp ngược là vòng tròn). Bản chép thứ ba của công thức hạn
  quý trong signup-codes.js:248-255 → ghi Phát hiện, không sửa (ngoài nghiệm thu).

### P3. `pay-debt` cộng điểm khi thu đủ (orders.js)
- **A (chọn)** — NGOÀI tx (cùng khuôn LOY-1, trước `beginTransaction`): nếu `newPaymentStatus === 'paid' && order.customer_phone &&
  !(Number(order.flash_discount) > 0)` thì `diemThu = await tinhDiemDon(order.total, now)` trong try/catch (lỗi → bỏ điểm, vẫn thu).
  TRONG tx, ngay sau UPDATE đơn đạt `changes === 1` và trước commit, bọc try/catch như LOY-1:
  ```sql
  INSERT INTO pos_point_transactions (customer_phone, type, points, order_id, expires_at, reason, created_by, created_at)
  SELECT ?, 'earn', ?, ?, ?, ?, ?, ?
  WHERE NOT EXISTS (SELECT 1 FROM pos_point_transactions WHERE order_id = ? AND type = 'earn')
  ```
  `changes === 0` → log "đã có điểm" (đơn CŨ đã cộng lúc tạo theo luật cũ — không cộng đôi). `reason` = `Tích điểm đơn <mã>` như lúc tạo.
  Chặn đua hai tầng: (1) UPDATE đơn có sẵn chỉ một lần thu được chuyển `paid` (nợ chia hai lần: lần thu nào khớp `debt_amount` cũ mới ghi);
  (2) `NOT EXISTS` trong CÙNG câu ghi điểm. ~22 dòng. Câu UPDATE và `changes !== 1` giữ NGUYÊN chữ (phép E7 của bộ kiểm + neo M1/M6/M8
  của `thu_gia_lap.js` đang neo chuỗi đó).
- B — ghi điểm SAU commit thu (ngoài tx). Ngắn hơn ~3 dòng nhưng trái nghiệm thu C ("CÙNG giao dịch"). Không chọn.
- Phản hồi `pay-debt` không thêm trường (không đổi client).

### P4. `/nhan-diem`: Flash 0 điểm + hệ số một hàm (signup-codes.js, orders.js chỗ in mã)
- E(1) **A (chọn)** — `kiemDonCuaMa` đọc thêm cột `flash_discount` (hàm dùng chung cho /claim + voucher mã bill — thêm cột chỉ đọc, không đổi
  hành vi hai đường kia); trong `nhanDiemMaBill` ngay sau `billSdtKhac`: `Number(don.flash_discount) > 0` → 400
  `{ error: 'Đơn có giảm Flash sale không được cộng điểm.', code: 'DON_FLASH_KHONG_DIEM' }` — TRƯỚC câu chiếm mã, nên mã KHÔNG bị tiêu
  (khách vẫn đổi voucher qua /claim được nếu bật). /api/kh/nhan-diem gọi CÙNG hàm → được luôn. ~4 dòng.
  B — chiếm mã rồi cộng 0 điểm (trả 200 `diem_cong: 0`): tiêu mã của khách vô ích, ~6 dòng. Không chọn.
- E(2) **A (chọn)** — export `docCauHinhNhanDiem` (dòng `module.exports.… =` như 3 dòng sẵn có); khối in bill orders.js:1197-1220 lấy
  `bat`, `heSo`, `hanGio` từ hàm đó (chỉ còn đọc riêng `signup_enabled`). Hệ số 0.5 / 0 / âm → cả bill lẫn /nhan-diem cùng 2. ~-8 +6 dòng.
  B — chép điều kiện `>= 1 ? : 2` sang orders.js: 1 dòng nhưng vẫn hai chỗ (đúng cái phiếu bảo bỏ). Không chọn.
  Kéo theo (cùng một hàm nên tự hết lệch): bill in "Mã nhận điểm" khi `nhandiem_enabled = 'true'` (trước chỉ `'1'`), hạn giờ âm → 24.
- E(3) — không đổi (mục 0). Không có `## Câu hỏi`.

### P5. Bất biến I8 (bat_bien.js) + mốc dữ liệu cũ
Luật mới, g = floor(total/per), k = hệ số (`>= 1 ? : 2`, như cũ):
- `coDiem` = `loyalty_enabled === 'true'` · có SĐT · total > 0 · flash = 0 · g > 0 · **`payment_status = 'paid'`** (thêm vế này; SELECT thêm cột).
- đã nhận mã: flash > 0 → **0** (mới, E1); `coDiem` → `g + round(g × (k − 1))`; không → `round(g × k)`.
- chưa nhận mã: `coDiem ? g : 0`. Đơn huỷ / hoàn: không vế riêng — giữ trạng thái tiền lúc huỷ (huỷ không đổi `payment_status`) = như hiện tại.
- **Mốc** — hằng `DIEM_KHI_THU_TU` (chuỗi ngày, đặt cạnh `LOAI_TINH_VAO_VI`). CHỈ khi `ctx.thuc` (Đối soát trên dữ liệu thật) và
  `created_at < mốc`: đơn đạt nếu khớp luật MỚI **hoặc** luật CŨ (bản I8 hiện tại). Từ mốc trở đi, và MỌI đơn trong giả lập
  (`ctx.thuc` không có — kho tạm tạo đơn bằng giờ thật nên mốc theo ngày sẽ làm giả lập không bao giờ thử luật mới): chỉ luật MỚI.
  Vì sao "hoặc" chứ không "luật cũ": nếu gộp sớm hơn mốc, đơn tạo bằng code mới trước mốc không bị đỏ oan; nếu gộp muộn hơn mốc thì
  chủ quán dời mốc (một chỗ). Hai luật chỉ khác nhau ở đơn CHƯA thu đủ (cũ g, mới 0) và đơn Flash có nhận mã → "hoặc" chỉ nới đúng
  hai vế đó cho đơn cũ. Không migrate, không xoá dòng điểm cũ.
- **Giá trị mốc đề xuất: ngày gộp PR + 1** (khuôn `AP_DUNG_TU` của doiSoat.js). Máy ghi `'2026-10-24'` (giả định gộp 23.10); chủ quán /
  chat soát sửa đúng ngày lúc duyệt PR — **xin chủ quán duyệt cách làm này cùng kế hoạch**.
- Không sửa doiSoat.js (ngoài Phạm vi): `AP_DUNG_TU.I8` giữ '2026-10-03'; phần dữ liệu cũ đã xử lý trong I8.
- Ghi chú đầu file: thay đoạn "đơn chưa thu và đơn đã huỷ VẪN giữ điểm" bằng luật mới + mốc; giữ dặn P24 phải sửa I8. Bỏ số dòng cứng trong
  chú thích I8 (thay bằng tên hàm). ~20 dòng.
- B — bỏ mốc, luôn chấp nhận "mới hoặc cũ": ~3 dòng ít hơn nhưng giả lập không còn bắt "đơn chưa thu có điểm". Không chọn.

### P6. kich_ban.js
Không cần đổi: giả lập đã bật điểm (per 10.000), có đơn nợ có SĐT thu một phần rồi đủ (nợ mẫu KH.no + KB4 — I8 canh điểm lúc thu đủ),
đơn nợ để nguyên chưa thu (KB31 — I8 canh 0 điểm), đơn mua gói / thẻ đều trả đủ (grep `package_buy|membership_buy` trong kich_ban.js:
158, 428, 471, 484, 607, 615, 623, 672 — không cái nào ghi nợ). Nếu giả lập trên bản vá báo lệch → sửa kịch bản điểm/nợ và ghi lý do.

### P7. Bài thử cũ trong Phạm vi (chỉ chỗ canh luật CŨ — chạy cả bộ trên bản vá để tìm hết, ghi từng chỗ vào trang_thai.md)
Đã thấy bằng grep (`(package_buy|membership_buy|muaGoi).*(debt_amount|cho_thu)` khắp `cong_cu/`):
- `thu_DOISOAT1.js:468-471` D2d "đơn thẻ còn nợ: điểm theo total" → đổi thành: mua thẻ ghi nợ → 400 `GOI_THE_CHUA_THU_DU`, không đơn.
- `thu_P26c.js:778-783` L6a (hoàn đơn mua gói trừ phần còn nợ — `soTienHoan`) — luồng nay KHÔNG tạo được qua API, nhưng dữ liệu CŨ trên
  production có thể còn. GIỮ ca: tạo đơn mua gói trả đủ qua API rồi `UPDATE pos_orders` về dạng cũ (tiền mặt 100.000 + nợ 200.000, pending)
  — vẫn canh `soTienHoan` trừ nợ; thêm L6b: cùng yêu cầu gửi API → 400 `GOI_THE_CHUA_THU_DU`.
- `thu_gia_lap.js` KHUNG.I8 (bảng `pos_orders` tay không có `payment_status`) → thêm cột (mặc định 'paid' cho ca sạch); thêm ca I8:
  đơn pending có `earn` → lệch; đơn paid thiếu `earn` → lệch; đơn Flash đã nhận mã có điểm → lệch; `ctx.thuc` + đơn trước mốc theo luật cũ →
  KHÔNG lệch (K5), cùng đơn sau mốc → lệch. Thêm đột biến giả lập (mảng `DOT_BIEN`): "pay-debt bỏ cộng điểm" → KB4 → I8;
  "tạo đơn bỏ điều kiện thu đủ" → KB31 → I8.
- `thu_KH1.js`, `thu_P20.js`: grep chỉ thấy đơn đã thu → dự kiến không đổi; xác nhận bằng chạy.
- Bài NGOÀI Phạm vi mà đỏ trên bản vá → không sửa, ghi `## Câu hỏi` và dừng.

### P8. kiem_tra_truoc_khi_giao.js
Chỉ thêm `'cong_cu/thu_P2223.js'` vào mảng bài chạy thật (dòng 495). 1 dòng.

## 2. Ngân sách ước lượng
orders.js ~+45 / −30 (≤ 80 đổi) · signup-codes.js ~+6 · bat_bien.js ~20 · kich_ban.js 0 · thu_P2223.js ~250 · bài cũ ~40 · kiem_tra 1.

## 3. Ca thử `cong_cu/thu_P2223.js` — ánh xạ 1-1 với Nghiệm thu
Khuôn `thu_P26c.js`: database.js + libsql thật trên kho tạm, SX giả, công tắc `co.mocTruocTx` (chen lệnh trước tx) và `co.nemGhi` (ném lỗi
ở câu ghi khớp mẫu). Cài đặt: `loyalty_enabled = 'true'`, per 1.000. So status / code / số dòng sổ — không dò chữ (E12) trừ chữ bill ở E2.

| Ca | Nghiệm thu | Nội dung | Gốc |
|---|---|---|---|
| A1 | A (K5) | tiền mặt đủ, có SĐT → đúng 1 `earn`, điểm = floor(total/per), `reason`, `expires_at` NULL | xanh |
| A2 | A (K5) | chuyển khoản đủ, chế độ hạn `quarter` → `expires_at` = đầu quý năm sau | xanh |
| A3 | A (K5) | trả đủ bằng ví → 1 `earn` | xanh |
| B1 | B | chờ thu (`cho_thu`, nợ = total) có SĐT → 0 `earn` | **ĐỎ** |
| B2 | B | ghi nợ (pending) → 0 `earn` | **ĐỎ** |
| B3 | B | ví một phần + nợ (partial) → 0 `earn` | **ĐỎ** |
| B4 | B | máy khách nói dối `payment_status: 'paid'` kèm nợ → vẫn 0 `earn` (đơn pending) | **ĐỎ** |
| C1 | C | đơn nợ, đổi per 1.000 → 2.000 rồi thu đủ → 1 `earn` = floor(total/2000) (cài đặt LÚC THU), hạn theo giờ thu; cùng lúc có `debt_payment` + nhật ký `thu` | **ĐỎ** |
| C2 | C | thu một phần → 0 `earn`; thu nốt → 1 `earn` | **ĐỎ** |
| C3 | C | đơn Flash ghi nợ → thu đủ → 0 `earn` | xanh (hồi quy, đột biến canh) |
| C4 | C | `co.nemGhi = /INSERT INTO pos_point_transactions/` → thu vẫn 200 `paid`, có `debt_payment` + nhật ký, 0 `earn` | xanh trên gốc (gốc không ghi điểm) — đột biến canh |
| C5 | C | dữ liệu CŨ: đơn nợ đã có `earn` (chèn tay) → thu đủ → vẫn đúng 1 `earn` | xanh trên gốc — đột biến canh |
| C6 | C (K5) | đơn nợ không SĐT → thu đủ 200, 0 `earn` | xanh |
| C7 | C | tắt điểm lúc thu → 0 `earn` | xanh |
| D1 | D | `package_buy` + ghi nợ → 400 `GOI_THE_CHUA_THU_DU`; số đơn, gói khách, dòng ví, số dư, lệnh SX giả không đổi | **ĐỎ** |
| D2 | D | `membership_buy` + chờ thu → 400, không đơn, không dòng mua thẻ | **ĐỎ** |
| D3 | D | `package_buy` + ví một phần + nợ → 400, ví không bị trừ | **ĐỎ** |
| D3b | D | `membership_buy` + nợ + máy khách gửi `payment_status: 'paid'` → 400 | **ĐỎ** |
| D4 | D (K5) | mua gói trả đủ tiền mặt → 200, có gói | xanh |
| D5 | D (K5) | mua thẻ trả đủ bằng ví → 200, có dòng mua thẻ | xanh |
| D6 | D (K5) | lấy từ gói cũ (`customer_package_id` + món `from_package`) kèm món lẻ ghi nợ → 200 | xanh |
| D7 | D (K5) | đơn thường ghi nợ không gói / thẻ → 200 pending | xanh |
| E1 | E(1) | đơn Flash đã thu, `/nhan-diem` → 400 `DON_FLASH_KHONG_DIEM`, 0 `earn`, `diem_nhan_luc` vẫn NULL | **ĐỎ** |
| E1b | E(1) (K5) | đơn thường đã thu, `/nhan-diem` → 200, điểm = g + round(g×(k−1)) | xanh |
| E2 | E(2) | `nhandiem_he_so = 0.5`: bill (`signup_loi`) nói gấp 2 VÀ `/nhan-diem` cộng theo hệ số 2 — hai chỗ cùng một số | **ĐỎ** (bill in 0.5) |
| E2b | E(2) (K5) | hệ số 3 → cả hai chỗ 3 | xanh |
| E3 | E(3) | bill chưa thu → `/nhan-diem` 400 `BILL_CHUA_THANH_TOAN` (hồi quy hành vi có sẵn) | xanh |
| F1 | F | chạy `BAT_BIEN.I8` trên kho tạm sau các ca trên → 0 lệch | **ĐỎ** (I8 cũ đòi điểm cho đơn chưa thu) |
| F2 | F | `ctx.thuc`, đơn tạo trước mốc, chưa thu, có `earn` (dữ liệu cũ) → KHÔNG lệch; cùng đơn đổi `created_at` sau mốc → lệch | **ĐỎ** |
| G1 | G | `co.mocTruocTx`: hai lệnh thu đủ chồng nhau → một 200, một 409 `DA_THU_ROI`, đúng 1 `earn` | **ĐỎ** (gốc 0 `earn`) |
| G2 | G | nợ chia hai lần: thu một phần chồng thu đủ → bên kia 409, tối đa 1 `earn`, đúng bằng 1 nếu đơn `paid` | **ĐỎ** |
| G3 | G | thu lần hai khi đã `paid` → 400 `DA_THU_ROI`, số `earn` không đổi | xanh |

Thêm I8 trong `thu_gia_lap.js` (P7) và kịch bản giả lập (P6) canh F trên luồng đầy đủ.

## 4. Đường song song cần canh (K4)
- Mọi đường chuyển đơn sang `paid`: chỉ `pay-debt` (mục 0). Đổi cách trả (`don-mo-rong.js`) chỉ chạy khi đã `paid` — không cộng điểm.
- Mọi đường ghi `earn`: LOY-1 lúc tạo, `pay-debt` (mới), `/nhan-diem` (+ /api/kh/nhan-diem gọi cùng hàm). Cả ba đều xét Flash sau việc này.
- Mọi đường đọc hệ số nhân điểm: chỗ in bill orders.js, `docCauHinhNhanDiem`, I8 (`>= 1 ? : 2` — đã khớp). Grep `nhandiem_he_so` toàn `server/` lúc vá.
- Mọi đường tạo gói / thẻ: chỉ `POST /orders` (khối P26d trong tx). Grep `INSERT INTO pos_customer_packages` / `pos_membership_purchases` lúc vá.

## 5. Luồng hợp lệ KHÔNG bị chặn (K5) — mỗi luồng một ca
Đơn thu đủ có SĐT (A1–A3) · đơn nợ thường (D7) · lấy từ gói cũ kèm nợ (D6) · mua gói / thẻ trả đủ tiền mặt / ví (D4, D5) · thu đủ đơn không
SĐT (C6) · nhận điểm đơn thường (E1b) · dữ liệu cũ đã có `earn` khi thu (C5) · Đối soát dữ liệu cũ trước mốc (F2) · gói mua kèm lấy ngay trả đủ
(thu_P26c I3 sẵn có).

## 6. Đột biến dự kiến (`viec/P22-23/dot_bien.py`)
`BV-cong-goi-the` (gỡ cổng D → D1) · `VS-cong-chi-goi` (cổng chỉ xét `package_buy` → D2) · `VS-cong-tin-may-khach` (cổng xét `payment_status`
máy khách → D3b) · `BV-diem-tao-bo-dk-thu` (gỡ vế thu đủ ở LOY-1 → B1) · `VS-diem-tao-tin-may-khach` (vế xét `payment_status` máy khách → B4) ·
`BV-pay-debt-diem` (gỡ ghi điểm → C1) · `VS-pay-debt-ca-partial` (cộng cả khi partial → C2) · `VS-pay-debt-bo-flash` (→ C3) ·
`VS-pay-debt-khong-boc` (gỡ try/catch → C4) · `VS-pay-debt-bo-not-exists` (→ C5) · `VS-pay-debt-cai-dat-luc-tao` (dùng điểm tính sẵn
theo per cũ — nếu dựng được tất định, không thì ghi CHƯA KIỂM) · `BV-nhan-diem-flash` (→ E1) · `VS-he-so-bill-cu` (bill về `|| 2` → E2) ·
`BV-I8-dk-thu` / `VS-I8-moc-ca-gia-lap` (mốc áp cả khi không `ctx.thuc` → F1 / giả lập). Mỗi đột biến có đối chứng (bản chưa đột biến xanh).

## 7. Chưa kiểm được (biết trước)
- Dữ liệu production: bao nhiêu đơn cũ chưa thu đã có `earn`, có đơn mua gói / thẻ còn nợ hay không — máy không đọc được Turso.
- Hành vi try/catch quanh câu ghi điểm TRONG giao dịch Turso thật (câu lỗi có làm hỏng giao dịch không) — bài thử dùng lỗi giả `co.nemGhi`
  như LOY-1 đang dựa vào; libsql cục bộ không tái hiện lỗi thật.
- Màn Bán hàng: chọn "ghi nợ / chờ thu" cho giỏ có gói / thẻ nay nhận lời lỗi máy chủ — không sửa client (phiếu cấm); thử tay sau gộp.

## 8. Phát hiện (ngoài nghiệm thu — không sửa)
1. `loyalty_enabled`: LOY-1 và I8 chỉ nhận `'true'`; `/nhan-diem` nhận cả `'1'` (signup-codes.js:209) → bật bằng `'1'` thì nhận mã có điểm mà
   bán không có. Thuộc "một quy tắc — một hàm"; đề xuất gom vào `tinhDiemDon` ở việc sau.
2. Công thức hạn điểm quý chép lần thứ ba trong signup-codes.js:248-255 (chú thích còn trỏ "orders.js ~787").
3. Đơn Flash lúc giảm làm tròn ra 0đ (`flashApplied` true, `flash_discount` 0): lúc tạo không điểm, `pay-debt`/I8 xét `flash_discount > 0`
   → coi như không Flash. Ca biên cực hiếm, ghi lại.

## 9. Sửa sau soát độc lập (agent chỉ đọc, 22.10) — đè lên các mục trên khi khác nhau
1. **Bài NGOÀI Phạm vi sẽ đỏ: `cong_cu/thu_GOI1.js:713` ca B3n** — `mua30(n, { payment_method: 'debt', debt_amount: 1350000 })`, mà `mua30`
   (thu_GOI1.js:525-528) ném lỗi khi không 200. Ca này canh `DON_CON_NO` của `soTienHoanGoi` (server/utils/tienDaTra.js:79) — đường đó sau
   việc này chỉ còn cho dữ liệu cũ. Grep mục P7 sót vì `package_buy` nằm trong hàm bọc. → **Câu hỏi 1** trong trang_thai.md (xin thêm
   `cong_cu/thu_GOI1.js` vào Phạm vi; cách sửa đề xuất như L6a: mua trả đủ rồi `UPDATE` về dạng nợ cũ).
2. **"Gia hạn gói cũ"**: chú thích code orders.js:194 gọi gia hạn = `customer_package_id` + `package_buy` (mua gói MỚI, không lấy món); phiếu
   mô tả gia hạn = `customer_package_id` + món `from_package`. Cổng P1 sẽ chặn dạng của code nếu ghi nợ. → **Câu hỏi 2**.
3. **E(2) thu hẹp**: chỉ lấy `heSo` từ `docCauHinhNhanDiem`; `bat` (`nhandiem_enabled === '1'`) và `hanGio` ở chỗ in bill GIỮ nguyên (phiếu
   chỉ đòi hệ số). Lệch `bat` / `hanGio` → Phát hiện 4. `VS-he-so-bill-cu` giữ nguyên.
4. **`tinhDiemDon` ở tầng module orders.js** (trên `POST /`, ngoài ba vùng sửa) — cần vì hai route cùng dùng (LUAT §2). Xin chủ quán duyệt
   cùng kế hoạch.
5. **Mốc I8 gọn hơn**: trước mốc (chỉ `ctx.thuc`) không viết hai luật đầy đủ mà chỉ nới đúng hai vế khác nhau — đơn chưa thu đủ chấp nhận
   {0, g}; đơn Flash đã nhận mã chấp nhận {0, round(g × k)}. Cùng nghĩa với "mới hoặc cũ".
6. **Ca thêm vào bảng mục 3:**
   - C8 (C "cùng giao dịch"): `co.nemGhi` vào câu ghi SAU câu ghi điểm (dòng `debt_payment`) → thu lỗi, rollback: đơn vẫn nợ, 0 `earn`, 0
     `debt_payment`, 0 nhật ký `thu`. Đột biến `VS-pay-debt-diem-ngoai-tx` (ghi điểm sau commit) → C8 ĐỎ.
   - C9 (C "cài đặt lúc thu", chiều ngược C7): tắt điểm lúc tạo, bật lúc thu → có 1 `earn`.
   - D1–D3b đo ĐỦ "không ghi gì": số `pos_orders`, `pos_customer_packages`, `pos_membership_purchases`, `pos_balance_transactions`, số dư ví,
     `pos_stock_pending`, lệnh SX giả, `pos_signup_codes`, `pos_registrations` (gửi `is_new_customer`), `used_count` mã giảm (gửi kèm mã).
   - F3 (F "đơn huỷ GIỮ như hiện tại"): đơn đã thu có `earn` rồi huỷ → I8 không lệch; đơn chưa thu huỷ → 0 `earn`, không lệch.
7. **thu_gia_lap.js KHUNG.I8** thêm cả `payment_status` lẫn `created_at` (ca mốc cần); KHUNG.I12 = `KHUNG.I8.slice(2)` nhận cột theo — không
   hại (không INSERT `pos_orders` theo vị trí).
8. **Loại sửa bài cũ**: thu_P26c L6a và thu_DOISOAT1 D2d đổi vì cổng D (cố ý đổi hành vi, không phải luật điểm) — ghi đúng loại trong
   trang_thai.md, KHÔNG vào "Bài thử cũ sửa".
9. **Đã xét, dự kiến không đổi**: thu_DOISOAT1 F3/F3c (:547-557, điểm theo tháng — đơn nợ tạo và thu cùng tháng); thu_KH1, thu_P20, thu_P21,
   thu_P26b chỉ dùng đơn đã thu. Xác nhận bằng chạy.
10. **Đường đọc `nhandiem_he_so` thứ tư**: client/src/pages/Settings.jsx:464 (kiểm hệ số ở màn Cài đặt) — không sửa (cấm client), liệt kê.
11. Số dòng sửa: `pay-debt` 1239-1368 (không phải 1385); `docCauHinhNhanDiem` signup-codes.js:116-130; `AP_DUNG_TU` doiSoat.js:29-36;
    `kiemDonCuaMa` còn dùng ở orders.js:517 (voucher mã bill — thêm cột chỉ đọc, không hại).

Phát hiện 4: chỗ in bill bật "Mã nhận điểm" khi `nhandiem_enabled === '1'`, `/nhan-diem` nhận cả `'true'`; hạn giờ `|| 24` vs `> 0 ? : 24`.
