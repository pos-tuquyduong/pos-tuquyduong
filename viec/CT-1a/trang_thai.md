# CT-1a — trạng thái

Mở phiên (03.11.2026): nhánh `viec/CT-1a`, HEAD = FETCH_HEAD = `0cd852f`.
```
0cd852f PHIEU: CT-1a
afc2000 HOP-DONG: v7 da hen them cach_tra / giu_vi / con_lai cua /don (HD-KH-1) + cach App hien so du vi (QUA-1) — App KH 02.11 c, d
2c81b0f TIEN-DO: MANKHACH-1 (ae27536), TU-CHAY-10 (4891879), KHO-IN-1 (d1b57b8) xong; dot quyet dinh 01-02.11 + thiet_ke dot 2 + hop dong v7 (da hen) + lich theo lan; mo GIO-VN-1, HANG-1, NAP-1 — so v53
```

## Câu hỏi
(Đã giải quyết 04.11) Chủ quán thêm `cong_cu/thu_KH1.js` vào Phạm vi, chỉ sửa ca E1 (8 → 9 trường, thêm `ngay_sinh`). Đã sửa ở `534712c`; đỏ trên gốc, xanh trên code mới (xem `bang_chung_do.txt`, `SỐ CA cong_cu/thu_KH1.js: 157`). Không còn câu hỏi mở.

## Phát hiện (ngoài Phạm vi, không sửa)
- `server/routes/kh/loi.js` là chỗ tự nhiên cho hai mã `NGAY_SINH_SAI` / `NGAY_SINH_DA_CO`; ngoài Phạm vi nên để bảng `LOI_NGAY_SINH` trong `routes/chuong-trinh.js`
  (dùng chung quầy + App, bài hợp đồng quét thêm file này). Gộp về `loi.js` ở việc sau.
- `server/routes/users.js` (danh sách nhãn quyền ở màn Phân quyền) chưa có nhãn cho `sua_ngay_sinh` (cùng tình trạng `xoa_pin_khach`): chủ quán luôn qua; muốn cấp cho quản lý
  qua giao diện phải thêm nhãn. Hiện cấp bằng cách sửa bảng phân quyền.
- Quy tắc ngày/tuổi nằm ở `routes/chuong-trinh.js` (không có `utils/` trong Phạm vi); CT-1b nên tách `utils/chuongTrinh.js` khi cần dùng chung với `orders.js`.

## Bảng chỗ vá → đột biến (`viec/CT-1a/dot_bien.py`, 75 đột biến; chạy `--liet-ke` để xem đủ tên)
- Ngày thật / dạng ngày: BV-NGAY-KHONG-KIEM-LICH · VS-DANG-NGAY-LONG-LEO
- Tuổi: BV-TUOI-TOI-THIEU · VS-TUOI-TOI-THIEU-LECH · BV-TUOI-TOI-DA · VS-TUOI-TOI-DA-LECH · VS-TUOI-BO-QUA-SINH-NHAT · VS-TUOI-LAY-TUYET-DOI
- Khoảng tuổi cài đặt: BV-KHOANG-TUOI-CAI-DAT · VS-KHOANG-TUOI-MIN-LON-MAX · BV-KHOANG-TUOI-KIEM-MIN-MAX · VS-KHOANG-TUOI-TRAN-151
- datNgaySinh (một lần · lý do · sổ): BV-CHAN-DA-CO · BV-BAT-LY-DO · VS-LY-DO-KHONG-CAT · VS-LY-DO-QUA-DAI-LOT · VS-LY-DO-DAI-SIET · BV-GHI-SO-NGAY-SINH · VS-SO-GHI-NHAM-GIA-TRI-CU · VS-SO-GHI-LY-DO-LAN-DAU · BV-KHACH-KHONG-CO
- Kiểm chương trình: BV-UU-DAI-TOI-THIEU-MOT · VS-GIAM-CA-DON-TRAN-101 · VS-GIAM-CON-LAI-TRAN-101 · VS-SO-NHAN-CHUOI · BV-NGAY-KET-TRUOC-BAT-DAU · VS-NGAY-BANG-NHAU-BI-CHAN · BV-NGAY-CT-PHAI-THAT · VS-TEN-DAI-NOI · VS-TEN-DAI-SIET · VS-MO-TA-DAI-NOI · BV-LOAI-PHAI-TRONG-DANH-SACH · BV-KY-PHAI-TRONG-DANH-SACH · VS-SO-LAN-CHO-0 · VS-SO-LAN-TRAN-100 · VS-MIEN-MON-TRAN-21 · VS-GIA-MIEN-CHO-0 · BV-CO-PHAI-LA-BOOL
- Quyền / sửa từng phần: BV-QUYEN-QUAN-LY-KHUYEN-MAI · BV-DANG-NHAP-CHUONG-TRINH · VS-SUA-MAT-TRUONG-KHONG-GUI
- GET /chuong-trinh: BV-LOC-DANG-BAT · BV-LOC-NGAY-BAT-DAU · BV-LOC-NGAY-KET-THUC · VS-LOC-BAT-DAU-LECH · VS-LOC-KET-THUC-LECH · VS-LOC-SAI-THU-TU · VS-CONG-KHAI-LO-UU-DAI · BV-CONG-KHAI-KHONG-TRAN-LUOT · VS-CONG-KHAI-DOI-TOKEN
- App PUT /toi, hồ sơ: BV-HOSO-NGAY-SINH · BV-PUT-TOI-NHAN-NGAY-SINH · VS-PUT-TOI-APP-SUA-DUOC · VS-PUT-TOI-BO-QUA-LOI-NGAY-SINH
- Quầy: BV-QUYEN-SUA-NGAY-SINH · VS-QUYEN-SUA-NHAM-QUYEN-KHAC · VS-NHAP-LAN-DAU-CUNG-CAN-QUYEN · BV-QUAY-KHACH-KHONG-CO · BV-QUAY-SDT-HONG · BV-QUAY-NGAY-SINH-KHONG-DANG-NHAP · BV-DANH-SACH-KHACH-NGAY-SINH
- Bước 017: VS-017-QUYEN-NHAN-VIEN · VS-017-QUYEN-QUAN-LY · BV-017-COT-NGAY-SINH · BV-017-BANG-SO · VS-017-MAU-BAT-SAN · VS-017-MAU-HOC-SINH-GIOI-KY · VS-017-MAU-SINH-NHAT-DOI-CHO
- Sao lưu / gắn route / giao diện: BV-SAO-LUU-CHUONG-TRINH · BV-SAO-LUU-SO-NGAY-SINH · BV-SO-NGAY-SINH-KHOI-PHUC-DUOC · BV-GAN-ROUTE-CHUONG-TRINH · BV-THE-CHUONG-TRINH-TRONG-NHOM · VS-CUSTOMERS-SUA-KHONG-HOI-QUYEN · BV-API-NGAY-SINH

## Kiểm
- `node cong_cu/thu_CT1a.js` → 75 đạt · 0 hỏng. `node cong_cu/thu_HOPDONG_KH.js` → 85 đạt · 0 hỏng. `thu_KH1.js` → 157 ca, E1 xanh.
- `npm test` → PASS 91 · FAIL 0 · CẢNH BÁO 2. `node kiem_tra_truoc_khi_giao.js --day-du` → PASS 95 · FAIL 0 · CẢNH BÁO 2 (có so băm dist ↔ src). `(cd client && npm run build)` đã chạy, `client/dist` đã commit.
- Hợp đồng `HOP_DONG_API_KH.md`: PHIEN_BAN 5 (gốc 0cd852f) → 6 (tăng 1; chat chỉnh số lúc gộp).

## Soát độc lập (`/ra-soat`) — chép nguyên văn
ĐẠT (có điều kiện nhỏ: sửa hồ sơ `trang_thai.md` đã cũ trước khi báo xong; không có lỗi mã chặn).
LỖI TÌM ĐƯỢC: 1. trang_thai.md — hồ sơ đã cũ so với HEAD (còn ghi "CẦN CHỦ QUÁN QUYẾT", "npm test chỉ còn ✗ thu_KH1 E1", "Báo cáo tạm", BÀI HỌC "chưa viết"). K1, mức NHẸ → ĐÃ SỬA ở commit này. 2. Không tìm ra lỗi mã (server, client, hợp đồng) nào đụng tiền / điểm / ví / đơn / lộ dữ liệu.
NGHI NGỜ (nhẹ, không chặn):
- server/routes/chuong-trinh.js:103 — `UPDATE … AND ngay_sinh IS ?` tham số null: xanh trên SQLite, chưa thử Turso thật (đã ghi CHƯA KIỂM). Không đột biến nào bắt vế `IS <cũ>` + kiểm `changes` (giao dịch ghi đã tuần tự hoá).
- server/routes/kh/index.js:186-196 — `PUT /toi` kèm ngay_sinh + tên: ngày sinh ghi trước, nếu UPDATE các cột còn lại ném lỗi kho thì ngày sinh đã ghi mà trả 500. Hiếm, không đụng tiền.
- Khôi phục sao lưu `pos_customers` từ file cũ trả ngay_sinh về giá trị trong file (kể cả null), mở lại "nhập một lần"; chỉ chủ quán làm được, sổ `pos_ngay_sinh_sua` vẫn giữ (backup.js:131-134).
- server/routes/kh/index.js:143 — `/chuong-trinh` dùng chung bộ đếm `giuLuotMenu` với `/menu` (tồn tại sẵn, đã nói trong comment).
- `sua_ngay_sinh` chưa có nhãn ở server/routes/users.js nên chưa cấp được qua màn Phân quyền (chỉ kiểm bằng bài thử B5).
NGHIỆM THU: 11/11 mục có bằng chứng · mục thiếu: không (riêng "thử tay trên điện thoại" chưa làm — hồ sơ đã nói thẳng).
CHƯA SOÁT ĐƯỢC: `node tu_chay/cong.js chay`; chỉ chạy lại 3/75 đột biến (cả 3 BẮT, đối chứng xanh); Turso thật; thử tay điện thoại; Render proxy với `req.ip`.
Tự chạy lại: thu_CT1a 75/0 · thu_HOPDONG_KH 85/0 · `--day-du` PASS 95 · FAIL 0.
BÀI HỌC (của agent): (1) chủ quán đổi Phạm vi giữa chừng → cập nhật trang_thai.md CÙNG commit sửa (K1); (2) bài "hai máy cùng PUT" (C5) và đột biến B6 là khuôn tốt; (3) quyền mới thêm bằng `INSERT OR IGNORE` ở bước nâng cấp phải kèm nhãn trong users.js ngay (đã gặp 2 lần: xoa_pin_khach, sua_ngay_sinh).

## Soát bảo mật
Số lỗi trước lọc: 0 · sau lọc: 0 (bước lọc bỏ qua vì bước 2 không tìm ra gì). Báo cáo nguyên văn:
Không có lỗ hổng đạt chuẩn (độ tin cậy trên 80%) trong thay đổi của nhánh viec/CT-1a. Đã đọc diff `0cd852f^..HEAD` của `server/`, `client/src/utils/api.js` và đọc kỹ `server/routes/chuong-trinh.js`; không chạy bài thử nào. Đã soi:
- Quyền thẻ "Chương trình": mọi route trong chuong-trinh.js qua `authenticate` + `checkPermission('manage_promotions')`; `/khoang-tuoi` đứng trước `/:id`.
- SQL injection: tên cột INSERT/UPDATE lấy từ danh sách cố định `CAC_COT`; giá trị qua tham số `?`; thân yêu cầu kiểm kiểu và khoảng giá trị qua `kiemChuongTrinh`.
- Quầy `PUT /api/pos/v2/customers/:phone/ngay-sinh`: ngày sinh trống thì nhân viên nào cũng nhập được (đúng thiết kế); đã có thì cần `sua_ngay_sinh` (mặc định chỉ chủ quán); hai nhân viên ghi cùng lúc thì `ngay_sinh IS <cũ>` chặn lần hai (409).
- App `PUT /api/kh/toi`: SĐT lấy từ token (`req.khach.phone`), khách A không sửa được của B; `choPhepSua: false` cố định; ngày sinh qua đúng hàm kiểm như quầy.
- `GET /api/kh/chuong-trinh` công khai: chỉ 5 trường (`ma`, `ten`, `mo_ta`, `loai`, `dang_bat`), không lộ ưu đãi / điều kiện; có giới hạn lượt theo IP.
- Sao lưu: `pos_ngay_sinh_sua` nằm trong danh sách không khôi phục bằng file.
- Giao diện: `ChuongTrinh.jsx`, `Customers.jsx` không có `dangerouslySetInnerHTML` / `innerHTML`.
SOÁT BẢO MẬT: ĐẠT

## Bài học
- **KHOÁ 2** — (a) ĐÃ CÓ: bước nâng cấp 017 phải chịu kho thử thiếu bảng khách (thu_KHO2a / thu_KHAPI3 bắt, khuôn chặn như bước 003). (b) ĐỀ XUẤT (ngoài Phạm vi: `kiem_tra_truoc_khi_giao.js` thêm phép, `server/routes/users.js`): phép kiểm "mọi mã quyền thêm bằng `INSERT OR IGNORE` ở `server/nang_cap/*` phải có nhãn trong `users.js`"; ca đỏ: `xoa_pin_khach` và `sua_ngay_sinh` hiện thiếu nhãn. Lý do: gặp 2 lần, chủ quán không cấp được quyền qua giao diện. Mở việc `HOC-<n>` hoặc gộp vào việc dọn quyền.
- **NGUYÊN TẮC 1** — ĐỀ XUẤT thêm vào K1 (`KHUON_LOI.md` ngoài Phạm vi): "Chủ quán đổi Phạm vi / chốt câu hỏi giữa chừng → `trang_thai.md` cập nhật CÙNG commit sửa; hồ sơ còn ghi 'đang chặn' sau khi đã gỡ là khẳng định sai". Ví dụ thật: CT-1a 04.11, `trang_thai.md` còn ghi "CẦN CHỦ QUÁN QUYẾT" khi E1 đã xanh (agent soát bắt).
- **BỎ 1** — hai lần nhắc `cat >> file` / `git worktree` bị người gác chặn: chỉ là cách làm, đổi sang Python ghi file và `git archive` là đủ, không cần luật mới.
- Dọn: không có lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` mới được phép kiểm làm thay.

## Cổng chạy
`node tu_chay/cong.js chay . 0cd852f^ HEAD viec/CT-1a` (HEAD ddeaad0, cây sạch):
· CẢNH BÁO A16: `cong_cu/thu_CT1a.js` chạy trên gốc in 74 ca ≠ 75 ca ở head — bài dừng sớm trên gốc (thiếu module `routes/chuong-trinh.js`) nên không so được; bằng chứng đỏ 4 đạt · 69 hỏng đã ghi ở `bang_chung_do.txt`.
✓ CỔNG CHẠY ĐẠT

## Báo cáo 7 mục
VIỆC:        CT-1a — Thẻ Cài đặt "Chương trình" + ngày sinh khách (nhập MỘT lần) + cửa App `/chuong-trinh`, `PUT /toi.ngay_sinh`
ĐÃ SỬA:      server/nang_cap/017_chuong_trinh.js · server/routes/chuong-trinh.js · server/routes/kh/index.js · server/routes/customers-v2.js · server/routes/backup.js · server/index.js · client/src (ChuongTrinh.jsx, Settings.jsx, Customers.jsx, api.js) + client/dist · HOP_DONG_API_KH.md (v5 → v6) · cong_cu/thu_CT1a.js · thu_HOPDONG_KH.js · cong_cu/thu_KH1.js (chỉ ca E1: 8 → 9 trường, 534712c)
BÀI THỬ:     thu_CT1a.js trên gốc 0cd852f → ĐỎ (4 đạt · 69 hỏng); sau vá → XANH 75/75; đột biến 75/75 BẮT. thu_KH1.js E1: bản mới ĐỎ trên gốc, bản cũ ĐỎ trên code mới, bản mới XANH trên code mới (157 ca)
ĐÃ RÀ K4:    grep `UPDATE pos_customers` / `ngay_sinh` toàn server → chỉ `datNgaySinh` ghi cột ngay_sinh (App + quầy gọi chung); agent soát độc lập grep lại: không còn đường song song
CHƯA KIỂM:   Turso thật (bước 017, `ngay_sinh IS ?` với null) · thử tay giao diện trên điện thoại · vế `IS <cũ>` + kiểm `changes` trong datNgaySinh không có đột biến bắt được · race "trống lúc kiểm quyền, có lúc ghi" không dựng tất định · ngày sinh ghi trước rồi UPDATE cột khác ném lỗi → 500 nhưng ngày sinh đã ghi (hiếm, không đụng tiền) · `sua_ngay_sinh` chưa có nhãn ở users.js (chưa cấp được qua giao diện) · số PHIEN_BAN hợp đồng chat chỉnh lúc gộp
GIT:         ddeaad0 CT-1a: trạng thái — soát độc lập, soát bảo mật ĐẠT, Bài học · c6f086d CT-1a: bằng chứng đỏ + SỐ CA cho thu_KH1.js E1
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 1 · BỎ 1 — chi tiết ở ## Bài học

Thử tay trên điện thoại (khi xong): (1) Cài đặt → Khách hàng → Chương trình: thêm một chương trình, bật, xem App `/chuong-trinh`; (2) Khách hàng → mở một khách → Ngày sinh: nhập, rồi thử sửa bằng tài khoản nhân viên (phải bị chặn).

HEAD ĐÃ KIỂM: ddeaad0
