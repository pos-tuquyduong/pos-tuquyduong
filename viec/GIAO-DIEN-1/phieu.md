# GIAO-DIEN-1 — Gọn giao diện POS: dải báo "Đơn App" ở mọi màn, Số dư gộp vào Khách hàng, ô "Khách và tiền" ở Quản lý, nạp tay chỉ chủ quán

<!-- Phiếu do chat soạn 05.11.2026 (sổ v54). Việc [Th] — Sonnet, máy làm thẳng (không chờ duyệt kế hoạch); soát bảo mật có (quyền nạp tay).
     Chủ quán duyệt hình mẫu 05.11 (chat claude.ai, bàn 32): (1) bỏ nút nổi "Đơn App" góc phải (đang che nút "Nạp" của màn Số dư), thay bằng DẢI BÁO
     ở đầu màn; (2) gộp màn Số dư vào trang Khách hàng; (3) ô "Khách và tiền" ở trang Quản lý; (4) nạp tay kiểu cũ CHỈ chủ quán (để thử, sau
     này ẩn / bỏ — khách nạp theo gói là việc NAP-1).
     Hiện trạng chat đọc 05.11 trên main 4723a3b: nút nổi = client/src/components/DonAppNoi.jsx (position fixed, top 10, right 12); màn Số dư =
     client/src/pages/Balance.jsx (route /balance), lối vào = nút "Số dư →" của client/src/pages/QuanLy/ThanhLoi.jsx trên màn Khách hàng; quyền
     topup_balance đang BẬT cho owner, manager, staff (server/database.js ~1052/1065/1079).
     BẮT ĐẦU sau khi HANG-1 gộp (cùng sửa client/src/**). Không đụng tiền / đơn / ví ngoài quyền nạp tay. -->

## Mục tiêu
Nhìn ở đâu cũng thấy đơn App mới mà không bị che nút; mọi việc về một khách (số dư, nạp, lịch sử ví) làm ngay trên trang Khách hàng; nạp tay chỉ
chủ quán làm được.

## Nghiệm thu
- A **Dải báo "Đơn App"**: thay nút nổi `DonAppNoi` bằng một dải nằm TRONG luồng trang (không `position: fixed`, không đè lên nút nào), ở đầu
  MỌI màn có menu, kể cả màn Bán hàng trên điện thoại. Chỉ hiện khi có đơn App mới chưa nhận: "N đơn App mới" (+ "đơn sớm nhất X phút trước" khi
  màn đủ rộng) và nút "Xem" mở màn Đơn App. Không có đơn mới → không hiện gì. Chuông / âm thanh, công tắc "Máy ở quán" và cách đếm đơn GIỮ
  NGUYÊN như `DonAppNoi` hiện nay (chỉ đổi chỗ hiển thị). Người không có quyền xem đơn App thì không thấy dải, như hiện nay.
- B **Menu**: thêm mục "Đơn App" (máy tính bảng: menu trái, dưới "Đơn hàng"; điện thoại: trong bảng "Thêm") có số đỏ = số đơn App mới;
  không có đơn mới thì không có số.
- C **Trang Khách hàng gộp Số dư**: danh sách khách có cột "Số dư"; ô tổng phía trên thêm "Khách đang gửi quán" (tổng số dư). Ô chi tiết khách có
  khu "Ví": số dư, "Lịch sử ví" (như màn Số dư hiện nay), "Điều chỉnh" (quyền adjust_balance như cũ), "Nạp tay (thử)" — chỉ hiện với chủ quán.
  Mọi chức năng của màn Số dư cũ (nạp, điều chỉnh, xem lịch sử, đối soát ví một khách / tất cả) phải còn đủ ở trang Khách hàng, cùng quyền
  như cũ. Bỏ nút "Số dư →"; đường /balance chuyển về /customers (link cũ không gãy).
- D **Trang Quản lý** thêm ô "Khách và tiền" (Khách hàng và số dư · Hoàn tiền · Báo cáo / đối soát), ẩn lối người dùng không có quyền như các ô khác
  (`luoiQuanLy`).
- E **Nạp tay chỉ chủ quán**: quyền `topup_balance` của manager và staff = 0 (bước nâng cấp 018, chỉ đổi dữ liệu quyền, chạy một lần); seed
  trong database.js cho kho MỚI cũng là 0 cho manager / staff. Máy chủ `POST /wallets/topup` vẫn kiểm quyền như nay (manager / staff gọi → 403).
  Màn Phân quyền vẫn cho chủ quán bật lại nếu muốn.
- K5 **Không đổi:** cách tính tiền, ví, đơn, điểm; cửa App; màn Bán hàng (ngoài dải báo); in.

## Phạm vi
- viec/GIAO-DIEN-1/**
- client/src/**
- client/dist/**
- server/database.js
- server/nang_cap/018_nap_tay_chu_quan.js
- server/nang_cap/chay.js
- cong_cu/thu_GIAODIEN1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_GIAODIEN1.js` ĐỎ trên code gốc: manager / staff gọi `POST /wallets/topup` → 403 (gốc: 200); bước 018 chạy hai lần không đổi
gì thêm; owner vẫn nạp được; hàm thuần của menu / lưới Quản lý có mục "Đơn App" và ô "Khách và tiền", ẩn đúng theo quyền; không còn file giao
diện nào dùng `position: 'fixed'` cho báo đơn App.

## Ngân sách
~40 dòng máy chủ + ~350 dòng giao diện + ~150 dòng thử.
**Phương án đơn giản nhất đã xét:** chuyển ruột `DonAppNoi` thành dải trong `Layout` (dùng lại logic đếm + chuông), tách phần thân màn Số dư thành
khu Ví dùng chung trong ô chi tiết khách.

## Đổi cấu trúc DB
không đổi cấu trúc — chỉ đổi dữ liệu quyền (bước 018).

## Thư viện mới
không

## Soát bảo mật
có — quyền nạp tay (topup_balance) đổi cho manager / staff.

## Cấm
Không làm gói nạp / ví hai ngăn (NAP-1), huỷ đơn (HUY-1), nội dung chuyển khoản (CK-NOIDUNG-1).
