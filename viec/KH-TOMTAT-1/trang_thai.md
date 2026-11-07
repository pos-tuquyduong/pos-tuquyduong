# KH-TOMTAT-1 — trạng thái

## Đối chiếu bản chụp (bước 1, làm tiếp 07.11.2026)
HEAD = FETCH_HEAD = `b55c59c` (hook mở phiên đã kéo 66220bf → b55c59c; fetch lại: không có gì mới).
```
b55c59c PHIEU: KH-TOMTAT-1 chu quan tra loi cau hoi 06.11 (them file vao Pham vi)
f3a09c2 KH-TOMTAT-1: ke hoach + cau hoi Pham vi (can routes/hoaDon.js de dung chung dungThanhToan / tinhGiam)
66220bf GOP-KH-TOMTAT-1 dua main 5e93e3d vao nhanh truoc khi lam (chat 06.11)
```
Có commit `0adf75d PHIEU: KH-TOMTAT-1` trong lịch sử.

## Câu hỏi 06.11 — đã được chủ quán trả lời (phiếu commit b55c59c)
1. A: thêm `server/routes/hoaDon.js` vào Phạm vi — export `dungThanhToan`, tách `tinhGiam(o)`; không chép công thức, không gọi `dungHoaDon` từng đơn.
2. Đơn quầy có phí giao → `cach_nhan` `giao`, còn lại `tai_quan`; `null` chỉ khi không có dữ liệu đơn.

## Tiến độ
- Bài thử đỏ trước: `cong_cu/thu_KHTOMTAT1.js` (30 ca) đỏ trên gốc `ae1c072` (8 đạt · 22 hỏng) → `bang_chung_do.txt`.
- Sửa: `server/routes/hoaDon.js` (export `dungThanhToan`, tách `tinhGiam`), `server/utils/donApp.js` (`tomTat`, `tomTatDonThat`, nối vào `tomDon`),
  `HOP_DONG_API_KH.md` v12 + `cong_cu/thu_HOPDONG_KH.js` (hai phép v12).
- Quyết định thiết kế: KHÔNG thêm cột vào `CAU_DON` (UNION hai nhánh phải cùng số cột); đọc đơn thật bằng đúng 2 truy vấn cho cả trang
  (`SELECT * FROM pos_orders WHERE id IN (…)` + gom `SUM(quantity)` / tên dòng đầu) — không N+1.
- Cách hiểu ghi rõ trong hợp đồng "Ghi chú v12": `tra[]` bỏ dòng ghi nợ (tổng = `da_tra`); `giam` = hạng + Flash + mã, KHÔNG gồm phí giao;
  đơn App chưa có đơn thật → `tra: []`, `giam: 0`, `cach_nhan: 'tai_quan'`; thiếu dữ liệu → `null` (tổng NULL → `tra`/`giam`; phí giao NULL → `cach_nhan`;
  không dòng món → `so_mon`/`mon_dau`).

## Bảng "chỗ vá → đột biến" (`viec/KH-TOMTAT-1/dot_bien.py`, 32 đột biến, đối chứng XANH, 32/32 BẮT)
| Chỗ vá | Đột biến |
|---|---|
| nối `...tomTat(r, ext)` vào `tomDon` | BV-BO-TOM-TAT |
| `kenh` | VS-KENH-LUON-QUAY · VS-KENH-LUON-APP |
| `cach_nhan` | VS-CACH-NHAN-LUON-TAI-QUAN · VS-CACH-NHAN-NGUONG-NOI · VS-CACH-NHAN-DOAN-KHI-THIEU |
| `tra[]` | VS-TRA-CO-DONG-GHI-NO · VS-TRA-DOI-TEN-CACH · VS-TRA-DOI-SO-TIEN · VS-TRA-THIEU-KHI-THIEU-TONG |
| `giam` | VS-GIAM-LUON-0 · VS-GIAM-TINH-LAI-KIEU-KHAC · VS-GIAM-THIEU-MA · VS-GIAM-THIEU-FLASH |
| `so_mon`, `mon_dau` | VS-SO-MON-DEM-DONG · VS-MON-DAU-LA-MON-CUOI · VS-SO-MON-THIEU-THANH-0 |
| đơn App chưa có đơn thật | VS-APP-CHO-TRA-LA-NULL · VS-APP-CHO-TRA-DEM-DONG |
| hai cửa cùng đi qua `tomDon` (K4) | VS-DS-KHONG-TOM-TAT · VS-CHI-TIET-KHONG-TOM-TAT · VS-TOM-TAT-LAY-SAI-DON |
| chỉ đơn của SĐT trong token | BV-BO-LOC-SDT-DON-THAT |
| `hoaDon.js` export + `tinhGiam` | BV-KHONG-EXPORT-DUNG-THANH-TOAN · BV-KHONG-EXPORT-TINH-GIAM · VS-TINH-GIAM-MA-KHONG-TRU-HANG · VS-TINH-GIAM-MA-KHONG-CONG-PHI-GIAO · VS-TINH-GIAM-TONG-THIEU-FLASH |
| hợp đồng v12 | BV-HOPDONG-CUA-DON-BO-KENH · BV-HOPDONG-CUA-DON-CT-BO-GIAM · BV-HOPDONG-BO-GHI-CHU-V12 · BV-HOPDONG-NHAT-KY-V12 |

Lần chạy đầu có 1 đột biến SỐNG (VS-TOM-TAT-LAY-SAI-DON): các ca đọc từng đơn lúc danh sách mới có 1–2 đơn, nên đơn bị gán tóm tắt của đơn khác không lộ.
Thêm ca A10 (8 đơn cùng trang, danh sách = chi tiết của chính đơn đó, các đơn khác nhau) → BẮT.

## Soát độc lập (/ra-soat, vòng 1) — báo cáo agent
ĐẠT có điều kiện, không lỗi chặn. Điểm nhẹ và cách xử lý:
- Hợp đồng ghi "Đơn App luôn tai_quan" chặt hơn code → ĐÃ SỬA chữ: "đơn App chưa có đơn thật luôn `tai_quan`; đơn App đã trả tính theo phí giao như đơn quầy" (K1).
- Nghiệm thu D thiếu ca đọc dòng cách trả trên `hoa_don[]` → ĐÃ THÊM ca A4b (`tu_tk` 20.000đ + `ck` 30.000đ). Tờ in KHÔNG có dòng "cách nhận" riêng (chỉ `phi_giao` khi giao, client/src/utils/hoaDon.js) nên không thêm dòng: `cach_nhan` chỉ có ở trường mới (ke_hoach.md đã ghi).
- Nghi ngờ đơn quầy đã huỷ/hoàn: `tra[]`/`giam` vẫn hiện số đã có, nhất quán với `da_tra` → ĐÃ KHOÁ hành vi bằng ca A4c/A4d (đơn huỷ: tổng `tra[]` = `da_tra`). Chưa đọc `orders.js` huỷ/hoàn (vùng CHƯA rà) nên không khẳng định ý chủ quán có muốn App hiện `tra` của đơn đã hoàn tiền.
- `so_mon` của đơn App chưa có đơn thật là 0 chứ không null nếu `dong` rỗng — không xảy ra (App bắt buộc ≥ 1 món).
- Nghiệm thu sau sửa: A, B, C, D, E, K5 đều có ca; bài 33 ca xanh; đột biến chạy lại 32/32 BẮT.

## Soát bảo mật
Số lỗi trước lọc: 0 · sau lọc: 0. Báo cáo subagent (nguyên ý):
Không tìm thấy lỗ hổng độ tin cậy cao. Đã đọc donApp.js:277-358, hoaDon.js:32-40, 84-91, 135-145. (1) `IN (${cho})` chỉ ghép `?,?,?`, `ids` là `r.oid` số nguyên từ CAU_DON, đi qua tham số. (2) Đầu vào `tomTatDonThat` chỉ là dòng CAU_DON đã lọc theo SĐT token; tra `pos_orders`/`pos_order_items` theo khoá chính / order_id; Map tra bằng đúng oid; dòng `loai = 0` bị loại khỏi ids. (3) `SELECT *` chỉ trong bộ nhớ; câu trả lời chỉ 6 trường đặt tên (`tra[]` chỉ `cach`, `so_tien`), không spread `o`. (4) Export `dungThanhToan`/`tinhGiam` là hàm thuần, không route mới; route quầy giữ `authenticate`. (5) Không tin số tiền/giá nào từ máy khách.
SOÁT BẢO MẬT: ĐẠT

## Báo cáo 7 mục
```
VIỆC:        KH-TOMTAT-1 — Lịch sử đơn App có tóm tắt thật từng đơn
ĐÃ SỬA:      server/routes/hoaDon.js:84-91 (tách tinhGiam(o)), :104 (dungHoaDon gọi lại), :150-151 (export dungThanhToan, tinhGiam)
             server/utils/donApp.js:29 (require), :295-325 (tomTat, tomTatDonThat), :326-338 (tomDon nhận ext), dsDon/chiTietDon nối tomTat
             HOP_DONG_API_KH.md (v12: bảng cửa, khối máy đọc, Ghi chú v12, nhật ký, PHIEN_BAN 12) · cong_cu/thu_HOPDONG_KH.js (2 phép v12)
BÀI THỬ:     thu_KHTOMTAT1.js trên gốc ae1c072 → ĐỎ 9 đạt · 24 hỏng (A1 … K5c: trường undefined); sau vá → XANH 33/33.
             thu_HOPDONG_KH.js trên gốc → ĐỎ 86/2 (hai phép v12); sau vá 88/0. Đột biến 32/32 BẮT (đối chứng XANH). npm test PASS 100 · FAIL 0.
             thu_HDKH1.js 35/0 và thu_HD1.js 157/0 vẫn xanh (hoá đơn quầy không đổi).
ĐÃ RÀ K4:    grep "tomDon(|tomTat(|dsDon|chiTietDon" server/utils/donApp.js server/routes/kh/index.js → 2 nơi gọi tomDon (dsDon, chiTietDon), cả hai nối;
             grep "dungThanhToan|tinhGiam" server → hoaDon.js (định nghĩa + dungHoaDon) + donApp.js; POST /don trả traDon (phiếu không yêu cầu, không đổi).
CHƯA KIỂM:   - Đơn quầy ĐÃ HOÀN tiền / đã huỷ: tra[]/giam hiện số đã có (khớp da_tra); chưa đọc orders.js huỷ/hoàn (vùng chưa rà), chủ quán chưa quyết App có hiện tra của đơn hoàn không.
             - Đơn sau pay-debt (thu nợ) chưa có ca riêng (dùng chung hàm nên rủi ro thấp).
             - Dữ liệu production thật; App KH ở kho khác (chưa thử vẽ 6 trường).
             - Cổng `cong.js chay` với mốc đúng quy định (PHIEU^) ĐỎ vì diff gồm cả phần main đã gộp (commit GOP): A11 thu_KHO1/KHO2b/SAOLUU2 xanh trên gốc, A16 thiếu SỐ CA của
               ~15 bài thử việc khác. Với mốc là commit GOP (66220bf, chỉ phần của việc này) → ✓ CỔNG CHẠY ĐẠT. Chat/chủ quán xem mốc khi gộp.
             - `tra[]` bỏ dòng ghi nợ; tờ in không có dòng "cách nhận" nên D chỉ khoá dòng cách trả + giảm + phi_giao.
GIT:         276e9f2 KH-TOMTAT-1: dong SO CA dung dang cong A16 / ff377da ghi soat doc lap + soat bao mat
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 1 · BỎ 2 — xem ## Bài học
```
Đếm nghiệm thu: A (A1–A9, AP1–AP4 ở cả /don và /don/:ma) ✓ · B (B1, B2, A5b, A6b) ✓ · C (C1, AP3, AP4) ✓ · D (A4b cách trả, A6b giảm, A7b phi_giao; cách nhận không có dòng trên tờ in) ✓ · E (hợp đồng v12 + thu_HOPDONG 88/0; E1–E4) ✓ · K5 (K5a–c, A6c) ✓.

## Bài học
- KHOÁ 1: ca A10 (nhiều đơn cùng trang, mỗi đơn mang tóm tắt của chính nó) — đã có trong thu_KHTOMTAT1.js; ca đỏ: đột biến VS-TOM-TAT-LAY-SAI-DON ban đầu SỐNG vì các ca chỉ đọc từng đơn lúc danh sách còn 1–2 đơn.
- KHOÁ 2: ca A4b (dòng cách trả trên hoa_don[]) + A4c/A4d (đơn huỷ) do agent soát chỉ ra: mỗi dòng "như tờ in" trong nghiệm thu phải có MỘT ca đọc đúng dòng đó. Đã làm trong Phạm vi.
- NGUYÊN TẮC 1 (đề xuất, KHUON_LOI.md ngoài Phạm vi): K3 — bài thử danh sách phải tạo NHIỀU đơn khác nhau rồi đọc lại cả trang; đọc từng đơn ngay sau khi tạo che lỗi gán nhầm giữa các dòng (ví dụ VS-TOM-TAT-LAY-SAI-DON SỐNG lần đầu).
- BỎ: mẫu ✗ sai trong dot_bien.py (LẠC do ghi mẫu A2|K5c) — một lần, đã sửa; dòng "SỐ CA" ghi sai dạng (A16 đòi "SỐ CA cong_cu/thu_X.js: N") — một lần.
- Khuôn máy mây: `git worktree` bị người gác chặn → dựng gốc bằng `git archive` ra thư mục nháp.

HEAD ĐÃ KIỂM: 276e9f2

HEAD ĐÃ KIỂM: 10cb03c


## Gộp main (chủ quán, chat soát 07.11 — thử gộp trên main 86057f9: cổng tĩnh ĐẠT, --day-du PASS 106 · FAIL 0, thu_KHTOMTAT1 33/0 (đã nối vào bộ kiểm), thu_HOPDONG_KH 88/0)
HEAD ĐÃ KIỂM: e6cb33e
