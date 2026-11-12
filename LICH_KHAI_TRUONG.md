# Lịch tới khai trương — làm nhanh nhất, khai trương khi xong hết (không chốt ngày trước — chủ quán 31.10)

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

## Lịch 11.11.2026 (sổ v62 — thay bảng 09.11 bên dưới; tốc độ thật: việc Opus ~1,5 ngày, Sonnet ~1 ngày)
| Làn | Thứ tự việc | Xong dự kiến |
|---|---|---|
| Opus làn 1 | VOUCHER-2 → MATKHAU-1 → COMBO-1a → TOPPING-1 → GIOVANG-1 → CT-1b → KENH-1 → MANKHACH-2b → BO-MAN-CU-1 | ~T4 25.11 |
| Opus làn 2 | HUY-1 → ND-API-1 → KH-NAP-1 → QUA-1 → KH-MUA-2 → GIAO-MA-1 → KHO-3 → KHO-2c | ~T3 24.11 |
| Sonnet | BAO-1b → QC-APP-1 → MANKHACH-2a → QUET-1 → COMBO-1b → KHUNG-KIEM-1 → GIAO-DIEN-2 (+ P17 nếu cần) | ~CN 22.11 |
| Chủ quán | dọn dữ liệu thử · kiểm kê đầu kỳ · tắt SX → chạy thử toàn quán → sửa lỗi (~3–4 ngày) | |
| **Khai trương** | sớm nhất T7 28.11 nếu mọi việc trơn tru · **thực tế khoảng T5 03.12** | |
| Cuối danh sách (nối tiếp, không chờ) | DOI-DIEM-1 → QUET-2 → GIOI-THIEU-1 → QUA-TANG-1 (sau cùng) · CHU-KHACH-1 · NHATKY-CAIDAT-1 | ~T2 07.12 |

## Lịch 09.11.2026 (sổ v59 — thay bảng "Lịch theo làn" 02.11 bên dưới; chủ quán chọn làm ĐẦY ĐỦ)
Hai làn Opus song song (làn 1 = việc sửa vùng tính giá, nối tiếp; làn 2 = hạng · tài khoản · App · kho) + làn Sonnet. Ngày là dự kiến; mỗi yêu cầu
mới trước khai trương thường lùi ~1 ngày.

| Ngày | Opus làn 1 | Opus làn 2 | Sonnet |
|---|---|---|---|
| T2 09 – T3 10.11 | DIEM-MON-1 | KH-THE-1 ✓ → VI-ME-1 | QUAY-UI-1 ✓ → BAO-1a |
| T4 11 – T5 12 | VOUCHER-2 | VI-ME-1 → HUY-1 | BAO-1b (sau DIEM-MON-1) → QC-APP-1 |
| T6 13 | COMBO-1a | HUY-1 | MANKHACH-2a |
| T7 14 – CN 15 | TOPPING-1 | KH-NAP-1 · QUA-1 | COMBO-1b · KHUNG-KIEM-1 |
| T2 16 – T3 17 | GIOVANG-1 · CT-1b | KH-MUA-2 | (P17 trạm in nếu máy tính bảng không tự cắt liên) |
| T4 18 – T5 19 | KENH-1 | GIAO-MA-1 → KHO-3 | — |
| T6 20 – T7 21 | MANKHACH-2b | KHO-3 → KHO-2c | GIAO-DIEN-2 (chốt mẫu lần 2 trước) |
| CN 22 | Chủ quán: dọn dữ liệu thử · kiểm kê đầu kỳ · tắt app SX | | |
| T2 23 | Chạy thử toàn quán | | |
| T3 24 – T4 25 | Sửa lỗi chạy thử | | |
| **T5 26.11** | **Khai trương sớm nhất** | | |

Bỏ: P3b (đổi điểm chỉ trong App). Gộp: NAP-2 → KH-NAP-1; CAIDAT-BAO-1 → BAO-1b.
11.11 thêm TRƯỚC khai trương: BO-MAN-CU-1 · MATKHAU-1 (Opus), QUET-1 (Sonnet, sau BAO-1b) → khai trương sớm nhất lùi ~2 ngày (khoảng T7 28.11). CUỐI danh sách, làm nối tiếp không chờ (chủ quán 11.11 — làm hết một lượt): DOI-DIEM-1 → QUET-2 → GIOI-THIEU-1 → QUA-TANG-1 (sau cùng). Đã xong 10–11.11: DIEM-MON-1, VI-ME-1, BAO-1a.

## Việc phải xong trước khai trương
| Mã | Việc | Loại · model | Làn |
|---|---|---|---|
| ~~UUDAI-1~~ ✅ 29.10 | Mã giảm dùng chung / không với giá hạng (cài đặt theo loại mã), máy chủ chọn cách lợi hơn, `tinh-thu` cho giỏ | [T] · Opus | Opus 1 |
| ~~KH-API-2~~ ✅ 29.10 | Cửa App KH chỉ đọc: hồ sơ + hạng + số dư ví, danh sách hạng, giờ vàng hôm nay, menu có giá từng hạng (cùng hàm với quầy); cài đặt **giờ hoạt động** + cửa giờ hoạt động cho App; hợp đồng v2 + bài thử hợp đồng | [T] · Opus | Opus 1 |
| ~~KH-API-3~~ ✅ 31.10 | Cửa App KH: xem menu không cần đăng nhập · đăng ký 3 bước (xưng hô, địa chỉ) · tự gia hạn đăng nhập 30 ngày · hợp đồng v3 | [T] · Opus | Opus 1 |
| GIO-VN-1 | Mọi hệ thống dùng **giờ Việt Nam**: mọi chỗ ghi giờ còn theo giờ quốc tế (UTC) đổi về giờ VN; dữ liệu cũ đổi qua nâng cấp có sao lưu | [T] · Opus | Opus 1 |
| COMBO-1a | Combo cố định, máy chủ tính giá combo, giảm hạng mức riêng cho combo | [T] · Opus | Opus 1 |
| TOPPING-1 | Topping là sản phẩm POS; cài topping theo từng món; giá; giảm hạng áp cả topping; **ghi chú món ở MỌI kênh** (nút chọn nhanh + gõ tự do — 02.11); `/api/kh` topping + `/ghi-chu-nhanh` | [T] · Opus | Opus 1 |
| KHO-3 | Menu lấy từ sản phẩm POS; bán trừ kho POS (thành phẩm trước, pha tại chỗ theo công thức, kể cả topping; âm + báo đỏ); kiểm kê cuối ca có duyệt; đóng nối SX | [T] · Opus | Opus 1 |
| ~~KHO-1~~ ✅ 29.10 | Bảng kho, nâng cấp dữ liệu đánh số, nhập danh mục từ SX, màn Nguyên liệu + Sản phẩm & công thức | [T] · Opus | Opus 2 |
| ~~KHO-2a~~ ✅ 30.10 | Pha chế theo định mức + MỘT phiếu xuất có duyệt + in + thành phẩm vào kho; tồn; danh sách phiếu (sửa / huỷ chỉ chủ quán) | [T] · Opus | Opus 2 |
| ~~KHO-2b~~ ✅ 31.10 | Đặt hàng (theo công thức / từng nguyên liệu, duyệt theo hạn mức) + nhận hàng (theo đơn, mua lẻ) + xử lý phát sinh | [T] · Opus | Opus 2 |
| P3b | Giữ / đổi điểm lấy quà ngay trong phiên thanh toán + PIN | [T] · Opus | Opus 2 |
| GIAO-1 | Giao Ahamove ở quầy: sổ địa chỉ giao của khách (nhiều địa chỉ, mặc định, chọn qua gợi ý bản đồ) → báo phí → thu đủ → gọi xe; phí dòng riêng, không giảm / mã / điểm; KHÔNG COD; miễn phí có cài đặt (mặc định tắt); giao thất bại do khách không hoàn (chủ quán 02.11) | [T] · Opus | Opus 2 |
| ~~HD-1~~ ✅ 29.10 | Hoá đơn mới 2 tờ + QR đăng ký App KH + mã nhận điểm; tuỳ chỉnh chữ hoá đơn & tem | [Th] · Sonnet | Sonnet |
| ~~BH-2~~ ✅ 30.10 | Màn Bán hàng mới đợt 2 (QR payOS + PIN + giữ tiền, giá hạng + ưu đãi máy chủ tính, màn kết thúc in hoá đơn HD-1) + menu 6 mục (chỉ dời đường dẫn) | [Th] · Sonnet | Sonnet |
| ~~KHACH-CK-1~~ ✅ 31.10 | Bỏ chiết khấu riêng từng khách: bỏ ô ở màn Khách hàng, máy chủ không áp, đặt về 0 có sao lưu — TRƯỚC khi bật màn Bán hàng mới | [T] · Opus | Opus 2 |
| GIOVANG-1 | Giờ vàng: cài món (vài món / tất cả) + giờ + giảm % HOẶC giá còn lại từng món; quầy + máy chủ tính theo đó; `/api/kh/gio-vang` thêm `gia_mon[]` | [T] · Opus | Opus 1 |
| ~~KH-SP-1~~ ✅ 31.10 | Thông tin ngắn của món ở màn Sản phẩm POS (nhu cầu, thể chất, mô tả, công dụng, thành phần) + hiện gọn ở quầy + `/api/kh/menu` trả thêm — mở khi KH-API-3 gộp | [Th] · Sonnet | Sonnet |
| ~~BH-CKTAY-1~~ ✅ 31.10 | Bỏ hẳn ô "Chiết khấu" giảm tay ở màn Bán hàng cũ (máy chủ đã không nhận — gõ vào là đơn không lưu được) | [Th] · Sonnet | Sonnet |
| ~~KH-QUAY-2~~ ✅ 31.10 | Quầy: cấp mã đăng nhập App cho SĐT mới (không tạo khách trước) · hoá đơn khách chỉ khổ nhiệt (bỏ A4 / A5 của hoá đơn) | [Th] · Sonnet | Sonnet |
| ~~SAOLUU-2~~ ✅ 31.10 | Khôi phục sao lưu an toàn: không mất cột / dòng, hỏng thì không đổi gì, mọi bảng nằm trong sao lưu (thêm pos_don_app) | [T] · Opus | Opus 2 (sau KHO-2b) |
| ~~KHO-IN-1~~ ✅ 02.11 | Cài đặt in phiếu kho (A5 / A4, mặc định A5) + khổ hoá đơn mặc định | [Th] · Sonnet | Sonnet |
| SEPAY-1 | Thanh toán QR qua SePay đủ chức năng như payOS (quầy + App), payOS giữ dự phòng bằng công tắc | [T] · Opus | Opus 1 |
| ~~MANKHACH-1~~ ✅ 01.11 | Màn khách: ghép máy (mã dùng một lần), QR + món + tổng lúc thu, nội dung rảnh tự cài | [Th] · Sonnet | Sonnet 2 |
| KH-SDT-1 | Công cụ dọn dữ liệu thử MỘT lần trước khai trương (KHÔNG khoá dữ liệu cũ của SĐT — chủ quán đổi 01.11) | [T] · Opus | Opus 2 |
| ~~TU-CHAY-10~~ ✅ 02.11 | Bộ khung 1.9.0: soát bảo mật tự động (/soat-bao-mat + cổng A20) — chat chép sang APP-KH | Bộ khung · Opus | Opus phụ |
| KHO-2c | Sửa phiếu nhận khi lô đã dùng: vẫn sửa được, số liệu khớp thực tế; lô đã dùng không huỷ được | [T] · Opus | Opus 2 (sau KH-SDT-1) |
| ~~KH-MUA-1~~ ✅ 31.10 | App KH đặt đơn: báo giá giỏ, tạo đơn nhận tại quán, trả QR payOS hoặc ví + PIN (dùng lại `tinh-thu` + phiên thanh toán quầy), đơn về quầy kèm chuông khi đã trả, trạng thái đơn, huỷ đơn chưa trả | [T] · Opus | Opus 1 |
| KH-MUA-2 | App KH giao Ahamove: báo phí theo địa chỉ, trả đúng phí, trạng thái giao (dùng chung hàm GIAO-1) — SAU GIAO-1 | [T] · Opus | Opus 2 |
| COMBO-1b | Nhóm "Combo" trên màn Bán hàng mới (thẻ giá gốc gạch + giá combo, dòng combo trên giỏ / hoá đơn / tem) — SAU COMBO-1a và BH-2 | [Th] · Sonnet | Sonnet |
| HANG-1 | Hạng: thêm hạng, thứ bậc, gói thời hạn (bán, cộng nối), hạng chỉ cấp (chủ quán + PIN, có thể vô hạn), hạng cao nhất còn hạn; `/hang` v7 | [T] · Opus | Opus 2 |
| NAP-1 | Gói nạp ở quầy; ví hai ngăn (tiền nạp / thưởng nạp không hạn); tích điểm khi tiêu ví; sổ sách tiền nạp 3 ô | [T] · Opus | Opus 2 |
| QUA-1 | Quà chào mừng (mã mở tài khoản lần đầu → tiền có hạn, đếm ngược, trừ trước); `/toi.qua_chao_mung` | [T] · Opus | Opus 2 |
| NAP-2 | App tự nạp bằng QR (`/goi-nap`, `/nap`) + lịch sử ví `/vi` | [T] · Opus | Opus 2 |
| CT-1a | Thẻ Cài đặt "Chương trình" + ngày sinh khách (một lần) + `/chuong-trinh`, `PUT /toi.ngay_sinh` | [Th] · Sonnet (soát bảo mật: có) | Sonnet |
| CT-1b | Áp chương trình tại quầy (học sinh giỏi, sinh nhật đối chiếu căn cước), không cộng với hạng | [T] · Opus | Opus 1 |
| MANKHACH-2a | Cài đặt màn khách kiểu danh sách phát (ảnh / video / mẫu) + CHỖ LƯU CHUNG file (dùng lại cho ảnh món) | [Th] · Sonnet (soát bảo mật: có) | Sonnet |
| MANKHACH-2b | Hoá đơn trên màn khách mọi cách trả; khung tiền mặt (làm tròn 600, mệnh giá, trả lại); PIN trên màn khách; ví một phần trước | [T] · Opus | Opus 2 |
| KENH-1 | Bán theo kênh (Grab / Shopee / Be): giá kênh, sửa giá dòng, mã đơn nền tảng, bill gắn túi + bill nội bộ, báo cáo kênh | [T] · Opus | Opus 1 |
| HD-KH-1 | `GET /api/kh/don/:ma` trả dòng hoá đơn dựng sẵn bằng cùng hàm hoá đơn in (App vẽ đúng mẫu POS) | [Th] · Sonnet | Sonnet |
| KH-NHANH-POS-1 | CORS `maxAge: 7200` cho `/api/kh` (yêu cầu App 01.11) | [Th] · Sonnet | Sonnet |
| — | Chủ quán: nhập bản sao lưu SX mới · kiểm kê đầu kỳ (tồn POS bắt đầu từ đây) · tắt SX · chạy thử toàn quán | — | — |

TOPPING-1, P3b, GIAO-1 tự làm phần giao diện của mình trên màn Bán hàng mới, SAU khi BH-2 gộp.

## Lịch theo làn (chat soát + tối ưu tối 02.11 — chủ quán: "làm nhanh nhất, khai trương khi xong hết")
Nguyên tắc xếp: (1) làn Opus 1 = các việc sửa vùng TÍNH GIÁ của `orders.js` — làm NỐI TIẾP; (2) làn Opus 2 = hạng / ví / thanh toán / giao —
nối tiếp; (3) Sonnet = việc ít đụng tiền; (4) GIO-VN-1 lên ĐẦU làn 1 vì các việc sau đều so giờ (hạn thẻ, hạn quà, sinh nhật, phiên nạp);
(5) hợp đồng `/api/kh` v7 viết TRƯỚC (sổ v53) để App KH làm song song; (6) việc lớn tách nhỏ (NAP-1 / QUA-1 / NAP-2, CT-1a / CT-1b,
MANKHACH-2a / 2b) để mỗi việc ~1 ngày và soát được.
| Ngày (dự kiến) | Opus làn 1 (tính giá) | Opus làn 2 (hạng · ví · thanh toán · giao) | Sonnet | Chủ quán |
|---|---|---|---|---|
| T2 02.11 | SEPAY-1 (đang làm) | KH-SDT-1 (đang làm) | — | chạy mo_M16 (sổ v53) · gửi thư bản 6 cho App KH |
| T3 03.11 | SEPAY-1 gộp → GIO-VN-1 | KH-SDT-1 gộp → HANG-1 | KH-NHANH-POS-1 · HD-KH-1 | thử SePay đơn 2.000đ · tạo kho lưu file Cloudflare R2 |
| T4 04.11 | COMBO-1a | NAP-1 | CT-1a | đặt giá gói Vàng 1 / 3 tháng |
| T5 05.11 | TOPPING-1 (+ ghi chú món) | QUA-1 | MANKHACH-2a | nhập gói nạp + mức quà chào mừng |
| T6 06.11 | GIOVANG-1 | NAP-2 | COMBO-1b (COMBO-1a đã gộp) | thử màn khách mới |
| T7 07.11 | KENH-1 | P3b | — | gửi % phí từng nền tảng |
| CN 08.11 | CT-1b | MANKHACH-2b | — | khoá Ahamove + khoá bản đồ trên Render |
| T2 09.11 | KHO-3 | GIAO-1 | — | thử giao 1 đơn thật |
| T3 10.11 | KHO-2c | KH-MUA-2 | — | — |
| T4 11.11 | sửa lỗi tồn | sửa lỗi tồn | — | dọn dữ liệu thử · nhập bản sao lưu SX · kiểm kê đầu kỳ · tắt SX |
| T5 12.11 | chạy thử toàn quán 1 ngày (quầy + App + kênh + giao) | | | ký nghiệm thu |
| T6 13.11 | sửa lỗi chạy thử | | | |
| T7 14.11 | **khai trương sớm nhất** (xong sớm thì dồn lên, trễ thì lùi — không khai trương với phần làm dở) | | | |

Mỗi việc [T]: sáng mở phiên → lập kế hoạch (Opus) → chat duyệt tối → làm đêm → chat soát + script gộp sáng hôm sau. Việc [Th] Sonnet chạy thẳng.
Mỗi tối chủ quán dán MỘT lần mọi kết quả cho chat; chat đối chiếu bảng này, việc nào trễ thì nêu phương án ngay tối đó.

Ước tính tối 02.11: mỗi việc [T] ~1 ngày (lập kế hoạch ngày, làm đêm) → hai làn Opus ~8 ngày + chạy thử 1 ngày → khai trương sớm nhất khoảng
**T7 14.11 – CN 15.11**; xong sớm thì dồn lên. Không chốt ngày trước (chủ quán 31.10).
Bước nâng cấp đã giữ số: 008 SEPAY-1 (nếu cần) · 009 MANKHACH-1 (đã gộp) · 010 KH-SDT-1 · 011 KHO-2c · 012 GIO-VN-1 · 013 HANG-1 · 014 NAP-1 ·
015 QUA-1 · 016 NAP-2 · 017 CT-1a · 018 MANKHACH-2a. Hợp đồng `/api/kh`: v4 KH-SP-1 · v5 KH-MUA-1 · v6 SEPAY-1 (chữ) · v7 các mục "Đã hẹn" 02.11.
Thiết kế đã duyệt: `thiet_ke/THIET_KE_DOT2.md` (bản chữ chính) + `thiet_ke/demo_dot2.html`, `thiet_ke/demo_man_khach.html`.

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
- Ahamove: tài khoản + khoá API cho GIAO-1 (đặt trên Render, không dán vào chat; hỏi Ahamove có môi trường thử / sandbox) trước CN 08.11.
- Dịch vụ bản đồ (gợi ý địa chỉ → toạ độ cho Ahamove): GIAO-1 đề xuất dịch vụ trong kế hoạch; chủ quán tạo khoá, đặt trên Render trước CN 08.11.
- Cloudflare R2 (chỗ lưu file màn khách, sau dùng cho ảnh món) — cùng tài khoản Cloudflare của tuquyduong.com; tạo trước T5 05.11 theo hướng
  dẫn MANKHACH-2a.
- Xem vùng (region) đang đặt của Render và Turso — chụp gửi chat (yêu cầu tốc độ của App 01.11; đổi vùng chỉ khi chat kiểm cách làm).
- Giá trị cần nhập trước chạy thử: giá gói Vàng 1 / 3 tháng · các gói nạp (khách trả / vào tài khoản) · mức + hạn quà chào mừng · % cộng / phí /
  thuế từng nền tảng · danh sách nút ghi chú món · luật miễn phí giao (mặc định tắt).
- T5 05.11 sáng: tải bản sao lưu SX mới, gửi file `.db` cho chat.
- Máy in bill / tem (P17): nếu chưa có máy, in qua trình duyệt ra máy bill như hiện nay.

## Sau khai trương (đợt 2)
KH-HOSO-1 (thêm ô hồ sơ khách + nhiều địa chỉ) · KH-TN-1 (lưu kết quả trắc nghiệm, khách đồng ý) · KH-SP-2 (ảnh món — chỗ lưu làm sẵn ở MANKHACH-2a) · DONVI-1 (đơn vị bán theo ca, SePay riêng, hoá đơn theo đơn vị) · DG-GOOGLE-1 (đánh giá Google, toàn bộ ở POS) · SAOLUU-DEM-1 (sao lưu tự
động hằng đêm) · KHOIPHUC-1 (khôi phục Excel cho đơn / ví / điểm chỉ khi máy trống) · giao việc · phân quyền chi tiết (Ẩn / Chỉ xem / Được làm / Xin phép) ·
khách hàng cửa sổ chi tiết + ví gia đình PIN theo thành viên (cùng chat App KH) · báo cáo nhập–xuất–tồn, thất thoát, tỉ lệ ra · chấm
công · gộp sâu menu · chia code cũ theo mục nghiệp vụ · P17 · AUDIT-KH · AUDIT-5 · TU-CHAY-9 · DONG-GOI-1 · P7–P9 · P18 · P20d · P25 ·
MA-GIAM-2 · TIET-KIEM-1 · DONDEP-v1 · DOI-SOAT-2 · P26e · DOISOAT-XULY-1 · KHACH-LOI-1 · DIEMHOAN-1 · NEO-P2223-1 · GIOI-THIEU-1 (giới thiệu bạn bè qua App, sau VOUCHER-2) · **QUA-TANG-1 (thẻ quà tặng) — làm SAU CÙNG**.
**Bỏ hẳn** (theo hướng bỏ app SX): HOPDONG-1, S5a, S5b, S3, SX-KHUNG-1, phần SX của TOPPING-1. Giữ BAO-MAT-SX tới khi tắt SX.
