# BAO-1b — Màn Cài đặt báo rõ mọi thao tác (gồm CAIDAT-BAO-1): dùng thông báo chung BAO-1a, báo "có thay đổi chưa lưu", hỏi PIN lúc bấm Lưu

<!-- Phiếu do chat soạn 11.11.2026 (bàn 35, sổ v61). Việc [Th] — Sonnet, làm thẳng tới hết. Phần 2 của BAO-1a (đã gộp #88): thành phần thông báo
     chung client/src/components/ThongBao.jsx + client/src/components/thongBaoKho.js (baoXong, baoLoi, baoLoiTu, lyDoLoi) đã gắn một lần ở Layout.
     Chủ quán 09.11: lưu PIN chủ quán không thấy báo gì (câu báo ở ĐẦU trang, ô PIN ở cuối — CaiDat/HangThe.jsx). App KH 07.11 + chủ quán
     (CAIDAT-BAO-1, gộp vào đây): mọi màn Cài đặt báo rõ đã lưu gì / vì sao chưa lưu + cách sửa; "có thay đổi chưa lưu"; nút Lưu không bị mờ chỉ vì
     thiếu PIN — bấm Lưu thì HỎI PIN; lưu xong tải lại số đã lưu. DIEM-MON-1 đã gộp (#85) nên Settings.jsx, pages/CaiDat/**, utils/api.js giờ rảnh.
     Mẫu chủ quán duyệt tạm: artifact Design "Tinh gọn Cài đặt & Khách hàng — POS Tứ Quý Đường", màn 3. -->

## Mục tiêu
Mọi thẻ trong Cài đặt báo xong / lỗi rõ ràng, luôn nhìn thấy (dùng chung thành phần của BAO-1a), không còn lưu xong mà không biết đã lưu hay chưa.

## Nghiệm thu
- A **Dùng thông báo chung:** Settings.jsx và mọi file pages/CaiDat/** bỏ dòng `message` / chữ báo ở đầu trang và `alert(`; mọi nút ghi (lưu, thêm,
  sửa, xoá, bật / tắt, đặt PIN, ghép máy …) gọi baoXong nói rõ đã làm gì ("Đã lưu hạng Vàng: giảm 10%") hoặc baoLoi / baoLoiTu với lý do + cách sửa.
- B **Báo tại chỗ:** lỗi của ô cụ thể (PIN sai, thiếu tên hạng, số âm…) hiện NGAY DƯỚI ô đó (chữ đỏ) VÀ thông báo nổi — áp cho Hạng thành viên +
  PIN chủ quán (HangThe.jsx), Gói nạp, Tích điểm, Chương trình, Giờ hoạt động, Giao hàng, Màn khách, In phiếu, Cổng QR.
- C **Có thay đổi chưa lưu:** sửa ô mà chưa Lưu → thanh cố định cuối màn "Có thay đổi chưa lưu" + nút Lưu / Bỏ; chuyển thẻ khi còn thay đổi → hỏi lại.
- D **PIN:** nút Lưu KHÔNG mờ chỉ vì thiếu PIN; bấm Lưu ở chỗ cần PIN chủ quán → hỏi PIN (ô nổi), PIN sai báo dưới ô PIN, không mất dữ liệu đã gõ.
- E **Sau khi lưu:** tải lại số đã lưu từ máy chủ (hiện đúng cái máy chủ giữ, không giữ số đang gõ); nút đang xử lý mờ + "Đang lưu…", không bấm đôi.
- F **Bộ kiểm:** bánh cóc `alert(` (BAO-1a) giảm thêm; `cong_cu/thu_BAO1b.js` khoá: Cài đặt không còn `message` đầu trang / `alert(`, HangThe báo PIN
  dưới ô, thanh "Có thay đổi chưa lưu", nút Lưu không mờ vì thiếu PIN; nối vào kiem_tra_truoc_khi_giao.js.
- K5 **Không đổi:** máy chủ, quyền, số liệu cài đặt, bố cục các thẻ (ngoài phần thông báo / thanh lưu).

## Phạm vi
- viec/BAO-1b/**
- client/src/pages/Settings.jsx
- client/src/pages/CaiDat/**
- client/src/components/**
- client/src/utils/api.js
- client/src/index.css
- client/dist/**
- cong_cu/thu_BAO1b.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_BAO1b.js` ĐỎ trên gốc: Settings.jsx còn `setMessage` / chữ báo đầu trang; HangThe.jsx báo PIN ở đầu trang; chưa có thanh
"Có thay đổi chưa lưu".

## Ngân sách
~350 dòng giao diện (Settings.jsx dài ~2.300 dòng, nhiều chỗ mỗi chỗ vài dòng) + ~150 dòng thử.
**Phương án đơn giản nhất đã xét:** dùng nguyên ThongBao / thongBaoKho của BAO-1a, thêm MỘT thành phần nhỏ "thanh lưu" dùng chung cho mọi thẻ.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
không

## Cấm
Không đổi máy chủ; không đổi số liệu / luật cài đặt; không làm mẫu voucher (VOUCHER-2 song song — nếu VOUCHER-2 thêm thẻ "Voucher" vào Settings.jsx
thì việc gộp sau tự lo); không đổi bố cục / màu ngoài phần thông báo (GIAO-DIEN-2 làm sau).
