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

## Câu hỏi
- Chờ duyệt kế hoạch (phiếu dặn). Ba câu cần chủ quán xác nhận ở cuối `ke_hoach.md` mục "Câu hỏi cho chủ quán" (sổ ví đổi giờ; hạn thẻ cũ; `pos_settings.updated_at` để nguyên).

## Phát hiện
- Kế hoạch soát độc lập (agent chỉ đọc) — 4 câu, đã sửa theo (ghi cuối `ke_hoach.md`).
- `pos_settings.updated_at` có giá trị dấu cách lẫn UTC / VN — không biết chắc, bước 012 để nguyên.
- `formatDateTime` / `formatDate` (`server/utils/helpers.js:79-101`) xuất ra nhưng không ai gọi — code chết, ngoài mục tiêu, không sửa.
