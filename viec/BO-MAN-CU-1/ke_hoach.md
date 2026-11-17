# BO-MAN-CU-1 — kế hoạch (CHỜ CHỦ QUÁN DUYỆT)

## Lời thường (đọc trước)
Việc này là gì: quầy chỉ còn màn Bán hàng mới; màn cũ bị xoá. Máy chủ khoá thêm: không ai tạo được đơn trừ tài khoản / chuyển khoản
mà KHÔNG qua bước PIN / QR, và tạm ngưng gói ở mọi đường của quầy.

Phần máy chủ NHỎ (khoảng 15 dòng). Phần NẶNG là bài thử cũ: 22 bài thử đang dựng đơn trừ tài khoản, chuyển khoản hoặc gói bằng đường cũ,
nên phải chuyển sang đường mới. Đây là lý do bản này chờ bạn duyệt.

Bạn cần làm gì:
1. Đọc **mục 7 — Câu hỏi** (4 câu, mỗi câu có đề xuất của mình). Trả lời "đồng ý cả 4" là đủ.
2. Câu 1 là bắt buộc: phiếu phải ghi ĐÚNG TÊN 6 file bài thử. Lý do: người gác coi các file này là "file luật" và chặn sửa nếu phiếu chỉ
   ghi kiểu `cong_cu/gia_lap/**`.

---

## 0. Đã đọc (lượt này, HEAD `d52b9fb`)
- Màn chọn: `client/src/pages/BanHang/index.jsx:1-35`. Mặc định ra MÀN CŨ (`cfg.bat ? <BanHangMoi …/> : <Sales />`, dòng 34). Công tắc
  `?man=moi|cu` ở dòng 15-26. `docCongTac` / `ghiCongTac` ở `BanHang/tinh.js:8-56`. Bật CHỈ khi chuỗi là `'1'`.
- Bảng ⚙: `BanHangMoi.jsx:467-478`. Có chữ "Màn bán hàng mới (máy này)" (dòng 470) và nút "Tắt — về màn cũ" (dòng 476).
- Đường tạo đơn: `server/routes/orders.js:183` `taoDon(req, res, phien = null)`. Route thẳng `:1443` `router.post("/", authenticate, (req, res) => taoDon(req, res))`.
- **Cổng đã có:** `orders.js:252-260`. Cổng chặn đường thẳng trừ tài khoản / chuyển khoản, nhưng CHỈ KHI cài đặt `thanh_toan_payos_bat_buoc = '1'`.
  `server/database.js:1114` gieo `'0'`, và không màn nào bật được nó (grep `client/src` = 0 chỗ). Nghĩa là trên quầy thật hôm nay:
  **đường thẳng đang nhận trừ tài khoản và chuyển khoản mà không PIN, không QR.**
  Cổng này đã có mã lỗi `VI_PHAI_QUA_PIN` / `CK_PHAI_QUA_PAYOS`, dùng lại được.
- Gói: mua `package_buy` (`orders.js:275-291, 369, 505-516, 1214-1240`), lấy từ gói `customer_package_id` / `from_package`
  (`:314-330, 352-392, 450-478, 1059-1066, 1133-1140`). Chỉ `taoDon` ghi gói. `packages.js` chỉ có đọc, sửa mẫu gói và kết thúc gói
  (`:24-243`), không có lối lấy món.
- Phiên: `server/utils/giuCho.js`. `TRUONG_DON` (dòng 29-30) cho `customer_package_id`, `package_buy` đi qua phiên. `taoPhien` gọi `taoDon`
  với `{ chiTinh: true }` (dòng 80). `chotPhien` gọi `taoDon` với `phien` đầy đủ (dòng 164).
- Màn mới KHÔNG gọi `POST /orders`. `BanHangMoi.jsx` chỉ gọi `ordersApi.tinhThu` (dòng 154), `ordersApi.get` (240) và `thanhToanApi.*`.
  `ordersApi.create` chỉ có ở `Sales.jsx:736` (grep `ordersApi\.\w*` toàn `client/src`).
- Bộ kiểm gốc: `npm test` → PASS 121 · FAIL 0 · CẢNH BÁO 1. Lần chạy đầu FAIL 1 (`thu_BH2` G1 cần lịch sử git; kho mây là kho nông).
  Đã `git fetch --unshallow`, chạy lại thì xanh. `fetch trần = 31 = NGUONG_FETCH`. Gói JS `client/dist/assets/index-CCsMmDck.js` = 978.980 byte.

## 1. Lối vào `taoDon` (B3)
| # | Lối vào | Gọi taoDon với | Mang được gói hôm nay? |
|---|---|---|---|
| 1 | `POST /api/pos/orders` (route thẳng, `orders.js:1443`) | `phien = null` | **CÓ**: `package_buy`, `customer_package_id`, `from_package` |
| 2 | `POST /api/pos/orders/tinh-thu` (`orders.js:1496-1499`) | `{ chiTinh, tinhThu }` | **CÓ** (chỉ tính, không ghi). `TRUONG_TINH_THU` có cả hai trường gói |
| 3 | `POST /thanh-toan/phien` → `giuCho.taoPhien` (`giuCho.js:80`) | `{ chiTinh }` | **CÓ**: `TRUONG_DON` cho gói qua, phiên lưu thân có gói |
| 4 | chốt phiên: `/phien/:id/chot`, `/xac-nhan-tay`, webhook payOS · SePay · Tingee (kể cả chốt muộn) → `giuCho.chotPhien` (`:164`) | `{ id, vaoGiaoDich, sauGhiDon }` | **CÓ**: chốt đúng thân phiên đã lưu ở lối 3 |
| 5 | App KH `utils/donApp.js:190` (báo giá) + `:309/321` (qua lối 3, 4) | `{ chiTinh, tinhThu }` | KHÔNG. `thanDon` (`donApp.js:183-185`) chỉ dựng khách, món, mã, voucher, thẻ, nạp |
| 6 | Màn khách `utils/manKhach.js:127` (dựng lại giỏ của phiên) | `{ chiTinh, tinhThu }` | Chỉ khi phiên (lối 3) có gói |
| 7 | Gói nạp `routes/goi-nap.js` | không gọi. Chỉ ghi chú: bán gói nạp đi lối 1 / 3 với `goi_nap_id` | (gói nạp KHÔNG phải gói trả trước) |

→ MỘT cổng gói ở cửa vào `taoDon` phủ cả 7 lối (mục 2). Không cần cổng thứ hai ở `giuCho.js`: `taoPhien` gọi `taoDon` (`chiTinh`) TRƯỚC khi
ghi phiên (dòng 80-81). Cổng gói trả 400 thì `taoPhien` trả nguyên lỗi đó, không phiên nào được ghi.

## 2. Máy chủ — phương án

### Hình dạng chung: MỘT cửa chặn bọc ngoài `taoDon` (chọn)
- Thân hiện tại đổi tên `taoDon` → **`taoDonGoc`**. Thân không đổi dòng nào, trừ việc DỜI cổng `:252-260` ra cửa chặn.
- `taoDon(req, res, phien = null)` mới, khoảng 15 dòng, đứng ngay trên `taoDonGoc`. Nó chạy hai cổng, rồi `return taoDonGoc(req, res, phien)`:
  1. **Gói (B3), mọi lối:** `package_buy || customer_package_id || (Array.isArray(items) && items.some((i) => i && i.from_package))`
     → 400 `{ error: "Quầy tạm ngưng gói", code: "GOI_TAM_DUNG" }`.
     - Dùng giá trị thật/giả (truthy), nên `package_buy: {}` cũng bị chặn.
     - Vế `customer_package_id` chặn cả "gia hạn" (bật gói cũ, không lấy món) — gia hạn là mua gói.
  2. **Đường thẳng (`!phien`, B1 + B2):**
     - `Number(balance_amount) > 0 || Number(parent_balance_amount) > 0 || payment_method === "balance"` → 400 `VI_PHAI_QUA_PIN`;
     - `Number(transfer_amount) > 0 || payment_method === "transfer"` → 400 `CK_PHAI_QUA_PAYOS`.
     - Hai mã giữ nguyên từ cổng cũ (cùng tình huống → cùng `code`, LUAT §2).
     - BỎ câu đọc cài đặt `thanh_toan_payos_bat_buoc` → cổng luôn chạy.
     - Thêm vế `payment_method === "transfer"`: đường thẳng hôm nay nhận `'transfer'` kèm `cash_amount` và ghi nguyên nhãn đó (`:1087`).
     - Lời báo "Chuyển khoản phải qua QR payOS" → "Chuyển khoản phải qua QR" (cổng QR nay có cả SePay / Tingee).
- Cả hai cổng đứng TRƯỚC mọi đọc / ghi của thân → không ghi gì.
- Mọi lối ở mục 1 đều gọi `taoDon` (đã grep: `orders.js:1443,1499`, `giuCho.js:80,164`, `donApp.js:190`, `manKhach.js:127`) → một cửa phủ đủ.
  `taoPhien` gọi `taoDon` (`chiTinh`) TRƯỚC khi ghi phiên (`giuCho.js:80-81`) → phiên có gói không bao giờ được ghi.
- `module.exports.taoDonGoc` — **CHỈ để bài thử dựng "đơn cũ"** (mục 4.3). Không lối HTTP nào tới được.
  - Khoá bằng phép (C16), không bằng lời dặn: bài mới quét `server/`. Chữ `taoDonGoc` chỉ được có trong `orders.js`, đúng 3 chỗ:
    định nghĩa, lời gọi trong `taoDon`, dòng export. Kèm đột biến `VS-GOI-THANG-LOI-GOC` (cho `giuCho.js` gọi `taoDonGoc`) để chứng minh phép bắt được.
- Mã gói nằm lại trong `taoDonGoc` (vòng món, POS-AUTHZ-v1, khối ghi gói). **Không xoá**, vì:
  (i) phiếu cấm sửa ngoài vùng cổng đầu;
  (ii) bộ kiểm nhóm E soi POS-AUTHZ-v1 + `item.from_package ? 0` (`kiem_tra_truoc_khi_giao.js:351-373`);
  (iii) bài thử cũ của gói vẫn chạy trên đúng mã này qua `taoDonGoc` (mục 4.3);
  (iv) gói kiểu mới là việc sau khai trương.
- Thứ tự đổi so với hôm nay: cửa chặn đứng trước cổng nạp (`NAP_KHONG_GOP` `:236`) và cổng thẻ / nạp không trừ ví (`:248`). Ví dụ:
  - đơn nạp + gói → `GOI_TAM_DUNG` (thay `NAP_KHONG_GOP`);
  - đơn thẻ + ví đường thẳng → `VI_PHAI_QUA_PIN` (thay `THE_KHONG_TRA_VI`).
  Cả hai vẫn là 400 và không ghi gì. Chỉ 2-3 ca E đổi mã chờ (NAP1 B5 `b5c`, KHNAP1 B2 `t1[4]`).
- Cài đặt `thanh_toan_payos_bat_buoc` thành thừa. Nó được gieo ở `database.js:1114`, ngoài Phạm vi → ghi Phát hiện, không xoá.
- Ước lượng: `orders.js` khoảng +18 / −9 dòng.

### Phương án B (loại): cổng viết thẳng vào đầu thân `taoDon`, không tách hàm
- Máy chủ ít hơn khoảng 5 dòng.
- Nhưng gần 430 ca F (mục 4.3) mất cách dựng đơn cũ. Bài thử phải đi đường phiên (thêm PIN, tạo + chốt), hoặc chèn SQL tay chép lại
  mọi câu ghi của `taoDon`. Ước lượng trên 1.500 dòng bài thử sửa.
- Có thứ đường phiên KHÔNG dựng nổi:
  - đơn trừ ví MỘT PHẦN (phiên luôn lấy `min(khả dụng, tổng)`, `giuCho.js:96`). Gặp ở NAP1, P26b, P26c, HUY1, HD1, kich_ban. NAP1 dùng
    nhiều nhất — các ca chia thưởng nạp C7b, C13, E3-E12, K2;
  - đơn gói (bị chặn ở mọi lối).
  → mất bài thử cho đúng loại đơn cũ đang nằm trên quầy thật (C5).

### B4 — so ba cách khoá đường thẳng
Đếm từ một agent chỉ đọc. Nó lần theo mọi hàm phụ trong 38 file `cong_cu/` + `gia_lap/kich_ban.js` có gọi thẳng `POST /orders`.
`kiem_tra_truoc_khi_giao.js` không tự gọi HTTP, nhưng chạy các bài này.

| Cách | Bài phải sửa | Đạt B1–B3? |
|---|---|---|
| (a) chặn đúng vế tài khoản / mẹ / chuyển khoản / gói | **22** — DIEMMON1, DIEMTHAT1, DOISOAT1, GIAO1, GIAO2, GOI1, HD1, HUY1, KHNAP1, NAP1, P20, P21, P2223, P24, P26a, P26b, P26c, P3, UUDAI1, VIME1, VOUCHER2, gia_lap/kich_ban | đạt |
| (b) đường thẳng chỉ nhận tiền mặt thuần (chặn thêm thẻ hạng, nạp, ghi nợ / chờ thu) | 26 = 22 + GIOVN1, HANG1, KHTHE1, KH1 | đạt |
| (c) đóng hẳn (410) | 38 (mọi bài gọi đường thẳng) | đạt |

→ **Chọn (a)**: ít sửa nhất mà vẫn đạt B1–B3.
- Gói bị chặn ở MỌI lối (B3), nên 15/22 bài phải sửa dù chọn cách nào. Riêng phần B1/B2 chỉ thêm 7 bài: GIAO2, P26a, VIME1, P21, DIEMTHAT1, GIAO1, HD1.
- (b) hợp hơn với sổ quyết định ("Không công nợ", "Không có bill chưa trả tiền" — `QUYET_DINH_CHU_QUAN.md:89,100`), nhưng ghi nợ / chờ thu
  không nằm trong B1–B3 → ghi Phát hiện, đề xuất một việc sau.

## 3. Giao diện — phương án

### A1, A2 (một màn)
- **A (chọn):**
  - `BanHang/index.jsx` (35 → khoảng 15 dòng): bỏ `import Sales`, bỏ `apDungQuery`. Đọc `kieu` từ máy, luôn trả `<BanHangMoi kieu={kieu} onDoiKieu={doi} />`.
    Địa chỉ `?man=…` không còn ai đọc → mọi địa chỉ đều ra màn mới.
  - `tinh.js`: `docCongTac` / `ghiCongTac` đổi thành `docKieu(kho)` / `ghiKieu(kho, kieu)`. Chỉ còn khoá `KHOA_KIEU`; bỏ `KHOA_CONG_TAC`.
    Khoá cũ `pos_man_ban_hang_moi` còn nằm trong `localStorage` của máy cũ nhưng không ai đọc → vô hại.
  - `BanHangMoi.jsx:470-476`: chữ → "Kiểu màn bán hàng (máy này)", bỏ nút "Tắt — về màn cũ", `onDoiCaiDat(true, k)` → `onDoiKieu(k)`.
- B: giữ `docCongTac` nhưng ép `bat = true`. Bị loại: để lại công tắc chết, đúng thứ phiếu muốn bỏ.
- Chú thích nhắc `Sales` ở file trong Phạm vi thì sửa chữ (không đổi mã): `BanHangMoi.jsx:32`, `tinh.js:22,58,117`,
  `components/QrScanModal.jsx:6`, `components/InPhieu.jsx:18`, `components/InvoicePrint.jsx:17`.
- **Ngoài Phạm vi:** `pages/InvoiceSettings.jsx:745` (chú thích "Orders/Sales") → **Câu hỏi 2**. `components/Layout.jsx:69` ("Các màn cũ chuyển vào
  trang Quản lý") nói về các màn khác, không phải Sales; file này thuộc làn GIAO-DIEN-2, bị Cấm → để nguyên.
  Phép A2 trong bài mới dò đúng các mẫu `man=cu`, `man=moi`, `\bSales\b`, `về màn cũ` (không dò "màn cũ" trần — sẽ bắt oan Layout).

### A3 (xoá)
| File | Ai import (grep `from ['"].*<tên>['"]` toàn `client/src`) | Quyết |
|---|---|---|
| `pages/Sales.jsx` (2.289 dòng) | chỉ `BanHang/index.jsx:6` | XOÁ |
| `components/CustomerSearch.jsx` (766 dòng) | chỉ `Sales.jsx:14` (ThanhKhach.jsx:3,35 chỉ nhắc trong chú thích) | XOÁ |
| `components/InvoicePrint.jsx` | `Orders.jsx:17`, `BanHang/ManKetThuc.jsx:7` | GIỮ |
| `components/QrScanModal.jsx` | `BanHang/ThanhKhach.jsx:8` (CustomerSearch cũng dùng, nhưng sẽ xoá) | GIỮ |
| `components/ThongTinMon.jsx` | `BanHangMoi.jsx:24`, `Settings.jsx:25` | GIỮ |
| `components/thongBaoKho.js`, `utils/logoCache`, `utils/ngayVN` | nhiều màn | GIỮ |

Hàm `api.js` chỉ Sales gọi: **`ordersApi.create`** (`api.js:421`; grep `ordersApi\.\w*`, chỉ `Sales.jsx:736`) → XOÁ.
`productsApi.list` còn `BanHangMoi:96`, `Orders:95`… → GIỮ. `customersApi.getByQR` / `customersV2Api.search` (CustomerSearch gọi) còn ở
`BanHang/ThanhKhach.jsx:26,41,42` → GIỮ.
Fetch trần mất: Sales 7 + CustomerSearch 2 = **9** → `NGUONG_FETCH` 31 → **22**. Đo lại bằng bộ kiểm sau khi xoá; số đo thắng số đếm tay.

### A4
`(cd client && npm run build)`, rồi `node kiem_tra_truoc_khi_giao.js --day-du`. Ghi kích thước gói JS trước (978.980 byte) và sau vào `trang_thai.md`.

## 4. Bài thử

### 4.1 Bài MỚI `cong_cu/thu_BOMANCU1.js` (D3). Khoảng 300 dòng, dựng app như `thu_P3.js` (orders + thanh-toan + wallets, kho thử trong bộ nhớ)
Mỗi ca chặn so ĐÚNG `code` + đếm trước / sau: `pos_orders`, `pos_order_items`, `pos_wallets.balance` (khách + mẹ), `pos_wallet_transactions`,
`pos_customer_packages` (`delivered_qty`, số dòng), `pos_points` (điểm), voucher, lượt mã. Dòng không đổi thì mới đạt.
- **A1** (4 ca + 1): chạy hàm thật của `tinh.js` (nạp ES module như `thu_BH1`) và đọc nguồn `index.jsx`:
  - A1a kho trống → ra màn mới, kiểu `tudong`;
  - A1b kho có `pos_man_ban_hang_moi = '0'` → màn mới;
  - A1c / A1d: `?man=cu`, `?man=moi` → `index.jsx` không đọc `location.search` / `man=` nữa, luôn dựng `<BanHangMoi`, không nhánh `?:` theo công tắc;
  - A1e kiểu `dienthoai` ghi rồi đọc lại → còn nguyên (`kieu` được nhớ).
- **A2:** `BanHangMoi.jsx` không còn "Tắt — về màn cũ", "Màn bán hàng mới (máy này)"; có "Kiểu màn bán hàng (máy này)".
  Duyệt `client/src` không còn `man=cu`, `man=moi`, `\bSales\b`, `về màn cũ`.
- **A3:** không còn `pages/Sales.jsx`, `components/CustomerSearch.jsx`; `api.js` không còn `create:` trong `ordersApi`; không file nào import hai file đã xoá.
- **B1** (đường thẳng): ví khách `balance_amount` → `VI_PHAI_QUA_PIN`; `payment_method: 'balance'` → `VI_PHAI_QUA_PIN`.
- **B1 mẹ:** `parent_balance_amount` → `VI_PHAI_QUA_PIN`.
- **B2:** `transfer_amount` → `CK_PHAI_QUA_PAYOS`; `payment_method: 'transfer'` + `cash_amount` → `CK_PHAI_QUA_PAYOS`.
- **B1/B2 với cài đặt cũ = '0':** cài `thanh_toan_payos_bat_buoc = '0'` rồi gửi lại cả bốn → vẫn bị chặn. Ca này bắt đúng lỗ hôm nay.
- **B3 mua gói:** đường thẳng, `tinh-thu`, tạo phiên (`tien_mat`), mỗi lối một ca → `GOI_TAM_DUNG`, không phiên / đơn / gói mới.
  Thêm `package_buy: {}`.
- **B3 lấy từ gói:** gói cũ gieo bằng SQL (đang `active`, để chứng minh cổng không dựa vào trạng thái gói).
  - `customer_package_id` + `from_package` trên đường thẳng, `tinh-thu`, tạo phiên → `GOI_TAM_DUNG`, `delivered_qty` không đổi.
  - Riêng `from_package` không kèm mã gói → `GOI_TAM_DUNG`.
  - Riêng `customer_package_id` không món từ gói (gia hạn) → `GOI_TAM_DUNG`.
- **B3 chốt phiên cũ:** phiên `cho` có thân gói, gieo bằng SQL (giả phiên tạo trước khi cập nhật) → `/chot` trả `GOI_TAM_DUNG`, phiên sang `loi`, không đơn.
- **Khoá cửa chặn:** chữ `taoDonGoc` chỉ có trong `server/routes/orders.js`, đúng 3 chỗ (định nghĩa, lời gọi trong `taoDon`, export).
  Mọi lối ở mục 1 gọi `taoDon` (đếm lời gọi bằng mẫu, so BẰNG danh sách 6 chỗ).
- **B5 hai người cùng bấm:** hai yêu cầu đường thẳng trừ ví gửi cùng lúc → cả hai 400, số dư không đổi.
- **K5 — luồng hợp lệ PHẢI KHÔNG bị chặn** (mỗi luồng một ca, so 200 + số tiền):
  - C1a tiền mặt đường thẳng;
  - C1b phiên `tien_mat`;
  - C1c phiên `tai_khoan` + PIN đúng (trừ đúng số);
  - C1d tài khoản mẹ + PIN mẹ;
  - C1e tách tiền mặt + tài khoản (phiên `tien_mat` + `tru_tai_khoan`);
  - C1f phiên `ck_tay` + xác nhận tay;
  - C1g thẻ hạng tiền mặt (đường thẳng và phiên);
  - C1h gói nạp tiền mặt;
  - C1i mã giảm + voucher qua phiên;
  - C2 đơn giao qua phiên (một ca, dùng báo phí giả như `thu_GIAO1`);
  - C5 huỷ đơn cũ trừ ví / đơn cũ chuyển khoản / đơn cũ lấy từ gói — đơn gieo bằng SQL đúng hình đơn cũ, `PUT /orders/:id/cancel` 200, hoàn đúng như HUY-1.
- **Đột biến** `viec/BO-MAN-CU-1/dot_bien.py` (mỗi vế ít nhất một; mỗi đột biến một dòng):
  - `BV-VI-THANG` (gỡ vế `balance_amount`), `BV-VI-ME-THANG` (gỡ vế `parent_balance_amount`), `BV-BALANCE-NHAN` (gỡ `payment_method === "balance"`);
  - `BV-CK-THANG` (gỡ vế `transfer_amount`), `BV-CK-NHAN` (gỡ `payment_method === "transfer"`);
  - `VS-CAI-DAT-CON` (đưa lại câu đọc cài đặt → cổng chỉ chạy khi '1');
  - `BV-GOI-MUA`, `BV-GOI-MA`, `BV-GOI-TU-GOI` (gỡ từng vế cổng gói);
  - `VS-GOI-CHI-THANG` (cổng gói chỉ khi `!phien` → lối phiên / tinh-thu lọt);
  - `VS-GOI-THANG-LOI-GOC` (`giuCho.js` gọi `taoDonGoc` thay `taoDon` → phiên có gói lọt; phép quét `taoDonGoc` + ca B3 phiên phải bắt);
  - `VS-MAN-CU-QUERY` (index.jsx đọc lại `?man=cu` → dựng nhánh khác);
  - `BV-NUT-TAT` (đưa lại nút "Tắt — về màn cũ").
  Mỗi đột biến có đối chứng: bản chưa đột biến xanh. Luật sập: bài sập ≠ bắt.

### 4.2 Bài CŨ đọc `Sales.jsx` (D1) — từng ca
| Bài | Ca | Quyết |
|---|---|---|
| `thu_HANG1.js:677-691` | G2 (giỏ gửi `{tier_id, so_thang}`), G2b (gói đang bán có giá; khoá khi hạng cao hơn) | **chuyển** sang `BanHang/tinh.js` (`dongThe`/`dsGoiThe`/`layThe` dòng 186-217) + `BanHangMoi.jsx:364-371` (`caoHon`, "Khách có hạng cao hơn") |
| `thu_BH1.js:189-197` | I10, I11 (tập khoá payload màn mới == khoá `orderData` của Sales) | **bỏ**. Chuẩn so sánh không còn; I1-I9 vẫn khoá từng khoá của `dungDonHang` |
| `thu_BH1.js:216-217` | S9 (App.jsx không `<Sales />` trang chủ) | **giữ**, vẫn đúng. S10 (Sales.jsx không nhắc BanHang) → **đổi**: không còn file `pages/Sales.jsx` |
| `thu_BH1` / `thu_BH2` ca công tắc (`docCongTac`/`ghiCongTac`, S16 "mặc định TẮT") | | **đổi** theo `docKieu`/`ghiKieu` + "luôn màn mới" (hành vi đã duyệt đổi) |
| `thu_UUDAI1.js:494-503` | S1-S4 (Sales hỏi tinh-thu, `donGuiMayChu`, tổng từ tinh-thu, có mã chưa số → không thu) | **chuyển**: màn mới hỏi `ordersApi.tinhThu` với `thanTinhThu` (`BanHangMoi:154`), tổng từ `mayChu` (`coSo`). S2 (hai thân cùng một hàm) → `thanTinhThu` = phần `don` của phiên (`tinh.js:209-217`) |
| `thu_P26c.js:348-349` | A6c (Sales: ô lượt gói không là ô nhập) | **bỏ** (màn mới không có gói) |
| `thu_BHCKTAY1.js` (cả bài, A0-C2) | ô giảm tay của Sales | **chuyển** phần còn nghĩa: A1-A3 (không ô / state / nhánh giảm tay) soi `BanHang/*.jsx` + `tinh.js`; B1-B3 (orderData ba khoá discount) → `dungDonHang`; C1-C2 (thân → máy chủ, tổng = tinh-thu) dùng thân `thanTinhThu` của màn mới qua phiên `tien_mat`. Tên file giữ (kiem_tra chạy đúng tên này) |
| `thu_BAO1a.js:40,54,166` | `MAN_DA_RA['pages/Sales.jsx']`, `['components/CustomerSearch.jsx']`, C6 (Sales.setError qua lyDoLoi) | **bỏ** hai dòng bảng (file đã xoá); C6 **chuyển** sang `BanHangMoi.jsx`: lỗi máy chủ qua `lyDoLoi`/`loiPin` — kiểm lại chỗ thật lúc làm |
| `thu_KHACHCK1.js:250-301` | D1c (Sales không đọc `<khách>.discount_*`), E1a (Sales/Orders/BanHangMoi đưa `discount_note`), F3a (Sales bỏ ô giảm tay) | D1c **bỏ** (D1a/D1b đã khoá màn mới); E1a **bỏ vế Sales**, giữ vế Orders + BanHangMoi; F3a **bỏ** (F3b/F3c máy chủ giữ) |
| `cong_cu/do_chuathu.js` | công cụ dò P12 chỉ trên Sales (không nằm trong bộ kiểm) | **XOÁ file**. `tu_chay/thu_nguoi_gac.js:618` chỉ dùng TÊN đường dẫn trong kho giả (`E` = giả lập lệnh Edit, dòng 126), không cần file có thật |
| `thu_P26b.js:342`, `thu_HD1.js:666`, `gia_lap/kich_ban.js:384`, `thu_BH2.js:251` | chỉ chữ trong nhãn / chú thích / danh sách git log | sửa chữ khi đang sửa file đó vì lý do khác; BH2 G1 để nguyên (lịch sử git) |

Mọi bài đổi: đỏ trên gốc (file Sales còn / hành vi cũ), xanh trên HEAD, dòng `SỐ CA` trong `bang_chung_do.txt`.

### 4.3 Bài CŨ dựng đơn bằng đường thẳng (B4a — 22 bài)
Agent chỉ đọc kiểm kê từng ca. Chia ba loại:
- **L** — ca thử chính logic mua / lấy gói, hoặc hành vi riêng của đường thẳng;
- **F** — ca chỉ dùng đơn ví / chuyển khoản / gói làm ĐƠN MẪU để thử thứ vẫn sống: huỷ, hoàn, điểm, đối soát, hoá đơn, voucher;
- **E** — ca vốn chờ bị từ chối, nay chỉ đổi mã.
Số là ước lượng, đếm tĩnh.

| Bài | Số ca (≈) | Đỏ: L / F / E | Hàm phụ dựng đơn | Ví trả MỘT PHẦN? |
|---|---|---|---|---|
| GOI1 | 114 | 18 / 55 / 12 | muaGoi 139, lay 142, mua30 528 | không |
| P26c | 138 | 20 / 40 / 12 | taoDon 151, muaGoi 167, lay 170, ban 696 | **có** |
| P26b | 64 | 1 / 33 / 3 | taoDon 134, donVi 139, donMe 345 | **có** |
| P2223 | 42 | 3 / 3 / 5 | ban 111, tuChoi 293 | có thể |
| P24 | 33 | 0 / 6 / 0 | ban 110 | không |
| P20 | 121 | 0 / 25 / 0 | taoDon 130 | không |
| P3 | 99 | 3 / 0 / 1 | gọi thẳng | không |
| P21 | 13 | 0 / 3 / 0 | taoDon 102 | không |
| P26a | 15 | 0 / 1 / 0 | dòng 98 | không |
| HUY1 | 56 | 0 / 20 / 0 | ban 98, chuyenKhoan 105 | **có** |
| HD1 | 161 | 0 / 12 / 1 | ban 393 | **có** |
| UUDAI1 | 76 | 5 / 1 / 0 | ban 137 | không |
| DOISOAT1 | 94 | 2 / 16 / 0 | taoDon 128, muaGoi 138 | không |
| DIEMMON1 | 31 | 1 / 7 / 0 | ban 111, banGoi 237 | không |
| DIEMTHAT1 | 36 | 0 / 19 / 1 | ban 103 | không |
| KHNAP1 | 61 | 2 / 2 / 0 | gọi thẳng | không |
| NAP1 | 89 | 1 / 30 / 1 | ban 121 | **có, nhiều** |
| VOUCHER2 | 129 | 3 / 8 / 0 | ban 290 | không |
| VIME1 | 24 | 0 / 4 / 4 | ban 109 | không |
| GIAO1 | 131 | 0 / 75-95 / 1 | donGiao 211 (mặc định trả ví) | không |
| GIAO2 | 28 | 0 / 25 / 0 (bài TREO ở vòng chờ 9 chuyến) | moChuyen 174 | không |
| gia_lap/kich_ban | 87 | 8 / 30 / 2 | c.taoDon 25, mua 452, lay 455 | **có** |

Tổng ≈ 65 L · 430 F · 40 E. Phần lớn là F.

**Cách sửa (chọn):** hàm phụ dùng chung **`cong_cu/gia_lap/donCu.js`**, khoảng 30 dòng.
- `donCu(mayChu, nguoi, than)` gọi `taoDonGoc` trong cùng tiến trình, với res giả. Trả `{ status, body }` y như gọi HTTP.
- Cùng một module `orders.js` mà app thử đang dùng: lấy từ `<may-chu>/routes/orders.js`, nên chạy đúng cả trên bản sao đột biến.
- Đơn dựng ra là ĐƠN CŨ thật: đúng mã đã ghi dữ liệu đang nằm trên quầy. Dựng được cả đơn ví một phần và đơn gói.

Làm theo từng loại ca:
- **F (≈ 430 ca):** chỉ đổi thân hàm phụ dựng đơn của mỗi bài sang `donCu` (3-8 dòng / bài). Ca giữ nguyên. Huỷ / hoàn / báo cáo vẫn
  gọi HTTP thật như cũ.
- **L của gói** (GOI1, P26c, P2223, DOISOAT1, DIEMMON1, VOUCHER2 K5…): logic gói vẫn nằm trong `taoDonGoc` → ca giữ nguyên, đi qua `donCu`.
  Bài vẫn khoá đúng mã đó cho ngày gói kiểu mới dùng lại.
- **L / E của hành vi ĐÃ DUYỆT ĐỔI** (sửa thường, đỏ trên gốc — LUAT §6.8):
  - P3 H "CK trần 25.000 → 200" và I1-I7 (cờ `thanh_toan_payos_bat_buoc`) → đổi sang: chặn bất kể cờ; gói → `GOI_TAM_DUNG`;
  - UUDAI1 G3b-d, K4a-b (tinh-thu / đơn có gói) → `GOI_TAM_DUNG`;
  - VOUCHER2 F2, F5 (phiên có `package_buy`) → `GOI_TAM_DUNG`;
  - KHNAP1 K5 (CK / ví mẹ / gói trên đường thẳng) và B2 `t1[4]` → mã mới;
  - NAP1 K2 (ví + CK đường thẳng → 200) và B5 `b5c` → mã mới;
  - VIME1 A1-A4 → giữ nguyên (`kiemTraMe` nằm trong `taoDonGoc`; ca đi qua `donCu`, vẫn 403 `KHONG_PHAI_TK_ME`).
  Lúc làm, mỗi ca đổi ghi một dòng trong `trang_thai.md`.
- **Giả lập một ngày (`gia_lap/kich_ban.js`, C7):** đây là tập dượt quầy, nên đơn MỚI đi đúng đường quầy nay dùng:
  - ví / mẹ → phiên `tai_khoan` hoặc `tien_mat` + PIN;
  - KB2 chuyển khoản → phiên `ck_tay` + xác nhận tay.
  Gói KB9 / KB21 / KB23 / KB30 → "gói mua trước ngày cập nhật" dựng bằng `donCu`. Thêm một cảnh "quầy bấm bán gói → `GOI_TAM_DUNG`,
  không ghi". Các cảnh ví một phần (KB4, KB5, KB17) chuyển sang phiên → số dự kiến tính lại theo `min(khả dụng, tổng)`, ghi rõ từng cảnh.
  `bat_bien.js` không đổi (chỉ đọc SQL).
- **GIAO1 / GIAO2:** `donGiao` / `moChuyen` dựng đơn giao cũ bằng `donCu`. Đơn giao MỚI qua phiên (C2) có ca riêng trong `thu_BOMANCU1`.

Ước lượng dòng bài thử: `donCu.js` 30 · đổi hàm phụ 21 bài ≈ 120 · ca L/E đổi ≈ 150 · kich_ban ≈ 120 · bài mới ≈ 350
→ **≈ 770 dòng**, vượt "~300 dòng thử" của phiếu. Lý do: gói bị chặn ở mọi lối, nên 15 bài phải sửa bất kể cách B4 nào → **Câu hỏi 4**.

## 5. D2 — `kiem_tra_truoc_khi_giao.js`
Chỉ hạ `NGUONG_FETCH` 31 → số đo sau khi xoá (dự kiến 22). Grep `Sales` trong file = 0 chỗ, nên không có phép nào phải đổi file soi.
Không đụng nhóm E (POS-AUTHZ-v1).

## 6. Rủi ro
- Phiên tạo TRƯỚC lúc cập nhật mà thân có gói: chốt sẽ trả `GOI_TAM_DUNG`, phiên sang `loi`. Tiền QR về muộn thì đi nhánh vào ví như cũ
  (`thanh-toan.js:182-186`). Không mất tiền. Hôm nay khả năng gần 0: phiên sống 10 phút, gói đã kết thúc hết.
- Đơn cũ trên quầy thật (đơn ví, chuyển khoản, gói) KHÔNG đổi. Cổng chỉ chạy lúc TẠO đơn. Huỷ / hoàn / báo cáo không qua cổng (ca C5, C6).
- SX hay hệ thống khác gọi `POST /orders` (CHECKLIST B6): chỉ đơn tiền mặt còn đi được. Grep `server/` không thấy lối dịch vụ nào tạo đơn
  ví / chuyển khoản. Kho SX: CHƯA KIỂM (không có trong máy).

## 7. Câu hỏi cho chủ quán (mỗi câu có đề xuất — trả lời "đồng ý cả 4" là đủ)

**Câu 1 — Phạm vi phải ghi đúng tên 6 file (bắt buộc).**
Người gác coi `cong_cu/gia_lap/**`, `thu_P20/P21/P26a/P26b.js` là "file luật": chỉ sửa được khi Phạm vi ghi ĐÚNG TÊN.
Nguồn: `tu_chay/cau_hinh.json` `file_luat`, `nguoi_gac.js:196`. Glob `cong_cu/gia_lap/**` và `cong_cu/thu_*.js` của phiếu chưa đủ.
Đề xuất thêm vào `## Phạm vi`:
```
- cong_cu/gia_lap/kich_ban.js
- cong_cu/gia_lap/donCu.js
- cong_cu/thu_P20.js
- cong_cu/thu_P21.js
- cong_cu/thu_P26a.js
- cong_cu/thu_P26b.js
```

**Câu 2 — cho bộ kiểm chạy bài mới.**
`kiem_tra_truoc_khi_giao.js` chạy bài theo danh sách cứng (dòng 495-513). Bài mới `thu_BOMANCU1.js` chỉ được `npm test` chạy khi thêm một dòng
`chayBaiThat('cong_cu/thu_BOMANCU1.js')`. Phiếu D2 ghi "CHỈ được làm hai việc" với file này, nên mình hỏi.
Đề xuất: cho thêm đúng dòng đó. Đây là THÊM phép kiểm (CLAUDE.md §6 cho phép), không nới gì. Không có dòng này thì khoá B1-B3 không được
canh ở mỗi lần commit.

**Câu 3 — một dòng chú thích ngoài Phạm vi.**
`client/src/pages/InvoiceSettings.jsx:745` có chú thích "Cập nhật cache NGAY để Orders/Sales dùng được". A2 đòi `client/src/` không còn chữ
`Sales` trỏ về màn cũ.
Đề xuất: thêm `client/src/pages/InvoiceSettings.jsx` vào Phạm vi, chỉ để sửa chữ chú thích đó (không đổi mã). Không đồng ý thì bài A2
chừa riêng dòng này và mình ghi Phát hiện.

**Câu 4 — duyệt cách sửa bài thử (mục 2 + 4.3).**
- Máy chủ tách `taoDon` thành cửa chặn + thân `taoDonGoc`. Thân được xuất ra CHỈ để bài thử dựng "đơn cũ"; một phép kiểm khoá không file
  máy chủ nào khác gọi nó.
- Dòng export ở cuối `orders.js` nằm ngoài "vùng cổng đầu" mà phiếu cho sửa, nên mình hỏi luôn.
- Bài thử vượt ngân sách: ≈ 770 dòng, so với ~300 của phiếu.
Đề xuất: đồng ý. Cách còn lại (phương án B ở mục 2) phải sửa trên 1.500 dòng bài thử, và mất bài thử cho đúng loại đơn cũ đang có trên quầy
(đơn ví một phần, đơn gói).

## 8. Phát hiện (không sửa trong việc này)
- Đường thẳng vẫn nhận **ghi nợ / chờ thu** (`debt_amount`, `payment_method: 'cho_thu'`). Sổ quyết định đã chốt "Không công nợ" và "Không có
  bill chưa trả tiền" (`QUYET_DINH_CHU_QUAN.md:89,100`). Màn mới không còn ai gửi kiểu đơn này. Đề xuất một việc sau: chặn ở cửa chặn
  (cách B4b, thêm 4 bài phải sửa).
- `payment_method` của đường thẳng là chữ tự do, ghi nguyên vào đơn (`'combined'`, `'mixed'`, `'momo'` có trong bài thử). Tiền vẫn đúng cột,
  chỉ nhãn lạ.
- Cài đặt `thanh_toan_payos_bat_buoc` thành thừa sau việc này (`database.js:1114`, ngoài Phạm vi).
- Kho mây là kho nông → `thu_BH2` G1 đỏ oan cho tới khi `git fetch --unshallow` (K2). Máy đã tự tải thêm lịch sử ở bước 1.
