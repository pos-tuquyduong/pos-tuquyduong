# BAO-1a — Mọi thao tác ngoài Cài đặt báo rõ, dễ hiểu, luôn nhìn thấy

<!-- Phiếu do chat soạn 09.11.2026 (bàn 34, sổ v59). Việc [Th] — Sonnet, làm thẳng tới hết.
     Chủ quán 09.11: lưu PIN chủ quán không thấy báo gì (câu báo nằm ở ĐẦU trang, ô PIN ở cuối — HangThe.jsx dòng ~96) → "rà soát hệ thống để mỗi khi
     thao tác đều hiển thị đầy đủ thông báo một cách dễ hiểu". Phần 1 (việc này) làm mọi màn NGOÀI Cài đặt; Settings.jsx, pages/CaiDat/** và
     client/src/utils/api.js đang thuộc DIEM-MON-1 → phần 2 BAO-1b (gồm CAIDAT-BAO-1) làm Cài đặt sau khi DIEM-MON-1 gộp, dùng lại thành phần của việc này.
     Mẫu chủ quán duyệt tạm: artifact Design "Tinh gọn Cài đặt & Khách hàng — POS Tứ Quý Đường", màn 3: thông báo nổi góc trên phải — xanh
     "Đã lưu …" (dấu ✓), đỏ có tiêu đề + lý do + cách sửa + nút đóng ×. -->

## Mục tiêu
Một thành phần thông báo chung; mọi nút thao tác ngoài Cài đặt báo xong / lỗi rõ ràng bằng tiếng Việt dễ hiểu, luôn nhìn thấy.

## Nghiệm thu
- A `client/src/components/ThongBao.jsx` (+ hàm gọi ngắn, vd `baoXong(chu)` / `baoLoi(tieuDe, lyDo)`), gắn MỘT lần ở Layout: nổi cố định góc trên phải
  (position fixed — thấy dù cuộn ở đâu); xanh tự ẩn sau ~4 giây; đỏ KHÔNG tự ẩn, có nút đóng (≥ 44px); `role="status"` / `role="alert"`; nhiều thông báo
  xếp chồng, tối đa 3.
- B Rà mọi màn ngoài Cài đặt (BanHang/**, Customers, Orders, DonApp, DonThu, Refunds, Registrations, DiscountCodes, InvoiceSettings, Reports, Sales,
  Kho/**, GiaoHang/**, ManKhach/**, QuanLy/**, components/*): MỌI nút ghi (lưu, xoá, gửi, duyệt, huỷ, thu tiền, in lại …) báo xong nói rõ đã làm gì
  ("Đã lưu khách Nguyễn Thị Hoa") hoặc báo lỗi; thay `alert(` và dòng chữ khuất đầu trang. trang_thai.md có bảng: màn · nút · trước · sau.
- C Lỗi máy chủ: dùng câu `error` / `message` máy chủ trả; không có câu → câu chung "Chưa <việc> được. Thử lại; vẫn lỗi thì báo chủ quán". Không hiện
  chữ kỹ thuật, mã HTTP, stack.
- D Nút đang xử lý: mờ + chữ "Đang lưu…" (hoặc tương ứng), không bấm được hai lần.
- E Bộ kiểm: bánh cóc đếm `alert(` trong client/src (chỉ được giảm); `cong_cu/thu_BAO1a.js` khoá thành phần (đỏ không tự ẩn, xanh tự ẩn, có role,
  Layout gắn một lần) và nối vào kiem_tra_truoc_khi_giao.js.
- K5 Không đổi: máy chủ, tiền, quyền, bố cục (ngoài phần thông báo).

## Phạm vi
- viec/BAO-1a/**
- client/src/components/**
- client/src/index.css
- client/src/pages/BanHang/**
- client/src/pages/Customers.jsx
- client/src/pages/Orders.jsx
- client/src/pages/DonApp.jsx
- client/src/pages/DonThu.jsx
- client/src/pages/Refunds.jsx
- client/src/pages/Registrations.jsx
- client/src/pages/DiscountCodes.jsx
- client/src/pages/InvoiceSettings.jsx
- client/src/pages/Reports.jsx
- client/src/pages/Sales.jsx
- client/src/pages/Kho/**
- client/src/pages/GiaoHang/**
- client/src/pages/ManKhach/**
- client/src/pages/QuanLy/**
- client/dist/**
- cong_cu/thu_BAO1a.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_BAO1a.js` ĐỎ trên gốc: chưa có ThongBao.jsx; Layout chưa gắn; còn `alert(` ở Orders.jsx / Refunds.jsx / InvoicePrint.jsx.

## Ngân sách
~400 dòng giao diện (nhiều file, mỗi chỗ vài dòng) + ~120 dòng thử.
**Phương án đơn giản nhất đã xét:** tự viết một thành phần nhỏ (không cài thư viện), gọi qua một hàm chung.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
không

## Cấm
Không sửa Settings.jsx, client/src/pages/CaiDat/**, client/src/utils/api.js (DIEM-MON-1 — phần Cài đặt là BAO-1b); không đổi máy chủ; không đổi
bố cục / màu ngoài phần thông báo (GIAO-DIEN-2 làm sau).
