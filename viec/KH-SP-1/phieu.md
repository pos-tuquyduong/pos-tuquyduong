# KH-SP-1 — Thông tin ngắn của món: nhập ở màn Sản phẩm POS · hiện gọn ở quầy · /api/kh/menu trả thêm (hợp đồng v4)

<!-- Phiếu do chat soạn 31.10.2026. Việc thường [Th] — Sonnet, chạy thẳng tới hết (không dừng chờ duyệt). Nền: main sau sổ v49 (KH-API-3
     #54 đã gộp — hợp đồng v3). Chủ quán chốt 30.10 (QUYET_DINH_CHU_QUAN.md mục App KH "Chia cài đặt"): thông tin NGẮN của món ở POS, App KH
     đọc lại; ảnh món SAU khai trương (KH-SP-2) — việc này trả `anh: null`. Đã hứa App KH (TRA_LOI_POS_30102026_d.md mục 2): đúng tên trường,
     mã lạ → 400, giới hạn 160 / 160 / 200 ký tự.
     Hiện trạng chat đọc 31.10 trên main 4b52370:
     - Món quầy: server/routes/products.js `layMenuQuay` (~32: SX products-with-stock + nhớ tồn vào pos_products theo sx_product_type /
       sx_product_id; giá POS). Bảng pos_products (database.js ~147: code, name, category, price, description, image_url, …).
     - /api/kh/menu: server/routes/kh/index.js ~127, danh sách TRẮNG trường món `monKhach` (~38: ma = unique_id, ten, nhom, gia, con_hang,
       ton_cu, ton_luc, gia_hang). Bài thử khoá danh sách: thu_KH1.js E5, thu_HOPDONG_KH.js (LUAT §6 mục 7 — sửa đúng dòng danh sách).
     - Màn Sản phẩm: client/src/pages/Settings.jsx tab `products` (~118–131; sửa giá qua PUT /api/pos/products/price ~147, batch ~194).
     - Màn quầy đang bán thật: Sales.jsx (màn cũ); màn mới client/src/pages/BanHang/** (đang TẮT ở mọi máy).
     - Bước nâng cấp: main có 001–004 → bước của việc này là **005** (KH-MUA-1 giữ 006, KHO-2b giữ 007).
     - Hợp đồng HOP_DONG_API_KH.md v3 → việc này nâng **v4**. Báo cáo cho chủ quán theo LUAT §8. -->

## Mục tiêu
Chủ quán / quản lý nhập cho mỗi món: nhóm nhu cầu, thể chất hợp, mô tả ngắn, công dụng, thành phần. Nhân viên quầy xem nhanh khi khách
hỏi. App KH đọc từ `/api/kh/menu` để hiện trang món.

## Nghiệm thu
- A **Lưu:** bước 005 thêm 5 cột vào pos_products qua `themCot` (nhu_cau, the_chat — chuỗi JSON mảng mã; mo_ta, cong_dung, thanh_phan —
  chữ). Cửa ghi (quyền manage_settings, như sửa giá): nhận 5 trường; `nhu_cau` ⊂ {ngu_ngon, dep_da, am_bung, tinh_tao, bo_khi,
  giai_nhiet}; `the_chat` ⊂ {binh_hoa, khi_hu, duong_hu, am_hu, dam_thap, thap_nhiet, huyet_u, khi_uat, dac_bam}; mã lạ / trùng → 400
  `MA_KHONG_HOP_LE`; quá 160 / 160 / 200 ký tự (đếm theo ký tự thật, chữ ngoài BMP tính 1) → 400 `QUA_DAI`; chuỗi rỗng = xoá (null).
  Hai danh sách mã ở MỘT hằng số dùng chung máy chủ + giao diện (App KH đổi mã thì sửa một chỗ).
- B **Màn Sản phẩm** (Cài đặt → Sản phẩm): mỗi món có chỗ mở "Thông tin món" — chọn nhu cầu / thể chất bằng nút bấm (tên tiếng Việt có
  dấu), 3 ô chữ có đếm ký tự còn lại; lưu một lần. Món chưa có giá vẫn nhập được.
- C **Quầy:** ở màn Bán hàng cũ VÀ mới, món có thông tin hiện một dấu ⓘ nhỏ; chạm → thẻ ngắn (nhu cầu, thể chất, mô tả, công dụng, thành
  phần), chạm ngoài là đóng; không thêm bước nào vào luồng bán, món không có thông tin thì không có dấu.
- D **/api/kh/menu:** mỗi món thêm `nhu_cau[]`, `the_chat[]` (mảng mã, chưa có → `[]`), `mo_ta`, `cong_dung`, `thanh_phan` (chưa có →
  `null`), `anh: null`. Không trường nào khác đổi.
- E **Hợp đồng v4** cùng PR: HOP_DONG_API_KH.md (bảng cửa, khối JSON, nhật ký phiên bản, danh sách mã) + thu_HOPDONG_KH.js xanh; sửa đúng
  dòng danh sách trắng ở thu_KH1.js E5 (LUAT §6 mục 7).
- F **K5:** giá, bán, hoàn, hạng, Giờ vàng, đồng bộ SX, sao lưu / khôi phục chạy y như cũ (cột mới đi theo SELECT *).

## Phạm vi
- viec/KH-SP-1/**
- server/routes/products.js
- server/routes/kh/**
- server/nang_cap/**
- server/utils/thongTinMon.js
- HOP_DONG_API_KH.md
- client/src/pages/Settings.jsx
- client/src/pages/Sales.jsx
- client/src/pages/BanHang/**
- client/src/components/**
- client/src/utils/**
- client/dist/**
- cong_cu/thu_KHSP1.js
- cong_cu/thu_KH1.js
- cong_cu/thu_HOPDONG_KH.js
- cong_cu/thu_KHAPI3.js
- cong_cu/thu_KHAPI2.js
- cong_cu/thu_KHO1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHSP1.js` ĐỎ trên code gốc: sau bước 005 có đủ 5 cột (chạy lại không đổi); ghi đủ trường → /api/kh/menu trả đúng;
mã lạ / trùng → 400; 161 ký tự mô tả → 400, 160 → được; chuỗi rỗng → null; người không có quyền → 403; món chưa nhập → `[]` / null /
`anh: null`; hằng số mã giao diện = máy chủ (đọc nguồn).

## Ngân sách
~120 dòng máy chủ + ~150 dòng giao diện + ~200 dòng thử.
**Phương án đơn giản nhất đã xét:** 5 cột trên pos_products + một cửa ghi + một khối giao diện dùng chung cho hai màn bán; không bảng mới.

## Đổi cấu trúc DB
có — bước nâng cấp 005: thêm 5 cột vào pos_products qua `themCot` (tự sao lưu bảng). Chịu được kho thử thiếu bảng (thu_KHO2a E6b).

## Thư viện mới
không

## Cấm
- KHÔNG đổi giá, cách tính tiền, đồng bộ SX, danh sách món bán; KHÔNG làm ảnh món (KH-SP-2).
- KHÔNG đổi luồng bán / thanh toán ở Sales.jsx, BanHang/** — chỉ thêm dấu ⓘ + thẻ xem.
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/KH-SP-1`. Không đụng main, không merge,
  không tạo PR.
