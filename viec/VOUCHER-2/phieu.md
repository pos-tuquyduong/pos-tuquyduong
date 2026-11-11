# VOUCHER-2 — Mẫu voucher + nhiều voucher một đơn (tối đa N), một mã khuyến mãi chung, voucher ship, không áp lên thẻ / nạp / gói / thẻ quà

<!-- Phiếu do chat soạn 11.11.2026 (bàn 35, sổ v61). Việc [T] (tiền) — Opus làn 1, lập kế hoạch rồi DỪNG chờ duyệt.
     Chủ quán chốt 08–09.11 + 10.11 + 11.11 (QUYET_DINH_CHU_QUAN.md mục 08–09.11, 10.11, 11.11):
     (1) MẪU VOUCHER trong Cài đặt Voucher (tên hiển thị · giảm số tiền HOẶC % có trần · đơn tối thiểu · áp dụng tất cả / nhóm món / món chọn ·
         hạn = số ngày từ lúc phát · dùng 1 lần · xem trước câu khách thấy) — mỗi lần phát sinh MỘT mã riêng từ mẫu, ghi nguồn. Việc sau (DOI-DIEM-1,
         GIOI-THIEU-1, sinh nhật…) chỉ CHỌN mẫu, không làm lại.
     (2) Một đơn: tối đa N voucher (Cài đặt, gợi ý 3) + MỘT mã khuyến mãi chung. Voucher TIỀN trừ trước, rồi voucher % trên phần còn lại; tổng giảm
         ≤ tiền món. Giờ flash: không voucher % (luật F2 sẵn có). Voucher ship (số tiền hoặc % có trần) chỉ giảm DÒNG PHÍ GIAO, tính vào N.
     (3) Mã giảm / voucher KHÔNG áp lên thẻ hạng, nạp tiền, gói trả trước, thẻ quà — đơn có thêm món thường thì chỉ tính trên món thường; máy chủ
         chặn ở cả quầy lẫn App (nạp đã có NAP_CHI_TIEN_MAT_QR — giữ).
     (4) Huỷ / không thành công → trả lại MỌI voucher của đơn.
     Hiện trạng chat đọc 11.11 trên main 53a71a2: đơn nhận MỘT discount_code (orders.js ~623–800, taoDon), giảm hạng + mã qua tinhUuDai (utils/uuDai.js,
     UUDAI-1: dùng chung / không theo loại mã); voucher đổi điểm = dòng pos_voucher_grants trỏ mã trong pos_discount_codes (loyalty.js /redeem, đổi
     sang 'used' ở orders.js ~1113); trả lượt khi huỷ / hoàn: traLuotMa (utils/tienDaTra.js ~62). Danh mục quà đổi điểm pos_reward_catalog (rewards.js)
     đã có kiểu giảm / giá trị / trần / valid_days — gần với "mẫu voucher": KẾ HOẠCH xét dùng lại / mở rộng, không đẻ bảng thừa.
     SONG SONG: HUY-1 (Opus làn 2) sửa đường huỷ đơn và GỌI traLuotMa — VOUCHER-2 là việc DUY NHẤT đổi thân traLuotMa (trả nhiều voucher);
     giữ nguyên tên + tham số để HUY-1 không phải đổi lời gọi. Bước nâng cấp: VOUCHER-2 dùng 026 (HUY-1 giữ 025). -->

**Chờ duyệt kế hoạch:** viết `viec/VOUCHER-2/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Quán phát voucher theo mẫu cài sẵn (đổi điểm, giới thiệu bạn bè, sinh nhật… sau này chỉ chọn mẫu), khách dùng được nhiều voucher trong một đơn ở
quầy lẫn App, máy chủ tính đúng một cách duy nhất và không để giảm lố. Làm trước khai trương vì DOI-DIEM-1, GIOI-THIEU-1 dựa vào mẫu voucher.

## Nghiệm thu
- A **Mẫu voucher (Cài đặt → Voucher):** thêm / sửa / tắt mẫu (chủ quán / quản lý theo quyền sẵn có): tên hiển thị, kiểu (số tiền | % + trần |
  ship số tiền | ship % + trần), đơn tối thiểu, áp dụng (tất cả / nhóm món / món chọn), hạn (số ngày từ lúc phát), dùng 1 lần; xem trước câu khách
  thấy, vd "Giảm 20.000đ cho đơn từ 50.000đ · HSD 30 ngày" (MỘT hàm dựng câu, App và quầy dùng chung). Lưu báo rõ (thành phần BAO-1a).
- B **Phát từ mẫu:** một hàm `phatVoucher(mau, sdt, nguon)` sinh MỘT mã riêng gắn tài khoản khách, hạn tính từ lúc phát, ghi `nguon`
  (doi_diem / gioi_thieu / tay …). Đổi điểm hiện có (loyalty /redeem) đi qua hàm này (hành vi đổi điểm giữ nguyên).
- C **Nhiều voucher một đơn:** tối đa N (Cài đặt, mặc định 3) + MỘT mã khuyến mãi chung. Thứ tự: voucher tiền → voucher % trên phần còn lại; tổng
  giảm (hạng + mã chung + voucher) ≤ tiền món đủ điều kiện; luật UUDAI-1 (dùng chung / không với giá hạng) giữ cho mã chung. Vượt N, voucher của
  người khác, hết hạn, đã dùng, chưa đủ đơn tối thiểu → báo rõ từng mã, đơn không lưu.
- D **Giờ flash:** không nhận voucher % (luật F2) — voucher tiền vẫn dùng được.
- E **Voucher ship:** chỉ giảm dòng phí giao (GIAO-1), không quá phí giao; đơn không có phí giao → báo "Voucher giao hàng chỉ dùng cho đơn giao".
  Tính vào N.
- F **Không áp:** thẻ hạng, nạp tiền, gói trả trước, (sau này) thẻ quà — đơn trộn thì mã / voucher chỉ tính trên món thường; đơn chỉ có các dòng
  đó thì báo rõ. Máy chủ chặn ở mọi đường (quầy, phiên thanh toán, App báo giá + tạo đơn).
- G **Huỷ / không thành công / hoàn:** trả lại MỌI voucher + lượt mã chung của đơn (traLuotMa). Phiên QR hết hạn / huỷ → không tiêu voucher.
  Hai đơn cùng lúc dùng một voucher → chỉ một đơn được.
- H **App KH:** `GET /voucher` trả thêm `mo_ta` (câu dựng từ mẫu) + `nguon`; báo giá + tạo đơn nhận DANH SÁCH voucher (tên trường kế hoạch đề xuất);
  hợp đồng `/api/kh` tăng PHIEN_BAN, `cong_cu/thu_HOPDONG_KH.js` khớp; App cũ gửi một mã vẫn chạy (tương thích ngược).
- I **Màn Bán hàng mới:** chọn / bỏ nhiều voucher của khách (danh sách voucher còn dùng được), ô mã khuyến mãi chung; giỏ / hoá đơn / tem hiện
  từng dòng giảm. Đơn đã lưu ghi đủ các mã đã dùng (báo cáo, Đối soát voucher khớp).
- K5 **Không đổi:** cách tính giảm hạng, Flash, combo / topping hiện có, đơn không dùng voucher (tiền y hệt trước), luật nạp chỉ tiền thật.

## Phạm vi
- viec/VOUCHER-2/**
- server/routes/orders.js
- server/routes/discount-codes.js
- server/routes/loyalty.js
- server/routes/rewards.js
- server/routes/settings.js
- server/routes/thanh-toan.js
- server/routes/don-mo-rong.js
- server/routes/hoaDon.js
- server/routes/reports.js
- server/routes/backup.js
- server/routes/kh/index.js
- server/utils/uuDai.js
- server/utils/itemScopeDiscount.js
- server/utils/voucherCode.js
- server/utils/tienDaTra.js
- server/utils/donApp.js
- server/utils/donThu.js
- server/utils/doiSoat.js
- server/utils/dongHoaDon.js
- server/utils/giuCho.js
- server/database.js
- server/nang_cap/026_voucher.js
- server/nang_cap/chay.js
- client/src/**
- client/dist/**
- cong_cu/thu_VOUCHER2.js
- cong_cu/thu_HOPDONG_KH.js
- HOP_DONG_API_KH.md
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_VOUCHER2.js` ĐỎ trên code gốc: đơn 2 voucher tiền + 1 voucher % → tổng đúng thứ tự; voucher thứ N+1 → từ chối; mã chung + voucher
cùng đơn; voucher % giờ flash → từ chối, voucher tiền vẫn qua; voucher ship chỉ trừ phí giao; đơn có thẻ hạng / nạp / gói → mã chỉ tính phần món
thường; huỷ đơn → mọi voucher về 'available'; hai đơn song song cùng voucher → một đơn; phát từ mẫu → hạn đúng số ngày, gắn đúng khách.

## Ngân sách
~400 dòng máy chủ + ~250 dòng giao diện + ~600 dòng thử. Vượt 1,5 lần thì giải thích trong kế hoạch.
**Phương án đơn giản nhất đã xét:** giữ MỘT hàm tính (tinhUuDai mở rộng nhận danh sách voucher), mẫu voucher dựa trên bảng sẵn có
(pos_reward_catalog / pos_discount_codes) nếu đủ trường; đường phát / dùng / trả voucher mỗi thứ MỘT hàm, quầy và App gọi chung.

## Đổi cấu trúc DB
có — chỉ THÊM (bước `026_voucher.js`): cột / bảng mẫu voucher, nguồn phát, bảng nối đơn ↔ các mã đã dùng (nếu cần); bảng mới vào BACKUP_TABLES.

## Thư viện mới
không

## Soát bảo mật
có — tiền / giảm giá, dùng voucher của người khác, dùng hai lần, đua hai đơn.

## Cấm
Không làm đổi điểm lấy quà hiện vật / phiếu quà (DOI-DIEM-1), giới thiệu bạn bè (GIOI-THIEU-1), thẻ quà (QUA-TANG-1) — chỉ làm sẵn mẫu + hàm phát để
các việc đó gọi. Không sửa đường huỷ đơn ngoài thân traLuotMa (HUY-1 song song). Không đổi luật nạp tiền. Giao diện mẫu voucher đặt trong file MỚI
`client/src/pages/CaiDat/MauVoucher.jsx`; Settings.jsx chỉ thêm vài dòng gắn thẻ (BAO-1b song song sửa Settings.jsx — chỗ đụng ít nhất).
