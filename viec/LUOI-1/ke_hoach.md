# LUOI-1 — kế hoạch (chờ chủ quán duyệt)

Nền: `9521cec PHIEU: LUOI-1` (cha `769adfe` sổ v24, ông `caabb73` Merge PR #11 HOC-2b). Máy mây 4 lõi.
Việc này CHỈ thêm lưới: không đổi `server/`, `client/`, `tu_chay/`. Mọi số dòng dưới đây đọc trong phiên 09.10.

## 0. Số đo A0 (gốc 9521cec, chạy RIÊNG, máy mây 4 lõi, 09.10.2026)

Công cụ đo: bản nháp ngoài kho (chép `cong_cu/gia_lap/` vào thư mục nháp, chèn mốc giờ quanh `kb.chay` và vòng bất biến) —
bước 4 sẽ đưa công cụ này vào `viec/LUOI-1/do_thoi_gian.js` để chạy lại được, KHÔNG vào `cong_cu/`.

| Lệnh | Gốc | Thử A1 (bản nháp: bất biến không trễ) |
|---|---|---|
| `node cong_cu/gia_lap/chay.js` | **67,1 s**, ĐẠT | **56,9 s**, ĐẠT (KB10 cả hai ca vẫn đạt) |
| `node cong_cu/thu_gia_lap.js` | **74,9 s**, 42 đạt · 0 hỏng | (đo lại sau A1 thật) |
| `node kiem_tra_truoc_khi_giao.js --day-du` | **201,8 s**, thoát 0 | — |

Từng kịch bản (ms, gốc → A1; phần "kb" không đổi): KB1 635 · KB2 726 · KB3 721 · KB4 1686 · KB5 2827 · KB6 1290 · KB7 1256 ·
KB8 1542 · KB9 1875 · KB10 720 · KB11 2605 · KB12 1872 · KB13 2448 · KB14 4568 · KB15 3352 · KB16 8135 · KB17 16416 · KB18 3144.
Vòng 10 bất biến sau mỗi KB: **~572 ms (gốc) → 2–4 ms (A1)** — 18 × 0,57 ≈ 10,3 s tiết kiệm.

## 1. Đã đọc — quầy gọi gì, máy chủ làm gì

| Đường | Màn hình gọi (client/src) | Máy chủ |
|---|---|---|
| Đổi điểm | `pages/Customers.jsx:199` `POST /loyalty/redeem` (token người dùng) | `loyalty.js:124–219`: thiếu điểm → 400 **không có `code`**; trừ điểm `:170`, đẻ mã `usage_limit=1` `:179`, ghi `pos_voucher_grants` `:189` |
| Mã giảm giá khi bán | `pages/Sales.jsx:234` `POST /discount-codes/validate` rồi `:728` gửi `discount_code` chỉ khi validate hợp lệ | `orders.js:456–495` kiểm ngoài giao dịch: mã hết lượt → **bỏ mã, đơn vẫn 200** (không giảm); `:880–896` kiểm lại TRONG giao dịch → 400 `DISCOUNT_CODE_LIMIT_REACHED` (chỉ khi hai đơn chồng nhau); validate hết lượt → 400 **không `code`** (`discount-codes.js:94`) |
| `/increment-usage` | KHÔNG màn hình nào gọi (grep `increment` trong `client/src` = 0) | `discount-codes.js:341–351` cộng 1, không kiểm gì |
| Mua gói / lấy từ gói | `Sales.jsx:744–750` (`customer_package_id`, `package_buy`) | kiểm chủ gói + còn lượt NGOÀI giao dịch `orders.js:194–228`; tạo gói `:961–993` (lấy ngay → gán `customer_package_id` `:985`); cộng lượt sau commit `:1021–1037` |
| `PUT /packages/customer-packages/:id/deliver` | KHÔNG màn hình nào gọi (Reports chỉ GET `/deliveries`) | `packages.js:171–185` cộng lượt, **không trần, không tạo đơn** |
| Thẻ hội viên | `Sales.jsx:751` `membership_buy` | ghi `pos_membership_purchases` sau commit `orders.js:996–1017` |
| Huỷ đơn | `pages/Orders.jsx:263` `ordersApi.cancel` (quyền `cancel_order`, nhân viên có — `database.js:951`) | `orders.js:1296–1458`: hoàn ví; đơn mua gói: gói đã giao > 0 → `cancelled` `:1351`, = 0 → DELETE + gỡ đơn trỏ tới `:1357–1358`; thẻ → DELETE `:1372`; đơn lấy từ gói → trả lượt `:1386`; hoàn kho SX, lỗi → nợ kho `in` `:1435`. **Không đụng `pos_discount_codes`** (huỷ không trả lượt mã) |
| Xoá đơn (owner) | `ordersApi.delete` | `orders.js:1462–1590`: đơn mua gói → gỡ đơn trỏ tới `:1513` + DELETE gói `:1515`; đơn lấy từ gói → trả lượt `:1525` (**không xét đơn đã huỷ** — P26c (14)); hoàn kho, lỗi → nợ kho `in` `:1568`. **Không đụng `pos_discount_codes`** |
| Bán lúc SX lỗi | — | `orders.js:933–958` lỗi trừ kho → nợ kho `out` kèm vân tay; đơn KHÔNG rollback |
| Sổ nợ kho | `components/Layout.jsx:53` nút `POST /so-no/doi-ngay` | `utils/doSoNo.js:40–110` gửi lại theo vân tay, đánh `resolved`; **còn tự đẩy theo hoạt động** `index.js:76` mỗi 3 phút (`doSoNo.js:120`) |
| Đối soát ví | KHÔNG màn hình gọi (KB8 có sẵn gọi, chủ quán chốt 02.10) | `wallets.js:242–263`: ví chưa có → INSERT `:257` |
| Duyệt hoàn | Refunds (`refundsApi.approve`) | `refunds.js:147–170`, gắn `balance_transaction_id` `:161` |
| Đổi cách trả | KHÔNG màn hình gọi (grep `doi-cach` = 0; KB2 có sẵn gọi) | `don-mo-rong.js:107–160`, một câu UPDATE `:145` rồi nhật ký `doi` |

Nhận dạng món "lấy từ gói" trong kho: `pos_order_items` không có cột `from_package`; máy chủ dùng
`product_id > 0 AND unit_price = 0` (`orders.js:1382`, `:1522`) — bất biến dùng đúng điều kiện đó. Món gói ảo
`product_id = -pkg.id` (`:377`), món thẻ `product_id = -1000000 - tier.id`, `product_code = 'THE-<tên>'` (`:397`).

## 2. Phần A — thời gian (làm TRƯỚC)

**A1.** `chay.js`: đầu MỖI vòng kịch bản `treMs = TRE_MS` (bật lại), trước vòng bất biến `treMs = 0`.
- PA-A (chọn): 2 dòng trong vòng lặp (dòng `treMs = TRE_MS;` trước vòng chuyển vào vòng). ~3 dòng. Phần an toàn
  (khối A1/A2, `kiemAnToan`, kho tạm, dọn khi sập) KHÔNG đụng.
- PA-B: bọc `q` của bất biến bằng client riêng không trễ — nhiều dòng hơn, đụng chỗ dựng client libsql. Bỏ.

**Siết KB10 (phiếu C3):** ca "trễ kho đang bật" hiện tính trung vị trên `c.doLenh` của CẢ phiên → đột biến "trễ không
bật lại" không làm nó đỏ. Sửa 2 dòng trong KB10: ghi `const dau = c.doLenh.length` đầu KB, trung vị trên
`c.doLenh.slice(dau)` (chỉ lệnh của chính KB10), đòi có ≥ 1 lệnh. Đây là SIẾT ca cũ theo phiếu, không nới.

**A2.** Sau A1 đo lại; đo từng kịch bản mới; ước tổng. Vượt 96 s (80 % hạn) ở giả lập hoặc `thu_gia_lap` chạy riêng → DỪNG,
`## Câu hỏi` (đề xuất sẵn: tách giả lập hai lượt chạy song song theo `--tu-kb/--den-kb`).

## 3. Phần B — kịch bản mới (THÊM vào CUỐI `kich_ban.js`, KB19–KB27)

Không sửa `dungDuLieu` (mọi dữ liệu mới tự dựng trong kịch bản mới — id/bảng cũ không xê dịch). `chay.js` thêm vào `ctx`: `ctx.soQuay.tangMa` (lần `/increment-usage` trả 200), `ctx.soQuay.giaoGoi`
(lần `/deliver` trả 200), công tắc SX (mục 4). Giá thẻ, giá gói, điểm của quà đọc từ kho, không viết số cứng.

| KB | Tên | Gọi (như quầy) | Mong đợi HTTP (status + `code`) |
|---|---|---|---|
| 19 | Đổi điểm lấy mã (B1) | chủ tạo quà qua `POST /rewards` (giá 3 điểm, giảm cố định); khách mới mua 30.000 → 3 điểm; `nv` `POST /loyalty/redeem` | 200 + `points_left` 0; đổi lần hai → 400 (máy chủ không trả `code`); validate mã mới → 200 `valid`; bán dùng mã → 200, `discount_amount` = giá trị quà |
| 20 | Mã dùng-một-lần (B2) + `/increment-usage` (B5) | chủ tạo mã `usage_limit 1` qua `POST /discount-codes`; hai đơn cùng mã CHỒNG nhau (`c.chong`); validate lại; bán lại tuần tự; `POST /discount-codes/:id/increment-usage` trên mã khác | chồng: 200 + 400 `DISCOUNT_CODE_LIMIT_REACHED`; validate lần sau → 400; bán lại tuần tự → **xem Q1**; increment → 200 |
| 21 | Gói: mua → lấy → hết lượt → huỷ (B3) | khách nạp ví; mua gói (ví) không lấy ngay, `total_qty 3`; lấy 2 rồi 1 (hết lượt); lấy thêm; `nv` huỷ đơn lấy 1 → lượt trả; hai `nv` huỷ đơn mua gói CHỒNG nhau; lấy từ gói đã huỷ; gói thứ hai: lấy 1, huỷ đơn lấy (lượt về 0), huỷ đơn mua | lấy thêm → 400 `GOI_HET_HIEU_LUC`; huỷ chồng (gói đã giao 2/3) → 200 + 400 `DON_KHONG_HUY_DUOC`, đúng MỘT dòng hoàn, gói `cancelled` (Q8 b: KHÔNG khẳng định số tiền); gói chưa giao → ví + TRỌN giá; lấy từ gói đã huỷ → 400 `GOI_HET_HIEU_LUC`; gói thứ hai bị xoá, đơn lấy bị gỡ trỏ |
| 22 | Thẻ hội viên (B3) | khách MỚI (hạng thẻ giảm giá đơn sau — `orders.js:529`) nạp ví; mua thẻ hạng đầu (đọc từ `pos_membership_tiers`) trả ví; `nv` huỷ | 200, 200; ví + giá thẻ đúng một lần |
| 23 | Xoá đơn gói (B3, owner — chạm thêm `C2F-orders-31` :1515 đang SỐNG) | `KH.moi` (đã claim ở KB7 → đơn không sinh mã bill, tránh P26c (4)); món KHÔNG mã SX (tránh P26c (4) phần vân tay); mua gói có lấy ngay; đơn lấy Z; chủ XOÁ Z (Z chưa huỷ — tránh P26c (14)); đơn lấy Z2; chủ xoá đơn mua | 200 ×…; lượt trả đúng; gói bị xoá, Z2 bị gỡ trỏ |
| 24 | SX lỗi lúc bán / huỷ (B4) | bán C (SX tốt); `c.batSxLoi()`; bán A (2 món SX) → nợ `out`; `nv` huỷ C → nợ `in`. **KHÔNG tự tắt lỗi** — để KB25 thử công tắc tự tắt | bán/huỷ lúc SX lỗi vẫn 200 |
| 25 | Đẩy sổ nợ (B4) — dựa vào công tắc TỰ TẮT trước KB | `nv` bấm `POST /so-no/doi-ngay` (`Layout.jsx:53`); bấm lại; hai người bấm cùng lúc (`Promise.all`) | đẩy → 200, `xong` = 3, ba dòng nợ `resolved`; bấm lại → `xong` 0; SX nhận mỗi vân tay đúng một lần |
| 26 | Đối soát ví chưa có (B5) + `/deliver` (B3, xem Q2) | chủ `POST /wallets/<KH.no>/reconcile` (khách nợ chưa có ví); `PUT /packages/customer-packages/<gói có sẵn>/deliver {1}` | đối soát 200 + **SELECT `pos_wallets`** có dòng = tổng sổ (phản hồi HTTP giống hệt khi bỏ INSERT — `wallets.js:251–262`, nên không dựa vào HTTP); deliver 200 |
| 27 | SX lỗi lúc XOÁ (B4) — **phải là KB CUỐI** | `c.batSxLoi()`; bán đơn món SX của `KH.moi` (nợ `out`); chủ xoá đơn (nợ `in`) | 200, 200 |

Vì sao KB27 cuối: đơn đã xoá mà nợ kho của nó được đẩy (nút hoặc tự đẩy 3 phút) thì SX nhận vân tay của đơn không còn
→ I7 "vân tay lạ" = P26c (4), lỗi đã biết. KB27 không đẩy; không KB nào sau nó. Ghi chú trong file cho việc sau.
Rủi ro còn lại: tự đẩy `doNeuDenLuc` chỉ chạy khi một lượt giả lập vượt 180 s kể từ máy chủ lên — dưới hạn 110 s/120 s thì
không xảy ra; bất biến I7 mở rộng vẫn đúng nếu nó chạy lúc SX đang lỗi (chỉ thêm lần lỗi cùng vân tay).

## 4. Công tắc SX lỗi (B4, `chay.js` ~12 dòng)

SX giả: `const sxGia = { loi: false, hong: [], kbBat: new Set() }`. Khi `loi` → `/stock/out|in` trả 503 JSON và ghi
`hong.push({ van_tay, kb })` (KHÔNG ghi vào `nhanKho`). `ctx.batSxLoi = () => { sxGia.loi = true; sxGia.kbBat.add(kbHienTai) }`,
`ctx.tatSxLoi`. Vòng lặp: trước MỖI kịch bản `treMs = TRE_MS; sxGia.loi = false; kbHienTai = i + 1` (lúc `dungDuLieu` kb = 0).
`check-stock` không đổi. Đây không phải phần an toàn A1/A2.

## 5. Bất biến (10 → 16 (I12–I17 mới, I7 + I8 mở rộng); chạy sau MỌI kịch bản, không miễn kịch bản cũ)

- **I7 mở rộng** (giữ nguyên 3 phần cũ, chỉ thay dòng cuối "mọi nợ kho = lệch"): (a) mỗi vân tay cần có:
  SX nhận + nợ CHƯA `resolved` = đúng 1; (b) nợ `resolved` ⇒ SX nhận đúng 1; (c) mỗi vân tay SX báo lỗi ⇔ đúng một dòng nợ cùng
  vân tay (bắt cả đơn đã xoá — `orders-39`); (d) dòng nợ không vân tay hoặc không có lần lỗi tương ứng → lệch;
  (e) lần lỗi ở kịch bản không bật công tắc (kể cả `dungDuLieu`) → lệch. Kịch bản cũ không bật lỗi ⇒ (c)(d) giữ đúng như
  luật cũ "không có nợ kho" — không nới.
- **I8 mở rộng (vế đổi điểm — B1 "tích − đổi khớp sổ"):** giữ nguyên vế theo đơn; thêm: mỗi dòng `pos_point_transactions`
  `type='redeem'` có đúng một `pos_voucher_grants` trỏ tới (`point_tx_id`) và `points = −points_cost` của quà; không có loại
  dòng điểm lạ (chỉ `earn`, `redeem`). KHÔNG so số dư theo khách (dòng `redeem` không hạn, `earn` có hạn — đổi xong mà phần tích
  hết hạn thì số dư âm là đúng luật hiện tại; ca điểm hết hạn CHƯA KIỂM — chủ quán dặn 09.10). Đặt ở I8 vì mẫu bắt của `C2-loyalty-redeem-tru-0` là `→ I8:`
  (`viec/AUDIT-1/dot_bien.py:76`, ngoài Phạm vi). Đây là THÊM vế, không nới vế cũ.
- **I12 đổi điểm:** mỗi `pos_voucher_grants` ↔ đúng một `pos_point_transactions` `id = point_tx_id`, `type='redeem'`, cùng SĐT,
  `points = −points_cost` của quà; mã `code` có `discount_type/discount_value` = quà, `usage_limit = 1`; mỗi dòng `redeem` có
  đúng một grant. (Giới hạn: so với quà HIỆN TẠI — chủ sửa quà sau khi đổi thì bất biến đỏ; không KB nào sửa quà.)
- **I13 mã giảm giá:** `usage_limit > 0 ⇒ used_count ≤ usage_limit`; `used_count` = số đơn (MỌI trạng thái — huỷ/xoá không trả
  lượt, xem mục 1) có `UPPER(discount_code)` = mã VÀ loại + trị giá chiết khấu của đơn = của mã + số lần `/increment-usage` 200
  (`ctx.soQuay.tangMa`). So loại + trị giá vì máy chủ lưu `discount_code` cả khi mã KHÔNG được áp (Phát hiện 2). (Bản đầu dùng
  `discount_amount > 0` — đổi ở c91101c: điều kiện thừa, đột biến không giết được.)
- **I14 gói:** `delivered_qty ≤ total_qty`; gói không `cancelled`: `delivered_qty` = Σ món lấy-từ-gói của đơn không huỷ trỏ
  tới gói + `ctx.soQuay.giaoGoi`; gói có `order_id` mà đơn đã huỷ hoặc không còn ⇒ gói không còn hoặc `cancelled`;
  mọi `pos_orders.customer_package_id` trỏ tới gói còn tồn tại; đơn mua gói có món lấy ngay ⇒ `customer_package_id` = gói của
  chính nó.
- **I15 thẻ:** đơn không huỷ có món `THE-…` (`product_id <= -1000000`) và có SĐT ⇒ đúng một `pos_membership_purchases` cùng
  `order_id`; mỗi dòng mua thẻ ⇒ đơn còn và không huỷ.
- **I16 đổi cách trả:** đơn có nhật ký `doi` ⇒ dòng `doi` cuối: `sang` = cách trả hiện tại (`cash_amount > 0` ⇔ `cash`),
  `so_tien` = `cash_amount + transfer_amount`. (Phủ KB2 có sẵn → bắt `don-mo-rong-01` không cần KB mới.) Chiều đổi tiền mặt →
  chuyển khoản phía MÁY CHỦ **CHƯA PHỦ** (Q10 a, Phát hiện 13); nhánh CK của I16 soát bằng dữ liệu tay.
- **I17 duyệt hoàn:** yêu cầu `approved` ⇒ `balance_transaction_id` trỏ dòng `refund` cùng `order_id`, cùng SĐT, `amount =
  refund_amount`. (Phủ KB12/13/16/17 có sẵn → bắt `refunds-05`.)

## 6. C1 — 21 đột biến phải BẮT, bắt ở đâu

| Đột biến | Câu bị bỏ | Bắt bởi (dự kiến) |
|---|---|---|
| C2F-loyalty-01-insert-khach-app | `loyalty.js:170` trừ điểm | KB19 → I12 (grant trỏ dòng id 1 = `earn`) |
| C2F-loyalty-02-insert-khach-app | `loyalty.js:179` đẻ mã | KB19 → HTTP validate 400 + I12 |
| C2-loyalty-redeem-tru-0 | trừ 0 điểm | KB19 → **I8 mở rộng** (mẫu bắt của AUDIT-1 là `→ I8:` — `viec/AUDIT-1/dot_bien.py:76`; bắt bằng I12/HTTP sẽ bị chấm LẠC) |
| C2F-orders-05-update-quay | `orders.js:894` used_count | KB19/KB20 → I13 + HTTP chồng 200,200 |
| C2F-orders-07-insert-quay | `:946` nợ out | KB24 → I7 (a)(c) |
| C2F-orders-27-insert-quay | `:1435` nợ in (huỷ) | KB24 → I7 (a)(c) |
| C2F-orders-39-insert-quay | `:1568` nợ in (xoá) | KB27 → I7 (c) |
| C2F-orders-10-update-quay | `:985` gán gói lấy ngay | KB9 (có sẵn) → I14 |
| C2F-orders-11-insert-quay | `:1008` ghi mua thẻ | KB22 → I15 |
| C2F-orders-21-update-quay | `:1351` huỷ gói đã giao | KB21 → I14 + HTTP lấy từ gói đã huỷ 200 |
| C2F-orders-22-delete-quay | `:1357` xoá gói chưa giao | KB21 → I14 |
| C2F-orders-23-update-quay | `:1358` gỡ trỏ (huỷ) | KB21 → I14 (trỏ gói không tồn tại) |
| C2F-orders-24-delete-quay | `:1372` xoá thẻ (huỷ) | KB22 → I15 |
| C2F-orders-25-update-quay | `:1386` trả lượt (huỷ) | KB21 → I14 |
| C2F-orders-30-update-quay | `:1513` gỡ trỏ (xoá) | KB23 → I14 |
| C2F-orders-32-update-quay | `:1525` trả lượt (xoá) | KB23 → I14 |
| C2F-packages-05-update-quay | `packages.js:176` deliver | KB26 → I14 (sổ `giaoGoi`) — **phụ thuộc Q2** |
| C2F-wallets-08-insert-quay | `wallets.js:257` | KB26 → SELECT `pos_wallets` (dòng `c.mong`) |
| C2F-refunds-05-update-quay | `refunds.js:161` | KB12 (có sẵn) → I17 |
| C2F-don-mo-rong-01-update-quay | `don-mo-rong.js:145` | KB2 (có sẵn) → I16 |
| C2F-discount-codes-05-update-quay | `discount-codes.js:345` | KB20 → I13 |

Tên C2F sinh theo thứ tự câu trong `server/` — việc này không đổi `server/` nên tên không trôi (đã chạy bộ sinh: 86 câu,
21 tên trên khớp đúng dòng ghi ở bảng).

## 7. C3 — đột biến của chính việc này (`viec/LUOI-1/dot_bien.py`, bản sao)

`viec/LUOI-1/dot_bien.py` có máy chạy RIÊNG (chép thật `server/`, `cong_cu/`, `tu_chay/cau_hinh.json` vào thư mục tạm, cách chạy
theo bảng `LENH`; không dùng `runpy`, không sửa `viec/AUDIT-1/dot_bien.py`) — sửa theo soát vòng 3 lỗi 6. Mỗi tên một
dòng tuple, ghi NGUYÊN VĂN vào `trang_thai.md` (A17). Dự kiến (tên chốt khi viết):
- Nới mỗi bất biến cả hai phía: I7 (`!== 1` → `> 1`, `< 1`; bỏ (c); bỏ (e)), I12 (bỏ điều kiện `type='redeem'`; `points = −cost`
  → `<=`; `usage_limit = 1` → `>= 1`), I13 (`=` → `<=`, `>=`; bỏ RIÊNG từng vế loại / trị giá), I14 (`≤ total` → `≤ total + 1`;
  `=` → `<=`/`>=`; bỏ phép trỏ gói), I15 (`=== 1` → `>= 1`/`<= 1`), I16 (bỏ so `sang`), I17 (bỏ so `amount`).
  Bắt bằng **ca dữ liệu tay trong `thu_gia_lap.js`** (như ca I2 có sẵn): mỗi bất biến một bộ sạch (0 lệch — K5) + bộ lệch
  ĐÚNG MỘT đơn vị mỗi phía (phải lệch).
- `chay.js`: công tắc "mặc định bật" → KB1 → I7 (e) (lỗi lúc `dungDuLieu`); "không tự tắt" → KB25 → HTTP (`xong` ≠ 3 vì SX
  vẫn lỗi) + I7 (e) (lần lỗi ở KB25 không bật công tắc);
  A1 "trễ không bật lại trước kịch bản" → KB10 đỏ CẢ hai ca (chồng lệnh + trễ đang bật, sau khi siết).
- Mỗi đột biến chạy lệnh nhỏ nhất bắt được nó (`gl` / `kbN` / `thugl` -j 1).

## 8. C4 — bộ đột biến cũ chạm file việc này sửa

Chạy lại `viec/TU-CHAY-4/dot_bien.py`, `viec/P26b/dot_bien.py`, `viec/HOC-2b/dot_bien.py`, nhóm D1 của
`viec/AUDIT-1/dot_bien.py` (liên quan giả lập: `D1-S3-vi-lech` …) → 0 HỎNG trừ `G3-sai-chuoi`. Neo nào rữa vì file đổi →
sửa neo trong ba bộ đầu (trong Phạm vi); neo trong `viec/AUDIT-1/` → ghi Phát hiện (ngoài Phạm vi). (Danh sách neo đọc ở
mục 0 bản commit.)

## 9. Bài thử bị đụng → ca đỏ trên gốc (A11/A16)

| File | Ca đỏ trên gốc | `SỐ CA` |
|---|---|---|
| `cong_cu/thu_gia_lap.js` | E1 dòng tổng `27 kịch bản · 16 bất biến` (gốc in 18 · 10); ca dữ liệu tay I7/I12–I17 (gốc không có hàm → lệch/sập) | ghi khi chạy trên head |

Giả lập (`chay.js`) không phải bài `thu_*` nhưng được bộ kiểm chạy; bằng chứng đỏ của KB mới trên **server gốc + đột biến**
nằm ở bảng C1 (chạy `dot_bien.py` của AUDIT-1 trước và sau).

## 10. K5 — luồng hợp lệ phải KHÔNG bị chặn / KHÔNG lệch

- 18 KB cũ vẫn ĐẠT với 16 bất biến (đặc biệt KB9 mua gói + lấy ngay, KB9b lấy từ gói có sẵn `order_id NULL`, KB14 xoá đơn
  món không SX, KB5/KB15/KB16 huỷ).
- Gói có sẵn tạo bằng tay (`order_id NULL`) không bị phép "gói của đơn đã huỷ".
- Gói `cancelled` (đơn mua đã giao > 0 rồi huỷ) không bị phép tổng lượt.
- Đơn gõ mã hết lượt (đơn 200, không giảm) không bị đếm vào `used_count`.
- Mã đẻ từ claim mã bill (`signup-codes.js`) `used_count 0` không lệch.
- Đẩy sổ nợ: nợ `resolved` + SX nhận 1 → không lệch; bấm hai lần → không lệch.
- Ca dữ liệu tay "sạch" cho từng bất biến (mục 7).

## 11. Ngân sách (phiếu ~250 code + ~80 thử + ~80 hồ sơ)

`kich_ban.js` +~160 (9 KB) · `bat_bien.js` +~70 (6 mới + I7) · `chay.js` +~15 · `kiem_tra_truoc_khi_giao.js` ±~5 ·
`thu_gia_lap.js` +~90 (ca dữ liệu tay cho 7 bất biến — vượt ~10 so với 80; lý do: mỗi bất biến cần bộ sạch + hai phía lệch) ·
`viec/LUOI-1/dot_bien.py` ~80.

## 11b. Mục nghiệm thu còn lại

- **B6:** `kiem_tra_truoc_khi_giao.js:753–754` `NGUONG_KICH_BAN` 18 → 27, `NGUONG_BAT_BIEN` 10 → 16 (theo số thật khi xong);
  chú thích S4 `:756–757` thay bằng số đo A0/A1 thật. Không đổi dòng nào khác (K8).
- **C2:** cùng lần chạy 87 C2F với C1; in đủ 40 tên BẮT-trên-gốc (86 − 45 SỐNG − 1 LẠC, theo `viec/HOC-2b/trang_thai.md` D5)
  và bảng BẮT/SỐNG/HỎNG/LẠC đủ 87 tên vào `trang_thai.md`; `C2F-orders-02-insert-quay` LẠC là đúng.
- **D1:** đã ghi ở `trang_thai.md` (bản chụp). **D2:** PR + 2 check `cong`/`cong-chay` — máy không xem được → CHƯA KIỂM.
- **E:** `npm test` + `--day-du` xanh, 0 CẢNH BÁO chạy riêng; `thu_gia_lap` xanh.
- **Không phủ (ghi CHƯA KIỂM):** nhánh thử lại thất bại / `can_xem` / nợ không vân tay của sổ nợ (`doSoNo.js:56–65`, `:87–95`);
  `PUT /customer-packages/:id/cancel` (`packages.js:187`, quyền `manage_users`); tạo/xoá mã ở `signup-codes.js` (quản trị);
  I13 khi xoá đơn có mã (dòng đơn mất hẳn — không KB nào làm) và khi khách có chiết khấu riêng gõ mã không áp
  (loại + trị giá hồ sơ khách trùng đúng mã gõ mà không áp) — giới hạn đã biết của I13. **CHƯA PHỦ** (soát vòng 3 lỗi 6): xoá đơn
  mua thẻ (Phát hiện 10, Q7 a); chiều đổi tiền mặt → CK phía máy chủ (Phát hiện 13, Q10 a); trần giảm + loại % của mã đổi điểm
  phía máy chủ (Phát hiện 14 — chỉ dữ liệu tay); chủ sửa quà / mã đã dùng (Phát hiện 15).

## 12. Thời gian máy (từ số đo mục 0)

**Giả lập sau việc này (ước):** 56,9 s (A1) + 9 KB mới. Một đơn ~0,6 s, một lệnh nhẹ ~0,1–0,3 s (KB1 = 1 đơn = 0,63 s;
KB5 = 2 đơn + 2 huỷ + 1 claim = 2,8 s). KB19 ~2,5 · KB20 ~3 · KB21 ~8 · KB22 ~2 · KB23 ~4 · KB24 ~4 · KB25 ~1 · KB26 ~0,5 · KB27 ~1,5
→ +~27 s, 16 bất biến không trễ +~0,1 s → **~83 s** (hạn 120 s, ngưỡng cảnh báo 96 s; giả lập con trong `thu_gia_lap` hạn 110 s).
**`thu_gia_lap` (ước):** gốc chậm hơn giả lập ~8 s (13 giả lập con chạy song song) → **~91 s** — dưới 96 s nhưng SÁT (Q5).
Đo thật sau mỗi KB thêm vào; vượt 96 s → DỪNG theo A2.

**Thời gian máy cả việc (ước, tính cả phần đột biến):**
| Phần | Ước |
|---|---|
| Đo A0/A1 + đo từng KB mới | ~15 phút |
| Chạy thử trong lúc viết (giả lập ~15 lần, thu_gia_lap ~8, `--day-du` ~3) | ~45 phút |
| C1+C2: `dot_bien.py C2F C2-loyalty-redeem-tru-0` = 87 đột biến `c2full` (giả lập ~83 s + P26a + P26b mỗi cái), -j 4 trên 4 lõi | ~60 phút |
| C3: ~22 đột biến (≈15 chạy `thu_gia_lap` -j 1 vì mỗi cái tự đẻ 13+ giả lập con; ≈7 chạy giả lập) | ~30 phút |
| C4: TU-CHAY-4 (10), HOC-2b (28), P26b, D1 liên quan giả lập | ~45–60 phút |
| **Tổng** | **~195–210 phút > 150** → Q4 |

## 13. Câu hỏi và Phát hiện

Ở `trang_thai.md` (`## Câu hỏi` Q1–Q5, `## Phát hiện` 1–7). Chủ quán trả lời Q1–Q5 khi duyệt kế hoạch.
