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

## Phát hiện
- `server/utils/tienDaTra.js` (ngoài Phạm vi): quy tắc chia tiền theo dòng nằm trong hàm bất đồng bộ đọc kho; tách phần thuần ra thì
  DIEM-MON-1 gọi lại được thay vì chép cùng công thức — đề xuất cho việc sau.
