# P24 — Huỷ đơn trừ lại điểm đã cộng (cho phép điểm âm) · sửa bất biến I8

<!-- Phiếu do chat soạn 24.10.2026. Việc tiền [T] — Opus, máy lập kế hoạch, dừng chờ chủ quán duyệt. Nền: main `bd9b920` (P22-23 đã gộp:
     điểm chỉ cộng khi thu đủ; I8 hiện ghi "đơn đã huỷ GIỮ điểm — P24 đổi sau"; mốc DIEM_KHI_THU_TU = '2026-10-23').
     Quyết định chủ quán (đừng hỏi lại): 02.10 huỷ đơn → trừ lại điểm, cho phép ÂM (khách đã tiêu điểm thì số dư điểm âm); ghi THÊM dòng,
     không xoá / sửa dòng cũ (append-only). 24.10: điểm chỉ tính trên tiền khách trả thật (làm ở P3 — P24 KHÔNG đổi cách tính điểm cộng).
     Code đọc 24.10: orders.js `PUT /:id/cancel` (~1414–1580, một giao dịch, cổng `AND status = 'completed'`) không đụng điểm;
     `DELETE /:id` (~1587–1700); điểm ghi ở bảng `pos_point_transactions` (dòng `earn` gắn `order_id`, có `expires_at`);
     nhận điểm bằng mã bill (signup-codes.js `nhanDiemMaBill`) cũng ghi `earn` gắn đơn.
     Chạy SONG SONG với P3 được: P24 chỉ sửa vùng huỷ / xoá của orders.js + bất biến I8; P3 sửa vùng tạo đơn + thanh toán và KHÔNG
     đụng giả lập. Đổi công thức điểm (chỉ trên tiền thật) là DIEM-THAT-1, chạy SAU P24 — P24 KHÔNG làm. -->

**Chờ duyệt kế hoạch:** viết `viec/P24/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

**Đã duyệt (chủ quán 24.10, sau khi chat soát kế hoạch `ke_hoach.md` đầu nhánh `4bf6b9f`):** kế hoạch được duyệt nguyên văn kèm các điểm
sau; máy làm tiếp từ bước 4 (`/lam-viec P24 tiep`) tới hết, không dừng hỏi lại các điểm này:
1. G-a: `DELETE /:id` đơn `completed` có điểm → trừ điểm y như huỷ, dùng chung hàm `truDiemDon` đặt NGAY TRƯỚC `router.delete`
   (khe ~1580–1587, như kế hoạch 2.2). Đơn đã huỷ rồi mới xoá: không trừ lần hai.
2. E-a: dòng trừ chép đúng `expires_at` của `earn` (điểm đã hết hạn thì số dư không đổi, không phạt khách hai lần).
3. D: CÓ vá lỗ đua — `server/routes/signup-codes.js` đã thêm vào Phạm vi, CHỈ câu chiếm mã (~:278) + `baoChiemHong` (~:282–285) để
   trả `DON_DA_HUY`; giữ nguyên chuỗi neo `WHERE id = ? AND diem_nhan_luc IS NULL` (kiem_tra_truoc_khi_giao.js:463–469).
4. Lỗi khi ghi dòng trừ → ROLLBACK cả lệnh huỷ / xoá (không bọc try/catch); sổ điểm luôn cân.
5. Chọn cách GROUP BY (SĐT, hạn) như kế hoạch 2.1 (A), không theo gợi ý bỏ GROUP BY.
6. Dòng `adjust` CÓ `order_id` từ nay dành RIÊNG cho "trừ điểm do huỷ / xoá đơn" — ghi một dòng chú thích ngay câu ghi và ở ghi chú
   đầu `bat_bien.js` (để DIEM-THAT-1 và việc sau không dùng lẫn).
7. Mốc `HUY_TRU_DIEM_TU = '2026-10-25'` ghi tạm; chat sửa đúng ngày lúc duyệt PR.
8. Phát hiện ngoài phạm vi (KHÔNG làm ở đây, chat đã ghi cho việc sau): `doiSoat.js:118` gộp điểm trừ do huỷ với đổi quà; hoàn tiền
   trọn / một phần giữ điểm của đơn.

## Mục tiêu
Huỷ một đơn đã có điểm thì điểm của đơn đó bị trừ lại đúng bằng số đã cộng, kể cả khi khách đã tiêu (điểm âm). Sổ điểm chỉ ghi thêm,
đối soát (I8) canh đúng luật mới.

## Nghiệm thu
- A Huỷ đơn có dòng `earn` (cộng lúc tạo hoặc lúc thu nợ, hoặc khách lẻ đã nhận điểm bằng mã bill) → ghi THÊM một dòng trừ đúng bằng
  tổng điểm `earn` của đơn, cho đúng SĐT đã nhận, CÙNG giao dịch với UPDATE huỷ đơn. Dòng cũ giữ nguyên.
- B Khách đã tiêu bớt điểm → số dư điểm có thể âm; App KH / quầy hiện số âm đúng (không cắt về 0), đổi quà bị chặn khi số dư ≤ 0.
- C Đơn không có điểm (khách lẻ chưa nhận mã, đơn Flash, đơn chưa thu đủ) → huỷ không ghi dòng điểm nào.
- D Mã nhận điểm của khách lẻ CHƯA dùng → huỷ đơn làm mã đó không nhận điểm được nữa (kế hoạch đọc code hiện tại, nói rõ đang thế nào).
- E Hạn điểm: dòng trừ dùng cùng `expires_at` với dòng `earn` bị trừ (kế hoạch nói rõ nếu `earn` đã hết hạn thì làm gì — đề xuất, để
  chủ quán chọn trong `## Câu hỏi`).
- F Huỷ hai lần / hai người bấm cùng lúc → chỉ MỘT dòng trừ (cổng huỷ hiện có + điều kiện chặn đua trong câu ghi).
- G `DELETE /:id`: đơn có `earn` → kế hoạch đề xuất chặn xoá hay trừ điểm như huỷ (một câu trong `## Câu hỏi`), không tự quyết.
- H Bất biến I8 (`cong_cu/gia_lap/bat_bien.js`) + ghi chú đầu file: đơn đã huỷ → tổng điểm của đơn (earn + trừ) = 0; đơn huỷ TRƯỚC mốc gộp
  P24 thì giữ như cũ (mốc theo khuôn `DIEM_KHI_THU_TU` của P22-23, ghi tạm, chat sửa lúc duyệt PR). Kịch bản giả lập có ca huỷ đơn có điểm.
- I K5: huỷ đơn hoàn ví / hoàn kho / huỷ gói / huỷ thẻ chạy như cũ; hoàn tiền (`refunds.js`) KHÔNG đổi trong việc này (kế hoạch ghi rõ
  hoàn một phần hiện đang làm gì với điểm, để việc sau).

## Phạm vi
- viec/P24/**
- server/routes/orders.js
- server/routes/signup-codes.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/thu_P24.js
- cong_cu/thu_P2223.js
- cong_cu/thu_gia_lap.js
- cong_cu/thu_DOISOAT1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — bài mới `cong_cu/thu_P24.js` (máy chủ thật trên kho tạm, theo khuôn `thu_P2223.js`) phải ĐỎ trên code gốc.

## Ngân sách
orders.js ≤ ~50 dòng đổi; bất biến + kịch bản ≤ ~50; bài thử mới ~200.
**Vùng sửa của file chung:** `orders.js` CHỈ trong `PUT /:id/cancel` (và `DELETE /:id` nếu chủ quán chọn ở G). KHÔNG đụng `POST /`,
`pay-debt`, hàm `tinhDiemDon` (P3 đang sửa các vùng đó song song). `kiem_tra_truoc_khi_giao.js`: CHỈ thêm tên `cong_cu/thu_P24.js` vào CUỐI mảng bài chạy thật (dòng ~495) — P3 cũng thêm vào
mảng đó; script gộp của chat giữ cả hai tên, đó là đụng nhau đã biết.
**Phương án đơn giản nhất đã xét:** một câu INSERT … SELECT trong giao dịch huỷ, lấy tổng `earn` theo `order_id`, kèm điều kiện chưa có dòng trừ.

## Đổi cấu trúc DB
không (dùng loại dòng sẵn có nếu được; cần loại mới → kế hoạch nêu, không thêm cột)

## Thư viện mới
không

## Cấm
- KHÔNG sửa `refunds.js`, `signup-codes.js` ngoài câu chiếm mã + `baoChiemHong` (điểm duyệt 3), `server/routes/kh/**`, `client/**`, `server/database.js`.
- KHÔNG đổi cách tính điểm cộng (P3), hoàn thu (P13e đã gộp vào việc sau), đổi quà.
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/P24`. Không đụng main, không merge, không tạo PR.
