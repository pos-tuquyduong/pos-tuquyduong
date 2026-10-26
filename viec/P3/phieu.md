# P3 — Chuyển khoản qua QR payOS tự xác nhận · PIN khách · giữ rồi trừ tài khoản / điểm

<!-- Phiếu do chat soạn 24.10.2026. Việc tiền [T] — Opus, máy lập kế hoạch, dừng chờ chủ quán duyệt. Nền: main `bd9b920`.
     Đặc tả: ban_mau_pos/DAC_TA_BAN_HANG_2410.md mục 1 (10–14) và mục 2 — chủ quán chốt 22–24.10, đừng hỏi lại các điểm đó.
     payOS (chủ quán ĐÃ có tài khoản; Render CHƯA nâng gói trả phí): theo hiểu biết của chat — tạo link/QR bằng API merchant với
     x-client-id + x-api-key, chữ ký HMAC-SHA256 bằng checksum key; payOS gọi webhook về máy chủ kèm chữ ký trên `data`. MÁY PHẢI ĐỐI
     CHIẾU tài liệu chính thức payOS (payos.vn/docs) trước khi viết; không đọc được → ghi `## Câu hỏi`, đừng đoán định dạng chữ ký.
     Khoá chỉ ở biến môi trường Render (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY) — không ghi vào kho, log, chat.
     Phát hiện cũ phải sửa luôn (P15-QR, 22.10): GET /api/pos/customers/qr/:code trả cả `password` và `pin_code`.
     Chạy SONG SONG với P24 (P24 sửa huỷ / xoá + bất biến I8). Vì vậy P3 KHÔNG sửa giả lập / bất biến / cách tính điểm cộng:
     "điểm chỉ trên tiền thật" tách thành DIEM-THAT-1 (chạy sau P24); đơn tạo qua P3 vẫn tính điểm bằng `tinhDiemDon` HIỆN CÓ. Màn quầy mới (BH-1) và App KH (KH-MUA-1) DÙNG API của việc này — không làm giao diện ở đây.
     Việc lớn: kế hoạch ĐƯỢC đề xuất tách P3 thành 2 nhánh (vd payOS / PIN-giữ-điểm) nếu thấy an toàn hơn — nêu ở đầu kế hoạch. -->

**Chờ duyệt kế hoạch:** viết `viec/P3/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

**Đã duyệt (chủ quán 24.10, sau khi chat soát kế hoạch `ke_hoach.md` đầu nhánh `7d1cc3c`):** kế hoạch được duyệt, MỤC 8 (soát độc lập)
thay chỗ tương ứng ở mục 1 / 3; máy làm tiếp từ bước 4 (`/lam-viec P3 tiep`) tới hết, không dừng hỏi lại các điểm này:
1. TÁCH: P3 KHÔNG làm phần điểm (giữ / đổi điểm trong phiên, PIN cho đổi quà, `/loyalty/redeem`). Phần đó là việc P3b, chat mở sau
   UUDAI-1. P3 làm: phiên + payOS + webhook + xác nhận tay + PIN + giữ / trừ TIỀN tài khoản.
2. Q1 (a): cài đặt `thanh_toan_payos_bat_buoc`, mặc định `0` (đường cũ như cũ); bật `1` thì `POST /orders` từ chối `transfer_amount > 0`
   (`CK_PHAI_QUA_PAYOS`) và trừ tài khoản ngoài phiên (`VI_PHAI_QUA_PIN`). Chủ quán bật khi BH-1 lên quầy. `pay-debt`, `doi-cach-tra`:
   ghi Phát hiện, không sửa.
3. Q2: `server/routes/backup.js` đã thêm vào Phạm vi — CHỈ thêm bảng mới vào `BACKUP_TABLES` và `BANG_KHONG_KHOI_PHUC`. Phát hiện
   "khôi phục `pos_customers` ghi đè PIN": KHÔNG làm ở P3 (chat ghi việc sau; khôi phục vốn chỉ owner).
4. Q4: trừ tài khoản nào thì PIN của CHỦ tài khoản đó (tài khoản mẹ → PIN của mẹ).
5. Q5 + payOS (chat đã đối chiếu tài liệu chính thức payos.vn/docs/api 24.10): `description` TỐI ĐA 9 KÝ TỰ (giới hạn của payOS với
   tài khoản ngân hàng không liên kết qua payOS) → dạng `TQD<mã phiên>`, không dấu cách, ≤ 9 ký tự (mã phiên dài hơn → báo lỗi có mã,
   không cắt); `expiredAt` = Unix timestamp tính bằng GIÂY (Int32) = hạn phiên 10 phút. Bài thử có ca nội dung ≤ 9 ký tự.
6. Q6: đồng ý — quầy chỉ đặt PIN khi khách CHƯA có; đổi PIN ở App KH; quên PIN → owner / manager "Xoá PIN" (quyền mới `xoa_pin_khach`,
   seed owner 1 / manager 1 / staff 0, lý do bắt buộc, ghi nhật ký), route ở `thanh-toan.js`.
7. Q7: giá trị `pin_code` không mở đầu `$2` (không phải băm bcrypt) coi như CHƯA đặt PIN; không bao giờ so chuỗi thô.
8. Một dòng `module.exports.taoDon = taoDon` cạnh `module.exports = router` của `orders.js` — được phép (ngoài vùng `POST /`).
9. Q-phụ: "về muộn" theo `transactionDateTime` payOS ký (> `het_han`); không đọc được thì giờ máy chủ. Phiên `ck_tay` (QR tĩnh) CHỈ
   chốt bằng xác nhận tay — đồng ý.
10. Sửa lời báo số dư ở `orders.js:752–772` cho đọc số KHẢ DỤNG (trừ đang giữ) — được phép (trong thân `POST /`).
11. Theo mục 8.8: KHÔNG sửa `customers-v2.js` (dòng đó còn trong Phạm vi, không dùng).

## Mục tiêu
Chuyển khoản không còn phụ thuộc nhân viên nhìn app ngân hàng: máy chủ tạo QR đúng số tiền cho từng đơn và tự ghi "đã thu" khi payOS báo
tiền về. Tiền trong tài khoản khách và điểm chỉ tiêu được khi khách nhập PIN, được GIỮ trong lúc chờ và chỉ TRỪ khi đơn thật sự xong.

## Nghiệm thu
- A Tạo QR: API tạo "phiên thanh toán" cho một đơn đang lập (giỏ do máy chủ tính lại, không tin số tiền từ máy khách) → gọi payOS với
  đúng PHẦN CÒN LẠI (sau giữ tài khoản), mã đơn payOS duy nhất, nội dung ngắn có số bill, hết hạn 10 phút → trả QR + mã phiên.
  Chưa có khoá payOS → lỗi có mã (vd `PAYOS_CHUA_CAU_HINH`) để quầy dùng dự phòng (QR tĩnh + xác nhận tay).
- B Webhook payOS (cửa công khai, không cần đăng nhập): sai chữ ký → từ chối, không ghi gì. Đúng chữ ký + khớp mã phiên + khớp số tiền →
  MỘT giao dịch: tạo đơn đã thu (cách trả chuyển khoản payOS), trừ phần đang giữ, ghi điểm, trừ kho như đơn quầy. Báo lại nhiều lần / hai
  báo cùng lúc → chỉ ghi MỘT lần. Lệch số tiền, hoặc tiền về sau khi phiên đã hết hạn / huỷ → KHÔNG tạo đơn, ghi bảng "tiền về chưa khớp"
  để Đối soát cảnh báo đỏ.
- C Quầy hỏi trạng thái phiên (đang chờ / đã thu + mã đơn / hết hạn / huỷ). Máy khách KHÔNG có cách nào tự đánh dấu "đã thu chuyển khoản".
- D Xác nhận tay: chỉ owner / manager (quyền mới, seed như các quyền khác), bắt buộc lý do, ghi nhật ký; Đối soát hiện riêng các đơn này.
- E PIN: đặt PIN 4 số (quầy: khách gõ 2 lần; App KH: qua `/api/kh`), lưu BĂM (bcryptjs đã có) ở `pos_customers.pin_code`; kiểm ở máy chủ;
  sai 5 lần → khoá dùng tài khoản + điểm của khách đó 15 phút; chưa có PIN → không trừ tài khoản / đổi điểm được (lỗi có mã).
  GET `/customers/qr/:code` (và mọi đường trả khách) KHÔNG trả `password`, `pin_code`.
- F Giữ: PIN đúng → giữ số tiền tài khoản (và tài khoản mẹ nếu dùng) + số điểm đổi quà cho phiên đó. Số dư khả dụng ở MỌI nơi tiêu
  (quầy, App KH, trừ tay, đổi quà) = số dư − đang giữ. Phiên xong (tiền mặt nhận / payOS báo về / tài khoản trả đủ) → trừ + ghi đơn một
  giao dịch; huỷ / hết hạn → nhả, không ghi dòng tiền nào.
- G Điểm cộng: GIỮ NGUYÊN cách tính hiện tại (`tinhDiemDon`, gọi như đường tạo đơn đang có). Đổi công thức là việc DIEM-THAT-1.
- H Một đơn KHÔNG trả kết hợp tiền mặt + chuyển khoản (máy chủ từ chối). Tài khoản + một cách trả cho phần còn lại thì được.
- I K5: tiền mặt, số dư đủ, giao từ gói (0đ), mua gói / thẻ trả đủ, đơn nợ CŨ thu ở `pay-debt` — chạy như cũ. Giả lập quầy
  (`cong_cu/gia_lap/**`) và `thu_gia_lap.js` phải vẫn XANH mà không cần sửa.
- J Bài thử: KHÔNG gọi payOS thật; giả lập webhook với khoá thử trong kho tạm (chữ ký đúng / sai / báo lặp / lệch tiền / về muộn).

## Phạm vi
- viec/P3/**
- server/routes/orders.js
- server/routes/thanh-toan.js
- server/utils/payos.js
- server/utils/giuCho.js
- server/utils/pinKhach.js
- server/routes/wallets.js
- server/routes/customers.js
- server/routes/customers-v2.js
- server/routes/backup.js
- server/routes/kh/index.js
- server/index.js
- server/database.js
- server/utils/doiSoat.js
- env.example
- cong_cu/thu_P3.js
- cong_cu/thu_KH1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — bài mới `cong_cu/thu_P3.js` (máy chủ thật trên kho tạm + webhook giả lập) phải ĐỎ trên code gốc.

## Ngân sách
Code ~400 dòng (phần lớn ở file mới), thử ~450. Vượt 1,5 lần → giải thích, hoặc đề xuất tách nhánh.
**Vùng sửa của file chung:** `orders.js` CHỈ `POST /` (cách trả) — KHÔNG đụng `tinhDiemDon`, `pay-debt`, `PUT /:id/cancel`, `DELETE /:id`
(P24 sửa song song). `server/index.js`: chỉ gắn route mới (một khối). `database.js`: chỉ THÊM bảng/cột. `customers.js`: chỉ bỏ
`password` / `pin_code` khỏi các câu trả. `kiem_tra_truoc_khi_giao.js`: chỉ thêm tên `cong_cu/thu_P3.js` vào CUỐI mảng bài chạy thật
(dòng ~495) — P24 cũng thêm vào mảng đó; script gộp của chat giữ cả hai tên, đó là đụng nhau đã biết.
Ca Đối soát (tiền về chưa khớp, xác nhận tay) viết trong `thu_P3.js`, KHÔNG sửa `thu_DOISOAT1.js` (P24 đang sửa).
**Phương án đơn giản nhất đã xét:** một bảng "phiên thanh toán" chứa giỏ đã tính + phần giữ + trạng thái; webhook / tiền mặt / tài khoản
đều đi qua MỘT hàm "chốt phiên" tạo đơn bằng đúng đường tạo đơn hiện có.

## Đổi cấu trúc DB
có — chỉ THÊM: bảng phiên thanh toán (giữ tiền / điểm, hết hạn), bảng sự kiện payOS (chống trùng, tiền về chưa khớp), cột đếm sai PIN +
khoá đến lúc nào (hoặc bảng riêng). Không xoá, không đổi tên. Bảng mới vào `BACKUP_TABLES` nếu chứa tiền.

## Thư viện mới
không (chữ ký dùng `crypto` của Node, gọi payOS bằng `fetch` sẵn có)

## Cấm
- KHÔNG làm giao diện (client/**, app_kh/**) — BH-1 và KH-MUA-1 làm sau.
- KHÔNG ghi khoá payOS thật vào bất kỳ file, log, bài thử nào. Không gọi payOS thật trong bài thử.
- KHÔNG đổi luật huỷ đơn / điểm âm (P24), công thức điểm (DIEM-THAT-1), giá hạng (UUDAI-1), topping (TOPPING-1), giao hàng (GIAO-1).
- KHÔNG sửa `cong_cu/gia_lap/**`, `cong_cu/thu_gia_lap.js`, `cong_cu/thu_P2223.js`, `cong_cu/thu_DOISOAT1.js`, `server/routes/signup-codes.js`.
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/P3`. Không đụng main, không merge, không tạo PR.
