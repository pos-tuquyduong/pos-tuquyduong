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
Q5 vá cả `query`).

## Người gác chặn (lượt này)

- `[B-MANOI]` `python3 -c` đọc `TIEN_DO_POS.json` (file được bảo vệ) → dùng `grep -n` thay.
- `[B-CD-VITRI]` `cd <nháp> && cat > … <<EOF` → viết script nháp bằng Write.
- `[B-PHANTICH]` hai lệnh `node <script>` nối `;` → tách từng lệnh.
- `[SED-I]` `sed -i` trên file nháp → dùng Edit.
- `[CURL-HOST]` `curl` tới raw.githubusercontent.com (đọc nguồn máy chủ sqld để lấy mã lỗi Turso) → không đọc được; ghi CHƯA KIỂM,
  đưa vào Câu hỏi Q1 của kế hoạch.
