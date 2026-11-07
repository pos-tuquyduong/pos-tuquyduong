# KH-TOMTAT-1 — trạng thái

## Đối chiếu bản chụp (bước 1, làm tiếp 07.11.2026)
HEAD = FETCH_HEAD = `b55c59c` (hook mở phiên đã kéo 66220bf → b55c59c; fetch lại: không có gì mới).
```
b55c59c PHIEU: KH-TOMTAT-1 chu quan tra loi cau hoi 06.11 (them file vao Pham vi)
f3a09c2 KH-TOMTAT-1: ke hoach + cau hoi Pham vi (can routes/hoaDon.js de dung chung dungThanhToan / tinhGiam)
66220bf GOP-KH-TOMTAT-1 dua main 5e93e3d vao nhanh truoc khi lam (chat 06.11)
```
Có commit `0adf75d PHIEU: KH-TOMTAT-1` trong lịch sử.

## Câu hỏi 06.11 — đã được chủ quán trả lời (phiếu commit b55c59c)
1. A: thêm `server/routes/hoaDon.js` vào Phạm vi — export `dungThanhToan`, tách `tinhGiam(o)`; không chép công thức, không gọi `dungHoaDon` từng đơn.
2. Đơn quầy có phí giao → `cach_nhan` `giao`, còn lại `tai_quan`; `null` chỉ khi không có dữ liệu đơn.

## Tiến độ
- Bài thử đỏ trước: `cong_cu/thu_KHTOMTAT1.js` (30 ca) đỏ trên gốc `ae1c072` (8 đạt · 22 hỏng) → `bang_chung_do.txt`.
- Sửa: `server/routes/hoaDon.js` (export `dungThanhToan`, tách `tinhGiam`), `server/utils/donApp.js` (`tomTat`, `tomTatDonThat`, nối vào `tomDon`),
  `HOP_DONG_API_KH.md` v12 + `cong_cu/thu_HOPDONG_KH.js` (hai phép v12).
- Quyết định thiết kế: KHÔNG thêm cột vào `CAU_DON` (UNION hai nhánh phải cùng số cột); đọc đơn thật bằng đúng 2 truy vấn cho cả trang
  (`SELECT * FROM pos_orders WHERE id IN (…)` + gom `SUM(quantity)` / tên dòng đầu) — không N+1.
- Cách hiểu ghi rõ trong hợp đồng "Ghi chú v12": `tra[]` bỏ dòng ghi nợ (tổng = `da_tra`); `giam` = hạng + Flash + mã, KHÔNG gồm phí giao;
  đơn App chưa có đơn thật → `tra: []`, `giam: 0`, `cach_nhan: 'tai_quan'`; thiếu dữ liệu → `null` (tổng NULL → `tra`/`giam`; phí giao NULL → `cach_nhan`;
  không dòng món → `so_mon`/`mon_dau`).

## Bảng "chỗ vá → đột biến" (`viec/KH-TOMTAT-1/dot_bien.py`, 32 đột biến, đối chứng XANH, 32/32 BẮT)
| Chỗ vá | Đột biến |
|---|---|
| nối `...tomTat(r, ext)` vào `tomDon` | BV-BO-TOM-TAT |
| `kenh` | VS-KENH-LUON-QUAY · VS-KENH-LUON-APP |
| `cach_nhan` | VS-CACH-NHAN-LUON-TAI-QUAN · VS-CACH-NHAN-NGUONG-NOI · VS-CACH-NHAN-DOAN-KHI-THIEU |
| `tra[]` | VS-TRA-CO-DONG-GHI-NO · VS-TRA-DOI-TEN-CACH · VS-TRA-DOI-SO-TIEN · VS-TRA-THIEU-KHI-THIEU-TONG |
| `giam` | VS-GIAM-LUON-0 · VS-GIAM-TINH-LAI-KIEU-KHAC · VS-GIAM-THIEU-MA · VS-GIAM-THIEU-FLASH |
| `so_mon`, `mon_dau` | VS-SO-MON-DEM-DONG · VS-MON-DAU-LA-MON-CUOI · VS-SO-MON-THIEU-THANH-0 |
| đơn App chưa có đơn thật | VS-APP-CHO-TRA-LA-NULL · VS-APP-CHO-TRA-DEM-DONG |
| hai cửa cùng đi qua `tomDon` (K4) | VS-DS-KHONG-TOM-TAT · VS-CHI-TIET-KHONG-TOM-TAT · VS-TOM-TAT-LAY-SAI-DON |
| chỉ đơn của SĐT trong token | BV-BO-LOC-SDT-DON-THAT |
| `hoaDon.js` export + `tinhGiam` | BV-KHONG-EXPORT-DUNG-THANH-TOAN · BV-KHONG-EXPORT-TINH-GIAM · VS-TINH-GIAM-MA-KHONG-TRU-HANG · VS-TINH-GIAM-MA-KHONG-CONG-PHI-GIAO · VS-TINH-GIAM-TONG-THIEU-FLASH |
| hợp đồng v12 | BV-HOPDONG-CUA-DON-BO-KENH · BV-HOPDONG-CUA-DON-CT-BO-GIAM · BV-HOPDONG-BO-GHI-CHU-V12 · BV-HOPDONG-NHAT-KY-V12 |

Lần chạy đầu có 1 đột biến SỐNG (VS-TOM-TAT-LAY-SAI-DON): các ca đọc từng đơn lúc danh sách mới có 1–2 đơn, nên đơn bị gán tóm tắt của đơn khác không lộ.
Thêm ca A10 (8 đơn cùng trang, danh sách = chi tiết của chính đơn đó, các đơn khác nhau) → BẮT.
