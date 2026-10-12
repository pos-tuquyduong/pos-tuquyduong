# AUDIT-2 A1 — chạy lại ĐỦ đột biến cũ trên HEAD (12.10.2026)

Code chạy thật = `4d175bc` (việc không đổi code; `git log b9759cf..HEAD -- server/` rỗng ⇒ 86 tên C2F sinh lại theo vị trí KHÔNG trượt so
với lần đo AUDIT-1 / LUOI-1). Lần trước: G3/A3/B1/C2/D1 = `viec/HOC-2b/trang_thai.md` D5 + (3); C2F = `viec/LUOI-1/trang_thai.md`
C1/C2 (10.10); HOC-1 / HOC-2 = chỉ kiểm neo ở HOC-2b D5 (3) → LẦN ĐẦU chạy thật trên tu-chay 1.5.0.

## AUDIT-1 — 174 đột biến

`python3 viec/AUDIT-1/dot_bien.py G3 A3 B1 C2 D1 C2F -j 3` → 1992 s · "✓ kho thật không đổi" · `git status` sạch, 0 thư mục tạm sót.

| nhóm | BẮT | SỐNG | HỎNG | LẠC | TREO | so lần trước |
|---|---|---|---|---|---|---|
| G3 | 1 | 1 | 1 | 1 | 0 | giống (cố ý mỗi loại 1) |
| A3 | 16 | 0 | 0 | 0 | 0 | giống (16/16 BẮT gốc 07.10) |
| B1 | 8 | 0 | 0 | 0 | 0 | giống (8/8) |
| C2 | 3 | 0 | 0 | 0 | 0 | giống LUOI-1 (C2-loyalty-redeem-tru-0 SỐNG 07.10 → BẮT 10.10) |
| C2F | 62 | 23 | 0 | 1 | 0 | giống LUOI-1 10.10 (62 / 23 / LẠC 1) |
| D1 | 55 | 0 | 0 | 2 | 0 | giống HOC-2b D5 (55 + LẠC `!D1-E11-P20`, `!D1-E11-P26a`) |

Không tên nào đổi kết quả so với lần trước. Từng tên ("=" là giống lần trước):

| tên | nhóm | lần này | lần trước | dòng bằng chứng (rút gọn) |
|---|---|---|---|---|
| `G3-sai-chuoi` | G3 | HỎNG | = | server/routes/orders.js: chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được |
| `G3-da-biet` | G3 | BẮT | = | [cong_cu/gia_lap/chay.js --den-kb 10] ✗ KB10 → I6: đơn ORD-20261012-003: đã ghi 50.000đ ≠ tổng 25.000đ, lệch 2 |
| `G3-vo-hai` | G3 | SỐNG | = | mọi lệnh thoát 0 |
| `G3-sap` | G3 | LẠC | = | [cong_cu/gia_lap/chay.js --den-kb 1 thoát 2] Giả lập: SẬP — server/routes/orders.js:823 ·       }}}{{{ ·       |
| `A3-GITADD-bo-A` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Bash "git add -A": mong CHAN:GIT-ADD, ra CHO |
| `A3-GITCOMMIT-bo-a` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Bash "git commit -am x": mong CHAN:GIT-COMMIT-CO, ra CHO |
| `A3-GITPUSH-moi-nhanh` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Monitor lách push main: mong CHAN:GIT-PUSH, ra CHO |
| `A3-SED-i-ngan` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Bash "sed -i 's/a/b/' server/a.js": mong CHAN:SED-I, ra CHO |
| `A3-RM-bo-realpath` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Bash "rm -r /tmp/audit1_12ddqndq/db_msw4km_4/tmp/thu_gac_0Gf7FW/nhap/linkdir/" |
| `A3-CURL-moi-host` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Bash "curl https://pos-tuquyduong.io.vn/api": mong CHAN:CURL-HOST, ra CHO |
| `A3-LN-dao-s` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Bash "ln -s .claude /tmp/audit1_12ddqndq/db_zkukebxb/tmp/thu_gac_pf5NGo/nhap/l |
| `A3-G1CAM-theoten` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Edit server/.env: mong CHAN:G1-CAM, ra CHAN:G5-NGOAIPV |
| `A3-FINDCAM-bo-delete` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Bash "find . -delete": mong CHAN:FIND-CAM, ra CHO |
| `A3-NPM-them-install` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Bash "npm install lodash": mong CHAN:NPM-LENH, ra CHO |
| `A3-MKDIR-bo-khung` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Bash "mkdir .claude/moi": mong CHAN:MKDIR-DICH, ra CHO |
| `A3-TARX-moi-dich` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Bash "tar -xf /tmp/audit1_12ddqndq/db_zkg6vnhd/tmp/thu_gac_g3xB3Q/nhap/a.tar": |
| `A3-FILEC-bo-ngan` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Bash "file -C -m x.mgc": mong CHAN:FILE-C, ra CHO |
| `A3-BGAN-bo-PATH` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Bash "PATH=/tmp ls": mong CHAN:B-GAN, ra CHO |
| `A3-CCLA-them-la` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca khoá tập CONG_CU_DOC: đúng 19 tên cố định — Agent,AskUserQuestion,Bash2,EnterP |
| `A3-GHIDUOC-bo-khung` | A3 | BẮT | = | [tu_chay/thu_nguoi_gac.js] ✗ ca Edit .claude/settings.json: mong CHAN:G1-KHUNG, ra CHAN:G5-NGOAIPV |
| `B1-A11-dao-goc` | B1 | BẮT | = | [tu_chay/thu_cong.js] ✗ A11 bài thử mới XANH trên gốc: lý do có "XANH trên code gốc" — ✗ [A16] viec/X/bang_chu |
| `B1-A11-bo-xanh-PR` | B1 | BẮT | = | [tu_chay/thu_cong.js] ✗ A11 bài thử mới luôn đỏ (đỏ cả trên code PR): lý do có "ĐỎ trên code PR" — ✗ [A16] bài |
| `B1-A6-bo-phamvi` | B1 | BẮT | = | [tu_chay/thu_cong.js] ✗ A6 file ngoài phạm vi: phải ĐỎ — ✓ CỔNG TĨNH ĐẠT |
| `B1-A10-bo-filecam` | B1 | BẮT | = | [tu_chay/thu_cong.js] ✗ A10 file cấm TIEN_DO_X.json: phải ĐỎ — ✓ CỔNG TĨNH ĐẠT |
| `B1-A7-noi-tieude` | B1 | BẮT | = | [tu_chay/thu_cong.js] ✗ A7 phiếu đổi ở commit thường: phải ĐỎ — ✓ CỔNG TĨNH ĐẠT |
| `B1-A12-bo` | B1 | BẮT | = | [tu_chay/thu_cong.js] ✗ A12 đổi code, không bài thử, không miễn: phải ĐỎ — ✓ CỔNG TĨNH ĐẠT |
| `B1-laBaiThu-noi-slash` | B1 | BẮT | = | [tu_chay/thu_cong.js] ✗ A11 bài thử mới XANH trên gốc: lý do có "cong_cu/thu_b.js" — ✗ [A12] đổi code mà không |
| `B1-A14-bo-dang-nhanh` | B1 | BẮT | = | [tu_chay/thu_cong.js] ✗ A14 nhánh không dạng viec/<MÃ>: lý do có "không có dạng viec/<MÃ>" — ✗ [A14] không có  |
| `C2-orders-bo-diem-ban` | C2 | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB2 → I8: đơn ORD-20261012-001: 0 điểm, đúng luật là 5 |
| `C2-sc-bo-diem-ma` | C2 | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB11 → I8: đơn ORD-20261012-005: 0 điểm, đúng luật là 4 |
| `C2-loyalty-redeem-tru-0` | C2 | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB19 → I8: dòng đổi điểm #7 (0920000006): 0 điểm, 1 quà trỏ tới, quà giá 3 điểm |
| `D1-A1-fffd` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ Ký tự hỏng mã U+FFFD = 0 (63 file)  → server/ketNoiKho.js |
| `D1-B1-json-tran` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ api.js không có response.json() trần  → còn response.json() trần — trang HTML 5 |
| `D1-C1-them-fetch` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ fetch trần ngoài api.js ≤ 34  → đếm được 35 — MỌC THÊM. {"client/src/components |
| `D1-E1-unitprice` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ orders.js KHÔNG tính tiền theo item.unit_price  → đang lấy giá từ body request  |
| `D1-E7-paydebt` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ pay-debt chặn thu hai lần (WHERE … debt_amount = ? + kiểm số dòng đổi)  → bấm đ |
| `D1-E8-backup` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ mọi bảng đều được sao lưu (31 bảng)  → thiếu trong BACKUP_TABLES: pos_audit_x |
| `D1-E12-vi-ngoai` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ ví: mọi lệnh ghi pos_wallets trong server/routes/ nằm trong ghiVi hoặc reconcil |
| `D1-K1-env-tho` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ chỉ server/ketNoiKho.js đọc biến kết nối kho thật  → tự đọc biến kết nối: serve |
| `D1-S3-vi-lech` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ giả lập: danh sách trắng ví trong bat_bien.js khớp wallets.js  → bat_bien.js: c |
| `D1-F3-test-thieu` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ npm test trỏ vào file có thật  → script: "node khong_co_file.js" → thiếu khong_ |
| `D1-A2-server-cu-phap` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ Cú pháp server/*.js  → server/ketNoiKho.js |
| `D1-A2c-client-cu-phap` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ Cú pháp client/src/*.jsx  → client/src/main.jsx |
| `D1-B2-login-2-cho` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ api.js chỉ có 1 chỗ đá về /login  → đếm được 2 |
| `D1-B-handleSE` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ api.js có handleSessionExpired()  → đã bị gỡ? |
| `D1-B-co-song-song` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ api.js có cờ chặn request song song  → thiếu cờ → 9 request là 9 lần điều hướng |
| `D1-B-pathname` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ api.js không đá đi khi đang ở sẵn /login  → thiếu chốt này thì sinh vòng lặp tả |
| `D1-B-deadcodes-thieu` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ SESSION_DEAD_CODES đủ 5 mã phiên chết  → thiếu USER_INACTIVE |
| `D1-B-eb-getDerived` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ ErrorBoundary có getDerivedStateFromError  → không phải boundary thật |
| `D1-B-eb-ton-tai` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ ErrorBoundary.jsx tồn tại |
| `D1-B-main-boc` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ main.jsx bọc <App/> bằng ErrorBoundary  → lưới đỡ ngoài cùng đã bị gỡ |
| `D1-B-layout-boc` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ Layout.jsx bọc <Outlet/> bằng ErrorBoundary  → lưới đỡ trong đã bị gỡ |
| `D1-B-key` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ Layout.jsx dùng key={location.pathname}  → thiếu key → vỡ 1 lần là kẹt màn báo  |
| `D1-B-ahref-api` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ Không có <a href="/api/ hay window.open("/api/  → client/src/pages/Settings.jsx |
| `D1-B-pos6-loginTime` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ POS-6 đóng: client KHÔNG giữ bộ đếm phiên riêng  → đếm được 1 chỗ — sinh cửa sổ |
| `D1-D-build-prod` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ client build script ép NODE_ENV=production  → hiện là: "vite build" |
| `D1-E-gia-0` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ orders.js chặn sản phẩm chưa có giá  → mất chốt chặn giá 0 |
| `D1-E2-authz-tho` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ POST /orders có cổng phân quyền  → có marker POS-AUTHZ-v1 nhưng `item.from_pack |
| `D1-E-trangthai-dungma` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ kiemDonCuaMa: hằng TRANG_THAI_DUNG_MA (nếu dùng) đúng completed + paid  → hằng  |
| `D1-E-danhsach-trang` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ kiemDonCuaMa là DANH SÁCH TRẮNG: chỉ trả { don } khi status completed VÀ paymen |
| `D1-E-claim-chiem` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ /claim: chiếm mã bằng UPDATE ... AND claimed_at IS NULL rồi if (!X // X.changes |
| `D1-E-ndiem-chiem` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ /nhan-diem: chiếm mã bằng UPDATE ... AND diem_nhan_luc IS NULL rồi if (!X // X. |
| `D1-E-vi-tuongdoi` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ ví: ghiVi đọc số dư bằng tx.queryOne và cộng tương đối (balance = balance + ?), |
| `D1-E-vi-trang5` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ ví: danh sách trắng LOAI_TINH_VAO_VI đúng 5 loại đã duyệt, không có debt_paymen |
| `D1-K-4ca` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ ketNoiKho.js chạy đúng cả 4 ca môi trường  → ca 1: Replit không dùng file · ca  |
| `D1-K-data` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ .gitignore chặn thư mục data/  → thêm dòng "data/" vào .gitignore |
| `D1-F-attached` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ .gitignore có attached_assets/  → file thả vào chat agent sẽ lọt vào commit |
| `D1-F-dist` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ .gitignore KHÔNG chặn client/dist  → dist bị bỏ khỏi git → Render sẽ serve bản  |
| `D1-E1b-tra-gia` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ orders.js tự tra giá từ pos_products  → không thấy câu tra giá — server có đang |
| `D1-E9-claim-kiem` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ /claim: kiểm đơn của mã (chưa huỷ, đã thanh toán) TRƯỚC lệnh ghi  → khách dùng  |
| `D1-E9-ndiem-kiem` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ /nhan-diem: kiểm đơn của mã (chưa huỷ, đã thanh toán) TRƯỚC lệnh ghi  → khách d |
| `D1-E9-claim-dung` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ /claim: DÙNG kết quả kiemDonCuaMa (if (X.loi) return) TRƯỚC lệnh ghi  → gọi hàm |
| `D1-E9-ndiem-dung` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ /nhan-diem: DÙNG kết quả kiemDonCuaMa (if (X.loi) return) TRƯỚC lệnh ghi  → gọi |
| `D1-E10-doisoat-tx` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ ví: đối soát (reconcileWallet) đọc tổng sổ và ghi trong CÙNG một giao dịch  → b |
| `D1-E10-doisoat-trang` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ ví: đối soát (1 khách + toàn bộ) chỉ đọc dòng thuộc danh sách trắng  → gọi API  |
| `D1-B-deadcodes-service` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ SESSION_DEAD_CODES KHÔNG chứa mã cấu hình service  → có SERVICE_AUTH_NOT_CONFIG |
| `D1-B-pos5-query` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ POS-5 đóng: khoá/token KHÔNG nhận qua query string  → đếm được 1 chỗ — khoá tro |
| `!D1-E11-P20` | D1 | LẠC | = | [kiem_tra_truoc_khi_giao.js thoát 1] ✗ CÓ LỖI — sửa xong rồi commit. Đọc CHECKLIST_CODE.md. |
| `!D1-E11-P21` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ bài chạy thật cong_cu/thu_P21.js xanh (1.6 s)  → ✗ sau đối soát 1 khách: ví vẫn |
| `!D1-E11-P26a` | D1 | LẠC | = | [kiem_tra_truoc_khi_giao.js thoát 1] ✗ CÓ LỖI — sửa xong rồi commit. Đọc CHECKLIST_CODE.md. |
| `!D1-E11-P26b` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ bài chạy thật cong_cu/thu_P26b.js xanh (1.4 s)  → ✗ A1b huỷ đơn ví completed →  |
| `!D1-T1-nguoi-gac` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ bài chạy thật tu_chay/thu_nguoi_gac.js xanh (12.3 s)  → ✗ ca Bash "git add -A": |
| `!D1-T1b-cong-cu` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ bài chạy thật tu_chay/thu_cong_cu.js xanh (6.6 s)  → ✗ F6 xem_thu: có CLAUDECOD |
| `!D1-T1c-cong` | D1 | BẮT | = | [kiem_tra_truoc_khi_giao.js] ✗ bài chạy thật tu_chay/thu_cong.js xanh (100.1 s)  → ✗ A6 file ngoài phạm vi: ph |
| `B1-A8-noi` | D1 | BẮT | = | [tu_chay/thu_cong.js] ✗ A8 xoá cai_dat.js + settings.json gỡ người gác + xoá cong.yml: phải ĐỎ — ✓ CỔNG TĨNH Đ |
| `B1-A9-noi` | D1 | BẮT | = | [tu_chay/thu_cong.js] ✗ A9 keep-alive.yml đổi: phải ĐỎ — ✓ CỔNG TĨNH ĐẠT |
| `B1-A13-bo-daydu` | D1 | BẮT | = | [tu_chay/thu_cong.js] ✗ A13 --day-du đỏ: phải ĐỎ — ✓ CỔNG CHẠY ĐẠT |
| `B1-A15-dao-fork` | D1 | BẮT | = | [tu_chay/thu_cong.js] ✗ A15 cong: PR từ fork → bước đầu thoát ĐỎ; cùng kho → qua — 0/1 |
| `C2F-orders-01-ghiVi-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB15 → I11: đơn #1003, ví 0900000001: hoàn 25.000đ > ví này đã trả 0đ |
| `C2F-orders-02-insert-quay` | C2F | LẠC | = | [cong_cu/gia_lap/chay.js thoát 2] Giả lập: SẬP — Error: không tạo được đơn "nợ mẫu": HTTP 500 SQLITE_CONSTRAIN |
| `C2F-orders-03-update-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB15 → I11: đơn #1003, ví 0900000001: hoàn 25.000đ > ví này đã trả 0đ |
| `C2F-orders-04-insert-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB2 → I7: SX nhận vân tay lạ POS:1001:out:0 × 1 |
| `C2F-orders-05-update-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB19 → I13: mã N84A3U: đã dùng 0/1, đơn đã áp 1 + quầy tăng tay 0 |
| `C2F-orders-06-insert-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB2 → I8: đơn ORD-20261012-001: 0 điểm, đúng luật là 5 |
| `C2F-orders-07-insert-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB24 → HTTP: bán + huỷ lúc SX lỗi → đơn vẫn tạo, huỷ 200, 3 dòng nợ kho chờ đẩy: c |
| `C2F-orders-08-insert-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB21 → HTTP: nạp 200; gói 3 lượt: lấy 2 rồi 1 → 200, 200; lấy thêm → 400 GOI_HET_H |
| `C2F-orders-09-update-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB23 → HTTP: mua gói lấy ngay 1, lấy thêm 1, chủ xoá đơn lấy → 200, 200, gói còn g |
| `C2F-orders-10-update-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB9 → I14: gói #2: đã giao 1, đơn lấy từ gói 0 + quầy giao tay 0 |
| `C2F-orders-11-insert-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB22 → HTTP: mua thẻ → 1 dòng mua thẻ; nhân viên huỷ → 200, ví + giá thẻ, dòng mua |
| `C2F-orders-12-update-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB21 → HTTP: nạp 200; gói 3 lượt: lấy 2 rồi 1 → 200, 200; lấy thêm → 400 GOI_HET_H |
| `C2F-orders-13-update-quay` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-orders-14-insert-quay` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-orders-15-insert-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB5 → HTTP: dùng mã rồi mới huỷ đơn → 200, 200: HTTP 404 · Mã không tồn tại / HTTP |
| `C2F-orders-16-update-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB10 → HTTP: hai lệnh thu chồng nhau → đúng một 200 + một 409 DA_THU_ROI: HTTP 200 |
| `C2F-orders-17-insert-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB4 → I9: đơn ORD-20261012-001: 0 dòng sổ debt_payment, 2 dòng nhật ký 'thu' |
| `C2F-orders-18-update-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB15 → HTTP: hai lệnh huỷ chồng nhau → 200 + 400 DON_KHONG_HUY_DUOC, ví +25.000 đú |
| `C2F-orders-19-ghiVi-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB15 → HTTP: hai lệnh huỷ chồng nhau → 200 + 400 DON_KHONG_HUY_DUOC, ví +25.000 đú |
| `C2F-orders-20-ghiVi-quay` | C2F | BẮT | = | [cong_cu/thu_P26b.js] ✗ M2 huỷ đơn trả ví mẹ → 200, ví mẹ +25.000 đúng một lần (K5)  — HTTP 200 · ví mẹ 100000 |
| `C2F-orders-21-update-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB21 → HTTP: hai nhân viên huỷ đơn mua gói đã giao 2/3 chồng nhau → 200 + 400 DON_ |
| `C2F-orders-22-delete-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB21 → HTTP: gói không còn lượt nào đã giao: huỷ đơn lấy rồi huỷ đơn mua → 200, 20 |
| `C2F-orders-23-update-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB21 → HTTP: gói không còn lượt nào đã giao: huỷ đơn lấy rồi huỷ đơn mua → 200, 20 |
| `C2F-orders-24-delete-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB22 → HTTP: mua thẻ → 1 dòng mua thẻ; nhân viên huỷ → 200, ví + giá thẻ, dòng mua |
| `C2F-orders-25-update-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB21 → HTTP: nhân viên huỷ đơn lấy 1 ly → 200, gói còn giao 2: HTTP 200 · giao 3 |
| `C2F-orders-26-update-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB16 → HTTP: duyệt chồng lên huỷ → huỷ 200, duyệt 400, yêu cầu rejected 'Đơn đã hu |
| `C2F-orders-27-insert-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB24 → HTTP: bán + huỷ lúc SX lỗi → đơn vẫn tạo, huỷ 200, 3 dòng nợ kho chờ đẩy: c |
| `C2F-orders-28-ghiVi-quay` | C2F | BẮT | = | [cong_cu/thu_P26b.js] ✗ A3c xoá đơn ví completed → 200, ví +25.000, đúng 1 dòng hoàn (K5)  — HTTP 200 · ví 425 |
| `C2F-orders-29-ghiVi-quay` | C2F | BẮT | = | [cong_cu/thu_P26b.js] ✗ M3 xoá đơn trả ví mẹ completed → 200, ví mẹ về như trước đơn (K5)  — HTTP 200 · ví mẹ  |
| `C2F-orders-30-update-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB23 → HTTP: chủ xoá đơn mua gói → 200, gói bị xoá, đơn lấy còn lại không trỏ gói: |
| `C2F-orders-31-delete-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB23 → HTTP: chủ xoá đơn mua gói → 200, gói bị xoá, đơn lấy còn lại không trỏ gói: |
| `C2F-orders-32-update-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB23 → HTTP: mua gói lấy ngay 1, lấy thêm 1, chủ xoá đơn lấy → 200, 200, gói còn g |
| `C2F-orders-33-delete-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB14 → HTTP: xoá đơn đã hoàn → 200, ví không đổi: HTTP 200 / HTTP 200 / HTTP 500 · |
| `C2F-orders-34-delete-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB14 → HTTP: xoá đơn đã hoàn → 200, ví không đổi: HTTP 200 / HTTP 200 / HTTP 500 · |
| `C2F-orders-35-delete-quay` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-orders-36-delete-quay` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-orders-37-delete-quay` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-orders-38-delete-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB23 → HTTP: chủ xoá đơn mua gói → 200, gói bị xoá, đơn lấy còn lại không trỏ gói: |
| `C2F-orders-39-insert-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB27 → HTTP: bán lúc SX lỗi, chủ xoá đơn → 200, 2 dòng nợ kho (out lúc bán + in lú |
| `C2F-refunds-01-insert-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB15 → HTTP: hai lệnh tạo yêu cầu chồng nhau → 200 + 400, đúng 1 yêu cầu chờ duyệt |
| `C2F-refunds-02-update-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB16 → HTTP: từ chối chồng lên duyệt → duyệt 200, từ chối 400, yêu cầu vẫn approve |
| `C2F-refunds-03-update-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB14 → HTTP: xoá đơn đã hoàn → 200, ví không đổi: HTTP 200 / HTTP 200 / HTTP 200 · |
| `C2F-refunds-04-ghiVi-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB17 → HTTP: duyệt hoàn 25.000 chồng lên nạp 10.000 → cả hai 200, ví +35000: HTTP  |
| `C2F-refunds-05-update-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB17 → I17: yêu cầu hoàn #2002 (đơn #1007): gắn dòng sổ (không có), hoàn 25000 |
| `C2F-refunds-06-ghiVi-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB17 → HTTP: đơn ví con 5.000 + ví mẹ 20.000 → duyệt hoàn → 200, ví mẹ +20.000, ví |
| `C2F-refunds-07-update-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB16 → HTTP: từ chối chồng lên duyệt → duyệt 200, từ chối 400, yêu cầu vẫn approve |
| `C2F-wallets-01-update-quay` | C2F | BẮT | = | [cong_cu/thu_P21.js] ✗ trước đối soát: ví = 50.000đ (thu nợ không đụng ví)  — null |
| `C2F-wallets-02-insert-quay` | C2F | BẮT | = | [cong_cu/thu_P21.js] ✗ trước đối soát: ví = 50.000đ (thu nợ không đụng ví)  — null |
| `C2F-wallets-03-insert-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB2 → I4: ví 0900000001: số dư 200.000đ ≠ sổ 0đ, lệch 200.000đ |
| `C2F-wallets-04-ghiVi-quay` | C2F | BẮT | = | [cong_cu/thu_P21.js] ✗ trước đối soát: ví = 50.000đ (thu nợ không đụng ví)  — null |
| `C2F-wallets-05-ghiVi-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB17 → HTTP: trừ tay 5.000 chồng lên nạp 10.000 → cả hai 200, ví +5000: HTTP 200 / |
| `C2F-wallets-06-ghiVi-quay` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB17 → HTTP: điều chỉnh +5.000 chồng lên nạp 10.000 → cả hai 200, ví +15000: HTTP  |
| `C2F-wallets-07-update-quay` | C2F | BẮT | = | [cong_cu/thu_P21.js] ✗ ví trôi 99.999đ được kéo về đúng sổ 40.000đ  — ví = 99999 |
| `C2F-wallets-08-insert-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB26 → HTTP: đối soát khách nợ CHƯA có ví → 200, ví được tạo = tổng sổ: có ví trướ |
| `C2F-damages-01-ghiVi-quan-tri` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB17 → HTTP: báo hỏng đền 20.000 chồng lên nạp 10.000 → cả hai 200, ví +30000: HTT |
| `C2F-damages-02-insert-quan-tri` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB18 → HTTP: báo hỏng chồng nhau vượt số lượng → 200, 200, 400 VUOT_SO_LUONG, tổng |
| `C2F-damages-03-update-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-packages-01-insert-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-packages-02-update-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-packages-03-update-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-packages-04-delete-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-packages-05-update-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB26 → HTTP: giao tay 1 ly từ gói còn lượt (/deliver) → 200, gói +1: HTTP 200 · 0  |
| `C2F-packages-06-update-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-signup-codes-01-update-khach-app` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB11 → HTTP: hai người /nhan-diem chồng nhau → 200 + 400 MA_DA_NHAN_DIEM: HTTP 200 |
| `C2F-signup-codes-02-insert-khach-app` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB11 → I8: đơn ORD-20261012-005: 0 điểm, đúng luật là 4 |
| `C2F-signup-codes-03-update-khach-app` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB14 → HTTP: nạp 200; đơn của khách đã claim không sinh mã bill (I2): HTTP 200 · m |
| `C2F-signup-codes-04-insert-khach-app` | C2F | BẮT | = | [cong_cu/thu_P20.js] ✗ đúng 1 voucher trong pos_discount_codes  — có 0 |
| `C2F-signup-codes-05-update-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-signup-codes-06-delete-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-discount-codes-01-insert-quan-tri` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB20 → HTTP: tạo mã 200; hai đơn cùng mã dùng-một-lần chồng nhau → đúng một 200, đ |
| `C2F-discount-codes-02-update-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-discount-codes-03-update-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-discount-codes-04-delete-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-discount-codes-05-update-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB20 → I13: mã KB20TANGTAY: đã dùng 0/5, đơn đã áp 0 + quầy tăng tay 1 |
| `C2F-rewards-01-insert-quan-tri` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB19 → HTTP: tạo quà 200; tích 3 điểm rồi đổi quà 3 điểm → 200, còn 0 điểm: HTTP 2 |
| `C2F-rewards-02-update-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-rewards-03-update-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-loyalty-01-insert-khach-app` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB19 → HTTP: đổi lần hai khi đã hết điểm → 400 (máy chủ không trả code): HTTP 200 |
| `C2F-loyalty-02-insert-khach-app` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB19 → HTTP: mã đổi điểm: validate → 200 hợp lệ; bán 25.000 dùng mã → 200, giảm 5. |
| `C2F-loyalty-03-insert-khach-app` | C2F | BẮT | = | [cong_cu/gia_lap/chay.js] ✗ KB19 → I8: dòng đổi điểm #7 (0920000006): -3 điểm, 0 quà trỏ tới, quà giá 0 điểm |
| `C2F-don-mo-rong-01-update-quay` | C2F | BẮT | = (LUOI-1; SỐNG 07.10) | [cong_cu/gia_lap/chay.js] ✗ KB2 → I16: đơn ORD-20261012-002: nhật ký đổi sang cash 30000, đơn ghi tiền mặt 0 · |
| `C2F-customers-v2-01-insert-khong-ro` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-customers-v2-02-update-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-customers-v2-03-insert-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-customers-v2-04-update-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |
| `C2F-customers-v2-05-insert-quan-tri` | C2F | SỐNG | = | mọi lệnh thoát 0 |

## HOC-1 — 20 đột biến (`python3 viec/HOC-1/dot_bien.py`, tuần tự, 1510 s)

| tên | bài | kết quả | ghi chú |
|---|---|---|---|
| `M0-cong` | thu_cong.js | XANH (đối chứng) |  |
| `M0-gac` | thu_nguoi_gac.js | XANH (đối chứng) |  |
| `M0-cc` | thu_cong_cu.js | XANH (đối chứng) |  |
| `M9 cai_dat bỏ phép kiểm muc_gac` | thu_nguoi_gac.js | ĐỎ đúng chỗ |  |
| `M10 cong.js bỏ throw cấu hình thiếu khoá` | thu_cong.js | ĐỎ đúng chỗ |  |
| `MA1 bỏ miễn (về luật cũ)` | thu_cong.js | ĐỎ đúng chỗ |  |
| `MA3 bỏ điều kiện "có ở mốc"` | thu_cong.js | ĐỎ đúng chỗ | đỏ đúng ca NHƯNG lý do là cổng SẬP ("cổng gặp lỗi bất ngờ … Received null") — theo định nghĩa AUDIT = LẠC-giống → AU2-5 |
| `MA4 miễn bỏ luôn kiểm xanh trên PR` | thu_cong.js | ĐỎ đúng chỗ |  |
| `MA6a bỏ kiểm lý do` | thu_cong.js | ĐỎ đúng chỗ |  |
| `MA6b bỏ kiểm thu_*.js` | thu_cong.js | ĐỎ đúng chỗ |  |
| `MA6c bỏ kiểm "không có trong kho"` | thu_cong.js | ĐỎ đúng chỗ |  |
| `MX bỏ kiểm "bị PR xoá / đổi tên"` | thu_cong.js | ĐỎ đúng chỗ |  |
| `MA7 miễn tính là bài đỏ hợp lệ` | thu_cong.js | ĐỎ đúng chỗ |  |
| `MB cau_hinh bỏ package.json khỏi file_luat` | thu_nguoi_gac.js | ĐỎ đúng chỗ |  |
| `MB4 như MB, đo bằng bài thử cổng` | thu_cong.js | ĐỎ đúng chỗ |  |
| `MC T2 về bản cũ (đọc cả thư mục)` | thu_cong_cu.js | ĐỎ đúng chỗ |  |
| `MC2 T2 lọc bằng Dirent.isFile (bỏ symlink)` | thu_cong_cu.js | ĐỎ đúng chỗ |  |
| `MC3 T2 bỏ try quanh statSync (symlink treo)` | thu_cong_cu.js | ĐỎ đúng chỗ |  |
| `MD bỏ phép (d) bản gốc chạy trên code PR` | thu_cong.js | ĐỎ đúng chỗ |  |
| `MD2 (d) chỉ cho bài xanh trên gốc` | thu_cong.js | ĐỎ đúng chỗ |  |

## HOC-2 — 26 đột biến (`python3 viec/HOC-2/dot_bien.py`, tuần tự, 1906 s)

| tên | bài | kết quả | ghi chú |
|---|---|---|---|
| `M0-cong` | thu_cong.js | XANH (đối chứng) |  |
| `M0-gac` | thu_nguoi_gac.js | XANH (đối chứng) |  |
| `M0-cc` | thu_cong_cu.js | XANH (đối chứng) |  |
| `BV-A16-bo-khoi` | thu_cong.js | ĐỎ đúng chỗ |  |
| `VS-A16-mien-van-ap` | thu_cong.js | ĐỎ đúng chỗ |  |
| `VS-A16-dong-dau` | thu_cong.js | ĐỎ đúng chỗ |  |
| `VS-A16-bo-mau` | thu_cong.js | ĐỎ đúng chỗ |  |
| `VS-A16-chi-bat-lon` | thu_cong.js | ĐỎ đúng chỗ |  |
| `VS-A16-bo-thieu-dong` | thu_cong.js | ĐỎ đúng chỗ |  |
| `BV-A17-bo` | thu_cong.js | ĐỎ đúng chỗ |  |
| `VS-A17-bo-ranh-gioi` | thu_cong.js | ĐỎ đúng chỗ |  |
| `BV-A18-bo` | thu_cong.js | ĐỎ đúng chỗ |  |
| `VS-A18-chua-giua` | thu_cong.js | ĐỎ đúng chỗ |  |
| `VS-A18-chi-server` | thu_cong.js | ĐỎ đúng chỗ |  |
| `VS-A18-bo-xoa` | thu_cong.js | ĐỎ đúng chỗ |  |
| `VS-A18-mien-van-ap` | thu_cong.js | ĐỎ đúng chỗ |  |
| `VS-A2-them-khoa` | thu_cong.js | ĐỎ đúng chỗ |  |
| `VS-A7-bo-P26b` | thu_nguoi_gac.js | ĐỎ đúng chỗ |  |
| `VS-B1-them-la` | thu_nguoi_gac.js | ĐỎ đúng chỗ |  |
| `VS-B2-bo-kiem-kho` | thu_nguoi_gac.js | ĐỎ đúng chỗ |  |
| `VS-B2-bo-kiem-tam` | thu_nguoi_gac.js | ĐỎ đúng chỗ |  |
| `VS-B2-de-thu-muc` | thu_nguoi_gac.js | ĐỎ đúng chỗ |  |
| `VS-B2-cay-lam-viec` | thu_nguoi_gac.js | ĐỎ đúng chỗ |  |
| `VS-E3-phien-ban-cu` | thu_nguoi_gac.js | LỖI (HỎNG) | neo `tu-chay 1.4.0` rữa tất yếu (1.5.0) — TU-CHAY-5 Phát hiện 6; đề xuất đổi neo → AU2-6 |
| `VS-E3-skill-bo-VS` | thu_cong_cu.js | ĐỎ đúng chỗ |  |
| `VS-E3-ra-soat-bo-dem` | thu_cong_cu.js | ĐỎ đúng chỗ |  |

HOC-1: 3 đối chứng XANH + 17/17 ĐỎ đúng chỗ (14 tên chuyển từ HOC-2b + MC, MC2, MC3). HOC-2: 3 đối chứng XANH + 22/23 ĐỎ đúng
chỗ + 1 HỎNG tất yếu. Khác lần trước (chỉ kiểm neo): không — lần đầu chạy thật, mọi đột biến chuyển sang đều BẮT (MA3 xem ghi chú).
