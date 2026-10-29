# KHO-2a — kế hoạch (CHỜ DUYỆT)

Nền đã đọc trong lượt này (K1):
- Bảng kho (`server/nang_cap/001_kho.js`): `kho_phieu` CHECK trạng thái `nhap/cho_duyet/da_duyet/huy` (SQLite không đổi được CHECK → không
  thêm trạng thái); `kho_phieu_dong` CHECK đúng một trong `nguyen_lieu_id` / `san_pham_id`, `so_luong` có dấu; `kho_lo.so_luong` = lượng lúc
  vào lô, còn lại = Σ dòng theo `lo_id`; `kho_dinh_muc` UNIQUE `(san_pham_id, thu)` nhưng SQLite KHÔNG chặn trùng khi `thu IS NULL` → lưu
  định mức phải xoá rồi chèn trong giao dịch. Không khoá ngoại (khôi phục Excel).
- Bộ chạy `server/nang_cap/chay.js:18-24`: mỗi bước một giao dịch, `themCot(bang, dinhNghia)` tự sao lưu bảng có dòng; `thu_KHO1.js:278`
  (B7) cấm `ALTER TABLE` viết thẳng trong bước.
- `server/kho/tinh.js` `trienKhai(congThuc, soPhan)` (lồng nhiều tầng, cộng dồn theo nguyên liệu gốc); `duLieu.docBangCongThuc`.
- `server/kho/duong.js`: `router.use(authenticate, chặn 503 NANG_CAP_HONG)`, `QUAN_LY` / `CHU_QUAN` = `checkRole(...)`; vòng thêm / sửa
  chung cho nhóm & nhà cung cấp (`:61-80`); `PUT /san-pham/:id` (`:95`, owner). Ghi qua `trongGiaoDich` + `loiGhi` (`wallets.js:118-137`).
- `beginTransaction` (`database.js:1536-1550`) mở lười, thử lại có hạn (`CHO_BEGIN_MS`); hết lượt → lỗi bận → `loiGhi` trả 409 `KHO_BAN`.
  Ca đua: bên thua nhận 409 `PHIEU_DA_XU_LY` HOẶC 409 `KHO_BAN` — cả hai chấp nhận được, điều bắt buộc là sổ chỉ ghi MỘT lần.
- `checkRole` (`auth.js:119`) — vai trò ngoài danh sách (kể cả `service` của web-sync, `:161`) → 403 `ROLE_NOT_ALLOWED`.
- `settings.js:88` PUT `/` ghi mọi khoá (owner/manager), có khuôn kiểm `uudai_chung_hang_*` (`:101-104`). `pos_settings` cũng được ghi lại
  nguyên bảng khi khôi phục sao lưu (`backup.js:53`) — không qua bước kiểm → đọc công tắc: CHỈ `'0'` là TẮT, mọi giá trị khác là BẬT.
- `nhapSx.js`: juice / tea đọc `SELECT *` từ `v_recipes` / `v_tea_products` (`:56`); nhóm khác đọc cột tường minh từ `sx_products` (`:64`, KHÔNG
  có `days_use`); `mon.push` chỉ giữ `loai, khoa_id, code, ten, dong` (`:57`, `:66`) → phải sửa câu SQL `:64` + hai chỗ push. Trà gói không có `days_use`.
- `backup.js` (NGOÀI Phạm vi) sao lưu theo danh sách bảng cứng (`:41-114`) bằng `SELECT *` → **không thêm bảng mới**; chỉ THÊM CỘT.
- `thu_KHO1.js:246-248` B1/B2 đếm cứng `pos_nang_cap` = 1 dòng `001_kho` → bước 002 làm đỏ — sửa theo `## Bài thử cũ sửa` của phiếu.
- `helpers.js:120` `addDaysToDateString` (cộng ngày theo lịch, không dính múi giờ); `getNow()` `:128`.
- Phiếu Ngân sách: `Layout.jsx` / `App.jsx` CHỈ route trong mục Kho → huy hiệu chờ duyệt đặt trong màn Kho, không đặt ở menu (Q7).

## 1. Dữ liệu — bước `server/nang_cap/002_kho_pha_che.js` (~25 dòng)
| | A — thêm CỘT vào bảng kho có sẵn (CHỌN) | B — bảng mới `kho_ket_qua`, `kho_cai_dat_nhom` |
|---|---|---|
| Sao lưu Excel | cột mới tự đi theo `SELECT *` | bảng mới KHÔNG vào `BACKUP_TABLES` (backup.js ngoài Phạm vi) → mất khi khôi phục |
| Dòng | ~25 | ~45 |
Chọn A. Mọi cột qua `themCot` (tự sao lưu bảng có dòng):
- `kho_san_pham.han_ngay INTEGER` — hạn dùng thành phẩm (ngày). NULL = chưa đặt → lô không có hạn, màn Tồn ghi "chưa có hạn".
- `kho_nhom_cong_thuc.lech_cho_phep REAL` (%). NULL = không cảnh báo. (Cột "% chuẩn" CHỈ thêm nếu Q1 trả lời có.)
- `kho_phieu.so_lan_in INTEGER NOT NULL DEFAULT 0` — đếm lần in, in dòng "IN LẠI · LẦN n" đúng cả khi in từ máy khác.
- `kho_phieu.ma_gui TEXT` + `CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_phieu_ma_gui ON kho_phieu(ma_gui) WHERE ma_gui IS NOT NULL` — **KHOÁ**
  chống bấm "Xuất kho nguyên liệu" hai lần: giao diện sinh một mã mỗi lần mở màn xác nhận; lần gửi thứ hai đụng khoá → trả lại phiếu đã tạo.
- `kho_phieu_dong.loai TEXT CHECK (loai IN ('xuat','thanh_pham','ket_qua'))` · `kho_phieu_dong.cho_mon_id INTEGER` (dòng nguyên liệu xuất cho
  món nào — in "bảng theo công thức" từ chính sổ) · `kho_phieu_dong.nguoi TEXT` · `kho_phieu_dong.luc TEXT`.
- `CREATE UNIQUE INDEX IF NOT EXISTS ux_kho_ket_qua_lo ON kho_phieu_dong(lo_id) WHERE loai = 'ket_qua'` — **KHOÁ** một kết quả mỗi lô.
  `CREATE INDEX IF NOT EXISTS idx_kho_phieu_dong_lo ON kho_phieu_dong(lo_id)`.
- Công tắc duyệt: khoá `pos_settings.kho_px_nv_can_duyet`. Không có dòng = BẬT; chỉ `'0'` là tắt (mặc định là hành vi, có ca không seed).
Đã loại cho "bảng theo công thức": (B) bản chụp JSON trong `kho_phieu` — hai nguồn sự thật; (C) tính lại theo công thức hiện tại khi in —
in lại sau khi sửa công thức ra SAI số.

## 2. Phép tính thuần — `server/kho/tinh.js` (+~80 dòng, không CSDL, không giờ máy)
- `chonDinhMuc(dongDm, thu)` → dòng `thu` đó, không có thì dòng `thu = NULL`, không có nữa → 0. `canLam(dm, dangCo)` = `max(0, dm − dangCo)`.
- `lapPhieuXuat(mon, bangCongThuc)` — `mon = [{ san_pham_id, so_phan }]` → `{ theo_mon: [{ san_pham_id, so_phan, nguyen_lieu: trienKhai(…) }],
  tong, thieu_cong_thuc }`. MỘT hàm cho tạo phiếu và sửa phiếu.
- `chiaTheoLo(can, lo)` — `can = [{ cho_mon_id, luong }]` của MỘT nguyên liệu, `lo = [{ id, con }]` đã xếp hạn gần nhất trước → mảnh
  `{ cho_mon_id, lo_id | null, luong }`; hết lô thì phần thiếu `lo_id = null` (tồn âm, không chặn).
- `hanLo(luc, ngay)` = `addDaysToDateString(luc, ngay) + luc.slice(10)` (dùng lại helpers, không viết hàm cộng ngày mới); `ngay` NULL → NULL.
- `soPhieuKe(loai, ngay, soCuoi)` → `PX-YYMMDD-NNN`. `thuCuaNgay(ngay)` = `new Date(ngay + 'T00:00:00Z').getUTCDay()`.
- `bangPhieu(dong, nguyenLieu)` — dòng phiếu → `{ tong, theo_mon: [{ mon, so_phan, nguyen_lieu, mot_phan }] }`, mỗi dòng có `luong_hien` theo
  `he_so_doi` (g / ml hiện đúng theo số phần) — màn xem và in dùng chung.
- `lechQuaNguong(chuan, thuc, lechChoPhep)` → true khi `|thuc − chuan| / chuan × 100 > lechChoPhep` (NULL → false).
- `trangThaiKetQua(ngayLam, homNay, coKetQua, laPhieuSua)` → `'da_dien' | 'cho_dien' | 'tu_chot'` (phiếu sửa của chủ quán = đã chốt).
- Hằng số có tên: `SAP_HET_HAN_NGAY` (Q2).

## 3. Đọc / ghi — `server/kho/duLieu.js` (+~210 dòng)
- `conLaiTheoLo(csdl, dieuKien)` — MỘT câu SQL "còn lại theo lô = Σ dòng phiếu `da_duyet` theo `lo_id`" dùng chung cho Pha chế (đang có),
  Tồn, và chia lô nguyên liệu (không để ba cách tính lệch nhau).
- `docPhaChe(csdl, ngay, moc)` — món `kieu = 'lam_san'` + định mức theo thứ + đang có = Σ còn lại lô thành phẩm `han_dung IS NULL OR > moc`.
- `taoPhieuXuat(tx, { mon, nguoi, tuDuyet, thayCho, lyDo, maGui, luc, lucLam })` — số phiếu (đọc số cuối trong ngày TRONG giao dịch; `so_phieu
  UNIQUE` chặn trùng), `INSERT kho_phieu`, dòng `thanh_pham` (+số phần) + dòng `xuat` nháp (−lượng, theo món × nguyên liệu). `tuDuyet` →
  `ghiKho` ngay trong cùng giao dịch.
- `ghiKho(tx, phieuId, lucLam)` — gọi SAU khi câu khoá trạng thái đổi được dòng: (a) mỗi dòng `thanh_pham`: tạo `kho_lo` (hạn = `hanLo(lucLam,
  han_ngay)`, giá vốn = Σ(lượng × `gia_nhap`) / số phần nếu MỌI nguyên liệu có giá, ngược lại NULL), gắn `lo_id`; (b) mỗi nguyên liệu: lô còn
  hàng, chưa hết hạn (Q4), xếp hạn gần nhất → `chiaTheoLo` → thay dòng `xuat` nháp bằng các mảnh có `lo_id` + `don_gia`. Dòng của phiếu chưa
  duyệt không vào tồn nên thay dòng nháp không phá sổ chỉ thêm. MỘT hàm cho cả ba đường: duyệt · tự duyệt khi tạo · sửa phiếu.
- `duyetPhieu(tx, id, nguoi, luc)` — `UPDATE kho_phieu SET trang_thai='da_duyet', nguoi_duyet=?, duyet_luc=? WHERE id=? AND loai='PX' AND
  trang_thai='cho_duyet' AND nguoi_tao <> ?`; `changes = 0` → không ghi gì; `changes = 1` → `ghiKho(tx, id, luc)`.
- `tuChoiPhieu` — CÙNG điều kiện khoá với duyệt (`trang_thai='cho_duyet' AND nguoi_tao <> ?`) → `huy`, `ly_do`, `nguoi_duyet`. GIỮ dòng.
- `huyPhieu` (chủ quán) — `WHERE trang_thai IN ('cho_duyet','da_duyet')`, kiểm `changes`. GIỮ dòng.
- `suaPhieu(tx, id, mon, nguoi, lyDo, luc)` — chủ quán: huỷ phiếu cũ (khoá như `huyPhieu`) + `taoPhieuXuat({ thayCho: id, tuDuyet: true,
  lucLam: <duyet_luc phiếu cũ, không có thì luc> })` → hạn lô theo giờ làm THẬT; số chủ quán nhập là số chốt (phiếu sửa không mở lại ô kết quả,
  không vòng qua tự chốt). Kết quả của phiếu cũ rơi khỏi tồn cùng phiếu cũ.
- `ghiKetQua(tx, phieuId, spId, soThuc, ghiChu, nguoi, luc)` — phiếu `da_duyet`, không phải phiếu sửa, `trangThaiKetQua` ≠ `tu_chot`, lô của
  món trong phiếu → `INSERT dòng loai='ket_qua'` (`so_luong = soThuc − chuẩn`, `lo_id`, `nguoi`, `luc`, `ghi_chu`); ✓ = dòng 0. Trùng → 409.
- `docPhieu` / `dsPhieu(loc)` / `docTon(moc)` / `docDinhMuc` / `luuDinhMuc` (xoá dòng cũ của món + chèn, trong giao dịch).
- **Ẩn giá MỘT chỗ:** mọi phản hồi có phiếu / lô / tồn đi qua `boGia(obj, anGia)` (bỏ đệ quy `gia_nhap`, `don_gia`, `gia_von`) ở `duong.js`
  — cả đường đọc lẫn phản hồi của đường ghi.

## 4. Đường — `server/kho/duong.js` (+~190 dòng)
| Đường | owner | manager | staff |
|---|---|---|---|
| `GET /pha-che?ngay=hom_nay\|ngay_mai` | ✓ | ✓ | ✓ |
| `GET/PUT /dinh-muc` | ✓ | ✓ | 403 |
| `POST/PUT /nhom-cong-thuc` (lệch cho phép — thêm một bộ vào vòng chung `:61`) | ✓ | ✓ | 403 |
| `PUT /san-pham/:id` có sẵn + trường `han_ngay` | ✓ | 403 | 403 |
| `POST /phieu-xuat` (staff → `cho_duyet` trừ khi công tắc = '0'; owner/manager → tự duyệt) | ✓ | ✓ | ✓ |
| `GET /phieu` (lọc loại / trạng thái / từ / đến — cũng là nguồn đếm chờ duyệt), `GET /phieu/:id`, `POST /phieu/:id/in` | ✓ | ✓ | ✓ |
| `POST /phieu/:id/duyet`, `POST /phieu/:id/tu-choi` (lý do bắt buộc) | ✓ | ✓ | 403 |
| `POST /phieu/:id/ket-qua` | ✓ | ✓ | ✓ |
| `POST /phieu/:id/sua`, `POST /phieu/:id/huy` (lý do bắt buộc) | ✓ | 403 | 403 |
| `GET /ton` | ✓ | ✓ | ✓ |
| mọi đường khác dưới `/api/pos/kho` (cuối router) | 403 | 403 | 403 |
Mọi đường `checkRole(...)` liệt kê vai trò CHO PHÉP. Mã lỗi mới: `TU_DUYET` (403), `PHIEU_DA_XU_LY`, `DA_TU_CHOT`, `DA_CO_KET_QUA` (409),
`THIEU_LY_DO`, `MON_CHUA_CONG_THUC`, `SO_PHAN_SAI` (400), `DUONG_LA` (403). Giờ: `getNow()`; ngày: 10 ký tự đầu của `getNow()`.

## 5. Cài đặt — `server/routes/settings.js` (+~6 dòng)
Khoá `kho_px_nv_can_duyet` chỉ nhận '0' / '1' (cùng khuôn `uudai_chung_hang_*`, kiểm HẾT trước khi ghi); khoá `kho_*` chỉ chủ quán đổi (Q3).
Phương án B (đường riêng `/kho/cai-dat`): không đụng settings.js (KH-API-2 chạy song song) nhưng thành hai cửa ghi cùng khoá — loại.

## 6. Nhập SX — `server/kho/nhapSx.js` (+~15 dòng)
Câu `sx_products` (`:64`) thêm `p.days_use`; hai `mon.push` (`:57`, `:66`) giữ `han_ngay: duong(r.days_use)`; `lapKeHoach` đưa `han_ngay` vào
món; `ghiKeHoach`: `UPDATE kho_san_pham SET han_ngay = ? WHERE pos_product_id = ? AND han_ngay IS NULL` (chỉ điền ô trống, không đè).

## 7. Giao diện — `client/src/pages/Kho/` (~740 dòng)
- `index.jsx`: tab **Pha chế** (đầu, mọi vai trò, mặc định) · Tồn kho · Phiếu (huy hiệu số chờ duyệt cho owner/manager — hỏi
  `GET /phieu?trang_thai=cho_duyet` mỗi 30 s, MỘT vòng hỏi cho cả huy hiệu và khung Chờ duyệt) · Nguyên liệu · Sản phẩm & công thức · Định mức
  (owner/manager) · Nhập từ SX (owner).
- `PhaChe.jsx` (~160): hai nút Hôm nay / Ngày mai; thẻ món: định mức · đang có · cần làm; tick (mặc định tick cần làm > 0) + ô số phần; nút
  lớn "Xuất kho nguyên liệu" (khoá nút khi đang gửi + `ma_gui`) → mở `XemPhieu`. Nhân viên thấy "Chờ duyệt", màn tự làm mới 15 s tới khi
  duyệt / từ chối.
- `XemPhieu.jsx` (~190): A bảng tổng cần lấy (ô ☐) · B mỗi món một bảng ngay dưới tên (cả mẻ + 1 phần, đơn vị hiện) · C kết quả (✓ một chạm /
  sửa số + ghi chú, vàng khi lệch, nhãn "tự chốt") · người tạo / duyệt / giờ. Duyệt · Từ chối (lý do) cho owner/manager khác người tạo;
  In 80 mm / In A4 (`POST /phieu/:id/in` rồi `window.print()`; lần ≥ 2 in "IN LẠI · LẦN n"; máy in lỗi không đụng sổ); Sửa / Huỷ (lý do) chỉ
  owner. Đỏ cho nguyên liệu tồn âm.
- `inPhieuKho.css` (~30): `@media print` + `@page size: 80mm auto` / `A4`. KHÔNG dùng `InPhieu.jsx` / `utils/inPhieu.js` (Cấm).
- `DsPhieu.jsx` (~110): khung "Chờ duyệt" trên cùng (owner/manager); lọc loại / trạng thái / ngày; nhãn "tự chốt"; bấm → `XemPhieu`.
- `TonKho.jsx` (~140): Nguyên liệu / Thành phẩm + tab nhóm; ô tìm không dấu (cùng hành vi `NguyenLieu.jsx`); sắp xếp tên / tồn / hạn; dưới
  tối thiểu → vàng; âm → đỏ; lô sắp hết hạn / quá hạn → đỏ. Cột giá chỉ khi máy chủ trả.
- `DinhMuc.jsx` (~100): mỗi món làm sẵn "mọi ngày" + 7 ô theo thứ (trống = theo mọi ngày); khung "Lệch cho phép theo nhóm"; công tắc "Nhân viên
  xuất kho cần duyệt" (chỉ owner, ghi `PUT /api/pos/settings`). Hạn dùng của món: ô mới trong `SanPham.jsx` (owner, +~10).
- `Layout.jsx`, `App.jsx`: KHÔNG đổi (route `/kho` có sẵn; huy hiệu ở menu chính chờ Q7).
- `(cd client && npm run build)` + commit `client/dist/`.
Phương án B (trang in mở cửa sổ mới, HTML chuỗi): khỏi CSS in nhưng chép bảng phiếu lần hai — loại.

## 8. Bộ kiểm — `kiem_tra_truoc_khi_giao.js` (+1 dòng): `chayBaiThat('cong_cu/thu_KHO2a.js')` (chỉ THÊM phép).

## Ngân sách
| Phần | Ước | Phiếu |
|---|---|---|
| máy chủ (002 ~25, tinh +80, duLieu +210, duong +190, nhapSx +15, settings +6) | ~525 | ~650 |
| giao diện (Kho/* ~740) | ~740 | ~750 |
| bài thử `thu_KHO2a.js` ~500 + `thu_KHO1.js` ~4 | ~505 | ~500 |

## Bài thử `cong_cu/thu_KHO2a.js` — khuôn `thu_KHO1.js` (database.js thật + libsql trên kho TẠM, route thật qua `app.listen(0)`, JWT vai trò)
Bài chạy với `TZ=UTC`; ca giờ thay `Date` trong tiến trình (06:00 VN ngày D = 23:00 UTC ngày D−1). Ca đua: bên thua 409 `PHIEU_DA_XU_LY`
hoặc `KHO_BAN`, điều kiện ĐẠT là đếm dòng / lô đúng MỘT lần.
| Nghiệm thu | Ca |
|---|---|
| A | A1 manager `PUT /dinh-muc` món lam_san: mọi ngày 10, thứ 7 = 15 → `GET` trả đúng; lưu lại lần hai → không nhân đôi dòng `thu NULL`; A2 owner đặt được; A3 `chonDinhMuc` thứ có dòng / chỉ mọi ngày / không gì → 0; A4 staff → 403 |
| B | B1 `GET /pha-che`: định mức 10, lô còn hạn 4 + lô HẾT HẠN 5 → đang có 4, cần làm 6; B2 đang có > định mức → 0; B3 `ngay_mai` theo thứ ngày mai (VN, dưới TZ=UTC) + lô còn hạn tới 00:00 ngày mai (Q5); B4 món `pha_tai_cho` / `chua_dinh_luong` không hiện |
| C | C1 phiếu 2 món, một món lồng → bảng tổng = Σ `trienKhai` (so số), mỗi món bảng riêng, 1 phần = mẻ / số phần; C2 MỘT phiếu (+1 `kho_phieu`); C3 `PX-YYMMDD-NNN`, phiếu sau cùng ngày NNN+1, ngày theo VN dưới TZ=UTC; C4 món không công thức → 400 `MON_CHUA_CONG_THUC`, không ghi gì; C5 số phần ≤ 0 → 400; C6 sửa công thức SAU khi tạo → `GET /phieu/:id` vẫn số cũ; C7 **bấm hai lần** (`Promise.all` hai `POST /phieu-xuat` cùng `ma_gui`, quản lý tự duyệt) → một phiếu, một bộ lô; C8 `luong_hien` đổi theo `he_so_doi` (g) và theo số phần |
| D | D1 staff tạo → `cho_duyet`, tồn KHÔNG đổi; D2 manager tạo → `da_duyet`, `nguoi_duyet` = manager; D3 phiếu `cho_duyet` có `nguoi_tao` = manager1 (dựng bằng SQL — vd nhân viên vừa lên quản lý) → manager1 duyệt → 403 `TU_DUYET`, không ghi gì; owner duyệt phiếu của staff → 200 (hợp lệ); D4 staff gọi `/duyet` → 403; D5 **hai người duyệt song song** → một 200, dòng / lô ghi MỘT lần; D6 cùng người bấm hai lần → MỘT lần; D7 từ chối không lý do → 400, có lý do → `huy`, tồn không đổi; D8 công tắc '0' → staff tự duyệt; không có dòng / giá trị lạ 'x' → cần duyệt; D9 `GET /phieu?trang_thai=cho_duyet` ra đúng danh sách chờ; D10 settings `kho_px_nv_can_duyet='2'` → 400, manager đổi → 403 (Q3); D11 **từ chối song song với duyệt** → một bên thắng, nếu từ chối thắng thì không lô nào; D12 người tạo tự từ chối → 403; từ chối phiếu đã duyệt → 409 |
| E | E1 duyệt → dòng âm từng nguyên liệu, không lô → tồn âm, VẪN ghi, cờ đỏ; E2 2 lô nguyên liệu (hạn xa / gần) + 1 lô quá hạn → trừ lô gần trước, thiếu ra `lo_id NULL`, lô quá hạn không bị trừ (Q4); E3 mỗi món một lô, `han_dung = hanLo(duyet_luc, han_ngay)`, `han_ngay NULL` → lô không hạn, vẫn vào; E4 giá vốn khi đủ giá; thiếu một giá → NULL; E5 `hanLo` qua cuối tháng / năm; E6 bước 002: cột mới có, chạy lại không đổi, `kho_san_pham` có dòng → `_sao_luu_002_kho_san_pham`; E7 nhập SX điền `han_ngay` từ `days_use` cho món juice (`v_recipes`) VÀ món nhóm khác (`sx_products`), KHÔNG đè ô đã có; E8 **một giao dịch**: trigger tạm `RAISE` khi chèn `kho_lo` → duyệt lỗi → phiếu vẫn `cho_duyet`, không dòng nào đổi; cùng trigger với tạo-tự-duyệt → không có phiếu |
| F | F1 ✓ → dòng `ket_qua` 0; F2 số thực 8 (chuẩn 10) + ghi chú → dòng −2 có `nguoi`, `luc`, tồn lô 8; F3 nhóm A lệch 10 %, nhóm B 30 %: lệch 20 % → vàng ở A, không ở B; đúng 10 % ở A → không vàng (trên / dưới ngưỡng); món không nhóm → không vàng; VẪN ghi; F4 **hai kết quả song song** cùng món → một dòng; F5 duyệt ngày D (VN), đồng hồ D+1 06:00 VN → `tu_chot` ở `GET /phieu/:id` và `GET /phieu`, ghi → 409 `DA_TU_CHOT`; D 23:30 VN → `cho_dien`; F6 phiếu `cho_duyet` / `huy` / phiếu sửa → ghi kết quả 409 |
| G | G1 `GET /ton` nguyên liệu = Σ dòng phiếu `da_duyet` (bỏ `cho_duyet` / `huy`), cờ dưới tối thiểu / âm, kèm nhóm; G2 thành phẩm theo lô + hạn, cờ quá hạn / sắp hết hạn (ca ngay trên + dưới `SAP_HET_HAN_NGAY`); G3 staff: quét đệ quy phản hồi của `/ton`, `/pha-che`, `/phieu`, `/phieu/:id`, `POST /phieu-xuat`, `/ket-qua`, `/in` → không có `gia_nhap` / `gia_von` / `don_gia`; manager có |
| H | H1 `GET /phieu` lọc loại / trạng thái / ngày đúng; H2 `/in` lần 1 → 1, lần 2 → 2 (`so_lan_in`); H3 owner sửa (lý do) → phiếu mới `thay_cho_id`, cũ `huy`, dòng cũ GIỮ (đếm), tồn = theo phiếu mới, dòng kết quả của phiếu cũ rơi khỏi tồn, lô mới hạn theo `duyet_luc` CŨ; H4 manager / staff sửa / huỷ → 403; thiếu lý do → 400; H5 huỷ phiếu đã duyệt → tồn về như trước; H6 sửa song song với duyệt → một bên thắng; H7 huỷ phiếu `cho_duyet` → `huy`, tồn không đổi |
| I | I1 bảng quyền mục 4: mỗi đường × owner / manager / staff + vai trò lạ (`thu_la`) + không token → đúng mã; I2 đường lạ dưới `/api/pos/kho/` → 403, không lộ dữ liệu |
| J | J1 `POST /orders` món làm sẵn đã có lô → 200, tổng tiền như trước, SX giả nhận đúng 1 lệnh trừ kho như cũ, `kho_phieu_dong` không thêm dòng (KHO-3 mới trừ); J2 `thu_KHO1.js` vẫn xanh (B1/B2 đếm theo số file bước thật, B1 vẫn kiểm bước 1 = `001_kho`) |
Phần máy không chạy được (thử tay trên điện thoại, ghi ở CHƯA KIỂM): tick mặc định + sửa số phần (B), bản in 80 mm / A4 có ô ☐ / ô điền /
dòng "IN LẠI" (C, H), huy hiệu tự làm mới (D), tab nhóm / tìm không dấu / sắp xếp (G).

Luồng hợp lệ phải KHÔNG bị chặn (K5) — mỗi luồng một ca: manager tự duyệt (D2) · owner duyệt phiếu staff (D3) · staff khi công tắc tắt (D8) ·
thiếu nguyên liệu vẫn xuất (E1) · thiếu giá vẫn xuất (E4) · món chưa có hạn vẫn vào lô (E3) · lệch quá ngưỡng vẫn ghi (F3) · owner sửa phiếu
(H3) · bán hàng (J1) · hai phiếu khác `ma_gui` trong cùng giây → hai phiếu (C3).
Đường song song (K4): duyệt / tự duyệt khi tạo / sửa → cùng `ghiKho` (D2, D5, H3, E8); duyệt / từ chối → cùng điều kiện khoá (D11, D12);
huỷ / sửa → cùng khoá `huyPhieu` (H5, H6, H7); ✓ và sửa số → cùng `ghiKetQua` + chỉ mục duy nhất (F4); ẩn giá → `boGia` ở mọi phản hồi (G3);
tự chốt ở màn xem, danh sách, đường ghi → cùng `trangThaiKetQua` (F5); đang có / tồn / chia lô → cùng `conLaiTheoLo` (B1, G1, E2).

Đột biến (`viec/KHO-2a/dot_bien.py`, mỗi chỗ vá ≥ 1, có đối chứng): VS-dangco-tinh-lo-het-han · VS-tong-khong-trien-khai ·
BV-khoa-trang-thai-duyet · BV-chan-tu-duyet · VS-tu-choi-khong-chan-nguoi-tao · VS-cong-tac-khac-0-la-tat · BV-ma-gui · BV-chi-muc-ket-qua ·
VS-tu-chot-gio-may · VS-fefo-han-xa-truoc · VS-sua-lo-han-gio-sua · BV-an-gia-phan-hoi-ghi · VS-quan-ly-sua-phieu · BV-duong-la-403.

## Câu hỏi cho chủ quán (trả lời khi duyệt kế hoạch)
- **Q1 "% chuẩn" theo nhóm món (F):** máy hiểu số chuẩn = số phần đã chọn; `% lệch cho phép` theo nhóm (vd nước ép 10 %). "% chuẩn" có phải
  **tỉ lệ ra thành phẩm** (mẻ 10 phần chuẩn ra 9,5) không? Có thì lô vào kho = số phần × % chuẩn và thêm một cột. Đề xuất: chỉ giữ "% lệch".
- **Q2 "Sắp hết hạn"** (Tồn, đỏ): đề xuất còn ≤ 1 ngày (hằng số có tên `SAP_HET_HAN_NGAY`).
- **Q3 Ai bật / tắt công tắc "Nhân viên xuất kho cần duyệt":** đề xuất CHỈ chủ quán.
- **Q4 Lô nguyên liệu quá hạn:** đề xuất BỎ QUA khi trừ (xử lý ở phiếu phát sinh KHO-2b).
- **Q5 "Cho ngày mai" — đang có:** đề xuất tính lô còn hạn tới 00:00 ngày mai.
- **Q6 Tự chốt:** qua ngày (giờ VN) chưa điền → coi đúng chuẩn; đề xuất sau đó KHÔNG cho điền nữa (409), sai thì chủ quán sửa phiếu (H). Không ghi
  dòng "tự chốt" — trạng thái suy từ ngày làm (không cron, Render ngủ).
- **Q7 Huy hiệu chờ duyệt:** phiếu giới hạn `Layout.jsx` chỉ route → huy hiệu nằm ở tab Phiếu trong màn Kho (chỉ thấy khi mở Kho). Muốn số hiện
  ở menu chính (mọi màn) thì cho thêm ~8 dòng `Layout.jsx` (BH-2 đang sửa menu song song — dễ đụng).
