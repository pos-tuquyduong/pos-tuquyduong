# SAOLUU-DEM-1 — Cửa sao lưu tự động của POS: một khoá chỉ đọc lấy đúng tệp "Sao lưu toàn bộ" cho Google Apps Script mỗi đêm

<!-- Phiếu do chat soạn 15.11.2026 (bàn 37, sổ v67, main cc04f14). Việc [Th] — Sonnet, chạy thẳng tới hết, CÓ soát bảo mật. Làm TRƯỚC khai trương.
     Chủ quán 15.11: sao lưu đêm ra Google Drive bằng Google Apps Script chạy trong tài khoản Google của quán (đẩy từ máy chủ bằng "tài khoản máy" bị
     Drive từ chối — lần thử trước của chủ quán). Script "TQD Sao Lưu Tự Động" ĐÃ CHẠY từ 15.11 cho nội dung App (GET /api/nd/xuat + khoá ndk_ của
     ND-API-1) → Drive TQD-SAO-LUU/App KH/. Việc này làm phần POS: script sẽ gọi thêm MỘT cửa của POS bằng MỘT khoá riêng → TQD-SAO-LUU/POS/.
     App SX không dùng nữa → không làm phần SX.
     Chat đọc main cc04f14: routes/backup.js GET /export-all (vé + chỉ owner) dựng tệp Excel mọi bảng BACKUP_TABLES (đọc phân trang) + trang nội dung App
     (cắt ô) + trang meta → res.send(buffer). Khuôn khoá chỉ đọc có sẵn ở server/nd/khoaSaoLuu.js + nd/duLieu.js (taoKhoa / thuHoiKhoa, chỉ giữ băm
     SHA-256, hiện một lần, PIN chủ quán qua cauNoi.kiemPinChuQuan). IP thật: req.ip đã là IP khách (DANG-NHAP-2, ipKhach ở cửa vào). -->

## Mục tiêu
Mỗi đêm Google tự lấy được bản sao lưu ĐẦY ĐỦ của POS (đúng tệp chủ quán tải tay ở Cài đặt › Sao lưu) bằng một khoá chỉ đọc — không cần đăng nhập,
không mở thêm quyền nào khác. Chủ quán tạo / thu hồi khoá trong Cài đặt và nhìn thấy lần lấy gần nhất để biết sao lưu đêm có chạy.

## Nghiệm thu

### A. Một hàm dựng tệp
- A1 Tách phần dựng tệp của `GET /export-all` thành MỘT hàm (vd `dungTepSaoLuu()` trả `{ buffer, filename }`) — `/export-all` gọi lại hàm đó, KHÔNG đổi gì
  với chủ quán (cùng trang, cùng thứ tự, cùng tên tệp, cùng log). Cửa mới gọi ĐÚNG hàm đó — không có bản dựng tệp thứ hai.

### B. Khoá sao lưu POS
- B1 MỘT khoá đang dùng (tạo mới = thay khoá cũ, khoá cũ hết hiệu lực ngay). Chuỗi khoá ngẫu nhiên ≥ 32 byte, tiền tố `posk_`; máy chủ CHỈ giữ băm SHA-256
  + lúc tạo + người tạo + lần lấy gần nhất + cỡ tệp lần đó. Lưu trong `pos_settings` (KHÔNG thêm bảng); băm KHÔNG được trả ra ở bất kỳ cửa đọc Cài đặt nào
  (máy grep mọi cửa trả `pos_settings` và lọc).
- B2 Tạo / thu hồi: CHỈ chủ quán (role owner) + PIN chủ quán (khuôn `nd/khoaSaoLuu.js` — dùng chung hàm kiểm PIN có sẵn, không viết lại). Khoá hiện ĐÚNG MỘT
  lần trong câu trả lời tạo. Thu hồi có hiệu lực ngay.
- B3 Các cửa quản lý đặt trong `routes/backup.js` (đã gắn `/api/pos/backup`) — KHÔNG sửa `server/index.js` (bài thu_NDAPI1 A2 canh số dòng thêm vào index.js).

### C. Cửa lấy tệp — `GET /api/pos/backup/tu-dong`
- C1 Tiêu đề `Authorization: Bearer posk_…` → 200 + tệp Excel của A1 (`Content-Type` xlsx, `Content-Disposition` tên tệp như tải tay). Không vé, không cookie.
- C2 Khoá sai / đã thu hồi / thiếu / vé đăng nhập POS thường → 401 `CHUA_DANG_NHAP` (một câu chung, không nói khoá có tồn tại hay không). So băm bằng phép
  so sánh thời gian không đổi.
- C3 Khoá `posk_` CHỈ mở đúng cửa này: gửi kèm ở mọi cửa POS khác (vd `/api/pos/backup/export-all`, `/orders`, `/settings`) → bị từ chối như không có vé.
  Khoá `ndk_` (nội dung App) KHÔNG mở cửa này và ngược lại.
- C4 Trần lượt: ≤ 6 lần / giờ theo IP (req.ip — IP thật) cho cả khoá đúng lẫn sai → 429 `QUA_NHIEU_LAN`. Đếm trong bộ nhớ như gioiHanDangNhap (không bảng).
- C5 Mỗi lần lấy thành công: ghi "lần lấy gần nhất" + cỡ tệp (B1) và một dòng log máy chủ KHÔNG chứa khoá. Không ghi khoá / tiêu đề Authorization ra log ở
  đâu cả (kể cả khi lỗi).

### D. Cài đặt › Sao lưu (giao diện)
- D1 Thẻ nhỏ "Sao lưu tự động lên Google Drive" trong tab Sao lưu (component MỚI `client/src/pages/CaiDat/KhoaSaoLuuPos.jsx`; `Settings.jsx` chỉ thêm vài dòng
  gắn thẻ): trạng thái (Chưa có khoá / Có khoá — tạo lúc …), **"Lần Google lấy gần nhất: <giờ VN> · <cỡ tệp>"** (chưa lần nào → "Chưa lấy lần nào"), nút
  "Tạo khoá mới" (hỏi PIN; có khoá rồi thì hỏi lại "Khoá cũ sẽ ngừng dùng") và "Thu hồi khoá" (hỏi PIN).
- D2 Tạo xong: hiện khoá MỘT lần + nút "Chép" + câu "Dán vào Apps Script › Cài đặt dự án › Thuộc tính tập lệnh, tên KHOA_POS. Không gửi khoá qua chat / Zalo."
  Đóng hộp là không xem lại được. Báo lưu / lỗi theo khuôn CAIDAT-BAO-1. Chỉ chủ quán thấy thẻ này.

### E. Kiểm
- E1 Bài MỚI `cong_cu/thu_SAOLUUDEM1.js` ĐỎ trên gốc, khoá A–D: tệp cửa mới = tệp `/export-all` cùng lúc (cùng tên trang, cùng số dòng mỗi trang); khoá đúng
  → 200; sai / thiếu / thu hồi / tạo khoá mới thì khoá cũ → 401; `posk_` ở cửa khác → từ chối; `ndk_` ở cửa này → 401; không phải chủ quán / sai PIN → không
  tạo / thu hồi được; khoá chỉ có trong câu trả lời tạo (không ở GET trạng thái, không ở cửa đọc Cài đặt); trần 6 / giờ → 429; log không chứa khoá;
  "lần lấy gần nhất" cập nhật; `/export-all` vẫn chạy như cũ. Nối `kiem_tra_truoc_khi_giao.js`; đột biến có bắt.
- E2 `thu_SAOLUU2.js`, `thu_NDAPI1.js` xanh nguyên (không sửa).
- K5 Không đổi: tải tay "Sao lưu toàn bộ", xuất từng bảng, xem trước / khôi phục (SAOLUU-2), khoá `ndk_` của nội dung App, đăng nhập POS.

<!-- Chủ quán 15.11 — trả lời câu hỏi B1 (trạng thái 4e8e5b9):
     ĐỒNG Ý đề xuất — thêm `server/routes/settings.js` vào Phạm vi, chỉ sửa đúng chỗ khoá sao lưu POS:
       (1) MỘT hằng tên khoá ở `utils/khoaSaoLuuPos.js`, settings.js chỉ import; (2) `GET /` bỏ dòng khoá đó, `GET /:key` → 404;
       (3) `PUT /` có khoá đó trong thân → 403 `KHOA_RIENG` (chỉ cửa tạo / thu hồi ở backup.js ghi được). Bài thử thêm ca + đột biến gỡ từng vế.
     Phát hiện "khôi phục bản cũ làm sống lại khoá đã thu hồi" — LÀM LUÔN (cùng việc, ít dòng): `export-all` / `export/pos_settings` KHÔNG xuất dòng khoá;
       khôi phục (xem trước + khôi phục) BỎ QUA dòng khoá nếu tệp cũ có. Bài thử: tệp xuất không chứa dòng khoá; khôi phục tệp có dòng khoá → khoá đang
       dùng không đổi, khoá cũ không sống lại.
     Rồi làm thẳng tới hết (soát độc lập → soát bảo mật → cổng → báo cáo 7 mục). Đẩy nhánh sau mỗi bước lớn. -->

## Phạm vi
- viec/SAOLUU-DEM-1/**
- server/routes/backup.js
- server/routes/settings.js
- server/utils/khoaSaoLuuPos.js
- client/src/pages/CaiDat/KhoaSaoLuuPos.jsx
- client/src/pages/Settings.jsx
- client/dist/**
- cong_cu/thu_SAOLUUDEM1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_SAOLUUDEM1.js` ĐỎ trên gốc: chưa có cửa `/api/pos/backup/tu-dong`, chưa có khoá sao lưu POS.

## Ngân sách
~110 dòng máy chủ + ~80 dòng giao diện + ~300 dòng thử.
**Phương án đơn giản nhất đã xét:** cửa mới gọi ĐÚNG hàm dựng tệp của "Sao lưu toàn bộ" (khôi phục dùng chính màn khôi phục có sẵn); khoá chép khuôn khoá
`ndk_` đã soát ở ND-API-1 nhưng MỘT khoá trong `pos_settings` (không bảng mới, không danh sách khoá); không thư viện; Google tự gọi — POS không đẩy đi đâu.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
có — khoá mở được TOÀN BỘ dữ liệu quán (khách, đơn, ví): lộ khoá, khoá mở cửa khác, dò khoá, log lộ khoá, băm lộ qua Cài đặt.

## Cấm
- Không đổi nội dung / thứ tự tệp sao lưu, không đổi khôi phục (SAOLUU-2 / KHOIPHUC-1 là việc khác). Không làm phần SX.
- Không sửa `server/index.js`, `server/nd/**`. Không ghi khoá ra log / tệp / bài thử in ra màn hình.
- VOUCHER-2 (Opus làn 1) có thể đang sửa `Settings.jsx` / `BACKUP_TABLES` trong `backup.js`: chỉ thêm dòng gắn thẻ ở Settings.jsx; trong backup.js KHÔNG đụng
  mảng `BACKUP_TABLES`.
- Mặc định: không sửa .claude/, không merge, không tạo PR, không đụng main, chỉ push `git push -u origin viec/SAOLUU-DEM-1`, không sửa sổ việc. Đẩy nhánh
  sau mỗi bước lớn.
