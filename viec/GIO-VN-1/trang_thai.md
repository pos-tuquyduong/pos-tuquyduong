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

## Câu hỏi
- Chờ duyệt kế hoạch (phiếu dặn). Ba câu cần chủ quán xác nhận ở cuối `ke_hoach.md` mục "Câu hỏi cho chủ quán" (sổ ví đổi giờ; hạn thẻ cũ; `pos_settings.updated_at` để nguyên).

## Phát hiện
- Kế hoạch soát độc lập (agent chỉ đọc) — 4 câu, đã sửa theo (ghi cuối `ke_hoach.md`).
- `pos_settings.updated_at` có giá trị dấu cách lẫn UTC / VN — không biết chắc, bước 012 để nguyên.
- `formatDateTime` / `formatDate` (`server/utils/helpers.js:79-101`) xuất ra nhưng không ai gọi — code chết, ngoài mục tiêu, không sửa.
