# KHO-1 — Kho trong POS, phần 1: dữ liệu kho, nâng cấp dữ liệu đánh số, nhập danh mục từ SX, màn Nguyên liệu & Sản phẩm–công thức

<!-- Phiếu do chat soạn 27.10.2026. Việc [T] (kho) — Opus, máy lập kế hoạch, dừng chờ duyệt. Nền: main sau sổ v42 (cha 40e07ce).
     Chủ quán chốt 26–27.10: BỎ app SX, mọi thứ về POS (nhập nguyên liệu → pha chế / sản xuất → thành phẩm → bán). Khai trương T7
     07.11 CHỈ khi mọi việc trong LICH_KHAI_TRUONG.md xong hết (không khai trương với phần làm dở). Việc này là NỀN: bán hàng vẫn trừ kho qua SX
     tới KHO-3 — KHÔNG đổi nguồn menu, KHÔNG đụng đường bán.
     Demo chủ quán đã duyệt (máy không mở được link, quyết định đã chép vào phiếu): kho claude.ai/artifact/J4ayQU7LUgEh5ZfGCRBzhp,
     sắp xếp POS claude.ai/artifact/YFnr4dnAhVDXUDuPHCt2Rq. Chạy SONG SONG: UUDAI-1 (orders.js, Sales.jsx), HD-1 (hoá đơn), BH-2
     (màn bán hàng + menu 6 mục: Bán hàng · Hôm nay · Đơn hàng · Khách hàng · Kho · Quản lý) — giữ đúng Cấm để gộp không đụng nhau.
     Dữ liệu SX (bản sao lưu 09.10, chat đã đọc): 41 nguyên liệu → 32 sau gộp (chủ quán 28.10, xem "Dữ liệu SX thật"); nhiều giá = 0, chưa có tối thiểu / hạn; 9 công thức:
     6 nước thực dưỡng (Hồng Tân Sinh, Lục Tân Khí, Thanh Tân Dưỡng, Tĩnh Nguyên Thủy, Ôn Dương Lộ, Tâm Vệ Lộ — kg cho 1 phần 200 ml)
     + 3 trà gói (Dưỡng Nhan Lộ, Ngọc Thanh Lộ, An Mi Lộ — cho 1 gói). Cấu trúc SX (server.js của kho tuquyduong/Quan-Ly-San-Xuat):
     ingredients, product_types, sx_products (+ legacy_table/legacy_id trỏ recipes / tea_products), sx_product_ingredients,
     recipe_ingredients, tea_ingredients; POS nối món SX bằng (sx_product_type, sx_product_id) = unique_id `${type}_${id}`. -->

**Đã duyệt (chủ quán 28.10, sau khi chat soát `ke_hoach.md` đầu nhánh `cd69a8d` và đọc bản sao lưu SX thật 09.10):** kế hoạch duyệt nguyên (cả
phần "Vòng soát 1"); ngân sách máy chủ ~730 dòng chấp nhận. Máy làm tiếp từ bước 4 (`/lam-viec KHO-1 tiep`) tới hết, KHÔNG dừng hỏi lại các điểm
dưới; chỗ nào dưới đây khác `ke_hoach.md` thì làm theo phiếu.
1. **Cấu trúc SX:** dùng mục "Cấu trúc SX" và "Dữ liệu SX thật" bên dưới. KHÔNG xin đọc kho SX. Bài thử tự dựng file `.db` mẫu đúng cấu trúc + đủ
   các ca trùng tên ở bảng gộp. Ca "bản 09.10" ghi CHƯA KIỂM — chat chạy công cụ nhập trên file thật khi soát (file có dữ liệu khách, KHÔNG vào kho).
2. **Nâng cấp dữ liệu — chủ quán đặt yêu cầu an toàn tuyệt đối (không chạy đôi, không cộng thêm, không nửa chừng):**
   - mỗi bước MỘT giao dịch; câu ĐẦU TIÊN của giao dịch là `INSERT INTO pos_nang_cap(so, …)` (khoá chính = số bước) → hai máy chủ khởi động cùng
     lúc: máy sau đụng khoá → huỷ cả giao dịch, bỏ qua bước, KHÔNG chạy đôi. Thêm ca thử: hai bộ chạy song song trên cùng CSDL → mỗi bước đúng 1 lần.
   - bước hỏng → quầy VẪN MỞ, đường kho trả 503 `NANG_CAP_HONG` kèm tên bước (đúng đề xuất). KHO-3 xét lại khi bán trừ kho POS.
   - giữ nguyên: chỉ thêm; `themCot` tự chép bảng sao lưu; bài thử quét câu ALTER/DROP/DELETE/RENAME viết thẳng.
3. **Món SX chưa có dòng `pos_products`:** TẠO dòng `pos_products` với tên + nhóm (`category` = mã nhóm SX), `price = 0`, `is_active = 0` (ẨN, chưa
   bán), giữ khoá nối SX; bản xem trước ghi "Món <tên> đã tạo ẩn — đặt giá rồi bật bán". Đã đọc `products.js`: menu quầy chỉ cho bán khi `price > 0`,
   menu dự phòng chỉ lấy `is_active = 1` → món ẩn giá 0 không lên quầy (ca thử K5 khoá đúng điều này). `code` = mã SX (CT1, DNL, CF01…); trùng
   `code` đã có mà khác món → cảnh báo, bỏ qua. Món SX không có `legacy_id` (Cà Phê Đen) → `sx_product_id` để trống, chống trùng theo `code`.
   Bỏ qua món SX đã tắt (`is_active = 0`, vd "Test production owner").
4. **Khôi phục từ Excel:** bảng `kho_*` CHỈ khôi phục khi kho đang TRỐNG (`kho_phieu` và `kho_nguyen_lieu` đều 0 dòng — tức dựng lại máy mới sau sự
   cố); kho đang có dữ liệu → BỎ QUA (không xoá, không chèn), kết quả ghi rõ "bỏ qua bảng kho vì kho đang có dữ liệu". `pos_nang_cap` KHÔNG BAO
   GIỜ khôi phục. Xuất sao lưu vẫn đủ các bảng. Ca thử: kho có dữ liệu + file có trang `kho_*` → kho không đổi một dòng; kho trống → khôi phục đủ.
5. **Tên chính thức + nhóm nguyên liệu (chủ quán chốt 28.10):** dùng ĐÚNG bảng "Dữ liệu SX thật" bên dưới làm hằng số `BANG_TEN_CHINH_THUC` trong
   `nhapSx.js` (mọi tên SX → tên POS + nhóm), thay cho `BANG_GOP_TAY` của kế hoạch; tên SX không có trong bảng (bản sao lưu mới hơn) → chuẩn hoá
   (cắt dấu cách thừa, viết hoa chữ đầu, còn lại thường), nhóm theo `category` (`juice` → Rau củ quả, `tea` → Dược liệu), ghi cảnh báo "tên mới".
   Công thức trỏ tên bị gộp → trỏ tên chính thức; hai tên gộp cùng một công thức → cộng lượng + cảnh báo. Thuộc tính dòng gộp: giá = giá > 0 của
   bất kỳ tên trong nhóm gộp (lấy lớn nhất); đơn vị lưu `kg`; đơn vị hiện `g` cho nhóm Dược liệu, `kg` cho Rau củ quả; `sx_id` = id nhỏ nhất.
6. **Giá bất thường:** giá < 1.000 đ/kg coi như CHƯA CÓ GIÁ (lưu trống, vào ô "Thiếu thông tin", cảnh báo "giá SX 15đ/kg — có thể gõ thiếu số").

**Trả lời câu hỏi vòng 2 (chủ quán 28.10, đầu nhánh `b7e06fe`) — thay mục 3 phần Đã duyệt ở chỗ khác nhau:**
7. Câu 4 = **(a)**: món SX chưa có dòng `pos_products` → TẠO với `is_active = 1`, `price = 0` (đúng như seed / `sync-from-sx` đang làm), giữ tên +
   nhóm + khoá nối SX. Quầy hiện "Chưa có giá" (không bấm bán được); đặt giá ở màn Sản phẩm là bán được ngay. BỎ đường + nút "Bật bán"
   (`PUT /kho/san-pham/:id/bat-ban`) và cảnh báo `MON_TAO_AN`; lời xem trước đổi thành "Món <tên> đã tạo, chưa có giá — đặt giá là bán được".
   KHÔNG đụng `products.js` / `orders.js`. Ca thử: món tạo từ nhập → menu có món, `sellable: false`; đặt giá qua `PUT /products/price` →
   `sellable: true` VÀ `POST /orders` nhận (khoá bất biến "menu bán được thì tạo đơn nhận").
8. Câu 5: chủ quán CHƯA quyết → TẠM giữ như máy đang làm (giá nhập ẩn với mọi vai trò khác chủ quán / quản lý). Không chặn báo xong; ghi
   một dòng trong báo cáo: "đổi cho nhân viên thấy = sửa danh sách vai trò ở `duong.js` (một dòng) hoặc làm trong phân quyền chi tiết sau
   khai trương".
9. Đây là vòng sửa 3/3. Soát lần 3 ĐẠT → báo xong. KHÔNG ĐẠT → KHÔNG sửa thêm: ghi nguyên văn báo cáo vào `trang_thai.md`, push, DỪNG — chat
   soát thay.
**Chat soát thay sau soát lần 3 (28.10, đầu nhánh `c22221b`) — chủ quán quyết 2 câu, cho VÒNG SỬA 4:**
10. Món SX KHÔNG có khoá nối SX (`legacy_id` trống — bản 09.10 chỉ có Cà Phê Đen CF01): KHÔNG tạo dòng `pos_products`; xem trước ghi "Món
   <tên> chưa nối được với SX — thêm mới trong POS sau" (chủ quán 28.10: "nếu không được thì bỏ qua cho dễ, thêm mới trong POS sau").
   Nhóm sản phẩm của món đó vẫn nhập. Thay phần CF01 ở mục 3 và mục "Dữ liệu SX thật".
11. Món SX tạo mới ghi giá **NULL** (chưa có giá), KHÔNG ghi 0: cột `pos_products.price` cho phép NULL; menu SX (`typeof price === 'number'`) và
   màn bán mới (`BanHangMoi.jsx:186`) đều hiện "Chưa có giá"; tạo đơn từ chối. Ô "Thiếu thông tin" đếm món giá NULL. KHÔNG sửa
   `products.js`, `orders.js`, `BanHang/**` (món có sẵn giá 0 hiện "0đ" ở màn mới là lỗi CŨ — chat ghi cho BH-2).
12. Bài thử đi ĐÚNG đường màn thật: đặt giá qua `PUT /products/batch/prices` gửi CẢ danh sách menu dự phòng (có món tạo từ nhập) → 200, mọi
   món đổi giá, không món nào sót (không lỗi giữa chừng); giữ ca qua `PUT /products/price`. Bất biến K6 chạy sau CẢ HAI đường.
   Đột biến: tạo lại dòng cho món không khoá nối; ghi 0 thay NULL.
13. Bổ sung hồ sơ: dòng bắt buộc mục 8, kết quả `node tu_chay/cong.js chay`, mục CHƯA KIỂM của vòng 3–4, 1–3 thao tác thử tay cho chủ quán.
14. Xong: chạy bài thử, `--day-du`, toàn bộ đột biến, cổng, viết báo cáo 7 mục + dòng HEAD ĐÃ KIỂM, ghi "SOÁT LẦN 4: chat soát thay" — KHÔNG
   gọi agent soát nữa. Ca mới bắt LỖI THẬT ngoài 10–12 → không sửa, ghi Câu hỏi. Push, DỪNG.

## Dữ liệu SX thật (bản sao lưu 09.10 — chat đọc 28.10; `app_config.USE_UNIFIED_PRODUCTS = 'true'`)
41 tên nguyên liệu → **32** nguyên liệu POS. Gộp (id SX trong ngoặc; tên ghi đúng như SX, kể cả dấu cách thừa):
| Tên POS | Nhóm | Tên SX gộp vào |
|---|---|---|
| Củ dền | Rau củ quả | "Củ dền" (15, giá 65.000) · "Dền Đỏ" (3) — chủ quán: cùng một thứ |
| Gừng | Rau củ quả | "Gừng" (5) · "Gừng tươi" (33) |
| Táo đỏ | Dược liệu | "Táo đỏ" (34) · "Táo Đỏ" (51) · "Táo đỏ khô" (27) — "Táo tươi" (28) là thứ KHÁC |
| Trần bì | Dược liệu | "Trần bì" (39) · "Trần Bì " (53) · "Trần bì khô" (35) |
| Kỷ tử | Dược liệu | "Kỷ tử" (26) · "Kỳ Tử " (50) |
| Mẹ thuốc | Dược liệu | "Mẹ Thuốc" (47, giá 120.000) · "Mẹ Thuốc " (48) |
| Cẩu tích | Dược liệu | "Cẩu tích" (43) · "Cẩu Tích" (49) |

Không gộp, chỉ chuẩn tên:
- **Rau củ quả:** Bí đỏ (44) · Bông cải xanh (19) · Bạc hà (22) · Cam (1) · Cà rốt (40) · Cải bó xôi (6) · Cải xoăn (16) · Củ cải trắng (7) ·
  Dưa chuột (8) · Táo tươi (28)
- **Dược liệu:** Bạch truật chích mật (57) · Cam thảo (52) · Hoàng kỳ (32) · Hoắc hương (54) · Lạc tiên (58) · Mè đen rang (25, giá 15 → trống) ·
  Phục linh (56) · Sa nhân (55) · Thục địa chế (29) · Vông nem (59) · Ý dĩ (36) · Đương quy (46) · Đảng sâm (45) · Đỗ trọng nam (30) · Đỗ đen rang (24)
(Rau củ quả 12 · Dược liệu 20 = 32.) Nhóm nguyên liệu POS chỉ có 2: **Rau củ quả**, **Dược liệu** (chủ quán: chia theo loại cho dễ xem, không theo
món dùng).

Nhóm sản phẩm SX: `juice` "Nước ép" · `tea` "Trà thảo mộc" · `caphe` "CÀ PHÊ" (→ tên POS "Cà phê"; `quan_kho = 0`).
Món + công thức (gam / 1 phần 200 ml nước ép, / 1 gói trà) sau khi đổi về tên POS — bài thử của chat so đúng các số này:
- juice 1 Hồng Tân Sinh: Cam 70 · Củ dền 130 · Gừng 2 · Táo tươi 90 · Cà rốt 140
- juice 2 Lục Tân Khí: Gừng 1 · Cải bó xôi 100 · Củ cải trắng 60 · Dưa chuột 50 · Táo tươi 150
- juice 5 Thanh Tân Dưỡng: Gừng 3 · Dưa chuột 80 · Bông cải xanh 70 · Bạc hà 3 · Táo tươi 130
- juice 6 Tĩnh Nguyên Thủy: Đỗ đen rang 5 · Mè đen rang 3 · Kỷ tử 2,5 · Táo đỏ 9 · Táo tươi 50 · Thục địa chế 1,5
- juice 7 Ôn Dương Lộ: Gừng 1 · Kỷ tử 2,5 · Táo đỏ 9 · Đỗ trọng nam 5 · Hoàng kỳ 2,5 · Ý dĩ 5 · Trần bì 1
- juice 8 Tâm Vệ Lộ: Gừng 1 · Táo đỏ 5 · Táo tươi 50 · Hoàng kỳ 2,5 · Trần bì 1 · Cà rốt 50 · Cẩu tích 1 · Bí đỏ 50
- tea 1 Dưỡng Nhan Lộ: Đảng sâm 0,3 · Đương quy 0,3 · Mẹ thuốc 3,5 · Cẩu tích 0,5 · Táo đỏ 4,2 · Cam thảo 0,6 · Trần bì 0,5
- tea 2 Ngọc Thanh Lộ: Cam thảo · Hoắc hương · Sa nhân · Phục linh · Bạch truật chích mật — mỗi thứ 1 (chủ quán: số tạm, sửa sau trong POS)
- tea 3 An Mi Lộ: Lạc tiên 1 · Vông nem 1 (số tạm)
- caphe Cà Phê Đen (CF01, không `legacy_id`, chưa công thức) → kiểu `chua_dinh_luong`
- bỏ: juice 13 "Test production owner" (đã tắt). Số SX lưu dạng kg có sai số máy (0.004200000000000001) → lưu số làm tròn 6 chữ số sau dấu phẩy.

## Cấu trúc SX (chat chép 28.10 từ server.js SX d1e15d8, đối chiếu bản sao lưu thật 09.10)
```sql
CREATE TABLE ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, unit TEXT DEFAULT 'kg', display_unit TEXT DEFAULT 'kg',
  price REAL DEFAULT 0, stock REAL DEFAULT 0, min_stock REAL DEFAULT 0, track_inventory INTEGER DEFAULT 0,
  category TEXT DEFAULT 'juice' /* 'juice' | 'tea' | 'both' | mã khác */, shelf_life_days INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, days_use INTEGER DEFAULT 4, description TEXT,
  is_active INTEGER DEFAULT 1, updated_at TEXT);                                   -- nước ép (bảng cũ)
CREATE TABLE recipe_ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER NOT NULL, ingredient_id INTEGER NOT NULL, amount REAL NOT NULL);
CREATE TABLE tea_products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, description TEXT, default_interval INTEGER DEFAULT 30,
  unit TEXT DEFAULT 'gói', created_at TEXT, packages_per_cycle INTEGER DEFAULT 30, is_active INTEGER DEFAULT 1, updated_at TEXT);   -- trà gói (bảng cũ)
CREATE TABLE tea_ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, tea_product_id INTEGER NOT NULL, ingredient_id INTEGER NOT NULL, amount REAL NOT NULL);
CREATE TABLE product_types (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, icon TEXT DEFAULT '',
  code_prefix TEXT NOT NULL, fp_type TEXT NOT NULL, sales_mode TEXT NOT NULL DEFAULT 'make_to_stock', has_recipe INTEGER NOT NULL DEFAULT 1,
  deviation_mode TEXT NOT NULL DEFAULT 'exact', deviation_percent REAL DEFAULT 5, unit_internal TEXT DEFAULT 'kg', unit_display TEXT DEFAULT 'túi',
  conversion_ratio REAL DEFAULT 1, is_system INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER DEFAULT 0,
  created_at TEXT, quan_kho INTEGER NOT NULL DEFAULT 1, shelf_life_days INTEGER);  -- nhóm sản phẩm; 'juice' và 'tea' là nhóm hệ thống
CREATE TABLE sx_products (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, type_id INTEGER NOT NULL,
  description TEXT, days_use INTEGER, default_interval INTEGER, unit TEXT, is_active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER DEFAULT 0,
  legacy_table TEXT, legacy_id INTEGER, created_at TEXT, packages_per_cycle INTEGER DEFAULT 30, updated_at TEXT);   -- mô hình gộp (Đợt D)
CREATE TABLE sx_product_ingredients (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL /* sx_products.id */,
  ingredient_id INTEGER NOT NULL, amount REAL NOT NULL, unit_internal TEXT, note TEXT);  -- UNIQUE(product_id, ingredient_id)
-- app_config(key, value): key 'USE_UNIFIED_PRODUCTS' = 'true' → nguồn công thức là sx_products/sx_product_ingredients; khác → bảng cũ.
-- File sao lưu còn 4 VIEW tự chọn nguồn theo cờ đó: v_recipes(id,…), v_tea_products(id,…), v_recipe_ingredients(recipe_id, ingredient_id, amount),
-- v_tea_ingredients(tea_product_id, ingredient_id, amount) — id ở các view = id POS đang dùng.
```
**Khoá nối POS `(sx_product_type, sx_product_id)` — đúng như SX `/api/pos/products-with-stock` trả:**
- nước ép: `('juice', v_recipes.id)` · công thức: `v_recipe_ingredients` theo `recipe_id`.
- trà gói: `('tea', v_tea_products.id)` · công thức: `v_tea_ingredients` theo `tea_product_id`.
- nhóm khác (`product_types.code NOT IN ('juice','tea')`, `is_active = 1`): `(product_types.code, sx_products.legacy_id)` chỉ với `legacy_id IS NOT NULL`
  · công thức: `sx_product_ingredients` theo `product_id = sx_products.id` (KHÔNG phải legacy_id).
- Đọc qua view cho juice/tea (đúng nguồn theo cờ); file thiếu view hay thiếu bảng Đợt D → đọc bảng cũ và ghi cảnh báo, không đoán.
- `amount` theo đơn vị lưu của nguyên liệu (`ingredients.unit`, thường kg); nước ép = cho 1 phần 200 ml, trà = cho 1 gói. `price` = đồng / 1 đơn vị lưu.


## Mục tiêu
POS có danh mục kho của riêng mình — nguyên liệu, nhóm, nhà cung cấp, sản phẩm = công thức, định mức, lô, phiếu — nạp được danh
mục thật từ bản sao lưu SX, và chủ quán xem / sửa trên màn Quản lý. Đây là nền cho KHO-2 (pha chế, xuất kho có duyệt, nhận hàng,
xử lý phát sinh) và KHO-3 (bán trừ kho POS, kiểm kê cuối ca, tắt nối SX). Phải xong trước khai trương.

## Nghiệm thu
- A **Cấu trúc theo mục nghiệp vụ** (mẫu cho các mục sau): `server/kho/` gồm `duong.js` (đường nối: nhận yêu cầu, kiểm quyền, gọi hàm),
  `tinh.js` (phép tính THUẦN — không DB, không giờ), `duLieu.js` (đọc / ghi CSDL), `nhapSx.js` (nhập từ bản sao lưu SX). Mount MỘT chỗ
  `/api/pos/kho`. Giao diện ở `client/src/pages/Kho/`. Phần dùng chung (giờ, quyền, mã lỗi, `api.js`) gọi cái đang có, không chép.
  Thông tin riêng của quán (bảng gộp tên, nhóm mặc định) là hằng số có tên một chỗ — để sau đóng gói cho quán khác.
- B **Nâng cấp dữ liệu đánh số:** `server/nang_cap/NNN_<ten>.js` (bước đầu `001_kho.js`) + bộ chạy; bảng `pos_nang_cap` ghi bước đã
  chạy + giờ. Khởi động máy chủ chạy các bước chưa chạy theo số, mỗi bước MỘT giao dịch; bước lỗi → không đánh dấu, máy chủ báo rõ bước
  nào hỏng. Chỉ THÊM (bảng / cột / chỉ mục). Bước nào thêm cột vào bảng ĐANG CÓ dữ liệu → tự chép bảng đó sang `_sao_luu_NNN_<bang>`
  trước. Code tạo bảng cũ trong `database.js` để nguyên; chỉ thêm lời gọi bộ chạy sau phần tạo bảng / seed. Khởi động lại nhiều lần →
  không đổi gì.
- C **Bảng kho** (tiền tố `kho_`, kế hoạch đề xuất cột cụ thể): nhóm nguyên liệu; nguyên liệu (tên, nhóm, đơn vị lưu, đơn vị hiện + hệ
  số đổi, giá nhập gần nhất, tồn tối thiểu, hạn dùng theo ngày, ghi chú, đang dùng / ngừng); nhà cung cấp; công thức (thành phần là
  nguyên liệu HOẶC sản phẩm khác, lượng cho 1 đơn vị); nhóm công thức; định mức hằng ngày; lô (thành phẩm và nguyên liệu: số lượng, hạn,
  giá vốn / đơn vị, phiếu sinh ra lô); phiếu + dòng phiếu (loại ĐH / PX / PN / PS / KK, số phiếu, người tạo, người duyệt, trạng thái,
  lý do sửa / huỷ; sửa = phiếu mới, phiếu cũ giữ). Tồn KHÔNG là ô sửa tay: tồn suy ra từ lô / phiếu đã duyệt (kế hoạch chọn cách, ghi
  lý do). KHO-1 chỉ TẠO bảng phiếu / lô / định mức — chưa có luồng, chưa có màn (KHO-2 làm).
- D **Sản phẩm = công thức, MỘT nguồn:** một món bán là MỘT dòng — không tạo bảng sản phẩm thứ hai chạy song song `pos_products`. Mỗi
  sản phẩm có kiểu: `pha_tai_cho` (bán trừ thẳng nguyên liệu, vd nước chanh) · `lam_san` (bán trừ thành phẩm theo lô FEFO: nước ép,
  cốt, trà gói, món dưỡng sinh) · `chua_dinh_luong` (bán được, chưa trừ kho). Giữ khoá nối SX (`sx_product_type`, `sx_product_id`)
  để giá POS và lịch sử đơn không đứt. Kế hoạch nêu rõ cách: thêm cột vào `pos_products` (qua bước nâng cấp, có sao lưu) hay bảng
  `kho_*` khoá theo đúng dòng `pos_products` — chọn cách đơn giản nhất giữ được "một món một dòng".
- E **Công thức:** lồng được (sản phẩm dùng sản phẩm khác); hàm thuần `trienKhai(congThuc, soPhan)` → danh sách nguyên liệu gốc + tổng
  lượng (dùng lại ở KHO-2: phiếu xuất, đơn đặt hàng). Lưu công thức tạo vòng (A→B→A, kể cả A→A) → 400 `CONG_THUC_VONG_LAP`, lời
  báo nêu chuỗi tên. Lưu số thật; làm tròn chỉ khi hiển thị (gam / ml).
- F **Nhập danh mục từ SX** (chỉ chủ quán): Quản lý → "Nhập từ SX" → chọn file `.db` (bản sao lưu SX) → **XEM TRƯỚC**: số nguyên liệu sẽ
  thêm, các tên sẽ gộp (tên cũ → tên giữ), số sản phẩm / công thức, cảnh báo (giá 0, thiếu đơn vị, công thức trỏ nguyên liệu không có,
  một công thức có cả hai tên bị gộp) → bấm "Nhập" → ghi trong MỘT giao dịch. Nhập lại cùng file hay bản mới hơn → không nhân đôi (khoá
  theo tên đã chuẩn hoá / mã SX); bản mới hơn chỉ THÊM cái còn thiếu, không ghi đè chỗ chủ quán đã sửa trong POS. Đọc file bằng
  `@libsql/client` (đã có) chỉ đọc; file tạm xoá sau; giới hạn kích thước. Lấy: nguyên liệu (tên, nhóm, đơn vị, giá, hạn, tối thiểu —
  ô trống / 0 GIỮ trống để chủ quán điền), nhóm sản phẩm, sản phẩm, công thức (kế hoạch đọc cấu trúc SX để biết bảng công thức nào đang
  dùng thật). KHÔNG lấy: tồn, lô, khách, gói đăng ký, giao định kỳ, việc. Nhóm SẢN PHẨM giữ tên SX; nhóm NGUYÊN LIỆU theo mục 5 phần Đã duyệt (Rau củ quả · Dược liệu).
- G **Gộp trùng:** chuẩn hoá tên (bỏ khoảng thừa, không phân biệt hoa / thường, GIỮ dấu) + bảng gộp tay chủ quán chốt (hằng số trong
  `nhapSx.js`): đúng bảng "Dữ liệu SX thật" (mục 5 phần Đã duyệt). Công thức trỏ tên bị gộp → trỏ tên chính thức; một công thức có cả
  hai → cộng lượng + ghi cảnh báo ở bản xem trước. Bản 09.10 phải ra 32 nguyên liệu.
- H **Màn Quản lý** (đường dẫn mới; việc này chỉ thêm route + MỘT mục "Quản lý kho" vào menu hiện tại — BH-2 xếp vào menu 6 mục):
  - Nguyên liệu: ô tìm (gõ không dấu vẫn ra), sắp xếp (tên · nhóm · giá · mới thêm), tab Tất cả + tab từng nhóm; thêm / sửa / ngừng dùng
    (không xoá cứng nguyên liệu đã nằm trong công thức hay phiếu); quản lý nhóm và nhà cung cấp. Dùng tốt trên điện thoại (dạng thẻ).
  - Sản phẩm & công thức: danh sách theo nhóm; bấm một sản phẩm → công thức cho 1 đơn vị + ô "Tính cho N phần" (máy nhân ra từng
    nguyên liệu); chọn kiểu sản phẩm (D). Chỉ CHỦ QUÁN sửa công thức và kiểu.
  - Ô "Thiếu thông tin": đếm nguyên liệu giá 0 / thiếu hạn / thiếu tối thiểu, bấm ra đúng danh sách đó để điền nhanh.
  Màn theo luật giao diện chủ quán: ít nút, việc hay dùng lên trước, danh sách dài thì có tìm + tab, không bày hết một màn.
- I **Quyền** (kiểm ở MÁY CHỦ, không chỉ ẩn nút): chủ quán — mọi thứ; quản lý — thêm / sửa nguyên liệu, nhóm, nhà cung cấp, xem công
  thức; nhân viên — chỉ xem nguyên liệu. Dùng vai trò / `checkPermission` đang có (bảng phân quyền chi tiết làm sau khai trương).
- J **Sao lưu:** thêm `pos_nang_cap` và các bảng `kho_*` vào `BACKUP_TABLES` (backup.js), cha trước con.
- K **K5 — không đổi:** menu bán hàng, giá, tạo đơn, trừ kho qua SX chạy y như cũ; POS khởi động được trên kho thử trống và trên bản sao
  dữ liệu thật; máy chủ chưa có bảng mới → tự tạo khi khởi động.

## Phạm vi
- viec/KHO-1/**
- server/kho/**
- server/nang_cap/**
- server/index.js
- server/database.js
- server/routes/backup.js
- client/src/pages/Kho/**
- client/src/App.jsx
- client/src/components/Layout.jsx
- client/dist/**
- cong_cu/thu_KHO1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — bài mới `cong_cu/thu_KHO1.js` phải ĐỎ trên code gốc: hàm thuần (đổi đơn vị, nhân theo số phần, lồng 2 tầng, vòng lặp A→A và
A→B→A, gộp trùng theo bảng gộp tay, "Táo tươi" không bị gộp); bộ chạy nâng cấp (chạy 2 lần không đổi; bước lỗi không đánh dấu; bước
thêm cột có bảng sao lưu); nhập SX từ một file `.db` mẫu do bài thử tự dựng (có tên trùng, giá 0, công thức trỏ tên gộp; nhập 2 lần
không nhân đôi); quyền (nhân viên sửa công thức → 403, quản lý sửa công thức → 403, quản lý thêm nguyên liệu → 200).

## Ngân sách
~600 dòng máy chủ + ~700 dòng giao diện + ~450 dòng thử. `server/index.js`: một dòng mount; `database.js`: một lời gọi bộ chạy nâng
cấp; `App.jsx` / `Layout.jsx`: route + một mục menu; `kiem_tra_truoc_khi_giao.js`: chỉ thêm tên bài vào cuối mảng.
**Phương án đơn giản nhất đã xét:** thêm bảng thẳng trong `createTables()` như cách cũ — không chọn: chủ quán chốt nâng cấp dữ liệu
theo bước đánh số, chỉ thêm, sao lưu trước bước đụng bảng cũ, để mọi lần nâng cấp sau không chạm dữ liệu thật.

## Đổi cấu trúc DB
có — chỉ THÊM qua `server/nang_cap/001_kho.js` (bảng `pos_nang_cap`, các bảng `kho_*`; nếu chọn thêm cột vào `pos_products` thì có sao
lưu bảng trước). Không xoá, không đổi tên, không sửa dữ liệu cũ.

## Thư viện mới
không (`@libsql/client`, `multer` đã có)

## Cấm
- KHÔNG sửa `server/routes/orders.js`, `products.js`, `thanh-toan.js`, `wallets.js`, `loyalty.js`, `customers*.js`, `server/utils/sxApi.js`,
  `server/ketNoiKho.js`, `client/src/pages/Sales.jsx`, `client/src/pages/BanHang/**`, `client/src/components/Invoice*`, `InPhieu.jsx`,
  `client/src/utils/inPhieu.js`, `app_kh/**`.
- KHÔNG làm pha chế, phiếu xuất, nhận hàng, đặt hàng, xử lý phát sinh, kiểm kê, giao việc (KHO-2 / KHO-3 / sau khai trương); KHÔNG đổi
  nguồn menu bán hàng sang POS, KHÔNG trừ kho POS khi bán (KHO-3).
- KHÔNG xoá / sửa dữ liệu bảng cũ; KHÔNG chạy nhập SX lên dữ liệu thật trong lúc làm (chỉ trên kho thử / file mẫu).
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/KHO-1`. Không đụng main, không merge,
  không tạo PR.
