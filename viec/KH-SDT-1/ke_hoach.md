# KH-SDT-1 — kế hoạch (CHỜ CHỦ QUÁN DUYỆT)

**Nói gọn cho chủ quán.** Hôm nay điểm, voucher, đơn, thẻ hạng, ví, gói đều gắn theo SỐ ĐIỆN THOẠI, không gắn theo hồ sơ khách. Quầy bán
cho khách chưa có hồ sơ vẫn cộng điểm vào số đó — nên khi ai đó đăng ký bằng số ấy, họ "thừa hưởng" hết. Mình đề xuất: lúc tạo hồ sơ
mới, máy ghi một **mốc** cho số đó (một dòng điểm "khoá dữ liệu cũ") và khoá voucher cũ; App và màn khách ở quầy chỉ hiện dữ liệu sau
mốc. Công cụ dọn dữ liệu thử là màn riêng chỉ chủ quán mở: liệt kê → tải danh sách → gõ xác nhận → dọn một lần.
**Bạn cần làm:** đọc mục 6 (6 câu hỏi, mỗi câu có đề xuất), trả lời "đồng ý" hoặc sửa, rồi mình làm tiếp.

Mọi số dòng dưới đây đọc trong lượt này trên `87aa996`.

## 1. Điều tra (Nghiệm thu A) — dữ liệu theo SĐT sinh ra mà không cần hồ sơ

| # | Đường | Code | Cần hồ sơ? | Xử lý |
|---|---|---|---|---|
| 1 | Bán ở quầy có SĐT → cộng điểm | `orders.js:868` (chỉ cần `phone`), ghi `:1080` | không | **CỐ Ý** (khách lẻ, KH-QUAY-2: "không tạo khách trước"). Không chặn — mốc B xử lý. Xem Q1. |
| 2 | Bán ở quầy → mua thẻ hạng / gói | `orders.js:1055–1071`, `:1028` | không | như 1; thẻ / gói là tiền thật → Q2 |
| 3 | Nạp ví theo SĐT | `wallets.js:87`, `:296` | không | như 1; tiền thật, không khoá (phiếu) → Q2 |
| 4 | Đổi điểm lấy voucher | `loyalty.js:80` (`/redeem`, không đọc `pos_customers`), ghi `:125`, `:144` | không | như 1 |
| 5 | Thu nợ đơn cũ → cộng điểm | `orders.js:1371` | không | đơn CŨ (trước mốc) thu sau mốc → xem 3.4 |
| 6 | Mã bill nhận điểm / nhận mã | `signup-codes.js:142`, `:283` (dịch vụ / quầy), `kh/index.js:269–270` (App, có token) | quầy: không | như 1 |
| 7 | Mất hồ sơ: không có đường xoá khách | `grep "DELETE FROM pos_customers" server` → 0 chỗ; `customers.js` PUT `/:id` (`:445–505`) không đổi cột `phone` | — | không có đường mở |
| 8 | Mất hồ sơ: khôi phục sao lưu xoá cả bảng rồi chèn lại | `backup.js:386` (`DELETE FROM ${tableDef.name}`) — `pos_customers` KHÔNG nằm trong `BANG_KHONG_KHOI_PHUC` (`:120`) | — | **nghi là nguồn của số 0912345678** (đơn tháng 8 còn, hồ sơ mất). `backup.js` ngoài Phạm vi + SAOLUU-2 đang làm → ghi Phát hiện, không sửa. CHƯA KIỂM được trên production. |

Kết luận: đường sinh mồ côi "còn mở" duy nhất không cố ý là khôi phục sao lưu (8) — thuộc SAOLUU-2. Các đường 1–6 là cách quầy làm việc
hằng ngày, chặn chúng là phá quầy (K5) → giải bằng **mốc lúc tạo hồ sơ** (B + C), đúng như chủ quán chốt 31.10.

Đường TẠO hồ sơ (để gắn mốc) — 8 chỗ (5 gắn mốc):
| Đường | Code | Gắn mốc? |
|---|---|---|
| App xác minh mã, khách mới | `maKhach.js:184–187` (trong giao dịch, `ON CONFLICT DO NOTHING`) | **có** |
| Quầy tạo khách | `customers.js:314` → `:363` | **có** |
| Quầy tạo khách kèm người nhận có SĐT | `customers.js:402` | **có** (mỗi người nhận có SĐT) |
| Quầy thêm người nhận | `customers.js:580` → `:615` | **có** (khi có SĐT) |
| Nhập khách từ SX | `sync.js:289` | **không** — khách SX đã có hồ sơ bên SX, đơn POS cũ của họ là CỦA HỌ. `sync.js` cũng ngoài Phạm vi. |
| Lưu đệm khách SX khi tìm | `customers-v2.js:58` | **không** (như trên) |
| Quản lý sửa địa chỉ / chiết khấu cho SĐT chưa có hồ sơ | `customers-v2.js:327`, `:367` (chú thích `:365`: "khách từ SX **hoặc chưa có trong pos_customers**") | **có** — khách SX đã qua lưu đệm `:58` thì đi nhánh UPDATE, nên nhánh INSERT ở đây thực tế là số chưa từng có hồ sơ (soát kế hoạch bắt) |

Phương án B (bị loại): TRIGGER `AFTER INSERT ON pos_customers` ở bước nâng cấp — bắt mọi đường kể cả SX và khôi phục sao lưu, tức là
khoá oan điểm khách SX và phá bản khôi phục (bảng điểm chèn sau bảng khách); trigger cũng không gọi được `getNow`.

## 2. Mốc — một hàm, một nguồn sự thật (`server/utils/sdtCu.js`, mới)

- **Mốc = dòng `pos_point_transactions` có `type = 'khoa_sdt_cu'`** của SĐT đó (`order_id` NULL, `reason` = "Dữ liệu cũ của số này — khoá
  khi tạo khách mới", `created_at` = `getNow()`). Không có dòng đó → không có mốc → mọi thứ như hôm nay (khách cũ không đổi — E).
- KHÔNG dùng `pos_customers.created_at`: đường SX ghi `CURRENT_TIMESTAMP` UTC (`customers-v2.js:58`, `sync.js:289`) và khách SX được
  tạo hồ sơ muộn khi quầy tìm → sẽ giấu oan đơn của họ.
- Không bảng mới, không cột mới, không bước nâng cấp → không phải sửa `backup.js` (bảng điểm đã có ở `backup.js:73`).
- Hàm:
  - `khoaSdtCu(tx, sdt, now, nguoi)` — gọi trong CÙNG giao dịch tạo hồ sơ, ngay sau câu chèn có `changes === 1`.
    1. Có dữ liệu trước (điểm / voucher / đơn / đơn App theo SĐT) không? Không → không ghi gì.
    2. Điểm: MỘT câu `INSERT … SELECT customer_phone, 'khoa_sdt_cu', -SUM(points), NULL, expires_at, … GROUP BY expires_at` trên các dòng
       còn hạn — **gom theo hạn, chép đúng hạn** (cùng cách `truDiemDon`, `orders.js:1620–1629`) → số dư về 0 ở MỌI thời điểm sau này
       (một dòng trừ không hạn sẽ làm số dư âm khi điểm cũ hết hạn). Không có dòng còn hạn → ghi một dòng 0 điểm làm mốc.
       Câu có `AND NOT EXISTS (… type = 'khoa_sdt_cu' AND customer_phone = ?)` → gọi lại không khoá hai lần.
    3. Voucher: MỌI `pos_voucher_grants` của SĐT có trước mốc (cả đã dùng) → `status = 'khoa_sdt_cu'` (giá trị trạng thái chính là lý do;
       lý do chữ đầy đủ ở dòng mốc) + `pos_discount_codes.is_active = 0` (mã đổi điểm là mã riêng của grant, `loyalty.js:125–150`).
       Khoá cả mã ĐÃ dùng vì huỷ / hoàn đơn cũ trả lượt mã và đặt grant về `available` (`tienDaTra.js:62` `traLuotMa`, gọi ở
       `orders.js:1500`, `:1674`, `refunds.js:172`) — `is_active = 0` giữ mã chết mà không phải sửa `tienDaTra.js` (ngoài Phạm vi). `layVoucherKhach` đã suy `disabled` từ `is_active = 0` (`diemKhach.js:53–58`) → quầy không áp
       được mã (Q3: mã khách mới `pos_signup_codes.claimed_phone`).
  - `mocSdt(q, sdt)` → `created_at` của mốc hoặc `null` — cho mọi đường đọc ở C.

## 3. Thay đổi từng phần

### 3.1 B — khoá khi tạo khách
- `maKhach.js:186`: sau INSERT kiểm `changes`, `=== 1` → `await khoaSdtCu(tx, sdt, now, 'app_kh')`. (+3 dòng)
- `customers-v2.js` PUT `/:phone/address`, `/:phone/discount` nhánh INSERT: bọc giao dịch + `khoaSdtCu`. (~15 dòng)
- `customers.js` POST `/` và POST `/:id/children`: hôm nay chèn bằng `run` trần, KHÔNG giao dịch (`:363`, `:402`, `:615`) → bọc
  `beginTransaction` (chèn + khoá cùng giao dịch), giữ nguyên kiểm trùng / lời báo. (~25 dòng)
- Phương án B (loại): khoá lười lúc đọc lần đầu — "trong cùng giao dịch tạo khách" của phiếu không đạt.

### 3.2 C — không hiện dữ liệu trước mốc (App + màn khách ở quầy)
| Chỗ đọc | Code | Đổi |
|---|---|---|
| `/kh/diem` lịch sử | `diemKhach.js:16–27` | `AND created_at >= moc` (nhánh có mốc); dòng mốc cũng bị giấu khỏi App (`type <> 'khoa_sdt_cu'` ở App) |
| `/kh/voucher` | `diemKhach.js:30–61`, `:66–78` | grant `granted_at >= moc`; mã khách mới theo Q3 |
| `/kh/don`, `/kh/don/:ma` | `donApp.js:252–260` `CAU_DON` | `o.created_at >= ?` và `a.tao_luc >= ?` (moc hoặc `''`) — MỘT câu dùng cho cả hai route, nên `/don/:ma` của đơn cũ → 404 như không có |
| `/kh/don/:ma/huy` | `donApp.js:292` `huyDon` (câu riêng) | thêm `a.tao_luc >= ?` — khách mới không huỷ được đơn App cũ đang chờ |
| Quầy: chi tiết khách | `customers.js:197` (đơn `:234`, số dư `:225`) | **không đổi** — lọc theo `customer_id`, mà `orders.js` không ghi `customer_id` (grep 0 chỗ) → đơn mồ côi vốn không hiện |
| Quầy: khách theo SĐT | `customers-v2.js:449` `/:phone/full` (đơn `:500`) | lọc đơn theo mốc |
| Quầy: điểm theo SĐT | `loyalty.js:49` `/points/:phone` (gọi `layDiemKhach`) | tự đúng nhờ `diemKhach.js`; quầy VẪN thấy dòng mốc (để nhân viên hiểu vì sao về 0) |
- KHÔNG đổi: Báo cáo, Đối soát, màn Đơn hàng (đọc `pos_orders` không theo khách) — tiền không đổi (C, E).
- `BALANCE_SQL` (`diemKhach.js:9`) KHÔNG đổi — số dư đúng nhờ dòng trừ gom theo hạn.
- Phương án B (loại): lọc theo mốc ngay trong `BALANCE_SQL` thay cho dòng trừ — ít dòng hơn nhưng phiếu B đòi "một dòng trừ có lý do",
  và đổi câu số dư đụng `/redeem` (`loyalty.js:116`) + đường tiền.

### 3.3 Đường song song (K4) — phải canh
1. **Huỷ / xoá đơn CŨ sau khi khoá** → `truDiemDon` (`orders.js:1620`) chèn dòng trừ điểm của đơn đó, chép hạn → khách mới bị âm 500
   tới khi hạn hết. Vá trong CÙNG câu: `AND NOT EXISTS (mốc của SĐT có id > id dòng earn)`. Ca thử riêng.
2. **Thu nợ đơn CŨ sau mốc** (`orders.js:1371`) → điểm cộng mới cho người đăng ký sau. Đề xuất an toàn (LUAT §6.6): không cộng điểm cho
   đơn tạo trước mốc, ghi Phát hiện. Xem Q4.
3. **Nhận điểm bằng mã bill CŨ** (`signup-codes.js:252`) — người cầm tờ bill thật; giữ như hôm nay (không đổi). Ghi trong hợp đồng.
4. Dòng mốc `type='khoa_sdt_cu'` không có `order_id` → không lọt các phép `type = 'earn'` / `'adjust'` theo đơn (`nhanDiem.js:16`,
   `hoaDon.js:47`, `orders.js:1373`, `:1625`). Grep lại toàn kho `type` của bảng điểm khi làm.
5. `/kh/toi` hiện **thẻ hạng** và **số dư ví** theo SĐT (`kh/index.js:48–57`, `:155–157`) — chưa khoá, chờ Q2.

### 3.4 D — công cụ dọn dữ liệu thử (chỉ chủ quán)
- Máy chủ: `server/utils/donThu.js` (tiêu chí → danh sách; dọn) + `server/routes/don-thu.js`, mount ở `server/index.js`, mọi route
  `role === 'owner'` như `backup.js:209` (403 `CHI_CHU_QUAN`).
  - `POST /api/pos/don-thu/liet-ke` `{ truoc_ngay?, sdt?: [] }` → số dòng + tổng tiền từng bảng, danh sách đơn / SĐT, **ví ≠ 0 tách riêng**,
    kèm `ma_xac_nhan` = băm của (tiêu chí + danh sách id) — không ghi gì.
  - `POST /api/pos/don-thu/don` `{ tieu_chi, ma_xac_nhan, go_xac_nhan: 'DON DU LIEU THU' }` → liệt kê lại, băm khác (dữ liệu đổi giữa hai
    bước) → 409 `DANH_SACH_DA_DOI`; khớp → MỘT giao dịch: chụp nguyên mọi dòng sẽ xoá vào nhật ký `pos_sync_logs` (`type='don_thu'`,
    `details` = tiêu chí + số dòng + bản chụp JSON, `created_by`, `created_at=getNow()`) rồi xoá; trả file JSON bản chụp để tải.
  - Chạy lại → liệt kê ra 0 → "không có gì để dọn", không ghi nhật ký mới.
- **Sao lưu trước**: (a) bản chụp nguyên dòng nằm TRONG giao dịch dọn (khoá, không lời dặn); (b) màn hình bắt bấm "Tải sao lưu toàn bộ"
  (`/api/pos/backup/export-all`, `backup.js:205`) trước khi nút Dọn mở. (b) máy chủ không kiểm được → ghi CHƯA KIỂM. Xem Q5.
- Bảng dọn theo đơn (cùng danh sách xoá đơn hiện có `orders.js:1687–1718`): `pos_orders`, `pos_order_items`, `pos_refund_requests`,
  `pos_damage_logs`, `pos_promotion_usage`, `pos_invoice_logs`, `pos_membership_purchases`, `pos_customer_packages`, `pos_signup_codes`,
  `pos_point_transactions`, `pos_order_log`; theo SĐT: điểm, voucher (+ mã đổi điểm chưa dùng), ví = 0 (+ sổ ví), khách, đăng ký.
  **Không dọn** (chỉ liệt kê): ví ≠ 0 (cả mọi đơn / sổ của SĐT đó), `pos_doi_soat_ghi`, `pos_payos_su_kien`, `pos_phien_thanh_toan`,
  phiếu kho — xem Q5.
- Ngày X phải **trước hôm nay**: mã đơn = số lớn nhất trong ngày + 1 (`helpers.js:29–43`) → xoá đơn hôm nay làm mã bill đã in bị dùng lại.
- Giao diện: một thẻ trong `client/src/pages/QuanLy/` (chỉ hiện với owner) mở `client/src/pages/DonThu.jsx` + route ở `App.jsx`; gọi qua
  `utils/api.js` (chỉ `import`, không sửa file đó — ngoài Phạm vi). Ba bước: chọn tiêu chí → xem bảng + tải CSV → tải sao lưu, gõ xác nhận, Dọn.
- Phương án B (loại): script dòng lệnh `cong_cu/` chạy trên Render shell — chủ quán không chạy được, không phân quyền.

### 3.5 Hợp đồng App
`HOP_DONG_API_KH.md`: không đổi tên trường; ghi thay đổi HÀNH VI của `/diem`, `/voucher`, `/don`, `/don/:ma` (chỉ dữ liệu sau mốc), tăng
`PHIEN_BAN`, nhật ký cuối file. `cong_cu/thu_HOPDONG_KH.js` chạy lại.

## 4. Ca thử `cong_cu/thu_KHSDT1.js` — ánh xạ 1-1 nghiệm thu (đỏ trên `87aa996`)
| Ca | Nghiệm thu | Nội dung |
|---|---|---|
| T1 | A | Bán quầy có SĐT chưa hồ sơ → có dòng earn (đường 1 tồn tại — ghi lại, không chặn) |
| T2 | B | SĐT X có 500 điểm còn hạn (2 hạn khác nhau) + 1 voucher + 1 đơn, không hồ sơ → App xác minh khách mới → `/kh/diem` points=0, lịch sử rỗng; dòng mốc có lý do; voucher `disabled` và grant `status='khoa_sdt_cu'`; `/kh/don` rỗng; `/kh/don/<mã cũ>` 404 |
| T3 | B | Cùng cảnh qua quầy: `POST /customers` (kèm `children` có SĐT), `POST /customers/:id/children`, `PUT /v2/customers/:phone/discount` + `/address` nhánh tạo mới |
| T4 | B | Tua giờ qua hạn lô điểm thứ nhất → số dư vẫn 0 (không âm) |
| T5 | B | Gọi `khoaSdtCu` lần hai / App xác minh lần hai cùng SĐT → không thêm dòng |
| T6 | B (đua) | Hai yêu cầu xác minh cùng lúc cùng SĐT → đúng MỘT hồ sơ, đúng một bộ dòng mốc |
| T7 | C | Sau mốc khách mới mua → điểm cộng bình thường, `/kh/don` chỉ có đơn mới; quầy `/v2/customers/:phone/full` chỉ đơn mới; quầy `/loyalty/points/:phone` có dòng mốc; màn Đơn hàng (`GET /orders`) vẫn có đơn cũ; Báo cáo / Đối soát ngày cũ không đổi tổng |
| T7b | C (K4) | Khách mới `POST /kh/don/<mã App cũ>/huy` → 404; huỷ / hoàn đơn cũ đã dùng voucher → mã vẫn không áp được |
| T8 | C (K4) | Huỷ đơn CŨ sau mốc → số dư khách mới không đổi |
| T9 | C (K4) | Thu nợ đơn cũ sau mốc → theo Q4 |
| T10 | D | Liệt kê theo ngày và theo danh sách SĐT: đúng số dòng, ví ≠ 0 tách riêng; tải được file CSV đúng các dòng đó; không ghi gì (so cả kho trước–sau) |
| T11 | D | Dọn sai chữ xác nhận / thiếu `ma_xac_nhan` / dữ liệu đổi giữa hai bước → 400 / 409, kho không đổi |
| T12 | D | Dọn đúng → đúng số dòng đã liệt kê, nhật ký có ai / lúc / tiêu chí / số dòng / bản chụp; SĐT ví ≠ 0 không đụng |
| T13 | D | Chạy lại → 0 dòng, không nhật ký mới; ngày X = hôm nay → 400 |
| T14 | D | Nhân viên (không owner) gọi liệt kê / dọn → 403 |
| T15 | E (K5) | Khách CÓ hồ sơ từ trước: điểm, voucher, ví, gói, thẻ — so toàn bảng trước–sau B và D (ngoài phần đã dọn) bằng nhau; hoàn tiền một đơn của khách cũ sau B chạy như trước; tổng Báo cáo / Đối soát các đơn KHÔNG dọn bằng nhau trước–sau D |
| T16 | E (K5) | Khách SX qua `cacheCustomersToLocal` / nhập SX → KHÔNG có mốc, đơn cũ vẫn hiện |
| T17 | E (K5) | Khách mới đăng ký mà SĐT KHÔNG có dữ liệu cũ → không có dòng nào thêm |
| T18 | B (giao dịch) | Ép lỗi ngay sau câu khoá (giả lập ném) → không có hồ sơ, không dòng mốc, voucher không đổi (cùng giao dịch) |
CHƯA KIỂM được bằng máy: chủ quán đã thật sự tải bản sao lưu toàn bộ trước khi dọn (bước (b) ở 3.4).
Bài cũ chạy lại: `thu_KH1.js`, `thu_KHMUA1.js`, `thu_DIEMTHAT1.js`, `thu_HOPDONG_KH.js` (Phạm vi cho sửa nếu danh sách trắng đổi).
Đột biến (`dot_bien.py`): `BV-khoa-app` (gỡ gọi ở maKhach), `BV-khoa-quay`, `VS-khoa-khong-gom-han` (một dòng trừ không hạn → T4 bắt),
`VS-khoa-ngoai-tx`, `BV-moc-don` (gỡ lọc CAU_DON), `BV-tru-diem-cu` (T8), `VS-don-khong-bam` (bỏ so `ma_xac_nhan` → T11),
`VS-don-vi-khac-0` (T12), `BV-chi-chu-quan` (T14).

## 5. Luồng hợp lệ phải KHÔNG bị chặn (K5)
Bán quầy cho SĐT chưa hồ sơ (vẫn cộng điểm) · khách có hồ sơ mua / đổi quà / huỷ đơn như cũ · khách SX · đăng ký số chưa từng có dữ liệu
· nhận điểm bằng mã bill thật · Báo cáo / Đối soát / Đơn hàng ngày cũ · xoá đơn của owner (`orders.js` DELETE) với đơn mới.

## 6. Câu hỏi cho chủ quán — mỗi câu có đề xuất

- **Q1 (quan trọng nhất) — khách vừa mua ở quầy rồi mới đăng ký App.** Theo KH-QUAY-2, khách mới mua ở quầy (đơn cộng điểm vào SĐT, chưa
  có hồ sơ), nhân viên cấp mã, khách đăng ký App. Làm đúng chữ "bắt đầu từ 0" thì **điểm của chính đơn vừa mua cũng bị khoá**.
  **Đề xuất:** chỉ khoá dữ liệu cũ hơn N ngày trước lúc đăng ký; dữ liệu trong N ngày giữ nguyên (của chính người đăng ký). N là cài đặt
  `sdt_cu_ngay`, đề xuất **30** (nhà mạng chỉ cấp lại số đã bỏ lâu hơn thế). Nếu bạn muốn đúng "từ 0" tuyệt đối thì nói "khoá hết".
- **Q2 — thẻ hạng, gói, ví của số cũ.** App `/toi` đang hiện thẻ hạng + số dư ví theo SĐT; gói cũng theo SĐT. Đây là tiền thật nên phiếu
  không cho tự khoá. **Đề xuất:** việc này KHÔNG khoá ba thứ đó, chỉ hiện trong danh sách của công cụ dọn để bạn xử lý tay; sau dọn thử thì
  thực tế chỉ còn trường hợp nhà mạng cấp lại số — ghi Phát hiện để làm phiếu riêng nếu cần.
- **Q3 — mã ưu đãi khách mới đã nhận bằng số đó trước khi đăng ký** (`pos_signup_codes.claimed_phone`). **Đề xuất:** coi như voucher cũ —
  khoá nếu cũ hơn N ngày (theo Q1).
- **Q4 — thu nợ một đơn CŨ (trước mốc) sau khi người mới đăng ký.** **Đề xuất:** đơn trước mốc không cộng điểm khi thu nợ (an toàn, không
  hứa điểm). Từ khi bỏ ghi nợ thì chỉ còn trong dữ liệu cũ.
- **Q5 — công cụ dọn.** **Đề xuất:** (a) không dọn sổ đối soát két, báo tiền ngân hàng (payOS), phiên thanh toán, phiếu kho — chỉ liệt kê
  (đó là sổ tiền / kho thật, dọn đơn không cần đụng); (b) bắt tải sao lưu toàn bộ trên màn hình + máy tự chụp nguyên các dòng xoá vào nhật
  ký; (c) chữ phải gõ: `DON DU LIEU THU`.
- **Ghi chú Q1:** chọn N ngày thì N là hằng số có tên trong `sdtCu.js` (màn Cài đặt ngoài Phạm vi); muốn chỉnh trên màn hình thì thêm
  `client/src/pages/Settings.jsx` vào Phạm vi. Soát kế hoạch nhận xét: không chọn N thì đơn giản hơn và đúng chữ nghiệm thu B — đổi lại
  khách vừa mua ở quầy mất điểm đơn đó khi đăng ký.
- **Q6 — ngân sách.** Ước: máy chủ ~320 dòng (sdtCu ~70, donThu ~150, route ~40, sửa chỗ gọi ~60), giao diện ~180, thử ~450 — vượt nhẹ
  phần thử vì D có 5 ca. **Đề xuất:** chấp nhận; hoặc tách D ra phiếu `KH-SDT-2` để làm B + C trước (khai trương 07.11 cần C trước, D chỉ
  cần chạy một lần trước khai trương).

## 7. Rủi ro
- Dòng điểm loại mới `khoa_sdt_cu`: màn quầy nào liệt kê `type` theo danh sách cố định có thể hiện nhãn lạ — grep `client/src` khi làm.
- `customers.js` POST đổi từ `run` trần sang giao dịch: đổi thứ tự trả lỗi trùng SĐT nếu không cẩn thận — ca thử giữ nguyên 400.
- Khôi phục sao lưu (đường 8) vẫn có thể làm mất hồ sơ sau khai trương → SAOLUU-2.
