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
- F **Thẻ mã QR thương hiệu** (chủ quán duyệt mẫu 06.11 — `viec/GIAO-DIEN-1/mau_the_QR_TQD.png`; logo `viec/GIAO-DIEN-1/logo_TQD_bieu_tuong.png`,
  nền trong suốt, chép vào `client/src/assets/`): MỌI chỗ HIỆN mã QR thanh toán trên MÀN HÌNH (màn quầy, màn khách nhìn, phiên QR mọi cổng —
  payOS / SePay / Tingee) dùng CHUNG một component. Thẻ: nền kem #FBF3E6, viền vàng kim #B08028, bo góc lớn; đầu thẻ logo + "Tứ Quý Đường" (đỏ đô
  #7A1E18) + "Quét mã để thanh toán"; ô trắng chứa số tiền chữ to, mã QR, dưới mã "HD0016 · <nội dung chuyển khoản>". KHÔNG có dòng chữ ở cuối
  thẻ. Giữ đồng hồ đếm ngược / trạng thái phiên đang có. Mã: mức sửa lỗi H; chấm TRÒN; 3 ô góc bo tròn và TÔ ĐẶC (vòng ngoài liền + lõi, không
  vẽ vòng rỗng); màu theo vị trí 4 mảnh logo — trên trái xanh đậm #253A6E, trên phải vàng kim #966923, dưới trái xanh lá #347042, dưới phải đỏ
  #B2342C (chấm theo 4 phần tư, ô góc theo góc của nó); viền trắng quanh mã ≥ 3 ô; logo tròn trên nền tròn trắng ở giữa, đường kính logo ≤ 20%
  bề ngang phần mã. Màu chấm luôn trên nền TRẮNG (cả khi giao diện tối). Chat đã thử: mẫu này giải mã đúng khi thu nhỏ còn 40%.
  Bill / phiếu IN nhiệt GIỮ mã vuông đen như hiện nay (`veQr` cũ) — không đổi. Thêm hàm vẽ mới cạnh `client/src/utils/veQr.js` (dùng lại
  qrcode-generator 1.4.4 sẵn có — không thư viện mới). Bài thử: hàm thuần trả đúng ma trận (giải lại bằng chính qrcode-generator so dữ liệu),
  mức H, màu theo phần tư, logo ≤ 20%, có viền trắng. Thử quét THẬT bằng app MB, Vietcombank, Techcombank + MoMo / ZaloPay (chủ quán thử trên
  bản chạy thử, ghi kết quả vào trang_thai.md) trước khi báo xong.
- K5 **Không đổi:** cách tính tiền, ví, đơn, điểm; cửa App; màn Bán hàng (ngoài dải báo); in.

<!-- Chủ quán 06.11 (chat claude.ai, bàn 32): thêm mục F — thẻ mã QR thương hiệu theo mẫu đã duyệt, bỏ dòng chữ cuối thẻ. Phần App KH: chat gửi thư cho
     App dùng cùng mẫu + logo (App tự vẽ QR từ chuỗi POS trả). -->
## Phạm vi
- viec/GIAO-DIEN-1/**
- client/src/**
- client/dist/**
- server/database.js
- server/nang_cap/018_nap_tay_chu_quan.js
- server/nang_cap/chay.js
- cong_cu/thu_GIAODIEN1.js
- kiem_tra_truoc_khi_giao.js
- cong_cu/thu_BH2.js

<!-- Chủ quán 07.11 (chat soát trước khi gộp): thêm cong_cu/thu_BH2.js vào Phạm vi — máy đã sửa đúng các ca F1/F3/F6/F7/F8/S5 khoá menu,
     lưới Quản lý, lối Số dư và cách vẽ QR CŨ mà chủ quán duyệt đổi (cổng tĩnh A6 đỏ vì thiếu dòng này). Chat đã đọc diff: chỉ đổi theo
     thiết kế đã duyệt, không bớt ca canh tiền. -->

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
