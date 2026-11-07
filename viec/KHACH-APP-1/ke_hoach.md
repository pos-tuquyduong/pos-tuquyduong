# KHACH-APP-1 — kế hoạch (chờ chủ quán duyệt)

Lời thường: hôm nay danh sách khách ở quầy lấy từ SX. Khách mới tạo trên App (hay bằng `POST /customers`) chỉ nằm ở kho POS nên quầy không thấy,
không tìm được, mở hồ sơ báo "không tìm thấy". Việc này cho quầy đọc khách thẳng từ kho POS (một hàm), chép một lần những khách SX còn thiếu,
rồi thôi gọi SX khi đọc khách; quầy và App tạo khách bằng cùng một hàm.

## Hiện trạng đã đọc (07.11, HEAD 1c06bba)
- `server/routes/customers-v2.js`: `fetchSXCustomers` (dòng 25), `cacheCustomersToLocal` (dòng 52, ghi ĐÈ `name` / `parent_phone` lên
  `pos_customers` mỗi 5 phút), `getLocalCachedCustomers` (dòng 76). Bốn đường đọc: `GET /search/:query` (111), `GET /` (203), `GET /:phone` (408),
  `GET /:phone/full` (470) — cả bốn gọi `fetchSXCustomers()`; `GET /:phone` trả 404 khi không có ở SX, không ví, không đăng ký (dòng 431) — khách chỉ
  có ở `pos_customers` rơi vào đây.
- Tạo khách: `customers.js:314` (`POST /customers`: kiểm trùng SĐT, `sinhQrKhongTrung`, mặc định `subscription` / `new`, thêm người nhận) và
  `maKhach.js:186–187` (App: `generateQRCode` không kiểm trùng, `retail` / `retail_only`, `ON CONFLICT DO NOTHING` nuốt CẢ trùng QR).
- Màn Khách hàng tạo khách qua `POST /registrations` (không phải `/customers`) — xem Câu hỏi Q1.
- Khung nâng cấp `server/nang_cap/chay.js`: bước ném lỗi → `hong` → `database.js:39` giữ `nangCapHong` → **đường kho trả 503**. Bước gọi SX mà
  ném lỗi khi SX tắt sẽ làm hỏng kho — phải có đường "chưa xong, lần sau thử lại" KHÔNG phải hỏng.

## Phần A — một hàm đọc khách `server/utils/docKhach.js`
- **PA A1 (chọn):** `docKhach({ phone } = {})` → mảng khách đã ghép. Đọc `pos_customers` (một SĐT hoặc tất cả) + `pos_wallets` + điểm còn hạn
  (cùng câu `customers-v2.js:218`) + `hangNhieuKhach` (cùng hàm) + `pos_registrations` mà SĐT chưa có trong `pos_customers` (danh sách: chỉ
  `pending` như nay; tìm / hồ sơ: mọi trạng thái như nay). Mỗi SĐT một dòng (khoá theo SĐT, dòng `pos_customers` thắng đăng ký). `parent_name` tra
  từ chính `pos_customers` / đăng ký (như map tên ở `/search`). Mỗi khách trả HỢP các trường bốn đường đang trả: `id, name, phone, notes,
  parent_phone, parent_name, relationship, status:'active', subscriptions:[], balance, parent_balance, points, membership, discount_type,
  discount_value, discount_note, address, ngay_sinh, customer_type` + **`xung_ho`**; khách `pos_customers`: `source:'sx', is_synced:true` (giữ
  nhãn màn hiện có — client Cấm); đăng ký: `source:'pos', is_synced:false, is_pending, registration_id, requested_product`.
  Route: `/` → `{customers, total}`; `/search/:q` → lọc tên / SĐT trên kết quả, 20 dòng; `/:phone` → dòng đó (+ `total_topup`, `total_spent`),
  không có mà có ví → `{phone, source:'pos', is_retail:true}` như cũ, không gì → 404; `/:phone/full` → như cũ + giao dịch + đơn.
  ~75 dòng mới, customers-v2.js bỏ ~200 dòng / thêm ~35. Rủi ro: bài cũ khoá đúng danh sách trường (sẽ thấy ở bước 6).
- PA A2: mỗi route tự viết câu SQL của mình (JOIN). Ít dòng hàm chung hơn nhưng bốn công thức ghép → trái "một hàm đọc"; loại.
- Bỏ hẳn `fetchSXCustomers`, `getLocalCachedCustomers`, `cacheCustomersToLocal`, `SX_API_KEY`, `callSxApi` khỏi customers-v2.js.

## Phần B — chép lần cuối: bước `server/nang_cap/020_chep_khach_sx.js` (số kế tiếp trên nhánh; trùng số với nhánh khác lúc merge → đổi số)
- **PA B1 (chọn):** khung thêm móc `layTruoc()` (gọi NGOÀI giao dịch — Turso huỷ giao dịch mở lâu, SX chờ tới 8 giây). `chay.js` (+~8 dòng): bước
  có `layTruoc` → đã có dòng `pos_nang_cap` thì bỏ (không gọi SX); chưa → `await layTruoc()`; trả `null` (không khoá / không URL / SX lỗi / chậm /
  trả không phải mảng) → log "chưa xong, lần khởi động sau thử lại", **không** ghi `pos_nang_cap`, **không** `hong` (kho không 503), sang bước
  sau. Có danh sách → mở giao dịch như mọi bước, `chay(tx, ctx, danhSach)`.
  Bước 020 (~45 dòng): `layTruoc` = `callSxApi('/api/pos/customers/export')` trong try (không khoá → null). `chay`: đếm `truoc`; sao lưu
  `_sao_luu_020_pos_customers` (bảng có dòng, khuôn themCot); mỗi khách SX: `normalizePhone` + `isValidPhone`, tên rỗng → bỏ (đếm); `INSERT …
  ON CONFLICT(phone) DO NOTHING` (KHÔNG ghi đè — POS là bản đúng) với `name, parent_phone, relationship, notes, qr_code = sinhQrKhongTrung(tx.queryOne),
  sx_status 'active', sync_status 'synced', customer_type 'subscription', created_by 'chep_sx', created_at/updated_at getNow()`; đếm `them` theo
  `changes`; đếm `sau` (để chủ quán đối chiếu, không thêm phép ném — cùng giao dịch). Ghi một dòng `pos_sync_logs` (`type 'chep_khach_sx'`, `record_count = them`,
  `details` JSON `{sx, truoc, them, da_co, bo_qua, sau}`) + `console.log` cùng số.
  **Chủ quán đối chiếu:** trước khi deploy đếm khách ở màn Khách hàng (số "Tổng" — đang là số SX + đăng ký chờ); sau khởi động xem dòng log
  `📋 Chép khách SX lần cuối: SX n · đã có a · thêm t · bỏ b · POS trước x → sau y` (Render Logs) hoặc `pos_sync_logs` trong sao lưu: `y = x + t`,
  `n = a + t + b`.
- PA B2: gọi SX ngay trong `chay(tx)`, SX lỗi thì ném lỗi đặc biệt mà chay.js coi là "thử lại". Ít hơn ~4 dòng nhưng giữ giao dịch Turso mở
  trong lúc chờ SX (tới 8 s) → giao dịch có thể bị huỷ giữa chừng; loại.
- PA B3: chép ở route lúc tải danh sách (như cũ) — chính là đường ghi đè cần bỏ; loại.

## Phần C — một hàm tạo khách `server/utils/khachMoi.js`
- **PA C1 (chọn):** `taoKhach(db, { phone, name, notes, parentPhone, relationship, customerType, requestedProduct, requestedCycles, xungHo,
  address, nguoi })` → `{ khach }` | `{ trung: true, khach }` | `{ loi }`. Một chỗ: `normalizePhone` + `isValidPhone` (cùng cặp `chuanSdt`),
  tên trim, mặc định cột (Q2), `sync_status` suy từ `customer_type` (một biểu thức), `sinhQrKhongTrung(db.queryOne)`, `INSERT … ON CONFLICT(phone)
  DO NOTHING` rồi kiểm `changes` (trùng SĐT = 0 dòng → đọc lại khách có sẵn, trả `trung`; trùng QR — xác suất ~0 — vẫn ném như lỗi thật,
  KHÔNG bị nuốt như `ON CONFLICT DO NOTHING` hiện nay). `db` = module database hoặc `tx` (App gọi trong giao dịch chiếm mã).
  - quầy `POST /customers`: `trung` → 400 `{error:'Số điện thoại đã tồn tại trong hệ thống', code:'SDT_DA_CO'}` (câu cũ giữ, thêm code); người nhận
    gọi cùng hàm (có SĐT hợp lệ mới tạo); bỏ câu kiểm trùng riêng (dòng 344) — kiểm trong câu ghi, không đua. ~−45 / +20 dòng. Lỗi ghi qua
    `loiGhi` (kho bận → 409) như wallets.js.
  - App `xacMinhMa`: `trung` → dùng khách có sẵn (đăng nhập vào khách đó — đúng như nay); `created_by 'app_kh'`, giữ `xung_ho`, `address`.
    ~−3 / +3 dòng; bỏ `generateQRCode` khỏi require.
  ~35 dòng.
- PA C2: chỉ đổi `maKhach.js` sang `sinhQrKhongTrung` + kiểm trùng, giữ hai INSERT. Ít dòng hơn ~20 nhưng hai bộ mặc định cột tiếp tục lệch; loại.

## Ca thử `cong_cu/thu_KHACHAPP1.js` (ánh xạ nghiệm thu)
Dựng Express + kho thử `file:` như thu_HANG1 (giả `sxApi`: ba chế độ — trả danh sách KHÔNG có hai khách mới · ném lỗi (SX tắt) · không khoá).
| Ca | Nghiệm thu | Kiểm | Đỏ trên gốc? |
|---|---|---|---|
| A1 | A, D | khách App + khách quầy có trong `GET /v2/customers` — SX trả danh sách thiếu họ | ĐỎ (chỉ có danh sách SX) |
| A2 | A, D | cùng A1 khi SX tắt (ném) | xanh trên gốc (dự phòng đọc local) — ca hồi quy, đi cùng A1 |
| A3 | A, D | `/search/<một phần tên>`, `/search/<SĐT>` ra từng khách (SX thiếu họ) | ĐỎ |
| A4 | A, D | quét QR: `GET /customers/qr/<qr_code>` → SĐT → `/v2/customers/search/<SĐT>` ra khách (SX thiếu họ) | ĐỎ |
| A5 | A, D | `GET /v2/customers/:phone` và `/:phone/full` → 200, đúng `balance`, `points`, `membership`, `ngay_sinh`, `xung_ho` | ĐỎ (404) |
| A6 | A | mỗi SĐT MỘT dòng trong danh sách khi SĐT có ở `pos_customers` + đăng ký chờ + SX | xanh hồi quy |
| A7 | A | SX treo / ném → `GET /v2/customers` vẫn 200 và **không gọi SX lần nào** (đếm lượt gọi giả = 0) | ĐỎ (gốc gọi SX) |
| A8 | A, D | sửa tên khách ở POS (`PUT /customers/:id`) rồi tải danh sách hai lần (SX giả trả tên cũ) → tên POS giữ | ĐỎ (bị đè) |
| A9 | A (K5) | đăng ký chờ (chưa là khách) vẫn hiện `is_pending`, `registration_id`; khách chỉ có ví → `/:phone` `is_retail` | xanh hồi quy |
| B1 | B | bước chép: SX có 3 khách (1 đã có tên khác, 2 thiếu) → thêm đúng 2, dòng đã có KHÔNG đổi tên, có `qr_code` không trùng, có `_sao_luu_020_pos_customers`, `pos_sync_logs` đúng `{truoc, them, sau}` | ĐỎ (chưa có bước) |
| B2 | B | chạy khung lần hai → không gọi SX, không thêm, không log thêm | ĐỎ |
| B3 | B | SX ném / không khoá → không có dòng `pos_nang_cap` 020, `hong` null (kho không 503), bước sau vẫn chạy; lần sau SX trả → chép | ĐỎ |
| B4 | B | SĐT sai dạng / tên rỗng ở SX → bỏ, đếm vào `bo_qua` | ĐỎ |
| C1 | C, D | tạo khách quầy (`POST /customers`) + khách App (`/api/kh` xin mã quầy → xác minh mã như App thật) → so MỌI cột `pos_customers` trừ id, phone, qr_code, created_at, updated_at, created_by, xung_ho, address → bằng nhau; `created_by` = tên NV / `app_kh` | ĐỎ (customer_type, sync_status lệch) |
| C2 | C | QR hai đường đều `TQD-` + 12 ký tự, khác nhau; App dùng `sinhQrKhongTrung` (giả `generateQRCode` trả mã đã có → App vẫn ra mã khác, không 500) | ĐỎ |
| C3 | C | hai đường cùng SĐT cùng lúc (`Promise.all` quầy + App) → đúng MỘT dòng; quầy 201 hoặc 400 `SDT_DA_CO`; App đăng nhập vào đúng khách đó; không 500 | ĐỎ (một phần — quầy kiểm-rồi-ghi đua) — ghi rõ nếu xanh trên gốc |
| C4 | C | hai quầy cùng SĐT cùng lúc → một khách, bên kia 400 `SDT_DA_CO` (không 500 UNIQUE) | ĐỎ |
| C5 | C (K5) | SĐT `+84…` / có dấu cách ở quầy → lưu `0…` như App | xanh hồi quy |
| A10 | D | SX TẮT (ném) và SX không khoá: `/search` theo tên / SĐT, quét QR → search, `/:phone`, `/:phone/full` 200 cho khách App + khách quầy | xanh trên gốc một phần (dự phòng đọc local) — hồi quy, đi cùng A3–A5 |
| A11 | A | đếm lượt gọi SX giả = 0 qua CẢ BỐN đường (`/`, `/search`, `/:phone`, `/:phone/full`); đột biến `BV-DOC-SX-<đường>` mỗi đường một cái | ĐỎ |
| A12 | A | dạng trả ra: mỗi đường trả ĐỦ các khoá đang trả hôm nay (danh sách trắng chép từ code gốc, so tập khoá ⊇ + có `xung_ho`) | ĐỎ (thiếu `xung_ho`) |
| A13 | A (K5) | số dư, điểm còn hạn, hạng, `parent_balance` của khách có ví / điểm / thẻ / mẹ = giá trị tính tay từ bảng | xanh hồi quy |
| B5 | B | khi bước 020 CHƯA xong (SX tắt lúc khởi động) → `GET /v2/customers` vẫn 200 từ `pos_customers` | ĐỎ cùng B3 |
| C6 | C | khách App giữ đúng `xung_ho`, `address` đã gửi; khách quầy `xung_ho`, `address` NULL | xanh hồi quy |
| K3 | K5 | `git diff <mốc>^ HEAD -- client/ server/routes/sync.js server/routes/kh/` rỗng (lệnh trong bằng chứng) | — |
| K1 | K5 | `/api/kh` dạng trả lời không đổi: bài `thu_HOPDONG_KH.js` + `thu_KHSDT1.js` vẫn xanh (chạy trong `npm test`) | — |
| K2 | K5 | người nhận (children) của `POST /customers` vẫn tạo được, có QR, `parent_phone` đúng | xanh hồi quy |
Đột biến (`dot_bien.py`, mỗi cái một dòng): `BV-DOC-SX` (đưa lại `fetchSXCustomers` vào `GET /`) · `VS-DOC-DONGSX` (đọc chỉ `sx_status='active'`) ·
`BV-DE-TEN` (đưa lại ON CONFLICT DO UPDATE name) · `VS-CHEP-DE` (bước 020 `DO UPDATE SET name`) · `BV-CHEP-HONG` (SX lỗi → ném = hỏng) ·
`VS-CHEP-LAI` (bỏ kiểm `pos_nang_cap` trước `layTruoc`) · `BV-TAO-QR` (App về `generateQRCode`) · `VS-TAO-NUOT` (`ON CONFLICT DO NOTHING` không
nêu cột) · `VS-TAO-MACDINH` (quầy mặc định `subscription`) · `BV-TAO-DUA` (kiểm trùng bằng SELECT trước rồi INSERT trần) · `VS-TRUNG-500`
(quầy trùng → 500). Mỗi đột biến phải làm ĐỎ đúng ca của nó; đối chứng bản không đột biến xanh.

Soát kế hoạch (agent chỉ đọc, 07.11): không ra ngoài Phạm vi; đã thêm ca A10–A13, B5, C6, K3; bỏ chuyển `POST /:id/children`; bỏ phép ném
`sau ≠ truoc + them`; ghi hệ quả Q2 với `sync.js`; ghi `sync.js POST /import` và `kh/index.js:168`.

## Đường song song phải canh (K4)
- Mọi `fetchSXCustomers(` trong customers-v2.js: 4 chỗ (dòng 118, 205, 415, 477) — cả bốn sang `docKhach`.
- Mọi `INSERT INTO pos_customers` (grep: customers.js 363, 402, 615; maKhach.js 186; customers-v2.js 60, 315, 355; sync.js 290): 60 bỏ cùng
  `cacheCustomersToLocal`; 363 + 402 + 186 sang `taoKhach`; 615 (`POST /:id/children`) cũng sang `taoKhach` (cùng QR / mặc định — trong
  customers.js, Phạm vi) — **soát kế hoạch: KHÔNG chuyển** — đường này kế thừa `customer_type` / `sync_status` của khách cha
  (customers.js:625–626), nghiệm thu C không đòi; giữ nguyên. *Lệch kế hoạch (làm khi vá):* chủ quán chốt 07.11 "MỘT hàm tạo khách cho mọi đường" → đã chuyển sang `taoKhach`, vẫn theo loại của mẹ (ca K2, K2c; đột biến BV-NHAN-RIENG-QR). 315, 355 (ghi địa chỉ / ghi chú tự chèn khách) và sync.js ngoài nghiệm thu C → giữ, ghi Phát hiện.
- `generateQRCode(` (grep: maKhach.js 187, sync.js 298) — sync.js ngoài Phạm vi, ghi Phát hiện. `sinhQrKhongTrung` đã dùng ở
  `routes/kh/index.js:168` (App cấp lại QR) — đúng, không đổi.
- `sync.js:204` `POST /import` (UPDATE 265, INSERT 290): đường nhập khách SX bằng FILE còn sống sau khi cắt SX — ngoài Phạm vi, K5 "không đổi
  sync.js"; ghi Phát hiện.
- Người gọi `docKhach` sau này phải dùng hàm, không chép câu ghép.

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
- Quầy SX tắt / không khoá (Replit) → danh sách, tìm, hồ sơ chạy (A2, A7). Khung nâng cấp không hỏng khi SX tắt (B3).
- Khách cũ đăng nhập App (SĐT đã có) → `xacMinhMa` vẫn ra `khachId`, không tạo mới (C3 + bài `thu_KHAPI*` cũ).
- Khách mới App đủ tên + xưng hô → tạo được (C1); thiếu → `CAN_TEN` như cũ (bài cũ `thu_KHQUAY2`, `thu_KHAPI3`).
- Đăng ký chờ / khách chỉ có ví vẫn hiện (A9). Ghi địa chỉ / ghi chú / ngày sinh khách (bài cũ thu_GIOVN1 A2g, thu_KHACHCK1, thu_CT1a).
- Đơn quầy đọc khách qua `/v2/customers/:phone` (`CustomerInput.jsx:67`, `Orders.jsx:384`) vẫn 200 cho mọi khách có trước.

## Ngân sách
Máy chủ: thêm ~165 (docKhach 75, khachMoi 35, 020 45, chay.js 8), bỏ ~250 (customers-v2.js ~200, customers.js ~50) → ròng âm. Thử ~280.
Vượt phiếu ở phần thêm (~150) vì bước chép + móc `layTruoc` — không có cách ngắn hơn mà kho không 503 khi SX tắt.

## Câu hỏi cho chủ quán (cần trả lời trước khi làm)
1. **Màn Khách hàng tạo khách vào `pos_registrations`, không vào `pos_customers`** (`Customers.jsx:115` → `registrations.js:218`). Cắt SX thì
   những khách này mãi "Chờ đồng bộ": vẫn hiện, tìm được (như nay), nhưng không nhập được ngày sinh, không có mã QR thành viên.
   *Đề xuất:* cho thêm `server/routes/registrations.js` vào Phạm vi — `POST /registrations` gọi thêm `taoKhach` (vẫn ghi đăng ký như cũ, màn không
   đổi), và bước 020 chép luôn đăng ký chưa có trong `pos_customers`. Không đồng ý → làm đúng phiếu, ghi Phát hiện.
2. **Mặc định khách mới** — *đề xuất:* chung `customer_type 'retail'`, `sync_status 'retail_only'` (như App; "subscription / new" nghĩa là chờ
   xuất sang SX, nay không còn). Quầy gửi rõ loại thì theo loại đó. **Hệ quả (soát kế hoạch):** `sync.js` chỉ xuất khách `sync_status = 'new'`
   (`sync.js:113, 187`) → khách tạo bằng `POST /customers` không gửi loại sẽ KHÔNG còn vào file xuất SX. Hôm nay không màn nào gọi
   `POST /customers` nên không đổi việc quầy đang làm. Ngược lại (App cũng `new`) thì khách App lọt vào file xuất SX — mình không đề xuất.
3. **Khách SX đã ngừng** (`sx_status` khác 'active') — *đề xuất:* vẫn hiện (khách có tiền / điểm không được mất khỏi danh sách).
4. **Bài cũ `thu_GIOVN1.js` A2j** kiểm hàm bộ đệm phiếu bắt bỏ → sẽ đỏ. Phiếu dặn dừng: xin chat nới A2j trên main trước (đề xuất: chuyển sang
   kiểm giờ ghi của bước 020), hoặc cho phép sửa đúng ca đó trong việc này (thêm vào `## Bài thử cũ sửa`).

## Vòng sửa 2 (chủ quán trả lời Q6, Q7 07.11 + chat soát đổi 021 → 022)
- PA chọn: sửa trong `server/routes/registrations.js` (một nơi dùng — không tách hàm chung, LUAT §3 "≥ 2 chỗ mới vào utils"); điều kiện
  xoá khách viết TRONG một câu `DELETE` (chặn đua, LUAT §5); nhật ký vào bảng có sẵn `pos_sync_logs` (không thêm bảng). PA B — bảng nhật ký
  riêng: rõ hơn nhưng đổi cấu trúc DB (phiếu: không) → loại.
- Ca: C7b (Q7 409), C7c (đua), R1–R1d (Q6a), R2–R2c (Q6b xoá + nhật ký + nhập lại), R3 / R3b (nhân viên / quản lý), R4 × 8 (mỗi dấu vết một
  ca), R5–R5d (khách App, khách có trước, đăng ký đã xuất, 404), R6 (không hai file nâng cấp cùng số).
- Luồng hợp lệ KHÔNG bị chặn (K5): nhân viên vẫn xoá được đăng ký (R3); sửa đăng ký đã xuất vẫn 400 như cũ (R1d); nhập lại SĐT sau khi xoá
  (R2c); "Thêm khách" SĐT mới (C7).
- Bước 022 đổi số: kho nào đã chạy 021 của nhánh này (chỉ kho thử) sẽ chạy 022 thêm một lần — bước lặp lại được (chỉ chép đăng ký chưa là
  khách, chỉ điền ô QR trống), không hại.
