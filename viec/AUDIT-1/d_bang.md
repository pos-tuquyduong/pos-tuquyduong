# AUDIT-1 — Nhóm D · Bộ kiểm (`kiem_tra_truoc_khi_giao.js`)

HEAD b9759cf, đo 04.10.2026. Bản nhanh: **61 phép** (`PASS 61` ở đầu ra). `--day-du` thêm D5 (so bản dựng), S4
(giả lập + thu_gia_lap). D1 theo dặn của chủ quán: đột biến chỉ đặt vào **THỨ phép soi** (code/file đích), KHÔNG sửa
`kiem_tra`; phép chỉ đỏ được khi sửa chính nó = SỐNG.

## D1 — mẫu đại diện: đột biến code đích → phép đỏ

`python3 viec/AUDIT-1/dot_bien.py D1` — **46 BẮT · 0 SỐNG · 2 LẠC** (soát vòng 2: ĐỦ mỗi phép một đột biến RIÊNG, không
còn "lấy mẫu 10"). Các phép TĨNH chạy stub bài thật (nhanh); 7 phép CHẠY THẬT dùng tên `!D1-…` (không stub). Mẫu 10
tiêu biểu một nhóm:

| phép | đột biến code đích | dòng đỏ |
|---|---|---|
| A1 ký tự hỏng | thêm U+FFFD vào `server/ketNoiKho.js` | ✗ Ký tự hỏng mã U+FFFD |
| B1 json trần | thêm `await response.json()` vào `api.js` | ✗ api.js không có response.json() trần |
| C1 bánh cóc fetch | thêm 1 `fetch(` vào `Customers.jsx` → 35 > 34 | ✗ fetch trần ngoài api.js ≤ 34 |
| E1 giá client | thêm `= item.unit_price` vào `orders.js` | ✗ orders.js KHÔNG tính tiền theo item.unit_price |
| E7 pay-debt | `debt_amount = ?` → `>= ?` | ✗ pay-debt chặn thu hai lần |
| E8 sao lưu | thêm `CREATE TABLE pos_audit_x` vào `database.js` | ✗ mọi bảng đều được sao lưu (31 bảng) |
| E12 ví ngoài ghiVi | thêm `UPDATE pos_wallets` vào `don-mo-rong.js` | ✗ ví: mọi lệnh ghi pos_wallets |
| K1 đọc biến kho | thêm `process.env.TURSO_DATABASE_URL` vào `index.js` | ✗ chỉ server/ketNoiKho.js đọc biến |
| S3 danh sách ví | bỏ `'adjust'` khỏi `bat_bien.js` | ✗ giả lập: danh sách trắng ví |
| F3 npm test | đổi `test` → file không tồn tại | ✗ npm test trỏ vào file có thật |

AUDIT-1 nay có đột biến RIÊNG cho từng phép TĨNH của B/D/E/F/K/S (A2, A2c, B2, handleSE, cờ song song, pathname,
SESSION_DEAD_CODES đủ-5/không-service, ErrorBoundary tồn-tại/getDerived/main/Layout/key, ahref, POS-5/6, build-prod,
giá-0, authz-thô, TRANG_THAI_DUNG_MA, danh-sách-trắng, claim/nhan-diem chiếm-mã, ví tương-đối/trắng-5, ketNoiKho 4-ca,
gitignore data/attached/dist) — tất cả BẮT. Phép CHẠY THẬT dùng tên `!D1-…`: **thu_P21, thu_P26b, thu_nguoi_gac,
thu_cong_cu, thu_cong** có đột biến làm CHÍNH file đó in dòng đỏ RIÊNG ⇒ live; **thu_P26a** live qua `C2F-loyalty-03`
(C8). **thu_P20: CHƯA KIỂM liveness (AU-G5)** — đột biến riêng (`!D1-E11-P20`) bị phép TĨNH E7 chặn trước → LẠC, chưa
có đột biến nào làm `thu_P20.js` đỏ dòng riêng (soát vòng 2; đúng cảnh báo KHUON_LOI K3 TU-CHAY-4). D5/S4 (--day-du)
đỏ được: S3 đã chứng nhóm S; D5 build-lại đỏ khi `src`
lệch `dist` (kiểm chứng lịch sử 24.08 ghi trong code).

## Phép chỉ CẢNH BÁO (không có nhánh FAIL) = không bao giờ làm quầy ĐỎ

Đột biến KHÔNG làm các phép này in `✗` (chỉ `!` cảnh báo) → theo nghĩa D1 là "không đỏ được":

- **AU-D1 (NHẸ):** `F2 File .js lạc ở gốc repo` (`:636`) chỉ `canhBao`, không `fail`. Thả một `.js` rác vào gốc →
  CẢNH BÁO, pre-commit VẪN QUA. (Người gác chặn tạo file gốc ngoài phạm vi ở đường việc, nên lỗ hẹp.)
- **AU-D2 (NHẸ):** `T2`/`T3`/`T4` (bản cài `.claude/tu_chay/`, skill, /ra-soat, cổng lệch nguồn `tu_chay/` — `:569,582,
  594,596`) chỉ `canhBao`. `.claude/tu_chay/` trôi khỏi `tu_chay/` → bộ kiểm + pre-commit CHỈ cảnh báo, không chặn
  commit. **Ở quầy sẽ sai gì:** hook đang chạy bản `.claude/tu_chay/nguoi_gac.js` KHÁC `tu_chay/nguoi_gac.js` mà
  pre-commit không đỏ — chỉ CỔNG A8 (ở PR) mới cứng chặn. Dựa vào cổng là đủ cho đường main, nhưng người làm local
  không được cảnh báo đủ mạnh. Đề xuất HOC-2: nâng T2–T4 thành `fail` (hoặc chủ quán xác nhận giữ cảnh báo vì cổng đã lo).
- Các `canhBao` còn lại là FALLBACK môi trường (A2/D5/S4 khi thiếu `node_modules`; E2 hai nhánh marker; F3 khi script
  không nhắc file) — hợp lý, không phải phép rỗng. Riêng E2 CÓ nhánh `fail` cho ca nguy hiểm (marker + `item.from_package
  ? 0` cùng tồn tại → `✗ POST /orders có cổng phân quyền`), nên không SỐNG.

→ Không phép TĨNH nào SỐNG (sửa đích là đỏ); hai chùm `canhBao`-thuần (F2, T2–T4) là "mềm" — ghi NHẸ.

## Phép CHƯA KIỂM riêng (soát vòng 2 — thành thật)
- **D2/D3/D4** (bundle `dist` không-phải-dev / index.html trỏ bundle thật / bundle có dấu vết): CHƯA có đột biến riêng
  — cần sửa bundle đã-băm trong `client/dist/assets/*.js` (tên phụ thuộc hash). D5 (--day-du build-lại) chứng gián tiếp
  dist-khớp-src; D1-D-build chứng script. Đề xuất HOC-2: đột biến chèn 'Download the React DevTools' vào bundle hiện có.
- **thu_P20 liveness (AU-G5):** như trên — chưa chứng minh đỏ được.
Vậy "D1 đủ" = 46 đột biến phủ mọi phép TĨNH + 6/7 phép chạy-thật; NGOẠI LỆ CHƯA KIỂM: D2/D3/D4, thu_P20, và 2 chùm
canhBao-thuần (F2, T2–T4) vốn không có nhánh FAIL.
