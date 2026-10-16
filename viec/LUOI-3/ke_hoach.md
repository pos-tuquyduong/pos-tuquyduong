# LUOI-3 — kế hoạch (CHỜ DUYỆT)

Nền: HEAD `8303c1b`. Chỉ thêm ca hồi quy + bộ đột biến của việc; 0 dòng `server/`, `client/`. Số dòng dưới đọc trong lượt này.

## 0. Sự thật đã đo (N0)
- 10 đột biến AU3-8…17 áp được trên HEAD (không HỎNG) và SỐNG; đối chứng xanh (P26c 111/111, GOI1 101/101) — `trang_thai.md` mục N0.
  **Không neo lại**, không đụng `viec/AUDIT-3/`.
- Đọc code, vì sao mỗi cái sống (để chọn ĐÚNG dữ liệu, không chép nguyên "ca đỏ đề xuất" của AUDIT-3):
  - AU3-8 `tienDaTra.js:18` `tra = min(tong, total − ship)`: bỏ `− ship` chỉ đổi kết quả khi `total − ship < tong`, tức đơn có
    **giảm**. Ca đề xuất của AUDIT-3 (đơn 50.000 + ship 10.000, KHÔNG giảm) cho `min(50.000, 60.000) = 50.000` cả gốc lẫn đột biến →
    xanh oan (K3). Phải có ship **và** giảm.
  - AU3-9 `:16` giá dòng: một dòng flash chia tỉ lệ ra cùng số; cần ≥ 2 dòng, một flash một thường.
  - AU3-10 `:22` `giam = discount − flash − tier` (cột `discount` = TỔNG giảm — `orders.js:694–696`): cần flash + mã 1 món cùng đơn.
  - AU3-11/12 `goiKhach.js:24, :26`: mọi ca hiện có chỉ một dòng mỗi loại; chưa ca nào có loại cài SL 0 (tạo mới đã bị GOI-1 chặn →
    chỉ có ở **dữ liệu cũ**; `orders.js:267–278` đọc `package_items` của `pos_packages` lúc lấy).
  - AU3-13/14 `tienDaTra.js:87, :83`: **qua API hiện nay trần `total − đã nhận` KHÔNG BAO GIỜ chặn** — đền bị trần ở `damages.js:173–178`
    theo `da_tra` của dòng món (chanTren ≤ chia tỉ lệ), gói không đền được (`GOI_THE_KHONG_DEN` :175), duyệt hoàn chặn đơn có gói
    (`refunds.js:118, :157`), huỷ / xoá chặn sau kết thúc (A4). Mà Σ `da_tra` các dòng ≤ `total − ship` ⇒ `total − đã nhận ≥ da_tra`
    dòng gói ≥ `goc`. Trần chỉ chặn khi sổ có khoản đền VƯỢT `da_tra` — đúng là **dữ liệu cũ**: trước P26c (12.10) trần đền là giá
    gốc (`damages.js:171` chú thích "không theo giá gốc"), trước P26b (03.10) do máy khách quyết. → mục 5, Câu hỏi 1.
  - AU3-15/17 `orders.js:424`, `tienDaTra.js:43`: chưa ca huỷ đơn mua NHIỀU gói một dòng đã lấy. AU3-15 (`quantity: 1`) chỉ đổi số
    khi đơn có **giảm**: không giảm thì `300.000 × 1/(1×10) = 600.000 × 1/(2×10)` → cần giảm. AU3-17 lộ cả khi không giảm.
  - AU3-16 `orders.js:426` `total_price` dòng gói: không gì trong `tienDaTra.js` đọc cột này; chỉ báo cáo (`reports.js:67, :175`
    `SUM(oi.total_price)`). AU3-15 không đổi `total_price`, AU3-17 không đụng dòng đơn → **một bất biến `SUM(total_price) = subtotal`
    chỉ bắt AU3-16**, không bắt N8 / N10 → theo phiếu N9: ca trong `thu_P26c.js`, **không** sửa `bat_bien.js`.

## 1. Phương án

### Phần A — ca thử
| | A (chọn) | B |
|---|---|---|
| chỗ | `thu_P26c.js` một khối `[M]` sau `[L]`, trước `[K1b]` (N1–N3, N8–N10); `thu_GOI1.js` 3 ca cuối `[A2]` (N4, N5) + 1 ca cuối `[B3]` (N6, N7) | thêm KB giả lập (`kich_ban.js`) mua 2 gói / ship / flash + bất biến I20 `SUM(total_price) = subtotal` |
| số file / dòng | 2 file · ~45 + ~25 dòng | 3–4 file (`kich_ban.js`, `bat_bien.js`, `thu_gia_lap.js` `DONG_DAT`/`NGUONG_*`) · ~120+ dòng |
| tốc độ | +< 1 s mỗi bài (đang 2,5 s) | mỗi đột biến chạy giả lập ~40 s |
| rủi ro | khối dùng dữ liệu riêng (SĐT mới, mã giảm riêng), không đổi cài đặt chung → ca sau không bị ảnh hưởng | bất biến chỉ bắt 1/10 (mục 0) — trái điều kiện phiếu N9 |

Chọn A: ít dòng nhất, đúng ưu tiên phiếu (`thu_P26c.js` / `thu_GOI1.js`), không file nào khác trong Phạm vi bị đổi
(`bat_bien.js`, `kich_ban.js`, `thu_gia_lap.js`, `kiem_tra_truoc_khi_giao.js` **không đổi**).

### Phần B — bằng chứng đột biến `viec/LUOI-3/dot_bien.py`
| | A (chọn) | B |
|---|---|---|
| cách | file mới ~35 dòng: nạp `viec/AUDIT-3/dot_bien.py` bằng `importlib` (chỉ ĐỌC — dùng `ap`, `ban_sao`, `chay_bai`, `doi_chung`, `SAP`, `HET` và cặp thay chuỗi theo tên); 10 dòng `('<tên>', '<bài>', r'✗ <ca> ')` — mẫu ĐÚNG ca; in MỌI dòng ✗ của từng đột biến (thấy ca nào khác cùng đỏ) | chép nguyên 10 cặp thay chuỗi + máy chạy sang file mới (~80 dòng, hai nguồn neo dễ lệch) |
| lý do | một nguồn neo (AUDIT-3), mẫu chặt chứng minh "đỏ ĐÚNG ca, không ca khác chặn hộ"; tên đột biến là NGUYÊN chuỗi đầu dòng (A17) | — |

Không sửa `viec/AUDIT-3/dot_bien.py` (Cấm). Mẫu ở đó rộng (`✗ ` cho AU3-8) → không đủ chứng minh đúng ca, nên cần file riêng.

## 2. Ca thử ↔ nghiệm thu (1-1)
Mã giảm riêng của khối `[M]`: `GIAM10_LUOI3` percent 10, scope đơn, không trần. Mỗi ca khẳng định **tổng đơn** trước (mã không áp
→ tổng sai → ca đỏ có lý do, không xanh oan). Flash dựng bằng UPDATE dữ liệu như B1a / B1b (`thu_P26c.js:357–360`).

| NT | đột biến (`viec/AUDIT-3/dot_bien.py`) | ca | khẳng định | đột biến làm |
|---|---|---|---|---|
| N1 | `BV-AU3-P26C-DATRA-BO-TRU-SHIP` | **M1a** món 50.000 + ship 10.000, mã 10 % → tổng 55.000; đền 45.001 → 400 `VUOT_GIA`; 45.000 → 200, ví +45.000 | trần = total − ship = 45.000 | trần 50.000 → 45.001 qua |
|  |  | **M1b** gói 300.000 / 10 lượt + ship 10.000, mã 10 % → tổng 280.000 tiền mặt; lấy 1; owner huỷ → ví +253.000 (= 280.000 − ⌈270.000 × 1/10⌉, GỒM ship) | huỷ hoàn cả ship | 252.000 |
| N2 | `VS-AU3-P26C-DATRA-GIA-GOC` | **M2a** đơn 2 dòng: món 25.000 giá flash 20.000 + món 30.000 (tổng 50.000): đền dòng flash 20.001 → 400, 20.000 → 200 | trần dòng flash = 20.000 | trần 22.727 → 200 |
|  |  | **M2b** cùng đơn, đền dòng thường 30.000 → 200 (K5) | trần dòng thường = 30.000 | trần 27.272 → 400 |
| N3 | `VS-AU3-P26C-DEN-GIAM-BO-FLASH` | **M3a** mã 1 món `GIAM1MON` (A 50.000 − 25.000) + B 30.000 giá flash 24.000 → tổng 49.000; đền A 25.001 → 400, 25.000 → 200 (không chặn oan) | trần A = 50.000 − 25.000 | trần 19.000 → 25.000 bị 400 |
| N4 | `VS-AU3-GOI1-LOAI-KHONG-CONG-DON` | **A2l** CT1 cài 5, đã lấy 2 (còn 3); đơn 2 dòng CT1 2 + CT1 2 → 400 `GOI_HET_LUOT_LOAI`, giao vẫn 2 | cộng dồn 4 > 3 | xin = 2 → 200 |
|  | (K5) | **A2m** cùng gói, 2 dòng CT1 1 + CT1 2 (= đúng 3 còn) → 200, CT1 đã lấy 5 — chứng minh A2l không đỏ vì "2 dòng cùng loại" bị chặn chung | | |
| N5 | `VS-AU3-GOI1-LOAI-SL-0-CUNG-CHAN` | **A2n** gói mới; UPDATE `pos_packages.package_items` = [CT1 0, CT2 5] (dữ liệu cũ, trước GOI-1 A1d); lấy CT1 1 → 200, CT1 đã lấy 1 | loại SL 0 không bị chặn | 400 |
| N6 | `BV-AU3-GOI2-BO-TRAN-DA-NHAN` | **B3p** khách có giảm 10 % (hồ sơ, như B3c); mua gói 1.350.000 + CT3 25.000 → tổng 1.237.500; sổ có khoản đền CŨ 25.000 (giá gốc — ghi qua `ghiVi` để ví khớp sổ, như dữ liệu trước P26c); kết thúc có hoàn → `hoan-du-kien` 1.212.500 và ví +1.212.500; tổng khách nhận = 1.237.500 = total (I19) | trần total − đã nhận | 1.215.000 |
| N7 | `VS-AU3-GOI2-NHAN-BO-DEN` | cùng **B3p** | "đã nhận" gồm đền | 1.215.000 |
| N8 | `VS-AU3-SL-DONG-GOI-SL-1` | **M4a** một dòng mua 2 gói (300.000 × 2), mã 10 % → tổng 540.000; lấy 1 ở gói đầu; owner huỷ → ví +513.000 (= 540.000 − ⌈540.000 × 1/(2×10)⌉), tổng hoàn 513.000 — hoàn MỘT lần | | 510.000 |
| N9 | `VS-AU3-SL-DONG-GOI-TONG-1` | **M4b** cùng đơn, trước khi huỷ: dòng gói `quantity` 2 và `SUM(oi.total_price)` = `subtotal` = 600.000 (cột báo cáo cộng — `reports.js:67, :175`) | | SUM 300.000 |
| N10 | `VS-AU3-SL-HOAN-2-GOI-KHONG-CHIA-SL` | cùng **M4a** | | 486.000 |
| N0 | 10 tên | đã chạy, `trang_thai.md` | | |
| N11 | | chạy lại đủ `viec/P26c`, `GOI-1`, `GOI-2`, `SO-LUONG-1`, `BAN-HANG-1` `dot_bien.py` + 7 tên LUOI-2 (`viec/AUDIT-2/dot_bien.py A3L-… -j 4`): số BẮT / "không áp được" BẰNG nền HEAD (nền đo trước khi sửa, `trang_thai.md`); `npm test`, `--day-du` xanh; mỗi bài đo riêng 3 lần < 80 % hạn 120 s | | |

M4b khẳng định thêm `quantity` 2 là cố ý: AU3-15 chỉ lộ qua tiền khi có giảm (mục 0) — M4a có giảm nên đã bắt; dòng `quantity` ở M4b là
lưới phụ, không thay M4a. Mẫu `dot_bien.py`: N1 `✗ M1[ab] ` · N2 `✗ M2[ab] ` · N3 `✗ M3a ` · N4 `✗ A2l ` · N5 `✗ A2n ` · N6, N7
`✗ B3p ` · N8, N10 `✗ M4a ` · N9 `✗ M4b `.

Bằng chứng: commit 1 = `viec/LUOI-3/dot_bien.py` (chưa có ca) → chạy → SỐNG × 10 (chép vào `bang_chung_do.txt`); commit 2–3 = ca
mới → chạy lại → BẮT × 10, đúng mẫu; ghi `SỐ CA thu_P26c.js: N`, `SỐ CA thu_GOI1.js: N` (dòng tổng trên HEAD). Bảng 10 dòng
(tên · SỐNG trước · BẮT sau · ca đỏ · câu lỗi) vào `trang_thai.md`.

## 3. Đường song song (K4)
- N1, N2, N3 nằm trong `tienDaTraTheoDong` — dùng chung cho đền (`damages.js:173`, chanTren), hoàn huỷ / xoá / duyệt hoàn
  (`soTienHoan`, `orders.js:1346`, `refunds.js:164`) và kết thúc gói (`soTienHoanGoi`, `packages.js:212, :253`). Đột biến ở hàm chung →
  một ca bắt là đủ chứng minh; N1 có HAI ca (đền + huỷ) vì phiếu ghi cả hai vế. Kết thúc gói có ship: không thêm ca (cùng hàm).
- N8, N10 nằm ở `soTienHoan` — huỷ và xoá cùng qua `hoanVi` (`orders.js:1342–1346`); duyệt hoàn đơn có gói bị chặn
  (`refunds.js:118, :157`). Kết thúc gói của dòng nhiều gói chia `/ dong.quantity` (`tienDaTra.js:81`) — đã có B3d (`thu_GOI1.js`
  một dòng 2 gói, kết thúc gói 2 hoàn MỘT nửa); không thêm.
- N4, N5 trong `vuotTheoLoai`, gọi ở HAI chỗ: mua + lấy ngay (`orders.js:416`) và lấy từ gói (`:871`). Đột biến trong thân hàm → một
  ca ở đường lấy từ gói bắt cả hai.
- N6, N7: `soTienHoanGoi` là nơi duy nhất đọc `nhan` (`tienDaTra.js:83, :87`); `hoan-du-kien` (`packages.js:212`) và kết thúc
  (`:253`) cùng gọi → B3p khẳng định cả hai.

## 4. Luồng hợp lệ phải KHÔNG bị chặn (K5)
Việc không đổi code quầy → không phép chặn mới. Ca K5 chống xanh oan: M1a / M2a / M3a 200 ở ĐÚNG trần (biên trên + dưới, K3),
M2b (dòng thường đền đủ giá), A2m (2 dòng cùng loại vừa đủ → 200), A2n (dữ liệu cũ SL 0 → 200), M1b (huỷ hoàn cả ship). Khối `[M]`
không đổi cài đặt chung (flash bằng UPDATE trên đơn của khối) → `[K1b]`, `[S*]`, `[T*]` chạy như cũ — `npm test` toàn bộ chứng minh.

## 5. Câu hỏi cần chủ quán (gửi kèm duyệt kế hoạch)
1. **N6 / N7 (AU3-13, AU3-14) chỉ dựng được bằng DỮ LIỆU CŨ.** Qua API hiện nay trần `total − đã nhận` của kết thúc gói không bao
   giờ chặn (mục 0) — ca "đền món lẻ rồi kết thúc gói" của phiếu chạy trên đột biến vẫn XANH. Đề xuất (A): B3p chèn một khoản đền
   cũ 25.000 theo giá gốc (như sổ trước P26c 12.10) vào đơn có giảm, rồi kết thúc gói → trần chặn 2.500 → hai đột biến BẮT. Đây là
   K5 "dữ liệu cũ trên production" — đơn mua gói trước 12.10 có đền theo giá gốc sẽ đi đúng đường này. (B) không dựng ca, ghi "vế
   thừa" → N6 / N7 không đạt nghiệm thu. **Máy đề xuất A**; chờ duyệt.

## 6. Ngân sách + thời gian máy (đo)
- ~45 dòng `thu_P26c.js` + ~25 dòng `thu_GOI1.js` + ~35 dòng `viec/LUOI-3/dot_bien.py` ≈ 105 dòng — dưới khung 150–250. 0 dòng code quầy.
- Bài: P26c 2,5 s, GOI1 2,0–2,6 s (đo riêng 3 lần) — thêm ~10 ca mỗi bài, dự kiến < 4 s, xa 96 s (80 % của 120 s).
- 10 đột biến AUDIT-3 (4 luồng): đo ở N0 — xem `trang_thai.md` (lần chạy nền N11 ghi thời gian từng bộ).
