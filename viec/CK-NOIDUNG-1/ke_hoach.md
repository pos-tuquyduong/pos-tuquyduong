# CK-NOIDUNG-1 — kế hoạch (chủ quán DUYỆT a10a453, 05.11 — Q1–Q3 trả lời ở phiếu 150e7db; phần "Sau duyệt" ở cuối file thắng phần trên khi lệch)

## Nói gọn cho chủ quán
Mình làm một **sổ số hoá đơn theo ngày** dùng chung quầy + App. Lúc hiện QR, máy chủ lấy ngay số kế tiếp (ví dụ 16) và ghi nội dung CK
`TQDNOV05 HD0016` (App: `TQDNOV05 APP0016`). Tiền về → đơn mang đúng số đó, bill in to `HD0016`. QR hết hạn / huỷ → số đó nằm lại trong sổ,
Đối soát cuối ngày liệt kê "số huỷ + lý do". Mã giao dịch ngân hàng (FT…) lưu vào đơn.

**Bạn cần trả lời 3 câu ở cuối file (Q1–Q3)** — mình đã ghi đề xuất, bạn chỉ cần xác nhận.

## Hiện trạng đã đọc (lượt này)
- Nội dung CK = `'TQD' + id phiên`, giới hạn 9 ký tự chung hai cổng: `server/utils/giuCho.js:17`, `:66–67`.
- Webhook SePay tìm `TQD<số>` trong `code` rồi `content`: `server/utils/sepay.js:12`, `docBao`; khớp phiên theo `ma_payos`:
  `server/routes/thanh-toan.js` `xuLyTienVe` (câu `SELECT … WHERE ma_payos = ? AND cach = 'payos'`).
- Mã đơn sinh trong giao dịch tạo đơn = MAX+1 của `ORD-YYYYMMDD-`: `server/utils/helpers.js:29–43`, gọi ở `server/routes/orders.js:879`.
- Số bill in to = phần sau dấu `-` cuối: `server/routes/hoaDon.js:29` (`split('-').pop()`), `client/src/utils/inPhieu.js:93` (tem / phiếu pha chế),
  `client/src/components/InvoicePreview.jsx:225`; riêng `server/routes/don-mo-rong.js:19` dùng biểu thức `^ORD-\d{8}-(\d{3,})$`.
- Đơn App: `pos_don_app.ma` ngẫu nhiên `A…` (`server/utils/donApp.js` `sinhMa`), tạo phiên qua `taoPhien(…, 'app_kh')` (`donApp.js:224`).
- Chốt phiên chặn phiên hết hạn ở cả lời báo sớm (`giuCho.js:90`) lẫn câu ghi cổng (`giuCho.js:101`) — kể cả xác nhận tay.
- payOS khớp theo `orderCode` (= id phiên), nội dung chỉ để người đọc (`server/utils/payos.js` `taoQr`).

## Thiết kế (phương án đã chọn)

### 1. Sổ số hoá đơn — bước `server/nang_cap/019_so_hoa_don.js` (chỉ THÊM)
```
pos_so_hoa_don (id INTEGER PRIMARY KEY AUTOINCREMENT,   -- khoá sao lưu (BACKUP_TABLES nhận MỘT cột key)
                ngay TEXT,        -- 'YYYY-MM-DD' giờ VN (getNow)
                so INTEGER, kenh TEXT,   -- 'HD' | 'APP'
                phien_id INTEGER, order_id INTEGER, luc TEXT)
UNIQUE INDEX (ngay, so)   -- chốt cuối chống trùng số
UNIQUE INDEX (phien_id)   -- một phiên tối đa một số
pos_orders.ma_gd TEXT     -- themCot: mã giao dịch ngân hàng (SePay referenceCode / payOS reference)
```
Không thêm cột vào phiên: số của phiên tra qua `pos_so_hoa_don.phien_id`. Bảng mới vào `BACKUP_TABLES` **và** `BANG_KHONG_KHOI_PHUC`
(`server/routes/backup.js`) — khôi phục file cũ đè sổ số sẽ cấp lại số đã dùng.

### 2. Cấp số — MỘT hàm `capSoHoaDon(tx, { kenh, phienId })` trong `server/utils/helpers.js`
`INSERT INTO pos_so_hoa_don (ngay, so, kenh, phien_id, luc) SELECT ?, COALESCE(MAX(so), 0) + 1, ?, ?, ? FROM pos_so_hoa_don WHERE ngay = ?`
— một câu, trong giao dịch ghi (`db.transaction("write")`), chỉ mục UNIQUE (ngay, so) là chốt cuối. Số > 9999 trong ngày → ném (không cắt).
- **Phiên giữ số lúc tạo** (trong CÙNG giao dịch INSERT phiên ở `taoPhien`): phiên `cach = 'payos'` (QR tự xác nhận) của quầy, và MỌI phiên App.
  Phiên huỷ trong giao dịch (`kq.huy`) → số rollback cùng, không thành chỗ trống. Phiên `ck_tay` (QR tĩnh, xác nhận tay) KHÔNG giữ số — quầy
  không dùng (client chỉ gửi `payos`, `client/src/pages/BanHang/BanHangMoi.jsx:210`), nhận số lúc chốt như đơn thường.
- **Đơn không có số giữ** (tiền mặt, ví, phiên tiền mặt / tài khoản ở quầy): cấp số `HD` mới ở đúng chỗ `taoMaDonTheoSo` đang gọi
  (câu đầu giao dịch tạo đơn) → đơn chen giữa lấy số sau, không bao giờ lấy số đã giữ.
- `taoMaDonTheoSo(tx, phienId)` (đổi chữ ký, một chỗ gọi `orders.js:879`): phiên có số → dùng số đó; không → `capSoHoaDon(tx, { kenh: 'HD' })`.
  Mã đơn = `ORD-<YYYYMMDD của số>-<kenh><4 số>` (vd `ORD-20261105-HD0016`, `ORD-20261105-APP0016`) — giữ tiền tố `ORD-YYYYMMDD-` để mọi chỗ
  đọc `split('-').pop()` (hoaDon.js, inPhieu.js, InvoicePreview) tự in `HD0016` / `APP0016` không phải sửa. Đơn cũ giữ mã cũ (K5).
- Ngay sau `INSERT INTO pos_orders` (`orders.js`): `UPDATE pos_so_hoa_don SET order_id = ? WHERE id = ? AND order_id IS NULL`,
  `changes !== 1` → ném (rollback) — một số không bao giờ gắn hai đơn.
- Kênh App: `taoPhien(b, nguoi, { kenh: 'APP' })` — tham số thứ ba CHỈ `donApp.js` truyền; route `POST /thanh-toan/phien` không truyền →
  quầy không thể tự xưng kênh App bằng thân yêu cầu.
- Số ngày theo NGÀY CẤP SỐ (phiên 23:58 ngày 05, tiền về 00:03 ngày 06 → vẫn `…1105-HD00xx`): bill, sao kê, nội dung CK cùng một số.

### 3. Nội dung CK theo cổng (`giuCho.js`, `sepay.js`)
- Cổng SePay (`CONG_QR=sepay`, cổng chính): nội dung `TQD<MMM><DD> <soHd>` (MMM = JAN…DEC, ngày lấy từ `ngay` của số — giờ VN). VietQR
  trường 62/08 cho tới 25 ký tự, chuỗi dài nhất 16.
- Cổng payOS (dự phòng): GIỮ NGUYÊN nội dung `TQD<id phiên>` ≤ 9 ký tự (`giuCho.js:66–67` giữ cho nhánh payOS) — payOS khớp theo
  `orderCode`, và nhờ vậy giữ được luật "một khoản báo qua hai cổng" (SePay đọc mẫu `TQD<id>` của phiên payOS — `thu_SEPAY1` C14b/C14d).
  Phiên payOS vẫn giữ số hoá đơn và bill in số đó; chỉ nội dung CK của payOS không mang số (giới hạn 9 ký tự). `payos.js` không sửa.
- Khớp webhook SePay: `/TQD[\s._-]*([A-Z]{3})[\s._-]*(\d{2})[\s._-]*(HD|APP)[\s._-]*(\d{4})(?!\d)/i` trên `code` rồi `content`
  (chịu bỏ dấu cách, hoa / thường, dấu chấm / gạch, chữ trước sau) → dựng lại chuỗi CHUẨN `TQD<MMM><DD> <kenh><4 số>` (chữ hoa) → tra
  `SELECT * FROM pos_phien_thanh_toan WHERE noi_dung = ? AND cach = 'payos' ORDER BY id DESC LIMIT 1` (so BẰNG với cột đã lưu; không đổi
  MMM ra số tháng, không JOIN sổ số). Không khớp mẫu mới → mẫu cũ `TQD<id>` như hôm nay (phiên payOS, phiên tạo trước lúc triển khai).
- Sau khi tìm ra phiên: `t.ma = p.ma_payos` (= id phiên) — cột `pos_payos_su_kien.ma_payos` mà `daBao` (`thanh-toan.js:136`), `CO_TIEN_VE`
  (`donApp.js:254`) và Đối soát đọc giữ nguyên nghĩa. payOS tra theo `orderCode` như cũ. Mọi luật khớp (đúng số tiền, đúng hạn, không khớp
  hai lần, HMAC, tài khoản khác) không đổi một dòng.
- Câu báo `khong_phien` (`thanh-toan.js:167–168`: "không có mã TQD…", `mã TQD${d.ma}`) và Đối soát (`doiSoat.js:233` `mã ${r.ma_payos ?? '—'}`)
  ghi chuỗi khách đã gõ (`TQDNOV05 HD0016`) để khỏi mất số HD khi không khớp phiên.
- `docBao` trả thêm `maGd = referenceCode` (rỗng → null); payOS: `d.reference`.

### 4. Mã giao dịch ngân hàng
`xuLyTienVe` truyền `maGd` vào `chotPhien(…, { maGd })`; `sauGhiDon` ghi `UPDATE pos_orders SET ma_gd = ? WHERE id = ?` cùng giao dịch.
Hiện ở: chi tiết đơn (`client/src/pages/Orders.jsx`, `GET /orders/:id` đã trả `o.*` — `orders.js:149`), Đối soát (mục 5), bill (**cần Q2**).

### 5. Đối soát cuối ngày (`server/utils/doiSoat.js` + `client/src/components/DoiSoat.jsx`)
Kỳ `ngay` trả thêm `so_hd[] { so_hd, trang_thai, ly_do, ma_don, ma_gd }` cho mọi số của ngày KHÔNG thành đơn, và số thành đơn có `ma_gd`.
Lý do huỷ SUY từ phiên (một nguồn, không ghi thêm lúc hết hạn — Render ngủ, không hẹn giờ):
- `huy` → "huỷ trước khi trả" (nhân viên bấm huỷ, khách huỷ trên App, hoặc App tự huỷ khi giá đổi `GIA_DA_DOI` — `donApp.js:231`, `:245`;
  không ghi "huỷ QR" vì phiên App trả ví cũng giữ số);
- `loi` → "lỗi: <ly_do phiên>" (lỗi tạo QR để `ly_do` rỗng → "cổng QR lỗi");
- `cho` quá hạn → "QR hết hạn, chưa nhận tiền"; `cho` còn hạn → "đang chờ" (không phải huỷ);
- có báo tiền về `chua_khop` của phiên đó → thêm "tiền về muộn — xem mục CK".

Thêm phép ĐỎ: số không có cả phiên lẫn đơn ("số trống không lý do") — không xảy ra theo cách cấp, phép canh.
Giao diện: một bảng nhỏ "Số hoá đơn huỷ / chuyển khoản" dưới kết quả ngày.

### 6. Cửa App (`/api/kh`) + màn Đơn App ở quầy
- Một hàm `soHdCuaMa(code)` (helpers.js, 1 dòng `split('-').pop()`): `ORD-…-HD0016` → `HD0016`; mã cũ → `012` — đúng chuỗi bill in.
  (`hoaDon.js` có hàm cùng việc nhưng ngoài Phạm vi nên không xuất ra dùng chung được.)
- `GET /don`, `GET /don/:ma`, `POST /don` thêm `so_hd`: đơn thật → `soHdCuaMa(code)`; đơn App chưa có đơn thật → số phiên đã giữ
  (`APP0016`, JOIN `pos_so_hoa_don` trong `CAU_DON`); không có (đơn App tạo trước lúc triển khai) → `null`. `ma` / `ma_don` giữ nguyên.
- `dsQuay` thêm `so_hd`; `client/src/pages/DonApp.jsx` in `so_hd` chữ to, mã App nhỏ xám.
- `HOP_DONG_API_KH.md`: bảng cửa + phần máy đọc + nhật ký, `PHIEN_BAN` 9 → 10 (chat chỉnh lúc gộp với HANG-1); F2: sửa câu luật 4xx thành
  "mọi 4xx = chưa tạo đơn, TRỪ 401 (đăng nhập lại), 409 `KHO_BAN` (chưa rõ — gửi lại CÙNG khoá), 409 `KHOA_GUI_DA_DUNG` (mời xem Lịch sử đơn)"
  — chỉ sửa chữ; trước khi sửa đọc lại `datDon` để câu khớp code. Câu cùng nghĩa ở đầu `donApp.js` (dòng 7) sửa cùng (K4: chú thích là khẳng định).
  `cong_cu/thu_HOPDONG_KH.js` phải xanh (thêm trường vào danh sách trắng nếu bài so BẰNG — LUAT §6.7).

## Phương án A / B

| Phần | A (chọn) | B | Vì sao A |
|---|---|---|---|
| Cấp số | bảng `pos_so_hoa_don` một dòng mỗi số, INSERT…SELECT MAX+1 | bảng đếm `(ngay, so_cuoi)` + `UPDATE … RETURNING` + cột số trên phiên + bảng lý do huỷ | A: một bảng vừa cấp vừa là sổ cho Đối soát (E), không cần cột phiên / bảng huỷ; B ~+40 dòng, hai nơi giữ một sự thật |
| Lý do huỷ | suy từ trạng thái phiên lúc đọc | ghi "huỷ" vào sổ lúc huỷ / hết hạn | B cần hẹn giờ cho hết hạn (Render ngủ) hoặc ghi ở nhiều đường huỷ (K4); A một chỗ đọc |
| Mã đơn | `ORD-YYYYMMDD-HD0016` | `HD0016-…` / cột `so_hd` riêng trên đơn | A: mọi chỗ in đang `split('-').pop()` tự đúng, không đụng `hoaDon.js` (ngoài Phạm vi), không thêm cột |
| Khớp webhook | so BẰNG `noi_dung` đã lưu sau khi chuẩn hoá | tra sổ số theo (kenh, so, tháng-ngày) | A không đổi MMM ra số, không JOIN |
| Kênh App | tham số thứ ba của `taoPhien` | cột `kenh` trên phiên / suy từ `nguoi_tao = 'app_kh'` | A 1 dòng, không tin chuỗi tên người |
| payOS | giữ nội dung `TQD<id>` | nội dung = `HD0016` | B phá luật "hai cổng" (`thu_SEPAY1` C14b/C14d); A không sửa `payos.js` |

## Ước lượng
Máy chủ ~165 dòng (helpers 45 · giuCho 15 · sepay 20 · thanh-toan 20 · orders 8 · donApp 15 · kh/index 5 · doiSoat 35 · bước 019 25 ·
backup 2 · don-mo-rong 2) — dưới ngân sách 250. Giao diện ~40 (DonApp 3 · Orders 3 · DoiSoat 30) + build `dist`. Bài thử ~400.
Nếu Q1 = có: +~20 dòng máy chủ.

## Ca thử — `cong_cu/thu_CKNOIDUNG1.js` (ánh xạ 1-1 nghiệm thu)
| Nghiệm thu | Ca | Đỏ trên gốc vì |
|---|---|---|
| A | A1 phiên QR quầy nhận số `HD0001`; A2 phiên App `APP0002` (dãy chung); A3 hai phiên `Promise.all` khác số; A4 đơn tiền mặt tạo giữa hai phiên lấy số sau, không trùng số đã giữ; A5 qua 00:00 giờ VN (đổi `getNow` giả) số về 0001; A6 phiên huỷ trong giao dịch (SO_DU_KHONG_DU) không tiêu số; A7 số thứ 10000 trong ngày → ném | gốc không có số |
| B | B1 nội dung SePay quầy `TQDNOV05 HD0001` (VietQR 62/08); B2 App `… APP0002`; B3 webhook nội dung `tqdnov05hd0001`, `TQD.NOV.05-HD0001`, `CK abc TQDNOV05 HD0001 xyz` → khớp đúng phiên; B4 `…HD00011` (dính số) → không khớp; B5 sai tiền / quá hạn / báo lặp / sai chữ ký / tài khoản khác vẫn chặn như cũ; B6 payOS: description vẫn `TQD<id>` ≤ 9, phiên vẫn giữ số; B7 mẫu cũ `TQD<id>` vẫn khớp; B8 tạo phiên lúc 06:30 giờ VN (23:30 UTC hôm trước) → nội dung mang NGÀY VN; B9 không khớp phiên → dòng báo ghi chuỗi `TQDNOV05 HD0099` | gốc ghi `TQD<id>` |
| C | C1 tiền về → đơn `ORD-…-HD0001`; `so_bill` của don-mo-rong và của `dungHoaDon` (hoaDon.js) = `HD0001`; `rutGonMa` (inPhieu.js, tem / phiếu pha chế) = `HD0001`; C5 đơn App QR qua webhook → `ORD-…-APP000x`, bill / tem `APP000x`; C2 phiên hết hạn → Đối soát liệt kê số + "QR hết hạn"; C3 nhân viên huỷ → "huỷ trước khi trả"; C6 lỗi tạo QR → "cổng QR lỗi"; C7 App `GIA_DA_DOI` → "huỷ trước khi trả"; C4 (nếu Q1 = có) tiền về muộn + xác nhận tay → đơn nhận lại đúng số | gốc mã `ORD-…-001` |
| D | D1 SePay `referenceCode: FT…` → `pos_orders.ma_gd`; D2 payOS `reference` → `ma_gd`; D3 `GET /orders/:id` có `ma_gd`; D4 Đối soát có `ma_gd`; D5 (nếu Q2 = có) dữ liệu bill quầy + hoá đơn App có dòng "Mã GD" | gốc không lưu |
| E | E1 kỳ ngày: đủ số huỷ + lý do; E2 số đã thành đơn tiền mặt không liệt kê; E3 dòng sổ không phiên không đơn → ĐỎ | gốc không có |
| F | F1 `POST /don` qr → `so_hd: 'APP0003'`, `ma_don` vẫn `A…`; F2 `GET /don` / `GET /don/:ma` có `so_hd` cho đơn App đã trả, chưa trả, đơn quầy (`HD…`), đơn cũ (`012`); F5 đơn App tạo trước lúc triển khai, chưa có đơn thật → `so_hd: null`; F3 `dsQuay` có `so_hd`; F6 màn Đơn App: soi `DonApp.jsx` + `dist` có `so_hd` chữ to (bài tĩnh) + thao tác tay cho chủ quán; F4 khách A không thấy `so_hd` đơn khách B (404 như cũ) | gốc không có trường |
| F2 | thu_HOPDONG_KH xanh + một ca đọc câu luật 4xx có đủ ba ngoại lệ | gốc thiếu |
| K5 | K1 đơn tiền mặt / ví ở quầy vẫn 200, tổng tiền không đổi; K2 giữ ví + QR: số dư giữ / trả như cũ; K3 PIN sai vẫn chặn; K4 đơn cũ mã `ORD-…-NNN` đọc / in như cũ; K5 `CONG_QR=payos` vẫn tạo QR; K6 huỷ / hoàn một đơn mã mới (`ORD-…-HD0001`) chạy như đơn mã cũ; K7 điểm cộng của đơn chốt qua phiên không đổi | phải XANH cả gốc lẫn sau vá (đối chứng) |

**Ca hai người cùng bấm** (đụng tiền): A3 (hai phiên song song) + A4 + một ca hai webhook cùng nội dung song song → một đơn, một số.

**Đột biến** (`viec/CK-NOIDUNG-1/dot_bien.py`): `VS-MAX-NGOAI-GD` (cấp số ngoài giao dịch → A3 đỏ), `VS-KHONG-DOI-NGAY` (bỏ `ngay` khỏi
WHERE → A5 đỏ), `VS-REGEX-CACH` (bỏ `[\s._-]*` → B3 đỏ), `VS-REGEX-DINH-SO` (bỏ `(?!\d)` → B4 đỏ), `VS-NGAY-UTC` (ngày nội dung lấy theo
UTC → B8 đỏ), `VS-SO-MOI-KHI-CHOT` (đơn có phiên vẫn cấp số mới → C1 đỏ), `VS-KENH-TU-THAN` (lấy kênh từ `b.kenh` → ca quầy gửi
`kenh:'APP'` đỏ), `BV-SO-GIU` (bỏ giữ số ở taoPhien), `BV-MA-GD` (bỏ ghi `ma_gd`), `BV-SO-HD-APP` (bỏ `so_hd` ở cửa App),
`BV-DOI-SOAT-SO` (bỏ danh sách số huỷ). Mỗi đột biến có đối chứng.

## Đường song song phải canh (K4)
- Mọi lối chốt phiên đều qua `chotPhien` → `taoDon` (tiền mặt, tài khoản, payOS, SePay, tay) — số lấy ở `taoMaDonTheoSo`, một chỗ.
- `INSERT INTO pos_orders` chỉ ở `orders.js:920`; `taoMaDonTheoSo` chỉ gọi ở `orders.js:879`; `taoDon` chế độ `chiTinh` trả trước khi mở
  giao dịch (`orders.js:826`) nên không cấp số (agent soát grep cả `server/`).
- Mọi chỗ đọc số bill: `hoaDon.js:29`, `don-mo-rong.js:19`, `inPhieu.js:93`, `InvoicePreview.jsx:225`, App `soHdCuaMa` — chỉ `don-mo-rong.js` phải sửa.
- Bài thử cũ đọc dạng mã đơn / nội dung: `cong_cu/thu_P26c.js:1068–1083`, `cong_cu/thu_SEPAY1.js` B1, E3 — xem Q3.
- Hai cổng webhook (payOS, SePay) cùng `xuLyTienVe` → `maGd` truyền ở cả hai; luật "hai cổng" giữ nhờ payOS giữ nội dung cũ.
- Đường huỷ phiên: `/phien/:id/huy`, `donApp huyPhien`, `loi` trong `chotPhien`, lỗi tạo QR (`giuCho.js` catch) — lý do suy từ trạng thái nên không phải vá từng đường.

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
Bán tiền mặt trực tiếp `POST /orders` · phiên tiền mặt / tài khoản ở quầy · QR có giữ ví · App trả ví đủ · App QR · xác nhận tay trong hạn ·
`CONG_QR=payos` · một khoản báo qua hai cổng · đơn cũ mã cũ (Lịch sử, in lại, nhận điểm theo mã bill `POST /nhan-diem`, `GET /don/:ma` bằng
mã bill cũ) · khôi phục sao lưu các bảng không dính tiền.

## Câu hỏi cho chủ quán (dừng ở đây chờ trả lời)
- **Q1 — xác nhận tay sau khi QR hết hạn (đụng đường tiền).** Hôm nay máy chủ chặn MỌI cách chốt phiên đã hết hạn, kể cả xác nhận tay
  (`giuCho.js:90`, `:101`), nên tiền về muộn chỉ hiện ĐỎ ở Đối soát để bạn hoàn. Nghiệm thu C muốn "xác nhận tay → nhận lại số cũ".
  **Đề xuất:** cho xác nhận tay phiên QR (`payos`) đang `cho` đã quá hạn hoặc đã `huy`, chưa có đơn; vẫn quyền `xac_nhan_ck_tay` + lý do; phần
  ví giữ cũ đã nhả nên trừ lại trong giao dịch (ví thiếu → báo `SO_DU_KHONG_DU`, không tạo đơn); giá đổi → không tạo đơn như hôm nay; báo
  tiền về muộn của phiên đó chuyển từ ĐỎ sang CẦN XEM ("đã xác nhận tay sau"). Không đồng ý → bỏ vế cuối của C, tiền về muộn vẫn hoàn như cũ.
- **Q2 — in "Mã GD" trên bill:** cần thêm `server/routes/hoaDon.js` vào Phạm vi (thêm `ma_gd` vào phần `don` của `dungHoaDon`, ~1 dòng) để
  bill quầy in dòng nhỏ "Mã GD" (dòng in ở `client/src/utils/hoaDon.js`, đã trong Phạm vi). Hoá đơn trên App dựng bằng
  `server/utils/dongHoaDon.js` (chỉ dẹt các phần cố định `dau`, `tien`, `thanh_toan`, `diem`, `chan`) — muốn App cũng có dòng "Mã GD" thì thêm
  cả file này (~2 dòng). **Đề xuất:** thêm cả hai.
- **Q3 — bài thử cũ khoá dạng cũ** sẽ đỏ vì bạn đã duyệt đổi dạng: `cong_cu/thu_SEPAY1.js` (B1, E3: `62.08 = TQD<mã phiên>` của cổng SePay),
  `cong_cu/thu_P26c.js` (C1, C2: mã đơn `ORD-<ngày>-<số>` liền nhau, `-999` → `-1000`). `cong_cu/thu_P3.js` (payOS) KHÔNG phải sửa vì payOS
  giữ nội dung `TQD<id>`. **Đề xuất:** thêm hai file vào Phạm vi, sửa đúng các ca đó sang dạng mới (bài sửa thường, LUAT §6.8 — đỏ trên gốc,
  xanh sau vá, ghi `SỐ CA`). Bài khác đỏ ngoài dự kiến khi chạy `npm test` → mình ghi câu hỏi, không tự sửa.

## Soát kế hoạch (agent phụ chỉ đọc, 05.11) — đã xử lý
- Ngoài Phạm vi chưa nêu: `thu_P26c.js` (đổi dạng mã đơn) → thêm vào Q3; `thu_SEPAY1` C14b/C14d sẽ đỏ nếu payOS đổi nội dung → đổi thiết kế:
  payOS giữ `TQD<id>`; dòng "Mã GD" trên hoá đơn App cần `dongHoaDon.js` → thêm vào Q2.
- Cách ngắn hơn: payOS giữ nội dung cũ (bỏ sửa `payos.js`); khớp SePay bằng so BẰNG với `noi_dung` đã lưu → đã nhận cả hai. Đề nghị bỏ
  `soHdCuaMa`, dùng hàm của `hoaDon.js` → không nhận (`hoaDon.js` ngoài Phạm vi; hàm 1 dòng).
- Ca thiếu → đã thêm: A7, B8 (ngày VN lệch UTC), B9, C5 (App qua webhook, bill / tem), C6, C7, F5 (`so_hd` null), F6, K6, K7.
- Đường song song: gán `t.ma` = id phiên sau khi tra; câu báo `khong_phien` / Đối soát giữ chuỗi khách gõ; `ck_tay` loại trừ rõ; khoá sao lưu
  `id`; nhãn lý do huỷ không ghi "huỷ QR" cho phiên App trả ví / `GIA_DA_DOI` → đã sửa trong thiết kế. Ngày triển khai hai dãy → Phát hiện
  trong `trang_thai.md`.

## Sau duyệt (05.11) — Q1 chia hai, Q2 / Q3 CÓ, bỏ mã App khỏi ghi chú bill

### Q1a — phiên QUẦY: xác nhận tay sau khi QR hết hạn / đã huỷ
- `POST /thanh-toan/phien/:id/xac-nhan-tay` (vẫn `checkPermission('xac_nhan_ck_tay')` + lý do ≥ 3 ký tự): phiên `payos` / `ck_tay` đang `cho`
  đã quá hạn hoặc `huy`, chưa có đơn → `chotPhien(p, 'tay', { muon: true, … })`. Phiên của đơn App (có dòng `pos_don_app`) → 409
  `PHIEN_APP_KHONG_TAO_LAI` (Q1b: App không tạo lại đơn). Phiên `loi` / `da_thu` → 409 `PHIEN_DA_CHOT` như cũ.
- `chotPhien` (MỘT hàm): cờ `muon` chỉ nới điều kiện thời gian của cổng: `WHERE id = ? AND (trang_thai = 'cho' AND het_han > ? OR ? AND
  trang_thai IN ('cho', 'huy'))` — vẫn MỘT câu ghi, `changes !== 1` → 409 (hai người cùng bấm: một đơn). Đơn qua `taoDon` như mọi lối chốt:
  máy chủ tự tính lại giá (giá đổi → 400, KHÔNG tạo đơn), ví giữ cũ đã nhả nên `ghiVi(khongAm)` trừ lại TRONG giao dịch tạo đơn — thiếu →
  400 `SO_DU_KHONG_DU`, rollback, không đơn. Lần chốt muộn hỏng KHÔNG đổi phiên sang `loi` (khách nạp thêm rồi xác nhận lại được).
- Số hoá đơn: `taoMaDonTheoSo` lấy số phiên đã giữ → đơn nhận lại đúng `HD00xx`. Nhật ký đơn ghi "(sau khi QR hết hạn / huỷ)".
- Chỗ bấm: màn QR ở quầy tự quay về giỏ khi hết hạn (`client/src/pages/BanHang/ManQr.jsx:34`) và màn Bán hàng là bản vẽ đã chốt (CLAUDE.md §9)
  → nút "Xác nhận tay → tạo đơn" đặt ở **Đối soát**, trên dòng CK "tiền về sau khi QR hết hạn" / "phiên đang huy" của phiên quầy (người có quyền).
- Đối soát: báo tiền về muộn của phiên đã xác nhận tay sau đó (đúng số) → CẦN XEM thay ĐỎ. Dòng "đã xác nhận tay trước … KHÔNG hoàn" giữ ĐỎ
  (`thu_SEPAY1` D2).

### Q1b — phiên APP: tiền về muộn tự cộng vào ví khách
- `xuLyTienVe` (MỘT hàm cho payOS + SePay), SAU các chặn cũ (sai chữ ký → 4xx trước khi vào; tài khoản khác → `chua_khop`; payOS báo
  thất bại → `that_bai`): phiên của đơn App, có SĐT, đã `huy` / `cho` quá hạn (theo giờ giao dịch hoặc giờ máy chủ) — phiên `loi` (chốt hỏng vì đơn lúc tiền về đúng hạn) KHÔNG thuộc Q1b, vẫn `chua_khop` ĐỎ (ca G11) → TRONG MỘT giao dịch:
  `INSERT pos_payos_su_kien … ket_qua 'vao_vi' ON CONFLICT(khoa) DO NOTHING`; chỉ khi `changes === 1` mới `ghiVi(loai 'topup', cachTra
  'transfer', cot 'total_topup')` số tiền THẬT đã về, ghi chú "Tiền về muộn APP00xx · mã GD FT…". Báo lặp (cùng khoá) / hai báo cùng lúc →
  một dòng, cộng một lần.
- Không tạo đơn, không đổi phiên. Đối soát: `vao_vi` → CẦN XEM "tiền về muộn — đã cộng vào tài khoản <SĐT>". Tiền này vào sổ nạp ví chuyển khoản
  (két CK khớp sao kê; I4 / I18 khớp vì đi qua `ghiVi`).
- App: đơn vẫn `da_huy`, `tien_ve_cho_doi_soat: true` (giữ nghĩa cũ) + trường mới **`tien_ve_da_cong_vi`** (số đồng đã cộng vào tài khoản,
  0 khi không có) ở `GET /don`, `GET /don/:ma`. Ghi hợp đồng.

### Q2 — dòng "Mã GD"
`routes/hoaDon.js` `don.ma_gd`; `client/src/utils/hoaDon.js` thêm khoá chữ `ma_gd` ("Mã GD", ẩn được) — dòng ngay sau các dòng thanh toán khi
đơn có mã. Hoá đơn App: `dongHoaDon.js` dẹt mọi dòng `thanh_toan` theo khoá nên dòng "Mã GD" tự có (không phải sửa file này — xác nhận bằng ca D5).

### Q3 — bài cũ sửa (bài sửa thường)
`thu_SEPAY1.js` B1 (62.08 = `TQD<MMM><DD> HD<4 số>`), E3 (`… APP<4 số>`); `thu_P26c.js` C1 (hai mã `ORD-<ngày>-HD<4 số>` liền số), C2 (mã cũ
`-999` không ảnh hưởng: đơn mới vẫn `HD<4 số>`).

### Bỏ mã App khỏi ghi chú bill
`donApp.js`: ghi chú đơn = `Đơn App · nhận tại quán` (mã App vẫn ở `pos_don_app.ma`).

### Ca thử thêm (thu_CKNOIDUNG1.js)
- C4 quầy: phiên QR giữ ví, hết hạn → xác nhận tay → 200, đơn `ORD-…-HD00xx` đúng số đã giữ, ví trừ đúng phần giữ; C4b ví đã tiêu mất → 400
  `SO_DU_KHONG_DU`, không đơn, phiên vẫn chốt lại được; C4c giá đổi → 400, không đơn; C4d phiên đã huỷ → xác nhận tay được; C4e phiên App hết
  hạn → 409 `PHIEN_APP_KHONG_TAO_LAI`; C4f nhân viên không quyền → 403; C4g hai người cùng bấm → một đơn; C4h Đối soát: báo muộn của phiên đã xác
  nhận tay → CẦN XEM.
- G1 App huỷ rồi tiền SePay về → ví +đúng số đã về, một dòng `vao_vi`, không đơn, App `da_huy` + `tien_ve_da_cong_vi`; G2 báo lặp cùng khoá →
  không cộng lần hai; G3 hai báo cùng khoá song song → cộng một lần; G4 App hết hạn (không huỷ) tiền về → cộng; G5 tài khoản khác → KHÔNG cộng
  (`chua_khop`); G6 sai chữ ký → 401, không cộng; G7 phiên QUẦY hết hạn tiền về → KHÔNG cộng ví (ĐỎ như cũ); G8 Đối soát CẦN XEM "đã cộng vào
  tài khoản"; G9 payOS báo muộn cho đơn App → cộng (cùng hàm).
- Đột biến thêm: `VS-MUON-MOI-CACH` (bỏ kiểm `muon` — chốt muộn cả qua webhook), `VS-CONG-VI-HAI-LAN` (cộng ví không xét `changes`),
  `VS-CONG-VI-QUAY` (bỏ kiểm phiên App), `BV-CONG-VI` (bỏ nhánh cộng ví), `BV-XNT-MUON` (bỏ cờ muộn ở route).

## Sau duyệt lần 2 (05.11, phiếu 9229b85) — Q4, Q5 CÓ; phiên App LỖI vì đơn cũng vào ví

### Q4 — `thu_KHMUA1.js` G6, I1, I4 (bài sửa thường, đỏ trên gốc, xanh sau vá, `SỐ CA`)
- G6 nhánh "huỷ thắng": dòng báo `vao_vi`, ví 20.000 (nhả) + 50.000 (tiền QR về) — thay `chua_khop` + ví 20.000.
- I1: dòng báo `vao_vi` (thay `chua_khop`); I4: ví 20.000 + tiền QR về. I3 GIỮ NGUYÊN (chủ quán) — vẫn xanh: phiên `loi`, App `da_huy` + cờ
  `tien_ve_cho_doi_soat` (CO_TIEN_VE đếm cả `vao_vi`). Tên ca I3 còn chữ "chua_khop" → Phát hiện (không sửa, theo lời chủ quán).

### Q5 — `donThu.js`: `'pos_so_hoa_don'` vào `BANG_KHONG_DON` (dọn thử không xoá số đã cấp).

### Phiên App LỖI vì đơn → tiền thật đã về cộng vào ví khách (chủ quán — thay cách máy tự quyết ở ec477bf)
- `thanh-toan.js` `xuLyTienVe` (MỘT hàm, hai cổng), sau mọi chặn cũ (chữ ký → 4xx trước; tài khoản khác → `chua_khop`; payOS thất bại):
  - MỘT vị từ `vaoViDuoc(phiên)`: `huy` · `loi` · `cho` quá hạn. MỘT hàm `vaoVi(phiên)`: dòng báo `vao_vi` + `ghiVi` cùng giao dịch, cộng chỉ khi
    `changes === 1` (một lần mỗi báo tiền — `khoa` UNIQUE như cũ).
  - Trước chốt: phiên App `vaoViDuoc` → `vaoVi` (gồm phiên đã `loi` từ trước — ca G11 đổi chiều: nay cộng ví).
  - Sau chốt hỏng (4xx vì đơn — `chotPhien` vừa đổi phiên sang `loi`; hoặc phiên vừa huỷ / hết hạn giữa chừng): phiên App → ĐỌC LẠI phiên,
    `vaoViDuoc` → `vaoVi`. Đơn chốt được thì dòng `khop` đã ghi cùng khoá → `vaoVi` không cộng (`changes 0`). 5xx / `KHO_BAN` → như cũ.
  - Lý do dòng báo: `<đầu> — đã cộng vào tài khoản <SĐT> (<APP số>) · mã GD <FT…>`; đầu = `tiền về muộn` | `không tạo được đơn (<lý do phiên>)`.
    `LY_DO_VAO_VI` (congQr.js) = `đã cộng vào tài khoản`. Phiên QUẦY `loi` → `chua_khop` ĐỎ như cũ (không cộng ví).
- App (`donApp.js` `tomDon`): trường mới **`thong_bao_tien_ve`** (chuỗi | null) ở `GET /don`, `GET /don/:ma`: phiên `loi` →
  `Không tạo được đơn <lý do ngắn> — đã cộng <số tiền> vào tài khoản của bạn`; huỷ / hết hạn → `Tiền về sau khi đơn đã huỷ / hết hạn — đã cộng …`.
  Lý do ngắn: MỘT bảng `LY_DO_NGAN` (hết hàng / ngừng bán · số dư · giá · mã giảm) đọc từ `ly_do` phiên, còn lại "vì đơn không còn hợp lệ" —
  không đưa lời lỗi nội bộ (số tồn kho) ra App. Hợp đồng: thêm trường + nhật ký trong mục v10 (cùng PR).
- Quầy: `dsQuay` (GET /api/pos/kh/don-app — cửa quầy, không thuộc hợp đồng App) thêm dòng `tien_trinh: 'vao_vi'` cho mỗi báo `vao_vi` HÔM NAY
  (id `vao_vi:<id báo>`, `so_hd`, `so_tien`, `ly_do` = lý do dòng báo, `ten_khach`, `mon: []`); `DonAppNoi.jsx` (nút nổi mọi màn) thêm
  "· n vào ví" + chuông kêu khi có dòng mới; `DonApp.jsx` hiện khung vàng "💰 APP0016 · Khách · 25.000đ — <lý do>", không nút Đang làm / Xong.
- Đối soát: dòng CK `vao_vi` CẦN XEM (đã có) — mô tả nay đủ lý do, số HD, số tiền, mã GD.
- Ca thử (`thu_CKNOIDUNG1.js` mục [L] + G11 đổi chiều): L1 phiên App QR đúng hạn, món ngừng bán, SePay báo đúng tiền → `vao_vi`, phiên `loi`,
  không đơn, ví +25.000; L2 dòng ví ghi "Không tạo được đơn" + APP<số> + mã GD; L3 App `da_huy` + `tien_ve_da_cong_vi` + `thong_bao_tien_ve` đúng
  nguyên câu (chi tiết + danh sách); L4 báo lặp → không cộng lần hai; L5 hai báo CÙNG khoá cùng lúc trên phiên đúng hạn hỏng đơn → cộng một lần;
  L6 báo KHÁC (khoản thứ hai) vào phiên `loi` → cộng thêm; L7 tài khoản khác → `chua_khop`, sai chữ ký → 401, không cộng; L8 quầy thấy dòng
  `vao_vi` (so_hd, so_tien, lý do, mã GD), không đếm là đơn "Mới", không bấm Đang làm được; L9 Đối soát CẦN XEM có lý do + APP<số> + 25.000 +
  mã GD, không ĐỎ; L10 phiên QUẦY hỏng đơn lúc tiền về → `chua_khop`, KHÔNG cộng ví; L11 payOS cùng đường; L12 thông báo huỷ (G1) "Tiền về sau
  khi đơn đã huỷ / hết hạn — …"; L13 `DonApp.jsx`, `DonAppNoi.jsx` + `dist` có `vao_vi`.
- Đột biến: bỏ `VS-cong-vi-ca-loi` (nay là hành vi đúng); thêm `BV-cong-vi-loi`, `BV-cong-vi-sau-chot`, `VS-cong-vi-sau-chot-quay`,
  `BV-thong-bao-app`, `VS-ly-do-noi-bo`, `BV-quay-vao-vi`, `BV-ma-gd-doi-soat`, `BV-dist-vao-vi`.
- Luồng hợp lệ KHÔNG bị chặn: App QR trả đúng hạn → đơn (KHMUA1 H1); phiên quầy / App chốt thường; Q1a xác nhận tay phiên quầy; báo lệch tiền
  phiên App đang `cho` còn hạn → `chua_khop`, phiên vẫn chờ (KHMUA1 I2).
