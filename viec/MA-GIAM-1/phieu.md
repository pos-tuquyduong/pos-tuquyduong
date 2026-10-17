# MA-GIAM-1 — Mã giảm / voucher: xoá-vô hiệu an toàn, /validate cùng cổng đơn gốc, hoàn tác theo id, mã có khoảng trắng

<!-- Phiếu do chat soạn 16.10.2026. Nền: main sau sổ việc v35 (cha ddc42d2 = Merge PR #28 AUDIT-4; P20c PR #27 đã gộp). Nguồn ĐỌC
     NGUYÊN VĂN: viec/P20c/trang_thai.md "## Phát hiện" 1, 2, 4, 8, 10, 11; viec/AUDIT-4/bao_cao.md AU4-1, AU4-14, AU4-15. Code đã đọc:
     discount-codes.js:307–339 DELETE /:id kiểm used_count NGOÀI giao dịch rồi DELETE không điều kiện; :63 /validate không qua cổng P20b;
     :341 /:id/increment-usage chỉ cần đăng nhập; orders.js:962–979 freshCode null vẫn giảm; orders.js:512–515 cổng P20b tra bằng
     codeRecord.code; signup-codes.js /reset DELETE theo code (:511 vùng), so hoa thường. Song song: LUOI-4 (thu_P26c, thu_GOI1) và
     TU-CHAY-7 — KHÔNG chung file. -->

**Chờ duyệt kế hoạch:** viết `viec/MA-GIAM-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Mã giảm đã dùng không thể bị xoá cứng vì đua; màn Bán hàng báo voucher hỏng ngay lúc kiểm (không đợi tạo đơn); voucher vừa bị xoá không
giảm được đơn; hoàn tác mã gỡ đúng voucher của lần claim; mã bill gõ thừa khoảng trắng vẫn qua đúng cổng.

## Quyết định chủ quán (chép đúng)
- Xoá mã giảm: đã dùng (`used_count > 0`) thì chỉ vô hiệu hoá (như nay) — nhưng quyết định "đã dùng hay chưa" phải chốt trong CÙNG câu ghi.
- Voucher biến mất giữa lúc kiểm và tạo đơn → đơn KHÔNG giảm, trả 400, không tạo đơn.
- `/validate` dùng cùng hàm kiểm đơn gốc với `POST /orders` (một quy tắc, một chỗ).

## Nghiệm thu
- A1 `discount-codes.js` DELETE /:id: trong giao dịch, `DELETE … WHERE id = ? AND COALESCE(used_count, 0) = 0`; `changes = 0` → thay bằng
  `UPDATE … is_active = 0` (vô hiệu hoá), trả lời như nay. Ca đỏ `thu_P26a.js`: mã `used_count = 1` → DELETE → mã còn, `is_active = 0`
  (gốc: phép kiểm ngoài giao dịch — ca đỏ thật dựng bằng gọi thẳng câu DELETE mới với `used_count = 1` → `changes = 0`, hoặc móc tất định
  nếu có; ghi rõ cách chứng minh). K5: mã chưa dùng → xoá hẳn như cũ.
- A2 `discount-codes.js:63` /validate: sau khi tìm mã, nếu là voucher mã bill đã claim (`pos_signup_codes … claimed_at IS NOT NULL`, cùng
  câu với `orders.js:512`) → `kiemDonCuaMa` → 400 `MA_DON_GOC_KHONG_HOP_LE` (cùng mã lỗi). Ca đỏ `thu_P20.js`: voucher của đơn gốc đã huỷ →
  `/validate` 400 (gốc 200 hợp lệ). K5: mã tay / đơn gốc còn paid → như cũ.
- A3 `orders.js:962–979`: `freshCode` null (voucher bị xoá / vô hiệu giữa chừng) → rollback, 400 `MA_GIAM_KHONG_CON`, không đơn. Ca đỏ
  `thu_P26a.js` hoặc `thu_P20.js`: xoá voucher giữa kiểm và giao dịch bằng móc tất định của `thu_P20.js` (nếu có) hoặc gọi thẳng; gốc: đơn
  200 có giảm.
- A4 `orders.js:512–515` tra mã bill bằng `codeRecord.code` — giữ; ca AU4-1 trong `thu_P20.js` [G]: voucher đơn gốc đã huỷ, gửi
  `'  ' + ma + '  '` → 400 `MA_DON_GOC_KHONG_HOP_LE`, không đơn mới (đột biến tra bằng mã thô phải BẮT).
- A5 `signup-codes.js` /reset: DELETE voucher theo `voucherRow.id` (không theo `code`), `voucherRow` null → bỏ qua bước xoá nhưng vẫn gỡ claim
  (hai nhánh — Phát hiện 11 P20c); so mã không phân biệt hoa thường (Phát hiện 8); lời báo thành công không in "SĐT null" (Phát hiện 10).
  Ca: `thu_P20.js` [H] thêm ca id-không-code; K5 ca cũ H3* xanh y nguyên.
- A6 `discount-codes.js:341` /:id/increment-usage: tìm ai gọi (`grep client/src server/`); không ai gọi → bỏ route (ghi); có → thêm
  `checkPermission('manage_promotions')` hoặc để `POST /orders` tự tăng (ghi rõ chọn gì). AU4-15 (cổng P20b ngoài giao dịch): chỉ ghi CHƯA KIỂM.
- A7 `npm test`, `--day-du` xanh; `viec/MA-GIAM-1/dot_bien.py` ≥ 1 VS- + BV- mỗi chỗ vá, có đối chứng; đột biến cũ P20b 4, P20c 21,
  AUDIT-1 D1 / P26a vẫn BẮT (neo rữa → neo lại, ghi trước / sau).

## Phạm vi
- viec/MA-GIAM-1/**
- server/routes/discount-codes.js
- server/routes/signup-codes.js
- server/routes/orders.js
- cong_cu/thu_P26a.js
- cong_cu/thu_P20.js

## Ngân sách
~40–70 dòng code + ~120 dòng thử.
**Phương án đơn giản nhất đã xét:** không thêm cột / bảng / UNIQUE; mọi chốt bằng điều kiện trong câu ghi + `changes` (khuôn P20c);
`/validate` gọi lại hàm có sẵn; không đổi màn hình.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `cong_cu/thu_P26c.js`, `thu_GOI1.js` (LUOI-4 song song), `kiem_tra_truoc_khi_giao.js`, `cong_cu/thu_gia_lap.js`, `KHUON_LOI.md`,
  `tu_chay/` (TU-CHAY-7 song song), `cong_cu/gia_lap/**`, `server/database.js`, `client/`, `.claude/`, `.github/`, sổ việc.
- Không đổi hành vi cổng P20b / P20c đã có ngoài các mục trên. Không nới hạn, không hạ ngưỡng.
- Chỉ push đúng `git push -u origin viec/MA-GIAM-1`. Không đụng `main`, không merge, không tạo PR.
