# SO-LUONG-1 — trạng thái

## Bản chụp (bước 1, 14.10.2026)
- HEAD: b823f72 · FETCH_HEAD (origin/viec/SO-LUONG-1): b823f72 — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  b823f72 PHIEU: SO-LUONG-1
  551319d TIEN-DO: GOI-2 xong (83872a4), TOC-DO-1 xong (6a2ec76), mo SO-LUONG-1, them TU-CHAY-6 — so v30
  83872a4 Merge pull request #19 from pos-tuquyduong/viec/GOI-2
  ```

## Bước 3 — kế hoạch (14.10.2026)
- Phiếu ghi "Chờ duyệt kế hoạch" → viết `ke_hoach.md`, commit, push, DỪNG ở bước 3. Chưa viết bài thử, chưa sửa code.
- Đo trên gốc lượt này: `node cong_cu/thu_P26c.js` → 84 đạt · 0 hỏng (3 s).
- Soát độc lập (agent chỉ đọc, 4 câu của skill) đã gọi, kết quả ghi ở mục dưới khi có.

## Câu hỏi
Xem mục "## Câu hỏi" cuối `ke_hoach.md` (3 câu: đột biến GOI-1 lạc · trần `pkg_qty` · `pkg_qty` 0/"" đổi hành vi).

## Soát độc lập kế hoạch (agent chỉ đọc, 14.10.2026) — đã sửa vào `ke_hoach.md` bản 2
- K1 (5 số dòng lệch, tự kiểm lại bằng `sed -n`, đúng): router :33 (không :31); `let soLuotGoi` :388, điều kiện mua gói :389
  (không :399); `membership_buy` Sales.jsx:751; `items: []` cho phép ở :178. Khẳng định `"2a"` → tổng NaN chưa chạy → ghi CHƯA KIỂM.
- Phạm vi: phương án (a) Câu hỏi 1 sửa `viec/GOI-1/dot_bien.py` là ngoài Phạm vi; phiếu tự mâu thuẫn A3 ↔ A5 → máy không chọn,
  đưa chủ quán chốt (bỏ chữ "máy nghiêng (a)").
- Ngắn hơn: kiểm `pkg_qty` MỘT lần ở đầu route, xoá cả :400 và :1020 (bớt `let`, kiểm sớm) — nhận. Bỏ `VS-MON-CHI-AM` (trùng).
- Thiếu bài thử: vế `--day-du` xanh 0 CẢNH BÁO (A5) chưa nhắc → thêm; thiếu 1.5 cho món lẻ (phiếu đòi NGUYÊN) → S1d; S2a–S2d thiếu
  `cash_amount` khớp số gốc tính (ca trộn lỗi, K3) → thêm; thiếu đột biến K5 "siết quá tay" cho S1h / S2e / S2f → 3 đột biến mới.
- K4 / K5: không sót chỗ đọc `pkg_qty`; không bài thử nào gửi số ngoài nguyên ≥ 1 (thu_P20/P21/P26a/P26b/GOI1/kich_ban) → không đỏ oan.

## Phát hiện (ngoài phiếu, chỉ đọc code, KHÔNG sửa trong việc này)
- (ĐƯỜNG TIỀN, người soát đọc — tự đối chiếu :338) `package_buy: {}` (không `package_id`) kèm món `from_package: true`: :338 `!package_buy`
  sai vì `{}` truthy → không chặn; :256 không có danh sách → :350 không kiểm; :389 bỏ qua vì không `package_id`; món tính 0đ và
  :909 không trừ lượt vì không `customer_package_id`. Lỗ lấy hàng 0đ qua API (màn hình không gửi dạng này). Đề xuất: :338 đổi
  thành `!(package_buy && package_buy.package_id)` — việc riêng.
- Mua gói không gửi `customer_phone`: :1019 đòi `phone` → thu tiền gói mà không tạo gói khách. Có từ trước, cần chủ quán xem (có
  nên 400 "cần chọn khách" như mua thẻ :183).
