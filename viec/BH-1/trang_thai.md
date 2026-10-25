# BH-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh `viec/BH-1`; fetch xong, HEAD = FETCH_HEAD = `21494c0` (cùng SHA, không cần kéo).
- `git log --oneline -3`:
  - `21494c0 PHIEU: BH-1`
  - `5bee3b2 TIEN-DO: QUAY-AN-1 (cfb3f02), P24 (5cb2a03) xong; P3 duyet (tach P3b); mo DIEM-THAT-1 + BH-1; them P3b, BH-2; lich — so v40`
  - `5cb2a03 Merge pull request #43 from pos-tuquyduong/viec/P24`

## Quyết định nhỏ (không đổi nghiệp vụ — chủ quán xem lại nếu muốn khác)
- **Chỗ bật công tắc**: `Settings.jsx` / `Layout.jsx` ngoài Phạm vi, màn cũ phải giữ y như hôm nay → bật bằng địa chỉ `/?man=moi` (tắt: `/?man=cu`), hoặc panel "⚙ Màn bán hàng" trong màn mới (Tự động / Điện thoại / Máy tính bảng + "Tắt — về màn cũ").
- **Khung chọn món**: đợt 1 mọi đồ uống đều có ghi chú nhanh mặc định → chạm món LUÔN mở khung (món có khung = 4 chạm theo mục 4 của đặc tả).
- **Màn kết thúc**: lưới món khoá (mờ, không chạm được) tới khi `InvoicePrint` báo in xong; nút "Đơn mới" luôn bấm được (đơn đã ghi khi thu tiền, không mất).
- **Không có** mã giảm giá / gói / thẻ hội viên / phí giao trong màn mới (đợt 1; UUDAI-1, GIAO-1…). Chiết khấu riêng của khách vẫn áp như màn cũ.

## Câu hỏi
- Có muốn thêm mục bật "Màn bán hàng mới" vào trang Cài đặt (cần mở Phạm vi `client/src/pages/Settings.jsx`)? Hiện chỉ bật bằng `/?man=moi` hoặc panel trong màn mới. (Không chặn việc này.)

## Phát hiện (ngoài phạm vi, không sửa)
- `InvoicePrint.jsx:440` còn chữ "Tiền thối" (phiếu dặn dùng "trả lại"); `Sales.jsx` dùng `fetch` trần ở 5+ chỗ (đã nằm trong bánh cóc).

## Bảng chỗ vá → đột biến (`python3 viec/BH-1/dot_bien.py` → 42/42 BẮT, đối chứng xanh; vòng sửa 1 thay VS-dua-du-khong-can-phai-tra bằng BV-don-0d-bi-chan, VS-dua-du-bang-la-thieu và thêm BV-khoa-luoi-sau-thanh-toan, BV-chong-bam-doi, BV-nut-thu-khong-khoa)
| Chỗ (file) | Đột biến |
|---|---|
| `tinh.js` traLai / duDuoc | BV-tra-lai-am · VS-dua-du-khong-can-phai-tra |
| `tinh.js` danhSachTo | VS-to-bang-so-phai-tra · VS-to-bo-to-ngay-duoi · VS-bo-gioi-han-4-nut |
| `tinh.js` tachTrang | VS-ngung-hep-bang-600 · VS-kieu-ep-bi-bo |
| `tinh.js` docCongTac | VS-cong-tac-mac-dinh-bat · VS-cong-tac-bat-khi-gia-tri-la · BV-kho-hong-doc |
| `tinh.js` giaHang / phanTramHang | BV-chan-hang-90 · VS-hang-am-khong-ve-0 · VS-hang-dac-biet-lay-nhom-thuong · VS-hang-het-han-van-giam |
| `tinh.js` tinhGio | VS-hang-cong-voi-flash · VS-flash-khi-khong-chay · BV-khach-giam-vuot-don |
| `tinh.js` kiemTraThem | VS-ton-kho-bang-nhau · VS-ton-kho-xa-hon-1 · BV-khong-quan-kho · BV-gia-null |
| `tinh.js` ghepGhiChu | BV-ghi-chu-cat-200 · VS-ghi-chu-khong-bo-trung |
| `tinh.js` dungDonHang | BV-chuyen-khoan-quen-tien · VS-tien-mat-tinh-theo-khach-dua · VS-so-du-mot-phan-bi-quen · VS-tien-mat-khong-tru-so-du · BV-thieu-khoa-payload · VS-tu-goi-duoc-gui · VS-me-quen-phone |
| `kiem_tra_truoc_khi_giao.js` | BV-ten-bai-trong-bo-kiem |
| `App.jsx` / `Sales.jsx` | BV-app-tro-lai-sales · VS-sales-nhac-banhang |
| `BanHang/*` cấu trúc | VS-fetch-tran-trong-banhang · VS-tao-khach-o-quay · VS-ghi-no · VS-chu-thoi · VS-localstorage-ngoai-try |

Tên đủ (42): BV-don-0d-bi-chan, VS-dua-du-bang-la-thieu, BV-khoa-luoi-sau-thanh-toan, BV-chong-bam-doi, BV-nut-thu-khong-khoa, BV-tra-lai-am, VS-to-bang-so-phai-tra, VS-to-bo-to-ngay-duoi, VS-bo-gioi-han-4-nut, VS-ngung-hep-bang-600, VS-kieu-ep-bi-bo, VS-cong-tac-mac-dinh-bat, VS-cong-tac-bat-khi-gia-tri-la, BV-kho-hong-doc, BV-chan-hang-90, VS-hang-am-khong-ve-0, VS-hang-dac-biet-lay-nhom-thuong, VS-hang-het-han-van-giam, VS-hang-cong-voi-flash, VS-flash-khi-khong-chay, BV-khach-giam-vuot-don, VS-ton-kho-bang-nhau, VS-ton-kho-xa-hon-1, BV-khong-quan-kho, BV-gia-null, BV-ghi-chu-cat-200, VS-ghi-chu-khong-bo-trung, BV-chuyen-khoan-quen-tien, VS-tien-mat-tinh-theo-khach-dua, VS-so-du-mot-phan-bi-quen, VS-tien-mat-khong-tru-so-du, BV-thieu-khoa-payload, VS-tu-goi-duoc-gui, VS-me-quen-phone, BV-ten-bai-trong-bo-kiem, BV-app-tro-lai-sales, VS-sales-nhac-banhang, VS-fetch-tran-trong-banhang, VS-tao-khach-o-quay, VS-ghi-no, VS-chu-thoi, VS-localstorage-ngoai-try.

## Khói giao diện (không nằm trong kho)
Playwright + giả API, `client/dist` thật: điện thoại 390 px (Món → Giỏ → Đúng tiền → Đã nhận tiền → màn "Đã thanh toán · đơn #HD0009", payload đúng khoá) và máy tính bảng 1024 px (khách quen hạng Vàng −10%, trừ tài khoản 50.000, dãy tờ trả lại) — 0 lỗi console. Bắt được 1 lỗi thật: thanh điều hướng đáy của Layout (z-index 1000) che nút "Thêm vào giỏ" của khung trượt → nâng `.bh-lop` lên 1100.


## Báo cáo soát độc lập (vòng 1 — agent độc lập, chép nguyên ý)
KHÔNG ĐẠT (nhẹ: không lỗi tiền nặng; máy chủ tự tra giá, chỉ cash/transfer/balance_amount của client được dùng và phải cộng đúng tổng máy chủ).
LỖI TÌM ĐƯỢC:
1. ThuTien.jsx:36/63/72 + tinh.js:20 — K5: đơn tổng 0đ (chiết khấu khách ≥ đơn, tài khoản 0) không nút nào sáng; màn cũ cho qua. Bài thử F5 còn khoá đúng hành vi sai.
2. ThanhKhach.jsx:~62 — nghiệm thu C: `/v2/customers/search` không trả `points` nên dải khách không bao giờ hiện điểm.
3. thu_BH1.js S12/S13 — K3: chỉ grep tên biến, xoá khoá lưới / dangGuiRef / disabled vẫn xanh; dot_bien.py không có đột biến cho UI.
4. BanHangMoi.jsx:75-85 chonKhach/boKhach — K4: tra hạng về muộn gán cho khách kế tiếp (cùng khuôn Sales.jsx:296).
NGHI NGỜ: `dua` giữ nguyên khi bật/tắt trừ tài khoản; làm tròn hạng theo đơn vị vs máy chủ theo dòng (như Sales.jsx, không phải lỗi mới); "Đơn mới" trước khi In; khung chọn món luôn mở (4 chạm); `kq.order` thiếu sau khi đơn đã tạo (như màn cũ); `?man=` + StrictMode.
NGHIỆM THU: 8/9 có bằng chứng · thiếu: C (điểm).
CHƯA SOÁT ĐƯỢC: chạy giao diện thật; bán thật qua POST /orders; InvoicePrint, membership.js, /tiers, /settings phía máy chủ.

## Vòng sửa 1 (commit d7c5437)
1. `duDuoc` = đưa ≥ phải trả (đơn 0đ thu được); bỏ chặn `phaiTra<=0` ở nút chuyển khoản; F5 đổi; đột biến BV-don-0d-bi-chan + VS-dua-du-bang-la-thieu.
2. `chonKhach` gọi `GET /loyalty/points/:phone` (route có sẵn, loyalty.js:49) gắn `points` vào khách; lỗi thì chỉ không hiện điểm.
3. S12 / S13 siết thành regex đúng chỗ + 3 đột biến UI (BV-khoa-luoi-sau-thanh-toan, BV-chong-bam-doi, BV-nut-thu-khong-khoa).
4. Cờ lượt `luotKhach` cho tra hạng / điểm, `boKhach` tăng lượt.
5. `ThuTien` remount khi đổi `tong` / `soDuDung` / `soDuMeDung` (reset tiền khách đưa).
Không đổi: làm tròn hạng (đúng "như Sales.jsx"), "Đơn mới" trước In (đặc tả mục 16 cho phép), khung luôn mở (đã ghi ở Quyết định nhỏ), `kq.order` thiếu (cùng khuôn màn cũ — ghi Phát hiện).

## Báo cáo 7 mục
VIỆC:        BH-1 — Màn Bán hàng mới, đợt 1 (song song màn cũ, mặc định tắt)
ĐÃ SỬA:      client/src/pages/BanHang/ (tinh.js, ghiChuMacDinh.js, index.jsx, BanHangMoi.jsx, ThanhKhach.jsx, KhungChonMon.jsx, ThuTien.jsx, ManKetThuc.jsx, banHang.css); client/src/App.jsx (route index → TrangChu); kiem_tra_truoc_khi_giao.js (thêm tên thu_BH1.js vào mảng bài chạy thật); client/dist; cong_cu/thu_BH1.js.
BÀI THỬ:     cong_cu/thu_BH1.js trên bản gốc 21494c0 → ĐỎ 6 đạt · 67 hỏng (không nạp được tinh.js, App.jsx chưa trỏ TrangChu…); sau khi vá → XANH 73 đạt · 0 hỏng. Đột biến 42/42 BẮT. npm test -- --day-du: PASS 75 · FAIL 0 · CẢNH BÁO 1.
ĐÃ RÀ K4:    grep "fetch(" trong client/src/pages/BanHang/ → 0 chỗ (S2); grep "registrations|Thêm khách" → 0 (S4); grep "Ghi nợ|Chưa thu|mang ra bàn|thối" → 0 (S5, S6); khuôn "kết quả về muộn" (chonKhach) đã xử lý bằng luotKhach.
CHƯA KIỂM:   (1) chưa bán thật 4 ca K5 qua POST /orders trên máy chủ thật — mới kiểm payload (tập khoá == orderData của Sales.jsx) và chạy giao diện với API giả bằng Playwright 390 px / 1024 px; (2) chưa thử tay trên điện thoại / máy tính bảng thật, chưa thử in thật (InvoicePrint giữ nguyên, còn chữ "Tiền thối" của thành phần cũ); (3) tổng hiển thị theo cách Sales.jsx làm tròn từng đơn vị — máy chủ làm tròn theo dòng, lệch >1đ ở ca hiếm (3 x 10.010 @15%) sẽ bị máy chủ trả 400 chứ không ghi sai tiền; (4) số dòng giao diện ~800 (trong ngân sách ~900); (5) bundle JS 728 kB (trước ~673 kB); (6) chỗ bật công tắc chỉ là /?man=moi hoặc panel trong màn mới — chờ chủ quán quyết (xem Câu hỏi).
GIT:         xem dòng log ở cuối file.
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 1 · BỎ 2 — chi tiết ở ## Bài học

## Bài học
- KHOÁ: (a) soát bắt đơn 0đ bị chặn oan → ca F5 + đột biến BV-don-0d-bi-chan (đã làm, trong Phạm vi). (b) S12/S13 chỉ grep tên biến → siết regex đúng chỗ + 3 đột biến UI (đã làm). (c) dải khách không hiện điểm vì API tìm không trả `points` → thêm ca đọc cấu trúc canh ThanhKhach gọi API có trường điểm: CHƯA làm (ngoài khả năng bài hiện tại không chạm máy chủ) — đề xuất cho BH-2: bài thử màn khách đọc route trả `points`.
- NGUYÊN TẮC: khi nghiệm thu liệt kê dữ liệu hiển thị, tra API đang gọi có trả đúng trường đó chưa trước khi viết giao diện (đề xuất K9 cho KHUON_LOI.md, ngoài Phạm vi — chat soát duyệt). Ví dụ thật: điểm khách ở BH-1.
- BỎ: người gác chặn `sed -i`, `npx`, `cd` ghép, `python3 - <<EOF` (chỉ là cách làm việc, đã đổi sang Edit / file script trong nháp); lỗi nút "Thêm vào giỏ" bị thanh điều hướng đáy che (một lần, đã nâng z-index và có trong ghi chú).
- Dọn: chưa thấy lời dặn nào trong KHUON_LOI.md / CLAUDE.md đã có phép máy làm thay hoàn toàn để đề xuất xoá.
