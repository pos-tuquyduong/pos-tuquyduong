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
Bước 8 (soát độc lập `/ra-soat`).

## Bài thử (bước 4) — đỏ trên gốc, xanh trên head
`viec/TACH-GL/bang_chung_do.txt`. `thu_gia_lap`: trên gốc 109 đạt · 6 hỏng (E1 dòng tổng 29, T1–T5); trên head 115 đạt · 0 hỏng
(`SỐ CA cong_cu/thu_gia_lap.js: 115`). Bánh cóc 29: đỏ trên gốc (27). LUOI-1 `VS-SRV-doi-ck-giu-tien-mat`: gốc SỐNG (mong BẮT).
Lối SẬP dòng cuối: ca `máy chủ hỏng (--may-chu thư mục rỗng) → … dòng cuối là dòng SẬP` + T3/T4 (dòng cuối SẬP). Lối TỪ CHỐI:
E3 có sẵn (`cuoi()` chứa TỪ CHỐI — cha kiểm A1 trước khi sinh con). Lối tổng: E1 (`cuoi(e1) === DONG_DAT`).
T3/T4 thêm vế "mọi lượt bị dừng (đóng ≠ 0)" TRƯỚC lần ghi bằng chứng cuối (thiếu vế này thì `BV-cha-khong-dung-con-khi-sap`
SỐNG: các lượt khác chạy hết rồi cha vẫn thoát 2) — bằng chứng đỏ chép từ lần chạy SAU khi thêm.

## D4 — chỗ đổi → đột biến (`python3 viec/TACH-GL/dot_bien.py`, head sau vòng sửa 1, 359 s: 19 đột biến · BẮT 19 · đúng mong đợi 19/19)
| Chỗ đổi | Đột biến | Bắt bằng |
|---|---|---|
| cha sinh mọi lượt (`chon`) | `BV-cha-bo-luot` | E1 (25 KB, 4 lệch) + T2 |
| `LUOT` một KB ở hai lượt | `VS-kb-hai-luot` | E1 `chia lượt → KB5 chạy 2 lần` |
| `LUOT` KB5 hai lượt, KB6 không (N vẫn 29) | `VS-luot-trung-thieu` | E1 thoát 1 dù 29 KB — `chia lượt → KB6 chạy 0 lần` |
| phép "đúng một lần" của cha | `BV-cha-kiem-mot-lan` | T2 (`1,2,3,4,5,5,7,…`) |
| mã thoát / kết luận của cha | `VS-cha-nuot-ma-thoat` | E2 M1, M13 (thoát 0) |
| cha không in lại dòng tổng của con | `VS-cha-in-lai-tong-con` | E1 "đúng MỘT dòng" |
| cha SIGTERM → dừng con | `BV-cha-khong-dung-con-SIGTERM` | T3 |
| một lượt sập → dừng con khác | `BV-cha-khong-dung-con-khi-sap` | T4 (thoát 1, đóng 0) |
| con theo dõi cha (`disconnect`) | `BV-con-khong-theo-doi-cha` | T5 (con còn sống sau 15 s) |
| các lượt CÙNG LÚC | `VS-luot-tuan-tu` | T1 (đã làm false — không dùng ngưỡng giờ) |
| dòng lệch giữ SỐ GỐC | `VS-dong-lech-so-trong-luot` | E2 M1 (`KB2 → I6` thay `KB10`) |
| `loyalty.js:183` loại mã = loại quà | `VS-SRV-qua-viet-cung-fixed` | KB29 HTTP 400 + I12 |
| `loyalty.js:183` trần mã = trần quà | `VS-SRV-qua-bo-tran` | KB29 HTTP 400 + I12 |
| `orders.js:620` áp trần khi bán | `BV-SRV-ban-bo-ap-tran` | KB29 HTTP (bán 35.000) |
| `orders.js:621` chỉ áp trần khi VƯỢT | `VS-SRV-tran-luon-ap` | KB29 HTTP (bán 10.000, ca dưới trần) |
| con cài xử lý tín hiệu TRƯỚC khi tạo kho | `VS-kho-truoc-tin-hieu` | T6 (sót kho) |
| `orders.js:621` ngưỡng trần (ca ngay TRÊN 1đ) | `VS-SRV-tran-doi-nguong-tren` | KB29 HTTP (quà trần 7.499) |
| `orders.js:621` ngưỡng trần (ca ngay DƯỚI 1đ) | `VS-SRV-tran-doi-nguong-duoi` | KB29 HTTP (quà trần 7.501) |
| `--den-kb 0` = lượt rỗng | `BV-den-kb-0-luot-rong` | T0 |
Không có phần dựng đầu lượt (B2 ii) → không có đột biến "bỏ dựng đầu lượt".

## Soát kế hoạch (agent phụ, chỉ đọc, 10.10) — CẦN SỬA 7 điểm, đã sửa trong ke_hoach.md
1. Cách chia C cũ tách KB4 (lượt 3) / KB8 (lượt 4) → M3 (đối soát cộng debt_payment, `thu_gia_lap` E2) SỐNG: KB4 ghi dòng
   `debt_payment` của KH.quen (`server/routes/orders.js:1257`), M3 chỉ lệch ở KB8 khi dòng đó có. Bằng chứng: `do_chia_e2.js` trên C
   → 12/13 (M3 SỐNG), trên C' (KB8 sang lượt 3) → 13/13 BẮT. Đổi sang C'; bảng B1 thêm cột "cần để đột biến vẫn bắt".
2. Thêm phép B6 trước khi chốt cách chia (`do_chia_e2.js`); C2F 87 chạy ở D3 sau khi làm — SỐNG mới thì đổi `LUOT`, không nới.
3. Ghi rõ: M lấy từ con (giữ E4c), cha không in lại dòng tổng của con (bánh cóc lấy kết quả khớp đầu), ca "đúng một dòng tổng".
4. LUOI-1: thêm 28 vào vòng `LENH` (`dot_bien.py:140`).
5. Bước còn thiếu: `npm test` (F), E1, E2 CHƯA KIỂM, cột soQuay/nhanKho trong B1.
6. Ước CPU 1 lõi cộng tiến trình con của T1–T5.
7. KB28 sang lượt 1 (bỏ ràng buộc "sau KB27").

## Sự cố giữa chừng — sót `gia_lap_*` chập chờn (K4, đã sửa)
Đo A1 lần 3 của `thu_gia_lap`: 114 đạt · 1 hỏng; chạy lại 3 lần: 1 lần hỏng `mọi thư mục gia_lap_* đã xoá, kể cả lần sập` (sót 2
kho) — 2/6 lần. Truy nguyên: con tạo kho (`mkdtempSync`) TRƯỚC khi cài xử lý SIGTERM; lần `--may-chu` rỗng một lượt sập → cha
SIGTERM các lượt khác, tín hiệu rơi đúng khe → con chết theo mặc định, sót kho. Sửa `chay.js`: cài xử lý tín hiệu + `disconnect`
TRƯỚC `mkdtempSync` (xử lý JS chỉ chạy sau khối đồng bộ, khi đã có xử lý `exit`). Thêm ca T6 (SIGTERM mọi lượt ngay khi kho đầu tiên
vừa tạo) + đột biến TẤT ĐỊNH `VS-kho-truoc-tin-hieu` (thứ tự cũ + chờ 500 ms ở khe → T6 bắt). Bằng chứng đỏ chạy lại trên gốc
(`viec/TACH-GL/chay_goc.js`: 109 đạt · 7 hỏng), `SỐ CA` 115 → 116 (A16). Sau sửa: 8/8 lần `thu_gia_lap` sạch (cùng khung đã thấy lỗi
2/6 — chỉ là bằng chứng phụ; bằng chứng chính là đột biến tất định).

## A — số đo (máy mây 4 lõi, chạy riêng, `node viec/TACH-GL/do_cpu.js` — CPU = user + sys của mọi tiến trình con được chờ)
| | Gốc (A0) | Head `f6e8e9f` (A1, 3 lần) | Mục tiêu |
|---|---|---|---|
| giả lập | 79,8 s · CPU 4,1 s · 27 KB | **22,9 · 22,7 · 22,8 s** · CPU 7,0–7,7 s · 29 KB ĐẠT | ≤ 60 s |
| `thu_gia_lap` | 89,6 s · 109 đạt | **35,5 · 37,0 · 37,2 · 34,9 · 35,6 · 35,6 · 36,0 · 36,1 s** (8 lần) · CPU 34,7–39,6 s · 116 đạt | ≤ 72 s |
| `--day-du` | 252,5 s · 0 CẢNH BÁO | **140,1 s** · PASS 65 · FAIL 0 · **CẢNH BÁO 0** | 0 CẢNH BÁO |
A2 — ước máy chat 1 lõi: giả lập ~25 s (CPU 7,4 s ≪ 22,8 s chờ); `thu_gia_lap` sàn = tổng CPU ~35–40 s, cộng chờ chồng lên → ước
~45–55 s (< 72 s). CHƯA KIỂM trên 1 lõi (người gác chặn `taskset`) — chat đo xác nhận (chat đã đo bản sao: lượt dài nhất 26,6 s).
`npm test`: PASS 61 · FAIL 0 · CẢNH BÁO 0.

## B1 — mỗi lượt chạy RIÊNG trên code thật (`node cong_cu/gia_lap/chay.js --den-kb <KB cuối của lượt>`)
`--den-kb 28` → Lượt 1: KB 2,15,17,28 ĐẠT · `--den-kb 21` → Lượt 2: KB 3,10,16,18,21 ĐẠT · `--den-kb 27` → Lượt 3: KB
1,4,5,6,7,8,14,23,24,25,26,27 ĐẠT · `--den-kb 29` → Lượt 4: KB 9,11,12,13,19,20,22,29 ĐẠT (mỗi lần 16 bất biến).

## D — đột biến (đếm đủ, chạy riêng)
- **D1** `thu_gia_lap` E2: 13/13 (trong 116 đạt; trước khi chốt cách chia: `do_chia_e2.js` trên C' 13/13, trên C 12/13 — M3 SỐNG).
- **D2** `python3 viec/LUOI-1/dot_bien.py -j 4`: 80 · BẮT 79 · LẠC 1 · đúng mong đợi **80/80** · 88 s. `VS-SRV-doi-ck-giu-tien-mat`
  **BẮT** (`KB28 → I16`); `GOC-KB10-cu-tre-khong-bat-lai` LẠC như gốc.
- **D3** `python3 viec/AUDIT-1/dot_bien.py C2F C2-loyalty-redeem-tru-0 -j 4`: C2 BẮT 1 · C2F BẮT 62 · SỐNG 23 · LẠC 1
  (`C2F-orders-02-insert-quay`, như gốc) · 605 s · kho thật không đổi. Đối chiếu bằng máy với "Bảng đủ 87" của
  `viec/LUOI-1/trang_thai.md`: **87/87 tên cùng trạng thái, 0 lệch** — không BẮT nào chuyển SỐNG, không cần đổi LUOT.
- **D4** `python3 viec/TACH-GL/dot_bien.py`: 16 · BẮT 16 · đúng mong đợi **16/16** · 318 s (bảng dưới mục D4).
- **D5** `python3 viec/HOC-2b/kiem_neo.py`: mọi bộ 0 HỎNG trừ `G3-sai-chuoi` (cố ý). TU-CHAY-4: XANH 10/10 (E4c bắt nhờ số bất biến
  lấy từ con; E4d bắt nhờ N = 10 + T2). P26b: 59/59 bị bắt. HOC-2b: 28 đạt · 0 không đạt. AUDIT-1 D1: BẮT 55 · LẠC 2
  (`!D1-E11-P20`, `!D1-E11-P26a` — như gốc, HOC-2b P5) · kho không đổi. AUDIT-1 G3: BẮT 1 · SỐNG 1 (`G3-vo-hai`) · HỎNG 1
  (`G3-sai-chuoi`) · LẠC 1 (`G3-sap`) — như LUOI-1 C4. Neo rữa: 0 → không phải sửa bộ nào.

<details><summary>Bảng đủ 87 (D3, head)</summary>

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

## A — số đo sau vòng sửa 1 (head `486f56c`, chạy riêng)
giả lập 24,8 · 24,5 · 25,0 s (CPU 7,7–9,0 s, 29 KB ĐẠT) · `thu_gia_lap` 41,5 · 40,1 · 36,8 s (CPU 38,7–44,7 s, 117 đạt) · `--day-du` 147,3 s
PASS 65 · FAIL 0 · CẢNH BÁO 0. D2 80/80 (90 s) · D3 C2 BẮT 1 · C2F 62/23/1 — đối chiếu máy 87/87 không lệch · D4 18/19 rồi
`BV-cha-bo-luot` (neo sửa) BẮT → 19/19 (chạy lại đủ ở mục cuối). Bằng chứng đỏ gốc: 110 đạt · 7 hỏng, SỐ CA 117.

## Câu hỏi
Xem `ke_hoach.md` mục 10 (Q1–Q2) — trả lời cùng lời duyệt kế hoạch.

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
