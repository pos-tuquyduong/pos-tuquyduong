# GIAO-DIEN-4 — kế hoạch

Việc thường (giao diện): không chờ duyệt. Chỉ sửa trong Phạm vi của phiếu. Mọi số dòng dưới đây là ước lượng, đọc code lượt này (28.11).

## Đã đọc (file:dòng)
- `client/src/index.css:3–39` biến màu; `:46–60` body gradient hồng + quy tắc toàn cục đỏ (h1–h6, strong/b, a, td/th, input, placeholder); `:127–135` `.card` backdrop-filter; `:151–172` nút; `:175–196` `.input` chữ #991B1B; `:713–749` bottom-nav; `:882–895` lưới Quản lý.
- `client/src/components/Layout.jsx:71–77` sidebar-header (logo 36px + tên), `:129–153` chân thanh bên (tên + vai trò, nút Đăng xuất), `:156–190` bottom-nav.
- `client/src/pages/BanHang/AnhMon.jsx:1–24` (chữ viết tắt theo tên); `BanHangMoi.jsx:352–410` cột món (chip `bh-tab`, thẻ `bh-mon`), `:418–474` giỏ; `banHang.css` (110 dòng); `ThuTien.jsx:29–30` nút Tiền mặt / Chuyển khoản.
- `client/src/pages/QuanLy/QuanLy.jsx:25` `<h1>Quản lý</h1>` (chưa có class `page-title`), `:34–49` thẻ nhóm; `menu.js:61–` 6 nhóm.
- 7 tiêu đề emoji: Customers.jsx:591, DiscountCodes.jsx:266, Orders.jsx:434, Refunds.jsx:43, Reports.jsx:132, Settings.jsx:939 (+ Kho/index.jsx:79 — Cấm, không đụng).
- In: InvoicePrint / InPhieu in qua iframe tự dựng tài liệu (font Arial riêng, InvoicePrint.jsx:272, InPhieu.jsx:88) → index.css không chạm tới. Kho in bằng `window.print()` trên chính trang (inPhieuKho.css:6) → CÓ thừa hưởng font + màu `body` / `td, th` của index.css → phải khoá bằng khối `@media print` (F2).
- Bài thử cũ ràng buộc index.css / Layout: thu_GIAODIEN3 (`.main-content` min-width 0/flex 1/margin-left 240, text-size-adjust, `.table` 600px, `.table-responsive`), thu_GIAODIEN2 (`.ql-luoi` 3 cột, `.ql-nut` min-height ≥ 52px trong @media 768), thu_BAO1a (`.thong-bao-*`), thu_BAO1b (`.loi-o` đỏ), thu_GIAODIEN1 (`<main className="main-content"><DaiDonApp`, `nav-badge`), thu_BH2 S14 (`dungMenu`). Giữ nguyên các khối đó.

## Phương án cho từng phần
| Phần | A (chọn) | B | Lý do |
|---|---|---|---|
| A khung chung | sửa tại chỗ `index.css` (~+110 / −40 dòng) + `<link>` phông ở `index.html` | file `theme.css` mới import sau | Phạm vi chỉ liệt kê `index.css`; một file thì F1 đọc một chỗ |
| B tiêu đề | `TieuDeMan.jsx` ~25 dòng + mỗi trang đổi 1 dòng | sửa từng h1 tại chỗ | một chỗ vẽ ô icon; trang chỉ đổi dòng tiêu đề (đúng Cấm) |
| C thanh bên | sửa JSX `Layout.jsx` (~+25) + CSS | file Sidebar riêng | không đổi cấu trúc (thu_GIAODIEN1 A13/B5 dò `<main …><DaiDonApp`) |
| D1/D2 ly vẽ | `AnhMon.jsx` vẽ SVG ly (~+45), hằng `MAU_NUOC` + `mauNuoc(nhom)` một chỗ; `nhanTon(sp)` ở `tinh.js` (hàm thuần, có ca) | thêm cột ảnh/màu ở DB | phiếu cấm đổi DB |
| D3 chip nhóm | giữ nút `bh-tab`, thêm ô icon ly nhỏ (dùng lại `AnhMon`'s `HinhLy`) | component chip mới | ít dòng |
| D4 bill | chỉ CSS (`banHang.css`) + thêm icon `Banknote` / `QrCode` vào 2 nút ở ThuTien.jsx | JSX mới cho giỏ | không đụng hành vi |
| E Quản lý | thêm `icon` + `mau` vào mỗi nhóm trong `menu.js` (chuỗi, hàm vẫn thuần), `QuanLy.jsx` ánh xạ tên → lucide | bảng ánh xạ theo tên nhóm trong JSX | một nguồn dữ liệu (LUAT §2) |

Tổng ước lượng: CSS ~+230/−60, JSX ~+110, thử ~+160. Vượt ngân sách "~450 dòng CSS/JSX" khoảng 10 %: nguyên nhân là SVG ly + 6 màu thẻ nhóm; không bỏ được vì là phần chủ quán đã duyệt trong mẫu.

## Quyết định / điều phiếu chưa khớp code (tự chọn an toàn, ghi Phát hiện)
1. **"Số đếm như hôm nay" (D3)**: hôm nay hàng chip nhóm KHÔNG có số đếm (BanHangMoi.jsx:357). Không thêm số đếm (phiếu cấm thêm phép tính) → chip chỉ thêm ô icon.
2. **Vòng đỏ số lượng trong giỏ ở thẻ món (D1)**: màn chưa có số lượng theo món (chỉ `soLy` tổng) → KHÔNG làm; ghi Phát hiện.
3. **Nhãn tồn (D1)**: dùng đúng hai trường đã có sẵn trên món (`stock_quantity`, `khong_quan_kho`): hết → "Hết"; không quản kho → "Pha ngay"; còn số → "Còn n"; không có số → không nhãn. Dòng chữ "Hết hàng" cuối thẻ bỏ vì nhãn "Hết" thay (thẻ vẫn disabled y như cũ — `disabled={het || chuaCT || !coGia(s)}` không đổi).
4. **Lời chào + "Đã bán / Doanh thu"**: không làm (phiếu D5).
5. **`<h1>Quản lý</h1>` chưa có `page-title`** → dùng `TieuDeMan` (phiếu B1 cho phép).
6. **In**: khối `@media print` cuối index.css trả lại đúng font + màu cũ của `body`, `h1–h6`, `strong/b`, `td/th` (Kho in qua `window.print()` thừa hưởng chúng). Phép thử so từng giá trị với bản cũ.

## Ca thử ↔ mục nghiệm thu (cong_cu/thu_GIAODIEN4.js)
| Mục | Ca |
|---|---|
| A1 | 10 biến màu ở `:root` đúng giá trị; tên cũ (`--primary`, `--accent`, `--cream`…) còn |
| A2 | ngoài `@media print`: không còn rule toàn cục màu ĐỎ cho từng bộ chọn `h1–h6`, `strong,b`, `td,th`, `input,select,textarea`, `::placeholder` (so bộ chọn + giá trị, KHÔNG dò dòng); `input` = chữ than, placeholder = chữ phụ, `.page-title` = đỏ đậm + Playfair; ca ĐỎ tự thử: CSS giả chứa từng rule cũ phải bị bắt |
| A3 | index.html có `<link>` Google Fonts (Be Vietnam Pro 400–700, Playfair 600/700); font stack có `system-ui` / `Georgia` |
| A4 | `body` không còn gradient; có họa tiết mây (data URI); `.card` nền giấy, viền, bo 16px, KHÔNG backdrop-filter; `.btn-primary` gradient đỏ; `.btn-outline` nền trắng |
| A5 | `.page-header` nền giấy + vạch dưới màu viền kem |
| B1 | TieuDeMan.jsx dựng thật bằng esbuild → có `page-title`, ô icon, tên; 6 trang + QuanLy dùng `<TieuDeMan`, không emoji trong tiêu đề (ca ĐỎ: file giả có emoji); Kho/index.jsx không bị sửa |
| C1 | Layout.jsx: khẩu hiệu "Đông Y Dưỡng Thể" xuất hiện đúng MỘT lần (hằng số có tên) và hằng đó được vẽ; logo import từ assets; `.sidebar` nền sơn mài + mây; `.nav-item.active` vạch vàng + icon vàng |
| C2 | `.bottom-nav` nền giấy; `.bottom-nav-item.active` đỏ + chấm vàng; menu.js DIEN_THOAI không đổi (thu_BH2 canh) |
| C3 | `nav-badge`, dải số nợ kho còn nguyên (thu_GIAODIEN1 canh + dò chuỗi ở đây) |
| D1 | `nhanTon` 6 ca (hết / pha ngay / còn n / không số / quản kho + 0 / ngay biên 1); `BanHangMoi` dùng nhãn; `disabled={het || chuaCT || !coGia(s)}` còn nguyên |
| D2 | AnhMon vẽ thật: chưa ảnh → `<svg` ly, không `<img`, màu nước theo nhóm (tea/coffee/juice), nhóm lạ + KHÔNG truyền nhóm → màu mặc định; có ảnh → `<img` và không `<svg`; ảnh lỗi → ly (đột biến "luôn vẽ ly" / "luôn img" bắt) |
| D3 | chip nhóm có `<HinhLy` nhỏ |
| D4 | `.bh-cot-gio` nền giấy + mép răng cưa; `.bh-dong` nét đứt; `.bh-tong` Playfair đỏ; ThuTien có `<Banknote` / `<QrCode` mà chữ nút giữ nguyên |
| D5 | chữ nút Tiền mặt / Chuyển khoản / Trừ tài khoản / Đã nhận tiền / Hiện mã QR · …, thứ tự nút không đổi |
| E1 | menu.js: 6 nhóm đều có `icon` + `mau` đúng bảng (Món & giá + Cài đặt quán = vàng, Khách & thẻ + Nhân viên = lam, Khuyến mãi = đỏ, Tiền & báo cáo = lục); QuanLy.jsx vẽ; `.ql-nut` ≥ 52px ở 768 còn nguyên |
| F1 | các phép trên gắn vào `kiem_tra_truoc_khi_giao.js`; thu_GIAODIEN3 vẫn xanh |
| F2 | `@media print` trả đúng font/màu cũ; 4 file in (InvoicePrint, InPhieu, InvoicePreview, inPhieuKho.css) không bị sửa (`git diff --name-only 08392a6`) |

Luồng hợp lệ phải KHÔNG bị chặn (K5): thẻ món vẫn bấm được khi còn hàng / không quản kho / có giá; thẻ "Nạp tiền", "Thẻ thành viên" (không có `stock_quantity`) vẫn vẽ như cũ — KHÔNG ép ảnh / nhãn lên chúng; topping có ảnh vẫn `<img>`; ảnh lỗi → ly vẽ.

Đột biến cho `viec/GIAO-DIEN-4/dot_bien.py`: không bắt buộc — việc KHÔNG đụng `server/`; riêng `client/src/` nên kèm BV-/VS- cho AnhMon + nhanTon (xem trang_thai).

## Đường song song (K4)
- Emoji ở tiêu đề: 6 trang + QuanLy; `grep` lại toàn `client/src` sau khi sửa để kê số còn lại (Phát hiện).
- Quy tắc toàn cục đỏ: grep toàn index.css các màu #991B1B / #DC2626 / #B91C1C xem còn "đỏ toàn cục" ở `.input`, `.login-field input`.
- `AnhMon` có 4 chỗ gọi (BanHangMoi ×2, KhungChonMon, Kho/ToppingMon — Cấm sửa file Kho): chữ ký mới thêm `nhom` TUỲ CHỌN, mặc định → màu mặc định (không đổi dạng lời gọi cũ).
