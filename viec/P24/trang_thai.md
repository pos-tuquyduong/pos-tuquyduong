# P24 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Nhánh: `viec/P24` · cây sạch · `git fetch origin viec/P24` xong.
- HEAD `4c6e0ce` · FETCH_HEAD `4c6e0ce` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  4c6e0ce PHIEU: P24
  99f5894 TIEN-DO: P22-23 (c4fabcd), KH-QUAY-1 (168b481), P15-QR (423624b), KH-UI-1 (bd9b920) xong; DAC_TA_BAN_HANG_2410 + demo; mo QUAY-AN-1 + P24 + P3; them DIEM-THAT-1, UUDAI-1, TOPPING-1, BH-1, HD-1, KH-MUA-1, KH-UI-2; P13a-e + P14 gop; DON-DEP-v1 -> DONDEP-v1; lich — so v39
  bd9b920 Merge pull request #41 from pos-tuquyduong/viec/KH-UI-1
  ```

## Tiến độ
- Bước 2 (đọc) xong · Bước 3 kế hoạch `ke_hoach.md` xong, agent phụ đã soát (4 câu) và đã đưa vào kế hoạch.
- Dừng chờ duyệt kế hoạch → chủ quán duyệt 24.10 (`bdc530a`, phiếu mục "Đã duyệt": G-a, E-a, D có + signup-codes.js, rollback).

## Làm tiếp (`/lam-viec P24 tiep`)
- Đối chiếu: nhánh `viec/P24`, cây sạch; HEAD `bdc530a` · FETCH_HEAD `bdc530a` (hook mở phiên đã kéo `4bf6b9f → bdc530a`).
  ```
  bdc530a PHIEU: P24 duyet ke hoach 24.10 (G-a, E-a, D co + signup-codes.js, rollback khi loi ghi)
  4bf6b9f P24: ke hoach + trang thai — cho chu quan duyet
  4c6e0ce PHIEU: P24
  ```
- Bước 4: `cong_cu/thu_P24.js` đỏ trên gốc (11 đạt · 22 hỏng) — `bang_chung_do.txt`.
- Bước 5: vá `orders.js` (`truDiemDon` + 2 chỗ gọi), `signup-codes.js` (câu chiếm mã + `baoChiemHong`), `bat_bien.js` (I8),
  `kich_ban.js` (KB5), bài cũ `thu_P2223.js` F3, `thu_gia_lap.js` (+8 ca I8), `thu_DOISOAT1.js` F3/F3c, `kiem_tra_truoc_khi_giao.js`.
- Bước 6: `npm test` PASS 70 · `--day-du` PASS 74 · FAIL 0 (cảnh báo GET-ghi có sẵn).

## Chỗ vá → đột biến (`viec/P24/dot_bien.py`, 21/21 BẮT sau vòng 1, đối chứng xanh)
| Chỗ vá | Đột biến |
|---|---|
| `orders.js` gọi `truDiemDon` trong huỷ | BV-xoa-cau-tru-huy · VS-try-catch · VS-tru-sau-commit |
| `orders.js` gọi `truDiemDon` trong xoá | BV-xoa-cau-tru-xoa |
| `orders.js` câu `INSERT … SELECT` của `truDiemDon` | VS-tru-duong · VS-tru-sdt-cua-don · VS-bo-not-exists · VS-bo-han · VS-gom-theo-sdt · VS-gom-tung-dong |
| `signup-codes.js` câu chiếm mã `AND EXISTS … 'completed'` | BV-nhan-diem-bo-exists |
| `signup-codes.js` `baoChiemHong(…, dong)` | VS-bao-chiem-hong-cu |
| `bat_bien.js` I8 đơn huỷ = 0 | BV-I8-huy |
| `bat_bien.js` mốc `HUY_TRU_DIEM_TU` | VS-I8-moc-ca-gia-lap · VS-I8-moc-nguoc · VS-I8-tha-don-huy-tao-truoc-moc |
| `bat_bien.js` `adjust` gắn đơn không "lạ" | BV-I8-adjust-la · VS-I8-adjust-moi-dong |
| (vòng 1) `orders.js` gọi `truDiemDon` trong xoá — bọc nuốt lỗi | VS-try-catch-xoa |
| (vòng 1) `bat_bien.js` ngày gộp nhận tổng 0 · NULL cancelled_at | VS-I8-ngay-gop-chi-luat-cu · VS-I8-huy-null-sau-moc |

## Câu hỏi
Đã chốt (chủ quán 24.10, `bdc530a`, phiếu mục "Đã duyệt"): G-a (xoá trừ như huỷ, hàm chung `truDiemDon`) · E-a (dòng trừ chép hạn) · D có
(thêm `signup-codes.js` vào Phạm vi) · lỗi ghi dòng trừ → rollback cả lệnh · mốc `HUY_TRU_DIEM_TU = '2026-10-25'` tạm, chat sửa lúc duyệt PR.
Không còn câu hỏi mở.

## Phát hiện (ngoài phạm vi, không sửa)
- `server/utils/doiSoat.js:118` `tongHop`: "điểm trừ" cộng mọi dòng âm → dòng trừ do huỷ đơn lẫn với đổi quà trong tổng Đối soát.
- Hoàn tiền trọn (`refunds.js:158`) và hoàn một phần (báo hỏng, `damages.js`) đều GIỮ điểm của đơn — để việc sau (NT-I).
  Bài thử khoá hành vi hiện tại: `thu_P24.js` I2, I3. `thu_DOISOAT1.js` F3/F3c đổi số mong đợi theo hành vi `tongHop` hiện có
  (điểm trừ tháng = 300 do huỷ đơn mua gói + đổi quà) — khi việc sau tách loại trừ thì sửa lại hai ca này.
- Dữ liệu Turso thật có đơn huỷ `cancelled_at` NULL không: máy không xem được; I8 coi NULL là huỷ cũ (trước mốc) ở Đối soát thật.

## Soát độc lập `/ra-soat` — vòng 1 (HEAD `1b46bfe`)
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
- cong_cu/gia_lap/bat_bien.js:149–152 — Đối soát thật báo lệch oan cho đơn huỷ TRONG ngày gộp (trước mốc HUY_TRU_DIEM_TU nhưng đã chạy
  bản vá → tổng điểm 0): nhánh huyCu chỉ nhận luật cũ "giữ điểm". Khuôn DIEM_KHI_THU_TU nhận cả hai luật trước mốc. Thử bằng node -e:
  đơn huỷ '2026-10-24T20:00:00', điểm 0, {thuc:true} → ["đơn X1: 0 điểm, đúng luật là 25"]. — K3 (thiếu ca dưới mốc) / K5 (chặn nhầm dữ liệu thật).
- viec/P24/trang_thai.md — thiếu kết quả `node tu_chay/cong.js chay` (LUAT_XAY_APP 6.3). — K6
- viec/P24/trang_thai.md "## Câu hỏi" — còn ghi 5 câu dạng "đề xuất" dù chủ quán đã chốt ở bdc530a. — K1
- ke_hoach.md 2.3 — đề xuất `AND status='completed' AND payment_status='paid'`, code (signup-codes.js:284) bỏ payment_status, không ghi lại
  (không gây lỗi: chỉ pay-debt đổi payment_status, theo chiều sang 'paid'). — K1 nhẹ
- ke_hoach.md bảng 3 B2 ghi "xanh cả gốc" nhưng bang_chung_do.txt ghi B2 ĐỎ trên gốc. — K1 nhẹ
NGHI NGỜ:
- Đơn huỷ cancelled_at NULL (dữ liệu cũ): String(null)='null' > mốc → bị coi là huỷ SAU mốc → Đối soát thật báo lệch. Code hiện luôn ghi
  cancelled_at (orders.js:1446); không kiểm được dữ liệu Turso.
- HAVING SUM(points) <> 0 (orders.js:1594) gần như code chết — earn luôn > 0; không đột biến nào chạm.
- VS-tru-sdt-cua-don bị bắt nhờ sập (NOT NULL → 500), không nhờ so SĐT.
- DELETE thiếu đột biến VS-try-catch (chỉ BV-xoa-cau-tru-xoa); LUAT 6.2 đòi VS- + BV- mỗi chỗ vá.
- NT-B phía quầy chỉ có căn cứ đọc code (customers-v2.js:217, Customers.jsx:494–495); B1 chỉ gọi /loyalty/points, /api/kh/diem dùng chung
  layDiemKhach (kh/index.js:99) nhưng không gọi thẳng.
- Ngân sách: thu_P24.js 410 dòng, phiếu ~200, không ghi giải thích.
K3: --goc fe433ff → thu_P24 11·22 (thoát 1), thu_gia_lap 94·6; HEAD 33·0; đột biến 18/18 BẮT, 0 LẠC. Bài kiểm hành vi thật, marker suông không xanh được.
K4: ghi earn 3 chỗ (orders.js:1061, :1338, signup-codes.js:295) — truDiemDon phủ cả ba; rời 'completed' 3 chỗ — huỷ, xoá (đã vá), refunds.js:158
  (để lại theo phiếu); đọc pos_point_transactions 9 chỗ — ổn với số âm; chưa xử lý: doiSoat.js:118 (phiếu ghi việc sau) + lỗi I8 trên.
K5: EXISTS … 'completed' ở câu chiếm mã chỉ tác dụng khi có lệnh chen (kiemDonCuaMa đã đòi completed + paid); D3 khoá luồng hợp lệ. Huỷ/xoá
  chỉ ném khi DB lỗi; C1–C3, G3, B1, I1a–c, G2 phủ. Chặn oan duy nhất: Đối soát (lỗi 1).
Đường tiền: không tin client — truDiemDon lấy số, SĐT, hạn từ DB; nguoi từ token. P1: không đụng client/ app_kh/.
NGHIỆM THU: 9/9 mục có ca thử; H có lỗi (thiếu ca "huỷ trước mốc đã trừ → sạch") nên chưa đạt.
CHƯA SOÁT ĐƯỢC: dữ liệu Turso thật; --day-du và cong.js; thử tay giao diện số âm; không chạy lại toàn bộ thu_gia_lap / thu_DOISOAT1.
BÀI HỌC: KHOÁ — mốc chuyển luật trong bất biến phải có ca "trước mốc, dữ liệu theo luật MỚI → sạch" cạnh ca "trước mốc, luật cũ → sạch",
  kèm đột biến bỏ vế tha luật mới. NGUYÊN TẮC (K3/K5) — mốc "ngày gộp + 1": dữ liệu trước mốc có thể theo một trong hai luật, phép tha
  phải nhận cả hai. KHOÁ nhẹ — bước báo xong đòi dòng cong.js trong trang_thai.md và đổi "## Câu hỏi" thành "đã chốt" sau khi duyệt.
```

### Sửa sau vòng 1
- `bat_bien.js` I8: nhánh huỷ trước mốc nhận CẢ "giữ điểm" lẫn tổng 0; `cancelled_at` NULL = huỷ cũ (7b8c91d).
- `thu_gia_lap.js` +3 ca: ngày gộp đã trừ → sạch; NULL cancelled_at → sạch; trước mốc trừ thiếu −4 → lệch (a476f29).
- `orders.js` bỏ `HAVING` (earn luôn > 0, code chết) (2d4268a).
- `dot_bien.py` +3: VS-try-catch-xoa, VS-I8-ngay-gop-chi-luat-cu, VS-I8-huy-null-sau-moc → 21/21 BẮT (f3b913b).
- `ke_hoach.md`: ghi rõ bỏ vế payment_status (2.3), sửa dòng B2, ngân sách thực tế + lý do thu_P24 dài. `## Câu hỏi` → đã chốt.
- Không sửa: VS-tru-sdt-cua-don (vẫn BẮT đúng ca A3 — đơn khách lẻ là đúng chỗ so SĐT phải khác SĐT đơn); NT-B phía quầy / App KH: cùng
  hàm `layDiemKhach`, ghi ở CHƯA KIỂM.
