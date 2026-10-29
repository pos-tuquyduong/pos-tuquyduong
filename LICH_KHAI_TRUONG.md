# Lịch tới khai trương — T7 07.11.2026, CHỈ khi xong hết

<!-- Chủ quán chốt 27.10.2026 (thay lịch 14 ngày 17–30.10). File này cho MÁY biết việc và hạn; theo dõi hằng ngày ở file Excel
     LICH_KHAI_TRUONG.xlsx của chủ quán. Chat cập nhật file này khi việc / ngày đổi. Luật xây app ở LUAT_XAY_APP.md.
     [T] = việc tiền / kho / bảo mật (có "Chờ duyệt kế hoạch") · [Th] = việc thường (chạy thẳng tới hết).
     26–27.10: BỎ app SX — mọi thứ về POS: nhập nguyên liệu → pha chế / sản xuất → thành phẩm → bán; khách do POS giữ. Chỉ nhập DANH MỤC
     từ SX (nguyên liệu, nhóm, sản phẩm, công thức); không lấy tồn, khách, gói đăng ký. App SX tắt khi POS tự trừ kho (KHO-3).
     27.10: KHAI TRƯƠNG CHỈ KHI MỌI VIỆC TRONG BẢNG DƯỚI XONG và chạy thử đạt — không khai trương với phần làm dở, không dùng phương án
     dự phòng nào; trễ thì LÙI NGÀY. Chủ quán chọn làm luôn topping theo món (TOPPING-1), đổi điểm trong phiên (P3b), giao Ahamove ở
     quầy (GIAO-1) trước khai trương → khai trương lùi từ T3 03.11 sang T7 07.11.
     27.10: App KH ở kho GitHub riêng `tuquyduong/APP-KH`, giao diện trên Cloudflare (tuquyduong.com); máy chủ App KH trên Render SAU khai trương (chat App KH làm). 28.10: cổng `/api/kh` theo hợp đồng `HOP_DONG_API_KH.md`; quyết định chung ở `QUYET_DINH_CHU_QUAN.md`. Kho POS chỉ cung cấp cửa `/api/kh`;
     từ nay KHÔNG sửa `app_kh/` trong kho POS (giữ tới khi app mới chạy, rồi xoá). Đơn ở quầy vẫn đi thẳng POS.
     UUDAI-1 duyệt 27.10 (f7165ea). -->

## Việc phải xong trước khai trương
| Mã | Việc | Loại · model | Làn |
|---|---|---|---|
| ~~UUDAI-1~~ ✅ 29.10 | Mã giảm dùng chung / không với giá hạng (cài đặt theo loại mã), máy chủ chọn cách lợi hơn, `tinh-thu` cho giỏ | [T] · Opus | Opus 1 |
| KH-API-2 | Cửa App KH chỉ đọc: hồ sơ + hạng + số dư ví, danh sách hạng, giờ vàng hôm nay, menu có giá từng hạng (cùng hàm với quầy); cài đặt **giờ hoạt động** + cửa giờ hoạt động cho App; hợp đồng v2 + bài thử hợp đồng | [T] · Opus | Opus 1 |
| GIO-VN-1 | Mọi hệ thống dùng **giờ Việt Nam**: mọi chỗ ghi giờ còn theo giờ quốc tế (UTC) đổi về giờ VN; dữ liệu cũ đổi qua nâng cấp có sao lưu | [T] · Opus | Opus 1 |
| COMBO-1a | Combo cố định, máy chủ tính giá combo, giảm hạng mức riêng cho combo | [T] · Opus | Opus 1 |
| TOPPING-1 | Topping là sản phẩm POS; cài topping + ghi chú theo từng món; giá; giảm hạng áp cả topping; dòng topping trên giỏ / hoá đơn / tem / hoàn; `/api/kh/menu` có topping theo món | [T] · Opus | Opus 1 |
| KHO-3 | Menu lấy từ sản phẩm POS; bán trừ kho POS (thành phẩm trước, pha tại chỗ theo công thức, kể cả topping; âm + báo đỏ); kiểm kê cuối ca có duyệt; đóng nối SX | [T] · Opus | Opus 1 |
| ~~KHO-1~~ ✅ 29.10 | Bảng kho, nâng cấp dữ liệu đánh số, nhập danh mục từ SX, màn Nguyên liệu + Sản phẩm & công thức | [T] · Opus | Opus 2 |
| KHO-2a | Pha chế theo định mức + MỘT phiếu xuất có duyệt + in + thành phẩm vào kho; tồn; danh sách phiếu (sửa / huỷ chỉ chủ quán) | [T] · Opus | Opus 2 |
| KHO-2b | Đặt hàng (theo công thức / từng nguyên liệu, duyệt theo hạn mức) + nhận hàng (theo đơn, mua lẻ) + xử lý phát sinh | [T] · Opus | Opus 2 |
| P3b | Giữ / đổi điểm lấy quà ngay trong phiên thanh toán + PIN | [T] · Opus | Opus 2 |
| GIAO-1 | Giao Ahamove ở quầy: tính phí → thu đủ → gọi xe; phí là dòng riêng, không giảm, không áp mã, không tích điểm | [T] · Opus | Opus 2 |
| ~~HD-1~~ ✅ 29.10 | Hoá đơn mới 2 tờ + QR đăng ký App KH + mã nhận điểm; tuỳ chỉnh chữ hoá đơn & tem | [Th] · Sonnet | Sonnet |
| BH-2 | Màn Bán hàng mới đợt 2 (QR payOS + PIN + giữ tiền, giá hạng + ưu đãi máy chủ tính, màn kết thúc in hoá đơn HD-1) + menu 6 mục (chỉ dời đường dẫn) | [Th] · Sonnet | Sonnet |
| COMBO-1b | Nhóm "Combo" trên màn Bán hàng mới (thẻ giá gốc gạch + giá combo, dòng combo trên giỏ / hoá đơn / tem) — SAU COMBO-1a và BH-2 | [Th] · Sonnet | Sonnet |
| — | Chủ quán: nhập bản sao lưu SX mới · kiểm kê đầu kỳ (tồn POS bắt đầu từ đây) · tắt SX · chạy thử toàn quán | — | — |

TOPPING-1, P3b, GIAO-1 tự làm phần giao diện của mình trên màn Bán hàng mới, SAU khi BH-2 gộp.

## Lịch theo ngày (xếp lại 29.10 theo tiến độ thật; tối đa 2 Opus + 2 Sonnet cùng lúc; App KH dùng 1 Sonnet)
| Ngày | Opus làn 1 | Opus làn 2 | Sonnet (POS) |
|---|---|---|---|
| T4 28.10 | UUDAI-1 làm + soát ✓ | KHO-1 làm + soát ✓ | HD-1 ✓ (3 vòng sửa) |
| T5 29.10 | UUDAI-1 gộp ✓ → KH-API-2 kế hoạch ✓ → làm | KHO-1 gộp ✓ → KHO-2a kế hoạch ✓ → làm | HD-1 vòng sửa 4 ✓ gộp ✓ → BH-2 |
| T6 30.10 | KH-API-2 gộp → COMBO-1a | KHO-2a làm + soát | BH-2 |
| T7 31.10 | COMBO-1a gộp → TOPPING-1 kế hoạch → làm | KHO-2a gộp → KHO-2b | BH-2 · **tối: xem tiến độ, quyết giữ hay lùi ngày** |
| CN 01.11 | TOPPING-1 làm + gộp | KHO-2b làm | BH-2 |
| T2 02.11 | KHO-3 kế hoạch → làm | KHO-2b gộp → P3b | BH-2 gộp |
| T3 03.11 | KHO-3 làm + gộp | P3b làm + gộp | sửa lỗi |
| T4 04.11 | GIO-VN-1 | GIAO-1 | sửa lỗi |
| T5 05.11 | GIO-VN-1 gộp · chủ quán: nhập bản sao lưu SX mới · kiểm kê đầu kỳ · tắt SX | GIAO-1 gộp | |
| T6 06.11 | Chạy thử toàn quán với nhân viên — CHỈ sửa lỗi · tối: chủ quán + chat quyết giữ ngày hay lùi | | |
| T7 07.11 | **Khai trương** (nếu mọi việc trên đạt) | | |

Tiến độ 29.10: làn Opus chậm khoảng nửa ngày so với lịch 27.10 (KH-API-2 thêm giờ hoạt động + bài thử hợp đồng; KHO-2 tách đôi cho vừa một lần
soát). Lịch trên KHÔNG còn ngày dự phòng: một việc phải sửa quá nhiều vòng, hoặc máy chạm hạn mức tuần, là lùi khai trương 1–2 ngày.

## Thứ tự gộp — vì sao
- `server/routes/orders.js` (vùng giá / tạo đơn): UUDAI-1 → KH-API-2 → COMBO-1a → TOPPING-1 → KHO-3 NỐI TIẾP trên làn Opus 1.
- Làn Opus 2: KHO-1, KHO-2 KHÔNG sửa orders.js. P3b, GIAO-1 có thể chạm orders.js → kế hoạch phải ghi rõ vùng sửa; chồng vùng với
  việc đang mở ở làn 1 thì chờ việc đó gộp.
- HD-1 KHÔNG sửa orders.js (cửa hoá đơn đọc riêng).
- `client/src/components/Layout.jsx` (menu): KHO-1 thêm một mục → BH-2 xếp lại menu 6 mục, gộp SAU KHO-1.
- `client/src/pages/BanHang/**`: BH-2 gộp trước; TOPPING-1, P3b, GIAO-1 thêm phần màn của mình sau đó.
- Mảng tên bài thử trong `kiem_tra_truoc_khi_giao.js` (một dòng): script gộp của chat tự giữ đủ các tên.

## Chủ quán cần làm trước khai trương
- BAO-MAT-SX: kho SX (`tuquyduong/Quan-Ly-San-Xuat`) VẪN CÔNG KHAI → chuyển riêng tư; đổi `POS_API_KEY` ở Railway + Render.
- Render POS lên gói trả phí + Turso lên gói Developer (quay lại dữ liệu 10 ngày) trước chạy thử (máy không ngủ, payOS báo tiền về kịp).
- T6 06.11: dán `https://tuquyduong.com/?ma={ma}` vào Cài đặt hoá đơn → ô "Địa chỉ đăng ký App KH" (khi chat App KH báo app đã chạy).
- Xin quyền Google Business Profile API sớm (duyệt vài ngày – vài tuần) và lấy link đánh giá Google của quán — cho DG-GOOGLE-1.
- Ahamove: tài khoản + khoá API cho GIAO-1 (đặt trên Render, không dán vào chat) trước T4 04.11.
- T5 05.11 sáng: tải bản sao lưu SX mới, gửi file `.db` cho chat.
- Máy in bill / tem (P17): nếu chưa có máy, in qua trình duyệt ra máy bill như hiện nay.

## Sau khai trương (đợt 2)
KH-MUA-1 (đặt đơn App KH) · KH-HOSO-1 (thêm ô hồ sơ khách) · DG-GOOGLE-1 (đánh giá Google, toàn bộ ở POS) · SAOLUU-DEM-1 (sao lưu tự
động hằng đêm) · KHOIPHUC-1 (khôi phục Excel cho đơn / ví / điểm chỉ khi máy trống) · giao việc · phân quyền chi tiết (Ẩn / Chỉ xem / Được làm / Xin phép) ·
khách hàng cửa sổ chi tiết + ví gia đình PIN theo thành viên (cùng chat App KH) · báo cáo nhập–xuất–tồn, thất thoát, tỉ lệ ra · chấm
công · gộp sâu menu · chia code cũ theo mục nghiệp vụ · P17 · AUDIT-KH · AUDIT-5 · TU-CHAY-9 · DONG-GOI-1 · P7–P9 · P18 · P20d · P25 ·
MA-GIAM-2 · TIET-KIEM-1 · DONDEP-v1 · DOI-SOAT-2 · P26e · DOISOAT-XULY-1 · KHACH-LOI-1 · DIEMHOAN-1 · NEO-P2223-1.
**Bỏ hẳn** (theo hướng bỏ app SX): HOPDONG-1, S5a, S5b, S3, SX-KHUNG-1, phần SX của TOPPING-1. Giữ BAO-MAT-SX tới khi tắt SX.
