# AUDIT-4 — kế hoạch (bản 1 — chờ duyệt, bước 3 của /lam-viec)

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

| lỗi | vá (đúng `bao_cao.md` AUDIT-3) | ca đỏ trong `bang_chung_do.txt` |
|---|---|---|
| AU3-22 | `co_sap`: bỏ lọc `✗ bài chạy thật` (chỉ còn trừ `✗ T\d` của thu_gia_lap) → vế (1) soi ĐỦ đầu ra; vế (4) thành thừa, giữ (vô hại) hoặc bỏ — chọn bỏ nếu đo y hệt. `--sap` thêm `DOSAP-KIEM` = `DOSAP_KHUON` chạy qua khung AUDIT-2 cách `kiem` (bài con thu_P26b ✗ M2 rồi sập, `kiem_tra` báo ở dòng ✗) | `boc.py --sap` chạy với luật CŨ (`--cua3`: thay `co_sap` / `sap_cua` / `HET` bằng của `viec/AUDIT-3/boc.py` nạp chỉ đọc) → `DOSAP-KIEM` = **BẮT** (đỏ); luật MỚI → HỎNG-sập |
| AU3-23 | NEM- vào `xau` (hàm `la_xau(ten, kq)`: mọi tên `SAP-/SAI-/NEM-/DOSAP-/SAP0-/VS-Q9` ra BẮT / SỐNG là xấu); sửa 2 chú thích `:33`, `:172` theo kết quả thật (4 bộ khuôn: NEM- → `✖ Bài thử sập … HTTP 500` thoát 2 = HỎNG-sập) | `boc.py --tu-thu`: `la_xau('NEM-P26b','BẮT')` phải True; trên AUDIT-3 bộ lọc `:135` không có `NEM-` (grep — bản cũ không có hàm để gọi) → đỏ |
| AU3-24 | `HET`: bỏ `· (?:KHÔNG )?ĐẠT\b`, thay bằng dòng tổng của `chay.js` neo NGUYÊN dòng (`^Giả lập: \d+ kịch bản · \d+ bất biến · (KHÔNG )?ĐẠT$`, `^Lượt \d+: KB.* · (KHÔNG )?ĐẠT$`, đọc `chay.js:138, :300` lúc làm) và loại dòng mở đầu `✓ T` / `✗ T` | `--tu-thu`: đầu ra THẬT của `node cong_cu/thu_gia_lap.js` (chạy một lần, cắt dòng tổng) + thoát 0 → luật CŨ: không sập (đỏ — `HET` khớp tên ca T0 / T9c); luật MỚI: HỎNG-sập |

`--tu-thu` (~15 dòng): 3 phép thuần hàm trên luật đang nạp (mới, hoặc cũ khi `--cua3`), in ĐẠT / ĐỎ từng phép, thoát 1 nếu đỏ. `--sap` giữ mọi dạng
AUDIT-3 (nạp / ném / sập mã 0 / đỏ-rồi-sập / sập mã 1 không dấu / văng thô) + `DOSAP-KIEM`; mong 0 bộ BẮT/SỐNG.

**Bọc thêm cho A2 (bộ mới từ sau AUDIT-3 + bộ AUDIT-3 chưa bọc):**
- khuôn chung `chay1` (`nap_khuon`): thêm BAN-HANG-1 (`db` 3 phần `(tên, cặp, mẫu)` → đối chứng `('sạch', [], r'$^')`) và P20b (bộ chỉ có
  `main()` lặp: `boc.py` ghép `chay1` từ `ban_sao` / `ap` / `chay` CỦA bộ, ~8 dòng). `DOI_CHUNG` cập nhật số HEAD: thu_P26c 118, thu_GOI1 105,
  thu_P26b 66, thu_P20 75, thu_gia_lap đủ (đo lúc làm).
- bb (`--bb`, ~10 dòng): bọc `chay_lenh` của `dot_bien_bb.py` như `boc_khung` (mỗi tầng `sap_cua` → HỎNG-sập); kiểm sạch 3 bản của bộ giữ nguyên.
  AUDIT-3 để bb ngoài bọc = CHƯA KIỂM — nay đóng.
- LUOI-1 / TACH-GL (`--luoi1`, `--tachgl`, ~10 dòng): thay `subprocess` trong không gian tên bộ bằng `Vo` (giữ đầu ra), bọc `cham` (dict) →
  `sap_cua` → HỎNG-sập; cột `mong` giữ nguyên (đột biến mong LẠC mà sập = ghi riêng, không đếm BẮT).
- AUDIT-3 `dot_bien.py` và LUOI-3 `dot_bien.py`: ĐÃ có đối chứng + luật sập vòng 3 (`SAP` gồm `Node.js v\d`, đòi dòng tổng, thoát 2 = sập) →
  chạy THẲNG, không bọc; số đối chứng in ra so mục 0. `--so-luoi3 <đầu ra nháp>` (~8 dòng): mỗi tên, tập ca ✗ (mã ca sau `✗ `) so với mục
  SAU của `viec/LUOI-3/bang_chung_do.txt` → in "khớp" / "khác: thêm …, thiếu …".

Ngân sách: phiếu ~30 dòng cho vá AU3-22…24; bản này ước **~30 vá + `--tu-thu` / `--cua3` ~20 + bọc A2 mới ~40 ≈ 90 dòng** trên 237 → **Câu hỏi 1**.

## 3. A2 — chạy lại ĐỦ trên HEAD (tuần tự, `-j 4` / `-j 3` như AUDIT-3; nhật ký ra nháp)

| bộ | lệnh | ước (s) | mong / so với AUDIT-3 · N11 LUOI-3 |
|---|---|---|---|
| AUDIT-3 `dot_bien.py` (21 + 5 D2) | `python3 viec/AUDIT-3/dot_bien.py` | 60 | 10 AU3-8…17: không còn SỐNG; mẫu AUDIT-3 (`✗ B1`, `✗ (S2\|A5)`…) không theo tên ca LUOI-3 (`M2a`, `M4a`…) → có thể LẠC-mẫu — chấm "đúng ca" bằng dòng dưới. `BV-AU3-SL-THE-BO-CONG` HỎNG (mục 0). 11 còn lại + D2 như AUDIT-3 |
| LUOI-3 `dot_bien.py` (10, mẫu = tên ca LUOI-3, in MỌI dòng ✗) | `python3 viec/LUOI-3/dot_bien.py` → `boc.py --so-luoi3 <nháp>` | 20 | 10/10 BẮT, tập ca đỏ = mục SAU `viec/LUOI-3/bang_chung_do.txt` (vd N1: M1a + M1b; N4: A2l + A2m hệ quả) — khác = phát hiện |
| AUDIT-1 trừ C2F (88) | `boc.py --khung G3 A3 B1 C2 D1 -j 3` | 1000 | như AUDIT-3 (81/83, `!D1-E11-P26b` HỎNG-sập); P20b ghi D1 nhóm P20 "8 bắt + 1 LẠC ý cũ" |
| C2F 87 + A3L c2full 13 | `boc.py --c2luoi -j 3` | 1200 | ≤ 22 SỐNG (thu_P26c +7 ca [M] có thể bắt thêm); tên C2F trượt theo `orders.js` +19 (AU3-7) → so bằng NEO |
| AUDIT-2 A3L B3 A3P D2K (gồm 7 đột biến LUOI-2 — LUOI-2 không có `dot_bien.py`, đột biến của nó là A3L) | `boc.py --audit2 A3L B3 A3P D2K -j 3` | 420 | như AUDIT-3 (A3L 15/18, B3 3 + LẠC `BK-KB21` AU3-4; LUOI-2 7/7 như N11) |
| bb (175 + 4 D2), ảnh `viec/AUDIT-3/bb_neo.json` | `boc.py --bb -j 4` | 750 | như AUDIT-3 123/175 (`bat_bien.js`, `thu_gia_lap.js` không đổi); nay qua bọc → đỏ-rồi-sập ẩn (nếu có) lộ ra |
| P26b 59 · P26c 93 · GOI-1 49 · GOI-2 59 | `boc.py <bộ> -j 4` | 172 + 430 + 45 + 65 | như AUDIT-3 / N11 (48 · 88 + 1 sập AU3-6 · 40 · 59) |
| SO-LUONG-1 17 · BAN-HANG-1 7 · P20b 4 | `boc.py SO-LUONG-1` · `boc.py BAN-HANG-1` · `boc.py P20b` | 30 + 20 + 20 | SO-LUONG-1 16/17 (`VS-SOLUONG1-THE-SDT-THO` đã thay — AUDIT-3 17/17) · 7/7 · 4/4 |
| LUOI-1 78 (+ 2 GOC CHƯA KIỂM) · TACH-GL 29 | `boc.py --luoi1 -j 4` · `boc.py --tachgl -j 2` | 90 + 760 | 78/78 · 25 BẮT + 4 đã thay (như AUDIT-3) |

Bảng `a2_bang.md`: mỗi tên BẮT/SỐNG/HỎNG(-sập)/LẠC, cột AUDIT-3, cột N11 (bộ LUOI-3 đo), cột "vì sao khác"; LẠC/HỎNG → "đã thay bằng …" hoặc
phát hiện (LẠC không bản thay). TOC-DO-1, HOC-*, TU-CHAY-* không trong danh sách A2 → chỉ rà neo (A4).

## 4. A3 — đột biến ĐỘC LẬP mới: `viec/AUDIT-4/dot_bien.py` (chép khuôn `viec/AUDIT-3/dot_bien.py`; ngân sách 80–150, ước ~120)
Cách chạy: `p26c` / `thu` (như AUDIT-3) + `p20` (chép THẬT `server/` + `cong_cu/` vào tạm, symlink `node_modules`, chạy `node cong_cu/thu_P20.js`
trong bản sao — khuôn `viec/P20b/dot_bien.py:24–29`, vì thu_P20 không nhận `--may-chu`). Đối chứng mỗi cách (khớp mục 0), luật sập vòng 3
(`SAP`, dòng tổng, thoát 2), TMPDIR riêng, tên đột biến NGUYÊN chuỗi. Mọi neo dưới đã đếm lượt này (`neo2.py` nháp): khớp đúng 1 lần ở file:dòng
HEAD; cột "bộ cũ" = bộ nào đã đột biến CÙNG chỗ (khác lỗi thì ghi rõ).

| việc | tên | file:dòng | đổi gì | bộ cũ cùng chỗ | ca mong bắt |
|---|---|---|---|---|---|
| P20b | `VS-AU4-P20B-CHI-TRA-MA-CHUA-CLAIM` | `orders.js:513` | `AND claimed_at IS NOT NULL"` → `AND claimed_at IS NULL"` (đảo — voucher đã claim lọt) | P20b `VS-A2-tra-ca-ma-chua-claim` BỎ điều kiện (chiều K5); phiếu ghi "bỏ `claimed_at IS NOT NULL`" — trùng bộ P20b, chạy ở A2, ở đây làm chiều ngược | G1, G2 |
| P20b | `VS-AU4-P20B-DOI-MA-LOI` | `orders.js:518` | `code: "MA_DON_GOC_KHONG_HOP_LE"` → `code: kqDon.loi.code` (mã của hàm: `DON_DA_HUY`…) | không (chuỗi chỉ ở phần THAY của P20b) | G1 (so `r.code`) |
| P20b | `BV-AU4-P20B-CHAN-SAU-GIAO-DICH` | `orders.js:518` + `:1006` | cổng chỉ ghi `req._chanP20b = kqDon.loi`; sau `console.log(\`✅ Đơn … committed …\`)` chèn `if (req._chanP20b) return res.status(400).json({…MA_DON_GOC_KHONG_HOP_LE})` (đơn đã tạo, used_count đã +1) | không | G1 "không có đơn mới", "used_count = 0" |
| P20b | `VS-AU4-P20B-TRA-MA-THO` | `orders.js:514` | `[codeRecord.code],` → `[discount_code],` (mã khách gõ, chưa `trim`) | không | không ca mã có khoảng trắng → mong SỐNG → **Câu hỏi 2** (đường quầy gửi mã chuẩn từ /validate, `Sales.jsx:735`) |
| BAN-HANG-1 | `VS-AU4-BH1-THE-KIEM-OBJ` | `orders.js:190` | `!(membership_buy.tier_id && normalizePhone(…))` → `!(membership_buy && normalizePhone(…))` (`{}` truthy lọt) | cùng dòng `THE_CONG` với 5 đột biến BAN-HANG-1, lỗi khác | T1a, T1b |
| BAN-HANG-1 | `VS-AU4-BH1-DOI-MA-LOI` | `orders.js:191` | `code: "THE_MUA_THIEU_THONG_TIN"` → bỏ `code` | không | T1a (so mã) |
| BAN-HANG-1 | `VS-AU4-BH1-HAN-29D` | `auth.js:64` | `\|\| '30d' }` → `\|\| '29d' }` (ngưỡng NGAY DƯỚI chốt 30 ngày — K3) | cùng dòng `HAN_DN`, lỗi khác | T3a đòi `≥ 29 × 86400` → mong SỐNG = NHẸ-lưới (không tiền) |
| BAN-HANG-1 | `BV-AU4-BH1-HAN-BO-MAC-DINH` | `auth.js:64` | `\|\| '30d' }` → `}` (không biến → `expiresIn: undefined` → jsonwebtoken ném / token không hạn) | cùng dòng | T3a |
| LUOI-3 [M] | `VS-AU4-L3-DATRA-LAM-TRON-LEN` | `tienDaTra.js:25` | `Math.floor((gia[i] * tra) / tong)` → `Math.ceil(…)` (tổng dòng vượt số đã trả 1đ) | P26c `VS-B1-chia-bo-giam-don` (bỏ chia), lỗi khác | M2b trần 27.272 / B1 — số chia hết thì SỐNG = phát hiện |
| LUOI-3 [M] | `VS-AU4-L3-HOAN-DA-DUNG-LAM-TRON-XUONG` | `tienDaTra.js:45` | `- Math.ceil(daDung);` → `- Math.floor(daDung);` (hoàn dư) | P26c `VS-H2-chi-phan-vi`, AUDIT-2 `A3L-hoan-goi-bo-tru-no`, lỗi khác | M4a / M1b |
| LUOI-3 [M] | `VS-AU4-L3-CHAN-TREN-CA-HOAN` | `tienDaTra.js:19` | `const ma = chanTren && order.discount_code` → `const ma = order.discount_code` (trần mã-1-món áp cả huỷ / kết thúc gói → hoàn thiếu) | không | M3a chỉ ở đền → mong SỐNG nếu không ca gói + mã 1 món |
| LUOI-3 A2l–n | `VS-AU4-L3-LOAI-CHAN-BANG` | `goiKhach.js:29` | `> con) {` → `>= con) {` (lấy đúng số còn bị chặn oan) | GOI-1 `VS-GOI1-LOAI-SO-SAI` (`> con + 1`, chiều nới), lỗi khác | A2m (K5, đúng 3 còn → 200) |
| LUOI-3 A2l–n | `VS-AU4-L3-KHOA-LOAI-BO-KIEU` | `goiKhach.js:11` | khoá loại chỉ `${i.sx_product_id}` (hai kiểu cùng id gộp) | không | A2* — không ca hai kiểu cùng id → mong SỐNG |
| LUOI-3 B3p | `BV-AU4-L3-B3P-BO-SAN-0` | `tienDaTra.js:87` | `Math.max(0, Math.min(goc, Number(don.total \|\| 0) - Number(so.nhan)))` → `Math.min(goc, …)` (đền cũ > total → hoàn ÂM) | cùng neo AUDIT-3 `BV-AU3-GOI2-BO-TRAN-DA-NHAN` (bỏ cả trần), lỗi khác; mọi chỗ khác của `soTienHoanGoi` (`:77–89`) đã có đột biến GOI-2 / AUDIT-3 (grep `(T, "` lượt này) | B3p chỉ có nhận = total, không > total → mong SỐNG; tự tính lúc làm, đường thật = dữ liệu đền trước P26c |

D2 cùng file (khuôn AUDIT-3): `D2-AU4-sai-chuoi` → HỎNG · `D2-AU4-da-biet` (= neo `BV-A2-bo-tra-signup`, cách `p20`) → BẮT · `D2-AU4-vo-hai` (chú thích
`// 1. Tạo đơn hàng`) → SỐNG · `D2-AU4-sap` → HỎNG. Đếm: P20b 4 · BAN-HANG-1 4 · LUOI-3 5–6 + 4 D2 ≈ 18. SỐNG ở chỗ tiền / ví / gói / kho = NẶNG
(`bao_cao.md`, kèm ca đề xuất đã TỰ TÍNH số trên gốc và trên đột biến — bài học LUOI-3).

## 5. A4 — `viec/AUDIT-4/kiem_neo.py` (chép AUDIT-3, ~+20) · lách
- Thêm bộ: BAN-HANG-1 (cắt `\ndef ap(`, `(tên, [(file, cũ, mới, n)], mẫu)`, file từ `server/`), P20b (cắt `\ndef ban_sao(`, file từ gốc kho),
  LUOI-3 (tên phải có trong `viec/AUDIT-3/dot_bien.py`; mẫu `✗ M1a …` phải thấy trong `thu_P26c.js` / `thu_GOI1.js`), TU-CHAY-6 (cắt `\ndef ban_sao(`,
  `(tên, file, [(cũ, mới, n)], [bài], mẫu)`), AUDIT-4 `dot_bien.py`. `RUA_CO_Y` thêm 2 dòng mục 0 (BAN-HANG-1 thay cổng thẻ) — dòng
  `BV-AU3-SL-THE-BO-CONG` ghi "hồ sơ không ghi — phát hiện AU4-n". Bắt buộc chạy; đầu ra nguyên văn vào `trang_thai.md`.
- `node viec/AUDIT-2/lach.js` chạy lại (mong CHẶN 14 · LỌT ĐÃ BIẾT 1 · LỌT 0); 0 mã mới (mục 0) → không thêm ca lách.

## 6. A5 — phép nhấp nháy `thu_cong.js`
`do_nhap_nhay.py` NHÁP (ngoài kho — người gác chặn `time` / `for`): 5 lần `node tu_chay/thu_cong.js` liên tiếp, rồi 3 lần trong khi một tiến trình
lặp `node cong_cu/thu_gia_lap.js` chạy song song (khởi động trước, dừng sau). Ghi từng lần: thoát, `N phép · M hỏng`, giây; đỏ → chép NGUYÊN dòng ✗.
Đọc `tu_chay/thu_cong.js` (731 dòng) tìm chỗ phụ thuộc thời gian / thư mục tạm dùng chung, ghi phát hiện kèm neo — đã thấy lúc lập kế hoạch:
`:24` `TAM` mkdtemp, dọn ở `:723` chỉ khi chạy tới cuối (không `process.on('exit')`) → bị giết thì sót `thu_cong_*`; `:35` git `timeout: 30000`,
`:85` cài đặt `60000`, `:117` cổng `300000`, `:708` `30000`. Hạn 120 s / bài của bộ kiểm (TU-CHAY-6 Q5) — so số đo. Không sửa `tu_chay/`.

## 7. A6 — đơn rỗng: `viec/AUDIT-4/don_rong.js` (~90 dòng, khuôn khởi động `thu_P26c.js:20–60`: chép `server/` vào thư mục tạm, kho SQLite tạm, SX giả)
Gọi `POST /orders` (nhân viên) với: R1 `items: []` · R2 `items: []` + `membership_buy: {}` · R3 `items: []` + `package_buy: {}` · R4 `items: {}` (không
phải mảng) + thẻ đủ · R5 1 món + mã giảm 100 % (tổng 0) · R6 K5 chỉ mua thẻ đủ (`items: []`) · R7 K5 chỉ mua gói đủ · R8 K5 lấy từ gói (0đ). Mỗi
ca 200 → đọc `pos_orders` (subtotal, total, số dòng), `GET /reports/daily` + `/sales` (đếm đơn, doanh thu trước / sau), sổ điểm, `pos_balance_transactions`.
Mức: tạo đơn rỗng 0đ không vào tiền = NHẸ (rác); doanh thu / điểm / ví sai = NẶNG-code. Kết quả + số trước / sau vào `trang_thai.md` (A6).
Đường song song (K4): `discount-codes.js` `/validate` (`:63`) và `/:id/increment-usage` (`:340`) không qua cổng P20b — ghi phát hiện (UI báo mã hợp lệ,
máy chủ 400 lúc tạo đơn; route tăng `used_count` không kiểm) — đọc kỹ lúc làm, không sửa.

## 8. D — sản phẩm
- D1 `bao_cao.md` ≤ 200 dòng: kết luận một dòng (đạt / chưa đạt điểm dừng = 0 NẶNG code lẫn lưới) · bảng `AU4-<n>` (mức · file:dòng HEAD · lệnh thấy
  lại · đề xuất khoá) · tỷ lệ BẮT/SỐNG/HỎNG/LẠC theo nhóm, cột AUDIT-3 · mục "Đề xuất bộ khung" (BAN-HANG-1: phép tĩnh `:NNNN` K3/K4; TU-CHAY-6 Q5:
  chia lượt `thu_cong`) — không làm.
- D2 `bang_chung_do.txt`: A1 ba ca đỏ (luật cũ đỏ / luật mới đúng); `dot_bien.py` D2 (HỎNG · BẮT · SỐNG · HỎNG-sập); `--sap` mới; `--tu-thu`.
  Phiếu "Bài thử đỏ: không" → không dòng `SỐ CA`.
- D3 `npm test` + `--day-du` xanh ở cuối; `git status --porcelain --untracked-files=all` so trước / sau MỌI lệnh công cụ (in "✓ kho thật không đổi");
  thư mục tạm: mọi công cụ dùng `mkdtemp` + `atexit` / `finally` + TMPDIR riêng cho bài con; thử ngắt `timeout -s INT 15 python3 viec/AUDIT-4/boc.py
  GOI-1` → đếm `/tmp/goi1_db_*`, `/tmp/audit*` trước / sau. Còn sót (người gác chặn `rm` ngoài nháp — RM-NHAP) → ghi lệnh dọn cho chủ quán.
  `git diff --stat d8e256e HEAD -- ':!viec/AUDIT-4/'` rỗng.

## 9. Đường song song (K4) · luồng hợp lệ (K5)
- Việc không đổi code chạy thật → không luồng quầy nào bị chặn. Công cụ chỉ ghi bản sao trong thư mục tạm (kiểm `realpath`).
- K4 A3: cổng P20b có MỘT chỗ dùng (`orders.js:516–519`); `kiemDonCuaMa` dùng ở `/claim`, `/nhan-diem` (thu_P20 / thu_P21 + AUDIT-1 nhóm P20 phủ);
  hai route `discount-codes.js` không qua cổng (mục 7). Cổng thẻ một chỗ (`:190`), khối dòng thẻ / ghi thẻ sau cổng là tập con (BAN-HANG-1
  `trang_thai.md:85`, grep lại lúc làm). `tienDaTraTheoDong` 3 chỗ gọi (`damages.js:173` chanTren, `tienDaTra.js:39`, `:77`) → đột biến
  `CHAN-TREN-CA-HOAN` canh cả huỷ lẫn kết thúc gói. `vuotTheoLoai` 2 chỗ gọi (`orders.js` mua + lấy — grep lúc làm).
- K5 A3: mỗi đột biến chiều "chặn oan" (`LOAI-CHAN-BANG`, `CHAN-TREN-CA-HOAN`, `HAN-29D`) có ca K5 tương ứng ghi ở cột "ca mong bắt".
- Ca "hai người cùng bấm": việc không thêm đường tiền; chồng nhau đã có A5j (`thu_P26c.js`), B3i (`thu_GOI1.js`) — A2 chạy lại các bộ đó.

## 10. Ca thử ↔ nghiệm thu (1-1)
| mục | chứng minh |
|---|---|
| A1 | `boc.py --tu-thu` (3 phép: mới ĐẠT, `--cua3` ĐỎ) + `--sap` (gồm `DOSAP-KIEM`, NEM- trong `xau`) → `bang_chung_do.txt`; `git diff --stat d8e256e HEAD -- viec/AUDIT-3` rỗng |
| A2 | `a2_bang.md` mọi bộ của bảng mục 3, cột AUDIT-3 / N11 / vì sao khác; `--so-luoi3` "khớp" 10/10 |
| A3 | `viec/AUDIT-4/dot_bien.py` (P20b 4 · BAN-HANG-1 4 · LUOI-3 ≥ 5, đối chứng 3 cách) — bảng kết quả `trang_thai.md`; SỐNG tiền = NẶNG trong `bao_cao.md` |
| A4 | `python3 viec/AUDIT-4/kiem_neo.py` + `node viec/AUDIT-2/lach.js` đầu ra nguyên văn trong `trang_thai.md` |
| A5 | bảng 8 lần chạy (thoát · phép · hỏng · giây · máy bận/rảnh) + phát hiện có neo trong `trang_thai.md` |
| A6 | `node viec/AUDIT-4/don_rong.js` đầu ra nguyên văn + mức từng ca |
| D1 / D2 / D3 | `bao_cao.md` · `bang_chung_do.txt` · dòng `npm test`, `--day-du`, `git status`, `git diff --stat`, thư mục tạm trong `trang_thai.md` |

## 11. Thời gian máy (ước từ số đo mục 0 + AUDIT-3, chạy RIÊNG tuần tự)
| nhóm | ước |
|---|---|
| A1 `--tu-thu` (gồm 1 lần thu_gia_lap đủ ~50 s) + `--sap` mới + `--sap --cua3` (mỗi lần gồm khung AUDIT-2 cách `kiem` ~3 lần × ~100 s) | ~15 phút |
| A2 (bảng mục 3: 60 + 20 + 1000 + 1200 + 420 + 750 + 712 + 70 + 850) | ~85 phút |
| A3 ~18 đột biến + 3 đối chứng (~3–6 s mỗi cái, `-j 4`) | ~2 phút |
| A4 kiem_neo + lach | < 1 phút |
| A5 5 × ~85–125 s + 3 × máy bận (~120–180 s) | ~17 phút |
| A6 | < 1 phút |
| D3 `npm test` + `--day-du` (AUDIT-3: 97 s + ~190 s) | ~5 phút |
| **tổng** | **~125 phút** (< 180, không cần cắt). Máy chậm 1,5× (TU-CHAY-6 thấy thu_cong 68 → 123 s trong ngày) → ~190 phút: cắt bằng bỏ chạy lại AUDIT-1 A3 / B1 / D1 qua `--khung` (không đổi code các nhóm đó từ AUDIT-3 trừ D1 P20 — chạy riêng D1) ≈ −12 phút, ghi rõ |

## 12. Câu hỏi (chờ chủ quán trả lời trong lời duyệt)
1. **Ngân sách `boc.py`**: phiếu ~30 dòng cho vá AU3-22…24. A2 "qua bọc đối chứng" còn cần bọc các bộ AUDIT-3 chưa bọc / bộ mới: bb, LUOI-1, TACH-GL,
   BAN-HANG-1, P20b (~40 dòng) + `--tu-thu` / `--cua3` cho ca đỏ (~20) → ~90 dòng. (a) làm đủ (chất lượng trước; mặc định); (b) cắt: bb / TACH-GL /
   LUOI-1 chạy thẳng + `--xep` (cận dưới như AUDIT-3, ghi CHƯA KIỂM đỏ-rồi-sập ẩn) → ~55 dòng.
2. **Mức của SỐNG chỉ đi qua API trực tiếp**: `VS-AU4-P20B-TRA-MA-THO` (cổng P20b tra mã khách gõ chưa trim) — quầy gửi mã chuẩn lấy từ `/validate`
   (`Sales.jsx:735`), nên chỉ lộ khi gọi API thẳng. Nếu SỐNG: (a) NẶNG-lưới theo luật AUDIT-3 "SỐNG tiền = NẶNG, không hạ mức" (mặc định); (b) NHẸ-lưới
   kèm đường thật đã truy.
3. **Phiếu A3 "bỏ `claimed_at IS NOT NULL`"** trùng đúng đột biến có sẵn `VS-A2-tra-ca-ma-chua-claim` của P20b (chạy ở A2). Mặc định: không lặp, A3 làm
   chiều ngược (`IS NULL`). Chủ quán muốn lặp nguyên trong bộ độc lập thì ghi lại.

## 13. Soát kế hoạch (agent phụ, chỉ đọc)
(chờ — ghi kết quả + sửa trước khi commit)
