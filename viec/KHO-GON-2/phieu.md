# KHO-GON-2 — Pha chế theo danh mục (− / +, tối đa theo kho, đun theo nồi) và Nhận hàng gọn có chụp hoá đơn

<!-- Phiếu do chat POS soạn 26.11.2026 (bàn 41, main acc88921). Máy: Claude Code · OPUS. LÀM SAU KHO-GON-1 (cùng máy, cùng vùng
     client/src/pages/Kho/ — bắt đầu từ main ĐÃ có KHO-GON-1; nếu KHO-GON-1 chưa merge thì DỪNG hỏi, đừng làm song song).
     Việc giao diện kho + một cột / một bảng ảnh → chạy thẳng, KHÔNG chờ duyệt kế hoạch (LUAT §7); đột biến cho phần máy chủ.
     Chủ quán duyệt bản thử 26.11 14:05: https://claude.ai/artifact/YQMpwLWVCucKF6EbcHTnPv (bản 1795666795-8373) — màn Pha chế, Nhận hàng.
     Bản HTML ở viec/KHO-GON-2/ban_thu_kho.html. Chép HÀNH VI, không chép mã.

     CHAT ĐÃ ĐỌC (main acc88921):
       - client/src/pages/Kho/PhaChe.jsx (76 dòng), NhanHang.jsx (109), ChonNguyenLieu.jsx; server/kho/duong.js 213 GET /pha-che, 244 POST /phieu-xuat,
         257–260 TAO PN (nhapHang.taoPhieuNhan).
       - 001_kho.js 55–62: kho_cong_thuc lượng cho 1 đơn vị (REAL), thanh_phan_id = sản phẩm con (gói định lượng) → món đun nồi ĐÃ biểu diễn được
         bằng thành phần = gói, lượng = 1 / số ly mỗi nồi. Thiếu: số ly mỗi mẻ + chữ "+ 5 L nước" để màn tính theo NỒI.
       - server/index.js 81: express.json limit 5mb; multer đã dùng ở duong.js 150 (nhập SX). -->

## Mục tiêu
Nhân viên pha chế trên điện thoại không phải gõ, không phải tính: máy tick sẵn món dưới định mức, bấm − / + đổi số, thấy ngay "tối đa theo kho",
vượt thì đỏ và không in được. Món đun theo nồi (trà từ gói định lượng 5 L / 10 L) chọn theo SỐ NỒI. Nhận hàng gọn một dòng một thứ, chụp được ảnh
hoá đơn (tự thu nhỏ, không tốn dung lượng).

## Nghiệm thu
**A. Pha chế**
- A1 Danh sách món làm sẵn (lam_san) có công thức. Món dưới định mức hôm nay tick sẵn, số điền sẵn = số còn thiếu (theo nồi nếu món đun nồi, làm
  tròn LÊN). Lọc nhóm: chỉ hiện nút nhóm có món làm sẵn; chỉ 1 nhóm thì không hiện hàng nút.
- A2 Mỗi dòng: tick · tên (bấm mở / đóng định lượng ngay dưới) · "Có <tồn> · tối đa <n>" · nút − [số] +. "Tối đa" = MỘT hàm máy chủ (dùng lại
  phép tính thiếu nguyên liệu đang có ở tinh.js / phieu-xuat, không chép công thức — LUAT §2) trả về cùng GET /pha-che.
- A3 Tổng nhiều món cùng dùng một nguyên liệu vượt tồn → chân màn hiện "Thiếu: <nl> (cần x, có y)", nút "Xem phiếu & in" khoá; một món vượt tối
  đa → dòng đỏ "Vượt — kho chỉ đủ n". Máy chủ VẪN chặn như cũ (không tin màn hình).
- A4 Món đun nồi: cài ở Sản phẩm & công thức hai trường mới **"Mỗi mẻ ra" (số đơn vị)** và **"Ghi chú mẻ"** (vd "+ 5 L nước"). Có "Mỗi mẻ ra" →
  màn Pha chế nhập theo nồi, gửi máy chủ số đơn vị = nồi × mỗi mẻ ra (hoặc gửi số nồi — kế hoạch chọn MỘT, máy chủ tự nhân); định lượng hiện
  "1 nồi = 1 <gói> + 5 L nước → ra 25 ly"; phiếu in ghi số nồi và số ly. Không cài → như cũ theo đơn vị.
- A5 Phiếu xem trước / in: tổng lấy từ kho + chi tiết từng món (định lượng nhân số), chỗ ký Người pha / Quản lý — như phiếu in hiện có, thêm dòng nồi.

**B. Nhận hàng**
- B1 Mỗi nguyên liệu một dòng: tick · tên · "Có <tồn>" (đỏ "thấp" khi dưới ton_toi_thieu) · ô số khi tick. Ô tìm. Gợi ý nhập hiện có giữ nguyên.
- B2 Nút "Chụp hoá đơn" (`accept="image/*" capture="environment"`). Màn THU NHỎ trước khi gửi: cạnh dài ≤ 1280 px, JPEG chất lượng 0,6 (hằng số có
  tên một chỗ); hiện "≈ <KB> (gốc <MB>)". Không bắt buộc.
- B3 Máy chủ nhận ảnh cùng (hoặc ngay sau) lưu phiếu PN: kiểm kiểu thật là JPEG / PNG / WebP (đọc byte đầu, không tin đuôi / mimetype), ≤ 400 KB
  sau thu nhỏ (quá → 413 `ANH_QUA_LON`), lưu gắn phiếu (bảng ảnh riêng, BLOB hoặc base64 — kế hoạch chọn, không ghi file đĩa Render vì mất khi
  deploy). Một phiếu tối đa 3 ảnh.
- B4 Xem ảnh ở chi tiết phiếu (XemPhieu): người xem được phiếu thì xem được ảnh; không có đường đọc ảnh nào bỏ qua kiểm quyền phiếu.
- B5 Ảnh KHÔNG vào sao lưu Excel hằng ngày (nặng) — kế hoạch ghi cách sao lưu ảnh (đề xuất: bỏ qua, ghi Phát hiện).

**C. Điện thoại**
- C1 Màn hẹp 390 px: mỗi món / nguyên liệu gói trong 1–2 dòng, ô số + nút − / + đủ to (≥ 40 px), thanh nút chính dính đáy, không tràn ngang.
  Theo bản thử.

**Thử**
- `cong_cu/thu_KHOGON2.js` (đỏ trên main có KHO-GON-1): tối đa theo kho (1 nguyên liệu, 2 nguyên liệu, món dùng gói, gói hết → 0); tổng nhiều món
  vượt → máy chủ chặn; món nồi: 2 nồi × 25 = 50 ly vào lô, trừ 2 gói; không cài mẻ → như cũ; ảnh: JPEG thật 200 KB nhận, file đổi đuôi .jpg mà
  byte là PDF → 400, 401 KB → 413, 4 ảnh → 400; nhân viên khác vai trò không xem được ảnh phiếu không được xem phiếu.
- Đột biến: VS-toi-da-bo-1-nguyen-lieu · VS-noi-khong-nhan · VS-anh-tin-duoi-file · VS-anh-khong-gioi-han · BV-bo-kiem-quyen-xem-anh.
- K5 phải KHÔNG bị chặn: món làm sẵn không có mẻ; phiếu xuất pha chế cũ (đơn vị) từ máy cũ chưa tải lại; Nhận hàng không ảnh; ảnh PNG từ máy tính.
- `npm test`, `--day-du` xanh; `node tu_chay/cong.js chay` ĐẠT. 3 thao tác cho chủ quán thử tay trên điện thoại.

## Phạm vi
- viec/KHO-GON-2/**
- server/kho/**
- server/nang_cap/034_kho_me_anh.js
- server/nang_cap/chay.js
- server/utils/chuanHoaGio.js
- client/src/pages/Kho/**
- client/dist/**
- cong_cu/thu_KHOGON2.js
- cong_cu/thu_KHOGON1.js
- cong_cu/thu_KHO2a.js
- cong_cu/thu_KHO2b.js
- cong_cu/thu_KHO3a.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~300 dòng code + ~300 dòng thử.
**Phương án đơn giản nhất đã xét:** món đun nồi = công thức thành phần gói đã có + hai trường mẻ (không thêm khái niệm "nồi" riêng); ảnh thu nhỏ ở
máy người dùng, máy chủ chỉ kiểm và lưu.

## Đổi cấu trúc DB
có — chỉ THÊM, bước `server/nang_cap/034_kho_me_anh.js`: `kho_san_pham.me_ra REAL` (NULL = không theo mẻ), `kho_san_pham.me_ghi TEXT`, bảng ảnh
phiếu (phieu_id, kiểu, dữ liệu, cỡ, tạo_lúc).

## Thư viện mới
không

## Soát bảo mật
có — nhận file ảnh từ người dùng (kiểu, cỡ, quyền xem).

## Cấm
- KHÔNG đổi đường bán trừ kho, tiền, đơn.
- KHÔNG sửa client/src/pages/BanHang/**.
