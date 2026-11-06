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

## Soát độc lập (/ra-soat, 06.11) — vòng 1
Báo cáo (tóm nguyên ý): **ĐẠT**, 0 lỗi chặn, 2 lỗi nhẹ. Nghiệm thu 7/7 mục có bằng chứng (A, B, C, D, E, F, K5); thiếu duy nhất phần "quét thật bằng app ngân hàng" của F (chủ quán làm tay).
- Lỗi 1 (K4/K5): `ViKhach.jsx` gắn nút "Nạp tay (thử)" theo `user?.role === 'owner'` còn máy chủ theo `topup_balance` → chủ quán bật lại quyền cho manager ở Phân quyền thì máy chủ cho nạp nhưng quầy không hiện nút. **Giữ nguyên, có chủ ý:** phiếu C ghi nguyên chữ "Nạp tay (thử) — chỉ hiện với chủ quán"; phiếu E giữ máy chủ bật lại được. Ghi Phát hiện cho chat: nếu muốn nút theo `hasPermission('topup_balance')` thì đổi phiếu (ca C4 khoá theo role).
- Lỗi 2 (K1/K5): dải hiện cả khi chỉ có dòng "vào ví" (không đơn mới), trái phiếu A. **ĐÃ SỬA** (vòng sửa 1): `donAppDai.js` `hienDai = soMoi > 0`; ca A5 đổi (đỏ trên bản cũ = đột biến `VS-DAI-HIEN-KHI-CHI-VAO-VI` BẮT; xanh trên bản mới); `npm test --day-du` 104/0.
- Nghi ngờ (cần chủ quán thử tay): chiều cao màn Bán hàng khi dải hiện (`banHang.css` `.bh` cao cố định); `cqw` của TheQr trên máy cũ (Chrome < 105 / Safari < 16 chữ về cỡ mặc định); `matchMedia.addEventListener` trên Safari < 14.
- Chưa soát được: hiển thị thật trong trình duyệt, quét QR thật bằng app MB / Vietcombank / Techcombank / MoMo / ZaloPay.

## Soát bảo mật
Soát lần 1: 0 lỗi trước lọc → không cần bước lọc (0 sau lọc). Báo cáo nguyên ý: "No high-confidence security vulnerabilities (>80%) were introduced by this change."
Đã kiểm: bước 018 chỉ UPDATE hạ quyền, chạy một lần, thoát sớm khi không có dòng cần đổi; seed chỉ chạy khi bảng quyền rỗng, `INSERT OR IGNORE` nên khởi động lại không bật lại; `POST /wallets/topup` còn `authenticate` + `checkPermission('topup_balance')`, owner bypass `middleware/auth.js:85-110`; sửa quyền cần `manage_permissions` (`users.js:188`, seed staff = 0; giá trị manager chưa đọc — hành vi cũ, ngoài diff); `dangerouslySetInnerHTML` trong `TheQr.jsx`: chuỗi `qr` của máy chủ chỉ vào `addData` rồi thành toạ độ số + nhóm màu hằng, `logoHref` bỏ dấu `"`, caption / số tiền là text React; phần A–D chỉ client, gọi API cũ.
SOÁT BẢO MẬT: ĐẠT

## Bài học
Sự cố: (1) người gác chặn lệnh ghép `python … && node …`, lệnh nhắc cụm bí mật của bài thử cũ (B-BIMAT-CHU — phải commit trước), `cd client && …` (B-CD-VITRI) — tách lệnh là đủ; (2) `thu_GIOVN1` G1 đỏ vì `Date.parse` trong file mới (chỉ `ngayVN.js` được đụng giờ) → đọc giờ qua `docGioVN`; (3) đột biến `VS-QR-CHAM-VUONG` SỐNG vì ca F8 chỉ dò `<circle` mà nền logo cũng là `<circle>` → siết thành số `<circle>` > số chấm; (4) soát bắt dải hiện thừa khi chỉ có "vào ví" (ca A5 từng khoá lệch phiếu).
- **KHOÁ (đã làm):** F8 đếm chấm; A5 đổi theo phiếu; đột biến VS-DAI-HIEN-KHI-CHI-VAO-VI.
- **NGUYÊN TẮC (đề xuất, ngoài Phạm vi `KHUON_LOI.md`, K3):** ca "KHÔNG hiện khi không có X" phải thử từng loại tín hiệu gần giống; ca "chỉ dò có mặt của thẻ" (`<circle`) phải đếm số lượng khi nhiều thành phần cùng thẻ.
- **BỎ:** `cd` vào thư mục con làm lệch cwd các lệnh sau — thói quen một lần.

## Báo cáo 7 mục
```
VIỆC:        GIAO-DIEN-1 — Gọn giao diện POS (dải Đơn App · Số dư gộp Khách hàng · ô Khách và tiền · nạp tay chỉ chủ quán · thẻ QR thương hiệu)
ĐÃ SỬA:      server/nang_cap/018_nap_tay_chu_quan.js (mới) — hạ topup_balance manager/staff, sao lưu, chạy một lần; server/database.js:1065,1079 — seed 0;
             client/src/utils/donAppDai.js (mới), components/DonAppNoi.jsx (dải + hook, bỏ nút nổi), components/Layout.jsx (dải đầu main, số đỏ), pages/QuanLy/menu.js (mục Đơn App, soDo, ô Khách và tiền, bỏ lối Số dư);
             components/ViKhach.jsx (mới, thay pages/Balance.jsx đã xoá), pages/Customers.jsx (ô Khách đang gửi quán + khu Ví), App.jsx (/balance → /customers);
             utils/veQrThuongHieu.js + components/TheQr.jsx + assets/logo (mới), pages/BanHang/ManQr.jsx, pages/ManKhach/ManThu.jsx + manKhach.css — dùng thẻ QR chung; bill in giữ veQr.js;
             cong_cu/thu_BH2.js F1/F3/F6/F7/F8/S5 (bài sửa thường, §6.8); client/dist build lại.
BÀI THỬ:     cong_cu/thu_GIAODIEN1.js chạy trên gốc 64258bb → ĐỎ (5 đạt · 42 hỏng: E2/E3 manager/staff nạp được HTTP 200, A11 còn position fixed, thiếu veQrThuongHieu…); sau vá → XANH 68/0. 47 đột biến BẮT 47/47 (dot_bien.py).
ĐÃ RÀ K4:    grep "walletsApi.topup|wallets/topup" client + server → 1 chỗ nạp tay (ViKhach.jsx:53 / wallets.js:143); grep "/balance|Số dư →" client → 0 tham chiếu sót ngoài Navigate;
             chỗ hiện QR thanh toán → 2 (ManQr, ManThu) đều TheQr; qrSvg còn ở bill in + QR tải App (đúng phiếu); "import DonAppNoi" mặc định → 0.
CHƯA KIỂM:   (1) quét thẻ QR bằng app MB / Vietcombank / Techcombank / MoMo / ZaloPay (máy chỉ giải mã bằng jsqr trên ảnh dựng từ ma trận, KHÔNG phải ảnh SVG thật + màu thật + logo thật);
             (2) hiển thị trong trình duyệt: chiều cao màn Bán hàng khi dải hiện, cqw trên máy cũ, modal Ví lồng modal chi tiết khách; (3) "đối soát ví" — màn Số dư cũ chưa từng có nút này, không dựng mới;
             (4) lõi ô góc làm đặc theo chữ phiếu (ảnh mẫu có thể có chấm sáng giữa lõi) — chủ quán xem thử; (5) nút Nạp tay chỉ owner dù Phân quyền bật lại cho manager (lỗi 1 ở trên).
             Thao tác thử tay trên điện thoại: (a) chủ quán → Khách hàng → mở một khách → thấy khu Ví + "Nạp tay (thử)"; quản lý/nhân viên → không thấy nút;
             (b) có đơn App đã trả → dải đỏ ở đầu mọi màn + số đỏ ở "Đơn App" (bảng Thêm); (c) Bán hàng → chuyển khoản → thẻ QR kem-vàng, quét thử bằng app ngân hàng.
GIT:         dòng git log cuối ghi ở "HEAD ĐÃ KIỂM" bên dưới
BÀI HỌC:     KHOÁ 3 (làm luôn) · NGUYÊN TẮC 1 đề xuất · BỎ 1 — chi tiết ở ## Bài học
```
