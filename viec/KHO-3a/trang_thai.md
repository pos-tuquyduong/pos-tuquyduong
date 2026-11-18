# KHO-3a — trạng thái

## Bước 1 — đối chiếu bản chụp (18.11)
- Nhánh `viec/KHO-3a`; cây sạch; `git fetch origin viec/KHO-3a` → HEAD = FETCH_HEAD = `7fd9986` (không cần kéo, không có gì để gộp).
- `git log --oneline -3`:
  - 7fd9986 PHIEU: KHO-3a cap nhat du lieu that 18.11 sau khi nhap danh muc SX
  - 22281f8 PHIEU: KHO-3a A3b doi ten 4 mon nuoc ep theo SX (chu quan 18.11 12:56)
  - 6440c81 PHIEU: KHO-3a Pham vi them DonApp.jsx (canh bao B3c)
- Kế hoạch của phiên trước chưa từng được push (không có trong lịch sử origin) → mất cùng máy cũ; `ke_hoach.md` viết lại từ đầu trong phiên này.

## Bước 3 — kế hoạch
- `viec/KHO-3a/ke_hoach.md` — gồm A3b, dữ liệu thật 18.11, trả lời Câu 1 · 3 · 4 của chủ quán (mục 8).
- DỪNG chờ chat soát kế hoạch (phiếu: "Chờ duyệt kế hoạch").
- Soát kế hoạch bằng agent chỉ đọc: 4 lỗi đường song song + ca thiếu → đã sửa vào kế hoạch (mục 8b của `ke_hoach.md`).

## Bước 1 (lượt 2 — sau soát chat 18.11 18:50, chủ quán DUYỆT)
- Hook mở phiên kéo `4cb9feb5 → 7b8b1dbb` (chat ghép main bc16e140 BO-MAN-CU-1). `git log --oneline -3` lúc bắt đầu: 7b8b1dbb · 4cb9feb5 · bc16e140.
- Kế hoạch cập nhật theo soát chat: mục 10 của `ke_hoach.md` (số dòng orders.js sau ghép, K4 mọi chỗ đọc kho_phieu, Câu 2, A3b, dữ liệu 33 nguyên liệu, đo).

## Bước 4 — bài thử đỏ trước
- `cong_cu/thu_KHO3a.js` (MỚI). Trên server GỐC `7b8b1dbb` (bài HIỆN TẠI, `python3 viec/KHO-3a/dot_bien.py --goc 7b8b1dbb`): **30 đạt · 82 hỏng · 112 ca** → ĐỎ.
  Chép nguyên vào `bang_chung_do.txt`. Trên code đã vá (HEAD f8337191): **120 đạt · 0 hỏng · 120 ca**.
- `dot_bien.py`: 31 đột biến (VS-/BV-) — CHƯA CHẠY (chạy sau khi npm test xanh — đối chứng phải xanh).

## Bước 5 — đã sửa (commit 99034a0b · 11853a94 · 8ba65c04 · de713444 · 7bf5c86e)
- `server/kho/banHang.js` (mới, MỘT chỗ cho luật bán theo kho), bước `031_ban_theo_kho.js`, `032_ten_mon_sx.js` (đổi số 18.11 — GIAO-3 đã dùng 030); `duLieu.js` (themPhieu `donHangId`, phiếu bán không
  huỷ / sửa tay — Câu 4, danh sách phiếu ẩn phiếu bán), `duong.js` (`cho_ban_thieu`, `GET /mon-chua-san`).
- `orders.js` (bỏ checkStock / outStockFIFO / inStockReturn; `truKhoDon` trong thân `taoDonGoc`, trong giao dịch; huỷ / xoá `huyPhieuBan`) — KHÔNG thêm lời gọi
  `taoDon(`; `products.js` (menu từ pos_products, POST / PUT món, sync-from-sx 410); `giuCho.js` (kiểm đủ hàng trong giao dịch tạo phiên; ly_do nêu món);
  `thanh-toan.js` (lưới B3c phiên quầy); `donApp.js` (mã kho → HET_HANG / MON_KHONG_BAN kèm ma; câu "Món … vừa hết"); `manKhach.js` (bỏ bộ nhớ 20 s).
- Gỡ SX: xoá `stock.js`, `doi-chieu.js`, `sync.js`, `utils/doSoNo.js`; `index.js` 410 `SX_DA_NGAT`; `so-no.js` luôn 0; `registrations.js` xuất SX 410;
  `damages.js` return_stock 400 `HOAN_KHO_SX_DA_BO`; `backup.js` bỏ hàm SX (không ai gọi); `sxApi.js` chỉ còn hàm ném (bước 020 cần nạp); `ketNoiKho.js` bỏ `diaChiSX`.
- Giao diện: Kho › Sản phẩm (thông tin bán + thêm món + cho bán khi thiếu), tab "Chưa sẵn sàng bán", nhãn phiếu bán, Bán hàng món chưa công thức mờ,
  Đơn App dòng hoàn vì hết hàng tô đỏ. Build `client/dist`.
- `HOP_DONG_API_KH.md` v18 (không đổi trường); `kiem_tra_truoc_khi_giao.js`: K2 đổi sang "ketNoiKho không còn SX", thêm K4 (mẫu SX vắng mặt),
  `chayBaiThat('cong_cu/thu_KHO3a.js')`. Thư App KH: `TRA_LOI_POS_KHO3a.md`.

## Đo trước / sau (chat mục 6)
- Giả lập S4 trên GỐC 7b8b1dbb (chạy riêng, 3 lần): **46,4 · 46,2 · 46,1 s** — 33 kịch bản · 18 bất biến · ĐẠT. Trên HEAD: **CHƯA ĐO** (giả lập chưa sửa được — Câu hỏi).
- "Đã nhận tiền" (taoPhien + chotPhien tiền mặt, 30 lần, kho file cục bộ, SX tắt ở gốc): GỐC trung vị **11 ms · 20 câu CSDL / lần**;
  HEAD trung vị **11 ms · 33 câu CSDL / lần**. Thời gian cục bộ không đổi, nhưng **số câu CSDL +65 % (> 30 %)**: trên Turso mỗi câu là một chuyến mạng
  (≈ +13 chuyến / lần thu). Đổi lại bỏ 2 lời gọi mạng sang SX mỗi món (checkStock + outStockFIFO, mỗi lời tới 8 s khi SX chậm). Đề xuất (nếu chủ quán
  muốn): gộp hai lượt đọc kho (lúc tạo phiên và lúc chốt) — việc tối ưu sau, không đổi luật. Chưa đo trên Turso thật (CHƯA KIỂM).

## Câu hỏi
**Câu 5 — Phạm vi thiếu tên file luật (người gác chặn G-LUAT).** `npm test` hiện đỏ: 76 đạt · 48 hỏng — 48 bài cũ bán món trong kho thử chưa có công thức / lô
nên bị chặn `CHUA_CO_CONG_THUC` (đúng luật mới). Theo Câu 1, mỗi bài cũ thêm 1 dòng gọi hàm dựng món thử chung. Nhưng người gác chặn:
`[G-LUAT] file luật chỉ sửa được khi mục Phạm vi ghi ĐÚNG TÊN file (glob chung không tính) · cong_cu/gia_lap/monThu.js` — `cong_cu/gia_lap/**` và 4 bài chạy thật
là file luật (`tu_chay/cau_hinh.json` `file_luat`), phiếu chỉ ghi glob.
Đề xuất: chủ quán thêm vào `## Phạm vi` của phiếu ĐÚNG các dòng sau:
```
- cong_cu/gia_lap/monThu.js
- cong_cu/gia_lap/chay.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/thu_gia_lap.js
- cong_cu/thu_P20.js
- cong_cu/thu_P21.js
- cong_cu/thu_P26a.js
- cong_cu/thu_P26b.js
```
(monThu.js = hàm chung của Câu 1; chay / bat_bien / kich_ban = giả lập D4 — bỏ SX giả, I7 vân tay SX → I7 phiếu bán, KB24–25 → kịch bản kho, KHÔNG giảm số KB /
bất biến; thu_gia_lap.js chỉ đổi nếu nó canh SX giả; 4 bài P20/P21/P26a/P26b chỉ thêm 1 dòng gọi hàm, P26b có thể thêm ca theo E3 nếu canh SX.)
Máy dừng ở đây; bài cũ còn lại (glob `cong_cu/thu_*.js` mở được) sẽ sửa cùng lượt sau để mọi bài dùng CHUNG một hàm.

## Phát hiện
1. CLAUDE.md §5.3 ("`checkStock` bọc try/catch chỉ log là chủ ý") hết đúng sau KHO-3a — đề nghị chat sửa câu.
2. Hợp đồng `/api/kh` không có đường POS nhờ App gửi đẩy khi hoàn tiền vì hết hàng — thư `TRA_LOI_POS_KHO3a.md`.
3. `orders.js` vẫn ghi `pos_registrations` cho `is_new_customer` — GIAO-DIEN-2 xét cùng luật "không tạo khách ở quầy".
4. `routes/backup.js` có hàm `getProductsWithSxNames` KHÔNG ai gọi (code chết sẵn) — đã xoá cùng import SX.
5. Bước 020 trên kho MỚI (kho thử) luôn log "⏸ NÂNG CẤP 020 HOÃN — SX không trả lời" mỗi lần khởi động (production đã chạy xong nên không log). Không sửa bước cũ.
6. Bảo đảm "trả kho MỘT lần" có hai lớp trùng nhau (cổng trạng thái đơn + `AND trang_thai = 'da_duyet'` của phiếu) — đột biến gỡ MỘT lớp sẽ SỐNG; không đưa vào dot_bien.
