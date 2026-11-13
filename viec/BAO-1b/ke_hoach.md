# BAO-1b — kế hoạch (thường: chạy thẳng, không chờ duyệt)

Đọc code thật lượt này: `Settings.jsx` (2336 dòng; `message` dòng 48, vẽ ở 914; 52 chỗ `setMessage`), `pages/CaiDat/*.jsx` (9 file, mỗi file một
`thongDiep` vẽ đầu thẻ, riêng `CongQr` không), `components/CaiDatChuong.jsx` (`thongDiep`), `components/thongBaoKho.js` + `ThongBao.jsx` (BAO-1a),
`utils/api.js:83-87` (lỗi có `err.code`), `server/utils/pinChuQuan.js:18-25` (mã `PIN_CHU_QUAN_SAI` / `_KHOA` / `_KHONG_HOP_LE` / `CHUA_CO_PIN_CHU_QUAN`).
`alert(` còn 0 trong `client/src` (bánh cóc BAO-1a đã ở 0 → không còn gì để hạ; giữ 0).

## Phương án
**Thông báo (A):** A) thay từng `setMessage` / `thongDiep` bằng `baoXong` / `baoLoiTu` — ~110 chỗ, ít code mới, rủi ro thấp (lệnh đổi cơ học).
B) bọc `setMessage` thành hàm đẩy sang thongBaoKho — ít dòng sửa nhưng vẫn giữ tên cũ, đòi hỏi bài thử "bỏ `message`" không qua được. → **chọn A.**

**Thanh lưu (C) + hỏi PIN (D):** A) mỗi thẻ tự vẽ thanh và ô PIN (lặp 7 lần). B) 4 file nhỏ dùng chung: `thayDoiKho.js` (sổ "thẻ nào còn thay đổi"),
`useThayDoi.js` (so ảnh chụp lúc tải với giá trị hiện tại), `ThanhLuu.jsx` (thanh cố định cuối màn: "Có thay đổi chưa lưu" + Bỏ / Lưu),
`HoiPin.jsx` + `loiPin.js` (ô nổi hỏi PIN, PIN sai báo dưới ô, giữ nguyên dữ liệu đã gõ), `LoiO.jsx` (chữ đỏ dưới ô). → **chọn B** (~110 dòng dùng chung).
`Settings.doiThe` thêm một vế hỏi lại khi `coChuaLuu()` (chuyển thẻ / nhóm đều qua `doiThe`).

Số file: 6 file mới trong `components/` · 9 thẻ CaiDat + `CaiDatChuong` + `Settings.jsx` sửa · `index.css` thêm ~25 dòng · `cong_cu/thu_BAO1b.js` mới ·
`kiem_tra_truoc_khi_giao.js` +1 dòng. Ước ~450 dòng đổi (phiếu ghi ~350 + 150 thử; vượt do 52 chỗ ở Settings.jsx đổi từng dòng, không thêm logic).

## Ca thử ↔ nghiệm thu
| Nghiệm thu | Ca |
|---|---|
| A | A1 Settings.jsx không còn `message` / `setMessage` / dải `alert` đầu trang · A2 CaiDat/** + CaiDatChuong không còn `thongDiep` · A3 không `alert(` · A4 mỗi file nối thongBaoKho và gọi ≥ N lần · A5 hết chuỗi `'Lỗi: ' +` |
| B | B1 `LoiO.jsx` chỉ trả null khi rỗng · B2 mỗi thẻ B (9) dùng `<LoiO` ≥ n · B3 CSS `.loi-o` đỏ |
| C | C1 `thayDoiKho` chạy thật (nạp bằng import): đặt / gỡ / hai thẻ độc lập · C2 `ThanhLuu.jsx` chữ + Bỏ + Lưu + trả null chỉ khi không đổi + đăng ký / gỡ trong effect · C3 CSS cố định cuối màn · C4 7 thẻ dùng `useThayDoi` + `<ThanhLuu` · C5 `Settings.doiThe` hỏi khi `coChuaLuu()` |
| D | D1 `laLoiPin` chạy thật (5 mã PIN → đúng, `MAT_KHAU_SAI` / Error trơn → sai) · D2 HangThe + GoiNap dùng `<HoiPin`, nút Lưu không `disabled` theo pin · D3 HoiPin có ô mật khẩu, `LoiO`, không tự đóng khi PIN sai · D4 GoiNap hết ô PIN đầu thẻ |
| E | E1 các thẻ gọi `await tai()` sau lệnh ghi · E2 nút Lưu `disabled` theo `dangLuu` + chữ "Đang lưu…" |
| F | `thu_BAO1b.js` nối vào `kiem_tra_truoc_khi_giao.js` · bánh cóc `alert(` giữ 0 (BAO-1a D1) |
| K5 | không đổi `server/`: bài BAO-1a / HANG-1 / NAP-1 / CT-1a / DIEM-MON-1 / MAN-KHACH-1 / GIAO-1 / KH-API-2 / KHO-IN-1 vẫn xanh; chuỗi "luồng hợp lệ": Lưu không-cần-PIN (Giờ hoạt động, In phiếu …) KHÔNG bị hỏi PIN; chủ quán đã gõ đúng PIN lưu được; nhân viên (không phải chủ) vẫn xem được Gói nạp |

Đường song song (K4): mọi nơi vẽ biến lỗi cũ (`thongDiep`, `message`) — grep cả `pages/` + `components/`; mọi nút ghi trong thẻ (lưu · thêm · sửa · xoá · bật/tắt · đặt PIN · thu hồi màn · ghép) — không chỉ nút Lưu.

Giới hạn nói trước: không có cách chạy React thật trong bộ kiểm → bài thử khoá mã nguồn + phần thuần (`thayDoiKho`, `laLoiPin`); thao tác thật cần chủ quán thử tay (3 bước ở báo cáo).
