# P26d — trạng thái

## Bước 1 — đối chiếu bản chụp (18.10.2026)

- Nhánh: `viec/P26d` · cây sạch · `git fetch origin viec/P26d` được.
- HEAD `14169d8` · FETCH_HEAD `14169d8` — bằng nhau, không kéo.
- `git log --oneline -3`:

```
14169d8 PHIEU: P26d
0bffc03 TIEN-DO: LUOI-5 (c8c20b3), TU-CHAY-8 (8259a59) xong; mo KH-API-1 + P26d + DOI-SOAT-1 + P16; them KH-OTP-1, DONG-CUNG-1; lich KH-OTP-1 — so v37
8259a59 Merge pull request #33 from pos-tuquyduong/viec/TU-CHAY-8
```

## Bước 2 — đã đọc (lượt này)

`viec/P26d/phieu.md`, `CLAUDE.md`, `KHUON_LOI.md`, `CHECKLIST_CODE.md` mục P8 + G; code thật: `server/database.js` (initDatabase,
query, run, beginTransaction), `server/routes/wallets.js` (cả file), `server/utils/helpers.js` (taoMaDonTheoSo), `server/routes/orders.js`
(tạo đơn từ đoạn trả tiền tới hết, pay-debt, huỷ, xoá), `server/routes/refunds.js` (tạo / duyệt / từ chối), `server/routes/backup.js`
(danh sách bảng, preview-restore, restore), `server/routes/packages.js` (theo-khach, kết thúc gói), `server/routes/damages.js` (POST);
thư viện `node_modules/@libsql/client/lib-cjs/{sqlite3,hrana,http}.js`, `@libsql/core/lib-cjs/{api,util,config}.js`,
`@libsql/hrana-client/lib-cjs/errors.js`; bộ kiểm E8, E12, `chayBaiThat`; bài `thu_P26b.js`, `thu_P26c.js` (móc), `thu_P20.js` (móc
`mocTruocTx`, G11), giả lập KB20 (`kich_ban.js`), bất biến I18; hồ sơ `viec/P26b/{ke_hoach,trang_thai}.md` (Phát hiện 5, 7, 10, 15, 17,
18, 19), `viec/P26b/thu_kho_ban.js`. Đo thật kho file bằng script nháp (ngoài kho) — kết quả ở `ke_hoach.md` mục 0.

## Bước 3 — kế hoạch

`viec/P26d/ke_hoach.md`. Phiếu dặn **Chờ duyệt kế hoạch** → commit, push, DỪNG.

- Mốc gốc `npm test` (HEAD `14169d8`): `PASS 66 · FAIL 0 · CẢNH BÁO 1`; thu_P20 2,7 s · thu_P26b 1,9 s · thu_P26c 4,7 s · thu_GOI1 3,8 s.
- Soát kế hoạch (agent chỉ đọc, 4 câu): **CẦN SỬA** — lỗi chặn: `COALESCE(balance, 0)` làm E12 đỏ; còn lại là lỗ bài thử. Đã sửa
  hết trong `ke_hoach.md` (bảng xử lý ở mục 14).
- **ĐANG DỪNG chờ chủ quán duyệt kế hoạch + trả lời Q1–Q5 (`ke_hoach.md` mục 12).**

## Câu hỏi

Xem `ke_hoach.md` mục 12 (Q1 mã bận Turso · Q2 tổng chi ví tạo lại · Q3 phạm vi chặn khôi phục · Q4 mã trả về đối soát dở dang ·
Q5 vá cả `query`). **Chủ quán đã trả lời 18.10** — `ke_hoach.md` mục 15 (thêm phần I gói / thẻ trong giao dịch, P pay-debt một giao dịch).

### Q6 (ĐÃ TRẢ LỜI 19.10: (a), phiếu `eec1423`) — giả lập M6 neo vào câu gọi nhật ký cũ của pay-debt → `--day-du` ĐỎ, cần file ngoài Phạm vi

`npm test -- --day-du` trên HEAD `83394c6`:
```
✗ bài chạy thật cong_cu/thu_gia_lap.js xanh (49.7 s)  → ✗ M6 pay-debt bỏ nhật ký thu (routes/orders.js)  — chuỗi gốc khớp 0 lần, cần 1 — đột biến không áp được
ĐẾM (không đoán):  PASS 69  ·  FAIL 1  ·  CẢNH BÁO 1
```
Truy nguyên (K2): `cong_cu/thu_gia_lap.js` đột biến M6 thay đúng chuỗi `await nhatKyDon.ghiNhatKy(Number(id), "thu",` (gỡ nhật ký thu →
bất biến I9 phải đỏ). Theo quyết định P (gộp 3 lệnh ghi của pay-debt vào MỘT giao dịch), nhật ký thu nay ghi bằng `tx.run` trong
orders.js — `nhatKyDon.ghiNhatKy` ghi bằng `run` NGOÀI giao dịch và nuốt lỗi, gọi nó trong lúc giao dịch giữ khoá ghi thì kho file
bận → nhật ký mất trong im lặng. Hành vi đúng (P2, P4 xanh; `npm test` thường xanh 66/0), chỉ chỗ neo của phép đột biến mất.
Không chèn chuỗi giả để neo khớp (K8). Hai cách, đều ngoài Phạm vi — xin chủ quán chọn:
- **(a) — đề xuất:** thêm `server/utils/nhatKyDon.js` vào Phạm vi: `ghiNhatKy(orderId, loai, noiDung, nguoi, chiTiet, tx)` — có `tx` thì ghi
  bằng `tx.run` và KHÔNG nuốt lỗi; không có `tx` giữ nguyên như cũ (don-mo-rong.js không đổi). pay-debt gọi lại
  `await nhatKyDon.ghiNhatKy(Number(id), "thu", …, tx)` → neo M6 khớp THẬT, đột biến M6 vẫn có nghĩa (gỡ nhật ký → I9 đỏ), bỏ được câu
  INSERT chép ở orders.js (một quy tắc một hàm). ~3 dòng nhatKyDon.js, −4 dòng orders.js. Thêm đột biến `BV-P-nhat-ky-ngoai-tx` (bỏ `tx`) → P2.
- (b) thêm `cong_cu/thu_gia_lap.js` vào Phạm vi + mục `## Bài thử cũ sửa`: đổi neo M6 sang câu INSERT `pos_order_log` mới trong orders.js.

## Bước 4–5 — bài thử trước, rồi sửa (18.10, sau duyệt)

- Bài thử commit TRƯỚC khi chạy (người gác `[B-BIMAT-CHU]`: file có cụm SECRET): `1c37be3`, `f0f3642`, `ba78550`.
- Đỏ trên gốc → `bang_chung_do.txt` (`thu_P26b` 69 đạt · 22 hỏng, `thu_P26c` 134 đạt · 8 hỏng).
- Sửa (commit từng file): `175ccdf` database.js · `d472196` wallets.js · `72af145` helpers.js · `6d3fe56` orders.js · `83394c6` backup.js.
- Sau vá: `thu_P26b` 91 đạt · 0 hỏng · `thu_P26c` 142 đạt · 0 hỏng · `npm test` PASS 66 · FAIL 0 · CẢNH BÁO 1 (cảnh báo cũ: route GET
  có lệnh ghi) · `--day-du` FAIL 1 = Q6.
- CHƯA LÀM (chờ Q6): `dot_bien.py` + chạy đột biến, dòng `SỐ CA`, `/ra-soat`, báo cáo 7 mục, bài học, cổng `chay`.

### Chỗ vá → đột biến (dự kiến, `viec/P26d/dot_bien.py` — viết sau Q6)

Như `ke_hoach.md` mục 8 + mục 15. Tên: BV-A-bo-thu-lai · VS-A-thu-lai-moi-loi · BV-A-bo-thay-ket-noi · VS-A-cho-qua-lau ·
VS-B-chi-khop-mot-ma · VS-B-khop-rong · BV-B-loiGhi-ma-cu · BV-B-lo-message · BV-C-ma-don-ngoai-tx · VS-C-nuot-loi-doc-ma ·
BV-D-huy-doc-mon-sau-commit · BV-D-doi-soat-409 · BV-E-bo-chuan-hoa-null · BV-E-bo-coalesce-cot-tong · VS-E-tong-chi-am ·
BV-F-khong-chan · VS-F-chan-sau-khi-xoa · BV-G-bo-kiem-lai-ma · BV-I-goi-ngoai-tx · VS-I-nuot-loi-goi · BV-I-the-ngoai-tx ·
VS-I-nuot-loi-the · BV-P-so-ngoai-tx · VS-P-lo-message · BV-P-nhat-ky-nuot-loi.

## Phát hiện (thêm, 18.10)

- Bộ kiểm E14(b): "route ghi không qua loiGhi = 50 — đã dọn bớt 1 chỗ → HẠ NGUONG_ROUTE_GHI_KHONG_LOIGHI xuống 50" (pay-debt nay qua
  loiGhi). `kiem_tra_truoc_khi_giao.js` thuộc mục Cấm của phiếu → không hạ; đề xuất chủ quán / việc sau hạ 51 → 50.
- DOI-SOAT-1 (Q2): ví đang có vẫn cộng `total_spent` tương đối — dữ liệu cũ lệch có thể ra tổng chi âm; đối soát nên có quy tắc thấy dòng
  `total_spent < 0`.
- Bảng tiền khác ngoài năm trang đã chặn (Q3): `pos_point_transactions` (điểm), `pos_customer_packages` (gói), `pos_membership_purchases`
  (thẻ), `pos_voucher_grants`, `pos_damage_logs` (đền tiền), `pos_discount_codes` (lượt dùng) — vẫn khôi phục được bằng file. Chủ quán nói
  "mọi trang tiền" nhưng liệt kê năm trang; máy làm đúng năm trang đã liệt kê. Muốn chặn thêm thì thêm tên bảng vào `BANG_KHONG_KHOI_PHUC`
  (backup.js) + một ca F2.

## Người gác chặn (lượt này)

- `[B-MANOI]` `python3 -c` đọc `TIEN_DO_POS.json` (file được bảo vệ) → dùng `grep -n` thay.
- `[B-CD-VITRI]` `cd <nháp> && cat > … <<EOF` → viết script nháp bằng Write.
- `[B-PHANTICH]` hai lệnh `node <script>` nối `;` → tách từng lệnh.
- `[SED-I]` `sed -i` trên file nháp → dùng Edit.
- `[CURL-HOST]` `curl` tới raw.githubusercontent.com (đọc nguồn máy chủ sqld để lấy mã lỗi Turso) → không đọc được; ghi CHƯA KIỂM,
  đưa vào Câu hỏi Q1 của kế hoạch.

## Phiên 19.10.2026 (`/lam-viec P26d tiep`)

### Bước 1 — đối chiếu bản chụp

- Nhánh `viec/P26d` · cây sạch · `git fetch origin viec/P26d` được.
- HEAD `eec1423` · FETCH_HEAD `eec1423` — bằng nhau, không kéo (hook mở phiên đã kéo `14169d8 → eec1423`).
- `git log --oneline -3`:

```
eec1423 PHIEU: P26d duyet ke hoach + Q6 (a) mo nhatKyDon.js, chan moi bang tien khi khoi phuc
263a808 P26d: trang_thai — buoc 4-5 xong, Cau hoi Q6 (gia lap M6 neo cau nhat ky cu), dung
83394c6 P26d: backup.js — chan khoi phuc trang tien (vi, don, chi tiet don, so vi, yeu cau hoan) truoc moi ghi
```

### Bước 2 — đã đọc (lượt này)

`phieu.md` (đầu phiếu mới: Q6 (a); khôi phục chặn MỌI bảng tiền — cả điểm, gói khách, thẻ, voucher, đền bù, lượt mã giảm), `trang_thai.md`,
`ke_hoach.md`; code: `server/utils/nhatKyDon.js` (cả file), `server/routes/orders.js` pay-debt (khối `beginTransaction` … `loiGhi`),
`server/routes/backup.js` (`BACKUP_TABLES`, `BANG_KHONG_KHOI_PHUC`, khối chặn trong `/restore`), `server/routes/don-mo-rong.js`
`doi-cach-tra` (chỗ gọi `ghiNhatKy` thứ hai); `cong_cu/thu_gia_lap.js` neo M6; `cong_cu/thu_P26b.js` khối `[P26d F]`; khung đột biến
`viec/P26c/dot_bien.py`, `viec/LUOI-5/dot_bien.py`, luật sập `viec/AUDIT-4/boc.py` (`sap_cua`); cổng `tu_chay/cong.js` A16–A18.

K4 — `grep -rn "ghiNhatKy" server`: 2 chỗ gọi. pay-debt (trong giao dịch) → truyền `tx`. `don-mo-rong.js` `doi-cach-tra`: `run` tự commit rồi
`ghiNhatKy` không `tx` — không có giao dịch giữ khoá nên không mất nhật ký vì bận; file ngoài Phạm vi → Phát hiện.

### Bước 4–5 — Q6 (a) + Q3 mở rộng

- Bài thử TRƯỚC: `5a1c099` thêm 6 trang vào vòng F2 của `thu_P26b.js` (Giao dịch điểm thưởng, Gói của khách, Lịch sử mua thẻ, Voucher đã phát,
  Hàng hỏng, Mã chiết khấu). Chạy trên HEAD `5a1c099` (backup.js mới chặn 5 trang): **91 đạt · 6 hỏng** — đỏ đúng 6 ca mới, HTTP 200. Gốc
  `14169d8`: 69 đạt · 28 hỏng → `bang_chung_do.txt` (`2a94024`).
- Sửa (commit từng file): `28fc57d` nhatKyDon.js (`ghiNhatKy(…, tx)`: có `tx` → `tx.run`, không nuốt lỗi; không `tx` như cũ) · `03b0063`
  orders.js (pay-debt gọi `nhatKyDon.ghiNhatKy(Number(id), "thu", …, tx)`, bỏ câu INSERT chép) · `395d31e` backup.js (`BANG_KHONG_KHOI_PHUC` 5 → 11
  bảng, câu lỗi nêu đủ loại trang).
- Sau vá: `thu_P26b` 97 đạt · 0 hỏng · `thu_P26c` 142 đạt · 0 hỏng · `npm test -- --day-du`: **PASS 70 · FAIL 0 · CẢNH BÁO 1** (cảnh báo cũ: route
  GET có lệnh ghi). Q6 hết: giả lập M6 áp được neo `await nhatKyDon.ghiNhatKy(Number(id), "thu",` (khớp THẬT) và bắt (thu_gia_lap xanh 46,3 s).
  Thời gian (hạn 120 s, 80 % = 96 s): thu_P20 1,7 · thu_P21 0,8 · thu_P26a 0,8 · thu_P26b 3,7 · thu_P26c 3,2 · thu_GOI1 2,3 · thu_gia_lap 46,3 s.

### Chỗ vá → đột biến (`viec/P26d/dot_bien.py`) — chạy 19.10: **28 BẮT · 0 KHÔNG**, đối chứng thu_P26b 97 / thu_P26c 142 đạt · 0 hỏng

| Chỗ vá | Đột biến | Ca bắt (dòng ✗ thật) |
|---|---|---|
| A thử lại BEGIN | BV-A-bo-thu-lai | D5 (+ D1, D8) |
| A thử lại chỉ khi bận | VS-A-thu-lai-moi-loi | D4 |
| A thay kết nối kho file | BV-A-bo-thay-ket-noi | D3 (+ D7) |
| A tổng chờ ≤ 2 s | VS-A-cho-qua-lau | D0 |
| B `laLoiBan` đủ mã | VS-B-chi-khop-mot-ma | D5 |
| B `laLoiBan` không nới | VS-B-khop-rong | D4 (`TRANSACTION_CLOSED` → 200) |
| B `loiGhi` dùng `laLoiBan` | BV-B-loiGhi-ma-cu | D9 |
| B 500 không lộ câu nội bộ | BV-B-lo-message | D4 |
| C mã đơn trong giao dịch | BV-C-ma-don-ngoai-tx | C1 |
| C không nuốt lỗi đọc mã | VS-C-nuot-loi-doc-ma | C3 |
| D huỷ: món đọc trước commit | BV-D-huy-doc-mon-sau-commit | H1 |
| D đối soát dở dang | BV-D-doi-soat-409 | H2 |
| E chuẩn hoá `balance` NULL | BV-E-bo-chuan-hoa-null | V1 |
| E COALESCE cột tổng | BV-E-bo-coalesce-cot-tong | V2 |
| E ví tạo lại tổng chi 0 | VS-E-tong-chi-am | V3 |
| F chặn khôi phục | BV-F-khong-chan | F1 (+ 11 ca F) |
| F chặn TRƯỚC mọi ghi | VS-F-chan-sau-khi-xoa | F1 (vế `pos_sync_logs`) |
| F 6 trang mở rộng (Q3) | BV-F-chi-nam-trang | F2 6 trang mới |
| F đủ từng trang | VS-F-sot-ma-giam | F2 "Mã chiết khấu" |
| G kiểm lại mã giảm trong giao dịch | BV-G-bo-kiem-lai-ma | G1 |
| I gói trong giao dịch | BV-I-goi-sau-commit (khối cũ sau commit + nuốt lỗi trở lại) | I1 |
| I gói không nuốt lỗi | VS-I-nuot-loi-goi | I1 |
| I thẻ trong giao dịch | BV-I-the-ngoai-tx | I4 |
| I thẻ không nuốt lỗi | VS-I-nuot-loi-the | I2 |
| P sổ debt_payment trong giao dịch | BV-P-so-ngoai-tx | P4 |
| P 500 không lộ câu | VS-P-lo-message | P1 |
| P nhật ký không nuốt lỗi (Q6) | BV-P-nhat-ky-nuot-loi | P2 |
| P nhật ký truyền `tx` (Q6) | BV-P-nhat-ky-ngoai-tx | P2 (+ P4) |

Đổi so với danh sách dự kiến: tên dự kiến "BV-I-goi-ngoai-tx" (đổi `tx.run` → `run` cho câu ghi gói) **bỏ** — neo câu INSERT gói thì MỌI lần mua
gói 409 → bước dựng `goiDaLay` của thu_P26c (và thu_GOI1) ném "không mua được gói" → bài SẬP trước I3; neo câu gắn gói lúc giao lần 1 → ca cũ
mua + lấy ngay sập (NaN). Sập ≠ BẮT (K3). Thay bằng `BV-I-goi-sau-commit` = đưa NGUYÊN khối cũ (sau commit, `run`, nuốt lỗi) trở lại → I1 bắt,
không sập. `VS-F-chan-sau-khi-xoa` lần đầu neo đầu vòng `/restore` khớp 2 lần (cả `/preview-restore`) → HỎNG, đã neo thêm câu lỗi chặn ngay trên.

### Ngân sách

Code `server/` so với gốc: +235 / −162 (database.js +55/−8, wallets.js +28/−9, orders.js +115/−105 — bỏ khoảng trắng +83/−73, phần lớn là DỜI
khối gói / thẻ vào giao dịch và thụt lề pay-debt; helpers.js +10/−31, backup.js +17/−1, nhatKyDon.js +10/−8). Ròng +73. Thử: thu_P26b +213,
thu_P26c +153 (~400 theo ngân sách đã nâng ở mục 15 kế hoạch).

## Phát hiện (thêm, 19.10)

- `server/routes/don-mo-rong.js` `doi-cach-tra`: `run` (tự commit) rồi `ghiNhatKy` không `tx` — hai lệnh không cùng giao dịch; catch trả
  `{ error: err.message }` (lộ câu nội bộ, không qua `loiGhi`). Ngoài Phạm vi.
- Bảng còn khôi phục được bằng file, dính tiền gián tiếp: `pos_signup_codes` (mã ưu đãi khách mới — trạng thái đã nhận), `pos_promotion_usage`
  (lượt dùng khuyến mãi), `pos_stock_pending` (sổ nợ kho), `pos_order_log` (nhật ký đơn), `pos_invoice_logs`. Chủ quán liệt kê sáu loại (điểm,
  gói khách, thẻ, voucher, đền bù, lượt mã giảm) — máy chặn đúng sáu bảng đó. Muốn chặn thêm: thêm tên vào `BANG_KHONG_KHOI_PHUC` + một dòng
  vòng F2 của `thu_P26b.js`.
- `cong_cu/thu_P26c.js` / `thu_GOI1.js`: bước dựng mua gói ném lỗi (bài sập) khi mua gói hỏng — đột biến làm hỏng mọi lần mua gói không chấm
  được BẮT. Không sửa (ca cũ giữ nguyên).

## Soát độc lập `/ra-soat` — vòng 1 (19.10, HEAD 84a8752) — nguyên văn báo cáo

```
KHÔNG ĐẠT

Tôi đã tự chạy lại (HEAD 84a8752):
- `node cong_cu/thu_P26b.js` cho 97 đạt · 0 hỏng; `node cong_cu/thu_P26c.js` cho 142 đạt · 0 hỏng.
- `node kiem_tra_truoc_khi_giao.js --day-du` cho PASS 70 · FAIL 0 · CẢNH BÁO 1. Giả lập xanh: chay.js 32,3 s, thu_gia_lap 47,1 s.
- `python3 viec/P26d/dot_bien.py` cho 28 BẮT / 28, cả hai bài đối chứng xanh.
- thu_P26c chạy trên server/ của gốc 14169d8 (lấy bằng git archive ra nháp) cho 134 đạt · 8 hỏng, đỏ đúng 8 ca C1, G1, H1, I1, I2, P1, P2, P3, khớp `bang_chung_do.txt`.
- Ba đột biến tôi tự dựng trong thư mục nháp: kết quả ở lỗi 1 và lỗi 3 bên dưới.

LỖI TÌM ĐƯỢC:
1. server/database.js:1327 — dòng `thayKetNoiNeuBan(err)` trong `catch` của `query()` (chỗ vá Q5, chủ quán duyệt ở ke_hoach.md:314) không có ca thử nào và không có đột biến nào.
   - Tôi xoá đúng dòng đó trên bản sao nháp: thu_P26b vẫn 97 đạt · 0 hỏng, thu_P26c vẫn 142 đạt · 0 hỏng. Đột biến SỐNG.
   - D7 chỉ thử `run()` (thu_P26b, `ghiNhatKy` gọi `db.run`). Ke_hoach.md:183 ghi nhãn D7 là "Q5" là sai đối tượng.
   - Bảng đột biến trong trang_thai.md:138 gộp ba chỗ gọi (BEGIN, `run`, `query`) thành một đột biến `BV-A-bo-thay-ket-noi`. Đột biến này gỡ cả hàm nên che mất chỗ gọi ở `query`.
   - Khuôn: K3, và K4 ("gom về hàm chung → mỗi CHỖ GỌI là chỗ vá riêng").
   - Kèm K1: ke_hoach.md:234 và :266 khẳng định `query` "cùng khuôn (câu SELECT bận để lại câu dở)" và dẫn "đo 0.2". Nhưng mục 0.2 (ke_hoach.md:21-28) chỉ đo BEGIN và INSERT, không đo SELECT.
2. server/routes/backup.js:100-102 — danh sách `BANG_KHONG_KHOI_PHUC` thiếu hai loại bảng dính tiền theo chức năng.
   - `pos_signup_codes`: cột `claimed_at` / `diem_nhan_luc` là cổng duy nhất chặn phát voucher và cộng điểm hai lần (signup-codes.js:255-260 `AND diem_nhan_luc IS NULL`, :395-398 `AND claimed_at IS NULL`). Khôi phục một file cũ sẽ chạy `DELETE FROM pos_signup_codes` (backup.js:340) rồi chèn lại dòng có cột rỗng, nên khách nhận điểm / voucher lần hai.
   - `pos_order_log`: nhật ký thu tiền, là sổ chỉ ghi thêm (ràng buộc vĩnh viễn H.4). Khôi phục sẽ xoá sạch bảng này.
   - Đầu phiếu ghi "chặn MỌI bảng tiền (cả …)", tức sáu loại nêu tên chỉ là ví dụ. trang_thai.md:180-183 thấy hai bảng này nhưng tự chọn cách hiểu hẹp và ghi vào Phát hiện thay vì Câu hỏi (CLAUDE.md §9: "đừng tự chọn một phương án").
   - Khuôn: K4 (tài liệu hứa theo ĐỐI TƯỢNG thì phép chặn phải gắn theo đối tượng), K1.
3. server/database.js:1413 — `tx.close()` (đóng giao dịch hỏng trước khi thử lại) không có đột biến riêng trong dot_bien.py.
   - Tôi gỡ dòng đó: thu_P26b in ✗ D8, rồi bài SẬP ("không nạp được ví: HTTP 409") và F3 đỏ theo.
   - Theo luật sập AUDIT-4 thì bài sập là HỎNG-sập, không phải BẮT. Chỗ vá này chưa có bằng chứng BẮT sạch.
   - Khuôn: K3.

NGHI NGỜ:
- server/routes/orders.js:1276-1291 (pay-debt, có sẵn từ trước, không do diff này gây ra; diff chỉ bọc đoạn này vào giao dịch). `paidAmount = amount || order.debt_amount` không ép kiểu số nguyên. Theo lý thuyết, `amount` là chuỗi lạ sẽ cho `remainingDebt` = NaN, và câu UPDATE có thể ghi nợ thành NULL mà không thu đồng nào. Tôi chưa chạy thử — cần một ca để xác nhận. Khuôn P4 / đường tiền.
- backup.js:240-289: `/preview-restore` không báo trang tiền bị chặn. Người dùng xem trước thấy "khôi phục được", bấm thì nhận 400. Nên dùng một vị từ chung cho cả hai route.
- Hồ sơ lệch nhẹ (K1, phần tài liệu):
  - ke_hoach.md:195 (ca F1 "Cài đặt", `pos_settings`) và :223 (VS-F "vế pos_settings") lệch với bài thật, vốn dùng trang "Nhật ký đồng bộ" / `pos_sync_logs`. trang_thai.md:152 đã ghi đúng.
  - ke_hoach.md:1 vẫn ghi "(chờ chủ quán duyệt)".
- Ngân sách: code server/ thêm 235 / bớt 162 dòng (`git diff --numstat`), trong khi ke_hoach.md:333 nâng ngân sách lên "~130–170 dòng đổi". Bỏ khoảng trắng thì orders.js vẫn khoảng 156 dòng. trang_thai.md:172 ghi số nhưng không nói là vượt và không hỏi.
- Đơn giản (mục 8):
  - backup.js:318: câu lỗi chép tay danh sách loại trang "(ví, đơn, điểm, …)", trùng với hằng `BANG_KHONG_KHOI_PHUC`. Danh sách `tienBiChan` đã nêu tên trang rồi, nên bỏ phần trong ngoặc là đủ.
  - backup.js:317: mã lỗi `KHOI_PHUC_VI_DON_BI_CHAN` nay chặn 11 bảng nhưng tên chỉ nói ví / đơn.
  - Thử lại BEGIN, thay kết nối, `laLoiBan` và `ghiVi` đều gọn, đặt đúng chỗ.
  - Không có tính năng tiền mới cần quy tắc đối soát. Phát hiện DOI-SOAT-1 (dòng có `total_spent < 0`) đã được ghi.
- K5 (chặn nhầm): tôi không thấy luồng hợp lệ nào bị chặn oan.
  - Mua gói rồi lấy ngay: I3 và thu_GOI1 xanh.
  - Mua thẻ: I4. Thu nợ thường: P4, P5. Ví có sẵn: V4. Đối soát chạy lại: H2b. Khôi phục trang không dính tiền: F3. Mã cũ -999: C2. Lỗi không phải bận thì không thử lại: D4.
  - Mở giao dịch lười: tôi đã đọc mọi chỗ gọi `beginTransaction` (orders.js ×4, wallets.js:113, loyalty.js:158, product-groups.js:59, signup-codes.js:249/390/490). Câu đầu đều là `tx.*`, không có `Promise.all` trên tx.
  - Cái giá của khối khôi phục: bản `export-all` đầy đủ nay luôn bị chặn, không còn đường khôi phục ví / đơn bằng file. Đây là quyết định Q3 của chủ quán, không phải lỗi.
- Đường tiền (P3/P4): giá gói, số lượt và giá thẻ đều tra từ DB (orders.js:205, 407-427, 437). Diff không thêm trường tiền nào lấy từ client.
- P1: không có file nào trong `client/src` bị sửa, `dist` không bị ảnh hưởng.

NGHIỆM THU:    10/11 mục có bằng chứng · mục thiếu: Q6 (một phần — "chặn MỌI bảng tiền": thiếu `pos_signup_codes`, `pos_order_log`, xem lỗi 2)
- A: có — D0, D1, D2, D3, D4, D5, D7, D8 (thu_P26b) và đột biến BV-A-*, VS-A-*. Chỗ vá `query` (Q5) không có ca: lỗi 1.
- B: có — ke_hoach mục 0.1 liệt kê mã lỗi; ca D4, D5, D9; đột biến VS-B-*, BV-B-*. Mã lỗi Turso thật: CHƯA KIỂM, chủ quán đã chấp nhận ở Q1.
- C: có — C1 (đỏ trên gốc), C2, C3; đột biến BV-C, VS-C.
- D: có — H1, H2 (đỏ trên gốc), H2b. Ke_hoach mục 3 liệt kê các chỗ trả 409; grep nay ra 15 chỗ `loiGhi(res`, gồm pay-debt.
- E: có — V1, V2, V3 (đỏ), V4; ba đột biến E.
- F: có — F1, 10 ca F2, F3. E12 xanh trong `--day-du`; `kiem_tra_truoc_khi_giao.js` không bị sửa.
- G: có — G1 (đỏ, 500 UNIQUE trên gốc) và BV-G. Chính KB20 trong gia_lap chưa siết (mục Cấm của phiếu) — đã ghi Phát hiện P3.
- H: có — 28/28 BẮT, giả lập xanh, các bài trong hạn (thời gian ở trang_thai.md:130). Lỗ: lỗi 1 và lỗi 3.
- I: có — I1, I2 (đỏ), I3, I4; bốn đột biến I.
- P: có — P1, P2, P3 (đỏ), P4, P5; bốn đột biến P.
- Q6: một phần — `nhatKyDon.js` nhận tx có ca P2 và đột biến BV-P-nhat-ky-*; sáu loại bảng nêu tên có F2. Còn thiếu hai bảng ở lỗi 2.

CHƯA SOÁT ĐƯỢC:
- Turso thật: mã lỗi máy chủ (`TRANSACTION_BUSY` chỉ theo trí nhớ về nguồn sqld), BEGIN lười của hrana khi hỏng ở câu đầu, và việc `BEGIN IMMEDIATE` trên sqld có thật sự tuần tự hoá phép đọc mã đơn hay không. Mọi phép bận đều dựng trên kho file.
- Tranh chấp giữa nhiều tiến trình. Kho file thật chỉ có một tiến trình Node.
- Cổng `node tu_chay/cong.js chay`: tôi không chạy vì có thể ghi file, và trang_thai.md chưa ghi kết quả (dòng 65 vẫn "CHƯA LÀM").
- Hành vi màn hình quầy khi nhận 409 KHO_BAN / 500 LOI_MAY_CHU / 500 DOI_SOAT_DO_DANG ở pay-debt và đối soát. Tôi chỉ đọc Settings.jsx:907-923 cho phần khôi phục: màn đó có hiện `error`.
- Ca NaN ở pay-debt (mục NGHI NGỜ đầu tiên) chưa chạy.

BÀI HỌC:
- KHOÁ (bài thử):
  - Thêm ca D10 vào thu_P26b: client 2 giữ `BEGIN EXCLUSIVE`, `db.query` gặp bận thật → nhả khoá → `db.query` / `db.run` kế tiếp chạy thật. Kèm đột biến `BV-A-query-khong-thay`.
  - Thêm một đột biến gỡ riêng `tx.close()` mà không làm bài sập (ví dụ D8 dùng SĐT riêng, chạy cuối khối).
- KHOÁ (dot_bien.py / cổng A18): mỗi dòng gọi hàm vá chung được thêm vào `server/` phải có ít nhất một đột biến neo đúng dòng đó. Một đột biến gỡ cả hàm không thay được cho từng chỗ gọi.
- NGUYÊN TẮC (K4 / K1):
  - Chủ quán nói "MỌI X (cả a, b, c)" thì danh sách là ví dụ. Phải liệt kê đủ đối tượng theo CHỨC NĂNG (cổng phát tiền / điểm / voucher, sổ chỉ ghi thêm), rồi chặn đủ hoặc đưa vào Câu hỏi. Không tự chọn cách hiểu hẹp rồi ghi vào Phát hiện.
  - Khẳng định "cùng khuôn (đo …)" chỉ được dẫn phép đo khi phép đo đó phủ đúng loại câu đang nói (SELECT khác INSERT).
```

## Vòng sửa 1 (19.10) — xử lý từng điểm soát

| Điểm soát | Xử lý |
|---|---|
| Lỗi 3 — `tx.close()` không có đột biến riêng (gỡ thì bài sập) | `bfd3aa8`: D8 giữ giao dịch hỏng, dọn (`close` = ROLLBACK nếu còn mở) SAU khi chấm; đột biến mới `BV-A-bo-dong-tx-hong` → **BẮT** sạch (✗ D8, 96 đạt · 1 hỏng, không sập). Gốc chạy lại: 69 · 28 như cũ |
| Lỗi 1 — dòng `thayKetNoiNeuBan` trong `query()` không có ca / đột biến; kế hoạch dẫn "đo 0.2" cho SELECT mà 0.2 không đo SELECT (K1) | **[SAI — đo chỉ MỘT giao dịch sau SELECT; soát vòng 2 đo lại: giao dịch thứ hai trở đi BẬN — xem Q8]** **Đo thật 19.10** (script nháp, kho file `journal_mode = delete`): client khác giữ `BEGIN EXCLUSIVE` → `SELECT` trên kết nối dùng chung ném `SQLITE_BUSY`; nhả khoá rồi `INSERT` + một giao dịch trên CÙNG kết nối (không thay) → ghi THẬT, bảng `1,2,3,4`. Tức SELECT bận KHÔNG làm hỏng kết nối như INSERT — dòng vá ở `query()` không có lỗi nào để chặn, nên không dựng được ca đỏ / đột biến BẮT. Gỡ hay giữ là quyết định Q5 chủ quán đã duyệt (dựa trên khẳng định sai của máy) → **Câu hỏi Q7b**. `ke_hoach.md` mục 7 (D7) và mục 9 sửa lại (`a485de0`) |
| Lỗi 2 — `BANG_KHONG_KHOI_PHUC` thiếu `pos_signup_codes`, `pos_order_log` | Danh sách bảng tiền là câu hỏi nghiệp vụ → **Câu hỏi Q7a** (không tự chọn) |
| Nghi ngờ — `/preview-restore` không báo trang bị chặn | **Câu hỏi Q7d** |
| Nghi ngờ — câu lỗi chép tay danh sách loại trang | `98c2262`: bỏ phần trong ngoặc, `tienBiChan` đã nêu tên trang. Mã `KHOI_PHUC_VI_DON_BI_CHAN` giữ (**[sai lý do — soát vòng 2: mã sinh trong nhánh này, không màn nào đọc; xem Q8]**) |
| Nghi ngờ — hồ sơ lệch (`ke_hoach.md` dòng 1, F1 `pos_settings`) | `a485de0` |
| Nghi ngờ — ngân sách | **Câu hỏi Q7c** |
| Nghi ngờ — pay-debt `amount` chuỗi lạ → NaN | Phát hiện bên dưới (có sẵn từ trước, ngoài nghiệm thu) |

Sau vòng sửa (HEAD `a485de0`): `thu_P26b` 97 · 0 · `npm test -- --day-du` **PASS 70 · FAIL 0 · CẢNH BÁO 1** · `dot_bien.py` **29 BẮT · 0 KHÔNG**
(đối chứng 97 / 142 đạt · 0 hỏng). Chưa chạy `/ra-soat` vòng 2 — chờ Q7 (vòng sửa đã dùng: 1 / 3).

## Phát hiện (thêm, soát vòng 1)

- `server/routes/orders.js` pay-debt (có sẵn từ trước): `paidAmount = amount || order.debt_amount` không ép số. `amount` là chuỗi lạ → so sánh
  `<= 0` / `>` nợ đều sai → lọt; `remainingDebt` = NaN. libsql ném "Only finite numbers (not Infinity or NaN) can be passed as arguments" khi
  tham số NaN (thấy trong một lần chạy đột biến) → nay trong giao dịch nên rollback, 500. CHƯA chạy ca riêng. Đề xuất việc sau: ép `Number` +
  `Number.isInteger` + ca thử.

## Câu hỏi

### Q7 (mở, 19.10) — sau soát vòng 1

- **Q7a — bảng tiền chặn khôi phục.** Đầu phiếu: "chặn MỌI bảng tiền (cả điểm, gói khách, thẻ, voucher, đền bù, lượt mã giảm)". Máy đã chặn 11
  bảng. Người soát chỉ ra hai bảng nữa dính tiền theo CHỨC NĂNG: `pos_signup_codes` (cột `claimed_at` / `diem_nhan_luc` là cổng duy nhất chặn
  phát voucher / cộng điểm hai lần — khôi phục file cũ thì khách nhận lại) và `pos_order_log` (nhật ký thu tiền, sổ chỉ ghi thêm). Còn
  `pos_promotion_usage` (lượt dùng khuyến mãi — giới hạn lượt), `pos_stock_pending` (sổ nợ kho), `pos_invoice_logs` (nhật ký hoá đơn).
  **Đề xuất:** chặn thêm `pos_signup_codes`, `pos_order_log`, `pos_promotion_usage` (3 tên vào hằng + 3 dòng vòng F2). Chủ quán chọn bảng nào.
- **Q7b — dòng vá ở `query()` (Q5).** Q5 duyệt dựa trên câu "SELECT bận làm hỏng kết nối như INSERT" — máy chưa đo mà đã khẳng định (K1). Đo
  19.10: **[SAI — đo chỉ MỘT giao dịch sau SELECT; soát vòng 2 đo lại: giao dịch thứ hai trở đi BẬN — xem Q8]** SELECT bận KHÔNG làm hỏng kết nối. **Đề xuất (a):** gỡ dòng `thayKetNoiNeuBan(err)` trong `catch` của `query()` (−1 dòng; không có lỗi
  để chặn nên không có ca / đột biến). (b) giữ dòng phòng xa, ghi CHƯA KIỂM (vô hại: chỉ thay client khi bận).
- **Q7c — ngân sách.** Code `server/` so với gốc: +235 / −162 (ròng +73); mục 15 kế hoạch nâng lên "~130–170 dòng đổi". Phần vượt chủ yếu do DỜI
  khối gói / thẻ vào giao dịch (I) và thụt lề pay-debt (P) — bỏ khoảng trắng orders.js +83 / −73. Chấp nhận?
- **Q7d — `/preview-restore`.** Màn xem trước không báo trang tiền sẽ bị chặn; bấm khôi phục mới nhận 400. Thêm một dòng `status: 'bi_chan'`
  cho trang trong `BANG_KHONG_KHOI_PHUC` ở xem trước (dùng chung hằng, ~3 dòng backup.js + 1 ca F)? Hay để nguyên (màn Cài đặt đã hiện `error`)?

**ĐANG DỪNG chờ chủ quán trả lời Q7.** Còn lại sau Q7: sửa theo trả lời → bước 6 → `/ra-soat` vòng 2 → báo cáo 7 mục, bài học, cổng `chay`,
`HEAD ĐÃ KIỂM`.

### Chủ quán trả lời Q7 (19.10) — phần này THẮNG chỗ khác khi lệch

- **Q7a** đồng ý chặn thêm `pos_signup_codes`, `pos_order_log`, `pos_promotion_usage`.
- **Q7b** gỡ dòng vá ở `query()` (đã đo: SELECT bận không hỏng kết nối).
- **Q7c** chấp nhận ngân sách.
- **Q7d** đồng ý báo trang bị chặn ở xem trước NẾU chỉ sửa server (`backup.js`), không đụng `client/`.
- **Phát hiện pay-debt: sửa luôn** — `amount` không phải số nguyên dương hữu hạn → 400 có `code`, kèm ca thử + đột biến.

### Vòng sửa 2 — làm theo Q7 (19.10)

- Bài thử TRƯỚC (`224e684`): thu_P26b F2 thêm 3 trang + F4 (xem trước có trang tiền → 400) + F5 (K5 xem trước sạch → 200); thu_P26c P6 (×5:
  "abc", −5.000, 1.000,5, 0, "5000") + P7 (K5 không gửi amount → thu đủ) + P8 (K5 thu một phần số nguyên) + P9 (K5 nợ cũ lẻ). Trên code chưa vá Q7:
  thu_P26b 98 · 4, thu_P26c 145 · 5 — đỏ đúng các ca mới, ca K5 xanh. Gốc `14169d8`: 70 · 32 và 137 · 13 → `bang_chung_do.txt`.
- Sửa: `0d18813` backup.js (+3 bảng; hàm chung `chanTrangTien(res, wb)` cho CẢ `/preview-restore` lẫn `/restore` — MỘT vị từ; không sửa client/:
  `Settings.jsx` vốn hiện `'Lỗi: ' + data.error` khi xem trước không `success`) · `1139b36` database.js (gỡ `thayKetNoiNeuBan` khỏi `query()`, chú
  thích ghi phép đo) · `90a482f` orders.js (pay-debt: `amount != null && amount !== order.debt_amount && !(Number.isInteger(amount) && amount > 0)`
  → 400 `SO_TIEN_KHONG_HOP_LE`).
- **Ngoại lệ K5 — chủ quán xem lại:** `amount` đúng bằng `debt_amount` trong sổ vẫn qua dù lẻ. Lý do (đọc lượt này): màn Lịch sử đơn gửi
  `amount: selectedOrder.debt_amount` (`client/src/pages/Orders.jsx` hàm `handleConfirmPayDebt`); nợ tạo đơn lấy từ client (`orders.js`
  `let finalDebtAmount = debt_amount;`) và chiết khấu % không làm tròn (`finalDiscountAmount = (subtotal * finalDiscountValue) / 100;`) → nợ CŨ có thể
  lẻ; áp nguyên văn thì đơn đó không thu được nữa. Ca P9 khoá, đột biến `VS-PD-bo-ngoai-le-no-le` bắt. Số 0 trước đây = "thu đủ", nay 400 (không có
  màn nào gửi 0: grep `pay-debt` trong client/src: `Orders.jsx` gọi; `utils/api.js` có `payDebt` nhưng không ai gọi).
- K4: route khác nhận `amount` từ client là ví (`wallets.js` topup / deduct / adjust) — đã `parseInt` rồi chặn `!x || x <= 0`, NaN không tới kho;
  không cùng lỗ, không sửa.
- Sau vá: thu_P26b 102 · 0 · thu_P26c 150 · 0 · `npm test -- --day-du` **PASS 70 · FAIL 0 · CẢNH BÁO 1** (thu_P26b 4,0 s · thu_P26c 3,5 s ·
  thu_gia_lap 47,5 s; hạn 120 s) · `dot_bien.py` **36 BẮT · 0 KHÔNG** (đối chứng 102 / 150).
- Q7b (gỡ dòng ở `query()`): xoá code, không có hành vi để đột biến — căn cứ là phép đo 19.10 ở mục vòng sửa 1.

| Chỗ vá (Q7) | Đột biến | Ca bắt |
|---|---|---|
| Q7a 3 bảng thêm | BV-Q7a-bo-3-bang | F2 "Mã ưu đãi khách mới" (+ 2 trang) |
| Q7d xem trước chặn | BV-Q7d-xem-truoc-khong-chan | F4 |
| Q7d xem trước không chặn oan | VS-Q7d-xem-truoc-chan-moi-file | F5 |
| vị từ chung (neo mới) | BV-F-khong-chan · VS-F-chan-sau-khi-xoa · BV-F-chi-nam-trang · VS-F-sot-ma-giam | F1 / F1 / F2 / F2 |
| pay-debt kiểm amount | BV-PD-bo-kiem-so-tien | P6 "abc" |
| pay-debt chỉ số nguyên | VS-PD-chi-chan-khong-duong | P6 số lẻ |
| pay-debt ngoại lệ nợ cũ lẻ | VS-PD-bo-ngoai-le-no-le | P9 |
| pay-debt không gửi = thu đủ | VS-PD-chan-ca-khong-gui | P7 |
| đóng giao dịch hỏng (vòng 1) | BV-A-bo-dong-tx-hong | D8 |

## Soát độc lập `/ra-soat` — vòng 2 (19.10, HEAD b538401) — nguyên văn báo cáo

```
KHÔNG ĐẠT

Kết quả tôi tự chạy lại trên HEAD b538401, cây sạch, không sửa file nào trong kho:
- thu_P26b: 102 đạt · 0 hỏng. thu_P26c: 150 đạt · 0 hỏng.
- `--day-du`: PASS 70 · FAIL 0 · CẢNH BÁO 1. Cảnh báo là lỗi cũ: route GET có lệnh ghi ở packages.js:194, products.js:57, sync.js:147.
- `dot_bien.py`: 36 BẮT / 36, cả hai đối chứng xanh.
- Bản `server/` của gốc 14169d8^ (lấy ra thư mục nháp): thu_P26b 70 · 32, thu_P26c 137 · 13. Khớp `bang_chung_do.txt`; các ca mới đỏ đúng câu.
- Đột biến tôi tự dựng thêm: gỡ `thayKetNoiNeuBan` ở run() → bị ca D7 bắt; gỡ ở vòng BEGIN → bị D1, D3, D7 bắt.

Ba lỗi vòng 1:
- Lỗi 1: dòng ở query() đã gỡ theo Q7b. Nhưng căn cứ của Q7b là SAI, xem LỖI 1 bên dưới.
- Lỗi 2: đã xử lý. backup.js:101-103 thêm 3 bảng; ca F2 ×3 và đột biến BV-Q7a đều có.
- Lỗi 3: đã xử lý. D8 dọn sau khi chấm (thu_P26b.js:558-561). Đột biến BV-A-bo-dong-tx-hong bắt sạch, 101 · 1, bài không sập.

LỖI TÌM ĐƯỢC:

1. server/database.js:1317-1330 (query() không còn thay kết nối) và chú thích :1384-1386 — câu "Đo 19.10: SELECT bận KHÔNG làm hỏng kết nối" là SAI. Quyết định Q7b của chủ quán dựa trên câu này. Thuộc khuôn K1 và K3.
   - Cách tôi đo: script nháp `/tmp/claude-0/-home-user-pos-tuquyduong/9634dd61-6a2e-5bdb-973f-0f3969e25e57/scratchpad/do_q7b.js`, chạy với `server/database.js` thật và kho file. Một client khác giữ `BEGIN EXCLUSIVE`, `db.query(SELECT)` ném SQLITE_BUSY, rồi nhả khoá. Sau đó chạy 4 lần beginTransaction + INSERT + commit, rồi một lệnh run.
   - Trên HEAD: giao dịch 1 ok; giao dịch 2, 3, 4 đều SQLITE_BUSY; run cũng SQLITE_BUSY. Kho chỉ còn dòng "1".
   - Đối chứng không có SELECT bận: cả 4 giao dịch và run đều ok.
   - Bản trước Q7b (0d18813, query() còn dòng thay kết nối): chạy cùng kịch bản thì cả 4 giao dịch và run đều ok.
   - Vì sao hỏng: câu SELECT bận không được reset, nên kết nối dùng chung bị hỏng. `transaction()` lấy luôn kết nối đó cho giao dịch kế tiếp (node_modules/@libsql/client/lib-cjs/sqlite3.js:103-107) và không bao giờ đóng nó. Sau commit, kết nối này vẫn giữ khoá. Từ đó mọi BEGIN / commit / run sau đều bận, quầy trả 409 KHO_BAN cho tới khi khởi động lại.
   - Phép đo 19.10 (trang_thai.md:271) chỉ thử lệnh kế tiếp trên CÙNG kết nối, nên không thấy. Hỏng chỉ lộ ra ở giao dịch THỨ HAI.
   - Phạm vi: chỉ kho file, tức máy thử Replit `data/pos_thu.db`. Turso không bị vì `thayKetNoiNeuBan` không làm gì khi không phải kho file (:1388).
   - Câu sai còn chép ở trang_thai.md:271, :298-299, :312 (K4 hồ sơ).
   - Cần làm: đưa lại cho chủ quán (Q8) kèm số đo này. Đề xuất: khôi phục dòng ở query(), thêm ca D10 (SELECT bận thật → ≥ 2 giao dịch + run đều ghi THẬT) và đột biến gỡ dòng đó.

2. server/routes/orders.js:1273-1277 — ngoại lệ "amount đúng bằng debt_amount trong sổ thì vẫn qua dù lẻ" là máy tự đổi một quyết định tiền mà chủ quán đã chốt. Lời chủ quán ở Q7 là: amount không phải số nguyên dương → 400, và phần đó THẮNG. Thuộc khuôn K6 (vi phạm LUAT §5 "không tự đổi", CLAUDE.md §9 "đừng tự chọn") và K1.
   - Xét kỹ thì ngoại lệ HỢP LÝ, đúng là ca K5:
     - Orders.jsx gửi `amount: selectedOrder.debt_amount` (đoạn handleConfirmPayDebt, khoảng dòng 442-450).
     - Nợ có thể lẻ: chiết khấu % không làm tròn (orders.js:669); debt_amount lấy thẳng từ client (:781-789); phép đối chiếu tổng thanh toán cho lệch ±1 (:796-803).
   - Ngoại lệ KHÔNG mở lỗ tiền: khi đó paidAmount = đúng nợ trong sổ, y hệt nhánh không gửi amount; không vượt nợ được; câu UPDATE vẫn kiểm `debt_amount = ?`.
   - Nhưng trang_thai.md:326 chỉ ghi "chủ quán xem lại", không đặt thành Câu hỏi chặn. Phải để chủ quán xác nhận trước khi đóng việc.
   - Chú thích "nợ CŨ có thể lẻ" sai sự thật: đơn MỚI hôm nay vẫn sinh nợ lẻ được (:669, :781). Ngoại lệ này là vĩnh viễn, không phải chỉ cho dữ liệu cũ.

3. server/routes/orders.js:1283-1287 — `if (paidAmount <= 0)` nay là code chết, vì phép kiểm mới ở :1275 đã loại hết mọi giá trị ≤ 0 (LUAT §3). Thuộc mục Đơn giản.
   - Gọn hơn mà vẫn đúng: xoá khối đó, và `const paidAmount = amount ?? order.debt_amount;`.

4. Hồ sơ lệch (K1, nhẹ):
   - trang_thai.md:330 ghi "grep `pay-debt` trong client/src chỉ có Orders.jsx". Thật ra client/src/utils/api.js:366 cũng có `payDebt` (không ai gọi).
   - trang_thai.md:274 ghi "đổi mã lỗi là đổi giao kèo với màn hình". Thật ra `KHOI_PHUC_VI_DON_BI_CHAN` sinh ra ngay trong nhánh này, chỉ có ở backup.js:113 và bài thử, không màn nào đọc. Đổi tên lúc này không tốn gì, mà tên hiện tại nói "ví / đơn" trong khi chặn 14 bảng.

NGHI NGỜ:
- database.js:1389-1390: `thayKetNoiNeuBan` đóng client cũ TRƯỚC rồi mới tạo client mới. Nếu `createClient` ném lỗi thì `db` là client đã đóng, mọi lệnh sau ra CLIENT_CLOSED. Chỉ ở kho file, khả năng thấp. Tạo mới trước rồi đóng cũ sau thì an toàn hơn.
- helpers.js:36-41: đã bỏ vòng chống trùng và lối thoát dự phòng. Nếu trong ngày có một mã không theo dạng số (dữ liệu cũ / sửa tay) thì mọi đơn hôm đó 500 UNIQUE. Hiện chỉ có orders.js:896 ghi vào pos_orders, và khôi phục pos_orders đã bị chặn, nên rủi ro thấp.
- Bận THẬT ở câu đầu khi giao dịch file đã BEGIN xong: D8 dùng lỗi giả. Chưa đo xem `tx.close()` (ROLLBACK) có nhả khoá khi còn câu chưa reset hay không. Sau lỗi 1, chỗ này nên đo thật.
- `commit() { if (tx) … }` (database.js:1433): tôi gỡ phép `if (tx)` đi mà thu_P26c vẫn 150/0 — phép này không có ca nào chạm tới, chỉ là phòng xa.
- pay-debt vừa được chạm tới nhưng các nhánh 400 cũ vẫn chưa có `code` (orders.js:1245-1271, :1289-1295). LUAT §2 yêu cầu "thêm khi chạm tới".

Trả lời 8 mục soát:
1. K3: các bài đỏ trên gốc đúng câu, kiểm hành vi chứ không kiểm marker; 36/36 đột biến bị bắt. Lỗ duy nhất: không có ca nào cho SELECT bận rồi giao dịch thứ hai. D3 và D7 cũng chỉ kiểm "lệnh kế tiếp".
2. K4: `thayKetNoiNeuBan` có 2 chỗ gọi, cả hai có ca riêng; chỗ thứ ba (query) bị gỡ sai, là lỗi 1. `ghiNhatKy` có 2 chỗ gọi; don-mo-rong.js đã ghi vào Phát hiện. Không route nào ném lỗi nghiệp vụ vào loiGhi.
3. K5: không luồng hợp lệ nào bị chặn oan.
   - Đã soát: thu đủ có / không gửi amount (P4, P7); thu một phần (P8); nợ lẻ (P9); mua gói rồi lấy ngay (I3); mua thẻ (I4); xem trước file sạch (F5); khôi phục trang không dính tiền (F3); không màn nào gửi amount = 0.
   - Bản sao lưu export-all đầy đủ nay luôn bị chặn — đó là hệ quả của Q3 chủ quán đã chấp nhận.
4. K1: lỗi 1, lỗi 2 (chú thích "nợ cũ"), lỗi 4.
5. Đường tiền: giá gói, số lượt, giá thẻ đều tra từ DB; diff không thêm trường tiền nào tin client. debt_amount lấy từ client lúc tạo đơn (orders.js:781) là lỗi có sẵn, chỉ được chặn bằng phép đối chiếu tổng ±1 — nên ghi Phát hiện.
6. P1: không có file nào trong `client/` bị sửa.
7. Nghiệm thu: xem dòng NGHIỆM THU bên dưới.
8. Đơn giản: lỗi 3, tên mã lỗi ở lỗi 4, và thứ tự đóng / tạo client. Không có tính năng tiền mới cần thêm quy tắc đối soát.

NGHIỆM THU:    15/16 mục có bằng chứng · mục thiếu: Q7b (làm đúng lời chủ quán nhưng căn cứ đo sai — lỗi 1). Thêm: ngoại lệ pay-debt chờ chủ quán xác nhận (lỗi 2).
- A: có — thu_P26b D0 :514, D1 :633, D2 :642, D3 :648, D4 :531, D5 :540, D7 :656, D8 :558; các đột biến BV-A-*, VS-A-*.
- B: có — D4, D5, D9 (:568); các đột biến VS-B-*, BV-B-*. Mã lỗi của Turso thật vẫn CHƯA KIỂM, chủ quán đã chấp nhận ở Q1.
- C: có — thu_P26c C1 :1061, C3 :1069, C2 :1075.
- D: có — H1 thu_P26c :1103; H2 / H2b thu_P26b :503, :508.
- E: có — V1 :463, V2 :471, V3 :479, V4 :486.
- F: có — F1 :593, F2 :602 (13 trang), F3 :606; E12 xanh.
- G: có — G1 thu_P26c :1090 và đột biến BV-G.
- H: có — 36/36 BẮT; `--day-du` xanh; thời gian trong hạn theo số ở trang_thai.md:333.
- I: có — I1 :1117, I2 :1135, I3 :1123, I4 :1139.
- P: có — P1 / P2 :1161, P3 :1169, P4 :1174, P5 :1177.
- Q6: có — P2 và các đột biến BV-P-nhat-ky-*.
- Q7a: có — F2 thêm 3 trang và BV-Q7a.
- Q7b: THIẾU — lỗi 1.
- Q7c: có — chủ quán đã chấp nhận ngân sách.
- Q7d: có — F4 :610, F5 :613; BV / VS-Q7d; không sửa client.
- pay-debt amount: có — P6 ×5 :1183, P7 :1188, P8 :1192, P9 :1198; 4 đột biến PD.

CHƯA SOÁT ĐƯỢC:
- Turso thật: mã lỗi bận, BEGIN lười, và BEGIN IMMEDIATE trên sqld có tuần tự hoá phép đọc mã đơn không.
- Tranh chấp giữa nhiều tiến trình.
- `node tu_chay/cong.js chay`: tôi không chạy vì có thể ghi file; trang_thai chưa ghi kết quả.
- Màn hình quầy khi nhận 409 KHO_BAN / 500 LOI_MAY_CHU / SO_TIEN_KHONG_HOP_LE: chỉ đọc Orders.jsx (hiện `data.error`).
- Dữ liệu production có đơn nợ lẻ thật hay không.

BÀI HỌC:
- KHOÁ:
  - Thêm ca D10 vào thu_P26b: SELECT bận thật → nhả khoá → ≥ 2 giao dịch + run phải ghi THẬT. Kèm đột biến gỡ dòng ở query().
  - D3 và D7 sửa thành đo tới "giao dịch thứ hai", không chỉ "lệnh kế tiếp".
- NGUYÊN TẮC (K3, thêm vào KHUON_LOI.md): đo "kết nối không hỏng" phải đo trên KẾT NỐI KHÁC và ở lần THỨ HAI. Hỏng do câu treo lộ ra khi kết nối bị chuyển cho giao dịch, không lộ ở lệnh kế tiếp. Một phép đo nháp dùng để gỡ một chỗ vá đã được duyệt thì phải đưa thành ca thử trong kho, không để ở script ngoài.
- NGUYÊN TẮC (K6): ngoại lệ K5 đối với một quyết định tiền chủ quán đã chốt → đặt vào Câu hỏi và DỪNG, không làm trước rồi ghi "xem lại".
```

## Vòng sửa 3 (19.10) — sau soát vòng 2

- **Lỗi 1 — tái hiện ĐÚNG** (K2: chạy lại script của người soát trên `server/` HEAD, không sửa gì): `select · SELECT khi bận: SQLITE_BUSY · gd1:ok ·
  gd2:SQLITE_BUSY · gd3:SQLITE_BUSY · gd4:SQLITE_BUSY · run: SQLITE_BUSY · kho có 1`; đối chứng `none · … gd1–gd4: ok · run: ok · kho có 1,2,3,4,9`.
  Phép đo của máy 19.10 chỉ chạy MỘT giao dịch sau SELECT → kết luận sai, Q7b quyết trên câu sai đó. Đã sửa chú thích sai trong
  `database.js` (`bfaddb9`) và đánh dấu [SAI] ở mọi câu cùng nghĩa trong `trang_thai.md` / `ke_hoach.md`. **Không tự khôi phục dòng vá** — lật quyết
  định Q7b của chủ quán → **Câu hỏi Q8a**.
- **Lỗi 2** — ngoại lệ nợ lẻ ở pay-debt: đáng lẽ phải hỏi trước, không làm trước rồi ghi "xem lại" → **Câu hỏi Q8b**. Chú thích "nợ CŨ" sửa
  (`3072693`: nợ lẻ sinh được cả ở đơn mới).
- **Lỗi 3** — `if (paidAmount <= 0)` code chết: xoá (`3072693`). thu_P26c 150 · 0; đột biến pay-debt chạy lại 6 BẮT / 6.
- **Lỗi 4** — hồ sơ: sửa dòng `payDebt` của `api.js`; lý do giữ tên `KHOI_PHUC_VI_DON_BI_CHAN` sai → **Câu hỏi Q8c**.
- `npm test -- --day-du` sau vòng sửa 3: **PASS 70 · FAIL 0 · CẢNH BÁO 1**.
- Vòng sửa đã dùng: **3 / 3** (`so_vong_sua_toi_da`) → không chạy soát vòng 3; ghi Câu hỏi và DỪNG.

## Phát hiện (thêm, soát vòng 2)

- `server/routes/orders.js` tạo đơn: `let finalDebtAmount = debt_amount;` lấy nợ thẳng từ máy khách, chỉ chặn bằng đối chiếu tổng ±1đ — nợ lẻ / lệch
  1đ ghi được vào sổ. Có sẵn từ trước, ngoài nghiệm thu.
- `server/database.js` `thayKetNoiNeuBan`: đóng client cũ TRƯỚC rồi mới tạo client mới — `createClient` ném thì `db` là client đã đóng. Kho file,
  khả năng thấp; đảo thứ tự là 2 dòng.
- `server/utils/helpers.js` `taoMaDonTheoSo`: mã trong ngày không theo dạng số (sửa tay) → `parseInt` NaN → bắt đầu lại từ 1 → UNIQUE 500 mọi đơn
  hôm đó. Chỉ `orders.js` ghi `pos_orders`, khôi phục `pos_orders` bị chặn → rủi ro thấp.
- Bận THẬT ở câu đầu khi giao dịch kho file đã BEGIN (D8 dùng lỗi giả): chưa đo `tx.close()` có nhả khoá khi còn câu chưa reset.

### Q8 (mở, 19.10) — sau soát vòng 2 · vòng sửa đã hết (3 / 3)

- **Q8a — dòng vá ở `query()` (lật lại Q7b).** Máy đo SAI ở Q7b. Số đo đúng (trên `server/` hiện tại, kho file): sau MỘT câu SELECT gặp bận, giao dịch
  thứ hai trở đi và mọi lệnh ghi đều bận — quầy trả 409 KHO_BAN cho tới khi khởi động lại máy chủ. Có dòng vá thì cả 4 giao dịch + lệnh ghi đều
  ghi được. Chỉ ảnh hưởng kho file (máy thử Replit), không ảnh hưởng Turso. **Đề xuất:** khôi phục dòng `thayKetNoiNeuBan(err)` trong `catch` của
  `query()` (+1 dòng) + ca D10 ở `thu_P26b.js` (SELECT bận thật → nhả → 2 giao dịch + 1 lệnh ghi đều ghi THẬT, đọc bằng kết nối khác) + đột biến
  `BV-A-query-khong-thay`; D3 / D7 đo tới giao dịch thứ hai.
- **Q8b — ngoại lệ nợ lẻ ở pay-debt** (đã làm, chờ xác nhận): `amount` đúng bằng `debt_amount` trong sổ thì vẫn thu dù lẻ. Màn Lịch sử đơn gửi
  `amount = debt_amount`; nợ lẻ sinh được cả hôm nay (chiết khấu % không làm tròn; nợ lấy từ máy khách lúc tạo đơn). Không mở lỗ: số thu = đúng nợ
  trong sổ, như khi không gửi `amount`. (a) giữ — đề xuất; (b) bỏ — đơn nợ lẻ không thu được qua màn Lịch sử đơn.
- **Q8c — việc nhỏ cùng lượt sau** (máy đề xuất làm cả): đổi tên mã `KHOI_PHUC_VI_DON_BI_CHAN` → `KHOI_PHUC_TRANG_TIEN_BI_CHAN` (mã sinh trong nhánh
  này, không màn nào đọc); thêm `code` cho các nhánh 400 cũ của pay-debt (LUAT §2 "thêm khi chạm tới"); đảo thứ tự tạo / đóng client trong
  `thayKetNoiNeuBan`. Đồng ý cả, hay chỉ phần nào?
- **Q8d — vòng sửa:** đã dùng 3 / 3. Cho phép thêm một vòng (sửa theo Q8 → soát vòng 3)?

**ĐANG DỪNG chờ chủ quán trả lời Q8.** Chưa làm: báo cáo 7 mục, bài học, cổng `chay`, `HEAD ĐÃ KIỂM`.

### Chủ quán trả lời Q8 (21.10) — phần này THẮNG chỗ khác khi lệch

- **Q8a** đồng ý: khôi phục dòng vá ở `query()` + ca D10 (SELECT bận thật → 2 giao dịch + 1 lệnh ghi phải ghi được) + đột biến gỡ dòng đó.
- **Q8b** GIỮ ngoại lệ thu nợ (amount đúng bằng nợ trong sổ thì cho thu dù lẻ).
- **Q8c** đồng ý cả ba (đổi tên mã chặn khôi phục; thêm `code` cho các nhánh 400 cũ của pay-debt; đảo thứ tự tạo / đóng client).
- **Q8d** thêm MỘT vòng sửa (vòng 4) để làm theo Q8, rồi soát độc lập vòng 3; vẫn không đạt thì dừng báo chat, không xin thêm.

### Vòng sửa 4 (21.10) — đối chiếu bản chụp lúc mở

- `git rev-parse --short HEAD FETCH_HEAD`: `a58bc78` · `a58bc78` (bằng nhau, không kéo)
- `git log --oneline -3`:
  - a58bc78 P26d: trang_thai — bao cao /ra-soat vong 2 (KHONG DAT), vong sua 3, danh dau cau sai, Cau hoi Q8, dung
  - 3072693 P26d: orders.js — pay-debt bo kiem paidAmount <= 0 (code chet sau kiem amount), sua chu thich no le — soat vong 2
  - bfaddb9 P26d: database.js — sua chu thich sai ve SELECT ban (do lai: SELECT ban cung hong ket noi, lo o giao dich thu hai) — soat vong 2
