# GIAO-DIEN-4 — Làm đẹp POS theo mẫu chủ quán duyệt: giữ màu đỏ · vàng · kem, sơn mài + bill giấy, icon thay emoji

<!-- Phiếu do chat POS soạn 28.11.2026 (bàn 42, main 885b40d2 — đã có KHO-GON-1 #110, GIAO-DIEN-3 #111). Máy: Claude Code · SONNET.
     Việc GIAO DIỆN (CSS + JSX phần nhìn + client/dist + bài thử) → việc thường: KHÔNG chờ duyệt kế hoạch, chạy thẳng tới hết. KHÔNG đụng server/.

     CHỦ QUÁN 28.11: "giữ màu nhưng làm icon và giao diện đẹp — bây giờ hơi thô kệch", "sinh động hơn, có nghệ thuật". Duyệt mẫu lần 3 lúc 17:00
     ("ok đấy") + khẩu hiệu dưới logo: "Đông Y Dưỡng Thể". Mẫu: artifact "Mẫu giao diện POS" (claude.ai, bản 1795860069-cdd2) — máy KHÔNG mở được
     claude.ai nên chat chép nguyên văn vào `viec/GIAO-DIEN-4/mau_giao_dien.html` (mở bằng Chrome; logo.png cùng thư mục). CHÉP PHẦN NHÌN, KHÔNG chép mã:
     dữ liệu trong mẫu là giả; vị trí nút, chữ trên nút, hành vi app GIỮ NGUYÊN.

     CHAT ĐÃ ĐỌC (main 885b40d2):
       - client/src/index.css:55–60 quy tắc TOÀN CỤC làm app "đỏ khắp nơi": h1–h6 #B91C1C · strong, b #991B1B · td, th #78716C · input/select/textarea chữ
         #991B1B · placeholder #DC2626. :36 --sidebar-bg gradient đỏ. Nền body gradient hồng; .card có backdrop-filter mờ.
       - Emoji: 222 chỗ / 48 file .jsx (grep khoảng U+1F300–1FAFF, U+2600–27BF). h1.page-title có emoji ở 7 file: Refunds, Orders, Customers, Reports,
         DiscountCodes, Settings (:939), Kho/index.jsx (:79 — Cấm, xem dưới).
       - lucide-react ĐÃ có (Layout.jsx:12–22 import ShoppingCart, Users, Package…). Không cần thư viện mới.
       - client/src/pages/BanHang/AnhMon.jsx (24 dòng): MỘT chỗ vẽ ô ảnh món (thẻ món, dòng giỏ, KhungChonMon, Kho/ToppingMon); chưa có ảnh → chữ viết tắt
         trên nền màu theo tên. Hoá đơn / tem KHÔNG dùng component này.
       - Logo: client/src/assets/logo_TQD_bieu_tuong.png (TheQr.jsx:8 đã import). Không có helmet / CSP ở server → <link> Google Fonts tải được.
       - In: InvoicePrint.jsx · InPhieu.jsx · InvoicePreview.jsx · Kho/inPhieuKho.css (@media print). Bill / tem / phiếu in PHẢI giữ nguyên như hôm nay.
     SONG SONG: KHO-GON-2 (Opus) đang sửa client/src/pages/Kho/** + server/kho/**. Việc này KHÔNG sửa Kho/** — màn Kho tự đẹp theo lớp chung (.card, .btn,
     .page-header, nền, chữ); phần riêng của Kho (tab, thẻ, emoji tiêu đề Kho) làm SAU KHO-GON-2 (GIAO-DIEN-4b). client/dist chat build lại lúc gộp. -->

## Mục tiêu
Mở POS là thấy app của một quán Đông y: thanh bên như hộp sơn mài đỏ có mây vàng, logo và khẩu hiệu "Đông Y Dưỡng Thể"; icon vẽ một bộ thay cho
emoji; chữ màu than dễ đọc, đỏ chỉ ở tiêu đề / giá / nút chính; thẻ món có ảnh hoặc hình ly vẽ; giỏ hàng như tờ bill giấy. Vẫn đúng màu đỏ · vàng · kem,
vẫn đúng mọi nút và cách bán đã chốt, vẫn vừa khít điện thoại · máy tính bảng · máy tính (GIAO-DIEN-3).

## Nghiệm thu

### A. Khung chung — `client/src/index.css` + `client/index.html`
- A1 Biến màu MỘT chỗ ở `:root` (giữ tên biến cũ đang dùng, thêm biến mới): đỏ #B91C1C / đỏ đậm #7F1D1D, vàng #F59E0B, dát vàng #C8962E / #ECD9A8, kem
  #FEF7ED, giấy #FFFDF8, viền #EEDFCC, chữ than #292524, chữ phụ #7C6F66. Không rải mã màu mới trong JSX.
- A2 Bỏ quy tắc toàn cục :55–60 (đỏ cho h1–h6 / strong / b / input…). Chữ thường, chữ trong ô nhập = chữ than; placeholder = chữ phụ. Tiêu đề màn (.page-title)
  = đỏ đậm, phông Playfair Display. Chỗ nào CỐ Ý cần đỏ (giá, lỗi, cảnh báo) phải đã có lớp riêng — rà bằng mắt các màn chính sau khi bỏ, ghi lại chỗ đã thêm lớp.
- A3 Phông: `<link>` Google Fonts trong client/index.html — Be Vietnam Pro (400/500/600/700) cho mọi chữ, Playfair Display (600/700) cho tiêu đề màn, tên
  quán, tổng tiền. Có phông dự phòng (system-ui / Georgia) — mất mạng vẫn đọc được.
- A4 Nền kem PHẲNG + họa tiết mây chìm (SVG data URI như mẫu, `.app` trong mau_giao_dien.html); bỏ gradient hồng của body. `.card` = giấy #FFFDF8, viền
  #EEDFCC, bo 16px, bóng nhẹ; BỎ backdrop-filter. Nút chính (.btn-primary) đỏ, gradient nhẹ như mẫu (.btn.chinh); nút phụ trắng viền kem.
- A5 `.page-header`: nền giấy, vạch dưới kem; tiêu đề có ô icon (A6) bên trái.

### B. Icon thay emoji
- B1 Component mới `client/src/components/TieuDeMan.jsx` ({ icon, ten, phu? }) — ô icon bo góc nền hồng nhạt, icon lucide đỏ + tên màn Playfair. Dùng cho mọi
  h1.page-title ngoài Kho: Refunds, Orders, Customers, Reports, DiscountCodes, Settings (tiêu đề chung + `TEN_THE`), và tiêu đề màn Bán hàng / Quản lý nếu có.
  Bảng icon (kế hoạch ghi đủ): Đơn → Receipt · Khách → Users · Báo cáo → BarChart3 · Hoàn tiền → Undo2 · Mã chiết khấu → Ticket · Cài đặt → Settings …
- B2 Thanh điều hướng (Layout.jsx) đã dùng lucide — giữ, chỉ đổi kiểu (C). Emoji trong NỘI DUNG khác (48 file) → KHÔNG làm hết ở việc này: đổi ở màn
  Bán hàng (nút trả tiền, chip nhóm) + Quản lý; còn lại ghi Phát hiện kèm số đếm (grep) để làm đợt sau.

### C. Thanh bên + thanh dưới — `Layout.jsx` (+ index.css)
- C1 Máy tính: nền sơn mài (gradient đỏ đậm + mây vàng chìm như `.app .ben` của mẫu); đầu thanh: logo 64px giữa, "Tứ Quý Đường" Playfair, dưới là khẩu hiệu
  **"Đông Y Dưỡng Thể"** (Playfair nghiêng, vàng nhạt #ECD9A8) — chữ đặt MỘT chỗ (hằng số có tên, để đóng gói cho quán khác); vạch vàng mảnh ngăn.
  Mục đang chọn: nền vàng nhạt mờ + vạch vàng bên trái + icon vàng. Chân thanh: tên người đăng nhập + vai trò (chữ có sẵn trong AuthContext; không gọi API mới),
  giữ nút Đăng xuất đang có.
- C2 Điện thoại (≤ 768px): thanh dưới 5 mục GIỮ đúng mục và thứ tự (QuanLy/menu.js DIEN_THOAI); mục đang chọn đỏ + chấm vàng nhỏ dưới; nền giấy.
- C3 Mọi số đỏ / dải báo đang có (đơn App, số nợ kho) giữ nguyên vị trí và hành vi.

### D. Màn Bán hàng — `client/src/pages/BanHang/**`
- D1 Thẻ món theo mẫu: khung hình trên (ảnh món nếu có — ANH-MON-1; chưa có → hình ly vẽ D2), nhãn tồn góc trái trên ("Còn n" / "Pha ngay" / "Hết"), số lượng
  đang có trong giỏ góc phải trên (vòng đỏ) nếu màn đã có số này — KHÔNG thêm phép tính mới; dưới: mã nhỏ, tên, giá đỏ. Món hết: xám + mờ, vẫn không bấm được như cũ.
- D2 `AnhMon.jsx`: chưa có ảnh / ảnh lỗi → vẽ HÌNH LY (SVG như hàm `ly()` của mẫu: ly, nước, đá, bóng) — màu nước theo NHÓM món (category): hằng số một
  chỗ, vd tea → hổ phách, coffee → nâu cà phê, juice → cam, nhóm lạ → màu mặc định. Không thêm cột CSDL. Cỡ nhỏ (dòng giỏ, ô topping) vẫn vẽ gọn, không vỡ.
  Có ảnh → giữ nguyên ảnh như ANH-MON-1. Đổi hành vi chữ viết tắt → sửa thu_ANHMON1.js theo LUAT §6.8 (chủ quán duyệt đổi).
- D3 Hàng chip nhóm: chip bo tròn có ô icon nhỏ (hình ly thu nhỏ theo màu nhóm) + số đếm như hôm nay; chip đang chọn đỏ.
- D4 Giỏ hàng (máy tính) kiểu tờ bill: nền giấy, mép dưới răng cưa, đường kẻ nét đứt giữa các dòng, dòng "Tổng" vạch đậm trên + số Playfair đỏ to; nút Tiền mặt /
  Chuyển khoản đỏ có icon (Banknote / QrCode), "In bill · mang ra bàn" viền vàng. Điện thoại: thanh giỏ đỏ đậm như mẫu (nếu màn đã có thanh giỏ — giữ hành vi).
- D5 KHÔNG đổi: chữ trên nút, thứ tự nút, bố cục cột, sáu luật thiết kế (ban_mau_pos/DAC_TA.md §3), mọi lời gọi máy chủ. Lời chào "Chào buổi …, <tên>" và ô số
  "Đã bán / Doanh thu" trong mẫu: KHÔNG làm ở việc này (cần dữ liệu / quyền — ghi Phát hiện).

### E. Quản lý — `client/src/pages/QuanLy/**`
- E1 6 thẻ nhóm như mẫu: đầu thẻ có ô icon màu (Món & giá + Cài đặt quán: vàng #C8962E · Khách & thẻ + Nhân viên: lam #29406B · Khuyến mãi: đỏ · Tiền & báo cáo:
  lục #3F7A45 — bốn màu logo), tên nhóm Playfair, mỗi dòng có "›". Dạng danh sách ở điện thoại giữ như GIAO-DIEN-2 (M2). Dữ liệu vẫn từ menu.js.

### F. Kiểm
- F1 `cong_cu/thu_GIAODIEN4.js` (đọc file, không cần trình duyệt), gắn vào `kiem_tra_truoc_khi_giao.js`:
  - không còn emoji trong h1.page-title / TieuDeMan ở các file của B1 (ca ĐỎ: một tiêu đề còn emoji);
  - index.css không còn quy tắc toàn cục chữ đỏ cho input/select/textarea và strong/b (ca ĐỎ từng quy tắc; so theo bộ chọn + giá trị, không dò chuỗi cả dòng);
  - Layout có khẩu hiệu "Đông Y Dưỡng Thể" lấy từ MỘT hằng số; AnhMon chưa ảnh → nhánh vẽ ly, có ảnh → img (đột biến "luôn vẽ ly" và "luôn img" phải BẮT);
  - màu theo nhóm một chỗ: nhóm lạ → màu mặc định (ca không truyền nhóm);
  - phép của GIAO-DIEN-3 (thu_GIAODIEN3.js: min-width 0, text-size-adjust, tab Kho) vẫn xanh.
- F2 In không đổi: grep / so file in (InvoicePrint, InPhieu, InvoicePreview, inPhieuKho.css) không bị sửa; quy tắc mới trong index.css không áp vào lớp in
  (kế hoạch nêu cách kiểm — vd phông in giữ nguyên trong @media print).
- F3 `cd client && npm run build`; `npm test`; `node kiem_tra_truoc_khi_giao.js --day-du`; `bash ban_mau_pos/chay_thu.sh` (số phép giữ nguyên — bản mẫu không sửa);
  `node tu_chay/cong.js chay` ĐẠT.
- F4 Có Chrome: chụp Bán hàng · Quản lý ở 390 / 820 / 1.280 px (dựng tĩnh từ CSS như GIAO-DIEN-3 hoặc chạy vite preview với dữ liệu giả), scrollWidth = bề rộng
  màn; lưu ảnh vào viec/GIAO-DIEN-4/ để chat so với mẫu. Không có → CHƯA KIỂM.
- F5 Thử tay cho chủ quán (báo cáo): (1) máy tính: thanh bên đỏ sơn mài, logo + "Đông Y Dưỡng Thể", icon thay emoji ở Đơn / Khách / Báo cáo; (2) điện thoại:
  Bán hàng — thẻ món có ảnh hoặc hình ly, chạm món vào giỏ như cũ, bill / thanh giỏ đúng tổng; (3) in thử một bill: tờ in giống hệt hôm nay.

## Phạm vi
- viec/GIAO-DIEN-4/**
- client/index.html
- client/src/index.css
- client/src/components/Layout.jsx
- client/src/components/TieuDeMan.jsx
- client/src/pages/BanHang/**
- client/src/pages/QuanLy/**
- client/src/pages/Refunds.jsx
- client/src/pages/Orders.jsx
- client/src/pages/Customers.jsx
- client/src/pages/Reports.jsx
- client/src/pages/DiscountCodes.jsx
- client/src/pages/Settings.jsx
- client/dist/**
- cong_cu/thu_GIAODIEN4.js
- cong_cu/thu_ANHMON1.js
- cong_cu/thu_*.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~450 dòng CSS / JSX (phần lớn CSS) + ~150 dòng thử.
**Phương án đơn giản nhất đã xét:** đổi ở GỐC — biến màu + quy tắc chung trong index.css, MỘT component tiêu đề, MỘT chỗ vẽ ảnh món (AnhMon) — thay vì sửa
từng màn. Các file trang (Refunds, Orders…) CHỈ đổi dòng tiêu đề; thu_*.js chỉ sửa đúng dòng kiểm chuỗi / lớp đã đổi (LUAT §6.7–6.8).

## Đổi cấu trúc DB
không

## Thư viện mới
không (lucide-react có sẵn; phông qua <link> Google Fonts)

## Soát bảo mật
không — chỉ phần nhìn; không route, quyền, dữ liệu mới.

## Cấm
- KHÔNG sửa server/**, ban_mau_pos/**, client/src/pages/Kho/** (KHO-GON-2 đang sửa), client/src/components/InvoicePrint.jsx · InPhieu.jsx · InvoicePreview.jsx.
- KHÔNG đổi chữ trên nút, thứ tự / vị trí nút, lời gọi máy chủ, hành vi bán hàng; KHÔNG thêm nút.
- Orders.jsx · Customers.jsx · Settings.jsx · Refunds.jsx · Reports.jsx · DiscountCodes.jsx: CHỈ đổi dòng tiêu đề (B1).
