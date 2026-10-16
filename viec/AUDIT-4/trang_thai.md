# AUDIT-4 — trạng thái

## Bước 1 — đối chiếu bản chụp (16.10.2026, máy mây)
- Nhánh `viec/AUDIT-4`; `git status --short` rỗng; `git fetch origin viec/AUDIT-4` được.
- HEAD `d8e256e` · FETCH_HEAD `d8e256e` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  d8e256e PHIEU: AUDIT-4
  783a1dd TIEN-DO: LUOI-3 (0ee7346), P20b (617d2ee) xong; mo AUDIT-4 + P20c; them P20d — so v34
  0ee7346 Merge pull request #26 from pos-tuquyduong/viec/LUOI-3
  ```
- Kho vẫn là bản chụp NÔNG (`git rev-parse --is-shallow-repository` = true, 445 commit); `git cat-file -e 9521cec` → 128 (gốc LUOI-1 vắng —
  như AUDIT-3, chạy LUOI-1 qua `boc.py --luoi1`, 2 `GOC-*` CHƯA KIỂM).

## Bước 2–3 — đọc, kế hoạch
Đã đọc lượt này: `viec/AUDIT-4/phieu.md`; `viec/AUDIT-3/` phieu, bao_cao (AU3-1…24), ke_hoach, boc.py, dot_bien.py, kiem_neo.py; `viec/LUOI-3/`
phieu, trang_thai (N0, N11, bảng 10 BẮT), dot_bien.py, bang_chung_do.txt; `viec/P20b/` phieu, dot_bien.py; `viec/BAN-HANG-1/` phieu, dot_bien.py,
trang_thai (T1b đơn rỗng); `viec/TU-CHAY-6/trang_thai.md` Câu hỏi 5; code `server/routes/orders.js:178–215, 495–545, 1000–1012, 1160–1172`,
`server/routes/signup-codes.js:40–75, 498–499`, `server/routes/discount-codes.js:60–110, 336–350`, `server/utils/tienDaTra.js` (cả file),
`server/utils/goiKhach.js:1–45`, `viec/AUDIT-2/dot_bien_bb.py:238–330`, `viec/TACH-GL/dot_bien.py:114–142`, `viec/LUOI-1/dot_bien.py:177–200`.
Số đo lúc lập kế hoạch: `ke_hoach.md` mục 0. Kế hoạch: `ke_hoach.md` — **chờ chủ quán duyệt** (phiếu dặn dừng ở bước 3).

## Soát kế hoạch (agent phụ, chỉ đọc)
Bản 1 (`52fb6d2`) → KHÔNG ĐẠT, 11 lỗi (HET mới không khớp `KHÔNG ĐẠT (n lệch)`; 3 dự đoán đột biến sai — T3a so bằng 30 ngày, các số làm tròn đều
chia hết; sót chỗ làm tròn `tienDaTra.js:81`; ca đỏ AU3-23 chỉ là "kiểm bản vá có mặt"; ca AU3-22 chưa chắc phân biệt; D2 nhãn sập trùng HỎNG; bb
trả list dòng; SO-LUONG-1 không có trong `KHUON`; 2 số dòng lệch). Tôi kiểm lại từng điểm trên code (`thu_P26c.js:916`, `chay.js:138, :299–300`,
`viec/AUDIT-3/boc.py:172`, `discount-codes.js:341`, `tienDaTra.js:81`) — đúng cả. Đã sửa ở bản 2: `ke_hoach.md` mục 13 liệt kê từng lỗi → chỗ sửa.

## Câu hỏi
Ba câu ở `ke_hoach.md` mục 12 (ngân sách `boc.py` ~50 dòng so ~30 của phiếu; mức của SỐNG "biên" — chỉ qua API / làm tròn ≤ 1đ; đột biến
`claimed_at` trùng bộ P20b). Mỗi câu có phương án mặc định.

## Dừng
Phiếu dặn "chờ duyệt kế hoạch" → dừng ở bước 3 sau khi commit + push `ke_hoach.md` bản 2. Làm tiếp: `/lam-viec AUDIT-4 tiep`.

## Nhóm đã xong
(chưa — chờ duyệt kế hoạch)
