# GOI-1 — kế hoạch (CHỜ DUYỆT — chưa viết bài thử, chưa sửa code)

Số dòng dưới đây đọc trong lượt này trên HEAD `93163f3` (= main `9a68ab6` + sổ việc v28 + phiếu).

## 0. Hiện trạng đọc được (K1 — file:dòng lượt này)

| Chỗ | Đang làm |
|---|---|
| `packages.js:36–55` POST / | nhận `total_qty` client gửi (chỉ kiểm ≥ 1), `price || 0` → lưu được gói 0đ; `package_items` lưu nguyên |
| `packages.js:58–96` PUT /:id | như POST; khoá khi có KH active trừ khi chỉ bật/tắt (`isToggleOnly`, dòng 70) |
| `packages.js:120–143` GET /customer/:phone | `delivered_items` = món `product_id > 0 AND unit_price = 0` của MỌI đơn gắn gói — **gồm cả đơn đã huỷ**; nhóm theo `oi.product_code` |
| `packages.js:146–157` GET /customer-packages/all | không tên khách, không lần lấy gần nhất |
| `packages.js:180–191` PUT /customer-packages/:id/cancel | quyền `manage_users`, lý do tuỳ chọn, chặn `completed` nhưng KHÔNG chặn đã `cancelled`, UPDATE không có `AND status='active'` (hai người bấm cùng lúc đều 200) |
| `orders.js:200–235` | trước giao dịch: gói đúng chủ, `active`, còn lượt TỔNG |
| `orders.js:240–276` | `monDuocLayTuGoi` = Set khoá `type_id` từ `package_items` — chỉ biết loại nào được lấy, KHÔNG biết số |
| `orders.js:378–385` | mua gói + lấy ngay: chặn TỔNG vượt `soLuotGoi`, không chặn theo loại |
| `orders.js:882–895` | trong giao dịch: trừ TỔNG có trần (`delivered_qty + ? <= total_qty`) |
| `orders.js:1405–1425` huỷ, `:1539–1555` xoá | trả lượt = món `product_id > 0 AND (unit_price = 0 OR NULL)` — đây là "cách máy chủ nhận món lấy từ gói" |
| `Sales.jsx:107, 421–428, 542–546` | chặn theo loại bằng `delivered_items.find(d => d.product_code === product.code)` — chỉ màn hình |
| `Settings.jsx:355–371` savePkg | gửi `total_qty` gõ tay, `price || 0`, **bỏ âm thầm** loại SL ≤ 0 (`filter(i => i.qty > 0)`) |
| `Settings.jsx:1150` | "🔒 N KH" là chữ, không bấm được |
| `Reports.jsx:15, 52–71, 83–92, 344–426` | tab mặc định `daily` (không đọc URL); 2 `fetch` trần không kiểm `res.ok`; nhóm theo SĐT, tìm SĐT/tên gói |
| `Customers.jsx:68–86, 142–157` | không đọc URL; `openDetailModal(customer)` mở chi tiết từ danh sách `customersV2Api.list()` |
| `middleware/auth.js:84–110` | `checkPermission`: owner luôn qua; vai trò khác tra `pos_permissions` |
| `database.js:982` | `refund_package` có sẵn (P26c), mặc định chỉ owner |
| `customers-v2.js:49–70` | `pos_customers` (phone đã `normalizePhone`, name) là bản đệm khách SX |

## 1. Hàm dùng chung `server/utils/goiKhach.js` (A2) — file MỚI ~35 dòng

- `DIEU_KIEN_LAY_TU_GOI` (một chuỗi SQL): `o.customer_package_id = ? AND o.status != 'cancelled' AND oi.product_id > 0 AND
  (oi.unit_price = 0 OR oi.unit_price IS NULL)` — đúng điều kiện huỷ/xoá đang trả lượt (`orders.js:1411–1412`, `:1542–1543`),
  thêm loại đơn đã huỷ.
- `daLayTheoLoai(db, cpId)` → `[{ sx_product_type, sx_product_id, product_code, delivered_qty }]`, JOIN `pos_products` theo
  `oi.product_id` để ra khoá `type_id` (giống `package_items`), `product_code` = `p.code` (Sales.jsx so theo `product.code` —
  giữ nguyên dạng trả về → **Sales.jsx không phải sửa**). `db` = `{ query }` thường hoặc `tx`.
- `vuotTheoLoai(dsGoi, daLay, xin)` → `null` hoặc `{ code, con }` của loại đầu tiên vượt; chỉ xét loại `qty > 0` (như Sales.jsx:422).

Phương án B (bỏ): thêm cột `from_package` vào `pos_order_items` — đổi cấu trúc DB, phiếu ghi "không".

## 2. Chặn theo loại ở máy chủ (A2) — `orders.js` ~+20 dòng

- Đọc `package_items` một lần (dòng 240–276) giữ thêm danh sách có `qty` (`dsGoi`) bên cạnh `monDuocLayTuGoi`.
- **Lấy từ gói cũ**: TRONG giao dịch, ngay trước UPDATE trừ tổng (dòng 884): `daLay = await daLayTheoLoai(tx, cpId)`, xin = gom
  `orderItems.from_package` theo khoá; vượt → `tx.rollback()` + 400 `GOI_HET_LUOT_LOAI`, lời "`<mã>` chỉ còn `<n>` trong gói".
  Cùng giao dịch "write" với phép chặn tổng → hai quầy cùng bấm: một đơn thua.
- **Mua gói + lấy ngay (K4 — đường song song)**: cạnh phép chặn tổng dòng 383, `vuotTheoLoai(dsGoi, [], xin)` (gói chưa tồn tại,
  đã lấy = 0). Chỉ PHÉP KIỂM chạy trước giao dịch; tạo gói + trừ lượt vẫn chạy SAU khi chốt (`orders.js:994–1026`, có sẵn,
  không đổi). Mua nhiều gói (`pkg_qty > 1`): phần lấy ngay đổ hết vào gói đầu (`:1007`) → trần theo loại tính trên MỘT gói.
- Lỗi 400 kèm trường `loai` (mã loại) + `con` (số còn) để bài thử so cấu trúc, không dò chữ (E12).
- `packages.js` GET /customer/:phone: `delivered_items = await daLayTheoLoai({query}, pkg.id)` — một công thức, sửa luôn lỗi đếm
  đơn đã huỷ cho màn Bán hàng.

Phương án B (bỏ): chặn trước giao dịch như phép tổng dòng 228 — hai quầy cùng bấm lọt (A2 đòi cùng giao dịch).

## 3. Tổng tự tính + chặn giá 0 (A1, A3) — `packages.js` ~+15, `Settings.jsx` ~+10/−5

Máy chủ (một hàm `chuanHoaGoi(body, existing)` dùng cho cả POST và PUT, trả lỗi hoặc `{ total_qty, items }`):
- có `package_items` không rỗng (PUT không gửi thì lấy của gói đang lưu): mỗi loại phải SL nguyên ≥ 1, sai → 400
  `GOI_LOAI_SL_SAI` nêu mã loại; `total_qty` = tổng SL, bỏ qua số gửi.
- không có danh sách: giữ `luotHopLe(total_qty)` như P26c.
- giá: POST bắt buộc `price > 0`; PUT kiểm khi có gửi `price` → 400 `GOI_GIA_KHONG_HOP_LE`.
- PUT chỉ bật/tắt (không gửi `total_qty`, `package_items`, `price`) đi đường cũ, không qua hai phép trên.

Màn hình `Settings.jsx`: ô "Tổng SL SP" `readOnly` + hiện tổng tự tính khi có loại; savePkg báo lỗi khi giá ≤ 0 hoặc có loại tích
mà SL ≤ 0 (bỏ `filter(i => i.qty > 0)`); gửi tổng tự tính (máy chủ vẫn tự tính lại).

Phương án B (bỏ): chỉ sửa màn hình — gọi API thẳng vẫn lưu lệch (A1 đòi máy chủ).

## 4. Danh sách gói của khách (A4) — `packages.js` ~+8, `Reports.jsx` ~±70, `Settings.jsx` ~+2, `Customers.jsx` ~+10

Máy chủ GET /customer-packages/all thêm hai cột (một câu, không N+1):
- `customer_name` = `COALESCE(c.name, ob.customer_name)` — `LEFT JOIN pos_customers c ON c.phone = cp.customer_phone` (hai bên
  đều đã `normalizePhone`: `orders.js:509`, `customers-v2.js:52`), dự phòng tên trên đơn mua gói `ob` (`cp.order_id`). Không có
  thì để trống — không bịa (H.8).
- `last_delivery_at` = `MAX(o.created_at)` của đơn thoả `DIEU_KIEN_LAY_TU_GOI` (dùng chung chuỗi ở mục 1).
- KHÔNG thêm tham số lọc ở máy chủ — lọc theo gói ở màn hình (ngắn hơn; soát kế hoạch).
- GET /customer-packages/:id/deliveries (`packages.js:162–173`) dùng cùng `DIEU_KIEN_LAY_TU_GOI` → lịch sử giao bỏ đơn đã huỷ /
  món có giá, khớp "lần lấy gần nhất" (một công thức cho cả ba chỗ đếm).

Màn hình:
- `Reports.jsx`: `useSearchParams` → `tab=packages` mở thẳng tab, `goi=<id>` lọc gói (hiện chip "Gói: <tên> ✕" để bỏ lọc).
  **Phương án A (chọn):** đổi danh sách nhóm-theo-SĐT thành BẢNG phẳng một dòng một gói, cột đúng Q4: Khách (tên + SĐT, tên là
  `<Link to="/customers?phone=…">`) · Gói · Đã lấy/Tổng (> 100 % chữ đỏ + nền đỏ) · Ngày mua · Lần lấy gần nhất ("chưa lấy" nếu
  trống) · Trạng thái · nút "Dừng gói" (mục 5). Bấm dòng → mở lịch sử giao như nay. Tìm theo tên + SĐT + tên gói. Nút sắp xếp
  "Lâu chưa lấy" (tăng dần theo `last_delivery_at`, gói chưa lấy lần nào tính theo ngày mua) / mặc định như nay (đang giao lên đầu,
  mới mua trước — thứ tự máy chủ). Giữ 4 ô thống kê + thanh tiến độ + 4 nút lọc trạng thái.
  2 `fetch` trần → `api.get` / `api.put` (api.js kiểm `res.ok`) → hạ `NGUONG_FETCH` 34 → 32.
- **Phương án B (bỏ):** giữ thẻ nhóm theo SĐT, nhét thêm cột vào từng gói — sắp theo "lần lấy gần nhất" từng gói không khớp với
  nhóm theo khách, phải sắp nhóm theo gói cũ nhất; nhiều dòng hơn, khó đọc hơn.
- `Settings.jsx:1150`: "🔒 N KH" thành `<Link to={`/reports?tab=packages&goi=${pkg.id}`}>`. Mở từ liên kết lọc theo gói VÀ đặt sẵn lọc
  "Đang giao" cho khớp số N (chủ quán chốt C2, 13.10).
- `Customers.jsx`: `useSearchParams` đọc `phone`; khi danh sách tải xong, tìm khách có `phone` trùng (đã chuẩn hoá) →
  `openDetailModal`. Không thấy (SX sập + chưa đệm) → báo "Không tìm thấy khách <SĐT>" (không mở modal giả).

## 5. Dừng gói (A5) — `packages.js` sửa route có sẵn ~+8, `Reports.jsx` ~+12

Route PUT /customer-packages/:id/cancel:
- `checkPermission('refund_package')` (thay `manage_users`) — owner luôn qua, vai trò khác chỉ khi chủ quán cấp.
- `reason` (hoặc `notes`) `trim()` rỗng → 400 `GOI_THIEU_LY_DO`.
- Đọc gói chỉ để 404 + dựng `notes`. `UPDATE … SET status='cancelled', notes=?, updated_at=? WHERE id=? AND status='active'`;
  `changes !== 1` → 400 `GOI_KHONG_DUNG_DUOC` — một phép chặn cả gói đã xong, đã dừng lẫn hai người cùng bấm. `notes` = ghi chú cũ (nếu có) + `Dừng gói: <lý do> — <username> <now> (đã lấy d/t)`.
- KHÔNG đụng ví, sổ tiền, `delivered_qty`, đơn. Lấy hàng sau đó → `GOI_HET_HIEU_LUC` (`orders.js:222–226`, có sẵn).

Màn hình: nút "Dừng gói" chỉ hiện ở gói `active` và khi `hasPermission('refund_package')`; bấm → `window.prompt` lý do (rỗng thì
không gửi) → `api.put` → tải lại danh sách. Không popup nhiều bước.

## 6. Bài thử `cong_cu/thu_GOI1.js` (~250 dòng, khuôn `thu_P26c.js`: database.js + libsql thật trên kho tạm, SX giả, owner /
manager / staff) + `--may-chu` / `--client` cho đột biến. Thêm vào danh sách `chayBaiThat` của `kiem_tra_truoc_khi_giao.js:492`
(THÊM phép — được phép).

Ánh xạ 1-1 với Nghiệm thu (mỗi ca: trên gốc phải ĐỎ trừ ca K5 "phải KHÔNG bị chặn"):

| Mục | Ca | Kỳ vọng sau vá |
|---|---|---|
| A1 | A1a POST gói 6 loại 5+5+5+5+5+6, gửi `total_qty` 30 | 200, `pos_packages.total_qty` = 31 |
| | A1b PUT gói chưa khoá đổi danh sách (3+4), gửi 99 | 200, lưu 7 |
| | A1c POST gói KHÔNG danh sách, gửi 12 / gửi 0 | 200 lưu 12 / 400 `GOI_LUOT_KHONG_HOP_LE` |
| | A1f PUT gói KHÔNG danh sách đổi tổng 8 → lưu 8; đổi 0 → 400 | đạt |
| | A1d loại tích SL 0 / SL −2 / SL 1.5 | 400 `GOI_LOAI_SL_SAI`, không có dòng gói mới |
| | A1e tĩnh Settings.jsx: ô Tổng `readOnly` khi có loại; ô hiện giá trị tổng tự tính (`reduce` SL loại); savePkg không còn `filter(i => i.qty > 0)`, có chặn SL ≤ 0 + return | đạt |
| A2 | A2a CT1 cài 5, đã lấy 3 (đơn thật qua POST /orders), xin 3 | 400 `GOI_HET_LUOT_LOAI`, `delivered_qty` không đổi, ví không đổi |
| | A2b cùng gói xin 2 | 200, gói đã lấy CT1 = 5 |
| | A2c đơn lấy 3 CT1 bị HUỶ → `delivered_items` CT1 = 0 và xin 5 → 200 (gốc: đếm cả đơn huỷ) | đạt |
| | A2d hai quầy cùng bấm (Promise.all) CT1 cài 5, đã lấy 3, mỗi đơn xin 2, tổng còn dư | đúng một 200 + một 400; CT1 đã lấy = 5 |
| | A2e mua gói + lấy ngay 6 CT1 (CT1 cài 5, tổng gói 31) | 400 `GOI_HET_LUOT_LOAI`, không tạo gói / đơn |
| | A2g mua 2 gói (`pkg_qty` 2) + lấy ngay 6 CT1 (CT1 cài 5) | 400 `GOI_HET_LUOT_LOAI` (trần 5, không phải 10) |
| | A2h món `unit_price` NULL (chèn thẳng DB) trong đơn gắn gói được đếm là đã lấy (cùng cách huỷ/xoá trả lượt) | đạt |
| | A2i lỗi 400 có `loai` = mã CT1, `con` = 2 | đạt |
| | A2f `delivered_items` của GET /customer/:phone khớp `daLayTheoLoai` (cùng số, có `product_code`) | đạt |
| A3 | A3a POST giá 0 / giá −1 | 400 `GOI_GIA_KHONG_HOP_LE` |
| | A3b PUT gói chưa khoá đổi giá về 0 | 400 |
| | A3c tĩnh Settings.jsx savePkg chặn giá ≤ 0 + return | đạt |
| A4 | A4a GET /customer-packages/all có `customer_name` (từ `pos_customers`; khách không có trong bảng → tên trên đơn mua gói) và `last_delivery_at` = ngày đơn lấy cuối, bỏ đơn huỷ | đạt |
| | A4e khách KHÔNG có trong `pos_customers` → `customer_name` = tên trên đơn mua gói; không có cả hai → rỗng (không bịa) | đạt |
| | A4f lịch sử giao bỏ đơn đã huỷ, khớp `last_delivery_at` | đạt |
| | A4b tĩnh Reports.jsx: đọc `tab`/`goi` từ URL; có `Link` tới `/customers?phone=`; lọc theo `goi` (`package_id`); tìm theo `customer_name` + `customer_phone`; có cột ngày mua + trạng thái; > 100 % tô đỏ; có sắp theo `last_delivery_at` | đạt |
| | A4c tĩnh Settings.jsx: "N KH" là Link tới `/reports?tab=packages&goi=` | đạt |
| | A4d tĩnh Customers.jsx: đọc `phone` từ URL rồi gọi `openDetailModal` | đạt |
| A5 | A5a staff / manager dừng gói | 403 |
| | A5b owner lý do rỗng / toàn dấu cách | 400 `GOI_THIEU_LY_DO`, gói vẫn active |
| | A5c owner lý do "khách thôi" | 200, `cancelled`, `notes` chứa lý do + `owner` + thời điểm (`updated_at` của gói); ví / sổ ví / `delivered_qty` / số đơn không đổi |
| | A5d dừng lại gói đã dừng / gói `completed` | 400 / 400 |
| | A5e hai owner cùng dừng (Promise.all) | một 200 + một 400 |
| | A5f lấy hàng từ gói đã dừng | 400 `GOI_HET_HIEU_LUC` |
| | A5h tĩnh Reports.jsx: nút "Dừng gói" chỉ hiện với `hasPermission('refund_package')` + gói active; lý do rỗng thì không gửi | đạt |
| | A5g manager được cấp `refund_package` → 200 (K5: quyền cấp được) | đạt |
| A6 | (K5 — phải KHÔNG bị chặn, XANH cả gốc lẫn sau vá) bán gói mới có danh sách → 200, cp.total_qty = tổng loại; lấy trong giới hạn từng loại → 200; gói KHÔNG danh sách lấy loại bất kỳ → 200; huỷ đơn lấy hàng → `delivered_qty` và `delivered_items` CT1 đều giảm đúng; bật/tắt gói có KH (giá 0 cũ, không gửi giá) → 200; mua gói + lấy ngay trong giới hạn loại → 200; gia hạn (`customer_package_id` + `package_buy`, không lấy) → 200; xoá gói chưa dùng → 200; gói cũ có `total_qty` lệch tổng loại vẫn bán / lấy được, dữ liệu không bị sửa | đạt |
| A7 | `npm test`, `--day-du` xanh 0 CẢNH BÁO; build client; `dot_bien.py` (mục 7); chạy lại `viec/P26c/dot_bien.py` | đạt |
| A8 | `trang_thai.md` có mục "Đối soát Dừng gói" | có |

Ca hai người cùng bấm (đường tiền): A2d, A5e.

## 7. Đột biến `viec/GOI-1/dot_bien.py` (mỗi chỗ vá ≥ 1 VS + 1 BV)

| Chỗ vá | VS (vá sai) | BV (bỏ vá) |
|---|---|---|
| tổng tự tính | `VS-GOI1-TONG-GUI` lưu số client gửi khi có danh sách | `BV-GOI1-TONG` gỡ phép tính tổng |
| SL loại ≤ 0 | `VS-GOI1-SL-LOC` lọc âm thầm thay vì 400 | `BV-GOI1-SL` gỡ phép |
| giá ≤ 0 | `VS-GOI1-GIA-AM` chỉ chặn `< 0` | `BV-GOI1-GIA` gỡ phép |
| chặn theo loại | `VS-GOI1-LOAI-NGOAI-TX` kiểm bằng `query` trước giao dịch (A2d bắt) | `BV-GOI1-LOAI` gỡ phép trong tx |
| mua + lấy ngay | `VS-GOI1-MUA-TONG` chỉ kiểm tổng | `BV-GOI1-MUA-LOAI` gỡ phép |
| đếm đã lấy | `VS-GOI1-DEM-HUY` bỏ `status != 'cancelled'` | `BV-GOI1-DEM` `delivered_items` (`packages.js` GET /customer/:phone) về câu SQL cũ |
| tên khách / lần lấy | `VS-GOI1-TEN-DON` chỉ lấy tên đơn mua (bỏ JOIN khách) | `BV-GOI1-LAN-LAY` gỡ `last_delivery_at` |
| dừng gói | `VS-GOI1-DUNG-QUYEN` về `manage_users`; `VS-GOI1-DUNG-DUA` bỏ `AND status='active'` | `BV-GOI1-LYDO` gỡ kiểm lý do |
| lịch sử giao | `VS-GOI1-LS-HUY` lịch sử giao tính cả đơn huỷ | `BV-GOI1-LS` về câu SQL cũ |
| màn hình | `VS-GOI1-O-TONG` ô Tổng sửa được; `VS-GOI1-NUT-QUYEN` nút Dừng hiện với mọi người | `BV-GOI1-NUT` gỡ nút, `BV-GOI1-LINK` (Settings), `BV-GOI1-URL` (Reports), `BV-GOI1-DO` (> 100 %), `BV-GOI1-KH-URL` (Customers) |

Đột biến P26c: chạy lại `viec/P26c/dot_bien.py` trên HEAD; dự kiến không đổi mong đợi (bài P26c tạo gói KHÔNG danh sách, giá
100.000 — `thu_P26c.js:146, 334`). Nếu có đột biến P26c phải đổi mong đợi: `viec/P26c/dot_bien.py` NGOÀI Phạm vi → DỪNG, ghi `## Câu hỏi`.

## 8. Các đường song song cần canh (K4)

- Ba chỗ nhận "món lấy từ gói": huỷ (`orders.js:1411`), xoá (`:1542`), đếm mới (`goiKhach.js`) — dùng cùng điều kiện; huỷ/xoá
  KHÔNG sửa (ngoài mục tiêu, đang đúng), chỉ cùng điều kiện món.
- Hai đường lấy từ gói: gói cũ (`customer_package_id`, kiểm trong tx) + mua và lấy ngay (`package_buy`: kiểm trước tx, tạo gói +
  trừ lượt sau khi chốt — có sẵn).
- Ba chỗ đếm "đã lấy": `delivered_items`, `last_delivery_at`, lịch sử giao — cùng `DIEU_KIEN_LAY_TU_GOI`.
- Hai đường lưu gói: POST + PUT — dùng chung `chuanHoaGoi`.
- Ba màn đọc "đã lấy theo loại": Sales.jsx (giữ nguyên dạng `delivered_items`), máy chủ chặn, Reports (chỉ tổng).
- `fetch` trần: mọi gọi mới trong Reports đi qua `api.js`.

## 9. Luồng hợp lệ phải KHÔNG bị chặn (K5) — mỗi luồng một ca ở A6 / A5g / A1c

bán gói mới · lấy trong giới hạn từng loại · gói không danh sách lấy loại nào cũng được · mua gói + lấy ngay trong giới hạn ·
gia hạn (`customer_package_id` + `package_buy`, không lấy — `orders.js:186`) · huỷ đơn lấy hàng trả lượt · bật/tắt gói có KH
(kể cả gói cũ giá 0 / tổng trống — không gửi giá/tổng) · xoá gói chưa dùng · gói cũ đã lưu `package_items` có SL > 0 nhưng
`total_qty` lệch: KHÔNG tự sửa dữ liệu cũ (chỉ tính lại khi lưu lần sau).
(Khách đã lấy vượt 150 %: `delivered_qty ≥ total_qty` → đã `completed` / `GOI_HET_LUOT` (`orders.js:222, 228`) — không lấy thêm
được, như nay; không phải luồng cần giữ.)

## 10. Ngân sách

Code ~185 dòng (goiKhach 35 · packages 35 · orders 20 · Settings 15 · Reports 70 · Customers 10) + thử ~270 dòng — trong
khung 150–250 + ~250 của phiếu.

## 11. Câu hỏi / chỗ cần chủ quán xem khi duyệt

- C1 (Reports) Đổi danh sách nhóm-theo-SĐT thành bảng phẳng một dòng một gói (mục 4A) — được không? Bảng mới vẫn giữ 4 ô thống
  kê, thanh tiến độ, 4 nút lọc, bấm dòng xem lịch sử giao.
- C2 Mở từ "🔒 N KH" thì lọc sẵn "Đang giao" (khớp số N) — hay "Tất cả" (thấy cả khách đã xong / đã dừng của gói đó)?
- C3 Gói "chưa lấy lần nào" xếp theo ngày mua khi sắp "Lâu chưa lấy" (khách mua lâu mà chưa lấy lên đầu) — đúng ý?
- C4 (Phát hiện, không làm) Gói NTD đang khoá (14 KH) mà "Tổng SL SP" trống → từ P26c không bán thêm được (`GOI_CHUA_CAI_LUOT`,
  `orders.js:382`) cho tới khi tạo gói mới; GOI-1 không đổi luật khoá. Nếu muốn cho phép "tính lại tổng từ danh sách" trên gói
  đang khoá (không ảnh hưởng khách cũ — số lượt mỗi khách lưu riêng ở `pos_customer_packages.total_qty`) thì cần chủ quán chốt.
- C6 Huỷ đơn MUA gói của gói đã DỪNG (`orders.js:1376–1388`, đường hoàn tiền P26c — Cấm sửa): ghi đè `notes` (mất lý do dừng);
  gói chưa lấy lần nào thì XOÁ hẳn dòng gói. Xoá đơn mua gói (`:1527–1536`) cũng xoá hẳn gói. Trái tinh thần Q5 "giữ lịch sử"?
  GOI-1 không đụng (tiền hoàn P26c bị Cấm) — đề xuất việc sau nếu chủ quán muốn.
- C7 (Phát hiện) `package_buy` không kèm SĐT: không tạo gói (`orders.js:994` `&& phone`) nhưng món lấy ngay vẫn 0đ, không chỗ nào
  chặn trước. Để việc sau.
- C5 (Phát hiện, không làm) "💰 DT gói" ở Reports (`Reports.jsx:77`) cộng cả gói đã dừng / đã huỷ — đối soát cần tách (DOI-SOAT-1).

## 12. Chủ quán duyệt kế hoạch `21736a8` (13.10)
- C1 đồng ý bảng phẳng. C2 mở từ "N KH" đặt sẵn lọc "Đang giao". C3 có — chưa lấy lần nào tính theo ngày mua.
- C4 không đổi luật khoá (đã có NTD30, NTD cũ ngừng bán). C5, C6, C7 → `## Phát hiện` của `trang_thai.md`, không làm.

## 13. Giữ neo đột biến P26c (K4 / TU-CHAY-5) — `viec/P26c/dot_bien.py` NGOÀI Phạm vi
Các chuỗi P26c đang neo phải còn NGUYÊN, đúng số lần: `packages.js` `if (!luotHopLe(total_qty)) return res.status(400).json(LUOT_SAI);`,
`if (total_qty !== undefined && !luotHopLe(total_qty)) return res.status(400).json(LUOT_SAI);`, `Number.isInteger(Number(v)) && Number(v) >= 1`;
`Settings.jsx` `if (!(parseInt(pkgForm.total_qty) >= 1)) { setMessage('Lỗi: Tổng SL SP của gói phải từ 1 trở lên'); return; }`.
Vì vậy: tổng tự tính được GÁN vào `total_qty` TRƯỚC hai phép P26c (máy chủ), và ô Tổng trên form được cập nhật mỗi lần đổi loại
(phép P26c ở savePkg đọc đúng số). Sau vá: so neo từng đột biến P26c bằng script nháp + chạy lại `viec/P26c/dot_bien.py`.

## 14. Tên thật khi làm (ghi sau soát vòng 3 — kế hoạch đã duyệt giữ nguyên)
- Mục 3 / 8 "`chuanHoaGoi(body, existing)`" → code thật: `tongTheoLoai(ds)` trong `packages.js`, POST và PUT cùng gọi.
- Mục 7: tên đột biến thật là bảng ở `trang_thai.md` bước 5 / `dot_bien.py` (vd VS-GOI1-SL-LOC → VS-GOI1-SL-CHI-AM,
  VS-GOI1-MUA-TONG → VS-GOI1-MUA-NHAN-GOI, VS-GOI1-LS-HUY + BV-GOI1-LAN-LAY → BV-GOI1-LS + VS-GOI1-LAN-LAY-HUY, BV-GOI1-NUT →
  VS-GOI1-NUT-QUYEN + BV-GOI1-NUT-LYDO).
