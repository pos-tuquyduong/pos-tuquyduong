# SO-LUONG-1 — kế hoạch (CHỜ DUYỆT — chưa viết bài thử, chưa sửa code)

Số dòng dưới đây đọc trong lượt này trên HEAD `b823f72` (= main `551319d` sổ việc v30 + phiếu). Bản 2 — đã sửa theo soát độc lập
(5 số dòng lệch, thiếu vế `--day-du`, thiếu đột biến K5, 2 phát hiện ngoài phiếu — chi tiết ở `trang_thai.md`).

## 0. Hiện trạng đọc được (K1 — file:dòng lượt này)

| Chỗ | Đang làm |
|---|---|
| `orders.js:310–313` | `const sl = Number(item.quantity)`; CHỈ khi `item.from_package` mới kiểm nguyên ≥ 1 → 400 `GOI_SL_KHONG_HOP_LE`. Món lẻ: `sl` = 0,5 / −1 / NaN đi tiếp vào `itemTotal = unitPrice * sl` (:366–367) → tiền đơn giảm. |
| `orders.js:316–325` | `checkStock(…, item.quantity)` đọc số thô, bọc `try/catch` chỉ log (CLAUDE.md §5.3) — không đổi. |
| `orders.js:388–412` | `let soLuotGoi = 0;` (:388), `if (package_buy && package_buy.package_id)` (:389) … `const pkgQty = package_buy.pkg_qty \|\| 1;` (:400) → `subtotal += pkg.price * pkgQty` (:401), dòng gói `quantity: pkgQty` (:407). `0.002` → 3.000đ cho gói 300.000đ; `0` / `""` / `null` → 1 (vì `\|\|`). |
| `orders.js:1019–1022` | lần HAI cùng biểu thức `const pkgQty = package_buy.pkg_qty \|\| 1;` (:1020) → vòng `for (i < pkgQty)` tạo gói khách (K4 — đường song song của :400). Điều kiện :1019 (`package_buy && package_buy.package_id && phone`) là tập con của :389. |
| `orders.js:773–778` | tiền khách trả (`paymentSum`) phải khớp `total` máy chủ tính (lệch > 1đ → 400) — ca thử phải gửi đúng số gốc tự tính, nếu không gốc cũng 400 vì lý do khác → xanh oan (K3). |
| `orders.js:143–176, 178` | destructuring body (chỗ đặt phép kiểm sớm); :178 cho `items: []` khi mua gói / thẻ. |
| `orders.js:33` | `const router = express.Router();` — chỗ đặt hàm dùng chung của file. |
| `Sales.jsx:715, 748, 751` | gửi `quantity: item.quantity` (chỉ ±1 qua `updateQuantity`, :528–553 — không có ô gõ tay), `pkg_qty: cart.find(c => c.is_pkg).quantity \|\| 1`, `membership_buy: { tier_id }`. Luôn số nguyên ≥ 1 → **màn hình không đổi**. |
| `api.js:363` | `ordersApi.create` là nguồn gọi POST /orders DUY NHẤT của màn hình; `server/routes/*` không route nào gọi tạo đơn (don-mo-rong.js chỉ GET / đổi cách trả; packages.js đã bỏ POST /buy). |
| `products.js:101` | đơn vị chỉ `gói` / `túi` (theo category); không có kg / cân trong code → không gặp điều kiện DỪNG của phiếu. Dữ liệu thật trên Turso **chưa đọc** (CHƯA KIỂM). |
| `thu_GOI1.js:268–269` A2j | đòi `code === 'GOI_SL_KHONG_HOP_LE'` cho món LẤY TỪ GÓI SL âm / 0 / lẻ → mã này phải GIỮ cho món từ gói (file ngoài Phạm vi). |
| `thu_GOI1.js:273–281` A2k | SL dạng chuỗi `" 5"` / `" 7"` phải ĐƯỢC nhận (K5 — `Number(" 5") = 5`); `pkg_qty: 2` ở :291, :591, :621. |
| `viec/GOI-1/dot_bien.py:40–41` | `BV-GOI1-SL-AM`, `VS-GOI1-SL-AM-CHI-0` neo NGUYÊN dòng `if (item.from_package && !(Number.isInteger(sl) && sl >= 1)) {` — gom về một hàm là dòng này biến mất → hai đột biến "không áp được" (Câu hỏi 1). `:46` có chuỗi `package_buy.pkg_qty \|\| 1` trong phần THAY, neo không đổi → vô hại. |
| `viec/P26c/dot_bien.py:82–83, 94–95` | neo `if (orderItems.reduce(… > soLuotGoi) {` và `soLuotGoi = Number(pkg.total_qty) \|\| 0;` — KHÔNG đụng. `VS-GOI1-SL-GHI-GOC` neo `quantity: sl,\n unit_price: unitPrice,` — KHÔNG đụng. |
| `thu_P26c.js` trên gốc | 84 đạt · 0 hỏng, chạy 3 s (đo lượt này). Dòng tổng `${dat} đạt · ${hong} hỏng` (:749) → `SỐ CA` = đạt + hỏng. Chưa có ca nào gửi `membership_buy`. |
| Bài thử khác gọi POST /orders (người soát đọc) | thu_P20 (`mon(sl = 1)`), thu_P21:82 / thu_P26a:89 (`quantity: 1`), thu_P26b (`mon(0, 2)`, `pkg_qty: 1` :238), `gia_lap/kich_ban.js` (`pkg_qty` 1, món 1 / 2 / 4) — không bài nào gửi số ngoài nguyên ≥ 1 → không ca nào đỏ oan sau vá. |

## 1. Một hàm kiểm, hai chỗ gọi — `server/routes/orders.js` (A1, A2, A3) ~+7 / −3 dòng

**Phương án A (chọn):**
- Cạnh `const router = express.Router();` (:33), một dòng:
  `const soNguyenDuong = (x) => Number.isInteger(Number(x)) && Number(x) >= 1;` + 1 dòng chú thích (SO-LUONG-1, lý do: quán bán theo ly / túi / hộp, không bán số lẻ).
- **Số gói — kiểm MỘT lần, sớm**, ngay sau khối kiểm đầu vào (:178–190), trước mọi truy vấn:
  `const pkgQty = Number(package_buy?.pkg_qty ?? 1);`
  `if (package_buy && !soNguyenDuong(pkgQty)) return res.status(400).json({ error: 'Số gói mua phải là số nguyên từ 1', code: 'SL_KHONG_HOP_LE' });`
  — `??` thay `||`: thiếu / `null` → 1 (như nay, phiếu A2); `0` / `""` → 400 (trước thành 1 — đổi hành vi có chủ ý, màn hình không gửi hai giá trị này — Câu hỏi 3).
  :400 và :1020 XOÁ hai dòng `const pkgQty = package_buy.pkg_qty || 1;` — dùng một biến đã kiểm (một nguồn, hết đường song song K4).
- **Số món** :310–313 → giữ `const sl = Number(item.quantity);`, THAY phép `if (item.from_package && …)` bằng MỘT phép cho mọi món:
  `if (!soNguyenDuong(sl)) return res.status(400).json({ error: \`Số lượng của ${product.name} phải là số nguyên từ 1\`, code: item.from_package ? 'GOI_SL_KHONG_HOP_LE' : 'SL_KHONG_HOP_LE' });`
  — một chỗ kiểm (A3), mã cũ giữ cho món từ gói (thu_GOI1 A2j), mã mới `SL_KHONG_HOP_LE` cho món lẻ để bài thử so mã, không dò chữ (E12). Chú thích GOI-1 (:307–309) sửa 1 dòng cho đúng.
- `checkStock(…, item.quantity)` giữ (chỉ báo, đã qua kiểm). Không đổi màn hình, không đổi cấu trúc, không đổi `server/utils/`.

**Phương án B (bỏ):** thêm phép kiểm món lẻ RIÊNG dưới phép GOI-1, giữ nguyên dòng :311 để neo GOI-1 còn áp được. +3 dòng, hai phép cùng việc trong 4 dòng — trái A3 "một chỗ" và định hướng 2 (đơn giản).
**Phương án B2 (bỏ, bản 1):** kiểm `pkg_qty` tại :400 với `let pkgQty` ở :388 — hai chỗ gán, kiểm muộn hơn; người soát đề nghị kiểm sớm một lần, ít dòng hơn 1.
**Phương án C (bỏ):** `pkg_qty` trần ≤ 20. Phiếu để chủ quán chốt; không có số liệu bán gói thật để chọn trần → chưa thêm (Câu hỏi 2). Thêm sau chỉ là `&& pkgQty <= TRAN` + 1 ca.

Rủi ro: (1) `Number(true) = 1`, `Number([2]) = 2` qua được — không mất tiền, không chặn thêm cho khỏi phình; (2) hai đột biến GOI-1 lạc (Câu hỏi 1).

## 2. Bài thử — `cong_cu/thu_P26c.js` mục mới `[S]` trước `sv.close()` ~60 dòng, 18 ca

Ánh xạ 1-1 với `## Nghiệm thu` (số tiền ghi trong tên ca; so `status` / `code` / số đếm / `order.total`, không dò chữ). Mỗi ca chặn
chỉ vi phạm ĐÚNG MỘT phép (K3): `cash_amount` gửi = số tiền SAI mà gốc tự tính, vì :773 đòi tiền trả khớp tổng.

| Nghiệm thu | Ca | Trên gốc |
|---|---|---|
| A1 chặn | S1a–S1f: `[mon(2) ×1 (50.000), mon(0) ×v]`, v = `0` / `−1` / `0.5` / `1.5` / `"2a"` / `""`, `cash_amount` = 50.000 / 25.000 / 62.500 / 87.500 / 50.000 / 50.000 → 400 `SL_KHONG_HOP_LE`, `COUNT(pos_orders)` và `COUNT(pos_stock_pending)` không đổi (6 ca). `1.5` thêm ngoài phiếu: phiếu đòi NGUYÊN, 0,5 chỉ khoá vế "< 1" (người soát) | ĐỎ (gốc tạo đơn 50.000 / 25.000 / 62.500 / 87.500 đ). `"2a"` → tổng NaN: CHƯA CHẠY, chép đầu ra thật vào `bang_chung_do.txt` |
| A1 K5 | S1g: `quantity: 2` → 200, `total = 50.000`; S1h: `quantity: "2"` → 200, `total = 50.000` (2 ca) | xanh (hồi quy) |
| A2 chặn | S2a–S2d: `package_buy.pkg_qty` = `0` / `0.002` / `−1` / `1.5`, `cash_amount` = 300.000 / 600 / −300.000 / 450.000 → 400 `SL_KHONG_HOP_LE`, không thêm `pos_customer_packages`, ví không đổi (4 ca) | ĐỎ (0,002 → 200 tổng 600đ; 0 → 1 gói; 1,5 → 450.000đ) |
| A2 K5 | S2e: thiếu `pkg_qty` → 200, 1 gói, `total = 300.000`; S2f: `pkg_qty: 2` → 200, 2 gói khách, `total = 600.000` (2 ca) | xanh (hồi quy) |
| A3 | S3: lấy từ gói `quantity: 0.5` → 400 `GOI_SL_KHONG_HOP_LE`, giao không đổi (1 ca — giữ để đột biến `MOT-MA` bị bắt trong runner thu_P26c; thu_GOI1 A2j/A2k là ca cũ vẫn phải xanh) | xanh (hồi quy — khoá mã cũ còn giữ) |
| A4 | = S1c (0,5): tên ca ghi "gốc tạo đơn 62.500đ thay vì 75.000đ"; đột biến `BV-SOLUONG1-MON` bỏ phép → gốc lặp lại → S1c đỏ | — |
| A5 K5 | S4a: bán 10 ly `mon(0, 10)` → 200, `total = 250.000`; S4b: `items: [mon(0)]` + `membership_buy: { tier_id: 1 }` (Vàng, `card_price` đọc từ `pos_membership_tiers`) → 200, `total = 25.000 + card_price` (2 ca). Mua 1 gói, lấy từ gói, mua + lấy ngay, gia hạn: ca cũ P26c A2b, A2e, A3b, A6a + thu_GOI1 | xanh (hồi quy) |
| A5 máy | `npm test` xanh (mọi bài gọi POST /orders — chính là phép K5 cho dữ liệu các bài gửi); `node kiem_tra_truoc_khi_giao.js --day-du` xanh, 0 CẢNH BÁO (chạy cả `thu_gia_lap` / `kich_ban.js`) | — |

Ca "hai người cùng bấm": phép kiểm xảy ra TRƯỚC giao dịch trên dữ liệu của chính yêu cầu (không đọc kho) → không có tranh chấp; không thêm ca giả.
`bang_chung_do.txt`: đầu ra gốc (S1a–S1f, S2a–S2d đỏ) + `SỐ CA cong_cu/thu_P26c.js: 102` (84 + 18 — chép lại số THẬT sau khi chạy trên code đã vá).

## 3. Đột biến `viec/SO-LUONG-1/dot_bien.py` (khuôn GOI-2 + ĐỐI CHỨNG của TOC-DO-1) — 10 đột biến

Runner: chép `server/` ra thư mục tạm, `node cong_cu/thu_P26c.js --may-chu <bản sao>` (`p26c`) hoặc `thu_GOI1.js` (`thu`); ĐỐI CHỨNG
trước: bản sao chưa đột biến phải `0 hỏng`. Mỗi chỗ vá ≥ 1 VS- + 1 BV-; mỗi luồng hợp lệ K5 có đột biến "siết quá tay" (K3 TU-CHAY-5).

| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| hàm `soNguyenDuong` | `VS-SOLUONG1-BO-NGUYEN` (bỏ `Number.isInteger`, giữ `>= 1`) | S1d (1,5 món lẻ) |
| :311 phép món | `BV-SOLUONG1-MON` (`if (!soNguyenDuong(sl))` → `if (false)`) | S1c (0,5 — A4) |
| | `VS-SOLUONG1-MON-CHI-TU-GOI` (`if (item.from_package && !soNguyenDuong(sl))` — hành vi cũ GOI-1; cũng là `BV-GOI1-SL-AM` dựng lại theo nghĩa) | S1c |
| | `VS-SOLUONG1-MON-MOT-MA` (bỏ ternary, luôn `SL_KHONG_HOP_LE`) | S3 |
| | K5 `VS-SOLUONG1-MON-SO-THO` (`soNguyenDuong(item.quantity)` đổi thành `Number.isInteger(item.quantity)` — chuỗi `"2"` bị chặn) | S1h |
| phép gói (đầu route) | `BV-SOLUONG1-GOI` (`if (package_buy && !soNguyenDuong(pkgQty))` → `if (false)`) | S2b (0,002 → 600đ) |
| | `VS-SOLUONG1-GOI-HOAC-1` (`?? 1` → `\|\| 1`: 0 thành 1 gói) | S2a (0) |
| | `VS-SOLUONG1-GOI-LAM-TRON` (`Math.round(Number(…))`) | S2d (1,5 → 2 gói 600.000đ) |
| | K5 `VS-SOLUONG1-GOI-THIEU-0` (`?? 1` → `?? 0`: thiếu `pkg_qty` bị chặn) | S2e |
| | K5 `VS-SOLUONG1-GOI-CHI-1` (`!soNguyenDuong(pkgQty)` → `pkgQty !== 1`) | S2f |
| :400, :1020 xoá dòng trùng | **không phải chỗ vá riêng**: dựng lại `const pkgQty = package_buy.pkg_qty \|\| 1;` ở đó chỉ che biến đã kiểm bằng CÙNG giá trị (phép đầu route đã chặn mọi giá trị khác) → không đột biến nào bắt được, ghi CHƯA KIỂM bằng đột biến; khoá bằng S2f. |
| GOI-1 lạc | `VS-GOI1-SL-AM-CHI-0` dựng lại: `VS-SOLUONG1-MON-CHI-0` (`if (sl === 0)`) — runner `thu` | thu_GOI1 A2j |

Chạy lại `viec/P26c/dot_bien.py`, `viec/GOI-2/dot_bien.py` (neo không đụng → phải đủ), `viec/GOI-1/dot_bien.py` (dự kiến 2 "không áp được" — Câu hỏi 1).

## 4. Đường song song cần canh (K4) và luồng hợp lệ (K5)

- K4: hai lần đọc `pkg_qty` (:400, :1020) → một biến đầu route. `item.quantity` còn đọc ở `checkStock` + lời báo (:320, :324) sau phép kiểm → vô hại, giữ. `orderItems.quantity` ở :394, :908, :1033 là số đã kiểm; huỷ / xoá (:1435, :1570) đọc DB — không đụng. `damages.js:137` `Number(quantity)` của báo hỏng là đường khác (có kiểm riêng) — ngoài Phạm vi.
- K5 phải KHÔNG bị chặn — mỗi luồng một ca + đột biến siết: bán 1–10 ly (S4a), SL chuỗi `"2"` (S1h ← `MON-SO-THO`) và `" 5"` (thu_GOI1 A2k), mua 1 gói thiếu `pkg_qty` (S2e ← `GOI-THIEU-0`), mua 2 gói (S2f ← `GOI-CHI-1`), mua gói + lấy ngay (P26c A2e, A6a), lấy từ gói (P26c A2b, thu_GOI1), mua thẻ (S4b), gia hạn gói không lấy món (P26c A3b), đơn chỉ gói / chỉ thẻ `items: []` (:178 — vòng món không chạy; phép gói đầu route vẫn chạy với `pkg_qty: 1` của thu_P26c `muaGoi`).

## 5. Ngân sách

Code ~+7 / −3 dòng (phiếu 15–30) · thử ~60 dòng, 18 ca (phiếu ~60) · `dot_bien.py` ~75 dòng (khuôn GOI-2 rút gọn, 10 đột biến).

## Câu hỏi (chờ chủ quán chốt trước khi làm)

1. **Hai đột biến GOI-1 sẽ lạc** (`BV-GOI1-SL-AM`, `VS-GOI1-SL-AM-CHI-0`, `viec/GOI-1/dot_bien.py:40–41`) vì A3 (gom một phép) làm dòng neo biến mất, trong khi A5 ghi "đột biến GOI-1 vẫn BẮT" — hai vế của phiếu mâu thuẫn, máy KHÔNG tự chọn. (a) thêm `viec/GOI-1/dot_bien.py` vào Phạm vi, sửa 2 neo sang dòng mới (2 dòng) — GOI-1 chạy vẫn đủ, nhưng vượt Phạm vi hiện tại; (b) giữ file GOI-1, dựng lại 2 đột biến trong `viec/SO-LUONG-1/dot_bien.py` (khuôn GOI-2 Q-F, đã ghi ở mục 3) và chấp nhận GOI-1 báo 2 "không áp được" — trái chữ A5.
2. **Trần `pkg_qty`**: chưa thêm. Nếu muốn, đề xuất ≤ 20 (con số cần chủ quán chốt) — thêm 1 điều kiện + 1 ca + 1 đột biến.
3. `pkg_qty: 0` và `""` trước đây âm thầm thành 1 gói — nay 400. Màn hình không gửi hai giá trị này (Sales.jsx:748 `|| 1`). Xác nhận đổi hành vi này là đúng ý.
