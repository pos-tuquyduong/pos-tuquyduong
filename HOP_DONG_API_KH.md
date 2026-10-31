# Hợp đồng cổng `/api/kh` — POS ↔ App KH

PHIEN_BAN: 5
NGAY: 2026-10-31
DOC_TU_CODE: POS nhánh viec/KH-MUA-1 (server/routes/kh/index.js, loi.js, middleware/khachAuth.js, utils/pinKhach.js, utils/maKhach.js,
  routes/wallets.js loiGhi, routes/signup-codes.js, utils/giaHang.js, utils/gioHoatDong.js, utils/donApp.js, utils/giuCho.js, nang_cap/003_xung_ho_khach.js,
  nang_cap/006_don_app.js) — bài thử cong_cu/thu_HOPDONG_KH.js canh khớp code

<!-- Nguồn DUY NHẤT về cổng /api/kh. Chủ: POS. Đổi cổng → đổi file này cùng PR, tăng PHIEN_BAN, ghi nhật ký (luật L2).
     Khối HOP_DONG_MAY_DOC là phần máy đọc: bài thử hợp đồng của POS và bộ kiểm của App KH cùng dựa vào nó. -->

## Chung
- Địa chỉ: `https://www.pos-tuquyduong.io.vn/api/kh` (CÓ `www` — bản không `www` tự chuyển hướng, trình duyệt chặn yêu cầu bị chuyển
  hướng từ App). Mọi câu trả lời thành công có `success: true`.
- Đăng nhập xong nhận `token`; các cửa "token: có" gửi `Authorization: Bearer <token>`. Thiếu / sai / hết hạn → 401 `KH_TOKEN_SAI`.
  Cửa "token: không bắt buộc" (`/menu`, từ v3): KHÔNG gửi tiêu đề `Authorization` thì vẫn 200; CÓ gửi mà sai / hết hạn (kể cả `Bearer null`)
  → 401 `KH_TOKEN_SAI` — chưa đăng nhập / đã đăng xuất thì App KHÔNG gửi tiêu đề này.
- Lỗi luôn `{ error: '<lời tiếng Việt>', code: 'MA_IN_HOA' }` — App hiện nguyên `error`.
- SĐT khách luôn lấy từ token, không bao giờ từ thân yêu cầu. Đơn / dữ liệu của khách khác → 404 như không có.
- **Giờ:** mọi trường giờ (`ngay`, `ngay_tao`, `ton_luc`…) là **giờ Việt Nam**, dạng `YYYY-MM-DDTHH:mm:ss`, KHÔNG có hậu tố múi giờ. App KHÔNG
  đưa thẳng vào `new Date(...)` (trình duyệt sẽ hiểu là giờ máy khách) — đọc như giờ `Asia/Ho_Chi_Minh`. "Bây giờ" lấy từ máy chủ (cửa giờ
  hoạt động, từ v2), không lấy đồng hồ điện thoại. Lỗi đã biết: một số giờ CŨ (vd ngày tạo của vài khách) còn lưu theo giờ quốc tế, có
  dấu cách thay chữ `T` — GIO-VN-1 sửa trước khai trương.

## Các cửa (phiên bản 5)
| Cửa | Token | Gửi | Trả (ngoài `success`) |
|---|---|---|---|
| `POST /dang-nhap/xin-ma` | không | `{ sdt }` | `lay_ma_tai_quay` (true = khách hỏi mã ở quầy) |
| `POST /dang-nhap/xac-minh` | không | `{ sdt, ma, ten?, xung_ho?, dia_chi? }` (mã 6 số; khách MỚI thiếu `ten` hoặc `xung_ho` → `CAN_TEN`; khách cũ: ba trường bị bỏ qua) — xem "Đăng ký 3 bước" | `token`, `khach { sdt, ten, ngay_tao, xung_ho, dia_chi }` |
| `GET /hang` | không | — | `data[] { id, ten, phan_tram, phan_tram_nhom_dac_biet, gia_the, thu_tu }` — hạng đang bật, xếp theo `thu_tu` rồi `gia_the` |
| `GET /gio-vang` | không | — | `dang_chay, bat_dau, ket_thuc, phan_tram, mon[]` (mã món = `ma` của `/menu`) — xem "Giờ vàng". **Không có suất** (POS không đếm suất) |
| `GET /gio-hoat-dong` | không | — | `bay_gio, dang_mo, nhan_don, hom_nay { mo, dong } \| null, mo_lai_luc \| null, thong_bao, lich_tuan[] { thu, mo, dong, nghi }, ngay_nghi[] { ngay, ly_do }` — xem "Giờ hoạt động" |
| `GET /toi` | có | — | `khach { sdt, ten, ngay_tao, xung_ho, dia_chi, qr, hang, so_du_vi }` — `hang { id, ten, phan_tram, phan_tram_nhom_dac_biet, het_han } \| null`; `so_du_vi` xem dưới |
| `PUT /toi` | có | `{ ten?, xung_ho?, dia_chi? }` — ít nhất một khoá; xem "Hồ sơ" | `khach { sdt, ten, ngay_tao, xung_ho, dia_chi }` |
| `POST /gia-han` | có | — | `token`, `het_han` — xem "Tự gia hạn" |
| `GET /menu` | không bắt buộc | — (không token: ≤ 300 lần / phút mỗi IP, vượt → 429 `QUA_NHIEU_LAN`) | `data[] { ma, ten, nhom, gia, con_hang, ton_cu, ton_luc, gia_hang[] { hang_id, gia } }` — `con_hang` có thể `null` |
| `GET /diem` | có | — | `points`, `history` |
| `GET /voucher` | có | `?all=1` lấy cả mã đã dùng / hết hạn | `data[]`, `ma_khach_moi` |
| `GET /don` | có | `?trang=N` (20 đơn / trang) | `trang`, `con_nua`, `data[] { ma, ngay, tong, da_tra, trang_thai, thanh_toan, tien_trinh, qr, tien_ve_cho_doi_soat }` — gồm cả đơn App chưa trả (v5) |
| `GET /don/:ma` | có | — (`ma` = mã đơn App hoặc mã bill) | `don { ma, ngay, tong, da_tra, trang_thai, thanh_toan, tien_trinh, qr, tien_ve_cho_doi_soat, mon[] { ma, ten, so_luong, don_gia, thanh_tien, ghi_chu } }` |
| `POST /gio/bao-gia` | có | `{ mon[] { ma, so_luong, ghi_chu? }, ma_giam?, cach_nhan: "tai_quan" }` — xem "Đặt đơn" | `dong[] { ma, so_luong, don_gia, thanh_tien }, tam_tinh, giam[] { loai, so_tien }, phi_giao, tong, ma_giam_loi` |
| `POST /don` | có | thân báo giá + `cach_tra`, `pin?`, `khoa_gui`, `tong_da_xem` — xem "Đặt đơn" | `ma_don, tong, giu_vi, con_lai, tien_trinh, qr { chuoi, het_han } \| null, trung` |
| `POST /don/:ma/huy` | có | — (`ma` = mã đơn App) | `ma_don, tien_trinh` |
| `POST /nhan-ma-bill` | có | `{ ma }` | kết quả nhận ưu đãi khách mới |
| `POST /nhan-diem` | có | `{ ma }` | kết quả nhân điểm theo mã trên bill |
| `PUT /pin` | có | `{ pin, pin_lai }` (4 số) | — |

### Đặt đơn (v5 — KH-MUA-1, nhận tại quán)
- **Giờ:** đặt / báo giá khi quán đóng → 400 `NGOAI_GIO`; quán mở nhưng đã ngừng nhận đơn App (`nhan_don: false` của `/gio-hoat-dong`) → 400
  `QUA_GIO_NHAN_DON`. Máy chủ xét theo giờ của máy chủ.
- **Giỏ:** `mon` 1–50 dòng; `ma` = `ma` của `/menu`; `so_luong` số nguyên 1–99; `ghi_chu` chuỗi ≤ 200 ký tự hoặc bỏ. Cùng một món được nhiều dòng (ghi
  chú khác nhau). Món không có / giá không hợp lệ → 400 `MON_KHONG_BAN` kèm `ma`; `con_hang: false` hoặc tổng SL vượt tồn đã biết → 400 `HET_HANG`
  kèm `ma` (tồn chưa rõ — `con_hang: null` — không chặn). `cach_nhan` chỉ `tai_quan`; `giao` → 400 `CHUA_GIAO` (KH-MUA-2); khác → `YEU_CAU_KHONG_HOP_LE`.
- **Báo giá** (`POST /gio/bao-gia`, không ghi gì): máy chủ tính bằng CÙNG hàm của quầy. `dong[].don_gia` = giá gốc một ly, `thanh_tien` = `don_gia ×
  so_luong`; `tam_tinh` = Σ `thanh_tien`; `giam[]` chỉ dòng > 0, `loai` ∈ `ma_giam` · `hang` · `gio_vang`; `phi_giao` = 0 (nhận tại quán);
  `tong` = `tam_tinh` − Σ `giam` + `phi_giao`. Giờ vàng có món trong giỏ thì không giảm hạng (luật quầy). `ma_giam_loi` = `null` hoặc `{ code, error }`
  khi mã gửi kèm KHÔNG được áp: `MA_KHONG_TON_TAI` · `MA_KHONG_AP_DUNG` (hết hạn / hết lượt / chưa đủ tối thiểu / mã % lúc Giờ vàng) ·
  `MA_KHONG_CO_MON` (mã giảm một món mà giỏ không có món đó) · `MA_KHONG_LOI_HON` (giá hạng lợi hơn mã — `error` nói rõ). Mã không áp thì đơn đặt
  theo đúng số báo giá KHÔNG mã — App hiện `error` cho khách.
- **Đặt** (`POST /don`): `cach_tra` = `qr` (QR payOS cả đơn) · `vi` (ví + `pin`, ví phải đủ cả đơn — thiếu → 400 `VI_KHONG_DU`) · `vi_qr` (giữ hết ví +
  QR phần còn lại; ví đủ cả đơn → 400 `CACH_KHONG_KHOP`; ví 0đ → như `qr`). `pin` 4 số của chính khách (sai → 400 `PIN_SAI`, sai 5 lần liền → 423
  `PIN_DANG_KHOA` 15 phút, chưa đặt → 400 `CHUA_CO_PIN`). Máy chủ KHÔNG đọc số tiền / giá App gửi.
  - `tong_da_xem` (BẮT BUỘC, số nguyên ≥ 0) = `tong` của báo giá khách vừa thấy. Chỉ dùng để SO: máy chủ tính lại, khác → 409 `GIA_DA_DOI` dạng
    `{ error, code: "GIA_DA_DOI", bao_gia: { …đúng dạng trả lời /gio/bao-gia, không có success… } }`, không tạo gì — App hiện báo giá mới cho khách
    bấm lại. Thiếu / sai dạng (chuỗi, số lẻ, âm) → 400 `YEU_CAU_KHONG_HOP_LE`.
  - `vi` → chốt ngay: đơn thật, `tien_trinh: da_tra`, `qr: null`. `qr` / `vi_qr` → `tien_trinh: cho_tra`, `qr { chuoi, het_han }` (chuỗi VietQR để vẽ
    mã; hết hạn sau 10 phút — `het_han` giờ VN). Đơn CHỈ thành đơn thật (về quầy, kêu chuông) khi tiền về đủ.
  - Mỗi khách ≤ 10 lần / 10 phút (đếm trong bộ nhớ máy chủ) → 429 `QUA_NHIEU_LAN` kèm `thu_lai_sau_giay`. Gửi lại cùng `khoa_gui` không tính lượt.
- **Luật 4xx:** MỌI trả lời 4xx của `POST /don` = chưa tạo đơn, chưa giữ / trừ ví. Trả lời 4xx của POST /don không giữ khoá gửi — gửi lại cùng khoa_gui được xử lý như lần đầu.
- **`khoa_gui`** (BẮT BUỘC): 16–64 ký tự `A-Z a-z 0-9 -`; mỗi lần khách bấm Đặt một khoá mới, gửi lại (mạng chập chờn, 5xx) dùng ĐÚNG khoá đó.
  Sai / thiếu → 400 `KHOA_GUI_SAI`. Cùng khoá + cùng giỏ (món, SL, ghi chú, mã, cách nhận, cách trả — `pin`, `tong_da_xem` không tính) trong 24 giờ
  → 200 đơn cũ, `trung: true` (không giữ ví lần hai); cùng khoá mà giỏ khác, hoặc quá 24 giờ → 409 `KHOA_GUI_DA_DUNG` (khoá nhớ theo khách).
  Hai yêu cầu cùng khoá đến cùng lúc → một đơn; yêu cầu kia nhận 503 `DANG_XU_LY` — gửi lại cùng khoá sau 2 giây (lần đầu xong thì nhận
  đúng đơn đó). Vẫn `DANG_XU_LY` sau khoảng 1 phút → App mở `GET /don` xem đơn đã có chưa (đơn hiện ở đó ngay khi đã có phiên trả tiền)
  rồi mới cho khách bấm Đặt lại (khoá mới) — máy chủ KHÔNG tự bỏ khoá đang xử lý. Lưới thứ hai: khoá KHÁC nhưng
  cùng giỏ, đơn trước còn `cho_tra`, trong 10 giây → trả đơn trước `trung: true`.
- **`tien_trinh`:** `cho_tra` (chờ tiền) · `da_tra` (đã trả, quán chưa làm) · `dang_lam` · `xong` · `da_huy` (khách huỷ, QR hết hạn chưa trả, hoặc đơn
  bị huỷ / hoàn). Đơn quầy: `xong` / `da_huy`. KH-MUA-2 thêm bước giao. `qr` chỉ có khi `cho_tra` (cùng mã lúc tạo), khác → `null`. QR hết hạn → `da_huy`,
  tiền ví đang giữ tự trả lại. Đơn App chưa có đơn thật: `trang_thai`, `thanh_toan` = `null`, `da_tra` = 0.
- **Huỷ** (`POST /don/:ma/huy`): chỉ đơn `cho_tra` → `da_huy`, nhả ví; đơn đã `da_huy` → 200 `da_huy`; đã trả → 400 `DA_TRA_GOI_QUAN` (khách gọi quán).
- **Tiền về muộn / lệch:** tiền QR về khi đơn đã `da_huy` (hoặc lệch số) → máy chủ KHÔNG tạo đơn; đơn hiện `da_huy` + `tien_ve_cho_doi_soat: true`
  — App báo "Quán đã nhận tiền, nhân viên sẽ liên hệ" (quán hoàn qua Đối soát). Khác → `false`.
- Lỗi máy bất ngờ → 500 `LOI_MAY_CHU`; payOS chưa cài → 503 `PAYOS_CHUA_CAU_HINH`; payOS lỗi → 502 `PAYOS_LOI` (gửi lại cùng khoá); kho bận → 409
  `KHO_BAN` (gửi lại cùng khoá). Lỗi khác của đơn → 400 `DON_KHONG_HOP_LE` (App hiện nguyên `error`).

### Ghi chú v3
- **Đăng ký 3 bước:** SĐT → mã → `ten` + `xung_ho` (BẮT BUỘC với khách mới) + `dia_chi` (tuỳ chọn). `xung_ho` ∈ `anh · chi · co · chu · bac · em ·
  ban` (sai → 400 `XUNG_HO_SAI`); `dia_chi` ≤ 300 ký tự sau khi cắt khoảng trắng (dài quá → 400 `DIA_CHI_QUA_DAI`; không phải chuỗi → 400
  `YEU_CAU_KHONG_HOP_LE`). Mã đúng mà còn thiếu thông tin → `CAN_TEN` và mã sống thêm 10 phút tính từ lúc đó (một lần) để khách điền.
  Các lỗi này chỉ trả khi mã đúng và SĐT chưa là khách; không tốn lượt thử mã. Khách đã có: `ten` / `xung_ho` / `dia_chi` gửi kèm bị bỏ qua.
- **Hồ sơ:** `xung_ho` / `dia_chi` = `null` khi chưa có. `dia_chi` là MỘT địa chỉ dùng chung với quầy (in trên hoá đơn) — sửa / xoá trên App thì
  quầy thấy theo. `PUT /toi`: trường nào có khoá trong thân thì sửa; thân không có khoá nào → 400 `YEU_CAU_KHONG_HOP_LE`; `ten` rỗng →
  `TEN_KHONG_HOP_LE`; `xung_ho` rỗng / sai → `XUNG_HO_SAI` (không xoá được xưng hô); `dia_chi: ""` hoặc `null` → xoá địa chỉ.
- **Tự gia hạn:** `POST /gia-han` cần token CÒN HẠN → token mới 30 ngày; `het_han` là giờ VN. App gọi khi mở app, tối đa 1 lần / ngày; máy chủ
  chặn > 10 lần / giờ mỗi khách (429 `QUA_NHIEU_LAN`). Token cũ KHÔNG bị thu hồi — vẫn dùng được tới hạn cũ (App thay bằng token mới). Không
  mở app 30 ngày → token hết hạn (401) → khách nhận mã lại.
- Giới hạn của `/menu` (không token) và `/gia-han` đếm trong bộ nhớ máy chủ: máy chủ khởi động lại thì đếm lại từ 0.

### Ghi chú các trường mới (v2)
- `hang` (của `/toi`): hạng khách ĐANG dùng được (còn hạn, kể cả sắp hết); hết hạn / chưa mua → `null`. `phan_tram` cho món thường,
  `phan_tram_nhom_dac_biet` cho món nhóm đặc biệt (đã kẹp 0–90). `het_han` là giờ VN.
- `so_du_vi`: số đồng KHẢ DỤNG của ví riêng khách = số dư − tiền đang giữ cho phiên thanh toán chưa xong (đúng số quầy hiện). Không cộng ví
  gia đình. Không có ví → 0.
- `gia_hang` (của `/menu`): giá MỘT ly theo từng hạng đang bật (`hang_id` = `id` của `/hang`) + hạng của chính khách nếu hạng đó đã tắt mà thẻ còn hạn (quầy vẫn giảm), máy chủ tính CÙNG hàm với quầy. Hạng 0 % →
  `gia` = giá gốc. Giá món không phải số > 0 → `[]`. Đơn có món đang giờ vàng thì quầy KHÔNG giảm hạng cho cả đơn — App hiện giá giờ vàng.
- **Giờ vàng:** `dang_chay` = đang trong khung VÀ có % VÀ có món (cùng điều kiện quầy giảm giá). Bật mà ngoài khung → `dang_chay: false`
  nhưng `bat_dau / ket_thuc` là khung hôm nay (khung qua nửa đêm đang chạy sau 00:00 thì `bat_dau` là hôm qua). `bat_dau`, `ket_thuc` là giờ
  Việt Nam dạng đầy đủ `YYYY-MM-DDTHH:mm:ss` (không hậu tố); khung qua nửa đêm (giờ kết thúc ≤ giờ bắt đầu, vd 22:00–02:00) thì `ket_thuc` là
  ngày HÔM SAU của `bat_dau`. Tắt / % = 0 / không có món → `bat_dau`,
  `ket_thuc` `null`, `phan_tram` 0, `mon` `[]`.
- **Giờ hoạt động:** `bay_gio` = giờ VN của máy chủ (App lấy "bây giờ" ở đây). `dang_mo` = quán đang mở THẬT theo lịch; `nhan_don` = còn nhận
  đơn App (đã trừ "ngừng nhận đơn trước giờ đóng N phút"; ca sau mở đúng lúc / trước khi ca này đóng VÀ đóng muộn hơn — vd chưa cài lịch — thì tính theo giờ đóng của cả chuỗi) — KH-MUA-1 chặn theo `nhan_don`. `hom_nay` = ca đang mở, không thì ca bắt đầu
  hôm nay; `dong` là giờ đóng thật (qua nửa đêm thì là ngày hôm sau; ca sau nối liền / chồng lên thì là giờ đóng của cả chuỗi — cùng mốc `nhan_don` dùng); chưa cài lịch / nghỉ → `null`. `mo_lai_luc` chỉ có khi `dang_mo:
  false`. `thong_bao` = câu ngoài giờ đã điền giờ mở lại (không tìm được giờ mở lại → điền `(chưa có lịch)`); đang mở → `''`. `thu` 2–7 = Thứ Hai–Thứ Bảy, 8 = Chủ nhật; `mo / dong` dạng
  `HH:mm`, `null` khi nghỉ hoặc chưa cài lịch. `ngay_nghi` chỉ gồm ngày từ hôm nay trở đi. Chưa cài gì → mở cả ngày, `thong_bao` rỗng.
  Quầy KHÔNG bị chặn theo giờ hoạt động.

## Mã lỗi
`KH_CHUA_CAU_HINH` 503 · `KH_TOKEN_SAI` 401 · `SDT_KHONG_HOP_LE` 400 · `QUA_NHIEU_LAN` 429 · `MA_SAI` 400 · `MA_HET_HAN` 400 · `CAN_TEN` 400 ·
`TEN_KHONG_HOP_LE` 400 · `XUNG_HO_SAI` 400 · `DIA_CHI_QUA_DAI` 400 · `KHONG_THAY_DON` 404 · `KHONG_TIM_THAY` 404 · `YEU_CAU_KHONG_HOP_LE` 400 · `LOI_MAY_CHU` 500 · `KHO_BAN` 409 ·
`PUT /pin`: `PIN_KHONG_HOP_LE` 400 · `PIN_KHONG_KHOP` 400 · `PIN_DA_CO` 409 · `KHACH_KHONG_TON_TAI` 404.
Đặt đơn (v5): `CHUA_GIAO` 400 · `NGOAI_GIO` 400 · `QUA_GIO_NHAN_DON` 400 · `HET_HANG` 400 · `MON_KHONG_BAN` 400 · `KHOA_GUI_SAI` 400 ·
`KHOA_GUI_DA_DUNG` 409 · `DANG_XU_LY` 503 · `GIA_DA_DOI` 409 · `VI_KHONG_DU` 400 · `CACH_KHONG_KHOP` 400 · `CHUA_CO_PIN` 400 · `PIN_SAI` 400 ·
`PIN_DANG_KHOA` 423 · `DA_TRA_GOI_QUAN` 400 · `DON_KHONG_HOP_LE` 400 · `PAYOS_CHUA_CAU_HINH` 503 · `PAYOS_LOI` 502 · `QUA_NHIEU_LAN` 429 · `KHO_BAN` 409.
Trong `ma_giam_loi.code` của báo giá: `MA_KHONG_TON_TAI` · `MA_KHONG_AP_DUNG` · `MA_KHONG_CO_MON` · `MA_KHONG_LOI_HON`.
`nhan-ma-bill` / `nhan-diem` dùng hàm quầy, thêm các mã: `THIEU_MA` 400 · `MA_KHONG_TON_TAI` 404 · `MA_DA_DUNG` 409 · `UU_DAI_DANG_TAT` 400 ·
`SDT_DA_NHAN` 400 · `DON_FLASH_KHONG_DIEM` 400 · `CAU_HINH_DIEM_SAI` 400 · `CHUA_CAU_HINH_NHOM` 500 · `MA_KHONG_GAN_DON` 400 · `KHONG_THAY_DON` 404 ·
`DON_DA_HUY` 400 · `DON_DA_HOAN` 400 · `DON_KHONG_HOP_LE` 400 · `BILL_CHUA_THANH_TOAN` 400 · `BILL_SDT_KHAC` 400 · `NHANDIEM_DANG_TAT` 400 ·
`MA_DA_NHAN_DIEM` 400 · `TICH_DIEM_DANG_TAT` 400 · `DON_KHONG_DU_DIEM` 400 · `KHONG_THEM_DIEM` 400 · `MA_TRUNG` 409 (cùng `MA_HET_HAN`,
`SDT_KHONG_HOP_LE` ở trên). `MA_HET_HAN` của `nhan-ma-bill` ghi đúng số giờ của cài đặt hạn mã (bằng số giờ in trên bill).
Lỗi máy bất ngờ ở hai cửa này → 500 `LOI_MAY_CHU` như mọi cửa (không lộ lời máy). App hiện nguyên `error`.

## Đã hẹn (chưa có — ghi vào khi xong, tăng PHIEN_BAN)
- TOPPING-1: `/menu` thêm topping theo món + giá.
- Đánh giá Google: `loi-moi-danh-gia`, `su-kien`, cờ trên `/don` (tên cuối do POS chốt).

## Phần máy đọc
<!-- HOP_DONG_MAY_DOC -->
```json
{
  "phien_ban": 5,
  "goc": "/api/kh",
  "cua": [
    { "pt": "POST", "duong": "/dang-nhap/xin-ma", "token": false, "tra": ["lay_ma_tai_quay"] },
    { "pt": "POST", "duong": "/dang-nhap/xac-minh", "token": false, "tra": ["token", "khach.sdt", "khach.ten", "khach.ngay_tao", "khach.xung_ho", "khach.dia_chi"] },
    { "pt": "GET", "duong": "/hang", "token": false, "tra": ["data[].id", "data[].ten", "data[].phan_tram", "data[].phan_tram_nhom_dac_biet", "data[].gia_the", "data[].thu_tu"] },
    { "pt": "GET", "duong": "/gio-vang", "token": false, "tra": ["dang_chay", "bat_dau", "ket_thuc", "phan_tram", "mon"] },
    { "pt": "GET", "duong": "/gio-hoat-dong", "token": false, "tra": ["bay_gio", "dang_mo", "nhan_don", "hom_nay", "mo_lai_luc", "thong_bao", "lich_tuan[].thu", "lich_tuan[].mo", "lich_tuan[].dong", "lich_tuan[].nghi", "ngay_nghi"] },
    { "pt": "GET", "duong": "/toi", "token": true, "tra": ["khach.sdt", "khach.ten", "khach.ngay_tao", "khach.xung_ho", "khach.dia_chi", "khach.qr", "khach.hang.id", "khach.hang.ten", "khach.hang.phan_tram", "khach.hang.phan_tram_nhom_dac_biet", "khach.hang.het_han", "khach.so_du_vi"] },
    { "pt": "PUT", "duong": "/toi", "token": true, "tra": ["khach.sdt", "khach.ten", "khach.ngay_tao", "khach.xung_ho", "khach.dia_chi"] },
    { "pt": "POST", "duong": "/gia-han", "token": true, "tra": ["token", "het_han"] },
    { "pt": "GET", "duong": "/menu", "token": "tuy_chon", "tra": ["data[].ma", "data[].ten", "data[].nhom", "data[].gia", "data[].con_hang", "data[].ton_cu", "data[].ton_luc", "data[].gia_hang[].hang_id", "data[].gia_hang[].gia"] },
    { "pt": "GET", "duong": "/diem", "token": true, "tra": ["points", "history"] },
    { "pt": "GET", "duong": "/voucher", "token": true, "tra": ["data", "ma_khach_moi"] },
    { "pt": "GET", "duong": "/don", "token": true, "tra": ["trang", "con_nua", "data[].ma", "data[].ngay", "data[].tong", "data[].da_tra", "data[].trang_thai", "data[].thanh_toan", "data[].tien_trinh", "data[].qr", "data[].tien_ve_cho_doi_soat"] },
    { "pt": "GET", "duong": "/don/:ma", "token": true, "tra": ["don.ma", "don.ngay", "don.tong", "don.da_tra", "don.trang_thai", "don.thanh_toan", "don.tien_trinh", "don.qr", "don.tien_ve_cho_doi_soat", "don.mon[].ma", "don.mon[].ten", "don.mon[].so_luong", "don.mon[].don_gia", "don.mon[].thanh_tien", "don.mon[].ghi_chu"] },
    { "pt": "POST", "duong": "/nhan-ma-bill", "token": true, "tra": [] },
    { "pt": "POST", "duong": "/nhan-diem", "token": true, "tra": [] },
    { "pt": "PUT", "duong": "/pin", "token": true, "tra": [] },
    { "pt": "POST", "duong": "/gio/bao-gia", "token": true, "tra": ["dong[].ma", "dong[].so_luong", "dong[].don_gia", "dong[].thanh_tien", "tam_tinh", "giam[].loai", "giam[].so_tien", "phi_giao", "tong", "ma_giam_loi"] },
    { "pt": "POST", "duong": "/don", "token": true, "tra": ["ma_don", "tong", "giu_vi", "con_lai", "tien_trinh", "qr.chuoi", "qr.het_han", "trung"] },
    { "pt": "POST", "duong": "/don/:ma/huy", "token": true, "tra": ["ma_don", "tien_trinh"] }
  ],
  "ma_loi": ["KH_CHUA_CAU_HINH", "KH_TOKEN_SAI", "SDT_KHONG_HOP_LE", "QUA_NHIEU_LAN", "MA_SAI", "MA_HET_HAN", "CAN_TEN", "TEN_KHONG_HOP_LE", "XUNG_HO_SAI", "DIA_CHI_QUA_DAI",
    "KHONG_THAY_DON", "KHONG_TIM_THAY", "YEU_CAU_KHONG_HOP_LE", "LOI_MAY_CHU", "KHO_BAN",
    "PIN_KHONG_HOP_LE", "PIN_KHONG_KHOP", "PIN_DA_CO", "KHACH_KHONG_TON_TAI",
    "THIEU_MA", "MA_KHONG_TON_TAI", "MA_DA_DUNG", "UU_DAI_DANG_TAT", "SDT_DA_NHAN", "DON_FLASH_KHONG_DIEM", "CAU_HINH_DIEM_SAI", "CHUA_CAU_HINH_NHOM",
    "MA_KHONG_GAN_DON", "DON_DA_HUY", "DON_DA_HOAN", "DON_KHONG_HOP_LE", "BILL_CHUA_THANH_TOAN", "BILL_SDT_KHAC", "NHANDIEM_DANG_TAT", "MA_DA_NHAN_DIEM",
    "TICH_DIEM_DANG_TAT", "DON_KHONG_DU_DIEM", "KHONG_THEM_DIEM", "MA_TRUNG",
    "CHUA_GIAO", "NGOAI_GIO", "QUA_GIO_NHAN_DON", "HET_HANG", "MON_KHONG_BAN", "KHOA_GUI_SAI", "KHOA_GUI_DA_DUNG", "DANG_XU_LY", "GIA_DA_DOI",
    "VI_KHONG_DU", "CACH_KHONG_KHOP", "CHUA_CO_PIN", "PIN_SAI", "PIN_DANG_KHOA", "DA_TRA_GOI_QUAN", "PAYOS_CHUA_CAU_HINH", "PAYOS_LOI",
    "MA_KHONG_AP_DUNG", "MA_KHONG_CO_MON", "MA_KHONG_LOI_HON"]
}
```
<!-- HET HOP_DONG_MAY_DOC -->

## Nhật ký
- v1 · 28.10.2026 · Bản đầu, ghi đúng code POS b1f8299 (chat App KH soạn, chat POS đặt vào kho). Chat POS đối chiếu code trước khi đặt:
  thêm 8 mã lỗi có thật của `nhan-ma-bill` / `nhan-diem` và dòng "Lỗi đã biết" (500 không `code`).
- v2 · 29.10.2026 · KH-API-2: thêm `GET /hang`, `GET /gio-vang`, `GET /gio-hoat-dong` (không cần token); `/toi` thêm `hang`, `so_du_vi`;
  `/menu` thêm `gia_hang`; thêm 12 mã lỗi có thật của `nhan-ma-bill` / `nhan-diem`; hạn `nhan-ma-bill` theo cài đặt hạn mã; bỏ dòng "Lỗi đã
  biết" (code đã trả `LOI_MAY_CHU`). Không đổi / xoá trường cũ — App v1 chạy nguyên. Bài thử `cong_cu/thu_HOPDONG_KH.js` canh từ bản này.
- v3 · 30.10.2026 · KH-API-3: `GET /menu` token KHÔNG bắt buộc (khối máy đọc `"token": "tuy_chon"`; không token ≤ 300 lần / phút / IP); xác minh
  nhận `xung_ho` (BẮT BUỘC với khách mới) + `dia_chi`, mã đúng + `CAN_TEN` sống thêm 10 phút một lần; `/toi`, `PUT /toi`, xác minh trả thêm
  `xung_ho`, `dia_chi`; `PUT /toi` sửa được `ten` / `xung_ho` / `dia_chi`; thêm `POST /gia-han`; mã lỗi `XUNG_HO_SAI`, `DIA_CHI_QUA_DAI`. Không
  xoá / đổi tên trường cũ. **Báo App KH:** App bản cũ (chỉ có ô Tên) KHÔNG tạo được khách MỚI nữa (luôn `CAN_TEN`) — App cần ô Cách xưng hô
  trước khai trương (chủ quán chốt 30.10); khách cũ trên App bản cũ vẫn đăng nhập, xem, sửa tên như trước. Chữ (chủ quán duyệt 30.10, không
  đổi code): Địa chỉ đổi sang `https://www.pos-tuquyduong.io.vn/api/kh`; mục Giờ vàng ghi rõ dạng giờ `bat_dau` / `ket_thuc` và khung qua nửa đêm.
- v5 · 31.10.2026 · KH-MUA-1: đặt đơn App nhận tại quán — thêm `POST /gio/bao-gia`, `POST /don`, `POST /don/:ma/huy`; `GET /don` thêm `tien_trinh`,
  `qr`, `tien_ve_cho_doi_soat` và gồm cả đơn App chưa trả; `GET /don/:ma` nhận mã đơn App, thêm `tien_trinh`, `qr`, `tien_ve_cho_doi_soat`, `mon[].ma`.
  Mã lỗi mới của đặt đơn (thay tên đã hẹn `NGOAI_GIO_HOAT_DONG` bằng `NGOAI_GIO` + `QUA_GIO_NHAN_DON`, đã báo App ở TRA_LOI_POS_31102026). Chủ quán
  duyệt 31.10: `tong_da_xem` + 409 `GIA_DA_DOI` kèm `bao_gia`; "Trả lời 4xx của POST /don không giữ khoá gửi — gửi lại cùng khoa_gui được xử lý như
  lần đầu." Không xoá / đổi tên trường cũ.
