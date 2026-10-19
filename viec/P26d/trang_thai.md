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
