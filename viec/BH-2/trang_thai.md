# BH-2 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh `viec/BH-2`; fetch xong, HEAD = FETCH_HEAD = `cbbb809` (cùng SHA, không cần kéo).
- `git log --oneline -3`:
  - `cbbb809 PHIEU: BH-2`
  - `0e846ff TIEN-DO: HD-1 (c23773a) xong; mo BH-2; 10 quyet dinh 29.10 vao QUYET_DINH; luat bai thu danh sach trang; them BH-3, LAMTRON-HANG-1 — so v46`
  - `c23773a Merge pull request #50 from pos-tuquyduong/viec/HD-1`

## Quyết định nhỏ (không đổi nghiệp vụ)
- Mọi cách thu (tiền mặt, tài khoản, QR) đi MỘT đường `/thanh-toan/phien` (→ `/chot` hoặc webhook payOS); màn mới không còn gọi `POST /orders`. PIN gửi kèm `/phien` (máy chủ kiểm); `POST /thanh-toan/pin` chỉ để ĐẶT PIN lần đầu ở quầy.
- Khách chưa có PIN: biết bằng lỗi `CHUA_CO_PIN` (tìm khách không trả `co_pin`); máy chủ không nói ví nào thiếu → thử đặt lần lượt khách rồi mẹ (ví đã có PIN trả `PIN_DA_CO`).
- "Hôm nay" = route `/hom-nay` dùng lại `Reports` (mặc định đã là hôm nay). Ô Quản lý chỉ dẫn tới TRANG (Settings/Kho giữ tab bằng state, không đọc query; không sửa được). Lối Hoàn tiền / Số dư: `ThanhLoi` bọc ngoài `Orders` / `Customers` ở App.jsx.
- Màn kết thúc vẽ tab Tờ khách / Tờ lưu / Tem bằng HD-1; nút In mở `InvoicePrint` (cấm sửa) ở chế độ tự in với cài đặt ghi đè (số tờ, tu_mo) — đường in duy nhất của quầy.
- `menu.js` giữ tên + quyền + thứ tự; Layout giữ icon theo đường dẫn (bài thu_KHO1 A5 đòi đúng một `to: '/kho'` trong Layout.jsx).
- `dungDonHang` và ca I1–I11 của thu_BH1 bỏ (thân đơn giờ do phiên dựng, thử trên máy chủ thật).

## Câu hỏi
- **Chiết khấu riêng của khách** (`discount_type/value` trên hồ sơ khách): `tinh-thu` và phiên KHÔNG nhận trường này (danh sách trắng máy chủ) → màn mới KHÔNG áp, khác màn cũ. Chủ quán quyết: chấp nhận / cần máy chủ nhận trường này (việc có `server/`). Trước khi quyết, đừng bật màn mới cho khách có chiết khấu riêng.
- Soát kế hoạch bằng agent phụ (bước 3) chưa làm; thay bằng `/ra-soat` ở cuối.

## Phát hiện (ngoài phạm vi, không sửa)
- `InvoicePrint.jsx` còn "Tiền thối"; fetch trần ở InvoicePrint (đã nằm trong bánh cóc).
- `viec/BH-1/dot_bien.py` giờ HỎNG nhiều đột biến (dungDonHang đã bỏ) — hồ sơ lịch sử, không chạy lại.
- `GET /orders/:id` không trả `signup_code` → màn kết thúc dựa `GET /hoa-don/:id` (HD-1 có `ma_nhan_diem`).

## Bảng chỗ vá → đột biến (`python3 viec/BH-2/dot_bien.py` → 64/64 BẮT sau vòng sửa 1, đối chứng xanh)
| Chỗ | Đột biến |
|---|---|
| tinh.js khoaTinh / chuanMa | BV-khoa-bo-ma · VS-khoa-tinh-ca-ghi-chu · VS-khoa-bo-khach · VS-khoa-bo-so-luong · VS-ma-khong-viet-hoa |
| tinh.js thanTinhThu | BV-tinh-thu-mang-tien · VS-tinh-thu-ma-rong-khong-null |
| tinh.js coSoMayChu / nutThuSang / coGia | BV-so-may-chu-cu-van-dung · VS-so-may-chu-thieu-tong · BV-nut-thu-bo-coSo · VS-nut-thu-bo-dangGui · VS-nut-ck-luon-sang · BV-gia-0-van-ban |
| tinh.js conLaiGiay / dinhDang / hanhDongPhien | VS-gio-het-han-theo-utc · VS-dem-nguoc-lam-tron-xuong · VS-dem-nguoc-am · VS-dinh-dang-giay-thieu-so-0 · VS-phien-het-han-van-doi · VS-phien-xong-bi-bo · VS-phien-la-tu-nha |
| tinh.js chiaTra / cachTraKhaDung | VS-chia-vuot-tong · VS-chia-me-tren-tong · BV-chia-bo-nut-bo · VS-chia-so-du-am · VS-cach-tra-het-nut · VS-cach-tra-0-van-tien-mat |
| tinh.js PIN | VS-pin-khoa-nhap-lai · VS-pin-chua-co-bo-qua · VS-dat-pin-khong-so-khop · VS-pin-nam-so · VS-pin-phim-la |
| tinh.js thanPhien | VS-phien-pin-luon-gui · VS-phien-me-quen-dieu-kien · BV-phien-gui-tien · VS-phien-doi-cach · BV-phien-mat-khach |
| QuanLy/menu.js | BV-menu-con-dang-ky-moi · VS-hom-nay-khong-quyen · BV-bo-kiem-quyen · BV-o-rong-van-hien · VS-loi-hoan-tien-khong-quyen · VS-loi-so-du-sai-duong · VS-menu-dien-thoai-them-hoan-tien |
| BanHangMoi / ManQr / ManKetThuc | BV-thu-bang-orders-create · VS-xac-nhan-tay-ai-cung-thay · VS-nut-da-nhan-ck · BV-qr-khong-hoi-phien · BV-ket-thuc-mat-to-luu · BV-ket-thuc-mat-tra-lai · BV-lien-chong-bam-doi · BV-khoa-luoi-sau-thanh-toan |
| Layout / App / bộ kiểm | VS-layout-con-dang-ky-moi · BV-app-mat-route-quan-ly · BV-app-mat-route-cu · BV-app-trang-chu-ve-sales · BV-bo-bai-khoi-bo-kiem |
| cấu trúc BanHang | VS-fetch-tran · VS-van-dung-orders-create · VS-ghi-no |

Tên đủ (59): BV-khoa-bo-ma, VS-khoa-tinh-ca-ghi-chu, VS-khoa-bo-khach, VS-khoa-bo-so-luong, VS-ma-khong-viet-hoa, BV-tinh-thu-mang-tien, VS-tinh-thu-ma-rong-khong-null, BV-so-may-chu-cu-van-dung, VS-so-may-chu-thieu-tong, BV-nut-thu-bo-coSo, VS-nut-thu-bo-dangGui, BV-gia-0-van-ban, VS-nut-ck-luon-sang, VS-gio-het-han-theo-utc, VS-dem-nguoc-lam-tron-xuong, VS-dem-nguoc-am, VS-dinh-dang-giay-thieu-so-0, VS-phien-het-han-van-doi, VS-phien-xong-bi-bo, VS-phien-la-tu-nha, VS-chia-vuot-tong, VS-chia-me-tren-tong, BV-chia-bo-nut-bo, VS-chia-so-du-am, VS-cach-tra-het-nut, VS-cach-tra-0-van-tien-mat, VS-pin-khoa-nhap-lai, VS-pin-chua-co-bo-qua, VS-dat-pin-khong-so-khop, VS-pin-nam-so, VS-pin-phim-la, VS-phien-pin-luon-gui, VS-phien-me-quen-dieu-kien, BV-phien-gui-tien, VS-phien-doi-cach, BV-phien-mat-khach, BV-menu-con-dang-ky-moi, VS-hom-nay-khong-quyen, BV-bo-kiem-quyen, BV-o-rong-van-hien, VS-loi-hoan-tien-khong-quyen, VS-loi-so-du-sai-duong, VS-menu-dien-thoai-them-hoan-tien, BV-thu-bang-orders-create, VS-xac-nhan-tay-ai-cung-thay, VS-nut-da-nhan-ck, BV-qr-khong-hoi-phien, BV-ket-thuc-mat-to-luu, BV-ket-thuc-mat-tra-lai, BV-lien-chong-bam-doi, BV-khoa-luoi-sau-thanh-toan, VS-layout-con-dang-ky-moi, BV-app-mat-route-quan-ly, BV-app-mat-route-cu, BV-app-trang-chu-ve-sales, BV-bo-bai-khoi-bo-kiem, VS-fetch-tran, VS-van-dung-orders-create, VS-ghi-no.

## Nghiệm thu từng mục
- A: A1–A15 + R1–R2 (khoá không đổi khi ghi chú; thân tinh-thu; nút thu tắt khi chưa có số / số cũ; "Chưa có giá"; `ma_loi` thật từ máy chủ) · S2.
- B: B1–B3, F-dãy tờ giữ từ thu_BH1.
- C: C1–C7, R6–R10 (phiên payOS giả, hỏi, huỷ, hết hạn, xác nhận tay cần quyền + lý do) · S5–S7.
- D: D1–D17, R11–R14 (giữ → chốt, tài khoản đủ, PIN sai 5 lần → 423, chưa có PIN → đặt → gửi lại).
- E: R5 (`GET /hoa-don/:id` đủ phần màn vẽ) · S9–S10 · S11–S12.
- F: F1–F8 · S14–S15.
- G: G1 (git: `server/`, Sales.jsx, file Cấm không đổi) · S16 (công tắc mặc định TẮT, route index TrangChu) · thu_BH1 còn 62 đạt.

## Báo cáo 7 mục
VIỆC:        BH-2 — Màn Bán hàng mới đợt 2: thu tiền thật (QR payOS · PIN · giữ tiền) · giá hạng + ưu đãi máy chủ tính · màn kết thúc HD-1 · menu 6 mục
ĐÃ SỬA:      client/src/pages/BanHang/ (tinh.js, BanHangMoi.jsx, ThuTien.jsx, ManKetThuc.jsx, mới ManPin.jsx, ManQr.jsx); client/src/pages/QuanLy/ (mới menu.js, QuanLy.jsx, ThanhLoi.jsx); client/src/utils/api.js (thanhToanApi, hoaDonApi, ordersApi.tinhThu); client/src/components/Layout.jsx (menu qua dungMenu); client/src/App.jsx (route quan-ly, hom-nay, ThanhLoi); client/dist; cong_cu/thu_BH2.js (mới), cong_cu/thu_BH1.js (bỏ mục I), kiem_tra_truoc_khi_giao.js (thêm thu_BH2.js).
BÀI THỬ:     cong_cu/thu_BH2.js trên gốc cbbb809 → ĐỎ 6 đạt · 70 hỏng; sau khi vá → XANH 100 đạt · 0 hỏng. Đột biến 64/64 BẮT. npm test -- --day-du: PASS 81 · FAIL 0 · CẢNH BÁO 1.
ĐÃ RÀ K4:    grep "ordersApi.create" trong BanHang/ → 0 (S3); grep "fetch(" trong BanHang/ + QuanLy/ → 0 (S1); mọi chỗ tạo phiên (chayPhien) đều đi qua kiểm tổng/còn lại với số máy chủ; mọi lối chốt hỏng đều hỏi lại phiên trước khi nhả (tránh đơn đôi).
CHƯA KIỂM:   (0) phiên QR mồ côi nếu phản hồi tạo phiên mất (phiên tự hết hạn sau 10 phút, ví bị giữ tạm); gõ thêm món trong lúc đang gửi thu có thể mất món (tiền không lệch); ManQr nuốt lỗi hỏi phiên; chưa có bài thử hành vi React cho chayPhien (chỉ hàm thuần + máy chủ thật + khoá cấu trúc); (1) chưa chạy giao diện trong trình duyệt (người gác chặn script có chữ "token"; vite build chỉ chứng minh cú pháp/nhập khẩu); (2) QR payOS thật, webhook thật, in thật (InvoicePrint tự in), tem thật — chưa thử; (3) chiết khấu riêng của khách không áp ở màn mới (xem Câu hỏi); (4) hạng/giá hạng ở lưới món vẫn tính ở máy khách để hiển thị, số trên giỏ/thu là của máy chủ; (5) kịch bản hai quầy cùng giữ một ví chỉ có ở bài P3, không lặp lại ở đây; (6) đồng hồ đếm ngược dựa đồng hồ máy khách, quyết định hết hạn luôn là trạng thái máy chủ; (7) chưa soát kế hoạch bằng agent phụ (bước 3); (8) tay: mở /?man=moi, thử khách lẻ tiền mặt, khách có tài khoản + PIN, QR trên điện thoại.
GIT:         xem dòng log ở cuối file.
BÀI HỌC:     KHOÁ 5 · NGUYÊN TẮC 1 · BỎ 2 — chi tiết ở ## Báo cáo soát độc lập (vòng 1 — agent độc lập, chép ý)
KHÔNG ĐẠT. Lỗi: (1) hoanTat dự phòng khi đọc đơn hỏng hiện "Trả lại 0đ / Tổng 0đ" (K4); (2) chiết khấu riêng của khách bị bỏ im lặng, chỉ có lời dặn (K5/K8, C16); (3) số dư khách không nạp lại khi lệch giữ tiền → thu lặp lỗi; phiên mồ côi; (4) chốt hỏng + hỏi phiên hỏng → nhả và cho thu lại → đơn đôi (K1 "mọi lối chốt hỏng đều hỏi lại"). Nghi ngờ: ManQr bị tháo giữa chừng; sửa giỏ lúc đang gửi; ManQr nuốt lỗi hỏi phiên; tinh-thu lỗi không có nút thử lại; thu_BH1 bỏ mục I lớn hơn phiếu (cần chủ quán duyệt). Nghiệm thu 7/7 ở mức hàm/cấu trúc. Chưa soát được: giao diện chạy thật, payOS/in thật.

## Vòng sửa 1
1. hoanTat dự phòng: tổng = tổng phiên, trả lại = khách đưa − còn lại (S20 + VS-hoan-tat-du-phong-tra-lai-0).
2. Khoá chiết khấu riêng: `coChietKhauRieng` → ThuTien không sáng + dòng cảnh báo đỏ (D18, S19 + BV-chiet-khau-rieng-khong-khoa, BV-man-moi-bo-khoa-chiet-khau). Chủ quán vẫn cần quyết (xem Câu hỏi).
3. Số dư lệch → `lamMoiSoDu` nạp lại trước khi báo (S21 + BV-khong-nap-lai-so-du).
4. Chốt hỏng + hỏi phiên hỏng → báo "KHÔNG thu lại ngay, mở Đơn hàng kiểm tra", không nhả (S22 + BV-mat-mang-van-nha-phien). Thêm nút "Thử lại" khi tinh-thu lỗi.
Không đổi: gọn hoá hoanTatRef/anhQr (đúng chức năng, ghi nhận), tách chayPhien thành file riêng (BanHangMoi ~400 dòng, dưới 500), B3 giữ (hàm thuần giống màn cũ), thu_BH1 bỏ mục I — **chủ quán duyệt giúp** (ca I11 là ca duy nhất khoá chiết khấu riêng; nay D18/S19 thay vai trò).

## Bài học

## Bài học
- KHOÁ: (a) đột biến BV-lien-chong-bam-doi SỐNG ở vòng đầu (S12 chỉ khớp tên biến) → siết regex đúng chỗ `if (dangGuiRef.current || !coSo)` (đã làm, có đột biến). (b) thêm ca D3b vì VS-chia-me-tren-tong SỐNG (ca mẹ chưa phủ trường hợp số dư khách + mẹ > đơn) (đã làm).
- KHOÁ (thêm theo soát): (c) khoá chiết khấu riêng bằng code + ca D18/S19 thay lời dặn; (d) dự phòng hoanTat cùng công thức máy chủ (S20); (e) nạp lại số dư khi lệch (S21), thông báo khi hỏi phiên hỏng (S22).
- NGUYÊN TẮC: câu báo cáo dạng "mọi lối … đều …" phải kèm đột biến gỡ vế đó; đường dự phòng phải dùng cùng công thức đường chính (đề xuất cho KHUON_LOI.md, ngoài Phạm vi — chat soát duyệt).
- BỎ: người gác chặn script nháp có chữ "token" (không chạy được khói giao diện), `sed -i`, `git rm --cached`, vòng `until` — đổi sang Edit / lệnh đơn giản; thu_KHO1 A5 đòi `to: '/kho'` trong Layout.jsx (đã điều chỉnh bố trí, một lần).
- Dọn: chưa thấy lời dặn nào đã có phép máy làm thay hoàn toàn.
