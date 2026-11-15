# SAOLUU-DEM-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (15.11.2026)
- Nhánh `viec/SAOLUU-DEM-1`; cây sạch; HEAD = FETCH_HEAD = `2f40a7b` (không cần kéo).
- `git log --oneline -3`:
  - 2f40a7b PHIEU: SAOLUU-DEM-1
  - d0bcb6e TIEN-DO: DANG-NHAP-2 (cc04f14) xong; SAOLUU-DEM-1 viet lai (Apps Script, truoc khai truong), mo (Sonnet); quyet dinh 15.11 — so v67
  - cc04f14 Merge pull request #94 from pos-tuquyduong/viec/DANG-NHAP-2

## Câu hỏi
**Chặn ở B1: phiếu bắt "băm khoá KHÔNG trả ra ở bất kỳ cửa đọc Cài đặt nào", nhưng cửa đó nằm NGOÀI Phạm vi.**

Đã đọc (lượt này): khoá lưu trong `pos_settings` thì ba cửa của `server/routes/settings.js` đụng tới nó:
- `GET /` (dòng 62): `SELECT key, value, updated_at FROM pos_settings WHERE key != 'store_logo'` → trả MỌI khoá, kể cả khoá mới (băm + giờ tạo + người tạo + lần lấy). Mọi nhân viên đăng nhập đều gọi được.
- `GET /:key` (dòng 88): đọc thẳng một khoá bất kỳ.
- `PUT /` (dòng 169–177): ghi MỌI khoá, chỉ cần quyền `manage_settings` (quản lý cũng có). **Nặng hơn việc lộ:** quản lý gửi `{settings:{<khoá sao lưu>: <băm của chuỗi mình tự chọn>}}` là tự dựng được "khoá sao lưu" mở TOÀN BỘ dữ liệu quán (khách, đơn, ví) — chủ quán không hề tạo khoá.

`settings.js` không có trong `## Phạm vi` (chỉ có `backup.js`, `utils/khoaSaoLuuPos.js`, `Settings.jsx`, `KhoaSaoLuuPos.jsx`, `client/dist/**`, bài thử, bộ kiểm). Không có cách làm đủ B1 mà không đụng file này: chỉ `store_logo` đang được lọc.

**Đề xuất của mình (chủ quán chỉ cần xác nhận):** thêm `server/routes/settings.js` vào Phạm vi, chỉ sửa ~6 dòng:
1. một hằng tên khoá riêng (đặt trong `utils/khoaSaoLuuPos.js`, `settings.js` chỉ import);
2. `GET /` thêm `AND key != ?`; `GET /:key` trả 404 với khoá đó;
3. `PUT /` từ chối (403 `KHOA_RIENG`) nếu thân có khoá đó — chỉ cửa tạo/thu hồi ở `backup.js` ghi được.
Bài thử `thu_SAOLUUDEM1.js` thêm ca: GET / không có khoá; GET /:key → 404; PUT bằng quản lý → từ chối; đột biến gỡ từng vế. Không đổi `server/index.js`, không thêm bảng.

Phương án khác nếu chủ quán không muốn mở `settings.js`: thêm một cột / bảng riêng (trái "KHÔNG thêm bảng", "Đổi cấu trúc DB: không") — mình KHÔNG khuyên.

Việc dừng ở đây, chưa viết dòng code nào. Chờ chủ quán trả lời để làm tiếp (`/lam-viec SAOLUU-DEM-1 tiep`).

## Phát hiện
- `export-all` (và `GET /export/pos_settings`) xuất cả bảng `pos_settings` → tệp sao lưu sẽ chứa băm khoá. Chỉ chủ quán tải được và băm SHA-256 của 32 byte ngẫu nhiên không đảo ngược được; nhưng khôi phục bản cũ sẽ làm sống lại khoá đã thu hồi. Chưa xử lý (nằm ngoài ý phiếu) — nói để chủ quán biết.
