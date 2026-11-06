# TINGEE-1 — trạng thái

## Đối chiếu bản chụp (06.11.2026)
- Nhánh: viec/TINGEE-1; cây sạch; fetch origin viec/TINGEE-1 xong.
- HEAD e9b7036 · FETCH_HEAD e9b7036 (bằng nhau, không kéo).
- `git log --oneline -3`:
  - e9b7036 PHIEU: TINGEE-1
  - f464cea Merge pull request #74 from pos-tuquyduong/viec/HANG-1
  - 7c0c682 GOP-HANG-1 HEAD DA KIEM 84480a7 (chat soat)

## Đối chiếu bản chụp — phiên `tiep` (06.11.2026)
- Nhánh: viec/TINGEE-1; cây sạch; fetch origin viec/TINGEE-1 xong.
- HEAD b4af4be · FETCH_HEAD b4af4be (bằng nhau, không kéo).
- `git log --oneline -3`:
  - b4af4be TINGEE-1 ke hoach (cho duyet) + trang thai, cau hoi tai lieu Tingee
  - e9b7036 PHIEU: TINGEE-1
  - f464cea Merge pull request #74 from pos-tuquyduong/viec/HANG-1

## Đối chiếu bản chụp — phiên `tiep` lần 2 (06.11.2026)
- Nhánh: viec/TINGEE-1; cây sạch; hook mở phiên đã kéo d01f140 → a935313; fetch origin viec/TINGEE-1 xong.
- HEAD a935313 · FETCH_HEAD a935313 (bằng nhau, không kéo thêm).
- `git log --oneline -3`:
  - a935313 TINGEE-1: tai lieu Tingee day du (chu quan dan) + bo sung STK goc / VA, hai loai Webhook (chat 05.11)
  - 71c44cb GOP-TINGEE-1 dua main f9fd8b5 vao nhanh (chat 06.11 - may bi nguoi gac chan merge)
  - d01f140 TINGEE-1 ghi dieu chinh duyet 06.11 (VA, huong dan F) + cau hoi: chua keo duoc main, thieu tai lieu Tingee

## Bước đang ở
Phiên `tiep` lần 2: bước 4–7 xong; soát vòng 1 KHÔNG ĐẠT (lỗi nhẹ) → vòng sửa 1 (046fd5b); tiếp soát vòng 2.

## Cách làm theo tài liệu (chỗ kế hoạch b4af4be đổi theo duyệt 06.11 + tài liệu)
- **Trường thân Webhook** (`tai_lieu_tingee.md` mục 1): `transactionCode` → khoá `tingee:<mã>` + mã GD lưu vào đơn; `amount`; `content` → MỘT hàm
  `docNoiDung` (tách từ `sepay.js`, SePay gọi lại — hành vi giữ nguyên, thu_SEPAY1 78/78); `vaAccountNumber` so `TINGEE_SO_TK` (bỏ khoảng trắng,
  không phân biệt hoa thường); `accountNumber` bỏ qua; `transactionDate` yyyyMMddHHmmss giờ VN → so hạn QR; `type` 'credit' hoặc VẮNG = tiền vào,
  'debit' = bỏ qua (`khong_phien`). `clientId` KHÔNG lưu vào `du_lieu`.
- **Chữ ký** (mục 2): HMAC-SHA512(khoá, "ts:thân") hex; thử thân THÔ trước, không khớp thì `JSON.stringify(JSON.parse(thô))`; khớp bản gọn thì
  `console.warn` một dòng (không khoá) để sau bỏ cách thừa. `x-request-timestamp` bắt buộc đúng 17 chữ số; KHÔNG so với giờ máy chủ (mục 4).
- **Trả lời** (mục 3): ghi nhận → 200 `{"code":"00","message":"Success"}`; khoá đã có dòng → 200 `{"code":"02"}`; sai chữ ký → 401
  `{"error","code":"09"}` (lệch luật mã lỗi IN_HOA của LUAT §2 vì Tingee đọc đúng mã "09"); thân không phải JSON → 400 `BAO_KHONG_HOP_LE`;
  kho bận / lỗi máy chủ → 409 / 500 (code khác "00"/"02" → Tingee gửi lại).
- **Tin không có `transactionCode`** (tin "Kiểm tra kết nối" của Portal / dạng Cổng thanh toán, mục 7) → một dòng `khong_phien` khoá
  `tingee:tin-la:<băm thân>`, trả "00" — Đối soát hiện ở CẦN XEM, không chốt gì.
- **QR**: VietQR tự dựng tới `TINGEE_SO_TK` (số VA có chữ) + `TINGEE_BIN`; `vietQr.js` không cần sửa (bài thử B1–B4 giải chuỗi EMV độc lập).
  `TINGEE_MOI_TRUONG` chỉ kiểm giá trị (production / uat / không đặt) — không có lời gọi API Tingee nào.
- **Ngưỡng ±300 s của kế hoạch mục 3 BỎ** (duyệt 06.11 + mục 4); chống phát lại bằng khoá UNIQUE `tingee:<mã>`. `LECH_TOI_DA_GIAY` vẫn riêng
  của SePay (không dời lên congQr — không còn cổng thứ hai dùng).
- **Đối soát**: nhãn `TEN_CONG[cổng] giao dịch <mã>`; lưới chặn "ghi tiền vượt" tách cột Tingee (trước đây khoá không `sepay:` đều tính là payOS).

## Chỗ vá → đột biến (`viec/TINGEE-1/dot_bien.py` — 40 đột biến, lần chạy cuối sau vòng sửa 1: BẮT 40 · SỐNG 0 · HỎNG 0 · LẠC 0; đối chứng tg 74/0, sp 78/0)
| Chỗ vá | Đột biến |
|---|---|
| tingee.js kiemBao so chữ ký | BV-chu-ky |
| kiemBao thân thô / bản gọn | VS-ky-chi-ban-gon · VS-ky-chi-than-tho |
| kiemBao không ngưỡng giờ (mục 4) | VS-nguong-gio-300-giay |
| kiemBao dạng timestamp | BV-dang-timestamp |
| khoá không vào nhật ký | VS-lo-khoa-nhat-ky |
| daCauHinh | VS-thieu-client-id-van-cai · VS-moi-truong-la-van-cai · VS-moi-truong-chi-production · VS-dang-so-tk-long |
| taoQr số VA | VS-qr-sai-so-tk |
| congQr.js cổng tingee | BV-cong-tingee |
| settings.js cong_qr | BV-cong-qr-settings |
| docBao tài khoản VA | BV-tk-va · VS-tk-so-goc · VS-tk-phan-biet-hoa-thuong · BV-va-rong-khop · VS-tk-mot-trong-hai |
| docBao tiền vào / ra | VS-bat-buoc-type · BV-loc-tien-ra · VS-type-phan-biet-hoa |
| docBao giờ giao dịch | BV-doc-gio-giao-dich |
| docBao khoá tiền tố | VS-khoa-khong-tien-to |
| webhookTingee trả "02" / "00" / "09" | BV-tra-02 · VS-tra-success · VS-401-ma-sai |
| webhookTingee tin lạ | VS-tin-la-400 |
| webhookTingee không lưu clientId | BV-luu-client-id |
| webhookTingee nguồn | VS-nguon-thanh-sepay |
| congCuaKhoa / TEN_CONG | VS-cong-cua-khoa-chi-sepay · BV-ten-tingee |
| doiSoat lưới chặn + nhãn | VS-luoi-gop-tingee-payos · VS-nhan-cat-6 |
| sepay.js docNoiDung dùng chung | VS-noi-dung-dau-chuoi · VS-noi-dung-chi-chuoi-dau |
| index.js thân thô + gắn đường | BV-than-tho-tingee · BV-gan-duong-tingee |
| bộ kiểm chạy bài | BV-bo-kiem-chay-bai |
| hướng dẫn F | VS-huong-dan-khong-www · VS-huong-dan-khong-quay-lai |

## Soát kế hoạch (agent phụ chỉ đọc, 06.11)
4 câu: (1) ngoài Phạm vi — không; (2) ngắn hơn — gom `TEN_CONG` + `congCuaKhoa` về một bảng ở `congQr.js`, chốt `LECH_TOI_DA_GIAY` dùng chung,
bỏ nhánh "gốc UAT" không bao giờ chạy — ĐÃ nhận cả ba; (3) ca thiếu — chiều ngược "webhook luôn mở", JSON hỏng, nội dung mới CK-NOIDUNG-1,
sát mốc hết hạn, hai cổng payOS+Tingee, ví / điểm không đổi, khoá trong sao lưu — ĐÃ thêm T20–T25 + T3; (4) sót — `doiSoat.js:233 slice(6)`
viết cứng cho `'sepay:'`, địa chỉ Webhook phải có `www`, thêm chú thích cần sửa — ĐÃ ghi vào kế hoạch. Số dòng trích đã kiểm lại bằng grep.

## Câu hỏi
1. **Tài liệu Tingee — máy không đọc được.** Người gác chặn `curl` ra ngoài (CURL-HOST); agent đọc web báo `ENOTFOUND developers.tingee.vn`
   (mạng phiên không có tên miền này). Để viết `docBao` đúng mà không đoán, cần MỘT trong hai:
   (a) bạn dán vào phiếu (hoặc file `viec/TINGEE-1/tai_lieu_tingee.md`) nguyên trang "Webhook Payment Callback": ví dụ thân JSON đầy đủ, cách tính
   chữ ký (thân thô hay đã chuẩn hoá, hex hoa hay thường), câu trả lời Tingee chờ (chỉ HTTP 200, hay cần thân như `{"code":"00"}`), và gửi lại có ký
   lại mốc giờ mới không; hoặc (b) cho phép tên miền developers.tingee.vn trong mạng của môi trường.
   Tên trường cần biết ở bảng mục 2 của `ke_hoach.md`.
2. **QR:** kế hoạch chọn tự dựng VietQR tới đúng tài khoản ngân hàng (như SePay, không gọi API Tingee). Đúng khi Tingee báo cho MỌI tiền vào tài khoản
   đó (không bắt tiền phải vào tài khoản ảo VA của Tingee). Đề xuất: giữ cách này; tài liệu nói phải dùng VA thì đổi sang gọi API tạo QR.
3. **Phụ thuộc CK-NOIDUNG-1:** chưa gộp vào main (sepay.js vẫn đọc `TQD<số>`). Đề xuất: duyệt kế hoạch xong, chờ CK-NOIDUNG-1 gộp rồi mở phiên `tiep`
   kéo main mới — bước code dùng lại đúng hàm đọc nội dung và luật cộng ví của CK-NOIDUNG-1.
4. **Thứ tự chuyển (nghiệm thu F):** kế hoạch đề xuất chuyển thử 2.000đ khi VẪN `CONG_QR=sepay` (QR hai cổng giống hệt vì cùng tài khoản + nội dung;
   webhook Tingee vẫn chốt phiên), thấy tự xác nhận mới đặt `CONG_QR=tingee` — đúng thứ tự phiếu. Bạn chỉ cần xác nhận.

### Phiên `tiep` 06.11 — bị chặn, cần bạn làm
5. **Kéo main vào nhánh — máy bị người gác chặn.** Lời dặn "git merge origin/main" không chạy được: `git fetch origin main` → `[GIT-KEO]` (chỉ được
   fetch đúng `viec/TINGEE-1`); `git merge`, `git ls-remote` → `[GIT-LENH]` ("gộp là việc của chủ quán"); đọc GitHub bằng công cụ GitHub → `[CC-LA]`.
   Kho trong máy là kho nông, không có `origin/main`. Máy KHÔNG lách.
   **Đề xuất (bạn làm, ~1 phút):** trên GitHub mở PR `viec/TINGEE-1` → `main` (chưa cần gộp), bấm **"Update branch"** để kéo main vào nhánh. Rồi mở
   lại phiên `tiep` — bước 1.3 của máy tự `pull --ff-only` bản mới.
6. **Hai file tài liệu không có trong máy.** `viec/TINGEE-1/tai_lieu_tingee.md` và `tingee_tai_lieu_day_du.txt` không nằm trong nhánh ở b4af4be
   (`find /` không thấy). Nếu chúng ở main thì câu 5 giải luôn; nếu chưa commit ở đâu thì bạn đưa vào `viec/TINGEE-1/` trên nhánh này.
   Thiếu tài liệu thì máy không viết `docBao` / chữ ký / câu trả lời — không đoán tên trường.
Câu 1–4 cũ: đã trả lời bằng lời duyệt 06.11 (QR → VA; CK-NOIDUNG-1 đã gộp; thứ tự F → `ke_hoach.md` mục 11.4).
Câu 5–6: ĐÃ GIẢI (chat gộp main f9fd8b5 vào nhánh ở 71c44cb, thêm tài liệu ở a935313). Không còn câu hỏi mở.

## Phát hiện
- Đột biến `VS-huong-dan-khong-quay-lai` SỐNG ở lần chạy đầu: phép F1 chỉ tìm chuỗi `CONG_QR=sepay` ở BẤT KỲ đâu (câu "Trục trặc → …" đầu file
  che mất bước "Không thấy → đổi lại"). Đã thêm ca F2 gắn đúng dòng + thứ tự; chạy lại bằng chứng đỏ trên gốc (11 đạt · 43 hỏng).
- `client/src/utils/hoaDon.js`, `database.js`, `backup.js` còn nhãn "payOS" chung cho QR (đã ghi ở kế hoạch mục 7) — để nguyên, ngoài mục tiêu.
- Lối lùi `CONG_QR=sepay` (chủ quán chọn 06.11) không còn tự xác nhận vì Webhook SePay đã gỡ (phiếu 05.11) — hướng dẫn đã nói rõ; muốn lối lùi
  tự xác nhận thì khai lại Webhook SePay. Ghi cho chủ quán biết, không đổi lựa chọn.

## Soát độc lập — vòng 1 (agent, 06.11, trên HEAD 4b58a47) — chép nguyên văn
```
KHÔNG ĐẠT — chỉ còn lỗi NHẸ (không đụng tiền / ví / điểm, không lộ khoá); lỗi nằm ở hướng dẫn chủ quán + chú thích. Đường tiền và bài thử vững.

Đã chạy: thu_TINGEE1 70/0 trên HEAD, 11/43 trên gốc (scratchpad/goc); node kiem_tra_truoc_khi_giao.js --day-du → PASS 104 · FAIL 0 · CẢNH BÁO 2
("dist đã commit KHỚP với src", thu_SEPAY1 + thu_CKNOIDUNG1 xanh); dot_bien.py chạy thử 4 đột biến (BV-chu-ky, BV-tra-02, VS-tk-so-goc,
VS-luoi-gop-tingee-payos) → BẮT 4/4, đối chứng xanh.

LỖI TÌM ĐƯỢC:
 1. viec/TINGEE-1/cai_dat_tingee.md:6 — hứa "Trục trặc → CONG_QR=sepay là về như cũ ngay" nhưng phieu.md:6-7 "chủ quán đã gỡ Webhook ở SePay" —
    đổi lại sepay thì QR về số gốc KHÔNG có webhook báo → mọi đơn QR phải xác nhận tay đúng lúc trục trặc. Lối lùi đã được chủ quán duyệt
    (ke_hoach 11.4) nhưng câu "về như cũ ngay" sai: phải ghi "cài lại Webhook ở SePay" hoặc lùi về payOS — K1 (khẳng định trái hồ sơ gốc).
 2. viec/TINGEE-1/cai_dat_tingee.md:10 — "(bạn đã cài 2 biến đầu)": không file nào trong kho làm căn cứ; hai biến ĐẦU danh sách là
    TINGEE_SO_TK / TINGEE_BIN — dễ bị bỏ qua → daCauHinh sai → 503 ở bước thử. Hỏng an toàn nhưng gây nhầm — K1.
 3. server/utils/giuCho.js:5 ("QR payOS · SePay") và :92 (danh sách nguon "tien_mat · tai_khoan · payos · sepay · tay"); server/routes/thanh-toan.js:140
    ("noiDung … — SePay") — chú thích chưa thêm 'tingee' trong khi chotPhien nay nhận nguon='tingee' — K4 (chú thích là đường song song).

NGHI NGỜ:
 - tingee.js:41 — chỉ type === undefined | 'credit' là tiền vào; "CREDIT" hoa hay null → khoản thật ghi khong_phien, không tự chốt (không mất tiền,
   CẦN XEM). Gọn hơn: so không phân biệt hoa thường, null như vắng.
 - tingee.js:16,31 — DANG_TS /^\d{17}$/ bắt buộc; timestamp đã nằm trong HMAC nên không thêm an toàn, chỉ thêm rủi ro K5 (Tingee gửi 14 số → 401).
   Khớp tài liệu mục 1/2 nên chưa kết luận lỗi; có BV-dang-timestamp khoá.
 - tingee.js:44 — chưa cài TINGEE_SO_TK mà vaAccountNumber rỗng → '' === '' → chốt được. Rất thấp; gọn hơn: soTk rỗng → luôn tkKhac.
 - K3: không có ca accountNumber === TINGEE_SO_TK mà VA khác / rỗng → phải KHÔNG chốt; đột biến "khớp nếu MỘT trong hai số đúng" sẽ SỐNG.
 - Tin "Kiểm tra kết nối": chưa biết Tingee có ký không; không ký → 401 / "09" trong khi cai_dat_tingee.md:22 hứa "máy chủ trả 00". Mỗi lần thử
   thêm một dòng tin-la ở CẦN XEM.
 - Đơn giản: TINGEE_CLIENT_ID / TINGEE_MOI_TRUONG được kiểm nhưng không đổi hành vi (phiếu A đòi nên giữ được). thanh-toan.js:242-243 vá đè res.json
   để đổi {success:true} → {"code":"00"}: chạy đúng, có VS-tra-success canh, nhưng là mẹo; gọn hơn: xuLyTienVe trả kết quả, mỗi webhook tự trả lời.

NGHIỆM THU: 7/7 mục có bằng chứng · mục thiếu: không (A: A1–A3, X1, X2 · B: A1, A4, A5 ×3, D8 ×2, UI + dist · C: C1–C9 · D: D1–D8, C2 ·
E: C1 ma_gd, E1, E2 · F: F1 / F2 · K5: A4, D8, B3, D7, thu_SEPAY1 + thu_CKNOIDUNG1 xanh)

CHƯA SOÁT ĐƯỢC: dạng thật của tin Tingee (chữ `type`, dạng timestamp, tin "Kiểm tra kết nối" có ký không); màn Cài đặt chưa xem trên điện thoại;
không chạy đủ 37 đột biến (chỉ 4), không chạy node tu_chay/cong.js chay; MB có thật chèn mã VA đầu nội dung — dựa lời chủ quán 06.11.

BÀI HỌC:
 - KHOÁ: bài thử F canh "hướng dẫn không hứa lối lùi về cổng đã gỡ Webhook"; thêm ca "accountNumber = TINGEE_SO_TK, VA sai / rỗng → KHÔNG chốt".
 - NGUYÊN TẮC (K1): hướng dẫn cho chủ quán là khẳng định — câu về trạng thái hiện tại ("đã cài", "về như cũ") phải có nguồn trong phiếu / sổ.
 - NGUYÊN TẮC (K5): phép kiểm dạng trên trường đã nằm trong chữ ký (timestamp) không thêm an toàn, chỉ thêm đường chặn oan — bỏ hoặc ghi lý do giữ.
 - NGUYÊN TẮC (K4): thêm giá trị enum mới (nguon 'tingee') → grep cả chú thích liệt kê enum đó.
```

### Vòng sửa 1 (commit 046fd5b)
- Lỗi 1: `cai_dat_tingee.md` dòng 6 + bước 5 nói rõ Webhook SePay đã gỡ → lùi `sepay` là xác nhận tay cho tới khi khai lại Webhook SePay.
- Lỗi 2: "bạn báo 06.11 đã cài `TINGEE_SO_TK` và `TINGEE_BIN`" — nguồn: lời chủ quán trong lệnh phiên này (06.11).
- Lỗi 3: chú thích `giuCho.js` (2 chỗ), `thanh-toan.js` thêm Tingee.
- Nghi ngờ type: `tingee.js` coi `type` null / vắng / "credit" mọi kiểu chữ là tiền vào — ca C6 ×2, đột biến VS-type-phan-biet-hoa.
- Nghi ngờ VA rỗng: `tkKhac` khi VA rỗng luôn khác — ca D3 "chưa cài số VA", đột biến BV-va-rong-khop.
- Nghi ngờ K3 số gốc: ca D3 "accountNumber = TINGEE_SO_TK, VA khác → không chốt", đột biến VS-tk-mot-trong-hai.
- Tin thử: hướng dẫn nói rõ cả hai khả năng (ký → "00"; không ký → 401, làm tiếp bước thử 2.000đ).
- GIỮ, có lý do: DANG_TS (đúng dạng tài liệu; ghi chú thích); CLIENT_ID / MOI_TRUONG (nghiệm thu A của phiếu đòi); vá `res.json` (giữ
  `xuLyTienVe` dùng chung không đổi chữ ký hàm — đổi sang trả kết quả phải sửa cả payOS / SePay, đụng đường tiền đang chạy).
