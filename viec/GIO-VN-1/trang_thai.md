# GIO-VN-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (02.11.2026)
- Nhánh: `viec/GIO-VN-1`; cây sạch.
- HEAD `36b98b8` · FETCH_HEAD `36b98b8` — bằng nhau, không kéo.
- Kho nông (bắt đầu 18.10) → `git fetch -q --unshallow origin viec/GIO-VN-1` để đọc lịch sử cột giờ cho bước nâng cấp 012 (chỉ tải lịch sử, không đổi file).
- `git log --oneline -3`:
  ```
  36b98b8 PHIEU: GIO-VN-1
  2c81b0f TIEN-DO: MANKHACH-1 (ae27536), TU-CHAY-10 (4891879), KHO-IN-1 (d1b57b8) xong; dot quyet dinh 01-02.11 + thiet_ke dot 2 + hop dong v7 (da hen) + lich theo lan; mo GIO-VN-1, HANG-1, NAP-1 — so v53
  d1b57b8 Merge pull request #64 from pos-tuquyduong/viec/KHO-IN-1
  ```

## Bước 2–3
- Đã đọc phiếu, CLAUDE.md, KHUON_LOI.md, LUAT_XAY_APP.md, QUYET_DINH (mục Chung 28.10), code thật (danh sách ở `ke_hoach.md`).
- Kế hoạch: `ke_hoach.md`. Phiếu dặn **chờ duyệt kế hoạch** → commit, push, DỪNG ở bước 3.

## Lượt 2 (`tiep`, 02.11) — chủ quán duyệt kế hoạch
- HEAD `cc45a26` = FETCH_HEAD `cc45a26`, không kéo. `git log --oneline -3`: `cc45a26` ke hoach sua theo soat · `5630f2c` bang cot 012 · `08cac58` ban nhap.
- Chủ quán: **Q1** cho phép đổi giờ sổ ví (có sao lưu) · **Q2** hạn thẻ cũ coi là giờ VN, chỉ đổi dấu cách → T · **Q3** `pos_settings.updated_at`
  để nguyên · **#26** HANG-1 sẽ viết lại khối mua thẻ — chỉ sửa gọn đúng `orders.js:1062-1064`, không chạm dòng khác trong khối · `PHIEN_BAN`
  tăng 1 so với main (main = 5 → 6), chat chỉnh số lúc gộp.
- #26 tính hạn trên `Date.parse(now + 'Z')`; `addMonthsSafe` (`helpers.js:220-227`, chỉ `orders.js:1063` gọi — grep) chuyển sang phép UTC
  (`getUTC*`/`setUTC*`) để kết quả không theo múi giờ máy — khối mua thẻ chỉ đổi dòng 1062 và 1064.

## Bước 4–6 (lượt 2)
- Bài thử `cong_cu/thu_GIOVN1.js` viết TRƯỚC, đỏ trên gốc 36b98b8 (11 đạt · 29 hỏng), xanh trên HEAD (40 đạt · 0 hỏng) — `bang_chung_do.txt`.
- `npm test -- --day-du`: PASS 97 · FAIL 0 · CẢNH BÁO 1 (có sẵn: route GET có lệnh ghi). Build `client/dist` xong.
- Giữa chừng `thu_SAOLUU2` F1 đỏ: khôi phục chuẩn hoá giờ cả file MỚI làm sao lưu → khôi phục không còn y hệt → chỉ chuẩn hoá khi file là bản
  CŨ (`backup_date` không phải giờ VN dạng T — mọi file ghi từ nay mang `backup_date: getNow()`). Không sửa bài cũ.

### Chỗ vá → đột biến (`viec/GIO-VN-1/dot_bien.py`, 26/26 BẮT)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| `nang_cap/012` chạy được | BV-012 | B1 |
| 012: VN dấu cách chỉ đổi T | VS-012-VN-CUNG-CONG-7 | B1 |
| 012: cột lẫn để nguyên (Q3) | VS-012-COT-LAN-CUNG-DOI | B1 |
| 012: đuôi Z có mili-giây | VS-012-Z-THIEU-MAU-MILI-GIAY | B1 |
| 012: sao lưu trước khi đổi | BV-012-SAO-LUU | B2 |
| 012: sổ ví đổi giờ (Q1) | BV-012-SO-VI | B1 |
| 012: hạn thẻ cũ (Q2) | BV-012-HAN-THE | B1 |
| 012: ngày tạo khách (App KH) | BV-012-KHACH | E1 |
| `khoiPhuc.js` chuẩn hoá bản cũ | BV-KHOI-PHUC | B6 |
| `backup.js` chỉ bản cũ mới chuẩn hoá | VS-KHOI-PHUC-MOI-FILE | B6b |
| `damages.js` created_at | BV-DAMAGES | A2d |
| `settings.js` updated_at (3 chỗ) | BV-SETTINGS | A2a |
| `packages.js` | BV-PACKAGES | A2b |
| `settings.js` nhật ký in | BV-IN-HOA-DON | A2c |
| `database.js` gieo dữ liệu | BV-GIEO-CHU | A1 (bước 012 chữa dòng gieo nên chỉ phép quét bắt) |
| `product-groups.js` | BV-NHOM-MON | A2f |
| `products.js` ton_luc | BV-TON-LUC | A1 |
| `client/src/utils/ngayVN.js` | BV-NGAY-MAN-QUAY | A3 |
| phép quét M5 (D) | BV-QUET-M5 | D5 |
| `orders.js:1064` hạn thẻ dạng T | VS-THE-DAU-CACH | C5a |
| `helpers.js` addMonthsSafe UTC | BV-THE-THEO-MUI-GIO-MAY | C5b |
| `doiSoat.js` DEN không bù hai lần | VS-DEN-BU-HAI-LAN | C6 |
| `orders.js:132` hôm nay | BV-HOM-NAY | C7a |
| `settings.js` năm số hoá đơn | BV-NAM-HOA-DON | C7b |
| `sync.js` cảnh báo tồn | BV-SYNC | C11 |
| `HOP_DONG_API_KH.md` | BV-HOP-DONG | E2 |

Tên đột biến: BV-012 · VS-012-VN-CUNG-CONG-7 · VS-012-COT-LAN-CUNG-DOI · VS-012-Z-THIEU-MAU-MILI-GIAY · BV-012-SAO-LUU · BV-012-SO-VI ·
BV-012-HAN-THE · BV-KHOI-PHUC · VS-KHOI-PHUC-MOI-FILE · BV-DAMAGES · BV-SETTINGS · BV-PACKAGES · BV-IN-HOA-DON · BV-GIEO-CHU · BV-NHOM-MON ·
BV-TON-LUC · BV-NGAY-MAN-QUAY · BV-QUET-M5 · VS-THE-DAU-CACH · BV-THE-THEO-MUI-GIO-MAY · VS-DEN-BU-HAI-LAN · BV-HOM-NAY · BV-NAM-HOA-DON ·
BV-SYNC · BV-HOP-DONG · BV-012-KHACH

## Soát độc lập — vòng 1 (agent /ra-soat, nguyên văn)
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
 1. cong_cu/thu_GIOVN1.js:235-303 (phần C) — thiếu hẳn ca C2 (hạn mã giảm valid_to so với getToday), C3 (hạn mã bill issued_at, signup-codes.js:175-176/317-318, hoaDon.js:70), C4 (hạn gói, goiKhach.js:43-59), C10 (phiên QR 10 phút, giuCho.js). Kế hoạch có hứa ở ke_hoach.md:158-160 và :166; phiếu Nghiệm thu C liệt kê "hạn mã, hạn gói, phiên QR 10 phút". Lệnh grep "gomTheoKhach|ngay_chua_lay|signup|discount-codes|thanh-toan|het_han" trong bài ra 0 dòng. trang_thai.md và bang_chung_do.txt không ghi lý do bỏ. — K4 (tài liệu hứa theo đối tượng, phép phủ không đủ) + K1 (kế hoạch nói có ca, thực tế không có).
 2. server/routes/backup.js:505 — đột biến SỐNG, mình chạy trong bản chép ở thư mục nháp, không đụng kho: đổi dòng 505 thành `const ngaySao = getNow();`. Hậu quả: bản sao lưu CŨ khôi phục qua route sẽ không bao giờ được đổi giờ, giờ UTC quay lại kho. Kết quả: thu_GIOVN1 40 đạt · 0 hỏng, thu_SAOLUU2 36 đạt · 0 hỏng. Nguyên nhân: B6b (thu_GIOVN1.js:383-384) chỉ soi CHỮ ở backup.js:508 và :234 (kiểm marker), còn B6 gọi thẳng thucHien({banCu:true}) nên bỏ qua route. Không ca nào chạy route /restore với file có backup_date đuôi Z. — K3 (kiểm sự có mặt của chuỗi, không kiểm hành vi).
 3. server/utils/khoiPhuc.js:12 — utils/ require hàm từ server/nang_cap/012_gio_viet_nam.js. chuanHoaGio là quy tắc dùng ở 2 chỗ nên theo LUAT_XAY_APP §3 phải nằm ở utils/; bước nâng cấp nên đứng yên như lịch sử. Gọn hơn: chuyển COT_CACH + chuanHoaGio sang server/utils/chuanHoaGio.js, bước 012 chỉ gọi lại. — đặt sai chỗ (mục 8), nhẹ.
 4. HOP_DONG_API_KH.md:4 — `NGAY: 2026-10-31` không đổi khi lên v6 (nhật ký ghi 02.11.2026); dòng :24 vẫn ghi "## Các cửa (phiên bản 5)". — K4 (sửa tài liệu không grep câu cùng nghĩa), nhẹ.
 5. viec/GIO-VN-1/trang_thai.md — mục "## Câu hỏi" vẫn ghi "Chờ duyệt kế hoạch" dù Lượt 2 đã duyệt (nói sai hiện trạng). Chưa ghi kết quả `node tu_chay/cong.js chay` (LUAT §6.3), chưa ghi 1–3 thao tác thử tay cho màn Lịch sử đơn / Báo cáo (§6.4), chưa có dòng HEAD ĐÃ KIỂM (cổng A19 đỏ). — K6, quy trình.
NGHI NGỜ:
 - Bước 012 áp luật "đuôi Z → +7 giờ" cho MỌI cột TEXT/DATE/TIME của MỌI bảng (012:432-439), không riêng danh sách đã rà. … giá trị Z từ ngoài vào (SX CSV `sx_start_date`, sync.js:254) cũng bị đổi — ra vẫn đúng giờ VN, không thấy hại, chỉ là vượt câu "giá trị từ ngoài không đụng" ở ke_hoach.md:139.
 - Phân loại cột UTC / VN dựa trên lịch sử git … Phần còn lại (pos_orders, pos_customers, pos_wallets, products …) chưa soát đủ.
 - C7a, C11 và C6 đỏ trên gốc phần lớn vì SQLite `'now'` dùng đồng hồ THẬT, khác đồng hồ giả của bài — không phải vì đo đúng mốc 0–7 giờ.
 - Phép quét M3 (thu_GIOVN1.js:62) không bắt `new Date().toLocaleString()` thiếu timeZone, cũng không bắt `const d = new Date(); d.toISOString()`.
 - client/src/pages/Orders.jsx:92-95: nút "tháng này / tháng trước" vẫn lấy ranh giới tháng theo múi giờ điện thoại — chỉ sai khi máy không đặt giờ VN — nhẹ.
 - E1: khách thử không có đơn / điểm / voucher, nên trường giờ của đơn, điểm, voucher trên /api/kh chưa được đi qua.
NGHIỆM THU:    5/6 mục có bằng chứng · mục thiếu: C (hạn mã, hạn gói, phiên QR 10 phút — 3/8 phép so chưa có ca)
CHƯA SOÁT ĐƯỢC: dữ liệu production thật (Turso) chưa đếm thử bước 012; chưa chạy cong.js chay; chưa thử tay; lịch sử git 17 bảng chỉ soát mẫu.
BÀI HỌC: KHOÁ ca /restore qua route thật (Z / T) thay B6b soi chữ + đột biến ngaySao = getNow(); KHOÁ ke_hoach "Ca thử" ↔ tên ca có thật;
 NGUYÊN TẮC K3: ca đỏ trên gốc vì 'now' của SQLite (đồng hồ thật) phải có đột biến trả lỗi cũ CÙNG đồng hồ giả; NGUYÊN TẮC đặt chỗ: hàm dùng
 chung giữa bước nâng cấp và đường chạy thường ở utils/.
```
(Bản đầy đủ phần NGHI NGỜ / NGHIỆM THU từng mục ở báo cáo agent; chép rút gọn các câu dài đánh dấu "…".)

## Soát độc lập — vòng 2 (agent /ra-soat)
```
KHÔNG ĐẠT — 5 lỗi vòng 1 đã sửa đúng (C2/C3/C4/C10 có ca + đột biến BẮT; B6/B6b qua route thật, đột biến ngaySao = getNow() BẮT; chuanHoaGio ở
utils/; hợp đồng NGAY + "phiên bản 6"; mục Câu hỏi cập nhật). Chạy lại: HEAD 44/0, gốc 16/28, dot_bien 32/32, --day-du 97/0/1.
LỖI TÌM ĐƯỢC:
 1. NẶNG — server/utils/chuanHoaGio.js:19-37 (COT_CACH): bài thử chỉ gieo 6/17 bảng; đột biến tự dựng SỐNG (44/0): R12 xoá pos_orders,
    R13 đổi pos_orders sang VN, R14 xoá pos_wallets (ví), R15 bỏ created_at/updated_at pos_products, R16 xoá pos_discount_codes.valid_to,
    R17 xoá pos_stock_pending. — K3 + K4.
 2. NHẸ — trang_thai.md thiếu 6 tên đột biến (BV-012-BUOC-RONG, VS-KHOI-PHUC-BO-QUA-BAN-CU, BV-HAN-MA-THEO-UTC, BV-HAN-MA-BILL-THEO-UTC,
    BV-HAN-GOI-THEO-UTC, BV-PHIEN-QR-THEO-UTC); cổng A17 ĐỎ; bảng vẫn ghi 26/26. — K6.
 3. NHẸ — vá chỉ canh bằng quét chữ, đột biến lặng SỐNG: R10 backup.js:234 backup_date dấu cách (B6b dựng _Metadata tay, không khứ hồi
    xuất → khôi phục); R4 sync.js:80 exported_at; R9 doSoNo.js:83 '\x20'; R5/R8 customers-v2.js:58-66 (cacheCustomersToLocal); R3 khoiPhuc
    gọi với sao lưu bật. — K3.
 4. NHẸ — C chưa đủ mốc: C3 chỉ 07:00; C9 không có 00:00 (kế hoạch hứa); C7a/C7b một phía (06:59); C11 không mốc. — K1 + K4.
 5. NHẸ — E1 tên "mọi giờ trong /api/kh" nhưng khách không có đơn / điểm / voucher. — K3.
 6. NHẸ — backup.js:339 chú thích sai ("từ khi có getNow" — backup_date dạng T chỉ có từ GIO-VN-1) K1; backup.js:258-280 /export/:table
    không ghi _Metadata → file một bảng của code MỚI khôi phục bị coi là bản cũ. — K4/K5.
 7. NHẸ — hồ sơ còn số cũ (trang_thai "11/29 · 40", bang_chung_do "Sau vá 40" cạnh "SỐ CA 44"). — K1/K4.
NGHI NGỜ: chuanHoaGio.js:45,49,51,60 ghép tên bảng / cột không ngoặc kép (Turso production có thể có bảng / cột cũ tên lạ → 012 hỏng →
 kho 503, bước sau bị chặn); _sao_luu_012_* chép bảng lớn (dung lượng / thời gian Turso chưa đo); Orders.jsx:92-95 ranh tháng theo giờ điện
 thoại (chưa ghi Phát hiện); E2 viết cứng PHIEN_BAN = 6 (gộp HANG-1 / NAP-1 phải sửa bài); lịch sử git chỉ soát một phần.
NGHIỆM THU: 3/6 đủ (A, D, K5) · thiếu: B (11/17 bảng), C (mốc), E (đơn / điểm).
CHƯA SOÁT ĐƯỢC: Turso production; cong.js chay; thử tay; toàn bộ lịch sử git từng cột; hệ ngoài đọc /api/pos/health.timestamp.
BÀI HỌC: KHOÁ mỗi mục bảng phân loại có dòng gieo + đột biến xoá / đổi loại BẮT; KHOÁ khứ hồi xuất → khôi phục qua route; KHOÁ chạy
 cong.js tinh sau mỗi vòng sửa (A17); NGUYÊN TẮC SQL động trên mọi bảng production → ngoặc kép tên; NGUYÊN TẮC tên ca "mọi X" chỉ khi gieo có X.
```

## Câu hỏi
- (không còn — kế hoạch đã duyệt ở Lượt 2)

## Phát hiện
- Kế hoạch soát độc lập (agent chỉ đọc) — 4 câu, đã sửa theo (ghi cuối `ke_hoach.md`).
- `pos_settings.updated_at` có giá trị dấu cách lẫn UTC / VN — không biết chắc, bước 012 để nguyên.
- `formatDateTime` / `formatDate` (`server/utils/helpers.js:79-101`) xuất ra nhưng không ai gọi — code chết, ngoài mục tiêu, không sửa.
