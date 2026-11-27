# ANH-MON-1 — trạng thái (27.11.2026)

## Đối chiếu bản chụp (bước 1)
Nhánh `viec/ANH-MON-1`; HEAD = FETCH_HEAD = `38fb4dd` lúc mở phiên. Ba dòng log lúc mở:
```
38fb4dd PHIEU: ANH-MON-1
acc8892 Merge pull request #104 from pos-tuquyduong/viec/TIEN-KHOA-2
302560a TIEN-KHOA-2: trang thai ghep main 9a5defdf, HEAD DA KIEM 6f39911b — chat ban 41
```
Kho mở dạng nông (shallow) nên `thu_BH2` G1 báo `bad revision cbbb809..HEAD`; đã `git fetch --unshallow origin viec/ANH-MON-1` (chỉ tải lịch sử) → `thu_BH2` 100 đạt · 0 hỏng.

## Đã làm
Máy chủ: bước 037 (bảng `pos_anh_mon`), `PUT/DELETE /api/pos/products/:id/anh`, `GET /api/pos/products/anh/:id/:pb` (công khai, nhớ lâu), `anh` trong menu quầy + `/api/kh/menu` + Kho › Sản phẩm; kiểm kiểu bằng `loaiAnh` có sẵn ở `server/nd/tinh.js`.
Quầy: `AnhMon.jsx` (thẻ món + dòng giỏ), màn Sản phẩm tải ảnh (thu 400×400 WebP 0,7 ở máy) + Xoá ảnh. Hợp đồng v19, `BAO_APPKH.md`. `client/dist` đã build.
Bài thử `cong_cu/thu_ANHMON1.js`: đỏ trên cây `38fb4dd` (10 đạt · 29 hỏng), xanh 71 ca sau vá. Đột biến: 23/23 BẮT (`python3 viec/ANH-MON-1/dot_bien.py`).

## Bảng chỗ vá → đột biến
| Chỗ vá | Đột biến |
|---|---|
| products.js kiểm kiểu theo byte | VS-anh-tin-duoi · VS-anh-webp-chi-RIFF · VS-anh-jpeg-hai-byte |
| anhMon.js giới hạn 120 KB / products.js 413 | VS-anh-khong-gioi-han · VS-anh-gioi-han-thap-mot · VS-anh-413-xoa-anh-cu |
| products.js quyền tải / xoá | BV-bo-kiem-quyen-anh · BV-bo-kiem-quyen-xoa-anh · VS-anh-quyen-chi-xac-thuc |
| products.js phiên bản / một ảnh mỗi món / xoá | VS-anh-ten-co-dinh · VS-anh-doc-khong-kiem-pb · VS-anh-them-hang-moi · VS-anh-xoa-khong-xoa |
| menu quầy / kh/index.js / kho/duong.js / kho ảnh hỏng | BV-anh-menu-null · BV-kh-anh-cung-null · VS-kho-san-pham-khong-anh · VS-anh-menu-chet-theo-anh |
| giao diện | BV-the-mon-khong-anh · BV-dong-gio-khong-anh · VS-AnhMon-luon-chu · VS-AnhMon-khong-lazy · BV-SanPham-bo-xoa-anh · VS-SanPham-chat-luong-1 |

## Câu hỏi (DỪNG — cần chủ quán quyết)
`npm test` còn 1 bài đỏ vì phiếu mâu thuẫn với phép kiểm có sẵn, cả hai chỗ sửa đều NGOÀI Phạm vi:

- Dòng ✗ nguyên văn: `✗ D2c mọi bảng database.js + nang_cap/ đều trong BACKUP_TABLES (68 bảng; bỏ qua _sao_luu_*)  — thiếu: pos_anh_mon` (kéo theo ✗ D2a · D2b · D2d của `cong_cu/thu_SAOLUU2.js`, vì các ca đó so "thiếu đúng một bảng").
- Phiếu A5 bảo ảnh KHÔNG vào sao lưu Excel hằng ngày. Phép SAOLUU-2 (D2c) bảo MỌI bảng phải có trong `BACKUP_TABLES` (`server/routes/backup.js`). Hai điều này không cùng đúng được.
- Không thể đơn giản thêm bảng vào Excel: ảnh là chuỗi base64 ≈ 160.000 ký tự, một ô Excel tối đa 32.767 ký tự → xuất / khôi phục sẽ lỗi hoặc cắt cụt ảnh.
- Mình KHÔNG nới phép kiểm (K8) và KHÔNG sửa `backup.js` / `thu_SAOLUU2.js` (ngoài Phạm vi).
- **Đề xuất (bạn chỉ cần xác nhận):** thêm một danh sách "bảng cố ý không xuất Excel" (ví dụ `BANG_KHONG_XUAT_EXCEL = ['pos_anh_mon']`) vào `server/routes/backup.js`, và sửa `thu_SAOLUU2.js` D2c để bỏ qua đúng các bảng trong danh sách đó (kèm ca: bảng không nằm trong danh sách mà thiếu vẫn bị bắt; đột biến xoá bảng khỏi danh sách phải đỏ). Cách sao lưu ảnh riêng: ghi Phát hiện — ảnh chỉ nằm trong Turso (chủ quán chụp lại / tải lại nếu mất bảng); nếu muốn an toàn hơn thì làm việc riêng "sao lưu ảnh món".
- Cần bạn: cho phép thêm `server/routes/backup.js` và `cong_cu/thu_SAOLUU2.js` vào Phạm vi (hoặc giao việc riêng).

## Phát hiện (ngoài Phạm vi, không sửa)
- KHO-GON-2 chưa gộp → dùng lại `loaiAnh` của `server/nd/tinh.js` (một hàm kiểm kiểu ảnh). Khi KHO-GON-2 gộp nên kiểm lại không có hàm thứ hai.
- TOPPING-1 chưa gộp (`KhungChonMon.jsx` không có ô topping) → chưa làm ảnh topping; topping là món nên đã có ảnh ở thẻ món nếu có trong menu.
- `server/utils/manKhach.js:28,182` + `client/src/pages/CaiDat/ManKhach.jsx:13`: loại trang `anh` của màn khách (ảnh trang trí) nghĩa khác với `anh` của món — dễ nhầm.
- `server/routes/products.js` POST / PUT `/:id` trả hàng thô không có `anh` (màn Sản phẩm không dùng).
- Màn khách (`manKhach.js`) và đơn App chưa hiện ảnh món (phiếu không yêu cầu).

## CHƯA KIỂM
- Canvas thu nhỏ (cắt vuông, WebP / JPEG, `createImageBitmap`) chạy trong trình duyệt thật — máy không kiểm được; chủ quán thử tay (dưới).
- Ảnh tải lỗi (`onError` → chữ viết tắt): chỉ dò chuỗi, vẽ tĩnh không bắn được sự kiện lỗi.
- `--day-du`, `node tu_chay/cong.js chay`, `/ra-soat`, `/soat-bao-mat`: CHƯA chạy (dừng ở câu hỏi trên).
- Tốc độ quầy với ảnh thật trên mạng 4G / máy yếu.
