# KHO-2b — Kho POS phần 2b: đặt hàng có duyệt theo hạn mức · nhận hàng (theo đơn / mua lẻ) có người khác duyệt · xử lý phát sinh 4 bước

<!-- Phiếu do chat soạn 31.10.2026. Việc [T] (tiền nhập + số kho) — Opus làn 2, lập kế hoạch, DỪNG chờ duyệt. Nền: main sau sổ v49 (KHO-1,
     KHO-2a, KHACH-CK-1 đã gộp). Yêu cầu chủ quán 26–29.10 (QUYET_DINH_CHU_QUAN.md mục Kho; sổ việc dòng KHO-2b): đơn đặt hàng thêm theo công
     thức (nhập số phần → kg từng nguyên liệu) hoặc từng nguyên liệu, đơn chỉ ghi trọng lượng cuối từng mục; nhân viên tạo → quản lý duyệt,
     quản lý tự duyệt dưới hạn mức (mặc định 500.000đ, ô Cài đặt), trên hạn mức → chủ quán; nhận theo đơn (bảng tick, "Nhận đủ tất cả", sửa
     số thực nhận — dòng lệch tô vàng, thêm dòng ngoài đơn, chụp hoá đơn); mua lẻ (khung "Đã chọn" ở trên + ô chạm: tab "Sắp hết & hay mua",
     tab nhóm, gõ tên lọc — KHÔNG một danh sách dài); phiếu nhận cần người KHÁC người tạo duyệt mới cộng kho; xử lý phát sinh 4 bước (Chuyện gì
     xảy ra? → Món nào? chỉ hiện thứ liên quan → Bao nhiêu? → Xem phiếu trước khi in / gửi), hạn mức dùng nội bộ theo người / ca. Mọi thao tác
     phải gọn — quán bận không đứng lâu; danh tính lấy từ đăng nhập (không ô chọn người, không PIN riêng).
     Hiện trạng chat đọc 31.10 trên main 4b52370:
     - Bảng (bước 001): kho_phieu.loai CHECK ('DH','PN','PS','KK','PX'), trang_thai ('nhap','cho_duyet','da_duyet','huy'), nha_cung_cap_id,
       thay_cho_id; kho_lo (so_luong lúc vào, han_dung, gia_von, phieu_id); kho_phieu_dong (so_luong có dấu, don_gia, lo_id). Bước 002 thêm
       so_lan_in, ma_gui (bấm hai lần ra một phiếu — chỉ mục duy nhất), nguoi_huy / huy_luc, kho_phieu_dong.loai (KHÔNG CHECK — thêm loại
       dòng chỉ trong code), cho_mon_id, nguoi, luc.
     - Máy chủ: server/kho/duong.js (quyền QUAN_LY / CHU_QUAN / NHAN_VIEN, phiếu xuất PX: tạo / in / duyệt / từ chối / kết quả / huỷ / sửa
       ~234–286; tồn ~286), duLieu.js (ghi phiếu PX ~151–260, dsPhieu ~298), tinh.js (soPhieuKe ~104, boGia — nhân viên không thấy giá).
       Cài đặt khoá `kho_*` chỉ chủ quán đổi (routes/settings.js ~103–117).
     - Giao diện: client/src/pages/Kho/** (index.jsx tab Pha chế · Tồn kho · Phiếu (huy hiệu chờ duyệt, hỏi 30 s) · Nguyên liệu · Sản phẩm &
       công thức · Định mức · Nhập từ SX; XemPhieu.jsx in phiếu; kho.css, inPhieuKho.css).
     - Bước nâng cấp: main có 001–004; KH-SP-1 giữ 005, KH-MUA-1 giữ 006 → bước của việc này là **007** (nếu cần).
     - Ảnh hoá đơn: máy Render KHÔNG giữ file trên đĩa (khởi động lại là mất); ảnh món đã hoãn sau khai trương vì cần chỗ lưu ngoài (KH-SP-2).
       Kế hoạch đề xuất cách lưu ảnh hoá đơn nhập (vd ảnh nén nhỏ trong CSDL) hoặc hoãn — ghi `## Câu hỏi`, chủ quán quyết lúc duyệt.
     Báo cáo cho chủ quán theo LUAT §8. -->

**Chờ duyệt kế hoạch:** viết `viec/KHO-2b/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Nhập hàng có kiểm soát (đặt → duyệt → nhận → người khác duyệt mới cộng kho) và xử lý hao hụt / dùng nội bộ có log, nhanh trên điện thoại.

## Nghiệm thu
- A **Đơn đặt hàng (DH):** thêm theo công thức (nhập số phần → lượng từng nguyên liệu nhảy theo, gộp nguyên liệu trùng) hoặc từng nguyên
  liệu; phiếu đơn cuối chỉ ghi lượng từng mục (không công thức), giá ước tính theo giá nhập. Nhân viên tạo → chờ duyệt; quản lý tạo / duyệt
  được khi tổng ≤ hạn mức (Cài đặt `kho_han_muc_dat_hang`, mặc định 500.000đ, chỉ chủ quán đổi), trên hạn mức → chỉ chủ quán duyệt. Đơn
  KHÔNG đổi tồn. In / xem trước khi gửi nhà cung cấp.
- B **Nhận theo đơn (PN):** mở đơn đã duyệt → bảng tick từng dòng, nút "Nhận đủ tất cả", sửa số thực nhận (dòng lệch tô vàng), thêm dòng
  ngoài đơn, hạn dùng từng lô (nguyên liệu có hạn), giá nhập thật. Phiếu nhận chờ người KHÁC người tạo duyệt (chủ quán / quản lý) → khi
  duyệt mới tạo lô + cộng kho (một giao dịch); từ chối có lý do. Đơn nhận đủ → đơn đóng; nhận thiếu → còn mở phần thiếu.
- C **Mua lẻ (PN không đơn):** khung "Đã chọn" ở trên; chọn bằng ô chạm theo tab "Sắp hết & hay mua" / tab nhóm / gõ tên lọc — không một
  danh sách dài; cùng luật duyệt người khác như B.
- D **Xử lý phát sinh (PS) 4 bước:** Chuyện gì xảy ra? (hỏng / đổ vỡ / hết hạn / dùng nội bộ / khác) → Món nào? (chỉ hiện thứ liên quan:
  hết hạn → lô sắp / đã hết hạn; nội bộ → thành phẩm / đồ uống) → Bao nhiêu? → Xem phiếu trước khi in / gửi. Trừ kho theo lô (hết hạn trước,
  FEFO). Hạn mức dùng nội bộ theo người / ca (Cài đặt, chỉ chủ quán đổi): vượt → cần quản lý / chủ quán duyệt; trong hạn mức → theo công tắc
  duyệt hiện có. Mọi phiếu PS có log người / giờ / lý do.
- E **Bấm hai lần ra một phiếu** (ma_gui như PX) cho DH, PN, PS; số phiếu theo soPhieuKe; nhân viên không thấy giá (boGia); sửa / huỷ phiếu đã
  duyệt chỉ chủ quán, có lý do, phiếu cũ giữ (như PX).
- F **Tồn đúng:** tồn = Σ dòng phiếu đã duyệt (như KHO-2a); bài thử đếm tồn trước–sau từng loại phiếu, kể cả huỷ / sửa / từ chối / duyệt hai
  lần cùng lúc (đúng một lần cộng).
- G **Màn hình:** tab Kho thêm việc hay dùng lên trước (Nhận hàng, Phát sinh) và việc ít dùng sau (Đặt hàng); điện thoại 360–430 px không
  tràn; huy hiệu chờ duyệt gồm cả DH / PN / PS (cùng một vòng hỏi 30 s).
- H **K5:** pha chế, phiếu xuất PX, tồn, nguyên liệu, công thức, nhập từ SX, bán hàng, sao lưu / khôi phục (bảng kho không chép đè) y như cũ.

## Phạm vi
- viec/KHO-2b/**
- server/kho/**
- server/nang_cap/**
- server/routes/settings.js
- client/src/pages/Kho/**
- client/src/pages/Settings.jsx
- client/dist/**
- cong_cu/thu_KHO2b.js
- cong_cu/thu_KHO1.js
- cong_cu/thu_KHO2a.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHO2b.js` ĐỎ trên code gốc: DH theo công thức ra đúng lượng gộp; quản lý duyệt ≤ hạn mức được, > hạn mức → 403; DH
không đổi tồn; PN chỉ cộng kho khi người KHÁC duyệt (chính người tạo → 403), lô có hạn + giá; nhận thiếu giữ phần còn lại; PS hết hạn trừ
đúng lô FEFO; vượt hạn mức nội bộ → chờ duyệt; bấm hai lần một phiếu; duyệt song song cộng đúng một lần; nhân viên không thấy giá.

## Ngân sách
~400 dòng máy chủ + ~450 dòng giao diện + ~500 dòng thử.
**Phương án đơn giản nhất đã xét:** dùng lại kho_phieu / kho_phieu_dong / kho_lo với loại DH, PN, PS đã có trong CHECK; loại dòng mới chỉ
trong code; khoá Cài đặt `kho_*` sẵn có cho hạn mức; không bảng mới trừ khi kế hoạch chứng minh cần.

## Đổi cấu trúc DB
có thể — chỉ khi cần (vd liên kết dòng nhận với dòng đơn, ảnh hoá đơn): bước 007, chỉ THÊM qua `themCot`, chịu được kho thử thiếu bảng.

## Thư viện mới
không

## Cấm
- KHÔNG đổi luồng PX (phiếu xuất), pha chế, định mức, công thức, nhập từ SX; KHÔNG trừ kho khi bán (KHO-3); KHÔNG sửa orders.js.
- KHÔNG đổi số tồn ngoài phiếu đã duyệt; KHÔNG xoá phiếu / lô.
- KHÔNG lưu file ảnh trên đĩa máy Render.
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/KHO-2b`. Không đụng main, không merge,
  không tạo PR.
