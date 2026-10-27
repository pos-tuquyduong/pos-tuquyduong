# KHO-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (27.10.2026)
- Nhánh: `viec/KHO-1`; cây sạch.
- HEAD `40ab1cf` · FETCH_HEAD `40ab1cf` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  40ab1cf PHIEU: KHO-1
  b1f8299 TIEN-DO: UUDAI-1 duyet (f7165ea); them KHO-1..3, KH-API-2, KH-HOSO-1; P15 gop HD-1; TOPPING-1, P3b, GIAO-1 truoc khai truong; mo KHO-1 + HD-1; lich khai truong 07.11 — so v42
  40e07ce TIEN-DO: P3 (56e090d), BH-1 (9fd32af), DIEM-THAT-1 xong; mo UUDAI-1; them COMBO-1a, COMBO-1b + 4 viec nho; lich — so v41
  ```

## Bước 2–3
- Đã đọc: phiếu, CLAUDE.md, KHUON_LOI.md, CHECKLIST mục G; code `server/database.js`, `server/index.js`, `server/middleware/auth.js`,
  `server/routes/backup.js`, `server/routes/products.js`, `server/utils/helpers.js` (getNow), `client/src/App.jsx`,
  `client/src/components/Layout.jsx`, `client/src/utils/api.js`, `client/src/contexts/AuthContext.jsx`, khuôn bài thử `cong_cu/thu_DOISOAT1.js`.
- Kế hoạch: `viec/KHO-1/ke_hoach.md`. Phiếu dặn **chờ duyệt kế hoạch** → dừng sau khi push kế hoạch.
- Người gác chặn `add_repo tuquyduong/Quan-Ly-San-Xuat` ([CC-LA] — công cụ ngoài danh sách cho phép) → KHÔNG đọc được cấu trúc SX; xem Câu hỏi 1.

## Câu hỏi
1. **Cấu trúc SX (chặn phần F, G).** Máy không đọc được code SX lẫn bản sao lưu 09.10. Để viết `nhapSx.js` đúng, cần MỘT trong ba:
   (a) cho phép `add_repo tuquyduong/Quan-Ly-San-Xuat` (chỉ đọc); (b) dán vào phiếu các câu `CREATE TABLE` của `ingredients`,
   `product_types`, `sx_products`, `sx_product_ingredients`, `recipe_ingredients`, `tea_ingredients`, `recipes`, `tea_products` + cách SX
   trả `sx_product_type` / `sx_product_id` ở `/api/pos/products-with-stock` (id là `sx_products.id` hay `legacy_id`? type là 'juice'/'tea'
   hay mã nhóm?); (c) chép bản sao lưu SX vào thư mục nháp của phiên (KHÔNG commit — có dữ liệu khách). Không có thì máy dựng `nhapSx.js`
   theo tên bảng trong phiếu, đọc cột bằng `PRAGMA table_info` + bảng ánh xạ cột một chỗ, và ca "bản 09.10 ra 33 nguyên liệu" ghi CHƯA KIỂM.
2. **Bước nâng cấp hỏng thì máy chủ làm gì?** Đề xuất (ke_hoach.md §B): log rõ tên bước, KHÔNG chạy các bước sau, máy chủ VẪN mở quầy
   (bán hàng chưa dựa vào kho tới KHO-3 — CLAUDE.md §5.3 lỗi không lan); mọi đường `/api/pos/kho/*` trả 503 `NANG_CAP_HONG` nêu bước.
   Phương án kia: dừng khởi động (`process.exit(1)` như lỗi kết nối hiện nay) — an toàn dữ liệu hơn nhưng quầy đứng. Chủ quán chọn.
3. **Sản phẩm SX chưa có dòng `pos_products`** (chưa từng đặt giá ở quầy): đề xuất bản xem trước cảnh báo + BỎ QUA công thức của món đó
   (không tự tạo dòng `pos_products` — tạo dòng sẽ hiện món lên menu dự phòng khi SX mất kết nối, trái K). Đặt giá xong nhập lại là có.
   (Dòng `pos_products` hiện sinh từ: seed khi bảng rỗng, đặt giá, `POST /products/sync-from-sx` — `products.js:245`.)

## Phát hiện
- Khôi phục Excel (`server/routes/backup.js` POST `/restore`) xoá + chèn lại cả bảng — với bảng `kho_*` sẽ đi vòng phép chặn vòng công thức /
  `ten_chuan`. KHO-1 chỉ thêm vào `BACKUP_TABLES` theo phiếu J; đề nghị chat soát xét `BANG_KHONG_KHOI_PHUC` cho bảng sổ kho ở KHO-2.

## Soát kế hoạch
- Agent phụ chỉ đọc: không ra ngoài Phạm vi; 11 góp ý (gộp hàm, dùng `trongGiaoDich`/`loiGhi`, ca thử thiếu, đường song song) — đã đưa
  vào `ke_hoach.md` mục "Vòng soát 1".
- Dừng ở bước 3: chờ chủ quán duyệt kế hoạch + trả lời Câu hỏi 1–3.
