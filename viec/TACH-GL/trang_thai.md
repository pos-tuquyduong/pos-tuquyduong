# TACH-GL — trạng thái

## Bản chụp lúc mở phiên (10.10.2026) — E1
`git branch --show-current` → `viec/TACH-GL`
```
2237259 PHIEU: TACH-GL
263f2ca TIEN-DO: LUOI-1 xong (28638d0), TACH-GL mo phieu — so v25
28638d0 Merge pull request #12 from pos-tuquyduong/viec/LUOI-1
```
Có commit `PHIEU: TACH-GL`, cha là commit sổ v25 (`263f2ca`).

## Chủ quán duyệt kế hoạch (15bc986) — 10.10.2026
C' + `LUOT [[2,15,17,28],[3,10,16,18,21],[1,4,5,6,7,8,14,23,24,25,26,27],[9,11,12,13,19,20,22,29]]`. Q1 = (a): KB29 gọi
`POST /rewards` kèm `max_discount`, giữ Phát hiện 1, KHÔNG sửa `client/`. Q2 = đồng ý cả hai (ca dưới trần + `VS-SRV-tran-luon-ap`;
T5 SIGKILL). Thêm: ở MỌI lối thoát dòng cuối cha in là dòng kết luận (tổng / TỪ CHỐI / SẬP của con); dòng `Lượt k:` và
`lượt k/L pid` in TRƯỚC; có ca kiểm cho lối SẬP. D3 có C2F chuyển SỐNG → đổi LUOT, chạy lại D1–D3, không nới.
Chat đã thử trên bản sao máy 1 lõi: 4 lượt cùng lúc ĐẠT, lượt dài nhất 26,6 s; 5 đột biến máy chủ BẮT.

## Bước đang làm
**DỪNG — chờ chủ quán trả lời Q3** (`## Câu hỏi`): soát kiểm chứng sau vòng sửa 3/3 KHÔNG ĐẠT, đã hết số vòng sửa. Mọi số dưới
đây là của HEAD cuối (sau vòng sửa 3, `e1633d6`);
số của các lần trước nằm trong mục vòng soát/vòng sửa, ghi "(cũ)".

## Bài thử (bước 4) — đỏ trên gốc, xanh trên head
`viec/TACH-GL/bang_chung_do.txt` (`node viec/TACH-GL/chay_goc.js` — `thu_gia_lap` của HEAD trên `cong_cu/gia_lap/` gốc 2237259):
trên gốc **110 đạt · 13 hỏng** (E1 dòng tổng 29; T1–T6, T7a, T7b, T8, T9 ×3); trên head **123 đạt · 0 hỏng** (`SỐ CA
cong_cu/thu_gia_lap.js: 123`). Ca xanh cả hai phía có chủ ý (K5): "đúng MỘT dòng tổng", "--may-chu rỗng → dòng cuối SẬP", T0 `--den-kb 0`. Bánh cóc 29:
đỏ trên gốc (27). LUOI-1 `VS-SRV-doi-ck-giu-tien-mat`: gốc SỐNG (mong BẮT).
Lối dòng cuối (yêu cầu chủ quán): tổng — E1 (`cuoi(e1) === DONG_DAT`); SẬP — ca `--may-chu` rỗng + T3/T4/T6 (`SAP.test(cuoi())`);
TỪ CHỐI — cha: E3 (A1), T8 (`--kho`), T9 (`--luot` hỏng); lượt chạy thẳng: T7a/T7b. Lối "con thoát 3 → cha thoát 3" và "spawn lỗi":
CHƯA KIỂM (không tới được — cha kiểm A1/`--luot`/`--kho` trước khi sinh con với cùng môi trường / không dựng được).
T3/T4 thêm vế "mọi lượt bị dừng (đóng ≠ 0)" (không có thì `BV-cha-khong-dung-con-khi-sap` SỐNG) và vế "ít nhất một lượt tự thoát nhờ
SIGTERM (đóng 2)" (không có thì `BV-cha-khong-dung-con-SIGTERM` SỐNG sau khi cha tự dọn kho — vòng sửa 2; vế này chỉ có tác
dụng ở T3 — ở T4 lượt bị bài thử SIGTERM luôn đóng 2).

## D4 — chỗ đổi → đột biến (`python3 viec/TACH-GL/dot_bien.py`, HEAD cuối, 568 s: 26 đột biến · BẮT 26 · đúng mong đợi 26/26)
| Chỗ đổi | Đột biến | Bắt bằng |
|---|---|---|
| cha sinh mọi lượt (`chon`) | `BV-cha-bo-luot` | E1 (25 KB, 4 lệch) + T2 |
| `LUOT` một KB ở hai lượt | `VS-kb-hai-luot` | E1 `chia lượt → KB5 chạy 2 lần` |
| `LUOT` KB5 hai lượt, KB6 không (N vẫn 29) | `VS-luot-trung-thieu` | E1 thoát 1 dù 29 KB — `chia lượt → KB6 chạy 0 lần` |
| phép "đúng một lần" của cha | `BV-cha-kiem-mot-lan` | T2 (`1,2,3,4,5,5,7,…`) |
| mã thoát / kết luận của cha | `VS-cha-nuot-ma-thoat` | E2 M1, M13 (thoát 0) |
| cha không in lại dòng tổng của con | `VS-cha-in-lai-tong-con` | E1 "đúng MỘT dòng" |
| phép "số bất biến các lượt khác nhau" | `VS-luot-thieu-bat-bien` | E1 thoát 1 dù dòng tổng đúng chữ |
| phép "lượt thoát 1 không kèm dòng lệch" | `VS-con-giau-dong-lech` | E2 M1 (`0 kịch bản · 0 bất biến · KHÔNG ĐẠT`) |
| cha SIGTERM → dừng con | `BV-cha-khong-dung-con-SIGTERM` | T3 (mọi lượt đóng SIGKILL, không lượt nào đóng 2) |
| một lượt sập → dừng con khác | `BV-cha-khong-dung-con-khi-sap` | T4 (thoát 1, đóng 0) |
| con theo dõi cha (`disconnect`) | `BV-con-khong-theo-doi-cha` | T5 (con còn sống sau 15 s) |
| cha tạo + dọn kho từng lượt | `BV-cha-khong-don-kho` | T6 (tất định: kho có trước khi con khởi động) |
| `--kho` của lượt — cả khối phép | `BV-kho-khong-kiem` | T7a + T7b |
| `--kho` — vế "ngay trong thư mục tạm" | `BV-kho-bo-ve-thu-muc-tam` | T7a |
| `--kho` — vế tên `gia_lap_xxxxxx` | `BV-kho-bo-ve-ten` | T7b |
| cha từ chối `--kho` của người gọi | `BV-cha-nhan-kho` | T8 (kho của giả lập khác bị xoá) |
| `--luot` phải là số nguyên ≥ 1 | `BV-luot-khong-kiem` | T9 (sập thoát 2 thay vì TỪ CHỐI — không đệ quy) |
| `--den-kb 0` = lượt rỗng | `BV-den-kb-0-luot-rong` | T0 |
| các lượt CÙNG LÚC | `VS-luot-tuan-tu` | T1 (đã làm false — không dùng ngưỡng giờ) |
| dòng lệch giữ SỐ GỐC | `VS-dong-lech-so-trong-luot` | E2 M1 (`KB2 → I6` thay `KB10`) |
| `loyalty.js:183` loại mã = loại quà | `VS-SRV-qua-viet-cung-fixed` | KB29 HTTP 400 + I12 |
| `loyalty.js:183` trần mã = trần quà | `VS-SRV-qua-bo-tran` | KB29 HTTP 400 + I12 |
| `orders.js:620` áp trần khi bán | `BV-SRV-ban-bo-ap-tran` | KB29 HTTP (bán 35.000) |
| `orders.js:621` chỉ áp trần khi VƯỢT | `VS-SRV-tran-luon-ap` | KB29 HTTP (bán 10.000, ca dưới trần) |
| `orders.js:621` ngưỡng trần (ca ngay TRÊN 1đ) | `VS-SRV-tran-doi-nguong-tren` | KB29 HTTP (quà trần 7.499) |
| `orders.js:621` ngưỡng trần (ca ngay DƯỚI 1đ) | `VS-SRV-tran-doi-nguong-duoi` | KB29 HTTP (quà trần 7.501) |
Không có phần dựng đầu lượt (B2 ii) → không có đột biến "bỏ dựng đầu lượt". `VS-kho-truoc-tin-hieu` (vòng sửa thứ tự cài tín hiệu)
đã BỎ ở vòng sửa 2: cha tự dọn kho nên thứ tự trong con không còn quyết định sót kho — đột biến đó thành SỐNG đúng thiết kế.

## Soát kế hoạch (agent phụ, chỉ đọc, 10.10) — CẦN SỬA 7 điểm, đã sửa trong ke_hoach.md
1. Cách chia C cũ tách KB4 (lượt 3) / KB8 (lượt 4) → M3 (đối soát cộng debt_payment, `thu_gia_lap` E2) SỐNG: KB4 ghi dòng
   `debt_payment` của KH.quen (`server/routes/orders.js:1257`), M3 chỉ lệch ở KB8 khi dòng đó có. Bằng chứng: `do_chia_e2.js` trên C
   → 12/13 (M3 SỐNG), trên C' (KB8 sang lượt 3) → 13/13 BẮT (chạy lại trên HEAD sau vòng sửa 2: vẫn 12/13 và 13/13). Đổi sang C';
   bảng B1 thêm cột "cần để đột biến vẫn bắt".
2. Thêm phép B6 trước khi chốt cách chia (`do_chia_e2.js`); C2F 87 chạy ở D3 sau khi làm — SỐNG mới thì đổi `LUOT`, không nới.
3. Ghi rõ: M lấy từ con (giữ E4c), cha không in lại dòng tổng của con (bánh cóc lấy kết quả khớp đầu), ca "đúng một dòng tổng".
4. LUOI-1: thêm 28 vào vòng `LENH` (`dot_bien.py:140`).
5. Bước còn thiếu: `npm test` (F), E1, E2 CHƯA KIỂM, cột soQuay/nhanKho trong B1.
6. Ước CPU 1 lõi cộng tiến trình con của T1–T5.
7. KB28 sang lượt 1 (bỏ ràng buộc "sau KB27").

## Sự cố — sót `gia_lap_*` chập chờn (K4) — sửa hai lần, gốc rễ đóng ở vòng sửa 2
(1) Đo A1: `thu_gia_lap` 2/6 lần hỏng ca A2 "mọi thư mục gia_lap_* đã xoá" (sót kho). Lần sửa đầu: con cài xử lý tín hiệu TRƯỚC
`mkdtempSync` + T6 + đột biến tất định (khe 500 ms). (2) Vòng sửa 2: dưới tải nặng (3 `thu_gia_lap` cùng lúc) T6 đỏ 6/9, T3 có
`đóng: 2,2,2,SIGKILL` — con đang trong khối đồng bộ nạp máy chủ không đáp SIGTERM trong 10 s → cha SIGKILL → con không tự dọn được;
con chết trước khi cài xử lý tín hiệu cũng vậy. Sửa tận gốc, không phụ thuộc thời gian: **cha tạo kho từng lượt (`--kho`) và cha xoá
lúc thoát**; con vẫn tự xoá khi cha chết (T5); con chỉ nhận `--kho` là `gia_lap_xxxxxx` ngay trong thư mục tạm (T7 — A2: không nhận
đường bậy rồi `rmSync`). Sau sửa, cùng khung tải nặng: 6/6 + 6/6 sạch (bằng chứng phụ); bằng chứng chính: `BV-cha-khong-don-kho`
(T6 tất định) và `BV-kho-khong-kiem` (T7) BẮT.

## A — số đo (máy mây 4 lõi, chạy riêng, `node viec/TACH-GL/do_cpu.js` — CPU = user + sys của mọi tiến trình con được chờ)
| | Gốc (A0) | HEAD cuối (A1) | Mục tiêu |
|---|---|---|---|
| giả lập | 79,8 s · CPU 4,1 s · 27 KB | **24,4 · 24,3 · 24,4 s** · CPU 7,7–8,2 s · 29 KB ĐẠT | ≤ 60 s |
| `thu_gia_lap` | 89,6 s · 109 đạt | **37,1 · 38,1 · 37,2 · 38,4 · 36,9 s** (5 lần) · CPU 36,5–39,7 s · 123 đạt | ≤ 72 s |
| `--day-du` | 252,5 s · 0 CẢNH BÁO | **150,0 s** · PASS 65 · FAIL 0 · **CẢNH BÁO 0** | 0 CẢNH BÁO |
`npm test`: PASS 61 · FAIL 0 · CẢNH BÁO 0. Chú thích S4 (`kiem_tra_truoc_khi_giao.js`) chép đúng bảng này.
A2 — ước máy chat 1 lõi: giả lập ≈ lượt dài nhất (CPU 7,7–8,2 s ≪ 24,4 s chờ) → ~26–28 s (chat đo bản sao: lượt dài nhất 26,6 s).
`thu_gia_lap`: tổng CPU 36,5–39,7 s là SÀN trên 1 lõi; chờ chồng lên một phần → ước ~45–60 s (< 72 s, nhưng hẹp hơn máy mây).
CHƯA KIỂM trên 1 lõi (người gác chặn `taskset`) — chat đo xác nhận. Nghi ngờ của soát vòng 1–2 "SIGKILL sau 10 s trên 1 lõi" nay
không còn sót kho (cha dọn); T3/T4 chỉ đòi ít nhất MỘT lượt đáp SIGTERM.

## B1 — mỗi lượt chạy RIÊNG trên code thật (`node cong_cu/gia_lap/chay.js --den-kb <KB cuối của lượt>`)
`--den-kb 28` → Lượt 1: KB 2,15,17,28 ĐẠT · `--den-kb 21` → Lượt 2: KB 3,10,16,18,21 ĐẠT · `--den-kb 27` → Lượt 3: KB
1,4,5,6,7,8,14,23,24,25,26,27 ĐẠT · `--den-kb 29` → Lượt 4: KB 9,11,12,13,19,20,22,29 ĐẠT (mỗi lần 16 bất biến; chạy lại cả 4 trên
HEAD cuối: 4 · 5 · 12 · 8 kịch bản, đều ĐẠT).

## D — đột biến (đếm đủ, chạy riêng, HEAD cuối)
- **D1** `thu_gia_lap` E2: 13/13 (trong 123 đạt).
- **D2** `python3 viec/LUOI-1/dot_bien.py -j 4`: 80 · BẮT 79 · LẠC 1 · đúng mong đợi **80/80** · 90 s. `VS-SRV-doi-ck-giu-tien-mat`
  **BẮT** (`KB28 → I16`); `GOC-KB10-cu-tre-khong-bat-lai` LẠC như gốc.
- **D3** `python3 viec/AUDIT-1/dot_bien.py C2F C2-loyalty-redeem-tru-0 -j 4`: C2 BẮT 1 · C2F BẮT 62 · SỐNG 23 · LẠC 1
  (`C2F-orders-02-insert-quay`, như gốc) · 638 s · kho thật không đổi. Đối chiếu bằng máy với "Bảng đủ 87" của
  `viec/LUOI-1/trang_thai.md` (bốn lần chạy: sau làm, sau vòng sửa 1, sau vòng sửa 2, HEAD cuối): **87/87 cùng trạng thái, 0 lệch** — không đổi LUOT.
- **D4** 26/26 (bảng trên).
- **D5** `python3 viec/HOC-2b/kiem_neo.py`: mọi bộ 0 HỎNG trừ `G3-sai-chuoi` (cố ý). TU-CHAY-4: XANH 10/10 (E4c bắt nhờ số bất biến
  lấy từ con; E4d bắt nhờ N = 10 + T2). P26b: 59/59 bị bắt. HOC-2b: 28 đạt · 0 không đạt. AUDIT-1 D1: BẮT 55 · LẠC 2
  (`!D1-E11-P20`, `!D1-E11-P26a` — như gốc, HOC-2b P5) · kho không đổi. AUDIT-1 G3: BẮT 1 · SỐNG 1 (`G3-vo-hai`) · HỎNG 1
  (`G3-sai-chuoi`) · LẠC 1 (`G3-sap`) — như LUOI-1 C4. Neo rữa của bộ cũ: 0.

<details><summary>Bảng đủ 87 (D3, HEAD cuối — giống hệt hai lần trước)</summary>

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

## Soát độc lập — vòng 1 (`/ra-soat`, agent general-purpose, 10.10) — chép nguyên báo cáo
```
KHÔNG ĐẠT

Kết luận: phần code chính đúng, chạy xanh. Khi chạy lại tôi thấy: `node cong_cu/gia_lap/chay.js` → `Giả lập: 29 kịch bản · 16 bất biến · ĐẠT`, thoát 0; `node cong_cu/thu_gia_lap.js` → 116 đạt · 0 hỏng; `python3 viec/P26b/dot_bien.py I1-nhanh-refunded-false` (bản sao gl13 ở thư mục khác) → bị bắt. Không đạt vì: C3 ghi sai số đo, lưới tiền KB29 có một lỗ thật (đột biến tôi dựng vẫn SỐNG), một công cụ đo mà phiếu có nêu tên bị hỏng mà không ghi lại.

LỖI TÌM ĐƯỢC:
- cong_cu/gia_lap/kich_ban.js:566–572 (KB29) — phép trần chỉ có hai ca ở xa ngưỡng: 17.500 so với trần 7.000, và 5.000. Không có ca sát ngay trên hay ngay dưới trần. Tôi dựng đột biến dời ngưỡng `finalDiscountAmount > codeRecord.max_discount` → `… > codeRecord.max_discount + 3000` (server/routes/orders.js:621), làm trên bản sao trong os.tmpdir, đã kiểm realpath trước khi ghi. Chạy `chay.js --may-chu <bản sao> --den-kb 29` → thoát 0, `Giả lập: 8 kịch bản · 16 bất biến · ĐẠT`, tức là SỐNG. Như vậy tên đột biến `VS-SRV-tran-luon-ap` ("chỉ áp trần khi VƯỢT") hứa nhiều hơn thứ nó thật sự khoá. Đề xuất thêm ca 14.002 → giảm 7.000 và 13.998 → giảm 6.999. Đây là thêm ngoài Q2 đã duyệt nên phải hỏi chủ quán. — K3 (phép ngưỡng phải có ca ngay trên + ngay dưới)
- kiem_tra_truoc_khi_giao.js:756 — chú thích S4 ghi "giả lập 22,9–23,0 s". Số đo A1 trong trang_thai.md (bảng A) là 22,9 · 22,7 · 22,8 s, tức khoảng đúng là 22,7–22,9. C3 đòi chú thích "theo số đo A1 thật". — K1
- viec/LUOI-1/do_thoi_gian.js:41 — neo `'  const tong = `Giả lập:'` đã rữa vì dòng tổng trong con nay là `Lượt …` (chay.js:265). Chạy `node viec/LUOI-1/do_thoi_gian.js kb` trên head → ném lỗi "neo đo không khớp". Phiếu A0 nêu đích danh công cụ này, P26c sẽ cần đo lại từng KB. Kể cả khi sửa neo, cha (chay.js:99–106) cũng không chuyển tiếp dòng `DO KB…` của con. File nằm ngoài Phạm vi, nhưng không được ghi vào `## Phát hiện` (D5 có luật tương tự cho neo rữa ngoài Phạm vi). — K4
- cong_cu/gia_lap/chay.js:65–67 — `--den-kb 0` đổi nghĩa. Trước là "khởi động + dựng dữ liệu, 0 KB, ĐẠT", phiếu dùng nó làm số đo "lượt rỗng" và ước CPU ở ke_hoach §4 dựa vào đó. Nay không sinh con nào, in `✗ chia lượt → KB0 chạy 0 lần`, thoát 1 (tôi đã chạy). ke_hoach §6 không nhắc. Không bộ tự động nào gọi (đã grep viec/). — K5 (luồng đo bị chặn, không ghi)
- commit f6e8e9f — thiếu dòng trống giữa tiêu đề và hai dòng Co-Authored-By/Claude-Session, nên chúng dính vào tiêu đề và hiện cả trong `git log --oneline`. — K7 (giao nhận)

NGHI NGỜ:
- chay.js:79 — `spawn` không có `con.on('error')`. Nếu sinh con lỗi (EAGAIN lúc máy tải nặng) thì cha văng lỗi không bắt, thoát 1 với dòng cuối là stack trace. Như vậy trái yêu cầu của chủ quán "mọi lối thoát, dòng cuối là dòng kết luận"; `cha().catch(sap)` không bắt được lỗi phát qua sự kiện. Hướng hỏng an toàn (bộ kiểm vẫn FAIL), nhưng là một lối thoát chưa phủ.
- chay.js:89 — lối "con TỪ CHỐI → cha thoát 3 + dòng cuối TỪ CHỐI" không có ca thử, cũng không có đột biến. trang_thai.md ghi "Lối TỪ CHỐI: E3 có sẵn", nhưng E3 chỉ phủ cha từ chối. Với cùng môi trường thì lối này gần như không xảy ra. Xoá dòng 89 thì không bài nào đỏ.
- chay.js:74 — SIGKILL sau 10 s sẽ để sót `gia_lap_*`. Trên máy 1 lõi chạy thu_gia_lap (~37 tiến trình node), con đang trong khối đồng bộ `require(index.js)` có thể không kịp xử lý SIGTERM trong 10 s; T5 cũng chỉ chờ 15 s. Có thể đỏ thất thường ở T3/T4/T6/sập trên máy chat. Chưa đo được: người gác chặn taskset.
- Sự cố sót kho: lỗi gốc là khe vài µs giữa `mkdtempSync` và `process.on`. Đột biến tất định chèn thêm 500 ms chờ bận, nên chỉ chứng minh T6 bắt được khe RỘNG; bản thứ tự cũ thật thì T6 gần như không bắt được. Lý do "các con sập đồng thời nên tín hiệu rơi đúng khe" là hợp lý. Bằng chứng 8/8 lần sạch chỉ là phụ.
- Tôi thử giết cha bằng SIGKILL ngay khi in đủ 4 pid: con tự thoát trong ≤ 2 s, không sót thư mục. Nghi ngờ con mồ côi ở khe sớm vì vậy đã loại.

NGHIỆM THU:    19/21 mục có bằng chứng · mục thiếu: C3 (chú thích S4 lệch số đo A1), E2 (check PR — CHƯA KIỂM, chấp nhận được, nhưng trang_thai.md chưa ghi dòng "E2 CHƯA KIỂM")
(… từng mục A0–F có bằng chứng như trang_thai.md; P1 không đụng client/; đường tiền: server tự tra trần — orders.js:613–624, loyalty.js:183.)

CHƯA SOÁT ĐƯỢC:
- Không chạy lại đủ D2 (80), D3 (87), D4 (16), D5. Lý do: thời gian, và không chạy chồng lệnh khác.
- Không chạy `--day-du`.
- Không đo trên máy 1 lõi (taskset bị chặn).
- Không xem được check PR `cong` / `cong-chay`.
- Không dựng được lỗi `spawn` để kiểm lối văng lỗi của cha.

BÀI HỌC:
- KHOÁ: KB29 thêm ca ngay trên / ngay dưới trần, kèm đột biến "dời ngưỡng" (+N) trong viec/TACH-GL/dot_bien.py (phải hỏi chủ quán).
- KHOÁ: kiem_neo (HOC-2b) nên rà cả công cụ đo `viec/*/do_*.js` có neo vào file luật, không chỉ dot_bien.py.
- KHOÁ: thêm `con.on('error')` → dòng SẬP, kèm đột biến/ca cho lối "con TỪ CHỐI".
- NGUYÊN TẮC (K4): đổi định dạng dòng ra của file luật thì grep MỌI neo trong viec/ (cả công cụ đo), và ghi lại mọi giá trị đối số đổi nghĩa (`--den-kb 0`).
- NGUYÊN TẮC (K1): con số trong chú thích bộ kiểm phải chép từ bảng đo đã ghi, không chép từ một lần đo khác.
```
(Phần NGHIỆM THU từng mục đã rút gọn một dòng — bản đủ: mọi mục A0–F "có", trừ C3 và E2 như trên.)

## Vòng sửa 1/3 (sau soát vòng 1, 10.10)
| Lỗi | Xử lý |
|---|---|
| KB29 thiếu ca sát trần (K3) | Không hỏi lại: luật K3 của kho (ngưỡng → ca ngay trên + ngay dưới), trong Phạm vi, giữ nguyên hai ca đã duyệt. Thêm quà 50 % trần 7.499 / 7.501 + đơn 15.000 (50 % = 7.500): NGAY TRÊN 1đ → giảm 7.499 · thu 7.501; NGAY DƯỚI 1đ → giảm 7.500 · thu 7.500. Đột biến `VS-SRV-tran-doi-nguong-tren` (`> max + 1`), `VS-SRV-tran-doi-nguong-duoi` (`> max − 2`) BẮT; đột biến +3000 của người soát chặt hơn +1 nên cũng bị ca ngay trên bắt. |
| S4 lệch số đo (K1) | Đo lại SAU vòng sửa (KB29 dài thêm), chép đúng bảng A mới vào chú thích. |
| `do_thoi_gian.js` neo rữa (ngoài Phạm vi) | Phát hiện 2. |
| `--den-kb 0` đổi nghĩa (K5) | Khôi phục: `--den-kb 0` = một lượt rỗng (khởi động + dựng, 0 KB) → `Giả lập: 0 kịch bản · 16 bất biến · ĐẠT`. Ca T0 + đột biến `BV-den-kb-0-luot-rong` (BẮT). |
| commit `f6e8e9f` dính trailer vào tiêu đề | Người gác chặn `git commit --amend` (GIT-COMMIT-CO) — giữ nguyên; tiêu đề vẫn mở bằng mã việc. Các commit sau đúng dạng. |
| NGHI NGỜ `spawn` không `on('error')` | Thêm `con.on('error')` → dòng SẬP, thoát 2. Không dựng được lỗi sinh tiến trình → CHƯA KIỂM. |
| NGHI NGỜ lối con TỪ CHỐI | Không tới được với cùng môi trường (cha kiểm A1 cùng biến trước khi sinh con) → CHƯA KIỂM, giữ mã (bảng mã thoát kế hoạch đã duyệt). |
| NGHI NGỜ SIGKILL sau 10 s trên 1 lõi | CHƯA KIỂM trên 1 lõi (taskset bị chặn) — chat đo; máy mây chưa lần nào chạm 10 s. |
| NGHI NGỜ T6 chỉ bắt khe rộng | Đúng — ghi rõ: khe thật vài µs không dựng tất định được; bằng chứng chính là đột biến chờ 500 ms + thứ tự mới (xử lý tín hiệu cài trước khi tạo kho → không còn khe). |
| E2 thiếu dòng CHƯA KIỂM | Thêm (mục Báo cáo). |
Sự cố trong vòng sửa: chính lần sửa `--den-kb 0` làm rữa neo của `BV-cha-bo-luot` (HỎNG 1/19 ở lần chạy lại) — sửa neo (chuỗi ngắn, riêng), chạy lại → BẮT.

## (cũ) A — số đo sau vòng sửa 1 (head `486f56c`, chạy riêng) — thay bằng mục A ở trên
giả lập 24,8 · 24,5 · 25,0 s (CPU 7,7–9,0 s, 29 KB ĐẠT) · `thu_gia_lap` 41,5 · 40,1 · 36,8 s (CPU 38,7–44,7 s, 117 đạt) · `--day-du` 147,3 s
PASS 65 · FAIL 0 · CẢNH BÁO 0. D2 80/80 (90 s) · D3 C2 BẮT 1 · C2F 62/23/1 — đối chiếu máy 87/87 không lệch · D4 18/19 rồi
`BV-cha-bo-luot` (neo sửa) BẮT → 19/19 (chạy lại đủ ở mục cuối). Bằng chứng đỏ gốc: 110 đạt · 7 hỏng, SỐ CA 117.

## Soát độc lập — vòng 2 (`/ra-soat`, agent general-purpose mới, 10.10) — chép nguyên báo cáo
```
KHÔNG ĐẠT

Code chạy đúng. Tôi chạy lại trên HEAD d39ad0c, mỗi lệnh chạy riêng, không chồng lệnh nào:
- `node cong_cu/gia_lap/chay.js` → `Giả lập: 29 kịch bản · 16 bất biến · ĐẠT`, thoát 0.
- `thu_gia_lap` → 117 đạt · 0 hỏng.
- `npm test` → PASS 61 · FAIL 0 · CẢNH BÁO 0.
- `--day-du` → PASS 65 · FAIL 0 · CẢNH BÁO 0, `thu_gia_lap` trong đó chạy 37,5 s.
- D4 `python3 viec/TACH-GL/dot_bien.py` → 19/19 BẮT, 365 s.
- D2 `python3 viec/LUOI-1/dot_bien.py -j 4` → 80/80 đúng mong đợi, `VS-SRV-doi-ck-giu-tien-mat` BẮT.
- `kiem_neo.py` → 0 HỎNG trừ `G3-sai-chuoi`.
- Neo của TACH-GL (19) và LUOI-1 (80): script của tôi đếm lại, 0 lệch.

Lý do không đạt: một chỗ báo "đã sửa" nhưng chưa làm (E2), hồ sơ còn số cũ trái với số mới, và Phát hiện 2 chỉ một công cụ đo không chạy được trên HEAD.

LỖI TÌM ĐƯỢC:
- viec/TACH-GL/trang_thai.md:243 — bảng Vòng sửa ghi "E2 thiếu dòng CHƯA KIỂM | Thêm (mục Báo cáo)". Grep `Báo cáo|cong-chay` cả file: không có mục Báo cáo nào. "cong-chay" chỉ nằm trong báo cáo vòng 1 được chép lại (:212, :219). Dòng "E2: 2 check cong + cong-chay — CHƯA KIỂM" vẫn chưa ghi, tức báo sửa mà chưa sửa. — K1
- viec/TACH-GL/trang_thai.md — sau khi chạy lại bằng chứng, các câu trích số cũ không được sửa theo:
  - :22–23 "trên gốc 109 đạt · 6 hỏng … trên head 115 đạt · 0 hỏng (SỐ CA … 115)". Thật ra bang_chung_do.txt ghi 110/7 và SỐ CA 117; tôi chạy ra 117.
  - :89 D1 "trong 116 đạt".
  - :97 D4 "16 · BẮT 16 · đúng mong đợi 16/16 · 318 s", trong khi tiêu đề :30 ghi 19/19 · 359 s.
  - :80–81 A2 "giả lập … CPU 7,4 s", "sàn = tổng CPU ~35–40 s". Số đo sau vòng sửa ở :247 là CPU giả lập 7,7–9,0 s và CPU thu_gia_lap 38,7–44,7 s, nên sàn đã cao hơn số ghi. Ước 45–55 s nay sát sàn mà không có lời giải thích.
  KHUON_LOI K4 có luật đúng chỗ này: "chạy lại bằng chứng → grep hồ sơ tìm mọi câu trích con số cũ". — K4
- viec/TACH-GL/trang_thai.md:259 (Phát hiện 2) — dòng này bảo "Đo từng KB sau chia lượt: dùng `viec/TACH-GL/do_chia.js <KB>`". Tôi chạy `node viec/TACH-GL/do_chia.js 2` trên HEAD: ra `Giả lập: 1 kịch bản · 16 bất biến · KHÔNG ĐẠT (28 lệch)` (`✗ chia lượt → KB1 chạy 0 lần` …), và `CPU 0.1 s` chỉ là CPU của tiến trình cha. Lý do: do_chia.js:24–33 chép chay.js của HEAD rồi chèn bộ lọc vào vòng của con. Cha vẫn sinh đủ 4 lượt và đòi đủ 29 KB, còn dòng CPU của con không bao giờ được chuyển lên cha. Công cụ được khuyến nghị cho P26c mà chưa chạy thử trên HEAD. — K1, và K4 (công cụ đo rữa ngay sau chính thay đổi của việc này, cùng dạng với do_thoi_gian.js)

NGHI NGỜ:
- cong_cu/gia_lap/kich_ban.js:590 (chú thích LUOT) dặn "đổi LUOT thì chạy lại E2 … (viec/TACH-GL/do_chia_e2.js)". Trên HEAD công cụ này chạy phần GIAO giữa LUOT đã commit và LUOT đề xuất, không chạy riêng LUOT đề xuất. Thêm nữa, vế "thoát 1" trong điều kiện BẮT luôn đúng, vì lệch "chạy 0 lần" (do_chia_e2.js:48). Tôi chạy với LUOT hiện tại ra 13/13, nhưng kết quả đó không chứng minh được gì cho một LUOT mới. Nên trỏ thẳng tới E2 của thu_gia_lap.
- chay.js:111 (`bb.size > 1` — các lượt báo số bất biến khác nhau) và vế thứ hai ở chay.js:106 (`r.ma === 1` mà không có dòng ✗) không có ca thử nào, cũng không có đột biến nào. Xoá hai dòng này đi thì chắc không bài nào đỏ, vì mọi con nạp cùng một bat_bien.js. Tôi chưa dựng đột biến để kiểm.
- chay.js:84–85 cộng Buffer vào chuỗi (`r.ra += d`), không `setEncoding('utf8')`. Đầu ra con dài hơn 64 KB, ví dụ khi đột biến máy chủ làm lệch mọi đơn, thì có thể bị cắt giữa một ký tự nhiều byte ("→", "✗", "Lượt"). Khi đó mất một dòng lệch hoặc mất dòng `Lượt k:`. Hướng hỏng vẫn an toàn (thoát ≠ 0), nhưng đột biến có thể chuyển thành LẠC. thu_gia_lap.js:62 có cùng khuôn từ trước.
- chay.js:98 — khi dừng sớm (một lượt SẬP), mọi dòng ✗ của các lượt đã xong KHÔNG ĐẠT trước đó đều bị bỏ. Mất thông tin chẩn đoán; bộ đột biến dò mẫu có thể ra LẠC thay vì BẮT nếu chỉ một lượt sập.
- Ba điều vòng 1 đã nêu, vẫn CHƯA KIỂM như trang_thai.md ghi: lối con TỪ CHỐI (chay.js:92), lỗi `spawn` (chay.js:87), và SIGKILL sau 10 s sót `gia_lap_*` trên máy 1 lõi (chay.js:75).
- Trong lần chạy D4 của tôi, `VS-luot-tuan-tu` bị hẹn 110 s SIGKILL (thoát SIGKILL, sót `gia_lap_*` trong TMPDIR của bản sao). T1 vẫn bắt nhờ `đã làm false`, nhưng sát ngưỡng: 123 s cho cả lần chạy đột biến.

NGHIỆM THU:    20/21 mục có bằng chứng · mục thiếu: E2 (dòng "check cong + cong-chay — CHƯA KIỂM" chưa ghi vào trang_thai.md, dù :243 nói đã thêm)
(từng mục A0–F "có" — A2 có nhưng số sàn cũ; C3 S4 :755–758 khớp trang_thai:247; đường tiền: KB28 tiền mặt 0 · CK 30.000, máy chủ tự tính soTien (don-mo-rong.js:133–151); KB29 4 ca 7.000/28.000, 5.000/5.000, 7.499/7.501, 7.500/7.500, máy chủ tự tra trần (orders.js:610–623, loyalty.js:183); P1 không đụng client/; Cấm: TRE_MS 40, hạn 120/110, han * 0.8 giữ.)

CHƯA SOÁT ĐƯỢC:
- Không chạy lại D3 (87 đột biến, ~605 s) và D5 đủ (TU-CHAY-4, P26b, HOC-2b, AUDIT-1 D1/G3). Chỉ chạy kiem_neo.
- Không đo trên máy 1 lõi (người gác chặn taskset). Ước A2 và nghi ngờ SIGKILL 10 s chưa kiểm.
- Không xem được check PR (cong / cong-chay).
- Không dựng được lỗi `spawn` hay lối con TỪ CHỐI.
- Không dựng đột biến cho chay.js:106 và :111.

BÀI HỌC:
- NGUYÊN TẮC (K1): mỗi dòng "đã sửa" trong bảng vòng sửa phải kèm commit hoặc file:dòng của chỗ sửa. Người soát grep chỗ đó trước khi tin. (Lần này "Thêm (mục Báo cáo)" không có thật.)
- KHOÁ (K4, lặp lại ở hai vòng liên tiếp): dot_bien.py và bài thử in con số tổng, rồi một phép kiểm hồ sơ so mọi câu "đúng mong đợi n/n", "SỐ CA", "n đạt" trong trang_thai.md với lần chạy cuối. Hoặc tối thiểu: sau mỗi lần chạy lại, grep cả file tìm số cũ và xoá hay đánh dấu "(cũ)".
- NGUYÊN TẮC (K1/K4): công cụ đo nêu trong Phát hiện hay chú thích cho việc sau phải được chạy thử trên HEAD trong lượt đó, kèm dòng ra. Công cụ chỉ dùng "trước khi sửa" (do_chia.js, do_chia_e2.js) phải ghi rõ ở đầu file là KHÔNG dùng sau chia lượt.
- KHOÁ (nhỏ): chay.js `con.stdout.setEncoding('utf8')` / `con.stderr.setEncoding('utf8')`, kèm ca thử đầu ra con lớn hơn 64 KB có ký tự nhiều byte.
```
(Phần NGHIỆM THU từng mục đã rút gọn — bản đủ: mọi mục "có", trừ E2.)

## Vòng sửa 2/3 (sau soát vòng 2, 10.10) — mỗi dòng kèm commit
| Lỗi / nghi ngờ | Xử lý | Commit |
|---|---|---|
| E2 báo "đã thêm" mà chưa thêm (K1) | Thêm mục `## E2` dưới đây (dòng CHƯA KIỂM thật). | commit trang_thai vòng 2 |
| Số cũ còn trong hồ sơ (K4) | Viết lại các mục Bài thử, D4, A, B1, D theo HEAD cuối; số các lần trước chỉ còn trong mục vòng soát/vòng sửa, ghi "(cũ)". Grep lại `109 đạt\|115\|116 đạt\|16/16\|19/19\|7,4 s\|35–40` sau khi viết. | commit trang_thai vòng 2 |
| Phát hiện 2 chỉ công cụ không chạy trên HEAD (K1/K4) | `do_chia.js`, `do_chia_e2.js` chạy THẲNG tiến trình lượt của bản sao (`--luot 1`, LUOT ghi đè = mọi KB) — chạy thử trên HEAD: `do_chia.js 2` → `Lượt 1: KB 2 · ĐẠT`, CPU 1,0 s; `do_chia_e2.js` C' 13/13, C 12/13 (M3 SỐNG). | `bc5a183`, `48f5b52` |
| NGHI NGỜ chú thích LUOT trỏ công cụ hỏng | Chú thích trỏ `thu_gia_lap` (E2), công cụ là bước thử trước. | `d2f6ad5` |
| NGHI NGỜ `bb.size > 1`, `r.ma === 1` không ✗ chưa có đột biến | `VS-luot-thieu-bat-bien`, `VS-con-giau-dong-lech` (BẮT). | `26b5bd6`, `1a2f36f` |
| NGHI NGỜ Buffer không `setEncoding` | `con.stdout/stderr.setEncoding('utf8')`. CHƯA KIỂM bằng ca (không dựng được đầu ra > 64 KB cắt giữa ký tự một cách tất định). `thu_gia_lap.js:62` cùng khuôn từ trước — ngoài thay đổi của việc này, ghi Phát hiện 4. | `a67a16b` |
| NGHI NGỜ dừng sớm bỏ dòng ✗ | Dừng sớm vẫn in dòng lệch của các lượt đã xong, dòng kết luận ở CUỐI. | `a67a16b` |
| NGHI NGỜ SIGKILL sau 10 s sót kho (vòng 1 + 2) | TÁI HIỆN được dưới tải nặng (T6 6/9, T3 `…,SIGKILL`) → sửa tận gốc: cha tạo + dọn kho, `--kho` có kiểm, T7, `BV-cha-khong-don-kho`, `BV-kho-khong-kiem`; T3/T4 thêm vế "ít nhất một lượt đóng 2" (không thì `BV-cha-khong-dung-con-SIGTERM` SỐNG). | `28380c0`, `8e8113f`, `1a2f36f`, `4ada441` |
| NGHI NGỜ `VS-luot-tuan-tu` sát hẹn 110 s | Vẫn BẮT nhờ T1 (không phụ thuộc hẹn); dot_bien mặc định `-j 2` (3 `thu_gia_lap` cùng lúc làm C3 đỏ oan — đo 2/9). | `1a2f36f` |
Sự cố trong vòng sửa (K4, lặp): (a) đoạn thay thế trong `dot_bien.py` cắt theo hai neo đã xoá nhầm 3 đột biến nằm giữa
(`BV-den-kb-0-luot-rong`, `VS-luot-thieu-bat-bien`, `VS-con-giau-dong-lech`) — phát hiện vì lần chạy chỉ ra 2/3 tên, khôi phục từ HEAD;
(b) mẫu `VS-con-giau-dong-lech` ban đầu dò dòng mà E2 không in (E2 chỉ in dòng `→ I<n>`) → LẠC, sửa theo dòng thật.
Bằng chứng đỏ chạy lại trên gốc sau vòng sửa 2: 110 đạt · 8 hỏng; `SỐ CA` 118 (A16).

## Soát độc lập — vòng 3 (`/ra-soat`, agent general-purpose mới, 10.10) — chép nguyên báo cáo
```
KHÔNG ĐẠT

Tôi chạy lại trên HEAD 5977572, mỗi lệnh chạy riêng:
- `node cong_cu/gia_lap/chay.js`: `Giả lập: 29 kịch bản · 16 bất biến · ĐẠT`.
- `node cong_cu/thu_gia_lap.js`: 118 đạt · 0 hỏng, khớp `SỐ CA 118`.
- `npm test`: PASS 61 · FAIL 0 · CẢNH BÁO 0.
- `--day-du`: PASS 65 · FAIL 0 · CẢNH BÁO 0, trong đó thu_gia_lap chạy 37,5 s.
- `kiem_neo.py`: 0 HỎNG, trừ `G3-sai-chuoi` (cố ý).
- Đếm neo `viec/TACH-GL/dot_bien.py`: 22/22 khớp.

Phần chạy đúng không còn gì để chê. Nhưng chính vòng sửa 2 (`--kho`) để lại một lỗ an toàn A2 có thật, và bài thử T7 chỉ khoá được một nửa phép kiểm `--kho`.

LỖI TÌM ĐƯỢC:
- cong_cu/gia_lap/chay.js:86 (cùng :34 và :133–135) — Cha chuyển nguyên `process.argv.slice(2)` cho con rồi mới nối `--luot k --kho <kho cha tạo>`. Nhưng `thamSo` (:34) lấy lần xuất hiện ĐẦU TIÊN của mỗi tham số, nên con nhận `--kho` do người gọi gửi, không nhận kho cha vừa tạo. Phép kiểm `--kho` ở :134 lại chạy ở cấp module, tức là chạy cả ở cha. Vì vậy `--kho` gửi cho cha được kiểm cho qua, rồi chuyển xuống mọi con.
  Đã chứng minh bằng chay.js THẬT, không sửa gì (scratchpad/demo_kho.js): `node chay.js --kho $TMPDIR/gia_lap_KHAC01 --den-kb 0` → thoát 0 · ĐẠT, và thư mục "của tiến trình khác" bị XOÁ cùng file đánh dấu bên trong. Chạy đủ thì cả 4 lượt dùng chung một kho.db, cả 4 thoát 1, thư mục lạ vẫn bị xoá.
  Câu hỏi A2 của phiếu ("cha/con có xoá được thư mục của tiến trình khác không?") có câu trả lời là CÓ: kho `gia_lap_*` của một giả lập khác đang chạy cùng TMPDIR (thu_gia_lap, bộ đột biến -j) sẽ bị xoá. — K4 (thêm `--kho` ở con, quên đường chuyển argv của cha) + B4.
- cong_cu/gia_lap/chay.js:61 + :86 — Cũng do chuyển argv như trên, nên cha tự sinh lại chính nó mãi (fork bomb). `--luot 0`, `--luot x`, hay `--luot` thiếu giá trị đều cho `LUOT_K` = 0/NaN → chạy như cha. Con của nó nhận `--luot <giá trị hỏng> … --luot k`, lấy giá trị đầu nên cũng chạy như cha → đệ quy không đáy: 4^n tiến trình, mỗi tiến trình một mkdtemp. Riêng `--den-kb 0` chỉ một con mỗi cấp nên là chuỗi vô hạn.
  Đã chứng minh trên bản sao trong os.tmpdir có chặn độ sâu 3 (scratchpad/demo_luot.js): cha in lồng 3 cấp `✗ chia lượt → lượt 1 thoát … không kèm kết quả`. Không có ca thử, không có đột biến nào cho trường hợp này. Bản thân lối `--luot` có từ c75971d. — K4/K7.
- cong_cu/thu_gia_lap.js:286 (T7) cùng :184, :54 — Tên ca ghi "--kho ngoài thư mục tạm", nhưng `rong` = `TAM/may_chu_rong` mà TMPDIR của con chính là `TAM`, tức là nằm TRONG thư mục tạm. T7 chỉ thử vế tên `gia_lap_xxxxxx`, không thử vế "thư mục cha là thư mục tạm" (chay.js:134).
  Đột biến tự dựng (dùng nguyên `cham()` của viec/TACH-GL/dot_bien.py, có kiểm realpath): bỏ RIÊNG vế thư mục tạm → **SỐNG** (thu_gia_lap thoát 0). Bỏ RIÊNG vế tên → BẮT ở T7. Nghĩa là `--kho /bất/kỳ/gia_lap_abcdef` có thể bị `rmSync` mà không bài nào đỏ. `BV-kho-khong-kiem` bỏ cả khối nên che mất chỗ hở này. Dòng D4 ở trang_thai.md:48 ("chỉ nhận gia_lap_xxxxxx trong thư mục tạm … T7") hứa nhiều hơn thứ T7 thật sự khoá. — K3 (ca chặn vi phạm hai vế; tên ca khác chỗ kiểm).
- cong_cu/gia_lap/chay.js:56 — Chú thích "CHA (không có --luot): không kho tạm" trái với :70–:85 (từ 28380c0 cha tạo kho từng lượt). viec/TACH-GL/ke_hoach.md:124 ("cha: KHÔNG tạo kho tạm") cũng cũ, file chưa sửa lần nào từ d1ee840. Bảng mã thoát ở ke_hoach.md:146–151 chưa có lối `--kho` từ chối. — K4 (sửa thiết kế mà không grep câu cùng nghĩa).
- viec/TACH-GL/trang_thai.md:29 — Câu "TỪ CHỐI — … + T7 (con: `--kho` lạ)" được tính là phủ lối dòng cuối của CHA. Nhưng T7 gọi thẳng `--luot 1` (thu_gia_lap.js:257), không đi qua cha. Lối cha :100 (`ma === 3 → dungHet(cuoiCon, 3)`) vẫn chưa có ca nào tới được. — K1.

NGHI NGỜ:
- T4 (thu_gia_lap.js:271–279): vế "ít nhất một lượt đóng 2" luôn đúng sẵn, vì chính lượt bài thử SIGTERM (pid[0]) tự thoát 2 nhờ chay.js:137. Vế này chỉ có tác dụng ở T3, khác với trang_thai.md:30–31 nói cần cho cả T3/T4. Chưa thấy đột biến cụ thể nào lọt qua, vì `dungHet` dùng chung với T3.
- T3/T4 đòi có ít nhất một lượt đáp SIGTERM trong 10 s. Máy 1 lõi tải nặng có thể làm mọi lượt đóng SIGKILL → đỏ oan. Chưa đo được, người gác chặn `taskset`.
- chay.js:95: `con.on('error')` cũng phát ra khi `kill()` thất bại, lúc đó có thể gọi `xong()` trước `close`. Ảnh hưởng rất nhỏ; chưa dựng được.
- Lần đầu tôi đếm neo LUOI-1 thì báo `GOC-KB10-siet-tre-khong-bat-lai` lệch. Đó là tôi soát nhầm: neo đó áp lên git archive của gốc cũ, không áp lên HEAD (K2 của tôi). Không phải lỗi.

NGHIỆM THU:    20/21 mục có bằng chứng và đạt · B4 có bằng chứng nhưng bị lỗi thứ nhất bác (A2: cha/con xoá được thư mục `gia_lap_*` của tiến trình khác; tham số `--luot` hỏng gây đệ quy). (từng mục còn lại: có.)

CHƯA SOÁT ĐƯỢC:
- Chưa chạy lại đủ D2 (80), D3 (87), D4 (22) và D5 (TU-CHAY-4, P26b, HOC-2b, AUDIT-1 D1/G3); chỉ chạy kiem_neo và đếm neo.
- Không chạy fork bomb thật mà không có chặn độ sâu (nguy hiểm cho máy).
- Không đo trên máy 1 lõi.
- Không xem được check PR.
- Không dựng được lối cha :100 (con TỪ CHỐI) hay lỗi spawn.
- K5 đã thử và qua: TMPDIR tương đối `rel/`, và TMPDIR tuyệt đối có `/` cuối (`--den-kb 28` ĐẠT, không sót).

BÀI HỌC:
- KHOÁ: cha không chuyển tiếp tham số nội bộ. Lọc `--luot`/`--kho` khỏi argv trước khi sinh con, và cha TỪ CHỐI (thoát 3) khi người gọi gửi `--kho`, hoặc `--luot` không phải số nguyên 1..L. Kèm ca thử `--luot 0`, `--luot x`, `--luot` thiếu giá trị, và cha nhận `--kho` hợp lệ → từ chối, thư mục còn nguyên.
- KHOÁ: tách T7 thành hai ca, mỗi ca vi phạm ĐÚNG MỘT vế: tên đúng nhưng nằm ngoài TMPDIR; trong TMPDIR nhưng tên sai. Thêm đột biến bỏ riêng từng vế vào dot_bien.py.
- NGUYÊN TẮC (K4): thêm tham số cha→con thì rà mọi đường argv đi qua: chuyển tiếp, lấy lần đầu hay lần cuối, phép kiểm chạy ở cấp module (cả cha lẫn con). Đổi thiết kế đã duyệt thì grep chú thích và ke_hoach tìm mọi câu cùng nghĩa ("cha không tạo kho").
- NGUYÊN TẮC (K3): tên ca có chữ "ngoài X" thì đầu vào phải thật sự nằm ngoài X. Tự kiểm bằng cách in đường thật so với TMPDIR của con.
```

## Vòng sửa 3/3 (sau soát vòng 3, 10.10) — vòng sửa CUỐI, mỗi dòng kèm commit
| Lỗi / nghi ngờ | Xử lý | Commit |
|---|---|---|
| `--kho` người gọi đè kho cha tạo → xoá kho của giả lập khác (A2, K4) | Cha nhận `--kho` → TỪ CHỐI (thoát 3). Không còn cách nào để `--kho` lạ tới con qua cha. T8 + `BV-cha-nhan-kho`. | `a42f5e4`, `ace7848`, `d324342` |
| `--luot` hỏng → cha tự sinh lại mãi (K4/K7) | Chế độ theo SỰ CÓ MẶT của `--luot` (`LA_CON`), mọi chỗ `if (LUOT_K)` → `LA_CON`; `--luot` phải là số nguyên ≥ 1, không thì TỪ CHỐI. Bỏ phép kiểm (đột biến `BV-luot-khong-kiem`) cũng không đệ quy: con với lượt không có → sập thoát 2 → T9 (đòi 3) bắt. | `a42f5e4`, `ace7848`, `d324342` |
| T7 chỉ khoá một vế (K3) | T7a (tên đúng, ngoài TMPDIR) · T7b (trong TMPDIR, tên sai) — mỗi ca vi phạm ĐÚNG một vế; đột biến `BV-kho-bo-ve-thu-muc-tam` (T7a), `BV-kho-bo-ve-ten` (T7b). Mẫu `BV-kho-khong-kiem` đổi `✗ T7 ` → `✗ T7a `, `✗ T7b ` (đổi tên ca làm rữa mẫu — bắt được ở lần chạy, LẠC → sửa → BẮT). | `ace7848`, `d324342` |
| Chú thích chay.js / ke_hoach.md "cha không tạo kho", bảng mã thoát (K4) | Sửa chú thích; ke_hoach ghi "(Sửa sau duyệt — vòng sửa 2, 3)" ở thiết kế + bảng mã thoát. | `a42f5e4`, `e1633d6` |
| trang_thai: T7 tính là lối TỪ CHỐI của cha (K1) | Lối TỪ CHỐI của CHA nay có T8 + T9 + E3; lối "con thoát 3 → cha thoát 3" (`dungHet(cuoiCon, 3)`) không tới được (cha đã kiểm A1, `--luot`, `--kho` trước khi sinh con với cùng môi trường) → CHƯA KIỂM. | commit trang_thai vòng 3 |
| NGHI NGỜ vế "đóng 2" chỉ có tác dụng ở T3 | Đúng — ở T4 lượt bị bài thử SIGTERM luôn đóng 2; vế này khoá T3 (`BV-cha-khong-dung-con-SIGTERM`). Ghi rõ ở mục Bài thử. | commit trang_thai vòng 3 |
| NGHI NGỜ 1 lõi mọi lượt SIGKILL → T3 đỏ oan | CHƯA KIỂM (taskset bị chặn); máy mây dưới tải 3× song song: 12/12 sạch. Chat đo. | — |
| NGHI NGỜ `on('error')` khi `kill()` lỗi | Ảnh hưởng: `xong()` gọi sớm, cha có thể kết thúc trước khi con đó đóng — con vẫn tự dọn (disconnect), cha dọn kho lúc thoát. CHƯA KIỂM (không dựng được). | — |

## E2 — check PR
2 check `cong` + `cong-chay`: **CHƯA KIỂM** — máy không xem được check của PR, và việc này không tạo PR (luật `/lam-viec`). Không đổi
`tu_chay/` → không cần `cai_dat.sh`.

## Soát kiểm chứng — sau vòng sửa 3/3 (`/ra-soat`, agent general-purpose mới, 10.10) — chép nguyên báo cáo
```
KHÔNG ĐẠT

Phần code chạy đúng. Lý do không đạt: thay đổi chính của vòng sửa 3 (chọn chế độ cha/con theo sự có mặt của `--luot`) không có bài thử nào khoá. Tôi dựng đột biến đưa nó về lỗi cũ, cả bộ vẫn 123/123 xanh.

Các lệnh tôi chạy lại trên HEAD 200264d, lần lượt từng lệnh, máy 4 lõi:
- `node cong_cu/gia_lap/chay.js`: 4 lượt, `Giả lập: 29 kịch bản · 16 bất biến · ĐẠT`, thoát 0.
- `node cong_cu/thu_gia_lap.js`: 123 đạt · 0 hỏng, khớp `SỐ CA 123`.
- `npm test`: PASS 61 · FAIL 0 · CẢNH BÁO 0.
- `--day-du`: PASS 65 · FAIL 0 · CẢNH BÁO 0, thu_gia_lap trong đó 38,4 s, dist khớp src.
- D2 `python3 viec/LUOI-1/dot_bien.py -j 4`: 80/80 đúng mong đợi. `VS-SRV-doi-ck-giu-tien-mat` BẮT (`KB28 → I16`), `GOC-KB10-cu-tre-khong-bat-lai` LẠC như gốc.
- D4, năm đột biến của vòng sửa 3 (`BV-kho-khong-kiem`, `BV-kho-bo-ve-thu-muc-tam`, `BV-kho-bo-ve-ten`, `BV-cha-nhan-kho`, `BV-luot-khong-kiem`): 5/5 BẮT, 169 s.
- `kiem_neo.py`: 0 HỎNG, trừ `G3-sai-chuoi` (cố ý). Tự đếm neo: TACH-GL 26/26, LUOI-1 78/78 (bỏ GOC-*), lệch 0.
- A17: cả 26 tên đột biến có nguyên văn trong trang_thai.md.
- `do_chia.js 2 28` chạy được trên HEAD (2 lượt ĐẠT, CPU 1,0 s mỗi lượt).
- `--chi-kiem-an-toan` → "an toàn: qua". `--den-kb 10` → chỉ lượt 2, KB 3,10, ĐẠT.
- Không sót thư mục `gia_lap_*`, `tachgl_*` hay `thu_gl_*` trong /tmp.

LỖI TÌM ĐƯỢC:
- cong_cu/thu_gia_lap.js:299–300 (T9), đối chiếu cong_cu/gia_lap/chay.js:59 và :62 — Tên ca T9 hứa "không rơi về chế độ cha", nhưng ca chỉ kiểm thoát 3 + chữ `/TỪ CHỐI/`. Tôi dựng đột biến đúng lỗi cũ, chọn chế độ theo GIÁ TRỊ: `const LA_CON = Number(thamSo('--luot', '')) > 0;`. Bản sao nằm trong scratchpad, đã kiểm realpath, có `server/` chép thật. Kết quả:
  - `chay.js --luot x`, `--luot 0` và `--luot` thiếu giá trị đều rơi về chế độ cha và sinh đủ 4 lượt (in `lượt 1/4 pid …`). Mỗi con có `--kho` nên bị :62 từ chối, cha thoát 3 với dòng "TỪ CHỐI chạy — --kho chỉ dành cho tiến trình lượt".
  - `node cong_cu/thu_gia_lap.js --gia-lap <bản sao>` → **123 đạt · 0 hỏng**, cả 3 ca T9 xanh. Đột biến SỐNG.
  - Hệ quả: thay đổi chính của vòng sửa 3 không được bài nào khoá. Không còn đệ quy chỉ là nhờ phép từ chối `--kho` ở cha (:62) tình cờ chặn từ cấp hai. Bảng D4 không có dòng nào cho "chế độ theo sự có mặt"; `BV-luot-khong-kiem` chỉ gỡ phép regex ở :61.
  - Cách sửa: thêm vế "không có dòng `lượt k/L pid`" vào T9, kèm đột biến chọn chế độ theo giá trị.
  - Khuôn: K3 (tên ca nói một đằng, máy kiểm một nẻo; mỗi ca chặn phải khớp câu kết luận, không chỉ chữ TỪ CHỐI chung).
- cong_cu/gia_lap/chay.js:61 + :269/:273 — `--luot` là số nguyên nhưng lớn hơn số lượt thì không bị từ chối. Tôi chạy thật:
  - `--luot 5 --den-kb 0` → `Lượt 5: KB  · 16 bất biến · ĐẠT`, thoát 0. Một lượt không tồn tại mà báo ĐẠT.
  - `--luot 5 --den-kb 3` → `SẬP — TypeError … reading 'includes'`, thoát 2, thay vì TỪ CHỐI thoát 3.
  - Hướng hỏng an toàn: không xoá gì, không đệ quy, không sót kho. Chỉ lộ khi gọi thẳng `--luot`.
  - Báo cáo vòng 3 đề xuất khoá "1..L", vòng sửa 3 chỉ làm "≥ 1" mà trang_thai không ghi lý do bỏ chặn trên.
  - Khuôn: K4 (sửa nửa vời phép kiểm giá trị), mức nhẹ.

NGHI NGỜ:
- chay.js:61 — `--luot` thiếu giá trị in "…≥ 1: undefined" chứ không phải "(thiếu)", vì `thamSo` trả `argv[i+1]` khi cờ có mặt. Chỉ là chữ hiển thị.
- chay.js:140–142 — Gọi thẳng `--luot k --kho <kho gia_lap_xxxxxx có thật của một giả lập khác cùng TMPDIR>` vẫn được nhận, và kho đó bị `rmSync` lúc thoát. Đường qua cha đã bịt (T8). Hiện không công cụ nào gọi kiểu này, nhưng phép kiểm không phân biệt "kho cha vừa tạo" với "kho của người khác". Có thể khoá thêm bằng IPC (`process.send` có mặt) hoặc một thẻ trong kho.
- chay.js:140 — `--luot 1 --kho` thiếu giá trị thì lặng lẽ tự tạo kho. Hướng an toàn, nhưng không báo gì.
- trang_thai.md, Bài thử + bảng vòng sửa 3 dòng 5 — ghi lối "con thoát 3 → cha thoát 3" (chay.js:107) là "không tới được → CHƯA KIỂM". Đúng với code thật. Nhưng đột biến của tôi cho thấy lối này tới được tất định qua bản sao `--gia-lap` (4 con thoát 3, cha in dòng TỪ CHỐI của con, thoát 3). Có thể khoá bằng đột biến kiểu E4 thay vì để CHƯA KIỂM.
- T7a/T7b/T8 cũng chỉ so `/TỪ CHỐI/` chung. Hiện vẫn bắt được nhờ vế "thư mục còn nguyên", nhưng không phân biệt phép từ chối nào đã chạy (cùng khuôn với lỗi 1, nhẹ hơn).
- ke_hoach.md §5 mục 2 ghi cha in `Giả lập: lượt k/L pid …`; thực tế là `  lượt k/L pid …` (chay.js:96). Bảng §8 không có T6–T9. Câu cũ trong kế hoạch đã duyệt, trang_thai đã phủ T6–T9.

NGHIỆM THU:    21/21 mục có bằng chứng (E2 ghi CHƯA KIỂM, chấp nhận được) · mục thiếu: không có. Nhưng lỗi 1 bác lời khẳng định của vòng sửa 3 ở B4/D4: phép "không rơi về chế độ cha" không được khoá.
(từng mục A0–F: có — xem báo cáo; đường tiền: không có lỗi tiền; P1: không đụng client/.)

CHƯA SOÁT ĐƯỢC:
- Chưa chạy lại đủ D3 (87 đột biến, khoảng 640 s), 21 đột biến D4 còn lại, và D5 đủ bộ (TU-CHAY-4, P26b, HOC-2b, AUDIT-1 D1/G3). Chỉ đọc mẫu: mọi mẫu `--den-kb` của bộ cũ là KB n cùng n.
- Không đo trên máy 1 lõi (taskset bị người gác chặn).
- Không xem được check PR `cong` / `cong-chay`.
- Không chạy đột biến kép "chọn chế độ theo giá trị + bỏ :62". Đó sẽ là đệ quy thật, nguy hiểm cho máy.
- Không dựng được lỗi `spawn`.

BÀI HỌC:
- KHOÁ (K3): ca "không rơi về chế độ X" phải kiểm DẤU VẾT của X (ở đây: không có dòng `lượt k/L pid`), không chỉ kiểm mã thoát + chữ kết luận chung. Kèm đột biến đưa đúng lỗi cũ trở lại (chọn chế độ theo giá trị) vào viec/TACH-GL/dot_bien.py.
- KHOÁ: `--luot` phải nằm trong 1..LUOT.length, nếu không thì TỪ CHỐI; ca T9 thêm `--luot 5` (cả khi có `--den-kb 0`).
- NGUYÊN TẮC (K3/K4): sửa lỗi của vòng soát thì đột biến phải TÁI HIỆN đúng lỗi được báo, không chỉ gỡ phép kiểm mới thêm. Gỡ phép thì chỉ đo phép đó; còn thiết kế chặn lỗi (chọn chế độ theo sự có mặt) vẫn không được khoá.
- NGUYÊN TẮC (K3): tất cả các ca từ chối (T7a/T7b/T8/T9) nên so đúng câu từ chối của phép đang thử, để phép khác từ chối thay không làm ca xanh oan.
```
(Phần NGHIỆM THU từng mục đã rút gọn — bản đủ: 21/21 có bằng chứng, E2 CHƯA KIỂM.)

## Câu hỏi
- **Q3 — đã dùng hết 3 vòng sửa (`so_vong_sua_toi_da` 3), soát kiểm chứng sau vòng sửa 3 vẫn KHÔNG ĐẠT** (báo cáo chép nguyên ở trên).
  Code chạy đúng trên mọi phép (giả lập 29 KB ĐẠT 24,3–24,4 s; `thu_gia_lap` 123 đạt 36,9–38,4 s; `--day-du` 0 CẢNH BÁO; D1–D5 đủ,
  không giảm lưới). Hai lỗi còn lại đều thuộc lưới tự kiểm của chính việc này, KHÔNG phải lỗ của quầy, và hướng hỏng an toàn:
  1. (K3) T9 không khoá được "chế độ theo SỰ CÓ MẶT của `--luot`": đột biến chọn chế độ theo giá trị vẫn 123/123 xanh (đệ quy vẫn
     bị chặn — nhờ phép cha từ chối `--kho` ở cấp hai, không nhờ bài thử).
  2. (K4, nhẹ) `--luot` > số lượt không bị TỪ CHỐI (`--luot 5 --den-kb 0` báo ĐẠT; `--den-kb 3` sập thoát 2). Chỉ lộ khi gọi thẳng.
  Đề xuất vòng sửa 4 (ước ~15 dòng + 2 đột biến, ~1 giờ máy chạy lại D1–D5):
  - `chay.js:61`: `--luot` phải là số nguyên 1..`LUOT.length` (đọc `LUOT` từ `kich_ban.js` — không nạp máy chủ), in "(thiếu)" khi
    thiếu giá trị.
  - `thu_gia_lap.js` T9: thêm `--luot 5` (và `--luot 5 --den-kb 0`); mọi ca T7a/T7b/T8/T9 so ĐÚNG câu từ chối của phép đang thử và
    T9 thêm vế "không có dòng `lượt k/L pid`" (không rơi về chế độ cha).
  - `viec/TACH-GL/dot_bien.py`: `VS-che-do-theo-gia-tri` (`const LA_CON = Number(thamSo('--luot', '')) > 0;` → T9 bắt nhờ vế dấu
    vết cha), `BV-luot-bo-chan-tren` (→ T9 `--luot 5`).
  - Nghi ngờ `--luot k --kho <kho gia_lap_ có thật của người khác>` gọi THẲNG (không qua cha): đề xuất con chỉ nhận `--kho` khi có kênh
    IPC (`process.send` — tức là cha sinh), không thì TỪ CHỐI; công cụ đo (`do_chia*.js`) không truyền `--kho` nên không bị chặn.
  Chọn: (a) **cho phép vòng sửa 4** như trên **(đề xuất)**; (b) giữ nguyên, gom hai lỗi vào việc sau (P26c chạm `chay.js` trước).
  Máy DỪNG ở đây — không tự sửa thêm.
- Q1, Q2 (kế hoạch mục 10): đã trả lời cùng lời duyệt — xem mục "Chủ quán duyệt kế hoạch".

## Phát hiện (ngoài phạm vi — KHÔNG sửa)
1. Màn quản trị thêm quà (`client/src/pages/Settings.jsx:565–571`) gửi `POST /api/pos/rewards` KHÔNG kèm `max_discount`; sửa
   quà (`:581`) chỉ gửi `is_active`. Máy chủ nhận được trần (`server/routes/rewards.js:32`, `:47`, `:65`) nhưng từ màn hình
   KHÔNG đặt được trần cho quà % → quà % tạo ở quầy luôn KHÔNG trần (khách đổi quà 50 % mua đơn lớn được giảm 50 % không giới
   hạn). Nghiệp vụ — chủ quán quyết có cần ô "giảm tối đa" trên màn thêm quà không.
2. `viec/LUOI-1/do_thoi_gian.js:41` (ngoài Phạm vi): neo `  const tong = \`Giả lập:` rữa — dòng tổng trong lượt con nay là
   `Lượt k: …` (`cong_cu/gia_lap/chay.js`), và cha không chuyển tiếp dòng `DO KB…` của con → `node viec/LUOI-1/do_thoi_gian.js kb`
   ném "neo đo không khớp". Đo từng KB sau chia lượt: dùng `viec/TACH-GL/do_chia.js <KB>` (bản sao, mỗi nhóm một tiến trình) hoặc
   việc sau sửa `do_thoi_gian.js` (chèn mốc vào bản sao chay.js và chạy với `--luot k`). P26c sẽ cần.
3. `kiem_neo.py` (HOC-2b) chỉ rà `dot_bien.py` của 6 bộ cũ — không rà công cụ đo `viec/*/do_*.js` và bộ mới (`viec/TACH-GL/`,
   `viec/LUOI-1/`). Neo rữa ở đó chỉ lộ khi chạy (soát vòng 1 bắt `do_thoi_gian.js`; vòng sửa 1 làm rữa `BV-cha-bo-luot`). Đề xuất
   (ngoài Phạm vi): kiem_neo đọc thêm LUOI-1 + TACH-GL và mọi `do_*.js` có bảng neo.
4. `cong_cu/thu_gia_lap.js:62` (`chayGL`) cộng Buffer vào chuỗi không `setEncoding('utf8')` — cùng khuôn soát vòng 2 nêu ở `chay.js`
   (đã sửa ở `chay.js`). Đầu ra giả lập con > 64 KB có thể cắt giữa ký tự nhiều byte → mẫu đột biến ra LẠC. Có từ trước việc này;
   file trong Phạm vi nhưng không đụng vì không dựng được ca đỏ tất định — đề xuất gom vào việc sau.

## Bài học (bước 11)
Sự cố của việc này: (1) kế hoạch chọn cách chia làm M3 SỐNG (soát kế hoạch bắt); (2) sót `gia_lap_*` chập chờn — sửa hai lần mới
tận gốc; (3) mỗi vòng sửa sinh lỗi mới trong chính phần vừa sửa: neo rữa (`BV-cha-bo-luot` sau sửa `--den-kb 0`), mẫu rữa
(`BV-kho-khong-kiem` sau tách T7), xoá nhầm 3 đột biến khi thay khối theo hai neo, `--kho` mở lỗ A2, T9 không khoá thiết kế mới;
(4) hồ sơ còn số cũ sau khi chạy lại (vòng 2); (5) người gác chặn: `nproc`, `for`, `bash -c`, `taskset`, `cd` giữa lệnh, chữ
SECRET/environ trong lệnh, `git commit --amend` (commit `f6e8e9f` dính trailer vào tiêu đề — giữ nguyên).

| Bài | Ngăn | Lý do / đề xuất |
|---|---|---|
| Bằng chứng "mỗi lượt chạy riêng ĐẠT" không chứng minh đột biến cũ còn bắt (M3) | **KHOÁ** (đã làm) | `do_chia_e2.js` + chú thích `LUOT` (`kich_ban.js`): đổi LUOT thì chạy E2 trước. Ngoài Phạm vi đề xuất: bộ kiểm có phép "đổi `LUOT` mà không chạy `thu_gia_lap`" — không làm được tĩnh, giữ ở chú thích. |
| Sửa lỗi vòng soát mà đột biến không tái hiện ĐÚNG lỗi được báo (chỉ gỡ phép mới) | **NGUYÊN TẮC** — K3 | Đề xuất thêm một dòng vào K3 của `KHUON_LOI.md`: "Sửa lỗi người soát báo → đột biến phải đưa ĐÚNG lỗi cũ trở lại (vd chọn chế độ theo giá trị), không chỉ gỡ phép vừa thêm. Đã gây: TACH-GL T9 xanh với lỗi đệ quy cũ." Chưa ghi — chờ chủ quán duyệt cùng Q3 (KHUON_LOI 92/120 dòng). |
| Thêm tham số cha → con: argv chuyển tiếp + "lấy lần đầu" + phép kiểm cấp module chạy cả ở cha | **NGUYÊN TẮC** — K4 | Đề xuất dòng K4: "Thêm cờ nội bộ cha→con → rà mọi đường argv: cha có chuyển tiếp cờ của người gọi không, `thamSo` lấy lần nào, phép kiểm cấp module có chạy ở cha không. Đã gây: TACH-GL `--kho` xoá kho của giả lập khác." Chưa ghi — chờ duyệt. |
| Đổi tên ca / dòng chính sửa → neo + mẫu đột biến của chính việc rữa (lặp 2 lần) | **KHOÁ** (đề xuất, ngoài Phạm vi) | `viec/HOC-2b/kiem_neo.py` đọc thêm `viec/TACH-GL/`, `viec/LUOI-1/` và rà MẪU (không chỉ neo) bằng một lần chạy sạch — hoặc mỗi `dot_bien.py` có `--kiem-neo` chạy trong `npm test`. Phát hiện 3. |
| Chạy lại bằng chứng mà hồ sơ còn số cũ | **NGUYÊN TẮC** — đã có ở K4 ("chạy lại bằng chứng → grep hồ sơ tìm mọi câu trích con số cũ") | Không thêm; lần này vi phạm luật đã có. |
| Thay khối văn bản theo hai neo xoá nhầm phần giữa | **BỎ** | Một lần, bắt ngay ở lần chạy (thiếu tên). |
| Người gác chặn `taskset` → không đo được 1 lõi | **BỎ** | Chat đo; không cần mở luật. |
| Commit dính trailer (`f6e8e9f`), không amend được | **BỎ** | Một lần; các commit sau đúng dạng (dòng trống trước trailer). |
Dọn: lời dặn K3 "Lỗi thất thường: … dựng đột biến đỏ TẤT ĐỊNH" đã được dùng đúng ở sự cố sót kho (`BV-cha-khong-don-kho`) — giữ.

## Báo cáo 7 mục
```
VIỆC:        TACH-GL — Chia giả lập quầy thành nhiều lượt chạy song song (+ KB28 đổi tiền mặt → CK, KB29 quà % có trần)
ĐÃ SỬA:      cong_cu/gia_lap/chay.js — cha (không --luot) sinh 4 lượt CÙNG LÚC, tạo + dọn kho từng lượt, gộp kết quả (số gốc,
             mỗi KB đúng một lần, M từ con, một dòng kết luận ở cuối), dừng con khi SIGTERM/sập, --den-kb rút ngắn, --den-kb 0
             lượt rỗng, --luot/--kho có kiểm; con: A1 trước mọi require, xử lý tín hiệu + disconnect trước khi có kho
             cong_cu/gia_lap/kich_ban.js — LUOT (4 lượt, C'), KB28 (tiền mặt → CK), KB29 (quà 50 % trần: vượt / dưới / ±1đ)
             cong_cu/thu_gia_lap.js — DONG_DAT 29, một dòng tổng, T0–T9, ca SẬP dòng cuối
             kiem_tra_truoc_khi_giao.js — NGUONG_KICH_BAN 27 → 29, chú thích S4 theo số đo
             viec/LUOI-1/dot_bien.py — VS-SRV-doi-ck-giu-tien-mat mong BẮT ở KB28 (kb28)
BÀI THỬ:     chạy trên bản chưa vá → ĐỎ ở thu_gia_lap 13 ca (E1, T1–T9; bang_chung_do.txt, 110 đạt · 13 hỏng), bánh cóc 29
             (27 < 29), LUOI-1 VS-SRV SỐNG; sau khi vá → XANH (123 đạt; --day-du 0 CẢNH BÁO; LUOI-1 80/80)
ĐÃ RÀ K4:    grep "--den-kb|'kb" trong viec/*/dot_bien.py → mọi mẫu KB n cùng n, đã xử lý (LUOI-1 kb26 → kb28); neo của 6 bộ cũ
             (kiem_neo) → 0 rữa trừ G3-sai-chuoi cố ý; lối thoát của cha (tổng / KHÔNG ĐẠT / SẬP / TỪ CHỐI / spawn lỗi) → dòng
             kết luận ở cuối; còn mở: T9 không khoá chế độ theo sự có mặt + --luot > L (Q3)
CHƯA KIỂM:   máy chat 1 lõi (taskset bị chặn — ước giả lập ~26–28 s, thu_gia_lap ~45–60 s, sàn CPU 36,5–39,7 s); check PR cong /
             cong-chay; lối "con thoát 3 → cha thoát 3" và "spawn lỗi" (không dựng được); setEncoding (không dựng được đầu ra
             > 64 KB cắt giữa ký tự tất định); T3/T4 trên 1 lõi tải nặng (đòi ít nhất một lượt đáp SIGTERM trong 10 s);
             soát kiểm chứng cuối KHÔNG ĐẠT — 2 lỗi lưới tự kiểm (Q3); Phát hiện 1 (màn quà thiếu ô trần) là nghiệp vụ
GIT:         (xem git log --oneline -2 ở cuối mục này)
BÀI HỌC:     KHOÁ 2 (1 đã làm: do_chia_e2 + chú thích LUOT; 1 đề xuất: kiem_neo rà bộ mới + mẫu) · NGUYÊN TẮC 3 (2 đề xuất K3/K4
             chờ duyệt, 1 đã có ở K4) · BỎ 3 — chi tiết ở ## Bài học
```
Nghiệm thu — đếm từng mục: A0 ✓ (ke_hoach §1) · A1 ✓ (bảng A: 24,3–24,4 s ≤ 60; 36,9–38,4 s ≤ 72; 0 CẢNH BÁO) · A2 ✓ ước +
CPU, 1 lõi CHƯA KIỂM · B1 ✓ (ke_hoach §2 + 4 lượt chạy riêng ĐẠT) · B2 ✓ (4 phương án đo, C') · B3 ✓ (E1 + một dòng tổng) ·
B4 ✓ có lỗ lưới tự kiểm (Q3) · B5 ✓ (ke_hoach §6, T0) · B5b ✓ (không file mới trong cong_cu/gia_lap/) · B6 ✓ (D1–D3) · C1 ✓
(KB28, LUOI-1 BẮT) · C2 ✓ (KB29, 6 đột biến máy chủ BẮT; Q1 a) · C3 ✓ (29; S4) · D1 ✓ 13/13 · D2 ✓ 80/80 · D3 ✓ 87/87 0 lệch ·
D4 ✓ 26/26 (thiếu đột biến "chế độ theo giá trị" — Q3) · D5 ✓ · E1 ✓ · E2 CHƯA KIỂM · F ✓ (npm test, --day-du, thu_gia_lap xanh).
**Chưa xong:** soát kiểm chứng KHÔNG ĐẠT, hết số vòng sửa → chờ chủ quán trả lời Q3.
