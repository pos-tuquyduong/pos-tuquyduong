# P22-23 — trạng thái

## Đối chiếu bản chụp (bước 1)
- Lượt lập kế hoạch: nhánh `viec/P22-23`; cây sạch; HEAD `97324a8` = FETCH_HEAD `97324a8` (bằng nhau, không kéo).
- Lượt làm tiếp (`/lam-viec P22-23 tiep`, 22.10): hook mở phiên kéo `97324a8 → c115944`; `git fetch origin viec/P22-23` → HEAD `c115944`
  = FETCH_HEAD `c115944` (bằng nhau, không kéo). `git log --oneline -3`:
  ```
  c115944 PHIEU: P22-23 duyet ke hoach 22.10 (them thu_GOI1.js, chan gia han ghi no, vung tinhDiemDon)
  af4573f P22-23: ke hoach sua sau soat doc lap + 2 cau hoi
  ecb8f72 P22-23: ke hoach + trang thai (cho chu quan duyet)
  ```

## Bước hiện tại
Bước 4–8 xong; soát vòng 1 KHÔNG ĐẠT → sửa (vòng sửa 1/3) → soát vòng 2. Sau đó `--day-du` một lần, cổng, báo cáo.

## Câu hỏi
Không còn. Hai câu của lượt kế hoạch đã được chủ quán trả lời trong phiếu (mục "Đã duyệt" 1, 2) — làm đúng như duyệt.

## Đã sửa (code chạy thật)
| Chỗ | Việc |
|---|---|
| `server/routes/orders.js` hàm `tinhDiemDon` (đầu file, dưới `soNguyenDuong`) | MỘT công thức điểm + hạn quý, đọc cài đặt LÚC GỌI; dùng ở POST / và pay-debt |
| `orders.js` POST / cổng sau `SL_KHONG_HOP_LE` | `(package_buy \|\| membership_buy) && debt_amount > 0` → 400 `GOI_THE_CHUA_THU_DU` (cùng vị từ quyết `finalPaymentStatus`) |
| `orders.js` khối LOY-1 | chỉ `phone && finalPaymentStatus === 'paid' && !flashApplied` mới tính điểm; câu INSERT `earn` lúc tạo giữ nguyên chữ |
| `orders.js` chỗ in mã bill | hệ số lấy từ `docCauHinhNhanDiem()` (bỏ `\|\| 2` riêng); bỏ khoá `nhandiem_he_so` khỏi câu đọc |
| `orders.js` pay-debt | tính điểm NGOÀI giao dịch khi thu thành `paid`, có SĐT, không Flash; ghi `INSERT … SELECT … WHERE NOT EXISTS (earn của đơn)` TRONG giao dịch, ngay sau UPDATE đạt `changes === 1`, bọc try/catch (khuôn LOY-1). Câu UPDATE + `changes !== 1` giữ nguyên chữ |
| `server/routes/signup-codes.js` `kiemDonCuaMa` | đọc thêm cột `flash_discount` (chỉ đọc) |
| `signup-codes.js` `nhanDiemMaBill` | đơn Flash → 400 `DON_FLASH_KHONG_DIEM`, TRƯỚC câu chiếm mã (mã không bị tiêu) |
| `signup-codes.js` cuối file | export `docCauHinhNhanDiem` |
| `cong_cu/gia_lap/bat_bien.js` | hằng `DIEM_KHI_THU_TU = '2026-10-24'` (TẠM — chat sửa đúng ngày gộp + 1 lúc duyệt PR); I8 thêm vế thu đủ + Flash nhận mã → 0; `ctx.thuc` + đơn trước mốc khớp luật cũ cũng đạt; ghi chú đầu file theo luật mới; export hằng mốc |

## Bài thử cũ đã đổi — từng chỗ + lý do (KHÔNG vào "Bài thử cũ sửa": cố ý đổi hành vi, mỗi bài có ca mới ĐỎ trên gốc)
- `thu_P26c.js` L6a: luồng mua gói còn nợ nay bị cổng D chặn → dựng đơn nợ CŨ bằng mua trả đủ + `UPDATE pos_orders` (dữ liệu cũ trên
  production còn có thể có) — vẫn canh `soTienHoan` trừ nợ. Thêm L6b: cùng yêu cầu qua API → 400 `GOI_THE_CHUA_THU_DU`.
- `thu_DOISOAT1.js` D2d: "đơn thẻ còn nợ: điểm theo total" (hành vi cũ) → mua thẻ ghi nợ 400, không thêm đơn, Đối soát vẫn XANH.
- `thu_GOI1.js` B3n (phiếu Đã duyệt 1): mua gói trả đủ rồi `UPDATE` về dạng nợ cũ — vẫn canh `DON_CON_NO`. Thêm B3n0: mua gói ghi nợ → 400.
- `thu_gia_lap.js`: bảng `pos_orders` tay của KHUNG.I8 thêm `payment_status`, `created_at` (KHUNG.I12 = slice nhận theo, không INSERT
  theo vị trí); 8 ca I8 mới (sạch / đơn nợ có điểm / đơn thu đủ thiếu điểm / Flash nhận mã có điểm / Đối soát thật trước mốc tha /
  đúng mốc bắt / trước mốc sai cả luật cũ bắt / giả lập trước mốc bắt); đột biến giả lập M14 (pay-debt bỏ điểm → KB4 → I8), M15 (tạo đơn
  cộng điểm cả đơn chưa thu → KB31 → I8); chú thích đầu "13 đột biến" → "15".
- `kiem_tra_truoc_khi_giao.js`: chỉ thêm `cong_cu/thu_P2223.js` vào mảng bài chạy thật.
- `thu_KH1.js`, `thu_P20.js`, `kich_ban.js`: không đổi (chạy xanh: 156 / 170 ca; giả lập 32 KB ĐẠT trên bản vá).

## Chỗ vá → đột biến (`viec/P22-23/dot_bien.py`, 22.10 sau soát vòng 1: ĐỐI CHỨNG xanh — p2223 40/0, gl 92/0; TỔNG 21 · BẮT 21 · SỐNG 0 · HỎNG 0 · LẠC 0)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| cổng D | `BV-cong-goi-the` · `VS-cong-chi-goi` · `VS-cong-tin-may-khach` | D1 · D2 · D3b |
| LOY-1 điều kiện thu đủ | `BV-diem-tao-bo-dk-thu` · `VS-diem-tao-tin-may-khach` | B1 · B4 |
| pay-debt điểm | `BV-pay-debt-diem` · `VS-pay-debt-ca-partial` · `VS-pay-debt-bo-flash` · `VS-pay-debt-khong-boc` · `VS-pay-debt-bo-not-exists` · `VS-pay-debt-diem-ngoai-tx` | C1 · C2 · C3 · C4 · C5 · C1 (xem ghi chú) |
| /nhan-diem Flash | `BV-nhan-diem-flash` · `VS-nhan-diem-flash-khong-doc-cot` | E1 · E1 |
| hệ số bill | `VS-he-so-bill-cu` | E2 |
| bill đơn Flash không hứa điểm (vòng 1) | `BV-bill-flash-hua-diem` | E1c |
| hạn điểm theo giờ thu (vòng 1) | `VS-pay-debt-han-gio-tao` | C1 |
| I8 | `BV-I8-dk-thu` · `VS-I8-moc-ca-gia-lap` · `VS-I8-moc-nguoc` · `VS-I8-flash-nhan-ma` · `VS-I8-tha-moi-don-truoc-moc` | F1 · F2 · F2 · I8 Flash nhận mã (gl) · I8 trước mốc sai cả luật cũ (gl) |

Ghi chú `VS-pay-debt-diem-ngoai-tx` (ghi điểm bằng `run` ngoài giao dịch): kho libsql cục bộ khoá bận câu ghi ngoài giao dịch khi giao
dịch đang mở → try/catch nuốt → 0 điểm → C1 bắt (mẫu `✗ C[18]`). C8 (rollback trọn khi câu ghi SAU câu điểm lỗi) chưa tự bắt riêng
đột biến này trên kho cục bộ — xem mục CHƯA KIỂM bên dưới.
Đột biến kế hoạch dự kiến `VS-pay-debt-cai-dat-luc-tao` KHÔNG dựng: code không lưu cài đặt lúc tạo đơn ở đâu để "dùng nhầm" — C1 (per đổi
1.000 → 2.000 giữa tạo và thu) + C9 (bật điểm giữa tạo và thu) canh trực tiếp hành vi "cài đặt lúc thu".

## Ngân sách
orders.js +59 / −33 (phiếu ≤ ~80 dòng đổi — vượt ~12: 25 dòng khối LOY-1 cũ chuyển vào `tinhDiemDon` tính cả hai phía, phần lớn là chú
thích luật); signup-codes.js +6 −1; bat_bien.js +25 −11 (+ thu_gia_lap +23 −3 — tổng bất biến + kịch bản ≈ 60); thu_P2223.js 427 dòng
(phiếu ~250 — thêm C8, C9, D3c, D4b, F2, F3, G2b theo soát kế hoạch + phép "không ghi gì" 9 bảng).

## CHƯA KIỂM
- Ghi điểm ở pay-debt "cùng giao dịch": trên libsql cục bộ, đột biến ghi ngoài giao dịch bị bắt nhờ kho khoá bận (C1), không phải nhờ C8.
  Trên Turso câu ghi ngoài giao dịch có thể chạy được — chưa có phép tất định cho riêng vế này.
- try/catch quanh câu ghi điểm TRONG giao dịch (pay-debt mới, LOY-1 cũ): bài thử ném lỗi giả trước khi câu tới kho; lỗi SQL thật giữa giao
  dịch trên Turso/Hrana có làm hỏng giao dịch (kéo theo lần thu) hay không — chưa kiểm.
- Dữ liệu production: số đơn chưa thu đã có `earn`, đơn mua gói / thẻ còn nợ cũ — máy không đọc Turso.
- Mốc `DIEM_KHI_THU_TU = '2026-10-24'` là TẠM: gộp sau 23.10 mà không sửa thì Đối soát thật đỏ oan đơn ghi nợ tạo bằng code cũ trong
  khoảng [24.10, ngày gộp). Lưu ý lúc duyệt PR: I8 có hai mốc ở hai file — `AP_DUNG_TU.I8` (doiSoat.js, giữ '2026-10-03') và hằng này.
- Màn Bán hàng: giỏ có gói / thẻ chọn ghi nợ / chờ thu nay nhận lời lỗi máy chủ; bill đơn Flash không còn dòng "Ma nhan diem" — thử tay sau gộp.

## Soát độc lập vòng 1 (agent, 22.10) — báo cáo nguyên văn
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. server/routes/orders.js:1201-1218 — Bill đơn giảm Flash vẫn in "gap ${heSo} diem" khi nhandiem bật, trong khi /nhan-diem
   (signup-codes.js:204-206) nay từ chối mọi đơn Flash → lời hứa sai trên giấy. Không ca nào kiểm chữ bill đơn Flash. — K4.
   Gọn: `batDiem` thêm `&& !flashApplied` (cùng vị từ :854) + ca + đột biến.
2. cong_cu/thu_P2223.js:197-199 — Ca C1 tên "hạn quý theo giờ thu" nhưng so `hanQuy(d1.created_at)` (giờ TẠO); tạo + thu cùng quý nên
   đột biến `tinhDiemDon(order.total, order.created_at)` SỐNG. — K3.
3. viec/P22-23/trang_thai.md:56 — "xem CHƯA KIỂM" trỏ tới mục không tồn tại. — K1 / mẫu báo cáo §7.
4. server/routes/orders.js:1334-1344 — ke_hoach.md:53 hứa "changes === 0 → log 'đã có điểm'"; code không đọc changes, không log. — K1, nhẹ.
NGHI NGỜ: VS-pay-debt-diem-ngoai-tx bắt nhờ khoá bận của libsql cục bộ; try/catch trong giao dịch chưa kiểm lỗi SQL thật trên Turso;
  ba vị từ Flash (flashApplied / flash_discount > 0) lệch khi giảm làm tròn 0đ (Phát hiện 3); chỗ in bill tự đọc nhandiem_enabled === '1'
  và han_gio (Phát hiện 4); mốc DIEM_KHI_THU_TU tạm + hai cơ chế mốc ở hai file; E2 dò chữ bill (chữ có sẵn).
NGHIỆM THU:    9/9 mục có bằng chứng · mục thiếu: không có (yếu: C "theo giờ thu", C "cùng giao dịch").
CHƯA SOÁT ĐƯỢC: giao dịch trên Turso thật; --day-du và cong.js chay (chưa chạy); in bill thật; dữ liệu cũ production.
BÀI HỌC: KHOÁ — đổi luật "được nhận X" ở phía xử lý thì thêm ca kiểm chữ hứa X ở phía in cho cùng đối tượng; ca "theo giờ thu" phải dựng
  giờ thu khác quý giờ tạo. NGUYÊN TẮC — K4: "có gì để làm" gồm cả LỜI HỨA in cho khách; K1: câu "xem mục Y" phải trỏ mục có thật.
Gọn hơn (không bắt buộc): orders.js:1201-1210 đọc pos_settings rồi gọi docCauHinhNhanDiem — hai truy vấn; công thức điểm còn bản chép ở
  signup-codes.js:209-256; dời tinhDiemDon sang server/utils/ ở việc sau.
```
Xử lý vòng 1 (vòng sửa 1/3): lỗi 1 → `batDiem = … && !flashApplied` (luật Flash 0 điểm kể cả nhận mã bill đã chốt 13.10 — bill không
được hứa điều /nhan-diem từ chối) + ca E1c (đỏ trên gốc) / E1d (K5) + đột biến `BV-bill-flash-hua-diem`. Lỗi 2 → C1 đưa `created_at` đơn
về 2025-01-15 (khác quý), so với giờ ghi điểm + đột biến `VS-pay-debt-han-gio-tao`. Lỗi 3 → thêm mục CHƯA KIỂM. Lỗi 4 → đọc `changes`,
log khi đơn cũ đã có điểm. Gợi ý "gọn hơn": không làm — `bat` / `hanGio` giữ theo kế hoạch đã duyệt (mục 9.3), còn lại là Phát hiện 1–2.

## E(3) — đã đọc, không hỏi
`/nhan-diem` đã chặn bill chưa thu đủ: `kiemDonCuaMa` gọi trước mọi lệnh ghi → 400 `BILL_CHUA_THANH_TOAN`. Không đổi; ca E3 canh.

## Phát hiện
Xem `ke_hoach.md` mục 8 (Phát hiện 1–3) và cuối mục 9 (Phát hiện 4). Không sửa.
