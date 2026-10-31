# SEPAY-1 — Thanh toán QR qua SePay, đủ chức năng như payOS (quầy + App), payOS giữ làm dự phòng bật bằng công tắc

<!-- Phiếu do chat soạn 31.10.2026. Việc [T] (tiền) — Opus làn 1, lập kế hoạch, DỪNG chờ duyệt. Nền: main sau sổ v51 (KH-MUA-1 #60 đã gộp).
     Chủ quán chốt 31.10 (QUYET_DINH_CHU_QUAN.md mục Tiền): chuyển sang SePay vì phí thấp hơn, ĐỦ chức năng như payOS: quầy hiện QR → tiền về tự
     chốt đơn; QR hết hạn 10 phút; huỷ; xác nhận tay; ví + QR; đơn App trả QR (KH-MUA-1); tiền về muộn / lệch → Đối soát. payOS GIỮ trong code,
     bật lại bằng một công tắc (biến môi trường), không xoá.
     Khác payOS (chat đọc tài liệu SePay 31.10 — máy ĐỌC LẠI tài liệu developer.sepay.vn trước khi lập kế hoạch, không tin trí nhớ):
     - SePay KHÔNG tạo lệnh thu: POS tự dựng chuỗi VietQR (chuẩn EMVCo / NAPAS: mã BIN ngân hàng, số tài khoản, số tiền, nội dung = mã phiên
       `TQD<id>` sẵn có) → không gọi mạng khi tạo QR.
     - SePay theo dõi tài khoản ngân hàng đã liên kết và gửi webhook (POST) cho MỌI giao dịch (cấu hình lọc: chỉ tiền vào, bỏ qua giao dịch không
       có mã thanh toán). Xác thực: chủ quán sẽ chọn HMAC-SHA256 (khoá bí mật; chữ ký + mốc giờ ở header) — từ chối báo cũ quá 5 phút. Chống
       trùng theo mã giao dịch SePay. SePay gửi lại tối đa nhiều lần khi máy chủ không trả 2xx đúng dạng tài liệu yêu cầu.
     - Khách sửa / xoá nội dung chuyển khoản → không khớp phiên → ghi lại cho Đối soát (như "tiền về không thuộc phiên nào"), quầy xác nhận tay.
     Hiện trạng chat đọc 31.10 trên main 596c346:
     - server/utils/payos.js (52 dòng: daCauHinh, kiemChuKy, taoLink → { qr, checkout_url }); server/utils/giuCho.js taoPhien (~34 CACH gồm
       'payos'; ~64 nội dung `TQD<id>` ≤ 9 ký tự; ~72–83 gọi payos.taoLink, lỗi → 502 PAYOS_LOI); chotPhien (~87, MỌI lối chốt qua đây).
     - Webhook: server/routes/thanh-toan.js ~111 (`/api/payos/webhook`, server/index.js ~126): kiểm chữ ký → ghi MỖI báo một dòng
       pos_payos_su_kien (khoa UNIQUE) → khop / chua_khop (lệch tiền, về sau hết hạn, đã xác nhận tay) / khong_phien / that_bai → chotPhien.
       Màn Đối soát đọc pos_payos_su_kien (utils/doiSoat.js).
     - App KH (hợp đồng v5): `cach_tra: qr` → `qr { chuoi, het_han }`; mã lỗi `PAYOS_CHUA_CAU_HINH` 503, `PAYOS_LOI` 502 — GIỮ tên mã (App đã
       làm theo), chỉ đổi câu `error`; SePay không gọi mạng khi tạo QR nên gần như không còn 502.
     - Giao diện: client/src/pages/BanHang/** hiện `qr` (vẽ bằng utils/veQr.js) — chuỗi VietQR tự dựng vẽ được y như chuỗi payOS. MANKHACH-1
       (song song) sửa BanHang/ManQr.jsx để đẩy QR lên màn khách — việc này KHÔNG sửa giao diện trừ chữ "payOS" hiện cho người dùng.
     Báo cáo cho chủ quán theo LUAT §8. -->

**Chờ duyệt kế hoạch:** viết `viec/SEPAY-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Quầy và App thu tiền QR qua SePay với đúng hành vi đang có của payOS; đổi lại payOS chỉ bằng một biến môi trường.

## Nghiệm thu
- A **Công tắc:** biến môi trường chọn cổng QR (`sepay` | `payos`); thiếu khoá của cổng đang chọn → 503 `PAYOS_CHUA_CAU_HINH` như cũ. Một chỗ
  duy nhất chọn cổng (không rải `if sepay` khắp nơi).
- B **Tạo QR (SePay):** chuỗi VietQR đúng chuẩn (CRC đúng; bài thử giải lại chuỗi ra đúng BIN, số tài khoản, số tiền = `con_lai`, nội dung
  `TQD<id>`), không gọi mạng; `het_han` như cũ.
- C **Webhook SePay** (đường công khai mới): sai / thiếu chữ ký, mốc giờ quá 5 phút → từ chối, không ghi gì; đúng → MỖI giao dịch một dòng
  pos_payos_su_kien (chống trùng theo mã giao dịch SePay); tiền ra / không có mã / mã không thuộc phiên → ghi `khong_phien`, trả đúng dạng
  SePay coi là đã nhận; khớp phiên + đúng số + chưa hết hạn → chotPhien (đơn thật, chuông đơn App như cũ); lệch số / về sau hết hạn / đã xác
  nhận tay → `chua_khop` đúng câu như payOS. Lỗi máy (5xx) / KHO_BAN → trả lỗi để SePay gửi lại, chưa ghi gì.
- D **Đối soát:** màn Đối soát hiện tiền SePay y như payOS (cùng bảng, cùng loại dòng); dòng có nguồn (`sepay` / `payos`).
- E **Không đổi:** ví + QR, huỷ, xác nhận tay, hết hạn, đơn App (`qr`, `tien_ve_cho_doi_soat`), hoàn, đối soát cũ — bài thử P3, BH-2, KH-MUA-1,
  hợp đồng xanh cả khi chạy cổng `payos` lẫn `sepay`.
- F **Hướng dẫn cài:** `viec/SEPAY-1/cai_dat_sepay.md` — biến môi trường cần điền ở Render (tên, ý nghĩa — KHÔNG giá trị), địa chỉ webhook,
  cài đặt trên trang SePay (HMAC-SHA256, chỉ tiền vào, bỏ qua giao dịch không mã, tiền tố mã `TQD`), cách thử đơn 2.000đ, cách quay về payOS.

## Phạm vi
- viec/SEPAY-1/**
- server/utils/payos.js
- server/utils/sepay.js
- server/utils/vietQr.js
- server/utils/congQr.js
- server/utils/giuCho.js
- server/utils/doiSoat.js
- server/routes/thanh-toan.js
- server/index.js
- env.example
- cong_cu/thu_SEPAY1.js
- cong_cu/thu_P3.js
- cong_cu/thu_BH2.js
- cong_cu/thu_KHMUA1.js
- cong_cu/thu_DOISOAT1.js
- cong_cu/thu_HOPDONG_KH.js
- HOP_DONG_API_KH.md
- client/src/pages/BanHang/ThuTien.jsx
- client/dist/**
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_SEPAY1.js` ĐỎ trên code gốc: chuỗi VietQR giải ra đúng trường + CRC; webhook sai chữ ký / quá hạn mốc giờ → từ chối, bảng không
đổi; giao dịch khớp → đơn thật một lần (báo lặp cùng mã giao dịch → không chốt lần hai); tiền ra / không mã → khong_phien; lệch số → chua_khop;
về sau hết hạn → chua_khop; đã xác nhận tay → chua_khop "KHÔNG hoàn"; vi_qr qua SePay chốt đúng; công tắc payos → hành vi cũ nguyên vẹn.

## Ngân sách
~250 dòng máy chủ + ~20 dòng giao diện + ~400 dòng thử.
**Phương án đơn giản nhất đã xét:** một lớp "cổng QR" (tạo QR + kiểm báo) với hai cài đặt payOS / SePay; phiên, chốt, đối soát dùng nguyên.

## Đổi cấu trúc DB
không (dùng lại pos_phien_thanh_toan, pos_payos_su_kien; nếu cần cột nguồn → chỉ THÊM, bước 008, ghi lý do trong kế hoạch).

## Thư viện mới
không

## Cấm
- KHÔNG đổi cách tính tiền, phiên, chốt, hoàn, ví, điểm; KHÔNG xoá payOS.
- KHÔNG đổi tên mã lỗi / trường của hợp đồng App (chỉ câu `error`).
- KHÔNG ghi khoá / số tài khoản thật vào code, file, nhật ký, bài thử.
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/SEPAY-1`. Không đụng main, không merge,
  không tạo PR.
