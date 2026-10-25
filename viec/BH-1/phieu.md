# BH-1 — Màn Bán hàng mới, đợt 1: giao diện trên API sẵn có, chạy SONG SONG màn cũ (mặc định tắt)

<!-- Phiếu do chat soạn 25.10.2026. Việc thường [Th] — Sonnet, chạy thẳng. Nền: main `5cb2a03` (QUAY-AN-1 đã gộp: màn cũ chỉ còn tiền
     mặt / chuyển khoản / số dư). Đặc tả: ban_mau_pos/DAC_TA_BAN_HANG_2410.md (đọc HẾT) + logic mẫu ban_mau_pos/demo_2410/logic_ban_hang.js
     (JS thuần, dữ liệu giả — đọc để hiểu luồng, KHÔNG chép nguyên). Chủ quán đã duyệt demo 22–24.10, đừng hỏi lại bố cục.
     Đợt 1 CHỈ dùng API đang có (sản phẩm, khách, hạng, mã giảm giá, POST /orders như Sales.jsx gửi hôm nay). Phần cần API mới làm ở BH-2
     sau khi việc tiền gộp: QR payOS + PIN + giữ tiền (P3), giá hạng / cộng dồn chuẩn máy chủ (UUDAI-1), topping + ghi chú theo sản phẩm
     (TOPPING-1), đổi điểm trong phiên (P3b), giao hàng ở quầy (GIAO-1), hoá đơn + tem mới (HD-1).
     Màn cũ `Sales.jsx` KHÔNG đổi: quầy vẫn bán bằng màn cũ cho tới khi chủ quán bật màn mới trên từng máy. -->

## Mục tiêu
Có màn Bán hàng mới chạy được trên điện thoại và máy tính bảng, đúng bố cục chủ quán duyệt, bán được đơn thật bằng tiền mặt / chuyển
khoản (như màn cũ) — để chủ quán và nhân viên tập trước, đợt 2 chỉ cắm thêm API.

## Nghiệm thu
- A Công tắc theo MÁY: "Màn bán hàng mới" (bật / tắt, mặc định TẮT) + "Kiểu màn hình: Tự động / Điện thoại / Máy tính bảng" lưu localStorage
  (bọc try/catch, hỏng thì coi như tắt / Tự động). Tắt → trang chủ là `Sales.jsx` y như hôm nay.
- B Tự theo màn hình: hẹp hơn 600 px → hai trang Món ↔ Giỏ (thanh "Xem giỏ · N món · tiền" ở đáy, nút "← Thêm món"); rộng hơn → lưới
  món trái, cột giỏ phải. Xoay máy tính bảng đổi theo.
- C Thanh khách ngay trên màn (không bước riêng, không khoá lưới): ô "Khách quen? Gõ SĐT / tên — trống = khách lẻ" gợi ý từ API khách hiện có,
  nút Quét thẻ dùng `QrScanModal` sẵn có; chọn xong thành dải tên · hạng · tài khoản · điểm + nút Đổi. Khách lẻ không cần chạm gì.
- D Giá hạng HIỂN THỊ: chọn khách có hạng → lưới, giỏ hiện giá gốc gạch ngang + giá hạng (lấy % hạng từ API hiện có); số tiền gửi lên và
  tổng phải trả vẫn theo máy chủ trả về / theo đúng cách Sales.jsx tính hôm nay (không công thức mới).
- E Khung chọn món (khung nổi / trượt từ đáy): ghi chú nhanh + ô tự gõ + số ly + "Thêm vào giỏ · <giá>"; chạm dòng giỏ mở lại để sửa / xoá.
  Đợt 1 ghi chú nhanh lấy danh sách MẶC ĐỊNH theo nhóm sản phẩm (hằng trong một file, ghi chú "TOPPING-1 thay bằng cài đặt theo sản phẩm").
- F Thu tiền: dãy tờ ("Đúng tiền" + tờ lớn hơn số phải trả, ghi sẵn "trả lại …"), nút "Số tiền khác…" mở bàn phím số có phím 000, báo
  "Trả lại …" / "Còn thiếu …", "Đã nhận tiền" chỉ sáng khi đủ; nút Chuyển khoản như màn cũ (đợt 2 thay QR payOS). Trừ số dư: như màn cũ.
  Dùng chữ "trả lại", không "thối". Không có Ghi nợ / Chưa thu / mang ra bàn.
- G Màn kết thúc "Đã thanh toán · đơn #<số>": ô "Trả lại khách" chữ to (tiền mặt), xem hoá đơn bằng thành phần in hiện có, nút In; lưới món
  khoá tới khi bấm In; "Đơn mới" hoặc chạm món là đơn mới.
- H Phép tính thuần (trả lại, còn thiếu, danh sách tờ, giá hạng hiển thị, tách trang theo độ rộng) ở MỘT file `tinh.js`, có bài thử.
- I K5: bật màn mới bán xong 4 ca (tiền mặt đúng tiền, tiền mặt số khác, chuyển khoản, khách quen trừ số dư một phần) → đơn trong Lịch sử
  đơn y như đơn từ màn cũ; tắt công tắc → màn cũ chạy như cũ.

## Phạm vi
- viec/BH-1/**
- client/src/pages/BanHang/**
- client/src/App.jsx
- client/dist/**
- cong_cu/thu_BH1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — bài mới `cong_cu/thu_BH1.js` cho các hàm thuần trong `client/src/pages/BanHang/tinh.js` (khuôn `thu_KHUI1.js`) phải ĐỎ trên code gốc.

## Ngân sách
~900 dòng giao diện (file mới) + `tinh.js` ~120 + bài thử ~200. `App.jsx`: chỉ đổi phần tử của route trang chủ (chọn màn theo công tắc).
`kiem_tra_truoc_khi_giao.js`: chỉ thêm tên `cong_cu/thu_BH1.js` vào cuối mảng bài chạy thật.
**Phương án đơn giản nhất đã xét:** thư mục mới, gọi đúng API và đúng payload như Sales.jsx; không sửa Sales.jsx, không sửa máy chủ.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- KHÔNG sửa `client/src/pages/Sales.jsx`, `server/**`, `app_kh/**`.
- KHÔNG làm phần của BH-2 (payOS, PIN, giữ tiền, topping, đổi điểm, giao hàng, hoá đơn mới).
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/BH-1`. Không đụng main, không merge, không tạo PR.
