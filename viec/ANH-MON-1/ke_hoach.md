# ANH-MON-1 — kế hoạch (27.11.2026, việc thường → chạy thẳng, không chờ duyệt)

## Đã đọc (lượt này)
- `server/routes/kh/index.js:46` `anh: null` cứng; `server/routes/products.js` `layMenuQuay` (spread `...p`) là nguồn chung của quầy + `/api/kh/menu`.
- `server/kho/duong.js:94` `GET /san-pham` (màn Sản phẩm) gọi `duLieu.docSanPham` — `duLieu.js` NGOÀI Phạm vi → thêm `anh` ngay ở `duong.js`.
- `server/nang_cap/chay.js`: bước cuối là 032; phiếu dành 037 (033–036 của việc khác). `server/routes/backup.js:62` xuất Excel theo DANH SÁCH bảng tường minh → bảng mới KHÔNG vào (A5 tự đúng).
- KHO-GON-2 CHƯA gộp (không có `viec/KHO-GON-2` trên main) → viết hàm kiểm kiểu ảnh chung ở `server/utils/anhMon.js`, ghi Phát hiện.
- TOPPING-1 CHƯA gộp: `KhungChonMon.jsx` không có ô topping → bỏ phần ảnh topping, ghi Phát hiện (phiếu "Cấm" dặn đúng như vậy).

## Phương án
**Máy chủ** — A: nhận ảnh dạng thô (`PUT /api/pos/products/:id/anh`, thân = byte ảnh) + bảng `pos_anh_mon` (base64 TEXT, ~+33% dung lượng,
chạy chắc trên cả file SQLite thử lẫn Turso); B: multer + cột BLOB (thêm thư viện cấu hình, BLOB qua libsql phải thử thêm). **Chọn A** (ít dòng, không thêm phụ thuộc).
- Kiểu thật = byte đầu (JPEG `FFD8FF` · PNG `89504E47 0D0A1A0A` · WebP `RIFF????WEBP`), bỏ qua Content-Type khách khai.
- Giới hạn 120 KB: do chính bộ đọc thân (`express.raw({ limit })`) chặn → 413 `ANH_QUA_LON` (MỘT chỗ kiểm, hằng số `GIOI_HAN_ANH` một chỗ).
- Phiên bản đường dẫn = 12 ký tự đầu băm SHA-256 của byte: đổi ảnh → đường dẫn đổi; xoá rồi tải lại ảnh cũ → cùng đường dẫn cũ cùng nội dung (không bao giờ ảnh sai nằm dưới đường dẫn nhớ lâu). Không bộ đếm → không đua.
- Đọc `GET /api/pos/products/anh/:id/:pb` không token, `Cache-Control: public, max-age=31536000, immutable`; `pb` không khớp bản hiện tại → 404 (không phục vụ nội dung khác dưới tên cũ). Không thêm cửa dưới `/api/kh`.
- Ghi / xoá: `authenticate` + `checkPermission('manage_settings')` (cùng quyền sửa món), đứng TRƯỚC bộ đọc thân (không quyền thì không đọc 120 KB).
- Menu: `layMenuQuay` thêm `anh` (đường dẫn | null) từ một câu `SELECT product_id, phien_ban` (không kéo byte ảnh); đọc lỗi → ghi log, `anh: null` (menu KHÔNG được chết vì ảnh — CLAUDE.md §5.3).
- `monKhach`: `anh: p.anh ?? null`. `HOP_DONG_API_KH.md` v19 (nghĩa mới của `anh`), `BAO_APPKH.md`.

**Quầy** — A: ô ảnh vuông dùng chung `AnhMon.jsx` (ảnh lười + chỗ giữ chỗ cố định `aspect-ratio`, chữ viết tắt màu khi chưa có / ảnh lỗi) gắn vào thẻ món + dòng giỏ; B: sửa cả khung chọn món. **Chọn A**.
**Màn Sản phẩm** — thu nhỏ bằng canvas ở máy (cắt vuông giữa, 400 × 400, WebP 0,7, JPEG nếu máy không ra WebP), hằng số có tên đầu file; nút Xoá ảnh.

## Ca thử ↔ Nghiệm thu (`cong_cu/thu_ANHMON1.js`)
| Mục | Ca |
|---|---|
| A2 | JPEG 80 KB tải lên → đọc lại ĐÚNG byte + Content-Type + Cache-Control dài; PNG, WebP hợp lệ nhận; PDF khai image/jpeg → 400 `ANH_KHONG_HOP_LE`; `RIFF…WAVE` → 400; đúng 120 KB → 200, 120 KB + 1 → 413 `ANH_QUA_LON`; tải lại = thay (còn 1 hàng); đường dẫn cũ 404 |
| A2/A4 | đổi ảnh → đường dẫn khác; cùng byte → cùng đường dẫn; xoá → `anh: null`, đọc 404; menu có `anh` ở CẢ `/api/pos/products` và `/api/kh/menu`; menu KHÔNG chứa byte |
| A1 | không token → 401; nhân viên bị gỡ `manage_settings` → 403 (tải VÀ xoá), CSDL không đổi; món không có → 404 |
| K5 | món không ảnh → `anh: null`, bộ khoá menu giữ nguyên (thu_KHSP1 C3); App cũ đọc `anh` null vẫn chạy; xoá ảnh chưa có → 200 (lặp lại được); kho ảnh hỏng → menu vẫn trả, `anh` null |
| A3 / A1 (giao diện) | hằng số 400 / 0,7 một chỗ; thẻ món + dòng giỏ dùng `AnhMon`; tệp giao diện không `fetch` trần; hoá đơn / tem không nhắc `anh` |
| A5 | `backup.js` không có `pos_anh_mon` |
| A4 | hợp đồng v19 (bài `thu_HOPDONG_KH.js`) |

Đột biến: VS-anh-tin-duoi · VS-anh-khong-gioi-han · BV-bo-kiem-quyen-anh (phiếu) + VS-anh-webp-chi-RIFF · VS-anh-ten-co-dinh · BV-anh-menu-null · VS-anh-menu-chet-theo-anh · VS-anh-doc-khong-kiem-pb.

## Đường song song (K4) cần canh
Mọi nơi dựng "món" từ `pos_products`: `layMenuQuay` (quầy + `/api/kh/menu` + màn khách + đơn App) — đã gom MỘT hàm; `monKhach` (kh/index.js); `GET /kho/san-pham` (màn Sản phẩm). `grep` thanh_phan / thong_tin sẽ làm lại ở bước sửa.

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
Món không ảnh; App KH bản cũ (`anh` null); quản lý / chủ có `manage_settings` tải ảnh; nhân viên bán hàng đọc ảnh (không token); tải lại ảnh y hệt.
