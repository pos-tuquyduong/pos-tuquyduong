# SO-LUONG-1 — Máy chủ chỉ nhận số lượng nguyên ≥ 1 (món lẻ, số gói mua) — chặn mua gói 3.000đ / giảm tiền đơn qua API

<!-- Phiếu do chat soạn 14.10.2026. Nền: main sau sổ việc v30 (cha 83872a4 = Merge PR #19 GOI-2; TOC-DO-1 gộp 6a2ec76).
     Nguồn: viec/GOI-1/trang_thai.md Q-B + Phát hiện (13.10): máy chủ tin nguyên `pkg_qty` (orders.js:400 `package_buy.pkg_qty || 1`,
     :1020) → gọi API thẳng `pkg_qty: 0.002` mua gói với 3.000đ; số lượng món lẻ âm / lẻ (`Number(item.quantity)` orders.js:310 —
     GOI-1 chỉ kiểm nguyên ≥ 1 cho món LẤY TỪ GÓI) → giảm tiền đơn. Màn Bán hàng luôn gửi số nguyên nên QUẦY chưa bị; lỗ nằm ở
     gọi thẳng máy chủ bằng tài khoản đã đăng nhập. -->

**Chờ duyệt kế hoạch:** viết `viec/SO-LUONG-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`. (Đụng tiền.)

## Mục tiêu
Không còn cách nào tạo đơn với số lượng không hợp lệ qua máy chủ: mọi `quantity` của món và `pkg_qty` của gói phải là số NGUYÊN ≥ 1
(một quy tắc, một chỗ kiểm, lời rõ). Nhỏ, gọn; xong trước AUDIT-3.

## Quyết định chủ quán (chép đúng)
- Số lượng món lẻ: nguyên ≥ 1 (quán bán theo ly / túi / hộp, không bán số lượng lẻ — chủ quán xác nhận khi duyệt kế hoạch; nếu CÓ
  món bán theo cân thì máy DỪNG, ghi `## Câu hỏi`).
- `pkg_qty` (số gói mua một lần): nguyên ≥ 1. Trần hợp lý (vd ≤ 20) nếu thêm thì máy đề xuất, chủ quán chốt.
- Chặn ở máy chủ với 400 + lời rõ ("Số lượng phải là số nguyên từ 1"); màn Bán hàng không đổi (đã gửi số nguyên).

## Nghiệm thu
Mỗi mục: ca ĐỎ trên gốc → XANH sau vá, thêm vào `cong_cu/thu_P26c.js` (đã đăng ký; KHÔNG thêm file bài thử mới), kèm số tiền.
- A1 `POST /orders` món lẻ `quantity` 0 / −1 / 0.5 / "2a" / "" → 400, không tạo đơn, kho không đổi; `quantity: 2` và `"2"` → 200
  (chuỗi số nguyên hợp lệ vẫn nhận — màn hình có thể gửi chuỗi).
- A2 `package_buy.pkg_qty` 0 / 0.002 / −1 / 1.5 → 400; thiếu → 1 (như nay); `2` → 2 gói, tiền = 2 × giá.
- A3 Món lấy từ gói: giữ phép kiểm GOI-1 — gom về CÙNG một hàm kiểm với A1 (một chỗ), ca cũ vẫn xanh.
- A4 Tổng tiền đơn không bao giờ giảm vì số lượng: đột biến bỏ kiểm → ca A1 (0.5 → tiền giảm) BẮT.
- A5 Luồng hợp lệ KHÔNG bị chặn (K5): bán 1–10 ly, mua 1–2 gói, lấy từ gói, mua thẻ. `npm test`, `--day-du` xanh, 0 CẢNH BÁO;
  `viec/SO-LUONG-1/dot_bien.py` mỗi chỗ vá ≥ 1 VS- + BV-, đều BẮT (có ĐỐI CHỨNG: bản chưa đột biến 0 lỗi, như TOC-DO-1); đột biến
  P26c / GOI-1 / GOI-2 vẫn BẮT.

## Phạm vi
- viec/SO-LUONG-1/**
- server/routes/orders.js
- cong_cu/thu_P26c.js

## Ngân sách
~15–30 dòng code + ~60 dòng thử.
**Phương án đơn giản nhất đã xét:** một hàm `soNguyenDuong(x)` ở đầu route tạo đơn, gọi cho mọi `quantity` và `pkg_qty`; không
đổi màn hình, không đổi cấu trúc.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `client/`, `server/database.js`, `server/utils/`, `kiem_tra_truoc_khi_giao.js`, `cong_cu/gia_lap/**`, `.claude/`,
  `.github/`, `tu_chay/`, `CLAUDE.md`, sổ việc. Không nới hạn, không hạ ngưỡng.
- Gặp món bán theo cân / số lượng lẻ hợp lệ → DỪNG, ghi `## Câu hỏi`.
- Chỉ push đúng `git push -u origin viec/SO-LUONG-1`. Không đụng `main`, không merge, không tạo PR.
