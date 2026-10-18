# P16 — trạng thái

## Mở phiên (bước 1)
- Nhánh: viec/P16 · không kéo (HEAD = FETCH_HEAD)
- HEAD `4d6295a` · FETCH_HEAD `4d6295a`
```
4d6295a PHIEU: P16
0bffc03 TIEN-DO: LUOI-5 (c8c20b3), TU-CHAY-8 (8259a59) xong; mo KH-API-1 + P26d + DOI-SOAT-1 + P16; them KH-OTP-1, DONG-CUNG-1; lich KH-OTP-1 — so v37
8259a59 Merge pull request #33 from pos-tuquyduong/viec/TU-CHAY-8
```

## Câu hỏi
(không chặn việc — chủ quán quyết sau)
1. Tem cốc: phiếu cho "dùng trường nhóm/loại sẵn có". Đơn lưu KHÔNG mang nhóm món (`pos_order_items` không có cột category — database.js:273-288),
   nên tem lọc theo `category` (juice / tea) tra từ danh sách sản phẩm bằng `product_code`. Mặc định BẬT cho mọi món thường (trừ gói, thẻ);
   chủ quán tắt nhóm không phải đồ uống pha ở Cài đặt hoá đơn. Sales.jsx:862 còn có cờ `khong_quan_kho` ("Pha khi khách gọi") — có thể
   là tín hiệu chính xác hơn, nhưng chưa biết dữ liệu thật có gán đúng không → chưa dùng. Cần chủ quán chốt.
   Hệ quả ngày đầu: mặc định mọi túi / gói đóng sẵn cũng ra tem + phiếu pha chế, và mỗi đơn mở tới 3 hộp in — chủ quán tắt loại không dùng ở Cài đặt trước khi quầy dùng.
2. DAC_TA luật 4 ghi tờ in lại có "IN LẠI · LẦN n"; phiếu P16 chỉ yêu cầu "IN LẠI". Làm "IN LẠI" (chưa đếm lần; log in vẫn ghi `print_type:'print'`).
   Phiếu và DAC_TA lệch nhau — cần chủ quán chốt có thêm "LẦN n" (phải đếm từ `pos_invoice_logs`) hay không.

## Phát hiện (ngoài phạm vi / không sửa)
- Ô "Khổ mặc định" ở thanh mẫu nhanh của InvoiceSettings (`config.default_size`, lưu trong `invoice_config`) KHÔNG ảnh hưởng việc in: InvoicePrint chỉ đọc
  khoá `invoice_default_size` (seed `'a5'`, database.js:1023), không giao diện nào ghi khoá đó. Khổ bill nay chọn ở khối mới (`invoice_print_set.bill.kho`); ô cũ nên bỏ hoặc nối vào.
- `invoice_config` (InvoiceSettings) vẫn có đường cũ: có cache thì form hiện ngay, bấm Lưu trước khi API về sẽ ghi đè bằng cache/mặc định. Khoá mới `invoice_print_set` đã được chặn riêng (xem soát vòng 3); `invoice_config` giữ nguyên, chưa sửa.
- `Orders.jsx` `handleViewDetail` lỗi thì rơi về `order` của danh sách (không có items) → In lại ra tem/phiếu rỗng (cũ).
- In lại một đơn chưa từng in bill vẫn xin số hoá đơn mới (`getNextInvoiceNumber`) rồi ghi "IN LẠI" (cũ).
- Số tem không có trần: `quantity` rất lớn × số bản ≤ 3 sinh rất nhiều trang (người dùng thấy `×N` ở chip trước khi in).
- `GET /products` (đã cũ) gọi SX và ghi `pos_products` mỗi lần; Orders / Cài đặt gọi thêm một lần khi mở modal in / màn Cài đặt (Sales dùng danh sách sẵn có).

## Bài thử và đột biến (bước 4–6)
- Bài thử: `node cong_cu/thu_P16.js` → `90 đạt · 0 hỏng` (gọi thẳng client/src/utils/inPhieu.js). Chạy trên bản chưa có hàm: sập (xem bang_chung_do.txt).
- Đột biến: `python3 viec/P16/dot_bien.py` → đối chứng xanh, 32 đột biến, 32 BẮT, 0 sống.
- Bảng chỗ vá → đột biến:

| Chỗ (client/src/utils/inPhieu.js) | Đột biến |
|---|---|
| kẹp số bản 1–3 (`soBan`) | VS-P16-SO-BAN-NOI-TRAN · VS-P16-SO-BAN-HA-SAN |
| một ly một tem (`dungTem`) | VS-P16-TEM-MOT-TEM-MOI-DONG |
| gộp phiếu theo món + ghi chú (`dungPhieuPhaChe`) | VS-P16-GOP-BO-GHI-CHU |
| ghi chú `note ?? notes` (`ghiChuMon`) | VS-P16-GHI-CHU-CHI-NOTE |
| cắt chữ tem 40 ký tự (`cat`) | VS-P16-CAT-TEM-SAI-NGUONG · VS-P16-TEN-MON-KHONG-CAT |
| tên / SĐT khách trên tem (`khachTem`) | VS-P16-KHACH-LE-VAN-IN · VS-P16-SDT-LO-DU-SO · VS-P16-TEN-KHACH-KHONG-TRIM |
| giờ HH:mm (`gioHHmm`) | VS-P16-GIO-KHONG-DEM-0 |
| số ly (`soLy`) | VS-P16-LY-LAM-TRON-LEN |
| loại gói / thẻ (`laMonPha`, product_id < 0) | VS-P16-LOC-GOI-NHAM-ID-0 · BV-P16-LOC-GOI-BO-HAN |
| nhóm không pha | BV-P16-LOC-NHOM |
| đọc cài đặt đã lưu (`docBoIn`) | VS-P16-TU-MO-BO-QUA-GIA-TRI-LUU · VS-P16-KHONG-PHA-GIU-RAC |
| cờ in lại | BV-P16-CO-IN-LAI |
| chọn loại / bỏ job rỗng / nhân số bản (`dungBoIn`) | BV-P16-CHON-LOAI · BV-P16-BO-JOB-RONG · VS-P16-NHAN-SO-BAN-TUNG-TRANG |
| đơn huỷ / hoàn tiền không in tem / phiếu | BV-P16-DON-HUY-VAN-IN-TEM · VS-P16-DON-HOAN-TIEN-QUEN |
| phiếu giữ đủ tên (không cắt như tem) | VS-P16-PHIEU-CAT-TEN |
| khách có tên không SĐT | VS-P16-TEN-KHACH-MAT-KHI-KHONG-SDT |
| khổ mặc định / khổ đúng loại | VS-P16-KHO-MAC-DINH-SAI · VS-P16-KHO-PHIEU-NHAN-KHO-BILL |
| JSON cài đặt lạ (`null`, số) | VS-P16-JSON-NULL-NEM |
| số bản lẻ / số ly âm / SĐT có dấu chấm / gộp theo mã | VS-P16-SO-BAN-LAM-TRON-LEN · VS-P16-SO-LY-AM · VS-P16-SDT-CHI-BO-KHOANG-TRANG · VS-P16-GOP-THEO-TEN-MON |

Đã bỏ một đột biến "tương đương" (kiểm mảng JSON — mảng không có khoá nào thì ra mặc định như cũ) kèm dòng mã thừa tương ứng.

## Kết quả chạy (bước 6)
- `(cd client && npm run build)` → thành công (697 kB, đúng cỡ trước đó 673 kB + phần mới).
- `npm test` → PASS 66 · FAIL 0 · CẢNH BÁO 1 (cảnh báo cũ: "route GET có lệnh ghi (3)" ở server/, không phải P16). Số `fetch` trần = 32, đúng ngưỡng, P16 không thêm.
- `node kiem_tra_truoc_khi_giao.js --day-du` → PASS 70 · FAIL 0 · CẢNH BÁO 1 (cùng cảnh báo), "dist đã commit KHỚP với src".
- Hiển thị: dựng thử bằng SSR (vite ssrLoadModule + react-dom/server) — tem 3 trang / phiếu 1 trang có chữ "IN LẠI", InvoicePrint dựng được. Đây KHÔNG phải in thật.

## Thao tác chủ quán thử tay (điện thoại / máy quầy)
1. Cài đặt → Cài đặt hoá đơn → khối "Bộ in sau thanh toán": bấm "Xem trước" ở Tem cốc và Phiếu pha chế (đơn mẫu); tắt loại / nhóm không dùng → "Lưu cài đặt".
2. Màn Bán hàng: bán một đơn 2 ly giống nhau → màn sau thanh toán có 3 ô loại (Bill · Tem ×2 · Phiếu pha chế), bấm "In" → mở lần lượt từng hộp in; thử tắt hết in rồi bán lại: màn thanh toán phải như cũ.
3. Màn Đơn hàng → mở một đơn → "In lại" → chọn loại → in: bill, tem, phiếu đều có dòng "IN LẠI"; đơn đã huỷ chỉ còn bill.

## Soát độc lập — vòng 1 (báo cáo chép từ agent soát, KHÔNG ĐẠT)
Lỗi tìm được và cách xử lý:
1. InvoicePrint — lỗi `fetch invoice/log` (mất mạng / Render ngủ) hoặc một loại in hỏng chặn cả tem + phiếu (cascade) → ĐÃ SỬA: log bọc try/catch (chỉ cảnh báo), mỗi loại một lần thử riêng, báo lỗi một lần ở cuối, `onPrintComplete` chỉ khi không lỗi.
2. In lại đơn đã huỷ vẫn ra tem + phiếu → ĐÃ SỬA ở hàm thuần (`dungBoIn`: đơn `cancelled` chỉ còn bill) + ca D9–D11 + đột biến BV-P16-DON-HUY-VAN-IN-TEM.
3. Bài thử hở (7 đột biến sống: `tu_mo` đã lưu, `khong_pha` lẫn rác, cắt tên món, đệm 0 giờ, làm tròn số ly, trim tên khách, JSON mảng) → ĐÃ SỬA: thêm ca C19–C22, A23–A26 và 7 đột biến; riêng "JSON mảng" là đột biến tương đương → bỏ dòng mã thừa.
4. trang_thai.md thiếu hồ sơ → ĐÃ SỬA (các mục trên).
5. Tự mở in chờ `GET /products` không hạn → ĐÃ SỬA: Sales truyền sẵn bảng nhóm (không gọi lại); nơi khác thôi chờ sau 4 giây (tem in mọi món).
6. "IN LẠI · LẦN n" lệch giữa DAC_TA và phiếu → ghi ở ## Câu hỏi 2, chờ chủ quán.
Nghi ngờ đã xử lý: tem cao 29,5 mm (tránh trang trắng), ghi chú `white-space: pre-line`, nút In khoá khi chưa chọn loại, nhận định "danh sách sản phẩm không đổi" đã bỏ khỏi chú thích.
Nghi ngờ GIỮ nguyên (không kiểm được từ đây): in thật trên Chrome/Edge (afterprint, hộp in liên tiếp, trang trắng cuối, tem 40×30 có tràn khi tên + ghi chú + khách đều rất dài), mã món `pos_products.code` có luôn khớp mã trong danh sách SX không.

## Soát độc lập — vòng 2 (KHÔNG ĐẠT, 6 điểm vòng 1 xác nhận đã sửa đúng)
- Lỗi 1: đơn `refunded` (refunds.js:158) vẫn ra tem/phiếu → ĐÃ SỬA: `DON_KHONG_PHA = ['cancelled','refunded']` + ca D9b + đột biến VS-P16-DON-HOAN-TIEN-QUEN.
- Lỗi 2: phiếu pha chế cố định 72 mm trong khi cài đặt cho chọn 58 mm (chữ bị cắt) → ĐÃ SỬA: bề rộng phiếu theo khổ (52 mm khi 58 mm).
- Lỗi 3: nút In không chờ `sanSang` (Orders chưa có bảng nhóm, in sớm bỏ qua nhóm đã tắt) → ĐÃ SỬA: `disabled` thêm `!sanSang`.
- Đột biến phụ sống (khổ mặc định, tên khách không SĐT, JSON `null`, khổ phiếu lấy khổ bill, số bản lẻ, số ly âm, SĐT có dấu chấm, phiếu cắt tên, gộp theo tên) → ĐÃ SỬA: thêm ca C23–C26, A27–A29, B10–B12 và 10 đột biến; gỡ `kho: null` thừa.
- ke_hoach.md còn tên cũ (`inCacViec`, cache module) → đã cập nhật.
- Nói thẳng: "IN LẠI · LẦN n" (CLAUDE.md §9 luật 4, DAC_TA:41) CHƯA làm — phiếu P16 chỉ yêu cầu "IN LẠI". Đây là chỗ lệch luật 4, chờ chủ quán quyết (Câu hỏi 2).

## Soát độc lập — vòng 3 (KHÔNG ĐẠT, 3 lỗi vòng 2 xác nhận đã sửa đúng; nghiệm thu 7/7)
- Lỗi duy nhất có đường chạy thật: InvoiceSettings — màn có cache hiện form ngay, `boIn` là mặc định cho tới khi API về; bấm "Lưu cài đặt" lúc đó (Render vừa ngủ dậy, hoặc API hỏng) ghi đè `invoice_print_set` đã lưu bằng mặc định (tem + phiếu bật lại cho mọi món, tự mở tắt) → ĐÃ SỬA: cờ `boInDaNap` (chỉ true khi đọc được từ máy chủ); chưa nạp thì khối bộ in bị `<fieldset disabled>` và `saveConfig` KHÔNG gửi khoá `invoice_print_set`. Mã giao diện, không có bài thử tự động (CHƯA KIỂM bên dưới).
- 32 đột biến phụ của người soát: 14 bắt, 18 sống — 9 cái tương đương / không với tới được; còn lại nhẹ (khổ A4, nội dung `DON_MAU`, chuỗi "Infinity", đơn thiếu `code`) → KHÔNG thêm ca (không gây sai tiền, đơn thật luôn có mã); ghi để chủ quán biết.
- Nghi ngờ giữ nguyên: phiếu 58 mm rộng 52 mm — máy 58 mm thường chỉ in ~48 mm, có thể vẫn cắt mép; `chon` / `paperSize` của InvoicePrint chỉ đọc cài đặt lúc mở modal (cài đặt nạp chậm thì bộ in theo mặc định cho đơn đó); đơn huỷ / hoàn tiền hiện câu "không có món cần tem" (chỉ là lời hiển thị); `khach` trên tem không cắt 40 ký tự.
- Vòng sửa đã dùng 3/3 (`so_vong_sua_toi_da`); lỗi vòng 3 đã sửa, KHÔNG soát lại vòng 4 — chủ quán / chat soát xem diff `InvoiceSettings.jsx` (khoảng 12 dòng).

## CHƯA KIỂM
- In THẬT: chưa có trình duyệt + máy in trong môi trường này. Chưa kiểm, TỪNG KHỔ: tem 40×30 (có tràn khi tên + ghi chú + khách đều dài, chỉ ước tính ~29,7 mm so với 27 mm khả dụng); phiếu 80 mm; phiếu 58 mm (bề rộng 52 mm chỉ tính tay); bill 58/80/A5/A4 qua iframe thay cho `window.open` cũ. Chưa kiểm: iframe ẩn in được và mở liên tiếp 2–3 hộp in; `afterprint` trên Safari/Firefox (không báo thì chờ 60 giây rồi gỡ iframe, có thể gỡ hộp in còn mở); trang trắng cuối; chế độ in tự động (kiosk) của quầy.
- Giao diện: khối Cài đặt, lưu khoá `invoice_print_set` qua `PUT /api/pos/settings`, chip chọn loại, "Tự mở in", và chặn Lưu khi chưa nạp (`boInDaNap`) — không có bài thử tự động (chỉ build + SSR dựng). Thử tay: mở Cài đặt hoá đơn lúc mạng chậm, khối "Bộ in" phải mờ cho tới khi nạp xong.
- Mã món trong danh sách sản phẩm có khớp `product_code` của đơn trên dữ liệu thật hay không; cờ `khong_quan_kho` (xem Câu hỏi 1).
- Phiếu chỉ dặn chạy `node tu_chay/cong.js chay` — kết quả ghi ở mục cuối.

## Bài học
Sự cố của việc này: bài thử đỏ bất ngờ (3 đột biến sống ở lần đầu; 7 + 9 + 18 đột biến phụ sống ở ba lần soát); lỗi người soát bắt (đơn huỷ rồi hoàn tiền vẫn in tem/phiếu; log hoá đơn chặn tem/phiếu; phiếu 58 mm bị cắt; nút In không chờ bảng nhóm; Lưu ghi đè khoá mới bằng mặc định); lệnh bị người gác chặn B-PHANTICH 3 lần (heredoc python ghi file, `$'…'` trong grep, nối `node … ; node …`); không vượt ngân sách quá nhiều (khoảng 450 dòng giao diện + 150 hàm thuần + 220 thử so với 350 + 120 + 120 — thử vượt vì nhiều ca K3).

**KHOÁ 1 (làm luôn, trong Phạm vi):** `cong_cu/thu_P16.js` ca C19–C26, A23–A29, B10–B12, D9–D11 + 10 đột biến mới trong `dot_bien.py` — lý do: ba vòng soát đều thấy đột biến sống ở trường cấu hình / giá trị mặc định; mỗi trường cấu hình có ca "đã lưu thì đọc ra đúng", mỗi mặc định có ca không truyền gì.
**KHOÁ 2 (đề xuất, ngoài Phạm vi):** phép kiểm tĩnh trong `kiem_tra_truoc_khi_giao.js` — mọi `api.saveConfig`/`PUT /settings` mới ở `client/src/pages/*Settings*.jsx` phải loại khoá chưa nạp (mẫu: khoá nằm sau cờ `…DaNap`); ca đỏ: bản trước vá (`saveConfig(config, boIn)` không điều kiện) phải đỏ. Chưa làm: việc chủ quán / `HOC-<n>`.
**NGUYÊN TẮC 1 (đề xuất K9, ngoài Phạm vi):** "Lưu ghi đè bằng mặc định". Đã gây: P16 thêm khoá `invoice_print_set` vào form có cơ chế "cache hiện ngay" → bấm Lưu lúc API chưa về làm mất cài đặt tem/phiếu đã đặt. Dấu hiệu: thêm khoá cài đặt mới vào form đã tải bất đồng bộ. Chặn: khoá không có trong cache thì khối giao diện bị khoá + không gửi khoá đó cho tới khi nạp xong; sửa lỗi "tải hỏng" thì rà cả cửa sổ đang tải (K4).
**NGUYÊN TẮC 2 (đề xuất bổ sung K5, ngoài Phạm vi):** khi thêm việc in / ghi mới ở màn lịch sử đơn, liệt kê MỌI giá trị `pos_orders.status` thật (completed · cancelled · refunded) — P16 chỉ chặn `cancelled` ở lần đầu, `refunded` sót tới vòng 2. Và: mỗi lựa chọn trong danh sách cài đặt (khổ 58 mm) phải có bố cục tương ứng, không thì đừng liệt kê.
**NGUYÊN TẮC 3 (K1, đề xuất):** chú thích mô tả hành vi trình duyệt ("iframe không dính chặn popup", "danh sách sản phẩm không đổi") phải ghi CHƯA KIỂM; hồ sơ việc phải có kết quả `npm test` / `--day-du` / `cong.js chay` ngay mục Kết quả chạy.
**BỎ 3:** (a) lệnh bị người gác chặn do cú pháp — chỉ vì dùng heredoc/`;`, đã chuyển sang Edit + lệnh đơn; (b) gõ nhầm "phiên"→"phiếu" làm Edit hỏng một lần — một lần; (c) cảnh báo "route GET có lệnh ghi (3)" là cảnh báo cũ của server/, không thuộc việc này.
Dọn: không có lời dặn nào trong KHUON_LOI.md / CLAUDE.md mới có phép kiểm làm thay nhờ việc này; KHUON_LOI.md không đổi.

## Báo cáo 7 mục
```
VIỆC:        P16 — Xem trước & cài đặt in: bill khách · tem cốc · phiếu pha chế · số bản / bật tắt · in lại
ĐÃ SỬA:      client/src/utils/inPhieu.js (MỚI, hàm thuần) · client/src/components/InPhieu.jsx (MỚI: vẽ tem/phiếu, in iframe) ·
             InvoicePrint.jsx (chip loại, nhiều loại in, IN LẠI, tự mở in, cách ly lỗi từng loại) · InvoiceSettings.jsx (khối "Bộ in sau thanh toán",
             lưu khoá invoice_print_set, chặn Lưu khi chưa nạp) · Orders.jsx (nút "In lại" + inLai) · Sales.jsx (một prop nhomTheoMa) ·
             cong_cu/thu_P16.js (MỚI) · viec/P16/dot_bien.py (MỚI) · client/dist (build lại)
BÀI THỬ:     chạy trên bản chưa có inPhieu.js → ĐỎ (sập, thoát 2: không tìm thấy module); sau khi vá → XANH 90 đạt · 0 hỏng; 32 đột biến, 32 BẮT, 0 sống
ĐÃ RÀ K4:    grep "InvoicePrint\|window.print\|window.open" client/src → InvoicePrint chỉ gọi ở Sales.jsx và Orders.jsx (2 chỗ, đã xử lý); đơn vừa tạo vs đã lưu (note/notes, product_id âm) xử lý cùng một hàm;
             mọi trạng thái đơn (completed · cancelled · refunded) đã liệt kê; mọi loại in nằm trong cùng vòng try/catch từng loại
CHƯA KIỂM:   xem mục "CHƯA KIỂM" ở trên — in THẬT trên trình duyệt + máy in (iframe ẩn, afterprint, hộp in liên tiếp, từng khổ tem 40×30 / phiếu 80 & 58 mm / bill),
             giao diện Cài đặt + chặn Lưu khi chưa nạp (không có bài thử tự động), mã món khớp dữ liệu SX thật, "IN LẠI · LẦN n" (chưa làm, lệch luật 4 DAC_TA — chờ chủ quán)
GIT:         xem dòng git log ở cuối file
BÀI HỌC:     KHOÁ 2 (1 làm, 1 đề xuất) · NGUYÊN TẮC 3 (đề xuất, ngoài Phạm vi) · BỎ 3 — chi tiết ở ## Bài học
```

## Đếm nghiệm thu (từng mục có bằng chứng)
- A tem cốc: thu_P16.js A1–A29 (2 ly → 2 tem "1/2","2/2"; ghi chú; tên + 4 số cuối SĐT; mã rút gọn; giờ; gói/thẻ → 0 tem; nhóm tắt → 0 tem; cắt 40 ký tự). Phần VẼ khổ 40×30: chỉ SSR dựng + đọc code — CHƯA KIỂM in thật.
- B phiếu pha chế: thu_P16.js B1–B12 (gộp cùng món + ghi chú, không giá, giữ đủ tên). Phần vẽ 80/58 mm CHƯA KIỂM in thật.
- C cài đặt: thu_P16.js C1–C26 (mặc định, kẹp 1–3, khổ, JSON hỏng) + khối InvoiceSettings.jsx (BoInCaiDat) + `saveConfig` qua `PUT /api/pos/settings` hiện có; giao diện không có bài thử tự động.
- D sau thanh toán: thu_P16.js D1–D11 (thứ tự, nhân bản, tắt hết → rỗng); InvoicePrint.jsx handlePrint (cách ly lỗi từng loại, đơn đã lưu không bị ảnh hưởng), Sales.jsx chỉ thêm 1 prop; tự mở in: InvoicePrint.jsx useEffect (CHƯA KIỂM tay).
- E in lại: thu_P16.js E1–E5 (cờ inLai, chọn loại), Orders.jsx nút "In lại" + prop `inLai`, bill có dải "IN LẠI" (InvoicePrint.jsx).
- F hàm thuần: `client/src/utils/inPhieu.js` + `node cong_cu/thu_P16.js` → "90 đạt · 0 hỏng" (ghi ở mục Bài thử).
- G: build thành công; `npm test` PASS 66 · FAIL 0; `--day-du` PASS 70 · FAIL 0; màn Bán hàng: diff Sales.jsx chỉ thêm prop `nhomTheoMa` (luồng thu tiền không đổi).
