# Thiết kế đợt 2 — chủ quán duyệt 02.11.2026 (bản chữ chính; demo chỉ để xem)

<!-- Chat POS soạn từ các lượt chủ quán chốt 01–02.11.2026. Demo đã duyệt cùng thư mục:
     thiet_ke/demo_dot2.html (tab 1 tiền mặt + PIN màn khách · tab 2 hạng · tab 3 bán theo kênh + giao hàng + bản in · tab 4 cài đặt màn khách)
     thiet_ke/demo_man_khach.html (màn khách đợt 1: ghép máy, vòng trang lúc rảnh, thu QR).
     Demo dùng dữ liệu giả, QR giả, không nối máy chủ. Chỗ demo và file này khác nhau → theo FILE NÀY. Phiếu ghi "làm theo mục X". -->

## M1. Thu tiền (MANKHACH-2b) — demo tab 1
- Bấm Thanh toán (MỌI cách: tiền mặt, QR, chuyển khoản tay, trừ tài khoản) → màn khách DỪNG nội dung rảnh, hiện hoá đơn; thu xong hiện
  "Cảm ơn quý khách" vài giây rồi chạy lại. Không có nút "Hiển thị" riêng.
- Hoá đơn trên màn khách giống tờ hoá đơn in: từng món giá gốc gạch ngang + giá sau giảm; dòng Giá gốc, các dòng giảm, Cần thanh toán.
  KHÔNG BAO GIỜ hiện SĐT, số dư, điểm.
- **Làm tròn tiền mặt** đến 1.000: phần lẻ TỪ 600 trở lên tròn lên, 500 trở xuống tròn xuống (75.500 → 75.000; 75.600 → 76.000).
  Chỉ tiền mặt. Hoá đơn + màn khách có dòng "Làm tròn tiền mặt ±…". Két / đối soát ghi đúng số thật thu; phần làm tròn ghi riêng.
- Khung tiền mặt ở quầy: hàng gợi ý ("Đủ tiền" + các số tròn gần nhất); 4 mệnh giá chính 500k·200k·100k·50k — mỗi lần bấm = 1 tờ, có ×N
  và nút − bớt 1 tờ; nút "Thêm mệnh giá" mở 20k·10k·5k·2k·1k; ô nhập tay. Hiện to **Khách đưa** và **Trả lại** (chữ "Trả lại", không
  "tiền thối"). Màn khách hiện cả hai dòng.
- **Trừ tài khoản:** màn khách hiện bảng PIN cho khách bấm (chỉ hiện chấm); quầy chờ. Sai PIN khoá theo luật PIN hiện có. Màn khách
  mất mạng / chưa ghép → nút dự phòng nhập PIN trên máy quầy như hiện nay.
- **Tài khoản chỉ đủ một phần:** trừ tài khoản TRƯỚC (PIN), rồi mới thu phần còn lại bằng tiền mặt (có làm tròn) hoặc QR. Màn khách: Tổng
  đơn · Đã trừ tài khoản · Còn phải trả.

## M2. Màn khách — ghép và cài đặt (MANKHACH-2a) — demo tab 4
- Ghép CHỈ MỘT LẦN; mã ghép dùng một lần (đã làm ở MANKHACH-1). Ghép lại chỉ khi thay máy (Thu hồi ở Cài đặt).
- Cài đặt = MỘT danh sách phát: ảnh thu nhỏ, kéo thả (và ▲▼) để xếp, công tắc Bật, Xoá (bấm 2 lần — KHÔNG dùng hộp thoại trình duyệt).
  Tổng thời gian một vòng hiện ở đầu danh sách.
- Thời gian: video mặc định chạy HẾT độ dài (có lựa chọn cắt N giây); ảnh và mẫu chạy theo giây (chọn nhanh 5/8/10/15).
- Thêm: ô tải ảnh / video (bấm chọn hoặc kéo thả; JPG, PNG, MP4; tối đa 100 MB) + MẪU CÓ SẴN: Thực đơn (giá, hết hàng tự cập nhật),
  Giờ vàng (chỉ hiện khi đang chạy), QR tải App, Lời chào, Món nổi bật, Đồng hồ + lời chào theo giờ. Mẫu có chữ: sửa chữ + hiệu ứng
  (không / nhấp nháy / chạy chữ / phóng nhẹ; tắt khi máy đặt "giảm chuyển động").
- File tải lên lưu ở CHỖ LƯU CHUNG của quán (dùng chung với ảnh món sau này); máy màn khách tự tải về MỘT lần, chạy được khi mất mạng.
  Khung xem trước phát thử đúng như máy tính bảng.

## M3. Hạng thẻ (HANG-1) — demo tab 2
- Hạng thêm / xoá được ("+ Thêm hạng"); mỗi hạng: tên, THỨ BẬC (▲▼), % giảm thường, % giảm nhóm món đặc biệt. (% giảm combo của hạng thuộc
  COMBO-1a.)
- Cách có hạng: **Bán** (danh sách gói tuỳ ý: số tháng + giá + bật/tắt; gói chưa đặt giá thì chưa bán) hoặc **Chỉ cấp** (không hiện ở chỗ
  bán; chỉ CHỦ QUÁN cấp ở trang Khách hàng, có PIN, ghi ai cấp / lúc nào; lúc cấp chọn số tháng hoặc KHÔNG THỜI HẠN).
- Hôm nay: Vàng = Bán (gói 1 và 3 tháng, giá chủ quán đặt sau); Kim Cương = Chỉ cấp.
- Mua thêm gói cùng hạng → hạn CỘNG NỐI vào hạn cũ. Khách đang có hạng cao hơn → KHÔNG mua được hạng thấp hơn.
- Hạng hiện tại = hạng CAO NHẤT còn hạn. Kim Cương (có hạn) hết hạn mà Vàng còn hạn → khách quay về Vàng.
- Chưa có thẻ nào bán trước khai trương — không xử lý thẻ cũ.

## M4. Ví khách: nạp tiền, thưởng nạp, quà chào mừng (NAP-1, NAP-2, QUA-1)
- **Gói nạp** (Cài đặt sản phẩm): ô "Khách trả" + ô "Vào tài khoản" sửa được; thêm / bớt / bật / tắt gói. Vd trả 100.000 vào 105.000.
- Bán ở quầy (nhóm "Nạp tiền", bắt buộc chọn khách; trả tiền mặt / QR — KHÔNG bằng tài khoản, không mã giảm, không giảm hạng) và khách TỰ
  NẠP trên App bằng QR (trước khai trương). Trả xong → số dư tăng NGAY, dùng trả đơn được luôn.
- Tiền nạp KHÔNG hoàn. Lúc nạp KHÔNG tích điểm; khi TIÊU tiền trong tài khoản thì CÓ tích điểm trên toàn bộ số tiêu.
- HAI loại tiền tặng, KHÔNG được lẫn:
  | | Quà chào mừng | Thưởng nạp |
  |---|---|---|
  | Từ đâu | Mã khi khách tạo tài khoản LẦN ĐẦU (vd +20.000) | Gói nạp (vd nạp 100.000 thưởng 5.000) |
  | Mấy lần | MỘT lần mỗi khách | Mỗi lần nạp |
  | Hạn | CÓ — đếm ngược; hết hạn mất phần chưa dùng | KHÔNG hạn |
  | Hiện | Dòng riêng "Quà chào mừng 20.000 — còn 5 ngày 3 giờ" | Gộp vào số dư |
  | Điều kiện đơn | Không (dùng cho mọi đơn) | Không |
- Thứ tự trừ: quà chào mừng TRƯỚC, rồi số dư. Hoàn đơn: trả về đúng ngăn; phần quà chào mừng đã quá hạn thì không trả lại.
- Mã mở tài khoản lần đầu: trong cài đặt mã chọn loại thưởng (nhân điểm / quà chào mừng X đồng, hạn N ngày). Mã in trên hoá đơn khách lẻ
  và bill gắn túi đơn nền tảng.
- **Sổ sách (báo cáo nhìn là hiểu):** ô 1 "Tiền thật đã vào quán" (tiền mặt, QR, tiền nạp — khớp két và sao kê); ô 2 "Bán được bao nhiêu"
  = tổng giá bán − giảm hạng − mã / chương trình − thưởng nạp đã dùng − quà chào mừng đã dùng = DOANH THU THẬT (hai loại tặng là HAI dòng
  riêng); ô 3 "Quán đang giữ hộ khách" = số dư cuối kỳ tách tiền nạp / thưởng nạp / quà chào mừng còn hạn. Nạp chưa phải doanh thu.
  Quà hết hạn chưa dùng: không ghi chi phí. (Thời điểm tính thuế tiền nạp: chủ quán hỏi kế toán.)

## M4b. Ví trên App KH (chủ quán duyệt luồng 02.11 tối) — demo thiet_ke/demo_app_vi.html
- Ví: số to "Số dư ví" = `so_du_vi` (tổng dùng được); ngay dưới, CHỈ khi `qua_chao_mung` khác `null`: dòng nhỏ "Trong đó Quà chào mừng 20.000 — còn
  5 ngày 3 giờ" (đếm ngược theo `bay_gio` POS, hết hạn thì mất). Thưởng nạp không có dòng riêng, không đếm ngược. Không có `so_du_nap`.
- Thanh toán: một công tắc "Trừ từ số dư ví" — tắt → `qr`; bật + đủ → `vi` (PIN); bật + thiếu → `vi_qr` (trừ phần ví có, QR phần còn lại). Hiện rõ
  "Trừ ví … / Quét QR phần còn lại …" trước khi Đặt; ví 0đ → công tắc khoá.
- Theo dõi đơn: "Đã giữ trong ví … · Quét QR …" + QR, từ `cach_tra`, `giu_vi`, `con_lai` của `GET /don/:ma` (tải lại / máy khác vẫn đúng).
- Lịch sử ví theo loại của `GET /vi`; loại lạ → chữ POS trả hoặc "Giao dịch ví".
- Giao diện App TỰ thiết kế theo nguyên tắc chủ quán: đơn giản · dễ hiểu · thông minh (tự khoá công tắc khi ví 0đ, nhắc quà sắp hết hạn, nhớ lựa
  chọn lần trước) · ít thao tác (bật công tắc → Đặt → PIN). Demo chỉ minh hoạ LUỒNG.

## M5. Bán theo kênh (KENH-1) — demo tab 3
- Cài đặt "Kênh bán": mỗi nền tảng (Grab, Shopee, Be…) có % cộng thêm vào giá quầy (làm tròn 1.000), % phí, % thuế bị trừ (mặc định 4,5);
  sửa giá riêng từng món; in bảng giá từng kênh.
- Bán hàng: hàng nút [Tại quầy][Grab][Shopee][Be] — chọn kênh thì cả menu đổi giá. Đơn kênh: SỬA ĐƯỢC giá từng dòng ngay lúc nhập (khớp
  khuyến mãi nền tảng); đơn quầy KHÔNG sửa giá. Mã đơn nền tảng BẮT BUỘC, không trùng (số đơn = mã nền tảng). Tên khách trên đơn (tuỳ chọn).
  Ô "Giảm quán chịu". Không tích điểm, không giảm hạng, không trừ tài khoản; vẫn trừ kho theo công thức. Nền tảng tự giao — POS không gọi Ahamove.
- Bản in đơn kênh: **bill gắn túi** (giống bill nền tảng: món + ghi chú, tổng theo giá nền tảng, "Đã thanh toán qua Grab", mã quà chào mừng +
  QR tới tuquyduong.com), **bill lưu nội bộ** ("KHÔNG ĐƯA KHÁCH": tổng giá kênh, giảm quán chịu, phí, thuế, DỰ KIẾN VỀ), phiếu pha chế, tem ly.
- Báo cáo theo kênh: tiền dự kiến về, đối chiếu khi nền tảng chuyển tiền.

## M6. Bản in — nguyên tắc chung (mọi phiếu)
- Ô số bill / mã kênh LUÔN to, đóng khung ở GÓC PHẢI TRÊN; đầu bill chia hai cột (trái: thông tin đơn vị bán tự xuống dòng; phải: ô số
  cố định) — tên hộ dài cũng KHÔNG chồng chữ. Phông có dấu tiếng Việt đầy đủ (không dùng phông máy chữ thiếu dấu).
- Hoá đơn quầy, đơn App, bill gắn túi dùng CHUNG một mẫu (HD-1), chỉ khác ô số ở góc và dòng thanh toán.
- Đầu hoá đơn theo ĐƠN VỊ BÁN đang chọn (tên hộ, địa chỉ, SĐT, MST).

## M7. Ghi chú món (TOPPING-1) — LÚC NÀO CŨNG CÓ, ở mọi kênh
- Mỗi dòng món: nút 📝 → nút chọn nhanh (Ít đá, Không đá, Nhiều đá, Ít đường, Không đường, Nhiều cafe, Nóng, Tách đá riêng — danh sách quán
  sửa trong Cài đặt) + ô gõ tự do. Dòng đã có ghi chú mà thêm cùng món → dòng MỚI. In lên phiếu pha chế, tem ly, hoá đơn, bill gắn túi.
  App KH nhận cùng danh sách nút.

## M8. Giao hàng (GIAO-1, KH-MUA-2) — demo tab 3
- KHÔNG BAO GIỜ có thu hộ (COD): khách luôn trả trước (tiền mặt / QR / tài khoản) — thu đủ rồi mới gọi xe.
- Địa chỉ: sổ địa chỉ của khách (nhiều địa chỉ, có mặc định); địa chỉ mới phải chọn trong gợi ý bản đồ (Ahamove cần toạ độ) rồi lưu vào sổ.
- Phí: hỏi Ahamove báo giá trước; dòng phí giao riêng — không giảm, không áp mã, không tích điểm. Miễn / hỗ trợ phí: CÓ ô cài đặt, MẶC ĐỊNH
  KHÔNG miễn. Nhân viên đổi tay khỏi luật → ghi tên. Giá Ahamove lúc gọi xe khác lúc báo → khách trả đúng số đã báo, chênh quán chịu, ghi riêng.
- Giao thất bại do khách (không nghe máy, sai địa chỉ…): KHÔNG hoàn tiền — màn đặt giao (quầy + App) phải ghi rõ trước khi đặt.
- Sổ sách: phí giao khách trả = thu hộ để trả Ahamove (không là doanh thu bán hàng); phần quán chịu = khoản khuyến mãi; cuối tháng đối chiếu
  sao kê Ahamove. Bill gắn túi có khung GIAO TỚI (tên, SĐT che giữa, địa chỉ) + mã Ahamove.

## M9. Đơn vị bán (DONVI-1, SAU khai trương; HD / SEPAY làm sẵn nền)
- Cài đặt "Đơn vị bán": mỗi hộ kinh doanh có tên, MST, địa chỉ, SĐT, ngân hàng + số tài khoản + tên chủ TK, cài đặt SePay RIÊNG (khoá bí
  mật chỉ hiện 4 ký tự cuối). Đổi đơn vị đang bán PHẢI có PIN chủ quán; ghi ai đổi / lúc nào. QR, SePay, đầu hoá đơn, két, đối soát,
  báo cáo theo đơn vị. Tiền về sai tài khoản → CẦN XEM, không chốt đơn.

## M10. Chương trình đặc biệt (CT-1a, CT-1b)
- Thẻ Cài đặt riêng "Chương trình": mỗi chương trình có ưu đãi (miễn N món / giảm % cả đơn / giảm % phần còn lại), điều kiện (chỉ tại quán,
  nhân viên tích "đã xem giấy tờ", số lần dùng theo ngày / năm học / năm), thời gian chạy. Không cộng với giảm hạng — máy chọn mức lợi hơn.
- Học sinh giỏi (mang giấy khen): miễn 1 đồ uống; gia đình đi kèm giảm 50% KHÔNG giới hạn số món, miễn cùng 1 hoá đơn; ghi tên học sinh +
  trường, chặn dùng lần 2 trong năm học.
- Sinh nhật: giảm 50% CẢ ĐƠN (không giới hạn món), một đơn, ĐÚNG ngày sinh nhật; nhân viên đối chiếu CĂN CƯỚC thật — tên + ngày sinh khớp
  tài khoản; tích "Đã đối chiếu căn cước"; POS KHÔNG lưu số căn cước. Ngày sinh nhập MỘT lần (App hoặc quầy), sau đó chỉ chủ quán sửa.
- App KH: ô ngày sinh (một lần) + `GET /chuong-trinh` hiển thị "áp dụng tại quán".
