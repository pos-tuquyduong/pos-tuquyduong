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
- server/routes/registrations.js
- cong_cu/thu_GIOVN1.js
- cong_cu/thu_KHO1.js

<!-- Chủ quán 07.11 (câu hỏi kế hoạch 05764eb) — duyệt kế hoạch với các câu trả lời:
     Q1 CÓ — thêm server/routes/registrations.js: "Thêm khách" ở quầy (POST /registrations) tạo khách THẬT ngay bằng hàm tạo chung (vẫn ghi
        pos_registrations như cũ); bước chép lần cuối chép luôn đăng ký đang chờ chưa có trong pos_customers. Danh sách: mỗi SĐT MỘT dòng.
     Q2 Mặc định chung retail / retail_only (không còn xuất SX); quầy gửi rõ customer_type thì theo đó; sync.js không đổi.
     Q3 Đọc MỌI dòng pos_customers (khách đã có tiền / điểm không được biến mất).
     Q4 Sửa ca A2j NGAY trong việc này (đã thêm cong_cu/thu_GIOVN1.js vào Phạm vi) — chuyển sang kiểm giờ ghi (giờ VN, dạng T) của bước chép lần
        cuối; bản sửa ĐỎ trên gốc, ghi SỐ CA; KHÔNG ghi vào ## Bài thử cũ sửa (cố ý đổi hành vi bài cũ canh) — như NAP-1 sửa thu_P24. Bài cũ
        khác đỏ thì vẫn DỪNG hỏi như phiếu.
     Phát hiện — chủ quán chốt:
     · Người nhận không SĐT: bỏ qua như máy đề xuất (không 500).
     · PUT /v2/customers/:phone/address và /discount tự chèn khách "Khách hàng": cũng đi qua hàm tạo chung (cùng mặc định, có QR) — MỘT hàm
       tạo khách cho mọi đường.
     · Khách cũ qr_code NULL: bước chép lần cuối CẤP mã QR cho dòng đang TRỐNG qr_code (sinhQrKhongTrung) — chỉ điền ô trống, không đổi mã đã
       có, không đổi cột khác; ghi số dòng đã cấp vào nhật ký. Ca thử: quét QR ra đúng khách cũ.
     · Bộ chạy nâng cấp (server/nang_cap/chay.js): chỉ THÊM trạng thái HOÃN mà bước TỰ trả về (bước chép SX khi SX không trả lời → lần
       khởi động sau chạy lại); bước NÉM LỖI vẫn rollback + dừng + kho trả 503 như cũ (có ca thử khoá điều này). Sửa tối thiểu — NAP-1 cũng
       sửa chay.js, chat lo phần đụng khi gộp.
     · Nhãn "SX / Đã đồng bộ" trên màn quầy và orders.js:818: để việc sau (chat ghi sổ), không làm ở đây. -->

<!-- Chủ quán 07.11 (câu hỏi Q5, nhánh afe703e): ĐỒNG Ý đề xuất — thêm cong_cu/thu_KHO1.js vào Phạm vi, sửa ĐÚNG B1 / B2 (dòng 247–251):
     số dòng pos_nang_cap PHẢI BẰNG số file NNN_*.js KHÔNG xuất `truoc` (bước có `truoc` được HOÃN khi kho thử không có SX) và tập `so` khớp
     ĐÚNG các file đó — vẫn so BẰNG, không nới thành "ít nhất". Thêm ca B1c "bước chép SX không có dòng pos_nang_cap khi SX không cấu hình"
     (ĐỎ trên gốc), ghi SỐ CA. Không ghi vào ## Bài thử cũ sửa (cố ý đổi hành vi bài cũ canh). -->
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
