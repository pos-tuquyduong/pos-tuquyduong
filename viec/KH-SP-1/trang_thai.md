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

## Bảng "chỗ vá → đột biến" (viec/KH-SP-1/dot_bien.py — 41 đột biến, BẮT 41 · SỐNG 0 · HỎNG 0 · LẠC 0; đối chứng XANH)
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
| products.js tạo hàng món chưa có giá (giá 0, tên + mã thật) | BV-TAO-HANG-MON-MOI · VS-HANG-MOI-CO-GIA · BV-TEN-HANG-MOI · BV-MA-HANG-MOI |
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

## Soát độc lập (/ra-soat) — vòng 1: KHÔNG ĐẠT → đã sửa
- LỖI 1 (K5+K3): `PUT /thong-tin` tạo hàng mới tên cứng 'Từ SX' → hoá đơn có thể in "Từ SX" (batch giá chỉ UPDATE giá, không sửa tên). ĐÃ SỬA:
  form gửi kèm `name` / `code`, cửa ghi dùng khi tạo hàng (`tenHopLe`, products.js); thêm 2 ca B8 + đột biến BV-TEN-HANG-MOI, BV-MA-HANG-MOI.
- LỖI 2 (ghi nhận): hàng mới giá 0, `nhapSx.js` dùng NULL — cùng nghĩa "chưa bán được" (sellable cần > 0); `sync-from-sx` cũng dùng 0. Giữ nguyên.
- Nghi ngờ nhẹ, KHÔNG sửa (ngoài mục tiêu/giống `/price`): UPDATE-rồi-INSERT không giao dịch (đua hai PUT cùng món mới → 500); `sx_product_type`
  không kiểm ∈ {tea,juice}; ký tự điều khiển trong chữ; `MA_KHONG_HOP_LE`/`QUA_DAI` không có trong `ma_loi` hợp đồng (cửa ghi ngoài /api/kh — chủ ý, ghi ở "Ghi chú v4").
  Đã sửa: client đếm ký tự sau `trim` (khớp máy chủ).
- Nghiệm thu theo người soát: A, D, E có; F có phần (không có ca riêng cho hoàn / Giờ vàng — cột mới chỉ thêm vào SELECT *); B, C chỉ có build
  + đọc code, không bài thử bấm thật → chủ quán thử tay (dưới).

## Thử tay cho chủ quán (điện thoại / máy quầy)
1. Cài đặt → Sản phẩm → bấm "Nhập" ở một món → chọn vài nút nhu cầu / thể chất, gõ mô tả → "Lưu thông tin món" (thấy "Đã lưu"). Thử một món CHƯA đặt giá.
2. Màn Bán hàng (cũ và mới): món vừa nhập có dấu ⓘ; chạm ⓘ → hiện thẻ, chạm ngoài đóng — giỏ KHÔNG thêm món. Món chưa nhập không có dấu.
3. Mở menu App KH (`/api/kh/menu`) → món có `nhu_cau`, `mo_ta`…; món chưa nhập có `[]` / `null`; `anh` luôn `null`.

## Bài học
- KHOÁ 1: ca B8 (tên + mã hàng mới) + 2 đột biến — đã làm (thu_KHSP1.js, dot_bien.py). Lỗi soát bắt: đường INSERT mới vào `pos_products` mang tên cứng.
- NGUYÊN TẮC 1 (đề xuất, ngoài Phạm vi — `KHUON_LOI.md`): K4 — `pos_products` có 5 chỗ INSERT (products.js ×3, nhapSx.js, database.js) với quy ước tên/giá khác nhau;
  thêm chỗ thứ sáu thì gom qua một hàm tạo hàng chung trước. Ví dụ thật: vòng soát 1 KH-SP-1.
- NGUYÊN TẮC 2 (đề xuất): việc có giao diện mà không có bài thử bấm thật phải ghi sẵn 1–3 thao tác thử tay (đã ghi ở trên).
- KHOÁ 2 (đề xuất, ngoài Phạm vi): nâng `thu_HOPDONG_KH.js` kiểm hai chiều (trường thêm trong code mà quên ghi hợp đồng) cho mọi cửa; đỏ trước bằng đột biến BV-HOPDONG-ANH.
- BỎ 1: lệnh bị người gác chặn vì ghép nhiều lệnh/heredoc — chỉ lỗi thao tác, đã tách lệnh.

## Cổng và báo cáo 7 mục
✓ CỔNG CHẠY ĐẠT  (`node tu_chay/cong.js chay . 0ee84b9^ HEAD viec/KH-SP-1`; kèm cảnh báo A16: bài thử mới dừng sớm trên gốc — 13 ca ≠ 43 — vì cửa ghi 404, đúng chủ ý)
`npm test` PASS 83 · `npm test -- --day-du` PASS 87 · FAIL 0 · đột biến 41/41 BẮT.

```
VIỆC:        KH-SP-1 — Thông tin ngắn của món: nhập ở màn Sản phẩm · hiện gọn ở quầy · /api/kh/menu trả thêm (hợp đồng v4)
ĐÃ SỬA:      server/nang_cap/005_thong_tin_mon.js — 5 cột pos_products · server/utils/thongTinMon.js — hằng số mã + kiểm + đọc ra ·
             server/routes/products.js (cửa PUT /thong-tin, layMenuQuay trả thêm) · server/routes/kh/index.js (monKhach +6 trường) ·
             client/src/components/ThongTinMon.jsx + utils/thongTinMon.js + utils/api.js · Settings.jsx (nút Nhập/Sửa + form) ·
             Sales.jsx và BanHang/BanHangMoi.jsx (+banHang.css) (dấu ⓘ) · client/dist (đã build) · HOP_DONG_API_KH.md v4 ·
             danh sách trắng ở thu_KH1.js E5, thu_KHAPI2.js E3, thu_KHO1.js D1
BÀI THỬ:     cong_cu/thu_KHSP1.js trên gốc 0ee84b9 → ĐỎ (13 ca: thiếu cột, cửa ghi 404, menu thiếu trường, thiếu hằng số, hợp đồng v3); sau vá → XANH 43/43.
             3 bài cũ sửa dòng danh sách: đỏ trên gốc, xanh sau vá (bang_chung_do.txt). Đột biến 41/41 BẮT (dot_bien.py).
ĐÃ RÀ K4:    grep "pos_products" trong server/ → backup.js (SELECT * / cột động), orders.js (SELECT *), nhapSx.js, kho/duLieu.js, database.js:
             không chỗ nào liệt kê cột cố định; 5 chỗ INSERT, chỉ chỗ mới ở products.js do việc này thêm. Sót đã bắt: tên 'Từ SX' (đã sửa).
CHƯA KIỂM:   giao diện KHÔNG chạy thật trên trình duyệt (chỉ build + đọc code + người soát đọc): form Nhập/Sửa, dấu ⓘ, thẻ, bố cục ô món ở
             BanHangMoi — cần chủ quán thử 3 thao tác ở trên. Không có ca riêng cho hoàn / Giờ vàng / sync-from-sx với hàng đã có thông tin
             (chỉ đọc code: cột mới đi theo SELECT *). Đua hai PUT cùng món mới có thể 500 (như /price). Ký tự điều khiển trong chữ chưa chặn.
GIT:         xem dòng dưới
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 2 (đề xuất) · BỎ 1 — chi tiết ở ## Bài học
```

HEAD ĐÃ KIỂM: f81ec27
