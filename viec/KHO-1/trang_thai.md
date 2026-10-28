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

## Soát độc lập — vòng 2 (`/ra-soat`, 28.10, HEAD 48c022a) — báo cáo nguyên văn (rút gọn xuống dòng)

```
KHÔNG ĐẠT
(Đã chạy: thu_KHO1 103/0; 9 đột biến vòng 1 bắt 9; --goc 25a7c99 91/12 khớp bang_chung_do; --day-du PASS 78 · FAIL 0 · 1 cảnh báo E14 có
 từ trước. Người soát tự dựng đột biến `const ban = 1;` ở duong.js:128 (nút "Ẩn" mất tác dụng) → bài vẫn 103/0: SỐNG.)
LỖI TÌM ĐƯỢC:
1. Nút "Ẩn khỏi quầy" ghi is_active = 0 cho cả món đang bán (duong.js:127-139, SanPham.jsx:184, bấm một lần không hỏi lại). Trước KHO-1
   không đường nào ghi is_active = 0. Khi SX nối thật, layMenuQuay (products.js:91, :109-112) không lọc is_active, gán sellable = price > 0
   → quầy (Sales.jsx:1044) và /api/kh/menu (kh/index.js:146) vẫn hiện, POST /orders (orders.js:349, :354) trả 400; món lấy từ gói cũng bị
   chặn. Chiều ẨN ngoài phiếu, không ca thử (đột biến SỐNG). Cách gọn: bỏ chiều ẩn — K4 + K5, nặng.
2. Từ lúc đặt giá tới lúc bật, quầy và App KH thấy món "bán được" nhưng tạo đơn 400: món tạo ẩn (nhapSx.js:178) đặt giá qua
   PUT /products/price (products.js:163-166 chỉ UPDATE giá) → menu SX sellable: true, orders.js:349 vẫn chặn. Lỗi 1 vòng 1 mới bịt bằng
   LỜI DẶN (cảnh báo MON_TAO_AN nhapSx.js:139), chưa KHOÁ; cửa sổ lệch không ghi ở trang_thai.md. Chạm products.js (Cấm) và Đã duyệt 3
   → hỏi chủ quán. Dữ kiện: hệ thống vốn có dòng is_active = 1, price = 0 (seed database.js:1130, sync-from-sx products.js:269); tiền đề
   Đã duyệt 3 ("tạo dòng sẽ hiện lên menu dự phòng") chỉ đúng khi món đã có giá — K5/K1.
3. Ca K5 tên "…món vẫn ẩn ở menu dự phòng" chỉ kiểm status, không đo menu; K1b chỉ đo menu trước khi đặt giá — K3.
4. Ẩn giá nhập theo danh sách cấm (role === 'staff', duong.js:34); máy chủ nhận vai trò bất kỳ (users.js:38), có nhắc 'admin'
   (users.js:193) → dùng danh sách cho phép như checkRole — K4, nhẹ.
5. duong.js:131 ghi pos_products.updated_at = getNow() (giờ VN, có 'T'), mọi chỗ khác datetime("now") UTC (products.js:164/211/261) — K7.
6. Ba phép "có giá": bật SQL price > 0 (duong.js:131, chuỗi lọt), menu typeof number && > 0 (products.js:110), tạo đơn !(price <= 0)
   (orders.js:365) — K4.
7. "Thiếu giá" NguyenLieu.jsx:10 chỉ đếm null; gõ tay 0 lưu 0 (duLieu.js:26) không bị đếm; phiếu H "đếm giá 0" — K4, nhẹ.
8. backup.js .catch(() => [{ n: 1 }]) coi lỗi là "kho có dữ liệu", lời báo sai sự thật — K1, nhẹ.
9. Hai ca cùng mã E10 trong thu_KHO1.js — K3, nhẹ.
NGHI NGỜ: PUT /san-pham/:id không kiểm nhom_id có thật; themNhom ON CONFLICT(ten) — hai nhóm SX cùng tên hiển thị; nhóm khác hoa/thường
   (ten UNIQUE BINARY) sinh hai nhóm; khoTrong chỉ đếm kho_phieu + kho_nguyen_lieu (đúng phiếu) → kiểu / nhóm / nhà cung cấp đặt khi kho
   trống nguyên liệu bị file ghi đè; ẩn giá nhập với nhân viên là máy tự chọn — nên chủ quán xác nhận; số "Thiếu thông tin" tính toàn bộ,
   danh sách lọc thêm tab + tìm; trang_thai.md chưa có CHƯA KIỂM riêng, cong.js chay, 1–3 thao tác thử tay.
NGHIỆM THU: 15/17 · thiếu: K (nút Ẩn + cửa sổ đặt giá–chưa bật, không ca), H (chỉ code, chưa ghi thao tác thử tay).
CHƯA SOÁT ĐƯỢC: Turso thật, file SX 09.10, thao tác tay, mới chạy 9 + 1 đột biến, chưa chạy cong.js chay, lỗi 1–2 kết luận từ đọc code.
BÀI HỌC: KHOÁ bất biến "layMenuQuay trả sellable: true thì POST /orders phải nhận" (bat_bien.js giả lập); KHOÁ K5 đo đúng điều tên ca nói,
   ca / gỡ chiều Ẩn kèm đột biến "ban luôn 1"; NGUYÊN TẮC K4: ghi giá trị MỚI vào cột CŨ → grep mọi chỗ đọc, kể cả chỗ KHÔNG lọc cột đó;
   NGUYÊN TẮC K5: sửa lỗi soát chỉ thêm đúng chiều cần; NGUYÊN TẮC K4: cổng "có giá" mới cùng biểu thức với chỗ dùng.
```

### Xử lý vòng 2 (vòng sửa 2/3) — ca đỏ trước (`bang_chung_do.txt` vòng 2 (a)), 108/108, đột biến 43/43 BẮT
| Lỗi soát | Sửa | Ca · đột biến |
|---|---|---|
| 1 nút Ẩn | BỎ chiều ẩn: đường đổi thành `PUT /kho/san-pham/:id/bat-ban` chỉ `SET is_active = 1`; nút chỉ hiện với món đang ẩn | K8 · `VS-BAT-BAN-DAO` |
| 2 cửa sổ đặt giá → chưa bật | **CHƯA SỬA — Câu hỏi 4** (chạm `products.js` Cấm + Đã duyệt 3) | K5 khoá phần không đổi được: menu dự phòng không hiện, tạo đơn 400 |
| 3 K5 không đo menu | K5 đo menu dự phòng (không có `tea_1`) | K5 |
| 4 danh sách cấm | `!['owner', 'manager'].includes(role)` | I18 · `VS-AN-GIA-DS-CAM` |
| 5 updated_at lệch quy ước | đường bật không ghi `updated_at` nữa | — |
| 6 ba phép "có giá" | bật dùng `typeof(price) IN ('integer','real') AND price > 0` = nghĩa của menu (products.js:110) | K9 · `VS-CO-GIA-SQL` |
| 7 thiếu giá 0 | vị từ "thiếu giá" = null HOẶC 0 | (giao diện) |
| 8 lời báo khôi phục | `demKho` null → `code: 'KHO_KHONG_DEM_DUOC'`; có dữ liệu → `KHO_CO_DU_LIEU`; pos_nang_cap → `NANG_CAP_KHONG_KHOI_PHUC` | J3, J7 · `VS-LY-DO-KHOI-PHUC` |
| 9 trùng mã ca | ca bảng 32 tên đổi thành G0 | — |
| Nghi ngờ nhóm rác | `demThieu` kiểm `nhom_id` có thật | E18 · `BV-NHOM-RAC` |
| Nghi ngờ số "Thiếu thông tin" lệch tab / tìm | bấm ô → về tab Tất cả + xoá ô tìm | (giao diện) |
Chưa sửa (chỉ ghi): hai nhóm SX cùng tên hiển thị / khác hoa-thường (dữ liệu thật chỉ có 3 nhóm khác nhau: Nước ép · Trà thảo mộc · CÀ PHÊ);
khôi phục khi kho trống nguyên liệu nhưng đã đặt kiểu / nhóm (đúng định nghĩa "kho trống" của phiếu điểm 4).

## Câu hỏi (vòng 2 — DỪNG chờ chủ quán)
4. **Món SX tạo ẩn: từ lúc đặt giá tới lúc bấm "Bật bán", quầy và App KH thấy món bán được nhưng bấm bán thì báo "đã ngừng bán".**
   Đã đọc: menu khi SX nối thật (`server/routes/products.js` `layMenuQuay`) không lọc `is_active` và cho `sellable` khi giá > 0; tạo đơn
   (`server/routes/orders.js:349`, `:354`) chỉ nhận `is_active = 1`; đặt giá (`products.js` `PUT /price`) với dòng đã có chỉ đổi giá.
   Trước KHO-1, đặt giá món chưa có dòng thì tạo dòng `is_active = 1` → bán được ngay. Hệ thống vốn đã có dòng `is_active = 1, price = 0`
   (seed `database.js`, `POST /products/sync-from-sx`) — món giá 0 không bán được và hiện "Chưa có giá" ở quầy (`Sales.jsx:1044-1045`),
   App KH lọc `sellable`. Chọn một:
   (a) **Tạo món SX với `is_active = 1`, giá 0** (như seed / sync-from-sx đang làm) — đặt giá xong là bán được ngay, đúng như cũ; đổi lại
       khi mất SX menu dự phòng hiện thêm các món này dưới dạng "Chưa có giá" (không bấm được). Bỏ nút "Bật bán". Máy đề xuất (a): không
       còn cửa sổ lệch, không thêm thao tác cho chủ quán, không đụng file Cấm.
   (b) Giữ ẩn (phiếu Đã duyệt 3) + sửa `products.js` (file Cấm) để `PUT /price` cũng bật món — cần chủ quán mở Phạm vi.
   (c) Giữ như hiện tại (ẩn + nút "Bật bán" ở Quản lý kho) và chấp nhận cửa sổ lệch; chủ quán dặn nhân viên.
5. **Giá nhập (giá vốn) với nhân viên:** máy đang ẨN với mọi vai trò khác chủ quán / quản lý (LUAT_XAY_APP §4, chọn phía ít lộ). Phiếu I
   chỉ ghi "nhân viên chỉ xem nguyên liệu". Giữ ẩn hay cho nhân viên thấy giá?

## Vòng sửa 3/3 (28.10, `/lam-viec KHO-1 tiep` — làm theo phiếu mục 7–9)
- Bước 1 lượt này: nhánh `viec/KHO-1`, cây sạch; HEAD `48b16a9` = FETCH_HEAD `48b16a9` — bằng nhau, không kéo. `git log --oneline -3`:
  ```
  48b16a9 PHIEU: KHO-1 tra loi cau 4 (a tao hien gia 0) + cau 5 (tam an gia nhap)
  b7e06fe KHO-1: bao cao soat vong 2 + xu ly; cau hoi 4-5 cho chu quan (dung cho)
  e5a4e57 KHO-1: vong soat 2 — chi chieu bat ban (bat-ban), co gia cung nghia menu, gia nhap theo danh sach cho phep, kiem nhom co that, ly do bo qua khoi phuc dung; Thieu gia dem ca 0; build dist; dot bien moi
  ```
- Đổi model giữa phiên: ~09:14 28.10, ở bước 1 (đối chiếu bản chụp) — dòng ghi công của commit đổi sang model khác. Kết quả trước / sau đều do
  máy chạy lại trong lượt này (bài thử, đột biến), không chép tay từ lượt trước.
- Bài thử sửa TRƯỚC (commit `d5005ab`), đỏ 9 ca trên `server/` của `48b16a9` (`bang_chung_do.txt` vòng sửa 3); sau vá 107/0.
- `npm test` 74/0 · `--day-du` 78/0 (dist khớp src) · cảnh báo E14 có từ trước nhánh (xem Soát kế hoạch).

| Phiếu mục 7 | Sửa | Ca · đột biến |
|---|---|---|
| món SX chưa có dòng → `is_active = 1`, giá 0, giữ tên + nhóm + khoá nối | `nhapSx.js` `ghiKeHoach` (chú thích sửa theo đúng `layMenuQuay` / `orders.js`) | F9, K1, K4 · `BV-MON-TAO-AN`, `VS-MON-TAO-GIA-NULL`, `VS-MON-TAO-MAT-KHOA` |
| bỏ `MON_TAO_AN`; lời "Món <tên> đã tạo, chưa có giá — đặt giá là bán được" | cảnh báo `MON_CHUA_GIA`; số đếm `mon_tao` (màn Nhập SX: "món tạo mới (chưa có giá)") | F1, F2, F2b · `BV-CANH-BAO-MON` |
| bỏ đường + nút "Bật bán" | gỡ `PUT /kho/san-pham/:id/bat-ban` (`duong.js`) + nút ở `SanPham.jsx` | K7 |
| đặt giá qua `PUT /products/price` → `sellable: true` VÀ `POST /orders` nhận | không đụng `products.js` / `orders.js` | K5 · K6 = bất biến: MỌI món menu dự phòng + menu SX báo bán được → tạo đơn (đúng thân quầy gửi) nhận |
Đột biến bỏ cùng đường bị gỡ: `VS-BAT-BAN-KHONG-GIA`, `BV-QUYEN-BAT-BAN`, `VS-BAT-BAN-DAO`, `VS-CO-GIA-SQL`, `VS-MON-TAO-HIEN` (đảo nghĩa → `BV-MON-TAO-AN`).
`python3 viec/KHO-1/dot_bien.py` → ĐỐI CHỨNG XANH 107/0 · TỔNG 42 · BẮT 42 · SỐNG 0 · HỎNG 0 · LẠC 0.
Toàn bộ tên đột biến hiện có (42): VS-VONG-CHI-TU-THAN, BV-VONG-PUT, VS-TRIEN-KHAI-MOT-TANG, VS-GOP-BO-DAU, VS-TEN-TRUNG-500, BV-NANG-CAP-GOI,
VS-BO-KHOA-CHAY-DOI, BV-ROLLBACK-BUOC-HONG, BV-DUNG-KHI-HONG, BV-SAO-LUU, VS-SAO-LUU-MOI-BANG, BV-503, VS-CHECK-KIEU, VS-NHAP-GHI-DE,
BV-CONG-THUC-DA-CO, BV-TRUNG-MA, VS-GIA-NHO, VS-GOP-GIA-DAU, VS-LAM-TRON, VS-SX-THEO-LEGACY, BV-XOA-FILE-TAM, BV-QUYEN-NHAP, BV-QUYEN-CONG-THUC,
VS-QUYEN-SUA-NL, BV-XOA-KIEM-DUNG, BV-SAO-LUU-BANG, BV-KHOI-PHUC-KHO, BV-KHOI-PHUC-NANG-CAP, VS-TRUNG-MA-LO, BV-THIEU-GIA, VS-NHOM-CO-SAN,
BV-SAO-LUU-BANG-THIEU, BV-KHO-TRONG-LOI, VS-AN-GIA-DS-CAM, BV-NHOM-RAC, VS-LY-DO-KHOI-PHUC, BV-AN-GIA, VS-BO-NHOM-GIU, BV-MON-TAO-AN,
VS-MON-TAO-GIA-NULL, VS-MON-TAO-MAT-KHOA, BV-CANH-BAO-MON.

### Phát hiện (vòng 3 — ngoài Phạm vi, không sửa)
- Món SX không có `legacy_id` (Cà Phê Đen, CF01 — phiếu mục 3 dặn để `sx_product_id` trống) nay hiện ở menu dự phòng dạng "Chưa có giá"
  (`caphe_null`), nhưng KHÔNG đặt giá / bán được qua đường thường: `PUT /products/price` tra `sx_product_id = ?` (`products.js:157`) và
  `POST /orders` tra `sx_product_id = ?` (`orders.js:349`) — so với NULL không bao giờ khớp. Trước KHO-1 món này không có trong POS. Không phải
  cửa sổ "bán được mà đơn 400" (K6 khoá: giá 0 → sellable false). Sửa cần đụng `products.js` / `orders.js` (Cấm) — chat soát / KHO-3 quyết.

### Thao tác thử tay (chủ quán, trên điện thoại, bản thử)
1. Quản lý kho › Nhập từ SX → chọn bản sao lưu SX → xem trước có dòng "Món … đã tạo, chưa có giá — đặt giá là bán được" → Nhập.
2. Màn Bán hàng: món vừa tạo hiện "Chưa có giá", bấm không vào giỏ; màn Sản phẩm (giá) đặt giá món đó → quay lại Bán hàng bán được ngay.
3. Quản lý kho › Sản phẩm › bấm một món: không còn nút "Bật bán ở quầy"; ô "Tính cho N phần" ra lượng từng nguyên liệu.
