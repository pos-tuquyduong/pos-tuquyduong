# KH-MUA-1 — kế hoạch (chờ chủ quán duyệt)

**Nói ngắn:** khách đặt món trên App, trả bằng QR / ví / ví + QR. Máy chủ KHÔNG viết đường tiền mới: mọi số tiền đi qua `taoDon` (hàm tạo
đơn của quầy), mọi lần giữ / trừ ví và chốt đơn đi qua phiên thanh toán sẵn có (`taoPhien` / `chotPhien`, `server/utils/giuCho.js`).
Việc mới chỉ là một bảng nhỏ "đơn App" nối khách ↔ phiên thanh toán, các cửa App, và một danh sách + chuông ở quầy.

## 1. Hiện trạng đã đọc (lượt này)
| Điều | Chỗ |
|---|---|
| `taoDon(req, res, phien)` — `{chiTinh:true}` trả `{ total, chiTiet }`, không ghi; `{tinhThu:true}` bỏ gọi SX | `server/routes/orders.js:175`, `:825–831`, `:386` |
| `chiTiet` có `subtotal, flash_discount, tier_discount, discount_amount, total, cach, cau_ghi, ma_loi, ma_loi_code, items[]` | `orders.js:826–830` |
| total = subtotal − flash − hạng − mã + ship | `orders.js:735–738` |
| POST /orders/tinh-thu = taoDon chiTinh + tinhThu trên thân lọc TRUONG_TINH_THU | `orders.js:1264–1268` |
| Một số 4xx của taoDon KHÔNG có `code` ("Sản phẩm không tồn tại", "chưa có giá bán", "Không đủ hàng", gói / hạng không tồn tại, "Đang flash… voucher %") | `orders.js:365, 371, 393, 460, 488, 672` |
| `taoPhien(b, nguoi)`: giữ ví TRONG giao dịch; `SO_DU_KHONG_DU` / `CACH_KHONG_KHOP` → rollback (huy) không còn dòng phiên; PIN kiểm ngoài giao dịch | `server/utils/giuCho.js:32–85`, `wallets.js:127–137` |
| payOS lỗi khi tạo QR → phiên `loi` (nhả giữ), 502 | `giuCho.js:72–82` |
| `chotPhien` — cổng `cho → da_thu` còn hạn trong giao dịch tạo đơn; 4xx do đơn → phiên `loi` | `giuCho.js:88–120` |
| `dangGiu` chỉ đếm phiên `cho` còn hạn → hết hạn = tự nhả, không cần hẹn giờ | `server/routes/wallets.js:59–65` |
| `kiemPin` tăng đếm sai trước khi so (khoá sau N lần) — mã `CHUA_CO_PIN`, `PIN_DANG_KHOA`, `PIN_SAI` | `server/utils/pinKhach.js:42–54` |
| Webhook payOS: phiên không `cho` / hết hạn / lệch tiền → ghi `pos_payos_su_kien` `chua_khop` (Đối soát ĐỎ), không tạo đơn | `server/routes/thanh-toan.js:111–139` (chua_khop `:125–134`) |
| `dangMo(bayGio, cd)` → `dang_mo`, `nhan_don` | `server/utils/gioHoatDong.js:105–125` |
| `layMenuQuay()` → món có `unique_id = type_id`, `sx_product_type/id`, `sellable`, `stock_quantity`, `khong_quan_kho`; `monKhach` ra `con_hang` | `server/routes/products.js:32–113`; `server/routes/kh/index.js:38–43` |
| GET /api/kh/don, /don/:ma chỉ đọc pos_orders theo SĐT token | `kh/index.js:212–237` |
| Bộ đếm bộ nhớ `giuLuotBoNho` (trả true/false, không trả giây chờ) | `server/utils/maKhach.js:77–86` |
| Cài đặt: GET /api/pos/settings cho mọi nhân viên, PUT cần `manage_settings` | `server/routes/settings.js:40, 90` |
| Client gọi máy chủ qua `api.get/post` (chung) — không cần sửa `utils/api.js` (ngoài Phạm vi) | `client/src/utils/api.js:242` |
| Layout có sẵn khuôn "đài báo" hỏi theo nhịp 60 s | `client/src/components/Layout.jsx:40–44` |

## 2. Thiết kế — từng phần, phương án A / B

### P1. Bảng đơn App (bước nâng cấp 006)
- **A (chọn):** `server/nang_cap/006_don_app.js` tạo `pos_don_app`:
  `id, ma TEXT UNIQUE, phone, khoa_gui, than_bam, gio_bam, than TEXT, phien_id, tien_trinh_quay ('' | dang_lam | xong), nguoi_lam, luc_lam,
  nguoi_xong, luc_xong, tao_luc` + `UNIQUE(phone, khoa_gui)` + chỉ mục `(phone, tao_luc)`. **Không** cột tiền, **không** cột order_id: tiền ở
  phiên, đơn thật ở `pos_phien_thanh_toan.order_id` (một nguồn sự thật). `than` = bản chụp giỏ đã tính (ma, ten, so_luong, don_gia,
  thanh_tien, ghi_chu, giam[], tong) để App xem đơn chưa trả; KHÔNG chứa PIN. ~30 dòng. Chịu kho thử thiếu bảng: `CREATE TABLE IF NOT
  EXISTS`, không đụng bảng khác.
- B: thêm cột vào `pos_phien_thanh_toan` (khoa_gui, phone khách App…). Bỏ: trộn việc quầy với App, phải qua `themCot` + sao lưu bảng tiền.

### P2. Hàm nghiệp vụ `server/utils/donApp.js` (~170 dòng)
- `dungThan(mon, menu)` — mỗi `ma` tra trong `layMenuQuay()` (đúng danh sách `/menu` thấy): không có / `sellable` false → `MON_KHONG_BAN {ma}`;
  `monKhach().con_hang === false` hoặc `so_luong > stock_quantity` (món có quản kho, tồn là số) → `HET_HANG {ma}`. Ra `items[] { sx_product_type,
  sx_product_id, quantity, note }` cho taoDon. Không lộ số tồn. Tồn đổi giữa `/menu` và `checkStock` của taoPhien (`orders.js:386–395`, 400
  không code) → POST /don đổi riêng lời "Không đủ hàng: <tên>" thành `HET_HANG` kèm `ma` (dò theo tên món trong giỏ) — Q10.
- `kiemGio()` — đọc `gio_hd_%` như `/gio-hoat-dong`, `dangMo(getNow(), …)`: `!dang_mo` → `NGOAI_GIO`; `dang_mo && !nhan_don` → `QUA_GIO_NHAN_DON`.
- `tinhGio(than, khach)` — `taoDon({ body: {customer_phone, customer_name, items, discount_code} }, gomRes(), { chiTinh: true, tinhThu: true })`
  — CÙNG lời gọi tinh-thu. 4xx không `code` → gắn `DON_KHONG_HOP_LE`, giữ nguyên lời báo của taoDon. **Mã giảm làm taoDon 400 cứng**
  (mã % lúc Giờ vàng `orders.js:670–673`, `MA_KHONG_CO_MON` `:684–687`): báo giá tính LẠI một lần KHÔNG mã (cùng taoDon) và trả
  `ma_giam_loi { code, error }` của lần đầu (mã % lúc Giờ vàng → `code: 'MA_KHONG_AP_DUNG'`) — nghiệm thu A "mã không áp". POST /don làm
  CÙNG cách: đơn đặt theo đúng số báo giá (không mã) — Q10. Đổi `chiTiet` sang dạng App:
  `dong[] { ma, so_luong, don_gia = unit_price, thanh_tien = unit_price × SL }` (`chiTiet.items` không có thành tiền dòng — phép nhân này đúng
  công thức `itemTotal` của taoDon `orders.js:436`; bài thử A6 khoá Σthanh_tien = subtotal), `tam_tinh = subtotal`, `giam[]` từ `discount_amount → ma_giam`,
  `tier_discount → hang`, `flash_discount → gio_vang` (bỏ dòng 0), `phi_giao: 0`, `tong = total`. Tổng các dòng = tam_tinh, tam_tinh − Σgiam = tong
  (cùng công thức `orders.js:735–738`). Không phép tính tiền nào ở đây — chỉ đổi tên trường.
- `bamThan(b)` — sha256 của JSON chuẩn `{ mon (ma, so_luong, ghi_chu), ma_giam, cach_nhan, cach_tra }` (KHÔNG có pin) → `than_bam` (so khoá
  trùng) và `gio_bam` (= cùng thứ, dùng cho lưới 10 giây).
- `tienTrinh(dongApp, phien, order)` — MỘT vị từ cho mọi nơi đọc: phiên `cho` còn hạn → `cho_tra`; phiên `cho` hết hạn / `huy` / `loi` → `da_huy`;
  `da_thu`: đơn `cancelled`/`refunded` → `da_huy`, không thì `tien_trinh_quay || 'da_tra'`. Hết hạn KHÔNG cần ghi gì (dangGiu tự nhả — `wallets.js:62`).
- `giuLuotDat(khachId)` — trần lượt POST /don theo khách (hằng số có tên, đề xuất 10 lần / 10 phút), trả `{ ok, thu_lai_sau_giay }`. Viết riêng
  ~10 dòng vì `giuLuotBoNho` không trả số giây chờ và `maKhach.js` ngoài Phạm vi.
- B: dồn hết vào `routes/kh/index.js`. Bỏ: file đang 268 dòng, vượt ~500 (LUAT §3 tách theo việc).

### P3. Cửa App — `server/routes/kh/don.js` (mới, ~150 dòng), `index.js` `router.use(require('./don'))` sau `xacThucKhach`
- **POST /gio/bao-gia** — thứ tự: `cach_nhan !== 'tai_quan'` (`giao` → `CHUA_GIAO`, khác → `YEU_CAU_KHONG_HOP_LE`) → kiểm dạng `mon[]` → `kiemGio`
  → `dungThan` → `tinhGio`. Không ghi gì. `ma_giam_loi { code, error }` khi `ma_loi_code` có (MA_KHONG_TON_TAI / MA_KHONG_AP_DUNG) — và xem Q4.
- **POST /don** — thứ tự (mọi 4xx trước bước 6 không ghi gì):
  1. `khoa_gui` thiếu / sai `/^[A-Za-z0-9-]{16,64}$/` → `KHOA_GUI_SAI`.
  2. (tra khoá ĐỨNG TRƯỚC đếm lượt — gửi lại CÙNG khoá không bao giờ bị 429, nghiệm thu E)
  3. Tìm `pos_don_app (phone, khoa_gui)`: có, trong 24 giờ, `than_bam` bằng → 200 đơn đó `trung: true`; bằng mà khác thân → 409 `KHOA_GUI_DA_DUNG`;
     quá 24 giờ → 409 `KHOA_GUI_DA_DUNG` (khoá duy nhất trong CSDL mãi mãi — App sinh khoá mới mỗi lần bấm Đặt). Sau bước này mới
     `giuLuotDat` → 429 `QUA_NHIEU_LAN` + `thu_lai_sau_giay`.
  4. Kiểm thân như báo giá (`CHUA_GIAO`, `NGOAI_GIO`, `QUA_GIO_NHAN_DON`, `MON_KHONG_BAN`, `HET_HANG`), `cach_tra ∈ qr|vi|vi_qr` (sai → `YEU_CAU_KHONG_HOP_LE`).
     Trường tiền App gửi (`tong`, `don_gia`…) không được đọc — thân taoDon dựng mới từ danh sách trắng.
  5. Lưới thứ hai: đơn App cùng khách, cùng `gio_bam`, tạo trong 10 giây, phiên còn `cho` → trả đơn đó `trung: true`. Khoá mới KHÔNG lưu
     (UNIQUE một khoá một dòng) → App gửi lại khoá mới sau 10 s là đơn mới; App luôn gửi lại bằng khoá CŨ của lần bấm (hợp đồng ghi rõ).
  6. **Giữ khoá:** `INSERT pos_don_app (ma, phone, khoa_gui, than_bam, …, phien_id NULL)`. Đụng UNIQUE (yêu cầu song song cùng khoá) → 503
     `DANG_XU_LY` NGAY (5xx = chưa chắc kết quả, App gửi lại CÙNG khoá sau 2 s → bước 3 trả đơn cũ). Bỏ vòng chờ (soát kế hoạch: ngắn hơn, E vẫn
     "đúng một đơn"). `ma` = `A` + 8 ký tự ngẫu nhiên (crypto) — không đoán được.
  7. `taoPhien({ cach, don: { customer_phone, customer_name, items, discount_code, notes: 'Đơn App <ma> · nhận tại quán' }, tru_tai_khoan, pin }, 'app_kh')`:
     `qr → payos`; `vi → tai_khoan + tru_tai_khoan`; `vi_qr → payos + tru_tai_khoan`. Đổi mã: `SO_DU_KHONG_DU → VI_KHONG_DU`; PIN giữ mã của
     `kiemPin`. taoPhien 4xx → **xoá dòng giữ khoá** (dòng này không phải tiền) → số dòng bảng đơn App trước = sau.
  8. `vi`: `chotPhien(phien, 'tai_khoan', { nguoi: 'app_kh' })` ngay. Đọc lại phiên: `da_thu` → thành công (kể cả khi lời gọi trả lỗi sau
     commit). Không `da_thu` → huỷ phiên nếu còn `cho` (nhả ví) + xoá dòng giữ khoá + trả lỗi của chốt (xem Q8).
  9. Ghi `phien_id` vào dòng đơn App. Trả `{ ma_don, tong, giu_vi, con_lai, tien_trinh, qr { chuoi: phien.qr, het_han } | null }`.
  - Mọi `throw` (kho bận → 409 `KHO_BAN`, 5xx) sau bước 6 và trước bước 9: `finally` xoá dòng giữ khoá nếu chưa thành công; phiên đã tạo mà chưa
    xong → huỷ (`UPDATE … SET trang_thai='huy' WHERE id=? AND trang_thai='cho'`).
- **GET /don** — MỘT câu `UNION ALL`: đơn quầy/đơn thật (`pos_orders` theo SĐT, LEFT JOIN đơn App qua phiên để lấy `ma` App) + đơn App chưa có đơn
  thật (`phien_id` có, phiên không `da_thu`); `ORDER BY ngay DESC`, phân trang như cũ. Giữ đủ trường cũ, thêm `tien_trinh` (đơn quầy:
  `xong`, huỷ / hoàn → `da_huy`). Đơn App chưa có đơn thật: `trang_thai`, `thanh_toan` = `null`, `da_tra` = 0.
- **GET /don/:ma** — tìm theo `pos_orders.code` (như cũ) hoặc `pos_don_app.ma`, LUÔN kèm điều kiện SĐT token → khách khác 404 `KHONG_THAY_DON`.
  `mon[]` thêm `ma` (JOIN `pos_products` lấy `type_id`; dòng gói / thẻ `ma: null`); đơn chưa trả đọc từ `than`. Thêm `tien_trinh`,
  `qr` (`cho_tra` → `{ chuoi, het_han }` của phiên, khác → `null`), giờ đều `YYYY-MM-DDTHH:mm:ss` (cột phiên / đơn đã là giờ VN qua getNow).
- **Lối quầy vào phiên App** (soát kế hoạch): `/phien/:id/huy` (`thanh-toan.js:60`) huỷ được phiên App → đơn App `da_huy` (cùng `tienTrinh`), ví
  nhả — chấp nhận, như quầy huỷ phiên quầy; `xac-nhan-tay` (`:70`, quyền `xac_nhan_ck_tay` + lý do) chốt phiên App → đơn thật, `da_tra` → hiện
  ở quầy. Không chặn: là đường chủ quán xử lý tiền về mà webhook lỡ. Bài thử G5, H6 khoá hai lối này.
- **POST /don/:ma/huy** — đơn của chính khách; phiên `cho` → `UPDATE … 'huy' WHERE id=? AND trang_thai='cho'` (đua với webhook: một bên thắng);
  `da_thu` → 400 `DA_TRA_GOI_QUAN`; đã `da_huy` → 200 `tien_trinh: 'da_huy'` (Q5).
- B: viết thêm vào `index.js`. Bỏ (cỡ file, như P2).

### P4. Quầy — máy chủ: thêm vào `server/routes/kh/quay.js` (đã gắn `/api/pos/kh`, token nhân viên) ~40 dòng
- `GET /don-app` — đơn App đã trả (phiên `da_thu`) trong hôm nay + đơn chưa `xong` từ trước: `id, ma, ma_bill, gio, mon[] (ten, so_luong, ghi_chu),
  ten_khach, da_tra, cach_tra (vi / qr / vi_qr + số mỗi phần từ phiên), tien_trinh, nguoi_lam, luc_lam, nguoi_xong, luc_xong`. Đơn chưa trả không có.
- `POST /don-app/:id/dang-lam`, `/xong` — câu ghi có điều kiện (`tien_trinh_quay = ''` → `dang_lam`; `dang_lam` → `xong`), `changes ≠ 1` → 409
  `DA_DOI_TIEN_TRINH`; ghi `req.user.username` + `getNow()`. Không đụng tiền.
- B: route mới `server/routes/don-app.js`. Bỏ: phải gắn ở `server/index.js` (ngoài Phạm vi). Ghi chú: `canCauHinhKhach` chỉ gắn riêng `/cap-ma`
  (`quay.js:13`) → hai cửa mới KHÔNG gắn nó: chưa cài khoá ký token khách thì quầy vẫn xem đơn App.

### P5. Quầy — giao diện (~200 dòng), không đụng Sales.jsx / BanHang/**
- `client/src/components/DonAppNoi.jsx` (~90): hỏi `GET /kh/don-app` mỗi 15 s (Render ngủ → nhịp chỉ chạy khi có máy mở; không websocket); huy hiệu
  số đơn `da_tra` chưa bấm "Đang làm" ở sidebar + thanh dưới điện thoại (gắn trong `Layout.jsx`, 2–3 dòng), bấm → `/don-app`. Chuông: chỉ khi
  `localStorage.may_o_quan === '1'` và cài đặt bật; nhớ `id` lớn nhất đã kêu trong `localStorage` → tải lại trang không kêu lại; lần đầu bật
  máy chỉ ghi mốc, không kêu dồn đơn cũ. Tiếng tạo bằng Web Audio (2–3 kiểu), không tệp, không thư viện. Đọc/ghi `localStorage` bọc try/catch.
- `client/src/pages/DonApp.jsx` (~80) + `App.jsx` thêm route `don-app`: danh sách (mã, giờ, món + ghi chú, tên khách, đã trả bao nhiêu bằng gì),
  nút "Đang làm" → "Xong"; công tắc "Máy ở quán" (mặc định tắt, lưu riêng máy) + nút "Thử chuông".
- `client/src/components/CaiDatChuong.jsx` (~40) gắn một dòng vào `Settings.jsx`: bật / tắt, chọn tiếng, âm lượng → khoá `pos_settings`
  `don_app_chuong_bat`, `don_app_chuong_tieng`, `don_app_chuong_am_luong` qua PUT /settings sẵn có. `settings.js` thêm kiểm giá trị 3 khoá
  (~8 dòng: bật 0/1, tiếng trong danh sách, âm lượng nguyên 0–100). Thiếu khoá → mặc định bật / tiếng 1 / 70.
- Build `client/dist` (P1).
- B: một trang duy nhất không huy hiệu. Bỏ: phiếu H đòi thấy từ mọi màn.

### P6. Hợp đồng v5 — `HOP_DONG_API_KH.md` + `cong_cu/thu_HOPDONG_KH.js`
- Bảng cửa + khối máy đọc: `POST /gio/bao-gia`, `POST /don`, `POST /don/:ma/huy`; `/don`, `/don/:ma` thêm `tien_trinh`, `mon[].ma`, `qr`.
- Mã lỗi mới: `CHUA_GIAO`, `NGOAI_GIO`, `QUA_GIO_NHAN_DON`, `HET_HANG`, `MON_KHONG_BAN`, `KHOA_GUI_SAI`, `KHOA_GUI_DA_DUNG`, `DANG_XU_LY`,
  `CACH_KHONG_KHOP`, `VI_KHONG_DU`, `CHUA_CO_PIN`, `PIN_SAI`, `PIN_DANG_KHOA`, `DA_TRA_GOI_QUAN`, `DON_KHONG_HOP_LE`, `PAYOS_CHUA_CAU_HINH` 503,
  `PAYOS_LOI` 502 (+ `MA_KHONG_TON_TAI` / `MA_KHONG_AP_DUNG` trong `ma_giam_loi`). Mục "Luật 4xx", `khoa_gui`, `tien_trinh`, "Tiền về muộn".
  Bỏ dòng "Đã hẹn … NGOAI_GIO_HOAT_DONG" (phiếu chốt tên `NGOAI_GIO` / `QUA_GIO_NHAN_DON` — đã báo App ở TRA_LOI_POS_31102026). Sửa chú thích
  đầu `gioHoatDong.js` cùng tên? — file ngoài Phạm vi → ghi Phát hiện. Nhật ký v5. Không xoá / đổi tên trường cũ.

### P7. Tiền về muộn / lệch (nghiệm thu I) — KHÔNG sửa `thanh-toan.js`
- Webhook đã: phiên `huy` / hết hạn / lệch tiền → `pos_payos_su_kien` `chua_khop` (Đối soát ĐỎ), không tạo đơn ngầm (`thanh-toan.js:125–134`).
- Đơn App lúc đó hiện `tien_trinh: 'da_huy'` + `tien_ve_cho_doi_soat: true` (đọc có dòng `chua_khop` cùng `ma_payos` của phiên — một câu đọc,
  không ghi) để App báo "Quán đã nhận tiền, nhân viên sẽ liên hệ" (Q6). Không hoàn tự động (hoàn là việc của Đối soát hiện có).

## 3. Ngân sách
| Phần | Dòng ước | Phiếu |
|---|---|---|
| máy chủ: donApp.js 170 · kh/don.js 150 (−25 dời từ index.js) · quay.js 40 · 006 30 · settings.js 8 | ~375 | ~350 (vượt ~7 %: chờ khoá song song + huỷ phiên khi chốt hỏng, cả hai phục vụ nghiệm thu D/E) |
| giao diện: DonAppNoi 90 · DonApp 80 · CaiDatChuong 40 · Layout/App/Settings ~6 | ~215 | ~200 |
| thử: thu_KHMUA1.js ~450 · thu_HOPDONG_KH.js ~20 · thu_KH1 / thu_KHAPI3 sửa danh sách trường nếu có | ~480 | ~450 |

## 4. Ca thử — `cong_cu/thu_KHMUA1.js` (khuôn thu_KHAPI3 + payOS giả của thu_P3: kho tạm, SX tắt, `TZ=UTC`)
| Nghiệm thu | Ca |
|---|---|
| A | A1 giỏ có hạng + mã + Giờ vàng (ba giỏ riêng, vì Giờ vàng tắt hạng): `bao-gia` == `POST /orders/tinh-thu` cùng giỏ (tam_tinh, từng giam, tong); A2 dòng 0 không có; A3 mã sai → không dòng `ma_giam` + `ma_giam_loi.code`; A4 đếm mọi bảng trước = sau; A5 `giao` → 400 `CHUA_GIAO`, `cach_nhan` lạ / thiếu → `YEU_CAU_KHONG_HOP_LE`; A7 mã % lúc Giờ vàng và `MA_KHONG_CO_MON` → 200, không dòng `ma_giam`, có `ma_giam_loi`; A8 `phi_giao === 0`; A6 Σthanh_tien = tam_tinh, tam_tinh − Σgiam = tong |
| B | B1 lịch đóng → `NGOAI_GIO`; B2 trong khung ngừng nhận → `QUA_GIO_NHAN_DON`; B3 ngay trước mốc ngừng (còn nhận) → 200 (ca ngay trên / ngay dưới ngưỡng); B4 `con_hang:false` → `HET_HANG` + `ma`; B5 SL > tồn → `HET_HANG`; B6 mã lạ / giá 0 → `MON_KHONG_BAN`; mỗi ca chạy cho CẢ bao-gia lẫn POST /don |
| C | C1 qr → phiên `payos`, `tien_trinh: cho_tra`, `qr.chuoi`; C2 vi đủ → đơn thật `da_tra`, ví trừ đúng tong; C3 vi_qr → `giu_vi` = số dư, `con_lai` = phần còn, payOS nhận đúng `con_lai`; C4 ví đủ + vi_qr → `CACH_KHONG_KHOP`; C5 ví thiếu + vi → `VI_KHONG_DU`; C6 PIN sai → `PIN_SAI` và `pin_sai` +1; C7 thân gửi `tong: 1`, `don_gia: 1` → bị bỏ qua (tong = báo giá); C8 `CHUA_CO_PIN`, `PIN_DANG_KHOA` (sau N lần sai); C9 `qr.het_han` = `het_han` phiên, đúng dạng giờ VN; C10 SX báo thiếu hàng lúc tạo phiên → `HET_HANG` + `ma` |
| D | D1 với MỖI mã 4xx của POST /don (gồm 429 có `thu_lai_sau_giay`, `KHO_BAN` dựng bằng khoá ghi): đếm `pos_orders`, `pos_don_app`, phiên `cho`, `dangGiu` trước = sau |
| E | E1 gửi lại cùng khoá cùng thân → cùng `ma_don`, `trung: true`, `dangGiu` không đổi; E2 cùng khoá thân khác → 409 `KHOA_GUI_DA_DUNG`; E3 thiếu khoá / 15 ký tự / 65 / có `_` → `KHOA_GUI_SAI`; 16 và 64 → qua (ngay trên/dưới ngưỡng); E4 khoá khác, cùng giỏ, trong 10 s → `trung`; 11 s → đơn mới; đơn trước đã trả / đã huỷ → đơn mới; khác chỉ `ghi_chu` hoặc `cach_tra` → đơn mới; E5 hai yêu cầu song song cùng khoá → một `pos_don_app`, một phiên, yêu cầu thua 503 `DANG_XU_LY`, gửi lại → `trung`; E6 cùng khoá sau 24 giờ (lùi `tao_luc`) → 409 `KHOA_GUI_DA_DUNG`; E7 khách B dùng đúng khoá của A → đơn mới của B (khoá theo khách); E8 hết lượt (429) mà gửi lại khoá cũ → vẫn 200 `trung` |
| F | F1 GET /don thấy đơn App `cho_tra`; F2 `/don/:ma` `mon[].ma`, `qr` khớp lúc tạo; F3 `da_tra` → `qr: null`; F4 lùi `het_han` → `da_huy`, `dangGiu` về 0; F5 khách B đọc đơn của A → 404; F6 giờ ở cả `/don` lẫn `/don/:ma` khớp `^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$`; F7 đơn quầy cũ vẫn đủ trường cũ + `tien_trinh: xong`; F8 quầy bấm Đang làm / Xong → App thấy `dang_lam` / `xong` |
| G | G1 huỷ `cho_tra` → `da_huy`, ví nhả (cả `vi_qr`); G2 đơn đã trả → 400 `DA_TRA_GOI_QUAN`; G3 khách B huỷ đơn A → 404; G4 huỷ đơn đã `da_huy` → 200 (Q5); G5 quầy `/phien/:id/huy` phiên App → `da_huy` |
| H | H1 webhook đúng chữ ký → đơn thật, `GET /api/pos/kh/don-app` có đơn (mã, món + ghi chú, tên, đã trả + cách); H2 đơn `cho_tra` KHÔNG có; H3 Đang làm → Xong ghi người + giờ, bấm lại → 409; H4 không token nhân viên → 401; H5 PUT /settings 3 khoá: sai giá trị → 400, đúng → lưu; H6 `xac-nhan-tay` phiên App → đơn thật hiện ở quầy. Giao diện (công tắc, chuông không kêu lại): **chủ quán thử tay** — ghi ở CHƯA KIỂM |
| I | I1 phiên đã huỷ, webhook đúng số → `chua_khop`, không đơn mới, đơn App `da_huy` + `tien_ve_cho_doi_soat: true`; I2 tiền về lệch số → như trên; I3 tiền về ĐÚNG hạn nhưng chốt hỏng vì đơn (hết hàng / Giờ vàng vừa hết làm lệch tổng) → phiên `loi`, `chua_khop`, đơn App `da_huy` + cờ; I4 `vi_qr` hết hạn rồi tiền QR về → ví đã nhả, `chua_khop`, không trừ ví |
| J | `thu_HOPDONG_KH.js` xanh với v5 (khối máy đọc ↔ code) |
| K | K1 bảng số chụp: cùng giỏ mẫu chạy POST /orders, tinh-thu, phiên quầy tiền mặt + tài khoản → ghi `total`, ví, điểm, hạng trên code GỐC (lưu ở `bang_chung_do.txt`), sau vá so BẰNG từng số; cùng lúc chạy lại bộ cũ (thu_P3, thu_UUDAI1, thu_P26b, thu_KH1, thu_KHAPI2/3, thu_DOISOAT1); K2 không token → 401 ở 4 cửa mới; K3 lượt thứ N+1 trong cửa sổ → 429, khách khác vẫn qua |
| Hai người cùng bấm | E5 (cùng khoá song song); G4 huỷ và webhook cùng lúc → đúng một kết quả (đơn thật HOẶC huỷ + chua_khop), ví không trừ hai lần |

**Đường song song cần canh (K4):** mọi lối ra 4xx của POST /don (trước giữ khoá · sau giữ khoá · sau taoPhien · sau chotPhien · ném lỗi) phải
dọn đúng; `tienTrinh` dùng MỘT hàm cho GET /don, /don/:ma, POST /don, huỷ, quầy; mã đơn tìm theo cả `code` và `ma` App ở /don/:ma và /huy
(cùng điều kiện SĐT); `SO_DU_KHONG_DU` đổi tên ở MỌI chỗ App nhận (tạo phiên VÀ chốt).

**Luồng hợp lệ KHÔNG bị chặn (K5):** quầy POST /orders (không giờ hoạt động, không bảng mới); phiên thanh toán quầy (tạo / chốt / huỷ / xác nhận
tay / webhook phiên quầy); tinh-thu; GET /api/kh/don cho khách chỉ có đơn quầy; đơn App lúc mở cửa chưa cài lịch (mở cả ngày); món
`khong_quan_kho` (con_hang true dù tồn null); món tồn `null` (chưa rõ) — KHÔNG chặn `HET_HANG` (Q7); khách có cả đơn quầy lẫn App (phân trang
trộn đúng thứ tự).

**Đột biến dự kiến (`dot_bien.py`, bước 4):** BV-bo-kiem-gio · VS-gio-chi-dang-mo (chặn theo dang_mo thay nhan_don) · BV-bo-xoa-giu-khoa ·
VS-than-bam-co-pin · BV-bo-luoi-10-giay · VS-tin-tong-app · BV-bo-dieu-kien-sdt-don · BV-bo-huy-phien-khi-chot-hong · VS-con-hang-null-la-het ·
BV-bo-503-khoa-song-song · VS-dem-luot-truoc-tra-khoa · VS-tien-trinh-het-han-van-cho-tra · BV-quay-thay-don-cho-tra.

## 5. Ngoài Phạm vi / không làm
- Không sửa `orders.js`, `giuCho.js`, `thanh-toan.js` (đủ dùng như đang có) — giữ trong Phạm vi phòng khi soát thấy cần.
- Không topping / combo / giao / đổi điểm (chỉ để chỗ trống `phi_giao: 0`, `cach_nhan`).

## 6. Rủi ro
- Render ngủ: phiên hết hạn vẫn tự nhả theo đồng hồ (không hẹn giờ) — đã sẵn.
- Đợi khoá song song trong yêu cầu HTTP tối đa 15 s — payOS chậm hơn thì trả 503 `DANG_XU_LY`, App gửi lại cùng khoá.
- Hai khoá khác nhau, cùng giỏ, gửi cùng lúc (cùng mili-giây) — lưới 10 giây có thể lọt cả hai (không có ràng buộc DB cho lưới hai). Ghi CHƯA KIỂM.

## 7. Phát hiện (ngoài Phạm vi, không sửa)
- Chú thích đầu `server/utils/gioHoatDong.js:2–3` và hợp đồng v3 "Đã hẹn" ghi mã `NGOAI_GIO_HOAT_DONG`; phiếu chốt `NGOAI_GIO` +
  `QUA_GIO_NHAN_DON`. Hợp đồng sửa trong việc này; chú thích `gioHoatDong.js` cần sửa ở việc sau.
- Sáu 4xx của taoDon không có `code` (`orders.js:365, 371, 393, 460, 488, 672`) — App nhận `DON_KHONG_HOP_LE` thay; thêm `code` thật nên làm ở việc sau.

## 8. Cần chủ quán xác nhận (mỗi câu có đề xuất)
- **Q1** Máy không kéo được `main` (người gác) nên không biết KH-SP-1 đã gộp chưa. Đề xuất: làm theo phiếu — hợp đồng **v5**, bước **006**; lúc
  gộp nếu lệch thì chat sắp số.
- **Q2** Cài đặt âm thanh (bật / tiếng / âm lượng) chung CẢ QUÁN (Cài đặt, quyền quản lý); "Máy ở quán" riêng từng máy. Đề xuất: đúng như vậy.
- **Q3** Chọn `vi_qr` khi ví = 0đ. Đề xuất: cho qua như `qr` (giữ 0đ) — không bắt khách bấm lại.
- **Q4** Mã hợp lệ nhưng máy chọn giá hạng vì lợi hơn (`cach: hang`). Đề xuất: không dòng `ma_giam`, có `ma_giam_loi { code: 'MA_KHONG_LOI_HON',
  error: <câu "Dùng giá hạng … lợi hơn …"> }` để App giải thích.
- **Q5** Huỷ một đơn đã `da_huy` (hết hạn / đã huỷ). Đề xuất: 200 trả `tien_trinh: 'da_huy'` (bấm lại không báo lỗi).
- **Q6** Tiền về sau khi đơn đã huỷ / hết hạn: App hiện `da_huy` + cờ `tien_ve_cho_doi_soat` ("Quán đã nhận tiền, nhân viên sẽ liên hệ"); hoàn qua
  Đối soát như hiện nay. Đề xuất: đồng ý.
- **Q7** Món tồn "chưa rõ" (`con_hang: null`, SX mất kết nối, chưa từng biết số). Đề xuất: KHÔNG chặn (như quầy vẫn bán); chỉ chặn khi
  `con_hang === false` hoặc SL vượt tồn đã biết.
- **Q8** Trả ví đủ: hiếm khi chốt hỏng sau khi đã tạo phiên (vd hết hàng đúng lúc đó) → phiên chuyển `loi`/`huy`, không giữ tiền nào, nhưng còn MỘT
  dòng phiên trong sổ (sổ tiền chỉ thêm, không xoá). Đề xuất: "phiên" trong luật 4xx đếm theo phiên ĐANG GIỮ (`cho`) — đồng ý?
- **Q9** Trần lượt POST /don: đề xuất 10 lần / 10 phút mỗi khách (gửi lại cùng khoá không tính).
- **Q10** Mã giảm không dùng được cho giỏ (mã % lúc Giờ vàng, mã giảm một món mà giỏ không có món đó): quầy báo lỗi cả đơn; App đề xuất đặt
  KHÔNG mã + báo `ma_giam_loi` (khách thấy tổng thật trước khi bấm). Hết hàng phát hiện muộn ở SX → `HET_HANG`. Đề xuất: đồng ý.

## 9. Soát kế hoạch (agent phụ chỉ đọc, 31.10)
- (1) Phạm vi / Cấm: không ra ngoài. Nêu phép nhân `thanh_tien` → đã ghi rõ là đúng công thức `itemTotal`, bài thử khoá.
- (2) Ngắn hơn: bỏ vòng chờ khoá song song → NHẬN (503 ngay). Bỏ cờ `tien_ve_cho_doi_soat` → GIỮ, chờ Q6. Bỏ kiểm 3 khoá cài đặt → GIỮ
  (8 dòng; âm lượng ngoài 0–100 làm Web Audio lỗi im lặng).
- (3) Ca thiếu: đã thêm A7, A8, C8–C10, E3 thiếu khoá, E6–E8, F6 danh sách, F8, G4, G5, H6, I3, I4, K1 bảng số chụp.
- (4) Đường song song: thứ tự bộ đếm lượt (đã dời sau tra khoá), lưới hai không lưu khoá mới (đã ghi), lối quầy `/phien/:id/huy` +
  `xac-nhan-tay` (đã ghi + ca), `checkStock` 400 không code (đã đổi `HET_HANG`). Ý "quay.js sau canCauHinhKhach → 503": SAI — chỉ `/cap-ma`
  gắn (`quay.js:13`), ghi ở P4.
- Số dòng sai trong bản đầu (đọc từ bản in gộp nhiều file): đã sửa `thanh-toan.js:111–139`, `orders.js:735–738`, `settings.js:90`, danh sách
  4xx không code.
