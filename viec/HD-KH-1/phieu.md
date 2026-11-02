# HD-KH-1 — App KH xem hoá đơn ĐÚNG mẫu hoá đơn POS + đọc lại cách trả / giữ ví / còn lại của đơn App

<!-- Phiếu do chat soạn 02.11.2026 (sau sổ v53). Việc [Th] — Sonnet, máy làm thẳng (không chờ duyệt kế hoạch); soát bảo mật có (dữ liệu khách).
     Chủ quán 02.11: "KH lấy form của POS" — màn chi tiết đơn trong App phải giống hệt tờ hoá đơn in ở quầy. App KH 02.11 (c) xin thêm trường đọc
     lại đơn Ví + QR. Tên trường CHỐT ở HOP_DONG_API_KH.md mục "Đã hẹn — v7" (dòng HD-KH-1).
     Hiện trạng chat đọc 02.11: hoá đơn in = client/src/utils/hoaDon.js (HÀM THUẦN dựng danh sách dòng từ dữ liệu GET /api/pos/hoa-don/:id +
     cài đặt chữ) — server/routes/hoaDon.js chỉ trả DỮ LIỆU (đã giữ bản sao KHONG_AN_DUOC, có bài thử so hai bên). App xem đơn:
     GET /api/kh/don/:ma → utils/donApp.js chiTietDon (~279), dsDon (~273); `giu_vi`, `con_lai`, `cach_tra` chỉ có trong trả lời POST /don. -->

## Mục tiêu
App vẽ hoá đơn từ CÙNG danh sách dòng mà quầy in (chữ quán sửa ở Cài đặt hoá đơn hiện y như tờ in); App biết đơn Ví + QR đã giữ ví bao nhiêu,
còn quét QR bao nhiêu, kể cả khi tải lại.

## Nghiệm thu
- A `GET /api/kh/don/:ma` thêm `hoa_don[] { loai, trai, phai, dam, gach, ghi_chu }` — dựng bằng hàm máy chủ cho KẾT QUẢ GIỐNG HỆT
  `client/src/utils/hoaDon.js` trên cùng dữ liệu + cài đặt (một module dùng chung, HOẶC bản máy chủ + bài thử so hai bên trên ≥ 6 đơn mẫu: đơn
  thường, giá hạng, mã giảm, ví + QR, đơn huỷ, đơn có phí giao). Chỉ phần tờ GIAO KHÁCH (không mã nhận điểm của đơn khác, không dữ liệu khách khác).
- B `GET /api/kh/don/:ma` và mỗi đơn của `GET /api/kh/don` thêm `cach_tra` (`qr` | `vi` | `vi_qr`), `giu_vi`, `con_lai` cho đơn App; đơn quầy → `null`.
- C Đơn của khách khác → 404 như không có (giữ luật cũ). Tờ hoá đơn không lộ SĐT đầy đủ của người khác.
- D Hợp đồng: chuyển dòng HD-KH-1 của "Đã hẹn" lên bảng cửa, tăng PHIEN_BAN (lên 6 nếu SEPAY-1 chưa lên v6 — kế hoạch kiểm main lúc làm),
  ghi nhật ký; `thu_HOPDONG_KH.js` xanh.
- K5 Hoá đơn in ở quầy KHÔNG đổi (bài thử HD-1 xanh); các trường cũ của `/don`, `/don/:ma` giữ nguyên.

## Phạm vi
- viec/HD-KH-1/**
- server/utils/donApp.js
- server/routes/kh/index.js
- server/routes/hoaDon.js
- server/utils/dongHoaDon.js
- client/src/utils/hoaDon.js
- cong_cu/thu_HDKH1.js
- cong_cu/thu_HD1.js
- cong_cu/thu_HOPDONG_KH.js
- HOP_DONG_API_KH.md
- client/dist/**
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_HDKH1.js` ĐỎ trên code gốc: `/don/:ma` có `hoa_don[]` khớp từng dòng với hàm hoá đơn quầy trên các đơn mẫu; `cach_tra`, `giu_vi`,
`con_lai` đúng cho đơn `qr` / `vi` / `vi_qr`, `null` cho đơn quầy; đơn khách khác 404.

## Bài thử cũ sửa
- cong_cu/thu_HD1.js — chỉ thêm ca so hai bên nếu dùng bản máy chủ riêng (không bớt ca).

## Ngân sách
~150 dòng máy chủ + ~250 dòng thử.
**Phương án đơn giản nhất đã xét:** dùng chung đúng một hàm dựng dòng cho cả quầy và App; nếu không chia được giữa ESM (Vite) và CommonJS thì bản
máy chủ + bài thử so từng dòng (khuôn KHONG_AN_DUOC đang có).

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
có — cửa khách đọc đơn: không lộ đơn / mã / SĐT của khách khác.
