# KH-THE-1 — Bán thẻ hạng trên App (chung giỏ), cấp hạng TỰ ĐỘNG ngay khi đơn được ghi "đã thu" ở MỌI cách trả; hợp đồng /api/kh v13

<!-- Phiếu do chat soạn 08.11.2026 (bàn 33, sổ v58). Việc [T] (tiền + hạng) — Opus, lập kế hoạch rồi DỪNG chờ duyệt.
     Thư App KH 07.11 (YEU_CAU_APPKH_GUI_POS_07112026.md) + chủ quán chốt 08.11 (QUYET_DINH đợt 07–08.11): thẻ hạng = sản phẩm; chung giỏ với đồ uống,
     trả một lần; hạng phải CÓ TRƯỚC thì món mới được giá hạng (đồ uống cùng đơn tính theo hạng khách ĐANG CÓ — quầy đang làm đúng vậy, orders.js
     ~640 getMembershipStatus lúc tạo đơn); hạng mới áp từ đơn sau. Cấp hạng TỰ ĐỘNG ngay khi đơn có thẻ được ghi "đã thu" — tiền mặt, CK, ví, QR
     (Tingee), ở quầy hay App — trong CÙNG giao dịch ghi đã thu. Hạng "chỉ chủ quán cấp" (Kim Cương): App vẫn hiện, nút Mua mờ.
     Hiện trạng main 801e99a: quầy bán thẻ qua `membership_buy` (orders.js ~490: kiểm cach_co 'ban', goiBanDuoc, chặn hạng thấp hơn; ~1077 ghi
     pos_membership_purchases trong giao dịch tạo đơn — đơn quầy chỉ tạo khi đã thu). Đơn App: utils/donApp.js tạo đơn chờ trả, tiền về qua
     Tingee / ví → chốt; hiện CHƯA có dòng thẻ. Huỷ / xoá đơn có thẻ: orders.js ~1541 / ~1730 xoá đúng dòng sổ thẻ (P26c).
     Chạy SONG SONG với DIEM-MON-1 (Opus — cờ tích điểm theo dòng, dùng chung hàm tính điểm) và QUAY-UI-1 (Sonnet — tab Thẻ ở màn Bán hàng quầy). -->

## Mục tiêu
Khách mua thẻ hạng trên App (một mình hoặc chung giỏ với đồ uống), trả một lần; tiền về là hạng lên ngay, không ai bấm gì. Một hàm bán thẻ dùng chung
quầy + App; huỷ / hoàn thu hồi thẻ như quầy.

## Nghiệm thu
- A Tách MỘT hàm bán thẻ (vd `server/utils/banThe.js`): kiểm hạng / gói bán được (cach_co 'ban', goiBanDuoc, có giá), chặn hạng thấp hơn hạng đang
  có còn hạn, tra giá máy chủ, và hàm GHI sổ thẻ (cộng nối hạn cùng hạng). orders.js (quầy) và donApp.js (App) cùng gọi; hành vi quầy y nguyên.
- B Hợp đồng `/api/kh` v13: `POST /gio/bao-gia` và `POST /don` nhận dòng thẻ trong `mon[]` — `{ loai: 'the', hang_id, so_thang }`, `so_luong` 1, tối đa
  một dòng thẻ / đơn; CÙNG khoá gửi, `tong_da_xem`, cách trả `qr` / `vi` / `vi_qr`, luật 4xx / 5xx như đơn hiện nay. Mã lỗi: `HANG_CHI_CAP`,
  `GOI_HANG_KHONG_BAN`, `DA_CO_HANG_CAO_HON`, `GIA_DA_DOI` (dùng lại mã quầy đang có), `NHIEU_THE` (quá một dòng thẻ).
- C Giá đồ uống trong đơn có thẻ tính theo hạng khách ĐANG CÓ lúc báo giá / đặt (không theo thẻ đang mua) — bài thử khoá.
- D Cấp hạng NGAY trong cùng giao dịch ghi "đã thu" của đơn App: trả ví (lúc tạo), QR (lúc Tingee báo tiền về / xác nhận tay tiền về muộn), vi_qr
  (khi đủ). `/toi.hang` đổi ngay sau đó. Đơn chưa thu → chưa có hạng. Hai lần báo tiền trùng → một dòng sổ thẻ.
- E Huỷ / hoàn / xoá đơn App có thẻ → thu hồi đúng dòng thẻ như quầy (P26c); hạng tính lại từ sổ.
- F `GET /hang` thêm `quyen_loi[]` (chữ, chủ quán nhập ở Cài đặt → Hạng thành viên, mỗi hạng một ô nhiều dòng) — bước 023 thêm cột có sao lưu.
- G `hoa_don[]` có dòng thẻ (`loai: 'the'`, "Thẻ Vàng · 3 tháng", giá, hạn mới); màn Đơn App ở quầy hiện rõ "có thẻ" (quầy không pha dòng này); tem ly
  không in dòng thẻ; Đối soát xếp tiền thẻ App vào cùng nhóm bán thẻ như quầy.
- H Điểm khi mua thẻ: dùng ĐÚNG hàm tính điểm chung (DIEM-MON-1 thêm cờ theo dòng) — KH-THE-1 không tự viết luật điểm riêng.
- K5 Không đổi: luật giảm hạng, hạn cộng nối, bán thẻ ở quầy, các cửa `/api/kh` khác.

## Phạm vi
- viec/KH-THE-1/**
- server/utils/banThe.js
- server/utils/donApp.js
- server/utils/giuCho.js
- server/utils/membershipStatus.js
- server/utils/doiSoat.js
- server/utils/dongHoaDon.js
- server/routes/kh/**
- server/routes/orders.js
- server/routes/tiers.js
- server/routes/hoaDon.js
- server/nang_cap/023_quyen_loi_hang.js
- server/database.js
- client/src/pages/CaiDat/HangThe.jsx
- client/src/pages/DonApp.jsx
- client/src/components/DonAppNoi.jsx
- client/src/components/InPhieu.jsx
- client/src/utils/api.js
- client/dist/**
- HOP_DONG_API_KH.md
- cong_cu/thu_KHTHE1.js
- cong_cu/thu_HANG1.js
- cong_cu/thu_KHAPI2.js
- cong_cu/thu_HOPDONG_KH.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHTHE1.js` ĐỎ trên gốc: đơn App có dòng thẻ bị từ chối / không cấp hạng; sau khi vá: trả ví → `/toi.hang` đổi ngay; QR → hạng chỉ lên
khi tiền về (trước đó chưa có); đồ uống cùng đơn tính theo hạng cũ; huỷ → thu hồi; báo tiền trùng → một dòng sổ; Kim Cương (chỉ cấp) → HANG_CHI_CAP.
Bài cũ đỏ vì đổi orders.js → DỪNG hỏi (khuôn SUA-*).

## Ngân sách
~350 dòng máy chủ + ~80 dòng giao diện + ~350 dòng thử.
**Phương án đơn giản nhất đã xét:** dòng thẻ = một dòng đơn như quầy (product_id âm đã có); cấp hạng gắn vào chính hàm "chốt đơn đã thu" sẵn có của
donApp, không thêm đường tiền mới.

## Đổi cấu trúc DB
có — bước 023 thêm cột quyền lợi cho hạng (themCot, có sao lưu). Số 024 đã giữ cho DIEM-MON-1.

## Thư viện mới
không

## Soát bảo mật
có — tiền + hạng; cửa `/api/kh` khách gọi.

## Cấm
Không đổi luật điểm (DIEM-MON-1), không làm nạp tiền trên App (KH-NAP-1 sau), không đổi màn Bán hàng quầy (QUAY-UI-1).
