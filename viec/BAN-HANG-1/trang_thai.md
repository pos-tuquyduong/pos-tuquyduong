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

## Bước 1 (lượt `tiep`, 15.10.2026) — đối chiếu bản chụp
- HEAD: 4aa5935 · FETCH_HEAD: 4aa5935 — bằng nhau, không kéo.
```
4aa5935 BAN-HANG-1: trang thai buoc 3 — ket qua soat ke hoach, dung cho duyet
3396154 BAN-HANG-1: ke hoach ban 2 — sua 6 diem theo soat doc lap
2c55d53 BAN-HANG-1: ke hoach ban 1 (cho duyet) + trang thai buoc 1
```
- Chủ quán duyệt bản 2 (`3396154`): Câu hỏi 1 → có; Câu hỏi 2 → (b); Câu hỏi 3 → có, gộp cả `is_membership` (điều kiện
  `is_pkg || fromPkg || is_membership`, một câu báo); T3b dùng `2h`.

## Bước 4–7 — bài thử, đột biến, vá, kiểm, commit (15.10.2026)
- Bài thử `cong_cu/thu_P26c.js`: mount thêm `auth` (:88), S4c thêm `code`, mục mới [T1+T2] 4 ca + [T3] 2 ca. Trên gốc: **107 đạt · 4 hỏng**
  (S4c, T1a, T1b, T3a — `bang_chung_do.txt`; T1b xác nhận gốc tạo đơn rỗng 0đ). Sau vá: **111 đạt · 0 hỏng**.
- Đột biến `viec/BAN-HANG-1/dot_bien.py` — đối chứng 111 đạt · 0 hỏng, **7/7 bị bắt**. Bảng chỗ vá → đột biến (A17/A18):

| Chỗ vá | Đột biến | Ca bắt (đã chạy) |
|---|---|---|
| `orders.js:187` cổng thẻ | `BV-BANHANG1-THE-CONG` | T1a |
| | `VS-BANHANG1-THE-CONG-CU` | T1a |
| | `VS-BANHANG1-THE-SDT-THO` (dựng lại `VS-SOLUONG1-THE-SDT-THO`) | S4c |
| | `VS-BANHANG1-THE-SIET-DOI-MON` (K5) | T2a |
| | `VS-BANHANG1-THE-NULL-CHAN` (K5 — bắt bằng 5xx TypeError) | T2b |
| `auth.js:64` hạn đăng nhập | `BV-BANHANG1-HAN-DN-8H` | T3a |
| | `VS-BANHANG1-HAN-DN-BO-BIEN` | T3b |
| `Sales.jsx:385` A1 | không có — bài chạy thật không chạy React (CHƯA KIỂM bằng máy) | — |

- `viec/SO-LUONG-1/dot_bien.py` chạy lại: 16 bị bắt · **1 "không áp được"** (`VS-SOLUONG1-THE-SDT-THO` neo nguyên dòng cổng cũ :187 đã thay) →
  script đó thoát mã 1 từ nay (ngoài `npm test`). Chủ quán chốt (b) 15.10: không sửa file cũ, đột biến dựng lại ở bảng trên.
- Kiểm: `npm test` 63/63 · `(cd client && npm run build)` · `node kiem_tra_truoc_khi_giao.js --day-du` 67/67, 0 cảnh báo.
- Số dòng (`git diff --numstat 4aa5935..fcc75f5`, không đếm tay): `Sales.jsx` +6 (2 chú thích + 4 code) · `orders.js` +5/−3 (2 chú thích) ·
  `auth.js` ±1 · `thu_P26c.js` +46/−3 · `dot_bien.py` 98 dòng — trong ngân sách phiếu (15–25 code, ~50 thử).
- **Thử tay A1 ở quầy (A4):** đăng nhập → Bán hàng → chọn khách (có SĐT) → tab Gói → bấm một gói (giỏ có dòng gói) → bấm ✕ bỏ chọn
  khách → giỏ KHÔNG còn dòng gói (và món 0đ lấy từ gói, thẻ nếu có), dòng đỏ "Đã gỡ gói, thẻ và món lấy từ gói khỏi giỏ vì bỏ chọn
  khách"; món lẻ vẫn nguyên. Chọn lại khách → thêm gói lại bình thường.
