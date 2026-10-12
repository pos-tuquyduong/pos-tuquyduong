# P26c — Vá các lỗ tiền / gói / kho còn lại sau P26b, theo 4 quyết định chủ quán chốt 12.10

<!-- Phiếu do chat soạn 12.10.2026. Nền: main sau sổ việc v27 (cha 6c281f5 = Merge PR #14 TU-CHAY-5, tu-chay 1.5.0).
     Nguồn (máy đọc NGUYÊN VĂN, số trong ngoặc là số Phát hiện ở đó; số dòng có thể đã trôi — grep lại):
       viec/P26b/trang_thai.md ## Phát hiện (12, 13, 14, 16, 20, 22, 23, 24) · viec/P26b/ke_hoach.md ## 10 (1, 4, 6, 8)
       viec/LUOI-1/trang_thai.md ## Phát hiện (1–7, 10, 11, 12) · viec/TACH-GL/trang_thai.md ## Phát hiện (1)
     Chat đọc code 12.10 (main 6c281f5): damages.js:152–166 trần đền theo MAX(unit_price) / SUM(unit_price*quantity), :162
     `soGui || damage_value` (gõ 0 → đền ĐỦ); Settings.jsx:565–571 thêm quà không gửi max_discount; DiscountCodes.jsx có ô
     "Giảm tối đa" (max_discount); auth.js:84–117 checkPermission (owner luôn được, role khác đọc pos_permissions);
     database.js:926–977 quyền mặc định CHỈ chèn khi bảng pos_permissions rỗng; orders.js:1340–1360 huỷ đơn mua gói:
     gói chưa giao → xoá, đã giao → 'cancelled', ví được hoàn TRỌN balance_amount. -->

**Chờ duyệt kế hoạch:** viết `viec/P26c/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.
Chưa viết bài thử, chưa sửa code cho tới khi chủ quán gửi lời duyệt.

## Mục tiêu
Quầy không còn đường nào làm khách nhận tiền / gói / kho hai lần hoặc sai số, theo đúng 4 quyết định chủ quán (mục Q),
và gỡ được 5 quy tắc tạm ở quầy (nhóm G). Làm bây giờ vì là việc tiền cuối trước chế độ tự chạy; các việc sau (DOI-SOAT-1,
P20b, P22–P24) dựa trên các đường này. Đích: xong 14.10 (song song AUDIT-2) — KHÔNG cắt chất lượng để kịp.

## Quyết định chủ quán (chốt 12.10 — chép đúng, không diễn lại)
- Q1 **Quà đổi điểm loại giảm %** theo cài đặt như **Mã giảm giá** (màn `DiscountCodes.jsx` có ô "Giảm tối đa" →
  `max_discount`). Màn Cài đặt → Quà đổi điểm (`client/src/pages/Settings.jsx` form `rewardForm`, POST `/api/pos/rewards`)
  thêm ô "Giảm tối đa", gửi `max_discount`; voucher đổi ra mang trần đó. (TACH-GL Phát hiện 1.)
- Q2 **Báo sự cố đơn → Hoàn tiền: hoàn đúng số tiền khách ĐÃ TRẢ**, không theo giá gốc: tính cả giảm flash / hạng
  (`flash_unit_price`, `tier_unit_price`) và giảm cấp đơn (`pos_orders.discount`). Tiền đền vào VÍ khách (`ghiVi` loại
  `compensation`). (P26b Phát hiện 13.)
- Q3 **Chọn B:** action "Hoàn tiền" (`refund`) BẮT BUỘC số > 0 (máy chủ trả 400, màn hình báo rõ); không hoàn → dùng
  "Chỉ ghi nhận" (`none`). Không còn "gõ 0 = đền đủ". (P26b ke_hoach Phát hiện 6.)
- Q4 **Gói trả trước: mua rồi KHÔNG hoàn.** Ngoại lệ buộc phải hoàn → hoàn **giá trị còn lại** = giá đã trả × lượt còn lại ÷
  tổng lượt (gói 10 chai 300.000, lấy 4 → hoàn 180.000). Chỉ người có quyền mới làm được: thêm MỘT quyền riêng, mặc định chỉ
  owner (chat đề xuất — chủ quán xác nhận khi duyệt kế hoạch). Quyền mới phải có trên kho ĐANG CHẠY (bảng `pos_permissions`
  đã có dữ liệu), không chỉ trong danh sách mặc định. Áp cho huỷ và xoá đơn mua gói. (LUOI-1 Phát hiện 12.)
Chỗ nào 4 quyết định chưa phủ (vd đơn mua gói kèm món khác; phần trả tiền mặt / CK — máy chỉ ghi, người trả tay) → kế hoạch
đề xuất cách đơn giản nhất trong `## Câu hỏi`, KHÔNG tự chọn.

## Nghiệm thu
Mỗi mục: ca thử ĐỎ trên gốc → XANH sau vá (bài mới `cong_cu/thu_P26c.js` hoặc kịch bản giả lập), kèm số tiền cụ thể.

### A. Gói
- A1 (P26b 14) Huỷ rồi xoá đơn "giao từ gói" → `delivered_qty` chỉ hoàn MỘT lần (giao 5, huỷ đơn 2 ly → còn 3; xoá → vẫn 3).
- A2 (LUOI-1 5) Lấy quá lượt gói (theo số lượng; hai quầy chồng nhau) → đơn sau bị chặn, `delivered_qty` ≤ tổng lượt.
- A3 (LUOI-1 11) Một đơn vừa MUA gói mới vừa LẤY từ gói cũ → máy chủ từ chối (400, lời rõ), không trừ lượt gói nào.
- A4 (LUOI-1 4) `PUT /packages/customer-packages/:id/deliver` bỏ (như `POST /buy` ở P26b) — sau vá gọi trả 404.
- A5 (Q4) Huỷ / xoá đơn mua gói: không có quyền mới → 403, không đổi gì; có quyền → hoàn đúng giá trị còn lại (ca 300.000 /
  10 lượt / lấy 4 → 180.000; chưa lấy → hoàn đủ; lấy hết → 0), gói bị gỡ / huỷ như hiện nay.

### B. Báo sự cố đơn (`server/routes/damages.js`, màn Đơn hàng `Orders.jsx`)
- B1 (Q2) Trần "Hoàn tiền" theo số khách ĐÃ TRẢ: đơn giảm flash / hạng / mã đơn → đền tối đa đúng số trả (ca: món 30.000 giá
  flash 25.000 → trần 25.000; đơn 2 món 100.000 giảm đơn 20.000 → tổng trần 80.000). Đơn không giảm → như cũ.
- B2 (Q3) "Hoàn tiền" với số 0 / trống → 400, ví không đổi; "Chỉ ghi nhận" vẫn ghi được (K5).
- B3 (P26b 16) "Hoàn kho SX" trên đơn đã huỷ → không gọi SX hoàn kho lần hai.
- B4 (P26b 20) "Hoàn tiền" trên đơn CHƯA THU (nợ) → không cộng ví (kế hoạch đề xuất chặn hay trừ vào nợ — `## Câu hỏi`).
- B5 (P26b ke_hoach 8) Đền bù rồi huỷ đơn / duyệt hoàn → khách KHÔNG nhận cả hai (tổng nhận ≤ số đã trả).

### C. Đơn, ví, thu nợ
- C1 (P26b 12) `POST /:id/pay-debt` trên đơn `refunded` → chặn (như `cancelled`).
- C2 (P26b ke_hoach 4 + LUOI-1 7) Xoá đơn → không còn mã bill mồ côi (`pos_signup_codes`, I2) và nợ kho SX của đơn đã xoá
  KHÔNG còn bị tự đẩy sang SX (`doSoNo.js`, I7).
- C3 (P26b ke_hoach 1, 22, 24) Duyệt hoàn giảm `total_spent` như huỷ đơn (cả ví mẹ); có phép canh cột `total_spent` /
  `total_topup` (đột biến đổi dấu `soCot` phải BẮT).
- C4 (P26b 23) Thông báo duyệt hoàn (`refunds.js`) ghi cả phần ví mẹ (duyệt 5.000 con + 20.000 mẹ → báo 25.000).
- C5 (LUOI-1 10) Xoá đơn mua thẻ → gỡ `pos_membership_purchases` (hoàn tiền thì mất hạng); thêm kịch bản phủ.

### D. Mã giảm giá, quà đổi điểm, hạng thẻ
- D1 (Q1) Ô "Giảm tối đa" trên màn thêm quà; quà 50 % trần 50.000, đơn 500.000 → giảm 50.000 (không phải 250.000).
- D2 (LUOI-1 1) Huỷ / xoá đơn mà KHÔNG trả lượt mã giảm giá → khách mất cả mã lẫn điểm. Nghiệp vụ CHƯA chốt: kế hoạch đề xuất
  cách đơn giản nhất (vd trả lại lượt mã khi huỷ / xoá) trong `## Câu hỏi`; làm theo lời chủ quán khi duyệt.
- D3 (LUOI-1 2) `POST /orders` chỉ lưu `discount_code` khi mã THẬT SỰ được áp.
- D4 (LUOI-1 3) `pos_voucher_grants.status` chuyển `used` khi voucher được dùng (khớp cách D2 được chốt).
- D5 (LUOI-1 6) Hạng thẻ mặc định không còn "Kim cương" (`database.js:1144`; CLAUDE.md §5.6: chỉ Vàng, Bạch Kim) — chỉ đổi
  danh sách mặc định, KHÔNG xoá dữ liệu hạng đang có.

### E. Lưới (giả lập, đột biến) — theo sổ việc
- E1 Mỗi luật tiền mới / sửa có bất biến hoặc khẳng định số tiền (`c.mong`) canh. Bất biến chỉ ĐỌC DB — DOI-SOAT-1 sẽ chạy
  chính các bất biến này trên dữ liệu thật (luật đối soát, CLAUDE.md điều 5).
- E2 Thêm KB → gán vào `LUOT` (`cong_cu/gia_lap/kich_ban.js`), mỗi lượt < 180 s (đo chạy RIÊNG). Thêm bất biến → sửa CẢ T9c,
  `DONG_DAT` (`cong_cu/thu_gia_lap.js`) và `NGUONG_BAT_BIEN` / `NGUONG_KICH_BAN` (`kiem_tra_truoc_khi_giao.js`, chỉ tăng).
- E3 `viec/P26c/dot_bien.py`: mỗi chỗ vá ≥ 1 VS- (vá sai) + BV- (bỏ vá), đều BẮT. Đột biến cũ đang BẮT vẫn BẮT
  (`viec/LUOI-1/dot_bien.py` 80/80, `viec/TACH-GL/dot_bien.py` 29/29, `viec/P26b/dot_bien.py` — hoặc ghi rõ đột biến nào đổi
  mong đợi vì hành vi CỐ Ý đổi theo Q1–Q4).

### G. Gỡ quy tắc tạm ở quầy
`trang_thai.md` có bảng 5 quy tắc tạm (đơn giao từ gói chỉ Huỷ không Xoá; đơn đã huỷ không báo sự cố; đơn mua thẻ chỉ Huỷ không
Xoá; không huỷ đơn mua gói đã lấy hàng; không cho một đơn vừa mua gói mới vừa lấy gói cũ) → mục nghiệm thu + ca chứng minh quy
tắc đó hết cần (chủ quán báo nhân viên sau khi gộp).

### H. Toàn bộ
`npm test`, `node kiem_tra_truoc_khi_giao.js --day-du` xanh, 0 CẢNH BÁO lúc chạy riêng; `thu_P26a`, `thu_P26b`, `thu_P20`,
`thu_gia_lap` xanh; `client/` build lại (P1). Kế hoạch ghi ước lượng thời gian máy (đo, không đoán); quá ~180 phút → đề xuất
tách P26c-1 / P26c-2 trong `## Câu hỏi`, KHÔNG tự cắt mục.
Luồng hợp lệ phải KHÔNG bị chặn (K5): bán thường, lấy từ gói trong lượt, huỷ đơn thường, "Chỉ ghi nhận", "Hoàn kho SX" trên đơn
còn hiệu lực, hoàn tiền dưới trần, dùng mã / quà hợp lệ, owner huỷ đơn mua gói.

## Phạm vi
- viec/P26c/**
- server/routes/orders.js
- server/routes/damages.js
- server/routes/refunds.js
- server/routes/packages.js
- server/routes/loyalty.js
- server/routes/rewards.js
- server/routes/discount-codes.js
- server/routes/membership.js
- server/utils/doSoNo.js
- server/database.js
- client/src/pages/Settings.jsx
- client/src/pages/Orders.jsx
- client/src/pages/Sales.jsx
- client/src/pages/Refunds.jsx
- client/dist/**
- cong_cu/thu_P26c.js
- cong_cu/thu_P26b.js
- cong_cu/thu_gia_lap.js
- cong_cu/gia_lap/kich_ban.js
- cong_cu/gia_lap/bat_bien.js
- cong_cu/gia_lap/chay.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~250–400 dòng code máy chủ + ~40 dòng màn hình; ~400 dòng thử (bài mới + KB + bất biến). Vượt 1,5 lần thì giải thích.
**Phương án đơn giản nhất đã xét:** sửa tại chỗ từng route theo khuôn sẵn có (`ghiVi`, `trongGiaoDich`, cổng trạng thái như A3
P26b); một hàm dùng chung chỉ khi ≥ 2 route cần CÙNG phép tính (vd số tiền khách đã trả cho một dòng — Q2, B5). Không dựng
lớp / bảng mới nếu một cột hoặc một câu SQL đủ.

## Đổi cấu trúc DB
không — cần thêm cột / bảng thì ghi trong kế hoạch (chỉ THÊM, không xoá, không đổi tên) để chủ quán duyệt.

## Thư viện mới
không

## Cấm
- `server/database.js`: CHỈ đổi dữ liệu mặc định (hạng thẻ D5, quyền mới Q4 + chèn quyền đó cho kho đang chạy). Không đụng kết
  nối, giao dịch, `ghiVi`, khôi phục sao lưu — đó là P26d.
- Không sửa `.claude/`, `.github/`, `tu_chay/`, `CLAUDE.md`, `CHECKLIST_CODE.md`, `ban_mau_pos/`, sổ việc. Không chạy
  `cai_dat.sh`, `patch_*.py`.
- Không nới hạn (120 s bộ kiểm, 110 s giả lập con, 180 s mỗi lượt), không hạ ngưỡng, không giảm trễ 40 ms, không bớt kịch bản /
  bất biến / `c.mong`; bánh cóc chỉ tăng. Không sửa `kiem_tra_truoc_khi_giao.js` để tắt cảnh báo (K8).
- Gặp nghiệp vụ chưa chốt → DỪNG, ghi `## Câu hỏi`; không tự chọn.
- Chỉ push đúng `git push -u origin viec/P26c`. Không đụng `main`, không merge, không tạo PR.
