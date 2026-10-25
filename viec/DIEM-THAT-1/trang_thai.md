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
BV-I8, BV-I8-tay, VS-I8-BO-PHI, VS-I8-BO-MOC, VS-I8-MOC-GIA-LAP, BV-I8-VE-LUAT-CU, VS-I8-CU-CU-GMOI.

## Câu hỏi
(Hai câu hỏi lượt trước đã được chủ quán trả lời trong phiếu, mục "Đã duyệt" 2 và 3.)
1. ~~`cong_cu/thu_P20.js` ngoài Phạm vi~~ — đã thêm vào Phạm vi; đã sửa như đề xuất.
2. ~~Bill hứa điểm cho đơn 0 điểm thật~~ — chọn (a): để nguyên, chat ghi cho HD-1 / P15.

## Phát hiện
- `server/utils/doiSoat.js:257` chú thích "chủ quán chốt giữ floor(total/per)" cho D2 sẽ cũ sau việc này (I8 tính theo tiền thật).
  `server/utils/**` bị cấm → không sửa; việc sau sửa chú thích.
- Lời hứa "gấp k điểm" trên bill (`orders.js:1207`) vẫn in cho đơn trả trọn bằng tài khoản (0 điểm thật) → khách nhập mã bị 400
  `DON_KHONG_DU_DIEM` (thu_DIEMTHAT1 D3, thu_P20 "trả trọn bằng ví"). Chủ quán đã chọn để HD-1 / P15.
