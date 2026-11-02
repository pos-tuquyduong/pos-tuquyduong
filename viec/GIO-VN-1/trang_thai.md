# GIO-VN-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (02.11.2026)
- Nhánh: `viec/GIO-VN-1`; cây sạch.
- HEAD `36b98b8` · FETCH_HEAD `36b98b8` — bằng nhau, không kéo.
- Kho nông (bắt đầu 18.10) → `git fetch -q --unshallow origin viec/GIO-VN-1` để đọc lịch sử cột giờ cho bước nâng cấp 012 (chỉ tải lịch sử, không đổi file).
- `git log --oneline -3`:
  ```
  36b98b8 PHIEU: GIO-VN-1
  2c81b0f TIEN-DO: MANKHACH-1 (ae27536), TU-CHAY-10 (4891879), KHO-IN-1 (d1b57b8) xong; dot quyet dinh 01-02.11 + thiet_ke dot 2 + hop dong v7 (da hen) + lich theo lan; mo GIO-VN-1, HANG-1, NAP-1 — so v53
  d1b57b8 Merge pull request #64 from pos-tuquyduong/viec/KHO-IN-1
  ```

## Bước 2–3
- Đã đọc phiếu, CLAUDE.md, KHUON_LOI.md, LUAT_XAY_APP.md, QUYET_DINH (mục Chung 28.10), code thật (danh sách ở `ke_hoach.md`).
- Kế hoạch: `ke_hoach.md`. Phiếu dặn **chờ duyệt kế hoạch** → commit, push, DỪNG ở bước 3.

## Lượt 2 (`tiep`, 02.11) — chủ quán duyệt kế hoạch
- HEAD `cc45a26` = FETCH_HEAD `cc45a26`, không kéo. `git log --oneline -3`: `cc45a26` ke hoach sua theo soat · `5630f2c` bang cot 012 · `08cac58` ban nhap.
- Chủ quán: **Q1** cho phép đổi giờ sổ ví (có sao lưu) · **Q2** hạn thẻ cũ coi là giờ VN, chỉ đổi dấu cách → T · **Q3** `pos_settings.updated_at`
  để nguyên · **#26** HANG-1 sẽ viết lại khối mua thẻ — chỉ sửa gọn đúng `orders.js:1062-1064`, không chạm dòng khác trong khối · `PHIEN_BAN`
  tăng 1 so với main (main = 5 → 6), chat chỉnh số lúc gộp.
- #26 tính hạn trên `Date.parse(now + 'Z')`; `addMonthsSafe` (`helpers.js:220-227`, chỉ `orders.js:1063` gọi — grep) chuyển sang phép UTC
  (`getUTC*`/`setUTC*`) để kết quả không theo múi giờ máy — khối mua thẻ chỉ đổi dòng 1062 và 1064.

## Bước 4–6 (lượt 2)
- Bài thử `cong_cu/thu_GIOVN1.js` viết TRƯỚC, đỏ trên gốc 36b98b8 (11 đạt · 29 hỏng), xanh trên HEAD (40 đạt · 0 hỏng) — `bang_chung_do.txt`.
- `npm test -- --day-du`: PASS 97 · FAIL 0 · CẢNH BÁO 1 (có sẵn: route GET có lệnh ghi). Build `client/dist` xong.
- Giữa chừng `thu_SAOLUU2` F1 đỏ: khôi phục chuẩn hoá giờ cả file MỚI làm sao lưu → khôi phục không còn y hệt → chỉ chuẩn hoá khi file là bản
  CŨ (`backup_date` không phải giờ VN dạng T — mọi file ghi từ nay mang `backup_date: getNow()`). Không sửa bài cũ.

### Chỗ vá → đột biến (`viec/GIO-VN-1/dot_bien.py`, 26/26 BẮT)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| `nang_cap/012` chạy được | BV-012 | B1 |
| 012: VN dấu cách chỉ đổi T | VS-012-VN-CUNG-CONG-7 | B1 |
| 012: cột lẫn để nguyên (Q3) | VS-012-COT-LAN-CUNG-DOI | B1 |
| 012: đuôi Z có mili-giây | VS-012-Z-THIEU-MAU-MILI-GIAY | B1 |
| 012: sao lưu trước khi đổi | BV-012-SAO-LUU | B2 |
| 012: sổ ví đổi giờ (Q1) | BV-012-SO-VI | B1 |
| 012: hạn thẻ cũ (Q2) | BV-012-HAN-THE | B1 |
| 012: ngày tạo khách (App KH) | BV-012-KHACH | E1 |
| `khoiPhuc.js` chuẩn hoá bản cũ | BV-KHOI-PHUC | B6 |
| `backup.js` chỉ bản cũ mới chuẩn hoá | VS-KHOI-PHUC-MOI-FILE | B6b |
| `damages.js` created_at | BV-DAMAGES | A2d |
| `settings.js` updated_at (3 chỗ) | BV-SETTINGS | A2a |
| `packages.js` | BV-PACKAGES | A2b |
| `settings.js` nhật ký in | BV-IN-HOA-DON | A2c |
| `database.js` gieo dữ liệu | BV-GIEO-CHU | A1 (bước 012 chữa dòng gieo nên chỉ phép quét bắt) |
| `product-groups.js` | BV-NHOM-MON | A2f |
| `products.js` ton_luc | BV-TON-LUC | A1 |
| `client/src/utils/ngayVN.js` | BV-NGAY-MAN-QUAY | A3 |
| phép quét M5 (D) | BV-QUET-M5 | D5 |
| `orders.js:1064` hạn thẻ dạng T | VS-THE-DAU-CACH | C5a |
| `helpers.js` addMonthsSafe UTC | BV-THE-THEO-MUI-GIO-MAY | C5b |
| `doiSoat.js` DEN không bù hai lần | VS-DEN-BU-HAI-LAN | C6 |
| `orders.js:132` hôm nay | BV-HOM-NAY | C7a |
| `settings.js` năm số hoá đơn | BV-NAM-HOA-DON | C7b |
| `sync.js` cảnh báo tồn | BV-SYNC | C11 |
| `HOP_DONG_API_KH.md` | BV-HOP-DONG | E2 |

Tên đột biến: BV-012 · VS-012-VN-CUNG-CONG-7 · VS-012-COT-LAN-CUNG-DOI · VS-012-Z-THIEU-MAU-MILI-GIAY · BV-012-SAO-LUU · BV-012-SO-VI ·
BV-012-HAN-THE · BV-KHOI-PHUC · VS-KHOI-PHUC-MOI-FILE · BV-DAMAGES · BV-SETTINGS · BV-PACKAGES · BV-IN-HOA-DON · BV-GIEO-CHU · BV-NHOM-MON ·
BV-TON-LUC · BV-NGAY-MAN-QUAY · BV-QUET-M5 · VS-THE-DAU-CACH · BV-THE-THEO-MUI-GIO-MAY · VS-DEN-BU-HAI-LAN · BV-HOM-NAY · BV-NAM-HOA-DON ·
BV-SYNC · BV-HOP-DONG · BV-012-KHACH

## Câu hỏi
- Chờ duyệt kế hoạch (phiếu dặn). Ba câu cần chủ quán xác nhận ở cuối `ke_hoach.md` mục "Câu hỏi cho chủ quán" (sổ ví đổi giờ; hạn thẻ cũ; `pos_settings.updated_at` để nguyên).

## Phát hiện
- Kế hoạch soát độc lập (agent chỉ đọc) — 4 câu, đã sửa theo (ghi cuối `ke_hoach.md`).
- `pos_settings.updated_at` có giá trị dấu cách lẫn UTC / VN — không biết chắc, bước 012 để nguyên.
- `formatDateTime` / `formatDate` (`server/utils/helpers.js:79-101`) xuất ra nhưng không ai gọi — code chết, ngoài mục tiêu, không sửa.
