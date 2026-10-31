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

## Làm tiếp (31.10) — chủ quán duyệt kế hoạch, 4 câu theo đề xuất
- Đối chiếu bản chụp: nhánh `viec/KHO-2b`, cây sạch; HEAD `c917ef3` · FETCH_HEAD `c917ef3` — bằng nhau, không kéo.
  ```
  c917ef3 KHO-2b: ke hoach + cau hoi cho chu quan (cho duyet ke hoach)
  617f4e4 PHIEU: KHO-2b
  97d1de2 TIEN-DO: KH-API-3 (a95634f), KHACH-CK-1 (4b52370) xong; mo KH-MUA-1, KHO-2b, KH-SP-1, BH-CKTAY-1; quyet dinh 31.10 (bo giam tay, dat don App vi+QR); luat 6.9 — so v49
  ```
- Lệch kế hoạch (ghi rõ): KHÔNG mở `GET /san-pham/:id/trien-khai` cho nhân viên (bài KHO-1 E11 khoá "staff → 403") — thay bằng `mot_phan`
  (lượng 1 phần, không giá) trong `GET /kho/goi-y-nhap` và gợi ý "dùng nội bộ". Không đụng `bangPhieu` (PX) — DH/PN/PS có `docPhieuNhap` riêng.
- Bài thử viết trước, đỏ trên gốc: `bang_chung_do.txt`. Sau vá: thu_KHO2b 67/67 · thu_KHO2a 86/86 · thu_KHO1 111/111 · `npm test -- --day-du` PASS 88 · FAIL 0 ·
  CẢNH BÁO 1 (route GET có lệnh ghi ở packages.js / products.js / sync.js — có từ trước, ngoài Phạm vi).

## Chỗ vá → đột biến (viec/KHO-2b/dot_bien.py — 26 đột biến, BẮT 26)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| `duLieu.js` DA_DUYET bỏ phiếu DH khỏi tồn | BV-DH-VAO-TON | A9 |
| `tinh.js` gopLuong gộp nguyên liệu trùng | VS-DH-KHONG-GOP | A2 |
| `tinh.js` trongHanMuc (≤, thiếu giá = vượt) | VS-HAN-MUC-LON-HON-BANG · VS-THIEU-GIA-DUOI-HAN-MUC | A7b · A8 |
| `nhapHang.js` chỉ quản lý tự duyệt đơn ≤ hạn mức | VS-DH-NV-TU-DUYET | A6 |
| `duLieu.js` duyetPhieu: đơn vượt hạn mức → CAN_CHU_QUAN | BV-CAN-CHU-QUAN | A5 |
| `duLieu.js` dsPhieu cờ can_chu_quan | BV-DS-CAN-CHU-QUAN | A5b |
| `settings.js` hạn mức chỉ số nguyên ≥ 0 | BV-HAN-MUC-CAI-DAT | A10 |
| `duLieu.js` câu khoá duyệt người khác người tạo (nay cho mọi loại) | BV-PN-NGUOI-KHAC | B1 |
| `nhapHang.js` phiếu nhận luôn chờ duyệt | VS-PN-CONG-LUC-TAO | B1 |
| `duLieu.js` ghiKhoTheoLoai → ghiKhoNhan tạo lô | BV-GHI-KHO-NHAN | B2 |
| `duLieu.js` docConLaiDon tính cả PN chờ duyệt | BV-CON-LAI-TRU-PN-CHO | B4 |
| `nhapHang.js` đơn đã đủ → DON_DA_DONG | BV-DON-DA-DONG | B4b |
| `nhapHang.js` hạn trống → theo hạn nguyên liệu | BV-HAN-TU-DIEN | B7 |
| `duLieu.js` docPhieuNhap cờ lech | BV-LECH-PN | G3 |
| `phatSinh.js` FEFO kể cả lô quá hạn | VS-FEFO-BO-LO-QUA-HAN | D2 |
| `phatSinh.js` hạn mức nội bộ | BV-HAN-MUC-NOI-BO · VS-NOI-BO-KHONG-CONG-DON · VS-NOI-BO-CONG-NGUOI-KHAC · VS-NOI-BO-CONG-NGAY-CU | D4 · D4b |
| `phatSinh.js` thành phẩm thiếu lô → KHONG_DU_TON | VS-TP-THIEU-LO-GHI-AM | D13 |
| `duong.js` ma_gui cho 3 đường mới | BV-MA-GUI-MOI | E1 |
| `tinh.js` KHOA_GIA thêm khoá tiền mới | BV-BOGIA-TONG-UOC-TINH | E3 |
| `duong.js` sửa = huỷ cũ + phiếu mới | VS-SUA-KHONG-HUY-CU | E4b |
| `duong.js` sửa rẽ theo loại trước khi kiểm thân | BV-SUA-RE-LOAI-TRUOC | E4 |
| `nang_cap/007` cột don_id | BV-007-DON-ID | N1 |

Tên đột biến: BV-DH-VAO-TON, VS-DH-KHONG-GOP, VS-HAN-MUC-LON-HON-BANG, VS-THIEU-GIA-DUOI-HAN-MUC, VS-DH-NV-TU-DUYET, BV-CAN-CHU-QUAN, BV-DS-CAN-CHU-QUAN,
BV-HAN-MUC-CAI-DAT, BV-PN-NGUOI-KHAC, VS-PN-CONG-LUC-TAO, BV-GHI-KHO-NHAN, BV-CON-LAI-TRU-PN-CHO, BV-DON-DA-DONG, BV-HAN-TU-DIEN, BV-LECH-PN,
VS-FEFO-BO-LO-QUA-HAN, BV-HAN-MUC-NOI-BO, VS-NOI-BO-KHONG-CONG-DON, VS-NOI-BO-CONG-NGUOI-KHAC, VS-NOI-BO-CONG-NGAY-CU, VS-TP-THIEU-LO-GHI-AM,
BV-MA-GUI-MOI, BV-BOGIA-TONG-UOC-TINH, VS-SUA-KHONG-HUY-CU, BV-SUA-RE-LOAI-TRUOC, BV-007-DON-ID.

