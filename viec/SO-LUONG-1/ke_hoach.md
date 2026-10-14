# SO-LUONG-1 — kế hoạch (CHỜ DUYỆT — chưa viết bài thử, chưa sửa code)

Số dòng dưới đây đọc trong lượt này trên HEAD `b823f72` (= main `551319d` sổ việc v30 + phiếu).

## 0. Hiện trạng đọc được (K1 — file:dòng lượt này)

| Chỗ | Đang làm |
|---|---|
| `orders.js:310–313` | `const sl = Number(item.quantity)`; CHỈ khi `item.from_package` mới kiểm nguyên ≥ 1 → 400 `GOI_SL_KHONG_HOP_LE`. Món lẻ: `sl` = 0,5 / −1 / NaN đi tiếp vào `itemTotal = unitPrice * sl` (:366–367) → tiền đơn giảm. |
| `orders.js:316–325` | `checkStock(…, item.quantity)` đọc số thô, bọc `try/catch` chỉ log (CLAUDE.md §5.3) — không đổi. |
| `orders.js:389, 399–412` | `let soLuotGoi = 0;` … `const pkgQty = package_buy.pkg_qty \|\| 1;` → `subtotal += pkg.price * pkgQty` (:401), dòng gói `quantity: pkgQty` (:407). `0.002` → 3.000đ cho gói 300.000đ; `0` / `""` / `null` → 1 (vì `\|\|`). |
| `orders.js:1019–1022` | lần HAI cùng biểu thức `const pkgQty = package_buy.pkg_qty \|\| 1;` → vòng `for (i < pkgQty)` tạo gói khách (K4 — đường song song của :400). Điều kiện :1019 (`package_buy && package_buy.package_id && phone`) là tập con của :399. |
| `orders.js:31` | `const router = express.Router();` — chỗ đặt hàm dùng chung của file. |
| `Sales.jsx:715, 748, 752` | gửi `quantity: item.quantity` (chỉ ±1 qua `updateQuantity`, :528–553 — không có ô gõ tay), `pkg_qty: cart.find(c => c.is_pkg).quantity \|\| 1`, `membership_buy: { tier_id }`. Luôn số nguyên ≥ 1 → **màn hình không đổi**. |
| `api.js:363` | `ordersApi.create` là nguồn gọi POST /orders DUY NHẤT của màn hình; `server/routes/*` không route nào gọi tạo đơn (don-mo-rong.js chỉ GET / đổi cách trả; packages.js đã bỏ POST /buy). |
| `products.js:101` | đơn vị chỉ `gói` / `túi` (theo category); không có kg / cân trong code → không gặp điều kiện DỪNG của phiếu. Dữ liệu thật trên Turso **chưa đọc** (CHƯA KIỂM). |
| `thu_GOI1.js:268–269` A2j | đòi `code === 'GOI_SL_KHONG_HOP_LE'` cho món LẤY TỪ GÓI SL âm / 0 / lẻ → mã này phải GIỮ cho món từ gói (file ngoài Phạm vi). |
| `thu_GOI1.js:276–281` A2k | SL dạng chuỗi `" 5"` khi mua + lấy ngay phải ĐƯỢC nhận (K5 — `Number(" 5") = 5`). |
| `viec/GOI-1/dot_bien.py:40–41` | `BV-GOI1-SL-AM`, `VS-GOI1-SL-AM-CHI-0` neo NGUYÊN dòng `if (item.from_package && !(Number.isInteger(sl) && sl >= 1)) {` — gom về một hàm là dòng này biến mất → hai đột biến "không áp được" (xem Câu hỏi 1). |
| `viec/P26c/dot_bien.py:82–83, 94–95` | neo `if (orderItems.reduce(… > soLuotGoi) {` và `soLuotGoi = Number(pkg.total_qty) \|\| 0;` — KHÔNG đụng. `VS-GOI1-SL-GHI-GOC` neo `quantity: sl,\n unit_price: unitPrice,` — KHÔNG đụng. |
| `thu_P26c.js` trên gốc | 84 đạt · 0 hỏng, chạy 3 s (đo lượt này). Dòng tổng `${dat} đạt · ${hong} hỏng` (:749) → `SỐ CA` = đạt + hỏng. Chưa có ca nào gửi `membership_buy` (chỉ INSERT thẳng `pos_membership_purchases`). |

## 1. Một hàm kiểm, hai chỗ gọi — `server/routes/orders.js` (A1, A2, A3) ~+8 / −4 dòng

**Phương án A (chọn):**
- Cạnh `const router = express.Router();` (:31), một dòng:
  `const soNguyenDuong = (x) => Number.isInteger(Number(x)) && Number(x) >= 1;` + 1 dòng chú thích (SO-LUONG-1, lý do: quán bán theo ly / túi / hộp).
- :310–313 → giữ `const sl = Number(item.quantity);`, THAY phép `if (item.from_package && …)` bằng MỘT phép cho mọi món:
  `if (!soNguyenDuong(sl)) return res.status(400).json({ error: \`Số lượng của ${product.name} phải là số nguyên từ 1\`, code: item.from_package ? 'GOI_SL_KHONG_HOP_LE' : 'SL_KHONG_HOP_LE' });`
  — một chỗ kiểm (A3), mã cũ giữ cho món từ gói (thu_GOI1 A2j), mã mới `SL_KHONG_HOP_LE` cho món lẻ để bài thử so mã, không dò chữ (E12). Chú thích GOI-1 (:307–309) sửa 1 dòng cho đúng.
- :389 `let soLuotGoi = 0;` → thêm `let pkgQty = 1;` cùng dòng. :400 → `pkgQty = Number(package_buy.pkg_qty ?? 1);` + `if (!soNguyenDuong(pkgQty)) return res.status(400).json({ error: 'Số gói mua phải là số nguyên từ 1', code: 'SL_KHONG_HOP_LE' });`
  — `??` thay `||`: thiếu / `null` → 1 (như nay, phiếu A2); `0` / `""` → 400 (trước đây thành 1 — đổi hành vi có chủ ý, màn hình không gửi hai giá trị này).
- :1020 XOÁ `const pkgQty = package_buy.pkg_qty || 1;` — dùng biến đã kiểm ở :400 (một nguồn; :1019 là tập con của :399 nên luôn có giá trị).
- `checkStock(…, item.quantity)` giữ (chỉ báo, đã qua kiểm). Không đổi màn hình, không đổi cấu trúc, không đổi `server/utils/`.

**Phương án B (bỏ):** thêm phép kiểm món lẻ RIÊNG dưới phép GOI-1, giữ nguyên dòng :311 để neo GOI-1 còn áp được. +3 dòng, hai phép cùng việc trong 4 dòng — trái A3 "một chỗ" và định hướng 2 (đơn giản).
**Phương án C (bỏ):** `pkg_qty` trần ≤ 20. Phiếu để chủ quán chốt; không có số liệu bán gói thật để chọn trần → chưa thêm, chờ chốt (Câu hỏi 2). Thêm sau chỉ là `&& pkgQty <= TRAN` + 1 ca.

Rủi ro: (1) `Number(true) = 1`, `Number([2]) = 2` qua được — không mất tiền, không chặn thêm cho khỏi phình; (2) hai đột biến GOI-1 lạc (Câu hỏi 1).

## 2. Bài thử — `cong_cu/thu_P26c.js` mục mới `[S]` trước `sv.close()` ~55–60 dòng, ~16 ca

Ánh xạ 1-1 với `## Nghiệm thu` (số tiền ghi trong tên ca; so `status` / `code` / số đếm, không dò chữ):

| Nghiệm thu | Ca | Trên gốc |
|---|---|---|
| A1 chặn | S1a–S1e: `[mon(2) ×1 (50.000), mon(0) ×v]` với v = `0`, `−1`, `0.5`, `"2a"`, `""` → 400 `SL_KHONG_HOP_LE`, `COUNT(pos_orders)` và `COUNT(pos_stock_pending)` không đổi (5 ca, mỗi giá trị một ca). `cash_amount` gửi = số tiền SAI mà gốc tự tính (50.000 / 25.000 / 62.500 / 50.000 / 50.000) vì :773 đòi tiền trả khớp tổng — gửi 75.000 thì gốc cũng 400 (lý do khác) → xanh oan (K3); `"2a"` → tổng NaN, :773 `NaN > 1` sai → gốc vẫn tạo đơn | ĐỎ (gốc tạo đơn 62.500đ / 25.000đ / 50.000đ / NaN) |
| A1 K5 | S1f: `quantity: 2` → 200, `total = 50.000`; S1g: `quantity: "2"` → 200, `total = 50.000` (2 ca) | xanh (hồi quy) |
| A2 chặn | S2a–S2d: `package_buy.pkg_qty` = `0`, `0.002`, `−1`, `1.5` → 400 `SL_KHONG_HOP_LE`, không thêm `pos_customer_packages`, ví không đổi (4 ca) | ĐỎ (0,002 → 200, tổng 600đ; 0 → 1 gói) |
| A2 K5 | S2e: thiếu `pkg_qty` → 200, 1 gói, `total = 300.000`; S2f: `pkg_qty: 2` → 200, 2 gói khách, `total = 600.000` (2 ca) | xanh (hồi quy) |
| A3 | S3: lấy từ gói `quantity: 0.5` → 400 `GOI_SL_KHONG_HOP_LE`, giao không đổi (1 ca; thu_GOI1 A2j/A2k là ca cũ vẫn phải xanh) | xanh (hồi quy — khoá mã cũ còn giữ) |
| A4 | = S1c (0,5): đột biến `BV-SOLUONG1-MON` bỏ phép → tiền giảm → S1c đỏ | — |
| A5 K5 | S4a: bán 10 ly `mon(0, 10)` → 200, `total = 250.000`; S4b: `items: [mon(0)]` + `membership_buy: { tier_id: 1 }` (Vàng, `card_price` đọc từ `pos_membership_tiers`) → 200, `total = 25.000 + card_price` (2 ca). Mua 1 gói, lấy từ gói: ca cũ A2b, A2e, A6a của P26c + thu_GOI1 | xanh (hồi quy) |

Ca "hai người cùng bấm": phép kiểm xảy ra TRƯỚC giao dịch trên dữ liệu của chính yêu cầu (không đọc kho) → không có tranh chấp; không thêm ca giả.
`bang_chung_do.txt`: đầu ra gốc (S1a–S1e, S2a–S2d đỏ) + `SỐ CA cong_cu/thu_P26c.js: 100` (84 + 16, chép lại số thật sau khi chạy trên code đã vá).

## 3. Đột biến `viec/SO-LUONG-1/dot_bien.py` (khuôn GOI-2 + ĐỐI CHỨNG của TOC-DO-1)

Runner: chép `server/` ra thư mục tạm, `node cong_cu/thu_P26c.js --may-chu <bản sao>`; ĐỐI CHỨNG trước: bản sao chưa đột biến phải `0 hỏng`.

| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| :311 phép món | `BV-SOLUONG1-MON` (`if (!soNguyenDuong(sl))` → `if (false)`) | S1c (0,5 — A4) |
| | `VS-SOLUONG1-MON-CHI-TU-GOI` (`if (item.from_package && !soNguyenDuong(sl))` — hành vi cũ GOI-1) | S1c |
| | `VS-SOLUONG1-MON-CHI-AM` (`if (sl < 0)`) | S1c |
| | `VS-SOLUONG1-MON-MOT-MA` (bỏ ternary, luôn `SL_KHONG_HOP_LE`) | S3 |
| :400 phép gói | `BV-SOLUONG1-GOI` (`if (!soNguyenDuong(pkgQty))` → `if (false)`) | S2b (0,002 → 600đ) |
| | `VS-SOLUONG1-GOI-HOAC-1` (`?? 1` → `\|\| 1`: 0 thành 1 gói) | S2a (0) |
| | `VS-SOLUONG1-GOI-LAM-TRON` (`Math.round(Number(…))`) | S2d (1,5 → 2 gói 600.000đ) |
| :1020 gom biến | **không đột biến được**: dựng lại `const pkgQty = package_buy.pkg_qty \|\| 1;` tại :1020 cho kết quả Y HỆT vì :400 đã chặn mọi giá trị khác số nguyên ≥ 1 trước đó (:1019 ⊂ :399). Ghi CHƯA KIỂM bằng đột biến; khoá bằng S2f (2 → 2 gói). |
| GOI-1 lạc | `BV-GOI1-SL-AM`, `VS-GOI1-SL-AM-CHI-0` DỰNG LẠI ở đây trên dòng mới (như GOI-2 làm với 4 đột biến P26c lạc, Q-F) — bắt bằng `thu_GOI1.js` A2j (runner `thu`) | A2j |

Chạy lại `viec/P26c/dot_bien.py`, `viec/GOI-2/dot_bien.py` (neo không đụng → phải đủ), `viec/GOI-1/dot_bien.py` (dự kiến 2 "không áp được" — Câu hỏi 1).

## 4. Đường song song cần canh (K4) và luồng hợp lệ (K5)

- K4: hai lần đọc `pkg_qty` (:400, :1020) → gom một biến. `item.quantity` còn đọc ở `checkStock` + lời báo (:320, :324) sau phép kiểm → vô hại, giữ. Huỷ / xoá đơn (:1431–1435, :1570) đọc `quantity` từ DB (đã kiểm khi tạo) — không đụng. `damages.js:137` `Number(quantity)` của báo hỏng là đường khác (có kiểm riêng `!quantity`) — ngoài Phạm vi, ghi Phát hiện nếu thấy lỗ.
- K5 phải KHÔNG bị chặn: bán 1–10 ly (S4a + ca cũ), SL chuỗi `"2"` (S1g) và `" 5"` (thu_GOI1 A2k), mua 1 gói thiếu `pkg_qty` (S2e), mua 2 gói (S2f), mua gói + lấy ngay (P26c A2e, A6a), lấy từ gói (P26c A2b, thu_GOI1), mua thẻ (S4b), gia hạn gói không lấy món (P26c A3b), đơn chỉ gói / chỉ thẻ `items: []` (:183 — vòng món không chạy, không đụng).
  Toàn bộ `npm test` (thu_P20/P21/P26a/P26b/P26c/GOI1 đều gọi POST /orders) phải xanh — chính là phép K5 cho dữ liệu các bài gửi.

## 5. Ngân sách

Code ~+8 / −4 dòng (phiếu 15–30) · thử ~60 dòng (phiếu ~60) · `dot_bien.py` ~70 dòng (khuôn GOI-2 rút gọn, 9 đột biến).

## Câu hỏi (chờ chủ quán chốt trước khi làm)

1. **Hai đột biến GOI-1 sẽ lạc** (`BV-GOI1-SL-AM`, `VS-GOI1-SL-AM-CHI-0`, `viec/GOI-1/dot_bien.py:40–41`) vì gom về một phép làm dòng neo biến mất; A5 ghi "đột biến GOI-1 vẫn BẮT". Đề xuất: (a) thêm `viec/GOI-1/dot_bien.py` vào Phạm vi, sửa 2 neo sang dòng mới (2 dòng) — GOI-1 chạy vẫn đủ; hoặc (b) giữ file GOI-1, dựng lại 2 đột biến trong `viec/SO-LUONG-1/dot_bien.py` (khuôn GOI-2 Q-F) và chấp nhận GOI-1 báo 2 "không áp được". Máy nghiêng (a): ít dòng, không để đột biến chết trong kho.
2. **Trần `pkg_qty`**: chưa thêm. Nếu muốn, đề xuất ≤ 20 (quầy chưa bán quá vài gói một lần theo P26c/GOI-1; con số cần chủ quán chốt) — thêm 1 điều kiện + 1 ca.
3. `pkg_qty: 0` và `""` trước đây âm thầm thành 1 gói — nay 400. Màn hình không gửi hai giá trị này (Sales.jsx:748 `|| 1`). Xác nhận đổi hành vi này là đúng ý.
