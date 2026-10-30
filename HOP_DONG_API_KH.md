# Hợp đồng cổng `/api/kh` — POS ↔ App KH

PHIEN_BAN: 2
NGAY: 2026-10-29
DOC_TU_CODE: POS nhánh viec/KH-API-2 (server/routes/kh/index.js, loi.js, middleware/khachAuth.js, utils/pinKhach.js datPin, utils/maKhach.js,
  routes/wallets.js loiGhi, routes/signup-codes.js, utils/giaHang.js, utils/gioHoatDong.js) — bài thử cong_cu/thu_HOPDONG_KH.js canh khớp code

<!-- Nguồn DUY NHẤT về cổng /api/kh. Chủ: POS. Đổi cổng → đổi file này cùng PR, tăng PHIEN_BAN, ghi nhật ký (luật L2).
     Khối HOP_DONG_MAY_DOC là phần máy đọc: bài thử hợp đồng của POS và bộ kiểm của App KH cùng dựa vào nó. -->

## Chung
- Địa chỉ: `https://pos-tuquyduong.io.vn/api/kh`. Mọi câu trả lời thành công có `success: true`.
- Đăng nhập xong nhận `token`; các cửa "token: có" gửi `Authorization: Bearer <token>`. Thiếu / sai / hết hạn → 401 `KH_TOKEN_SAI`.
- Lỗi luôn `{ error: '<lời tiếng Việt>', code: 'MA_IN_HOA' }` — App hiện nguyên `error`.
- SĐT khách luôn lấy từ token, không bao giờ từ thân yêu cầu. Đơn / dữ liệu của khách khác → 404 như không có.
- **Giờ:** mọi trường giờ (`ngay`, `ngay_tao`, `ton_luc`…) là **giờ Việt Nam**, dạng `YYYY-MM-DDTHH:mm:ss`, KHÔNG có hậu tố múi giờ. App KHÔNG
  đưa thẳng vào `new Date(...)` (trình duyệt sẽ hiểu là giờ máy khách) — đọc như giờ `Asia/Ho_Chi_Minh`. "Bây giờ" lấy từ máy chủ (cửa giờ
  hoạt động, từ v2), không lấy đồng hồ điện thoại. Lỗi đã biết: một số giờ CŨ (vd ngày tạo của vài khách) còn lưu theo giờ quốc tế, có
  dấu cách thay chữ `T` — GIO-VN-1 sửa trước khai trương.

## Các cửa (phiên bản 2)
| Cửa | Token | Gửi | Trả (ngoài `success`) |
|---|---|---|---|
| `POST /dang-nhap/xin-ma` | không | `{ sdt }` | `lay_ma_tai_quay` (true = khách hỏi mã ở quầy) |
| `POST /dang-nhap/xac-minh` | không | `{ sdt, ma, ten? }` (mã 6 số; khách mới thiếu tên → `CAN_TEN`) | `token`, `khach { sdt, ten, ngay_tao }` |
| `GET /hang` | không | — | `data[] { id, ten, phan_tram, phan_tram_nhom_dac_biet, gia_the, thu_tu }` — hạng đang bật, xếp theo `thu_tu` rồi `gia_the` |
| `GET /gio-vang` | không | — | `dang_chay, bat_dau, ket_thuc, phan_tram, mon[]` (mã món = `ma` của `/menu`) — xem "Giờ vàng". **Không có suất** (POS không đếm suất) |
| `GET /gio-hoat-dong` | không | — | `bay_gio, dang_mo, nhan_don, hom_nay { mo, dong } \| null, mo_lai_luc \| null, thong_bao, lich_tuan[] { thu, mo, dong, nghi }, ngay_nghi[] { ngay, ly_do }` — xem "Giờ hoạt động" |
| `GET /toi` | có | — | `khach { sdt, ten, ngay_tao, qr, hang, so_du_vi }` — `hang { id, ten, phan_tram, phan_tram_nhom_dac_biet, het_han } \| null`; `so_du_vi` xem dưới |
| `PUT /toi` | có | `{ ten }` | `khach { sdt, ten, ngay_tao }` |
| `GET /menu` | có | — | `data[] { ma, ten, nhom, gia, con_hang, ton_cu, ton_luc, gia_hang[] { hang_id, gia } }` — `con_hang` có thể `null` |
| `GET /diem` | có | — | `points`, `history` |
| `GET /voucher` | có | `?all=1` lấy cả mã đã dùng / hết hạn | `data[]`, `ma_khach_moi` |
| `GET /don` | có | `?trang=N` (20 đơn / trang) | `trang`, `con_nua`, `data[] { ma, ngay, tong, da_tra, trang_thai, thanh_toan }` |
| `GET /don/:ma` | có | — | `don { ma, ngay, tong, da_tra, trang_thai, thanh_toan, mon[] { ten, so_luong, don_gia, thanh_tien, ghi_chu } }` |
| `POST /nhan-ma-bill` | có | `{ ma }` | kết quả nhận ưu đãi khách mới |
| `POST /nhan-diem` | có | `{ ma }` | kết quả nhân điểm theo mã trên bill |
| `PUT /pin` | có | `{ pin, pin_lai }` (4 số) | — |

### Ghi chú các trường mới (v2)
- `hang` (của `/toi`): hạng khách ĐANG dùng được (còn hạn, kể cả sắp hết); hết hạn / chưa mua → `null`. `phan_tram` cho món thường,
  `phan_tram_nhom_dac_biet` cho món nhóm đặc biệt (đã kẹp 0–90). `het_han` là giờ VN.
- `so_du_vi`: số đồng KHẢ DỤNG của ví riêng khách = số dư − tiền đang giữ cho phiên thanh toán chưa xong (đúng số quầy hiện). Không cộng ví
  gia đình. Không có ví → 0.
- `gia_hang` (của `/menu`): giá MỘT ly theo từng hạng đang bật (`hang_id` = `id` của `/hang`) + hạng của chính khách nếu hạng đó đã tắt mà thẻ còn hạn (quầy vẫn giảm), máy chủ tính CÙNG hàm với quầy. Hạng 0 % →
  `gia` = giá gốc. Giá món không phải số > 0 → `[]`. Đơn có món đang giờ vàng thì quầy KHÔNG giảm hạng cho cả đơn — App hiện giá giờ vàng.
- **Giờ vàng:** `dang_chay` = đang trong khung VÀ có % VÀ có món (cùng điều kiện quầy giảm giá). Bật mà ngoài khung → `dang_chay: false`
  nhưng `bat_dau / ket_thuc` là khung hôm nay (khung qua nửa đêm đang chạy sau 00:00 thì `bat_dau` là hôm qua). Tắt / % = 0 / không có món → `bat_dau`,
  `ket_thuc` `null`, `phan_tram` 0, `mon` `[]`.
- **Giờ hoạt động:** `bay_gio` = giờ VN của máy chủ (App lấy "bây giờ" ở đây). `dang_mo` = quán đang mở THẬT theo lịch; `nhan_don` = còn nhận
  đơn App (đã trừ "ngừng nhận đơn trước giờ đóng N phút"; ca sau mở đúng lúc / trước khi ca này đóng VÀ đóng muộn hơn — vd chưa cài lịch — thì tính theo giờ đóng của cả chuỗi) — KH-MUA-1 chặn theo `nhan_don`. `hom_nay` = ca đang mở, không thì ca bắt đầu
  hôm nay; `dong` là giờ đóng thật (qua nửa đêm thì là ngày hôm sau; ca sau nối liền / chồng lên thì là giờ đóng của cả chuỗi — cùng mốc `nhan_don` dùng); chưa cài lịch / nghỉ → `null`. `mo_lai_luc` chỉ có khi `dang_mo:
  false`. `thong_bao` = câu ngoài giờ đã điền giờ mở lại (không tìm được giờ mở lại → điền `(chưa có lịch)`); đang mở → `''`. `thu` 2–7 = Thứ Hai–Thứ Bảy, 8 = Chủ nhật; `mo / dong` dạng
  `HH:mm`, `null` khi nghỉ hoặc chưa cài lịch. `ngay_nghi` chỉ gồm ngày từ hôm nay trở đi. Chưa cài gì → mở cả ngày, `thong_bao` rỗng.
  Quầy KHÔNG bị chặn theo giờ hoạt động.

## Mã lỗi
`KH_CHUA_CAU_HINH` 503 · `KH_TOKEN_SAI` 401 · `SDT_KHONG_HOP_LE` 400 · `QUA_NHIEU_LAN` 429 · `MA_SAI` 400 · `MA_HET_HAN` 400 · `CAN_TEN` 400 ·
`TEN_KHONG_HOP_LE` 400 · `KHONG_THAY_DON` 404 · `KHONG_TIM_THAY` 404 · `YEU_CAU_KHONG_HOP_LE` 400 · `LOI_MAY_CHU` 500 · `KHO_BAN` 409 ·
`PUT /pin`: `PIN_KHONG_HOP_LE` 400 · `PIN_KHONG_KHOP` 400 · `PIN_DA_CO` 409 · `KHACH_KHONG_TON_TAI` 404.
`nhan-ma-bill` / `nhan-diem` dùng hàm quầy, thêm các mã: `THIEU_MA` 400 · `MA_KHONG_TON_TAI` 404 · `MA_DA_DUNG` 409 · `UU_DAI_DANG_TAT` 400 ·
`SDT_DA_NHAN` 400 · `DON_FLASH_KHONG_DIEM` 400 · `CAU_HINH_DIEM_SAI` 400 · `CHUA_CAU_HINH_NHOM` 500 · `MA_KHONG_GAN_DON` 400 · `KHONG_THAY_DON` 404 ·
`DON_DA_HUY` 400 · `DON_DA_HOAN` 400 · `DON_KHONG_HOP_LE` 400 · `BILL_CHUA_THANH_TOAN` 400 · `BILL_SDT_KHAC` 400 · `NHANDIEM_DANG_TAT` 400 ·
`MA_DA_NHAN_DIEM` 400 · `TICH_DIEM_DANG_TAT` 400 · `DON_KHONG_DU_DIEM` 400 · `KHONG_THEM_DIEM` 400 · `MA_TRUNG` 409 (cùng `MA_HET_HAN`,
`SDT_KHONG_HOP_LE` ở trên). `MA_HET_HAN` của `nhan-ma-bill` ghi đúng số giờ của cài đặt hạn mã (bằng số giờ in trên bill).
Lỗi máy bất ngờ ở hai cửa này → 500 `LOI_MAY_CHU` như mọi cửa (không lộ lời máy). App hiện nguyên `error`.

## Đã hẹn (chưa có — ghi vào khi xong, tăng PHIEN_BAN)
- KH-MUA-1: đặt đơn khi `nhan_don: false` → máy chủ từ chối `NGOAI_GIO_HOAT_DONG`.
- TOPPING-1: `/menu` thêm topping theo món + giá.
- Đánh giá Google: `loi-moi-danh-gia`, `su-kien`, cờ trên `/don` (tên cuối do POS chốt).

## Phần máy đọc
<!-- HOP_DONG_MAY_DOC -->
```json
{
  "phien_ban": 2,
  "goc": "/api/kh",
  "cua": [
    { "pt": "POST", "duong": "/dang-nhap/xin-ma", "token": false, "tra": ["lay_ma_tai_quay"] },
    { "pt": "POST", "duong": "/dang-nhap/xac-minh", "token": false, "tra": ["token", "khach.sdt", "khach.ten", "khach.ngay_tao"] },
    { "pt": "GET", "duong": "/hang", "token": false, "tra": ["data[].id", "data[].ten", "data[].phan_tram", "data[].phan_tram_nhom_dac_biet", "data[].gia_the", "data[].thu_tu"] },
    { "pt": "GET", "duong": "/gio-vang", "token": false, "tra": ["dang_chay", "bat_dau", "ket_thuc", "phan_tram", "mon"] },
    { "pt": "GET", "duong": "/gio-hoat-dong", "token": false, "tra": ["bay_gio", "dang_mo", "nhan_don", "hom_nay", "mo_lai_luc", "thong_bao", "lich_tuan[].thu", "lich_tuan[].mo", "lich_tuan[].dong", "lich_tuan[].nghi", "ngay_nghi"] },
    { "pt": "GET", "duong": "/toi", "token": true, "tra": ["khach.sdt", "khach.ten", "khach.ngay_tao", "khach.qr", "khach.hang.id", "khach.hang.ten", "khach.hang.phan_tram", "khach.hang.phan_tram_nhom_dac_biet", "khach.hang.het_han", "khach.so_du_vi"] },
    { "pt": "PUT", "duong": "/toi", "token": true, "tra": ["khach.sdt", "khach.ten", "khach.ngay_tao"] },
    { "pt": "GET", "duong": "/menu", "token": true, "tra": ["data[].ma", "data[].ten", "data[].nhom", "data[].gia", "data[].con_hang", "data[].ton_cu", "data[].ton_luc", "data[].gia_hang[].hang_id", "data[].gia_hang[].gia"] },
    { "pt": "GET", "duong": "/diem", "token": true, "tra": ["points", "history"] },
    { "pt": "GET", "duong": "/voucher", "token": true, "tra": ["data", "ma_khach_moi"] },
    { "pt": "GET", "duong": "/don", "token": true, "tra": ["trang", "con_nua", "data[].ma", "data[].ngay", "data[].tong", "data[].da_tra", "data[].trang_thai", "data[].thanh_toan"] },
    { "pt": "GET", "duong": "/don/:ma", "token": true, "tra": ["don.ma", "don.ngay", "don.tong", "don.da_tra", "don.trang_thai", "don.thanh_toan", "don.mon[].ten", "don.mon[].so_luong", "don.mon[].don_gia", "don.mon[].thanh_tien", "don.mon[].ghi_chu"] },
    { "pt": "POST", "duong": "/nhan-ma-bill", "token": true, "tra": [] },
    { "pt": "POST", "duong": "/nhan-diem", "token": true, "tra": [] },
    { "pt": "PUT", "duong": "/pin", "token": true, "tra": [] }
  ],
  "ma_loi": ["KH_CHUA_CAU_HINH", "KH_TOKEN_SAI", "SDT_KHONG_HOP_LE", "QUA_NHIEU_LAN", "MA_SAI", "MA_HET_HAN", "CAN_TEN", "TEN_KHONG_HOP_LE",
    "KHONG_THAY_DON", "KHONG_TIM_THAY", "YEU_CAU_KHONG_HOP_LE", "LOI_MAY_CHU", "KHO_BAN",
    "PIN_KHONG_HOP_LE", "PIN_KHONG_KHOP", "PIN_DA_CO", "KHACH_KHONG_TON_TAI",
    "THIEU_MA", "MA_KHONG_TON_TAI", "MA_DA_DUNG", "UU_DAI_DANG_TAT", "SDT_DA_NHAN", "DON_FLASH_KHONG_DIEM", "CAU_HINH_DIEM_SAI", "CHUA_CAU_HINH_NHOM",
    "MA_KHONG_GAN_DON", "DON_DA_HUY", "DON_DA_HOAN", "DON_KHONG_HOP_LE", "BILL_CHUA_THANH_TOAN", "BILL_SDT_KHAC", "NHANDIEM_DANG_TAT", "MA_DA_NHAN_DIEM",
    "TICH_DIEM_DANG_TAT", "DON_KHONG_DU_DIEM", "KHONG_THEM_DIEM", "MA_TRUNG"]
}
```
<!-- HET HOP_DONG_MAY_DOC -->

## Nhật ký
- v1 · 28.10.2026 · Bản đầu, ghi đúng code POS b1f8299 (chat App KH soạn, chat POS đặt vào kho). Chat POS đối chiếu code trước khi đặt:
  thêm 8 mã lỗi có thật của `nhan-ma-bill` / `nhan-diem` và dòng "Lỗi đã biết" (500 không `code`).
- v2 · 29.10.2026 · KH-API-2: thêm `GET /hang`, `GET /gio-vang`, `GET /gio-hoat-dong` (không cần token); `/toi` thêm `hang`, `so_du_vi`;
  `/menu` thêm `gia_hang`; thêm 12 mã lỗi có thật của `nhan-ma-bill` / `nhan-diem`; hạn `nhan-ma-bill` theo cài đặt hạn mã; bỏ dòng "Lỗi đã
  biết" (code đã trả `LOI_MAY_CHU`). Không đổi / xoá trường cũ — App v1 chạy nguyên. Bài thử `cong_cu/thu_HOPDONG_KH.js` canh từ bản này.
