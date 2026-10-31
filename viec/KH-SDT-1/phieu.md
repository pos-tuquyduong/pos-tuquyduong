# KH-SDT-1 — Khách mới không thừa hưởng điểm / voucher / lịch sử "mồ côi" của cùng SĐT · công cụ dọn dữ liệu thử trước khai trương (chủ quán duyệt)

<!-- Phiếu do chat soạn 31.10.2026. Việc [T] (điểm, voucher, đơn) — Opus làn 2 (sau SAOLUU-2), lập kế hoạch, DỪNG chờ duyệt. Nền: main sau sổ v51.
     Chủ quán thử 31.10: SĐT 0912345678 KHÔNG có trong POS (màn Khách hàng tìm không thấy) → cấp mã ở quầy (KH-QUAY-2) → App hỏi Tên + Xưng hô
     (đúng khách mới) → vào App thấy 500 điểm + "Tích điểm đơn ORD-20260806-751 · 06/08/2026 +500". Điểm, voucher, lịch sử đơn tra THEO SĐT
     (pos_point_transactions.customer_phone, pos_voucher_grants.customer_phone, pos_orders.customer_phone) → dữ liệu cũ của số đó (thử từ tháng 8,
     hồ sơ khách không còn) "chảy" sang khách mới. Ngoài đời nhà mạng cấp lại số cũ → người mới thừa hưởng điểm + thấy lịch sử của người cũ.
     Chủ quán chốt 31.10 (QUYET_DINH_CHU_QUAN.md mục Khách / App KH):
     (1) SĐT đăng ký mới (App hoặc quầy) bắt đầu từ 0: điểm, voucher còn lại của dữ liệu cũ không có hồ sơ → KHOÁ (ghi lý do), lịch sử đơn cũ GIỮ
         để đối soát nhưng KHÔNG hiện cho khách mới (App, màn khách ở quầy).
     (2) Dọn dữ liệu thử trước khai trương: máy LIỆT KÊ (đơn, điểm, ví, voucher, khách, gói… của giai đoạn thử), chủ quán DUYỆT danh sách, rồi mới
         dọn; sao lưu trước; dọn chỉ một lần, có nhật ký.
     Hiện trạng chat đọc 31.10 trên main 596c346:
     - POS KHÔNG có đường xoá khách (không router.delete ở customers*.js) → điều tra số mồ côi sinh ra từ đâu (đồng bộ SX sync.js, khôi phục sao
       lưu, sửa SĐT khách, đơn khách lẻ có SĐT, bản cũ…) và ghi trong kế hoạch — nguồn nào còn mở thì chặn luôn.
     - Điểm: server/utils/diemKhach.js layDiemKhach (BALANCE_SQL theo phone + hạn; lịch sử 50 dòng theo phone); voucher: layVoucherKhach;
       đơn App: server/routes/kh/index.js GET /don, /don/:ma (utils/donApp.js CAU_DON theo customer_phone); điểm ở quầy (Sales.jsx, BanHang/**).
     - Tạo khách: App xác minh (utils/maKhach.js, khách mới tạo dòng pos_customers), quầy (customers*.js, orders.js is_new_customer).
     - Ví (pos_wallets theo phone) là tiền thật: số dư ví mồ côi KHÔNG tự khoá — liệt kê để chủ quán quyết (thường = 0 ở dữ liệu thử).
     - Sao lưu: SAOLUU-2 (đang làm) — dọn phải sao lưu trước bằng đúng đường sao lưu.
     Báo cáo cho chủ quán theo LUAT §8. -->

**Chờ duyệt kế hoạch:** viết `viec/KH-SDT-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Một khách mới (kể cả dùng lại số cũ) không bao giờ thấy hay dùng được điểm, voucher, lịch sử của người khác; dữ liệu thử được dọn sạch có kiểm soát
trước khai trương.

## Nghiệm thu
- A **Điều tra:** kế hoạch liệt kê mọi đường sinh ra dữ liệu theo SĐT mà không có hồ sơ khách (đo bằng chạy / đọc code), đường nào còn mở thì chặn.
- B **Khoá khi tạo khách:** lúc tạo hồ sơ khách cho một SĐT (App, quầy, mọi đường tạo), điểm còn hạn + voucher chưa dùng thuộc SĐT đó mà có từ
  TRƯỚC hồ sơ → khoá trong cùng giao dịch tạo khách (điểm: một dòng trừ có lý do "dữ liệu cũ của số này — khoá khi tạo khách mới"; voucher:
  trạng thái khoá có lý do). Tạo lại / gửi lại không khoá hai lần.
- C **Không hiện lịch sử cũ:** App (/diem lịch sử, /don, /don/:ma, voucher) và chỗ quầy hiện lịch sử khách chỉ lấy dữ liệu từ lúc có hồ sơ hiện tại;
  đơn cũ vẫn ở Báo cáo / Đối soát / Đơn hàng của quầy (tiền không đổi).
- D **Công cụ dọn dữ liệu thử** (chỉ chủ quán): bước 1 LIỆT KÊ theo tiêu chí chủ quán chọn (trước ngày X, và / hoặc danh sách SĐT thử) — số đơn,
  tổng tiền, điểm, voucher, ví, gói, khách sẽ bị dọn, xuất được file để duyệt; bước 2 DỌN chỉ khi chủ quán gõ xác nhận, sao lưu trước, một giao
  dịch, ghi nhật ký (ai, lúc nào, tiêu chí, số dòng). Ví có số dư ≠ 0 → KHÔNG dọn, liệt kê riêng để chủ quán xử lý tay. Chạy lại lần hai không làm
  gì thêm.
- E **K5:** điểm / voucher / ví / gói của khách có hồ sơ từ trước không đổi (so số trước–sau toàn bảng); đơn, hoàn, đối soát, báo cáo không đổi
  ngoài phần chủ quán đã duyệt dọn.

## Phạm vi
- viec/KH-SDT-1/**
- server/utils/diemKhach.js
- server/utils/maKhach.js
- server/utils/donApp.js
- server/utils/sdtCu.js
- server/utils/donThu.js
- server/routes/kh/**
- server/routes/customers.js
- server/routes/customers-v2.js
- server/routes/orders.js
- server/routes/loyalty.js
- server/routes/don-thu.js
- server/index.js
- server/nang_cap/**
- HOP_DONG_API_KH.md
- client/src/pages/QuanLy/**
- client/src/pages/DonThu.jsx
- client/src/App.jsx
- client/dist/**
- cong_cu/thu_KHSDT1.js
- cong_cu/thu_HOPDONG_KH.js
- cong_cu/thu_KH1.js
- cong_cu/thu_KHMUA1.js
- cong_cu/thu_DIEMTHAT1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHSDT1.js` ĐỎ trên code gốc: dựng điểm + voucher + đơn cho SĐT chưa có hồ sơ → khách mới đăng ký qua App → /diem = 0, lịch sử trống,
voucher không dùng được, /don trống; cùng cảnh qua quầy; khách cũ có hồ sơ không đổi; công cụ dọn: liệt kê đúng, chưa xác nhận → không đổi gì,
xác nhận → đúng số dòng, ví ≠ 0 không đụng, chạy lại → 0 dòng.

## Ngân sách
~300 dòng máy chủ + ~200 dòng giao diện + ~400 dòng thử.
**Phương án đơn giản nhất đã xét:** mốc "có hồ sơ từ lúc" (created_at của pos_customers) làm ranh giới đọc + khoá phần còn dùng được lúc tạo khách;
dọn thử = liệt kê → xác nhận → một giao dịch.

## Đổi cấu trúc DB
có thể — cột / bảng nhật ký dọn, trạng thái khoá voucher (bước 010, chỉ THÊM; bảng mới phải vào sao lưu).

## Thư viện mới
không

## Cấm
- KHÔNG xoá dữ liệu nào ngoài công cụ dọn có chủ quán xác nhận; KHÔNG đụng ví có số dư; KHÔNG đổi cách cộng / trừ điểm của đơn mới.
- KHÔNG đổi tên trường hợp đồng App (chỉ đổi dữ liệu trả về theo luật C; ghi rõ trong HOP_DONG_API_KH.md nếu là thay đổi hành vi).
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/KH-SDT-1`. Không đụng main, không merge,
  không tạo PR.
