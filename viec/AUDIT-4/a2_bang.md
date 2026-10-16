# AUDIT-4 A2 — kết quả từng tên trên HEAD (code chạy thật = `0ee7346`; nhánh ở `6f0225f` khi đo; 16.10.2026, máy mây)

Sinh bằng script từ nhật ký hai đợt chạy TUẦN TỰ (`chay.py a2`, `chay.py a2b` — thư mục nháp, không chép vào kho), cột AUDIT-3 đọc từ
`viec/AUDIT-3/a2_bang.md`. Mọi bộ qua bọc đối chứng (Câu hỏi 1 = a): khuôn GOI-1 + khung AUDIT-1 / AUDIT-2 + bb + LUOI-1 + TACH-GL qua
`viec/AUDIT-4/boc.py`; SO-LUONG-1 / BAN-HANG-1 / P20b qua `viec/AUDIT-4/dot_bien.py --bo` (đối chứng đếm số + luật sập vòng 3); AUDIT-3 / LUOI-3
`dot_bien.py` có sẵn đối chứng + luật sập vòng 3 → chạy thẳng. Nhãn: HỎNG-sập = `sap_cua` bản AUDIT-4 (đã vá AU3-22…24). Bảng mỗi bộ chỉ liệt kê
tên KHÔNG BẮT hoặc khác AUDIT-3; tên BẮT liệt kê gọn cuối mục. Tổng thời gian máy 5456 s ≈ 91 phút (15 bước); `git status` sạch sau
CẢ 15 bước (`chay.py` so trước / sau từng bước).

Tóm tắt khác AUDIT-3 (mọi bộ): (1) 4 `D1-E*` của khung AUDIT-1 BẮT → HỎNG-sập do vá AU3-22 (Câu hỏi 4 — luật (a) chữ vs 81/83 đã giữ);
(2) `VS-SOLUONG1-THE-SDT-THO` BẮT → HỎNG (đã thay BAN-HANG-1); (3) bb lần đầu qua bọc: chỉ `D2-sap` LẠC → HỎNG-sập, 0 đỏ-rồi-sập ẩn; `D2-vo-hai`
vẫn BẮT trái hợp đồng (AU3-20, chưa khoá); (4) AUDIT-3 `dot_bien.py`: 10 AU3-8…17 hết SỐNG (5 BẮT theo mẫu AUDIT-3 + 5 LẠC-mẫu, cả 10 BẮT đúng
ca LUOI-3); `BV-AU3-SL-THE-BO-CONG` HỎNG (AU4-9). Còn lại từng tên = AUDIT-3 (P26b 48 · P26c 88 + 1 sập · GOI-1 40 · GOI-2 59 · C2F 59/81 ·
A3L 15/18 · B3 3 · LUOI-1 78 · TACH-GL 25). Mới chạy: BAN-HANG-1 7/7, P20b 4/4 (= N11 LUOI-3 / hồ sơ P20b).
Vòng sửa 1 (luật sập không còn bỏ qua dòng gộp `✗ T…` của kiem_tra): chạy lại `boc.py --khung D1 -j 3` (57 tên nhóm D1 = 53 kiem + 4 cong, 763 s) →
BẮT 50 · HỎNG-sập 5 · LẠC 2 — y hệt từng tên lần đầu (lỗ không che BẮT nào); `--bo` ×3 y hệt (mã thoát nay theo MONG). Vòng sửa 2 (dấu sập khối `baiX sập:`, phép trừ ca T theo đoạn):
chạy lại khung AUDIT-1 trừ C2F (88 tên — D1: 53 cách kiem + 4 cong; G3 / A3 / B1 / C2: kb, gac, cong, congcu…; 1151 s) theo luật vòng 2: y hệt từng tên (lỗ không che BẮT nào). 4 tên kiem / kiemdd của AUDIT-2 A3B ngoài A2 theo phiếu (A3L + B3) — không chạy.

## LUOI-3 — so câu lỗi với `viec/LUOI-3/bang_chung_do.txt` mục SAU (`so_luoi3.py` nháp: câu ca trước "  — " và số quan sát sau đó)
```
khớp BV-AU3-P26C-DATRA-BO-TRU-SHIP: BẮT → BẮT · câu ca giống (2 / 2 dòng ✗)
khớp VS-AU3-P26C-DATRA-GIA-GOC: BẮT → BẮT · câu ca giống (2 / 2 dòng ✗)
khớp VS-AU3-P26C-DEN-GIAM-BO-FLASH: BẮT → BẮT · câu ca giống (1 / 1 dòng ✗)
khớp VS-AU3-GOI1-LOAI-KHONG-CONG-DON: BẮT → BẮT · câu ca giống (2 / 2 dòng ✗)
khớp VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN: BẮT → BẮT · câu ca giống (1 / 1 dòng ✗)
khớp BV-AU3-GOI2-BO-TRAN-DA-NHAN: BẮT → BẮT · câu ca giống (1 / 1 dòng ✗)
khớp VS-AU3-GOI2-NHAN-BO-DEN: BẮT → BẮT · câu ca giống (1 / 1 dòng ✗)
khớp VS-AU3-SL-DONG-GOI-SL-1: BẮT → BẮT · câu ca giống (2 / 2 dòng ✗)
khớp VS-AU3-SL-DONG-GOI-TONG-1: BẮT → BẮT · câu ca giống (1 / 1 dòng ✗)
khớp VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL: BẮT → BẮT · câu ca giống (1 / 1 dòng ✗)
```
Mọi số quan sát cũng trùng (không dòng "số quan sát khác").

## AUDIT-1 trừ C2F (88) — qua bọc khung
`python3 viec/AUDIT-4/boc.py --khung G3 A3 B1 C2 D1 -j 3` · thoát 0 · 1207.8 s · git sạch · N11 LUOI-3: —

Tổng 88 · BẮT 77 · HỎNG 2 · HỎNG-sập 6 · LẠC 2 · SỐNG 1

| tên | nhãn | AUDIT-3 | đầu ra (rút gọn) | vì sao |
|---|---|---|---|---|
| `G3-sai-chuoi` | HỎNG | HỎNG | server/routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `G3-da-biet` | HỎNG | HỎNG | server/routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `G3-vo-hai` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `G3-sap` | HỎNG-sập | HỎNG-sập | sập [cong_cu/gia_lap/chay.js --den-kb: Giả lập: SẬP — /tmp/audit1_4nlwn5_8/db_r5gqjsdn/kho/server/routes/orders.js:891 ·       }}}{{{ ·       ^] / [co | như AUDIT-3 |
| `D1-E1-unitprice` | HỎNG-sập | BẮT | sập [kiem_tra_truoc_khi_giao.js: ✗ bài chạy thật cong_cu/thu_P26c.js xanh (1.2 s)  → ✖ Bài thử sập: không mua được gói: HTTP 500 · item is not defined | **AU3-22 vá**: phép tĩnh riêng bắt, NHƯNG cùng lần `kiem_tra` báo bài con thu_P26c SẬP (dòng `✗ bài chạy thật … ✖ Bài thử sập`) — luật (a) chữ: HỎNG-sập; AUDIT-3 lọc dòng đó nên ghi BẮT (81/83) → Câu hỏi 4 |
| `D1-E8-backup` | HỎNG-sập | BẮT | sập [kiem_tra_truoc_khi_giao.js: ✗ bài chạy thật cong_cu/thu_P26c.js xanh (0.3 s)  → ✖ Bài thử sập: SQLITE_ERROR: no such table: main.pos_orders] / [k | **AU3-22 vá**: phép tĩnh riêng bắt, NHƯNG cùng lần `kiem_tra` báo bài con thu_P26c SẬP (dòng `✗ bài chạy thật … ✖ Bài thử sập`) — luật (a) chữ: HỎNG-sập; AUDIT-3 lọc dòng đó nên ghi BẮT (81/83) → Câu hỏi 4 |
| `D1-E2-authz-tho` | HỎNG-sập | BẮT | sập [kiem_tra_truoc_khi_giao.js: ✗ bài chạy thật cong_cu/thu_P26c.js xanh (0.9 s)  → ✖ Bài thử sập: không mua được gói: HTTP 500 · item is not defined | **AU3-22 vá**: phép tĩnh riêng bắt, NHƯNG cùng lần `kiem_tra` báo bài con thu_P26c SẬP (dòng `✗ bài chạy thật … ✖ Bài thử sập`) — luật (a) chữ: HỎNG-sập; AUDIT-3 lọc dòng đó nên ghi BẮT (81/83) → Câu hỏi 4 |
| `D1-E1b-tra-gia` | HỎNG-sập | BẮT | sập [kiem_tra_truoc_khi_giao.js: ✗ bài chạy thật cong_cu/thu_P26c.js xanh (1.1 s)  → ✖ Bài thử sập: không lấy được từ gói: HTTP 500 · SQLITE_ERROR: no | **AU3-22 vá**: phép tĩnh riêng bắt, NHƯNG cùng lần `kiem_tra` báo bài con thu_P26c SẬP (dòng `✗ bài chạy thật … ✖ Bài thử sập`) — luật (a) chữ: HỎNG-sập; AUDIT-3 lọc dòng đó nên ghi BẮT (81/83) → Câu hỏi 4 |
| `!D1-E11-P20` | LẠC | LẠC | [kiem_tra_truoc_khi_giao.js thoát 1] ✗ CÓ LỖI — sửa xong rồi commit. Đọc CHECKLIST_CODE.md. | như AUDIT-3 |
| `!D1-E11-P26a` | LẠC | LẠC | [kiem_tra_truoc_khi_giao.js thoát 1] ✗ CÓ LỖI — sửa xong rồi commit. Đọc CHECKLIST_CODE.md. | như AUDIT-3 |
| `!D1-E11-P26b` | HỎNG-sập | HỎNG-sập | sập [kiem_tra_truoc_khi_giao.js: ✗ bài chạy thật cong_cu/thu_P21.js xanh (1.3 s)  → ✖ Bài thử sập: tạo đơn trả ví sẽ huỷ: HTTP 400 · Số dư không đủ. H | như AUDIT-3 |

Khác AUDIT-3: 4 tên: `D1-E1-unitprice`, `D1-E8-backup`, `D1-E2-authz-tho`, `D1-E1b-tra-gia`.
BẮT: `A3-GITADD-bo-A`, `A3-GITCOMMIT-bo-a`, `A3-GITPUSH-moi-nhanh`, `A3-SED-i-ngan`, `A3-RM-bo-realpath`, `A3-CURL-moi-host`, `A3-LN-dao-s`, `A3-G1CAM-theoten`, `A3-FINDCAM-bo-delete`, `A3-NPM-them-install`, `A3-MKDIR-bo-khung`, `A3-TARX-moi-dich`, `A3-FILEC-bo-ngan`, `A3-BGAN-bo-PATH`, `A3-CCLA-them-la`, `A3-GHIDUOC-bo-khung`, `B1-A11-dao-goc`, `B1-A11-bo-xanh-PR`, `B1-A6-bo-phamvi`, `B1-A10-bo-filecam`, `B1-A7-noi-tieude`, `B1-A12-bo`, `B1-laBaiThu-noi-slash`, `B1-A14-bo-dang-nhanh`, `C2-orders-bo-diem-ban`, `C2-sc-bo-diem-ma`, `C2-loyalty-redeem-tru-0`, `D1-A1-fffd`, `D1-B1-json-tran`, `D1-C1-them-fetch`, `D1-E7-paydebt`, `D1-E12-vi-ngoai`, `D1-K1-env-tho`, `D1-S3-vi-lech`, `D1-F3-test-thieu`, `D1-A2-server-cu-phap`, `D1-A2c-client-cu-phap`, `D1-B2-login-2-cho`, `D1-B-handleSE`, `D1-B-co-song-song`, `D1-B-pathname`, `D1-B-deadcodes-thieu`, `D1-B-eb-getDerived`, `D1-B-eb-ton-tai`, `D1-B-main-boc`, `D1-B-layout-boc`, `D1-B-key`, `D1-B-ahref-api`, `D1-B-pos6-loginTime`, `D1-D-build-prod`, `D1-E-gia-0`, `D1-E-trangthai-dungma`, `D1-E-danhsach-trang`, `D1-E-claim-chiem`, `D1-E-ndiem-chiem`, `D1-E-vi-tuongdoi`, `D1-E-vi-trang5`, `D1-K-4ca`, `D1-K-data`, `D1-F-attached`, `D1-F-dist`, `D1-E9-claim-kiem`, `D1-E9-ndiem-kiem`, `D1-E9-claim-dung`, `D1-E9-ndiem-dung`, `D1-E10-doisoat-tx`, `D1-E10-doisoat-trang`, `D1-B-deadcodes-service`, `D1-B-pos5-query`, `!D1-E11-P21`, `!D1-T1-nguoi-gac`, `!D1-T1b-cong-cu`, `!D1-T1c-cong`, `B1-A8-noi`, `B1-A9-noi`, `B1-A13-bo-daydu`, `B1-A15-dao-fork`

## AUDIT-1 C2F (87) + AUDIT-2 A3L còn c2full (13) — cách `c2luoi`, qua bọc khung
`python3 viec/AUDIT-4/boc.py --c2luoi -j 3` · thoát 0 · 1255.1 s · git sạch · N11 LUOI-3: —

Tổng 100 · BẮT 67 · HỎNG 2 · HỎNG-sập 6 · SỐNG 25

| tên | nhãn | AUDIT-3 | đầu ra (rút gọn) | vì sao |
|---|---|---|---|---|
| `C2F-orders-02-insert-quay` | HỎNG-sập | HỎNG-sập | sập [cong_cu/gia_lap/chay.js: Giả lập: SẬP — Error: không tạo được đơn "nợ mẫu": HTTP 500 SQLITE_CONSTRAINT_FOREIGNKEY: FOREIGN KEY constraint failed  | như AUDIT-3 |
| `C2F-orders-10-insert-quay` | HỎNG-sập | HỎNG-sập | sập [cong_cu/gia_lap/chay.js: ✗ KB30 → HTTP: SẬP giữa kịch bản: Only finite numbers (not Infinity or NaN) can be passed as arguments] / [cong_cu/gia_l | như AUDIT-3 |
| `C2F-orders-14-update-quay` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-orders-15-insert-quay` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-orders-33-delete-quay` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-orders-34-delete-quay` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-wallets-01-update-quay` | HỎNG-sập | HỎNG-sập | sập [cong_cu/gia_lap/chay.js: Giả lập: SẬP — Error: dữ liệu mẫu sai: ví khách quen ≠ 200.000 (HTTP 200) ·     at dungDuLieu (/tmp/audit1_6f15zsw8/db_g | như AUDIT-3 |
| `C2F-wallets-02-insert-quay` | HỎNG-sập | HỎNG-sập | sập [cong_cu/gia_lap/chay.js: Giả lập: SẬP — Error: dữ liệu mẫu sai: ví khách quen ≠ 200.000 (HTTP 200) ·     at dungDuLieu (/tmp/audit1_6f15zsw8/db_0 | như AUDIT-3 |
| `C2F-wallets-05-ghiVi-quay` | HỎNG-sập | HỎNG-sập | sập [cong_cu/thu_P26b.js: ✖ Bài thử sập: không tạo được đơn: HTTP 400 · SO_DU_KHONG_DU · Số dư mẹ không đủ. Hiện có: 5,000đ] / [cong_cu/thu_P26b.js] ✗ | như AUDIT-3 |
| `C2F-wallets-06-ghiVi-quay` | HỎNG-sập | HỎNG-sập | sập [cong_cu/gia_lap/chay.js: Giả lập: SẬP — Error: dữ liệu mẫu sai: ví khách quen ≠ 200.000 (HTTP 200) ·     at dungDuLieu (/tmp/audit1_6f15zsw8/db_x | như AUDIT-3 |
| `C2F-damages-03-update-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-packages-01-insert-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-packages-03-update-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-packages-04-delete-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-packages-05-update-quay` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-packages-06-update-quay` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-signup-codes-05-update-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-signup-codes-06-delete-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-discount-codes-02-update-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-discount-codes-03-update-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-discount-codes-04-delete-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-rewards-02-update-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-rewards-03-update-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-customers-v2-01-insert-khong-ro` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-customers-v2-02-update-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-customers-v2-03-insert-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-customers-v2-04-update-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `C2F-customers-v2-05-insert-quan-tri` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `A3L-redeem-bo-han-diem` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `A3L-nhandiem-he-so-mac-dinh` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `A3L-goi-bo-kiem-con-lai` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `A3L-goi-giao-them-1` | HỎNG | HỎNG | server/routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `A3L-deliver-bo-chan-am` | HỎNG | HỎNG | server/routes/packages.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |

Khác AUDIT-3: 0 tên.
BẮT: `C2F-orders-01-ghiVi-quay`, `C2F-orders-03-update-quay`, `C2F-orders-04-insert-quay`, `C2F-orders-05-update-quay`, `C2F-orders-06-update-quay`, `C2F-orders-07-update-quay`, `C2F-orders-08-insert-quay`, `C2F-orders-09-insert-quay`, `C2F-orders-11-update-quay`, `C2F-orders-12-update-quay`, `C2F-orders-13-insert-quay`, `C2F-orders-16-insert-quay`, `C2F-orders-17-update-quay`, `C2F-orders-18-insert-quay`, `C2F-orders-19-update-quay`, `C2F-orders-20-update-quay`, `C2F-orders-21-delete-quay`, `C2F-orders-22-update-quay`, `C2F-orders-23-delete-quay`, `C2F-orders-24-update-quay`, `C2F-orders-25-update-quay`, `C2F-orders-26-insert-quay`, `C2F-orders-27-update-quay`, `C2F-orders-28-delete-quay`, `C2F-orders-29-update-quay`, `C2F-orders-30-delete-quay`, `C2F-orders-31-delete-quay`, `C2F-orders-32-delete-quay`, `C2F-orders-35-delete-quay`, `C2F-orders-36-delete-quay`, `C2F-orders-37-delete-quay`, `C2F-orders-38-insert-quay`, `C2F-refunds-01-insert-quay`, `C2F-refunds-02-update-quay`, `C2F-refunds-03-update-quay`, `C2F-refunds-04-ghiVi-quay`, `C2F-refunds-05-update-quay`, `C2F-refunds-06-ghiVi-quay`, `C2F-refunds-07-update-quay`, `C2F-wallets-03-insert-quay`, `C2F-wallets-04-ghiVi-quay`, `C2F-wallets-07-ghiVi-quay`, `C2F-wallets-08-ghiVi-quay`, `C2F-wallets-09-update-quay`, `C2F-wallets-10-insert-quay`, `C2F-damages-01-ghiVi-quan-tri`, `C2F-damages-02-insert-quan-tri`, `C2F-packages-02-update-quan-tri`, `C2F-signup-codes-01-update-khach-app`, `C2F-signup-codes-02-insert-khach-app`, `C2F-signup-codes-03-update-khach-app`, `C2F-signup-codes-04-insert-khach-app`, `C2F-discount-codes-01-insert-quan-tri`, `C2F-discount-codes-05-update-quay`, `C2F-rewards-01-insert-quan-tri`, `C2F-loyalty-01-insert-khach-app`, `C2F-loyalty-02-insert-khach-app`, `C2F-loyalty-03-insert-khach-app`, `C2F-don-mo-rong-01-update-quay`, `A3L-redeem-bo-chan-diem`, `A3L-redeem-tru-them-1`, `A3L-redeem-ma-dung-2-lan`, `A3L-earn-lam-tron-len`, `A3L-goi-bo-kiem-trang-thai`, `A3L-goi-lay-ngay-them-1`, `A3L-goi-huy-lay-khong-tra-luot`, `A3L-goi-xoa-lay-khong-tra-luot`

## AUDIT-2 A3L · B3 (26; gồm 7 đột biến LUOI-2) — qua bọc khung
`python3 viec/AUDIT-4/boc.py --audit2 A3L B3 -j 3` · thoát 0 · 413.3 s · git sạch · N11 LUOI-3: LUOI-2 7/7

Tổng 26 · BẮT 18 · HỎNG 2 · LẠC 1 · SỐNG 5

| tên | nhãn | AUDIT-3 | đầu ra (rút gọn) | vì sao |
|---|---|---|---|---|
| `A3L-redeem-bo-han-diem` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `A3L-nhandiem-he-so-mac-dinh` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `A3L-goi-bo-kiem-con-lai` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `A3L-goi-giao-them-1` | HỎNG | HỎNG | server/routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `A3L-deliver-bo-chan-am` | HỎNG | HỎNG | server/routes/packages.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `BK-KB16-duyet-bo-cong-don` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `BK-KB20-bo-kiem-lai-ma` | SỐNG | SỐNG | mọi lệnh thoát 0 | như AUDIT-3 |
| `BK-KB21-huy-goi-bo-changes` | LẠC | LẠC | [cong_cu/gia_lap/chay.js --den-kb 21 thoát 1] Giả lập: 5 kịch bản · 18 bất biến · KHÔNG ĐẠT (1 lệch) | như AUDIT-3 |

Khác AUDIT-3: 0 tên.
BẮT: `A3L-redeem-thieu-1-diem`, `A3L-redeem-bo-chan-diem`, `A3L-redeem-tru-them-1`, `A3L-redeem-ma-dung-2-lan`, `A3L-earn-lam-tron-len`, `A3L-earn-flash-van-cong`, `A3L-nhandiem-cong-doi`, `A3L-goi-bo-kiem-chu`, `A3L-goi-bo-kiem-trang-thai`, `A3L-goi-lay-ngay-them-1`, `A3L-goi-huy-lay-khong-tra-luot`, `A3L-goi-xoa-lay-khong-tra-luot`, `A3L-goi-huy-dem-ca-mon-tra-tien`, `A3L-goi-xoa-dem-ca-mon-tra-tien`, `A3L-hoan-goi-bo-tru-no`, `BK-KB10-thu-bo-changes`, `BK-KB11-claim-bo-chiem`, `BK-KB11-nhandiem-bo-chiem`

## dot_bien_bb.py (175 sinh + 4 D2) — qua bọc (lần đầu)
`python3 viec/AUDIT-4/boc.py --bb -j 4` · thoát 0 · 779.4 s · git sạch · N11 LUOI-3: —

Tổng 179 · BẮT 125 · HỎNG 1 · HỎNG-sập 1 · LẠC 2 · SỐNG 50

| tên | nhãn | AUDIT-3 | đầu ra (rút gọn) | vì sao |
|---|---|---|---|---|
| `BB-I1-sql-1-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I1-sql-2-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I1-sql-3-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I1-sql-4-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I1-js-1-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I1-js-2-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I1-js-6-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I1-js-7-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I1-js-8-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I1-js-9-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I2-sql-2-bo-ve` | LẠC | LẠC | [cong_cu/thu_gia_lap.js thoát 1] ✗ mã gắn đơn có thật; mã ĐÃ dùng của đơn đã xoá → I2 ra 0 dòng  — ["mã DUNG1 mồ côi (order_id 98)"] | như AUDIT-3 |
| `BB-I2-sql-3-bo-ve` | LẠC | LẠC | [cong_cu/thu_gia_lap.js thoát 1] ✗ mã gắn đơn có thật; mã ĐÃ dùng của đơn đã xoá → I2 ra 0 dòng  — ["mã DUNG2 mồ côi (order_id 98)"] | như AUDIT-3 |
| `BB-I3-sql-1-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I3-sql-2-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I3-sql-3-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I3-sql-4-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I3-sql-1-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I3-sql-1-am` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I4-js-1-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I4-js-1-am` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I6-js-1-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I6-js-1-am` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I8-js-1-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I8-js-3-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I8-js-4-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I8-js-5-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I8-js-1-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I8-js-1-am` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I8-js-2-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I8-js-2-am` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I9-js-3-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I9-js-4-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I9-js-1-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I9-js-1-am` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I9-js-2-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I9-js-2-am` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I9-js-3-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I9-js-3-am` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I9-js-4-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I9-js-4-am` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I12-js-2-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I13-sql-1-am` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I14-sql-10-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I14-sql-11-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I14-sql-1-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I14-sql-2-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I14-sql-2-am` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I16-sql-1-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I16-sql-4-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I16-js-2-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I18-sql-10-bo-ve` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `BB-I18-js-1-duong` | SỐNG | SỐNG | mọi tầng xanh | như AUDIT-3 |
| `D2-sai-chuoi` | HỎNG | HỎNG | chuỗi gốc khớp 0 lần, cần 1 | như AUDIT-3 |
| `D2-sap` | HỎNG-sập | HỎNG-sập | sập [cong_cu/thu_gia_lap.js --chi-du-lieu-tay: ✗ bài thử sập  — /tmp/au2bb_ta9h8w45/au2bb_cdn_k1uc/kho/cong_cu/gia_lap/bat_bien.js:96] [cong_cu/gia_la | như AUDIT-3 |

Khác AUDIT-3: 0 tên.
BẮT: `BB-I1-js-3-bo-ve`, `BB-I1-js-4-bo-ve`, `BB-I1-js-5-bo-ve`, `BB-I2-sql-1-bo-ve`, `BB-I3-sql-5-bo-ve`, `BB-I3-sql-6-bo-ve`, `BB-I3-sql-7-bo-ve`, `BB-I3-sql-8-bo-ve`, `BB-I4-sql-1-bo-ve`, `BB-I4-sql-2-bo-ve`, `BB-I7-sql-1-bo-ve`, `BB-I7-sql-2-bo-ve`, `BB-I7-js-1-bo-ve`, `BB-I7-js-2-bo-ve`, `BB-I7-js-1-duong`, `BB-I7-js-1-am`, `BB-I7-js-2-duong`, `BB-I7-js-2-am`, `BB-I7-js-3-duong`, `BB-I7-js-3-am`, `BB-I8-sql-1-bo-ve`, `BB-I8-sql-2-bo-ve`, `BB-I8-js-2-bo-ve`, `BB-I8-js-6-bo-ve`, `BB-I8-js-7-bo-ve`, `BB-I8-js-3-duong`, `BB-I8-js-3-am`, `BB-I8-js-4-duong`, `BB-I8-js-4-am`, `BB-I9-js-1-bo-ve`, `BB-I9-js-2-bo-ve`, `BB-I9-js-5-bo-ve`, `BB-I9-js-6-bo-ve`, `BB-I9-js-7-bo-ve`, `BB-I9-js-8-bo-ve`, `BB-I11-sql-1-bo-ve`, `BB-I11-sql-2-bo-ve`, `BB-I12-js-1-bo-ve`, `BB-I12-js-2-bo-ve`, `BB-I12-js-3-bo-ve`, `BB-I12-js-4-bo-ve`, `BB-I12-js-5-bo-ve`, `BB-I12-js-6-bo-ve`, `BB-I12-js-7-bo-ve`, `BB-I12-js-8-bo-ve`, `BB-I12-js-1-duong`, `BB-I12-js-1-am`, `BB-I12-js-2-am`, `BB-I12-js-3-duong`, `BB-I12-js-3-am`, `BB-I12-js-4-duong`, `BB-I12-js-4-am`, `BB-I12-js-5-duong`, `BB-I12-js-5-am`, `BB-I13-sql-1-bo-ve`, `BB-I13-sql-2-bo-ve`, `BB-I13-sql-3-bo-ve`, `BB-I13-sql-4-bo-ve`, `BB-I13-js-1-bo-ve`, `BB-I13-js-2-bo-ve`, `BB-I13-js-3-bo-ve`, `BB-I13-js-4-bo-ve`, `BB-I13-sql-1-duong`, `BB-I13-js-1-duong`, `BB-I13-js-1-am`, `BB-I14-sql-1-bo-ve`, `BB-I14-sql-2-bo-ve`, `BB-I14-sql-3-bo-ve`, `BB-I14-sql-4-bo-ve`, `BB-I14-js-1-bo-ve`, `BB-I14-js-2-bo-ve`, `BB-I14-js-3-bo-ve`, `BB-I14-js-4-bo-ve`, `BB-I14-js-5-bo-ve`, `BB-I14-js-6-bo-ve`, `BB-I14-js-7-bo-ve`, `BB-I14-sql-5-bo-ve`, `BB-I14-sql-6-bo-ve`, `BB-I14-sql-7-bo-ve`, `BB-I14-sql-8-bo-ve`, `BB-I14-sql-9-bo-ve`, `BB-I14-sql-1-am`, `BB-I14-js-1-duong`, `BB-I14-js-1-am`, `BB-I15-sql-1-bo-ve`, `BB-I15-sql-2-bo-ve`, `BB-I15-sql-3-bo-ve`, `BB-I15-sql-4-bo-ve`, `BB-I15-sql-5-bo-ve`, `BB-I15-sql-6-bo-ve`, `BB-I15-sql-7-bo-ve`, `BB-I15-js-1-duong`, `BB-I15-js-1-am`, `BB-I16-sql-2-bo-ve`, `BB-I16-sql-3-bo-ve`, `BB-I16-js-1-bo-ve`, `BB-I16-js-2-bo-ve`, `BB-I16-js-1-duong`, `BB-I16-js-1-am`, `BB-I16-js-2-am`, `BB-I17-js-1-bo-ve`, `BB-I17-js-2-bo-ve`, `BB-I17-js-3-bo-ve`, `BB-I17-js-4-bo-ve`, `BB-I17-js-1-duong`, `BB-I17-js-1-am`, `BB-I18-sql-1-bo-ve`, `BB-I18-sql-2-bo-ve`, `BB-I18-sql-3-bo-ve`, `BB-I18-sql-4-bo-ve`, `BB-I18-sql-5-bo-ve`, `BB-I18-sql-6-bo-ve`, `BB-I18-sql-7-bo-ve`, `BB-I18-sql-8-bo-ve`, `BB-I18-sql-9-bo-ve`, `BB-I18-sql-11-bo-ve`, `BB-I18-js-1-bo-ve`, `BB-I18-js-2-bo-ve`, `BB-I18-js-1-am`, `BB-I18-js-2-duong`, `BB-I18-js-2-am`, `BB-I19-sql-1-bo-ve`, `BB-I19-sql-2-bo-ve`, `D2-da-biet`, `D2-vo-hai`

## P26b (59) — qua lớp bọc
`python3 viec/AUDIT-4/boc.py P26b -j 4` · thoát 0 · 177.2 s · git sạch · N11 LUOI-3: —

Tổng 59 · BẮT 48 · HỎNG 9 · LẠC 1 · SỐNG 1

| tên | nhãn | AUDIT-3 | đầu ra (rút gọn) | vì sao |
|---|---|---|---|---|
| `me-huy-hoan-gap-doi` | HỎNG | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `me-xoa-hoan-gap-doi` | HỎNG | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `Q9-bo-hoan-me` | HỎNG | HỎNG | routes/refunds.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `Q9-hoan-me-vao-vi-con` | HỎNG | HỎNG | routes/refunds.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `Q9-hoan-me-ngoai-tx` | HỎNG | HỎNG | routes/refunds.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `Q9-hoan-me-khong-qua-cong-don` | HỎNG | HỎNG | routes/refunds.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `duyet-cong-don-khong-kiem-changes` | HỎNG | HỎNG | routes/refunds.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `hong-bo-tran` | HỎNG | HỎNG | routes/damages.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `hong-tran-theo-man-hinh` | SỐNG | SỐNG | thoát 0, KHÔNG thấy /✗ C1b/ ·   66 đạt · 0 hỏng | như AUDIT-3 |
| `hong-lay-dong-dau` | LẠC | LẠC | thoát 1, KHÔNG thấy /✗ C6a/ ·   65 đạt · 1 hỏng | như AUDIT-3 |
| `hong-bo-tran-cong-don` | HỎNG | HỎNG | routes/damages.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |

Khác AUDIT-3: 0 tên.
BẮT: `huy-bo-cong`, `huy-khong-kiem-changes`, `huy-kiem-ngoai-tx`, `huy-bo-tu-choi-yeu-cau`, `huy-tu-choi-ngoai-tx`, `xoa-hoan-bat-ke-trang-thai`, `xoa-doc-don-ngoai-tx`, `tao-don-chi-kiem-ngoai-tx`, `me-tao-don-khong-tru`, `me-bo-khongAm`, `yc-bo-kiem-trung`, `yc-kiem-trung-ngoai-tx`, `duyet-bo-chiem-yeu-cau`, `duyet-khong-kiem-changes`, `duyet-bo-cong-don`, `tu-choi-bo-dieu-kien`, `tu-choi-khong-kiem-changes`, `Q8-bo-chan-goi`, `Q8-chi-chan-luc-tao`, `nap-ghi-tuyet-doi-tu-so-ngoai-tx`, `nap-so-truoc-doc-ngoai-tx`, `ghiVi-bo-khongAm`, `tru-tay-chi-kiem-ngoai-tx`, `dieu-chinh-bo-khongAm`, `doi-soat-bo-tx`, `doi-soat-doc-tong-ngoai-tx`, `hong-bo-cong-don-so-luong`, `hong-cong-don-ngoai-tx`, `hong-bo-chan-don-huy`, `hong-quen-refunded`, `hong-log-ngoai-tx`, `hong-bo-order-id-so`, `huy-catch-doc-order-code`, `xoa-catch-doc-order-code`, `packages-buy-dung-lai`, `I1-nhanh-refunded-false`, `K1-bo-409-tạo-đơn`, `K1-bo-409-huỷ-đơn`, `K1-bo-409-xoá-đơn`, `K1-bo-409-tạo-yêu-cầu-hoàn`, `K1-bo-409-duyệt-hoàn`, `K1-bo-409-từ-chối-hoàn`, `K1-bo-409-nạp-ví`, `K1-bo-409-trừ-tay`, `K1-bo-409-điều-chỉnh`, `K1-bo-409-đối-soát`, `K1-bo-409-đối-soát-toàn-bộ`, `K1-bo-409-báo-hỏng`

## P26c (93) — qua lớp bọc
`python3 viec/AUDIT-4/boc.py P26c -j 4` · thoát 0 · 485.2 s · git sạch · N11 LUOI-3: 89/93

Tổng 93 · BẮT 88 · HỎNG 4 · HỎNG-sập 1

| tên | nhãn | AUDIT-3 | đầu ra (rút gọn) | vì sao |
|---|---|---|---|---|
| `VS-H2-khong-ghi-hoan-goi` | HỎNG | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `VS-H2-hoan-goi-giam-total-spent` | HỎNG | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `VS-me-hoan-gap-doi-huy` | HỎNG | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `VS-me-hoan-gap-doi-xoa` | HỎNG | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `VS-Q9-hoan-me-ngoai-tx` | HỎNG-sập | HỎNG-sập | ✖ Bài thử sập: không hoàn được đơn: HTTP 200 / HTTP 500 · run() ngoài giao dịch trong lúc giao dịch đang mở: UPDATE pos_wallets SET balance = balance  | như AUDIT-3 |

Khác AUDIT-3: 0 tên.
BẮT: `BV-B3-bo-chan-hoan-kho`, `VS-B3-chan-ca-don-da-hoan`, `BV-B4-bo-chan-chua-thu`, `VS-B4-chan-theo-cach-tra-no`, `BV-B2-bo-chan-so-0`, `VS-B2-chi-chan-so-am`, `BV-B2-bo-chan-so-0-thu-P26b`, `BV-B1-tran-gia-goc`, `VS-B1-tran-theo-dong-dau`, `VS-B1-chia-bo-giam-don`, `BV-Q4-hoan-tron`, `VS-Q4-luot-con-lai-dao`, `VS-H2-chi-phan-vi`, `VS-H2-me-khong-nhan-truoc`, `VS-H2-mot-dong-hoan-goi`, `BV-B1f-bo-chan-tren`, `VS-B1f-chia-deu`, `BV-A7-bo-chan-post`, `BV-A7-bo-chan-put`, `VS-A7-chan-ca-bat-tat`, `VS-A7-cho-luot-0`, `BV-A7c-man-hinh`, `BV-B1-den-dong-goi`, `VS-A3-chan-ca-gia-han`, `VS-D1-marker-suong`, `VS-D1-dao-nhanh-percent`, `VS-A7c-khong-return`, `BV-H4-bo-tru-den`, `VS-H4-chi-tru-o-don-goi`, `BV-Q4-bo-quyen`, `VS-Q4-quyen-cancel_order`, `VS-Q4-chan-ca-don-lay-tu-goi`, `BV-Q4-quyen-chi-kho-moi`, `VS-Q4-quyen-de-quyen-da-chinh`, `BV-A1-xoa-bo-cong-trang-thai`, `VS-A1-chan-ca-don-da-hoan`, `BV-A2-bo-tran`, `VS-A2-bo-kiem-changes`, `BV-A2-lay-ngay-bo-tran`, `VS-A2-lay-ngay-so-man-hinh`, `BV-A3-bo-chan`, `VS-A3-so-nham-ma-goi`, `BV-A4-deliver-song-lai`, `BV-A6-so-man-hinh`, `VS-A6-chi-sua-ten-dong`, `BV-A6-o-nhap-so-luot`, `BV-C1-cong-cancelled`, `VS-C1-chi-sua-cong-update`, `BV-C2-bo-xoa-ma-bill`, `VS-C2-xoa-huy-no-out`, `BV-C2-xoa-khong-gui-in`, `VS-C2-xoa-ca-ma-da-dung`, `BV-C3-bo-cot-con`, `VS-C3-dau-soCot`, `VS-C3-dau-soCot-gia-lap`, `BV-C4-bo-tong-hoan`, `BV-C5-bo-go-the`, `BV-D1-bo-gui-max`, `BV-D2-bo-tra-luot-huy`, `BV-D2-bo-tra-luot-xoa`, `BV-D2-bo-tra-luot-duyet`, `VS-D2-tra-ca-don-cu`, `VS-D2-khong-tra-voucher`, `BV-D3-luu-ma-go`, `BV-D4-bo-voucher-used`, `BV-D5-co-kim-cuong`, `BV-Q9-bo-hoan-me`, `VS-Q9-hoan-me-vao-vi-con`, `VS-Q9-hoan-me-khong-qua-cong-don`, `BV-duyet-cong-don-khong-kiem-changes`, `BV-hong-bo-tran`, `BV-hong-bo-tran-cong-don`, `VS-hong-tran-theo-man-hinh`, `VS-kb-hai-luot`, `VS-luot-trung-thieu`, `BV-cha-kiem-mot-lan`, `VS-luot-thieu-bat-bien`, `BV-G3-da-biet-thu-no`, `VS-q9-me-lon-hon-bang-0`, `BV-I18-bo`, `VS-I18-chi-so-nap`, `BV-I19-bo`, `VS-I19-bo-qua-no`, `VS-I11-bo-moi-dong-hoan`, `BV-I11-tinh-ca-hoan-goi`, `VS-I2-tinh-ca-ma-da-dung`, `VS-I13-dem-moi-trang-thai`, `VS-I7-nhan-moi-van-tay-la`

## GOI-1 (49) — qua lớp bọc
`python3 viec/AUDIT-4/boc.py GOI-1 -j 4` · thoát 0 · 57.6 s · git sạch · N11 LUOI-3: 40/49

Tổng 49 · BẮT 40 · HỎNG 9

| tên | nhãn | AUDIT-3 | đầu ra (rút gọn) | vì sao |
|---|---|---|---|---|
| `BV-GOI1-SL-AM` | HỎNG | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `VS-GOI1-SL-AM-CHI-0` | HỎNG | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `VS-GOI1-DUNG-QUYEN` | HỎNG | HỎNG | routes/packages.js: chuỗi gốc khớp 2 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `VS-GOI1-DUNG-DUA` | HỎNG | HỎNG | routes/packages.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `VS-GOI1-LOC-GOI` | HỎNG | HỎNG | src/pages/Reports.jsx: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `BV-GOI1-TIM-TEN` | HỎNG | HỎNG | src/pages/Reports.jsx: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `BV-GOI1-DANG-GIAO` | HỎNG | HỎNG | src/pages/Reports.jsx: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `VS-GOI1-SAP-CHUA-LAY` | HỎNG | HỎNG | src/pages/Reports.jsx: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |
| `BV-GOI1-NUT-LYDO` | HỎNG | HỎNG | src/pages/Reports.jsx: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | như AUDIT-3 |

Khác AUDIT-3: 0 tên.
BẮT: `BV-GOI1-TONG`, `VS-GOI1-TONG-GUI`, `BV-GOI1-TONG-PUT`, `BV-GOI1-SL`, `VS-GOI1-SL-CHI-AM`, `BV-GOI1-GIA`, `VS-GOI1-GIA-AM`, `BV-GOI1-GIA-PUT`, `BV-GOI1-LOAI`, `VS-GOI1-LOAI-SO-SAI`, `VS-GOI1-LOAI-TRUOC-TX`, `VS-GOI1-SL-GHI-GOC`, `BV-GOI1-MUA-LOAI`, `VS-GOI1-MUA-NHAN-GOI`, `VS-GOI1-DEM-HUY`, `VS-GOI1-DEM-NULL`, `BV-GOI1-DEM`, `BV-GOI1-TEN`, `VS-GOI1-TEN-DON`, `VS-GOI1-LAN-LAY-HUY`, `BV-GOI1-LS`, `BV-GOI1-LYDO`, `VS-GOI1-LYDO-KHONG-TRIM`, `BV-GOI1-DUNG-CHANGES`, `VS-GOI1-O-TONG`, `BV-GOI1-TU-TINH`, `BV-GOI1-SL-MAN`, `VS-GOI1-LOC-AM-THAM`, `BV-GOI1-GIA-MAN`, `BV-GOI1-LINK`, `BV-GOI1-URL`, `BV-GOI1-DO`, `VS-GOI1-KH-CHU-THICH`, `VS-GOI1-KH-CHU-THICH-CUOI`, `VS-GOI1-O-TONG-CHUOI`, `VS-GOI1-O-TONG-CHU-THICH`, `VS-GOI1-O-TONG-CUOI-DONG`, `BV-GOI1-KH-MOT-LAN`, `BV-GOI1-KH-URL`, `VS-GOI1-NUT-QUYEN`

## GOI-2 (59) — qua lớp bọc
`python3 viec/AUDIT-4/boc.py GOI-2 -j 4` · thoát 0 · 90.7 s · git sạch · N11 LUOI-3: 59/59

Tổng 59 · BẮT 59

Khác AUDIT-3: 0 tên.
BẮT: `BV-GOI2-GOM`, `VS-GOI2-CON-LAI-GOM-KET-THUC`, `VS-GOI2-LAU-GE`, `BV-GOI2-LAU`, `VS-GOI2-MOC-CHI-NGAY-MUA`, `VS-GOI2-LOC-XONG-CHI-KHACH-HET`, `BV-GOI2-LOC`, `BV-GOI2-LOC-GOI`, `BV-GOI2-LOC-PHONE`, `BV-GOI2-ORDER-CODE`, `BV-GOI2-NAN`, `VS-GOI2-NAN-GT`, `BV-GOI2-CONG-DU`, `BV-GOI2-HOAN`, `VS-GOI2-HOAN-GIA-NIEM-YET`, `VS-GOI2-HOAN-KHONG-CHIA-SO-GOI`, `BV-GOI2-ME`, `VS-GOI2-ME-KHONG-TRU-DA-HOAN`, `VS-GOI2-VI-KHONG-TRU-DA-HOAN`, `VS-GOI2-VI-TRUOC-ME`, `BV-GOI2-NO`, `BV-GOI2-DON-MUA`, `BV-GOI2-409`, `VS-GOI2-TIN-SO-TIEN-CLIENT`, `VS-GOI2-DU-KIEN-KHONG-QUYEN`, `VS-GOI2-KET-THUC-QUYEN`, `BV-GOI2-CONG`, `BV-GOI2-CONG-CHANGES`, `VS-GOI2-TIEN-MAT-GIAM-TOTAL-SPENT`, `VS-GOI2-NOTES-KHONG-SO`, `VS-GOI2-GHI-CHU-KHONG-MA-GOI`, `BV-GOI2-CHAN-HUY`, `VS-GOI2-CHAN-QUEN-XOA`, `VS-GOI2-CHAN-MOI-GOI`, `VS-GOI2-CHAN-XOA-MOI-TRANG-THAI`, `BV-GOI2-TRA-TUI-HUY`, `BV-GOI2-TRA-TUI-XOA`, `VS-GOI2-TRA-TUI-CHI-ACTIVE`, `VS-H2-khong-ghi-hoan-goi`, `VS-H2-hoan-goi-giam-total-spent`, `VS-me-hoan-gap-doi-huy`, `VS-me-hoan-gap-doi-xoa`, `BV-GOI2-URL-PHONE`, `BV-GOI2-LOC-THEM-TAT-CA`, `VS-GOI2-LOC-MAC-DINH`, `BV-GOI2-TIM-TEN`, `VS-GOI2-TRANG-THAI-CU`, `VS-GOI2-NUT-KHONG-QUYEN`, `VS-GOI2-NUT-GOI-DU`, `VS-GOI2-HOP-KHONG-BAT-CHON`, `VS-GOI2-HOP-KHONG-LY-DO`, `BV-GOI2-SO-TIEN-KHONG-GUI`, `BV-GOI2-LOI-KHONG-HIEN`, `BV-GOI2-LINK-DON-MUA`, `BV-GOI2-LINK-TEN-GOI`, `BV-GOI2-KH-DONG-GOI`, `VS-GOI2-KH-HIEN-CA-0-GOI`, `BV-GOI2-ORDERS-KHONG-DOC-CODE`, `VS-GOI2-ORDERS-KHONG-DOC-NGAY`

## SO-LUONG-1 (17) — `viec/AUDIT-4/dot_bien.py --bo SO-LUONG-1`
`python3 viec/AUDIT-4/dot_bien.py --bo SO-LUONG-1` · thoát 0 · 28.5 s · git sạch · N11 LUOI-3: 16/17

Tổng 17 · BẮT 16 · HỎNG 1

| tên | nhãn | AUDIT-3 | đầu ra (rút gọn) | vì sao |
|---|---|---|---|---|
| `VS-SOLUONG1-THE-SDT-THO` | HỎNG | BẮT | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | neo cổng thẻ cũ `orders.js:187` — BAN-HANG-1 A2 thay cổng (`:190`); đã thay bằng BAN-HANG-1 `VS-BANHANG1-THE-SDT-THO` (BẮT ở mục BAN-HANG-1). N11 LUOI-3 cũng 16/17 |

Khác AUDIT-3: 1 tên: `VS-SOLUONG1-THE-SDT-THO`.
BẮT: `VS-SOLUONG1-BO-NGUYEN`, `BV-SOLUONG1-MON`, `VS-SOLUONG1-MON-CHI-TU-GOI`, `VS-SOLUONG1-MON-MOT-MA`, `VS-SOLUONG1-MON-SO-THO`, `BV-SOLUONG1-MON-THU-GOI1`, `VS-SOLUONG1-MON-CHI-0-THU-GOI1`, `BV-SOLUONG1-GOI`, `VS-SOLUONG1-GOI-HOAC-1`, `VS-SOLUONG1-GOI-LAM-TRON`, `VS-SOLUONG1-GOI-THIEU-0`, `VS-SOLUONG1-GOI-CHI-1`, `BV-SOLUONG1-GOI-THIEU`, `VS-SOLUONG1-GOI-THIEU-CHI-MA`, `VS-SOLUONG1-GOI-THIEU-SIET`, `VS-SOLUONG1-GOI-THIEU-SDT-THO`

## BAN-HANG-1 (7) — `dot_bien.py --bo BAN-HANG-1` (AUDIT-3 chưa chạy)
`python3 viec/AUDIT-4/dot_bien.py --bo BAN-HANG-1` · thoát 0 · 14.7 s · git sạch · N11 LUOI-3: 7/7

Tổng 7 · BẮT 7

Khác AUDIT-3: KHÔNG so từng tên được (`viec/AUDIT-3/a2_bang.md` không có mục này) — AUDIT-3 đo bộ này ở A4: 10 AU3-8…17 SỐNG (`viec/AUDIT-3/bao_cao.md` AU3-8…17), nay hết SỐNG.
BẮT: `BV-BANHANG1-THE-CONG`, `VS-BANHANG1-THE-CONG-CU`, `VS-BANHANG1-THE-SDT-THO`, `VS-BANHANG1-THE-SIET-DOI-MON`, `VS-BANHANG1-THE-NULL-CHAN`, `BV-BANHANG1-HAN-DN-8H`, `VS-BANHANG1-HAN-DN-BO-BIEN`

## P20b (4) — `dot_bien.py --bo P20b` (AUDIT-3 chưa chạy)
`python3 viec/AUDIT-4/dot_bien.py --bo P20b` · thoát 0 · 3.8 s · git sạch · N11 LUOI-3: —

Tổng 4 · BẮT 4

Khác AUDIT-3: KHÔNG so từng tên được (`viec/AUDIT-3/a2_bang.md` không có mục này) — AUDIT-3 đo bộ này ở A4: 10 AU3-8…17 SỐNG (`viec/AUDIT-3/bao_cao.md` AU3-8…17), nay hết SỐNG.
BẮT: `BV-A2-bo-tra-signup`, `VS-A2-chi-chan-don-huy`, `VS-A2-chan-ca-ma-tay`, `VS-A2-tra-ca-ma-chua-claim`

## LUOI-1 (78 trên HEAD; 2 GOC-* CHƯA KIỂM — kho nông) — qua bọc `boc_dict`
`python3 viec/AUDIT-4/boc.py --luoi1 -j 4` · thoát 0 · 103.4 s · git sạch · N11 LUOI-3: —

Tổng 78 · BẮT 78

Khác AUDIT-3: 0 tên.
BẮT: `BV-A1-tre-khong-bat-lai`, `VS-A1-tre-chi-bat-kb-dau`, `BV-B4-sx-khong-tu-tat`, `VS-B4-sx-mac-dinh-bat`, `VS-B4-bat-khong-ghi-kb`, `BV-B4-kb-khong-gan`, `VS-SRV-doi-ck-giu-tien-mat`, `VS-SRV-bo-khoa-dangChay`, `VS-B4-loi-van-nhan`, `VS-I7-tong-chi-tren`, `VS-I7-tong-chi-duoi`, `BV-I7-b-no-da-xong`, `BV-I7-c-loi-phai-co-no`, `VS-I7-c-no-chi-duoi`, `BV-I7-d-no-phai-co-loi`, `BV-I7-no-khong-van-tay`, `BV-I7-e-kb-bat`, `VS-I8-diem-chi-tren`, `VS-I8-diem-chi-duoi`, `VS-I8-qua-chi-duoi`, `VS-I8-qua-chi-tren`, `BV-I8-loai-null`, `BV-I8-loai-la`, `BV-I12-loai-dong`, `BV-I12-sdt`, `VS-I12-diem-chi-tren`, `VS-I12-diem-chi-duoi`, `BV-I12-loai-ma`, `VS-I12-tri-gia-chi-tren`, `VS-I12-tri-gia-chi-duoi`, `BV-I12-tran`, `VS-I12-tran-chi-duoi`, `VS-I12-tran-chi-tren`, `VS-I12-tran-lech-1000`, `BV-I12-so-ma`, `VS-I12-dung-chi-duoi`, `VS-I12-dung-chi-tren`, `VS-I13-dung-chi-tren`, `VS-I13-dung-chi-duoi`, `VS-I13-gioi-han-cong-1`, `BV-I13-bo-gioi-han-0`, `BV-I13-so-tay`, `BV-I13-bo-loai`, `BV-I13-bo-tri-gia`, `VS-I14-vuot-tong-cong-1`, `VS-I14-giao-chi-tren`, `VS-I14-giao-chi-duoi`, `BV-I14-so-tay`, `BV-I14-tinh-ca-don-huy`, `BV-I14-tinh-ca-mon-co-gia`, `BV-I14-goi-don-huy`, `BV-I14-goi-don-xoa`, `BV-I14-tro-goi`, `BV-I14-bo-product-id`, `BV-I14-tro-bo-not-null`, `BV-I14-mua-bo-co-goi`, `BV-I14-mua-bo-lay-ngay`, `BV-I14-mua-lay-ngay`, `VS-I15-the-chi-tren`, `VS-I15-the-chi-duoi`, `BV-I15-tinh-ca-don-huy`, `BV-I15-bo-sdt`, `BV-I15-bo-mon-the`, `BV-I15-sdt-rong`, `BV-I15-mua-don-huy`, `BV-I15-mua-don-xoa`, `VS-I16-tien-chi-tren`, `VS-I16-tien-chi-duoi`, `VS-I16-luon-cot-ck`, `BV-I16-nhanh-ck`, `VS-I16-luon-cot-tm`, `BV-I16-cot-kia`, `BV-I16-dong-cuoi`, `BV-I17-bo-approved`, `BV-I17-loai-dong`, `BV-I17-don`, `BV-I17-sdt`, `VS-I17-tien-lech-1`

## TACH-GL (29) — qua bọc `boc_dict` (AUDIT-3 chạy thẳng)
`python3 viec/AUDIT-4/boc.py --tachgl -j 2` · thoát 1 · 783.2 s · git sạch · N11 LUOI-3: —

Tổng 29 · BẮT 25 · HỎNG 3 · LẠC 1

| tên | nhãn | AUDIT-3 | đầu ra (rút gọn) | vì sao |
|---|---|---|---|---|
| `VS-kb-hai-luot` | HỎNG | HỎNG | cong_cu/gia_lap/kich_ban.js: chuỗi gốc khớp 0 lần, cần 1 | như AUDIT-3 |
| `VS-luot-trung-thieu` | HỎNG | HỎNG | cong_cu/gia_lap/kich_ban.js: chuỗi gốc khớp 0 lần, cần 1 | như AUDIT-3 |
| `BV-cha-kiem-mot-lan` | HỎNG | HỎNG | cong_cu/gia_lap/kich_ban.js: chuỗi gốc khớp 0 lần, cần 1 | như AUDIT-3 |
| `VS-luot-thieu-bat-bien` | LẠC | LẠC | ✗ chia lượt → số bất biến các lượt khác nhau: 18, 8 · thiếu mẫu: ✗ thoát 0, dòng tổng đúng .* — thoát 1 · Giả lập: 29 kịch bản · 16 bất biến · ✗ thoát | như AUDIT-3 |

Khác AUDIT-3: 0 tên.
BẮT: `BV-cha-bo-luot`, `VS-cha-nuot-ma-thoat`, `VS-cha-in-lai-tong-con`, `BV-cha-khong-dung-con-SIGTERM`, `BV-cha-khong-dung-con-khi-sap`, `BV-con-khong-theo-doi-cha`, `BV-cha-khong-don-kho`, `BV-kho-khong-kiem`, `BV-den-kb-0-luot-rong`, `VS-con-giau-dong-lech`, `BV-kho-bo-ve-thu-muc-tam`, `BV-kho-bo-ve-ten`, `BV-cha-nhan-kho`, `BV-luot-khong-kiem`, `VS-che-do-theo-gia-tri`, `BV-luot-vuot-khong-kiem`, `BV-kich-ban-hong-van-tho`, `VS-luot-tuan-tu`, `VS-dong-lech-so-trong-luot`, `VS-SRV-qua-viet-cung-fixed`, `VS-SRV-qua-bo-tran`, `BV-SRV-ban-bo-ap-tran`, `VS-SRV-tran-doi-nguong-tren`, `VS-SRV-tran-doi-nguong-duoi`, `VS-SRV-tran-luon-ap`

## AUDIT-3 `dot_bien.py` (21 + 5 D2) — chạy thẳng (có đối chứng + luật sập vòng 3)
`python3 viec/AUDIT-3/dot_bien.py` · thoát 1 · 35.5 s · git sạch · N11 LUOI-3: —

Tổng 26 · BẮT 15 · HỎNG 5 · LẠC 5 · SỐNG 1

| tên | nhãn | AUDIT-3 | đầu ra (rút gọn) | vì sao |
|---|---|---|---|---|
| `D2-AU3-sai-chuoi` | HỎNG | — |  | cố ý (D2 sai chuỗi → HỎNG) |
| `D2-AU3-vo-hai` | SỐNG | — |   118 đạt · 0 hỏng | cố ý (D2 vô hại → SỐNG) |
| `D2-AU3-sap` | HỎNG | — |  | cố ý — bộ AUDIT-3 in nhãn HỎNG với chi "bài thử SẬP" (= HỎNG-sập) |
| `D2-AU3-sap-0` | HỎNG | — | [A1] huỷ rồi xoá đơn giao từ gói → delivered_qty chỉ hoàn MỘT lần | cố ý — như trên (thoát 0 không dòng tổng) |
| `VS-AU3-P26C-DATRA-GIA-GOC` | LẠC | — |   116 đạt · 2 hỏng | LẠC-mẫu: mẫu AUDIT-3 (`✗ B1` / `✗ (S2|A5)…`) không theo tên ca LUOI-3; đỏ ĐÚNG ca LUOI-3 ở mục LUOI-3 (BẮT, câu lỗi = bằng chứng LUOI-3) |
| `VS-AU3-P26C-DEN-GIAM-BO-FLASH` | LẠC | — |   117 đạt · 1 hỏng | LẠC-mẫu: mẫu AUDIT-3 (`✗ B1` / `✗ (S2|A5)…`) không theo tên ca LUOI-3; đỏ ĐÚNG ca LUOI-3 ở mục LUOI-3 (BẮT, câu lỗi = bằng chứng LUOI-3) |
| `VS-AU3-P26C-HUY-ME-TRA-0` | HỎNG | — | SO_DU_KHONG_DU · Số dư mẹ không đủ. Hiện có: 5,000đ | HỎNG-sập (AU3-6: thu_P26b ✗ M2/M3 rồi sập) — như AUDIT-3 |
| `VS-AU3-SL-DONG-GOI-SL-1` | LẠC | — |   116 đạt · 2 hỏng | LẠC-mẫu: mẫu AUDIT-3 (`✗ B1` / `✗ (S2|A5)…`) không theo tên ca LUOI-3; đỏ ĐÚNG ca LUOI-3 ở mục LUOI-3 (BẮT, câu lỗi = bằng chứng LUOI-3) |
| `VS-AU3-SL-DONG-GOI-TONG-1` | LẠC | — |   117 đạt · 1 hỏng | LẠC-mẫu: mẫu AUDIT-3 (`✗ B1` / `✗ (S2|A5)…`) không theo tên ca LUOI-3; đỏ ĐÚNG ca LUOI-3 ở mục LUOI-3 (BẮT, câu lỗi = bằng chứng LUOI-3) |
| `VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL` | LẠC | — |   117 đạt · 1 hỏng | LẠC-mẫu: mẫu AUDIT-3 (`✗ B1` / `✗ (S2|A5)…`) không theo tên ca LUOI-3; đỏ ĐÚNG ca LUOI-3 ở mục LUOI-3 (BẮT, câu lỗi = bằng chứng LUOI-3) |
| `BV-AU3-SL-THE-BO-CONG` | HỎNG | — |  | neo cổng thẻ cũ — BAN-HANG-1 thay cổng; bản thay chức năng `BV-BANHANG1-THE-CONG` (BẮT); hồ sơ KHÔNG ghi → phát hiện AU4-9 |

Khác AUDIT-3: KHÔNG so từng tên được (`viec/AUDIT-3/a2_bang.md` không có mục này) — AUDIT-3 đo bộ này ở A4: 10 AU3-8…17 SỐNG (`viec/AUDIT-3/bao_cao.md` AU3-8…17), nay hết SỐNG.
BẮT: `D2-AU3-da-biet`, `BV-AU3-P26C-DATRA-BO-TRU-SHIP`, `VS-AU3-P26C-DEN-TRAN-CA-DON`, `VS-AU3-P26C-DUYET-VI-DA-TRA-CHI-CON`, `VS-AU3-GOI1-LOAI-KHONG-CONG-DON`, `BV-AU3-GOI1-LOAI-BO-DA-LAY`, `VS-AU3-GOI1-DEM-DONG-THAY-SL`, `VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN`, `BV-AU3-GOI2-BO-TRAN-DA-NHAN`, `VS-AU3-GOI2-HOAN-CA-DA-LAY`, `VS-AU3-GOI2-NHAN-BO-DEN`, `VS-AU3-GOI2-GHI-HOAN-PHAN-VI-HOAN-GOI`, `VS-AU3-SL-TIEN-MOT-GOI`, `VS-AU3-SL-TAO-MOT-GOI`, `BV-AU3-SL-HAM-LUON-DUNG`

## LUOI-3 `dot_bien.py` (10, mẫu = tên ca LUOI-3)
`python3 viec/LUOI-3/dot_bien.py` · thoát 0 · 20.5 s · git sạch · N11 LUOI-3: 10/10

Tổng 10 · BẮT 10

Khác AUDIT-3: KHÔNG so từng tên được (`viec/AUDIT-3/a2_bang.md` không có mục này) — AUDIT-3 đo bộ này ở A4: 10 AU3-8…17 SỐNG (`viec/AUDIT-3/bao_cao.md` AU3-8…17), nay hết SỐNG.
BẮT: `BV-AU3-P26C-DATRA-BO-TRU-SHIP`, `VS-AU3-P26C-DATRA-GIA-GOC`, `VS-AU3-P26C-DEN-GIAM-BO-FLASH`, `VS-AU3-GOI1-LOAI-KHONG-CONG-DON`, `VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN`, `BV-AU3-GOI2-BO-TRAN-DA-NHAN`, `VS-AU3-GOI2-NHAN-BO-DEN`, `VS-AU3-SL-DONG-GOI-SL-1`, `VS-AU3-SL-DONG-GOI-TONG-1`, `VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL`
