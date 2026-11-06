# GIAO-DIEN-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (06.11.2026)
- Nhánh `viec/GIAO-DIEN-1`; `git status --short` sạch. Hook mở phiên đã báo "không kéo — đủ commit của origin".
- `git fetch origin viec/GIAO-DIEN-1`: HEAD = `64258bb`, FETCH_HEAD = `64258bb` → bằng nhau.
- `git log --oneline -3`:
  ```
  64258bb GIAO-DIEN-1: tai nguyen thiet ke the QR - logo + hinh mau (chat 06.11)
  49d9526 PHIEU: GIAO-DIEN-1 them muc F the ma QR thuong hieu (chu quan duyet mau 06.11)
  5506b98 GOP-GIAO-DIEN-1 dua main f9fd8b5 vao nhanh truoc khi lam (chat 06.11)
  ```
- Có commit `PHIEU: GIAO-DIEN-1` (`49d9526`).

## Ghi nhận trong lúc làm
- Kế hoạch KHÔNG nhờ agent phụ soát (phiếu "máy làm thẳng"); chat soát độc lập ở bước 8 thay.
- **Phát hiện (cổng A6):** `cong_cu/thu_BH2.js` không có trong Phạm vi nhưng PHẢI sửa — các dòng F1 / F3 / F6 / F7 / F8 / S5 khoá đúng danh sách menu 6 mục,
  lưới Quản lý 6 ô, lối "Số dư →" và ManQr-vẽ-bằng-veQr mà phiếu (đã duyệt) đổi. Theo LUẬT §6.7 / §6.8 (chủ quán chốt 29.10) không dừng hỏi xin Phạm vi;
  chỉ sửa đúng các dòng đó (bản mới đỏ trên gốc, bản gốc đỏ trên code mới — ghi ở `bang_chung_do.txt`). **Chat soát: thêm `cong_cu/thu_BH2.js` vào Phạm vi
  phiếu** (tiền lệ HANG-1 Q2) để cổng A6 xanh.
- Phát hiện (ngoài việc, không sửa): màn Số dư cũ KHÔNG có nút "đối soát ví" (grep `reconcile` ở client = 0; máy chủ có `POST /wallets/:phone/reconcile` +
  `/reconcile-all`, quyền adjust_balance) — nên "đối soát ví một khách / tất cả" phiếu nói "còn đủ" thực ra chưa từng có giao diện. Không dựng mới trong việc này.
- Logo `client/src/assets/logo_TQD_bieu_tuong.png` thu nhỏ 1024 → 256 px (1,07 MB → 92 KB) để `client/dist` không phình; nền trong suốt giữ nguyên.

## Chỗ vá → đột biến (viec/GIAO-DIEN-1/dot_bien.py — 47 đột biến, chạy cuối: BẮT 46 · SỐNG 1 → sửa ca F8 → BẮT 47/47)
| Chỗ vá | Đột biến |
|---|---|
| E seed `database.js` manager / staff / owner | BV-SEED-MANAGER · BV-SEED-STAFF · VS-SEED-OWNER-TAT |
| E bước 018 (đổi quyền, bản sao lưu, chạy một lần) | BV-018-KHONG-DOI · VS-018-DOI-CA-OWNER · BV-018-KHONG-SAO-LUU · VS-CHAY-NANG-CAP-CHAY-LAI |
| E route `POST /wallets/topup` (cổng quyền; K5 manager được bật lại) | VS-ROUTE-NAP-BI-CHAN-QUYEN-LA · BV-ROUTE-NAP-BO-CONG |
| A `donAppDai.js` (đếm / sớm nhất / hiện / chữ) | VS-DEM-CA-DANG-LAM · VS-SOM-NHAT-LA-MIN · VS-PHUT-AM · BV-DAI-HIEN-LUON · VS-DAI-HIEN-KHI-CHI-VAO-VI · VS-DAI-HEP-VAN-HIEN-PHUT |
| A `DonAppNoi.jsx` / `Layout.jsx` (bỏ nút nổi, gắn dải, nút Xem, giữ chuông) | BV-NUT-NOI-VE · BV-DAI-BO-GAN · VS-DAI-DOI-NUT-XEM · BV-CHUONG-BO-EXPORT |
| B `menu.js` + `Layout.jsx` (mục Đơn App, không đòi quyền, số đỏ) | BV-MENU-BO-DON-APP · VS-MENU-DON-APP-DOI-QUYEN · BV-SO-DO · VS-SO-DO-MUC-KHAC · BV-LAYOUT-BO-SO-DO |
| D lưới Quản lý ô Khách và tiền | BV-O-KHACH-VA-TIEN · VS-O-HOAN-TIEN-KHONG-QUYEN · VS-O-KHACH-CAN-QUYEN-OAN |
| C `ViKhach.jsx` + `Customers.jsx` + `App.jsx` + bỏ lối | VS-NAP-TAY-MOI-NGUOI · VS-DIEU-CHINH-MOI-NGUOI · BV-KHU-VI-KHONG-GAN · BV-TONG-GUI-QUAN · VS-BALANCE-VE-TRANG-CHU · BV-LOI-SO-DU-CON |
| F `veQrThuongHieu.js` (mức H, màu phần tư, ô góc, logo, viền, chấm tròn, dòng chân) | VS-QR-MUC-M · VS-QR-MAU-DAO-TRAI-PHAI · VS-QR-LOGO-TO · VS-QR-VIEN-NHO · VS-QR-CHAM-DE-LOGO · VS-QR-CHAM-TRONG-O-GOC · VS-QR-GOC-DAO-MAU · VS-QR-CHAM-VUONG · VS-QR-CHAN-THE-CHI-NOI-DUNG |
| F `TheQr.jsx` / `ManQr` / `ManThu` / bill giữ nguyên | VS-THE-VIEN-SAI-MAU · VS-THE-CHEN-DONG-CUOI · BV-MANQR-QR-CU · BV-MANTHU-BO-THE · VS-BILL-DOI-SANG-THE |

Luồng hợp lệ (K5) có ca "phải KHÔNG bị chặn": owner nạp tay (E4) · chủ quán bật lại cho manager → manager nạp được (E9, đột biến VS-ROUTE-NAP-BI-CHAN-QUYEN-LA) ·
018 chạy lần hai không đè quyền đã bật lại (E8, đột biến VS-CHAY-NANG-CAP-CHAY-LAI) · "Đơn App" không đòi quyền (B2) · lưới Quản lý không quyền vẫn có /customers (D2) ·
thanh dưới điện thoại không đổi (B3) · bill / phiếu IN vẫn mã vuông đen (F15).
