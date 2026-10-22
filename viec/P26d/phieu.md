# P26d — Kho bán chịu tải (Turso / libsql): BEGIN bận thử lại có giới hạn, nhận đúng mã lỗi bận, mã đơn sinh trong giao dịch, 409 chỉ khi thật chưa ghi, ví không NULL / không âm khi hoàn, khôi phục sao lưu qua ghiVi

<!-- Phiếu do chat soạn 18.10.2026. Nền: main sau sổ việc v37 (cha 8259a59). Nguồn: sổ việc mục P26d (danh sách đánh số (5) (19) (10)
     (15) (17) (18) (7) + Phát hiện LUOI-1 (9) / KB20). Code hiện tại: `beginTransaction()` trong server/database.js gọi thẳng
     `db.transaction("write")`, không thử lại; `loiGhi` (server/routes/wallets.js) chỉ khớp `err.code === 'SQLITE_BUSY'` và trả
     `err.message` ra ngoài ở nhánh 500; `taoMaDonTheoSo` (server/utils/helpers.js) đọc số đơn bằng `queryOne` NGOÀI giao dịch tạo đơn
     (orders.js) → hai đơn cùng lúc trùng mã → 500. Làm TRƯỚC H1 / P3, khi quán còn vắng; TRƯỚC P22-23 (cùng orders.js).
     Song song đợt M2: KH-API-1 (thêm bảng trong createTables của database.js NGAY SAU pos_customers; server/index.js; loyalty.js,
     signup-codes.js; kiem_tra_truoc_khi_giao.js), DOI-SOAT-1 (reports.js; thêm bảng CUỐI createTables), P16 (Invoice*, Sales.jsx,
     Orders.jsx). Việc này trong database.js CHỈ sửa `beginTransaction` / `run` / hàm lỗi liên quan, KHÔNG sửa `createTables`. KHÔNG
     thêm bài thử mới (tránh đụng danh sách bài trong kiem_tra_truoc_khi_giao.js) — ca mới vào bài đang có.
     18.10 chủ quán duyệt kế hoạch (Q1–Q5) + thêm gói/thẻ trong giao dịch đơn, pay-debt một giao dịch. Q6 (a): thêm
     server/utils/nhatKyDon.js — ghiNhatKy nhận tx (có tx: ghi trong giao dịch, không nuốt lỗi; không tx: như cũ). Khôi phục chặn MỌI
     bảng tiền (cả điểm, gói khách, thẻ, voucher, đền bù, lượt mã giảm). Hạ ngưỡng NGUONG_ROUTE_GHI_KHONG_LOIGHI 51 → 50: KHÔNG ở
     việc này (luật) — để DONG-CUNG-1. backup.js: KH-API-1 song song thêm một dòng ngay sau pos_customers trong BACKUP_TABLES — việc
     này không sửa vùng đó. -->

**Chờ duyệt kế hoạch:** viết `viec/P26d/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Giờ cao điểm hai ba người bấm cùng lúc thì quầy KHÔNG ra lỗi 500, không trùng mã đơn, không báo "chưa ghi gì" khi thật ra đã ghi, và
không có ví NULL / tổng chi âm. Khi kho bận quá lâu thì báo rõ "bấm lại" và chắc chắn chưa ghi gì.

## Nghiệm thu
- A (5) `beginTransaction`: BEGIN gặp lỗi bận → thử lại tối đa N lần, chờ tăng dần (hằng số có tên, tổng chờ ≤ ~2 giây); hết lượt → ném
  lỗi bận để route trả 409 `KHO_BAN`. BEGIN hỏng không làm hỏng kết nối dùng chung (ca: sau một BEGIN hỏng, lệnh kế tiếp vẫn chạy).
  Lỗi KHÔNG phải bận → không thử lại.
- B (19) Nhận dạng lỗi bận theo mã THẬT của thư viện `@libsql/client` (file cục bộ VÀ máy chủ Turso — đọc mã nguồn thư viện trong
  node_modules, liệt kê mã / dạng lỗi trong kế hoạch, không đoán). Một hàm `laLoiBan(err)` dùng chung cho database.js và `loiGhi`. Nhánh
  500 của `loiGhi` chỉ trả `{ error, code }` chung, không trả `err.message` thô (ghi log máy chủ).
- C (10) Mã đơn sinh TRONG cùng giao dịch ghi đơn (đọc số + ghi đơn một giao dịch) hoặc có ràng buộc duy nhất + thử lại có giới hạn —
  kế hoạch chọn cách đơn giản nhất đúng. Ca: hai đơn tạo đồng thời → hai mã khác nhau, cả hai 200 (hoặc một 409 `KHO_BAN` rồi bấm lại
  được), không 500. Mã đơn đã phát hành không đổi định dạng.
- D (15) 409 "chưa ghi gì" chỉ khi lỗi xảy ra TRƯỚC commit. Lỗi SAU commit (vd huỷ đơn đã ghi sổ xong nhưng gọi hoàn kho SX hỏng;
  `reconcile-all` lỗi giữa chừng) → trả kết quả đúng sự thật (đã ghi gì, việc nào cần làm lại), không 409. Kế hoạch liệt kê MỌI chỗ
  trả 409 `KHO_BAN` và xếp trước / sau commit.
- E (17, 18) Ví: không còn dòng `balance` NULL (đọc NULL như 0 ở MỘT chỗ, `ghiVi`); tạo ví lúc hoàn không để `total_spent` âm — kế
  hoạch nêu quy tắc đúng (theo quy tắc hoàn tiền đã chốt trong sổ / CLAUDE.md) TRƯỚC khi sửa; không chắc → `## Câu hỏi`.
- F (7) Khôi phục sao lưu (`server/routes/backup.js`) không ghi thẳng `pos_wallets` / `pos_orders` ngoài `ghiVi`: hoặc đi qua ghiVi,
  hoặc khôi phục ví / đơn bị CHẶN với 400 rõ lý do (kế hoạch chọn, ưu tiên an toàn). Bất biến E12 trong kiem_tra_truoc_khi_giao.js
  (mọi ghi pos_wallets qua ghiVi) phải XANH mà không thêm ngoại lệ mới.
- G KB20 (Phát hiện LUOI-1 (9)): sau khi C xong, ca chống mã giảm vượt lượt dùng (orders.js đoạn kiểm lại mã trong giao dịch) siết về
  đúng 200 + 400 `DISCOUNT_CODE_LIMIT_REACHED`; thêm đột biến "bỏ kiểm lại mã trong giao dịch" — phải bị bắt.
- H Bài thử: ca mới vào bài ĐANG CÓ (`thu_P26b.js` cho ví / giao dịch, `thu_P26c.js` / `thu_GOI1.js` / `thu_P20.js` cho đơn) — dựng lỗi bận
  bằng hai kết nối thật trên file tạm hoặc móc tất định (khuôn móc đua của thu_P20); mỗi ca đỏ trên gốc đúng câu lỗi. Đột biến
  `viec/P26d/dot_bien.py`: bỏ thử lại BEGIN, `laLoiBan` chỉ khớp một mã, sinh mã đơn ngoài giao dịch, đổi 409 sau commit, bỏ COALESCE
  ví — đều bị bắt. Giả lập quầy và mọi bài hiện có vẫn xanh; `--day-du` xanh; không bài nào vượt 80 % hạn.

## Bài thử cũ sửa
- cong_cu/thu_P26b.js — thêm ca giao dịch / ví; ca cũ giữ nguyên
- cong_cu/thu_P26c.js — thêm ca đơn đồng thời / 409 sau commit; ca cũ giữ nguyên
- cong_cu/thu_GOI1.js — thêm ca nếu đường gói chạm mã đơn; ca cũ giữ nguyên
- cong_cu/thu_P20.js — siết KB20; ca cũ giữ nguyên

## Phạm vi
- viec/P26d/**
- server/database.js
- server/utils/helpers.js
- server/routes/orders.js
- server/routes/wallets.js
- server/routes/backup.js
- server/routes/refunds.js
- server/utils/nhatKyDon.js
- cong_cu/thu_P26b.js
- cong_cu/thu_P26c.js
- cong_cu/thu_GOI1.js
- cong_cu/thu_P20.js

## Ngân sách
~120–200 dòng code + ~250 dòng thử.
**Phương án đơn giản nhất đã xét:** một hàm `laLoiBan`, một vòng thử lại trong `beginTransaction`; mã đơn đọc trong giao dịch sẵn có
(không bảng đếm mới); chặn khôi phục ví / đơn nếu đi qua ghiVi phức tạp hơn nhiều.

## Đổi cấu trúc DB
có — CHỈ khi C chọn ràng buộc duy nhất: THÊM chỉ mục duy nhất cho mã đơn (kiểm trước dữ liệu cũ không trùng, ghi trong kế hoạch, chờ
duyệt). Đặt NGAY SAU khối tạo bảng `pos_orders` (không ở cuối `createTables` — DOI-SOAT-1 thêm ở đó). Không xoá, không đổi tên, không sửa bảng.

## Thư viện mới
không

## Cấm
- database.js: KHÔNG sửa `createTables` (KH-API-1 / DOI-SOAT-1 thêm bảng ở đó) — trừ đúng một chỉ mục ở mục Đổi cấu trúc DB. Không sửa `server/index.js`, `server/routes/loyalty.js`,
  `server/routes/signup-codes.js`, `server/routes/reports.js`, `client/`.
- Không đổi quy tắc tiền đã chốt; lộ quy tắc chưa rõ → DỪNG, `## Câu hỏi`. Không SQL ghi production, không chạy trên Turso thật.
- Không thêm bài thử mới, không sửa `kiem_tra_truoc_khi_giao.js`, `tu_chay/`, `.claude/`, `.github/`, sổ việc, `cong_cu/gia_lap/**`,
  `cong_cu/thu_TOCDO1.js`. Không nới hạn, không bớt ca / `c.mong`. Chỉ push đúng `git push -u origin viec/P26d`. Không đụng `main`, không
  merge, không tạo PR.
