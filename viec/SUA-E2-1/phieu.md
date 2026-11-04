# SUA-E2-1 — nới ca E2 của thu_GIOVN1.js: PHIEN_BAN hợp đồng ≥ 6 (để việc sau tăng số hợp đồng được)

<!-- Phiếu do chat soạn 04.11.2026, chủ quán chạy bằng script (không qua máy). Ca E2 của GIO-VN-1 khoá cứng "PHIEN_BAN = 6", nên mọi việc tăng
     hợp đồng lên v7, v8… (HD-KH-1, SEPAY-1, HANG-1, CT-1a) đều đỏ ở cổng: bản gốc của bài chạy trên code mới thì đỏ. Nới riêng ca này trên main
     TRƯỚC, bằng PR không đổi số hợp đồng. -->

## Mục tiêu
Ca E2 của `cong_cu/thu_GIOVN1.js` chấp nhận PHIEN_BAN ≥ 6 (khối máy đọc `phien_ban` khớp PHIEN_BAN); các ca khác giữ nguyên.

## Nghiệm thu
- A Trên main hiện tại (PHIEN_BAN 6) bài vẫn xanh đủ 61 ca.
- B Khi hợp đồng lên v7 / v8 bài vẫn xanh (không còn khoá cứng 6); vẫn đòi dòng nhật ký "v6 · … GIO-VN-1" và bỏ câu "Lỗi đã biết".

## Phạm vi
- viec/SUA-E2-1/**
- cong_cu/thu_GIOVN1.js

## Bài thử đỏ
không — chỉ nới một ca của bài thử cũ, không đổi code chạy.

## Bài thử cũ sửa
- cong_cu/thu_GIOVN1.js — ca E2 "PHIEN_BAN = 6" thành "≥ 6" (khối máy đọc phien_ban khớp PHIEN_BAN); không bớt ca, ca khác giữ nguyên.

## Ngân sách
2 dòng thử.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
không — chỉ sửa bài thử.
