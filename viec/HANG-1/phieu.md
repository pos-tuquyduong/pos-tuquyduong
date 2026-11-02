# HANG-1 — Hạng thẻ: thêm hạng, thứ bậc, gói thời hạn (bán), hạng chỉ cấp, cấp có PIN, hạng cao nhất còn hạn

<!-- Phiếu do chat soạn 02.11.2026 (sổ v53). Việc [T] (tiền) — Opus làn 2, lập kế hoạch, DỪNG chờ duyệt. Mở SAU KHI KH-SDT-1 gộp.
     Thiết kế đã duyệt: thiet_ke/THIET_KE_DOT2.md mục M3 + thiet_ke/demo_dot2.html tab 2. Quyết định: QUYET_DINH_CHU_QUAN.md mục 01–02.11.
     Hiện trạng chat đọc 02.11 trên main d1b57b8:
     - pos_membership_tiers (name, card_price, discount_percent, special_discount_percent, sort_order, is_active) — server/database.js ~1290;
       routes/tiers.js chỉ GET / PUT (sửa hạng CÓ SẴN) / DELETE; tier_card_valid_months dùng CHUNG mọi hạng (mặc định 3).
     - Mua thẻ = membership_buy trong POST /orders (orders.js ~485: dòng hàng giá card_price; ~1055 ghi pos_membership_purchases, hạn = bây giờ +
       tier_card_valid_months). Huỷ / hoàn đơn XOÁ dòng mua thẻ (orders.js ~1526, ~1715 — P26c).
     - Hạng hiện tại: utils/membershipStatus.js = dòng MỚI NHẤT còn hạn (KHÔNG phải hạng cao nhất) — dùng ở orders.js, kh/index.js, customers-v2.
     - App KH: GET /hang, /toi.hang (hợp đồng v5). App đã chịu được het_han null (thư App 02.11).
     - CLAUDE.md §5.6 đã sửa ở sổ v53: Vàng (bán) + Kim Cương (chỉ cấp), hạng thêm được. % giảm combo của hạng THUỘC COMBO-1a, không làm ở đây. -->

**Chờ duyệt kế hoạch:** viết `viec/HANG-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Chủ quán tự tạo hạng, xếp thứ bậc, bán hạng theo gói nhiều thời hạn, cấp hạng "chỉ cấp" có hoặc không thời hạn; máy luôn áp hạng CAO NHẤT còn hạn.

## Nghiệm thu
- A **Cài đặt hạng:** thêm / sửa / xoá hạng (tên, thứ bậc, % giảm thường, % nhóm đặc biệt, cách có hạng = `ban` | `chi_cap`); hạng `ban` có danh
  sách GÓI (số tháng 1–60, giá, bật/tắt) thêm / xoá tuỳ ý; gói chưa có giá thì không bán; giá trị sai → 400. Xoá hạng đang có khách còn hạn →
  từ chối (hoặc chỉ ẩn) — kế hoạch chọn, nêu lý do. Xoá trên giao diện: bấm 2 lần, KHÔNG dùng hộp thoại trình duyệt.
- B **Bán gói ở quầy:** membership_buy chọn GÓI (hạng + số tháng); máy chủ tự tra giá gói (không tin giá máy khách); hạng `chi_cap` → 400; khách
  đang có hạng còn hạn CAO HƠN → 400 mã riêng; cùng hạng → hạn CỘNG NỐI (hạn mới = max(hạn đang còn, bây giờ) + số tháng).
- C **Cấp hạng:** chỉ CHỦ QUÁN (quyền riêng) + PIN chủ quán; chọn hạng `chi_cap`, số tháng hoặc KHÔNG THỜI HẠN; ghi ai cấp / lúc nào (dòng sổ
  chỉ thêm); thu hồi cấp (chủ quán) cũng ghi dòng. Không thu tiền.
- D **Hạng hiện tại = hạng có THỨ BẬC CAO NHẤT còn hạn** (vô hạn = luôn còn); hạng trên hết hạn mà hạng dưới còn hạn → về hạng dưới. Một hàm
  dùng chung cho quầy, giá hạng, App, màn Khách hàng.
- E **Huỷ / hoàn đơn mua gói:** bỏ đúng phần hạn của đơn đó; nếu sau nó đã có lần mua cộng nối khác cùng hạng → hạn của các lần sau tính lại
  đúng (hoặc chặn huỷ, báo rõ) — kế hoạch chọn, bài thử canh.
- F **App KH:** `GET /hang` thêm `chi_cap`, `goi[] { so_thang, gia }` (rỗng khi chi_cap), `thu_bac`, giữ `gia_the` (= giá gói ngắn nhất, null nếu
  chỉ cấp) một đợt; `/toi.hang.het_han` = null khi không thời hạn. Đúng tên ở "Đã hẹn — v7" của HOP_DONG_API_KH.md; đưa lên bảng cửa, tăng
  PHIEN_BAN, nhật ký; thu_HOPDONG_KH xanh.
- G **Giao diện** theo demo tab 2: thẻ từng hạng, ▲▼ thứ bậc, gói, "+ Thêm hạng", trang Khách hàng có "Cấp hạng" (chủ quán) + nhật ký hạng; chỗ
  bán thẻ ở quầy hiện các gói, khoá gói khi khách có hạng cao hơn (ghi lý do).
- K5 **Không đổi:** giá hạng trên đơn (giaHang) với khách có đúng một hạng còn hạn; điểm; đơn không mua thẻ; bài thử TIER / BH-2 / KH-API cũ xanh.
- Dữ liệu: chưa bán thẻ nào trước khai trương — không cần chuyển thẻ cũ; hạng sẵn có: đổi `Vàng` thành `ban` với 2 gói 1 tháng + 3 tháng
  (giá trống), `Kim Cương` (nếu có) thành `chi_cap` — trong bước nâng cấp, chỉ khi tên khớp.

## Phạm vi
- viec/HANG-1/**
- server/routes/tiers.js
- server/routes/membership.js
- server/utils/membershipStatus.js
- server/utils/giaHang.js
- server/routes/orders.js
- server/routes/customers-v2.js
- server/routes/kh/index.js
- server/routes/backup.js
- server/nang_cap/013_hang.js
- server/nang_cap/chay.js
- client/src/**
- client/dist/**
- cong_cu/thu_HANG1.js
- cong_cu/thu_HOPDONG_KH.js
- HOP_DONG_API_KH.md
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_HANG1.js` ĐỎ trên code gốc: thêm hạng + gói; bán gói lấy giá máy chủ; cộng nối hạn; chặn hạng thấp hơn; chặn bán hạng chi_cap;
cấp không thời hạn cần PIN chủ quán; hạng cao nhất còn hạn thắng, hết hạn thì về hạng dưới; huỷ đơn gói đúng luật E; /hang + /toi đúng hợp đồng.

## Ngân sách
~280 dòng máy chủ + ~250 dòng giao diện + ~450 dòng thử.
**Phương án đơn giản nhất đã xét:** giữ sổ mua thẻ chỉ-thêm-dòng, thêm cột loại (bán / cấp), gói, hạn có thể vô hạn; một hàm "hạng hiện tại" thay
hàm cũ ở mọi nơi.

## Đổi cấu trúc DB
có — chỉ THÊM (bước 013): cột cho hạng (cách có hạng), bảng gói hạng, cột cho dòng mua / cấp thẻ (loại, số tháng, người cấp, vô hạn). Bảng mới
vào BACKUP_TABLES (luật SAOLUU-2); dòng cấp / mua thẻ vẫn chặn khôi phục như hiện nay.

## Thư viện mới
không

## Soát bảo mật
có — cấp hạng không thu tiền (chỉ chủ quán + PIN), giá gói do máy chủ tra, cửa App công khai `/hang`.

## Cấm
Không đổi % giảm combo (COMBO-1a); không thêm nút mua thẻ trên App (P3b sau khai trương).
