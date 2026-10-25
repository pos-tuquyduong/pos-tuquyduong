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
- Lỗi 1 — SỬA: `bat_bien.js:145` thêm `Math.round` (cùng biểu thức với `tienTinhDiem`); `thu_gia_lap.js` thêm ca "I8 sạch (DIEM-THAT-1): tiền
  mặt lẻ 24.999,6 − phí giao 5.000 → 2 điểm"; đột biến `VS-I8-BO-LAM-TRON` đưa ĐÚNG lỗi cũ trở lại → BẮT.
- Vế chưa có đột biến mang tên — SỬA: thêm `VS-I8-BO-CK`, `VS-I8-MOC-THAT-BO-HUYCU` (BẮT).
- Lỗi 2 và nghi ngờ ±1đ — quyết định điểm → `## Câu hỏi` 3, 4. DỪNG chờ chủ quán (luật cứng /lam-viec).
- K1 nhỏ (chú thích ke_hoach mục 1 "ĐÚNG phần đã thu", tham số `g` che biến, chỗ đặt dòng require): để vòng sửa sau cùng câu trả lời.

## Câu hỏi
(Hai câu hỏi lượt trước đã được chủ quán trả lời trong phiếu, mục "Đã duyệt" 2 và 3.)
1. ~~`cong_cu/thu_P20.js` ngoài Phạm vi~~ — đã thêm vào Phạm vi; đã sửa như đề xuất.
2. ~~Bill hứa điểm cho đơn 0 điểm thật~~ — chọn (a): để nguyên, chat ghi cho HD-1 / P15.
3. **Đơn bán TRƯỚC khi gộp, nhận mã điểm SAU khi gộp (soát vòng 1 lỗi 2).** Khung thời gian: chỉ trong hạn mã (`nhandiem_han_gio`,
   mặc định 24 giờ) sau lúc gộp. Ví dụ đơn ví 10.000 + tiền mặt 15.000, lúc bán được 25 điểm (luật cũ, total); sau gộp `/nhan-diem`
   tính gốc 15 → bù round(15 × (k − 1)) = 15 → tổng 40 (`signup-codes.js:240–242`), không khớp luật nào → Đối soát thật báo lệch đơn đó.
   Chủ quán chọn:
   - (a) Để nguyên code; I8 ở Đối soát thật tha thêm tổng `gCu + round(g × (k − 1))` cho đơn tạo trước `DIEM_THAT_TU` (~2 dòng
     `bat_bien.js` + 1 ca + 1 đột biến). Khách nhận 40 (lẫn hai luật) cho các đơn đó.
   - (b) `/nhan-diem` tính phần bù = round(gốc × k) − tổng earn đã có của đơn (thay vì round(gốc × (k − 1))): khách nhận đúng luật mới
     (30); đơn có earn cũ lớn hơn thì 0 bù (400 `KHONG_THEM_DIEM`). Đổi đường cộng điểm (~3 dòng `signup-codes.js` + ca + đột biến).
   - (c) Để nguyên cả hai; chat xử tay các đơn đó ở Đối soát (dự kiến rất ít — chỉ đơn trộn ví / phí giao, nhận mã trong 24 giờ đầu).
   Máy đề xuất (c) nếu muốn ít đụng nhất, (b) nếu muốn đúng luật mới tuyệt đối. Máy KHÔNG tự chọn.
4. **Dung sai ±1đ (soát vòng 1 nghi ngờ P4).** Điểm POST / nay lấy từ `cash_amount` / `transfer_amount` máy khách gửi; phép kiểm tổng
   cho lệch ±1đ (`orders.js:824–834`) → tối đa +1 điểm / đơn khi total ≡ per − 1 (mod per). Chủ quán chọn: (a) chấp nhận (±1đ có từ
   trước, chỉ ảnh hưởng điểm); (b) trần `min(cash + CK, total − ví − ví mẹ)` ngay ở dòng gọi POST / (vẫn MỘT dòng, trong vùng sửa)
   + 1 ca + 1 đột biến. Máy đề xuất (b) — rẻ, khoá bằng code (C16).

## Phát hiện
- `server/utils/doiSoat.js:257` chú thích "chủ quán chốt giữ floor(total/per)" cho D2 sẽ cũ sau việc này (I8 tính theo tiền thật).
  `server/utils/**` bị cấm → không sửa; việc sau sửa chú thích.
- Lời hứa "gấp k điểm" trên bill (`orders.js:1207`) vẫn in cho đơn trả trọn bằng tài khoản (0 điểm thật) → khách nhập mã bị 400
  `DON_KHONG_DU_DIEM` (thu_DIEMTHAT1 D3, thu_P20 "trả trọn bằng ví"). Chủ quán đã chọn để HD-1 / P15.
