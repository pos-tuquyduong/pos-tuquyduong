# HUY-1 — kế hoạch (CHỜ DUYỆT)

Lời thường: hiện nay huỷ đơn chỉ trả lại phần khách trả bằng ví; phần tiền mặt / chuyển khoản không được ghi vào đâu. Kế hoạch giữ NGUYÊN
lệnh huỷ đang có ở máy chủ (một giao dịch, đã chặn huỷ hai lần) và thêm: hoàn TOÀN BỘ tiền đã trả vào ví khách (khách lẻ: ghi một khoản
trả tiền mặt từ két), lý do có mã, quyền theo ngày, hai dòng mới ở Đối soát, nút "Huỷ đơn" ở chi tiết đơn và ở màn Đơn App, App thấy số đã
hoàn. Không làm lối huỷ mới.

## 1. Hiện trạng — đọc trong lượt này (main `4723a3b`, nhánh `1d21626`)
| Chỗ | File:dòng | Đang làm gì |
|---|---|---|
| Route huỷ | `server/routes/orders.js:1449-1630` | `checkPermission("cancel_order")`; đọc đơn trong tx; cổng `UPDATE … WHERE id = ? AND status = 'completed'` + `changes !== 1` → 400 `DON_KHONG_HUY_DUOC` (`:1479-1492`); gói / thẻ / mã / điểm / yêu cầu hoàn / kho SX |
| Hoàn ví | `orders.js:1434-1443` `hoanVi` → `tienDaTra.js:35-52` `soTienHoan` → `wallets.js:101` `ghiHoan` → `ghiVi` | đơn KHÔNG gói: chỉ `balance_amount` (+ phần mẹ); đơn có gói: `total − nợ − đã dùng − đã đền`, phần ngoài ví ghi `'hoan_goi'` |
| Xoá đơn | `orders.js:1674` gọi CÙNG `hoanVi(…, "xóa")` | K5: không đổi |
| Kết thúc gói | `packages.js:267` gọi CÙNG `ghiHoan` | không đổi |
| Duyệt hoàn | `refunds.js:116` chặn đơn cancelled; `:158` `UPDATE … AND status='completed'` | đã chặn duyệt hoàn đơn đã huỷ |
| Quyền | `database.js:1073` seed staff `cancel_order` = 1; `middleware/auth.js:90` owner luôn qua | staff đang huỷ được |
| Tiền đơn | `orders.js:924-938` cột `cash_amount / transfer_amount / balance_amount / parent_balance_amount / debt_amount`; thu nợ cộng vào cột (`:1341-1358`); phiên QR ghi `transfer_amount` (`giuCho.js:94`) | đủ để chia nguồn hoàn |
| Đối soát két | `doiSoat.js:97-114` `tienTheoSo`: `tra_ra` = cột tiền của đơn cancelled (trừ đơn mua gói) | coi tiền mặt / CK của đơn huỷ là "trả tận tay" |
| Két ở Đơn thu | `server/utils/donThu.js:71-79` `tienMatTheoNgay` — CHÉP công thức `tienTheoSo('cash')`, trừ `cash_amount` của đơn cancelled | **ngoài Phạm vi** — Q5 |
| Bất biến | `cong_cu/gia_lap/bat_bien.js:218-225` I11, `:336` I18 (total_spent) — chỉ bỏ qua dòng refund `'hoan_goi'`; I19 `:344-349` chỉ canh đơn CÒN | **ngoài Phạm vi** — Q2 |
| Bài cũ | `cong_cu/gia_lap/kich_ban.js:440,482,518,627` huỷ bằng `'nv'` (staff); ~13 bài `cong_cu/thu_*.js` gửi `{ reason }` | staff = 0 làm đỏ kịch bản — Q5 |
| Đơn App | `donApp.js:53-56` `tienTrinh` (đơn thật cancelled → `da_huy`); `:272` `tomDon`; `:323-327` `dsQuay` chỉ đơn ĐÃ trả, không trả id đơn thật | đơn App đã trả = đơn `completed` ở mọi tiến trình → route huỷ đã nhận |
| Nhật ký | `don-mo-rong.js:91` dựng dòng `huy` từ `cancelled_reason / by / at` | không cần ghi nhật ký riêng |
| Giao diện | `Orders.jsx:670` nút Xoá/Huỷ chỉ owner; `:249` gọi `ordersApi.cancel`; `api.js:379` | lý do gõ tự do |

## 2. Phần việc — phương án, chọn
### P1 · Hoàn toàn bộ tiền đã trả (D, E) — `orders.js`, `wallets.js`
- **A (chọn — sau soát, ngắn nhất):** KHÔNG viết hàm tính mới. `hoanVi` thêm cờ `toanBo` (chỉ route huỷ bật): gọi `soTienHoan(tx, order,
  total − debt_amount)` — hàm này đã trừ phần đền và cho ví mẹ nhận trước; đơn có gói vẫn tính như cũ — rồi coi như `coGoi`: ví con =
  min(con, `balance_amount`), phần còn lại chia **tiền mặt (≤ `cash_amount`) → CK**. `ghiHoan` thêm tham số `ck` (mặc định 0, ghi chú riêng)
  → kết thúc gói và xoá đơn không đổi. ~20 dòng. Khi huỷ:
  - có SĐT: mỗi phần > 0 một dòng `ghiVi` `type='refund'`: mẹ / ví con cách `cash` (giảm `total_spent`, như nay); tiền mặt và CK cách
    `'hoan_goi'` (không giảm `total_spent`), ghi chú "Huỷ đơn X — hoàn phần tiền mặt" / "… phần chuyển khoản" (Q2);
  - không SĐT (khách lẻ): một dòng `pos_hoan_tien_mat` (đơn, số tiền = tiền mặt + CK − đền, người, lúc, mã lý do, lý do). Không ví nào đổi.
  - Xoá đơn gọi `hoanVi` không cờ → y như cũ (ca K1).
- A' (bản đầu, bỏ): hàm mới `soTienHoanHuy` — dài hơn, chép lại phần đền / mẹ.
- B: sửa thẳng `soTienHoan` cho mọi đơn → đổi luôn xoá đơn và duyệt hoàn (vi phạm K5). Loại.

### P2 · Quyền theo ngày (B) — `orders.js`, `database.js`, `nang_cap/020_huy_don.js`
- **A (chọn):** trong tx, sau khi đọc đơn: `order.created_at.slice(0,10) < getNow().slice(0,10)` và `role !== 'owner'` → 403
  `{ code: 'HUY_DON_NGAY_TRUOC' }` (~5 dòng). Bước 020: `UPDATE pos_permissions SET allowed = 0 WHERE role='staff' AND permission='cancel_order'`
  (chạy một lần, không đè chỉnh sau này); seed `database.js:1073` → 0.
- B: quyền mới "huỷ đơn cũ" — thêm dòng quyền + màn chỉnh; phiếu chỉ cần owner. Loại.

### P3 · Lý do có mã (C) — `orders.js`, `020`
- **A (chọn):** hằng `LY_DO_HUY = { pha_nham, bam_nham, het_nguyen_lieu, khach_doi_y, khac }` (nhãn tiếng Việt) MỘT chỗ ở `orders.js`,
  trả qua `GET /orders/ly-do-huy` (~5 dòng) cho giao diện; thân `{ ly_do_ma, ghi_them }`: mã lạ → 400 `THIEU_LY_DO`; `khac` mà `ghi_them`
  trống sau trim → 400. Cột mới `pos_orders.huy_ly_do_ma`; `cancelled_reason` = "nhãn · ghi thêm" (nhật ký đọc như cũ).
  Thân cũ `{ reason }` (không `ly_do_ma`, reason không trống) → coi là `khac` + ghi thêm = reason: vẫn bắt buộc có lý do, ~13 bài cũ không phải
  sửa; thiếu cả hai / trống → 400 (hiện nay ghi "Không có lý do" — `orders.js:1482`).
- B: giao diện viết cứng danh sách → hai nơi giữ một danh sách. Loại.

### P4 · Đối soát (F) — `doiSoat.js` (+ `donThu.js`, Q5), màn Đối soát
- **A (chọn):** mốc luật = `huy_ly_do_ma IS NOT NULL` (đơn huỷ theo luật mới). `tienTheoSo.tra_ra`: công thức cũ thêm `AND o.huy_ly_do_ma IS NULL`
  (lịch sử cũ giữ nguyên số) + với tiền mặt cộng `SUM(pos_hoan_tien_mat.so_tien)` theo ngày; CK của đơn luật mới không trả ra (đã về ngân hàng).
  `tongHop` thêm `huy_don { hoan_tai_khoan: X, hoan_tien_mat: Y }` (X = tổng dòng refund của đơn có `huy_ly_do_ma`, theo ngày ghi; Y = tổng
  `pos_hoan_tien_mat`); màn hiện hai dòng đúng chữ phiếu. `donThu.js` đổi cùng cách để hai nơi tính két không lệch. ~25 dòng.
- B: đánh dấu bằng ngày cứng → số cứng (cấm). Loại.

### P5 · Đơn App (H, A) — `donApp.js`, `HOP_DONG_API_KH.md`, `thu_HOPDONG_KH.js`, `routes/kh/quay.js`
- **A (chọn):** `tomDon` thêm `hoan_vao_tai_khoan` (tổng refund của đơn vào SĐT khách token; null khi không `da_huy`) và `ly_do_huy` (CHỈ nhãn
  của mã, KHÔNG "ghi thêm" của nhân viên; null khi không có). Hợp đồng PHIEN_BAN 9 → 10 (chat chỉnh số lúc gộp), nhật ký cuối file, bài canh
  hợp đồng thêm hai trường. `dsQuay` trả thêm `oid` để màn Đơn App gọi cùng route huỷ.
- Đơn App chưa trả không có trên màn quầy → khách tự huỷ (`huyDon` có sẵn) hoặc QR tự hết hạn. Không thêm lối — Q3.
- B: route huỷ riêng cho đơn App → hai đường huỷ tiền. Loại.

### P6 · Giao diện (A, C) — `Orders.jsx`, `DonApp.jsx`, màn Đối soát, `utils/api.js`, build `dist`
- **A (chọn):** một thành phần `HopHuyDon.jsx` (~80 dòng: nút lý do lấy từ máy chủ, ô ghi thêm, khoá nút tới khi đủ) dùng ở chi tiết đơn
  (hiện cho owner + manager; manager không thấy nút với đơn ngày trước) và thẻ Đơn App. Nút Xoá của owner giữ nguyên. Route huỷ trả
  `{ hoan: { tai_khoan, tien_mat } }` để màn báo "Đã hoàn X vào tài khoản" / "Trả khách Y tiền mặt".
- B: chép khối huỷ vào hai màn → trùng. Loại.
- **Xung đột với bản mẫu đã chốt** — Q1. Chưa làm giao diện cho tới khi chủ quán trả lời.

### P7 · Sao lưu — `backup.js`: thêm `pos_hoan_tien_mat` vào `BACKUP_TABLES` và vào danh sách bảng tiền không khôi phục đè.

### Bước 020 (`server/nang_cap/020_huy_don.js`, chỉ THÊM)
`themCot('pos_orders', 'huy_ly_do_ma TEXT')`; `CREATE TABLE IF NOT EXISTS pos_hoan_tien_mat (id, order_id INTEGER NOT NULL UNIQUE, so_tien
INTEGER NOT NULL, ly_do_ma, ly_do, nguoi, luc)`; UPDATE quyền staff (tự sao lưu dòng quyền trước khi đổi).

## 3. Ngân sách (ước lượng)
Máy chủ ~160 dòng (orders.js ~60, wallets ~8, donThu ~5, doiSoat ~20, donApp ~15, 020 ~30, database / backup / quay ~7) · giao diện ~150 ·
thử ~450 (`cong_cu/thu_HUY1.js`). Trong ngân sách phiếu (300 / 200 / 500).

## 4. Ca thử — ánh xạ 1-1 với Nghiệm thu (`cong_cu/thu_HUY1.js`)
| NT | Ca (ĐỎ trên gốc trừ khi ghi "ca canh") |
|---|---|
| A | A1 đơn quầy đã xong (= đã giao khách) huỷ → 200, hoàn đúng; A2 đơn App `tien_trinh_quay` = '' / `dang_lam` / `xong` huỷ → 200, `tienTrinh` = `da_huy`; A3 đơn chưa thu (nợ toàn bộ) huỷ → 200, không hoàn gì; A4 `dsQuay` trả `oid`; A5 giao diện: build `dist` + `--day-du`, thử tay 3 thao tác (chi tiết đơn → Huỷ đơn; thẻ Đơn App → Huỷ đơn; nút khoá khi chưa chọn lý do) — máy không bấm nút, ghi CHƯA KIỂM |
| B | B1 staff → 403 (kho mới seed + kho cũ qua 020); B2 manager đơn hôm nay → 200; B3 manager đơn hôm qua → 403 `HUY_DON_NGAY_TRUOC`, không ghi gì; B4 owner đơn hôm qua → 200; B5 ranh 23:59:59 hôm qua / 00:00:00 hôm nay (giờ VN, `getNow`) |
| C | C1 thiếu lý do → 400; C2 mã lạ → 400; C3 `khac` + ghi thêm "  " → 400; C4 `khac` + ghi thêm → 200, lưu `huy_ly_do_ma`, `cancelled_reason`, `cancelled_by`, `cancelled_at`; C5 mã có sẵn không ghi thêm → 200; C6 thân cũ `{ reason: 'x' }` → 200, mã `khac` |
| D | D1 tiền mặt → ví +total, 1 dòng 'hoan_goi' ghi chú tiền mặt; D2 CK → ví +total; D3 ví → như cũ; D4 ví + tiền mặt → 2 dòng, tổng = total; D5 ví mẹ + ví con + tiền mặt → mẹ đúng phần mẹ; D6 đơn nợ đã thu một phần → hoàn = total − nợ còn; D7 đơn có đền → trừ phần đền; D8 bất biến ví (số dư = tổng sổ; I11 / I18 không lệch) sau mọi ca; D9 đơn có SĐT không bao giờ có dòng `pos_hoan_tien_mat` |
| E | E1 khách lẻ tiền mặt → 1 dòng `pos_hoan_tien_mat` = cash; E2 khách lẻ CK → dòng = transfer (trả bằng tiền mặt); E3 không ví nào đổi; E4 dòng đủ đơn, số, người, lúc, mã lý do, lý do; E5 grep: chỉ route huỷ ghi `pos_hoan_tien_mat` (lối duy nhất); UNIQUE `order_id` chặn dòng thứ hai |
| F | F1 `tongHop` ngày huỷ có `huy_don.hoan_tai_khoan` = X, `hoan_tien_mat` = Y; F2 két `tra_ra` tiền mặt = Y (đơn có SĐT không trừ két); F3 CK `tra_ra` = 0 cho đơn luật mới; F4 `donThu.js` cùng số với `tienTheoSo`; F5 đơn huỷ CŨ (`huy_ly_do_ma` NULL) giữ số cũ — ca canh |
| G | G1 điểm trừ lại; G2 lượt mã + voucher trả lại; G3 kho SX: lệnh trả / `pos_stock_pending` đúng vân tay; G4 đơn mua gói: manager 403 như cũ, owner được; G5 huỷ lần hai → 400 `DON_KHONG_HUY_DUOC`, ví không đổi; G6 **hai người bấm cùng lúc** (2 lệnh song song) → đúng một 200, ví tăng một lần, `pos_hoan_tien_mat` một dòng; G7 yêu cầu hoàn đang chờ → rejected, duyệt sau → 400; G8 đơn mua thẻ hội viên huỷ → dòng thẻ xoá như cũ, tiền vào ví |
| H | H1 `GET /don/:ma` đơn bị huỷ → `da_huy`, `hoan_vao_tai_khoan` = X, `ly_do_huy` = nhãn (không lộ ghi thêm); H2 khách B đọc đơn khách A → 404 như cũ; H3 đơn chưa huỷ → hai trường null; H4 phiên chờ: `POST /don/:ma/huy` → `da_huy`, không dòng ví (ca canh); H5 `thu_HOPDONG_KH.js` đỏ khi hợp đồng thiếu hai trường / PHIEN_BAN chưa tăng |
| K5 | K1 xoá đơn của owner: số hoàn như gốc; K2 duyệt hoàn `refunds.js`: như gốc; K3 tạo đơn / tính tiền không đổi (`npm test` hiện có); K4 kết thúc gói có hoàn (`packages.js`): dòng ví như gốc |

Đột biến dự kiến (`viec/HUY-1/dot_bien.py`, mỗi dòng một tên): `BV-HOAN-TIEN-MAT`, `BV-HOAN-CK`, `BV-KHACH-LE`, `BV-NGAY-TRUOC`,
`VS-NGAY-UTC` (so ngày bằng `new Date()` UTC), `VS-THU-TU-ME` (con trước mẹ), `VS-HOAN-QUA` (không trừ nợ còn), `BV-LY-DO`, `VS-KHAC-TRIM`,
`VS-KET-CU` (bỏ `huy_ly_do_ma IS NULL`), `BV-KET-Y`, `VS-LO-GHI-THEM` (App thấy ghi thêm), `BV-STAFF-020`, `VS-XOA-DOI` (xoá đơn đi đường mới),
`VS-CK-GOI` (ghiHoan mặc định ck ≠ 0).

## 5. Đường song song phải canh (K4)
- `hoanVi` dùng chung huỷ + xoá (`orders.js:1500`, `:1674`) → chỉ huỷ bật cờ; ca K1.
- `ghiHoan` dùng ở `packages.js:267`; `soTienHoanGoi` (`tienDaTra.js:75-91`) lọc `'hoan_goi'` nhưng chỉ đơn completed → đơn đã huỷ không vào; ca K4.
- `soTienHoan` dùng ở `refunds.js` → không đổi hàm; ca K2.
- `tienTheoSo` (cho `tongHop` + `soKet`) và bản chép `donThu.js:71-79` → sửa cả hai (Q5); ca F2 + F4.
- Bất biến I11 / I18 / I19 đọc dòng refund → dòng mới cách `'hoan_goi'` (Q2); ca D8.
- `tienTrinh` / `HUY` dùng ở App, `dsQuay`, `doiTienTrinh` → không đổi; `doiTienTrinh` đã chặn đơn huỷ.
- `don-mo-rong.js:91` nhật ký `huy` đọc `cancelled_reason` → vẫn có chữ.
- `reports.js` đếm đơn cancelled — chỉ đọc, không đổi.

## 6. Luồng hợp lệ phải KHÔNG bị chặn (K5)
Manager huỷ đơn hôm nay (B2) · owner huỷ đơn cũ (B4) · đơn chưa thu (A3) · đơn App đang làm (A2) · thân cũ `{ reason }` (C6) · đơn mua gói bởi
owner (G4) · xoá đơn owner (K1) · duyệt hoàn (K2) · kết thúc gói (K4) · khách App huỷ phiên chờ (H4) · dữ liệu cũ ở Đối soát (F5).

## 7. Rủi ro
- `created_at` của đơn rất cũ có thể mang hậu tố UTC — so 10 ký tự đầu; lệch thì chỉ khiến đơn thành "ngày trước" (owner-only) — phía an toàn.
- Đơn khách có SĐT trả tiền mặt không còn được trả tận tay — đúng quyết định 05.11 (thắng ghi chú 31.10 "nhân viên chuyển trả tay").

## 8. Thứ tự làm sau khi duyệt
Chờ CK-NOIDUNG-1 gộp (Q4) → bài thử đỏ → 020 + máy chủ → giao diện + build → `npm test`, `--day-du`, cổng → `/ra-soat` → `/soat-bao-mat`.

## 9. Câu hỏi cần chủ quán chốt (mỗi câu có đề xuất — bạn chỉ cần xác nhận)
- **Q1 · Bản mẫu giao diện.** Bản vẽ đã chốt (`ban_mau_pos/ban_mau_pos.html:385-390, 569-574`): huỷ bill ở thẻ bill màn Bán hàng, CHỈ bill chưa
  thu, lý do "Khách bỏ đi · Tạo nhầm · Khách đổi món · Khác", có hoàn tác 5 giây; Lịch sử đơn KHÔNG có nút huỷ. Phiếu HUY-1 muốn nút ở chi tiết
  đơn + màn Đơn App, 5 lý do khác. `ban_mau_pos/` không nằm trong Phạm vi. **Đề xuất:** phiếu HUY-1 (05.11) thắng; thêm `ban_mau_pos/**` vào Phạm
  vi để mình sửa bản mẫu trước (nút Huỷ đơn ở chi tiết Lịch sử đơn, 5 lý do của phiếu, KHÔNG hoàn tác 5 giây vì tiền đã vào ví), chạy
  `chay_thu.sh` đủ phép, rồi mới sửa màn thật.
- **Q2 · Ghi nguồn trên sổ ví.** Bất biến I11 / I18 (ngoài Phạm vi) chỉ bỏ qua dòng hoàn cách `'hoan_goi'`. **Đề xuất:** dùng lại `'hoan_goi'` cho phần
  tiền mặt / CK, nguồn ghi rõ trong ghi chú từng dòng — không đụng bất biến. Muốn mã máy riêng (`hoan_tien_mat`, `hoan_ck`) thì cần thêm
  `cong_cu/gia_lap/bat_bien.js` vào Phạm vi.
- **Q3 · Đơn App chưa trả ở quầy.** Màn Đơn App chỉ hiện đơn đã trả. **Đề xuất:** không thêm lối quầy huỷ phiên chờ — khách tự huỷ trên App (đã có),
  QR tự hết hạn; khoá bằng ca H4.
- **Q4 · Thứ tự với CK-NOIDUNG-1.** Phiếu dặn làm sau khi CK-NOIDUNG-1 gộp; luật cấm `git merge`. **Đề xuất:** khi CK-NOIDUNG-1 gộp, bạn mở phiên
  mới và cho phép mình dựng lại `viec/HUY-1` từ main mới (giữ commit phiếu + kế hoạch), rồi làm.
- **Q5 · Thêm vào Phạm vi.** (a) `server/utils/donThu.js` — bản chép công thức két, phải sửa cùng `doiSoat.js`; (b) `cong_cu/gia_lap/kich_ban.js` —
  4 chỗ huỷ bằng nhân viên sẽ đỏ khi nhân viên hết quyền huỷ; đổi sang quản lý là bài sửa vì hành vi bạn đã duyệt đổi (luật 6.8). Bài `thu_*.js`
  khác giữ nguyên nhờ vẫn nhận thân cũ `{ reason }`. **Đề xuất:** thêm hai file đó vào Phạm vi.
