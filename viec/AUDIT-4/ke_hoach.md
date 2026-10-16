# AUDIT-4 — kế hoạch (bản 2, sau soát độc lập — chờ duyệt, bước 3 của /lam-viec)

Nền: HEAD `d8e256e` (= `PHIEU: AUDIT-4` trên `783a1dd`, sổ v34; code chạy thật = `0ee7346` Merge PR #26 LUOI-3, P20b PR #25). Việc CHỈ KIỂM +
BÁO CÁO trong `viec/AUDIT-4/`; không đổi byte nào ngoài đó. Định nghĩa BẮT / SỐNG / HỎNG / LẠC / NẶNG / NHẸ như `viec/AUDIT-1/phieu.md`
(+ TREO); luật sập (a) AUDIT-3 chốt 16.10: bộ kiểm chạy hết nhưng báo bài con sập = HỎNG-sập, không BẮT. Đột biến chỉ trên bản sao trong
thư mục tạm. P20c chạy song song (`signup-codes.js`, `thu_P20.js`) — đo trên HEAD lúc mở phiên, ghi SHA mỗi lần chạy.

## 0. Số đo lúc lập kế hoạch (HEAD `d8e256e`, 16.10, máy mây, đo RIÊNG tuần tự bằng `do.py` nháp — không đoán)

| Thứ | Số đo |
|---|---|
| `thu_P26c.js` · `thu_GOI1.js` · `thu_P26b.js` | 3,9 s · 118 đạt · 0 hỏng · 3,0 s · 105/0 · 1,9 s · 66/0 |
| `thu_P20.js` · `thu_P21.js` · `thu_gia_lap.js --chi-du-lieu-tay` | 1,4 s · 75/0 · 1,0 s · 14/0 · 1,2 s · 84/0 |
| `tu_chay/thu_cong.js` (một mình) | 82,0 s · 334 phép · 0 hỏng (TU-CHAY-6 đo 67,9–122,9 s trong một ngày — Câu hỏi 5 của việc đó) |
| một đột biến mẫu (gồm đối chứng) | LUOI-3 `VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN` 5,7 s BẮT · P20b `BV-A2-bo-tra-signup` 3,1 s BẮT · BAN-HANG-1 `BV-BANHANG1-THE-CONG` 7,1 s bắt |
| `viec/AUDIT-2/lach.js` | 0,1 s · CHẶN 14 · LỌT ĐÃ BIẾT 1 · LỌT 0 (trên 15) — như AUDIT-3 |
| mã luật người gác | 77 — `git show 31a5810:tu_chay/nguoi_gac.js` cũng 77, `git diff 31a5810 HEAD -- tu_chay/nguoi_gac.js` rỗng; `.claude/tu_chay/nguoi_gac.js` = `tu_chay/` (`cmp`) → 0 mã mới (AUDIT-3 ghi 76 — cách đếm khác, cùng file) |
| `python3 viec/AUDIT-3/kiem_neo.py` | thoát 1 · HỎNG 2 ngoài danh sách: `SO-LUONG-1 VS-SOLUONG1-THE-SDT-THO`, `AUDIT-3 BV-AU3-SL-THE-BO-CONG` (cổng thẻ cũ `orders.js:187` → BAN-HANG-1 thay cổng `:190`). Bản thay: BAN-HANG-1 `VS-BANHANG1-THE-SDT-THO` (hồ sơ BAN-HANG-1 ghi), `BV-BANHANG1-THE-CONG` (chưa hồ sơ nào ghi thay cho `BV-AU3-SL-THE-BO-CONG` — grep 0) → phát hiện NHẸ như AU3-3. bb 178/179 so ảnh AUDIT-3, 0 trôi (`bat_bien.js` không đổi từ `31a5810`) |
| code đổi từ sau AUDIT-3 (`git diff --stat 31a5810 HEAD`) | `orders.js` +19/−… (P20b cổng voucher `:508–519`, BAN-HANG-1 cổng thẻ `:188–192`), `signup-codes.js` +1 (xuất `kiemDonCuaMa` `:499`), `auth.js` 1 dòng (`'30d'` `:64`), `Sales.jsx` +7 (BAN-HANG-1 A1); bài: `thu_P26c.js` +110, `thu_GOI1.js` +30, `thu_P20.js` +75, `thu_TOCDO1.js` +73, `kiem_tra_truoc_khi_giao.js` +47; `tu_chay/` 8 file (TU-CHAY-6) |
| kho | NÔNG (445 commit), `9521cec` vắng → LUOI-1 qua `boc.py --luoi1`, 2 `GOC-*` CHƯA KIỂM (như AUDIT-3) |

Số đo AUDIT-3 dùng để ƯỚC (máy mây, 15.10 — `viec/AUDIT-3/trang_thai.md:81–90`): `--khung` 88 = 986 s · `--c2luoi` 100 = 1197 s · `--audit2` 30 =
409 s · bb 179 = 742 s · P26b 172 s · P26c 426 s · GOI-1 43 s · GOI-2 63 s · SO-LUONG-1 26 s · LUOI-1 88 s · TACH-GL 753 s. LUOI-3 N11 (16.10):
P26c 231–241 s · BAN-HANG-1 11 s · 10 đột biến LUOI-3 14 s.

## 1. Nguyên tắc
- Dùng lại công cụ AUDIT-3 (phiếu): CHÉP `viec/AUDIT-3/boc.py`, `kiem_neo.py`, `dot_bien.py` sang `viec/AUDIT-4/` rồi sửa bản chép; không sửa
  `viec/AUDIT-3/` hay bộ của việc nào. Nạp `viec/AUDIT-3/*.py` (chỉ đọc) luôn sau `sys.dont_write_bytecode = True` (không đẻ `__pycache__`).
- Chạy nặng TUẦN TỰ, đo riêng; KHÔNG sửa / commit file nào trong kho khi bộ đo đang chạy (bài học "KHO BẨN" AUDIT-3, LUOI-3). Đầu ra ghi vào
  thư mục nháp, chép bảng vào `.md` sau. Mỗi nhóm xong → commit + push, `trang_thai.md` ghi nhóm xong.
- Mọi kết quả qua MỘT luật sập `sap_cua` (bản AUDIT-4 đã vá AU3-22…24).

## 2. A1 — công cụ trước: `viec/AUDIT-4/boc.py` (chép AUDIT-3, vá 3 lỗi đúng cột "cách vá")

| lỗi | vá (đúng `bao_cao.md` AUDIT-3) | ca đỏ (`bang_chung_do.txt`) — cũ và mới chấm CÙNG một đầu vào |
|---|---|---|
| AU3-22 | `co_sap`: bỏ lọc `✗ bài chạy thật` (chỉ còn trừ `✗ T\d` của thu_gia_lap) → vế (1) soi ĐỦ đầu ra; vế (4) thừa — bỏ nếu đo y hệt. `--sap` thêm `DOSAP-KIEM` = `DOSAP_KHUON` (`meTra = 0`) qua khung AUDIT-2 cách `kiem`, mẫu `r'✗ '` như mọi dòng `--sap` | `--sap` lưu đầu ra THẬT của lệnh con `kiem` (thoát, toàn văn) + `chi` (dòng khớp đầu, cắt 220 như khung `viec/AUDIT-1/dot_bien.py:328`). `--tu-thu` chấm đầu vào đó bằng `A3.sap_cua` (nạp `viec/AUDIT-3/boc.py` chỉ đọc) và `sap_cua` mới: cũ phải KHÔNG sập (= khung ghi BẮT — AUDIT-3 soát vòng 4 `soat4_dosap_kiem.py` đã thấy), mới phải sập. Nếu cũ đã ra sập (dấu sập lọt trong 220 ký tự đầu của `chi`) → ca không phân biệt (K3): dựng lại để bài con in ≥ 2 dòng ✗ trước khi sập, ghi rõ |
| AU3-23 | gom `xau` của `sap()` vào hàm `gom_xau(bo, kq)` có NEM- (mọi tên `SAP-/SAI-/NEM-/DOSAP-/SAP0-/VS-Q9` ra BẮT / SỐNG là xấu); sửa 2 chú thích (`viec/AUDIT-3/boc.py:33`, `:172`) theo kết quả thật (4 bộ khuôn: NEM- → `✖ Bài thử sập … HTTP 500` thoát 2 = HỎNG-sập) | `--tu-thu` chạy `sap()` của CẢ HAI bản với cùng bộ giả (thay `chay_khuon` trả `[('NEM-P26b','BẮT','')]`, `nap_m2` / `goi_main` / `nap_luoi1` / `nap_module` trả bộ rỗng — ~12 dòng): `A3.sap()` → 0 (ĐẠT dù NEM- ra BẮT = đỏ), `sap()` mới → 1 (KHÔNG ĐẠT). Đi qua đúng đường gom `xau` của `sap()`, không chỉ gọi hàm mới |
| AU3-24 | `HET`: bỏ `· (?:KHÔNG )?ĐẠT\b`; thay bằng dòng tổng `chay.js` neo NGUYÊN dòng, cờ `re.M`: `^(?:Giả lập: .* kịch bản|Lượt \d+: KB.*) · (?:ĐẠT\|KHÔNG ĐẠT \(\d+ lệch\))$` (`chay.js:138`, `:299–300` đọc lượt này) | `--tu-thu`: (a) đầu ra THẬT của `node cong_cu/thu_gia_lap.js` (chạy một lần, cắt dòng tổng), thoát 0 → `A3.sap_cua` không sập (đỏ — `HET` cũ khớp tên ca T0 / T9c `thu_gia_lap.js:300, :320`), mới sập; (b) K5: đầu ra THẬT của `chay.js` khi một đột biến đã biết làm lệch (`… · KHÔNG ĐẠT (n lệch)`, thoát 1) → mới phải KHÔNG sập (không thì mọi BẮT qua `chay.js` thành HỎNG-sập — soát bản 1 bắt) |

`--tu-thu` in ĐẠT / ĐỎ từng phép (cột cũ · mới), thoát 1 nếu bản mới sai. `--sap` giữ mọi dạng AUDIT-3 + `DOSAP-KIEM`; mong 0 bộ BẮT/SỐNG.

**Bọc thêm cho A2:** (i) MỘT hàm bọc chung cho khung AUDIT-1 (`K.chay_lenh` / `K.cham`) và bb (`chay_lenh(argv, k, tam, gio)` → `(ma, [dòng])`,
`dot_bien_bb.py:238–248`): nối dòng trước khi `sap_cua`, `ma is None` (quá giờ) → TREO, không sập; (ii) LUOI-1 / TACH-GL: `subprocess` của không gian
tên bộ → `Vo` (giữ đầu ra), bọc `cham` (dict) → `sap_cua` → HỎNG-sập, cột `mong` giữ nguyên. `DOI_CHUNG` cập nhật số HEAD (118 / 105 / 66, thu_gia_lap
đủ đo lúc làm). Bộ có `chay1` sẵn mà AUDIT-3 chưa chạy (P20b, BAN-HANG-1) và SO-LUONG-1 KHÔNG ghép vào `boc.py` — chạy qua `viec/AUDIT-4/dot_bien.py
--bo <việc>` (mục 4), nơi đã có đối chứng + luật sập vòng 3 (P20b tự nó không soi dấu sập — `viec/P20b/dot_bien.py:66–67`).
Ngân sách `boc.py`: ~30 vá + ~12 `--tu-thu` + ~10 bọc ≈ **50 dòng** trên 237 → Câu hỏi 1.

## 3. A2 — chạy lại ĐỦ trên HEAD (tuần tự; nhật ký ra nháp)

| bộ | lệnh | ước (s) | mong / so AUDIT-3 · N11 LUOI-3 |
|---|---|---|---|
| AUDIT-3 `dot_bien.py` (21 + 5 D2; đã có đối chứng + luật sập vòng 3) | `python3 viec/AUDIT-3/dot_bien.py` | 60 | 10 AU3-8…17 hết SỐNG; mẫu AUDIT-3 (`✗ B1`, `✗ (S2\|A5)`…) không theo tên ca LUOI-3 → có thể LẠC-mẫu, "đúng ca" chấm ở dòng dưới; `BV-AU3-SL-THE-BO-CONG` HỎNG (mục 0) |
| LUOI-3 `dot_bien.py` (10, in MỌI dòng ✗ nguyên văn) | `python3 viec/LUOI-3/dot_bien.py` rồi `diff` các dòng ✗ với khối SAU `viec/LUOI-3/bang_chung_do.txt:34–61` | 20 | 10/10 BẮT; diff CÂU LỖI (không chỉ mã ca) rỗng hoặc chỉ khác số chạy (ví, mã đơn) — khác ca / khác câu = phát hiện |
| AUDIT-1 trừ C2F (88) | `boc.py --khung G3 A3 B1 C2 D1 -j 3` | 1000 | như AUDIT-3 (81/83, `!D1-E11-P26b` HỎNG-sập; P20b ghi D1 nhóm P20 "8 bắt + 1 LẠC ý cũ") |
| C2F 87 + A3L c2full 13 | `boc.py --c2luoi -j 3` | 1200 | ≤ 22 SỐNG; tên C2F trượt theo `orders.js` +19 (AU3-7) → so bằng NEO |
| AUDIT-2 A3L + B3 (đúng phiếu; gồm 7 đột biến LUOI-2 — LUOI-2 không có `dot_bien.py`) | `boc.py --audit2 A3L B3 -j 3` | 380 | A3L 15/18 · B3 3 + LẠC `BK-KB21` (AU3-4) · LUOI-2 7/7 như N11 |
| bb (175 + 4 D2), ảnh `viec/AUDIT-3/bb_neo.json` | `boc.py --bb -j 4` | 750 | ~123/175 (`bat_bien.js`, `thu_gia_lap.js` không đổi); qua bọc lần đầu |
| P26b 59 · P26c 93 · GOI-1 49 · GOI-2 59 | `boc.py <bộ> -j 4` | 172 + 430 + 45 + 65 | 48 · 88 + 1 sập (AU3-6) · 40 · 59 |
| SO-LUONG-1 17 · BAN-HANG-1 7 · P20b 4 | `python3 viec/AUDIT-4/dot_bien.py --bo SO-LUONG-1` (rồi `BAN-HANG-1`, `P20b`) | 30 + 20 + 20 | 16/17 (`VS-SOLUONG1-THE-SDT-THO` đã thay) · 7/7 · 4/4 |
| LUOI-1 78 (+ 2 GOC CHƯA KIỂM) · TACH-GL 29 | `boc.py --luoi1 -j 4` · `boc.py --tachgl -j 2` | 90 + 760 | 78/78 · 25 BẮT + 4 đã thay |

Bảng `a2_bang.md`: mỗi tên BẮT/SỐNG/HỎNG(-sập)/LẠC/TREO, cột AUDIT-3, cột N11, cột "vì sao khác"; LẠC/HỎNG → "đã thay bằng …" hoặc phát hiện.

## 4. A3 — đột biến ĐỘC LẬP mới: `viec/AUDIT-4/dot_bien.py` (khuôn `viec/AUDIT-3/dot_bien.py`; ngân sách 80–150, ước ~130)
Cách chạy: `p26c` / `thu` (như AUDIT-3), `p20` (chép THẬT `server/` + `cong_cu/` vào tạm, symlink `node_modules`, `node cong_cu/thu_P20.js` trong bản
sao — khuôn `viec/P20b/dot_bien.py:24–29`). Một đột biến có thể khai NHIỀU cách (`('p26c', 'thu')`): BẮT khi một bài bắt, cột chi tiết ghi từng bài —
đột biến ở `tienDaTra.js` chạy cả hai vì `tienDaTraTheoDong` có 3 chỗ gọi (đền `damages.js:173` + huỷ `tienDaTra.js:39` ở thu_P26c, kết thúc gói `:77` ở
thu_GOI1). Đối chứng mỗi cách (khớp mục 0); luật sập vòng 3; nhãn: neo hỏng = **HỎNG**, bài sập = **HỎNG-sập** (khác nhãn); TMPDIR riêng; bắt SIGINT /
SIGTERM → dọn tạm rồi thoát 130. `--bo <việc>` nạp `DOT_BIEN` của SO-LUONG-1 / BAN-HANG-1 / P20b (chỉ đọc, như `viec/LUOI-3/dot_bien.py:14–17`) và chạy
bằng cách tương ứng (A2). Tên lạ / chọn 0 → thoát 2. Neo dưới đếm lượt này (`grep -F -c` = 1, soát đếm lại cũng 1).

| việc | tên | file:dòng | đổi gì | bộ cũ cùng chỗ | dự đoán (tự tính) |
|---|---|---|---|---|---|
| P20b | `VS-AU4-P20B-CHI-TRA-MA-CHUA-CLAIM` | `orders.js:513` | `AND claimed_at IS NOT NULL"` → `AND claimed_at IS NULL"` | P20b `VS-A2-tra-ca-ma-chua-claim` (bỏ điều kiện); đảo = hợp hai đột biến P20b (`:16`, `:22`) — ít tin mới, giữ vì phiếu nêu chỗ này | BẮT (G1 + G7) |
| P20b | `VS-AU4-P20B-DOI-MA-LOI` | `orders.js:518` | `code: "MA_DON_GOC_KHONG_HOP_LE"` → `code: kqDon.loi.code` | không (chuỗi chỉ ở phần THAY của P20b) | BẮT (G1 ra `DON_DA_HUY`) |
| P20b | `BV-AU4-P20B-CHAN-SAU-GIAO-DICH` | `orders.js:518` + `:1006` | cổng chỉ ghi `req._chanP20b = kqDon.loi`; sau `console.log(\`✅ Đơn … committed …\`)` chèn `if (req._chanP20b) return res.status(400)…` | không | BẮT (G1 "không có đơn mới", "used_count = 0") |
| P20b | `VS-AU4-P20B-TRA-MA-THO` | `orders.js:514` | `[codeRecord.code],` → `[discount_code],` (mã gõ, chưa trim) | không | SỐNG (không ca mã có khoảng trắng) → Câu hỏi 2 |
| BAN-HANG-1 | `VS-AU4-BH1-THE-KIEM-OBJ` | `orders.js:190` | `!(membership_buy.tier_id && …)` → `!(membership_buy && …)` | dòng `THE_CONG`, lỗi khác | BẮT (T1a, T1b) |
| BAN-HANG-1 | `VS-AU4-BH1-DOI-MA-LOI` | `orders.js:191` | bỏ `code: "THE_MUA_THIEU_THONG_TIN"` | không | BẮT (T1a so mã) |
| BAN-HANG-1 | `VS-AU4-BH1-HAN-29D` | `auth.js:64` | `\|\| '30d' }` → `\|\| '29d' }` (ngay dưới chốt — K3) | dòng `HAN_DN`, lỗi khác | BẮT (T3a so BẰNG `30 * 86400`, `thu_P26c.js:916`) — xác nhận phép ngưỡng chặt |
| LUOI-3 [M] | `VS-AU4-L3-DATRA-LAM-TRON-LEN` | `tienDaTra.js:25` | `Math.floor((gia[i] * tra) / tong)` → `Math.ceil(…)` | P26c `VS-B1-chia-bo-giam-don`, lỗi khác | SỐNG (M2 / B1c chia hết) → ghi ca đề xuất có số LẺ đã tự tính trên gốc + đột biến |
| LUOI-3 [M] | `VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG` | `tienDaTra.js:45` | `- Math.ceil(daDung);` → `- Math.floor(daDung);` | P26c `VS-H2-chi-phan-vi`, AUDIT-2 `A3L-hoan-goi-bo-tru-no`, lỗi khác | SỐNG (M1b, M4a, A5c/f/g đều chẵn) → ca số lẻ đề xuất |
| LUOI-3 B3p | `VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN` | `tienDaTra.js:81` | `const goc = Math.floor(` → `const goc = Math.ceil(` (chỗ làm tròn thứ ba — soát K4) | GOI-2 `:44` đổi giá niêm yết, không làm tròn | tự tính trên B3* lúc làm |
| LUOI-3 [M] | `VS-AU4-L3-CHAN-TREN-CA-HOAN` | `tienDaTra.js:19` | `const ma = chanTren && order.discount_code` → `const ma = order.discount_code` | không | SỐNG nếu không ca gói + mã 1 món (huỷ / kết thúc gói) |
| LUOI-3 A2l–n | `VS-AU4-L3-LOAI-CHAN-BANG` | `goiKhach.js:29` | `> con) {` → `>= con) {` | GOI-1 `VS-GOI1-LOAI-SO-SAI` (`> con + 1`, chiều nới) | BẮT (A2m K5) |
| LUOI-3 A2l–n | `VS-AU4-L3-KHOA-LOAI-BO-KIEU` | `goiKhach.js:11` | khoá loại chỉ `${i.sx_product_id}` | không | SỐNG (không ca hai kiểu cùng id) |
| LUOI-3 B3p | `BV-AU4-L3-B3P-BO-SAN-0` | `tienDaTra.js:87` | `Math.max(0, Math.min(goc, …))` → `Math.min(goc, …)` | cùng neo AUDIT-3 `BV-AU3-GOI2-BO-TRAN-DA-NHAN`, lỗi khác; mọi chỗ khác `:77–89` đã có đột biến GOI-2 / AUDIT-3 | SỐNG (B3p nhận = total, không > total) |

D2 (cách MỚI `p20` — `p26c` / `thu` đã chứng minh ở AUDIT-3): `D2-AU4-sai-chuoi` → HỎNG · `D2-AU4-da-biet` (= neo `BV-A2-bo-tra-signup`) → BẮT ·
`D2-AU4-vo-hai` (chú thích `// 1. Tạo đơn hàng`) → SỐNG · `D2-AU4-sap` (`}}}{{{`) → HỎNG-sập · `D2-AU4-sap-0` (`process.exit(0)` — thu_P20 nạp máy chủ
trong tiến trình? kiểm lúc làm; không thì ghi lý do bỏ) → HỎNG-sập. Ca D2 so NHÃN (HỎNG ≠ HỎNG-sập) và câu kết luận. Đếm: P20b 4 · BAN-HANG-1 3 ·
LUOI-3 7 + 5 D2 = 19. SỐNG ở chỗ tiền / ví / gói / kho = NẶNG (`bao_cao.md`, kèm ca đề xuất ĐÃ TỰ TÍNH số trên gốc và đột biến — bài học LUOI-3).

## 5. A4 — `viec/AUDIT-4/kiem_neo.py` (chép AUDIT-3, ~+20) · lách
- Thêm bộ: BAN-HANG-1 (cắt `\ndef ap(`, file từ `server/`), P20b (cắt `\ndef ban_sao(`, file từ gốc kho), LUOI-3 (tên phải có trong
  `viec/AUDIT-3/dot_bien.py`; mẫu `✗ M1a …` phải thấy trong nguồn bài), TU-CHAY-6 (cắt `\ndef ban_sao(`, `(tên, file, [(cũ, mới, n)], [bài], mẫu)`),
  AUDIT-4 `dot_bien.py`. `RUA_CO_Y` thêm 2 dòng mục 0; `BV-AU3-SL-THE-BO-CONG` ghi "hồ sơ không ghi — phát hiện AU4-n". Đầu ra nguyên văn → `trang_thai.md`.
- `node viec/AUDIT-2/lach.js` chạy lại (mong CHẶN 14 · LỌT ĐÃ BIẾT 1 · LỌT 0); 0 mã mới (mục 0) → không thêm ca lách.

## 6. A5 — phép nhấp nháy `thu_cong.js`
`do_nhap_nhay.py` NHÁP (ngoài kho — người gác chặn `time` / `for`): 5 lần `node tu_chay/thu_cong.js` liên tiếp, rồi 3 lần trong khi một tiến trình
lặp `node cong_cu/thu_gia_lap.js` chạy song song. Ghi từng lần: thoát, `N phép · M hỏng`, giây; đỏ → chép NGUYÊN dòng ✗. Đọc `tu_chay/thu_cong.js`
tìm chỗ phụ thuộc thời gian / thư mục tạm dùng chung — đã thấy: `:24` `TAM` mkdtemp, dọn ở `:723` chỉ khi chạy tới cuối (không `process.on('exit')`) →
bị giết thì sót `thu_cong_*`; timeout `:35` 30 s, `:85` 60 s, `:117` 300 s, `:708` 30 s; hạn 120 s / bài của bộ kiểm (TU-CHAY-6 Q5). Hook dừng
`kiem_truoc_khi_dung.cjs` chạy `npm test` mỗi lần máy dừng → không dừng lượt giữa phép đo. Không sửa `tu_chay/`.

## 7. A6 — đơn rỗng: `viec/AUDIT-4/don_rong.js` (~70 dòng; khởi động như `thu_P26c.js:20–60`: chép `server/` vào tạm, kho SQLite tạm, SX giả; bắt tín hiệu → dọn)
`items: []` + `membership_buy: {}` và `package_buy: {}` đã có ca: T1b (`thu_P26c.js:896`), S2g (`:849`) → dẫn, không lặp. Ca mới: R1 `items: []` trơn ·
R5 1 món + mã giảm 100 % (tổng 0) · R6 K5 chỉ mua thẻ đủ (`items: []`) · R8 K5 lấy từ gói (0đ). Mỗi ca 200 → đọc `pos_orders` (subtotal, total, số
dòng), `GET /reports/daily` + `/sales` (đếm đơn, doanh thu trước / sau), sổ điểm, `pos_balance_transactions`. Mức: đơn 0đ không vào tiền = NHẸ; doanh
thu / điểm / ví sai = NẶNG-code.

## 8. D — sản phẩm
- D1 `bao_cao.md` ≤ 200 dòng: kết luận một dòng (đạt / chưa đạt điểm dừng = 0 NẶNG code lẫn lưới) · bảng `AU4-<n>` · tỷ lệ theo nhóm, cột AUDIT-3 ·
  mục "Đề xuất bộ khung" (BAN-HANG-1: phép tĩnh `:NNNN` K3/K4; TU-CHAY-6 Q5: chia lượt `thu_cong`) — không làm.
- D2 `bang_chung_do.txt`: A1 ba ca (cột cũ đỏ / mới đúng) + ca K5 của `HET`; D2 năm ca của `dot_bien.py`; `--sap`. Không dòng `SỐ CA` (phiếu "Bài thử đỏ: không").
- D3 `npm test` + `--day-du` xanh ở cuối; `git status --porcelain --untracked-files=all` so trước / sau MỌI lệnh công cụ; thử ngắt `timeout -s INT 15` VÀ
  `timeout 15` (SIGTERM) cho `boc.py GOI-1`, `dot_bien.py`, `don_rong.js` → đếm thư mục tạm trước / sau; sót (RM-NHAP chặn `rm` ngoài nháp) → ghi lệnh
  dọn. `git diff --stat d8e256e HEAD -- ':!viec/AUDIT-4/'` rỗng.

## 9. Đường song song (K4) · luồng hợp lệ (K5)
- Việc không đổi code chạy thật → không luồng quầy nào bị chặn. Công cụ chỉ ghi bản sao trong thư mục tạm (kiểm `realpath`).
- K4 P20b: cổng một chỗ (`orders.js:516–519`), đặt NGOÀI giao dịch → có thể đua với "huỷ đơn gốc" cùng lúc (đọc trạng thái trước BEGIN) — ghi phát hiện
  kèm đường thật đọc code, CHƯA KIỂM bằng chạy (không dựng được tất định → không đếm là phép, K3). `kiemDonCuaMa` ở `/claim`, `/nhan-diem` (thu_P20 /
  thu_P21 + AUDIT-1 nhóm P20). `discount-codes.js` `/validate` (`:63`) và `/:id/increment-usage` (`:341`) không qua cổng → phát hiện (đọc kỹ lúc làm).
- K4 BAN-HANG-1: cổng thẻ một chỗ (`:190`); khối dòng thẻ / ghi thẻ sau cổng là tập con (BAN-HANG-1 `trang_thai.md:85`, grep lại lúc làm); hạn token một
  chỗ (`auth.js:64` — `grep jwt.sign server` 1).
- K4 LUOI-3: ba chỗ làm tròn (`tienDaTra.js:25`, `:45`, `:81`) đều có đột biến; `tienDaTraTheoDong` 3 chỗ gọi → chạy hai bài; `vuotTheoLoai` 2 chỗ gọi.
- K5: đột biến chiều "chặn oan" (`LOAI-CHAN-BANG`, `CHAN-TREN-CA-HOAN`) có ca K5 ở cột dự đoán; ca K5 của `HET` mới (mục 2).
- Ca "hai người cùng bấm": việc không thêm đường tiền; chồng nhau đã có A5j (`thu_P26c.js`), B3i (`thu_GOI1.js`) — chạy lại ở A2; đua cổng P20b ghi trên.

## 10. Ca thử ↔ nghiệm thu (1-1)
| mục | chứng minh |
|---|---|
| A1 | `boc.py --tu-thu` (AU3-22 / 23 / 24: cũ đỏ · mới đúng trên cùng đầu vào, + K5 `HET`) + `--sap` (gồm `DOSAP-KIEM`) → `bang_chung_do.txt`; `git diff --stat d8e256e HEAD -- viec/AUDIT-3` rỗng |
| A2 | `a2_bang.md` mọi bộ mục 3, cột AUDIT-3 / N11 / vì sao khác; diff câu lỗi LUOI-3 |
| A3 | `viec/AUDIT-4/dot_bien.py` (P20b 4 · BAN-HANG-1 3 · LUOI-3 7, đối chứng 3 cách) — bảng `trang_thai.md`; SỐNG tiền = NẶNG trong `bao_cao.md` |
| A4 | `python3 viec/AUDIT-4/kiem_neo.py` + `node viec/AUDIT-2/lach.js` nguyên văn trong `trang_thai.md` |
| A5 | bảng 8 lần (thoát · phép · hỏng · giây · bận/rảnh) + phát hiện có neo |
| A6 | `node viec/AUDIT-4/don_rong.js` nguyên văn + mức từng ca (+ dẫn T1b, S2g) |
| D1 / D2 / D3 | `bao_cao.md` · `bang_chung_do.txt` · `npm test`, `--day-du`, `git status`, `git diff --stat`, thử ngắt INT + TERM trong `trang_thai.md` |

## 11. Thời gian máy (ước từ mục 0 + AUDIT-3, chạy RIÊNG tuần tự)
| nhóm | ước |
|---|---|
| A1 `--sap` (gồm cách `kiem` ~3 × 100 s) + `--tu-thu` (thu_gia_lap đủ ~50 s + một lần `chay.js` có lệch ~35 s) | ~10 phút |
| A2 (mục 3: 60 + 20 + 1000 + 1200 + 380 + 750 + 712 + 70 + 850) | ~84 phút |
| A3 ~19 đột biến (tienDaTra chạy 2 bài) + 3 đối chứng | ~3 phút |
| A4 · A6 | < 2 phút |
| A5 5 × ~85–125 s + 3 × máy bận ~120–180 s | ~17 phút |
| D3 `npm test` + `--day-du` + thử ngắt 6 lần | ~7 phút |
| **tổng** | **~123 phút** (< 180). Máy chậm 1,5× → ~185: cắt bằng bỏ chạy lại AUDIT-1 A3 / B1 qua `--khung` (24 tên, code nhóm đó không đổi từ AUDIT-3) ≈ −5 phút và C2F chỉ chạy tên đụng `orders.js` / `signup-codes.js` / `auth.js`, ghi rõ |

## 12. Câu hỏi (chờ chủ quán trả lời trong lời duyệt)
1. **Ngân sách `boc.py`**: phiếu ~30 dòng cho vá AU3-22…24. Bản này ~50: + `--tu-thu` (~12, cần để ca đỏ chấm cũ / mới cùng đầu vào) + bọc bb / LUOI-1 /
   TACH-GL (~10, A2 "qua bọc đối chứng" — AUDIT-3 để bb ngoài bọc = CHƯA KIỂM). (a) làm đủ (mặc định); (b) cắt bọc: bb / LUOI-1 / TACH-GL chạy thẳng +
   `--xep` (cận dưới, ghi CHƯA KIỂM) → ~42 dòng.
2. **Mức của SỐNG "biên"** ở chỗ tiền: (i) `VS-AU4-P20B-TRA-MA-THO` chỉ lộ khi gọi API thẳng (quầy gửi mã chuẩn từ `/validate`, `Sales.jsx:735`); (ii) ba
   đột biến làm tròn lệch ≤ 1đ / dòng (`tienDaTra.js:25`, `:45`, `:81`) — ca hiện có đều chia hết. (a) NẶNG-lưới theo luật AUDIT-3 "SỐNG tiền = NẶNG,
   không hạ mức" (mặc định — AUDIT-4 khi đó chưa đạt điểm dừng); (b) NHẸ-lưới kèm đường thật đã truy và ca đề xuất.
3. **Phiếu A3 "bỏ `claimed_at IS NOT NULL`"** trùng đột biến có sẵn `VS-A2-tra-ca-ma-chua-claim` của P20b (chạy ở A2). Mặc định: không lặp, A3 làm chiều
   ngược (`IS NULL`).

## 13. Soát kế hoạch (agent phụ, chỉ đọc — bản 1 → KHÔNG ĐẠT, 11 lỗi; đã sửa ở bản 2, tôi kiểm lại từng điểm trên code)
1. `HET` mới không khớp `KHÔNG ĐẠT (n lệch)` (`chay.js:138`, `:299`) → mọi BẮT qua `chay.js` thành sập → sửa mẫu + `re.M` + ca K5 (mục 2).
2. `HAN-29D` dự đoán SỐNG sai — T3a so BẰNG `30 * 86400` (`thu_P26c.js:916`) → dự đoán BẮT; bỏ `BV-AU4-BH1-HAN-BO-MAC-DINH` (gần trùng `BV-BANHANG1-HAN-DN-8H`).
3. Hai đột biến làm tròn dự đoán BẮT sai (M1b, M4a, A5c/f/g, M2, B1c đều chia hết; "27.272" là số của đột biến GIA-GOC) → dự đoán SỐNG, tự tính ca số lẻ.
4. K4 sót chỗ làm tròn thứ ba `tienDaTra.js:81` → thêm `VS-AU4-L3-HOAN-GOI-LAM-TRON-LEN`.
5. Đột biến `tienDaTra.js` chỉ chạy một bài trong khi 3 chỗ gọi nằm ở hai bài → khai nhiều cách.
6. bb `chay_lenh` trả list dòng → nối dòng; `ma None` → TREO.
7. `boc.py SO-LUONG-1` không có trong `KHUON` → chuyển SO-LUONG-1 / BAN-HANG-1 / P20b sang `dot_bien.py --bo` (cũng gọn hơn — soát câu 2).
8. Số dòng: bộ lọc `xau` ở `viec/AUDIT-3/boc.py:172` (không `:135`); `increment-usage` `:341` (không `:340`).
9. Ca AU3-23 bản 1 chỉ "grep thiếu hàm" = kiểm bản vá có mặt (E11–E13) → chạy `sap()` cả hai bản với cùng bộ giả.
10. Ca AU3-22 chưa ghi mẫu / chưa chắc luật cũ ra BẮT → ghi mẫu, chấm cũ / mới trên cùng đầu ra đã lưu, có lối dựng lại nếu không phân biệt.
11. D2: `sap` cùng nhãn HỎNG với `sai-chuoi`, thiếu `sap-0`, nên chạy cách mới `p20` → sửa (mục 4).
Theo thêm (soát câu 2): bỏ chế độ `--cua3` (nạp `A3.sap_cua` trong `--tu-thu`); so LUOI-3 bằng `diff` câu lỗi thay `--so-luoi3`; `--audit2 A3L B3` đúng
phiếu (bỏ A3P / D2K); A6 bỏ R2 / R3 (trùng T1b / S2g), bỏ R4; ghi đua cổng P20b ngoài giao dịch (mục 9); thử ngắt cả SIGTERM (D3).
