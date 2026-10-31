# KH-QUAY-2 — Quầy: cấp mã đăng nhập App cho SĐT MỚI · hoá đơn KHÁCH chỉ còn khổ nhiệt (bỏ A4 / A5 của hoá đơn khách)

<!-- Phiếu do chat soạn 31.10.2026. Việc thường [Th] — Sonnet, chạy thẳng tới hết. Nền: main sau sổ v50 (KH-SP-1 #56 đã gộp).
     (1) App KH xin 31.10 (YEU_CAU_APPKH_GUI_POS_31102026_e.md): chưa có Zalo ZNS thì App bảo khách lấy mã ở quầy, nhưng nút "Mã đăng nhập App"
     (KH-QUAY-1) CHỈ có trong chi tiết khách ĐÃ CÓ → SĐT mới không lấy được mã → khách mới không đăng ký App được. Tạo khách trước ở quầy thì
     khách thành "khách cũ" → App không hỏi xưng hô → luồng đăng ký 3 bước không chạy. Máy chủ đã sẵn: POST /api/pos/kh/cap-ma { sdt }
     (server/routes/kh/quay.js ~13, `canCauHinhKhach`; capMaQuay ở server/utils/maKhach.js) KHÔNG đòi SĐT là khách.
     (2) Chủ quán chốt 31.10: HOÁ ĐƠN KHÁCH chỉ in khổ nhỏ dọc (khổ nhiệt) → bỏ A4 / A5 khỏi chỗ chọn khổ hoá đơn cho đỡ rối. CÁC LOẠI PHIẾU
     (xuất / nhập kho, pha chế…) VẪN GIỮ lựa chọn A4 / A5 — việc riêng KHO-IN-1 làm phần Cài đặt in phiếu.
     Hiện trạng chat đọc 31.10 trên main 36db19b:
     - client/src/components/MaDangNhapApp.jsx (thành phần nút + mã 6 số + đếm ngược, prop `sdt`); Customers.jsx ~686 chỉ gắn trong chi tiết khách.
     - Khổ hoá đơn: client/src/components/InvoicePrint.jsx PAPER_SIZES (~41: 58mm, 80mm, a5, a4; ~136 thiếu khổ → rơi về 'a5'; ~494 hàng nút
       chọn khổ); client/src/pages/InvoiceSettings.jsx (~44 default_size "a5"; ~858–866 ô "Khổ mặc định"); client/src/utils/inPhieu.js
       (~17 KHO_BILL — CHỈ đổi danh sách khổ của loại `bill`; ~26 khổ bill mặc định 'a5'; KHO_PHIEU / KHO_TEM và loại pha_che, tem GIỮ
       nguyên); InvoicePreview.jsx (~241 nhánh A5/A4).
       Máy chủ seed invoice_default_size = 'a5' (database.js ~1161) — dữ liệu thật có thể đang lưu 'a5'.
     - Phiếu kho (Kho/XemPhieu.jsx "In A4"), InPhieu.jsx (KHO_GIAY có a5 / a4 cho phiếu), phiếu pha chế, tem 40x30 KHÔNG thuộc việc này.
     Báo cáo cho chủ quán theo LUAT §8. -->

## Mục tiêu
Nhân viên cấp được mã đăng nhập App cho một SĐT chưa là khách (để khách tự đăng ký 3 bước trên App). Mọi chỗ chọn khổ HOÁ ĐƠN KHÁCH chỉ còn
khổ nhiệt (58mm, 80mm); phiếu kho / pha chế giữ nguyên lựa chọn khổ.

## Nghiệm thu
- A **Mã cho số mới:** màn Khách hàng có một ô gọn "Mã đăng nhập App cho số mới": nhập SĐT → bấm → dùng lại đúng `MaDangNhapApp` (mã 6 số +
  đếm ngược) gọi POST /kh/cap-ma. SĐT sai dạng → báo ngay, không gọi máy chủ (cùng hàm chuẩn hoá SĐT quầy đang dùng). KHÔNG tạo khách, KHÔNG
  đổi máy chủ, KHÔNG đổi hợp đồng /api/kh. Người không có quyền (`canCauHinhKhach` từ chối) thấy đúng lời báo của máy chủ.
- B **Bỏ A4 / A5 của hoá đơn khách:** InvoicePrint, InvoiceSettings ("Khổ mặc định"), loại `bill` trong inPhieu.js, InvoicePreview chỉ còn
  58mm / 80mm; lựa chọn khổ của phiếu pha chế / tem / phiếu kho KHÔNG đổi. Giá trị cũ đã lưu
  ('a5', 'a4', rỗng, lạ) → đọc ra **80mm** ở MỘT hàm dùng chung (không sửa dữ liệu, không sửa máy chủ). Bỏ hẳn cấu hình / nhánh A4 / A5
  của hoá đơn khách nếu bỏ gọn được; không thì ẩn — kế hoạch trong trang_thai ghi rõ đã chọn cách nào.
- D **Nối bài KH-SP-1 vào bộ kiểm:** `cong_cu/thu_KHSP1.js` (KH-SP-1 đã gộp) chưa có trong kiem_tra_truoc_khi_giao.js — thêm một dòng
  `chayBaiThat('cong_cu/thu_KHSP1.js')` (chat phát hiện 31.10); npm test phải chạy nó.
- C **K5:** in hoá đơn 2 tờ HD-1, in lại ở Đơn hàng, tem, phiếu pha chế, phiếu kho (mọi khổ phiếu GIỮ), nút "Mã đăng nhập App" trong chi tiết khách
  chạy y như cũ.

## Phạm vi
- viec/KH-QUAY-2/**
- client/src/pages/Customers.jsx
- client/src/components/MaDangNhapApp.jsx
- client/src/components/MaAppSoMoi.jsx
- client/src/components/InvoicePrint.jsx
- client/src/components/InvoicePreview.jsx
- client/src/pages/InvoiceSettings.jsx
- client/src/utils/**
- client/dist/**
- cong_cu/thu_KHQUAY2.js
- cong_cu/thu_KHQUAY1.js
- cong_cu/thu_HD1.js
- cong_cu/thu_P16.js
- cong_cu/thu_BH1.js
- cong_cu/thu_BH2.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHQUAY2.js` ĐỎ trên code gốc: màn Khách hàng có ô cấp mã cho số mới dùng MaDangNhapApp (đọc nguồn); POST /kh/cap-ma với SĐT
chưa là khách → 200 mã 6 số và bảng khách KHÔNG thêm dòng; hàm khổ hoá đơn: 'a5' / 'a4' / rỗng / lạ → '80mm', '58mm' giữ; không còn lựa
chọn A4 / A5 cho hoá đơn khách ở InvoicePrint, InvoiceSettings, loại bill của inPhieu; khổ phiếu pha chế / tem giữ nguyên (đọc nguồn, bắt
theo hành vi — không chỉ một tên biến).

## Ngân sách
~60 dòng giao diện + ~120 dòng thử.
**Phương án đơn giản nhất đã xét:** một thành phần nhỏ bọc MaDangNhapApp + một hàm chuẩn khổ dùng chung; không đổi máy chủ.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- KHÔNG sửa máy chủ, hợp đồng /api/kh; KHÔNG tạo khách khi cấp mã; KHÔNG lưu mã ở đâu ngoài state thành phần.
- KHÔNG đổi nội dung / bố cục hoá đơn 2 tờ HD-1, tem, phiếu kho; KHÔNG bỏ khổ A4 / A5 của bất kỳ loại PHIẾU nào.
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/KH-QUAY-2`. Không đụng main, không merge,
  không tạo PR.
