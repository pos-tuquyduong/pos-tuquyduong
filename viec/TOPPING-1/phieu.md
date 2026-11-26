# TOPPING-1 — Topping và ghi chú nhanh CÀI THEO TỪNG MÓN; bán topping riêng; topping trên giỏ / hoá đơn / tem / kho / App KH

<!-- Phiếu do chat POS soạn 26.11.2026 (bàn 41, main acc88921). Máy: Claude Code · OPUS. Việc TIỀN (giá topping, giảm hạng, voucher,
     điểm, kho) → "Chờ duyệt kế hoạch"; chat soát kế hoạch trong ngày.
     Chủ quán duyệt bản thử 26.11 15:32: https://claude.ai/artifact/VkginVyaDFx7vF6V8xKRtb (bản 1795682035-7911) — chép ở
     viec/TOPPING-1/ban_thu_topping.html. Chép HÀNH VI, không chép mã (dữ liệu giả, không gọi API).
     Chủ quán chốt 26.11: (1) CHO bán topping riêng; (2) mã giảm / voucher % áp CẢ topping. Đã chốt trước (sổ / bộ nhớ chat, không hỏi lại):
     giảm hạng áp cả topping (22.10); topping chọn ngay lúc chọn món, mỗi topping tối đa 3 phần / ly (DAC_TA_BAN_HANG_2410 mục 1.7);
     topping cài theo TỪNG món + ghi chú nhanh theo từng món (24.10); topping là hàng làm sẵn quản lý trong kho POS (17.11); hết hàng thì KHÔNG
     bán ở mọi kênh (17.11); hoá đơn giữ bố cục, thêm dòng topping (17.11); ghi chú món có ở mọi kênh (02.11).

     CHAT ĐÃ ĐỌC (main acc88921):
       - Màn Bán hàng mới ĐÃ chạy (BO-MAN-CU-1 gộp 18.11): client/src/pages/BanHang/BanHangMoi.jsx (502 dòng), KhungChonMon.jsx (42 dòng: ghi chú
         nhanh theo ghiChuMacDinh(sp.category) + ô tự gõ + số ly; CHƯA có topping), ghiChuMacDinh.js (THEO_NHOM viết cứng 'tea' / 'juice' — chú
         thích "TOPPING-1 thay bằng cài đặt theo từng sản phẩm — khi đó bỏ file này"), tinh.js (327 dòng), ManKetThuc.jsx, InPhieu.jsx (hoá đơn / tem).
       - pos_order_items (database.js 310–325): product_id, quantity, unit_price, total_price, notes, flash_unit_price, tier_unit_price
         (+ tich_diem từ nang_cap/024). Tạo dòng đơn: server/routes/orders.js ~486–590 (orderItems.push cho món / gói / thẻ / nạp), INSERT ~1115,
         trừ kho ~1127 banHang.truKhoDon(tx, { items: orderItems }).
       - Kho: server/kho/banHang.js kiemDuHang (giuCho.js 118 gọi), canCuaItems 51, xetDu 68, truKhoDon 99, huyPhieuBan 122, tonMenu 132.
         kho_san_pham.kieu CHECK ('pha_tai_cho','lam_san','chua_dinh_luong') — topping làm sẵn = 'lam_san'.
       - App KH: /api/kh/menu = products.js layMenuQuay (chung quầy), kh/index.js 41–46 danh sách trắng trường món (`anh: null`); đơn App
         server/utils/donApp.js (đi đường tạo đơn chung — LUAT §5), giữ hàng giuCho.js.
       - HOP_DONG_API_KH.md PHIEN_BAN 18 (NHOM-MON-1 đang lên 19 song song → việc này lấy số KẾ TIẾP của main lúc gộp, ghi nhật ký). -->

**Chờ duyệt kế hoạch:** viết `viec/TOPPING-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Quầy chọn topping và ghi chú ngay lúc chạm món, đúng danh sách cài cho TỪNG món; giá, giảm hạng, mã / voucher, điểm, kho, hoá đơn, tem, huỷ / hoàn
đều tính cả topping và đều do MÁY CHỦ quyết. Topping còn bán riêng được (tab "Topping"). App KH thấy và đặt được đúng như quầy.

## Nghiệm thu
**A. Bản vẽ trước (CLAUDE.md §9)**
- A0 Sửa `ban_mau_pos/ban_mau_pos.html` theo bản thử đã duyệt (khung chọn món có topping + ghi chú theo món, dòng topping con trong giỏ, tab
  Topping bán riêng, dòng topping trên hoá đơn / tem) + thêm phép thử `ban_mau_pos/thu/thu_topping.js`; `bash ban_mau_pos/chay_thu.sh` đạt hết,
  số phép KHÔNG giảm (ghi số trước / sau). Cập nhật `ban_mau_pos/DAC_TA_BAN_HANG_2410.md` mục 1.7–1.8 (bán riêng, voucher áp topping). Chủ quán
  đã duyệt sửa bản mẫu qua bản thử 26.11 — không hỏi lại.

**B. Dữ liệu & cài đặt**
- B1 Topping = một sản phẩm POS có cờ "là topping" (kiểu kho lam_san, có công thức, lô, hạn). Hai giá: **giá thêm vào ly** (bắt buộc) và **giá bán
  riêng** (trống = không bán riêng). Kế hoạch chọn cột / bảng gọn nhất.
- B2 Mỗi món: danh sách topping được thêm (nhiều-nhiều) + danh sách ghi chú nhanh (chữ, thứ tự). Bỏ `ghiChuMacDinh.js`; bước nâng cấp chép
  sẵn THEO_NHOM hiện có vào ghi chú nhanh của mọi món đang có category 'tea' / 'juice' (để quầy không mất nút ghi chú ngày đầu — K5).
- B3 Màn cài đặt (chủ quán; quản lý xem — theo quyền sửa món hiện có): danh sách topping (ảnh nếu có, tên, giá thêm, giá bán riêng, còn), từng món
  tick topping + sửa ghi chú nhanh, nút "Chép cho cả nhóm". Đặt ở Kho › Sản phẩm & công thức (cùng chỗ sửa món — một món sửa ở MỘT chỗ).

**C. Màn Bán hàng (theo bản thử)**
- C1 Món có topping hoặc ghi chú nhanh → khung chọn món; không có cả hai → chạm là vào giỏ (DAC_TA 1.7, số chạm mục 4 không tăng).
- C2 Khung: ô topping (ảnh / chữ viết tắt, tên, +giá đã giảm hạng), chạm thêm phần (tối đa 3), nút − bớt, hết hàng mờ, còn < 5 phần hiện "còn n";
  ghi chú nhanh của món; ô tự gõ; số ly; "Thêm vào giỏ · <giá>". Chạm dòng giỏ mở lại để sửa / xoá. Cùng món + cùng topping + cùng ghi chú → gộp
  số ly; khác → dòng riêng.
- C3 Giỏ: topping là dòng con dưới món (tên, ×phần, giá); tab "Topping" liệt kê topping có giá bán riêng, chạm là vào giỏ như món.
- C4 Hoá đơn (InPhieu / ManKetThuc, cả bản in lại và hoá đơn App lấy form POS): dòng "+ <topping> x<phần>" dưới món, giá theo cùng cách hiện giá
  hạng của món; tem mỗi ly: topping + ghi chú. Phiếu pha chế (nếu bật 3 tờ) có topping.

**D. Máy chủ (một đường tạo đơn cho quầy và App)**
- D1 Dòng topping gửi lên gắn với dòng món cha (kế hoạch chọn: dòng con `pos_order_items` có cột trỏ dòng cha, hay JSON trên dòng món — chọn cách
  để giảm hạng / voucher / điểm / kho / huỷ / hoàn TỰ ĐÚNG mà không viết đường song song; ghi lý do). Máy chủ TỰ TRA giá topping (CLAUDE §5.1),
  không tin giá màn gửi.
- D2 Chặn (400, mã lỗi tiếng Việt + code): topping không thuộc danh sách của món cha (`TOPPING_KHONG_CHO_MON`); phần ≤ 0 / > 3 / không nguyên
  (`TOPPING_SO_PHAN`); topping đứng một mình mà không có giá bán riêng (`TOPPING_KHONG_BAN_RIENG`); topping ngừng bán / hết (dùng mã hết hàng có sẵn).
- D3 Tiền: giảm hạng áp topping; mã giảm và voucher (tiền và %) áp trên tiền món GỒM topping (chủ quán 26.11), theo đúng luật VOUCHER-2 hiện có
  (một hàm, không chép công thức); giờ Flash áp topping như món (kế hoạch đọc luật Flash hiện có, nói rõ); điểm theo tiền khách trả thật như cũ —
  dòng topping theo cờ tích điểm của chính topping (DIEM-MON-1). Không đổi cách tính khi đơn không có topping (K5).
- D4 Kho: đủ hàng tính TỔNG topping trên cả giỏ (cùng topping ở nhiều dòng), cả lúc giữ hàng phiên chờ trả (giuCho) và lúc tạo đơn; trừ kho
  topping cùng giao dịch với đơn; huỷ đơn trả kho topping; báo hỏng / đền / hoàn một món kéo theo topping của món đó (kế hoạch rà MỌI đường hoàn
  — K4: huỷ, báo sự cố, hoàn một phần, đổi cách trả, đối soát).
- D5 App KH: `GET /api/kh/menu` mỗi món thêm `topping[] { ma, ten, gia, con_hang }` và `ghi_chu_nhanh[]`; topping bán riêng xuất hiện như một món
  (nhóm theo cách NHOM-MON-1 chọn nếu đã gộp, không thì `nhom: 'topping'`). Đơn App gửi topping theo cùng dạng quầy, đi CÙNG hàm kiểm D2–D4.
  `HOP_DONG_API_KH.md` tăng PHIEN_BAN, ghi nhật ký; viết `viec/TOPPING-1/BAO_APPKH.md` (lời thường) để chủ quán chuyển chat App KH.

**Thử**
- `cong_cu/thu_TOPPING1.js` (đỏ trên main): giá 1 ly + 2 phần nếp cẩm × 2 ly đúng số tính tay; khách Vàng 10 % giảm cả topping (số lẻ làm tròn
  như món — so số tính tay, K3 bổ sung 11.11); voucher 20.000đ + voucher 10 % trên đơn có topping; mã giảm %; Flash; điểm chỉ trên tiền thật;
  D2 từng mã lỗi; giá màn gửi sai → máy chủ dùng giá DB; kho: 2 dòng cùng topping tổng vượt tồn → chặn, vừa đủ → qua (ca ngay trên / ngay dưới);
  huỷ đơn trả kho topping; hoàn một món có topping; topping bán riêng 2 phần; đơn App có topping = đơn quầy cùng giỏ (cùng tổng, cùng dòng);
  /api/kh/menu trả topping + ghi chú, topping hết `con_hang: false`; nâng cấp chép ghi chú THEO_NHOM.
- Đột biến (đối chứng xanh): VS-tin-gia-topping-cua-man · VS-bo-giam-hang-topping · VS-voucher-bo-topping · VS-topping-ngoai-danh-sach-lot ·
  VS-qua-3-phan-lot · VS-kho-dem-tung-dong · VS-huy-khong-tra-topping · VS-ban-rieng-khi-khong-gia · BV-bo-kiem-topping-app.
- K5 phải KHÔNG bị chặn: đơn không topping (mọi bài thử tiền cũ xanh: thu_P26c, thu_VOUCHER2, thu_DIEMMON1, thu_KHO3a, gia_lap…); món không có
  cài đặt nào chạm là vào giỏ; đơn cũ trên production (không dòng topping) in lại / huỷ / hoàn như cũ; App KH bản cũ không gửi topping vẫn đặt được.
- `npm test`, `--day-du` xanh; `node tu_chay/cong.js chay` ĐẠT. 3 thao tác cho chủ quán thử tay trên máy tính bảng và điện thoại.

## Phạm vi
- viec/TOPPING-1/**
- ban_mau_pos/ban_mau_pos.html
- ban_mau_pos/DAC_TA_BAN_HANG_2410.md
- ban_mau_pos/thu/thu_topping.js
- ban_mau_pos/chay_thu.sh
- server/routes/orders.js
- server/routes/products.js
- server/routes/kh/index.js
- server/utils/donApp.js
- server/utils/giuCho.js
- server/utils/*.js
- server/kho/**
- server/nang_cap/036_topping.js
- server/nang_cap/chay.js
- server/routes/backup.js
- server/utils/chuanHoaGio.js
- client/src/pages/BanHang/**
- client/src/pages/Kho/**
- client/src/components/InPhieu.jsx
- client/src/utils/api.js
- client/dist/**
- HOP_DONG_API_KH.md
- cong_cu/thu_TOPPING1.js
- cong_cu/thu_*.js
- cong_cu/gia_lap/**
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~600 dòng code (máy chủ ~300 · màn ~300) + ~500 dòng thử. Vượt 1,5 lần thì giải thích.
**Phương án đơn giản nhất đã xét:** topping là sản phẩm POS bình thường (đã có giá, kho, công thức, tích điểm) + liên kết món ↔ topping + dòng con
trong đơn → giảm hạng / voucher / điểm / kho / huỷ đi qua đường sẵn có. Ảnh món / topping KHÔNG làm ở đây (việc ANH-MON-1) — màn hiện chữ viết
tắt màu khi chưa có ảnh, như bản thử.

## Đổi cấu trúc DB
có — chỉ THÊM, bước `server/nang_cap/036_topping.js`: cờ topping + giá bán riêng, bảng món ↔ topping, ghi chú nhanh theo món, liên kết dòng
topping ↔ dòng món trong pos_order_items (kế hoạch chọn). Bảng mới vào danh sách sao lưu.

## Thư viện mới
không

## Soát bảo mật
có — đường tiền (giá, giảm, voucher, điểm), cửa công khai /api/kh/menu và đơn App.

## Cấm
- KHÔNG đổi luật tiền đã chốt ngoài việc tính thêm topping (giảm hạng, VOUCHER-2, Flash, điểm thật, không công nợ).
- KHÔNG làm ảnh món (ANH-MON-1), không làm combo (COMBO-1a/1b).
- NHOM-MON-1 có thể gộp trước và đã sửa tab nhóm trong BanHangMoi.jsx: bắt đầu từ main mới nhất; nếu chưa gộp, sửa BanHangMoi.jsx tối thiểu,
  ghi Phát hiện để chat gộp.
