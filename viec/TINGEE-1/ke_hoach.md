# TINGEE-1 — kế hoạch (CHỜ DUYỆT)

Lập 06.11.2026 trên `e9b7036` (main `f464cea` + phiếu). Mọi khẳng định về code kèm file:dòng đọc trong lượt này.

## 0. Hai điều phải nói trước

1. **Máy KHÔNG đọc được tài liệu Tingee.** Người gác chặn `curl` ra ngoài (luật CURL-HOST), agent đọc web báo
   `getaddrinfo ENOTFOUND developers.tingee.vn` (mạng phiên không cho tên miền này). Những gì dưới đây về Tingee lấy từ chú thích phiếu
   (chat đọc 05.11) — **chưa đọc tài liệu gốc**. Phần nào phụ thuộc tên trường thật thì ghi "CHỜ TÀI LIỆU" và nằm ở `## Câu hỏi` (trang_thai.md).
2. **CK-NOIDUNG-1 chưa gộp vào main** (`git log` không có commit nào của nó; `server/utils/sepay.js:12` vẫn là `MA_PHIEN = /TQD(\d{1,6})(?!\d)/i`).
   Kế hoạch viết theo hướng **dùng lại đúng hàm đọc mã phiên + luật cộng ví của CK-NOIDUNG-1** (không chép công thức). Bước code (4–5) chỉ bắt đầu
   khi CK-NOIDUNG-1 đã gộp và nhánh này được kéo lại từ main mới — đúng lời phiếu "LÀM sau khi CK-NOIDUNG-1 gộp".

## 1. Hiện trạng đã đọc

| Chỗ | Đọc thấy |
|---|---|
| `server/utils/congQr.js:6` | `CONG = { payos, sepay }`, `congQr()` theo `CONG_QR` (mặc định payos, giá trị lạ → null → 503 `PAYOS_CHUA_CAU_HINH` ở `giuCho.js:36`) |
| `server/utils/congQr.js:14` | `congCuaKhoa`: `'sepay:'` → sepay, còn lại → payos (Tingee sẽ bị xếp NHẦM là payOS nếu không sửa) |
| `server/utils/sepay.js:14-38` | `cauHinh / daCauHinh / taoQr` (VietQR tự dựng qua `vietQr.js`), `kiemBao` (HMAC trên thân THÔ, lệch giờ ≤ 300 s, `timingSafeEqual`), `docBao` → `{ khoa, vao, ma, soTien, luc, tkKhac }` |
| `server/routes/thanh-toan.js:120-142` | MỘT `xuLyTienVe` cho mọi cổng: khoá UNIQUE `pos_payos_su_kien.khoa` (báo lặp dừng ở `ON CONFLICT DO NOTHING`), khớp phiên `ma_payos`, `tkKhac` → `chua_khop LY_DO_TK_KHAC`, lệch tiền / quá hạn → `chua_khop`, luật "hai cổng" dùng `congCuaKhoa` + `TEN_CONG` |
| `server/routes/thanh-toan.js:116` | `TEN_CONG = { payos: 'payOS', sepay: 'SePay' }` — thiếu Tingee thì nhánh "hai cổng" không bao giờ đúng cho Tingee |
| `server/routes/thanh-toan.js:157-172` | webhook SePay: 401 khi sai chữ ký (không ghi), 400 khi thân hỏng, rồi `xuLyTienVe` |
| `server/index.js:69, 136` | `express.raw` cho riêng `/api/sepay/webhook` TRƯỚC `express.json`; gắn `webhookSepay` |
| `server/utils/doiSoat.js:233` | nhãn nguồn: `congCuaKhoa(...) === 'sepay' ? 'SePay giao dịch …' : 'payOS mã …'` — Tingee sẽ hiện thành "payOS" nếu không sửa |
| `server/utils/giuCho.js:87,100` | `chotPhien(phien, nguon)` ghi `nguon` thẳng vào cột, không danh sách trắng — `'tingee'` đi qua không cần sửa |
| `server/database.js:1000` | `pos_payos_su_kien(khoa UNIQUE, ma_payos, so_tien, ket_qua, ly_do, du_lieu, luc)` — đủ cho Tingee, không đổi DB |
| `server/routes/settings.js:57-76` | `GET /settings` chỉ trả `data` từ `pos_settings`; chưa có dòng "Cổng QR" nào |

## 2. Trường của thân Webhook Tingee dùng để khớp — CHỜ TÀI LIỆU

Mỗi trường một dòng trong `docBao` của `tingee.js` (bảng ánh xạ — điền tên thật khi có tài liệu; KHÔNG đoán tên):

| Cần | Dùng làm gì | Tên trường Tingee |
|---|---|---|
| loại sự kiện | chỉ `PAYMENT_SUCCESS` mới xét; khác → ghi `khong_phien` lý do "Tingee báo <loại>" (vẫn 200) | CHỜ TÀI LIỆU |
| chiều tiền | chỉ tiền VÀO; ra → `boQua` "Tingee báo tiền ra" | CHỜ TÀI LIỆU (có thể PAYMENT_SUCCESS đã ngụ ý "vào") |
| số tiền | `soTien` so `con_lai` của phiên | CHỜ TÀI LIỆU |
| nội dung CK | đọc mã phiên bằng ĐÚNG hàm của CK-NOIDUNG-1 ("TQDNOV05 HD0016" / "… APP0016") | CHỜ TÀI LIỆU |
| số tài khoản nhận | so `TINGEE_SO_TK` (bỏ khoảng trắng) → khác thì `tkKhac` → `LY_DO_TK_KHAC` | CHỜ TÀI LIỆU |
| mã giao dịch Tingee | khoá `tingee:<mã>` (UNIQUE — báo lặp dừng) | CHỜ TÀI LIỆU (`transactionId`?) |
| mã ngân hàng FT… | lưu vào đơn như SePay (CK-NOIDUNG-1 mục D) | CHỜ TÀI LIỆU |
| giờ giao dịch | `luc` so `het_han` (dạng `YYYY-MM-DD HH:mm:ss` giờ VN như `DANG_GIO`, khác dạng → `getNow()` như cổng khác) | CHỜ TÀI LIỆU |

## 3. Chữ ký: thân THÔ, không phải thân đã parse

- Chuỗi ký (theo phiếu): `HMAC-SHA512(TINGEE_SECRET_TOKEN, "<x-request-timestamp>:<JSON thân>")`, hex.
- **Tính trên đúng từng byte nhận được** (`express.raw` riêng `/api/tingee/webhook`, cùng cách SePay `index.js:69`). Lý do: `JSON.stringify(JSON.parse(x))`
  không bảo đảm ra lại đúng chuỗi Tingee đã ký (thứ tự khoá, khoảng trắng, `1.0` → `1`, ký tự `/` hay tiếng Việt thoát `\uXXXX`) — ký lại trên
  bản parse là chữ ký lệch ngẫu nhiên. Tài liệu nói ký trên bản "đã chuẩn hoá" thì đổi, CHỜ TÀI LIỆU xác nhận.
- So: `Buffer(hex tính).length === Buffer(header hạ chữ thường).length && timingSafeEqual`. Khoá rỗng → luôn sai (như `sepay.js:26`).
- Giờ: `x-request-timestamp` dạng `yyyyMMddHHmmssSSS` giờ UTC+7 → đổi ra mốc tuyệt đối bằng hậu tố `+07:00` (không dùng `new Date` trên chuỗi giờ VN
  trần — K7: Render chạy UTC). Ngưỡng **±300 giây** (cùng `LECH_TOI_DA_GIAY` của SePay — một quy tắc một chỗ: CHỐT chuyển hằng số lên `congQr.js`, hai cổng cùng dùng). Sai dạng / thiếu header → 401, không ghi.
- **Rủi ro cần tài liệu:** Tingee gửi lại (30 s, 2 ph, 10 ph, 1 g, 6 g) có KÝ LẠI với mốc giờ mới không? Nếu gửi lại NGUYÊN header cũ thì từ lần 10 phút
  bị 401 — chỉ hại khi lần đầu không tới được (Render ngủ dậy ~30–60 s vẫn trong 300 s). Ghi ở Câu hỏi.

## 4. QR: tự dựng VietQR như SePay (phương án A) — CHỜ TÀI LIỆU xác nhận

Phiếu: tiền về ĐÚNG tài khoản ngân hàng đang dùng với SePay, Tingee GIỮ NGUYÊN nội dung CK → QR tự dựng `dungVietQr({ bin: TINGEE_BIN, soTk: TINGEE_SO_TK,
soTien, noiDung })` (`vietQr.js:22`) là đủ, không gọi mạng, không cần `TINGEE_CLIENT_ID` để tạo QR. Phương án B (gọi API Tingee tạo QR, ký
`x-signature` cho lời gọi đi) chỉ cần khi tài liệu nói tiền phải vào tài khoản ảo (VA) của Tingee mới được báo. `TINGEE_CLIENT_ID` vẫn kiểm trong
`daCauHinh` theo nghiệm thu A (để bật cổng phải cài đủ), không gửi đi đâu ở phương án A.

## 5. Phương án theo từng phần

| Phần | A (chọn) | B | Rủi ro |
|---|---|---|---|
| Mô-đun cổng | `server/utils/tingee.js` mới cùng dạng `sepay.js`: `cauHinh · daCauHinh · taoQr · kiemBao · docBao` ~50 dòng | gộp SePay + Tingee vào một mô-đun "cổng VietQR" chung ~40 dòng nhưng sửa `sepay.js` đang chạy | B đụng cổng đang dùng (Cấm gián tiếp: K5) → chọn A |
| Đọc mã phiên | gọi hàm đọc nội dung của CK-NOIDUNG-1 (nó đang / sẽ nằm ở `sepay.js` hoặc `congQr.js`) — nếu còn nằm riêng trong `sepay.js` thì chuyển sang `congQr.js` (+3 dòng, `sepay.js` gọi lại) | chép regex sang tingee.js (0 dòng sửa sepay) | B = hai công thức, lệch nhau sau này (LUAT §2 "một quy tắc — một hàm") → A |
| Công tắc + tên cổng | `congQr.js`: `CONG.tingee`; `TEN_CONG` chuyển từ `thanh-toan.js:116` lên đây (MỘT bảng `{ payos, sepay, tingee }`); `congCuaKhoa` = tiền tố trước `:` nếu là `sepay`/`tingee`, còn lại payos; `LECH_TOI_DA_GIAY` chuyển từ `sepay.js:11` lên đây, hai cổng cùng dùng ~6 dòng | mỗi file tự ghi tên cổng (3 chỗ) | A: một bảng thay ba chỗ ghi tay |
| Webhook | `thanh-toan.js`: `webhookTingee` ~15 dòng, cùng khuôn `webhookSepay` (401 sai chữ ký, 400 thân hỏng, rồi `xuLyTienVe`) | tách khung chung cho SePay+Tingee | B đụng SePay → A |
| Thân thô | `index.js` +2 dòng (`express.raw` + gắn route), dòng RIÊNG — không gộp vào dòng SePay (`thu_SEPAY1.js:458-459` dò thứ tự dòng SePay) | — | — |
| Đối soát | `doiSoat.js:233` nhãn nguồn = `TEN_CONG[congCuaKhoa(khoa)]` + mã cắt sau dấu `:` đầu (hiện `slice(6)` viết cứng cho `'sepay:'` — `'tingee:'` 7 ký tự sẽ ra ":<mã>") ~2 dòng | — | — |
| Môi trường | `TINGEE_MOI_TRUONG` chỉ được là `production` / `uat` (không đặt = production), giá trị lạ → `daCauHinh` sai. Phương án A không gọi API Tingee nên KHÔNG có nhánh "gốc UAT" để thử | — | — |
| Cài đặt | `GET /settings` trả thêm `cong_qr: { ten, da_cai }` (chỉ tên cổng + đúng/sai, không khoá) ~3 dòng; `Settings.jsx` một dòng "Cổng QR: Tingee ✓ / chưa cài ✗" ~10 dòng | đường mới `/settings/cong-qr` (đụng thứ tự với `/:key` dòng 81) | A |
| Bài thử | `cong_cu/thu_TINGEE1.js` ~350 dòng, nối vào `kiem_tra_truoc_khi_giao.js` (+1 dòng `chayBaiThat`, cùng chỗ dòng 505) | — | — |

Tổng ước: ~90 dòng máy chủ + ~12 dòng giao diện + ~350 dòng thử (dưới ngân sách 250 / 30 / 400).

## 6. Ca thử ↔ nghiệm thu (thân giả đúng dạng tài liệu, ký bằng khoá giả; không gọi Tingee thật)

| Ca | Nghiệm thu | Kiểm |
|---|---|---|
| T1 | A | thiếu từng biến `TINGEE_CLIENT_ID / SECRET_TOKEN / SO_TK / BIN` (hoặc BIN sai dạng) → `daCauHinh()` sai → tạo phiên 503 `PAYOS_CHUA_CAU_HINH` |
| T2 | A | `TINGEE_MOI_TRUONG` không đặt → cài được (production); `uat` → cài được; giá trị lạ → coi như chưa cài (không đoán) |
| T3 | A | khoá không lộ: thân trả về tạo phiên / webhook / `GET /settings`, `du_lieu` ghi DB (bảng này có trong sao lưu — `backup.js:132`), và mọi dòng `console.*` trong lúc chạy KHÔNG chứa chuỗi khoá giả — cả `TINGEE_SECRET_TOKEN` lẫn `TINGEE_CLIENT_ID` |
| T4 | B | `CONG_QR=tingee` → QR là VietQR đúng BIN + số TK Tingee + số tiền + nội dung của phiên (giải trường 38/54/62, CRC đúng) |
| T5 | B | `CONG_QR=sepay` / `payos` / không đặt → như cũ (K5); `CONG_QR=tingee` lúc báo SePay về phiên cũ vẫn chốt (webhook mọi cổng luôn mở) |
| T6 | B | `GET /settings` có `cong_qr = { ten: 'tingee', da_cai: true }`, chưa cài → `da_cai: false`; không trường khoá nào |
| T7 | C | đúng chữ ký → 200, phiên `da_thu`, `nguon = 'tingee'`, một dòng `pos_payos_su_kien` `khoa = 'tingee:<mã>'` `ket_qua = 'khop'` |
| T8 | C | sai chữ ký (một ký tự) / thiếu `x-signature` / thiếu `x-request-timestamp` / timestamp sai dạng / chữ ký đúng nhưng thân đổi một byte → 401, 0 dòng ghi, phiên vẫn `cho` |
| T9 | C | mốc giờ ngay trong ngưỡng (299 s, cả quá khứ lẫn tương lai) → nhận; ngay ngoài (301 s) → 401 (K3 hai phía ngưỡng) |
| T10 | C | chữ ký tính trên thân THÔ có khoảng trắng / thứ tự khoá lạ → vẫn đúng (bắt bản vá ký lại trên `JSON.stringify` bản parse) |
| T11 | C | sự kiện khác `PAYMENT_SUCCESS` / tiền ra → 200, `khong_phien`, phiên không đổi |
| T12 | D | báo lặp (gửi lại y hệt) → 200 cả hai lần, một dòng sự kiện, một đơn; hai báo cùng mã GỬI SONG SONG → một đơn (ca hai người cùng bấm) |
| T13 | D | tài khoản nhận khác `TINGEE_SO_TK` → `chua_khop` có `LY_DO_TK_KHAC`, phiên không chốt; Đối soát CẦN XEM |
| T14 | D | lệch tiền ±1 đồng → `chua_khop "lệch tiền"`; tiền về sau hạn → luật CK-NOIDUNG-1 (cộng ví / chua_khop đúng như SePay ở cùng tình huống — ca SO SÁNH: cùng thân qua SePay và Tingee ra cùng `ket_qua`) |
| T15 | D | phiên App lỗi → đúng luật CK-NOIDUNG-1 (ca so sánh với SePay như T14) |
| T16 | D | cùng một khoản: SePay chốt trước, Tingee báo sau → `chua_khop` có `LY_DO_HAI_CONG`, KHÔNG cộng ví; ngược lại Tingee trước SePay sau → như thế |
| T17 | D | mã phiên không thuộc phiên nào / nội dung không có mã → `khong_phien` |
| T18 | E | mã FT… của Tingee lưu vào đơn đúng chỗ SePay lưu (CK-NOIDUNG-1 mục D); Đối soát mô tả "Tingee giao dịch <mã>" (không phải "payOS") |
| T19 | K5 | thu_SEPAY1.js + bài thử payOS + bài của CK-NOIDUNG-1 vẫn xanh nguyên (chạy trong `npm test`) |
| T20 | B, F | chiều ngược của "webhook mọi cổng luôn mở": phiên tạo lúc `CONG_QR=sepay` (và lúc `payos`) → báo Tingee đúng chữ ký chốt được (bước 3 hướng dẫn F) |
| T21 | C | đúng chữ ký nhưng thân không phải JSON / thiếu mã giao dịch → 400 `BAO_KHONG_HOP_LE`, 0 dòng ghi |
| T22 | D | nội dung dạng mới của CK-NOIDUNG-1 ("TQDNOV05 HD0016" quầy, "… APP0016" App) → khớp đúng phiên; khách thêm chữ quanh mã vẫn khớp |
| T23 | D | tiền về ngay trước `het_han` → chốt; ngay sau → luật "về sau hạn" (hai phía mốc) |
| T24 | D | "hai cổng" payOS + Tingee (payOS chốt trước, Tingee báo sau) → `LY_DO_HAI_CONG`, không cộng ví |
| T25 | K5 | sau khi Tingee chốt: số dư ví / điểm của khách bằng đúng khi chốt cùng đơn qua SePay; QR Tingee và QR SePay cho cùng phiên giống hệt chuỗi (cùng số tiền, nội dung) |

Dòng "Cổng QR: Tingee ✓ / chưa cài ✗" trên màn Cài đặt: T6 khoá phần máy chủ; phần hiển thị là thao tác thử tay cho chủ quán (LUAT §6.4):
mở Cài đặt → thấy dòng "Cổng QR". Sửa `Settings.jsx` thì `(cd client && npm run build)` + `--day-du` (P1).

F (hướng dẫn chủ quán) không phải bài thử — ở mục 8.

## 7. Đường song song phải canh (K4) — grep đã chạy

`grep -rn "'sepay'" server client/src` → `congQr.js:14` (congCuaKhoa), `doiSoat.js:233` (nhãn), `thanh-toan.js:116,166` (TEN_CONG, nguon).
Cả ba phải biết Tingee: thiếu `congCuaKhoa` → Đối soát gọi Tingee là payOS và nhánh "hai cổng" tính `daBao` sai (`thanh-toan.js:136`);
thiếu `TEN_CONG` → báo Tingee tới sau SePay KHÔNG ra "hai cổng" mà ra "phiên đang da_thu". Đột biến BV- cho từng chỗ (mục 9).
Thêm: `index.js:69` (thân thô — thiếu thì `req.body` là object, `kiemBao` trả sai → mọi báo 401: ca T7 bắt); chú thích `giuCho.js:5,87`,
`thanh-toan.js:2,109-115,118-119,157`, `congQr.js:2-4,9,11,13`, `doiSoat.js:229-230`, `giuCho.js:17`, `index.js:68,133` nói "hai cổng" / chỉ SePay →
sửa chữ cùng dòng vá (K1 TU-CHAY-6). `thu_TINGEE1.js` tự dựng app riêng như `thu_SEPAY1.js:103-111` → tự gắn `express.raw` cho đường Tingee
(và ca T7 trên `server/index.js` thật bắt thiếu dòng raw — K3: bài thử không tự gắn middleware rồi đo).
Nhãn "payOS" sẵn có ở `client/src/utils/hoaDon.js:27`, `database.js:1211`, `backup.js:95` là nhãn cũ chung cho QR — để nguyên (ngoài mục tiêu).
Hàm đọc mã phiên của CK-NOIDUNG-1: chỉ GỌI; nếu nó nằm ở file ngoài Phạm vi thì không sửa file đó.

**Luồng hợp lệ KHÔNG được chặn (K5):** báo SePay đúng chữ ký (CONG_QR nào cũng vậy); báo payOS; phiên tạo lúc `CONG_QR=sepay` rồi đổi sang `tingee`
vẫn chốt bằng báo SePay; báo Tingee lặp vẫn 200; chuyển thử 2.000đ (đơn thử) qua Tingee chốt bình thường; tiền mặt / tài khoản / xác nhận tay không đụng.

## 8. Hướng dẫn chủ quán (nghiệm thu F)

Địa chỉ Webhook dán vào app.tingee.vn → Developers: **`https://www.pos-tuquyduong.io.vn/api/tingee/webhook`** (có `www`, cùng dạng địa chỉ SePay
ở `viec/SEPAY-1/cai_dat_sepay.md:14` — bản không `www` có thể chuyển hướng và làm POST hỏng).

1. Render → Environment: thêm `TINGEE_CLIENT_ID`, `TINGEE_SECRET_TOKEN`, `TINGEE_SO_TK`, `TINGEE_BIN` (cùng tài khoản đang dùng với SePay),
   `TINGEE_MOI_TRUONG=production` (không đặt cũng là production). CHƯA đổi `CONG_QR` (vẫn `sepay`).
2. app.tingee.vn → Developers: dán địa chỉ Webhook trên, lưu.
3. Tạo một đơn thử 2.000đ bằng QR, tự chuyển khoản. QR do cổng SePay dựng tới CÙNG tài khoản, cùng nội dung; Tingee báo về `/api/tingee/webhook`,
   `xuLyTienVe` khớp theo mã phiên (không theo cổng đã dựng QR) nên phiên vẫn chốt. Trong vài giây màn QR tự báo "đã thu".
   Không tự báo sau 1 phút → xác nhận tay đơn thử, báo chat (Đối soát có dòng ghi lý do; sai chữ ký thì Render log có dòng 401).
4. Thấy tự xác nhận → đặt `CONG_QR=tingee`, Render khởi động lại. Muốn quay lại: `CONG_QR=sepay` (hoặc `payos`).

## 9. Đột biến dự kiến (`viec/TINGEE-1/dot_bien.py`)

| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| kiemBao so chữ ký | `VS-so-chu-ky-bo-qua` (luôn đúng khi có header) | T8 |
| kiemBao thân thô | `VS-ky-tren-than-parse` (ký trên `JSON.stringify(JSON.parse)`) | T10 |
| kiemBao ngưỡng | `VS-nguong-mot-chieu` (chỉ chặn quá khứ) · `VS-nguong-301` | T9 |
| kiemBao giờ VN | `VS-gio-utc` (đọc timestamp như UTC) | T9 |
| docBao tài khoản | `BV-bo-tk-khac` | T13 |
| docBao khoá | `VS-khoa-khong-tien-to` (`<mã>` trần) | T7, T16 |
| docBao chỉ PAYMENT_SUCCESS / tiền vào | `BV-bo-loc-su-kien` | T11 |
| congCuaKhoa / TEN_CONG (một bảng) | `BV-cong-tingee-bang-ten` | T16, T18, T24 |
| doiSoat cắt mã | `VS-cat-ma-slice6` | T18 |
| index.js raw | `BV-bo-than-tho-tingee` | T7 |
| congQr CONG | `BV-bo-cong-tingee` | T4 |
| daCauHinh | `VS-thieu-client-id-van-cai` | T1 |
| settings | `VS-lo-khoa-settings` (trả cả cauHinh) | T3, T6 |

## 10. Ngoài phạm vi / không làm

Không đổi nội dung CK, số tiền, ví, điểm; không sửa `sepay.js` / `payos.js` ngoài việc chuyển hàm đọc mã phiên (nếu cần) mà hành vi giữ y nguyên;
không gọi Tingee thật; không đổi DB.
