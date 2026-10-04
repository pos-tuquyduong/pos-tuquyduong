# AUDIT-1 — Báo cáo soát lưới an toàn

HEAD `b9759cf` (+ sản phẩm AUDIT-1), đo 04.10.2026. Việc CHỈ ĐỌC + ĐO; không đổi byte nào ngoài `viec/AUDIT-1/`.
Chi tiết từng nhóm: `a_bang_luat.md` (A), `b_bang.md` (B), `c_bang.md` + `c2_day_du.md` (C), `d_bang.md` (D),
`e_bang.md` (E), `f_tai_lieu.md` (F). Bằng chứng chạy: `bang_chung_do.txt`. Công cụ đo: `dot_bien.py`, `lach.js`.

## Kết luận một dòng
C2 ĐỦ (86 câu ghi ở 11 file routes tiền, mỗi câu một đột biến bỏ câu): **40 BẮT · 45 SỐNG · 1 LẠC**. Câu ghi ví/điểm
tích/hoàn/debt LÕI được lưới phủ (BẮT). NHƯNG lưới KHÔNG phủ **17 câu đụng tiền/điểm/gói**, trong đó **3 nhóm NẶNG**:
AU-G1 đổi điểm→voucher (`/loyalty/redeem`: trừ điểm + đẻ mã), AU-G2 voucher dùng khi BÁN không tăng `used_count`
(mã dùng-một-lần dùng lại được), AU-G3 gói & thẻ trả trước (mua gói / lấy hàng từ gói / mua thẻ — và **HUỶ đơn mua-gói
ở route `cancel` quyền quầy: hoàn tiền mà gói/thẻ vẫn còn = rò tiền** — soát vòng 2 bắt — không KB nào chạm).
Các SỐNG-tiền còn lại (ví đối soát tạo-mới, link sổ hoàn, đổi cách trả, /increment-usage) là NHẸ. Ngoài đường tiền:
12 phát hiện NHẸ (đột biến cũ HỎNG, phép chỉ cảnh báo, tài liệu lệch, K5 báo oan). **Không câu ví/điểm-tích LÕI nào SỐNG.**

## Bảng phát hiện

| mã | nhóm | mức | ở HEAD (file:dòng) | lệnh thấy lại | đề xuất khoá cho HOC-2 |
|---|---|---|---|---|---|
| **AU-G1** | **C/G** | **NẶNG** | `loyalty.js:170` (trừ điểm), `:179` (đẻ mã) POST /redeem | `C2F-loyalty-01/02` + `C2-loyalty-redeem-tru-0` → **SỐNG** (`loyalty-03` voucher_grants BẮT qua thu_P26a C8, nhưng điểm-trừ + mệnh-giá-mã KHÔNG kiểm) | KB đổi-thưởng + bất biến: mỗi `pos_voucher_grant` có đúng một `redeem` trừ điểm khớp, `discount_value` = reward; I8 nới soát redeem |
| **AU-G2** | **C/G** | **NẶNG** | `orders.js:895` UPDATE pos_discount_codes used_count (áp voucher khi BÁN) | `C2F-orders-05-update-quay` → **SỐNG** | KB bán có áp voucher dùng-một-lần + bất biến: `used_count ≤ usage_limit`, mã `usage_limit=1` không dùng được lần hai |
| **AU-G3** | **C/G** | **NẶNG** | gói & thẻ trả trước: `orders.js` customer_packages/membership (`C2F-orders-10/11/21/23/25/30/32`); **HUỶ đơn (quyền `cancel_order`, KHÔNG owner): `:1357` DELETE customer_packages (`orders-22`), `:1372` DELETE membership (`orders-24`)**; `packages.js:177` deliver (`C2F-packages-05`) | `python3 … dot_bien.py C2F-orders-21-update-quay C2F-orders-22-delete-quay` → **SỐNG** | KB mua gói → lấy hàng → hết lượt → HUỶ; bất biến: `delivered_qty` ≤ `total_qty`, huỷ đơn mua-gói phải xoá/huỷ gói (không hoàn tiền mà giữ gói) |
| AU-G4 | C | NHẸ-tiền | ví đối soát tạo-mới (`C2F-wallets-08`), link sổ hoàn (`C2F-refunds-05`), đổi cách trả (`C2F-don-mo-rong-01`), /increment-usage (`C2F-discount-codes-05`) | `dot_bien.py C2F` | xem `c2_day_du.md` — mức NHẸ (admin/hiếm, hoặc tổng tiền không đổi) |
| AU-G5 | D | NHẸ | `thu_P20.js` liveness chưa chứng minh (đột biến riêng bị E7 tĩnh chặn → LẠC) | `dot_bien.py !D1-E11-P20` → LẠC | đột biến phá đúng thứ thu_P20 canh (mã bill claim/nhan-diem) mà không phép tĩnh nào trùng |
| AU-A1 | A | NHẸ | `nguoi_gac.js` CONG_CU_DOC `:105-107` | `python3 … dot_bien.py A3-CCLA-them-la` → SỐNG | thêm phép `thu_nguoi_gac` so `CONG_CU_DOC`/`CONG_CU_SUA` với tập cố định (ca đỏ: thêm 1 tên) |
| AU-B1 | B | NHẸ | `cong.js` hai cổng A14 `:82,88` | `python3 … dot_bien.py B1-A14-bo-dang-nhanh` → SỐNG | ca `thu_cong`: phiếu ở `viec/<MÃ xấu>` + nhánh không dạng `viec/<MÃ>` → ĐỎ riêng cổng dạng-nhánh |
| AU-B2 | B | NHẸ | `cau_hinh.json` 8 khoá nhãn | `python3 scratchpad/b2.py` | bỏ khoá-nhãn hoặc ghi chú phân biệt khoá-code/tài-liệu |
| AU-B3 | B | NHẸ | `cong_cu/thu_p1.js:21,32` | đọc code (KHÔNG chạy) | đổi tên `thu_p1.js`→`congcu_p1.js` (thoát `laBaiThu`) hoặc tự từ chối khi `!laMayThu()` |
| AU-B3b | B | NHẸ | `cau_hinh.json` thu_muc_bai_thu | đọc `laBaiThu` + git ls-files | thêm `ban_mau_pos/thu/` vào `thu_muc_bai_thu` (A12 nhận bộ thử bản mẫu) |
| AU-B3c | B | NHẸ | `cau_hinh.json` file_luat | đọc file_luat | thêm `cong_cu/thu_P20/P21/P26a/P26b.js` vào `file_luat` (sửa phải ghi đúng tên) |
| AU-C1 | C | NHẸ | `bat_bien.js` I10⊂I11 `:146-156` | `python3 viec/P26b/dot_bien.py I10-bo` → HỎNG | bỏ I10 (I11 bao trùm) hoặc neo `I10-bo` theo WHERE riêng |
| AU-C3 | C | NHẸ | `kiem_tra…js:746` ghi 22/24s | `python3 scratchpad/c3.py` → 68/70s | cập nhật ghi chú; cân nhắc nâng ngưỡng 110/120s hoặc giảm KB ở pre-commit |
| AU-D1 | D | NHẸ | `kiem_tra…js:636` F2 canhBao | đọc code (F2 không có nhánh fail) | — (hygiene; người gác đã chặn tạo .js gốc ở đường việc) |
| AU-D2 | D | NHẸ | `kiem_tra…js:569,582,594,596` T2–T4 canhBao | đọc code | nâng T2–T4 thành `fail`, hoặc chủ quán xác nhận giữ cảnh báo (cổng A8 đã cứng chặn) |
| AU-E1 | E | NHẸ | `viec/P26b/dot_bien.py` I10-bo | `python3 viec/P26b/dot_bien.py` → 1 HỎNG | như AU-C1 |
| AU-E2 | E | NHẸ | `viec/HOC-1/dot_bien.py` MB,MB4 | `python3 viec/HOC-1/dot_bien.py` → 2 LỖI | neo đột biến theo `"package.json"` (không kèm `]`) |
| AU-E3 | E | NHẸ | `viec/TU-CHAY-4/dot_bien.py:32-63` tai_cho | đọc code | đổi `tai_cho` sang bản sao kho (không đụng file thật) |
| AU-F1 | F | NHẸ | `CLAUDE.md:113` | đọc + `kiem_tra…js:373` (E6) | sửa câu: nhóm E chỉ canh `from_package`, không canh `discount_*` |
| AU-F2 | F | NHẸ | `CLAUDE.md:26` "36 phép" | `node kiem_tra…js` → 61 | bỏ số đếm cứng trong tài liệu |

**SỐNG đụng tiền — ở quầy sẽ sai gì?** (16 câu; đầy đủ ở `c2_day_du.md`). AUDIT chỉ đo LƯỚI, không khẳng định code đang sai.
- **AU-G1 (NẶNG):** `/loyalty/redeem` — `loyalty-03` (voucher_grants) BẮT qua thu_P26a C8, nhưng `loyalty-01` (trừ điểm)
  + `loyalty-02` (đẻ mã) SỐNG. I8 (`bat_bien.js:101`) chỉ soát điểm TÍCH (`WHERE t.order_id=o.id`); redeem `order_id=NULL`
  bị loại. **Ở quầy:** khách đổi quà mà không mất điểm, hoặc mã giảm giá sai mệnh giá.
- **AU-G2 (NẶNG):** `orders.js:895` áp voucher khi BÁN, bỏ `UPDATE used_count` → SỐNG (không KB nào áp voucher trong bán).
  **Ở quầy:** mã giảm giá `usage_limit=1` DÙNG LẠI được nhiều lần.
- **AU-G3 (NẶNG):** gói & thẻ trả trước (orders customer_packages/membership + `packages.js:177` deliver) SỐNG. **Ở
  quầy:** mua gói/thẻ không ghi sổ, lấy hàng quá số lượt; **HUỶ đơn mua-gói (route `cancel`, quyền quầy cancel_order,
  KHÔNG owner): `orders-22/24` bỏ DELETE customer_packages/membership → khách được HOÀN TIỀN (ghiVi refund :1333) mà
  VẪN giữ gói/thẻ = rò tiền cấp quầy** (soát vòng 2 bắt — trước xếp nhầm NHẸ "xoá đơn admin"; classifier chỉ đọc
  middleware ở `router.<verb>(`, không đọc khoá owner trong thân hàm).
- AU-G4 (NHẸ-tiền): ví đối soát tạo-mới (`wallets-08`), link sổ hoàn (`refunds-05`), đổi cách trả (`don-mo-rong-01`,
  tổng không đổi), `/increment-usage` (`discount-codes-05`, endpoint riêng). Xem `c2_day_du.md`.
- AU-A1 / AU-B1 (NHẸ, không phải tiền): `CONG_CU_DOC` không khoá bằng test; hai cổng A14 chồng — chi tiết trong bảng.

## Tỷ lệ BẮT/SỐNG/HỎNG/LẠC/TREO (LẠC+TREO KHÔNG cộng vào BẮT)

Đột biến AUDIT-1 (`dot_bien.py`). G3 là bộ tự-chứng-minh (LẠC/HỎNG/SỐNG của G3 là CỐ Ý). SỐNG đụng tiền = phát hiện
(AU-G1..G4); SỐNG ở A3/B1 = lỗ test NHẸ. LẠC+TREO KHÔNG cộng vào BẮT, liệt kê riêng.

| nhóm | BẮT | SỐNG | HỎNG | LẠC | TREO | tỷ lệ BẮT = BẮT/(tổng−HỎNG) |
|---|---|---|---|---|---|---|
| G3 (demo) | 1 | 1 | 1 | 1 | 0 | — (cố ý mỗi loại 1) |
| A3 người gác | 15 | 1 | 0 | 0 | 0 | 15/16 |
| B1 cổng (A6–A14 + A8/A9/A13/A15) | 11 | 1 | 0 | 0 | 0 | 11/12 |
| C2 (2 câu điểm thêm + loyalty redeem) | 2 | 1 | 0 | 0 | 0 | 2/3 |
| **C2F (86 câu bỏ-câu ĐỦ)** | **40** | **45** | **0** | **1** | **0** | 40/85 (SỐNG=lỗ lưới; LẠC=`orders-02` FK) |
| D1 bộ kiểm (mỗi phép 1 đột biến) | 46 | 0 | 0 | 2 | 0 | 46/48 (LẠC=`!E11-P20`,`!E11-P26a` liệt kê riêng) |

A4 lách (`lach.js`): **52/52 CHẶN · 0 LỌT** (44/74 mã; 30 mã còn lại CHƯA KIỂM — `a_bang_luat.md` A4b).
LẠC liệt kê riêng (chạy lại -j1 một lần vẫn LẠC): `C2F-orders-02` (bỏ INSERT pos_orders → FK sập); `!D1-E11-P20`,
`!D1-E11-P26a` (code break bị phép TĨNH E7/refunds bắt trước nên kiem đỏ "CÓ LỖI", không khớp dòng bài-thật).
**Liveness các phép chạy-thật (soát vòng 2):** thu_P21 (`!D1-E11-P21`), thu_P26b (`!D1-E11-P26b`), thu_P26a
(`C2F-loyalty-03` C8), thu_nguoi_gac/thu_cong_cu/thu_cong (`!D1-T1/T1b/T1c`) — đều có đột biến làm CHÍNH file đó in
dòng đỏ RIÊNG ⇒ chứng minh "còn sống". **thu_P20: CHƯA KIỂM liveness** — không đột biến nào làm `thu_P20.js` in dòng
đỏ của chính nó (đột biến riêng bị E7 tĩnh chặn trước → LẠC); có thể là bài luôn-xanh mà audit chưa phát hiện (đúng
cảnh báo KHUON_LOI K3 / TU-CHAY-4). Đề xuất HOC-2: viết một đột biến phá đúng thứ thu_P20 canh mà không phép tĩnh nào trùng.

Đột biến CŨ chạy lại (E1), LẠC/TREO không có:

| bộ | BẮT | HỎNG | ghi |
|---|---|---|---|
| P26b (`viec/P26b/dot_bien.py`) | 59 | 1 | HỎNG = `I10-bo` (AU-E1) |
| HOC-1 (`viec/HOC-1/dot_bien.py`) | 15 | 2 | HỎNG = `MB`, `MB4` (AU-E2); M0×3 đối chứng XANH |
| TU-CHAY-4 gl (`… M0 E4`) | 7 | 0 | M0 đối chứng XANH; `tai_cho` (F2/S3) KHÔNG chạy (AU-E3) |

**Tổng: 16 SỐNG đụng tiền (3 nhóm NẶNG AU-G1/G2/G3 + AU-G4 NHẸ-tiền); 2 SỐNG lưới A/B NHẸ; 3 đột biến cũ HỎNG trên
HEAD (I10-bo, MB, MB4). Câu ví/điểm-tích/hoàn/debt LÕI đều BẮT — không SỐNG.**

## B4 — cổng tĩnh của main chạy trên chính nhánh này
`node tu_chay/cong.js tinh . b94110e 62b90ce viec/AUDIT-1` → **✓ CỔNG TĨNH ĐẠT** (mọi file đổi nằm trong Phạm vi
`viec/AUDIT-1/**`, không đụng code chạy thật nên A11/A12 không áp).

## K5 — luồng hợp lệ KHÔNG bị ảnh hưởng
`dot_bien.py` chỉ đụng bản sao trong thư mục tạm; cuối mỗi lần chạy so `git status` (ngoài `viec/AUDIT-1/`), `data/` và
`client/node_modules/.vite` trước/sau — khác là in "✗ KHO BẨN", thoát 3. **(Sửa ra-soat vòng 1:** `anh_kho()` KHÔNG còn
so nhật ký người gác `.tu_chay_nhat_ky*` — hook ghi mọi lệnh Bash của CẢ phiên vào đó nên hoạt động song song làm nó
đổi → báo "KHO BẨN" OAN dù kho không đụng, đúng khuôn K8; nay chỉ so `data/` + `.vite` + git status.) Ngắt bằng
**SIGINT/SIGTERM** → giết nhóm tiến trình con + xoá thư mục tạm (thử `timeout -s INT 30 … G3-vo-hai` → 0 sót). SIGKILL/
OOM/hết-giờ cứng KHÔNG bắt được (có thể để lại thư mục `/tmp/audit1_*` rỗng — rác /tmp, không đụng kho). `lach.js` chỉ
truyền CHUỖI vào `xet()`, không thực thi lệnh lách nào.
