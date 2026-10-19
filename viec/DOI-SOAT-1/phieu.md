# DOI-SOAT-1 — Màn "Đối soát" trong POS: chạy bất biến sổ sách trên dữ liệu THẬT (chỉ đọc), ngày / tuần / tháng, chỉ ra đơn / khoản lệch

<!-- Phiếu do chat soạn 18.10.2026. Nền: main sau sổ việc v37 (cha 8259a59). Nguyên tắc chủ quán 12.10: mọi hệ liên quan tiền phải
     đối soát hằng ngày / tuần / tháng; muốn THÔNG MINH nhưng THẬT ĐƠN GIẢN; quầy CHƯA có bước đếm két cuối ngày. Đã có:
     18 bất biến `cong_cu/gia_lap/bat_bien.js` (hàm I<n>(q, ctx) → mảng dòng lệch, SQL chỉ đọc, viết từ schema thật);
     `server/routes/doi-chieu.js` (đối chiếu SX ↔ POS theo vân tay) và `POST /wallets/reconcile-all` (ghi tuyệt đối — KHÔNG dùng ở đây).
     Sổ 16.10 thêm: đếm SĐT có ≥ 2 dòng claimed_phone / diem_nhan_phone (dấu vết đua cũ, P20c thấy 7); đối soát điểm đơn mua thẻ / gói
     tích theo tiền thực trả (AU4-16 = A).
     Song song đợt M2: KH-API-1 (server/index.js, database.js — thêm bảng ngay sau pos_customers; kiem_tra_truoc_khi_giao.js — sửa mảng
     danh sách bài chạy thật), P26d (database.js beginTransaction/run, orders.js, wallets.js, backup.js, sync.js…), P16 (Invoice*,
     Sales.jsx, Orders.jsx). Việc này KHÔNG sửa server/index.js (dùng route reports.js đã mount), KHÔNG sửa wallets.js / orders.js.
     database.js: chỉ THÊM bảng ở CUỐI createTables (khác vùng hai việc kia). kiem_tra_truoc_khi_giao.js: thêm dòng gọi
     `chayBaiThat('cong_cu/thu_DOISOAT1.js')` RIÊNG, đặt TRƯỚC mục "K · KHO THỬ", KHÔNG sửa dòng mảng danh sách chung.
     18.10 chủ quán trả lời câu 1–8 (trang_thai.md) và câu 9: thêm server/routes/backup.js — CHỈ một dòng pos_doi_soat_ghi trong
     BACKUP_TABLES ngay sau dòng pos_order_log (phép E8). KH-API-1 thêm sau pos_customers, P26d sửa sau cuối danh sách — ba chỗ tách
     nhau để git gộp tự động. -->

**Chờ duyệt kế hoạch:** viết `viec/DOI-SOAT-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Chủ quán mở tab "Đối soát" (trong màn Báo cáo hiện có), chọn Ngày / Tuần / Tháng, bấm một nút → thấy XANH (mọi bất biến đạt) hoặc ĐỎ
kèm danh sách cụ thể: bất biến nào, đơn / khách / số tiền nào lệch, lệch bao nhiêu. Chỉ BÁO, không bao giờ tự sửa số. Lệch do phần
mềm → thành ca thử mới ở việc sau. Dữ liệu cũ trước các bản vá không làm màn đỏ oan.

## Nghiệm thu
- A Dùng lại bất biến, MỘT bản: bất biến chạy trên dữ liệu thật PHẢI là đúng các hàm giả lập đang dùng (không chép công thức). Kế
  hoạch chọn: chuyển phần lõi sang `server/utils/batBien.js` và để `cong_cu/gia_lap/bat_bien.js` gọi lại (giả lập vẫn xanh, cùng số
  kịch bản / bất biến), hoặc cách gọn hơn có lập luận. Mọi câu SQL CHỈ ĐỌC (SELECT); bài thử chứng minh không có lệnh ghi.
- B Lọc theo khoảng: ngày / tuần (thứ 2 → CN) / tháng theo GIỜ VIỆT NAM; bất biến nào chỉ có nghĩa trên toàn sổ (số dư ví, điểm) thì
  chạy toàn sổ và ghi rõ trên màn "toàn sổ".
- C Dữ liệu cũ: mỗi bất biến có "áp dụng từ ngày" (ngày gộp bản vá tương ứng, lấy từ sổ việc); lệch trên dòng cũ hơn ngày đó hiện ở
  nhóm "LỆCH CŨ (trước bản vá)" màu vàng, KHÔNG làm kết quả đỏ. Kế hoạch liệt kê ngày cho từng bất biến kèm commit.
- D Thêm hai phép (sổ 16.10): D1 SĐT có ≥ 2 dòng nhận mã bill / nhận điểm (`claimed_phone`, `diem_nhan_phone`) — liệt kê; D2 đơn mua
  thẻ hội viên / gói trả trước: điểm tích = theo tiền thực trả lúc mua (quy tắc AU4-16 = A), lấy món từ gói không tích thêm.
- E Ngày: ô "Tiền két đếm được" (số nguyên đồng, người nhập, giờ) cho NGÀY đang xem → màn tính "tiền mặt theo sổ" của ngày (cùng
  hàm / câu mà báo cáo hiện dùng cho tiền mặt; kế hoạch chỉ rõ) và hiện chênh lệch; lưu lịch sử, sửa lần sau ghi thêm dòng mới (không
  ghi đè). Không có số đếm → ghi "chưa đếm két" (vàng), không đỏ.
- F Tuần: hiện tổng chuyển khoản theo sổ của tuần để chủ quán so sao kê ngân hàng (người so, ~5 phút); có ô đánh dấu "đã so sao kê"
  + ghi chú. Tháng: tổng hợp 4 nhóm (tiền mặt, chuyển khoản, ví, điểm) + nhắc "kiểm kê kho thật" (chỉ nhắc, số kho ở SX).
- G Quyền: chỉ người có quyền xem báo cáo tiền đang dùng cho Báo cáo (kế hoạch chỉ rõ quyền); máy chủ kiểm, màn ẩn nút.
- H Hiệu năng: tháng của dữ liệu thật ước lượng (đếm đơn hiện có trên kho tạm lớn dần) chạy < 10 giây; vượt → kế hoạch nói cách.
- I Bài thử `cong_cu/thu_DOISOAT1.js` (máy chủ thật trên kho tạm, khuôn thu_P26c): dữ liệu sạch → XANH; cấy từng loại lệch (ví lệch
  sổ, điểm sai AU4-16, SĐT nhận 2 lần, tiền két chênh) → ĐỎ đúng dòng, đúng số tiền; dòng cũ trước ngày áp dụng → vàng không đỏ; người
  không quyền → 403. Đột biến `viec/DOI-SOAT-1/dot_bien.py`: bỏ một bất biến khỏi danh sách chạy, bỏ lọc ngày, đổi giờ VN sang UTC,
  bỏ kiểm quyền — đều bị bắt. `cong_cu/gia_lap/chay.js` và `thu_gia_lap.js` vẫn xanh, cùng số kịch bản / bất biến.

## Phạm vi
- viec/DOI-SOAT-1/**
- server/utils/batBien.js
- server/utils/doiSoat.js
- server/routes/reports.js
- server/routes/backup.js
- server/database.js
- cong_cu/gia_lap/bat_bien.js
- client/src/pages/Reports.jsx
- client/src/components/DoiSoat.jsx
- cong_cu/thu_DOISOAT1.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~300 dòng code (phần lớn là màn) + ~250 dòng thử; phần tách bất biến tính riêng (chỉ di chuyển).
**Phương án đơn giản nhất đã xét:** không viết bất biến mới ngoài D1, D2, E; dùng lại 18 bất biến giả lập; một tab trong Báo cáo thay vì
màn mới; tuần / tháng chỉ là tổng hợp + ô đánh dấu, không nhập sao kê.

## Đổi cấu trúc DB
có — CHỈ THÊM bảng ghi số két đếm và đánh dấu đã so sao kê (ngày / tuần, số, người, giờ, ghi chú), ở CUỐI `createTables`. Không xoá,
không đổi tên, không sửa bảng cũ.

## Thư viện mới
không

## Cấm
- KHÔNG ghi bất kỳ bảng tiền / ví / điểm / đơn / kho nào; KHÔNG gọi `reconcile-all` hay hàm sửa số. Lộ code tiền SAI → DỪNG, ghi `## Câu hỏi`.
- `server/routes/backup.js`: CHỈ thêm MỘT dòng `{ name: 'pos_doi_soat_ghi', … }` vào `BACKUP_TABLES` NGAY SAU dòng `pos_order_log`;
  không sửa gì khác trong file (KH-API-1, P26d song song sửa chỗ khác).
- KHÔNG sửa `server/index.js`, `server/routes/wallets.js`, `server/routes/orders.js`, `server/routes/doi-chieu.js`; database.js chỉ thêm
  bảng ở cuối createTables; `kiem_tra_truoc_khi_giao.js` chỉ thêm MỘT dòng gọi bài ở chỗ ghi trên.
- Không đổi kết quả giả lập (số kịch bản, số bất biến, mô tả lệch). Không nới hạn, không bớt ca.
- Không sửa `tu_chay/`, `.claude/`, `.github/`, sổ việc, `cong_cu/thu_TOCDO1.js`. Chỉ push đúng `git push -u origin viec/DOI-SOAT-1`.
  Không đụng `main`, không merge, không tạo PR.
