# MA-GIAM-1 — kế hoạch (chờ duyệt)

Số dòng dưới đây đọc trong lượt này (HEAD `16d8899`).

## Code thật đã đọc
- `server/routes/discount-codes.js:307–335` DELETE /:id: `queryOne` lấy mã → `existing.used_count > 0` → UPDATE vô hiệu; không thì
  `DELETE … WHERE id = ?` KHÔNG điều kiện (`:328`). Phép kiểm và câu xoá tách rời → đơn tăng `used_count` chen giữa thì mã đã dùng bị xoá cứng.
- `discount-codes.js:63–90` /validate: tìm mã `UPPER(code) = UPPER(?) AND is_active = 1` bằng `code.trim()`, kiểm ngày, lượt — KHÔNG qua cổng P20b.
- `discount-codes.js:341–351` /:id/increment-usage: chỉ `authenticate`.
- `server/routes/orders.js:502–519` cổng P20b: tra `pos_signup_codes … claimed_at IS NOT NULL` bằng `[codeRecord.code]` (`:514`) → `kiemDonCuaMa`.
- `orders.js:962–979` `freshCode` trong giao dịch: `freshCode &&` — null thì bỏ qua, vẫn giảm, `UPDATE used_count` 0 dòng.
- `server/routes/signup-codes.js:470–527` /reset: `voucherRow` tra `code = ?` (`:482`, phân biệt hoa thường); DELETE theo `code` (`:510`);
  `if (voucherRow && xoa.changes === 0)` (`:511`); lời báo `SĐT ${signupRow.claimed_phone}` (`:521`).
- Ai gọi `/increment-usage`: `grep -rn "increment-usage" client/src server cong_cu` → KHÔNG màn hình nào; chỉ giả lập
  `cong_cu/gia_lap/kich_ban.js:416` (gọi bằng `'chu'`) và bất biến `cong_cu/gia_lap/bat_bien.js:215` (I13 đếm lượt tay).
- Quyền: `server/database.js:940/953/967` owner 1 · staff 0 · manager 1 cho `manage_promotions`.
- Móc tất định có sẵn: `cong_cu/thu_P20.js:68–74` `mocTruocTx` chạy giữa phép kiểm ngoài giao dịch và `beginTransaction` (orders.js:856 là
  `beginTransaction` đầu tiên của POST /orders). `thu_P26a.js` chưa có móc.

## Từng phần — phương án A / B, chọn

### A1 · DELETE /:id (discount-codes.js)
- **A (chọn):** bỏ `queryOne` + phép kiểm ngoài; `run('DELETE … WHERE id = ? AND COALESCE(used_count, 0) = 0')` → `changes = 1` → "Đã xóa";
  không thì `run('UPDATE … SET is_active = 0 … WHERE id = ?')` → `changes = 0` → 404, có → "đã vô hiệu hóa". 1 file, ~−4 dòng ròng.
  Không mở giao dịch: câu DELETE có điều kiện tự là nguyên tử (khuôn P20c); UPDATE sau đó chỉ tắt mã đã dùng — lặp lại vô hại, không có
  trạng thái giữa chừng nào cần rollback.
- **B:** đúng chữ phiếu — `beginTransaction`, DELETE có điều kiện, UPDATE, commit. ~+8 dòng, thêm try/rollback, không chặn thêm ca nào so với A.
- Lời đáp giữ nguyên: 404 khi không có mã, hai câu báo cũ.

### A2 · /validate (discount-codes.js)
- **A (chọn):** sau khi tìm thấy `discountCode`, chép ĐÚNG câu tra của `orders.js:512–515`
  (`SELECT order_id FROM pos_signup_codes WHERE UPPER(code) = UPPER(?) AND claimed_at IS NOT NULL`, tham số `discountCode.code`) → có thì
  `kiemDonCuaMa` (require từ `./signup-codes`, như orders.js:32) → lỗi thì 400 `{ error, code: 'MA_DON_GOC_KHONG_HOP_LE' }`. ~7 dòng.
  Không đụng orders.js → neo đột biến AUDIT-4 / P20b (`'[codeRecord.code],'` ×1, `' AND claimed_at IS NOT NULL"'` ×1 trong orders.js) giữ nguyên.
- **B:** tách hàm `kiemVoucherMaBill(code)` trong signup-codes.js, orders.js + /validate cùng gọi. Đúng "một chỗ" hơn (câu SELECT không bị
  chép), nhưng sửa cổng P20b đang chạy đúng và làm rữa 6 neo (P20b 4, AUDIT-4 4) — phiếu cấm đổi hành vi cổng P20b. Không chọn.
  "Hàm kiểm đơn gốc" (`kiemDonCuaMa`) vẫn là MỘT chỗ ở cả A.

### A3 · freshCode null / vô hiệu (orders.js:962–979)
- **A (chọn):** câu đọc thêm `is_active`; trước phép lượt: `if (!freshCode || !freshCode.is_active) { rollback; 400 MA_GIAM_KHONG_CON }`. ~6 dòng.
- **B:** thay đọc-rồi-tăng bằng một `UPDATE … WHERE id = ? AND is_active = 1 AND (usage_limit <= 0 OR used_count < usage_limit)` + `changes`.
  Gọn hơn nhưng gộp hai lỗi (hết lượt / mã mất) vào một mã lỗi — đổi hành vi `DISCOUNT_CODE_LIMIT_REACHED` đang có. Không chọn.

### A4 · tra mã bill bằng `codeRecord.code` — giữ code, chỉ thêm ca G8 (thu_P20.js).

### A5 · /reset (signup-codes.js)
- **A (chọn):** `voucherRow` tra `UPPER(code) = UPPER(?)`; `xoa = voucherRow ? await tx.run('DELETE … WHERE id = ? AND COALESCE(used_count, 0) = 0',
  [voucherRow.id]) : { changes: 0 }` — giữ nguyên dòng `if (voucherRow && xoa.changes === 0)` (neo P20c `VS-A3-changes-0-chan` không rữa);
  lời báo: `SĐT ${claimed_phone}` chỉ khi có SĐT, "voucher cũ đã xoá" chỉ khi `voucherRow`. ~4 dòng đổi.
- **B:** tách hai nhánh `if (voucherRow) { … }` — rõ hơn một chút, rữa thêm neo `VS-A3-changes-0-chan`. Không chọn.
- H3i (giới hạn đã biết b1 — voucher bị xoá tay giữa chừng → 400) giữ nguyên: DELETE theo id cũng ra `changes = 0` → 400.

### A6 · /:id/increment-usage
- Có người gọi (giả lập KB20 `kich_ban.js:416`, I13 đếm) → KHÔNG bỏ route (bỏ thì giả lập đỏ, mà `cong_cu/gia_lap/**` bị cấm sửa).
- **Chọn:** thêm `checkPermission('manage_promotions')` — 1 dòng. Giả lập gọi bằng `'chu'` (owner, quyền 1) → vẫn 200.
- AU4-15 (cổng P20b ngoài giao dịch): chỉ ghi CHƯA KIỂM.

**Ước lượng code:** ~25–30 dòng đổi (ngân sách phiếu 40–70). **Thử:** ~110 dòng.

## Ca thử — ánh xạ 1-1 với `## Nghiệm thu`

| NT | Bài · ca | Gốc | Vá |
|---|---|---|---|
| A1 | `thu_P26a.js` [B] M1 — mã `used_count = 0`, móc trên `db.run` (gắn TRƯỚC khi nạp route, chạy một lần khi câu bắt đầu `DELETE FROM pos_discount_codes`) đặt `used_count = 1` ngay trước câu xoá → DELETE /:id → mã còn, `is_active = 0`, 200; móc phải chạy | ĐỎ (mã bị xoá cứng) | XANH |
| A1 K5 | M2 mã chưa dùng → 200, dòng mất · M3 mã `used_count` NULL → xoá hẳn (như gốc) · M4 mã đã dùng (không đua) → còn, `is_active = 0` · M5 id không có → 404 | xanh | xanh |
| A2 | `thu_P20.js` [G] G1/G2/G3 thêm `/validate` → 400 `MA_DON_GOC_KHONG_HOP_LE` (mount thêm route discount-codes) | ĐỎ (200 valid) | XANH |
| A2 K5 | G4 (đơn gốc paid) · G5 (mã tay) · G7 (mã tay trùng chữ bill chưa claim) `/validate` → 200 `valid` | xanh | xanh |
| A3 | [G] G9 mã tay, `mocTruocTx` xoá mã → POST /orders 400 `MA_GIAM_KHONG_CON`, không đơn mới · G10 như G9 nhưng móc đặt `is_active = 0` | ĐỎ (200 có giảm) | XANH |
| A3 K5 | G4/G5/G7 dùng mã → 200 có giảm (đã có) · KB20/KB31/KB32 giả lập (hết lượt vẫn `DISCOUNT_CODE_LIMIT_REACHED`) | xanh | xanh |
| A4 | [G] G8 voucher đơn gốc đã huỷ, gửi `'  ' + ma + '  '` → 400 `MA_DON_GOC_KHONG_HOP_LE`, không đơn mới | xanh (giữ) — đột biến `VS-A4-tra-ma-tho` phải BẮT | xanh |
| A5 id | [H] H3j cùng SĐT, CÙNG giây (như H3g, `lucEp = T0`): móc hoàn tác A + claim lại → hoàn tác B → 400, voucher của lần claim mới còn, mã vẫn claimed | ĐỎ (B xoá voucher mới, 200) | XANH |
| A5 null | [H] H3k không voucher lúc kiểm; móc chèn voucher cùng mã (`used_count 0`) → hoàn tác → 200, voucher chèn vẫn còn, mã hết claimed | ĐỎ (xoá theo code) | XANH |
| A5 hoa | [H] H3l voucher đổi thành chữ thường + `used_count = 1` → hoàn tác → 400, mã vẫn claimed | ĐỎ (200, gỡ claim) | XANH |
| A5 lời | H3h thêm: `message` không chứa `null` · H3c thêm: `message` không chứa "đã xoá" | ĐỎ | XANH |
| A5 K5 | H3, H3b–H3i y nguyên | xanh | xanh |
| A6 | `thu_P26a.js` [C] M6 nhân viên (`staff`, tạo bằng INSERT) gọi `/increment-usage` → 403, `used_count` không đổi · M7 chủ → 200 (K5) | ĐỎ (200) | XANH |
| A7 | `npm test`, `--day-du`; `dot_bien.py` (dưới); đột biến cũ P20b, P20c, AUDIT-1 D1 + C2F discount-codes, AUDIT-4 P20B chạy lại | — | — |

**Ca hai người cùng bấm (đụng tiền):** A1 M1 (xoá ↔ đơn dùng mã) và A3 G9/G10 (xoá / tắt ↔ đơn) dựng bằng móc tất định. A5 dùng lại H3d/H3e/H3g + H3j.

## Đường song song (K4)
- Xoá mã giảm: DELETE /:id (A1) · /reset DELETE (A5) — hai chỗ duy nhất `grep -n "DELETE FROM pos_discount_codes" server/` (sẽ chạy lại).
- Tra mã bill: orders.js:512 · /validate (A2) · /reset (A5 — tra voucher). Grep `pos_signup_codes WHERE UPPER(code)` sau vá.
- Tăng `used_count`: orders.js:974 · /increment-usage (A6). Grep `used_count = used_count + 1`.
- Đọc mã trong giao dịch: chỉ `freshCode` (A3). Đường huỷ / xoá đơn trả lượt (`traLuotMa`) — ngoài phiếu, ghi Phát hiện nếu thấy cùng khuôn.

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
- Xoá mã chưa dùng / used_count NULL → xoá hẳn (M2, M3). Mã đã dùng → vô hiệu (M4). Id lạ → 404 (M5).
- `/validate`: mã tay (G5), mã đổi điểm (KB19 giả lập), mã bill đơn gốc paid (G4), mã tay trùng chữ bill chưa claim (G7), voucher 1 món (KB giả lập).
- POST /orders: mã còn hiệu lực (G4, G5, G7), hết lượt vẫn mã lỗi cũ (KB20).
- /reset: H3, H3b–H3i y nguyên.
- `/increment-usage` bằng chủ (M7, KB20).

## Đột biến `viec/MA-GIAM-1/dot_bien.py` (khuôn P20b: bản sao thật, đối chứng xanh trước)
VS-A1-null-lech · BV-A1-bo-dieu-kien · VS-A1-khong-vo-hieu · BV-A2-bo-cong-validate · VS-A2-tra-ca-chua-claim · BV-A3-bo-kiem-null ·
VS-A3-chi-null · VS-A4-tra-ma-tho · BV-A5-xoa-theo-code · VS-A5-null-van-xoa · VS-A5-phan-biet-hoa · BV-A5-loi-bao-null · BV-A6-bo-quyen ·
BV-P20C-A3-bo-dieu-kien (port neo rữa của `viec/P20c/dot_bien.py:24`, câu DELETE đổi `code` → `id`).

Neo cũ dự kiến rữa: chỉ P20c `BV-A3-bo-dieu-kien` (ghi trước / sau, port như trên). AUDIT-1 C2F đánh số lệnh ghi của discount-codes.js
có thể dịch (A1 bớt một `run`, thêm câu) — chạy lại, ghi tên trước / sau.

## Xin duyệt (lệch chữ phiếu)
1. A1 không mở giao dịch (phương án A) — lý do ở trên. Chủ quán muốn đúng chữ "trong giao dịch" thì làm B (+8 dòng).
2. A2 chép câu SELECT của orders.js:512 sang /validate thay vì tách hàm (giữ cổng P20b không đổi, không rữa neo).
