# KET-NOI-1 — kế hoạch (chờ chủ quán duyệt)

**Nói gọn:** mạng chập một nhịp thì (1) máy chủ tự hỏi lại kho khi chỉ ĐỌC; (2) thu tiền ở quầy mỗi lần bấm mang một "mã lượt bấm", máy quầy
tự gửi lại cùng mã — máy chủ thấy mã cũ thì trả đúng phiên / đơn đã có, không ghi lần hai; (3) mọi lỗi mạng hiện câu tiếng Việt dễ hiểu, không
còn chữ "socket hang up" / địa chỉ kho; (4) nút "Đơn 0đ — hoàn tất" không còn hiện khi máy chủ chưa tính xong.

Code đọc ở main `1d66c61` (HEAD nhánh `8d83bf8`). Mọi số dòng dưới đây đọc trong lượt này.

## 0. Hiện trạng (code thật)
| Chỗ | File:dòng | Đang làm gì |
|---|---|---|
| Đọc ngoài giao dịch | `server/database.js:1495-1508` `query()` | gọi `db.execute` MỘT lần, lỗi → log `Query error: <chữ Turso>` rồi ném nguyên lỗi. `queryOne` (:1516) gọi `query` |
| Ghi ngoài giao dịch | `server/database.js:1530-1546` `run()` | như trên, không thử lại |
| Giao dịch | `server/database.js:1581-1615` `beginTransaction` | chỉ thử lại lỗi BẬN ở câu đầu (P26d) — việc này không đổi phần thử lại |
| Lỗi ghi chung | `server/routes/wallets.js:128-134` `loiGhi` | BẬN → 409 KHO_BAN; khác → 500 LOI_MAY_CHU (không lộ chữ lỗi). 18 file `server/` nhắc tên (gồm `kho/duong.js`; `kh/loi.js:54` chỉ dùng cho BẬN) |
| Route trả chữ lỗi thô | Grep `status\(5\d\d\)\.json\(\{[^}]*(err\|e\|error)\.message` trong `server/` | **116 chỗ / 27 file** trả `{ error: err.message }` → chữ Turso ra thẳng màn hình (Cài đặt › Sao lưu: `backup.js:270`) |
| Bắt lỗi cuối | `server/index.js:219-225` | 500 `Internal server error` |
| Health | `server/index.js:156-165` | công khai, chưa có số kết nối |
| Tạo phiên | `server/utils/giuCho.js:39-107` `taoPhien` | mỗi lần gọi một INSERT mới (:83); phiên QR / App giữ số hoá đơn (:86) |
| Chốt phiên | `server/utils/giuCho.js:112-150` `chotPhien` | lần hai → 409 PHIEN_DA_CHOT (:115-116; cổng thật :127-130) |
| Quầy gọi | `client/src/pages/BanHang/BanHangMoi.jsx:266-305` `chayPhien` | tạo phiên (:274) → chốt (:285); chốt hỏng → hỏi phiên (:290); hỏi cũng hỏng → câu :293 |
| Lớp gọi máy chủ | `client/src/utils/api.js:147-176` `request` | `fetch` ném `TypeError` → `e.message` tiếng Anh ra màn hình; không thử lại |
| Nút 0đ | `client/src/pages/BanHang/ThuTien.jsx:48` + `BanHangMoi.jsx:176` | chưa có số máy chủ → `chiaTra({ tong: 0 })` → `phaiTra = 0` → nhánh "Đơn 0đ — hoàn tất" (nút khoá nhưng chữ sai) |
| Lời lỗi tính giá | `BanHangMoi.jsx:162` | `setLoiTinh(e.message)` — chữ thô |
| Khuôn mã lượt bấm | `server/nang_cap/002_kho_pha_che.js:12,19`; `server/kho/duong.js:195-206`; `client/src/pages/Kho/chung.js:8` `maGuiMoi` | cột `ma_gui` + UNIQUE `WHERE ma_gui IS NOT NULL`; đụng khoá → trả bản đã có |

**Nguồn chữ "socket hang up" ở màn Bán hàng (B-LOI-1): CHƯA truy được.** `POST /orders/tinh-thu` đi `taoDon` → `loiGhi` (`orders.js:1437-1440`)
nên không tự lộ chữ; grep `error: (e|err|loi).message` trong `routes/orders.js` + `utils/*.js` chỉ ra `orders.js:141,169` (danh sách đơn). Vì thế
kế hoạch đổi lỗi NGAY TẠI GỐC (database.js) — đường nào chuyển tiếp `err.message` cũng chỉ còn câu dễ hiểu.

## A. Máy chủ ĐỌC tự thử lại — `server/database.js` (+ `server/index.js` cho health)

### Q-A — dấu hiệu "lỗi mạng" lấy từ đâu (đọc thư viện thật trong `node_modules`)
`@libsql/client` 0.4.3 (HTTP) → `@libsql/hrana-client` 0.5.6 → `@libsql/isomorphic-fetch` 0.1.12 → **`node-fetch` 2.7.0 lồng trong
  `@libsql/isomorphic-fetch/node_modules/`** (bản `node_modules/node-fetch` ở gốc là 3.3.2 — KHÔNG phải bản kho dùng).
- `hrana-client/lib-cjs/http/stream.js:257-266`: `fetch` hỏng → lỗi chuyển NGUYÊN cho câu đang chờ; `client/lib-cjs/hrana.js:284-290`
  `mapHranaError` chỉ bọc `hrana.ClientError` → lỗi mạng tới tay POS **nguyên dạng node-fetch**.
- `@libsql/isomorphic-fetch/node_modules/node-fetch/lib/index.js:1501`: `new FetchError('request to <url> failed, reason: <err.message>', 'system', err)` — đúng câu chủ quán thấy
  (`…turso.io/v2/pipeline failed, reason: socket hang up`); `err.code` = mã hệ thống (`ECONNRESET`…). `:217,:400` thân trả về đứt giữa chừng
  (type `system`); `:388` `body-timeout`; `:1494` `request-timeout`.
- Turso trả 502/503/504 dạng trang (không JSON) → `stream.js:350-367` `HttpServerError(status)` → `hrana.js:306-307` `LibsqlError` code
  `SERVER_ERROR`, `cause.status`.

**MỘT hàm `laLoiMang(err)`** (database.js, xuất ra để thử) — đúng khi MỘT trong:
1. `err.name === 'FetchError'` và `err.type` ∈ `system · request-timeout · body-timeout`;
2. `err.code` (hoặc `err.cause.code`) ∈ `ECONNRESET · ECONNREFUSED · ETIMEDOUT · EPIPE · ENOTFOUND · EAI_AGAIN · EHOSTUNREACH · ENETUNREACH ·
   ECONNABORTED` (bỏ mã `UND_ERR_*` — kho không dùng fetch của Node; soát vòng 1);
3. chữ lỗi khớp `/fetch failed|socket hang up/i` (chữ "fetch failed" phủ luôn fetch của Node nếu sau này đổi);
4. `err.code === 'SERVER_ERROR'` và `err.cause.status` ∈ 502 · 503 · 504.
KHÔNG phải mạng: mọi `SQLITE_*` (gồm BẬN — đường P26d giữ nguyên), `HRANA_PROTO_ERROR`, `SERVER_ERROR` 500, lỗi JS.
Ca thử: MỘT ca cho mỗi dạng 1–4 (dạng 2 thử cả `code` lẫn `cause.code`) (lỗi giả dựng đúng hình node-fetch / LibsqlError), ca KHÔNG cho `SQLITE_ERROR`, `SQLITE_CONSTRAINT`,
`SQLITE_BUSY`, `SERVER_ERROR` 500.

### Cách làm (phương án chọn: A1)
- `laCauDoc(sql)`: bỏ khoảng trắng + chú thích `--…` / `/*…*/` đầu → bắt đầu `SELECT` là ĐỌC; bắt đầu `WITH` chỉ là đọc khi không chứa từ
  `\b(INSERT|UPDATE|DELETE|REPLACE)\b` (chặn `WITH … INSERT`). Phép "không chứa" CHỈ áp cho dạng `WITH` — soát vòng 1 bắt: áp cho mọi câu thì
  SELECT có cột `updated_at` (`settings.js:63,90`, `khoaSaoLuuPos.js:68`) hay hàm `REPLACE()` (`signup-codes.js:125`) mất thử lại.
  `PRAGMA`, `CREATE` → không thử lại.
- `query()`: vòng tối đa 3 lần (1 + **2 thử lại**), chờ `CHO_DOC_MS = [200, 600]` (tổng 0,8 s ≤ ~1 s). Chỉ thử lại khi `laLoiMang(err) && laCauDoc(sql)`.
  Hết lượt / câu ghi / lỗi khác → ném (lỗi mạng ném dạng C2, lỗi khác ném NGUYÊN như cũ — A3). `thayKetNoiNeuBan` giữ nguyên chỗ cũ.
- `run()` và `tx.*` (giao dịch): KHÔNG thử lại; chỉ đổi lỗi mạng sang dạng C2 + đếm + log.
- **Lỗi đổi dạng KHÔNG mang theo lỗi gốc** (`cause`): chỉ giữ `ma_goc` = mã chữ (`ECONNRESET`…). Soát vòng 1 bắt: `loiGhi` (`wallets.js:131`
  `console.error('Lỗi ghi:', err)`), `kho/duong.js:37` và ~24 chỗ `console.error(x, err)` in cả object → địa chỉ kho trong `cause` vẫn lên log.
- **A4 log** MỘT dòng mỗi lần rớt: `[KET-NOI] doc|ghi lan <i>/<n> <MÃ> — thu lai|het luot|khong thu lai (cau ghi)`. Không có SQL, không tham số.
  Dòng `Query error:` / `Run error:` cũ **không in nữa khi là lỗi mạng** (chúng in `err.message` chứa địa chỉ kho); lỗi khác giữ dòng cũ.
- **Đếm** trong bộ nhớ (database.js): `rot` (mỗi lần một câu gặp lỗi mạng, cả đọc lẫn ghi), `thu_lai_dat` (câu đọc rớt rồi đọc lại được),
  `thu_lai_hong` (câu đọc hết lượt vẫn rớt), `tu` = `getNow()` lúc nạp module. Xuất `demKetNoi()`; `index.js` health thêm `ket_noi: demKetNoi()`.
  Health công khai: bốn con số không chứa dữ liệu khách / địa chỉ kho (soát bảo mật xem lại).

| Phương án | File | Dòng ~ | Rủi ro |
|---|---|---|---|
| **A1** (chọn) thử lại trong `query()`, theo loại câu | database.js, index.js | ~45 | câu "đọc" có tác dụng phụ — không có: grep A2 dưới |
| A2 bọc `db.execute` (mọi đường, kể cả giao dịch) | database.js | ~35 | thử lại câu trong giao dịch / câu ghi — phiếu Cấm |

### A2 — chỗ gọi `query()` với câu không phải SELECT (máy quét: `scratchpad/quet_query.js`, chép kết quả vào bằng chứng)
331 lời gọi `query(`/`queryOne(` bằng chuỗi chữ trong `server/`: 4 câu không bắt đầu SELECT/WITH —
`server/nang_cap/chay.js:32` `CREATE TABLE IF NOT EXISTS pos_nang_cap` · `server/utils/khoiPhuc.js:47` `PRAGMA table_info` ·
`server/utils/donApp.js:413,421` `${CAU_DON}…` (= `SELECT * FROM (` — `donApp.js:343`, là câu đọc). 26 lời gọi truyền biến (`sql`, `countSql`,
`BALANCE_SQL`…) — đều dựng câu SELECT; `laCauDoc` xét lúc chạy nên KHÔNG cần tin danh sách này. Không có `query(` nào bắt đầu `WITH`.

## B. Thu tiền ở quầy — mã lượt bấm

### Máy chủ (`server/nang_cap/029_ket_noi.js`, `server/utils/giuCho.js`, `server/routes/thanh-toan.js`)
- **029**: `themCot('pos_phien_thanh_toan', 'ma_gui TEXT')` + `CREATE UNIQUE INDEX IF NOT EXISTS ux_phien_ma_gui ON pos_phien_thanh_toan(ma_gui)
  WHERE ma_gui IS NOT NULL` (khuôn 002). `themCot` tự sao lưu bảng có dòng.
- **taoPhien** (chỉ thêm nhánh ma_gui — đúng Cấm):
  - `ma_gui` có mặt thì phải là chuỗi `[A-Za-z0-9_-]{8,64}` → sai: 400 `MA_GUI_KHONG_HOP_LE`. Không gửi → y như cũ (đơn App `donApp.js:309` tự dựng
    thân, không mang `ma_gui` từ App — App không chen mã được).
  - MỘT hàm `phienCuaMa(q, maGui, than, cach, nguoi)`: đọc phiên theo `ma_gui`; không có → null. Có mà `than` (chuỗi JSON đã lọc, đúng cách
    dòng :83 tạo) **hoặc** `cach` **hoặc** `nguoi_tao` khác → 409 `MA_GUI_KHAC_DON` "Mã lượt bấm đã dùng cho đơn khác — bấm thu lại".
    So thêm "trừ tài khoản" (soát vòng 1 bắt — cột `than` chỉ có `don`): `phone_me` đã nằm trong `than` (`parent_phone`, giuCho.js:53);
    `giu_vi > 0` mà lần sau không xin trừ → 409 `MA_GUI_KHAC_DON`. Chiều ngược (xin trừ mà phiên giữ 0 vì ví rỗng) → trả phiên; quầy tự so
    `con_lai` với `phaiTra` (`BanHangMoi.jsx:275`) → lệch thì nhả.
    Phiên QR còn `cho` mà CHƯA có QR (lần đầu đang gọi cổng QR, giuCho.js:97 — lúc dễ gửi lại nhất) → 503 `DANG_XU_LY` "Đang tạo mã QR — chờ
    vài giây" (cùng mã với đơn App `donApp.js:302`); quầy gửi lại được (B3). Phiên `loi` (cổng QR hỏng, giuCho.js:103) → 502 `PAYOS_LOI`
    như lần đầu. Phiên huỷ / hết hạn / đã thu → 409 `PHIEN_DA_CHOT` (câu cũ) — quầy bấm lại ra mã mới. Còn lại → 200
    `{ success, phien: tomPhien(p) }` — CÙNG id, số giữ, QR, nội dung CK.
  - Gọi HAI chỗ: (1) trước `taoDon` chỉ tính (đường nhanh — lần gửi lại không tính lại, không kiểm PIN lại); (2) câu ĐẦU trong `trongGiaoDich`
    (giao dịch ghi khoá độc quyền BEGIN IMMEDIATE — hai lần gửi CÙNG LÚC: lần sau chờ lần đầu commit rồi thấy phiên). Có kết quả → `huy: true`
    (rollback, không giữ ví / voucher / số hoá đơn lần nữa). Đường nhanh (1) BẮT BUỘC: bỏ nó thì lần gửi lại của phiên QR có voucher bị chính
    phiên đầu chặn — `taoDon` chỉ tính → `voucherDangGiu` (`voucherCode.js:120`) → `VOUCHER_DANG_GIU`. Chỗ (2) đứng TRƯỚC phép giữ ví / voucher
    (giuCho.js:65-81) vì cùng lý do. INSERT (:83) thêm cột `ma_gui` — dòng này dùng chung với đơn App (App ghi NULL). Khoá UNIQUE là chốt cuối ở
    tầng kho (hai dòng cùng mã lọt qua → lỗi, không ra phiên đôi).
  - **CHƯA KIỂM (Turso):** kho file chạy BEGIN IMMEDIATE ngay (`@libsql/client/lib-cjs/sqlite3.js:103-106`) → chỗ (2) chắc chắn thấy phiên của
    lần đầu. Turso gửi BEGIN IMMEDIATE lười, gộp câu đầu (`hrana.js:54-60`) — đúng khi máy chủ Turso báo bận mà `MA_BAN` nhận ra (database.js đã
    ghi "chưa thử Turso thật") và lần đầu commit trong 1,55 s. Ca B1f chạy kho file. Khoá UNIQUE vẫn chặn phiên đôi ở Turso.
- **Q-C — "thân khác" so bằng gì:** so NGUYÊN chuỗi `than` đã lưu (`JSON.stringify(don)` sau lọc danh sách trắng + `parent_phone`) + `cach` +
  `nguoi_tao`. Không băm, không cột mới: cột `than` đã có. Phần tiền (giữ ví, còn lại) quầy đã tự so ở `BanHangMoi.jsx:275` — lệch thì nhả phiên.
- **chotPhien — B2** (chỉ thêm một nhánh đầu hàm): `them.lapLai === true` **và** `phien.trang_thai === 'da_thu'` **và** `phien.order_id` **và**
  `phien.nguon === nguon` **và** `nguon ∈ {tien_mat, tai_khoan}` → 200 `{ success: true, order: { id, code }, lap_lai: true }`, không ghi gì.
  `lapLai` CHỈ route `POST /phien/:id/chot` (`thanh-toan.js:67`) đặt — webhook (`:193`, nguon `payos` trùng tên `cach`!), xác nhận tay (`:95`) và
  đơn App (`donApp.js:321`, nguon `tai_khoan`) KHÔNG đặt → giữ 409 như cũ. Phiên huỷ / hết hạn / chốt bởi đường khác → 409 như cũ.
  Thân trả lời gọn hơn lần đầu (chỉ `id`, `code`) — quầy chỉ đọc `c.order?.id` (`BanHangMoi.jsx:287`) rồi tự tải đơn (`:238`).

### Quầy (`client/src/utils/api.js`, `BanHangMoi.jsx`, `tinh.js`)
- `thanPhien` (`tinh.js:267`) nhận thêm `maGui` → `than.ma_gui`. `chayPhien` sinh **một** mã mỗi lần chạy bằng `maGuiMoi` có sẵn
  (`pages/Kho/chung.js:8` — dùng lại, không viết mới).
- **B3** gửi lại nằm ở MỘT chỗ — `api.js request()` với tuỳ chọn `thuLai`: `thanhToanApi.taoPhien` / `chotPhien` / `hoiPhien` (GET) đặt `thuLai`;
  gửi lại NGUYÊN thân (cùng `ma_gui`, cùng id phiên), tối đa 2 lần, chờ `[500, 1500]` ms; nút thu khoá suốt lúc gửi (`dangGuiRef` có sẵn :267).
  Gửi lại khi MỘT hàm `nenGuiLai(err)`: `code` ∈ `MAT_KET_NOI · KHO_MAT_KET_NOI · DANG_XU_LY · KHO_BAN`, hoặc 502 / 503 / 504 **không** kèm `code`
  (trang lỗi của Render / Cloudflare). `KHO_BAN` = chưa ghi gì (P26d) — soát vòng 1: không gửi lại thì lần gửi lại đụng bận làm quầy bấm mã
  mới, bỏ lại phiên mồ côi. 502 `PAYOS_LOI`, 503 `PAYOS_CHUA_CAU_HINH` có `code` → không gửi lại. GET thường chỉ gửi lại theo lỗi mạng
  (không theo `KHO_BAN` / `DANG_XU_LY`).
- **B5** câu MỘT chỗ (`tinh.js`, hằng `CAU_CHUA_BIET_DON`): "Mất kết nối — chưa biết đơn đã ghi chưa. Đừng thu lại: mở Đơn hàng kiểm đơn mới nhất."
  Dùng ở: tạo phiên hết lượt vẫn lỗi mạng (phiên có thể đã tạo — KHÔNG nhả gì, không biết id); chốt hết lượt + hỏi phiên cũng hỏng (thay câu :293).
  Chốt hỏng mà hỏi được phiên: giữ đường cũ (:291-294 — `da_thu` → màn kết thúc; `cho` → nhả). Lần chốt thứ hai tới khi lần đầu ĐANG ghi →
  cổng `vaoGiaoDich` trả false → 409 `PHIEN_DA_CHOT` (`orders.js:1032-1034`) → nhánh cũ hỏi phiên thấy `da_thu` → màn kết thúc (đúng).
  Quyết định trong khối catch đưa vào MỘT hàm thuần `tinh.js` `viecKhiThuHong({ daCoPhien, trangThaiHoi, hoiDuoc, loiMang })` →
  `xong | nha | bao_chua_biet | bao_loi` để thử được bằng hàm (soát vòng 1: nhánh catch chưa có ca chạy thật).
- **Luồng B4** (ca tất định): tạo phiên — máy chủ ghi xong, trả lời rớt → quầy gửi lại cùng mã → cùng phiên; chốt — đơn ghi xong, trả lời rớt →
  quầy gửi lại → B2 trả đơn cũ → một đơn, ví trừ một lần, voucher một lần, một số hoá đơn.

| Phương án | Dòng ~ | Ghi chú |
|---|---|---|
| **B-1** (chọn) gửi lại trong `api.js` theo cờ `thuLai` + mã trong thân | máy chủ ~30 · quầy ~25 | một chỗ gửi lại cho cả GET (C1) và ba lời gọi phiên |
| B-2 vòng gửi lại viết trong `chayPhien` | quầy ~35 | hai chỗ gửi lại (api.js cho GET + màn) — lệch nhau (K4 "một vị từ") |

### Q-B / B6 — mọi đường GHI TIỀN quầy và cách đang chống bấm hai lần
Lập bằng agent chỉ đọc; máy kiểm tận mắt hai dòng đánh dấu ✔.
| Đường | Chống hai lần hiện có | Lần hai sau khi lần đầu XONG ghi lại? |
|---|---|---|
| `POST /thanh-toan/phien` (`thanh-toan.js:36`) | không — mỗi lần INSERT mới | **có** (giữ ví / số HĐ lần hai; chưa có tiền đi) → **B1 việc này** |
| `POST /phien/:id/chot` (`:56`) | câu ghi có điều kiện `cho` + `changes` (`giuCho.js:127-130`) → 409 | không (nhưng lần hai trả 409 → **B2 việc này**) |
| `POST /phien/:id/huy` (`:73`), `xac-nhan-tay` (`:83`) | câu ghi có điều kiện | không |
| Webhook payOS / SePay / Tingee | UNIQUE `khoa` `ON CONFLICT DO NOTHING` | không |
| `POST /orders` trực tiếp ✔ — CHỈ màn CŨ `Sales.jsx:736`; màn cũ là MẶC ĐỊNH (`BanHang/index.jsx:35`, công tắc mỗi máy) | **không** (chỉ cờ `submitting` ở màn) | **có — cả đơn** |
| `POST /wallets/topup` ✔ (`wallets.js:153-169`, gồm nạp tay chủ quán, quyền `topup_balance` — 018) · `/adjust` · `/deduct` | **không** | **có** |
| `POST /orders/:id/pay-debt` (`orders.js:1508`) | câu ghi so `debt_amount` cũ + `changes` → 409 | trả hết: không · **trả một phần: có** |
| `PUT /orders/:id/cancel` HUY-1 (`orders.js:1705`) | `WHERE status='completed'` + `changes` | không |
| `DELETE /orders/:id` | đọc trong giao dịch, xoá dòng → lần hai 404 | không |
| `POST /refunds/:id/approve` · `PUT /packages/customer-packages/:id/cancel` | câu ghi có điều kiện + `changes` | không |
| `POST /damages` (`damages.js:149`) | chỉ trần số lượng / số tiền đền | **có** tới khi chạm trần |
| `POST /loyalty/redeem` (`loyalty.js:69`) | chỉ kiểm đủ điểm | **có** (trừ điểm + voucher lần hai) |
| `POST /membership/cap` (`membership.js:99`) | không | **có** (thêm dòng thẻ) |
| Giao hàng `goi-xe` / `huy-chuyen` / `bao-phi` | câu ghi có điều kiện; không đụng tiền khách | không |
| `/don-mo-rong/:id/doi-cach-tra` | câu ghi có điều kiện → 409 | không |

**Đề xuất cho đường còn hở (chủ quán quyết lúc duyệt) — mình đề xuất ĐỂ VIỆC SAU, không làm trong việc này:**
1. Màn cũ `Sales.jsx` → `POST /orders` (hở NẶNG nhất, và đang là màn mặc định). Phiếu Cấm sửa `Sales.jsx`. Sau việc này `api.js` vẫn KHÔNG tự
   gửi lại POST nên không TỆ hơn hôm nay. Đề xuất phiếu sau: hoặc bật màn mới cho mọi máy, hoặc thêm `ma_gui` cho `POST /orders` (cùng khuôn).
2. `wallets/topup|adjust|deduct`, `loyalty/redeem`, `damages`, `membership/cap`, `pay-debt` trả một phần: cùng khuôn `ma_gui` (cột + khoá UNIQUE
   trên bảng sổ tương ứng) — một phiếu "KET-NOI-2" sau khai trương. Hôm nay không tự gửi lại nên chỉ hở khi nhân viên bấm hai lần.

## C. Ghi khác rớt mạng: báo rõ, không tự ghi lại

### C1 — `client/src/utils/api.js`
- `fetch` ném (không phải `AbortError`) → lỗi `code: 'MAT_KET_NOI'`, `status: 0`, lời "Mất kết nối tới máy chủ — kiểm tra mạng rồi thử lại"
  (hằng MỘT chỗ). Trang lỗi proxy 502/503/504 không `code` sau hết lượt → cùng mã + lời. MỘT hàm `goiFetch` bọc `fetch` dùng cho `request`,
  `upload`, `download` (api.js:200-230 — soát vòng 1: hai hàm này gọi `fetch` riêng, vẫn ra "Failed to fetch"); chỉ `request` gửi lại.
- GET: `thuLai` mặc định BẬT (đọc an toàn) — tối đa 2 lần. POST / PUT / DELETE: mặc định TẮT; chỉ `taoPhien`, `chotPhien` (có mã) và
  **`ordersApi.tinhThu`** (POST nhưng chỉ tính, không ghi — `orders.js:1490-1500` "Không ghi gì") bật. `upload` không đổi.

### C2 — Q-D: chỗ đổi lỗi mạng của kho thành 503 dễ hiểu
- **Một nguồn lời — `database.js`:** lỗi mạng (sau thử lại) được ném lại thành lỗi mới `code: 'KHO_MAT_KET_NOI'`, `status: 503`, `cause` = lỗi gốc.
  Hai câu (đề xuất — xem mục "Chủ quán chọn"):
  - đọc: "Mất kết nối tới kho dữ liệu — thử lại sau vài giây"
  - ghi (`run`, giao dịch): "Mất kết nối tới kho dữ liệu — chưa biết đã ghi chưa, xem lại trước khi bấm lại"
  Nhờ vậy 116 chỗ trả `{ error: err.message }` tự hết lộ chữ Turso mà không sửa route nào.
- **Hai cửa ra:** (1) `loiGhi` (`wallets.js:128`) thêm một nhánh `KHO_MAT_KET_NOI` → 503 `{ code, error }` (17 file route ghi đi qua đây, gồm
  thanh-toan); (2) `index.js` MỘT móc `res.json` gắn ở `/api/pos` trước mọi route: trả lời ≥ 500 có `error` là một trong hai câu trên → đổi
  thành 503 + `code: 'KHO_MAT_KET_NOI'`; bắt lỗi cuối (:219) thêm nhánh cùng mã. `/api/kh` (hợp đồng App) và `/api/nd` KHÔNG gắn móc — chỉ đổi
  chữ lỗi tự nhiên từ database.js (không đổi `code`, không đổi trường → không cần tăng `PHIEN_BAN`; soát lại ở bước làm).
- **Giới hạn đã biết (không sửa — ngoài Phạm vi / không lộ):** 500 chữ cố định (`kho/duong.js:37,102,264` "Lỗi máy chủ", `kh/loi.js:56`),
  `stock.js:33-35,49,51,80-82` (`message: err.message`), `doi-chieu.js:40` (ghép `${err.message}`) — hết lộ nhờ database.js nhưng KHÔNG thành
  503 `KHO_MAT_KET_NOI`. Màn Bán hàng không đi các đường này (tinh-thu / phiên đi `loiGhi`).

| Phương án | Dòng ~ | Rủi ro |
|---|---|---|
| **C-1** (chọn) đổi lỗi ở database.js + `loiGhi` + móc `res.json` /api/pos | ~20 | móc so đúng HẰNG của mình, không dò chữ lạ |
| C-2 sửa 116 chỗ trả `err.message` | ~120 | sót, đụng 27 file ngoài Phạm vi |
| C-3 AsyncLocalStorage đánh dấu yêu cầu có lỗi kho | ~30 | phức tạp hơn, không thêm ca nào đạt |

## D. Hồi quy (K5) — luồng hợp lệ phải KHÔNG bị chặn / đổi
Mỗi luồng một ca "phải KHÔNG đổi" trong `thu_KETNOI1.js`, cộng toàn bộ bài cũ (`npm test`, giả lập quầy `cong_cu/gia_lap`):
1. Tạo phiên KHÔNG gửi `ma_gui` (đơn App, bài cũ thu_P3 / thu_KHMUA1 / thu_KHNAP1…) — gọi hai lần ra hai phiên như cũ.
2. Hai lượt bấm KHÁC mã, cùng giỏ (khách mua hai đơn giống nhau liên tiếp) → hai phiên, hai đơn — không bị gộp.
3. Chốt tiền mặt / trả đủ tài khoản / QR webhook / xác nhận tay — kết quả như cũ; webhook gửi trùng giữ đường cũ; xác nhận tay lần hai giữ 409.
4. Đơn App `tai_khoan` chốt qua `chotPhien` không `lapLai` → lần hai vẫn 409 (không đổi hành vi App).
5. SELECT gặp SQLITE_BUSY → đường P26d (`thayKetNoiNeuBan`, ném BẬN) không đổi, không bị đếm là rớt mạng; BEGIN bận vẫn 409 KHO_BAN.
6. Lỗi SQL thật / ràng buộc trong `query()` → ném NGUYÊN (chữ, `code`) như cũ, `execute` gọi đúng 1 lần.
7. Lỗi nghiệp vụ tính giá (mã hết hạn, hết hàng — 4xx có `code`) → lời máy chủ giữ nguyên (E2).
8. Đơn 0đ THẬT (máy chủ tính ra 0) → nút "Đơn 0đ — hoàn tất" vẫn hiện (E1).
9. POST thường (nạp ví, huỷ đơn…) rớt mạng → báo `MAT_KET_NOI`, gửi đúng 1 lần (không tự gửi lại).
10. Phiên QR: hết hạn / huỷ / tiền về muộn (KH-NAP-1) — bài cũ thu_KHNAP1 / thu_SEPAY1 / thu_TINGEE1 xanh.

## E. Màn Bán hàng khi chưa có số máy chủ
- **E1** `ThuTien.jsx:48`: nhánh "Đơn 0đ / Trả đủ bằng tài khoản" chỉ khi `coSo && phaiTra <= 0`; `!coSo` → không vẽ nút thu (dòng "Phải trả
  Đang tính…" :46 và lời lỗi + Thử lại `BanHangMoi.jsx:442` đã có). Vị từ thuần `nhanhNutThu({ coSo, phaiTra })` → `'cho' | 'het' | 'tra'`
  trong `tinh.js` (để thử bằng hàm, cùng một vị từ cho ThuTien).
- **E2** `BanHangMoi.jsx:162`: `setLoiTinh(loiTinhGia(e))` — hàm thuần ở `tinh.js`: `e.code` ∈ `MAT_KET_NOI · KHO_MAT_KET_NOI` → "Mất kết nối,
  bấm Thử lại"; khác → `e.message` của máy chủ (lỗi nghiệp vụ giữ nguyên). Không cần vị từ chung với `api.js`: `api.js` (vị từ `laLoiMangQuay`
  — quyết định GỬI LẠI) hết lượt thì đã đổi mọi lỗi mạng / trang proxy thành `MAT_KET_NOI`, máy chủ gắn sẵn `KHO_MAT_KET_NOI`. `tinh.js` không nạp
  `api.js` (ngược tầng; `api.js` không chạy thẳng trong node vì `import.meta.env` — bài thử gói nó bằng esbuild như `thu_VOUCHER2.js:117-119`).

## Bài thử — `cong_cu/thu_KETNOI1.js` (ánh xạ 1-1 nghiệm thu)
Khuôn `thu_P3.js`: database.js + libsql thật trên kho TẠM, thay `ketNoiKho`, Express riêng mount đúng đường. Lỗi mạng giả: thay `execute` của
client kho (`db.getDb()`) / của giao dịch, ném lỗi dựng đúng hình node-fetch (`name FetchError`, `type system`, `code ECONNRESET`, chữ
`request to https://thu.turso.io/v2/pipeline failed, reason: socket hang up`). "Ghi rồi mới rớt": gọi `commit` thật xong mới ném. Quầy: gói
`client/src/utils/api.js` THẬT bằng esbuild (`client/node_modules`), `fetch` giả bọc máy chủ thử (chuyển yêu cầu thật rồi vứt trả lời).
| Ca | Nghiệm thu | Nội dung (ĐỎ trên gốc vì) |
|---|---|---|
| A1a/A1b | A1 | SELECT rớt 1 lần · 2 lần → ra kết quả đúng, `execute` gọi 2 · 3 lần (gốc ném ngay) |
| A1c | A1 ngưỡng | rớt 3 lần → ném `KHO_MAT_KET_NOI`, `execute` đúng 3 lần (trên + dưới ngưỡng: 2 đạt / 3 hỏng) |
| A1d | A1 thời gian | rớt 2 lần → RA KẾT QUẢ **và** tổng chờ ≤ 1000 ms (gốc: ném — đỏ ở vế ra kết quả) |
| A1e…h | Q-A | `laLoiMang` đúng cho 4 dạng (FetchError system · `cause.code` UND_ERR_SOCKET · chữ "fetch failed" · SERVER_ERROR 503); sai cho SQLITE_ERROR, SQLITE_CONSTRAINT, SQLITE_BUSY, SERVER_ERROR 500 (gốc: hàm chưa có) |
| A2a/A2b | A2 | `run('UPDATE…')` rớt → ném ngay, `execute` 1 lần; `query('INSERT … RETURNING')` / `query('WITH … INSERT')` rớt → không thử lại |
| A2c | A2 | câu SELECT có chú thích / khoảng trắng đầu → vẫn thử lại |
| A2d | A2 | `SELECT key, updated_at …` và `SELECT REPLACE(code, …)` rớt → VẪN thử lại (khoá lỗi soát vòng 1) |
| A3a/A3b | A3, D5, D6 | SQL sai → ném nguyên, 1 lần; SQLITE_BUSY → ném BẬN, không đếm `rot` |
| A4a | A4 | log có `[KET-NOI]`, KHÔNG chứa SQL, tham số (SĐT giả), địa chỉ kho |
| A4b | A4 | `GET /api/pos/health` có `ket_noi.{rot,thu_lai_dat,thu_lai_hong,tu}` đúng số sau các ca trên |
| B1a | B1 | cùng `ma_gui` hai lần → cùng id / tong / giu_vi / noi_dung; bảng phiên +1 dòng; ví giữ một lần |
| B1b | B1 | phiên QR (cổng giả) cùng mã → cùng QR, một số hoá đơn (`pos_so_hoa_don` +1), cổng QR gọi 1 lần |
| B1c | B1 | cùng mã, giỏ khác → 409 `MA_GUI_KHAC_DON`, không phiên mới |
| B1d | B1 | cùng mã, nhân viên khác → 409 |
| B1e | B1 / D1 | không gửi mã → hai phiên (như cũ); khác mã cùng giỏ → hai phiên |
| B1f | B1 / B4 | hai yêu cầu cùng mã CÙNG LÚC (`Promise.all`) → một phiên |
| B1g | B1 | mã sai dạng → 400 `MA_GUI_KHONG_HOP_LE`; phiên của mã đã huỷ → 409 `PHIEN_DA_CHOT` |
| B1h | B1 | cùng mã + cùng giỏ, lần đầu trừ tài khoản (giữ > 0), lần sau không xin trừ → 409 `MA_GUI_KHAC_DON` |
| B1i | B1 | phiên QR có voucher, gửi lại cùng mã → 200 cùng phiên (không `VOUCHER_DANG_GIU`) |
| B1j | B1 | phiên QR chưa có QR (cổng giả treo) gửi lại → 503 `DANG_XU_LY`; phiên `loi` → 502 `PAYOS_LOI` |
| B2a | B2 | chốt tiền mặt hai lần → lần hai 200 cùng `order.id`; đơn +1, sổ ví / điểm / voucher không thêm dòng |
| B2b | B2 | phiên đã huỷ / hết hạn → chốt 409 (như cũ) |
| B2c | B2 / D3 | phiên chốt bởi xác nhận tay / webhook → `/chot` 409; xác nhận tay lần hai 409 |
| B2d | D4 | `chotPhien` không `lapLai` (đường App) lần hai → 409 |
| B3a | B3 | api.js: `taoPhien` rớt mạng 1 lần → gửi lại NGUYÊN thân (cùng `ma_gui`) → thành công; đếm 2 lần gửi |
| B3b | B3 | api.js: 502 không code → gửi lại; 502 `PAYOS_LOI` → không; 3 lần rớt → ném `MAT_KET_NOI` sau đúng 3 lần |
| B3c | B3 | api.js: `chotPhien` gặp 409 `KHO_BAN` / 503 `DANG_XU_LY` → gửi lại; GET thường gặp `KHO_BAN` → không |
| B3d | B3/B5 | `viecKhiThuHong`: tạo phiên hết lượt lỗi mạng → `bao_chua_biet` (không nhả); chốt hỏng + hỏi được `da_thu` → `xong`; `cho` → `nha`; hỏi hỏng → `bao_chua_biet` |
| B4a | B4 | đầu-cuối: máy chủ ghi phiên rồi trả lời rớt → api.js gửi lại → một phiên |
| B4b | B4 | đầu-cuối: máy chủ ghi đơn (commit thật) rồi trả 503 / rớt → api.js gửi lại chốt → một đơn, ví trừ 1 lần, voucher 1 lần, một số HĐ |
| B5a | B5 | `CAU_CHUA_BIET_DON` đúng chữ phiếu; `BanHangMoi.jsx` không còn câu cũ :293, dùng hằng ở cả hai nhánh (thử hàm + soi nguồn) |
| B5b | B3 | `thanPhien({ …, maGui })` có `ma_gui`; không truyền → không có trường (mặc định khoá bằng ca không đối số) |
| C1a | C1 | api.js: `fetch` ném TypeError → lỗi `code MAT_KET_NOI` + lời tiếng Việt, không có "Failed to fetch" |
| C1b | C1 | GET rớt 2 lần → lần 3 thành công; POST thường rớt → gửi đúng 1 lần |
| C1c | C1 | `upload` / `download` rớt → `MAT_KET_NOI` + lời tiếng Việt |
| C2a | C2 | route đọc qua `query` hết lượt (vd `GET /api/pos/thanh-toan/phien/:id`) → 503 `KHO_MAT_KET_NOI`, thân không chứa `turso` / `socket hang up` / `pipeline` |
| C2b | C2 | route trả `{ error: err.message }` (một route thật, vd `GET /api/pos/orders`) → 503 + code, không lộ |
| C2c | C2 | `loiGhi` (tạo phiên, `run` rớt) → 503 + code, câu "chưa biết đã ghi chưa" |
| C2d | D | lỗi 500 không phải mạng → giữ nguyên thân cũ (móc không đụng) |
| C2e | C2 | lỗi kho ném thẳng tới bắt lỗi cuối (`index.js:219`) → 503 + code; 500 của `middleware/auth.js:77,111` khi kho rớt → 503 |
| C2f | A4/C2 | `loiGhi` + `console.error(x, err)` với lỗi đã đổi dạng → log KHÔNG chứa địa chỉ kho (`turso.io`) |
| E1a/E1b | E1 | `nhanhNutThu({ coSo:false, phaiTra:0 })` → `'cho'`; `coSo:true, phaiTra:0` → `'het'` (đơn 0đ thật); ThuTien dùng vị từ (soi nguồn + đột biến) |
| E2a/E2b | E2 | `loiTinhGia` lỗi mạng / 503 KHO_MAT_KET_NOI → "Mất kết nối, bấm Thử lại"; 400 có code → lời máy chủ |

**Ca hai người cùng bấm (tiền):** B1f (cùng mã cùng lúc) + B2a biến thể hai lần chốt `Promise.all` → một đơn (lần thua 409 hoặc 200 lap_lai).

**Đột biến** `viec/KET-NOI-1/dot_bien.py` (mỗi cái một dòng, có đối chứng):
`BV-DOC-THU-LAI` (bỏ vòng thử lại) · `VS-THU-LAI-BA` (thử lại 3 lần — ngưỡng) · `VS-THU-LAI-GHI` (laCauDoc luôn đúng) · `VS-CAU-DOC-CHUA-TU`
(phép "không chứa" áp cho cả SELECT — đưa lại lỗi soát vòng 1) · `VS-LOI-GIU-CAUSE` (giữ `cause`) · `VS-MA-GUI-BO-TK` (bỏ so giữ ví) ·
`BV-MA-GUI-QR-DANG-TAO` · `VS-NEN-GUI-LAI-BO-KHO-BAN` · `BV-GOI-FETCH-UPLOAD` · `BV-VIEC-KHI-THU-HONG` · `VS-MANG-RONG` (laLoiMang
luôn đúng) · `VS-MANG-BO-CAUSE` (bỏ vế `cause.code`) · `BV-MA-GUI-NHANH` + `BV-MA-GUI-TRONG-GD` (gỡ từng chỗ gọi `phienCuaMa`) · `VS-MA-GUI-BO-SO-THAN`
· `BV-CHOT-LAI` · `VS-CHOT-LAI-MOI-NGUON` (bỏ vế `lapLai`) · `BV-API-MAT-KET-NOI` · `VS-API-POST-THU-LAI` (mọi POST gửi lại) · `BV-API-PHIEN-THU-LAI`
· `BV-LOI-KHO-MOC` · `VS-LOI-KHO-CHU-GOC` (giữ chữ lỗi gốc) · `BV-LOIGHI-503` · `BV-NUT-0D` · `BV-LOI-TINH` · `BV-LOG-DEM`.

**Đường song song phải canh (K4):** `query` ↔ `queryOne` (gọi `query` — tự phủ) ↔ `tx.query/queryOne/run` (chỉ đổi lỗi, không thử lại) ↔ `run`;
`phienCuaMa` hai chỗ gọi; ba lối vào `chotPhien` (route chốt, xác nhận tay, webhook) + đơn App; `loiGhi` ↔ móc `res.json` ↔ bắt lỗi cuối;
`laLoiMangQuay` dùng chung cho B3, C1, E2; câu B5 hai nhánh; dòng log cũ `Query error:` / `Run error:` (lộ địa chỉ kho trong log).

## Ngân sách ước lượng
Máy chủ ~105 dòng (database.js ~55 · giuCho.js ~28 · index.js ~12 · 029 ~8 · wallets.js 2 · thanh-toan.js 1) — dưới ~150.
Giao diện ~65 (api.js ~35 · tinh.js ~18 · BanHangMoi.jsx ~8 · ThuTien.jsx ~3) — dưới ~80. Thử ~400. `client/dist` build lại.
`kiem_tra_truoc_khi_giao.js`: không định đổi (không thêm `fetch` trần; bánh cóc không đổi).

## Chủ quán chọn lúc duyệt (mình đã đề xuất sẵn — chỉ cần xác nhận)
1. **Đường hở B6** (màn cũ `Sales.jsx` / `POST /orders`, nạp ví, đổi điểm, đền, cấp thẻ, trả nợ một phần): đề xuất **để phiếu sau**; việc này
   không làm chúng tệ hơn (không tự gửi lại POST).
2. **Hai câu lỗi kho** (đọc "thử lại sau vài giây" / ghi "chưa biết đã ghi chưa, xem lại trước khi bấm lại") — phiếu ghi một câu; đề xuất hai
   câu vì câu "thử lại" cho đường GHI có thể làm nhân viên ghi hai lần (nạp ví chưa có mã chống trùng).
3. **Bấm thu lại sau câu B5:** phiếu chốt mỗi lần bấm một mã mới → phiên mồ côi (nếu có) giữ ví / voucher tới hết 10 phút. Phương án khác
   (~5 dòng): giữ mã của lượt chưa rõ kết quả và dùng lại khi bấm lại CÙNG giỏ → trả đúng phiên mồ côi. Đề xuất: **làm theo phiếu** (mã mới),
   ghi lại để xem sau khai trương.
4. Thân trả lời của lần chốt thứ hai gọn (`order: { id, code }`) thay vì đủ như lần đầu — quầy chỉ dùng `id`. Đề xuất: **gọn**.
5. `ordersApi.tinhThu` (POST chỉ tính) tự gửi lại như GET — phiếu C1 ghi "POST không tự gửi lại (trừ B3)", đây là NGOẠI LỆ cần bạn cho phép.
   Đề xuất: **có** (không ghi gì — `orders.js:1490-1500`; đỡ được đúng lỗi B-LOI-1 ngay lần đầu).

## Soát kế hoạch (agent chỉ đọc, vòng 1 — 16.11)
Bốn câu: ra ngoài Phạm vi? cách ngắn hơn? ca nghiệm thu thiếu bài thử / không đỏ trên gốc? đường song song sót?
1. **Phạm vi / Cấm: đạt.** Mọi file sửa nằm trong Phạm vi; `giuCho.js` chỉ nhánh ma_gui + nhánh chốt lại. Lưu ý đã ghi vào kế hoạch: dòng INSERT
   dùng chung với đơn App (App ghi NULL); `tinhThu` gửi lại là ngoại lệ của C1 (chủ quán chọn #5). Nạp `maGuiMoi` từ `Kho/chung.js` là dùng lại,
   không sửa file đó.
2. **Ngắn hơn:** bỏ mã `UND_ERR_*` (đã bỏ). Giữ đường nhanh trước `taoDon` (bỏ thì gửi lại phiên QR có voucher bị `VOUCHER_DANG_GIU`). Giữ ba cửa
   lỗi (móc `res.json`, `loiGhi`, bắt lỗi cuối) — tối thiểu để phủ 116 chỗ + `loiGhi` + lỗi ném thẳng. Câu lỗi thứ hai: để chủ quán chọn (#2).
3. **Lỗi thật trong kế hoạch, đã sửa:** `laCauDoc` dò "không chứa UPDATE/REPLACE" cho MỌI câu → SELECT có `updated_at` / `REPLACE()` mất thử lại;
   nay chỉ áp cho dạng `WITH`, thêm ca A2d + đột biến `VS-CAU-DOC-CHUA-TU`. A1d nay đòi RA KẾT QUẢ (không xanh oan trên gốc). Thêm B1h (trừ tài
   khoản khác), B1i (QR + voucher), B1j (QR đang tạo / lỗi), B3c, B3d (nhánh catch qua hàm thuần `viecKhiThuHong`), C1c, C2e, C2f.
   Các ca "phải KHÔNG đổi" (A2a/b, A3a, B1e, B2b–d, C1b nửa POST, C2d) xanh cả trên gốc là CHỦ Ý (K5) — vế đỏ của chúng là đột biến tương ứng.
4. **Đường song song đã thêm:** phiên QR đang gọi cổng → 503 `DANG_XU_LY` gửi lại được (không còn 409 "đã chốt"); phiên `loi` → `PAYOS_LOI`;
   quầy gửi lại cả `KHO_BAN` cho lời gọi có mã; lỗi đổi dạng không mang `cause` (địa chỉ kho không lên log qua `console.error(x, err)`);
   `upload` / `download` cùng `goiFetch`; chốt lần hai khi lần đầu đang ghi → nhánh cũ xử đúng (ghi rõ). Giới hạn ghi lại không sửa: 500 chữ cố
   định / `message: err.message` / chuỗi ghép ở `kho/duong.js`, `stock.js`, `doi-chieu.js`, `kh/loi.js` (hết lộ, nhưng không thành 503).
   Khẳng định "giao dịch ghi xếp hàng" đúng với kho file; với Turso ghi **CHƯA KIỂM** (khoá UNIQUE vẫn chặn phiên đôi).
5. **Số liệu đã chỉnh theo code:** node-fetch 2.7.0 là bản lồng trong `@libsql/isomorphic-fetch`; `taoPhien` 39-107, `chotPhien` 112-150;
   `loiGhi` nhắc ở 18 file `server/`.
