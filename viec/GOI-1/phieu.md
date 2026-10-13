# GOI-1 — Gói sản phẩm: tổng tự khớp từng loại, chặn theo loại ở máy chủ, xem / dừng gói của khách

<!-- Phiếu do chat soạn 13.10.2026. Nền: main sau sổ việc v28 (cha 9a68ab6 = Merge PR #16 P26c). Chủ quán chốt 13.10 (đồng ý
     hết, chép đúng — mục Quyết định). Chat đọc code main 9a68ab6:
       client/src/pages/Settings.jsx: form gói — ô "Tổng SL SP" gõ tay (pkgForm.total_qty) tách khỏi "📋 SP trong gói" (mỗi loại
         một SL; dòng "Tổng từ items" chỉ hiển thị); khi lưu bỏ loại có SL ≤ 0 (`package_items.filter(i => i.qty > 0)`); bảng gói
         có "🔒 N KH" = `active_users` (packages.js GET / đếm cp.status='active'); gói có KH thì không mở được form sửa.
       client/src/pages/Sales.jsx:~415–430: màn hình chặn lấy vượt TỪNG LOẠI (pkgItem.qty − đã lấy) — máy chủ KHÔNG chặn theo loại
         (orders.js chỉ chặn tổng, từ P26c A2).
       server/routes/packages.js: GET /customer/:phone tính `delivered_items` từ đơn có customer_package_id, món unit_price = 0 —
         KHÔNG loại đơn ĐÃ HUỶ (đơn xoá thì mất dòng nên không đếm); món lấy từ gói KHÔNG có cột đánh dấu riêng (nhận theo giá 0); GET /customer-packages/all không kèm tên khách; PUT /customer-packages/:id/cancel có sẵn
         (quyền manage_users, ghi notes) nhưng KHÔNG màn nào gọi.
       client/src/pages/Reports.jsx tab "📦 Gói SP": danh sách gói của khách theo SĐT (lọc Tất cả / Đang giao / Sắp hết / Xong, tìm
         SĐT hoặc tên gói, xem lịch sử giao) — không có tên khách, không có nút xử lý; không mở thẳng được bằng đường dẫn.
       orders.js chặn lấy hàng khi cp.status ≠ 'active' (GOI_HET_HIEU_LUC); trạng thái `completed` khi delivered ≥ total.
     Dữ liệu thật (ảnh chủ quán 13.10): gói NTD (14 KH) "Tổng SL SP" trống; một khách ở 150 % (lấy vượt — P26c đã chặn từ nay). -->

**Chờ duyệt kế hoạch:** viết `viec/GOI-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.
(Giữ bước duyệt tới khi audit đạt điểm dừng — gói là đường tiền.)

## Mục tiêu
Gói trả trước quản lý được trọn vẹn trên các màn CÓ SẴN: số túi luôn khớp danh sách loại, lấy hàng không vượt từng loại kể cả gọi
API thẳng, chủ quán bấm từ "N KH" là thấy đủ danh sách khách (có tên), thấy ngay khách lâu không đến và đóng được gói của khách
đã thôi / dùng thử — không phải dò từng khách. Ít nút, ít thao tác nhất có thể. Đích: xong 14.10, song song LUOI-2 (không chung file). Không cắt chất lượng để kịp.

## Quyết định chủ quán (13.10 — chép đúng)
- Q1 Gói CÓ danh sách "SP trong gói": "Tổng SL SP" TỰ TÍNH = tổng SL các loại, không gõ tay; gói KHÔNG có danh sách: gõ tay như
  nay. Giao hàng thì cả tổng còn lại lẫn số còn lại của từng loại cùng giảm.
- Q2 Không cho lưu gói giá 0đ.
- Q3 Từ Cài đặt → Gói SP, bấm "🔒 N KH" → mở Báo cáo → Gói SP lọc sẵn đúng gói đó (dùng lại màn có sẵn, không làm màn mới).
- Q4 Báo cáo → Gói SP hiện đủ: tên khách + SĐT, tên gói, đã lấy / tổng, ngày mua, lần lấy gần nhất, trạng thái; bấm tên khách → mở
  màn Khách hàng của người đó; tìm được theo tên lẫn SĐT; sắp xếp được theo "lần lấy gần nhất" (khách lâu không đến lên đầu).
  Gói lấy vượt (> 100 %) tô đỏ.
- Q5 "Dừng gói" trên từng gói: bắt nhập lý do, CHỈ chủ quán, KHÔNG hoàn tiền, KHÔNG xoá hẳn (giữ lịch sử để đối soát). Hoàn tiền
  vẫn chỉ đi một đường: Huỷ đơn mua gói (P26c Q4).
- Q6 KHÔNG làm nút "Tạm dừng / Tiếp tục" (chủ quán 13.10: gói chỉ trừ khi khách lấy hàng, khách đi vắng thì gói tự đứng yên;
  càng nhiều nút càng dễ nhầm — hướng tới ít thao tác nhất). Khách lâu không đến nhận ra bằng cột "lần lấy gần nhất" (Q4).
- Không làm: tạm dừng, sửa tay số túi, xoá hẳn gói của khách, tự hết hạn gói.

## Nghiệm thu
Mỗi mục: ca thử ĐỎ trên gốc → XANH sau vá (bài mới `cong_cu/thu_GOI1.js`; phép kiểm màn hình như A7 của P26c), kèm số cụ thể.
- A1 (Q1) Thêm / sửa gói có danh sách: máy chủ lưu `total_qty` = tổng SL các loại, bỏ qua số gửi (ca: 5+5+5+5+5+6 → 31, gửi 30 →
  lưu 31); form hiện tổng tự tính, ô không sửa được. Gói không có danh sách: lưu số gõ (≥ 1 như P26c). Loại tích mà SL ≤ 0 → báo
  lỗi rõ, không âm thầm bỏ loại.
- A2 (Q1) Máy chủ chặn lấy vượt TỪNG LOẠI (400, lời nêu loại + số còn): CT1 cài 5, đã lấy 3, xin 3 → 400; xin 2 → 200. Đếm "đã
  lấy" của loại CHỈ từ đơn còn hiệu lực (loại đơn đã huỷ), nhận món lấy từ gói đúng như cách máy chủ đang trừ lượt — sửa luôn `delivered_items` cho màn Bán hàng theo cùng một cách đếm
  (một hàm dùng chung, không hai công thức). Kiểm trong cùng giao dịch với phép chặn tổng (hai quầy cùng bấm không vượt).
- A3 (Q2) Thêm / sửa gói giá ≤ 0 → 400 + màn hình báo; bật / tắt gói cũ vẫn được.
- A4 (Q3, Q4) Đường dẫn mở thẳng Báo cáo → Gói SP có lọc theo gói (vd `/reports?tab=packages&goi=<mã>`); "🔒 N KH" là liên kết
  tới đó. Danh sách có các cột Q4 (máy chủ trả kèm tên khách — JOIN theo SĐT đã chuẩn hoá); tìm theo tên; > 100 % tô đỏ; bấm tên →
  màn Khách hàng mở đúng khách (đường dẫn có SĐT).
- A5 (Q5) "Dừng gói": chỉ owner (dùng quyền `refund_package` có sẵn từ P26c); bắt lý do không rỗng; chuyển `cancelled`, ghi lý do +
  người + thời điểm vào `notes`; ví / tiền / `delivered_qty` không đổi; gói đã hoàn thành / đã dừng → 400. Lấy hàng từ gói đã
  dừng → 400 (như nay).
- A6 Luồng hợp lệ KHÔNG bị chặn (K5): bán gói mới, lấy hàng trong giới hạn từng loại, gói không có danh sách lấy loại nào cũng được,
  huỷ đơn lấy hàng trả đúng lượt (cả số theo loại), bật / tắt gói.
- A7 `client/` build lại (P1); `npm test`, `node kiem_tra_truoc_khi_giao.js --day-du` xanh, 0 CẢNH BÁO; `viec/GOI-1/dot_bien.py`
  mỗi chỗ vá ≥ 1 VS- + BV-, đều BẮT; đột biến P26c vẫn BẮT (hoặc ghi rõ cái nào đổi mong đợi vì hành vi CỐ Ý đổi).
- A8 Đối soát (CLAUDE.md điều 5): `trang_thai.md` ghi quy tắc đối soát cho "Dừng gói" (gói dừng không phát sinh tiền; số túi bỏ
  dở = total − delivered để DOI-SOAT-1 đếm) — chỉ ghi, không làm màn đối soát.

## Phạm vi
- viec/GOI-1/**
- server/routes/packages.js
- server/routes/orders.js
- server/utils/goiKhach.js
- client/src/pages/Settings.jsx
- client/src/pages/Reports.jsx
- client/src/pages/Customers.jsx
- client/src/pages/Sales.jsx
- client/dist/**
- cong_cu/thu_GOI1.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~150–250 dòng code + ~250 dòng thử.
**Phương án đơn giản nhất đã xét:** sửa tại chỗ route gói + một hàm dùng chung đếm "đã lấy theo loại" (`server/utils/goiKhach.js`);
dùng lại màn Báo cáo → Gói SP và lệnh huỷ gói có sẵn (thêm đúng MỘT nút "Dừng gói") — không thêm trạng thái, bảng, cột, màn
hình.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa giả lập (`cong_cu/gia_lap/**`, `cong_cu/thu_gia_lap.js`) — LUOI-2 đang sửa song song; bài thử của việc này đặt ở
  `cong_cu/thu_GOI1.js`. Cần bất biến mới → ghi Phát hiện cho việc sau.
- Không sửa `server/database.js`, `server/utils/tienDaTra.js`, tiền hoàn (P26c), `.claude/`, `.github/`, `tu_chay/`, `CLAUDE.md`,
  sổ việc. Không nới hạn, không hạ ngưỡng; bánh cóc chỉ tăng.
- Gặp nghiệp vụ chưa chốt → DỪNG, ghi `## Câu hỏi`; không tự chọn.
- Chỉ push đúng `git push -u origin viec/GOI-1`. Không đụng `main`, không merge, không tạo PR.
