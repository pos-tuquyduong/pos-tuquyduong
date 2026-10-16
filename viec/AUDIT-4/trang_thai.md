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

## Nhóm đã xong
(chưa — chờ duyệt kế hoạch)
