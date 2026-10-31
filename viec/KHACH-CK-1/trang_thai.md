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

## Chỗ vá → đột biến (`python3 viec/KHACH-CK-1/dot_bien.py` → vòng 2: 37 đột biến · BẮT 37 · SỐNG 0 · HỎNG 0 · LẠC 0, đối chứng 7 bài xanh)
| Chỗ vá | Đột biến |
|---|---|
| `server/routes/orders.js` LO 2 — máy chủ thôi đọc chiết khấu hồ sơ; vòng 1 bỏ hai nhánh tính theo mức (đã chết) — BV-LO2* đưa lại CẢ hai | BV-LO2, BV-LO2-TINHTHU, BV-LO2-FLASH, BV-LO2-UUDAI1, BV-LO2-GOI1, BV-LO2-P20, VS-LO2-CHI-PERCENT, VS-LO2-TIN-TO-KHAI (bắt ở F3c) |
| `server/routes/customers-v2.js` PUT `/:phone/discount` chặn > 0, ghi 0 (UPDATE và INSERT) | BV-CHAN-V2, BV-CHAN-V2-INSERT, BV-CHAN-V2-P26C, VS-CHAN-V2-CHI-PERCENT, VS-V2-GHI-MUC-THAN, VS-V2-INSERT-GHI-MUC-THAN |
| `server/routes/customers.js` PUT `/:id/discount` chặn > 0, ghi 0 | BV-CHAN-V1, VS-CHAN-V1-CHI-FIXED, VS-V1-GHI-LOAI-THAN |
| `server/nang_cap/004_bo_chiet_khau_rieng.js` | BV-004-SAO-LUU, VS-004-SAO-LUU-SAU-UPDATE, VS-004-CHI-PERCENT, VS-004-CHI-DUONG, VS-004-LUON-SAO-LUU, BV-004-BANG-TRONG, VS-004-KHONG-LOG |
| `client/src/pages/BanHang/tinh.js` (tinhGio, dungDonHang, coChietKhauRieng) | BV-TINH-KHACHGIAM, BV-TINH-KHACHGIAM-BH1, BV-DUNG-DON-GUI-MUC, BV-TINH-COCHIETKHAURIENG |
| `client/src/pages/BanHang/BanHangMoi.jsx` bỏ khoá chanChietKhau | BV-CHAN-BANHANGMOI, BV-CHAN-BANHANGMOI-BH2 |
| `client/src/pages/Sales.jsx` bỏ điền mức khách khi chọn khách / chữ "KH:" | BV-SALES-CHON-KHACH, VS-SALES-TEN-KHAC |
| `client/src/components/CustomerInput.jsx` bỏ huy hiệu | BV-CUSTOMERINPUT-HUY-HIEU |
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
- Kết quả: đột biến 37 · BẮT 37 · SỐNG 0; `thu_KHACHCK1.js` 37 đạt (gốc 10 · 27 hỏng).

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
