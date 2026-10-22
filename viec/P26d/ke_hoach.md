# P26d — kế hoạch (chủ quán đã duyệt 18.10 — mục 15)

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
- `beginTransaction`: mở **lười** — giao dịch thật mở ở câu ĐẦU (cùng nhịp Turso vốn gửi BEGIN kèm câu đầu, 0.1). MỘT khối thử lại
  bọc cả "mở + câu đầu" (`tx = await db.transaction('write'); return await tx.execute(câu đầu)`) — phủ cả hai đường: kho file ném
  ở `db.transaction()`, Turso ném ở câu đầu. Lỗi bận → đóng giao dịch hỏng (nếu có), `thayKetNoiNeuBan`, chờ `CHO_BEGIN_MS[i]`, mở
  lại, chạy lại đúng câu đầu (câu đầu CHƯA chạy vì BEGIN hỏng). Hết lượt → ném nguyên lỗi bận → route `loiGhi` 409 `KHO_BAN`. Lỗi
  KHÔNG bận → ném ngay, không thử lại, giữ `tx` (nếu đã mở) để chỗ gọi rollback. Từ câu thứ hai trở đi: chạy thẳng, không thử lại.
  `commit` / `rollback` khi chưa có câu nào → không làm gì (như hrana `hrana.js:161-175, 196-205`). Đối tượng trả về vẫn là
  **object literal, mọi hàm dùng closure** (không `this`, không class / getter) — móc của bài thử trải `{ ...tx }`
  (`thu_P26b.js:78-80`, `thu_P26c.js:78-82`). `CHO_BEGIN_MS` xuất ra cho bài thử kiểm tĩnh "tổng ≤ 2000 ms".
- Chú thích mới trong `server/` và `cong_cu/thu_*.js` KHÔNG ghi số dòng cứng (E15) — ghi tên hàm / mẫu grep.
- Không thêm vòng tròn RTT nào cho Turso (BEGIN vẫn gộp với câu đầu).

**Phương án B** — mở giao dịch NGAY bằng câu mồi `SELECT 1` trong `beginTransaction`, thử lại quanh cặp đó: ~25 dòng (ít hơn ~10)
nhưng **thêm một vòng mạng Render↔Turso cho MỌI lệnh ghi** (tạo đơn, nạp…) — đi ngược TOC-DO-1. Không chọn.

`server/routes/wallets.js` `loiGhi` (~4 dòng): `laLoiBan(err)` (nạp từ database.js) → 409 `KHO_BAN` như cũ; còn lại
`console.error` + `500 { error: 'Lỗi máy chủ — xem lại đã ghi chưa trước khi bấm lại', code: 'LOI_MAY_CHU' }` — không trả
`err.message`. Câu TRUNG TÍNH (soát kế hoạch): nhánh 500 cũng nhận lỗi xảy ra SAU commit (vd dựng phản hồi `refunds.js` duyệt hoàn
`kq.tong_hoan.toLocaleString()`), nên không được khẳng định "chưa xong".

Rủi ro: (1) mở lười đổi thời điểm lấy khoá — mọi chỗ gọi đều chạy câu `tx.*` đầu ngay sau `beginTransaction()`, không có
`query`/`run` ngoài giao dịch xen giữa (đọc: orders.js tạo / huỷ / xoá, `trongGiaoDich`; soát kế hoạch đọc thêm loyalty.js:158-161,
product-groups.js:59-61, signup-codes.js:249-258 / :390 / :490), không đổi nghĩa; không chỗ nào commit khi chưa chạy câu nào.
Thay đổi hành vi duy nhất: `product-groups.js` gọi `beginTransaction()` NGOÀI `try` — trước đây BEGIN bận ở đó là lỗi không ai bắt,
nay lỗi lộ ở câu đầu trong `try` → route trả 500 (tốt hơn); (2) `db.close()` khi giao dịch khác đang mở — đo 0.2: giao dịch giữ kết nối
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
- NULL đọc như 0 ở MỘT chỗ — `ghiVi` (đọc trước đã là `Number(w?.balance || 0)`). **Giữ nguyên** `balance = balance + ?` và
  `SELECT balance FROM pos_wallets` — E12 (`kiem_tra_truoc_khi_giao.js:517-519`) đòi đúng hai chuỗi đó, đổi sang
  `COALESCE(balance, 0) + ?` là E12 đỏ (soát kế hoạch bắt). Thay vào: đọc thấy `w && w.balance == null` → thêm
  `UPDATE pos_wallets SET balance = 0 WHERE phone = ? AND balance IS NULL` (cùng giao dịch, chỉ chạy với dòng NULL — không thêm
  vòng mạng cho ví thường; không phải `SET balance = ?`). Hai cột tổng: `total_topup = COALESCE(total_topup, 0) + ?`,
  `total_spent = COALESCE(total_spent, 0) + ?` (E12 không soi hai cột này). Lệnh ghi đầu tiên chữa luôn dòng NULL.
- Ví TẠO MỚI lúc hoàn (ví đã mất): `total_spent = MAX(0, tieu)` = 0 — ví mới chưa ghi khoản chi nào; số dư = khoản hoàn như cũ.
  Ví ĐANG CÓ: vẫn cộng tương đối như cũ, KHÔNG kẹp (kẹp làm lệch I18 khi sổ đúng) → **Câu hỏi Q2** xác nhận.
- ~3 dòng trong `wallets.js:66-71`. Không đổi số tiền nào vào / ra ví.

## 5. Phần F (7) — khôi phục sao lưu không ghi thẳng ví / đơn

**Phương án A (chọn, ưu tiên an toàn)**: chặn. Trước MỌI lệnh ghi của `/restore`: trang nhận ra là `pos_wallets` hoặc `pos_orders`
mà có dòng → `400 { code: 'KHOI_PHUC_VI_DON_BI_CHAN' (Q8c đổi tên → KHOI_PHUC_TRANG_TIEN_BI_CHAN), error: 'File có trang Số dư / Đơn hàng — ví và đơn không khôi phục bằng
file (chỉ ghi qua đường bán / ví). Xoá hai trang đó khỏi file rồi khôi phục lại', bang: [...] }`, không xoá / chèn bảng nào.
Hằng `BANG_KHONG_KHOI_PHUC = ['pos_wallets', 'pos_orders']`. Hai bảng VẪN trong `BACKUP_TABLES` (E8 — vẫn sao lưu / xuất được).
~8 dòng `backup.js`. E12 xanh, không thêm ngoại lệ.
**Phương án B**: khôi phục ví qua `ghiVi` (xoá ví rồi ghi lại bằng dòng sổ `adjust`?) — đẻ dòng sổ giả, đơn không có đường
`ghiVi` tương ứng; dài và đổi quy tắc sổ. Không chọn.
Hệ quả: file `export-all` đầy đủ sẽ luôn bị chặn → **Câu hỏi Q3** (có chặn thêm sổ ví / chi tiết đơn / yêu cầu hoàn không).

## 6. Phần G — KB20 siết (sau C)

Ca mới **G1 ở `thu_P26c.js`** (dùng chung móc `co.mocTruocTx` mới của ca C1; `thu_P26c.js` đã có `--may-chu` nên đột biến chạy
được). Đổi so với bản đầu (soát kế hoạch): KHÔNG đặt ở `thu_P20.js` — bài đó nạp cứng `GOC/server` ở nhiều chỗ, thêm `--may-chu`
tốn hơn; ca G11 sẵn có của `thu_P20.js` (móc đặt `used_count = 1` → 400) vẫn chạy làm hồi quy. `thu_P20.js` không sửa. Mã dùng-một-lần; đơn 1 qua phép kiểm ngoài giao dịch, móc chạy TRỌN đơn 2 cùng mã
trước khi giao dịch đơn 1 mở → đúng một 200 + một **400 `DISCOUNT_CODE_LIMIT_REACHED`**, `used_count = 1`, một đơn mang mã, đơn thua
không để dòng ví / điểm. Gốc: đơn 1 vấp UNIQUE mã đơn → 500 → ĐỎ. Đột biến `BV-G-bo-kiem-lai-ma` (bỏ khối kiểm lại `freshCode`
trong giao dịch) phải bị bắt. `kich_ban.js` KB20 (gia_lap — mục Cấm) vẫn cho phép nhánh 500 → Phát hiện P3 (đề xuất chủ quán gỡ
nhánh 500 ở việc sau).

## 7. Bài thử (H) — ánh xạ 1-1 với Nghiệm thu; mỗi ca đỏ trên gốc đúng câu kết luận

Dựng bận THẬT: bài mở client libsql thứ hai trên cùng file kho tạm, `BEGIN IMMEDIATE` giữ khoá, nhả bằng hẹn giờ. **Mọi ca bận thật
(D1–D3, D7) chạy ở CUỐI `thu_P26b.js`** — trên gốc chúng làm hỏng kết nối dùng chung (0.2), chạy giữa bài thì các ca V / F sau sẽ đỏ
vì kết nối hỏng chứ không vì lỗi đang thử (soát kế hoạch). Thứ tự trong bài: V → F → H2/H3 → D4–D6, D8, D9 → D1–D3, D7.
`thu_P26b.js` nạp thêm route `backup.js` (hiện chỉ nạp orders / refunds / wallets / damages / packages).

| Ca | Bài | Nghiệm thu | Làm | Mong | Gốc |
|---|---|---|---|---|---|
| D0 | thu_P26b | A | tĩnh: `CHO_BEGIN_MS` (xuất từ database.js) tổng ≤ 2000 ms, ≥ 1 lượt | đúng | ĐỎ (chưa có hằng) |
| D1 | thu_P26b | A | giữ khoá 150 ms, nạp ví | 200, số dư +, 1 dòng sổ | 409 KHO_BAN |
| D2 | thu_P26b | A | giữ khoá suốt, nạp ví | 409 KHO_BAN, kho không đổi, thời gian 1,4–2,5 s (cận dưới tất định — hẹn giờ không chạy sớm; cận trên chỉ phòng máy chậm) | 409 ngay (< 0,3 s) → ĐỎ ở vế thời gian |
| D3 | thu_P26b | A (kết nối) | ngay sau D2 (đã nhả): nạp ví rồi `db.run` một dòng | 200 + số dư đọc bằng client THỨ HAI đã đổi; dòng `run` có thật | 409 / mất ghi |
| D4 | thu_P26b | A, B (lỗi khác) | thay tạm `getDb().transaction` ném lần lượt `SQLITE_IOERR`, `TRANSACTION_CLOSED`, `TRANSACTION_TIMEOUT`, `SQLITE_BUSYX` (chuỗi GIỮA — K3 tiền tố), kèm chuỗi lạ trong message | mỗi mã: 500 `LOI_MAY_CHU`, mở đúng 1 lần (không thử lại), thân trả về KHÔNG chứa chuỗi lạ | 500 có `err.message` → ĐỎ |
| D5 | thu_P26b | B | vòng qua `TRANSACTION_BUSY`, `SQLITE_BUSY_SNAPSHOT`: `getDb().transaction` ném mã đó LẦN ĐẦU (lần thay kết nối gỡ vá) | thử lại → 200 | 500 |
| D8 | thu_P26b | A (đường Turso) | `getDb().transaction` trả giao dịch THẬT nhưng `execute` đầu ném `SQLITE_BUSY` một lần (BEGIN lười hỏng ở câu đầu) | thử lại → 200; giao dịch hỏng đã đóng (không treo khoá — lệnh ghi kế tiếp 200) | 409 KHO_BAN |
| D9 | thu_P26b | B (`loiGhi` dùng `laLoiBan`) | `co.ban` nhận mã: ném `TRANSACTION_BUSY` ở lớp bọc (NGOÀI vòng thử lại) | 409 KHO_BAN, kho không đổi | 500 |
| D7 | thu_P26b | A (kết nối `run`) | `run` ngoài giao dịch gặp bận thật (khoá đang giữ) → nhả → `run` tiếp | lần 1 ném bận; lần 2 ghi có thật (đọc bằng client 2) | mất ghi |
| C1 | thu_P26c | C (hai người) | móc mới `co.mocTruocTx` (như thu_P20) chạy TRỌN đơn 2 trước khi giao dịch đơn 1 mở; hai đơn tiền mặt | cả hai 200, hai mã KHÁC nhau, cả hai dạng `ORD-<ngày>-NNN`, số liền nhau | đơn 1: 500 (UNIQUE) |
| C2 | thu_P26c | C (K5) | ngày có mã cũ `ORD-<ngày>-999` → đơn mới `-1000` | đúng | **xanh trên gốc** — ca K5 khoá hành vi khi bỏ vòng 30 lần, KHÔNG tính là ca đỏ |
| C3 | thu_P26c | C | `co.banCauDau` ở đơn tiền mặt (sau vá câu đầu = đọc mã) | 409 KHO_BAN, không đơn mới | **xanh trên gốc** (gốc: móc nổ ở INSERT → 409) — ca canh đột biến `VS-C-nuot-loi-doc-ma`, KHÔNG tính là ca đỏ |
| G1 | thu_P26c | G (hai người) | mục 6 | đúng 200 + 400 `DISCOUNT_CODE_LIMIT_REACHED`, `used_count = 1`, một đơn mang mã | 500 |
| H1 | thu_P26c | D | huỷ đơn có món SX; móc mới `co.banDoc` bọc `db.query`, CHỈ nổ khi SQL khớp `/FROM pos_order_items oi/` (không nổ ở `authenticate`), tự gỡ cuối ca | 200, đơn `cancelled`, nợ kho `in` đủ món | 409 KHO_BAN trong khi đơn đã huỷ |
| H2 | thu_P26b | D | `reconcile-all` ≥ 2 ví lệch, lần mở giao dịch THỨ 2 ném bận (`co.banLan`) | không 409; `code DOI_SOAT_DO_DANG`, `checked = 1`; ví `results[0].phone` đã khớp trong kho, ví `dung_o` chưa (thứ tự `SELECT DISTINCT` không cố định — lấy SĐT từ phản hồi) | 409 KHO_BAN |
| H3 | thu_P26b | D (K5) | `reconcile-all`, bận ngay ví ĐẦU | 409 KHO_BAN, kho không đổi (= K1 cũ, giữ) | xanh (K1 cũ) |
| V1 | thu_P26b | E | ví `balance` NULL (chèn SQL = dữ liệu cũ) → nạp 10.000 | 200, `balance = 10000`, dòng sổ trước 0 / sau 10.000 | NULL → ĐỎ |
| V2 | thu_P26b | E | ví `total_topup`/`total_spent` NULL → nạp, trừ tay | hai cột ra số đúng | NULL |
| V3 | thu_P26b | E | đơn trả ví, xoá dòng ví (ví mất), huỷ đơn | ví tạo lại: `balance` = khoản hoàn, `total_spent = 0` | `total_spent` âm |
| V4 | thu_P26b | E (K5) | ví có sẵn, huỷ đơn trả ví | `total_spent` giảm đúng khoản hoàn (như cũ) | xanh (K5) |
| F1 | thu_P26b | F | file có trang "Nhật ký đồng bộ" ĐỨNG TRƯỚC trang "Số dư" (có dòng) — thứ tự cố ý, để bắt vá "chặn trong vòng sau khi đã xoá trang trước" (bài thật dùng `pos_sync_logs` thay `pos_settings`) | 400 `KHOI_PHUC_TRANG_TIEN_BI_CHAN` (Q8c); `pos_sync_logs` VÀ `pos_wallets` không đổi | 200, ví bị ghi đè |
| F2 | thu_P26b | F | file có trang "Đơn hàng" | 400, `pos_orders` không đổi | 200 |
| F3 | thu_P26b | F (K5) | file chỉ có trang "Kho quà" | 200 khôi phục như cũ | xanh (K5) |

Ca cũ giữ nguyên, không bớt ca / `c.mong`. K1/K1b cũ (bận giả ném ở lớp bọc NGOÀI hàm thật) vẫn phải 409 — đo "hết lượt → 409",
bỏ qua vòng thử lại thật nhưng không vô nghĩa. `thu_P20.js`, `thu_GOI1.js` không sửa — chạy lại làm hồi quy.
`bang_chung_do.txt`: mỗi bài sửa một dòng `SỐ CA <bài>: <N>` + nguyên dòng ✗ trên gốc.

## 8. Đột biến `viec/P26d/dot_bien.py` (khuôn `viec/P26c/dot_bien.py`, chạy từng tên, có đối chứng)

| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| thử lại BEGIN | `BV-A-bo-thu-lai` (vòng chờ 0 lượt) | D1, D5, D8 |
| thử lại chỉ khi bận | `VS-A-thu-lai-moi-loi` (bỏ điều kiện `laLoiBan` ở vòng) | D4 (mở 1 lần) |
| thay kết nối kho file | `BV-A-bo-thay-ket-noi` | D3, D7 |
| tổng chờ | `VS-A-cho-qua-lau` (thêm một lượt 2000 ms) | D0, D2 |
| `laLoiBan` | `VS-B-chi-khop-mot-ma` (`=== 'SQLITE_BUSY'`) | D5, D9 |
| `laLoiBan` nới | `VS-B-khop-rong` (`/BUSY\|^TRANSACTION_/`) | D4 (`SQLITE_BUSYX`, `TRANSACTION_CLOSED`, `TRANSACTION_TIMEOUT`) |
| `loiGhi` dùng `laLoiBan` | `BV-B-loiGhi-ma-cu` (`err.code === 'SQLITE_BUSY'`) | D9 |
| `loiGhi` 500 | `BV-B-lo-message` (trả `err.message`) | D4 |
| mã đơn trong giao dịch | `BV-C-ma-don-ngoai-tx` (đọc bằng `queryOne` trước `beginTransaction`) | C1, G1 |
| bỏ nuốt lỗi đọc mã | `VS-C-nuot-loi-doc-ma` (giữ `try/catch` trả `-001`) | C3 |
| huỷ: món đọc trong giao dịch | `BV-D-huy-doc-mon-sau-commit` | H1 |
| reconcile-all dở dang | `BV-D-doi-soat-409` (bỏ bắt lỗi trong vòng) | H2 |
| chuẩn hoá `balance` NULL | `BV-E-bo-chuan-hoa-null` (bỏ câu `SET balance = 0 … IS NULL`) | V1 |
| COALESCE cột tổng | `BV-E-bo-coalesce-cot-tong` | V2 |
| tổng chi ví mới | `VS-E-tong-chi-am` (INSERT `tieu` không kẹp) | V3 |
| chặn khôi phục | `BV-F-khong-chan` | F1, F2 |
| chặn TRƯỚC mọi ghi | `VS-F-chan-sau-khi-xoa` (kiểm từng trang trong vòng) | F1 (vế `pos_sync_logs`) |
| kiểm lại mã giảm trong giao dịch | `BV-G-bo-kiem-lai-ma` | G1 |

## 9. Đường song song (K4) đã rà

- Mọi chỗ mở giao dịch (`grep -rn "beginTransaction()" server`): orders.js ×3, wallets.js `trongGiaoDich` (dùng bởi wallets, refunds,
  damages, packages), loyalty.js, signup-codes.js ×3, product-groups.js — đều qua `beginTransaction` → được thử lại, không sửa file nào.
- Mọi chỗ khớp mã bận: chỉ `wallets.js:98` (`grep -rn "SQLITE_BUSY" server` = 1) → `laLoiBan`.
- Mọi chỗ sinh mã đơn / INSERT `pos_orders`: chỉ `orders.js:816` / `:893`.
- Mọi lệnh ghi `pos_wallets`: `ghiVi`, `reconcileWallet` (E12) + `backup.js` (tên bảng là biến) — mục 5.
- Mọi chỗ trả `KHO_BAN`: bảng mục 3.
- `run` cùng khuôn "câu bận làm hỏng kết nối" với BEGIN (đo 0.2: INSERT). `query` (SELECT) KHÔNG đo ở 0.2 — soát vòng 1 bắt; đo 19.10: SELECT
  bận KHÔNG làm hỏng kết nối **[SAI — đo chỉ MỘT giao dịch sau SELECT; soát vòng 2 đo lại: giao dịch thứ hai trở đi BẬN — xem Q8]** (trang_thai.md, Câu hỏi Q7b). Vá cả hai (Q5). Q5 không duyệt → bỏ vá `query` và
  bỏ ca D7 (không thuộc nghiệm thu A, vốn chỉ nói "BEGIN hỏng").
- `generateOrderCode` (`helpers.js:8`, còn được import ở orders.js) không còn chỗ gọi — không phải đường sinh mã song song; không sửa.
- Catch đọc biến gán trong try: tạo đơn (`orderCode`, mục 2), huỷ / xoá (`order?.code` — đã chịu `undefined`).

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
Thử ~250 dòng (thu_P26b ~170, thu_P26c ~80; thu_P20 / thu_GOI1 không sửa). Không file mới ngoài `viec/P26d/`. Không chỉ mục, không bảng mới.

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
- P5. Tạo đơn: khối tạo gói (`pos_customer_packages`) và thẻ hội viên (`pos_membership_purchases`) chạy SAU commit bằng `run()`
  thường, lỗi bị nuốt (`console.error`) → khách đã trả tiền mà gói / thẻ không được ghi, quầy vẫn nhận 200, không cờ "cần làm lại".
  Không phải 409 sai (khuôn D) nên ngoài nghiệm thu; đề xuất việc sau (đưa vào giao dịch tạo đơn). — soát kế hoạch.
- P6. Huỷ đơn: SX lỗi VÀ ghi `pos_stock_pending` cũng lỗi → chỉ `console.error`, quầy nhận 200 "Đã hủy", mất dấu nợ kho. — soát kế hoạch.

## 14. Soát kế hoạch (agent chỉ đọc, 18.10) — CẦN SỬA, đã sửa trong bản này

| Điểm soát | Xử lý |
|---|---|
| `COALESCE(balance, 0)` trong `ghiVi` làm E12 đỏ (`kiem_tra_truoc_khi_giao.js:517-519`) | mục 4: giữ `balance = balance + ?`, thêm câu chuẩn hoá NULL có điều kiện |
| E15: chú thích số dòng cứng | mục 1: không ghi số dòng trong chú thích code mới |
| Gộp hai nhánh thử lại (file / Turso) | mục 1: một khối bọc "mở + câu đầu"; ca D8 cho đường Turso |
| `loiGhi` dùng `laLoiBan` chưa có ca | ca D9 + đột biến `BV-B-loiGhi-ma-cu` |
| Thiếu ca / đột biến "nới phép" | D4 thêm `TRANSACTION_CLOSED`, `TRANSACTION_TIMEOUT`, `SQLITE_BUSYX`; đột biến `VS-B-khop-rong` |
| Móc trải `{ ...tx }` | mục 1: object literal + closure |
| H1 móc `db.query` nổ ở `authenticate` | H1 khớp theo SQL, tự gỡ |
| F1 xanh oan nếu "Số dư" đứng trước "Cài đặt" | F1 cố ý đặt "Cài đặt" trước |
| thu_P26b chưa nạp route backup | mục 7 ghi rõ |
| Ca bận thật trên gốc làm hỏng kết nối → ca sau đỏ sai câu | mục 7: ca bận thật chạy CUỐI bài |
| D2 thời gian | thêm D0 tĩnh "tổng ≤ 2000 ms" |
| C3 ghi "xanh trên gốc?" | ghi rõ: ca canh đột biến, không tính đỏ |
| H2 thứ tự `SELECT DISTINCT` | lấy SĐT từ `results[0]` / `dung_o` |
| Câu 500 "chưa xong" sai khi lỗi sau commit | câu trung tính |
| G1: thu_P20 không có `--may-chu` | G1 dời sang thu_P26c, thu_P20 không sửa |
| K1: trích các chỗ `beginTransaction` khác | mục 1 rủi ro (1) |
| Phát hiện gói / thẻ / nợ kho sau commit nuốt lỗi | P5, P6 |

## 15. Chủ quán duyệt (18.10.2026) — phần này THẮNG mọi chỗ khác của file khi lệch

- **Q1** đồng ý: `laLoiBan` khớp `SQLITE_BUSY`, `SQLITE_BUSY_*`, `TRANSACTION_BUSY`. CHƯA KIỂM: "chưa thử Turso thật".
- **Q2** ví đang có giữ cách cộng cũ (không chặn âm); chỉ ví TẠO LẠI lúc hoàn có `total_spent = 0`. Ghi Phát hiện cho DOI-SOAT-1.
- **Q3** chặn THÊM mọi trang tiền: `BANG_KHONG_KHOI_PHUC` = `pos_wallets`, `pos_orders`, `pos_balance_transactions` (Giao dịch số dư),
  `pos_order_items` (Chi tiết đơn), `pos_refund_requests` (Yêu cầu hoàn tiền) — khôi phục chỉ cho phần không dính tiền. Ca F2 chạy
  từng trang trong năm trang.
- **Q4** đồng ý `500 DOI_SOAT_DO_DANG` kèm danh sách ví đã xong.
- **Q5** đồng ý vá `query` (giữ ca D7).
- **THÊM (cùng ý D "báo đúng sự thật", đều trong orders.js):**
  - **I — mua gói / thẻ hội viên ghi TRONG giao dịch tạo đơn.** Hai khối sau commit (tạo `pos_customer_packages` + giao lần 1 +
    gắn `customer_package_id`; ghi `pos_membership_purchases` + đọc `tier_card_valid_months`) dời vào giao dịch, trước khối cộng điểm,
    bỏ `try/catch` nuốt lỗi → lỗi thì rollback cả đơn: bận → 409 `KHO_BAN`, khác → 500 `LOI_MAY_CHU`. Không báo thành công khi gói /
    thẻ chưa ghi. Ca (thu_P26c, móc mới `co.nemGhi` — ném lỗi KHÔNG bận khi câu ghi khớp mẫu, bọc cả `db.run` lẫn `tx.run` để gốc
    và bản vá cùng gặp lỗi): **I1** INSERT gói hỏng → không 200, không đơn mới, ví / điểm không đổi (gốc: 200, đơn không gói → ĐỎ);
    **I2** INSERT thẻ hỏng → như I1; **I3** (K5) mua gói + lấy ngay → 200, gói `delivered_qty` đúng, đơn gắn `customer_package_id`
    (bài thu_GOI1 cũ phủ thêm). Đột biến: `BV-I-goi-ngoai-tx` (`tx.run` → `run` cho INSERT gói — ghi khi giao dịch đang giữ khoá →
    bận → mua gói hỏng, I3 đỏ), `VS-I-nuot-loi-goi` (bọc `try/catch` nuốt lỗi) → I1, `BV-I-the-ngoai-tx` → ca thẻ K5, `VS-I-nuot-loi-the` → I2.
  - **P — pay-debt một giao dịch.** UPDATE thu có điều kiện + nhật ký `pos_order_log` + sổ `debt_payment` trong MỘT giao dịch
    (`beginTransaction`); `changes !== 1` → rollback, 409 `DA_THU_ROI` như cũ; lỗi → rollback, `loiGhi` (bận 409 / khác 500 không lộ câu
    nội bộ). Nhật ký ghi bằng `tx.run` cùng cột với `nhatKyDon.ghiNhatKy` (hàm đó ghi ngoài giao dịch và nuốt lỗi; `utils/nhatKyDon.js`
    ngoài Phạm vi → Phát hiện). Ca (thu_P26c): **P1** INSERT sổ `debt_payment` hỏng → 500 `LOI_MAY_CHU`, thân không chứa chuỗi lạ,
    nợ đơn KHÔNG đổi, không dòng nhật ký (gốc: nợ đã trừ → ĐỎ); **P2** INSERT nhật ký hỏng → như P1 (gốc: nuốt lỗi, 200 thiếu nhật ký);
    **P3** kho bận ở câu đầu (`co.banCauDau`) → 409 `KHO_BAN`, nợ không đổi (gốc: không mở giao dịch → 200 → ĐỎ); **P4** (K5) thu nợ
    thường → 200, nợ về 0, đúng 1 nhật ký, đúng 1 dòng `debt_payment`; DA_THU_ROI cũ (thu_P20 / giả lập) giữ. Đột biến:
    `BV-P-so-ngoai-tx` (`tx.run` → `run` cho INSERT sổ) → P4, `VS-P-lo-message` (catch trả `err.message`) → P1, `BV-P-nhat-ky-nuot-loi`
    (bọc `try/catch` nhật ký) → P2.
- **Ngân sách** tăng tương ứng: code ~130–170 dòng đổi; thử ~400 dòng.
