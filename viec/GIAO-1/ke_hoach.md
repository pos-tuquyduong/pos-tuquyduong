# GIAO-1 — kế hoạch (chủ quán DUYỆT 05.11 — commit fa03775; mục 11 = chốt khi làm, THẮNG chỗ trái ý ở trên)

## 0. Tóm tắt lời thường
Một mô-đun máy chủ nói chuyện với Ahamove (`server/utils/ahamove.js`), một mô-đun quy tắc giao hàng (`server/utils/giaoHang.js` — trạng thái
chuyến chỉ đổi qua MỘT hàm), một cửa `/api/pos/giao-hang`, hai bảng mới (bước 021), một màn "Giao hàng" 4 cột và nút "Giao hàng · Ahamove" trong
màn Bán hàng MỚI (`BanHang/BanHangMoi.jsx`). Phí ship do MÁY CHỦ lấy từ lần báo phí nó đã lưu — màn hình không gửi được số phí.

**Bốn câu cần chủ quán trả lời trước khi code** (chi tiết mục 9): Q1 Ahamove KHÔNG có gợi ý địa chỉ · Q2 thêm `server/utils/giuCho.js` vào
Phạm vi · Q3 hình mẫu màn Giao hàng 05.11 chưa có trong kho · Q4 "ghi hàng hỏng" khi huỷ đơn Đang pha.

## 1. Code thật đã đọc (lượt này)
| Khẳng định | Nguồn |
|---|---|
| Máy chủ hiện NHẬN `shipping_fee` thẳng từ màn hình, chỉ chặn số âm | `server/routes/orders.js:198`, `:735` |
| Màn cũ có ô gõ tay phí ship | `client/src/pages/Sales.jsx:1419-1420` |
| Màn mới luôn gửi `shipping_fee: 0`, ghi "Chưa làm: giao hàng" | `client/src/pages/BanHang/tinh.js:140`, `BanHangMoi.jsx:5` |
| Màn mới bật/tắt theo công tắc từng máy (mặc định màn cũ) | `client/src/pages/BanHang/index.jsx:28-35` |
| Phiên thanh toán (QR / ví / tiền mặt) chỉ chép trường trong danh sách trắng `TRUONG_DON`, rồi chốt bằng `taoDon` | `server/utils/giuCho.js:19-20`, `:36-40` |
| Điểm đã trừ phí ship khỏi tiền tính điểm; ví/tiền đã trả trừ phí ship | `server/utils/diemThat.js:13`, `server/utils/tienDaTra.js:18` |
| Hoá đơn đã có dòng `phi_giao` (nhãn "Phí giao Ahamove") | `server/routes/hoaDon.js:98,119`, `server/database.js:1206` |
| Huỷ đơn: `PUT /orders/:id/cancel`, quyền `cancel_order` (nhân viên CŨNG có), lý do không bắt buộc, chỉ hoàn phần ví | `orders.js:1449-1484`, `:1434-1442`, `database.js:1060,1073,1087` |
| Sửa Cài đặt: `PUT /settings`, chỉ owner/manager, có kiểm từng nhóm khoá trước khi ghi | `server/routes/settings.js:107-140` |
| Sao lưu theo `BACKUP_TABLES`, có danh sách bảng tiền không khôi phục | `server/routes/backup.js:44`, `:147` |
| Dọn dữ liệu thử phân loại mọi bảng (`THU_TU_XOA` / `BANG_KHONG_DON`) | `server/utils/donThu.js:50-53` |
| Đối soát tổng hợp ở `tongHop` | `server/utils/doiSoat.js:116-126` |
| Bước nâng cấp cuối là 017; bộ chạy mỗi bước một giao dịch | `server/nang_cap/`, `server/nang_cap/chay.js:26-48` |
| Không có màn / bản mẫu giao hàng nào trong kho (grep "đợi tài xế" chỉ khớp phiếu) | grep toàn kho |
| Bài thử cũ gửi `shipping_fee` tự do vào POST /orders và đòi nó được tính | `cong_cu/thu_DIEMTHAT1.js:171,231,320` |

## 2. Ahamove — cách gọi (đọc qua bản tóm tắt tìm kiếm của trang developers.ahamove.com; máy mây KHÔNG mở được trang — CHƯA KIỂM tận trang)
- **Gốc:** thử `https://partner-apistg.ahamove.com`, thật `https://partner-api.ahamove.com` (theo `AHAMOVE_MOI_TRUONG`, mặc định staging).
- **Token:** `POST /v3/accounts/token {mobile, api_key}` → `token`. Hạn dài (FAQ: 1 năm). Giữ trong bộ nhớ tiến trình; gặp 401 / "Token not
  found" → lấy lại MỘT lần rồi thử lại. Gửi `Authorization: Bearer <token>`. Không bao giờ ghi token / khoá ra log, DB, câu trả lời.
- **Báo phí:** `POST /v3/orders/estimates` thân `{order_time:0, path:[điểm lấy, điểm giao], services:[{_id: loại xe}], payment_method:'BALANCE'}`
  → mỗi loại xe một mục `data.{distance (km), duration, total_price}`. Lấy `total_price` làm phí, `distance` làm km.
- **Tạo chuyến:** `POST /v3/orders` `{service_id, path:[{lat,lng,address,name,mobile}, {…, remarks, tracking_number}], payment_method:'BALANCE'}` —
  KHÔNG gửi `cod` (không thu hộ, chủ quán 02.11). Trả `order_id`, `status`, `shared_link`.
- **Tra chuyến:** `GET /v3/orders/<order_id>`; tra theo mã của mình: `GET /v3/orders/tracks/<tracking_number>` (404 = chưa có) — dùng để KIỂM
  TRƯỚC KHI TẠO LẠI sau lỗi mạng.
- **Huỷ:** huỷ được khi `IDLE / ASSIGNING / ACCEPTED / CONFIRMING / PAYING`; `ACCEPTED` bắt buộc `comment` (lý do theo bảng của Ahamove).
  Phí huỷ: tài liệu không nêu → đọc từ chuyến sau khi huỷ (nếu có trường phí), không có thì 0 + ghi "chưa rõ" trên Đối soát.
- **Trạng thái Ahamove → trạng thái quán:** `IDLE/ASSIGNING` → `tim_xe` · `ACCEPTED` → `doi_tai_xe` · `IN PROCESS` → `dang_giao` ·
  `COMPLETED` → `xong` (điểm giao `FAILED` → `giao_loi`) · `CANCELLED` → `chuyen_huy` (`cancel_by_user=false` = tài xế / hệ thống huỷ).
  Tài xế: `supplier_name`, `supplier_id` (SĐT) — **biển số chưa thấy trường** → đọc từ chuyến thật trên khoá thử rồi mới chốt (CHƯA KIỂM).
- **Gợi ý địa chỉ: KHÔNG CÓ trong API đối tác v3** → câu Q1.
- **Lưu ý cần kiểm trên khoá thử:** trang giới thiệu có câu cụt "POST dùng URL-encoded" — `ahamove.js` gửi JSON, thử thật một lần bằng tay
  trước khi giao (không phải trong bài thử).

## 3. Ahamove báo về (H) — cách xác thực
- Tài liệu: Ahamove chỉ hỗ trợ header cố định (**API-KEY** `apikey: <chuỗi>`, Bearer hoặc Basic) — **không có chữ ký / dấu giờ**. Nên:
  1. Cửa `POST /api/giao-hang/ahamove-bao` (công khai, mount TRƯỚC `express.static`, như webhook payOS `index.js:135`); header `apikey` so với
     `AHAMOVE_KHOA_BAO` bằng `crypto.timingSafeEqual` trên băm sha256 của hai chuỗi (độ dài bằng nhau, không lộ độ dài). Thiếu biến → 503,
     sai → 401 `{error, code:'BAO_SAI_KHOA'}`. Không dùng đường dẫn bí mật (lọt vào log truy cập của Render).
  2. **Không tin trạng thái trong thân tin:** chỉ lấy `_id` (bỏ hậu tố `-1` của tin theo điểm), rồi gọi `GET /v3/orders/<id>` bằng token của
     quán và dùng trạng thái ĐỌC LẠI. Kẻ lộ khoá cũng không đẩy được trạng thái giả.
  3. Chống lặp: bảng `pos_giao_tin` UNIQUE(`ma_ahamove`, `trang_thai_ahamove`, `trang_thai_phu`) — chèn trùng → trả 200, không làm gì thêm.
  4. Đổi trạng thái qua `doiTrangThai(tx, chuyen, moi)` — bảng chuyển hợp lệ một chiều (tin đến trễ / lùi trạng thái bị bỏ qua), câu ghi có
     `WHERE trang_thai = <cũ>` + kiểm `changes`.
- **Dự phòng khi tin báo không tới** (Render ngủ, Ahamove gửi hỏng): màn Giao hàng hỏi máy chủ mỗi 15 s; chuyến đang chạy mà lần cập nhật cuối
  quá 60 s thì máy chủ tự `GET` chuyến đó (một chuyến một lần mỗi 60 s, cột `doc_luc`) — không cron.

## 4. Dữ liệu (bước `021_giao_hang.js`, chỉ THÊM)
- `pos_giao_bao_phi` — mỗi lần "Tính phí": `ma` (ngẫu nhiên 16 byte, hex), địa chỉ chuẩn + lat/lng, km, loại xe, `phi`, `het_han` (30 phút),
  `nguoi_tao`, `tao_luc`, `order_id` (NULL tới khi đơn dùng nó; UNIQUE).
- `pos_giao_chuyen` — một đơn một dòng (`order_id` UNIQUE): người nhận, SĐT, địa chỉ, lat/lng, km, ghi chú tài xế, loại xe, `trang_thai`
  (`moi | dang_pha | dang_goi | tim_xe | doi_tai_xe | dang_giao | xong | giao_loi | chuyen_huy | huy`), giờ từng bước (`nhan_luc, goi_luc,
  co_xe_luc, lay_hang_luc, xong_luc, huy_luc`), `ma_ahamove`, `ma_theo_doi`, `lan_tim` (≤ 2), tài xế (tên, SĐT, biển số), `phi_khach` (= shipping_fee
  của đơn), `phi_that`, `chenh` (= phi_that − phi_khach; dương = quán bù), `phi_huy`, `loi` (chữ báo trên thẻ), `doc_luc`, `in_tem_luc`.
- `pos_giao_tin` — nhật ký tin Ahamove báo về (khoá chống lặp ở mục 3), chỉ thêm dòng.
- Cài đặt (khoá `giao_*` trong `pos_settings`): `giao_km_toi_da`, `giao_gio_nhan` (`HH:MM-HH:MM`), `giao_loai_xe` (HAN-BIKE | HAN-EXPRESS),
  `giao_phut_moi_mon` (2), `giao_phut_tim_xe` (6), `giao_phut_nhac` (15), `giao_diem_lay` (JSON địa chỉ + lat/lng), `giao_sdt_quan`.
  Mặc định ghi bằng `INSERT OR IGNORE` trong bước 021 — số mặc định nằm ở MỘT hằng có tên trong `giaoHang.js`.
- Ba bảng vào `BACKUP_TABLES`; `pos_giao_chuyen` + `pos_giao_bao_phi` vào danh sách KHÔNG khôi phục (dính tiền); `donThu.js`: `pos_giao_chuyen`,
  `pos_giao_bao_phi` theo đơn (xoá cùng đơn thử), `pos_giao_tin` vào `BANG_KHONG_DON`. Không cột nào chứa khoá.

## 5. Luồng và chỗ sửa (phương án chọn)

### 5.1 Phí ship do máy chủ quyết (D, ràng buộc 1)
- **A (chọn):** thân đơn có `giao: { ma_bao_phi, ten, sdt, ghi_chu }`. Trong `taoDon` (`orders.js`): có `giao` → đọc `pos_giao_bao_phi` theo `ma`
  → `finalShippingFee = bao_phi.phi` (BỎ QUA `shipping_fee` màn hình gửi); báo phí không có / đã dùng → 400 `BAO_PHI_KHONG_HOP_LE`; hết hạn → 400
  `BAO_PHI_HET_HAN` **trừ khi đang chốt phiên** (`phien` có — tiền khách đã về, không từ chối). Ở chế độ ghi (không `chiTinh`), CÙNG giao dịch tạo đơn:
  `UPDATE pos_giao_bao_phi SET order_id=? WHERE ma=? AND order_id IS NULL` + kiểm `changes` (hai đơn dùng một báo phí → đơn sau rollback) và
  chèn `pos_giao_chuyen` trạng thái `dang_pha`, `nhan_luc = now`. Ưu đãi / hạng / điểm KHÔNG đụng: công thức hiện có đã tính hạng, mã trên tiền
  món và đã trừ phí ship khỏi điểm (`diemThat.js:13`) — chỉ thêm ca thử khoá lại.
- **B (loại):** bỏ hẳn `shipping_fee` màn hình gửi ở MỌI đơn — đúng hơn về nguyên tắc nhưng đổi đơn không giao (K5), làm đỏ `thu_DIEMTHAT1.js`
  (ngoài Phạm vi) và bỏ ô phí ở màn cũ. Ghi Phát hiện: đơn KHÔNG giao vẫn nhận `shipping_fee` tự do (chỉ làm khách trả THÊM, không làm quán mất tiền,
  điểm đã loại phần này) — đề xuất việc sau.
- `giuCho.js` `TRUONG_DON` phải có `'giao'` để đơn trả QR / ví mang được thông tin giao → **Q2** (file ngoài Phạm vi; một chữ).

### 5.2 Cửa `/api/pos/giao-hang` (`server/routes/giao-hang.js`, JWT nhân viên)
| Cửa | Việc | Quyền |
|---|---|---|
| `GET /cai-dat` | cài đặt giao + `ahamove: {da_cai, ban: 'thu'|'that'}` + `payos: {da_cai}` (chủ quán 29.10) — không bao giờ trả khoá | đăng nhập |
| `GET /goi-y?q=` | gợi ý địa chỉ (tuỳ Q1) | đăng nhập |
| `POST /bao-phi` | `{goi_y, so_mon}` → kiểm giờ nhận đơn, gọi báo phí, quá km → 400 `QUA_KHOANG_CACH`, lưu `pos_giao_bao_phi`, trả `{ma_bao_phi, phi, km, het_han}` | đăng nhập |
| `GET /` | các chuyến chưa xong (4 cột) + `goi_luc_goi_y` tính ở máy chủ (F) | đăng nhập |
| `POST /:id/nhan` · `/:id/tu-choi` | cột Mới (đơn App — KH-MUA-2 sau); việc này dựng luồng | nhận: đăng nhập · từ chối: như huỷ |
| `POST /:id/goi-xe` | G (5.3) | đăng nhập |
| `POST /:id/tim-lai` `{loai_xe?}` | I: huỷ chuyến cũ (nếu còn) + tạo chuyến mới, `lan_tim+1` | đăng nhập |
| `POST /:id/huy-chuyen` `{ly_do}` | J bước Đợi tài xế (5.5) | owner / manager |
| `POST /:id/in-tem` | giành quyền in tem túi MỘT lần (`UPDATE … SET in_tem_luc=? WHERE in_tem_luc IS NULL`) — hai máy mở màn chỉ một máy in | đăng nhập |
| `POST /api/giao-hang/ahamove-bao` | H (mục 3), công khai, chỉ tin header | khoá báo |

### 5.3 Gọi xe (G)
1. `UPDATE pos_giao_chuyen SET trang_thai='dang_goi', goi_luc=? WHERE id=? AND (trang_thai='dang_pha' OR (trang_thai='dang_goi' AND goi_luc < now−60s))`
   + kiểm `changes` → máy thua 409 `DANG_GOI_XE`. Đơn chưa thu đủ (`payment_status ≠ 'paid'`) → 409 `CHUA_THU_DU` (không có đường tạo đơn giao chưa
   thu, nhưng cổng vẫn đặt ở đây).
2. Nếu chuyến đã từng `dang_goi` (lần trước lỗi mạng): `GET /tracks/<ma_theo_doi>` TRƯỚC — có chuyến còn sống → nhận chuyến đó, không tạo.
3. Báo phí lại → tạo chuyến (`tracking_number` = số HD; lần tìm thứ 2 = `<số HD>-2`). Ghi `ma_ahamove`, `phi_that`, `chenh`, `tim_xe`.
4. Lỗi Ahamove trả lời rõ (4xx) → về `dang_pha` + `loi`; hết giờ / đứt mạng → GIỮ `dang_goi` + `loi` "chưa rõ đã tạo chưa — bấm lại để kiểm" (bước 2).

### 5.4 Giờ gợi ý gọi tài xế (F) — hàm thuần `gioGoiTaiXe(chuyen, dangPhaTruoc, caiDat)` trong `giaoHang.js`
`= nhan_luc + (tổng số món các đơn dang_pha nhận TRƯỚC nó + số món của nó) × phut_moi_mon − phut_tim_xe` (không sớm hơn `nhan_luc`).
Màn hình: tới giờ → thẻ đổi màu + kêu (Web Audio, không tệp âm thanh); quá `nhan_luc + phut_nhac` mà chưa gọi → nhắc lại. Không tự gọi.

### 5.5 Huỷ theo bước (J) — phương án chọn: KHÔNG viết đường huỷ thứ hai
- **A (chọn):** một hàm `kiemHuyDonGiao(tx, order, user)` trong `giaoHang.js`, gọi ở ĐẦU `PUT /orders/:id/cancel` (trong giao dịch có sẵn):
  đơn không có chuyến → trả ngay (K5, đơn thường không đổi). Có chuyến: vai trò phải owner/manager, `reason` ≥ 3 ký tự; `dang_goi / tim_xe /
  doi_tai_xe` (chuyến còn ở Ahamove) → 409 `HUY_CHUYEN_TRUOC`; `dang_giao / xong` → 409 `DANG_GIAO_KHONG_HUY` ("Báo sự cố"); đơn có
  `cash_amount > 0` hoặc `transfer_amount > 0` → 409 `CHO_HUY_1` (phiếu J: trước HUY-1 chỉ huỷ đơn giao chưa thu / trả bằng tài khoản). Qua cổng →
  đường huỷ cũ chạy nguyên (hoàn ví, mã, điểm); cùng giao dịch đặt chuyến `huy` (+ cờ `hang_hong` nếu đang pha — xem Q4).
- Màn hình: bước Đợi tài xế bấm "Huỷ" → `POST /giao-hang/:id/huy-chuyen` (huỷ ở Ahamove, ghi `phi_huy`, chuyến `chuyen_huy`) rồi tự gọi tiếp
  `PUT /orders/:id/cancel`. Bước sau hỏng → thẻ hiện "Đã huỷ chuyến · đơn chưa huỷ" + nút "Huỷ đơn" (không mất trạng thái).
- **Nối với HUY-1:** HUY-1 thay thân đường huỷ; nó chỉ cần giữ dòng gọi `kiemHuyDonGiao` và xoá vế `CHO_HUY_1` (một dòng, có tên hằng).
- **B (loại):** route huỷ riêng trong giao-hang.js gọi lại logic hoàn tiền — hai đường hoàn tiền (K4), đụng vùng tiền "chưa rà".

### 5.6 Sự cố (I)
- `tim_xe` quá 10 phút (hằng `PHUT_TIM_XE_TOI_DA`) → máy chủ trả cờ `tim_lau` → thẻ đỏ + "Tìm lại" / đổi loại xe.
- Tài xế / hệ thống huỷ (`CANCELLED`, `cancel_by_user=false`) khi `lan_tim = 1` → tự tạo chuyến lần 2 (`UPDATE … SET lan_tim=2 WHERE lan_tim=1`
  giành quyền — tin lặp không tạo hai lần) + `loi` "Tài xế huỷ — đã tự tìm lại". `lan_tim = 2` → `chuyen_huy`, thẻ đỏ.
- Mất mạng / Ahamove lỗi → `loi` hiện trên thẻ; đơn và tiền không đổi.
- `ACCEPTED → ASSIGNING` (Ahamove tự tìm tài xế khác) được phép trong bảng chuyển (ngoại lệ duy nhất của "một chiều").

### 5.7 Đối soát (K)
`doiSoat.js` thêm `giaoHang(tu, den)` gọi trong `tongHop`: tổng phí khách trả, tổng phí Ahamove thật, quán bù / dư, phí huỷ chuyến, số + danh sách
đơn giao huỷ. `client/src/components/DoiSoat.jsx` thêm một khối hiển thị.

### 5.8 Hoá đơn + tem túi
`hoaDon.js` trả thêm `giao: {dia_chi, nguoi_nhan, sdt}` khi đơn có chuyến; `client/src/utils/hoaDon.js` in dòng "GIAO HÀNG: <địa chỉ>". Tem túi giao: một
mẫu in mới qua đường in sẵn có (số HD, người nhận, SĐT, địa chỉ, ghi chú, tài xế, biển số), in khi thẻ sang `doi_tai_xe` và máy đó giành được
`in-tem`. Lệnh in lỗi → không tự in lại (luật thiết kế 5), có nút in tem ở chi tiết thẻ (in lại ghi "IN LẠI · LẦN n").

### 5.9 Giao diện
- **Bán hàng mới** (`BanHangMoi.jsx` + thành phần mới `BanHang/KhungGiao.jsx`): công tắc "Mang đi / tại quán" | "Giao hàng · Ahamove" → SĐT, tên, ô
  địa chỉ, ghi chú tài xế → "Tính phí" → dòng phí riêng trong giỏ → thu như thường (nút thu khoá tới khi có báo phí). Màn cũ `Sales.jsx` KHÔNG đổi.
- **Màn Giao hàng** (`client/src/pages/GiaoHang/index.jsx`, `TheGiao.jsx`, `ChiTietGiao.jsx`, `giaoHang.css`): 4 cột màu (điện thoại: 4 tab), thẻ: số HD,
  tên, số món, km, MỘT nút chính; chạm thẻ → chi tiết. Đường `/giao-hang` + mục menu (`QuanLy/menu.js` / `Layout.jsx`).
- **Cài đặt → Giao hàng** (`client/src/pages/CaiDat/GiaoHang.jsx`): các ô B + dòng "Ahamove: đã cài ✓ (bản thử | bản thật) / chưa cài ✗ · payOS: …".
  Máy chủ kiểm khoá `giao_*` trong `settings.js` (số nguyên trong khoảng, giờ `HH:MM-HH:MM`, loại xe trong danh sách) — sai một khoá không ghi khoá nào.
- Mọi gọi máy chủ qua `utils/api.js` (bánh cóc `NGUONG_FETCH`). Sau sửa: `npm run build`, `--day-du`.

## 6. Ước lượng
| Phần | File | Dòng |
|---|---|---|
| Ahamove + quy tắc | `utils/ahamove.js` ~170, `utils/giaoHang.js` ~200 | 370 |
| Cửa + tin báo | `routes/giao-hang.js` ~220 | 220 |
| Nối | `orders.js` ~35, `settings.js` ~20, `hoaDon.js` ~8, `backup.js` ~5, `donThu.js` ~3, `doiSoat.js` ~30, `index.js` ~3, `nang_cap/021` ~60 | 165 |
| Giao diện | Giao hàng ~380, KhungGiao ~140, Cài đặt ~120, Đối soát / hoá đơn / menu ~50 | 690 |
| Thử | `cong_cu/thu_GIAO1.js` ~800 | 800 |
Máy chủ ~755 (phiếu ~600 — vượt vì phần tin báo + dự phòng đọc lại; sẽ ép khi viết). `server/database.js`, `nang_cap/chay.js` không cần sửa (bộ
chạy tự nạp `021_*.js`).

## 7. Ca thử (`cong_cu/thu_GIAO1.js`, Ahamove GIẢ: một máy chủ HTTP nhỏ trong tiến trình thử; `ahamove.js` đọc gốc qua một hàm `goc()` mà bài thử
thay bằng `require.cache` như `thu_P3.js:26` — không thêm cửa sau trong code chạy thật)
| Nghiệm thu | Ca |
|---|---|
| A | A1 `GET /giao-hang/cai-dat` không chứa giá trị khoá; A2 sao lưu (xlsx) không chứa giá trị khoá; A3 log (bắt `console.*`) trong cả bài không chứa khoá / token; A4 thiếu biến → `da_cai:false`; A5 `staging`/thiếu → gốc thử, `production` → gốc thật (chỉ so chuỗi gốc, không gọi) |
| B | B1 lưu đủ khoá `giao_*`; B2 sai một khoá (km âm, giờ sai, loại xe lạ) → 400, không khoá nào đổi; B3 nhân viên → 403; B4 mặc định khi chưa lưu = hằng |
| C | C1 báo phí với địa chỉ không qua gợi ý → 400; C2 km = tối đa → qua, tối đa + 0,1 → 400 `QUA_KHOANG_CACH`; C3 `goi-y` không lộ khoá ra trình duyệt |
| D | D1 đơn giao: `shipping_fee` = phí báo dù màn hình gửi số khác; D2 phí không bị giảm hạng / mã (tổng = món sau giảm + phí); D3 điểm không tính phí; D4 báo phí dùng hai lần → đơn sau 400, đơn đầu nguyên; D5 báo phí hết hạn → 400, nhưng chốt phiên sau hạn vẫn tạo đơn; D6 đơn giao vào `dang_pha`; D7 hoá đơn có `giao.dia_chi` |
| E | E1 `GET /giao-hang` chia 4 cột đúng trạng thái; E2 nhận / từ chối đơn cột Mới |
| F | F1–F3 công thức: một đơn; đơn thứ ba với hai đơn đang pha trước; không sớm hơn giờ nhận |
| G | G1 chưa thu đủ → 409; G2 hai lệnh song song → MỘT chuyến ở Ahamove giả; G3 bấm hai lần nối tiếp → 409; G4 Ahamove giả "nuốt" lời đáp (tạo rồi cắt kết nối) → bấm lại KHÔNG tạo chuyến thứ hai (tra theo mã); G5 phí thật ≠ phí khách → `chenh` đúng dấu |
| H | H1 sai khoá → 401, không đổi gì; H2 thiếu header → 401; H3 tin lặp → 200, không thêm dòng / không đổi; H4 thân tin nói "COMPLETED" nhưng Ahamove giả nói "ACCEPTED" → dùng ACCEPTED; H5 có tài xế → `doi_tai_xe` + tên, SĐT; H6 lấy hàng → TỰ `dang_giao`; H7 giao xong → `xong`; H8 tin trễ lùi trạng thái → bỏ qua; H9 `in-tem` hai máy → một máy được |
| I | I1 tìm xe > 10 phút → `tim_lau`; 9 phút 59 → không; I2 tài xế huỷ → tự tìm lại MỘT lần (hai tin lặp → vẫn một chuyến mới); lần 2 huỷ → `chuyen_huy`; I3 Ahamove 500 → `loi`, đơn còn |
| J | J1 nhân viên huỷ đơn giao → 403; J2 thiếu lý do → 400; J3 đang pha, trả bằng tài khoản → huỷ được, hoàn ví; J4 đang pha, tiền mặt → 409 `CHO_HUY_1`; J5 đợi tài xế → huỷ đơn thẳng 409 `HUY_CHUYEN_TRUOC`, huỷ chuyến rồi huỷ đơn → được, `phi_huy` ghi; J6 đang giao → 409; J7 từ chối đơn Mới |
| K | K1 Đối soát ngày: tổng phí khách, phí thật, bù / dư, phí huỷ, đơn huỷ — số chọn để bù và dư không triệt tiêu nhau |
| K5 (phải KHÔNG bị chặn) | K5a đơn mang đi không `giao` — tổng, điểm, `shipping_fee` y như cũ (kể cả `shipping_fee` tự do của màn cũ); K5b huỷ đơn thường bởi nhân viên vẫn được như cũ; K5c mua gói / thẻ không giao không đổi; K5d chốt phiên QR đơn giao (khi Q2 được duyệt) |
| Hai người cùng bấm | G2 (gọi xe), D4 (một báo phí hai đơn), H9 (in tem), I2 (tự tìm lại), J5 song song huỷ chuyến + tin báo "IN PROCESS" → chỉ một kết quả thắng |

Đột biến (`dot_bien.py`): VS-PHI-MAN-HINH (dùng `shipping_fee` màn hình khi có `giao`), VS-SO-KHOA-THUONG (so khoá bằng `===`, ca độ dài),
VS-TIN-TIN-THAN (dùng trạng thái trong thân tin), BV-GIANH-GOI-XE (bỏ `WHERE trang_thai`), BV-TRA-THEO-MA (bỏ tra theo mã trước khi tạo lại),
BV-CHONG-LAP (bỏ UNIQUE tin), BV-CONG-HUY (bỏ `kiemHuyDonGiao`), VS-KM-NHO-HON (`<` thay `<=`), BV-DUNG-MOT-LAN (bỏ `order_id IS NULL`).

## 8. Đường song song phải canh (K4)
- Mọi đường tạo đơn đều qua `taoDon`: POST /orders, `tinh-thu` (chỉ tính — KHÔNG tiêu báo phí), chốt phiên (`giuCho.js`), đơn App (`donApp.js` —
  KH-MUA-2 sau; `giao` không được nhận từ App cho tới khi KH-MUA-2 mở, vì `/api/kh` là hợp đồng riêng).
- Mọi đường huỷ / xoá đơn: `PUT /:id/cancel`, `DELETE /:id` (`orders.js:1638`) — đơn có chuyến: DELETE cũng gọi `kiemHuyDonGiao`; hoàn tiền
  `refunds.js` (hoàn một phần) — ngoài Phạm vi → ghi Phát hiện nếu nó hoàn được đơn giao đang chạy.
- Mọi đường đổi trạng thái chuyến: tin báo, đọc lại dự phòng, gọi xe, tìm lại, huỷ chuyến → tất cả qua `doiTrangThai`.
- Mọi nơi khoá có thể lộ: câu trả lời, `console.*`, lỗi ném ra từ `fetch` (thông điệp lỗi có thể chứa thân yêu cầu — `ahamove.js` chỉ ném
  `{status, code}` đã lọc), sao lưu, `pos_settings`.

## 9. Câu hỏi cho chủ quán (chặn code)
- **Q1 (C — chặn):** API đối tác của Ahamove **không có gợi ý địa chỉ** (chỉ báo phí / tạo / tra / huỷ chuyến). Muốn có toạ độ để báo phí thì phải
  có nguồn định vị. Ba cách:
  (a) **[mình đề xuất thử trước]** gửi địa chỉ CHỮ cho Ahamove trong lệnh báo phí (nếu Ahamove tự định vị), máy hiện lại địa chỉ + km Ahamove
  hiểu để nhân viên xác nhận — không tốn tiền; cần thử bằng khoá THỬ trước (máy mây không vào được Ahamove — bạn mở mạng hoặc thử tay);
  (b) OpenStreetMap (miễn phí, giới hạn 1 lần/giây, địa chỉ ngõ ngách Việt Nam kém);
  (c) Google (tốn tiền — bạn đã không muốn).
  Phiếu C "không nhận địa chỉ gõ tự do" phải đổi theo cách bạn chọn.
- **Q2:** cho thêm `server/utils/giuCho.js` vào Phạm vi (thêm `'giao'` vào danh sách trường đơn của phiên thanh toán). Không thêm thì đơn giao chỉ
  thu được bằng tiền mặt trực tiếp, không QR / tài khoản.
- **Q3:** hình mẫu màn Giao hàng bạn duyệt 05.11 chưa có trong kho. Gửi kèm (đặt vào `ban_mau_pos/`), hoặc đồng ý để máy dựng theo đúng chữ mục E.
- **Q4:** "đồ đã pha ghi hàng hỏng" — đường hàng hỏng (`server/routes/damages.js`) ngoài Phạm vi. Đề xuất: ghi cờ `hang_hong` trên chuyến giao +
  liệt kê ở Đối soát (không động kho); hoặc thêm `damages.js` vào Phạm vi.
- Không chặn, ghi để bạn biết: (i) đơn giao chỉ làm ở màn Bán hàng MỚI (màn cũ giữ nguyên); (ii) giờ nhận đơn giao áp cả ở quầy (ngoài giờ không
  tính phí được); (iii) biển số tài xế và phí huỷ chưa thấy trường trong tài liệu — đọc trên chuyến thử thật trước khi chốt.

## 10. Bổ sung sau soát kế hoạch (agent chỉ đọc)
Các mục dưới đây THẮNG chỗ trái ý ở trên.
- **Đơn giao chưa thu được tạo:** `taoDon` vẫn nhận `debt_amount` → đơn `pending/partial` (`orders.js:816-818`) — câu "không có đường tạo đơn giao chưa
  thu" ở 5.3 là SAI. Thêm cổng trong `taoDon`: có `giao` mà `debt_amount > 0` hoặc `payment_status ≠ 'paid'` → 400 `GIAO_PHAI_THU_DU`. Ca D8.
- **`DELETE /orders/:id`** (`orders.js:1638`, chỉ chủ quán, không lý do, xoá danh sách bảng con `:1711-1719`): đơn có chuyến còn ở Ahamove
  (`dang_goi/tim_xe/doi_tai_xe/dang_giao`) → 409 `HUY_CHUYEN_TRUOC`; được xoá thì xoá cùng `pos_giao_chuyen` + trả `pos_giao_bao_phi.order_id = NULL`.
  Không đòi lý do ở đường này (giữ hành vi cũ). Ca J8.
- **Hoàn tiền `refunds.js`** (ai đăng nhập cũng xin hoàn được `:108`, duyệt thì đơn thành `refunded` `:158`) đi vòng cổng huỷ: đơn giao đang có chuyến
  vẫn hoàn được → thêm **Q5** (dưới). Đối soát "đơn giao huỷ" đếm cả `refunded` như `reports.js:33`.
- **`pos_giao_tin` không lưu header** — chỉ `ma_ahamove`, trạng thái, trạng thái phụ, giờ nhận, kết quả xử lý. Ca A6: quét mọi bảng `pos_giao_*` + sao
  lưu không có giá trị khoá. Ca A7: 500 / lỗi Ahamove không trả `err.message` thô. Ca A8: thiếu `AHAMOVE_KHOA_BAO` → 503.
- **`dongHoaDon.js`:** nếu dòng "GIAO HÀNG" phải có trên hoá đơn App / web (HD-KH-1) thì thêm ở đây; quầy dùng `hoaDon.js` — chốt khi viết, ≤ 5 dòng.
- **Ca bổ sung:** B5 ngoài giờ nhận đơn giao → `bao-phi` 400 `NGOAI_GIO_GIAO`; B6 loại xe mặc định tới lệnh báo phí; C4 ghi chú tài xế tới `remarks`;
  D9 trả bằng tài khoản (phiên) đơn giao; G6 `tracking_number` = số HD và toạ độ = toạ độ đã lưu (Ahamove giả ghi lại thân yêu cầu); G7 thẻ trả
  `chenh` để hiện "quán bù X đ"; H10 giờ từng bước được ghi, biển số / SĐT tài xế lưu; I4 "Tìm lại" đổi loại xe; J9 chuyển khoản → `CHO_HUY_1`;
  J10 quản lý huỷ được; J11 nhân viên bấm "Từ chối" → 403; K5e `/api/kh` (đơn App) gửi `giao` → bị bỏ qua (chưa mở tới KH-MUA-2); K5f `tinh-thu` có
  `giao` không tiêu báo phí. Màu thẻ / tiếng kêu / nhắc lại (F) và nội dung tem: chỉ hàm thuần `trangThaiThe(chuyen, gio)` được thử; phần hiển thị
  để chủ quán thử tay (CHƯA KIỂM máy).
- **Cân nhắc rút gọn của người soát, quyết định:** giữ bảng `pos_giao_bao_phi` (cần biết báo phí nào đã dùng, ai tính, Đối soát truy được; mã ký
  không thu hồi được và lại phải dùng khoá JWT cho việc khác). Giữ đọc lại dự phòng 60 s (không có nó, một tin báo hỏng làm thẻ kẹt mãi — mục I
  "không mất đơn"), nhưng gói trong ~25 dòng. Bỏ `payos:{da_cai}` nếu chủ quán không cần (QUYET 29.10 có nêu, nên mặc định giữ, 2 dòng).
- **Q5:** đơn giao còn chuyến ở Ahamove có được xin / duyệt hoàn tiền ở màn Hoàn tiền không? Đề xuất: KHÔNG — chặn ở `refunds.js` (ngoài Phạm vi →
  cần thêm vào Phạm vi) bằng cùng hàm `kiemHuyDonGiao`.

## 11. Chốt khi làm (phiên 2, 06.11) — sau câu trả lời Q1–Q5 của chủ quán
- **Q1 ô địa chỉ — MỘT hàm máy chủ `phanGiaiDiaChi` (utils/giaoHang.js), hai cách:**
  (1) có `AHAMOVE_DIA_CHI_URL` + `AHAMOVE_DIA_CHI_KHOA` → `GET <url>/dplaces/web/v2/autocomplete?text=` (header `apikey`) cho danh sách, chọn → máy chủ
  gọi `GET <url>/gplaces/web/v2/detail?id=<mã>` lấy địa chỉ chuẩn + toạ độ; gõ chữ không chọn → 400 `DIA_CHI_PHAI_CHON_GOI_Y`.
  (2) chưa có → gửi chữ cho Ahamove trong lệnh báo phí; máy chủ trả `can_xac_nhan: true` + km (+ địa chỉ Ahamove hiểu nếu Ahamove trả) → quầy hiện
  "Ahamove hiểu: … · km · phí" + nút "Đúng địa chỉ" mới gắn phí vào giỏ. Tên tham số `id` của detail và dạng `features` CHƯA KIỂM với Ahamove thật.
- **Gộp cửa cho gọn:** "Tìm lại" / "Gọi lại" / đổi loại xe = cùng `POST /:id/goi-xe {loai_xe?}` (giành quyền bằng MỘT câu ghi: từ dang_pha, chuyen_huy,
  dang_goi treo > 180 s (GOI_TREO_GIAY) hoặc có lỗi mạng, tim_xe > 10 phút → huỷ chuyến cũ trước). "Từ chối" đơn Mới = `PUT /orders/:id/cancel` (cùng cổng huỷ) —
  không viết cửa tu-choi riêng. `:id` của cửa giao hàng = mã ĐƠN.
- **Kiểm theo mã theo dõi:** mỗi lần tạo có `ma_theo_doi` (= số HD; lần n > 1 thêm `-n`), ghi TRƯỚC khi gọi tạo. Bấm lại sau lỗi bất kỳ → tra
  `GET /v3/orders/tracks/<mã>` trước: có chuyến chưa ghi nhận còn sống → nhận chuyến đó; chuyến đã ghi nhận / huỷ → mã mới.
- **Tin báo về:** khoá chống lặp = (mã chuyến, trạng thái ĐỌC LẠI, `điểm giao|SĐT tài xế`) — có SĐT tài xế để Ahamove đổi tài xế (ACCEPTED lần hai)
  không bị nuốt (ca H11). Về `tim_xe` thì bỏ tài xế cũ khỏi thẻ.
- **Q4 "Bỏ đi":** `pos_damage_logs` KHÔNG trừ kho SX (damages.js chỉ ghi sổ; hoàn kho là action riêng). "Hoàn kho rồi ghi hàng hỏng" sẽ làm kho DƯ.
  Nên đường huỷ: "Dùng cho đơn khác" → hoàn kho như cũ; "Bỏ đi" → KHÔNG hoàn kho (kho giữ phần đã trừ lúc bán = đúng phần đổ đi) + ghi hàng hỏng
  đúng món + số lượng bằng hàm chung `ghiHangHong` (tách từ POST /damages, action 'none', tiền đền 0, lý do "Huỷ đơn giao <HD> — đồ đã pha bỏ đi").
  Kết quả kho đúng như chủ quán muốn, ít một lần gọi SX. Ghi Phát hiện để chủ quán biết.
- **Hỏi đồ đã pha** ở cả `dang_pha` và `chuyen_huy` (đã huỷ chuyến ở bước Đợi tài xế — đồ đã pha xong). Đơn Mới (chưa pha) không hỏi.
- **Giờ:** mọi so giờ ở máy chủ (`toi_gio`, `nhac`, `tim_lau` trả kèm thẻ) — màn không dùng đồng hồ máy quầy (LUAT §2).
- **Không sửa `dongHoaDon.js`:** nó tạo dữ liệu trả App KH — đổi là đổi hợp đồng `/api/kh` (HOP_DONG_API_KH.md ngoài Phạm vi). Dòng "GIAO HÀNG" chỉ
  ở hoá đơn quầy (client/src/utils/hoaDon.js `dau.giao` + InvoicePreview). App nhận đơn giao là KH-MUA-2.
- **Menu:** thu_BH2 khoá menu 6 mục (GIAO-DIEN-1 đang mở) → màn Giao hàng mở bằng nút "Giao hàng" trên màn Bán hàng mới + đường `/giao-hang`.

## 12. Vòng sửa 4 (chủ quán Q6 06.11) — THẮNG chỗ trái ý ở trên
- Thẻ còn mã chuyến cũ (Tìm lại từ tim_xe, hoặc Gọi lại thẻ treo dang_goi): chỉ "Tìm lại" gửi lệnh huỷ. Sau đó ĐỌC chuyến cũ: còn chạy / đã xong →
  NHẬN LẠI (`nhanLaiChuyenCu`: thẻ về tim_xe rồi áp trạng thái đọc được — tài xế, đang giao, xong), không gọi chuyến mới; đã huỷ → gọi chuyến mới.
  Không đọc được → trả thẻ về như cũ, GIỮ goi_luc cũ (vòng 5: và loi_mang cũ — thẻ treo vì mất mạng vẫn còn nút Gọi lại, bấm lại được ngay).
- Phí huỷ chỉ cộng khi CHÍNH lệnh huỷ của quán thành công (Huỷ chuyến, Tìm lại). Bỏ cộng phí huỷ ở các đường tài xế / Ahamove tự huỷ.
  (Vòng 5 mở rộng theo Q9 — xem mục 13.)
- "Đóng thẻ" (POST /giao-hang/:id/dong-the, quản lý / chủ quán + lý do): chỉ thẻ giao_loi → trạng thái da_dong (rời màn), không đụng đơn / tiền;
  phí chuyến vẫn ở Đối soát (theo dấu giờ đã chạy).
- Q7: "Bỏ đi" giữ KHÔNG hoàn kho (kho ra đúng) — KHO-3 xem lại khi POS giữ kho.

## 13. Vòng sửa 5 (chủ quán Q8 + Q9 07.11) — THẮNG chỗ trái ý ở trên
- Thẻ `da_dong` chặn Huỷ đơn như `giao_loi` (DANG_GIAO_KHONG_HUY) — hàng đã theo tài xế đi, không hoàn ví / kho.
- Phí huỷ = chuyến huỷ theo lệnh của quán: lệnh Huỷ chuyến / Tìm lại thành công, HOẶC Ahamove báo huỷ với `cancel_by_user` (lệnh mất mạng, quán
  huỷ trên app Ahamove — Q9). Ghi MỘT lần mỗi mã chuyến bằng `ghiPhiHuy` (dấu `PHI_HUY` trong pos_giao_tin + cộng phi_huy trong một giao dịch), TÁCH
  khỏi câu đổi trạng thái thẻ (thẻ vừa đổi vẫn không mất phí). Lệnh huỷ thành công mà không đọc được chuyến → dấu `CHO_PHI_HUY` (Đối soát hiện
  "n chuyến chưa rõ phí huỷ"), màn Giao hàng hỏi thì đọc lại (`docLaiPhiHuy`). Tài xế / Ahamove tự huỷ (cancel_by_user = false) → không phí.
- "Tìm lại" mà chuyến cũ đã bị huỷ bởi việc khác (Ahamove từ chối lệnh huỷ của máy này, đọc lại thấy CANCELLED — quản lý vừa Huỷ chuyến, tài xế huỷ,
  lệnh huỷ mất mạng) → KHÔNG gọi chuyến mới: trả thẻ về tim_xe rồi áp tin huỷ (chuyen_huy / tự tìm lại một lần), 409 CHUYEN_DA_HUY. Gọi lại thẻ treo
  mà chuyến cũ đã huỷ vẫn gọi chuyến mới (J5e).
- `POST /:id/goi-xe {tu}`: màn gửi trạng thái thẻ đang thấy; khác trạng thái hiện tại → 409 TRANG_THAI_DA_DOI (màn cũ còn "Tìm lại" khi thẻ đã
  chuyen_huy không gọi chuyến mới). Huỷ chuyến mà thẻ đã về chuyen_huy theo chính chuyến đó → 200.
- Tin báo tới lúc thẻ `dang_goi` → 409 DANG_GOI_XE, KHÔNG ghi sổ chống lặp (Ahamove có gửi lại tin hay không: CHƯA đối chiếu — tin sau được áp;
  không có tin sau thì màn Giao hàng đọc lại chuyến quá 60 s).
- Ca + đột biến: V1–V13, J5f (phí), K1 số mới; đột biến cho chống đua nhận lại (goi_luc, mã chuyến, changes) và câu trả thẻ về.

## 14. Vòng sửa 6 (chủ quán Q10 + Q11 07.11) — THẮNG chỗ trái ý ở trên
- Gọi lại thẻ treo mà chuyến cũ đã huỷ: quán huỷ (kể cả trên app Ahamove) → phí huỷ; tài xế huỷ → không (code có từ vòng 5 — thêm ca W1 / W2).
- Q11: Ahamove không gửi `cancel_by_user` → coi là QUÁN huỷ (phí huỷ vào Đối soát, không tự tìm lại) — giữ, ca W3 khoá giá trị mặc định.
- Chuyến trùng máy thua giành tự huỷ: lệnh huỷ thành công → `ghiPhiHuyLenh` (cùng hàm như Huỷ chuyến / Tìm lại). Lệnh huỷ lỗi → vẫn chỉ ghi nhật ký
  (Phát hiện — không trong 4 điểm Q10).
- Kiểm theo mã theo dõi (`taoChuyenMoi`): chuyến tìm thấy chưa huỷ — còn chạy HOẶC đã giao xong — NHẬN LẠI rồi áp trạng thái đọc được
  (`capNhatTuAhamove`: tài xế / đang giao / xong + phí thật vào Đối soát); chỉ chuyến đã huỷ mới gọi mã mới.
- "Tìm lại" mà tài xế vừa huỷ chuyến cũ lần đầu → máy đã tự tìm lại một chuyến → trả 200 `{ tu_tim_lai: true }` (không báo "bấm Gọi lại").
- Phí huỷ chưa rõ: đọc lại dòng chờ lâu nhất trước (`ORDER BY luc`), chưa ra thì đẩy `luc` xuống cuối — dòng đọc mãi không ra không chặn dòng sau;
  chỉ đọc thấy CANCELLED mới ghi (kể cả phí 0 — hết "chưa rõ").
- Ca W1–W9; đột biến thêm 12 (84 tổng).
