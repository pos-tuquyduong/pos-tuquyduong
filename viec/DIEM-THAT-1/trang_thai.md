# DIEM-THAT-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (25.10.2026)
- Nhánh: `viec/DIEM-THAT-1`; cây sạch; HEAD `611b043` · FETCH_HEAD `611b043` (bằng nhau → không kéo).
- `git log --oneline -3`:
  ```
  611b043 PHIEU: DIEM-THAT-1
  5bee3b2 TIEN-DO: QUAY-AN-1 (cfb3f02), P24 (5cb2a03) xong; P3 duyet (tach P3b); mo DIEM-THAT-1 + BH-1; them P3b, BH-2; lich — so v40
  5cb2a03 Merge pull request #43 from pos-tuquyduong/viec/P24
  ```
- Làm tiếp (`tiep`, 25.10): hook mở phiên đã kéo `ae69923 → e403ac5`; HEAD `e403ac5` · FETCH_HEAD `e403ac5` (bằng nhau). `git log --oneline -3`:
  ```
  e403ac5 PHIEU: DIEM-THAT-1 duyet ke hoach 25.10 (ham o utils/diemThat.js, thu_P20 vao Pham vi, bill hua diem de HD-1)
  ae69923 DIEM-THAT-1: ke hoach (cho duyet) + trang thai, cau hoi thu_P20 / bill hua diem
  611b043 PHIEU: DIEM-THAT-1
  ```

## Bước 2–3 — đọc + kế hoạch
- Kế hoạch: `ke_hoach.md`. Phiếu dặn **chờ duyệt kế hoạch** → dừng sau khi push kế hoạch.
- Thăm dò (đã hoàn lại, không commit): vá tạm đúng phương án A rồi chạy bài cũ → biết trước bài cũ nào vỡ (ke_hoach.md mục 5).
- Chủ quán duyệt 25.10 (phiếu, mục "Đã duyệt"): hàm ở file MỚI `server/utils/diemThat.js` (thay Phần 1 phương án A — không dòng export
  cuối `orders.js`, không nạp lười); `thu_P20.js` vào Phạm vi; bill hứa điểm để nguyên (HD-1 / P15); I8 công thức riêng.

## Bước 4–6 — bài thử, vá, kiểm
- Bài thử viết + commit TRƯỚC khi vá (`09bc8c1`, `8bea373`, `651fb8a`); đỏ trên gốc `e403ac5` — `bang_chung_do.txt`.
- Vá: `8816b85`. `npm test` PASS 71 · FAIL 0; `npm test -- --day-du` PASS 75 · FAIL 0.
- Đổi so với kế hoạch: bỏ đột biến `VS-I8-MOC-BANG` (`<` → `<=` ở mốc mới) — TƯƠNG ĐƯƠNG: `created_at` luôn có giờ
  ("2026-10-27T00:00:00" > "2026-10-27" theo chuỗi), nên `<` và `<=` so với mốc chỉ-ngày cho cùng kết quả. Thêm `BV-I8-tay`,
  `VS-I8-BO-PHI`, `BV-I8-VE-LUAT-CU`. Ca B6 (phí giao âm) thêm theo kế hoạch.

### Chỗ vá → đột biến (`viec/DIEM-THAT-1/dot_bien.py`, kết quả: TỔNG 16 · BẮT 16 · SỐNG 0 · HỎNG 0 · LẠC 0)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| `server/utils/diemThat.js` tienTinhDiem | `VS-HAM-BO-PHI` · `VS-HAM-BO-CK` · `VS-HAM-LAM-TRON` | B3 · B4 · A1 |
| `orders.js` POST / (dòng gọi `tinhDiemDon`) | `BV-TAO` · `VS-TAO-PHI-THO` | B1 · B6 |
| `orders.js` pay-debt | `BV-THU` · `VS-THU-QUEN-LAN-NAY` | C2 · C1 |
| `signup-codes.js` /nhan-diem + SELECT `kiemDonCuaMa` | `BV-MA` · `VS-MA-THIEU-COT` | D1 · G4 |
| `bat_bien.js` I8 | `BV-I8` · `BV-I8-tay` · `VS-I8-BO-PHI` · `VS-I8-BO-MOC` · `VS-I8-MOC-GIA-LAP` · `BV-I8-VE-LUAT-CU` · `VS-I8-CU-CU-GMOI` | F2 · I8 tay (gl) · F5 · F2 · F4 · F3 · F6 |
| `kich_ban.js` KB31 nợ có tiền mặt | M15 của `thu_gia_lap.js` (có sẵn) | KB31 → I8 |

Tên đột biến: VS-HAM-BO-PHI, VS-HAM-BO-CK, VS-HAM-LAM-TRON, BV-TAO, VS-TAO-PHI-THO, BV-THU, VS-THU-QUEN-LAN-NAY, BV-MA, VS-MA-THIEU-COT,
BV-I8, BV-I8-tay, VS-I8-BO-PHI, VS-I8-BO-MOC, VS-I8-MOC-GIA-LAP, BV-I8-VE-LUAT-CU, VS-I8-CU-CU-GMOI,
VS-I8-BO-CK, VS-I8-BO-LAM-TRON, VS-I8-MOC-THAT-BO-HUYCU (soát vòng 1). Kết quả sau vòng 1: TỔNG 19 · BẮT 19 · SỐNG 0 · HỎNG 0 · LẠC 0.
Vòng 2 (trần total − ví − ví mẹ): VS-HAM-BO-TRAN, VS-HAM-TRAN-BO-VI-ME, VS-TAO-BO-VI, VS-TAO-BO-TOTAL, VS-MA-THIEU-COT-VI, VS-I8-BO-TRAN.
Kết quả sau vòng 2: TỔNG 25 · BẮT 25 · SỐNG 0 · HỎNG 0 · LẠC 0.
Vòng 3 (mỗi số hạng trần một đột biến, ở hàm + MỖI chỗ gọi + I8): VS-HAM-TRAN-BO-VI, VS-TAO-BO-VI-ME, VS-MA-THIEU-COT-VI-ME,
VS-I8-TRAN-BO-VI, VS-I8-TRAN-BO-VI-ME (VS-MA-THIEU-COT-VI nay chỉ gỡ cột ví thường). Kết quả sau vòng 3: TỔNG 30 · BẮT 30.

| Chỗ vá (vòng 2) | Đột biến | Ca bắt |
|---|---|---|
| `diemThat.js` trần `Math.min(traThat, tran)` | `VS-HAM-BO-TRAN` · `VS-HAM-TRAN-BO-VI-ME` | B7 · A1 |
| `orders.js` POST / truyền `total`, ví, ví mẹ | `VS-TAO-BO-VI` · `VS-TAO-BO-TOTAL` | B7 · G1 |
| `signup-codes.js` SELECT cột ví | `VS-MA-THIEU-COT-VI` | D4 |
| `bat_bien.js` I8 cùng trần (`tra`) | `VS-I8-BO-TRAN` | F1 (đơn B7 / C6 / D4) |

> Số dòng: trong các mục "Xử lý", "Câu hỏi", "Phát hiện" là số ở HEAD `52e9ef9` (kiểm lại vòng 4); trong các báo cáo soát chép
> nguyên là số lúc soát (sau đó code trôi 1–2 dòng); trong `ke_hoach.md` là số ở nền `611b043` (ghi ở đầu file đó).

## Soát độc lập — vòng 1 (agent general-purpose, 25.10; chép nguyên báo cáo)
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. cong_cu/gia_lap/bat_bien.js:145 vs server/utils/diemThat.js:7 — hai biểu thức làm tròn khác nhau. Code: Math.max(0, Math.round(cash + ck − ship));
   I8: Math.floor(Math.max(0, cash + ck − ship) / per) — KHÔNG Math.round. Cột tiền lẻ (vd cash_amount 9999,6, per 1000): code cộng 10 điểm,
   I8 nói "đúng luật là 9" → Đối soát đỏ oan. Số lẻ vào cột được qua pay-debt (amount === order.debt_amount lẻ được nhận, orders.js:1280)
   và chiết khấu % không làm tròn (orders.js:697). Ca A1 khoá số lẻ 10000,4 cho HÀM nhưng không ca I8 nào có số lẻ. — K4 (MỘT vị từ, hai
   biểu thức sẽ lệch) + K2 (bất biến đỏ oan). Sửa gọn: thêm Math.round vào dòng 145 + một ca I8 có tiền lẻ.
2. server/routes/signup-codes.js:229 + bat_bien.js:152,159 — đơn CŨ lẫn hai luật lúc chuyển giao, không có ca K5 dữ liệu cũ. Đơn tạo trước
   gộp, trả ví 10.000 + tiền mặt 15.000, đã có earn 25 lúc bán (luật cũ); sau gộp khách nhập mã nhận điểm (trong hạn nhandiem_han_gio):
   diemGoc = 15 → bù round(15×(k−1)) = 15 → tổng 40. I8 chỉ nhận 30 (luật mới) hoặc 50 (luật cũ) → Đối soát thật báo lệch; khách nhận
   số không theo luật nào. Đơn cũ ví trọn mà bill đã hứa → nay 400 DON_KHONG_DU_DIEM (đã ghi Phát hiện) nhưng chưa có ca cho đơn cũ có
   earn luật cũ rồi nhận mã sau gộp. — K5. Hướng sửa (a) I8 nhận thêm tổng gCu + round(g×(k−1)) cho đơn trước DIEM_THAT_TU, hoặc
   (b) /nhan-diem tính bù theo earn đã có — quyết định điểm, hỏi chủ quán.
NGHI NGỜ:
- P4 server tin client ±1đ: POST / điểm nay lấy từ cash_amount/transfer_amount client gửi (orders.js:855); paymentSum chịu lệch ±1đ
  (orders.js:824–834) → cash = total + 1 qua kiểm và được +1 điểm khi total ≡ per − 1 (mod per). Trước vá điểm từ total server tính.
  Không thổi hơn được (ví / ví mẹ / nợ âm ép 0, orders.js:761–813) → tối đa +1 điểm/đơn. Khoá hẳn: trần min(cash+CK, total − ví − ví mẹ).
- pay-debt order[cotTien] + paidAmount (orders.js:1312) đúng: order đọc trước UPDATE, UPDATE chặn đua debt_amount = ? (:1322–1324),
  paidAmount ≤ nợ (:1287); C5 khoá đua.
- Hai vế chưa có đột biến MANG TÊN: so(r.transfer_amount) của I8 và `cu` ở dòng mốc mới (bat_bien.js:159). Tôi tự dựng — cả hai BẮT
  (bỏ CK → F1 đỏ; cu → ctx.thuc → ca P24 "đơn TẠO trước mốc thu đủ nhưng huỷ sau mốc huỷ" của thu_gia_lap đỏ) — phủ rồi, hồ sơ chưa ghi.
- Chỗ INSERT earn: 3 (orders.js:1062, :1339, signup-codes.js:296), cả 3 dùng tienTinhDiem; /api/kh/nhan-diem cùng nhanDiemMaBill
  (kh/index.js:163); huỷ / xoá trừ SUM (orders.js:1589); đổi cách trả giữ tổng TM+CK (don-mo-rong.js:133–149). Bill hứa điểm (:1207),
  doiSoat.js:257 để việc sau như đã duyệt.
- Luồng hợp lệ: TM / CK không đổi (G1–G4); mua gói / thẻ, chiết khấu, lấy từ gói (0đ) cash = total → như cũ; ví mẹ không điểm đúng luật
  (B4). Không ca riêng cho mua gói / thẻ, chiết khấu. Không phép chặn mới → không chặn oan.
- K1: ke_hoach.md mục 1 "cột lưu ĐÚNG phần đã thu" quá chữ (±1đ, cột có thể âm). orders.js:42 dòng require chen giữa chú thích P22-23 và
  hàm. bat_bien.js:147 tham số g che biến g ngoài — đổi tên cho dễ đọc. Số trong trang_thai.md / bang_chung_do.txt khớp lần chạy lại.
NGHIỆM THU: 7/7 mục có bằng chứng · không mục thiếu hẳn (A :131–154 · B :161–173 · C :179–210 · D :216–231 + G4 · E :237–248 + thu_P24 G1 ·
  F :267–306 + 6 ca I8 tay, mốc bat_bien.js:24 · G :254–261).
  Vùng sửa: orders.js chỉ 3 dòng (42, 855, 1312); kiem_tra 1 tên cuối mảng (:495); mọi file trong Phạm vi; không client/. Vượt ngân sách:
  bài mới 320 dòng (phiếu ~200). I8 chạy ở Đối soát (doiSoat.js:15). cong.js chay chưa ghi vào trang_thai.md.
CHƯA SOÁT ĐƯỢC: không chạy tu_chay/cong.js chay; lỗi 2 suy từ code, chưa dựng ca chạy; chưa đo quầy thật có sinh cột tiền lẻ không;
  bản sao đột biến tự dựng m1, m2 trong scratchpad (ngoài kho) không xoá được (bị từ chối quyền).
BÀI HỌC: KHOÁ — bất biến trọng tài chép riêng công thức thì một ca đưa CÙNG bộ đầu vào biên (lẻ, âm, chuỗi) qua cả hàm lẫn bất biến.
  KHOÁ — ca K5 dữ liệu cũ cho đường cộng điểm THỨ HAI trên cùng đơn (bán luật cũ, nhận mã luật mới). NGUYÊN TẮC (K4) — đổi nguồn một số
  tiền từ giá trị server tính sang trường client gửi thì soát lại dung sai của phép kiểm tổng (±1đ). NGUYÊN TẮC — mỗi vế vị từ bất biến
  một đột biến MANG TÊN; bài khác bắt "ké" không đủ làm bằng chứng của phiếu.
```
(Đã rút gọn xuống dòng cho vừa khung — nội dung giữ nguyên.)

### Xử lý vòng 1 (commit `224d085` + neo `VS-I8-BO-CK`)
- Lỗi 1 — SỬA: `bat_bien.js:146` (dòng `g`) thêm `Math.round` (cùng biểu thức với `tienTinhDiem`); `thu_gia_lap.js` thêm ca "I8 sạch (DIEM-THAT-1): tiền
  mặt lẻ 24.999,6 − phí giao 5.000 → 2 điểm"; đột biến `VS-I8-BO-LAM-TRON` đưa ĐÚNG lỗi cũ trở lại → BẮT.
- Vế chưa có đột biến mang tên — SỬA: thêm `VS-I8-BO-CK`, `VS-I8-MOC-THAT-BO-HUYCU` (BẮT).
- Lỗi 2 và nghi ngờ ±1đ — quyết định điểm → `## Câu hỏi` 3, 4. DỪNG chờ chủ quán (luật cứng /lam-viec).
- K1 nhỏ (chú thích ke_hoach mục 1 "ĐÚNG phần đã thu", tham số `g` che biến, chỗ đặt dòng require): để vòng sửa sau cùng câu trả lời.

## Câu hỏi
(Hai câu hỏi lượt trước đã được chủ quán trả lời trong phiếu, mục "Đã duyệt" 2 và 3.)
1. ~~`cong_cu/thu_P20.js` ngoài Phạm vi~~ — đã thêm vào Phạm vi; đã sửa như đề xuất.
2. ~~Bill hứa điểm cho đơn 0 điểm thật~~ — chọn (a): để nguyên, chat ghi cho HD-1 / P15.
3. **[ĐÃ TRẢ LỜI 25.10: chọn (c) — để nguyên code, chat xử tay nếu Đối soát báo]** **Đơn bán TRƯỚC khi gộp, nhận mã điểm SAU khi gộp (soát vòng 1 lỗi 2).** Khung thời gian: chỉ trong hạn mã (`nhandiem_han_gio`,
   mặc định 24 giờ) sau lúc gộp. Ví dụ đơn ví 10.000 + tiền mặt 15.000, lúc bán được 25 điểm (luật cũ, total); sau gộp `/nhan-diem`
   tính gốc 15 → bù round(15 × (k − 1)) = 15 → tổng 40 (`signup-codes.js:244–246`), không khớp luật nào → Đối soát thật báo lệch đơn đó.
   Chủ quán chọn:
   - (a) Để nguyên code; I8 ở Đối soát thật tha thêm tổng `gCu + round(g × (k − 1))` cho đơn tạo trước `DIEM_THAT_TU` (~2 dòng
     `bat_bien.js` + 1 ca + 1 đột biến). Khách nhận 40 (lẫn hai luật) cho các đơn đó.
   - (b) `/nhan-diem` tính phần bù = round(gốc × k) − tổng earn đã có của đơn (thay vì round(gốc × (k − 1))): khách nhận đúng luật mới
     (30); đơn có earn cũ lớn hơn thì 0 bù (400 `KHONG_THEM_DIEM`). Đổi đường cộng điểm (~3 dòng `signup-codes.js` + ca + đột biến).
   - (c) Để nguyên cả hai; chat xử tay các đơn đó ở Đối soát (dự kiến rất ít — chỉ đơn trộn ví / phí giao, nhận mã trong 24 giờ đầu).
   Máy đề xuất (c) nếu muốn ít đụng nhất, (b) nếu muốn đúng luật mới tuyệt đối. Máy KHÔNG tự chọn.
4. **[ĐÃ TRẢ LỜI 25.10: chọn (b) — làm ở vòng 2]** **Dung sai ±1đ (soát vòng 1 nghi ngờ P4).** Điểm POST / nay lấy từ `cash_amount` / `transfer_amount` máy khách gửi; phép kiểm tổng
   cho lệch ±1đ (`orders.js:825–836`) → tối đa +1 điểm / đơn khi total ≡ per − 1 (mod per). Chủ quán chọn: (a) chấp nhận (±1đ có từ
   trước, chỉ ảnh hưởng điểm); (b) trần `min(cash + CK, total − ví − ví mẹ)` ngay ở dòng gọi POST / (vẫn MỘT dòng, trong vùng sửa)
   + 1 ca + 1 đột biến. Máy đề xuất (b) — rẻ, khoá bằng code (C16).
5. **Xác nhận phạm vi trần (câu 4 (b)).** Câu 4 máy soạn chỉ ghi "ngay ở dòng gọi POST /" — thiếu sót của máy (K4): cùng lỗ ±1đ có ở
   pay-debt (tiền mặt lúc tạo thừa 1đ cộng dồn) và /nhan-diem (đọc cột); C6, D4 ĐỎ trên code trước trần (`bang_chung_do.txt` mục 5).
   Máy đã đặt trần trong `tienTinhDiem` (ba chỗ gọi cùng khoá) + I8 cùng trần. Trần chỉ HẠ điểm, tối đa phần ±1đ. Chủ quán chọn:
   (a) giữ trần ở hàm chung như hiện tại (máy sửa chú thích `diemThat.js:4` cho đúng ngày / câu duyệt);
   (b) chỉ giữ ở dòng gọi POST / (pay-debt, /nhan-diem còn hở ±1đ; bỏ ca C6, D4 và I8 về không trần — ~10 dòng đổi ngược).
   Máy đề xuất (a).
   Kèm (soát vòng 3, nghi ngờ): đơn CŨ trên production có `parent_balance_amount > 0` mà `parent_phone` NULL (hoàn ví `orders.js:1402`
   chỉ tính ví mẹ khi có `parent_phone`) thì trần hạ điểm oan khi thu nợ / nhận mã. Đơn mới không gặp. Máy không đo được dữ liệu thật —
   chat chạy giúp `SELECT COUNT(*) FROM pos_orders WHERE parent_balance_amount > 0 AND parent_phone IS NULL` trên Turso; > 0 thì máy thêm
   điều kiện `parent_phone` vào trần (khớp hoanVi).
6. **Cho phép vòng sửa thứ 4 (chỉ hồ sơ + gom dòng)?** Lỗi còn lại của vòng 3 không đụng logic: K1 số dòng trong `trang_thai.md`
   (:128, :132, :139) và `ke_hoach.md:19` (đưa về số của nền 611b043), chú thích `diemThat.js:4`, và gom dòng gọi POST /
   (`orders.js:856–857`) về ĐÚNG MỘT dòng vật lý như phiếu (tránh đụng P3 khi gộp). Vượt `so_vong_sua_toi_da` = 3 → cần chủ quán cho phép.
7. **Ngân sách bài thử:** `thu_DIEMTHAT1.js` 347 dòng (phiếu ~200) — do 3 vòng soát thêm ca (B6–B8, C6, D4–D5, F trần). Chấp nhận, hay
   máy gom lại (ví dụ dùng chung hàm tạo đơn ví mẹ / ví thường) trong vòng 4?

## Phát hiện
- `server/utils/doiSoat.js:257` chú thích "chủ quán chốt giữ floor(total/per)" cho D2 sẽ cũ sau việc này (I8 tính theo tiền thật).
  `server/utils/**` bị cấm → không sửa; việc sau sửa chú thích.
- Lời hứa "gấp k điểm" trên bill (`orders.js:1209`, chữ ở :1216, :1220) vẫn in cho đơn trả trọn bằng tài khoản (0 điểm thật) → khách nhập mã bị 400
  `DON_KHONG_DU_DIEM` (thu_DIEMTHAT1 D3, thu_P20 "trả trọn bằng ví"). Chủ quán đã chọn để HD-1 / P15.

### Xử lý vòng 2 (chủ quán trả lời câu 3, 4 ngày 25.10; bài `7aca85b` → code `728af71`)
- Câu 3 (c): không đổi code. **Ghi chú K1 cho chủ quán:** lý do "mã nhận điểm chỉ in cho khách lẻ" KHÔNG khớp code — `orders.js:1145–1172` (luật ở :1145)
  in mã cho MỌI đơn (kể cả có SĐT), trừ SĐT đã từng claim; ca D2 / D4 của bài này là đơn có SĐT trả trộn ví vẫn nhận mã. Vậy đơn trộn
  ví bán trước gộp, nhận mã trong 24 giờ đầu sau gộp CÓ thể gặp → Đối soát thật báo lệch đơn đó (khách nhận gốc mới + bù theo hệ số,
  vd 40 thay 30 / 50). (c) vẫn dùng được: chat xử tay theo dòng Đối soát; số đơn có thể nhiều hơn dự tính.
- Câu 4 (b): trần đặt TRONG `tienTinhDiem` (`server/utils/diemThat.js:10–14`), không chỉ ở dòng gọi POST / — K4: pay-debt (tiền mặt lúc
  tạo thừa 1đ cộng dồn) và /nhan-diem (đọc cột) cùng lỗ ±1đ; vá ở hàm chung thì ba chỗ gọi cùng khoá. POST / truyền `total`,
  `actualBalanceAmount`, `actualParentBalanceAmount` (vẫn trong MỘT dòng gọi, `orders.js:856`); /nhan-diem đọc thêm `balance_amount`,
  `parent_balance_amount` (`signup-codes.js:54`); I8 cùng trần (`bat_bien.js:145`) để cột thừa 1đ không làm Đối soát đỏ oan.
  Thiếu `total` → trần 0 → 0 điểm (ca A1 `{cash_amount: 25000}` → 0 khoá mặc định này).
- K1 nhỏ của vòng 1: dòng `require` dời lên TRƯỚC chú thích P22-23 (`orders.js:40`); tham số `diemDung(luatCu, goc)` không che `g`
  (`bat_bien.js:148–154`); `ke_hoach.md` mục 1 sửa câu "lưu ĐÚNG phần đã thu" → lệch tối đa ±1đ, chặn bằng trần.
- Nghiệm thu A của phiếu ghi công thức `max(0, cash + CK − ship)`; nay thêm trần theo quyết định câu 4 (b) — đơn không trừ ví và không
  thừa 1đ cho đúng số như công thức phiếu (G1–G4 không đổi).

## Soát độc lập — vòng 2 (agent general-purpose, 25.10; chép nguyên báo cáo, rút gọn xuống dòng)
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. Vế "ví mẹ" của trần mới không bài thử nào bắt khi gỡ — K3 (+ K1 vì hồ sơ ghi đã phủ). Chỗ: orders.js:857 (parent_balance_amount
   trong dòng gọi POST /), signup-codes.js:54 (cột parent_balance_amount trong SELECT kiemDonCuaMa), bat_bien.js:146 (- so(r.parent_balance_amount)).
   4 đột biến tự dựng bằng chay() của dot_bien.py (scratchpad dbt.py): R-TAO-BO-VI-ME SỐNG · R-MA-BO-VI-ME SỐNG · R-I8-BO-VI-ME SỐNG (dt lẫn gl).
   Đi tới được thật: ví mẹ 15.001 + tiền mặt 10.000, total 25.000 → paymentSum 25.001 lọt ±1đ (orders.js:832); bỏ vế ví mẹ → 10 điểm thay 9.
   Chỉ A1 (hàm thuần) bắt VS-HAM-TRAN-BO-VI-ME; B7, C6, D4 chỉ ví thường. trang_thai.md ghi VS-TAO-BO-VI / VS-MA-THIEU-COT-VI phủ ví mẹ —
   sai (VS-TAO-BO-VI chỉ gỡ ví thường; VS-MA-THIEU-COT-VI gỡ hai cột một lúc). Phiếu F đòi mỗi vế một ca + một đột biến gỡ đúng vế;
   lặp bài học vòng 1. Sửa: ca B8 (ví mẹ 15.001 + TM 10.000 → 9), ca D tương ứng; đột biến VS-TAO-BO-VI-ME, VS-MA-THIEU-COT-VI-ME, VS-I8-TRAN-BO-VI-ME.
2. diemThat.js:11 vế ví thường chưa có đột biến mang tên (tự dựng R-HAM-TRAN-BO-VI → BẮT ở B7: phủ, hồ sơ chưa ghi) — K3 (hồ sơ), nhẹ.
3. cong.js chay chưa ghi vào trang_thai.md (LUAT_XAY_APP §6.3) — K6.
NGHI NGỜ:
- Chỗ đặt trần: lý do K4 ĐÚNG (C6 pay-debt, D4 /nhan-diem đỏ trên 979b1b2 → lỗ ±1đ có thật ở cả ba chỗ gọi; pay-debt SELECT *
  orders.js:1262; parent_balance_amount database.js:758, balance_amount database.js:210, REAL DEFAULT 0; Number(x)||0 đỡ NULL). NHƯNG câu 4
  máy soạn chỉ nói "ngay ở dòng gọi POST /" và chủ quán chọn (b) theo chữ đó — mở rộng sang pay-debt, /nhan-diem, I8 là đổi phạm vi
  một quy tắc tiền, máy ghi ở "Xử lý vòng 2" nhưng không hỏi lại. Đúng tinh thần (b) (trần chỉ hạ điểm, tối đa phần ±1đ) — nên báo rõ
  chủ quán trong báo cáo cuối thay vì coi là đã duyệt. Câu 4 tự nó đã sót đường song song (K4) lúc đặt câu hỏi.
- Thiệt so với vòng 1 ở biên làm tròn: total lẻ 29.999,4, tiền mặt 30.000 → min 29.999,4 → 29.999 — ít hơn vòng 1 một điểm, nhưng bằng
  luật trước việc (floor(total/per)) → không thiệt so với gốc (G).
- Thiệt khi máy khách gửi THIẾU 1đ: tiền mặt = total − 1 (lọt dung sai) → có thể thấp hơn luật trước việc 1 điểm; có từ vòng 1; chưa đo
  quầy thật có gửi thiếu không.
- Trần khoá chặn trên như luật cũ: ví / ví mẹ chỉ nhận khi > 0 (orders.js:761,777,805) → điểm ≤ floor((total − ship)/per); TM / CK âm
  không thổi được.
KẾT QUẢ SOÁT TỪNG MỤC: --goc 979b1b2 khớp hồ sơ (dt 29 · 4: A1 B7 C6 D4; p2223, p24, gl xanh). dot_bien.py đối chứng dt 33·0, gl 113·0 ·
  TỔNG 25 · BẮT 25. npm test PASS 71; --day-du PASS 75 · FAIL 0. A2 kiểm mẫu cũ BIẾN MẤT (thu_DIEMTHAT1.js:142–158).
  K4: 3 INSERT 'earn' (orders.js:1062, :1340, signup-codes.js:294) đều qua tienTinhDiem; loyalty.js:125 redeem; orders.js:1591 adjust;
  I8 (bat_bien.js:146–147) và hàm (diemThat.js:10–12) cùng biểu thức min / round / max.
  K5: đổi cách trả (don-mo-rong.js:133–149) chặn đơn có ví, giữ tổng TM+CK; gói / thẻ / lấy từ gói / chiết khấu TM = total → như cũ;
  phí giao nằm trong total (orders.js:734); pay-debt nhiều lần C4 phủ.
  Đường tiền: TM / CK máy khách nay bị trần theo total + ví máy chủ tính. P1: không đụng client/, app_kh/.
  Vùng sửa: orders.js chỉ 40, 856–857, 1314; kiem_tra :495. Vượt ngân sách: bài mới 339 dòng (phiếu ~200). I8 ở Đối soát (doiSoat.js:15).
  K1 lệch nhỏ: trang_thai.md trích signup-codes.js:240–242 (thật 244–246); "orders.js:824–834" (thật 825–836); chú thích bat_bien.js:13–14
  xuống dòng lạc.
NGHIỆM THU: 6/7 · thiếu F (vế ví mẹ của I8 không ca + đột biến gỡ đúng vế; R-I8-BO-VI-ME SỐNG). A công thức thêm trần khác chữ phiếu
  (máy có ghi); B1–B7 (thiếu ví mẹ thừa 1đ); C1–C6; D1–D4; E1–E4 + thu_P24; F1–F6 thiếu vế ví mẹ; G1–G4.
CHƯA SOÁT ĐƯỢC: không chạy cong.js chay; không chạy lại --goc e403ac5; chưa đo quầy thật lẻ / thừa / thiếu 1đ; không kiểm thu_P3.js
  sau gộp; dbt.py còn trong scratchpad (ngoài kho).
BÀI HỌC: KHOÁ — mỗi số hạng của biểu thức trần / tổng (ví, ví mẹ, total, phí) một đột biến gỡ RIÊNG, ở MỖI chỗ gọi và bất biến; đột
  biến gỡ hai số hạng một lúc không là bằng chứng từng vế — nên thành phép trong dot_bien.py (liệt kê số hạng, sinh đột biến).
  NGUYÊN TẮC (K4) — câu hỏi quyết định tiền cho chủ quán liệt kê ĐỦ mọi chỗ gọi cùng lỗ; máy mở rộng phạm vi so với câu trả lời →
  câu hỏi mới hoặc nêu NỔI BẬT trong báo cáo cuối. NGUYÊN TẮC (K3) — bài học vòng trước phải soát lại trên phần vá của vòng sau.
```

### Xử lý vòng 3 (`d9b0151`) — vòng sửa thứ 3 / 3 (`so_vong_sua_toi_da`)
- Lỗi 1 — SỬA: ca B8 (POST /, ví mẹ 15.001 + TM 10.000 → 9) và D5 (/nhan-diem → 18); đột biến VS-TAO-BO-VI-ME (B8), VS-MA-THIEU-COT-VI-ME
  (D5), VS-I8-TRAN-BO-VI-ME (F1, nhờ đơn B8 / D5); VS-MA-THIEU-COT-VI tách chỉ gỡ ví thường (D4). Pay-debt nhận `{...order}` (SELECT *)
  nên vế ví mẹ ở đó chính là vế trong hàm (VS-HAM-TRAN-BO-VI-ME, A1).
- Lỗi 2 — SỬA: VS-HAM-TRAN-BO-VI (B7), VS-I8-TRAN-BO-VI (F1).
- Lỗi 3 — làm ở bước 11.4 (cổng chạy SAU lần sửa cuối).
- K1 nhỏ — SỬA: số dòng 244–246, 825–836; chú thích đầu bat_bien.js nối lại.
- Nghi ngờ "mở rộng phạm vi câu 4" — KHÔNG đổi code (đúng tinh thần (b), chỉ hạ điểm tối đa phần ±1đ, và vá ở một chỗ sẽ để hở
  pay-debt / /nhan-diem); nêu NỔI BẬT trong báo cáo cuối để chủ quán xác nhận.

## Soát độc lập — vòng 3 (agent general-purpose, 25.10; chép nguyên báo cáo, rút gọn xuống dòng)
```
KHÔNG ĐẠT (nhẹ) — logic tiền + bài thử đúng, không lỗi logic; còn 4 lỗi K1 (hồ sơ + một chú thích code) + 1 lệch vùng sửa. Hết 3 vòng
sửa; vá trần ở hàm chung (pay-debt, /nhan-diem) vẫn cần chủ quán xác nhận → vòng sau là hỏi chủ quán, không sửa code.
LỖI TÌM ĐƯỢC:
1. server/utils/diemThat.js:4 — chú thích "Trần total − ví − ví mẹ (chủ quán chốt 25.10)": chủ quán chỉ chọn câu 4 (b) với chữ "ngay ở
   dòng gọi POST /" (trang_thai.md:122); máy tự mở rộng sang pay-debt, /nhan-diem, trang_thai.md:198–199 tự ghi "chờ chủ quán xác nhận".
   Chú thích khẳng định một quyết định tiền chưa có. — K1 (chú thích là khẳng định, TU-CHAY-6)
2. trang_thai.md:139 — ghi bat_bien.js:146 (trần I8), :149–155 (diemDung); HEAD thật 145 và 148–154 (commit d9b0151 nối dòng chú thích
   13–14 làm trôi 1, số trích không kiểm lại ở commit cuối). — K1
3. ke_hoach.md:19 — vòng 3 đổi :823–834 → :825–836 trong khi ke_hoach.md:3 ghi mọi số dòng đọc ở nền 611b043; ở nền paymentSum ĐÚNG là
   823–834 → sửa số đúng thành sai. Cùng câu: :1323 không khớp nền (1321) lẫn HEAD (1324). — K1
4. trang_thai.md:132 trích orders.js:1142–1153 (HEAD: khối in mã từ :1144, chú thích luật :1146); trang_thai.md:128 trích bill hứa điểm
   orders.js:1207 (HEAD: "gap ${heSo} diem" ở :1217, :1221) — không ghi là số của nền. — K1 nhẹ
5. server/routes/orders.js:856–857 — phiếu "đổi ĐÚNG MỘT dòng gọi ở POST /", P3 sửa vùng 819–860; dòng gọi nay 2 dòng vật lý (vòng 2) →
   tăng rủi ro đụng khi gộp sau P3. Lệch vùng sửa nhẹ, các vòng trước chưa nêu.
NGHI NGỜ:
- Dữ liệu cũ: hoanVi (orders.js:1403) chỉ tính ví mẹ khi có parent_phone; tienTinhDiem (diemThat.js:11) trừ parent_balance_amount không cần
  điều kiện đó → đơn CŨ có parent_balance_amount > 0 mà parent_phone NULL thì pay-debt / /nhan-diem hạ điểm oan. Đơn mới không gặp (POST /
  chỉ lưu actualParentBalanceAmount khi có SĐT mẹ, :781–805, :922). Lịch sử git đã gộp — không truy được; chưa đo dữ liệu thật.
- I8 vs hàm với chuỗi không phải số: so(x) = Number(x||0) → NaN, hàm Number(x)||0 → 0; cash_amount lưu nguyên giá trị máy khách (:920).
  Chỉ khi máy khách gửi sai; A1 thử chuỗi số trên hàm, không đưa cùng bộ đầu vào qua I8 (KHOÁ vòng 1 mới làm một nửa).
- Gửi THIẾU 1đ trong dung sai → ít hơn luật cũ 1 điểm (từ vòng 2), chưa đo quầy thật.
KẾT QUẢ: dot_bien.py đối chứng dt 35·0, gl 113·0, 30/30 BẮT (VS-TAO-BO-VI-ME B8 → 10; VS-MA-THIEU-COT-VI-ME D5 → 19; VS-I8-TRAN-BO-VI-ME
  F1 đơn 008 = B8, 019 = D5; VS-HAM-TRAN-BO-VI, VS-TAO-BO-VI B7). Tự dựng thêm 7 (scratchpad/dbt3.py: bỏ TM ở hàm / I8, bỏ total trong
  trần hàm / I8 (dt + gl), trần +1 hàm / I8) — cả 7 BẮT. --goc 979b1b2 dt 29·6, p2223 44·0, p24 33·0, gl 113·0; --goc e403ac5 dt 11·24,
  p2223 43·1, p24 30·3, gl 106·7 — khớp bang_chung_do.txt:77–83. A2 kiểm mẫu cũ BIẾN MẤT.
  K4: 3 INSERT earn (orders.js:1062, :1340, signup-codes.js:294) đều qua tienTinhDiem (orders.js:856, :1314, signup-codes.js:229);
  loyalty.js:125 redeem; orders.js:1591 trừ SUM; I8 (bat_bien.js:145–146) cùng biểu thức với hàm (diemThat.js:10–12).
  K5: đổi cách trả (don-mo-rong.js:131–149) chặn đơn có ví, giữ tổng; Sales.jsx:665–702 gửi cash / transfer = phần còn lại sau ví, tiền
  thối ở cash_received / change_amount; bill chờ thu qua pay-debt; gói / thẻ / chiết khấu / lấy từ gói như cũ; câu 3 (c).
  Đường tiền: trần chỉ hạ điểm (ví / ví mẹ chỉ nhận khi > 0, orders.js:761, 777, 805). P1: không đụng client/. npm test PASS 71;
  --day-du PASS 75 · 0. Vùng sửa orders.js 40, 856–857, 1314; kiem_tra :495. Bài mới 347 dòng (~200). I8 ở Đối soát (doiSoat.js:15).
NGHIỆM THU: 7/7 có bằng chứng (A1–A2 · B1–B8 · C1–C6 · D1–D5 · E1–E4 + thu_P24 · F1–F6 + ca tay gl + đột biến từng vế · G1–G4).
  Mục A cần chủ quán xác nhận việc mở rộng trần.
CHƯA SOÁT ĐƯỢC: cong.js chay (cố ý, bước 11.4); thu_P3.js sau gộp; dữ liệu production (parent_balance_amount > 0 mà parent_phone NULL;
  cột lẻ / thừa / thiếu 1đ); scratchpad/dbt3.py còn (ngoài kho).
BÀI HỌC: KHOÁ — sau commit cuối, phép tự kiểm mọi trích file:dòng trong trang_thai / ke_hoach khớp HEAD (hoặc nền ghi đầu file); vòng 3
  "sửa K1" tạo K1 mới. NGUYÊN TẮC (K1) — chú thích code không ghi "chủ quán chốt" cho phần máy tự mở rộng chưa duyệt. NGUYÊN TẮC (vùng
  sửa) — "đổi ĐÚNG MỘT dòng" trong vùng việc khác đang sửa = số dòng vật lý không đổi. NGUYÊN TẮC (K5 dữ liệu cũ) — hàm chung đọc cột cũ
  thì soát phép phòng vệ đường song song đã có (như `parent_phone ?` ở hoanVi).
```

### Dừng sau vòng 3 (`so_vong_sua_toi_da` = 3 đã dùng hết) — KHÔNG sửa gì thêm; chờ chủ quán trả lời `## Câu hỏi` 5–7.
Chưa làm: bước 10 (báo cáo 7 mục), 11 (rút kinh nghiệm, `cong.js chay`, dòng `HEAD ĐÃ KIỂM`).

### Vòng sửa 4 (chủ quán cho 25.10: CHỈ hồ sơ + chú thích + gom dòng; `52e9ef9`) — trả lời câu 5 (a), 6, 7
- Câu 5 (a): giữ trần ở hàm chung. Kết quả `SELECT COUNT(*) … parent_balance_amount > 0 AND parent_phone IS NULL` chủ quán báo sau —
  chưa có thì giữ như hiện tại (chủ quán dặn).
- `diemThat.js:4–6` chú thích ghi đúng người quyết: chủ quán chốt trần ở dòng gọi POST /; đặt ở hàm chung là máy đề xuất, chủ quán giữ.
- `orders.js:856` dòng gọi POST / gom về ĐÚNG MỘT dòng vật lý (so với nền 611b043: đổi đúng dòng gọi + thêm 2 dòng require / trống ở
  vùng 39–59; pay-debt 1 dòng) — `git diff 611b043 HEAD --stat -- server/routes/orders.js`: 4 thêm · 2 bớt.
- Neo đột biến `TAO` trong `dot_bien.py` theo dòng mới; `ke_hoach.md:19` trả về số của nền (`:823–834`, `:1321`).
- K1 số dòng trong `trang_thai.md` sửa theo HEAD (ghi chú số dòng đặt trên mục soát vòng 1).
- Câu 7: chấp nhận bài thử 347 dòng.
- Không đổi logic tiền: dot_bien.py ĐỐI CHỨNG XANH (dt 35 · 0, gl 113 · 0) · TỔNG 30 · BẮT 30; npm test -- --day-du PASS 75 · FAIL 0.

## Bài học (bước 11)
Sự cố của việc (nguồn: `.tu_chay_nhat_ky.jsonl`, ba báo cáo soát, lịch sử lượt):
- Người gác chặn phiên chính: B-BIMAT-CHU ×5 (chạy `node` bài có SECRET / TOKEN trước khi commit), B-PHANTICH ×2 (`python3 … && git
  diff`), B-CHUONGTRINH ×1 (vòng `for` trong lệnh), GIT-CHECKOUT ×1 (`git checkout <sha> -- file` để dựng gốc). Agent soát: B-DICHCHU,
  SED-I, B-CD-VITRI ×3 (dọn / dựng bản sao trong scratchpad). Bộ phân loại tự chạy không trả phán quyết ~10 lần (môi trường, tạm thời).
- Lỗi agent soát bắt: vòng 1 — I8 và hàm làm tròn khác nhau; vế chưa có đột biến mang tên; ±1đ máy khách; đơn cũ nhận mã sau gộp.
  Vòng 2 — vế ví mẹ của trần mới không ca nào bắt (LẶP bài học vòng 1). Vòng 3 — số dòng trích trôi sau commit cuối; chú thích code ghi
  "chủ quán chốt" cho phần máy tự mở rộng; dòng gọi thành 2 dòng vật lý trong vùng P3.
- Phải hỏi / dừng: 3 lần (duyệt kế hoạch; câu 3–4; câu 5–7 khi hết 3 vòng sửa). Vượt ngân sách: bài mới 347 dòng (phiếu ~200) — chủ
  quán chấp nhận.

Xếp ngăn (mỗi bài một ngăn):
1. **KHOÁ** — mỗi số hạng của biểu thức tiền / điểm một đột biến gỡ RIÊNG, ở hàm + MỖI chỗ gọi + bất biến (vòng 1 rồi lặp ở vòng 2 —
   lời dặn không đủ). Ngoài Phạm vi (`tu_chay/` đóng băng) → ĐỀ XUẤT: `tu_chay/cong.js` thêm phép A2x đọc `viec/<MÃ>/dot_bien.py`, với mỗi
   dòng vá có dạng `a + b − c` / `min(…)` trong diff `server/` yêu cầu ít nhất một đột biến có neo chứa từng số hạng; ca đỏ: dot_bien.py
   của vòng 2 việc này (`979b1b2..728af71`) thiếu neo `parent_balance_amount` ở `orders.js` → phép phải báo ✗.
2. **KHOÁ** — trích `file:dòng` trong `trang_thai.md` / `ke_hoach.md` phải khớp HEAD (hoặc nền ghi đầu file); vòng 3 "sửa K1" tạo K1 mới.
   Lời dặn có sẵn (KHUON_LOI.md K1 TU-CHAY-6) vẫn lọt → ĐỀ XUẤT cho `tu_chay/cong.js` (ngoài Phạm vi): phép quét `` `<file>.js:<n>` ``
   trong hai file đó, so dòng n ở HEAD với chuỗi trích ngay sau (nếu có) — ca đỏ: `trang_thai.md` ở `575d5ee` trích `bat_bien.js:146`
   cho `const tra` (thật ở :145).
3. **KHOÁ** — bất biến "trọng tài" chép riêng công thức thì một ca đưa CÙNG bộ đầu vào biên (lẻ, chuỗi, thừa 1đ) qua cả hàm lẫn bất
   biến. Trong Phạm vi (`thu_DIEMTHAT1.js`) nhưng vòng 4 chủ quán cho CHỈ hồ sơ + chú thích → ĐỀ XUẤT việc sau: ca F7 chạy
   `tienTinhDiem` và I8 trên cùng 6 đơn tay (24.999,6 · "15000" · thừa 1đ ví · thừa 1đ ví mẹ · thiếu total · NaN), so `floor(tien/per)`
   = điểm I8 nhận; ca đỏ: bản vòng 1 trước `224d085` (I8 không Math.round).
4. **NGUYÊN TẮC** (K4, đề xuất thêm vào `KHUON_LOI.md` — ngoài Phạm vi): "Đổi nguồn của một số tiền từ giá trị máy chủ tính sang trường
   máy khách gửi (dù có phép kiểm tổng) → soát lại dung sai của phép kiểm đó. Đã gây: DIEM-THAT-1 điểm lấy cash_amount, paymentSum cho
   ±1đ → +1 điểm / đơn."
5. **NGUYÊN TẮC** (K1, đề xuất `KHUON_LOI.md`): "Câu hỏi quyết định tiền cho chủ quán liệt kê ĐỦ mọi chỗ gọi cùng lỗ; máy mở rộng so
   với câu trả lời → hỏi lại hoặc nêu NỔI BẬT; chú thích code không ghi 'chủ quán chốt' cho phần máy đề xuất. Đã gây: DIEM-THAT-1 câu 4
   chỉ nói dòng gọi POST /, trần đặt ở hàm chung, chú thích diemThat.js ghi 'chủ quán chốt'."
6. **NGUYÊN TẮC** (vùng sửa, đề xuất ghi cạnh luật "Vùng sửa của file chung" trong mẫu phiếu): "'đổi ĐÚNG MỘT dòng' trong vùng việc khác
   đang sửa = số dòng vật lý không đổi."
7. **BỎ** — B-BIMAT-CHU ×5: luật skill đã ghi "commit trước rồi chạy"; máy quên, không phải lỗ luật (một khuôn, đã có lời dặn + người gác chặn đúng).
8. **BỎ** — GIT-CHECKOUT / B-PHANTICH / B-CHUONGTRINH: mỗi lần một, cách làm đúng đã có (git show qua script, lệnh đứng một mình).
9. **BỎ** — bộ phân loại không phán quyết: lỗi môi trường tạm thời, không do code.
Dọn: không đề xuất xoá lời dặn nào (KHOÁ 1–2 chưa làm nên lời dặn K1 TU-CHAY-6 / K3 TU-CHAY-5 còn cần).

## Báo cáo 7 mục
```
VIỆC:        DIEM-THAT-1 — Điểm thưởng chỉ tính trên tiền khách trả thật
ĐÃ SỬA:      server/utils/diemThat.js:10–14 — MỚI: tienTinhDiem = max(0, round(min(TM + CK, total − ví − ví mẹ) − phí giao))
             server/routes/orders.js:40 — require; :856 — POST / gọi tinhDiemDon(tienTinhDiem({…, total, ví, ví mẹ})); :1313 — pay-debt
               tienTinhDiem({...order, [cotTien]: cột + paidAmount})
             server/routes/signup-codes.js:25 — require; :54 — kiemDonCuaMa đọc thêm 5 cột tiền; :229 — diemGoc = floor(tienTinhDiem(don)/per)
             cong_cu/gia_lap/bat_bien.js:24 — DIEM_THAT_TU '2026-10-27' (TẠM, chat sửa = ngày gộp + 1); :145–146 — I8 công thức riêng cùng
               trần + làm tròn; :148–154 — diemDung(luatCu, goc); :159–161 — đơn trước mốc ở Đối soát thật nhận luật cũ (gCu)
             cong_cu/gia_lap/kich_ban.js — KB5a ví 10.000 + TM 15.000; KB31 nợ có TM 10.000 (M15 bắt được)
             kiem_tra_truoc_khi_giao.js:495 — thêm cong_cu/thu_DIEMTHAT1.js cuối mảng
BÀI THỬ:     thu_DIEMTHAT1.js (mới) trên gốc e403ac5 → ĐỎ 11 đạt · 24 hỏng (A1 A2 B1–B5 B7 B8 C2–C6 D1–D5 E3 F2–F5); sau vá → XANH 35 · 0.
             Bài cũ sửa: thu_P2223 ĐỎ 43·1 → 44·0 · thu_P24 30·3 → 33·0 · thu_P20 170·1 → 171·0 · thu_gia_lap 173·6 (đủ) / 106·7 (tay)
             → 180·0. Ca mới vòng 2–3 đỏ trên 979b1b2 (trước trần): A1 B7 B8 C6 D4 D5. Đột biến dot_bien.py: 30/30 BẮT, đối chứng xanh.
             npm test -- --day-du PASS 75 · FAIL 0 (cảnh báo "route GET có lệnh ghi (3)" có từ trước).
ĐÃ RÀ K4:    grep "INSERT INTO pos_point_transactions" + 'earn' trong server/ → 3 chỗ (orders.js:1063, :1340, signup-codes.js:296), cả 3 đi
             qua tienTinhDiem; grep "tinhDiemDon(" → 1 định nghĩa + 2 chỗ gọi, cả 2 đã đổi; grep "loyalty_earn_per_amount" server/ →
             orders.js tinhDiemDon + signup-codes.js /nhan-diem + database.js (mặc định) — đã xử lý hết; I8 cùng biểu thức với hàm.
             Chưa xử lý (đã duyệt để sau): lời hứa điểm trên bill orders.js:1209 (HD-1 / P15); chú thích doiSoat.js:257.
CHƯA KIỂM:   - Dữ liệu production: đơn cũ parent_balance_amount > 0 mà parent_phone NULL (trần hạ điểm oan khi thu nợ / nhận mã) — chờ
               chủ quán chạy SELECT trên Turso. Cột tiền lẻ / thừa / THIẾU 1đ trên quầy thật (thiếu 1đ → ít hơn luật cũ 1 điểm) — chưa đo.
             - Đơn bán trước gộp nhận mã sau gộp (câu 3 (c)): Đối soát thật sẽ báo lệch đơn đó — chưa dựng ca, chat xử tay.
             - thu_P3.js sau khi gộp P3 (chat sửa trong script gộp). Mốc DIEM_THAT_TU '2026-10-27' là TẠM.
             - Đột biến tương đương Math.max(0, …) (tinhDiemDon / /nhan-diem đã chặn điểm ≤ 0) — không ca nào phân biệt được.
             - I8 với chuỗi không phải số trong cột tiền: so() ra NaN, hàm ra 0 — chưa có ca (đề xuất KHOÁ 3).
             - Giao diện: không đổi (không đụng client/); không có thao tác thử tay.
GIT:         xem dòng "GIT (lần kiểm cuối)" ngay dưới + HEAD ĐÃ KIỂM ở cuối file.
BÀI HỌC:     KHOÁ 3 (đều ngoài Phạm vi / ngoài phép vòng 4 → đề xuất) · NGUYÊN TẮC 3 (đề xuất KHUON_LOI.md / mẫu phiếu) · BỎ 3 —
             chi tiết ở ## Bài học.
```
Nghiệm thu — đếm từng mục:
- A — `diemThat.js:10–14` một hàm; A1 (giá trị biên + trần + thiếu total), A2 (mẫu total cũ biến mất, 1 định nghĩa, 1 công thức, 3 chỗ gọi).
- B — B1 ví trọn 0 · B2 ví + TM 15 · B3 phí giao 25 · B4 ví mẹ + CK 15 · B5 phí > tiền 0 · B6 phí âm 25 · B7 / B8 thừa 1đ (trần).
- C — C1 TM lúc tạo + thu 25 · C2 ví + nợ 15 · C3 phí giao 25 · C4 hai lần thu 15 · C5 hai người cùng bấm 200 + 409, 1 earn · C6 thừa 1đ.
- D — D1 khách lẻ phí giao 50 · D2 bù theo tiền thật 30 · D3 ví trọn 400, mã chưa tiêu · D4 / D5 thừa 1đ; thu_P20 "trả trọn bằng ví".
- E — E1 Flash 0 · E2 nợ chưa thu 0 · E3 huỷ trừ −15 · E4 Flash /nhan-diem 400; thu_P24 A4 / A4b / G1 / I2 (huỷ / xoá / hoàn).
- F — F1 I8 0 lệch · F2 đúng mốc lệch · F3 trước mốc Đối soát thật tha · F4 giả lập lệch · F5 phí giao · F6 luật cũ-cũ; thu_gia_lap 7 ca
  I8 tay; mỗi vế một đột biến (phí, CK, làm tròn, trần, ví, ví mẹ, mốc, ctx.thuc, `cu`, vế luật cũ, gCu cũ-cũ) — 30/30 BẮT.
- G — G1 TM 25 · G2 CK 20 · G3 nợ thu đủ 25 · G4 khách lẻ mã 50 — như luật cũ.
7/7 mục có bằng chứng.
