# ANH-MON-1 — Ảnh nhỏ cho món và topping (quầy + App KH), tự thu nhỏ khi tải lên

<!-- Phiếu do chat POS soạn 26.11.2026 (bàn 41, main acc88921). Máy: Claude Code · SONNET. Việc thường → chạy thẳng, không chờ duyệt kế hoạch.
     Chủ quán 17.11: "màn bán hàng chuyên nghiệp, đơn giản, có ảnh nhỏ cho món và topping; hoá đơn không cần ảnh". Bản thử 26.11 (TOPPING-1):
     https://claude.ai/artifact/VkginVyaDFx7vF6V8xKRtb — ô ảnh vuông bo góc trên thẻ món, trong khung chọn topping và dòng giỏ; chưa có ảnh thì
     hiện chữ viết tắt trên nền màu. Thay việc KH-SP-2 trong sổ (ảnh món, lưu ngoài máy Render).

     CHAT ĐÃ ĐỌC (main acc88921): server/routes/kh/index.js 46 `anh: null` (trường đã có trong hợp đồng /api/kh, luôn null); express.json 5mb
     (server/index.js 81); multer có ở server/kho/duong.js 150. KHO-GON-2 (song song) lưu ảnh hoá đơn trong CSDL — DÙNG CÙNG cách lưu / kiểm ảnh
     nếu KHO-GON-2 đã gộp (một hàm kiểm kiểu ảnh, không chép); chưa gộp thì viết hàm chung trong server/utils/ và ghi Phát hiện. -->

## Mục tiêu
Mỗi món (kể cả topping) có một ảnh vuông nhỏ do chủ quán tải lên ở Kho › Sản phẩm & công thức. Màn Bán hàng và App KH hiện ảnh; chưa có ảnh thì
hiện chữ viết tắt màu. Ảnh nhẹ, không làm chậm quầy.

## Nghiệm thu
- A1 Tải ảnh ở màn sửa món: chọn / chụp ảnh → máy người dùng cắt vuông giữa + thu về 400 × 400, WebP (hoặc JPEG nếu máy không hỗ trợ) chất lượng
  0,7 — hằng số có tên một chỗ; hiện cỡ sau thu nhỏ. Có nút Xoá ảnh. Chỉ người được sửa món mới tải / xoá (theo quyền sửa món hiện có).
- A2 Máy chủ: kiểm kiểu thật bằng byte đầu (JPEG / PNG / WebP), ≤ 120 KB (quá → 413 `ANH_QUA_LON`), một ảnh / món (tải lại = thay). Lưu trong CSDL
  (không đĩa Render). Đường đọc ảnh công khai, có `Cache-Control` dài + phiên bản trong đường dẫn (đổi ảnh → đường dẫn mới), không lộ gì khác.
- A3 Quầy: thẻ món, ô topping trong khung chọn món (nếu TOPPING-1 đã gộp), dòng giỏ hiện ảnh; ảnh tải chậm không chặn bấm (ảnh lười, có chỗ
  giữ chỗ cố định — không nhảy bố cục). Hoá đơn / tem KHÔNG có ảnh.
- A4 `/api/kh/menu`: `anh` = đường dẫn ảnh (hoặc null). `HOP_DONG_API_KH.md`: ghi nghĩa mới của `anh` (không đổi tên trường), tăng PHIEN_BAN số
  kế tiếp của main lúc gộp, nhật ký; `viec/ANH-MON-1/BAO_APPKH.md` một trang cho chat App KH.
- A5 Ảnh không vào sao lưu Excel hằng ngày (ghi Phát hiện nếu cần cách sao lưu khác).

**Thử** `cong_cu/thu_ANHMON1.js` (đỏ trên main): tải JPEG 80 KB → đọc lại đúng byte, `/api/kh/menu` có `anh`; PDF đổi đuôi → 400; 121 KB → 413;
nhân viên không quyền → 403; xoá → `anh: null`; đổi ảnh → đường dẫn khác. Đột biến: VS-anh-tin-duoi · VS-anh-khong-gioi-han · BV-bo-kiem-quyen-anh.
K5: món không ảnh hiện chữ viết tắt; App KH bản cũ đọc `anh` null vẫn chạy. `npm test`, `--day-du`, `node tu_chay/cong.js chay` ĐẠT.

## Phạm vi
- viec/ANH-MON-1/**
- server/routes/products.js
- server/routes/backup.js
- cong_cu/thu_SAOLUU2.js
- server/routes/kh/index.js
- server/utils/*.js
- server/kho/duong.js
- server/nang_cap/037_anh_mon.js
- server/nang_cap/chay.js
- server/index.js
- client/src/pages/Kho/SanPham.jsx
- client/src/pages/BanHang/**
- client/src/pages/Kho/ToppingMon.jsx
- client/src/utils/api.js
- client/dist/**
- HOP_DONG_API_KH.md
- cong_cu/thu_ANHMON1.js
- cong_cu/thu_HOPDONG_KH.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~180 dòng code + ~150 dòng thử.
**Phương án đơn giản nhất đã xét:** thu nhỏ ở máy người dùng, máy chủ chỉ kiểm + lưu một ảnh / món trong CSDL; không dịch vụ ảnh ngoài.

## Đổi cấu trúc DB
có — chỉ THÊM, `server/nang_cap/037_anh_mon.js`: bảng ảnh món (product_id UNIQUE, kiểu, dữ liệu, cỡ, phiên bản, sửa_lúc).

## Thư viện mới
không

## Soát bảo mật
có — nhận file từ người dùng, đường đọc công khai.

## Cấm
- KHÔNG sửa hoá đơn / tem; không đổi giá, đơn, kho.
- Trong client/src/pages/BanHang/ chỉ thêm ảnh (TOPPING-1 đang làm lại khung chọn món): sửa ít, đúng chỗ; nếu TOPPING-1 chưa gộp thì bỏ phần ảnh
  topping, ghi Phát hiện.
