# SUA-SL-1 — nới thu_SAOLUU2.js (F1), thu_KHO1.js (J3–J7), thu_KHO2b.js (H4): bỏ trang "Hạng thành viên" khỏi file trước khi khôi phục (để HANG-1 gộp được)

<!-- Phiếu do chat soạn 05.11.2026 (bàn 32), chủ quán chạy bằng script (không qua máy). HANG-1 câu 4a (chủ quán 05.11): trang "Hạng thành viên"
     không khôi phục bằng file nữa (chỉ sửa ở Cài đặt có PIN) — ba bài cũ khôi phục NGUYÊN file "xuất tất cả" (trang Hạng luôn có dòng) nên đỏ trên
     code HANG-1. Sửa trong HANG-1 không cứu được (HOC-1 d chạy BẢN GỐC bài cũ trên code PR) → nới trên main TRƯỚC (khuôn SUA-C9-1). -->

## Mục tiêu
Ba bài thử sao lưu bỏ trang "Hạng thành viên" khỏi file trước khi gửi khôi phục (như SAOLUU2 đã bỏ các trang tiền). Điều các ca canh giữ nguyên.

## Nghiệm thu
- A Trên main hiện tại ba bài vẫn xanh đủ ca (SAOLUU2 36, KHO1 111, KHO2b 78 lúc chat thử).
- B Trên code nhánh viec/HANG-1 (ca903d6) ba bài xanh (bản cũ: SAOLUU2 F1, KHO1 J3/J5/J6/J7, KHO2b H4 đỏ).

## Phạm vi
- viec/SUA-SL-1/**
- cong_cu/thu_SAOLUU2.js
- cong_cu/thu_KHO1.js
- cong_cu/thu_KHO2b.js

## Bài thử đỏ
không — chỉ nới cách dựng file của ba bài thử cũ, không đổi code chạy.

## Bài thử cũ sửa
- cong_cu/thu_SAOLUU2.js — F1 bỏ thêm trang "Hạng thành viên" (cùng danh sách trang tiền); không bớt ca.
- cong_cu/thu_KHO1.js — J3–J7 khôi phục file đã bỏ trang "Hạng thành viên"; không bớt ca.
- cong_cu/thu_KHO2b.js — H4 khôi phục file đã bỏ trang "Hạng thành viên"; không bớt ca.

## Ngân sách
~25 dòng thử.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
không — chỉ sửa bài thử.
