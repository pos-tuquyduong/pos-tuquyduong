# KHO-3a — kế hoạch (chờ chat soát)

Nền: `7fd9986 PHIEU: KHO-3a cap nhat du lieu that 18.11` (= origin/viec/KHO-3a, máy đã có đủ — `git pull` không cần, không có gì để gộp).
Bản kế hoạch của phiên trước CHƯA từng được push nên đã mất cùng máy cũ — bản này viết lại từ đầu, đọc code trong lượt 18.11, đã gộp
A3b, dữ liệu thật 18.11 và trả lời Câu 1 · 3 · 4 của chủ quán (mục 8). Mọi số dòng đọc trong lượt này.

## 0. Hiện trạng đã đọc (K1)

| Điều | Chỗ đọc |
|---|---|
| Menu: có SX thì lấy danh sách SX + ghi `ton_gan_nhat`; không có SX thì `getFallbackProducts` đọc `pos_products is_active = 1 ORDER BY sort_order, name`, `stock_quantity` = `ton_gan_nhat`, `ton_cu: true` | `server/routes/products.js:33-141` |
| Menu đè `unit` theo nhóm (`tea` → gói, còn lại túi), bỏ qua cột `pos_products.unit` | `products.js:110` |
| `/api/kh/menu` = `layMenuQuay` lọc `sellable`; `con_hang` = `khong_quan_kho ? true : stock_quantity > 0 / null`; `ton_cu`, `ton_luc` đi thẳng | `server/routes/kh/index.js:39-46,143-146` |
| Đơn App dựng món theo `layMenuQuay`, chặn `HET_HANG` khi SL > `stock_quantity`; lỗi "Không đủ hàng: …" (không code) của taoDon → `HET_HANG` | `server/utils/donApp.js:150-180` |
| Màn khách: `het = !khong_quan_kho && stock_quantity === 0` | `server/utils/manKhach.js:114-115` |
| Quầy: nút món mờ khi `stock_quantity === 0` hoặc chưa giá; lời "hết hàng trong kho SX" | `client/src/pages/BanHang/BanHangMoi.jsx:381-391`, `BanHang/tinh.js:98-104` |
| taoDon: `checkStock` SX TỪNG DÒNG (không cộng dồn cùng món), lỗi mạng bị nuốt (§5.3); `tinhThu` bỏ qua | `server/routes/orders.js:428-441` |
| taoDon: giao dịch ghi đơn mở ở `beginTransaction` (khoá ghi), phiên chốt qua `vaoGiaoDich` TRƯỚC khi trừ ví | `orders.js:1025-1036` |
| Trừ kho SX SAU commit (`outStockFIFO`, lỗi → `pos_stock_pending`) | `orders.js:1282-1316` |
| Đăng ký khách mới (`is_new_customer`) ghi `pos_registrations` sau commit | `orders.js:1318-1343` |
| Huỷ đơn: cổng `UPDATE … WHERE status = 'completed'` + `changes`; đơn giao "Bỏ đi" (`huyGiao.doDaPha === 'bo_di'`) không hoàn kho; hoàn kho SX sau commit | `orders.js:1705-1913`, `utils/giaoHang.js:154-188` |
| Xoá đơn (chủ quán): hoàn kho SX sau commit khi đơn chưa `cancelled` | `orders.js:1916-2051` |
| Báo sự cố `return_stock` → `callSxApi('/api/pos/stock/return')` | `server/routes/damages.js:223-237` |
| `stock.js` (3 đường, chỉ đọc SX); `doi-chieu.js` (vân tay SX); `so-no.js` + `utils/doSoNo.js` (đẩy lại nợ kho, chạy theo mỗi yêu cầu qua middleware) | `stock.js:1-104`, `doi-chieu.js:20-151`, `index.js:55,102-105,116,139-140` |
| Thanh điều hướng (`Layout.jsx` — Cấm) hiện "N việc kho chờ gửi" từ `GET /so-no` (`cho`, `canXem`) | `client/src/components/Layout.jsx:36,95-112` |
| Sao lưu: `getProductsWithSxNames` gọi SX lấy tên | `server/routes/backup.js:219-240` |
| Bước 020 `require('../utils/sxApi')` ở ĐẦU file; `chay.js` `require` MỌI file bước khi chạy → xoá `sxApi.js` là kho mới (kho thử) sập lúc khởi động | `server/nang_cap/020_chep_khach_sx.js:9-21`, `nang_cap/chay.js:33-36` |
| `ketNoiKho.diaChiSX()` đọc `SX_API_URL(_THU)`; `database.js` in địa chỉ SX ở dòng khởi động; bộ kiểm K2 ca 1–3 kiểm `diaChiSX` | `server/ketNoiKho.js:44-50`, `database.js:17,33`, `kiem_tra_truoc_khi_giao.js:856-901` |
| Giữ chỗ hiện có = TÍNH từ `pos_phien_thanh_toan` `trang_thai = 'cho' AND het_han > bây giờ` (ví: `dangGiu`; voucher: `voucherDangGiu` đọc `than` JSON) — không cột "đã giữ", nhả = đổi trạng thái / hết hạn | `server/routes/wallets.js:60-66`, `utils/voucherCode.js:89-103` |
| Tạo phiên: kiểm voucher LẠI trong `trongGiaoDich` (câu đầu = khoá ghi); hạn `HAN_PHUT = 10`; QR lỗi → `'loi'` (nhả) | `server/utils/giuCho.js:23,98-140` |
| Chốt hỏng vì đơn (4xx) → phiên `'loi'`, `ly_do` = `code` | `giuCho.js:183-188` |
| Tiền QR về cho phiên App `huy`/`loi`/hết hạn → `vaoVi` (dòng báo + ghi ví một giao dịch, khoá `changes`); phiên QUẦY → `chua_khop` | `server/routes/thanh-toan.js:147-215` |
| Câu khách thấy `thong_bao_tien_ve`: "Không tạo được đơn vì món đã hết hàng — đã cộng … vào tài khoản của bạn" (bảng `LY_DO_NGAN`) | `utils/donApp.js:76-91` |
| Quầy thấy dòng `vao_vi` hôm nay ở dải đơn App đầu trang (mọi màn, kể cả Bán hàng) và màn Đơn App | `donApp.js:454-466`, `components/DonAppNoi.jsx:64`, `pages/DonApp.jsx:69` |
| Kho: tồn = Σ dòng phiếu `da_duyet` (trừ DH); lô thành phẩm còn lại = Σ dòng theo `lo_id`; `chiaTheoLo` FEFO, thiếu → dòng `lo_id NULL`; `trienKhai` lồng | `server/kho/duLieu.js:117-131,190-218`, `kho/tinh.js:31-50,90-107` |
| `kho_phieu.loai` CHECK chỉ `DH, PX, PN, PS, KK` (SQLite không đổi CHECK); `su_co` không CHECK | `nang_cap/001_kho.js:75`, `007_kho_nhap_hang.js:11` |
| Hạn mức nội bộ PS chỉ cộng `su_co = 'noi_bo'` | `server/kho/phatSinh.js:78` |
| `pos_products.sx_product_id INTEGER`, `code UNIQUE NOT NULL`, có `unit`, `sort_order`, `is_active` | `server/database.js:149-166` |
| Không có `POST /products` / `PUT /products/:id` (api.js khai `toggle`, `update` nhưng máy chủ không có đường) | `products.js` (cả file), `client/src/utils/api.js:394-405` |
| Màn Kho › Sản phẩm: kiểu + công thức + hạn; dòng "đặt giá ở Cài đặt › Sản phẩm" | `client/src/pages/Kho/SanPham.jsx:13,46,91` |
| `/sync/*` và xuất SX của `/registrations` không màn nào gọi ngoài `Registrations.jsx` (GIAO-DIEN-2); `docKhach` đọc đăng ký `pending` như khách | `client/src/utils/api.js:304-324,492-494`, `server/utils/docKhach.js:14-16` |
| Giả lập: SX giả + bất biến I7 "mỗi vân tay kho làm đúng một lần"; KB24–KB25 = SX lỗi / đẩy sổ nợ | `cong_cu/gia_lap/chay.js:166-192`, `bat_bien.js:101-142`, `kich_ban.js:536-577` |
| 29 bài `cong_cu/thu_*.js` thay `utils/sxApi.js` bằng SX giả trước khi nạp route | `grep -c "sxApi\|checkStock\|outStockFIFO\|products-with-stock" cong_cu` |

## 1. Thiết kế dữ liệu — hai bước nâng cấp MỚI, chỉ thêm

**`server/nang_cap/030_ban_theo_kho.js`** (~12 dòng, `themCot`):
- `kho_san_pham.cho_ban_thieu INTEGER NOT NULL DEFAULT 0` — B8 "Cho bán khi thiếu nguyên liệu", mặc định TẮT.
- `kho_phieu.don_hang_id INTEGER` + `CREATE UNIQUE INDEX ux_kho_phieu_don_hang ON kho_phieu(don_hang_id) WHERE don_hang_id IS NOT NULL` — phiếu bán nối đơn;
  một đơn đúng MỘT phiếu bán (khoá trong CSDL, không chỉ trong code).

**`server/nang_cap/031_ten_mon_sx.js`** (~12 dòng, A3b): hằng `TEN_MON_SX = [['juice', 5, 'Công thức 5', 'Thanh Tân Dưỡng'], …×4]`,
`UPDATE pos_products SET name = ?, updated_at = ? WHERE sx_product_type = ? AND sx_product_id = ? AND name = ?` — chỉ đổi khi tên đúng bằng tên tạm,
chạy lại không đổi gì. Kho thử không có `pos_products` → bỏ qua (khuôn bước 005).

**Phiếu bán (B4) — phương án:**
- A: `loai = 'PS'`, `su_co = 'ban_hang'`, `don_hang_id` = id đơn, `da_duyet` ngay (máy ghi). Dòng `loai = 'ban'`. Đọc / in đi đường `docPhieuNhap` có sẵn
  (tên, lượng, lô) — không màn đọc mới. Huỷ đơn = `trang_thai → 'huy'` → phiếu rơi khỏi tồn → hàng tự về ĐÚNG lô đã trừ (luật tồn có sẵn).
  `ban_hang` KHÔNG vào `SU_CO` (`tinh.js:174`) → không ai tạo tay được.
- B: loại phiếu mới `BH` → phải dựng lại bảng `kho_phieu` để đổi CHECK (sao chép bảng, trái luật "chỉ thêm").
- C: `PX` → lẫn với pha chế (`ghiKetQua`, `bangPhieu`, số phiếu PX) — phải tách ở 4 chỗ.
→ **Chọn A.** Số phiếu `PS-YYMMDD-NNN` dùng chung dãy với phát sinh (hàm `soPhieuMoi` có sẵn).

**Định danh món mới tạo ở POS (A4):**
- A: `sx_product_type = 'pos'`, `sx_product_id = pos_products.id`, `code = 'POS' || id` (ghi trong cùng giao dịch ngay sau INSERT). Mọi chỗ khoá theo
  (`sx_product_type`, `sx_product_id`) — giá (`PUT /products/price`), `unique_id`/`ma` của `/api/kh/menu`, giỏ App, `package_items`, đơn cũ — chạy
  nguyên, không sửa dòng nào. `kho_san_pham.pos_product_id` vốn khoá theo `id`.
- B: để khoá SX `NULL` và chuyển mọi chỗ sang `id` → sửa giá, menu, gói, App, đơn App (≥ 6 file, đổi hợp đồng `ma`).
→ **Chọn A.** Giá trị `'pos'` là hằng có tên `LOAI_MON_POS` (products.js).

## 2. Máy chủ — phương án theo phần

### 2.1 Một file mới `server/kho/banHang.js` (~170 dòng) — MỘT chỗ cho mọi luật bán theo kho
- `docKhaNang(csdl, { boPhienId })` — một lượt đọc: món (`pos_products` + `kho_san_pham` + có công thức?), bảng công thức (`docBangCongThuc`), tồn nguyên liệu
  (một câu GROUP BY theo `DA_DUYET`), lô thành phẩm còn hạn (`conLaiTheoLo` có sẵn), phần ĐANG GIỮ = Σ cần của `than.items` các phiên `cho` còn hạn
  (trừ `boPhienId`) — cùng khuôn `voucherDangGiu` (đọc `than` JSON, thân hỏng = không giữ gì). Món trong `than.items` có HAI dạng — `{ sx_product_type, sx_product_id }`
  (quầy, App `donApp.js:180`) hoặc `{ product_id }` — tra món bằng ĐÚNG vị từ của taoDon (`orders.js:396-407`, tách thành hàm `timMon` dùng chung, không viết lần hai).
- `canCuaItems(items, ctx)` (thuần, vào `tinh.js`) → `{ thanhPham: Map(spId → SL), nguyenLieu: Map(nlId → lượng), chuaCongThuc: [spId] }`;
  `lam_san` cộng SL món; `pha_tai_cho` → `trienKhai` × SL (lồng); món ảo gói / thẻ / nạp (`product_id < 0`, không có dòng món) bỏ qua.
- `kiemDuHang(csdl, items, { boPhienId })` → `null` hoặc lỗi `{ status: 400, body: { error, code, mon } }` theo thứ tự B3 → B1 → B2:
  - chưa có công thức → `CHUA_CO_CONG_THUC` "Món chưa có công thức: <món>";
  - `lam_san`: Σ lô còn hạn − giữ < cần → `HET_HANG` "Không đủ hàng: <món>. Còn: <n>, cần: <m>" (giữ lời cũ);
  - `pha_tai_cho` TẮT cho_ban_thieu: tồn nguyên liệu − giữ < cần của CẢ GIỎ → `THIEU_NGUYEN_LIEU` "Thiếu nguyên liệu: <nguyên liệu> cho <món>";
    món BẬT không bao giờ bị chặn (vẫn chiếm phần nguyên liệu của giỏ).
  So bằng có `SAI_SO` (tinh.js) — gam / ml lẻ.
- `truKhoDon(tx, { orderId, items, nguoi, luc, phienId })` — TRONG giao dịch đơn: (1) kiểm bằng `kiemDuHang(tx, items, { boPhienId: phienId })` — MỘT luật cho mọi lối:
  tồn − phần giữ của phiên KHÁC ≥ cần (phần giữ của CHÍNH phiên đang chốt không tính — soát kế hoạch 4a). Chốt trong hạn: tồn ≥ Σ mọi phần giữ nên luôn qua,
  trừ khi hàng thật đã bị lấy (lưới B3c); chốt muộn (xác nhận tay sau hạn, App chỉ thẻ / nạp) vẫn tôn trọng phần giữ của phiên khác (soát 4b) — không bán vượt;
  (2) `themPhieu` PS `ban_hang` `da_duyet` + `don_hang_id`; (3) dòng `ban`: thành phẩm chia lô còn hạn FEFO (`chiaTheoLo`), nguyên liệu chia lô FEFO như
  `ghiKho` (`duLieu.js:204-217`), phần thiếu `lo_id NULL` CHỈ có thể xảy ra ở món BẬT cho_ban_thieu (âm → đỏ ở Tồn kho có sẵn). Trả `{ loi }` → chỗ gọi rollback.
- `huyPhieuBan(tx, orderId, { doDaPha })` — `UPDATE kho_phieu SET trang_thai = 'huy', ly_do = …, nguoi_huy, huy_luc WHERE don_hang_id = ? AND su_co = 'ban_hang'
  AND trang_thai = 'da_duyet'` (khoá trong câu ghi); `doDaPha === 'bo_di'` → KHÔNG huỷ phiếu, chỉ ghi `ghi_chu = 'hao hụt: huỷ đơn — đồ đã pha bỏ đi'`.
- `tonMenu(ctx)` → mỗi món: `lam_san` = Σ lô còn hạn − giữ; `pha_tai_cho` TẮT = `floor(min((tồn − giữ) / lượng một phần) + SAI_SO)` (≥ 0), BẬT =
  `khong_quan_kho: true`; chưa công thức = `stock_quantity: null`, `chua_cong_thuc: true`. A2: chọn hiện SỐ PHẦN cho pha tại chỗ vì đã phải tính để chặn
  (B3b "còn bán được" một con số cho quầy, App, màn khách) — không hiện số thì quầy chỉ biết hết khi bấm thu.
- `monChuaSan(csdl, bayGio)` (A7) → món đang bán mà: chưa kiểu / `chua_dinh_luong` / công thức rỗng, hoặc `lam_san` hết lô còn hạn. Kèm lý do + số đếm.

Phương án B (rải luật vào `orders.js` + `giuCho.js` + `products.js`) → ba bản luật lệch nhau (K4 BAN-HANG-1 "một vị từ") → **chọn A**.
`duLieu.js` (436 dòng) và `duong.js` (328) không nhận thêm khối lớn — đúng luật tách file theo việc.

### 2.2 Menu (A1, A2, A3) — `products.js`
- `layMenuQuay(category)` = `pos_products is_active = 1 ORDER BY sort_order, name` (đường DUY NHẤT, thân `getFallbackProducts` gộp vào) + `tonMenu`.
  Bỏ nhánh SX, bỏ ghi `ton_gan_nhat`. Trả `ton_cu: false`, `ton_luc: null` (giữ trường, A2 "bỏ khỏi hiển thị"; cột DB giữ nguyên).
- `sellable = price > 0 && !chua_cong_thuc`; `unit` lấy cột `unit` (món mới chọn đơn vị) thay vì đè theo nhóm — dòng cũ đã có `túi`/`gói` đúng nhóm
  (mọi INSERT cũ ghi theo nhóm, `products.js:177,224,285`). `unique_id` giữ `${type}_${id}`.
- Hợp đồng `/api/kh/menu`: **KHÔNG đổi / xoá trường nào.** Đổi NGHĨA: `ton_cu` luôn `false`, `ton_luc` luôn `null`; món chưa công thức không hiện
  (đã lọc `sellable`); `con_hang` theo kho POS (phần đang giữ đã trừ). → tăng `PHIEN_BAN` 17 → 18 + nhật ký (hàm tạo dữ liệu cho App đổi — luật L2).
  App KH không phải sửa gì (v17 chạy nguyên).
- Gọi `tonMenu` một lượt / lần tải (≈ 5 câu đọc). Giả lập S4 đo lại — sát ngưỡng thì báo, không nới.

### 2.3 Quản lý món trong POS (A4, A5, A7, B8)
- `POST /api/pos/products` (`manage_settings`): `{ name, category, price, unit, sort_order, is_active }` → INSERT + gán khoá `('pos', id)`, `code 'POS<id>'`,
  cùng giao dịch. Tên rỗng / > 100 ký tự → 400 `TEN_KHONG_HOP_LE`; trùng tên đang bán → 400 `TEN_TRUNG`.
- `PUT /api/pos/products/:id` (`manage_settings`): sửa `name, category, unit, sort_order, is_active` (ẩn / hiện). KHÔNG có đường xoá cứng (A4).
  Giá: `PUT /products/price` có sẵn (khoá SX hoặc khoá `pos`).
- `POST /products/sync-from-sx` → 410 `SX_DA_NGAT` (C1).
- Công thức, kiểu, hạn, `cho_ban_thieu`: `PUT /api/pos/kho/san-pham/:id` có sẵn (`CHU_QUAN`, `duong.js:105`) nhận thêm `cho_ban_thieu` (0/1) — B8 chỉ chủ quán.
- `GET /api/pos/kho/mon-chua-san` (QUAN_LY) → `monChuaSan` (A7).
- Màn (mục 3) gọi đúng các đường này — không đường thứ hai.

### 2.4 Bán (B1–B7) — `orders.js` CHỈ đoạn kiểm tồn, trừ kho, huỷ
- Bỏ khối `checkStock` trong vòng món (`orders.js:428-441`). KHÔNG thêm kiểm trước giao dịch trong taoDon (soát kế hoạch câu 2 + 4a: trùng với kiểm trong giao dịch
  của `taoPhien` và `truKhoDon`, lại tính nhầm phần giữ của chính phiên đang chốt). Tạo phiên → kiểm trong `taoPhien` (2.5); POST /orders trực tiếp và mọi lần chốt →
  kiểm trong `truKhoDon`. `tinh-thu` không kiểm, không trừ (B6) — báo giá App vẫn chạy khi kho trống.
- Trong giao dịch, ngay sau ghi dòng đơn (`orders.js:~1105-1120`): `const k = await truKhoDon(tx, { … phienId: phien?.id ?? null })`; `k.loi` → rollback + 400.
  Mọi lối vào taoDon (phiên quầy, App, màn khách, chốt muộn, POST trực tiếp) đi qua đúng một dòng này (B6).
- Bỏ khối `outStockFIFO` sau commit (`:1282-1316`).
- Huỷ (`:1705-1913`): sau cổng `status = 'completed'` + `chotHuyGiao`, `await huyPhieuBan(tx, order.id, { doDaPha: huyGiao?.doDaPha })`; bỏ khối `inStockReturn` sau commit.
  Một lần: cổng trạng thái đơn đã chặn lần hai; câu ghi phiếu có `AND trang_thai = 'da_duyet'`.
- Xoá (`:1916-2051`): đơn `completed` → `huyPhieuBan` trong giao dịch; bỏ khối `inStockReturn`. Đơn đã `cancelled` → phiếu đã huỷ trước.
- Đơn cũ trên production (trước gộp) không có phiếu bán → `huyPhieuBan` đổi 0 dòng, không lỗi (đúng: kho POS chưa từng bị trừ cho đơn đó).
- Ràng buộc §5.2 / §5.3: lỗi máy in vẫn không rollback (không đụng). `checkStock` bọc try/catch "chỉ log" BIẾN MẤT cùng SX — kho POS ở cùng CSDL, lỗi CSDL thì
  cả giao dịch rollback (B7). → Ghi Phát hiện đề nghị chat sửa câu §5.3 của CLAUDE.md (máy không sửa CLAUDE.md).

### 2.5 Giữ hàng (B3b) — `giuCho.js`, đúng chỗ giữ voucher
- Trong `trongGiaoDich` của `taoPhien`, cạnh khối kiểm voucher (`giuCho.js:112-122`): `kiemDuHang(tx, don.items, { boPhienId: null })` (phiên chưa có) → lỗi thì `{ huy: true, …loi }`.
  Câu đầu giao dịch đã là khoá ghi → hai quầy / App tranh chai cuối: bên sau đọc phiên bên trước → chặn.
- Phần giữ KHÔNG ghi cột nào: chính dòng phiên `cho` còn hạn là phần giữ (như ví, voucher). Thời gian giữ = `HAN_PHUT` 10 phút (= hạn QR).
  Mọi đường nhả: huỷ phiên (`huy`), hết hạn (`het_han ≤ bây giờ` — tự nhả theo đồng hồ, không hẹn giờ), QR lỗi (`loi`), chốt hỏng vì đơn (`loi`),
  chốt xong (`da_thu` — phần giữ thành phiếu bán trong CÙNG giao dịch chốt). "Dọn phiên cũ": không cần (hết hạn = đã nhả).
- Chốt: `truKhoDon(…, { phienId })` — phần giữ của chính phiên không tính, phần giữ phiên khác có tính. Tiền về sau hạn: luật có sẵn (App → vào ví, không chốt).
- Đơn App (soát 4c): `chuanLoi` (`donApp.js:166-180`) đổi `HET_HANG` / `THIEU_NGUYEN_LIEU` → App `HET_HANG`, `CHUA_CO_CONG_THUC` → App `MON_KHONG_BAN`, kèm `ma`
  (= `unique_id` của món, lấy từ `mon` trong thân lỗi) — chỉ mã đã có trong hợp đồng; bỏ nhánh dò lời "Không đủ hàng: " không code (SX hết).
- Màn khách (soát 4e): bỏ bộ nhớ 20 s của menu (`manKhach.js:21,112-116`, chỉ có vì gọi SX chậm) → cùng một con số với quầy và App ngay lúc đó. Giả lập / đo lại tốc độ.
- `ly_do` của phiên chốt hỏng: `code` + `: <món>` khi lỗi kho (`giuCho.js:185-186`) → câu khách / quầy nói được tên món.

### 2.6 Lưới an toàn B3c
- Còn có thể thiếu hàng lúc chốt TRONG hạn dù đã giữ: phiếu pha chế / phát sinh (KHO-2a/2b) trừ nguyên liệu không xét phần giữ; lô làm sẵn hết hạn giữa 10 phút.
  → `truKhoDon` trả `HET_HANG` / `THIEU_NGUYEN_LIEU` → taoDon rollback: KHÔNG đơn, KHÔNG dòng âm thành phẩm.
- Phiên App: đường có sẵn — `chotPhien` đánh `loi` + `ly_do "HET_HANG: <món>"` → `xuLyTienVe` `vaoVi` cộng ĐÚNG số tiền về, một lần (khoá dòng báo), cùng giao dịch
  (`thanh-toan.js:162-180`). `LY_DO_NGAN` thêm mẫu kho → "Món <món> vừa hết — quán đã hoàn <số> vào ví của bạn" (`donApp.js:76-91`). Quầy: dòng `vao_vi` ở dải
  đơn App (mọi màn) + màn Đơn App, lời "Đơn … hết <món> — đã hoàn <số> vào ví khách <SĐT che>" (`DonApp.jsx` tô đỏ dòng `vao_vi` lý do hết hàng).
  Đẩy thông báo cho App: hợp đồng v17 KHÔNG có đường POS nhờ App gửi đẩy → **Phát hiện** + soạn `viec/KHO-3a/TRA_LOI_POS_KHO3a.md` cho App KH (không thêm đường).
- Phiên QUẦY QR có SĐT khách, chốt trong hạn hỏng vì kho: mở `vaoViDuoc` cho phiên quầy CHỈ khi `ly_do` là mã kho (`thanh-toan.js:161-162,189,209`) — cùng hàm `vaoVi`.
- Phiên quầy QR KHÔNG SĐT (khách vãng lai): không có ví → `ghi('chua_khop', 'Hết hàng: <món> — khách chưa có tài khoản: HOÀN TIỀN TAY')` (sổ Đối soát CẦN XEM
  có sẵn) + màn QR quầy hiện lời đỏ của phiên `loi`. Chứng minh "không xảy ra" là KHÔNG được (hai nguyên nhân trên) → làm nhánh báo đỏ theo phiếu.
- Tiền mặt / trừ tài khoản ở quầy: chốt hỏng thì giao dịch rollback (ví không trừ), nhân viên đang cầm tiền trước mặt khách → không cần lưới.

### 2.7 Gỡ SX (C1–C6)
| Chỗ | Việc | Dòng |
|---|---|---|
| `utils/sxApi.js` | thu về ~6 dòng: chỉ `callSxApi` ném `SX_DA_NGAT` NGAY (không mạng) — GIỮ vì bước 020 `require` nó lúc nạp (C1: không chạy được lời gọi SX) | −225 |
| `products.js` | nhánh SX menu, `sync-from-sx` (→ 410) | −95 |
| `orders.js` | `checkStock`, `outStockFIFO`, 2× `inStockReturn`, 3× ghi `pos_stock_pending` | −90 |
| `stock.js` | xoá file; `index.js` gắn `/api/pos/stock` → 410 `SX_DA_NGAT` | −104 |
| `doi-chieu.js` | xoá file (toàn bộ là vân tay SX; phần POS chỉ là đếm đơn + sổ nợ); `/api/pos/doi-chieu` → 410 | −154 |
| `damages.js` | bỏ khối gọi SX; `return_stock` / `return_to_stock` → 400 `HOAN_KHO_SX_DA_BO`, không ghi gì (Câu 3: nút bỏ ở GIAO-DIEN-2, gộp trước) | −15 |
| `backup.js` | `getProductsWithSxNames` → `SELECT * FROM pos_products` (C3); phần POS / Drive giữ nguyên | −18 |
| `so-no.js` + `utils/doSoNo.js` | xoá `doSoNo.js` + middleware `doNeuDenLuc`; `GET /so-no` trả `{ cho: 0, canXem: 0, danh_sach: [] }` (dải "chờ gửi" của Layout tự tắt — C4, không sửa Layout); `POST /so-no/doi-ngay` → 410 | −120 |
| `sync.js` | xoá file (chỉ xuất / nhập CSV khách cho SX, không màn nào gọi); `/api/pos/sync` → 410 (C5) | −370 |
| `registrations.js` | `/export/csv`, `/confirm-export`, `/revert/:id`, `/revert-last`, `/export-logs` → 410; GIỮ danh sách / tạo / sửa / xoá / thống kê (`Customers.jsx`, `Registrations.jsx` còn gọi — GIAO-DIEN-2) | −125 |
| `orders.js` ghi `pos_registrations` (`:1318-1343`) | **GIỮ**: `docKhach` đọc đăng ký `pending` như khách ở mọi màn tra khách — không chỉ phục vụ SX. Ghi Phát hiện cho GIAO-DIEN-2 (luật "không tạo khách ở quầy") | 0 |
| `ketNoiKho.js` / `database.js` | bỏ `diaChiSX`; dòng khởi động bỏ "SX: …" (C6) | −8 |
| `index.js` | một hàm `sxDaNgat` (410 `{ error, code: 'SX_DA_NGAT' }`) gắn cho stock, sync, doi-chieu | +4 |
| Bảng `pos_stock_pending`, `pos_sync_logs`, `pos_registrations`, cột `ton_gan_nhat`/`ton_luc` | giữ nguyên dữ liệu (C4, Cấm) | 0 |

C6: sau việc này không còn dòng nào đọc `SX_API_URL`, `SX_API_URL_THU`, `SX_TIMEOUT_MS`, khoá SX (grep trong báo cáo). Chủ quán xoá các biến trên Render sau khi gộp.
`chuanHoaGio.js`, `donThu.js` (chỉ đọc lịch sử `pos_stock_pending`) — không cần sửa; `Reports.jsx` — không cần sửa (không gọi SX).

**Ước lượng máy chủ:** thêm ≈ banHang.js 170 · tinh.js +25 · products.js +55 · orders.js +10 · giuCho.js +6 · thanh-toan.js +8 · donApp.js +8 · manKhach.js −5 · duong.js +10 ·
duLieu.js +4 · 030/031 ~25 · index.js +4 ≈ **~325 dòng** (ngân sách 250–350); bớt ≈ 1.300 dòng SX.

## 3. Giao diện

| File | Việc | Dòng |
|---|---|---|
| `Kho/SanPham.jsx` | A5 màn đầy đủ của món: tên, nhóm (`category`), giá (gọi `PUT /products/price`), đơn vị, thứ tự, đang bán (ẩn / hiện), kiểu, công thức, hạn, ô "Cho bán khi thiếu nguyên liệu" (chỉ chủ quán thấy, chỉ kiểu pha tại chỗ); nút "Thêm món"; bỏ dòng "đặt giá ở Cài đặt › Sản phẩm" | +95 |
| `Kho/ChuaSan.jsx` (mới) + `Kho/index.jsx` | A7 tab "Món chưa sẵn sàng bán" + số đếm; mỗi dòng: lý do, nút mở món, nút "Ẩn" (dùng để ẩn Cam Tân Dưỡng, Công thức 4, TEST 1000, Liệu Trình 30 ngày sau gộp) | +65 |
| `Kho/DsPhieu.jsx`, `XemPhieu.jsx`, `duLieu.dsPhieu` | nhãn "Bán hàng" + mã đơn; danh sách phiếu mặc định ẩn phiếu bán, có bộ lọc "Bán hàng" (một đơn một phiếu — không đẩy phiếu kho khác khỏi 300 dòng) | +10 |
| `BanHang/BanHangMoi.jsx`, `BanHang/tinh.js` | B3 món `chua_cong_thuc` mờ + chữ "chưa có công thức", không thêm vào giỏ; lời "hết hàng trong kho SX" → "hết hàng" | +5 |
| `DonApp.jsx` | dòng `vao_vi` lý do hết hàng tô đỏ, lời B3c | +4 |
| `utils/api.js` | `productsApi.create`, `productsApi.update` trỏ đúng đường mới; bỏ `stockApi`, `syncApi` (không ai dùng) | ±6 |
≈ **~185 dòng**. Cấm: không đụng `Sales.jsx`, `BanHang/index.jsx`, `Settings.jsx`, `Customers.jsx`, `Layout.jsx`. Sau sửa `(cd client && npm run build)`, commit `client/dist/`.

## 4. Bài thử `cong_cu/thu_KHO3a.js` (~450 dòng) — ánh xạ nghiệm thu
Khuôn `thu_KHO2b.js`: `database.js` thật + libsql kho tạm, route thật (products, orders, thanh-toan, kh, kho), JWT theo vai trò, đồng hồ giả. KHÔNG thay `sxApi.js`
(bài phải thấy đúng file thật). Đếm `fetch` toàn cục = 0 trong mọi ca (C1, C2).

| Nghiệm thu | Ca (mỗi ca một vi phạm) |
|---|---|
| A1 | menu quầy = `/api/kh/menu` cùng tập món đang bán, đúng `sort_order`, đúng giá POS; món `is_active = 0` / giá 0 không bán (D2); trường trả ra BẰNG danh sách hợp đồng (`thu_HOPDONG_KH` canh) |
| A2 | `lam_san` 2 lô (1 hết hạn) → số = lô còn hạn; `pha_tai_cho` 3 nguyên liệu → số phần = min floor, tồn lẻ (gam) so SỐ TÍNH TAY; BẬT → `khong_quan_kho`; chưa công thức → `null` (không 999); `ton_cu false`, `ton_luc null` |
| A3 / A3b | món khoá SX bán, giá theo khoá; bước 031: 4 tên đổi đúng, tên thứ 5 (`juice`,4) KHÔNG đổi, tên đã sửa tay KHÔNG đổi, chạy lại 0 thay đổi |
| A5 | (tĩnh, đọc `client/dist`) màn Kho › Sản phẩm gọi `PUT /products/price`, không còn chữ "đặt giá ở Cài đặt"; sửa giá món khoá `pos` qua route giá → menu đổi giá. Bố cục: thử tay (E4) |
| A4 | tạo món (manage_settings) → khoá `pos`, bán được ngay khi có công thức; nhân viên tạo → 403; sửa tên / nhóm / thứ tự / ẩn → menu đổi; không có đường xoá (DELETE → 404) |
| A7 | `mon-chua-san` liệt kê đúng: chưa kiểu, công thức rỗng, làm sẵn hết lô (có lô hết hạn), KHÔNG liệt kê món đủ; số đếm đúng |
| B1 | FEFO 2 lô khác hạn → trừ lô hạn gần; lô hết hạn không bán; đủ đúng bằng số cần → qua; thiếu 1 → 400 `HET_HANG` (ngay trên / ngay dưới); lời "Không đủ hàng: …" |
| B2 | TẮT + thiếu → 400 `THIEU_NGUYEN_LIEU` nêu tên nguyên liệu; BẬT + thiếu → qua, dòng `lo_id NULL` âm, Tồn kho `am: true`; công thức lồng triển khai đúng; hai món chung nguyên liệu trong MỘT giỏ cộng dồn (từng món đủ, cả giỏ thiếu → chặn) |
| B3 | `chua_dinh_luong` / không dòng kho / công thức rỗng → `CHUA_CO_CONG_THUC`, không ghi gì; menu `sellable false`, App không thấy |
| B3b | phiên A giữ chai cuối → menu quầy + App `con_hang false`, phiên B / App / POST trực tiếp bị `HET_HANG`; A huỷ → B được; A hết hạn (lùi đồng hồ) → B được; A trả trong hạn khi A giữ CHAI CUỐI → chốt được (phần giữ của chính A không chặn A — soát 4a); xác nhận tay QR quầy sau hạn khi phiên khác đang giữ chai cuối → `HET_HANG` (soát 4b); hai phiên song song tranh chai cuối (Promise.all thật) → đúng một giữ được |
| B3b App | tạo đơn App khi món `THIEU_NGUYEN_LIEU` → App `HET_HANG` + `ma` đúng; `CHUA_CO_CONG_THUC` → `MON_KHONG_BAN` + `ma`; giữ bằng thân App dạng khoá SX VÀ thân dạng `product_id` đều chiếm phần giữ; màn khách thấy "hết" ngay sau khi phiên khác giữ (không chờ 20 s) |
| B3c | lô bị phiếu phát sinh trừ sau khi A giữ → tiền QR về đúng hạn: KHÔNG đơn, ví +đúng số, gửi báo hai lần cộng MỘT lần, `thong_bao_tien_ve` có tên món, quầy `vao_vi` có lý do; phiên quầy QR có SĐT → vào ví; không SĐT → `chua_khop` "HOÀN TIỀN TAY", ví không đổi |
| B4 | đơn có trừ kho → đúng một phiếu PS `ban_hang` `da_duyet` nối `don_hang_id`; đọc được qua `GET /kho/phieu/:id`; ghi hai phiếu cùng đơn → khoá duy nhất chặn |
| B5 | huỷ đơn chưa pha → tồn về đúng lô; đơn giao "Bỏ đi" → tồn không đổi, phiếu ghi hao hụt; hai lần huỷ song song → trả kho MỘT lần; xoá đơn completed → trả kho; xoá đơn đã huỷ → không trả thêm; huỷ đơn CŨ không phiếu → không lỗi |
| B6 | mỗi lối (phiên tiền mặt, QR webhook, PIN tài khoản, App, màn khách, xác nhận tay muộn, POST trực tiếp) → đúng một phiếu; `tinh-thu` → 0 phiếu, tồn không đổi |
| B7 | ném lỗi giả giữa `truKhoDon` (móc CSDL) → không đơn, không phiếu, ví không đổi |
| B8 | nhân viên / quản lý bật `cho_ban_thieu` → 403; mặc định TẮT (ca không truyền trường); chủ quán bật → hiệu lực ngay |
| C1/C2/C6 | `SX_API_URL` không đặt / rác / trỏ cổng không trả lời → khởi động, menu, đơn, huỷ chạy, 0 `fetch`, không log "SX"; grep tĩnh `server/` không còn `SX_API_URL`, `outStockFIFO`, `checkStock`, `inStockReturn` |
| C3/C4/C5 | sao lưu Excel không gọi SX, có `pos_products` tên POS; `GET /so-no` = 0 dù `pos_stock_pending` có 45 dòng `pending` (dữ liệu giữ nguyên); `/sync/*`, `/stock`, `/doi-chieu`, `/registrations/export/csv` → 410 `SX_DA_NGAT`; `/registrations` (danh sách) vẫn 200 |
| D1 | kho TRỐNG: mọi món → `CHUA_CO_CONG_THUC`, 0 dòng ghi, không 500; kho ĐỦ: tiền mặt, QR, PIN, giao hàng, App, màn khách đều 200 |
| D3 | phiếu pha chế cộng lô → bán trừ được lô đó; đơn mua gói / thẻ / nạp (không món kho) KHÔNG bị chặn; giá nguyên liệu 0 / trống vẫn bán (dữ liệu 18.11) |
| Dữ liệu 18.11 | Cà Phê Đen `pha_tai_cho` 16 g "Cà phê": tồn 47,999 g → 2 phần (không 3); 48 g → 3 phần; bán 3 ly khi còn 47 g, TẮT → chặn |

**Đường song song (K4):** `kiemDuHang` gọi ở 2 chỗ (taoPhien trong giao dịch, `truKhoDon` trong giao dịch) — MỘT hàm; tra món của `than.items` = hàm `timMon` của taoDon; `huyPhieuBan` ở huỷ và xoá;
`tonMenu` dùng chung cho quầy, `/api/kh/menu`, màn khách, đơn App (`dungItems`) — vì cùng `layMenuQuay`; ba khối `pos_stock_pending` + ba khối SX sau commit trong `orders.js`
(grep `outStockFIFO|inStockReturn` = 3 chỗ); `ly_do` mã kho ở `chotPhien` và `xuLyTienVe` (`vaoViDuoc` ba chỗ dùng).

**Luồng hợp lệ phải KHÔNG bị chặn (K5):** đơn chỉ gói / thẻ / nạp · lấy món từ gói (món thật vẫn trừ kho) · mua gói rồi lấy ngay · đơn giao · món khoá SX cũ · món mới khoá `pos` ·
món BẬT cho_ban_thieu khi nguyên liệu âm · chốt phiên trong hạn khi phiên KHÁC đang giữ phần còn lại · huỷ / xoá đơn cũ trước gộp (không phiếu) · nguyên liệu chưa giá ·
`tinh-thu` báo giá App khi kho trống (vẫn báo giá, chặn ở bước tạo phiên).

**Đột biến** (`viec/KHO-3a/dot_bien.py`, tên đầy đủ, chạy từng tên, có đối chứng): `VS-FEFO-HAN-XA-TRUOC` · `VS-LO-HET-HAN-VAN-BAN` · `VS-NGUONG-LON-HON-BANG` ·
`BV-KIEM-CA-GIO` (về từng dòng) · `BV-CHUA-CONG-THUC` · `VS-CHO-BAN-THIEU-MAC-DINH-BAT` · `BV-CHO-BAN-THIEU-CHU-QUAN` · `BV-GIU-HANG-TRONG-TX` (kiểm ngoài giao dịch) ·
`VS-GIU-HANG-TINH-CA-PHIEN-MINH` · `BV-CHOT-MUON-BO-QUA-GIU` · `BV-APP-MA-HET-HANG` · `BV-TRU-TRONG-TX` (trừ sau commit) · `BV-TINH-THU-KHONG-TRU` · `BV-HUY-MOT-LAN` (bỏ `AND trang_thai = 'da_duyet'`) ·
`VS-BO-DI-VAN-TRA-KHO` · `BV-LUOI-VAO-VI-QUAY` · `VS-MENU-SO-PHAN-LAM-TRON-LEN`.

**Ước lượng thử:** `thu_KHO3a.js` ~450 dòng (ngân sách ~400) — vượt vì B3c + B6 nhiều lối vào.

## 5. Bài thử cũ + giả lập (E3, D4) — theo trả lời Câu 1
- **Một hàm dựng món thử chung** `cong_cu/gia_lap/monThu.js` `dungMonThu(csdl)` (~30 dòng): mọi `pos_products` đang bán chưa có dòng kho → kiểu `lam_san`, công thức
  1 nguyên liệu "NL thử", một lô thành phẩm qua `taoPhieuXuat(tuDuyet)` THẬT của KHO-2a (không chèn tay vào bảng). Chạy trong kho thử tạm của từng bài.
- Mỗi bài cũ cần món để bán: **CHỈ thêm 1 dòng** gọi hàm sau khi bài dựng món. KHÔNG thêm ca kiểm phiếu kho vào bài cũ (kiểm ở `thu_KHO3a.js`).
  KHÔNG có cờ / biến / đường nào tắt luật bán theo kho khi chạy kiểm.
- SX giả trong 29 bài: `orders.js` / `products.js` thôi `require('../utils/sxApi')` → các móc `require.cache[sxApi]` thành vô hại, KHÔNG xoá (giữ "chỉ thêm 1 dòng").
- Bài KHẲNG ĐỊNH hành vi SX (vd `thu_HUY1` đếm `inStockReturn`, `thu_P26c` sổ nợ / `doSoNo`, `thu_UUDAI1` F3 đếm `checkStock`, `thu_KHO1` menu từ SX,
  `thu_KHMUA1` C10 SX báo hết hàng, `thu_KHAPI3` / `thu_KHSDT1` `ton_cu`) → sửa đúng ca đó theo hành vi mới (bài sửa thường: bản mới ĐỎ trên gốc, `SỐ CA`).
  Danh sách chốt ở bước 4 bằng cách CHẠY từng bài gốc trên code mới (LUAT §6.9) — ghi vào `trang_thai.md`.
- Giả lập: bỏ SX giả (`chay.js:166-192`), gọi `dungMonThu` khi dựng kho; bất biến I7 (vân tay SX) → I7 mới "mỗi đơn `completed` có đúng một phiếu bán `da_duyet`,
  Σ dòng thành phẩm = Σ SL món làm sẵn; đơn huỷ (không bỏ đi) / xoá → phiếu `huy`; lô thành phẩm không âm". KB24–KB25 (SX lỗi / đẩy sổ nợ) → KB24 làm sẵn hết lô
  bị chặn, KB25 pha tại chỗ thiếu nguyên liệu TẮT chặn / BẬT bán ghi âm + món chưa công thức bị chặn (D4). Số KB và số bất biến KHÔNG giảm (bánh cóc S2).
- `kiem_tra_truoc_khi_giao.js` (E3, K8 — chỉ đổi phép canh đường SX): **K2** ca 1–3 bỏ vế `diaChiSX` → thay bằng "`ketNoiKho` không xuất `diaChiSX`" (canh "không gọi SX");
  **K1** giữ nguyên (vẫn cấm đọc `SX_API_URL` ngoài `ketNoiKho.js` — sau việc này là cấm mọi nơi); thêm `chayBaiThat('cong_cu/thu_KHO3a.js')` cạnh `:818`;
  thêm phép tĩnh "server/ không còn `outStockFIFO|inStockReturn|checkStock(`|`products-with-stock`" (E13 — kiểm mẫu nguy hiểm VẮNG MẶT). Không phép nào khác đổi.

## 6. Phạm vi — đối chiếu
Mọi file ở mục 2–5 nằm trong `## Phạm vi`. Xoá file (`stock.js`, `doi-chieu.js`, `sync.js`, `utils/doSoNo.js`) đều trong danh sách. `server/routes/kh/**`, `khachAuth.js`,
`Settings.jsx`, `Customers.jsx`, `Layout.jsx`, `Sales.jsx`, `BanHang/index.jsx`, bước nâng cấp cũ — KHÔNG đụng. `orders.js`: chỉ đoạn kiểm tồn, trừ kho, huỷ, xoá.
`components/DonAppNoi.jsx` không trong Phạm vi → dải đơn App giữ nguyên, dòng `vao_vi` đã hiện ở đó (không sửa).

## 7. Dữ liệu thật 18.11 — kế hoạch tính theo
- 32 nguyên liệu (20 chưa giá), 9 món `lam_san` có công thức, CHƯA lô → sau gộp 9 món này hiện "Hết hàng" tới khi có phiếu pha chế / nhận hàng.
- Giá nguyên liệu 0 / trống KHÔNG là điều kiện bán: `truKhoDon` ghi `don_gia NULL`, giá vốn lô `NULL` như KHO-2a — có ca D3.
- Cà Phê Đen: `pha_tai_cho`, 16 g "Cà phê" (chat tạo nguyên liệu qua màn Kho) — ca "Dữ liệu 18.11" phía trên.
- Cam Tân Dưỡng, Công thức 4, TEST 1000, Liệu Trình 30 ngày: hiện ở A7 "chưa sẵn sàng" (chưa công thức) → chủ quán bấm "Ẩn" sau gộp.
- C3 sao lưu Drive (Apps Script, SAOLUU-DEM-1): máy không chạy được Apps Script — chỉ kiểm đường Excel / JSON của `backup.js`; Drive ghi CHƯA KIỂM.
- A3b so MỌI tên: chat đã so (mục 10.3) — chỉ 4 món juice 5–8 lệch.
- **Điều kiện gộp** (ghi lại ở báo cáo cuối): GIAO-DIEN-2 đã gộp (bỏ nút "Hoàn kho SX"); mọi món đang bán đã có kiểu + công thức (Cà Phê Đen có công thức 16 g);
  9 món làm sẵn đã có lô; 4 món kể trên đã ẩn hoặc chấp nhận hiện mờ.

## 8. Trả lời của chủ quán (18.11) — đã đưa vào kế hoạch
- **Câu 1:** đồng ý MỘT hàm dựng món thử chung (công thức + lô) trong kho thử tạm của từng bài; mỗi bài cũ CHỈ thêm 1 dòng gọi hàm. KHÔNG thêm ca kiểm phiếu kho vào bài cũ —
  kiểm phiếu kho ở `thu_KHO3a.js`. KHÔNG có cờ / đường nào tắt luật bán theo kho khi chạy kiểm. → mục 5.
- **Câu 3:** không làm gì với nút "Hoàn kho SX" trong việc này; nút bỏ ở GIAO-DIEN-2, gộp TRƯỚC KHO-3a. → máy chủ chỉ thôi gọi SX: `return_stock` trả 400
  `HOAN_KHO_SX_DA_BO`, không ghi gì (mục 2.7); không dựng "hoàn về kho POS".
- **Câu 4:** giữ chặn như hiện nay trong KHO-3a. Sửa phiếu đã bán (phiếu điều chỉnh chênh lệch, quản lý → chờ chủ quán duyệt, chủ quán cấp quyền tự duyệt, ghi nhật ký)
  làm ở KHO-3b. → phiếu bán (PS `ban_hang`) KHÔNG sửa / huỷ tay được: `huyPhieu` / `suaPhieu` của Kho trả 409 `PHIEU_BAN_HANG` cho phiếu `su_co = 'ban_hang'` (chỉ huỷ đơn mới huỷ phiếu);
  `loThanhPhamDaBiTru` (`duLieu.js:247-249`) tiếp tục chặn huỷ / sửa phiếu pha chế khi lô đã bị bán — đúng "giữ chặn như hiện nay".
- **Câu 2:** bản ghi của phiên trước đã mất cùng máy cũ; chưa thấy trả lời trong tin nhắn 18.11. Nếu Câu 2 đã có trả lời, nhờ chat dán lại — máy đối chiếu với mục 2–5.

## 8b. Soát kế hoạch bằng agent chỉ đọc (18.11) — đã sửa vào các mục trên
1. Phạm vi / Cấm: không lệch. Lưu ý: kế hoạch đụng `DELETE /orders/:id` (`orders.js:1916`) — chỉ phần trả kho khi xoá, cùng loại "trừ kho / huỷ"; chat soát xác nhận.
2. Ngắn hơn: bỏ kiểm trước giao dịch trong taoDon → đã bỏ (2.4).
3. Ca thiếu: A5, B3b phía App (mã THIEU_NGUYEN_LIEU / CHUA_CO_CONG_THUC) → đã thêm; A3b so mọi tên + C3 Drive → CHƯA KIỂM (mục 7).
4. Đường song song: (a) phiên tự chặn chính mình lúc chốt; (b) chốt muộn bỏ qua phần giữ phiên khác; (c) App nhận `DON_KHONG_HOP_LE` thay `HET_HANG`; (d) hai dạng món
   trong `than.items`; (e) bộ nhớ 20 s màn khách → đã sửa ở 2.1, 2.4, 2.5 và thêm ca ở mục 4.

## 9. Phát hiện (ngoài Phạm vi — không sửa)
1. CLAUDE.md §5.3 ("`checkStock` bọc try/catch chỉ log là chủ ý") hết đúng sau việc này — đề nghị chat sửa câu.
2. Hợp đồng `/api/kh` không có đường POS nhờ App gửi thông báo đẩy khi hoàn tiền vì hết hàng — thư `viec/KHO-3a/TRA_LOI_POS_KHO3a.md` cho App KH.
3. `orders.js` vẫn ghi `pos_registrations` cho `is_new_customer` (quầy mới không gửi cờ này) — GIAO-DIEN-2 xét cùng luật "không tạo khách ở quầy".
4. `client/src/utils/api.js` khai `productsApi.get/update/toggle/updatePrice` trỏ đường máy chủ không có — việc này nối `create`/`update` vào đường mới; `get/toggle/updatePrice` bỏ (không ai gọi).

## 10. Cập nhật sau soát chat 18.11 18:50 (chủ quán DUYỆT) — mục này THẮNG các mục trên khi lệch

### 10.1 Nền mới: ghép main bc16e140 (BO-MAN-CU-1) → HEAD 7b8b1dbb. Số dòng `orders.js` đọc lại (2076 dòng):
| Chỗ | Dòng mới |
|---|---|
| `taoDon` = CỬA CHẶN (gói → `GOI_TAM_DUNG`; đường thẳng chỉ tiền mặt) | `orders.js:188-207` |
| Thân cũ `taoDonGoc` | `orders.js:209` |
| Khối `checkStock` trong vòng món (bỏ) | `orders.js:447-462` |
| Nhánh `chiTinh` trả tổng | `orders.js:989` |
| Mở giao dịch / `sauGhiDon` / ghi `pos_order_items` | `orders.js:1041`, `:1121`, `:1130-1140` |
| `truKhoDon` đặt NGAY SAU vòng ghi `pos_order_items`, TRONG thân `taoDonGoc` | `orders.js:~1141` |
| Khối `outStockFIFO` + nợ kho sau commit (bỏ) | `orders.js:1305-1334` |
| Đăng ký khách mới (giữ) | `orders.js:1336-1361` |
| Huỷ: giao dịch / đọc món / hoàn kho SX sau commit (bỏ) | `orders.js:1735`, `:1860`, `:1877-1905` |
| Xoá: giao dịch / đọc món / hoàn kho SX (bỏ) | `orders.js:1947`, `:1967`, `:2036-2064` |
- KHÔNG thêm lời gọi `taoDon(` mới (thu_BOMANCU1 K2 khoá đúng 6 lời gọi). `truKhoDon` ở thân `taoDonGoc` → bài cũ dựng "đơn cũ" qua `cong_cu/gia_lap/donCu.js`
  (gọi `taoDonGoc`) cũng trừ kho → cần `dungMonThu` như bài khác (1 dòng).
- `truKhoDon` nhận `orderItems` (đã tra món, `product_id > 0` = món thật; dòng gói / thẻ / nạp có `product_id < 0` → bỏ qua) — không tra lại.
- K5 mục 4: "lấy món từ gói", "mua gói rồi lấy ngay" không còn ở quầy (tạm ngưng) → chỉ giữ ca qua `donCu` nếu bài cũ cần; không ca mới.
- Chạy song song, KHÔNG sửa: GIAO-3 (`giaoHang.js` phần Ahamove — hàm huỷ `kiemHuyDonGiao` / `chotHuyGiao` chỉ ĐỌC, không sửa; `utils/doiSoat.js`,
  `routes/reports.js`, `Reports.jsx`, `DoiSoat.jsx`); TIEN-KHOA-2 (`orders.js` route pay-debt, `wallets.js`, `don-mo-rong.js`, `api.js` dòng deduct).
  → `api.js`: chỉ thêm `productsApi.create/update`, KHÔNG bỏ `stockApi`/`syncApi` (bớt đụng file chung; ghi Phát hiện).

### 10.2 K4 — mọi chỗ đọc `kho_phieu` và phiếu bán (`PS`, `su_co = 'ban_hang'`)
| Chỗ (grep `kho_phieu[^_]` trong server/, trừ bước 001–007) | Xử lý phiếu bán | Ca |
|---|---|---|
| `kho/duLieu.js:111` `conLaiTheoLo` (còn lại theo lô) + `:115` `COT_TON_NL` (tồn nguyên liệu) — Tồn kho, Pha chế, chia lô | **TÍNH** (đó là việc trừ kho) | E1 B1/B2 tồn sau bán |
| `duLieu.js:153` số phiếu kế (`PS-…`) | TÍNH — dùng chung dãy PS | B4 số phiếu liên tiếp |
| `duLieu.js:159` `themPhieu` | ghi phiếu bán (thêm `don_hang_id`) | B4 |
| `duLieu.js:223,242-255` duyệt / từ chối (`cho_duyet` mới đổi) | phiếu bán luôn `da_duyet` → 409 như cũ, không đổi | — |
| `duLieu.js:260` `loThanhPhamDaBiTru` | TÍNH: lô pha chế đã bị bán → chặn huỷ / sửa phiếu pha chế (giữ chặn như hiện nay — Câu 4) | ca "huỷ PX sau khi bán từ lô → 409 LO_DA_BI_TRU" |
| `duLieu.js:268` `huyPhieu` (route `/phieu/:id/huy`) | **LOẠI**: phiếu bán → 409 `PHIEU_BAN_HANG` (chỉ huỷ đơn mới huỷ phiếu) — ĐỔI hành vi | ca |
| `duLieu.js:277` `suaPhieu` + `duong.js:309` sửa theo loại | **LOẠI**: phiếu bán → 409 `PHIEU_BAN_HANG` — ĐỔI | ca |
| `duLieu.js:286` `ghiKetQua` (chỉ `PX`) | không chạm | — |
| `duLieu.js:312` `docPhieu` → `docPhieuNhap` (PS) | đọc được (dòng `ban`, tên, lô) + `don_hang_id` | B4 |
| `duLieu.js:341,350` chuỗi đơn / phần còn lại đơn DH (lọc `PN`) | loại sẵn | — |
| `duLieu.js:400` `dsPhieu` | **LOẠI mặc định** (`su_co IS NOT 'ban_hang'`), lọc `?ban_hang=1` mới hiện — ĐỔI | ca |
| `duong.js:239` `timMaGui` (`ma_gui`) | phiếu bán `ma_gui NULL` — không đụng | — |
| `duong.js:270` in phiếu (`so_lan_in`) | cho in như phiếu khác | — |
| `nhapHang.js:51` đơn của phiếu nhận (lọc `DH`) | loại sẵn | — |
| `nhapHang.js:79` "hay mua" (lọc `PN`) — gợi ý nhập hàng | loại sẵn; tồn trong gợi ý nhập = `docTon` → TÍNH | ca "goi-y-nhap: tồn sau bán, hay_mua không đổi" |
| `nhapHang.js:86` đơn mở (lọc `DH`) | loại sẵn | — |
| `phatSinh.js:78` hạn mức nội bộ (lọc `su_co = 'noi_bo'`) | loại sẵn (bán không ăn hạn mức) | ca "PS nội bộ = hạn mức sau khi đã bán nhiều → vẫn tự duyệt" |
| `phatSinh.js:15,23,50` gợi ý / lô phát sinh (`conLaiTheoLo`) | TÍNH (lô đã bán hết không còn gợi ý) | ca "gợi ý hết hạn không có lô đã bán hết" |
| `phatSinh.js:116` lô âm khi duyệt PS | TÍNH | — |
| `utils/khoiPhuc.js:30` "kho trống" khi khôi phục | TÍNH (đã có phiếu bán = kho không trống → không khôi phục kho, như mọi phiếu) | — |
| `routes/backup.js:144` sao lưu `kho_phieu` `SELECT *` | cột `don_hang_id` tự đi theo; khôi phục vào kho trống giữ `don_hang_id`, khoá duy nhất vẫn còn | ca "sao lưu → khôi phục kho trống: don_hang_id giữ, ghi trùng đơn bị chặn" |
| `utils/giuCho.js:39` | chỉ chú thích | — |

### 10.3 Câu 2 · A3b · dữ liệu
- Câu 2 (chốt muộn khi đã hết hàng): trả lời bằng B3c của phiếu — mục 2.6 đúng ý, không hỏi lại.
- A3b: chat đã so trên POS thật 18.11 — ngoài juice 5–8, tên `pos_products` TRÙNG tên SX đang hiện (Hồng Tân Sinh, Lục Tân Khí, TEST 1000, Dưỡng Nhan Lộ,
  Ngọc Thanh Lộ, An Mi Lộ, Cà Phê Đen). Cam Tân Dưỡng, Công thức 4, Liệu Trình 30 ngày không có trên menu SX → ẩn sau gộp (A7). **Bỏ dòng CHƯA KIỂM A3b.**
- Dữ liệu thật (chat nhập lại 18.11 17:35): 33 nguyên liệu (thêm "Cà phê"), giá đều 0; 9 món làm sẵn có công thức, chưa lô; Cà Phê Đen pha tại chỗ 16 g.
- Bước nâng cấp giữ số 030 / 031 (GIAO-3 cũng thêm một bước — việc gộp sau đổi số khi ghép main).

### 10.4 Đo trước / sau (chat mục 6)
Giả lập S4 (thời gian chạy riêng) và thời gian tạo đơn qua phiên ("Đã nhận tiền" = taoPhien + chotPhien tiền mặt) — đo trên gốc 7b8b1dbb và trên HEAD,
ghi `trang_thai.md`; tăng > 30 % thì ghi rõ và báo.
