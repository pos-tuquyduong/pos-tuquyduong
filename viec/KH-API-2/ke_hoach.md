# KH-API-2 — kế hoạch (CHỜ DUYỆT)

Đọc trong lượt này (main `68cbe9d`): `server/routes/kh/index.js` (181 dòng), `kh/loi.js`, `kh/quay.js`, `orders.js:430-500, 505-530,
630-735, 1240-1275`, `utils/uuDai.js`, `utils/flashState.js`, `utils/membershipStatus.js`, `routes/wallets.js:28-66` (`dangGiu`),
`routes/products.js:60-160` (`layMenuQuay`), `routes/signup-codes.js:1-200, 295-475`, `routes/settings.js:88-137`, `routes/tiers.js:1-45`,
`utils/helpers.js:128` (`getNow`), `Settings.jsx` (khung thẻ 984-1037), `kiem_tra_truoc_khi_giao.js:495-496`, `cong_cu/thu_KH1.js:1-60`,
`HOP_DONG_API_KH.md`, `QUYET_DINH_CHU_QUAN.md`.

## Hiện trạng đã kiểm (K1 — khác ghi chú của phiếu ở hai chỗ)
1. **G-500 ĐÃ đúng trên code gốc:** `signup-codes.js:318` và `:470` có `if (req.khach) return loiMayChu(...)`; `quaToken`
   (`kh/index.js:154`) truyền `khach`. Gọi qua `/api/kh` mà lỗi máy → đã trả 500 `LOI_MAY_CHU`. Dòng "Lỗi đã biết" của hợp đồng đã cũ.
   Việc còn lại của G: lời `MA_HET_HAN` ở `/claim` (`signup-codes.js:361` viết cứng "24 giờ", phép so dùng hằng `CODE_EXPIRE_HOURS = 24`
   dòng 29) — xem **Q1**. Ca G-500 trong bài thử là ca khoá hồi quy (xanh trên gốc), các ca G khác đỏ.
2. **Hợp đồng v1 thiếu 12 mã lỗi** hai cửa nhận mã trả thật (`NHANDIEM_DANG_TAT`, `MA_DA_NHAN_DIEM`, `BILL_CHUA_THANH_TOAN`,
   `BILL_SDT_KHAC`, `DON_DA_HUY`, `DON_DA_HOAN`, `DON_KHONG_DU_DIEM`, `DON_KHONG_HOP_LE`, `KHONG_THEM_DIEM`, `MA_KHONG_GAN_DON`,
   `TICH_DIEM_DANG_TAT`, `MA_TRUNG`) — H thêm vào, I có phép tĩnh canh.
3. Mã món giờ vàng (`flash_product_keys`) = `unique_id` `<type>_<id>` (`orders.js:516`, `products.js:103`) = trường `ma` của `/menu`.
4. Quầy: đơn dính giờ vàng KHÔNG giảm hạng (`orders.js:645` `if (!flashApplied && phone)`); hạng lấy % từ `pos_membership_tiers` theo
   `membership.tier_id` KHÔNG lọc `is_active` (`orders.js:649-652`).

## Phương án từng phần
| Phần | A (chọn) | B (không chọn) |
|---|---|---|
| A — % hạng | `server/utils/giaHang.js` (~25 dòng): `tiLeHangMon(hang, laNhomDacBiet)` (kẹp 0–90, `Number(..)\|\|0` y như `orders.js:660-663`) + `giaHangMon(gia, tiLe)` = **gọi `tinhUuDai`** một dòng `{unit_price: gia, quantity: 1, ti_le_hang}` lấy `gia_hang[0]`; `null` (tiLe 0, HOẶC tiền giảm làm tròn về 0 — vd giá 3 đồng, 12,5 % — `uuDai.js:22-23, 58`) → giá gốc. `orders.js`: 5 dòng `rawRate…set` → 1 dòng `tiLeHang.set(it, tiLeHangMon(tier, it.is_special_group))` (~7 dòng đổi kể cả require + bỏ chú thích cũ dời sang giaHang.js). | Chép `Math.round(gia*(1-t/100))` vào giaHang.js — hai chỗ giữ phép làm tròn, lệch được (trái "một quy tắc một hàm"). |
| B — `/toi` | Thêm ~18 dòng trong `kh/index.js`: `getMembershipStatus` + `isTierUsable` (CÙNG hàm `orders.js:647-648`) → SELECT hạng theo `tier_id` (không lọc `is_active`, như quầy) → `hang` hoặc `null`; `so_du_vi` = `balance − dangGiu(...)` (CÙNG hai nguồn `GET /wallets/:phone` dùng ở `wallets.js:43-48`, = số "khả dụng" quầy hiện), `Math.round`. | Gom "hạng dùng được của khách" thành hàm chung gọi cả từ `orders.js` — đổi `orders.js` > 15 dòng, chạm try/catch đường tiền. |
| C — `/hang` | ~10 dòng: `SELECT … WHERE is_active = 1 ORDER BY sort_order, card_price` (cùng thứ tự `tiers.js:25`), map tên trường. | — |
| D — `/gio-vang` | ~15 dòng: `readFlashState(query, getNow)`; `dang_chay = is_flash_now && percent > 0 && product_keys.length > 0` (cùng điều kiện `orders.js:511`); `bat_dau/ket_thuc` đổi `HH:mm` → giờ đầy đủ `YYYY-MM-DDTHH:mm:ss` bằng hàm `khungGio` của `gioHoatDong.js` (dùng chung với F, có qua nửa đêm); tắt / giờ sai → `bat_dau: null, ket_thuc: null, phan_tram: 0, mon: []`. | Trả nguyên `HH:mm` — trái câu chung của hợp đồng "mọi trường giờ là `YYYY-MM-DDTHH:mm:ss`". |
| E — `/menu` | ~8 dòng: đọc hạng đang bật MỘT lần, mỗi món `gia_hang = hạng.map(h => ({ hang_id, gia: giaHangMon(p.price, tiLeHangMon(h, p.is_special_group)) }))`; giá không phải số > 0 → `[]` (`/menu` đã lọc `sellable`, ca vẫn khoá). Hạng 0 % → `gia` = giá gốc. | Mỗi món một truy vấn hạng — N truy vấn. |
| F — giờ hoạt động | Lưu 4 khoá `pos_settings` (seed ở `database.js`, `INSERT OR IGNORE` như khối seed hiện có): `gio_hd_lich` (JSON `{ "2": {mo,dong} \| {nghi:true}, … "8": … }`, seed `''` = chưa cài), `gio_hd_ngay_nghi` (JSON `[{ngay,ly_do}]`, seed `'[]'`), `gio_hd_thong_bao` (seed `'Quán đang nghỉ — mở lại lúc {gio_mo_lai}'`), `gio_hd_ngung_truoc_phut` (seed `'0'`). `server/utils/gioHoatDong.js` (~130 dòng, thuần, không đọc DB): `docCaiDat(rows)`, `kiemCaiDat(settings)` (lỗi → chuỗi), `khungGio(ngay, mo, dong)`, `dangMo(bayGio, caiDat)` → `{ dang_mo, hom_nay, mo_lai_luc, thong_bao }`. Ngày tính bằng `Date.UTC` + `getUTCDay` trên chuỗi giờ VN → không phụ thuộc `TZ` máy chủ. `PUT /settings` (`settings.js`, ~6 dòng, cạnh phép `uudai_chung_hang_`): khoá `gio_hd_*` sai → 400 `CAI_DAT_KHONG_HOP_LE`, kiểm HẾT trước khi ghi. `GET /api/kh/gio-hoat-dong` ~10 dòng. | Bảng mới — phiếu cấm đổi cấu trúc DB. |
| F — giao diện | File mới `client/src/pages/CaiDat/GioHoatDong.jsx` (~170 dòng: 7 dòng thứ (mở/đóng/nghỉ), danh sách ngày nghỉ + lý do, ô câu thông báo có nút chèn `{gio_mo_lai}`, ô N phút, nút Lưu gọi `api.put('/settings', …)` qua `utils/api.js`); `Settings.jsx` +~8 dòng (nút thẻ "🕘 Giờ hoạt động" + nhánh render). | Viết thẳng vào `Settings.jsx` (2417 dòng) — trái LUAT §3 "file ~500 dòng → tách theo việc". |
| G | Theo trả lời **Q1** (≤ 4 dòng `signup-codes.js`). | — |
| H | Sửa `HOP_DONG_API_KH.md`: bảng cửa + khối máy đọc (`phien_ban: 2`, 4 cửa mới, trường mới của `/toi` + `/menu`), 12 + 1 mã lỗi (`CAI_DAT_KHONG_HOP_LE` không thuộc `/api/kh` → KHÔNG thêm), bỏ "Lỗi đã biết", ghi rõ "không có suất còn", "giá hạng là giá MỘT ly; đơn có món giờ vàng thì quầy không giảm hạng", nhật ký v2. Xoá dòng KH-API-2 khỏi "Đã hẹn". | — |
| I | `cong_cu/thu_HOPDONG_KH.js` (~170 dòng), khuôn `thu_KH1.js` (database.js thật + kho tạm, thay `ketNoiKho`, Express gắn `/api/kh` đúng như `server/index.js:121-122`): (1) đọc khối JSON giữa hai dấu `HOP_DONG_MAY_DOC`; (2) gọi TỪNG cửa (khách mẫu có hạng + ví + điểm + đơn + mã bill), đường `:ma` thay bằng mã đơn thật; mỗi đường `tra` (`a.b`, `data[].x`) phải có mặt; cửa `token: true` gọi không token → 401 `KH_TOKEN_SAI`, cửa `token: false` gọi không token → không 401; (3) mọi `code` thấy trong câu trả lời ∈ `ma_loi`; (4) quét tĩnh `kh/index.js` tìm `router.(get\|post\|put\|delete\|patch)('…')` — đường không có trong hợp đồng → ĐỎ, cửa hợp đồng không có route → ĐỎ; (5) quét tĩnh mã lỗi: khoá `LOI` của `loi.js` + `code: '…'` trong `signup-codes.js` dòng `kiemDonCuaMa`…`nhanMaUuDai` (trừ hai route quầy cuối) + `pinKhach.js` + `khachAuth.js` + `maKhach.js` → ∈ `ma_loi`. Giới hạn phép quét (K4 TU-CHAY-6): chỉ theo file liệt kê, không theo hàm phụ khác — ghi ở đầu bài. | Gộp vào `thu_KHAPI2.js` — phiếu đặt hai file, bài hợp đồng dùng lâu dài cho mọi việc sau. |
| Ghép bộ kiểm | `kiem_tra_truoc_khi_giao.js:495`: thêm `'cong_cu/thu_KHAPI2.js', 'cong_cu/thu_HOPDONG_KH.js'` vào mảng NGAY TRƯỚC `'cong_cu/thu_P3.js'` (thu_P3 giữ cuối). | — |

## Ước lượng dòng
Máy chủ ~250 (giaHang 25, gioHoatDong 130, kh/index 65, settings 6, database 6, signup-codes ≤ 4, orders ≤ 8 đổi) — dưới ngân sách 350.
Giao diện ~180 (ngân sách 200). Thử: `thu_KHAPI2.js` ~330 + `thu_HOPDONG_KH.js` ~170 = ~500 — **vượt ngân sách thử ~50 dòng**: phần I có
thêm phép quét tĩnh mã lỗi (mục 2 hiện trạng) mà phiếu chưa tính. Không vượt thì bỏ (5) — không khuyên, vì lỗ thiếu 12 mã chính là lỗi đó.

## Bài thử — ánh xạ 1-1 với Nghiệm thu
`cong_cu/thu_KHAPI2.js` (khuôn `thu_KH1.js`; đặt `process.env.TZ = 'UTC'` ở dòng đầu — cả bài chạy như Render; module chưa có → ca hỏng
riêng, không sập):
- **A1** `tiLeHangMon`: thường / đặc biệt / 95 → 90 / −5 → 0 / `null`, `'abc'` → 0 / `'12.5'` → 12.5.
- **A2** `giaHangMon(3, 12.5)` = 3 (tinhUuDai trả `null` vì giảm làm tròn về 0); `giaHangMon(45000, 12.5)` = 39375; `giaHangMon(33333, 15)` = 28333 (28 333,05 làm tròn xuống); `giaHangMon(10001, 15)` = 8501 (8 500,85 làm tròn lên); = `tinhUuDai(...).gia_hang[0]` trên 50
  cặp (giá, %) ngẫu nhiên có hạt cố định; tiLe 0 → giá gốc; **A2b** cùng 50 cặp = `giaHang(gia, %).hang` của màn bán `client/src/pages/BanHang/tinh.js:66-71` (nạp bằng `import()` — client là ESM; không nạp được thì ca ghi CHƯA KIỂM, không đếm là đạt).
- **A3 (phiếu "Bài thử đỏ")** khách hạng (% thường 12.5, % đặc biệt 7) mua 1 món thường + 1 món nhóm đặc biệt qua `POST /orders/tinh-thu`
  (không ghi) và `POST /orders` thật: `tier_unit_price` từng món = `gia_hang` của `/menu` (cùng khách, cùng hạng) — món đặc biệt dùng % riêng.
- **A4** hai `POST /orders` CÙNG LÚC của hai khách cùng hạng (`Promise.all`) → cả hai đúng giá hạng, tổng = công thức cũ (ca "hai người cùng bấm").
- **B1** `/toi` khách có hạng active → `hang` đủ 5 trường, `het_han` = `expires_at` của lần mua; **B2** hạng `expiring_soon` → vẫn có;
  **B3** hết hạn → `null`; **B4** chưa mua → `null`; **B5** `so_du_vi` = số dư − tiền phiên thanh toán đang giữ (dựng một dòng
  `pos_phien_thanh_toan` trạng thái `cho`); không có ví → 0; số nguyên; **B6** khách A (không hạng) đọc `/toi` → `hang: null`,
  `so_du_vi` của A — không lộ của B; **B7** trường cũ `sdt, ten, ngay_tao, qr` giữ nguyên.
- **C1** `/hang` không token → 200, hạng `is_active = 0` không có, đúng thứ tự `sort_order`; không có trường ngoài 6 trường.
- **D1** giờ vàng bật, khung chứa bây giờ (dựng từ `getNow`, qua nửa đêm nếu cần) → `dang_chay: true`, `mon` = keys, giờ đầy đủ;
  **D2** bật nhưng ngoài khung → `false`; **D3** tắt → `false`, `mon: []`; **D4** `percent` 0 → `false` (cùng điều kiện quầy);
  **D5** không token → 200; không có trường `suat`.
- **E1** mỗi món `/menu` có `gia_hang` đủ hạng đang bật, giá = `giaHangMon`; **E2** món nhóm đặc biệt dùng % riêng; **E3** trường cũ y nguyên
  (so khoá với v1); **E4** hạng 0 % → `gia` = giá gốc; **E5** hàm dựng gia_hang với giá `null` / 0 → `[]` (gọi thẳng hàm).
- **F1** `dangMo` thuần: trong giờ / trước mở / sau đóng; **F2** qua nửa đêm (18:00–02:00: 01:00 hôm sau mở theo lịch hôm trước; 03:00
  đóng); **F3** ngày nghỉ đặc biệt (`mo_lai_luc` nhảy sang ngày mở kế tiếp, kể cả nghỉ nhiều ngày liền); **F4** nghỉ cả ngày theo thứ;
  **F5** ngừng trước N phút: đúng `dong − N` → đóng, `dong − N − 1 phút` → mở (ca ngay trên / ngay dưới ngưỡng); N mặc định (không truyền)
  = 0; **F6** chưa cài → mở cả ngày, `thong_bao: ''`, `hom_nay: null`… (theo bảng trả); **F7** `thu` 2–7 / 8 = Chủ nhật (Chủ nhật 01.11.2026
  → `thu: 8`); **F8** `bay_gio` của cửa = giờ VN tính độc lập (`Date.now() + 7 giờ`), bài chạy `TZ=UTC`; mọi giờ khớp
  `^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$`; **F9** câu thông báo điền `{gio_mo_lai}`; **F10** `PUT /settings` khoá `gio_hd_*` sai (giờ `25:00`,
  JSON hỏng, N âm, ngày sai) → 400 `CAI_DAT_KHONG_HOP_LE`, không khoá nào được ghi; đúng → 200 và cửa đọc ra đúng; **F11** khoá khác
  (`uudai_chung_hang_percent` = '1', `invoice_policy`) vẫn lưu được (K5).
- **G1** `/api/kh/nhan-diem` và `/nhan-ma-bill` khi bảng `pos_signup_codes` bị đổi tên trong kho tạm → 500 `LOI_MAY_CHU`, `error` không
  chứa lời máy (`no such table`) — **khoá hồi quy, xanh trên gốc** (hiện trạng 1); **G2** mã `/claim` quá hạn → `MA_HET_HAN`, lời mang số
  giờ theo Q1 (cài 48 → lời có "48"); **G3** đường quầy `/api/pos/signup-codes/claim` lỗi máy vẫn 500 lời cũ (giữ nguyên).
- **I** = `thu_HOPDONG_KH.js` (mục I bảng trên). Đỏ trên gốc: 4 cửa mới + trường mới không có, 12 mã thiếu.
- **H** (cũng trong `thu_HOPDONG_KH.js`, phần chữ): dòng `PHIEN_BAN: N` = `phien_ban` của khối máy đọc; nhật ký có dòng `- vN ·`; mỗi cửa của khối máy đọc có một dòng trong bảng chữ (`` `PT /duong` ``); không còn chữ "Lỗi đã biết (sửa ở KH-API-2)"; cửa `/gio-vang` có câu "không có suất".
- **F-giao diện:** không có bài thử máy (CHƯA KIỂM); khoá bằng `(cd client && npm run build)` + `--day-du` (so băm `dist` với `src`) + 3 thao tác cho chủ quán thử tay trên điện thoại.
- **J (K5)** — luồng hợp lệ phải KHÔNG bị chặn / không đổi, mỗi luồng một ca: J1 quầy bán khách hạng (thường + đặc biệt) — A3;
  J2 khách không hạng giá gốc; J3 đơn dính giờ vàng KHÔNG giảm hạng (như cũ); J4 mã giảm + hạng: `thu_UUDAI1.js` xanh nguyên;
  J5 quầy `POST /orders` lúc ngoài giờ hoạt động (cài lịch nghỉ cả tuần) → 200; J6 nhận điểm ở quầy `/api/pos/signup-codes/nhan-diem` 200;
  J7 App v1: mọi cửa cũ qua bài I; J8 `thu_P26c`, `thu_gia_lap`, `thu_KH1`, `thu_DIEMTHAT1` xanh không sửa ca.
- Bài cũ KHÔNG sửa → không cần `## Bài thử cũ sửa`.

## Đột biến dự kiến (`viec/KH-API-2/dot_bien.py`)
| Chỗ vá | Đột biến (bài phải bắt) |
|---|---|
| giaHang `tiLeHangMon` | `VS-TILE-KHONG-KEP` (bỏ `Math.min(90…)`), `VS-TILE-NHOM-DB` (luôn dùng `discount_percent`) |
| giaHang `giaHangMon` | `VS-GIA-FLOOR` (`Math.floor` thay vì gọi tinhUuDai) |
| orders.js gọi hàm | `VS-ORDERS-KHONG-DB` (truyền `false` thay `it.is_special_group`) — A3 bắt món đặc biệt lệch `/menu` |
| `/toi` hạng | `BV-TOI-HANG` (bỏ trường), `VS-TOI-HET-HAN` (bỏ `isTierUsable`), `VS-VI-KHONG-TRU-GIU` (bỏ `dangGiu`) |
| `/hang` | `VS-HANG-CA-AN` (bỏ `is_active = 1`) |
| `/gio-vang` | `VS-GIOVANG-CHI-BAT` (`dang_chay = enabled`) |
| `/menu` | `BV-MENU-GIAHANG` (bỏ trường) |
| `dangMo` | `VS-DANGMO-GIO-MAY` (`new Date().getHours()`), `VS-DANGMO-NUA-DEM` (bỏ nhánh qua nửa đêm), `VS-DANGMO-NGUNG` (`>` thay `>=` ở ngưỡng ngừng), `BV-DANGMO-NGAY-NGHI` |
| `PUT /settings` | `BV-CAIDAT-KIEM` (bỏ phép `gio_hd_*`) |
| G | `VS-HETHAN-24` (lời viết cứng 24) |
| bài I | `VS-ROUTE-LA` (thêm `router.get('/la', …)` vào `kh/index.js`), `BV-HOPDONG-MA` (xoá một mã khỏi `ma_loi` trong bản sao hợp đồng) |
Mỗi đột biến chạy được từng tên, có đối chứng (bản chưa đột biến xanh); bài sập ≠ BẮT (K3).

## Đường song song phải canh (K4)
- % hạng: máy chủ CHỈ `orders.js:660-663` quyết (grep `discount_percent` trong `server/` ra thêm `tiers.js:55-62` = lưu cài đặt, không tính giá). Màn quầy tính lại để hiển thị ở `client/src/pages/BanHang/tinh.js:60-71` (`phanTramHang`, `giaHang`) và `Sales.jsx:176-186` — cả hai trong **Cấm**, không sửa; ca A2b canh `tinh.js` cùng kết quả.
  `tinh-thu` và phiên payOS đi qua `taoDon` cùng đoạn (chú thích `uuDai.js:3`) → một chỗ vá phủ cả ba.
- Điều kiện "đang giờ vàng": `orders.js:511`, `/gio-vang`, và màn quầy `Sales.jsx:147` (`is_flash_now && percent`, không xét `product_keys`; Cấm) — ba biểu thức; ca D4 canh cùng nghĩa. Không gom (ngoài ngân sách orders.js) — ghi Phát hiện.
- Số dư khả dụng `balance − dangGiu`: `wallets.js:48`, `orders.js:781`, `utils/giuCho.js:55`; `/toi` dùng cùng `dangGiu` + cùng cột `balance`.
- Cửa không token mới phải đứng GIỮA `router.use(canCauHinhKhach)` (`kh/index.js:35`) và `router.use(xacThucKhach)` (`:66`) — CHECKLIST B7 (middleware trước chỗ dùng); ca C1/D5/F8 gọi không token.
- `MA_HET_HAN`: hai chỗ (`signup-codes.js:182` nhận điểm đã theo cài đặt; `:361` claim viết cứng). Số giờ bill in đọc `Number(c.nhandiem_han_gio) || 24` (`orders.js:1257`), khác `docCauHinhNhanDiem` (`signup-codes.js:127-131`: `isFinite && > 0`) ở giá trị âm — Settings chặn ≤ 0 lúc lưu (`Settings.jsx:473`) nên chỉ lệch với dữ liệu nhập tay; ngoài phạm vi sửa `orders.js` (≤ 15 dòng) → Phát hiện.

## Câu hỏi cho chủ quán (trả lời cùng lúc duyệt)
- **Q1 — hạn mã ưu đãi khách mới (`/claim`, cũng là `nhan-ma-bill` của App).** Hiện phép so dùng hằng 24 giờ (`signup-codes.js:29, 360`) và
  lời viết cứng "24 giờ"; nhưng bill in hạn theo cài đặt hạn mã `nhandiem_han_gio` (`orders.js:1257`). Cài 48 giờ → bill hứa 2 ngày, máy
  từ chối sau 24 giờ.
  (a) **[khuyên]** phép so VÀ lời của `/claim` cùng lấy `docCauHinhNhanDiem().hanGio` (đúng số bill in). **Trái câu "Đường quầy giữ nguyên" của phiếu G** — `/claim` cũng là đường quầy `/api/pos/signup-codes/claim` (`signup-codes.js:325`); chọn (a) thì ca G3 đổi thành "quầy và App cùng hạn theo cài đặt";
  (b) chỉ đổi lời theo hằng `CODE_EXPIRE_HOURS` (không đổi hành vi, bill vẫn có thể hứa sai).
- **Q2 — `so_du_vi`** = số KHẢ DỤNG của ví riêng khách (số dư − tiền đang giữ cho phiên thanh toán chưa xong), như quầy hiện. Không cộng ví mẹ.
  Đồng ý? (khác: số dư thô `balance`.)
- **Q3 — `dang_mo` khi có "ngừng nhận đơn App trước giờ đóng N phút":** **[khuyên]** `dang_mo` = App nhận đơn được (đóng sớm N phút;
  KH-MUA-1 chặn theo đúng trường này), `hom_nay.dong` vẫn là giờ đóng thật. Khác: thêm trường riêng `nhan_don`.

## Không làm (ngoài phạm vi)
Đặt đơn App, topping, ô hồ sơ, đánh giá Google, sửa giờ UTC cũ, làm tròn giá hạng theo cài đặt (Phát hiện), gom điều kiện giờ vàng của `orders.js`.

## Soát kế hoạch (agent phụ chỉ đọc, 4 câu)
- Nhận: giá hạng `null` khi giảm làm tròn về 0 (A2 thêm ca giá 3đ); đường song song phía màn quầy (`BanHang/tinh.js`, `Sales.jsx`) + ca
  A2b; ba chỗ `balance − dangGiu`; vị trí cửa không token giữa dòng 35 và 66; Q1(a) trái "Đường quầy giữ nguyên" — ghi rõ trong Q1;
  H thiếu ca → thêm phép phần chữ; giao diện F không có bài máy → ghi CHƯA KIỂM + build + `--day-du`.
- Không nhận: bỏ (5) quét tĩnh mã lỗi — đó là phép bắt đúng lỗ 12 mã thiếu (ca chạy thật khó dựng đủ 25+ nhánh lỗi); bỏ F10 — phép chặn
  cài đặt hỏng là thứ giữ `dangMo` không gặp dữ liệu rác; bỏ A4 — luật kho: đụng đường tiền thì có ca hai người cùng bấm.
