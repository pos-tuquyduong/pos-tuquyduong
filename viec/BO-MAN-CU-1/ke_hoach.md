# BO-MAN-CU-1 — kế hoạch (CHỜ CHỦ QUÁN DUYỆT)

## Lời thường (đọc trước)
Việc này là gì: quầy chỉ còn màn Bán hàng mới; màn cũ bị xoá. Máy chủ khoá thêm: không ai tạo được đơn trừ tài khoản / chuyển khoản
mà KHÔNG qua bước PIN / QR, và tạm ngưng gói ở mọi đường của quầy.

Phần máy chủ NHỎ (khoảng 15 dòng). Phần NẶNG là bài thử cũ: 22 bài thử đang dựng đơn trừ tài khoản, chuyển khoản hoặc gói bằng đường cũ,
nên phải chuyển sang đường mới. Đây là lý do bản này chờ bạn duyệt.

Bạn cần làm gì:
1. Đọc **mục 7 — Câu hỏi** (3 câu, mỗi câu có đề xuất). Trả lời "đồng ý cả" là đủ.
2. Câu 1 là bắt buộc: phiếu phải ghi ĐÚNG TÊN 6 file bài thử. Lý do: người gác coi 6 file này là "file luật" và chặn sửa nếu chỉ ghi kiểu
   `cong_cu/gia_lap/**`.

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

→ Đặt MỘT cổng gói trong thân `taoDon` là phủ cả 7 lối. Không cần cổng thứ hai ở `giuCho.js`: `taoPhien` gọi `taoDon` (`chiTinh`) TRƯỚC khi
ghi phiên (dòng 80-81). Cổng gói trả 400 thì `taoPhien` trả nguyên lỗi đó, không phiên nào được ghi.

## 2. Máy chủ — phương án

### B1 + B2 (đường thẳng: tài khoản khách, tài khoản mẹ, chuyển khoản)
- **A (chọn):** sửa cổng có sẵn `orders.js:252-260`:
  - bỏ câu đọc cài đặt `thanh_toan_payos_bat_buoc` → cổng luôn chạy khi `!phien`;
  - thêm vế `payment_method === "transfer"`. Lý do: đường thẳng nhận `payment_method: 'transfer'` với `cash_amount`, và ghi nhãn cách trả
    "chuyển khoản" cho tiền chưa qua QR (dòng 1087 ghi nguyên `payment_method`).
  - Giữ mã `VI_PHAI_QUA_PIN` / `CK_PHAI_QUA_PAYOS` (cùng tình huống → cùng `code`, LUAT §2).
  - Lời báo: đổi "Chuyển khoản phải qua QR payOS" → "Chuyển khoản phải qua QR" (cổng QR nay gồm cả SePay / Tingee).
  - Khoảng −2 / +3 dòng. Cổng đứng TRƯỚC mọi câu ghi → không ghi gì (dòng ghi đầu tiên là giao dịch ở `:1000+`).
- B: viết cổng mới riêng. Bị loại vì trùng cổng có sẵn: hai cổng cùng việc sẽ lệch nhau (K4).
- Cài đặt `thanh_toan_payos_bat_buoc` thành thừa (gieo ở `database.js:1114`, ngoài Phạm vi) → ghi Phát hiện, không xoá.

### B3 (gói, mọi lối)
- **A (chọn):** một cổng trong `taoDon`, đặt NGAY SAU cổng B1/B2:
  `if (package_buy || customer_package_id || (Array.isArray(items) && items.some((i) => i && i.from_package))) → 400 { error: "Quầy tạm ngưng gói", code: "GOI_TAM_DUNG" }`.
  - Khoảng 4 dòng. Phủ cả 7 lối ở mục 1.
  - Đứng TRƯỚC các cổng riêng của gói (`GOI_MUA_VA_LAY_CUNG_DON` `:275`, `GOI_MUA_THIEU_THONG_TIN` `:283`…). Vì vậy `package_buy: {}`
    cũng bị chặn: cổng dùng giá trị thật/giả (truthy), `{}` là thật.
  - Đứng SAU cổng nạp (`NAP_KHONG_GOP` `:236`) và cổng B1/B2. Đơn nạp + gói vẫn báo mã cũ, nên không phải sửa các ca có sẵn ở `thu_NAP1` / `thu_KHNAP1`.
  - Mã gói nằm lại trong `orders.js` (vòng món, POS-AUTHZ-v1, khối ghi gói) nhưng không lối nào tới được nữa. **Không xoá** mã này, vì:
    (i) phiếu cấm sửa ngoài vùng cổng đầu `taoDon`;
    (ii) bộ kiểm nhóm E soi marker POS-AUTHZ-v1 + mẫu `item.from_package ? 0` (`kiem_tra_truoc_khi_giao.js:351-373`);
    (iii) gói kiểu mới là việc riêng sau khai trương.
- B: chặn ở `router.post("/")` + `giuCho.taoPhien` (`TRUONG_DON` bỏ hai trường gói). Bị loại: hai chỗ thay vì một, và lối `tinh-thu` / màn khách vẫn tính gói.
- Vế `customer_package_id` chặn cả "gia hạn" (bật gói cũ, không lấy món). Đây là đúng ý phiếu: gia hạn = mua gói.

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
  - `VS-GOI-SAU-GHI` (cổng gói dời xuống sau `phien?.chiTinh`; tạo phiên lọt);
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
<<BẢNG KIỂM KÊ — xem mục 4.4>>

## 5. D2 — `kiem_tra_truoc_khi_giao.js`
Chỉ hạ `NGUONG_FETCH` 31 → số đo sau khi xoá (dự kiến 22). Grep `Sales` trong file = 0 chỗ, nên không có phép nào phải đổi file soi.
Không đụng nhóm E (POS-AUTHZ-v1).

## 6. Rủi ro
- Phiên tạo TRƯỚC lúc cập nhật mà thân có gói: chốt sẽ trả `GOI_TAM_DUNG`, phiên sang `loi`. Tiền QR về muộn thì đi nhánh vào ví như cũ
  (`thanh-toan.js:182-186`). Không mất tiền. Hôm nay khả năng gần 0: phiên sống 10 phút, gói đã kết thúc hết.
- Đơn cũ trên quầy thật (đơn ví, chuyển khoản, gói) KHÔNG đổi. Cổng chỉ chạy lúc TẠO đơn. Huỷ / hoàn / báo cáo không qua cổng (ca C5, C6).
- SX hay hệ thống khác gọi `POST /orders` (CHECKLIST B6): chỉ đơn tiền mặt còn đi được. Grep `server/` không thấy lối dịch vụ nào tạo đơn
  ví / chuyển khoản. Kho SX: CHƯA KIỂM (không có trong máy).

## 7. Câu hỏi cho chủ quán
<<CÂU HỎI>>
