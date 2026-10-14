# GOI-2 — Báo cáo gói: mỗi khách một dòng, "Kết thúc gói" (hoàn / không hoàn phần còn lại), các màn liên quan bấm là sang

<!-- Phiếu do chat soạn 13.10.2026. Nền: main sau sổ việc v29 (cha c591b9e = Merge PR #18 LUOI-2; GOI-1 gộp 28f65d1).
     Chủ quán xem màn Báo cáo → Gói SP sau GOI-1 (13.10): thông tin rời rạc (một khách nằm rải nhiều dòng — chị Thanh Nga 5
     dòng), nút "Dừng gói" trên MỌI dòng dễ nhầm, một gói 30/30 vẫn ghi "Đang giao". Chủ quán duyệt bản demo của chat (13.10):
     mỗi khách một dòng (Khách · số gói · còn lại (túi) · lần lấy gần nhất + cảnh báo "… tháng chưa lấy"), bấm mở từng gói;
     3 lọc; nút "Kết thúc gói…" mở hộp 2 lựa chọn có SỐ TIỀN; và 4 đường bấm giữa các màn.
     Chat đọc code main c591b9e: Reports.jsx nhận ?tab=packages&goi=<id> (GOI-1); Customers.jsx nhận ?phone= (GOI-1);
     Orders.jsx có ô tìm mã đơn (state searchCode) nhưng KHÔNG nhận tham số đường dẫn; packages.js PUT
     /customer-packages/:id/cancel (quyền refund_package, bắt lý do, UPDATE … WHERE status='active'); hoàn gói theo đơn đi qua
     soTienHoan (server/utils/tienDaTra.js, P26c 1B: toàn bộ vào ví, phần ví mẹ về ví mẹ tối đa số mẹ đã trả). -->

**Chờ duyệt kế hoạch:** viết `viec/GOI-2/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.
(Đụng tiền: "Kết thúc gói — hoàn phần còn lại" là đường hoàn MỚI.)

## Mục tiêu
Chủ quán nhìn một màn là biết mỗi khách còn bao nhiêu túi, ai lâu chưa lấy, và xử lý gói của khách thôi (hoàn hoặc không hoàn
phần còn lại) ngay tại chỗ — ít nút, không nhầm, tiền đối soát được. Song song TOC-DO-1 (không chung file). Không cắt chất lượng.

## Quyết định chủ quán (13.10 — chép đúng)
- Q1 Báo cáo → Gói SP: MỖI KHÁCH MỘT DÒNG — tên + SĐT · số gói · "còn lại" = tổng túi chưa lấy của các gói đang dùng · lần lấy
  gần nhất (kèm "… tháng chưa lấy" khi > 30 ngày, tính theo ngày mua nếu chưa lấy lần nào). Bấm dòng → mở danh sách gói của khách
  (tên gói, ngày mua, giá, đã lấy / tổng, trạng thái, lịch sử giao). Tìm theo tên hoặc SĐT.
- Q2 Lọc 3 nút: "Đang dùng" (mặc định) · "Lâu chưa lấy" (> 30 ngày) · "Đã xong / đã kết thúc". Bỏ "Tất cả" và "Sắp hết".
- Q3 Gói đã lấy đủ (delivered ≥ total) hiện "Đã xong" — sửa cả dữ liệu cũ đang `active` mà đã đủ (vd chị Thanh Nga 30/30).
- Q4 Thay nút "Dừng gói" bằng "Kết thúc gói…" — CHỈ trong phần mở ra của từng gói, chỉ owner (`refund_package`). Hộp xác nhận có
  2 lựa chọn, bắt chọn một + nhập lý do; ghi rõ "Không mở lại được":
  (a) "Hoàn phần còn lại vào ví khách: <số tiền>" — số tiền hiện TRƯỚC khi xác nhận = giá khách ĐÃ TRẢ cho gói đó × túi còn /
      tổng túi (giá đã trả theo `tienDaTra`, chia đều nếu một dòng mua nhiều gói); vào ví như P26c 1B (phần ví mẹ về ví mẹ tối
      đa số mẹ đã trả, còn lại vào ví khách). Ví dụ: gói 1.350.000, đã lấy 10/30 → hoàn 900.000.
  (b) "Không hoàn tiền" (khách bỏ, dùng thử, đã giao ngoài máy) — như "Dừng gói" của GOI-1.
- Q5 Các màn liên quan bấm là sang (CHỈ chuyển màn, lọc sẵn; không thêm thao tác):
  (1) Cài đặt → Gói SP: TÊN gói → Báo cáo → Gói SP lọc gói đó (như "🔒 N KH");
  (2) Báo cáo → Gói SP: tên khách → màn Khách hàng mở đúng khách (đã có từ GOI-1 — giữ);
  (3) Khách hàng, chi tiết một khách: dòng "Gói đang dùng: N gói · còn X túi →" → Báo cáo → Gói SP chỉ khách đó;
  (4) Báo cáo → Gói SP, chi tiết gói: ngày mua / từng lần giao → màn Đơn hàng mở đúng đơn (Orders.jsx nhận ?code=<mã đơn>).
  KHÔNG thêm đường bấm ở màn Bán hàng (đang tính tiền mà lỡ chuyển màn thì mất đơn).
- Các gói 0/30 lâu chưa lấy: chủ quán tự xử lý sau — máy KHÔNG tự đổi.

## Nghiệm thu
Mỗi mục: ca ĐỎ trên gốc → XANH sau vá (thêm vào `cong_cu/thu_GOI1.js` — đã đăng ký trong bộ kiểm; KHÔNG thêm file bài thử mới),
kèm số cụ thể.
- A1 (Q1, Q2) Máy chủ trả danh sách gom theo khách (hoặc màn hình gom — kế hoạch chọn cách gọn, nêu lý do); "còn lại" chỉ cộng gói
  đang dùng; "lâu chưa lấy" > 30 ngày; tìm theo tên lẫn SĐT. Phép kiểm màn hình soi đúng phần tử (bài học Q-A GOI-1).
- A2 (Q3) Gói `active` mà delivered ≥ total → trả về / hiện "Đã xong"; nắn dữ liệu cũ ở tầng đọc hoặc một lệnh sửa có điều kiện
  chặt (`… WHERE status='active' AND delivered_qty >= total_qty`) — kế hoạch nêu cách, KHÔNG xoá gì.
- A3 (Q4a) Kết thúc có hoàn: một route, chỉ `refund_package`, bắt lý do; trong MỘT giao dịch: gói `active` → `cancelled` (điều kiện
  `WHERE status='active'` — hai người cùng bấm chỉ một lần hoàn), ghi ví bằng `ghiVi` theo ĐÚNG cách P26c ghi hoàn đơn mua gói
  (`orders.js` ~1331–1340: phần khách trả bằng ví ghi như huỷ và giảm `total_spent`; phần vượt — tiền mặt / CK — ghi dòng riêng
  cách `hoan_goi`, KHÔNG giảm `total_spent`): tách đoạn đó thành MỘT hàm dùng chung gọi từ cả hai đường, không viết công thức
  thứ hai; cách chia phần ví / phần tiền mặt cho MỘT gói (đơn có nhiều gói / món khác) kế hoạch đề xuất cách gọn nhất trong
  `## Câu hỏi`. Ghi kèm mã gói khách để đối soát; notes ghi lý do + người + thời điểm + số tiền. Ca: 1.350.000 / 10 của 30 → +900.000; chưa lấy →
  hoàn đủ giá đã trả; giảm giá lúc mua → theo giá đã trả; một dòng mua 2 gói → mỗi gói một nửa; ví mẹ đã trả → về ví mẹ.
- A4 KHÔNG HOÀN HAI LẦN: đơn mua gói có gói đã kết thúc (cả (a) lẫn (b)) → Huỷ / Xoá đơn đó bị chặn (400, lời: "gói đã kết thúc —
  xử lý ở Báo cáo → Gói SP"). Ca: kết thúc có hoàn rồi huỷ đơn → 400, ví không đổi.
- A5 (Q4b) Kết thúc không hoàn: như "Dừng gói" GOI-1 (tiền không đổi). Hộp xác nhận: chưa chọn / chưa lý do → báo lỗi tại chỗ.
- A6 (Q5) 4 đường bấm đúng đích và đúng bộ lọc (phép kiểm màn hình + ca đường dẫn); Orders.jsx mở với ?code= điền sẵn ô tìm.
- A7 Luồng hợp lệ KHÔNG bị chặn (K5): huỷ / xoá đơn mua gói CHƯA kết thúc vẫn như P26c; lấy hàng; GOI-1 cũ vẫn xanh.
- A8 `client/` build lại (P1); `npm test`, `--day-du` xanh, 0 CẢNH BÁO; `viec/GOI-2/dot_bien.py` mỗi chỗ vá ≥ 1 VS- + BV-, đều BẮT;
  đột biến GOI-1, P26c vẫn BẮT (hoặc ghi rõ cái đổi mong đợi vì hành vi CỐ Ý đổi).
- A9 Đối soát (CLAUDE.md điều 5): `trang_thai.md` ghi quy tắc đối soát cho "Kết thúc có hoàn" (tổng dòng ví hoàn gói trong ngày =
  tổng số tiền ghi ở notes các gói kết thúc trong ngày) — chỉ ghi, DOI-SOAT-1 làm màn.

## Phạm vi
- viec/GOI-2/**
- server/routes/packages.js
- server/routes/orders.js
- server/utils/goiKhach.js
- server/utils/tienDaTra.js
- server/routes/wallets.js
- client/src/pages/Reports.jsx
- client/src/pages/Customers.jsx
- client/src/pages/Orders.jsx
- client/src/pages/Settings.jsx
- client/dist/**
- cong_cu/thu_GOI1.js

## Ngân sách
~200–300 dòng code + ~250 dòng thử.
**Phương án đơn giản nhất đã xét:** sửa màn Báo cáo có sẵn (gom dòng theo khách), đổi nút "Dừng gói" có sẵn thành hộp 2 lựa
chọn; tiền hoàn tính bằng hàm có sẵn của P26c, chặn hoàn hai lần bằng MỘT điều kiện ở huỷ / xoá đơn; đường bấm chỉ là liên kết
có tham số. Không thêm bảng, cột, trạng thái, màn hình.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- Không sửa `kiem_tra_truoc_khi_giao.js`, `tu_chay/`, `cong_cu/gia_lap/**`, `cong_cu/thu_gia_lap.js` (TOC-DO-1 sửa song song bộ kiểm).
- Không đổi cách tính hoàn của P26c cho Huỷ / Xoá đơn ngoài điều kiện chặn A4; không sửa `server/database.js`, `.claude/`,
  `.github/`, `CLAUDE.md`, sổ việc. Không nới hạn, không hạ ngưỡng.
- Gặp nghiệp vụ chưa chốt → DỪNG, ghi `## Câu hỏi`; không tự chọn.
- Chỉ push đúng `git push -u origin viec/GOI-2`. Không đụng `main`, không merge, không tạo PR.
