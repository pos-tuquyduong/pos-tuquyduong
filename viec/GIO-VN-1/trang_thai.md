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
- Bài thử `cong_cu/thu_GIOVN1.js` viết TRƯỚC, đỏ trên gốc 36b98b8, xanh trên HEAD — số mới nhất (sau vòng sửa 2): gốc 17 đạt · 29 hỏng,
  HEAD 46 đạt · 0 hỏng; sau vòng sửa 4: gốc 17 đạt · 32 hỏng, HEAD 49 đạt · 0 hỏng (`bang_chung_do.txt`).
- `npm test -- --day-du`: PASS 97 · FAIL 0 · CẢNH BÁO 1 (có sẵn: route GET có lệnh ghi). Build `client/dist` xong.
- Giữa chừng `thu_SAOLUU2` F1 đỏ: khôi phục chuẩn hoá giờ cả file MỚI làm sao lưu → khôi phục không còn y hệt → chỉ chuẩn hoá khi file là bản
  CŨ (`backup_date` không phải giờ VN dạng T — mọi file ghi từ nay mang `backup_date: getNow()`). Không sửa bài cũ.

### Chỗ vá → đột biến (`viec/GIO-VN-1/dot_bien.py`, 48/48 BẮT sau vòng sửa 4)
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
| bước 012 chỉ gọi `chuanHoaGio` (vòng 1) | BV-012-BUOC-RONG | B1 |
| `backup.js` đọc backup_date của file (vòng 1) | VS-KHOI-PHUC-BO-QUA-BAN-CU | B6 |
| `diemKhach.js` hạn mã khách mới — hồi quy (vòng 1) | BV-HAN-MA-THEO-UTC | C2 |
| `signup-codes.js` hạn mã bill — hồi quy (vòng 1) | BV-HAN-MA-BILL-THEO-UTC | C3 |
| `goiKhach.js` ngày chưa lấy gói — hồi quy (vòng 1) | BV-HAN-GOI-THEO-UTC | C4 |
| `giuCho.js` phiên QR — hồi quy (vòng 1) | BV-PHIEN-QR-THEO-UTC | C10 |
| `chuanHoaGio.js` COT_CACH từng mục (vòng 2) | BV-012-DON · VS-012-DON-KIEU-VN · BV-012-VI · BV-012-MON · BV-012-MA-GIAM · BV-012-TON-CHO · BV-012-NHOM-MON · VS-012-COT-THUA | B1c |
| `backup.js` themTrangMeta backup_date dạng T (vòng 2) | VS-SAO-LUU-NGAY-DAU-CACH | B6b |
| `khoiPhuc.js` không sao lưu khi khôi phục (vòng 2) | VS-KHOI-PHUC-CO-SAO-LUU | B6c |
| `sync.js` cảnh báo đã xuất > 2 ngày (vòng 2) | BV-SYNC-DA-XUAT | C11 |
| `doSoNo.js` resolved_at (vòng 4) | BV-DOSONO-DAU-CACH | A2i |
| `customers-v2.js` cacheCustomersToLocal (vòng 4) | BV-KHACH-SX-CACHE · BV-KHACH-SX-CAP-NHAT | A2j |
| `chuanHoaGio.js` MAU_CACH đủ 19 ký tự (vòng 4) | VS-012-MAU-THIEU-GIAY · VS-012-MAU-NOI-HET | B1d |

Tên đột biến: BV-012 · VS-012-VN-CUNG-CONG-7 · VS-012-COT-LAN-CUNG-DOI · VS-012-Z-THIEU-MAU-MILI-GIAY · BV-012-SAO-LUU · BV-012-SO-VI ·
BV-012-HAN-THE · BV-KHOI-PHUC · VS-KHOI-PHUC-MOI-FILE · BV-DAMAGES · BV-SETTINGS · BV-PACKAGES · BV-IN-HOA-DON · BV-GIEO-CHU · BV-NHOM-MON ·
BV-TON-LUC · BV-NGAY-MAN-QUAY · BV-QUET-M5 · VS-THE-DAU-CACH · BV-THE-THEO-MUI-GIO-MAY · VS-DEN-BU-HAI-LAN · BV-HOM-NAY · BV-NAM-HOA-DON ·
BV-SYNC · BV-HOP-DONG · BV-012-KHACH · BV-012-BUOC-RONG · VS-KHOI-PHUC-BO-QUA-BAN-CU · BV-HAN-MA-THEO-UTC · BV-HAN-MA-BILL-THEO-UTC ·
BV-HAN-GOI-THEO-UTC · BV-PHIEN-QR-THEO-UTC · BV-012-DON · VS-012-DON-KIEU-VN · BV-012-VI · BV-012-MON · BV-012-MA-GIAM · BV-012-TON-CHO ·
BV-012-NHOM-MON · VS-012-COT-THUA · VS-SAO-LUU-NGAY-DAU-CACH · VS-KHOI-PHUC-CO-SAO-LUU · BV-SYNC-DA-XUAT · BV-DOSONO-DAU-CACH ·
BV-KHACH-SX-CACHE · BV-KHACH-SX-CAP-NHAT · VS-012-MAU-THIEU-GIAY · VS-012-MAU-NOI-HET

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

## Soát độc lập — vòng 3 (agent /ra-soat, lần soát cuối)
```
KHÔNG ĐẠT (chỉ còn lỗi NHẸ) — lỗi NẶNG vòng 2 đã sửa đúng (R12–R17 + N12, N13, R1, R11 BẮT ở B1c); A17 xanh; R10 / R3 / R4 / R2 BẮT; mốc C
đủ; E1 có đơn + điểm (N16 BẮT); backup.js _Metadata đủ (N5 / N5b bị thu_SAOLUU2 E6 / F1 bắt); hồ sơ khớp số chạy. Chạy lại: HEAD 46/0, gốc
17/29, dot_bien 43/43, --day-du 97/0/1, cong.js tinh chỉ A19.
LỖI TÌM ĐƯỢC:
 1. viec/GIO-VN-1/trang_thai.md (## Phát hiện, dòng "doSoNo.js … cacheCustomersToLocal … cần SX thật để chạy") — lý do khai SAI.
    cong_cu/thu_GIOVN1.js:168-171 đã thay sxApi bằng bản giả; cong_cu/thu_P26c.js:61 + :539-550 đã chạy doSoNo() với SX GIẢ;
    customers-v2.js:23-38 chỉ cần biến môi trường khoá SX + callSxApi giả. Đột biến R9 / N17 (doSoNo.js:83 resolved_at dấu cách), R5, R8
    (customers-v2.js:58-66) vẫn SỐNG 46/0. — K1 + K3 — NHẸ
 2. server/utils/chuanHoaGio.js:15 (MAU_CACH) — lời hứa "mẫu GLOB đủ độ dài, giá trị lạ không đụng" không có ca nào khoá. N15 (khớp tiền tố,
    bỏ phần giây) SỐNG 46/0; N2 '${NGAY} *' SỐNG. Code hiện tại đúng; thiếu ca "giá trị lạ / thiếu giây trong cột đã phân loại → không đổi". — K3 — NHẸ
 3. server/routes/backup.js:134-141 — khối chú thích P26d của chanTrangTien nay nằm NGAY TRÊN themTrangMeta, tách khỏi chanTrangTien
    (backup.js:143). Sửa: dời themTrangMeta lên trên khối /** P26d */. — K1 (TU-CHAY-6) — NHẸ
NGHI NGỜ: N11 thêm pos_registrations.created_at: UTC vào COT_CACH SỐNG (hôm nay vô hại — cột chỉ ghi getNow dạng T); CONG7 trên ngày không có
 thật ('2026-13-45 …') → NULL (cột NOT NULL làm 012 hỏng → kho 503; cột cho NULL mất giờ, có sao lưu); khôi phục bản cũ chạy chuanHoaGio trên
 MỌI bảng, không sao lưu; dung lượng / thời gian _sao_luu_012_* trên Turso chưa đo.
NGHIỆM THU: 6/6 mục có bằng chứng — A · B · C (C1–C11) · D · E · K5 · mục thiếu: không
CHƯA SOÁT ĐƯỢC: Turso production; cong.js chay; thử tay; hệ ngoài đọc /api/pos/health.timestamp; lịch sử git từng cột (kiểm tay '+7 hours',
 'localtime'); route phía SX đọc giờ POS (người gác chặn grep có chữ khoá).
BÀI HỌC: KHOÁ ca giá trị lạ (thiếu giây, mili-giây, chữ rác) vào cột đã phân loại + đột biến nới mẫu GLOB; KHOÁ dòng Phát hiện "cần X thật"
 phải nêu đã tìm khuôn giả chưa; NGUYÊN TẮC chèn hàm giữa file → kiểm khối /** */ ngay trên chỗ chèn; NGUYÊN TẮC mỗi chỗ gọi hàm chung là một
 chỗ vá (themTrangMeta: export-all ← thu_SAOLUU2 E6 / F1, export/:table ← B6b).
```
→ Hết 3 vòng, lần soát cuối chỉ còn lỗi NHẸ (không tiền / điểm / ví, không lộ thông tin, không ngoài Phạm vi) → **vòng sửa 4** ngay trong
phiếu (LUAT §6.5), chỉ đúng 3 lỗi trên + ca thử + đột biến. Không gọi agent soát nữa.

## Câu hỏi
- (không còn — kế hoạch đã duyệt ở Lượt 2)

## Phát hiện
- `client/src/pages/Orders.jsx:92-95` nút "tháng này / tháng trước" lấy ranh tháng theo giờ của điện thoại (getFullYear / getMonth) — đúng khi
  điện thoại đặt giờ VN (quầy hiện nay), chỉ lệch khi máy đặt múi khác. Không sửa trong việc này.
- `cong_cu/thu_GIOVN1.js` E2 viết cứng `PHIEN_BAN = 6` (chủ quán: tăng 1 so với main) — HANG-1 / NAP-1 cùng tăng thì chat sửa số ở bài lúc gộp.
- `/api/pos/health` `timestamp` đổi từ đuôi Z sang giờ VN dạng T — chưa biết hệ ngoài (SX, theo dõi) có đọc trường này không.
- (vòng sửa 4) dòng cũ "doSoNo / cacheCustomersToLocal cần SX thật" khai SAI — đã có khuôn SX giả (thu_P26c.js); nay có ca A2i, A2j + đột biến.
- Bước 012 trên ngày không có thật khớp mẫu (vd '2026-13-45 10:00:00') → strftime ra NULL; cột NOT NULL thì bước hỏng → kho 503 (quầy vẫn bán).
  Chưa thấy dữ liệu kiểu này; chưa đếm trên Turso. Thêm cột thừa vào COT_CACH ở bảng chỉ ghi getNow không bị chặn hết (chỉ 3 cột canh).
- Kế hoạch soát độc lập (agent chỉ đọc) — 4 câu, đã sửa theo (ghi cuối `ke_hoach.md`).
- `pos_settings.updated_at` có giá trị dấu cách lẫn UTC / VN — không biết chắc, bước 012 để nguyên.
- `formatDateTime` / `formatDate` (`server/utils/helpers.js:79-101`) xuất ra nhưng không ai gọi — code chết, ngoài mục tiêu, không sửa.

## Vòng sửa 4 (LUAT §6.5 — chat soát thay)
Đúng 3 lỗi NHẸ của lần soát cuối, mỗi lỗi ca thử + đột biến:
1. Khai sai "cần SX thật" → ca A2i (doSoNo, SX giả bật / tắt được), A2j (bộ nhớ đệm khách SX); đột biến BV-DOSONO-DAU-CACH, BV-KHACH-SX-CACHE,
   BV-KHACH-SX-CAP-NHAT BẮT. Dòng Phát hiện sai đã sửa.
2. Mẫu GLOB → ca B1d (5 giá trị lạ trong cột UTC giữ nguyên); đột biến VS-012-MAU-THIEU-GIAY, VS-012-MAU-NOI-HET BẮT.
3. `backup.js`: `themTrangMeta` dời lên TRÊN khối chú thích P26d — chú thích lại dính đúng `chanTrangTien`.
Chạy: thu_GIOVN1 HEAD 49 đạt · 0 hỏng, gốc 17 đạt · 32 hỏng; dot_bien 48/48 BẮT; `npm test -- --day-du` PASS 97 · FAIL 0 · CẢNH BÁO 1 (có sẵn),
dist KHỚP src.
SOÁT LẦN CUỐI: chat soát thay

## Thử tay trên điện thoại (chủ quán, sau khi Merge + Render chạy lại)
1. Sáng sớm (trước 7 giờ) mở **Lịch sử đơn** — ô ngày mặc định phải là HÔM NAY, các đơn bán từ 0 giờ hiện ra.
2. Mở **Báo cáo** — ngày mặc định hôm nay, "từ ngày" là ngày 1 của tháng này.
3. **Cài đặt → Sao lưu → Tải về** — tên file mang ngày hôm nay theo giờ VN.

## Báo cáo 7 mục
```
VIỆC:        GIO-VN-1 — Mọi giờ lưu / so / trả ra là giờ Việt Nam (UTC+7), dữ liệu cũ đổi qua bước nâng cấp có sao lưu
ĐÃ SỬA:      server/database.js (gieo dữ liệu: 14 chỗ truyền getNow) · server/routes/{damages,products,customers-v2,settings,packages,backup,
             sync,registrations,users,product-groups}.js + server/index.js + server/kho/nhapSx.js + server/utils/doSoNo.js — mọi
             CURRENT_TIMESTAMP / datetime('now'[, '+7 hours']) / toISOString / INSERT bỏ trống cột DEFAULT → getNow / getToday (ke_hoach.md A.1–A.5)
             · server/routes/orders.js:132 hôm nay = getToday; :1063-1065 (= 1062-1064 gốc) hạn thẻ tính trên giờ VN, dạng T · server/utils/
             helpers.js addMonthsSafe phép UTC (chỉ orders.js gọi) · server/utils/doiSoat.js:221 DEN chỉ bù +7 cho dòng cũ dấu cách ·
             server/utils/chuanHoaGio.js (MỚI — quy tắc đổi giờ cũ, COT_CACH 17 bảng) + server/nang_cap/012_gio_viet_nam.js (gọi lại) ·
             server/utils/khoiPhuc.js + routes/backup.js: khôi phục bản sao lưu CŨ đổi giờ, bản mới y nguyên (_Metadata cho mọi file xuất) ·
             client/src/utils/ngayVN.js (MỚI) + pages/{Orders,Reports,Settings}.jsx + utils/api.js: ngày theo giờ VN; build client/dist ·
             HOP_DONG_API_KH.md v6 (bỏ "Lỗi đã biết", NGAY, nhật ký) · kiem_tra_truoc_khi_giao.js chạy thêm thu_GIOVN1.js
BÀI THỬ:     cong_cu/thu_GIOVN1.js chạy trên gốc 36b98b8 → ĐỎ 17 đạt · 32 hỏng (A1 63 vi phạm quét, A2*, A3, C5–C7, C11, B*, E*); sau vá → XANH
             49 đạt · 0 hỏng. Đột biến viec/GIO-VN-1/dot_bien.py 48/48 BẮT. npm test -- --day-du PASS 97 · FAIL 0.
ĐÃ RÀ K4:    grep "CURRENT_TIMESTAMP|datetime('now'|date('now'|localtime|toISOString()|'+7 hours'|7 * 3600|new Date().get" trong server/ → 63 chỗ
             (phép quét A1 đếm, gồm 18 INSERT bỏ trống cột DEFAULT) → đã xử lý hết, còn 2 ngoại lệ có lý do (doiSoat dòng cũ, chuanHoaGio +7);
             chỗ đọc bù +7 (doiSoat) + đường khôi phục sao lưu (khoiPhuc / backup export-all + export/:table) + client/src toISOString().slice(0, 10)
             (Orders, Reports, Settings, api.js) đã xử lý.
CHƯA KIỂM:   bước 012 trên dữ liệu Turso THẬT (số dòng đổi từng bảng, thời gian, dung lượng _sao_luu_012_*) — chỉ thử trên kho tạm; phân loại cột
             dựa vào rà lịch sử git (agent phụ + kiểm tay một phần), không có bản chụp production; nút "tháng này / tháng trước" Lịch sử đơn theo
             giờ điện thoại; hệ ngoài đọc /api/pos/health.timestamp (đổi Z → T); màn quầy chưa thử tay trên điện thoại; E2 viết cứng PHIEN_BAN 6
             (gộp HANG-1 / NAP-1 phải sửa số); phép quét M3 không bắt `const d = new Date(); d.toISOString()` hay toLocaleString thiếu timeZone.
GIT:         69b8ba4 GIO-VN-1: vong sua 4 xong — bang chung, bao cao 7 muc, bai hoc, thu tay
             8ce618e GIO-VN-1: vong sua 4 — dot bien doSoNo, khach SX, mau GLOB
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 3 · BỎ 2 — chi tiết ở ## Bài học
```

## Bài học
Sự cố của việc: kế hoạch hứa ca C2/C3/C4/C10 rồi bỏ sót (vòng 1); ca khôi phục sao lưu soi chữ (vòng 1); bảng phân loại 17 bảng chỉ canh 6
(vòng 2, NẶNG); khai "cần SX thật" trong khi khuôn SX giả có sẵn, mẫu GLOB không ca khoá, chèn hàm làm lệch khối chú thích (vòng 3); bài cũ
thu_SAOLUU2 F1 đỏ giữa chừng (khôi phục đổi giờ cả file mới); người gác chặn 6 lệnh (B-PHANTICH: lệnh chạy script ghép thêm lệnh / ${…} / for;
B-BIMAT-CHU: bài thử chứa cụm khoá phải commit trước khi chạy, script sửa bài có cụm khoá phải dùng Edit; GIT-KEO: fetch origin main; SED-I).
- **KHOÁ** (ngoài Phạm vi — đề xuất, `tu_chay/cong.js`): mỗi dòng "Ca thử" trong bảng nghiệm thu của `ke_hoach.md` (mã dạng `C2`, `B1c`…)
  phải có ca `k('C2 …')` cùng mã trong bài thử của việc; ca đỏ: kế hoạch có C2 mà bài không có → ✗. Lý do: vòng 1 bắt đúng lỗi này.
- **KHOÁ** (ngoài Phạm vi — đề xuất, mục khuôn đột biến của skill / cong.js): bước đổi DỮ LIỆU có bảng phân loại (vd COT_CACH) → bài thử phải
  gieo MỖI mục + đột biến "xoá mục" / "đổi loại" BẮT. Đã làm trong việc này (B1c + 8 đột biến); đề xuất thành phép cổng chung.
- **KHOÁ** (ngoài Phạm vi — đề xuất, `tu_chay/skill_lam_viec.md` bước 8): sau MỖI vòng sửa có thêm đột biến chạy `cong.js tinh` trước khi
  gọi lại /ra-soat (A17 đỏ ở vòng 2 vì quên).
- **NGUYÊN TẮC** (K3 — đề xuất thêm vào KHUON_LOI.md, ngoài Phạm vi): ca "đỏ trên gốc" mà gốc dùng `'now'` của SQLite (đồng hồ THẬT) còn bài
  dùng đồng hồ GIẢ → đỏ chỉ vì hai đồng hồ lệch; phải có đột biến trả lại lỗi cũ cùng đồng hồ giả (việc này: BV-HOM-NAY, BV-SYNC…).
- **NGUYÊN TẮC** (K1 — đề xuất): dòng Phát hiện / CHƯA KIỂM kiểu "cần X thật mới thử được" phải ghi đã tìm khuôn giả có sẵn chưa
  (`grep -l "require.cache.*sxApi" cong_cu/`) — vòng 3 bắt đúng lỗi này.
- **NGUYÊN TẮC** (K1 TU-CHAY-6 — đề xuất): chèn hàm mới giữa file → khối `/** */` ngay trên chỗ chèn phải còn dính đúng hàm của nó.
- **BỎ**: SQL động trên mọi bảng không ngoặc kép tên (một lần, đã sửa trong code, chưa từng hỏng thật). **BỎ**: E1 tên "mọi giờ" mà dữ liệu
  không có đơn — một lần, đã sửa (ca E1 nay báo cửa nào không có giờ để đo).
Dọn: không có lời dặn nào trong KHUON_LOI.md / CLAUDE.md có phép kiểm làm thay mới từ việc này.

## Cổng
`node tu_chay/cong.js chay . 36b98b8^ HEAD viec/GIO-VN-1` (cây sạch, HEAD 69b8ba4): ✓ CỔNG CHẠY ĐẠT

HEAD ĐÃ KIỂM: 69b8ba4
