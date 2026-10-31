# KH-SP-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh `viec/KH-SP-1`; `git fetch origin viec/KH-SP-1` xong. HEAD = `0ee84b9`, FETCH_HEAD = `0ee84b9` (bằng nhau, không kéo).
- `git log --oneline -3` lúc mở phiên:
  - `0ee84b9 PHIEU: KH-SP-1`
  - `97d1de2 TIEN-DO: KH-API-3 (a95634f), KHACH-CK-1 (4b52370) xong; mo KH-MUA-1, KHO-2b, KH-SP-1, BH-CKTAY-1; quyet dinh 31.10 (bo giam tay, dat don App vi+QR); luat 6.9 — so v49`
  - `4b52370 Merge pull request #55 from pos-tuquyduong/viec/KHACH-CK-1`

## Quyết định làm (phương án đơn giản nhất của phiếu)
- 5 cột trên `pos_products` (bước 005) + MỘT cửa ghi `PUT /api/pos/products/thong-tin` + MỘT component `client/src/components/ThongTinMon.jsx`
  (form ở Cài đặt → Sản phẩm; dấu ⓘ + thẻ ở Sales.jsx và BanHang/BanHangMoi.jsx). Không bảng mới.
- Hằng số mã: nguồn máy chủ `server/utils/thongTinMon.js`; bản cho giao diện `client/src/utils/thongTinMon.js` (Vite không nạp được CJS của
  server) — `cong_cu/thu_KHSP1.js` mục D đọc NGUỒN file giao diện và so bằng máy chủ (đổi một bên mà quên bên kia → ĐỎ).
- Trường vắng khoá trong thân `PUT` = giữ nguyên (khuôn `PUT /api/kh/toi`); form giao diện luôn gửi đủ 5 trường.
- Món chưa có hàng `pos_products` (chưa đặt giá): cửa ghi tạo hàng giá 0 (khuôn `sync-from-sx`) → chưa bán được, không vào menu khách.

## Bảng "chỗ vá → đột biến" (viec/KH-SP-1/dot_bien.py — 39 đột biến, BẮT 39 · SỐNG 0 · HỎNG 0 · LẠC 0; đối chứng XANH)
| Chỗ vá | Đột biến |
|---|---|
| nang_cap/005 thêm 5 cột | BV-005-COT · VS-005-THIEU-COT |
| nang_cap/005 bỏ qua kho thiếu bảng | BV-005-KIEM-BANG (bắt bởi thu_KHO2a E6b) |
| thongTinMon.js mã hợp lệ / trùng / mảng | VS-MA-LA-LOT · VS-MA-TRUNG-LOT · VS-MA-CHEO-LOT · VS-MANG-KHONG-PHAI-MANG |
| thongTinMon.js giới hạn 160 / 160 / 200 (cả hai phía) | VS-MO-TA-161 · VS-CONG-DUNG-161 · VS-THANH-PHAN-201 · VS-MO-TA-159 · VS-THANH-PHAN-199 |
| thongTinMon.js đếm ký tự thật | VS-DEM-BYTE |
| thongTinMon.js rỗng = xoá, cắt khoảng trắng | VS-KHONG-CAT-KHOANG-TRANG · VS-RONG-KHONG-XOA · VS-MANG-RONG-KHONG-XOA |
| thongTinMon.js trường vắng giữ nguyên | VS-TRUONG-VANG-GHI-DE |
| products.js quyền + đăng nhập | BV-QUYEN-CAI-DAT · BV-DANG-NHAP |
| products.js tạo hàng món chưa có giá (giá 0) | BV-TAO-HANG-MON-MOI · VS-HANG-MOI-CO-GIA |
| products.js ghi không đổi giá (K5) | VS-GHI-DOI-GIA · VS-DOI-GIA-XOA-THONG-TIN |
| products.js kiểm món + có trường để ghi | BV-THIEU-LOAI-MON · BV-KHONG-TRUONG-NAO |
| products.js quầy thấy thông tin | BV-QUAY-THONG-TIN |
| kh/index.js menu thêm trường + anh null | BV-MENU-ANH · VS-MENU-ANH-CHUOI · BV-MENU-NHU-CAU |
| thongTinMon.js đọc ra `[]` / `null` | VS-DOC-NULL-THAY-MANG · VS-DOC-CHUOI-RONG |
| hằng số giao diện = máy chủ | VS-GIAO-DIEN-MA-NHU-CAU · VS-GIAO-DIEN-MA-THE-CHAT · VS-GIAO-DIEN-GIOI-HAN |
| HOP_DONG_API_KH.md v4 | BV-HOPDONG-ANH · BV-HOPDONG-NHU-CAU · VS-HOPDONG-TEN-LA · VS-HOPDONG-PHIEN-BAN · BV-HOPDONG-NHAT-KY |

## Phát hiện (không sửa)
- `thu_HOPDONG_KH.js` chỉ kiểm chiều "trường ghi trong hợp đồng có thật trong câu trả lời" — trường THÊM trong code mà quên ghi hợp đồng không bị
  bắt (2 đột biến `BV-HOPDONG-ANH/NHU-CAU` ban đầu SỐNG). Đã vá bằng mục E của `thu_KHSP1.js` (so bộ khoá hai chiều cho `/menu`); các cửa khác
  của hợp đồng vẫn chỉ một chiều. Đề xuất việc sau: nâng cùng phép hai chiều vào chính `thu_HOPDONG_KH.js` cho mọi cửa.
- Phạm vi phiếu ghi `thu_KHAPI3.js` nhưng bài khoá danh sách trắng menu là `thu_KHAPI2.js` (E3) và cột `pos_products` là `thu_KHO1.js` (D1) — đã sửa
  đúng dòng danh sách theo LUẬT §6 mục 7 (vẫn so BẰNG), không dừng hỏi. `thu_KHAPI3.js` không phải sửa.
- Cảnh báo cũ "route GET có lệnh ghi (3)" (packages.js, products.js:69 = ghi nhớ tồn trong `layMenuQuay`, sync.js) có từ trước việc này, không đổi.
- `GET /api/pos/products` (quầy) nay trả thêm 5 trường (`nhu_cau[]`…); `Sales.jsx` / `BanHangMoi.jsx` tự dùng, không bài thử cũ nào khoá bộ khoá của nó.

## Câu hỏi
(không có)
