# BH-CKTAY-1 — trạng thái

## Đồng bộ đầu phiên
HEAD = FETCH_HEAD = c0e8af8 (không kéo thêm).
```
c0e8af8 PHIEU: BH-CKTAY-1
97d1de2 TIEN-DO: KH-API-3 (a95634f), KHACH-CK-1 (4b52370) xong; mo KH-MUA-1, KHO-2b, KH-SP-1, BH-CKTAY-1; quyet dinh 31.10 (bo giam tay, dat don App vi+QR); luat 6.9 — so v49
4b52370 Merge pull request #55 from pos-tuquyduong/viec/KHACH-CK-1
```

## Bảng "chỗ vá → đột biến" (14 đột biến, đều BẮT; chạy `python3 viec/BH-CKTAY-1/dot_bien.py`)
| Chỗ vá (Sales.jsx) | Đột biến |
|---|---|
| ô nhập Chiết khấu (select % / đ + input) | BV-O-NHAP |
| nhánh tính giảm tay (`discountAmount`) | BV-NHANH-GIAM-TAY, BV-NHANH-PHAN-TRAM, VS-NHANH-TEN-KHAC, VS-MAN-BO-MA |
| state `discount` / `discountType` / `discountValue` | BV-STATE |
| thân đơn `discount_type` / `discount_value` / `discount` | BV-THAN-LOAI, BV-THAN-MUC, VS-THAN-LOAI-UNDEFINED, VS-THAN-GIAM-LA-SO-MAN, VS-THAN-MUC-HANG-SO, VS-THAN-MA-BI-CHAN, VS-THAN-LOAI-MA-BI-CHAN |
| ca F3a của thu_KHACHCK1 | BV-F3A-THAN |

## Soát độc lập (`/ra-soat`) — vòng 1: KHÔNG ĐẠT
- Lỗi 1: `thu_BHCKTAY1.js` chưa nối vào `kiem_tra_truoc_khi_giao.js` (K6, bài mồ côi) → ĐÃ SỬA: thêm `chayBaiThat('cong_cu/thu_BHCKTAY1.js')` (chỉ THÊM, không đụng phép khác).
- Lỗi 2: A1–A3 chỉ bắt theo tên biến; state tên khác (`giamTay`) vẫn xanh (K3) → ĐÃ SỬA: ca A5 kiểm khối tính giảm (một phép gán, không else) + đột biến VS-NHANH-TEN-KHAC (đỏ trên gốc, BẮT).
- Nghi ngờ: dòng "Giảm giá" ở màn thanh toán (Sales.jsx ~1674) trước dùng `discount` luôn 0 nên không hiện; nay dùng `discountAmount` nên HIỆN với đơn có mã. Đúng nghiệm thu A, nhưng là đổi hiển thị thật → chủ quán nhìn thử 1 đơn có mã.
- Vòng soát 2: chưa chạy (còn 2 vòng).

## Nghiệm thu — mỗi mục một dòng
- A: thu_BHCKTAY1 A1–A5 (đỏ trên gốc c0e8af8, xanh sau vá) + thu_KHACHCK1 F3a.
- B: thu_BHCKTAY1 B1–B3 (B2 chạy biểu thức orderData thật; B3 = K5 có mã vẫn gửi) + thu_BH1 I10/I11 xanh trong npm test.
- C: thu_BHCKTAY1 C1–C2 (đơn thật POST /orders, tổng lưu = tinh-thu = 100.000).
- D: không sửa ô mã, phí, hạng, Giờ vàng, thanh toán, in (chỉ xoá ô giảm tay + đổi dòng Giảm giá); bằng chứng gián tiếp: thu_BH1, thu_UUDAI1, thu_P26b/c xanh trong `npm test`. Không có ca giao diện riêng.

## Báo cáo
```
VIỆC:        BH-CKTAY-1 — Bỏ hẳn ô "Chiết khấu" giảm tay ở màn Bán hàng cũ
ĐÃ SỬA:      client/src/pages/Sales.jsx — xoá state discount/discountType/discountValue, nhánh tính giảm tay, ô nhập; thân đơn không mã gửi discount 0 / type null / value 0 (giữ đủ khoá); dòng Giảm giá ở màn thanh toán dùng discountAmount. client/dist build lại. cong_cu/thu_KHACHCK1.js — ca F3a đổi theo hành vi mới. cong_cu/thu_BHCKTAY1.js (mới, 11 ca). kiem_tra_truoc_khi_giao.js — thêm 1 dòng chayBaiThat.
BÀI THỬ:     chạy trên bản chưa vá c0e8af8 → ĐỎ ở A1, A2, A3, A5, B2 (thu_BHCKTAY1) và F3a (thu_KHACHCK1); sau khi vá → XANH (11/11, 37/37). Đột biến 14/14 BẮT. npm test PASS 84 · FAIL 0 · CẢNH BÁO 1 (route GET có lệnh ghi — có từ trước).
ĐÃ RÀ K4:    grep "discount" trong Sales.jsx → không còn setDiscount(/discountType/discountValue/value="fixed"/discount > 0; còn discount: 0 (thân đơn) và result.order.discount (dữ liệu máy chủ trả) — đúng. Toàn client/src: không file nào khác ghi giảm tay.
CHƯA KIỂM:   giao diện thật trên điện thoại/trình duyệt (ô mã, phí ship, tiền khách đưa/trả lại, in hoá đơn) — máy không chạy màn hình; dòng "Giảm giá" ở màn thanh toán nay HIỆN với đơn có mã, chưa có bài thử riêng; kế hoạch chưa qua agent phụ riêng (chỉ qua /ra-soat); state giảm tay tên khác gắn vào chỗ KHÁC khối discountAmount (vd cộng thẳng vào total) không bị A5 bắt.
GIT:         xem git log --oneline -2 ở cuối file.
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 0 · BỎ 0 — xem ## Bài học
```
Thử tay 1–3 thao tác cho chủ quán: (1) mở màn Bán hàng cũ, thêm món — xác nhận KHÔNG còn ô "Chiết khấu" (chỉ còn ô Mã giảm giá và Phí vận chuyển); (2) nhập 1 mã giảm hợp lệ, bấm thu — màn thanh toán hiện dòng "Giảm giá" và tổng khớp; (3) bán 1 đơn không mã — lưu được, không báo tổng lệch.

## Bài học
- KHOÁ 1 (đã làm): nối bài mới vào bộ kiểm — bài thử không nối vào `kiem_tra_truoc_khi_giao.js` là bài mồ côi (người soát bắt). Đã thêm dòng chayBaiThat; ca đỏ trước = cả bài đỏ trên gốc.
- KHOÁ 2 (đã làm): ca A5 kiểm HÀNH VI khối tính giảm (một phép gán, không else) chứ không theo tên biến; đột biến VS-NHANH-TEN-KHAC đỏ tất định.
- NGUYÊN TẮC 0: bài kiểm "vắng mặt" phải có đột biến dùng TÊN KHÁC — đã nằm trong K3 ("đột biến nới phép / tên riêng"), không mở mục mới.
- BỎ 0.
- Đề xuất ngoài Phạm vi: không.
