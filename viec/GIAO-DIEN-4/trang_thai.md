# GIAO-DIEN-4 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/GIAO-DIEN-4`; cây sạch; fetch xong. HEAD = FETCH_HEAD = `08392a6` (không cần kéo).
- `git log --oneline -3`:
  - `08392a6 PHIEU: GIAO-DIEN-4 — lam dep POS theo mau chu quan duyet 28.11 (son mai + bill giay, icon thay emoji, khau hieu Dong Y Duong The) — chat ban 42`
  - `885b40d Merge pull request #111 from pos-tuquyduong/viec/GIAO-DIEN-3`
  - `0c6be76 GIAO-DIEN-3: chat soat DAT, ghep main aa9785f5, HEAD DA KIEM 749cdf6a — chat ban 42`
- Mốc `PHIEU: GIAO-DIEN-4` = `08392a6`. Kho mở ở dạng nông (`is-shallow true`) làm hai bài cũ (BH2 G1, NDAPI1 A2 — đọc lịch sử git) đỏ giả → đã `git fetch -q --unshallow origin viec/GIAO-DIEN-4` (chỉ tải thêm lịch sử), sau đó `npm test` xanh.

## Nhật ký / sự cố (cho bước 11)
- Người gác chặn: vòng `for` trong bash (B-CHUONGTRINH); lệnh ghép `python3 … && node …` và `git stash` (B-PHANTICH, GIT-LENH); chạy `thu_ANHMON1.js` khi file chưa commit (B-BIMAT-CHU — file có chữ SECRET của bài thử) → commit trước rồi chạy. Không lách; đổi sang lệnh đơn.
- Bài cũ đỏ do việc này: `thu_QUAYUI1` B5 (dò `>Tiền mặt</button>` — icon đặt cách một dấu cách làm hỏng) và `thu_KETNOI1` E (dựng ThuTien.jsx bằng React tối giản không có `forwardRef` — import lucide vào ThuTien làm sập). Cách sửa: KHÔNG sửa bài cũ; ThuTien.jsx dùng hai icon vẽ tay (`IconTien`, `IconQr`) và đặt icon liền chữ (`<IconTien />Tiền mặt`).

## Soát kế hoạch (agent phụ chỉ đọc) — điều tiếp nhận
- Giữ `a { color }` (phiếu A2 xoá cả cụm 55–60 nhưng liên kết trơn sẽ xanh mặc định); thêm luật tiêu đề trong modal (`.modal-header h2/h3`).
- Bảng ca thử thiếu: B2/F3–F5 (ghi ở đây), sửa thu_ANHMON1 H8/H9/H10/H12 (LUAT §6.8) — đã làm.
- Topping chưa ảnh cũng vẽ hình ly (phiếu D2 nói "ô topping vẫn vẽ gọn") — đã làm; nếu chủ quán thấy lạ, đổi bằng một cờ ở AnhMon.

## Bảng "chỗ vá → đột biến" (cổng A17/A18) — `python3 viec/GIAO-DIEN-4/dot_bien.py` → TỔNG 59 (48 + 11 của vòng sửa 1): BẮT 59 · SỐNG 0 · LẠC 0 · HỎNG 0 (đối chứng XANH)
| Chỗ vá | Đột biến |
|---|---|
| index.css: bỏ quy tắc đỏ toàn cục (A2) | BV-input-lai-do · BV-strong-lai-do · BV-td-lai-xam · BV-body-lai-xam · VS-o-nhap-van-do-lop |
| index.css: khối @media print (F2) | BV-bo-khoi-in · VS-khoi-in-sai-phong · VS-khoi-in-bat-nen-may |
| index.css `:root` biến màu (A1), phông (A3), nền/thẻ/header (A4/A5) | BV-bo-bien-giay · VS-bien-giay-lech-mau · BV-bo-link-phong · BV-phong-chinh-mat-du-phong · VS-card-con-backdrop · VS-body-lai-gradient · VS-page-header-con-gradient |
| TieuDeMan + 6 trang + Quản lý (B1) | BV-tieu-de-emoji-lai · VS-emoji-trong-ten-TieuDeMan · BV-quan-ly-h1-tro · VS-TieuDeMan-bo-icon |
| Layout + CSS thanh bên / thanh dưới (C) | BV-bo-khau-hieu · VS-khau-hieu-viet-cung-trong-JSX · BV-logo-cu-icon-72 · BV-sidebar-het-may-vang · VS-nav-active-het-vach-vang · VS-bottom-nav-cham-do |
| tinh.js `nhanTon` + thẻ món (D1) | BV-nhanTon-het-nhan-con · VS-nhanTon-bo-pha-ngay · VS-nhanTon-khong-co-so-thanh-het · BV-the-mon-het-nhan · VS-mon-het-khong-mo · BV-nhan-ton-khong-goc |
| AnhMon (D2) | BV-luon-ve-ly · BV-luon-img · VS-nhom-la-ra-mau-tra · VS-ly-trung-id-gradient · VS-ly-khong-theo-nhom · BV-dong-gio-khong-truyen-nhom |
| chip nhóm (D3) | BV-chip-khong-ly |
| bill giấy + nút trả tiền (D4) | BV-bill-het-rang-cua · BV-dong-gio-net-lien · VS-tong-het-playfair · BV-nut-tra-tien-het-icon · VS-icon-dem-dau-cach-lam-vo-chu-nut · BV-thanh-gio-het-do-dam |
| menu.js + Quản lý (E1) | BV-nhom-mat-mau · BV-nhom-mat-icon · VS-mau-luc-lech-ma |
| nối bộ kiểm (F1) | BV-quen-gan-bai-vao-bo-kiem |
| vòng sửa 1 (R1–R8) | BV-vach-vang-lai-ra-ngoai · BV-the-nap-mat-khung · VS-bh-to-lai-hang-ngang-moi-nut · BV-nut-icon-mat-lop-rieng · BV-in-card-title-bo · VS-in-card-title-sai-mau · BV-in-table-th-bo · BV-topping-khong-truyen-nhom · BV-mau-the-khong-du-phong · VS-chip-lech-dem · BV-hasOwn-lai |

## Đếm từng mục nghiệm thu (bằng chứng)
- A1 → thu_GIAODIEN4 A1 (11 ca) · A2 → 0a–0g, A2a–A2e · A3 → A3a–c · A4 → A4a–d · A5 → A5
- B1 → B1a–f (TieuDeMan dựng thật bằng esbuild + 6 trang + QuanLy + ca ĐỎ emoji) · B2 → ghi Phát hiện (dưới), không phép
- C1 → C1a–g · C2 → C2a–b · C3 → C3
- D1 → D1a–g · D2 → D2a–l (dựng AnhMon thật: tea/coffee/juice/nhóm lạ/không truyền nhóm/có ảnh/rỗng/cỡ nhỏ/id trùng) + thu_ANHMON1 H8–H12 · D3 → D3a–b · D4 → D4a–e · D5 → D5a–d
- E1 → E1a–f (6 nhóm × 2 ca)
- F1 → thu_GIAODIEN4 114 ca + nối bộ kiểm F1a/F1b + thu_GIAODIEN3 vẫn xanh · F2 → F2a–c + `git diff --name-only 08392a6 HEAD -- InvoicePrint InPhieu InvoicePreview Kho server ban_mau_pos` = 0 file
- F3 → `npm run build` xong; `npm test` PASS 135 · FAIL 0 (trước khi thêm ca) ; `--day-du` PASS 139 · FAIL 0 · CẢNH BÁO 1 (có từ trước: route GET ghi ở `packages.js:196`, server — ngoài phạm vi); `bash ban_mau_pos/chay_thu.sh` TỔNG 186 đạt · 0 hỏng (bản mẫu không sửa)
- F4 → Chrome (Playwright + `client/dist` thật + dữ liệu GIẢ): `banhang_*.png`, `quanly_*.png` ở 390 / 820 / 1280; `scrollWidth = clientWidth` cả 6 ảnh (VỪA KHÍT)
- F5 → thử tay: xem mục CHƯA KIỂM / báo cáo

## Phát hiện (không sửa — ngoài phạm vi hoặc phiếu cấm)
1. **Emoji còn lại ở client/src: 216 ký tự emoji trên 195 DÒNG / 46 file `.jsx`** (dải U+1F300–1FAFF, U+2600–27BF; `Grep count` đếm DÒNG = 195; phiếu đếm 222 ký tự lúc chưa trừ 6 tiêu đề đã đổi). Nhiều nhất: Settings 50, Orders 28, Reports 17, Customers 10, DoiSoat 7, InvoicePreview 8 (in — Cấm). Màn Bán hàng còn 1 chỗ vẽ: chip voucher "🎟 <mo_ta>" — bị khoá bởi thu_VOUCHER2 Q14c + bản mẫu ban_mau_pos → để nguyên. Làm đợt sau (GIAO-DIEN-4b, cùng màn Kho sau KHO-GON-2).
2. `client/src/pages/Kho/index.jsx:79` còn `<h1 className="page-title">📦 Quản lý kho</h1>` (Cấm — KHO-GON-2).
3. Lời chào "Chào buổi …, <tên>" và ô "Đã bán / Doanh thu" trong mẫu: KHÔNG làm (phiếu D5 — cần dữ liệu / quyền). Nút "In bill · mang ra bàn" viền vàng trong mẫu: màn thật KHÔNG có nút này (phiếu cấm thêm nút) → không làm.
4. Hàng chip nhóm hôm nay KHÔNG có số đếm (BanHangMoi.jsx) → không thêm (phiếu cấm phép tính mới). Vòng đỏ số lượng trong giỏ ở góc thẻ món (D1): màn chưa có số lượng theo món → không làm.
5. Ở 820 px kiểu "Tự động" màn Bán hàng chia hai cột (thanh bên 240 + giỏ 380) nên cột món chỉ còn ~180 px, chip và thẻ xếp một cột — có từ trước (hình học cũ), không phải do việc này; cân nhắc cho tablet ≥ 768 ẩn thanh bên hoặc thu giỏ (cần chủ quán quyết).
6. Chữ "Trừ tài khoản" ở nút mờ (disabled) và "Đã nhận tiền" chữ xám trên nền xanh khó đọc khi chưa bấm được (`.bh .bh-nut:disabled { color: #64748b }` đè lên `.bh-xanh`) — có từ trước.
7. `strong/b` trơn từng được ép đỏ nay là chữ than: Orders.jsx (mã đơn), Refunds.jsx:57, Customers.jsx:572/580, DonApp.jsx:74, DoiSoat.jsx, Settings.jsx:1344 — theo luật "đỏ chỉ ở tiêu đề / giá / nút chính" của phiếu A2. Nếu muốn nổi bật lại chỗ nào thì thêm lớp riêng (A2 ghi lại): đã THÊM `.modal-header h2/h3` đỏ đậm (Settings.jsx:2131/2198, DiscountCodes.jsx:474 dùng h3 trần trong modal); `.text-gray`, `.stat-label` đổi sang chữ phụ #7C6F66.
8. `<h1>` trơn còn ở DonThu.jsx:58 và InvoiceSettings.jsx:804 (kèm emoji ⚙️) — ngoài danh sách B1 / Cấm của phiếu.
9. Màn Kho (Cấm) tự đẹp theo lớp chung nhưng mất đỏ ở h/b/td (quy tắc toàn cục đã gỡ) — chấp nhận theo phiếu (GIAO-DIEN-4b). `Kho/ToppingMon.jsx:24` còn truyền `ten=` (prop chết của AnhMon) và chưa truyền nhóm — file Cấm, làm ở GIAO-DIEN-4b.
11. Chip voucher `bh-mon-ma`: mã món tự sinh dạng `MOI-<số>-<6 ký tự>` (server/routes/products.js:103) hiện dài trên thẻ món; font Google tải bằng `<link rel=stylesheet>` chặn vẽ trang lúc mạng chậm (phiếu A3 yêu cầu `<link>`; có thể đổi `media="print" onload` sau); CLAUDE.md §3 ghi "119 phép" bản mẫu, thực tế `chay_thu.sh` nay in 186.
10. Bài thử `thu_ANHMON1.js`: H12 chỉ dò có `<svg` trong KhungChonMon — nếu sau này thêm icon lucide vào khung này, ca sẽ xanh oan; khoá chặt hơn bằng `data-` khi chạm tới.

## Ghi nhớ khi gộp (cho chat)
- `client/dist` đã build lại ở HEAD của việc; chat gộp main (KHO-GON-2 sửa Kho/**) thì build lại.
- 4 file in (InvoicePrint, InPhieu, InvoicePreview, inPhieuKho.css) không bị sửa; ngoài `@media print` ở index.css, bill / tem / phiếu pha chế in qua iframe riêng nên không thừa hưởng phông / màu mới (InvoicePrint.jsx:272 Arial riêng; InPhieu.jsx:88).
- Kho in `window.print()` trên trang: khối `@media print` cuối index.css trả đúng phông `'Inter', -apple-system` + màu cũ của body / h1–h6 / strong / td / th — không đo được tờ in thật (CHƯA KIỂM).

## Soát độc lập — lần 1 (nguyên văn tóm lược; báo cáo đầy đủ do agent phụ nộp, 28.11) — KHÔNG ĐẠT, 6 lỗi + nghi ngờ → VÒNG SỬA 1
1. index.css `.nav-item.active::before { left: -0.875rem }` bị `.sidebar-nav { overflow-y: auto }` cắt → vạch vàng không hiện (thấy ở ảnh chụp) — K3/K2. ĐÃ SỬA (`left: 0`), ca R1 + BV-vach-vang-lai-ra-ngoai.
2. Thẻ Nạp tiền / Thẻ thành viên / Chủ quán cấp mất khung `.bh-chu-mon` (`.bh-mon` không còn padding) — K5/K3. ĐÃ SỬA, R2 + BV-the-nap-mat-khung.
3. `.bh-to button` đổi xếp hàng ngang áp cả ô tiền khách đưa — K4. ĐÃ SỬA (khôi phục cột; lớp riêng `bh-nut-ic` cho 2 nút icon), R3a/R3b + VS-bh-to-lai-hang-ngang-moi-nut + BV-nut-icon-mat-lop-rieng.
4. Khối in không phủ lớp `.card-title` (tiêu đề phiếu Kho in) — K4/K1. ĐÃ SỬA (+ `.table th`), R4a/R4b + 3 đột biến.
5. KhungChonMon.jsx:59 chưa truyền `nhom`, `ten` thành prop chết — K4. ĐÃ SỬA (ToppingMon.jsx là file Cấm → Phát hiện 9). R5 + BV-topping-khong-truyen-nhom.
6. `.ql-the-o` thiếu `--mau` thành ô trong suốt — K5 nhẹ. ĐÃ SỬA (`var(--mau, var(--dat))`), R6.
Nghi ngờ đã xử lý: đệm chip lệch (R7), `Object.hasOwn` (R8), dòng CSS thừa `.bh-thanh-gio .bh-nut{color}` và `.bh-anh{font-weight;color}` (đã xoá), số dòng trích lệch 1 (đã sửa). Còn ghi Phát hiện: ảnh món phủ khung (món có ảnh hiện ô 96px, chủ quán nên thử tay), font chặn vẽ, mã món dài.
Nghiệm thu người soát đếm: 25/27, mục thiếu C1 (vạch vàng) — đã sửa; D3 chip đặc biệt (Topping / Nạp / Thẻ) không có ô icon: kế hoạch đã ghi, phiếu D3 chỉ đòi chip nhóm món.
CHƯA SOÁT ĐƯỢC (người soát): Chrome bị người gác chặn → việc chụp ảnh do phiên chính làm; tờ in Kho thật chưa đo.
BÀI HỌC (người soát) đã tiếp nhận ở mục Bài học cuối tệp.

## Soát độc lập — lần 2 (HEAD 1d1dd7b8) — ĐẠT (0 lỗi NẶNG; chỉ lỗi NHẸ)
Cả 6 lỗi lần 1 được xác nhận đã sửa đúng và không sinh lỗi mới (vạch vàng index.css:129 `left: 0`; 4 loại thẻ `bh-mon` đều có `.bh-chu-mon`; `.bh-to` chỉ 5 chỗ dùng, hai nút icon có `bh-nut-ic`; khối @media print so với 08392a6 đúng cho `.card-title` / `.table th` / body / h1–h6 / strong / td; KhungChonMon truyền nhóm; `.ql-the-o` có màu dự phòng). Nghiệm thu 20/21 (người soát chưa tự đo F5 — thử tay cho chủ quán).
Lỗi NHẸ người soát báo và xử lý:
- K3: bộ bắt "đỏ toàn cục" bỏ qua MỌI `@media` → ĐÃ SỬA (chỉ miễn `@media print`; ca 0g thêm "đỏ trong @media max-width → BỊ BẮT", vẫn 114 ca, 59/59 đột biến).
- K1: "195" là số DÒNG, 216 ký tự emoji → ĐÃ SỬA ở Phát hiện 1; lời bằng chứng đỏ mâu thuẫn (8 ca R đỏ trên bản chưa vá, 10 ca trên code trước vòng sửa) → ĐÃ SỬA.
- Ghi Phát hiện, không sửa: (a) `.btn-outline:hover { border-color: var(--dat) }` đè vạch nét đứt `.ql-nut` khi rê chuột — chỉ nhìn; (b) nhãn "Pha ngay" / "Còn n" vẫn hiện ở món chưa công thức / chưa giá (nút vẫn disabled, chữ "Chưa có công thức" vẫn có); (c) khẩu hiệu `font-style: italic` Playfair chỉ tải 600/700 thẳng → trình duyệt nghiêng giả (phiếu A3 chỉ định đúng bộ trọng số đó); (d) màu gõ cứng lặp trong CSS (`#fee2e2`, `#f3e3cf`, `#e7d5bf`, `#ecdcc6`, `rgba(232,196,106,…)`, `#931c1b`) — gom vào `:root` khi tiện (phiếu A1 chỉ cấm rải trong JSX); (e) logo 92 KB hiện 64px — làm bản 128px sau; (f) vòng đỏ số lượng trong giỏ ở thẻ món (D1): hàm `tpCanTrongGio` đã có nên làm được không thêm phép tính — để chủ quán quyết (Phát hiện 4 viết "chưa có số" là chưa chính xác: chưa HIỂN THỊ); (g) dải ⏳ việc kho kẹt ở thanh bên thụt hơn mục nav (margin 0.75rem + padding 0.875rem) — chưa chụp ảnh ở trạng thái có dải.
CHƯA SOÁT ĐƯỢC (người soát): tờ in Kho thật; dải việc kho kẹt khi nhiều mục; ảnh món thật (ô 96px giữa khung 120px); font tải chặn vẽ lúc mạng chậm; ảnh 820 và quanly_*.

## Bài học (bước 11)
**KHOÁ** (đã làm — file trong Phạm vi, có ca đỏ trước):
1. Ca R1–R8 (thu_GIAODIEN4.js) + 11 đột biến: mỗi lỗi lần 1 thành một ca (vạch vàng bị `overflow` cắt, thẻ mất khung, `.bh-to` quá rộng, khối in không phủ lớp, prop chết, màu thiếu biến, đệm chip lệch, `Object.hasOwn`).
2. Bộ bắt "đỏ toàn cục" chỉ miễn đúng `@media print` (3fac0bfa).
3. Cổng A16: bài mới phải in ĐỦ số ca ở cả bản gốc và bản vá (nhánh `else` ở B1a/D1) — làm cảnh báo lệch 99 ≠ 104 biến mất.
**NGUYÊN TẮC** — đề xuất cho chat soát (KHUON_LOI.md ngoài Phạm vi), mở K9 "bài thử CSS chỉ đọc chuỗi":
- K9 · Hiệu ứng nhô ra ngoài hộp (`::before` toạ độ âm, mask, bóng) bị `overflow` của tổ tiên cắt mà bài thử đọc-chuỗi vẫn xanh. Đã gây: vạch vàng thanh bên không hiện (soát lần 1). Dấu hiệu: `left/right/top` âm + tổ tiên có `overflow ≠ visible`. Chặn: ca đọc `overflow` của tổ tiên hoặc đặt trong hộp; mọi rule nhìn được phải có ảnh chụp (Chrome) trước khi báo xong.
- K4 (bổ sung): gỡ/đổi rule chung → duyệt MỌI nơi dùng cùng lớp (`.bh-mon` → Nạp/Thẻ; `.bh-to button` → 3 nhóm; khối in → mọi lớp trang in dùng, kể cả `.card-title`).
- K1 (bổ sung): ghi số kèm đơn vị (ký tự / dòng / file) và nói đúng phép đếm.
- K5 (bổ sung): bỏ một dòng chữ thay bằng nhãn từ hàm khác → liệt kê mọi trạng thái cũ còn hiện song song.
**BỎ**: lệnh bị người gác chặn (vòng `for`, `git stash`, lệnh ghép, chạy file có chữ SECRET khi chưa commit) và kho nông làm BH2/NDAPI1 đỏ giả — chỉ xảy ra vì môi trường, đã đổi lệnh / `--unshallow`.
**Dọn**: không đề xuất xoá lời dặn nào (chưa có phép kiểm thay). `KHUON_LOI.md` không bị đổi.
Ghi chú: CLAUDE.md §3 ghi "119 phép" của bản mẫu — `bash ban_mau_pos/chay_thu.sh` nay in 186 đạt (bản mẫu không sửa): chat cập nhật dòng này.

## Báo cáo 7 mục
```
VIỆC:        GIAO-DIEN-4 — Làm đẹp POS theo mẫu chủ quán duyệt: giữ đỏ · vàng · kem, sơn mài + bill giấy, icon thay emoji
ĐÃ SỬA:      client/src/index.css (biến màu :root, bỏ quy tắc đỏ toàn cục, nền kem + mây, thẻ giấy, nút, thanh bên sơn mài, thanh dưới, thẻ Quản lý, khối @media print giữ nguyên in) ·
             client/index.html (Google Fonts) · components/Layout.jsx (logo, KHAU_HIEU "Đông Y Dưỡng Thể", chân thanh bên) · components/TieuDeMan.jsx (mới) ·
             Refunds/Orders/Customers/Reports/DiscountCodes/Settings.jsx (chỉ dòng tiêu đề) · BanHang/AnhMon.jsx (hình ly theo nhóm) · tinh.js (nhanTon) ·
             BanHangMoi.jsx (thẻ món, chip nhóm, thẻ Nạp/Thẻ) · ThuTien.jsx (2 icon) · banHang.css (thẻ món, bill giấy, thanh giỏ) · KhungChonMon.jsx ·
             QuanLy/QuanLy.jsx + menu.js (icon + màu 6 nhóm) · client/dist (build lại) · cong_cu/thu_GIAODIEN4.js (mới) · cong_cu/thu_ANHMON1.js (H8/H9/H10/H12, LUAT §6.8) · kiem_tra_truoc_khi_giao.js (+1 dòng)
BÀI THỬ:     thu_GIAODIEN4.js chạy trên bản chưa vá (08392a6) → ĐỎ: 27 đạt · 87 hỏng / 114 ca (A1 :root --do undefined, A2a quy tắc trần còn đỏ, A4b .card còn backdrop-filter,
             F2a chưa có khối in, B1c 6 trang còn emoji, C1a chưa có khẩu hiệu, D1a chưa có nhanTon, D2c còn chữ "TT", D4a chưa có mask, E1b thiếu mau/icon …);
             sau khi vá → XANH 114 đạt · 0 hỏng. thu_ANHMON1 (bản sửa): chưa vá 73 đạt · 4 hỏng (H8/H9/H10/H12) → vá 77 đạt · 0 hỏng.
             Đột biến: 59 tên (VS-/BV-), 59/59 BẮT · 0 SỐNG · 0 LẠC · 0 HỎNG, có đối chứng XANH. npm test PASS 135 · FAIL 0 (CẢNH BÁO 1 có từ trước: packages.js:196 route GET ghi) ·
             --day-du PASS 139 · FAIL 0 · chay_thu.sh 186 đạt · 0 hỏng · cong.js chay: ✓ CỔNG CHẠY ĐẠT (HEAD f8b7e7e5)
ĐÃ RÀ K4:    grep emoji trong client/src/*.jsx → 216 ký tự / 195 dòng / 46 file (Phát hiện 1; 6 tiêu đề đã đổi, còn lại ngoài Phạm vi / Cấm / bị khoá bởi VOUCHER-2);
             grep `<AnhMon` → 4 chỗ gọi (BanHangMoi ×2, KhungChonMon, Kho/ToppingMon — Cấm, Phát hiện 9); grep `.bh-to` → 5 chỗ dùng (ThuTien ×3 nhóm, KhungGiao ×2) đã duyệt;
             grep `className="bh-mon"` → 4 loại thẻ, đều có .bh-chu-mon (ca R2); các lớp trang in Kho dùng (.card-title, h3/b/td/th) đã trả lại trong khối @media print
CHƯA KIỂM:   (1) Tờ in thật của Kho / bill / tem — chỉ so quy tắc CSS và không sửa 4 file in; chủ quán in thử 1 bill + 1 phiếu Kho. (2) Ảnh món THẬT trong ô 96px giữa khung 120px
             (ảnh chụp dùng dữ liệu giả, không ảnh). (3) Dải ⏳ việc kho kẹt ở thanh bên khi nhiều mục / màn thấp — chưa chụp ở trạng thái đó. (4) Phông Google tải lúc mạng chậm (chặn vẽ).
             (5) Thử tay trên điện thoại thật (F5). (6) Từng màn Cài đặt / Khách hàng / Báo cáo / Kho sau khi gỡ màu đỏ toàn cục — chỉ rà 6 tiêu đề + chụp Bán hàng / Quản lý.
             (7) 820 px kiểu "Tự động" chật (có từ trước, Phát hiện 5).
GIT:         f8b7e7e5 GIAO-DIEN-4: sua loi hoi hon ho so (don vi emoji, loi bang chung do) · 3fac0bfa GIAO-DIEN-4: bo bat do toan cuc chi mien dung @media print (soat lan 2), ca 0g chat hon
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 4 (đề xuất K9 + bổ sung K4/K1/K5) · BỎ 1 — chi tiết ở ## Bài học phía trên
```
F5 — 3 thao tác cho chủ quán thử tay: (1) máy tính: thanh bên đỏ sơn mài, logo + "Đông Y Dưỡng Thể", mục đang chọn có vạch vàng bên trái, icon thay emoji ở Đơn / Khách / Báo cáo;
(2) điện thoại: Bán hàng — thẻ món có hình ly (hoặc ảnh), chạm món vào giỏ như cũ, thanh giỏ đỏ đậm đúng tổng; (3) in thử một bill: tờ in giống hệt hôm nay.

✓ CỔNG CHẠY ĐẠT
HEAD ĐÃ KIỂM: f8b7e7e5
