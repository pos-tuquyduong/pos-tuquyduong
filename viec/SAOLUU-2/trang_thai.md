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

### Bảng chỗ vá → đột biến (`viec/SAOLUU-2/dot_bien.py`, 15/15 BẮT, đối chứng 28 đạt · 0 hỏng)
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

Tên đột biến: VS-DONG-DAU · VS-RONG-THANH-NULL · BV-LOC-COT · VS-NUOT-LOI · VS-NGOAI-GIAO-DICH · VS-THU-TU-FILE · BV-BANG-CHUA-CO ·
BV-XEM-TRUOC · BV-DON-APP · BV-SAO-LUU-DON-APP · BV-KHO-CO-DU-LIEU · BV-NANG-CAP · BV-KHO-TRONG-LOI · VS-LY-DO-KHOI-PHUC · VS-TRANG-TRONG-XOA

### Kiểm (bước 6)
- `node cong_cu/thu_SAOLUU2.js` → 28 đạt · 0 hỏng. Gốc e94c504 → 12 đạt · 16 hỏng (`bang_chung_do.txt`).
- Bài cũ chạy lại sau vá: thu_KHO1 111/0 · thu_P26b 103/0 · thu_P3 100/0 — không phải sửa bài cũ nào.
- `npm test` → PASS 84 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có từ trước: GET có lệnh ghi ở packages.js / products.js / sync.js).
- Không đụng client/src → không cần build / --day-du.
- Số dòng: server/utils/khoiPhuc.js 81 dòng mới; backup.js +22 / −95 (ròng −73) → máy chủ ròng ≈ +8; bài thử ≈ 250 — trong ngân sách.

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
