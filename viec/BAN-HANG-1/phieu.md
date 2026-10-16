# BAN-HANG-1 — Quầy: bỏ chọn khách thì gỡ gói khỏi giỏ; cổng mua thẻ cùng khuôn cổng gói; token mặc định 30 ngày

<!-- Phiếu do chat soạn 15.10.2026. Nền: main sau sổ việc v32 (cha 142d5e5 = sổ v31 trên 31a5810 Merge PR #21 SO-LUONG-1). Song song
     AUDIT-3 và TU-CHAY-6 — không chung file. Nguồn: viec/SO-LUONG-1/trang_thai.md (hai đề xuất ngoài Phạm vi, chủ quán duyệt 15.10);
     sổ việc DANG-NHAP-1 (chủ quán chọn A 15.10: từ khi đặt JWT_EXPIRES_IN=30d trên Render 12.10 không còn bị văng → chỉ giữ 1 dòng mặc
     định, phần AuthContext BỎ). Code đã đọc: Sales.jsx:384–392 handleClearCustomer (không gỡ gói is_pkg), :486 addPkgToCart bắt chọn
     khách, :751 gửi membership_buy {tier_id}; orders.js:187 cổng thẻ chỉ chạy khi có tier_id, :199 cổng gói (khuôn); auth.js:64
     expiresIn JWT_EXPIRES_IN || '8h'. -->

**Chờ duyệt kế hoạch:** viết `viec/BAN-HANG-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Nhân viên không gặp lỗi "Mua gói cần chọn gói và khách hàng" khi lỡ bỏ chọn khách sau khi thêm gói; máy chủ không nhận `membership_buy`
thiếu hạng thẻ; đăng nhập mặc định 30 ngày không phụ thuộc biến môi trường Render.

## Quyết định chủ quán (chép đúng)
- Bỏ chọn khách khi giỏ có gói → gỡ gói khỏi giỏ, báo một dòng; món lẻ giữ nguyên. Không hỏi lại.
- DANG-NHAP-1: chỉ đổi mặc định 8h → 30 ngày (biến môi trường vẫn ưu tiên); không sửa AuthContext.

## Nghiệm thu
- A1 `client/src/pages/Sales.jsx` `handleClearCustomer`: giỏ có dòng `is_pkg` → gỡ dòng đó, `setError('Đã gỡ gói khỏi giỏ vì bỏ chọn khách')`
  (nhân viên chọn lại khách rồi thêm gói lại); dòng lẻ, số dư, nợ xử lý như cũ. Build `client/dist`. Màn hình không thêm nút.
- A2 `server/routes/orders.js`: `membership_buy` có mặt phải có `tier_id` VÀ SĐT đã chuẩn hoá — cùng khuôn cổng gói `:199`
  (`membership_buy && !(membership_buy.tier_id && normalizePhone(customer_phone))` → 400, code `THE_MUA_THIEU_THONG_TIN`), thay cổng `:187`.
  Ca đỏ trong `cong_cu/thu_P26c.js` (mục [S] hoặc mục mới [T], không thêm file): `membership_buy: {}` + 1 món → 400, không đơn (gốc 200);
  `{tier_id}` không SĐT → 400 (gốc đã 400 — chỉ giữ ca cũ S4c/ghi mã mới); K5: mua thẻ đủ → 200, `membership_buy: null` → 200 như cũ.
- A3 `server/routes/auth.js:64` → `process.env.JWT_EXPIRES_IN || '30d'`. Ca đỏ: đăng nhập trên bản sao chạy KHÔNG có `JWT_EXPIRES_IN`,
  giải mã token (`jsonwebtoken.decode`): `exp − iat ≥ 29 × 86400` (gốc 8 h → đỏ); có `JWT_EXPIRES_IN=8h` → vẫn 8 h (ưu tiên biến).
  Nếu bộ chạy của `thu_P26c.js` không cho bỏ biến môi trường → DỪNG, ghi `## Câu hỏi`.
- A4 `npm test`, `--day-du` xanh; `viec/BAN-HANG-1/dot_bien.py` ≥ 1 VS- + BV- mỗi chỗ vá (A2, A3), có đối chứng; màn hình: ghi cách thử tay
  1 thao tác ở quầy (thêm gói → bỏ chọn khách → giỏ hết gói, có dòng báo) trong `trang_thai.md`.

## Phạm vi
- viec/BAN-HANG-1/**
- client/src/pages/Sales.jsx
- client/dist/**
- server/routes/orders.js
- server/routes/auth.js
- cong_cu/thu_P26c.js

## Ngân sách
~15–25 dòng code + ~50 dòng thử.
**Phương án đơn giản nhất đã xét:** A1 chỉ lọc `cart.filter(c => !c.is_pkg)` trong hàm có sẵn; A2 đổi điều kiện một dòng theo khuôn :199;
A3 một chuỗi. Không thêm màn hình, không thêm cài đặt.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `AuthContext.jsx`, `server/database.js`, `server/utils/`, `kiem_tra_truoc_khi_giao.js`, `cong_cu/gia_lap/**`, `.claude/`,
  `.github/`, `tu_chay/`, sổ việc. Không nới hạn, không hạ ngưỡng.
- Không đổi hành vi cổng gói SO-LUONG-1 (`:199–205`), không đổi `thu_P26c.js` ca cũ (chỉ thêm / đổi mã lỗi của S4c nếu cần, ghi rõ).
- Chỉ push đúng `git push -u origin viec/BAN-HANG-1`. Không đụng `main`, không merge, không tạo PR.
