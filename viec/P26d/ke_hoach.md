# P26d — kế hoạch (chờ chủ quán duyệt)

Phiếu: `viec/P26d/phieu.md` (Chờ duyệt kế hoạch). Mọi số dòng dưới đây đọc ở HEAD `14169d8` trong lượt này.

## 0. Sự thật đã đọc / đo trong lượt này (K1)

### 0.1 Thư viện `@libsql/client` 0.4.3 (node_modules) — kho mở giao dịch thế nào

| Đường | Chỗ đọc | Thấy |
|---|---|---|
| Chọn đường nối | `@libsql/core/lib-cjs/config.js:56-64`, `client/lib-cjs/node.js:27-39` | Node gọi `expandConfig(config, true)` → URL `libsql://` (Turso) đi **HTTP** (`http.js`), `file:` đi `sqlite3.js` |
| File: mở giao dịch | `sqlite3.js:103-108` | `transaction()` chạy `BEGIN IMMEDIATE` **ngay** trên kết nối dùng chung, rồi giao kết nối đó cho giao dịch (`this.#db = null`, lần sau mở kết nối mới). BEGIN ném lỗi thì kết nối dùng chung **giữ nguyên** |
| File: mã lỗi | `sqlite3.js:332-336` | `SqliteError` → `LibsqlError(message, e.code, e.rawCode)` |
| Turso (HTTP): mở giao dịch | `http.js:116-124`, `hrana.js:53-90` | `transaction()` chỉ lấy phiên bản + mở stream, **chưa BEGIN**. BEGIN gửi **gộp với câu ĐẦU** (`BatchCond.ok(beginStep)` — câu đầu chỉ chạy khi BEGIN thành công); BEGIN hỏng → giao dịch tự đóng (`this.close()`), câu đầu chưa chạy |
| Turso: mã lỗi | `hrana.js:284-318`, `hrana-client/lib-cjs/errors.js:23-35` | `ResponseError` → `code` = **nguyên chuỗi máy chủ gửi** (thư viện không có danh sách). Lỗi phía client: `HRANA_PROTO_ERROR`, `HRANA_CLOSED_ERROR` (hoặc mã của nguyên nhân), `HRANA_WEBSOCKET_ERROR`, `SERVER_ERROR` (HTTP lỗi), `PROTOCOL_VERSION_ERROR`, `INTERNAL_ERROR`, `UNKNOWN`; giao dịch đã đóng: `TRANSACTION_CLOSED` (`hrana.js:48,123,137,198`) |
| Lớp lỗi chung | `@libsql/core/lib-cjs/api.js:5-19` | `LibsqlError { code, rawCode, cause }`, `message = "<code>: <message>"` |
| `commit()` / `rollback()` khi chưa có câu nào | `hrana.js:161-175, 196-205` | không gửi gì, trả về luôn |

### 0.2 Đo thật kho file (script nháp ngoài kho, hai lần chạy)

Giao dịch 1 giữ khoá ghi; mở giao dịch 2 trên cùng client:
- BEGIN 2 → `code = 'SQLITE_BUSY'`, `rawCode = 5`, `name = 'LibsqlError'`, message `"SQLITE_BUSY: database is locked"` — **ném ngay, không chờ**.
- Sau đó (giao dịch 1 đã commit): một `INSERT` thường **báo thành công nhưng MẤT** (bảng cuối chỉ còn dòng của giao dịch 1);
  giao dịch kế tiếp lỗi lúc COMMIT `SQLITE_BUSY: cannot commit transaction - SQL statements in progress`; giao dịch sau nữa
  `database is locked`. → Phát hiện 5 của P26b nặng hơn đã ghi: **mất ghi trong im lặng**, không chỉ lỗi.
- Một `INSERT` thường (ngoài giao dịch) gặp BUSY cũng làm hỏng kết nối y như vậy.
- Cùng kịch bản, ngay sau lỗi bận gọi `client.close()` rồi `createClient()` lại: mọi lệnh sau chạy đúng, đủ dòng (`1,2,3,4`).
  Giao dịch 1 đang mở (kết nối riêng) vẫn commit được.

### 0.3 Code hiện tại

| Chỗ | Thấy |
|---|---|
| `server/database.js:1373-1391` | `beginTransaction()` gọi thẳng `db.transaction("write")`, không thử lại; trả đối tượng `{query, queryOne, run, commit, rollback}` |
| `server/database.js:1317-1331`, `:1351-1367` | `query` / `run`: lỗi thì `console.error` rồi ném lại — không xử lý kết nối hỏng |
| `server/routes/wallets.js:97-102` | `loiGhi`: chỉ `err.code === 'SQLITE_BUSY'` → 409 `KHO_BAN`; còn lại `500 { error: err.message }` (lộ lỗi nội bộ) |
| `server/routes/wallets.js:60-75` | `ghiVi`: đọc `Number(w?.balance \|\| 0)` (NULL → 0) nhưng ghi `balance = balance + ?` → NULL giữ NULL; INSERT ví mới với `total_spent = tieu` (lúc hoàn `tieu = -soTien` → **âm**) |
| `server/utils/helpers.js:24-63` | `taoMaDonTheoSo(queryOne)`: đọc mã lớn nhất trong ngày + vòng 30 lần thử; **nuốt mọi lỗi** đọc (`catch` → bắt đầu từ 1 / "cứ dùng") |
| `server/routes/orders.js:816` | `const orderCode = await taoMaDonTheoSo(queryOne);` — NGOÀI giao dịch; giao dịch mở ở `:856`, INSERT đơn `:893`, kiểm lại mã giảm `:956-982` (SAU INSERT đơn) |
| `server/database.js:168` | `pos_orders.code TEXT UNIQUE NOT NULL` — **đã có** ràng buộc duy nhất → không cần chỉ mục mới (mục "Đổi cấu trúc DB" của phiếu: KHÔNG dùng) |
| `server/routes/orders.js:1492` → `:1501-1508` | huỷ đơn: commit rồi mới `await query(...)` lấy món hoàn kho SX — câu này ném thì rơi vào `loiGhi` → 409 "chưa ghi gì" trong khi đơn ĐÃ huỷ, kho SX không hoàn, không có dòng nợ kho |
| `server/routes/wallets.js:300-316` | `reconcile-all`: mỗi ví một giao dịch riêng (`reconcileWallet`); ví thứ k lỗi → `loiGhi` 409 dù k−1 ví đã ghi |
| `server/routes/backup.js:309-341` | khôi phục: theo từng trang `DELETE FROM <bảng>` rồi `INSERT` thẳng, kể cả `pos_wallets` / `pos_orders`; ô rỗng → NULL (nguồn của ví `balance` NULL); tên bảng là biến nên E12 (`kiem_tra_truoc_khi_giao.js:503-523`) không thấy |
| `kiem_tra_truoc_khi_giao.js:388-398` (E8) | mọi bảng phải có trong `BACKUP_TABLES` → không được xoá `pos_wallets`/`pos_orders` khỏi danh sách (vẫn phải SAO LƯU được) |
| `cong_cu/thu_P26b.js:63-90` | móc bọc `db.beginTransaction` NGOÀI hàm thật: `co.ban` ném bận trước khi gọi hàm thật, `co.banCauDau` ném ở câu đầu — ca K1/K1b vẫn đo đúng "hết lượt → 409" sau khi thêm thử lại BÊN TRONG hàm thật |
| `cong_cu/gia_lap/kich_ban.js:379-398` (KB20) | đơn thua được phép 400 **hoặc** 500 `pos_orders.code` — gia_lap nằm trong mục Cấm của phiếu → siết bằng ca mới ở `thu_P20.js` (phiếu: "thu_P20.js — siết KB20") |
| `cong_cu/thu_P20.js:63-74` | móc `mocTruocTx` chạy NGUYÊN một lệnh khác trước khi giao dịch mở — dựng chồng nhau TẤT ĐỊNH. Bài nạp `GOC/server` cứng (không có `--may-chu`) |

## 1. Phần A (5) + B (19) — thử lại BEGIN, một hàm `laLoiBan`, kết nối không hỏng

**Mã / dạng lỗi bận** (B — chỉ ghi điều đã đọc / đo):
- Kho file: `code === 'SQLITE_BUSY'`, `rawCode === 5` (đo 0.2). Mã mở rộng (`SQLITE_BUSY_SNAPSHOT`, `_RECOVERY`, `_TIMEOUT`) cùng
  byte thấp `rawCode & 0xff === 5` — khớp bằng tiền tố `SQLITE_BUSY` (chuỗi) để phủ cả đường Turso (máy chủ gửi tên mã SQLite).
- Turso: thư viện chuyển NGUYÊN `code` máy chủ (0.1). Danh sách mã máy chủ KHÔNG có trong node_modules; đọc nguồn sqld bị người
  gác chặn (`[CURL-HOST]`). Theo trí nhớ về nguồn sqld (CHƯA ĐỌC lượt này): lỗi SQLite chuyển thành `SQLITE_<tên>` (nên bận là
  `SQLITE_BUSY`), thêm `TRANSACTION_BUSY` (khoá ghi của máy chủ bận) và `TRANSACTION_TIMEOUT` (giao dịch quá hạn) → **Câu hỏi Q1**.
- KHÔNG coi là bận: `TRANSACTION_CLOSED`, `HRANA_*`, `SERVER_ERROR`, `UNKNOWN`, `SQLITE_CONSTRAINT*` … — không chắc "chưa ghi gì".

**Phương án A (chọn)** — `server/database.js`, ~35 dòng:
```js
const MA_BAN = /^(SQLITE_BUSY|TRANSACTION_BUSY)(_|$)/;          // Q1 chốt danh sách
function laLoiBan(err) { return MA_BAN.test(String(err?.code || '')); }
const CHO_BEGIN_MS = [50, 100, 200, 400, 800];                 // 5 lần thử lại, tổng chờ 1,55 s (phiếu: ≤ ~2 s)
function thayKetNoiNeuBan(err) {                               // kho FILE: câu bị bận làm hỏng kết nối dùng chung (0.2)
  if (laLoiBan(err) && db.protocol === 'file') { try { db.close(); } catch {} db = createClient(cauHinhTurso().cauHinh); }
}
```
- `query` / `run`: trong `catch` gọi `thayKetNoiNeuBan(err)` trước khi ném (1 dòng mỗi hàm — `query` cùng khuôn K4, xem Q5).
- `beginTransaction`: mở **lười** — giao dịch thật mở ở câu ĐẦU (cùng nhịp Turso vốn gửi BEGIN kèm câu đầu, 0.1). Câu đầu gặp lỗi
  bận (kho file: lúc `db.transaction()`; Turso: ở câu đầu) → đóng giao dịch hỏng, `thayKetNoiNeuBan`, chờ `CHO_BEGIN_MS[i]`, mở lại,
  chạy lại đúng câu đầu (câu đầu CHƯA chạy vì BEGIN hỏng). Hết lượt → ném nguyên lỗi bận → route `loiGhi` 409 `KHO_BAN`. Lỗi
  KHÔNG bận → ném ngay, không thử lại. Từ câu thứ hai trở đi: chạy thẳng, không thử lại. `commit` / `rollback` khi chưa có câu
  nào → không làm gì (như hrana `hrana.js:161-175, 196-205`).
- Không thêm vòng tròn RTT nào cho Turso (BEGIN vẫn gộp với câu đầu).

**Phương án B** — mở giao dịch NGAY bằng câu mồi `SELECT 1` trong `beginTransaction`, thử lại quanh cặp đó: ~25 dòng (ít hơn ~10)
nhưng **thêm một vòng mạng Render↔Turso cho MỌI lệnh ghi** (tạo đơn, nạp…) — đi ngược TOC-DO-1. Không chọn.

`server/routes/wallets.js` `loiGhi` (~4 dòng): `laLoiBan(err)` (nạp từ database.js) → 409 `KHO_BAN` như cũ; còn lại
`console.error` + `500 { error: 'Lỗi máy chủ — thao tác chưa xong, báo quản lý', code: 'LOI_MAY_CHU' }` — không trả `err.message`.

Rủi ro: (1) mở lười đổi thời điểm lấy khoá — mọi chỗ gọi đều chạy câu đầu ngay sau `beginTransaction()` (đã đọc orders.js `:856`,
`:1391`, `:1562`, `trongGiaoDich`), không đổi nghĩa; (2) `db.close()` khi giao dịch khác đang mở — đo 0.2: giao dịch giữ kết nối
riêng, vẫn commit được; chỉ làm ở kho file (Turso HTTP đóng client sẽ huỷ yêu cầu đang bay — không đụng).

## 2. Phần C (10) — mã đơn sinh TRONG giao dịch ghi

**Phương án A (chọn)**: đọc số trong giao dịch sẵn có (BEGIN IMMEDIATE = khoá ghi độc quyền, hai đơn không đọc chung một số).
- `orders.js`: bỏ dòng `:816`; khai `let orderCode;` trước `beginTransaction` (`:856`), câu đầu trong `try` là
  `orderCode = await taoMaDonTheoSo(tx.queryOne);` (trước `ghiVi` — ghi chú sổ ví dùng mã). Dòng log `catch` (`:1017`) đọc
  `orderCode` phải chịu được `undefined` (khuôn P26b: biến gán trong try đọc ở catch). ~4 dòng.
- `helpers.js` `taoMaDonTheoSo`: bỏ hai `try/catch` nuốt lỗi và vòng 30 lần (trong khoá ghi, `số lớn nhất + 1` luôn trống; nuốt lỗi
  trong giao dịch thì lỗi bận ở câu đầu bị che → đơn đi tiếp trên giao dịch đã đóng → 500). Giữ nguyên câu đọc + định dạng
  `ORD-YYYYMMDD-NNN` (`padStart(3)`, mã cũ ngẫu nhiên cùng dạng vẫn đếm). ~−20 dòng. UNIQUE `pos_orders.code` giữ làm chốt cuối.
- Không chỉ mục mới, không đổi cấu trúc DB.

**Phương án B**: giữ sinh mã ngoài giao dịch + bắt `SQLITE_CONSTRAINT_UNIQUE` rồi thử lại cả giao dịch có giới hạn — phải tách thân
giao dịch tạo đơn thành hàm chạy lại được (~40 dòng, đụng cả khối ví / gói / mã giảm). Không chọn.

Đường gói (`thu_GOI1`): mua gói / lấy từ gói đi CÙNG đường `POST /orders` này; khối tạo `pos_customer_packages` sau commit dùng
`orderId`, không dùng mã → không thêm ca vào `thu_GOI1.js` (bài chạy lại nguyên vẹn làm hồi quy).

## 3. Phần D (15) — 409 "chưa ghi gì" chỉ khi lỗi TRƯỚC commit

Mọi chỗ trả 409 `KHO_BAN` = mọi chỗ gọi `loiGhi` (`grep -rn "loiGhi(res" server/routes` = 14 chỗ) — `KHO_BAN` chỉ có trong `loiGhi`:

| Route | Ghi gì | Câu có thể ném SAU commit tới `loiGhi`? | Xử lý |
|---|---|---|---|
| `orders.js` POST `/` | 1 giao dịch | Không: sau commit mọi bước bọc `try/catch` (kho SX, gói, thẻ, đăng ký, mã bill, cấu hình bill) | giữ |
| `orders.js` PUT `/:id/cancel` | 1 giao dịch | **CÓ**: `query` lấy món `:1502` | dời câu đọc món VÀO giao dịch (`tx.query`, trước commit — như xoá đơn `:1569-1575`); sau commit chỉ còn khối đã bọc `try/catch` (~3 dòng) |
| `orders.js` DELETE `/:id` | 1 giao dịch | Không (món đọc trong giao dịch; hoàn kho bọc `try/catch`) | giữ |
| `wallets.js` topup / deduct / adjust / `:phone/reconcile` | 1 giao dịch | Không (sau `trongGiaoDich` chỉ `res.json`) | giữ |
| `wallets.js` `reconcile-all` | N giao dịch | **CÓ**: ví thứ k (k ≥ 2) | bắt lỗi trong vòng: chưa ví nào xong → ném (409 / 500 như cũ, đúng sự thật); đã có ví xong → `500 { code: 'DOI_SOAT_DO_DANG', error, checked, fixed, results, dung_o }` (đã ghi gì + dừng ở ví nào; đối soát chạy lại vô hại) (~8 dòng, Q4) |
| `refunds.js` tạo / duyệt / từ chối | 1 giao dịch | Không | giữ |
| `damages.js` POST | 1 giao dịch | Không (gọi SX + `run` đánh dấu sau commit bọc `try/catch`) | giữ |
| `packages.js` kết thúc gói | 1 giao dịch | Không | giữ |
| `packages.js` GET `theo-khach` | `run` nắn Q3 tự commit, rồi `query` | Có, nhưng nắn chạy lại vô hại; `packages.js` NGOÀI Phạm vi | Phát hiện P1 |

`pay-debt` (`orders.js:1242-1350`) không dùng `loiGhi` (500 thô, 3 lệnh ghi tự commit liên tiếp) — không trả `KHO_BAN`; ngoài
nghiệm thu → Phát hiện P2. `commit()` tự hỏng: kho file thì chưa ghi (đúng 409); Turso mất mạng lúc COMMIT không biết đã ghi hay
chưa — CHƯA KIỂM, không đổi.

## 4. Phần E (17, 18) — ví không NULL, không tổng chi âm

**Quy tắc** (Phát hiện 17, 18 P26b; I18 `cong_cu/gia_lap/bat_bien.js:295-308`: `total_spent` = mua − hoàn + điều chỉnh âm theo sổ):
- NULL đọc như 0 ở MỘT chỗ — `ghiVi`: `balance = COALESCE(balance, 0) + ?`, `total_topup = COALESCE(total_topup, 0) + ?`,
  `total_spent = COALESCE(total_spent, 0) + ?` (đọc trước đã là `Number(w?.balance || 0)`). Lệnh ghi đầu tiên chữa luôn dòng NULL.
- Ví TẠO MỚI lúc hoàn (ví đã mất): `total_spent = MAX(0, tieu)` = 0 — ví mới chưa ghi khoản chi nào; số dư = khoản hoàn như cũ.
  Ví ĐANG CÓ: vẫn cộng tương đối như cũ, KHÔNG kẹp (kẹp làm lệch I18 khi sổ đúng) → **Câu hỏi Q2** xác nhận.
- ~3 dòng trong `wallets.js:66-71`. Không đổi số tiền nào vào / ra ví.

## 5. Phần F (7) — khôi phục sao lưu không ghi thẳng ví / đơn

**Phương án A (chọn, ưu tiên an toàn)**: chặn. Trước MỌI lệnh ghi của `/restore`: trang nhận ra là `pos_wallets` hoặc `pos_orders`
mà có dòng → `400 { code: 'KHOI_PHUC_VI_DON_BI_CHAN', error: 'File có trang Số dư / Đơn hàng — ví và đơn không khôi phục bằng
file (chỉ ghi qua đường bán / ví). Xoá hai trang đó khỏi file rồi khôi phục lại', bang: [...] }`, không xoá / chèn bảng nào.
Hằng `BANG_KHONG_KHOI_PHUC = ['pos_wallets', 'pos_orders']`. Hai bảng VẪN trong `BACKUP_TABLES` (E8 — vẫn sao lưu / xuất được).
~8 dòng `backup.js`. E12 xanh, không thêm ngoại lệ.
**Phương án B**: khôi phục ví qua `ghiVi` (xoá ví rồi ghi lại bằng dòng sổ `adjust`?) — đẻ dòng sổ giả, đơn không có đường
`ghiVi` tương ứng; dài và đổi quy tắc sổ. Không chọn.
Hệ quả: file `export-all` đầy đủ sẽ luôn bị chặn → **Câu hỏi Q3** (có chặn thêm sổ ví / chi tiết đơn / yêu cầu hoàn không).

## 6. Phần G — KB20 siết (sau C)

Ca mới ở `thu_P20.js` (móc `mocTruocTx` sẵn có): mã dùng-một-lần; đơn 1 qua phép kiểm ngoài giao dịch, móc chạy TRỌN đơn 2 cùng mã
trước khi giao dịch đơn 1 mở → đúng một 200 + một **400 `DISCOUNT_CODE_LIMIT_REACHED`**, `used_count = 1`, một đơn mang mã, đơn thua
không để dòng ví / điểm. Gốc: đơn 1 vấp UNIQUE mã đơn → 500 → ĐỎ. Đột biến `BV-G-bo-kiem-lai-ma` (bỏ khối kiểm lại `freshCode`
trong giao dịch) phải bị bắt. `kich_ban.js` KB20 (gia_lap — mục Cấm) vẫn cho phép nhánh 500 → Phát hiện P3 (đề xuất chủ quán gỡ
nhánh 500 ở việc sau). `thu_P20.js` thêm `--may-chu` (như `thu_P26b.js:30-31`) để chạy đột biến; ca cũ không đổi.

## 7. Bài thử (H) — ánh xạ 1-1 với Nghiệm thu; mỗi ca đỏ trên gốc đúng câu kết luận

Dựng bận THẬT: bài mở client libsql thứ hai trên cùng file kho tạm, `BEGIN IMMEDIATE` giữ khoá, nhả bằng hẹn giờ.

| Ca | Bài | Nghiệm thu | Làm | Mong | Gốc |
|---|---|---|---|---|---|
| D1 | thu_P26b | A | giữ khoá 150 ms, nạp ví | 200, số dư +, 1 dòng sổ | 409 KHO_BAN |
| D2 | thu_P26b | A | giữ khoá suốt, nạp ví | 409 KHO_BAN, kho không đổi, thời gian 1,4–2,5 s (đã chờ đủ lượt, ≤ ~2 s) | 409 ngay (< 0,3 s) → ĐỎ ở vế thời gian |
| D3 | thu_P26b | A (kết nối) | ngay sau D2 (đã nhả): nạp ví rồi `db.run` một dòng | 200 + số dư đọc bằng client THỨ HAI đã đổi; dòng `run` có thật | 409 / mất ghi |
| D4 | thu_P26b | A (lỗi khác) | thay tạm `getDb().transaction` ném `SQLITE_IOERR` (kèm chuỗi lạ) | 500 `LOI_MAY_CHU`, gọi mở đúng 1 lần, thân trả về KHÔNG chứa chuỗi lạ | 500 có `err.message` → ĐỎ |
| D5 | thu_P26b | B | như D4 nhưng mã `TRANSACTION_BUSY` (Turso) lần đầu | thử lại → 200 | 500 |
| D6 | thu_P26b | B | như D5, mã `SQLITE_BUSY_SNAPSHOT` | thử lại → 200 | 500 |
| D7 | thu_P26b | A, D | `run` ngoài giao dịch gặp bận thật (khoá đang giữ) → nhả → `run` tiếp | lần 1 ném bận; lần 2 ghi có thật (đọc bằng client 2) | mất ghi |
| C1 | thu_P26c | C (hai người) | móc mới (`co.mocTruocTx`, như thu_P20) chạy TRỌN đơn 2 trước khi giao dịch đơn 1 mở; hai đơn tiền mặt | cả hai 200, hai mã KHÁC nhau, cả hai dạng `ORD-<ngày>-NNN`, số liền nhau | đơn 1: 500 (UNIQUE) |
| C2 | thu_P26c | C (K5) | ngày chưa có đơn → mã `-001`; có mã cũ `ORD-<ngày>-999` → `-1000` | đúng như mong | xanh trên gốc (ca K5 khoá hành vi khi bỏ vòng 30 lần — ghi rõ, không tính là ca đỏ) |
| C3 | thu_P26c | C | `co.banCauDau` ở đơn tiền mặt (câu đầu = đọc mã) | 409 KHO_BAN, không đơn mới | xanh trên gốc? — gốc đọc mã NGOÀI tx; bắt đột biến `VS-C-nuot-loi-doc-ma` |
| H1 | thu_P26c | D | huỷ đơn có món SX khi câu `query` lấy món SAU commit ném bận (móc mới `co.banDoc` bọc `db.query`) | 200, đơn `cancelled`, nợ kho `in` đủ món | 409 KHO_BAN trong khi đơn đã huỷ |
| H2 | thu_P26b | D | `reconcile-all` 2 ví lệch, lần mở giao dịch THỨ 2 ném bận (`co.banLan`) | không 409; `code DOI_SOAT_DO_DANG`, `checked = 1`, ví 1 đã khớp trong kho | 409 KHO_BAN |
| H3 | thu_P26b | D (K5) | `reconcile-all`, bận ngay ví ĐẦU | 409 KHO_BAN, kho không đổi (= K1 cũ, giữ) | xanh (K1 cũ) |
| V1 | thu_P26b | E | ví `balance` NULL (chèn SQL = dữ liệu cũ) → nạp 10.000 | 200, `balance = 10000` | NULL → ĐỎ |
| V2 | thu_P26b | E | ví `total_topup`/`total_spent` NULL → nạp, trừ tay | hai cột ra số đúng | NULL |
| V3 | thu_P26b | E | đơn trả ví, xoá dòng ví (ví mất), huỷ đơn | ví tạo lại: `balance` = khoản hoàn, `total_spent = 0` | `total_spent` âm |
| V4 | thu_P26b | E (K5) | ví có sẵn, huỷ đơn trả ví | `total_spent` giảm đúng khoản hoàn (như cũ) | xanh (K5) |
| F1 | thu_P26b | F | khôi phục file có trang "Số dư" (có dòng) + trang "Cài đặt" | 400 `KHOI_PHUC_VI_DON_BI_CHAN`; `pos_wallets` VÀ `pos_settings` không đổi (chặn trước mọi ghi) | 200, ví bị ghi đè |
| F2 | thu_P26b | F | file có trang "Đơn hàng" | 400, `pos_orders` không đổi | 200 |
| F3 | thu_P26b | F (K5) | file chỉ có trang "Kho quà" | 200 khôi phục như cũ | xanh (K5) |
| G1 | thu_P20 | G (hai người) | mục 6 | đúng 200 + 400 `DISCOUNT_CODE_LIMIT_REACHED` | 500 |

Ca cũ giữ nguyên, không bớt ca / `c.mong`. K1/K1b cũ (bận giả ném NGOÀI hàm thật) vẫn phải 409 — đo "hết lượt → 409".
`bang_chung_do.txt`: mỗi bài sửa một dòng `SỐ CA <bài>: <N>` + nguyên dòng ✗ trên gốc.

## 8. Đột biến `viec/P26d/dot_bien.py` (khuôn `viec/P26c/dot_bien.py`, chạy từng tên, có đối chứng)

| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| thử lại BEGIN | `BV-A-bo-thu-lai` (vòng chờ chỉ 0 lượt) | D1, D5 |
| thử lại chỉ khi bận | `VS-A-thu-lai-moi-loi` (bỏ điều kiện `laLoiBan` ở vòng) | D4 (mở 1 lần) |
| thay kết nối kho file | `BV-A-bo-thay-ket-noi` | D3, D7 |
| `laLoiBan` | `VS-B-chi-khop-mot-ma` (`=== 'SQLITE_BUSY'`) | D5, D6 |
| `loiGhi` 500 | `BV-B-lo-message` (trả `err.message`) | D4 |
| mã đơn trong giao dịch | `BV-C-ma-don-ngoai-tx` (đọc bằng `queryOne` trước `beginTransaction`) | C1 |
| bỏ nuốt lỗi đọc mã | `VS-C-nuot-loi-doc-ma` (giữ `try/catch` trả `-001`) | C3 |
| huỷ: món đọc trong giao dịch | `BV-D-huy-doc-mon-sau-commit` | H1 |
| reconcile-all dở dang | `BV-D-doi-soat-409` (bỏ bắt lỗi trong vòng) | H2 |
| COALESCE ví | `BV-E-bo-coalesce` | V1, V2 |
| tổng chi ví mới | `VS-E-tong-chi-am` (INSERT `tieu` không kẹp) | V3 |
| chặn khôi phục | `BV-F-khong-chan` | F1, F2 |
| chặn TRƯỚC mọi ghi | `VS-F-chan-sau-khi-xoa` (kiểm từng trang trong vòng, sau trang trước đã xoá) | F1 (vế `pos_settings`) |
| kiểm lại mã giảm trong giao dịch | `BV-G-bo-kiem-lai-ma` | G1 |

## 9. Đường song song (K4) đã rà

- Mọi chỗ mở giao dịch (`grep -rn "beginTransaction()" server`): orders.js ×3, wallets.js `trongGiaoDich` (dùng bởi wallets, refunds,
  damages, packages), loyalty.js, signup-codes.js ×3, product-groups.js — đều qua `beginTransaction` → được thử lại, không sửa file nào.
- Mọi chỗ khớp mã bận: chỉ `wallets.js:98` (`grep -rn "SQLITE_BUSY" server` = 1) → `laLoiBan`.
- Mọi chỗ sinh mã đơn / INSERT `pos_orders`: chỉ `orders.js:816` / `:893`.
- Mọi lệnh ghi `pos_wallets`: `ghiVi`, `reconcileWallet` (E12) + `backup.js` (tên bảng là biến) — mục 5.
- Mọi chỗ trả `KHO_BAN`: bảng mục 3.
- `query` / `run` cùng khuôn "câu bận làm hỏng kết nối" với BEGIN (đo 0.2) — vá cả hai (Q5).

## 10. Luồng hợp lệ phải KHÔNG bị chặn (K5)

1. Kho rảnh: mọi lệnh ghi chạy thẳng, không chờ — toàn bộ bài cũ (thu_P20/P21/P26a/P26b/P26c/GOI1, giả lập) xanh, thời gian không
   tăng quá 80 % hạn.
2. Đơn đầu ngày, ngày có mã cũ ngẫu nhiên → C2. Mua gói / lấy từ gói → thu_GOI1 cũ.
3. Ví có sẵn (số, không NULL) → cộng tương đối như cũ (bài P26b/P26c cũ, V4, I18 giả lập).
4. Khôi phục file không có trang ví / đơn → F3.
5. Đối soát toàn bộ đủ ví → 200 như cũ (bài cũ); bận ở ví đầu → 409 (H3).
6. Lỗi không phải bận → 500 không thử lại (D4); ràng buộc / SQL sai không bị chờ 1,55 s.
7. loyalty / signup-codes / product-groups: chỉ được thêm thử lại, mã trả về không đổi (bài thu_P20 / giả lập cũ).

## 11. Ngân sách

Code ~70–90 dòng thêm, ~20 dòng bớt (database.js ~35, wallets.js ~15, orders.js ~7, helpers.js −20, backup.js ~8) — trong 120–200.
Thử ~250 dòng (thu_P26b ~150, thu_P26c ~60, thu_P20 ~30). Không file mới ngoài `viec/P26d/`. Không chỉ mục, không bảng mới.

## 12. Câu hỏi cho chủ quán (trả lời khi duyệt)

- **Q1 (B, mã Turso)**: node_modules không có danh sách mã máy chủ; đọc nguồn sqld bị chặn. Đề xuất `laLoiBan` khớp `SQLITE_BUSY`,
  `SQLITE_BUSY_*`, `TRANSACTION_BUSY` (sqld, theo trí nhớ — CHƯA KIỂM trên Turso thật). `TRANSACTION_TIMEOUT` KHÔNG khớp (giao dịch
  quá hạn giữa chừng → 500, không thử lại). Đồng ý? Hay cho phép máy đọc nguồn sqld (mở `raw.githubusercontent.com` cho người gác)?
- **Q2 (E)**: ví tạo mới lúc hoàn → `total_spent = 0`; ví đang có KHÔNG kẹp (có thể âm nếu dữ liệu cũ lệch, I18 / DOI-SOAT-1 thấy).
  Đồng ý? Hay kẹp `MAX(0, …)` cả ví đang có?
- **Q3 (F)**: chặn khôi phục khi file có trang "Số dư" / "Đơn hàng" có dòng → bản sao lưu đầy đủ (`export-all`) sẽ luôn bị chặn,
  muốn khôi phục phần khác phải xoá hai trang đó khỏi Excel. Có chặn thêm "Giao dịch số dư" (sổ ví — luật chỉ thêm dòng),
  "Chi tiết đơn", "Yêu cầu hoàn tiền" không? Đề xuất: theo phiếu, đúng hai bảng; mở rộng nếu chủ quán chốt.
- **Q4 (D)**: `reconcile-all` dừng giữa chừng trả `500 DOI_SOAT_DO_DANG` kèm danh sách ví đã xong + ví dừng. Đồng ý mã 500?
- **Q5 (phạm vi database.js)**: phiếu ghi "chỉ sửa `beginTransaction` / `run` / hàm lỗi liên quan". `query` có cùng khuôn (câu SELECT
  bận để lại câu dở → COMMIT sau lỗi) — thêm 1 dòng `thayKetNoiNeuBan` vào `catch` của `query`. Đồng ý?

## 13. Phát hiện (ngoài phạm vi — KHÔNG sửa)

- P1. `packages.js` GET `theo-khach`: `run` nắn (tự commit) rồi `query`; câu sau ném bận → 409 "chưa ghi gì" dù đã nắn (vô hại — nắn
  chạy lại được). `packages.js` ngoài Phạm vi.
- P2. `pay-debt` (`orders.js:1242-1350`): ba lệnh ghi tự commit liên tiếp (thu, nhật ký, sổ `debt_payment`) — lỗi ở lệnh 2/3 → 500
  dù tiền đã ghi; lỗi trả `err.message` thô. Ngoài nghiệm thu.
- P3. `cong_cu/gia_lap/kich_ban.js` KB20 vẫn chấp nhận nhánh 500 `pos_orders.code` (gia_lap thuộc mục Cấm) — sau P26d nhánh đó
  không còn đường tới; đề xuất việc sau gỡ cho chặt.
- P4. Phát hiện 5 P26b nặng hơn đã ghi: kho file sau một lệnh bận thì lệnh ghi sau **báo thành công mà mất** (đo 0.2) — ảnh hưởng
  kho thử Replit và giả lập (không phải Turso). P26d vá ở mục 1.
