# MANKHACH-1 — Màn khách: máy tính bảng quay về phía khách, ghép với máy quầy; lúc thu hiện QR + món + tổng, lúc rảnh chạy nội dung do quán cài

<!-- Phiếu do chat soạn 31.10.2026. Việc thường [Th] — Sonnet, chạy thẳng tới hết (chỉ HIỂN THỊ, không ghi tiền / đơn). Nền: main sau sổ v51.
     Chủ quán chốt 31.10 (QUYET_DINH_CHU_QUAN.md mục Bán hàng): đưa máy quầy cho từng khách quét QR thì chậm, thiếu chuyên nghiệp; in bill QR thì
     lệch quy trình → thêm MỘT máy tính bảng quay về phía khách (máy quầy là máy tính bảng / điện thoại, không cắm màn thứ hai). Lúc rảnh màn khách
     chạy nội dung quán TỰ CÀI (menu, Giờ vàng, QR tải App / tích điểm, chữ giới thiệu, quảng cáo…) — "chạy gì do chúng ta cài đặt".
     Ảnh quảng cáo cần chỗ lưu ảnh ngoài máy Render (chung KH-SP-2) → việc này chỉ làm các trang lấy từ dữ liệu POS + chữ; để sẵn kiểu trang
     "ảnh" (tắt) cho KH-SP-2 bật.
     Hiện trạng chat đọc 31.10 trên main 596c346:
     - Màn Bán hàng mới client/src/pages/BanHang/** (BanHangMoi.jsx giữ `qr` của phiên; ManQr.jsx vẽ QR bằng utils/veQr.js, đếm ngược `het_han`,
       hỏi lại phiên tới khi đã thu). Màn cũ Sales.jsx không có QR tự xác nhận — màn khách chỉ nối màn MỚI.
     - Phiên thanh toán: GET /api/pos/thanh-toan/phien/:id (thanh-toan.js) trả trạng thái; menu quầy: products.js layMenuQuay; Giờ vàng:
       routes/flash.js + utils/flashState.js; QR App: App KH ở app-kh.pages.dev (địa chỉ để trong cài đặt, không viết cứng).
     - SEPAY-1 chạy SONG SONG và đổi cách tạo chuỗi QR ở máy chủ — màn khách chỉ dùng chuỗi `qr` máy chủ trả (không tự dựng QR).
     Báo cáo cho chủ quán theo LUAT §8. -->

## Mục tiêu
Khách tự quét QR trên màn của mình, nhân viên không phải xoay máy; lúc không thu tiền, màn khách là bảng quảng cáo do quán cài.

## Nghiệm thu
- A **Ghép máy:** trang `/man-khach` mở trên máy tính bảng (không cần đăng nhập nhân viên); máy quầy có mã ghép (4–6 số, đổi được) ở góc màn
  Bán hàng mới; nhập mã trên màn khách → ghép; máy chủ cấp cho màn khách một khoá riêng (thu hồi được ở Cài đặt) — màn khách CHỈ đọc được trạng
  thái của quầy đã ghép, không đọc / ghi gì khác. Hai quầy = hai cặp, không lẫn. Tải lại trang vẫn giữ ghép.
- B **Lúc thu:** quầy tạo phiên QR → trong ≤ 2 giây màn khách hiện ĐÚNG chuỗi `qr` máy chủ trả (vẽ to, dễ quét), số tiền phải trả, danh sách
  món (tên, SL, thành tiền), dòng giảm, đếm ngược theo `het_han`. Tiền về / quầy chốt → "Cảm ơn quý khách — đã nhận X đ" vài giây rồi về nội
  dung rảnh. Huỷ / hết hạn → về nội dung rảnh. Màn khách KHÔNG tự tính tiền (số lấy từ máy chủ).
- C **Lúc rảnh:** chạy vòng các "trang" theo danh sách quán cài: menu (từ POS — giá, hết hàng tự cập nhật), Giờ vàng đang chạy, QR tải App /
  tích điểm, chữ giới thiệu (tiêu đề + nội dung), kiểu "ảnh" để sẵn (tắt, chờ KH-SP-2). Mỗi trang: bật / tắt, số giây, thứ tự.
- D **Cài đặt → Màn khách** (chủ quán / quản lý): danh sách trang (A–C), địa chỉ QR App, danh sách màn khách đã ghép + nút thu hồi. Lưu một lần.
- E **Nhẹ, bền:** màn khách hỏi máy chủ theo nhịp (≤ 2 giây khi đang thu, chậm hơn khi rảnh); mất mạng → giữ màn hiện tại, có lại mạng tự nối;
  để chạy cả ngày không đầy bộ nhớ. Màn ngang và dọc đều đẹp (máy tính bảng 8–11 inch).
- F **K5:** bán hàng, thu tiền, QR, chốt, in, đơn App chạy y như cũ khi KHÔNG có màn khách ghép.

## Phạm vi
- viec/MANKHACH-1/**
- server/routes/man-khach.js
- server/utils/manKhach.js
- server/index.js
- server/routes/settings.js
- server/nang_cap/**
- client/src/pages/ManKhach/**
- client/src/pages/BanHang/BanHangMoi.jsx
- client/src/pages/BanHang/ManQr.jsx
- client/src/pages/BanHang/ManKetThuc.jsx
- client/src/pages/CaiDat/ManKhach.jsx
- client/src/pages/Settings.jsx
- client/src/App.jsx
- client/src/utils/**
- client/dist/**
- cong_cu/thu_MANKHACH1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_MANKHACH1.js` ĐỎ trên code gốc: ghép bằng mã đúng → khoá; mã sai / hết hạn → từ chối; khoá màn khách không đọc được quầy khác,
không gọi được đường nhân viên; quầy tạo phiên QR → trạng thái màn khách có đúng `qr`, số tiền, món; chốt / huỷ → về rảnh; thu hồi khoá → màn
khách mất quyền; danh sách trang lưu / đọc đúng, giá trị sai → 400.

## Ngân sách
~200 dòng máy chủ + ~400 dòng giao diện + ~250 dòng thử.
**Phương án đơn giản nhất đã xét:** máy chủ giữ "quầy X đang hiện gì" (một dòng mỗi quầy, ghi khi quầy mở / đóng màn QR); màn khách hỏi theo nhịp;
không websocket, không thư viện.

## Đổi cấu trúc DB
có thể — bảng màn khách / ghép (bước 009, chỉ THÊM, chịu được kho thử thiếu bảng); bảng mới phải vào sao lưu (SAOLUU-2 có bài thử chốt —
thêm tên bảng vào BACKUP_TABLES nếu SAOLUU-2 đã gộp; nếu chưa, ghi `## Câu hỏi`).

## Thư viện mới
không

## Cấm
- KHÔNG đổi tiền, phiên, chốt, QR (chỉ ĐỌC chuỗi `qr`); KHÔNG sửa server/utils/giuCho.js, thanh-toan.js, payos / sepay (SEPAY-1 đang sửa).
- KHÔNG cho màn khách đọc thông tin khách hàng (SĐT, số dư, điểm) — chỉ tên gọi nếu quầy đã chọn khách và chủ quán bật.
- KHÔNG sửa Sales.jsx.
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/MANKHACH-1`. Không đụng main, không merge,
  không tạo PR.
