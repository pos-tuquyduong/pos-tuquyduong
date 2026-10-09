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
Chủ quán trả lời Q7 (a) · Q8 (b) · Q9 (a) (09.10) → làm theo (vòng sửa 2/3, mục cuối file), chạy lại C1–C4 trên head cuối,
đo riêng, soát vòng 2.
- [x] Bản gốc lưu ở thư mục nháp ngoài kho. `server/`, `client/`, `tu_chay/` KHÔNG đổi (`git diff --stat 9521cec -- server client tu_chay` rỗng).
- [x] A1 (`chay.js`): trễ bật lại TRƯỚC mỗi kịch bản, tắt khi kiểm bất biến. Giả lập 67,1 s → **58,3 s** (18 · 10 ĐẠT).
- [x] Siết KB10 + bằng chứng đỏ trên gốc (mục "Bằng chứng KB10" dưới).
- [x] Công tắc SX lỗi (`chay.js`), I7 mở rộng, I8 vế đổi điểm, I12–I17 (`bat_bien.js`). 18 KB cũ + 16 bất biến: ĐẠT (K5).
- [x] KB19–KB27 (`kich_ban.js`); KB20 ca chồng mã theo Q6 (a) siết.
- [x] `thu_gia_lap.js`: dòng tổng 27 · 16, 60 ca dữ liệu tay (bộ sạch + lệch đúng một phép, hai phía), cờ `--chi-du-lieu-tay`.
- [x] B6 bánh cóc 18 → 27, 10 → 16; chú thích S4 theo số đo thật.
- [x] `dot_bien.py` (C3) · C1 + C2 (87, một lần chạy — Q4 a) · C4.

## Số đo chạy RIÊNG (máy mây 4 lõi, `node viec/LUOI-1/do_thoi_gian.js …`)
| Lệnh | Gốc 9521cec | Sau A1 (18 KB) | HEAD (27 KB · 16 BB) | Ngưỡng 80 % |
|---|---|---|---|---|
| giả lập `chay.js` | 67,1 s | 58,3 s · 57,8 s | **80,7 s** (80,9 · 78,7 s các lần trước) | 96 s |
| `thu_gia_lap.js` | 74,9 s (42/0) | **66,3 s** (42/0) | **90,5 s** (102/0; 92,1 · 91,7 s; người soát đo 93,3 s) | 96 s — SÁT (94–97 %) |
| `kiem_tra --day-du` | 201,8 s, thoát 0 | 228,4 s · PASS 65 · FAIL 0 · CẢNH BÁO 0 | **275,3 s · PASS 65 · FAIL 0 · CẢNH BÁO 0** | (không có hạn riêng) |
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

## C1 — 21 đột biến SỐNG trên gốc → BẮT (chạy 09.10, `python3 viec/AUDIT-1/dot_bien.py C2F C2-loyalty-redeem-tru-0 -j 4`, 1915 s, "✓ kho thật không đổi")

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
**Lần chạy cuối (sau vòng sửa 1, 195 s): 67 đột biến · BẮT 66 · LẠC 1 · SỐNG 0 · HỎNG 0 · đúng mong đợi 67/67, thoát 0.**
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
| I7 mở rộng | `VS-I7-tong-chi-tren`, `VS-I7-tong-chi-duoi`, `BV-I7-b-no-da-xong`, `BV-I7-c-loi-phai-co-no`, `VS-I7-c-no-chi-duoi`, `BV-I7-d-no-phai-co-loi`, `BV-I7-e-kb-bat` |
| I8 vế đổi điểm | `VS-I8-diem-chi-tren`, `VS-I8-diem-chi-duoi`, `VS-I8-qua-chi-duoi`, `VS-I8-qua-chi-tren`, `BV-I8-loai-la` |
| I12 | `BV-I12-loai-dong`, `BV-I12-sdt`, `VS-I12-diem-chi-tren`, `VS-I12-diem-chi-duoi`, `BV-I12-loai-ma`, `VS-I12-tri-gia-chi-tren`, `VS-I12-tri-gia-chi-duoi`, `BV-I12-so-ma`, `VS-I12-dung-chi-duoi`, `VS-I12-dung-chi-tren` |
| I13 | `VS-I13-dung-chi-tren`, `VS-I13-dung-chi-duoi`, `VS-I13-gioi-han-cong-1`, `BV-I13-so-tay`, `BV-I13-bo-loai`, `BV-I13-bo-tri-gia` |
| I14 | `VS-I14-vuot-tong-cong-1`, `VS-I14-giao-chi-tren`, `VS-I14-giao-chi-duoi`, `BV-I14-so-tay`, `BV-I14-tinh-ca-don-huy`, `BV-I14-tinh-ca-mon-co-gia`, `BV-I14-goi-don-huy`, `BV-I14-goi-don-xoa`, `BV-I14-bo-product-id`, `BV-I14-tro-goi`, `BV-I14-tro-bo-not-null`, `BV-I14-mua-bo-co-goi`, `BV-I14-mua-bo-lay-ngay`, `BV-I14-mua-lay-ngay` |
| I15 | `VS-I15-the-chi-tren`, `VS-I15-the-chi-duoi`, `BV-I15-tinh-ca-don-huy`, `BV-I15-bo-sdt`, `BV-I15-bo-mon-the`, `BV-I15-mua-don-huy`, `BV-I15-mua-don-xoa` |
| I16 | `VS-I16-tien-chi-tren`, `VS-I16-tien-chi-duoi`, `BV-I16-cot-kia`, `BV-I16-dong-cuoi` |
| I17 | `BV-I17-bo-approved`, `BV-I17-loai-dong`, `BV-I17-don`, `BV-I17-sdt`, `VS-I17-tien-lech-1` |
| KB19–KB27 / I12–I17 trên máy chủ thật | 21 đột biến C1 (bảng C1) |

Mọi tên đột biến trong `viec/LUOI-1/dot_bien.py` (67): `GOC-KB10-cu-tre-khong-bat-lai`, `GOC-KB10-siet-tre-khong-bat-lai`, `BV-A1-tre-khong-bat-lai`, `VS-A1-tre-chi-bat-kb-dau`, `BV-B4-sx-khong-tu-tat`, `VS-B4-sx-mac-dinh-bat`, `VS-B4-bat-khong-ghi-kb`, `BV-B4-kb-khong-gan`, `VS-B4-loi-van-nhan`, `VS-I7-tong-chi-tren`, `VS-I7-tong-chi-duoi`, `BV-I7-b-no-da-xong`, `BV-I7-c-loi-phai-co-no`, `VS-I7-c-no-chi-duoi`, `BV-I7-d-no-phai-co-loi`, `BV-I7-e-kb-bat`, `VS-I8-diem-chi-tren`, `VS-I8-diem-chi-duoi`, `VS-I8-qua-chi-duoi`, `VS-I8-qua-chi-tren`, `BV-I8-loai-la`, `BV-I12-loai-dong`, `BV-I12-sdt`, `VS-I12-diem-chi-tren`, `VS-I12-diem-chi-duoi`, `BV-I12-loai-ma`, `VS-I12-tri-gia-chi-tren`, `VS-I12-tri-gia-chi-duoi`, `BV-I12-so-ma`, `VS-I12-dung-chi-duoi`, `VS-I12-dung-chi-tren`, `VS-I13-dung-chi-tren`, `VS-I13-dung-chi-duoi`, `VS-I13-gioi-han-cong-1`, `BV-I13-so-tay`, `BV-I13-bo-loai`, `BV-I13-bo-tri-gia`, `VS-I14-vuot-tong-cong-1`, `VS-I14-giao-chi-tren`, `VS-I14-giao-chi-duoi`, `BV-I14-so-tay`, `BV-I14-tinh-ca-don-huy`, `BV-I14-tinh-ca-mon-co-gia`, `BV-I14-goi-don-huy`, `BV-I14-goi-don-xoa`, `BV-I14-tro-goi`, `BV-I14-bo-product-id`, `BV-I14-tro-bo-not-null`, `BV-I14-mua-bo-co-goi`, `BV-I14-mua-bo-lay-ngay`, `BV-I14-mua-lay-ngay`, `VS-I15-the-chi-tren`, `VS-I15-the-chi-duoi`, `BV-I15-tinh-ca-don-huy`, `BV-I15-bo-sdt`, `BV-I15-bo-mon-the`, `BV-I15-mua-don-huy`, `BV-I15-mua-don-xoa`, `VS-I16-tien-chi-tren`, `VS-I16-tien-chi-duoi`, `BV-I16-cot-kia`, `BV-I16-dong-cuoi`, `BV-I17-bo-approved`, `BV-I17-loai-dong`, `BV-I17-don`, `BV-I17-sdt`, `VS-I17-tien-lech-1`.

## D2 — PR + check `cong`, `cong-chay`
CHƯA KIỂM: máy không xem được GitHub (không tạo PR — phiếu cấm). Thời gian `thu_gia_lap` trên máy CI chưa đo (ở đây 90,5–93,3 s,
sát ngưỡng cảnh báo 96 s).

## E — toàn bộ (chạy riêng, HEAD sau vòng sửa 1)
`npm test` PASS 61 · FAIL 0 · CẢNH BÁO 0 · `--day-du` PASS 65 · FAIL 0 · CẢNH BÁO 0 (275,3 s) · `thu_gia_lap` 102 đạt · 0 hỏng · giả lập
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
  (`packages.js:170–181`). Đề xuất (a): KB26 gọi trong hạn lượt (1 ly trên gói còn lượt), I14 cộng sổ `giaoGoi` → bắt
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
4. `PUT /packages/customer-packages/:id/deliver` không trần lượt, không tạo đơn, chỉ cần đăng nhập (`packages.js:170–181`);
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
trên gốc chạy lại (45/57, SỐ CA 102). **C1, C2, C4 đã chạy TRƯỚC vòng sửa 1** (bất biến I12 và KB25 đổi sau đó) → chạy lại đủ trên
head cuối sau khi chủ quán trả lời Q7–Q9.

## Vòng sửa 2/3 (theo lời chốt Q7–Q9, 09.10)
- KB21 (`kich_ban.js`): ca hai nhân viên huỷ đơn mua gói ĐÃ GIAO 2/3 chồng nhau → 200 + 400 `DON_KHONG_HUY_DUOC`, đúng MỘT dòng
  hoàn (`c.dongHoan`), gói `cancelled`; bỏ khẳng định "ví + trọn giá". Ca gói CHƯA giao: thêm khẳng định ví + TRỌN giá gói.
- Q7, Q9: không thêm kịch bản; Phát hiện 10, 11 (gom P26c); Phát hiện 10 ghi CHƯA PHỦ.
