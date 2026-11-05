# SUA-C9-1 — nới ca C9 của thu_P26a.js: lưu hạng kèm PIN chủ quán khi máy chủ có khoá PIN (để HANG-1 gộp được)

<!-- Phiếu do chat soạn 04.11.2026 (bàn 32), chủ quán chạy bằng script (không qua máy). HANG-1 (chủ quán chọn a+b 04.11) bắt PIN chủ quán cho MỌI
     lần lưu ở Cài đặt → Hạng; ca C9 của cong_cu/thu_P26a.js lưu hạng không PIN nên đỏ trên code HANG-1. Sửa bài trong HANG-1 không cứu được:
     HOC-1 (d) chạy BẢN GỐC bài cũ trên code PR. Nới riêng ca này trên main TRƯỚC, bằng PR không đổi code chạy (khuôn SUA-E2-1). -->

## Mục tiêu
Ca C9 của `cong_cu/thu_P26a.js`: kho thử có bảng `pos_pin_chu_quan` (HANG-1) thì đặt sẵn một PIN thử; lần lưu luôn gửi kèm `pin`. Điều C9 canh giữ
nguyên: `PUT /tiers` lưu lại hạng có sẵn → 200. Các ca khác không đổi.

## Nghiệm thu
- A Trên main hiện tại (chưa có khoá PIN) bài vẫn xanh đủ 16 ca — máy chủ bỏ qua trường `pin`.
- B Trên code nhánh viec/HANG-1 (50ee774) bài xanh 16/16 (bản cũ: C9 đỏ "Chưa đặt PIN chủ quán").

## Phạm vi
- viec/SUA-C9-1/**
- cong_cu/thu_P26a.js

## Bài thử đỏ
không — chỉ nới một ca của bài thử cũ, không đổi code chạy.

## Bài thử cũ sửa
- cong_cu/thu_P26a.js — ca C9 đặt sẵn PIN chủ quán thử khi có bảng pos_pin_chu_quan và gửi kèm pin khi lưu hạng; không bớt ca, vẫn đòi 200.

## Ngân sách
8 dòng thử.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
không — chỉ sửa bài thử.
