# KHACH-CK-1 — Kế hoạch (chờ chủ quán duyệt)

Nền: `29db8d3 PHIEU: KHACH-CK-1` (trên `c8edb66`). Mọi số dòng dưới đây đọc trong phiên này ở `29db8d3`.

## 0. Lời thường cho chủ quán

Hiện nay máy chủ tự giảm giá cho khách nào có "chiết khấu riêng" trong hồ sơ. Việc này tắt hẳn chỗ đó: máy chủ thôi áp, không ai đặt
mức mới được (> 0 bị từ chối), dữ liệu cũ đặt về 0 sau khi chép sao lưu, màn hình bỏ mọi chỗ hiện / nhập mức giảm riêng.
**Ghi chú khách** (cột `discount_note`, đang in trên hoá đơn) giữ nguyên, chỉ đổi nhãn ở màn Khách hàng thành "Ghi chú khách".
Bạn cần: đọc mục 5 (hai chỗ mình đề xuất, bạn chỉ cần xác nhận) rồi bấm duyệt.

## 1. Hiện trạng (code thật, `29db8d3`)

| Chỗ | File:dòng | Đang làm gì |
|---|---|---|
| Máy chủ áp | `server/routes/orders.js:611-634` (LO 2) | không có mã giảm hợp lệ → đọc `discount_type/discount_value` của `pos_customers` theo SĐT, áp cho cả đơn. Khối này nằm trong `taoDon` — CÙNG một chỗ cho POST `/orders`, POST `/orders/tinh-thu` (`:1286`) và phiên payOS (`chiTinh`, `:171-172`). Không còn đường áp thứ hai: `grep -rn "khCK\|pos_customers.*discount" server` chỉ ra khối này. |
| Cửa ghi 1 | `server/routes/customers.js:508-559` `PUT /:id/discount` (`manage_settings`) | ghi type/value/note. Quầy KHÔNG gọi (`grep updateDiscount\|/discount client/src` → chỉ v2). `thu_P3.js:448` gọi với `discount_value: 0` để khoá quyền. |
| Cửa ghi 2 | `server/routes/customers-v2.js:342-391` `PUT /:phone/discount` (`manage_users`) | ghi type/value/note, chưa có hồ sơ thì INSERT. Là đường DUY NHẤT màn Khách hàng sửa **ghi chú khách** (`Customers.jsx:247`, `api.js:305`). |
| Các đường ghi khác | `customers.js` POST `/` `:314`, PUT `/:id` `:445`, POST `/:id/children`; `customers-v2.js:58,320-327`; `sync.js:262-305`; `maKhach.js:134` | KHÔNG ghi `discount_value` (đã đọc danh sách cột). Không cần sửa. |
| Đọc / trả ra | `customers.js:164-166`; `customers-v2.js:96,149-151,179-182,260-262,283-286,416,444-446,478,499-501` | trả `discount_*` cho màn hình. Sau nâng cấp mọi giá trị = 0. |
| Màn cũ | `Sales.jsx:328-335` applyCustomerDiscount; `:378-384` điền mức khách khi chọn khách; `:1449-1461` chữ "(KH: x%)" | ~~Tổng hiển thị lấy từ tinh-thu nên mức giả chỉ lộ khi tinh-thu lỗi~~ — SAI (người soát vòng 1 bắt): `Sales.jsx:166` chỉ gọi tinh-thu khi CÓ mã hợp lệ; không mã thì tổng tự tính có trừ giảm tay (`:624-636`), máy chủ bỏ qua → 400 "không khớp" (`orders.js:846`). |
| Màn mới | `BanHang/tinh.js:77-96` `khachGiam` trong `tinhGio`; `:128,143-145` `dungDonHang` gửi mức khách; `:192-193` `coChietKhauRieng`; `BanHangMoi.jsx:17,125,342,348` khoá `chanChietKhau` | |
| Màn Khách hàng | `Customers.jsx:60-62,96,156-158,248-250,305,370,399,441,499-512,824-866,870-880,921` | bộ lọc "Có CK", cột CK, khung "Chiết khấu mặc định", nhãn "Lý do chiết khấu", chú "Chiết khấu tự động áp dụng khi bán hàng", ghi chú chỉ hiện khi CK > 0 (`:441`). |
| Ô chọn khách | `CustomerInput.jsx:83-84,119-120,279-284` | huy hiệu "🏷️ CK: x". |
| Ghi chú khách | `Sales.jsx:790`, `Orders.jsx:418`, `BanHangMoi.jsx:180` | `customer_note: discount_note` → in hoá đơn. GIỮ. |
| Nâng cấp | `server/nang_cap/chay.js` (mỗi bước một giao dịch, khoá `pos_nang_cap.so` → chạy đúng một lần), bước 001, 002 | việc này dùng **004** (003 của KH-API-3). |

## 2. Phương án từng phần

### P1 — Máy chủ thôi áp (nghiệm thu A)
- **A (chọn):** thay thân `if (!discountCodeId) {…}` của LO 2 bằng `finalDiscountType = null; finalDiscountValue = 0;` (giữ đúng hành vi "không
  tin tờ khai" của POS-CONGDON-v1), sửa chú thích cho đúng. ~−18/+5 dòng, 1 file. Rủi ro: thấp — một khối, cả ba đường (tạo đơn, tinh-thu, payOS)
  cùng đi qua.
- B: xoá luôn biến `discount_type/discount_value` lấy từ body (`:194-195`, `:542-543`). Nhiều dòng hơn, đụng chỗ ghi `pos_orders.discount_type/value`
  (`:943`, `:1222`) và F2 flash (`:686`) — dễ phá. Loại.

### P2 — Không đặt được (nghiệm thu B)
- **A (chọn):** giữ hai cửa (cửa v2 là chỗ duy nhất sửa ghi chú khách — bỏ là mất nghiệm thu E), thêm chặn ở đầu mỗi cửa:
  `Number(discount_value) > 0` (cả chuỗi "5", cả `parseFloat`) → `400 { error: 'Đã bỏ chiết khấu riêng từng khách — dùng hạng thành viên hoặc mã giảm', code: 'CHIET_KHAU_RIENG_DA_BO' }`.
  Câu ghi luôn đặt `discount_type = 'percent'` (mặc định cột, `database.js:690`), `discount_value = 0`, chỉ `discount_note` theo thân. Bỏ các phép
  kiểm loại / trần % cũ (không còn ý nghĩa). Cùng một biểu thức chặn ở cả hai cửa (K4). ~+8/−14 dòng, 2 file.
  Giá trị âm / chữ / thiếu → coi như 0, không chặn (K5: màn Khách hàng sau sửa gửi 0 hoặc không gửi; thu_P3 gửi 0).
- B: bỏ hẳn cửa `customers.js PUT /:id/discount` (quầy không gọi). Phải sửa `thu_P3.js:448` (danh sách khoá quyền) — đụng bài ngoài Phạm vi chỉ để
  bỏ một cửa đã vô hại. Loại; ghi Phát hiện để dọn sau khai trương.

### P3 — Dữ liệu cũ: bước `004_bo_chiet_khau_rieng.js` (nghiệm thu C)
- **A (chọn):** trong giao dịch của bộ chạy:
  1. `n = COUNT(*) FROM pos_customers WHERE COALESCE(discount_value, 0) <> 0` (bắt cả mức âm từng lọt qua cửa cũ).
  2. `n > 0` → `CREATE TABLE IF NOT EXISTS _sao_luu_004_pos_customers AS SELECT * FROM pos_customers` (cùng cách đặt tên / cùng câu với `themCot`,
     `chay.js:21`), rồi `UPDATE pos_customers SET discount_value = 0, discount_type = 'percent' WHERE COALESCE(discount_value, 0) <> 0`
     — kiểm `changes === n` (lệch → ném lỗi, giao dịch rollback).
  3. `console.log('🔧 004: đặt lại chiết khấu riêng của n khách (sao lưu _sao_luu_004_pos_customers)')`.
  Không ALTER / DROP / DELETE (thu_KHO1 `:281` cấm). Chạy lại: bộ chạy bỏ qua (khoá `pos_nang_cap`); gọi tay thân bước lần 2 thì n = 0 → không tạo
  bảng, không UPDATE → không đổi gì. ~25 dòng, 1 file mới.
  Đặt luôn `discount_type` cho khách có `discount_value = 0` nhưng type `'fixed'`? Không — chỉ đụng dòng có mức ≠ 0 (ít dòng đổi nhất; type không có
  value thì vô hại).
- B: sao lưu chỉ các dòng bị đổi (`… AS SELECT * … WHERE discount_value <> 0`). Ít dữ liệu hơn nhưng lệch khuôn `themCot` (sao lưu cả bảng); nghiệm
  thu C chỉ đòi "đủ N dòng cũ" — A cũng đạt. Chọn A để một khuôn sao lưu.

### P4 — Màn hình (nghiệm thu D, E)
- `Sales.jsx`: xoá `applyCustomerDiscount` (`:327-335`); `handleSelectCustomer` bỏ nhánh điền mức khách, luôn đặt `percent / 0` (`:374-384`, giữ chú
  thích POS-DOIKHACH-v1 cho đúng); xoá khối "(KH: …)" (`:1449-1461`). Ô "Chiết khấu" giảm tay theo đơn GIỮ NGUYÊN (F). ~−25 dòng.
- `BanHang/tinh.js`: `tinhGio` bỏ hẳn `khachGiam` / `giamKhach` (`grep giamKhach client/src` chỉ ra tinh.js);
  `dungDonHang` gửi `discount_type: null, discount_value: 0`, `discount_reason: null`; xoá `coChietKhauRieng`. ~−12 dòng.
- `BanHangMoi.jsx`: bỏ import + `chanChietKhau` (`:17,125,342,348` → `coSo={coSo}`). ~−3 dòng.
- `CustomerInput.jsx`: bỏ huy hiệu (`:279-284`); bỏ `discount_type/value` khỏi đối tượng khách dựng ở `:83-84,119-120` (không còn ai đọc). ~−10 dòng.
- `Customers.jsx`: bỏ bộ lọc "Có CK", cột "CK" + `formatDiscount`, khung "Chiết khấu mặc định", chú ":921", `discount_type/value` trong `detailForm`;
  `handleSaveDetail` chỉ gửi `{ discount_note }`; nhãn "💬 Lý do chiết khấu" → "💬 Ghi chú khách (in trên hoá đơn)", placeholder đổi theo; dòng `:441`
  bỏ điều kiện `c.discount_value > 0` (ghi chú hiện khi có). ~−60 dòng.
- `(cd client && npm run build)` → `client/dist/`.

### P5 — Bài thử
- `cong_cu/thu_KHACHCK1.js` mới (~220 dòng) theo khuôn `thu_UUDAI1.js` (máy chủ thật trên kho thử tạm) + đăng ký một dòng `chayBaiThat` trong
  `kiem_tra_truoc_khi_giao.js` (cạnh `:496`).
- Bài cũ đổi vì hành vi đã duyệt đổi (LUAT §6.8 — bài SỬA bình thường, đỏ trên gốc, `SỐ CA`): xem mục 4.

## 3. Ca thử ↔ nghiệm thu (1-1)

| NT | Ca | Đỏ trên gốc vì |
|---|---|---|
| A | A1 khách hồ sơ `percent 10`, không mã, 2 món 50.000 → tổng 100.000 (không 90.000) | LO 2 áp 10 % |
| A | A2 cùng khách, hồ sơ `fixed 5000` → tổng không bớt 5.000 | LO 2 áp tiền |
| A | A3 tinh-thu cùng giỏ A1 → `total` 100.000 = POST `/orders` | tinh-thu đi qua LO 2 |
| A | A4 phiên payOS (đường `chiTinh` nếu tạo phiên được trong kho thử — không được thì CHƯA KIỂM, dựa A3 cùng hàm) | |
| A | A5 đối chứng hạng: khách Vàng + hồ sơ 10 % → tổng = chỉ giảm hạng (số cố định tính tay) | gốc cộng thêm 10 % |
| A | A6 đối chứng mã: khách hồ sơ 10 % + mã fixed 5.000 → 95.000 (như cũ — mã thắng) | xanh trên gốc (đối chứng K5) |
| A | A7 đối chứng Flash: khách hồ sơ 10 % trong giờ Flash → tổng = giá Flash, KHÔNG 400 "chỉ dùng voucher TIỀN" | gốc trả 400 (F2 thấy % từ hồ sơ) |
| B | B1 PUT v2 `percent 5` → 400 `CHIET_KHAU_RIENG_DA_BO`, hồ sơ không đổi | gốc 200 |
| B | B2 PUT v2 `fixed "5000"` (chuỗi) → 400 | gốc 200 |
| B | B3 PUT customers.js `/:id/discount` `percent 5` (tài khoản chủ) → 400 cùng `code` | gốc 200 |
| B | B4 PUT v2 khách chưa có hồ sơ, value 5 → 400 và KHÔNG INSERT dòng | gốc INSERT |
| B | B5 (K5) PUT v2 `{ discount_note: 'Ít ngọt' }` → 200, note lưu, value vẫn 0; khách chưa có hồ sơ → INSERT với value 0 | xanh (đối chứng) |
| B | B6 (K5) PUT customers.js value 0 → 200 (luồng thu_P3) | xanh |
| C | C1 kho có N=3 khách ≠ 0 (percent 10, fixed 5000, percent 0.5) + 2 khách 0 → chạy `chay` của 004 trên giao dịch thật → 0 khách ≠ 0; `_sao_luu_004_pos_customers` có đủ 5 dòng, 3 dòng giữ đúng mức cũ | gốc chưa có 004 |
| C | C2 gọi thân 004 lần 2 → cấu trúc CSDL (PRAGMA / sqlite_master) y hệt, không đổi dòng | |
| C | C3 kho không có khách nào ≠ 0 → không tạo bảng sao lưu | |
| C | C4 log có "3 khách" (bắt `console.log`) | |
| D | D1 đọc mã thật `client/src/pages/BanHang/tinh.js`: không còn `khachGiam`, `coChietKhauRieng`; `BanHangMoi.jsx` không còn `chanChietKhau`; `Sales.jsx` không còn `applyCustomerDiscount` / `customer.discount_value`; `CustomerInput.jsx` không còn huy hiệu ("CK:" hay bất kỳ chỗ đọc mức nào ngoài hai dòng chép phản hồi `data.discount_*` giữ theo §9 Q2 — sửa ở vòng soát 3); `Customers.jsx` không còn `has_discount` / `discount_value` (kiểm MẪU NGUY HIỂM vắng mặt — E11) | gốc có |
| D | D2 `tinhGio` gọi với `khachGiam` cũ → tổng không giảm; `dungDonHang` khách có `discount_value 10` → gửi `discount_value 0` | gốc giảm / gửi 10 |
| E | E1 khách có `discount_note = 'Ít đá'` → `Sales.jsx`, `Orders.jsx`, `BanHangMoi.jsx` vẫn có `customer_note: …discount_note` (đọc mã); `Customers.jsx` có nhãn "Ghi chú khách" và vẫn gửi `discount_note` | gốc nhãn "Lý do chiết khấu" → đỏ |
| E | E2 GET `/v2/customers/:sdt` trả `discount_note` sau PUT note (B5) | xanh |
| F | F1 chạy cả `npm test` (mọi bài thật: GOI1, P20, P26c, UUDAI1, BH1, BH2, KHAPI2, HOPDONG_KH, gia_lap…) xanh — quầy bán, hoàn, ví, điểm, hạng, mã, hoá đơn, App KH | |
| F | F2 (trong bài tên **B8**) ca hai người cùng bấm (đụng tiền): hai PUT v2 song song cùng khách, một value 5 một chỉ note → cái value 5 bị 400, cái note 200, hồ sơ cuối value 0 | gốc có thể còn 5 |

Đột biến (`dot_bien.py`, mỗi cái một dòng tên nguyên chuỗi):
- `BV-LO2` khôi phục khối LO 2 gốc → A1/A2/A3/A5/A7 bắt.
- `VS-LO2-CHI-PERCENT` chỉ bỏ nhánh percent (fixed vẫn áp) → A2 bắt.
- `BV-CHAN-V2` gỡ chặn cửa v2 → B1/B2/B4 bắt. `VS-CHAN-V2-PARSE` chặn bằng `discount_value > 0` không ép số (chuỗi lọt) → B2 bắt.
- `BV-CHAN-V1` gỡ chặn cửa customers.js → B3 bắt. `VS-CHAN-V1-GHI-THAN` chặn đúng nhưng câu UPDATE vẫn ghi `discount_value` từ thân (âm "-5" lọt vào hồ sơ) → ca thêm B7 (PUT value −5 → hồ sơ 0) bắt.
- `VS-004-KHONG-SAO-LUU` bỏ câu sao lưu → C1 bắt. `VS-004-SAO-LUU-SAU` sao lưu SAU UPDATE → C1 (mức cũ trong bảng sao lưu) bắt. `VS-004-CHI-PERCENT` UPDATE thêm `AND discount_type = 'percent'` → C1 bắt.
- `BV-TINH-KHACHGIAM` khôi phục `khachGiam` → D1/D2 bắt. `VS-NHAN-GHI-CHU` giữ nhãn cũ → E1 bắt.
- **Tên khi dựng (vòng soát 2 bắt lệch tên):** danh sách trên là dự kiến; tên THẬT nằm ở `dot_bien.py` và bảng của `trang_thai.md`:
  `VS-CHAN-V2-PARSE` → `VS-CHAN-V2-CHI-PERCENT` (B2, chuỗi "5000" vẫn chặn) · `VS-CHAN-V1-GHI-THAN` → `VS-V1-GHI-LOAI-THAN` (B7) ·
  `VS-004-KHONG-SAO-LUU` → `BV-004-SAO-LUU` · `VS-004-SAO-LUU-SAU` → `VS-004-SAO-LUU-SAU-UPDATE`; `VS-LO2-CHI-PERCENT` dựng ở vòng sửa 2.

## 4. Bài thử cũ phải sửa (LUAT §6.8 — hành vi chủ quán đã duyệt đổi 29.10)

Ngoài Phạm vi phiếu nhưng phiếu (Ngân sách) và LUAT §6 mục 7–8 cho phép; mỗi bài ghi `SỐ CA`.

| Bài | Ca | Sửa |
|---|---|---|
| `thu_UUDAI1.js:386-387` G5b | Vàng + giảm riêng 5 % → 85.000 | đổi kỳ vọng: hồ sơ 5 % KHÔNG áp → 90.000 (đỏ trên gốc) |
| `thu_P26c.js:792-806` X1a/X1b | PUT chiết khấu → máy chủ áp | đổi thành: PUT > 0 → 400 `CHIET_KHAU_RIENG_DA_BO`, đơn giá đủ (đỏ trên gốc) |
| `thu_P20.js:302-307` | "có chiết khấu" dựng bằng hồ sơ `fixed 5000` | đổi sang mã giảm fixed 5.000 (giữ mục đích "đơn có giảm vẫn qua", cash 20.000) |
| `thu_GOI1.js:640-646` B3c | giảm 10 % qua hồ sơ → trả 1.215.000 | đổi sang mã giảm 10 % (đã thấy ở `thu_UUDAI1` G3d: mã áp cả dòng gói); số kỳ vọng tính lại, ghi rõ nếu khác |
| `thu_GOI1.js:745-747` B3p | dữ liệu cũ trước P26c, giảm 10 % qua hồ sơ | như B3c — mã giảm 10 % |
| `thu_BH1.js:125-126,182-185` D13/D14/I8 | `khachGiam` 10 % / cố định | đổi: `khachGiam` truyền vào bị bỏ qua (tổng không giảm); I8 → khách có mức 10 % vẫn gửi `discount_value 0` |
| `thu_BH2.js:169-171,233` | `coChietKhauRieng` + S19 khoá `chanChietKhau` | đổi: `coChietKhauRieng` KHÔNG còn xuất; S19 → `ThuTien` nhận `coSo={coSo}` |

B3c / B3p / P20 dùng mã thay hồ sơ thì không còn đỏ trên gốc (chỉ đổi cách dựng dữ liệu) — đó là "bài cũ đổi mà vẫn xanh trên gốc" → cần mục
`## Bài thử cũ sửa` trong phiếu (cổng A11). **Gom vào câu hỏi mục 5.**

## 5. Cần chủ quán xác nhận (đề xuất sẵn — bạn chỉ cần "đồng ý")

1. **Giữ hai cửa ghi, chỉ chặn mức > 0** (không bỏ cửa) vì cửa v2 là chỗ duy nhất sửa "Ghi chú khách". Đề xuất: đồng ý.
2. **Thêm mục `## Bài thử cũ sửa` vào phiếu** cho `thu_P20.js` (ca "có chiết khấu"), `thu_GOI1.js` (B3c, B3p): ba ca này dựng "đơn có giảm" bằng chiết
   khấu hồ sơ — sau việc này phải dựng bằng mã giảm; đổi cách dựng nên vẫn xanh trên code gốc → cổng A11 đòi mục đó. Đề xuất: đồng ý, chat thêm mục
   vào phiếu khi duyệt.
3. (Không cần quyết, chỉ báo) Ô "Chiết khấu" giảm tay ở màn cũ (`Sales.jsx:1464-1490`) — máy chủ đã bỏ qua số này từ POS-CONGDON-v1, màn hiện tổng
   theo tinh-thu. Phiếu dặn giữ nguyên (F) — mình giữ, ghi Phát hiện. **Sửa (vòng soát 1):** câu "màn hiện tổng theo tinh-thu" SAI — xem
   `## Phát hiện` của `trang_thai.md`.

## 6. Đường song song đã canh (K4)
- Áp: chỉ một khối (LO 2) cho tạo đơn / tinh-thu / payOS — ca A1, A3. `giuCho.js`, `thanh-toan.js` (Cấm) chỉ chuyển thân, không áp (`giuCho.js:19` danh sách trường không có `discount_value`).
- Ghi: hai cửa PUT — cùng biểu thức chặn; mọi INSERT/UPDATE `pos_customers` khác đã đọc, không ghi mức.
- Hiện: `Sales.jsx` ba chỗ, `CustomerInput.jsx`, `Customers.jsx` (lọc, cột, form, chú), `BanHang` (`tinhGio`, `dungDonHang`, `coChietKhauRieng`, `chanChietKhau`).
- `server/routes/kh/**`: `grep discount server/routes/kh` → không dính (App KH không thấy mức riêng) — không sửa.

## 7. Luồng hợp lệ phải KHÔNG bị chặn (K5)
Đơn không khách · khách không hồ sơ · khách Vàng / Bạch Kim (A5) · mã giảm % / tiền / 1 món (A6, UUDAI1) · Flash (A7) · gói, thẻ, ví, ví mẹ (GOI1,
P20) · hoàn / huỷ · điểm · sửa ghi chú khách (B5) · PUT value 0 (B6, thu_P3) · hoá đơn in ghi chú khách (E1) · App KH (`thu_KHAPI2`, `thu_HOPDONG_KH`).

## 8. Ngân sách
Máy chủ ~+40/−35 (orders 5, customers 8, v2 8, 004 25) · giao diện ~−110/+10 · thử ~230 mới + ~40 sửa. Trong ngân sách phiếu.

## 9. Soát kế hoạch (agent phụ chỉ đọc) — đã nhận và sửa
- Q1 ngoài Phạm vi: không. Ghi thêm:
  - A7 đổi một hành vi phụ ở Giờ vàng (Flash): khách có hồ sơ 10 % mua trong giờ Flash hiện bị 400 (`orders.js:686`, do LO 2 nạp % ở `:627`).
    Sau việc này đơn đi qua với giá Flash. Hệ quả của bỏ LO 2, không đổi luật Flash — báo chủ quán.
  - Đột biến cũ của việc khác sẽ lạc neo: `viec/BH-1/dot_bien.py:42`, `viec/BH-2/dot_bien.py:85-86`, `viec/LUOI-5/dot_bien.py:57-58`. Ngoài
    Phạm vi, không sửa — ghi Phát hiện (chạy `python3 viec/HOC-2b/kiem_neo.py` ở bước 6 để thấy chính xác).
- Q2 ngắn hơn — nhận cả hai:
  - 004 bỏ đếm `n` + `changes === n`: có dòng ≠ 0 thì sao lưu, UPDATE, log số `changes` (C4 đọc log).
  - Không sửa `CustomerInput.jsx:83-84,119-120` (D chỉ đòi bỏ huy hiệu `:279-284`).
- Q3 ca thiếu — thêm vào bảng mục 3:
  - F3 giảm tay theo đơn ở màn cũ không đổi: đọc mã `Sales.jsx` — ô nhập `setDiscountValue(Math.max(0, parseInt(` và
    `discount_value: discountCodeValid?.valid ? … : discountValue` còn y nguyên. Máy chủ: POST `/orders` gửi `discount_type 'percent', discount_value 10`
    không mã → tổng đủ (như gốc — đối chứng).
  - B7 (đã có trong đột biến) đưa vào bảng: PUT customers.js value `-5` → hồ sơ vẫn 0.
  - D1 dò `discount_value` trên MỌI tên biến trong `Sales.jsx` ngoài các dòng gửi thân đơn / in hoá đơn (dò `\.discount_value\s*>\s*0` không phân biệt
    tên đối tượng) — để khôi phục nhánh `selectedCustomer.discount_value` ở `:378` cũng bị bắt; đột biến `BV-SALES-CHON-KHACH` khôi phục nhánh đó.
- Q4 đường song song sót — **khôi phục sao lưu**: `backup.js:42` có `pos_customers`, khôi phục ghi lại mọi cột; `backup.js:103` không bao giờ khôi
  phục `pos_nang_cap` → 004 không chạy lại. Khôi phục bản sao lưu trước 004 sẽ đem mức > 0 trở lại hồ sơ. Tiền vẫn đúng (máy chủ thôi áp, màn không
  hiện), nhưng trái C "dữ liệu cũ về 0". `backup.js` ngoài Phạm vi → ghi Phát hiện + câu hỏi 4 (mục 5).
- `chay.js:7` ghi "Bước chỉ THÊM (bảng / cột / chỉ mục)" — 004 là bước đầu đổi DỮ LIỆU. Sửa chú thích cùng commit (K1: chú thích là khẳng định):
  "bước đổi dữ liệu phải sao lưu bảng trước (như themCot)".

### Bổ sung mục 5
4. Khôi phục bản sao lưu cũ đem mức chiết khấu riêng trở lại hồ sơ (vô hại về tiền). Đề xuất: chấp nhận, không sửa `backup.js` trong việc này;
   muốn chặn hẳn thì mở việc nhỏ sau (khôi phục xong đặt `discount_value = 0`).
5. Đơn giờ Flash của khách từng có chiết khấu % riêng: trước bị chặn (400), sau đi qua với giá Flash. Đề xuất: đồng ý (đúng luật Flash hiện hành).
