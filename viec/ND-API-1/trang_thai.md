# ND-API-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- 13.11: nhánh `viec/ND-API-1`; cây sạch; HEAD `bbf5eaf` = FETCH_HEAD `bbf5eaf` (bằng nhau — không kéo).
  ```
  bbf5eaf PHIEU: ND-API-1
  4434ad5 TIEN-DO: HUY-1 xong (171109f); mo QC-APP-1 (Sonnet) + ND-API-1 (Opus lan 2) — so v64
  171109f Merge pull request #91 from pos-tuquyduong/viec/HUY-1
  ```
- 14.11 (làm tiếp, sau chủ quán duyệt): nhánh `viec/ND-API-1`; cây sạch; HEAD `e000592` = FETCH_HEAD `e000592` (bằng nhau — không kéo; hook mở
  phiên đã kéo `bbf5eaf → e000592`).
  ```
  e000592 PHIEU: ND-API-1 duyet ke hoach, tra loi Q-A..Q-H + chep thu App 11.11 — chu quan 13.11
  41143b6 ND-API-1: trang thai ghi du Q-H
  b6b00bd ND-API-1: ghi ket qua bo kiem (kho nong -> unshallow, npm test xanh)
  ```
- 14.11: kho lại mở ở dạng NÔNG → `thu_BH2.js` G1 đỏ `bad revision 'cbbb809..HEAD'` (như 13.11) → `git fetch -q --unshallow origin viec/ND-API-1`.

## Tiến độ
- 13.11 — bước 2 (đọc) xong; bước 3: `ke_hoach.md` viết xong, agent phụ soát. Phiếu: "CÓ kế hoạch chủ quán duyệt" → commit, push, DỪNG chờ duyệt.
- 14.11 — chủ quán duyệt (phiếu `e000592`). Bước 4: `cong_cu/thu_NDAPI1.js` (commit `bf31eaa`) ĐỎ trên gốc; bước 5: mã máy chủ + quầy + hợp đồng;
  bước 6: bài 73 đạt · 0 hỏng, `npm test` PASS 114 · FAIL 0.

## Làm theo thư App / trả lời chủ quán — chỗ khác kế hoạch (ghi rõ)
- `POST /quay-lai` gửi `{ so, ban_goc }` (thư App 11.11 mục 1) — kế hoạch viết `so_ban`; theo thư (Q-F).
- `GET /nhap` trả `so_ban` của bản đang chạy (thư: "toàn bộ nháp + `so_ban` đang chạy") — kế hoạch viết `ban_dang_chay`; theo thư.
- Q-A (chủ quán sửa 13.11): đếm sai theo CẶP `cap:<tên>|<ip>` VÀ theo `ip:<ip>` (bảng `nd_lan_sai`), không khoá tên toàn cục. Đăng nhập đúng đặt lại
  bộ đếm của cặp đó + IP đó — nên bộ đếm cặp mới có nghĩa: kẻ có một tài khoản thật xen đăng nhập đúng để xoá bộ đếm IP vẫn bị bộ đếm cặp chặn ở
  tên đang dò (ca G4d). `routes/auth.js` KHÔNG đụng (DANGNHAP-1).
- "Kho trống" của `nhap-toan-bo` = không bản, không nháp, không ảnh. Nhật ký KHÔNG tính (kế hoạch ghi "4 bảng"): `GET /xuat` ghi một dòng nhật ký
  `xuat`, nên máy mới mà tác vụ sao lưu đêm gọi trước thì sẽ không bao giờ nhập được. Nhật ký trong tệp nối tiếp nhật ký đang có (ca I1 so phần đầu).
- Ảnh: multer coi tệp ĐÚNG bằng `fileSize` là vượt → nhận tới 512.001 byte rồi tự so (ảnh đúng 512.000 byte qua — ca D4 bắt được lỗi này).
- Thẻ "📱 App khách hàng" trong nhóm Hệ thống, chỉ hiện với chủ quán (`isAdmin`); mã ở `client/src/pages/CaiDat/AppKhachHang.jsx`.

## Chỗ vá → đột biến (`viec/ND-API-1/dot_bien.py`, chạy từng tên, có đối chứng)
| Chỗ vá | Đột biến (ca phải bắt) |
|---|---|
| `nd/duong.js` CORS hai tên miền | VS-CORS-SAO (H1b) |
| `index.js` gắn /api/nd TRƯỚC cors chung | VS-GAN-SAU-CORS (H1b) |
| `nd/duong.js` 404 trong router | BV-404-TRONG-ND (C4) |
| `nd/duLieu.js` capNhat so ban_goc trong giao dịch | BV-BAN-GOC (E1) |
| `nd/duLieu.js` quayLai so ban_goc | BV-BAN-GOC-QUAY-LAI (E4) |
| `027` chỉ mục một bản đang chạy | BV-CHI-MUC-MOT (B3) |
| `nd/xacThuc.js` đọc lại quyền mỗi lần | VS-QUYEN-VE (F3) |
| `nd/xacThuc.js` đọc lại is_active | BV-IS-ACTIVE (F4) |
| `027` gieo quyền manager 0 | VS-GIEO-MANAGER (F2) |
| `routes/users.js` nhóm quyền | BV-NHOM-QUYEN (F1) |
| `client/src/utils/api.js` đường Lưu phân quyền | BV-DUONG-LUU-QUYEN (F3a) |
| `nd/xacThuc.js` khoá ký vé dẫn xuất | VS-KHOA-CHUNG (G2c) |
| `nd/xacThuc.js` aud 'nd' | BV-AUD (G5) |
| `nd/xacThuc.js` một câu sai chung | VS-LOI-RIENG-KHOA (G3) |
| `nd/tinh.js` ngưỡng 5 | VS-NGUONG-6 (G4a) |
| `nd/xacThuc.js` đếm theo IP | BV-DEM-IP (G4c) |
| `nd/xacThuc.js` đếm theo cặp tên + IP | BV-DEM-CAP (G4d) |
| `nd/xacThuc.js` không khoá tên toàn cục (Q-A) | VS-KHOA-TEN-TOAN-CUC (G4b) |
| `nd/tinh.js` khoá ≤ 80 | VS-KHOA-81 (D1) |
| `nd/tinh.js` đo byte UTF-8 | VS-DEM-KY-TU (D3) |
| `nd/duLieu.js` luuNhap chặn > 1 MB | BV-LUU-QUA-LON (D3) |
| `nd/duong.js` multer ảnh ≤ 512.000 | BV-ANH-512, VS-ANH-MULTER-BANG (D4) |
| `nd/duong.js` loại ảnh theo byte | VS-ANH-THEO-TEN (D5) |
| nhà riêng: chỉ cauNoi.js chạm bảng POS | VS-POS-TRONG-ND (A1) |
| `nd/xacThuc.js` khoá sao lưu chỉ GET /xuat | VS-KHOA-SAO-LUU-MOI-CUA (J2) |
| `nd/duLieu.js` khoá đã thu hồi | BV-THU-HOI (J3) |
| `nd/khoaSaoLuu.js` PIN chủ quán | BV-PIN-KHOA (J4) |
| `nd/duLieu.js` nhập chỉ vào kho trống | VS-NHAP-DE (I2) |
| `nd/duLieu.js` xuất đủ ảnh | VS-SAO-LUU-BO-ANH (C1b / I1) |
| `routes/backup.js` trang Nội dung App (JSON) | BV-TRANG-ND (K1) |
| `routes/backup.js` không ghi trang thô nd_* | VS-ND-THO-EXCEL (K1) |
| `routes/backup.js` khôi phục lọc nd (BANG_KHOI_PHUC) | BV-LOC-ND-KHOI-PHUC (K2) |
| `utils/donThu.js` nd_* không dọn | BV-ND-DON-THU (K3) |
| `Settings.jsx` thẻ App khách hàng chỉ chủ quán | BV-THE-CHI-CHU-QUAN (S1) |
| (soát 1) `nd/tinh.js` tệp nhập: bản đang chạy = số lớn nhất | BV-BAN-CHAY-LON-NHAT (I3) |
| (soát 1) `nd/duLieu.js` nhập trả `so_luong_ban` | VS-TEN-SO-BAN (I1c) |
| (soát 1) `nd/duLieu.js` hết 15 phút thì mở khoá (ca hồi quy G4e) | BV-HET-KHOA (G4e) |
| (soát 2) `nd/xacThuc.js` xem khoá trước khi đếm | BV-KIEM-KHOA-TRUOC (G4f) |
| (soát 2) `nd/tinh.js` tệp không bản hợp lệ | VS-BAN-RONG-CHAN (I4) |
| (soát 2) `nd/tinh.js` nhập: bản ≤ 1 MB, ảnh ≤ 512.000 | BV-NHAP-BAN-1MB, BV-NHAP-ANH-512 (I3f) |
| (soát 2) `nd/duLieu.js` kho trống = bản + nháp + ảnh | VS-KHO-TRONG-CHI-BAN (I2b) |
| (soát 2) `nd/duLieu.js` doiBan chặn > 1 MB | BV-DOIBAN-1MB (D7) |
| (soát 2) `nd/duong.js` ghi chú ≤ 500 | VS-GHI-CHU-5000 (E2c) |
| (soát 3) `nd/duong.js` ghi chú: ngưỡng 500 qua + cửa quay-lai | VS-GHI-CHU-499, BV-GHI-CHU-QUAY-LAI (E2d) |
| (soát 3) `nd/tinh.js` nhập: bản chạy + nháp ≤ 1 MB, khoá nháp, ảnh / số bản trùng, việc nhật ký | BV-NHAP-NHAP-1MB, BV-NHAP-NHAP-KHOA, BV-NHAP-ANH-TRUNG, BV-NHAP-SOBAN-TRUNG, BV-NHATKY-VIEC (I3h) |
| (soát 3) nhật ký nhap / xuat | BV-NHATKY-NHAP, BV-NHATKY-XUAT (I1d) |
| (soát 3) `routes/backup.js` bọc lỗi nội dung App | BV-BOC-LOI-ND (K4) |
| (soát 3) `nd/duLieu.js` xuất đọc lại / ném | VS-XUAT-KHONG-DOC-LAI (X1), BV-XUAT-THROW (X2) |
| (soát 3) no-store, trần tên khoá 60, tên đăng nhập 100 | BV-NO-STORE (C2), VS-TEN-KHOA-61 (J1b), VS-TEN-DN-101 (G6) |

Tên đột biến: VS-CORS-SAO, VS-GAN-SAU-CORS, BV-404-TRONG-ND, BV-BAN-GOC, BV-BAN-GOC-QUAY-LAI, BV-CHI-MUC-MOT, VS-QUYEN-VE, BV-IS-ACTIVE,
VS-GIEO-MANAGER, BV-NHOM-QUYEN, BV-DUONG-LUU-QUYEN, VS-KHOA-CHUNG, BV-AUD, VS-LOI-RIENG-KHOA, VS-NGUONG-6, BV-DEM-IP, BV-DEM-CAP, VS-KHOA-TEN-TOAN-CUC,
VS-KHOA-81, VS-DEM-KY-TU, BV-LUU-QUA-LON, BV-ANH-512, VS-ANH-MULTER-BANG, VS-ANH-THEO-TEN, VS-POS-TRONG-ND, VS-KHOA-SAO-LUU-MOI-CUA, BV-THU-HOI,
BV-PIN-KHOA, VS-NHAP-DE, VS-SAO-LUU-BO-ANH, BV-TRANG-ND, VS-ND-THO-EXCEL, BV-LOC-ND-KHOI-PHUC, BV-ND-DON-THU, BV-THE-CHI-CHU-QUAN,
BV-BAN-CHAY-LON-NHAT, VS-TEN-SO-BAN, BV-HET-KHOA, VS-BAN-RONG-CHAN, BV-NHAP-BAN-1MB, BV-NHAP-ANH-512, VS-KHO-TRONG-CHI-BAN, BV-DOIBAN-1MB,
VS-GHI-CHU-5000, BV-KIEM-KHOA-TRUOC, VS-GHI-CHU-499, BV-GHI-CHU-QUAY-LAI, BV-NHAP-NHAP-1MB, BV-NHAP-NHAP-KHOA, BV-NHAP-ANH-TRUNG,
BV-NHAP-SOBAN-TRUNG, BV-NHATKY-VIEC, BV-NHATKY-NHAP, BV-NHATKY-XUAT, BV-BOC-LOI-ND, VS-XUAT-KHONG-DOC-LAI, BV-XUAT-THROW, BV-NO-STORE, VS-TEN-KHOA-61,
VS-TEN-DN-101.

Lần chạy 1 (14.11): 31/34 BẮT — BV-ANH-512 SỐNG (dòng tự so cỡ ảnh trong duong.js là THỪA: multer đã chặn 512.001 → đã xoá dòng, đột biến đổi
sang giới hạn multer + thêm VS-ANH-MULTER-BANG); VS-SAO-LUU-BO-ANH LẠC (đoạn I của bài SẬP khi tệp không có ảnh → bài sửa cho chịu được, ca đỏ);
BV-ND-DON-THU LẠC (đột biến viết sai cú pháp — `];` dính vào dòng chú thích). Sửa xong 4/4 BẮT.
Lần chạy 2 (14.11, HEAD c68166ad): `ĐỐI CHỨNG XANH · 73 đạt · 0 hỏng` · `TỔNG 35 đột biến · BẮT 35 · SỐNG 0 · HỎNG 0 · LẠC 0`.
Lần chạy 3 (14.11, sau vòng sửa 1, HEAD 9af8b11d): `ĐỐI CHỨNG XANH · 75 đạt · 0 hỏng` · `TỔNG 38 đột biến · BẮT 38 · SỐNG 0 · HỎNG 0 · LẠC 0`.

## Soát độc lập — vòng 1 (14.11, agent general-purpose, báo cáo chép nguyên văn phần kết luận)
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. server/nd/tinh.js:84 (kiemTepNhap) + server/nd/duLieu.js:62 (doiBan: `moi = cu.so_ban + 1`) + duLieu.js:122 (nhapToanBo)
   — Tệp nhập chỉ bị buộc "đúng MỘT bản đang chạy", không buộc bản đó là số lớn nhất. Đã chạy thật trên kho tạm: nhập tệp có bản 1
   đang chạy + bản 2 → 200. Sau đó PUT nhap 200, nhưng cap-nhat → 500 LOI_MAY_CHU và quay-lai → 500 (chèn so_ban 2 trùng khoá chính).
   Kho kẹt vĩnh viễn. — Khuôn K4 + K3.
2. server/nd/duLieu.js:159 (giuLuot `WHERE khoa_den IS NULL OR khoa_den <= ?`) — nhánh "hết 15 phút thì mở khoá" không có ca nào; đột biến
   bỏ `OR khoa_den <= ?` → 73 đạt · 0 hỏng, SỐNG. — Khuôn K3.
3. server/nd/duLieu.js:140 + HOP_DONG_API_ND.md:39 — nhap-toan-bo trả `so_ban: du.ban.length` (SỐ LƯỢNG bản); mọi cửa khác `so_ban` là SỐ
   của bản. — LUAT §1.4 / K1.
4. viec/ND-API-1/trang_thai.md — dòng "Lần chạy 2" chưa commit lúc soát. — K7.
NGHI NGỜ: "5 lần / 15 phút" đếm liền (không cửa sổ thời gian); CORS chỉ hai tên miền đúng chữ phiếu (www.tuquyduong.com / bản xem trước
*.app-kh.pages.dev sẽ bị chặn); L1 không so cột quyen; khoiPhuc.js:74 chuanHoaGio chạy trên MỌI bảng của file CŨ; trang nd bỏ qua với mã chung
BANG_LA; nd_lan_sai không bao giờ dọn; backup.js:248 export-all chỉ authenticate (Phát hiện cũ, ngoài Phạm vi).
NGHIỆM THU: 14/14 mục có bằng chứng (G thiếu ca hết hạn khoá — lỗi 2; I thiếu ca bản chạy không phải số lớn nhất — lỗi 1)
CHƯA SOÁT ĐƯỢC: Turso thật; số tầng proxy Render; giao diện điện thoại; tên miền thật của App.
BÀI HỌC: KHOÁ — đường nhập / khôi phục vào bảng có bất biến phải kiểm CÙNG bất biến với đường ghi thường + ca "hợp lệ về dạng, sai bất biến";
KHOÁ — giới hạn có thời gian phải có ca hết hạn + đột biến "khoá vĩnh viễn"; NGUYÊN TẮC — một tên trường một nghĩa trên mọi cửa;
NGUYÊN TẮC — khối máy đọc của hợp đồng so ĐỦ cột.
```
**Vòng sửa 1 (máy):** lỗi 1 → `tinh.kiemTepNhap` buộc bản đang chạy = số lớn nhất + ca I3e (ĐỎ trên HEAD a203b41c: tệp lọt vào kho B) + BV-BAN-CHAY-LON-NHAT;
lỗi 2 → ca G4e (dời `khoa_den` trong kho: còn 30 s → 429; đã qua → 401, đếm lại 1) + BV-HET-KHOA (xanh trên code — ca hồi quy, đột biến bắt);
lỗi 3 → `so_luong_ban` (hợp đồng v1 chưa phát hành cho App nên sửa thẳng v1) + ca I1c + VS-TEN-SO-BAN; lỗi 4 → đã commit `689d636f`;
nghi ngờ L1 → L1 so cả cột `quyen` + `khoa_sao_luu`. Các nghi ngờ khác → `## Phát hiện` (không sửa: ngoài Phạm vi hoặc theo đúng chữ phiếu).

## Soát độc lập — vòng 2 (14.11, agent general-purpose mới, phần kết luận chép nguyên văn)
```
KHÔNG ĐẠT (chỉ còn lỗi NHẸ, không có lỗi NẶNG: không đụng tiền, điểm, ví, không lộ thông tin, không ra ngoài Phạm vi)
LỖI TÌM ĐƯỢC:
1. server/nd/xacThuc.js:19-20 — giữ lượt `ip:` TRƯỚC `cap:`: cặp đang khoá vẫn cộng bộ đếm IP rồi mới 429 → nhân viên bị khoá cặp bấm lại 5 lần
   khoá luôn cả IP 15 phút (cả mạng quán). — K5 — NHẸ.
2. server/nd/duLieu.js:107-117 — xuat() đọc danh sách bản rồi từng bản, không một ảnh chụp: cap-nhat chen giữa → tệp xuất 0 bản đang chạy → chính
   kiemTepNhap từ chối khi nhập (sao lưu đêm hỏng âm thầm). — K4 — NHẸ.
3. K3 — đột biến SỐNG: a. bỏ doiBan chặn > 1 MB; b. bỏ tinh.js chặn bản > 1 MB khi nhập; c. bỏ chặn ảnh > 512 KB khi nhập; d. bỏ vế `ban.length &&`
   (tệp không bản — không có ca K5); e. kho trống chỉ đếm nd_ban (kho chỉ có nháp / ảnh bị nhập đè); f. ghi_chu ≤ 500 chưa có ca. — NHẸ.
4. K1 — trang_thai.md Phát hiện "(soát 1) khoiPhuc.js:74 … không chạm": SAI — chuanHoaGio.js:50 quét MỌI bảng sqlite_master. — NHẸ.
5. K1 — server/nd/cauNoi.js:2 "Bê nd … chỉ viết lại tệp này": các tệp nd còn require thẳng ../database, ../utils/helpers. — NHẸ.
6. duLieu.js:89 / :77 / :139 — `so_khoa` trong nhật ký mang 3 nghĩa. — NHẸ.
NGHI NGỜ: tệp Xuất không trần vs Nhập 50 MB (+ RAM export-all); nhapToanBo một giao dịch 50 MB trên Turso; nút Lưu Phân quyền chạy lại → người có
manage_permissions tự cấp quyền (users.js, có từ trước); trust proxy 1 chưa đo.
NGHIỆM THU: 14/14 mục có ca xanh; lỗ ở D (1 MB / 512 KB ở cap-nhat / quay-lai / nhập), I (vế kho trống, tệp không bản), K5 (chặn oan theo IP).
ĐÃ KIỂM LẠI VÒNG SỬA 1: cả 4 lỗi sửa đúng (I3e + BV-BAN-CHAY-LON-NHAT, G4e + BV-HET-KHOA, so_luong_ban + VS-TEN-SO-BAN, cây sạch).
CHƯA SOÁT ĐƯỢC: Turso thật; tầng proxy Render; giao diện điện thoại; khe hở thời gian lỗi 2 chưa dựng ca chắc chắn.
BÀI HỌC: KHOÁ — giới hạn hứa ở NHIỀU cửa → một ca cho TỪNG cửa + đột biến xoá đúng dòng; KHOÁ — "kho trống" nhiều vế → ca từng vế + ca K5 tệp
không bản; NGUYÊN TẮC — bộ đếm "lần sai" chỉ cộng khi thật sự so mật khẩu, kiểm mọi khoá đang khoá TRƯỚC khi cộng; NGUYÊN TẮC — tệp sao lưu
đọc trong một ảnh chụp nhất quán; NGUYÊN TẮC — "hàm X không chạm bảng Y" phải đọc thân X.
```
**Vòng sửa 2 (máy):** lỗi 1 → `xacThuc.dangNhap` xem mọi khoá đang khoá TRƯỚC khi cộng (`duLieu.dangKhoa`) + ca G4f (ĐỎ trên HEAD 5efab5be) +
BV-KIEM-KHOA-TRUOC; lỗi 2 → `xuat()` đọc lại ≤ 3 lần tới khi đúng bất biến (hàm chung `tinh.banChayDung`, dùng cả cho nhập) — **CHƯA KIỂM bằng
ca**: khe chen giữa không dựng được tất định (K3), chỉ phép tính `banChayDung` có ca qua I3 / I4; lỗi 3 → ca D7 (1 MB lúc cap-nhat), I3f / I3g
(1 MB / 512.001 byte khi nhập), I4 (K5 tệp không bản, máy kho trống thứ ba C), I2b (kho chỉ nháp / chỉ ảnh → 409), E2c (ghi chú 501) + đột biến
BV-DOIBAN-1MB, BV-NHAP-BAN-1MB, BV-NHAP-ANH-512, VS-BAN-RONG-CHAN, VS-KHO-TRONG-CHI-BAN, VS-GHI-CHU-5000; lỗi 4 → sửa câu Phát hiện; lỗi 5 →
sửa chú thích cauNoi.js; lỗi 6 → hợp đồng ghi rõ nghĩa `so_ban` / `so_khoa` của từng việc (không đổi hành vi). Nghi ngờ → `## Phát hiện`.
Lần chạy đột biến 4 (HEAD f760a35b): `ĐỐI CHỨNG XANH · 81 đạt · 0 hỏng` · `TỔNG 45 đột biến · BẮT 45 · SỐNG 0 · HỎNG 0 · LẠC 0`.

## Soát độc lập — vòng 3 (14.11, agent general-purpose mới, phần kết luận chép nguyên văn)
```
KHÔNG ĐẠT (chỉ còn lỗi NHẸ. Không lỗi nào đụng tiền, điểm hay ví, không lộ thông tin, không ra ngoài Phạm vi. Theo LUAT §6.5, máy làm vòng sửa 4
mà không cần hỏi chủ quán)
Cách sửa vòng 2: lỗi 1 đúng (BV-KIEM-KHOA-TRUOC BẮT ở G4f); lỗi 3 a–f có ca; lỗi 4–6 đúng; lỗi 2 (xuất đọc lại) có mã nhưng không ca nào khoá.
LỖI TÌM ĐƯỢC:
A. server/nd/tinh.js (kiemTepNhap) + duLieu.js (nhapToanBo) — Nhập toàn bộ không kiểm cỡ nháp: tệp bản 900 KB + nháp 3.000.000 ký tự được NHẬN;
   sau đó mọi PUT /nhap và cap-nhat 413 tới khi xoá tay nháp lớn. — K4 — NHẸ.
B. server/nd/duong.js:27 (ghiChuHopLe, 500 viết cứng) — chỉ ca phía trên (501); quay-lai không ca; 500 không nằm trong T.GIOI_HAN; hợp đồng không
   ghi trần ghi_chu. — K3 + K4 — NHẸ.
C. server/routes/backup.js:265-266 + duLieu.js:116 — xuat() ném lỗi (throw mới vòng 2, hoặc Turso không đọc nổi dòng ảnh) → cả export-all 500:
   mất luôn bản sao lưu dữ liệu tiền. Đề xuất bọc try/catch, ghi dòng lỗi, phần POS vẫn xuất. — K5 / K4 — NHẸ (nên sửa trước tiên).
D. K3 — đột biến SỐNG: xuất đọc lại 3 → 1 lần và bỏ throw (dựng được tất định bằng kho giả qua require.cache); dòng nhật ký nhap / xuat không ca;
   bỏ kiểm khoá nháp khi nhập; ảnh trùng / số bản trùng / việc nhật ký lạ (400 → 500); no-store của ban-dang-chay; trần tên khoá 60 / tên đăng nhập
   100. — NHẸ. (4 con SỐNG không tính: tương đương / mốc đúng giây / thời gian bcrypt / co rỗng.)
NGHI NGỜ: trust proxy 1 chưa đo; GET /xuat ghi nhật ký không có dấu `// GET-ghi:`; thu-hồi kiểm PIN trước khi biết id (lệch chú thích); cổng
`tu_chay/cong.js chay` đang đỏ A20 (chưa có dòng SOÁT BẢO MẬT — đúng thứ tự); xuat() đọc trong một giao dịch sẽ gọn hơn.
NGHIỆM THU: 14/14 mục có ca xanh, còn lỗ ở D, E, I, B, L, K như trên.
CHƯA SOÁT ĐƯỢC: Turso thật; tầng proxy Render; giao diện điện thoại; RAM export-all; cách ghép các ô Excel thành tệp JSON khi cần.
BÀI HỌC: KHOÁ — giới hạn của cửa ghi thường phải có ca ở MỌI cửa vào (nhập toàn bộ, quay-lai) và ở cả hai phía ngưỡng; KHOÁ — ca "đọc lại khi bị
chen giữa" dựng được tất định bằng kho giả, đừng vội ghi CHƯA KIỂM; NGUYÊN TẮC — phần mới gắn vào đường chung (sao lưu) phải bọc lỗi; NGUYÊN TẮC —
mỗi `throw` thêm ở vòng sửa phải rà ai gọi hàm đó.
```
**Vòng sửa 4 (máy, LUAT §6.5 — chỉ đúng các lỗi lần soát 3 nêu):** A → `tinh.kiemTepNhap` kiểm bản đang chạy + mọi nháp ≤ 1 MB (cùng luật
`luuNhap`) + ca I3h (ĐỎ trên HEAD 6148a153: tệp lọt) / I3i (khoá nháp sai mẫu) / I3j (ảnh trùng, số bản trùng, việc nhật ký lạ → 400) + BV-NHAP-NHAP-1MB,
BV-NHAP-NHAP-KHOA, BV-NHAP-ANH-TRUNG, BV-NHAP-SOBAN-TRUNG, BV-NHATKY-VIEC; B → hằng `GIOI_HAN.ghi_chu_toi_da: 500` (tinh.js), hợp đồng ghi trần
(bảng cửa + khối máy đọc, L2 đỏ trước vá), ca E2d (quay-lai 501 → 400, đúng 500 → 200) + VS-GHI-CHU-499, BV-GHI-CHU-QUAY-LAI (VS-GHI-CHU-5000 đổi sang
hằng); C → `backup.js` export-all bọc lỗi nội dung App: trang "Nội dung App (JSON)" ghi một dòng `loi`, phần POS vẫn xuất + ca K4 (ĐỎ trước vá: 500)
+ BV-BOC-LOI-ND; D → ca X1 / X2 (kho giả qua require.cache: lần đọc đầu thiếu bản đang chạy → đọc lại; lệch mãi → ném) + VS-XUAT-KHONG-DOC-LAI,
BV-XUAT-THROW; ca I1d (nhật ký nhap / xuat) + BV-NHATKY-NHAP, BV-NHATKY-XUAT; C2 thêm no-store + BV-NO-STORE; J1b (tên khoá 61 → 400) + VS-TEN-KHOA-61;
G6 (tên đăng nhập 100 → 401, 101 → 400) + VS-TEN-DN-101. Nghi ngờ: thêm dấu `// GET-ghi:` ở GET /xuat; chú thích quaPin của khoaSaoLuu.js sửa cho
đúng (thu hồi kiểm PIN trước khi tìm khoá — chấp nhận, chỉ chủ quán gọi). Lần soát cuối: không gọi agent soát nữa — chat soát thay.
Bài sau vòng 4: 89 đạt · 0 hỏng. Đột biến lần 5: 58 BẮT + 2 LẠC (bài E / X sập thay vì đỏ khi đột biến) → sửa bài (`0df488a7`), 3/3 BẮT.
Đột biến lần 6 (HEAD 0df488a7, trọn bộ): `ĐỐI CHỨNG XANH · 89 đạt · 0 hỏng` · `TỔNG 60 đột biến · BẮT 60 · SỐNG 0 · HỎNG 0 · LẠC 0`.

SOÁT LẦN CUỐI: chat soát thay

## Soát bảo mật
`/soat-bao-mat` (14.11, trên HEAD 0df488a7 — từ cha của bbf5eaf). Bước 2 (agent tìm lỗ hổng, chỉ đọc): **0 lỗ hổng** trước lọc → không cần bước 3
(lọc báo nhầm); **0 sau lọc**. Báo cáo của agent (chép nguyên văn phần kết luận):

> Mình không tìm thấy lỗ hổng nào trên nhánh `viec/ND-API-1` (từ cha của bbf5eaf tới HEAD 0df488a7) đủ chắc để báo, tức là trên 80% có thể khai thác
> được. Mình chỉ đọc code, không chạy thử gì.
> - Vé riêng: ký bằng khoá dẫn từ khoá POS (`server/nd/tinh.js`, `xacThuc.js`) + audience 'nd'; POS kiểm bằng `JWT_SECRET` gốc → không dùng lẫn;
>   jsonwebtoken từ chối 'none'.
> - Kiểm quyền mỗi lần gọi: `canQuyen` đọc lại `pos_users` (is_active) + `pos_permissions`; kiểm quyền TRƯỚC khi đọc thân; bước 027 chỉ gieo owner.
> - Khoá sao lưu: `ndk_` + 32 byte ngẫu nhiên, chỉ giữ SHA-256; chỉ cửa có `choKhoa` (GET /xuat) nhận; cửa khác 403, khoá thu hồi 401; tạo / thu hồi
>   cần vé POS + chủ quán + PIN; danh sách không trả băm.
> - Đăng nhập: đếm theo cặp tên+IP và IP, giữ lượt trước bcrypt, đang khoá thì từ chối không so; mọi kiểu sai một câu, tên không có so với băm giả.
>   (Đăng nhập đúng tài khoản của mình đặt lại bộ đếm IP — bộ đếm cặp vẫn chặn từng tài khoản bị dò; thuộc loại "giới hạn số lần", loại trừ.)
> - CORS: router nd gắn trước cors '*', tự 404 / tự xử lý lỗi, không next() ra ngoài; vé qua Bearer, không cookie → không CSRF.
> - Ảnh: loại theo byte đầu, chỉ PNG / JPEG / WebP, nosniff, mã đúng 64 hex.
> - SQL: mọi câu có tham số; ghép chuỗi chỉ hằng hoặc dấu `?`.
> - Sao lưu: export-all chỉ owner; trang nội dung App không gồm băm khoá / bộ đếm; xuất từng bảng nd_* bị 400; khôi phục bỏ qua nd_*.
> - Nhập toàn bộ: cần nd_xuat_nhap; đếm trong cùng giao dịch, có dữ liệu → 409; kiểm trọn tệp trước khi ghi.
> - Lưu phân quyền: chỉ sửa đường nút Lưu phía quầy — chức năng đúng thiết kế, không phải leo quyền mới.
> - Lộ bí mật: không; log chỉ phương thức + đường; lỗi chỉ `{error, code}`.
> - Giao diện: không `dangerouslySetInnerHTML`; thẻ App khách hàng chỉ chủ quán, máy chủ chặn bằng `chiChuQuan`.
>
> **Lỗ hổng:** không có (không mục nào đạt Confidence từ 7/10 trở lên).

SOÁT BẢO MẬT: ĐẠT

## Câu hỏi
(không có — kế hoạch đã duyệt, thư App đã có trong kho)

## Phát hiện
- `server/routes/auth.js` `POST /login`: không giới hạn số lần sai; tài khoản khoá trả câu riêng (lộ tên). Chủ quán 13.11 tách việc DANGNHAP-1.
- **Nút "Lưu" ở Cài đặt › Phân quyền ĐANG HỎNG trên quầy** (trước việc này): `client/src/utils/api.js` gọi `PUT /api/pos/permissions/manager`, mà
  route thật là `PUT /permissions/:role` DƯỚI `/users` (`server/routes/users.js`) → yêu cầu rơi vào `PUT /:id` của nhân viên (id = "manager") →
  404 "Không tìm thấy nhân viên" — đo được: bài thử trên gốc in `lưu HTTP 404 · Không tìm thấy nhân viên /api/pos/permissions/manager`. Nghĩa là
  mọi lần chủ quán tick quyền rồi bấm Lưu trước đây đều KHÔNG được ghi. Nghiệm thu F đòi bật / tắt 4 quyền nd trên màn này → đã sửa MỘT dòng trong
  `api.js` (trong Phạm vi) sang `/users/permissions/${role}` + ca F3b (đỏ trên gốc) + đột biến BV-DUONG-LUU-QUYEN. Sau khi gộp: lần Lưu đầu tiên ghi
  TOÀN BỘ ô tick đang hiện cho Manager và Staff — chủ quán nên xem lại các ô tick trước khi bấm Lưu.
- Q-C: CHƯA thử Turso thật (ảnh ~500 KB + bản 1 MB một dòng). Sau khi gộp chủ quán thử tải một ảnh ~500 KB ở /admin.
- (soát 1) CORS đúng chữ phiếu H: chỉ `https://tuquyduong.com` + `https://app-kh.pages.dev`. Nếu /admin chạy ở `www.tuquyduong.com` hay bản xem
  trước `*.app-kh.pages.dev` thì bị chặn — báo App xác nhận tên miền thật (thêm tên miền = một dòng `TEN_MIEN_APP` + hợp đồng, việc sau).
- (soát 1) Đếm sai là "5 lần LIỀN" (khuôn PIN chủ quán): lần sai cũ không tự hết, chỉ đặt lại khi đăng nhập đúng hoặc sau 15 phút khoá.
- (soát 1, câu SỬA ở soát 2 — câu cũ "nd_* đã bị lọc nên không chạm" là SAI, K1) `server/utils/khoiPhuc.js:74` gọi `chuanHoaGio`, mà
  `server/utils/chuanHoaGio.js` quét MỌI bảng trong sqlite_master (không chỉ bảng trong kế hoạch): khôi phục file sao lưu CŨ (trước GIO-VN-1) thì
  ô TEXT nào của nd_* trùng nguyên mẫu `YYYY-MM-DDTHH:MM:SS(.mmm)Z` bị cộng 7 giờ. Tác động rất nhỏ (nd ghi giờ không hậu tố Z; chỉ `luc` của tệp
  Nhập toàn bộ từ máy khác nếu tệp ấy mang đuôi Z); cả hai tệp ngoài Phạm vi — đề xuất việc sau: chuanHoaGio bỏ qua nd_*.
- (soát 1) Khôi phục Excel báo trang nội dung App là `BANG_LA` "Không nhận diện được bảng" (mã chung của khoiPhuc.js, ngoài Phạm vi) — đề xuất mã riêng
  ở việc sau để chủ quán khỏi tưởng mất dữ liệu.
- (soát 1) `nd_lan_sai` không có lịch dọn (dòng nhỏ, tăng theo số cặp tên + IP gõ sai) — đề xuất dọn dòng hết khoá > 1 ngày ở việc sau.
- (soát 1, cũ, ngoài Phạm vi) `server/routes/backup.js` `GET /export-all` chặn bằng `role !== 'owner'` trong thân (đọc lại: chỉ chủ quán tải được) —
  người soát ghi "chỉ authenticate"; thực tế có kiểm owner trong thân hàm.
- (soát 2) Tệp Xuất không có trần, tệp Nhập trần 50 MB (Q-G): khoảng 75 ảnh 500 KB (base64 ~51 MB) là tệp Xuất vượt trần Nhập → chuyển máy chủ
  (KH-TACH-1) gãy; export-all Excel cũng giữ cả tệp trong RAM (Render free 512 MB). Chưa đo. Đề xuất: khi gần 40 MB thì /admin báo, hoặc nâng trần
  ở việc sau — chủ quán quyết số.
- (soát 2) `nhapToanBo` ghi tới 50 MB trong MỘT giao dịch ghi — chưa biết Turso có giới hạn thời lượng giao dịch không (CHƯA KIỂM, như Q-C).
- (soát 2, có từ trước, nay đi được từ giao diện vì nút Lưu chạy lại) `PUT /api/pos/users/permissions/:role` (users.js): người có
  `manage_permissions` sửa được quyền MỌI vai trò, kể cả vai trò của mình (tự cấp nd_xuat_nhap…); không giao dịch; trả `err.message`.
  `manage_permissions` mặc định chỉ chủ quán (database.js seed manager 0, staff 0). Ngoài phạm vi việc này — đề xuất việc sau: chặn sửa vai trò
  của chính mình / chỉ chủ quán sửa quyền.
- `server/routes/users.js`: hai chú thích ghi đường `/api/pos/permissions…` (sai) — đã sửa chú thích cùng dòng vá (K1 TU-CHAY-6).

## Nghiệm thu — đếm từng mục (bài `cong_cu/thu_NDAPI1.js`, 89 ca, 60 đột biến)
- A nhà riêng → A1, A1b (đối chứng quét `pos_`), A2 (index.js chỉ thêm dòng, gắn trước cors), A3 (không khoá ngoại); VS-POS-TRONG-ND.
- B bảng 027 → B1 (6 bảng đủ cột), B2 (kho trống → bản 0), B3 (chỉ mục một bản đang chạy), B4 (giữ đủ bản), I1d (nhật ký nhap / xuat).
- C cửa → C1, C1b, C2 (+ no-store), C2a, C3, C3b, C4, C4b, C5 (mọi lỗi `{error, code}`), C6 (JSON hỏng); L1 (13 cửa so hợp đồng, cả cột quyền).
- D giới hạn → D1 (80 / 81), D2, D3 (1.048.576 byte UTF-8), D4 (512.000 / 512.001), D5 (HTML đuôi .webp → 400), D6 (trùng mã), D7 (1 MB lúc
  cập nhật), I3f / I3g / I3h (1 MB, 512 KB, bản + nháp khi nhập).
- E cập nhật an toàn → E1, E2, E2b, E2c / E2d (ghi chú 500 hai phía, cả quay-lai), E3 (hai người cập nhật), E4, E4b, E5 (hai người quay lại).
- F quyền → F1 (nhóm + nhãn thư App), F2 / F2b (gieo, chạy lại không đè), F3a / F3b / F3c (thu quyền hết ngay; nút Lưu đúng đường), F4 (khoá tài
  khoản), F5 (10 cửa × 4 quyền), K5b (chủ quán không dòng quyền vẫn đủ).
- G đăng nhập → G1, G2 / G2c (vé không dùng lẫn), G3 (một câu chung), G4a (lần 5 → 401, lần 6 → 429), G4b (không khoá tên toàn cục — Q-A), G4c
  (theo IP), G4d (theo cặp), G4e (hết 15 phút), G4f (cặp khoá không đẩy bộ đếm IP), G5 (hết hạn, aud), G6 (trần tên).
- H CORS → H1a, H1b (evil / đuôi giả / http / null, cả 404), H2 (/api/kh, /api/pos vẫn `*`).
- I xuất / nhập → C1b, I1 (giống hệt từng bản, từng ảnh), I1b, I1c, I1d, I2 / I2b (kho có bản / chỉ nháp / chỉ ảnh → 409), I3–I3j (tệp hỏng),
  I4 (K5 tệp không bản), X1 / X2 (xuất đọc lại khi bị chen giữa — kho giả).
- J khoá sao lưu → J1 (chỉ băm, hiện một lần), J1b, J2 (chỉ GET /xuat), J3 (thu hồi / bịa → 401), J4 (PIN, chỉ chủ quán, vé nd ở cửa POS → 401).
- K sao lưu + dọn thử → K1 (trang Nội dung App (JSON) = tệp Xuất, ô ≤ 32.767), K1b, K2 (khôi phục bỏ qua nd, kể cả trang mang nhãn nd_ban), K4
  (lỗi nội dung App không làm sập sao lưu), K5f (tệp cũ), K3 (BANG_KHONG_DON); `thu_KHSDT1.js`, `thu_SAOLUU2.js` xanh trong `npm test`.
- L hợp đồng → L1, L2 (giới hạn = hằng tinh.js = số viết tay), L3 (mã lỗi), L4 (quyền, riêng /api/kh).
- M bộ kiểm → M1 (nối kiem_tra_truoc_khi_giao.js), bang_chung_do.txt (gốc bbf5eaf ĐỎ), dot_bien.py 60/60 BẮT; S1 / S2 (giao diện, dò chuỗi).
- K5 không đổi → H2, K5d (đăng nhập POS 200), K5f, K5a (nháp hai người), G4b, G4f, I4; diff không đụng routes/kh, Sales, orders, tiền.

## Báo cáo
```
VIỆC:        ND-API-1 — Kho nội dung App KH cho /admin: nhà riêng server/nd/, /api/nd/*, bảng nd_*, quyền nhóm "App khách hàng — nội dung", hợp đồng riêng v1
ĐÃ SỬA:      server/nd/{tinh,cauNoi,duLieu,xacThuc,duong,khoaSaoLuu}.js (mới — 13 cửa /api/nd + khoá sao lưu dưới /api/pos/nd-khoa-sao-luu);
             server/nang_cap/027_noi_dung.js (6 bảng nd_* + chỉ mục một bản đang chạy + gieo 4 quyền); server/index.js (+3 dòng gắn đường, nd TRƯỚC cors '*');
             server/routes/users.js (4 quyền có nhom); server/routes/backup.js (trang "Nội dung App (JSON)", khôi phục lọc nd, bọc lỗi nd);
             server/utils/donThu.js (nd_* không bao giờ dọn); client/src/utils/api.js (ndKhoaApi + SỬA đường nút Lưu Phân quyền — hỏng sẵn, 404);
             client/src/pages/Settings.jsx (tiêu đề nhóm quyền, thẻ 📱 App khách hàng chỉ chủ quán); client/src/pages/CaiDat/AppKhachHang.jsx (mới);
             client/dist (build); HOP_DONG_API_ND.md v1; kiem_tra_truoc_khi_giao.js (+1 dòng chayBaiThat)
BÀI THỬ:     cong_cu/thu_NDAPI1.js trên gốc bbf5eaf → ĐỎ "7 đạt · 57 hỏng" (không có /api/nd, bảng, quyền; F3a lộ nút Lưu Phân quyền 404);
             sau khi vá → XANH 89 đạt · 0 hỏng (chạy nhiều lần, ca đua E3 / E5 không thất thường); npm test PASS 114 · FAIL 0 · CẢNH BÁO 1 (cũ:
             route GET có ghi packages / products / sync); --day-du PASS 118 · FAIL 0 (dist khớp src); dot_bien.py 60/60 BẮT, có đối chứng
ĐÃ RÀ K4:    đường ghi nd_ban: 3 chỗ (cap-nhat, quay-lai qua doiBan; nhap-toan-bo) — cùng bất biến banChayDung + 1 MB; cửa cần quyền 10/10 có canQuyen;
             lối xuất 2 (GET /xuat, export-all) → một hàm xuat(); lối vào nd_* từ khôi phục Excel: preview + restore cùng BANG_KHOI_PHUC; giới hạn 1 MB
             ở PUT / cap-nhat / quay-lai / nhập, 512 KB ở POST anh / nhập, ghi chú ở cap-nhat / quay-lai — mỗi cửa một ca
CHƯA KIỂM:   Turso thật (dòng ảnh 500 KB / bản 1 MB, giao dịch nhập 50 MB, giao dịch đua qua mạng — E3 chỉ chạy kho file); số tầng proxy Render
             (trust proxy 1 → req.ip cho bộ đếm IP); tên miền thật của /admin (www?); giao diện trên điện thoại (thẻ App khách hàng, tiêu đề nhóm
             quyền — S1 / S2 chỉ dò chuỗi); RAM export-all khi nội dung App lớn; khe chen giữa của xuất chỉ thử bằng kho giả (X1 / X2), chưa trên kho thật
GIT:         (xem dòng HEAD ĐÃ KIỂM cuối file)
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 3 · BỎ 2 — chi tiết ở ## Bài học
```

## Bài học
- **KHOÁ (đã làm, trong Phạm vi):** mỗi giới hạn / bất biến của cửa ghi thường (1 MB, 512 KB, ghi chú 500, "bản đang chạy = số lớn nhất", từng
  vế "kho trống") có MỘT ca ở TỪNG cửa vào + cả hai phía ngưỡng + đột biến xoá đúng dòng (`thu_NDAPI1.js` D7, E2c / E2d, I2b, I3e–I3j, I4).
  Ba vòng soát đều bắt lỗ cùng một khuôn (K4: cửa nhập / quay lại / sao lưu là đường song song của cửa ghi thường).
- **KHOÁ (đề xuất, ngoài Phạm vi `tu_chay/skill_lam_viec.md` — khung đóng băng tới khai trương):** bước 1.3 tự `git fetch --unshallow` khi
  `is-shallow-repository` = true kể cả lúc hai SHA bằng nhau — hai phiên liền (13.11, 14.11) `thu_BH2.js` G1 đỏ `bad revision` vì kho nông.
  Ca đỏ: phiên mở từ bản chụp nông, HEAD = FETCH_HEAD → npm test đỏ G1.
- **NGUYÊN TẮC (đề xuất `KHUON_LOI.md` K3, ngoài Phạm vi):** Đã gây: multer coi tệp ĐÚNG bằng `fileSize` là vượt → ảnh đúng 512.000 byte bị 413;
  dòng tự so cỡ thêm vào là code chết (đột biến BV-ANH-512 SỐNG). Chặn: đo hành vi thư viện ở NGƯỠNG (ca ngay trên / ngay dưới) trước khi viết
  phép chặn của mình; phép chặn nào đột biến xoá mà vẫn xanh là thừa — xoá.
- **NGUYÊN TẮC (đề xuất `KHUON_LOI.md` K3):** Đã gây: nút "Lưu" Phân quyền 404 từ lâu (`api.js` gọi `/permissions/:role`, route ở `/users/permissions`)
  mà không bài nào thấy — bài cũ gọi máy chủ bằng đường tự viết. Chặn: bài thử gọi máy chủ bằng ĐÚNG đường màn hình dùng (đọc từ `api.js`), như F3b.
- **NGUYÊN TẮC (đề xuất `KHUON_LOI.md` K4):** Đã gây: gắn phần mới vào đường chung (nội dung App vào sao lưu Excel) mà không bọc lỗi → lỗi phần phụ
  làm hỏng bản sao lưu dữ liệu tiền; thêm `throw` ở vòng sửa mà không rà chỗ gọi. Chặn: phần mới trên đường chung bọc lỗi + ca "phần mới hỏng →
  phần cũ vẫn chạy" (K4 của bài); mỗi `throw` mới → grep mọi chỗ gọi hàm.
- **BỎ:** người gác chặn 5 lần B-PHANTICH (lệnh ghép / `$'…'` / heredoc) + 2 lần B-BIMAT-CHU (lệnh nhắc chữ bí mật của bài thử) — người gác đúng
  luật, đã làm theo hướng dẫn (tách lệnh, commit rồi chạy, dùng Edit); không phải lỗi mã.
- **BỎ:** đột biến tự viết sai cú pháp (BV-ND-DON-THU) / bài sập khi đột biến (VS-SAO-LUU-BO-ANH, VS-GHI-CHU-499, VS-XUAT-KHONG-DOC-LAI) — cổng
  LẠC của dot_bien.py đã bắt đúng, sửa ngay; luật sẵn có làm việc.
