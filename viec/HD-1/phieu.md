# HD-1 — Hoá đơn bố cục mới (2 tờ, QR đăng ký App KH, mục thanh toán & điểm) + tuỳ chỉnh chữ hoá đơn và tem

<!-- Phiếu do chat soạn 27.10.2026. Việc thường [Th] — Sonnet, chạy thẳng. Nền: main sau sổ v42 (cha 40e07ce).
     Đặc tả: ban_mau_pos/DAC_TA_BAN_HANG_2410.md mục 2 (hoá đơn) và 3 (tem) — đọc HẾT; logic mẫu tuỳ chỉnh chữ:
     ban_mau_pos/demo_2410/logic_tuy_chinh_hoa_don.js (dữ liệu giả, đọc để hiểu, KHÔNG chép nguyên). Chủ quán đã duyệt, đừng hỏi lại bố cục.
     Gộp vào việc này 27.10: phần còn lại của P15 (QR đăng ký App KH, mã nhận điểm in chữ) và lỗi sổ ghi 26.10 "bill vẫn hứa gấp k điểm
     cho đơn 0 điểm". App KH chuyển sang kho riêng (chat App KH) — địa chỉ app mới chưa có → để trong Cài đặt, chủ quán dán sau.
     Hiện trạng đọc 27.10: ô QR trên hoá đơn (InvoicePreview.jsx) chỉ là ô giữ chỗ chữ "QR"; client chưa có thư viện vẽ QR; chữ mã nhận
     điểm do orders.js (~1225–1255) dựng sẵn, không có số điểm. Chạy SONG SONG: UUDAI-1 (orders.js, Sales.jsx), KHO-1, BH-2 (màn bán
     hàng mới sẽ gọi thành phần in của việc này ở màn kết thúc) → giữ đúng Cấm. -->

## Mục tiêu
Mọi đơn in ra hoá đơn đúng bố cục chủ quán duyệt: 2 tờ GIAO KHÁCH / LƯU QUẦY, số bill to, QR dẫn khách sang App KH để đăng ký (khách
lẻ có sẵn mã nhận điểm), mục tiền – thanh toán – điểm rõ ràng; chủ quán tự sửa mọi chữ trên hoá đơn và tem. Phải xong trước khai trương.

## Nghiệm thu
- A **Một cửa dữ liệu hoá đơn:** `GET /api/pos/hoa-don/:id` (nhân viên đăng nhập) trả MỌI thứ hoá đơn cần: quán, số bill, giờ, nhân viên,
  khách (tên, hạng, %), dòng món (số lượng, tên, ghi chú; giá gốc + giá hạng nếu có), giá gốc → các khoản giảm (hạng, mã / quà) → phí
  giao → tổng; thanh toán (từ tài khoản, từ tài khoản mẹ, chuyển khoản payOS hoặc tiền mặt, khách đưa / trả lại); điểm của đơn; mã nhận
  điểm (nếu có) + số điểm mã đó sẽ cộng; số lần đã in. File mới `server/routes/hoaDon.js`, chỉ ĐỌC, mount một dòng. Hoá đơn ngay sau
  thanh toán và in lại đều vẽ từ cửa này (cùng số, không tự tính tiền ở màn hình).
- B **Bố cục (đặc tả mục 2):** đầu = tên quán · địa chỉ / SĐT · "SỐ BILL" + số rất to · nhãn đóng khung GIAO KHÁCH / LƯU QUẦY · QR bên phải
  số bill · giờ · NV · khách. Món "1 x <tên>" + dòng ghi chú; có hạng → giá gốc gạch ngang + giá hạng đậm. Tiền: Giá gốc → giảm hạng →
  mã / quà → Phí giao (+) → **TỔNG HÓA ĐƠN**. THANH TOÁN: các dòng có thật của đơn; tổng các dòng = tổng hoá đơn. In 2 tờ giống hệt, chỉ
  khác nhãn; lời cảm ơn + chính sách chỉ ở tờ khách; in lại có dòng "IN LẠI · LẦN n". Số tờ mặc định 2 (Cài đặt in đổi được 1/2).
- C **QR đăng ký App KH:** Cài đặt có ô "Địa chỉ đăng ký App KH" dạng mẫu, vd `https://<địa-chỉ-app>/?ma={ma}`. Khách lẻ có mã → `{ma}`
  thay bằng mã nhận điểm; khách quen / không có mã → bỏ phần `?ma=…`. Ô trống → KHÔNG in QR (không in QR chết), Cài đặt nhắc "chưa có
  địa chỉ App KH". Vẽ QR bằng hàm dùng chung `client/src/utils/veQr.js` (BH-2 dùng lại cho QR payOS); đọc thử bằng `jsqr` (đã có)
  trong bài thử: giải mã ra đúng đường dẫn.
- D **Mã nhận điểm & điểm:** khách lẻ có mã → ô "MÃ NHẬN ĐIỂM · +N điểm (nhập trong 24 giờ)" in bằng CHỮ + QR. N = đúng số điểm
  `/api/kh/nhan-diem` sẽ cộng cho mã đó — gọi CÙNG hàm (nếu phép tính đang nằm trong route thì tách ra `server/utils/` không đổi hành vi,
  route cũ gọi lại hàm đó). **N = 0 (đơn Flash, đơn 0 điểm, chương trình tắt) → không hứa điểm**; chỉ còn ưu đãi khách mới nếu chương
  trình đó bật, không có gì thì không in ô. Khách quen: ĐIỂM THƯỞNG = điểm trước đơn · đổi quà (nếu có) · cộng đơn này · điểm hiện có,
  lấy từ sổ điểm của đúng đơn; in lại thì chỉ in phần của đơn (không in số dư lúc in lại như số dư lúc mua).
- E **Tuỳ chỉnh chữ** (mở rộng màn Cài đặt hoá đơn đang có, khoá `invoice_*`): MỌI chữ trên hoá đơn sửa được theo 5 nhóm (Đầu · Tiền hàng
  · Thanh toán · Điểm thưởng · Chân), xem trước ngay (mẫu khách quen / khách lẻ), đếm ký tự (quá 42 → cảnh báo đỏ, giấy 58 mm), bật/tắt
  từng dòng; chữ tự điền {ten_khach} {hang} {phan_tram} {diem}. KHÔNG sửa được số tiền / điểm / số bill; KHÔNG ẩn được: tên quán, số
  bill, tổng hoá đơn, mục thanh toán (máy chủ cũng từ chối lưu khoá ẩn các mục này). Khoá mới seed mặc định như logic mẫu.
- F **Tem ly (đặc tả mục 3):** mỗi ly một tem: #số bill to · "1/2" · tên món · ghi chú · giờ; chữ trên tem tuỳ chỉnh như hoá đơn (≤ 40
  ký tự / dòng). In cùng lúc với hoá đơn như bộ in P16 đang làm.
- G **Phép tính thuần** (dựng dòng hoá đơn từ dữ liệu cửa A + cài đặt; điền chữ tự điền; đếm / cắt ký tự; đường dẫn QR; nhãn 2 tờ; in
  lại) ở MỘT file thuần, có bài thử. Máy in nhiệt lệnh thô (P17, sau) không có gạch ngang → hàm có sẵn dạng chữ "Giá gốc 96.000 → 86.400".
- H **K5:** đơn cũ (trước việc này), đơn khách lẻ không mã, đơn trừ hết bằng tài khoản, đơn đã huỷ đều in được, không vỡ; màn Bán hàng
  cũ và màn mới (BH-1) gọi in như hôm nay vẫn ra hoá đơn mới; tắt QR / thiếu địa chỉ App KH → hoá đơn vẫn đủ phần còn lại.

## Phạm vi
- viec/HD-1/**
- server/routes/hoaDon.js
- server/routes/signup-codes.js
- server/utils/diemThat.js
- server/utils/nhanDiem.js
- server/routes/settings.js
- server/index.js
- server/database.js
- client/src/components/InvoicePrint.jsx
- client/src/components/InvoicePreview.jsx
- client/src/components/InPhieu.jsx
- client/src/pages/InvoiceSettings.jsx
- client/src/utils/inPhieu.js
- client/src/utils/hoaDon.js
- client/src/utils/veQr.js
- client/package.json
- client/package-lock.json
- client/dist/**
- cong_cu/thu_HD1.js
- cong_cu/thu_P16.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — bài mới `cong_cu/thu_HD1.js` phải ĐỎ trên code gốc: hàm thuần G (đủ ca khách quen có hạng, khách lẻ có mã, N = 0, phí giao, trừ
tài khoản + tài khoản mẹ, tiền mặt có trả lại, in lại lần 2, chữ quá 42, khoá không ẩn được); cửa A trên kho thử (đơn thật tạo qua
POST /orders → số trên hoá đơn = số đơn; N = số `/nhan-diem` cộng thật; nhân viên chưa đăng nhập → 401); QR giải mã bằng `jsqr` ra đúng
đường dẫn.

## Bài thử cũ sửa
- cong_cu/thu_P16.js — thêm ca cho bộ in 2 tờ / nhãn tờ nếu cần; ca cũ giữ nguyên

## Ngân sách
~180 dòng máy chủ + ~600 dòng giao diện (sửa + mới) + ~350 dòng thử. `server/index.js`: một dòng mount; `database.js`: chỉ thêm dòng seed
khoá `invoice_*` mới; `kiem_tra_truoc_khi_giao.js`: chỉ thêm tên bài vào cuối mảng.
**Phương án đơn giản nhất đã xét:** sửa thẳng chữ trong `orders.js` và vẽ hoá đơn từ phản hồi tạo đơn — không chọn: orders.js đang được
UUDAI-1 / COMBO-1a sửa, và in lại cần cùng số với lúc mua → một cửa đọc riêng gọn và an toàn hơn.

## Đổi cấu trúc DB
không (chỉ thêm dòng seed `pos_settings`)

## Thư viện mới
có — `qrcode-generator` bản cố định 1.4.4 (MIT, không phụ thuộc gì) ở `client/`, chỉ dùng trong `client/src/utils/veQr.js`.

## Cấm
- KHÔNG sửa `server/routes/orders.js`, `thanh-toan.js`, `wallets.js`, `loyalty.js`, `customers*.js`, `client/src/pages/Sales.jsx`,
  `client/src/pages/BanHang/**` (BH-2 nối màn kết thúc), `server/kho/**`, `app_kh/**`.
- KHÔNG đổi cách tính điểm, hệ số, hạn mã; KHÔNG đổi luật sinh mã bill (chỉ đọc). Dòng combo / topping trên hoá đơn: KHÔNG làm ở đây
  (COMBO-1b / TOPPING-1 thêm sau) — chỉ để chỗ cho "dòng phụ dưới món".
- KHÔNG làm hàng đợi in / trạm in / lệnh thô máy in nhiệt (P17).
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/HD-1`. Không đụng main, không merge,
  không tạo PR.
