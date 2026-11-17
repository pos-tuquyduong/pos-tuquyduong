# KHO-3a — Ngắt hẳn SX: menu lấy từ sản phẩm POS, bán trừ kho POS

**Chờ duyệt kế hoạch:** viết `viec/KHO-3a/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Chủ quán 17.11 (chat POS bàn 39): ngắt kết nối với SX HOÀN TOÀN. POS vẫn đang gọi SX ở nhiều chỗ:
- mỗi lần tải menu (`server/routes/products.js`, `callSxApi('/api/pos/products-with-stock')`);
- mỗi món khi ghi đơn: kiểm tồn và trừ kho (`orders.js` `checkStock` / `outStockFIFO`);
- huỷ đơn (`inStockReturn`);
- `stock.js`, `damages.js`, `doi-chieu.js`, `backup.js`, `utils/doSoNo.js`, hàng chờ `pos_stock_pending`.

SX là máy khác ở xa. Mỗi lần gọi làm màn bán hàng chậm, và còn bắt POS phụ thuộc một hệ chủ quán đã bỏ (27.10).

Sau việc này:
- **Menu** lấy từ bảng `pos_products` của POS.
- **Bán** trừ kho POS (`server/kho/`, KHO-1/2a/2b) trong CÙNG giao dịch với đơn.
- **Không còn** dòng code chạy nào gọi SX.

Kiểm kê cuối ca và tỉ lệ ra để **KHO-3b** (việc sau). Topping là TOPPING-1.

**Dữ liệu thật hôm nay (17.11):** bảng kho của POS TRỐNG: 0 nguyên liệu, 0 công thức, 0 dòng `kho_san_pham`. `pos_products` có 14 món.
Việc này phải chạy đúng khi kho trống: mọi món là "chưa định lượng" → bán bình thường, không trừ gì, báo "chưa trừ kho".
Chủ quán sẽ nhập danh mục và công thức sau (Kho › Nhập từ SX bằng tệp sao lưu, KHO-1, rồi Sản phẩm & công thức).

## Nghiệm thu

### A. Menu từ POS
- A1 Danh sách món của quầy và `/api/kh/menu` (cùng hàm `layMenuQuay`) lấy từ `pos_products` đang bán, đúng thứ tự `sort_order`, đúng giá POS. KHÔNG gọi SX.
  - Hình dạng dữ liệu trả về giữ nguyên các trường màn mới và App KH đang dùng.
  - Đổi hoặc bỏ trường nào thì làm theo luật hợp đồng `HOP_DONG_API_KH.md`: tăng PHIEN_BAN, ghi nhật ký. Kế hoạch nêu rõ có đổi hay không.
- A2 Tồn hiện trên menu lấy từ kho POS:
  - món `lam_san` → tổng lô thành phẩm còn hạn;
  - món `pha_tai_cho` → số phần pha được từ nguyên liệu, hoặc không hiện số (kế hoạch đề xuất cách gọn nhất);
  - món chưa có dòng kho hoặc `chua_dinh_luong` → không có số, KHÔNG bịa số (ràng buộc §5.8: không 999).
  - Bỏ "tồn gần nhất của SX" (`ton_gan_nhat` / `ton_luc`) khỏi hiển thị. Cột giữ nguyên trong DB (chỉ thêm, không xoá).
- A3 Khoá nối SX của món (`sx_product_type`, `sx_product_id`) GIỮ NGUYÊN làm khoá giá và lịch sử đơn. Món mới thêm ở POS (không có khoá SX) vẫn bán được.

### B. Bán trừ kho POS (trong CÙNG giao dịch với đơn — LUAT_XAY_APP §5)
- B1 Món `lam_san`:
  - trừ lô thành phẩm, hạn gần trước (FEFO);
  - thiếu thì trừ phần còn lại vào nguyên liệu theo công thức (pha tại chỗ);
  - vẫn thiếu thì GHI ÂM và báo đỏ ở màn Kho. KHÔNG chặn bán.
- B2 Món `pha_tai_cho`: trừ nguyên liệu theo công thức × số lượng, kể cả sản phẩm con lồng nhau (`trienKhai`). Thiếu → ghi âm, báo đỏ, không chặn bán.
- B3 Món `chua_dinh_luong` hoặc chưa có dòng `kho_san_pham`: bán bình thường, không trừ, ghi nhận "chưa trừ kho" để màn Kho / đối soát thấy được.
- B4 Mỗi đơn có trừ kho ghi một phiếu kho (loại bán hàng, hoặc loại kế hoạch đề xuất), nối với đơn. Xem lại được ở Kho › Phiếu. Không in tự động.
- B5 Huỷ đơn (HUY-1, kể cả đơn giao):
  - đồ CHƯA pha → trả lại kho đúng lô đã trừ;
  - đồ ĐÃ pha (`do_da_pha`: `bo_di` hoặc tương đương) → không trả, ghi hao hụt.
  - Kế hoạch đọc `utils/giaoHang.js` và đường huỷ `orders.js`, liệt kê mọi trường hợp. Một đơn chỉ trả kho MỘT lần: hai người cùng bấm huỷ hay huỷ lặp thì không trả hai lần.
- B6 Đơn tạo từ mọi lối vào `taoDon` đều trừ kho cùng một cách: phiên quầy, App KH (`donApp`), màn khách, chốt muộn. Một hàm chung trong `server/kho/`, mỗi lối gọi hàm đó.
  `tinh-thu` (chỉ tính tiền) KHÔNG trừ.
- B7 Lỗi kho (thiếu, ghi âm) không bao giờ làm hỏng hay chặn đơn. Lỗi CSDL thì cả giao dịch đơn rollback như hiện nay.

### C. Gỡ hẳn SX
- C1 Không còn lời gọi SX nào chạy được trong `server/`. Kế hoạch grep `callSxApi|checkStock|outStockFIFO|inStockReturn|isSxConfigured|SX_API_URL` và xử lý TỪNG chỗ:
  - `products.js`, `orders.js`, `stock.js`, `damages.js`, `doi-chieu.js`, `backup.js`, `utils/doSoNo.js`, hàng chờ `pos_stock_pending` (bộ hẹn giờ gửi lại nếu có);
  - màn hình `client/src/` gọi các route này.
  - Route chỉ phục vụ SX → bỏ hoặc trả lỗi có `code`. Màn gọi tới thì bỏ nút hoặc màn tương ứng.
  - Bước nâng cấp cũ `server/nang_cap/020_chep_khach_sx.js` đã chạy trên production. GIỮ file (luật nâng cấp chỉ thêm). Không để nó gọi SX lại.
- C2 POS khởi động và chạy đủ khi `SX_API_URL` không có, có giá trị rác, hoặc trỏ tới máy không trả lời. Không treo, không chậm, không log lỗi SX.
- C3 Sao lưu (`backup.js`) và đối chiếu (`doi-chieu.js`) bỏ phần SX, giữ phần POS. Sao lưu lên Drive (SAOLUU-DEM-1, Apps Script) chạy như cũ.
- C4 Hàng chờ `pos_stock_pending` (45 dòng chờ gửi SX): không gửi nữa, giữ dữ liệu làm lịch sử, không hiện cảnh báo "chờ đồng bộ SX".

### D. Luồng hợp lệ phải KHÔNG bị chặn (K5)
- D1 Bán tiền mặt, QR, tài khoản có PIN; giao hàng; đơn App KH; màn khách — khi kho TRỐNG (dữ liệu thật hôm nay) và khi kho có đủ hàng.
- D2 Món giá 0 hoặc không bán (`is_active = 0`) không hiện như hiện nay. Món mới tạo ở POS không có khoá SX vẫn bán được.
- D3 Màn Kho (nhập, nhận, pha chế, phát sinh, tồn, phiếu) chạy như cũ. Phiếu pha chế (KHO-2a) vẫn cộng thành phẩm vào lô để bán trừ được.
- D4 Giả lập một ngày bán hàng (nhóm S) XANH. Thêm vào kịch bản: một món `lam_san` có lô, một món `pha_tai_cho` có công thức, một món chưa định lượng.

### E. Kiểm
- E1 Bài thử MỚI `cong_cu/thu_KHO3a.js`, gồm các ca:
  - FEFO hai lô khác hạn;
  - thiếu lô → trừ nguyên liệu;
  - thiếu cả hai → ghi âm, không chặn;
  - công thức lồng;
  - chưa định lượng;
  - huỷ trả kho đúng lô, MỘT lần (hai lần huỷ song song);
  - đồ đã pha không trả;
  - mỗi lối vào `taoDon` trừ một lần;
  - `tinh-thu` không trừ;
  - SX tắt / rác / treo → menu và đơn vẫn chạy, KHÔNG có lời gọi mạng ra ngoài (đếm `fetch`).
  - Số lượng có phần lẻ (gam, ml): so với SỐ TÍNH TAY (K3).
- E2 Đột biến VS-/BV- cho: chọn lô FEFO, trả kho khi huỷ (cổng một lần), trừ trong giao dịch, bỏ qua `tinh-thu`, món chưa định lượng. Mỗi đột biến có đối chứng.
- E3 Bài thử cũ đang canh đường SX (tồn cũ POS-TONCU, `checkStock` bọc `try/catch` — CLAUDE.md §5.3, 999…) → sửa theo hành vi mới (bài sửa thường, đỏ trên gốc, `SỐ CA`).
  `kiem_tra_truoc_khi_giao.js`: CHỈ được đổi phép đang canh đường SX sang phép canh "không gọi SX / không bịa số". Không nới hay bỏ phép nào khác (K8). Kế hoạch liệt kê từng phép đụng tới.
- E4 Chủ quán thử tay (≤ 3 thao tác):
  1. mở màn Bán hàng thấy menu đủ món, nhanh;
  2. bán 1 món;
  3. Kho › Phiếu thấy phiếu "bán hàng" hoặc dòng "chưa trừ kho" của đơn đó.

## Phạm vi
- viec/KHO-3a/**
- server/routes/products.js
- server/routes/orders.js
- server/routes/stock.js
- server/routes/damages.js
- server/routes/doi-chieu.js
- server/routes/backup.js
- server/routes/so-no.js
- server/utils/doSoNo.js
- server/utils/sxApi.js
- server/utils/donThu.js
- server/utils/giaoHang.js
- server/utils/chuanHoaGio.js
- server/kho/**
- server/nang_cap/**
- server/database.js
- server/index.js
- client/src/pages/Kho/**
- client/src/pages/BanHang/**
- client/src/pages/Reports.jsx
- client/src/utils/api.js
- client/dist/**
- HOP_DONG_API_KH.md
- cong_cu/thu_KHO3a.js
- cong_cu/thu_*.js
- cong_cu/gia_lap/**
- kiem_tra_truoc_khi_giao.js

## Ngân sách
Khoảng 250–350 dòng code (một hàm trừ kho chung, trả kho khi huỷ, menu từ POS), bớt nhiều dòng gọi SX, ~400 dòng thử.
**Phương án đơn giản nhất đã xét:**
- Menu dùng lại hàm dự phòng có sẵn `getFallbackProducts` (đọc `pos_products`) làm đường DUY NHẤT.
- Trừ kho dùng lại phần ghi lô và phiếu của KHO-2a (`server/kho/duLieu.js` `ghiKho` / phiếu) và `trienKhai` (`server/kho/tinh.js`). KHÔNG viết bộ trừ kho thứ hai.
- Mọi lối vào `taoDon` gọi MỘT hàm. Không đổi cấu trúc DB nếu phiếu kho có sẵn đủ loại. Cần loại phiếu mới thì thêm bằng bước nâng cấp đánh số MỚI, chỉ thêm.

## Đổi cấu trúc DB
có thể — chỉ THÊM (vd loại phiếu "bán hàng", cột nối phiếu ↔ đơn) bằng bước `server/nang_cap/NNN_*.js` mới. Không sửa hay xoá bước cũ, bảng cũ, cột cũ.

## Thư viện mới
không

## Soát bảo mật
có — đụng đường tạo đơn và huỷ đơn (giao dịch tiền và kho), gỡ route

## Cấm
- KHÔNG sửa `client/src/pages/Sales.jsx`, `client/src/pages/BanHang/index.jsx`, vùng cổng đầu `taoDon` và `router.post("/")` của `orders.js` (làn BO-MAN-CU-1 đang làm).
  Đụng chung `orders.js` thì chỉ ở đoạn kiểm tồn, trừ kho, huỷ.
- KHÔNG sửa `server/routes/kh/**`, `server/middleware/khachAuth.js`. Đổi hình dạng `/api/kh/menu` thì sửa hợp đồng theo luật, không sửa route khách.
- KHÔNG sửa `client/src/pages/Settings.jsx`, `Customers.jsx`, `components/Layout.jsx` (làn GIAO-DIEN-2).
- KHÔNG sửa hay xoá bước nâng cấp đã có. KHÔNG xoá dữ liệu (`pos_stock_pending`, `ton_gan_nhat`… giữ nguyên).
- KHÔNG làm kiểm kê cuối ca, tỉ lệ ra (KHO-3b), topping (TOPPING-1).
- Mặc định: không sửa `.claude/`, không merge, không tạo PR, không đụng main, chỉ `git push -u origin viec/KHO-3a`, không sửa sổ việc, không chạy `patch_*.py`.
