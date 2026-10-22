# KH-QUAY-1 — Nút "Mã đăng nhập App" ở trang Khách hàng (quầy cấp mã cho khách đứng trước mặt)

<!-- Phiếu do chat soạn 22.10.2026. Việc thường [Th] — chạy thẳng tới hết, không chờ duyệt kế hoạch. Nền: main `fabe583`. Đã có (KH-API-1,
     đọc 22.10): `POST /api/pos/kh/cap-ma { sdt }` (server/routes/kh/quay.js, token nhân viên) trả `{ success, ma, het_han_giay }` (mã 6 chữ
     số, hạn 5 phút, mã quầy không giới hạn lượt xin); thiếu / sai `KH_JWT_SECRET` → 503. Chưa cắm Zalo (KH-OTP-1, M4) nên khách đăng nhập App
     bằng mã lấy tại quầy — việc này làm nút cho thu ngân. Chủ quán thích ít nút, ít thao tác: đặt nút ở khung chi tiết khách có sẵn. -->

## Mục tiêu
Khách đứng ở quầy xin đăng nhập App: thu ngân mở khách → bấm MỘT nút → hộp hiện mã to, rõ + đồng hồ đếm ngược 5 phút → đọc mã cho khách.

## Nghiệm thu
- A Màn Khách hàng (`Customers.jsx`): trong khung chi tiết khách (modal mở khi bấm dòng khách) có nút "Mã đăng nhập App". Bấm → gọi
  `POST /api/pos/kh/cap-ma` qua `client/src/utils/api.js` với SĐT của khách đó → hộp hiện mã 6 số chữ lớn + đồng hồ đếm ngược (phút:giây)
  theo `het_han_giay` của máy chủ. Hết giờ → mã mờ đi, ghi "Hết hạn" + nút "Lấy mã mới". Mỗi lần bấm là một mã mới; không lưu mã ở đâu
  ngoài trạng thái màn hình (đóng modal là mất, không vào localStorage / log).
- B Lỗi: 503 (chưa cấu hình App) → "App khách chưa bật — báo quản lý"; `SDT_KHONG_HOP_LE` → nêu SĐT khách không hợp lệ; lỗi mạng / khác →
  hiện `error` máy chủ trả về (tiếng Việt), không để trắng màn.
- C Bấm nhanh hai lần không tạo hai hộp, nút khoá trong lúc chờ phản hồi.
- D Không đổi gì ở các khối khác của Customers.jsx (danh sách, thêm khách, đổi quà, hạng thẻ…); modal mở / đóng như cũ.
- E Hàm thuần (định dạng đếm ngược, trạng thái hết hạn) tách `client/src/utils/maApp.js`, có bài `cong_cu/thu_KHQUAY1.js` gọi thẳng hàm đó
  (còn 300 giây → "5:00"; hết giờ; không âm); chạy `node cong_cu/thu_KHQUAY1.js`, in dòng tổng "n đạt · 0 hỏng". KHÔNG ghép vào
  `kiem_tra_truoc_khi_giao.js` ở việc này; ghi kết quả vào `trang_thai.md`.
- F Bản dựng client (`cd client && npm run build`) thành công; `npm test` và `--day-du` xanh.
- G Chủ quán thử tay (ghi vào trang_thai.md đúng 3 thao tác): (1) mở Khách hàng → bấm một khách; (2) bấm "Mã đăng nhập App" thấy mã + đồng hồ;
  (3) chờ hết giờ thấy "Hết hạn" + "Lấy mã mới".

## Phạm vi
- viec/KH-QUAY-1/**
- client/src/pages/Customers.jsx
- client/src/components/MaDangNhapApp.jsx
- client/src/utils/maApp.js
- client/dist/**
- cong_cu/thu_KHQUAY1.js

## Bài thử đỏ
không — việc giao diện, không đổi máy chủ / tiền; hàm thuần có bài `cong_cu/thu_KHQUAY1.js` chạy riêng

## Ngân sách
~120 dòng giao diện (thành phần mới `MaDangNhapApp.jsx`) + ~30 dòng hàm thuần + ~60 dòng thử. `Customers.jsx`: thay đổi nhỏ nhất — chỉ gắn thành
phần mới trong khung chi tiết khách (khoảng dòng 667-930), không dời khối lớn.
**Vùng sửa của file chung (checklist 22.10):** `Customers.jsx` CHỈ khung chi tiết khách. Dựng lại `client/dist` cùng P15-QR (đụng `Sales.jsx`) →
chat xếp thứ tự gộp và gửi script gộp main khi cần.
**Phương án đơn giản nhất đã xét:** một nút + một hộp trong modal có sẵn; không trang mới, không menu mới.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- KHÔNG sửa `server/`, `client/src/pages/Sales.jsx`, `client/src/App.jsx`, `client/src/pages/Reports.jsx`, `app_kh/**`.
- Không sửa `kiem_tra_truoc_khi_giao.js`, `tu_chay/`, `.claude/`, `.github/`, sổ việc, `cong_cu/gia_lap/**`. Chỉ push `git push -u origin viec/KH-QUAY-1`. Không đụng `main`, không merge, không tạo PR.
