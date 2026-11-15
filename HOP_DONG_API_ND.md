# Hợp đồng cổng `/api/nd` — Kho nội dung App KH (POS giữ hộ)

PHIEN_BAN: 1
NGAY: 2026-11-14
DOC_TU_CODE: ND-API-1 (server/nd/duong.js, xacThuc.js, tinh.js, duLieu.js, cauNoi.js, khoaSaoLuu.js, nang_cap/027_noi_dung.js) — bài thử cong_cu/thu_NDAPI1.js canh khớp code

<!-- Hợp đồng RIÊNG của /api/nd — KHÔNG chung số phiên bản với HOP_DONG_API_KH.md (/api/kh). Chủ: POS. Đổi cửa / trường / mã lỗi / giới hạn
     → đổi file này cùng PR, tăng PHIEN_BAN, ghi nhật ký cuối file. Khối HOP_DONG_ND_MAY_DOC là phần máy đọc (bài thử L1–L4 so với code). -->

## Chung
- Địa chỉ: `https://www.pos-tuquyduong.io.vn/api/nd` (CÓ `www`, như `/api/kh`). Kho là "hộp chứa" khoá → giá trị: POS KHÔNG hiểu nghĩa chữ, App giữ danh mục
  và kiểm tra. Nhà riêng: mã ở `server/nd/`, bảng `nd_*` không khoá ngoại sang bảng POS, không đọc / ghi tiền, khách, đơn, kho. Sau này tách máy chủ
  App (KH-TACH-1): dựng máy mới → **Nhập toàn bộ** tệp **Xuất** → đổi một địa chỉ.
- **CORS:** chỉ `https://tuquyduong.com` và `https://app-kh.pages.dev`. Origin khác không nhận `Access-Control-Allow-Origin` (trình duyệt chặn).
- **Lỗi** luôn `{ error: '<lời tiếng Việt>', code: 'MA_IN_HOA' }` — App hiện nguyên `error`. Thành công có `success: true` (trừ `GET /anh/:ma` trả byte
  ảnh và `GET /xuat` trả nguyên tệp).
- **Giờ** (`luc`, `het_han`, `xuat_luc`…): giờ Việt Nam `YYYY-MM-DDTHH:mm:ss`, không hậu tố múi giờ (như `/api/kh`).
- **Vé:** `POST /dang-nhap` bằng tài khoản POS → `ve` (hạn 12 giờ). Gửi lại `Authorization: Bearer <ve>`. Vé `/api/nd` KHÔNG dùng được ở `/api/pos`, vé
  POS không dùng được ở `/api/nd`. Quyền đọc lại MỖI lần gọi: chủ quán thu quyền / khoá tài khoản là có hiệu lực ngay (lần gọi kế tiếp 403 / 401).
  `quyen[]` lúc đăng nhập chỉ để App ẩn / hiện nút — máy chủ không tin nó.
- **Khoá sao lưu chỉ đọc** (`ndk_…`, chủ quán tạo / thu hồi ở Cài đặt POS › 📱 App khách hàng, có PIN chủ quán): gửi `Authorization: Bearer ndk_…`,
  CHỈ gọi được `GET /xuat`; cửa khác → 403 `KHONG_DU_QUYEN`; khoá đã thu hồi / bịa → 401 `CHUA_DANG_NHAP`. Khoá hiện đúng một lần lúc tạo.

## Các cửa
| Cửa | Vé / quyền | Gửi | Trả (ngoài `success`) |
|---|---|---|---|
| `GET /ban-dang-chay?co=<so_ban>` | không | `co` = số bản App đang có (bỏ được) | trùng → `khong_doi: true, so_ban`; khác → `so_ban, gia_tri {}` (kho trống: bản 0, `{}`). `Cache-Control: no-store` |
| `GET /anh/:ma` | không | `ma` = 64 ký tự hex | byte ảnh, `Content-Type` theo loại, `Cache-Control: public, max-age=31536000, immutable` |
| `POST /dang-nhap` | không | `{ ten_dang_nhap, mat_khau }` | `ve, het_han, quyen[], nguoi { ten_dang_nhap, ten_hien }` |
| `GET /nhap` | `nd_xem` | — | `so_ban` (bản đang chạy), `nhap[] { khoa, gia_tri, nguoi, luc, ban_goc }` |
| `PUT /nhap` | `nd_sua` | `{ khoa, gia_tri, ban_goc }` — MỘT khoá / lần, ghi đè nháp của khoá đó | `khoa, luc` |
| `DELETE /nhap/:khoa` | `nd_sua` | — | `khoa` (không có nháp đó → 404) |
| `POST /cap-nhat` | `nd_cap_nhat` | `{ ban_goc, ghi_chu? }` (`ghi_chu` ≤ 500 ký tự) | `so_ban, tu_ban (null), so_khoa` — bản mới = bản đang chạy + mọi nháp; xoá nháp |
| `GET /phien-ban` | `nd_xem` | — | `data[] { so_ban, ghi_chu, tom_tat, nguoi, luc, tu_ban, dang_chay }` (mới trước, KHÔNG kèm `gia_tri`) |
| `GET /phien-ban/:so` | `nd_xem` | — | `ban { so_ban, gia_tri, ghi_chu, tom_tat, nguoi, luc, tu_ban, dang_chay }` |
| `POST /quay-lai` | `nd_cap_nhat` | `{ so, ban_goc, ghi_chu? }` (`ghi_chu` ≤ 500 ký tự) | `so_ban, tu_ban` — tạo bản MỚI cùng nội dung bản `so`, không xoá gì, nháp giữ nguyên |
| `POST /anh` | `nd_sua` | multipart, MỘT tệp ở trường `anh` | `ma, url, loai, kich_thuoc, moi` — `url` = `/api/nd/anh/<ma>`; trùng mã → ảnh cũ, `moi: false` |
| `GET /xuat` | `nd_xuat_nhap` hoặc khoá sao lưu | — | tệp JSON (tải về): `{ dinh_dang: 1, xuat_luc, ban[], nhap[], anh[] { ma, loai, kich_thuoc, luc, du_lieu_base64 }, nhat_ky[] { nguoi, luc, viec, so_ban, so_khoa } }` |
| `POST /nhap-toan-bo` | `nd_xuat_nhap` | nguyên tệp của `GET /xuat` (JSON, ≤ 50 MB) | `so_luong_ban, so_nhap, so_anh, so_nhat_ky` (số LƯỢNG đã nhập) — CHỈ khi kho trống (không bản, không nháp, không ảnh); tệp phải có đúng một bản đang chạy và đó là bản số lớn nhất; bản đang chạy + mọi nháp trong tệp ≤ 1 MB (như `PUT /nhap`) |

## Quy tắc
- **Khoá** `[a-zA-Z0-9._-]`, 1–80 ký tự. **Giá trị**: chuỗi / số / đúng-sai / mảng / object (không `null`).
- **Một bản ≤ 1.048.576 byte** (byte UTF-8 của JSON đầy đủ — chữ tiếng Việt có dấu tốn 2–3 byte). `PUT /nhap` báo sớm 413 khi bản đang chạy + mọi nháp
  (đã thay khoá này) vượt; `cap-nhat` / `quay-lai` / `nhap-toan-bo` kiểm lại lúc ghi.
- **Ảnh ≤ 512.000 byte**, chỉ WebP / JPEG / PNG — máy chủ nhận dạng theo BYTE ĐẦU tệp, không tin tên / loại khai báo (`loai` trả về là loại thật).
  `ma` = SHA-256 nội dung → cùng ảnh luôn cùng `ma`, URL không bao giờ đổi nội dung (cache vĩnh viễn an toàn). POS lưu ảnh ngay trong bảng (không có
  `duong_dan` tệp) — App dùng `url`.
- **Cập nhật an toàn:** `cap-nhat` và `quay-lai` gửi `ban_goc` = số bản App đang thấy. Khác bản đang chạy → 409 `CO_BAN_MOI_HON`, không ghi gì → App tải
  lại (`GET /nhap`, `GET /ban-dang-chay`) rồi làm tiếp. Hai người bấm cùng lúc → đúng một người thành công. `ban_goc` trong `PUT /nhap` chỉ được lưu kèm
  nháp (App biết nháp bắt đầu từ bản nào), không chặn.
- **Giữ mọi bản**, không xoá phiên bản; luôn đúng MỘT bản đang chạy khi kho đã có bản.
- **Đăng nhập sai:** không có tên / sai mật khẩu / tài khoản khoá → cùng 401 `SAI_DANG_NHAP` (không lộ tên có tồn tại). Sai 5 lần liền theo CẶP
  (tên + IP) hoặc theo IP → 429 `QUA_NHIEU_LAN` trong 15 phút (kể cả gõ đúng). Không khoá một tên trên mọi máy. Đăng nhập đúng đặt lại bộ đếm của
  cặp đó và IP đó.
- **Nhật ký** (`nhat_ky`, `viec`): `luu` · `bo_nhap` · `cap_nhat` · `quay_lai` · `xuat` · `nhap`. `so_ban`: luu = `ban_goc` của nháp · cap_nhat /
  quay_lai = số bản MỚI · xuat / nhap = bản đang chạy lúc đó · bo_nhap = null. `so_khoa` = số khoá việc đó đụng tới: luu / bo_nhap 1 · cap_nhat số nháp
  gộp vào · quay_lai số khoá của bản đem về · nhap số nháp trong tệp · xuat null.
- **Sao lưu ở POS:** sao lưu Excel của POS có trang `Nội dung App (JSON)` = tệp Xuất (cắt ô ≤ 30.000 ký tự); khôi phục Excel BỎ QUA trang đó — dựng lại
  nội dung App bằng /admin › Nhập toàn bộ vào kho trống.

## Khối máy đọc
```json HOP_DONG_ND_MAY_DOC
{
  "phien_ban": 1,
  "cua": [
    { "phuong_thuc": "GET", "duong": "/ban-dang-chay", "quyen": null },
    { "phuong_thuc": "GET", "duong": "/anh/:ma", "quyen": null },
    { "phuong_thuc": "POST", "duong": "/dang-nhap", "quyen": null },
    { "phuong_thuc": "GET", "duong": "/nhap", "quyen": "nd_xem" },
    { "phuong_thuc": "PUT", "duong": "/nhap", "quyen": "nd_sua" },
    { "phuong_thuc": "DELETE", "duong": "/nhap/:khoa", "quyen": "nd_sua" },
    { "phuong_thuc": "POST", "duong": "/cap-nhat", "quyen": "nd_cap_nhat" },
    { "phuong_thuc": "GET", "duong": "/phien-ban", "quyen": "nd_xem" },
    { "phuong_thuc": "GET", "duong": "/phien-ban/:so", "quyen": "nd_xem" },
    { "phuong_thuc": "POST", "duong": "/quay-lai", "quyen": "nd_cap_nhat" },
    { "phuong_thuc": "POST", "duong": "/anh", "quyen": "nd_sua" },
    { "phuong_thuc": "GET", "duong": "/xuat", "quyen": "nd_xuat_nhap", "khoa_sao_luu": true },
    { "phuong_thuc": "POST", "duong": "/nhap-toan-bo", "quyen": "nd_xuat_nhap" }
  ],
  "quyen": [
    { "ma": "nd_xem", "nhan": "Xem Chế độ sửa App" },
    { "ma": "nd_sua", "nhan": "Sửa nội dung App (Lưu nháp)" },
    { "ma": "nd_cap_nhat", "nhan": "Cập nhật toàn bộ + quay lại phiên bản" },
    { "ma": "nd_xuat_nhap", "nhan": "Xuất / nhập toàn bộ" }
  ],
  "ma_loi": {
    "CHUA_DANG_NHAP": 401, "SAI_DANG_NHAP": 401, "KHONG_DU_QUYEN": 403, "KHONG_TIM_THAY": 404,
    "CO_BAN_MOI_HON": 409, "KHO_DA_CO_DU_LIEU": 409, "KHO_BAN": 409,
    "KHOA_KHONG_HOP_LE": 400, "GIA_TRI_KHONG_HOP_LE": 400, "DU_LIEU_KHONG_HOP_LE": 400, "KHONG_CO_NHAP": 400, "ANH_KHONG_HOP_LE": 400,
    "QUA_LON": 413, "QUA_NHIEU_LAN": 429, "LOI_MAY_CHU": 500
  },
  "gioi_han": { "khoa_toi_da": 80, "ban_toi_da_byte": 1048576, "anh_toi_da_byte": 512000, "nhap_toan_bo_toi_da_byte": 52428800, "sai_toi_da": 5, "khoa_phut": 15, "ve_gio": 12, "ghi_chu_toi_da": 500 }
}
```

## Nhật ký
- v1 (14.11.2026, ND-API-1): bản đầu — đúng tên cửa / bảng / mã lỗi thư App 11.11 (a). Khác thư: ảnh lưu trong bảng (`url`, không `duong_dan`);
  ảnh gửi multipart trường `anh` (thư chưa nói dạng gửi); `GET /nhap` trả `so_ban` của bản đang chạy.
