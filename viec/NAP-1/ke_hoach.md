# NAP-1 — kế hoạch (chờ chủ quán duyệt)

Viết trên `0406870` (main `d1b57b8` + phiếu). Số dòng trích là của bản này — HANG-1 gộp trước sẽ làm trôi (xem `trang_thai.md` Phát hiện).
Ba câu hỏi chờ trả lời ở `trang_thai.md` `## Câu hỏi` (Phạm vi cho mục E, màn nào có nhóm Nạp tiền, hoàn một phần). Kế hoạch dưới viết theo
**đề xuất** của từng câu; chủ quán chọn khác thì máy sửa kế hoạch trước khi làm.

## 0. Hiện trạng đã đọc (lượt này)

| Điều | Chỗ |
|---|---|
| `ghiVi` là CHỖ DUY NHẤT ghi `pos_wallets` (bộ kiểm E12), trong giao dịch ghi, cộng tương đối, ghi dòng sổ cùng lúc | `server/routes/wallets.js:74` |
| Mọi lối trừ ví đi qua `ghiVi`: trả đơn + ví mẹ (`orders.js:886-904`, phiên P3 / App cũng chốt qua `taoDon` — `giuCho.js` `chotPhien`), `/deduct`, `/adjust` âm | `wallets.js:153`, `:188` |
| Mọi lối cộng lại theo đơn: huỷ / xoá đơn (`orders.js` `hoanVi` → `ghiHoan`), kết thúc gói (`packages.js:266` → `ghiHoan`), duyệt hoàn (`refunds.js:165`), đền bù (`damages.js:184`) — đều gọi `ghiVi` với `orderId` | `wallets.js:101` |
| Đối soát ví `reconcileWallet` ghi tuyệt đối số dư := tổng sổ (danh sách trắng `LOAI_TINH_VAO_VI`) | `wallets.js:274`, `:281` |
| Bán gói / thẻ = dòng hàng `product_id` âm trong `taoDon`; mua gói / thẻ phải thu đủ | `orders.js:458-503`, `:254` |
| Điểm: `tienTinhDiem` KHÔNG tính phần ví (luật 24.10) | `server/utils/diemThat.js` (ngoài Phạm vi — Câu hỏi 1) |
| Két: bán (cột tiền của đơn) + nạp ví (dòng `topup` theo `payment_method`) | `server/utils/doiSoat.js:97-113` |
| Đền bù chặn đơn có dòng `product_id < 0` | `server/routes/damages.js:174-176` |
| Yêu cầu hoàn chỉ cho đơn có `balance_amount > 0` | `server/routes/refunds.js:116` |
| App KH dựng `don` từ trường cố định (không chuyển trường lạ vào `taoPhien`) | `server/utils/donApp.js:221` |

## 1. Dữ liệu (bước `server/nang_cap/014_nap.js`, chỉ THÊM)
- Bảng `pos_goi_nap (id, ten, khach_tra INTEGER, vao_tk INTEGER, is_active, thu_tu, created_at, updated_at, updated_by)`.
- `pos_wallets.thuong INTEGER DEFAULT 0` — phần THƯỞNG NẠP còn trong số dư. Tiền nạp = `balance − thuong` (suy ra, không lưu — bất biến
  "hai ngăn = balance" đúng theo cấu trúc, chỉ còn phải canh `0 ≤ thuong ≤ balance` và `thuong` = tổng sổ).
- `pos_balance_transactions.thuong INTEGER DEFAULT 0` — phần của `amount` thuộc ngăn thưởng (có dấu). Dòng cũ 0 → ví cũ toàn bộ là tiền nạp (C).
- Thêm cột qua `themCot` (tự sao lưu bảng trước). `pos_goi_nap` vào `BACKUP_TABLES` (`backup.js`), khôi phục được như danh mục; ví / sổ ví vẫn
  ở `BANG_KHONG_KHOI_PHUC`. `chay.js` tự nhận bước theo tên — không sửa.

| | A (chọn) | B |
|---|---|---|
| Ngăn ví | 1 cột `thuong` ở ví + 1 cột ở sổ (phiếu đã xét) | 2 cột `tien_nap`, `thuong` → thêm bất biến tổng, mỗi chỗ ghi phải giữ 3 số khớp |
| Dòng | ~20 | ~35 |

## 2. Ví hai ngăn — một hàm, mọi lối (C, D)
`server/utils/viKhach.js` (mới, phép tính thuần + một câu đọc):
- `thuongKhiTru(soDu, thuong, soTru)` = phần thưởng của một khoản trừ theo TỶ LỆ đang có: `round(soTru × thuong / soDu)`, kẹp
  `max(thuong − (soDu − soTru), …)` và `≤ thuong` → trừ hết số dư thì trừ hết thưởng; số dư ≤ 0 → 0.
- `thuongKhiHoan(tx, phone, orderId, soTien)` = phần thưởng của một khoản cộng lại THEO ĐƠN: đọc sổ của (phone, đơn) → `daTru` (thưởng đã
  trừ − đã trả lại), `viDaTru` (tiền ví đã trừ); trả `min(daTru, round(soTien × thuongDaTru / viDaTru))` (Câu hỏi 3 — chia theo tỷ lệ phần
  ví; hoàn trọn phần ví → trả đúng toàn bộ thưởng; phần tiền mặt / CK đưa vào ví của đơn mua gói (`hoan_goi`) không thêm thưởng vì đã kẹp `daTru`).
- `ghiVi` (`wallets.js`) nhận thêm `thuong` (chỉ đường bán gói nạp truyền) và tự tính khi không truyền: `soTien < 0` → `thuongKhiTru`;
  `soTien > 0` + `orderId` + loại `refund` / `compensation` → `thuongKhiHoan`; còn lại (nạp tay, điều chỉnh cộng) → 0 = tiền nạp.
  Ghi `thuong = thuong + ?` cùng câu UPDATE số dư, và cột `thuong` của dòng sổ. **Không chỗ gọi nào khác phải sửa** — huỷ, xoá, duyệt hoàn,
  đền bù, kết thúc gói (packages.js / damages.js ngoài Phạm vi) đều đúng ngăn qua `ghiVi`.
- `reconcileWallet`: ghi thêm `thuong := SUM(thuong)` của cùng danh sách trắng (vẫn chỗ duy nhất ngoài `ghiVi`, E12 không đổi).
- D: không thêm lối hoàn tiền nạp nào; `/adjust` giữ nguyên lời / quyền / lý do (âm → trừ theo tỷ lệ, dương → tiền nạp).

| | A (chọn) | B |
|---|---|---|
| Chỗ tính ngăn | trong `ghiVi` (một chỗ, mọi lối kể cả file ngoài Phạm vi) | mỗi route tự tính rồi truyền → 7 chỗ gọi, 2 file ngoài Phạm vi, K4 |
| Dòng | ~45 (viKhach 30 + ghiVi 15) | ~70 |

## 3. Gói nạp — cài đặt (A)
`server/routes/goi-nap.js` mount `/api/pos/goi-nap` (`index.js`): `GET /` (authenticate — quầy đọc gói đang bật; `?tat_ca=1` cần quyền),
`POST /`, `PUT /:id` (sửa + bật / tắt) — `checkPermission('manage_products')`. Kiểm: `khach_tra` nguyên > 0, `vao_tk` nguyên ≥ `khach_tra`,
tên không rỗng → sai 400 `GOI_NAP_KHONG_HOP_LE`. Không xoá cứng (đơn cũ trỏ tới gói) — "bớt gói" = tắt. ~70 dòng.

## 4. Bán gói ở quầy (B) — đi ĐÚNG đường `taoDon` (LUAT §5)
Thân đơn thêm `goi_nap_id`. Trong `taoDon` (`orders.js`), cổng đặt cùng chỗ cổng gói / thẻ:
- bắt buộc `normalizePhone(customer_phone)` (cùng biểu thức với chỗ ghi ví — K4 SO-LUONG-1) → 400 `NAP_CAN_KHACH`;
- **chặn gộp**: có `goi_nap_id` thì `items` phải rỗng, không `package_buy` / `membership_buy` / `customer_package_id` → 400 `NAP_KHONG_GOP`.
  Lý do chọn chặn (không tách dòng): đơn nạp không có giảm hạng / mã / điểm / huỷ — trộn với món thì mọi phép tính trên đơn (giảm hạng, mã,
  điểm, hoàn, đền) phải tách phần nạp ra; chặn thì một vị từ `goi_nap_id` đủ cho mọi luật;
- không mã (`discount_code`), không phí giao, không trả ví (`balance_amount` / `parent_balance_amount` / `payment_method = 'balance'`),
  không nợ (`debt_amount > 0`) → 400 `NAP_CHI_TIEN_MAT_QR`;
- máy chủ tra `pos_goi_nap` đang bật (không tin số màn hình) → dòng hàng `product_id = −(2000000 + id)` (ngoài dải gói −1..−999999 và thẻ
  −1000001.., nên đền bù đã chặn — `damages.js:174`), `unit_price = khach_tra`, tên "Nạp tiền 100.000 → vào tài khoản 105.000";
  tổng = `khach_tra`; phép đối chiếu tiền sẵn có (`orders.js:833`) giữ nguyên.
- Trong CÙNG giao dịch tạo đơn, sau khi có `orderId`: `ghiVi(loai 'topup', soTien = vao_tk, thuong = vao_tk − khach_tra, orderId,
  cachTra = tiền mặt / CK, cot total_topup)`. Lỗi → rollback cả đơn (tiền chưa vào, đơn chưa có).
- Không điểm: `diemTao = null` khi `goi_nap_id` (E — lúc nạp không tích).
- Phiên thanh toán (`giuCho.js`): thêm `goi_nap_id` vào `TRUONG_DON` + `TRUONG_TINH_THU`; `taoPhien` chặn `tru_tai_khoan` / `tru_tai_khoan_me` /
  `cach = 'tai_khoan'` khi có `goi_nap_id` (chặn ngay lúc giữ — không để phiên giữ ví rồi hỏng lúc chốt). QR (payOS / cổng đang chọn) và
  tiền mặt chốt qua `chotPhien` → `taoDon` như mọi đơn. "Huỷ trước khi thu đủ → không cộng gì": phiên huỷ / hết hạn không gọi `taoDon` (sẵn có).
- **Đơn nạp không huỷ / xoá / hoàn** (D): `huỷ` (`orders.js:1448`) và `xoá` (`:1637`) kiểm đơn có dòng `topup` gắn `order_id` → 400
  `NAP_KHONG_HOAN`, đặt TRƯỚC câu đổi trạng thái. Yêu cầu hoàn đã chặn sẵn (đơn nạp `balance_amount = 0`, `refunds.js:116`); thêm cùng vị từ
  vào duyệt hoàn (`refunds.js:145`) cho chắc — một vị từ `laDonNap` ở `viKhach.js`.

| | A (chọn) | B |
|---|---|---|
| Bán nạp | dòng hàng trong `taoDon` (dùng lại phiên, QR, két, hoá đơn, màn khách) | route `/goi-nap/ban` riêng + phiên QR riêng → viết lại đường QR / két / in |
| Nhận đơn nạp | MỘT vị từ: "đơn có dòng sổ `topup` gắn đơn" (`viKhach.js`) | thêm cột loại đơn → bước nâng cấp đụng `pos_orders` (phiếu không cho) |
| Dòng | ~55 orders.js + ~6 giuCho | ~150 |

## 5. Điểm (E) — chờ Câu hỏi 1
`diemThat.js`: tiền tính điểm = `min(tiền mặt + CK + ví + ví mẹ, total) − phí giao` (bỏ trần "total − ví"). Một hàm cho POST /orders,
pay-debt, nhận điểm mã bill. `bat_bien.js` I8 đổi cùng công thức (công thức RIÊNG như hiện nay, không gọi hàm server) + đơn nạp đúng luật = 0.
Đơn tạo trước mốc `DIEM_VI_TU` (ngày gộp + 1) ở Đối soát thật nhận cả luật cũ (khuôn `DIEM_THAT_TU`).

## 6. Sổ sách (F)
- Két (`doiSoat.js` `tienTheoSo`): `napVi` chỉ đếm dòng `topup` **không** gắn đơn (`order_id IS NULL` — nạp tay); tiền đơn nạp đã nằm ở cột
  tiền của đơn → khớp két / sao kê, không đếm đôi. `tongHop.vi` tách `nap` / `thuong_nap`.
- Báo cáo doanh thu (`reports.js` `/daily`, `/sales`, `/staff`): loại đơn nạp (cùng vị từ) — nạp không là doanh thu.
- `GET /api/pos/reports/so-sach?tu&den` (`view_reports`), hàm tính ở `doiSoat.js` (chỉ đọc):
  ô 1 **Tiền thật đã vào quán** = tiền mặt / CK theo ngày (bán + nạp, tách dòng "trong đó tiền nạp") — cùng số với két;
  ô 2 **Bán được bao nhiêu** = tổng giá bán − giảm (flash / hạng / mã) − **Thưởng nạp đã dùng** (= −Σ`thuong` của dòng sổ gắn đơn KHÔNG nạp
  trong kỳ: trừ khi trả, cộng lại khi hoàn) = doanh thu thật;
  ô 3 **Quán đang giữ hộ khách** = Σ`amount` và Σ`thuong` (danh sách trắng) tới cuối ngày `den` → tiền nạp = tổng − thưởng, thưởng nạp.
- Bất biến mới ở `bat_bien.js` (Câu hỏi 1): `I20` ví: `thuong` = Σ`thuong` sổ; `0 ≤ thuong ≤ balance`. Đối soát ví (`reconcileWallet`) sửa cả ngăn.

## 7. Giao diện (chờ Câu hỏi 2 — đề xuất: màn mới)
- `client/src/pages/CaiDat/GoiNap.jsx` (mới) + một thẻ "Gói nạp" trong `Settings.jsx` (hiện theo `manage_products`): danh sách, thêm / sửa
  ("Khách trả", "Vào tài khoản", tên), bật / tắt. Gọi qua `utils/api.js` (không `fetch` trần).
- Màn Bán hàng mới (`BanHangMoi.jsx` + `tinh.js`): nút nhóm "Nạp tiền" → lưới gói; chọn gói khi chưa có khách → báo "Chọn khách trước";
  giỏ nạp chỉ một gói, có món thì báo "Nạp tiền làm đơn riêng"; thân tinh-thu / phiên gửi `goi_nap_id`; ẩn dòng trừ tài khoản và ô mã khi
  giỏ là gói nạp. Hoá đơn in dòng hàng như mọi đơn.
- `Reports.jsx`: thẻ "Sổ sách" ba ô (mục 6). Build `client/dist` (P1).
- Ước lượng ~210 dòng (Cài đặt 90 · Bán hàng 60 · Báo cáo 60).

## 8. Ca thử `cong_cu/thu_NAP1.js` (ánh xạ 1-1 Nghiệm thu) — chạy máy chủ thật trên kho tạm như các `thu_*.js`
| Nghiệm thu | Ca |
|---|---|
| A | A1 tạo gói 100.000 / 105.000 → 200; A2 `khach_tra` 0 / âm / lẻ → 400; A3 `vao_tk` < `khach_tra` → 400; A4 `vao_tk` = `khach_tra` → 200 (ngay trên ngưỡng, K3); A5 nhân viên không `manage_products` → 403; A6 sửa + tắt → quầy `GET` không thấy gói tắt; A7 bán gói tắt → 400 |
| B | B1 bán tiền mặt → số dư +105.000, `thuong` +5.000, dòng sổ `topup` amount 105.000 thuong 5.000 gắn đơn; B2 bán qua phiên QR chốt (`chotPhien` nguồn payos / tay) → như B1; B3 thân gửi `unit_price` / tổng sai → máy chủ tra giá (đối chiếu tiền 400); B4 không SĐT / SĐT `" "` → 400; B5 có món kèm → 400 `NAP_KHONG_GOP`, ví không đổi; B6 trả ví / ví mẹ / `payment_method balance` → 400; B7 phiên `tru_tai_khoan` / `cach tai_khoan` → 400, không giữ; B8 mã giảm → 400; B9 ghi nợ → 400; B10 phiên huỷ / hết hạn → ví không đổi, không đơn; B11 lỗi ghi sổ trong giao dịch (câu ghi hỏng cấy) → rollback: không đơn, ví không đổi; B12 hai quầy cùng chốt một phiên nạp → đúng một lần cộng |
| C | C1 ví 105.000 (thưởng 5.000) trả đơn 21.000 → trừ thưởng 1.000, nạp 20.000; C2 trả hết số dư → thưởng về 0 đúng; C3 ví mẹ trừ theo tỷ lệ của ví mẹ; C4 `/deduct`, `/adjust` âm theo tỷ lệ; `/adjust` dương → tiền nạp; C5 huỷ đơn C1 → thưởng +1.000, nạp +20.000 (đúng ngăn); C6 xoá đơn, duyệt hoàn → đúng ngăn; C7 đền bù một phần → chia theo tỷ lệ phần ví, tổng không vượt; C8 ví cũ (dòng sổ không cột thưởng) → toàn tiền nạp, trả đơn không trừ thưởng; C9 chuỗi nạp → trả → hoàn → ví mẹ → đền → I4 + I20 = 0 lệch sau MỖI bước; C10 hai người cùng trả trên một ví (song song) → bất biến giữ, số dư đúng; C11 đối soát ví sửa lệch `thuong` cấy tay về đúng sổ |
| D | D1 huỷ đơn nạp → 400 `NAP_KHONG_HOAN`, ví không đổi; D2 xoá đơn nạp → 400; D3 yêu cầu hoàn đơn nạp → 400; D4 đền bù đơn nạp → 400; D5 `/adjust` thiếu lý do → 400 (như cũ) |
| E | E1 đơn nạp có SĐT → 0 điểm; E2 trả trọn bằng ví 50.000 → điểm như tiền mặt; E3 ví + tiền mặt, ví mẹ + CK → điểm trên cả đơn trừ phí giao; E4 đơn trả ví hết thưởng → vẫn đủ điểm (cả hai ngăn); E5 Flash vẫn 0 điểm (không đổi) |
| F | F1 két ngày: nạp tiền mặt 100.000 + bán tiền mặt 30.000 → két 130.000 (không đếm đôi); nạp tay `/topup` vẫn vào két; F2 `/daily`, `/sales` không cộng đơn nạp vào doanh thu; F3 sổ sách ô 2: bán 21.000 trả ví (thưởng 1.000) → thưởng nạp đã dùng 1.000, doanh thu thật 20.000; huỷ đơn → về 0; F4 ô 3 giữ hộ cuối kỳ tách nạp / thưởng = số dư ví; F5 ô 1 tách dòng tiền nạp |
| K5 | K1 `/topup` cũ 200, toàn tiền nạp; K2 trả ví, ví mẹ, ví + QR không đổi tiền; K3 P22-23 điểm khi thu đủ nợ (đơn cũ); K4 P24 huỷ trừ điểm; K5 hoàn / huỷ đơn thường như cũ; K6 bán món thường không SĐT vẫn được (cổng nạp không chặn oan); K7 mua gói / thẻ không đổi |

Bài thử cũ đỏ vì E (Câu hỏi 1, đổi ĐÚNG ca khoá luật điểm cũ, mỗi bài mới đỏ trên gốc + `SỐ CA`): `thu_P20` (trả ví → /nhan-diem), `thu_P2223` (A3, F1),
`thu_P24` (A4, G1, I2 — số điểm), `thu_DIEMTHAT1` (A1, B*, C*, D*, F*), `thu_P3` (B3), `thu_KHMUA1` (K1), `thu_DOISOAT1` (qua I8). Mọi bài khác giữ xanh.

## 9. Đường song song phải canh (K4)
- Lối trừ: `orders.js` trả đơn (khách + mẹ) · `/deduct` · `/adjust` âm · chốt phiên (qua `taoDon`) — đều `ghiVi`; grep `ghiVi(` sau vá phải
  còn đúng các chỗ hiện có (wallets ×4, orders ×1, refunds ×2, damages ×1) + 1 chỗ nạp.
- Lối cộng theo đơn: `ghiHoan` (huỷ, xoá, kết thúc gói) · duyệt hoàn · đền bù — đều qua `thuongKhiHoan` trong `ghiVi`.
- Ghi tuyệt đối: `reconcileWallet` (cả ngăn thưởng).
- Nhận đơn nạp: huỷ · xoá · duyệt hoàn · yêu cầu hoàn · đền bù · báo cáo doanh thu (3 route) · két · điểm — MỘT vị từ.
- Hai bản luật điểm: `diemThat.js` và `bat_bien.js` I8 (bộ kiểm không so — đổi CẢ hai, ca F1 của thu_DIEMTHAT1 canh).

## 10. Đột biến dự kiến (`viec/NAP-1/dot_bien.py`)
`VS-TRU-THUONG-TRUOC` (trừ thưởng trước thay vì tỷ lệ) · `VS-HOAN-VE-NAP` (hoàn toàn bộ về tiền nạp) · `VS-NAP-GIA-MAY-KHACH` (tin `unit_price`) ·
`VS-KET-DEM-DOI` (két đếm cả dòng topup gắn đơn) · `VS-DIEM-KHI-NAP` (đơn nạp có điểm) · `BV-CONG-THUONG` (bỏ ghi `thuong` ở ghiVi) ·
`BV-CHAN-GOP` · `BV-CHAN-VI-NAP` (bỏ chặn trả ví trong taoDon) · `BV-CHAN-VI-PHIEN` · `BV-NAP-KHONG-HOAN` (bỏ chặn huỷ đơn nạp) ·
`BV-RECONCILE-THUONG` · `BV-DOANH-THU-NAP` (báo cáo cộng đơn nạp) · `BV-DIEM-VI` (trả lại trần total − ví). Mỗi tên một ca bắt, có đối chứng.

## 11. Ngân sách
Máy chủ ~330 dòng (014 ~25 · viKhach ~35 · wallets ~20 · goi-nap ~70 · orders ~55 · giuCho ~6 · refunds ~4 · reports ~45 · doiSoat ~45 ·
index/backup ~3 · diemThat ~3 · bat_bien ~20) — sát ~320 của phiếu (+bat_bien do Câu hỏi 1). Giao diện ~210. Thử ~500 + sửa 7 bài cũ.
Không thư viện mới. Soát bảo mật (phiếu `có`): giá gói máy chủ tra (B3), chặn vòng nạp bằng ví (B6, B7), quyền tạo gói (A5).
