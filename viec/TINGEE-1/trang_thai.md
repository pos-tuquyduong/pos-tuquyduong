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
Phiên `tiep` lần 2: bước 4–7 xong; soát vòng 1 KHÔNG ĐẠT (lỗi nhẹ) → vòng sửa 1 (046fd5b); soát vòng 2 KHÔNG ĐẠT (1 lỗi nhẹ) → vòng sửa 2 (84cc3a5); soát vòng 3 chỉ lỗi nhẹ → vòng sửa 4 chat soát thay (88a72b4);
soát bảo mật ĐẠT; cổng ĐẠT. XONG — dừng, chờ chủ quán thử theo cai_dat_tingee.md.

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

## Chỗ vá → đột biến (`viec/TINGEE-1/dot_bien.py` — 42 đột biến: vòng sửa 1 chạy đủ 40 → BẮT 40; vòng sửa 2 thêm 2 → BẮT 2; SỐNG 0 · HỎNG 0 · LẠC 0; đối chứng tg 75/0, sp 78/0)
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
| hướng dẫn F | VS-huong-dan-khong-www · VS-huong-dan-khong-quay-lai · VS-huong-dan-ve-nhu-cu · BV-huong-dan-buoc-lui-khong-noi-go |

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
- `server/utils/sepay.js` docBao: `tkKhac: tk === cauHinh().soTk ? null : …` — SEPAY_SO_TK rỗng + báo SePay đúng chữ ký có accountNumber rỗng → chốt
  ("rỗng bằng rỗng", lỗ vừa bịt ở tingee.js). Cần đã cài khoá webhook SePay mà thiếu số TK — rất thấp; phiếu K5 "cổng SePay không đổi" → không sửa ở
  đây. Đề xuất việc sau: `tk && tk === …` + ca thu_SEPAY1 "SEPAY_SO_TK rỗng, accountNumber rỗng → không chốt".

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

## Soát độc lập — vòng 2 (agent, 06.11, trên HEAD 6178e6c) — chép nguyên văn
```
KHÔNG ĐẠT — chỉ còn lỗi NHẸ (ở bài thử của tài liệu hướng dẫn). Đường tiền, chữ ký, chống báo lặp và bài thử phần code vững. Cả 7 lỗi / nghi ngờ
vòng 1 đã xử lý đúng hoặc giữ có lý do.

Đã chạy trên HEAD 6178e6c: thu_TINGEE1 74 đạt · 0 hỏng; gốc (scratchpad/goc) 11 đạt · 45 hỏng, khớp bang_chung_do.txt; --day-du PASS 104 · FAIL 0 ·
CẢNH BÁO 2 ("dist đã commit KHỚP với src", SePay / CK-NOIDUNG / TINGEE xanh); dot_bien.py 3 đột biến mới (BV-va-rong-khop, VS-type-phan-biet-hoa,
VS-tk-mot-trong-hai) BẮT 3/3, đối chứng xanh (tg 74/0, sp 78/0).

LỖI TÌM ĐƯỢC:
 1. cong_cu/thu_TINGEE1.js:442-448 (F1/F2) — lỗi 1 vòng 1 (cai_dat_tingee.md:6 "về như cũ ngay") đã sửa ở cai_dat_tingee.md:6-7 và :28 nhưng KHÔNG có
    ca thử, KHÔNG có đột biến đưa đúng câu cũ trở lại. F1 chỉ tìm 'CONG_QR=sepay', F2 chỉ tìm dòng "Không thấy … `CONG_QR=sepay` NGAY". Trả dòng 6-7
    về "về như cũ ngay" và bỏ "Webhook SePay đã gỡ" ở dòng 28 thì 74 ca vẫn xanh (suy từ code). KHUON_LOI K3 (TACH-GL). K3 — NHẸ.
 2. client/src/pages/CaiDat/CongQr.jsx:8 — gọi lại GET /settings trong khi Settings.jsx:460 đã gọi; thừa một lần gọi. Gọn hơn: Settings.jsx truyền
    cong_qr xuống. Mục 8 — NHẸ, không bắt buộc sửa.

NGHI NGỜ:
 - server/utils/sepay.js:48 `tkKhac: tk === cauHinh().soTk ? null : …` — SePay còn lỗ "rỗng bằng rỗng" vừa bịt ở tingee.js:47 (cài SEPAY_KHOA_WEBHOOK,
   SEPAY_SO_TK rỗng, báo đúng chữ ký accountNumber rỗng → chốt). K4 ở code cũ SEPAY-1; phiếu K5 "cổng SePay không đổi", Webhook SePay đã gỡ — rất
   thấp. Đề xuất ghi Phát hiện, không sửa trong phiếu này.
 - tingee.js:16,31 DANG_TS /^\d{17}$/: không thêm an toàn (mốc giờ trong HMAC); Tingee gửi 14 số → mọi báo 401. Khớp tài liệu mục 1-2; đơn thử 2.000đ
   (cai_dat_tingee.md:28) lộ ra, có lối lùi. Giữ có lý do — chấp nhận được.
 - tingee.js:43,47: chưa biết vaAccountNumber gửi "VQRQANJMG7944" hay "QANJMG7944" — nếu dạng sau thì mọi báo vào "tài khoản khác", xác nhận tay.
   Hỏng an toàn; đơn thử bắt được; Đối soát hiện số VA nhận được.
 - thanh-toan.js:240: khoá tin lạ = băm thân THÔ — phát lại với khoảng trắng khác thành nhiều dòng khong_phien (chỉ nhiễu CẦN XEM, cần nghe lén HTTPS).
 - thanh-toan.js:233: sai chữ ký trả 401 không ghi dòng chẩn đoán — đơn thử hỏng vì chữ ký chỉ còn lịch sử Webhook Tingee để đoán. Gợi ý.
 - index.js:71 express.raw({type:'*/*'}): Tingee gửi KHÔNG kèm Content-Type thì thân không được đọc → 401. Giống SePay. Chưa có căn cứ.

KIỂM TỪNG MỤC VÒNG 1: lỗi 1 ĐÚNG nhưng thiếu ca thử; lỗi 2 ĐÚNG (nguồn lời chủ quán 06.11); lỗi 3 ĐÚNG (giuCho.js:5, :95, thanh-toan.js:140-142);
type ĐÚNG (C6 "CREDIT" / null, đột biến BẮT); VA rỗng ĐÚNG (D3 rK5 đỏ trên code cũ, đột biến BẮT); số gốc trùng ĐÚNG (D3 rK4, VS-tk-mot-trong-hai
BẮT); tin thử kết nối ĐÚNG (cai_dat_tingee.md:22-23).

1 K3: bài có giá trị; ca chặn so đúng câu kết luận (401/"09", số dòng sự kiện, trạng thái phiên, số dư ví); chỉ thiếu ca cho phần sửa tài liệu.
2 K4: tkKhac 2 chỗ (sepay.js:48, tingee.js:47), 1 chưa xử lý (nghi ngờ 1); congCuaKhoa / 'sepay:%' 4 chỗ đã xử lý hết.
3 K5: không luồng hợp lệ nào bị chặn oan (D3, C6, C5, C4, D1, D8, A4, D7); hai chỗ chưa thử với tin thật: DANG_TS, dạng số VA.
4 K1: không thấy khẳng định sai trong tingee.js:1-9, congQr.js, thanh-toan.js:226-228, cai_dat_tingee.md. ke_hoach.md:140 "Render log có dòng 401"
  — log yêu cầu của Render, không nằm trong hướng dẫn chủ quán.
5 Đường tiền: số tiền từ báo đã ký so p.con_lai; HMAC-SHA512 + timingSafeEqual, khoá rỗng → 401 (C3); phát lại: UNIQUE + kiểm trước "02" + ON CONFLICT
  (C2, C9); hai báo cùng lúc C9; hai cổng D6, D7, E2; vá res.json chỉ đổi {success:true} → "00", KHO_BAN / 5xx giữ mã khác.
6 P1: dist đã build, --day-du khớp.
7 Nghiệm thu 7/7.
8 Đơn giản: gọn; có quy tắc đối soát (doiSoat.js:240-252). Chỉ lỗi 2.

NGHIỆM THU: 7/7 mục có bằng chứng · mục thiếu: không (A: A1–A3, A2 ×7, X1, X2 · B: A1, A4, A5 ×3, D8 ×2, CongQr.jsx + dist · C: C1–C9 · D: D1–D8 ·
E: C1 ma_gd, E1 ×2, E2 · F: F1 ×2, F2 · K5: A4, D8, D3 rK3, thu_SEPAY1 + thu_CKNOIDUNG1)

CHƯA SOÁT ĐƯỢC: dạng thật của tin Tingee (độ dài x-request-timestamp, chữ `type`, vaAccountNumber có "VQR" không, có Content-Type không, tin "Kiểm
tra kết nối" có ký không); SEPAY_* trên Render còn đủ để lùi CONG_QR=sepay dựng QR không (đã xoá thì 503); màn Cài đặt chưa xem trên điện thoại; chỉ
chạy lại 3/40 đột biến; không chạy node tu_chay/cong.js chay.

BÀI HỌC:
 - KHOÁ (K3): sửa tài liệu hướng dẫn theo lời soát cũng phải có ca thử + đột biến đưa đúng câu cũ trở lại (ca F3, đột biến trả "về như cũ ngay").
 - NGUYÊN TẮC (K4): bịt một lỗ ở cổng mới (VA rỗng = số chưa cài) → grep cùng biểu thức ở cổng anh em (sepay.js:48); ngoài phạm vi thì ghi Phát hiện.
 - NGUYÊN TẮC (K5): phép kiểm dạng trên trường đã nằm trong chữ ký (DANG_TS) — giữ thì phải có đơn thử thật làm lưới, như hướng dẫn F.
```

### Vòng sửa 2 (commit 84cc3a5)
- Lỗi 1: ca F3 (`thu_TINGEE1.js`) — không "về như cũ", có "ĐÃ GỠ Webhook ở SePay" đầu file và "Webhook SePay đã gỡ … xác nhận tay" ở dòng "Không thấy";
  đột biến `VS-huong-dan-ve-nhu-cu` (trả đúng câu cũ) + `BV-huong-dan-buoc-lui-khong-noi-go` → BẮT 2/2. Gốc: 11 đạt · 46 hỏng; HEAD 75/0.
- Lỗi 2 (CongQr gọi /settings thêm một lần): KHÔNG sửa — lời soát ghi "không bắt buộc"; Settings.jsx gọi /settings ở từng thẻ (loadData theo tab),
  không có một lần gọi chung ở đầu màn để truyền xuống; thêm state chung là nhiều dòng hơn một lần gọi nhẹ khi mở màn.
- Nghi ngờ sepay.js:48 → ghi Phát hiện (dưới).

## Soát bảo mật
Lần 1 (06.11, agent độc lập, chỉ đọc, trên HEAD 16972e2, phần mới `git diff a935313 HEAD`). Trước lọc: 0 lỗi · sau lọc: 0 lỗi (không có lỗi nào
nên không chạy bước lọc). Báo cáo chép nguyên văn:
```
Không tìm thấy lỗ hổng.

Mình đã đọc toàn bộ phần mới của TINGEE-1 (`git diff a935313 HEAD`). Chỉ đọc, không sửa file, không commit. Từng điểm đã soát:

- Kiểm chữ ký (server/utils/tingee.js, hàm kiemBao): máy tính HMAC-SHA512 trên "<ts>:<thân>" rồi so bằng timingSafeEqual. Chưa đặt khoá thì mọi báo
  đều bị từ chối. Thân không phải Buffer thì cũng bị từ chối, nên thân rỗng của express.raw ({}) ra 401. Cách khớp dự phòng trên bản JSON gọn
  ('gon'): ai sửa khoảng trắng hoặc thêm khoá trùng vào một báo thật thì báo sau khi đọc ra vẫn y nguyên báo gốc, nên cùng khoá
  tingee:<transactionCode>. Kết quả: dừng ở dòng chống lặp (trả 02, hoặc ON CONFLICT DO NOTHING / changes !== 1 ở đường vào ví). Không cộng tiền hai lần.
- Chống phát lại: máy không so mốc giờ. Điều này đúng tài liệu mục 4, chủ quán đã duyệt. Chống lặp dựa vào khoá UNIQUE theo transactionCode, nằm
  trong thân đã ký. Báo không có transactionCode thì khoá là băm của thân, nhưng luôn đi nhánh boQua thành dòng khong_phien: không chốt đơn, không cộng ví.
- Số tiền: xuLyTienVe (server/routes/thanh-toan.js) so soTien với p.con_lai và kiểm tài khoản nhận qua tkKhac. Với Tingee, vaAccountNumber phải
  bằng TINGEE_SO_TK, nếu không thì ghi chua_khop chứ không chốt. Chỉ khớp đủ mới gọi chotPhien. Mọi giá trị đều lấy từ thân đã ký.
- Lộ dữ liệu: GET /settings chỉ trả tên cổng và đã cài hay chưa, có authenticate, không trả khoá. du_lieu lưu xuống bỏ clientId. Nhật ký chỉ ghi
  cách khớp chữ ký, không ghi khoá.
- Phân biệt cổng: congCuaKhoa (server/utils/congQr.js) và các câu SQL đối soát (server/utils/doiSoat.js) dùng tham số ? và tiền tố cố định. Không có
  chỗ chèn SQL.
- server/index.js: express.raw chỉ gắn cho /api/tingee/webhook, đặt trước express.json.
- Giao diện (client/src/pages/CaiDat/CongQr.jsx, client/src/pages/Settings.jsx): chỉ thêm 17 dòng React. Không có dangerouslySetInnerHTML, không có fetch trần.

CHƯA KIỂM: mình không chạy thử máy chủ hay bài thử nào. Kết luận trên chỉ dựa vào đọc code.
```
SOÁT BẢO MẬT: ĐẠT

## Soát độc lập — vòng 3 (agent, 06.11, trên HEAD 16972e2) — chép nguyên văn
```
KHÔNG ĐẠT — chỉ còn lỗi NHẸ ở chú thích. Không lỗi nào đụng tiền, ví, điểm hay bảo mật. Đường tiền, chữ ký, chống báo lặp, bài thử, đột biến vững.
Lỗi vòng 1, vòng 2 đã xử lý đúng.

Đã chạy trên HEAD 16972e2 (code cuối 84cc3a5): thu_TINGEE1 75/0; gốc 11 đạt · 46 hỏng (khớp bang_chung_do.txt dòng 7, 23, 25 — SỐ CA 75);
thu_SEPAY1 78/0; thu_CKNOIDUNG1 113/0; --day-du PASS 104 · FAIL 0 · CẢNH BÁO 2, thoát 0; dot_bien.py ĐỦ 42 đột biến: BẮT 42 · SỐNG 0 · HỎNG 0 ·
LẠC 0, đối chứng xanh (tg 75/0, sp 78/0); git status sạch sau khi chạy (bản sao trong thư mục tạm, kiểm realpath dot_bien.py:84-102).

LỖI TÌM ĐƯỢC:
 1. server/utils/giuCho.js:7-8 — chú thích "cổng SePay ghi nội dung TQD<MMM><DD> HD|APP<4 số>, cổng payOS giữ TQD<mã phiên>" chưa nhắc Tingee; Tingee
    cũng ghi nội dung số hoá đơn (tingee.js:13, :50 lấy NOI_DUNG_SO_HD; giuCho.js:71 rẽ theo đó). Cùng dạng giuCho.js:20 "(SePay dùng nội dung số
    hoá đơn, ≤ 16 ký tự)". Đúng khuôn lỗi 3 vòng 1; vòng sửa 1 sửa :5, :92 nhưng sót :7, :20. K4/K1 — NHẸ.
 2. server/routes/thanh-toan.js:228 và :245 — chú thích và lý do ghi khẳng định tin "Kiểm tra kết nối" của Portal không có transactionCode; tài liệu
    không nói vậy (tingee_tai_lieu_day_du.txt:100; tai_lieu_tingee.md:64). cai_dat_tingee.md bước 2 hứa "Đối soát có một dòng 'tin thử kết nối'".
    Tin thử mang transactionCode mẫu thì dòng ghi là "không có mã TQD trong nội dung". Hành vi vẫn an toàn (khong_phien, CẦN XEM, 200 "00").
    Nên ghi "có thể" / "chưa rõ". K1 — NHẸ.

NGHI NGỜ (không chặn): tingee.js:43 khoá dùng transactionCode thô còn maGd đã trim (không gây trùng tiền); type không trim ("credit " → khong_phien,
hỏng an toàn); sepay.js:48 "rỗng bằng rỗng" — đã ghi Phát hiện, ngoài phiếu, đồng ý không sửa; chưa thử tin thật: dạng x-request-timestamp
(DANG_TS 17 số), vaAccountNumber có "VQR" không, Content-Type (index.js:71) — đơn thử 2.000đ là lưới cho cả ba.

KIỂM TỪNG MỤC VÒNG TRƯỚC: vòng 1 lỗi 1 đúng (cai_dat_tingee.md:6-7, :28); vòng 2 lỗi 1: F3 (thu_TINGEE1.js:449-451) + VS-huong-dan-ve-nhu-cu đưa
ĐÚNG câu cũ trở lại (đối chiếu git show 4b58a47 dòng 6), cùng BV-huong-dan-buoc-lui-khong-noi-go đều BẮT; vòng 2 lỗi 2 không sửa, lý do chấp nhận
được; lỗi 2, 3 và nghi ngờ vòng 1 vẫn đúng (C6 CREDIT/null, D3 ×5, đột biến BẮT).

1 K3: đỏ trên gốc 11/46, xanh HEAD 75/0; ca chặn so đúng kết luận; hai mốc ngưỡng có ca (D5 ±1 s, D4 ±1 đồng); 42/42 đột biến BẮT đúng ca đích.
2 K4: 'sepay:%' / congCuaKhoa có cột Tingee riêng (doiSoat.js:246-247, Array(3).fill khớp 3 VAO); TEN_CONG một bảng; tkKhac tingee.js:47 vá,
  sepay.js:48 Phát hiện; chú thích sót giuCho.js:7, :20 (lỗi 1).
3 K5: VA khác hoa thường, số gốc bất kỳ, type vắng/null/CREDIT, giờ cũ 6 giờ (C4), thân thô / gọn (C5), đổi công tắc (D8), SePay (A4, 78/0) — xanh.
4 K1: thanh-toan.js:228, :245 (lỗi 2), giuCho.js:7 (lỗi 1); phần còn lại khớp; tingee_tai_lieu_day_du.txt:25 xác nhận chuỗi ký "ts:body".
5 Đường tiền: số tiền từ thân đã ký so p.con_lai (thanh-toan.js:171-172); HMAC-SHA512 + timingSafeEqual, khoá rỗng → 401; bản gọn không mở cửa giả
  mạo; phát lại: kiểm trước "02" + UNIQUE + ON CONFLICT; C9; hai cổng D6, D7 ×3, E2; vào ví chỉ khi changes = 1; vá res.json chỉ đổi {success:true}.
6 P1: client/src + client/dist cùng commit 8cf4b6f; --day-du PASS.
7 Nghiệm thu 7/7. 8 Đơn giản: gọn; quy tắc đối soát ở doiSoat.js:240-252.

NGHIỆM THU: 7/7 · mục thiếu: không (A: A1, A2 ×7, A3 ×2, X1, X2 · B: A1, A4, A5 ×3, D8 ×2, CongQr.jsx + dist · C: C1–C9 · D: D1–D8 ·
E: C1 ma_gd, E1 ×2, E2 · F: F1 ×2, F2, F3 · K5: A4, D3, D8, thu_SEPAY1 78/0, thu_CKNOIDUNG1 113/0)

CHƯA SOÁT ĐƯỢC: dạng thật tin Tingee (độ dài timestamp, chữ type, VA có "VQR", Content-Type, tin "Kiểm tra kết nối" có ký / có transactionCode);
SEPAY_* trên Render còn đủ để lùi CONG_QR=sepay; màn Cài đặt chưa xem trên điện thoại; chưa chạy node tu_chay/cong.js chay.

BÀI HỌC:
 - KHOÁ (K4): thêm giá trị mới vào một tập (nguon 'tingee', cổng có NOI_DUNG_SO_HD) → nên có phép grep chú thích liệt kê tập đó trong file vừa sửa;
   vòng 1 bắt giuCho.js:5, :92 nhưng sót :7, :20 cùng file.
 - NGUYÊN TẮC (K1): hành vi bên thứ ba tài liệu không nói (tin thử kết nối) → chú thích / hướng dẫn viết "có thể / chưa rõ"; code xử lý cả hai khả
   năng thì chữ cũng phải nói đúng như vậy.
```

### Vòng sửa 4 (commit 88a72b4) — hết 3 vòng, lần soát cuối chỉ còn lỗi NHẸ → làm thẳng theo LUAT_XAY_APP §6.5
- Lỗi 1: `giuCho.js` chú thích dòng 7–8 ("SePay và Tingee (NOI_DUNG_SO_HD) ghi nội dung …") và dòng 20 ("SePay, Tingee dùng nội dung số hoá đơn").
- Lỗi 2: `thanh-toan.js` chú thích webhookTingee + lý do ghi đổi thành "có thể là tin thử kết nối"; `cai_dat_tingee.md` bước 2: Đối soát "có thể"
  thêm một dòng "tin thử kết nối" hoặc "không có mã TQD".
- Ca thử / đột biến: KHÔNG thêm — hai lỗi chỉ là chữ (chú thích + lời ghi `ly_do` không bài nào so nguyên văn), không đổi hành vi; ca C8 (đếm dòng,
  trả "00") vẫn khoá hành vi. Sau sửa: thu_TINGEE1 75/0; `--day-du` PASS 104 · FAIL 0 · CẢNH BÁO 2 (hai cảnh báo có sẵn từ trước: route GET có lệnh
  ghi — packages.js / products.js / sync.js; route ghi không qua loiGhi 54 — không route nào của việc này).
- Soát bảo mật chạy trên 16972e2 (trước vòng sửa 4): vòng sửa 4 chỉ đổi chú thích và một chuỗi lý do ghi — không đổi đường xử lý nào.

SOÁT LẦN CUỐI: chat soát thay

## Cổng PR
`node tu_chay/cong.js chay . e9b7036^ HEAD viec/TINGEE-1` lần 1 (HEAD 88a72b4): ✗ [A16] thiếu "SỐ CA" cho thu_CKNOIDUNG1 / thu_KHMUA1 / thu_P26c /
thu_SEPAY1 — bốn bài CK-NOIDUNG-1 sửa, vào nhánh qua gộp main (mốc phiếu e9b7036 nằm trước lần gộp). Đã chạy lại bốn bài trên HEAD, chép số ca vào
bang_chung_do.txt (khớp viec/CK-NOIDUNG-1/bang_chung_do.txt 162–165), commit efa0dc9. Lần 2 (HEAD efa0dc9):
· CẢNH BÁO A16: thu_CKNOIDUNG1 gốc 109 ≠ 113 head; thu_TINGEE1 gốc 57 ≠ 75 head — bài dừng sớm trên gốc (TINGEE1: mục D dừng ở D1 vì chưa có đường).
✓ CỔNG CHẠY ĐẠT

## Đếm nghiệm thu (phiếu) — mỗi mục một dòng
- A Biến môi trường, không lộ khoá: thu_TINGEE1 A1, A2 ×7 (thiếu / sai từng biến → 503), A3 ×2 (production / uat), X1 (log + mọi thân trả về), X2
  (du_lieu không clientId / khoá); đột biến VS-thieu-client-id-van-cai, VS-moi-truong-*, VS-dang-so-tk-long, VS-lo-khoa-nhat-ky, BV-luu-client-id.
- B Công tắc CONG_QR=tingee, cổng cũ như cũ, webhook mọi cổng luôn mở, Cài đặt "Cổng QR": A1, A4, A5 ×3, D8 ×2; CongQr.jsx + dist (--day-du khớp);
  thu_SEPAY1 78/0; đột biến BV-cong-tingee, BV-cong-qr-settings, BV-ten-tingee.
- C Webhook Tingee (chữ ký, không từ chối giờ cũ, 401 không ghi, chỉ tiền vào, 200 kể cả báo lặp): C1–C9 (C3 ×7 ca chặn, C4 giờ cũ 6 tiếng, C5 thân
  thô / gọn, C6 ×4 type, C7 JSON hỏng, C8 tin lạ, C9 hai báo cùng lúc); 15 đột biến nhóm C.
- D Khớp phiên bằng luật có sẵn (nội dung mới, mã VA chèn đầu, tiền, hạn, tài khoản VA, báo một lần, hai cổng): D1 ×4, D2, D3 ×5, D4 ×2, D5 ×2,
  D6 ×2, D7 ×3, D8 ×2, C2; đột biến BV-tk-va, VS-tk-*, BV-va-rong-khop, BV-doc-gio-giao-dich, VS-cong-cua-khoa-chi-sepay, VS-noi-dung-*.
- E Mã GD lưu vào đơn, Đối soát ghi "Tingee": C1 (ma_gd = transactionCode), E1 ×2, E2 (lưới chặn tách cột Tingee); VS-luoi-gop-tingee-payos, VS-nhan-cat-6.
- F Hướng dẫn chủ quán: viec/TINGEE-1/cai_dat_tingee.md; F1 ×2, F2, F3; đột biến VS-huong-dan-* ×3, BV-huong-dan-buoc-lui-khong-noi-go.
- K5 Không đổi số tiền / ví / điểm / nội dung CK / cổng cũ: A4, B3 (nội dung CK-NOIDUNG-1), D7 (ví cộng đúng số, một lần), D8; thu_SEPAY1 78/0,
  thu_CKNOIDUNG1 113/0, thu_P26c 157/0, thu_KHMUA1 122/0; --day-du PASS 104.

## Báo cáo
```
VIỆC:        TINGEE-1 — cổng QR Tingee (Webhook biến động số dư), công tắc CONG_QR=tingee, giữ luật chống trùng / sai tài khoản
ĐÃ SỬA:      server/utils/tingee.js (mới, 50 dòng) — cauHinh / daCauHinh / taoQr (VietQR tới số VA + BIN) / kiemBao (HMAC-SHA512 thân thô hoặc
               bản gọn, timingSafeEqual, không so giờ) / docBao (vaAccountNumber, type, transactionDate giờ VN, khoá tingee:<mã>)
             server/routes/thanh-toan.js — webhookTingee: 401 code "09", 400 thân hỏng, "02" báo lặp, "00" ghi nhận, tin không mã → khong_phien;
               dùng chung xuLyTienVe; TEN_CONG lấy từ congQr
             server/utils/congQr.js — CONG.tingee, TEN_CONG một bảng, congCuaKhoa theo tiền tố, tenCongQr
             server/utils/sepay.js — tách docNoiDung (dùng chung, hành vi SePay giữ nguyên — thu_SEPAY1 78/0)
             server/utils/doiSoat.js — nhãn "<cổng> giao dịch <mã>", lưới chặn ghi tiền vượt có cột Tingee
             server/index.js — express.raw + gắn /api/tingee/webhook; server/routes/settings.js — cong_qr { ten, da_cai }
             server/utils/giuCho.js — chỉ chú thích
             client/src/pages/CaiDat/CongQr.jsx (mới) + Settings.jsx — dòng "Cổng QR: Tingee ✓ / chưa cài ✗"; client/dist build lại
             kiem_tra_truoc_khi_giao.js — chạy cong_cu/thu_TINGEE1.js; viec/TINGEE-1/cai_dat_tingee.md — hướng dẫn chủ quán
BÀI THỬ:     cong_cu/thu_TINGEE1.js chạy trên bản chưa vá (a935313) → ĐỎ 11 đạt · 46 hỏng (404 đường Tingee, 503 cổng, thiếu cong_qr, E2 lưới chặn
             gộp Tingee vào payOS, T1–T3, F1–F3); sau khi vá → XANH 75 đạt · 0 hỏng. 42 đột biến (VS / BV) BẮT 42/42, đối chứng xanh.
ĐÃ RÀ K4:    grep "'sepay'|sepay:|congCuaKhoa|TEN_CONG" trong server/ client/src → congQr.js, thanh-toan.js (3 chỗ), doiSoat.js (3 chỗ), settings.js —
             đã xử lý hết; grep "tkKhac" → tingee.js (vá rỗng-bằng-rỗng), sepay.js:48 (cùng lỗ, ngoài phiếu → Phát hiện); chú thích liệt kê cổng /
             nguon trong giuCho.js (4 chỗ), thanh-toan.js (5 chỗ), index.js (2 chỗ) — đã thêm Tingee.
CHƯA KIỂM:   - Chưa có tin Tingee THẬT nào: độ dài x-request-timestamp (máy đòi đúng 17 số), chữ của `type`, vaAccountNumber có "VQR" đầu không,
               có Content-Type không, tin "Kiểm tra kết nối" có ký / có transactionCode không. Sai một trong số đó → báo bị 401 hoặc rơi vào
               "tài khoản khác" (hỏng an toàn, không mất tiền) — đơn thử 2.000đ ở hướng dẫn F là phép thử thật duy nhất.
             - Chữ ký: tài liệu mục 2 nói Tingee ký trên JSON.stringify; máy thử cả thân thô lẫn bản gọn — chưa biết Tingee thật dùng cách nào.
             - Ngân hàng MB chèn mã VA đầu nội dung: dựa lời chủ quán 06.11 ("Qanjmg7944 PAY36510 …"); bài thử phủ hoa / thường / dính liền.
             - Lối lùi CONG_QR=sepay: Webhook SePay đã gỡ → lùi về là xác nhận tay; SEPAY_* trên Render còn đủ không thì máy không thấy.
             - Màn Cài đặt chưa xem trên điện thoại (thao tác thử tay: mở Cài đặt → thấy dòng "Cổng QR: Tingee ✓").
             - Không gọi Tingee thật (phiếu cấm); không thử trên Render / Turso.
GIT:         fe2e7ef TINGEE-1 soat vong 3 + vong sua 4 (chat soat thay), cong DAT, dem nghiem thu, bao cao 7 muc, bai hoc
             efa0dc9 TINGEE-1 bang chung: SO CA cua 4 bai CK-NOIDUNG-1 (vao nhanh qua gop main)
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 3 · BỎ 3 — chi tiết ở ## Bài học
```

## Bài học
Sự cố của việc: (1) người gác chặn kéo main / merge / đọc GitHub (GIT-KEO, GIT-LENH, CC-LA) → phiên 1 dừng hỏi, chat gộp hộ; (2) người gác chặn
lệnh ghép (B-PHANTICH ×4, B-CD-VITRI, GIT-TUYCHON, B-CHUONGTRINH `until`, B-BIMAT-CHU khi script Python có chữ khoá) → tách lệnh / dùng Edit;
(3) bài thử đỏ bất ngờ trên code đã vá ×2: E2 dùng `p.ma_payos` (tomPhien không trả trường này), B1 dựa thứ tự khoá object JS (khoá dạng số xếp
trước) — lỗi của bài, không phải code; (4) đột biến VS-huong-dan-khong-quay-lai SỐNG → F1 tìm chuỗi ở bất kỳ đâu; (5) soát 3 vòng: hướng dẫn hứa
"về như cũ" trái phiếu, câu "đã cài" không nguồn, chú thích enum sót (2 lần, cùng file), khẳng định tin thử kết nối không có tài liệu.
- KHOÁ (đã làm, trong Phạm vi): ca F2 (dòng "Không thấy … `CONG_QR=sepay` NGAY") + F3 (không hứa "về như cũ", nói Webhook SePay đã gỡ) kèm đột biến
  đưa đúng câu cũ trở lại — hướng dẫn chủ quán giờ có bài canh từng câu hứa.
- KHOÁ (đề xuất, ngoài Phạm vi): `kiem_tra_truoc_khi_giao.js` / cổng — phép "thêm giá trị vào tập `nguon` hay tên cổng (TEN_CONG) → mọi chú thích
  liệt kê tập đó trong server/ phải có giá trị mới": quét chú thích có chuỗi `payos · sepay` / `payOS / SePay` mà thiếu `tingee`. Ca đỏ: giuCho.js:7
  ở 6178e6c (sót qua vòng sửa 1).
- NGUYÊN TẮC (đề xuất KHUON_LOI K1, ngoài Phạm vi): "Hướng dẫn cho chủ quán là khẳng định — câu về trạng thái ('đã cài', 'về như cũ', 'Đối soát sẽ có
  dòng …') phải có nguồn trong phiếu / sổ / tài liệu; hành vi bên thứ ba tài liệu không nói thì viết 'có thể'." Ví dụ: TINGEE-1 cai_dat_tingee.md:6
  "về như cũ ngay" trong khi phiếu ghi Webhook SePay đã gỡ.
- NGUYÊN TẮC (đề xuất KHUON_LOI K4, ngoài Phạm vi): "Bịt một lỗ ở cổng mới → grep cùng biểu thức ở cổng anh em" — tingee.js `va && va === …` còn
  sepay.js:48 `tk === …` (rỗng bằng rỗng). Ghi Phát hiện, việc sau.
- NGUYÊN TẮC (đề xuất KHUON_LOI K3, ngoài Phạm vi): "Bài thử đọc object trả về của API: tra hàm dựng câu trả lời (tomPhien) trước khi dùng một trường;
  đọc TLV / bảng mã bằng thứ tự key của object JS là sai với key dạng số."
- BỎ: người gác chặn lệnh ghép / heredoc có chữ khoá — luật đã có, chỉ cần nhớ tách lệnh (lặp nhưng đã có hướng dẫn trong lỗi người gác).
- BỎ: kéo main bị chặn — chủ quán đã quyết gộp là việc của người (30.10); lần này chat gộp hộ, đúng quy trình.
- BỎ: cổng A16 đòi SỐ CA cho bài của việc khác vì mốc phiếu nằm trước lần gộp main — một lần, xử lý bằng chép số ca thật (khớp hồ sơ CK-NOIDUNG-1).

HEAD ĐÃ KIỂM: efa0dc9
