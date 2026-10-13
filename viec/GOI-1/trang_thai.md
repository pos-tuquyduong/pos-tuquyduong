# GOI-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (13.10.2026)
- Nhánh: `viec/GOI-1`. `git status --short` sạch (không dòng nào).
- `git fetch origin viec/GOI-1` → HEAD `93163f3` · FETCH_HEAD `93163f3` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  93163f3 PHIEU: GOI-1
  7f8656d TIEN-DO: P26c xong (9a68ab6), AUDIT-2 xong (bcfb509), mo GOI-1 + LUOI-2, them AUDIT-3 + DANG-NHAP-1 — so v28
  9a68ab6 Merge pull request #16 from pos-tuquyduong/viec/P26c
  ```
- Có commit `PHIEU: GOI-1`.

## Bước 2 — đã đọc (lượt này)
`phieu.md`, `CLAUDE.md`, `KHUON_LOI.md`, mục lục `CHECKLIST_CODE.md` (P4, G, H theo CLAUDE.md §2).
Code: `packages.js` (cả file), `orders.js` 160–400, 760–900, 990–1030, 1340–1360, 1400–1430, 1536–1560, `middleware/auth.js`
84–110, `helpers.js` 145–160, `customers-v2.js` 19–80 + 201–260, `database.js` (bảng `pos_customers`, `pos_wallets`,
`pos_packages`, `pos_customer_packages`, dòng 982), `Settings.jsx` 338–390 + 1140–1230, `Reports.jsx` 15–92 + 344–430,
`Customers.jsx` 25–160, `Sales.jsx` 75–112 + 405–435 + 535–550, `App.jsx` (route), `AuthContext.jsx` 58–66, `api.js` 180–242,
`kiem_tra_truoc_khi_giao.js` 215–240 + 492, `thu_P26c.js` 1–60 (khuôn bài thử), grep `pos_packages` trong `cong_cu/`.

## Bước 3 — kế hoạch
`ke_hoach.md`. Phiếu dặn **chờ duyệt kế hoạch** → commit, push, DỪNG. Câu hỏi cho chủ quán ở `ke_hoach.md` mục 11.
- Agent phụ (chỉ đọc) soát kế hoạch theo 4 câu → đã sửa: bỏ lọc gói ở máy chủ; không đặt sẵn lọc "Đang giao"; dừng gói một phép
  `UPDATE … AND status='active'`; thêm ca A1f, A2g–A2i, A4e–A4f, A5h, A6 (gia hạn, xoá gói, tổng lệch); lịch sử giao dùng chung
  điều kiện đếm; bỏ câu sai "khách 150 % vẫn lấy được"; sửa vị trí `BV-GOI1-DEM`; đột biến P26c đổi mong đợi → DỪNG (ngoài Phạm vi);
  thêm C6 (huỷ / xoá đơn mua gói của gói đã dừng), C7 (`package_buy` không SĐT).
