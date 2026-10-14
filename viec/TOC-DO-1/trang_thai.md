# TOC-DO-1 — trạng thái

## Bước 1 · đối chiếu bản chụp (14.10.2026)
- Nhánh: `viec/TOC-DO-1`; cây sạch.
- `git fetch origin viec/TOC-DO-1` → HEAD `d22ca91` · FETCH_HEAD `d22ca91` (bằng nhau) → không kéo.
- `git log --oneline -3`:
  ```
  d22ca91 PHIEU: TOC-DO-1
  65206b6 TIEN-DO: GOI-1 xong (28f65d1), LUOI-2 xong (c591b9e), mo GOI-2 + TOC-DO-1, them SO-LUONG-1 — so v29
  c591b9e Merge pull request #18 from pos-tuquyduong/viec/LUOI-2
  ```

## A1 — nguyên nhân (chi tiết + số đo: `ke_hoach.md` mục 1)
- `thu_cong.js` chạy riêng 67,1 s. Dưới tải CPU (8 tiến trình đốt / 4 lõi ×3 lần, 24 tiến trình ×1 lần): 153–326 s, cả 4 lần
  **318 phép · 0 hỏng**. Tải CPU một mình KHÔNG làm ca nào bên trong đỏ, chỉ làm tổng thời gian vượt hạn 120 s → đỏ dạng ETIMEDOUT
  (khác dấu sự cố).
- Dấu sự cố ("dòng ✗ … Received null") khớp đúng `tu_chay/cong.js` sập: `blob()` (`:30–33`) trả `null` khi `git cat-file` không thoát 0 —
  kể cả khi không sinh được tiến trình git — rồi `:268/:325/:327` ghi `null` vào `fs.writeFileSync`. Giả thuyết Replit chạm giới hạn
  tiến trình / bộ nhớ: **CHƯA KIỂM** (người gác chặn `ulimit` → không dựng được giới hạn trên máy này).
- Cách sửa gốc nằm trong `tu_chay/` → Câu hỏi 1.

## Câu hỏi
1. **Sửa gốc trong `tu_chay/` (phiếu CẤM việc này sửa):** `tu_chay/cong.js` `blob()` phân biệt "file không có" (`status` 1) với "git không
   chạy được" (`status` null / `error`) và ném lỗi rõ thay vì trả `null`; thêm ca "git giả tự giết ở cat-file" vào `thu_cong.js`. Kèm (đã
   nêu ở AU2-10): chia `thu_cong.js` thành lượt song song. Chủ quán có mở việc cài cho phần này không?

## Phát hiện
- `tu_chay/thu_nguoi_gac.js` (`kiem_tra_truoc_khi_giao.js:549`) và `tu_chay/thu_cong_cu.js` (`:551`) cũng là bài bộ khung, chạy ở bản nhanh
  mỗi commit. Phiếu không nhắc → không đổi. Sẽ đo thời gian ở bước làm để chủ quán quyết có áp cùng điều kiện không.
- Bản sao máy mây này KHÔNG có `.git/hooks/pre-commit` (chỉ file mẫu), giống AUDIT-2 đã ghi → commit ở đây không qua tầng 3. Bước 6 sẽ
  chạy `npm test` bằng tay trước mỗi commit đổi code.

## Đang ở
Bước 3: kế hoạch đã viết và đã qua một vòng soát bằng agent phụ chỉ đọc. Đã sửa theo các điểm soát: kết luận A1, `--untracked-files=all`,
`--no-optional-locks`, khối cắt có dòng `else`, bài thử bỏ `GIT_*`, ca hook thật, `bang_chung_do.txt`, Câu hỏi thay Phát hiện.
Phiếu dặn **chờ duyệt kế hoạch** → DỪNG.
