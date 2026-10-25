# Lịch 14 ngày — cả ba hệ chạy đủ chức năng trước 30.10.2026

<!-- Chủ quán chốt 17.10.2026. File này cho MÁY biết mốc và hạng mục; theo dõi hằng ngày (ai làm gì, đối chiếu) ở file Excel
     LICH_KHAI_TRUONG.xlsx của chủ quán. Chat cập nhật file này khi mốc / hạng mục đổi. Luật xây app ở LUAT_XAY_APP.md.
     [T] = việc tiền / bảo mật (có "Chờ duyệt kế hoạch") · [Th] = việc thường (chạy thẳng tới hết).
     18.10: M1 xong (LUOI-5 #32, TU-CHAY-8 #33); đăng nhập App KH = SĐT + mã OTP qua Zalo ZNS → thêm KH-OTP-1 (M4).
     22.10: M2 xong phía POS (KH-API-1 #34, P16 #35, P26d #36, DOI-SOAT-1 #37); S5 (SX) còn mở — chủ quán chốt làm TRƯỚC khai trương.
     22.10 (tối): M3 xong sớm 2 ngày — P22-23 #38, KH-QUAY-1 #39, P15-QR #40, KH-UI-1 #41 (main bd9b920). SX làm ĐÚNG cách của POS.
     22–24.10: chủ quán chốt MÀN BÁN HÀNG MỚI (ban_mau_pos/DAC_TA_BAN_HANG_2410.md) và yêu cầu XONG TRƯỚC KHAI TRƯƠNG (không dời):
     không công nợ, không "mang ra bàn", payOS tự xác nhận, PIN + giữ tiền, giá hạng, topping qua SX, hoá đơn + tem tuỳ chỉnh, giao hàng ở quầy.
     25.10: QUAY-AN-1 #42, P24 #43 xong (main 5cb2a03). P3 duyệt (tách P3b — điểm trong phiên). Mở DIEM-THAT-1 + BH-1 (đợt 1, chạy song
     song màn cũ, mặc định tắt); thêm P3b, BH-2 (đợt 2: cắm payOS / PIN / topping / đổi điểm / giao hàng / hoá đơn mới vào màn mới).
     Mã việc KHÔNG chứa "-d" / "-f" (kể cả hoa — luật chặn push): KH-DON-1 → KH-MUA-1, HOP-DONG-1 → HOPDONG-1. -->

## Mốc
| Mốc | Hạn | Phải xong |
|---|---|---|
| M1 | CN 18.10 | LUOI-5, TU-CHAY-8 gộp — bộ khung 1.8.0 đóng băng tới khai trương (xong) |
| M2 | T4 21.10 | DOI-SOAT-1 · P26d · KH-API-1 · P16 (xong 22.10) · S5 (SX → tách S5a/S5b) |
| M3 | T7 24.10 | P22-23 · KH-UI-1 · KH-QUAY-1 · P15-QR (xong 22.10) |
| M4 | T3 27.10 | QUAY-AN-1 · P24 (xong 25.10) · P3 · DIEM-THAT-1 · UUDAI-1 · BH-1 · KH-UI-2 · KH-OTP-1 · P17 (nếu có máy in) · **SX: SX-KHUNG-1 · HOPDONG-1 · SX-BACKUP-1 · S5a** |
| M5 | T6 30.10 | TOPPING-1 · P3b · BH-2 · HD-1 · P15 (mã điểm + QR đăng ký) · KH-MUA-1 · GIAO-1 · AUDIT-KH · S1 (nhóm lộ) · S5b · X1 · H4 · H5 → **ĐỦ CHỨC NĂNG**. 29–30.10 chỉ sửa lỗi |
| — | 31.10 → khai trương | Chạy thử với nhân viên: chỉ sửa lỗi, không thêm tính năng |

## Hạng mục
| Mã | Việc | Hệ | Loại | Mốc |
|---|---|---|---|---|
| P22-23 · KH-UI-1 · KH-QUAY-1 · P15-QR | (xong 22.10, PR #38–#41) | POS / App KH | — | M3 |
| QUAY-AN-1 | Màn Bán hàng HIỆN TẠI: ẩn nút "Ghi nợ" + "Chưa thu" (nhân viên tập đúng từ đầu); nợ cũ vẫn thu ở Lịch sử đơn | POS | [Th] | M4 |
| P24 | Huỷ đơn trừ lại điểm đã cộng (cho phép âm, ghi thêm không xoá), sửa bất biến I8 | POS | [T] | M4 |
| P3 | Chuyển khoản qua QR payOS, máy chủ tự xác nhận (quầy + App KH); PIN khách; GIỮ tiền tài khoản / điểm rồi trừ khi đơn xong; xác nhận tay có lý do | POS | [T] | M4 |
| DIEM-THAT-1 | Điểm chỉ tính trên tiền khách trả thật (tiền mặt / chuyển khoản), không tính phần trừ tài khoản và phí giao; sửa bất biến I8. Chạy SAU P24 (cùng sửa I8) | POS | [T] | M4 |
| UUDAI-1 | Giá hạng hiển thị + áp cả topping; cài đặt mã / quà nào cộng với giảm hạng; không cộng → máy chủ chọn cái lợi hơn | POS | [T] | M4 |
| TOPPING-1 | Cài đặt topping + ghi chú theo từng sản phẩm; giá topping; trừ kho SX (lô, hạn dùng); topping trên giỏ / hoá đơn / tem / hoàn | POS + SX | [T] | M5 |
| BH-1 | Màn Bán hàng mới ĐỢT 1 trên API sẵn có (tự theo màn hình, thanh khách, khung chọn món, tờ tiền + số khác, màn kết thúc); công tắc theo máy, mặc định TẮT — màn cũ vẫn chạy | POS | [Th] | M4 |
| BH-2 | Màn mới ĐỢT 2: cắm QR payOS + PIN + giữ tiền (P3), giá hạng / cộng dồn (UUDAI-1), topping (TOPPING-1), đổi điểm (P3b), giao hàng (GIAO-1), hoá đơn + tem (HD-1); chủ quán bật trên quầy | POS | [Th] | M5 |
| P3b | Giữ / đổi điểm trong phiên thanh toán + PIN cho đổi quà (tách từ P3, chạy sau UUDAI-1) | POS | [T] | M5 |
| HD-1 | Hoá đơn bố cục mới + tuỳ chỉnh chữ hoá đơn & tem (mở rộng màn cài đặt in) | POS | [Th] | M5 |
| P15 | Phần còn lại: mã nhận điểm in chữ + QR đăng ký web KH (mã điền sẵn); PIN đã chuyển sang P3 | POS | [T] | M5 |
| KH-MUA-1 | (đổi tên từ KH-DON-1) Đặt đơn từ App KH, TRẢ TRƯỚC bằng QR payOS; đơn chỉ về quầy (kèm chuông) khi đã trả | POS | [T] | M5 |
| KH-UI-2 | App KH: giỏ, đặt đơn, theo dõi đơn (theo demo chủ quán) | App KH | [Th] | M4 |
| KH-OTP-1 | Gửi mã OTP thật qua Zalo ZNS (bên dịch vụ của chủ quán) | POS | [Th] | M4 |
| P17 | Hàng đợi in + trạm in (máy bill 80mm, máy tem 40×30) | POS | [Th] | M4 |
| GIAO-1 | Giao hàng Ahamove: App + QUẦY (chọn Giao hàng → tính phí → thu đủ → Gọi xe); phí dòng riêng, không giảm / áp mã / tích điểm; lệch phí quán chịu, ghi cho Đối soát | POS | [T] | M5 |
| AUDIT-KH | Rà bảo mật App KH: đọc chéo dữ liệu khách, đoán mã, dồn yêu cầu, token | POS | [T] | M5 |
| X1 · H4 · H5 | Đo tải · dọn dữ liệu thử · chạy lại 3 bộ dò | cả ba | — | M5 |

## Thứ tự chạy máy (hạn mức: tối đa 2 Opus + 2 Sonnet cùng lúc)
Phần lớn việc tiền cùng sửa `server/routes/orders.js`. Hai việc được chạy SONG SONG khi phiếu ghi vùng sửa KHÔNG chồng nhau
(git gộp được hai vùng khác nhau của một file); vùng chồng nhau thì chạy nối tiếp. Script gộp của chat DỪNG nếu đụng nhau; riêng
mảng tên bài thử trong `kiem_tra_truoc_khi_giao.js` (một dòng) thì script gộp tự giữ đủ các tên.
- Opus làn 1: P3 (tạo đơn + thanh toán) → UUDAI-1 (giá) → P3b (điểm trong phiên) → KH-MUA-1 → GIAO-1.
- Opus làn 2: P24 (đường huỷ / xoá + I8) → DIEM-THAT-1 (công thức điểm + I8) → TOPPING-1 → S5a (SX) → S1 (SX).
- Sonnet: QUAY-AN-1 (xong) → BH-1 (đợt 1) ∥ HOPDONG-1 → HD-1 → BH-2 (đợt 2) → KH-UI-2 → SX-BACKUP-1 → S5b.
- Chat soạn phiếu TRƯỚC khi máy rảnh; chủ quán duyệt kế hoạch 2 lần / ngày (NHIP_NGAY_VA_HAN_MUC.md).

## SX — việc tồn trước khai trương (chi tiết ở TIEN_DO_SX.json của kho SX)
Dữ liệu SX là thật (quy mô nhỏ) → dùng đúng khoá an toàn của POS: máy không push / merge / đụng `.env`, bài thử chạy trên kho tạm,
việc [T] duyệt kế hoạch, chủ quán bấm Merge là bước chốt (ở SX, merge `main` = deploy thẳng Railway).

| Mã | Việc | Loại · model | Ai | Hạn |
|---|---|---|---|---|
| BAO-MAT-SX | Kho về riêng tư; đổi `POS_API_KEY` (nằm trong `.replit`) ở Railway + Render; mật khẩu trong file .db cũ (12.2025) còn dùng → đổi | — | Chủ quán | 24.10 |
| SX-KHUNG-1 | Cài bộ chạy an toàn GỌN vào kho SX: bỏ luật `ask`, hook nhánh `viec/<MÃ>`, người gác phạm vi, cổng kiểm rút gọn (`npm run kiem`) | script chat soạn | Chủ quán chạy | 25.10 |
| HOPDONG-1 | Hợp đồng 7 cửa POS→SX (`/api/recipes`, `/api/tea-products`, `/api/finished-products`, `…/check-stock`, `…/:id`, `/api/pos/stock/out`, `/api/pos/stock/in`) ở cả hai kho + bài thử; SX giả trong giả lập POS sửa theo | [Th] · Sonnet | Máy | 25.10 |
| SX-BACKUP-1 | Sao lưu 2 lớp: SX tự chép DB mỗi đêm giữ 7 bản (WAL vẫn tắt) + chủ quán tải bản sao TRƯỚC mỗi lần Merge PR của SX | [Th] · Sonnet | Máy + chủ quán | 26.10 |
| S5a | Hạn dùng lõi: lô hết hạn `het_han`, không trừ kho qua `stock/out`, không sống lại qua `stock/in`; topping cũng theo luật này | [T] · Opus | Máy | 27.10 |
| S1 | 27 đường đọc chưa khoá — cửa lộ dữ liệu khách / tiền khoá TRƯỚC khai trương; mỗi cửa khoá xong chạy hợp đồng 7 cửa | [T] · Opus | Máy | 30.10 (nhóm lộ) |
| S5b | Màn xử lý lô quá hạn (chép khuôn Kho NL), sửa 4 con số "đã hết hạn" | [Th] · Sonnet | Máy | 30.10 |
| S2 | XÁC MINH 5 phút: bán thử 1 ly cà phê trên SX, mở báo cáo doanh thu; khớp → đóng | — | Chủ quán | 24.10 |
| S3 | Gộp báo cáo 6 tab còn 3 | [Th] | — | Sau khai trương |

## Dự phòng (giữ mốc, không hạ chất lượng)
- payOS / Render trả phí chưa sẵn → tuần chạy thử dùng QR tĩnh + xác nhận tay có lý do; P3 bật khi có. KH-MUA-1 bật sau P3.
- Màn mới (BH-1) chưa qua kiểm trước 30.10 → giữ màn cũ đã ẩn Ghi nợ / Chưa thu (QUAY-AN-1); không đưa màn chưa kiểm ra quầy.
- Máy in tem chưa có → in tem qua trình duyệt ra máy bill.
- Việc [T] trễ → dùng 29–30.10; vẫn trễ thì CHỦ QUÁN quyết: khai trương với dự phòng của việc đó hay lùi ngày.

## Dời sau khai trương
AUDIT-5 · TU-CHAY-9 · DONG-GOI-1 (đóng gói đầy đủ bộ khung cho SX / App KH) · P7–P9 · P18 · P20d · P25 · MA-GIAM-2 · S1 (nhóm còn lại) · S3 ·
TIET-KIEM-1 · DONDEP-v1 (đổi tên từ DON-DEP-v1, có "-D") · DOI-SOAT-2 · P26e. P13a–e, P14 GỘP vào BH-1 / HD-1 / TOPPING-1 (24.10).
