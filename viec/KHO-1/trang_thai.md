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

## Soát độc lập — vòng 1 (`/ra-soat`, 28.10, mốc 40ab1cf^, HEAD 4155f2b) — báo cáo nguyên văn

```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. server/kho/nhapSx.js:166-170 — món SX tạo dòng pos_products is_active = 0, nhưng cả hệ thống không có đường nào bật lại is_active = 1 — K5
   (nặng, đường bán). products.js:164 / :212 khi dòng đã có chỉ UPDATE price; màn Kho không có nút bật. Đặt giá → layMenuQuay trả
   sellable: true (quầy + App KH hiện món) nhưng POST /orders lọc is_active = 1 (orders.js:349, :354) → 400. Trước KHO-1 đặt giá món chưa
   có dòng thì INSERT is_active = 1 (products.js:170) và bán được ngay.
2. cong_cu/thu_KHO1.js:310-313, :401-402 (K1, K2) — K1 chỉ đo menu dự phòng; đường SX nối thật và /api/kh/menu không đo; K2 chỉ bán CT1,
   không có ca "món tạo ẩn → đặt giá → tạo đơn" — K3.
3. server/kho/nhapSx.js:107 — chỉ cảnh báo 0 < giá < 1.000; giá 0 / trống không có cảnh báo (phiếu F đòi) — tên ca F2 nói "giá", máy chỉ
   khoá GIA_BAT_THUONG — K4/K3.
4. server/routes/backup.js:173, :211, :352 — bước nâng cấp hỏng (thiếu bảng kho_*) → /info, /export-all 500, /restore luôn 500 (khoTrong
   không bọc lỗi) — K5/K4.
5. client/src/pages/Kho/NguyenLieu.jsx:100 và :37 — ô "Thiếu thông tin" đếm `n.dang_dung && la(n)`, danh sách lọc `la(n)` — hai biểu thức
   cho "có gì để làm" và "làm" (BAN-HANG-1) — K4.
6. server/kho/nhapSx.js:130, :168-171 — trùng mã chỉ so với POS đã có, không so trong cùng lô; món 2 cùng mã bị bỏ, SELECT id theo code trả
   món 1 → công thức món 2 nhét vào món 1, im lặng — K4.
7. server/kho/duLieu.js:116 — COALESCE(excluded.nhom_id, …) → chọn "—" không bỏ được nhóm — nhỏ.
8. server/kho/nhapSx.js:167 — chú thích "quầy chỉ bán khi price > 0 (routes/products.js) — chủ quán đặt giá rồi bật" sai hai chỗ — K1.
NGHI NGỜ: chay.js:31-44 máy thứ hai chờ BEGIN quá ~1,55 s (Turso, 13 câu) → lỗi BẬN → hong → 503 suốt đời tiến trình; nhapSx.js:37 không
   ?mode=ro, -wal/-shm có thể còn; nhapSx.js:158/:164 nhóm "Dược liệu" chủ quán tạo trước (ten_sx NULL) → nguyên liệu nhập không có nhóm;
   duLieu.js:64 nhân viên đọc được gia_nhap (giá vốn, LUAT §4); khôi phục Excel khi kho có dữ liệu thay pos_products → dòng kho trỏ id không
   còn, GET /trien-khai gặp vòng do khôi phục → 500; trang_thai.md thiếu CHƯA KIỂM, cong.js chay, 1–3 thao tác thử tay.
NGHIỆM THU: 14/17 · thiếu: F (cảnh báo giá 0), K (menu SX nối thật, /api/kh/menu, đặt giá món ẩn rồi bán), Đã duyệt-3 (không có đường bật bán).
CHƯA SOÁT ĐƯỢC: Turso thật; file SX 09.10; thao tác tay giao diện; mới chạy 3/29 đột biến; chưa chạy cong.js chay; lỗi 1 kết luận từ đọc code.
BÀI HỌC: KHOÁ ca "tạo ẩn → PUT /products/price → POST /orders"; KHOÁ K1 đo cả SX nối thật + /api/kh/menu; KHOÁ "nâng cấp hỏng → sao lưu
   vẫn chạy"; KHOÁ tách ca giá 0; KHOÁ hai món cùng mã trong một lô. NGUYÊN TẮC (K5 mới): tạo dữ liệu ở trạng thái chặn thì phải chỉ ra
   đường thật đưa nó ra + ca đi hết đường. NGUYÊN TẮC (K4): thêm bảng mà nhánh hỏng làm bảng không tồn tại → grep mọi chỗ duyệt danh sách
   bảng. NGUYÊN TẮC (K1): chú thích "file X chặn Y" phải mở đúng file X.
```

### Xử lý vòng 1 (vòng sửa 1/3) — mỗi lỗi một ca đỏ trước (`bang_chung_do.txt` mục (a)), đột biến mới, 103/103, đột biến 38/38 BẮT
| Lỗi soát | Sửa | Ca · đột biến |
|---|---|---|
| 1 không có đường bật bán | `PUT /api/pos/kho/san-pham/:id/ban` (chủ quán; bật cần price > 0 — một câu UPDATE kiểm changes, 400 `CHUA_CO_GIA`) + nút "Bật bán ở quầy / Ẩn khỏi quầy" ở chi tiết món. `products.js` (Cấm) không đụng — món ẩn giữ đúng phiếu Đã duyệt 3 | K4–K7 · `VS-BAT-BAN-KHONG-GIA`, `BV-QUYEN-BAT-BAN` |
| 2 bài phủ thiếu | K1b menu khi SX nối thật (cùng `layMenuQuay` của `/api/kh/menu`): mỗi món giữ nguyên `sellable` / có giá — xanh cả gốc lẫn vá (K5 "phải KHÔNG đổi"; `price` null → 0 không đổi hiển thị: Sales.jsx:1044-1045 "Chưa có giá" khi không > 0, App KH lọc `sellable`) ; K5–K7 đi hết đường đặt giá → bật → bán | K1b, K7 |
| 3 thiếu cảnh báo giá 0 | một dòng `THIEU_GIA` gộp tên các nguyên liệu chưa có giá | F2 · `BV-THIEU-GIA` |
| 4 sao lưu sập khi thiếu bảng | `bangDangCo()` cho /info, /export-all; xem trước đếm `.catch`; `khoTrong` lỗi → coi như kho CÓ dữ liệu (bỏ qua bảng kho) | J6 · `BV-SAO-LUU-BANG-THIEU`, `BV-KHO-TRONG-LOI` |
| 5 hai vị từ "Thiếu thông tin" | một hàm `thieu_(ma, n)` cho cả số đếm lẫn lọc | (giao diện — thử tay) |
| 6 trùng mã trong lô | `maSeTao` trong `lapKeHoach` | F1, G4 · `VS-TRUNG-MA-LO` |
| 7 không bỏ được nhóm | `nhom_id = excluded.nhom_id` (PUT thay cả kiểu + nhóm + công thức) | I17 · `VS-BO-NHOM-GIU` |
| 8 chú thích sai | sửa chú thích trỏ đúng `getFallbackProducts` / `orders.js` / đường bật bán | — |
| Nghi ngờ nhóm tạo trước | `ON CONFLICT(ten) DO UPDATE SET ten_sx = COALESCE(...)` cho cả hai bảng nhóm | F21, F7 · `VS-NHOM-CO-SAN` |
| Nghi ngờ giá vốn với nhân viên | GET nguyên liệu bỏ `gia_nhap` khi vai trò staff (LUAT §4 — chọn phía ít lộ, đảo được); giao diện không hiện giá / ô thiếu thông tin cho staff | I16 · `BV-AN-GIA` |
| Nghi ngờ -wal/-shm | xoá thêm `-journal`, `-wal`, `-shm` cạnh file tạm; `?mode=ro` libsql 0.4 KHÔNG nhận ("URL_PARAM_NOT_SUPPORTED: Unknown URL query parameter mode" — đã thử) → chỉ chạy SELECT / PRAGMA, file là bản tạm riêng | F14 |
| Đơn giản: `doiDonVi` chỉ bài thử gọi; `gonTen` chép | máy chủ trả `luong_hien` (= `tinh.doiDonVi`) ở công thức + "Tính cho N phần", giao diện hiện số đó; `tinh.gonTen` dùng chung | E6 |
Chưa sửa (ghi CHƯA KIỂM ở báo cáo): máy thứ hai chờ BEGIN quá 1,55 s trên Turso; khôi phục Excel thay `pos_products` để lại dòng kho trỏ id cũ.
