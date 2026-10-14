# GOI-2 — kế hoạch (CHỜ DUYỆT — chưa viết bài thử, chưa sửa code)

Số dòng dưới đây đọc trong lượt này trên HEAD `be1a404` (= main `65206b6` sổ v29 + phiếu).

## 0. Hiện trạng đọc được (K1 — file:dòng lượt này)

| Chỗ | Đang làm |
|---|---|
| `packages.js:167–182` GET /customer-packages/all | một dòng một gói, có `customer_name`, `last_delivery_at` (dùng `dieuKienLayTuGoi`) |
| `packages.js:185–196` GET …/:id/deliveries | lịch sử giao: `o.id`, `order_code`, `created_at`, món |
| `packages.js:205–220` PUT …/:id/cancel | "Dừng gói": `refund_package`, bắt lý do, `UPDATE … WHERE id=? AND status='active'`, KHÔNG đụng tiền |
| `orders.js:907–920` | lấy từ gói: lấy đủ → `status='completed'` (tự xong) |
| `orders.js:1018–1047` | mua gói (+ lấy ngay): `pkg_qty` gói, mỗi gói `order_id` = đơn mua; lấy đủ ngay → `completed` |
| `orders.js:1326–1344` `hoanVi` | `soTienHoan` → ví mẹ trước; phần ví khách: dòng `cash` + giảm `total_spent` (= `tuVi`), phần vượt dòng `hoan_goi`, KHÔNG giảm `total_spent` |
| `orders.js:1351–1415` huỷ đơn | cổng `UPDATE pos_orders … WHERE status='completed'`; đơn mua gói: quyền `refund_package`, gói đã giao → `cancelled`, chưa giao → xoá |
| `orders.js:1432–1449`, `:1566–1580` | huỷ / xoá đơn LẤY từ gói: trả lượt, `completed` → `active` — **gói `cancelled` vẫn bị trả lượt** (Câu hỏi Q-C) |
| `orders.js:1516–1562` xoá đơn | chỉ owner; `completed` → `hoanVi`; xoá mọi gói của đơn |
| `refunds.js:20–28, 118, 157` | đơn có gói KHÔNG hoàn qua yêu cầu (`DON_CO_GOI`) — chặn cả lúc TẠO (:118) lẫn DUYỆT (:157); đường song song đã đóng sẵn, không phải sửa |
| `tienDaTra.js:16–28` `tienDaTraTheoDong` | giá đã trả mỗi dòng (sau flash / hạng, chia theo tỉ lệ total − ship, làm tròn xuống); dòng gói có `product_id = −package_id` |
| `tienDaTra.js:35–52` `soTienHoan` | đơn có gói: đã trả (total − nợ) − giá trị đã dùng, trừ tiền đã đền; ví mẹ trước |
| `wallets.js:60–77` `ghiVi` | chỗ duy nhất ghi ví |
| `bat_bien.js:179–191` I11, `:310–316` I19 | I11: mỗi ví, mỗi đơn, hoàn (trừ `hoan_goi`) ≤ ví đó đã trả; I19: mỗi đơn còn, hoàn + đền ≤ total − nợ |
| `Reports.jsx:17–25, 59–110, 363–440` | đọc `?tab=packages&goi=`; lọc Tất cả / Đang giao / Sắp hết / Xong + nút sắp xếp "Lâu chưa lấy"; nút "Dừng gói" trên MỌI dòng active (`window.prompt`) |
| `Settings.jsx:1154–1155` | tên gói là chữ; chỉ "🔒 N KH" là `Link` sang Báo cáo |
| `Customers.jsx:144–157, 161–170` | đọc `?phone=`; chi tiết khách KHÔNG có dòng gói nào |
| `Orders.jsx:24–27, 46, 180–187` | chỉ tải đơn theo khoảng ngày (mặc định HÔM NAY, `orders.js:58–69` lọc `DATE(created_at)`); ô tìm `searchCode` lọc trong danh sách đã tải; không đọc đường dẫn |
| `thu_GOI1.js:353–396` | A5 thử "Dừng gói"; A5h soi `window.prompt` + chữ "Dừng gói" ở Reports.jsx — **sẽ đổi** (hành vi CỐ Ý đổi, A8) |

## 1. Danh sách gom theo khách (A1, A2) — máy chủ gom

- **A (chọn):** route mới `GET /packages/customer-packages/theo-khach` trong `packages.js` dùng lại câu SELECT của `/all` (tách thành
  một hằng chuỗi dùng chung, không viết câu thứ hai), rồi gom bằng hàm thuần `gomTheoKhach(goi, bayGio)` trong `goiKhach.js`:
  `[{ customer_phone, customer_name, so_goi, con_lai, moc_lay, ngay_chua_lay, lau, goi: [...] }]`.
  - `con_lai` = Σ (total − delivered) của gói `active`; `moc_lay` = max(`last_delivery_at` ‖ `created_at`) trên gói `active`;
    `lau` = `ngay_chua_lay > 30` (một hằng `NGAY_LAU_CHUA_LAY = 30` ở `goiKhach.js` — Câu hỏi Q-E).
  - Lọc ở máy chủ (`?loc=dang_dung|lau|xong&q=`): `dang_dung` = khách có ≥ 1 gói active (mặc định); `lau` = khách có gói active
    và `lau`; `xong` = khách có ≥ 1 gói `completed`/`cancelled`. `q` khớp tên (không phân biệt hoa thường) hoặc SĐT. `?goi=<id>`
    (đường bấm 1) giữ khách có gói đó; `?phone=` (đường bấm 3) đúng một khách.
  - Ước lượng: packages.js ~+15, goiKhach.js ~+30.
  - Lý do chọn: A1 đòi số cụ thể (còn lại, ngưỡng 30 ngày ±1, tìm tên / SĐT) — ở máy chủ thì bài thử HTTP so được bằng số trên kho
    thật (K3); gom ở màn hình chỉ thử được bằng phép tĩnh.
- **B (bỏ):** gom trong `Reports.jsx` từ `/all` — ít hơn ~10 dòng máy chủ nhưng A1 chỉ còn phép tĩnh soi chữ (yếu, bài học Q-A GOI-1).
- `/all` giữ nguyên (không ai khác gọi ngoài Reports — sẽ grep `client/src` lúc làm; còn ai gọi thì giữ).

**Q3 — gói `active` đã lấy đủ → "Đã xong" (A2):**
- **A (chọn):** một lệnh sửa có điều kiện chặt chạy đầu route `theo-khach`:
  `UPDATE pos_customer_packages SET status='completed', updated_at=? WHERE status='active' AND delivered_qty >= total_qty` —
  chạy lại vô hại (lần sau 0 dòng), không xoá gì; sau đó MỌI chỗ đọc (khoá sửa gói ở Cài đặt "🔒 N KH", màn Bán hàng) cùng thấy
  `completed`. 1 dòng. Code mới không sinh ra trạng thái lệch nữa (`orders.js:912, :1039` tự `completed`) — dữ liệu lệch là đồ cũ.
- **B (bỏ):** nắn ở tầng đọc (`CASE WHEN …` ) — phải lặp điều kiện ở `/all`, `countActiveUsers`, `active_users` (3 chỗ, K4).
- Thêm `AND delivered_qty < total_qty` vào UPDATE của route Kết thúc gói (mục 2) → gói đủ mà chưa được nắn cũng không kết thúc được.

## 2. "Kết thúc gói" (A3, A5) — MỘT route, MỘT hàm tính, MỘT hàm ghi

- **A (chọn): mở rộng route có sẵn** `PUT /customer-packages/:id/cancel` (đã có quyền `refund_package`, bắt lý do, cổng
  `WHERE status='active'`) thêm `hoan: true|false`. Không gửi `hoan` = không hoàn (giữ nguyên hành vi GOI-1 → A5 cũ vẫn xanh).
  - `hoan: true`, TRONG MỘT `beginTransaction()`: đọc gói → `soTienHoanGoi(tx, cp)` → cổng
    `UPDATE … SET status='cancelled', notes=? WHERE id=? AND status='active' AND delivered_qty < total_qty` (≠ 1 dòng → rollback
    400, hai người cùng bấm chỉ một lần hoàn) → `ghiHoan(tx, …)` → commit. `so_tien` client gửi (số đã hiện trong hộp) khác số
    tính lại → rollback 409 `GOI_HOAN_DOI_SO` kèm số mới (có người lấy hàng giữa lúc xem và lúc bấm). Không bao giờ trả theo số
    client gửi (CLAUDE.md §5.1).
  - `GET /customer-packages/:id/hoan-du-kien` → `{ tong, me, vi, tien_mat }` từ CÙNG `soTienHoanGoi` (đọc không giao dịch) — số
    hiện trong hộp TRƯỚC khi xác nhận.
  - notes gói: `Kết thúc gói (hoàn <n>đ | không hoàn): <lý do> — <người> <thời điểm> (đã lấy d/t)`. Dòng ví: `ghiChu`
    `Hoàn kết thúc gói KH #<cp.id> (đơn <mã>)`, `order_id` = đơn mua (đối soát I11 / I19 theo đơn như cũ).
  - Ước lượng packages.js ~+30.
- **B (bỏ):** route mới riêng cho (a) — lặp quyền, lý do, cổng trạng thái (~+20 dòng), hai cổng cho cùng một gói.

**Hàm tính** `soTienHoanGoi(tx, cp)` trong `tienDaTra.js` (~+20): đơn mua `cp.order_id` phải `completed` (không có đơn / không
thấy dòng gói `−package_id` → 400 "không tìm thấy giá đã trả — chỉ kết thúc không hoàn"); giá một gói = `da_tra ÷ quantity`
của dòng (chia đều khi một dòng mua nhiều gói); `goc = floor(giá × (total − delivered) ÷ total)` (làm tròn xuống — không bao giờ
hoàn quá, cùng chiều `soTienHoan` làm tròn LÊN phần đã dùng). Cách chia ví mẹ / ví khách / tiền mặt: Câu hỏi Q-A (đề xuất ở đó).

**Hàm ghi dùng chung (yêu cầu A3):** tách thân ghi của `hoanVi` (`orders.js:1331–1343`) thành `ghiHoan(tx, order, { me, tuVi,
tienMat }, { nguoi, luc, ghiChu, ghiChuMe })` đặt cạnh `ghiVi` trong `wallets.js` (~+15, `orders.js` −10): `tuVi` → dòng `cash`
+ `total_spent`, `tienMat` → dòng `hoan_goi` không `total_spent`, `me` → ví mẹ + `total_spent` mẹ. `hoanVi` chỉ còn tính
`soTienHoan` + gọi `ghiHoan` với ĐÚNG chuỗi ghi chú cũ → huỷ / xoá đơn không đổi một số nào (P26c 93/93 phải giữ nguyên).
B (bỏ): gọi `hoanVi` từ packages.js — nó tính theo cả đơn, không theo một gói.

## 3. Không hoàn hai lần (A4) — một điều kiện, hai chỗ gọi

- Hàm `goiDaKetThuc(tx, orderId)` trong `goiKhach.js` (1 câu: `SELECT 1 FROM pos_customer_packages WHERE order_id=? AND
  status='cancelled' LIMIT 1`).
- Huỷ đơn (`orders.js` sau dòng 1372, TRƯỚC cổng UPDATE đơn): `order.status === 'completed' && await goiDaKetThuc(...)` →
  rollback 400 `GOI_DA_KET_THUC`, lời "Gói đã kết thúc — xử lý ở Báo cáo → Gói SP".
- Xoá đơn (`orders.js` trước `hoanVi` dòng 1546): cùng điều kiện, cùng lỗi.
- Vì sao kèm `order.status === 'completed'`: đơn ĐÃ huỷ có gói `cancelled` do chính lệnh huỷ (`orders.js:1404–1408`) — xoá đơn đã
  huỷ là luồng hợp lệ (K5), huỷ lần hai vẫn phải ra lời cũ "đã được hủy trước đó".
- Hai người: Kết thúc và Huỷ đơn đều trong giao dịch ghi; ai trước thắng — Kết thúc trước → huỷ thấy gói `cancelled` (400); Huỷ
  trước → gói đã `cancelled`/xoá → cổng `status='active'` của Kết thúc thua (400), không ghi ví. Route Kết thúc kiểm thêm đơn
  `completed` trong `soTienHoanGoi`.
- Đường song song đã rà: duyệt hoàn `refunds.js:172` đã chặn mọi đơn có gói (không sửa); đền bù `damages.js` ghi `compensation`
  (tính vào trần ở Q-A, không chặn). Gói "Dừng" bằng GOI-1 trên dữ liệu thật (đơn `completed`) cũng bị chặn huỷ — đúng A4 "(b)".
- ~+8 dòng `orders.js`, +3 `goiKhach.js`.

## 4. Màn hình (A1, A5, A6)

- **Reports.jsx (~±90):** bảng mỗi khách một dòng (Khách + SĐT · số gói · còn lại túi · lần lấy gần nhất + "… tháng chưa lấy"
  khi `lau`), bấm dòng mở gói của khách (tên, ngày mua, giá, đã lấy / tổng, trạng thái, lịch sử giao tải khi mở như cũ). 3 nút
  lọc (mặc định "Đang dùng"), bỏ "Tất cả", "Sắp hết", nút sắp xếp riêng. Trạng thái `completed` hiện "Đã xong", `cancelled`
  hiện "Đã kết thúc". Nút "Kết thúc gói…" CHỈ trong phần mở ra của gói `active` còn túi, chỉ `hasPermission('refund_package')`.
  Hộp xác nhận (một khối trong trang, không popup nhiều bước): 2 ô chọn — "Hoàn phần còn lại vào ví khách: <số từ hoan-du-kien>"
  / "Không hoàn tiền" — ô lý do, dòng "Không mở lại được"; chưa chọn / chưa lý do → lời báo đỏ tại chỗ, không gửi. 409 đổi số →
  hiện số mới, bắt bấm lại. Thay `window.prompt` của "Dừng gói".
- **Settings.jsx (~+2):** tên gói bọc `Link` `/reports?tab=packages&goi=<id>` (như "🔒 N KH").
- **Customers.jsx (~+12):** mở chi tiết khách → gọi `GET /packages/customer-packages/theo-khach?phone=<SĐT>` (cùng số với Báo cáo;
  không dùng `/customer/:phone` — nó chạy `daLayTheoLoai` từng gói, thừa), hiện "Gói đang dùng: N gói · còn
  X túi →" (`Link` `/reports?tab=packages&phone=<SĐT>`); 0 gói active thì không hiện.
- **Orders.jsx (~+6):** `useSearchParams`, `?code=<mã>&ngay=<YYYY-MM-DD>` → điền sẵn `searchCode` VÀ đặt `dateFrom = dateTo = ngay`
  (màn chỉ tải đơn theo ngày, mặc định hôm nay — chỉ điền mã thì đơn mua tháng trước không hiện; soát kế hoạch bắt). Không đổi máy chủ.
- **Reports.jsx chi tiết gói:** ngày mua → `Link` `/orders?code=<mã đơn mua>&ngay=<ngày mua>` (thêm `order_code` vào SELECT dùng chung, JOIN `ob`
  có sẵn); từng lần giao → `/orders?code=<order_code>&ngay=<ngày giao>` (`deliveries` đã trả `order_code`).
- Màn Bán hàng (`Sales.jsx`) KHÔNG đụng (Q5). Không thêm `fetch` trần — dùng `api` (bánh cóc).
- Sau sửa: `(cd client && npm run build)`, commit `client/dist/` (P1).

## 5. Tổng ngân sách

Máy chủ ~+110 / −15 (packages ~45, goiKhach ~35, tienDaTra ~20, wallets ~15, orders ~+10/−10); màn hình ~+110 / −60;
bài thử ~+250 trong `thu_GOI1.js`. Trong ngân sách phiếu (200–300 code).

## 6. Ca thử — ánh xạ 1-1 với Nghiệm thu (thêm vào `cong_cu/thu_GOI1.js`, mục `[GOI2-…]`)

| Nghiệm thu | Ca (máy chủ: HTTP trên kho libsql tạm; màn hình: phép tĩnh soi ĐÚNG phần tử) | Đỏ trên gốc vì |
|---|---|---|
| A1 | B1a khách X 2 gói active (10/30, 0/30) + 1 gói completed → một dòng, `so_goi` 3, `con_lai` 50; B1b gói cancelled không cộng `con_lai`; B1c mốc 31 ngày → `lau` true, 30 ngày → false (ngay trên / ngay dưới, K3); chưa lấy lần nào tính theo ngày mua; B1d `loc=lau` chỉ X, `loc=xong` chỉ khách có gói xong / kết thúc, mặc định = `dang_dung`; B1e `q=` khớp tên (hoa thường) và một phần SĐT; B1f `goi=`/`phone=` lọc đúng; B1g phép tĩnh: Reports.jsx gọi `theo-khach`, có ĐÚNG 3 nút lọc, không còn "Tất cả" / "Sắp hết" | route chưa có (404) |
| A2 | B2a gói active 30/30 → sau GET là `completed`, gói 29/30 vẫn active, không mất dòng nào (đếm bảng trước / sau); B2b Kết thúc gói active 30/30 (chưa nắn) → 400 | chưa nắn |
| A3 | B3a 1.350.000, 10/30 → `hoan-du-kien` 900.000, PUT hoàn → ví +900.000, gói cancelled, notes có lý do + người + "900"; B3b chưa lấy → hoàn đủ giá đã trả; B3c đơn mua có giảm giá → theo giá đã trả; B3d một dòng `pkg_qty` 2 → mỗi gói một nửa; B3e đơn trả bằng ví mẹ → về ví mẹ (theo Q-A); B3f đơn trả ví một phần → dòng `cash` + `total_spent` cho phần ví, dòng `hoan_goi` cho phần còn (theo Q-A); B3g nhân viên / quản lý không quyền → 403; thiếu lý do → 400, ví không đổi; B3h `so_tien` lệch → 409, ví không đổi; B3i **hai người cùng bấm** (2 PUT song song) → đúng một 200, ví cộng một lần; B3j I11 + I19 của `bat_bien.js` sạch sau mọi ca | không có trường `hoan` (ví không đổi) |
| A4 | B4a kết thúc có hoàn → huỷ đơn mua → 400 `GOI_DA_KET_THUC`, ví không đổi; B4b như trên với xoá đơn; B4c kết thúc không hoàn → huỷ / xoá → 400; B4d **cùng lúc** Kết thúc ‖ Huỷ đơn → tổng ví nhận ≤ một khoản | huỷ vẫn 200 + hoàn lần hai |
| A5 | B5a `hoan: false` → 200, ví / sổ ví không đổi, notes "không hoàn"; A5a–A5g GOI-1 giữ nguyên; B5b phép tĩnh: nút "Kết thúc gói…" nằm TRONG khối mở ra (không ở dòng), có điều kiện `refund_package`; hộp: hai lựa chọn, chữ "Không mở lại được", chưa chọn / chưa lý do → không gọi `api.put` | chưa có hộp |
| A6 | B6a Settings.jsx: tên gói trong `Link` `/reports?tab=packages&goi=${pkg.id}`; B6b Reports.jsx tên khách → `/customers?phone=` (giữ GOI-1); B6c Customers.jsx: `Link` `/reports?tab=packages&phone=`; B6d Reports.jsx: `Link` `/orders?code=` ở ngày mua và lần giao; B6e Orders.jsx đọc `searchParams.get('code')` vào `searchCode`; ca đường dẫn = B1f (máy chủ lọc đúng theo `goi`/`phone`) | chưa có |
| A7 (K5) | B7a huỷ đơn mua gói CHƯA kết thúc → 200, số hoàn đúng như P26c (so số); B7b xoá đơn mua gói chưa kết thúc → 200; B7c xoá đơn ĐÃ huỷ có gói đã giao → 200 (không bị A4 chặn); B7d huỷ đơn đã huỷ → lời cũ `DON_KHONG_HUY_DUOC`; B7e lấy từ gói vẫn 200; B7f mua gói + lấy ngay 200; `thu_P26c.js` 93/93, GOI-1 51 ca cũ xanh (trừ A5h đổi có chủ ý) | xanh cả gốc (K5) |
| A8 | build `client/`, `npm test`, `--day-du` 0 cảnh báo; `dot_bien.py`: mục 7 | — |
| A9 | quy tắc đối soát ghi ở `trang_thai.md` (mục 8) | — |

**Ca bổ sung sau soát kế hoạch (thêm vào bảng trên):**
- A2: B2c phép tĩnh Reports.jsx: `completed` → "Đã xong", `cancelled` → "Đã kết thúc" (soi đúng bảng TRANG_THAI).
- A3: B3k dòng ví có `#<cp.id>` trong ghi chú; notes gói có thời điểm (khớp mẫu ngày giờ). B3l kết thúc LẦN LƯỢT 2 gói cùng một đơn
  (ví mẹ + ví một phần) → tổng về ví mẹ ≤ phần mẹ đã trả, dòng `cash` ≤ `balance_amount`, I11 / I19 sạch (trần cộng dồn Q-A).
  B3m đền bù SAU khi kết thúc (damages.js:168–186 đền món khác cùng đơn) → I19 vẫn sạch.
- A4: B4e lỗi 400 kèm đúng câu "Gói đã kết thúc — xử lý ở Báo cáo → Gói SP" (so nguyên câu, ngoài mã).
- A5: B5c phép tĩnh: chưa chọn / chưa lý do → `set…Loi(...)` hiện trong hộp (phần tử báo lỗi nằm trong khối hộp), không chỉ "không gọi api.put".
- A6: B6f Reports.jsx đọc `searchParams.get('phone')` và gửi `phone=` lên `theo-khach`; B6g Customers.jsx dòng "Gói đang dùng: N gói ·
  còn X túi →" chỉ khi N > 0; B6h Orders.jsx đọc `ngay` vào `dateFrom`/`dateTo`.
- A8: chạy lại `viec/P26c/dot_bien.py` + `viec/GOI-1/dot_bien.py` và `python3 viec/HOC-2b/kiem_neo.py`; ghi từng đột biến LẠC.

**Đề xuất soát đã KHÔNG nhận (kèm lý do):** đưa `hoan_du_kien` vào `theo-khach` cho mọi gói active thay route riêng — mỗi gói một lần
`tienDaTraTheoDong` (vài trăm câu trên Turso mỗi lần mở Báo cáo); route riêng chỉ chạy khi mở hộp. Giữ phép 409 `so_tien` — phiếu đòi
số tiền hiện TRƯỚC khi xác nhận; không có 409 thì có người lấy hàng giữa chừng là chủ quán xác nhận một số, máy hoàn số khác.

## 7. Đột biến dự kiến (`viec/GOI-2/dot_bien.py`) — mỗi chỗ vá ≥ 1 VS + 1 BV

| Chỗ vá | VS (vá sai) | BV (bỏ vá) |
|---|---|---|
| `gomTheoKhach` còn lại | `VS-GOI2-CON-LAI-GOM-HUY` (cộng cả gói cancelled) | `BV-GOI2-GOM` (route trả danh sách phẳng) |
| ngưỡng lâu | `VS-GOI2-LAU-GE` (`>` → `>=`) | `BV-GOI2-LAU` (`lau` luôn false) |
| tìm tên | `VS-GOI2-TIM-HOA-THUONG` (bỏ lowerCase) | — gộp BV-GOI2-GOM |
| nắn Q3 | `VS-GOI2-NAN-GT` (`>=` → `>`, bỏ sót 30/30) | `BV-GOI2-NAN` (bỏ lệnh UPDATE) |
| tính hoàn | `VS-GOI2-HOAN-GIA-NIEM-YET` (dùng `pkg_price` thay giá đã trả), `VS-GOI2-HOAN-KHONG-CHIA-SL` (bỏ `÷ quantity`) | `BV-GOI2-HOAN` (`hoan` bị bỏ qua) |
| cổng một lần | `VS-GOI2-CONG-NGOAI-GD` (ghi ví trước cổng / ngoài giao dịch) | `BV-GOI2-CONG` (bỏ `AND status='active'`) |
| chia ví | `VS-GOI2-ME-KHONG-TRAN` (ví mẹ không trần), `VS-GOI2-TIEN-MAT-TOTAL-SPENT` (phần tiền mặt giảm total_spent) | — gộp BV-GOI2-HOAN |
| chặn A4 | `VS-GOI2-CHAN-CHI-HUY` (chặn huỷ, quên xoá — K4), `VS-GOI2-CHAN-MOI-TRANG-THAI` (bỏ `order.status==='completed'` → B7c đỏ) | `BV-GOI2-CHAN` |
| hộp xác nhận | `VS-GOI2-HOP-KHONG-BAT-CHON` | `BV-GOI2-NUT-TREN-DONG` (nút về lại dòng) |
| đường bấm | `VS-GOI2-ORDERS-KHONG-DOC-CODE` | `BV-GOI2-LINK-TEN-GOI` |

Tách `ghiHoan` khỏi `orders.js` làm LẠC 3 đột biến P26c neo vào `orders.js:1333–1334` (`viec/P26c/dot_bien.py:44–46`:
`VS-H2-khong-ghi-hoan-goi`, `VS-H2-hoan-goi-giam-total-spent`, `VS-H2-mot-dong-hoan-goi`) — `viec/P26c/` ngoài Phạm vi, không sửa:
`viec/GOI-2/dot_bien.py` dựng lại đúng ba lỗi đó trên chỗ mới (`wallets.js`) và phải BẮT bằng `thu_P26c.js`; ghi trong
`trang_thai.md` để chủ quán chuyển neo P26c (Câu hỏi Q-F).
Đột biến GOI-1 neo vào Reports.jsx "Dừng gói" / `window.prompt` sẽ LẠC (hành vi CỐ Ý đổi) — chạy `kiem_neo.py`, ghi rõ từng cái
trong `trang_thai.md`, không sửa `viec/GOI-1/`.

## 8. Đường song song phải canh (K4)

`hoanVi` huỷ ↔ xoá (cùng `ghiHoan`); chặn A4 huỷ ↔ xoá; duyệt hoàn `refunds.js` (đã chặn — ca B7: không cần sửa, ghi lại);
huỷ / xoá đơn LẤY từ gói đã kết thúc (Q-C); đền bù sau kết thúc (B3m); `Sales.jsx:376` đọc `/customer/:phone` — thấy
`completed` sau nắn Q3 (đúng: gói đủ không lấy được nữa), không sửa; `/all` ↔ `theo-khach` (một câu SELECT dùng chung); `countActiveUsers` + `active_users`
nhờ nắn Q3 ở dữ liệu.

## 9. Luồng hợp lệ KHÔNG bị chặn (K5)

Huỷ / xoá đơn mua gói chưa kết thúc (P26c) · xoá đơn đã huỷ · huỷ đơn lấy từ gói · lấy từ gói · mua gói + lấy ngay · gia hạn ·
"Dừng gói" cũ không gửi `hoan` · quản lý được cấp `refund_package` · gói 29/30 không bị nắn · đơn không có gói (cổng A4 chỉ khi có
gói `cancelled`).
