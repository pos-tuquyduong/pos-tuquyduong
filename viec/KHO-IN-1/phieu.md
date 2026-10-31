# KHO-IN-1 — Cài đặt in phiếu (80mm / A5 / A4 cho từng loại phiếu kho) · khổ hoá đơn mặc định thật sự có tác dụng

<!-- Phiếu do chat soạn 31.10.2026. Việc thường [Th] — Sonnet, chạy thẳng tới hết. Nền: main sau sổ v51 (KHO-2b, KH-QUAY-2 đã gộp).
     Chủ quán chốt 31.10 (QUYET_DINH_CHU_QUAN.md): HOÁ ĐƠN KHÁCH chỉ khổ nhiệt (KH-QUAY-2 đã làm); CÁC LOẠI PHIẾU (xuất / nhập kho, đặt hàng,
     phát sinh, pha chế…) VẪN có lựa chọn 80mm / A5 / A4 và có phần Cài đặt in phiếu.
     KH-QUAY-2 phát hiện (trang_thai mục Phát hiện): máy chủ còn mặc định khổ hoá đơn 'a5' (server/database.js ~1161 seed invoice_default_size,
     server/routes/settings.js ~268); ô "Khổ mặc định" ở Cài đặt hoá đơn lưu `config.default_size` mà lệnh in đọc `invoice_default_size` → nghi ô
     đó không có tác dụng.
     Phần "sửa phiếu nhận khi lô đã bị dùng" (chủ quán chốt 31.10) KHÔNG thuộc việc này — làm ở KHO-2c (Opus).
     Hiện trạng chat đọc 31.10 trên main 596c346:
     - Phiếu kho: client/src/pages/Kho/XemPhieu.jsx (~12 KHO_IN { k80, a4 }; ~199–200 nút "In 80 mm" / "In A4"); kho.css, inPhieuKho.css.
       Các loại: PX xuất, DH đặt hàng, PN nhận, PS phát sinh (Kho/DatHang.jsx, NhanHang.jsx, PhatSinh.jsx, DsPhieu.jsx).
     - In chung: client/src/utils/inPhieu.js (KHO_BILL — đã chỉ còn khổ nhiệt, KHO_PHIEU, KHO_TEM, loại bill / tem / pha_che; chonKho đọc
       invoice_default_size); client/src/components/InPhieu.jsx (KHO_GIAY có a5 / a4).
     - Cài đặt hoá đơn: client/src/pages/InvoiceSettings.jsx (~858 ô "Khổ mặc định" ghi config.default_size).
     Báo cáo cho chủ quán theo LUAT §8. -->

## Mục tiêu
Mỗi loại phiếu kho in đúng khổ quán chọn sẵn (vẫn đổi được khi in); ô khổ hoá đơn mặc định thật sự quyết định khổ in.

## Nghiệm thu
- A **Cài đặt in phiếu** (một khối mới, chủ quán / quản lý): mỗi loại phiếu (xuất PX, đặt hàng DH, nhận PN, phát sinh PS, phiếu pha chế) chọn khổ
  mặc định 80mm / A5 / A4 và số bản. Lưu ở cài đặt máy chủ (khoá mới, kiểm giá trị — sai → 400), dùng chung mọi máy.
- B **Khi in phiếu:** màn xem phiếu có đủ 3 khổ, nút khổ mặc định của loại đó đứng đầu / được chọn sẵn; bố cục A5 / A4 / 80mm không tràn, không cắt
  chữ (bảng dòng, chữ ký, số phiếu).
- C **Khổ hoá đơn mặc định:** ô "Khổ mặc định" ở Cài đặt hoá đơn ghi đúng khoá mà lệnh in đọc (một nguồn); máy chủ mặc định '80mm' (seed + đường
  đọc), giá trị cũ 'a5' / 'a4' vẫn đọc ra 80mm như KH-QUAY-2 (không sửa dữ liệu).
- D **K5:** hoá đơn 2 tờ HD-1, tem, in lại ở Đơn hàng, nội dung phiếu kho không đổi.

## Phạm vi
- viec/KHO-IN-1/**
- client/src/pages/Kho/**
- client/src/components/InPhieu.jsx
- client/src/utils/inPhieu.js
- client/src/pages/InvoiceSettings.jsx
- client/src/pages/CaiDat/InPhieu.jsx
- client/src/pages/Settings.jsx
- client/dist/**
- server/routes/settings.js
- server/database.js
- cong_cu/thu_KHOIN1.js
- cong_cu/thu_KHQUAY2.js
- cong_cu/thu_HD1.js
- cong_cu/thu_KHO2a.js
- cong_cu/thu_KHO2b.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHOIN1.js` ĐỎ trên code gốc: khoá cài đặt khổ phiếu lưu / đọc đúng, giá trị lạ → 400; màn xem phiếu có đủ 80mm / A5 / A4, mặc định
theo cài đặt (đọc nguồn, bắt theo hành vi); ô khổ hoá đơn ghi đúng khoá lệnh in đọc; máy chủ mặc định 80mm.

## Ngân sách
~60 dòng máy chủ + ~200 dòng giao diện + ~150 dòng thử.
**Phương án đơn giản nhất đã xét:** vài khoá cài đặt (`in_phieu_<loai>_kho`, `_ban`) + một hàm chọn khổ dùng chung; CSS @page theo khổ.

## Đổi cấu trúc DB
không (chỉ khoá cài đặt).

## Thư viện mới
không

## Cấm
- KHÔNG đổi luồng phiếu kho (tạo / duyệt / tồn), KHÔNG đổi nội dung hoá đơn; KHÔNG thêm A4 / A5 cho hoá đơn khách.
- KHÔNG sửa server/kho/** (KHO-2c sẽ sửa).
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/KHO-IN-1`. Không đụng main, không merge,
  không tạo PR.
