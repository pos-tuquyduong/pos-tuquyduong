# KHO-2a — kế hoạch (CHỜ DUYỆT)

Nền đã đọc trong lượt này (K1):
- Bảng kho (`server/nang_cap/001_kho.js`): `kho_phieu` CHECK trạng thái `nhap/cho_duyet/da_duyet/huy` (không thêm được trạng thái — SQLite
  không đổi CHECK); `kho_phieu_dong` CHECK đúng một trong `nguyen_lieu_id` / `san_pham_id`, `so_luong` có dấu; `kho_lo.so_luong` = lượng lúc
  vào lô, còn lại = Σ dòng theo `lo_id`; `kho_dinh_muc(san_pham_id, thu 0–6 | NULL, so_luong)` UNIQUE; KHÔNG khoá ngoại (khôi phục Excel).
- Bộ chạy `server/nang_cap/chay.js`: mỗi bước một giao dịch, `themCot(bang, dinhNghia)` tự sao lưu bảng có dòng; `thu_KHO1.js` B7 cấm
  `ALTER TABLE` viết thẳng trong bước.
- `server/kho/tinh.js` `trienKhai(congThuc, soPhan)` (lồng nhiều tầng, cộng dồn theo nguyên liệu gốc); `duLieu.docBangCongThuc`.
- `server/kho/duong.js`: `router.use(authenticate, chặn 503 NANG_CAP_HONG)`, `QUAN_LY = checkRole('owner','manager')`, ghi qua
  `trongGiaoDich` + `loiGhi` (`server/routes/wallets.js:118-137`; `beginTransaction` = `db.transaction("write")` — giao dịch ghi xếp hàng).
- `checkRole` (`server/middleware/auth.js:119`) — vai trò ngoài danh sách (kể cả `service` của web-sync, `:161`) → 403 `ROLE_NOT_ALLOWED`.
- `server/routes/settings.js:88` PUT `/` ghi mọi khoá (cần `manage_settings`, owner/manager), đã có khuôn kiểm khoá `uudai_chung_hang_*`.
- `server/kho/nhapSx.js` đọc `v_recipes` / `sx_products` bằng `SELECT *` → có sẵn `days_use` (juice, nhóm khác); trà gói không có cột này.
- `server/routes/backup.js` (NGOÀI Phạm vi) sao lưu bằng `SELECT *` theo danh sách bảng có sẵn → **không thêm bảng mới** (bảng mới sẽ không được
  sao lưu); chỉ THÊM CỘT vào bảng kho đã có.
- `cong_cu/thu_KHO1.js:246-248` B1/B2 đếm cứng `pos_nang_cap` = 1 dòng `001_kho` → bước 002 làm đỏ — sửa theo `## Bài thử cũ sửa` của phiếu.
- `Layout.jsx:44-48` đã có vòng hỏi 60 s (`soNoApi`); `client/src/utils/api.js:242` xuất `api` (get/post/put/delete) — NGOÀI Phạm vi, gọi thẳng `api`.

## 1. Dữ liệu — bước `server/nang_cap/002_kho_pha_che.js` (~30 dòng)
| | A — thêm CỘT vào bảng kho có sẵn (CHỌN) | B — bảng mới `kho_ket_qua`, `kho_cai_dat_nhom` |
|---|---|---|
| Sao lưu Excel | cột mới tự đi theo `SELECT *` | bảng mới KHÔNG vào `BACKUP_TABLES` (backup.js ngoài Phạm vi) → mất khi khôi phục |
| Dòng | ~30 | ~45 |
Chọn A. Mọi cột qua `themCot` (tự sao lưu bảng có dòng):
- `kho_san_pham.han_ngay INTEGER` — hạn dùng thành phẩm (ngày). NULL = chưa đặt → lô không có hạn, màn Tồn ghi "chưa có hạn".
- `kho_nhom_cong_thuc.lech_cho_phep REAL` (%), `kho_nhom_cong_thuc.ty_le_chuan REAL` (%) — xem Q1. NULL = không cảnh báo.
- `kho_phieu.so_lan_in INTEGER NOT NULL DEFAULT 0` — đếm lần in để in dòng "IN LẠI · LẦN n".
- `kho_phieu_dong.loai TEXT CHECK (loai IN ('xuat','thanh_pham','ket_qua'))` · `kho_phieu_dong.cho_mon_id INTEGER` (dòng nguyên liệu này xuất
  cho món nào — để in "bảng theo công thức" từ chính sổ, không tính lại theo công thức đã đổi) · `kho_phieu_dong.nguoi TEXT` · `kho_phieu_dong.luc TEXT`.
- `CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_ket_qua_lo ON kho_phieu_dong(lo_id) WHERE loai = 'ket_qua'` — **KHOÁ** một kết quả mỗi lô
  (hai người cùng bấm → câu thứ hai đụng khoá → 409). `CREATE INDEX IF NOT EXISTS idx_kho_phieu_dong_lo ON kho_phieu_dong(lo_id)`.
- Cài đặt duyệt: khoá `pos_settings.kho_px_nv_can_duyet` ('1' / '0'). Không có dòng = BẬT (mặc định là hành vi, có ca không seed).

Phương án đã loại cho "bảng theo công thức": (B) lưu bản chụp JSON trong `kho_phieu` — hai nguồn sự thật với dòng phiếu; (C) tính lại theo
công thức hiện tại khi in — in lại sau khi sửa công thức sẽ SAI số.

## 2. Phép tính thuần — `server/kho/tinh.js` (+~90 dòng, không CSDL, không giờ máy)
- `chonDinhMuc(dongDm, thu)` → số của dòng `thu` đó, không có thì dòng `thu = NULL`, không có nữa → 0.
- `canLam(dinhMuc, dangCo)` = `max(0, dinhMuc − dangCo)`.
- `lapPhieuXuat(mon, bangCongThuc)` — `mon = [{ san_pham_id, so_phan }]` → `{ theo_mon: [{ san_pham_id, so_phan, nguyen_lieu: trienKhai(…, so_phan) }],
  tong: Σ theo nguyên liệu }`; món không có dòng công thức → nằm trong `thieu_cong_thuc`. MỘT hàm dùng cho tạo phiếu, sửa phiếu và xem trước.
- `chiaTheoLo(can, lo)` — `can = [{ cho_mon_id, luong }]` của MỘT nguyên liệu, `lo = [{ id, con }]` đã xếp hạn gần nhất trước → các mảnh
  `{ cho_mon_id, lo_id | null, luong }`; hết lô thì phần thiếu `lo_id = null` (tồn âm, không chặn).
- `congNgay(gio, n)` — chuỗi `YYYY-MM-DDTHH:mm:ss` + n ngày, tính trên thành phần chuỗi (không qua múi giờ máy → đúng với `TZ=UTC`).
- `soPhieuKe(loai, ngay, soCuoi)` → `PX-YYMMDD-NNN`.
- `bangPhieu(dong)` — dòng phiếu đã đọc → `{ tong, theo_mon: [{ mon, so_phan, nguyen_lieu, mot_phan }] }` (mot_phan = mẻ / số phần) cho màn xem + in.
- `lechQuaNguong(chuan, thuc, lechChoPhep)` → true khi `|thuc − chuan| / chuan × 100 > lechChoPhep` (NULL → false).
- `trangThaiKetQua(ngayDuyet, homNay, coKetQua)` → `'da_dien' | 'cho_dien' | 'tu_chot'` (tự chốt = chưa điền và ngày duyệt (giờ VN) < hôm nay).

## 3. Đọc / ghi — `server/kho/duLieu.js` (+~220 dòng)
- `docPhaChe(csdl, ngay, thu, moc)` — món `kho_san_pham.kieu = 'lam_san'` + định mức theo thứ + đang có = Σ còn lại của lô thành phẩm còn
  hạn (`han_dung IS NULL OR han_dung > moc`, phiếu `da_duyet`) → `[{ id, ten, dinh_muc, dang_co, can_lam, co_cong_thuc }]`.
- `taoPhieuXuat(tx, { mon, nguoi, tuDuyet, thayCho, lyDo, luc })` — số phiếu (đọc số cuối trong ngày TRONG giao dịch; `so_phieu UNIQUE` chặn
  trùng), `INSERT kho_phieu` (`cho_duyet` hoặc `da_duyet`), dòng `thanh_pham` (+so_phan, mỗi món) + dòng `xuat` (−lượng, theo món × nguyên liệu).
  `tuDuyet` → gọi `ghiKho` ngay trong cùng giao dịch.
- `ghiKho(tx, phieuId, luc)` — chỉ gọi SAU khi câu khoá trạng thái đổi được dòng: (a) mỗi dòng `thanh_pham`: tạo `kho_lo` (hạn = `congNgay(luc,
  han_ngay)`, giá vốn = Σ(lượng × `gia_nhap`) / số phần nếu MỌI nguyên liệu có giá, ngược lại NULL), gắn `lo_id`; (b) mỗi nguyên liệu: đọc lô
  còn hàng chưa hết hạn xếp `han_dung` gần nhất (Q4) → `chiaTheoLo` → sửa dòng `xuat` nháp thành các mảnh có `lo_id` + `don_gia`.
  Dòng của phiếu chưa duyệt không vào tồn (tồn = Σ dòng phiếu `da_duyet`) nên sửa dòng nháp trước khi duyệt không phá sổ chỉ thêm.
- `duyetPhieu(tx, id, nguoi, luc)` — `UPDATE kho_phieu SET trang_thai='da_duyet', nguoi_duyet=?, duyet_luc=? WHERE id=? AND loai='PX' AND
  trang_thai='cho_duyet' AND nguoi_tao <> ?`; `changes = 0` → không ghi gì (đường trả 409 / 403); `changes = 1` → `ghiKho`. Cùng giao dịch.
- `tuChoiPhieu` / `huyPhieu` — `UPDATE … SET trang_thai='huy', ly_do=?, nguoi_duyet=? WHERE id=? AND trang_thai IN (…)` kiểm `changes`. GIỮ dòng.
- `suaPhieu(tx, id, mon, nguoi, lyDo, luc)` — chủ quán: huỷ phiếu cũ (khoá trạng thái như trên) + `taoPhieuXuat({ thayCho: id, tuDuyet: true })`.
- `ghiKetQua(tx, phieuId, spId, soThuc, ghiChu, nguoi, luc)` — phiếu `da_duyet`, `trangThaiKetQua` ≠ `tu_chot`, lô của món trong phiếu →
  `INSERT dòng loai='ket_qua' (so_luong = soThuc − chuẩn, lo_id, nguoi, luc, ghi_chu)`; ✓ = dòng 0. Trùng → `laTrungKhoa` → 409.
- `docPhieu(csdl, id, anGia)` / `dsPhieu(csdl, loc, anGia)` / `demChoDuyet(csdl)` / `docTon(csdl, moc, anGia)` (nguyên liệu: Σ dòng, tối thiểu,
  nhóm; thành phẩm: theo lô, hạn, còn lại ≠ 0). `anGia` bỏ `gia_nhap`, `don_gia`, `gia_von` — cùng danh sách CHO PHÉP như KHO-1.
- `docDinhMuc` / `luuDinhMuc(tx, spId, [{ thu, so_luong }])` (xoá dòng cũ của món + chèn — trong giao dịch). `luuNhomCongThuc` (lệch / tỉ lệ).

## 4. Đường — `server/kho/duong.js` (+~200 dòng)
| Đường | owner | manager | staff |
|---|---|---|---|
| `GET /pha-che?ngay=hom_nay\|ngay_mai` | ✓ | ✓ | ✓ |
| `GET/PUT /dinh-muc`, `PUT /nhom-cong-thuc/:id` (lệch) , `PUT /san-pham/:id/han` | ✓ | ✓ | 403 |
| `POST /phieu-xuat` (staff → `cho_duyet` khi công tắc BẬT; owner/manager → tự duyệt) | ✓ | ✓ | ✓ |
| `GET /phieu`, `GET /phieu/:id` (staff không có giá), `POST /phieu/:id/in` (tăng `so_lan_in`) | ✓ | ✓ | ✓ |
| `GET /phieu/cho-duyet/dem` | ✓ | ✓ | 403 |
| `POST /phieu/:id/duyet`, `POST /phieu/:id/tu-choi` (lý do bắt buộc) | ✓ | ✓ | 403 |
| `POST /phieu/:id/ket-qua` | ✓ | ✓ | ✓ |
| `POST /phieu/:id/sua`, `POST /phieu/:id/huy` (lý do bắt buộc) | ✓ | 403 | 403 |
| `GET /ton` (staff không có giá) | ✓ | ✓ | ✓ |
Mọi đường dùng `checkRole(...)` liệt kê vai trò CHO PHÉP (vai trò lạ → 403). Lỗi mới có `code`: `TU_DUYET` (403), `PHIEU_DA_XU_LY` (409),
`THIEU_LY_DO`, `MON_CHUA_CONG_THUC`, `SO_PHAN_SAI` (400), `DA_TU_CHOT`, `DA_CO_KET_QUA` (409). Giờ: `getNow()`; ngày: 10 ký tự đầu của `getNow()`.
Thứ của ngày: tính từ chuỗi ngày (`new Date(ngay + 'T00:00:00Z').getUTCDay()`), không từ đồng hồ máy.

## 5. Cài đặt — `server/routes/settings.js` (+~6 dòng)
- Khoá `kho_px_nv_can_duyet` chỉ nhận '0' / '1' (cùng khuôn kiểm `uudai_chung_hang_*`, kiểm HẾT trước khi ghi); khoá `kho_*` chỉ chủ quán
  đổi được (Q3). Đọc ở `duong.js` qua `SELECT value FROM pos_settings WHERE key = ?` — không có dòng = BẬT.
- Lệch theo nhóm món nằm ở cột `kho_nhom_cong_thuc` (mục 1), không ở `pos_settings`.
Phương án B (đường riêng `/kho/cai-dat`): không đụng settings.js (đang chạy song song KH-API-2) nhưng thành hai cửa ghi cùng một khoá — loại.

## 6. Nhập SX — `server/kho/nhapSx.js` (+~10 dòng)
`docFileSx` giữ `days_use` của món (juice qua `v_recipes`, nhóm khác qua `sx_products`); `lapKeHoach` đưa `han_ngay`; `ghiKeHoach`:
`UPDATE kho_san_pham SET han_ngay = ? WHERE pos_product_id = ? AND han_ngay IS NULL` (chỉ điền ô trống, không đè).

## 7. Giao diện — `client/src/pages/Kho/` (~800 dòng, phiếu ~750)
- `index.jsx`: tab **Pha chế** (đầu, mọi vai trò) · Tồn kho · Phiếu (huy hiệu số chờ duyệt) · Nguyên liệu · Sản phẩm & công thức · Định mức
  (owner/manager) · Nhập từ SX (owner). Mặc định mở Pha chế.
- `PhaChe.jsx` (~170): hai nút Hôm nay / Ngày mai; thẻ món: định mức · đang có · cần làm; ô tick (mặc định tick cần làm > 0) + ô số phần;
  nút lớn "Xuất kho nguyên liệu" → `POST /phieu-xuat` → mở `XemPhieu`. Nhân viên: thấy "Chờ duyệt", tự làm mới 15 s tới khi duyệt / từ chối.
- `XemPhieu.jsx` (~200): A bảng tổng cần lấy (ô ☐) · B mỗi món một bảng ngay dưới tên (cả mẻ + 1 phần) · C kết quả (✓ một chạm / sửa số +
  ghi chú, vàng khi lệch quá ngưỡng, nhãn "tự chốt") · người tạo / duyệt / giờ. Nút Duyệt · Từ chối (lý do) cho owner/manager khi `cho_duyet`;
  In 80 mm / In A4 (gọi `POST /phieu/:id/in` rồi `window.print()`; lần ≥ 2 in dòng "IN LẠI · LẦN n"; máy in lỗi không đụng sổ); Sửa / Huỷ
  (lý do) chỉ owner. Đỏ cho nguyên liệu tồn âm sau xuất.
- `inPhieuKho.css` (~30): `@media print` + hai lớp khổ giấy (`@page size: 80mm auto` / `A4`). KHÔNG dùng `InPhieu.jsx` / `utils/inPhieu.js` (Cấm).
- `DsPhieu.jsx` (~120): khung "Chờ duyệt" trên cùng (owner/manager, tự làm mới 30 s); lọc loại / trạng thái / ngày; bấm → `XemPhieu`.
- `TonKho.jsx` (~150): tab Nguyên liệu / Thành phẩm + tab nhóm; ô tìm không dấu (`normalize('NFD')` bỏ dấu + `đ→d`, cùng hành vi
  `NguyenLieu.jsx`); sắp xếp tên / tồn / hạn; dưới tối thiểu → vàng; âm → đỏ; lô sắp hết hạn (Q2) / quá hạn → đỏ. Cột giá chỉ khi máy chủ trả.
- `DinhMuc.jsx` (~110): mỗi món làm sẵn: "mọi ngày" + 7 ô theo thứ (trống = theo mọi ngày); ô hạn dùng (ngày) của món; khung nhỏ "Lệch cho
  phép theo nhóm" (owner/manager) và công tắc "Nhân viên xuất kho cần duyệt" (owner, ghi qua `PUT /api/pos/settings`).
- `components/Layout.jsx` (+~8): owner/manager hỏi `GET /kho/phieu/cho-duyet/dem` cùng nhịp 60 s đã có, hiện số trên mục "Quản lý kho".
  `App.jsx`: không đổi (route `/kho` có sẵn).
- `(cd client && npm run build)` + commit `client/dist/`.
Phương án B (trang in riêng mở cửa sổ mới, HTML chuỗi): khỏi CSS in nhưng chép lại toàn bộ bảng phiếu lần hai — loại.

## 8. Bộ kiểm — `kiem_tra_truoc_khi_giao.js` (+1 dòng): `chayBaiThat('cong_cu/thu_KHO2a.js')` (chỉ THÊM phép).

## Ngân sách
| Phần | Ước | Phiếu |
|---|---|---|
| máy chủ (002 ~30, tinh +90, duLieu +220, duong +200, nhapSx +10, settings +6) | ~560 | ~650 |
| giao diện (Kho/* ~780 + Layout 8) | ~790 | ~750 — có thể vượt ~5 % vì 4 màn mới; gọn `XemPhieu` trước |
| bài thử `thu_KHO2a.js` ~480 + `thu_KHO1.js` ~4 | ~485 | ~500 |

## Bài thử `cong_cu/thu_KHO2a.js` — khuôn `thu_KHO1.js` (database.js thật + libsql trên kho TẠM, route thật qua `app.listen(0)`, JWT ba vai trò)
Chạy cả với `TZ=UTC`; ca giờ giả lập đồng hồ bằng cách thay `Date` trong tiến trình (giờ VN 06:00 ngày D = UTC 23:00 ngày D−1).
| Nghiệm thu | Ca |
|---|---|
| A | A1 manager `PUT /dinh-muc` món lam_san: mọi ngày 10, thứ 7 = 15 → `GET` trả đúng; A2 `chonDinhMuc` thứ có dòng / không dòng → mọi ngày / không gì → 0; A3 staff `PUT /dinh-muc` → 403 |
| B | B1 `GET /pha-che`: định mức 10, lô thành phẩm còn hạn 4 + lô HẾT HẠN 5 → đang có 4, cần làm 6; B2 đang có > định mức → cần làm 0 (không âm); B3 `ngay_mai` lấy định mức theo thứ của ngày mai (VN) + lô còn hạn tới đầu ngày mai (Q5); B4 món `pha_tai_cho` / `chua_dinh_luong` không hiện |
| C | C1 phiếu 2 món, một món có thành phần lồng → bảng tổng = Σ `trienKhai` (so số), mỗi món bảng riêng + 1 phần = mẻ / số phần; C2 MỘT phiếu (đếm `kho_phieu` +1); C3 số phiếu `PX-YYMMDD-NNN`, phiếu thứ hai cùng ngày NNN+1, ngày theo giờ VN dưới `TZ=UTC`; C4 món không công thức → 400 `MON_CHUA_CONG_THUC`, không phiếu nào được ghi; C5 so_phan ≤ 0 → 400; C6 sửa công thức SAU khi tạo phiếu → `GET /phieu/:id` vẫn số cũ (từ `cho_mon_id`) |
| D | D1 staff tạo → `cho_duyet`, tồn KHÔNG đổi; D2 manager tạo → `da_duyet`, `nguoi_duyet` = manager, tồn đổi; D3 staff/owner tự duyệt phiếu của mình (owner tạo bằng tài khoản staff thứ hai) → 403 `TU_DUYET`; D4 staff gọi `/duyet` → 403; D5 **hai người duyệt song song** (`Promise.all` manager + owner) → đúng một 200, một 409, dòng thành phẩm/lô ghi ĐÚNG MỘT lần; D6 bấm duyệt hai lần cùng người → 1 lần ghi; D7 từ chối không lý do → 400; có lý do → `huy`, tồn không đổi; D8 công tắc '0' → staff tạo tự duyệt; không có dòng cài đặt → cần duyệt (mặc định); D9 `GET /phieu/cho-duyet/dem` đếm đúng, staff → 403; D10 settings `kho_px_nv_can_duyet='2'` → 400, manager đổi → 403 (Q3) |
| E | E1 duyệt → dòng âm từng nguyên liệu, tồn nguyên liệu = −lượng (không có lô → âm, VẪN ghi, có cờ đỏ); E2 có 2 lô nguyên liệu (hạn xa / hạn gần) + 1 lô quá hạn → trừ lô hạn gần trước, hết thì sang lô kia, thiếu ra dòng `lo_id NULL`; lô quá hạn không bị trừ (Q4); E3 thành phẩm: mỗi món một lô, `han_dung = congNgay(duyet_luc, han_ngay)`, `so_luong` = số phần; E4 giá vốn = Σ(lượng × giá) / phần khi đủ giá; một nguyên liệu thiếu giá → NULL; E5 `congNgay` qua cuối tháng / năm; E6 bước 002: cột mới có, chạy lại không đổi, `kho_san_pham` có dòng → bảng `_sao_luu_002_kho_san_pham`; E7 nhập SX điền `han_ngay` từ `days_use` khi trống, KHÔNG đè ô đã có |
| F | F1 ✓ → dòng `ket_qua` 0, tồn lô = chuẩn; F2 sửa số thực 8 (chuẩn 10) + ghi chú → dòng −2 có `nguoi`, `luc`, tồn lô 8; F3 lệch 20 % > cho phép 10 % → `canh_bao` vàng, VẪN ghi; lệch 10 % đúng ngưỡng → không cảnh báo (ca trên + dưới ngưỡng); F4 **hai lần ghi kết quả song song** cùng món → một 200, một 409, một dòng; F5 tự chốt: phiếu duyệt ngày D (VN), đồng hồ D+1 06:00 VN (= D 23:00 UTC) → `tu_chot`, ghi kết quả → 409 `DA_TU_CHOT`; đồng hồ D 23:30 VN → còn `cho_dien`; F6 phiếu `cho_duyet` / `huy` → ghi kết quả 409 |
| G | G1 `GET /ton` nguyên liệu: tồn = Σ dòng phiếu `da_duyet` (phiếu `cho_duyet`/`huy` không tính), cờ dưới tối thiểu / âm; G2 thành phẩm theo lô + hạn, cờ quá hạn / sắp hết hạn; G3 staff → KHÔNG có `gia_nhap`, `gia_von`, `don_gia` (quét cả cây JSON); manager có |
| H | H1 `GET /phieu?loai=PX&trang_thai=cho_duyet&tu=&den=` lọc đúng; H2 `POST /phieu/:id/in` lần 1 → `so_lan_in` 1, lần 2 → 2 (giao diện in "IN LẠI · LẦN 2"); H3 owner sửa (có lý do) → phiếu mới `thay_cho_id` = cũ, cũ `huy`, dòng cũ GIỮ nguyên (đếm), tồn = theo phiếu mới; H4 manager / staff sửa hoặc huỷ → 403; thiếu lý do → 400; H5 huỷ phiếu đã duyệt → tồn về như trước phiếu; H6 sửa song song với duyệt → chỉ một bên thắng (409 bên kia) |
| I | I1 bảng quyền mục 4: mỗi đường × ba vai trò + vai trò lạ (`role: 'thu_la'`) + không token → đúng mã; I2 đường lạ dưới `/api/pos/kho/` → 404 không lộ dữ liệu |
| J | J1 `POST /orders` món làm sẵn có phiếu kho → 200, tổng tiền y như trước, SX giả nhận đúng 1 lệnh trừ kho như cũ, `kho_phieu_dong` không thêm dòng (chưa trừ kho POS — KHO-3); J2 `thu_KHO1.js` vẫn xanh (đã sửa B1/B2 theo số bước thật) |
Luồng hợp lệ phải KHÔNG bị chặn (K5) — mỗi luồng một ca: manager tự duyệt (D2) · staff khi công tắc tắt (D8) · thiếu nguyên liệu vẫn xuất (E1)
· thiếu giá vẫn xuất (E4) · món chưa có hạn vẫn vào lô (E3 biến thể `han_ngay NULL`) · lệch quá ngưỡng vẫn ghi (F3) · owner sửa phiếu của chính
mình (H3) · bán hàng (J1).
Đường song song phải canh (K4): duyệt / tự duyệt khi tạo / sửa phiếu → cùng `ghiKho` (ca D2, D5, H3 đều kiểm lô + dòng); từ chối / huỷ / sửa
→ cùng khuôn khoá `WHERE trang_thai IN (…)` + `changes`; kết quả ✓ và kết quả sửa số → cùng `ghiKetQua` + khoá chỉ mục duy nhất; đọc giá ở
`/ton`, `/phieu`, `/phieu/:id` → cùng `anGia` (G3 quét cả ba); tự chốt ở màn xem và ở đường ghi kết quả → cùng `trangThaiKetQua`.

Đột biến (`viec/KHO-2a/dot_bien.py`, mỗi chỗ vá ≥ 1, có đối chứng): VS-dangco-tinh-lo-het-han · VS-tong-khong-trien-khai · BV-khoa-trang-thai-duyet
(bỏ `AND trang_thai='cho_duyet'`) · BV-chan-tu-duyet · VS-nv-tu-duyet (bỏ nhánh công tắc) · BV-chi-muc-ket-qua · VS-tu-chot-gio-may (dùng ngày
UTC) · VS-fefo-han-xa-truoc · VS-sua-xoa-dong-cu · BV-an-gia-ton · VS-quan-ly-sua-phieu.

## Câu hỏi cho chủ quán (trả lời khi duyệt kế hoạch)
- **Q1 "% chuẩn" theo nhóm món (nghiệm thu F):** máy hiểu: số chuẩn = số phần đã chọn (100 %); `% lệch cho phép` theo nhóm (vd nước ép 10 %)
  — thực ra khác chuẩn quá ngưỡng thì vàng. "% chuẩn" có phải là **tỉ lệ ra thành phẩm** (vd nước ép chuẩn ra 95 % số phần → nhập kho 9,5
  phần cho mẻ 10) không? Nếu có, lô vào kho theo số phần × % chuẩn. Đề xuất: bỏ "% chuẩn", chỉ giữ "% lệch cho phép".
- **Q2 "Sắp hết hạn"** (màn Tồn, đỏ): còn bao lâu thì báo? Đề xuất: còn ≤ 1 ngày (hằng số có tên ở `tinh.js`, đổi sau được).
- **Q3 Ai bật / tắt công tắc "Nhân viên xuất kho cần duyệt":** đề xuất CHỈ chủ quán (quản lý là người duyệt, không tự tắt việc duyệt).
- **Q4 Lô nguyên liệu đã quá hạn:** khi trừ theo lô, đề xuất BỎ QUA lô quá hạn (để xử lý ở phiếu phát sinh KHO-2b), chỉ trừ lô còn hạn.
- **Q5 "Cho ngày mai" — đang có:** đề xuất tính lô thành phẩm còn hạn tới 00:00 ngày mai (lô hết hạn trong đêm nay không tính).
- **Q6 Tự chốt:** qua ngày (giờ VN) mà chưa điền kết quả → tự coi đúng chuẩn; đề xuất sau đó KHÔNG cho điền nữa (409), sai thì chủ quán sửa phiếu
  (H). Máy không ghi dòng "tự chốt" — trạng thái suy ra từ ngày duyệt (không có cron vì Render ngủ).
