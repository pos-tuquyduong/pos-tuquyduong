# Đặc tả màn Bán hàng mới — chủ quán chốt 22–24.10.2026

<!-- Chat soạn 24.10.2026 từ demo chủ quán đã duyệt (artifact "Màn Bán hàng — phương án ghép", 3 khung: máy tính bảng,
     điện thoại, Cài đặt · Tuỳ chỉnh hoá đơn). Logic demo (JS thuần, dữ liệu giả) ở ban_mau_pos/demo_2410/ — đọc để hiểu
     luồng và cách tính; KHÔNG chép nguyên vào app (không gọi máy chủ, giá/khách/quà là mẫu).
     File này THAY bản mẫu 22–23.09 ở các điểm ghi "THAY". Chỗ nào file này không nói → theo DAC_TA.md cũ.
     Tiền luôn do MÁY CHỦ tính và quyết; giao diện chỉ hiển thị. Mọi quyết định dưới đây là của chủ quán — đừng hỏi lại. -->

## 1. Quyết định đã chốt (THAY bản mẫu cũ)
1. Gọi món và trả tiền luôn tại quầy. BỎ "In bill mang ra bàn / Chưa thu", BỎ dãy thẻ bill chờ, BỎ "Ghi nợ". Bán hàng không có công nợ.
2. BỎ hộp thanh toán (popup). Mọi thứ trên một màn: lưới món + cột giỏ & thanh toán.
3. Giao diện tự theo độ rộng màn hình: điện thoại (hẹp hơn ~600 px) = hai trang Món ↔ Giỏ; máy tính bảng / máy quầy = món trái, giỏ phải.
   Cài đặt có ô "Kiểu màn hình: Tự động / Điện thoại / Máy tính bảng" lưu RIÊNG trên từng máy (mặc định Tự động).
4. Chọn khách nằm ngay trên màn (không phải bước riêng, không khoá lưới): ô "Khách quen? Gõ SĐT / tên — trống = khách lẻ" + nút Quét thẻ.
   Khách lẻ không cần chạm gì. Chọn khách lúc nào thì giá hạng áp lúc đó cho cả giỏ.
5. Giá theo hạng: chọn khách có hạng → lưới, giỏ, hoá đơn hiện giá gốc GẠCH NGANG + giá hạng (không gạch). Giảm hạng áp cả lên topping.
   Màn quản lý Sản phẩm hiện cả giá thường và giá từng hạng.
6. Ưu đãi: mỗi đơn MỘT mã giảm giá hoặc MỘT quà đổi điểm. Cài đặt quyết mã/quà nào được CỘNG với giảm hạng: cộng → hạng tính trước,
   ưu đãi tính trên giá đã giảm; không cộng → máy chọn cái LỢI HƠN cho khách và ghi rõ trên giỏ.
7. Khung chọn món (khung nổi trên máy tính bảng, trượt từ đáy trên điện thoại) mở khi chạm món có tuỳ chỉnh: topping (nút to kèm giá,
   chạm thêm để tăng phần, tối đa 3), ghi chú nhanh, ô tự gõ, số ly, nút "Thêm vào giỏ · <giá>". Món không có tuỳ chỉnh: chạm là vào giỏ.
   Chạm dòng trong giỏ mở lại khung để sửa / xoá. Hai ly khác tuỳ chỉnh = hai dòng.
8. Ghi chú nhanh và topping CÀI THEO TỪNG SẢN PHẨM (ví dụ cà phê đen không có "sữa"; cà phê không có topping; trà dưỡng nhan có thạch,
   nếp cẩm). Topping quản lý qua kho SX (lô, hạn dùng); topping hết hàng / hết hạn hiện mờ, không chọn được.
9. Tiền mặt: dãy tờ "Đúng tiền / 50.000 / 100.000 / 200.000…" (chỉ tờ lớn hơn số phải trả), mỗi tờ ghi sẵn "trả lại …"; nút "Số tiền
   khác…" mở bàn phím số (có phím 000), báo "Trả lại …" / "Còn thiếu …", nút "Đã nhận tiền" chỉ sáng khi đủ. Dùng chữ "trả lại", không "thối".
10. Chuyển khoản: MỌI chuyển khoản (quầy và App KH) qua QR payOS, máy chủ tự xác nhận khi tiền về — không nút "đã nhận CK" cho nhân viên.
    "Xác nhận tay" chỉ chủ quán / quản lý, bắt buộc lý do, Đối soát hiện riêng. Không trả kết hợp tiền mặt + chuyển khoản trong một đơn.
11. Tiền trong tài khoản khách: tự hiện dòng "Trừ tiền tài khoản −X" khi chọn khách có số dư, có nút Bỏ; tài khoản mẹ là dòng riêng, mặc
    định tắt. Phần còn lại trả bằng tiền mặt hoặc chuyển khoản. Đủ thì chỉ còn nút "Trả đủ bằng tài khoản".
12. PIN khách: đơn có trừ tài khoản HOẶC đổi điểm → khách nhập PIN 4 số (nhân viên xoay máy) lúc chọn cách trả. Sai 5 lần → khoá dùng tài
    khoản và điểm của khách đó 15 phút, quay về giỏ. Khách chưa có PIN: tự đặt trong App KH hoặc tại quầy lần đầu (gõ 2 lần); chưa có PIN
    thì không trừ tài khoản / đổi điểm được. PIN kiểm ở MÁY CHỦ, lưu dạng băm.
13. Giữ rồi mới trừ: PIN đúng → máy chủ GIỮ tiền tài khoản / điểm (không ai tiêu được ở chỗ khác), CHƯA trừ. Đơn xong (tiền mặt nhận /
    payOS báo tiền về / tài khoản trả đủ) → trừ + ghi đơn trong MỘT giao dịch. Huỷ, QR hết hạn (10 phút) → tự nhả, tài khoản nguyên vẹn.
    Tiền về sau khi QR đã hết hạn → ghi lại, Đối soát cảnh báo đỏ, chủ quán xử (hoàn hoặc nạp vào tài khoản khách).
14. Điểm thưởng: tỉ lệ ở Cài đặt (đã có `loyalty_earn_per_amount`). CHỈ tính trên tiền khách trả thật (tiền mặt / chuyển khoản), KHÔNG
    tính phần trừ tài khoản, KHÔNG tính phí giao. Giỏ hiện "Điểm: trước − đổi quà + đơn này = sau"; khách lẻ: "+N điểm — nhận bằng mã".
15. Giao hàng Ahamove ngay ở quầy: nút "Mang đi / tại quán" | "Giao hàng · Ahamove" → nhập địa chỉ + người nhận → "Tính phí Ahamove"
    (chưa tính phí thì chưa thu tiền được) → phí là dòng riêng: không giảm hạng, không áp mã, không tích điểm → thu đủ → màn cuối có nút
    "Đã thu đủ → Gọi xe Ahamove". Hoá đơn in "GIAO HÀNG: <địa chỉ>".
16. Mọi giao dịch kết thúc ở màn "Đã thanh toán · đơn #<số>": ô "Trả lại khách" chữ to (tiền mặt), tab Hoá đơn tờ khách / tờ lưu / Tem ly,
    chọn 2 tờ (mặc định) hoặc 1 tờ cho riêng đơn này, nút "In hoá đơn (2 tờ) + N tem". Hoá đơn CHỈ in khi đã thanh toán thành công.
    Lưới món khoá tới khi bấm In; sau đó "Đơn mới" hoặc chạm món là bắt đầu đơn mới.

## 2. Hoá đơn (THAY bố cục cũ)
- Đầu: tên quán · địa chỉ/SĐT · "SỐ BILL" + số in rất to · nhãn đóng khung GIAO KHÁCH / LƯU QUẦY · QR bên phải số bill · giờ · NV · khách.
- QR = đường dẫn tới web KH để ĐĂNG KÝ tài khoản (khách lẻ: gắn sẵn mã nhận điểm vào đường dẫn). Không còn QR "tra cứu đơn".
- Món: "1 x <tên>" + dòng topping / ghi chú; bên phải giá gốc gạch ngang (nếu có hạng) + giá hạng đậm.
- Tiền: Giá gốc → các khoản giảm (giảm hạng, mã / quà) → Phí giao (+) → TỔNG HÓA ĐƠN (đậm).
- THANH TOÁN: Từ tài khoản · Từ tài khoản mẹ · Chuyển khoản (payOS) hoặc Tiền mặt · "Khách đưa / Trả lại". Tổng các dòng = tổng hoá đơn.
- ĐIỂM THƯỞNG (khách quen): điểm trước đơn · đổi quà · cộng đơn này · điểm hiện có. Khách lẻ: ô MÃ NHẬN ĐIỂM in bằng chữ "+N điểm (24 giờ)".
- 2 tờ giống hệt nhau, chỉ khác nhãn; lời cảm ơn + chính sách chỉ in trên tờ khách. In lại có dòng "IN LẠI · LẦN n".
- Máy in nhiệt gửi lệnh thô không có gạch ngang → in "Giá gốc 96.000 → 86.400".
- Tuỳ chỉnh chữ (mở rộng màn cài đặt hoá đơn hiện có, các khoá `invoice_*`): MỌI chữ trên hoá đơn sửa được, có xem trước ngay, đếm ký tự
  (quá 42 → cảnh báo, giấy 58 mm), bật/tắt từng dòng; chữ tự điền {ten_khach} {hang} {phan_tram} {diem}. KHÔNG sửa được số tiền / điểm /
  số bill; KHÔNG ẩn được: tên quán, số bill, tổng hoá đơn, mục thanh toán. Logic mẫu: demo_2410/logic_tuy_chinh_hoa_don.js.

## 3. Tem ly
Mỗi ly một tem (máy tem riêng, P17): #số bill to · "1/2" · tên món · topping + ghi chú · giờ. Tem in cùng lúc với hoá đơn. Chữ trên tem
tuỳ chỉnh được như hoá đơn.

## 4. Số chạm (để giữ khi làm)
Khách lẻ, một món không tuỳ chỉnh, tiền mặt đúng tờ: chạm món → chạm tờ → In = 3 (món có khung: 4). Chuyển khoản: … → Chuyển khoản →
(PIN nếu có) → tiền tự về → In. Đừng thêm bước xác nhận nào ngoài các bước trên.

## 5. Việc tách ra (mã trong sổ; mã KHÔNG chứa "-d" / "-f")
| Mã | Phần | Loại |
|---|---|---|
| QUAY-AN-1 | Màn hiện tại: ẩn nút Ghi nợ + Chưa thu ngay (trước tuần chạy thử) | [Th] |
| P3 (mở rộng) | QR payOS tự xác nhận + giữ/trừ tài khoản & điểm + PIN + xác nhận tay có lý do | [T] |
| DIEM-THAT-1 | Điểm chỉ trên tiền khách trả thật (mục 1.14) + bất biến I8; chạy SAU P24 | [T] |
| UUDAI-1 | Giá hạng hiển thị + áp lên topping; cài đặt cộng dồn từng mã / quà với giảm hạng; máy chủ chọn cái lợi hơn | [T] |
| TOPPING-1 | Cài đặt topping + ghi chú theo sản phẩm; giá topping; trừ kho SX (lô, hạn); topping trên giỏ / hoá đơn / tem / hoàn | [T] |
| BH-1 | Giao diện màn Bán hàng mới (mục 1, 4, 7, 9, 16) dùng API sẵn có + API của các việc trên; tự theo màn hình | [Th] |
| HD-1 | Hoá đơn bố cục mới + tuỳ chỉnh chữ hoá đơn & tem (mục 2, 3) | [Th] |
| P15 (phần còn lại) | Mã nhận điểm in chữ + QR đăng ký web KH (mã điền sẵn) | [T] |
| GIAO-1 | Thêm luồng giao hàng ở quầy (mục 15) | [T] |
| KH-MUA-1 (đổi tên từ KH-DON-1) | Đặt đơn từ App KH, trả trước bằng QR payOS; đơn chỉ về quầy khi đã trả | [T] |
