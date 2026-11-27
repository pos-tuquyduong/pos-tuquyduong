# Báo chat App KH — nhóm món đổi (POS hợp đồng v19)

**Chuyện gì:** chủ quán giờ cài nhóm món ở POS (đổi tên, xếp thứ tự, bật / tắt "hiện trên App"). App không tự đặt tên nhóm nữa.

**App cần làm (chỉ đọc, không gọi gì mới):** `GET /api/kh/menu` mỗi món có thêm hai trường:
- `nhom_ten` — tên nhóm để hiển thị (vd "Nước ép", "Trà" — chủ quán đổi được, App cứ hiện đúng chữ này).
- `nhom_thu_tu` — số thứ tự nhóm, nhỏ đứng trước. Món chưa thuộc nhóm nào có số 9999 (xếp cuối).

**Cách vẽ:** gom món theo `nhom` (mã, không đổi), đặt tên tab bằng `nhom_ten`, xếp các tab theo `nhom_thu_tu` tăng dần.
Đừng tự ghi tên "Nước ép" / "Trà" cứng trong App.

**Nhóm bị tắt "hiện trên App":** món của nhóm đó không còn trong `/menu`. Nếu khách còn giỏ cũ có món đó, báo giá / đặt đơn trả `400 MON_KHONG_BAN`
(kèm `ma` món) — mã lỗi App đã có, hiện "món không bán" như thường.

**App cũ chưa sửa vẫn chạy:** trường `nhom` vẫn là mã như trước. Chỉ khác là món nhóm tắt sẽ biến mất khỏi menu.
