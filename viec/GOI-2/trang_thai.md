# GOI-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (14.10.2026)
- Nhánh `viec/GOI-2`, cây sạch. `git fetch origin viec/GOI-2`: HEAD `be1a404` = FETCH_HEAD `be1a404` → không kéo.
- `git log --oneline -3`:
  ```
  be1a404 PHIEU: GOI-2
  65206b6 TIEN-DO: GOI-1 xong (28f65d1), LUOI-2 xong (c591b9e), mo GOI-2 + TOC-DO-1, them SO-LUONG-1 — so v29
  c591b9e Merge pull request #18 from pos-tuquyduong/viec/LUOI-2
  ```

## Bước 3 — kế hoạch: `ke_hoach.md` — CHỜ DUYỆT (phiếu dặn dừng ở đây; chưa viết bài thử, chưa sửa code)

## Câu hỏi (chủ quán quyết trước khi máy làm bước 4)

- **Q-A (phiếu A3 đòi đề xuất) — chia phần ví mẹ / ví khách / tiền mặt cho MỘT gói.** Đề xuất (gọn nhất mà vẫn giữ đối soát I11 /
  I19 đang chạy): đọc trong giao dịch tổng đã hoàn / đã đền của ĐƠN MUA (`pos_balance_transactions` theo `order_id`), rồi
  1. trần cả khoản: `tong = min(goc, total − nợ − đã hoàn − đã đền của đơn)` (I19);
  2. ví mẹ TRƯỚC: `me = min(phần mẹ đã trả − đã hoàn về mẹ, tong)` (đúng 1B như huỷ đơn);
  3. ví khách phần trả bằng ví: `vi = min(balance_amount − đã hoàn dòng cash, tong − me)` → dòng `cash`, giảm `total_spent` (I11);
  4. còn lại (tiền mặt / CK) `tien_mat = tong − me − vi` → dòng `hoan_goi`, KHÔNG giảm `total_spent`.
  Vì huỷ / xoá đơn và duyệt hoàn đều bị chặn khi đơn có gói kết thúc, mọi dòng `refund` của đơn đó đều là của các lần Kết thúc gói
  → cộng dồn đúng. Phương án khác (bỏ): chia theo tỉ lệ cách trả của đơn — không cần đọc sổ nhưng KHÁC cách huỷ đơn (mẹ trước).
- **Q-B — đơn mua gói còn NỢ.** Theo trần ở Q-A, đơn chưa trả hết thì số hoàn giảm theo nợ (nợ 1.350.000 chưa thu → hoàn 0, mà khách
  vẫn còn nợ). Đề xuất: đơn còn `debt_amount > 0` thì CHẶN "Hoàn phần còn lại" (lời: "Đơn mua gói còn nợ — thu nợ trước, hoặc chọn
  Không hoàn"); "Không hoàn" vẫn được. Hay chủ quán muốn cách khác (xoá nợ phần còn lại…)?
- **Q-C — huỷ / xoá đơn LẤY HÀNG từ một gói đã kết thúc** (`orders.js:1432–1449`, `:1566–1580`): hiện trả lượt về gói `cancelled`
  (túi "còn lại" tăng) nhưng tiền đã chốt lúc kết thúc → khách mất tiền các túi đó (đã kết thúc có hoàn), hoặc gói đã kết thúc
  "còn" túi không dùng được. Đề xuất: chặn luôn bằng cùng lỗi `GOI_DA_KET_THUC` (thêm điều kiện vào 2 chỗ trả lượt, ~+4 dòng) — hay
  để nguyên (ghi Phát hiện, việc sau)? Phiếu A4 chỉ nói đơn MUA gói nên máy không tự thêm.
- **Q-D — bộ lọc "Đã xong / đã kết thúc".** Máy hiểu: khách có ≥ 1 gói xong / kết thúc (một khách vừa có gói đang dùng vừa có gói
  xong hiện ở cả hai lọc); phần mở ra luôn hiện MỌI gói của khách. Khớp bản demo không?
- **Q-E — ngưỡng 30 ngày.** Để một hằng có tên ở `server/utils/goiKhach.js` (máy chủ trả cờ `lau`, màn hình không viết số). CLAUDE.md
  cấm số cứng nghiệp vụ — chủ quán muốn đưa vào Cài đặt (việc sau, cần màn Cài đặt) hay chấp nhận hằng một chỗ?

- **Q-F — neo đột biến P26c.** Tách thân ghi của `hoanVi` sang `wallets.js` (phiếu A3 đòi MỘT hàm dùng chung) làm lạc 3 đột biến
  `viec/P26c/dot_bien.py:44–46`. Máy dựng lại đúng ba lỗi đó trong `viec/GOI-2/dot_bien.py`; chủ quán / chat chuyển neo P26c sau (ngoài
  Phạm vi). Đồng ý không? (Cách khác: để `ghiHoan` trong `orders.js` và `packages.js` require `orders.js` — giữ neo nhưng route
  require route, rối hơn.)

## Soát kế hoạch (agent chỉ đọc, 14.10) — đã nhận: sửa số dòng mục 0; đường bấm 4 thêm `&ngay=` (Orders.jsx chỉ tải theo ngày);
Customers dùng `theo-khach?phone=`; thêm ca B2c, B3k–m, B4e, B5c, B6f–h, chạy lại đột biến P26c; Q-F. Không nhận: gộp `hoan_du_kien`
vào danh sách, bỏ 409 (lý do ở `ke_hoach.md` mục 6).

## Quy tắc đối soát "Kết thúc gói có hoàn" (A9 — chỉ ghi, DOI-SOAT-1 làm màn)
- Mỗi ngày: Σ `amount` các dòng `pos_balance_transactions` loại `refund` có ghi chú `Hoàn kết thúc gói KH #…` trong ngày
  = Σ số tiền ghi trong notes `Kết thúc gói (hoàn <n>đ …)` của các gói `cancelled` có `updated_at` trong ngày.
- Mỗi gói đã kết thúc có hoàn: Σ dòng ví ghi `#<cp.id>` = số trong notes của gói đó (đúng một lần — cổng `status='active'`).
- Mỗi đơn mua gói: I19 (hoàn + đền ≤ total − nợ) và I11 (mỗi ví: hoàn trừ `hoan_goi` ≤ ví đó đã trả) vẫn đúng — bài thử chạy
  hai bất biến này sau mọi ca hoàn.
- Tuần / tháng: cộng các ngày; lệch → xem từng gói theo `#<cp.id>`.

## Phát hiện
- (chưa có)
