# LUOI-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (13.10.2026)
- nhánh: `viec/LUOI-2`; `git status --short` sạch
- HEAD `fd919fd` · FETCH_HEAD `fd919fd` — bằng nhau, không kéo
- `git log --oneline -3`:
  ```
  fd919fd PHIEU: LUOI-2
  7f8656d TIEN-DO: P26c xong (9a68ab6), AUDIT-2 xong (bcfb509), mo GOI-1 + LUOI-2, them AUDIT-3 + DANG-NHAP-1 — so v28
  9a68ab6 Merge pull request #16 from pos-tuquyduong/viec/P26c
  ```

## N0 — 5 đột biến A3L chạy lại trên HEAD `fd919fd` (trước mọi sửa)
`python3 viec/AUDIT-2/dot_bien.py A3L-redeem-thieu-1-diem A3L-earn-flash-van-cong A3L-nhandiem-cong-doi A3L-goi-bo-kiem-chu A3L-goi-huy-dem-ca-mon-tra-tien -j 3`
```
SỐNG  A3L A3L-redeem-thieu-1-diem  (41 s) · mọi lệnh thoát 0
SỐNG  A3L A3L-earn-flash-van-cong  (41 s) · mọi lệnh thoát 0
SỐNG  A3L A3L-nhandiem-cong-doi  (41 s) · mọi lệnh thoát 0
SỐNG  A3L A3L-goi-bo-kiem-chu  (39 s) · mọi lệnh thoát 0
SỐNG  A3L A3L-goi-huy-dem-ca-mon-tra-tien  (39 s) · mọi lệnh thoát 0
  tổng 5 · thời gian 124 s
  A3L BẮT 0 · SỐNG 5 · HỎNG 0 · LẠC 0 · TREO 0
  ✓ kho thật không đổi
```
- Neo: cả 5 áp được (không HỎNG) → **không neo lại**; neo trước = neo sau. Vị trí trên HEAD: `loyalty.js:163`, `orders.js:783`
  (AUDIT-2 ghi 770), `signup-codes.js:213`, `orders.js:214` (ghi 208), `orders.js:1412` (lần khớp 0 / 2 = huỷ; lần 1 = xoá `:1543`).
- Cách chạy `c2full` (`viec/AUDIT-1/dot_bien.py:222`) KHÔNG chạy `cong_cu/thu_P26c.js`. Đo thêm bằng công cụ nháp (bản sao `server/`
  + `node cong_cu/thu_P26c.js --may-chu <bản sao>`): N1–N6 (gồm N6 `tienDaTra.js` bỏ `− debt_amount`) đều `76 đạt · 0 hỏng` → SỐNG.

## Câu hỏi
(chưa có)

## Phát hiện
(chưa có)
