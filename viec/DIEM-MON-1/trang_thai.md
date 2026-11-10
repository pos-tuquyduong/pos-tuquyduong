# DIEM-MON-1 — trạng thái

## Bước 1 — đối chiếu bản chụp
- Nhánh: viec/DIEM-MON-1 · cây sạch · HEAD 997bf52 = FETCH_HEAD 997bf52 (bằng nhau, không kéo)
- git log --oneline -3:
  - 997bf52 PHIEU: DIEM-MON-1
  - de66463 TIEN-DO: GIAO-DIEN-1, KH-TOMTAT-1, GIAO-1, NAP-1, KHACH-APP-1 xong; mo DIEM-MON-1, KH-THE-1, QUAY-UI-1 + xep hang 5 viec; quyet dinh 07-08.11 — so v58
  - 801e99a Merge pull request #81 from pos-tuquyduong/viec/KHACH-APP-1

## Bước 3 — kế hoạch
- Đã viết `ke_hoach.md`. Phiếu là việc [T] (điểm = tiền) — "lập kế hoạch rồi DỪNG chờ duyệt": DỪNG sau bước 3.

## Bước 1 (phiên 09.11 — làm tiếp sau duyệt)
- Nhánh viec/DIEM-MON-1 · cây sạch · HEAD ce46ce0 = FETCH_HEAD ce46ce0 (bằng nhau, không kéo)
- git log --oneline -3:
  - ce46ce0 DIEM-MON-1: ke hoach (cho duyet) + trang thai buoc 1-3
  - 997bf52 PHIEU: DIEM-MON-1
  - de66463 TIEN-DO: GIAO-DIEN-1, KH-TOMTAT-1, GIAO-1, NAP-1, KHACH-APP-1 xong; mo DIEM-MON-1, KH-THE-1, QUAY-UI-1 + xep hang 5 viec; quyet dinh 07-08.11 — so v58
- Chủ quán duyệt kế hoạch, Q1 = CÁCH 2 (trừ điểm theo dòng). Đã ghi luật vào `ke_hoach.md` mục 6. DỪNG ở bước 2 vì hai chỗ ngoài Phạm vi (Q2, Q3 dưới).

## Bước 1 (phiên 09.11 lần 2 — sau khi chủ quán thêm Q2, Q3 vào Phạm vi)
- Nhánh viec/DIEM-MON-1 · cây sạch · HEAD e90d42a = FETCH_HEAD e90d42a (bằng nhau, không kéo — hook mở phiên đã kéo 5eb8ede → e90d42a)
- git log --oneline -3:
  - e90d42a PHIEU: DIEM-MON-1 Pham vi them damages.js + gia_lap/bat_bien.js (Q2, Q3 chu quan duyet 09.11)
  - 5eb8ede DIEM-MON-1: ghi luat CACH 2 vao ke hoach; hoi them damages.js + bat_bien.js (I8) vao Pham vi
  - ce46ce0 DIEM-MON-1: ke hoach (cho duyet) + trang thai buoc 1-3
- Q2, Q3 ĐÃ TRẢ LỜI (phiếu e90d42a thêm hai file vào Phạm vi). Làm tiếp từ bước 4.

## Bước 4–6 (phiên 09.11 lần 2)
- Bài thử `cong_cu/thu_DIEMMON1.js` viết TRƯỚC, chạy trên gốc (server e90d42a): 5 đạt · 21 hỏng (`bang_chung_do.txt`). Sau vá: 26 đạt · 0 hỏng.
- Khác bảng ca trong `ke_hoach.md` (ghi rõ, không đổi luật): T13 dùng X + 2 Y (Y một ly thì không đền được hai lần — `VUOT_SO_LUONG`);
  T6 cho X nhóm đặc biệt 50% (giảm hạng đồng đều 10% không phân biệt được "giá hạng từng món" — đột biến bỏ giá hạng sống); thêm T2b (đơn cũ
  không cờ), T12b (đơn chỉ lấy từ gói, K5), T17 ca nhân viên 403. T19 bỏ ý "flash 0 điểm" (thu_P2223 canh, bài này không bật flash).
- Bài cũ sửa theo LUAT §6.7: `cong_cu/thu_KHO1.js` D1 (khoá đúng danh sách cột pos_products) thêm `tich_diem` — bản mới ĐỎ trên gốc, xanh sau vá
  (`bang_chung_do.txt`, `SỐ CA`). Không phải `## Bài thử cũ sửa` (đỏ trên gốc — §6.8/6.9).
- Bộ kiểm: `thu_BH2.js` đỏ "bad revision cbbb809" vì kho nông → `git fetch -q --unshallow origin viec/DIEM-MON-1` (chỉ tải lịch sử). Cảnh báo
  "route ghi không qua loiGhi 48 > 47" do PUT /loyalty/tich-diem mới → đã cho đi qua `loiGhi`. Còn 1 cảnh báo có sẵn (GET có lệnh ghi — packages,
  products, sync; không phải của việc này).
- Bản lưu trước khi vá: không chép tay (người gác chặn vòng `for`); gốc lấy lại bằng `git archive e90d42a server cong_cu/gia_lap` vào thư mục nháp.

### Chỗ vá → đột biến (`viec/DIEM-MON-1/dot_bien.py` — 30 BẮT · 0 SỐNG · 0 HỎNG · 0 LẠC, đối chứng 26 đạt · 0 hỏng)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| 024 thêm `pos_orders.tien_hang_diem` | BV-024-cot-don | T1 |
| 024 cờ ở 3 bảng | BV-024-co-goi | T1 |
| `tienTinhDiem` nhân tỷ lệ | BV-ham-bo-ty-le | T3 |
| `tienTinhDiem` chặn tiền hàng 0 | VS-chia-0 | T2 |
| `batDiem` NULL = bật | VS-null-la-tat | T2b |
| `tienHangDiem` chia theo tỷ lệ | VS-khong-chia-ty-le | T5 |
| `tienHangDiem` giá hạng từng dòng | VS-gia-goc-bo-gia-hang | T6 |
| `tienHangDiem` bỏ dòng tắt | BV-dong-tat-van-tinh | T3 |
| `tienHoanTinhDiem` CÁCH 2 theo dòng | VS-hoan-toan-don | T13 |
| đền món tắt không trừ | VS-den-mon-tat-van-tru | T13 (T13d) |
| hoàn gói tắt không trừ | VS-goi-tat-van-tru | T14 |
| kết thúc gói gắn dòng gói | VS-ket-thuc-goi-nhu-duyet-hoan | T14b |
| mẫu số = tiền tính điểm | VS-mau-so-tien-tra | T13 |
| orders cờ món / gói / hạng | BV-co-mon · BV-co-goi · BV-co-hang | T3 · T10 · T11 |
| orders lưu tien_hang_diem / cờ dòng | BV-luu-tien-hang-diem · BV-luu-co-dong | T3/T8 · T3/T13 |
| orders điểm lúc tạo đọc tỷ lệ | BV-diem-luc-tao | T3 |
| tiền hàng trừ phí giao | VS-tien-hang-gom-phi-giao | T12 |
| /nhan-diem đọc cột | BV-nhan-diem-thieu-cot | T8 |
| damages ghi sự cố trước khi trừ (Q2) | BV-ghi-su-co-sau | T13 |
| PUT quyền manage_promotions | BV-quyen-sua | T16 |
| GET quyền manage_settings | BV-quyen-xem | T17 |
| danh sách trắng bảng | VS-bang-tu-do | T16 |
| id nguyên dương | BV-id-khong-kiem | T16 |
| I8 tỷ lệ / đền tắt / gói tắt / cột mới (Q3) | BV-i8-khong-ty-le · VS-i8-den-tat-van-tru · VS-i8-goi-tat-van-tru · BV-i8-bo-cot-moi | T18 |

Tên đột biến (đủ 30): BV-024-cot-don, BV-024-co-goi, BV-ham-bo-ty-le, VS-chia-0, VS-null-la-tat, VS-khong-chia-ty-le, VS-gia-goc-bo-gia-hang,
BV-dong-tat-van-tinh, VS-hoan-toan-don, VS-den-mon-tat-van-tru, VS-goi-tat-van-tru, VS-ket-thuc-goi-nhu-duyet-hoan, VS-mau-so-tien-tra, BV-co-mon,
BV-co-goi, BV-co-hang, BV-luu-tien-hang-diem, BV-luu-co-dong, BV-diem-luc-tao, VS-tien-hang-gom-phi-giao, BV-nhan-diem-thieu-cot, BV-ghi-su-co-sau,
BV-quyen-sua, BV-quyen-xem, VS-bang-tu-do, BV-id-khong-kiem, BV-i8-khong-ty-le, VS-i8-den-tat-van-tru, VS-i8-goi-tat-van-tru, BV-i8-bo-cot-moi.
- Kiểm: `npm test` PASS 106 · FAIL 0; `npm test -- --day-du` PASS 109 · FAIL 0 (sau unshallow).

## Soát độc lập — vòng 1 (/ra-soat, agent chỉ đọc) — chép nguyên báo cáo
KHÔNG ĐẠT

LỖI TÌM ĐƯỢC:
1. `server/utils/diemThat.js:62-73` (tienHoanTinhDiem), chép y hệt ở `cong_cu/gia_lap/bat_bien.js:199-204` (I8) — khoản duyệt hoàn (phần "không gắn dòng" Rk) luôn được quy theo TOÀN đơn: `Rk × tiền tính điểm / tiền trả`. Nhưng duyệt hoàn vốn đã TRỪ phần đã đền: `refunds.js:173` gọi `soTienHoan`, rồi `tienDaTra.js:47-49` lấy `tong − SUM(refund_amount của pos_damage_logs)`. Vì vậy khoản duyệt hoàn chính là "phần còn lại" của đơn, không phải một phần đều của cả đơn.
   - Ca cụ thể: X tắt 40.000 + Y bật 60.000, trả ví 100.000 → 60 điểm. Đền X 40.000 → trừ 0 (đúng). Duyệt hoàn → hoàn 60.000 (100.000 − 40.000), đơn thành 'refunded', tiền đã trả lại hết, nhưng chỉ trừ ceil(60 × 60.000 / 100.000) = 36. Khách GIỮ 24 điểm.
   - Làm ngược thứ tự (đền Y 60.000 trước, rồi duyệt hoàn 40.000) thì về 0 điểm. Cùng dòng tiền mà ra hai số điểm khác nhau.
   - I8 chép cùng công thức nên Đối soát không báo lệch. Bài thử không có ca "đền trước, duyệt hoàn sau": T13b chỉ có duyệt hoàn.
   - Khuôn: K4 (đường song song soTienHoan/H4 chưa rà) + K3 (thiếu ca). Có thể vá bằng một trong hai cách: tính Rk theo phần còn lại `Rk × (tiền tính điểm − Rb) / (tiền trả − tổng đền)`, hoặc trừ hết điểm còn lại khi đơn sang 'refunded'. Cần chủ quán chốt vì luật CÁCH 2 (kế hoạch mục 6.1) ghi đúng nguyên văn "theo toàn đơn".
2. `kiem_tra_truoc_khi_giao.js:495,512` — `cong_cu/thu_DIEMMON1.js` không có trong danh sách `chayBaiThat`. Gần như mọi bài thu_*.js khác đều có. File này nằm trong Phạm vi, và được phép THÊM phép kiểm. Khuôn: K6 (khoá chưa cài).
3. `server/routes/orders.js:1312` — `const batDiem = …` (một cờ đúng/sai) che mất hàm `batDiem` vừa nhập ở `:42` và đang dùng ở `:483,513,549`. Hiện chưa hỏng vì nằm trong khối lồng, nhưng phạm CHECKLIST mục G "tên hàm mới trùng gì có sẵn". Khuôn: K7. Gọn hơn: đổi tên biến cục bộ thành `coNhanDiem`.
4. `server/routes/orders.js:536` viết cứng `-1000000 - membershipTier.id`, trong khi `diemThat.js:17` khai hằng `ID_THE_TU` và `bat_bien.js:29` chép lại nó. Hai nguồn cho cùng một hằng, trái LUAT §3. Nhẹ: orders.js nên dùng `ID_THE_TU`.
5. Hồ sơ lệch code (K1):
   - `ke_hoach.md` Phần 2 vẫn ghi "kẹp ≤ 1" và đột biến `BV-TRAN`, nhưng `tienTinhDiem` (`diemThat.js:39-44`) không còn kẹp. Đúng là thừa (tienHangDiem ≤ tiền hàng, không chỗ nào UPDATE total / shipping_fee sau khi tạo đơn — grep 0 chỗ), nhưng kế hoạch chưa sửa theo.
   - `ke_hoach.md` T19 hứa "trả lời /api/kh không thêm trường (so danh sách khoá)", bài thử không có ca đó (`thu_DIEMMON1.js:366-374`), và `trang_thai.md` không ghi là đã bỏ.
   - `ke_hoach.md` ghi "dòng nạp tính tắt", nhưng code coi dòng nạp không cờ là BẬT (`batDiem` coi NULL = bật; `orders.js:1041` ghi NULL). Vô hại vì đơn nạp 0 điểm ở `:943`, nhưng chữ sai với code.

NGHI NGỜ:
- `loyalty.js` PUT /tich-diem với loai='hang' chỉ cần quyền `manage_promotions`, trong khi mọi thay đổi hạng ở `tiers.js:7` phải có PIN chủ quán. Kế hoạch đã được duyệt với quyền này, nhưng nên hỏi lại chủ quán có coi đây là "đổi hạng" không.
- `ID_TICH_DIEM_TOI_DA = 500`: quán có hơn 500 món thì "Chọn tất cả" trả 400 với câu dễ hiểu nhầm. Chưa biết số món thật.
- Bill vẫn in "nhận gấp N điểm của đơn này" (`orders.js:1312-1323`) cho đơn mà mọi dòng đều tắt điểm (0 điểm). Phiếu cấm đổi bill; không tính là lỗi.
- Đền ghép món theo `product_code` (`diemThat.js:66-68`; I8 `EXISTS … i.product_code = l.product_code`). Đúng khi mã món, mã gói và `THE-<tên>` không trùng nhau; chưa kiểm dữ liệu thật.

NGHIỆM THU: 5/6 mục phần máy chủ có bằng chứng · mục chưa đạt: C.
- A: T1, T10, T11, T12, T19 → có. B: T3–T9, T6, T6b → có. C: T13, T13b, T13c, T13d, T14, T14b, T15 → có, nhưng ca "đền món tắt rồi duyệt hoàn" sai (lỗi 1) → chưa đạt.
- D (máy chủ): T16, T17 → có; giao diện CHƯA KIỂM. E: T18, T18b → có. K5: T2b, T9, T12b, T19 + thu_P2223 / thu_HOPDONG_KH → có.

CHƯA SOÁT ĐƯỢC: giao diện TichDiem.jsx trên trình duyệt / điện thoại; `--day-du`, `tu_chay/cong.js chay`; 26/30 đột biến còn lại (agent tự chạy 4, đều BẮT); dữ liệu Turso thật (hiệu năng I8 với JOIN mới, trùng product_code); bước 024 trên Turso.

BÀI HỌC:
- KHOÁ: thêm `cong_cu/thu_DIEMMON1.js` vào `chayBaiThat`. Thêm ca "đền dòng tắt → duyệt hoàn → điểm còn lại = 0" (hoặc theo luật chủ quán chốt), cài đột biến tương ứng ở I8.
- NGUYÊN TẮC (K4): luật trừ / chia theo "phần" phải rà mọi hàm tính SỐ TIỀN của khoản đó (soTienHoan đã trừ phần đền, H4). Khoản "không gắn dòng" thật ra là "phần còn lại". Một luật trừ điểm phải cho cùng kết quả dù các bước diễn ra theo thứ tự nào.
- NGUYÊN TẮC (K7 / mục G): nhập hàm mới thì grep tên trong file đích để tránh trùng với biến cục bộ.

### Đã sửa sau vòng 1 (lỗi NHẸ — không đụng tiền / điểm)
- Lỗi 2: `kiem_tra_truoc_khi_giao.js` thêm `chayBaiThat('cong_cu/thu_DIEMMON1.js')` (chỉ THÊM phép kiểm — CLAUDE.md §6 cho phép). `npm test` PASS 107 · FAIL 0.
- Lỗi 3: `orders.js` đổi biến cục bộ `batDiem` → `coNhanDiem` (đơn hàng bill mã nhận điểm, hành vi không đổi).
- Lỗi 4: `orders.js` dòng thẻ hạng dùng `ID_THE_TU` (xuất từ `diemThat.js`) — giá trị không đổi (−1000000).
- Lỗi 5 (hồ sơ): ghi ở đây cho khớp code — (a) bỏ kẹp ≤ 1 và đột biến BV-TRAN vì kẹp thừa (đột biến chỉ sống); (b) T19 không có ca "/api/kh không thêm
  trường" — không file `/api/kh` nào đổi, `thu_HOPDONG_KH.js` trong `npm test` canh hợp đồng; (c) dòng nạp lưu cờ NULL (= bật theo `batDiem`), vô hại vì
  đơn nạp 0 điểm và không gộp món (B5 NAP-1).
- Lỗi 1: CHƯA sửa — đụng điểm, luật chưa chốt → `## Câu hỏi` Q4.

## Bước 1 (phiên 10.11 — làm tiếp sau Q4, Q5)
- Nhánh viec/DIEM-MON-1 · cây sạch · HEAD eb4060c = FETCH_HEAD eb4060c (bằng nhau, không kéo — hook mở phiên đã kéo 997bf52 → eb4060c)
- git log --oneline -3:
  - eb4060c PHIEU: DIEM-MON-1 Pham vi them cong_cu/thu_KHO1.js (Q5 chu quan duyet 09.11)
  - 1cbbab5 DIEM-MON-1: bao cao soat vong 1 (KHONG DAT) + cau hoi Q4 (diem khi den roi duyet hoan), Q5 (Pham vi thu_KHO1)
  - 3b3888d DIEM-MON-1: orders — doi ten bien coNhanDiem (khong che batDiem), dung ID_THE_TU (soat vong 1 loi 3, 4)
- Chủ quán 09.11: Q4 = a; Q5 đã thêm `cong_cu/thu_KHO1.js` vào Phạm vi; nghi ngờ PIN cho công tắc điểm của hạng → giữ như kế hoạch (không PIN).
- Kho nông lại (phiên mới) → `thu_BH2.js` đỏ "bad revision cbbb809"; `git fetch -q --unshallow origin viec/DIEM-MON-1` (chỉ tải lịch sử) → xanh.

## Vòng sửa 1 — lỗi 1 (Q4 = a)
- Bài thử TRƯỚC (commit 8d1f224, 44d6c04): T13e (đền X tắt → duyệt hoàn → 0; ngược thứ tự → 0), T13f (ví + tiền mặt, đền X rồi hoàn 10.000 → 50),
  T13g (đền Y bật 30.000 rồi hoàn 20.000 → 21 — phủ vế "trừ phần đền bật"). Trên code chưa vá Q4: T13e `[60,60,24]`, T13f `[60,60,54]` ĐỎ
  (26 đạt · 2 hỏng). Trên gốc e90d42a: 5 đạt · 24 hỏng. Sau vá: 29 đạt · 0 hỏng (`bang_chung_do.txt`, `SỐ CA` 29).
- Vá: `server/utils/diemThat.js` tienHoanTinhDiem — `Rk × (tiền tính điểm − đền bật) / (tiền trả − tổng đền)` (chặn chia cho ≤ 0, chặn âm);
  `cong_cu/gia_lap/bat_bien.js` I8 cùng luật (chép riêng). Đơn cũ (không cột): tiền tính điểm = tiền trả, đền bật = đền → tỷ lệ 1 → y hệt trước.
- Đền sau duyệt hoàn không xảy ra (`damages.js` chặn đơn khác 'completed' — `DON_KHONG_DEN_DUOC`), nên mẫu số "tiền trả − tổng đền" đúng với số
  soTienHoan dùng lúc duyệt.
- Đột biến (`dot_bien.py`): thêm BV-q4-hoan-theo-toan-don (T13e), VS-q4-con-lai-bo-den-bat (T13g), VS-q4-mau-so-ca-don (T13e),
  BV-i8-q4-hoan-theo-toan-don (T18); sửa neo VS-hoan-toan-don, VS-den-mon-tat-van-tru, VS-i8-den-tat-van-tru theo dòng mới.
  Kết quả: ĐỐI CHỨNG XANH 29 đạt · 0 hỏng · TỔNG 34 đột biến · BẮT 34 · SỐNG 0 · HỎNG 0 · LẠC 0.
- Tên đột biến (đủ 34): BV-024-cot-don, BV-024-co-goi, BV-ham-bo-ty-le, VS-chia-0, VS-null-la-tat, VS-khong-chia-ty-le, VS-gia-goc-bo-gia-hang,
  BV-dong-tat-van-tinh, VS-hoan-toan-don, VS-den-mon-tat-van-tru, BV-q4-hoan-theo-toan-don, VS-q4-con-lai-bo-den-bat, VS-q4-mau-so-ca-don,
  VS-goi-tat-van-tru, VS-ket-thuc-goi-nhu-duyet-hoan, VS-mau-so-tien-tra, BV-co-mon, BV-co-goi, BV-co-hang, BV-luu-tien-hang-diem, BV-luu-co-dong,
  BV-diem-luc-tao, VS-tien-hang-gom-phi-giao, BV-nhan-diem-thieu-cot, BV-ghi-su-co-sau, BV-quyen-sua, BV-quyen-xem, VS-bang-tu-do, BV-id-khong-kiem,
  BV-i8-khong-ty-le, VS-i8-den-tat-van-tru, BV-i8-q4-hoan-theo-toan-don, VS-i8-goi-tat-van-tru, BV-i8-bo-cot-moi.
- Bảng chỗ vá Q4 → đột biến: tienHoanTinhDiem phần còn lại → BV-q4-hoan-theo-toan-don · VS-q4-con-lai-bo-den-bat · VS-q4-mau-so-ca-don;
  I8 phần còn lại → BV-i8-q4-hoan-theo-toan-don.
- Kiểm: `npm test -- --day-du` PASS 111 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn: GET có lệnh ghi — packages, products, sync).

## Soát độc lập — vòng 2 (/ra-soat, agent chỉ đọc) — chép nguyên báo cáo
KHÔNG ĐẠT

Tóm tắt: bản vá Q4 = a đúng luật ở mọi trường hợp mình đã dò (đơn cũ, ví mẹ, trả một phần tiền mặt, đền nhiều lần, đền món tắt + bật rồi hoàn). Lỗi 2–5 của vòng 1 đã sửa thật. Nhưng công thức mới chia hai lần bằng số thực, nên có ca làm tròn LÊN thừa 1 điểm. Mình đã dựng lại được ca đó bằng chính diemThat.js. I8 chép y công thức này nên màn Đối soát không báo lệch. Lỗi đụng điểm → NẶNG.

LỖI TÌM ĐƯỢC:
1. `server/utils/diemThat.js:74` (+ `diemTruKhiHoan` :50-51) và bản chép ở `cong_cu/gia_lap/bat_bien.js:202-205` (I8) — số trừ sai do làm tròn số thực (float) — K3 + K4 — NẶNG.
   - Cách hỏng: `khongGan × (tienDiem − denBat) / conTra` cho ra số lẻ, sau đó lại `Math.ceil(diem × số_đó / tienDiem)`. Khi kết quả đúng là số nguyên, phép chia số thực vượt lên một chút, nên ceil cộng thêm 1.
   - Ca dựng lại được, chạy thật với `truDiemHoan` (script nháp trong thư mục nháp của phiên): đơn 19.500đ = X tắt 6.000 + Y bật 13.500; trả ví 3.000 + tiền mặt 16.500 → 13 điểm. Duyệt hoàn 3.000 vào ví (chưa đền). Luật đúng: 13×3.000/19.500 = 2 điểm. Máy trừ **3**.
   - Trước DIEM-MON-1 không có lỗi này: `diemTruKhiHoan` nhận số nguyên, chia một lần, kết quả chính xác.
   - Quét thử bằng node: rất nhiều bộ số thực tế dính, ví dụ tienDiem 13.500 · conTra 19.500/32.500 · hoàn 3.000/5.000/6.000/10.000/12.000.
   - I8 (`bat_bien.js:202-205`) tính đúng theo cùng thứ tự phép, nên Đối soát không bao giờ bắt được. Trọng tài chép cả lỗ (K4: "chép cổng có sẵn thì chép luôn lỗ của nó").
   - Bài thử T13b/e/f/g (`cong_cu/thu_DIEMMON1.js:277-303`) toàn số tròn, nên không ca nào lộ lỗi (K3: "ca PHÉP TÍNH chọn số để làm tròn không che lỗi").
   - Cách vá gọn: làm tròn XUỐNG phần quy đổi ra đồng trước khi đưa vào ceil, tức `Math.floor((khongGan * Math.max(0, tienDiem - denBat)) / conTra)` (nghiêng có lợi cho khách < 1đ). Hoặc tính cả phân số bằng số nguyên. Sửa CẢ hai chỗ: diemThat.js:74 và bat_bien.js:204. Thêm ca dùng đúng bộ số trên (kỳ vọng 13 → 11) và một đột biến đưa lại phép chia thực.
2. `viec/DIEM-MON-1/ke_hoach.md:40,41,102,107` — kế hoạch vẫn ghi sai so với code — K1 — NHẸ. Cụ thể: "dòng gói nạp … tính tắt" (code ghi NULL = bật); "kẹp ≤ 1"; T19 "`/api/kh` so danh sách khoá"; đột biến `BV-TRAN`. Ngoài ra ke_hoach.md:144 ghi T14 "hoàn 180.000", bài thử dùng 300.000 (`thu_DIEMMON1.js:319`). trang_thai.md đã ghi đính chính (lỗi 5 a–c) nhưng chính kế hoạch chưa có dòng trỏ sang. Nên thêm một dòng "xem trang_thai — đã bỏ" ngay tại các chỗ đó.

NGHI NGỜ:
- Phí giao trong khoản duyệt hoàn: `refunds.js:136` lấy `refund_amount = balance_amount`, có thể gồm phần phí giao trả bằng ví. `soTienHoan` (`tienDaTra.js:35-51`) cũng không trừ phí giao, trong khi `conTra` (`diemThat.js:72`) đã bỏ phí giao. Kết quả: ở đơn trộn món tắt/bật, có phí giao và trả một phần tiền mặt, tỷ lệ hoàn / phần còn lại có thể > 1 → trừ nhiều hơn "phần còn lại". Đơn toàn món bật thì y hệt trước (lỗi có sẵn từ NAP-1, không do việc này). Chưa dựng ca để chứng minh.
- `diemThat.js:66-69` và I8 (`bat_bien.js:162-163`) ghép đền với món theo `product_code`. Đúng khi mã món, mã gói và `THE-<tên>` không trùng nhau; chưa kiểm dữ liệu thật.
- `loyalty.js` `ID_TICH_DIEM_TOI_DA = 500`: quán có > 500 món bán được thì "Chọn tất cả" bị trả 400 `TICH_DIEM_SAI`. Chưa biết số món thật.
- Bill vẫn hứa "gấp N điểm" cho đơn mà mọi dòng đều tắt điểm (`orders.js:1312-1323`). Phiếu cấm đổi bill nên không tính là lỗi.
- I8 chỉ có một đột biến cho vá Q4 (BV-i8-q4-hoan-theo-toan-don, `dot_bien.py:71`), không có đột biến cho vế "trừ đền bật" / mẫu số ở I8. Theo tính tay, T18 vẫn sẽ bắt (đơn T13g), nhưng chưa chạy.

Trả lời từng mục soát:
1. K3: Bài thử ĐỎ trên gốc: 5 đạt · 24 hỏng (`bang_chung_do.txt`). Trên bản chưa vá Q4: T13e `[60,60,24]` và T13f `[60,60,54]` đỏ. Bài kiểm số điểm thật qua HTTP, không kiểm marker; marker suông không làm nó xanh được. Mình tự chạy `dot_bien.py VS-q4-mau-so-ca-don`: đối chứng 29 đạt · 0 hỏng, BẮT ở T13e. Lỗ: không ca nào có số lẻ (lỗi 1).
2. K4: grep `tienTinhDiem|tinhDiemDon(` trong server → 5 chỗ gọi: orders.js:938 (tạo đơn), :1429 (thu nợ), signup-codes.js:210, hoaDon.js:83, nhanDiem.js (chú thích). Cả 5 đều có `tien_hang_diem`: SELECT * hoặc kê cột ở signup-codes.js:54. Bốn lối trừ (refunds:182, damages:211, packages:271, signup-codes:262) cùng qua `truDiemHoan`. Mỗi đơn chỉ có một dòng gói (`orders.js:489` một `package_buy`), nên `dong.find` an toàn. Còn sót: chỗ chia số thực có ở 2 nơi (diemThat:74, bat_bien:204) — chưa xử lý.
3. K5: các luồng hợp lệ (đơn cũ không cột, đơn chỉ lấy từ gói, mua gói + lấy ngay, đơn có phí giao, đơn nạp, đơn nợ, đơn không SĐT nhận mã, ví mẹ) đều có ca hoặc mình đã lần theo code: T2b, T12b, T10, T12, T19, T9, T8/T18. Việc dời `ghiHangHong` lên trước (damages.js:206) không đổi lời trả hay các nhánh chặn VUOT_GIA. Không thấy luồng nào bị chặn oan (trừ nghi ngờ 500 món).
4. K1: lỗi 2. Câu "đền sau duyệt hoàn không xảy ra" là đúng: damages.js:190 `DON_KHONG_DEN_DUOC`, refunds.js:166 chuyển đơn sang 'refunded'.
5. Đường tiền: tiền tính điểm do máy chủ tự tính từ dòng đơn và giá đã tra (`orders.js:934`, `diemThat.js:27-32`). PUT /tich-diem chỉ nhận cờ, không nhận số tiền. Không trường tiền nào lấy từ máy khách.
6. P1: commit build 4cc3cc9e đến sau mọi commit sửa `client/src`; dist có chuỗi `tich-diem`. Mình tự chạy `node kiem_tra_truoc_khi_giao.js --day-du` → PASS 111 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn).
7. Lỗi 2–5 vòng 1: Lỗi 2 đã sửa, `kiem_tra_truoc_khi_giao.js:513`. Lỗi 3 đã sửa, `orders.js:1312` thành `coNhanDiem`. Lỗi 4 đã sửa, `orders.js:539` dùng `ID_THE_TU`. Lỗi 5: chỉ mới ghi ở trang_thai (lỗi 2 ở trên).

NGHIỆM THU: 5/6 mục có bằng chứng · mục thiếu: C (một phần)
- A: có — T1, T10, T11, T12, T19 (`thu_DIEMMON1.js`).
- B: có — T3–T9, T6b: quầy, ví/CK, App (T7), /nhan-diem (T8), thu nợ (T9).
- C: THIẾU một phần — đã có T13, T13b–g, T14, T14b, T15 (không trừ quá: T15). Nhưng vế "đơn có dòng tắt điểm trừ đúng tỷ lệ" sai 1 điểm ở ca số lẻ (lỗi 1), và không ca nào phủ.
- D: có phần máy chủ — T16, T17. Giao diện TichDiem.jsx không có bài máy; trang_thai chưa ghi 1–3 thao tác cho chủ quán thử tay (LUAT §6.4).
- E: có — T18, T18b. Nhưng I8 chép cùng lỗi làm tròn nên "điểm đơn = điểm đúng luật" chưa được kiểm độc lập ở ca số lẻ.
- K5: có — T2b, T9, T12b, T19; `thu_HOPDONG_KH` trong `npm test` (đã xanh).
- Đối soát (LUAT §5): có — I8 đã nhận luật mới.

Đơn giản (mục 8): không thấy phần rườm rà hay lan ra ngoài phiếu. `tienHoanTinhDiem` (3 câu đọc) và I8 chép riêng là theo thiết kế "trọng tài". Phát hiện của máy về `tienDaTra.js` (tách hàm chia tiền thuần) hợp lý, để việc sau.

CHƯA SOÁT ĐƯỢC: Giao diện TichDiem.jsx trên trình duyệt / điện thoại. `node tu_chay/cong.js chay`. 33/34 đột biến còn lại (mình chỉ chạy 1, BẮT). Bước 024 trên Turso thật và hiệu năng I8 (EXISTS mới) trên dữ liệu thật. Trùng product_code trong dữ liệu thật. Ca phí giao + trả một phần tiền mặt (nghi ngờ 1) chưa dựng.

BÀI HỌC:
- KHOÁ: thêm vào thu_DIEMMON1 một ca số lẻ (19.500 = 6.000 tắt + 13.500 bật, ví 3.000 + tiền mặt 16.500, duyệt hoàn → 13 thành 11). Thêm đột biến đưa lại phép chia số thực ở cả diemThat.js và I8.
- NGUYÊN TẮC (K3/K4, thêm vào KHUON_LOI): phép tính điểm / tiền ghép nhiều lần chia rồi `ceil`/`floor` phải tính bằng số nguyên, hoặc làm tròn từng bước theo chiều có lợi cho khách. Ca thử phải có bộ số mà kết quả đúng là số nguyên nhưng phép tính đi qua phân số lẻ. Trọng tài chép cùng biểu thức thì không bắt được lỗi làm tròn — cần ít nhất một ca so với số tính tay.

### Đã sửa sau vòng 2 (vòng sửa 2)
- Lỗi 1 (NẶNG, đụng điểm — luật đã chốt: ceil(điểm × tiền hoàn / tiền tính điểm); chỉ sửa cách TÍNH cho đúng luật, không đổi luật):
  - Bài thử TRƯỚC: T13h (commit 09e0fcc) — trên code chưa vá vòng 2: `13 → 10` ĐỎ (29 đạt · 1 hỏng); trên gốc 5 đạt · 25 hỏng.
  - Vá `server/utils/diemThat.js`: `tienHoanTinhDiem` trả phân số `{ tu (BigInt), mau }`; `diemTruKhiHoan(diem, tienHoan, tienDiem, mau = 1)` tính
    ceil bằng BigInt một lần (mặc định `mau = 1` giữ chữ ký cũ — `thu_NAP1.js` E8 xanh). `cong_cu/gia_lap/bat_bien.js` I8 cùng phép (chép riêng).
  - Sau vá: `thu_DIEMMON1.js` 30 đạt · 0 hỏng (`SỐ CA` 30).
  - Đột biến: thêm VS-chia-so-thuc (T13h), VS-i8-chia-so-thuc (T18); sửa neo VS-hoan-toan-don, BV-q4-hoan-theo-toan-don, VS-q4-con-lai-bo-den-bat,
    VS-q4-mau-so-ca-don, VS-mau-so-tien-tra, BV-i8-q4-hoan-theo-toan-don theo dòng mới. ĐỐI CHỨNG XANH 30 đạt · 0 hỏng · TỔNG 36 · BẮT 36 · SỐNG 0 ·
    HỎNG 0 · LẠC 0.
  - Bảng chỗ vá vòng 2 → đột biến: diemTruKhiHoan ceil số nguyên → VS-chia-so-thuc · I8 ceil số nguyên → VS-i8-chia-so-thuc.
  - Tên đột biến (đủ 36): 34 tên ở mục "Vòng sửa 1" + VS-chia-so-thuc, VS-i8-chia-so-thuc.
- Lỗi 2 (NHẸ, hồ sơ): `ke_hoach.md` thêm ghi chú đính chính tại chỗ (dòng nạp NULL = bật; bỏ kẹp ≤ 1 và BV-TRAN; T19 bỏ ca `/api/kh`; T14 hoàn 300.000,
  CÁCH 2 trừ 0) + dòng luật vòng 2.
- Nghi ngờ "phí giao trong khoản duyệt hoàn" → `## Phát hiện` (có sẵn từ NAP-1, ngoài phần việc này đổi; đơn toàn món bật y hệt trước).
- Kiểm: `npm test -- --day-du` PASS 111 · FAIL 0 · CẢNH BÁO 1 (có sẵn).

## Soát độc lập — vòng 3 (/ra-soat, agent chỉ đọc) — chép nguyên báo cáo
ĐẠT (còn 3 lỗi NHẸ, không lỗi nào đụng tiền / điểm thật)

Tóm tắt: bản vá vòng 2 tính đúng. Mọi chỗ gọi đã theo chữ ký mới, I8 khớp server ở từng nhánh, và mình đã dò thì không còn phép chia số thực nào trên đường trừ điểm làm sai kết quả. `npm test` cho PASS 107 · FAIL 0, `--day-du` cho PASS 111 · FAIL 0 · CẢNH BÁO 1 (cảnh báo này có từ trước). Mình chạy lại `dot_bien.py VS-chia-so-thuc`: đối chứng 30 đạt · 0 hỏng, đột biến BẮT ở T13h. Lỗi lớn nhất còn lại: I8 mới sập (ném lỗi) khi cài đặt điểm sai. Chỉ xảy ra nếu ai đó gửi lệnh thẳng vào máy chủ, vì màn hình đã chặn.

LỖI TÌM ĐƯỢC:
1. `cong_cu/gia_lap/bat_bien.js:203` `const N = (x) => BigInt(Math.round(x))` và `:207` `N(dungBan)` (tính cả khi `dungBan` = 0 hoặc không phải số). Nếu `loyalty_earn_per_amount` = 0 hoặc không phải số (`:150` `per = Number(...)`), thì `g` (`:180`) ra Infinity hoặc NaN, `dungBan` (`:192`) theo đó cũng ra Infinity hoặc NaN, và `BigInt(...)` ném RangeError. Kết quả: I8 sập, kéo theo cả màn Đối soát vì `doiSoat.js:341` gọi thẳng, không bắt lỗi. Trước vòng 2, cùng dữ liệu đó chỉ in dòng "lệch", không sập. Server tự chặn được nhờ `soNguyen` có `|| 0` (`diemThat.js:50`), còn I8 thì không. Cách xảy ra: `settings.js:111-150` không kiểm khoá này, chỉ màn hình chặn dưới 1.000 (`Settings.jsx:556`). Vá gọn: chép đúng `soNguyen` sang (`BigInt(Math.round(Number(x) || 0))`) hoặc chặn `per >= 1` ở đầu I8. Khuôn K4 (chép cổng thì chép thiếu chốt chặn). NHẸ: chỉ là công cụ đối soát đọc, không ghi tiền hay điểm, và màn hình đã chặn trường hợp này.
2. `server/utils/diemThat.js:46-49`: chú thích của `diemTruKhiHoan` vẫn ghi "tỷ lệ tienHoan / tienDiem", chưa nhắc đối số mới `mau` (đúng ra là tienHoan / mau / tienDiem). Chú thích ở dòng 52-53 thì đúng: mình chạy node ra `2.0000000000000004`, ceil lên 3. Khuôn K1. NHẸ.
3. `server/utils/diemThat.js:104` viết `... hoan.mau) -(diem - ...` (thiếu dấu cách), và `:81-82` đặt bí danh thừa `const B = soNguyen` cùng một dòng `return` rất dày. Đọc khó, không sai. NHẸ (mục 8).

NGHI NGỜ:
- `diemThat.js:50`: `soNguyen` làm tròn từng đầu vào. Nếu sổ ví có số lẻ dưới 1đ khiến `conTra` nằm trong (0; 0,5), thì `mau` thành 0n và hàm trả 0, tức là không trừ điểm. Mình thử `diemTruKhiHoan(13, 3000, 13500, 0.3)` → 0. Dữ liệu tiền đều là số nguyên đồng nên ca này coi như không xảy ra, nhưng mình chưa soi cột amount trên dữ liệu thật.
- `soNguyen(Infinity)` ném lỗi: thử `diemTruKhiHoan(13, 3000, Infinity)` → THROW. Hiện chưa có đường nào đưa Infinity vào (`tienTinhDiem` luôn ra số hữu hạn, `:39-44`).
- Phí giao trong khoản duyệt hoàn (đã ghi ở Phát hiện, có từ NAP-1): mình tính tay ca toàn món bật thì kết quả y như trước DIEM-MON-1. Chưa dựng ca món trộn + phí giao.

Trả lời từng mục:
1. K3: T13h (`thu_DIEMMON1.js:303-315`) kiểm số điểm thật qua HTTP (13 → 11). Không dò marker, nên marker suông không làm nó xanh được. `bang_chung_do.txt:49-51`: trên bản chưa vá vòng 2 ĐỎ (13 → 10), trên gốc ĐỎ (19 → 16). Bộ số chọn đúng kiểu kết quả là số nguyên nhưng phép tính đi qua phân số lẻ. Đột biến VS-chia-so-thuc mình tự chạy: BẮT. VS-i8-chia-so-thuc (`dot_bien.py:75`) mình không chạy lại; phiên chính báo bắt ở T18. Ca làm tròn LÊN ở số không chẵn thì `thu_NAP1.js:566` E8 vẫn khoá (21, 10400, 21000 → 11).
2. K4: grep `diemTruKhiHoan|tienHoanTinhDiem` trong server, cong_cu, client/src, viec ra 2 chỗ gọi mã thật: `diemThat.js:99` và `:104` (đã đổi), cộng bài cũ `thu_NAP1.js:566-568` (gọi 3 đối số, `mau = 1` mặc định giữ đúng, và bài xanh trong `npm test`). Cả 4 lối trừ (`refunds.js:182`, `damages.js:211`, `packages.js:271`, `signup-codes.js:262`) đều đi qua `truDiemHoan`. Phép chia khác trên đường điểm: `tienTinhDiem` (`:43`, round), `tienHangDiem` (`:31`, floor) và I8 (`:178`) chỉ chia MỘT lần trên số nguyên. Khoảng cách tới ngưỡng làm tròn ≥ 1/(2q), lớn hơn nhiều so với sai số số thực, nên không lệch. Huỷ đơn (`orders.js:1717-1725`) trừ bằng SQL số nguyên. Còn sót đúng 1 chỗ: `N` của I8 thiếu chốt NaN (lỗi 1).
3. K5: đối chiếu I8 với server từng nhánh: Đơn cũ: `thd` NULL thì `tienDiem` = tiền trả, cả hai bên như nhau. Đơn gói: server `mau = conTra`, `tu = (denBat + hoan) × conTra`; I8 `mau = 1`, `tu = denBat + hoan_r`. Cùng giá trị phân số nên ceil giống nhau. Mỗi đơn chỉ có một dòng gói (`orders.js:490-513`). Đơn huỷ: I8 cho `truHoan` = 0 (`:208`). `conTra ≤ 0`: cả hai bỏ phần không gắn dòng và lấy `mau = 1`. Duyệt hoàn, đền, mã bill: cùng phép tính. Không thấy luồng hợp lệ nào bị chặn hay đổi kết quả: phép mới chỉ đổi cách tính, không thêm điều kiện chặn.
4. K1: các câu vòng 2 trong `trang_thai.md:196-210` khớp code và số mình đo lại (PASS 111, 30 đạt). Đính chính trong `ke_hoach.md` đã có tại chỗ. Riêng chú thích `diemThat.js:46-49` lệch (lỗi 2).
5. Đường tiền: tiền tính điểm do server tự tính (`orders.js:934`, `diemThat.js:27-44`). Vòng 2 không thêm đầu vào nào từ máy khách.
6. P1: vòng 2 không đụng `client/src`. `--day-du`: "dist đã commit KHỚP với src hiện tại".
7. Nghiệm thu: xem dòng NGHIỆM THU bên dưới.
8. Đơn giản: dùng BigInt là có lý do, vì điểm × tiền × tiền có thể vượt 2^53. Chỉ còn lỗi 3, và việc I8 cùng phép tính mà viết lại thành `N` khác `soNguyen` (lỗi 1).

NGHIỆM THU: 6/6 mục có bằng chứng · mục thiếu: không
- A: T1, T10, T11, T12, T19. B: T3–T9, T6b. C: T13 (gồm T13d), T13b, T13c, T13e–h, T14, T14b, T15. D: T16, T17, cộng 3 thao tác thử tay (`trang_thai.md` mục "Thử tay"). E: T18, T18b. K5: T2b, T9, T12b, T19, cộng `thu_HOPDONG_KH` trong `npm test`.

CHƯA SOÁT ĐƯỢC: 34/36 đột biến (mình chỉ chạy VS-chia-so-thuc). `node tu_chay/cong.js chay`. Giao diện `TichDiem.jsx` trên điện thoại. Dữ liệu thật: cột amount có số lẻ không, có trùng product_code không, `loyalty_earn_per_amount` trên Turso đang là bao nhiêu. Ca phí giao + món trộn + trả một phần tiền mặt.

BÀI HỌC:
- KHOÁ: bài thử I8 thêm ca `loyalty_earn_per_amount` = 0 hoặc rỗng → I8 trả danh sách lệch, không sập. Thêm đột biến bỏ `|| 0` ở `soNguyen` của server.
- NGUYÊN TẮC (K4): đổi phép tính sang BigInt thì mọi chỗ ép kiểu phải đi qua MỘT hàm có chặn NaN / Infinity. Bản chép ở chỗ trọng tài (I8) phải chép cả phần chặn, không chỉ phép tính: `BigInt()` ném lỗi ở chỗ mà `Math.ceil` chỉ ra NaN, nên một chỗ đang "báo lệch" sẽ thành "sập".

### Đã sửa sau vòng 3 (vòng sửa 3 — chỉ đúng 3 lỗi NHẸ lần soát nêu)
- Bài thử TRƯỚC (commit 3245ddc): T18c (cài đặt điểm 0 / rỗng → I8 không sập), T13i (diemTruKhiHoan NaN / Infinity → 0). Trên code chưa vá vòng 3:
  30 đạt · 2 hỏng (BigInt ném "Infinity cannot be converted"). Sau vá: 32 đạt · 0 hỏng (`SỐ CA` 32).
- Lỗi 1: I8 `N` chặn số không hữu hạn (`Number.isFinite`) → 0. Lỗi 2: chú thích `diemTruKhiHoan` nói rõ phân số `tienHoan / mau`. Lỗi 3: thêm dấu
  cách, bỏ bí danh `B`, tách dòng `return` (`gan`, `khongGanDiem`). Nghi ngờ "soNguyen(Infinity) ném lỗi" → `soNguyen` cũng chặn `Number.isFinite`.
- Đột biến: thêm VS-ep-kieu-thieu-chan (T13i), VS-i8-ep-kieu-thieu-chan (T18c); sửa neo VS-hoan-toan-don, BV-q4-hoan-theo-toan-don,
  VS-q4-con-lai-bo-den-bat. ĐỐI CHỨNG XANH 32 đạt · 0 hỏng · TỔNG 38 · BẮT 38 · SỐNG 0 · HỎNG 0 · LẠC 0.
- Bảng chỗ vá vòng 3 → đột biến: soNguyen chặn NaN/Infinity → VS-ep-kieu-thieu-chan · I8 `N` chặn → VS-i8-ep-kieu-thieu-chan.
- Tên đột biến (đủ 38): 36 tên ở vòng sửa 2 + VS-ep-kieu-thieu-chan, VS-i8-ep-kieu-thieu-chan.
- Kiểm: `npm test -- --day-du` PASS 111 · FAIL 0 · CẢNH BÁO 1 (có sẵn).
- Hết 3 vòng sửa; lần soát cuối (vòng 3) ĐẠT, chỉ còn lỗi NHẸ đã sửa ở đây — theo LUAT §6.5 không gọi agent soát nữa.
SOÁT LẦN CUỐI: chat soát thay

### Thử tay cho chủ quán (giao diện — LUAT §6.4)
1. Cài đặt → Điểm thưởng → khung "✅ Tích điểm theo món / gói / thẻ" (dưới nút Lưu): bấm công tắc một món sang Tắt → tải lại trang, món đó vẫn Tắt.
2. Bấm "Chọn tất cả" ở nhóm món → "Tắt tích điểm" → mọi món Tắt; "Chọn tất cả" → "Bật tích điểm" → bật lại hết.
3. Tắt một món, bán đơn có món đó + một món bật cho khách có SĐT → điểm khách chỉ tăng theo phần món bật; bật lại món đó sau.

## Soát bảo mật
Lần 1 (10.11, `/soat-bao-mat`, subagent chỉ đọc, HEAD sau vòng sửa 3). Số lỗi trước lọc: 0 · sau lọc: 0 (bước 2 không tìm được gì → không chạy bước 3).
Báo cáo nguyên văn:

Không tìm thấy lỗ hổng.

Mình đã đọc diff code chạy thật (`git diff 997bf52^ HEAD -- server client/src`) và lần theo các chỗ gọi. Các điểm đã kiểm:

- **PUT /api/pos/loyalty/tich-diem** (`server/routes/loyalty.js`, khối DIEM-MON-1 ở cuối file): cửa này cần `authenticate` cộng `checkPermission('manage_promotions')`, đúng như chủ quán đã chốt. Tên bảng lấy từ danh sách trắng `BANG_TICH_DIEM` qua `Object.hasOwn`, nên không chèn được SQL hay đi lối prototype. Mỗi `ids` phải là `Number.isSafeInteger` lớn hơn 0, tối đa 500 mục, và đều đi qua tham số `?`. `bat` phải là kiểu boolean. Lỗi đi qua `loiGhi` và không lộ lời nội bộ.
- **GET /tich-diem** cần `manage_settings`. Cửa này chỉ trả id, tên và cờ, không có giá vốn hay dữ liệu khách.
- **Cờ tích điểm khi bán** (`server/routes/orders.js`): `tich_diem` của từng dòng lấy từ dòng đọc trong cơ sở dữ liệu (`product` ở `SELECT * FROM pos_products ... is_active = 1`, `pkg` ở dòng 491, `membershipTier` ở dòng 523), không lấy từ thân yêu cầu. `tienHangDiem` tính trên giá máy chủ tự tra, và kết quả không vượt quá tiền hàng. Máy khách không có cách nào đẩy điểm lên.
- **Đổi thứ tự trong damages.js** (khoảng dòng 201–212): trần tiền đền `tranLan` / `tranTong` vẫn được kiểm trước khi ghi. Dòng sự cố được ghi trước rồi mới ghi ví và trừ điểm, tất cả trong cùng một giao dịch. `finalRefund` chỉ lớn hơn 0 khi action là `'refund'`, nên hành vi ghi ví không đổi. Dòng gói / thẻ vẫn bị chặn với mã `GOI_THE_KHONG_DEN`.
- **`tienHoanTinhDiem` / `truDiemHoan`** (`server/utils/diemThat.js`): mọi câu SQL đều dùng tham số. Tiền đền ghi vào dòng đang tắt tích điểm thì bị giới hạn theo số khách đã trả cho đúng mã món đó (`tienDaTraTheoDong`), nên không lách được để giữ điểm của dòng đang bật. Mọi chỗ gọi đều truyền dòng đơn có `tien_hang_diem`: refunds.js đọc `SELECT *`, packages qua `tienDaTra.js:76` cũng `SELECT *`, damages.js `SELECT *`, hoaDon.js:144 `SELECT *`, còn signup-codes.js kê cột có thêm `tien_hang_diem`. Không có chỗ nào rơi về cách tính cũ một cách lặng lẽ khiến bị trừ ít điểm hơn.
- **Bước nâng cấp 024** chỉ thêm cột, tên bảng và cột viết cứng, không có dữ liệu người dùng đi vào.
- **Màn quầy** (`TichDiem.jsx`, `api.js`) gọi qua `utils/api.js`, không có `dangerouslySetInnerHTML`.

Không có mục nào đạt độ tin cậy từ 7/10 trở lên.

SOÁT BẢO MẬT: ĐẠT

## Câu hỏi
- Q1 (đã đề xuất trong ke_hoach.md mục 5): khi hoàn / đền / kết thúc gói, trừ điểm theo tỷ lệ trên TOÀN tiền đơn (đề xuất) hay chỉ khi phần hoàn
  thuộc dòng bật điểm? Chủ quán xác nhận lúc duyệt kế hoạch.
- Agent soát kế hoạch (chỉ đọc): không ra ngoài Phạm vi. Đã sửa theo soát: dùng cùng quy tắc chia tiền theo dòng của `tienDaTra.js`
  (mã 1 món giảm MỘT đơn vị); chặn chia cho 0 khi đơn chỉ lấy từ gói; bỏ cờ cho dòng nạp (đơn nạp vốn 0 điểm); thêm ca duyệt hoàn, nhận mã sau
  đền, mã 1 món; T13 đền hai lần theo trần từng dòng; T18 dùng đơn không SĐT; ghi rõ số kỳ vọng T6/T10/T11/T14.
- Kho nông thiếu commit cbbb809 → `thu_BH2.js` (bộ kiểm) đỏ "bad revision"; đã `git fetch --unshallow` (chỉ tải lịch sử).

- **Q1 — ĐÃ TRẢ LỜI 09.11:** CÁCH 2.
- **Q2 (09.11) — xin thêm `server/routes/damages.js` vào Phạm vi.** Đền theo món cần biết lần đền thuộc món nào; lúc trừ điểm (damages.js:208) dòng
  nhật ký sự cố của lần đó chưa ghi (ghi ở :211). Đề xuất: dời đúng một dòng `ghiHangHong` lên trước — không đổi tiền, không đổi trả lời. Không
  thêm thì phải đọc mã món từ chữ ghi chú sổ ví (dễ vỡ) — mình không đề xuất.
- **Q3 (09.11) — xin thêm `cong_cu/gia_lap/bat_bien.js` vào Phạm vi (chặn nghiệm thu E).** Màn Đối soát chạy phép I8 trên dữ liệu thật
  (doiSoat.js:18,39,203); I8 tự tính lại điểm theo tiền CẢ đơn (bat_bien.js:146-190) → tắt điểm một món là mọi đơn có món đó hiện "lệch". Đề xuất:
  I8 áp cùng luật mới (tỷ lệ món bật + CÁCH 2), đơn cũ giữ y hệt; bài thử T18 khoá. Kế hoạch cũ ghi "đối soát không tính lại" là sai — mình chưa
  đọc I8 lúc lập kế hoạch.
- **Đề xuất cho chủ quán:** đồng ý cả Q2 và Q3 (sửa phiếu `## Phạm vi` thêm hai dòng), rồi gõ lại `/lam-viec DIEM-MON-1 tiep`.

- **Q4 (09.11, sau soát vòng 1) — điểm khi ĐỀN một món rồi DUYỆT HOÀN cả đơn.** Lời thường: khi duyệt hoàn, quán chỉ trả lại phần tiền CÒN LẠI (đã
  trừ phần vừa đền — `tienDaTra.js:47-49`). Luật mình viết ("duyệt hoàn trừ điểm theo toàn đơn") làm điểm phụ thuộc thứ tự: đơn X (tắt điểm) 40.000 +
  Y (bật) 60.000 = 60 điểm; đền X rồi duyệt hoàn → khách trả lại hết tiền mà vẫn giữ 24 điểm; đền Y trước rồi duyệt hoàn → 0 điểm.
  **Đề xuất của mình (cách a):** duyệt hoàn trừ điểm theo PHẦN CÒN LẠI của đơn: điểm trừ = điểm × (tiền tính điểm − phần đền món bật) / (tiền trả − tổng
  đền) × tiền hoàn / … — nói gọn: hoàn hết phần còn lại thì điểm về 0, bất kể đền trước món nào. Đơn chưa đền: y hệt hôm nay. Cách b: đơn sang
  "đã hoàn" thì trừ hết điểm còn lại (đơn giản hơn, nhưng đơn trả một phần bằng tiền mặt — phần tiền mặt không hoàn — cũng mất điểm phần đó, khác luật
  NAP-1 hôm nay). **Bạn cần:** trả lời "Q4 = a" (hoặc b), rồi gõ lại `/lam-viec DIEM-MON-1 tiep`. Mình sẽ thêm ca thử "đền rồi duyệt hoàn" (đỏ trước),
  sửa `diemThat.js` + I8 cùng luật, đột biến, soát lại.
- **Q5 (09.11) — xin thêm `cong_cu/thu_KHO1.js` vào `## Phạm vi`.** Bài cũ khoá đúng danh sách cột `pos_products`; bước 024 thêm cột `tich_diem` nên
  mình đã thêm đúng một tên cột vào danh sách (LUAT §6.7 cho sửa, không dừng hỏi). Nhưng cổng kiểm phạm vi báo:
  `✗ [A6] file \`cong_cu/thu_KHO1.js\` không có trong Phạm vi của phiếu`. **Bạn cần:** thêm một dòng `- cong_cu/thu_KHO1.js` vào Phạm vi của phiếu.
- Nghi ngờ của người soát cần bạn xác nhận (không chặn): bật / tắt tích điểm của HẠNG chỉ cần quyền "Quản lý khuyến mãi", không cần PIN chủ quán
  (sửa hạng ở màn Hạng thẻ thì cần PIN). Mình đề xuất giữ như kế hoạch đã duyệt (công tắc điểm không đổi giá / hạng của khách).
- **DỪNG ở bước 8 (vòng sửa 1)** chờ Q4, Q5.
- **Q4 — ĐÃ TRẢ LỜI 09.11:** cách a. **Q5 — ĐÃ TRẢ LỜI 09.11:** phiếu eb4060c thêm `cong_cu/thu_KHO1.js`. **PIN công tắc hạng:** giữ không PIN.

## Phát hiện
- (soát vòng 2, nghi ngờ) Duyệt hoàn: `refunds.js` lấy `refund_amount = balance_amount` (có thể gồm phí giao trả bằng ví); `soTienHoan`
  (`tienDaTra.js`) không trừ phí giao, còn tiền tính điểm đã bỏ phí giao → đơn có phí giao trả bằng ví có thể bị trừ điểm hơi nhiều hơn phần hàng
  hoàn. Có sẵn từ NAP-1 (đơn toàn món bật y hệt trước), hai file ngoài Phạm vi — chưa dựng ca, đề xuất cho việc sau.
- `server/utils/tienDaTra.js` (ngoài Phạm vi): quy tắc chia tiền theo dòng nằm trong hàm bất đồng bộ đọc kho; tách phần thuần ra thì
  DIEM-MON-1 gọi lại được thay vì chép cùng công thức — đề xuất cho việc sau.

## Báo cáo 7 mục (phiên 10.11 — sau vòng sửa 1–3 và soát bảo mật)
```
VIỆC:        DIEM-MON-1 — Công tắc "Tích điểm" theo món / thẻ hạng / gói; máy chủ chỉ cộng điểm phần tiền của dòng bật
ĐÃ SỬA:      (phiên này — phần trước: mục "Bước 4–6", "Đã sửa sau vòng 1")
             server/utils/diemThat.js:74-90 tienHoanTinhDiem — duyệt hoàn sau đền quy theo PHẦN CÒN LẠI (Q4 = a: × (tiền tính điểm − đền bật) /
               (tiền trả − tổng đền)); trả phân số { tu (BigInt), mau } thay vì số thực
             server/utils/diemThat.js:52-61 soNguyen (một chỗ ép BigInt, chặn NaN / Infinity) + diemTruKhiHoan(diem, tienHoan, tienDiem, mau = 1)
               ceil bằng số nguyên một lần (hết trừ thừa 1 điểm ở ca số lẻ)
             cong_cu/gia_lap/bat_bien.js:199-209 I8 cùng luật Q4 + cùng phép số nguyên, chặn NaN / Infinity (không sập khi cài đặt điểm 0 / rỗng)
             cong_cu/thu_DIEMMON1.js — thêm T13e, T13f, T13g, T13h, T13i, T18c
BÀI THỬ:     cong_cu/thu_DIEMMON1.js trên gốc e90d42a → ĐỎ 6 đạt · 26 hỏng; trên code trước vá Q4 → ĐỎ T13e [60,60,24], T13f [60,60,54]; trước vá
             vòng 2 → ĐỎ T13h 13 → 10; trước vá vòng 3 → ĐỎ T18c, T13i (BigInt ném). Sau vá → XANH 32 đạt · 0 hỏng.
             Đột biến: ĐỐI CHỨNG 32 đạt · 0 hỏng · 38 đột biến · BẮT 38 · SỐNG 0 · HỎNG 0 · LẠC 0.
             npm test -- --day-du: PASS 111 · FAIL 0 · CẢNH BÁO 1 (có sẵn). node tu_chay/cong.js chay: ✓ CỔNG CHẠY ĐẠT.
ĐÃ RÀ K4:    grep "diemTruKhiHoan|tienHoanTinhDiem" trong server, cong_cu, client/src → 2 chỗ gọi mã thật (diemThat.js truDiemHoan) + thu_NAP1.js E8
             (3 đối số, mau = 1 mặc định — xanh); 4 lối trừ điểm (refunds, damages, packages, signup-codes) cùng qua truDiemHoan; bản chép I8 vá cùng
             (luật Q4, số nguyên, chặn NaN) — đã xử lý hết. Phép chia khác trên đường điểm (tienTinhDiem round, tienHangDiem floor) chia MỘT lần
             trên số nguyên — không lệch (soát vòng 3 xác nhận).
CHƯA KIỂM:   - Giao diện TichDiem.jsx trên điện thoại (3 thao tác thử tay ở mục "Thử tay cho chủ quán").
             - Bước 024 trên Turso thật; hiệu năng I8 (JOIN / EXISTS mới) trên dữ liệu thật; trùng product_code giữa món / gói / thẻ trên dữ liệu thật.
             - Ca phí giao trả bằng ví + món trộn + trả một phần tiền mặt khi duyệt hoàn (Phát hiện — có sẵn từ NAP-1, file ngoài Phạm vi).
             - Quán > 500 món: "Chọn tất cả" bị 400 TICH_DIEM_SAI (ID_TICH_DIEM_TOI_DA = 500) — chưa biết số món thật.
             - Bill vẫn in "nhận gấp N điểm" cho đơn mà mọi dòng tắt điểm (phiếu cấm đổi bill).
             - Sau vòng sửa 3 không gọi agent soát nữa (LUAT §6.5 — chat soát thay); soát bảo mật chạy SAU vòng sửa 3 (ĐẠT).
GIT:         34996a4 DIEM-MON-1: soat bao mat lan 1 — DAT (0 lo hong)
             c57fb17 DIEM-MON-1: vong sua 3 — bao cao soat vong 3 (DAT), bang chung T18c/T13i, trang thai
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 2 · BỎ 2 — chi tiết ở ## Bài học
```

### Nghiệm thu — đếm từng mục
- A (cờ ở món / gói / hạng, mặc định bật; nạp 0 điểm; phí giao không điểm): T1, T10, T11, T12, T19.
- B (một hàm tiền tính điểm theo dòng cho quầy / App / nhận mã / thu nợ): T3, T4, T5, T6, T6b, T7 (App), T8 (/nhan-diem), T9 (thu nợ).
- C (trừ điểm không quá điểm đã cộng, đúng tỷ lệ): T13 (+T13d), T13b, T13c, T13e, T13f, T13g, T13h, T13i, T14, T14b, T15.
- D (Cài đặt → Điểm thưởng, chọn nhiều, quyền manage_promotions): máy chủ T16, T17; giao diện → 3 thao tác thử tay (CHƯA KIỂM máy).
- E (đối soát không lệch): T18, T18b, T18c.
- K5 (luật khác, hợp đồng /api/kh, giá, hạng không đổi): T2, T2b, T9, T12b, T19 + thu_HOPDONG_KH, thu_P2223 trong npm test.

## Bài học
Sự cố của việc (phiên 09–10.11): luật CÁCH 2 viết "duyệt hoàn theo toàn đơn" mà chưa rà soTienHoan đã trừ phần đền (soát vòng 1 → Q4, phải dừng hỏi);
phép quy đổi chia số thực hai lần rồi ceil → trừ thừa 1 điểm, I8 chép cùng lỗi nên Đối soát không bắt (soát vòng 2); đổi sang BigInt quên chặn
NaN / Infinity ở I8 → Đối soát sập khi cài đặt điểm 0 (soát vòng 3). Người gác chặn: B-BIMAT-CHU (chạy / ghi bài có cụm bí mật chưa commit → commit
trước, ghi bằng Edit), B-CD-VITRI và GIT-TUYCHON (cd giữa lệnh, git -C → tách lệnh), B-PHANTICH (chuyển hướng ra file khi chạy script → bỏ ghi
file). Kho nông lại ở phiên mới (thu_BH2 đỏ "bad revision") → unshallow.

- **KHOÁ 1** (đã làm, trong Phạm vi): T13e/T13f/T13g — điểm sau "đền rồi duyệt hoàn" không phụ thuộc thứ tự; đột biến BV-q4-*, VS-q4-*, BV-i8-q4-*.
- **KHOÁ 2** (đã làm): T13h — ca số lẻ mà kết quả đúng là số nguyên nhưng phép tính đi qua phân số; đột biến VS-chia-so-thuc, VS-i8-chia-so-thuc.
- **KHOÁ 3** (đã làm): T18c + T13i — đầu vào hỏng (cài đặt 0 / rỗng, NaN, Infinity) → không ném lỗi; đột biến VS-ep-kieu-thieu-chan, VS-i8-ep-kieu-thieu-chan.
- **NGUYÊN TẮC 1** (đề xuất cho `KHUON_LOI.md` K4 — ngoài Phạm vi, máy không tự sửa): "Luật trừ / chia theo PHẦN: rà mọi hàm tính SỐ TIỀN của khoản
  đó (DIEM-MON-1: soTienHoan đã trừ phần đền → khoản 'không gắn dòng' thật ra là 'phần còn lại'). Một luật trừ điểm phải cho cùng kết quả dù các
  bước theo thứ tự nào — mỗi luật một ca đổi thứ tự."
- **NGUYÊN TẮC 2** (đề xuất cho `KHUON_LOI.md` K3 — ngoài Phạm vi): "Phép tính điểm / tiền ghép nhiều lần chia rồi ceil / floor: tính bằng phân số số
  nguyên, làm tròn MỘT lần; ép kiểu số nguyên lớn qua MỘT hàm có chặn NaN / Infinity. Trọng tài (I8) chép cùng biểu thức thì không bắt được lỗi làm
  tròn — cần ít nhất một ca so với số tính tay có bộ số lẻ (DIEM-MON-1 T13h: 13 → 10 thay vì 11)."
- **BỎ 1**: kho nông làm thu_BH2 đỏ "bad revision" — skill bước 1.3 đã có cách xử lý (unshallow), chỉ là phiên mới; không thêm luật.
- **BỎ 2**: các lệnh bị người gác chặn — đều có hướng dẫn trong lý do chặn, làm theo được ngay; một lần mỗi loại.
- Dọn (11.3): không thấy lời dặn nào trong KHUON_LOI.md / CLAUDE.md mới có phép kiểm làm thay nhờ việc này.
