# AUDIT-3 — Báo cáo đợt 3

Đo 15.10.2026 trên máy mây (kho CHỤP NÔNG, 422 commit); code chạy thật = `31a5810` (việc KHÔNG đổi byte nào ngoài `viec/AUDIT-3/` —
`git diff --stat a13d8ad..HEAD -- ':!viec/AUDIT-3/'` rỗng). Chi tiết: `a2_bang.md` (A2 từng tên), `trang_thai.md` (A1, A3–A6, D, bảng tên A4);
công cụ: `boc.py` (A1), `dot_bien.py` (A4), `kiem_neo.py` + `bb_neo.json` (A5); bằng chứng công cụ không nói dối: `bang_chung_do.txt`.
Lời duyệt kế hoạch bản 2 (15.10): Câu hỏi 1 → (b) LUOI-1 qua `boc.py --luoi1`; Câu hỏi 2 → ảnh neo mới `bb_neo.json`; `D2K-da-biet` → phát hiện
NHẸ; giữ A4 25 dòng, SỐNG tiền / ví / gói = NẶNG không hạ mức.

## Kết luận một dòng
**Còn NẶNG ⇒ đợt này CHƯA đạt điểm dừng (cần AUDIT-4 sạch sau khi khoá).** 0 NẶNG-code (ba mục AUDIT-2 đã đóng, mọi bộ cũ chạy lại không lộ
code sai: AUDIT-1 88 + C2F 87 + AUDIT-2 30 + bb 179 + P26b 59 + P26c 93 + GOI-1 49 + GOI-2 59 + SO-LUONG-1 17 + LUOI-1 78 + TACH-GL 29 —
mọi khác biệt so AUDIT-2 đều có lý do: neo đã thay, mẫu rữa, hoặc cổng mới che). **10 NẶNG-lưới mới** (A4: 10/21 đột biến độc lập đụng tiền /
gói SỐNG — lưới không phủ phí ship, giá flash nhiều dòng, hai dòng cùng loại, mua nhiều gói, đền rồi kết thúc gói; theo luật phiếu SỐNG tiền =
NẶNG, kể cả hai cái chiều "chặn oan"). A1: không bộ nào báo BẮT khi bài thử sập (10 bộ). A5: 0 neo HỎNG ngoài danh sách đã thay.

## Bảng phát hiện

| mã | mức | ở HEAD (file:dòng) | lệnh thấy lại | đề xuất khoá (file · ca đỏ) |
|---|---|---|---|---|
| **AU3-1** | NHẸ-công cụ | `viec/LUOI-1/dot_bien.py:26` gọi `git show 9521cec` lúc nạp → trên kho nông (máy mây) LUOI-1 và `viec/AUDIT-2/kiem_neo.py` SẬP ngay | `python3 viec/AUDIT-2/kiem_neo.py` → CalledProcessError 128 | LUOI-1: bọc `try`, thiếu commit thì bỏ 2 `GOC-*` + in rõ (như `boc.py --luoi1`); hoặc hook mở phiên fetch đủ sâu. Ca đỏ: kho không có `9521cec` → thoát 0 kèm dòng "GOC-* không rà" |
| **AU3-2** | NHẸ | `viec/AUDIT-2/dot_bien.py:38` `D2K-da-biet` neo `… status != 'cancelled'` — P26c C1 đổi thành `status = 'completed'` (`orders.js` 0 / 1 lần) → bằng chứng "đã biết → BẮT" của AUDIT-2 HỎNG trên HEAD | `python3 viec/AUDIT-2/dot_bien.py D2K -j 3` → HỎNG 2 · SỐNG 1 | đổi neo thành câu HEAD (như P26c `BV-G3-da-biet-thu-no`); `kiem_neo` AUDIT-3 đã ghi "đã thay" |
| **AU3-3** | NHẸ | `viec/AUDIT-2/dot_bien.py` `A3L-goi-giao-them-1` (neo `[deliveredQty, deliveredQty, now, customer_package_id]`, P26c A2 dời trừ lượt vào giao dịch `orders.js:926–928`) và `A3L-deliver-bo-chan-am` (PUT /deliver đã bỏ, P26c A4) rữa mà KHÔNG hồ sơ nào ghi (LUOI-2 / P26c `trang_thai.md`: 0) | `python3 viec/AUDIT-3/kiem_neo.py` lần đầu → HỎNG 2 (bang_chung_do.txt mục 4) | ghi "đã thay": cùng ý P26c `BV-A2-bo-tran` / `VS-A2-bo-kiem-changes`, `BV-A4-deliver-song-lai` (đều BẮT) — việc đụng `viec/AUDIT-2/` kế tiếp cập nhật |
| **AU3-4** | NHẸ (K3 hai cổng chồng) | `orders.js:1392` cổng `doi.changes !== 1` của huỷ đơn mua gói nay bị cổng GOI-2 `goiDaKetThuc` (`:1403`) che: bỏ cổng vẫn 400 (`GOI_DA_KET_THUC`), đúng một dòng hoàn — và AUDIT-2 mẫu `hai nhân viên huỷ` rữa (P26c đổi tên ca KB21) | `python3 viec/AUDIT-2/dot_bien.py BK-KB21-huy-goi-bo-changes` → LẠC (AUDIT-2: BẮT) | `kich_ban.js` KB21: thêm ca huỷ chồng trên đơn mua gói CHƯA kết thúc ở báo cáo (gói active) → cổng `changes` là lớp duy nhất → đột biến chuyển BẮT; đổi mẫu AUDIT-2 |
| **AU3-5** | NHẸ | `cong_cu/thu_gia_lap.js` ca tay I2 của P26c in "✗ mã gắn đơn có thật…" không có tiền tố `I2` → `dot_bien_bb.py` chấm LẠC dù đã bắt | `python3 viec/AUDIT-2/dot_bien_bb.py --chi BB-I2-sql-2 --chi BB-I2-sql-3` → LẠC ×2 | đặt tên ca tay `I2 …` (một chữ) → 2 đột biến chuyển BẮT |
| **AU3-6** | NHẸ-công cụ (K3) | `cong_cu/thu_P26c.js` / `thu_P26b.js`: ca sau PHỤ THUỘC ca trước — P26c `VS-Q9-hoan-me-ngoai-tx` (✗ M5 rồi SẬP), AUDIT-3 `VS-AU3-P26C-HUY-ME-TRA-0` (✗ M2, ✗ M3 rồi "không tạo được đơn: SO_DU_KHONG_DU") → theo định nghĩa phiếu là HỎNG-sập; bộ khuôn GOI-1 cũ đếm "bị bắt" (SO-LUONG-1 ghi P26c 89/93) | `python3 viec/AUDIT-3/boc.py P26c VS-Q9-hoan-me-ngoai-tx` → HỎNG-sập; `python3 viec/AUDIT-3/dot_bien.py VS-AU3-P26C-HUY-ME-TRA-0` → HỎNG | thu_P26b M2/M3/M5: nạp lại ví mẹ trước ca kế (hoặc `try` quanh dựng dữ liệu, in ✗ thay vì ném) → hai đột biến chuyển BẮT |
| **AU3-7** | NHẸ (hồ sơ) | tên `C2F-<file>-<n>` của AUDIT-1 đánh số theo VỊ TRÍ câu ghi → `orders.js` +195 dòng làm tên trượt (AUDIT-2 `-13/-14/-36/-37` = nay `-14/-15/-33/-34`); AUDIT-2 `a2_bang.md` ghi "không trượt" chỉ đúng khi `server/` không đổi | `a2_bang.md` mục C2F | so bằng NEO (câu SQL), không bằng tên; đề xuất AUDIT-1 `sinh_c2full` đặt tên theo bảng + loại thay vì thứ tự |
| **AU3-8** | **NẶNG-lưới** | `tienDaTra.js:18` phí ship: `tra = min(tong, total − shipping_fee)` — bỏ `− shipping_fee` SỐNG: KHÔNG bài / kịch bản nào có `shipping_fee` (grep 0) → đền / hoàn đơn có ship chưa được lưới canh | `python3 viec/AUDIT-3/dot_bien.py BV-AU3-P26C-DATRA-BO-TRU-SHIP` → SỐNG | `thu_P26c.js` B1: đơn 50.000 + ship 10.000, đền 1 ly → trần 50.000 (không 60.000); huỷ → hoàn 60.000 vào ví (ship là tiền khách trả) — ca đỏ = đột biến chuyển BẮT |
| **AU3-9** | **NẶNG-lưới** | `tienDaTra.js:16` giá dòng = flash / hạng / gốc; đột biến lấy giá GỐC cho mọi dòng SỐNG: ca B1a chỉ có MỘT dòng flash (chia tỉ lệ ra cùng số) — đơn 2 dòng (1 flash + 1 thường) thì dòng flash nhận trần đền CAO hơn đã trả, dòng thường thấp hơn | `… VS-AU3-P26C-DATRA-GIA-GOC` → SỐNG | `thu_P26c.js` B1: flash 25.000→20.000 + món 25.000, đền dòng flash 20.001 → 400, dòng thường 25.000 → 200 |
| **AU3-10** | **NẶNG-lưới** (chiều chặn oan) | `tienDaTra.js:22` trần đền mã-một-món: `giam = discount − flash − tier`; bỏ `− flash` SỐNG → đơn có flash + mã 1 món bị đền thấp hơn số đã trả (chặn oan, không mất tiền quán) | `… VS-AU3-P26C-DEN-GIAM-BO-FLASH` → SỐNG | `thu_P26c.js` B1f: flash + mã 1 món, đền đúng số đã trả → 200 |
| **AU3-11** | **NẶNG-lưới** | `goiKhach.js:24` `vuotTheoLoai` cộng dồn hai dòng CÙNG loại; không cộng → SỐNG: mọi ca chỉ một dòng mỗi loại → đơn 2 dòng cùng loại (vd 2 ghi chú ly) vượt trần loại mà qua | `… VS-AU3-GOI1-LOAI-KHONG-CONG-DON` → SỐNG | `thu_GOI1.js` A2: CT1 còn 3, đơn 2 dòng CT1 2 + 2 → 400 GOI_HET_LUOT_LOAI |
| **AU3-12** | **NẶNG-lưới** (chiều chặn oan) | `goiKhach.js:26` loại cài SL 0 được bỏ qua; đột biến chặn cả loại SL 0 SỐNG → gói CŨ có loại SL 0 (trước GOI-1 A1d) không lấy được loại đó | `… VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN` → SỐNG | `thu_GOI1.js` A2: gói cài JSON tay {CT1: 0, CT2: 5}, lấy CT1 → 200 (K5 dữ liệu cũ) |
| **AU3-13** | **NẶNG-lưới** (chưa thấy đường tiền thật) | `tienDaTra.js:87` hoàn kết thúc gói `min(goc, total − đã nhận)`; bỏ trần SỐNG. Đọc code: `goc ≤ da_tra dòng gói`, đền chỉ trên dòng khác (`GOI_THE_KHONG_DEN`), duyệt hoàn / huỷ bị chặn khi có gói → chưa dựng được ca vượt total; trần có thể THỪA — chưa chứng minh được bằng ca | `… BV-AU3-GOI2-BO-TRAN-DA-NHAN` → SỐNG | `thu_GOI1.js` B3: đơn gói + món lẻ, đền món lẻ hết, rồi kết thúc gói có hoàn → tổng nhận ≤ total (I19); nếu không dựng được ca vượt → ghi "vế thừa", đổi mức |
| **AU3-14** | **NẶNG-lưới** (cùng gốc AU3-13) | `tienDaTra.js:83` "đã nhận" gồm `compensation`; bỏ → SỐNG: không ca "đền rồi kết thúc gói" | `… VS-AU3-GOI2-NHAN-BO-DEN` → SỐNG | cùng ca AU3-13 (đền món lẻ 20.000 rồi kết thúc gói: hoàn ≤ total − 20.000) |
| **AU3-15** | **NẶNG-lưới** | `orders.js:422` dòng gói `quantity: pkgQty` (mua N gói một dòng) — ghi 1 SỐNG: không ca huỷ / kết thúc gói trên đơn mua 2 gói → `tienDaTra.js:43, :81` chia cho `d.quantity` sai → hoàn gấp N | `… VS-AU3-SL-DONG-GOI-SL-1` → SỐNG | `thu_P26c.js` A5 / `thu_GOI1.js` B3: mua 2 gói 300.000, lấy 1/10 ở gói 1, owner huỷ đơn → hoàn 600.000 − 30.000; kết thúc gói 2 có hoàn → 300.000 |
| **AU3-16** | **NẶNG-lưới** (báo cáo) | `orders.js:424` `total_price` dòng gói = `price × pkgQty`; ghi 1 gói SỐNG — `reports.js:67, :175` cộng `SUM(oi.total_price)` làm doanh thu → báo cáo thiếu (N−1) gói; không bất biến so `SUM(total_price)` với `subtotal` | `… VS-AU3-SL-DONG-GOI-TONG-1` → SỐNG | `bat_bien.js` I20: mỗi đơn `SUM(oi.total_price) = subtotal` (ca tay ±1) — đột biến chuyển BẮT qua giả lập KB mua 2 gói |
| **AU3-17** | **NẶNG-lưới** | `tienDaTra.js:43` đã dùng của gói chia `quantity × total_qty`; bỏ `quantity` SỐNG (cùng ca thiếu với AU3-15: huỷ đơn mua 2 gói đã lấy) → hoàn thiếu gấp đôi phần đã dùng | `… VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL` → SỐNG | cùng ca AU3-15 (huỷ đơn 2 gói đã lấy 1/10: hoàn 600.000 − 30.000, không − 60.000) |
| AU3-18 | NHẸ | `bat_bien.js:304, :307` (I18 mới từ P26c): 2 đột biến sinh SỐNG mới — `BB-I18-sql-10-bo-ve` (vế `type='adjust'` trong `(adjust AND amount<0)`: số âm chỉ purchase / adjust → (b) vế thừa về dữ liệu, giữ cho rõ nghĩa); `BB-I18-js-1-duong` (`abs(total_topup − nạp)` một chiều → (a) thiếu ca tay "tổng nạp 99.999 < sổ") | `python3 viec/AUDIT-2/dot_bien_bb.py --chi BB-I18` | `thu_gia_lap.js` ca tay I18: tổng nạp −1 so sổ → ✗ |
| AU3-19 | NHẸ | `packages.js:194` câu nắn gói đủ → `completed` ở GET theo-khach (GOI-2 A2) — C2F mới `C2F-packages-05-update-quay` SỐNG dưới c2luoi (thu_GOI1 B2a bắt, ngoài c2luoi); 22 C2F SỐNG còn lại = 23 của AUDIT-2 − 2 nay BẮT nhờ thu_P26c (B5b, A7b) | `python3 viec/AUDIT-3/boc.py --c2luoi C2F-packages-05-update-quay` | không cần khoá thêm (đã có B2a) — ghi để AUDIT-4 so |

Đóng sổ AUDIT-2 (A3): **AU2-1** đóng — `A3P-goi-lay-vuot-luot` SỐNG (máy chủ nay 400), P26c `BV-A2-bo-tran`, `VS-A2-bo-kiem-changes`,
`BV-A2-lay-ngay-bo-tran` BẮT (ca A2a `thu_P26c.js:199`, A2d `:210`). **AU2-2** đóng — 5 A3L BẮT (`A3L-redeem-thieu-1-diem` L1a,
`A3L-earn-flash-van-cong` L2a, `A3L-nhandiem-cong-doi` L3a, `A3L-goi-bo-kiem-chu` L4a, `A3L-goi-huy-dem-ca-mon-tra-tien` L5a). **AU2-11**
đóng — P26c `BV-A6-so-man-hinh`, `VS-A6-chi-sua-ten-dong`, `BV-A6-o-nhap-so-luot` BẮT (A6a `:324`, A6b `:326`); SO-LUONG-1 `BV-SOLUONG1-GOI`,
`VS-SOLUONG1-GOI-LAM-TRON` bắt (S2b, S2d). Còn mở từ AUDIT-2: AU2-3 (44 ca tay bb — nay 48 + 2), AU2-7 (CC-DOC), AU2-9 (P26d), AU2-10 (`thu_cong`).

## Tỷ lệ BẮT / SỐNG / HỎNG / LẠC theo nhóm (HỎNG-sập = sập theo định nghĩa AUDIT-3; "đã thay" = HỎNG có bản thay)

| nhóm | BẮT | SỐNG | HỎNG (đã thay / cố ý) | HỎNG-sập | LẠC | tỷ lệ BẮT = BẮT/(tổng − HỎNG − sập − cố ý) |
|---|---|---|---|---|---|---|
| A1 `--sap` 10 bộ (+ `G3-sap`, `D2-sap` từ A2) | **0** (đúng) | — | 4 HỎNG-sập + 4 sai chuỗi | 4 | 5 LẠC-sập (AUDIT-2, LUOI-1, TACH-GL, G3, D2) | 0/10 BẮT khi sập = ĐẠT |
| A2 AUDIT-1 A3 · B1 · C2 · D1 (84) | 82 | 0 | 0 | 0 | 2 (`!D1-E11-P20/P26a` như cũ) | 82/84 — y như AUDIT-2 |
| A2 AUDIT-1 G3 (4, cố ý) | 0 | 1 | 2 (`G3-sai-chuoi` cố ý, `G3-da-biet` đã thay) | 1 | 0 | — |
| A2 C2F (87, c2luoi) | 64 | 22 | 0 | 1 (`-02-insert`) | 0 | 64/86 (AUDIT-2: 62/86; 22 SỐNG = 23 − 2 + 1, đều NHẸ — AU3-19) |
| A2 AUDIT-2 A3L (20 kể cả 13 chạy c2luoi) | 15 | 3 (NHẸ như cũ) | 2 (AU3-3) | 0 | 0 | 15/18 (AUDIT-2: 9/18 — 5 NẶNG-lưới AU2-2 nay BẮT, +1 nhờ LUOI-2) |
| A2 AUDIT-2 A3P · B3 · D2K | A3P 0 (= code đúng) · B3 3 · D2K 0 | 1 · 2 · 1 | 0 · 0 · 2 | 0 | 0 · 1 (AU3-4) · 0 | B3 3/6 (AUDIT-2 4/6 — KB21 LẠC-mẫu) |
| A2 bb (175 sinh) | 125 | 50 (48 cũ + 2 mới AU3-18) | 0 | 0 | 2 (AU3-5, thực chất bắt) | 125/175 (AUDIT-2 100/148) |
| A2 P26b (59) | 48 | 1 (vô hại, đã thay) | 9 (đã thay) | 0 | 1 (đã thay) | 48/50 |
| A2 P26c (93) | 88 | 0 | 4 (đã thay) | 1 (AU3-6) | 0 | 88/88 |
| A2 GOI-1 (49) · GOI-2 (59) · SO-LUONG-1 (17) | 40 · 59 · 17 | 0 | 9 (đã thay) · 0 · 0 | 0 | 0 | 40/40 · 59/59 · 17/17 |
| A2 LUOI-1 (78 HEAD; 2 GOC CHƯA KIỂM) · TACH-GL (29) | 78 · 25 | 0 | 0 · 3 (đã thay) | 0 | 0 · 1 (`VS-luot-thieu-bat-bien` mẫu rữa, đã thay) | 78/78 · 25/26 |
| A4 AUDIT-3 (21 + 4 D2) | 11 | **10 NẶNG-lưới** (AU3-8…17) + D2 vô hại | D2 sai chuỗi | 2 (D2 sập, `HUY-ME-TRA-0` AU3-6) | 0 | 11/20 |
| A5 neo (`kiem_neo.py`, 18 bộ) | 1.067 neo khớp / 1.105 mục có neo | — | 38 đã thay / cố ý | — | — | 0 HỎNG ngoài danh sách; 0 mẫu nghi rữa |
| A6 lách (15 mã, 0 mã mới) | CHẶN 14 | LỌT ĐÃ BIẾT 1 (AU2-7) | — | — | — | như AUDIT-2 |

## Đề xuất (không sửa ở việc này)
- **Khoá NẶNG-lưới (một việc, ưu tiên trước AUDIT-4):** 7 ca vào `thu_P26c.js` / `thu_GOI1.js` + 1 bất biến I20 (`SUM(total_price) =
  subtotal`) theo cột "đề xuất khoá" AU3-8…17; ca đỏ = chính 10 đột biến `viec/AUDIT-3/dot_bien.py` chuyển BẮT (`python3
  viec/AUDIT-3/dot_bien.py` → SỐNG 1 = `D2-AU3-vo-hai`). AU3-13/14: nếu không dựng được ca vượt total → ghi "vế thừa" và hạ mức.
- **AUDIT-2 B4 (ảnh neo bb):** ảnh gốc `viec/AUDIT-2/bb_neo.json` lệch (148 ↔ 175 tên; 27 mới I2/I7/I11/I13/I18/I19, 3 `BB-I13-sql-1..3` trôi
  vế) — cập nhật ảnh gốc CÙNG commit chạy đủ `dot_bien_bb.py` (luật B4), hoặc trỏ `kiem_neo` của AUDIT-2 sang ảnh AUDIT-3.
- **Định nghĩa "sập" cho bộ đột biến (TU-CHAY-6 (3)):** lớp bọc `boc.py` (đối chứng đếm số + sập = HỎNG + `--xep`) nên vào khung chung
  `cong_cu/` thay vì nằm trong `viec/AUDIT-3/`; bài thử dài (`thu_P26b/P26c/GOI1`) nên in ✗ và đi tiếp thay vì ném (AU3-6).

## K5 — luồng hợp lệ không bị ảnh hưởng
Việc không đổi code chạy thật. Công cụ chỉ ghi bản sao trong thư mục tạm (`ap` của từng bộ, `realpath` kiểm); mỗi lần chạy so `git status`
trước/sau ("✓ kho thật không đổi", 12/12 bước `git status` 0 dòng — `chay_a2.log`); ngắt SIGINT `boc.py` ở giây 15 → 0 thư mục tạm sót
(`bang_chung_do.txt` mục 5). Không ghi file trong `viec/AUDIT-3/` khi bộ đo chạy (tool + trạng thái commit TRƯỚC khi chạy nặng).
