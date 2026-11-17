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
**Luật bán theo kho — chủ quán chốt 17.11 18:47, GIỮ logic cũ "không đủ hàng thì không bán" (`orders.js` `checkStock` → 400 "Không đủ hàng"):**
- Món làm sẵn theo lô (`lam_san`): phải nhập / pha thành phẩm trước. Hết lô hoặc không đủ → CHẶN. Không tự trừ sang nguyên liệu.
- Món pha tại chỗ (`pha_tai_cho`): nguyên liệu không đủ → CHẶN, TRỪ KHI món đó bật cài đặt "Cho bán khi thiếu nguyên liệu".
  Cài đặt theo TỪNG MÓN, mặc định TẮT, chỉ chủ quán bật. Bật thì vẫn bán, ghi âm, báo đỏ.
- Món chưa có công thức (`chua_dinh_luong`, chưa có dòng `kho_san_pham`, hoặc công thức rỗng): KHÔNG bán.
- Danh mục từ SX: chủ quán dùng Kho › Nhập từ SX có sẵn (KHO-1) TRƯỚC khi gộp việc này. Chỉ lấy danh sách, KHÔNG lấy tồn. Tồn nhập bằng kiểm kê / pha chế / nhận hàng.

Hệ quả: hôm nay kho trống, nên gộp việc này khi chưa có công thức thì quầy KHÔNG bán được món nào. Vì vậy:
- máy làm A7 (màn "món chưa sẵn sàng bán");
- báo cáo cuối ghi rõ điều kiện gộp: mọi món đang bán đã có kiểu + công thức, món làm sẵn đã có lô.

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
- A4 **Quản lý món HOÀN TOÀN trong POS** (chủ quán 17.11: "POS chủ động hoàn toàn"). Hiện nay món chỉ vào POS qua SX: mọi `INSERT INTO pos_products` ở
  `products.js` đều cần khoá SX (`sync-from-sx`, ghi giá theo khoá SX), hoặc qua Kho › Nhập từ SX.
  - Thêm được món MỚI ngay trong POS: tên, nhóm, giá, đơn vị, thứ tự, đang bán. Không cần khoá SX.
  - Sửa được tên, nhóm, thứ tự. Ẩn hoặc hiện món.
  - Không xoá cứng món đã có đơn.
  - Định danh món mới: kế hoạch đề xuất cách gọn nhất KHÔNG làm gãy chỗ đang dùng `sx_product_type` / `sx_product_id` làm khoá (giá, `/api/kh/menu`, `unique_id`, đơn cũ, giỏ App, công thức `kho_san_pham.pos_product_id`).
  - Quyền: tạo món, sửa giá, ẩn → quyền đang dùng cho sửa giá (`manage_settings`); công thức → chỉ chủ quán (như KHO-1).
- A7 Màn Kho có mục "Món chưa sẵn sàng bán": món đang bán mà chưa có kiểu / công thức, hoặc món làm sẵn hết lô. Có số đếm để chủ quán làm cho đủ trước khi gộp và hằng ngày.
- A5 **Một món, MỘT chỗ sửa:** màn Kho › Sản phẩm & công thức (`client/src/pages/Kho/SanPham.jsx`) thành màn đầy đủ của món: tên, nhóm, giá, đang bán, kiểu kho, công thức, hạn dùng.
  - Giá sửa ngay tại đây, gọi route giá có sẵn. Bỏ dòng "đặt giá ở Cài đặt › Sản phẩm".
  - Màn Cài đặt › Sản phẩm cũ để GIAO-DIEN-2 gỡ hoặc trỏ về đây. Việc này KHÔNG sửa `Settings.jsx`.

### B. Bán trừ kho POS (trong CÙNG giao dịch với đơn — LUAT_XAY_APP §5)
- B1 Món `lam_san`: trừ lô thành phẩm còn hạn, hạn gần trước (FEFO).
  - Tổng lô còn hạn < số lượng → CHẶN: 400, `code: "HET_HANG"`, lời "Không đủ hàng: <món>. Còn: <n>, cần: <m>" (giữ lời cũ).
  - Lô hết hạn không được bán.
- B2 Món `pha_tai_cho`: trừ nguyên liệu theo công thức × số lượng, kể cả sản phẩm con lồng nhau (`trienKhai`).
  - Thiếu nguyên liệu và món TẮT "Cho bán khi thiếu nguyên liệu" → CHẶN: 400, `code: "THIEU_NGUYEN_LIEU"`, lời nêu tên nguyên liệu thiếu.
  - Món BẬT cài đặt đó → bán, ghi âm, báo đỏ ở màn Kho.
- B3 Món chưa có công thức (`chua_dinh_luong`, chưa có dòng `kho_san_pham`, hoặc công thức rỗng) → CHẶN: 400, `code: "CHUA_CO_CONG_THUC"`.
  - Màn Bán hàng hiện món đó mờ, ghi "chưa có công thức", không bấm thêm vào giỏ được.
  - App KH: kế hoạch chọn cách gọn nhất (ẩn món, hoặc `con_ban: false`) theo luật hợp đồng.
- B3b **GIỮ HÀNG — không bao giờ bán vượt số đang có (chủ quán 17.11 18:54: "liên quan bán hàng online, tránh hết hàng mà vẫn cho bán"):**
  - Kiểm đủ hàng ở lúc TẠO đơn chờ trả: phiên thu quầy (tiền mặt, QR, PIN), đơn App KH, màn khách. Đủ thì **giữ** đúng số đó cho đơn.
    Thiếu → chặn ngay (B1–B3). App KH nhận đúng `code` để báo khách "món này vừa hết" (theo luật hợp đồng `/api/kh`).
  - "Còn bán được" = tồn trừ phần ĐANG GIỮ cho các đơn chưa trả. Quầy, App, màn khách cùng một con số.
    Menu quầy và `/api/kh/menu` hiện "hết" khi con số này về 0.
  - Trả tiền trong hạn (chốt) → trừ thật từ phần đã giữ. Không kiểm lại, không thể thiếu.
  - Đơn huỷ hoặc QR hết hạn → nhả phần giữ ngay, trong cùng câu ghi đổi trạng thái phiên.
  - Tiền về SAU khi hết hạn (đã nhả giữ): giữ đúng luật hiện có, đơn đồ uống KHÔNG chốt, tiền vào ví khách (`thanh-toan.js` nhánh vào ví).
    Nhờ vậy không có trường hợp đã thu tiền mà thiếu hàng.
  - Giữ và nhả nằm trong cùng giao dịch, điều kiện chặn đua viết trong câu ghi. Hai máy hoặc App cùng lấy chai cuối → chỉ một bên giữ được.
  - Kế hoạch: tìm chỗ phiên đã "giữ chỗ" (`utils/giuCho.js`: voucher, lượt mã) và đặt phần giữ hàng ĐÚNG cùng chỗ đó. Không dựng cơ chế thứ hai.
    Nêu thời gian giữ (= hạn phiên / QR hiện có) và mọi đường nhả (huỷ, hết hạn, lỗi chốt, dọn phiên cũ).
- B3c **Lưới an toàn — lỡ bán khi hết hàng** (chủ quán 17.11 19:04: "POS phải cảnh báo và hoàn tiền vào ví khách, App khách cũng phải được thông báo"):
  - Giữ hàng (B3b) đúng thì không xảy ra. Nhưng mọi đường mà tiền đã về / đã thu mà POS không giao đủ hàng vẫn phải xử lý như nhau, kể cả chốt muộn, lỗi giữa chừng, hai cổng báo cùng lúc:
    - KHÔNG tạo đơn thiếu hàng, KHÔNG ghi âm thành phẩm;
    - hoàn ĐÚNG số tiền khách đã trả vào ví khách, trong cùng giao dịch, một lần (khoá chống trùng như nhánh "tiền về muộn → vào ví" ở `thanh-toan.js`);
    - ghi lý do "Hết hàng: <món>".
  - Quầy thấy cảnh báo đỏ trên màn Bán hàng và màn Đơn App: "Đơn … hết <món> — đã hoàn <số tiền> vào ví khách <SĐT che>".
  - App KH được báo bằng đường có sẵn của hợp đồng: `GET /don/:ma` có `tien_ve_da_cong_vi` + `thong_bao_tien_ve` = "Món … vừa hết — quán đã hoàn … vào ví của bạn".
    Nếu hợp đồng đã có đường POS nhờ App gửi thông báo đẩy thì dùng; chưa có thì ghi Phát hiện + soạn thư `TRA_LOI_POS_*` cho App KH. Không tự thêm đường mới ngoài hợp đồng.
  - Khách vãng lai không có ví (đơn quầy tiền mặt chưa có khách): quầy chặn trước khi thu nên không xảy ra. Kế hoạch chứng minh không có đường nào tới đây.
    Nếu có thì báo đỏ "hoàn tiền mặt tay" và ghi sổ đối soát.
- B4 Mỗi đơn có trừ kho ghi một phiếu kho (loại bán hàng, hoặc loại kế hoạch đề xuất), nối với đơn. Xem lại được ở Kho › Phiếu. Không in tự động.
- B5 Huỷ đơn (HUY-1, kể cả đơn giao):
  - đồ CHƯA pha → trả lại kho đúng lô đã trừ;
  - đồ ĐÃ pha (`do_da_pha`: `bo_di` hoặc tương đương) → không trả, ghi hao hụt.
  - Kế hoạch đọc `utils/giaoHang.js` và đường huỷ `orders.js`, liệt kê mọi trường hợp. Một đơn chỉ trả kho MỘT lần: hai người cùng bấm huỷ hay huỷ lặp thì không trả hai lần.
- B6 Đơn tạo từ mọi lối vào `taoDon` đều trừ kho cùng một cách: phiên quầy, App KH (`donApp`), màn khách, chốt muộn. Một hàm chung trong `server/kho/`, mỗi lối gọi hàm đó.
  `tinh-thu` (chỉ tính tiền) KHÔNG trừ.
- B7 Chặn CHỈ đúng ba trường hợp B1–B3, ở lúc tạo đơn chờ trả (B3b). Ghi âm chỉ xảy ra với món pha tại chỗ bật cài đặt B2. Lỗi CSDL thì cả giao dịch rollback như hiện nay.
- B8 **Cài đặt "Cho bán khi thiếu nguyên liệu"** theo từng món `pha_tai_cho`. Mặc định TẮT, chỉ chủ quán sửa (máy chủ kiểm), nằm trên màn món (A5).
  Thêm bằng bước nâng cấp đánh số MỚI, chỉ thêm cột.

### C. Gỡ hẳn SX
- C1 Không còn lời gọi SX nào chạy được trong `server/`. Kế hoạch grep `callSxApi|checkStock|outStockFIFO|inStockReturn|isSxConfigured|SX_API_URL` và xử lý TỪNG chỗ:
  - `products.js`, `orders.js`, `stock.js`, `damages.js`, `doi-chieu.js`, `backup.js`, `utils/doSoNo.js`, hàng chờ `pos_stock_pending` (bộ hẹn giờ gửi lại nếu có);
  - màn hình `client/src/` gọi các route này.
  - Route chỉ phục vụ SX (kể cả `POST /products/sync-from-sx`) → bỏ hoặc trả lỗi có `code`. Màn gọi tới thì bỏ nút hoặc màn tương ứng.
    Chữ "đồng bộ SX" ở `Customers.jsx`, `Settings.jsx` và trang `Registrations.jsx` (Export cho SX) là việc của GIAO-DIEN-2, không sửa ở đây.
  - Bước nâng cấp cũ `server/nang_cap/020_chep_khach_sx.js` đã chạy trên production. GIỮ file (luật nâng cấp chỉ thêm). Không để nó gọi SX lại.
- C2 POS khởi động và chạy đủ khi `SX_API_URL` không có, có giá trị rác, hoặc trỏ tới máy không trả lời. Không treo, không chậm, không log lỗi SX.
- C3 Sao lưu (`backup.js`) và đối chiếu (`doi-chieu.js`) bỏ phần SX, giữ phần POS. Sao lưu lên Drive (SAOLUU-DEM-1, Apps Script) chạy như cũ.
- C4 Hàng chờ `pos_stock_pending` (45 dòng chờ gửi SX): không gửi nữa, giữ dữ liệu làm lịch sử, không hiện cảnh báo "chờ đồng bộ SX".

- C5 **Đường đồng bộ TAY với SX** (không gọi SX qua mạng nên grep C1 KHÔNG bắt được, chat rà 17.11):
  - `server/routes/sync.js` (`/api/pos/sync`: xuất / nhập CSV khách cho SX);
  - phần xuất SX của `server/routes/registrations.js` (`/export/csv`, `/confirm-export`, `/revert*`, `/export-logs`);
  - `orders.js` ghi `pos_registrations` khi bán cho SĐT chưa có khách (khoảng dòng 1322-1334: "đăng ký chờ xuất SX").
  Kế hoạch đọc từng chỗ, chỉ ra ai còn dùng. Ví dụ `utils/docKhach.js` và `donThu.js` đọc `pos_registrations`; bước 022 đã chép đăng ký chờ thành khách.
  Cái chỉ phục vụ SX thì bỏ, hoặc trả lỗi có `code`. Cái còn dùng thì giữ.
  KHÔNG xoá bảng hay dữ liệu `pos_registrations`, `pos_sync_logs`. Trang `Registrations.jsx` để GIAO-DIEN-2 gỡ.
- C6 Sau việc này các biến `SX_API_URL`, `SX_API_URL_THU`, `SX_API_KEY`, `SX_TIMEOUT_MS` không còn ai đọc (trừ chú thích).
  `ketNoiKho.js` bỏ `diaChiSX`, nhóm K của bộ kiểm đổi theo. Ghi trong báo cáo: chủ quán xoá các biến này trên Render sau khi gộp.

### D. Luồng hợp lệ phải KHÔNG bị chặn (K5)
- D1 Bán tiền mặt, QR, tài khoản có PIN; giao hàng; đơn App KH; màn khách — khi kho CÓ ĐỦ hàng và công thức thì đều qua.
  Thêm một ca kho trống: mọi món bị chặn đúng `CHUA_CO_CONG_THUC`, không ghi gì, không lỗi 500.
- D2 Món giá 0 hoặc không bán (`is_active = 0`) không hiện như hiện nay. Món mới tạo ở POS không có khoá SX vẫn bán được.
- D3 Màn Kho (nhập, nhận, pha chế, phát sinh, tồn, phiếu) chạy như cũ. Phiếu pha chế (KHO-2a) vẫn cộng thành phẩm vào lô để bán trừ được.
- D4 Giả lập một ngày bán hàng (nhóm S) XANH.
  - Kịch bản dựng sẵn kiểu, công thức, lô cho các món nó bán.
  - Thêm cảnh: món làm sẵn hết lô → bị chặn; món pha tại chỗ thiếu nguyên liệu (TẮT → chặn, BẬT → bán, ghi âm); món chưa có công thức → bị chặn.

### E. Kiểm
- E1 Bài thử MỚI `cong_cu/thu_KHO3a.js`, gồm các ca:
  - FEFO hai lô khác hạn; lô hết hạn không bán;
  - đủ lô đúng bằng số cần (qua) và thiếu 1 (chặn `HET_HANG`), ngay trên và ngay dưới ngưỡng;
  - pha tại chỗ thiếu nguyên liệu: cài đặt TẮT → `THIEU_NGUYEN_LIEU`, BẬT → qua + ghi âm;
  - nhân viên không bật được cài đặt (403); mặc định TẮT (ca không truyền giá trị);
  - công thức lồng;
  - chưa có công thức / công thức rỗng → `CHUA_CO_CONG_THUC`;
  - giữ hàng: phiên A giữ chai cuối → quầy B và App thấy "hết", bị chặn; A huỷ hoặc hết hạn → nhả, B bán được;
  - A trả trong hạn → chốt trừ đúng phần giữ; tiền về sau hạn → không chốt, vào ví, tồn không đổi;
  - hai phiên cùng lúc tranh chai cuối → chỉ một giữ được (chạy song song thật);
  - lưới an toàn B3c: ép phần giữ bị mất rồi cho tiền QR về → không có đơn, ví +đúng số, một lần (gửi báo hai lần), App thấy `thong_bao_tien_ve`, quầy có cảnh báo;
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
  1. Kho › Sản phẩm: thêm "Món thử" kèm giá, kiểu pha tại chỗ, công thức 1 nguyên liệu → món hiện ở màn Bán hàng (chưa công thức thì mờ);
  2. bán món đó 1 ly;
  3. Kho › Phiếu thấy phiếu "bán hàng" hoặc dòng "chưa trừ kho" của đơn đó. Xong thì ẩn "Món thử".

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
- server/routes/sync.js
- server/routes/registrations.js
- server/utils/docKhach.js
- server/ketNoiKho.js
- server/kho/**
- server/utils/giuCho.js
- server/routes/thanh-toan.js
- server/utils/donApp.js
- server/utils/manKhach.js
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
