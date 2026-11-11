# VI-ME-1 — Chỉ trừ tài khoản mẹ khi khách đang mua đúng là con được liên kết với mẹ đó

<!-- Phiếu do chat soạn 09.11.2026 (bàn 34, sổ v59). Việc [T] — Opus: lập kế hoạch rồi DỪNG chờ duyệt.
     KHACH-APP-1 phát hiện (có từ trước): POST /orders nhận parent_phone + parent_balance_amount do màn hình gửi (orders.js ~686, ~853) và trừ ví SĐT
     đó (ghiVi ~962) mà KHÔNG đối chiếu pos_customers — SĐT mẹ có đúng là parent_phone của khách đang mua không. Người có quyền bán + biết một SĐT có
     số dư là trừ được tiền người khác. Ưu tiên trước khai trương.
     Chạy song song DIEM-MON-1 (cũng sửa orders.js, vùng điểm ~934) và BAO-1a (giao diện): chỉ sửa đúng vùng tiền mẹ, không đổi bố cục. -->

## Mục tiêu
Máy chủ tự đối chiếu quan hệ mẹ–con trước khi trừ hoặc giữ chỗ tiền tài khoản mẹ, ở MỌI lối.

## Nghiệm thu
- A Đơn có `parent_balance_amount > 0` (hoặc `parent_phone`): máy chủ đọc khách đang mua (`phone` đã chuẩn hoá) trong `pos_customers`; chỉ cho trừ khi
  khách tồn tại VÀ `parent_phone` của khách = SĐT mẹ gửi lên (đã chuẩn hoá). Sai mẹ / không có khách / khách không có mẹ → từ chối 403 mã
  `KHONG_PHAI_TK_ME`, câu "Tài khoản này không phải tài khoản mẹ của khách"; KHÔNG ghi gì (đơn, ví, giữ chỗ, điểm).
- B Mọi lối đụng tiền mẹ dùng CHUNG một hàm đối chiếu: tạo đơn, phiên thanh toán / giữ chỗ (`dangGiu`, giuCho.js), tính thu (`tinh-thu`), số dư mẹ báo
  cho màn thu tiền. Kế hoạch liệt kê HẾT các lối (grep `parent_phone`, `parent_balance`, `tai_khoan_me`) kèm số dòng, lối nào không cần sửa ghi lý do.
- C Đúng mẹ → y như hôm nay (mọi bài cũ xanh).
- D Đơn cũ đã có mẹ trả: hoàn / huỷ / đền đọc từ đơn đã ghi — không đổi.
- E `/api/kh`: xác nhận App có hay không có lối trừ tiền mẹ; có thì dùng cùng hàm.
- K5 Không đổi: luật ví, PIN khách, giá, điểm, giao diện (ngoài câu báo lỗi mới).

## Phạm vi
- viec/VI-ME-1/**
- server/routes/orders.js
- server/routes/wallets.js
- server/routes/kh/index.js
- server/utils/giuCho.js
- server/utils/donApp.js
- server/utils/viMe.js
- cong_cu/thu_VIME1.js
- kiem_tra_truoc_khi_giao.js
- cong_cu/thu_P26b.js
- cong_cu/thu_P26c.js
- cong_cu/thu_GOI1.js
- cong_cu/thu_DIEMTHAT1.js
- cong_cu/thu_HD1.js
- cong_cu/thu_NAP1.js
- cong_cu/gia_lap/kich_ban.js

## Bài thử đỏ
Có — `cong_cu/thu_VIME1.js` ĐỎ trên gốc: khách A (mẹ M) gửi `parent_phone` = SĐT người khác có số dư → hôm nay tạo đơn và trừ ví người đó; phải 403
`KHONG_PHAI_TK_ME`, ví không đổi, không có đơn. Khách không có mẹ / đơn không khách mà gửi `parent_*` → 403. Đúng mẹ → như cũ (số dư mẹ giảm đúng).

## Ngân sách
~40 dòng máy chủ + ~150 dòng thử.
**Phương án đơn giản nhất đã xét:** một hàm `kiemTraMe(db, phoneKhach, sdtMe)` (server/utils/viMe.js) gọi ở đầu mọi lối trước khi đọc / giữ / trừ.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
có — tiền tài khoản người khác.

## Cấm
Không đổi luật điểm (DIEM-MON-1), không đổi giao diện ngoài câu báo lỗi, không đổi luật hoàn / huỷ / đền, không sửa Settings.jsx.
