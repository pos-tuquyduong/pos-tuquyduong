# KHO-IN-1 — kế hoạch (viết lại sau khi code xong; thứ tự thật: đọc code → bài thử đỏ → code, ghi chú ở trang_thai.md)

Phiếu: việc thường [Th], không "chờ duyệt kế hoạch".

## Phương án
| Phần | A (chọn) | B (bỏ) |
|---|---|---|
| Lưu cài đặt | 8 khoá `pos_settings` `in_phieu_<px|dh|pn|ps>_<kho|ban>`; máy chủ kiểm bằng MỘT hàm `khoaInPhieuSai` trong `routes/settings.js` (~16 dòng), cùng luật "sai một khoá thì không ghi khoá nào" như UUDAI-1 / KHO-2b | Một khoá JSON `in_phieu_kho` như `invoice_print_set`: ít khoá hơn nhưng máy chủ phải parse JSON để kiểm, lỗi một loại làm hỏng cả khối |
| Đọc khổ / số bản | hàm thuần `docInPhieuKho(settings, loai)` + `thuTuNutIn(kho)` trong `utils/inPhieu.js` (24 dòng) — dùng chung cho màn xem phiếu và khối Cài đặt | mỗi nơi tự đọc khoá: hai chỗ lệch nhau (K4) |
| Số bản | dựng khối phiếu `ban` lần trong `.kho-in`, CSS ngắt trang giữa các bản — MỘT lần `window.print()` | gọi `window.print()` n lần: hộp in hiện n lần |
| Màn xem phiếu | `KHO_IN` thêm `a5`; nút dựng từ `thuTuNutIn`, khổ mặc định tô `btn-primary` đứng đầu | giữ 2 nút cứng, thêm nút A5: không có "khổ mặc định" |
| Khối cài đặt | `pages/CaiDat/InPhieu.jsx` + tab mới trong nhóm "Bán hàng" của Settings (quyền `manage_settings`) | nhét vào tab Giờ hoạt động: khó tìm |
| Ô "Khổ mặc định" hoá đơn | ô đọc/ghi `boIn.bill.kho` (nguồn mà `docBoIn` thật sự ưu tiên) và lúc lưu ghi thêm `invoice_default_size` cùng giá trị | chỉ đổi tên khoá ô cũ: vẫn bị `boIn.bill.kho` đã lưu che mất |

Ước lượng: máy chủ ~20 dòng, giao diện ~160 dòng, thử ~230 dòng (65 ca).

## Ca thử ↔ nghiệm thu (cong_cu/thu_KHOIN1.js)
- A: nhóm [A] (máy chủ thật + libsql tạm: lưu/đọc, khổ lạ, 58mm, rỗng, số bản 0/1/3/4/chữ, loại/trường lạ, sai một khoá không ghi khoá nào, quản lý cần quyền, nhân viên 403) + [B0] (hàm thuần) + [B2] (khối cài đặt gắn vào Settings).
- B: nhóm [B] (đủ 3 khổ, @page, mặc định đứng đầu, số bản, IN LẠI mọi bản, ghi đếm trước khi in, CSS).
- C: nhóm [C] (ô khổ đọc/ghi đúng nguồn, gửi `invoice_default_size`, seed + log '80mm', dữ liệu cũ a5/a4/rỗng → 80mm).
- D (K5): nhóm [D] (KHO_BILL/KHO_TEM/KHO_PHIEU/bộ in mặc định không đổi, HoaDonTo, InPhieu.jsx, nội dung phiếu kho, `/in` chỉ ở XemPhieu).

## Đường song song đã rà (K4)
- Khổ hoá đơn có HAI nguồn: `invoice_default_size` và `boIn.bill.kho` (`docBoIn` ưu tiên cái sau) → ô phải ghi cả hai (làm).
- Chỗ in phiếu kho: chỉ `XemPhieu.jsx` (`window.print`); DatHang/NhanHang/PhatSinh/DsPhieu mở lại XemPhieu → một chỗ sửa là đủ.
- `paper_size = 'a5'` ở `POST /invoice/log` (nhật ký in) → đổi '80mm'.

## Luồng hợp lệ phải KHÔNG bị chặn (K5)
Chưa có cài đặt → 80mm/1 bản như cũ · quản lý có `manage_settings` vẫn ghi được · khoá cài đặt khác cùng yêu cầu vẫn ghi · dữ liệu cũ `a5`/`a4` của hoá đơn đọc ra 80mm · hoá đơn 2 tờ HD-1, tem, phiếu pha chế sau thanh toán, in lại ở Đơn hàng không đổi.
