# MANKHACH-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: viec/MANKHACH-1 · HEAD = FETCH_HEAD = 10b1abc (không kéo thêm)
```
10b1abc PHIEU: MANKHACH-1
18ee394 TIEN-DO: KHO-2b, BH-CKTAY-1, KH-QUAY-2, KH-MUA-1 xong; mo SEPAY-1, MANKHACH-1, KHO-IN-1, KH-SDT-1, them KHO-2c; quyet dinh 31.10 ...
596c346 Merge pull request #60 from pos-tuquyduong/viec/KH-MUA-1
```

## Câu hỏi (cần chủ quán quyết — không chặn việc này)
1. **Sao lưu bảng mới:** SAOLUU-2 CHƯA gộp (`backup.js` BACKUP_TABLES không có `pos_don_app`). `backup.js` ngoài Phạm vi nên KHÔNG sửa.
   Hai bảng mới `pos_man_khach_quay`, `pos_man_khach_may` (bước 009, không ở `database.js` nên phép E8 không bắt). Đề xuất: SAOLUU-2 thêm hai
   tên bảng; đây là dữ liệu tạm (mất thì ghép lại), khoá lưu dạng băm — nên cho vào BANG_KHONG_KHOI_PHUC.
2. **Mã ghép dùng nhiều lần trong 10 phút** (soát chỉ ra): ai thấy mã ở góc màn quầy có thể ghép thêm máy và xem QR / món các đơn sau.
   Đề xuất: giữ như phiếu (mã có hạn, đổi được, chủ quán thu hồi được từng máy); nếu muốn chặt hơn thì mã dùng một lần — cần chủ quán chốt.
3. **Chống dò mã chỉ theo IP, trong bộ nhớ** (5 lần sai / 10 phút / IP, mất khi Render khởi động lại). Khách dùng chung Wi-Fi quán nhập sai 5 lần
   sẽ khoá tạm cả tablet quầy 10 phút (chủ ý). Số tầng proxy của Render chưa kiểm. Đề xuất: chấp nhận cho khai trương, xem cột IP thật sau.
4. **Màn khách hiện tên hạng thẻ ("Hạng …"), mã giảm ("Mã …") và khoản trừ tài khoản** (không hiện số dư / SĐT / điểm). Phiếu Cấm không liệt kê
   các thứ này; nếu không muốn khách khác nhìn thấy thì đổi thành chữ chung "Ưu đãi".

## Phát hiện (ngoài Phạm vi, không sửa)
- `layMenuQuay` khi SX lỗi rơi về tồn cũ mà không đánh dấu (CLAUDE.md §5.8 muốn giá trị cuối + giờ + màu vàng); menu màn khách có thể hiện
  "còn hàng" theo tồn cũ. Sửa ở products.js — việc khác.
- `quayId` / `phienId` kiểu lạ (object) từ client nhân viên có thể ra 500 thay vì 400 — mức nhẹ, chỉ nhân viên có token gọi được.

## Bảng "chỗ vá → đột biến" (50 đột biến, dot_bien.py: 50 BẮT · 0 SỐNG · 0 HỎNG · 0 LẠC; đối chứng 50 đạt · 0 hỏng)
- Ghép mã (utils/manKhach.js ghep/xacThucKhoa): BV-MA-HET-HAN-VAN-GHEP · BV-KHOA-GOC-LUU-TRONG-KHO · BV-THU-HOI-VAN-DUNG-DUOC · BV-GIOI-HAN-LAN-SAI ·
  VS-GIOI-HAN-LECH-MOT · VS-KHONG-DAT-LAI-DEM-KHI-DUNG · BV-MO-QUAY-KHONG-CAP-MA-MOI · BV-DOI-MA-MA-CU-VAN-DUNG
- Cổng route (routes/man-khach.js): BV-TRANG-THAI-KHONG-CAN-KHOA · BV-DANH-SACH-MAY-KHONG-CAN-QUYEN · BV-MO-QUAY-KHONG-CAN-DANG-NHAP ·
  BV-DOI-MA-KHONG-CAN-DANG-NHAP · BV-BAO-PHIEN-KHONG-CAN-DANG-NHAP · BV-NOI-DUNG-KHONG-CAN-KHOA · BV-THU-HOI-KHONG-CAN-DANG-NHAP ·
  BV-DS-MAY-KHONG-CAN-DANG-NHAP · BV-THU-HOI-KHONG-CAN-QUYEN
- Thu hồi / danh sách: VS-THU-HOI-HET-MAY · VS-DS-MAY-LO-KHOA
- Báo phiên + trạng thái: BV-BAO-PHIEN-KHONG-KIEM-PHIEN · BV-BAO-PHIEN-QUAY-LA-TU-TAO · VS-TRANG-THAI-DOC-QUAY-KHAC · BV-PHIEN-HET-HAN-VAN-THU ·
  BV-PHIEN-KHONG-QR-VAN-THU · BV-CAM-ON-KHONG-HET · VS-CAM-ON-QUA-NGAN · VS-CAM-ON-QUA-DAI · VS-QR-TU-DUNG-LAI · VS-SO-PHAI-TRA-LA-TONG
- Riêng tư + món: VS-LO-TEN-KHI-CHUA-BAT · VS-LO-SDT-KHACH · BV-HIEN-TEN-KHONG-CHAY · BV-KIEM-LECH-TONG-PHIEN · BV-DONG-GIAM-KHONG-HIEN ·
  VS-THANH-TIEN-TRU-GIO-VANG-HAI-LAN
- Cài đặt (settings.js + kiemCaiDat): BV-KIEM-CAI-DAT-MAN-KHACH · VS-GIAY-TOI-THIEU-LECH · VS-GIAY-TOI-DA-LECH · VS-GIAY-TOI-DA-NOI-QUA · BV-ANH-BAT-DUOC ·
  VS-CHU-DAI-LECH · VS-CHU-DAI-NOI · VS-QUA-12-TRANG · VS-DIA-CHI-MOI-KIEU · VS-HIEN-TEN-NOI
- Nội dung rảnh: BV-TRANG-TAT-VAN-CHAY · BV-MENU-KHONG-DANH-DAU-HET · VS-MENU-LO-TON-KHO · BV-FLASH-KHONG-KIEM-DANG-CHAY · BV-FLASH-KHONG-TEN-MON

## Soát độc lập `/ra-soat` — vòng 1: KHÔNG ĐẠT (báo cáo về đầy đủ)
Lỗi chắc chắn / đáng sửa, ĐÃ SỬA ở vòng sửa 1 (commit 56ee4b6):
1. TrangRanh.jsx — trang rảnh ≥ 60 giây đứng yên (đồng hồ chuyển trang bị đặt lại mỗi phút khi nội dung làm mới) → hẹn giờ chỉ phụ thuộc số trang.
2. manKhach.css `.mk-ds` — dòng "Cần thanh toán" có thể bị cắt → cuộn + dòng tổng dính đáy.
3. ManChay.jsx — nhịp rảnh 4 giây lệch nghiệm thu B (≤ 2 giây) → 2 giây.
4. Lỗ phủ cổng xác thực (chỉ thử /quay/mo) → ca A17 (mọi route nhân viên không token → 401, /noi-dung không khoá → 401) + 5 đột biến.
Điểm NGHI NGỜ chuyển thành câu hỏi 2–4 ở trên, hoặc ghi Phát hiện. Lần soát thứ hai: xem cuối file.

## Bài học
- KHOÁ 1: ca A17 — cổng xác thực thử theo ĐỐI TƯỢNG (mọi route của router), không chỉ một route (đã làm, thu_MANKHACH1.js).
- KHOÁ 2: bài thử không được sập khi ghép hỏng sớm (4 đột biến LẠC lần đầu) — dùng `?.` ở mọi chỗ đọc kết quả có thể thiếu (đã làm).
- NGUYÊN TẮC 1 (đề xuất K9, ngoài Phạm vi — chat soát duyệt): hẹn giờ phụ thuộc đối tượng tái tạo mỗi lần làm mới dữ liệu sẽ về 0; giá trị cho
  phép của máy chủ (tới 120 giây) phải đi qua giao diện thật một lần. Đã gây: trang rảnh ≥ 60 giây đứng yên (MANKHACH-1).
- NGUYÊN TẮC 2: con số nghiệm thu ("≤ 2 giây") phải đo hoặc ghi CHƯA KIỂM; để 4 giây trong code mà báo đạt là K1.
- BỎ: ca "đỏ trên gốc 0 đạt · 1 hỏng" chỉ vì thiếu module — sức bắt thật nằm ở đột biến; lệnh bị người gác chặn (cd giữa lệnh, tee, Monitor/until) chỉ xảy ra một lần mỗi loại.

## BÁO CÁO 7 MỤC
VIỆC:        MANKHACH-1 — Màn khách: máy tính bảng ghép máy quầy; lúc thu hiện QR + món + tổng, lúc rảnh chạy nội dung quán cài
ĐÃ SỬA:      server/nang_cap/009_man_khach.js (2 bảng) · server/utils/manKhach.js (mới ~210 dòng) · server/routes/man-khach.js (mới) ·
             server/routes/settings.js (+3 dòng kiểm man_khach_*) · server/index.js (+1 dòng mount) · client/src/pages/ManKhach/** (trang /man-khach,
             MaGhep ở góc quầy) · client/src/pages/CaiDat/ManKhach.jsx + Settings.jsx (thẻ Cài đặt) · BanHangMoi.jsx (+nút mã ghép, báo phiên QR) ·
             App.jsx (route /man-khach) · utils/api.js (manKhachApi) · client/dist đã build · kiem_tra_truoc_khi_giao.js (+1 dòng đăng ký bài thử)
BÀI THỬ:     cong_cu/thu_MANKHACH1.js — chạy trên gốc 10b1abc → ĐỎ (0 đạt · 1 hỏng: chưa có routes/man-khach.js); sau khi vá → XANH 50 đạt · 0 hỏng
             SỐ CA thu_MANKHACH1.js: 50 · đột biến 50/50 BẮT (viec/MANKHACH-1/dot_bien.py) · npm test --day-du xanh (số liệu cuối bên dưới)
ĐÃ RÀ K4:    grep "router\.(get|post)" trong server/routes/man-khach.js → 8 route, đủ 1 trong 3 cổng (JWT · khoá màn · công khai chỉ /ghep), A17 + đột biến
             phủ cả 8; grep "taoDon" trong utils/manKhach.js → 1 chỗ, chế độ chiTinh/tinhThu (không ghi, orders.js:825 trả trước câu ghi đầu tiên)
CHƯA KIỂM:   (1) GIAO DIỆN chưa chạy trên trình duyệt/máy tính bảng thật — ngang/dọc, QR to dễ quét, đếm ngược, trang rảnh chuyển đúng, tải lại giữ ghép,
             mất mạng giữ màn rồi tự nối, chạy cả ngày không đầy bộ nhớ: chỉ đọc code + build qua; (2) "≤ 2 giây" chỉ bằng nhịp hỏi 1,5–2 giây trong
             code, chưa đo thật; (3) QR thật của SePay/payOS trên màn khách (bài dùng payOS giả); (4) trừ tài khoản thật (bài sửa hàng phiên, không
             giữ ví thật); (5) số tầng proxy của Render với req.ip (chống dò mã); (6) CẢNH BÁO 1 của bộ kiểm chung là cảnh báo có sẵn, chưa đọc nội dung;
             (7) bảng mới chưa trong sao lưu (câu hỏi 1)
GIT:         xem dòng log cuối
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 2 · BỎ 1 — chi tiết ở ## Bài học

## Chạy thử tay (2 thao tác, trên điện thoại/máy tính bảng)
1. Màn Bán hàng mới → "Màn khách" → xem mã; trên máy tính bảng mở `/man-khach`, nhập mã → thấy nội dung rảnh. Cài đặt → Màn khách chỉnh trang.
2. Thu một đơn bằng QR → màn khách hiện QR + màn + tổng; tiền về → "Cảm ơn" rồi về nội dung rảnh.

## Kết quả cuối (sau vòng sửa 1)
- `npm test -- --day-du`: PASS 93 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn, chưa đọc nội dung); "dist đã commit KHỚP với src".
- `node tu_chay/cong.js chay . 10b1abc^ HEAD viec/MANKHACH-1`: ✓ CỔNG CHẠY ĐẠT (kèm CẢNH BÁO A16: trên gốc bài dừng sớm ở ca đầu vì chưa có route — đã giải thích ở bang_chung_do.txt).
- Soát độc lập: vòng 1 KHÔNG ĐẠT → đã sửa 4 điểm (còn lại là câu hỏi 2–4). Chưa chạy lần soát vòng 2 — chat soát kiểm lại.

HEAD ĐÃ KIỂM: 00cb63b
