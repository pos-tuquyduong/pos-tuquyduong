# KHACH-CK-1 — Bỏ chiết khấu riêng từng khách (mọi ưu đãi của khách đi qua hạng thành viên)

<!-- Phiếu do chat soạn 31.10.2026. Việc [T] (tiền + dữ liệu khách) — Opus làn 2, lập kế hoạch, dừng chờ duyệt. Nền: main c8edb66 (BH-2,
     KHO-2a đã gộp). Theo QUYET_DINH_CHU_QUAN.md 29.10 "Bỏ chiết khấu riêng từng khách" (chủ quán chọn a): khách VIP chủ quán cho mã giảm riêng.
     PHẢI xong TRƯỚC khi bật màn Bán hàng mới (BH-2 đang khoá thu tiền với khách có chiết khấu riêng — `coChietKhauRieng`).
     Hiện trạng chat đọc 31.10 trên c8edb66:
     - Máy chủ TỰ áp chiết khấu riêng khi tạo đơn: server/routes/orders.js ~dòng 611–634 (POS-CONGDON-v1 · LO 2) — không có mã giảm hợp lệ thì
       đọc discount_type / discount_value của pos_customers theo SĐT và áp cho cả đơn.
     - Ghi chiết khấu: PUT /api/pos/customers/:id/discount (customers.js ~508, quyền manage_settings) và customers-v2.js ~349 (ghi + có thể
       INSERT khách). Đọc / hiện: customers.js ~164, customers-v2.js (96, 150, 180, 261, 284), CustomerInput.jsx ~279 (huy hiệu), Customers.jsx
       (lọc has_discount ~96, form ~157, cột ~499), Sales.jsx (applyCustomerDiscount ~329, chữ "KH: x%" ~1449).
     - Màn mới: client/src/pages/BanHang/tinh.js (khachGiam trong tinhGio, coChietKhauRieng ~193), BanHangMoi.jsx ~125 (chanChietKhau).
     - discount_note ĐANG được dùng làm "ghi chú khách" in trên hoá đơn (customer_note ở Sales.jsx ~790, Orders.jsx ~418, BanHangMoi.jsx ~180).
     - Bước nâng cấp: main có 001, 002; KH-API-3 (chưa gộp) giữ 003 → bước của việc này đánh **004**. Báo cáo cho chủ quán theo LUAT §8. -->

**Chờ duyệt kế hoạch:** viết `viec/KHACH-CK-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Không còn "chiết khấu riêng của khách" ở bất cứ đâu: máy chủ không áp, không ai đặt được, màn hình không hiện, dữ liệu cũ đặt về 0 (có sao
lưu). Ưu đãi của khách chỉ còn: hạng thành viên, mã giảm, Giờ vàng. Màn Bán hàng mới bỏ khoá `coChietKhauRieng`.

## Nghiệm thu
- A **Máy chủ không áp:** khách có discount_value > 0 trong hồ sơ (dữ liệu cũ chưa nâng cấp) mua không mã giảm → đơn KHÔNG giảm theo hồ sơ;
  giảm hạng / mã giảm / Giờ vàng vẫn đúng như cũ (so tổng tiền từng ca với trước khi sửa).
- B **Không đặt được:** cửa ghi chiết khấu (customers.js, customers-v2.js) không còn nhận mức > 0 → 400 mã rõ ràng (hoặc bỏ cửa nếu không nơi
  nào cần — kế hoạch nêu rõ); tạo / sửa khách không còn đường nào ghi discount_value > 0.
- C **Dữ liệu cũ:** bước nâng cấp `004_*` sao lưu bảng (cách `themCot` / sao lưu như 002) rồi đặt discount_value = 0, discount_type về mặc
  định cho mọi khách; chạy lại không đổi gì; báo số khách bị đặt lại trong log nâng cấp. Bài thử đếm: trước có N khách > 0 → sau 0, bảng sao
  lưu có đủ N dòng cũ.
- D **Màn hình:** Customers.jsx bỏ ô / cột / bộ lọc chiết khấu; CustomerInput.jsx bỏ huy hiệu; Sales.jsx (màn cũ, đang bán thật) bỏ
  applyCustomerDiscount + chữ "KH: x%" — màn cũ không còn hiện mức giảm mà máy chủ không áp; BanHangMoi.jsx + tinh.js bỏ khachGiam và khoá
  chanChietKhau.
- E **Ghi chú khách giữ nguyên:** discount_note vẫn đọc / sửa / in trên hoá đơn như "Ghi chú khách" (đổi nhãn ở màn Khách hàng cho đúng nghĩa,
  KHÔNG đổi tên cột, không mất dữ liệu).
- F **K5:** quầy bán, hoàn, ví, điểm, hạng, mã giảm, hoá đơn, App KH chạy y như cũ; giảm tay theo đơn (nếu màn cũ còn) không đổi.

## Phạm vi
- viec/KHACH-CK-1/**
- server/routes/orders.js
- server/routes/customers.js
- server/routes/customers-v2.js
- server/nang_cap/**
- client/src/pages/Customers.jsx
- client/src/components/CustomerInput.jsx
- client/src/pages/Sales.jsx
- client/src/pages/BanHang/**
- client/dist/**
- cong_cu/thu_KHACHCK1.js
- cong_cu/thu_BH1.js
- cong_cu/thu_BH2.js
- cong_cu/thu_GOI1.js
- cong_cu/thu_P20.js
- cong_cu/thu_P26c.js
- cong_cu/thu_UUDAI1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHACHCK1.js` ĐỎ trên code gốc: khách hồ sơ 10 % mua không mã → tổng KHÔNG giảm 10 %; PUT chiết khấu 5 % → 400; sau nâng
cấp 004 mọi discount_value = 0 và bảng sao lưu đủ dòng; chạy 004 lần 2 không đổi cấu trúc; tinh.js không còn khachGiam / coChietKhauRieng
(đọc mã thật); discount_note vẫn ra customer_note trên đơn.

## Ngân sách
~120 dòng máy chủ + ~80 dòng giao diện + ~250 dòng thử. Bài thử cũ đỏ vì hành vi đã duyệt đổi → LUAT §6 mục 7–8 (tự thêm Phạm vi, bài sửa
bình thường, ghi `SỐ CA`).
**Phương án đơn giản nhất đã xét:** bỏ đúng khối LO 2 ở orders.js (máy chủ thôi áp) + chặn ghi mức > 0 + một bước nâng cấp đặt về 0 +
bỏ chỗ hiện; không xoá cột (xoá cột trong SQLite tốn bước dựng lại bảng, không lợi gì).

## Đổi cấu trúc DB
không đổi cột — một bước nâng cấp 004 đổi DỮ LIỆU (discount_value về 0) có sao lưu bảng trước.

## Thư viện mới
không

## Cấm
- KHÔNG đổi cách tính hạng, mã giảm, Giờ vàng, ví, điểm, hoàn tiền; KHÔNG đổi luồng phiên thanh toán (thanh-toan.js, giuCho.js).
- KHÔNG xoá cột discount_type / discount_value / discount_note (chỉ đặt dữ liệu về 0); KHÔNG đổi tên cột.
- KHÔNG sửa server/routes/kh/** (KH-API-3 đang mở), app_kh/**.
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/KHACH-CK-1`. Không đụng main, không merge,
  không tạo PR.
