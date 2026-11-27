# TOPPING-1 — kế hoạch (chờ chat duyệt)

Dựng trên main `acc8892` (HEAD nhánh `13a8e7b`). Mọi số dòng dưới đây đọc trong lượt này.

## 0. Tóm tắt bằng lời thường
Topping là **một món POS bình thường** có thêm cờ "là topping". Khi khách gọi "Trà Dưỡng Nhan + 2 phần nếp cẩm × 2 ly", máy chủ ghi
**hai dòng** vào đơn: dòng trà (2 ly) và ngay dưới là dòng nếp cẩm (4 phần) có ô trỏ về dòng trà. Vì nếp cẩm là một dòng hàng thật, các luật
sẵn có (giảm hạng, mã / voucher, điểm theo cờ của món, trừ kho, huỷ trả kho, báo cáo) **tự chạy đúng** mà không viết đường tiền mới. Phần
phải viết thêm là: kiểm topping hợp lệ + tự tra giá, và chỗ vẽ (giỏ, hoá đơn, tem, App) gom dòng topping vào dưới dòng món.

## 1. Code thật đã đọc (căn cứ)
| Vùng | File:dòng | Điều rút ra |
|---|---|---|
| Vòng món tạo đơn | `server/routes/orders.js:400-501` | tra `pos_products` theo khoá SX / id, giá = `product.price`, đẩy `orderItems` (cờ `tich_diem` theo món). Chỗ cắm topping. |
| Flash | `orders.js:594-618` | giảm theo khoá `${sx_product_type}_${sx_product_id}` của TỪNG dòng có trong `flash_product_keys`. |
| Mã / voucher chỉ món thường | `orders.js:637-638` (`khongGiam`, `tienMonThuong`) | dòng không phải gói / thẻ / nạp đều vào tiền tính mã → dòng topping tự vào. |
| Giảm hạng | `orders.js:740-762` | `tiLeHang` gán cho MỌI dòng không phải gói / thẻ / nạp theo `is_special_group` của dòng. |
| Voucher theo nhóm món | `orders.js:1446-1451` (`kiemVoucherDon`, `dong = mon.filter(khop…)`) | khớp theo khoá món của dòng — dòng topping KHÔNG thuộc nhóm của ly. |
| Điểm | `orders.js:1013` `tienHangDiem(orderItems…)` | theo cờ `tich_diem` từng dòng (DIEM-MON-1). |
| Ghi dòng đơn | `orders.js:1113-1123` | INSERT từng dòng, chưa giữ id dòng. |
| Trừ kho | `orders.js:1127` → `server/kho/banHang.js:99-120` `truKhoDon` → `canCuaItems:51-66` | gộp theo sản phẩm trên CẢ danh sách → nhiều dòng cùng topping tự cộng dồn. Món `lam_san` trừ lô FEFO. |
| Giữ hàng phiên chờ trả | `server/utils/giuCho.js:87-89` (taoDon `chiTinh` trước) và `:124` `kiemDuHang(tx, don.items)` trên **thân thô**; `banHang.js:36-41` đọc thân phiên khác cũng qua `canCuaItems` | nếu topping gửi lồng trong dòng món thì `canCuaItems` phải mở lồng — MỘT chỗ cho cả giữ hàng, phiên khác đang giữ, và tạo đơn. |
| Huỷ đơn trả kho | `banHang.js:122-130` `huyPhieuBan` | huỷ CẢ phiếu bán của đơn → topping về lô tự động. |
| Huỷ — gói giao | `orders.js:1797-1803` | đếm dòng `product_id > 0` giá 0 — dòng topping có giá → không lẫn. |
| Đã trả từng dòng | `server/utils/tienDaTra.js:16-36` | chia theo dòng; damages.js:199 gọi với `chanTren = true` rồi lọc theo `product_code`. |
| Báo sự cố | `server/routes/damages.js:182-208` | trần đền theo dòng cùng mã. |
| Hoá đơn | `server/routes/hoaDon.js:101,128-135` → `client/src/utils/hoaDon.js:241-242` → `InvoicePreview.jsx:691`; App: `server/utils/dongHoaDon.js` | `mon[]` dẹt, mỗi dòng "sl x tên". |
| Tem / pha chế | `client/src/utils/inPhieu.js:112-127,131` | mỗi đơn vị của MỖI dòng một tem → dòng topping sẽ thành tem rời nếu không sửa. |
| Menu quầy + App | `server/routes/products.js:37-60` `layMenuQuay`; `server/routes/kh/index.js:40-46` `monKhach` | trả mọi `pos_products` đang bán. |
| Đơn App | `server/utils/donApp.js:63-66` `bamGio`, `:110-131` `docGio`, `:152-168` `dungItems`, `:211-224` `baoGia` ghép `monCt[j]` theo THỨ TỰ, `:388` đếm `SUM(quantity)`, `:424-430` `chiTietDon` | ba chỗ ghép / đếm theo thứ tự dòng — dòng topping làm lệch (đường song song K4). |
| Quầy | `client/src/pages/BanHang/BanHangMoi.jsx:179` (`mayChu.items.length === gio.length`), `:192-213` chạm món / gộp dòng, `:337-381` tab; `KhungChonMon.jsx` (42 dòng); `tinh.js:149-153` `viTriMayChu`, `:169` `thanTinhThu`; `ghiChuMacDinh.js` | khung luôn mở (DU_PHONG cho mọi nhóm khác tea / juice). |
| Tạo món POS | `products.js:72-93` | món tạo ở POS có khoá (`'pos'`, id) → Flash, kho, App chạy theo khoá đó. |

## 2. Dữ liệu (B1, B2) — bước `server/nang_cap/036_topping.js`
**A (chọn):** chỉ THÊM cột, không bảng mới.
- `pos_products`: `la_topping INTEGER DEFAULT 0`, `gia_ban_rieng INTEGER` (NULL = không bán riêng), `ghi_chu_nhanh TEXT` (mảng JSON chữ, theo thứ
  tự), `topping_cho_mon TEXT` (mảng JSON id topping được thêm vào món này). `price` sẵn có = **giá thêm vào ly** (bắt buộc > 0 — vị từ "có giá"
  sẵn có, `/price` và màn giá chạy nguyên).
- `pos_order_items`: `dong_cha_id INTEGER` (id dòng món cha; NULL = dòng thường), `so_phan INTEGER` (phần / ly). Dòng topping: `quantity =
  so_phan × số ly của cha`.
- Chép ghi chú: món đang bán `category = 'tea'` → `["Ít đá","Không đá","Ít ngọt","Nóng"]`, `'juice'` → `["Ít đá","Không đá","Không đường"]`,
  chỉ khi `ghi_chu_nhanh IS NULL` (chạy lại không đè). Xem Q6 về nhóm khác.
- Sao lưu: `pos_products`, `pos_order_items` đã trong `BACKUP_TABLES` (`backup.js:62-65`) → cột mới đi theo; bước 4 thêm ca thử sao lưu–khôi phục giữ
  cột mới (nếu khôi phục kê cột cứng thì sửa `backup.js` — trong Phạm vi).
- ~45 dòng. Rủi ro: JSON hỏng → đọc an toàn (`[]`), id topping đã ngừng bán / bỏ cờ → lọc lúc đọc.

**B:** bảng `pos_mon_topping (mon_id, topping_id, thu_tu)` + bảng `pos_mon_ghi_chu`. ~70 dòng + 2 bảng vào sao lưu + JOIN ở menu. Chặt hơn về
toàn vẹn nhưng nhiều dòng hơn, không đạt thêm ca nghiệm thu nào → không chọn.

## 3. Máy chủ (D1–D4)
### 3.1 Dạng gửi lên (một dạng cho quầy và App)
Dòng món: `{ product_id | sx_product_type+sx_product_id, quantity, note, topping: [{ product_id | sx_product_type+sx_product_id, so_phan }] }`.
Topping bán riêng: một dòng món bình thường trỏ vào sản phẩm topping (không `topping`). Không gửi giá; có gửi thì bỏ qua (§5.1).

### 3.2 D1 — dòng con trong `pos_order_items` (chọn) vs JSON trên dòng món
| | A: dòng con (chọn) | B: JSON trên dòng món |
|---|---|---|
| Giảm hạng | tự đúng (`orders.js:750`) | phải cộng giá topping vào giá dòng → giá ly gộp |
| Mã / voucher % | tự đúng (`tienMonThuong`) | tự đúng (giá gộp) |
| Điểm theo cờ topping (D3) | tự đúng (`tich_diem` từng dòng) | **sai**: theo cờ của ly — phải viết đường riêng |
| Flash | theo khoá topping (Q2) | theo khoá ly — không đổi được |
| Kho | tự đúng ở `truKhoDon` (gộp theo sản phẩm) | phải mở JSON ở mọi chỗ đọc dòng |
| Báo cáo bán theo món | topping hiện như món | mất |
| Phải sửa thêm | vẽ hoá đơn / tem / App gom dòng con; ghép vị trí dòng tinh-thu | vẽ hoá đơn / tem phải mở JSON |
→ A: ít đường song song nhất cho tiền / kho; phần phải sửa thêm chỉ là HIỂN THỊ.

### 3.3 File mới `server/utils/topping.js` (~90 dòng) — MỘT chỗ luật topping
- `TOPPING_TOI_DA_PHAN = 3` (hằng có tên, trả ra menu để quầy / App không viết số cứng).
- `docDs(json)` → mảng an toàn.
- `dongTopping(cha, ds, sl, tra)` → các dòng `orderItems` con hoặc lỗi 400:
  - mỗi phần tử: tra sản phẩm (CÙNG câu tra của vòng món — `is_active = 1`); không có / không `la_topping` / không nằm trong `topping_cho_mon` của
    cha → `TOPPING_KHONG_CHO_MON`; `so_phan` không nguyên / ≤ 0 / > 3, hoặc một topping lặp hai lần trong cùng dòng → `TOPPING_SO_PHAN`;
    `topping` không phải mảng hoặc dài hơn danh sách của món → `YEU_CAU_KHONG_HOP_LE` (mã sẵn có).
  - dòng con: `unit_price = topping.price` (giá DB), `quantity = so_phan × sl`, `tich_diem = batDiem(topping)`, `is_special_group` của topping,
    `so_phan`, `cha` = chỉ số dòng cha trong `orderItems`, `note = null`, khoá SX của topping.
- Hết hàng / ngừng bán: ngừng bán → không tra ra → `TOPPING_KHONG_CHO_MON`? **Không** — dùng đúng mã sẵn có: tra không ra = "Sản phẩm không tồn tại
  hoặc đã ngừng bán" như món (`orders.js:412-415`); hết lô → `HET_HANG` của kho (`banHang.js:72`) — D2 "dùng mã hết hàng có sẵn".

### 3.4 `orders.js` (~30 dòng)
- Vòng món (`:486`): sau khi đẩy dòng món → nếu `item.topping` có → `dongTopping(...)`; lỗi → 400. Đẩy các dòng con NGAY sau dòng cha.
- Dòng món mà sản phẩm là topping (`la_topping = 1`) không có cha → bán riêng: `gia_ban_rieng > 0` thì `unit_price = gia_ban_rieng`, ngược lại 400
  `TOPPING_KHONG_BAN_RIENG`. Món thường: không đổi một chữ (K5).
- Dòng cha là topping mà lại gửi `topping` → `TOPPING_KHONG_CHO_MON` (danh sách của topping rỗng — cùng phép).
- Voucher theo nhóm (`:1451`): dòng con nhận khớp của dòng cha (Q3) — một vế `|| (it.cha != null && khop(orderItems[it.cha]))`.
- INSERT (`:1113-1123`): giữ `lastInsertRowid` của dòng cha; dòng con ghi `dong_cha_id`, `so_phan`.
- `chiTiet.items` của tinh-thu (`:977-978`): thêm `cha`, `so_phan` — để quầy / App ghép (không đổi trường cũ).
- Không đụng: Flash (`:594`), hạng (`:740`), `khongGiam`, `kiemVoucherDon` ngoài một vế trên, điểm, tổng.

### 3.5 Kho `server/kho/banHang.js` (~6 dòng)
`canCuaItems`: với mỗi dòng có `topping` (thân thô của phiên / tinh), cộng thêm `{ topping, quantity: so_phan × sl }` qua cùng `timMon`.
`orderItems` đã là dòng dẹt (không mang `topping`; `truKhoDon:100` chỉ chép `product_id, quantity`) → không đếm hai lần. Một chỗ cho: giữ hàng
(`giuCho.js:124`), phần đang giữ của phiên khác (`banHang.js:36-41`), trừ kho lúc tạo đơn, chốt phiên.

### 3.6 Hoàn / sự cố (D4 — rà MỌI đường)
| Đường | Kết quả với thiết kế A | Sửa |
|---|---|---|
| Huỷ đơn `PUT /:id/cancel` | hoàn ví theo tổng đơn (gồm topping); `huyPhieuBan` trả cả topping về lô | không |
| Xoá đơn `DELETE /:id` (`:1859`, `:1943` xoá dòng) | như huỷ | không |
| Duyệt hoàn `refunds.js` → `soTienHoan` | theo tổng đơn | không |
| Đổi cách trả (phiên) | không đụng dòng | không |
| Báo sự cố / đền (`damages.js:199`) | trần theo dòng cùng mã → ly có topping bị **thiếu** phần topping | `tienDaTra.js`: khi `chanTren`, cộng `da_tra` của dòng con vào dòng cha và bỏ dòng con khỏi danh sách (~8 dòng) → đền một ly kéo theo topping của ly đó. Topping bán riêng (không cha) đền như món. |
| Đối soát (`doiSoat.js:143,385`) | lọc theo `product_id < 0` — dòng topping > 0 | không |
| Điểm khi hoàn (`diemThat.js:86`) | theo cờ từng dòng | không |
| Gói giao huỷ (`orders.js:1801`) | dòng giá 0 — topping có giá | không |

### 3.7 Menu + App KH (D5)
- `layMenuQuay` (`products.js:44`): thêm `la_topping`, `gia_ban_rieng`, `ghi_chu_nhanh[]`, `topping[]` (id topping đang bán, còn cờ) — quầy dùng.
- `kh/index.js monKhach`: món thường thêm `topping: [{ ma, ten, gia, gia_hang, con_hang }]` (gia = giá thêm; `gia_hang` cùng hàm `giaCacHang`) và
  `ghi_chu_nhanh: [...]`; sản phẩm topping KHÔNG hiện như món, trừ topping có giá bán riêng: hiện với `gia = gia_ban_rieng`, `nhom: 'topping'`.
  Thêm `topping_toi_da_phan` ở cấp menu.
- `donApp.js`: `docGio` nhận `topping: [{ ma, so_phan }]` (danh sách trắng khoá); `bamGio` thêm phần topping CHỈ khi có (giỏ không topping băm y cũ
  — khoá gửi đang sống không lệch, K5); `dungItems` dịch `ma` → khoá SX và cộng topping vào `can` để báo `HET_HANG` sớm; `baoGia` ghép `monCt`
  chỉ dòng `cha == null`, dòng App mang `topping: [{ ma, so_phan, don_gia, thanh_tien }]`, `thanh_tien` của dòng món GIỮ nghĩa cũ (chỉ ly) + thêm
  `thanh_tien_ca_topping`; `tomTatDonThat:388` đếm `n` chỉ dòng `dong_cha_id IS NULL`; `chiTietDon` gom dòng con vào `topping` của dòng cha.
- `HOP_DONG_API_KH.md`: thêm trường, tăng `PHIEN_BAN` (số kế tiếp của main lúc gộp), ghi nhật ký; `viec/TOPPING-1/BAO_APPKH.md` lời thường.
- App bản cũ không gửi `topping` → đơn như cũ (ca K5).

## 4. Quầy (C1–C4) + cài đặt (B3)
- `ghiChuMacDinh.js`: bỏ; `tinh.js:6` bỏ export lại.
- `tinh.js` (~25): `coTuyChon(sp)` = có topping hoặc ghi chú; khoá gộp dòng = món + topping (sắp xếp) + ghi chú; giá một ly hiển thị (món + Σ
  topping, mỗi phần giá hạng) — CHỈ để hiện trước khi có số máy chủ; `thanTinhThu` gửi `topping`; `viTriMayChu` bỏ qua dòng `cha`.
- `KhungChonMon.jsx` (+~60): ô topping (chữ viết tắt màu — chưa ảnh, ANH-MON-1), chạm = +1 phần, nút −, tối đa `topping_toi_da_phan`, hết mờ,
  còn < 5 "còn n" (tồn trừ phần đã có trong giỏ — một hàm như bản thử `tpCanTrongGio`), ghi chú nhanh của món, ô tự gõ, số ly.
- `BanHangMoi.jsx` (+~35; đang 502 dòng → tách phần giỏ con / tab Topping sang `ToppingGio.jsx` nếu vượt): món không tuỳ chọn chạm là vào giỏ;
  lưới ẩn sản phẩm `la_topping`; tab "Topping" (chỉ topping có giá bán riêng); dòng giỏ có dòng con "+ tên ×phần giá".
- Hoá đơn / tem (Q1 — ngoài Phạm vi hiện tại): `routes/hoaDon.js` `mon[]` thêm `topping_cua` (chỉ số dòng cha) + `so_phan`; `utils/hoaDon.js` vẽ
  "+ <topping> x<phần>" dưới món, giá theo cùng cách giá hạng của món; `InvoicePreview.jsx:691` không in "sl x" cho dòng topping;
  `utils/inPhieu.js` dòng topping không thành tem / dòng pha chế riêng mà ghép vào tem + phiếu pha chế của ly cha; `dongHoaDon.js` (App) giữ thứ tự.
- Cài đặt (B3) ở Kho › Sản phẩm: `Kho/SanPham.jsx` thêm kiểu "Topping" (cờ + giá bán riêng) và nút mở `Kho/ToppingMon.jsx` (mới, ~120): tick topping
  cho món, sửa ghi chú nhanh, "Chép cho cả nhóm". Máy chủ: `PUT /api/pos/products/:id` (`products.js:95`) nhận thêm `la_topping`, `gia_ban_rieng`,
  `ghi_chu_nhanh`, `topping_cho_mon` (kiểm: mảng chữ ≤ 30 ký tự, ≤ 12 mục; id topping phải là topping đang bán); `POST /api/pos/products/:id/chep-nhom`
  (một giao dịch). Quyền `manage_settings` như sửa món hiện có. `api.js` thêm hai lời gọi.

## 5. Bản mẫu (A0)
`ban_mau_pos/ban_mau_pos.html`: chép hành vi bản thử (khung topping, dòng con giỏ, tab Topping, hoá đơn / tem); `ban_mau_pos/thu/thu_topping.js`
~20 phép (khung mở / không mở, tối đa 3, hết mờ, "còn n", gộp / tách dòng, tab Topping chỉ món có giá riêng, hoá đơn + tem có dòng topping);
nối vào `chay_thu.sh`; ghi số phép trước (119) / sau. `DAC_TA_BAN_HANG_2410.md` mục 7–8: thêm bán riêng, voucher áp topping, sửa "kho SX" → "kho POS".

## 6. Ngân sách
| Phần | Dòng |
|---|---|
| máy chủ: 036 (45) · topping.js (90) · orders.js (30) · banHang.js (6) · tienDaTra.js (8) · products.js (45) · kh/index.js (15) · donApp.js (35) | ~275 |
| hiển thị máy chủ (Q1): hoaDon.js (8) | ~8 |
| quầy: tinh.js (25) · KhungChonMon (60) · BanHangMoi (35) · ToppingMon.jsx (120) · SanPham.jsx (20) · api.js (5) · hoaDon.js/inPhieu.js/InvoicePreview (Q1, 30) | ~295 |
| bài thử `thu_TOPPING1.js` | ~450 |
| bản mẫu html + `thu_topping.js` | ~250 (bản vẽ, không tính vào code) |
Code ~580 / 600 — trong ngân sách.

## 7. Ca thử ↔ nghiệm thu (`cong_cu/thu_TOPPING1.js`, kho thử thật như thu_VOUCHER2 / thu_KHO3a; đỏ trên main vì chưa có cột / route)
| Mục | Ca |
|---|---|
| A0 | `bash ban_mau_pos/chay_thu.sh` ≥ 119 + phép mới, 0 hỏng |
| B1 | T01 tạo topping (cờ, giá thêm, giá bán riêng trống / có) qua PUT; T02 menu trả `la_topping`, `gia_ban_rieng` |
| B2 | T03 nâng cấp 036 chép THEO_NHOM cho tea / juice, chạy hai lần không đè, món có sẵn ghi chú không đổi; T04 sao lưu → khôi phục giữ cột mới |
| B3 | T05 PUT topping_cho_mon id không phải topping → 400; T06 chép cho cả nhóm đúng số món; T07 nhân viên không quyền → 403 |
| C1–C3 | phép trong `thu_topping.js` (bản mẫu) + `npm run build` + `--day-du`; T08 hàm thuần `tinh.js` (khoá gộp, viTriMayChu bỏ dòng con, thanTinhThu mang topping) |
| C4 | T09 hoá đơn (`dungHoaDon` + `utils/hoaDon.js`) có "+ Nếp cẩm x2" dưới món, giá hạng; T10 tem: số tem = số ly (không tem topping), tem có dòng topping + ghi chú; T11 in lại đơn cũ không topping y như cũ |
| D1 | T12 1 ly + 2 phần nếp cẩm × 2 ly: subtotal = tính tay; dòng con `dong_cha_id`, `so_phan = 2`, `quantity = 4` |
| D1 §5.1 | T13 gửi `unit_price` sai cho món và topping → máy chủ dùng giá DB |
| D2 | T14 `TOPPING_KHONG_CHO_MON` (ngoài danh sách; topping lồng topping); T15 `TOPPING_SO_PHAN` (0, 4, 1.5, lặp) + ca biên 3 qua; T16 `TOPPING_KHONG_BAN_RIENG`; T17 topping ngừng bán → "đã ngừng bán", hết lô → `HET_HANG` |
| D3 | T18 khách Vàng 10 % — giá lẻ (vd 7.500đ) làm tròn từng dòng, so số tính tay; T19 voucher 20.000đ + voucher 10 % trên đơn có topping (tính tay); T20 mã giảm %; T21 voucher theo nhóm: topping theo ly (Q3); T22 Flash: topping trong danh sách flash giảm, ngoài danh sách không (Q2) + đơn flash không giảm hạng như cũ; T23 điểm: topping cờ tắt → điểm chỉ trên ly; cờ bật → cả topping |
| D4 | T24 hai dòng cùng topping, tổng = tồn + 1 → `HET_HANG`; = tồn → qua (ngay trên / ngay dưới); T25 giữ hàng phiên (giuCho) đếm topping: phiên A giữ hết → phiên B / đơn quầy bị chặn; T26 trừ kho topping cùng phiếu bán; T27 huỷ đơn trả kho topping; T28 báo sự cố "Hoàn tiền" 1 ly có topping: trần gồm topping; T29 topping bán riêng 2 phần: giá bán riêng, kho trừ 2 |
| D5 | T30 `/api/kh/menu` có `topping[]`, `ghi_chu_nhanh[]`, topping hết `con_hang: false`, topping không bán riêng không hiện như món, có bán riêng hiện `nhom: 'topping'`; T31 đơn App có topping = đơn quầy cùng giỏ (cùng tổng, cùng dòng); T32 báo giá App ghép đúng giá từng dòng khi có topping; T33 App gửi topping ngoài danh sách → lỗi; T34 `bamGio` giỏ không topping = băm cũ; T35 lịch sử App: `n` không đếm topping |
| Hai người cùng bấm | T36 hai đơn cùng lúc tranh phần topping cuối (`Promise.all`) → một đơn qua, một `HET_HANG` (như ca tranh của thu_KHO3a) |

**Luồng hợp lệ phải KHÔNG bị chặn (K5):** đơn không topping (chạy lại thu_P26c, thu_VOUCHER2, thu_DIEMMON1, thu_KHO3a, thu_UUDAI1, thu_gia_lap, thu_HD1,
thu_KHAPI2/3 — xanh như cũ); món không cài gì chạm là vào giỏ (bản mẫu); đơn cũ không dòng topping in lại / huỷ / hoàn (T11, T27 đối chứng); App
bản cũ không `topping` (T31 đối chứng); ly lấy từ gói + topping trả tiền (T37); topping bán riêng có giá (T29).

**Đột biến (`viec/TOPPING-1/dot_bien.py`, mỗi cái một dòng, có đối chứng xanh):** VS-tin-gia-topping-cua-man · VS-bo-giam-hang-topping ·
VS-voucher-bo-topping · VS-topping-ngoai-danh-sach-lot · VS-qua-3-phan-lot · VS-kho-dem-tung-dong · VS-huy-khong-tra-topping ·
VS-ban-rieng-khi-khong-gia · BV-bo-kiem-topping-app · thêm VS-bao-gia-app-lech-dong · VS-den-bo-topping · VS-bam-gio-doi-khi-khong-topping.

## 8. Câu hỏi cho chat (máy đề xuất — chat chỉ cần xác nhận)
- **Q1 · Phạm vi.** C4 (hoá đơn / tem / phiếu pha chế) không làm được trong Phạm vi hiện tại: bill vẽ ở `server/routes/hoaDon.js` →
  `client/src/utils/hoaDon.js` → `client/src/components/InvoicePreview.jsx`; tem + pha chế ở `client/src/utils/inPhieu.js`. **Đề xuất:** thêm 4 file
  này vào `## Phạm vi` (bài thử của chúng `thu_HD1.js`, `thu_P16.js` đã nằm trong `cong_cu/thu_*.js`). `damages.js` KHÔNG cần (sửa ở `tienDaTra.js`).
- **Q2 · Flash.** Luật Flash hiện có giảm theo khoá TỪNG món trong danh sách Flash (`orders.js:594-616`). **Đề xuất:** topping là một món — được
  giảm Flash khi chủ quán tick topping vào danh sách Flash; ly trong Flash không tự kéo topping theo. Đơn dính Flash vẫn không giảm hạng, 0 điểm (như cũ).
- **Q3 · Voucher theo nhóm món.** **Đề xuất:** voucher áp cho nhóm "Trà" giảm cả topping của ly trà đó (dòng topping theo ly cha). Voucher "giảm 1
  món" (`discount_scope = 'item'`) giữ nguyên: chỉ giảm giá một ly, không kèm topping.
- **Q4 · % hạng của topping.** **Đề xuất:** theo cờ "nhóm đặc biệt" của chính topping (mặc định tắt → % thường), không theo ly.
- **Q5 · Hoá đơn tách hay gộp giá.** Bản thử: dòng món in giá ly, dòng "+ topping" in giá riêng (`ban_thu_topping.html:219-220`). Giỏ: dòng món in giá
  gồm topping (`:176`). **Đề xuất:** làm đúng như bản thử ở cả hai chỗ.
- **Q6 · Ghi chú cho món nhóm khác.** Hôm nay món không thuộc 'tea' / 'juice' vẫn có nút `Ít đá / Không đá / Ít đường / Không đường` (`ghiChuMacDinh.js:9`).
  Phiếu chỉ chép cho tea / juice → các món đó sẽ MẤT nút ngày đầu (K5). **Đề xuất:** bước 036 chép danh sách dự phòng này cho món nhóm khác (trừ
  sản phẩm topping); chủ quán xoá ở màn cài đặt món nào không cần.
- **Phát hiện (không hỏi):** NHOM-MON-1 chưa có ở `acc8892`; máy không fetch được main (người gác) — xem `trang_thai.md`.

## 9. Thứ tự làm sau khi duyệt
1. Bản mẫu + `thu_topping.js` → `chay_thu.sh`. 2. `thu_TOPPING1.js` chạy trên gốc → ĐỎ, ghi `bang_chung_do.txt`. 3. 036 + topping.js + orders.js +
banHang.js + tienDaTra.js. 4. products.js + kh/index.js + donApp.js + hợp đồng. 5. Quầy + cài đặt + hoá đơn / tem; `npm run build`. 6. `npm test`,
`--day-du`, đột biến, `/ra-soat`, `/soat-bao-mat`, `cong.js chay`. Commit từng file, push sau mỗi bước.

## 10. Soát kế hoạch (agent phụ chỉ đọc, 26.11) — đã nhận, kế hoạch đổi như sau
**Gọn hơn (nhận):** bỏ cột `so_phan` (suy ra = `quantity` dòng con ÷ `quantity` dòng cha — bước 036 chỉ thêm `dong_cha_id`); bỏ
`thanh_tien_ca_topping` của App (App cộng từ `topping[]`, mỗi phần tử có `thanh_tien` do máy chủ tính). Giữ `POST /chep-nhom` (một giao dịch).

**Đường song song thêm vào kế hoạch (trong Phạm vi):**
- `server/utils/manKhach.js:110-112` (menu màn khách ẩn sản phẩm topping trừ bán riêng) và `:126-129` (dòng `ct.items` gom dòng con dưới ly).
- `server/utils/donApp.js:137, 369, 467-471` (`mon` / `so_mon` từ `than.dong` — mang `topping`, đếm ly không đếm topping), ngoài `:388`, `:424`.
- `server/utils/giaoHang.js:506-510` `soMon` chỉ đếm dòng `dong_cha_id IS NULL` (giờ gọi tài xế không lệch).
- `orders.js:85` `item_count` chỉ đếm dòng không cha.
- `orders.js` vòng món: dòng con LUÔN `from_package: false` (`:511`, `:1142` đếm lượt gói theo cờ này) — ly lấy từ gói + topping vẫn trả tiền topping (T37).
- `server/routes/hoaDon.js:110-111` `phanTramHang`: chỉ xét dòng không cha (topping khác % / làm tròn lẻ không làm mất % trên bill) — nằm trong Q1.
- `client/src/utils/inPhieu.js` đọc CẢ hai dạng: đơn vừa tạo (`items` có `cha` = chỉ số, `orders.js:1374`) và đơn in lại (dòng DB có `dong_cha_id`, `orders.js:164`).

**Ca thử thêm vào §7:** T38 xoá đơn `DELETE` trả kho topping; T39 duyệt hoàn (`refunds.js` → `soTienHoan`) đơn có topping = tổng đơn; T40 đổi cách
trả phiên có topping; T41 đối soát ngày có đơn topping không lệch; T42 mã giảm TIỀN cố định trên đơn có topping; T43 voucher "giảm 1 món" không
kéo topping; T44 phiếu pha chế có topping; T45 hoá đơn App (`dongHoaDon.detTo`) đơn có thẻ hạng + topping: dòng thẻ đúng vị trí; T46 màn khách
(`manKhach`) gom topping; T47 đơn giao: `soMon` không đếm topping; T48 quản lý (không `manage_settings`) xem được, không sửa được; T49 App: topping
hết → `HET_HANG`, topping không bán riêng gửi một mình → lỗi; T50 menu App có `gia_hang` topping + `topping_toi_da_phan`; `cong_cu/thu_HOPDONG_KH.js`
cập nhật danh sách trường (luật §6.7). C2 trên mã thật: khoá bằng hàm thuần `tinh.js` (giá hạng ô topping, "còn n", hết, khoá gộp) — T08 mở rộng;
phần vẽ chỉ bản mẫu + 3 thao tác thử tay. Cuối việc: `node tu_chay/cong.js chay` + 3 thao tác cho chủ quán (ghi ở `trang_thai.md`).

**Câu hỏi thêm cho chat:**
- **Q1 (mở rộng).** Ngoài 4 file ở Q1, còn ngoài Phạm vi: `client/src/pages/DonApp.jsx:93` (nhân viên pha không thấy topping đơn App — PHẢI sửa),
  `client/src/pages/Orders.jsx:802, 1227, 271-279` (Lịch sử đơn: chi tiết dẹt; hộp báo sự cố cho chọn dòng topping con; số đền gợi ý không gồm topping —
  PHẢI sửa), `client/src/components/InvoicePrint.jsx:178` (bản in dự phòng khi tải hoá đơn hỏng — PHẢI sửa), `server/routes/damages.js` (xem Q7).
  Lỗi nhẹ, đề xuất để việc sau (ghi Phát hiện): `client/src/pages/GiaoHang/index.jsx:163` (thẻ giao in topping thành dòng rời),
  `server/routes/quang-cao.js:104` (cho chọn topping làm món quảng cáo), `server/routes/reports.js:81` (`item_count` đếm cả topping).
  **Đề xuất:** thêm vào Phạm vi: `server/routes/hoaDon.js`, `client/src/utils/hoaDon.js`, `client/src/components/InvoicePreview.jsx`,
  `client/src/components/InvoicePrint.jsx`, `client/src/utils/inPhieu.js`, `client/src/pages/DonApp.jsx`, `client/src/pages/Orders.jsx`, `server/routes/damages.js`.
- **Q7 · Đền một ly có topping (đổi đề xuất ở §3.6).** Gộp topping vào ly trong `tienDaTra.js` làm điểm bị trừ theo cờ của ly (`diemThat.js:86-90`
  gắn điểm theo `product_code` của dòng sự cố) và trần số lượng ở `damages.js:184-190` cộng chung topping bán riêng với topping trong ly. **Đề xuất:**
  báo sự cố chỉ chọn LY (dòng không cha) và topping bán riêng; dòng topping con không chọn riêng được (`damages.js` trả `TOPPING_BAO_THEO_LY`); đền
  một ly: trần tiền = đã trả của ly + topping của chính ly đó; điểm trừ chia theo đúng phần ly / phần topping, mỗi phần theo cờ tích điểm của nó
  (sửa `diemThat.js` — trong Phạm vi). Đây là luật tiền / điểm → chờ chat xác nhận.
