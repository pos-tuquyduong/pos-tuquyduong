# AUDIT-2 A2 — 23 C2F còn SỐNG sau LUOI-1: NẶNG / NHẸ

Danh sách = 45 SỐNG (gốc 07.10, `viec/HOC-2b/trang_thai.md` D5 (3)) − 22 BẮT ở LUOI-1 (`viec/LUOI-1/trang_thai.md:73–93` 20 C2F +
`:95` 2 C2F). Lần chạy A1 hôm nay ra ĐÚNG 23 tên này SỐNG (so bằng máy). `git log b9759cf..HEAD -- server/` rỗng ⇒ tên C2F (đánh số theo
vị trí) không trượt. Xếp theo middleware của route + khoá TRONG thân hàm (đọc code HEAD trong lượt này) và câu "ở quầy sẽ sai gì".

**Kết luận: 0 NẶNG.** 10 cái NHẸ-tiền (thao tác của CHỦ có ảnh hưởng tiền ở quầy nếu hỏng âm thầm) gom được vào MỘT đề xuất KB.

| tên | file:dòng (HEAD) | route · quyền | bỏ câu thì ở quầy sẽ sai gì | mức |
|---|---|---|---|---|
| `C2F-orders-13-update-quay` | `orders.js:1052` | POST /orders · authenticate | ghi chú phiếu đăng ký (pos_registrations) gửi SX không cập nhật — không phải sổ tiền | NHẸ |
| `C2F-orders-14-insert-quay` | `orders.js:1056` | POST /orders · authenticate | không tạo phiếu đăng ký khách mới gửi SX — không phải sổ tiền | NHẸ |
| `C2F-orders-35-delete-quay` | `orders.js:1540` | DELETE /orders/:id · `role !== "owner"` → 403 (`:1464`) | xoá đơn để lại dòng báo hỏng mồ côi; tiền đền đã ghi sổ ví riêng | NHẸ |
| `C2F-orders-36-delete-quay` | `orders.js:1541` | như trên (owner) | dòng pos_promotion_usage mồ côi | NHẸ |
| `C2F-orders-37-delete-quay` | `orders.js:1542` | như trên (owner) | dòng pos_invoice_logs mồ côi | NHẸ |
| `C2F-damages-03-update-quan-tri` | `damages.js:203` | POST /damages · manage_orders | cờ `returned_to_stock` không bật sau khi SX nhận hoàn kho (lệnh SX đã gửi) — chỉ sai CỜ hiển thị | NHẸ |
| `C2F-packages-01-insert-quan-tri` | `packages.js:40` | POST /packages · manage_users | chủ tạo gói mới không lưu — thấy ngay trên màn hình | NHẸ |
| `C2F-packages-02-update-quan-tri` | `packages.js:79` | PUT /packages/:id · manage_users | chủ sửa giá / số lượt gói không lưu → quầy bán gói giá CŨ | NHẸ-tiền |
| `C2F-packages-03-update-quan-tri` | `packages.js:104` | DELETE /packages/:id (đã bán → ẩn) · manage_users | gói chủ tắt vẫn bán được | NHẸ-tiền |
| `C2F-packages-04-delete-quan-tri` | `packages.js:107` | DELETE /packages/:id (chưa bán → xoá) · manage_users | gói chưa ai mua vẫn còn trong danh mục | NHẸ |
| `C2F-packages-06-update-quan-tri` | `packages.js:195` | PUT /customer-packages/:id/cancel · manage_users | gói khách chủ huỷ vẫn LẤY HÀNG được (orders.js:216 chỉ chặn status ≠ active) | NHẸ-tiền |
| `C2F-signup-codes-05-update-quan-tri` | `signup-codes.js:477` | POST /signup-codes/:id/reset · manage_settings | đặt lại mã bill không ăn — mã vẫn ở trạng thái đã dùng (chặn chặt hơn, không lọt tiền) | NHẸ |
| `C2F-signup-codes-06-delete-quan-tri` | `signup-codes.js:484` | như trên | mã giảm giá đẻ từ mã bill còn lại sau reset — khách giữ mã giảm cũ | NHẸ-tiền |
| `C2F-discount-codes-02-update-quan-tri` | `discount-codes.js:265` | PUT /discount-codes/:id · manage_promotions | chủ sửa mã (giảm trị giá / giới hạn) không lưu → quầy áp mức CŨ | NHẸ-tiền |
| `C2F-discount-codes-03-update-quan-tri` | `discount-codes.js:319` | DELETE /discount-codes/:id (đã dùng → tắt) · manage_promotions | mã chủ tắt vẫn dùng được ở quầy | NHẸ-tiền |
| `C2F-discount-codes-04-delete-quan-tri` | `discount-codes.js:326` | DELETE (chưa dùng → xoá) · manage_promotions | mã chưa dùng chủ xoá vẫn dùng được | NHẸ-tiền (gộp với 03) |
| `C2F-rewards-02-update-quan-tri` | `rewards.js:74` | PUT /rewards/:id · manage_promotions | chủ sửa giá điểm / trị giá quà không lưu → khách đổi theo mức CŨ (I12 so với quà HIỆN TẠI nên vẫn xanh) | NHẸ-tiền |
| `C2F-rewards-03-update-quan-tri` | `rewards.js:87` | DELETE /rewards/:id (ẩn) · manage_promotions | quà chủ ẩn khách vẫn đổi được (`loyalty.js:134` lọc `is_active = 1`) | NHẸ-tiền |
| `C2F-customers-v2-01-insert-khong-ro` | `customers-v2.js:58` | hàm nền `cacheCustomersToLocal` (không route) | bộ đệm khách từ SX không ghi → lúc SX lỗi danh sách khách cũ hơn (đúng luật degraded) | NHẸ |
| `C2F-customers-v2-02-update-quan-tri` | `customers-v2.js:320` | PUT /customers/:phone/address · manage_users | địa chỉ không lưu | NHẸ |
| `C2F-customers-v2-03-insert-quan-tri` | `customers-v2.js:327` | như trên (khách chưa có) | địa chỉ không lưu | NHẸ |
| `C2F-customers-v2-04-update-quan-tri` | `customers-v2.js:370` | PUT /customers/:phone/discount · manage_users | chiết khấu riêng của khách (orders.js:508 đọc) không đổi → quầy áp mức CŨ | NHẸ-tiền |
| `C2F-customers-v2-05-insert-quan-tri` | `customers-v2.js:377` | như trên (khách chưa có) | chiết khấu riêng mới không lưu → khách không được giảm (bất lợi cho khách, không lọt tiền quán) | NHẸ |

Không cái nào NẶNG: mọi câu đụng tiền ở trên chỉ chạy khi CHỦ thao tác ở màn quản trị (quyền manage_*), hỏng thì chủ thấy giá
trị không đổi trên chính màn đó; không câu nào nằm trên đường khách chạm ở quầy (bán / thu / huỷ / hoàn).

**Đề xuất khoá (một KB gom 10 NHẸ-tiền, việc sau):** KB "chủ đổi cấu hình tiền rồi quầy bán ngay" — sửa giá gói, tắt gói, huỷ gói khách,
sửa + tắt mã giảm, sửa + ẩn quà, đặt chiết khấu riêng khách, reset mã bill; sau mỗi thao tác, quầy bán / lấy / đổi ngay một lần và
`c.mong` đúng mức MỚI (giá mới, 400 khi đã tắt / huỷ / ẩn). Ca đỏ: chính 10 đột biến C2F ở trên phải chuyển BẮT. File: `cong_cu/gia_lap/
kich_ban.js` (+ `LUOT`), không cần bất biến mới.
