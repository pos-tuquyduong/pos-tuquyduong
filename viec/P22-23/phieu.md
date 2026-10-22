# P22-23 — Điểm thưởng chỉ cộng khi thu đủ · chặn mua gói / thẻ hội viên chưa thu đủ · sửa bất biến I8

<!-- Phiếu do chat soạn 22.10.2026. Việc tiền [T] — máy lập kế hoạch, dừng chờ chủ quán duyệt. Nền: main `fabe583` (đã gộp P26d #36:
     pay-debt một giao dịch, DOI-SOAT-1 #37). Quyết định chủ quán đã chốt (đừng hỏi lại): 02.10 điểm CHỈ cộng khi thu đủ; điểm ÂM khi
     khách đã tiêu (áp cho P24, không làm ở đây); 13.10 đơn giảm Flash nhận điểm bằng mã in trên bill cũng 0 điểm; đơn mua gói / thẻ phải
     thu đủ mới tạo được. Code hiện tại (đọc 22.10): orders.js POST / khối "LOY-1 Gói 2" (~820-855 chuẩn bị, ~1051-1065 ghi earn) cộng điểm
     cho MỌI đơn có SĐT, kể cả đơn chưa thu; pay-debt (~1239-1385) KHÔNG cộng điểm; bat_bien.js I8 ghi "đơn chưa thu và đơn đã huỷ VẪN giữ
     điểm" — phải đổi cùng lúc (ghi chú đầu file đó đã dặn). Việc này sửa orders.js → chạy TRƯỚC P24 và KH-DON-1 (cùng sửa orders.js). -->

**Chờ duyệt kế hoạch:** viết `viec/P22-23/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

**Đã duyệt (chủ quán 22.10, sau khi soát kế hoạch `ke_hoach.md` đầu nhánh `af4573f`):** kế hoạch được duyệt kèm các điểm sau; máy làm tiếp từ
bước 4 (`/lam-viec P22-23 tiep`) tới hết, không dừng hỏi lại các điểm này:
1. Thêm `cong_cu/thu_GOI1.js` vào Phạm vi. Ca B3n (dòng ~713, mua gói GHI NỢ để thử `DON_CON_NO`): mua gói TRẢ ĐỦ rồi `UPDATE pos_orders`
   về dạng nợ cũ ngay trong kho thử — vẫn canh đúng `DON_CON_NO` (cùng cách sửa ca L6a của `thu_P26c.js`).
2. "Gia hạn gói" theo nghĩa của code (orders.js:194): đơn có `customer_package_id` + `package_buy` (MUA gói mới). Đơn này mà chưa thu đủ →
   CHẶN 400 như mọi đơn mua gói (chủ quán chốt 22.10). Đơn chỉ dùng món `from_package` của gói đang có (không `package_buy`) → không bị chặn.
3. Mốc I8 = ngày gộp + 1; ghi tạm `'2026-10-24'`, chat sửa đúng ngày lúc duyệt PR.
4. Hai mã lỗi mới `GOI_THE_CHUA_THU_DU`, `DON_FLASH_KHONG_DIEM` được duyệt.
5. Hàm `tinhDiemDon` đặt ở đầu `orders.js` (vùng sửa thứ tư của file này) — được phép.
6. Sửa ca L6a của `thu_P26c.js` và ca D2d của `thu_DOISOAT1.js` (tạo đơn còn nợ) — được phép.
7. Mục E(3): code đã chặn sẵn bill chưa thu (`BILL_CHUA_THANH_TOAN`, signup-codes.js ~44-70) → không còn câu hỏi "chặn hay giữ".

## Mục tiêu
Điểm thưởng đúng nghĩa "đã thu tiền mới có điểm": đơn ghi nợ / bill mang ra bàn chờ thu không có điểm cho tới khi thu đủ; đơn mua gói hay
thẻ hội viên không bao giờ tồn tại ở trạng thái chưa thu đủ. Đối soát (I8) canh đúng luật mới.

## Nghiệm thu
- A Thu đủ lúc tạo: đơn có SĐT, thu đủ ngay (tiền mặt / CK / ví) → cộng điểm như cũ (số điểm, hạn điểm, dòng `earn` không đổi) — K5.
- B Chưa thu đủ lúc tạo: đơn chờ thu / ghi nợ / còn nợ → KHÔNG có dòng `earn` nào lúc tạo.
- C Thu nợ (`POST /api/pos/orders/:id/pay-debt`): lần thu làm `payment_status` thành `paid` và đơn CHƯA có dòng `earn` → cộng điểm trong
  CÙNG giao dịch với UPDATE đơn + dòng `debt_payment` + nhật ký (một lệnh ghi điểm lỗi không làm hỏng lần thu — giữ cách bọc như khối
  LOY-1 hiện có). Thu một phần (`partial`) → 0 điểm. Số điểm tính theo tổng đơn, cùng công thức lúc tạo, theo cài đặt điểm LÚC THU;
  đơn giảm Flash → 0 điểm (F2). Hai lần thu cùng lúc / bấm đúp → tối đa MỘT dòng `earn` cho đơn (điều kiện chặn đua viết trong câu ghi,
  kiểm `changes`; kiểm đủ cả trường hợp nợ chia hai lần thu).
- D Mua gói / thẻ: đơn có `package_buy` hoặc `membership_buy` mà chưa thu đủ (chờ thu, ghi nợ, còn nợ) → từ chối 400, `{ error: <lời
  tiếng Việt>, code: 'MA_IN_HOA' }` (mã mới, đặt cùng khuôn mã lỗi sẵn có trong orders.js); không ghi gì (không đơn, không gói, không
  ví, không kho). Thu đủ → qua như cũ. Luồng hợp lệ KHÔNG bị chặn: đơn dùng món `from_package` của gói đang có
  (không `package_buy`), đơn thường có nợ không kèm gói / thẻ, đơn trả đủ bằng ví.
- E Nhận điểm bằng mã bill (`signup-codes.js` `/nhan-diem`, hàm `nhanDiemMaBill`): (1) đơn giảm Flash → 0 điểm (chủ quán chốt 13.10;
  LUOI-2 Phát hiện 1); (2) hệ số nhân điểm: hai chỗ tính (orders.js chỗ in mã ~1148 và signup-codes.js ~108) lệch nhau khi hệ số < 1 →
  về MỘT hàm dùng chung (LUOI-2 Phát hiện 3); (3) đơn chưa thu đủ: kế hoạch ghi rõ code hiện cho nhận điểm hay không; nếu đang cho →
  KHÔNG tự đổi, ghi `## Câu hỏi` MỘT câu chọn cho chủ quán ("chặn tới khi thu đủ" / "giữ nguyên"); đừng làm trước khi có câu trả lời.
- F Bất biến I8 (`cong_cu/gia_lap/bat_bien.js`) + ghi chú đầu file: đơn chưa thu đủ KHÔNG có `earn`; đơn đã thu đủ có đúng điểm; đơn đã
  huỷ — GIỮ như hiện tại (P24 đổi sau). Chỉnh kịch bản `kich_ban.js` chỉ ở kịch bản điểm / nợ nếu bất biến mới đòi. Dữ liệu CŨ có `earn`
  trên đơn chưa thu: không migrate, không xoá; I8 chỉ canh đơn tạo sau mốc thay đổi — mốc nào do kế hoạch đề xuất (đơn tạo sau ngày
  gộp), nêu rõ cách giả lập tạo đơn trong kho tạm vẫn xanh.
- G Hai người cùng bấm thu (ca đua) + thu lần hai khi đã `paid` → 400 `DA_THU_ROI` như cũ, không cộng thêm điểm.

## Phạm vi
- viec/P22-23/**
- server/routes/orders.js
- server/routes/signup-codes.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/thu_P2223.js
- cong_cu/thu_DOISOAT1.js
- cong_cu/thu_KH1.js
- cong_cu/thu_P20.js
- cong_cu/thu_P26c.js
- cong_cu/thu_gia_lap.js
- cong_cu/thu_GOI1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — bài mới `cong_cu/thu_P2223.js` (máy chủ thật trên kho tạm, theo khuôn `thu_P26c.js` / `thu_KH1.js`) phải ĐỎ trên code gốc.

## Ngân sách
orders.js ≤ ~80 dòng đổi; signup-codes.js ≤ ~30; bất biến + kịch bản ≤ ~60; bài thử mới ~250.
**Vùng sửa của file chung (checklist 22.10):**
- `orders.js`: CHỈ (1) cổng đầu `POST /` cho `package_buy` / `membership_buy`; (2) khối LOY-1 chuẩn bị + ghi điểm; (3) `pay-debt`; (4) hàm `tinhDiemDon` ở đầu file (đã duyệt 22.10). Không động
  cancel / delete / PUT. Không đụng việc khác — P24 và KH-DON-1 chạy SAU.
- `kiem_tra_truoc_khi_giao.js`: CHỈ thêm tên `cong_cu/thu_P2223.js` vào mảng bài chạy thật (dòng ~495) — không đổi ngưỡng, không đổi phép.
- Bài cũ trong Phạm vi (`thu_DOISOAT1`, `thu_KH1`, `thu_P20`, `thu_P26c`, `thu_gia_lap`, `thu_GOI1`): CHỈ sửa chỗ canh luật điểm CŨ (đơn chưa thu vẫn
  có điểm) theo luật mới, ghi từng chỗ + lý do vào `trang_thai.md`; KHÔNG bớt ca đang canh việc khác. Việc cố ý đổi hành vi → không ghi vào
  mục "Bài thử cũ sửa".
- Màn Bán hàng (`Sales.jsx`) đã hiện lỗi máy chủ trả về; không sửa client trong việc này. Nếu thấy cần → `## Câu hỏi`.

## Đổi cấu trúc DB
không (không thêm bảng, không thêm cột; không đổi `BACKUP_TABLES`)

## Thư viện mới
không

## Cấm
- KHÔNG sửa `server/database.js`, `server/routes/wallets.js`, `server/routes/customers*.js`, `server/routes/kh/**`, `client/**`.
- KHÔNG làm điểm âm / huỷ đơn trừ điểm (P24), hoàn thu (P13e), đơn từ App KH (KH-DON-1).
- Không sửa `tu_chay/`, `.claude/`, `.github/`, sổ việc, `LUAT_XAY_APP.md`. Chỉ push `git push -u origin viec/P22-23`. Không đụng `main`, không merge, không tạo PR.
