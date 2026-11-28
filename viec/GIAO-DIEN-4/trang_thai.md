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
