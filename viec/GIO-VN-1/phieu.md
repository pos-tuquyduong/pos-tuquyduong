# GIO-VN-1 — Mọi giờ lưu / so / trả ra là giờ Việt Nam (UTC+7), dữ liệu cũ đổi qua bước nâng cấp có sao lưu

<!-- Phiếu do chat soạn 02.11.2026 (sổ v53). Việc [T] — Opus làn 1, lập kế hoạch, DỪNG chờ duyệt. Chủ quán chốt 28.10 (QUYET_DINH mục Chung).
     Xếp LÊN ĐẦU làn 1 (chat soát lịch 02.11): các việc sau (HANG-1 hạn thẻ cộng nối, QUA-1 quà chào mừng đếm ngược, CT-1 sinh nhật đúng ngày,
     NAP-2 phiên nạp) đều so giờ — làm GIO-VN-1 trước để chúng viết đúng ngay từ đầu, khỏi sửa lại.
     Hợp đồng /api/kh mục "Chung · Giờ" đã ghi "Lỗi đã biết: một số giờ CŨ còn lưu theo giờ quốc tế, có dấu cách thay chữ T — GIO-VN-1 sửa".
     Song song làn 2 (HANG-1 …) có thể sửa cùng file — kế hoạch ghi rõ vùng sửa; chồng vùng thì chat gộp. -->

**Chờ duyệt kế hoạch:** viết `viec/GIO-VN-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Một chuẩn giờ duy nhất: mọi giờ GHI, SO SÁNH, TRẢ RA đều là giờ Việt Nam dạng `YYYY-MM-DDTHH:mm:ss` qua `getNow` — hết lệch 7 tiếng ở hạn điểm,
hạn mã, hạn gói, hạn thẻ, đối soát theo ngày, App KH.

## Nghiệm thu
- A **Rà và sửa chỗ ghi giờ UTC:** mọi `CURRENT_TIMESTAMP` / `datetime('now')` (không +7) / `new Date().toISOString()` dùng để GHI hay SO trong
  server/ → `getNow` (hoặc hàm giờ VN chung). Cột có `DEFAULT CURRENT_TIMESTAMP` mà INSERT không truyền giờ → INSERT truyền giờ VN. Kế hoạch
  liệt kê TỪNG chỗ (file:dòng) trước khi sửa.
- B **Dữ liệu cũ:** bước nâng cấp đánh số (khung KHO-1, số 012) — liệt kê từng bảng / cột, cách nhận biết giờ UTC (dấu cách, không `T`, hoặc
  cột biết chắc ghi UTC), chỉ đổi những dòng nhận biết CHẮC CHẮN, KHÔNG đoán; có sao lưu trước, chạy lại lần hai không đổi gì; in số dòng đổi
  mỗi bảng.
- C **Chỗ so chuỗi giờ** (hạn điểm, hạn mã, hạn gói, hạn thẻ hạng, đối soát ngày, giờ vàng, giờ hoạt động, phiên QR 10 phút): ca thử trước / sau
  quanh mốc 00:00 và 07:00 giờ VN.
- D **Chặn tái phạm:** bài thử quét server/ đỏ khi có cách ghi giờ UTC mới (kèm danh sách ngoại lệ có lý do).
- E **App KH:** mọi giờ `/api/kh` đúng dạng; bỏ câu "Lỗi đã biết…" ở hợp đồng; tăng PHIEN_BAN + nhật ký.
- K5 **Không đổi:** đơn, điểm, ví, gói, đối soát của dữ liệu đã đúng giờ VN giữ nguyên; mọi bài thử cũ xanh.

## Phạm vi
- viec/GIO-VN-1/**
- server/**
- client/src/**
- client/dist/**
- cong_cu/thu_GIOVN1.js
- HOP_DONG_API_KH.md
- cong_cu/thu_HOPDONG_KH.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_GIOVN1.js` ĐỎ trên code gốc: quét còn chỗ ghi UTC; bước nâng cấp đổi đúng dòng cũ (và chạy lần hai không đổi gì); hạn điểm /
mã / gói hết đúng giờ VN quanh 00:00 và 07:00.

## Ngân sách
~150 dòng sửa máy chủ + ~120 dòng bước nâng cấp + ~300 dòng thử. Rà rộng nhưng mỗi chỗ sửa nhỏ; vượt thì giải thích.
**Phương án đơn giản nhất đã xét:** đổi tại chỗ ghi + một bước nâng cấp cho dữ liệu cũ nhận biết chắc chắn; KHÔNG đổi kiểu cột, KHÔNG đổi múi giờ máy.

## Đổi cấu trúc DB
không (chỉ đổi GIÁ TRỊ giờ cũ qua bước nâng cấp 012 có sao lưu).

## Thư viện mới
không

## Soát bảo mật
không — không thêm cửa mới, không đổi quyền; chỉ đổi cách ghi giờ.

## Cấm
Không đổi múi giờ của máy chủ / Render; không đổi định dạng giờ trả cho App ngoài đúng chuẩn đã ghi ở hợp đồng.
