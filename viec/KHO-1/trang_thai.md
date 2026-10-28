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
(Cả 3 câu dưới đã được chủ quán trả lời ở phiếu, commit `e4f927f` 28.10 — giữ lại để đối chiếu.)
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
- (đã xử lý theo phiếu mục 4 Đã duyệt) Khôi phục Excel (`server/routes/backup.js` POST `/restore`) xoá + chèn lại cả bảng — với bảng `kho_*` sẽ đi vòng phép chặn vòng công thức /
  `ten_chuan`. KHO-1 chỉ thêm vào `BACKUP_TABLES` theo phiếu J; đề nghị chat soát xét `BANG_KHONG_KHOI_PHUC` cho bảng sổ kho ở KHO-2.

## Soát kế hoạch
- Agent phụ chỉ đọc: không ra ngoài Phạm vi; 11 góp ý (gộp hàm, dùng `trongGiaoDich`/`loiGhi`, ca thử thiếu, đường song song) — đã đưa
  vào `ke_hoach.md` mục "Vòng soát 1".
- Dừng ở bước 3: chờ chủ quán duyệt kế hoạch + trả lời Câu hỏi 1–3.
- `kiem_tra_truoc_khi_giao.js` E14: "route ghi không qua loiGhi = 50 — đã dọn bớt 1 chỗ → HẠ NGUONG xuống 50". KHÔNG do KHO-1: phép chỉ quét
  `server/routes/`, file duy nhất KHO-1 đụng ở đó là `backup.js` — cắt đúng `quetRouteGhi` chạy trên `backup.js` gốc và mới đều ra 1 chỗ
  (`POST /restore`). Số 50 có từ trước nhánh này; máy không hạ ngưỡng (không phải chỗ mình dọn).
- `cong_cu/thu_P3.js:633` đòi `thu_P3.js` đứng CUỐI mảng `chayBaiThat` — phiếu dặn "thêm tên bài vào cuối mảng" thì đỏ. Đã gọi
  `chayBaiThat('cong_cu/thu_KHO1.js')` một dòng riêng ngay dưới `thu_DOISOAT1.js` (cùng tiền lệ). Phép của thu_P3 dò đúng vị trí — khuôn K2.
- Máy mây này còn 7 file rác trong `/tmp/pos_nhap_sx/` (đột biến `BV-XOA-FILE-TAM` lần chạy đầu, khi bài còn dùng thư mục tạm chung);
  người gác không cho xoá ngoài nháp — vô hại, máy mây tự bỏ. Bài thử nay dùng thư mục tạm riêng từng lần chạy.

## Bước 4–7 (28.10, làm tiếp sau khi chủ quán duyệt `e4f927f`)
- Bước 1 lượt này: nhánh `viec/KHO-1`, cây sạch; HEAD `e4f927f` = FETCH_HEAD `e4f927f` (hook mở phiên đã kéo `cd69a8d → e4f927f`).
  `git log --oneline -3`: `e4f927f PHIEU: KHO-1 duyet ke hoach 28.10 (...)` · `cd69a8d KHO-1: ke hoach (cho duyet) + trang thai, 3 cau hoi` · `40ab1cf PHIEU: KHO-1`.
- Bài thử `cong_cu/thu_KHO1.js` viết TRƯỚC, đỏ trên gốc (`bang_chung_do.txt`), sau vá 94/94, lặp 3 lần xanh (ca song song B8, E17, F20).
- Bài thử bắt được 2 lỗi thật của chính bản vá đầu: (1) `REFERENCES pos_products(id)` — libsql BẬT khoá ngoại, khôi phục Excel xoá
  `pos_products` → 500 giữa chừng (J3) → bỏ mọi khoá ngoại trong `001_kho.js`, toàn vẹn giữ ở code; (2) thư mục tạm nhập SX dùng chung
  giữa các lần chạy song song → F14 đỏ oan khi chạy đột biến → bài đặt thư mục riêng.
- `npm test` 74/0 · `node kiem_tra_truoc_khi_giao.js --day-du` 78/0 (dist khớp src).

### Chỗ vá → đột biến (`python3 viec/KHO-1/dot_bien.py` — ĐỐI CHỨNG xanh 94/0 · TỔNG 29 · BẮT 29 · SỐNG 0 · HỎNG 0 · LẠC 0)
| Chỗ vá | Đột biến (bài bắt ở ca) |
|---|---|
| `tinh.trienKhai` — vòng lặp | `VS-VONG-CHI-TU-THAN` (E4) |
| `tinh.trienKhai` — lồng nhiều tầng | `VS-TRIEN-KHAI-MOT-TANG` (E1) |
| `tinh.chuanHoaTen` — GIỮ dấu | `VS-GOP-BO-DAU` (E7) |
| `duong.js` PUT công thức — chặn vòng | `BV-VONG-PUT` (E13) |
| `duong.js` tên trùng → 409 | `VS-TEN-TRUNG-500` (I4) |
| `database.js` gọi bộ chạy | `BV-NANG-CAP-GOI` (B1) |
| `chay.js` câu đầu INSERT khoá chính | `VS-BO-KHOA-CHAY-DOI` (B8) |
| `chay.js` bước hỏng rollback | `BV-ROLLBACK-BUOC-HONG` (B3) |
| `chay.js` bước hỏng thì dừng | `BV-DUNG-KHI-HONG` (B3) |
| `chay.js themCot` chép sao lưu | `BV-SAO-LUU` (B5) · `VS-SAO-LUU-MOI-BANG` (B6) |
| `duong.js` 503 NANG_CAP_HONG | `BV-503` (B9) |
| `001_kho.js` CHECK kiểu | `VS-CHECK-KIEU` (C2) |
| `nhapSx` không ghi đè / không nhân đôi | `VS-NHAP-GHI-DE` (F15) · `BV-CONG-THUC-DA-CO` (F15) |
| `nhapSx` trùng mã khác món | `BV-TRUNG-MA` (F1) |
| `nhapSx` món tạo ẩn | `VS-MON-TAO-HIEN` (F9) |
| `nhapSx` giá < 1.000 → trống | `VS-GIA-NHO` (F5) |
| `nhapSx` gộp lấy giá lớn nhất | `VS-GOP-GIA-DAU` (G2) |
| `nhapSx` làm tròn 6 chữ số | `VS-LAM-TRON` (G4) |
| `nhapSx` công thức nhóm khác theo sx_products.id | `VS-SX-THEO-LEGACY` (G5) |
| `duong.js` xoá file tạm | `BV-XOA-FILE-TAM` (F14) |
| quyền: nhập SX / công thức / thêm nguyên liệu | `BV-QUYEN-NHAP` (F19) · `BV-QUYEN-CONG-THUC` (I15) · `VS-QUYEN-SUA-NL` (I2) |
| `duLieu.xoaNguyenLieu` kiểm đang dùng | `BV-XOA-KIEM-DUNG` (I8) |
| `backup.js` sao lưu bảng kho | `BV-SAO-LUU-BANG` (J2) |
| `backup.js` khôi phục kho chỉ khi trống / không khôi phục pos_nang_cap | `BV-KHOI-PHUC-KHO` (J3) · `BV-KHOI-PHUC-NANG-CAP` (J4) |
