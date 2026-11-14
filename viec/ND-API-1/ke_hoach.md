# ND-API-1 — kế hoạch (CHỜ CHỦ QUÁN DUYỆT)

## Nói ngắn cho chủ quán
Mình dựng một "nhà riêng" cho nội dung App (chữ / ảnh / nút) bên trong máy chủ POS: thư mục `server/nd/`, cửa `/api/nd/*`, bảng `nd_*`.
Nhà này không đụng tiền, khách, đơn, kho; chỉ hỏi POS "người này là ai, có quyền gì" qua MỘT tệp cầu nối. Bạn cần: đọc mục
**"Cần chủ quán trả lời"** ở cuối (8 câu, mỗi câu đã có đề xuất — chỉ cần gõ "đồng ý" hoặc sửa câu nào bạn muốn khác).

## Code đã đọc trong lượt này (căn cứ của kế hoạch)
- `server/index.js`: `app.use(cors({ origin: '*' …}))` đặt cho MỌI đường, trước `express.json({ limit: '5mb' })` và mọi route.
  → nếu gắn `/api/nd` SAU dòng này thì mọi phản hồi /api/nd đã mang `Access-Control-Allow-Origin: *`. Cách giữ đúng nghiệm thu H mà không đổi
  CORS của /api/kh, /api/pos: gắn `/api/nd` **TRƯỚC** dòng cors chung (một dòng), router nd tự làm CORS + đọc thân + 404 + lỗi của riêng nó,
  không bao giờ `next()` ra ngoài.
- `server/middleware/auth.js`: `authenticate` kiểm JWT bằng `JWT_SECRET`, đọc `pos_users` mỗi lần (is_active có hiệu lực ngay);
  `checkPermission`: role `owner` qua thẳng, vai trò khác đọc `pos_permissions`.
- `server/routes/auth.js` `/login`: bcrypt `compareSync`, không đếm lần sai, tài khoản khoá trả câu riêng (Phát hiện).
- `server/routes/users.js`: `allPermissions` là danh sách phẳng `{ key, label }`; `PUT /permissions/:role` ghi tuỳ ý khoá → 4 quyền mới
  lưu được ngay không cần sửa đường ghi.
- `client/src/pages/Settings.jsx` thẻ Phân quyền: hai lưới `allPerms.map(...)` (Manager, Staff), không có nhóm.
- `server/utils/pinChuQuan.js` `kiemPinChuQuan` (khoá 5 lần / 15 phút, giữ chỗ lượt trước khi bcrypt) + khuôn `quaPin` ở `routes/goi-nap.js`;
  giao diện `CaiDat/GoiNap.jsx` + `components/HoiPin`.
- `server/routes/backup.js`: `BACKUP_TABLES`, `export-all` ghi mỗi bảng một trang; `restore` = `chanTrangTien` → `lapKeHoach` → `thucHien`
  (`utils/khoiPhuc.js`, ngoài Phạm vi): trang lạ → `BANG_LA` bỏ qua. `cong_cu/thu_SAOLUU2.js` D2c: MỌI `CREATE TABLE IF NOT EXISTS` trong
  `server/nang_cap/**` phải có trong `BACKUP_TABLES`.
- `server/utils/donThu.js`: `THU_TU_XOA` (chỉ bảng pos_*), `BANG_KHONG_DON`, `chiaPhan` (cắt chuỗi ≤ 30.000 ký tự, không cắt đôi emoji);
  `thu_KHSDT1.js` D14 dò PRAGMA bảng có cột SĐT / order_id.
- `server/database.js`: `beginTransaction` (giao dịch ghi, thử lại khi bận), `laLoiBan`; `server/nang_cap/chay.js` (mỗi bước một giao dịch).
- `kiem_tra_truoc_khi_giao.js` `chayBaiThat(...)` nối bài thử chạy thật; khuôn bài `cong_cu/thu_HUY1.js` (kho libsql tạm, giả `ketNoiKho.js`).

## Bố trí — phương án

### Phần 1 · Máy chủ nd
| | A (chọn) | B |
|---|---|---|
| Cách | Mục nghiệp vụ mới theo LUAT §3: `server/nd/duong.js` · `tinh.js` · `duLieu.js` · `xacThuc.js` · `cauNoi.js` · `khoaSaoLuu.js` | Một tệp `server/nd/index.js` |
| Dòng | ~640 (duong 170 · tinh 70 · duLieu 210 · xacThuc 100 · cauNoi 35 · khoaSaoLuu 55) | ~560 |
| Rủi ro | thấp; `tinh.js` thử thuần được | tệp > 500 dòng (LUAT §3 bắt tách), khó soi luật "chỉ cauNoi.js chạm pos_" |

- `cauNoi.js` — tệp DUY NHẤT trong `server/nd/` có chữ `pos_`: `timNguoiDung(ten)`, `docNguoiDung(id)` (đọc `pos_users`: id, username,
  password, role, is_active), `coQuyen(role, quyen)` (owner → true như `checkPermission`; khác đọc `pos_permissions`), và chuyển tiếp
  `authenticate` + `kiemPinChuQuan` của POS cho thẻ Cài đặt khoá sao lưu.
- `xacThuc.js` — vé riêng: ký JWT bằng khoá **dẫn xuất** `HMAC-SHA256(JWT_SECRET, 'nd-v1')` + `aud: 'nd'`, hạn 12 giờ (hằng `VE_HAN`).
  Vé POS ký bằng `JWT_SECRET` trần → sai chữ ký ở /api/nd; vé nd sai chữ ký ở /api/pos → **không sửa một dòng nào của auth POS** (xem Q-E).
  Middleware `canQuyen('nd_sua')`: kiểm vé → đọc lại `pos_users.is_active` + quyền qua cauNoi MỖI lần (nghiệm thu F).
  Giới hạn đăng nhập sai (Q-A) + khoá sao lưu (`Bearer ndk_…` → băm SHA-256 so bảng; chỉ `GET /xuat`).
- `tinh.js` (thuần) — `khoaHopLe` (`^[a-zA-Z0-9._-]{1,80}$`), `giaTriHopLe` (chuỗi / số hữu hạn / đúng-sai / mảng / object; null &
  undefined → không), `soByte(obj)` = `Buffer.byteLength(JSON.stringify(obj))`, `loaiAnh(buf)` theo byte đầu (PNG `89 50 4E 47 0D 0A 1A 0A`,
  JPEG `FF D8 FF`, WebP `RIFF????WEBP`), `ghepNhap(banCu, nhap[])`, `tomTat(cacKhoa)`.
- `duLieu.js` — mọi câu đọc / ghi `nd_*`. Đường ghi tiền-giống (cập nhật, quay lại, nhập toàn bộ) chạy trong MỘT `beginTransaction`:
  đọc bản đang chạy TRONG giao dịch → so `ban_goc` → `UPDATE nd_ban SET dang_chay = 0 WHERE so_ban = ? AND dang_chay = 1` (kiểm
  `changes === 1`) → `INSERT` bản `so_ban + 1` (khoá chính — người thứ hai đụng khoá) → xoá nháp → nhật ký. Thêm chỉ mục
  `UNIQUE (dang_chay) WHERE dang_chay = 1` → kho tự giữ "đúng MỘT bản đang chạy" (khoá, không lời dặn).
- `duong.js` — router `/api/nd`: `cors({ origin: [2 tên miền] })`, `express.json` theo cửa (thường 1,5 MB; `nhap-toan-bo` 50 MB — Q-G),
  multer bộ nhớ cho ảnh (≤ 500 KB → 413 `QUA_LON`), 404 `KHONG_TIM_THAY` cho đường lạ, bắt lỗi JSON hỏng → 400, kho bận → 409 `KHO_BAN`,
  lỗi khác → 500 `LOI_MAY_CHU` (không lộ lời máy).
- `khoaSaoLuu.js` — router riêng gắn ở `/api/pos/nd-khoa-sao-luu` (vé POS, chỉ owner, PIN chủ quán): `GET /` danh sách (không có khoá),
  `POST /` tạo (trả khoá MỘT lần), `POST /:id/thu-hoi`. Gắn dưới /api/pos để vé POS không cần đi vào /api/nd (G: "và ngược lại").
- `server/index.js`: thêm 2 dòng (`/api/nd` trước cors chung; `/api/pos/nd-khoa-sao-luu` cạnh các route pos).

### Bảng — bước `server/nang_cap/027_noi_dung.js` (~55 dòng)
```
nd_ban       (so_ban INTEGER PRIMARY KEY, gia_tri TEXT NOT NULL, ghi_chu TEXT, tom_tat TEXT, nguoi TEXT, luc TEXT NOT NULL,
              tu_ban INTEGER, dang_chay INTEGER NOT NULL DEFAULT 0)      + UNIQUE INDEX nd_ban_mot_dang_chay ON nd_ban(dang_chay) WHERE dang_chay = 1
nd_nhap      (khoa TEXT PRIMARY KEY, gia_tri TEXT NOT NULL, nguoi TEXT, luc TEXT NOT NULL, ban_goc INTEGER NOT NULL)
nd_anh       (ma TEXT PRIMARY KEY, loai TEXT NOT NULL, kich_thuoc INTEGER NOT NULL, du_lieu BLOB NOT NULL, luc TEXT NOT NULL)
nd_nhat_ky   (id INTEGER PRIMARY KEY AUTOINCREMENT, nguoi TEXT, luc TEXT NOT NULL, viec TEXT NOT NULL CHECK (viec IN
              ('luu','bo_nhap','cap_nhat','quay_lai','xuat','nhap')), so_ban INTEGER, so_khoa INTEGER)
nd_khoa_sao_luu (id INTEGER PRIMARY KEY AUTOINCREMENT, ten TEXT, ma_bam TEXT UNIQUE NOT NULL, tao_luc TEXT NOT NULL, tao_boi TEXT,
              thu_hoi_luc TEXT)
nd_lan_sai   (khoa TEXT PRIMARY KEY, sai INTEGER NOT NULL, khoa_den TEXT)        -- đếm đăng nhập sai (Q-A); khoa = 'u:<tên>' | 'ip:<ip>'
```
- Không khoá ngoại sang bảng POS; `nguoi` là chữ (username) như các sổ khác. Giờ ghi bằng `getNow()`, không DEFAULT CURRENT_TIMESTAMP.
- Gieo 4 quyền `nd_xem` · `nd_sua` · `nd_cap_nhat` · `nd_xuat_nhap` (INSERT OR IGNORE; owner 1, manager 0, staff 0) — chỉ khi có
  `pos_permissions` (khuôn bước 018 / 025). Kho trống: `ban-dang-chay` trả `{ so_ban: 0, gia_tri: {} }`.

### Cửa `/api/nd` (nghiệm thu C) — quyền mỗi cửa
| Cửa | Vé / quyền | Ghi chú |
|---|---|---|
| `GET /ban-dang-chay?co=N` | công khai | `co` = số bản App đang có → trùng thì `{ khong_doi: true, so_ban }` |
| `GET /anh/:ma` | công khai | `ma` 64 hex; `Cache-Control: public, max-age=31536000, immutable`; `Content-Type` = loại đã nhận dạng |
| `POST /dang-nhap` | — | `{ ten_dang_nhap, mat_khau }` → `{ ve, het_han, quyen[], nguoi { ten_dang_nhap, ten_hien } }` |
| `GET /nhap` | nd_xem | mọi nháp + `ban_dang_chay` |
| `PUT /nhap` | nd_sua | `{ khoa, gia_tri, ban_goc }` (một khoá / lần — Q-F) · bản đang chạy + mọi nháp > 1 MB → 413 |
| `DELETE /nhap/:khoa` | nd_sua | nhật ký `bo_nhap` |
| `POST /cap-nhat` | nd_cap_nhat | `{ ban_goc, ghi_chu? }` · không có nháp → 400 `KHONG_CO_NHAP` |
| `GET /phien-ban` | nd_xem | danh sách KHÔNG kèm `gia_tri` |
| `GET /phien-ban/:so` | nd_xem | một bản đủ `gia_tri` |
| `POST /quay-lai` | nd_cap_nhat | `{ so_ban, ban_goc, ghi_chu? }` → bản MỚI, `tu_ban = so_ban` |
| `POST /anh` | nd_sua | multipart, trường `anh` (Q-F); trùng mã → trả ảnh cũ (200, `moi: false`) |
| `GET /xuat` | nd_xuat_nhap HOẶC khoá sao lưu | tệp JSON `{ dinh_dang: 1, xuat_luc, ban[], nhap[], anh[] { ma, loai, kich_thuoc, luc, du_lieu_base64 }, nhat_ky[] }` (không xuất khoá sao lưu, bộ đếm sai) |
| `POST /nhap-toan-bo` | nd_xuat_nhap | chỉ khi 4 bảng nội dung TRỐNG (đếm TRONG giao dịch) — có dữ liệu → 409 `KHO_DA_CO_DU_LIEU` |

Mã lỗi (chốt, ghi hợp đồng): `CHUA_DANG_NHAP` 401 · `SAI_DANG_NHAP` 401 (một câu chung cho: không có tên / sai mật khẩu / tài khoản khoá) ·
`KHONG_DU_QUYEN` 403 · `CO_BAN_MOI_HON` 409 · `KHO_DA_CO_DU_LIEU` 409 · `KHO_BAN` 409 · `KHOA_KHONG_HOP_LE` 400 · `GIA_TRI_KHONG_HOP_LE` 400 ·
`DU_LIEU_KHONG_HOP_LE` 400 (thân hỏng / thiếu trường) · `KHONG_CO_NHAP` 400 · `ANH_KHONG_HOP_LE` 400 · `QUA_LON` 413 · `QUA_NHIEU_LAN` 429 ·
`KHONG_TIM_THAY` 404 · `LOI_MAY_CHU` 500.

### Phần 2 · Quyền + Cài đặt (giao diện)
| | A (chọn) | B |
|---|---|---|
| Nhóm quyền | `users.js`: 4 mục mới mang `nhom: 'App khách hàng — nội dung'`; `Settings.jsx`: hai lưới hiện tiêu đề nhóm khi `p.nhom` đổi (~8 dòng) | Tách thẻ Phân quyền ra `CaiDat/PhanQuyen.jsx` (~120 dòng chuyển chỗ — đụng nhiều Settings.jsx, va VOUCHER-2 / QC-APP-1) |
| Khoá sao lưu | Thẻ nhỏ mới `CaiDat/AppKhachHang.jsx` (~95 dòng, khuôn GoiNap + HoiPin), Settings.jsx thêm ~6 dòng (import, nút, nhánh vẽ), chỉ owner | Đặt trong thẻ Phân quyền (lẫn hai việc vào một màn) |
| api.js | `ndKhoaApi { ds, tao, thuHoi }` ~8 dòng | — |

### Phần 3 · Sao lưu + dọn thử (Q-B)
| | A (chọn) | B |
|---|---|---|
| Cách | 6 bảng `nd_*` vào `BACKUP_TABLES` có cờ `nd: true` (đếm ở `/info`, thoả D2c / E8); `export-all` BỎ QUA chúng trong vòng thường và ghi MỘT trang `Nội dung App (JSON)` = tệp của `GET /xuat` cắt bằng `chiaPhan` (dùng lại hàm của donThu.js, ≤ 30.000 ký tự / ô). `preview-restore` / `restore`: truyền `BACKUP_TABLES` ĐÃ LỌC bỏ `nd: true` vào `chanTrangTien` / `lapKeHoach` (khoá: trang nào trùng nhãn nd cũng KHÔNG thể DELETE + chèn thẳng vào nd_*) → trang nd thành `BANG_LA` bỏ qua như hôm nay. Khôi phục nội dung App: /admin › Nhập toàn bộ (tệp JSON của Xuất / bản sao qua khoá chỉ đọc). ~20 dòng | (B2) restore tự nhập nd khi kho nd trống: phải kiểm trọn JSON nd TRƯỚC `thucHien` (giữ "tất cả hoặc không" của SAOLUU-2), thêm ~30 dòng + ca; và `thu_SAOLUU2` F1 so hai lần xuất sẽ lệch vì `xuat_luc` — không chọn |
| `export/:table` cho bảng nd | 400 "nội dung App sao lưu trong bản toàn bộ" | — |
| donThu.js | thêm 6 tên bảng vào `BANG_KHONG_DON` (đăng ký "không bao giờ dọn"), sửa chú thích "Không bao giờ dọn: … nội dung App" — 2 dòng | — |

## Ngân sách so phiếu
Máy chủ ~640 (≤ 650) · giao diện ~115 (≤ 120) · thử ~420 (≈ 400). Không thư viện mới (bcryptjs, jsonwebtoken, cors, multer đã có).

## Bài thử `cong_cu/thu_NDAPI1.js` — ca ánh xạ 1-1 với Nghiệm thu
Hai phần: (1) **máy chủ THẬT** `server/index.js` chạy tiến trình con (khuôn `thu_KHNHANHPOS1.js`) cho CORS (H1, H2), đường lạ (C4), JSON hỏng,
thân quá lớn — chỉ gọi cửa CHỈ ĐỌC / cửa trả lỗi, không ghi kho; (2) khuôn thu_HUY1 (`database.js` thật + libsql kho TẠM) cho mọi ca ghi. Không
có ca CORS nào đo trên app tự dựng (K3: bài tự gắn đúng chỗ rồi đo).
- **A1** quét `server/nd/**`: tệp nào ngoài `cauNoi.js` có `pos_` → đỏ; ca đối chứng: bản sao có `pos_orders` trong duLieu.js → phép bắt.
- **A2** `server/index.js`: dòng gắn `/api/nd` trước `app.use(cors(`; diff index.js chỉ thêm dòng (so với `git show <mốc>:server/index.js`).
- **A3** 027: PRAGMA `foreign_key_list` của mọi bảng nd_* rỗng.
- **B1** đủ 6 bảng + cột; **B2** kho trống → `ban-dang-chay` = bản 0 rỗng; **B3** chèn tay bản thứ hai `dang_chay = 1` → kho từ chối (chỉ mục).
- **B4** sau 3 lần cập nhật + 1 quay lại: đủ 4 bản, đúng một `dang_chay = 1`, không bản nào mất.
- **C1** mỗi cửa trong bảng trả đúng dạng; **C2** `?co=` trùng → `{ khong_doi: true }`, lệch → đủ bản; **C3** `GET /anh/:ma` có
  `immutable` + đúng Content-Type; **C4** đường lạ `/api/nd/xyz` → 404 `KHONG_TIM_THAY` JSON (không rơi xuống SPA); **C5** mọi lỗi có `{ error, code }`.
- **D1** khoá: 80 ký tự qua, 81 → 400; `a b`, `ä`, rỗng → 400; **D2** giá trị null / undefined → 400, 5 kiểu hợp lệ qua;
  **D3** bản = đúng 1.048.576 byte qua, +1 byte → 413 (đo byte UTF-8: chuỗi tiếng Việt có dấu — ca chuỗi ASCII ngắn hơn không bắt lỗi đếm ký tự);
  **D4** ảnh 500 KB (512.000 byte — Q-G) qua, +1 → 413; **D5** ảnh tên `x.webp` loại `image/webp` mà byte là `<html>` → 400
  `ANH_KHONG_HOP_LE`; PNG / JPEG / WebP thật qua; **D6** gửi lại cùng ảnh → cùng `ma`, `moi: false`, bảng vẫn 1 dòng.
- **E1** `cap-nhat` `ban_goc` cũ → 409 `CO_BAN_MOI_HON`, chụp cả 6 bảng trước/sau: không đổi gì; **E2** đúng → bản mới = bản cũ + nháp, nháp
  rỗng, nhật ký `cap_nhat`; **E3** HAI người cập nhật cùng lúc (`Promise.all`, cùng `ban_goc`) → đúng một 200, một 409, đúng một bản mới;
  **E4** `quay-lai` `ban_goc` cũ → 409; đúng → bản mới `tu_ban` = số cũ, `gia_tri` giống bản cũ; **E5** hai người `quay-lai` cùng lúc → một thành.
- **F1** `GET /api/pos/permissions` có 4 quyền nhóm "App khách hàng — nội dung"; **F2** 027 gieo owner 1, manager 0, staff 0; chạy lại 027
  sau khi chủ quán bật manager → không đè; **F3** manager chưa có quyền → 403; bật `nd_sua` → PUT nhap qua; TẮT lại bằng
  `PUT /api/pos/permissions/manager` → **cùng vé** lần gọi kế tiếp 403 (thu là hết ngay); **F4** khoá tài khoản (`is_active = 0`) → cùng vé 401;
  **F5** mỗi cửa cần quyền: vé thiếu đúng quyền đó → 403 (bảng cửa × quyền, không lấy mẫu).
- **G1** đăng nhập đúng → vé + `quyen[]`; **G2** vé nd gọi `GET /api/pos/auth/me` → 401; vé POS gọi `GET /api/nd/nhap` → 401;
  **G3** tên không có / sai mật khẩu / tài khoản khoá → CÙNG `error` + `code` + status; **G4** ngưỡng Q-A: sai 4 lần → lần 5 vẫn 401, lần 6 → 429
  (ca ngay dưới + ngay trên); đếm theo tên (đổi IP vẫn 429) và theo IP (đổi tên vẫn 429); đúng mật khẩu khi đang khoá → vẫn 429;
  **G5** vé hết hạn → 401; vé `aud` khác → 401.
- **H1** Origin `https://tuquyduong.com` và `https://app-kh.pages.dev` → ACAO đúng origin đó; Origin lạ (`https://evil.example`,
  `https://tuquyduong.com.evil.example`) → không có ACAO nào (kể cả `*`), cả GET lẫn OPTIONS; **H2** `/api/kh/...` và `/api/pos/...` vẫn
  `Access-Control-Allow-Origin: *` (K5).
- **I1** xuất → nhập vào kho TRỐNG khác → so từng bản (`so_ban`, `gia_tri`, `tu_ban`, `dang_chay`…), từng ảnh (byte giống hệt), nháp, nhật ký;
  **I2** nhập vào kho có dữ liệu → 409, chụp bảng trước/sau giống hệt; **I3** tệp `dinh_dang` lạ / ảnh base64 mà byte không phải ảnh → 400, không ghi gì.
- **J1** tạo khoá (PIN đúng) → khoá chỉ có trong câu trả lời tạo; `GET` danh sách không có khoá; bảng chỉ có băm (≠ khoá);
  **J2** khoá gọi `GET /xuat` → 200; gọi `PUT /nhap`, `POST /cap-nhat`, `POST /nhap-toan-bo`, `GET /nhap` → từ chối (403);
  **J3** thu hồi → `GET /xuat` 401; **J4** không PIN / PIN sai → không tạo; manager → 403.
- **K1** `export-all` có trang `Nội dung App (JSON)`; ghép lại → `nhapToanBo` vào kho trống → nd giống hệt (so từng bản, từng ảnh); ô dài nhất
  ≤ 32.767; **K2** `preview-restore` + `restore` tệp đó: trang nd `skipped`, nd_* không đổi (chụp trước/sau), phần POS khôi phục như cũ; tệp có trang
  mang NHÃN của dòng nd trong BACKUP_TABLES → vẫn bỏ qua, không xoá nd (ca đỏ cho đường song song agent soát chỉ ra);
  **K3** dọn thử: `BANG_KHONG_DON` có đủ 6 bảng nd_* (ĐỎ trên gốc — hành vi xoá vốn đã không chạm nd_*, nên ca hành vi "nd_* còn nguyên sau dọn"
  chỉ là hồi quy, không đếm là bằng chứng đỏ); `thu_KHSDT1.js`, `thu_SAOLUU2.js` vẫn xanh trong bộ kiểm.
- **L1** `HOP_DONG_API_ND.md` có `PHIEN_BAN: 1`, khối máy đọc liệt kê ĐÚNG tập cửa của router (so bằng, hai chiều), mã lỗi, quyền, giới hạn
  khớp hằng trong `server/nd/tinh.js`; không trùng số phiên bản / tệp với `HOP_DONG_API_KH.md`.
- **M** bài nối vào `kiem_tra_truoc_khi_giao.js` (`chayBaiThat('cong_cu/thu_NDAPI1.js')`).
- **K5** (luồng hợp lệ phải KHÔNG bị chặn): đăng nhập POS thường vẫn 200; owner (không có dòng quyền nào) vẫn đủ quyền nd; người A lưu nháp
  khoá X, người B lưu khoá Y rồi cập nhật → qua (nháp người khác không chặn, gộp cả hai); App đọc `ban-dang-chay` không vé; ảnh WebP thật đúng 500 KB qua;
  Origin hợp lệ qua; `restore` tệp sao lưu CŨ (không có trang nd) → như trước.

## Đột biến dự kiến (`viec/ND-API-1/dot_bien.py`, chạy từng tên, có đối chứng)
VS-CORS-SAO (origin '*' trong nd) · VS-GAN-SAU-CORS (index.js gắn nd sau cors chung) · BV-BAN-GOC (bỏ so ban_goc) · VS-BAN-GOC-NGOAI-GD
(đọc bản đang chạy NGOÀI giao dịch) · BV-CHI-MUC-MOT (bỏ chỉ mục một bản đang chạy) · VS-QUYEN-VE (lấy quyền từ vé thay vì đọc lại) ·
BV-IS-ACTIVE · VS-KHOA-CHUNG (ký vé nd bằng JWT_SECRET trần) · BV-AUD · VS-ANH-THEO-TEN (nhận dạng theo mimetype) · VS-DEM-KY-TU (đo
`.length` thay byte) · VS-NGUONG-6 (ngưỡng sai 6) · BV-DEM-IP · BV-DEM-TEN · VS-LOI-RIENG-KHOA (tài khoản khoá trả câu riêng) ·
VS-KHOA-SAO-LUU-MOI-CUA (khoá sao lưu qua mọi cửa đọc) · BV-THU-HOI · VS-NHAP-DE (nhap-toan-bo không kiểm kho trống) · BV-ND-DON-THU (bắt bằng ca danh sách K3) ·
BV-LOC-ND-KHOI-PHUC (restore nhận BACKUP_TABLES chưa lọc) ·
VS-SAO-LUU-BO-ANH · VS-KHOA-81 (giới hạn khoá 81).

## Đường song song phải canh (K4)
- Ba đường ghi bản (`cap-nhat`, `quay-lai`, `nhap-toan-bo`) cùng giữ "một bản đang chạy" → cùng chỉ mục + cùng hàm đổi bản.
- Hai lối vào `/xuat` (vé nd + khoá sao lưu) và hai lối xuất (`GET /xuat`, `export-all`) → MỘT hàm `xuat()`; hai lối nhập
  (`nhap-toan-bo`, `restore`) → MỘT hàm `nhapToanBo()` (một vị từ "kho trống").
- Hai đường đọc người dùng (đăng nhập, mỗi lần gọi) → cùng `cauNoi`; ba câu sai đăng nhập → MỘT hằng lỗi.
- Giới hạn 1 MB kiểm ở cả `PUT nhap` (báo sớm) và `cap-nhat` / `quay-lai` / `nhap-toan-bo` (chốt) — cùng hàm `soByte`.
- CORS: mọi phản hồi của router nd, kể cả 404, lỗi JSON hỏng, 413 multer, 500 — gắn cors ĐẦU router, lỗi bắt trong router.

- Giờ: `luc`, `xuat_luc`, `khoa_den` qua `getNow()` / `strftime(…)` như pinChuQuan.js (thu_GIOVN1 M3 cấm `new Date().toISOString()` trong server/**);
  hạn vé để jsonwebtoken tính (`expiresIn`), `het_han` trả ra đổi sang giờ VN bằng hàm có sẵn.
- Nhật ký yêu cầu: router nd đứng trước bộ ghi log chung (index.js) → router nd tự ghi một dòng `giờ | phương thức | đường` (không thân, không vé).
- Hướng phụ thuộc: chỉ `backup.js` (POS) gọi `xuat()` của nd — khi bê nd sang máy khác thì xoá đúng chỗ gọi đó; nd không gọi gì của POS ngoài cauNoi.

## Không làm (ngoài Phạm vi / Cấm)
Không đổi auth POS (Q-A), không đổi khoiPhuc.js, không làm /admin của App, không đổi `/api/kh`.

## Cần chủ quán trả lời (mỗi câu đã có đề xuất của mình)
- **Q-A Đăng nhập sai:** đề xuất **5 lần sai / 15 phút**, đếm RIÊNG theo tên đăng nhập và theo IP (một trong hai chạm ngưỡng → 429), lưu ở
  bảng `nd_lan_sai` (máy chủ khởi động lại vẫn nhớ), giữ chỗ lượt TRƯỚC khi so mật khẩu (khuôn PIN chủ quán — gửi dồn cùng lúc cũng không lố).
  Đăng nhập POS: đề xuất **KHÔNG** làm trong phiếu này — `routes/auth.js` ngoài Phạm vi, và POS không nên dựa vào hàm nằm trong "nhà" nd (bê nd
  sang máy khác thì POS gãy). Mình ghi Phát hiện; chat soạn phiếu nhỏ riêng cho đăng nhập POS (kèm lỗ "tài khoản khoá trả câu riêng").
- **Q-B Sao lưu:** đề xuất Phần 3 · A — bản sao lưu Excel có MỘT trang "Nội dung App (JSON)" chứa trọn tệp Xuất (cắt nhỏ cho vừa ô Excel). Khôi
  phục Excel KHÔNG đụng nội dung App (trang đó được bỏ qua, có báo); muốn dựng lại nội dung App thì vào /admin › Nhập toàn bộ (kho trống). Đơn giản, không
  làm hỏng khôi phục hiện có. Nếu bạn muốn khôi phục Excel tự nhập luôn nội dung App: gõ "Q-B tự nhập" (+~30 dòng).
- **Q-C Dung lượng một dòng ở Turso:** SQLite cho một ô / một dòng tới 1 tỉ byte (sqlite.org/limits.html). Turso còn giới hạn **cỡ một câu trả lời**
  (lỗi `RESPONSE_TOO_LARGE` có người gặp) — máy KHÔNG tìm được con số chính thức và không có kho Turso để thử (**CHƯA KIỂM**). Đề xuất: giữ
  1 ảnh / 1 dòng, 1 bản / 1 dòng; mọi câu đọc nặng chỉ lấy MỘT dòng (xuất đọc từng bản, từng ảnh; danh sách phiên bản không kèm `gia_tri`) → mỗi câu
  trả lời ≤ ~1 MB. Không cắt bản thành nhiều dòng (thêm ~60 dòng, chưa cần). Sau khi lên Render: bạn thử tải một ảnh ~500 KB + Cập nhật một
  bản lớn ở /admin; lỗi thì báo, mình cắt dòng ở phiếu sau. Giới hạn với App giữ nguyên (1 MB / 500 KB).
- **Q-D Chỗ đặt khoá sao lưu:** đề xuất thẻ nhỏ riêng **"📱 App khách hàng"** trong Cài đặt (chỉ chủ quán thấy), mã ở `CaiDat/AppKhachHang.jsx`;
  Settings.jsx chỉ thêm ~6 dòng. Tạo / thu hồi khoá đều hỏi PIN chủ quán; khoá hiện đúng một lần kèm nút Chép.
- **Q-E (máy thêm) Khoá ký vé riêng:** đề xuất **dẫn xuất từ JWT_SECRET đang có** (HMAC với nhãn "nd-v1") — bạn không phải thêm biến môi trường nào
  trên Render. Phương án khác: biến mới `ND_JWT_SECRET` (bạn phải tự thêm trên Render; quên thêm thì /api/nd từ chối khởi động phần nd).
- **Q-F (máy thêm) Dạng gửi của App:** thư App 11.11 (a) **không có trong kho** — máy chưa đọc được bảng gốc. Mình giả định: `PUT /nhap` gửi MỘT khoá
  mỗi lần `{ khoa, gia_tri, ban_goc }`; `POST /anh` gửi multipart, trường tên `anh`; đăng nhập trả `ve` (vé), gửi lại bằng
  `Authorization: Bearer <ve>`; 4 quyền tên `nd_xem`, `nd_sua`, `nd_cap_nhat`, `nd_xuat_nhap`; xoá hẳn một khoá khỏi bản: chưa có ở v1. Bạn
  dán giúp mình bảng cửa trong thư App (hoặc nhờ chat App đối chiếu) — khác chỗ nào mình theo thư App, không tự đổi.
- **Q-H (máy thêm) PIN chủ quán qua cầu nối:** nghiệm thu A ghi cầu nối chỉ chạm `pos_users` + `pos_permissions`; thẻ khoá sao lưu lại cần PIN chủ quán
  (bảng `pos_pin_chu_quan`). Đề xuất: `cauNoi.js` GỌI hàm `kiemPinChuQuan` có sẵn của POS (không viết câu SQL nào vào bảng PIN) — vẫn một cửa duy nhất.
  Đồng ý thì gõ "đồng ý Q-H".
- **Q-G (máy thêm) Hai con số:** "500 KB" = **512.000 byte**; tệp Nhập toàn bộ tối đa **50 MB** (đủ ~70 ảnh 500 KB; Render miễn phí có 512 MB RAM — bản sao lưu Excel dựng cả tệp trong bộ nhớ, nên nội dung lớn sẽ làm sao lưu chậm / nặng: máy CHƯA đo, sẽ đo với ~20 ảnh khi làm).
  Đồng ý thì gõ "đồng ý Q-G", muốn số khác thì ghi số.

## Soát kế hoạch (agent phụ chỉ đọc, 13.11) — đã sửa vào kế hoạch
1. Ngoài Phạm vi: không. Chưa tính: `thu_SAOLUU2` F1 (hai lần xuất lệch nếu restore nhận trang nd) và `thu_GIOVN1` M3 (cấm `new Date().toISOString()`) → Q-B chọn bỏ qua trang nd; mục giờ thêm.
2. Ngắn hơn: restore không tự nhập nd → đã đổi Q-B (−15 dòng, bỏ hai rủi ro).
3. Ca thiếu / xanh oan: CORS đo trên `server/index.js` thật (khuôn thu_KHNHANHPOS1) thay app tự dựng; K3 hành vi vốn xanh trên gốc → ca đỏ là danh sách `BANG_KHONG_DON`; PIN chạm `pos_pin_chu_quan` → Q-H; thêm ca preview-restore.
4. Song song: lọc dòng `nd: true` khỏi BACKUP_TABLES trước `chanTrangTien` / `lapKeHoach` (ca K2 + đột biến BV-LOC-ND-KHOI-PHUC); router nd tự ghi log; hướng phụ thuộc backup.js → nd ghi rõ; bộ nhớ sao lưu ghi ở Q-G.
