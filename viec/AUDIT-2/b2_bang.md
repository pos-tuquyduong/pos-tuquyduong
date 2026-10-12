# AUDIT-2 B2 — `dot_bien_bb.py` chạy đủ, xếp loại mọi SỐNG

Lệnh: `python3 viec/AUDIT-2/dot_bien_bb.py -j 4` (12.10, 591 s, "✓ kho thật không đổi") + sau khi sửa bộ sinh (6 đột biến I7 bị
lọc nhầm — `trang_thai.md` Sự cố) `--chi BB-I7-js --chi D2-` (64 s). Tổng **148 đột biến sinh: 100 BẮT · 48 SỐNG · 0 LẠC · 0 HỎNG**
(tầng 1 dữ liệu tay bắt 80 — 27 trong đó là ca SẠCH lệch = đột biến SIẾT; tầng 2 giả lập bắt 20). 89 chỗ bỏ qua có lý do ở `--liet-ke`.

| bất biến | sinh | SỐNG |
|---|---|---|
| I1 | 13 | 10 |
| I3 | 10 | 6 |
| I4 | 4 | 2 |
| I6 | 2 | 2 |
| I7 | 8 | 0 |
| I8 | 17 | 8 |
| I9 | 16 | 10 |
| I12 | 18 | 1 |
| I13 | 11 | 1 |
| I14 | 24 | 5 |
| I15 | 9 | 0 |
| I16 | 10 | 3 |
| I17 | 6 | 0 |

**(c) code quầy đang SAI: 0.** **(b) vế THỪA / tương đương: 4.** **(a) cần ca dữ liệu tay: 44** (ca đề xuất theo bất biến ở cuối).

| tên | bat_bien.js | đổi | loại | lý do |
|---|---|---|---|---|
| `BB-I1-sql-1-bo-ve` | 27 | `r.order_id = o.id → 1=1` | (a) | ca tay I1 — xem dưới |
| `BB-I1-sql-2-bo-ve` | 27 | `r.status = 'approved' → 1=1` | (a) | ca tay I1 — xem dưới |
| `BB-I1-sql-3-bo-ve` | 29 | `s.claimed_at IS NOT NULL → 1=0` | (a) | ca tay I1 — xem dưới |
| `BB-I1-sql-4-bo-ve` | 29 | `s.diem_nhan_luc IS NOT NULL → 1=0` | (a) | ca tay I1 — xem dưới |
| `BB-I1-js-1-bo-ve` | 30 | `r.payment_status === 'paid' → (true)` | (a) | ca tay I1 — xem dưới |
| `BB-I1-js-2-bo-ve` | 30 | `(r.status === 'completed' \|\| (r.status === 'c → (true)` | (a) | ca tay I1 — xem dưới |
| `BB-I1-js-6-bo-ve` | 31 | `r.status === 'cancelled' → (true)` | (a) | ca tay I1 — xem dưới |
| `BB-I1-js-7-bo-ve` | 31 | `String(r.cancelled_at) >= String(r.luc_dung) → (true)` | (a) | ca tay I1 — xem dưới |
| `BB-I1-js-8-bo-ve` | 32 | `r.status === 'refunded' → (true)` | (a) | ca tay I1 — xem dưới |
| `BB-I1-js-9-bo-ve` | 32 | `String(r.luc_hoan) >= String(r.luc_dung) → (true)` | (a) | ca tay I1 — xem dưới |
| `BB-I3-sql-1-bo-ve` | 43 | `COALESCE(payment_status, '') NOT IN ('paid',  → 1=0` | (a) | ca tay I3 — xem dưới |
| `BB-I3-sql-2-bo-ve` | 44 | `COALESCE(status, '') NOT IN ('completed', 'ca → 1=0` | (a) | ca tay I3 — xem dưới |
| `BB-I3-sql-3-bo-ve` | 45 | `(payment_status = 'paid' AND COALESCE(debt_am → 1=0` | (a) | ca tay I3 — xem dưới |
| `BB-I3-sql-4-bo-ve` | 46 | `(payment_status IN ('partial', 'pending') AND → 1=0` | (a) | ca tay I3 — xem dưới |
| `BB-I3-sql-1-duong` | 45 | `COALESCE(debt_amount, 0) <> 0 → COALESCE(debt_amount, 0) > 0` | (a) | ca tay I3 — xem dưới |
| `BB-I3-sql-1-am` | 45 | `COALESCE(debt_amount, 0) <> 0 → COALESCE(debt_amount, 0) < 0` | (a) | ca tay I3 — xem dưới |
| `BB-I4-js-1-duong` | 57 | `Math.abs(so(r.balance) - so(r.so_sach)) > 0.5 → (so(r.balance) - so(r.so_sach)` | (a) | ca tay I4 — xem dưới |
| `BB-I4-js-1-am` | 57 | `Math.abs(so(r.balance) - so(r.so_sach)) > 0.5 → (so(r.so_sach) - so(r.balance)` | (a) | ca tay I4 — xem dưới |
| `BB-I6-js-1-duong` | 70 | `Math.abs(so(r.da_ghi) - so(r.total)) > 1 → (so(r.da_ghi) - so(r.total)) >` | (a) | ca tay I6 — xem dưới |
| `BB-I6-js-1-am` | 70 | `Math.abs(so(r.da_ghi) - so(r.total)) > 1 → (so(r.total) - so(r.da_ghi)) >` | (a) | ca tay I6 — xem dưới |
| `BB-I8-js-1-bo-ve` | 129 | `cfg.loyalty_enabled === 'true' → (true)` | (a) | ca tay I8 — xem dưới |
| `BB-I8-js-3-bo-ve` | 129 | `so(r.total) > 0 → (true)` | (a) | ca tay I8 — xem dưới |
| `BB-I8-js-4-bo-ve` | 129 | `so(r.flash) === 0 → (true)` | (a) | ca tay I8 — xem dưới |
| `BB-I8-js-5-bo-ve` | 129 | `g > 0 → (true)` | (a) | ca tay I8 — xem dưới |
| `BB-I8-js-1-duong` | 129 | `so(r.flash) === 0 → so(r.flash) <= 0` | (a) | ca tay I8 — xem dưới |
| `BB-I8-js-1-am` | 129 | `so(r.flash) === 0 → so(r.flash) >= 0` | (a) | ca tay I8 — xem dưới |
| `BB-I8-js-2-duong` | 131 | `so(r.diem) === dung → so(r.diem) <= dung` | (a) | ca tay I8 — xem dưới |
| `BB-I8-js-2-am` | 131 | `so(r.diem) === dung → so(r.diem) >= dung` | (a) | ca tay I8 — xem dưới |
| `BB-I9-js-3-bo-ve` | 166 | `thu.length !== quay.length → (false)` | (a) | ca tay I9 — xem dưới |
| `BB-I9-js-4-bo-ve` | 166 | `tongLog !== tong(quay) → (false)` | (a) | ca tay I9 — xem dưới |
| `BB-I9-js-1-duong` | 166 | `thu.length !== quay.length → thu.length > quay.length` | (a) | ca tay I9 — xem dưới |
| `BB-I9-js-1-am` | 166 | `thu.length !== quay.length → thu.length < quay.length` | (a) | ca tay I9 — xem dưới |
| `BB-I9-js-2-duong` | 166 | `tongLog !== tong(quay) → tongLog > tong(quay)` | (a) | ca tay I9 — xem dưới |
| `BB-I9-js-2-am` | 166 | `tongLog !== tong(quay) → tongLog < tong(quay)` | (a) | ca tay I9 — xem dưới |
| `BB-I9-js-3-duong` | 170 | `doi !== (ctx.soQuay.doi.get(id) \|\| 0) → doi > (ctx.soQuay.doi.get(id) ` | (a) | ca tay I9 — xem dưới |
| `BB-I9-js-3-am` | 170 | `doi !== (ctx.soQuay.doi.get(id) \|\| 0) → doi < (ctx.soQuay.doi.get(id) ` | (a) | ca tay I9 — xem dưới |
| `BB-I9-js-4-duong` | 171 | `(no.get(id) \|\| 0) !== thu.length → (no.get(id) \|\| 0) > thu.length` | (a) | ca tay I9 — xem dưới |
| `BB-I9-js-4-am` | 171 | `(no.get(id) \|\| 0) !== thu.length → (no.get(id) \|\| 0) < thu.length` | (a) | ca tay I9 — xem dưới |
| `BB-I12-js-2-duong` | 204 | `so(r.so_ma) !== 1 → so(r.so_ma) > 1` | (a) | ca tay I12 — xem dưới |
| `BB-I13-sql-1-am` | 218 | `o.discount_value = d.discount_value → o.discount_value >= d.discount` | (a) | ca tay I13 — xem dưới |
| `BB-I14-sql-10-bo-ve` | 249 | `oi.product_id > 0 → 1=1` | (a) | ca tay I14 — xem dưới |
| `BB-I14-sql-11-bo-ve` | 249 | `COALESCE(oi.unit_price, 0) = 0 → 1=1` | (a) | ca tay I14 — xem dưới |
| `BB-I14-sql-1-duong` | 232 | `COALESCE(oi.unit_price, 0) = 0 → COALESCE(oi.unit_price, 0) <= ` | (b) | `COALESCE(unit_price,0) <= 0` ≡ `= 0` vì đơn giá không âm (món thường > 0 — `orders.js:292`; món gói 0) |
| `BB-I14-sql-2-duong` | 249 | `COALESCE(oi.unit_price, 0) = 0 → COALESCE(oi.unit_price, 0) <= ` | (b) | như trên (vế "mua gói lấy ngay") |
| `BB-I14-sql-2-am` | 249 | `COALESCE(oi.unit_price, 0) = 0 → COALESCE(oi.unit_price, 0) >= ` | (a) | ca tay I14 — xem dưới |
| `BB-I16-sql-1-bo-ve` | 269 | `l.loai = 'doi' → 1=1` | (b) | `l.loai = 'doi'` THỪA: `l.id = (SELECT MAX(x.id) … AND x.loai = 'doi')` đã buộc l là dòng doi |
| `BB-I16-sql-4-bo-ve` | 269 | `x.loai = 'doi' → 1=1` | (a) | ca tay I16 — xem dưới |
| `BB-I16-js-2-duong` | 274 | `so(ct.sang === 'cash' ? r.transfer_amount : r → so(ct.sang === 'cash' ? r.tran` | (b) | `so(cột tiền kia) <= 0` ≡ `=== 0` vì cash_amount / transfer_amount không âm |

Ca dữ liệu tay đề xuất (loại a) — mỗi bất biến một khung trong `cong_cu/thu_gia_lap.js` (`KHUNG`, `CA`):

- **I1** (10 SỐNG): mã dùng trên đơn chưa thu; đơn huỷ TRƯỚC lúc dùng (−1 giây) và ĐÚNG lúc dùng; đơn hoàn trước / sau lúc dùng; yêu cầu hoàn chưa duyệt / của đơn khác; mã chưa dùng không bị soát.
- **I3** (6 SỐNG): payment_status lạ; status lạ; paid còn nợ +1 và −1; partial / pending nợ 0.
- **I4** (2 SỐNG): ví lệch sổ +1 và −1 (ngưỡng 0,5).
- **I6** (2 SỐNG): đơn ghi thừa +2 và thiếu −2 (ngưỡng ±1).
- **I8** (8 SỐNG): vế lúc BÁN (hiện chỉ có vế đổi điểm): loyalty tắt, total 0, flash > 0, g = 0 → 0 điểm; điểm lệch +1 và −1.
- **I9** (10 SỐNG): nhật ký thu thiếu / thừa một dòng; tổng thu lệch +1 và −1; nhật ký doi thiếu / thừa; debt_payment thiếu / thừa.
- **I12** (1 SỐNG): mã quà bị xoá (0 dòng mã) — hiện chỉ có ca 2 dòng (phía trên).
- **I13** (1 SỐNG): đơn gõ mã cùng loại, trị giá THẤP hơn mã (không được tính là đã áp).
- **I14** (5 SỐNG): vế "đơn mua gói lấy ngay": đơn mua gói + món TRẢ TIỀN, không lấy ngay; đơn mua gói + thẻ 0đ (product_id ≤ 0, giá 0).
- **I16** (3 SỐNG): dòng nhật ký "thu" có id SAU dòng "doi" cuối.

**Đề xuất khoá (việc sau, sửa `cong_cu/thu_gia_lap.js` — ngoài Phạm vi việc này):** thêm các ca trên — ca đỏ: chính các đột biến
(a) ở bảng này chuyển BẮT (`python3 viec/AUDIT-2/dot_bien_bb.py --chi BB-I1 …`). Với (b): giữ vế, chú thích `// thừa vì …` + tên đột biến
vào danh sách miễn của công cụ khi dời công cụ về `cong_cu/gia_lap/` (đề xuất B4).
