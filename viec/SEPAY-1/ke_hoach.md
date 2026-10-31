# SEPAY-1 — kế hoạch (chờ chủ quán duyệt)

Lập 31.10.2026 trên `912576e` (PHIEU: SEPAY-1). Mọi số dòng dưới đây đọc trong lượt này.

## 0. Điều CHƯA đọc được — phải có trước khi viết code

Phiếu dặn máy ĐỌC LẠI tài liệu `developer.sepay.vn` trước khi lập kế hoạch. Máy mây **không vào được**: `developer.sepay.vn` và
`docs.sepay.vn` báo `ENOTFOUND` (mạng của môi trường chặn hai tên miền này). Vì vậy các chi tiết sau **chưa đọc**, kế hoạch để
dạng "chờ tài liệu", KHÔNG viết theo trí nhớ:

| Chi tiết | Vì sao cần | Chỗ trong code |
|---|---|---|
| Tên header chữ ký + header mốc giờ của chế độ HMAC-SHA256 | kiểm báo | `sepay.js kiemBao` |
| Chuỗi được ký (nguyên thân? `mốc giờ + "." + thân`?), dạng chữ ký (hex / base64, có tiền tố `sha256=`?), đơn vị mốc giờ (giây / ms) | kiểm báo | `sepay.js kiemBao` |
| Tên trường thân báo (mã giao dịch, chiều tiền vào/ra, số tiền, mã thanh toán, nội dung, giờ giao dịch + múi giờ) | ghi `pos_payos_su_kien`, khớp phiên | `sepay.js docBao` |
| Câu trả SePay coi là "đã nhận" (mã HTTP 200/201? thân `{"success":true}`?) và cách gửi lại | không để SePay gửi lại vô hạn / không bỏ sót | route webhook |

→ Xem `trang_thai.md` mục `## Câu hỏi` (Q1). Phần còn lại của kế hoạch không phụ thuộc các chi tiết này: chúng nằm gọn trong
MỘT hàm `docBao` + MỘT hàm `kiemBao` của `server/utils/sepay.js`, bài thử ký báo bằng công thức viết riêng trong bài.

## 1. Hiện trạng (đã đọc)

- `server/utils/payos.js:1-52` — `daCauHinh`, `kiemChuKy(data, chuKy)`, `taoLink → { qr, checkout_url }` (gọi mạng payOS).
- `server/utils/giuCho.js:18` `CACH = ['payos', …]`; `:35` thiếu khoá → 503 `PAYOS_CHUA_CAU_HINH`; `:64-67` nội dung `TQD<id>` ≤ 9 ký tự,
  `ma_payos = id`; `:72-83` gọi `payos.taoLink`, lỗi → phiên `loi` + 502 `PAYOS_LOI`; `:88-120` `chotPhien` — mọi lối chốt.
- `server/routes/thanh-toan.js:111-139` webhook payOS: chữ ký → khoá `orderCode:reference` → `khong_phien` / `that_bai` / `chua_khop`
  (lệch tiền, về sau hết hạn, đã chốt tay "KHÔNG hoàn", phiên đang …) / `khop` (ghi TRONG giao dịch chốt qua `suKien`). 5xx / `KHO_BAN` →
  trả lỗi, chưa ghi.
- `server/index.js:64` `express.json` dùng chung (thân thô đã mất khi tới route) · `:126` mount `/api/payos/webhook`.
- `server/database.js:999-1008` `pos_payos_su_kien (khoa UNIQUE, ma_payos, so_tien, ket_qua, ly_do, du_lieu, luc)`.
- `server/utils/doiSoat.js:229-233` `phepTienVe` đọc `chua_khop` / `khong_phien`, câu viết cứng "payOS mã …".
- `server/utils/donApp.js:36` `qr`/`vi_qr` → `cach: 'payos'`; `:253` `tien_ve_cho_doi_soat` = có dòng `chua_khop` cùng `ma_payos`.
- Cột `nguon` của phiên chỉ được ĐỌC so với `'tay'` (`doiSoat.js:238`, `thanh-toan.js:133`) — grep `nguon` trong `server/`.
- Chữ "payOS" người dùng thấy ở `client/src/pages/BanHang/`: grep chỉ ra **chú thích** (`ThuTien.jsx:2`, `ManQr.jsx:2-3`), không có chữ
  hiện màn hình. Lời báo người dùng thấy đến từ máy chủ (`giuCho.js:35,81`).

## 2. Thiết kế

**Ý chính:** giữ nguyên `cach = 'payos'` trong CSDL và hợp đồng App (nghĩa nội bộ: "QR tự xác nhận") — đổi tên là đổi hợp đồng + dữ liệu
cũ, bị Cấm. Thêm MỘT chỗ chọn cổng; phiên, chốt, đối soát dùng nguyên.

### Phần 1 — Công tắc + tạo QR

- **A (chọn):** `server/utils/congQr.js` (~25 dòng): đọc `CONG_QR` (`sepay` | `payos`), trả đối tượng cổng `{ ten, daCauHinh(), taoQr({ id,
  soTien, noiDung, hetGiay }) → { qr, checkout_url } }`. `giuCho.js` đổi 3 chỗ: `:35` hỏi `congQr().daCauHinh()`, `:74` gọi
  `congQr().taoQr(...)`, câu `error` bỏ chữ "payOS" (giữ `code`). Giá trị lạ của `CONG_QR` → coi như chưa cấu hình (503), không đoán.
- B: rải `if (process.env.CONG_QR === 'sepay')` trong `giuCho.js` + `thanh-toan.js` — ít file hơn nhưng trái nghiệm thu A ("một chỗ duy nhất").
- **Mặc định khi KHÔNG đặt `CONG_QR`: `payos`** (đề xuất — chủ quán xác nhận khi duyệt). Lý do: gộp xong mà chưa kịp điền khoá SePay thì quầy
  vẫn chạy payOS như hôm nay; bật SePay là một việc chủ động (điền khoá + đặt `CONG_QR=sepay`). Ghi rõ trong `cai_dat_sepay.md`.
- `server/utils/vietQr.js` (~45 dòng, hàm thuần): dựng chuỗi EMVCo MPM theo chuẩn VietQR NAPAS — `00` = `01`, `01` = `12` (QR động, có số
  tiền), `38` = { `00` `A000000727`, `01` = { `00` BIN, `01` số TK }, `02` `QRIBFTTA` }, `53` `704`, `54` số tiền, `58` `VN`, `62` = { `08` nội
  dung }, `63` CRC-16/CCITT-FALSE (đa thức 0x1021, khởi 0xFFFF) trên cả chuỗi kèm `6304`. Đây là chuẩn ngân hàng, không phải tài liệu SePay —
  bài thử kiểm CRC bằng công thức viết riêng + một chuỗi mẫu tính tay.
- `server/utils/sepay.js` (~55 dòng): `daCauHinh()` = đủ `SEPAY_BIN`, `SEPAY_SO_TK`, `SEPAY_KHOA_WEBHOOK` (đọc lúc gọi, không log);
  `taoQr` = `vietQr.dung(...)` → `{ qr, checkout_url: null }`, không gọi mạng → bỏ hẳn nhánh 502 với SePay; `kiemBao(headers, thanThô, bây
  giờ)` và `docBao(than) → { khoa: 'sepay:<mã GD>', vao, soTien, ma, luc, duLieu }` — **chờ tài liệu (mục 0)**.
- `payos.js`: thêm `taoQr` bọc `taoLink` (3 dòng) để hai cổng cùng dạng; KHÔNG xoá gì.
- Nội dung CK vẫn `TQD<id>` ≤ 9 ký tự (giữ `NOI_DUNG_TOI_DA`, chung cho cả hai cổng).

### Phần 2 — Webhook SePay

- **A (chọn):** route mới `POST /api/sepay/webhook` trong `thanh-toan.js` (export `webhookSepay`), mount ở `index.js` **TRƯỚC** dòng 64 với
  `express.raw({ type: '*/*', limit: '100kb' })` — HMAC phải ký trên thân THÔ; `express.json` chạy sau sẽ thấy thân đã đọc và bỏ qua.
  Logic tách hàm chung với webhook payOS: `xuLyTienVe({ khoa, maPhien, soTien, luc, duLieu, nguon })` (đoạn `:121-135` hiện tại dời vào
  hàm, payOS gọi y như cũ) → hai webhook dùng **cùng** nhánh `khong_phien` / `chua_khop` / `khop` / 5xx — một vị từ, không hai bản chép (K4).
- B: chép nguyên `:111-139` sang webhook SePay — ~30 dòng chép, hai bản sẽ lệch nhau. Loại.
- Thứ tự trong webhook SePay: (1) `kiemBao` sai / thiếu chữ ký / mốc giờ lệch > 5 phút (cả quá khứ lẫn tương lai) → 401, KHÔNG ghi gì;
  (2) tiền ra hoặc không có mã `TQD\d+` → ghi `khong_phien` (khoá `sepay:<mã GD>`), trả "đã nhận"; (3) còn lại → `xuLyTienVe`
  (`ma_payos = <số sau TQD>`, `cach = 'payos'`). Lỗi máy / `KHO_BAN` → trả lỗi, chưa ghi → SePay gửi lại.
- Mã thanh toán: tìm `TQD(\d{1,6})` trong trường mã SePay tách sẵn, không có thì trong nội dung (khách thêm chữ quanh mã vẫn khớp; khách
  xoá / sửa mã → `khong_phien` → Đối soát, quầy xác nhận tay — đúng phiếu).
- `nguon` khi chốt: `'sepay'` (payOS vẫn `'payos'`). Không chỗ nào đọc `nguon = 'payos'` (grep mục 1) → không vỡ gì.
- **Chống trùng:** khoá `sepay:<mã GD>` khác hẳn khoá payOS (`<orderCode>:<reference>`) → không đụng nhau trong cột UNIQUE sẵn có.
- **Hai báo cùng lúc (ca hai người cùng bấm):** hai báo cùng mã GD → cổng thật là `UPDATE … WHERE trang_thai = 'cho'` trong `chotPhien` +
  `ON CONFLICT(khoa) DO NOTHING` — có sẵn, bài thử bắn song song bằng `Promise.all`, đúng một đơn.

### Phần 3 — Đối soát (nghiệm thu D)

- `doiSoat.js:229-233`: thêm `khoa` vào SELECT; nguồn = `khoa` bắt đầu `sepay:` ? `SePay` : `payOS` → câu `"<nguồn> mã …"`. Cùng bảng, cùng
  loại dòng. **Không đổi CSDL** (không bước 008): nguồn suy ra từ tiền tố `khoa` đã có — dữ liệu payOS cũ tự hiện "payOS".
- `donApp.js:253` (`tien_ve_cho_doi_soat`) so theo `ma_payos` — SePay cũng ghi `ma_payos` → tự đúng, KHÔNG sửa (ngoài Phạm vi, không cần).

### Phần 4 — Chữ người dùng thấy, hợp đồng, cài đặt

- Câu `error` của `PAYOS_CHUA_CAU_HINH` / `PAYOS_LOI` bỏ chữ "payOS" (giữ `code`, giữ HTTP). `HOP_DONG_API_KH.md`: sửa lời mô tả
  ("QR payOS" → "QR chuyển khoản"), tăng `PHIEN_BAN`, ghi nhật ký — KHÔNG đổi trường / mã (LUAT §2).
- `client/src/pages/BanHang/ThuTien.jsx`: chỉ có chữ "payOS" trong chú thích dòng 2 → sửa chú thích; không cần build lại (`dist` không đổi
  vì chú thích bị bỏ khi build — kiểm bằng `--day-du`). Nếu build sinh khác → commit `client/dist/`.
- `env.example`: thêm khối `CONG_QR`, `SEPAY_BIN`, `SEPAY_SO_TK`, `SEPAY_KHOA_WEBHOOK` (chỉ tên + ý nghĩa, trống giá trị).
- `viec/SEPAY-1/cai_dat_sepay.md` (nghiệm thu F).

## 3. Ngân sách ước lượng

| File | Dòng (±) |
|---|---|
| `server/utils/vietQr.js` (mới) | +45 |
| `server/utils/sepay.js` (mới) | +55 |
| `server/utils/congQr.js` (mới) | +25 |
| `server/utils/payos.js` | +4 |
| `server/utils/giuCho.js` | ~8 sửa |
| `server/routes/thanh-toan.js` | +35 (hàm chung + webhook SePay), −15 (dời) |
| `server/index.js` | +2 |
| `server/utils/doiSoat.js` | ~3 sửa |
| `env.example`, `HOP_DONG_API_KH.md`, `ThuTien.jsx` | ~20 chữ |
| **Máy chủ** | **~160** (dưới 250 của phiếu) |
| `cong_cu/thu_SEPAY1.js` (mới) | ~380 |
| `cong_cu/thu_P3.js`, `thu_BH2.js`, `thu_KHMUA1.js`, `thu_HOPDONG_KH.js` | +1 mỗi file (ghim `CONG_QR=payos`) |
| `kiem_tra_truoc_khi_giao.js` | +1 (đăng ký `thu_SEPAY1.js` trong `chayBaiThat`, dòng ~495) |

## 4. Bài thử `cong_cu/thu_SEPAY1.js` — ánh xạ 1-1 với Nghiệm thu

Khuôn `thu_P3.js` (kho libsql TẠM, chỉ thay `ketNoiKho`, SX tắt, mount ĐÚNG đường như `index.js`, kể cả `express.raw` trước `express.json`).
Khoá thử sinh ngẫu nhiên lúc chạy; BIN / số TK là số giả (`970000`, `0000000000`). Ký báo bằng công thức VIẾT RIÊNG trong bài. So HTTP +
`code`, không dò lời. Module chưa có (gốc) → mỗi ca hỏng riêng, không sập.

| Nghiệm thu | Ca |
|---|---|
| A | A1 `CONG_QR` không đặt → cổng payOS (phiên payOS giả trả `checkout_url`) · A2 `CONG_QR=sepay` thiếu từng khoá (3 ca, mỗi ca thiếu ĐÚNG một) → 503 `PAYOS_CHUA_CAU_HINH` · A3 `CONG_QR=lung_tung` → 503 · A4 phép tĩnh: `process.env.CONG_QR` chỉ xuất hiện trong `congQr.js` (grep `server/`) |
| B | B1 chuỗi giải lại ra đúng BIN, số TK, `54` = `con_lai`, `62/08` = `TQD<id>`, `01` = `12` · B2 CRC đúng (tính riêng) + ca chuỗi sửa một ký tự → CRC sai · B3 không gọi mạng (máy payOS giả đếm 0 lượt, `fetch` bị thay để ném) · B4 `het_han` cùng dạng, +10 phút · B5 vi_qr: `54` = phần còn lại sau ví, không phải `tong` |
| C | C1 sai chữ ký → từ chối, bảng `pos_payos_su_kien` + phiên KHÔNG đổi · C2 thiếu header chữ ký · C3 mốc giờ cũ 5 phút + 1 giây → từ chối; 4 phút 59 giây → nhận (ngưỡng hai phía) · C4 mốc giờ tương lai > 5 phút → từ chối · C5 khớp → đúng một đơn thật, `nguon = 'sepay'`, dòng `khop` · C6 báo lặp cùng mã GD (tuần tự) và C7 hai báo song song → vẫn một đơn, một dòng · C8 tiền ra → `khong_phien` · C9 không mã → `khong_phien` · C10 mã TQD không thuộc phiên → `khong_phien` · C11 mã kẹp giữa chữ ("CK TQD12 tra sua") → khớp · C12 lệch số (−1.000 và +1.000) → `chua_khop` câu lệch tiền · C13 về sau hết hạn → `chua_khop` · C14 đã xác nhận tay → `chua_khop` chứa "KHÔNG hoàn" · C15 vi_qr qua SePay → chốt, ví trừ đúng phần giữ · C16 KHO_BAN (giả lập) → trả lỗi, chưa ghi dòng nào; gửi lại sau → chốt · C17 trả đúng dạng "đã nhận" (chờ tài liệu) · C18 đơn App `qr`: báo khớp → chuông đơn App như cũ; báo sau huỷ → `tien_ve_cho_doi_soat: true` |
| D | D1 `chayDoiSoat` có dòng "SePay mã …" cho `chua_khop`/`khong_phien` SePay và "payOS mã …" cho dòng payOS trong cùng kho, cùng nhóm đỏ / cần xem |
| E | E1 cổng `payos`: `thu_P3`, `thu_BH2`, `thu_KHMUA1`, `thu_HOPDONG_KH`, `thu_DOISOAT1` chạy nguyên (ghim `CONG_QR=payos`) · E2 cổng `sepay`: các luồng ví + QR, huỷ, xác nhận tay, hết hạn, đơn App `qr`/`tien_ve_cho_doi_soat`, đối soát được chạy lại trong `thu_SEPAY1` (C13–C18, D1, + E2a huỷ phiên SePay rồi báo tới → `chua_khop` "phiên đang huy") · E3 hợp đồng: `POST /kh/don` cách `qr` với `CONG_QR=sepay` trả `qr.chuoi` là chuỗi VietQR, đủ trường như v5 |
| F | F1 `cai_dat_sepay.md` có đủ mục (biến, địa chỉ webhook, cài SePay, thử 2.000đ, quay về payOS) và không chứa chuỗi giống khoá / số TK (soát tay + grep số ≥ 8 chữ số) |
| Cấm | X1 log máy chủ suốt bài không chứa khoá webhook, số TK thử |

**Đường song song cần canh (K4):** webhook payOS cũ dời vào hàm chung → E1 `thu_P3` / `thu_KHMUA1` canh nó không đổi; `xac-nhan-tay`
(`thanh-toan.js:76`) vẫn nhận `cach = 'payos'` cho phiên SePay → C14; huỷ (`:62`) → E2a; `donApp.js:253` → C18.

**Luồng hợp lệ phải KHÔNG bị chặn (K5):** tiền mặt, trả đủ tài khoản, `ck_tay` (không qua cổng QR — A2 thiếu khoá SePay vẫn tạo được phiên
`tien_mat` / `ck_tay`: thêm ca A5); báo payOS hợp lệ khi `CONG_QR=sepay` (phiên payOS tạo trước lúc đổi công tắc vẫn chốt được — ca A6:
webhook payOS vẫn mount và chạy bất kể công tắc); báo SePay hợp lệ khi `CONG_QR=payos` (ca A7 — tiền về muộn của phiên SePay cũ không bị
mất); mã kẹp giữa chữ (C11); mốc giờ 4:59 (C3).

**Đột biến (`dot_bien.py`, mỗi tên một dòng):** `BV-chu-ky` (bỏ `kiemBao`) · `BV-moc-gio` (bỏ kiểm 5 phút) · `VS-moc-gio-mot-phia` (chỉ chặn
quá khứ) · `VS-nguong-6-phut` · `BV-chong-trung` (khoá theo `Date.now()`) · `VS-tien-ra` (bỏ kiểm chiều tiền) · `VS-so-tien-tong` (QR mang
`tong` thay `con_lai`) · `VS-crc-sai` (đa thức khác) · `BV-raw` (mount webhook sau `express.json`) · `VS-cong-mac-dinh-sepay` · `BV-nguon-doi-soat`
(câu đối soát cứng "payOS") · `VS-ma-dau-chuoi` (chỉ khớp `^TQD`). Mỗi đột biến có đối chứng (bản chưa đột biến xanh).

## 5. Rủi ro

- **Chi tiết SePay chưa đọc (mục 0)** — rủi ro lớn nhất: đọc sai header / chuỗi ký thì webhook từ chối mọi báo → mọi QR phải xác nhận tay
  (không mất tiền, nhưng quầy chậm). Giảm: thử đơn 2.000đ trước khi bỏ payOS (`cai_dat_sepay.md`), công tắc quay về payOS một bước.
- Tiền về mà nội dung bị ngân hàng khách cắt / đổi → `khong_phien` → Đối soát + xác nhận tay. Như payOS khi lệch.
- `express.raw` trước `express.json` chỉ gắn cho đúng đường `/api/sepay/webhook` — không đụng đường khác (ca: `/api/pos/health` + một POST
  JSON thường vẫn chạy trong bài thử).
- Số TK thật nằm trong chuỗi QR khách nhìn thấy — đó là bản chất VietQR, không phải lộ khoá; khoá webhook không bao giờ ra ngoài.

## 6. Sau soát kế hoạch (agent phụ chỉ đọc, 31.10) — các điểm SỬA đè lên mục 2–4

1. **Gắn thân thô:** CHỈ gắn `app.use('/api/sepay/webhook', express.raw({ type: '*/*', limit: '100kb' }))` trước `index.js:64`; route webhook
   SePay mount cạnh `:126` như payOS → vẫn đi qua dòng ghi nhật ký yêu cầu (`index.js:67-70`). Ca bài thử: POST JSON thường vẫn chạy.
2. **Không sửa `ThuTien.jsx`:** chữ "payOS" ở dòng 2 chỉ là chú thích, phiếu chỉ đòi chữ người dùng THẤY → bỏ khỏi kế hoạch, không đụng
   `client/`. (Giữ trong Phạm vi, không dùng.)
3. **Chữ "payOS" người dùng thấy NGOÀI Phạm vi** (mục 1 ghi "chỉ chú thích" là sai — chỉ đúng trong `BanHang/`): tờ in
   `client/src/utils/hoaDon.js:27` + mặc định `server/database.js:1210` (`invoice_chu_ck` = "Chuyển khoản (payOS)") — chủ quán tự đổi được ở
   Quản lý → Cài đặt → chữ hoá đơn, ghi vào `cai_dat_sepay.md`; `server/routes/orders.js:220` câu "Chuyển khoản phải qua QR payOS"
   (`CK_PHAI_QUA_PAYOS`); `server/routes/backup.js:91` nhãn "Báo tiền về payOS". → ghi `## Phát hiện`, không sửa.
4. **Ghim `CONG_QR=payos` trong 5 bài cũ** (`thu_P3`, `thu_BH2`, `thu_KHMUA1`, `thu_HOPDONG_KH`, `thu_DOISOAT1`) — giữ, dù mặc định đã là
   payos: biến môi trường kế thừa từ shell (KHUON_LOI K4 — máy Replit đặt `CONG_QR=sepay` thì bài cũ đỏ oan). `thu_DOISOAT1.js` không có
   chữ payOS nào (grep) → chỉ ghim nếu nó tạo phiên QR; không thì không sửa.
5. **Đăng ký bài:** `thu_SEPAY1.js` thêm một dòng `chayBaiThat(...)` riêng sau dòng `thu_HD1` (~500) — KHÔNG chen vào mảng dòng 495 (ghi chú
   HD-1: `thu_P3` phải đứng cuối mảng).
6. **Thêm ca:** C2b thiếu header mốc giờ → từ chối · C16b lỗi máy (ném trong giao dịch chốt, giả lập) → 5xx, chưa ghi dòng nào, gửi lại → chốt ·
   E2b đơn tạo qua SePay huỷ / hoàn trên quầy đi như đơn payOS (hoàn đúng phần ví đã giữ; dòng hoàn giống đơn payOS cùng giỏ).
7. **E dưới cổng `sepay`:** kế hoạch chạy lại các LUỒNG trong `thu_SEPAY1` (phương án A), không chạy nguyên 4 bài cũ dưới `sepay`
   (phương án B: thêm cờ argv `--cong sepay` cho từng bài cũ, đổi máy payOS giả + công thức ký → ~+40 dòng × 4 bài, vượt ngân sách thử 400).
   Chủ quán chọn ở Câu hỏi Q2.
