# P3 — Kế hoạch (CHỜ CHỦ QUÁN DUYỆT)

Nền: `98f30df` (= main `bd9b920` + phiếu). Mọi số dòng dưới đây đọc trong lượt này trên nền đó.

## 0. Cần chủ quán quyết trước khi viết code

**Đề xuất tách nhánh (phiếu cho phép):**
- **P3 (nhánh này)** — phiên thanh toán + payOS + webhook + xác nhận tay + PIN + GIỮ/TRỪ TIỀN TÀI KHOẢN (nghiệm thu A, B, C, D, E,
  F phần tài khoản, G, H, I, J).
- **P3b (nhánh sau, chạy cùng / sau UUDAI-1)** — GIỮ/ĐỔI ĐIỂM trong phiên (F phần điểm) + PIN cho đổi quà. Lý do ở Q3: đường đổi
  quà duy nhất hiện có là `POST /loyalty/redeem` (`loyalty.js:80`), ngoài Phạm vi; giả lập `kich_ban.js:367, 570, 589` (cấm sửa) gọi
  nó KHÔNG có PIN; còn "quà cộng hay không cộng với giảm hạng, chọn cái lợi hơn" là luật của UUDAI-1 (DAC_TA_BAN_HANG_2410 mục 1.6).
  Làm điểm trong P3 thì hoặc phá giả lập, hoặc tự quyết luật giá quà thay chủ quán.

**Q1 — đường cũ tự ghi "đã chuyển khoản" / trừ tài khoản không PIN (mâu thuẫn C, E ↔ I).** `POST /orders` hôm nay nhận thẳng
`transfer_amount` (`orders.js:183, 828`) và `balance_amount` không PIN (`orders.js:752–772`). Màn quầy hiện tại (`Sales.jsx:699–740`),
giả lập KB2 (`kich_ban.js:97` — cấm sửa), `thu_P20.js:289`, `thu_P2223.js:160`, `thu_DOISOAT1.js:262, 498` (cấm sửa) đều gửi
đúng như vậy; nghiệm thu I đòi giả lập XANH không sửa. Ngoài Phạm vi còn `pay-debt` CK (P24 đang sửa) và `doi-cach-tra` sang CK
(`don-mo-rong.js`). Đề xuất (chọn một):
  - **(a) — máy đề xuất:** P3 thêm KHOÁ theo cài đặt `thanh_toan_payos_bat_buoc` (mặc định `0` = như cũ): bật `1` thì `POST /orders`
    từ chối `transfer_amount > 0` (`CK_PHAI_QUA_PAYOS`) và `balance_amount` / `parent_balance_amount > 0` (`VI_PHAI_QUA_PIN`) — chỉ
    còn đi qua phiên. Chủ quán bật khi BH-1 lên quầy. `pay-debt` / `doi-cach-tra` khoá cùng cờ ở việc sau (ghi Phát hiện).
  - (b) Giữ mở hẳn; đóng ở BH-1 / QUAY-AN-1 (cùng lúc sửa giả lập).

**Q2 — Phạm vi thiếu `server/routes/backup.js`.** Phép E8 (`kiem_tra_truoc_khi_giao.js:388–398`) bắt MỌI bảng tạo trong `database.js`
phải có trong `BACKUP_TABLES` (`backup.js:41`); bảng dính tiền còn phải vào `BANG_KHONG_KHOI_PHUC` (`backup.js:103`). P3 thêm 2 bảng
→ không sửa `backup.js` thì `npm test` đỏ. Xin thêm `server/routes/backup.js` vào Phạm vi (chỉ thêm 2 dòng + 2 tên).

**Q3 — điểm (xem đề xuất tách ở trên).** Đồng ý tách P3b? Nếu KHÔNG tách: cần thêm `server/routes/loyalty.js` vào Phạm vi và chủ quán
chốt (i) `/loyalty/redeem` cũ (màn Khách `Customers.jsx:217`, giả lập) có phải đòi PIN không; (ii) quà trong phiên tính giá ra sao
khi khách có hạng (đó là câu UUDAI-1).

**Q4 — dùng tài khoản MẸ thì nhập PIN của ai?** Đề xuất: PIN của **chủ tài khoản bị trừ** — trừ tài khoản mẹ cần PIN mẹ (mẹ không ở
quầy thì không trừ được, dòng "tài khoản mẹ" vốn mặc định tắt). Phương án khác: PIN của khách đang mua (con) đủ cho cả hai.

**Q5 — "nội dung ngắn có số bill".** Số bill (`ORD-yyyymmdd-nnn`) chỉ sinh TRONG giao dịch tạo đơn (`orders.js:864`,
`helpers.js:29–43`) — tức là SAU khi tiền về. Đề xuất: nội dung CK = `TQD P<mã phiên>` (ngắn, ≤ 9 ký tự với phiên < 100.000);
màn quầy hiện mã phiên cạnh QR. Phương án khác: giữ chỗ số bill lúc tạo phiên → số bill NHẢY (bỏ trống) mỗi khi khách huỷ QR.

**Q6 — quên / đổi PIN.** Đề xuất: quầy CHỈ đặt khi khách CHƯA có PIN (gõ 2 lần); đổi PIN chỉ trong App KH (đã đăng nhập mã một lần);
khách quên PIN ở quầy → chủ quán / quản lý bấm "Xoá PIN" (quyền mới `xoa_pin_khach`, có lý do, ghi nhật ký) rồi khách đặt lại.

**Q7 — `pos_customers.pin_code` trên Turso có dữ liệu cũ không?** Cột đã có từ lâu (`database.js:87`), code hiện tại không đọc / ghi
nó (grep `pin_code` trong server/, client/src/, app_kh/src/ = chỉ dòng tạo bảng). Máy không đọc được Turso. Đề xuất: giá trị KHÔNG
phải băm bcrypt (không mở đầu `$2`) coi như CHƯA đặt PIN (khách đặt lại), không bao giờ so chuỗi thô.

## 1. Thiết kế chung — "MỘT hàm chốt phiên" (phương án phiếu đã xét)

Bảng `pos_phien_thanh_toan` giữ: thân đơn đã lọc (giỏ khách gửi, chỉ các trường POST /orders nhận), tổng máy chủ tính, phần giữ tài
khoản (+ mẹ), số phải thu payOS, cách trả, `ma_payos`, trạng thái `cho | da_thu | huy | loi`, `het_han`, `order_id`, nguồn chốt
(`tien_mat | payos | tai_khoan | tay`), lý do + người xác nhận tay.

**"Đang giữ" không cần việc hẹn giờ** (Render ngủ, không cron): phiên giữ tiền khi `trang_thai = 'cho' AND het_han > getNow()`. Hết
hạn = tự nhả theo đồng hồ, không dòng tiền nào ghi.

**Chốt phiên = đúng đường tạo đơn hiện có.** Thân `router.post("/")` (`orders.js:167`) đổi thành hàm có tên `taoDon(req, res, phien)`;
route vẫn gọi `taoDon(req, res)` → đường cũ không đổi một ký tự logic. Có `phien` thì:
1. cách trả lấy từ PHIÊN, bỏ mọi trường tiền máy khách gửi (`balance_amount`, `parent_balance_amount`, `transfer_amount`,
   `cash_amount`, `debt_amount`=0, `payment_method`) — phép đối chiếu sẵn có `orders.js:825–840` (tổng thanh toán = total ±1) tự
   bắt lệch tiền / giá đổi giữa lúc tạo phiên và lúc chốt;
2. câu ĐẦU trong giao dịch, TRƯỚC `ghiVi`: `UPDATE pos_phien_thanh_toan SET trang_thai='da_thu' … WHERE id=? AND trang_thai='cho'`
   + `changes !== 1` → rollback, 409 `PHIEN_DA_CHOT` (chống báo lặp / hai báo cùng lúc / tiền mặt + webhook cùng lúc). Đổi trạng thái
   trước nên phần giữ của CHÍNH phiên này không chặn `ghiVi` của nó;
3. sau INSERT đơn: ghi `order_id` vào phiên (cùng giao dịch). Điểm (`tinhDiemDon`, `orders.js:854`), kho SX (`orders.js:1083`), gói,
   thẻ, mã giảm, mã bill — chạy y như đơn quầy (G, nghiệm thu B "trừ kho như đơn quầy").
Webhook không có `req/res` HTTP → `chotPhien` dựng `req` = `{ body: phien.than, user: { username: phien.nguoi_tao } }` và một `res`
gom `{status, json}` (~8 dòng) để đọc kết quả.

**Số dư khả dụng = số dư − đang giữ, ở MỌI nơi tiêu tài khoản:** sửa MỘT chỗ — `ghiVi` (`wallets.js:65`) khi `khongAm`: thiếu nếu
`sau − dangGiu(tx, phone) < 0`. Ba chỗ gọi `khongAm` hiện có đều đi qua đó: đơn quầy (`orders.js:876`), trừ tay (`wallets.js:174`),
điều chỉnh giảm (`wallets.js:213`). Khoản cộng (nạp, hoàn, đền — `refunds.js:165`, `damages.js:184`, `ghiHoan`) không `khongAm` →
không bị chặn (K5). Đọc: `GET /wallets/:phone` + chỗ trả số dư của `customers-v2.js` thêm `dang_giu`, `kha_dung`.

## 2. payOS — đã đối chiếu SDK chính thức (payOSHQ/payos-lib-node, main)
- Gốc `https://api-merchant.payos.vn` (ghi đè `PAYOS_BASE_URL` — bài thử trỏ về máy chủ giả trên localhost); header `x-client-id`,
  `x-api-key`, `Content-Type: application/json` (`src/client.ts`).
- Tạo link: `POST /v2/payment-requests`, thân `{orderCode:number, amount:number, description, cancelUrl, returnUrl, expiredAt?}` +
  `signature` = HMAC-SHA256 hex (khoá checksum) của chuỗi CỐ ĐỊNH
  `amount=…&cancelUrl=…&description=…&orderCode=…&returnUrl=…` (`src/crypto/node-crypto.ts` `createSignatureOfPaymentRequest`).
  Vỏ trả `{code, desc, data, signature}`, thành công khi `code === '00'` và có `data`; `data` có `qrCode`, `checkoutUrl`,
  `paymentLinkId`, `status`. Vỏ trả có `signature` thì kiểm như webhook (SDK làm vậy).
- Huỷ: `POST /v2/payment-requests/{orderCode}/cancel` (gọi khi huỷ phiên; lỗi chỉ log — phiên vẫn huỷ ở POS).
- Webhook `{code, desc, success, data, signature}`; CHỈ `data` được ký: khoá xếp tăng dần (`Object.keys().sort()`, nông), bỏ khoá
  `undefined`, giá trị `null` / `'null'` / `'undefined'` → rỗng, mảng → `JSON.stringify` (phần tử xếp khoá), nối `k=v` bằng `&`, không
  mã hoá URL; HMAC-SHA256 hex (`src/utils/sort-obj-by-key.ts`, `convert-obj-to-query-str.ts`, `src/resources/webhooks/webhook.ts`).
  `data`: `orderCode, amount, description, accountNumber, reference, transactionDateTime, currency, paymentLinkId, code, desc, …`.
- **CHƯA đọc được từ nguồn chính thức** (payos.vn không phân giải được): đơn vị `expiredAt` (máy hiểu là giây Unix), trần độ dài
  `description`, trần `orderCode`, payOS có gửi lại webhook khi máy chủ không trả 200 / Render đang ngủ không. Thiết kế KHÔNG dựa vào
  các điểm này để đúng tiền: hạn do POS tự giữ; nội dung ngắn (Q5); `ma_payos` UNIQUE.
- So chữ ký bằng `crypto.timingSafeEqual`; khoá checksum rỗng → từ chối mọi webhook (B5 — không bao giờ HMAC với khoá rỗng).

## 3. Phần việc — phương án A / B, chọn

| Phần | A (chọn) | B | Vì sao chọn A |
|---|---|---|---|
| Đường tạo đơn khi chốt phiên | Đổi tên thân `POST /` thành `taoDon(req,res,phien)` + 4 chỗ rẽ `if (phien)` (~35 dòng `orders.js`) | Tách POST / thành `tinhGio()` + `ghiDon(tx)` (~120 dòng dời, đụng gần hết thân — đè P24) | Ít dòng, "cùng hàm cùng kiểm", diff nhỏ cạnh P24 |
| Giữ tài khoản | Suy từ bảng phiên (`cho` + chưa hết hạn), kiểm trong `ghiVi` | Cột `dang_giu` trên `pos_wallets` + nhả bằng hẹn giờ | Không cần cron, không có số dư rời để lệch |
| PIN | 2 cột mới `pos_customers.pin_sai`, `pin_khoa_den`; `pin_code` lưu băm bcryptjs | Bảng riêng `pos_pin_khach` | Ít bảng hơn (khỏi thêm vào sao lưu); phiếu cho phép |
| Sự kiện payOS | Bảng `pos_payos_su_kien` (append-only; UNIQUE `reference`) chứa cả "tiền về chưa khớp" | Ghi vào `pos_order_log` | `pos_order_log.order_id NOT NULL` — tiền chưa khớp không có đơn |
| Trạng thái khi webhook lỡ | Chỉ webhook + xác nhận tay | Thêm hỏi payOS `GET /v2/payment-requests/{id}` khi quầy hỏi trạng thái | Ít dòng; B ghi Phát hiện nếu chạy thử thấy webhook mất |

**File và ước lượng (code / thử):**
| File | Việc | ~dòng |
|---|---|---|
| `server/utils/payos.js` (mới) | đọc khoá lúc gọi; `kyTaoLink`, `kyDuLieu`, `kiemWebhook`, `taoLink`, `huyLink` | 75 |
| `server/utils/giuCho.js` (mới) | `dangGiu(q, phone)`, `taoPhien(tx…)`, `chotPhien(phien, nguon, them)` (dựng req/res, gọi `taoDon`), `ghiSuKien` | 90 |
| `server/utils/pinKhach.js` (mới) | `datPin`, `kiemPin` (đếm sai TƯƠNG ĐỐI `pin_sai = pin_sai + 1`, khoá 15′), `boMat(row)`; hằng `PIN_SAI_TOI_DA=5`, `PIN_KHOA_PHUT=15` | 55 |
| `server/routes/thanh-toan.js` (mới) | `POST /phien`, `GET /phien/:id`, `POST /phien/:id/tien-mat`, `POST /phien/:id/tai-khoan`, `POST /phien/:id/huy`, `POST /phien/:id/xac-nhan-tay`, `POST /pin` (quầy); router `webhook` riêng | 160 |
| `server/routes/orders.js` | `taoDon` + rẽ `phien`; H: từ chối `cash_amount>0 && transfer_amount>0` (`TRA_KET_HOP`); cờ Q1(a) | 35 |
| `server/routes/wallets.js` | `ghiVi` trừ `dangGiu`; `GET /:phone` thêm `dang_giu`, `kha_dung` | 10 |
| `server/routes/customers.js` | bỏ `password`, `pin_code` ở mọi câu trả (10 chỗ `res.json` có hàng `pos_customers`: dòng 92, 179, 232, 267, 295, 423, 485, 541, 571, 637) qua `boMat` | 15 |
| `server/routes/customers-v2.js` | số dư trả kèm `dang_giu`/`kha_dung` (dòng 408, 470) | 6 |
| `server/routes/kh/index.js` | `PUT /api/kh/pin` (đặt / đổi PIN, SĐT từ token) | 15 |
| `server/index.js` | một khối: `/api/pos/thanh-toan` + `/api/payos/webhook` | 3 |
| `server/database.js` | 2 bảng + 2 cột (`ALTER … ADD COLUMN` trong try như dòng 686–708) + quyền `xac_nhan_ck_tay` (owner 1, manager 1, staff 0) [+ `xoa_pin_khach` nếu Q6 đồng ý] — INSERT OR IGNORE mỗi lần khởi động như `refund_package` (dòng 1037) | 45 |
| `server/routes/backup.js` (xin Q2) | 2 dòng `BACKUP_TABLES` + 2 tên `BANG_KHONG_KHOI_PHUC` | 4 |
| `server/utils/doiSoat.js` | 2 phép vào vòng `D1/DEN` (dòng 243): `CK` tiền về chưa khớp → ĐỎ; `XNT` đơn xác nhận tay → CẦN XEM (vàng) | 25 |
| `env.example` | `PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY` (rỗng) + `PAYOS_RETURN_URL` | 8 |
| `kiem_tra_truoc_khi_giao.js` | thêm `cong_cu/thu_P3.js` CUỐI mảng dòng 495 | 1 |
| **Cộng code** | | **~550** |
| `cong_cu/thu_P3.js` (mới) | khuôn `thu_KH1.js`: database.js + libsql thật trên kho tạm, Express mount như index.js, payOS giả trên localhost | ~500 |

Ngân sách phiếu 400 / 450 → code ~550 = 1,38 lần (< 1,5): phần vượt là 6 đường của `thanh-toan.js` + bỏ mật khẩu ở 10 chỗ trả.
Không kèm phần điểm (P3b).

**Luồng API (quầy, JWT nhân viên):**
- `POST /api/pos/thanh-toan/phien` `{ don: <thân như POST /orders, chỉ hàng hoá + khách + mã giảm>, tru_tai_khoan, tru_tai_khoan_me,
  pin, cach: 'payos'|'tien_mat'|'tai_khoan' }` → máy chủ CHẠY KIỂM của `taoDon` ở chế độ "chỉ tính" (không ghi) để ra `total`; giữ
  `min(kha_dung, total)` khi bật trừ tài khoản (PIN đúng bắt buộc); `con_lai = total − giữ`; `cach='payos'` và `con_lai>0` → gọi payOS
  → `{ phien: {id, het_han, con_lai, qr, checkout_url, noi_dung} }`. Chưa có khoá payOS → 503 `PAYOS_CHUA_CAU_HINH` (phiên KHÔNG tạo,
  không giữ). `con_lai = 0` mà `cach ≠ 'tai_khoan'` → 400.
  *Chế độ "chỉ tính"*: cờ `phien.chiTinh` → `taoDon` trả `{total}` ngay trước `beginTransaction` (`orders.js:860`) — dùng lại toàn bộ
  phép kiểm hàng/gói/mã/flash/hạng, không chép công thức (luật "một quy tắc — một hàm").
- `GET /phien/:id` → `cho | da_thu (+ order: {id, code}) | het_han | huy | loi`.
- `POST /phien/:id/tien-mat {cash_received}` → chốt nguồn `tien_mat` (đủ tiền mới chốt) → trả như POST /orders.
- `POST /phien/:id/tai-khoan` → chốt khi `con_lai = 0`.
- `POST /phien/:id/huy` → `cho → huy` (changes = 1), gọi payOS cancel (lỗi chỉ log).
- `POST /phien/:id/xac-nhan-tay {ly_do}` — `checkPermission('xac_nhan_ck_tay')`, lý do ≥ 3 ký tự (khuôn `wallets.js:207`), phiên
  `cach` là `payos` hoặc `ck_tay` → chốt nguồn `tay` (đơn ghi `transfer_amount`), lưu lý do + người trên phiên (dự phòng: Q-phụ dưới).
- `POST /api/pos/thanh-toan/pin {phone, pin, pin_lai}` — đặt PIN lần đầu ở quầy (đã có PIN → 409 `PIN_DA_CO`).
- `POST /api/payos/webhook` (công khai): chữ ký sai / khoá rỗng → 400, không ghi gì. Đúng chữ ký → ghi `pos_payos_su_kien`
  (ON CONFLICT(reference) DO NOTHING — báo lặp dừng ở đây) → tìm phiên theo `orderCode`:
  khớp phiên `cho` + chưa hết hạn + `amount === con_lai` + `code==='00'` → `chotPhien(nguon='payos')`; còn lại (lệch tiền, hết hạn,
  huỷ, đã chốt bằng tiền mặt, chốt lỗi) → đánh dấu sự kiện `chua_khop` + lý do → Đối soát ĐỎ. Luôn trả 200 sau khi chữ ký đúng
  (payOS khỏi gửi lại). `orderCode` không thuộc phiên nào (vd webhook thử của payOS lúc xác nhận URL) → `khong_phien`, Đối soát VÀNG.
- **Q-phụ (chủ quán xem):** "về muộn" = `transactionDateTime` (payOS ký) > `het_han`; không đọc được thì dùng giờ máy chủ.
  Dự phòng khi thiếu khoá payOS (hoặc payOS lỗi): `cach='payos'` → 503 `PAYOS_CHUA_CAU_HINH` / 502 `PAYOS_LOI`, KHÔNG tạo phiên,
  không giữ. Quầy tạo lại với `cach='ck_tay'` (QR tĩnh của quán) → phiên CHỈ chốt được bằng `xac-nhan-tay` (owner / manager).
  Máy theo cách này trừ khi chủ quán bảo khác.

**App KH:** `PUT /api/kh/pin {pin, pin_lai}` (SĐT từ token — khách A không đổi được PIN khách B vì không có tham số SĐT nào được đọc).

## 4. Ca thử ↔ nghiệm thu (`cong_cu/thu_P3.js`, mọi ca so HTTP status + `code`, không dò lời — E12)

| NT | Ca (phải ĐỎ trên gốc: route / bảng chưa có) |
|---|---|
| A | A1 tạo phiên payOS: payOS giả nhận đúng `amount = total − giữ`, `orderCode` khác nhau giữa 2 phiên, chữ ký link đúng công thức, `description` ngắn, hết hạn 10′ · A2 giỏ gửi `unit_price`/`total` sai → số gửi payOS vẫn là số máy chủ tính · A3 thiếu khoá → 503 `PAYOS_CHUA_CAU_HINH`, không giữ tiền |
| B | B1 chữ ký sai → 400, không đơn, không sự kiện · B2 khoá checksum rỗng + chữ ký HMAC khoá rỗng → 400 (B5) · B3 đúng → MỘT đơn `paid`, `transfer_amount = con_lai`, `balance_amount = giữ`, ví trừ đúng, điểm `= tinhDiemDon(total)`, `pos_stock_pending`/SX giả có dòng ra kho · B4 báo lặp 3 lần → vẫn 1 đơn · B5 hai báo CÙNG LÚC (`Promise.all`) → 1 đơn · B6 lệch 1.000đ → 0 đơn, sự kiện `chua_khop`, ví nguyên · B7 về sau hết hạn → 0 đơn, `chua_khop` · B8 về sau khi huỷ → như B7 · B9 tiền mặt chốt + webhook cùng lúc → 1 đơn, webhook thành `chua_khop` |
| C | C1 `GET /phien/:id` qua 4 trạng thái (`cho`, `da_thu`+mã đơn, `het_han` bằng lùi `het_han` trong kho tạm, `huy`) · C2 không route nào cho nhân viên chốt nguồn `payos` (POST `/phien/:id/tien-mat` với `cach='payos'` → 400; liệt kê đường `thanh-toan` trả về: không có đường "đã thu CK" ngoài xác nhận tay) |
| D | D1 staff xác nhận tay → 403 · D2 manager thiếu lý do → 400 · D3 manager có lý do → đơn + phiên lưu lý do/người · D4 Đối soát có dòng `XNT` (vàng) cho đơn đó; quyền seed đủ 3 vai trên kho MỚI và kho ĐÃ CÓ quyền |
| E | E1 đặt PIN quầy (2 lần khớp) → cột là băm bcrypt, không phải 4 số · E2 2 lần lệch → 400 · E3 PIN sai 5 lần → lần 6 (dù đúng) 423 `PIN_DANG_KHOA`; lùi `pin_khoa_den` → mở lại · E4 4 lần sai + 1 đúng → đếm về 0 (ca NGAY DƯỚI ngưỡng) · E5 chưa có PIN mà bật trừ tài khoản → 400 `CHUA_CO_PIN` · E6 `GET /customers/qr/:code`, `/customers/:id`, `/customers/phone/:p`, danh sách, tạo, sửa, con → không có khoá `password`, `pin_code` · E7 App KH `PUT /kh/pin` đặt cho CHÍNH mình, gửi kèm `sdt` của B → PIN B không đổi · E8 hai PIN sai cùng lúc → đếm 2 (cộng tương đối) |
| F | F1 phiên giữ 80.000/100.000 → `POST /wallets/deduct 30.000` → 400 `SO_DU_KHONG_DU`; `/adjust −30.000` → 400; `POST /orders` trừ 30.000 → 400 · F2 phiên hết hạn → các lệnh F1 qua · F3 huỷ → nhả, `pos_balance_transactions` không thêm dòng nào · F4 HAI quầy cùng tạo phiên giữ trên cùng ví 100.000 (mỗi phiên 70.000, `Promise.all`) → 1 phiên giữ được, 1 phiên 400 · F5 tài khoản mẹ: giữ trên ví mẹ, chốt trừ ví mẹ · F6 `GET /wallets/:phone` có `dang_giu`, `kha_dung` |
| G | G1 đơn qua phiên: `points = floor(total / per)` đúng như đơn quầy cùng giỏ (so 2 đơn) |
| H | H1 `POST /orders` tiền mặt + CK > 0 cùng lúc → 400 `TRA_KET_HOP` · H2 phiên tài khoản + payOS → được · H3 phiên tài khoản + tiền mặt → được |
| I | I1 tiền mặt · I2 số dư đủ (`payment_method:'balance'`) · I3 giao từ gói 0đ · I4 mua gói trả đủ · I5 mua thẻ trả đủ · I6 đơn nợ CŨ thu ở `pay-debt` — tất cả 200 như cũ · I7 cờ Q1(a) TẮT: `transfer_amount` cũ vẫn 200; BẬT: 400 `CK_PHAI_QUA_PAYOS` (ca BẬT/TẮT đủ — K3) · `thu_gia_lap.js` + bộ bài cũ XANH không sửa (chạy qua `npm test`) |
| J | toàn bài: `PAYOS_BASE_URL` trỏ máy chủ giả `127.0.0.1`; khoá thử sinh ngẫu nhiên lúc chạy; ca J1: nhật ký máy chủ không chứa khoá checksum / api key |

**Đột biến (`viec/P3/dot_bien.py`, mỗi cái một tên):** `BV-cong-phien` (bỏ `AND trang_thai='cho'` + changes → B4/B5 đỏ) ·
`BV-giu-ghivi` (bỏ trừ `dangGiu` trong ghiVi → F1 đỏ) · `VS-giu-het-han` (quên `het_han > now` → F2 đỏ) · `BV-chu-ky` (bỏ so chữ ký → B1
đỏ) · `VS-khoa-rong` (bỏ chặn khoá rỗng → B2 đỏ) · `VS-so-tien` (so `amount >= con_lai` → B6 đỏ) · `BV-pin-dem` (không tăng đếm sai → E3
đỏ) · `VS-pin-nguong` (`> 5` thay `>= 5` → E3/E4 đỏ) · `BV-bo-mat` (bỏ `boMat` ở `/qr/:code` → E6 đỏ) · `BV-ket-hop` (bỏ H → H1 đỏ) ·
`BV-quyen-tay` (bỏ `checkPermission` → D1 đỏ) · `VS-tien-client` (phiên lấy `transfer_amount` client gửi → A2/B3 đỏ). Có đối chứng (bản
chưa đột biến xanh).

## 5. Đường song song phải canh (K4)
- Mọi chỗ ghi ví `khongAm` (3 chỗ, mục 1) — sửa trong `ghiVi`, không ở từng route. Grep lại `khongAm` lúc vá.
- Mọi chỗ chốt phiên (tiền mặt / tài khoản / payOS / tay) đi qua MỘT `chotPhien` → MỘT cổng `trang_thai='cho'`.
- Mọi câu trả hàng `pos_customers` ở `customers.js` (10 chỗ trên) + `kh/index.js` (đang chọn cột trắng — giữ) + `customers-v2.js`
  (đang ánh xạ trường — giữ). Grep `SELECT \*.*pos_customers` + `c\.\*` trên cả `server/routes/`.
- Hai PIN: quầy + App KH đi qua MỘT `datPin` (cùng kiểm 4 chữ số, băm).
- Ngoài Phạm vi, ghi Phát hiện, KHÔNG sửa: `pay-debt` nhận CK tay (`orders.js:1242`, P24), `doi-cach-tra` sang CK (`don-mo-rong.js`),
  `/loyalty/redeem` không PIN (`loyalty.js:80`), các route khác trả `SELECT * FROM pos_customers` nếu grep thấy.

## 6. Luồng hợp lệ phải KHÔNG bị chặn (K5) — mỗi luồng một ca
I1–I6 ở trên · nạp tiền khi đang có phiên giữ (cộng không bị chặn) · hoàn / đền vào ví đang giữ · khách KHÔNG có PIN mua tiền mặt / CK
không trừ tài khoản (PIN chỉ đòi khi trừ tài khoản) · khách lẻ (không SĐT) tạo phiên payOS · đơn 0đ toàn bộ từ gói không cần phiên ·
dữ liệu cũ: `pin_code` không phải băm → coi như chưa đặt (Q7) · đơn tạo trước P3 vẫn hiện ở Đối soát như cũ (2 phép mới chỉ đọc bảng
mới).

## 7. Rủi ro
- `taoDon` dùng chung với P24 (P24 sửa `PUT /:id/cancel`, `DELETE /:id`, `pay-debt` — không đụng thân POST /) → đụng nhau chỉ ở mức
  dòng gần nhau; script gộp của chat xử.
- Render ngủ: webhook đến lúc máy ngủ → payOS có gửi lại không là CHƯA KIỂM; dự phòng là xác nhận tay (D) + phương án B mục 3.
- Thay đổi giá / hết hàng trong 10′ giữa tạo phiên và tiền về → chốt thất bại → sự kiện `chua_khop` (đỏ), chủ quán xử (hoàn hoặc
  nạp tài khoản khách — DAC_TA mục 1.13). Không tự nạp.
