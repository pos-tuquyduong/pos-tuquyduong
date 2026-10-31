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
- Chủ quán vẫn sửa được phiếu XUẤT chờ duyệt của chính mình thành phiếu tự duyệt (có từ KHO-2a, `duong.js` nhánh PX → `duLieu.suaPhieu`) — cùng lỗ
  "người khác duyệt" đã bịt cho DH / PN / PS; không sửa vì mục Cấm "không đổi luồng PX". Đề xuất gom vào việc sau.
- Nguyên liệu: huỷ / sửa phiếu nhận khi lô đã bị phiếu khác trừ vẫn cho (luật KHO-2a: tồn nguyên liệu = Σ dòng, được âm, báo đỏ) — lô cũ âm tự ẩn nên
  tổng các lô có thể lớn hơn tồn; phiếu "hết hạn" chọn lô vẫn trừ theo lô. Thành phẩm thì bị chặn (LO_DA_BI_TRU) vì tồn thành phẩm = Σ lô.
- (soát 3) Ghi KẾT QUẢ phiếu xuất sau khi phiếu phát sinh đã trừ cùng lô thành phẩm (`duLieu.ghiKetQua`) có thể làm lô âm và ẩn khỏi tồn thành phẩm —
  cùng dạng LO_DA_BI_TRU nhưng ở luồng PX (mục Cấm) → chưa sửa, chưa dựng bằng chạy. Đề xuất việc sau: ghiKetQua kiểm lô không âm.
- (soát 3) Chủ quán SỬA phiếu nhận khi lô NGUYÊN LIỆU đã bị phiếu khác trừ vẫn cho (chỉ thành phẩm bị chặn) — lô mới đủ lượng, lô cũ âm ẩn, gợi ý "hết hạn"
  có thể báo lô còn nhiều hơn tồn. Kế hoạch §7 chỉ duyệt trường hợp HUỶ. **Bạn xác nhận giúp:** giữ như vậy, hay chặn sửa như thành phẩm (đề xuất: chặn —
  an toàn hơn, ~1 dòng, làm ở việc sau).
- (soát 3) Chủ quán sửa phiếu dùng nội bộ → phiếu mới ghi người tạo là chủ quán, nên hạn mức nội bộ trong ngày của người gốc được "trả lại" (log người gốc
  vẫn ở phiếu cũ qua thay_cho_id). Màn Nhận hàng theo đơn bỏ qua dòng của nguyên liệu đã "Ngừng dùng". Phiếu nhận trỏ đơn đã bị sửa tính cờ lệch theo đơn cũ.
- Đơn đặt hàng bị huỷ khi phiếu nhận theo đơn còn chờ duyệt: lúc duyệt không kiểm lại đơn — giữ vậy (hàng đã về thật).
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

## Chỗ vá → đột biến (viec/KHO-2b/dot_bien.py — số đột biến và kết quả mới nhất ở cuối file, mục Vòng sửa 4)
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
| (vòng 2) `duLieu.js` huyPhieu chặn khi lô thành phẩm đã bị phiếu khác trừ | BV-LO-TP-DA-BI-TRU | E6 |
| (vòng 2) `duong.js` sửa PN giữ don_id | BV-SUA-GIU-DON | E4e |
| (vòng 2) `phatSinh.js` dòng nguyên liệu giữ cho_mon_id khi sửa | BV-NOI-BO-GIU-MON | E5f |
| (vòng 4) `duong.js` sửa phiếu đã huỷ → PHIEU_DA_XU_LY (chỉ phiếu CHỜ DUYỆT mới PHIEU_CHUA_DUYET) | VS-SUA-HUY-SAI-MA | E7 |
| (vòng 4) `phatSinh.js` cho_mon_id chỉ nhận ở đường sửa | BV-CHO-MON-CHI-KHI-SUA | E8 |

Tên đột biến: BV-DH-VAO-TON, VS-DH-KHONG-GOP, VS-HAN-MUC-LON-HON-BANG, VS-THIEU-GIA-DUOI-HAN-MUC, VS-DH-NV-TU-DUYET, BV-CAN-CHU-QUAN, BV-DS-CAN-CHU-QUAN,
BV-HAN-MUC-CAI-DAT, BV-PN-NGUOI-KHAC, VS-PN-CONG-LUC-TAO, BV-GHI-KHO-NHAN, BV-CON-LAI-TRU-PN-CHO, BV-DON-DA-DONG, BV-HAN-TU-DIEN, BV-LECH-PN,
VS-FEFO-BO-LO-QUA-HAN, BV-HAN-MUC-NOI-BO, VS-NOI-BO-KHONG-CONG-DON, VS-NOI-BO-CONG-NGUOI-KHAC, VS-NOI-BO-CONG-NGAY-CU, VS-TP-THIEU-LO-GHI-AM,
BV-MA-GUI-MOI, BV-BOGIA-TONG-UOC-TINH, VS-SUA-KHONG-HUY-CU, BV-SUA-RE-LOAI-TRUOC, BV-007-DON-ID,
BV-SUA-GIU-TRUONG-CU, BV-SUA-CHI-DA-DUYET, VS-PS-LO-KEM-KHOA, BV-DUYET-KIEM-LO, BV-LO-TP-DA-BI-TRU, BV-SUA-GIU-DON, BV-NOI-BO-GIU-MON,
VS-SUA-HUY-SAI-MA, BV-CHO-MON-CHI-KHI-SUA.

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

## Vòng sửa 2 (sau soát lần 2)
- Lỗi 1 (NẶNG): `duLieu.js` huyPhieu (dùng chung cho huỷ và bước đầu của sửa, mọi loại) chặn 409 LO_DA_BI_TRU khi lô THÀNH PHẨM của phiếu đã bị phiếu
  khác (đã duyệt) trừ. Chỉ xảy ra từ KHO-2b (phát sinh trừ lô của phiếu xuất) — luồng phiếu xuất cũ không đổi (thu_KHO2a 86/86). Ca E6, đỏ trên 4cb3790.
  Phần nguyên liệu giữ luật KHO-2a → Phát hiện.
- Lỗi 2: dòng nguyên liệu phiếu phát sinh nhận cho_mon_id; màn sửa gửi kèm. Ca E5f.
- Lỗi 3: ca E4e sửa PN theo đơn + đột biến BV-SUA-GIU-DON.
- Lỗi 4: phatSinh dùng `duLieu.DA_DUYET`; nhapHang dùng `duLieu.KHOA_HAN_MUC_DAT_HANG`. Lỗi 5: chú thích `duong.js` sửa đúng nguồn quyết định.
- Nghi ngờ: tab "Chưa xếp nhóm" chỉ hiện khi có nhóm; PX chờ duyệt tự sửa, đơn huỷ khi PN chờ → Phát hiện.
- Kết quả: thu_KHO2b 76/76 · `npm test -- --day-du` PASS 88 · FAIL 0 · CẢNH BÁO 1 (có từ trước; gồm thu_KHO1, thu_KHO2a xanh) · dist khớp src · đột biến 33/33 BẮT.

## Soát độc lập — lần 3 (cuối) — chép nguyên ý
```
KHÔNG ĐẠT — chỉ còn lỗi NHẸ → LUAT §6.5: vòng sửa 4 trong phiếu. Ba bản sửa vòng 2 đúng và đủ. thu_KHO2b 76/76 · KHO-2a 86/86 · KHO-1 111/111 ·
--day-du PASS 88 · FAIL 0 · CẢNH BÁO 1 (có từ trước) · dist khớp src · đột biến vòng 2 BẮT 3/3.
LỖI TÌM ĐƯỢC:
1. server/kho/duong.js:315 — sửa phiếu DH / PN / PS ĐÃ HUỶ trả 409 PHIEU_CHUA_DUYET kèm lời sai; PX cùng tình huống trả PHIEU_DA_XU_LY
   (huyPhieu → viSaoKhongDoi). Trái LUAT §2 "cùng tình huống → cùng code". Không ca thử. — K4 — NHẸ.
2. viec/KHO-2b/trang_thai.md — tiêu đề "26 đột biến, BẮT 26" đã cũ (nay 33); thiếu kết quả `cong.js chay`, CHƯA KIỂM, thao tác thử tay. — K1/K6 — NHẸ.
3. server/kho/phatSinh.js:54 + :89 — cho_mon_id màn hình gửi được nhận ở MỌI lần tạo PS, không kiểm món có thật; chỉ để hiển thị. — K5 — NHẸ.
NGHI NGỜ: sửa PN khi lô nguyên liệu đã bị phiếu khác trừ (chỉ chặn thành phẩm) — kế hoạch §7 chỉ chấp nhận HUỶ, đề nghị chủ quán xác nhận riêng cho
  SỬA; ghi kết quả phiếu xuất sau khi phát sinh trừ cùng lô thành phẩm (ghiKetQua) → lô âm ẩn — đụng luồng PX (Cấm) → Phát hiện, chưa dựng bằng chạy;
  sửa phiếu nội bộ ghi người tạo phiếu mới là chủ quán → hạn mức nội bộ trong ngày chuyển từ người gốc sang chủ quán; NhanHang.jsx:32 bỏ im lặng dòng
  đơn của nguyên liệu đã ngừng dùng; duLieu.js:363 phiếu nhận trỏ đơn cũ (đã sửa) tính cờ lệch theo đơn cũ.
NGHIỆM THU: 42/44 — thử tay, chưa ghi: A "xem trước khi gửi nhà cung cấp" (DatHang.jsx bảng "Đơn sẽ gửi"); G điện thoại 360–430 px.
CHƯA SOÁT ĐƯỢC: cong.js chay; điện thoại, ô ngày hẹp, in 80 mm / A4; hai nghi ngờ lô âm ẩn chưa dựng bằng chạy; khôi phục file cũ vào kho trống; Turso.
BÀI HỌC: KHOÁ ca "sửa / huỷ phiếu ĐÃ HUỶ" mọi loại → cùng mã PHIEU_DA_XU_LY; KHOÁ trường "giữ lúc sửa" chỉ nhận ở đường sửa;
  NGUYÊN TẮC (K4) chặn "lô bị phiếu khác trừ" phủ mọi dòng ghi lên lô (huỷ, sửa, ket_qua); NGUYÊN TẮC (K1) số trong tiêu đề hồ sơ cập nhật cùng bảng.
```

## Vòng sửa 4 (LUAT §6.5 — soát lần 3 chỉ còn lỗi NHẸ)
SOÁT LẦN CUỐI: chat soát thay
- Lỗi 1: `duong.js` sửa: chỉ phiếu CHỜ DUYỆT trả PHIEU_CHUA_DUYET; phiếu đã huỷ đi qua huyPhieu → 409 PHIEU_DA_XU_LY như phiếu xuất. Ca E7.
- Lỗi 3: `phatSinh.js` cho_mon_id chỉ nhận khi chủ quán sửa (ep); tạo mới bỏ qua. Ca E8.
- Lỗi 2 (hồ sơ): tiêu đề bảng đột biến bỏ con số cũ; thêm CHƯA KIỂM, thao tác thử tay, kết quả cổng (dưới).
- Nghi ngờ của soát 3 → Phát hiện (một câu cần bạn xác nhận: sửa phiếu nhận khi lô nguyên liệu đã bị trừ).
- Kết quả: thu_KHO2b 78/78 · `npm test -- --day-du` PASS 88 · FAIL 0 · CẢNH BÁO 1 (có từ trước) · thu_KHO1, thu_KHO2a xanh · dist khớp src ·
  đột biến 35/35 BẮT · bài hiện tại trên fa55546 đỏ đúng E7, E8.

## Nghiệm thu — đếm từng mục
- A Đơn đặt hàng: theo công thức + gộp (A1, A2) · lẻ (A2) · chỉ lượng, không công thức (A11) · giá ước tính theo giá nhập (A12) · nhân viên → chờ duyệt (A6) ·
  quản lý ≤ hạn mức tự duyệt / > hạn mức chờ, ngay trên / dưới (A4, A7b) · thiếu giá = vượt (A8) · chỉ chủ quán duyệt > hạn mức (A5, A5b) · Cài đặt mặc định
  500.000, chỉ chủ quán đổi, giá trị sai 400 (A7, A10) · không đổi tồn (A9) · in (A13) · xem trước khi gửi: bảng "Đơn sẽ gửi" ở DatHang.jsx — THỬ TAY.
- B Nhận theo đơn: bảng tick / "Nhận đủ tất cả" / dòng lệch vàng (G3b tĩnh + G3 cờ máy chủ) · thêm dòng ngoài đơn (B6, G3) · hạn từng lô (B7) · giá thật → giá
  vốn lô (B2) · người KHÁC duyệt, chính người tạo 403 (B1, B8/C1) · duyệt mới tạo lô + cộng kho, một giao dịch (B1, B2, F2) · từ chối có lý do (B3) ·
  nhận thiếu còn mở / đủ thì đóng / từ chối mở lại (B4, B4b, B5) · đơn chưa duyệt 409 (B9).
- C Mua lẻ: không đơn, cùng luật duyệt (B8/C1) · khung "Đã chọn", tab "Sắp hết & hay mua", tab nhóm, lọc tên (C3 tĩnh, C2 dữ liệu gợi ý).
- D Phát sinh 4 bước (D7 tĩnh) · chỉ hiện thứ liên quan: hết hạn (D1), nội bộ (D3) · FEFO kể cả lô quá hạn (D2) · lô chọn (D12, D14) · hạn mức nội bộ người /
  ngày, cộng dồn, sang ngày, người khác không cộng, vượt → chờ duyệt, quản lý duyệt (D4, D4b, D9) · thiếu giá = vượt (D11) · chỉ chủ quán đổi (D8) ·
  trong hạn mức theo công tắc (D2 bật, D4 tắt, D10 quản lý) · món pha tại chỗ trừ theo công thức (D5) · log người / giờ / lý do (D6, D6b) · đổ vỡ (D10).
- E Bấm hai lần một phiếu DH / PN / PS (E1) · số phiếu (E2) · nhân viên không thấy giá (E3, E3b) · sửa / huỷ chỉ chủ quán, có lý do, phiếu cũ giữ
  (E4, E4b–E4e, E5, E5b–E5f, E7) · chặn khi thành phẩm đã bị trừ (E6).
- F Tồn đúng: DH (A9) · PN tạo / duyệt / từ chối / huỷ / sửa (B1, B2, B3, F6, E4b) · PS tạo / duyệt / huỷ / sửa / từ chối (D2, E5, E5b, F5) · DH từ chối (F5) ·
  duyệt song song một lần PN / PS / DH (F2, F4, F4b) · nội bộ song song quanh ngưỡng (F3) · tồn = Σ dòng (F1).
- G Tab hay dùng trước (G1) · huy hiệu một vòng 30 s, gồm DH / PN / PS, quản lý bỏ đơn cần chủ quán (G2, A5b) · điện thoại 360–430 px — THỬ TAY.
- H Pha chế, phiếu xuất, tồn, nguyên liệu, công thức, nhập SX, bán hàng: thu_KHO1 111/111 + thu_KHO2a 86/86 nguyên vẹn (gồm `/orders` J1) · PX dùng lô
  phiếu nhận, bỏ lô quá hạn (H2/H3) · sao lưu có cột mới, khôi phục khi kho có dữ liệu không chép đè (H4).

## Thao tác bạn thử tay trên điện thoại (sau khi gộp)
1. Kho → **Nhận hàng** → Mua lẻ → chạm 2 ô nguyên liệu, gõ số + giá (đ/kg) → Gửi. Đăng nhập tài khoản KHÁC → Kho → Phiếu → mở phiếu → Duyệt → Tồn kho tăng.
2. Kho → **Phát sinh** → Hỏng → chạm 1 món → Tiếp → gõ số → Xem phiếu → Gửi. Xem màn không bị kéo ngang.
3. Kho → **Đặt hàng** → chọn món + số phần → Thêm → xem bảng "Đơn sẽ gửi" → Gửi → (quản lý / chủ quán) In 80 mm.

## Báo cáo
```
VIỆC:        KHO-2b — đặt hàng có hạn mức · nhận hàng (theo đơn / mua lẻ) người KHÁC duyệt · xử lý phát sinh 4 bước
ĐÃ SỬA:      server/nang_cap/007_kho_nhap_hang.js — 3 cột (don_id, su_co, kho_phieu_dong.han_dung), không bảng mới
             server/kho/tinh.js — hạn mức (mặc định 500.000 / 50.000), tongTien, trongHanMuc, gopLuong, conLaiDon, chuanHan; KHOA_GIA + tong_uoc_tinh
             server/kho/duLieu.js — DA_DUYET bỏ DH khỏi tồn; soPhieuMoi, themPhieu; duyệt / từ chối / huỷ chung mọi loại (đơn vượt hạn mức → CAN_CHU_QUAN;
               lô thành phẩm bị phiếu khác trừ → LO_DA_BI_TRU); docPhieuNhap, docConLaiDon, dsPhieu (hang, can_chu_quan); docDinhMuc (hạn mức)
             server/kho/nhapHang.js (mới) — taoDatHang, taoPhieuNhan, ghiKhoNhan, goiYNhap
             server/kho/phatSinh.js (mới) — goiY, taoPhatSinh (hạn mức nội bộ), ghiKhoPhatSinh (FEFO, kiểm lô chọn sẵn)
             server/kho/duong.js — /phieu-dat, /phieu-nhan, /phieu-phat-sinh (ma_gui), /goi-y-nhap, /phat-sinh/goi-y; sửa rẽ theo loại, giữ trường cũ
             server/routes/settings.js — kho_han_muc_* số nguyên ≥ 0
             client/src/pages/Kho/ — ChonNguyenLieu, NhanHang, DatHang, PhatSinh (mới); XemPhieu, index, DsPhieu, DinhMuc, chung, kho.css; client/dist build lại
             cong_cu/thu_KHO2b.js (mới, 78 ca); kiem_tra_truoc_khi_giao.js +1 dòng chạy bài
BÀI THỬ:     chạy trên bản chưa vá (617f4e4) → ĐỎ 67/78 (bang_chung_do.txt); mỗi vòng sửa đỏ đúng ca lỗi trên bản trước vòng (d050f97: 5 · 4cb3790: 2 ·
             fa55546: 2); sau vá → XANH 78/78; đột biến 35/35 BẮT, đối chứng xanh; thu_KHO1 111/111, thu_KHO2a 86/86; --day-du PASS 88 · FAIL 0
ĐÃ RÀ K4:    grep "loai = 'PX'" server/kho → 1 chỗ còn (ghiKetQua, có chủ ý), 4 hàm duyệt / từ chối / huỷ / vì-sao đã bỏ; grep "'da_duyet'" cộng sổ → mọi
             câu tồn qua DA_DUYET (duLieu 2, phatSinh 1); khoá tiền → KHOA_GIA (E3 quét sâu); ma_gui → 3 đường mới dùng timMaGui; kiểm lúc tạo chạy lại lúc
             duyệt: hạn mức DH, lô chọn sẵn PS; sửa giữ ghi_chu / NCC / su_co / don_id / cho_mon_id
CHƯA KIỂM:   màn điện thoại 360–430 px, ô ngày hẹp, in 80 mm / A4 của DH / PN / PS (thử tay ở trên); tốc độ trên Turso (gợi ý nhập đọc lặp tới 50 đơn,
             danh sách phiếu đọc hạn mức mỗi đơn chờ); khôi phục sao lưu vào kho TRỐNG — hỏng sẵn ở backup.js (Phát hiện); ghi kết quả phiếu xuất sau khi
             phát sinh trừ cùng lô (Phát hiện, chưa dựng bằng chạy); hạn mức nội bộ khi chủ quán sửa phiếu của người khác
GIT:         (xem dòng git log ở cuối file)
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 3 · BỎ 3 — chi tiết ở ## Bài học
```
Ngân sách: máy chủ 456 dòng thêm (~400, +14% — phần "hay mua", gợi ý phát sinh và 4 vòng soát) · giao diện 422 (~450) · thử 526 (~500, +5%).

## Bài học
Sự cố gom được: soát độc lập 3 lần bắt 4 + 1 nặng + 2 nhẹ lỗi thật (đường sửa, lô bị phiếu khác trừ, kiểm lúc tạo không chạy lại lúc duyệt, mã lỗi lệch);
người gác chặn 5 lệnh (B-PHANTICH ×2: gộp python + node một dòng, `$'…'`; B-BIMAT-CHU: chạy bài thử có cụm bí mật chưa commit; B-CD-VITRI: `cd client`
giữa lệnh; GIT-LENH: `git stash list`); đột biến lạc neo một lần sau khi đổi dòng (vòng 4); vượt ngân sách máy chủ 14%.
- **KHOÁ** (ngoài Phạm vi — đề xuất): `cong_cu/thu_KHO1.js` (hoặc bài mới cho backup) ca "khôi phục vào kho TRỐNG: mọi cột y hệt trước, kể cả cột trống ở
  dòng đầu" — ĐỎ trên `backup.js:388` hiện tại; sửa `backup.js` lấy cột theo hợp các dòng. Lý do KHOÁ: lỗi âm thầm mất dữ liệu đúng lúc cần khôi phục.
- **KHOÁ** (đã làm trong Phạm vi): mỗi lỗi người soát báo có ca đỏ trên bản trước vòng + đột biến đưa đúng lỗi trở lại (E4c–E8, D14, E6; 9 đột biến vòng).
- **KHOÁ** (đề xuất, `tu_chay/` ngoài Phạm vi): `dot_bien.py` chạy ngay sau mỗi commit đổi `server/` để bắt neo lạc sớm (vòng 4 phát hiện muộn một bước).
- **NGUYÊN TẮC** (đề xuất thêm vào KHUON_LOI.md K4, ngoài Phạm vi): "Sửa = huỷ + tạo lại" phải mang theo MỌI trường của phiếu cũ VÀ trạng thái người khác
  đã ghi lên đối tượng cũ (lượng đã trừ trên lô); phép kiểm lúc TẠO phiếu chờ duyệt phải chạy lại lúc DUYỆT. Đã gây: KHO-2b soát 1 lỗi 2–3, soát 2 lỗi 1.
- **NGUYÊN TẮC** (đề xuất K3): ca thử của đường phụ (sửa) phải gửi ĐÚNG thân màn hình dựng (thanSua), không tự soạn thân gọn hơn. Đã gây: E5b xanh oan, soát 1 lỗi 1.
- **NGUYÊN TẮC** (đề xuất K4): cùng tình huống → cùng mã lỗi ở mọi loại phiếu; thêm loại phiếu vào hàm chung thì rà mã lỗi từng nhánh. Đã gây: soát 3 lỗi 1.
- **BỎ**: các lệnh bị người gác chặn — luật đã có, lỗi thao tác một lần (tách lệnh, commit bài thử trước khi chạy). `git stash list` — chỉ để xem, không cần.
- Dọn: không có lời dặn nào trong KHUON_LOI.md / CLAUDE.md được phép kiểm mới làm thay trong việc này.

## Cổng
`node tu_chay/cong.js chay . 617f4e4^ HEAD viec/KHO-2b` (HEAD a38593c, cây sạch): ✓ CỔNG CHẠY ĐẠT
GIT (git log --oneline -2 lúc kiểm):
  a38593c KHO-2b: vong sua 4 ghi ho so, nghiem thu, bao cao 7 muc, bai hoc
  0e3cedd KHO-2b: neo dot bien BV-SUA-CHI-DA-DUYET theo dong moi

HEAD ĐÃ KIỂM: a38593c
