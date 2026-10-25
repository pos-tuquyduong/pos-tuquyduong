# DIEM-THAT-1 — kế hoạch (chờ chủ quán duyệt)

Nền `611b043` (= main `5cb2a03` + phiếu). Mọi số dòng dưới đây đọc trong lượt này.

## 1. Code đọc được

| Chỗ | Hiện tại | Ghi chú |
|---|---|---|
| `server/routes/orders.js:42` | `tinhDiemDon(tong, luc)` — `floor(tong / per)`, null nếu tắt / 0 điểm | một công thức chung (P22-23) |
| `server/routes/orders.js:854` | POST /: `tinhDiemDon(total, now)` | `total` gồm phí giao (`:729–733`) và phần trừ ví / ví mẹ |
| `server/routes/orders.js:1306,1311` | pay-debt: `cotTien` rồi `tinhDiemDon(Number(order.total), now)` | `order` đọc TRƯỚC câu UPDATE cộng `paidAmount` |
| `server/routes/signup-codes.js:53` | `kiemDonCuaMa`: `SELECT id, code, total, status, payment_status, flash_discount` | thiếu 3 cột tiền |
| `server/routes/signup-codes.js:228` | `/nhan-diem`: `floor(Number(don.total) / moiBaoNhieu)` | rồi nhân hệ số `:240–242` |
| `cong_cu/gia_lap/bat_bien.js:141` | I8: `g = floor(total / per)` | mốc cũ `DIEM_KHI_THU_TU` `:18`, `HUY_TRU_DIEM_TU` `:20` |
| `server/index.js:22,43` | nạp `orders` TRƯỚC `signup-codes`; `orders.js:32` đã `require("./signup-codes")` | → `signup-codes` KHÔNG được `require('./orders')` ở đầu file (vòng) |

Huỷ / xoá (P24, `orders.js:1584–1592`) trừ `-SUM(points)` đã cộng — không tính lại công thức → tự đúng, không sửa.
Cột `cash_amount` / `transfer_amount` lưu phần đã thu, lệch tối đa ±1đ so với total (POST / chỉ chặn `|paymentSum − total| > 1`
`:823–834`; pay-debt cộng dồn vào cột `:1323`) → tiền thối không lọt vào điểm; phần thừa 1đ chặn bằng trần total − ví − ví mẹ
(soát vòng 1, chủ quán chốt câu 4 (b) 25.10).

## 2. Phương án

### Phần 1 — hàm `tienTinhDiem` (nghiệm thu A)
- **A (chọn):** trong `orders.js` ngay trên `tinhDiemDon`, 1 hàm thuần:
  `const tienTinhDiem = (d) => Math.max(0, Math.round((Number(d.cash_amount) || 0) + (Number(d.transfer_amount) || 0) - (Number(d.shipping_fee) || 0)));`
  + 1 dòng `module.exports.tienTinhDiem = tienTinhDiem;` sau `module.exports = router;` (`:1732`, cuối file, xa vùng P3).
  `signup-codes.js` gọi LƯỜI `require('./orders').tienTinhDiem(don)` trong thân `/nhan-diem` (tránh vòng nạp). ~4 dòng.
  ⚠ Dòng export nằm ngoài "vùng sửa" 39–59 phiếu ghi — bắt buộc để chỗ thứ ba dùng được hàm; nêu để chủ quán duyệt.
- **B:** đặt hàm trong `signup-codes.js`, export, thêm vào import `orders.js:32`. Không cần nạp lười, nhưng trái chữ phiếu
  ("cạnh `tinhDiemDon`") và cũng đụng một dòng ngoài vùng (`:32`). Không chọn.

### Phần 2 — ba chỗ gọi (B, C, D)
- POST / `:854` — chỉ đổi đối số: `tinhDiemDon(tienTinhDiem({ cash_amount, transfer_amount, shipping_fee: finalShippingFee }), now)`.
  Dùng `finalShippingFee` (đã ép ≥ 0) — cùng số ghi vào cột.
- pay-debt `:1311` — `tinhDiemDon(tienTinhDiem({ ...order, [cotTien]: (Number(order[cotTien]) || 0) + paidAmount }), now)`:
  tiền thật = mọi lần thu trước (kể cả lúc tạo) + lần thu đủ này. `cotTien` khai ở `:1306`, trước dòng gọi.
- `/nhan-diem` `:228` — `Math.floor(require('./orders').tienTinhDiem(don) / moiBaoNhieu)`; `kiemDonCuaMa` `:53` thêm
  `cash_amount, transfer_amount, shipping_fee` vào SELECT (thêm cột vô hại cho hai chỗ gọi khác `orders.js:536`, `discount-codes.js`).
  Phương án B (câu SELECT riêng trong `/nhan-diem`) dài hơn 3 dòng, thêm một lần đọc — không chọn.

### Phần 3 — I8 (F)
- **A (chọn):** công thức RIÊNG trong `bat_bien.js` (bất biến là "trọng tài" — dùng chung hàm với code thì lỗi của hàm qua mặt I8):
  SELECT thêm 3 cột; `gMoi = floor(max(0, cash + transfer − ship) / per)`, `gCu = floor(total / per)`; `diemDung(luatCu, g)`.
  Hằng `DIEM_THAT_TU = '2026-10-27'` (TẠM — chat sửa = ngày gộp + 1), export cạnh hai mốc cũ.
  Nhận khi khớp: `diemDung(false, gMoi)` (mọi đơn) · `ctx.thuc && created_at < DIEM_THAT_TU && diemDung(false, gCu)` (luật P22-23) ·
  `ctx.thuc && created_at < DIEM_KHI_THU_TU && diemDung(true, gCu)` (luật trước P22-23 — dòng `:153` hiện có, đổi `g` → `gCu`).
  Khuôn `huyCu` (P24) giữ nguyên. ~12 dòng đổi / thêm.
- **B:** I8 `require` `server/routes/orders.js` để gọi `tienTinhDiem` — nạp express + DB vào bất biến, và trọng tài chung lỗi với
  bị cáo. Không chọn. (Phiếu "mọi chỗ CỘNG điểm dùng nó" — I8 không cộng điểm.)

### Phần 4 — bài cũ phải sửa theo luật mới (thăm dò thật: vá tạm phương án A, chạy, hoàn lại)
| Bài | Ca vỡ | Sửa |
|---|---|---|
| `thu_P2223.js` | A3 "ví đủ 50.000 → 50 điểm" | thành "ví đủ → 0 earn, 200 paid" (luật mới) |
| `thu_P2223.js` | F2 (đơn nợ có earn luật cũ, trước `DIEM_KHI_THU_TU`) | KHÔNG sửa bài — tự xanh khi I8 dùng `gCu` cho luật cũ |
| `thu_P24.js` | A4, A4b, G1, I2 — đơn trả ví 25.000 mong 25 điểm | đổi thành ví 10.000 + tiền mặt 15.000 → 15 điểm, ví hoàn 10.000 (giữ ý ca: hoàn ví + trừ điểm) |
| `thu_gia_lap.js` | 14 ca I8 tay SẬP `no such column: o.cash_amount` (khung `:440`) | thêm 3 cột vào khung I8, dòng tay ghi `cash_amount = total` (giữ nghĩa ca cũ) + ca I8 mới (mục 4) |
| `thu_gia_lap.js` | "KB5 huỷ đơn có điểm → 1 dòng trừ" (gốc ở `kich_ban.js:119` KB5a trả ví) | `kich_ban.js` KB5a: ví 10.000 + tiền mặt 15.000; ca "ví +25.000" → "+10.000" |
| `thu_gia_lap.js` | M15 "cộng điểm cả đơn chưa thu đủ" không bị bắt (đơn nợ của giả lập không có tiền thật) | `kich_ban.js` thêm tiền mặt vào một đơn nợ (KB31 nợ: tiền mặt 5.000 + nợ 10.000, hoặc KB4) để đột biến có điểm sai mà I8 bắt |
| `thu_P20.js` **(NGOÀI Phạm vi)** | "trả bằng ví: /nhan-diem → 200" | → `## Câu hỏi` 1 trong `trang_thai.md` |
| `thu_DOISOAT1.js`, `thu_KH1.js` | không vỡ (134 đạt / xanh) | không sửa |

Mỗi bài cũ sửa đều có ca đổi kỳ vọng theo luật mới → ĐỎ trên gốc (A11 không cần `## Bài thử cũ sửa`). Sẽ xác nhận bằng chạy thật ở
bước 4, ghi `bang_chung_do.txt` + `SỐ CA` cho mỗi bài.

`kiem_tra_truoc_khi_giao.js:495` — thêm `'cong_cu/thu_DIEMTHAT1.js'` vào CUỐI mảng (1 dòng đổi).

### Ngân sách
Code `orders.js` 4 dòng · `signup-codes.js` 2 · `bat_bien.js` ~12 · `kich_ban.js` ~4 · bài mới ~220 · bài cũ sửa ~40. Trong ngân sách
phiếu (code ~30, bất biến ~20, bài ~200 — bài mới có thể vượt ~10 %).

## 3. Ca thử — `cong_cu/thu_DIEMTHAT1.js` (khuôn `thu_P2223.js`: database.js + libsql thật trên kho tạm, SX giả, 1.000đ = 1 điểm)

| Nghiệm thu | Ca |
|---|---|
| A | A1 `tienTinhDiem` thuần: (25.000, 0, 0) → 25.000 · (10.000,4, 0, 0) → 10.000 (số nguyên) · (10.000, 5.000, 3.000) → 12.000 · phí > tiền → 0 · chuỗi "15000" → 15.000 · thiếu trường → 0 |
| A | A2 mẫu nguy hiểm BIẾN MẤT (E11): `tinhDiemDon(total,` · `tinhDiemDon(Number(order.total)` · `don.total || 0) / moiBaoNhieu` không còn; `orders.js` có đúng 1 định nghĩa `tienTinhDiem`, 0 công thức `cash_amount … - … shipping_fee` chép ở `signup-codes.js` |
| B | B1 ví trọn 25.000 → 200 paid, 0 earn |
| B | B2 ví 10.000 + tiền mặt 15.000 → 15 điểm |
| B | B3 tiền mặt 30.000 có phí giao 5.000 → 25 điểm (không phải 30) |
| B | B4 ví mẹ 10.000 + chuyển khoản 15.000 → 15 điểm |
| B | B5 phí giao 5.000 > tiền mặt 3.000 (còn lại ví) → 0 earn |
| C | C1 tiền mặt 10.000 lúc tạo + nợ 15.000 → thu đủ 15.000 → 25 điểm (tính cả phần lúc tạo) |
| C | C2 ví 10.000 + nợ 15.000 (partial) → thu đủ → 15 điểm |
| C | C3 nợ trọn 30.000 có phí giao 5.000 → thu đủ → 25 điểm |
| C | C4 ví 10.000 + nợ 15.000 → thu chuyển khoản 5.000 rồi tiền mặt 10.000 → 15 điểm (cộng dồn hai cột) |
| C | C5 **hai người cùng bấm** (`co.mocTruocTx`): hai lệnh thu đủ chồng nhau → 200 + 409 `DA_THU_ROI`, đúng 1 earn = 15 |
| D | D1 khách lẻ tiền mặt 30.000 có phí giao 5.000 → `/nhan-diem` cộng round(25 × k) |
| D | D2 đơn có SĐT ví 10.000 + tiền mặt 15.000 (đã 15 điểm lúc bán) → `/nhan-diem` cộng bù round(15 × (k − 1)) |
| D | D3 đơn ví trọn → `/nhan-diem` 400 `DON_KHONG_DU_DIEM`, mã CHƯA bị tiêu (`diem_nhan_luc` null) |
| E | E1 Flash tiền mặt → 0 earn (POST /) · E2 đơn nợ chưa thu đủ → 0 · E3 huỷ đơn B2 (15 điểm) → 1 adjust −15, tổng 0 · E4 Flash `/nhan-diem` vẫn 400 `DON_FLASH_KHONG_DIEM` |
| F | F1 I8 trên mọi đơn của bài → 0 lệch |
| F | F2 đơn ví trọn có earn 25 (= total/per) tạo ĐÚNG mốc `DIEM_THAT_TU`, Đối soát thật → LỆCH |
| F | F3 cùng đơn tạo 1 giây TRƯỚC mốc, Đối soát thật → KHÔNG lệch (luật cũ) |
| F | F4 cùng đơn trước mốc, giả lập (không `ctx.thuc`) → LỆCH |
| F | F5 đơn có phí giao, earn theo luật mới, sau mốc → KHÔNG lệch; earn theo total (luật cũ) sau mốc → LỆCH |
| F | F6 đơn nợ có earn total/per, tạo trước `DIEM_KHI_THU_TU`, Đối soát thật → KHÔNG lệch (vế luật cũ-cũ dùng `gCu`; trùng F2 của thu_P2223) |
| G | G1 tiền mặt 25.000 → 25 · G2 chuyển khoản 20.000 → 20 · G3 nợ trọn 25.000 thu tiền mặt → 25 · G4 khách lẻ tiền mặt 25.000 `/nhan-diem` → round(25 × k) — đúng như luật cũ |

Ca ĐỎ trên gốc: A1 (gốc chưa có hàm), A2, B1–B5, C2–C5, D1–D3, F2, F5. C1 xanh cả gốc (total = tiền thật) — giữ vì nó là ca của `VS-THU-QUEN-LAN-NAY`. B6 xanh cả gốc (gốc ép phí âm về 0 ở `orders.js:729`) — ca của `VS-TAO-PHI-THO`.
Ca G là K5 — xanh cả gốc lẫn vá (đúng: không ai thiệt).

## 4. Đột biến (`viec/DIEM-THAT-1/dot_bien.py`, mỗi tên một dòng)

| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| hàm | `VS-HAM-BO-PHI` bỏ `− shipping_fee` | A1, B3, C3, D1 |
| hàm | `VS-HAM-BO-CK` bỏ `transfer_amount` | A1, B4, G2 |
| hàm | `VS-HAM-LAM-TRON` bỏ `Math.round` | A1 (10.000,4) |
| POST / | `BV-TAO` đối số về `total` | B1, B2, B3 |
| POST / | `VS-TAO-PHI-THO` dùng `shipping_fee` thô thay `finalShippingFee` | ca B6 phí giao âm −5.000 → 0 (thêm vào B) |
| pay-debt | `BV-THU` về `Number(order.total)` | C2, C3 |
| pay-debt | `VS-THU-QUEN-LAN-NAY` `tienTinhDiem(order)` (không cộng `paidAmount`) | C1, C2, C4 |
| /nhan-diem | `BV-MA` về `don.total` | D1, D3 |
| /nhan-diem | `VS-MA-THIEU-COT` bỏ 3 cột khỏi SELECT `kiemDonCuaMa` | D1, D2, G4 |
| I8 | `BV-I8` `g` về total | F2, F5 |
| I8 | `VS-I8-BO-MOC` bỏ vế `created_at < DIEM_THAT_TU` (nhận luật cũ mọi lúc) | F2 |
| I8 | `VS-I8-MOC-GIA-LAP` bỏ `ctx.thuc &&` ở vế mới | F4 |
| I8 | `VS-I8-CU-CU-GMOI` vế `DIEM_KHI_THU_TU` dùng `gMoi` | F6 |
| I8 | `VS-I8-MOC-BANG` `<` → `<=` ở mốc mới | F2 |

Mỗi đột biến chạy từng tên, có đối chứng (bản chưa đột biến xanh), bài sập ≠ BẮT (K3 TOC-DO-1).
Đột biến tương đương (ghi CHƯA KIỂM): `Math.max(0, …)` — tiền âm cho điểm âm, cả `tinhDiemDon` (`!(diem > 0)` → null) lẫn
`/nhan-diem` (`diemGoc <= 0` → 400) đã chặn; không ca nào phân biệt được. Giữ vì phiếu ghi công thức.

## 5. Đường song song (K4) và luồng hợp lệ (K5)
- grep `loyalty_earn_per_amount|tinhDiemDon|/ per` trong `server/`, `cong_cu/gia_lap/`, `client/src`, `app_kh/src`: chỗ CHIA ĐIỂM chỉ có
  `orders.js:49` (qua 2 chỗ gọi), `signup-codes.js:228`, `bat_bien.js:141` → cả ba đều vá. `client/src/pages/Settings.jsx` chỉ là ô cài đặt.
- Song song CHƯA vá (hỏi): lời hứa điểm trên bill `orders.js:1207` → Câu hỏi 2. Chú thích `doiSoat.js:257` → Phát hiện.
- Huỷ / xoá (P24) trừ theo SUM đã cộng — không công thức → không vá; E3 canh.
- Luồng hợp lệ phải KHÔNG bị chặn: mọi ca đều so `status === 200` (không có phép chặn mới — việc này chỉ đổi SỐ điểm). G1–G4 (tiền
  mặt / chuyển khoản / nợ thu đủ / mã bill, không ví không phí) ra đúng số cũ; dữ liệu cũ trên production (đơn trước mốc có điểm
  theo total) không bị Đối soát báo đỏ — F3, F6.

## 6. Thứ tự làm sau khi duyệt
1. Bài mới + sửa bài cũ → chạy trên gốc (đỏ) → `bang_chung_do.txt`. 2. Vá `orders.js`, `signup-codes.js`, `bat_bien.js`, `kich_ban.js`.
3. `npm test`, `--day-du`, đột biến. 4. `/ra-soat`. 5. Cổng `chay`, báo cáo.

## 7. Soát kế hoạch (agent phụ chỉ đọc, 25.10)
- Ngoài vùng: dòng export cuối `orders.js` + `thu_P20.js` — đã nêu (mục 2 Phần 1, Câu hỏi 1).
- Ngắn hơn: B ngắn ~2 dòng nhưng trái chữ phiếu; giữ A.
- Ca: B6 ghi nhầm "đỏ trên gốc" → đã sửa (xanh gốc, chỉ bắt đột biến). `Math.max(0, …)` tương đương — CHƯA KIỂM như đã ghi.
- Song song: chỉ 2 chỗ INSERT earn (`orders.js:1061`, `signup-codes.js:295`) — cả hai vá. `don-mo-rong.js:147` đổi tiền mặt ↔ chuyển
  khoản giữ tổng → điểm không đổi. pay-debt đọc đúng (UPDATE chặn `debt_amount = ?` → `order[cotTien] + paidAmount` = cột sau ghi).
  Tiền thối ở `cash_received` riêng (`orders.js:194`), không vào `cash_amount`. Nạp lười `require('./orders')` an toàn (gọi lúc có request).
