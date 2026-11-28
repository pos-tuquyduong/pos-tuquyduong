# GIAO-DIEN-3 — kế hoạch (việc thường: không chờ duyệt)

## Phương án
| Phần | A (chọn) | B | Lý do |
|---|---|---|---|
| A1 khung chung | 1 dòng `min-width: 0` trong `.main-content` (index.css, ngoài @media) — 1 file, ~1 dòng | `overflow-x: hidden` ở body | B giấu tràn chứ không sửa, làm hỏng cuộn ngang của bảng (phiếu loại) |
| A2 iPhone phóng chữ | `html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }` — ~2 dòng | sửa thẻ viewport | B chặn phóng to hai ngón (phiếu cấm) |
| B1 tab Kho máy tính | 1 khối `@media (min-width: 769px)` cuối kho.css — 2 dòng | sửa dòng cũ `.kho-tabs` | B đụng dòng KHO-GON-1 đang sửa (phiếu cấm) |
| C1 bài thử | `cong_cu/thu_GIAODIEN3.js` đọc CSS, tính giá trị hiệu lực theo bề rộng màn | dò chuỗi | A bắt được "chỉ nằm trong @media 768" và biên 768/769; dò chuỗi không bắt |

## Ca thử ↔ nghiệm thu
A1 → T1a–T1e (390 · 768/769 · 820/1280; flex/margin-left giữ nguyên; không overflow hidden) · A2 → T2a–c · T3 → T3a–c · B1 → T4a–e · C1 → C1 (đã gắn vào bộ kiểm). Bộ đọc CSS tự thử bằng 11 ca giả (0a–0k, gồm `0px` đạt, chỉ-trong-@media đỏ, câu sau thắng, biên media).

## Luồng hợp lệ phải KHÔNG bị chặn / đổi (K5)
Điện thoại ≤ 768 px: hàng tab Kho vẫn MỘT hàng cuộn ngang (T4a) · `.main-content` margin-left 240px ở máy tính, 0 ở điện thoại (T1d) · người dùng vẫn phóng to hai ngón (T3b–c) · bảng bọc `overflow-x: auto` vẫn cuộn ngang trong khung (đo bằng Chrome, trang_thai.md).

## Đường song song (K4)
`.kho-tabs` còn dùng ở ChonNguyenLieu / NguyenLieu / TonKho — cùng được wrap trên máy tính (chủ ý, cùng khuôn). Bảng `.table` không bọc khung cuộn: xem `## Phát hiện`.
