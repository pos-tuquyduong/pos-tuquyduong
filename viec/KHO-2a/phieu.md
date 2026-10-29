# KHO-2a — Kho POS phần 2a: pha chế theo định mức · phiếu xuất kho nguyên liệu có duyệt · in · thành phẩm vào kho · tồn · danh sách phiếu

<!-- Phiếu do chat soạn 29.10.2026. Việc [T] (kho) — Opus, lập kế hoạch, dừng chờ duyệt. Nền: main sau sổ v45 (KHO-1 đã gộp 65eb00d).
     KHO-2 cũ TÁCH ĐÔI cho vừa một lần soát: KHO-2a (việc này) và KHO-2b (đặt hàng · nhận hàng · xử lý phát sinh — mở sau, làn Opus 2).
     Đọc TRƯỚC: QUYET_DINH_CHU_QUAN.md mục Kho; LUAT_XAY_APP.md §3 (mục nghiệp vụ server/kho/, nâng cấp dữ liệu đánh số); viec/KHO-1/ke_hoach.md
     (bảng kho_*: kho_phieu loại PX, trạng thái nhap/cho_duyet/da_duyet/huy, thay_cho_id; kho_lo; kho_phieu_dong so_luong CÓ DẤU; kho_dinh_muc
     theo thứ 0–6; tồn = Σ dòng phiếu đã duyệt — không có ô tồn sửa tay). Demo chủ quán đã duyệt: claude.ai/artifact/J4ayQU7LUgEh5ZfGCRBzhp
     (máy không mở được — quyết định đã chép dưới). Chạy SONG SONG: KH-API-2 (orders.js, Cài đặt), HD-1 (hoá đơn), BH-2 (màn bán hàng,
     menu) — giữ đúng Cấm. -->

**Chờ duyệt kế hoạch:** viết `viec/KHO-2a/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Nhân viên pha chế mỗi sáng bấm vài lần là có phiếu xuất đúng định lượng, quản lý duyệt trên máy mình, in ra làm theo; kho tự trừ nguyên liệu
và cộng thành phẩm; chủ quán thấy tồn và mọi phiếu. Nhanh, ít bấm, dùng tốt trên điện thoại (QUYET_DINH: quán đông không đứng thao tác lâu).

## Nghiệm thu
- A **Định mức** (quản lý / chủ đặt): mỗi món kiểu `lam_san` một số phần mỗi ngày, có thể khác theo thứ trong tuần (`kho_dinh_muc`).
- B **Màn Pha chế** (tab đầu của Kho): hai nút "Cho hôm nay" / "Cho ngày mai"; mỗi món làm sẵn: định mức · đang có (thành phẩm còn hạn) ·
  **cần làm = định mức − đang có** (không âm). Tick món (mặc định tick món cần làm > 0), sửa được số phần → nút **"Xuất kho nguyên liệu"**.
- C **MỘT phiếu PX** cho cả lần đó: trên cùng **bảng tổng cần lấy** (nguyên liệu gộp, đã triển khai công thức lồng bằng `trienKhai`), bên
  dưới **mỗi công thức một bảng nguyên liệu ngay dưới tên món** (đọc trên điện thoại); số gam / ml đổi theo số phần. Phiếu in (giấy 80 mm và
  A4): A tổng cần lấy (ô ☐ để tick) · B định lượng từng công thức (cả mẻ + 1 phần) · C kết quả (ô điền số thực ra) · người tạo, người duyệt,
  giờ (giờ Việt Nam). Số phiếu `PX-YYMMDD-NNN`.
- D **Duyệt** (chủ quán chốt 27.10): phiếu do **nhân viên** tạo → `cho_duyet`, LUÔN cần duyệt (công tắc Cài đặt "Nhân viên xuất kho cần
  duyệt", mặc định BẬT); **quản lý / chủ** tạo → tự duyệt. Người duyệt khác người tạo; danh tính = tài khoản đăng nhập POS, KHÔNG PIN riêng.
  Máy người duyệt hiện thông báo (huy hiệu số phiếu chờ + danh sách Chờ duyệt, tự làm mới); duyệt / từ chối (có lý do) một chạm. Duyệt hai
  lần, hai người duyệt cùng lúc, bấm hai lần → chỉ MỘT lần ghi (khoá trạng thái trong cùng giao dịch).
- E **Duyệt xong → In → ghi kho trong MỘT giao dịch:** dòng âm cho từng nguyên liệu (trừ theo lô hạn gần nhất trước nếu có lô; thiếu thì
  vẫn ghi, tồn âm, báo đỏ — KHÔNG chặn); **thành phẩm vào kho ngay theo số chuẩn**: một lô mỗi món, hạn = giờ làm + hạn dùng của món, giá vốn
  = Σ (lượng × giá nhập) nếu đủ giá. Cột hạn dùng của món chưa có → thêm qua bước nâng cấp `002_*.js` (khung KHO-1, có sao lưu); công cụ nhập
  SX điền từ `days_use` của SX khi ô còn trống.
- F **Kết quả:** ra đúng chuẩn → chạm ✓; khác → sửa số thực + ghi chú, ghi thành dòng điều chỉnh thành phẩm trong CÙNG phiếu (có người,
  giờ). Lệch quá ngưỡng (Cài đặt: % chuẩn và % lệch cho phép theo nhóm món, vd nước ép) → cảnh báo vàng, KHÔNG chặn. Qua ngày (giờ VN) chưa
  điền → tự coi đúng chuẩn, gắn cờ "tự chốt" cho quản lý xem.
- G **Tồn kho:** nguyên liệu + thành phẩm; tab nhóm, ô tìm (gõ không dấu), sắp xếp; dưới tồn tối thiểu → vàng; âm → đỏ; thành phẩm theo lô
  + hạn, sắp hết hạn / quá hạn → đỏ. Nhân viên KHÔNG thấy giá (giữ luật giá nhập TẠM ẨN).
- H **Danh sách phiếu:** lọc loại / trạng thái / ngày; mở xem; in lại (dòng "IN LẠI"). **Sửa / huỷ chỉ chủ quán**, bắt buộc lý do: sửa =
  phiếu MỚI `thay_cho_id`, phiếu cũ chuyển `huy` và GIỮ nguyên dòng; tồn luôn = Σ dòng phiếu còn hiệu lực.
- I **Quyền** (kiểm ở máy chủ): chủ — mọi thứ; quản lý — định mức, tạo + duyệt phiếu, xem tồn có giá; nhân viên — Pha chế, tạo phiếu, xem
  tồn không giá. Đường lạ / vai trò lạ → 403.
- J **K5:** bán hàng, giá, đơn, trừ kho qua SX chạy y như cũ (việc này CHƯA trừ kho khi bán — KHO-3).

## Phạm vi
- viec/KHO-2a/**
- server/kho/**
- server/nang_cap/**
- server/routes/settings.js
- server/database.js
- client/src/pages/Kho/**
- client/src/App.jsx
- client/src/components/Layout.jsx
- client/dist/**
- cong_cu/thu_KHO2a.js
- cong_cu/thu_KHO1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHO2a.js` ĐỎ trên code gốc: cần làm = định mức − đang có (có lô hết hạn không tính); phiếu gộp đúng bảng tổng với công
thức lồng; nhân viên tạo → chờ duyệt, quản lý tạo → tự duyệt, người tạo tự duyệt → 403; duyệt song song 2 lần → 1 lần ghi; trừ nguyên liệu
âm vẫn ghi + cờ; thành phẩm vào lô đúng hạn; điều chỉnh kết quả; tự chốt qua ngày (chạy với `TZ=UTC`, ngày theo giờ VN); sửa phiếu → phiếu
mới + cũ `huy`, tồn đúng; nhân viên đọc tồn không có giá.

## Bài thử cũ sửa
- cong_cu/thu_KHO1.js — chỉ nếu bước nâng cấp 002 làm đổi số bảng / số bước mà ca cũ đếm cứng; ca cũ giữ ý nghĩa

## Ngân sách
~650 dòng máy chủ + ~750 dòng giao diện + ~500 dòng thử. `Layout.jsx` / `App.jsx`: chỉ route trong mục Kho.
**Phương án đơn giản nhất đã xét:** mỗi món một phiếu xuất — không chọn: chủ quán chốt MỘT phiếu cho cả lần pha chế, có bảng tổng.

## Đổi cấu trúc DB
có — chỉ THÊM qua `server/nang_cap/002_*.js` (cột hạn dùng của món, nếu cần cột đánh dấu tự chốt / dòng điều chỉnh); thêm cột vào bảng có dữ
liệu thì qua `themCot` (tự sao lưu).

## Thư viện mới
không

## Cấm
- KHÔNG sửa `server/routes/orders.js`, `products.js`, `thanh-toan.js`, `wallets.js`, `loyalty.js`, `customers*.js`, `server/utils/sxApi.js`,
  `server/routes/kh/**`, `client/src/pages/Sales.jsx`, `client/src/pages/BanHang/**`, `client/src/components/Invoice*`, `InPhieu.jsx`,
  `client/src/utils/inPhieu.js`, `client/src/utils/hoaDon.js`, `app_kh/**`.
- KHÔNG làm đặt hàng, nhận hàng, xử lý phát sinh (KHO-2b), kiểm kê, bán trừ kho (KHO-3), giao việc / phân quyền chi tiết (sau khai trương).
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/KHO-2a`. Không đụng main, không merge,
  không tạo PR.
