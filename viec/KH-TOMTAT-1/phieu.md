# KH-TOMTAT-1 — Lịch sử đơn App có tóm tắt thật từng đơn: kênh, cách nhận, các cách đã trả, số món, đã giảm

<!-- Phiếu do chat soạn 05.11.2026 (sổ v54). Việc [Th] — Sonnet, máy làm thẳng; soát bảo mật có (cửa App trả dữ liệu đơn).
     Thư App KH 05.11 (YEU_CAU_APPKH_GUI_POS_05112026.md) mục 2 — chủ quán chốt 05.11: thẻ Lịch sử đơn trên App phải có tóm tắt như đơn thật (nhận ở
     đâu, trả bằng gì…), không chỉ mã, giờ, tổng, trạng thái.
     Hiện trạng chat đọc 05.11 trên main 4723a3b: `GET /don` = dsDon → tomDon (server/utils/donApp.js ~272) trả ma, ngay, tong, da_tra, trang_thai,
     thanh_toan, tien_trinh, qr + cachTraCua(r); chi tiết `GET /don/:ma` có thêm mon[] + hoa_don[] (dongHoaDonKhach — CÙNG hàm tờ giao khách in ở
     quầy, HD-KH-1). LÀM SAU khi CK-NOIDUNG-1 gộp (cùng sửa donApp.js, kh/index.js, HOP_DONG_API_KH.md). -->

## Mục tiêu
Khách mở Lịch sử đơn trên App là thấy ngay mỗi đơn: mua ở đâu, nhận thế nào, trả bằng gì bao nhiêu, mấy món, được giảm bao nhiêu — đúng như đơn thật.

## Nghiệm thu
- A `GET /api/kh/don` (mỗi đơn) và `GET /don/:ma` thêm: `kenh` (`app` · `quay`; sau này kênh nền tảng theo KENH-1), `cach_nhan` (`tai_quan` ·
  `giao` · `tai_cho` nếu quầy có phân biệt, `null` khi không rõ), `tra[] { cach, so_tien }` (tên `cach` CÙNG tên với hoá đơn / Đối soát; đơn trả
  ví + QR → hai dòng), `so_mon` (tổng số ly / món), `mon_dau` (tên món đầu), `giam` (tổng tiền đã giảm, số dương, 0 khi không giảm).
- B Mọi trường tính bằng CÙNG dữ liệu / hàm mà hoá đơn in ở quầy dùng (không tính lại kiểu khác): tổng `tra[]` = số khách đã trả của đơn; `giam` =
  phần giảm in trên hoá đơn.
- C Đơn cũ thiếu dữ liệu → trường `null` (không đoán). Đơn App chưa trả / đã huỷ trước khi trả → `tra` rỗng.
- D Xác nhận bằng bài thử: `hoa_don[]` của `GET /don/:ma` có đủ dòng cách trả, giảm hạng / mã / điểm và cách nhận như tờ in (App vẽ chi tiết đơn
  theo `hoa_don[]`). Thiếu dòng nào thì bổ sung cho khớp tờ in.
- E Hợp đồng: bảng cửa + nhật ký, tăng PHIEN_BAN (chat chỉnh số lúc gộp), `thu_HOPDONG_KH.js` xanh. Trường chỉ của đơn thuộc SĐT trong token.
- K5 Không đổi: trường cũ của `GET /don` / `GET /don/:ma`, số tiền, cách tính hoá đơn, cửa quầy.

## Phạm vi
- viec/KH-TOMTAT-1/**
- server/utils/donApp.js
- server/utils/dongHoaDon.js
- server/routes/kh/index.js
- cong_cu/thu_KHTOMTAT1.js
- cong_cu/thu_HOPDONG_KH.js
- HOP_DONG_API_KH.md
- kiem_tra_truoc_khi_giao.js
- server/routes/hoaDon.js

<!-- Chủ quán 06.11 (câu hỏi kế hoạch f3a09c2):
     1 A — thêm server/routes/hoaDon.js: export dungThanhToan, tách tinhGiam(o); hoá đơn quầy gọi lại đúng hai hàm đó (in ra y như cũ, bài thử so
       trước / sau). KHÔNG chép công thức sang donApp.js, KHÔNG gọi dungHoaDon cho từng đơn. GIAO-1 cũng sửa hoaDon.js (2 dòng) — chỉ sửa đúng chỗ
       cần, chat lo phần đụng nhau khi gộp.
     2 Đồng ý cách của máy: đơn quầy có phí giao → cach_nhan 'giao', còn lại 'tai_quan'; null chỉ khi không có dữ liệu đơn. -->
## Bài thử đỏ
Có — `cong_cu/thu_KHTOMTAT1.js` ĐỎ trên code gốc: đơn quầy tiền mặt / QR / ví / ví + QR / có giảm hạng + mã, đơn App lấy tại quầy và giao → đủ trường
đúng giá trị; tổng `tra[]` = số đã trả; đơn cũ thiếu dữ liệu → `null`; đơn của SĐT khác không lộ; `hoa_don[]` có dòng cách trả + giảm.

## Ngân sách
~120 dòng máy chủ + ~250 dòng thử.
**Phương án đơn giản nhất đã xét:** thêm vài cột vào câu `CAU_DON` sẵn có + một hàm tóm tắt dùng chung cho `tomDon`.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
có — cửa App trả thêm dữ liệu đơn của khách.

## Cấm
Không đổi nội dung chuyển khoản / số hoá đơn (CK-NOIDUNG-1), không làm huỷ đơn (HUY-1).
