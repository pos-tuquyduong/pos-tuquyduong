# NHOM-MON-1 — kế hoạch (CHỜ DUYỆT, chưa viết dòng code nào)

Đọc code thật ở HEAD `7238492` (main acc8892). Số dòng dưới đây là dòng vừa đọc lượt này; sẽ `grep` lại khi sửa (K1, K4).

## 0. Những gì đã đọc (bằng chứng)
- `pos_products.category TEXT NOT NULL` — `server/database.js:153`; chỉ mục `idx_product_category` — 616.
- Nơi ĐỌC category: `products.js:37–40` `layMenuQuay(category)`; `kh/index.js:41` `nhom: p.category`; `manKhach.js:112` `nhom: p.category`;
  `BanHangMoi.jsx:28 / 211 / 337–339 / 349`; `KhungChonMon.jsx:12–25` + `ghiChuMacDinh.js` (theo MÃ 'tea' / 'juice'); `Settings.jsx:1092–1104`;
  `SanPham.jsx:75 / 83 / 101 / 152`; `kho/duLieu.js:58` (danh sách Kho đọc p.category).
- Nơi GHI category: `products.js:83` (POST, mặc định 'juice'), `:99` (PUT), `:150 / :198 / :257` (chép từ SX: 'tea' / 'juice'),
  `kho/nhapSx.js:183` (ngoài Phạm vi — chèn `m.loai` = 'juice' / 'tea'), `database.js:1139` (hạt giống).
- Người gọi `layMenuQuay`: `products.js:27` (quầy), `kh/index.js:143` (/menu), `manKhach.js:111`, `donApp.js:154` (đơn App),
  `quang-cao.js:104` (danh sách món cho banner). Hai file CUỐI (`donApp.js`, `quang-cao.js`) KHÔNG nằm trong Phạm vi.
- Đơn App gọi món không bán: `donApp.js:154–158` — món không thấy trong `layMenuQuay` hoặc `!sellable` → `MON_KHONG_BAN` (mã có sẵn trong hợp đồng).
- Bước nâng cấp: số cao nhất hiện có là 032 (`server/nang_cap/`), bước viết theo khuôn `028_quang_cao.js` (CREATE TABLE IF NOT EXISTS, chỉ THÊM).
- Cửa quyền: các route sửa món dùng `authenticate, checkPermission('manage_settings')` (`products.js:73, 95`); Settings có mục `products: 'manage_settings'`
  (`Settings.jsx:40, 232, 948`).

## 1. Thiết kế (phương án A — ít dòng nhất, chọn)
**Giữ `category` làm mã nhóm** (không đổi cột, không đổi nghĩa `nhom`), thêm MỘT bảng `pos_nhom_mon`:
`id INTEGER PK, ma TEXT UNIQUE NOT NULL, ten TEXT NOT NULL, thu_tu INTEGER NOT NULL, hien_quay INTEGER NOT NULL DEFAULT 1, hien_app INTEGER NOT NULL DEFAULT 1, tao_luc TEXT NOT NULL`.

| Phần | File | Việc | Dòng ước |
|---|---|---|---|
| Nâng cấp | `server/nang_cap/035_nhom_mon.js` (mới) | tạo bảng; mỗi giá trị category khác rỗng → một nhóm (juice → "Nước ép", tea → "Trà", lạ → chính mã), thứ tự juice, tea, rồi theo mã; **luôn có đủ `juice` và `tea`** (đường chép SX gán 2 mã này); `INSERT OR IGNORE` nên chạy 2 lần không nhân đôi; không UPDATE / DELETE bảng cũ | ~30 |
| Hàm menu | `products.js` `layMenuQuay` | `LEFT JOIN pos_nhom_mon` thêm `nhom_ten, nhom_thu_tu, nhom_hien_quay, nhom_hien_app` (món chưa có nhóm — category '' hoặc mã lạ — coi như hiện cả hai chỗ, `nhom_ten` = category: giữ hành vi cũ, K5). Tham số mới `{ cho }` MẶC ĐỊNH không lọc → `quang-cao.js` và mọi người gọi cũ chạy nguyên (K6 / "tham số mặc định") | ~15 |
| Lọc App | `products.js` hàm `menuApp()` (xuất ra) | `layMenuQuay({cho:'app'})` lọc `hien_app` — MỘT chỗ lọc duy nhất | ~5 |
| Route nhóm | `products.js` | `GET /nhom` (đăng nhập), `POST /nhom`, `PUT /nhom/:ma` (tên, hai công tắc), `PUT /nhom-thu-tu` (cả danh sách mã, một giao dịch), `DELETE /nhom/:ma`, `GET /nhom/xem-truoc` (= `menuApp()` gom theo nhóm); ghi / xoá cần `manage_settings`. Đặt TRƯỚC `PUT /:id` | ~90 |
| Món theo nhóm | `products.js` POST `:83` + PUT `:99` | kiểm `category` là mã có thật TRONG CÙNG giao dịch; PUT ghi bằng `UPDATE … WHERE id=? AND EXISTS(SELECT 1 FROM pos_nhom_mon WHERE ma=?)` + kiểm `changes` (điều kiện chặn đua nằm ngay trong câu ghi — LUAT §5). POST không gửi category → vẫn mặc định 'juice' (K5) | ~15 |
| Chép từ SX | `products.js` `:150 / :198 / :257` | trước INSERT: `INSERT OR IGNORE` hai mã gốc (không dựa vào việc nhóm còn đó) | ~6 |
| Xoá nhóm | `products.js` | `DELETE FROM pos_nhom_mon WHERE ma=? AND NOT EXISTS (SELECT 1 FROM pos_products WHERE category=?)`, `changes=0` → 409 `NHOM_CON_MON`. Mã gốc `juice` / `tea` không xoá được (409 `NHOM_GOC`, xem câu hỏi Q1) | ~10 |
| Kênh App | `kh/index.js:41,143` | `nhom` GIỮ = mã; thêm `nhom_ten`, `nhom_thu_tu`; `/menu` gọi `menuApp()` | ~5 |
| Đơn App | — | **không sửa `donApp.js`** (ngoài Phạm vi): `dungItems` đã tra theo `layMenuQuay()`; vì `/menu` và đơn phải chung một danh sách, đổi mặc định không được. Cách đúng: `donApp.js` gọi `menuApp()` — cần thêm `server/utils/donApp.js` vào Phạm vi (xem Q2). Nếu không được thêm: chặn ở `kh/index.js` ngay trước `donApp` (đường đơn App vào qua route nào — sẽ đọc lại) | ~2 |
| Màn khách | `manKhach.js:111–112` | màn khách là màn Ở QUẦY (phản chiếu giỏ quầy) → lọc theo `nhom_hien_quay`, không theo App. Giữ `nhom` = mã | ~3 |
| Quầy | `BanHangMoi.jsx` | tab theo `nhom_thu_tu`, tên `nhom_ten`, bỏ `TEN_NHOM`, bỏ món / tab của nhóm `nhom_hien_quay=0`. Chỉ các dòng 28, 337–339, 349 (+ có thể 211 giữ) — ghi vào trang_thai cho TOPPING-1. Server GET `/api/pos/products` KHÔNG lọc (Settings và Kho cần thấy mọi món), chỉ trả thêm trường | ~15 |
| Kho | `SanPham.jsx:101` | ô gõ tay → `<select>` lấy `GET /pos/products/nhom` | ~10 |
| Cài đặt | `Settings.jsx` | mục "Nhóm món" trong Quản lý › "Giá bán & nhóm món" (cùng `manage_settings`): danh sách, sửa tên, Lên / Xuống, hai công tắc, Thêm, Xoá, khung "Xem trước". Sửa `Settings.jsx:1092–1104` bỏ so 'tea' / 'juice' cho nhãn (dùng `nhom_ten`). Thêm component nhỏ trong file (không đụng phần khác — GIAO-DIEN-2) | ~90 |
| Hợp đồng | `HOP_DONG_API_KH.md` | `nhom_ten`, `nhom_thu_tu`, luật lọc, PHIEN_BAN 18→19, nhật ký | ~15 |
| Báo App KH | `viec/NHOM-MON-1/BAO_APPKH.md` | một trang lời thường | — |
| `dist` | `client/dist/**` | build + `--day-du` | tự sinh |

Tổng code ≈ 250 dòng (đúng ngân sách).

**Phương án B (loại):** thêm cột `nhom_id` vào `pos_products` và bỏ chữ `category` → đổi 14 chỗ đọc, đổi nghĩa `nhom` của App KH, mất K5 ("App bản cũ"). Dài hơn gấp đôi, rủi ro cao.
**Phương án B' (loại):** server lọc quầy ở `GET /api/pos/products` — Settings / Kho đọc cùng endpoint sẽ mất món ở nhóm tắt (không đặt được giá). Lọc ở màn Bán hàng là đủ và đúng phiếu A4.

## 2. Ca thử — ánh xạ 1-1 với `## Nghiệm thu` (`cong_cu/thu_NHOMMON1.js`, kho TẠM, khuôn `thu_KHAPI3.js`)
- **A1** nâng cấp trên dữ liệu 'juice' / 'tea' / '' / NULL / mã lạ → đúng 3 nhóm (+ juice, tea); tên đầu đúng; hai công tắc = 1; chạy 2 lần không đổi; `category` các món KHÔNG đổi. Kho thiếu `pos_products` → bước bỏ qua êm.
- **A2** quyền: không đăng nhập → 401; thiếu `manage_settings` → 403 (POST / PUT / DELETE; GET danh sách cho mọi người đăng nhập). Sửa tên giữ mã; Lên / Xuống đúng thứ tự; danh sách mã thiếu / thừa → 400. Xoá nhóm còn món → 409 `NHOM_CON_MON`, nhóm rỗng xoá được. `xem-truoc` = đúng bộ món của `/api/kh/menu` (so BẰNG).
- **A3** PUT và POST món với category không có → 400 `NHOM_KHONG_CO` (hai ca); category hợp lệ → 200; POST không gửi category → 'juice'; chép từ SX (đường `:150 / :198 / :257` — gọi qua route thật) vẫn tạo được dù hôm đó đã xoá nhóm tea trống (nhóm được tự bảo đảm) — nếu Q1 chọn "chặn xoá" thì ca là "không xoá được".
- **A4** GET `/api/pos/products` có `nhom_ten`, `nhom_thu_tu`, `nhom_hien_quay`; nhóm tắt quầy vẫn trả đủ món (Settings cần). Màn Bán hàng: bài thử đọc mã nguồn — phần lọc / tab (khoá nhánh vẽ, không chỉ dò chuỗi) + đột biến.
- **A5** `/api/kh/menu`: nhóm tắt app → món biến; bật lại → về; có `nhom_ten`, `nhom_thu_tu`; `nhom` vẫn = mã; hai công tắc độc lập (tắt quầy, bật app → vẫn trong `/menu`); đơn App gọi món nhóm tắt app → `MON_KHONG_BAN`; màn khách theo quầy (tắt quầy → biến khỏi `/man-khach` menu, tắt app → còn).
- **A6** `thu_HOPDONG_KH.js` xanh với PHIEN_BAN 19; danh sách trắng trường món (`thu_KHAPI2.js:275`) sửa ĐÚNG dòng thêm hai trường, vẫn so BẰNG (LUAT §6.7).
- **A7** đổi tên nhóm → `/menu`, quầy, Kho đổi; `ghiChuMacDinh` (theo mã) / voucher nhóm ưu đãi (`pos_product_groups`) / đơn cũ / in lại không đổi.
- **Hai người cùng bấm:** (1) xoá nhóm ‖ tạo món vào nhóm đó → không bao giờ còn món mồ côi (một bên 409 hoặc 400); (2) hai người cùng sửa tên / đổi thứ tự → không hỏng thứ tự.
- **K5 — phải KHÔNG bị chặn:** món cũ 'juice' / 'tea' bán như cũ (tạo đơn 200); món category '' hoặc lạ chưa có nhóm vẫn hiện ở quầy / App; chép từ SX; voucher nhóm ưu đãi; App KH cũ chỉ đọc `nhom`; đơn cũ, in lại, đối soát; `quang-cao.js` vẫn thấy mọi món (tham số mặc định).
- **Đường song song (K4):** mọi chỗ ghi category (6 nơi ở §0, gồm `kho/nhapSx.js:183` + `database.js:1139`); mọi người gọi `layMenuQuay` (5 nơi); mọi chỗ vẽ `p.category` ở client (Settings, SanPham 152, BanHangMoi). `grep` lại trước khi sửa.

## 3. Đột biến (`dot_bien.py`, mỗi cái một dòng, đối chứng bản chưa đột biến xanh)
Phiếu: `VS-loc-app-theo-quay` · `VS-doi-ma-khi-sua-ten` · `VS-xoa-nhom-con-mon` · `VS-category-tu-do-lot` · `BV-bo-loc-app`.
Thêm: `BV-bo-kiem-nhom-put` · `BV-bo-kiem-nhom-post` · `VS-man-khach-theo-app` · `BV-bo-chan-xoa-nhom-goc` (nếu Q1 = chặn) · `VS-ca-hai-cong-tac-chung` (mở `hien_quay` bằng `hien_app`).

## 4. Rủi ro / cần chủ quán chốt (trả lời "đề xuất" — không dừng nếu duyệt đề xuất)
- **Q1 (đề xuất: chặn):** nhóm gốc `juice` / `tea` KHÔNG xoá được (409 `NHOM_GOC`) vì `kho/nhapSx.js:183` (ngoài Phạm vi) chèn món với 2 mã này. Nếu không chặn, đường nhập từ SX tạo món có category không có nhóm (món vẫn bán, chỉ mất tên nhóm).
- **Q2 (cần thêm Phạm vi):** `server/utils/donApp.js` — đơn App phải lọc nhóm tắt qua cùng hàm `menuApp()`. Không thêm file này thì phải chặn ở route (hai chỗ lọc = hai nơi lệch, trái luật "một quy tắc — một hàm"). Đề xuất: thêm `donApp.js` vào Phạm vi (đổi 1–2 dòng).
- **Q3 (đề xuất: đi theo quầy):** màn khách lọc theo "hiện ở quầy".
- Settings.jsx: GIAO-DIEN-2 chạy song song — bắt đầu từ main mới nhất, thêm component mới ở cuối file, chỉ chạm 1092–1104.
- Bước nâng cấp số 035 (033 / 034 chưa có trong kho; số không cần liền — phiếu cho phép).
- Soát bảo mật: có (cửa công khai `/api/kh/menu`) — sau bước 8.

## 5. Kết quả soát bởi agent phụ (đã nhận, đã chỉnh)
- Ngoài Phạm vi: chỉ `donApp.js` (đã nêu ở Q2). Năm file trong Phạm vi KHÔNG dùng: `kh/quay.js`, `orders.js`, `kho/duong.js`, `backup.js`, `chuanHoaGio.js` — giữ nguyên, không sửa.
- Rút gọn: bỏ `GET /nhom/xem-truoc`; khung xem trước gọi thẳng `/api/kh/menu` (không token vẫn được — KH-API-3). Hai cơ chế "bảo đảm juice/tea" và "chặn xoá NHOM_GOC" → chỉ giữ MỘT: chặn xoá `NHOM_GOC` (Q1), bỏ INSERT OR IGNORE ở `:150/:198/:257`.
- Ca thử bổ sung: kiểm `BAO_APPKH.md` có mặt + nhắc `nhom_ten`/`nhom_thu_tu`; sửa đúng dòng danh sách trường ở `thu_KHAPI3.js` / `thu_KHO3a.js` nếu chúng so bằng danh sách trường món (LUAT §6.7); mục "3 thao tác chủ quán thử tay" ghi ở báo cáo cuối.
- Đường sót đã thêm vào K4: `GET /products?category=` (`products.js:27`) giữ chạy (tham số cũ không đổi dạng); `client/src/components/InPhieu.jsx:15`, `InvoicePrint.jsx:98`, `utils/inPhieu.js:96` đọc `p.category` làm mã món pha — category vẫn là mã nên không đổi, có ca "in lại" canh; `kho/nhapSx.js:73/105` là category NGUYÊN LIỆU, khác nghĩa, không đụng.
