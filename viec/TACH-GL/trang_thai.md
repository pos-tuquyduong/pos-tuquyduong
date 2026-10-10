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
Bước 6 (kiểm + đo) — code đã sửa, D4 xong.

## Bài thử (bước 4) — đỏ trên gốc, xanh trên head
`viec/TACH-GL/bang_chung_do.txt`. `thu_gia_lap`: trên gốc 109 đạt · 6 hỏng (E1 dòng tổng 29, T1–T5); trên head 115 đạt · 0 hỏng
(`SỐ CA cong_cu/thu_gia_lap.js: 115`). Bánh cóc 29: đỏ trên gốc (27). LUOI-1 `VS-SRV-doi-ck-giu-tien-mat`: gốc SỐNG (mong BẮT).
Lối SẬP dòng cuối: ca `máy chủ hỏng (--may-chu thư mục rỗng) → … dòng cuối là dòng SẬP` + T3/T4 (dòng cuối SẬP). Lối TỪ CHỐI:
E3 có sẵn (`cuoi()` chứa TỪ CHỐI — cha kiểm A1 trước khi sinh con). Lối tổng: E1 (`cuoi(e1) === DONG_DAT`).
T3/T4 thêm vế "mọi lượt bị dừng (đóng ≠ 0)" TRƯỚC lần ghi bằng chứng cuối (thiếu vế này thì `BV-cha-khong-dung-con-khi-sap`
SỐNG: các lượt khác chạy hết rồi cha vẫn thoát 2) — bằng chứng đỏ chép từ lần chạy SAU khi thêm.

## D4 — chỗ đổi → đột biến (`python3 viec/TACH-GL/dot_bien.py`, 290 s: 15 đột biến · BẮT 15 · đúng mong đợi 15/15)
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

## Câu hỏi
Xem `ke_hoach.md` mục 10 (Q1–Q2) — trả lời cùng lời duyệt kế hoạch.

## Phát hiện (ngoài phạm vi — KHÔNG sửa)
1. Màn quản trị thêm quà (`client/src/pages/Settings.jsx:565–571`) gửi `POST /api/pos/rewards` KHÔNG kèm `max_discount`; sửa
   quà (`:581`) chỉ gửi `is_active`. Máy chủ nhận được trần (`server/routes/rewards.js:32`, `:47`, `:65`) nhưng từ màn hình
   KHÔNG đặt được trần cho quà % → quà % tạo ở quầy luôn KHÔNG trần (khách đổi quà 50 % mua đơn lớn được giảm 50 % không giới
   hạn). Nghiệp vụ — chủ quán quyết có cần ô "giảm tối đa" trên màn thêm quà không.
