# AUDIT-3 A2 — kết quả từng tên trên HEAD (code chạy thật = 31a5810; sinh bằng script từ nhật ký lần chạy 15.10.2026, máy mây)

Nhãn theo AUDIT-3: **HỎNG-sập** = bộ cũ ghi LẠC / BẮT / "bị bắt" nhưng dòng khớp hay đầu ra có dấu sập (`Bài thử sập`, `Giả lập: SẬP`, `SẬP giữa kịch bản` — `--xep` / lớp bọc, soát vòng 1). Mỗi tên không BẮT có
cột "vì sao / so AUDIT-2". Tên BẮT liệt kê gọn cuối mỗi bộ. Lệnh chạy lại ở từng mục; nhật ký gốc để ở thư mục nháp (không chép vào kho).

## AUDIT-1 trừ C2F (88 = G3 4 · A3 16 · B1 8 · C2 3 · D1 57)
`python3 viec/AUDIT-1/dot_bien.py G3 A3 B1 C2 D1 -j 3 (988 s)`

Tổng 88 · BẮT 81 · HỎNG 2 · HỎNG-sập 2 · LẠC 2 · SỐNG 1

| tên | nhãn | đầu ra (rút gọn) | vì sao / so AUDIT-2 |
|---|---|---|---|
| `G3-sai-chuoi` | HỎNG | server/routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | cố ý (công cụ tự chứng minh) — như AUDIT-2 |
| `G3-da-biet` | HỎNG | server/routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | neo câu thu nợ rữa vì P26c C1 (`status != 'cancelled'` → `= 'completed'`); đã thay bằng P26c `BV-G3-da-biet-thu-no` (BẮT ở mục P26c) |
| `G3-vo-hai` | SỐNG | mọi lệnh thoát 0 | cố ý — như AUDIT-2 |
| `G3-sap` | HỎNG-sập | [cong_cu/gia_lap/chay.js --den-kb 1 thoát 2] Giả lập: SẬP — /tmp/audit1_ppl_5zjm/db_a6_rv6mj/kho/server/routes/orders.js | cố ý: khung AUDIT-1 ghi LẠC, AUDIT-3 xếp HỎNG-sập (`--xep`) — như AUDIT-2 |
| `!D1-E11-P20` | LẠC | [kiem_tra_truoc_khi_giao.js thoát 1] ✗ CÓ LỖI — sửa xong rồi commit. Đọc CHECKLIST_CODE.md. | LẠC như AUDIT-2 (bộ kiểm đỏ nhưng câu ✗ của phép khác) — không đổi |
| `!D1-E11-P26a` | LẠC | [kiem_tra_truoc_khi_giao.js thoát 1] ✗ CÓ LỖI — sửa xong rồi commit. Đọc CHECKLIST_CODE.md. | LẠC như AUDIT-2 — không đổi |
| `!D1-E11-P26b` | HỎNG-sập | [kiem_tra_truoc_khi_giao.js] ✗ bài chạy thật cong_cu/thu_P26b.js xanh (1.1 s)  → ✗ A1b huỷ đơn ví completed → 200, ví +2 |  |

BẮT: `A3-GITADD-bo-A`, `A3-GITCOMMIT-bo-a`, `A3-GITPUSH-moi-nhanh`, `A3-SED-i-ngan`, `A3-RM-bo-realpath`, `A3-CURL-moi-host`, `A3-LN-dao-s`, `A3-G1CAM-theoten`, `A3-FINDCAM-bo-delete`, `A3-NPM-them-install`, `A3-MKDIR-bo-khung`, `A3-TARX-moi-dich`, `A3-FILEC-bo-ngan`, `A3-BGAN-bo-PATH`, `A3-CCLA-them-la`, `A3-GHIDUOC-bo-khung`, `B1-A11-dao-goc`, `B1-A11-bo-xanh-PR`, `B1-A6-bo-phamvi`, `B1-A10-bo-filecam`, `B1-A7-noi-tieude`, `B1-A12-bo`, `B1-laBaiThu-noi-slash`, `B1-A14-bo-dang-nhanh`, `C2-orders-bo-diem-ban`, `C2-sc-bo-diem-ma`, `C2-loyalty-redeem-tru-0`, `D1-A1-fffd`, `D1-B1-json-tran`, `D1-C1-them-fetch`, `D1-E1-unitprice`, `D1-E7-paydebt`, `D1-E8-backup`, `D1-E12-vi-ngoai`, `D1-K1-env-tho`, `D1-S3-vi-lech`, `D1-F3-test-thieu`, `D1-A2-server-cu-phap`, `D1-A2c-client-cu-phap`, `D1-B2-login-2-cho`, `D1-B-handleSE`, `D1-B-co-song-song`, `D1-B-pathname`, `D1-B-deadcodes-thieu`, `D1-B-eb-getDerived`, `D1-B-eb-ton-tai`, `D1-B-main-boc`, `D1-B-layout-boc`, `D1-B-key`, `D1-B-ahref-api`, `D1-B-pos6-loginTime`, `D1-D-build-prod`, `D1-E-gia-0`, `D1-E2-authz-tho`, `D1-E-trangthai-dungma`, `D1-E-danhsach-trang`, `D1-E-claim-chiem`, `D1-E-ndiem-chiem`, `D1-E-vi-tuongdoi`, `D1-E-vi-trang5`, `D1-K-4ca`, `D1-K-data`, `D1-F-attached`, `D1-F-dist`, `D1-E1b-tra-gia`, `D1-E9-claim-kiem`, `D1-E9-ndiem-kiem`, `D1-E9-claim-dung`, `D1-E9-ndiem-dung`, `D1-E10-doisoat-tx`, `D1-E10-doisoat-trang`, `D1-B-deadcodes-service`, `D1-B-pos5-query`, `!D1-E11-P21`, `!D1-T1-nguoi-gac`, `!D1-T1b-cong-cu`, `!D1-T1c-cong`, `B1-A8-noi`, `B1-A9-noi`, `B1-A13-bo-daydu`, `B1-A15-dao-fork`

## AUDIT-1 C2F (87) + AUDIT-2 A3L còn c2full (13) — cách `c2luoi`
`python3 viec/AUDIT-3/boc.py --c2luoi -j 3 (1199 s)`

Tổng 100 · BẮT 71 · HỎNG 2 · HỎNG-sập 2 · SỐNG 25

| tên | nhãn | đầu ra (rút gọn) | vì sao / so AUDIT-2 |
|---|---|---|---|
| `C2F-orders-02-insert-quay` | HỎNG-sập | [cong_cu/gia_lap/chay.js thoát 2] Giả lập: SẬP — Error: không tạo được đơn "nợ mẫu": HTTP 500 SQLITE_CONSTRAINT_FOREIGNK | bỏ INSERT pos_orders → giả lập không dựng được đơn mẫu (SẬP) — AUDIT-2 cũng LẠC; AUDIT-3 xếp HỎNG-sập; lưới không phủ nổi vì bỏ câu này thì không có đơn nào (NHẸ) |
| `C2F-orders-10-insert-quay` | HỎNG-sập | [cong_cu/gia_lap/chay.js] ✗ KB30 → HTTP: SẬP giữa kịch bản: Only finite numbers (not Infinity or NaN) can be passed as a |  |
| `C2F-orders-14-update-quay` | SỐNG | mọi lệnh thoát 0 | = AUDIT-2 `C2F-orders-13-update-quay` (ghi chú phiếu đăng ký SX) — tên C2F đánh số theo VỊ TRÍ, trượt vì orders.js đổi; NHẸ như a2_bang AUDIT-2 |
| `C2F-orders-15-insert-quay` | SỐNG | mọi lệnh thoát 0 | = AUDIT-2 `-14-insert` (tạo phiếu đăng ký SX) — NHẸ |
| `C2F-orders-33-delete-quay` | SỐNG | mọi lệnh thoát 0 | = AUDIT-2 `-36-delete` (pos_promotion_usage mồ côi khi xoá) — NHẸ |
| `C2F-orders-34-delete-quay` | SỐNG | mọi lệnh thoát 0 | = AUDIT-2 `-37-delete` (pos_invoice_logs mồ côi) — NHẸ |
| `C2F-damages-03-update-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 (cờ returned_to_stock) — NHẸ |
| `C2F-packages-01-insert-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ |
| `C2F-packages-03-update-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ-tiền (chủ tắt gói) |
| `C2F-packages-04-delete-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ |
| `C2F-packages-05-update-quay` | SỐNG | mọi lệnh thoát 0 | MỚI (GOI-2 A2: nắn gói đủ → completed ở GET theo-khach, `packages.js:194`) — bỏ thì báo cáo hiện gói đủ là 'đang dùng'; lấy hàng vẫn bị trần chặn (`orders.js:926`); thu_GOI1 B2a bắt (ngoài c2luoi) — NHẸ |
| `C2F-packages-06-update-quay` | SỐNG | mọi lệnh thoát 0 | = AUDIT-2 `-06-update-quan-tri` (kết thúc gói, nay PUT cancel quyền refund_package) — thu_GOI1 A5d/B3i bắt (ngoài c2luoi) — NHẸ-tiền |
| `C2F-signup-codes-05-update-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ |
| `C2F-signup-codes-06-delete-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ-tiền |
| `C2F-discount-codes-02-update-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ-tiền |
| `C2F-discount-codes-03-update-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ-tiền |
| `C2F-discount-codes-04-delete-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ-tiền |
| `C2F-rewards-02-update-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ-tiền |
| `C2F-rewards-03-update-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ-tiền |
| `C2F-customers-v2-01-insert-khong-ro` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ |
| `C2F-customers-v2-02-update-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ |
| `C2F-customers-v2-03-insert-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ |
| `C2F-customers-v2-04-update-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ-tiền |
| `C2F-customers-v2-05-insert-quan-tri` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 — NHẸ |
| `A3L-redeem-bo-han-diem` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 (hạn điểm theo quý — NHẸ, a3_bang AUDIT-2) |
| `A3L-nhandiem-he-so-mac-dinh` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 (hệ số mặc định — NHẸ) |
| `A3L-goi-bo-kiem-con-lai` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 (`conLai <= 0` chồng với cổng trạng thái + trần P26c A2 — NHẸ) |
| `A3L-goi-giao-them-1` | HỎNG | server/routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | **AU3-3**: neo `[deliveredQty, deliveredQty, now, customer_package_id]` 0 lần — P26c A2 dời trừ lượt vào giao dịch; hồ sơ không ghi; cùng ý P26c `BV-A2-bo-tran` (BẮT) |
| `A3L-deliver-bo-chan-am` | HỎNG | server/routes/packages.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | **AU3-3**: PUT /deliver đã bỏ (P26c A4) — hồ sơ không ghi; cùng ý P26c `BV-A4-deliver-song-lai` (BẮT) |

BẮT: `C2F-orders-01-ghiVi-quay`, `C2F-orders-03-update-quay`, `C2F-orders-04-insert-quay`, `C2F-orders-05-update-quay`, `C2F-orders-06-update-quay`, `C2F-orders-07-update-quay`, `C2F-orders-08-insert-quay`, `C2F-orders-09-insert-quay`, `C2F-orders-11-update-quay`, `C2F-orders-12-update-quay`, `C2F-orders-13-insert-quay`, `C2F-orders-16-insert-quay`, `C2F-orders-17-update-quay`, `C2F-orders-18-insert-quay`, `C2F-orders-19-update-quay`, `C2F-orders-20-update-quay`, `C2F-orders-21-delete-quay`, `C2F-orders-22-update-quay`, `C2F-orders-23-delete-quay`, `C2F-orders-24-update-quay`, `C2F-orders-25-update-quay`, `C2F-orders-26-insert-quay`, `C2F-orders-27-update-quay`, `C2F-orders-28-delete-quay`, `C2F-orders-29-update-quay`, `C2F-orders-30-delete-quay`, `C2F-orders-31-delete-quay`, `C2F-orders-32-delete-quay`, `C2F-orders-35-delete-quay`, `C2F-orders-36-delete-quay`, `C2F-orders-37-delete-quay`, `C2F-orders-38-insert-quay`, `C2F-refunds-01-insert-quay`, `C2F-refunds-02-update-quay`, `C2F-refunds-03-update-quay`, `C2F-refunds-04-ghiVi-quay`, `C2F-refunds-05-update-quay`, `C2F-refunds-06-ghiVi-quay`, `C2F-refunds-07-update-quay`, `C2F-wallets-01-update-quay`, `C2F-wallets-02-insert-quay`, `C2F-wallets-03-insert-quay`, `C2F-wallets-04-ghiVi-quay`, `C2F-wallets-05-ghiVi-quay`, `C2F-wallets-06-ghiVi-quay`, `C2F-wallets-07-ghiVi-quay`, `C2F-wallets-08-ghiVi-quay`, `C2F-wallets-09-update-quay`, `C2F-wallets-10-insert-quay`, `C2F-damages-01-ghiVi-quan-tri`, `C2F-damages-02-insert-quan-tri`, `C2F-packages-02-update-quan-tri`, `C2F-signup-codes-01-update-khach-app`, `C2F-signup-codes-02-insert-khach-app`, `C2F-signup-codes-03-update-khach-app`, `C2F-signup-codes-04-insert-khach-app`, `C2F-discount-codes-01-insert-quan-tri`, `C2F-discount-codes-05-update-quay`, `C2F-rewards-01-insert-quan-tri`, `C2F-loyalty-01-insert-khach-app`, `C2F-loyalty-02-insert-khach-app`, `C2F-loyalty-03-insert-khach-app`, `C2F-don-mo-rong-01-update-quay`, `A3L-redeem-bo-chan-diem`, `A3L-redeem-tru-them-1`, `A3L-redeem-ma-dung-2-lan`, `A3L-earn-lam-tron-len`, `A3L-goi-bo-kiem-trang-thai`, `A3L-goi-lay-ngay-them-1`, `A3L-goi-huy-lay-khong-tra-luot`, `A3L-goi-xoa-lay-khong-tra-luot`

## AUDIT-2 A3L · B3 · A3P · D2K (30; bỏ A3B)
`python3 viec/AUDIT-2/dot_bien.py A3L B3 A3P D2K -j 3 (406 s)`

Tổng 30 · BẮT 18 · HỎNG 4 · LẠC 1 · SỐNG 7

| tên | nhãn | đầu ra (rút gọn) | vì sao / so AUDIT-2 |
|---|---|---|---|
| `D2K-sai-chuoi` | HỎNG | server/routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | cố ý — như AUDIT-2 |
| `D2K-da-biet` | HỎNG | server/routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | **AU3-2**: neo rữa vì P26c C1 (như `G3-da-biet`) — bằng chứng 'đã biết → BẮT' của AUDIT-2 không còn; đề xuất đổi neo sang `BV-G3-da-biet-thu-no` |
| `D2K-vo-hai` | SỐNG | mọi lệnh thoát 0 | cố ý — như AUDIT-2 |
| `A3L-redeem-bo-han-diem` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 (hạn điểm theo quý — NHẸ, a3_bang AUDIT-2) |
| `A3L-nhandiem-he-so-mac-dinh` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 (hệ số mặc định — NHẸ) |
| `A3L-goi-bo-kiem-con-lai` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 (`conLai <= 0` chồng với cổng trạng thái + trần P26c A2 — NHẸ) |
| `A3L-goi-giao-them-1` | HỎNG | server/routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | **AU3-3**: neo `[deliveredQty, deliveredQty, now, customer_package_id]` 0 lần — P26c A2 dời trừ lượt vào giao dịch; hồ sơ không ghi; cùng ý P26c `BV-A2-bo-tran` (BẮT) |
| `A3L-deliver-bo-chan-am` | HỎNG | server/routes/packages.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | **AU3-3**: PUT /deliver đã bỏ (P26c A4) — hồ sơ không ghi; cùng ý P26c `BV-A4-deliver-song-lai` (BẮT) |
| `A3P-goi-lay-vuot-luot` | SỐNG | mọi lệnh thoát 0 | NGƯỢC NGHĨA: SỐNG = máy chủ nay trả 400 cho 'gói 3 lượt xin 4' — AU2-1 ĐÃ ĐÓNG (AUDIT-2: BẮT = code sai) |
| `BK-KB16-duyet-bo-cong-don` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 (SỐNG — khoá hai lớp: huỷ đơn từ chối yêu cầu trong cùng giao dịch, b3_bang AUDIT-2 ghi chú 1) |
| `BK-KB20-bo-kiem-lai-ma` | SỐNG | mọi lệnh thoát 0 | như AUDIT-2 (AU2-9, chờ P26d) |
| `BK-KB21-huy-goi-bo-changes` | LẠC | [cong_cu/gia_lap/chay.js --den-kb 21 thoát 1] Giả lập: 5 kịch bản · 18 bất biến · KHÔNG ĐẠT (1 lệch) | **khác AUDIT-2 (BẮT → LẠC)**: KB21 vẫn KHÔNG ĐẠT (huỷ lần hai → 400 nhưng mã `GOI_DA_KET_THUC` của cổng GOI-2 `goiDaKetThuc` thay vì `DON_KHONG_HUY_DUOC`; vẫn đúng một dòng hoàn) — mẫu `hai nhân viên huỷ` rữa vì P26c đổi tên ca KB21 thành 'hai lần chủ huỷ'; cổng `changes` nay bị cổng GOI-2 che (hai cổng chồng, K3) — AU3-4 NHẸ |

BẮT: `A3L-redeem-thieu-1-diem`, `A3L-redeem-bo-chan-diem`, `A3L-redeem-tru-them-1`, `A3L-redeem-ma-dung-2-lan`, `A3L-earn-lam-tron-len`, `A3L-earn-flash-van-cong`, `A3L-nhandiem-cong-doi`, `A3L-goi-bo-kiem-chu`, `A3L-goi-bo-kiem-trang-thai`, `A3L-goi-lay-ngay-them-1`, `A3L-goi-huy-lay-khong-tra-luot`, `A3L-goi-xoa-lay-khong-tra-luot`, `A3L-goi-huy-dem-ca-mon-tra-tien`, `A3L-goi-xoa-dem-ca-mon-tra-tien`, `A3L-hoan-goi-bo-tru-no`, `BK-KB10-thu-bo-changes`, `BK-KB11-claim-bo-chiem`, `BK-KB11-nhandiem-bo-chiem`

## dot_bien_bb.py (175 sinh + 4 D2)
`python3 viec/AUDIT-2/dot_bien_bb.py -j 4 (742 s)`

Tổng 179 · BẮT 125 · HỎNG 1 · HỎNG-sập 1 · LẠC 2 · SỐNG 50

| tên | nhãn | đầu ra (rút gọn) | vì sao / so AUDIT-2 |
|---|---|---|---|
| `BB-I1-sql-1-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I1-sql-2-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I1-sql-3-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I1-sql-4-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I1-js-1-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I1-js-2-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I1-js-6-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I1-js-7-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I1-js-8-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I1-js-9-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I2-sql-2-bo-ve` | LẠC | [cong_cu/thu_gia_lap.js thoát 1] ✗ mã gắn đơn có thật; mã ĐÃ dùng của đơn đã xoá → I2 ra 0 dòng  — ["mã DUNG1 mồ côi (or | LẠC-mẫu: thu_gia_lap đỏ đúng ca tay I2 của P26c ('✗ mã gắn đơn có thật…') nhưng tên ca không bắt đầu bằng `I2` nên bộ sinh không nhận — thực chất BẮT; AU3-5 NHẸ (đặt tên ca tay theo `I<n>`) |
| `BB-I2-sql-3-bo-ve` | LẠC | [cong_cu/thu_gia_lap.js thoát 1] ✗ mã gắn đơn có thật; mã ĐÃ dùng của đơn đã xoá → I2 ra 0 dòng  — ["mã DUNG2 mồ côi (or | như trên — AU3-5 |
| `BB-I3-sql-1-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I3-sql-2-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I3-sql-3-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I3-sql-4-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I3-sql-1-duong` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I3-sql-1-am` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I4-js-1-duong` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I4-js-1-am` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I6-js-1-duong` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I6-js-1-am` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I8-js-1-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I8-js-3-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I8-js-4-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I8-js-5-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I8-js-1-duong` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I8-js-1-am` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I8-js-2-duong` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I8-js-2-am` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I9-js-3-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I9-js-4-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I9-js-1-duong` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I9-js-1-am` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I9-js-2-duong` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I9-js-2-am` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I9-js-3-duong` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I9-js-3-am` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I9-js-4-duong` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I9-js-4-am` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I12-js-2-duong` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I13-sql-1-am` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I14-sql-10-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I14-sql-11-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I14-sql-1-duong` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I14-sql-2-duong` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I14-sql-2-am` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I16-sql-1-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I16-sql-4-bo-ve` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I16-js-2-duong` | SỐNG | mọi tầng xanh | như AUDIT-2 (b2_bang.md: (a) thiếu ca tay / (b) vế thừa) — NHẸ |
| `BB-I18-sql-10-bo-ve` | SỐNG | mọi tầng xanh | MỚI (I18 từ P26c): vế `t.type = 'adjust'` trong `(adjust AND amount < 0)` → 1=1: số âm chỉ có ở purchase (đã đếm) và adjust → (b) vế thừa về mặt dữ liệu thật, giữ cho rõ nghĩa — NHẸ |
| `BB-I18-js-1-duong` | SỐNG | mọi tầng xanh | MỚI: `Math.abs(total_topup − nạp) > 0.5` chỉ còn bắt chiều total_topup > nạp → (a) thiếu ca tay 'tổng nạp 99.999 < sổ' — NHẸ, đề xuất ca thu_gia_lap |
| `D2-sai-chuoi` | HỎNG | chuỗi gốc khớp 0 lần, cần 1 | cố ý — như AUDIT-2 |
| `D2-sap` | HỎNG-sập | [cong_cu/thu_gia_lap.js thoát 1] ✗ bài thử sập  — /tmp/au2bb_hkxmac_2/au2bb_wiqivd69/kho/cong_cu/gia_lap/bat_bien.js:96  | cố ý: bb ghi LẠC, AUDIT-3 xếp HỎNG-sập — như AUDIT-2 |

BẮT: `BB-I1-js-3-bo-ve`, `BB-I1-js-4-bo-ve`, `BB-I1-js-5-bo-ve`, `BB-I2-sql-1-bo-ve`, `BB-I3-sql-5-bo-ve`, `BB-I3-sql-6-bo-ve`, `BB-I3-sql-7-bo-ve`, `BB-I3-sql-8-bo-ve`, `BB-I4-sql-1-bo-ve`, `BB-I4-sql-2-bo-ve`, `BB-I7-sql-1-bo-ve`, `BB-I7-sql-2-bo-ve`, `BB-I7-js-1-bo-ve`, `BB-I7-js-2-bo-ve`, `BB-I7-js-1-duong`, `BB-I7-js-1-am`, `BB-I7-js-2-duong`, `BB-I7-js-2-am`, `BB-I7-js-3-duong`, `BB-I7-js-3-am`, `BB-I8-sql-1-bo-ve`, `BB-I8-sql-2-bo-ve`, `BB-I8-js-2-bo-ve`, `BB-I8-js-6-bo-ve`, `BB-I8-js-7-bo-ve`, `BB-I8-js-3-duong`, `BB-I8-js-3-am`, `BB-I8-js-4-duong`, `BB-I8-js-4-am`, `BB-I9-js-1-bo-ve`, `BB-I9-js-2-bo-ve`, `BB-I9-js-5-bo-ve`, `BB-I9-js-6-bo-ve`, `BB-I9-js-7-bo-ve`, `BB-I9-js-8-bo-ve`, `BB-I11-sql-1-bo-ve`, `BB-I11-sql-2-bo-ve`, `BB-I12-js-1-bo-ve`, `BB-I12-js-2-bo-ve`, `BB-I12-js-3-bo-ve`, `BB-I12-js-4-bo-ve`, `BB-I12-js-5-bo-ve`, `BB-I12-js-6-bo-ve`, `BB-I12-js-7-bo-ve`, `BB-I12-js-8-bo-ve`, `BB-I12-js-1-duong`, `BB-I12-js-1-am`, `BB-I12-js-2-am`, `BB-I12-js-3-duong`, `BB-I12-js-3-am`, `BB-I12-js-4-duong`, `BB-I12-js-4-am`, `BB-I12-js-5-duong`, `BB-I12-js-5-am`, `BB-I13-sql-1-bo-ve`, `BB-I13-sql-2-bo-ve`, `BB-I13-sql-3-bo-ve`, `BB-I13-sql-4-bo-ve`, `BB-I13-js-1-bo-ve`, `BB-I13-js-2-bo-ve`, `BB-I13-js-3-bo-ve`, `BB-I13-js-4-bo-ve`, `BB-I13-sql-1-duong`, `BB-I13-js-1-duong`, `BB-I13-js-1-am`, `BB-I14-sql-1-bo-ve`, `BB-I14-sql-2-bo-ve`, `BB-I14-sql-3-bo-ve`, `BB-I14-sql-4-bo-ve`, `BB-I14-js-1-bo-ve`, `BB-I14-js-2-bo-ve`, `BB-I14-js-3-bo-ve`, `BB-I14-js-4-bo-ve`, `BB-I14-js-5-bo-ve`, `BB-I14-js-6-bo-ve`, `BB-I14-js-7-bo-ve`, `BB-I14-sql-5-bo-ve`, `BB-I14-sql-6-bo-ve`, `BB-I14-sql-7-bo-ve`, `BB-I14-sql-8-bo-ve`, `BB-I14-sql-9-bo-ve`, `BB-I14-sql-1-am`, `BB-I14-js-1-duong`, `BB-I14-js-1-am`, `BB-I15-sql-1-bo-ve`, `BB-I15-sql-2-bo-ve`, `BB-I15-sql-3-bo-ve`, `BB-I15-sql-4-bo-ve`, `BB-I15-sql-5-bo-ve`, `BB-I15-sql-6-bo-ve`, `BB-I15-sql-7-bo-ve`, `BB-I15-js-1-duong`, `BB-I15-js-1-am`, `BB-I16-sql-2-bo-ve`, `BB-I16-sql-3-bo-ve`, `BB-I16-js-1-bo-ve`, `BB-I16-js-2-bo-ve`, `BB-I16-js-1-duong`, `BB-I16-js-1-am`, `BB-I16-js-2-am`, `BB-I17-js-1-bo-ve`, `BB-I17-js-2-bo-ve`, `BB-I17-js-3-bo-ve`, `BB-I17-js-4-bo-ve`, `BB-I17-js-1-duong`, `BB-I17-js-1-am`, `BB-I18-sql-1-bo-ve`, `BB-I18-sql-2-bo-ve`, `BB-I18-sql-3-bo-ve`, `BB-I18-sql-4-bo-ve`, `BB-I18-sql-5-bo-ve`, `BB-I18-sql-6-bo-ve`, `BB-I18-sql-7-bo-ve`, `BB-I18-sql-8-bo-ve`, `BB-I18-sql-9-bo-ve`, `BB-I18-sql-11-bo-ve`, `BB-I18-js-1-bo-ve`, `BB-I18-js-2-bo-ve`, `BB-I18-js-1-am`, `BB-I18-js-2-duong`, `BB-I18-js-2-am`, `BB-I19-sql-1-bo-ve`, `BB-I19-sql-2-bo-ve`, `D2-da-biet`, `D2-vo-hai`

## P26b (59) — qua lớp bọc
`python3 viec/AUDIT-3/boc.py P26b -j 4 (172 s)`

Tổng 59 · BẮT 48 · HỎNG 9 · LẠC 1 · SỐNG 1

| tên | nhãn | đầu ra (rút gọn) | vì sao / so AUDIT-2 |
|---|---|---|---|
| `me-huy-hoan-gap-doi` | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: P26c `VS-me-hoan-gap-doi-huy` → GOI-2 (BẮT, mục GOI-2) |
| `me-xoa-hoan-gap-doi` | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: P26c `VS-me-hoan-gap-doi-xoa` → GOI-2 (BẮT) |
| `Q9-bo-hoan-me` | HỎNG | routes/refunds.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: P26c `BV-Q9-bo-hoan-me` (BẮT) |
| `Q9-hoan-me-vao-vi-con` | HỎNG | routes/refunds.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: P26c `VS-Q9-hoan-me-vao-vi-con` (BẮT) |
| `Q9-hoan-me-ngoai-tx` | HỎNG | routes/refunds.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: P26c `VS-Q9-hoan-me-ngoai-tx` (HỎNG-sập — xem mục P26c) |
| `Q9-hoan-me-khong-qua-cong-don` | HỎNG | routes/refunds.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: P26c `VS-Q9-hoan-me-khong-qua-cong-don` (BẮT) |
| `duyet-cong-don-khong-kiem-changes` | HỎNG | routes/refunds.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: P26c `BV-duyet-cong-don-khong-kiem-changes` (BẮT) |
| `hong-bo-tran` | HỎNG | routes/damages.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: P26c `BV-hong-bo-tran` (BẮT) |
| `hong-tran-theo-man-hinh` | SỐNG | thoát 0, KHÔNG thấy /✗ C1b/ ·   66 đạt · 0 hỏng | SỐNG vô hại: `dong.gia` nay chỉ cho thống kê (P26c Q2), đột biến không còn đụng trần — đã thay bằng P26c `VS-hong-tran-theo-man-hinh` (BẮT); AUDIT-2 ghi 'bị bắt' trong nhóm B3 không gồm tên này |
| `hong-lay-dong-dau` | LẠC | thoát 1, KHÔNG thấy /✗ C6a/ ·   65 đạt · 1 hỏng | LẠC: thu_P26b 65/1 nhưng không phải C6a (câu `dong` nay chỉ thống kê) — đã thay bằng P26c `VS-B1-tran-theo-dong-dau` (BẮT C6a) |
| `hong-bo-tran-cong-don` | HỎNG | routes/damages.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: P26c `BV-hong-bo-tran-cong-don` (BẮT) |

BẮT: `huy-bo-cong`, `huy-khong-kiem-changes`, `huy-kiem-ngoai-tx`, `huy-bo-tu-choi-yeu-cau`, `huy-tu-choi-ngoai-tx`, `xoa-hoan-bat-ke-trang-thai`, `xoa-doc-don-ngoai-tx`, `tao-don-chi-kiem-ngoai-tx`, `me-tao-don-khong-tru`, `me-bo-khongAm`, `yc-bo-kiem-trung`, `yc-kiem-trung-ngoai-tx`, `duyet-bo-chiem-yeu-cau`, `duyet-khong-kiem-changes`, `duyet-bo-cong-don`, `tu-choi-bo-dieu-kien`, `tu-choi-khong-kiem-changes`, `Q8-bo-chan-goi`, `Q8-chi-chan-luc-tao`, `nap-ghi-tuyet-doi-tu-so-ngoai-tx`, `nap-so-truoc-doc-ngoai-tx`, `ghiVi-bo-khongAm`, `tru-tay-chi-kiem-ngoai-tx`, `dieu-chinh-bo-khongAm`, `doi-soat-bo-tx`, `doi-soat-doc-tong-ngoai-tx`, `hong-bo-cong-don-so-luong`, `hong-cong-don-ngoai-tx`, `hong-bo-chan-don-huy`, `hong-quen-refunded`, `hong-log-ngoai-tx`, `hong-bo-order-id-so`, `huy-catch-doc-order-code`, `xoa-catch-doc-order-code`, `packages-buy-dung-lai`, `I1-nhanh-refunded-false`, `K1-bo-409-tạo-đơn`, `K1-bo-409-huỷ-đơn`, `K1-bo-409-xoá-đơn`, `K1-bo-409-tạo-yêu-cầu-hoàn`, `K1-bo-409-duyệt-hoàn`, `K1-bo-409-từ-chối-hoàn`, `K1-bo-409-nạp-ví`, `K1-bo-409-trừ-tay`, `K1-bo-409-điều-chỉnh`, `K1-bo-409-đối-soát`, `K1-bo-409-đối-soát-toàn-bộ`, `K1-bo-409-báo-hỏng`

## P26c (93) — qua lớp bọc
`python3 viec/AUDIT-3/boc.py P26c -j 4 (426 s)`

Tổng 93 · BẮT 88 · HỎNG 4 · HỎNG-sập 1

| tên | nhãn | đầu ra (rút gọn) | vì sao / so AUDIT-2 |
|---|---|---|---|
| `VS-H2-khong-ghi-hoan-goi` | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: GOI-2 cùng tên (BẮT) |
| `VS-H2-hoan-goi-giam-total-spent` | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: GOI-2 cùng tên (BẮT) |
| `VS-me-hoan-gap-doi-huy` | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: GOI-2 cùng tên (BẮT) |
| `VS-me-hoan-gap-doi-xoa` | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: GOI-2 cùng tên (BẮT) |
| `VS-Q9-hoan-me-ngoai-tx` | HỎNG-sập | Bài thử sập · thoát 2 | **AU3-6** HỎNG-sập: ✗ M5 đỏ đúng ca (HTTP 500 'run() ngoài giao dịch') RỒI bài sập (ca sau phụ thuộc) → bộ P26c cũ đếm 'bị bắt' (SO-LUONG-1 ghi 89/93), theo định nghĩa AUDIT-3 là HỎNG; NHẸ-công cụ: thu_P26b nên không sập sau M5 |

BẮT: `BV-B3-bo-chan-hoan-kho`, `VS-B3-chan-ca-don-da-hoan`, `BV-B4-bo-chan-chua-thu`, `VS-B4-chan-theo-cach-tra-no`, `BV-B2-bo-chan-so-0`, `VS-B2-chi-chan-so-am`, `BV-B2-bo-chan-so-0-thu-P26b`, `BV-B1-tran-gia-goc`, `VS-B1-tran-theo-dong-dau`, `VS-B1-chia-bo-giam-don`, `BV-Q4-hoan-tron`, `VS-Q4-luot-con-lai-dao`, `VS-H2-chi-phan-vi`, `VS-H2-me-khong-nhan-truoc`, `VS-H2-mot-dong-hoan-goi`, `BV-B1f-bo-chan-tren`, `VS-B1f-chia-deu`, `BV-A7-bo-chan-post`, `BV-A7-bo-chan-put`, `VS-A7-chan-ca-bat-tat`, `VS-A7-cho-luot-0`, `BV-A7c-man-hinh`, `BV-B1-den-dong-goi`, `VS-A3-chan-ca-gia-han`, `VS-D1-marker-suong`, `VS-D1-dao-nhanh-percent`, `VS-A7c-khong-return`, `BV-H4-bo-tru-den`, `VS-H4-chi-tru-o-don-goi`, `BV-Q4-bo-quyen`, `VS-Q4-quyen-cancel_order`, `VS-Q4-chan-ca-don-lay-tu-goi`, `BV-Q4-quyen-chi-kho-moi`, `VS-Q4-quyen-de-quyen-da-chinh`, `BV-A1-xoa-bo-cong-trang-thai`, `VS-A1-chan-ca-don-da-hoan`, `BV-A2-bo-tran`, `VS-A2-bo-kiem-changes`, `BV-A2-lay-ngay-bo-tran`, `VS-A2-lay-ngay-so-man-hinh`, `BV-A3-bo-chan`, `VS-A3-so-nham-ma-goi`, `BV-A4-deliver-song-lai`, `BV-A6-so-man-hinh`, `VS-A6-chi-sua-ten-dong`, `BV-A6-o-nhap-so-luot`, `BV-C1-cong-cancelled`, `VS-C1-chi-sua-cong-update`, `BV-C2-bo-xoa-ma-bill`, `VS-C2-xoa-huy-no-out`, `BV-C2-xoa-khong-gui-in`, `VS-C2-xoa-ca-ma-da-dung`, `BV-C3-bo-cot-con`, `VS-C3-dau-soCot`, `VS-C3-dau-soCot-gia-lap`, `BV-C4-bo-tong-hoan`, `BV-C5-bo-go-the`, `BV-D1-bo-gui-max`, `BV-D2-bo-tra-luot-huy`, `BV-D2-bo-tra-luot-xoa`, `BV-D2-bo-tra-luot-duyet`, `VS-D2-tra-ca-don-cu`, `VS-D2-khong-tra-voucher`, `BV-D3-luu-ma-go`, `BV-D4-bo-voucher-used`, `BV-D5-co-kim-cuong`, `BV-Q9-bo-hoan-me`, `VS-Q9-hoan-me-vao-vi-con`, `VS-Q9-hoan-me-khong-qua-cong-don`, `BV-duyet-cong-don-khong-kiem-changes`, `BV-hong-bo-tran`, `BV-hong-bo-tran-cong-don`, `VS-hong-tran-theo-man-hinh`, `VS-kb-hai-luot`, `VS-luot-trung-thieu`, `BV-cha-kiem-mot-lan`, `VS-luot-thieu-bat-bien`, `BV-G3-da-biet-thu-no`, `VS-q9-me-lon-hon-bang-0`, `BV-I18-bo`, `VS-I18-chi-so-nap`, `BV-I19-bo`, `VS-I19-bo-qua-no`, `VS-I11-bo-moi-dong-hoan`, `BV-I11-tinh-ca-hoan-goi`, `VS-I2-tinh-ca-ma-da-dung`, `VS-I13-dem-moi-trang-thai`, `VS-I7-nhan-moi-van-tay-la`

## GOI-1 (49) — qua lớp bọc
`python3 viec/AUDIT-3/boc.py GOI-1 -j 4 (43 s)`

Tổng 49 · BẮT 40 · HỎNG 9

| tên | nhãn | đầu ra (rút gọn) | vì sao / so AUDIT-2 |
|---|---|---|---|
| `BV-GOI1-SL-AM` | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: SO-LUONG-1 `BV-SOLUONG1-MON-THU-GOI1` (BẮT) |
| `VS-GOI1-SL-AM-CHI-0` | HỎNG | routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: SO-LUONG-1 `VS-SOLUONG1-MON-CHI-0-THU-GOI1` (BẮT) |
| `VS-GOI1-DUNG-QUYEN` | HỎNG | routes/packages.js: chuỗi gốc khớp 2 lần, cần 1 — đột biến không áp được | đã thay: GOI-2 `VS-GOI2-KET-THUC-QUYEN` (BẮT) |
| `VS-GOI1-DUNG-DUA` | HỎNG | routes/packages.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: GOI-2 `BV-GOI2-CONG` (BẮT) |
| `VS-GOI1-LOC-GOI` | HỎNG | src/pages/Reports.jsx: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: GOI-2 `BV-GOI2-LOC-GOI` (BẮT) |
| `BV-GOI1-TIM-TEN` | HỎNG | src/pages/Reports.jsx: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: GOI-2 `BV-GOI2-TIM-TEN` (BẮT) |
| `BV-GOI1-DANG-GIAO` | HỎNG | src/pages/Reports.jsx: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: GOI-2 `VS-GOI2-LOC-MAC-DINH` (BẮT) |
| `VS-GOI1-SAP-CHUA-LAY` | HỎNG | src/pages/Reports.jsx: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: GOI-2 `VS-GOI2-MOC-CHI-NGAY-MUA` (BẮT) |
| `BV-GOI1-NUT-LYDO` | HỎNG | src/pages/Reports.jsx: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được | đã thay: GOI-2 `VS-GOI2-HOP-KHONG-LY-DO` (BẮT) |

BẮT: `BV-GOI1-TONG`, `VS-GOI1-TONG-GUI`, `BV-GOI1-TONG-PUT`, `BV-GOI1-SL`, `VS-GOI1-SL-CHI-AM`, `BV-GOI1-GIA`, `VS-GOI1-GIA-AM`, `BV-GOI1-GIA-PUT`, `BV-GOI1-LOAI`, `VS-GOI1-LOAI-SO-SAI`, `VS-GOI1-LOAI-TRUOC-TX`, `VS-GOI1-SL-GHI-GOC`, `BV-GOI1-MUA-LOAI`, `VS-GOI1-MUA-NHAN-GOI`, `VS-GOI1-DEM-HUY`, `VS-GOI1-DEM-NULL`, `BV-GOI1-DEM`, `BV-GOI1-TEN`, `VS-GOI1-TEN-DON`, `VS-GOI1-LAN-LAY-HUY`, `BV-GOI1-LS`, `BV-GOI1-LYDO`, `VS-GOI1-LYDO-KHONG-TRIM`, `BV-GOI1-DUNG-CHANGES`, `VS-GOI1-O-TONG`, `BV-GOI1-TU-TINH`, `BV-GOI1-SL-MAN`, `VS-GOI1-LOC-AM-THAM`, `BV-GOI1-GIA-MAN`, `BV-GOI1-LINK`, `BV-GOI1-URL`, `BV-GOI1-DO`, `VS-GOI1-KH-CHU-THICH`, `VS-GOI1-KH-CHU-THICH-CUOI`, `VS-GOI1-O-TONG-CHUOI`, `VS-GOI1-O-TONG-CHU-THICH`, `VS-GOI1-O-TONG-CUOI-DONG`, `BV-GOI1-KH-MOT-LAN`, `BV-GOI1-KH-URL`, `VS-GOI1-NUT-QUYEN`

## GOI-2 (59) — qua lớp bọc
`python3 viec/AUDIT-3/boc.py GOI-2 -j 4 (63 s)`

Tổng 59 · BẮT 59

BẮT: `BV-GOI2-GOM`, `VS-GOI2-CON-LAI-GOM-KET-THUC`, `VS-GOI2-LAU-GE`, `BV-GOI2-LAU`, `VS-GOI2-MOC-CHI-NGAY-MUA`, `VS-GOI2-LOC-XONG-CHI-KHACH-HET`, `BV-GOI2-LOC`, `BV-GOI2-LOC-GOI`, `BV-GOI2-LOC-PHONE`, `BV-GOI2-ORDER-CODE`, `BV-GOI2-NAN`, `VS-GOI2-NAN-GT`, `BV-GOI2-CONG-DU`, `BV-GOI2-HOAN`, `VS-GOI2-HOAN-GIA-NIEM-YET`, `VS-GOI2-HOAN-KHONG-CHIA-SO-GOI`, `BV-GOI2-ME`, `VS-GOI2-ME-KHONG-TRU-DA-HOAN`, `VS-GOI2-VI-KHONG-TRU-DA-HOAN`, `VS-GOI2-VI-TRUOC-ME`, `BV-GOI2-NO`, `BV-GOI2-DON-MUA`, `BV-GOI2-409`, `VS-GOI2-TIN-SO-TIEN-CLIENT`, `VS-GOI2-DU-KIEN-KHONG-QUYEN`, `VS-GOI2-KET-THUC-QUYEN`, `BV-GOI2-CONG`, `BV-GOI2-CONG-CHANGES`, `VS-GOI2-TIEN-MAT-GIAM-TOTAL-SPENT`, `VS-GOI2-NOTES-KHONG-SO`, `VS-GOI2-GHI-CHU-KHONG-MA-GOI`, `BV-GOI2-CHAN-HUY`, `VS-GOI2-CHAN-QUEN-XOA`, `VS-GOI2-CHAN-MOI-GOI`, `VS-GOI2-CHAN-XOA-MOI-TRANG-THAI`, `BV-GOI2-TRA-TUI-HUY`, `BV-GOI2-TRA-TUI-XOA`, `VS-GOI2-TRA-TUI-CHI-ACTIVE`, `VS-H2-khong-ghi-hoan-goi`, `VS-H2-hoan-goi-giam-total-spent`, `VS-me-hoan-gap-doi-huy`, `VS-me-hoan-gap-doi-xoa`, `BV-GOI2-URL-PHONE`, `BV-GOI2-LOC-THEM-TAT-CA`, `VS-GOI2-LOC-MAC-DINH`, `BV-GOI2-TIM-TEN`, `VS-GOI2-TRANG-THAI-CU`, `VS-GOI2-NUT-KHONG-QUYEN`, `VS-GOI2-NUT-GOI-DU`, `VS-GOI2-HOP-KHONG-BAT-CHON`, `VS-GOI2-HOP-KHONG-LY-DO`, `BV-GOI2-SO-TIEN-KHONG-GUI`, `BV-GOI2-LOI-KHONG-HIEN`, `BV-GOI2-LINK-DON-MUA`, `BV-GOI2-LINK-TEN-GOI`, `BV-GOI2-KH-DONG-GOI`, `VS-GOI2-KH-HIEN-CA-0-GOI`, `BV-GOI2-ORDERS-KHONG-DOC-CODE`, `VS-GOI2-ORDERS-KHONG-DOC-NGAY`

## SO-LUONG-1 (17)
`python3 viec/SO-LUONG-1/dot_bien.py (26 s)`

Tổng 17 · BẮT 17

BẮT: `VS-SOLUONG1-BO-NGUYEN`, `BV-SOLUONG1-MON`, `VS-SOLUONG1-MON-CHI-TU-GOI`, `VS-SOLUONG1-MON-MOT-MA`, `VS-SOLUONG1-MON-SO-THO`, `BV-SOLUONG1-MON-THU-GOI1`, `VS-SOLUONG1-MON-CHI-0-THU-GOI1`, `BV-SOLUONG1-GOI`, `VS-SOLUONG1-GOI-HOAC-1`, `VS-SOLUONG1-GOI-LAM-TRON`, `VS-SOLUONG1-GOI-THIEU-0`, `VS-SOLUONG1-GOI-CHI-1`, `BV-SOLUONG1-GOI-THIEU`, `VS-SOLUONG1-GOI-THIEU-CHI-MA`, `VS-SOLUONG1-GOI-THIEU-SIET`, `VS-SOLUONG1-GOI-THIEU-SDT-THO`, `VS-SOLUONG1-THE-SDT-THO`

## LUOI-1 (78 trên HEAD; 2 GOC-* CHƯA KIỂM — kho nông)
`python3 viec/AUDIT-3/boc.py --luoi1 -j 4 (88 s)`

Tổng 78 · BẮT 78

BẮT: `BV-A1-tre-khong-bat-lai`, `VS-A1-tre-chi-bat-kb-dau`, `BV-B4-sx-khong-tu-tat`, `VS-B4-sx-mac-dinh-bat`, `VS-B4-bat-khong-ghi-kb`, `BV-B4-kb-khong-gan`, `VS-SRV-doi-ck-giu-tien-mat`, `VS-SRV-bo-khoa-dangChay`, `VS-B4-loi-van-nhan`, `VS-I7-tong-chi-tren`, `VS-I7-tong-chi-duoi`, `BV-I7-b-no-da-xong`, `BV-I7-c-loi-phai-co-no`, `VS-I7-c-no-chi-duoi`, `BV-I7-d-no-phai-co-loi`, `BV-I7-no-khong-van-tay`, `BV-I7-e-kb-bat`, `VS-I8-diem-chi-tren`, `VS-I8-diem-chi-duoi`, `VS-I8-qua-chi-duoi`, `VS-I8-qua-chi-tren`, `BV-I8-loai-null`, `BV-I8-loai-la`, `BV-I12-loai-dong`, `BV-I12-sdt`, `VS-I12-diem-chi-tren`, `VS-I12-diem-chi-duoi`, `BV-I12-loai-ma`, `VS-I12-tri-gia-chi-tren`, `VS-I12-tri-gia-chi-duoi`, `BV-I12-tran`, `VS-I12-tran-chi-duoi`, `VS-I12-tran-chi-tren`, `VS-I12-tran-lech-1000`, `BV-I12-so-ma`, `VS-I12-dung-chi-duoi`, `VS-I12-dung-chi-tren`, `VS-I13-dung-chi-tren`, `VS-I13-dung-chi-duoi`, `VS-I13-gioi-han-cong-1`, `BV-I13-bo-gioi-han-0`, `BV-I13-so-tay`, `BV-I13-bo-loai`, `BV-I13-bo-tri-gia`, `VS-I14-vuot-tong-cong-1`, `VS-I14-giao-chi-tren`, `VS-I14-giao-chi-duoi`, `BV-I14-so-tay`, `BV-I14-tinh-ca-don-huy`, `BV-I14-tinh-ca-mon-co-gia`, `BV-I14-goi-don-huy`, `BV-I14-goi-don-xoa`, `BV-I14-tro-goi`, `BV-I14-bo-product-id`, `BV-I14-tro-bo-not-null`, `BV-I14-mua-bo-co-goi`, `BV-I14-mua-bo-lay-ngay`, `BV-I14-mua-lay-ngay`, `VS-I15-the-chi-tren`, `VS-I15-the-chi-duoi`, `BV-I15-tinh-ca-don-huy`, `BV-I15-bo-sdt`, `BV-I15-bo-mon-the`, `BV-I15-sdt-rong`, `BV-I15-mua-don-huy`, `BV-I15-mua-don-xoa`, `VS-I16-tien-chi-tren`, `VS-I16-tien-chi-duoi`, `VS-I16-luon-cot-ck`, `BV-I16-nhanh-ck`, `VS-I16-luon-cot-tm`, `BV-I16-cot-kia`, `BV-I16-dong-cuoi`, `BV-I17-bo-approved`, `BV-I17-loai-dong`, `BV-I17-don`, `BV-I17-sdt`, `VS-I17-tien-lech-1`

## TACH-GL (29)
`python3 viec/TACH-GL/dot_bien.py (753 s)`

Tổng 29 · BẮT 25 · HỎNG 3 · LẠC 1

| tên | nhãn | đầu ra (rút gọn) | vì sao / so AUDIT-2 |
|---|---|---|---|
| `VS-kb-hai-luot` | HỎNG | cong_cu/gia_lap/kich_ban.js: chuỗi gốc khớp 0 lần, cần 1 | đã thay: P26c cùng tên (BẮT) — LUOI-2 đã ghi |
| `VS-luot-trung-thieu` | HỎNG | cong_cu/gia_lap/kich_ban.js: chuỗi gốc khớp 0 lần, cần 1 | đã thay: P26c cùng tên (BẮT) |
| `BV-cha-kiem-mot-lan` | HỎNG | cong_cu/gia_lap/kich_ban.js: chuỗi gốc khớp 0 lần, cần 1 | đã thay: P26c cùng tên (BẮT) |
| `VS-luot-thieu-bat-bien` | LẠC | ✗ chia lượt → số bất biến các lượt khác nhau: 18, 8 · thiếu mẫu: ✗ thoát 0, dòng tổng đúng .* — thoát 1 · Giả lập: 29 kị | LẠC-mẫu (mẫu cũ '29 kịch bản · 16 bất biến', nay 32 · 18): dòng lệch 'số bất biến các lượt khác nhau: 18, 8' CÓ in — đã thay: P26c cùng tên (BẮT); LUOI-2 đã ghi |

BẮT: `BV-cha-bo-luot`, `VS-cha-nuot-ma-thoat`, `VS-cha-in-lai-tong-con`, `BV-cha-khong-dung-con-SIGTERM`, `BV-cha-khong-dung-con-khi-sap`, `BV-con-khong-theo-doi-cha`, `BV-cha-khong-don-kho`, `BV-kho-khong-kiem`, `BV-den-kb-0-luot-rong`, `VS-con-giau-dong-lech`, `BV-kho-bo-ve-thu-muc-tam`, `BV-kho-bo-ve-ten`, `BV-cha-nhan-kho`, `BV-luot-khong-kiem`, `VS-che-do-theo-gia-tri`, `BV-luot-vuot-khong-kiem`, `BV-kich-ban-hong-van-tho`, `VS-luot-tuan-tu`, `VS-dong-lech-so-trong-luot`, `VS-SRV-qua-viet-cung-fixed`, `VS-SRV-qua-bo-tran`, `BV-SRV-ban-bo-ap-tran`, `VS-SRV-tran-doi-nguong-tren`, `VS-SRV-tran-doi-nguong-duoi`, `VS-SRV-tran-luon-ap`

