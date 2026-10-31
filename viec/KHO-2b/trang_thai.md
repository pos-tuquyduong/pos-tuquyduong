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
- **Khôi phục sao lưu vào kho TRỐNG làm mất dữ liệu cột** (`server/routes/backup.js:388`, ngoài Phạm vi, lỗi có từ trước): cột lấy từ `Object.keys(rows[0])`
  — cột nào trống ở DÒNG ĐẦU trang Excel thì bị bỏ ở MỌI dòng (đo bằng chạy: ghi chú, don_id của phiếu mất sạch); dòng vi phạm CHECK (vd dòng thành
  phẩm mất san_pham_id) bị nuốt lỗi `Insert error` và mất. Đề xuất việc riêng: lấy cột theo hợp các dòng (hoặc `sheet_to_json(ws, { defval: null })`),
  báo số dòng lỗi. Khôi phục khi kho ĐANG có dữ liệu thì bỏ qua bảng kho như cũ (ca H4).
- Tiền mới chưa có quy tắc đối soát (LUAT §5): giá trị nhập theo giá thật (PN) và hao hụt / dùng nội bộ theo giá vốn (PS). Đề xuất gom vào việc kiểm kê
  (KK) / màn Đối soát sau khai trương: tổng nhập theo ngày × nhà cung cấp, tổng hao hụt theo loại chuyện × người.
- Quản lý TỪ CHỐI được đơn vượt hạn mức (chỉ chủ quán duyệt được) — giữ vậy: từ chối không đổi kho / tiền, nhân viên tạo lại được. Bạn muốn chỉ chủ quán
  từ chối thì báo.
- Màn Nhận hàng chỉ xét 50 đơn đã duyệt mới nhất (`nhapHang.js` goiYNhap) — đơn cũ hơn còn mở sẽ không hiện; huỷ đơn cũ không nhận nữa để danh sách gọn.
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
| (vòng 1) `duong.js` sửa lấy ghi chú / NCC / loại chuyện của phiếu cũ | BV-SUA-GIU-TRUONG-CU | E4c |
| (vòng 1) `duong.js` DH / PN / PS chỉ sửa phiếu đã duyệt | BV-SUA-CHI-DA-DUYET | E4d |
| (vòng 1) `phatSinh.js` có lô thì bỏ id nguyên liệu / món kèm theo | VS-PS-LO-KEM-KHOA | E5e |
| (vòng 1) `phatSinh.js` ghiKhoPhatSinh kiểm lại lô chọn sẵn khi duyệt | BV-DUYET-KIEM-LO | D14 |

Tên đột biến: BV-DH-VAO-TON, VS-DH-KHONG-GOP, VS-HAN-MUC-LON-HON-BANG, VS-THIEU-GIA-DUOI-HAN-MUC, VS-DH-NV-TU-DUYET, BV-CAN-CHU-QUAN, BV-DS-CAN-CHU-QUAN,
BV-HAN-MUC-CAI-DAT, BV-PN-NGUOI-KHAC, VS-PN-CONG-LUC-TAO, BV-GHI-KHO-NHAN, BV-CON-LAI-TRU-PN-CHO, BV-DON-DA-DONG, BV-HAN-TU-DIEN, BV-LECH-PN,
VS-FEFO-BO-LO-QUA-HAN, BV-HAN-MUC-NOI-BO, VS-NOI-BO-KHONG-CONG-DON, VS-NOI-BO-CONG-NGUOI-KHAC, VS-NOI-BO-CONG-NGAY-CU, VS-TP-THIEU-LO-GHI-AM,
BV-MA-GUI-MOI, BV-BOGIA-TONG-UOC-TINH, VS-SUA-KHONG-HUY-CU, BV-SUA-RE-LOAI-TRUOC, BV-007-DON-ID,
BV-SUA-GIU-TRUONG-CU, BV-SUA-CHI-DA-DUYET, VS-PS-LO-KEM-KHOA, BV-DUYET-KIEM-LO.

## Soát độc lập — lần 1 (agent general-purpose, /ra-soat) — chép nguyên
```
KHÔNG ĐẠT

LỖI TÌM ĐƯỢC:
1. client/src/pages/Kho/XemPhieu.jsx:51 + server/kho/phatSinh.js:86 — Chủ quán sửa phiếu phát sinh "Hết hạn" từ màn hình luôn bị 400 DONG_SAI.
   thanSua gửi cả lo_id lẫn nguyen_lieu_id (hoặc san_pham_id), vì docPhieuNhap trả đủ cả hai cho dòng lô.
   Máy chủ đòi đúng MỘT trong ba khoá.
   E5b (thu_KHO2b.js:377) tự soạn thân `{nguyen_lieu_id, su_co:'hong'}` nên không đi qua thanSua — xanh oan. — K3 + K4.
2. client/src/pages/Kho/XemPhieu.jsx:49-50 + server/kho/duong.js:249-250,314 — Sửa phiếu nhận / đơn đặt hàng làm MẤT ghi_chu và nha_cung_cap_id.
   Ô ghi chú là chỗ ghi "số hoá đơn" thay cho ảnh hoá đơn → sửa một con số là mất dấu hoá đơn. E4b / E5c không kiểm hai trường này. — K4.
3. server/kho/phatSinh.js:111 + phatSinh.js:47-49 — phiếu phát sinh chọn lô ("Hết hạn") mà đang chờ duyệt thì lúc duyệt KHÔNG kiểm lại lô.
   Hai nhân viên cùng báo hết hạn một lô thành phẩm → duyệt xong lô thành phẩm thành âm; conLaiTheoLo lọc `con > 1e-9` nên lô âm biến mất
   khỏi tồn thành phẩm → tồn thành phẩm ≠ Σ dòng phiếu đã duyệt (vỡ nghiệm thu F). Chú thích phatSinh.js:4 vì thế sai.
   Suy ra từ đọc code, CHƯA dựng lại bằng chạy. — K4 + K1.
4. server/kho/duong.js:304-316 + duLieu.js:259-262 + nhapHang.js ep→tuDuyet + XemPhieu.jsx:201 — chủ quán tạo phiếu nhận (chờ duyệt) rồi bấm "Sửa"
   chính phiếu đó → phiếu mới TỰ DUYỆT, cộng kho — vòng qua luật "người KHÁC duyệt" (B8). Quyết định 3 chỉ nói "sửa phiếu nhận ĐÃ DUYỆT".
   Phát sinh vượt hạn mức của chính chủ quán cũng vòng được. — K5 (lỗ quyền).

NGHI NGỜ:
- NhanHang.jsx:59,65 — ô giá không ghi đơn vị thật (giá là đồng / 1 đơn vị lưu) → giá vốn lô có thể lệch nhiều lần.
- duLieu.js:250 — quản lý TỪ CHỐI được đơn vượt hạn mức chỉ chủ quán duyệt được. Phiếu không nói rõ.
- phatSinh.js:74 — chú thích "phiếu thiếu giá … không cộng" nhưng SQL lọc THEO DÒNG. Hướng an toàn, chú thích sai (K1).
- PhatSinh.jsx:52 — tab "Tất cả" cho hỏng / đổ vỡ / khác hiện toàn bộ thành một danh sách dài (ngược tinh thần mục C).
- nhapHang.js:86 — danh sách đơn mở chỉ xét 50 đơn đã duyệt mới nhất.
- trang_thai.md chưa có: kết quả `node tu_chay/cong.js chay`, mục CHƯA KIỂM, 1–3 thao tác thử tay.

NGHIỆM THU: 36/40 vế có bằng chứng · thiếu: F PS bị TỪ CHỐI · F DH bị TỪ CHỐI · G điện thoại 360–430 px (không phép, không ghi CHƯA KIỂM) ·
  H sao lưu / khôi phục với cột mới của 007.

CHƯA SOÁT ĐƯỢC: lỗi 3 chưa dựng bằng chạy; hiển thị điện thoại + in 80 mm / A4 DH/PN/PS; khôi phục file sao lưu cũ (trước 007); cong.js chay;
  hiệu năng Turso (goiYNhap N+1 tới 50 đơn, dsPhieu dhCanChuQuan mỗi DH chờ duyệt).

ĐƠN GIẢN: duong.js:304-316 luật sửa nằm trong route — lấy ghi_chu / ncc / su_co của phiếu cũ làm mặc định; tinh.js:57 KHOA_GIA có khoá chết
  'gia_tri', 'da_dung', 'han_muc'; duLieu.js chuoiDon vòng lặp (CTE đệ quy là đủ); tiền mới (giá trị nhập PN, hao hụt PS) chưa có quy tắc đối soát.

BÀI HỌC:
- KHOÁ: ca sửa gửi ĐÚNG thân màn hình tạo ra cho mọi loại × su_co, so trường giữ nguyên (ghi_chu, ncc, su_co, don_id) trước–sau.
- KHOÁ: ca "duyệt muộn" cho dòng có lo_id chọn sẵn — lô bị trừ giữa lúc tạo và lúc duyệt → 409, tồn thành phẩm = Σ dòng.
- KHOÁ: ca "chủ quán sửa phiếu nhận CHỜ DUYỆT của chính mình" → không được tự cộng kho.
- NGUYÊN TẮC (K4): phép kiểm lúc TẠO phiếu chờ duyệt phải chạy lại lúc DUYỆT; "sửa = tạo lại" phải mang theo MỌI trường của phiếu cũ.
- NGUYÊN TẮC (K3): ca sửa / đường phụ mà bài tự soạn thân thì không chứng minh được màn hình gửi đúng.
```

## Vòng sửa 1 (sau soát lần 1)
- Lỗi 1: `phatSinh.js` có lô thì bỏ id nguyên liệu / món kèm theo; `XemPhieu.jsx` thanSua chỉ gửi lo_id cho dòng lô hết hạn. Ca E5e (thân như màn hình).
- Lỗi 2: `duong.js` sửa lấy ghi chú / nhà cung cấp / loại chuyện của phiếu cũ làm mặc định. Ca E4c.
- Lỗi 3: `phatSinh.js` ghiKhoPhatSinh kiểm lại lô chọn sẵn lúc duyệt (lô thành âm → 409, rollback). Ca D14 — lỗi dựng lại được bằng chạy (d050f97: 200 | 200).
- Lỗi 4: `duong.js` DH / PN / PS chỉ sửa phiếu đã duyệt (409 PHIEU_CHUA_DUYET); nút Sửa chỉ hiện khi đã duyệt. Ca E4d.
- Nghi ngờ: ô giá ghi `đ/<đơn vị lưu>`; chú thích phatSinh sửa đúng (lọc theo dòng); Phát sinh "hỏng / đổ vỡ / khác" có tab Thành phẩm + nhóm nguyên liệu
  (không danh sách dài); bỏ khoá chết `gia_tri`, `da_dung`, `han_muc` khỏi KHOA_GIA; quản lý từ chối đơn vượt hạn mức, giới hạn 50 đơn → Phát hiện.
- Nghiệm thu thiếu: F5 (từ chối PS và DH, tồn không đổi); H4 (sao lưu có cột mới; khôi phục khi kho có dữ liệu không chép đè); G điện thoại → CHƯA KIỂM (thử tay).
- Kết quả: thu_KHO2b 73/73 · KHO-2a 86/86 · KHO-1 111/111 · `npm test -- --day-du` PASS 88 · FAIL 0 · CẢNH BÁO 1 (có từ trước) · đột biến 30/30 BẮT.

## Soát độc lập — lần 2 — chép nguyên (rút gọn định dạng, giữ đủ ý)
```
KHÔNG ĐẠT — 4 lỗi lần 1 đã sửa đúng (đột biến BẮT 4/4), thu_KHO2b 73/73, --day-du PASS 88 · FAIL 0, dist khớp src.
LỖI TÌM ĐƯỢC:
1. NẶNG (kho) — K4 + K3. duong.js:315-318 (sửa PN = huỷ + phiếu mới tự duyệt), duLieu.js:266-271 (suaPhieu PX), nhapHang.js:62.
   "Sửa = huỷ + tạo lại" sinh lô MỚI đầy đủ; phần phiếu KHÁC đã trừ nằm trên lô CŨ → lô cũ âm, tự ẩn (conLaiTheoLo lọc con > 1e-9).
   Dựng bằng chạy: (a) PX 10 phần → PS hỏng 3 → tồn TP 7; chủ quán sửa PX (giữ 10) → tồn TP 10, Σ dòng = 7.
   (b) PN Gừng 10 → PS trừ 4 → sửa PN thành 9 → tồn 4 (đúng) nhưng lô mới 9, lô cũ −4 ẩn; PS hết hạn trên lô mới bỏ 9 → tồn Gừng −5.
   F1 chỉ so tồn Gừng với Σ dòng. Sửa ở luồng PX đụng mục Cấm → cần chủ quán quyết hướng.
2. NHẸ — K4. XemPhieu.jsx:51-52 + phatSinh.js:53-54: sửa phiếu nội bộ món pha tại chỗ → phiếu mới mất cho_mon_id.
3. NHẸ — K3. duong.js:317 mang don_id khi sửa PN nhưng không ca nào sửa PN THEO ĐƠN; xoá vế donId bài vẫn xanh (suy từ đọc code).
4. NHẸ — K4. phatSinh.js:114-115 chép tay `p.trang_thai = 'da_duyet' AND p.loai <> 'DH'` thay vì dùng DA_DUYET (duLieu.js:93).
5. NHẸ — K1. Chú thích duong.js:304 "chỉ sửa phiếu ĐÃ duyệt (chủ quán chốt 31.10)" cho DH / PN / PS — quyết định 3 chỉ nói phiếu NHẬN.
NGHI NGỜ: chủ quán vẫn sửa PX CHỜ DUYỆT của mình thành tự duyệt (duong.js:309-311, có từ KHO-2a, đụng Cấm → Phát hiện); huỷ PX sau
  phát sinh → tồn TP 0 trong khi Σ dòng −3; PN theo đơn: đơn bị huỷ lúc PN còn chờ duyệt — lúc duyệt không kiểm lại đơn (hợp lý, chưa ghi);
  nhapHang.js:32 viết chuỗi khoá hạn mức trực tiếp; trang_thai.md thiếu cong.js chay, CHƯA KIỂM, thao tác thử tay; tab "Chưa xếp nhóm" thừa ở hết hạn.
NGHIỆM THU: 41/43 · thiếu: F "tồn trước–sau kể cả sửa" (bằng chứng NGƯỢC — lỗi 1); G điện thoại — CHƯA KIỂM, thử tay.
ĐƠN GIẢN: phatSinh dùng DA_DUYET; xuất KHOA_HAN_MUC_DAT_HANG; dsPhieu đọc hạn mức một lần; chuoiDon CTE; goiYNhap gộp truy vấn.
CHƯA SOÁT ĐƯỢC: đột biến bỏ don_id (người gác chặn chép server/); điện thoại + in; cong.js chay; khôi phục file cũ vào kho trống; tốc độ Turso.
BÀI HỌC: KHOÁ ca "sửa phiếu sinh lô sau khi lô bị phiếu KHÁC trừ" (PX + PN); KHOÁ ca sửa PN theo đơn + đột biến gỡ donId;
  NGUYÊN TẮC (K4): "sửa = huỷ + tạo lại" phải mang cả trạng thái người khác đã ghi lên đối tượng cũ; một điều kiện "đã duyệt, tính vào tồn" là MỘT hằng.
```

