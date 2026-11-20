# Thư POS → App KH (KHO-3a, 18.11.2026) — chủ quán chuyển giúp

**Việc:** POS ngắt hẳn SX (KHO-3a). Hợp đồng `/api/kh` lên **v18** — không thêm / xoá / đổi tên trường, không mã lỗi mới. App v17 chạy nguyên.

**Đổi nghĩa (App không phải sửa, chỉ cần biết):**
1. `GET /menu`: `con_hang` theo kho POS, đã trừ phần đang giữ cho đơn chờ trả (quầy, App, màn khách cùng một con số). `ton_cu` luôn `false`, `ton_luc`
   luôn `null`. Món chưa có công thức không hiện.
2. Đặt đơn: món vừa hết / thiếu nguyên liệu → `HET_HANG` + `ma`; món chưa có công thức → `MON_KHONG_BAN` + `ma` (mã có sẵn).
3. Lưới an toàn: khách đã chuyển QR đúng hạn mà món đã giữ vừa mất → POS KHÔNG tạo đơn, cộng đúng số tiền vào tài khoản khách; `GET /don/:ma` có
   `tien_ve_da_cong_vi` + `thong_bao_tien_ve` = "Món <tên> vừa hết — quán đã hoàn <số> vào ví của bạn".

**Hỏi App KH (chưa có trong hợp đồng — POS KHÔNG tự thêm đường):** chủ quán muốn khách được BÁO ĐẨY (thông báo trên điện thoại) khi xảy ra mục 3.
Hợp đồng v18 chưa có đường POS nhờ App gửi thông báo đẩy. Nếu App muốn nhận việc này, đề xuất: App đọc `thong_bao_tien_ve` khi khách mở đơn (đã có),
hoặc hai bên chốt một cửa mới ở đợt sau (POS ghi vào "Đã hẹn" của hợp đồng). Trả lời bằng file `YEU_CAU_APPKH_*.md` qua chủ quán.
