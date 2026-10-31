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
| ~~KH-API-2~~ ✅ 29.10 | Cửa App KH chỉ đọc: hồ sơ + hạng + số dư ví, danh sách hạng, giờ vàng hôm nay, menu có giá từng hạng (cùng hàm với quầy); cài đặt **giờ hoạt động** + cửa giờ hoạt động cho App; hợp đồng v2 + bài thử hợp đồng | [T] · Opus | Opus 1 |
| ~~KH-API-3~~ ✅ 31.10 | Cửa App KH: xem menu không cần đăng nhập · đăng ký 3 bước (xưng hô, địa chỉ) · tự gia hạn đăng nhập 30 ngày · hợp đồng v3 | [T] · Opus | Opus 1 |
| GIO-VN-1 | Mọi hệ thống dùng **giờ Việt Nam**: mọi chỗ ghi giờ còn theo giờ quốc tế (UTC) đổi về giờ VN; dữ liệu cũ đổi qua nâng cấp có sao lưu | [T] · Opus | Opus 1 |
| COMBO-1a | Combo cố định, máy chủ tính giá combo, giảm hạng mức riêng cho combo | [T] · Opus | Opus 1 |
| TOPPING-1 | Topping là sản phẩm POS; cài topping + ghi chú theo từng món; giá; giảm hạng áp cả topping; dòng topping trên giỏ / hoá đơn / tem / hoàn; `/api/kh/menu` có topping theo món | [T] · Opus | Opus 1 |
| KHO-3 | Menu lấy từ sản phẩm POS; bán trừ kho POS (thành phẩm trước, pha tại chỗ theo công thức, kể cả topping; âm + báo đỏ); kiểm kê cuối ca có duyệt; đóng nối SX | [T] · Opus | Opus 1 |
| ~~KHO-1~~ ✅ 29.10 | Bảng kho, nâng cấp dữ liệu đánh số, nhập danh mục từ SX, màn Nguyên liệu + Sản phẩm & công thức | [T] · Opus | Opus 2 |
| ~~KHO-2a~~ ✅ 30.10 | Pha chế theo định mức + MỘT phiếu xuất có duyệt + in + thành phẩm vào kho; tồn; danh sách phiếu (sửa / huỷ chỉ chủ quán) | [T] · Opus | Opus 2 |
| KHO-2b | Đặt hàng (theo công thức / từng nguyên liệu, duyệt theo hạn mức) + nhận hàng (theo đơn, mua lẻ) + xử lý phát sinh | [T] · Opus | Opus 2 |
| P3b | Giữ / đổi điểm lấy quà ngay trong phiên thanh toán + PIN | [T] · Opus | Opus 2 |
| GIAO-1 | Giao Ahamove ở quầy: tính phí → thu đủ → gọi xe; phí là dòng riêng, không giảm, không áp mã, không tích điểm | [T] · Opus | Opus 2 |
| ~~HD-1~~ ✅ 29.10 | Hoá đơn mới 2 tờ + QR đăng ký App KH + mã nhận điểm; tuỳ chỉnh chữ hoá đơn & tem | [Th] · Sonnet | Sonnet |
| ~~BH-2~~ ✅ 30.10 | Màn Bán hàng mới đợt 2 (QR payOS + PIN + giữ tiền, giá hạng + ưu đãi máy chủ tính, màn kết thúc in hoá đơn HD-1) + menu 6 mục (chỉ dời đường dẫn) | [Th] · Sonnet | Sonnet |
| ~~KHACH-CK-1~~ ✅ 31.10 | Bỏ chiết khấu riêng từng khách: bỏ ô ở màn Khách hàng, máy chủ không áp, đặt về 0 có sao lưu — TRƯỚC khi bật màn Bán hàng mới | [T] · Opus | Opus 2 |
| GIOVANG-1 | Giờ vàng: cài món (vài món / tất cả) + giờ + giảm % HOẶC giá còn lại từng món; quầy + máy chủ tính theo đó; `/api/kh/gio-vang` thêm `gia_mon[]` | [T] · Opus | Opus 1 |
| KH-SP-1 | Thông tin ngắn của món ở màn Sản phẩm POS (nhu cầu, thể chất, mô tả, công dụng, thành phần) + hiện gọn ở quầy + `/api/kh/menu` trả thêm — mở khi KH-API-3 gộp | [Th] · Sonnet | Sonnet |
| BH-CKTAY-1 | Bỏ hẳn ô "Chiết khấu" giảm tay ở màn Bán hàng cũ (máy chủ đã không nhận — gõ vào là đơn không lưu được) | [Th] · Sonnet | Sonnet |
| KH-MUA-1 | App KH đặt đơn: báo giá giỏ, tạo đơn nhận tại quán, trả QR payOS hoặc ví + PIN (dùng lại `tinh-thu` + phiên thanh toán quầy), đơn về quầy kèm chuông khi đã trả, trạng thái đơn, huỷ đơn chưa trả | [T] · Opus | Opus 1 |
| KH-MUA-2 | App KH giao Ahamove: báo phí theo địa chỉ, trả đúng phí, trạng thái giao (dùng chung hàm GIAO-1) — SAU GIAO-1 | [T] · Opus | Opus 2 |
| COMBO-1b | Nhóm "Combo" trên màn Bán hàng mới (thẻ giá gốc gạch + giá combo, dòng combo trên giỏ / hoá đơn / tem) — SAU COMBO-1a và BH-2 | [Th] · Sonnet | Sonnet |
| — | Chủ quán: nhập bản sao lưu SX mới · kiểm kê đầu kỳ (tồn POS bắt đầu từ đây) · tắt SX · chạy thử toàn quán | — | — |

TOPPING-1, P3b, GIAO-1 tự làm phần giao diện của mình trên màn Bán hàng mới, SAU khi BH-2 gộp.

## Lịch theo ngày (xếp lại tối 30.10 — chủ quán chốt: đặt đơn online đủ 5 mục TRƯỚC khai trương; kịp thì 07.11, không kịp thì LÙI)
| Ngày | Opus làn 1 | Opus làn 2 | Sonnet (POS) |
|---|---|---|---|
| T5 29.10 | UUDAI-1 ✓ · KH-API-2 ✓ | KHO-1 ✓ · KHO-2a làm | HD-1 ✓ · BH-2 ✓ (xong sáng 29.10) |
| T6 30.10 | KH-API-3 làm | KHO-2a ✓ (chat gộp) | BH-2 gộp ✓ |
| T7 31.10 | KH-API-3 ✓ (gộp #54) → KH-MUA-1 kế hoạch | KHACH-CK-1 ✓ (gộp #55, sớm 1 ngày) → KHO-2b kế hoạch | KH-SP-1 làm · **tối: quyết ngày** |
| CN 01.11 | KH-MUA-1 làm | KHO-2b làm | KH-SP-1 gộp → BH-CKTAY-1 |
| T2 02.11 | KH-MUA-1 soát + gộp | KHO-2b soát + gộp | BH-CKTAY-1 gộp |
| T3 03.11 | COMBO-1a | P3b | COMBO-1b (sau COMBO-1a) · **tối: quyết ngày** |
| T4 04.11 | TOPPING-1 | P3b gộp → GIAO-1 | |
| T5 05.11 | TOPPING-1 gộp → GIOVANG-1 | GIAO-1 | |
| T6 06.11 | KHO-3 | GIAO-1 gộp → KH-MUA-2 | |
| T7 07.11 | KHO-3 gộp → GIO-VN-1 | KH-MUA-2 | |
| sau | GIO-VN-1 gộp · nhập bản sao lưu SX mới · kiểm kê đầu kỳ · tắt SX · chạy thử toàn quán 1 ngày → **khai trương** | | |

Ước tính tối 30.10: đủ mọi việc trên + chạy thử thì khai trương rơi vào khoảng **T4 11.11 – T5 12.11**; việc nào xong sớm thì cả hàng
dồn lên. Mỗi việc online (topping, combo, đổi điểm) làm luôn phần `/api/kh` của mình. Chủ quán + chat chốt ngày tối 31.10 và tối 03.11.
Tối 31.10: KH-API-3 đúng lịch, KHACH-CK-1 sớm 1 ngày → làn Opus 2 sớm khoảng nửa ngày; ước tính giữ **T4 11.11**, chốt lại tối 03.11.
Bước nâng cấp đã giữ số: 005 KH-SP-1 · 006 KH-MUA-1 · 007 KHO-2b. Hợp đồng `/api/kh`: v4 KH-SP-1 · v5 KH-MUA-1.
Ba việc cùng sửa `client/src/pages/Settings.jsx` và `client/dist/` (KH-SP-1, KH-MUA-1, KHO-2b) → script gộp của chat dựng lại `client/dist`.

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
- payOS: cài 3 mã `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` + `PAYOS_RETURN_URL=https://www.pos-tuquyduong.io.vn` vào
  Render → Environment (chờ Render chạy lại xong), RỒI mới điền Webhook payOS = `https://www.pos-tuquyduong.io.vn/api/payos/webhook`
  (bản CÓ www — bản không www tự chuyển hướng, payOS không đi theo) — chủ quán làm 31.10.
- Ahamove: tài khoản + khoá API cho GIAO-1 (đặt trên Render, không dán vào chat; hỏi Ahamove có môi trường thử / sandbox) trước T4 04.11.
- T5 05.11 sáng: tải bản sao lưu SX mới, gửi file `.db` cho chat.
- Máy in bill / tem (P17): nếu chưa có máy, in qua trình duyệt ra máy bill như hiện nay.

## Sau khai trương (đợt 2)
KH-HOSO-1 (thêm ô hồ sơ khách + nhiều địa chỉ) · KH-TN-1 (lưu kết quả trắc nghiệm, khách đồng ý) · KH-SP-2 (ảnh món) · DG-GOOGLE-1 (đánh giá Google, toàn bộ ở POS) · SAOLUU-DEM-1 (sao lưu tự
động hằng đêm) · KHOIPHUC-1 (khôi phục Excel cho đơn / ví / điểm chỉ khi máy trống) · giao việc · phân quyền chi tiết (Ẩn / Chỉ xem / Được làm / Xin phép) ·
khách hàng cửa sổ chi tiết + ví gia đình PIN theo thành viên (cùng chat App KH) · báo cáo nhập–xuất–tồn, thất thoát, tỉ lệ ra · chấm
công · gộp sâu menu · chia code cũ theo mục nghiệp vụ · P17 · AUDIT-KH · AUDIT-5 · TU-CHAY-9 · DONG-GOI-1 · P7–P9 · P18 · P20d · P25 ·
MA-GIAM-2 · TIET-KIEM-1 · DONDEP-v1 · DOI-SOAT-2 · P26e · DOISOAT-XULY-1 · KHACH-LOI-1 · DIEMHOAN-1 · NEO-P2223-1.
**Bỏ hẳn** (theo hướng bỏ app SX): HOPDONG-1, S5a, S5b, S3, SX-KHUNG-1, phần SX của TOPPING-1. Giữ BAO-MAT-SX tới khi tắt SX.
