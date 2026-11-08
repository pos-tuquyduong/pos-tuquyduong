# TINGEE-1 — Thêm cổng QR Tingee (báo tiền về qua Webhook), công tắc CONG_QR=tingee, giữ nguyên mọi luật chống trùng / sai tài khoản

<!-- Phiếu do chat soạn 05.11.2026 (bàn 32). Việc [T] (tiền) — Opus, lập kế hoạch rồi DỪNG chờ duyệt. LÀM sau khi CK-NOIDUNG-1 gộp (cùng sửa
     congQr.js, thanh-toan.js, giuCho.js, doiSoat.js — Tingee phải hiểu nội dung mới "TQDNOV05 HD0016" / "… APP0016"); lập kế hoạch được ngay.
     Chủ quán chốt 05.11 (chat claude.ai, bàn 32): đổi nhà cung cấp báo tiền về từ SePay sang Tingee (rẻ hơn). Tiền về ĐÚNG tài khoản ngân hàng đang
     dùng với SePay; gói Tingee CÓ Webhook (IPN); Tingee GIỮ NGUYÊN nội dung chuyển khoản; làm thẳng với khoá THẬT (không xin khoá thử) — chủ quán đã gỡ
     Webhook ở SePay. Khoá chỉ ở biến môi trường Render (luật 29.10).
     Tài liệu Tingee (developers.tingee.vn, chat đọc 05.11): gốc API thật https://open-api.tingee.vn (thử https://uat-open-api.tingee.vn); gọi API mang
     header x-client-id, x-request-timestamp (yyyyMMddHHmmssSSS, giờ UTC+7), x-signature (HMAC-SHA512); Webhook POST về URL đối tác khai ở mục
     Developers của app.tingee.vn, header x-signature + x-request-timestamp, chữ ký = HMAC-SHA512(Secret Token, "<timestamp>:<JSON thân>") dạng hex; sự
     kiện PAYMENT_SUCCESS; Tingee gửi lại khi không nhận HTTP 200 (30 giây, 2 phút, 10 phút, 1 giờ, 6 giờ); chống trùng bằng transactionId / mã giao dịch.
     Hiện trạng main f464cea: congQr.js chọn cổng theo CONG_QR ('sepay' | 'payos', mặc định payos); mỗi cổng có daCauHinh() · taoQr() và hàm đọc báo;
     webhook SePay đọc thân THÔ (server/index.js dòng ~69); khoá báo sự kiện có tiền tố cổng ('sepay:<id>'); LY_DO_HAI_CONG / LY_DO_TK_KHAC. -->

**Chờ duyệt kế hoạch:** viết `viec/TINGEE-1/ke_hoach.md` (ghi rõ trường nào của thân Webhook Tingee dùng để khớp: số tiền, nội dung, số tài khoản nhận,
mã giao dịch, giờ; chữ ký tính trên thân thô hay thân đã parse — đọc tài liệu "Webhook Payment Callback"; QR tự dựng VietQR như SePay hay phải tạo qua API
Tingee), commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Khách quét QR ở quầy / App, chuyển khoản; Tingee báo về trong vài giây; POS tự xác nhận đúng phiên như SePay hiện nay. Đổi cổng chỉ bằng một dòng
`CONG_QR` trên Render; trục trặc thì đổi lại SePay / payOS ngay.

## Nghiệm thu
- A **Biến môi trường (chỉ ở Render):** `TINGEE_CLIENT_ID`, `TINGEE_SECRET_TOKEN`, `TINGEE_MOI_TRUONG` (`production` | `uat`, mặc định production theo chủ
  quán), `TINGEE_SO_TK` + `TINGEE_BIN` (tài khoản nhận — cùng tài khoản SePay đang dùng). Không khoá nào ở DB, sao lưu, nhật ký, trả về trình duyệt.
- B **Công tắc:** `CONG_QR=tingee` chọn cổng Tingee (cùng giao diện daCauHinh / taoQr của congQr.js); giá trị cũ ('sepay', 'payos') chạy như cũ. Webhook của
  MỌI cổng luôn mở (phiên tạo trước khi đổi công tắc vẫn chốt được). Cài đặt hiện "Cổng QR: Tingee ✓ / chưa cài ✗" (không hiện khoá).
- C **Webhook Tingee** (`/api/tingee/webhook`, công khai, chỉ tin chữ ký): xác thực x-signature HMAC-SHA512 theo tài liệu, so sánh an toàn thời gian; từ
  chối báo quá cũ / quá xa giờ (kế hoạch nêu ngưỡng); sai chữ ký → 401, không ghi gì. Chỉ PAYMENT_SUCCESS tiền VÀO mới xét. Trả 200 nhanh khi đã ghi
  nhận (kể cả báo lặp) để Tingee không gửi lại vô hạn.
- D **Khớp phiên bằng ĐÚNG luật đang có** (một hàm xuLyTienVe chung — không viết luật riêng cho Tingee): nội dung mới của CK-NOIDUNG-1, đúng số tiền,
  đúng hạn, tiền về muộn / phiên App lỗi → cộng ví theo luật CK-NOIDUNG-1, tài khoản nhận khác `TINGEE_SO_TK` → không chốt, ghi LY_DO_TK_KHAC;
  một báo xử lý MỘT lần (khoá sự kiện 'tingee:<mã giao dịch>'); cùng một khoản báo qua hai cổng → luật "hai cổng" của CK-NOIDUNG-1 (Q6 B: không tự cộng
  ví, CẦN XEM).
- E **Mã giao dịch ngân hàng** (FT… nếu Tingee gửi) lưu vào đơn như SePay (CK-NOIDUNG-1 mục D); Đối soát ghi cổng "Tingee".
- F **Hướng dẫn chủ quán:** kế hoạch ghi địa chỉ Webhook đầy đủ để chủ quán dán vào app.tingee.vn → Developers, và các bước chuyển: cài biến → khai
  Webhook → chuyển thử 2.000đ (đơn thử) → thấy tự xác nhận → mới đặt `CONG_QR=tingee`.
- K5 **Không đổi:** số tiền, cách giữ ví / điểm, nội dung chuyển khoản, cổng SePay / payOS (vẫn dùng được nếu đổi lại công tắc).

## Phạm vi
- viec/TINGEE-1/**
- server/utils/tingee.js
- server/utils/congQr.js
- server/utils/vietQr.js
- server/utils/sepay.js
- server/utils/giuCho.js
- server/utils/doiSoat.js
- server/routes/thanh-toan.js
- server/routes/settings.js
- server/index.js
- client/src/**
- client/dist/**
- cong_cu/thu_TINGEE1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_TINGEE1.js` ĐỎ trên code gốc, chạy với thân Webhook giả đúng dạng tài liệu Tingee (không gọi Tingee thật): CONG_QR=tingee dựng QR đúng
tài khoản + nội dung; báo đúng chữ ký → chốt đúng phiên; sai chữ ký / thiếu header / báo quá cũ → 401 không ghi; báo lặp (Tingee gửi lại) → một lần; tài
khoản khác → không chốt; tiền về muộn / phiên App lỗi → theo luật CK-NOIDUNG-1; cùng khoản báo qua SePay + Tingee → không cộng ví hai lần; khoá không lộ
ra trình duyệt / nhật ký.

## Ngân sách
~250 dòng máy chủ + ~30 dòng giao diện + ~400 dòng thử.
**Phương án đơn giản nhất đã xét:** một mô-đun `tingee.js` cùng dạng `sepay.js` (cauHinh, daCauHinh, taoQr, docBao, kiemChuKy), gắn vào congQr.js và một
đường webhook đọc thân thô; mọi luật khớp dùng lại xuLyTienVe.

## Đổi cấu trúc DB
không — dùng lại bảng báo sự kiện / phiên hiện có (khoá có tiền tố 'tingee:').

## Thư viện mới
không

## Soát bảo mật
có — webhook tiền vào, khoá bên thứ ba, chống báo lặp / giả mạo.

## Cấm
Không xoá cổng SePay / payOS; không đổi nội dung chuyển khoản (CK-NOIDUNG-1); không gọi Tingee thật trong bài thử.
