# KHO-1 — kế hoạch (CHỜ DUYỆT)

Nền đã đọc trong lượt này (K1):
- `server/database.js:23-38` `initDatabase()` = kết nối → `createTables()` → `seedDefaultData()`; `beginTransaction()` (`:1528`) mở
  `db.transaction("write")` lười ở câu đầu; vai trò thật: `owner` · `manager` · `staff` (`:53`, seed quyền `:1043-1105`).
- `server/middleware/auth.js`: `authenticate`, `checkPermission(quyen)` (owner luôn qua), `checkRole(...vaiTro)` → 403 `ROLE_NOT_ALLOWED`.
- `server/routes/products.js:20-140`: menu quầy lấy từ SX; mất SX → `getFallbackProducts` trả MỌI dòng `pos_products` `is_active = 1`
  với `...p` (mọi cột). Dòng `pos_products` sinh ở: seed khi bảng rỗng (`database.js` khối "Tạo sản phẩm mẫu"), đặt giá (`products.js:149-184`,
  `:204-225`), `POST /products/sync-from-sx` (`:245`); khoá nối `(sx_product_type, sx_product_id)`.
- `server/routes/backup.js:41-100` `BACKUP_TABLES` (cha trước con); khôi phục = `DELETE` cả bảng rồi chèn lại (`:357-374`).
- `client/src/utils/api.js` có `api.get/post/put/delete/upload` (`upload(endpoint, formData)`); `Layout.jsx:66-77` mảng `navItems`.
- Thời gian: `getNow()` (`server/utils/helpers.js:128`) — giờ VN dạng `YYYY-MM-DDTHH:mm:ss`.

## A. Cấu trúc — theo đúng phiếu, không có phương án khác
`server/kho/{duong,tinh,duLieu,nhapSx}.js`, mount một dòng `app.use('/api/pos/kho', require('./kho/duong'))` ở `server/index.js`.
`client/src/pages/Kho/`. Hằng số riêng của quán (bảng gộp tay, giới hạn file) đặt ở ĐẦU `nhapSx.js`, có tên.

## B. Nâng cấp dữ liệu đánh số
| | A — bộ chạy + helper `themCot` (CHỌN) | B — mỗi bước tự khai `bangThemCot` |
|---|---|---|
| File | `server/nang_cap/chay.js` (~75 dòng) + `001_kho.js` | như A |
| Sao lưu | helper `themCot(tx, so, bang, cot)` TỰ chép `_sao_luu_NNN_<bang>` khi bảng có dòng, rồi `ALTER` — khoá bằng code | bước phải nhớ khai; quên là mất sao lưu (lời dặn) |
| Rủi ro | bước viết `ALTER` thẳng → lách helper: bài thử quét `server/nang_cap/*.js` (trừ `chay.js`) không có `ALTER TABLE` | cao hơn |

- `pos_nang_cap(so INTEGER PRIMARY KEY, ten TEXT NOT NULL, luc TEXT NOT NULL)` tạo trong bộ chạy (`CREATE TABLE IF NOT EXISTS`) — bảng của
  chính bộ chạy, không phải bước.
- `chayNangCap({ beginTransaction, query }, thuMuc = __dirname)`: đọc tên file khớp `^\d{3}_[a-z0-9_]+\.js$`, xếp theo số, bỏ số đã có
  trong `pos_nang_cap`; mỗi bước: `tx = await beginTransaction()` → `await buoc.chay(tx, { themCot })` → `INSERT pos_nang_cap` → `commit`. Lỗi →
  `rollback`, dừng, trả `{ hong: '<NNN_ten>: <lỗi>' }` (không đánh dấu, không chạy bước sau). Truyền hàm vào thay vì `require('../database')`
  → không vòng require, bài thử chạy được trên thư mục bước giả.
- Mọi câu của bước viết lặp lại được (`CREATE TABLE/INDEX IF NOT EXISTS`, `themCot` kiểm `PRAGMA table_info` trước) — khôi phục file sao
  lưu cũ đè `pos_nang_cap` thì chạy lại bước cũng không hỏng.
- `database.js`: thêm MỘT lời gọi sau `seedDefaultData()` (≈ 3 dòng: gọi + ghi kết quả vào biến module `nangCapHong` + log). Đề xuất
  (Câu hỏi 2): bước hỏng KHÔNG dừng máy chủ — quầy vẫn bán (kho chưa nằm trên đường bán tới KHO-3); `duong.js` gắn một middleware đầu
  router trả 503 `{ error: 'Nâng cấp dữ liệu <NNN_ten> hỏng — báo người làm kỹ thuật', code: 'NANG_CAP_HONG' }`. Chủ quán chọn "dừng"
  thì bỏ middleware, `throw` trong `initDatabase` (startServer có sẵn `process.exit(1)` + log) — ít dòng hơn.
- Code tạo bảng cũ trong `createTables()` để nguyên.

## C + D. Bảng kho (`001_kho.js`, ~110 dòng) — tồn suy ra, sản phẩm khoá theo `pos_products`

**D — một món một dòng:**
| | A — thêm cột vào `pos_products` (`kieu_kho`, `nhom_kho_id`) | B — bảng `kho_san_pham` khoá 1-1 theo `pos_products.id` (CHỌN) |
|---|---|---|
| Đụng bảng tiền | `ALTER pos_products` + sao lưu bảng | không đụng `pos_products` |
| K5 | `getFallbackProducts` trả `...p` → hai cột mới LỘ ra menu quầy và `/api/kh/menu` (đổi hình dữ liệu menu) | menu không đổi một byte |
| Khôi phục Excel | trang `Sản phẩm` cũ thiếu cột → vẫn chèn được | như cũ |
| Dòng | ~ bằng nhau | ~ bằng nhau |
Chọn B: `kho_san_pham` KHÔNG có tên / giá / mã — chỉ thuộc tính kho của đúng một dòng `pos_products`, nên vẫn "một món một dòng".
Không có dòng `kho_san_pham` = kiểu `chua_dinh_luong` (mặc định là hành vi — có ca thử không truyền).

Bảng (mọi bảng `id INTEGER PRIMARY KEY AUTOINCREMENT` trừ khi ghi khác; giờ là `TEXT` từ `getNow`; tiền là số nguyên đồng):
- `kho_nhom_nguyen_lieu(id, ten TEXT UNIQUE NOT NULL, thu_tu INTEGER DEFAULT 0)`
- `kho_nha_cung_cap(id, ten TEXT UNIQUE NOT NULL, sdt, ghi_chu, dang_dung INTEGER DEFAULT 1)`
- `kho_nguyen_lieu(id, ten TEXT NOT NULL, ten_chuan TEXT UNIQUE NOT NULL, nhom_id → kho_nhom_nguyen_lieu, nha_cung_cap_id → kho_nha_cung_cap,
  don_vi_luu TEXT NOT NULL, don_vi_hien TEXT, he_so_doi REAL NOT NULL DEFAULT 1 /* 1 đơn vị hiện = he_so_doi đơn vị lưu */,
  gia_nhap INTEGER /* đồng / 1 đơn vị lưu; NULL = chưa có */, ton_toi_thieu REAL, han_ngay INTEGER, ghi_chu,
  dang_dung INTEGER NOT NULL DEFAULT 1, sx_id INTEGER UNIQUE, tao_luc TEXT NOT NULL, sua_luc TEXT)`
  — giá 0 / ô trống từ SX lưu NULL (để "Thiếu thông tin" đếm đúng); `ten_chuan` từ `tinh.chuanHoaTen` (khoá chống nhân đôi khi nhập).
- `kho_nhom_cong_thuc(id, ten TEXT UNIQUE NOT NULL, thu_tu INTEGER DEFAULT 0)` — nhóm giữ nguyên tên SX.
- `kho_san_pham(pos_product_id INTEGER PRIMARY KEY → pos_products(id), kieu TEXT NOT NULL CHECK (kieu IN ('pha_tai_cho','lam_san','chua_dinh_luong')),
  nhom_id → kho_nhom_cong_thuc, sua_luc TEXT)`
- `kho_cong_thuc(id, san_pham_id → pos_products(id) NOT NULL, nguyen_lieu_id → kho_nguyen_lieu, thanh_phan_id → pos_products(id), luong REAL NOT NULL CHECK (luong > 0),
  CHECK ((nguyen_lieu_id IS NULL) <> (thanh_phan_id IS NULL)))` + chỉ mục `(san_pham_id)` — lượng cho 1 đơn vị, theo đơn vị LƯU của nguyên liệu
  / theo 1 phần của sản phẩm con. Lưu số thật, không làm tròn.
- `kho_dinh_muc(id, san_pham_id → pos_products(id), thu INTEGER /* 0–6, NULL = mọi ngày */, so_luong REAL NOT NULL, UNIQUE(san_pham_id, thu))`
- `kho_phieu(id, loai TEXT NOT NULL CHECK (loai IN ('DH','PX','PN','PS','KK')), so_phieu TEXT UNIQUE NOT NULL, trang_thai TEXT NOT NULL DEFAULT 'nhap'
  CHECK (trang_thai IN ('nhap','cho_duyet','da_duyet','huy')), nha_cung_cap_id, nguoi_tao TEXT NOT NULL, tao_luc TEXT NOT NULL, nguoi_duyet, duyet_luc,
  thay_cho_id → kho_phieu(id) /* sửa = phiếu mới trỏ phiếu cũ, phiếu cũ giữ, chuyển 'huy' */, ly_do TEXT, ghi_chu)`
- `kho_lo(id, nguyen_lieu_id, san_pham_id, CHECK một trong hai, so_luong REAL NOT NULL /* lượng lúc nhập lô */, han_dung TEXT, gia_von INTEGER /* đồng / 1 đơn vị */,
  phieu_id → kho_phieu(id) NOT NULL, tao_luc TEXT NOT NULL)`
- `kho_phieu_dong(id, phieu_id → kho_phieu(id) NOT NULL, nguyen_lieu_id, san_pham_id, lo_id → kho_lo(id), so_luong REAL NOT NULL /* có dấu: + vào kho, − ra kho */,
  don_gia INTEGER, ghi_chu)`
- **Tồn KHÔNG có ô** — tồn = Σ `kho_phieu_dong.so_luong` của phiếu `da_duyet` (theo nguyên liệu / sản phẩm / lô). Lý do: sổ chỉ thêm
  (CLAUDE.md §5.4), không có số nào để lệch với sổ; lô FEFO = còn lại theo `lo_id`. KHO-1 chỉ tạo bảng, chưa có hàm / màn (KHO-2).
Phương án A' "cột `ton` trên nguyên liệu + cập nhật mỗi phiếu": ít câu đọc hơn nhưng hai nguồn sự thật (số ô và sổ) — loại.

## E. Công thức — `server/kho/tinh.js` (~110 dòng, THUẦN: không DB, không giờ)
- `chuanHoaTen(ten)`: NFC, cắt đầu/cuối, gộp khoảng trắng, `toLowerCase('vi')`; GIỮ dấu.
- `boDau(chuoi)` (cho tìm không dấu — dùng ở máy chủ khi lọc `?tim=`; giao diện chép HÀNH VI 3 dòng, xem H).
- `trienKhai(congThuc, soPhan)`: `congThuc = { goc: <pos_product_id>, bang: { [spId]: [{ nguyen_lieu_id | thanh_phan_id, luong }] } }` →
  `[{ nguyen_lieu_id, luong }]` cộng dồn theo nguyên liệu gốc, lồng nhiều tầng; gặp vòng → ném lỗi có `chuoi` (phòng thủ, đường lưu đã chặn).
- `timVong(bang, spId, dongMoi)`: thay dòng của `spId` bằng `dongMoi` trong bản sao `bang`, DFS từ `spId` → trả mảng id chuỗi vòng
  (`[A, B, A]`, kể cả `[A, A]`) hoặc `null`. Đường lưu đổi id thành tên → 400 `{ error: 'Công thức vòng lặp: Hồng Tân Sinh → Cốt gừng → Hồng Tân Sinh', code: 'CONG_THUC_VONG_LAP' }`.
- `doiDonVi(soLuu, heSo)` / `veDonViLuu(soHien, heSo)` — đổi đơn vị lưu ↔ hiện. Làm tròn CHỈ ở giao diện.
- `gopTen(ten, bangGop)` → tên giữ: tra `chuanHoaTen(ten)` trong bảng gộp tay (khoá đã chuẩn hoá) → tên giữ; không có thì chính tên đã
  chuẩn hoá khoảng trắng (khoá trùng tên khác hoa/thường tự gộp qua `ten_chuan`).
Phương án B "đệ quy SQL (`WITH RECURSIVE`)": ít dòng JS hơn nhưng không thuần, khó thử, Turso/SQLite báo vòng khó đọc — loại.

## F + G. Nhập SX — `server/kho/nhapSx.js` (~160 dòng)
- Hằng số đầu file: `BANG_GOP_TAY` = { 'gừng tươi': 'Gừng', 'kỳ tử': 'Kỷ tử', 'táo đỏ': 'Táo đỏ', 'táo đỏ khô': 'Táo đỏ', 'trần bì': 'Trần bì khô' }
  (khoá đã chuẩn hoá; "Táo Đỏ" chuẩn hoá về 'táo đỏ'; "Cẩu tích", "Mẹ thuốc" trùng tên → tự gộp qua `ten_chuan`; "Táo tươi" KHÔNG có trong
  bảng). "Trần bì (mọi biến thể)": khi có file thật thì liệt kê đủ biến thể vào bảng (Câu hỏi 1); `GIOI_HAN_FILE_SX = 20 MB`.
- `docFileSx(duong)`: `createClient({ url: 'file:' + duong })`, CHỈ câu `SELECT` / `PRAGMA`; đọc `ingredients`, `product_types`, `sx_products`,
  bảng công thức đang dùng thật (Câu hỏi 1 — chưa đọc được SX: nếu `sx_product_ingredients` có dòng thì dùng nó, không thì đi `legacy_table`
  /`legacy_id` sang `recipe_ingredients` / `tea_ingredients`). Cột đọc qua MỘT bảng ánh xạ `COT_SX` ở đầu file. Không đọc bảng tồn, lô,
  khách, gói, giao định kỳ, việc.
- `lapKeHoach(sx, hienCo)` THUẦN → `{ themNhom, themNguyenLieu, gop: [{ cu, giu }], sanPham, congThuc, canhBao: [...] }`; cảnh báo: giá 0 /
  trống, thiếu đơn vị, công thức trỏ nguyên liệu không có, một công thức có cả hai tên bị gộp (đã cộng lượng), món SX chưa có dòng
  `pos_products` (bỏ qua — Câu hỏi 3).
- Không ghi đè: nguyên liệu `INSERT OR IGNORE` theo `ten_chuan` (và `sx_id`); nhóm theo `ten`; công thức chỉ ghi cho món CHƯA có dòng
  `kho_cong_thuc` nào; `kho_san_pham` chỉ chèn khi chưa có (kiểu mặc định `lam_san` cho món có công thức SX — các món SX đều làm sẵn theo lô).
  Tất cả trong MỘT `beginTransaction()`.
- Đường: `POST /nhap-sx/xem` và `POST /nhap-sx` (owner) nhận cùng file (`multer` ghi đĩa tạm `os.tmpdir()`, `limits.fileSize`), cùng
  `lapKeHoach` (MỘT vị từ cho xem và ghi — K4); `finally` xoá file tạm. Không giữ trạng thái giữa hai lần bấm.
Phương án B "xem trước lưu phiên trên máy chủ, Nhập chỉ gửi mã phiên": đỡ tải file 2 lần nhưng thêm trạng thái + hết hạn — loại (file ~MB).

## H. Giao diện — `client/src/pages/Kho/` (~680 dòng) + `App.jsx` (2 dòng) + `Layout.jsx` (1 mục "Quản lý kho", `/kho`, mọi vai trò)
- `index.jsx` (~110): tab Nguyên liệu · Sản phẩm & công thức (owner/manager) · Nhập từ SX (owner); ô "Thiếu thông tin" (giá / hạn / tối
  thiểu — đếm từ danh sách đã tải, bấm → lọc đúng danh sách).
- `NguyenLieu.jsx` (~280): ô tìm (lọc phía máy, bỏ dấu + `đ→d`), sắp xếp (tên · nhóm · giá · mới thêm), tab Tất cả + từng nhóm, dạng
  thẻ; thêm / sửa (biểu mẫu một khung), ngừng dùng / dùng lại; quản lý nhóm + nhà cung cấp (khung nhỏ). Nút sửa ẩn với staff (máy chủ vẫn chặn).
- `SanPham.jsx` (~190): danh sách theo nhóm; bấm món → công thức 1 đơn vị (g / ml hiển thị làm tròn) + ô "Tính cho N phần" (gọi
  `GET /san-pham/:id/trien-khai?so_phan=N` — dùng ĐÚNG `tinh.trienKhai`, không chép phép nhân lên giao diện); owner sửa kiểu + dòng công thức.
- `NhapSx.jsx` (~100): chọn file → Xem trước → Nhập.
- Gọi máy chủ qua `api` của `utils/api.js` (không thêm `fetch`; `api.js` ngoài Phạm vi nên KHÔNG thêm `khoApi` vào đó).
- Sau sửa: `(cd client && npm run build)`, commit `client/dist/`.

## I. Quyền — `checkRole` có sẵn, kiểm ở máy chủ
| Đường | owner | manager | staff |
|---|---|---|---|
| `GET /nguyen-lieu`, `/nhom`, `/nha-cung-cap` | ✓ | ✓ | ✓ |
| `POST/PUT/DELETE` nguyên liệu, nhóm, nhà cung cấp | ✓ | ✓ | 403 |
| `GET /san-pham`, `/san-pham/:id`, `/trien-khai` | ✓ | ✓ | 403 |
| `PUT /san-pham/:id` (kiểu, nhóm, công thức) | ✓ | 403 | 403 |
| `POST /nhap-sx/xem`, `/nhap-sx` | ✓ | 403 | 403 |
`DELETE /nguyen-lieu/:id`: một câu `DELETE … WHERE id = ? AND NOT EXISTS (kho_cong_thuc …) AND NOT EXISTS (kho_phieu_dong …) AND NOT EXISTS (kho_lo …)`,
`changes = 0` → 409 `NGUYEN_LIEU_DANG_DUNG` (gợi ý "Ngừng dùng"). Phương án B "thêm quyền mới vào `pos_permissions`": chỉnh được theo vai trò
nhưng thêm seed + phiếu nói bảng phân quyền chi tiết làm sau khai trương — loại.
Lưu công thức: `PUT /san-pham/:id` trong MỘT `beginTransaction()` (BEGIN IMMEDIATE): đọc toàn bộ `kho_cong_thuc` → `timVong` → xoá dòng cũ
của món → chèn dòng mới. Hai người lưu chéo A→B và B→A cùng lúc: giao dịch ghi xếp hàng, người sau đọc thấy dòng của người trước → 400.

## J. Sao lưu — `backup.js`: thêm vào CUỐI `BACKUP_TABLES` (cha trước con)
`pos_nang_cap`, `kho_nhom_nguyen_lieu`, `kho_nha_cung_cap`, `kho_nguyen_lieu`, `kho_nhom_cong_thuc`, `kho_san_pham`, `kho_cong_thuc`, `kho_dinh_muc`,
`kho_phieu`, `kho_lo`, `kho_phieu_dong` (key `id`; `kho_san_pham` key `pos_product_id`; `pos_nang_cap` key `so`).
Phát hiện cho KHO-2: phiếu / lô / dòng phiếu là sổ chỉ thêm — có nên vào `BANG_KHONG_KHOI_PHUC` không (KHO-1 bảng còn rỗng, không đổi).

## Ngân sách
| Phần | Ước | Phiếu |
|---|---|---|
| máy chủ (`nang_cap/` ~185, `kho/` tinh 110 · duLieu 140 · duong 120 · nhapSx 160, index 1, database 3, backup 11) | ~730 | ~600 |
| giao diện | ~680 + 3 | ~700 |
| bài thử `cong_cu/thu_KHO1.js` | ~450 | ~450 |
Máy chủ có thể vượt ~20 % vì `001_kho.js` (11 bảng, mỗi bảng 6–12 dòng SQL). Không cắt bảng — phiếu C đòi đủ. Sẽ gọn `duLieu.js` trước.

## Bài thử `cong_cu/thu_KHO1.js` — ánh xạ 1-1 với Nghiệm thu (khuôn `thu_DOISOAT1.js`: database.js thật + libsql trên kho TẠM, route thật)
| Nghiệm thu | Ca |
|---|---|
| A | 4 file `server/kho/*.js` có; `index.js` mount `/api/pos/kho` đúng MỘT lần; `tinh.js` không `require` database / không `Date`/`getNow`; `nhapSx.js` có `BANG_GOP_TAY` |
| B | chạy `initDatabase` 2 lần → `pos_nang_cap` đúng 1 dòng/bước, schema băm như nhau; thư mục bước giả: bước 002 ném → không có dòng 002, bước 003 không chạy, bảng 002 tạo dở bị rollback, kết quả nêu "002_"; bước giả `themCot` vào bảng có dòng → có `_sao_luu_NNN_<bang>` đủ dòng; bảng rỗng → không sao lưu; quét `server/nang_cap/*.js` (trừ `chay.js`) không có `ALTER TABLE` |
| C | đủ 11 bảng + `CHECK` (kieu sai, loại phiếu sai, công thức có cả hai cột → lỗi); không có cột `ton` nào trong bảng `kho_*` |
| D | `GET /products` (SX tắt) trước / sau nâng cấp — JSON y hệt; `pos_products` không thêm cột; món không có `kho_san_pham` → kiểu `chua_dinh_luong` |
| E | `trienKhai`: nhân N phần, lồng 2 tầng, cộng dồn nguyên liệu trùng; `doiDonVi` 2 chiều; `timVong` A→A, A→B→A, A→B (không vòng → null); `PUT` vòng → 400 `CONG_THUC_VONG_LAP` + `error` chứa đủ tên chuỗi; số lưu không bị làm tròn (0.0125 giữ nguyên) |
| F | `.db` mẫu bài tự dựng (tên trùng, giá 0, thiếu đơn vị, công thức trỏ tên gộp + trỏ nguyên liệu không có, món chưa có `pos_products`): xem trước đúng từng con số + đủ 5 loại cảnh báo, KHÔNG ghi gì; nhập → đúng số dòng; nhập lần 2 → 0 dòng mới; sửa giá nguyên liệu trong POS rồi nhập bản mới hơn (thêm 1 nguyên liệu) → chỉ +1, giá đã sửa giữ; file tạm bị xoá; file quá giới hạn → 413/400; bảng tồn / khách trong file mẫu không sang POS; staff/manager gọi nhập → 403 |
| G | gộp theo bảng tay (Gừng tươi → Gừng, Kỳ Tử → Kỷ tử, Táo Đỏ / Táo đỏ khô → Táo đỏ, Trần bì → Trần bì khô), "Táo tươi" giữ riêng; công thức có cả "Táo đỏ" và "Táo đỏ khô" → một dòng lượng cộng + cảnh báo; bản 09.10 ra 33 → CHƯA KIỂM nếu không có file (Câu hỏi 1) |
| H | (giao diện — máy chỉ kiểm build + route có trong `App.jsx` + một mục `/kho` trong `Layout.jsx`; thao tác tay ghi ở báo cáo) |
| I | staff `PUT /san-pham` → 403; manager `PUT /san-pham` → 403; manager `POST /nguyen-lieu` → 200; staff `POST /nguyen-lieu` → 403; staff `GET /nguyen-lieu` → 200 (K5); staff `GET /san-pham` → 403; xoá nguyên liệu nằm trong công thức → 409, nguyên liệu không ai dùng → 200 |
| J | `BACKUP_TABLES` chứa đủ 11 tên, `kho_cong_thuc` sau `kho_nguyen_lieu`, `kho_phieu_dong` sau `kho_phieu` và `kho_lo` |
| K | khởi động trên kho trống; khởi động trên kho đã có dữ liệu cũ (seed + đơn mẫu) → các bảng cũ đếm dòng y như trước; `POST /orders` một đơn mẫu (SX giả) vẫn 200 |
| Hai người | hai `PUT /san-pham` chéo (A dùng B, B dùng A) chạy `Promise.all` → đúng một 200, một 400 `CONG_THUC_VONG_LAP`; hai `POST /nhap-sx` cùng lúc → không nhân đôi |

**Luồng hợp lệ phải KHÔNG bị chặn (K5):** staff xem nguyên liệu; manager thêm / sửa nguyên liệu, nhóm, nhà cung cấp; owner sửa công thức
không vòng (kể cả dùng sản phẩm con); món dùng CÙNG sản phẩm con hai lần qua hai nhánh (A→B, A→C→B — kim cương, không phải vòng); nhập
lại cùng file; menu, giá, tạo đơn, trừ kho qua SX (ca K).

**Đường song song cần canh (K4):** xem trước ↔ nhập (cùng `lapKeHoach`); thêm ↔ sửa nguyên liệu (cùng `chuanHoaTen` → 409 `TEN_TRUNG`
khi đụng `ten_chuan` của nguyên liệu khác); `PUT` công thức ↔ nhập SX ghi công thức (nhập không chạy `timVong` vì SX không lồng — nhưng
nhập chỉ ghi món CHƯA có công thức nên không tạo vòng với dòng POS; ca F kiểm); xoá nguyên liệu ↔ ba bảng tham chiếu (công thức, lô, dòng phiếu).

**Đột biến dự kiến (`viec/KHO-1/dot_bien.py`):** `VS-vong-chi-tu-than` (timVong chỉ bắt A→A), `BV-vong` (bỏ timVong ở PUT),
`VS-gop-bo-dau` (chuanHoaTen bỏ dấu → Táo tươi/Táo đỏ…), `BV-danh-dau-truoc` (INSERT pos_nang_cap trước khi chạy bước),
`BV-sao-luu` (themCot bỏ chép), `VS-nhap-ghi-de` (INSERT OR REPLACE), `BV-quyen-cong-thuc` (PUT san-pham cho manager),
`VS-trien-khai-mot-tang` (không đệ quy), `BV-xoa-file-tam`.

## Ngoài phạm vi (không làm)
Hàm tồn, FEFO, phiếu, pha chế, đổi nguồn menu, trừ kho POS (KHO-2/3). `api.js` không thêm `khoApi`. Không chạm file trong mục Cấm.

## Vòng soát 1 (agent phụ chỉ đọc) — đã sửa vào kế hoạch, các mục dưới THẮNG mục cũ phía trên nếu khác
1. **Gộp `timVong` vào `trienKhai`** (một lượt duyệt): `trienKhai` ném `{ code: 'CONG_THUC_VONG_LAP', chuoi: [id…] }` khi gặp vòng. Lưu công
   thức = chạy `trienKhai` trên bảng đã thay dòng của món → vòng mới bắt buộc đi qua món đang sửa nên luôn tới được từ gốc. Đột biến
   `VS-vong-chi-tu-than` / `BV-vong` giữ nguyên tên, neo vào `trienKhai` / chỗ gọi ở `PUT`.
2. **Bỏ `?tim=` máy chủ** và `boDau` ở `tinh.js` — tìm không dấu chỉ ở giao diện (lọc danh sách đã tải).
3. **Một hàm `doiDonVi(so, heSo)`** (lưu → hiện); chiều ngược là phép nhân ở cùng hàm qua đối số — không hai hàm.
4. **Giao dịch + lỗi kho bận dùng cái đang có:** `trongGiaoDich` + `loiGhi` (`server/routes/wallets.js:127`, `:118`, xuất ở `:354-355`) cho
   mọi đường ghi của `duong.js` → kho bận trả 409 `KHO_BAN` như mọi route khác. Bộ chạy nâng cấp vẫn nhận `beginTransaction` (chạy trước khi
   route nạp, không cần `loiGhi`).
5. **Một đường nhập:** `POST /nhap-sx` có trường `ghi` (`0` = xem trước, `1` = ghi) — cùng `lapKeHoach`, cùng file tạm, cùng `finally` xoá.
6. **Nhóm nhập lại sau khi chủ quán đổi tên:** `kho_nhom_nguyen_lieu` và `kho_nhom_cong_thuc` thêm cột `ten_sx TEXT UNIQUE` (tên gốc SX); nhập
   khớp theo `ten_sx`, không theo `ten` → đổi tên trong POS rồi nhập lại không sinh nhóm cũ.
7. **`kiem_tra_truoc_khi_giao.js`:** thêm `'cong_cu/thu_KHO1.js'` vào CUỐI mảng `chayBaiThat` (dòng ~495) — chỉ thế.
8. **Ca thử thêm:** B — quét `server/nang_cap/*.js` (trừ `chay.js`) không có `ALTER TABLE`, `DROP`, `DELETE FROM`, `RENAME`; bước hỏng →
   `GET /api/pos/kho/nguyen-lieu` 503 `NANG_CAP_HONG` (nếu chủ quán chọn "không dừng") hoặc `initDatabase` ném nêu tên bước (nếu "dừng").
   F — băm file `.db` mẫu trước / sau xem trước + nhập: không đổi; nhóm giữ đúng tên SX ("Nước ép", "Trà"); giá 0 / ô trống → `NULL`.
   G — "Cẩu tích" / "cẩu  tích" và "Mẹ thuốc" / "Mẹ Thuốc" gộp; "Trần Bì", "trần bì" → "Trần bì khô". I — staff `POST` nhóm, nhà cung cấp →
   403; manager `GET /san-pham` → 200. D/K — `GET /api/kh/menu` (KH-API) và bản xuất sao lưu trang `Sản phẩm` không đổi trước / sau nâng
   cấp; `POST /orders` (SX giả) vẫn gửi lệnh trừ kho sang SX (đếm lời gọi SX giả). H — "Thiếu thông tin" đếm đúng: kiểm qua dữ liệu
   `GET /nguyen-lieu` (trường NULL) — phần bấm / lọc trên giao diện là thao tác tay.
   Mọi ca chạy trên code gốc trước (bước 4) → ĐỎ, ghi `bang_chung_do.txt`.
9. **Khôi phục Excel** (`backup.js:317-374`) xoá + chèn lại cả bảng `kho_*`: đi vòng `trienKhai` / `ten_chuan` / quyền (khôi phục chỉ owner).
   KHO-1 không chặn (phiếu J chỉ đòi sao lưu) — ghi **Phát hiện** cho chat soát: có đưa `kho_cong_thuc`, `kho_phieu*`, `kho_lo` vào
   `BANG_KHONG_KHOI_PHUC` không. `pos_nang_cap` khôi phục được vì mọi bước viết lặp lại được (mục B).
10. **Câu hỏi 3 sửa lại:** dòng `pos_products` còn sinh từ seed và `sync-from-sx` — đề xuất không đổi (nhập SX không tự tạo dòng `pos_products`).
11. **Ngân sách `database.js`:** "một lời gọi" thành ~3 dòng (gọi + giữ kết quả + xuất `nangCapHong` trong `module.exports`) nếu chọn
    "không dừng"; chọn "dừng" thì đúng 1–2 dòng.
