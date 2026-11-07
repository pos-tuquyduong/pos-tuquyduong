# GIAO-DIEN-1 — kế hoạch (làm thẳng, không chờ duyệt)

## 0. Hiện trạng đọc trong lượt này (HEAD 64258bb)
- Nút nổi: `client/src/components/DonAppNoi.jsx` (`position: 'fixed'`), gắn ở `Layout.jsx` trong `<main>`. `DonApp.jsx` và `CaiDatChuong.jsx` import
  `mayOQuan / datMayOQuan / keuChuong / TIENG_CHUONG / AM_LUONG_MAC_DINH` từ file này → giữ các export đó.
- Đơn App chỉ cần `authenticate` (`server/routes/kh/quay.js` GET `/don-app`) — "không có quyền xem" = chưa đăng nhập; mục menu không đặt `quyen`.
- Danh sách đơn: `dsQuay()` (`server/utils/donApp.js:348`) trả `tien_trinh` + `gio` (= `luc_chot`, giờ VN không hậu tố) — đủ để tính "sớm nhất X phút trước"
  (qua `getNow`-tương-đương phía quầy: so với giờ VN của máy, không đụng máy chủ).
- Menu: `QuanLy/menu.js` (hàm thuần) + `Layout.jsx` (`dungMenu`). Lưới Quản lý `luoiQuanLy`. Lối "Số dư →" ở `LOI_THEM.customers`.
- Số dư: `pages/Balance.jsx` (540 dòng: danh sách + nạp + lịch sử + điều chỉnh). Không có UI "đối soát ví" (grep `reconcile` ở client = 0; route máy chủ có) →
  "còn đủ" chỉ phải giữ nạp / điều chỉnh / lịch sử.
- Quyền: `server/database.js` seed `topup_balance` = 1 cho staff (`:1065`) / manager (`:1079`); route `POST /wallets/topup` đã `checkPermission('topup_balance')`
  (`server/routes/wallets.js:143`) — chỉ có MỘT đường nạp tay (K4: grep `topup` ở `server/routes` → chỉ wallets.js; thanh-toan.js ghi `loai:'topup'` là tiền CK về ví, không phải nạp tay).
- Chỗ HIỆN QR thanh toán: `BanHang/ManQr.jsx` (quầy), `ManKhach/ManThu.jsx` (màn khách) — cả payOS / SePay / Tingee đều đi qua `phien.qr`. `ManKhach/TrangRanh.jsx` hiện
  QR tải App (không phải QR thanh toán) → KHÔNG đổi. `InvoicePreview.jsx` (in nhiệt) giữ `qrSvg`.
- Số hoá đơn "HD0016" = từ cuối của `noi_dung` ("TQDNOV06 HD0016", `helpers.js noiDungCk`) → không cần đổi máy chủ.

## 1. Phương án
| Phần | A | B (chọn) |
|---|---|---|
| Dải báo | tách DonAppNoi thành hook + dải, gắn ở Layout (≈70 dòng) | giữ nguyên nút, đổi CSS (vẫn là nút nổi → trái phiếu) |
| Gộp Số dư | viết lại khu Ví trong Customers.jsx (≈+250) | **tách `components/ViKhach.jsx` từ ruột Balance.jsx (dời, không viết lại), Customers gắn vào modal chi tiết (≈+60 sửa)** |
| Thẻ QR | thư viện QR mới | **`utils/veQrThuongHieu.js` (hàm thuần trên qrcode-generator 1.4.4 sẵn có) + `components/TheQr.jsx`** |
| Quyền | đổi ở code middleware | **bước 018 đổi dữ liệu + seed 0** (đúng phiếu E) |

Chọn B cả. Số dòng dự kiến: máy chủ ≈ 30 (018 + seed), giao diện ≈ 450 (kể cả dời Balance), thử ≈ 200.

## 2. Ca thử ↔ mục nghiệm thu (`cong_cu/thu_GIAODIEN1.js`)
- A: `tomDonApp` (soMoi / soViVe / sớm nhất phút), dải không `position: fixed`, Layout gắn dải đầu `<main>`, DonAppNoi không còn `fixed`, giữ export chuông.
- B: menu có "Đơn App" sau "Đơn hàng" (máy tính), số đỏ chỉ khi > 0.
- C: Customers có "Khách đang gửi quán"; ViKhach có Lịch sử / Điều chỉnh (adjust_balance) / Nạp tay chỉ owner; không còn "Số dư →"; `/balance` → Navigate `/customers`.
- D: lưới Quản lý có ô "Khách và tiền", ẩn theo quyền (K5: người không quyền thấy ô còn lối hợp lệ).
- E (thật, kho tạm + HTTP như thu_HANG1): manager / staff `POST /wallets/topup` → 403; owner → 200; bước 018 chạy hai lần không đổi thêm; kho mới seed 0; chủ quán bật lại cho manager → 200 (K5).
- F: ma trận khớp `qrcode(0,'H')`; mức H; màu theo phần tư; 3 ô góc đặc; logo ≤ 20 %; viền ≥ 3; chấm tròn; ManQr + ManThu dùng TheQr; bill vẫn `qrSvg`.
- K5 không đổi: `Sales.jsx`, `routes/orders.js` không bị đụng (git diff phạm vi).

## 3. Đường song song / luồng hợp lệ (K4, K5)
- Hai chỗ hiện QR thanh toán → mỗi chỗ gọi TheQr (ca riêng). In nhiệt giữ nguyên (ca "không đổi").
- Bài thử cũ khoá menu 6 / lưới 6 ô / `/balance` (thu_BH2 F1–F8, S15) → chủ quán đã duyệt đổi → sửa đúng các dòng đó (LUẬT §6.8).
- Màn Phân quyền vẫn bật lại được (ca K5).
