# SAOLUU-2 — kế hoạch (chờ chủ quán duyệt)

Nền: `e94c504 PHIEU: SAOLUU-2` (main 36db19b + sổ v50). Mọi số dòng dưới đây đọc trong lượt này.

## 0. Hiện trạng đã đọc / đo
- `server/routes/backup.js` 425 dòng. `/restore` (336–423): mỗi trang `sheet_to_json(ws)` (378) → `DELETE FROM` (386) → cột =
  `Object.keys(rows[0])` (389) → `''`/null → null (394) → INSERT từng dòng, lỗi chỉ `console.error` (404–406). `/preview-restore` (281–330)
  đếm bằng `sheet_to_json` riêng. Một vị từ chung đã có: `chanTrangTien` (129).
- ĐO bằng chạy (`xlsx` của kho): `json_to_sheet([{a:1,b:null,c:''},{a:2,b:'x',c:'y'}])` → đọc lại `sheet_to_json` = `[{"a":1,"c":""},…]`
  (cột `b` MẤT ở dòng đầu → mất ở mọi dòng); với `{ defval: null }` = `[{"a":1,"b":null,"c":""},…]` (đủ cột). Ô chuỗi rỗng `''` đọc về là
  `''` — code gốc (394) đổi thành `null` → dữ liệu khôi phục lệch file (vòng tròn F lệch). Lỗi thứ tư, cùng khuôn (K4).
- `server/database.js`: `beginTransaction()` (1580) mở lười, thử lại khi bận, trả `{query, run, commit, rollback}`. Không có
  `PRAGMA foreign_keys` trong `server/` (grep rỗng) → khoá ngoại KHÔNG cưỡng chế; CHECK / NOT NULL / UNIQUE thì có.
- Bảng tạo bởi `server/nang_cap/**`: 10 bảng `kho_*` (001), `pos_nang_cap` (chay.js:28), `_sao_luu_*` (chay.js:23, 004:13 — bản lưu
  của bước nâng cấp, KHÔNG sao lưu). E8 của `kiem_tra_truoc_khi_giao.js` (388–398) chỉ quét `database.js`.
- `pos_don_app` CHƯA có ở main (KH-MUA-1 đang làm). `bangDangCo()` (140) lọc theo bảng đang có → thêm tên trước là an toàn.
- `cong_cu/thu_KHO2b.js` chưa có ở nền này; `thu_KHO2a.js` không nhắc tới backup (grep rỗng) → hai file này dự kiến KHÔNG đổi.

## 1. Phương án

### Phần 1 — chỗ đặt logic khôi phục
- **A (chọn):** tách `server/utils/khoiPhuc.js` (~110 dòng): `docTrang(ws)` (một chỗ đọc: `sheet_to_json(ws, { defval: null })`),
  `lapKeHoach(wb, BACKUP_TABLES)` — MỘT vị từ cho xem trước và khôi phục: mỗi trang → bảng, `status` (`se_khoi_phuc` / `skipped` + `code`),
  `cot` (cột trang ∩ `PRAGMA table_info`), `cot_bo_qua`, số dòng; `thucHien(keHoach)` — MỘT `beginTransaction()` cho toàn bộ: xoá mọi bảng
  sẽ khôi phục rồi chèn, dòng đầu tiên lỗi → `rollback`, ném lỗi có `bang` + `dong` (số dòng Excel = chỉ số + 2) + `ly_do`.
  `backup.js`: `/preview-restore` và `/restore` gọi hai hàm này; giữ `BACKUP_TABLES`, `BANG_KHONG_KHOI_PHUC`, `chanTrangTien`, chỉ owner.
  Ước lượng: khoiPhuc.js +110; backup.js −75 / +30. Rủi ro: thấp — luật cũ (tiền, kho_*, pos_nang_cap) dời nguyên vào `lapKeHoach`.
- **B:** sửa tại chỗ trong backup.js (~+60 dòng). Ít file hơn nhưng xem trước và khôi phục giữ hai đoạn đọc trang riêng → lệch nhau
  (đúng lỗi nghiệm thu C), và bài thử không gọi được hàm thuần. Không chọn: A ít dòng ròng hơn sau khi bỏ đoạn lặp, và phiếu đã cho phép.

### Phần 2 — tất cả hoặc không
- **A (chọn):** `beginTransaction()` có sẵn — một giao dịch, INSERT từng dòng (biết đúng dòng hỏng), cùng số lượt gọi Turso như hiện tại.
- **B:** `db.batch([...], 'write')` — một lượt gọi, nhưng `@libsql/client` 0.4.3 không báo câu thứ mấy hỏng (grep `statementIndex` rỗng)
  → không nêu được bảng + dòng (nghiệm thu B). Không chọn.

### Phần 3 — giá trị ô
- `defval: null` → ô thiếu = `null`; ô `''` giữ `''` (bỏ phép đổi `''` → null ở 394). Kiểu khác giữ nguyên như `xlsx` đọc.
- Rủi ro agent soát nêu: `''` ở cột UNIQUE (`qr_code`, database.js:90) — hai dòng `''` sẽ hỏng UNIQUE. Không xảy ra với file do POS xuất: dữ liệu
  xuất từ một CSDL có CÙNG ràng buộc UNIQUE nên không thể có hai `''` trùng; chỉ file sửa tay mới gặp, và khi đó báo đúng dòng (B) là đúng.

### Phần 4 — đủ bảng (D)
- Thêm `pos_don_app` (nhãn đề xuất **"Đơn từ App KH"**, key `id`) vào cuối nhóm tiền của `BACKUP_TABLES` và vào `BANG_KHONG_KHOI_PHUC`.
- Phép chốt: mở rộng E8 trong `kiem_tra_truoc_khi_giao.js` (THÊM phạm vi kiểm, không nới) — quét `CREATE TABLE IF NOT EXISTS (\w+)` trong
  `database.js` + mọi `server/nang_cap/*.js`, bỏ qua tên mở đầu `_sao_luu_` (bản lưu của bước nâng cấp — lý do ghi cạnh danh sách bỏ qua).
  Gắn `chayBaiThat('cong_cu/thu_SAOLUU2.js')` một dòng riêng (như HD-1, vì thu_P3 neo mảng bài).

### Lỗi trả về (mới, theo LUAT §2 mã lỗi)
- Dòng hỏng → `400 { code: 'KHOI_PHUC_DONG_HONG', bang, trang, dong, ly_do, error }`; `ly_do` rút gọn: "vi phạm CHECK" / "thiếu giá trị bắt
  buộc (NOT NULL)" / "trùng khoá (UNIQUE)" / "dữ liệu không hợp lệ" — không trả lời nội bộ của SQLite (LUAT §4).
- Bảng trong file mà CSDL chưa có → `skipped`, `code: 'BANG_CHUA_CO'` (trước đây: xoá rồi mọi INSERT hỏng âm thầm).
- `results[i].cot_bo_qua` (khôi phục + xem trước); xem trước thêm `status` + `code` cho từng trang (bỏ qua vì kho có dữ liệu / sổ nâng cấp
  / bảng chưa có / không nhận diện) — chỉ THÊM trường, giữ `fileRows`, `currentRows`, `recognized` cho màn Cài đặt (không sửa client).
- Kho bận khi mở giao dịch → `409 KHO_BAN` (mã đã có của `laLoiBan`); lỗi khác → 500 như cũ.

### Giữ nguyên (E)
Trang tiền có dòng → 400 trước mọi ghi (`chanTrangTien` chạy trước `lapKeHoach`); kho_* chỉ khi kho trống (đếm MỘT lần, trước giao dịch);
pos_nang_cap không bao giờ; trang trống (0 dòng) → `skipped` như cũ, KHÔNG xoá bảng; chỉ owner; xuất / định dạng file không đổi.

**Điểm xin chủ quán xác nhận khi duyệt (đề xuất của mình):** trang trống vẫn "bỏ qua, không xoá bảng" như hiện nay — an toàn hơn xoá sạch.

## 2. Ca thử — `cong_cu/thu_SAOLUU2.js` (khuôn thu_KHO1: database.js thật + libsql thật trên kho TẠM, route thật)
| Nghiệm thu | Ca | Gốc |
|---|---|---|
| A | A1 trang Khách hàng dòng đầu trống `xung_ho` + `address` + `notes` (cột thật: database.js:83–105, 003; phiếu gọi `dia_chi` = `address`), dòng 2 có → sau khôi phục dòng 2 đủ hai cột | ĐỎ |
| A | A2 trang Sản phẩm / Cài đặt dòng đầu trống `ghi_chu`-loại (cột tuỳ bảng đọc ở PRAGMA lúc viết bài) → dòng sau đủ; `don_id`: bảng có cột này ở nền hiện tại đều là trang tiền (bị chặn) → phủ bằng F1 (vòng tròn qua trang không chặn) và ghi CHƯA KIỂM nếu không có bảng khôi phục được mang cột đó | ĐỎ |
| A | A3 cột lạ `cot_la` trong file → khôi phục 200, dữ liệu đúng, `cot_bo_qua` = `['cot_la']` | ĐỎ (gốc: mọi INSERT hỏng âm thầm) |
| A | A4 ô `''` ở một cột chữ cho phép null (vd `pos_customers.notes`) khôi phục ra `''`, không thành `null` (grep `NOT NULL DEFAULT ''` trong database.js + nang_cap rỗng → không có cột nào hỏng dòng vì việc này, chỉ lệch dữ liệu) | ĐỎ |
| B | B1 hai trang, trang 2 dòng 3 vi phạm CHECK → 400 `KHOI_PHUC_DONG_HONG`, `bang`, `dong` = 3, `ly_do` CHECK; băm MỌI bảng trước = sau (cả trang 1) | ĐỎ |
| B | B2 dòng trùng khoá chính → 400, không đổi gì | ĐỎ |
| B | B3 (tĩnh) `khoiPhuc.js` không còn `console.error` trong vòng chèn | ĐỎ |
| C | C4 xem trước trang Nâng cấp dữ liệu → `skipped NANG_CAP_KHONG_KHOI_PHUC`; C5 xem trước bảng chưa có trong CSDL → `skipped BANG_CHUA_CO` |  ĐỎ |
| C | C1 xem trước cùng file A3 → `cot_bo_qua` khớp khôi phục; C2 trang kho khi kho có dữ liệu → `skipped KHO_CO_DU_LIEU` ở xem trước; C3 trang tiền → 400 (giữ) | ĐỎ (C1, C2) |
| D | D1 `pos_don_app` có trong BACKUP_TABLES và BANG_KHONG_KHOI_PHUC; D2 phép quét: (a) bản backup.js bỏ `kho_lo` → báo thiếu; (b) thêm file nháp `server/nang_cap/999_x.js` (trong BẢN SAO tạm, không trong kho) tạo `bang_moi_thu` → báo thiếu; (c) `_sao_luu_*` và `pos_order_items_new` (database.js:907, không IF NOT EXISTS — bảng tạm đổi tên) KHÔNG bị đòi; D3 bảng chưa có trong CSDL → `skipped BANG_CHUA_CO`, không xoá gì | ĐỎ (D1, D3) |
| E | E1 trang tiền có dòng → 400 trước mọi ghi; E2 kho có dữ liệu → bỏ kho; E3 pos_nang_cap không khôi phục; E4 không phải owner → 403 (restore + preview); E5 file sao lưu do code GỐC xuất (dựng trong bài bằng export của bản gốc = cùng định dạng) khôi phục 200; E6 `/export-all` và `/export/:table` sau vá: cùng danh sách trang + cùng hàng tiêu đề như bản gốc trên cùng kho (so với export của bản gốc chạy trong bài); E7 kết quả khôi phục giữ `success: true`, `status: 'restored'`, `rows`, `total` (màn Cài đặt đọc ở Settings.jsx:942–944) | XANH (hồi quy) |
| F | F1 kho tạm 1 có dữ liệu mẫu (cả ô trống, ô `''`, kho) → export-all → bỏ trang tiền + sổ nâng cấp → khôi phục vào kho tạm 2 MỚI → export-all → so từng ô mọi trang được khôi phục | ĐỎ |
| Đua | R1 hai owner cùng bấm khôi phục cùng file → mỗi lượt 200 hoặc 409 KHO_BAN; kết quả cuối = file (không nhân đôi, không lẫn) | — (xác nhận khi chạy) |

**Luồng hợp lệ phải KHÔNG bị chặn (K5):** file chỉ trang không dính tiền (P26b F3 — chạy lại bài cũ); file cũ thiếu cột mới có DEFAULT (E5);
kho có dữ liệu → phần còn lại vẫn khôi phục (KHO1 J3); thiếu bảng kho (KHO1 J6/J7 — mã `KHO_KHONG_DEM_DUOC` giữ); trang trống; trang lạ;
xem trước file tốt 200 (P26b F5).

**Hình dạng kết quả giữ nguyên (bài cũ + màn hình đọc):** Settings.jsx:942–944 (`status === 'restored'`, `rows`, `total`, `success`, `error`);
thu_KHO1.js:535–536, 550 (`status === 'skipped' && code`); thu_P26b.js:613 (`preview.length === 1`). Chỉ THÊM trường.
**Phát hiện (ngoài Phạm vi, không sửa):** màn Cài đặt chưa hiện `cot_bo_qua` / `code` bỏ qua — chủ quán chỉ thấy khi xem trước bằng mạng; cần
một việc client nhỏ sau.

**Đường song song (K4):** hai chỗ đọc trang (preview 308, restore 378) + `chanTrangTien` (131) → cùng `docTrang`; `/export/:table` và
`/info` dùng `bangDangCo` — không đổi; E8 (database.js) và quét nang_cap — một phép; đổi `''`→null ở 394 — bỏ.

**Đột biến** `viec/SAOLUU-2/dot_bien.py`: `VS-DONG-DAU` (cột lấy từ `sheet_to_json` không defval) · `VS-NUOT-LOI` (bắt lỗi chèn rồi đi tiếp) ·
`VS-NGOAI-GIAO-DICH` (xoá bằng `run` ngoài giao dịch) · `VS-RONG-THANH-NULL` · `BV-LOC-COT` (bỏ lọc PRAGMA) · `BV-DON-APP` (bỏ `pos_don_app`
khỏi BANG_KHONG_KHOI_PHUC) · `BV-XEM-TRUOC` (xem trước không gọi `lapKeHoach`). Mỗi cái có đối chứng (bản chưa đột biến xanh). Ca đua R1: phiếu không đòi, nhưng `/lam-viec` bước 3 đòi khi đụng dữ liệu nhạy — giữ, ~15 dòng.
Phương án B (một hàm đọc chung ngay trong backup.js) cũng đạt C — agent soát nêu; vẫn chọn A vì bài thử gọi thẳng hàm thuần không cần
dựng router, và LUAT §3 đặt quy tắc dùng ≥ 2 chỗ vào `utils/`.

## 3. File dự kiến đổi
`server/utils/khoiPhuc.js` (mới) · `server/routes/backup.js` · `cong_cu/thu_SAOLUU2.js` (mới, ~300) · `kiem_tra_truoc_khi_giao.js` (E8 + 1 dòng
chạy bài) · `viec/SAOLUU-2/*`. `thu_KHO1.js` / `thu_P26b.js` / `thu_P3.js` chỉ sửa nếu chạy lại đỏ vì đổi đã duyệt (LUAT §6 mục 8).
Ngân sách: ~140 dòng máy chủ ròng (+110 / −75 +30), ~300 dòng thử — trong ngân sách phiếu.

## 4. Chưa kiểm được (sẽ ghi lại ở báo cáo)
Turso thật: giao dịch tương tác qua HTTP giữ khoá ghi suốt lần khôi phục (cùng số lượt gọi như hiện tại, nhưng quầy ghi đơn trong lúc đó
sẽ chờ / nhận 409). Bài thử chạy trên kho file libsql, không đo được thời gian chờ trên Turso.
