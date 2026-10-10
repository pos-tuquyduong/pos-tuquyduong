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

## D4 — chỗ đổi → đột biến (`python3 viec/TACH-GL/dot_bien.py`, 318 s: 16 đột biến · BẮT 16 · đúng mong đợi 16/16)
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

## Câu hỏi
Xem `ke_hoach.md` mục 10 (Q1–Q2) — trả lời cùng lời duyệt kế hoạch.

## Phát hiện (ngoài phạm vi — KHÔNG sửa)
1. Màn quản trị thêm quà (`client/src/pages/Settings.jsx:565–571`) gửi `POST /api/pos/rewards` KHÔNG kèm `max_discount`; sửa
   quà (`:581`) chỉ gửi `is_active`. Máy chủ nhận được trần (`server/routes/rewards.js:32`, `:47`, `:65`) nhưng từ màn hình
   KHÔNG đặt được trần cho quà % → quà % tạo ở quầy luôn KHÔNG trần (khách đổi quà 50 % mua đơn lớn được giảm 50 % không giới
   hạn). Nghiệp vụ — chủ quán quyết có cần ô "giảm tối đa" trên màn thêm quà không.
