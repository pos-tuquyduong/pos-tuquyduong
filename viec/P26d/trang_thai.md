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

### Q6 (mở, 18.10) — giả lập M6 neo vào câu gọi nhật ký cũ của pay-debt → `--day-du` ĐỎ, cần file ngoài Phạm vi

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
