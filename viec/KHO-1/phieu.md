# KHO-1 — Kho trong POS, phần 1: dữ liệu kho, nâng cấp dữ liệu đánh số, nhập danh mục từ SX, màn Nguyên liệu & Sản phẩm–công thức

<!-- Phiếu do chat soạn 27.10.2026. Việc [T] (kho) — Opus, máy lập kế hoạch, dừng chờ duyệt. Nền: main sau sổ v42 (cha 40e07ce).
     Chủ quán chốt 26–27.10: BỎ app SX, mọi thứ về POS (nhập nguyên liệu → pha chế / sản xuất → thành phẩm → bán). Khai trương T7
     07.11 CHỈ khi mọi việc trong LICH_KHAI_TRUONG.md xong hết (không khai trương với phần làm dở). Việc này là NỀN: bán hàng vẫn trừ kho qua SX
     tới KHO-3 — KHÔNG đổi nguồn menu, KHÔNG đụng đường bán.
     Demo chủ quán đã duyệt (máy không mở được link, quyết định đã chép vào phiếu): kho claude.ai/artifact/J4ayQU7LUgEh5ZfGCRBzhp,
     sắp xếp POS claude.ai/artifact/YFnr4dnAhVDXUDuPHCt2Rq. Chạy SONG SONG: UUDAI-1 (orders.js, Sales.jsx), HD-1 (hoá đơn), BH-2
     (màn bán hàng + menu 6 mục: Bán hàng · Hôm nay · Đơn hàng · Khách hàng · Kho · Quản lý) — giữ đúng Cấm để gộp không đụng nhau.
     Dữ liệu SX (bản sao lưu 09.10, chat đã đọc): 41 nguyên liệu → 33 sau gộp; nhiều giá = 0, chưa có tối thiểu / hạn; 9 công thức:
     6 nước thực dưỡng (Hồng Tân Sinh, Lục Tân Khí, Thanh Tân Dưỡng, Tĩnh Nguyên Thủy, Ôn Dương Lộ, Tâm Vệ Lộ — kg cho 1 phần 200 ml)
     + 3 trà gói (Dưỡng Nhan Lộ, Ngọc Thanh Lộ, An Mi Lộ — cho 1 gói). Cấu trúc SX (server.js của kho tuquyduong/Quan-Ly-San-Xuat):
     ingredients, product_types, sx_products (+ legacy_table/legacy_id trỏ recipes / tea_products), sx_product_ingredients,
     recipe_ingredients, tea_ingredients; POS nối món SX bằng (sx_product_type, sx_product_id) = unique_id `${type}_${id}`. -->

**Chờ duyệt kế hoạch:** viết `viec/KHO-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
POS có danh mục kho của riêng mình — nguyên liệu, nhóm, nhà cung cấp, sản phẩm = công thức, định mức, lô, phiếu — nạp được danh
mục thật từ bản sao lưu SX, và chủ quán xem / sửa trên màn Quản lý. Đây là nền cho KHO-2 (pha chế, xuất kho có duyệt, nhận hàng,
xử lý phát sinh) và KHO-3 (bán trừ kho POS, kiểm kê cuối ca, tắt nối SX). Phải xong trước khai trương.

## Nghiệm thu
- A **Cấu trúc theo mục nghiệp vụ** (mẫu cho các mục sau): `server/kho/` gồm `duong.js` (đường nối: nhận yêu cầu, kiểm quyền, gọi hàm),
  `tinh.js` (phép tính THUẦN — không DB, không giờ), `duLieu.js` (đọc / ghi CSDL), `nhapSx.js` (nhập từ bản sao lưu SX). Mount MỘT chỗ
  `/api/pos/kho`. Giao diện ở `client/src/pages/Kho/`. Phần dùng chung (giờ, quyền, mã lỗi, `api.js`) gọi cái đang có, không chép.
  Thông tin riêng của quán (bảng gộp tên, nhóm mặc định) là hằng số có tên một chỗ — để sau đóng gói cho quán khác.
- B **Nâng cấp dữ liệu đánh số:** `server/nang_cap/NNN_<ten>.js` (bước đầu `001_kho.js`) + bộ chạy; bảng `pos_nang_cap` ghi bước đã
  chạy + giờ. Khởi động máy chủ chạy các bước chưa chạy theo số, mỗi bước MỘT giao dịch; bước lỗi → không đánh dấu, máy chủ báo rõ bước
  nào hỏng. Chỉ THÊM (bảng / cột / chỉ mục). Bước nào thêm cột vào bảng ĐANG CÓ dữ liệu → tự chép bảng đó sang `_sao_luu_NNN_<bang>`
  trước. Code tạo bảng cũ trong `database.js` để nguyên; chỉ thêm lời gọi bộ chạy sau phần tạo bảng / seed. Khởi động lại nhiều lần →
  không đổi gì.
- C **Bảng kho** (tiền tố `kho_`, kế hoạch đề xuất cột cụ thể): nhóm nguyên liệu; nguyên liệu (tên, nhóm, đơn vị lưu, đơn vị hiện + hệ
  số đổi, giá nhập gần nhất, tồn tối thiểu, hạn dùng theo ngày, ghi chú, đang dùng / ngừng); nhà cung cấp; công thức (thành phần là
  nguyên liệu HOẶC sản phẩm khác, lượng cho 1 đơn vị); nhóm công thức; định mức hằng ngày; lô (thành phẩm và nguyên liệu: số lượng, hạn,
  giá vốn / đơn vị, phiếu sinh ra lô); phiếu + dòng phiếu (loại ĐH / PX / PN / PS / KK, số phiếu, người tạo, người duyệt, trạng thái,
  lý do sửa / huỷ; sửa = phiếu mới, phiếu cũ giữ). Tồn KHÔNG là ô sửa tay: tồn suy ra từ lô / phiếu đã duyệt (kế hoạch chọn cách, ghi
  lý do). KHO-1 chỉ TẠO bảng phiếu / lô / định mức — chưa có luồng, chưa có màn (KHO-2 làm).
- D **Sản phẩm = công thức, MỘT nguồn:** một món bán là MỘT dòng — không tạo bảng sản phẩm thứ hai chạy song song `pos_products`. Mỗi
  sản phẩm có kiểu: `pha_tai_cho` (bán trừ thẳng nguyên liệu, vd nước chanh) · `lam_san` (bán trừ thành phẩm theo lô FEFO: nước ép,
  cốt, trà gói, món dưỡng sinh) · `chua_dinh_luong` (bán được, chưa trừ kho). Giữ khoá nối SX (`sx_product_type`, `sx_product_id`)
  để giá POS và lịch sử đơn không đứt. Kế hoạch nêu rõ cách: thêm cột vào `pos_products` (qua bước nâng cấp, có sao lưu) hay bảng
  `kho_*` khoá theo đúng dòng `pos_products` — chọn cách đơn giản nhất giữ được "một món một dòng".
- E **Công thức:** lồng được (sản phẩm dùng sản phẩm khác); hàm thuần `trienKhai(congThuc, soPhan)` → danh sách nguyên liệu gốc + tổng
  lượng (dùng lại ở KHO-2: phiếu xuất, đơn đặt hàng). Lưu công thức tạo vòng (A→B→A, kể cả A→A) → 400 `CONG_THUC_VONG_LAP`, lời
  báo nêu chuỗi tên. Lưu số thật; làm tròn chỉ khi hiển thị (gam / ml).
- F **Nhập danh mục từ SX** (chỉ chủ quán): Quản lý → "Nhập từ SX" → chọn file `.db` (bản sao lưu SX) → **XEM TRƯỚC**: số nguyên liệu sẽ
  thêm, các tên sẽ gộp (tên cũ → tên giữ), số sản phẩm / công thức, cảnh báo (giá 0, thiếu đơn vị, công thức trỏ nguyên liệu không có,
  một công thức có cả hai tên bị gộp) → bấm "Nhập" → ghi trong MỘT giao dịch. Nhập lại cùng file hay bản mới hơn → không nhân đôi (khoá
  theo tên đã chuẩn hoá / mã SX); bản mới hơn chỉ THÊM cái còn thiếu, không ghi đè chỗ chủ quán đã sửa trong POS. Đọc file bằng
  `@libsql/client` (đã có) chỉ đọc; file tạm xoá sau; giới hạn kích thước. Lấy: nguyên liệu (tên, nhóm, đơn vị, giá, hạn, tối thiểu —
  ô trống / 0 GIỮ trống để chủ quán điền), nhóm sản phẩm, sản phẩm, công thức (kế hoạch đọc cấu trúc SX để biết bảng công thức nào đang
  dùng thật). KHÔNG lấy: tồn, lô, khách, gói đăng ký, giao định kỳ, việc. Nhóm giữ đúng tên SX ("Nước ép", "Trà"…).
- G **Gộp trùng:** chuẩn hoá tên (bỏ khoảng thừa, không phân biệt hoa / thường, GIỮ dấu) + bảng gộp tay chủ quán chốt (hằng số trong
  `nhapSx.js`): Gừng ← Gừng tươi · Kỷ tử ← Kỳ Tử · **Táo đỏ ← Táo đỏ, Táo Đỏ, Táo đỏ khô** (chủ quán 27.10: tên giữ "Táo đỏ"; "Táo
  tươi" là nguyên liệu KHÁC, KHÔNG gộp) · Trần bì khô ← Trần bì (mọi biến thể) · Cẩu tích, Mẹ thuốc (trùng tên). Công thức trỏ tên bị
  gộp → trỏ tên giữ; một công thức có cả hai → cộng lượng + ghi cảnh báo ở bản xem trước. Bản 09.10 phải ra 33 nguyên liệu.
- H **Màn Quản lý** (đường dẫn mới; việc này chỉ thêm route + MỘT mục "Quản lý kho" vào menu hiện tại — BH-2 xếp vào menu 6 mục):
  - Nguyên liệu: ô tìm (gõ không dấu vẫn ra), sắp xếp (tên · nhóm · giá · mới thêm), tab Tất cả + tab từng nhóm; thêm / sửa / ngừng dùng
    (không xoá cứng nguyên liệu đã nằm trong công thức hay phiếu); quản lý nhóm và nhà cung cấp. Dùng tốt trên điện thoại (dạng thẻ).
  - Sản phẩm & công thức: danh sách theo nhóm; bấm một sản phẩm → công thức cho 1 đơn vị + ô "Tính cho N phần" (máy nhân ra từng
    nguyên liệu); chọn kiểu sản phẩm (D). Chỉ CHỦ QUÁN sửa công thức và kiểu.
  - Ô "Thiếu thông tin": đếm nguyên liệu giá 0 / thiếu hạn / thiếu tối thiểu, bấm ra đúng danh sách đó để điền nhanh.
  Màn theo luật giao diện chủ quán: ít nút, việc hay dùng lên trước, danh sách dài thì có tìm + tab, không bày hết một màn.
- I **Quyền** (kiểm ở MÁY CHỦ, không chỉ ẩn nút): chủ quán — mọi thứ; quản lý — thêm / sửa nguyên liệu, nhóm, nhà cung cấp, xem công
  thức; nhân viên — chỉ xem nguyên liệu. Dùng vai trò / `checkPermission` đang có (bảng phân quyền chi tiết làm sau khai trương).
- J **Sao lưu:** thêm `pos_nang_cap` và các bảng `kho_*` vào `BACKUP_TABLES` (backup.js), cha trước con.
- K **K5 — không đổi:** menu bán hàng, giá, tạo đơn, trừ kho qua SX chạy y như cũ; POS khởi động được trên kho thử trống và trên bản sao
  dữ liệu thật; máy chủ chưa có bảng mới → tự tạo khi khởi động.

## Phạm vi
- viec/KHO-1/**
- server/kho/**
- server/nang_cap/**
- server/index.js
- server/database.js
- server/routes/backup.js
- client/src/pages/Kho/**
- client/src/App.jsx
- client/src/components/Layout.jsx
- client/dist/**
- cong_cu/thu_KHO1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — bài mới `cong_cu/thu_KHO1.js` phải ĐỎ trên code gốc: hàm thuần (đổi đơn vị, nhân theo số phần, lồng 2 tầng, vòng lặp A→A và
A→B→A, gộp trùng theo bảng gộp tay, "Táo tươi" không bị gộp); bộ chạy nâng cấp (chạy 2 lần không đổi; bước lỗi không đánh dấu; bước
thêm cột có bảng sao lưu); nhập SX từ một file `.db` mẫu do bài thử tự dựng (có tên trùng, giá 0, công thức trỏ tên gộp; nhập 2 lần
không nhân đôi); quyền (nhân viên sửa công thức → 403, quản lý sửa công thức → 403, quản lý thêm nguyên liệu → 200).

## Ngân sách
~600 dòng máy chủ + ~700 dòng giao diện + ~450 dòng thử. `server/index.js`: một dòng mount; `database.js`: một lời gọi bộ chạy nâng
cấp; `App.jsx` / `Layout.jsx`: route + một mục menu; `kiem_tra_truoc_khi_giao.js`: chỉ thêm tên bài vào cuối mảng.
**Phương án đơn giản nhất đã xét:** thêm bảng thẳng trong `createTables()` như cách cũ — không chọn: chủ quán chốt nâng cấp dữ liệu
theo bước đánh số, chỉ thêm, sao lưu trước bước đụng bảng cũ, để mọi lần nâng cấp sau không chạm dữ liệu thật.

## Đổi cấu trúc DB
có — chỉ THÊM qua `server/nang_cap/001_kho.js` (bảng `pos_nang_cap`, các bảng `kho_*`; nếu chọn thêm cột vào `pos_products` thì có sao
lưu bảng trước). Không xoá, không đổi tên, không sửa dữ liệu cũ.

## Thư viện mới
không (`@libsql/client`, `multer` đã có)

## Cấm
- KHÔNG sửa `server/routes/orders.js`, `products.js`, `thanh-toan.js`, `wallets.js`, `loyalty.js`, `customers*.js`, `server/utils/sxApi.js`,
  `server/ketNoiKho.js`, `client/src/pages/Sales.jsx`, `client/src/pages/BanHang/**`, `client/src/components/Invoice*`, `InPhieu.jsx`,
  `client/src/utils/inPhieu.js`, `app_kh/**`.
- KHÔNG làm pha chế, phiếu xuất, nhận hàng, đặt hàng, xử lý phát sinh, kiểm kê, giao việc (KHO-2 / KHO-3 / sau khai trương); KHÔNG đổi
  nguồn menu bán hàng sang POS, KHÔNG trừ kho POS khi bán (KHO-3).
- KHÔNG xoá / sửa dữ liệu bảng cũ; KHÔNG chạy nhập SX lên dữ liệu thật trong lúc làm (chỉ trên kho thử / file mẫu).
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/KHO-1`. Không đụng main, không merge,
  không tạo PR.
