# GIAO-DIEN-2 — Tinh gọn Quản lý · Cài đặt · Khách hàng theo mẫu chủ quán đã duyệt; gỡ mọi chữ / nút SX còn trên màn hình

<!-- Phiếu do chat POS soạn 25.11.2026 (bàn 41, main 7da9ba9a — KHO-3a ĐÃ GỘP 20.11). Máy: Claude Code · SONNET.
     Việc GIAO DIỆN (chỉ client/src + client/dist + bài thử) → việc thường: KHÔNG chờ duyệt kế hoạch, chạy thẳng tới hết. KHÔNG đụng server/.

     MẪU ĐÃ DUYỆT: artifact Design "Tinh gọn Cài đặt & Khách hàng — POS Tứ Quý Đường" (claude.ai, bản 1794914401-b02e). Máy KHÔNG mở được
     claude.ai nên phiếu chép lại đủ nội dung mẫu ở mục "Mẫu" dưới. Chủ quán duyệt tạm 09.11, chốt lần 2 ngày 17.11 (6 chỗ):
       (1) gộp "Món, giá & công thức"; (2) bỏ mọi mục SX; (3) bỏ "Gói đang dùng"; (4) hạng mẫu chỉ Vàng + Kim Cương (hạng thật lấy từ cài đặt);
       (5) thêm bản điện thoại; (6) không có trang Đăng ký / Export SX. "Những chỗ không nhắc đến là đồng ý" (17.11 19:04).
     Chủ quán 19.11 đồng ý đổi chữ dưới ô Thực thu (Báo cáo). Chủ quán 18.11 (Câu 3 KHO-3a): nút "Hoàn kho SX" bỏ ở việc này.

     CHAT ĐÃ ĐỌC (main 7da9ba9a):
       - QuanLy/menu.js O_QUAN_LY: lưới 7 ô cũ (BH-2) — thu_BH2.js khoá lưới. QuanLy.jsx vẽ lưới + ô "Dọn dữ liệu thử" (chỉ owner, KH-SDT-1).
       - Settings.jsx (2.363 dòng): 19 thẻ trong 3 nhóm NHOM_THE (~230–245): products(Giá bán) packages goiNap gioHoatDong inPhieu manKhach giaoHang |
         loyalty signup tiers flash rewards chuongTrinh quangCao | users permissions backup appKh. Đổi thẻ có hỏi khi còn thay đổi chưa lưu (doiThe ~269).
       - Thẻ 'products' (Giá bán ~1042–1173) giữ 2 thứ Kho › Sản phẩm (KHO-3a A5, đã sửa được giá) CHƯA có: tick "nhóm đặc biệt" (is_special_group —
         giảm theo hạng) và nhóm "món tặng khách mới" (signupGroupMembers). → KHÔNG xoá thẻ này trong việc này; đổi lối vào (B2). Gộp hẳn về Kho: KHO-3b.
       - CaiDat/HangThe.jsx: hạng + đặt / đổi PIN chủ quán (datPin ~92) + hỏi PIN khi lưu (setHoiPin ~70–77, HANG-1).
       - Customers.jsx: thẻ đếm + lọc "Đã đồng bộ SX / Chờ đồng bộ" (~323–399), câu "Chờ đồng bộ với SX." (~152), "Ghi chú SX:" (~847),
         "bổ sung SĐT ở hệ thống SX" (~923), cột "Gói đăng ký" (~425), dòng "📦 Gói đang dùng" (~748). Thêm khách gọi registrationsApi.create —
         máy chủ (registrations.js POST /) ĐÃ tạo khách thật trong POS (KHACH-APP-1) → giữ lời gọi, chỉ đổi chữ.
         customersV2Api.list() trả membership + ngay_sinh (utils/docKhach.js) → lọc mới làm được ở màn hình.
       - Orders.jsx:270 DAMAGE_ACTIONS 'return_stock' "Hoàn kho SX" (máy chủ KHO-3a trả 410 HOAN_KHO_SX_DA_BO); :714 hiện nhãn dòng cũ; :1318 ô chọn;
         :1227 câu huỷ đơn "Hoàn tồn kho SX (các sản phẩm trong đơn)".
       - Registrations.jsx (trang Đăng ký / Export SX; máy chủ KHO-3a trả 410 SX_DA_NGAT cho xuất). App.jsx:67–68 route registrations, sync.
       - components/CustomerInput.jsx: KHÔNG file nào import (grep) — code chết, có chữ "(Đã sync SX)".
       - Reports.jsx ~240: "= tiền mặt + chuyển khoản thật nhận" dưới ô Thực thu.
     SONG SONG: TIEN-KHOA-2 (Opus) cũng sửa Orders.jsx + api.js; DOISOAT-NHANH sửa DoiSoat.jsx + api.js. Việc này chỉ đổi đúng các dòng nêu ở Orders.jsx,
     không đụng api.js trừ C5; xung đột client/dist chat build lại lúc gộp. -->

## Mục tiêu
Chủ quán / quản lý mở **Quản lý** là thấy 6 nhóm, mỗi nút mở THẲNG đúng màn (không còn một trang Cài đặt dài 19 thẻ), có ô tìm nhanh. Khách hàng
xem gọn trên điện thoại và máy tính: danh sách + chi tiết 3 số chính. Không còn chữ, nút, trang nào của SX trên màn hình (SX đã ngắt từ KHO-3a).
Không mất chức năng nào đang có.

## Mẫu (chép từ artifact đã duyệt — chép HÀNH VI, bố cục, chữ; dùng CSS / lớp sẵn có của POS, KHÔNG đổi màu / phông toàn app)
- **M1 Quản lý (máy tính):** tiêu đề "Quản lý"; bên phải ô "Tìm nhanh một mục cài đặt" (gợi ý "Gõ: PIN, giờ mở cửa, hạng Vàng, máy in…").
  Lưới 3 cột, 6 thẻ, mỗi thẻ tiêu đề + các nút:
  - **Món & giá:** Món, giá & công thức · Gói nạp tiền
  - **Khách & thẻ:** Danh sách khách · Hạng thành viên · Điểm & quà
  - **Khuyến mãi:** Mã giảm giá · Giờ vàng · Chương trình · Quảng cáo trên App
  - **Tiền & báo cáo:** Đối soát tiền · Hoàn tiền · Báo cáo doanh thu
  - **Nhân viên:** Tài khoản nhân viên · Ai được làm gì
  - **Cài đặt quán:** Giờ mở cửa · Giao hàng · In bill & tem · Màn khách · PIN chủ quán · Sao lưu
  Dòng chú thích cuối: "Mỗi nút mở thẳng đúng màn. Một món chỉ sửa ở MỘT chỗ. Không còn mục nào của SX."
- **M2 Quản lý (điện thoại 390):** cùng 6 nhóm, dạng danh sách: tiêu đề nhóm chữ nhỏ xám, các dòng cao ≥ 52px có "›" bên phải; ô tìm ở đầu.
- **M3 Hạng thành viên:** dòng "← Quản lý" trên cùng; tiêu đề + câu "Khách có hạng được giảm giá khi mua. Khách có nhiều hạng thì máy dùng hạng cao nhất."
  Mỗi hạng một thẻ: hạng ĐANG SỬA mở rộng (viền đậm, "· đang sửa"): ô % giảm món thường, % giảm nhóm đặc biệt; hai nút chọn "Mua ở quầy / trên App" |
  "Chỉ chủ quán cấp"; "Gói bán" mỗi dòng: thời hạn · ô giá · ☐ Đang bán; "+ Thêm gói". Hạng KHÁC thu gọn một dòng tóm tắt ("Giảm 15% · Chỉ chủ quán cấp")
  + nút "Sửa". "+ Thêm hạng" cuối. **Thanh dính đáy** khi có thay đổi: "Hạng <tên> có thay đổi chưa lưu" + Huỷ | Lưu thay đổi.
- **M4 Lưu có PIN:** bấm Lưu → hộp "Gõ PIN chủ quán để lưu", dòng tóm tắt thay đổi, ô PIN; sai → lời đỏ dưới ô (nói số lần còn lại CHỈ khi máy chủ trả
  số đó, không bịa); đang lưu → nút "Đang lưu…" mờ, không bấm hai lần; xong → báo xanh "Đã lưu hạng <tên>"; lỗi → hộp đỏ có tiêu đề + lý do + cách sửa.
  (Phần lớn đã có từ HANG-1 / BAO-1b — giữ, chỉ cho khớp bố cục.)
- **M5 Khách hàng (máy tính):** tiêu đề + nút "+ Thêm khách"; ô "Tìm khách" (tên hoặc SĐT); chip lọc: Tất cả · Có số dư · Có hạng · Sinh nhật tháng này.
  Hai cột: trái danh sách (tên đậm, SĐT dưới, nhãn hạng nếu có; dòng đang chọn tô nền); phải chi tiết: tên lớn + "SĐT · sinh nhật dd/mm";
  3 ô số: **Số dư** · **Điểm** · **Hạng** (+ "hết hạn dd/mm"); nút: Nạp tiền · Sửa thông tin · "Thêm… (cấp hạng, người thân)"; hai tab: Đơn gần đây | Voucher.
- **M6 Khách (điện thoại):** danh sách đủ rộng, chạm một khách → chi tiết TOÀN MÀN có "← Khách hàng"; 3 ô số; hàng nút 3 cột Nạp tiền · Sửa · Thêm…; hai tab.
- Ngưỡng điện thoại theo CSS sẵn có (index.css `@media (max-width: 768px)`). Thanh menu trái (máy tính) / thanh dưới 5 mục (điện thoại) GIỮ như hiện nay (menu.js MAY_TINH / DIEN_THOAI).

## Nghiệm thu

### A. Trang Quản lý (M1, M2)
- A1 `QuanLy/menu.js`: thay O_QUAN_LY bằng **6 nhóm đúng tên và thứ tự M1**. Mỗi nút = { ten, to, quyen, tuKhoa } — `to` mở THẲNG màn đích (B1). Hàm thuần.
  Nút cần quyền mà người dùng không có → ẩn; nhóm hết nút → ẩn nhóm (như luoiQuanLy hôm nay). Quyền mỗi nút = ĐÚNG quyền thẻ / màn cũ (bảng B1).
- A2 Ô tìm nhanh: hàm thuần `timMuc(chuoi, coQuyen)` trong menu.js — so khớp KHÔNG dấu, không phân biệt hoa thường, trên tên nút + từ khoá
  (vd "pin" → PIN chủ quán; "gio mo cua" → Giờ mở cửa; "hang vang" / "kim cuong" → Hạng thành viên; "may in" → In bill & tem, In phiếu kho; "vi", "so du" →
  Danh sách khách; "nhan vien" → Tài khoản nhân viên). Gõ → lưới chỉ còn nút khớp; Enter khi còn đúng 1 nút → mở nút đó; rỗng → đủ 6 nhóm.
- A3 Điện thoại (≤ 768px như index.css hiện nay): trang Quản lý vẽ dạng danh sách M2 (cùng dữ liệu menu.js, không danh sách thứ hai).
- A4 Ô "Dọn dữ liệu thử" (chỉ owner, KH-SDT-1) GIỮ, đặt cuối trang ngoài 6 nhóm.

### B. Mỗi nút mở thẳng đúng màn — KHÔNG mất chức năng
- B1 `Settings.jsx` nhận `?the=<mã thẻ>` → mở đúng thẻ đó, ẩn hàng nhóm / hàng thẻ, hiện "← Quản lý" + tiêu đề thẻ. Không có `?the=` → như hôm nay
  (đường cũ /settings vẫn chạy). Bảng ánh xạ (kế hoạch ghi lại, bài thử khoá ĐỦ từng dòng):
  | Nút | Mở | Quyền |
  |---|---|---|
  | Món, giá & công thức | /kho (thẻ Sản phẩm & công thức) | như mục Kho |
  | Giá bán & nhóm món *(tạm, xem B2)* | /settings?the=products | manage_settings |
  | Gói nạp tiền | ?the=goiNap | manage_products |
  | Danh sách khách | /customers | — |
  | Hạng thành viên | ?the=tiers | manage_promotions |
  | Điểm & quà | ?the=loyalty (trên màn có lối sang rewards, signup) | manage_settings |
  | Mã giảm giá | /discount-codes | như ô cũ |
  | Giờ vàng | ?the=flash | manage_settings |
  | Chương trình | ?the=chuongTrinh | manage_promotions |
  | Quảng cáo trên App | ?the=quangCao | manage_settings |
  | Đối soát tiền | /reports?tab=<thẻ Đối soát> (Reports.jsx:25 hôm nay chỉ nhận `tab=packages` → thêm nhận thẻ Đối soát, giữ mặc định 'daily') | view_reports |
  | Hoàn tiền | /refunds | approve_refund |
  | Báo cáo doanh thu | /reports | view_reports |
  | Tài khoản nhân viên | ?the=users | manage_users |
  | Ai được làm gì | ?the=permissions | manage_permissions |
  | Giờ mở cửa | ?the=gioHoatDong | manage_settings |
  | Giao hàng | ?the=giaoHang | manage_settings |
  | In bill & tem | /invoice-settings | như ô cũ |
  | In phiếu kho *(thêm — chức năng có sẵn, mẫu không vẽ)* | ?the=inPhieu | manage_settings |
  | Màn khách | ?the=manKhach | manage_settings |
  | PIN chủ quán | màn PIN riêng (B4) | chỉ owner |
  | Sao lưu | ?the=backup | export_data |
  | App khách hàng *(thêm — chỉ chủ quán)* | ?the=appKh | chi_chu_quan |
  Thẻ `signup`, `rewards` không có nút riêng → mở được từ màn Điểm & quà (liên kết trên đầu màn), quyền giữ như cũ.
  Thẻ `packages` (gói — đang TẠM NGƯNG, chủ quán 17.11) → KHÔNG có nút; `?the=packages` vẫn mở được (không xoá code, ghi Phát hiện "gói kiểu mới").
  Kế hoạch grep MỌI thẻ trong NHOM_THE + mọi route App.jsx: thẻ / màn nào chưa có lối từ Quản lý → thêm vào nhóm gần nhất, ghi trong kế hoạch.
- B2 Nút "Giá bán & nhóm món" là TẠM: thẻ products còn giữ tick "nhóm đặc biệt" và "món tặng khách mới" mà Kho › Sản phẩm chưa có. Đặt ngay dưới
  "Món, giá & công thức" trong nhóm Món & giá; đầu màn ghi "Giá sửa ở Kho › Sản phẩm; ở đây chỉnh nhóm đặc biệt và món tặng khách mới". Ghi Phát hiện
  cho KHO-3b: dời hai tick về Kho rồi bỏ nút này.
- B3 Ô cũ trên Quản lý (BH-2) trỏ tới /settings chung → không còn. Mọi đường dẫn cũ (/settings, /registrations, /sync, /balance…) vẫn mở được
  (chuyển hướng đúng chỗ — C3).
- B4 **PIN chủ quán** thành màn riêng (tách phần đặt / đổi PIN khỏi HangThe.jsx sang `CaiDat/PinChuQuan.jsx`, cùng lời gọi hangApi.datPin, cùng luật gõ lại
  mật khẩu / PIN cũ — KHÔNG đổi máy chủ). Màn Hạng thành viên còn một dòng "Đặt / đổi PIN chủ quán ›" trỏ sang.

### C. Gỡ SX khỏi màn hình
- C1 Customers.jsx: bỏ thẻ đếm + chip lọc "Đã đồng bộ SX / Chờ đồng bộ" + nhãn trạng thái đồng bộ; câu sau khi thêm khách → "Đã thêm khách <tên>." (giữ phần
  voucher); "Ghi chú SX:" → "Ghi chú:"; câu "bổ sung SĐT ở hệ thống SX" → "Khách chưa có SĐT — sửa thông tin khách để thêm SĐT trước"; bỏ cột "Gói đăng ký";
  bỏ dòng "📦 Gói đang dùng" (gói tạm ngưng). Chú thích đầu file sửa cho đúng (không còn "khách từ SX").
- C2 Orders.jsx: bỏ lựa chọn `return_stock` khỏi ô chọn cách xử lý báo hỏng (:1318); bảng báo hỏng cũ vẫn hiện nhãn cho dòng cũ: 'return_stock' →
  "Hoàn kho (cũ)" (K5 dữ liệu cũ); câu huỷ đơn :1227 → "Trả lại kho (các món trong đơn)". KHÔNG đổi gì khác trong Orders.jsx.
- C3 Xoá `pages/Registrations.jsx`; App.jsx: `/registrations` và `/sync` → `<Navigate to="/customers" replace />`. Xoá `components/CustomerInput.jsx`
  (grep xác nhận không ai import).
- C4 Sau việc: `grep -rn "SX" client/src` chỉ còn: chú thích code, `pages/Kho/NhapSx.jsx` + thẻ "Nhập từ SX" của Kho (công cụ nhập danh mục của chủ
  quán — KHÔNG sửa), BanHang/tinh.js (KHO-3a). Kế hoạch in kết quả grep trước / sau.
- C5 `utils/api.js`: bỏ các hàm registrationsApi chỉ trang Đăng ký dùng (export / confirmExport / revert / getLogs…) nếu grep không còn ai gọi; GIỮ create /
  list / get / update / delete / stats nếu còn chỗ dùng.

### D. Khách hàng gọn (M5, M6)
- D1 Bố cục M5 (máy tính ≥ 1024px: hai cột) và M6 (điện thoại: danh sách → chi tiết toàn màn, nút "← Khách hàng", Back trình duyệt về danh sách).
  Mở /customers?phone=<SĐT> (GOI-1) vẫn mở đúng khách.
- D2 Lọc: Tất cả · Có số dư (balance > 0) · Có hạng (membership còn hạn) · Sinh nhật tháng này (ngay_sinh cùng tháng với hôm nay — "hôm nay" theo giờ VN,
  dùng hàm ngày sẵn có của client). Hàm lọc thuần, có bài thử ca biên: ngày sinh trống, hạng hết hạn hôm qua, tháng 12 / tháng 1.
- D3 Chi tiết: 3 ô Số dư · Điểm · Hạng (+ hết hạn). Mọi thứ chi tiết khách đang có (ngày sinh CT-1a, ghi chú, địa chỉ, người thân, ví, voucher, đơn,
  cấp hạng, nạp tiền…) GIỮ, sắp vào: nút Nạp tiền / Sửa thông tin / "Thêm…" (cấp hạng, người thân, mục ít dùng) và hai tab Đơn gần đây | Voucher.
  Kế hoạch liệt kê từng khối cũ → chỗ mới; không khối nào biến mất.
- D4 Nút "Bán cho khách này" của mẫu KHÔNG làm ở đây (màn Bán hàng chưa nhận khách qua đường dẫn — làm ở TOPPING-1 / màn bán hàng mới). Ghi Phát hiện.

### E. Hạng thành viên (M3, M4)
- E1 HangThe.jsx bố cục M3: một hạng mở để sửa, hạng khác thu gọn + "Sửa"; đang sửa hạng A mà bấm "Sửa" hạng B khi còn thay đổi chưa lưu → hỏi như doiThe.
  Mọi trường hạng đang có GIỮ (kể cả trường mẫu không vẽ) — chỉ đổi bố cục. Thanh dính đáy (ThanhLuu sẵn có) + hỏi PIN khi Lưu như HANG-1 (M4).
- E2 Không đổi cách lưu / API / PIN của hạng (máy chủ không đổi).

### F. Chữ Thực thu (chủ quán đồng ý 19.11)
- F1 Reports.jsx dưới ô Thực thu: "= tiền thật vào quán (gồm tiền khách nạp, đã trừ hoàn) — khớp tab Đối soát".

### G. Kiểm
- G1 `cong_cu/thu_GIAODIEN2.js` (mới): A1 6 nhóm đúng tên / thứ tự / nút; ẩn theo quyền (nhân viên thường, quản lý, owner); A2 timMuc (có dấu / không dấu /
  hoa thường / rỗng / không khớp); B1 bảng ánh xạ ĐỦ từng dòng (mỗi `to` là route có trong App.jsx, mỗi `?the=` là thẻ có trong Settings); C1–C4 chữ SX
  biến mất (kiểm mẫu nguy hiểm BIẾN MẤT — E11); C2 nhãn 'return_stock' cũ vẫn hiện; D2 hàm lọc ca biên. Nạp file thật của client (như thu_BH2 / thu_GIAODIEN1).
  Bài ĐỎ trên main 7da9ba9a.
- G2 Bài cũ phải đổi vì hành vi chủ quán đã duyệt đổi (lưới Quản lý mới, Customers bỏ lọc đồng bộ…): thu_BH2.js, thu_GIAODIEN1.js, thu_BAO1b.js và bài
  nào khác đỏ → sửa thường (LUAT §6.8), ghi SỐ CA. Không nới phép (vẫn so BẰNG).
- G3 `kiem_tra_truoc_khi_giao.js`: THÊM `chayBaiThat('cong_cu/thu_GIAODIEN2.js')`. `cd client && npm run build`, `--day-du` xanh, `node tu_chay/cong.js chay` ĐẠT.
- G4 Thử tay (chủ quán, điện thoại + máy tính, sau gộp) — trang_thai ghi đúng 3 thao tác:
  1. Quản lý › gõ "pin" → chỉ còn "PIN chủ quán" → mở đúng màn; gõ "giờ" → Giờ mở cửa.
  2. Quản lý › Hạng thành viên › sửa % hạng Vàng → thanh đáy hiện → Lưu → hỏi PIN → báo xanh.
  3. Khách hàng (điện thoại) › chip "Có số dư" → chạm một khách → chi tiết toàn màn 3 số → "← Khách hàng".

## Phạm vi
- viec/GIAO-DIEN-2/**
- client/src/pages/QuanLy/**
- client/src/pages/Settings.jsx
- client/src/pages/CaiDat/HangThe.jsx
- client/src/pages/CaiDat/PinChuQuan.jsx
- client/src/pages/Customers.jsx
- client/src/pages/Registrations.jsx
- client/src/pages/Orders.jsx
- client/src/pages/Reports.jsx
- client/src/components/CustomerInput.jsx
- client/src/components/Layout.jsx
- client/src/App.jsx
- client/src/utils/api.js
- client/src/index.css
- client/dist/**
- cong_cu/thu_GIAODIEN2.js
- cong_cu/thu_BH2.js
- cong_cu/thu_GIAODIEN1.js
- cong_cu/thu_BAO1b.js
- cong_cu/thu_*.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~450 dòng code (phần lớn dời / sắp lại JSX) + ~300 dòng thử.
**Phương án đơn giản nhất đã xét:** dùng lại các thẻ Cài đặt sẵn có và chỉ thêm `?the=` để mở thẳng — KHÔNG viết lại 19 màn cài đặt, KHÔNG đổi máy chủ.
Hạng thành viên và Khách hàng chỉ sắp lại bố cục, giữ nguyên lời gọi API.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
không — chỉ bố cục màn hình và chữ; quyền mỗi nút giữ đúng quyền cũ (máy chủ vẫn kiểm), không đổi route máy chủ, không thêm cửa mới.

## Cấm
- KHÔNG sửa server/** (mọi quyền, PIN, API giữ nguyên).
- KHÔNG sửa client/src/pages/BanHang/**, client/src/pages/Kho/**, client/src/pages/DonApp.jsx, client/src/components/DoiSoat.jsx, ban_mau_pos/**.
- Orders.jsx CHỈ đổi đúng các dòng ở C2 (TIEN-KHOA-2 đang sửa file này).
- KHÔNG xoá thẻ products / packages trong Settings.jsx (B1, B2).
