# GIAO-DIEN-3 — Màn hình vừa khít mọi thiết bị (điện thoại · máy tính bảng · máy tính): hết tràn ngang

<!-- Phiếu do chat POS soạn 28.11.2026 (bàn 42, main c4b370c — #109 ANH-MON-1 ĐÃ GỘP). Máy: Claude Code · SONNET.
     Việc GIAO DIỆN (chỉ CSS + client/dist + bài thử) → việc thường: KHÔNG chờ duyệt kế hoạch, chạy thẳng tới hết. KHÔNG đụng server/.

     CHỦ QUÁN BÁO 28.11 14:24 (ảnh iPhone): Kho › "Sản phẩm & công thức" — thẻ món bị cắt mất bên trái, khoảng trống lớn; mở một món thì chữ / nút
     tràn ra ngoài mép phải, chữ nhỏ ("kho-nho") hiện TO bất thường. Chủ quán dặn: "khi dùng điện thoại, máy tính bảng hay PC luôn tối ưu theo thiết bị".

     CHAT ĐÃ ĐỌC + ĐO (main c4b370c):
       - index.css:50 `.app-layout { display: flex; }` · :108 `.main-content { flex: 1; margin-left: 240px; }` — THIẾU `min-width: 0`.
         Phần tử con của flex mặc định không co nhỏ hơn bề rộng tối thiểu của nội dung bên trong → hàng tab Kho (kho.css:2 `.kho-tabs`, 11 nút
         `white-space: nowrap`, Kho/index.jsx 33–45) kéo CẢ TRANG rộng ra bằng tổng 11 nút, dù hàng tab có `overflow-x: auto`.
         Cùng khuôn: mọi bảng `.table { min-width: 600px }` (index.css:648, ≤ 768px) cũng kéo trang rộng như vậy ở màn có bảng.
       - Trang rộng hơn màn → iPhone thu nhỏ trang và tự phóng chữ (text autosizing) → chữ nhỏ hoá to, lưới thẻ `.kho-luoi` (kho.css:7, minmax 15rem)
         thành 4 cột tràn ra ngoài. index.css không có `-webkit-text-size-adjust` (grep "text-size-adjust" → 0 chỗ).
       - Đo bằng Chrome không giao diện (trang dựng lại từ index.css + kho.css + cấu trúc Layout/Kho thật), bề ngang trang `scrollWidth`:
           điện thoại 390 px: GỐC 1.252 px (lưới 4 cột)  → thêm `.main-content{min-width:0}`: 390 px (1 cột)
           máy tính bảng 820 px: GỐC 1.524 px (4 cột)   → 820 px (2 cột)
           máy tính 1.280 px: GỐC 1.524 px (4 cột)      → 1.280 px (4 cột)
       - Máy tính (≥ 769 px): sau khi vá, hàng 11 tab Kho rộng hơn chỗ trống → 2–3 tab cuối (Đặt hàng, Nhập từ SX) nằm khuất bên phải, người dùng
         chuột khó cuộn ngang → không thấy.
     SONG SONG: KHO-GON-1 (Opus) đang sửa client/src/pages/Kho/kho.css + Kho/index.jsx. Việc này CHỈ thêm MỘT khối cuối kho.css (C2), không sửa dòng cũ;
     xung đột client/dist / kho.css chat ghép lúc gộp. -->

## Mục tiêu
Mở POS trên điện thoại, máy tính bảng hay máy tính: trang luôn vừa khít bề ngang màn, không phải kéo ngang, chữ đúng cỡ, thẻ tự xếp số cột hợp màn.
Sửa ở GỐC (khung chung của app) để mọi màn cùng được, không vá từng màn.

## Nghiệm thu

### A. Khung chung (index.css)
- A1 `.main-content` thêm `min-width: 0` ở quy tắc GỐC (ngoài @media — áp mọi cỡ màn). Không đổi `flex`, `margin-left`.
- A2 Chặn iPhone tự phóng chữ: `html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }` (đặt gần quy tắc `*` / `body` đầu file).
  KHÔNG chặn người dùng phóng to bằng hai ngón (giữ nguyên thẻ meta viewport `maximum-scale=5.0` ở client/index.html).

### B. Hàng tab Kho trên máy tính (kho.css)
- B1 Thêm MỘT khối ở CUỐI kho.css: `@media (min-width: 769px) { .kho-tabs { flex-wrap: wrap; overflow-x: visible; } }` — máy tính / máy tính bảng
  ngang thấy đủ mọi tab (xuống dòng khi hết chỗ). Điện thoại (≤ 768 px) GIỮ một hàng cuộn ngang như hiện nay (tiết kiệm chỗ).
  Ngưỡng 768/769 khớp `@media (max-width: 768px)` sẵn có của index.css.

### C. Kiểm
- C1 Bài thử `cong_cu/thu_GIAODIEN3.js` (đọc file CSS, không cần trình duyệt), gắn vào `kiem_tra_truoc_khi_giao.js` (kiểm lại đã gắn — NHOM-MON-1 từng quên):
  - T1 quy tắc `.main-content` NGOÀI mọi @media có `min-width: 0` (ca ĐỎ: xoá dòng; ca ĐỎ: chỉ có trong @media 768 — máy tính vẫn tràn; ca XANH: `min-width: 0px`
    cũng đạt — so giá trị bằng 0, không so chuỗi).
  - T2 `html` có `-webkit-text-size-adjust: 100%`; T3 client/index.html meta viewport còn `width=device-width` và KHÔNG có `user-scalable=no`.
  - T4 kho.css có `.kho-tabs` `flex-wrap: wrap` CHỈ trong `@media (min-width: 769px)` (ca ĐỎ: đặt ngoài @media — điện thoại mất hàng cuộn).
  - Đỏ trên gốc (c4b370c), xanh sau vá; đột biến gỡ từng vế (K3) + đối chứng.
- C2 `cd client && npm run build`; `npm test`; `node kiem_tra_truoc_khi_giao.js --day-du`; `node tu_chay/cong.js chay` ĐẠT.
- C3 Có Chrome trong máy thì đo lại như chat (dựng trang tĩnh từ index.css + kho.css, 390 / 820 / 1.280 px, `document.documentElement.scrollWidth`
  phải BẰNG bề rộng màn) và chép số vào trang_thai.md; không có thì ghi CHƯA KIỂM. Không thêm thư viện trình duyệt vào kho.
- C4 Thử tay cho chủ quán (ghi trong báo cáo): (1) điện thoại: Kho › Sản phẩm & công thức — không kéo ngang được, thẻ 1 cột, chữ nhỏ đúng cỡ;
  mở một món — mọi ô / nút nằm trong màn. (2) máy tính: Kho thấy đủ 11 tab, không phải cuộn ngang. (3) điện thoại: Bán hàng, Đơn, Khách vẫn như cũ.

## Phạm vi
- viec/GIAO-DIEN-3/**
- client/src/index.css
- client/src/pages/Kho/kho.css
- client/dist/**
- cong_cu/thu_GIAODIEN3.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~10 dòng CSS + ~80 dòng thử.
**Phương án đơn giản nhất đã xét:** một dòng `min-width: 0` ở khung chung sửa MỌI màn cùng lúc — KHÔNG vá từng màn, KHÔNG thêm `overflow-x: hidden`
cho body (giấu tràn chứ không sửa, còn làm hỏng thanh cuộn ngang của bảng).

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
không — chỉ CSS, không đổi route, quyền, dữ liệu.

## Cấm
- KHÔNG sửa server/**, ban_mau_pos/**, mọi file .jsx.
- kho.css CHỈ thêm khối B1 ở cuối file, không sửa dòng cũ (KHO-GON-1 đang sửa file này).
- KHÔNG đổi màu, phông, cỡ chữ, ngưỡng @media sẵn có.
