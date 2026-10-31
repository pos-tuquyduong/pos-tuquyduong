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

### Bảng chỗ vá → đột biến (`viec/SAOLUU-2/dot_bien.py`, 17/17 BẮT, đối chứng 30 đạt · 0 hỏng — sau vòng sửa 1)
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

Tên đột biến: VS-DONG-DAU · VS-RONG-THANH-NULL · BV-LOC-COT · VS-NUOT-LOI · VS-NGOAI-GIAO-DICH · VS-THU-TU-FILE · BV-BANG-CHUA-CO ·
BV-XEM-TRUOC · BV-DON-APP · BV-SAO-LUU-DON-APP · BV-KHO-CO-DU-LIEU · BV-NANG-CAP · BV-KHO-TRONG-LOI · VS-LY-DO-KHOI-PHUC · VS-TRANG-TRONG-XOA ·
VS-LOI-HA-TANG-THANH-DONG · VS-SO-DONG-THU-TU

### Kiểm (bước 6)
- `node cong_cu/thu_SAOLUU2.js` → 30 đạt · 0 hỏng (sau vòng sửa 1). Gốc e94c504 → 12 đạt · 18 hỏng (`bang_chung_do.txt`).
- Bài cũ chạy lại sau vá: thu_KHO1 111/0 · thu_P26b 103/0 · thu_P3 100/0 — không phải sửa bài cũ nào.
- `npm test` → PASS 84 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có từ trước: GET có lệnh ghi ở packages.js / products.js / sync.js).
- Không đụng client/src → không cần build / --day-du.
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

## CHƯA KIỂM
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
