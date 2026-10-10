# LUOI-1 — trạng thái

## Bản chụp lúc mở phiên (09.10.2026)
Nhánh: `viec/LUOI-1`
```
9521cec PHIEU: LUOI-1
769adfe TIEN-DO: HOC-2b xong (caabb73), LUOI-1 mo phieu — so v24
caabb73 Merge pull request #11 from pos-tuquyduong/viec/HOC-2b
```
Có commit `PHIEU: LUOI-1`, cha là commit sổ v24 (769adfe). Máy: 4 lõi (`/proc/cpuinfo`).

## Bước đang làm
**CHAT SOÁT THAY VÒNG 4 (10.10)** — soát vòng 3 KHÔNG ĐẠT, máy hết vòng sửa (dừng đúng lời chủ quán). Chat sửa 6 lỗi +
2 nghi ngờ trên nhánh bằng script chủ quán `sua_LUOI1.py` (khuôn `sua_HOC2b.py`). **Số nghiệm thu cuối: mục "Chat soát thay vòng 4"
cuối file.** Mọi bảng số khác ghi "(cũ)" là của lần chạy trước.
- [x] Bản gốc lưu ở thư mục nháp ngoài kho. `server/`, `client/`, `tu_chay/` KHÔNG đổi (`git diff --stat 9521cec -- server client tu_chay` rỗng).
- [x] A1 (`chay.js`): trễ bật lại TRƯỚC mỗi kịch bản, tắt khi kiểm bất biến. Giả lập 67,1 s → **58,3 s** (18 · 10 ĐẠT).
- [x] Siết KB10 + bằng chứng đỏ trên gốc (mục "Bằng chứng KB10" dưới).
- [x] Công tắc SX lỗi (`chay.js`), I7 mở rộng, I8 vế đổi điểm, I12–I17 (`bat_bien.js`). 18 KB cũ + 16 bất biến: ĐẠT (K5).
- [x] KB19–KB27 (`kich_ban.js`); KB20 ca chồng mã theo Q6 (a) siết.
- [x] `thu_gia_lap.js`: dòng tổng 27 · 16, 69 ca dữ liệu tay LUOI-1 sau chat soát thay (62 trước đó; + 2 ca I2 cũ) (bộ sạch + lệch đúng một phép, hai phía), cờ `--chi-du-lieu-tay`.
- [x] B6 bánh cóc 18 → 27, 10 → 16; chú thích S4 theo số đo thật.
- [x] `dot_bien.py` (C3) · C1 + C2 (87, một lần chạy — Q4 a) · C4.

## (cũ) Số đo chạy RIÊNG — trước chat soát thay (máy mây 4 lõi, `node viec/LUOI-1/do_thoi_gian.js …`)
| Lệnh | Gốc 9521cec | Sau A1 (18 KB) | HEAD (27 KB · 16 BB) | Ngưỡng 80 % |
|---|---|---|---|---|
| giả lập `chay.js` | 67,1 s | 58,3 s · 57,8 s | **80,5 s** head cuối (80,7 · 80,9 · 78,7 s các lần trước) | 96 s |
| `thu_gia_lap.js` | 74,9 s (42/0) | **66,3 s** (42/0) | **93,7 s** head cuối (102/0; 90,5 · 92,1 · 91,7 s; người soát 93,3 s) | 96 s — SÁT (94–98 %) |
| `kiem_tra --day-du` | 201,8 s, thoát 0 | 228,4 s · PASS 65 · FAIL 0 · CẢNH BÁO 0 | **266,2 s · PASS 65 · FAIL 0 · CẢNH BÁO 0** head cuối | (không có hạn riêng) |
| `npm test` | — | — | **PASS 61 · FAIL 0 · CẢNH BÁO 0** | |
Cột "Sau A1": giả lập 58,3 s đo trên HEAD lúc chỉ có A1; ba số còn lại đo bù (vòng sửa 1) trên `git archive 025106b` (commit chỉ có A1,
18 KB · 10 BB) trong thư mục nháp, `node viec/LUOI-1/do_thoi_gian.js gl thugl kiem`.
Từng KB mới (ms): KB19 2386 · KB20 2462 · KB21 7627 · KB22 2145 · KB23 3430 · KB24 1761 · KB25 555 · KB26 580 · KB27 1246.
Vòng bất biến mỗi KB: ~572 ms (gốc) → 2–8 ms (A1). Đột biến: C1+C2 1915 s · C3 163 s · C4 (TU-CHAY-4 + P26b + HOC-2b + AUDIT-1 D1/G3)
~75 phút (D1/G3 654 s).

## Bằng chứng KB10 (chủ quán dặn 09.10) — `viec/LUOI-1/dot_bien.py`, cách chạy `goc10`, chép ở `bang_chung_do.txt`
Đột biến "trễ không bật lại" trên GỐC 9521cec (tắt trễ sau mỗi kịch bản, không bật lại), `--den-kb 10`:
- `GOC-KB10-cu-tre-khong-bat-lai` (KB10 CŨ) → **LẠC**: chỉ ca chồng đỏ; ca "trễ kho đang bật" vẫn XANH (trung vị tính trên cả phiên).
- `GOC-KB10-siet-tre-khong-bat-lai` (KB10 SIẾT) → **BẮT**: đỏ CẢ hai ca — "trung vị 0 ms trên 0 lệnh của KB10".
Trên HEAD: `BV-A1-tre-khong-bat-lai`, `VS-A1-tre-chi-bat-kb-dau` → BẮT cả hai ca KB10.

## (cũ) Chạy lại trên `2e6e524` (sau Q10 a, 09.10, máy, tuần tự, riêng) — số máy mây; số nghiệm thu cuối ở mục chat soát thay
| Mục | Lệnh | Kết quả |
|---|---|---|
| Đo riêng | `npm test`; `node viec/LUOI-1/do_thoi_gian.js gl thugl kiem` | npm test PASS 61 · FAIL 0 · CẢNH BÁO 0 · giả lập **85,4 s** ĐẠT (27 · 16) · `thu_gia_lap` **93,4 s** 104/0 (< 96 s) · `--day-du` **290,0 s · PASS 65 · FAIL 0 · CẢNH BÁO 0** |
| Bằng chứng đỏ | `thu_gia_lap` của HEAD trên `git archive 9521cec` | thoát 1 · 45 đạt · 59 hỏng · `SỐ CA cong_cu/thu_gia_lap.js: 104` |
| C3 | `python3 viec/LUOI-1/dot_bien.py -j 4` | 73 · BẮT 71 · LẠC 1 · SỐNG 1 · **đúng mong đợi 73/73** · 258 s (LẠC = `GOC-KB10-cu-tre-khong-bat-lai`, SỐNG = `VS-SRV-doi-ck-giu-tien-mat` — cả hai đúng mong đợi) |
| C1 + C2 | `python3 viec/AUDIT-1/dot_bien.py C2F C2-loyalty-redeem-tru-0 -j 4` | C1 **21/21 BẮT** · C2 **40/40 vẫn BẮT** · C2F BẮT 62 · SỐNG 23 · LẠC 1 · HỎNG 0; C2 BẮT 1 · 1926 s · "✓ kho thật không đổi" |
| C4 TU-CHAY-4 | đủ 10 | XANH — 0 đột biến không đạt |
| C4 P26b | 18 đột biến chạy giả lập | 18 bị bắt · 0 không |
| C4 HOC-2b | 25 (bỏ 3 cái `p26b`) | 25 đạt · 0 không |
| C4 AUDIT-1 G3 + D1 | -j 4, 568 s | D1 BẮT 55 · LẠC 2 (như gốc); G3 BẮT 1 · SỐNG 1 · HỎNG 1 · LẠC 1 (đúng thiết kế) · kho không đổi |

## (cũ) Chạy lại trên `31afeb0` (sau vòng sửa 2, 09.10, tuần tự, riêng)
| Mục | Lệnh | Kết quả |
|---|---|---|
| C3 | `python3 viec/LUOI-1/dot_bien.py -j 4` | 67 · BẮT 66 · LẠC 1 (mong đợi) · đúng mong đợi 67/67 · 191 s · thoát 0 |
| C1 + C2 | `python3 viec/AUDIT-1/dot_bien.py C2F C2-loyalty-redeem-tru-0 -j 4` | C1 **21/21 BẮT** · C2 **40/40 vẫn BẮT** · C2F BẮT 62 · SỐNG 23 · LẠC 1 · HỎNG 0; C2 BẮT 1 · 1910 s · "✓ kho thật không đổi" |
| C4 TU-CHAY-4 | đủ 10 | XANH — 0 đột biến không đạt |
| C4 P26b | 18 đột biến chạy giả lập | 18 bị bắt · 0 không |
| C4 HOC-2b | 25 (bỏ 3 cái `p26b`) | 25 đạt · 0 không |
| C4 AUDIT-1 G3 + D1 | -j 4, 588 s | D1 BẮT 55 · LẠC 2 (như gốc); G3 BẮT 1 · SỐNG 1 · HỎNG 1 · LẠC 1 (đúng thiết kế) · kho không đổi |
| Đo riêng | `npm test`; `do_thoi_gian.js gl thugl kiem` | npm test PASS 61 · FAIL 0 · CẢNH BÁO 0 · giả lập 80,5 s ĐẠT · thu_gia_lap 93,7 s 102/0 · `--day-du` 266,2 s PASS 65 · FAIL 0 · CẢNH BÁO 0 |
Bảng chi tiết C1 dưới đây lấy từ lần chạy đầu; lần chạy trên head cuối cho cùng 21 BẮT (KB21 nay bắt `orders-21` bằng dòng "gói
cancelled" trong ca huỷ chồng). Bảng đủ 87 dưới là của head cuối.

## C1 — 21 đột biến SỐNG trên gốc → BẮT (lần đầu 09.10, 1915 s; chạy lại head cuối: 21/21)

| Đột biến | Kết quả | Dòng bắt |
|---|---|---|
| C2F-loyalty-01-insert-khach-app | BẮT | KB19 → HTTP: đổi lần hai khi đã hết điểm → 400: HTTP 200 |
| C2F-loyalty-02-insert-khach-app | BẮT | KB19 → HTTP: validate mã đổi điểm: HTTP 400 · Mã chiết khấu không tồn tại |
| C2-loyalty-redeem-tru-0 | BẮT | KB19 → I8: dòng đổi điểm #30: 0 điểm, 1 quà trỏ tới, quà giá 3 điểm |
| C2F-orders-05-update-quay | BẮT | KB19 → I13: mã …: đã dùng 0/1, đơn đã áp 1 |
| C2F-orders-07-insert-quay | BẮT | KB24 → HTTP: … 1 dòng nợ (cần 3) |
| C2F-orders-27-insert-quay | BẮT | KB24 → HTTP: … 2 dòng nợ (cần 3) |
| C2F-orders-39-insert-quay | BẮT | KB27 → HTTP: … 1 dòng nợ (cần 2) |
| C2F-orders-10-update-quay | BẮT | KB9 → I14: gói #2: đã giao 1, đơn lấy từ gói 0 |
| C2F-orders-11-insert-quay | BẮT | KB22 → HTTP: 0 dòng mua thẻ |
| C2F-orders-21-update-quay | BẮT | KB21 → HTTP: lấy từ gói của đơn mua đã huỷ: HTTP 200 |
| C2F-orders-22-delete-quay | BẮT | KB21 → HTTP: gói không còn lượt…: gói còn |
| C2F-orders-23-update-quay | BẮT | KB21 → HTTP: … đơn còn trỏ gói |
| C2F-orders-24-delete-quay | BẮT | KB22 → HTTP: dòng mua thẻ còn 1 |
| C2F-orders-25-update-quay | BẮT | KB21 → HTTP: huỷ đơn lấy 1 ly: giao 3 (cần 2) |
| C2F-orders-30-update-quay | BẮT | KB23 → HTTP: xoá đơn mua gói: 1 đơn trỏ |
| C2F-orders-32-update-quay | BẮT | KB23 → HTTP: xoá đơn lấy: giao 2 (cần 1) |
| C2F-packages-05-update-quay | BẮT | KB26 → HTTP: /deliver: 1 → 1 |
| C2F-wallets-08-insert-quay | BẮT | KB26 → HTTP: đối soát khách chưa có ví: ví null |
| C2F-refunds-05-update-quay | BẮT | KB12 → I17: yêu cầu hoàn #2001: gắn dòng sổ (không có) |
| C2F-don-mo-rong-01-update-quay | BẮT | KB2 → I16: nhật ký đổi sang cash 30000, đơn ghi tiền mặt 0 · CK 30000 |
| C2F-discount-codes-05-update-quay | BẮT | KB20 → I13: mã KB20TANGTAY: đã dùng 0/5, quầy tăng tay 1 |

Thêm (ngoài 21): `C2F-orders-31-delete-quay`, `C2F-orders-38-delete-quay` SỐNG → BẮT (KB23 xoá đơn mua gói).

## C2 — 40 C2F đã BẮT trên gốc VẪN BẮT (cùng lần chạy; 86 C2F − 45 SỐNG − 1 LẠC theo `viec/HOC-2b/trang_thai.md` D5)
40/40 BẮT: `C2F-orders-01-ghiVi-quay`, `C2F-orders-03-update-quay`, `C2F-orders-04-insert-quay`, `C2F-orders-06-insert-quay`, `C2F-orders-08-insert-quay`, `C2F-orders-09-update-quay`, `C2F-orders-12-update-quay`, `C2F-orders-15-insert-quay`, `C2F-orders-16-update-quay`, `C2F-orders-17-insert-quay`, `C2F-orders-18-update-quay`, `C2F-orders-19-ghiVi-quay`, `C2F-orders-20-ghiVi-quay`, `C2F-orders-26-update-quay`, `C2F-orders-28-ghiVi-quay`, `C2F-orders-29-ghiVi-quay`, `C2F-orders-33-delete-quay`, `C2F-orders-34-delete-quay`, `C2F-refunds-01-insert-quay`, `C2F-refunds-02-update-quay`, `C2F-refunds-03-update-quay`, `C2F-refunds-04-ghiVi-quay`, `C2F-refunds-06-ghiVi-quay`, `C2F-refunds-07-update-quay`, `C2F-wallets-01-update-quay`, `C2F-wallets-02-insert-quay`, `C2F-wallets-03-insert-quay`, `C2F-wallets-04-ghiVi-quay`, `C2F-wallets-05-ghiVi-quay`, `C2F-wallets-06-ghiVi-quay`, `C2F-wallets-07-update-quay`, `C2F-damages-01-ghiVi-quan-tri`, `C2F-damages-02-insert-quan-tri`, `C2F-signup-codes-01-update-khach-app`, `C2F-signup-codes-02-insert-khach-app`, `C2F-signup-codes-03-update-khach-app`, `C2F-signup-codes-04-insert-khach-app`, `C2F-discount-codes-01-insert-quan-tri`, `C2F-rewards-01-insert-quan-tri`, `C2F-loyalty-03-insert-khach-app`.
Tổng lần chạy: C2F BẮT 62 · SỐNG 23 · LẠC 1 (`C2F-orders-02-insert-quay`, như gốc) · HỎNG 0 · TREO 0; C2 BẮT 1. SỐNG → BẮT: 22.
23 SỐNG còn lại: quản trị (packages/discount-codes/rewards/signup-codes/customers-v2/damages-03), `orders-13/14` (đăng ký khách
sang SX), `orders-35/36/37` (xoá đơn dọn bảng phụ, owner) — đúng như AUDIT-1 xếp NHẸ, ngoài phiếu.
<details><summary>Bảng đủ 87</summary>

- BẮT `C2-loyalty-redeem-tru-0`
- SỐNG `C2F-customers-v2-01-insert-khong-ro`
- SỐNG `C2F-customers-v2-02-update-quan-tri`
- SỐNG `C2F-customers-v2-03-insert-quan-tri`
- SỐNG `C2F-customers-v2-04-update-quan-tri`
- SỐNG `C2F-customers-v2-05-insert-quan-tri`
- BẮT `C2F-damages-01-ghiVi-quan-tri`
- BẮT `C2F-damages-02-insert-quan-tri`
- SỐNG `C2F-damages-03-update-quan-tri`
- BẮT `C2F-discount-codes-01-insert-quan-tri`
- SỐNG `C2F-discount-codes-02-update-quan-tri`
- SỐNG `C2F-discount-codes-03-update-quan-tri`
- SỐNG `C2F-discount-codes-04-delete-quan-tri`
- BẮT `C2F-discount-codes-05-update-quay`
- BẮT `C2F-don-mo-rong-01-update-quay`
- BẮT `C2F-loyalty-01-insert-khach-app`
- BẮT `C2F-loyalty-02-insert-khach-app`
- BẮT `C2F-loyalty-03-insert-khach-app`
- BẮT `C2F-orders-01-ghiVi-quay`
- LẠC `C2F-orders-02-insert-quay`
- BẮT `C2F-orders-03-update-quay`
- BẮT `C2F-orders-04-insert-quay`
- BẮT `C2F-orders-05-update-quay`
- BẮT `C2F-orders-06-insert-quay`
- BẮT `C2F-orders-07-insert-quay`
- BẮT `C2F-orders-08-insert-quay`
- BẮT `C2F-orders-09-update-quay`
- BẮT `C2F-orders-10-update-quay`
- BẮT `C2F-orders-11-insert-quay`
- BẮT `C2F-orders-12-update-quay`
- SỐNG `C2F-orders-13-update-quay`
- SỐNG `C2F-orders-14-insert-quay`
- BẮT `C2F-orders-15-insert-quay`
- BẮT `C2F-orders-16-update-quay`
- BẮT `C2F-orders-17-insert-quay`
- BẮT `C2F-orders-18-update-quay`
- BẮT `C2F-orders-19-ghiVi-quay`
- BẮT `C2F-orders-20-ghiVi-quay`
- BẮT `C2F-orders-21-update-quay`
- BẮT `C2F-orders-22-delete-quay`
- BẮT `C2F-orders-23-update-quay`
- BẮT `C2F-orders-24-delete-quay`
- BẮT `C2F-orders-25-update-quay`
- BẮT `C2F-orders-26-update-quay`
- BẮT `C2F-orders-27-insert-quay`
- BẮT `C2F-orders-28-ghiVi-quay`
- BẮT `C2F-orders-29-ghiVi-quay`
- BẮT `C2F-orders-30-update-quay`
- BẮT `C2F-orders-31-delete-quay`
- BẮT `C2F-orders-32-update-quay`
- BẮT `C2F-orders-33-delete-quay`
- BẮT `C2F-orders-34-delete-quay`
- SỐNG `C2F-orders-35-delete-quay`
- SỐNG `C2F-orders-36-delete-quay`
- SỐNG `C2F-orders-37-delete-quay`
- BẮT `C2F-orders-38-delete-quay`
- BẮT `C2F-orders-39-insert-quay`
- SỐNG `C2F-packages-01-insert-quan-tri`
- SỐNG `C2F-packages-02-update-quan-tri`
- SỐNG `C2F-packages-03-update-quan-tri`
- SỐNG `C2F-packages-04-delete-quan-tri`
- BẮT `C2F-packages-05-update-quay`
- SỐNG `C2F-packages-06-update-quan-tri`
- BẮT `C2F-refunds-01-insert-quay`
- BẮT `C2F-refunds-02-update-quay`
- BẮT `C2F-refunds-03-update-quay`
- BẮT `C2F-refunds-04-ghiVi-quay`
- BẮT `C2F-refunds-05-update-quay`
- BẮT `C2F-refunds-06-ghiVi-quay`
- BẮT `C2F-refunds-07-update-quay`
- BẮT `C2F-rewards-01-insert-quan-tri`
- SỐNG `C2F-rewards-02-update-quan-tri`
- SỐNG `C2F-rewards-03-update-quan-tri`
- BẮT `C2F-signup-codes-01-update-khach-app`
- BẮT `C2F-signup-codes-02-insert-khach-app`
- BẮT `C2F-signup-codes-03-update-khach-app`
- BẮT `C2F-signup-codes-04-insert-khach-app`
- SỐNG `C2F-signup-codes-05-update-quan-tri`
- SỐNG `C2F-signup-codes-06-delete-quan-tri`
- BẮT `C2F-wallets-01-update-quay`
- BẮT `C2F-wallets-02-insert-quay`
- BẮT `C2F-wallets-03-insert-quay`
- BẮT `C2F-wallets-04-ghiVi-quay`
- BẮT `C2F-wallets-05-ghiVi-quay`
- BẮT `C2F-wallets-06-ghiVi-quay`
- BẮT `C2F-wallets-07-update-quay`
- BẮT `C2F-wallets-08-insert-quay`
</details>

## C3 — đột biến của việc này (`python3 viec/LUOI-1/dot_bien.py -j 4`)
**Lần chạy cuối (head cuối `31afeb0`, 191 s; trước đó sau vòng sửa 1: 195 s cùng kết quả): 67 đột biến · BẮT 66 · LẠC 1 · SỐNG 0 · HỎNG 0 · đúng mong đợi 67/67, thoát 0.**
66 cái mong BẮT đều BẮT; 1 cái mong LẠC (`GOC-KB10-cu-tre-khong-bat-lai` — bằng chứng KB10 CŨ không bắt trễ) đúng LẠC.
Lịch sử: lần 1 57 đột biến
(55 BẮT, 1 LẠC mong đợi, 2 SỐNG ngoài mong đợi). Lần 1: 2 SỐNG ngoài mong đợi → sửa bất biến (không sửa bài thử): `VS-I8-qua-chi-tren` (vế "số quà" bị vế "trừ đúng giá" che —
giờ chỉ so điểm khi có quà), `BV-I16-sang` (vế thừa — đổi sai cách thì cột kia luôn ≠ 0; bỏ vế và đột biến). Lần 2 các đột
biến liên quan: 8/8 BẮT. Kiểm sạch 6 cách chạy trước khi chấm: đều thoát 0.

Bảng chỗ đổi → đột biến:
| Chỗ đổi | Đột biến |
|---|---|
| `chay.js` A1 trễ bật lại | `BV-A1-tre-khong-bat-lai`, `VS-A1-tre-chi-bat-kb-dau`, `GOC-KB10-cu-tre-khong-bat-lai`, `GOC-KB10-siet-tre-khong-bat-lai` |
| `chay.js` công tắc SX | `BV-B4-sx-khong-tu-tat`, `VS-B4-sx-mac-dinh-bat`, `VS-B4-bat-khong-ghi-kb`, `BV-B4-kb-khong-gan`, `VS-B4-loi-van-nhan` |
| KB26 đổi tiền mặt → CK (máy chủ) — ĐÃ BỎ theo Q10 (a), đột biến mong SỐNG (Phát hiện 13) | `VS-SRV-doi-ck-giu-tien-mat` |
| KB25 hai người cùng bấm ở lần đẩy ĐẦU (máy chủ — chat 10.10, soát vòng 3 lỗi 3) | `VS-SRV-bo-khoa-dangChay` |
| I12 trần ±1 (chat 10.10, lỗi 1) · I8 loại NULL · I15 SĐT rỗng (chat 10.10, lỗi 2) | `VS-I12-tran-chi-duoi`, `VS-I12-tran-chi-tren`, `VS-I12-tran-lech-1000`, `BV-I8-loai-null`, `BV-I15-sdt-rong`, `BV-I7-no-khong-van-tay` |
| I7 mở rộng | `VS-I7-tong-chi-tren`, `VS-I7-tong-chi-duoi`, `BV-I7-b-no-da-xong`, `BV-I7-c-loi-phai-co-no`, `VS-I7-c-no-chi-duoi`, `BV-I7-d-no-phai-co-loi`, `BV-I7-e-kb-bat` |
| I8 vế đổi điểm | `VS-I8-diem-chi-tren`, `VS-I8-diem-chi-duoi`, `VS-I8-qua-chi-duoi`, `VS-I8-qua-chi-tren`, `BV-I8-loai-la` |
| I12 | `BV-I12-loai-dong`, `BV-I12-sdt`, `VS-I12-diem-chi-tren`, `VS-I12-diem-chi-duoi`, `BV-I12-loai-ma`, `VS-I12-tri-gia-chi-tren`, `VS-I12-tri-gia-chi-duoi`, `BV-I12-tran`, `BV-I12-so-ma`, `VS-I12-dung-chi-duoi`, `VS-I12-dung-chi-tren` |
| I13 | `VS-I13-dung-chi-tren`, `VS-I13-dung-chi-duoi`, `VS-I13-gioi-han-cong-1`, `BV-I13-bo-gioi-han-0`, `BV-I13-so-tay`, `BV-I13-bo-loai`, `BV-I13-bo-tri-gia` |
| I14 | `VS-I14-vuot-tong-cong-1`, `VS-I14-giao-chi-tren`, `VS-I14-giao-chi-duoi`, `BV-I14-so-tay`, `BV-I14-tinh-ca-don-huy`, `BV-I14-tinh-ca-mon-co-gia`, `BV-I14-goi-don-huy`, `BV-I14-goi-don-xoa`, `BV-I14-bo-product-id`, `BV-I14-tro-goi`, `BV-I14-tro-bo-not-null`, `BV-I14-mua-bo-co-goi`, `BV-I14-mua-bo-lay-ngay`, `BV-I14-mua-lay-ngay` |
| I15 | `VS-I15-the-chi-tren`, `VS-I15-the-chi-duoi`, `BV-I15-tinh-ca-don-huy`, `BV-I15-bo-sdt`, `BV-I15-bo-mon-the`, `BV-I15-mua-don-huy`, `BV-I15-mua-don-xoa` |
| I16 | `VS-I16-tien-chi-tren`, `VS-I16-tien-chi-duoi`, `VS-I16-luon-cot-ck`, `BV-I16-nhanh-ck`, `VS-I16-luon-cot-tm`, `BV-I16-cot-kia`, `BV-I16-dong-cuoi` |
| I17 | `BV-I17-bo-approved`, `BV-I17-loai-dong`, `BV-I17-don`, `BV-I17-sdt`, `VS-I17-tien-lech-1` |
| KB19–KB27 / I12–I17 trên máy chủ thật | 21 đột biến C1 (bảng C1) |

Mọi tên đột biến trong `viec/LUOI-1/dot_bien.py` (80 — 73 của máy + 7 chat thêm 10.10): `GOC-KB10-cu-tre-khong-bat-lai`, `GOC-KB10-siet-tre-khong-bat-lai`, `BV-A1-tre-khong-bat-lai`, `VS-A1-tre-chi-bat-kb-dau`, `BV-B4-sx-khong-tu-tat`, `VS-B4-sx-mac-dinh-bat`, `VS-B4-bat-khong-ghi-kb`, `BV-B4-kb-khong-gan`, `VS-SRV-doi-ck-giu-tien-mat`, `VS-B4-loi-van-nhan`, `VS-I7-tong-chi-tren`, `VS-I7-tong-chi-duoi`, `BV-I7-b-no-da-xong`, `BV-I7-c-loi-phai-co-no`, `VS-I7-c-no-chi-duoi`, `BV-I7-d-no-phai-co-loi`, `BV-I7-e-kb-bat`, `VS-I8-diem-chi-tren`, `VS-I8-diem-chi-duoi`, `VS-I8-qua-chi-duoi`, `VS-I8-qua-chi-tren`, `BV-I8-loai-la`, `BV-I12-loai-dong`, `BV-I12-sdt`, `VS-I12-diem-chi-tren`, `VS-I12-diem-chi-duoi`, `BV-I12-loai-ma`, `VS-I12-tri-gia-chi-tren`, `VS-I12-tri-gia-chi-duoi`, `BV-I12-tran`, `BV-I12-so-ma`, `VS-I12-dung-chi-duoi`, `VS-I12-dung-chi-tren`, `VS-I13-dung-chi-tren`, `VS-I13-dung-chi-duoi`, `VS-I13-gioi-han-cong-1`, `BV-I13-bo-gioi-han-0`, `BV-I13-so-tay`, `BV-I13-bo-loai`, `BV-I13-bo-tri-gia`, `VS-I14-vuot-tong-cong-1`, `VS-I14-giao-chi-tren`, `VS-I14-giao-chi-duoi`, `BV-I14-so-tay`, `BV-I14-tinh-ca-don-huy`, `BV-I14-tinh-ca-mon-co-gia`, `BV-I14-goi-don-huy`, `BV-I14-goi-don-xoa`, `BV-I14-tro-goi`, `BV-I14-bo-product-id`, `BV-I14-tro-bo-not-null`, `BV-I14-mua-bo-co-goi`, `BV-I14-mua-bo-lay-ngay`, `BV-I14-mua-lay-ngay`, `VS-I15-the-chi-tren`, `VS-I15-the-chi-duoi`, `BV-I15-tinh-ca-don-huy`, `BV-I15-bo-sdt`, `BV-I15-bo-mon-the`, `BV-I15-mua-don-huy`, `BV-I15-mua-don-xoa`, `VS-I16-tien-chi-tren`, `VS-I16-tien-chi-duoi`, `VS-I16-luon-cot-ck`, `BV-I16-nhanh-ck`, `VS-I16-luon-cot-tm`, `BV-I16-cot-kia`, `BV-I16-dong-cuoi`, `BV-I17-bo-approved`, `BV-I17-loai-dong`, `BV-I17-don`, `BV-I17-sdt`, `VS-I17-tien-lech-1`, `BV-I8-loai-null`, `VS-I12-tran-chi-duoi`, `VS-I12-tran-chi-tren`, `VS-I12-tran-lech-1000`, `BV-I15-sdt-rong`, `VS-SRV-bo-khoa-dangChay`, `BV-I7-no-khong-van-tay`.

## D2 — PR + check `cong`, `cong-chay`
CHƯA KIỂM: máy không xem được GitHub (không tạo PR — phiếu cấm). Thời gian `thu_gia_lap` trên máy CI chưa đo (ở đây 90,5–93,3 s,
sát ngưỡng cảnh báo 96 s).

## E — toàn bộ (chạy riêng, code cuối `2e6e524`)
`npm test` PASS 61 · FAIL 0 · CẢNH BÁO 0 · `--day-du` PASS 65 · FAIL 0 · CẢNH BÁO 0 (290,0 s) · `thu_gia_lap` 102 đạt · 0 hỏng · giả lập
27 · 16 ĐẠT. (Dòng `ĐẾM` chép nguyên — "thoát 0" không phải bằng chứng 0 cảnh báo.)

## C4 — bộ đột biến cũ chạm file việc này sửa (Q4 a: chỉ đột biến chạy giả lập / thu_gia_lap / bộ kiểm hoặc có neo trong file đổi)
Neo trước khi chạy: `python3 viec/HOC-2b/kiem_neo.py` → AUDIT-1 173/174 (HỎNG = `G3-sai-chuoi` cố ý), P26b 59/59, HOC-1 20/20,
HOC-2 26/26, TU-CHAY-4 10/10, HOC-2b 26/26 — không neo nào rữa.
| Bộ | Chạy | Kết quả | So D5 HOC-2b |
|---|---|---|---|
| TU-CHAY-4 | đủ 10 | XANH — 0 không đạt (M0 xanh, 9 đỏ đúng chỗ) | như cũ |
| P26b | 18 đột biến chạy giả lập (kb14–kb18, gl13); 41 cái `thu` bỏ (chỉ chạy thu_P26b, không neo file đổi) | 18 bị bắt · 0 không | như cũ |
| HOC-2b | 25 (bỏ 3 cái `p26b`: M0-p26b, VS-q9-me-lon-hon-bang-0, BV-q9-bo-hoan-me) | 25 đạt · 0 không | như cũ |
| AUDIT-1 D1 (57) + G3 (4) | đủ, -j 4, 654 s | D1 BẮT 55 · LẠC 2 (`!D1-E11-P20`, `!D1-E11-P26a`); G3 BẮT 1 · SỐNG 1 (`G3-vo-hai`) · HỎNG 1 (`G3-sai-chuoi`) · LẠC 1 (`G3-sap`) | như cũ; kho thật không đổi |
Không chạy (Q4 a): AUDIT-1 A3/B1 (đo `tu_chay/`, không đổi), HOC-1, HOC-2 (đo `tu_chay/`).

## Chủ quán duyệt kế hoạch (b9a0a27)
Q1 (a) · Q2 (a) · Q3 (a) — màn Bán hàng `Sales.jsx:416/:541` đã chặn lấy quá lượt ở MỘT quầy; lỗ thật chỉ khi hai quầy chồng
nhau hoặc gọi thẳng API → Phát hiện 5, gom P26c · Q4 (a) — C1+C2 chung một lần chạy 87; C4 chỉ đột biến có lệnh giả lập /
thu_gia_lap / bộ kiểm hoặc neo trong file việc này sửa · Q5 đồng ý (vượt 96 s → DỪNG, không nới).
Dặn thêm: (1) I8 vế điểm ghi rõ cách xử lý điểm hết hạn, ca điểm hết hạn ghi CHƯA KIỂM; (2) ca siết KB10 phải ĐỎ trên gốc
với đột biến "trễ không bật lại" — ghi tên đột biến + kết quả ở đây; (3) mọi số đo chạy RIÊNG. Làm tiếp từ bước 4.

## Câu hỏi — Q10 (sau vòng sửa 3/3) — chủ quán chốt (a), 09.10

- **Q10 — `thu_gia_lap` đo riêng 96,1 s > ngưỡng 96 s (80 % hạn 120 s).** Nguyên nhân: vòng sửa 3 thêm một đơn "đổi tiền mặt →
  chuyển khoản" vào KB26 (soát vòng 2, lỗi 1: chiều đổi sang CK chưa có ca nào; đột biến máy chủ `VS-SRV-doi-ck-giu-tien-mat` —
  đổi sang CK mà giữ tiền mặt, đơn ghi gấp đôi — chỉ kịch bản này bắt). Giả lập 82,4 s (ĐẠT, dưới 96 s). Phiếu A2: vượt 96 s →
  DỪNG, cấm nới hạn / hạ ngưỡng / bớt kịch bản cũ. Chọn:
  (a) **bỏ đơn đổi sang CK khỏi KB26** (về ~93,7 s): I16 vẫn soát nhánh CK bằng ca dữ liệu tay (`BV-I16-nhanh-ck` BẮT); chiều CK
      phía MÁY CHỦ ghi CHƯA PHỦ (đột biến `VS-SRV-doi-ck-giu-tien-mat` sẽ SỐNG — ghi rõ, bỏ khỏi bảng mong BẮT). **Đề xuất** cho
      việc này. Lưu ý: mọi kịch bản thêm sau đều sẽ vượt ngưỡng, nên cần (b) ở một việc riêng.
  (b) giữ đơn đó, và mở việc riêng (ngoài Phạm vi của phiếu này về cách chạy) để chia giả lập trong `thu_gia_lap` thành hai lượt
      song song, hoặc giảm số giả lập con chạy cùng lúc. Tới lúc đó bộ kiểm `--day-du` ra CẢNH BÁO (vượt 80 %) — trái nghiệm thu E
      "0 CẢNH BÁO".
  (c) giữ đơn đó bằng cách bớt một bước rẻ hơn — KHÔNG làm được trong phiếu (cấm bớt kịch bản cũ).
  Ghi chú: các lần đo `thu_gia_lap` trước đó trên head trước dao động 90,5–93,7 s; 96,1 s có thể một phần là dao động, nhưng phiếu
  không cho đo lại tới khi lọt ngưỡng.

## Câu hỏi — Q7–Q9 (sau soát vòng 1) — chủ quán chốt 09.10: Q7 (a) · Q8 (b) · Q9 (a)
Q8 (b) cụ thể: KB21 bỏ khẳng định "hoàn trọn giá gói" cho gói ĐÃ GIAO > 0, chỉ giữ: hoàn đúng MỘT lần (ca chồng), gói chuyển
`cancelled`, không lấy thêm được. Gói CHƯA giao giữ khẳng định hoàn trọn.

- **Q7 — xoá đơn mua thẻ: hoàn tiền mà khách vẫn giữ hạng (lỗi tiền MỚI, chưa có trong sổ việc).** Đọc code 09.10:
  đường XOÁ `orders.js:1462–1590` không có câu nào chạm `pos_membership_purchases` (grep "membership" sau dòng 1460: 0 chỗ), trong
  khi vẫn hoàn ví khi đơn `completed` (`:1493–1503`). Đường HUỶ thì có gỡ dòng thẻ (`:1368–1374`). Màn Lịch sử đơn cho chủ xoá đơn
  chưa huỷ (theo người soát: `Orders.jsx:242`, `:1213`). Hậu quả: chủ xoá đơn mua thẻ trả bằng ví → ví được hoàn đủ giá thẻ, dòng
  mua thẻ còn → khách vẫn được giảm giá hạng. I15 (vế "dòng mua thẻ của đơn không còn") ĐÃ canh, có ca dữ liệu tay; chỉ thiếu
  kịch bản. Thêm kịch bản thì giả lập ĐỎ (= lộ code sai). Chọn:
  (a) KHÔNG thêm kịch bản xoá đơn thẻ trong việc này; ghi CHƯA PHỦ + Phát hiện 10 → gom vào P26c (cùng chỗ với (4)/(14) của đường
  xoá); quy tắc tạm ở quầy: đơn mua thẻ chỉ Huỷ, không Xoá (như đơn gói). **Đề xuất.**
  (b) thêm kịch bản → việc này dừng tới khi sửa `server/` ở việc khác.
- **Q8 — huỷ đơn mua gói đã giao một phần: hoàn TRỌN giá gói.** KB21 đang khẳng định "huỷ đơn mua gói (đã giao 2/3) → ví + ĐỦ
  giá gói" — đúng như máy chủ làm (`orders.js:1331–1335` hoàn trọn `balance_amount`; `:1350–1355` chỉ đánh dấu gói `cancelled`),
  hai đơn lấy 0đ vẫn hiệu lực → khách được 2 ly miễn phí. Chưa thấy chủ quán chốt luật này. Chọn:
  (a) đây là luật hiện tại, giữ ca KB21 như ĐANG mô tả hành vi hiện tại (ghi rõ trong chú thích "luật hiện tại — P26c/P24 đổi luật
  thì sửa ca này cùng lúc", như I8 ghi cho điểm). **Đề xuất** — lưới khoá hành vi hiện tại, đổi luật là quyết định riêng.
  (b) đây là lỗi tiền → bỏ khẳng định "ví + đủ giá" khỏi KB21 (chỉ giữ "gói bị gỡ"), ghi Phát hiện → P26c.
- **Q9 — một đơn vừa MUA gói mới vừa LẤY từ gói cũ: trừ lượt ở CẢ HAI gói** (đọc code, CHƯA CHẠY). `Sales.jsx:744–751` gửi
  được cả `package_buy` lẫn `customer_package_id` (`addPkgToCart` `:485–500` không tắt `activePkgId`); máy chủ cộng lượt lấy
  ngay cho gói MỚI và trỏ đơn sang gói mới (`orders.js:975–985`), rồi `:1021–1037` cộng tiếp cho gói CŨ → một ly trừ hai gói,
  và gói cũ mất dấu đơn. I14 sẽ đỏ nếu có kịch bản. Chọn: (a) không thêm kịch bản, Phát hiện 11 → P26c **(đề xuất)**; (b) thêm →
  dừng việc.

## Câu hỏi — Q6 (chủ quán chọn (a) có siết, 09.10)

- **Q6 — ca "hai đơn cùng mã dùng-một-lần chồng nhau → 200 + 400 `DISCOUNT_CODE_LIMIT_REACHED`" (Q1 a) KHÔNG chạy được trên
  code hiện tại.** Chạy thật 09.10: `HTTP 200 / HTTP 500 · SQLITE_CONSTRAINT_UNIQUE: UNIQUE constraint failed: pos_orders.code`.
  Lý do (đọc code): mã đơn sinh NGOÀI giao dịch (`server/utils/helpers.js:24–46` lấy số lớn nhất hôm nay + 1, gọi ở
  `orders.js:759` trước `beginTransaction`) → hai đơn bất kỳ tạo chồng nhau cùng ra một mã → đơn sau vấp UNIQUE khi INSERT
  `pos_orders`, TRƯỚC khi tới phép kiểm lại mã trong giao dịch (`orders.js:880–893`). Đây là lỗi ĐÃ BIẾT: P26b Phát hiện 10,
  sổ việc P26d mục (10), đang mở. Không mất tiền: đơn sau rollback, mã chỉ được dùng 1 lần (`used_count` = 1, I13 ĐẠT).
  Phiếu cấm viết kịch bản né chỗ sai → DỪNG, hỏi. Chọn:
  - (a) ca chồng mong "đơn đầu 200 có giảm; đơn sau KHÔNG thành (400 `DISCOUNT_CODE_LIMIT_REACHED` hoặc 500 trùng mã đơn =
    P26d (10)); `used_count` = 1, ví/tiền không đổi". Ghi rõ cổng 400 trong giao dịch CHƯA được ca này chứng minh (CHƯA KIỂM)
    tới khi P26d sửa (10); P26d phải siết ca về đúng 200 + 400.
  - (b) bỏ ca chồng mã khỏi việc này, ghi Phát hiện → P26d thêm ca khi sửa (10). Phần còn lại của KB20 giữ nguyên.
  - (c) dừng LUOI-1 chờ P26d sửa (10).
  - (d) ca chồng dùng lệnh chen là `/increment-usage` (lượt bị dùng hết ngay trước khi đơn mở giao dịch) → đi tới cổng 400
    thật mà không vướng (10). Chứng minh được cổng trong giao dịch, nhưng KHÔNG phải "hai quầy cùng bán" (chưa chạy thử —
    lệnh thử trên bản nháp bị chặn quyền).
  Đề xuất: **(a)** — giữ ca hai quầy đúng nghiệp vụ, không chấp nhận mã dùng hai lần, mọi ràng buộc tiền vẫn soát;
  `C2F-orders-05` vẫn bị I13 bắt ở KB19/KB20 (không dựa vào ca chồng).

## Câu hỏi Q1–Q5 (đã trả lời — xem mục trên)

- **Q1 — bán lại mã dùng-một-lần đã hết lượt.** Đọc code: màn Bán hàng chỉ gửi mã khi `POST /discount-codes/validate` hợp lệ
  (`Sales.jsx:234`, `:728`); validate mã hết lượt → 400 KHÔNG có `code` (`discount-codes.js:94–95`). Nếu vẫn gửi mã đó lên
  `POST /orders`, máy chủ **bỏ mã, đơn 200, tính đủ giá** (`orders.js:475–495`); chỉ khi hai đơn CHỒNG nhau mới ra
  400 `DISCOUNT_CODE_LIMIT_REACHED` (`:880–893`). Không mất tiền. Phiếu ghi "lần hai cùng mã → bị chặn". Đề xuất (a): KB20
  mong validate 400 + đơn tuần tự 200 / `discount_amount` 0 / đủ giá + ca chồng 200 + 400 `DISCOUNT_CODE_LIMIT_REACHED`.
  (b) coi "đơn 200 bỏ mã" là code sai → DỪNG việc.
- **Q2 — `PUT /packages/customer-packages/:id/deliver`.** Không màn hình nào gọi; cộng lượt KHÔNG trần, KHÔNG tạo đơn
  (`packages.js:171–185`). Đề xuất (a): KB26 gọi trong hạn lượt (1 ly trên gói còn lượt), I14 cộng sổ `giaoGoi` → bắt
  `C2F-packages-05`; "không trần" ghi Phát hiện 4. (b) không phủ → `C2F-packages-05` ghi CÒN SỐNG kèm lý do.
- **Q3 — lấy quá lượt gói (đụng tiền).** Theo code đọc, CHƯA chạy: (i) còn 1 lượt mà đơn lấy 2 ly → máy chủ chỉ chặn khi còn
  ≤ 0 (`orders.js:222–228`) nên giao vượt `total_qty`; (ii) hai quầy cùng lấy lượt cuối → kiểm ngoài giao dịch (`:194`), cộng
  sau commit không trần (`:1021–1037`) → vượt. Hai ca này sẽ làm I14 "`delivered_qty ≤ total_qty`" ĐỎ = lộ code sai. Đề xuất
  (a): KB21 KHÔNG thêm hai ca này (lấy đúng tới hết lượt, lấy thêm bị chặn; ca chồng của tiền gói = hai người cùng huỷ đơn
  mua gói); hai lỗ ghi Phát hiện 5 → gom vào P26c. (b) thêm hai ca → bài đỏ, việc DỪNG ở bước 4 chờ P26c sửa.
- **Q4 — thời gian máy ước ~195–210 phút > 150** (`ke_hoach.md` mục 12). Đề xuất cắt, không bỏ mục nghiệm thu: C1 và C2 dùng
  CHUNG một lần chạy 87 C2F (không chạy hai lần); C4 chỉ chạy đột biến có lệnh chạy giả lập / `thu_gia_lap` / bộ kiểm hoặc có
  neo trong 5 file việc này sửa (đột biến chỉ chạy `thu_P26b`/`tu_chay` bỏ qua vì không file nào của chúng đổi) — ước còn
  ~160 phút. Hoặc tách C4 sang phiếu sau.
- **Q5 — `thu_gia_lap` ước ~91 s**, sát ngưỡng 96 s (80 % hạn). Duyệt làm tiếp; đo thật vượt 96 s → DỪNG theo A2 với đề xuất
  tách giả lập hai lượt song song. Đồng ý?

## Phát hiện (ngoài phạm vi — KHÔNG sửa)

1. Huỷ / xoá đơn KHÔNG trả lượt mã giảm giá (`orders.js:1296–1458`, `:1462–1590` không đụng `pos_discount_codes`): mã đổi
   điểm dùng rồi huỷ đơn → khách mất cả mã lẫn điểm. Nghiệp vụ — gắn P24 (huỷ đơn trừ điểm)?
2. `POST /orders` lưu `discount_code` cả khi mã KHÔNG được áp (`orders.js:450` gán sẵn, chỉ ghi đè khi mã hợp lệ) → báo cáo
   đếm "đơn có mã" (`Reports.jsx:182`) tính cả đơn không được giảm.
3. `pos_voucher_grants.status` không bao giờ chuyển `used` (grep `used_order_id` trong `server/` chỉ có SELECT `loyalty.js:88`).
4. `PUT /packages/customer-packages/:id/deliver` không trần lượt, không tạo đơn, chỉ cần đăng nhập (`packages.js:171–185`);
   không màn hình gọi — đề xuất bỏ như `POST /buy` (P26b D).
5. Lấy quá lượt gói theo số lượng và khi hai quầy chồng nhau (Q3).
6. Hạng thẻ mặc định có "Kim cương" (`database.js:1144`, chỉ chạy khi bảng rỗng) — trái CLAUDE.md §5.6.
7. Tự đẩy sổ nợ mỗi 3 phút (`index.js:76`, `doSoNo.js:120`) đẩy cả nợ của đơn ĐÃ XOÁ → SX nhận vân tay của đơn không còn
   (cùng gốc P26c (4)). Vì vậy KB27 (SX lỗi lúc xoá) phải là kịch bản cuối.
9. Ca chồng mã giảm giá vấp P26d (10) — Q6 (a) siết. Cổng `DISCOUNT_CODE_LIMIT_REACHED` (`orders.js:880–893`) gần như không
   bao giờ tới được khi hai quầy chồng nhau (đơn sau 500 vì trùng mã đơn). **P26d (10) sửa xong thì siết KB20 về đúng 200 + 400
   `DISCOUNT_CODE_LIMIT_REACHED` và thêm đột biến bỏ kiểm lại trong giao dịch** (bỏ `freshCode` ở `orders.js:880–893` phải BẮT).
10. **[gom P26c — Q7 (a)]** Xoá đơn mua thẻ (owner) hoàn ví mà KHÔNG gỡ `pos_membership_purchases` (`orders.js:1462–1590`) →
    khách được hoàn tiền mà vẫn giữ hạng. **CHƯA PHỦ** trong giả lập (thêm kịch bản = đỏ); I15 đã canh (vế "đơn không còn" + ca
    dữ liệu tay). Quy tắc tạm ở quầy đề xuất: đơn mua thẻ chỉ Huỷ, không Xoá.
11. **[gom P26c — Q9 (a)]** Một đơn vừa MUA gói mới vừa LẤY từ gói cũ: trừ lượt CẢ HAI gói, `customer_package_id` của đơn bị ghi
    đè sang gói mới (`orders.js:975–985` + `:1021–1037`; `Sales.jsx:485–500`, `:744–751`). Đọc code, CHƯA CHẠY; không thêm kịch bản.
12. **[gom P26c — Q8 (b)]** Huỷ đơn mua gói đã giao một phần: hoàn bao nhiêu — chủ quán chốt khi làm P26c (hiện hoàn TRỌN giá
    gói, `orders.js:1331–1355`). KB21 không khẳng định số tiền cho ca này; ca gói chưa giao vẫn khẳng định hoàn trọn.
13. **[Q10 (a), chủ quán chốt 09.10]** Chiều đổi tiền mặt → chuyển khoản phía MÁY CHỦ **CHƯA PHỦ**: thêm kịch bản thì
    `thu_gia_lap` vượt 96 s (đo 96,1 s). I16 vẫn soát nhánh CK bằng dữ liệu tay (`BV-I16-nhanh-ck` BẮT); đột biến máy chủ
    `VS-SRV-doi-ck-giu-tien-mat` (đổi sang CK mà giữ tiền mặt → đơn ghi gấp đôi) **SỐNG** (đúng mong đợi đã ghi). **Việc chia giả
    lập 2 lượt (chen trước P26c) thêm lại đơn này; nghiệm thu: đột biến này BẮT** (đổi mong đợi trong `viec/LUOI-1/dot_bien.py`).
14. **[chat soát thay 10.10 — soát vòng 3 lỗi 4]** Trần giảm (`max_discount`) và loại % của mã ĐỔI ĐIỂM phía MÁY CHỦ **CHƯA PHỦ**:
    KB19 chỉ có quà cố định không trần (`rewards.js:46` lưu 0), nên `loyalty.js:183` bỏ trần hoặc viết cứng `'fixed'` vẫn xanh. I12
    soát vế trần bằng dữ liệu tay ±1 (`VS-I12-tran-chi-duoi`, `VS-I12-tran-chi-tren`). **Việc chia giả lập 2 lượt thêm quà % có trần.**
15. **[chat soát thay 10.10 — nghi ngờ của soát vòng 3]** I12 / I13 / vế đổi điểm của I8 so với quà và mã HIỆN TẠI: chủ sửa quà
    hoặc mã ĐÃ dùng (`PUT /discount-codes/:id`, thao tác quản trị hợp lệ) thì đỏ oan. Không kịch bản nào sửa — kịch bản sau thêm việc
    đó phải đổi phép (ghi tại dòng trong `bat_bien.js`). Tự đẩy sổ nợ (`doSoNo.js:114–121`, 180 s) có thể làm KB25/KB27 đỏ oan nếu
    một lượt giả lập vượt 180 s — chưa gặp; giả lập hiện ~85 s (máy mây).
8. `C2F-orders-31-delete-quay` (`orders.js:1515`, xoá gói khi xoá đơn mua) đang SỐNG — KB23 + I14 sẽ chạm (thêm, ngoài 21 cái).

## Soát kế hoạch (agent phụ, chỉ đọc) — CẦN SỬA 6 điểm, đã sửa trong ke_hoach.md
1. `C2-loyalty-redeem-tru-0` có mẫu bắt `→ I8:` → bắt bằng I12 sẽ bị chấm LẠC → chuyển vế đổi điểm vào I8 mở rộng.
2. "Công tắc không tự tắt" không có ca bắt (KB24 tự tắt) → tách: KB24 bật lỗi không tắt, KB25 đẩy sổ nợ nhờ tự tắt.
3. B1 "tích − đổi khớp sổ" thiếu → vế I8 mở rộng. 4. Thiếu mục B6/C2/D2 → mục 11b.
5. `wallets-08`: HTTP giống hệt khi bỏ INSERT → KB26 SELECT `pos_wallets`. 6. Ghi `orders-31` + nhánh sổ nợ chưa phủ.

## Soát độc lập — vòng 1 (`/ra-soat`, agent general-purpose, 09.10) — chép nguyên báo cáo

KHÔNG ĐẠT

Tôi đã đọc phiếu, trang_thai.md, ke_hoach.md, bang_chung_do.txt, dot_bien.py, diff của 5 file code, và đường tiền ở orders.js, loyalty.js, packages.js, discount-codes.js, wallets.js, refunds.js, don-mo-rong.js, doSoNo.js, index.js. Tôi tự chạy các lệnh sau trên HEAD 3a66365, lần lượt từng lệnh, không chạy song song:
- `npm test`: PASS 61, 0 CẢNH BÁO.
- `node cong_cu/thu_gia_lap.js --chi-du-lieu-tay`: 62 đạt, 0 hỏng.
- `node cong_cu/gia_lap/chay.js`: "27 kịch bản · 16 bất biến · ĐẠT", mất khoảng 81 s.
- `node kiem_tra_truoc_khi_giao.js --day-du`: PASS 65 · FAIL 0 · CẢNH BÁO 0. Trong lần này thu_gia_lap chạy 93,3 s.

Tôi không sửa file nào trong kho. `git log origin/viec/LUOI-1..HEAD` rỗng.

LỖI TÌM ĐƯỢC:
1. cong_cu/gia_lap/bat_bien.js:203–204 (I13) cùng cong_cu/thu_gia_lap.js, khung I13 và 4 ca I13 — đột biến bỏ MỘT điều kiện WHERE vẫn SỐNG. Tôi đã chạy thử trong thư mục nháp hai bản: bỏ riêng `AND o.discount_type = d.discount_type`, và bỏ riêng `AND o.discount_value = d.discount_value`. Cả hai bản cho kết quả giống hệt bản gốc trên đủ 4 ca dữ liệu tay. Nguyên nhân: hai đơn "gõ mã nhưng không được áp" (số 2: NULL/0, số 4: percent/10) lệch CẢ loại lẫn trị giá, nên chỉ bỏ một vế thì không ca nào đổi. Đột biến `BV-I13-loai-ma` bỏ cả hai vế cùng lúc nên che mất chỗ này. Phiếu C3 đòi "bỏ một điều kiện WHERE … phải BẮT". Khuôn K3.
2. cong_cu/thu_gia_lap.js, ca 'I12 không có mã giảm giá' (`DELETE FROM pos_discount_codes`) — một ca vi phạm cùng lúc 4 phép: so_ma, discount_type, discount_value, usage_limit. Vế `so(r.so_ma) !== 1` ở bat_bien.js:193 vì vậy không đột biến nào giết được, và trong dot_bien.py cũng không có đột biến cho vế này. Khuôn K3 (ca gộp).
3. Đường xoá đơn mua thẻ chưa được phủ, cũng không ghi CHƯA PHỦ hay Phát hiện. Ở orders.js:1462–1590, đường XOÁ không có câu nào chạm `pos_membership_purchases`. Trong khi đó đường huỷ có xoá dòng thẻ (:1368–1374). Đường xoá lại hoàn ví (:1494–1498). Hậu quả: chủ xoá thẳng một đơn mua thẻ chưa huỷ thì khách được hoàn tiền mà vẫn giữ hạng. Màn hình cho phép làm vậy: Orders.jsx:242 và :1213 cho chọn xoá với đơn chưa huỷ. I15 đã có vế "đơn không còn", có cả ca tay, nhưng không kịch bản nào chạy đường này. Theo luật của phiếu, chạy kịch bản này sẽ lộ code sai, tức phải DỪNG và ghi `## Câu hỏi`. Phiếu B3 cũng bắt "phủ được thì phủ, không thì ghi CHƯA PHỦ + lý do". Hiện cả trang_thai.md lẫn ke_hoach.md mục 11b đều không nhắc tới. Khuôn K4.
4. cong_cu/gia_lap/chay.js:183 (`sxGia.kb = i + 1`) — đọc code mà suy ra, CHƯA CHẠY. Nếu bỏ dòng này, mọi lần lỗi đều mang kb 0, và `batSxLoi` cũng thêm 0 vào kbBat. Khi đó vế (e) của I7 không bao giờ đỏ, và đột biến này SỐNG. Danh sách C3 không có đột biến nào cho dòng này. Khuôn K3, mức nhẹ.
5. viec/LUOI-1/trang_thai.md thiếu bằng chứng cho D2 và E. Không có dòng D2 ghi "CHƯA KIỂM" (chỉ ke_hoach mục 11b có). Không ghi kết quả `npm test`. Dòng `--day-du` chỉ ghi "thoát 0", không ghi số CẢNH BÁO, trong khi thoát 0 không có nghĩa là 0 cảnh báo. Lần tôi chạy thì thật sự là 0 CẢNH BÁO, nhưng hồ sơ thiếu. Khuôn K6/K1 về hồ sơ.
6. viec/LUOI-1/ke_hoach.md:101–102, :148 và mục 11b vẫn mô tả I13 bằng điều kiện `discount_amount > 0`. Code đã đổi sang so loại + trị giá ở commit c91101c, nhưng tài liệu không sửa theo. Ngoài ra số dòng trích loyalty.js lệch 1: ghi `:169`/`:178`, thực tế là :170/:179. Khuôn K4 về tài liệu.

NGHI NGỜ:
- KB21 (kich_ban.js, ca "hai nhân viên huỷ đơn mua gói") khẳng định ví được cộng ĐỦ giá gói, dù gói đã giao 2/3 lượt. Hai đơn lấy 0đ vẫn còn hiệu lực, tức khách được 2 ly miễn phí. Server làm đúng như vậy (orders.js:1331–1335 hoàn trọn `balance_amount`; :1350–1355 chỉ đánh dấu gói `cancelled`). Nhưng tôi không thấy quyết định nào của chủ quán cho chuyện này, và P26c trong TIEN_DO_POS.json:407 cũng không liệt kê. Kịch bản đang đóng đinh một hành vi tiền chưa được chốt. Nên hỏi chủ quán.
- Đường song song lưới chưa canh — đọc code, CHƯA CHẠY: một đơn vừa mua gói mới (`package_buy`) vừa lấy từ gói cũ (`customer_package_id`). Sales.jsx:744–751 gửi được cả hai, vì `addPkgToCart` ở :486–498 không tắt `activePkgId`. Server cộng lượt lần đầu cho gói MỚI và trỏ đơn sang gói mới (orders.js:975–985), rồi :1021–1037 lại cộng cho gói CŨ, nên một ly bị trừ ở hai gói. I14 sẽ bắt được nếu có kịch bản chạy đường này, nhưng hiện không có, và cũng không ghi Phát hiện.
- Thời gian: thu_gia_lap đo được 93,3 s (của tôi) và 92,1 s (của việc này), trên ngưỡng 96 s, tức chỉ còn dư khoảng 3 %. Máy GitHub CI cho `cong-chay` có thể chậm hơn, khi đó sẽ ra CẢNH BÁO, hoặc vượt hạn 120 s. Chưa kiểm.
- Ở 57 ca đỏ trên gốc, các ca I12–I17 đỏ chỉ vì "SẬP: BAT_BIEN[bb] is not a function", tức kiểu "thiếu hàm" mà K3 cảnh báo. Bằng chứng thật cho các ca này nằm ở C3, không ở bang_chung_do. Chấp nhận được nhưng cần biết.
- Câu "55 BẮT + 2 đúng mong đợi" của C3 trong trang_thai mơ hồ: dot_bien.py có 56 đột biến mong BẮT và 1 mong LẠC. Không có nhật ký thô của lần chạy.
- A1 trong trang_thai: sau A1 chỉ đo lại giả lập (58,3 s). thu_gia_lap và `--day-du` sau A1 (với 18 kịch bản) đều để "—".
- Giới hạn của I12 (chủ XOÁ mã của quà chưa dùng thì đỏ) và của I13 (xoá đơn có mã) chỉ ghi một phần trong chú thích.

Trả lời từng mục được giao:
- K3: bài thử có chạy trên gốc và đỏ 57/102 (bang_chung_do.txt). Bài kiểm sự vắng mặt của mẫu nguy hiểm (SQL trên sổ), không kiểm marker. Có hai lỗ: (1) và (2) ở trên, thêm (4).
- K4: lưới chưa canh 3 chỗ: xoá đơn mua thẻ, mua gói mới + lấy gói cũ cùng đơn, và `PUT /customer-packages/:id/cancel` (packages.js:186; chỗ này đã ghi CHƯA KIỂM). Chỉ một chỗ được ghi.
- K5: không thấy bất biến nào đỏ oan trong giả lập. Các ca gói có order_id NULL, gói cancelled, mã không áp đều có ca sạch. Bất biến chỉ chạy trên kho tạm, nên dữ liệu cũ của production không ảnh hưởng.
- K1: xem lỗi (6). Các khẳng định quyền và màn hình gọi tôi đã kiểm: database.js:951 và Orders.jsx:263 đúng.
- P1: client/, server/, tu_chay/, .claude/, .github/, package.json, CHECKLIST_CODE.md, CLAUDE.md, viec/AUDIT-1, TIEN_DO_POS.json đều không đổi (`git diff --stat` rỗng). `--day-du` báo dist khớp src.

NGHIỆM THU: 11/16 mục có bằng chứng · mục thiếu: A1 (chưa đo lại thu_gia_lap và --day-du sau A1), B3 (đường XOÁ đơn mua thẻ không phủ, không ghi CHƯA PHỦ), C3 (bỏ một điều kiện WHERE của I13 vẫn SỐNG), D2 (trang_thai không ghi), E (trang_thai không ghi npm test và số CẢNH BÁO; lần tôi chạy thì xanh, 0 CẢNH BÁO).
Có bằng chứng: A0 (ke_hoach mục 0), A2 (ke_hoach mục 12 và bảng số đo), B1 (KB19 + I8/I12), B2 (KB20 + I13, theo Q1/Q6 chủ quán đã chốt), B4 (KB24/25/27 + I7), B5 (KB26, KB20 increment, I16, I17), B6 (kiem_tra:753–754), C1 (21/21), C2 (40/40), C4 (bảng), D1.

CHƯA SOÁT ĐƯỢC:
- Không chạy lại C1/C2 (87 đột biến, khoảng 32 phút), C3 (57 đột biến) hay C4. Bảng kết quả của các mục này tôi chưa tự xác nhận lại.
- Không xem được GitHub, tức D2 và thời gian trên máy CI.
- Đột biến `sxGia.kb` và lỗi trừ hai gói chỉ suy ra từ code, chưa chạy.
- Không đối chiếu từng tên 40/86 C2F với viec/HOC-2b/trang_thai.md mục D5. Phần tôi đã đối chiếu: đủ 57 tên trong dot_bien.py có mặt trong trang_thai.md (A17).

BÀI HỌC:
- KHOÁ:
  - Mỗi vế `AND` trong WHERE của một bất biến phải có một đột biến bỏ RIÊNG vế đó. Ca dữ liệu tay phải có đầu vào lệch đúng một vế. Có thể thêm một phép trong dot_bien.py: tự sinh đột biến "bỏ từng điều kiện".
  - Thêm đột biến bỏ `sxGia.kb = i + 1`.
  - Thêm kịch bản xoá đơn mua thẻ. Chạy nó sẽ đỏ, nên DỪNG và hỏi chủ quán.
- NGUYÊN TẮC (KHUON_LOI K3): một đột biến bỏ CẢ HAI vế cùng lúc không chứng minh được vế nào. Ca "lệch đúng một phép" phải chọn đầu vào sao cho các vế khác đều đúng. Ví dụ: đơn cùng loại, khác trị giá; và đơn khác loại, cùng trị giá.
- NGUYÊN TẮC (K4): khi phủ "huỷ X" thì phải liệt kê đủ cả "xoá X" cho mọi đối tượng (gói, thẻ, mã, điểm). Đối tượng nào không phủ thì ghi CHƯA PHỦ ngay trong trang_thai.
- NGUYÊN TẮC: "thoát 0" không phải bằng chứng cho "0 CẢNH BÁO". Phải chép nguyên dòng `ĐẾM` vào hồ sơ.

## Vòng sửa 1/3 (sau soát vòng 1, 09.10)
| Lỗi soát | Xử lý |
|---|---|
| 1. I13 bỏ MỘT vế WHERE vẫn SỐNG | Dữ liệu tay I13: mã A đổi sang percent 10; thêm đơn gõ mã "cùng loại khác trị giá" (percent 5) và "khác loại cùng trị giá" (fixed 10). Đột biến `BV-I13-loai-ma` (bỏ cả hai) thay bằng `BV-I13-bo-loai`, `BV-I13-bo-tri-gia` — cả hai BẮT. Rà luôn mọi WHERE nhiều vế của bất biến mới: thêm `BV-I14-bo-product-id`, `BV-I14-tro-bo-not-null`, `BV-I14-mua-bo-co-goi`, `BV-I14-mua-bo-lay-ngay`, `BV-I15-bo-sdt`, `BV-I15-bo-mon-the`, `BV-I17-bo-approved` + dữ liệu sạch tương ứng (món thẻ 0đ trong đơn lấy, đơn lẻ không gói, đơn mua gói không lấy ngay, đơn thẻ không SĐT, đơn thường có SĐT) — tất cả BẮT. |
| 2. Ca I12 "không có mã" vi phạm 4 phép | I12 đọc mã bằng truy vấn con (không JOIN) nên ca "mã trùng hai dòng" chỉ vi phạm vế số mã; bỏ ca gộp; thêm `BV-I12-so-ma` — BẮT. |
| 3. Xoá đơn mua thẻ chưa phủ | Lộ lỗi tiền mới → Q7, Phát hiện 10, CHƯA PHỦ. Không tự thêm kịch bản đỏ. |
| 4. Bỏ `sxGia.kb = i + 1` SỐNG | KB24 ghi số kịch bản bật lỗi, KB25 khẳng định công tắc đã tắt và số kịch bản = KB24 + 1. Đột biến `BV-B4-kb-khong-gan` — BẮT. |
| 5. Thiếu D2, E, dòng ĐẾM | Thêm mục D2 (CHƯA KIỂM), E (chép dòng ĐẾM `npm test` + `--day-du`). |
| 6. ke_hoach còn ghi I13 `discount_amount > 0`; số dòng loyalty lệch | Sửa ke_hoach. |
| NGHI NGỜ: KB21 hoàn trọn gói | Q8. |
| NGHI NGỜ: mua gói mới + lấy gói cũ | Q9, Phát hiện 11. |
| NGHI NGỜ: A1 chưa đo thu_gia_lap / --day-du | Đo bù trên `025106b` (bảng số đo). |
| NGHI NGỜ: "55 BẮT + 2" mơ hồ | Ghi rõ 67 = 66 mong BẮT + 1 mong LẠC; nhật ký lần chạy cuối tóm ở mục C3. |
Sau vòng sửa: C3 67/67; `thu_gia_lap` 102/0 (90,5 s); giả lập 27 · 16 ĐẠT (80,7 s); `--day-du` PASS 65 · 0 CẢNH BÁO; bằng chứng đỏ
trên gốc chạy lại (45/57, SỐ CA 102). C1, C2, C4 chạy lại đủ trên head cuối `31afeb0` — mục "Chạy lại trên HEAD CUỐI".

## Vòng sửa 2/3 (theo lời chốt Q7–Q9, 09.10)
- KB21 (`kich_ban.js`): ca hai nhân viên huỷ đơn mua gói ĐÃ GIAO 2/3 chồng nhau → 200 + 400 `DON_KHONG_HUY_DUOC`, đúng MỘT dòng
  hoàn (`c.dongHoan`), gói `cancelled`; bỏ khẳng định "ví + trọn giá". Ca gói CHƯA giao: thêm khẳng định ví + TRỌN giá gói.
- Q7, Q9: không thêm kịch bản; Phát hiện 10, 11 (gom P26c); Phát hiện 10 ghi CHƯA PHỦ.

## Soát độc lập — vòng 2 (`/ra-soat`, agent general-purpose mới, 09.10) — chép nguyên báo cáo

KHÔNG ĐẠT

Tôi đã soát HEAD df37411. Về code, HEAD trùng 31afeb0 và fb59762, vì hai commit cuối chỉ sửa trang_thai.md. Tôi không sửa file nào trong kho. `git status` sạch và `git log origin/viec/LUOI-1..HEAD` rỗng. Đột biến của riêng tôi chạy trên bản chép thật (copytree) đặt trong thư mục nháp, ngoài kho.

Các lệnh tôi đã chạy, từng lệnh một, không chạy song song:
- `npm test`: PASS 61 · FAIL 0 · CẢNH BÁO 0.
- `thu_gia_lap --chi-du-lieu-tay`: 62 đạt · 0 hỏng.
- `do_thoi_gian.js gl`: 81,2 s, "27 kịch bản · 16 bất biến · ĐẠT".
- `do_thoi_gian.js kiem` (`--day-du`): 278,8 s, PASS 65 · FAIL 0 · CẢNH BÁO 0.
- `viec/LUOI-1/dot_bien.py` với BV-I13*, BV-I12-so-ma, BV-B4-kb-khong-gan, VS-I16-tien-chi-tren: 6/6 BẮT.
- `viec/AUDIT-1/dot_bien.py` với C2F-orders-21-update-quay, C2F-wallets-08-insert-quay: cả hai BẮT, kho thật không đổi.

**Lỗi vòng 1 — đã sửa thật chưa:**
1. I13 bỏ từng vế loại / trị giá: đã sửa. BV-I13-bo-loai và BV-I13-bo-tri-gia đều BẮT; dữ liệu tay ở thu_gia_lap.js có đủ ca "cùng loại khác trị giá" và "khác loại cùng trị giá".
2. Ca I12 vi phạm gộp nhiều phép: đã sửa. bat_bien.js:186–189 đọc mã bằng truy vấn con; BV-I12-so-ma BẮT.
3. Xoá đơn mua thẻ: đã ghi CHƯA PHỦ ở Phát hiện 10 (trang_thai.md:315–317), theo Q7 (a). Tôi đã đối chiếu: orders.js:1462–1590 không chạm `pos_membership_purchases`; Orders.jsx:242 và :1228–1245 cho chọn xoá đơn chưa huỷ.
4. Bỏ `sxGia.kb = i + 1`: đã sửa. BV-B4-kb-khong-gan BẮT (KB25 → HTTP).
5. Hồ sơ thiếu D2, E và dòng ĐẾM: đã sửa (trang_thai.md:205–211).
6. ke_hoach mô tả I13 sai: đã sửa ở mục 5. Nhưng chỗ khác vẫn lệch, xem lỗi 3 dưới.

LỖI TÌM ĐƯỢC:
1. **cong_cu/gia_lap/bat_bien.js:261 (I16) — nhánh "đổi sang CHUYỂN KHOẢN" không có ca thử, không ở đâu trong cả bộ thử.** Khuôn K3 + K4.
   - Phép kiểm `so(ct.sang === 'cash' ? r.transfer_amount : r.cash_amount) === 0` chỉ từng chạy với dòng đổi cuối là `cash`:
     - dữ liệu tay ở thu_gia_lap.js (khung I16) chỉ có `"sang":"cash"`;
     - giả lập chỉ có một lời gọi đổi cách trả, `c.doi(d.id, 'cash', …)` ở kich_ban.js:97.
   - Tôi chạy thử hai đột biến, cả hai SỐNG trên `--chi-du-lieu-tay` và trên toàn giả lập ("27 kịch bản · 16 bất biến · ĐẠT"):
     - `I16-luon-cot-ck`: thay ternary bằng `so(r.transfer_amount) === 0`, tức luôn soát cột chuyển khoản.
     - `SRV-doi-tm-luon-du`: sửa server/routes/don-mo-rong.js:151 để đổi sang CK mà tiền mặt vẫn giữ nguyên → đơn ghi gấp đôi.
   - Vì vậy phiếu B5 ("đổi cách trả ghi đúng số tiền mặt/chuyển khoản") và C3 ("mỗi bất biến mới … phải BẮT") mới đạt một chiều. Trang_thai và ke_hoach không ghi CHƯA PHỦ cho chiều này.
   - Cách sửa: thêm ca tay "đổi sang transfer mà tiền mặt còn ≠ 0" và một đột biến cho nhánh này. Nên thêm cả một kịch bản đổi sang CK để bắt được đột biến phía máy chủ.
2. **bat_bien.js:209 (I13) — vế chặn `so(r.usage_limit) > 0 &&` không có ca sạch nào đi qua.** Khuôn K5.
   - Mã không giới hạn (`usage_limit` 0, là mặc định ở discount-codes.js:210; validate coi 0 là không giới hạn ở discount-codes.js:94) không xuất hiện trong dữ liệu tay hay giả lập với `used_count` > 0.
   - Đột biến `I13-bo-gioi-han-0` (bỏ vế chặn) SỐNG ở cả tay lẫn giả lập. Nghĩa là luồng hợp lệ "mã dùng nhiều lần, không giới hạn" không có ca "phải KHÔNG lệch".
3. **viec/LUOI-1/ke_hoach.md:66 và :93–96 — hồ sơ còn mô tả hành vi mà code không còn làm.** Khuôn K4/K1 về tài liệu.
   - :66 vẫn ghi KB21 ca huỷ chồng "ví + giá gói ĐÚNG MỘT lần". Sau Q8 (b), kich_ban.js (KB21) chỉ khẳng định một dòng hoàn + gói cancelled; vòng sửa 2 không sửa ke_hoach.
   - :93–96 ghi I8 so "tổng điểm mỗi khách = Σ earn − Σ |redeem|". Trong khi bat_bien.js:128–130 ghi rõ là KHÔNG so số dư.
4. **bat_bien.js:104 (I7 vế b) — `n !== 1` là vế chết.** Khuôn K3, nhẹ.
   - Đột biến bỏ riêng `n !== 1` SỐNG. Vế này thừa: n ≥ 2 thì đã bị :105 hoặc :106 bắt.
   - Đột biến BV-I7-b-no-da-xong bỏ CẢ HAI vế cùng lúc, đúng kiểu mà lỗi 1 vòng 1 đã chỉ ra. Bỏ riêng `dem.get(vt) !== 1` thì BẮT (tôi đã chạy).
   - Không mất phủ, nhưng code có một vế không giết được mà không ghi lý do.

NGHI NGỜ:
- **Thời gian `thu_gia_lap`:** 93,7 s so với ngưỡng 96 s (97,6 %). Máy CI cho `cong-chay` chưa đo. Hồ sơ đã ghi CHƯA KIỂM, nhưng chỉ cần thêm một kịch bản nữa là vượt ngưỡng.
- **Chú thích S4 lệch số đo cuối:** kiem_tra_truoc_khi_giao.js ghi "~79 s" và "~92 s", số đo cuối là 80,5 s và 93,7 s.
- **I12 (bat_bien.js:184–195) không soát `max_discount` / `valid_to` của mã đổi điểm** (loyalty.js:179–183). Đột biến ghi `max_discount` = 0, làm quà phần trăm mất trần, sẽ sống. Phiếu B1 không đòi, nhưng đây là trường chạm tiền chưa có lưới.
- **Tự đẩy sổ nợ** (doSoNo.js:16, 114–121; `lanCuoi` = 0, giãn cách 3 phút) chỉ chạy khi một lượt giả lập vượt 180 s. Ke_hoach:76 nói dưới hạn 110/120 s thì không xảy ra. Nhưng timeout đột biến trong dot_bien.py là 300 s, nên máy quá tải có thể cho KB25/KB27 đỏ oan. Chưa thấy xảy ra.
- **Lệch số dòng nhỏ:** ke_hoach và trang_thai ghi packages.js deliver ":170–181" (thật là :171–185) và cancel ":186" (thật là :188).

NGHIỆM THU:    15/16 mục có bằng chứng · mục thiếu: B5 (chiều đổi sang chuyển khoản; C3 cũng có lỗ, xem lỗi 1)
- A0 ✓ ke_hoach §0 (67,1 s / 74,9 s / 201,8 s, 4 lõi).
- A1 ✓ chay.js:181/:186. Đo lại sau A1: 58,3 s, có số đo bù.
- A2 ✓ ước + đo: 81,2 s giả lập (tôi đo); thu_gia_lap 93,7 s < 96 s.
- B1 ✓ KB19 + I8 vế đổi điểm + I12.
- B2 ✓ KB20 + I13 (theo Q1/Q6).
- B3 ✓ KB21–23 + I14/I15; ghi CHƯA PHỦ cho Q7, Phát hiện cho Q8/Q9.
- B4 ✓ KB24/25/27 + I7 + công tắc.
- B5 ✗ một phần: đối soát / duyệt hoàn / increment-usage có; đổi cách trả chỉ có chiều cash.
- B6 ✓ kiem_tra:753–754 (27 / 16).
- C1 ✓ hồ sơ ghi 21/21; tôi tự chạy lại 2/21, cả hai BẮT.
- C2 ✓ hồ sơ ghi 40/40.
- C3 ✓ 67/67 theo hồ sơ (tôi chạy lại 6), nhưng có lỗ như lỗi 1.
- C4 ✓ hồ sơ.
- D1 ✓ khớp `git log`.
- D2 ✓ ghi CHƯA KIỂM.
- E ✓ tôi đã chạy lại: npm test PASS 61 · CẢNH BÁO 0; `--day-du` PASS 65 · CẢNH BÁO 0.

P1: `git diff --stat 9521cec HEAD` trên server, client, tu_chay, .claude, .github, package.json, CHECKLIST_CODE.md, CLAUDE.md, viec/AUDIT-1, viec/HOC-1, viec/HOC-2, sổ việc đều rỗng. `--day-du` xanh, nên dist khớp src.

Đường tiền: không thấy kịch bản nào khẳng định sai so với code tôi đã đọc.
- Cancel orders.js:1296–1458: hoàn ví :1332; gói đã giao > 0 → cancelled, = 0 → DELETE + gỡ trỏ; xoá dòng thẻ :1366–1373.
- Delete orders.js:1462–1590.
- Đổi điểm loyalty.js:168–192.
- KB23/KB27 né P26c (4)/(14), nhưng có ghi lý do.

CHƯA SOÁT ĐƯỢC:
- Không chạy lại đủ C1+C2 (87 đột biến, khoảng 32 phút) và C4. Chỉ chạy mẫu 2/21 của C1 và 6/67 của C3.
- Không xem được GitHub: D2 và thời gian trên máy CI.
- Chưa kiểm KB25 có đỏ oan khi giả lập vượt 180 s hay không.
- Đột biến ở don-mo-rong.js tôi chỉ chạy qua giả lập, không qua P26a/P26b.

BÀI HỌC:
- **KHOÁ:** mỗi ternary hoặc nhánh `sang === X ? … : …` trong bất biến phải có một ca tay cho TỪNG nhánh, kèm một đột biến "luôn đi một nhánh". Có thể thêm phép tự động vào dot_bien.py để sinh đột biến cho mỗi `? :` trong bat_bien.js.
- **KHOÁ:** mỗi vế chặn (`x > 0 &&`, `!= null &&`, `status !== 'cancelled' &&`) phải có một ca SẠCH đi qua nó, kèm đột biến "bỏ vế chặn" phải BẮT. Đây là chiều K5 của "bỏ một điều kiện".
- **NGUYÊN TẮC (K3):** vế không giết được, nếu thừa thật (như `n !== 1` ở I7), thì xoá đi hoặc ghi lý do ngay tại dòng. Không để đột biến bỏ hai vế cùng lúc che mất nó.
- **NGUYÊN TẮC (K4 tài liệu):** khi chủ quán chốt đổi một khẳng định (Q8), grep CẢ ke_hoach.md lẫn trang_thai.md tìm câu cũ. Vòng sửa 2 chỉ sửa kich_ban.js và trang_thai.
- **NGUYÊN TẮC (K4):** phủ một thao tác hai chiều (đổi cash ↔ transfer, nạp ↔ trừ) thì liệt kê cả hai chiều; chiều nào không phủ thì ghi CHƯA PHỦ.

## Vòng sửa 3/3 (sau soát vòng 2, 09.10) — vòng CUỐI
| Lỗi soát vòng 2 | Xử lý |
|---|---|
| 1. I16 nhánh "đổi sang CK" không có ca | Dữ liệu tay thêm đơn D2 đổi sang CK (sạch) + ca "đổi sang CK mà tiền mặt chưa về 0"; đột biến `BV-I16-nhanh-ck` (bỏ soát nhánh CK — ca mới bắt), `VS-I16-luon-cot-ck`, `VS-I16-luon-cot-tm` (bộ sạch bắt). KB26 thêm đơn tiền mặt → đổi sang CK; đột biến máy chủ `VS-SRV-doi-ck-giu-tien-mat` BẮT (`KB26 → I16`). **Sau Q10 (a): đơn này ĐÃ BỎ khỏi KB26, đột biến mong đợi SỐNG — Phát hiện 13.** Hai ca I16 cũ thiếu `WHERE id = 1` (chạm cả D2) — sửa ca, không sửa bất biến (K2: truy nguyên trước). → **Q10** (thời gian). |
| 2. I13 vế chặn `usage_limit > 0` không có ca sạch | Bộ sạch thêm mã C không giới hạn (0) dùng 2 lần; đột biến `BV-I13-bo-gioi-han-0` BẮT. |
| 3. ke_hoach :66, :93–96 lệch code | Sửa (KB21 theo Q8 b; I8 không so số dư, ca điểm hết hạn CHƯA KIỂM). Số dòng packages.js sửa thành :171–185 (deliver), :187 (cancel). |
| 4. I7 vế `n !== 1` chết | Bỏ vế, ghi lý do tại dòng; `BV-I7-b-no-da-xong` neo vào vế còn lại. |
| NGHI NGỜ: I12 không soát trần giảm | Thêm vế trần giảm (`max_discount`) của mã = quà + ca tay + `BV-I12-tran` BẮT. Hạn mã (`valid_to`) ghi CHƯA KIỂM tại chú thích I12. |
| NGHI NGỜ: chú thích S4 lệch số đo | Sửa theo số đo cuối sau khi chủ quán chọn Q10. |
| NGHI NGỜ: tự đẩy sổ nợ khi > 180 s | Giữ như đã ghi (ke_hoach mục 3): chỉ khi một lượt giả lập > 180 s; chưa thấy xảy ra. |

Kết quả sau vòng sửa 3: dữ liệu tay 64/0; C3 `python3 viec/LUOI-1/dot_bien.py -j 4` **73 · BẮT 72 · LẠC 1 (mong đợi) · 73/73 đúng
mong đợi** (257 s); giả lập 27 · 16 ĐẠT **82,4 s**; `thu_gia_lap` 104/0 **96,1 s — VƯỢT 96 s** → DỪNG (Q10). Chưa chạy lại C1, C2,
C4 và bằng chứng đỏ trên gốc (bài thử đổi — SỐ CA sẽ thành 104) — làm sau Q10.

## Sau Q10 (a) (09.10)
- KB26 bỏ đơn đổi tiền mặt → CK; `viec/LUOI-1/dot_bien.py`: `VS-SRV-doi-ck-giu-tien-mat` mong đợi SỐNG (ghi lý do + việc sau
  phải đổi thành BẮT); Phát hiện 13. `thu_gia_lap` 93,4 s (< 96 s). Chú thích S4 (`kiem_tra_truoc_khi_giao.js`) theo số đo cuối.
- Chạy lại đủ trên code cuối `2e6e524`: mục "Chạy lại trên CODE CUỐI".

## Soát độc lập — vòng 3 (`/ra-soat`, agent general-purpose mới, 09.10) — chép nguyên báo cáo

> Chủ quán dặn: soát lần 3 KHÔNG ĐẠT thì KHÔNG sửa thêm — chép nguyên báo cáo, push, DỪNG (chat soát thay như HOC-2b).
> Không có vòng sửa nào sau báo cáo này.

KHÔNG ĐẠT

Phạm vi soát: code cuối 2e6e524, HEAD 51e080f. `git status` sạch, `git log origin/viec/LUOI-1..HEAD` rỗng. `git diff --stat 9521cec HEAD` trên server, client, tu_chay, .claude, .github, package.json, CHECKLIST_CODE.md, CLAUDE.md, KHUON_LOI.md, viec/AUDIT-1, viec/HOC-1, viec/HOC-2 và sổ việc đều rỗng. Tôi không sửa file nào trong kho. Đột biến của tôi chạy trên bản chép thật trong scratchpad.

Tôi chạy tuần tự, không lệnh nào song song:
- `npm test`: PASS 61 · FAIL 0 · CẢNH BÁO 0.
- `thu_gia_lap --chi-du-lieu-tay`: 64 đạt.
- Giả lập: 80,6 s, "27 kịch bản · 16 bất biến · ĐẠT".
- `--day-du`: 266,6 s, PASS 65 · FAIL 0 · CẢNH BÁO 0.
- AUDIT-1 `C2F-orders-39-insert-quay`, `C2F-packages-05-update-quay`, `C2F-orders-24-delete-quay`: cả 3 BẮT, kho thật không đổi.
- LUOI-1 `VS-SRV-doi-ck-giu-tien-mat`, `BV-I12-tran`, `BV-I7-d-no-phai-co-loi`, `VS-I8-qua-chi-tren`: 4/4 đúng mong đợi (SỐNG, BẮT, BẮT, BẮT).

**Lỗi vòng 2 — đã sửa thật chưa:**
1. I16 nhánh CK: có ca tay (`I16 đổi sang chuyển khoản mà tiền mặt chưa về 0`), `BV-I16-nhanh-ck` BẮT. Phía máy chủ thì CHƯA PHỦ theo Q10 (a), đã ghi ở Phát hiện 13; tôi chạy lại, `VS-SRV-doi-ck-giu-tien-mat` SỐNG như mong đợi. Đã sửa đúng theo lời chốt.
2. I13 vế chặn `usage_limit > 0`: có mã C không giới hạn (0) trong bộ sạch, `BV-I13-bo-gioi-han-0` có trong bộ. Đã sửa.
3. ke_hoach.md :66 và :93–96: đã sửa (dòng KB21 ở :65, I8 ở :96).
4. I7 `n !== 1`: đã bỏ, có chú thích tại dòng. Nhưng cùng dạng "vế không giết được" vẫn còn ở chỗ khác — xem lỗi 2 dưới.

LỖI TÌM ĐƯỢC:
1. `cong_cu/gia_lap/bat_bien.js` (I12, vế `so(r.tran) !== so(r.tran_qua)`) và `cong_cu/thu_gia_lap.js` (ca "I12 mã mất trần giảm (0 thay vì 2.000)") — trần giảm chỉ thử MỘT phía, và lệch xa (0 so với 2000). Phiếu C3 đòi lệch ÍT, cả hai phía. **Khuôn K3.**
   - Tôi chạy hai đột biến trên dữ liệu tay, cả hai SỐNG: `so(r.tran) < so(r.tran_qua)` và `Math.abs(...) > 1000`.
   - Phía bị bỏ ngỏ là phía mất tiền: mã có trần CAO hơn quà nghĩa là khách được giảm nhiều hơn.
2. Còn ba vế chặn hoặc vế thừa không đột biến nào giết được, cũng không có lời giải thích tại dòng. Đây đúng là bài học vòng 2 ("xoá đi hoặc ghi lý do ngay tại dòng"). Tôi chạy cả ba đột biến bỏ vế, cả ba SỐNG. **Khuôn K3.**
   - I7: `!r.van_tay ||`. Ca "I7 dòng nợ không vân tay" tên thì nói thử vế này, nhưng thật ra ca đó bị `!loi.has` bắt.
   - I8: `r.gia != null &&` không có ca sạch nào đi qua.
   - I17: `r.tid == null ||` thừa, vì `r.type` lúc đó đã là null.
   - Nhẹ hơn: `COALESCE(type,'')` ở I8 và `COALESCE(customer_phone,'')` ở I15 cũng không có ca nào. Đổi COALESCE ở I8 thì SỐNG; đổi ở I15 sang `IS NOT NULL` cũng SỐNG.
3. `cong_cu/gia_lap/kich_ban.js` KB25 (mong "hai người cùng bấm → không gửi thêm") — ca này vô giá trị. **Khuôn K3** (ca "phải KHÔNG X" mà đầu vào không đủ điều kiện kích hoạt X).
   - Lệnh bấm chồng `[r3, r4]` chạy sau khi r1 đã đẩy hết nợ và r2 ra `xong` 0, tức sổ nợ đã rỗng.
   - Tôi bỏ khoá `if (dangChay) return …` ở `server/utils/doSoNo.js:39` rồi chạy `--den-kb 25`: "25 kịch bản · 16 bất biến · ĐẠT", SỐNG.
   - Khoá chống hai người bấm cùng lúc vì vậy không có lưới. Phần "bấm lại không trừ hai lần" (tuần tự) thì có lưới. Muốn ca chồng có giá trị, lệnh bấm chồng phải là lần đẩy ĐẦU, lúc còn 3 dòng nợ; khi đó I7 sẽ đếm SX nhận 2 lần.
4. I12 phía máy chủ chưa phủ mà không ghi CHƯA PHỦ — cùng dạng với Phát hiện 13. **Khuôn K4.**
   - KB19 tạo quà không có `max_discount`, nên `rewards.js:46` lưu 0. Quà là loại `fixed`.
   - Vì vậy các đột biến sau ở `loyalty.js:183` cho kết quả y hệt trong giả lập: bỏ `reward.max_discount || 0` (mã % mất trần, giảm không giới hạn), hay viết cứng `'fixed'` cho loại mã.
   - Vế trần chỉ được thử trên dữ liệu tay. trang_thai (dòng vòng sửa 3 về I12) và ke_hoach mục 11b không ghi điều này.
5. viec/LUOI-1/trang_thai.md còn nhiều câu cũ lệch với code cuối và với chính mục "Chạy lại trên CODE CUỐI" (:46–48). **Khuôn K4 (tài liệu).**
   - :223 (mục E, ghi là "code cuối 2e6e524"): ghi "thu_gia_lap 102 đạt", trong khi thật là 104.
   - :193–194 (C3, "Lần chạy cuối"): ghi "67 · BẮT 66 · SỐNG 0", trong khi thật là 73 · BẮT 71 · LẠC 1 · SỐNG 1.
   - :20: ghi "60 ca dữ liệu tay", thật là 62 ca LUOI-1 (64 nếu tính cả I2).
   - :27–29: cột "head cuối" là số của 31afeb0 (80,5 s · 93,7 s 102/0 · 266,2 s).
   - :205: bảng "chỗ đổi → đột biến" còn dòng "KB26 đổi tiền mặt → CK", là chỗ đổi đã bỏ.
   - :34: ghi "C3 163 s", lần chạy cuối là 258 s.
6. viec/LUOI-1/ke_hoach.md. **Khuôn K1/K4 (tài liệu).**
   - :147 ghi "Dùng lại máy chạy của viec/AUDIT-1/dot_bien.py (nạp bằng runpy…)". Sai: `viec/LUOI-1/dot_bien.py` có máy chạy riêng, không có runpy.
   - :111–112 (I16) và :200 (danh sách "Không phủ") không nhắc chiều CK phía máy chủ (Phát hiện 13), xoá đơn mua thẻ (Phát hiện 10), hay vế trần I12 (lỗi 4).

NGHI NGỜ:
- I13 (`bat_bien.js`) so loại và trị giá trên đơn với mã HIỆN TẠI. `PUT /discount-codes/:id` (`discount-codes.js:266–291`) cho chủ đổi loại, trị giá, mã, `usage_limit` của mã đã dùng, kể cả hạ `usage_limit` dưới `used_count`. Khi đó I13 sẽ đỏ oan trên một luồng quản trị hợp lệ. Chú thích "Giới hạn" của I13 không ghi điều này. I8 vế đổi điểm cũng so với `points_cost` hiện tại (`PUT /rewards/:id`, `rewards.js:75`) mà chú thích không ghi; I12 thì có ghi. Hiện chưa kịch bản nào làm vậy, nên đây là rủi ro K5 cho các việc sau.
- Ba ca tay có mẫu kết luận yếu, không nói được vế nào đã bắn: `/mã MA1/` (I12 SĐT khác), `/yêu cầu hoàn #1/` (I17 đơn khác, SĐT khác). Hiện có đột biến BV tương ứng bù lại.
- Thời gian: thu_gia_lap 93,4 s, sát ngưỡng 96 s. Máy CI chưa đo. Tự đẩy sổ nợ (`doSoNo.js:114–121`) sẽ chạy nếu một lượt giả lập vượt 180 s; dot_bien cho phép tới 300 s nên KB25/KB27 có thể đỏ oan khi máy quá tải. Đã ghi, chưa thấy xảy ra.

NGHIỆM THU:    15/16 mục có bằng chứng · mục thiếu: C3 (I12 trần chỉ thử một phía và lệch xa; 3 vế không giết được — lỗi 1, 2)
- A0 ✓ ke_hoach.md:6–15 (67,1 s · 74,9 s · 201,8 s, 4 lõi).
- A1 ✓ chay.js: `treMs = TRE_MS` trước mỗi kịch bản, `treMs = 0` trước vòng bất biến; số đo bù 58,3 s và trên 025106b.
- A2 ✓ tôi đo: giả lập 80,6 s; thu_gia_lap nằm trong `--day-du` và không ra CẢNH BÁO.
- B1 ✓ KB19 + I8 vế đổi điểm + I12 (phía máy chủ của trần chưa phủ — lỗi 4).
- B2 ✓ KB20 + I13, theo Q1 (a) và Q6 (a).
- B3 ✓ KB21–23 + I14/I15; Q7, Q8, Q9 đã ghi.
- B4 ✓ KB24, KB25, KB27 + I7 + công tắc; ca bấm chồng vô giá trị (lỗi 3).
- B5 ✓ theo Q10 (a): đối soát, duyệt hoàn, increment-usage, đổi sang tiền mặt; chiều CK CHƯA PHỦ đã ghi.
- B6 ✓ kiem_tra_truoc_khi_giao.js: 27 / 16, chú thích S4 theo số đo cuối.
- C1 ✓ hồ sơ ghi 21/21; tôi chạy lại 3/21, cả 3 BẮT.
- C2 ✓ 40 tên in đủ; số cộng khớp (62 BẮT = 40 + 22; 45 SỐNG = 23 + 22).
- C3 ✗ lỗi 1, 2.
- C4 ✓ theo hồ sơ.
- D1 ✓ cha của 9521cec là 769adfe.
- D2 ✓ ghi CHƯA KIỂM.
- E ✓ tôi chạy lại, xanh và 0 CẢNH BÁO; nhưng dòng E trong trang_thai ghi số cũ (lỗi 5).

CHƯA SOÁT ĐƯỢC:
- Chưa chạy lại đủ C1+C2 (87 đột biến, ~32 phút), C3 (73) và C4. Chỉ chạy mẫu 3/21 của C1 và 4/73 của C3.
- Chưa đối chiếu từng tên trong 40 tên C2 với danh sách 45 SỐNG gốc: HOC-2b D5 không liệt kê tên, chỉ kiểm được số cộng.
- Không xem được GitHub: D2 và thời gian trên máy CI.
- Đột biến bỏ trần `loyalty.js:183` chỉ suy từ code (KB19 gửi quà không có `max_discount`, `rewards.js:46` lưu 0), CHƯA CHẠY.
- Chưa xem KB25/KB27 có đỏ oan khi giả lập vượt 180 s hay không.

BÀI HỌC:
- KHOÁ: thêm vào `dot_bien.py` một bước tự sinh đột biến "bỏ từng vế `||` / `&&`" cho mọi biểu thức lọc trong `bat_bien.js`. Vế nào SỐNG thì hoặc xoá, hoặc phải có chú thích "thừa vì …" tại dòng thì bước kiểm mới qua. Đây là lần thứ ba vế chết lọt qua (vòng 1 I13, vòng 2 I7, vòng 3 I7/I8/I17).
- KHOÁ: mỗi phép so bằng trên cột tiền (trần, trị giá, số tiền) phải có hai ca tay ±1 quanh giá trị chuẩn. Có thể đếm tự động: mỗi `!==` trên cột tiền phải có ít nhất 2 ca mang tên vế đó.
- NGUYÊN TẮC (K3): ca "chồng nhau / bấm cùng lúc" phải chạy khi còn việc để làm (sổ nợ chưa rỗng, mã chưa dùng). Bằng chứng cho ca đó là đột biến bỏ khoá chống chồng phải ĐỎ (ở đây: `dangChay` của `doSoNo.js`).
- NGUYÊN TẮC (K4): vế bất biến chỉ thử trên dữ liệu tay mà kịch bản không bao giờ chạm tới (trần I12, loại % của quà, chiều CK của I16) thì phải ghi "CHƯA PHỦ phía máy chủ", đúng như Phát hiện 13. Tìm bằng cách hỏi "dữ liệu kịch bản có giá trị khác mặc định cho cột này không?".
- NGUYÊN TẮC (K4 tài liệu): sau mỗi lần chạy lại số nghiệm thu, grep cả trang_thai lẫn ke_hoach tìm mọi chỗ nhắc số cũ (102, 67, 93,7, 80,5, 266,2, "head cuối") rồi thay hoặc ghi "(cũ)". Vòng này để sót 6 chỗ, có chỗ ngay trong dòng nghiệm thu E.

## Chat soát thay vòng 4 (10.10.2026) — SỐ NGHIỆM THU CUỐI

Soát vòng 3 KHÔNG ĐẠT, máy hết `so_vong_sua_toi_da` → máy dừng (đúng lời chủ quán), chat soát thay như HOC-2b. Chat clone
`4a7a25a`, kiểm từng lỗi trên code thật, sửa, chạy lại; chủ quán đặt bản sửa lên nhánh bằng `sua_LUOI1.py` (vân tay từng file).
`server/`, `client/`, `tu_chay/` vẫn KHÔNG đổi.

| Lỗi soát vòng 3 | Chat kiểm | Sửa |
|---|---|---|
| 1. I12 trần chỉ thử một phía, lệch xa | Đúng | Ca tay `I12 mã trần 1.999`, `I12 mã trần 2.001`; đột biến `VS-I12-tran-chi-duoi`, `VS-I12-tran-chi-tren`, `VS-I12-tran-lech-1000` → BẮT |
| 2. Vế không giết được | Đúng | I7 `!r.van_tay`: KHÔNG thừa (SX giả ghi `van_tay \|\| null`, `chay.js:77`) → tách phép riêng "nợ kho KHÔNG vân tay" + ca tay chỉ nó bắt + `BV-I7-no-khong-van-tay`. Bỏ `r.tid == null \|\|` (I17) — thừa, lý do ghi tại dòng. Bỏ `r.gia != null &&` (I8) làm vế "số quà" mất ca riêng → thêm ca `I8 dòng đổi 0 điểm không quà nào trỏ tới (chỉ vế số quà)`; ca `I8 dòng điểm không có loại (NULL)` + `BV-I8-loai-null`; đơn thẻ SĐT rỗng `''` vào bộ sạch I15 + `BV-I15-sdt-rong` |
| 3. KB25 bấm chồng vô giá trị | Đúng (chat chạy: bỏ khoá `dangChay` vẫn xanh) | KB25: hai người bấm chồng ở lần đẩy ĐẦU (còn 3 nợ), rồi bấm lại. Đột biến máy chủ `VS-SRV-bo-khoa-dangChay` → BẮT (SX nhận 6 thay 3; KB25 HTTP + I7) |
| 4. Trần / loại % mã đổi điểm phía máy chủ chưa phủ, không ghi | Đúng | Phát hiện 14 (CHƯA PHỦ, việc chia giả lập thêm quà % có trần); chú thích tại I12 |
| 5. `trang_thai.md` số cũ | Đúng | Bảng cũ ghi "(cũ)"; số cuối ở mục này; dòng 60 → 67 ca (cuối: 69 ca tay LUOI-1 — xem bảng số đo); bảng chỗ đổi → đột biến cập nhật; danh sách tên 80 |
| 6. `ke_hoach.md` sai | Đúng | Bỏ câu `runpy`; I16 và "Không phủ" thêm Phát hiện 10, 13, 14, 15 |
| Nghi ngờ: I12/I13/I8 so với mã/quà hiện tại; tự đẩy sổ nợ 180 s | Đúng là giới hạn | Phát hiện 15 + chú thích tại I13 |

Số đo (máy CHAT 1 lõi, chạy RIÊNG, tuần tự — máy chat chậm hơn máy mây ở `thu_gia_lap` vì chạy giả lập con song song):
| Lệnh | Kết quả |
|---|---|
| giả lập `chay.js` | 79,1 s · Giả lập: 27 kịch bản · 16 bất biến · ĐẠT (lần trước 80,1 s) |
| `thu_gia_lap.js` | 95,3 s · 109 đạt · 0 hỏng (lần trước 102,7 s; bản `2e6e524` trên CÙNG máy 104,1 s · 104/0 → bản sửa không chậm hơn; máy mây đo `2e6e524` 93,4 s) |
| `--chi-du-lieu-tay` | 69 đạt · 0 hỏng |
| `kiem_tra --day-du` | 280,3 s · PASS 65 · FAIL 0 · CẢNH BÁO 1 (= `thu_gia_lap` > 96 s trên máy 1 lõi — bản `2e6e524` ở máy này cũng vậy; máy mây đo 0 CẢNH BÁO) |
| `npm test` | thoát 0 · Qua hết |
| C3 `python3 viec/LUOI-1/dot_bien.py` (bản cuối) | **80/80 đúng mong đợi**: dữ liệu tay 69/69 BẮT (`'BV-I*' 'VS-I*'`), kịch bản 11/11 (`GOC-*`, `BV-A1*`, `VS-A1*`, `BV-B4*`, `VS-B4*`, `VS-SRV*` — LẠC `GOC-KB10-cu-tre-khong-bat-lai`, SỐNG `VS-SRV-doi-ck-giu-tien-mat` theo Q10 a, còn lại BẮT). Lần chạy đủ 79 trước đó lộ `VS-I8-qua-chi-tren` SỐNG → thêm ca I8; soát lại lộ chú thích I7 sai → khôi phục phép "nợ kho KHÔNG vân tay" |
| C1 `python3 viec/AUDIT-1/dot_bien.py <21 tên> -j 2` | **21/21 BẮT** (C2 BẮT 1 · C2F BẮT 20 · SỐNG 0 · HỎNG 0 · LẠC 0) · 1062 s · "✓ kho thật không đổi" |
| Bằng chứng đỏ (`thu_gia_lap` của HEAD trên `git archive 9521cec`) | thoát 1 · **45 đạt · 64 hỏng** · `SỐ CA cong_cu/thu_gia_lap.js: 109` (`bang_chung_do.txt`) |
| Neo mọi bộ (`viec/HOC-2b/kiem_neo.py`) | AUDIT-1 173/174 (HỎNG `G3-sai-chuoi` cố ý), P26b 59, HOC-1 20, HOC-2 26, TU-CHAY-4 10, HOC-2b 26 |

Còn lại cho máy (sau khi script đặt bản sửa lên nhánh — CHỈ CHẠY, KHÔNG SỬA): đo RIÊNG trên máy mây (giả lập, `thu_gia_lap`,
`--day-du` phải 0 CẢNH BÁO), C1 + C2 (87) và C4 trên HEAD mới; ghi số vào mục này. Lệch thì DỪNG, báo.

**Máy mây chạy (10.10.2026, HEAD `b7b4401`, máy 4 lõi, chạy RIÊNG, tuần tự — CHỈ CHẠY, không sửa file nào ngoài mục này):**
| Lệnh | Kết quả |
|---|---|
| `npm test` | PASS 61 · FAIL 0 · CẢNH BÁO 0 |
| giả lập (`node viec/LUOI-1/do_thoi_gian.js gl`) | **78,5 s** · thoát 0 · Giả lập: 27 kịch bản · 16 bất biến · ĐẠT |
| `thu_gia_lap` (`… thugl`) | **87,4 s** (< 96 s) · thoát 0 · 109 đạt · 0 hỏng |
| `--day-du` (`… kiem`) | **223,4 s** · thoát 0 · ĐẾM: PASS 65 · FAIL 0 · **CẢNH BÁO 0** |
| C3 `python3 viec/LUOI-1/dot_bien.py -j 4` | tổng 80 · BẮT 78 · LẠC 1 · SỐNG 1 · HỎNG 0 · TREO 0 · **đúng mong đợi 80/80** · 247 s · thoát 0 (LẠC = `GOC-KB10-cu-tre-khong-bat-lai`, SỐNG = `VS-SRV-doi-ck-giu-tien-mat` — cả hai mong đợi đúng như vậy) |
| C1 + C2 `python3 viec/AUDIT-1/dot_bien.py C2F C2-loyalty-redeem-tru-0 -j 4` | C1 **21/21 BẮT** · C2 **40/40 vẫn BẮT** · C2F BẮT 62 · SỐNG 23 · HỎNG 0 · LẠC 1 (`C2F-orders-02-insert-quay`, như gốc) · TREO 0; C2 BẮT 1 · 1826 s · "✓ kho thật không đổi" · thoát 0 |
| C4 TU-CHAY-4 `python3 viec/TU-CHAY-4/dot_bien.py` | XANH — 0 đột biến không đạt (10/10 ✓) · thoát 0 |
| C4 P26b (18 đột biến chạy giả lập) | 18 đột biến bị bắt · 0 KHÔNG bị bắt (trên 18) · thoát 0 |
| C4 HOC-2b (25, bỏ 3 cái `p26b`) | 25 đạt · 0 không đạt · thoát 0 |
| C4 AUDIT-1 `G3 D1 -j 4` | D1 BẮT 55 · LẠC 2 (`!D1-E11-P20`, `!D1-E11-P26a` — như gốc) · G3 BẮT 1 · SỐNG 1 (`G3-vo-hai`) · HỎNG 1 (`G3-sai-chuoi`) · LẠC 1 (`G3-sap`) — đúng thiết kế · 371 s · "✓ kho thật không đổi" · thoát 0 |
Lệch mong đợi: **không có**.

**Báo cáo 7 mục (chat):** (1) Đã làm: lưới cho AU-G1/G2/G3/G6 + AU-G4 — 9 kịch bản (KB19–27), 6 bất biến mới + I7/I8 mở rộng, A1
(bất biến không cộng trễ), công tắc SX lỗi; KHÔNG sửa logic tiền. (2) Nghiệm thu: C1 21/21 BẮT, C3 đúng mong đợi, bài thử xanh.
(3) CHƯA PHỦ: Phát hiện 10, 13, 14, 15 + ca chồng mã 400 trong giao dịch (Phát hiện 9). (4) Lỗi tiền lộ ra, gom P26c/P26d:
Phát hiện 5 (lấy quá lượt gói), 9 (mã đơn sinh ngoài giao dịch), 10 (xoá đơn mua thẻ), 11 (hai gói), 12 (huỷ gói đã giao).
(5) Thời gian: `thu_gia_lap` sát 96 s → việc chia giả lập 2 lượt chen trước P26c. (6) Không đổi `server/`, `client/`, `tu_chay/`.
(7) PR: chủ quán Merge tay sau khi chat đối chiếu SHA.

**Bài học (chat, từ soát vòng 3 — để việc bộ khung làm thành khoá):**
- KHOÁ đề xuất: `dot_bien.py` tự sinh đột biến "bỏ từng vế `||`/`&&`" cho biểu thức lọc trong `bat_bien.js`; vế SỐNG phải xoá hoặc có
  chú thích "thừa vì …". Bỏ một vế có thể làm vế KHÁC mất ca riêng (I8 ở vòng này) — chạy lại cả nhóm sau khi bỏ.
- KHOÁ đề xuất: mỗi phép so bằng trên cột tiền có hai ca tay ±1.
- NGUYÊN TẮC: ca "chồng nhau" phải chạy khi còn việc để làm; bằng chứng là đột biến bỏ khoá chống chồng phải ĐỎ.
- NGUYÊN TẮC: vế chỉ thử bằng dữ liệu tay mà kịch bản không chạm → ghi CHƯA PHỦ phía máy chủ.
