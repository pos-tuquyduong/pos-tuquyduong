# Hợp đồng cổng `/api/kh` — POS ↔ App KH

PHIEN_BAN: 1
NGAY: 2026-10-28
DOC_TU_CODE: POS main b1f8299 (server/routes/kh/index.js, loi.js, middleware/khachAuth.js, utils/pinKhach.js, utils/maKhach.js, routes/wallets.js loiGhi)

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

## Các cửa (phiên bản 1)
| Cửa | Token | Gửi | Trả (ngoài `success`) |
|---|---|---|---|
| `POST /dang-nhap/xin-ma` | không | `{ sdt }` | `lay_ma_tai_quay` (true = khách hỏi mã ở quầy) |
| `POST /dang-nhap/xac-minh` | không | `{ sdt, ma, ten? }` (mã 6 số; khách mới thiếu tên → `CAN_TEN`) | `token`, `khach { sdt, ten, ngay_tao }` |
| `GET /toi` | có | — | `khach { sdt, ten, ngay_tao, qr }` |
| `PUT /toi` | có | `{ ten }` | `khach { sdt, ten, ngay_tao }` |
| `GET /menu` | có | — | `data[] { ma, ten, nhom, gia, con_hang, ton_cu, ton_luc }` — `con_hang` có thể `null` |
| `GET /diem` | có | — | `points`, `history` |
| `GET /voucher` | có | `?all=1` lấy cả mã đã dùng / hết hạn | `data[]`, `ma_khach_moi` |
| `GET /don` | có | `?trang=N` (20 đơn / trang) | `trang`, `con_nua`, `data[] { ma, ngay, tong, da_tra, trang_thai, thanh_toan }` |
| `GET /don/:ma` | có | — | `don { ma, ngay, tong, da_tra, trang_thai, thanh_toan, mon[] { ten, so_luong, don_gia, thanh_tien, ghi_chu } }` |
| `POST /nhan-ma-bill` | có | `{ ma }` | kết quả nhận ưu đãi khách mới |
| `POST /nhan-diem` | có | `{ ma }` | kết quả nhân điểm theo mã trên bill |
| `PUT /pin` | có | `{ pin, pin_lai }` (4 số) | — |

## Mã lỗi
`KH_CHUA_CAU_HINH` 503 · `KH_TOKEN_SAI` 401 · `SDT_KHONG_HOP_LE` 400 · `QUA_NHIEU_LAN` 429 · `MA_SAI` 400 · `MA_HET_HAN` 400 · `CAN_TEN` 400 ·
`TEN_KHONG_HOP_LE` 400 · `KHONG_THAY_DON` 404 · `KHONG_TIM_THAY` 404 · `YEU_CAU_KHONG_HOP_LE` 400 · `LOI_MAY_CHU` 500 · `KHO_BAN` 409 ·
`PUT /pin`: `PIN_KHONG_HOP_LE` 400 · `PIN_KHONG_KHOP` 400 · `PIN_DA_CO` 409 · `KHACH_KHONG_TON_TAI` 404.
`nhan-ma-bill` / `nhan-diem` dùng hàm quầy, thêm các mã: `THIEU_MA` 400 · `MA_KHONG_TON_TAI` 404 · `MA_DA_DUNG` 409 · `UU_DAI_DANG_TAT` 400 ·
`SDT_DA_NHAN` 400 · `DON_FLASH_KHONG_DIEM` 400 · `CAU_HINH_DIEM_SAI` 400 · `CHUA_CAU_HINH_NHOM` 500 (cùng `MA_HET_HAN`, `SDT_KHONG_HOP_LE` ở trên).
App hiện nguyên `error`.
**Lỗi đã biết (sửa ở KH-API-2):** khi hai cửa này gặp lỗi máy bất ngờ, câu trả lời 500 hiện chỉ có `{ error }` (lời máy, KHÔNG có `code`) — App
coi 500 không `code` như `LOI_MAY_CHU` và hiện lời chung, không hiện nguyên lời máy.

## Đã hẹn (chưa có — ghi vào khi xong, tăng PHIEN_BAN)
- KH-API-2: `/toi` thêm hạng + số dư ví; cửa danh sách hạng; cửa Giờ vàng hôm nay; `/menu` thêm giá từng hạng; **cửa giờ hoạt động**
  `GET /gio-hoat-dong` (không cần token) → `bay_gio`, `dang_mo`, `hom_nay`, `mo_lai_luc`, `thong_bao`, `lich_tuan`, `ngay_nghi`.
- KH-MUA-1: đặt đơn ngoài giờ hoạt động → máy chủ từ chối `NGOAI_GIO_HOAT_DONG`.
- TOPPING-1: `/menu` thêm topping theo món + giá.
- Đánh giá Google: `loi-moi-danh-gia`, `su-kien`, cờ trên `/don` (tên cuối do POS chốt).

## Phần máy đọc
<!-- HOP_DONG_MAY_DOC -->
```json
{
  "phien_ban": 1,
  "goc": "/api/kh",
  "cua": [
    { "pt": "POST", "duong": "/dang-nhap/xin-ma", "token": false, "tra": ["lay_ma_tai_quay"] },
    { "pt": "POST", "duong": "/dang-nhap/xac-minh", "token": false, "tra": ["token", "khach.sdt", "khach.ten", "khach.ngay_tao"] },
    { "pt": "GET", "duong": "/toi", "token": true, "tra": ["khach.sdt", "khach.ten", "khach.ngay_tao", "khach.qr"] },
    { "pt": "PUT", "duong": "/toi", "token": true, "tra": ["khach.sdt", "khach.ten", "khach.ngay_tao"] },
    { "pt": "GET", "duong": "/menu", "token": true, "tra": ["data[].ma", "data[].ten", "data[].nhom", "data[].gia", "data[].con_hang", "data[].ton_cu", "data[].ton_luc"] },
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
    "THIEU_MA", "MA_KHONG_TON_TAI", "MA_DA_DUNG", "UU_DAI_DANG_TAT", "SDT_DA_NHAN", "DON_FLASH_KHONG_DIEM", "CAU_HINH_DIEM_SAI", "CHUA_CAU_HINH_NHOM"]
}
```
<!-- HET HOP_DONG_MAY_DOC -->

## Nhật ký
- v1 · 28.10.2026 · Bản đầu, ghi đúng code POS b1f8299 (chat App KH soạn, chat POS đặt vào kho). Chat POS đối chiếu code trước khi đặt:
  thêm 8 mã lỗi có thật của `nhan-ma-bill` / `nhan-diem` và dòng "Lỗi đã biết" (500 không `code`).
