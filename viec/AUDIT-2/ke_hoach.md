# AUDIT-2 — kế hoạch (chờ chủ quán duyệt)

Việc CHỈ KIỂM + BÁO CÁO. Mọi file sinh ra nằm trong `viec/AUDIT-2/`; không đổi một byte ngoài thư mục này. Định nghĩa
BẮT / SỐNG / HỎNG / LẠC / NẶNG / NHẸ như `viec/AUDIT-1/phieu.md` (thêm TREO = quá giờ, như công cụ AUDIT-1).

## 0. Số đo lúc lập kế hoạch (HEAD `4d175bc`, 12.10.2026, máy mây 4 lõi, đo RIÊNG trong lượt này)

| Thứ | Số | Nguồn / lệnh |
|---|---|---|
| giả lập đủ (29 KB, 4 lượt) | 24,3 s · ĐẠT | `node cong_cu/gia_lap/chay.js` |
| `thu_gia_lap.js` đủ | 38 s · 130 đạt | `node cong_cu/thu_gia_lap.js` |
| `thu_gia_lap.js --chi-du-lieu-tay` | 0,85 s · 69 đạt | đường bắt đột biến "nới phép" `bat_bien.js` (có sẵn từ LUOI-1) |
| AUDIT-1 nhóm G3 (4) | 60 s · BẮT 1 · SỐNG 1 · HỎNG 1 · LẠC 1 · "✓ kho thật không đổi" | `python3 viec/AUDIT-1/dot_bien.py G3 -j 3` |
| mẫu D1 + B1 + A3 + C2F (1 mỗi loại, `-j 1`, kèm kiểm sạch 4 loại × 3) | 158 s tổng (kiểm sạch ~80 s); từng đột biến: A3 5 s · B1 47 s · D1 1 s · C2F 23 s — 4/4 BẮT. Cuối in "✗ KHO BẨN": truy nguyên → `git status` chỉ có `?? viec/AUDIT-2/ke_hoach.md`, `trang_thai.md` do chính tôi tạo TRONG lúc đo (khung lọc `viec/AUDIT-1/`, không lọc `viec/AUDIT-2/`); không sót `/tmp/audit1_*`. → mục 1: bọc lọc thêm `viec/AUDIT-2/`, và KHÔNG ghi file trong lúc bộ đo chạy | `python3 viec/AUDIT-1/dot_bien.py D1-A1-fffd B1-A6-bo-phamvi A3-GITADD-bo-A C2F-orders-05-update-quay -j 1` |
| mẫu HOC-1 một đột biến `thu_cong` | 54 s · ĐỎ đúng chỗ (4 dòng "HOC-1 A1") | `python3 viec/HOC-1/dot_bien.py MA1` |
| neo mọi bộ cũ | AUDIT-1 173/174 (HỎNG `G3-sai-chuoi` cố ý) · P26b 59/59 · HOC-1 20/20 · HOC-2 25/26 (HỎNG `VS-E3-phien-ban-cu`, rữa 1.4.0→1.5.0) · TU-CHAY-4 10/10 · HOC-2b 26/26 | `python3 viec/HOC-2b/kiem_neo.py` |
| bộ đột biến chưa được `kiem_neo` rà | `viec/LUOI-1/dot_bien.py` (80), `viec/TACH-GL/dot_bien.py` (29), `viec/TU-CHAY-5/dot_bien.py` (34); `do_*.js`: `LUOI-1/do_thoi_gian.js`, `TACH-GL/do_chia.js`, `do_chia_e2.js`, `do_cpu.js` | `ls viec/*/dot_bien.py viec/*/do_*.js` |
| `bat_bien.js` (16 bất biến, 290 dòng) | JS: `\|\|` 28 · `&&` 15 · `===` 17 · `!==` 26 · `Math.abs` 3; SQL: `OR` 5 · `AND` 20 · `<>` 5 | đếm bằng script nháp (bỏ chú thích) |
| ca chồng nhau trong `kich_ban.js` | 22 chỗ gọi `c.chong(` / `moc.truocTx =` / `Promise.all([` (một chỗ `buoc(` gói 6 bước, một vòng lặp :306) → ~27 ca `c.mong` | `grep -n "c.chong(\|moc.truocTx = \|Promise.all(\["` |
| mã luật người gác | 76 (AUDIT-1 đo 74; thêm GIT-RM / GIT-KEO ở TU-CHAY-5) | `require('./tu_chay/nguoi_gac.js').LUAT.length` |

Trước đây (để so, KHÔNG dùng làm ước lượng thay số đo): C2F 87 `-j 4` = 1910–1926 s (LUOI-1, 10.10, TRƯỚC khi giả lập chia
lượt — giả lập 68 s → 24 s); AUDIT-1 103 đột biến 1188 s (HOC-2b D5); `thu_cong` 94,8 s (TU-CHAY-5).

## 1. Nguyên tắc chung (đơn giản nhất mà vẫn đúng)

- **Dùng lại công cụ có sẵn, không dựng khung đo mới**: A1 chạy nguyên `viec/AUDIT-1/dot_bien.py`, `viec/HOC-1/dot_bien.py`,
  `viec/HOC-2/dot_bien.py`. Viết mới đúng ba thứ: `dot_bien_bb.py` (B1 — chưa công cụ nào sinh đột biến từ `bat_bien.js`),
  `dot_bien.py` (chỉ đột biến MỚI của A3 + B3), `kiem_neo.py` (C1 — mở rộng bản HOC-2b). Thêm `lach.js` nhỏ cho A3 (dữ liệu
  lách dạng JSON, nạp bản sao người gác như `viec/AUDIT-1/lach.js`).
- **`viec/AUDIT-2/dot_bien.py` (phương án A, chọn):** NẠP khung `viec/AUDIT-1/dot_bien.py` bằng `importlib` (dùng lại
  `cham`, `kiem_sach`, `anh_kho`, `LENH`, dọn thư mục tạm + SIGINT/SIGTERM), thay bảng `DOT_BIEN` bằng bảng của AUDIT-2 rồi gọi
  `main()` của khung. ~60 dòng khung + bảng. Phương án B: chép khung (~200 dòng) — trùng lặp, bỏ. Rủi ro A: khung AUDIT-1 lọc
  `git status` theo `viec/AUDIT-1/` — AUDIT-2 không ghi gì vào kho lúc chạy (đầu ra in ra màn hình / `--json` vào nháp) nên
  ĐỦ: đo mẫu ngày 12.10 khung báo "KHO BẨN" OAN vì chính file `viec/AUDIT-2/*.md` tạo trong lúc chạy (mục 0) → bọc
  `anh_kho` của module đã nạp, lọc thêm dòng `viec/AUDIT-2/` (không sửa file AUDIT-1); vẫn giữ luật không ghi file khi đo.
- **Bản sao**: chỉ trong thư mục tạm (khung AUDIT-1: `mkdtemp`, xoá trong `finally` + SIGINT/SIGTERM). `dot_bien_bb.py` làm y
  như vậy (khuôn `viec/LUOI-1/dot_bien.py`: chép THẬT `server/`, `cong_cu/`, `tu_chay/cau_hinh.json`, kiểm `realpath` đích
  nằm trong thư mục tạm trước khi ghi — K5/HOC-2b).
- **Đo RIÊNG, tuần tự từng bộ nặng**: không chạy hai bộ cùng lúc; trong một bộ `-j` theo số đo (mục 6). Sau MỖI lần chạy:
  `git status --short` sạch (ghi vào `trang_thai.md`), không sót `/tmp/audit1_*`, `/tmp/au2bb_*`.
- **C2 (bản sao CẢ KHO `git archive`)**: công cụ của việc này KHÔNG cần — mọi đột biến chạy trên HEAD, bản sao dựng từ cây
  làm việc sạch như AUDIT-1 / LUOI-1. → chỉ ghi đề xuất (mục 5), không làm.

## 2. Nhóm A

### A1 — chạy lại đủ bộ cũ trên HEAD
- `python3 viec/AUDIT-1/dot_bien.py G3 A3 B1 C2 D1 C2F -j 3 --json <scratchpad NGOÀI kho>/a1_audit1.json` — ĐỦ 174 (nhóm thật
  trong bảng: G3 4 · A3 16 · B1 8 · C2 3 · D1 57 · C2F 86 sinh từ HEAD; chạy không tham số bỏ G3 nên liệt kê nhóm). Khung AUDIT-1 lọc
  `git status` theo `viec/AUDIT-1/` → KHÔNG ghi file nào trong kho khi bộ đang chạy (đo mẫu đã báo KHO BẨN oan vì việc này). Danh sách chuyển từ HOC-2b D5 (3): 71 AUDIT-1 (A3 16 · B1 8 · C2 1 · C2F 46)
  nằm trong lần chạy này; 14 HOC-1 + 23 HOC-2 chạy bằng `python3 viec/HOC-1/dot_bien.py` / `viec/HOC-2/dot_bien.py` (đủ bộ,
  kể cả `M0-*` đối chứng — hai công cụ này tuần tự sẵn).
- Tên C2F đánh số theo VỊ TRÍ trong file (`dot_bien.py:196–197`), sinh lại từ `server/` HEAD → so với lần trước bằng TÊN + CHUỖI NEO
  (neo cũ lấy từ `git show <commit đo trước>:server/routes/…` qua cùng hàm `sinh_c2full`); tên trượt thì ghép theo neo, ghi rõ.
- Bảng `a1_bang.md`: mỗi tên một dòng BẮT/SỐNG/HỎNG/LẠC/TREO + kết quả lần trước (nguồn: `viec/LUOI-1/trang_thai.md` C1/C2
  cho C2F, `viec/HOC-2b/trang_thai.md` D5 cho phần còn lại) + cột "giải thích" khi khác. Đã biết trước sẽ khác: 22 C2F
  SỐNG→BẮT ở LUOI-1 (đã ghi), `G3-sai-chuoi` HỎNG cố ý, `VS-E3-phien-ban-cu` HỎNG (neo `tu-chay 1.4.0` — Phát hiện 6 của
  TU-CHAY-5). HOC-1 / HOC-2 trước đây chỉ kiểm neo (D5 phần 3) → lần này lần đầu chạy thật trên 1.5.0: khác mong đợi thì
  truy nguyên (K2: in chuỗi thật đang có) trước khi kết luận.
- Đột biến lỗi do môi trường (TREO, hoặc LẠC lần đầu) chạy lại `-j 1` MỘT lần; vẫn vậy thì ghi nguyên.

### A2 — 23 C2F còn SỐNG sau LUOI-1
Danh sách = 45 SỐNG gốc − 22 C2F BẮT ở LUOI-1 (`viec/LUOI-1/trang_thai.md:73–93` 20 C2F + `:95` 2 C2F; `:75` là C2, không tính), đối chiếu lại bằng kết quả A1 (không chép
số). Mỗi cái: đọc route + middleware + khoá trong THÂN hàm (không chỉ nhãn `_middleware` — bài học AUDIT-1 vòng 2: route
`cancel` quyền quầy mà nhãn ghi admin), xếp NẶNG/NHẸ theo câu "ở quầy sẽ sai gì". NẶNG → đề xuất KB / ca (file, tên KB,
bất biến nào đỏ). Bảng `a2_bang.md`.

### A3 — phần AUDIT-1 CHƯA KIỂM
- **Bundle D2–D5** (`kiem_tra_truoc_khi_giao.js:266, 273, 281, 310`): bốn đột biến mới trong `viec/AUDIT-2/dot_bien.py`
  trên bản sao kho (cách chạy `kiem`, D5 dùng `kiemdd` = `--day-du`). Tên file bundle có băm → đọc tên thật bằng
  `glob('client/dist/assets/index-*.js')` LÚC NẠP bảng (tất định trên một HEAD; đổi băm thì đột biến tự theo, không rữa).
  D2 chèn dấu vết bản dev React; D3 đổi đường dẫn bundle trong `index.html`; D4 xoá chữ `sessionExpiredHandled` khỏi bundle
  (phép tên "dấu vết POS-ERRHANDLING-v1" nhưng thật tìm chữ này — `kiem_tra_truoc_khi_giao.js:281–282`; soát kế hoạch bắt);
  D5 sửa một dòng `client/src/` CÓ HIỆU LỰC (đổi chuỗi hiển thị được dùng — không tree-shake mất, ĐIỂM MÙ E6 `:289–291`),
  không build lại. Glob tên bundle tính theo `GOC`, không theo cwd. D5 chép `client/node_modules` × (1 + 3 kiểm sạch) — đo dung
  lượng trước, chạy riêng `-j 1`. Mẫu = đúng câu `✗` của từng phép.
- **Logic loyalty / gói** (khác C2F: không bỏ CÂU GHI mà sai PHÉP TÍNH / PHÉP CHẶN): rà `server/routes/loyalty.js`,
  `packages.js` và nhánh gói/thẻ của `orders.js` (45 dòng khớp `redeem|points_cost|balance <|< cost|total_qty|delivered_qty`
  — grep lúc lập kế hoạch), mỗi phép so / phép tính tiền-điểm-lượt một đột biến VS (đảo / nới so sánh, ±1 lượt, bỏ nhân hệ
  số). Ước ~15. Chạy cách `c2full` của khung (giả lập + thu_P26a + thu_P26b, SỐNG thì thêm thu_P20 + thu_P21). SỐNG đụng
  tiền/điểm/gói = phát hiện, xếp NẶNG/NHẸ như A2.
- **Mã người gác chưa có ca lách** (30 mã ở `viec/AUDIT-1/a_bang_luat.md` A4b + mã mới GIT-RM, GIT-KEO…: đếm lại từ `LUAT`):
  MẶC ĐỊNH là đối chiếu luật với ca CÓ SẴN trong `thu_nguoi_gac.js` (bảng mã → tên ca chặn + ca CHO gần nhất). Chỉ mã nào
  chưa có ca nào mà dựng được một lệnh lách có nghĩa mới viết — KHÔNG viết hàng loạt (phiếu A3). `viec/AUDIT-2/lach.json` =
  các lệnh lách tối thiểu đó (chuỗi), `viec/AUDIT-2/lach.js` nạp BẢN SAO `nguoi_gac.js` trong
  thư mục tạm, dựng kho giả như `viec/AUDIT-1/lach.js`, gọi `xet()` — không thực thi lệnh nào. Mã thuộc loại "CHO-qua" /
  "điều kiện môi trường" (A4b) thì lệnh lách là dạng nguy hiểm đội lốt dạng được CHO (vd TaskStop lên tác vụ không phải của
  phiên, `git branch` tạo nhánh khác); không dựng được lệnh nào có nghĩa → ghi lý do, đối chiếu ca có sẵn trong
  `thu_nguoi_gac.js`. LỌT = phát hiện, ghi nguyên chuỗi.

## 3. Nhóm B

### B1 — `viec/AUDIT-2/dot_bien_bb.py` (ngân sách 150–250 dòng)
**Phương án A (chọn): bộ quét chữ trong Python, không thư viện mới.** Đọc `cong_cu/gia_lap/bat_bien.js` của HEAD, bỏ chú
thích (giữ độ dài để giữ số dòng), tách khối `async I<n>(` → mỗi đột biến biết bất biến chủ.
- **Bỏ vế JS** (`||`, `&&`): với mỗi chuỗi toán tử cùng loại cùng độ sâu ngoặc trong một biểu thức điều kiện (`if (…)`,
  `filter((r) => …)`, `return …`, `const x = …;`, `? :`), mỗi vế một đột biến: vế của `||` → `false`, của `&&` → `true`
  (bọc ngoặc). Biên vế: dò ngoặc `()[]{}` + dừng ở `,` `;` `?` `:` `=>` và toán tử ưu tiên thấp hơn. Chuỗi có vế là GIÁ TRỊ
  MẶC ĐỊNH (`x || 0`, `|| {}`, `|| []`, `|| ''`) không phải phép logic → không sinh, in ở `--liet-ke` dòng "bỏ qua: mặc định".
- **Bỏ vế SQL** (`OR`, `AND` trong chuỗi `` `…` `` sau `WHERE` / `ON` / `WHEN` / `HAVING`): vế của `OR` → `1=0`, của
  `AND` → `1=1`. Biên vế: ngoặc + từ khoá mệnh đề (`WHERE ON WHEN THEN ELSE END GROUP ORDER LIMIT SELECT FROM JOIN`).
  Không có `BETWEEN` trong file (kiểm lúc chạy: gặp thì dừng, báo — không đoán).
- **Một chiều** cho phép so BẰNG / KHÁC trên tiền / số lượng / điểm: JS `===` `!==` `!=` và SQL `=` `<>` khi một vế chứa
  tên trong danh sách từ tiền-lượng-điểm cố định ở đầu file (`amount total balance price points cost qty quantity debt value
  used_count usage_limit so_tien diem da_lay delivered tong length n dem soNo chuaXong …`), loại id / phone / status / type.
  `a === b` → `a <= b` (chỉ bắt lệch dương) và `a >= b` (chỉ bắt lệch âm); `a !== b` → `a > b` / `a < b`;
  `Math.abs(x - y) > t` → `(x - y) > t` / `(y - x) > t`; SQL tương tự. Danh sách in đủ ở `--liet-ke` để người soát thấy phép
  nào bị loại.
- **Khớp tên trọn từ** (không chuỗi con: `n` không khớp trong `n.points`… chỉ khớp tên đủ). Một chiều trên giá trị có thể
  null/undefined (`soNo.get(vt)`, SQL `<>` gặp NULL) đổi nghĩa khác ý → `--liet-ke` đánh dấu "có thể null", SỐNG ở đó xét tay.
- **Tên tất định**: `BB-I<n>-<js|sql>-<k>-<bo-ve|duong|am>` (k = thứ tự trong bất biến theo vị trí), in kèm
  `bat_bien.js:<dòng>`. Neo áp dụng = (vị trí, chuỗi gốc) — áp xong phải khớp đúng 1 lần chuỗi gốc tại vị trí đó, không thì HỎNG.
- **Hai loại đột biến**: NỚI (vế `||`/`OR` → false, một chiều) chỉ bắt được bằng dữ liệu SAI có chủ đích → tầng 1; SIẾT
  (vế `&&`/`AND` → true) làm đỏ dữ liệu ĐÚNG → tầng 2. `--chi-du-lieu-tay` chỉ phủ I2, I7, I8, I12–I17 (`thu_gia_lap.js:377–394,
  441–510`): đột biến NỚI ở I1, I3–I6, I9, I11 không có ca tay → chạy tầng 1 (bằng chứng xanh) + tầng 2 MỘT lượt để lộ LẠC;
  SỐNG thì xếp (a). Tiết kiệm: NỚI không chạy tầng 2 khi tầng 1 đã xanh trừ để dò LẠC (giả lập đúng không bao giờ lệch).
- **Chấm**: tầng 1 `node cong_cu/thu_gia_lap.js --chi-du-lieu-tay` trên bản sao (0,85 s) — thoát ≠ 0 và có dòng `✗` khớp `\bI<n>\b`
  (không dính I1 vào I12–I17) và KHÔNG chứa `SẬP` (`thu_gia_lap.js:519` in `✗ I12 … — SẬP:` khi SQL hỏng = LẠC) → BẮT; dòng ✗
  của ca SẠCH (bộ sạch lệch) ghi nhãn riêng "BẮT-sạch" (đột biến siết); tầng 2 (tầng 1 xanh) `node cong_cu/gia_lap/chay.js` (24 s) — có dòng `→ I<n>:` → BẮT
  (siết vế làm đỏ dữ liệu đúng = vế cần thiết). Thoát ≠ 0 mà không khớp đúng `I<n>` (sập, lỗi cú pháp, bất biến khác) = LẠC.
  Mọi tầng xanh = SỐNG. Kiểm sạch: bản sao không đột biến chạy cả hai tầng 3 lần trước khi chấm, đỏ thì dừng (thoát 4).
- **Tham số**: `-j N`, `--chi <mẫu tiền tố>`, `--liet-ke` (in danh sách + dòng, không chạy), `--json <file>`.
- **D2 trong công cụ** (bốn đột biến chứng minh, tên viết tay, không sinh): `D2-sai-chuoi` (neo không có → HỎNG),
  `D2-da-biet` (= `BV-I7-b-no-da-xong` của LUOI-1, đã biết BẮT), `D2-vo-hai` (đổi chữ trong chuỗi mô tả → SỐNG),
  `D2-sap` (cú pháp hỏng → LẠC). Chạy được bằng `--chi D2-`.
**Phương án B:** dựng cây cú pháp bằng `acorn` của `node_modules` (nếu có) — chính xác hơn với JS, nhưng SQL vẫn phải quét chữ,
và phụ thuộc gói gián tiếp (phiếu: không thư viện mới). Bỏ. Rủi ro A: biên vế sai ở biểu thức lạ → đột biến cú pháp hỏng =
LẠC (thấy được, không bao giờ đếm BẮT); `--liet-ke` cho đọc tay toàn bộ trước khi chạy.

### B2 — chạy đủ + xếp loại SỐNG
Ước ~110–140 đột biến (đếm thật ở `--liet-ke`). Mỗi SỐNG xếp đúng một loại trong `b2_bang.md`: (a) thiếu ca dữ liệu tay →
đề xuất ca cho `thu_gia_lap.js` (so bằng tiền: đủ ca +1 và −1), (b) vế THỪA → dẫn code thật (file:dòng) + ca / lập luận chứng
minh, (c) code quầy đang SAI → NẶNG, đi thẳng vào `bao_cao.md`. Đột biến TƯƠNG ĐƯƠNG nghĩa (vd `count !== 0` → `count < 0` với số
  đếm không âm) xếp (b) kèm lập luận + dòng code chứng minh miền giá trị. KHÔNG sửa `bat_bien.js` / `thu_gia_lap.js`.

### B3 — ca chồng nhau ↔ đột biến BỎ KHOÁ
Bảng `b3_bang.md`: mỗi ca chồng trong `kich_ban.js` (file:dòng, KB) → khoá máy chủ nó canh (file:dòng: điều kiện trong
`UPDATE … WHERE`, `changes !== 1`, `dangChay`, kiểm số dư trong giao dịch…) → đột biến bỏ khoá. Đã có thì dẫn tên + bộ (đã
thấy: P26b `huy-khong-kiem-changes`, `duyet-bo-chiem-yeu-cau`, `duyet-khong-kiem-changes`, `tu-choi-bo-dieu-kien`; LUOI-1
`VS-SRV-bo-khoa-dangChay`; AUDIT-1 `G3-da-biet`/`D1-E7-paydebt`, `D1-E-claim-chiem`, `D1-E-ndiem-chiem`…) và chạy lại đúng tên
đó; Danh sách ca chồng ĐỌC TAY đủ 29 KB (grep chỉ là điểm bắt đầu: ca trong vòng lặp `:287`, `:306` hoặc helper khác dễ sót).
Chưa có thì thêm `BK-<KB>-<khoá>` vào `viec/AUDIT-2/dot_bien.py` (cách chạy `kb<n>` = `--den-kb n`, mẫu = câu `c.mong` của
đúng ca chồng). Ca không có khoá tương ứng để bỏ → ghi lý do. SỐNG → Phát hiện kèm đột biến. Lưu ý: `LENH['kb<n>']` của khung
AUDIT-1 chỉ tạo tới 18 → bảng AUDIT-2 tự thêm `kb19`–`kb29` vào `LENH` của module đã nạp.

### B4 — đề xuất câu (không sửa)
Ghi trong `bao_cao.md` mục Đề xuất: câu thêm vào `tu_chay/skill_lam_viec.md` bước 4 và `tu_chay/lenh_ra_soat.md` (đổi
`bat_bien.js` → chạy `python3 viec/AUDIT-2/dot_bien_bb.py -j 4` đủ, ghi số BẮT/SỐNG/LẠC; người soát kiểm có dòng đó) + đề xuất
dời công cụ về `cong_cu/gia_lap/` (như TU-CHAY-5 A1 định) ở việc sau.

## 4. Nhóm C — `viec/AUDIT-2/kiem_neo.py`
Mở rộng bản HOC-2b (~56 dòng → ~+40): thêm bộ `LUOI-1`, `TACH-GL`, `TU-CHAY-5` (cả `chay_goc.py` nếu có bảng neo), `AUDIT-2` (chính `dot_bien.py` +
`dot_bien_bb.py` ở chế độ liệt kê) và mọi `viec/*/do_*.js` có bảng neo (đọc hằng neo bằng regex, so số lần khớp). Rà thêm
MẪU nhận kết quả: lấy phần CHỮ CỐ ĐỊNH dài nhất của mẫu (bỏ ký tự regex, cắt ở `\d`, `.*`, `(…|…)`), tìm trong file nguồn
in ra câu đó (bài thử / bộ kiểm / giả lập — kể cả nguồn có `${}`: so phần chữ quanh chỗ nội suy); không thấy = "mẫu rữa?",
xem tay rồi mới kết luận (K2). Bộ không có mẫu tĩnh (HOC-1/HOC-2 dùng chuỗi con) xét cùng cách.
Nạp bảng AUDIT-2 (`importlib` khung AUDIT-1 → khung tạo `GOC_TAM` lúc import) → `kiem_neo.py` dọn cả `GOC_TAM` của module con. Danh sách rữa CỐ Ý ghi trong file kèm lý do (`G3-sai-chuoi`,
`D2-sai-chuoi`, `VS-E3-phien-ban-cu` → đề xuất đổi neo sang `tu-chay 1.5.0`, không sửa file HOC-2). Chạy BẮT BUỘC, kết quả
vào `trang_thai.md`. Không đưa vào `npm test` (như TU-CHAY-5 D5).

## 5. Nhóm D — sản phẩm
- **D1** `bao_cao.md` ≤ 200 dòng: bảng `AU2-<n>` · NẶNG/NHẸ · file:dòng ở HEAD · lệnh chạy lại · đề xuất khoá (file, ca đỏ) ·
  cột "trúng chỗ P26c" (đối chiếu `Phạm vi` phiếu P26c lúc viết báo cáo). Cuối: tỷ lệ BẮT/SỐNG/HỎNG/LẠC theo nhóm (A1 từng
  bộ, A3, B1–B3). Chi tiết ở file phụ `a1_bang.md`, `a2_bang.md`, `a3_bang.md`, `b2_bang.md`, `b3_bang.md`. Đề xuất C2
  (`git archive` cả kho — chỉ cần khi một công cụ phải đo trên commit KHÁC HEAD, như `chay_goc.py` của TU-CHAY-5).
- **D2** `bang_chung_do.txt`: đầu ra nguyên văn `dot_bien_bb.py --chi D2-` (HỎNG · BẮT · SỐNG · LẠC) và
  `viec/AUDIT-2/dot_bien.py` nhóm `D2` (khung AUDIT-1 dùng lại: một sai chuỗi → HỎNG, một đã biết → BẮT, một vô hại → SỐNG).
  Mọi tên đột biến trong `viec/AUDIT-2/dot_bien.py` (và các tên tay `D2-*` của `dot_bien_bb.py`) có trong `trang_thai.md`.
- `viec/AUDIT-2/dot_bien.py` (bọc khung AUDIT-1): nạp bằng ĐƯỜNG DẪN thật (để `GOC` đúng); tự gắn SIGINT/SIGTERM → `mod.don`
  (khung chỉ gắn khi `__main__`); thêm `LENH` kb19–29 TRƯỚC `main()`; in dòng đầu "AUDIT-2 (khung AUDIT-1)" để
  `bang_chung_do.txt` không gây hiểu lầm.
- **D3** `npm test` + `node kiem_tra_truoc_khi_giao.js --day-du` xanh ở cuối; `git status` sạch sau mỗi lần chạy; thư mục
  tạm xoá kể cả khi ngắt — thử `timeout -s INT 20 python3 viec/AUDIT-2/dot_bien_bb.py --chi D2-da-biet` → không sót
  `/tmp/au2bb_*` (ghi kết quả). `git diff --stat 4d175bc..HEAD -- ':!viec/AUDIT-2/'` rỗng.

## 6. Thời gian máy (đo, không đoán — từng nhóm, chạy RIÊNG tuần tự)

| Nhóm | Cách tính từ số đo mục 0 | Ước |
|---|---|---|
| A1 AUDIT-1 174 | nối tiếp ≈ G3 60 + A3 16×5 + `cong` 12×47 + D1 57 (50 bản rỗng ×~2 s + 7 `!` chạy bài thật ×≤54 s) + C2 3×25 + C2F 87×~30 ≈ 3 800 s; `-j 3` + kiểm sạch ~3 phút | ~25 phút |
| A1 HOC-1 20 + HOC-2 26 (tuần tự sẵn) | `thu_cong` 28 × 54 s + `thu_nguoi_gac` 11 × 9 s + `thu_cong_cu` 7 × 5 s (đếm theo cột bài thử của hai bảng `DB`) | ~28 phút |
| A3 bundle 4 + loyalty/gói ~15 + lách | bundle: 3 × `kiem` ~1 s + D5 `--day-du` ~182 s (+ chép `client/node_modules`); loyalty/gói ~15 × ~30 s / `-j 3`; lách: giây | ~10 phút |
| B1/B2 `dot_bien_bb.py` ~130 | tầng 1: 130 × ~1 s; tầng 2 (chỉ đột biến tầng 1 xanh, ước ≤ 60 %) ~80 × 24 s / `-j 4` (giả lập chủ yếu chờ trễ, ít CPU — `chay.js:22`) | ~10 phút |
| B3 ~20 mới + chạy lại tên đã có | `--den-kb n` vài giây–24 s mỗi cái, `-j 3` + kiểm sạch | ~10 phút |
| C1 `kiem_neo.py` | vài giây | <1 phút |
| D2 + D3 (`npm test`, `--day-du` 181,6 s đo TU-CHAY-5) | | ~8 phút |
| **Tổng** | | **~92 phút (< 180 — không cần cắt)** |

## 7. Câu hỏi (cần chủ quán trả lời trong lời duyệt)
Tổng ~92 phút < 180 → không cần cắt. Không có câu hỏi nghiệp vụ. Ba điểm xin chủ quán xác nhận khi duyệt (mặc định ghi bên):
1. B1 lọc phép so "trên tiền / số lượng / điểm" bằng danh sách TÊN cố định ở đầu `dot_bien_bb.py` (in đủ ở `--liet-ke`), không
   suy luận kiểu — đồng ý? (mặc định: có.)
2. A3 logic loyalty/gói: chọn ~15 phép so / phép tính tiền-điểm-lượt theo đọc code — không đủ mọi dòng. (mặc định: có, liệt kê đủ
   trong `a3_bang.md` những dòng không chọn kèm lý do.)
3. A3 lách: chỉ viết lệnh lách cho mã CHƯA có ca nào trong `thu_nguoi_gac.js`; mã đã có ca thì đối chiếu. (mặc định: có.)

## 8. Đối chiếu nghiệm thu ↔ cách chứng minh (1-1)

| Mục | Bằng chứng sẽ có |
|---|---|
| A1 | `a1_bang.md` (mỗi tên một dòng + lần trước + giải thích) + lệnh + đầu ra tổng ở `trang_thai.md` |
| A2 | `a2_bang.md` 23 dòng NẶNG/NHẸ + đề xuất KB/ca cho mỗi NẶNG |
| A3 | `a3_bang.md`: 4 đột biến bundle, ~15 đột biến logic loyalty/gói, bảng lách (`lach.json` + đầu ra `lach.js`) |
| B1 | `dot_bien_bb.py --liet-ke` (tên + dòng tất định, chạy hai lần so trùng) + D2 của chính nó |
| B2 | `b2_bang.md` mỗi SỐNG đúng một loại (a)/(b)/(c) |
| B3 | `b3_bang.md` mỗi ca chồng ↔ đột biến + kết quả chạy |
| B4 | `bao_cao.md` mục Đề xuất (2 câu) |
| C1 | `kiem_neo.py` + đầu ra trong `trang_thai.md`, danh sách rữa cố ý trong file |
| C2 | `bao_cao.md` mục Đề xuất (không làm — lý do mục 1) |
| D1 | `bao_cao.md` ≤ 200 dòng (`wc -l`) |
| D2 | `bang_chung_do.txt` (cả hai công cụ) + tên đột biến trong `trang_thai.md` |
| D3 | đầu ra `npm test`, `--day-du`, `git status`, thử ngắt, `git diff --stat` ngoài `viec/AUDIT-2/` |

**Luồng hợp lệ phải KHÔNG bị ảnh hưởng (K5):** việc không đổi code chạy thật → không luồng quầy nào đi qua thay đổi. Rủi ro
thật là công cụ ghi xuyên kho: khoá bằng kiểm `realpath` đích (B1), `anh_kho` trước/sau (khung AUDIT-1), `git status` sau
mỗi lần chạy. **Đường song song cần canh (K4):** HOC-1/HOC-2 dùng `tempfile.mkdtemp` hệ thống, không bắt SIGINT — ngắt giữa
chừng có thể sót thư mục `/tmp/dot_bien_*`, `/tmp/hoc2_db_*` (rác /tmp, không đụng kho) → sau mỗi lần chạy kiểm và ghi; bộ
mới của việc này luôn bắt SIGINT/SIGTERM.

## 9. Soát kế hoạch (agent phụ, chỉ đọc)
Agent phụ chỉ đọc soát 12.10 theo 4 câu; đã sửa kế hoạch theo:
- Ngoài phạm vi: không. Sát ranh — `lach.json` hàng loạt (→ mặc định đối chiếu ca có sẵn, A3); `--json` trong kho và sửa
  `trang_thai.md` lúc chạy gây KHO BẨN oan (→ nháp ngoài kho, không ghi khi chạy — chính tôi đã gặp ở đo mẫu); `kiem_neo` nạp
  bảng AUDIT-2 sót `GOC_TAM` của khung (→ dọn).
- Ngắn hơn: đột biến NỚI không cần tầng 2 (→ B1 "Hai loại"); nhóm `C1 E1` không có trong bảng (→ bỏ khỏi lệnh A1).
- Sai / chưa rõ: **D4 tìm `sessionExpiredHandled`, không `POS-ERRHANDLING-v1`** (đã kiểm `kiem_tra_truoc_khi_giao.js:281–282`
  → sửa); D5 phải chọn dòng không bị tree-shake; tên C2F trượt theo vị trí (→ ghép theo neo); số dòng nguồn A2; xếp đột biến
  tương đương; cách rà MẪU ở C1; `chay_goc.py`.
- Rủi ro: `\bI<n>\b` + loại dòng `SẬP` (thu_gia_lap.js:519); SIGINT khi nạp khung; glob theo `GOC`; null trong so một chiều;
  ca chồng trong vòng lặp; dung lượng `kiemdd`. Tất cả đã đưa vào mục 2–5.
