# TIEN-KHOA-2 — Bịt 3 lối đổi tiền không qua PIN / QR (sau BO-MAN-CU-1)

<!-- Phiếu chat POS bàn 39 (17.11), chat bàn 40 đặt lên nhánh 18.11 18:40 từ main bc16e140 (sau PR #100 BO-MAN-CU-1). Máy: Claude Code · OPUS.
     Chat bàn 40 kiểm lại số dòng trên bc16e140: wallets.js deduct :185, adjust :220; don-mo-rong.js doi-cach-tra :112; orders.js pay-debt :1526;
     Orders.jsx :415 (fetch trần); api.js :295 deduct, :425 payDebt; server/utils/pinChuQuan.js có.
     SONG SONG: KHO-3a (chờ duyệt kế hoạch) sửa giuCho.js, thanh-toan.js, orders.js (đường tạo đơn / huỷ), api.js. Vì vậy A4 đổi sang cách KHÔNG đụng
     giuCho / thanh-toan (chat bàn 40, 18.11): thu nợ chỉ tiền mặt. Ai gộp sau thì ghép main. -->

**Chờ duyệt kế hoạch:** viết `viec/TIEN-KHOA-2/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Chủ quán chốt 11.11 (`QUYET_DINH_CHU_QUAN.md`): trừ tiền tài khoản luôn cần PIN; chuyển khoản phải qua QR. BO-MAN-CU-1 đã bịt đường tạo đơn thẳng.
Máy BO-MAN-CU-1 (kế hoạch 4386c365 mục 8) và chat bàn 39 tìm thêm **3 lối còn mở**. Chủ quán 17.11 19:04: "có bịt lỗ tiền".
1. **Ví:**
   - `POST /api/pos/wallets/deduct` trừ số dư không PIN (`server/routes/wallets.js`, khoảng dòng 185). `client/src` không màn nào gọi; `api.js:295` có hàm.
   - `POST /wallets/adjust` cộng / trừ tay (khoảng dòng 220, quyền `adjust_balance`, màn `components/ViKhach.jsx`), chỉ cần lý do.
2. **Đổi cách trả** `POST /api/pos/orders/:id/doi-cach-tra` (`server/routes/don-mo-rong.js` dòng 112–151): tiền mặt → chuyển khoản chỉ cần lý do.
   Đây là lối "thu tiền mặt rồi ghi là chuyển khoản": tiền mặt trong két hụt mà sổ vẫn khớp.
3. **Thu nợ đơn cũ** `POST /orders/:id/pay-debt` (`orders.js` khoảng dòng 1526, màn `Orders.jsx:415`) với `payment_method: 'transfer'`: ghi "đã chuyển khoản" không qua QR.

## Nghiệm thu
- A1 `/wallets/deduct`: không màn nào dùng → BỎ route và hàm `api.js` (hoặc trả 410 có `code`; kế hoạch chọn, nêu lý do).
- A2 `/wallets/adjust` (sửa tay số dư — việc của chủ quán, không phải bán hàng):
  - chỉ chạy khi có **PIN chủ quán** (`server/utils/pinChuQuan.js`, `kiemPinChuQuan`, dùng chung luật sai / khoá đã có) + lý do;
  - trừ không làm số dư khả dụng âm;
  - mỗi lần ghi một dòng sổ ví đủ người, lý do, giờ, hiện ở màn Đối soát.
  - Màn `ViKhach.jsx` hỏi PIN chủ quán bằng hộp PIN có sẵn (khuôn mẫu Lưu-PIN của GIAO-DIEN-2 nếu đã có; chưa có thì ô PIN đơn giản), không dùng `window.prompt`.
- A3 Đổi cách trả **tiền mặt → chuyển khoản**: kế hoạch so ba cách, đề xuất MỘT:
  - (a) chặn hẳn;
  - (b) chỉ cho khi gắn được với MỘT khoản tiền về chưa khớp (`pos_payos_su_kien` / SePay / Tingee) đúng số tiền, khoản đó thành "đã khớp";
  - (c) PIN chủ quán + lý do.
  Chiều **chuyển khoản → tiền mặt** giữ như cũ (két tăng, không mất tiền), nhưng ghi đối soát.
- A4 Thu nợ đơn cũ bằng chuyển khoản: **chặn** (`pay-debt` với `payment_method` khác tiền mặt → 400 có `code`, lời "Thu nợ chuyển khoản phải qua QR — tạm
  thu tiền mặt"). Lý do: quầy đã "Không công nợ" (chủ quán 11.11), đơn nợ chỉ còn ở dữ liệu cũ (LUAT §6.6: chọn cách an toàn nhất); KHÔNG mở phiên QR
  cho thu nợ trong việc này (giuCho / thanh-toan đang do KHO-3a sửa). Màn `Orders.jsx` chỉ còn nút thu tiền mặt; chỗ gọi `fetch` trần :415 chuyển sang
  `ordersApi.payDebt` có sẵn. Thu nợ tiền mặt giữ như cũ. Chặn đua: một đơn nợ chỉ thu một lần (`409 DA_THU_ROI` đã có, giữ).
  Cần thu nợ qua QR sau này → việc riêng, sau KHO-3a.
- A5 Đột biến VS-/BV- cho từng vế (deduct, adjust thiếu PIN, adjust sai PIN, adjust làm âm, đổi sang chuyển khoản, pay-debt chuyển khoản không QR), có đối chứng. Ca hai người cùng bấm cho A2 và A4.
- A6 K5 — phải KHÔNG bị chặn:
  - chủ quán cộng tay có PIN đúng;
  - đổi chuyển khoản → tiền mặt;
  - thu nợ tiền mặt;
  - bán hàng qua phiên (PIN ví, QR) không đổi;
  - App KH không đổi (`thu_HOPDONG_KH.js` xanh).
- A7 Chủ quán thử tay (≤ 3):
  1. Khách hàng › ví › điều chỉnh: hỏi PIN chủ quán;
  2. Đơn hàng › đổi cách trả sang chuyển khoản theo cách A3 đã chọn;
  3. thu một đơn nợ cũ (nếu có): chỉ còn tiền mặt; chọn chuyển khoản → báo lỗi rõ.

## Phạm vi
- viec/TIEN-KHOA-2/**
- server/routes/wallets.js
- server/routes/don-mo-rong.js
- server/routes/orders.js
- server/utils/pinChuQuan.js
- server/utils/doiSoat.js
- client/src/components/ViKhach.jsx
- client/src/pages/Orders.jsx
- client/src/utils/api.js
- client/dist/**
- cong_cu/thu_TIENKHOA2.js
- cong_cu/thu_*.js
- cong_cu/gia_lap/kich_ban.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~80–150 dòng code, ~300 dòng thử. **Phương án đơn giản nhất đã xét:**
- Dùng lại `kiemPinChuQuan`, mã lỗi có sẵn. Thu nợ: chặn chuyển khoản (không phiên QR mới).
- Không bảng mới. Không đổi hợp đồng App.
- `kiem_tra_truoc_khi_giao.js`: chỉ THÊM dòng `chayBaiThat` cho bài mới.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
có — đường ghi tiền (ví, cách trả, thu nợ), PIN chủ quán

## Cấm
- Chỉ sửa trong `orders.js` route `pay-debt`. Không đụng `taoDon` / `taoDonGoc` (BO-MAN-CU-1), đoạn kho / huỷ đơn (KHO-3a).
- KHÔNG sửa `server/utils/giuCho.js`, `server/routes/thanh-toan.js` (KHO-3a đang sửa). `api.js`: chỉ xoá / sửa đúng dòng `deduct`, không đụng chỗ khác.
- KHÔNG sửa `server/routes/kh/**`, `HOP_DONG_API_KH.md`.
- KHÔNG sửa `client/src/pages/Customers.jsx`, `Settings.jsx`, `components/Layout.jsx` (GIAO-DIEN-2).
- Mặc định: không sửa `.claude/`, không merge, không tạo PR, không đụng main, chỉ `git push -u origin viec/TIEN-KHOA-2`, không sửa sổ việc, không chạy `patch_*.py`.
