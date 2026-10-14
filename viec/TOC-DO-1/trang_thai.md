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

## Bước 1 lần 2 · làm tiếp (14.10.2026 04:52 UTC)
- Chủ quán duyệt kế hoạch `e2a357a` (giữ 14 ca). Câu hỏi 1 → trả lời: CÓ, nhưng thành việc cài riêng SAU AUDIT-3 → chuyển xuống Phát hiện.
- Đổi model giữa phiên: 04:52 UTC, trước bước 4 (chưa viết bài thử). Kết quả đo trước (A1) do tay cũ; mọi số đo A5 sẽ do tay mới.
- Nhánh `viec/TOC-DO-1`; cây sạch; HEAD `e2a357a` = FETCH_HEAD `e2a357a` → không kéo.
- `git log --oneline -3`:
  ```
  e2a357a TOC-DO-1: ke hoach sau vong soat + A1 so do (cho duyet)
  df8f090 TOC-DO-1: ke hoach (nhap, cho so do tai 24 + soat)
  d22ca91 PHIEU: TOC-DO-1
  ```

## Bước 4–5 · bài thử, đột biến, vá (14.10.2026)
- `cong_cu/thu_TOCDO1.js` (15 ca: E0 + T1–T11b): trên gốc **12 đạt · 3 hỏng** (T1, T2, T10 — ba ca "phải bỏ qua"); trên bản vá
  **15 đạt · 0 hỏng**. Bằng chứng: `bang_chung_do.txt` (ghi lại lần 2 vì bài thử đổi bộ cắt sau lần 1 — A16).
- Chỗ vá: `kiem_tra_truoc_khi_giao.js` dòng 553 cũ → hàm `lyDoChayThuCong()` + lời gọi có điều kiện (~17 dòng code, 3 dòng chú thích).
- Đổi code chạy thật? KHÔNG (`server/`, `client/src/` không đụng) — vẫn có `dot_bien.py` vì phiếu A3 đòi.

### Chỗ vá → đột biến (`viec/TOC-DO-1/dot_bien.py`, 9 đột biến, 9/9 bị bắt, đối chứng xanh)
| chỗ vá | đột biến | ca bắt |
|---|---|---|
| lời gọi có điều kiện `const lyDoThuCong = lyDoChayThuCong();` | `BV-TOCDO1-LUON-CHAY` (bỏ vá: luôn có lý do) | T1 |
| — | `VS-TOCDO1-LUON-BO-QUA` (luôn null) | T3a |
| `g('status', '--porcelain', '--untracked-files=all', …)` | `VS-TOCDO1-QUEN-VUNG-CHO` (→ `diff --name-only`: chỉ cây làm việc) | T4 |
| — | `VS-TOCDO1-QUEN-CAY-LAM-VIEC` (→ `diff --cached`: chỉ vùng chờ) | T5 |
| — | `VS-TOCDO1-THEO-CAU-HINH` (bỏ `--untracked-files=all`) | T6 |
| `const KHUNG = ['tu_chay', '.claude', '.github']` | `VS-TOCDO1-QUEN-GITHUB` | T3c |
| `if (DAY_DU) return '--day-du';` | `VS-TOCDO1-BO-DAYDU` | T7 |
| `if (mb.status !== 0) return '…'` | `VS-TOCDO1-KHONG-ORIGIN-BO-QUA` (→ null) | T8 |
| `g('diff', '--name-only', mb.stdout.trim(), 'HEAD', …)` | `VS-TOCDO1-SO-THANG-ORIGIN` (so thẳng `origin/main`) | T10 |

Mọi tên đột biến: BV-TOCDO1-LUON-CHAY · VS-TOCDO1-LUON-BO-QUA · VS-TOCDO1-QUEN-VUNG-CHO · VS-TOCDO1-QUEN-CAY-LAM-VIEC ·
VS-TOCDO1-THEO-CAU-HINH · VS-TOCDO1-QUEN-GITHUB · VS-TOCDO1-BO-DAYDU · VS-TOCDO1-KHONG-ORIGIN-BO-QUA · VS-TOCDO1-SO-THANG-ORIGIN.
(Kế hoạch ghi 7; thêm 2 khi viết ca: QUEN-CAY-LAM-VIEC, SO-THANG-ORIGIN — mỗi cái một dòng, bắt một đường mã đã có.)

### Sự cố trong bước 4–5 (đầu vào bước 11)
1. **Đỏ oan (K2):** bộ cắt `indexOf('function lyDoChayThuCong(')` bắt trúng CHÚ THÍCH tôi viết ngay trên hàm (chú thích nhắc tên hàm)
   → khối = mẩu chú thích → 14 ca ném "Unexpected identifier 'dòng'". Sửa: neo đầu dòng `^function …` (regex m).
2. **Xanh oan (K3) — nặng:** cùng lúc đó `dot_bien.py` (khuôn GOI-1) báo **9/9 đột biến bị bắt** vì tiêu chí "thoát ≠ 0 + có dòng ✗ Tn"
   được thoả bởi bài thử đang SẬP. Khoá ngay (trong phạm vi): đối chứng bản sao chưa đột biến phải xanh, và dòng ✗ khớp không được là
   dòng ném. Tái hiện tất định ở thư mục nháp (bộ cắt cũ + bộ kiểm đã vá) → bản mới in "✗ đối chứng … 1 đạt · 14 hỏng — DỪNG", thoát 1.
   Khuôn `viec/GOI-1/dot_bien.py` (và P26c, TACH-GL cùng khuôn) KHÔNG có đối chứng này → ngoài phạm vi, đề xuất ở Bài học.
3. Người gác chặn: `nproc`, `until` (B-CHUONGTRINH); `ulimit` (B-CHUONGTRINH — vì thế không dựng được giới hạn tiến trình cho A1);
   `$S/…` (B-DICHCHU); `git --version` (GIT-TUYCHON); heredoc python nhắc file bảo vệ (B-MANOI); `cd` giữa lệnh (B-CD-VITRI).
   Tất cả đều có cách làm khác (script trong thư mục nháp, đường dẫn viết thẳng) — không lách.

## A5 · đo `npm test` CHẠY RIÊNG (máy mây 4 lõi, không tải song song), tay mới
| | lần 1 | lần 2 | thu_cong.js | PASS · FAIL · CẢNH BÁO |
|---|---|---|---|---|
| TRƯỚC vá (e2a357a) | 90,3 s | 83,9 s | 67,8 / 65,4 s | 63 · 0 · 0 |
| SAU vá — máy này KHÔNG có `origin/main` → đường an toàn "không xác định được gốc chung" → VẪN chạy thu_cong.js | 69,4 s | 70,4 s | 54,1 / 55,1 s | 63 · 0 · 0 |

- Dòng in thật ở bản sau vá: `– chạy thu_cong.js: không xác định được gốc chung với origin/main`.
- **Đường "bỏ qua" (Replit có `origin/main`, commit thường) KHÔNG đo được trên máy này:** kho thật không có ref `origin/main`; người gác chặn
  `git fetch origin main` (GIT-KEO — đúng luật, không lách); lệnh dựng bản sao cây làm việc trong thư mục nháp bị từ chối. Ước lượng
  (KHÔNG phải số đo): `npm test` ≈ 69,4 − 54,1 ≈ 15 s. Chủ quán đo thật trên Replit: `npm test` phải in dòng
  `– bỏ qua thu_cong.js — không đổi tu_chay/.claude/.github` và PASS 62 (giảm 1 vì phép "bài chạy thật thu_cong.js" không chạy).
- `node kiem_tra_truoc_khi_giao.js --day-du` SAU vá (chạy riêng): **154,4 s · thoát 0 · PASS 67 · FAIL 0 · CẢNH BÁO 0**, in
  `– chạy thu_cong.js: --day-du` (thu_cong.js 55,6 s) — A4/A5.
- PASS bản nhanh khi bỏ qua = 62, khi chạy = 63 — dòng `–` không đếm là PASS (xem `kiem_tra_truoc_khi_giao.js`, `dong.push` không qua `pass()`).

## Đang ở (cũ — bước 3)
Bước 3: kế hoạch đã viết và đã qua một vòng soát bằng agent phụ chỉ đọc. Đã sửa theo các điểm soát: kết luận A1, `--untracked-files=all`,
`--no-optional-locks`, khối cắt có dòng `else`, bài thử bỏ `GIT_*`, ca hook thật, `bang_chung_do.txt`, Câu hỏi thay Phát hiện.
Phiếu dặn **chờ duyệt kế hoạch** → DỪNG.
