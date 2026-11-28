# KHO-GON-1 — Việc hôm nay ở đầu Kho: việc cố định + phát sinh, nhận bàn giao đầu ngày / kiểm kê cuối ngày, chỉnh tồn tay, diễn biến cho chủ quán

<!-- Phiếu do chat POS soạn 26.11.2026 (bàn 41, main acc88921). Máy: Claude Code · OPUS.
     Đụng SỐ TỒN KHO (phiếu KK, chỉnh tay) → "Chờ duyệt kế hoạch"; chat soát kế hoạch trong ngày.
     Chủ quán duyệt bản thử 26.11 14:05 ("đồng ý"): https://claude.ai/artifact/YQMpwLWVCucKF6EbcHTnPv (bản 1795666795-8373).
     Bản thử = HÀNH VI đã chốt, không chép mã (dữ liệu giả, không gọi API). Bản HTML để ở viec/KHO-GON-1/ban_thu_kho.html (chat chép vào).

     CHAT ĐÃ ĐỌC (main acc88921):
       - client/src/pages/Kho/index.jsx 1–98: 11 tab, tab đầu 'pc' Pha chế; huy hiệu chờ duyệt hỏi 30 s.
       - server/nang_cap/001_kho.js 73–87: kho_phieu.loai CHECK ('DH','PX','PN','PS','KK') — KK đã có trong CHECK nhưng CHƯA có đường tạo
         (server/kho/duong.js 257: TAO chỉ có DH / PN / PS). kho_phieu có ly_do, ghi_chu, nguoi_tao, trang_thai.
       - 001_kho.js 24–41: kho_nguyen_lieu.ton_toi_thieu ĐÃ CÓ (ngưỡng cảnh báo) — DÙNG LẠI, không thêm cột ngưỡng mới.
       - kho_lo: còn lại = Σ dòng phiếu đã duyệt theo lo_id (001 dòng 87). Chỉnh tồn = dòng phiếu ± theo lô (FEFO cho −; lô mới cho +).
       - server/utils/helpers.js getNow (giờ VN) — mọi giờ ghi / so qua getNow (LUAT §2). -->

**Chờ duyệt kế hoạch:** viết `viec/KHO-GON-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Mở Kho là thấy ngay **Việc hôm nay**: danh sách việc theo thứ tự do chủ quán / quản lý cài (nhận bàn giao, pha sẵn, chuẩn bị, gọi đá…), việc phát
sinh thêm trong ngày, cảnh báo nguyên liệu dưới ngưỡng. Hai lần kiểm mỗi ngày: **cuối ngày chốt kiểm kê**, **sáng hôm sau nhận bàn giao** so với
đúng số tối qua chốt, có ghi chú. Chủ quán / quản lý thấy "Diễn biến hôm nay" (ai xong việc gì, lúc nào, lệch gì). Chủ quán (và quản lý nếu được
cấp quyền) chỉnh tồn tay khi cần nhanh, có lý do + nhật ký + cảnh báo. Quán đang 1 nhân viên cả ngày — phải chạy đúng với 1 ca, bật 2 ca sau.

## Nghiệm thu
**A. Việc cố định (Cài đặt — chủ quán / quản lý)**
- A1 Danh sách mẫu việc có thứ tự: tên, giao cho (`nv` nhân viên · `sang` · `toi` · `ql` quản lý · `tat_ca`), giờ hạn (không bắt buộc, "HH:mm"),
  loại (`thuong` · `bangiao` · `phache` · `kiemke`). Thêm, Sửa (tên / giao cho / giờ), Lên / Xuống, Xoá (chỉ loại `thuong`; ba loại đặc biệt
  sửa được, không xoá được). Mặc định cài sẵn: 1 Nhận bàn giao (bangiao, trước 08:00) · 2 Pha sẵn theo định mức (phache) · 3 Kiểm kê & chốt
  cuối ngày (kiemke, cuối danh sách).
- A2 Cài đặt "Số ca": 1 (mặc định) hoặc 2. Một ca: mọi việc không phải `ql` hiện cho nhân viên đang đăng nhập. Hai ca: nhân viên chọn ca lúc
  vào màn (nhớ trong ngày trên máy đó); việc `sang` / `toi` chỉ hiện cho ca đó, `nv` / `tat_ca` hiện cho cả hai. Chủ / quản lý thấy hết.
- A3 Danh sách việc của MỘT ngày (giờ VN) sinh từ mẫu khi lần đầu có người mở trong ngày đó — một lần, không nhân đôi khi hai máy mở cùng lúc
  (khoá trong câu ghi / UNIQUE ngày + mẫu). Sửa mẫu áp dụng từ ngày sau (ngày đã sinh giữ nguyên).

**B. Màn Việc hôm nay (tab ĐẦU của Kho, mọi vai trò)**
- B1 Danh sách việc theo thứ tự, số thứ tự, giờ hạn ("trước 08:00"; quá giờ chưa xong → chữ đỏ "quá giờ", so bằng giờ VN máy chủ trả), giao
  cho ai, người tạo nếu phát sinh. Việc `thuong`: nút Xong. Việc đặc biệt: nút Làm mở thẳng màn tương ứng; xong màn đó thì việc tự xong.
- B2 "+ Việc phát sinh": gõ tên (có 4 gợi ý nhanh: Hết đá — gọi đá · Gọi thêm đường · Máy xay kêu — báo sửa · Khách đặt nhiều — pha thêm),
  giao cho (nhân viên mặc định chính mình). Ai đăng nhập cũng thêm được; chỉ có trong ngày đó.
- B3 Dải cam "Nguyên liệu dưới ngưỡng" (tồn < ton_toi_thieu, nguyên liệu đang dùng): mỗi thứ một nút "Giao việc gọi thêm <tên>" → thêm việc phát
  sinh giao `ql` gắn nguyen_lieu_id; đã có việc chưa xong cho thứ đó thì hiện "đã giao" thay nút. Lưu phiếu Nhận hàng có thứ đó → việc tự xong.
- B4 Đánh dấu xong ghi người + giờ; KHÔNG bỏ đánh dấu (tránh sửa lịch sử) — trừ chủ quán (bấm lại = mở lại, có ghi nhật ký).
- B5 Chủ / quản lý thấy khung "Diễn biến hôm nay": mỗi dòng giờ · việc · chi tiết · người (xong việc, nhận ca, chốt, pha chế, nhận hàng, phát
  sinh, thêm việc phát sinh, chỉnh tồn tay). Dòng có lệch / phát sinh / chỉnh tay tô cam. Số dòng chưa xem hiện ở nút tab "Việc hôm nay" và khung;
  nút "Đã xem" đánh dấu đã xem CHO NGƯỜI ĐÓ (chủ và quản lý xem riêng). Hỏi lại số chưa xem dùng chung vòng hỏi 30 s đang có (index.jsx), không
  thêm vòng hỏi thứ hai.
- B6 Khung "Cần chú ý" (chủ / quản lý) gom: món đang bán mà quầy không bán được (dùng LẠI `banHang.monChuaSan` / hàm đang có, không viết phép
  mới) + các lệch kiểm kê / bàn giao / chỉnh tay chưa xem.

**C. Kiểm kê cuối ngày & Nhận bàn giao đầu ngày (một màn, hai chế độ)**
- C1 Danh sách kiểm = mọi thành phẩm làm sẵn (lam_san) có lô còn + nguyên liệu tick "Kiểm hằng ngày" (cột mới, mặc định 0; tick ở Cài đặt ›
  Ngưỡng & kiểm kê, cùng chỗ sửa ton_toi_thieu). Không đếm cả kho.
- C2 Kiểm kê cuối ngày: mỗi dòng "Máy ghi <tồn>" + ô Thực tế (trống = đúng như máy) + ô Ghi chú. Ghi chú chung "cho ca sau". Bấm "Chốt & in":
  một phiếu **KK** (đã duyệt ngay), dòng ± cho mỗi chỗ lệch (FEFO khi trừ; khi cộng thành phẩm / nguyên liệu → lô mới hạn theo han_ngay / hạn
  món, ghi_chu "kiểm kê"), lưu ẢNH CHỐT: số tồn từng thứ sau chốt + ghi chú. In bảng có chỗ ký (dùng khung in phiếu kho sẵn có).
- C3 Nhận bàn giao: dòng hiện "Chốt <số tối qua chốt>" (từ ảnh chốt gần nhất; chưa có chốt → số máy, ghi rõ). Ô Thực tế trống = đúng. Có lệch
  → phiếu **KK** điều chỉnh về số thực tế + cảnh báo. Đầu màn hiện "Ca trước dặn: …" (ghi chú của lần chốt). Nút "Nhận ca — đúng hết" khi không lệch.
- C4 Dòng lệch BẮT BUỘC ghi chú (máy chủ kiểm, không chỉ màn hình) → 400 `KHO_THIEU_GHI_CHU`. Dòng không lệch có ghi chú vẫn lưu ghi chú.
- C5 Giữa lúc chốt (hoặc nhận) và lúc lưu, tồn đổi (vừa bán) → máy chủ tính lệch theo số "Máy ghi / Chốt" MÀ MÀN ĐÃ THẤY (gửi kèm) hay theo số
  hiện tại? Kế hoạch chọn và nêu lý do; bắt buộc: không được tạo lệch giả vì một ly vừa bán (kiểm bằng ca thử).
- C6 Nhân viên lưu được KK của bàn giao / kiểm kê (đã duyệt ngay, ghi nhật ký) — đây là việc hằng ngày, không chờ duyệt.

**D. Chỉnh tồn tay**
- D1 Ở chi tiết một thứ trong Tồn kho: nút "Chỉnh tồn tay" — chủ quán luôn được; quản lý chỉ khi chủ quán bật cài đặt "Cho quản lý chỉnh tồn
  tay" (mặc định tắt); nhân viên không (máy chủ trả 403). Nhập số đang có thật + lý do bắt buộc → phiếu KK một dòng, ly_do, tô cam trong Diễn
  biến + Cần chú ý.
- D2 Không ghi tồn âm: số mới < 0 → 400.

**E. Giữ nguyên**
- E1 Pha chế, Nhận hàng, Phát sinh, Đặt hàng, Phiếu, duyệt / từ chối, bán trừ kho (KHO-3a) KHÔNG đổi hành vi (KHO-GON-2 làm lại màn Pha chế /
  Nhận hàng). Chỉ thêm: các đường này gọi "ghi diễn biến" + tự đánh dấu việc tương ứng xong (phache khi lưu phiếu xuất pha chế; việc gọi hàng khi
  Nhận hàng có thứ đó).
- E2 Tab Kho mới thứ tự: Việc hôm nay · Pha chế · Nhận hàng · Phát sinh · Tồn kho · Phiếu · … (các tab còn lại giữ). Cài đặt việc / ca / kiểm
  hằng ngày ở MỘT tab "Cài đặt kho" (chủ / quản lý), không thêm trang mới ngoài Kho.

**Thử**
- Bài `cong_cu/thu_KHOGON1.js` (đỏ trên main acc88921): sinh việc 1 lần / ngày (2 lần gọi song song → 1 bộ); 1 ca vs 2 ca ai thấy gì; quá giờ
  (19:59 vs 20:00 vs 20:01 so với "20:00"); xong việc tự từ kiểm kê / bàn giao / pha chế / nhận hàng; KK: lệch +, lệch −, không lệch, lệch không
  ghi chú → 400, số âm → 400, bán 1 ly giữa lúc mở và lưu (C5) không tạo lệch giả; bàn giao so đúng ảnh chốt tối qua, chưa có chốt → so máy;
  chỉnh tay: chủ 200, quản lý 403 khi tắt / 200 khi bật, nhân viên 403; chưa xem tách riêng chủ và quản lý; ngày VN (23:59 vs 00:00 giờ VN trên
  máy UTC — K7).
- Đột biến (có đối chứng xanh): VS-sinh-viec-2-lan · VS-ca-toi-thay-viec-sang · VS-qua-gio-lech-1 · VS-lech-khong-ghi-chu-lot ·
  VS-ql-chinh-tay-khi-tat · VS-so-voi-may-thay-chot · VS-lech-gia-khi-vua-ban · BV-bo-kiem-quyen-chinh-tay.
- K5 phải KHÔNG bị chặn: kiểm kê không lệch dòng nào (phiếu KK không dòng hoặc không tạo phiếu — kế hoạch chọn, nhưng việc vẫn xong); quán 1 ca
  một người làm cả bangiao và kiemke; dữ liệu thật hiện có (chưa có mẫu việc, chưa có ảnh chốt, ton_toi_thieu NULL) mở màn không lỗi; Pha chế /
  Nhận hàng / bán trừ kho chạy như cũ (bài thử KHO-1/2a/2b/3a cũ xanh).
- `npm test`, `--day-du` xanh; `node tu_chay/cong.js chay` ĐẠT. Giao diện: 3 thao tác cho chủ quán thử tay trên điện thoại (màn hẹp 390 px:
  dòng kiểm kê một thẻ gọn, nút Chốt / Nhận ca dính đáy màn — xem bản thử).

## Phạm vi
- viec/KHO-GON-1/**
- server/kho/**
- server/nang_cap/033_viec_kho.js
- server/nang_cap/chay.js
- server/routes/backup.js
- server/utils/chuanHoaGio.js
- client/src/pages/Kho/**
- client/dist/**
- cong_cu/thu_KHOGON1.js
- cong_cu/thu_KHO1.js
- cong_cu/thu_KHO2a.js
- cong_cu/thu_KHO2b.js
- cong_cu/thu_KHO3a.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~450 dòng code (máy chủ ~250 · màn ~200) + ~450 dòng thử. Vượt 1,5 lần thì giải thích.
**Phương án đơn giản nhất đã xét:** dùng LẠI phiếu KK có sẵn trong CHECK cho cả kiểm kê, bàn giao và chỉnh tay (không thêm loại phiếu); dùng lại
ton_toi_thieu làm ngưỡng; nhật ký diễn biến là một bảng dòng chữ (không thêm hệ thông báo). Báo về điện thoại (Telegram) KHÔNG làm ở đây.

## Đổi cấu trúc DB
có — chỉ THÊM, bước `server/nang_cap/033_viec_kho.js`: bảng mẫu việc, bảng việc theo ngày (UNIQUE ngày + mẫu cho việc cố định), bảng diễn biến
(+ đã xem theo người), bảng / cột ảnh chốt kiểm kê (kế hoạch chọn gọn nhất), cột `kho_nguyen_lieu.kiem_hang_ngay INTEGER NOT NULL DEFAULT 0`;
cài đặt số ca + cho quản lý chỉnh tay đặt ở bảng cài đặt sẵn có. Bảng mới thêm vào danh sách sao lưu (backup.js) và chuanHoaGio nếu có cột giờ.

## Thư viện mới
không

## Soát bảo mật
có — quyền mới (chỉnh tồn tay theo vai trò + cài đặt), nhân viên ghi phiếu KK đã duyệt ngay.

## Cấm
- KHÔNG đổi đường bán trừ kho (server/kho/banHang.js) ngoài việc đọc; KHÔNG đổi tiền, đơn, giá.
- KHÔNG làm lại màn Pha chế / Nhận hàng (việc KHO-GON-2); chỉ thêm gọi ghi diễn biến / đánh dấu việc xong.
- KHÔNG gửi tin ra ngoài (Telegram, Zalo, email).
- KHÔNG làm nhóm món (bản thử có màn Cài đặt › Nhóm món — đó là việc NHOM-MON-1, chạy song song).
- KHÔNG sửa client/src/pages/BanHang/** (TOPPING-1 sắp làm lại màn bán hàng).
