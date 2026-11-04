# KH-NHANH-POS-1 — CORS `maxAge` cho `/api/kh` (App KH bớt một vòng hỏi trước mỗi yêu cầu có token)

<!-- Phiếu do chat soạn 02.11.2026 (sau sổ v53). Việc [Th] — Sonnet, máy làm thẳng tới hết (không chờ duyệt kế hoạch).
     Yêu cầu App KH 01.11 (đo thật): yêu cầu có tiêu đề Authorization làm trình duyệt hỏi trước bằng OPTIONS; không có Access-Control-Max-Age
     thì Chrome chỉ nhớ 5 giây → mỗi lần chuyển tab mất thêm ~250 ms. server/index.js ~59–63: app.use(cors({ origin: '*', methods, allowedHeaders })). -->

## Mục tiêu
Trình duyệt nhớ kết quả hỏi trước (preflight) 2 giờ; không đổi gì khác.

## Nghiệm thu
- A `OPTIONS` một đường `/api/kh/...` với `Origin` + `Access-Control-Request-Method: GET` + `Access-Control-Request-Headers: authorization` → trả
  `Access-Control-Max-Age: 7200`.
- B Không đổi: `origin`, `methods`, `allowedHeaders` giữ nguyên; các đường `/api/pos/...` cũng nhận tiêu đề này là chấp nhận được (một chỗ cài).
- K5 Mọi bài thử cũ xanh; App gọi được như cũ.

## Phạm vi
- viec/KH-NHANH-POS-1/**
- server/index.js
- cong_cu/thu_KHNHANHPOS1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHNHANHPOS1.js` ĐỎ trên code gốc (thiếu `Access-Control-Max-Age: 7200`), xanh sau khi sửa.

## Ngân sách
~2 dòng code + ~40 dòng thử.
**Phương án đơn giản nhất đã xét:** thêm `maxAge: 7200` vào lời gọi `cors(...)` sẵn có.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
không — chỉ thêm thời gian nhớ preflight; origin / header cho phép không đổi.
