# KHACH-APP-1 — Khách chỉ còn MỘT nguồn là POS: danh sách, ô tìm khách, quét QR, hồ sơ đọc pos_customers; chép khách SX còn thiếu một lần rồi thôi gọi SX; một hàm tạo khách

<!-- Phiếu do chat soạn 06.11.2026 (bàn 33, sổ v56). Việc [T] (tài khoản khách, đường đăng ký App) — Opus, lập kế hoạch rồi DỪNG chờ duyệt.
     Thư App KH 03.11 (b) + nhắc lại 06.11 mục 4 — chủ quán chốt 03.11: khách tạo tài khoản trên App phải hiện ở màn Khách hàng POS, ĐỦ trường như
     khách tạo ở quầy; cần TRƯỚC khai trương (nhân viên tìm khách để cộng điểm, sửa ngày sinh, cấp hạng, xem đơn App). Quyết định 26–27.10: bỏ app
     SX, khách dùng danh sách POS.
     Hiện trạng chat đọc 06.11 trên main 5e93e3d: server/routes/customers-v2.js — GET / (danh sách), GET /search/:query (ô tìm khách màn Bán hàng
     ThanhKhach.jsx + quét QR: customersApi.getByQR rồi search), GET /:phone, GET /:phone/full đều lấy khách từ fetchSXCustomers() (SX
     /api/pos/customers/export; chỉ khi SX lỗi / không khoá mới đọc pos_customers sx_status 'active' hoặc NULL) + pos_registrations đang chờ.
     → khách chỉ có trong pos_customers (App tạo: server/utils/maKhach.js ~186; quầy tạo: server/routes/customers.js ~363) KHÔNG hiện, không
     tìm được, quét QR không ra, mở hồ sơ 404. Hai đường tạo khách khác nhau: quầy sinhQrKhongTrung + kiểm trùng SĐT; App generateQRCode (không
     kiểm trùng QR) + ON CONFLICT DO NOTHING rồi báo lỗi chung. Lỗi ngầm thêm: cacheCustomersToLocal (mỗi lần tải danh sách) ghi ĐÈ
     name / parent_phone từ SX lên pos_customers → tên sửa ở POS bị SX đè lại.
     Chủ quán chọn 06.11 cách TRIỆT ĐỂ: cắt SX khỏi phần khách (một nguồn), không gộp hai nguồn. -->

## Mục tiêu
Khách chỉ có MỘT nguồn là `pos_customers`. Mọi khách (tạo ở quầy, tạo từ App, khách cũ của SX) hiện ở màn Khách hàng, tìm được ở màn Bán hàng
(tên / SĐT / quét QR), mở được hồ sơ — kèm số dư, điểm, hạng, ngày sinh như nhau. POS thôi gọi SX khi đọc khách. Quầy và App tạo khách bằng MỘT hàm.

## Nghiệm thu
- A MỘT hàm đọc khách (vd `server/utils/docKhach.js`) đọc `pos_customers` (+ ví, điểm, hạng, đơn đăng ký đang chờ như nay); `GET /v2/customers`,
  `/search/:query`, `/:phone`, `/:phone/full` đều gọi hàm này, giữ nguyên dạng trả ra (thêm `xung_ho`). Mỗi SĐT một dòng. Bỏ `fetchSXCustomers`,
  `getLocalCachedCustomers`, `cacheCustomersToLocal` khỏi customers-v2.js — đọc khách KHÔNG gọi SX nữa (SX tắt / lỗi / chậm không ảnh hưởng quầy).
- B Chép lần cuối: khách SX CHƯA có trong `pos_customers` được chép vào MỘT lần, qua bước nâng cấp đánh số có sao lưu (khung KHO-1): chỉ THÊM khách
  thiếu (không ghi đè dòng đã có — POS là bản đúng), ghi số đã chép vào nhật ký; SX không trả lời / không có khoá → bước chưa coi là xong, lần khởi
  động sau thử lại (danh sách vẫn chạy bình thường từ `pos_customers`). Kế hoạch ghi rõ cách đếm trước / sau để chủ quán đối chiếu.
- C MỘT hàm tạo khách (vd `server/utils/khachMoi.js`) cho POST tạo khách ở quầy và đường đăng ký App (`maKhach.js`): cùng chuẩn hoá SĐT, cùng kiểm trùng
  SĐT, cùng mặc định cột, cùng cách sinh QR (`sinhQrKhongTrung`), cùng bảng kèm theo nếu quầy có tạo. Chỉ khác `created_by` (`app_kh` / tên nhân viên);
  `xung_ho`, `address` của App giữ. Hai đường cùng SĐT cùng lúc → một khách, bên kia nhận đúng lỗi / đúng khách (không 500, không báo chung chung).
- D Bài thử: tạo một khách qua quầy, một khách qua App (qua xác minh mã như App thật) → so từng cột (trừ id, phone, qr_code, giờ, created_by, xung_ho,
  address) phải giống; cả hai hiện ở danh sách, tìm được theo tên / SĐT / mã QR, mở hồ sơ 200 — khi SX giả trả danh sách KHÔNG có họ và khi SX tắt;
  sửa tên khách ở POS rồi tải danh sách → tên không bị SX đè; bước chép lần cuối: chỉ thêm khách thiếu, chạy hai lần không đổi gì thêm.
- K5 Không đổi: luật SĐT đăng ký (KH-SDT-1, đổi 01.11), hợp đồng `/api/kh`, cách tính số dư / điểm / hạng, màn client, đồng bộ khách sang SX
  (`sync.js` — để việc sau).

## Phạm vi
- viec/KHACH-APP-1/**
- server/routes/customers-v2.js
- server/routes/customers.js
- server/utils/maKhach.js
- server/utils/docKhach.js
- server/utils/khachMoi.js
- server/utils/helpers.js
- server/nang_cap/**
- server/database.js
- cong_cu/thu_KHACHAPP1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHACHAPP1.js` ĐỎ trên code gốc: khách App và khách quầy mới không có trong `GET /v2/customers`, `/search`, `/:phone` (404) khi SX giả
trả danh sách không có họ; tên sửa ở POS bị SX đè; so cột hai đường tạo khách lệch.
Bài thử CŨ nào đỏ vì đổi nguồn (thu_CT1a, thu_GIOVN1, thu_HANG1, thu_KHACHCK1, thu_P15QR, thu_P26c có gọi `v2/customers` / giả SX) → DỪNG, ghi tên ca
vào Câu hỏi: chat nới bài cũ trên main trước (khuôn SUA-*), không tự sửa bài cũ.

## Ngân sách
~150 dòng máy chủ (phần lớn là XOÁ đường SX) + ~250 dòng thử.
**Phương án đơn giản nhất đã xét:** một hàm đọc + một hàm tạo + một bước chép lần cuối; không gộp hai nguồn, không thêm cột.

## Đổi cấu trúc DB
không (chỉ thêm dòng khách thiếu qua bước nâng cấp có sao lưu)

## Thư viện mới
không

## Soát bảo mật
có — đường đăng ký App tạo tài khoản; mã QR thành viên phải không trùng; cửa danh sách khách chỉ người đăng nhập POS đọc.

## Cấm
Không sửa client (GIAO-DIEN-1 đang sửa client/src), không đổi `/api/kh`, không xoá / gộp / ghi đè dữ liệu khách đã có, không làm phần SX khác (KHO-3).
