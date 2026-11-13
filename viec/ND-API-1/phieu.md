# ND-API-1 — Kho nội dung App KH cho /admin: "nhà riêng" trong máy chủ POS (server/nd/, /api/nd/*, bảng nd_*), quyền nhóm "App khách hàng — nội dung", hợp đồng riêng v1

<!-- Phiếu do chat soạn 13.11.2026 (bàn 36, sổ v64, main 171109f). Việc [T] — Opus làn 2, CÓ kế hoạch chủ quán duyệt, CÓ soát bảo mật.
     Nguồn: thư App KH 11.11 (a) "Kho nội dung App" + thư trả lời POS 11.11 (a) — POS đã nhận NGUYÊN tên cửa, tên bảng, mã lỗi CO_BAN_MOI_HON và
     giới hạn; App đang làm KH-ADMIN-1 theo đúng tên đó → đổi tên / dạng nào phải ghi câu hỏi, không tự đổi. Chủ quán: làm TRƯỚC khai trương.
     Chat đọc trên main: CORS chung ở server/index.js là origin '*' (cho /api/kh) → /api/nd phải tự giới hạn; đăng nhập POS (routes/auth.js)
     HIỆN KHÔNG giới hạn số lần sai → /api/nd/dang-nhap tự làm giới hạn (xem Câu hỏi kế hoạch Q-A); sao lưu (routes/backup.js) xuất Excel — một ô
     Excel tối đa 32.767 ký tự, không chứa nổi ảnh / bản 1 MB (xem Q-B). Bước nâng cấp: dùng số 027 (026 là VOUCHER-2; 028 để QC-APP-1). -->

## Mục tiêu
App KH có chỗ cất nội dung (chữ / ảnh / nút) để chủ quán sửa ở tuquyduong.com/admin, có nháp, có phiên bản, quay lại được — nằm nhờ máy chủ POS
nhưng tách bạch hẳn, sau này bê sang máy chủ App chỉ bằng Xuất → Nhập toàn bộ.

## Nghiệm thu
- A **Nhà riêng:** mọi mã trong `server/nd/**`; `server/index.js` chỉ thêm dòng gắn đường. Bảng `nd_*` không khoá ngoại sang bảng POS. Mã trong
  server/nd/ KHÔNG đọc / ghi bảng tiền, khách, đơn, kho; chỉ chạm `pos_users` (đăng nhập) và `pos_permissions` (quyền) qua MỘT tệp cầu nối
  `server/nd/cauNoi.js`. Bộ kiểm khoá điều này (tệp nào trong server/nd/ ngoài cauNoi.js có chữ `pos_` → đỏ).
- B **Bảng (bước 027_noi_dung.js):** `nd_ban` (so_ban tăng dần · gia_tri JSON ĐẦY ĐỦ · ghi_chu · tom_tat · nguoi · luc · tu_ban · dang_chay — luôn đúng
  MỘT bản đang chạy khi kho đã có bản; giữ MỌI bản, không xoá), `nd_nhap` (một dòng / khoá: khoa · gia_tri · nguoi · luc · ban_goc), `nd_anh` (ma = băm
  SHA-256 nội dung · loai · kich_thuoc · dữ liệu ảnh lưu NGAY trong bảng · luc), `nd_nhat_ky` (nguoi · luc · viec ∈ luu / bo_nhap / cap_nhat / quay_lai /
  xuat / nhap · so_ban · so_khoa), bảng khoá sao lưu (chỉ lưu BĂM của khoá, lúc tạo, lúc thu hồi). Kho trống: `ban-dang-chay` trả bản 0 rỗng.
- C **Cửa — đúng bảng trong thư App 11.11 (a):** `GET ban-dang-chay?co=` (trùng số → `{ khong_doi: true }`) · `GET anh/:ma` (cache lâu, immutable) ·
  `POST dang-nhap` · `GET / PUT nhap` · `DELETE nhap/:khoa` · `POST cap-nhat` · `GET phien-ban` · `GET phien-ban/:so` · `POST quay-lai` (tạo bản MỚI,
  `tu_ban` = số cũ) · `POST anh` · `GET xuat` · `POST nhap-toan-bo`. Lỗi dạng `{ error, code }`; mã lỗi tối thiểu: `CHUA_DANG_NHAP` 401 ·
  `KHONG_DU_QUYEN` 403 · `CO_BAN_MOI_HON` 409 · `KHOA_KHONG_HOP_LE` 400 · `QUA_LON` 413 · `ANH_KHONG_HOP_LE` 400 · `QUA_NHIEU_LAN` 429 ·
  `KHONG_TIM_THAY` 404 (kế hoạch chốt đủ danh sách, ghi hợp đồng).
- D **Giới hạn:** khoá `[a-zA-Z0-9._-]` 1–80 ký tự; giá trị là chuỗi / số / đúng-sai / mảng / object (POS không hiểu nghĩa); một bản ≤ 1 MB (đo byte
  UTF-8 của JSON); ảnh ≤ 500 KB, chỉ WebP / JPEG / PNG — kiểm BYTE ĐẦU tệp, không tin tên / loại khai báo; ảnh trùng mã → trả ảnh cũ.
- E **Cập nhật an toàn:** `cap-nhat` trong MỘT giao dịch: `ban_goc` ≠ bản đang chạy → 409 `CO_BAN_MOI_HON`, không ghi gì; đúng → bản mới = bản đang
  chạy + mọi nháp, xoá nháp, ghi nhật ký. Hai người bấm cùng lúc → đúng một người thành công. `quay-lai` cũng kiểm `ban_goc`.
- F **Quyền:** nhóm "App khách hàng — nội dung" trên màn Phân quyền, 4 quyền: Xem Chế độ sửa App · Sửa nội dung App (Lưu nháp) · Cập nhật toàn
  bộ + quay lại phiên bản · Xuất / nhập toàn bộ. Mặc định chỉ chủ quán có; vai trò khác không. Kiểm quyền MỖI lần gọi cửa cần quyền, đọc thẳng từ
  `pos_permissions` + `pos_users.is_active` (thu quyền / khoá tài khoản là có hiệu lực ngay, không chờ vé hết hạn).
- G **Đăng nhập riêng:** `POST dang-nhap` `{ ten_dang_nhap, mat_khau }` (tài khoản POS, bcrypt) → vé RIÊNG hạn ~12 giờ + `quyen[]`. Vé /api/nd
  không dùng được ở /api/pos và ngược lại. Sai → một câu chung, không lộ tên đăng nhập có tồn tại hay không; sai liên tiếp → 429 `QUA_NHIEU_LAN`
  (ngưỡng theo Q-A).
- H **CORS:** mọi phản hồi /api/nd chỉ cho `https://tuquyduong.com` và `https://app-kh.pages.dev` (bài thử: Origin lạ → không có
  Access-Control-Allow-Origin của nó). Không đổi CORS của /api/kh, /api/pos.
- I **Xuất / Nhập toàn bộ:** một tệp JSON có số định dạng: mọi bản + nháp + ảnh (base64) + nhật ký. `nhap-toan-bo` CHỈ nhận khi kho nd TRỐNG (dùng để
  chuyển máy chủ) — kho đã có dữ liệu → 409, không xoá gì. Xuất xong nhập lại vào kho trống → giống hệt (bài thử so từng bản, từng ảnh).
- J **Khoá sao lưu chỉ đọc:** chủ quán tạo / thu hồi trong Cài đặt (PIN chủ quán, báo lưu chung BAO-1b); khoá hiện ĐÚNG MỘT lần lúc tạo, máy chủ chỉ
  giữ băm; khoá chỉ gọi được `GET /api/nd/xuat` — mọi cửa khác từ chối; khoá đã thu hồi → 401.
- K **Sao lưu + dọn dữ liệu thử:** `nd_*` có trong sao lưu thường theo cách Q-B chốt; khôi phục không hỏng. `server/utils/donThu.js`: `nd_*` là nội dung
  thật — KHÔNG xoá khi dọn dữ liệu thử (đăng ký đúng danh sách bảng của don-thu, bài cũ của don-thu vẫn xanh).
- L **Hợp đồng riêng** `HOP_DONG_API_ND.md` v1: khối máy đọc (cửa, quyền, trường, mã lỗi, giới hạn) + phần chữ; KHÔNG chung số phiên bản với /api/kh.
- M **Bộ kiểm:** `cong_cu/thu_NDAPI1.js` ĐỎ trên gốc, khoá A–L (gồm: 409 hai người cập nhật, quyền thu là hết ngay, ảnh giả đuôi .webp mà byte là
  HTML → 400, khoá sao lưu gọi cửa ghi → từ chối, Origin lạ, nhập vào kho đã có → 409); nối vào kiem_tra_truoc_khi_giao.js; đột biến có bắt.
- K5 **Không đổi:** /api/kh, /api/pos (ngoài danh sách quyền + thẻ Cài đặt khoá sao lưu), tiền, đơn, khách, giao diện màn bán.

## Câu hỏi kế hoạch (trả lời trong ke_hoach.md, chủ quán duyệt)
- Q-A **Giới hạn đăng nhập sai:** đề xuất 5 lần sai / 15 phút, đếm theo tên đăng nhập VÀ theo IP. Đăng nhập POS (routes/auth.js) hiện KHÔNG giới hạn
  — đề xuất kèm: viết hàm đếm dùng chung, áp luôn cho /api/pos/auth/login (chủ quán quyết; nếu không thì auth.js ngoài Phạm vi, chỉ ghi Phát hiện).
- Q-B **Sao lưu nd_*:** Excel không chứa nổi ô > 32.767 ký tự. Đề xuất: sao lưu Excel ghi `nd_ban` / `nd_nhap` / `nd_nhat_ky` khi vừa ô, còn ảnh và bản quá
  lớn thì sao lưu thường kèm tệp JSON của `GET /xuat` — hoặc cách gọn hơn máy thấy; không được làm hỏng khôi phục hiện có.
- Q-C **Dung lượng một dòng ở kho thật (Turso):** ảnh 500 KB + bản 1 MB trong một dòng có đi được không (đọc tài liệu / thử trên kho thử); không được thì
  đề xuất cách (ví dụ cắt bản thành nhiều dòng) — báo App nếu đổi giới hạn.
- Q-D **Màn Cài đặt khoá sao lưu** đặt ở đâu (thẻ nhỏ riêng "App khách hàng" hay trong Phân quyền) — chọn chỗ ít đụng Settings.jsx nhất (VOUCHER-2 và
  QC-APP-1 cũng đang thêm thẻ vào Settings.jsx: Settings.jsx chỉ thêm vài dòng gọi thành phần, phần lớn để trong pages/CaiDat/).

## Phạm vi
- viec/ND-API-1/**
- server/nd/**
- server/index.js
- server/nang_cap/027_noi_dung.js
- server/routes/users.js
- server/routes/backup.js
- server/utils/donThu.js
- client/src/pages/Settings.jsx
- client/src/pages/CaiDat/**
- client/src/utils/api.js
- client/dist/**
- HOP_DONG_API_ND.md
- cong_cu/thu_NDAPI1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_NDAPI1.js` ĐỎ trên gốc: chưa có /api/nd, bảng nd_*, nhóm quyền, khoá sao lưu.

## Ngân sách
~650 dòng máy chủ (server/nd/) + ~120 dòng giao diện (quyền + khoá sao lưu) + ~400 dòng thử.
**Phương án đơn giản nhất đã xét:** kho là "hộp chứa" khoá → giá trị; một module Express riêng; dùng lại bcryptjs + jsonwebtoken (khoá ký riêng cho nd)
+ cors đã có; không thêm thư viện.

## Đổi cấu trúc DB
có — bước `027_noi_dung.js` CHỈ tạo bảng / chỉ mục mới `nd_*` + gieo 4 quyền mới (INSERT OR IGNORE, chủ quán = 1, vai trò khác = 0); không đụng bảng cũ.

## Thư viện mới
không

## Soát bảo mật
có

## Cấm
Không đổi tên cửa / bảng / mã lỗi App đã nhận mà không hỏi; không đọc / ghi bảng tiền, khách, đơn, kho từ server/nd/; không dùng chung vé đăng nhập
POS; không nới CORS của /api/nd; không xoá phiên bản; không để nhap-toan-bo đè kho đang có dữ liệu; không làm phần /admin của App (KH-ADMIN-1 bên App).
