# P16 — Xem trước & cài đặt in: bill khách · tem cốc (mỗi ly một tem) · phiếu pha chế · số bản / bật tắt theo loại phiếu · in lại từ màn Đơn hàng — giai đoạn 1 in qua trình duyệt

<!-- Phiếu do chat soạn 18.10.2026. Việc thường [Th] — chạy thẳng tới hết, không chờ duyệt kế hoạch. Nền: main sau sổ việc v37 (cha
     8259a59). Đã có: `client/src/components/InvoicePrint.jsx` (in bill qua trình duyệt, khổ 58mm / 80mm / A5 / A4, khoá cài đặt
     `invoice_config`, `invoice_default_size`…), `InvoicePreview.jsx`, màn `client/src/pages/InvoiceSettings.jsx`, Sales.jsx gọi
     InvoicePrint sau thanh toán; ghi chú món có sẵn (NOTE_PRESETS: Ít đường, Không đá…); cài đặt lưu qua `PUT /api/pos/settings`
     (khoá – giá trị). Chưa có: tem cốc, phiếu pha chế, bật / tắt + số bản theo loại phiếu, nút In lại ở màn Đơn hàng (P13c tách phần in
     lại sang đây). Máy in thật (80mm bill, 40×30 tem) về sau → hàng đợi in / trạm in là P17; ở đây CHỈ in qua hộp thoại in trình duyệt.
     Đơn chưa có trường "nguồn đơn" (quầy / App KH) — KH-DON-1 thêm sau; cài đặt để sẵn chỗ theo nguồn nhưng nay chỉ có "quầy".
     Song song đợt M2: KH-API-1 (Customers.jsx, server/…), DOI-SOAT-1 (Reports.jsx, reports.js), P26d (server/…). Việc này KHÔNG sửa
     server/ (dùng khoá cài đặt sẵn có), KHÔNG sửa Customers.jsx / Reports.jsx.
     19.10: thêm client/dist/** vào Phạm vi (bản dựng bắt buộc; phiếu gốc thiếu — lỗi của chat; cổng PR #35 đỏ A6). -->

## Mục tiêu
Sau khi thu tiền, quầy in đúng bộ giấy cần cho mỗi đơn chỉ bằng MỘT lần bấm (hoặc tự bật hộp in theo cài đặt): bill khách, mỗi ly
một tem dán cốc, một phiếu pha chế cho người pha. Chủ quán xem trước từng loại và chỉnh trong màn Cài đặt hoá đơn. In lại được từ màn
Đơn hàng. Ít nút, ít thao tác.

## Nghiệm thu
- A Tem cốc (khổ 40×30 mm): mỗi ĐƠN VỊ ly một tem (2 ly cùng món = 2 tem, đánh "1/2", "2/2"); tem ghi: tên món, ghi chú món (Ít đường,
  Không đá…), tên / 4 số cuối SĐT khách nếu có, mã đơn rút gọn, giờ. Món không phải đồ uống pha (gói, thẻ, hàng đóng sẵn) KHÔNG in tem
  — dùng trường nhóm / loại sẵn có của sản phẩm; không có trường phân biệt → bật / tắt tem theo NHÓM món trong cài đặt.
- B Phiếu pha chế (khổ 80mm): mã đơn, giờ, danh sách ly cần pha (gộp cùng món + cùng ghi chú: "2 × Trà gừng — Ít đường"), không giá
  tiền.
- C Cài đặt (màn InvoiceSettings, thêm một khối "Bộ in sau thanh toán"): mỗi loại (bill / tem / phiếu pha chế) có Bật/Tắt + Số bản
  (1–3) + khổ; tuỳ chọn "Tự mở in sau thanh toán". Lưu một khoá cài đặt mới bằng `PUT /api/pos/settings` hiện có; đọc thiếu khoá →
  mặc định: bill bật 1 bản, tem bật, phiếu pha chế bật, tự mở in tắt. Có nút Xem trước cho từng loại với đơn mẫu.
- D Sau thanh toán ở màn Bán hàng: một nút "In" in theo cài đặt (bill → tem → phiếu pha chế, mỗi loại số bản đã đặt); "Tự mở in" bật
  thì mở luôn. Không thêm bước bắt buộc nào vào luồng thu tiền; in hỏng / đóng hộp in KHÔNG ảnh hưởng đơn đã lưu.
- E In lại: màn Đơn hàng có nút In lại cho từng đơn → chọn loại (bill / tem / phiếu pha chế) → in; bill in lại ghi "IN LẠI".
- F Mã và giao diện: logic dựng nội dung từng loại tách thành hàm thuần trong `client/src/utils/inPhieu.js` (đầu vào: đơn + cài đặt →
  danh sách trang cần in); thành phần giao diện chỉ vẽ. Có bài thử node cho hàm thuần `cong_cu/thu_P16.js` GỌI THẲNG hàm đó (2 ly → 2
  tem; món không pha → 0 tem; gộp phiếu pha chế; số bản; thiếu cài đặt → mặc định) — chạy bằng `node cong_cu/thu_P16.js`, in dòng tổng
  "n đạt · 0 hỏng". KHÔNG ghép vào danh sách bài của kiem_tra_truoc_khi_giao.js ở việc này (tránh đụng file chung); ghi kết quả chạy
  vào trang_thai.md.
- G Bản dựng client (`npm run build` trong client) thành công; `npm test` và `--day-du` xanh; màn Bán hàng thao tác như cũ khi tắt hết in.

## Bài thử đỏ
không — P16 là việc giao diện in qua trình duyệt, không đụng máy chủ / tiền; hàm dựng nội dung có bài `cong_cu/thu_P16.js` chạy riêng

## Phạm vi
- viec/P16/**
- client/src/utils/inPhieu.js
- client/src/components/InvoicePrint.jsx
- client/src/components/InvoicePreview.jsx
- client/src/components/InPhieu.jsx
- client/src/pages/InvoiceSettings.jsx
- client/src/pages/Sales.jsx
- client/src/pages/Orders.jsx
- client/dist/**
- cong_cu/thu_P16.js

## Ngân sách
~350 dòng giao diện + ~120 dòng hàm thuần + ~120 dòng thử. Sales.jsx: thay đổi nhỏ nhất (gọi một thành phần), không dời khối lớn.
**Phương án đơn giản nhất đã xét:** dùng lại InvoicePrint cho bill; tem và phiếu pha chế là hai bố cục CSS in trong một thành phần
mới; cài đặt một khoá JSON; không hàng đợi in, không chọn máy in (P17).

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- KHÔNG sửa `server/`, `client/src/pages/Customers.jsx`, `client/src/pages/Reports.jsx`, `client/src/App.jsx` (việc song song).
- KHÔNG đổi luồng thu tiền / tạo đơn trong Sales.jsx — chỉ thêm gọi in sau khi đơn đã lưu thành công.
- Không sửa `kiem_tra_truoc_khi_giao.js`, `tu_chay/`, `.claude/`, `.github/`, sổ việc, `cong_cu/gia_lap/**`. Chỉ push đúng
  `git push -u origin viec/P16`. Không đụng `main`, không merge, không tạo PR.
