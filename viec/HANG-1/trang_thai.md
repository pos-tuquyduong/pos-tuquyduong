# HANG-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (02.11.2026)
- Nhánh: `viec/HANG-1`; `git status --short` sạch.
- `git fetch origin viec/HANG-1` xong. HEAD = `c26b4e0`, FETCH_HEAD = `c26b4e0` → bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  c26b4e0 PHIEU: HANG-1
  2c81b0f TIEN-DO: MANKHACH-1 (ae27536), TU-CHAY-10 (4891879), KHO-IN-1 (d1b57b8) xong; dot quyet dinh 01-02.11 + thiet_ke dot 2 + hop dong v7 (da hen) + lich theo lan; mo GIO-VN-1, HANG-1, NAP-1 — so v53
  d1b57b8 Merge pull request #64 from pos-tuquyduong/viec/KHO-IN-1
  ```
- Có commit `PHIEU: HANG-1` (`c26b4e0`).

## Bước 3 — kế hoạch
- `viec/HANG-1/ke_hoach.md` đã viết, agent phụ chỉ đọc đã soát theo 4 câu (kết quả ghi cuối `ke_hoach.md`).
- Phiếu dặn **Chờ duyệt kế hoạch** → commit, push, DỪNG.

## Câu hỏi (02.11 — chờ chủ quán, chi tiết + đề xuất ở `ke_hoach.md` mục 9)
1. **PIN chủ quán chưa có trong hệ thống** (grep `pin` khắp `server/` chỉ thấy PIN KHÁCH `server/utils/pinKhach.js`). Cần chỗ lưu + chỗ đặt.
   Đề xuất Q1-a: PIN 4–6 số của quán, lưu BĂM trong `pos_settings`, đặt / đổi ở Cài đặt → Hạng (chỉ tài khoản chủ quán, nhập mật khẩu
   đăng nhập), sai 5 lần khoá 15 phút; một file chung `server/utils/pinChuQuan.js` (DONVI-1 dùng lại sau) → **thêm file đó vào Phạm vi**.
2. **Bài thử cũ phải sửa vì luật mua thẻ đổi** (đã được chủ quán duyệt đổi — LUAT §6.8, bài sửa thường): 8 bài đang mua thẻ bằng
   `membership_buy: { tier_id }` + giá `card_price` hoặc khoá `gia_the = card_price`, và bất biến Đối soát I15 (dòng CẤP không có đơn) →
   xin thêm vào Phạm vi: `cong_cu/thu_DOISOAT1.js`, `cong_cu/thu_HD1.js`, `cong_cu/thu_P2223.js`, `cong_cu/thu_P24.js`, `cong_cu/thu_P26c.js`,
   `cong_cu/thu_KHAPI2.js`, `cong_cu/thu_UUDAI1.js`, `cong_cu/thu_P3.js`, `cong_cu/gia_lap/kich_ban.js`, `cong_cu/gia_lap/bat_bien.js`.
3. **Phiếu ghi "mở SAU KHI KH-SDT-1 gộp"** — sổ `TIEN_DO_POS.json` vẫn ghi KH-SDT-1 `dang_mo`, `git log` chưa có commit gộp. Kế hoạch
   không phụ thuộc KH-SDT-1 về luật, chỉ có thể đụng nhau ở `customers-v2.js`, `kh/index.js`, số bước nâng cấp, `PHIEN_BAN`. Làm tiếp
   ngay hay chờ?

## Phát hiện (ngoài phạm vi, không sửa)
- Quyền `cap_hang` (mới) sẽ chưa có nhãn ở màn phân quyền (`server/routes/users.js:156-171`) — cùng khuôn `refund_package`, `xoa_pin_khach`.
- Phiên QR payOS chạy lại toàn bộ cổng lúc chốt: đổi giá / tắt gói (hạng hoặc gói sản phẩm) giữa lúc mở phiên và lúc chốt → đơn 400 sau khi
  khách đã chuyển. Có sẵn với gói sản phẩm; HANG-1 không mở đường riêng.
- `CHECKLIST_CODE.md` mục H.6 vẫn ghi "Hai hạng thẻ: Vàng và Bạch Kim. Không có Kim Cương" — lệch CLAUDE.md §5.6 (sổ v53).
- `server/database.js:1325-1328` (seed kho TRỐNG) vẫn tạo `Bạch Kim` — kho mới sẽ có Bạch Kim (bán, không gói → không bán được).
- Màn Bán hàng MỚI (`client/src/pages/BanHang/`) chưa bán thẻ (`tinh.js:150` luôn `membership_buy: null`) — chỉ màn cũ `Sales.jsx` bán.
- `orders.js` ghi hạn thẻ bằng `addMonthsSafe(new Date(now))` + `toISOString()` — chỉ đúng khi máy chủ chạy UTC (K7). Kế hoạch thay bằng
  phép cộng tháng trên chuỗi giờ VN (không phụ thuộc múi giờ máy) ngay trong `membershipStatus.js`.
