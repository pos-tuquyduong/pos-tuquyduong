# SAOLUU-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (31.10.2026)
- Nhánh: viec/SAOLUU-2 · cây sạch · HEAD = e94c504 · FETCH_HEAD = e94c504 (bằng nhau, không kéo)
- git log --oneline -3:
  - e94c504 PHIEU: SAOLUU-2
  - 0b43549 TIEN-DO: KH-SP-1 (36db19b) xong; mo KH-QUAY-2, SAOLUU-2, them KHO-IN-1; quyet dinh 31.10 (...) — so v50
  - 36db19b Merge pull request #56 from pos-tuquyduong/viec/KH-SP-1

## Bước 3 — kế hoạch
- `ke_hoach.md` viết xong; agent phụ (chỉ đọc) soát 4 câu — đã đưa vào kế hoạch: ca E6/E7 (xuất như cũ, giữ hình dạng kết quả màn Cài đặt
  đọc), C4/C5, D2 (b)(c), cột thật `address` thay `dia_chi`, rủi ro `''` ở cột UNIQUE (lý giải trong kế hoạch phần 3).
- Phiếu dặn **Chờ duyệt kế hoạch** → DỪNG ở bước 3.

## Làm tiếp (tiep) — 31.10.2026
- Bước 1 lại: nhánh viec/SAOLUU-2 · cây sạch · HEAD = 99f2b14 · FETCH_HEAD = 99f2b14 (bằng nhau, không kéo). log -3: 99f2b14 SAOLUU-2: ke hoach…
  · e94c504 PHIEU: SAOLUU-2 · 0b43549 TIEN-DO: KH-SP-1…
- **Chủ quán duyệt 31.10:** duyệt kế hoạch · trang trống trong file → bỏ qua, KHÔNG xoá bảng (giữ như cũ) · khoá ghi trên Turso trong lúc khôi
  phục: chấp nhận, chủ quán chỉ khôi phục khi quán đã đóng cửa · màn Cài đặt hiện cột / trang bỏ qua: việc sau, ngoài phạm vi.
  → **Chat ghi vào `QUYET_DINH_CHU_QUAN.md`** (máy không sửa sổ đó — LUAT §2): "khôi phục sao lưu chỉ làm khi quán đã đóng cửa; trang trống
  trong file khôi phục → bỏ qua, không xoá bảng".

### Lệch so với kế hoạch (có lý do)
- **Khoá ngoại ĐANG BẬT** (kế hoạch mục 0 ghi sai "không cưỡng chế"): `PRAGMA foreign_keys` trên libsql ra `1` (đo bằng chạy), và
  `server/nang_cap/001_kho.js:6` đã ghi sẵn điều này. Hệ quả đã xử lý: xoá theo thứ tự CON trước, chèn CHA trước theo thứ tự `BACKUP_TABLES`
  (không theo thứ tự trang trong file) + lý do "còn dữ liệu khác trỏ tới (khoá ngoại)". Thêm ca B5 + đột biến VS-THU-TU-FILE.
- Phép chốt "đủ bảng" (D) đặt trong `cong_cu/thu_SAOLUU2.js` (hàm `bangThieu`, có ca tự bắt D2a/D2b) thay vì sửa E8 của bộ kiểm — bài chạy
  trong bộ kiểm (`chayBaiThat`), ít dòng hơn, và có ca đỏ tất định cho chính phép quét. E8 cũ giữ nguyên.
- Lỗi máy chủ khác / kho bận ở /restore dùng lại `loiGhi` (wallets.js: 409 KHO_BAN, 500 không lộ câu nội bộ) thay vì viết riêng.
- Thêm ca E8 (thiếu bảng kho → `KHO_KHONG_DEM_DUOC`): phần kho đã dời từ backup.js sang khoiPhuc.js nên 4 neo đột biến của KHO-1 rữa
  (xem Phát hiện) — chuyển hai phép tương ứng sang bộ đột biến của việc này.

### Bảng chỗ vá → đột biến (`viec/SAOLUU-2/dot_bien.py` — CUỐI, ở 8815e3c: `TỔNG 22 đột biến · BẮT 22`, `ĐỐI CHỨNG … XANH · 36 đạt · 0 hỏng`)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| khoiPhuc.js `docTrang` — ô trống = null | `VS-DONG-DAU` | A1 |
| khoiPhuc.js `thucHien` — `''` giữ `''` | `VS-RONG-THANH-NULL` | A4 |
| khoiPhuc.js `lapKeHoach` — lọc cột theo PRAGMA | `BV-LOC-COT` | A3 |
| khoiPhuc.js `thucHien` — lỗi chèn ném ra, không nuốt | `VS-NUOT-LOI` | B1 |
| khoiPhuc.js `thucHien` — xoá TRONG giao dịch | `VS-NGOAI-GIAO-DICH` | B1 |
| khoiPhuc.js `thucHien` — thứ tự cha/con theo BACKUP_TABLES | `VS-THU-TU-FILE` | B5 |
| khoiPhuc.js `lapKeHoach` — bảng chưa có → BANG_CHUA_CO | `BV-BANG-CHUA-CO` | C5 |
| backup.js /preview-restore — dùng chung kế hoạch | `BV-XEM-TRUOC` | C1 |
| backup.js BANG_KHONG_KHOI_PHUC — pos_don_app | `BV-DON-APP` | D1 |
| backup.js BACKUP_TABLES — pos_don_app | `BV-SAO-LUU-DON-APP` | D1 |
| khoiPhuc.js — kho_* chỉ khi kho trống (dời từ backup.js) | `BV-KHO-CO-DU-LIEU` | C2 |
| khoiPhuc.js — pos_nang_cap không bao giờ (dời) | `BV-NANG-CAP` | C4 |
| khoiPhuc.js — đếm kho lỗi không sập (dời) | `BV-KHO-TRONG-LOI` | E8 |
| khoiPhuc.js — lý do KHO_KHONG_DEM_DUOC (dời) | `VS-LY-DO-KHOI-PHUC` | E8 |
| khoiPhuc.js — trang trống bỏ qua, không xoá bảng | `VS-TRANG-TRONG-XOA` | E7 |
| khoiPhuc.js `laLoiDuLieu` — chỉ lỗi dữ liệu báo dòng hỏng (vòng sửa 1) | `VS-LOI-HA-TANG-THANH-DONG` | B7 |
| khoiPhuc.js — số dòng Excel thật `__rowNum__ + 1` (vòng sửa 1) | `VS-SO-DONG-THU-TU` | B6 |
| khoiPhuc.js `lyDo(err, dangXoa)` — câu khoá ngoại theo xoá / chèn (vòng sửa 2) | `VS-KHOA-NGOAI-MOT-CAU` | B9 |
| khoiPhuc.js `laLoiDuLieu` — nhận SQLITE_MISMATCH (vòng sửa 2) | `BV-MISMATCH` | B8 |
| khoiPhuc.js — lỗi ở câu xoá không có số dòng (vòng sửa 2) | `VS-DONG-CAU-XOA` | B10 |
| backup.js /preview-restore catch qua `loiGhi` (vòng sửa cuối) | `BV-LOI-GHI-XEM-TRUOC` | B11 |
| khoiPhuc.js — trang không cột khớp → KHONG_CO_COT_KHOP (vòng sửa cuối) | `BV-KHONG-CO-COT` | C6 |

Tên đột biến: VS-DONG-DAU · VS-RONG-THANH-NULL · BV-LOC-COT · VS-NUOT-LOI · VS-NGOAI-GIAO-DICH · VS-THU-TU-FILE · BV-BANG-CHUA-CO ·
BV-XEM-TRUOC · BV-DON-APP · BV-SAO-LUU-DON-APP · BV-KHO-CO-DU-LIEU · BV-NANG-CAP · BV-KHO-TRONG-LOI · VS-LY-DO-KHOI-PHUC · VS-TRANG-TRONG-XOA ·
VS-LOI-HA-TANG-THANH-DONG · VS-SO-DONG-THU-TU · VS-KHOA-NGOAI-MOT-CAU · BV-MISMATCH · VS-DONG-CAU-XOA · BV-LOI-GHI-XEM-TRUOC · BV-KHONG-CO-COT

### Kiểm (bước 6)
- `node cong_cu/thu_SAOLUU2.js` → 30 đạt · 0 hỏng (sau vòng sửa 1). Gốc e94c504 → 12 đạt · 18 hỏng (`bang_chung_do.txt`).
- Bài cũ chạy lại sau vá: thu_KHO1 111/0 · thu_P26b 103/0 · thu_P3 100/0 — không phải sửa bài cũ nào.
- `npm test` → PASS 84 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có từ trước: GET có lệnh ghi ở packages.js / products.js / sync.js).
- Không đụng client/src → không cần build. `node kiem_tra_truoc_khi_giao.js --day-du` (sau vòng sửa 2, d819beb) → PASS 88 · FAIL 0 ·
  CẢNH BÁO 1 (cảnh báo cũ). `npm test` → PASS 84 · FAIL 0 · CẢNH BÁO 1.
- Sau vòng sửa 2: `node cong_cu/thu_SAOLUU2.js` → 34 đạt · 0 hỏng; gốc e94c504 → 13 đạt · 21 hỏng; `dot_bien.py` → đối chứng 33/0 lúc chạy (trước
  D2d), 20/20 BẮT. (Số dòng ghi ở đây lúc đó sai — "320" — soát vòng 3 bắt; số CUỐI đo bằng lệnh ở mục Vòng sửa cuối.)
- Số dòng (ĐO LẠI sau vòng sửa 1, `wc -l` ở 1a4bdea): server/utils/khoiPhuc.js 75 dòng mới; backup.js +22 / −95 (ròng −73) → máy chủ ròng
  ≈ +2; bài thử 306 dòng — trong ngân sách (~150 máy chủ + ~300 thử). (Lần ghi trước "81" / "≈ 250" là SAI — soát độc lập bắt, K1.)

## Soát độc lập — vòng 1 (agent general-purpose, /ra-soat) — NGUYÊN báo cáo
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
- server/utils/khoiPhuc.js:55-57 — Mọi lỗi không phải "kho bận" đều bị coi là lỗi dữ liệu của một dòng. Ví dụ: Turso hết giờ giao dịch
  (TRANSACTION_TIMEOUT — database.js:1550 có nêu mã này), mất mạng (fetch failed), hoặc BEGIN hỏng. Khi đó lyDo() (dòng 18) rơi về câu mặc
  định 'dữ liệu không hợp lệ', và backup.js:337-340 trả 400 KHOI_PHUC_DONG_HONG "Trang X dòng N: dữ liệu không hợp lệ". Chủ quán sẽ đi sửa
  một dòng Excel không có lỗi gì. Dữ liệu vẫn được giữ nguyên nhờ rollback, nhưng lời báo sai. Lỗi ở câu DELETE còn báo "Trang X: dữ liệu
  không hợp lệ" với dong = null. Cách sửa gọn: chỉ gắn loiDong khi err.code bắt đầu bằng SQLITE_CONSTRAINT / SQLITE_MISMATCH hoặc khi LY_DO
  khớp; còn lại ném nguyên lỗi → loiGhi → 500 LOI_MAY_CHU. Hiện chưa có ca thử nào cho lỗi không phải dữ liệu. — K1 + K3.
- viec/SAOLUU-2/trang_thai.md, mục "Kiểm (bước 6)", dòng "Số dòng" — Ghi "khoiPhuc.js 81 dòng mới". Thực tế wc -l ra 73. Ghi "bài thử
  ≈ 250", thực tế 291. — K1.
- viec/SAOLUU-2/trang_thai.md — Chưa có mục CHƯA KIỂM, dù ke_hoach.md:101-103 đã hứa ghi lại (Turso thật). ke_hoach.md:65 cũng hứa ghi
  CHƯA KIỂM cho cột don_id: grep don_id trong database.js và nang_cap/ ra rỗng, nên nghiệm thu A về don_id chưa phủ được. — Thiếu mục bắt buộc.
- server/utils/khoiPhuc.js:64 — Số dòng Excel tính bằng i + 2, nên lệch khi giữa trang có dòng trống: sheet_to_json bỏ dòng trống. Đã đo
  bằng chạy: xoá dòng giữa thì dòng sau có __rowNum__ = 3 (dòng Excel 4), nhưng code báo dòng 3. Sửa gọn: d.__rowNum__ + 1. — Nhẹ, K1.
NGHI NGỜ:
- Turso: cả lần khôi phục chạy trong MỘT giao dịch tương tác, mỗi dòng một lượt gọi HTTP (khoiPhuc.js:61-65). Nếu Turso / sqld có hạn giờ
  cho giao dịch tương tác (khoảng 5 giây, CHƯA kiểm được), thì khôi phục vài trăm khách sẽ luôn hỏng trên production. Cần thử trên Turso
  thật trước khai trương.
- Khoá ngoại: có cách đơn giản hơn: PRAGMA defer_foreign_keys = ON trong giao dịch (khoá ngoại kiểm lúc commit), bỏ được phần sắp xếp
  cha/con. Chưa thử PRAGMA này trong giao dịch tương tác Turso.
- Phép chốt "đủ bảng" (thu_SAOLUU2.js:89-95) có ba chỗ hở: (a) chỉ bắt CREATE TABLE IF NOT EXISTS; (b) readdirSync không đệ quy, phiếu ghi
  server/nang_cap/**; (c) không canh bảng tiền mới vào BACKUP_TABLES mà quên BANG_KHONG_KHOI_PHUC. Ghi để xét KHOÁ.
- khoiPhuc.js:23 đo "kho trống" ngoài giao dịch rồi xoá kho trong giao dịch. Có từ trước; chủ quán đã chốt chỉ khôi phục khi đóng cửa.
NGHIỆM THU: 6/6 mục có bằng chứng (A: A1–A4 + F1, don_id phải ghi CHƯA KIỂM · B: B1, B2, B4, B5 + B3 · C: C1–C5 · D: D1, D2a–c ·
  E: E1–E8 (E5 dùng file tự dựng) · F: F1). Mục thiếu: không.
CHƯA SOÁT ĐƯỢC: hành vi trên Turso thật (hạn giờ giao dịch, PRAGMA, thời gian giữ khoá); file .xlsx sau khi mở / lưu lại bằng Excel thật;
  bộ đột biến KHO-1 (đã ghi Phát hiện).
BÀI HỌC:
- KHOÁ: ca "lỗi không phải dữ liệu" phải ra 500 LOI_MAY_CHU, không 400 KHOI_PHUC_DONG_HONG; kèm đột biến đưa lỗi phân loại cũ trở lại.
- KHOÁ: phép chốt đủ bảng bắt cả CREATE TABLE không IF NOT EXISTS, quét đệ quy nang_cap/, đòi mọi bảng tiền có trong BANG_KHONG_KHOI_PHUC.
- NGUYÊN TẮC (K1/K4): gom lỗi thành "lý do cho người dùng" → một vị từ tách lỗi DỮ LIỆU khỏi lỗi HẠ TẦNG; câu mặc định không gán cho mọi lỗi lạ.
- NGUYÊN TẮC (K1): số dòng / số lượng trong trang_thai.md đo lại ở commit cuối (wc -l).
- NGUYÊN TẮC: đổi đường ghi sang "một giao dịch tương tác cho cả lô" trên Turso → ca đo hoặc CHƯA KIỂM về hạn giờ giao dịch.
```
(Báo cáo dài hơn ở bản gốc — phần "ĐÃ RÀ TỪNG MỤC" lược: K3 đỏ trên gốc 16 hỏng, 15/15 đột biến BẮT; K4 mọi chỗ đọc trang qua docTrang;
K5 mọi luồng hợp lệ có ca; đường tiền chanTrangTien chạy trước ở cả hai route; P1 không đụng client.)

### Vòng sửa 1 — chỉ đúng các lỗi lần soát nêu
| Lỗi soát nêu | Sửa | Ca thử (đỏ trên bản vá trước vòng sửa 3479327) | Đột biến |
|---|---|---|---|
| lỗi hạ tầng báo nhầm "dòng N hỏng" | khoiPhuc.js `laLoiDuLieu`: chỉ `SQLITE_CONSTRAINT*` / `SQLITE_MISMATCH` thành loiDong; còn lại ném nguyên → `loiGhi` (500 LOI_MAY_CHU / 409 KHO_BAN) | B7 (trigger đọc bảng không có → SQLITE_ERROR) | VS-LOI-HA-TANG-THANH-DONG |
| số dòng lệch khi có dòng trống | `d.__rowNum__ + 1` | B6 (dòng trống giữa trang → báo dòng Excel 5) | VS-SO-DONG-THU-TU |
| số liệu sai trong trang_thai.md | đo lại `wc -l` (mục Kiểm) | — | — |
| thiếu CHƯA KIỂM (Turso, don_id) | thêm mục CHƯA KIỂM bên dưới | — | — |

Nghi ngờ của người soát — xử lý: (1) hạn giờ giao dịch Turso → CHƯA KIỂM (máy không có Turso); (2) `defer_foreign_keys` → KHÔNG đổi: sắp
xếp cha/con đã có ca B5 + đột biến, và PRAGMA trong giao dịch tương tác Turso chưa thử được — đổi sang cách chưa đo là rủi ro hơn; (3) phép
chốt đủ bảng hở (a)(b)(c) → đề xuất KHOÁ ở Bài học (phiếu chỉ đòi mức BACKUP_TABLES; hôm nay không có bảng nào lọt); (4) đo kho trống ngoài
giao dịch → có từ trước, chủ quán chốt khôi phục khi đóng cửa.

## Soát độc lập — vòng 2 (agent general-purpose) — báo cáo (giữ nguyên ý, lược phần đã rà)
```
KHÔNG ĐẠT — mọi lỗi còn lại NHẸ (không tiền / điểm / ví, không lộ dữ liệu, không ngoài Phạm vi, không file Cấm).
ĐÃ CHẠY: thu_SAOLUU2 30/0 · dot_bien 17/17 BẮT · gốc e94c504 12/18 · 3479327 28/2 (B6, B7) · npm test PASS 84 · bài cũ KHO1 111/0, P26b 103/0,
  P3 100/0 · node tu_chay/cong.js chay . e94c504^ HEAD viec/SAOLUU-2: CỔNG CHẠY ĐẠT · origin..HEAD rỗng.
LỖI TÌM ĐƯỢC:
1. server/utils/khoiPhuc.js:16 — câu khoá ngoại "còn dữ liệu khác trỏ tới" chỉ đúng khi XOÁ cha; CHÈN dòng con trỏ tới cha không có phải là
   "trỏ tới dữ liệu không có". Đã đo: libsql ra SQLITE_CONSTRAINT_FOREIGNKEY cả hai chiều. (K1)
2. cong_cu/thu_SAOLUU2.js — ba nhánh của đường báo lỗi chưa có ca: (a) SQLITE_MISMATCH / "sai kiểu dữ liệu"; (b) câu khoá ngoại; (c) lỗi ở câu
   DELETE (dong = null, nhánh ${dong ? … : ''} backup.js:340). Gỡ MISMATCH hoặc đổi câu thì bài vẫn xanh. (K3)
3. trang_thai.md CHƯA KIỂM thiếu: laLoiDuLieu tách theo err.code chỉ đo trên kho file; trên Turso mã đi qua hrana (hrana.js:292-295) — nếu khác
   thì mọi dòng hỏng ra 500 thay vì "trang · dòng · lý do" (dữ liệu vẫn an toàn). (K1)
4. server/nang_cap/001_kho.js:6 — chú thích "khôi phục Excel … → 500 giữa chừng" nay đã sai; ngoài Phạm vi + Cấm → phải ghi Phát hiện. (K1/K4)
5. trang_thai.md:58-62 — chưa ghi --day-du và node tu_chay/cong.js chay (LUAT §6.3); "không cần --day-du" trái luật.
NGHI NGỜ: Turso cắt giao dịch kéo dài → khôi phục bảng lớn luôn 500 (đã ghi CHƯA KIỂM; đề nghị thử Turso thật TRƯỚC khi Merge; dự phòng
  db.batch); backup.js:346-348 catch ngoài /restore còn trả err.message không code; trang tiền chỉ chặn ở chỗ gọi (chanTrangTien), không trong
  thucHien; phép chốt đủ bảng không bỏ chú thích khi quét BACKUP_TABLES, readdirSync không đệ quy; pos_doi_soat_ghi (sổ két) không trong
  BANG_KHONG_KHOI_PHUC — có từ trước, nêu để chủ quán xét.
ĐƠN GIẢN: một luật hai phép (E8 kiem_tra:388-398 quét database.js; D2c quét database.js + nang_cap/); khoiPhuc.js tự viết begin/commit/rollback
  trong khi trongGiaoDich (wallets.js:127) có sẵn, giuCho.js:10 đã dùng từ utils.
NGHIỆM THU: 6/6 có bằng chứng · thiếu: không (riêng ba nhánh lý do ở lỗi 2 chưa phủ).
CHƯA SOÁT ĐƯỢC: Turso thật (hạn giờ, mã lỗi qua hrana, khoá ghi); file .xlsx lưu lại bằng Excel / Google Sheets; ô > 32.767 ký tự (qr_code
  base64) khi xuất — có từ trước; chưa chạy riêng --day-du (cổng A13 đã chạy, ĐẠT).
BÀI HỌC: KHOÁ — mỗi nhánh LY_DO một ca + đột biến, có ca lỗi ở câu DELETE · KHOÁ — phép chốt đủ bảng bỏ chú thích + quét đệ quy, gộp E8/D2c ·
  NGUYÊN TẮC (K1) — câu báo theo mã lỗi đúng nghĩa ở MỌI loại câu lệnh sinh ra mã đó · NGUYÊN TẮC (K1/K4) — phân loại theo err.code chỉ đo trên
  kho file → CHƯA KIỂM Turso · NGUYÊN TẮC (K4 TU-CHAY-6) — đổi hành vi mà chú thích ở file ngoài Phạm vi mô tả → grep + ghi Phát hiện.
```

### Vòng sửa 2 — chỉ đúng các lỗi lần soát nêu
| Lỗi soát nêu | Sửa | Ca thử | Đột biến |
|---|---|---|---|
| 1 câu khoá ngoại sai nghĩa khi chèn | khoiPhuc.js `lyDo(err, dangXoa)`: xoá → "còn dữ liệu ở bảng khác trỏ tới bảng này"; chèn → "trỏ tới dữ liệu không có" | B9 (đỏ trên 11dfaef), B10 | VS-KHOA-NGOAI-MOT-CAU |
| 2a nhánh SQLITE_MISMATCH chưa có ca | — (code đúng) | B8 (ca phủ, xanh trên 11dfaef) | BV-MISMATCH |
| 2c lỗi ở câu DELETE chưa có ca | — | B10 (đỏ trên 11dfaef: câu sai) — 400, `dong` null, lời báo không có "dòng" | VS-DONG-CAU-XOA |
| 3 CHƯA KIỂM mã lỗi Turso | thêm vào CHƯA KIỂM | — | — |
| 4 chú thích 001_kho.js:6 đã sai | ghi Phát hiện (file Cấm) | — | — |
| 5 chưa ghi --day-du + cổng | chạy + ghi ở mục Kiểm | — | — |
| ĐƠN GIẢN: tự viết begin/commit/rollback | dùng lại `trongGiaoDich` (wallets.js:126) như giuCho.js | B1, B2, B4 (không đổi gì) | VS-NUOT-LOI, VS-NGOAI-GIAO-DICH |
| NGHI NGỜ: catch ngoài /restore lộ err.message | `loiGhi(res, err)` (500 LOI_MAY_CHU có code) | B7 đi qua nhánh trong; nhánh ngoài cùng hàm | — |
| BÀI HỌC KHOÁ (file trong Phạm vi): phép chốt đủ bảng | `bangThieu` bỏ dòng chú thích; quét `nang_cap/` đệ quy | D2d (bảng chỉ còn ở dòng `//` → báo thiếu) | — |
Không làm (có lý do): gộp E8 với D2c — E8 nằm trong bộ kiểm cũ (quét database.js), D2c rộng hơn; gộp = sửa phép kiểm có sẵn, để chat xét
(đề xuất ở Bài học). `pos_doi_soat_ghi` vào BANG_KHONG_KHOI_PHUC — quyết định nghiệp vụ, ngoài phiếu → Phát hiện. Trang tiền khoá trong
`thucHien` — phiếu giữ luật ở chỗ gọi (chanTrangTien một vị từ cho cả hai route, P26d Q7d), có ca E1/C3 → không đổi.

## Soát độc lập — vòng 3 (agent general-purpose, lần soát cuối) — báo cáo (giữ nguyên ý)
```
KHÔNG ĐẠT — mọi lỗi còn lại đều NHẸ (không tiền · điểm · ví, không lộ dữ liệu khách, không ngoài Phạm vi, không file Cấm)
ĐÃ CHẠY (HEAD a818056): thu_SAOLUU2 34/0 · gốc e94c504 13/21 · dot_bien ĐỐI CHỨNG 34/0, 20/20 BẮT · npm test PASS 84 · --day-du PASS 88 ·
  node tu_chay/cong.js chay . e94c504^ HEAD viec/SAOLUU-2 → CỔNG CHẠY ĐẠT · thu_KHO1 111/0 · thu_P26b 103/0
LỖI TÌM ĐƯỢC:
1. server/routes/backup.js:308-309 — catch /preview-restore còn trả err.message (không code, lộ câu SQLite); vòng sửa 2 đổi /restore mà sót
   route song song, thân route đã viết lại trong việc này. — K4 — NHẸ.
2. server/utils/khoiPhuc.js:50-51 + 68 — trang không có cột nào khớp bảng → cot = [] → INSERT () VALUES () lỗi cú pháp → 500 LOI_MAY_CHU (lời
   báo sai cho lỗi của FILE; xem trước lại báo se_khoi_phuc). Sửa: !cot.length → boQua('KHONG_CO_COT_KHOP'). — K1/K5 — NHẸ.
3. trang_thai.md:68 — "thu_SAOLUU2.js 320", đo thật 321. — K1 — NHẸ.
4. trang_thai.md:33 — "đối chứng 33 đạt — sau vòng sửa 2", chạy lại 34/0. — K1/K4 — NHẸ.
NGHI NGỜ: Turso cắt giao dịch dài (đã CHƯA KIỂM — đề nghị thử Turso thật TRƯỚC khi Merge); dò BACKUP_TABLES bằng chuỗi — chú thích CUỐI dòng
  có name: 'x' hoặc `];` có thể làm xanh / đỏ oan (chưa có chỗ nào như vậy); file Excel có !ref rộng → cột __EMPTY trong cot_bo_qua (hiển
  thị); /restore gặp file hỏng → 500 "Lỗi máy chủ" (ít gặp, màn hình gọi xem trước trước); khoiPhuc.js lấy trongGiaoDich từ routes/wallets
  (cùng khuôn giuCho.js).
NGHIỆM THU: 6/6 có bằng chứng · thiếu: không.
CHƯA SOÁT ĐƯỢC: Turso thật (hạn giờ, mã lỗi qua hrana, khoá ghi); file lưu lại bằng Excel / Google Sheets; 4 neo rữa của KHO-1.
BÀI HỌC: KHOÁ — ca "trang không cột khớp" + đột biến · KHOÁ — phép tĩnh: route trong diff có res.status(5xx).json({ error: err.message }) thì
  đỏ · NGUYÊN TẮC (K4) — sửa catch / mã lỗi ở một route → grep route song song cùng file · NGUYÊN TẮC (K1) — số liệu trang_thai.md lấy bằng
  lệnh dán kèm, chạy lại bằng chứng → grep cả file tìm số cũ.
```

### Vòng sửa cuối (LUAT §6.5 — hết 3 vòng soát, lần soát cuối chỉ còn lỗi NHẸ → làm luôn, không gọi agent soát nữa)
| Lỗi soát nêu | Sửa | Ca thử (đỏ trên a549173 — bản trước vòng sửa cuối) | Đột biến |
|---|---|---|---|
| 1 catch /preview-restore lộ err.message | `loiGhi(res, err)` như /restore | B11 (tĩnh: từ `'/preview-restore'` tới hết không còn `err.message`, có ≥ 2 `loiGhi(res, err)`) | BV-LOI-GHI-XEM-TRUOC |
| 2 trang không cột khớp → 500 | `lapKeHoach`: `!cot.length` → skipped `KHONG_CO_COT_KHOP` (xem trước = khôi phục) | C6 (xem trước + khôi phục skipped, 200, băm mọi bảng không đổi) | BV-KHONG-CO-COT |
| 3, 4 số liệu chép tay sai | số đo bằng lệnh, dán nguyên dưới đây; câu cũ ghi rõ là sai | — | — |

Số liệu CUỐI — đo bằng lệnh ở 8815e3c:
- `git show HEAD:server/utils/khoiPhuc.js | wc -l` → 75 · `git show HEAD:cong_cu/thu_SAOLUU2.js | wc -l` → 332
- `git diff --numstat e94c504 HEAD -- …` → `332 0 cong_cu/thu_SAOLUU2.js` · `1 0 kiem_tra_truoc_khi_giao.js` · `24 98 server/routes/backup.js` ·
  `75 0 server/utils/khoiPhuc.js` → máy chủ +99 / −98 (ngân sách ~150), bài thử 332 (ngân sách ~300 — vượt 32 dòng vì 3 vòng soát thêm ca
  B6–B11, C6, D2d; mỗi ca do soát độc lập đòi).
- `node cong_cu/thu_SAOLUU2.js` (qua đối chứng dot_bien) → 36 đạt · 0 hỏng · gốc e94c504 → 13 đạt · 23 hỏng, thoát 1.
- `python3 viec/SAOLUU-2/dot_bien.py` → `ĐỐI CHỨNG (bản chưa đột biến): XANH · 36 đạt · 0 hỏng` · `TỔNG 22 đột biến · BẮT 22 · SỐNG 0 · HỎNG 0 · LẠC 0`
- `npm test` → `PASS 84 · FAIL 0 · CẢNH BÁO 1` · `node kiem_tra_truoc_khi_giao.js --day-du` → `PASS 88 · FAIL 0 · CẢNH BÁO 1` (cảnh báo cũ: GET có
  lệnh ghi ở packages.js / products.js / sync.js).

SOÁT LẦN CUỐI: chat soát thay

## CHƯA KIỂM
- **Mã lỗi trên Turso:** `laLoiDuLieu` (khoiPhuc.js) nhận lỗi dữ liệu theo `err.code` `SQLITE_CONSTRAINT*` / `SQLITE_MISMATCH` — chỉ đo trên kho
  file libsql. Trên Turso mã đi qua giao thức hrana; nếu khác, dòng hỏng sẽ ra 500 "Lỗi máy chủ" thay vì "trang · dòng · lý do" — dữ liệu
  vẫn KHÔNG đổi (rollback), chỉ mất lời báo chi tiết. Thử cùng lúc với mục hạn giờ dưới đây.
- **Turso thật — hạn giờ giao dịch tương tác:** cả lần khôi phục là MỘT giao dịch, mỗi dòng một lượt gọi HTTP. Nếu Turso cắt giao dịch kéo dài
  (người soát nhớ ~5 giây, CHƯA xác minh), khôi phục bảng lớn (vài trăm khách, cột qr_code nặng) có thể hỏng trên production — sau vòng sửa 1
  lỗi đó ra 500 LOI_MAY_CHU và KHÔNG đổi dữ liệu (rollback), nhưng khôi phục không làm được. **Cần chủ quán / chat thử một lần trên Turso thật
  (bản sao dữ liệu, ngoài giờ bán) trước khai trương** — đây là đường cứu khi mất máy. Bài thử chỉ chạy trên kho file libsql.
- Khoá ghi trên Turso trong lúc khôi phục: chủ quán đã chấp nhận (chỉ khôi phục khi đóng cửa).
- Cột `don_id` (phiếu nghiệm thu A): grep `don_id` trong server/database.js + server/nang_cap/ ra rỗng ở nền này → không có bảng nào để thử.
  Cột trống dòng đầu được phủ chung bằng A1, A2, F1 (cùng một đường đọc `docTrang`).
- File .xlsx đã mở và lưu lại bằng Excel / Google Sheets thật (ô `''` có thể bị bỏ, kiểu ô số có thể đổi) — bài thử chỉ dùng file do thư viện xlsx dựng.
- Bộ đột biến KHO-1 có 4 neo rữa — không chạy lại (ngoài Phạm vi, xem Phát hiện).

## Câu hỏi
(không còn — câu trang trống đã được chủ quán trả lời 31.10)

## Phát hiện
- Màn Cài đặt (client/src/pages/Settings.jsx:942–944) chỉ hiện `rows/total` của trang đã khôi phục — chưa hiện cột bị bỏ qua / lý do bỏ qua
  trang. Ngoài Phạm vi; chủ quán đã xếp việc sau.
- **Neo đột biến KHO-1 rữa:** `viec/KHO-1/dot_bien.py` có 4 đột biến neo vào đoạn khôi phục cũ của backup.js (BV-KHOI-PHUC-KHO,
  BV-KHOI-PHUC-NANG-CAP, BV-KHO-TRONG-LOI, VS-LY-DO-KHOI-PHUC) — nay khớp 0 lần (HỎNG nếu chạy lại bộ KHO-1). Ngoài Phạm vi. Phép tương ứng đã
  có trong bộ đột biến SAOLUU-2 (BV-KHO-CO-DU-LIEU, BV-NANG-CAP, BV-KHO-TRONG-LOI, VS-LY-DO-KHOI-PHUC). Đề xuất: gỡ 4 dòng đó khỏi bộ KHO-1
  (hoặc ghi chú "dời sang SAOLUU-2") ở việc sau.
- **Khôi phục "Khuyến mãi" / "Danh mục gói" trên CSDL đang chạy** sẽ bị từ chối (400, lý do khoá ngoại) khi bảng tiền (không khôi phục bằng
  file) còn trỏ tới: `pos_orders.promotion_id` → pos_promotions (database.js:230), `pos_customer_packages.package_id` → pos_packages
  (database.js:887). Code gốc gặp cùng chỗ này thì 500 giữa chừng (đã xoá vài bảng). Nay: không đổi gì + nói rõ. Khôi phục vào CSDL TRỐNG
  (máy mới) không bị — đúng ca cứu máy của phiếu.
- **Chú thích đã sai ở file Cấm:** `server/nang_cap/001_kho.js:6` ghi "khôi phục Excel xoá cả bảng pos_products / bảng cha → 500 giữa chừng".
  Sau việc này khôi phục ra 400 KHOI_PHUC_DONG_HONG và không đổi gì. File bước nâng cấp — Cấm sửa; đề xuất sửa chú thích ở việc sau.
- **Sổ két / sao kê `pos_doi_soat_ghi`** (backup.js BACKUP_TABLES "Sổ đối soát (két, sao kê)") KHÔNG nằm trong BANG_KHONG_KHOI_PHUC → khôi phục
  file xoá rồi ghi lại sổ này (ngược "sổ chỉ thêm", CLAUDE.md §5.4). Có từ trước, ngoài phiếu — chủ quán xét có đưa vào danh sách chặn không.
- **Một luật hai phép:** E8 (kiem_tra_truoc_khi_giao.js, quét database.js) và D2c (thu_SAOLUU2.js `bangThieu`, quét database.js + nang_cap/**).
  Đề xuất việc sau: bỏ E8 hoặc cho E8 dùng chung `bangThieu`.

## Báo cáo 7 mục
```
VIỆC:        SAOLUU-2 — Khôi phục sao lưu an toàn: không mất cột · không mất dòng âm thầm · tất cả hoặc không · bảng mới không lọt sao lưu
ĐÃ SỬA:      server/utils/khoiPhuc.js (mới, 75 dòng) — docTrang (ô trống = null, '' giữ ''); lapKeHoach (MỘT vị từ cho xem trước + khôi phục:
               kho_* chỉ khi kho trống, pos_nang_cap không bao giờ, BANG_CHUA_CO, TRANG_TRONG, KHONG_CO_COT_KHOP, cột ∩ PRAGMA, cot_bo_qua);
               thucHien (MỘT giao dịch qua trongGiaoDich: xoá con trước, chèn cha trước theo BACKUP_TABLES; chỉ lỗi dữ liệu SQLITE_CONSTRAINT* /
               SQLITE_MISMATCH thành loiDong {bang, trang, dong = dòng Excel thật, ly_do}; câu khoá ngoại theo xoá / chèn)
             server/routes/backup.js — pos_don_app vào BACKUP_TABLES + BANG_KHONG_KHOI_PHUC; chanTrangTien đọc qua docTrang; /preview-restore và
               /restore dùng lapKeHoach / thucHien; dòng hỏng → 400 KHOI_PHUC_DONG_HONG; lỗi khác → loiGhi (409 KHO_BAN / 500 LOI_MAY_CHU) ở cả hai
               route; kết quả giữ success / status 'restored' / rows / total (màn Cài đặt) + cot_bo_qua, code
             kiem_tra_truoc_khi_giao.js — một dòng chayBaiThat('cong_cu/thu_SAOLUU2.js')
BÀI THỬ:     cong_cu/thu_SAOLUU2.js 36 ca. Trên code gốc e94c504 → 13 đạt · 23 hỏng, thoát 1 (bang_chung_do.txt); mỗi vòng sửa có ca đỏ trên bản
               trước vòng đó (B6/B7 · B9/B10 · B11/C6). Sau vá → 36 đạt · 0 hỏng. dot_bien.py 22/22 BẮT, đối chứng 36/0.
               Bài cũ không sửa: thu_KHO1 111/0 · thu_P26b 103/0 · thu_P3 100/0 (chạy trong npm test).
ĐÃ RÀ K4:    grep "sheet_to_json" server/ → 1 chỗ (docTrang) — chanTrangTien, xem trước, khôi phục đều qua nó · grep "DELETE FROM \${" khoiPhuc.js
               → 1 chỗ, trong giao dịch · grep "err.message" backup.js → còn 3 chỗ ở route XUẤT (201, 245, 277) việc này không chạm; 2 route
               khôi phục đã qua loiGhi · grep "CREATE TABLE IF NOT EXISTS" database.js + nang_cap/** → 47 bảng, đủ trong BACKUP_TABLES (D2c) ·
               neo đột biến KHO-1 vào backup.js → 4 rữa (Phát hiện)
CHƯA KIỂM:   Turso thật: hạn giờ giao dịch tương tác (một giao dịch cho cả lần khôi phục, mỗi dòng một lượt HTTP) và mã lỗi ràng buộc qua hrana —
               bài chỉ chạy trên kho file libsql; hỏng thì 500 và KHÔNG đổi dữ liệu, nhưng khôi phục không làm được → cần thử một lần trên Turso
               thật (bản sao, ngoài giờ) TRƯỚC khi Merge. File .xlsx đã mở / lưu lại bằng Excel hoặc Google Sheets. Cột don_id: không bảng nào có
               ở nền này. Bộ đột biến KHO-1 không chạy lại (4 neo rữa).
GIT:         (xem dòng git log --oneline -2 ở mục Cổng bên dưới)
BÀI HỌC:     KHOÁ 4 · NGUYÊN TẮC 3 · BỎ 2 — chi tiết ở ## Bài học
```

## Nghiệm thu — đếm từng mục
- A Không mất cột → A1, A2 (dòng đầu trống ba cột, hai bảng), A3 (cột lạ → cot_bo_qua), A4 ('' giữ ''), F1; don_id: CHƯA KIỂM (không có bảng).
- B Không mất dòng âm thầm → B1 (CHECK, hai trang, băm MỌI bảng trước = sau), B2 (UNIQUE), B4 (NOT NULL), B5 (con trước cha), B6 (dòng trống
  giữa trang → đúng dòng Excel), B7 (lỗi hạ tầng → 500 không báo dòng), B8 (sai kiểu), B9 (chèn con trỏ tới cha không có), B10 (xoá cha bị
  trỏ — không số dòng), B3 (không console.error).
- C Xem trước khớp khôi phục → C1 (cot_bo_qua), C2 (KHO_CO_DU_LIEU), C4 (NANG_CAP_KHONG_KHOI_PHUC), C5 (BANG_CHUA_CO), C6 (KHONG_CO_COT_KHOP),
  C3 (trang tiền 400).
- D Đủ bảng → D1 (pos_don_app hai danh sách), D2a/D2b/D2d (phép chốt tự bắt: bỏ bảng, bảng mới ở nang_cap, bảng chỉ còn ở chú thích), D2c
  (47 bảng thật đủ); chạy trong bộ kiểm (kiem_tra_truoc_khi_giao.js chayBaiThat).
- E Giữ luật cũ → E1 (trang tiền 400 trước mọi ghi), E2/E3 (kho_*, pos_nang_cap), E4 (403 cả hai route), E5 (file thiếu cột mới), E6 (xuất như
  cũ), E7 (hình dạng kết quả màn Cài đặt; trang trống / trang lạ bỏ qua), E8 (thiếu bảng kho → KHO_KHONG_DEM_DUOC); R1 hai owner cùng bấm.
- F Vòng tròn → F1 (sao lưu → khôi phục vào CSDL trống → sao lưu lại: 10 trang giống từng ô).
6/6 mục có bằng chứng.

## Bài học
Sự cố gom được: (1) kế hoạch khẳng định "khoá ngoại không cưỡng chế" từ một grep rỗng — sai, libsql bật sẵn (đo PRAGMA ra 1; 001_kho.js:6 đã ghi);
(2) soát vòng 1–3 bắt: lỗi hạ tầng báo thành "dòng hỏng"; số dòng Excel lệch khi có dòng trống; câu khoá ngoại sai nghĩa khi chèn; ba nhánh
lý do không có ca; catch xem trước sót sau khi sửa catch khôi phục; trang không cột khớp → 500; số liệu trang_thai chép tay sai hai lần;
(3) người gác chặn 6 lệnh: B-TENCHU (`$?` trong echo), B-DICHCHU (đích ghi qua biến), B-PHANTICH ×2 (heredoc python ghi file + chạy node cùng
lệnh), GIT-LENH (`git stash list`), G0-NGOAI (`cp /dev/null`); (4) một ca tự so với chính nó (D2e) viết ra rồi bỏ trước commit; (5) bài thử
vượt ngân sách 32 dòng do ca thêm theo soát.

- **KHOÁ (đã làm, trong Phạm vi):** (a) mỗi nhánh lý do có ca + đột biến (B6–B10, VS-KHOA-NGOAI-MOT-CAU, BV-MISMATCH, VS-DONG-CAU-XOA); (b) phép
  chốt đủ bảng bỏ dòng chú thích + quét nang_cap/ đệ quy (D2d); (c) trang không cột khớp → C6 + BV-KHONG-CO-COT; (d) hai route khôi phục không
  trả err.message → B11 + BV-LOI-GHI-XEM-TRUOC.
  **Đề xuất KHOÁ ngoài việc này (chat duyệt):** phép tĩnh trong `kiem_tra_truoc_khi_giao.js`: route nào trong diff của nhánh có
  `res.status(5xx).json({ error: err.message })` thì đỏ (ca đỏ: backup.js e94c504 /preview-restore); gộp E8 với `bangThieu` của
  thu_SAOLUU2.js (một luật một phép); gỡ / ghi chú 4 neo rữa trong `viec/KHO-1/dot_bien.py`.
- **NGUYÊN TẮC (đề xuất cho `KHUON_LOI.md` — ngoài Phạm vi, máy không sửa):**
  1. K1 — Chặn: cấu hình CHẠY (PRAGMA foreign_keys, chế độ giao dịch, mã lỗi trả về) phải ĐO bằng chạy, không suy từ grep rỗng. Đã gây:
     SAOLUU-2 kế hoạch ghi "khoá ngoại không cưỡng chế" vì grep PRAGMA rỗng — libsql bật sẵn, 001_kho.js:6 ghi ngược lại.
  2. K4 — Chặn: gom lỗi thành "lý do cho người dùng" → một vị từ tách lỗi DỮ LIỆU khỏi lỗi HẠ TẦNG; mỗi câu lý do đúng nghĩa ở MỌI loại câu
     lệnh sinh ra mã đó (FOREIGNKEY khi xoá cha ≠ khi chèn con); sửa catch ở một route → grep route song song cùng file. Đã gây: SAOLUU-2 vòng
     1 (mạng → "dòng N hỏng"), vòng 2 (câu khoá ngoại), vòng 3 (catch xem trước sót).
  3. K1 — Chặn: số liệu trong trang_thai.md (số dòng, số ca, đối chứng) lấy bằng lệnh và dán NGUYÊN kết quả; chạy lại bằng chứng → grep cả
     file tìm con số cũ. Đã gây: SAOLUU-2 sai hai lần (vòng 1: 81/250; vòng 3: 320, "33 đạt").
  (Gộp được vào K1 / K4 sẵn có — không mở K9, không tăng số khuôn.)
- **BỎ:** (a) 6 lệnh bị người gác chặn — luật đã có và bắt đúng, lỗi do mình viết lệnh gộp; không cần khoá thêm. (b) D2e tự so với chính nó —
  K3 đã có dòng "ca phải ĐỎ khớp câu kết luận", tự bắt trước commit.
