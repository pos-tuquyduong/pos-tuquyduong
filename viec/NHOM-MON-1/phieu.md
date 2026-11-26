# NHOM-MON-1 — Một danh sách nhóm món dùng chung cho quầy, App KH và Kho (sửa tên, thứ tự, bật / tắt hiện ở quầy / App KH)

<!-- Phiếu do chat POS soạn 26.11.2026 (bàn 41, main acc88921). Máy: Claude Code · OPUS.
     Đổi cửa /api/kh (thêm trường + lọc món) → "Chờ duyệt kế hoạch"; cùng PR sửa HOP_DONG_API_KH.md, tăng PHIEN_BAN (đang 18), ghi nhật ký (LUAT §2).
     Chủ quán duyệt bản thử 26.11 14:05 (Cài đặt › Nhóm món + khung "Xem trước: khách thấy trên App KH"):
     https://claude.ai/artifact/YQMpwLWVCucKF6EbcHTnPv — bản HTML ở viec/NHOM-MON-1/ban_thu_kho.html.
     Chủ quán 26.11: "Thiết kế để liên thông POS và KH thật đơn giản, không chồng chéo" → MỌI cài đặt nhóm ở POS; App KH chỉ đọc.

     CHAT ĐÃ ĐỌC (main acc88921):
       - Nhóm món hôm nay = chữ tự do pos_products.category (giá trị thật 'juice' / 'tea'). Gõ tay ở client/src/pages/Kho/SanPham.jsx 101.
       - Người đọc category (K4 — kế hoạch grep lại toàn bộ): server/routes/products.js 27–40 layMenuQuay(category) dùng CHUNG cho quầy, màn
         khách và /api/kh/menu; server/routes/kh/index.js 41 `nhom: p.category`; server/utils/manKhach.js 112 `nhom: p.category`;
         client BanHangMoi.jsx 28 TEN_NHOM { juice: 'Nước ép', tea: 'Trà' } + 337–339 tab theo category; BanHang/ghiChuMacDinh.js THEO_NHOM theo
         mã 'tea' / 'juice'; Settings.jsx 1092–1104 so 'tea' / 'juice'; products.js 150 / 198 / 257 gán 'tea' / 'juice' khi chép từ SX.
       - KHÔNG nhầm với: pos_product_groups (nhóm ƯU ĐÃI nhiều-nhiều, voucher ap_dung='nhom' dùng — orders.js 1446) và kho_nhom_cong_thuc
         (nhóm công thức kho, lech_cho_phep). Hai bảng đó GIỮ NGUYÊN. -->

**Chờ duyệt kế hoạch:** viết `viec/NHOM-MON-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Chủ quán cài nhóm món ở MỘT chỗ: tên hiển thị, thứ tự, "hiện ở quầy", "hiện trên App KH". Món chọn nhóm từ danh sách (không gõ tay). Tab màn Bán
hàng, nhóm Menu App KH, lọc ở Kho đều đọc từ đây. Sửa tên nhóm không làm hỏng gì đang chạy (ghi chú nhanh, voucher, đơn cũ, App KH).

## Nghiệm thu
- A1 Bảng nhóm món: mã ỔN ĐỊNH (= giá trị category hiện có, vd 'juice', 'tea'; nhóm mới máy sinh mã, không đổi được), tên hiển thị (sửa được),
  thứ tự, hien_quay, hien_app. Bước nâng cấp tự tạo một nhóm cho MỖI giá trị category khác rỗng đang có (tên đầu: juice → "Nước ép", tea → "Trà",
  lạ → chính mã), cả hai công tắc bật. pos_products.category GIỮ là mã nhóm → mọi người đọc category hiện có chạy như cũ (K5).
- A2 Màn Cài đặt › Nhóm món (chủ quán; quản lý xem — kế hoạch chọn theo checkPermission đang dùng cho manage_settings): danh sách, Sửa tên, Lên /
  Xuống, hai công tắc, Thêm, Xoá (chỉ khi 0 món — máy chủ chặn 409 `NHOM_CON_MON`). Khung "Xem trước: khách thấy trên App KH" = gọi đúng hàm
  /api/kh/menu dùng (không phép lọc thứ hai). Đặt màn ở Quản lý › "Giá bán & nhóm món" (Settings.jsx) — KHÔNG đặt trong Kho, vì KHO-GON-1 đang làm song song trong client/src/pages/Kho/.
- A3 Sản phẩm & công thức (SanPham.jsx): ô "Nhóm" thành ô chọn từ danh sách (không gõ tay). Máy chủ: category gửi lên phải là mã nhóm có thật →
  400 `NHOM_KHONG_CO` (cả PUT sửa món và POST tạo món — K4 mọi đường ghi category, kể cả chép từ SX 150 / 198 / 257 vẫn gán 'tea' / 'juice' →
  bảo đảm hai mã đó luôn có).
- A4 Quầy: GET /api/pos/products trả thêm `nhom_ten`, `nhom_thu_tu`, `nhom_hien_quay`. Màn Bán hàng: tab theo thứ tự nhóm, tên lấy `nhom_ten`
  (bỏ TEN_NHOM viết cứng), KHÔNG hiện tab / món của nhóm tắt "hiện ở quầy". Đổi BanHangMoi.jsx ở mức nhỏ nhất (tab + tên) — TOPPING-1 sẽ làm lại
  màn này; ghi rõ các dòng đã đổi trong trang_thai để TOPPING-1 giữ.
- A5 App KH (`GET /api/kh/menu`): CHỈ trả món thuộc nhóm bật "hiện trên App KH"; mỗi món thêm `nhom_ten`, `nhom_thu_tu` (trường `nhom` GIỮ là mã như
  cũ — không đổi nghĩa trường đang dùng). Món của nhóm tắt mà khách đặt (đơn App) → máy chủ chặn bằng mã lỗi có sẵn cho món không bán (kế hoạch đọc
  đường đơn App, chọn đúng mã; không thêm đường tắt — LUAT §5). Màn khách (manKhach.js) đi theo quầy hay App — kế hoạch đọc và chọn, ghi lý do.
- A6 HOP_DONG_API_KH.md: thêm `nhom_ten`, `nhom_thu_tu`, ghi luật lọc nhóm, PHIEN_BAN 18 → 19, nhật ký cuối file. `cong_cu/thu_HOPDONG_KH.js` xanh.
  Viết `viec/NHOM-MON-1/BAO_APPKH.md` (một trang, lời thường) để chủ quán chuyển cho chat App KH: App dùng `nhom_ten` + `nhom_thu_tu` thay vì tự
  đặt tên nhóm.
- A7 Sửa tên nhóm → quầy, App KH, Kho đổi theo ngay; ghi chú nhanh (ghiChuMacDinh theo mã), voucher, đơn cũ, đối soát KHÔNG đổi.

**Thử**
- `cong_cu/thu_NHOMMON1.js` (đỏ trên main): nâng cấp trên dữ liệu có 'juice' / 'tea' / '' / NULL / mã lạ → đúng số nhóm, chạy 2 lần không nhân đôi;
  sửa tên giữ mã; xoá nhóm còn món → 409; category không có → 400 (PUT và POST); /api/kh/menu: nhóm tắt app → món biến mất, bật lại → về; thứ tự;
  quầy: nhóm tắt quầy → không trong menu quầy nhưng vẫn trong /api/kh/menu nếu bật app (hai công tắc độc lập); đơn App gọi món nhóm tắt → chặn.
- Đột biến: VS-loc-app-theo-quay · VS-doi-ma-khi-sua-ten · VS-xoa-nhom-con-mon · VS-category-tu-do-lot · BV-bo-loc-app.
- K5 phải KHÔNG bị chặn: món cũ category 'juice' / 'tea' bán như cũ; chép món từ SX; voucher nhóm ưu đãi (pos_product_groups) như cũ; App KH bản
  cũ chỉ đọc `nhom` vẫn chạy; đơn cũ, in lại, đối soát.
- `npm test`, `--day-du` xanh; `node tu_chay/cong.js chay` ĐẠT. 3 thao tác cho chủ quán thử tay.

## Phạm vi
- viec/NHOM-MON-1/**
- server/routes/products.js
- server/routes/kh/index.js
- server/routes/kh/quay.js
- server/utils/manKhach.js
- server/routes/orders.js
- server/kho/duong.js
- server/nang_cap/035_nhom_mon.js
- server/nang_cap/chay.js
- server/routes/backup.js
- server/utils/chuanHoaGio.js
- client/src/pages/Kho/SanPham.jsx
- client/src/pages/Settings.jsx
- client/src/pages/BanHang/BanHangMoi.jsx
- client/dist/**
- HOP_DONG_API_KH.md
- cong_cu/thu_NHOMMON1.js
- cong_cu/thu_HOPDONG_KH.js
- cong_cu/thu_KHAPI2.js
- cong_cu/thu_KHAPI3.js
- cong_cu/thu_KHO3a.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~250 dòng code + ~300 dòng thử.
**Phương án đơn giản nhất đã xét:** giữ category làm mã nhóm (không đổi cột, không đổi nghĩa trường `nhom` của App KH) + MỘT bảng nhóm có tên /
thứ tự / hai công tắc. Không gộp với pos_product_groups hay kho_nhom_cong_thuc (khác việc, gộp là chồng chéo).

## Đổi cấu trúc DB
có — chỉ THÊM, bước `server/nang_cap/035_nhom_mon.js`: bảng nhóm món (ma UNIQUE, ten, thu_tu, hien_quay, hien_app, tao_luc). Không đổi cột cũ.
Số bước: nếu KHO-GON-1 / KHO-GON-2 chưa dùng 033 / 034 thì vẫn giữ 035 (số bước không cần liền).

## Thư viện mới
không

## Soát bảo mật
có — đổi cửa công khai /api/kh/menu và đường đơn App.

## Cấm
- KHÔNG đổi pos_product_groups, voucher, kho_nhom_cong_thuc.
- KHÔNG đổi nghĩa / xoá trường `nhom` ở /api/kh.
- KHÔNG làm lại màn Bán hàng ngoài tab + tên nhóm (A4).
- GIAO-DIEN-2 (đang chạy) cũng sửa Settings.jsx: bắt đầu từ main mới nhất; nếu GIAO-DIEN-2 chưa merge thì sửa Settings.jsx ít nhất có thể, ghi Phát hiện.
- Trong client/src/pages/Kho/ CHỈ sửa SanPham.jsx (ô chọn nhóm) — KHO-GON-1 chạy song song cùng thư mục; sửa ít, đúng chỗ để gộp không vướng.
