# BAN-HANG-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (15.10.2026)
- HEAD: 328a4eb · FETCH_HEAD (origin/viec/BAN-HANG-1): 328a4eb — bằng nhau, không kéo.
- git log --oneline -3:
```
328a4eb PHIEU: BAN-HANG-1
8f6d43e TIEN-DO: mo TU-CHAY-6 + BAN-HANG-1 (song song AUDIT-3), DANG-NHAP-1 gop vao BAN-HANG-1 — so v32
142d5e5 TIEN-DO: SO-LUONG-1 xong (31a5810), mo AUDIT-3, them BAN-HANG-1, TU-CHAY-6 (6)(7) — so v31
```
- Phiếu dặn "Chờ duyệt kế hoạch" → lượt này dừng ở bước 3 sau khi commit + push `ke_hoach.md`.

## Bước 3 — kế hoạch (15.10.2026)
- Bản 1 commit `2c55d53`. Soát độc lập (agent chỉ đọc, 4 câu) kết luận CẦN SỬA — 6 điểm, đã sửa thành bản 2:
  1. đếm sai: `viec/SO-LUONG-1/dot_bien.py` có 17 đột biến → sau A2 còn 16 bị bắt + 1 "không áp được", script thoát mã 1 (ngoài `npm test`).
  2. `VS-BANHANG1-THE-SIET-DOI-MON` phải ghi nguyên chuỗi, `items.length` nằm TRONG `!(…)`.
  3. `VS-BANHANG1-THE-NULL-CHAN`: gửi `null` ra TypeError → 5xx, không phải 400 — T2b vẫn bắt; sửa mô tả.
  4. T3b dùng `2h` (7200 s) thay `8h` (trùng mặc định cũ → K3); T3a so `status === 200` trước khi giải mã.
  5. K4 sót: bỏ chọn khách khi giỏ có món lấy từ gói CŨ (`activePkgId`) → `orders.js:354` 400 → Câu hỏi 3.
  6. Bớt: dòng `setCategory` (A1), đột biến `VS-BANHANG1-THE-CHI-HANG` (trùng ca bắt S4c). T1b giữ làm bằng chứng phụ.
- Mọi khẳng định của agent soát đã đối chiếu lại trên code lượt này: `orders.js:354`, `Sales.jsx:504, :716`, `orders.js:150`, `package.json:24` (express 5).
- Dừng ở bước 3 theo phiếu ("Chờ duyệt kế hoạch"). 3 câu hỏi chờ chủ quán ở cuối `ke_hoach.md`.
