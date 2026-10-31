# KHO-2b — trạng thái

## Bước 1 — đối chiếu bản chụp (31.10)
- Nhánh: `viec/KHO-2b`; cây sạch.
- HEAD `617f4e4` · FETCH_HEAD `617f4e4` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  617f4e4 PHIEU: KHO-2b
  97d1de2 TIEN-DO: KH-API-3 (a95634f), KHACH-CK-1 (4b52370) xong; mo KH-MUA-1, KHO-2b, KH-SP-1, BH-CKTAY-1; quyet dinh 31.10 (bo giam tay, dat don App vi+QR); luat 6.9 — so v49
  4b52370 Merge pull request #55 from pos-tuquyduong/viec/KHACH-CK-1
  ```

## Bước 2–3 — đọc, kế hoạch
- Đã đọc: phiếu, `server/kho/{duong,duLieu,tinh}.js`, `server/nang_cap/{001,002,chay}.js`, `server/routes/settings.js` (kho_*), `server/routes/backup.js` (danh sách bảng),
  `client/src/pages/Kho/{index,chung,DsPhieu,XemPhieu,TonKho,PhaChe,DinhMuc}.jsx`, `QUYET_DINH_CHU_QUAN.md` mục Kho.
- Kế hoạch: `ke_hoach.md`; agent phụ chỉ đọc đã soát 4 câu → điều chỉnh ghi ở `ke_hoach.md` mục 7. Phiếu dặn **chờ duyệt kế hoạch** → dừng ở bước 3.

## Câu hỏi

1. **Ảnh hoá đơn nhập.** Máy Render không giữ file. Cất ảnh trong CSDL thì vướng sao lưu: sao lưu là file Excel, một ô Excel chứa tối đa 32.767 ký tự,
   ảnh hoá đơn đọc được (≥ ~60 KB) dài hơn thế nhiều → sao lưu có thể hỏng hoặc mất ảnh; sửa sao lưu (`backup.js`) thì ngoài Phạm vi.
   **Đề xuất: hoãn chụp hoá đơn** sang KH-SP-2 (cùng chỗ lưu ảnh ngoài với ảnh món). Phiếu nhận vẫn có ô ghi chú (vd "HĐ số 123 của NCC X").
   Phương án khác nếu bạn cần ngay: bảng riêng `kho_anh` chứa ảnh nén ~100 KB, KHÔNG nằm trong sao lưu Excel (mất máy là mất ảnh, số liệu vẫn đủ) — thêm ~50 dòng.

2. **Hạn mức dùng nội bộ — "ca" là gì và mặc định bao nhiêu?** POS hiện không có khái niệm ca làm (không có bảng ca). 
   **Đề xuất:** tính theo **người / ngày** (giờ Việt Nam), đơn vị **đồng theo giá vốn** (nguyên liệu theo giá nhập, thành phẩm theo giá vốn lô),
   ô Cài đặt `kho_han_muc_noi_bo`, **mặc định 50.000đ**. Thứ chưa có giá → coi như vượt hạn mức (cần duyệt). Bạn chỉ cần xác nhận hoặc cho số khác.

3. **Chủ quán sửa phiếu nhận đã duyệt** — theo đúng khuôn phiếu xuất: phiếu cũ chuyển "huỷ" (giữ lại), phiếu mới tự duyệt luôn (không cần người thứ hai).
   Luật "phiếu nhận cần người KHÁC duyệt" vì thế có một ngoại lệ là chủ quán sửa. **Đề xuất: giữ như phiếu xuất** (sửa là quyền riêng của chủ quán, có lý do, có log).

4. **Giá nhập mới khi nhận hàng có cập nhật "giá nhập" của nguyên liệu không?** Hiện giá nhập chỉ đổi tay ở màn Nguyên liệu; đơn đặt hàng ước tính theo giá này, và
   giá vốn thành phẩm khi pha chế cũng lấy giá này — đổi tự động là đổi cả cách tính giá vốn pha chế (phiếu cấm đổi luồng pha chế / xuất).
   **Đề xuất: KHÔNG tự đổi trong việc này** — lô nhập vẫn giữ giá thật riêng; bạn vẫn đổi giá nhập tay ở màn Nguyên liệu. Muốn tự đổi thì mở việc riêng sau.

## Phát hiện
- Sao lưu Excel (`server/routes/backup.js`, ngoài Phạm vi) lấy bảng theo danh sách cứng: bảng mới nào của kho cũng KHÔNG được sao lưu nếu không sửa file đó — lý do kế hoạch không thêm bảng.
