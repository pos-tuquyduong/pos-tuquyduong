# P26b — Kế hoạch

Phiếu dặn **chờ duyệt kế hoạch**: commit + push file này rồi DỪNG. Chưa sửa code, chưa viết bài thử.

## 0. Sự thật đã đọc trong lượt này (K1)

### Rà K4 — MỌI chỗ ghi `pos_wallets` (`grep -rn "pos_wallets" server --include=*.js`, bỏ dòng SELECT/JOIN/chú thích)

Chỉ có trong 5 route của phạm vi, **18 lệnh ghi ở 12 chỗ** (orders 6, wallets 8, refunds 2, damages 2) (database.js chỉ có CREATE; reports chỉ đọc). **`backup.js:324`, `:340` khôi phục sao lưu** xoá + chèn thẳng
`pos_wallets`, `pos_orders`, `pos_refund_requests` (tên bảng là biến — F2 không thấy) — ngoài phạm vi, Phát hiện 7:

| # | Chỗ | Đọc ví/đơn ở đâu | Ghi ví thế nào | Lỗ |
|---|---|---|---|---|
| W1 | `orders.js:887` tạo đơn (ví khách) | kiểm lần 1 ngoài tx `:660-693`, **kiểm lại trong tx** `:808-822` | `SET balance = ?` (số đọc trong tx) | ghi tuyệt đối — đúng nhờ tx ghi khoá độc quyền, nhưng phải đổi sang tương đối cho một khuôn (F2) |
| W2 | `orders.js:905` tạo đơn (ví mẹ) | như W1, `:702-724` rồi `:825-834` | `SET balance = ?` | như W1 |
| W3 | `orders.js:1383` huỷ (ví khách) | **đơn đọc NGOÀI tx** `:1355`, chỉ chặn `cancelled` `:1362`; ví đọc trong tx `:1374` | `SET balance = ?` | huỷ đơn `refunded` → hoàn lần 2 (A1); hai lệnh huỷ chồng nhau → hoàn 2 lần (B1) |
| W4 | `orders.js:1412` huỷ (ví mẹ) | như W3 | `SET balance = ?` | như W3 |
| W5 | `orders.js:1590` xoá (ví khách) | **đơn đọc NGOÀI tx** `:1557`, chỉ chặn `cancelled` `:1579` | `SET balance = ?` | xoá đơn `refunded` → hoàn lần 2 (A3); xoá chồng huỷ → 2 lần |
| W6 | `orders.js:1619` xoá (ví mẹ) | như W5 `:1608` | `SET balance = ?` | như W5 |
| W7 | `refunds.js:182/185` duyệt hoàn | yêu cầu + **ví đọc NGOÀI tx** `:153`, `:174`; **không đọc trạng thái đơn** | `SET balance = ?` / INSERT | duyệt khi đơn đã huỷ (A2); duyệt chồng nhau (B2); nạp chồng → mất khoản nạp (B4); `UPDATE ... status='approved'` và `status='refunded'` không điều kiện `:209-219` |
| W8 | `wallets.js:79/82` nạp | ví đọc NGOÀI tx `:71` | `SET balance = ?` / INSERT | bán đơn chồng → mất khoản trừ (B4); ví chưa có + hai lệnh nạp → INSERT trùng `phone UNIQUE` → 500 |
| W9 | `wallets.js:131` trừ tay | ví đọc + kiểm đủ NGOÀI tx `:121-127` | `SET balance = ?` | B4 |
| W10 | `wallets.js:184/187/191` điều chỉnh | ví đọc + kiểm không âm NGOÀI tx `:172-178` | `SET balance = ?` / INSERT | B4 |
| W11 | `wallets.js:256/259` đối soát (`reconcileWallet` `:247`) | tổng sổ + ví đọc, **KHÔNG có tx** | `SET balance = ?` (tổng sổ) | bán đơn xen giữa đọc tổng và ghi → mất khoản trừ (B4) |
| W12 | `damages.js:168/171` báo hỏng | đơn, món, **ví đọc NGOÀI tx** `:136`, `:142`, `:160`; tiền đền = `refund_amount` màn hình gửi `:156` | `SET balance = ?` / INSERT | C1 (tin số màn hình); C2 (không cộng dồn); C3; B4; sổ thiếu `order_id` `:175`; dòng `pos_damage_logs` ghi NGOÀI tx `:211` (C4) |

Chỗ **đổi trạng thái** đơn / yêu cầu hoàn (`grep -n "pos_refund_requests\|'refunded'\|status = 'cancelled'" server/routes/*.js`):
`orders.js:1486-1490` (huỷ, không điều kiện), `orders.js:1674` (xoá đơn), `orders.js:1670` (xoá yêu cầu theo đơn),
`refunds.js:121` (tạo yêu cầu — kiểm trùng NGOÀI tx `:113`, không tx), `refunds.js:209-219` (duyệt), `refunds.js:263-270`
(từ chối — không tx, không điều kiện). `pay-debt` (`orders.js:1286-1287`) đã có UPDATE điều kiện — không đụng.
`don-mo-rong.js` (đổi cách trả) chặn đơn trả ví (`:135-137`) — không ghi ví, ngoài phạm vi.

### Các sự thật khác

| Chỗ | Đọc thấy |
|---|---|
| `server/database.js:1369-1370` | `beginTransaction()` = `db.transaction("write")` → BEGIN IMMEDIATE: trong tx là khoá ghi độc quyền |
| thử thật `node viec/P26b/thu_kho_ban.js` (libsql file) | tx thứ 2 mở khi tx 1 chưa xong → **SQLITE_BUSY ngay** (không chờ); và kết nối của lần thất bại **bị hỏng**: tx sau trên nó lỗi lúc COMMIT ("SQL statements in progress"). Turso (máy thật) đi đường khác — CHƯA KIỂM |
| `cong_cu/gia_lap/chay.js:131-135` | móc `moc.truocTx` chạy NGUYÊN một lệnh khác trước khi tx của lệnh này mở → chồng nhau TẤT ĐỊNH, không có hai tx mở cùng lúc |
| `orders.js:175` | đơn chỉ có gói (không món) hợp lệ; `orders.js:1123-1132` không sinh mã bill cho SĐT đã claim |
| `orders.js:1665-1675` | xoá đơn KHÔNG xoá `pos_signup_codes`; vân tay kho của đơn bị xoá còn trong SX giả → trong giả lập, xoá đơn có món SX / có mã bill làm I2, I7 đỏ (lỗi có sẵn, xem Phát hiện) |
| `client/src/pages/Orders.jsx:297-322` | màn báo hỏng gửi `refund_amount = unit_price × qty` mặc định, sửa tay được (`:1383-1384`, `parseInt || 0`); không gửi `unit_price` |
| `cong_cu/thu_P21.js:155` | báo hỏng `refund_amount: 7000` trên món 19.000đ → vẫn phải 200 sau vá (K5) |
| `packages.js:169-180` | `POST /buy`; `grep -rn "packages/buy" client/src server` = 0; chỉ `cong_cu/thu_P26a.js:105-108` gọi |
| `bat_bien.js:21` / `:31` | chú thích "KB12 sẽ phủ" (sai — P26a đã ghi) / nhánh `refunded` của I1 |
| `kiem_tra_truoc_khi_giao.js:488`, `:715-716`; `thu_gia_lap.js:31` | danh sách bài nhanh; `NGUONG_KICH_BAN = 12`, `NGUONG_BAT_BIEN = 9`; dòng tổng 12 · 9 |

## 1. Khuôn vá chung — một hàm ghi ví duy nhất

| | Cách | File | Dòng (ước) | Rủi ro |
|---|---|---|---|---|
| **A (chọn)** | `ghiVi(tx, {...})` trong `wallets.js`, export kèm router (`module.exports.ghiVi`): đọc ví TRONG tx → `INSERT ... ON CONFLICT(phone) DO UPDATE SET balance = balance + excluded.balance` (cộng tương đối, chịu được ví chưa có) + cột tổng CHỈ khi chỗ gọi truyền `cot` (nạp/điều chỉnh → `total_topup`, bán/trừ tay → `total_spent +`, huỷ/xoá →
`total_spent −`; duyệt hoàn và báo hỏng KHÔNG truyền — giữ như gốc `refunds.js:182`, `damages.js:168`, không tự sửa
Phát hiện 1) + ghi dòng sổ với `balance_before/after` lấy trong tx. Tuỳ chọn `khongAm` → trả `null` nếu số dư sau < 0 để route rollback 400. 11 chỗ W1–W10, W12 gọi nó | 1 hàm, 4 file gọi | +22 hàm; mỗi chỗ ~15 → ~4 dòng ⇒ **routes −60…−90 ròng** | gom luật vào một chỗ; đổi nhỏ: dòng sổ báo hỏng có `customer_name`, `order_id`, `created_at = getNow()` thay `datetime('now')` (Q5) |
| B | sửa tại chỗ 12 lần: `balance = balance ± ?` + đọc lại trong tx | 4 file | ±0 ròng, ~180 đổi | lặp luật 12 lần — sau sửa một quên một (K4) |

Đổi hành vi nêu rõ: gốc huỷ/xoá đơn **bỏ qua** hoàn ví nếu khách chưa có dòng ví (`orders.js:1378`, `:1585`). Đơn trả ví
thì ví đã có (tạo đơn ghi vào nó), nên `ghiVi` kiểu upsert chỉ khác gốc khi ví bị xoá tay / khôi phục sao lưu thiếu dòng —
khi đó sau vá khách vẫn được hoàn (đúng nghĩa), gốc thì mất tiền âm thầm. Báo hỏng hoàn tiền cho đơn KHÔNG có SĐT: giữ như
gốc (`damages.js:159`): 200, log ghi `refund_amount`, không cộng ví nào (Q7).

**Giữ đột biến M10** (`thu_gia_lap.js:77-78` tìm `VALUES (?, 'compensation',`): chỗ gọi `ghiVi` trong `damages.js` không
còn chuỗi đó → M10 khớp 0 lần → HỎNG. Sửa chuỗi gốc/thay của M10 sang đúng dòng mới (vd `loai: 'compensation'` →
`loai: 'den_bu'`), giữ KB6 → I4. Đây là sửa dòng trong `thu_gia_lap.js` (trong phạm vi), không bỏ đột biến.

Chọn A: ít dòng nhất, và phép tĩnh F2 khoá được bằng một câu: "ngoài `ghiVi` và chỗ đối soát có đánh dấu, `server/routes/`
không có lệnh ghi `pos_wallets`".

**Trạng thái** (nguyên tắc 2 của phiếu): mỗi chỗ đổi trạng thái đi theo đúng một mẫu, đặt **đầu tiên trong tx**:
`const r = await tx.run("UPDATE ... SET status = 'x' ... WHERE id = ? AND status = 'y'"); if (r.changes !== 1) { await tx.rollback(); return res.status(400)... }`.
Cổng là UPDATE có điều kiện (MỘT lớp, không thêm lớp đọc-rồi-kiểm thứ hai) — để mỗi đột biến F3 có ca bắt được (K3: hai
lớp chồng nhau thì bỏ một lớp vẫn xanh, đột biến không bắt được).

**Kho bận (SQLITE_BUSY)** — Q1. Đề xuất A: các route đã sửa bắt `err.code === 'SQLITE_BUSY'` → `409 { code: 'KHO_BAN',
error: 'Đang có thao tác khác ghi sổ — bấm lại' }` (tx đã rollback nên lệnh này không ghi gì; nhưng trên kho file, kết nối
vừa BUSY bị hỏng — lệnh ghi SAU có thể lỗi tiếp, xem mục 0 — nên "bấm lại" chỉ đúng trên Turso, mà Turso CHƯA KIỂM),
qua hàm nhỏ `loiGhi(res, err)` cạnh `ghiVi` (+4 dòng, mỗi catch đổi 1 dòng). Thử TẤT ĐỊNH: cho `beginTransaction` ném
lỗi mã `SQLITE_BUSY` trong `thu_P26b`, **một ca cho MỖI route đã đổi** (10 route: tạo đơn, huỷ, xoá, tạo yêu cầu, duyệt,
từ chối, nạp, trừ tay, điều chỉnh, đối soát, báo hỏng) — đỏ trên gốc (500). **Phần này chỉ viết nếu Q1 chọn A**;
Q1 chọn "để sau" thì bỏ hẳn `loiGhi` + ca K1 (bớt ~20 dòng), lệnh thua vẫn 500 như gốc. Phương án B (thử lại BEGIN vài lần) phải sửa `database.js` — ngoài phạm
vi. Kết nối libsql hỏng sau BUSY (ở trên) cũng thuộc `database.js` → Phát hiện, không sửa.

## 2. Sửa từng route (phạm vi phiếu)

| Route | Sửa | Nghiệm thu |
|---|---|---|
| `orders.js` POST `/` | W1, W2 qua `ghiVi` (`khongAm`); bỏ khối kiểm lại thủ công `:808-834` (thay bằng `khongAm` — một chỗ kiểm, trong tx). Giữ kiểm lần 1 ngoài tx `:660-724` (báo lỗi sớm, không phải cổng). Lỗi "Số dư không đủ" (`:668`, `:686`, `:816`,
`:831`) thêm `code: 'SO_DU_KHONG_DU'` để ca B5 so `code`, không dò chữ (E12) | B5 |
| `orders.js` PUT `/:id/cancel` | tx mở trước; đọc đơn TRONG tx; cổng `UPDATE pos_orders SET status='cancelled' ... WHERE id = ? AND status = 'completed'` + `changes !== 1` → 400 `DON_KHONG_HUY_DUOC` (đơn đã huỷ / đã hoàn); W3, W4 qua `ghiVi`; `UPDATE pos_refund_requests SET status='rejected', rejection_reason='Đơn đã huỷ', processed_by, processed_at WHERE order_id = ? AND status = 'pending'` cùng tx. Đọc món để hoàn kho SX giữ ngoài tx như cũ | A1, A4, B1 |
| `orders.js` DELETE `/:id` | tx mở trước; đọc đơn TRONG tx (không có → 404); hoàn ví CHỈ khi `status === 'completed'` (thay `!== 'cancelled'`); `DELETE FROM pos_orders WHERE id = ?` kiểm `changes === 1`. Yêu cầu hoàn của đơn vẫn bị xoá cùng tx (`:1670`) — Q3 | A3, A4 |
| `refunds.js` POST `/` | tx: đọc đơn + kiểm trùng `pending` TRONG tx, rồi INSERT | B3 |
| `refunds.js` POST `/:id/approve` | tx: cổng `UPDATE pos_refund_requests SET status='approved' ... WHERE id = ? AND status = 'pending'` (`changes`); cổng `UPDATE pos_orders SET status='refunded' WHERE id = ? AND status = 'completed'` (`changes` → 400 `DON_KHONG_CON_HOAN_DUOC`); W7 qua `ghiVi`; rồi gắn `balance_transaction_id` | A2, B2 |
| `refunds.js` POST `/:id/reject` | trong tx (để móc giả lập chen được), cổng `... WHERE id = ? AND status = 'pending'` (`changes`) | B2 (từ chối chồng duyệt) |
| `wallets.js` topup / deduct / adjust | toàn bộ đọc + kiểm + ghi trong tx qua `ghiVi` (`khongAm` cho deduct, adjust âm) | B4 |
| `wallets.js` `reconcileWallet` | đọc tổng sổ + ví và ghi trong MỘT tx; giữ `SET balance = ?` (đối soát là ghi tuyệt đối có chủ đích) kèm dấu `// P26b-DOI-SOAT` cho F2. Phép S/E10 (`kiem_tra:494-509`) vẫn khớp vì `SUM(amount) ... ${DK_LOAI_VI}` giữ nguyên | B4 |
| `damages.js` POST `/` | kiểm `quantity` nguyên dương, `refund_amount` không âm (nếu có); tx: đọc đơn + món TRONG tx; `action === 'refund'` mà đơn không `completed` → 400 (C3); tổng `SUM(quantity)` đã báo của `(order_id, product_code)` + lần này > `item.quantity` → 400 (C2, mọi action); trần = `item.unit_price × quantity` từ kho, `refund_amount` > trần → 400 (C1), thiếu/0 → bằng trần (giữ như cũ `:156`); `ghiVi` (sổ có `order_id`) + INSERT `pos_damage_logs` (`returned_to_stock = 0`) cùng tx; commit; rồi gọi SX hoàn kho ngoài tx như cũ, thành công thì `UPDATE pos_damage_logs SET returned_to_stock = 1 WHERE id = ?` | C1–C4, B6 |
| `packages.js` POST `/buy` | xoá route `:168-180` (13 dòng). Route khác của file không đổi | D |

Ước lượng routes: −13 (packages), damages ±40 đổi, orders −40…−60 ròng, refunds +15, wallets +26 hàm / −40 chỗ gọi.
Tổng đổi ~150–180 dòng, ròng âm — trong ngân sách 120–180 ("đổi nhiều hơn thêm").

## 3. Bài thử mới `cong_cu/thu_P26b.js` (~200 dòng, F1)

Dựng như `thu_P26a.js:19-60` (ketNoiKho trỏ file tạm, `database.js` thật, express gắn `orders refunds wallets damages
packages`, JWT chủ quán, `--may-chu` cho đột biến). Trước khi `require` route: bọc `db.beginTransaction` để (a) ném lỗi mã
`SQLITE_BUSY` một lần khi bật cờ, (b) làm `commit()` ném lỗi một lần khi bật cờ (ca "cùng giao dịch" — lỗi ở bước cuối nên mọi câu ĐẶT trong tx đã chạy
và phải bị rollback; câu nào lọt ra ngoài tx thì còn lại trong kho). Đẩy
`sqlite_sequence` của `pos_orders`, `pos_refund_requests`, `pos_balance_transactions`, `pos_damage_logs` lên mốc khác nhau
(bài học P26a). So status + `code` + kho, không dò chữ (E12).

| Ca | Nghiệm thu | Làm gì | Gốc |
|---|---|---|---|
| A1a | A1 | đơn ví 25k → yêu cầu → duyệt → **huỷ** → 400, ví + sổ không đổi | **ĐỎ** (200, ví +25k lần 2) |
| A1b | A1/K5 | huỷ đơn ví `completed` → 200, ví +25k đúng một dòng `refund` | xanh — phải KHÔNG hỏng |
| A1c | A1/K5 | huỷ đơn tiền mặt `completed` → 200 | xanh — K5 |
| A2a | A2 | yêu cầu `pending` trên đơn đã huỷ (dữ liệu cũ trước vá: đặt `status='cancelled'` bằng SQL) → duyệt → 400, ví không đổi, yêu cầu không `approved` | **ĐỎ** |
| A2b | A2 | như A2a với đơn `refunded` (yêu cầu thứ 2 chèn bằng SQL) | **ĐỎ** |
| A2c | A2/K5 | duyệt bình thường → 200, ví + đúng, đơn `refunded` | xanh — K5 |
| A3a | A3 | xoá đơn đã hoàn → 200, ví không đổi | **ĐỎ** (ví +lần 2) |
| A3b | A3 | xoá đơn đã huỷ → ví không đổi | xanh (đã chặn `:1579`) — giữ |
| A3c | A3/K5 | xoá đơn ví `completed` → ví + đúng một lần | xanh — K5 |
| A4a | A4 | đơn có yêu cầu `pending` → huỷ → yêu cầu `rejected`, `rejection_reason = 'Đơn đã huỷ'` | **ĐỎ** (còn `pending`) |
| A4b | A4 | huỷ đơn có yêu cầu `pending`, làm tx ném lỗi ở `commit()` (bước CUỐI của tx — mọi câu trong tx đã chạy) → 500, yêu cầu VẪN `pending`, đơn vẫn `completed`, ví không đổi (bắt "từ chối ngoài giao dịch", đặt trước HAY sau tx đều bị bắt: sau tx thì không bao giờ tới vì commit ném) | xanh trên gốc (gốc không đụng yêu cầu) — khoá đột biến |
| A4c | A4 | xoá đơn có yêu cầu `pending` → không còn yêu cầu `pending` nào của `order_id` | xanh (đã xoá `:1670`) — Q3 |
| A5 | A5 | sau mọi ca: mỗi `order_id`, `SUM(refund) ≤ −SUM(purchase)` (mọi ví) | **ĐỎ** (A1a, A3a) |
| C1a | C1 | đơn 1 món 20k → báo hỏng `refund_amount: 50000` → 400, ví không đổi | **ĐỎ** (200, +50k) |
| C1b | C1 | như C1a nhưng body kèm `unit_price: 999999, damage_value: 999999` → 400 (bắt "trần theo số màn hình gửi") | **ĐỎ** |
| C1c | C1/K5 | `refund_amount` = giá (20k) và < giá (7k) → 200, ví + đúng số | xanh — K5 |
| C1d | C1 | `refund_amount: -5000` → 400, không có dòng log | **ĐỎ** (200, log −5000) |
| C2a | C2 | món qty 2: báo `return_stock` 1 → 200; báo `refund` 1 → 200; báo `none` 1 → 400 | **ĐỎ** (200) |
| C3a | C3 | đơn đã huỷ → báo hỏng `refund` → 400, ví không đổi | **ĐỎ** |
| C3c | C3 | đơn đã hoàn → báo hỏng `refund` → 400, ví không đổi (ca riêng: đột biến "quên `refunded`" chỉ vi phạm ca này) | **ĐỎ** |
| C3b | C3/K5 | đơn đã huỷ → báo hỏng `none` → 200 (ghi nhận không tiền vẫn được) | xanh — K5 |
| C4a | C4 | dòng sổ `compensation` có `order_id` = đơn | **ĐỎ** (NULL) |
| C4b | C4 | tx ném lỗi ở `commit()` → 500, ví không đổi, không dòng `compensation` | **ĐỎ** (ví đã cộng) |
| D | D | `POST /packages/buy` → 404, không thêm dòng `pos_customer_packages` | **ĐỎ** (200) |
| K1 | phiếu "không 500" | cờ BUSY bật → MỖI route đã đổi (11 lệnh) → 409 `KHO_BAN`, kho không đổi (ví, đơn, yêu cầu) | **ĐỎ** (500) — chỉ khi Q1 = A |

Kết luận đỏ: dòng tổng `n đạt · m hỏng`, m > 0 do đúng các ca **ĐỎ** ở trên; ghi các dòng ✗ vào `bang_chung_do.txt`.

## 4. Giả lập — `kich_ban.js`, `bat_bien.js`, `thu_gia_lap.js` (E1–E5)

Mọi ca chồng nhau dùng `c.moc.truocTx` (như KB11) — KHÔNG dùng `Promise.all` cho route có tx: hai tx thật mở cùng lúc trên
file làm hỏng kết nối libsql của giả lập (mục 0). Thêm 6 kịch bản vào **cuối** (KB13–KB18), không đụng KB1–KB12:

| KB | Nghiệm thu | Làm gì | Đỏ trên gốc vì |
|---|---|---|---|
| KB13 hoàn rồi huỷ | A1, **E2** | khách quen trả ví 25k; `/claim` mã in trên bill; `POST /refunds` + duyệt → 200; huỷ → mong 400, ví không đổi. Đơn ở lại `refunded` có mã đã dùng ⇒ I1 đi qua nhánh `refunded` | huỷ 200, ví +25k lần 2 (mong ✗, I10 ✗) |
| KB14 xoá đơn đã hoàn | A3 | `KH.moi` (đã claim ở KB7 ⇒ đơn không sinh mã bill) nạp 300k, mua **chỉ gói** (không món SX ⇒ I7 không đụng) trả ví; yêu cầu + duyệt; xoá → ví không đổi. Thêm: đơn chỉ-gói thứ hai, móc `truocTx` của lệnh XOÁ = lệnh HUỶ cùng đơn → ví cộng đúng một lần | xoá cộng ví lần 2 (mong ✗, I10 ✗) |
| KB15 bấm trùng huỷ / tạo yêu cầu | B1, B3 | B1: móc của lệnh huỷ = lệnh huỷ cùng đơn → đúng một 200, ví +một lần. B3: móc của `POST /refunds` = `POST /refunds` cùng đơn → một 200 + một 400, đúng 1 `pending` | B1: hai 200, +50k. B3: gốc **không có tx** ⇒ móc không chạy ⇒ mong "móc đã chạy" ✗ (đỏ theo cấu trúc — Q4) |
| KB16 bấm trùng duyệt / từ chối | B2, A2, A4 | móc của duyệt = duyệt → một lần cộng ví; móc của duyệt = HUỶ đơn → duyệt 400, yêu cầu `rejected` "Đơn đã huỷ", ví chỉ +một lần (từ huỷ); móc của từ chối = duyệt → từ chối 400, yêu cầu `approved` | gốc: duyệt đọc ví NGOÀI tx rồi ghi tuyệt đối (`refunds.js:174-182`) ⇒ ví chỉ +1 nhưng sổ có **2 dòng `refund`** ⇒ mong "đúng 1 dòng `refund` theo `order_id`" ✗, I4 ✗ (ví ≠ sổ), I10 ✗. Mong của KB16 kiểm SỐ DÒNG sổ, không chỉ số dư (soát bắt: chỉ kiểm số dư thì xanh oan) |
| KB17 nạp chồng bán / trừ tay / điều chỉnh / đối soát / duyệt; hai đơn ví vượt số dư | B4, B5 | SĐT mới nạp 30k. Móc của NẠP = bán đơn ví 25k; móc của TRỪ TAY = nạp; móc của ĐIỀU CHỈNH = nạp; móc của ĐỐI SOÁT = bán đơn; móc của DUYỆT = nạp; móc của BÁO HỎNG hoàn tiền = nạp. Chiều trừ: số dư 20k, móc của TRỪ TAY 20k = bán đơn ví 15k → trừ tay 400 `SO_DU_KHONG_DU`, số dư ≥ 0; tương tự ĐIỀU CHỈNH −20k. Mong: số dư = sổ (I4) và chuỗi sổ của SĐT này liền (`balance_before` dòng sau = `balance_after` dòng trước, `after = before + amount`). B5: số dư 30k, móc của đơn ví 25k = đơn ví 25k khác → một 200 + một 400 "Số dư không đủ", số dư ≥ 0 | nạp ghi tuyệt đối số đọc ngoài tx ⇒ mất khoản bán (I4 ✗). **B5 riêng thì XANH trên gốc** (`orders.js:808-822` đã kiểm lại trong tx) — Q4 |
| KB18 báo hỏng chồng nhau, đơn đã huỷ | B6, C2, C3 | đơn tiền mặt món qty 2; báo `return_stock` 1; móc của báo hỏng `refund` 1 = báo hỏng `none` 1 → lệnh ngoài 400, tổng đã báo ≤ 2. Huỷ đơn khác rồi báo hỏng `refund` → 400 | gốc không cộng dồn, không chặn đơn huỷ → 200 (mong ✗) |

- **I10 (E3, A5)** trong `bat_bien.js`: theo `pos_balance_transactions` (chạy cả với đơn đã xoá), mỗi `order_id`
  `SUM(amount) WHERE type='refund'` ≤ `−SUM(amount) WHERE type='purchase'` (+0,5đ). ~8 dòng.
- **E2**: sửa chú thích `bat_bien.js:21` → "KB13 phủ nhánh `refunded`". Chứng minh: `dot_bien.py` thay nhánh `:31` bằng
  `false` trên BẢN SAO giả lập (`thu_gia_lap.js --gia-lap <bản sao>`, như E4) → giả lập ĐỎ ở `KB13 → I1`.
- **E4**: `dungDuLieu` đẩy THẲNG `sqlite_sequence` của `pos_orders`, `pos_refund_requests`, `pos_balance_transactions`,
  `pos_damage_logs` lên mốc khác nhau (như `thu_P26a.js:86-87`) — KHÔNG chèn dòng giả (dòng giả `approved` làm lệch
  I1 `bat_bien.js:27`), để id máy chủ trả không trùng nhầm id bảng khác.
- **E5**: `NGUONG_KICH_BAN = 18`, `NGUONG_BAT_BIEN = 10` (`kiem_tra:715-716`); `DONG_DAT = 'Giả lập: 18 kịch bản · 10 bất
  biến · ĐẠT'` (`thu_gia_lap.js:31`).
- **Thời gian** (S4): giả lập hiện 22 s / 12 KB; thêm 6 KB (mỗi KB ~10–20 lệnh × 40 ms trễ) ước +6–10 s ⇒ ~30 s, dưới
  110 s (`thu_gia_lap.js:53`) và 120 s (`kiem_tra:479`). `thu_gia_lap` chạy song song nên ~35 s. Đo thật ở bước 6;
  vượt 80 s thì ghi Câu hỏi, không tự nới giới hạn.
- `thu_gia_lap.js` thêm 2 đột biến vào `DOT_BIEN`: **M11** huỷ đơn bỏ `AND status = 'completed'` → KB13 → I10;
  **M12** xoá đơn hoàn ví bất kể trạng thái → KB14 → I10. Chuỗi chính xác chốt sau khi vá (đếm số lần khớp như M1–M10).

Đỏ trên gốc theo file (luật cổng main): `thu_P26b.js` (mới) đỏ — các ca **ĐỎ** mục 3. `thu_P26a.js` (sửa C4) đỏ — gốc trả
200. `thu_gia_lap.js` (sửa dòng tổng) đỏ — gốc ra "12 kịch bản · 9 bất biến". Giả lập trên gốc: KB13–KB18 có dòng lệch.

## 5. `cong_cu/thu_P26a.js` (D, ±5 dòng)

Ca C4 thành: `POST /packages/buy` → 404 **và** `SELECT COUNT(*) FROM pos_customer_packages WHERE customer_phone = ?` không
đổi. Bỏ `id4`. Mua gói qua đơn hàng: KB9 (giả lập) vẫn xanh.

## 6. Bộ kiểm `kiem_tra_truoc_khi_giao.js` (~25 dòng)

- `:488` thêm `'cong_cu/thu_P26b.js'` vào bản nhanh (F1).
- **F2** (nhóm E, ~15 dòng): mọi file `server/routes/*.js` — sau `boGhiChu` — mọi câu `UPDATE pos_wallets` / `INSERT INTO
  pos_wallets` phải nằm trong thân `async function ghiVi` của `wallets.js`, trừ đúng một chỗ trong thân `reconcileWallet`
  (thân đó có `beginTransaction(`). Dấu cho chỗ đối soát KHÔNG là ghi chú `//` (`boGhiChu` `kiem_tra:86-90` xoá mất —
  soát bắt): dùng hằng `const GHI_TUYET_DOI_DOI_SOAT = true;` hoặc tìm vị trí trên mã gốc rồi đối chiếu — chốt lúc viết. Không có `SET balance = ?` nào ngoài chỗ đó.
  Đỏ trên gốc (18 lệnh ghi ở 12 chỗ). Dấu đếm đúng 1 (thêm dấu thứ hai để lách → đỏ).
- **KHUON_LOI.md** (trong phạm vi, 118/120): bài học của việc này GỘP vào dòng cũ (K3: "hai lớp chặn chồng nhau → đột
  biến bỏ một lớp không bắt được — mỗi chỗ vá MỘT cổng"; K4: "chỗ ghi cùng bảng qua tên bảng là biến — grep không
  thấy"), không vượt 120 dòng. Viết ở bước 11, sau khi có sự cố thật.
- E5: hai ngưỡng (mục 4).

## 7. F3 — đột biến (`viec/P26b/dot_bien.py`): mỗi chỗ vá cả "bỏ vá" và "vá sai"

Chạy trên BẢN SAO `server/` (như `viec/P26a`), mỗi đột biến khớp đúng số lần, rồi chạy `thu_P26b --may-chu` hoặc giả lập
`--may-chu --den-kb N`; phải ra ✗ đúng ca ghi bên cạnh.

| Chỗ | Bỏ vá | Vá sai | Bắt bởi |
|---|---|---|---|
| huỷ — cổng trạng thái | bỏ `AND status = 'completed'` | (a) kiểm trạng thái NGOÀI tx + UPDATE không điều kiện; (b) có điều kiện nhưng bỏ `changes !== 1` | A1a; (a) KB15-B1; (b) A1a |
| huỷ — từ chối yêu cầu | bỏ câu từ chối | từ chối bằng `run()` ngoài tx | A4a; A4b |
| xoá — chỉ `completed` | về `!== 'cancelled'` | đọc đơn ngoài tx | A3a; KB14 (móc huỷ) |
| tạo đơn — số dư | bỏ `khongAm` | `khongAm` so với số đọc NGOÀI tx | KB17-B5 |
| trừ tay / điều chỉnh — số dư | bỏ `khongAm` | kiểm đủ NGOÀI tx | KB17 chiều trừ |
| tạo yêu cầu — trùng | bỏ kiểm trùng | kiểm trùng ngoài tx | KB15-B3 |
| duyệt — cổng yêu cầu | bỏ `AND status = 'pending'` | bỏ kiểm `changes` | KB16 |
| duyệt — trạng thái đơn | bỏ cổng đơn | cổng đơn không kiểm `changes` | A2a, A2b |
| từ chối | bỏ `AND status = 'pending'` | bỏ kiểm `changes` | KB16 |
| `ghiVi` | ghi tuyệt đối từ số đọc ngoài tx (nạp) | cộng tương đối nhưng `balance_before` đọc ngoài tx | KB17 (I4); KB17 (chuỗi sổ) — và F2 |
| đối soát | bỏ tx | đọc tổng sổ ngoài tx, ghi trong tx | KB17 |
| báo hỏng C1 | bỏ trần | trần theo `req.body.unit_price/damage_value` | C1a; C1b |
| báo hỏng C2 | chỉ so qty lần này | cộng dồn đọc ngoài tx | C2a; KB18 |
| báo hỏng — ví | ghi tuyệt đối từ số đọc ngoài tx | — | KB17 (móc báo hỏng = nạp) |
| báo hỏng C3 | bỏ | chỉ chặn `cancelled`, quên `refunded` | C3a; C3c |
| báo hỏng C4 | log ngoài tx | bỏ `order_id` sổ | C4b; C4a |
| BUSY (nếu Q1 = A) | bỏ ánh xạ 409 ở TỪNG route (11 đột biến) | — | K1 từng route |
| `/packages/buy` | dựng lại route | — | D |
| I10 | (giả lập) bỏ I10 | — | `thu_gia_lap` M11/M12 |
| I1 `refunded` (E2) | nhánh `:31` = `false` | — | KB13 → I1 |

Tên đột biến ghi vào `trang_thai.md` khi chạy xong.

## 8. Luồng hợp lệ phải KHÔNG bị chặn (K5)

| Phép chặn mới | Luồng hợp lệ đi qua | Ca giữ |
|---|---|---|
| huỷ chỉ `completed` | huỷ đơn chưa thu / ghi nợ / tiền mặt / trả ví / mua gói / giao từ gói (đều `completed`) | A1b, A1c, KB5 (giả lập), thu_P20 [B], thu_P21 |
| duyệt chỉ khi đơn `completed` | duyệt yêu cầu bình thường | A2c, KB12, thu_P20 [B2] |
| xoá chỉ hoàn `completed` | xoá đơn ví còn hiệu lực | A3c |
| tạo yêu cầu trong tx | tạo yêu cầu bình thường | KB12, thu_P26a C1 |
| báo hỏng trần giá | màn hình gửi đúng giá / ít hơn / bỏ trống (=giá) | C1c, KB6, thu_P21 (7.000/19.000) |
| báo hỏng cộng dồn | báo nhiều lần tổng = qty; `return_stock`/`none` không tiền | C2a (2 lần đầu 200), C3b |
| báo hỏng C3 | `none` trên đơn huỷ | C3b |
| nạp / trừ / điều chỉnh / đối soát trong tx | mọi lệnh tuần tự | KB8, thu_P21 [A]–[D] |
| `khongAm` tạo đơn | đơn ví vừa đủ số dư | KB4, KB8, KB12, KB17 |
| bỏ `/packages/buy` | mua gói qua đơn hàng | KB9a, KB14 |
| 409 KHO_BAN | không có (chỉ khi kho bận) | — |
| báo hỏng trần giá | **món giao từ gói** (`unit_price = 0`, `orders.js:1470`): trần = 0 ⇒ mọi khoản đền > 0 bị 400 | Q6 |
| báo hỏng trần + cộng dồn | đơn có **hai dòng cùng `product_code`** (Phát hiện 3): trần/cộng dồn theo dòng đầu | Q6 |
| huỷ chỉ `completed` | màn hình chỉ cho XOÁ đơn đã huỷ (`Orders.jsx:242`); đơn đã hoàn không huỷ được nữa ⇒ **mất đường xoá trên màn hình** | Q8 |

## 9. Câu hỏi cho chủ quán (trả lời khi duyệt)

- **Q1 — kho bận.** Chọn A: `SQLITE_BUSY` → 409 `KHO_BAN` "bấm lại" (không ghi gì). Hành vi BUSY trên Turso CHƯA KIỂM.
  Sửa tận gốc (thử lại BEGIN; kết nối libsql hỏng sau BUSY) phải đụng `server/database.js` — cấm trong phiếu này.
- **Q2 — A3 trong giả lập** dựng bằng đơn **chỉ có gói** của khách đã claim mã: xoá đơn có món SX / có mã bill làm I7 / I2
  đỏ vì xoá đơn không dọn mã bill và vân tay kho (lỗi có sẵn, Phát hiện 4). Được không?
- **Q3 — A4 với XOÁ đơn**: code xoá luôn yêu cầu hoàn của đơn cùng tx (`orders.js:1670`) — không còn dòng để thành
  `rejected`. Đề xuất giữ xoá (không còn `pending` nào duyệt được); ca A4c kiểm "không còn `pending`". Hay phải giữ dòng
  và đổi thành `rejected`?
- **Q4 — "mỗi kịch bản mới ĐỎ trên gốc"**: B3 và đối soát (B4) đỏ trên gốc chỉ theo cấu trúc (gốc không có tx ⇒ móc không
  chạy); B5 xanh trên gốc vì tạo đơn đã kiểm lại số dư trong tx. B5 gộp vào KB17 (đỏ nhờ B4), bằng chứng riêng của B5 là
  đột biến "bỏ `khongAm`". Chấp nhận?
- **Q5 — dòng sổ `compensation`** qua `ghiVi` sẽ có `customer_name`, `order_id`, và `created_at = getNow()` (giờ VN, như
  mọi dòng sổ khác) thay `datetime('now')` (UTC). Đồng ý đổi?

- **Q6 — trần đền bù C1 với món giao từ gói** (`unit_price = 0` ⇒ trần 0 ⇒ không đền tiền được) và món trùng
  `product_code`. Chấp nhận (đền gói thì làm việc khác), hay trần lấy giá khác?
- **Q7 — báo hỏng `refund` cho đơn không SĐT**: gốc 200, log ghi số tiền nhưng không cộng ví nào. Giữ như gốc?
- **Q8 — đơn đã hoàn**: sau A1 không huỷ được ⇒ màn Lịch sử đơn không còn nút xoá cho nó (`Orders.jsx:242` chỉ xoá đơn
  `cancelled`), và gói / thẻ hội viên / kho của đơn hoàn không được hoàn lại (Phát hiện 9). Chấp nhận trong việc này?

## 10. Phát hiện (ngoài phạm vi — KHÔNG sửa)

1. Duyệt hoàn (`refunds.js:182`) không trừ `total_spent` như huỷ đơn (`orders.js:1383`). (Phiếu đã nêu.)
2. Yêu cầu hoàn chỉ hoàn phần ví khách (`refunds.js:130-131` = `balance_amount`), bỏ phần ví mẹ `parent_balance_amount`.
3. Báo hỏng lấy dòng ĐẦU khi đơn có hai dòng cùng `product_code` (`damages.js:142-145`); C2 cộng dồn theo
   `(order_id, product_code)` sẽ so với `quantity` của dòng đầu.
4. Xoá đơn (`orders.js:1665-1675`) không xoá `pos_signup_codes` (mã bill mồ côi — I2) và vân tay kho của đơn bị xoá không
   còn đối chiếu được (I7).
5. `@libsql/client` file: BEGIN thất bại vì BUSY để lại kết nối hỏng, mọi tx sau trên nó lỗi lúc COMMIT
   (`database.js:1369-1370`; thử thật ở mục 0). Ảnh hưởng Replit / kho thử; Turso CHƯA KIỂM.
6. Màn báo hỏng gõ tiền đền `0` → gửi `0` → máy chủ đền ĐỦ giá (`refund_amount || damage_value`, `damages.js:156`;
   `Orders.jsx:1384`). Kế hoạch giữ nguyên hành vi này (K5), chỉ chặn số vượt trần.
7. Khôi phục sao lưu (`backup.js:324`, `:340`) xoá rồi chèn thẳng `pos_wallets`, `pos_orders`, `pos_refund_requests` — đường
   ghi ví/đơn ngoài khuôn `ghiVi`, F2 không thấy (tên bảng là biến).
8. Báo hỏng đền bù (`compensation`) rồi huỷ đơn / duyệt hoàn → khách nhận cả tiền đền lẫn hoàn đủ; A5/I10 chỉ đếm `refund`
   nên không thấy. C3 chỉ chặn chiều ngược lại.
9. Duyệt hoàn (`refunds.js:179-221`) không huỷ gói, thẻ hội viên, không hoàn kho như huỷ đơn (`orders.js:1430-1461`,
   `:1501-1535`). Sau A1 đơn `refunded` không còn đường nào làm việc đó.

## 11. Ngân sách

| Phần | Phiếu | Ước |
|---|---|---|
| routes | 120–180 đổi | ~150–180 đổi, ròng âm |
| `thu_P26b.js` | ~200 | ~200 |
| giả lập (6 KB + I10 + dữ liệu) | ~200 | ~190 |
| `thu_P26a.js` | ±10 | ±5 |
| `thu_gia_lap.js` | ~20 | ~10 |
| bộ kiểm | ~25 | ~20 |
| `viec/P26b/dot_bien.py` | — | ~120 (không tính code) |

## 12. Chủ quán duyệt aff6fde (03.10.2026) — phần này THẮNG mọi chỗ khác của file khi lệch

- **Q1 = A**: `SQLITE_BUSY` → 409 `KHO_BAN` qua `loiGhi`; ca K1 cho TỪNG route đã đổi (tạo đơn, huỷ, xoá, tạo yêu cầu,
  duyệt, từ chối, nạp, trừ tay, điều chỉnh, đối soát, báo hỏng). Thử lại BEGIN + kết nối libsql hỏng sau BUSY: chỉ Phát hiện 5.
  K1 so ẢNH CHỤP kho (số dòng đơn / sổ / yêu cầu / log hỏng / nợ kho, tổng số dư, trạng thái đơn + yêu cầu) trước = sau.
- **Q2** đồng ý — nhưng KB14 KHÔNG dùng đơn chỉ-gói nữa (Q8 chặn hoàn đơn có gói): dùng món KHÔNG mã SX do `dungDuLieu`
  tạo (`MON_KHONG_SX`) cho `KH.moi` (đã claim ⇒ không sinh mã bill) ⇒ I2, I7 không đụng.
- **Q3** giữ xoá yêu cầu cùng tx (A4c kiểm "không còn `pending`").
- **Q4** chấp nhận; đột biến là bằng chứng.
- **Q5** `getNow()` cho dòng sổ báo hỏng.
- **Q6** món từ gói giá 0 → không đền tiền: chấp nhận. **Bỏ "dòng đầu"**: báo hỏng gom MỌI dòng cùng `product_code` của đơn:
  cộng dồn số lượng đã báo (mọi action) + lần này ≤ TỔNG `quantity` các dòng; tiền mỗi lần ≤ `quantity × MAX(unit_price)`;
  tổng tiền đền cộng dồn theo `(order_id, product_code)` ≤ `SUM(unit_price × quantity)` các dòng. Ca K5 **C6**: đơn có 1 dòng
  từ gói (0đ, đứng TRƯỚC) + 1 dòng trả tiền cùng mã → đền đúng giá dòng trả tiền → 200. Đột biến vá sai "lấy dòng đầu" → C6 đỏ.
  Phát hiện 3 coi như đã xử lý theo quyết định này.
- **Q7** giữ như gốc (đơn không SĐT: 200, log có số tiền, không cộng ví).
- **Q8** chấp nhận mất nút xoá. **Thêm chặn**: `POST /refunds` và duyệt hoàn → 400 `code: 'DON_CO_GOI'` ("Đơn có gói/thẻ hội viên —
  dùng Huỷ đơn") khi có dòng `pos_customer_packages` hoặc `pos_membership_purchases` theo `order_id`. Ca **Q8a** tạo, **Q8b** duyệt
  (yêu cầu chèn bằng SQL = dữ liệu cũ), **Q8c** đơn có thẻ hội viên — đỏ trên gốc. Đột biến: bỏ vá; vá sai "chỉ chặn lúc tạo".
- **Lệnh thua ở huỷ đơn (400/409) return TRƯỚC khối hoàn kho SX**: A1a và K1-huỷ kiểm không có dòng `pos_stock_pending` mới
  (SX chưa cấu hình trong bài thử ⇒ hoàn kho thật sẽ đẻ dòng nợ kho 'in'); KB15 (I7) bắt ở giả lập.
- Phát hiện 1, 2, 4, 5, 7, 8, 9: chỉ ghi, không sửa.
- Chỉnh nhỏ khi viết: xoá đơn KHÔNG kiểm `changes` của `DELETE` (đọc đơn trong tx ghi đã là cổng duy nhất — lớp thứ hai
  không đột biến nào bắt được, K3). `ghiVi` dùng `UPDATE ... balance = balance + ?` rồi INSERT nếu `changes = 0` (không
  dựa vào `ON CONFLICT` — không phải kiểm ràng buộc UNIQUE của bảng trên Turso). F2 không cần dấu: chỗ ghi `pos_wallets`
  chỉ được nằm trong thân `ghiVi` hoặc thân `reconcileWallet` (thân này phải có `beginTransaction(`).
