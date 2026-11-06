# KHACH-APP-1 — Khách tạo từ App (và khách mới ở quầy) hiện ở POS: danh sách, ô tìm khách, quét QR, hồ sơ — lấy từ pos_customers; một hàm tạo khách chung

<!-- Phiếu do chat soạn 06.11.2026 (bàn 33, sổ v56). Việc [T] (tài khoản khách, đường đăng ký App) — Opus, lập kế hoạch rồi DỪNG chờ duyệt.
     Thư App KH 03.11 (b) + nhắc lại 06.11 mục 4 — chủ quán chốt 03.11: khách tạo tài khoản trên App phải hiện ở màn Khách hàng POS, ĐỦ trường như
     khách tạo ở quầy; cần TRƯỚC khai trương (nhân viên tìm khách để cộng điểm, sửa ngày sinh, cấp hạng, xem đơn App). Quyết định 26–27.10: bỏ app
     SX, khách dùng danh sách POS.
     Hiện trạng chat đọc 06.11 trên main 5e93e3d: server/routes/customers-v2.js — GET / (danh sách), GET /search/:query (ô tìm khách màn Bán hàng
     ThanhKhach.jsx + quét QR: customersApi.getByQR rồi search), GET /:phone, GET /:phone/full đều lấy khách từ fetchSXCustomers() (SX
     /api/pos/customers/export; chỉ khi SX lỗi / không khoá mới đọc pos_customers sx_status 'active' hoặc NULL) + pos_registrations đang chờ.
     → khách chỉ có trong pos_customers (App tạo: server/utils/maKhach.js ~186; quầy tạo: server/routes/customers.js ~363) KHÔNG hiện, không
     tìm được, quét QR không ra, mở hồ sơ 404. Hai đường tạo khách khác nhau: quầy sinhQrKhongTrung + kiểm trùng SĐT; App generateQRCode (không
     kiểm trùng QR) + ON CONFLICT DO NOTHING rồi báo lỗi chung. -->

## Mục tiêu
Mọi khách có trong POS (tạo ở quầy, tạo từ App, khách cũ chép từ SX) đều hiện ở màn Khách hàng, tìm được ở màn Bán hàng (tên / SĐT / quét QR), mở
được hồ sơ — kèm số dư, điểm, hạng, ngày sinh như mọi khách. Quầy và App tạo khách bằng MỘT hàm chung.

## Nghiệm thu
- A Nguồn danh sách = `pos_customers`. `GET /v2/customers`, `/search/:query`, `/:phone`, `/:phone/full` trả cả khách chỉ có ở `pos_customers`
  (`created_by = 'app_kh'` và khách quầy mới), đủ các trường đang trả (số dư, điểm, hạng, ngày sinh, địa chỉ…) + `xung_ho`. Mỗi SĐT MỘT dòng.
- B Khách SX chưa có trong `pos_customers`: khi SX còn trả lời thì vẫn hiện (gộp theo SĐT, không trùng dòng) như nay; SX lỗi / không khoá → danh sách
  vẫn đủ mọi khách của `pos_customers`. Không xoá / sửa dữ liệu khách SX đã có.
- C Thêm trường `nguon` (`app` · `quay` · `sx`) trong kết quả để sau này màn hiện nhãn — KHÔNG sửa client trong việc này.
- D Một hàm tạo khách chung (vd `server/utils/khachMoi.js`) dùng cho POST tạo khách ở quầy và đường đăng ký App (`maKhach.js`): cùng chuẩn hoá SĐT,
  cùng kiểm trùng SĐT, cùng mặc định cột, cùng cách sinh QR (`sinhQrKhongTrung`), cùng bảng kèm theo nếu quầy có tạo (ví, điểm…). Chỉ khác
  `created_by` (`app_kh` / tên nhân viên); trường App có mà quầy chưa có (`xung_ho`, `address`) giữ. Hai đường gọi trùng SĐT cùng lúc → một khách,
  bên kia nhận đúng lỗi / đúng khách (không 500, không báo chung chung).
- E Bài thử: tạo một khách qua quầy, một khách qua App → so từng cột (trừ id, phone, qr_code, giờ, created_by, xung_ho, address) phải giống; cả hai
  hiện ở danh sách, tìm được theo tên / SĐT / mã QR, mở hồ sơ 200, SX giả trả danh sách khác vẫn không mất khách POS.
- K5 Không đổi: luật SĐT đăng ký (KH-SDT-1, đổi 01.11: giữ dữ liệu cũ của số), hợp đồng `/api/kh`, cách tính số dư / điểm / hạng, màn client.

## Phạm vi
- viec/KHACH-APP-1/**
- server/routes/customers-v2.js
- server/routes/customers.js
- server/utils/maKhach.js
- server/utils/khachMoi.js
- server/utils/helpers.js
- cong_cu/thu_KHACHAPP1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHACHAPP1.js` ĐỎ trên code gốc: khách App tạo (qua xác minh mã như App thật) và khách quầy mới không có trong `GET /v2/customers`,
`/search`, `/:phone` (404) khi SX giả trả danh sách không có họ; so cột hai đường tạo khách lệch (qr_code không qua sinhQrKhongTrung…).
Bài thử CŨ nào đỏ vì đổi nguồn danh sách (thu_CT1a, thu_GIOVN1, thu_HANG1, thu_KHACHCK1, thu_P15QR, thu_P26c có gọi `v2/customers`) → DỪNG, ghi
tên ca vào Câu hỏi: chat nới bài cũ trên main trước (khuôn SUA-*), không tự sửa bài cũ.

## Ngân sách
~150 dòng máy chủ + ~250 dòng thử.
**Phương án đơn giản nhất đã xét:** một hàm đọc danh sách từ `pos_customers` (gộp SX theo SĐT nếu SX trả lời) dùng cho cả 4 cửa; một hàm tạo khách.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
có — đường đăng ký App tạo tài khoản; mã QR thành viên phải không trùng; cửa danh sách khách chỉ người đăng nhập POS đọc.

## Cấm
Không sửa client (GIAO-DIEN-1 đang sửa client/src), không đổi `/api/kh`, không xoá / gộp dữ liệu khách cũ, không làm phần SX (KHO-3).
