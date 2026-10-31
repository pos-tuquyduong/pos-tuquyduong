# MANKHACH-1 — kế hoạch

Nền đã đọc (31.10, HEAD 10b1abc): thanh-toan.js:23-40 (phiên), giuCho.js:26 tomPhien · :32 taoPhien (cột `than` = giỏ gửi đi, `qr`, `het_han`),
orders.js:823 `chiTinh` trả `chiTiet` (items có unit/tier/flash), products.js:34 layMenuQuay, flash.js + flashState.js, settings.js:91 PUT
(+ khuôn kiemCaiDat gio_hd_*), nang_cap/chay.js (bước 009), BanHangMoi.jsx:68 `qr` + :326 `<ManQr>`, Settings.jsx:2169 (khuôn thẻ GioHoatDong).

## Thiết kế chung (phương án A — chọn): máy chủ giữ "quầy X đang hiện gì", màn khách hỏi theo nhịp
- Bảng `pos_man_khach_quay` (id ngẫu nhiên, mã ghép 6 số + hạn, phien_id, `hien` = JSON hiển thị) và `pos_man_khach_may` (khoá BĂM sha256, quầy,
  tên, thu hồi). Bước `009_man_khach.js`, chỉ THÊM.
- Quầy: `POST /api/pos/man-khach/quay/mo` (nhận/cấp mã), `/quay/doi-ma`, `/quay/phien` (báo phiên QR → máy chủ TỰ dựng danh sách món bằng
  `taoDon(..., {chiTinh, tinhThu})` từ chính `than` đã lưu, đối chiếu tổng = `phien.tong`; lệch → chỉ hiện tổng). Staff: `GET /may`, `POST /may/:id/thu-hoi`.
- Màn khách (không JWT): `POST /ghep` (mã đúng + còn hạn → khoá; giới hạn 5 lần sai/10 phút/IP), `GET /trang-thai` (≤2s khi thu),
  `GET /noi-dung` (trang rảnh + menu + Giờ vàng). Header khoá → CHỈ đọc quầy của mình; thu hồi → 401 KHOA_THU_HOI.
- Trạng thái suy từ HÀNG PHIÊN thật (cho→thu · da_thu ≤8s→cam_on · còn lại→ranh) nên quầy không cần "xoá" gì; không đụng tiền / phiên.
- Cài đặt `man_khach_trang` (JSON), `man_khach_dia_chi_app`, `man_khach_hien_ten` kiểm trong settings.js (sai → 400, không ghi khoá nào).
- Giao diện: `pages/ManKhach/` (trang `/man-khach` ngoài Layout), `MaGhep` ở góc BanHangMoi, `CaiDat/ManKhach.jsx` trong Settings.
Phương án B (websocket/SSE đẩy) bỏ: thêm hạ tầng, Render ngủ; hỏi 2 giây đủ ≤2 giây nghiệm thu.
Số dòng: máy chủ ~260 (utils ~170 + route ~90) · giao diện ~430 · thử ~260.

## Ca thử ↔ nghiệm thu (cong_cu/thu_MANKHACH1.js)
- A: ghép mã đúng→khoá · mã sai / hết hạn→400 · 6 lần sai→429 · khoá tới đường nhân viên (/orders, /settings)→401 · quầy 1 vs 2 không lẫn · thu hồi→401.
- B: tạo phiên (payOS giả) + báo → trạng thái có đúng `qr`, `con_lai`, món, dòng giảm, `con_giay` · chốt → cam_on rồi ranh · huỷ / hết hạn → ranh · không lộ SĐT/số dư.
- C/D: lưu trang hợp lệ (đọc lại đúng) · giá trị sai → 400 không ghi gì · nhân viên không quyền → 403 · /noi-dung đúng thứ tự, bỏ trang tắt, hết hàng đúng.
- E/F (K5): không có màn ghép → bán hàng / phiên / chốt chạy như cũ (phiên không phụ thuộc bảng mới). Giao diện E (mạng, bộ nhớ, ngang/dọc) → CHƯA KIỂM máy, ghi.
- Đường song song (K4): mọi route /man-khach đều qua một trong 3 cổng (JWT · khoá màn · công khai chỉ /ghep) — phép tĩnh quét.
