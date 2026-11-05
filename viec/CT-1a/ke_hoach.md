# CT-1a — kế hoạch (việc thường, máy làm thẳng; không chờ duyệt)

Đã đọc trong lượt này: `server/routes/kh/index.js` (hoSo dòng 36, `PUT /toi` ~dòng 174, đường đọc chung đứng trước `router.use(xacThucKhach)`),
`server/routes/man-khach.js` (khuôn route mới), `server/routes/customers-v2.js` (route `/:phone/address`, `/:phone/discount`),
`server/nang_cap/chay.js` + `009_man_khach.js` (bước chỉ THÊM, `themCot`), `server/routes/backup.js` (BACKUP_TABLES, BANG_KHONG_KHOI_PHUC),
`server/middleware/auth.js` (`checkPermission`, owner luôn qua), `client/src/pages/Settings.jsx` (TAB_PERMISSION, NHOM_THE, tab `manKhach`),
`cong_cu/thu_HOPDONG_KH.js` (quét tĩnh route + NGUON_MA), `HOP_DONG_API_KH.md` ("Đã hẹn — v7", dòng CT-1a).

## Phương án
**Dữ liệu (bước 017):** A = 1 bảng `pos_chuong_trinh` (cột phẳng: miễn N món + giá tối đa, % cả đơn, % phần còn lại, điều kiện, hạn) + cột
`pos_customers.ngay_sinh` + bảng sổ `pos_ngay_sinh_sua`. B = bảng ưu đãi tách riêng (1-n) — thừa, CT-1b chỉ cần đọc 1 dòng. **Chọn A.**
Quyền sửa ngày sinh: B-quyền = thêm khoá `sua_ngay_sinh` (owner 1, còn lại 0) bằng `INSERT OR IGNORE` ngay trong bước 017 (không đụng `database.js`,
ngoài Phạm vi). Chủ quán luôn qua `checkPermission`.

**Máy chủ:** A = MỘT file `server/routes/chuong-trinh.js`: router quầy (`/api/pos/chuong-trinh`, quyền `manage_promotions`) + luật kiểm
(`kiemChuongTrinh`, `kiemNgaySinh`, `docKhoangTuoi`, `datNgaySinh`) xuất ra cho `kh/index.js` và `customers-v2.js` dùng CHUNG (một quy tắc — một
hàm; không thêm `utils/` vì ngoài Phạm vi). B = thêm `utils/chuongTrinh.js` — đẹp hơn nhưng ngoài Phạm vi. **Chọn A**, ghi Phát hiện.
Mã lỗi ngày sinh (`NGAY_SINH_SAI` 400, `NGAY_SINH_DA_CO` 409) để trong bảng nhỏ ở chuong-trinh.js (kh/loi.js ngoài Phạm vi) → quầy lẫn App cùng code.
`datNgaySinh` = MỘT giao dịch: đọc giá trị cũ, `UPDATE … WHERE phone=? AND ngay_sinh IS <cũ>`, kiểm `changes`, ghi sổ.

**Quầy (client):** thẻ mới `CaiDat/ChuongTrinh.jsx` (nhóm "Khách hàng", quyền `manage_promotions`); `Customers.jsx` thêm ô Ngày sinh ở màn chi tiết khách
(trống → nhập; đã có → chỉ hiện nút Sửa khi có quyền `sua_ngay_sinh`, bắt lý do). Gọi qua `utils/api.js` (không `fetch` trần mới).
Khoảng tuổi (`ct_tuoi_toi_thieu`/`_toi_da`, mặc định 5/100) lưu bằng `PUT /settings` có sẵn; máy chủ đọc, sai/thiếu → mặc định.

**App:** `hoSo()` thêm `ngay_sinh`; `PUT /toi` nhận `ngay_sinh`; `GET /chuong-trinh` trước `xacThucKhach`, dùng chung trần lượt `giuLuotMenu` (cửa công khai).
Hợp đồng: bảng cửa + khối máy đọc + `ma_loi` + nhật ký v6, `PHIEN_BAN: 6`; bỏ hai dòng CT-1a khỏi "Đã hẹn".

## Ca thử (cong_cu/thu_CT1a.js) ↔ Nghiệm thu
- A: tạo/sửa/bật-tắt/xoá; ma trận giá trị sai → 400; quyền (không token 401, staff 403, manager 200); hai mẫu có sẵn, tắt sẵn, đúng nội dung.
- B: cột `ngay_sinh`; không cột căn cước ở hai bảng; quầy nhập khi trống (staff ok, có dòng sổ); sửa khi đã có: staff 403, chủ không lý do 400,
  chủ có lý do 200 + sổ (ai/lúc/cũ/mới); ngày sai/tương lai/ngoài tuổi 400 + ranh giới tuổi (ngay trên/ngay dưới) + tuổi theo cài đặt; khách không có → 404, không tạo khách.
- C: `/toi.khach.ngay_sinh` null → nhập lần đầu 200 → lần hai 409 (giá trị không đổi); sai 400; `null` gửi vào 400; hai PUT đồng thời → đúng 1 thắng;
  `/chuong-trinh` chỉ bật + trong hạn (ranh giới bat_dau/ket_thuc = hôm nay thì CÓ, mai/hôm qua thì KHÔNG), không lộ trường ưu đãi; khách A không đổi được khách B.
- K5 (luồng hợp lệ phải KHÔNG bị chặn): `PUT /toi` chỉ ten/xung_ho/dia_chi như cũ; ten + ngay_sinh trong một thân; quầy nhập ngày sinh cho khách ngay sau khi App chưa nhập;
  đơn có chương trình bật → tổng không đổi so với trước khi bật.
- Đường song song: ngày sinh ghi ở HAI nơi (App, quầy) → cùng `datNgaySinh`; grep `ngay_sinh` toàn server để chắc không còn đường UPDATE thứ ba.
- Đột biến (dot_bien.py): VS-/BV- cho: kiểm tuổi, so sánh ngày, `IS <cũ>`, kiểm `changes`, ghi sổ, lọc `dang_bat`/hạn của `/chuong-trinh`, quyền sửa, lý do bắt buộc.
