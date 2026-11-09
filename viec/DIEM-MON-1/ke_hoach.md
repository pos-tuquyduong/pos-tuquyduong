# DIEM-MON-1 — kế hoạch (ĐÃ DUYỆT 09.11 — Q1 = CÁCH 2; xem mục 6)

## 0. Lời thường cho chủ quán
Mỗi món / mỗi hạng thẻ / mỗi gói trả trước có thêm một công tắc "Tích điểm" (mặc định BẬT — hôm nay không gì đổi). Lúc bán, máy chủ ghi
vào đơn "phần tiền hàng được tích điểm". Mọi chỗ cộng điểm (quầy, App, nhận điểm bằng mã bill, thu nợ) và hoá đơn đọc đúng con số đó,
nên tắt / bật công tắc SAU khi bán không làm đổi điểm của đơn cũ. Bạn cần: đọc mục 5 (một câu cần bạn xác nhận) rồi duyệt.

## 1. Code đã đọc (lượt này)
- `server/utils/diemThat.js:10-14` `tienTinhDiem(dong)` = min(tiền khách trả, total) − phí giao — tính trên CẢ đơn. `:20-21` diemTruKhiHoan,
  `:33-55` truDiemHoan (mẫu số = `tienTinhDiem(don)`).
- Lối gọi `tienTinhDiem` (grep `tienTinhDiem\|truDiemHoan` trong `server/`): `orders.js:934` (tạo đơn — quầy + App vì `donApp.js:22,141` gọi
  `taoDon` của orders.js), `orders.js:1425` (pay-debt, `order` = `SELECT *` dòng 1372), `signup-codes.js:210` (/nhan-diem, `don` đọc ở
  `:54` với DANH SÁCH CỘT cố định), `hoaDon.js:83` (hoá đơn hiện "mã bill được N điểm", `o` = `SELECT *` `:144`); truDiemHoan ở
  `refunds.js:182`, `damages.js:208`, `packages.js:271`, `signup-codes.js:262` (`don` mỗi chỗ là `SELECT *` hoặc cột `:54`).
- Dòng đơn dựng ở `orders.js`: món `:470` (`product` = `SELECT *` `:383/388`), gói trả trước `:501` (`pkg` = `SELECT *` `:490`), thẻ hạng
  `:536` (`membershipTier` = `SELECT *` `:521`), gói nạp `:557`. Giảm hạng theo dòng (`tier_unit_price`, `:774`), mã 1 món (`signup_unit_price`,
  `:793`), tổng `:801`. Đơn nạp 0 điểm `:939`. Flash 0 điểm `:934`, `nhanDiem.js:28`.
- Ghi cột: products.js chỉ `UPDATE ... SET <cột kê tên>` / `INSERT` không ghi cột mới → cờ mới không bị xoá; packages.js `PUT /:id`, tiers.js
  `PUT /` (`:101-108`) cũng kê tên cột → không đụng cờ.
- `hoaDon.js` KHÔNG thuộc Phạm vi — nhưng nó gọi `tienTinhDiem(o)` với `o` = `SELECT *`, nên giữ chữ ký `tienTinhDiem(dong)` và đọc cột mới
  trong dòng đơn là nó tự đúng, không phải sửa.

## 2. Phương án

### Phần 1 — lưu cờ và lưu "phần tiền tích điểm" của đơn
- **A (chọn):** bước `024_tich_diem_mon.js` thêm qua `themCot` (có sao lưu): `tich_diem INTEGER NOT NULL DEFAULT 1` cho `pos_products`,
  `pos_packages`, `pos_membership_tiers`; `tien_hang_diem INTEGER` (NULL được) cho `pos_orders`. Đơn cũ NULL → tính như hôm nay.
  ~25 dòng. Rủi ro: thấp (chỉ thêm cột).
- **B:** lưu cờ theo từng `pos_order_items` rồi mọi lối tính điểm JOIN dòng đơn. ~+60 dòng, phải đổi `hoaDon.js` (ngoài Phạm vi) và
  4 chỗ đọc đơn sang bất đồng bộ. Loại.
- Hạng thẻ: một cờ cho cả HẠNG (mọi gói tháng của hạng) — phiếu ghi "mỗi hạng bán được". Không thêm cờ vào JSON `goi` (KH-THE-1 đang sửa
  vùng đó song song).

### Phần 2 — MỘT hàm tính (nghiệm thu B), ở `server/utils/diemThat.js`
- `tienHangDiem(dongDon, tienHang)` — lúc tạo đơn, CÙNG quy tắc chia tiền theo dòng của `utils/tienDaTra.js:13-25` (`tienDaTraTheoDong`,
  nhánh thường): giá dòng = `(flash_unit_price || tier_unit_price || unit_price) × quantity`; tiền tích điểm = floor(Σ giá dòng có `tich_diem`
  × `tienHang` / Σ giá mọi dòng), `tienHang` = total − phí giao; Σ = 0 → 0. Mọi khoản giảm cấp đơn (mã cả đơn, mã 1 món — mã 1 món chỉ giảm
  MỘT đơn vị, `uuDai.js:28-29`, không ghi xuống dòng) chia theo tỷ lệ như `tienDaTra`. Không gọi thẳng `tienDaTraTheoDong` được (bất đồng bộ,
  đọc `pos_order_items` từ kho — lúc tính chưa có dòng); file đó ngoài Phạm vi nên không tách hàm thuần ra — ghi Phát hiện. Dòng gói nạp không
  có `tich_diem` → tính tắt (đơn nạp vốn 0 điểm ở `orders.js:939`, không thêm cờ / đột biến cho nó).
- `tienTinhDiem(dong)` (giữ tên, giữ chữ ký) = `tienTraDon(dong)` (công thức cũ, tách tên) × `tien_hang_diem / (total − phí giao)`, kẹp ≤ 1,
  làm tròn như cũ; `tien_hang_diem` NULL/không có → hệ số 1 (đơn cũ); `total − phí giao ≤ 0` (đơn chỉ lấy từ gói) → 0, không chia cho 0 (NaN). Mọi lối cộng điểm đã gọi hàm này → quầy, App, pay-debt, /nhan-diem,
  hoá đơn cùng đúng mà KHÔNG thêm lời gọi mới.
- `orders.js`: gắn `tich_diem` vào 3 loại dòng (`product.tich_diem !== 0`, `pkg.tich_diem !== 0`, `membershipTier.tich_diem !== 0`);
  tính `tien_hang_diem` một lần sau dòng `:801`; truyền vào `tienTinhDiem({...})` ở `:934`; ghi vào INSERT `pos_orders`. ~15 dòng.
- `signup-codes.js:54`: thêm `tien_hang_diem` vào danh sách cột. 1 dòng.
- **B:** hàm riêng cho từng lối. Loại (trái "một quy tắc — một hàm").

### Phần 3 — trừ điểm (nghiệm thu C)
- `truDiemHoan`: mẫu số đổi từ `tienTinhDiem(don)` sang `tienTraDon(don)` (TOÀN tiền khách trả, chưa nhân tỷ lệ). Lý do: điểm = tiền trả ×
  tỷ lệ; hoàn R đồng thì tiền trả còn (trả − R) → điểm phải còn (trả − R) × tỷ lệ ⇒ trừ `diem × R / trả`. Giữ mẫu số cũ (đã nhân tỷ lệ) thì
  hoàn một phần nhỏ của đơn có món tắt điểm cũng trừ gần hết điểm — sai. `Math.min(diem, …)` giữ nguyên ⇒ không bao giờ trừ quá điểm đã cộng.
  Đơn cũ / đơn toàn món bật: tỷ lệ 1 → `tienTraDon = tienTinhDiem` → hành vi y hệt. 2 dòng.
- Huỷ / xoá đơn (`orders.js:1710+`) trừ HẾT điểm của đơn — không đổi, đã đúng.

### Phần 4 — đường cài đặt (nghiệm thu D)
- **A (chọn):** `server/routes/loyalty.js` thêm 2 cửa: `GET /loyalty/tich-diem` (authenticate + `manage_settings` — cùng quyền xem tab Điểm
  thưởng) trả `{ mon: [{id, ten, tich_diem}], goi: [...], hang: [...] }` (món đang bán có giá, gói đang bật, hạng `cach_co = 'ban'` đang bật);
  `PUT /loyalty/tich-diem` (authenticate + `checkPermission('manage_promotions')`) nhận `{ loai: 'mon'|'goi'|'hang', ids: [số nguyên], bat: bool }`
  → MỘT câu `UPDATE <bảng theo loai, danh sách trắng> SET tich_diem = ? WHERE id IN (...)`. Sai dạng → 400 `{ error, code: 'TICH_DIEM_SAI' }`.
  ~50 dòng. Không đụng products.js / packages.js / tiers.js (giảm va chạm với KH-THE-1).
- **B:** thêm trường cờ vào cửa lưu riêng của mỗi bảng (3 file). ~+40 dòng, 3 quyền khác nhau (`manage_settings`, `manage_users`,
  `manage_promotions`) trái nghiệm thu D. Loại.

### Phần 5 — giao diện (nghiệm thu D)
- `client/src/pages/CaiDat/TichDiem.jsx` (mới, ~140 dòng): 3 nhóm Món / Thẻ hạng / Gói trả trước; mỗi dòng ô chọn + công tắc; thanh nút
  "Chọn tất cả · Bỏ chọn · Bật tích điểm · Tắt tích điểm" cho mục đã chọn; ghi chú "Gói nạp: không tích điểm. Phí giao: không tích điểm".
  Gọi máy chủ qua `client/src/utils/api.js` (helper có sẵn — không `fetch` trần). Không có quyền `manage_promotions` → nút khoá.
- `Settings.jsx`: chèn `<TichDiem />` cuối tab `loyalty` (~3 dòng). Build `dist`.
- Màn Bán hàng / bill: KHÔNG đổi.

### Phần 6 — bộ kiểm `kiem_tra_truoc_khi_giao.js`
- Không thêm phép (bài thử `thu_DIEMMON1.js` canh hành vi). Chỉ chạy.

**Tổng ước lượng:** máy chủ ~95 dòng (ngân sách 200) · giao diện ~145 (150) · thử ~300 (300).

## 3. Ca thử `cong_cu/thu_DIEMMON1.js` ↔ nghiệm thu (khuôn `thu_DIEMTHAT1.js`: database.js thật + libsql trên kho tạm, SX giả)
Cài đặt: điểm bật, 1.000đ = 1 điểm, hệ số mã bill 2. Món X 40.000 (tắt), món Y 60.000 (bật).
| Ca | Nghiệm thu | Nội dung | Gốc |
|---|---|---|---|
| T1 | A | Sau nâng cấp: cột `tich_diem` có ở 3 bảng, mặc định 1; dòng cũ = 1; `pos_orders.tien_hang_diem` có | ĐỎ |
| T2 | A, K5 | Đơn cũ (không cờ, `tien_hang_diem` NULL) và đơn toàn món bật: điểm = như hôm nay (100.000 → 100) | xanh (đối chứng) |
| T3 | B quầy | X tắt + Y bật, trả tiền mặt 100.000 → 60 điểm | ĐỎ (100) |
| T4 | B | Như T3 trả ví (NAP-1 có điểm) → 60; trả CK → 60 | ĐỎ |
| T5 | B | Mã giảm 10% cả đơn: 90.000 → 54 điểm (chia theo tỷ lệ) | ĐỎ |
| T6 | B | Khách hạng giảm 10% món: X 36.000 + Y 54.000 = 90.000 → 54 điểm (tỷ lệ trên giá sau giảm hạng) | ĐỎ (90) |
| T6b | B | Mã giảm 1 món 10.000 (một đơn vị): đơn X + Y = 90.000 → floor(60.000 × 90.000 / 100.000) = 54.000 → 54 | ĐỎ (90) |
| T7 | B App | Đơn App (`donApp` → taoDon) cùng giỏ → 60 | ĐỎ |
| T8 | B /nhan-diem | Đơn T3 không SĐT, nhận bằng mã bill → 60×2 = 120; đổi cờ X sang BẬT sau khi bán → vẫn 120 (đọc số đã lưu) | ĐỎ |
| T9 | B pay-debt | Đơn nợ X+Y, thu đủ → 60 | ĐỎ |
| T10 | A | Gói G 300.000 tắt cờ → mua G 0 điểm (gốc 300); G + Y = 360.000 → 60 | ĐỎ |
| T11 | A | Hạng tắt cờ, gói 3 tháng 200.000 → mua thẻ 0 điểm (gốc 200); thẻ + Y → 60 | ĐỎ |
| T12 | A, K5 | Gói nạp vẫn 0 điểm; phí giao không điểm | xanh (đối chứng) |
| T13 | C đền | Đơn T3 (60 điểm) đền Y 30.000 vào ví → trừ ceil(60×30.000/100.000) = 18; đền tiếp X 40.000 + Y 30.000 → tổng trừ 60, không quá (trần đền theo dòng `damages.js:194-199`) | ĐỎ (gốc cộng 100, trừ 30) |
| T13b | C hoàn | Duyệt hoàn (`refunds.js:182`) đơn T3 trả 50.000 vào ví → trừ 30 | ĐỎ (gốc 50) |
| T13c | C mã bill | Đơn T3 không SĐT, đền 30.000 trước, rồi /nhan-diem: cộng 120, trừ ngay ceil(120×30.000/100.000) = 36 (`signup-codes.js:262`) | ĐỎ |
| T14 | C gói | Đơn G (tắt, 300.000) + Y (bật, 60.000) → 60 điểm; kết thúc gói hoàn 180.000 vào ví → trừ ceil(60×180.000/360.000) = 30 (theo Q1) | ĐỎ (gốc 360/180) |
| T15 | C | Hai lệnh đền cùng lúc (`co.mocTruocTx`) → tổng trừ không quá điểm đã cộng | ĐỎ/xanh — ghi rõ |
| T16 | D | `PUT /loyalty/tich-diem` không quyền `manage_promotions` → 403; quyền đúng → đổi đúng các id; `loai` lạ / id không số → 400 `TICH_DIEM_SAI`; không đụng bảng khác | ĐỎ (404) |
| T17 | D | `GET /loyalty/tich-diem` trả 3 nhóm, không có giá vốn | ĐỎ |
| T18 | E | Đơn KHÔNG SĐT (hoá đơn chỉ in mã khi không SĐT, `hoaDon.js:68`): điểm hoá đơn báo cho mã = điểm /nhan-diem ghi sổ (120); đối soát (`doiSoat.js`) tổng điểm = Σ sổ | ĐỎ |
| T19 | K5 | Flash vẫn 0 điểm; đơn nợ không cộng lúc tạo; trả lời `/api/kh` đơn không thêm trường (so danh sách khoá); `total`, `subtotal`, giảm hạng của đơn T3/T6 như gốc | xanh (đối chứng) |
| — | D giao diện | Nút chọn nhiều / công tắc: KHÔNG có bài máy — chủ quán thử tay (3 thao tác ghi ở báo cáo); màn Bán hàng / bill không đổi: `git diff` không đụng Sales.jsx / InvoicePrint | ghi CHƯA KIỂM |

Đột biến `dot_bien.py` (mỗi chỗ vá ≥ 1): `BV-HAM` (tienTinhDiem bỏ hệ số), `VS-MAUSO` (truDiemHoan giữ mẫu số cũ), `BV-COT-NHANDIEM` (bỏ cột ở
signup-codes:54), `VS-CHIA0` (bỏ chặn mẫu số 0), `VS-GIA` (giá dòng bỏ giá hạng), `BV-QUYEN` (PUT dùng `manage_settings`), `VS-BANG` (bỏ danh sách trắng
bảng), `BV-TRAN` (bỏ kẹp ≤ 1).

## 4. Đường song song (K4) và luồng hợp lệ không được chặn (K5)
- Song song: 4 lối cộng (tạo đơn quầy/App, pay-debt, /nhan-diem, hoá đơn hiện điểm) — đều qua `tienTinhDiem`; 4 lối trừ (`truDiemHoan` ở
  refunds, damages, packages, signup-codes) — đều qua một hàm; huỷ / xoá trừ hết. Báo cáo / đối soát điểm đọc sổ `pos_point_transactions`
  (không tính lại) → không lệch.
- Không được chặn: đơn cũ không cột; đơn chỉ lấy từ gói (0đ, tienHang 0 → 0 điểm như nay); mua gói + lấy ngay; đơn không SĐT nhận mã bill;
  đơn có phí giao; đơn nạp; đơn toàn món bật (tỷ lệ đúng 1, không lệch làm tròn).

## 5. Cần chủ quán xác nhận (Q1)
Khi trả tiền vào tài khoản (hoàn / đền / kết thúc gói) cho đơn có món tắt điểm, mình đề xuất **trừ điểm theo tỷ lệ trên toàn tiền đơn**
(hoàn 30% tiền đơn → trừ 30% điểm đơn). Cách khác: kết thúc gói (tiền hoàn là của gói) mà gói tắt điểm thì không trừ — cần biết khoản hoàn
thuộc dòng nào, thêm ~30 dòng. Đề xuất: cách thứ nhất (đơn giản, không bao giờ trừ quá điểm đã cộng).

## 6. Bổ sung sau duyệt 09.11 — CÁCH 2 (chủ quán chọn) và hai chỗ ngoài Phạm vi

### 6.1 Luật trừ điểm CÁCH 2 (thay Phần 3)
- Cờ của từng dòng lưu NGAY lúc bán: bước 024 thêm `pos_order_items.tich_diem` (NULL = đơn cũ = bật). Bật / tắt công tắc sau khi bán không đổi đơn cũ.
- `truDiemHoan` chia tiền đã trả vào tài khoản của đơn thành 3 phần (đọc từ dữ liệu có cấu trúc, không đọc chữ ghi chú):
  - **gắn dòng BẬT** `Rb` · **gắn dòng TẮT** `Ro` (bỏ qua, trừ 0) · **không gắn dòng** `Rk` (duyệt hoàn).
  - Kết thúc gói (sổ ví 'refund' của đơn CÓ dòng gói — duyệt hoàn bị chặn ở đơn có gói / thẻ, `refunds.js:29-31,164`; mỗi đơn tối đa MỘT dòng
    gói, `orders.js` `package_buy` một `package_id`) → gắn dòng gói. Đơn không có gói: 'refund' = duyệt hoàn → `Rk`.
  - Đền ('compensation') → gắn dòng theo `pos_damage_logs.product_code` (cần mục 6.2 Q2).
- Số trừ = min(điểm, ceil(điểm × (Rk / tiền trả + Rb / tiền tính điểm))). Đơn cũ / đơn toàn món bật: tiền tính điểm = tiền trả → y hệt hôm nay
  (bài cũ thu_NAP1 E10, E12, E16d giữ nguyên số).
- Ca sửa: **T13** đơn X tắt 40.000 + Y bật 60.000 tiền mặt (60 điểm): đền Y 30.000 → trừ ceil(60 × 30.000 / 60.000) = 30; đền tiếp Y 30.000 → tổng
  60, không quá. **T13d (mới)** đền X (tắt) 40.000 → trừ 0. **T13b** duyệt hoàn 50.000 (không gắn dòng) → trừ ceil(60 × 50.000 / 100.000) = 30.
  **T14** gói G tắt 300.000 + Y bật 60.000 (60 điểm), kết thúc gói hoàn 180.000 → trừ 0. **T14b (mới)** gói bật + Y tắt: kết thúc gói hoàn → trừ
  theo phần gói. **T13c** đơn có SĐT, đền Y rồi nhận mã bill → trừ phần Y theo điểm mã bill.
- Đột biến thêm: `VS-HOAN-TOANDON` (đền / kết thúc gói tính như không gắn dòng — T13, T13d, T14 bắt), `VS-TAT-VAN-TRU` (dòng tắt vẫn tính vào Rb —
  T13d, T14 bắt), `BV-COT-DONG` (không ghi `tich_diem` xuống dòng đơn — T13d bắt).

### 6.2 Hai chỗ NGOÀI Phạm vi (ghi ở `trang_thai.md ## Câu hỏi`)
- **Q2 — `server/routes/damages.js`**: lúc gọi `truDiemHoan` (dòng 208) dòng `pos_damage_logs` của lần đền này CHƯA ghi (`ghiHangHong` ở dòng
  211) → máy chủ không biết lần đền này thuộc món nào. Đề xuất: dời MỘT dòng `ghiHangHong` lên trước khối đền (không đổi số tiền, không đổi
  trả lời). Cách khác trong Phạm vi: đọc mã món từ CHỮ ghi chú sổ ví ("… - <mã món> xN") — dễ vỡ khi ai đổi câu chữ, không đề xuất.
- **Q3 — `cong_cu/gia_lap/bat_bien.js` I8**: màn Đối soát chạy I8 trên dữ liệu thật (`server/utils/doiSoat.js:18,39,203`). I8 tự tính lại điểm theo
  TIỀN CẢ ĐƠN (`bat_bien.js:146-190`) → tắt điểm một món là MỌI đơn có món đó hiện "lệch" ở Đối soát (trái nghiệm thu E). Kế hoạch mục 4 ghi "đối
  soát đọc sổ, không tính lại" là SAI (K1 — chưa đọc I8). Đề xuất: thêm `bat_bien.js` vào Phạm vi; I8 nhân tỷ lệ `tien_hang_diem` của đơn và áp
  luật CÁCH 2 (công thức chép riêng như nay — trọng tài không gọi diemThat.js); đơn cũ (cột NULL) giữ y hệt. Ca thử T18 khoá: đơn có món tắt,
  có đền / kết thúc gói → I8 0 lệch; đột biến lệch một đồng → I8 bắt.
