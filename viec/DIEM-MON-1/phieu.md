# DIEM-MON-1 — Công tắc "Tích điểm" theo từng món / thẻ hạng / gói (chọn nhiều hoặc từng món); máy chủ chỉ cộng điểm phần tiền của dòng đang bật

<!-- Phiếu do chat soạn 08.11.2026 (bàn 33, sổ v58). Việc [T] (điểm = tiền) — Opus, lập kế hoạch rồi DỪNG chờ duyệt.
     Chủ quán 08.11: "Nên có cài đặt tích điểm tuỳ chỉnh theo món (chọn nhiều hoặc chọn từng mục)" — áp cho cả thẻ hạng (KH-THE-1 đang làm song song)
     và gói. Hiện trạng main 801e99a: điểm tính trên TIỀN cả đơn — orders.js ~883 `tinhDiemDon(tienTinhDiem({...}))` (utils/diemThat.js), không
     theo dòng; đơn nạp (NAP-1) luôn 0 điểm; trả ví nay có điểm (NAP-1); trừ điểm khi hoàn / đền / kết thúc gói / nhận điểm sau hoàn dùng truDiemHoan.
     Việc chạy SONG SONG với KH-THE-1 (Opus) và QUAY-UI-1 (Sonnet): giữ thay đổi ở đúng các file Phạm vi; orders.js chỉ sửa chỗ tính điểm. -->

## Mục tiêu
Chủ quán bật / tắt "Tích điểm" cho từng món, từng gói thẻ hạng, từng gói trả trước — chọn nhiều cùng lúc hoặc từng mục. Máy chủ chỉ cộng điểm cho phần
tiền khách thật trả của các dòng đang bật, ở MỌI lối sinh điểm (đơn quầy, đơn App, nhận điểm bằng mã bill, thu nợ), và trừ điểm (hoàn / đền / kết thúc
gói) theo ĐÚNG phần đã cộng.

## Nghiệm thu
- A Mỗi món (`pos_products`), mỗi hạng bán được (gói của hạng trong `pos_membership_tiers`), mỗi gói trả trước (`pos_packages`) có cờ tích điểm,
  mặc định BẬT (giữ đúng cách tính hôm nay cho dữ liệu cũ). Gói nạp: luôn 0 điểm, không có công tắc. Phí giao: không điểm như nay.
- B MỘT hàm tính "tiền tính điểm" của đơn theo dòng: phần tiền khách trả (tiền mặt / CK / QR / ví — như NAP-1) chia theo tỷ lệ tiền các dòng đang bật
  trên tổng tiền món sau giảm; làm tròn như hiện nay. Cùng hàm cho quầy, App (`/api/kh` đơn), `/nhan-diem` (nhanDiem.js), thu nợ (pay-debt).
- C Trừ điểm (truDiemHoan — hoàn / đền / kết thúc gói / nhận điểm sau hoàn) không bao giờ trừ quá số điểm đơn đã cộng; đơn có dòng tắt điểm trừ đúng tỷ lệ.
- D Cài đặt → Điểm thưởng: danh sách món / thẻ / gói có ô chọn, nút "Chọn tất cả / Bỏ chọn / Bật tích điểm / Tắt tích điểm" cho mục đã chọn, và công tắc
  từng dòng; lưu cần quyền `manage_promotions`. Màn bán hàng / bill không đổi cách hiện điểm.
- E Đối soát / báo cáo điểm không lệch: điểm đơn = điểm đã ghi sổ.
- K5 Không đổi: luật điểm khác (flash không điểm, đơn còn nợ cộng khi thu đủ), hợp đồng `/api/kh` (không thêm trường), giá, hạng.

## Phạm vi
- viec/DIEM-MON-1/**
- server/utils/diemThat.js
- server/utils/nhanDiem.js
- server/utils/diemKhach.js
- server/routes/orders.js
- server/routes/loyalty.js
- server/routes/damages.js
- cong_cu/gia_lap/bat_bien.js
- server/routes/products.js
- server/routes/packages.js
- server/routes/tiers.js
- server/routes/signup-codes.js
- server/utils/donApp.js
- server/nang_cap/024_tich_diem_mon.js
- server/database.js
- client/src/pages/Settings.jsx
- client/src/pages/CaiDat/**
- client/src/utils/api.js
- client/dist/**
- cong_cu/thu_DIEMMON1.js
- cong_cu/thu_KHO1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_DIEMMON1.js` ĐỎ trên gốc: tắt điểm một món → đơn có món đó và món khác chỉ cộng điểm phần món bật (quầy, App, nhận điểm bằng mã);
tắt điểm thẻ hạng / gói → đơn mua thẻ / gói 0 điểm phần đó; hoàn / đền đơn đó trừ đúng điểm đã cộng. Bài cũ nào đỏ vì đổi cách tính → DỪNG hỏi (khuôn SUA-*).

## Ngân sách
~200 dòng máy chủ + ~150 dòng giao diện + ~300 dòng thử.
**Phương án đơn giản nhất đã xét:** một cột cờ cho mỗi bảng + một hàm "tiền tính điểm theo dòng" thay chỗ gọi tienTinhDiem; số bước nâng cấp 024 (đã giữ
số: KH-THE-1 dùng 023).

## Đổi cấu trúc DB
có — bước 024 thêm cột cờ tích điểm (mặc định 1) qua themCot, có sao lưu.

## Thư viện mới
không

## Soát bảo mật
có — điểm là tiền; lối cộng / trừ điểm phải khớp.

## Cấm
Không đổi hợp đồng `/api/kh`, không đổi giá / hạng / mã giảm, không làm phần bán thẻ trên App (KH-THE-1), không đổi giao diện màn Bán hàng.
