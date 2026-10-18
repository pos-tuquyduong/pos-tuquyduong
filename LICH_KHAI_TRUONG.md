# Lịch 14 ngày — cả ba hệ chạy đủ chức năng trước 30.10.2026

<!-- Chủ quán chốt 17.10.2026. File này cho MÁY biết mốc và hạng mục; theo dõi hằng ngày (ai làm gì, đối chiếu) ở file Excel
     LICH_KHAI_TRUONG.xlsx của chủ quán. Chat cập nhật file này khi mốc / hạng mục đổi. Luật xây app ở LUAT_XAY_APP.md.
     [T] = việc tiền / bảo mật (có "Chờ duyệt kế hoạch") · [Th] = việc thường (chạy thẳng tới hết).
     18.10: M1 xong (LUOI-5 #32, TU-CHAY-8 #33); đăng nhập App KH = SĐT + mã OTP qua Zalo ZNS → thêm KH-OTP-1 (M4). -->

## Mốc
| Mốc | Hạn | Phải xong |
|---|---|---|
| M1 | CN 18.10 | LUOI-5, TU-CHAY-8 gộp — bộ khung 1.8.0 đóng băng tới khai trương |
| M2 | T4 21.10 | DOI-SOAT-1 · P26d · KH-API-1 · P16 · S5 (SX) |
| M3 | T7 24.10 | P22-23 · KH-UI-1 · P15-QR |
| M4 | T3 27.10 | P24 · KH-DON-1 · KH-UI-2 · KH-OTP-1 · P3 (nếu payOS + Render trả phí sẵn) · P17 (nếu có máy in) |
| M5 | T6 30.10 | AUDIT-KH · X1 · H4 · H5 · sửa lỗi tồn → **ĐỦ CHỨC NĂNG** |
| — | 31.10 → khai trương | Chạy thử với nhân viên: chỉ sửa lỗi, không thêm tính năng |

## Hạng mục
| Mã | Việc | Hệ | Loại | Mốc |
|---|---|---|---|---|
| S5 | Hạn dùng thành thật: không bán lô hết hạn, màn xử lý lô hết hạn | SX | [T] | M2 |
| DOI-SOAT-1 | Màn Đối soát tiền ngày/tuần/tháng — chạy bất biến trên dữ liệu thật, chỉ đọc | POS | [T] | M2 |
| P26d | Turso chịu tải: BEGIN bận thử lại có giới hạn, mã lỗi thật, mã đơn trong giao dịch | POS | [T] | M2 |
| KH-API-1 | Cổng khách `/api/kh`: đăng nhập SĐT + mã OTP (chưa cắm Zalo → lấy mã tại quầy), menu + giá + còn hàng, điểm, voucher, nhận mã bill, lịch sử đơn của mình | POS | [T] | M2 |
| P16 | Xem trước & cài đặt in: bill, tem cốc, phiếu pha chế | POS | [Th] | M2 |
| P22-23 | Điểm chỉ cộng khi thu đủ (pay-debt cùng giao dịch); chặn mua gói / thẻ chưa thu đủ | POS | [T] | M3 |
| KH-UI-1 | App KH đợt 1 theo demo chủ quán: menu, đăng ký / đăng nhập, nhận mã bill, điểm, voucher, lịch sử, hồ sơ, QR thành viên | App KH | [Th] | M3 |
| P15-QR | QR thành viên thật + quầy tìm / quét khách | POS | [T] | M3 |
| P24 | Huỷ đơn trừ lại điểm (cho phép âm), sửa bất biến I8 | POS | [T] | M4 |
| KH-DON-1 | Đặt đơn từ App KH (trả tại quầy) qua đúng đường tạo đơn của quầy + chuông báo ở quầy | POS | [T] | M4 |
| KH-UI-2 | App KH: giỏ, đặt đơn, theo dõi đơn | App KH | [Th] | M4 |
| KH-OTP-1 | Gửi mã OTP thật qua Zalo ZNS (bên dịch vụ của chủ quán) — cắm vào chỗ gửi mã của KH-API-1 | POS | [Th] | M4 |
| P3 | QR thanh toán payOS (quầy + App KH) | POS | [T] | M4 |
| P17 | Hàng đợi in + trạm in (máy bill 80mm, máy tem 40×30) | POS | [Th] | M4 |
| AUDIT-KH | Rà bảo mật App KH: đọc chéo dữ liệu khách, đoán mã, dồn yêu cầu, token | POS | [T] | M5 |
| X1 · H4 · H5 | Đo tải · dọn dữ liệu thử · chạy lại 3 bộ dò | cả ba | — | M5 |

## Dự phòng
- payOS chậm → mở quán với QR chuyển khoản tĩnh; P3 bật sau.
- Máy in về muộn → P17 trên bản xem trước; in thật trong tuần chạy thử.
- Việc [T] trễ → dùng 29–30.10; vẫn trễ thì dời ĐÚNG hạng mục đó, không dời mốc.
- KH-DON-1 chưa đạt 27.10 → App KH mở với đợt 1; đặt đơn bật sau.

## Dời sau khai trương
AUDIT-5 · TU-CHAY-9 · DONG-GOI-1 · P13a–e · P7–P9 · P14 · P18 · P20d · P25 · MA-GIAM-2 · S1 · S3 · TIET-KIEM-1 · DON-DEP-v1
