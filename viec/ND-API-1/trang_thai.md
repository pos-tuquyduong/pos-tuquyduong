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

Tên đột biến: VS-CORS-SAO, VS-GAN-SAU-CORS, BV-404-TRONG-ND, BV-BAN-GOC, BV-BAN-GOC-QUAY-LAI, BV-CHI-MUC-MOT, VS-QUYEN-VE, BV-IS-ACTIVE,
VS-GIEO-MANAGER, BV-NHOM-QUYEN, BV-DUONG-LUU-QUYEN, VS-KHOA-CHUNG, BV-AUD, VS-LOI-RIENG-KHOA, VS-NGUONG-6, BV-DEM-IP, BV-DEM-CAP, VS-KHOA-TEN-TOAN-CUC,
VS-KHOA-81, VS-DEM-KY-TU, BV-LUU-QUA-LON, BV-ANH-512, VS-ANH-MULTER-BANG, VS-ANH-THEO-TEN, VS-POS-TRONG-ND, VS-KHOA-SAO-LUU-MOI-CUA, BV-THU-HOI,
BV-PIN-KHOA, VS-NHAP-DE, VS-SAO-LUU-BO-ANH, BV-TRANG-ND, VS-ND-THO-EXCEL, BV-LOC-ND-KHOI-PHUC, BV-ND-DON-THU, BV-THE-CHI-CHU-QUAN.

Lần chạy 1 (14.11): 31/34 BẮT — BV-ANH-512 SỐNG (dòng tự so cỡ ảnh trong duong.js là THỪA: multer đã chặn 512.001 → đã xoá dòng, đột biến đổi
sang giới hạn multer + thêm VS-ANH-MULTER-BANG); VS-SAO-LUU-BO-ANH LẠC (đoạn I của bài SẬP khi tệp không có ảnh → bài sửa cho chịu được, ca đỏ);
BV-ND-DON-THU LẠC (đột biến viết sai cú pháp — `];` dính vào dòng chú thích). Sửa xong 4/4 BẮT.

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
- `server/routes/users.js`: hai chú thích ghi đường `/api/pos/permissions…` (sai) — đã sửa chú thích cùng dòng vá (K1 TU-CHAY-6).
