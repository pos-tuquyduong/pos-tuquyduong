# KHACH-CK-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/KHACH-CK-1`, cây sạch.
- HEAD `29db8d3` · FETCH_HEAD `29db8d3` — bằng nhau, không kéo.
- `git log --oneline -3`:
  - `29db8d3 PHIEU: KHACH-CK-1`
  - `a3192b7 TIEN-DO: BH-2 (23d2369), KHO-2a (c8edb66) xong; mo KHACH-CK-1; them GIOVANG-1, KH-SP-1, KH-MUA-2, KH-SP-2, KH-TN-1; quyet dinh 30.10 (dat don online truoc khai truong); lich moi — so v48`
  - `c8edb66 Merge pull request #53 from pos-tuquyduong/viec/KHO-2a`
- Phiên làm tiếp (sau duyệt): HEAD `c4b0ce5` · FETCH_HEAD `c4b0ce5` — bằng nhau, không kéo.
- Phiên làm tiếp (sau sửa Phạm vi, 31.10): HEAD `5d8a630` · FETCH_HEAD `5d8a630` — bằng nhau, không kéo. `git log --oneline -3`:
  - `5d8a630 PHIEU: KHACH-CK-1 them 6 bai thu cu vao Pham vi (LUAT 6.8, chu quan duyet ke hoach 31.10)`
  - `aa89606 KHACH-CK-1: trang thai — bang dot bien, cau hoi Pham vi (6 bai thu cu)`
  - `3775014 KHACH-CK-1: bang chung do (bai moi tren goc, ban goc bai cu tren code moi, SO CA)`

## Duyệt kế hoạch (chủ quán, 30.10)
- Giữ hai cửa ghi, chỉ chặn mức > 0: đồng ý.
- Khôi phục sao lưu cũ đem mức giảm trở lại: chấp nhận, không sửa backup.js.
- Giờ vàng: khách từng có % riêng đi qua với giá Flash: đồng ý.
- Ô "Chiết khấu" giảm tay ở màn cũ: giữ nguyên.
- P20 / GOI1: KHÔNG thêm `## Bài thử cũ sửa`; bài sửa thường (LUAT §6.8) — đổi ca sang mã giảm + mỗi file thêm một ca đỏ trên gốc (hồ sơ
  cũ, không mã, trả đủ niêm yết → tổng không giảm); tự chạy bản gốc hai file trên code mới để chắc đỏ.

## Tiến độ
- Bước 4 (bài thử đỏ trước) xong — `bang_chung_do.txt` mục 1 (bài mới 8 đạt · 26 hỏng trên gốc) + mục 2 (bản gốc P20 / GOI1 / UUDAI1 /
  P26c / BH1 / BH2 đỏ trên code mới — P20 sập ở "20.000 ≠ 25.000", GOI1 sập ở "1.215.000 ≠ 1.350.000").
- Bước 5 (sửa) xong. Bước 6: `npm test -- --day-du` → PASS 86 · FAIL 0 · CẢNH BÁO 1 (cảnh báo cũ "route GET có lệnh ghi (3)" ở
  packages.js / products.js / sync.js — không thuộc việc này). Đã build `client/dist`.
- Bước 4 đợt 2: `node tu_chay/cong.js tinh . 29db8d3^ HEAD viec/KHACH-CK-1` → ĐỎ A6 (Phạm vi) — đã dừng hỏi; chủ quán sửa phiếu ở
  `5d8a630` (thêm 6 bài cũ vào Phạm vi). Phiên tiếp 31.10: cổng tĩnh chỉ còn A19 (chưa tới bước 11.4) → soát độc lập (`## Soát độc lập`).

## Chỗ vá → đột biến (`python3 viec/KHACH-CK-1/dot_bien.py` → vòng sửa 4: 38 đột biến · BẮT 38 · SỐNG 0 · HỎNG 0 · LẠC 0, đối chứng 7 bài xanh)
| Chỗ vá | Đột biến |
|---|---|
| `server/routes/orders.js` LO 2 — máy chủ thôi đọc chiết khấu hồ sơ; vòng 1 bỏ hai nhánh tính theo mức (đã chết) — BV-LO2* đưa lại CẢ hai | BV-LO2, BV-LO2-TINHTHU, BV-LO2-FLASH, BV-LO2-UUDAI1, BV-LO2-GOI1, BV-LO2-P20, VS-LO2-CHI-PERCENT, VS-LO2-TIN-TO-KHAI (bắt ở F3c) |
| `server/routes/customers-v2.js` PUT `/:phone/discount` chặn > 0, ghi 0 (UPDATE và INSERT) | BV-CHAN-V2, BV-CHAN-V2-INSERT, BV-CHAN-V2-P26C, VS-CHAN-V2-CHI-PERCENT, VS-V2-GHI-MUC-THAN, VS-V2-INSERT-GHI-MUC-THAN |
| `server/routes/customers.js` PUT `/:id/discount` chặn > 0, ghi 0 | BV-CHAN-V1, VS-CHAN-V1-CHI-FIXED, VS-V1-GHI-LOAI-THAN |
| `server/nang_cap/004_bo_chiet_khau_rieng.js` | BV-004-SAO-LUU, VS-004-SAO-LUU-SAU-UPDATE, VS-004-CHI-PERCENT, VS-004-CHI-DUONG, VS-004-LUON-SAO-LUU, BV-004-BANG-TRONG, VS-004-KHONG-LOG |
| `client/src/pages/BanHang/tinh.js` (tinhGio, dungDonHang, coChietKhauRieng) | BV-TINH-KHACHGIAM, BV-TINH-KHACHGIAM-BH1, BV-DUNG-DON-GUI-MUC, BV-TINH-COCHIETKHAURIENG |
| `client/src/pages/BanHang/BanHangMoi.jsx` bỏ khoá chanChietKhau | BV-CHAN-BANHANGMOI, BV-CHAN-BANHANGMOI-BH2 |
| `client/src/pages/Sales.jsx` bỏ điền mức khách khi chọn khách / chữ "KH:" | BV-SALES-CHON-KHACH, VS-SALES-TEN-KHAC |
| `client/src/components/CustomerInput.jsx` bỏ huy hiệu | BV-CUSTOMERINPUT-HUY-HIEU, VS-CUSTOMERINPUT-TEN-KHAC |
| `client/src/pages/Customers.jsx` bỏ lọc / cột / form; nhãn Ghi chú khách | BV-CUSTOMERS-LOC, VS-NHAN-GHI-CHU, VS-CUSTOMERS-GHI-CHU-KHI-CO-CK, VS-CUSTOMERS-MAT-GHI-CHU |

## Soát độc lập
### Vòng 1 (31.10, HEAD `18160dd`) — KHÔNG ĐẠT (chỉ lỗi NHẸ) — báo cáo của người soát, chép nguyên phần kết luận:
```
LỖI TÌM ĐƯỢC:
 1. ke_hoach.md:21 (lặp :137) và trang_thai.md (Phát hiện) — "tổng hiện theo tinh-thu nên chỉ lộ khi tinh-thu lỗi" SAI: Sales.jsx:166 chỉ
    gọi tinh-thu khi CÓ mã; không mã thì tổng tự tính có trừ giảm tay (Sales.jsx:624-636), máy chủ bỏ qua → 400 "không khớp". Chủ quán
    duyệt "giữ nguyên" dựa trên câu sai. Sửa câu + báo lại chủ quán; đề xuất việc riêng, KHÔNG sửa trong việc này (phiếu F). — K1
 2. server/routes/orders.js:719-723 — nhánh else-if percent / fixed nay là code CHẾT, chú thích "giảm riêng của khách — như cũ" sai;
    :665-666 F2 "voucher % hoặc giảm tay %" cũ. Gọn: chỉ giữ `if (discountCodeId) finalDiscountAmount = uuDai.giam_ma;`. — K1 / K4
 3. thu_KHACHCK1.js mục B — nhánh INSERT của cửa v2 (customers-v2.js:365-369) không có ca mức ≤ 0 khác 0 và không có đột biến. — K3 / K4
 4. ke_hoach.md:84 ca A4 (payOS) không có bài, không ghi CHƯA KIỂM; ke_hoach.md:101 ca E2 (GET v2 trả discount_note) không có bài. — K1
NGHI NGỜ: màn Khách hàng bản cũ còn trong trình duyệt + hồ sơ còn mức > 0 → 400 khi lưu ghi chú tới khi tải lại; khôi phục sao lưu cũ đem
 mức > 0 trở lại (đã grep: không chỗ nào áp / hiện).
NGHIỆM THU: 6/6 mục có bằng chứng (A4 payOS đỡ bằng A3 cùng hàm taoDon; E2 thiếu).
CHƯA SOÁT ĐƯỢC: 004 trên Turso thật; --day-du trọn bộ; thử tay giao diện; payOS (A4); kiem_neo.py các đột biến cũ lạc neo.
BÀI HỌC: KHOÁ — hồ sơ viết "tổng hiện theo X" phải trích ĐIỀU KIỆN gọi X; NGUYÊN TẮC — bỏ một nguồn giá trị thì grep mọi nhánh tiêu thụ
 phía dưới; mỗi ca trong bảng kế hoạch hoặc có trong bài hoặc có dòng CHƯA KIỂM; cửa ghi có UPDATE/INSERT thì mỗi nhánh một ca + đột biến.
```
### Vòng sửa 1 — đã làm
- Lỗi 1: sửa câu ở `ke_hoach.md` (bảng hiện trạng + mục 3 câu hỏi) và `## Phát hiện` (dẫn `Sales.jsx:166`, `:624-636`, `orders.js:846`);
  báo lại chủ quán trong báo cáo. KHÔNG sửa `Sales.jsx` (phiếu F dặn giữ).
- Lỗi 2: `orders.js` bỏ hai nhánh chết, chỉ còn `if (discountCodeId) finalDiscountAmount = uuDai.giam_ma;`; chú thích F2 sửa "chặn voucher
  kiểu %". Đột biến BV-LO2* đưa lại CẢ khối đọc hồ sơ lẫn hai nhánh tính. VS-LO2-TIN-TO-KHAI hết bị F3b bắt (không còn nhánh tính) → thêm
  ca F3c: dòng đơn không ghi mức tờ khai (`orders.js` cột discount_type / discount_value) — đột biến bắt ở F3c.
- Lỗi 3: ca B7c (v2 khách chưa có hồ sơ, −5 fixed → tạo mức 0 percent, ĐỎ trên gốc) + đột biến VS-V2-INSERT-GHI-MUC-THAN.
- Lỗi 4: ca E2 (GET `/v2/customers/:sdt` trả discount_note, K5 xanh trên gốc). A4 payOS: **CHƯA KIỂM** — kho thử không tạo được phiên
  payOS; dựa A3 (tinh-thu cùng hàm `taoDon`).
- Kết quả: `thu_KHACHCK1.js` 37 đạt (gốc 10 đạt · 27 hỏng); đột biến 35 · BẮT 35; `npm test` PASS 82 · FAIL 0 · CẢNH BÁO 1 (cũ).

### Vòng 2 (31.10, HEAD `f463a0f`) — KHÔNG ĐẠT (chỉ lỗi NHẸ) — chép nguyên phần kết luận:
```
LỖI TÌM ĐƯỢC:
 1. cong_cu/thu_KHACHCK1.js:252-253 (D1c) — tên ca hứa "mọi tên biến", regex chỉ /[cC]ustomer\??\.discount_(value|type)/; khôi phục nhánh
    điền mức bằng tên khác (c., data., kh.) vẫn XANH. — K3 — NHẸ
 2. bang_chung_do.txt mục 3 — còn "34 đạt", "TỔNG 34 đột biến" (thật 37 / 35). — K4 — NHẸ
 3. trang_thai.md ## Tiến độ ("DỪNG ở đây … chưa chạy /ra-soat") và ## Câu hỏi mục 1 — đã cũ sau 5d8a630. — K1 — NHẸ
 4. ke_hoach.md mục 3 — tên đột biến dự kiến (VS-LO2-CHI-PERCENT, VS-CHAN-V2-PARSE, VS-CHAN-V1-GHI-THAN, VS-004-KHONG-SAO-LUU,
    VS-004-SAO-LUU-SAU) không có trong dot_bien.py; VS-LO2-CHI-PERCENT không có đột biến tương ứng. — K4 — NHẸ
Đã kiểm, không lỗi: vòng sửa orders.js tương đương (finalDiscountType/Value 615-718 chỉ gán ở 616-617, 662 trong if(false), 713-714);
 mọi chỗ dùng phía dưới đúng; mã / hạng / gói / Giờ vàng xanh.
NGHI NGỜ: 004 CREATE TABLE IF NOT EXISTS không sao lưu lại nếu bảng sao lưu đã có (bộ chạy khoá pos_nang_cap nên bình thường không xảy ra);
 log 004 in trước commit; bảng sao lưu chép cả pin_code (như 002); phiên payOS lập trước deploy cho khách có mức riêng.
NGHIỆM THU: 6/6 (A4 payOS CHƯA KIỂM, dựa A3).
Đơn giản (không bắt buộc): orders.js:542-543 khởi tạo từ thân rồi LO 2 xoá — có thể khởi tạo thẳng null / 0.
CHƯA SOÁT ĐƯỢC: 004 trên Turso thật; payOS; thử tay giao diện; kiem_neo.py đột biến cũ; cong.js chay.
BÀI HỌC: KHOÁ — tên ca hứa "mọi tên biến" thì regex không gắn tên đối tượng + đột biến dùng tên khác; NGUYÊN TẮC — sau mỗi vòng sửa grep cả
 viec/<MÃ>/ tìm số cũ, tên đột biến cũ, dòng "DỪNG / chờ" và câu hỏi đã trả lời.
```
### Vòng sửa 2 — đã làm
- Lỗi 1: D1c gom MỌI `<x>.discount_value / discount_type` trong Sales.jsx, chỉ cho `discountCodeValid` (mã), `order` / `completedOrder`
  (đơn đã tạo, in hoá đơn); đỏ trên gốc (in đủ tên), đột biến mới `VS-SALES-TEN-KHAC` (điền mức qua `kh`) bị bắt — bản D1c cũ không bắt.
- Lỗi 2: `bang_chung_do.txt` mục 3 ghi rõ "lần đầu, số đã cũ", thêm mục 3b số hiện hành (37 ca, 37 đột biến).
- Lỗi 3: `## Tiến độ` và `## Câu hỏi` ghi đúng trạng thái (câu 1 ĐÃ TRẢ LỜI ở `5d8a630`).
- Lỗi 4: `ke_hoach.md` thêm bảng đối chiếu tên dự kiến → tên thật; dựng `VS-LO2-CHI-PERCENT` (chỉ áp nhánh fixed) — bắt ở A2.
- Nghi ngờ 004 IF NOT EXISTS / log trước commit: không sửa — cùng khuôn `themCot` / bước 002, bộ chạy khoá `pos_nang_cap`; ghi CHƯA KIỂM
  phần Turso. Gợi ý đơn giản orders.js:542-543: không làm (không bắt buộc, đổi thêm dòng tiền ngoài ý vòng sửa).
- Kết quả: đột biến 37 · BẮT 37 · SỐNG 0; `thu_KHACHCK1.js` 37 đạt (gốc 10 · 27 hỏng); `npm test` PASS 82 · FAIL 0 · CẢNH BÁO 1 (không
  `--day-du`; vòng 2 không đổi `client/src`).

### Vòng 3 (31.10, HEAD `96f397c`) — KHÔNG ĐẠT (chỉ lỗi NHẸ, LUAT §6.5 → vòng sửa 4 trong phiếu) — chép nguyên phần kết luận:
```
LỖI TÌM ĐƯỢC:
 1. ke_hoach.md mục 3 dòng D1 hứa "CustomerInput.jsx không còn discount_value" trái §9 Q2 (giữ CustomerInput.jsx:83-84,119-120); ca D1d
    (thu_KHACHCK1.js:261) chỉ dò /customerData\.discount_value|CK:/ — gắn tên, cùng khuôn D1c vòng 2 (CustomerInput không được file nào
    import — component chết, rủi ro thấp). — K1 / K3 — NHẸ
 2. trang_thai.md "Vòng sửa 2 — Kết quả" không ghi npm test / --day-du; chưa có cong.js chay (LUAT §6.3). — K1 — NHẸ
 3. ke_hoach.md mục 3 ca "F2 hai người cùng bấm" trong bài tên B8 — lệch tên hồ sơ / bài. — K4 — NHẸ
Đã kiểm, không lỗi: K3 (gốc 10 · 27 hỏng; D1c, B7c, F3c, BV-LO2*, VS-LO2-CHI-PERCENT đúng); vòng sửa orders.js tương đương; K4 18 chỗ
 INSERT/UPDATE pos_customers — chỉ hai cửa ghi mức, đã vá; K5 không chặn oan (thu_P3 100 đạt); tiền không tin thân gửi; P1 dist khớp;
 004 không ALTER/DROP; Phạm vi đủ, không đụng file Cấm. Tự chạy: thu_KHACHCK1 37 · đột biến 37/37 · --day-du PASS 86 · cong.js tinh chỉ A19.
NGHI NGỜ: D1c không bắt destructuring / customer['discount_value']; phiên payOS lập trước deploy; 004 hỏng trên Turso khoá đường kho 503;
 bảng sao lưu chép pin_code (như 002); ô giảm tay màn cũ (đã ghi Phát hiện).
NGHIỆM THU: 6/6 (A4 payOS CHƯA KIỂM, dựa A3).
CHƯA SOÁT ĐƯỢC: 004 trên Turso thật; payOS; thử tay; cong.js chay; kiem_neo.py đột biến cũ lạc neo.
Đơn giản (không bắt buộc): orders.js:542-543 khởi tạo thẳng null / 0, bỏ khối LO 2.
BÀI HỌC: KHOÁ — mọi ca "vắng mặt X" đọc mã dò không gắn tên đối tượng (áp D1d); NGUYÊN TẮC — §9 đổi quyết định thì sửa luôn dòng ca ở
 mục 3; sau mỗi vòng sửa ghi npm test / --day-du / cong.js chay vào dòng "Kết quả".
```
### Vòng sửa 4 (chat soát thay — LUAT §6.5) — đã làm, CHỈ đúng các lỗi vòng 3 nêu
- Lỗi 1: D1d gom MỌI `<x>.discount_(value|type)` trong CustomerInput.jsx, phải BẰNG đúng `[data.type, data.value]` (hai dòng chép phản hồi giữ
  theo Q2) và không có "CK:"; đỏ trên gốc (in `customerData.*`); đột biến mới `VS-CUSTOMERINPUT-TEN-KHAC` (huy hiệu qua tên `c`, không "CK:")
  bị bắt — bản D1d cũ không bắt. `ke_hoach.md` dòng D1 sửa cho khớp Q2.
- Lỗi 2: dòng "Kết quả" vòng sửa 2 ghi `npm test`; vòng sửa 4 ghi đủ dưới đây + cổng `chay` ở cuối file.
- Lỗi 3: `ke_hoach.md` ghi F2 = B8.
- Nghi ngờ (destructuring, payOS, Turso, pin_code) và gợi ý đơn giản orders.js:542-543: không làm — ngoài các lỗi vòng 3 nêu.
- Kết quả: `thu_KHACHCK1.js` 37 đạt (gốc 10 · 27 hỏng); đột biến 38 · BẮT 38 · SỐNG 0 · HỎNG 0 · LẠC 0 (đối chứng 7 bài xanh);
  `npm test -- --day-du` PASS 86 · FAIL 0 · CẢNH BÁO 1 (cũ: route GET có lệnh ghi ở packages.js / products.js / sync.js), "dist đã commit KHỚP".

SOÁT LẦN CUỐI: chat soát thay

## Câu hỏi
_(Không còn câu mở. Câu 1 dưới đây ĐÃ ĐƯỢC TRẢ LỜI — chủ quán thêm 6 file vào Phạm vi ở `5d8a630`; giữ để tra lại.)_
1. **[ĐÃ TRẢ LỜI] Thêm 6 bài thử cũ vào `## Phạm vi` của phiếu (đúng tên từng file).** Kế hoạch đã duyệt (mục 4) và lời duyệt của bạn yêu cầu sửa các bài
   này theo LUAT §6.8 — mình đã sửa, mỗi bài đỏ ở dạng gốc trên code mới và bản mới đỏ trên code gốc (`bang_chung_do.txt`). Nhưng cổng chỉ đọc
   Phạm vi từ phiếu, mà phiếu chỉ có commit `PHIEU: KHACH-CK-1` của bạn được sửa (A7) → máy không tự thêm được. Dòng cổng
   (`node tu_chay/cong.js tinh . 29db8d3^ HEAD viec/KHACH-CK-1`, HEAD `3775014`):
   ```
   ✗ [A6] file `cong_cu/thu_BH1.js` không có trong Phạm vi của phiếu
   ✗ [A6] file `cong_cu/thu_BH2.js` không có trong Phạm vi của phiếu
   ✗ [A6] file `cong_cu/thu_GOI1.js` không có trong Phạm vi của phiếu
   ✗ [A6] file luật `cong_cu/thu_P20.js` phải ghi ĐÚNG TÊN trong Phạm vi (glob chung không mở được file luật)
   ✗ [A6] file `cong_cu/thu_P26c.js` không có trong Phạm vi của phiếu
   ✗ [A6] file `cong_cu/thu_UUDAI1.js` không có trong Phạm vi của phiếu
   ```
   (cùng lần chạy còn `✗ [A17]` — tên đột biến chưa ghi vào file này, nay đã ghi ở bảng trên — và `✗ [A19]` chưa tới bước 11.4: bình thường.)
   Đề xuất: chat thêm 6 dòng sau vào `## Phạm vi` (commit `PHIEU: KHACH-CK-1 …`), rồi gõ `/lam-viec KHACH-CK-1 tiep`:
   `cong_cu/thu_BH1.js` · `cong_cu/thu_BH2.js` · `cong_cu/thu_GOI1.js` · `cong_cu/thu_P20.js` · `cong_cu/thu_P26c.js` · `cong_cu/thu_UUDAI1.js`.
   Ghi nhận thật: mình sửa các file này bằng lệnh Python (luật F8 với chuỗi tiếng Việt) — người gác không chặn, nhưng chúng ngoài Phạm vi
   phiếu; mình làm vì kế hoạch đã duyệt và lời duyệt nêu thẳng P20 / GOI1. Không muốn thêm thì báo, mình gỡ.

## Phát hiện
- `server/routes/backup.js` khôi phục `pos_customers` đủ cột, không khôi phục `pos_nang_cap` → bản sao lưu trước 004 đem lại mức chiết khấu
  riêng (chủ quán chấp nhận 30.10; tiền vẫn đúng vì máy chủ không áp).
- Đột biến cũ sẽ lạc neo sau việc này: `viec/BH-1/dot_bien.py:42`, `viec/BH-2/dot_bien.py:85-86`, `viec/LUOI-5/dot_bien.py:57-58`.
- **(Sửa câu cũ — câu cũ SAI, người soát vòng 1 bắt.)** Ô "Chiết khấu" giảm tay ở màn Bán hàng cũ (`client/src/pages/Sales.jsx`) không có
  tác dụng ở máy chủ từ POS-CONGDON-v1 (`orders.js:614-617` không mã → không mức nào). Câu cũ "tổng hiện theo tinh-thu nên chỉ lộ khi tinh-thu
  lỗi" là SAI: `Sales.jsx:166` chỉ gọi tinh-thu khi CÓ mã hợp lệ; không mã thì màn tự tính tổng CÓ trừ giảm tay (`Sales.jsx:624-636`) →
  tiền khách đưa lệch tổng máy chủ → máy chủ trả 400 "Số tiền thanh toán … không khớp" (`orders.js:846`). Không mất tiền (đơn bị từ chối),
  nhưng nhân viên gõ ô này là đơn không lưu được. Trước việc này, khách có hồ sơ % riêng được nút "(KH: x%)" điền đúng mức máy chủ áp nên
  không kẹt; nay ô giảm tay là cái bẫy cho MỌI đơn không mã (với khách thường thì vốn đã vậy từ trước). Lời duyệt "giữ nguyên" (30.10) dựa
  trên câu sai này → **báo lại chủ quán**; đề xuất mở việc riêng ẩn / bỏ ô này ở màn cũ (phiếu mục F dặn giữ, mình KHÔNG sửa trong việc này).
- Cửa `PUT /api/pos/customers/:id/discount` quầy không gọi; chỉ `cong_cu/thu_P3.js:448` khoá quyền. Dọn sau khai trương.
- `thu_KHO2a.js` E6b chạy MỌI bước nâng cấp trên kho trống không có `pos_customers` — bước đổi dữ liệu phải tự kiểm cột có chưa (004 đã làm,
  ca C6). Bước sau chạm bảng cũ nhớ cùng điều này.

## Báo cáo 7 mục
```
VIỆC:        KHACH-CK-1 — Bỏ chiết khấu riêng từng khách (ưu đãi chỉ còn hạng, mã giảm, Giờ vàng)
ĐÃ SỬA:      server/routes/orders.js LO 2 (~:610-618) — máy chủ thôi đọc mức giảm trong hồ sơ khách; vòng 1 bỏ hai nhánh tính theo mức đã chết
             (~:718 chỉ còn `if (discountCodeId) finalDiscountAmount = uuDai.giam_ma;`), sửa chú thích F2.
             server/routes/customers-v2.js PUT /:phone/discount (:351) và customers.js PUT /:id/discount (:509) — mức > 0 → 400
             CHIET_KHAU_RIENG_DA_BO; mọi câu ghi cứng 'percent', 0 (UPDATE lẫn INSERT); ghi chú khách vẫn ghi.
             server/nang_cap/004_bo_chiet_khau_rieng.js + chay.js — có cột + có dòng ≠ 0 thì sao lưu cả bảng rồi đặt về 0, log số khách.
             client/src: tinh.js bỏ khachGiam / coChietKhauRieng; BanHangMoi.jsx bỏ khoá chanChietKhau; Sales.jsx bỏ applyCustomerDiscount
             + chữ "KH: x%"; CustomerInput.jsx bỏ huy hiệu; Customers.jsx bỏ lọc / cột / form mức, nhãn "Ghi chú khách". Đã build client/dist.
             Bài cũ sửa theo LUAT §6.8: thu_P20, thu_GOI1, thu_UUDAI1, thu_P26c, thu_BH1, thu_BH2; kiem_tra_truoc_khi_giao.js thêm bài mới.
BÀI THỬ:     cong_cu/thu_KHACHCK1.js chạy trên gốc 29db8d3 → ĐỎ 27 ca (A1 "100.000 ≠ 90.000", B1 PUT 5 % → 200, C0 thiếu 004, D1c/D1d
             còn đọc mức, …) · 10 đạt; sau vá → XANH 37/37. Bản gốc 6 bài cũ trên code mới → đỏ (bang_chung_do.txt mục 2).
             Đột biến 38 · BẮT 38 · SỐNG 0. npm test -- --day-du PASS 86 · FAIL 0 · CẢNH BÁO 1 (cũ).
ĐÃ RÀ K4:    grep "INSERT INTO pos_customers|UPDATE pos_customers" server/ → 18 chỗ, chỉ hai cửa /discount ghi mức — đã vá cả hai (cả nhánh
             UPDATE lẫn INSERT của v2); grep chỗ áp mức → một khối LO 2 trong taoDon (tạo đơn, tinh-thu, payOS cùng đi qua);
             grep client/src "khachGiam|giamKhach|coChietKhauRieng|chanChietKhau|has_discount|\.discount_(value|type)" → còn lại chỉ là mã
             giảm, đơn đã tạo (hoá đơn), hai dòng chép phản hồi CustomerInput.jsx:83-84 (giữ theo Q2) — D1c / D1d khoá.
CHƯA KIỂM:   A4 phiên payOS (kho thử không tạo được phiên; dựa A3 tinh-thu cùng hàm taoDon) · bước 004 trên Turso thật · thử tay giao diện
             trên điện thoại · D1c không bắt kiểu destructuring / customer['discount_value'] · phiên payOS lập TRƯỚC lúc deploy cho khách có mức
             riêng · kiem_neo.py cho đột biến cũ lạc neo (BH-1, BH-2, LUOI-5) · ô giảm tay màn cũ làm đơn không mã bị 400 (có từ trước, xem
             Phát hiện — chủ quán cần quyết lại).
GIT:         xem dòng HEAD ĐÃ KIỂM ở cuối file; nhánh viec/KHACH-CK-1 đã push.
BÀI HỌC:     KHOÁ 1 · NGUYÊN TẮC 2 · BỎ 3 — chi tiết ở ## Bài học
```

## Kiểm từng mục nghiệm thu
- A Máy chủ không áp — thu_KHACHCK1 A1, A2, A3, A5, A6, A7, A8, F3b, F3c; UUDAI1 G5b; GOI1 B3c2; P20 "hồ sơ cũ fixed 5.000"; A4 payOS CHƯA KIỂM.
- B Không đặt được — B1–B8, B7c; P26c X1a/X1b; thu_P3 (mức 0 vẫn 200).
- C Dữ liệu cũ — C0–C6 (N khách → 0, bảng sao lưu đủ dòng, lần 2 không đổi, log số khách, kho trống).
- D Màn hình — D1a–D1e, D2; BH1 D13/D14/I8; BH2 D18/S19; dist khớp (`--day-du`).
- E Ghi chú khách giữ — E1a–E1c, E2, B5, B6.
- F K5 — F3a–F3c; `npm test -- --day-du` PASS 86 · FAIL 0 (quầy, hoàn, ví, điểm, hạng, mã, hoá đơn, App KH).

## Bài học
1. **NGUYÊN TẮC (K1)** — Đã gây: hồ sơ viết "tổng hiện theo tinh-thu nên chỉ lộ khi tinh-thu lỗi" (trích chỗ DÙNG `Sales.jsx:651,653`) mà
   bỏ qua ĐIỀU KIỆN gọi tinh-thu (`Sales.jsx:166` chỉ khi có mã); chủ quán duyệt "giữ ô giảm tay" dựa trên câu sai. Dấu hiệu: "X hiện theo Y
   nên …". Chặn: trích cả lệnh `if` / `useEffect` gác Y. Ngoài Phạm vi (`KHUON_LOI.md`) → đề xuất thêm một gạch vào K1.
2. **NGUYÊN TẮC (K4)** — Đã gây: bỏ nguồn giá trị (LO 2) mà để nguyên hai nhánh tiêu thụ phía dưới (`orders.js` else-if percent / fixed) →
   code chết + chú thích sai; xoá nhánh chết lại làm một đột biến cũ SỐNG (VS-LO2-TIN-TO-KHAI) → phải thêm ca F3c. Chặn: bỏ một nguồn thì
   grep mọi nhánh tiêu thụ biến đó, xoá cùng commit, chạy lại trọn bộ đột biến. Đề xuất thêm vào K4 (ngoài Phạm vi).
3. **KHOÁ (đã làm trong Phạm vi)** — ca "vắng mặt X" đọc mã gắn tên đối tượng (D1c, D1d) trong khi tên ca hứa "mọi tên biến": đã đổi sang
   gom mọi `<x>.discount_*` so BẰNG danh sách được phép + đột biến tên khác (VS-SALES-TEN-KHAC, VS-CUSTOMERINPUT-TEN-KHAC), đỏ trên gốc.
   Đề xuất ngoài Phạm vi: cổng `tu_chay/cong.js` đối chiếu dòng "TỔNG n đột biến" mới nhất của `bang_chung_do.txt` với số mục `DOT_BIEN`
   (vòng 2 + 3 bắt số cũ 34 trong hồ sơ — K4 đã có lời dặn, nên thành phép máy).
4. **BỎ** — người gác chặn 11 lệnh (B-PHANTICH 4, B-CHUONGTRINH 4: `for` / `until`, B-DICHCHU 1: đích biến shell, B-BIMAT-CHU 1: chạy bài
   có cụm bí mật trước commit, SED-I 1): đều là luật đã ghi trong skill, mình quên; làm lại đúng dạng ngay. Không cần luật mới.
5. **BỎ** — hồ sơ cũ (Tiến độ "DỪNG", câu hỏi đã trả lời, tên đột biến dự kiến) sau khi chủ quán sửa phiếu: K4 đã có "grep hồ sơ tìm mọi câu
   trích con số cũ"; trùng bài 3 phần đề xuất cổng.
6. **BỎ** — 3 vòng soát + vòng sửa 4: mọi lỗi nhẹ, không đụng tiền; đúng nhịp LUAT §6.5.

## Cổng (bước 11.4)
- `node tu_chay/cong.js chay . 29db8d3^ HEAD viec/KHACH-CK-1` lần 1 (HEAD `15cd62e`): `✗ [A16] … "SỐ CA cong_cu/thu_BH2.js: 99" ≠ 100 ca ở head`
  — ca G1 của thu_BH2 chỉ chạy khi có `.git` (`thu_BH2.js:244`), số 99 lấy từ bản sao đột biến; sửa thành 100 (`dc4b384`).
- Lần 2 (HEAD `dc4b384`): `✓ CỔNG CHẠY ĐẠT` (kèm `· CẢNH BÁO A16: thu_BH2.js chạy trên gốc in 99 ca ≠ 100` — cùng nguyên nhân G1 / `.git`).
- `git log --oneline -2` lúc kiểm: `dc4b384 KHACH-CK-1: bang chung do — SO CA thu_BH2 = 100 (ca G1 can .git; cong A16)` ·
  `15cd62e KHACH-CK-1: trang thai — soat vong 3, vong sua 4 (chat soat thay), bao cao 7 muc, bai hoc`

HEAD ĐÃ KIỂM: dc4b384
