# CK-NOIDUNG-1 — kế hoạch (chờ chủ quán duyệt)

## Nói gọn cho chủ quán
Mình làm một **sổ số hoá đơn theo ngày** dùng chung quầy + App. Lúc hiện QR, máy chủ lấy ngay số kế tiếp (ví dụ 16) và ghi nội dung CK
`TQDNOV05 HD0016` (App: `TQDNOV05 APP0016`). Tiền về → đơn mang đúng số đó, bill in to `HD0016`. QR hết hạn / huỷ → số đó nằm lại trong sổ,
Đối soát cuối ngày liệt kê "số huỷ + lý do". Mã giao dịch ngân hàng (FT…) lưu vào đơn.

**Bạn cần trả lời 3 câu ở cuối file (Q1–Q3)** — mình đã ghi đề xuất, bạn chỉ cần xác nhận.

## Hiện trạng đã đọc (lượt này)
- Nội dung CK = `'TQD' + id phiên`, giới hạn 9 ký tự chung hai cổng: `server/utils/giuCho.js:17`, `:66–67`.
- Webhook SePay tìm `TQD<số>` trong `code` rồi `content`: `server/utils/sepay.js:12`, `docBao` `:32–38`; khớp phiên theo `ma_payos`:
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
pos_so_hoa_don (ngay TEXT  -- 'YYYY-MM-DD' giờ VN (getNow)
                so INTEGER, kenh TEXT  -- 'HD' | 'APP'
                phien_id INTEGER, order_id INTEGER, luc TEXT,
                PRIMARY KEY (ngay, so))
UNIQUE INDEX (phien_id)   -- một phiên tối đa một số
pos_orders.ma_gd TEXT     -- themCot: mã giao dịch ngân hàng (SePay referenceCode / payOS reference)
```
Không thêm cột vào phiên: số của phiên tra qua `pos_so_hoa_don.phien_id`. Bảng mới vào `BACKUP_TABLES` **và** `BANG_KHONG_KHOI_PHUC`
(`server/routes/backup.js`) — khôi phục file cũ đè sổ số sẽ cấp lại số đã dùng.

### 2. Cấp số — MỘT hàm `capSoHoaDon(tx, { kenh, phienId })` trong `server/utils/helpers.js`
`INSERT INTO pos_so_hoa_don (ngay, so, kenh, phien_id, luc) SELECT ?, COALESCE(MAX(so), 0) + 1, ?, ?, ? FROM pos_so_hoa_don WHERE ngay = ?`
— một câu, trong giao dịch ghi (`db.transaction("write")`), khoá chính (ngay, so) là chốt cuối. Số > 9999 trong ngày → ném (không cắt).
- **Phiên giữ số lúc tạo** (trong CÙNG giao dịch INSERT phiên ở `taoPhien`): phiên `cach = 'payos'` (QR tự xác nhận) của quầy, và MỌI phiên App.
  Phiên huỷ trong giao dịch (`kq.huy`) → số rollback cùng, không thành chỗ trống.
- **Đơn không có số giữ** (tiền mặt, ví, phiên tiền mặt / tài khoản ở quầy): cấp số `HD` mới ở đúng chỗ `taoMaDonTheoSo` đang gọi
  (câu đầu giao dịch tạo đơn) → đơn chen giữa lấy số sau, không bao giờ lấy số đã giữ.
- `taoMaDonTheoSo(tx, phienId)` (đổi chữ ký, một chỗ gọi `orders.js:879`): phiên có số → dùng số đó; không → `capSoHoaDon(tx, { kenh: 'HD' })`.
  Mã đơn = `ORD-<YYYYMMDD của số>-<kenh><4 số>` (vd `ORD-20261105-HD0016`, `ORD-20261105-APP0016`) — giữ tiền tố `ORD-YYYYMMDD-` để mọi chỗ
  đọc `split('-').pop()` (hoaDon.js, inPhieu.js, InvoicePreview) tự in `HD0016` / `APP0016` không phải sửa. Đơn cũ giữ mã cũ (K5).
- Ngay sau `INSERT INTO pos_orders` (`orders.js`): `UPDATE pos_so_hoa_don SET order_id = ? WHERE ngay = ? AND so = ? AND order_id IS NULL`,
  `changes !== 1` → ném (rollback) — một số không bao giờ gắn hai đơn.
- Kênh App: `taoPhien(b, nguoi, { kenh: 'APP' })` — tham số thứ ba CHỈ `donApp.js` truyền; route `POST /thanh-toan/phien` không truyền →
  quầy không thể tự xưng kênh App bằng thân yêu cầu.
- Số ngày theo NGÀY CẤP SỐ (phiên 23:58 ngày 05, tiền về 00:03 ngày 06 → vẫn `…1105-HD00xx`): bill, sao kê, nội dung CK cùng một số.

### 3. Nội dung CK theo cổng (`sepay.js`, `payos.js`, bỏ giới hạn chung ở `giuCho.js`)
- Mỗi cổng xuất `noiDungCk(ngay, soHd)`:
  - SePay: `TQD<MMM><DD> <soHd>` (MMM = JAN…DEC từ `ngay` giờ VN) — VietQR trường 62/08 cho tới 25 ký tự, chuỗi dài nhất 16.
  - payOS (dự phòng): chỉ `<soHd>` (`HD0016` 6 ký tự, `APP0016` 7) — vừa giới hạn 9 ký tự; payOS khớp theo `orderCode` nên không cần ngày.
- `NOI_DUNG_TOI_DA` + `MA_PHIEN_QUA_DAI` (`giuCho.js:17`, `:67`) bỏ — nội dung không còn phụ thuộc id phiên. `ma_payos` vẫn = id phiên.
- Khớp webhook SePay: `/TQD[\s._-]*([A-Z]{3})[\s._-]*(\d{2})[\s._-]*(HD|APP)[\s._-]*(\d{4})(?!\d)/i` trên `code` rồi `content`
  (chịu bỏ dấu cách, hoa / thường, dấu chấm / gạch, chữ trước sau). Khớp → tra `pos_so_hoa_don` theo (kenh, so, `substr(ngay, 6) = 'MM-DD'`)
  lấy ngày mới nhất có `phien_id` → phiên → `xuLyTienVe` như cũ (đúng số tiền, đúng hạn, không khớp hai lần, HMAC không đổi một dòng).
  Không khớp mẫu mới → thử mẫu cũ `TQD<id>` (phiên tạo trước lúc triển khai, sống ≤ 10 phút) — 1 dòng.
- `docBao` trả thêm `maGd = referenceCode` (rỗng → null); payOS: `d.reference`.

### 4. Mã giao dịch ngân hàng
`xuLyTienVe` truyền `maGd` vào `chotPhien(…, { maGd })`; `sauGhiDon` ghi `UPDATE pos_orders SET ma_gd = ? WHERE id = ?` cùng giao dịch.
Hiện ở: chi tiết đơn (`client/src/pages/Orders.jsx`, `GET /orders/:id` đã trả `o.*`), Đối soát (mục 5), bill (**cần Q2**).

### 5. Đối soát cuối ngày (`server/utils/doiSoat.js` + `client/src/components/DoiSoat.jsx`)
Kỳ `ngay` trả thêm `so_hd[] { so_hd, trang_thai, ly_do, ma_don, ma_gd }` cho mọi số của ngày KHÔNG thành đơn, và số thành đơn có `ma_gd`.
Lý do huỷ SUY từ phiên (một nguồn, không ghi thêm lúc hết hạn — Render ngủ, không hẹn giờ): `huy` → "huỷ QR", `loi` → "lỗi: <ly_do phiên>",
`cho` quá hạn → "QR hết hạn, chưa nhận tiền", `cho` còn hạn → "đang chờ" (không phải huỷ); có báo tiền về `chua_khop` của phiên đó → thêm
"tiền về muộn — xem mục CK". Thêm phép ĐỎ: số không có cả phiên lẫn đơn ("số trống không lý do") — không xảy ra theo cách cấp, phép canh.
Giao diện: một bảng nhỏ "Số hoá đơn huỷ / chuyển khoản" dưới kết quả ngày.

### 6. Cửa App (`/api/kh`) + màn Đơn App ở quầy
- Một hàm `soHdCuaMa(code)` (helpers.js): `ORD-…-HD0016` → `HD0016`; mã cũ → phần cuối (`012`) — đúng chuỗi bill in.
- `GET /don`, `GET /don/:ma`, `POST /don` thêm `so_hd`: đơn thật → `soHdCuaMa(code)`; đơn App chưa có đơn thật → số phiên đã giữ
  (`APP0016`, JOIN `pos_so_hoa_don` trong `CAU_DON`); không có → `null`. `ma` / `ma_don` giữ nguyên.
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
| Kênh App | tham số thứ ba của `taoPhien` | cột `kenh` trên phiên / suy từ `nguoi_tao = 'app_kh'` | A 1 dòng, không tin chuỗi tên người |
| payOS | nội dung = `HD0016` | bỏ hẳn payOS | phiếu yêu cầu giữ dự phòng |

## Ước lượng
Máy chủ ~170 dòng (helpers 45 · giuCho 15 · sepay 20 · payos 3 · thanh-toan 15 · orders 8 · donApp 15 · kh/index 5 · doiSoat 35 · bước 019 25 ·
backup 2 · don-mo-rong 2) — dưới ngân sách 250. Giao diện ~40 (DonApp 3 · Orders 3 · DoiSoat 30) + build `dist`. Bài thử ~400.
Nếu Q1 = có: +~20 dòng máy chủ.

## Ca thử — `cong_cu/thu_CKNOIDUNG1.js` (ánh xạ 1-1 nghiệm thu)
| Nghiệm thu | Ca | Đỏ trên gốc vì |
|---|---|---|
| A | A1 phiên QR quầy nhận số `HD0001`; A2 phiên App `APP0002` (dãy chung); A3 hai phiên `Promise.all` khác số; A4 đơn tiền mặt tạo giữa hai phiên lấy số sau, không trùng số đã giữ; A5 qua 00:00 giờ VN (đổi `getNow` giả) số về 0001; A6 phiên huỷ trong giao dịch (SO_DU_KHONG_DU) không tiêu số | gốc không có số |
| B | B1 nội dung SePay quầy `TQDNOV05 HD0001` (VietQR 62/08); B2 App `… APP0002`; B3 webhook nội dung `tqdnov05hd0001`, `TQD.NOV.05-HD0001`, `CK abc TQDNOV05 HD0001 xyz` → khớp đúng phiên; B4 `…HD00011` (dính số) → không khớp; B5 sai tiền / quá hạn / báo lặp / sai chữ ký vẫn chặn như cũ; B6 payOS: description = `HD0001` ≤ 9; B7 mẫu cũ `TQD<id>` vẫn khớp | gốc ghi `TQD<id>` |
| C | C1 tiền về → đơn `ORD-…-HD0001`, `so_bill` (don-mo-rong) = `HD0001`; C2 phiên hết hạn → Đối soát liệt kê số + "QR hết hạn"; C3 huỷ → "huỷ QR"; C4 (nếu Q1 = có) tiền về muộn + xác nhận tay → đơn nhận lại đúng số | gốc mã `ORD-…-001` |
| D | D1 SePay `referenceCode: FT…` → `pos_orders.ma_gd`; D2 payOS `reference` → `ma_gd`; D3 `GET /orders/:id` có `ma_gd`; D4 Đối soát có `ma_gd`; D5 (nếu Q2 = có) dữ liệu bill có `ma_gd` | gốc không lưu |
| E | E1 kỳ ngày: đủ số huỷ + lý do; E2 số đã thành đơn tiền mặt không liệt kê; E3 dòng sổ không phiên không đơn → ĐỎ | gốc không có |
| F | F1 `POST /don` qr → `so_hd: 'APP0003'`, `ma_don` vẫn `A…`; F2 `GET /don` / `GET /don/:ma` có `so_hd` cho đơn App đã trả, chưa trả, đơn quầy (`HD…`), đơn cũ (`012`); F3 `dsQuay` có `so_hd`; F4 khách A không thấy `so_hd` đơn khách B (403/404 như cũ) | gốc không có trường |
| F2 | thu_HOPDONG_KH xanh + một ca đọc câu luật 4xx có đủ ba ngoại lệ | gốc thiếu |
| K5 | K1 đơn tiền mặt / ví ở quầy vẫn 200, tổng tiền không đổi; K2 giữ ví + QR: số dư giữ / trả như cũ; K3 PIN sai vẫn chặn; K4 đơn cũ mã `ORD-…-NNN` đọc / in như cũ; K5 `CONG_QR=payos` vẫn tạo QR | phải XANH cả gốc lẫn sau vá (đối chứng) |

**Ca hai người cùng bấm** (đụng tiền): A3 (hai phiên song song) + A4 + một ca hai webhook cùng nội dung song song → một đơn, một số.

**Đột biến** (`viec/CK-NOIDUNG-1/dot_bien.py`): `VS-MAX-NGOAI-GD` (cấp số ngoài giao dịch → A3 đỏ), `VS-KHONG-DOI-NGAY` (bỏ `ngay` khỏi
WHERE → A5 đỏ), `VS-REGEX-CACH` (bỏ `[\s._-]*` → B3 đỏ), `VS-REGEX-DINH-SO` (bỏ `(?!\d)` → B4 đỏ), `VS-SO-MOI-KHI-CHOT` (đơn có phiên vẫn cấp số
mới → C1 đỏ), `VS-KENH-TU-THAN` (lấy kênh từ `b.kenh` → ca quầy gửi `kenh:'APP'` đỏ), `BV-SO-GIU` (bỏ giữ số ở taoPhien), `BV-MA-GD`
(bỏ ghi `ma_gd`), `BV-SO-HD-APP` (bỏ `so_hd` ở cửa App), `BV-DOI-SOAT-SO` (bỏ danh sách số huỷ). Mỗi đột biến có đối chứng.

## Đường song song phải canh (K4)
- Mọi lối chốt phiên đều qua `chotPhien` → `taoDon` (tiền mặt, tài khoản, payOS, SePay, tay) — số lấy ở `taoMaDonTheoSo`, một chỗ.
- Mọi chỗ đọc số bill: `hoaDon.js:29`, `don-mo-rong.js:19`, `inPhieu.js:93`, `InvoicePreview.jsx:225`, App `soHdCuaMa` — chỉ `don-mo-rong.js` phải sửa.
- Hai cổng webhook (payOS, SePay) cùng `xuLyTienVe` → `maGd` truyền ở cả hai.
- Đường huỷ phiên: `/phien/:id/huy`, `donApp huyPhien`, `loi` trong `chotPhien`, lỗi tạo QR (`giuCho.js` catch) — lý do suy từ trạng thái nên không phải vá từng đường.
- `taoDon` chế độ `chiTinh` (tạo phiên, `/tinh-thu`) KHÔNG được cấp số (trả trước khi mở giao dịch — đọc lại khi sửa).

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
Bán tiền mặt trực tiếp `POST /orders` · phiên tiền mặt / tài khoản ở quầy · QR có giữ ví · App trả ví đủ · App QR · xác nhận tay trong hạn ·
`CONG_QR=payos` · đơn cũ mã cũ (Lịch sử, in lại, nhận điểm theo mã bill `POST /nhan-diem`, `GET /don/:ma` bằng mã bill cũ) · khôi phục sao lưu
các bảng không dính tiền.

## Câu hỏi cho chủ quán (dừng ở đây chờ trả lời)
- **Q1 — xác nhận tay sau khi QR hết hạn (đụng đường tiền).** Hôm nay máy chủ chặn MỌI cách chốt phiên đã hết hạn, kể cả xác nhận tay
  (`giuCho.js:90`, `:101`), nên tiền về muộn chỉ hiện ĐỎ ở Đối soát để bạn hoàn. Nghiệm thu C muốn "xác nhận tay → nhận lại số cũ".
  **Đề xuất:** cho xác nhận tay phiên QR (`payos`) đang `cho` đã quá hạn hoặc đã `huy`, chưa có đơn; vẫn quyền `xac_nhan_ck_tay` + lý do; phần
  ví giữ cũ đã nhả nên trừ lại trong giao dịch (ví thiếu → báo `SO_DU_KHONG_DU`, không tạo đơn); giá đổi → không tạo đơn như hôm nay; báo
  tiền về muộn của phiên đó chuyển từ ĐỎ sang CẦN XEM ("đã xác nhận tay sau"). Không đồng ý → bỏ vế cuối của C, tiền về muộn vẫn hoàn như cũ.
- **Q2 — in "Mã GD" trên bill:** cần thêm `server/routes/hoaDon.js` vào Phạm vi (thêm `ma_gd` vào phần `don` của `dungHoaDon`, ~1 dòng)
  để bill quầy in dòng nhỏ "Mã GD". **Đề xuất:** thêm. (Hoá đơn trên App lấy cùng hàm; dòng in là ở `client/src/utils/hoaDon.js`, đã trong Phạm vi.)
- **Q3 — hai bài thử cũ khoá dạng nội dung cũ** sẽ đỏ vì bạn đã duyệt đổi dạng: `cong_cu/thu_SEPAY1.js` (B1, E3: `62.08 = TQD<mã phiên>`),
  `cong_cu/thu_P3.js` (A1: description `TQD<mã phiên>`; A5: `MA_PHIEN_QUA_DAI`). **Đề xuất:** thêm hai file vào Phạm vi, sửa đúng các ca đó
  sang dạng mới (bài sửa thường, LUAT §6.8 — đỏ trên gốc, xanh sau vá, ghi `SỐ CA`). Bài khác đỏ ngoài dự kiến khi chạy `npm test` → mình
  ghi câu hỏi, không tự sửa.
