# GIAO-DIEN-2 — trạng thái

## Đối chiếu bản chụp (bước 1)
Phiên đầu: HEAD = FETCH_HEAD = `7021e39`. Phiên tiếp (26.11): HEAD = origin = `b0a81e6` (chat đã ghép main acc8892); kho nông nên chạy `git fetch --unshallow` (chỉ tải lịch sử) để phép G1 của thu_BH2 thấy commit cbbb809.
```
7021e39 PHIEU: GIAO-DIEN-2 tinh gon Quan ly / Cai dat / Khach hang theo mau chu quan duyet, go chu va nut SX — chat ban 41
7da9ba9 Merge pull request #102 from pos-tuquyduong/viec/KHO-3a
0335fee KHO-3a: cong chay DAT, HEAD DA KIEM fab40374
```

## Câu hỏi (đã được chủ quán trả lời)
1. ThanhLuu.jsx sửa nhầm → chủ quán chọn (a) hoàn tác. Chat đã ghép main (b0a81e64); `git diff 7da9ba9 HEAD -- client/src/components/ThanhLuu.jsx` rỗng, cây sạch. Đã build lại `client/dist` (không sinh thay đổi), `--day-du` xanh.
2. Câu "Không còn mục nào của SX." ở chú thích M1: chủ quán đồng ý ưu tiên C4 (bỏ vế đó khỏi màn hình).

## Phát hiện (không sửa)
- KHO-3b: dời tick "nhóm đặc biệt" + "món tặng khách mới" về Kho rồi bỏ nút tạm "Giá bán & nhóm món" (B2).
- Gói kiểu mới: thẻ `packages` (đang tạm ngưng) còn mở được bằng `?the=packages`, không có nút.
- D4: nút "Bán cho khách này" làm ở TOPPING-1 / màn bán hàng mới.
- `CongQr` (trạng thái cổng QR) chỉ hiện ở `/settings` trần; chế độ thẻ riêng (`?the=`) ẩn nó.
- `QuanLy/locKhach.js` đặt trong QuanLy/ vì Phạm vi không cho tạo file mới ở `utils/`; nên dời sang `utils/`.
- Orders.jsx `return_to_stock: damageForm.action === 'return_stock'` giờ luôn false (phiếu cấm đụng thêm dòng khác).
- `Customers.jsx` vẫn ~740 dòng (Phạm vi không cho tạo file mới ở `components/` để tách chi tiết khách).
- `syncApi` trong `utils/api.js` (export / import khách SX) không còn ai gọi — code chết, ngoài C5.
- Form "Thêm khách" còn ô "Sản phẩm / Số chu kỳ" (gốc từ đăng ký SX) — phiếu không nói bỏ, giữ nguyên.
- Cổng A16 với mốc `7021e39^` kéo cả bài thử của DOISOAT-NHANH / TIEN-KHOA-2 (đã ghép main) vào phạm vi → đỏ oan 21 lý do; chạy lại với mốc `acc8892` (điểm ghép main) thì chỉ tính phần của việc này.
- (soát độc lập) Chưa có ca khoá `?the=` lạ / thiếu quyền (hiện thẻ đầu người đó xem được) và chưa có đột biến cho `theHopLe`.
- (soát độc lập) Back trình duyệt khi đang sửa thẻ riêng của Settings (`?the=` đổi), và link "← Quản lý", không hỏi khi còn thay đổi chưa lưu — như rời trang bằng menu trái hôm nay.
- (soát độc lập) Nút "Nạp tiền" hiện với mọi khách có SĐT; thiếu quyền `view_customer_balance` thì ViKhach trả null (khung trống).
- (soát độc lập) Ref `daDayUrl` ở Customers.jsx không reset khi Back; "← Khách hàng" có thể `navigate(-1)` lùi quá một bước (rất hiếm).
- (soát độc lập) Thanh đáy HangThe còn chữ "Có thay đổi chưa lưu" của ThanhLuu, chưa đúng chữ M3 "Hạng <tên> có thay đổi chưa lưu"; menu.js tuKhoa 'hang vang', 'kim cuong' viết cứng tên hạng theo đúng A2 của phiếu.
- thu_HANG1 G1b: phép cũ cấm mọi `confirm(` trong HangThe, nay chỉ cấm trong hàm `xoa` (E1 phiếu dặn hỏi như doiThe — doiThe cũng dùng window.confirm). Ghi rõ vì là nới một phép cũ theo hành vi chủ quán duyệt.

## Bảng chỗ vá → đột biến (dot_bien.py, đối chứng XANH, BẮT 29 · SỐNG 0 · LẠC 0)
- Tìm nhanh (menu.js timMuc): VS-TIM-CO-DAU · VS-TIM-PHAN-BIET-HOA · BV-TIM-QUYEN · VS-ENTER-NHIEU-NUT · BV-QUANLY-KHONG-TIM
- Quyền / nhóm: BV-QUYEN-PIN-CHU-QUAN · BV-NHOM-HET-NUT-VAN-HIEN · BV-CSS-DIEN-THOAI-3-COT
- Mở thẳng `?the=`: BV-SETTINGS-KHONG-DOC-THE · BV-REPORTS-KHONG-NHAN-DOISOAT · BV-HANGTHE-BO-LINK-PIN · BV-SETTINGS-THE-PIN-RONG
- Gỡ SX: VS-ORDERS-CON-RETURN-STOCK · BV-ORDERS-MAT-NHAN-CU · BV-ORDERS-CAU-HUY-SX · BV-APP-REGISTRATIONS-LAC · BV-API-CON-EXPORT · BV-KHACH-CAU-SX
- Lọc khách: VS-LOC-SO-DU-BANG-0 · VS-LOC-HANG-HET-HAN · VS-LOC-SINH-NHAT-LAY-NGAY · BV-LOC-TIM
- Khách hàng: BV-KHACH-BACK-URL · BV-KHACH-DON-CUA-NGUOI-KHAC · BV-KHACH-HOM-NAY-MAY · BV-KHACH-BO-VI
- Hạng / chữ: BV-HANG-KHONG-HOI-KHI-DOI · BV-HANG-BO-PIN-KHI-LUU · BV-THUC-THU-CHU-CU

## Soát độc lập (/ra-soat, nguyên văn rút gọn)
KHÔNG ĐẠT chỉ vì hồ sơ; code không có lỗi chặn. Lỗi: (1) Câu hỏi 1 cũ → đã cập nhật; (2) thiếu G4 + kết quả cổng + báo cáo 7 mục → đã thêm dưới đây; (3) `NGUONG_FETCH` 21 còn dư một chỗ → đã hạ 20 (commit ff3bab46); (4) ke_hoach.md ghi 3 chỗ fetch, thật là 2 → đã sửa; (5) chú thích đầu api.js còn "confirmExport…" → đã sửa. Nghiệm thu 22/24 có bằng chứng lúc soát (thiếu G4, G3 một phần — nay đã bổ sung). Chưa soát được: chạy thật giao diện (Back điện thoại, hai cột ≥ 1024px). Các nghi ngờ đã chép vào Phát hiện. Vòng sửa 1/3.
Cổng sau vòng sửa: thêm ca C6c vào thu_BAO1a.js (A11: bài xanh trên gốc vì chỉ bỏ 2 dòng Registrations; C6c đỏ trên gốc vì file còn, xanh sau vá; SỐ CA 99).

## G4 — ba thao tác thử tay cho chủ quán (điện thoại + máy tính, sau gộp)
1. Quản lý › gõ "pin" → chỉ còn "PIN chủ quán" → mở đúng màn; gõ "giờ" → Giờ mở cửa.
2. Quản lý › Hạng thành viên › sửa % hạng Vàng → thanh đáy hiện → Lưu → hỏi PIN → báo xanh.
3. Khách hàng (điện thoại) › chip "Có số dư" → chạm một khách → chi tiết toàn màn 3 số → "← Khách hàng".

## Cổng
`node tu_chay/cong.js chay . acc8892 HEAD viec/GIAO-DIEN-2` (HEAD 19b4a12b):
✓ CỔNG CHẠY ĐẠT (kèm · CẢNH BÁO A16 thu_BH2 99 ≠ 100 ca: bài dừng sớm trên gốc, bỏ qua theo luật).
`npm test`: PASS 128 · FAIL 0 · CẢNH BÁO 1. `--day-du`: PASS 132 · FAIL 0 · CẢNH BÁO 1 (lần chạy trước khi hạ NGUONG_FETCH; sau hạ chạy lại `npm test` xanh).

## Báo cáo 7 mục
```
VIỆC:        GIAO-DIEN-2 — tinh gọn Quản lý · Cài đặt · Khách hàng theo mẫu đã duyệt; gỡ chữ / nút SX
ĐÃ SỬA:      QuanLy/menu.js + QuanLy.jsx (6 nhóm, timMuc, danh sách điện thoại), Settings.jsx (?the=), CaiDat/PinChuQuan.jsx (mới) + HangThe.jsx (M3),
             Customers.jsx (hai cột / toàn màn, lọc, bỏ chữ SX), Orders.jsx (chỉ 3 chỗ C2), Reports.jsx (chữ Thực thu + tab doisoat), App.jsx (/registrations, /sync → /customers),
             api.js (gỡ hàm export SX), xoá Registrations.jsx + CustomerInput.jsx; cong_cu/thu_GIAODIEN2.js (mới, 121 ca) + 9 bài cũ sửa theo hành vi đã duyệt; NGUONG_FETCH 21→20
BÀI THỬ:     thu_GIAODIEN2: trên gốc 7da9ba9 36 đạt · 85 hỏng (ĐỎ ở A1b, A2a, B1, C1a, C2a, C3a, C4, D2b, E1a, F1, G3…) → sau vá 121 đạt · 0 hỏng. dot_bien.py: 29 BẮT · 0 SỐNG
ĐÃ RÀ K4:    grep "registrations|/sync|return_stock|registrationsApi" client/src → còn App.jsx:66 (Navigate), api.js create, Customers.jsx create, Orders.jsx nhãn cũ — đã xử lý hết; `\bSX\b` ngoài Kho/ chỉ còn chú thích
CHƯA KIỂM:   chạy thật giao diện (Back trình duyệt điện thoại, hai cột ≥ 1024px, hỏi PIN khi lưu hạng) — D1 chỉ khoá bằng regex; ca `?the=` lạ / thiếu quyền; chủ quán thử tay G4 sau gộp;
             lần `--day-du` cuối sau khi hạ NGUONG_FETCH (chỉ chạy lại npm test)
GIT:         19b4a12b GIAO-DIEN-2: thu_BAO1a them ca C6c … · ff3bab46 GIAO-DIEN-2: vong soat 1 …
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 1 · BỎ 2 — xem ## Bài học
```

## Bài học
- KHOÁ 1 (đã làm): thu_BAO1a C6c — bài cũ sửa vì hành vi duyệt đổi mà vẫn xanh trên gốc thì thêm ca ĐỎ trên gốc (A11).
- KHOÁ 2 (đề xuất, ngoài Phạm vi): thêm ca thu_GIAODIEN2 cho `?the=` lạ / thiếu quyền + đột biến `theHopLe` (có thể làm ở việc sau, file trong Phạm vi nên chọn làm luôn nếu chủ quán muốn).
- NGUYÊN TẮC 1 (đề xuất K6 / K4 bổ sung): sau khi ghép main vào nhánh việc, cổng chạy với mốc `<mốc>^` kéo bài của việc khác vào; dùng mốc là điểm ghép main. Dọn mã làm số `fetch` giảm → hạ `NGUONG_FETCH` cùng commit.
- BỎ: người gác chặn lệnh ghép `&&`/`;` nhiều lệnh (chỉ một lần, tách lệnh là xong); kho nông thiếu commit cbbb809 (một lần, đã `--unshallow`).

HEAD ĐÃ KIỂM: 19b4a12b
