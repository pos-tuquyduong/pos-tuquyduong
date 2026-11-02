# CT-1a — Thẻ Cài đặt "Chương trình" + ngày sinh khách (nhập MỘT lần) + cửa App `/chuong-trinh`, `PUT /toi.ngay_sinh`

<!-- Phiếu do chat soạn 02.11.2026 (sau sổ v53). Việc [Th] — Sonnet, máy làm thẳng (không chờ duyệt kế hoạch); soát bảo mật có.
     Thiết kế: thiet_ke/THIET_KE_DOT2.md mục M10. Quyết định: QUYET_DINH_CHU_QUAN.md "Đợt quyết định 01–02.11". Tên cửa / trường / mã lỗi CHỐT ở
     HOP_DONG_API_KH.md "Đã hẹn — v7" (hai dòng CT-1a). App KH làm song song theo đúng tên đó.
     Phần ÁP ưu đãi tại quầy là CT-1b (Opus, sau) — việc này CHỈ lưu cấu hình + hiển thị, KHÔNG đổi giá đơn nào.
     Chạy SAU HD-KH-1 (cùng sửa server/routes/kh/index.js + HOP_DONG_API_KH.md). -->

## Mục tiêu
Chủ quán khai báo các chương trình đặc biệt trong một thẻ Cài đặt riêng; khách có ngày sinh (nhập một lần, chỉ chủ quán sửa); App hiện danh sách
chương trình và ô ngày sinh.

## Nghiệm thu
- A **Thẻ Cài đặt "Chương trình"** (quyền quản lý khuyến mãi): thêm / sửa / bật / tắt; mỗi chương trình: tên, mô tả ngắn, loại (`sinh_nhat`,
  `hoc_sinh_gioi`, `khac`), ưu đãi (miễn N món + giá tối đa món miễn / giảm % cả đơn / giảm % phần còn lại của đơn), điều kiện (chỉ tại quán;
  bắt buộc "đã xem giấy tờ"; số lần: mỗi khách / ngày / năm học / năm), ngày bắt đầu – kết thúc. Giá trị sai → 400. Xoá: bấm 2 lần (không hộp
  thoại trình duyệt). Hai chương trình mẫu tắt sẵn: "Học sinh giỏi" (miễn 1 đồ uống; người đi kèm 50% cả phần còn lại, một hoá đơn) và "Sinh
  nhật" (50% cả đơn, đúng ngày, đối chiếu căn cước).
- B **Ngày sinh khách:** cột mới; quầy (màn Khách hàng) nhập được khi đang trống; đã có thì CHỈ chủ quán sửa (quyền riêng + lý do), mỗi lần sửa
  ghi ai / lúc nào / giá trị cũ. KHÔNG lưu số căn cước. Kiểm: đúng ngày, không ở tương lai, tuổi trong khoảng cài đặt (mặc định 5–100).
- C **App:** `/toi.khach.ngay_sinh`; `PUT /toi` nhận `ngay_sinh` chỉ khi đang `null` → đã có 409 `NGAY_SINH_DA_CO`, sai 400 `NGAY_SINH_SAI`;
  `GET /chuong-trinh` (không token) → `data[] { ma, ten, mo_ta, loai, dang_bat }` chỉ chương trình đang bật và trong thời gian chạy. Chuyển hai
  dòng CT-1a của "Đã hẹn" lên bảng cửa, tăng PHIEN_BAN, nhật ký; `thu_HOPDONG_KH.js` xanh.
- K5 Không đổi giá / điểm / đơn nào; `PUT /toi` cũ (tên, xưng hô, địa chỉ) giữ nguyên.

## Phạm vi
- viec/CT-1a/**
- server/routes/chuong-trinh.js
- server/routes/customers-v2.js
- server/routes/kh/index.js
- server/routes/backup.js
- server/index.js
- server/nang_cap/017_chuong_trinh.js
- client/src/**
- client/dist/**
- cong_cu/thu_CT1a.js
- cong_cu/thu_HOPDONG_KH.js
- HOP_DONG_API_KH.md
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_CT1a.js` ĐỎ trên code gốc: tạo / sửa chương trình + giá trị sai 400; `/chuong-trinh` chỉ trả cái đang bật và trong hạn; ngày sinh
App nhập lần đầu được, lần hai 409, sai 400; quầy nhập khi trống, sửa khi đã có phải là chủ quán và có dòng ghi; không có cột số căn cước.

## Ngân sách
~220 dòng máy chủ + ~220 dòng giao diện + ~300 dòng thử.
**Phương án đơn giản nhất đã xét:** một bảng chương trình (cấu hình đủ cho CT-1b), một cột ngày sinh + sổ sửa ngày sinh chỉ-thêm-dòng.

## Đổi cấu trúc DB
có — chỉ THÊM (bước 017): bảng chương trình; cột ngày sinh của khách; bảng sổ sửa ngày sinh. Bảng mới vào BACKUP_TABLES.

## Thư viện mới
không

## Soát bảo mật
có — cửa App ghi dữ liệu khách (`PUT /toi`), quyền sửa ngày sinh, cửa công khai `/chuong-trinh`.
