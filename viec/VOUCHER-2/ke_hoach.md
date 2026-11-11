# VOUCHER-2 — kế hoạch (chờ chủ quán duyệt)

## 0. Tóm tắt lời thường
Voucher hôm nay chỉ có một loại (đổi điểm), mỗi đơn chỉ nhận MỘT mã, và mã giảm tính cả trên tiền thẻ hạng / gói. Kế hoạch:
một bảng **mẫu voucher** mới (Cài đặt → Voucher), **một hàm phát** sinh mã riêng gắn SĐT khách từ mẫu, đơn nhận thêm **danh sách voucher**
(tối đa N, mặc định 3) bên cạnh ô mã khuyến mãi chung, và **một hàm tính** (`tinhUuDai` mở rộng) quyết mọi khoản giảm theo đúng thứ tự
chủ quán chốt. Đơn dùng voucher nào thì voucher đó ghi số đơn — huỷ / hoàn đơn trả lại hết qua `traLuotMa` (giữ tên + tham số cho HUY-1).

**Sáu câu cần chủ quán trả lời cùng lúc duyệt** (chi tiết mục 9): Q1 voucher cũ đổi điểm thôi "ai cầm cũng dùng" · Q2 mã khách mới vẫn
đi ô mã chung · Q3 nghĩa "áp dụng nhóm / món chọn" · Q4 thứ tự nhiều voucher % · Q5 thêm 7 file vào Phạm vi (mục 10.9) · Q6 bài thử cũ đổi số vì luật F.

## 1. Code thật đã đọc (lượt này, main `53a71a2` = nhánh `9f4eab2`)
| Khẳng định | Nguồn |
|---|---|
| Đơn nhận MỘT `discount_code`; tra mã, hạn, lượt, đơn tối thiểu trên `subtotal` (gồm cả thẻ / gói / nạp) | `server/routes/orders.js:199`, `:623-680` |
| Giờ flash chặn mã % cho CẢ đơn (400, không `code`) | `orders.js:743-750` |
| Quà đổi điểm (có dòng `pos_voucher_grants` cùng mã) luôn "dùng chung với giá hạng" | `orders.js:767-773` |
| `tinhUuDai` tính mã trên `tamTinh` = Σ MỌI dòng (cả dòng thẻ / gói / nạp — lỗ của luật F) | `server/utils/uuDai.js:21-37`; dòng gửi vào ở `orders.js:775-776` |
| Hạng đã bỏ qua dòng gói / thẻ / nạp | `orders.js:717` |
| `total = subtotal − flash − hạng − mã + phí giao`; phí giao đơn giao lấy từ báo phí | `orders.js:806-813` |
| Chế độ chỉ tính (`tinh-thu`, phiên) trả `chiTiet`; mã sai chỉ là `ma_loi` mềm, POST bỏ mã | `orders.js:897-906`, `:1355-1360` |
| Tiêu mã TRONG giao dịch: đọc lại `used_count`, tăng, grant → `used` theo CHỮ mã | `orders.js:1075-1116` |
| Trả lượt khi huỷ / xoá / duyệt hoàn: một lượt theo `order.discount_code` + mọi grant `used_order_id = đơn` về `available` | `server/utils/tienDaTra.js:58-63`; gọi ở `orders.js:1602`, `:1787`, `routes/refunds.js:181`, `utils/donThu.js:296` |
| Đổi điểm: trừ điểm + đẻ mã `usage_limit 1` + grant trong MỘT giao dịch; voucher "tự do chuyển nhượng" (15.07) | `server/routes/loyalty.js:77-160`, chú thích `:6-8` |
| Danh mục quà: `discount_type/value`, `max_discount`, `valid_days`, `points_cost NOT NULL ≥ 1` | `server/database.js:405-418`, `routes/rewards.js:30-52` |
| Ví voucher (quầy `/loyalty/vouchers`, App `GET /voucher`) chọn CỘT CỤ THỂ, không có `min_order`, nguồn | `server/utils/diemKhach.js:30-62`, `routes/kh/index.js:230-237` |
| App: giỏ có `ma_giam` (chuỗi), băm giỏ gồm `ma_giam`; báo giá thử lại không mã khi mã làm hỏng giỏ | `server/utils/donApp.js:58-62`, `:98-117`, `:163-200` |
| Phiên thanh toán chép thân đơn theo danh sách trắng `TRUONG_DON` | `server/utils/giuCho.js:22-23`, `:36-37` |
| Hoá đơn tách `giam_ma = subtotal − hạng − flash + ship − total`; điểm đã đổi đọc theo `discount_code` | `server/routes/hoaDon.js:94`, `:53-56` |
| Bất biến I12 (mỗi grant phải có dòng 'redeem' = giá quà) · I13 (`used_count` = số đơn completed có `discount_code` = mã) | `cong_cu/gia_lap/bat_bien.js:286-299`, `:307-318` |
| Màn Bán hàng mới có MỘT ô mã (`ma`), gửi `discount_code`; dòng "Ưu đãi" một dòng | `client/src/pages/BanHang/BanHangMoi.jsx:64-65`, `:411`, `:420`; `tinh.js:157-161`, `:203-222` |
| Bài thử cũ ĐANG khoá mã tính trên gói / thẻ (sẽ đổi số theo luật F) | `cong_cu/thu_UUDAI1.js:436` (K4b), `cong_cu/thu_KHTHE1.js:268-271` (B12b), `cong_cu/thu_P26c.js:869` |

## 2. Thiết kế — mỗi phần phương án A / B, chọn
### 2.1 Mẫu voucher (nghiệm thu A)
- **A (chọn):** bảng MỚI `pos_mau_voucher` (ten, kieu `tien|phan_tram|ship_tien|ship_phan_tram`, gia_tri, tran, don_toi_thieu,
  ap_dung `tat_ca|nhom|mon`, ap_dung_ids JSON, han_ngay, bat, tao/sua) + cửa CRUD trong `routes/rewards.js` (`/rewards/mau…`, quyền
  `manage_promotions` như quà). ~70 dòng máy chủ.
- B: mở rộng `pos_reward_catalog` thành mẫu. Bỏ vì `points_cost NOT NULL` + kiểm ≥ 1 (`rewards.js:33`) — mẫu cho giới thiệu / sinh nhật
  không có giá điểm; đổi ràng buộc phải dựng lại bảng (bước nâng cấp chỉ THÊM). Quà đổi điểm GIỮ bảng cũ; DOI-DIEM-1 sau này nối quà → mẫu.
- Câu khách thấy: `moTaVoucher(m)` trong `server/utils/voucherCode.js` — MỘT hàm, dùng cho xem trước (cửa `POST /rewards/mau/mo-ta`,
  không ghi), danh sách mẫu, ví voucher quầy + App (`mo_ta`). Màn hình không tự dựng câu.

### 2.2 Phát từ mẫu (B)
- **A (chọn):** `phatVoucher(tx, mau, sdt, nguon, them)` trong `voucherCode.js`: sinh mã chưa trùng → 1 dòng `pos_discount_codes`
  (usage_limit 1, chụp NGUYÊN luật của mẫu vào cột mới `giam_ship`, `ap_dung`, `ap_dung_ids` — sửa mẫu sau không đổi voucher đã phát)
  + 1 dòng `pos_voucher_grants` (thêm cột `nguon`, `mau_id`). Hạn = ngày phát + `han_ngay` (dùng `addDaysToDate` sẵn có của loyalty.js,
  chuyển sang hàm chung). `/redeem` gọi `phatVoucher(tx, mauTuQua(reward), phone, 'doi_diem', { point_tx_id })` — câu INSERT y như cũ,
  hành vi đổi điểm giữ nguyên (thêm `nguon='doi_diem'`).
- B: mỗi nơi phát tự INSERT. Bỏ — đúng thứ phiếu cấm (việc sau phải làm lại).
- Không mở cửa "phát tay" ở quầy trong việc này (phiếu chỉ đòi hàm; DOI-DIEM-1 / GIOI-THIEU-1 gọi hàm).

### 2.3 Đơn nhận nhiều voucher (C, D, E, F) — đường tiền
- Thân đơn thêm `vouchers: [mã…]` (quầy, tinh-thu, phiên, App). `discount_code` giữ nghĩa **mã khuyến mãi chung**. Máy chủ TỰ PHÂN LOẠI:
  mã có dòng grant = voucher; còn lại = mã chung. Nên App / quầy cũ gửi mã voucher trong `discount_code` / `ma_giam` vẫn chạy (H tương
  thích ngược) — mã đó được xếp vào danh sách voucher.
- Kiểm từng voucher (MỘT hàm `kiemVoucher` trong `voucherCode.js`, quầy và App đi chung qua `taoDon`): có, đang bật; **grant đúng SĐT của
  đơn** (`VOUCHER_NGUOI_KHAC`); grant `available` + `used_count < 1` (`VOUCHER_DA_DUNG`); còn hạn (`VOUCHER_HET_HAN`); đủ đơn tối thiểu tính
  trên **tiền món thường** (`VOUCHER_CHUA_DU_DON`); không trùng; số voucher ≤ N (`VUOT_SO_VOUCHER`); giờ flash + voucher % (`VOUCHER_PHAN_TRAM_FLASH`);
  voucher ship mà không phí giao (`VOUCHER_SHIP_CAN_GIAO`, lời "Voucher giao hàng chỉ dùng cho đơn giao"); đơn không có món thường
  (`MA_KHONG_AP_MON_THUONG`). Đơn nạp: thêm `vouchers` vào điều kiện `NAP_CHI_TIEN_MAT_QR` sẵn có (`orders.js:232-236`).
  - Lỗi voucher: POST / chốt phiên → 400 `{ error: 'Voucher <MÃ>: …', code, ma }`, đơn không lưu (C). `tinh-thu` / báo giá App → MỀM:
    tính không có voucher hỏng + `voucher_loi: [{ ma, code, error }]` để giỏ báo từng mã (cùng khuôn `ma_loi` hiện có).
  - Mã chung giữ NGUYÊN luật cũ (mềm, POST bỏ mã — K5, `thu_P26c` D3), chỉ đổi phần F: tính trên món thường.
- **Tính — A (chọn): mở rộng `tinhUuDai`** (MỘT hàm, phiếu yêu cầu). Thêm: `dong[].khong_giam` (thẻ / gói / nạp — luật F, cho cả mã chung),
  `vouchers: [{ loai, gia_tri, tran, co_so_dong[] }]`, `phiGiao`. Thứ tự: flash (truTruoc) → hạng → mã chung (UUDAI-1 nguyên) → voucher
  TIỀN (theo thứ tự khách chọn) → voucher % trên phần CÒN LẠI → kẹp: mỗi voucher ≤ tiền các dòng nó áp dụng, tổng ≤ tiền món thường còn lại.
  Voucher ship = min(giá trị hoặc % × phí, trần, phí giao) — chỉ trừ phí giao. Voucher luôn **dùng chung** với giá hạng (như quà đổi điểm
  hôm nay, `orders.js:771`). Trả thêm `giam_voucher: [{ i, so_tien }]`, `giam_ship`. Hàm thuần — bài thử gọi thẳng với số tính tay.
  ~50 dòng.
- B: hàm tính voucher riêng ngoài tinhUuDai. Bỏ — hai hàm cùng kẹp "tổng ≤ tiền món" sẽ lệch (K4 "MỘT vị từ").
- Phí giao: cột `shipping_fee` của đơn lưu **phần khách trả** (sau voucher ship) → mọi công thức `total − shipping_fee` (tienDaTra, điểm,
  hoá đơn) giữ đúng mà không sửa; phần quán bù = cột mới `pos_orders.giam_ship`. Chuyến Ahamove giữ phí gốc (`giaoHang.ghiChuyenDon`
  không đổi). Cột mới `pos_orders.giam_voucher` (tổng voucher không ship) để hoá đơn / báo cáo tách dòng; `discount` vẫn = TỔNG giảm.

### 2.4 Tiêu / trả voucher (G)
- Tiêu TRONG giao dịch đơn, mỗi voucher hai câu có điều kiện + kiểm `changes`:
  `UPDATE pos_discount_codes SET used_count = used_count + 1 WHERE id = ? AND is_active = 1 AND used_count < usage_limit` và
  `UPDATE pos_voucher_grants SET status='used', used_order_id=?, used_at=?, so_tien_giam=? WHERE id = ? AND status='available'` —
  `changes ≠ 1` → rollback 400 `VOUCHER_DA_DUNG` (hai đơn cùng lúc → một đơn). Liên kết đơn ↔ voucher = `grant.used_order_id` (đã có) +
  cột mới `so_tien_giam` — **không đẻ bảng nối** (A). B = bảng `pos_order_vouchers`: bỏ, trùng thông tin grant đã giữ, thêm đường xoá
  song song cho donThu / xoá đơn.
- `traLuotMa(tx, order)` — giữ tên + tham số; thân thêm MỘT câu TRƯỚC câu trả grant: trả lượt các mã của grant `used_order_id = đơn`
  (trừ mã trùng `order.discount_code` — đơn cũ đã trả ở câu 1). Huỷ / xoá / duyệt hoàn / dọn đơn thử tự có (4 chỗ gọi, không sửa chỗ gọi).
- Phiên QR (G): tiêu chỉ khi chốt (đường hiện có) → hết hạn / huỷ không tiêu. Thêm ở `giuCho.taoPhien`: voucher đang nằm trong phiên
  `cho` còn hạn KHÁC của cùng SĐT → 409 `VOUCHER_DANG_GIU` (~8 dòng) — tránh khách trả tiền hai phiên rồi phiên sau hỏng (tiền vào ví).
  Phương án bỏ: không giữ — đúng nghiệm thu nhưng để khách mất công.

### 2.5 App KH (H) — `HOP_DONG_API_KH.md` PHIEN_BAN 13 → 14
- `GET /voucher`: mỗi dòng `data[]` thêm `mo_ta`, `nguon` (sửa `diemKhach.layVoucherKhach` — xem Q5).
- `POST /gio/bao-gia`, `POST /don`: thêm `vouchers?: string[]` (≤ N, chuỗi ≤ 32); `giam[]` thêm `loai` `voucher` / `voucher_ship` kèm `ma`;
  báo giá thêm `voucher_loi[]`, `phi_giao` vẫn là phí khách trả. `ma_giam` giữ. Băm giỏ (`bamGio`) chỉ thêm `vouchers` KHI CÓ — khoá gửi
  của App cũ không lệch. Lý do ngắn (`LY_DO_NGAN`) thêm mẫu `VOUCHER_`. `cong_cu/thu_HOPDONG_KH.js` khớp.
- App hôm nay chỉ `cach_nhan: 'tai_quan'` (`donApp.js:99`) → voucher ship trên App luôn báo `VOUCHER_SHIP_CAN_GIAO` tới khi App có giao.

### 2.6 Quầy (I) + Cài đặt
- `BanHangMoi.jsx` (+~60): chọn khách → tải ví voucher (`/loyalty/vouchers/:phone`, có `mo_ta`) → chip chọn / bỏ (mờ khi đủ N), ô mã chung
  giữ; giỏ hiện từng dòng "Voucher <MÃ> −x" + "Giảm phí giao" từ `tinh-thu`; lỗi từng mã đỏ cạnh chip (BAO-1a). `tinh.js` (+~15):
  `khoaTinh` / `thanTinhThu` / `thanPhien` mang `vouchers`. Hoá đơn / tem (`hoaDon.js` + `InvoicePrint/Preview`): dòng từng voucher đọc từ
  grant của đơn (+ "điểm đã đổi" tính theo grant, K4 với `hoaDon.js:53`).
- `client/src/pages/CaiDat/MauVoucher.jsx` MỚI (~150): danh sách mẫu, form (kiểu, giá trị, trần, đơn tối thiểu, áp dụng, hạn, bật), câu xem
  trước từ máy chủ, ô "Tối đa N voucher / đơn" (`voucher_toi_da`, settings.js kiểm số nguyên 1–10), báo lưu BAO-1a. `Settings.jsx` chỉ
  thêm thẻ + import (~4 dòng — BAO-1b song song).
- Báo cáo mã (`reports.js:318-328`) thêm nhóm theo voucher (grant đơn completed). Đối soát: bất biến I13 đếm cả đơn qua grant, I12 chỉ
  đòi dòng 'redeem' với grant `nguon='doi_diem'` (Q5 — file ngoài Phạm vi); `doiSoat.js` KHOA cập nhật nếu đổi chữ.

### 2.7 Nâng cấp dữ liệu `server/nang_cap/026_voucher.js` (chỉ THÊM)
`pos_mau_voucher` (bảng mới) · `pos_voucher_grants` + `nguon TEXT DEFAULT 'doi_diem'`, `mau_id`, `so_tien_giam` · `pos_discount_codes`
+ `giam_ship INTEGER DEFAULT 0`, `ap_dung TEXT DEFAULT 'tat_ca'`, `ap_dung_ids TEXT` · `pos_orders` + `giam_voucher`, `giam_ship`
(DEFAULT 0) · `INSERT OR IGNORE pos_settings ('voucher_toi_da','3')`. Mọi cột qua `themCot` (tự sao lưu). `backup.js` BACKUP_TABLES thêm
`pos_mau_voucher`. Đơn / grant cũ: giá trị mặc định = hành vi cũ.

## 3. Ngân sách
| Phần | Ước | Ngân sách phiếu |
|---|---|---|
| Máy chủ (uuDai 50, orders 90, voucherCode 90, rewards 70, giuCho 10, donApp 25, kh 5, tienDaTra 4, loyalty −15, hoaDon 15, reports 15, settings 6, 026 30, backup 1, donThu 3, diemKhach 5) | ~400 | ~400 |
| Giao diện (MauVoucher 150, BanHangMoi 60, tinh.js 15, hoá đơn 20, Settings 4) | ~250 | ~250 |
| Thử (`thu_VOUCHER2.js`) + sửa 3 bài cũ (Q6) | ~600 + ~15 | ~600 |
Vượt 1,5 lần → dừng, giải thích.

## 4. Ca thử — ánh xạ 1-1 với `## Nghiệm thu` (`cong_cu/thu_VOUCHER2.js`, kho thử thật + gọi `taoDon` / HTTP)
| Nghiệm thu | Ca (đỏ trên gốc — chưa có cửa / cột / trường) |
|---|---|
| A | A1 tạo / sửa / tắt mẫu (manage_promotions 200; nhân viên 403); A2 `moTaVoucher` 4 kiểu → đúng câu ("Giảm 20.000đ cho đơn từ 50.000đ · HSD 30 ngày", "%… tối đa…", ship); A3 thiếu giá trị / % > 100 / trần âm → 400 có `code` |
| B | B1 `phatVoucher` → 1 mã + 1 grant đúng SĐT, `nguon`, hạn = hôm nay + n ngày (ca giáp tháng 31.01 + 30); B2 đổi điểm vẫn trừ điểm + đẻ mã y cũ, `nguon='doi_diem'`; B3 sửa mẫu sau khi phát → voucher đã phát không đổi |
| C | C1 2 voucher tiền + 1 voucher % → tổng đúng thứ tự (số tính tay, có phân số lẻ); C2 voucher thứ N+1 → 400 `VUOT_SO_VOUCHER`, ca N đúng → 200 (ngay trên / ngay dưới; N đổi trong Cài đặt); C3 mã chung + voucher cùng đơn; C4 voucher của khách B trên đơn khách A → 400 `VOUCHER_NGUOI_KHAC`; C5 hết hạn / đã dùng / chưa đủ tối thiểu (ngay dưới / bằng) → 400 từng `code`, không đơn nào lưu, `used_count` không đổi; C6 tổng giảm > tiền món → kẹp = tiền món, total = phí giao; C7 tinh-thu trả `voucher_loi` mềm |
| D | D1 giờ flash + voucher % → 400 `VOUCHER_PHAN_TRAM_FLASH`; D2 giờ flash + voucher tiền → 200 |
| E | E1 voucher ship tiền / % có trần chỉ trừ phí giao (đơn giao giả báo phí), không quá phí; `giam_ship` ghi đơn; E2 đơn tại quán → 400 câu "Voucher giao hàng chỉ dùng cho đơn giao"; E3 voucher ship tính vào N |
| F | F1 thẻ hạng + món + mã chung % → mã chỉ trên món; F2 gói + món; F3 chỉ thẻ + voucher → 400 `MA_KHONG_AP_MON_THUONG`; F4 nạp + voucher → 400 `NAP_CHI_TIEN_MAT_QR`; F5 cùng các ca qua phiên thanh toán và App báo giá + đặt đơn |
| G | G1 huỷ đơn 3 voucher + mã chung → mọi grant `available`, `used_count` về 0, mã chung −1; G2 xoá đơn, duyệt hoàn → như G1; G3 phiên QR hết hạn / huỷ → voucher vẫn `available`; G4 hai đơn song song cùng voucher → đúng một 200, một 400, ví hoàn nguyên; G5 tạo phiên thứ hai giữ cùng voucher → 409 `VOUCHER_DANG_GIU` |
| H | H1 `GET /voucher` có `mo_ta`, `nguon`; H2 báo giá + đặt đơn với `vouchers[]`; H3 App cũ gửi `ma_giam` = mã voucher → vẫn áp; H4 khách A gửi voucher khách B → `VOUCHER_NGUOI_KHAC`; `thu_HOPDONG_KH.js` khớp PHIEN_BAN 14 |
| I | I1 đơn lưu đủ mã đã dùng (grant `used_order_id`, `so_tien_giam`, `giam_voucher`); I2 hoá đơn trả từng dòng voucher; I3 báo cáo mã gồm voucher; I4 giao diện: thao tác tay (mục 7) |
| K5 | K1 đơn không voucher, không mã: tổng y hệt trước (bộ số của `thu_UUDAI1` chạy lại xanh); K2 hạng, flash, combo / topping không đổi; K3 mã chung một mình trên đơn chỉ món: y hệt; K4 nạp vẫn chỉ tiền mặt / CK; K5 đơn lấy từ gói + voucher (dòng gói 0đ) không bị chặn oan |
Ca hai người cùng bấm: G4 (đơn) + G5 (phiên) + đổi điểm đôi đã có trong bài cũ.

## 5. Đột biến (`viec/VOUCHER-2/dot_bien.py`) — mỗi chỗ vá ít nhất một VS- và một BV-
Dự kiến: `BV-V2-KIEM-CHU` (bỏ kiểm SĐT) · `VS-V2-PHAN-TRAM-TRUOC` (voucher % trước voucher tiền) · `VS-V2-N-LON-HON-BANG` (`>` thành `>=`) ·
`BV-V2-KHONG-GIAM-THE` (bỏ cờ `khong_giam`) · `VS-V2-SHIP-KHONG-KEP` (bỏ kẹp ≤ phí giao) · `BV-V2-TIEU-KHONG-DIEU-KIEN` (bỏ `AND status='available'`) ·
`BV-V2-TRA-VOUCHER` (bỏ câu mới trong traLuotMa) · `VS-V2-TRA-HAI-LAN` (bỏ loại trừ `discount_code`) · `BV-V2-FLASH-PHAN-TRAM` · `BV-V2-GIU-PHIEN` ·
`VS-V2-HAN-TU-MAU` (hạn tính từ ngày tạo mẫu) · `BV-V2-NAP-VOUCHER`. Tên chốt khi viết, ghi bảng "chỗ vá → đột biến" vào trang_thai.md.

## 6. Đường song song phải canh (K4)
- Bốn chỗ gọi `traLuotMa` (huỷ, xoá, duyệt hoàn, dọn đơn thử) — vá trong thân, mỗi chỗ một ca (G1, G2, ca dọn đơn thử).
- `donThu.js:293` chụp `pos_discount_codes` theo `discount_code` → thêm mã của grant đơn (bản chụp đủ).
- Mọi nơi đọc "mã của đơn" theo `discount_code`: `hoaDon.js:53`, `reports.js:318`, bất biến I13, `doiSoat.js` I13 KHOA, `tienDaTra.tienDaTraTheoDong`
  (chanTren: giảm = discount − flash − hạng nay gồm voucher → đền ÍT hơn, chiều an toàn — ghi Phát hiện).
- Bốn đường vào `taoDon`: POST quầy, tinh-thu (`TRUONG_TINH_THU`), phiên (`TRUONG_DON`), App (`thanDon`) — mỗi đường một ca F5 / H2.
- `orders.js:772` (quà = dùng chung) — voucher nay không còn đi qua đây; mã chung trùng chữ grant đã được tách thành voucher trước.
- Điểm: `tienHangDiem(orderItems, total − shipping_fee)` đọc total đã trừ voucher → điểm trên phần trả thật (quyết định 08.11) — ca I1 kiểm điểm.

## 7. Thao tác tay cho chủ quán (điện thoại)
1. Cài đặt → Voucher: thêm mẫu "Giảm 20.000đ, đơn từ 50.000đ, 30 ngày" → thấy câu xem trước và báo "Đã lưu mẫu …".
2. Bán hàng: chọn khách có 2 voucher → bấm chọn cả hai + gõ mã chung → giỏ hiện từng dòng giảm; bấm In → bill có đủ dòng.
3. Lịch sử đơn: huỷ đơn đó → mở lại khách, hai voucher hiện lại "còn dùng được".

## 8. Rủi ro
- Đường tiền lớn nhất của việc: `taoDon` + `tinhUuDai`. Giảm rủi ro: hàm thuần có bài thử số tính tay; mọi bài cũ `thu_UUDAI1`, `thu_P26c`,
  `thu_KHTHE1`, `thu_GIAO1`, giả lập quầy chạy lại.
- HUY-1 song song: chỉ đổi THÂN `traLuotMa`; không đụng `orders.js` vùng huỷ (`:1539-1720`, `:1740-…`).
- `themCot` trên `pos_orders` chép sao lưu cả bảng một lần lúc khởi động (khuôn sẵn có, 013 / 024 đã làm).

## 9. Câu hỏi cho chủ quán (trả lời cùng lúc duyệt — mình ghi đề xuất, bạn chỉ cần "đồng ý" hoặc sửa)
- **Q1 — Voucher gắn tài khoản.** Ngày 15.07 bạn chốt voucher đổi điểm "ai cầm mã cũng dùng được" (`loyalty.js:6-8`). Phiếu này đòi "voucher
  của người khác → báo rõ". **Đề xuất:** từ VOUCHER-2 mọi voucher (cả voucher đổi điểm đã phát trước) chỉ dùng trên đơn của đúng chủ tài khoản.
- **Q2 — Mã khách mới (mã in bill / ưu đãi khách mới)** không có dòng ví voucher, là mã một người. **Đề xuất:** giữ như hôm nay — đi ô
  "mã khuyến mãi chung", không tính vào N.
- **Q3 — "Áp dụng nhóm món / món chọn".** **Đề xuất:** voucher giảm trên TỔNG tiền các món thuộc nhóm / danh sách trong giỏ (vd 10% các món
  trà); đơn tối thiểu tính trên tiền món thường cả đơn. (Khác mã "giảm 1 món" cũ — mã đó vẫn giữ cho mã chung.)
- **Q4 — Nhiều voucher % cùng đơn.** **Đề xuất:** tính lần lượt theo thứ tự khách chọn, mỗi cái trên phần còn lại (10% rồi 10% = 19%), có
  trần riêng từng cái.
- **Q5 — Thêm vào Phạm vi 6 file** (không có thì không làm đủ nghiệm thu):
  `server/utils/diemKhach.js` (ví voucher trả `mo_ta`, `nguon`, điều kiện — H, I) · `cong_cu/gia_lap/bat_bien.js` (I12 cho voucher không
  từ đổi điểm, I13 đếm đơn dùng voucher — không sửa thì giả lập / Đối soát báo lệch oan) · `cong_cu/thu_UUDAI1.js`, `cong_cu/thu_KHTHE1.js`,
  `cong_cu/thu_P26c.js` (Q6) · `cong_cu/thu_DOISOAT1.js` (nếu chữ bất biến đổi).
- **Q6 — Bài thử cũ đổi số vì luật F (10.11, đã duyệt):** `thu_UUDAI1` K4b (mua gói + món, mã 10% — nay chỉ giảm phần món),
  `thu_KHTHE1` B12b (chỉ thẻ + mã 10% → nay không giảm, báo `MA_KHONG_AP_MON_THUONG`), `thu_P26c` dòng 869 (mua 2 gói + mã 10%). Theo
  LUAT_XAY_APP §6.8 đây là bài SỬA thường (đỏ trên gốc, xanh trên mới, ghi `SỐ CA`) — chỉ cần Q5 cho phép sửa file.

## 10. Sửa sau soát kế hoạch (agent đọc độc lập, 11.11) — mục này THẮNG chỗ trái ý ở trên
Đã kiểm lại từng điểm trên code trong lượt này.
1. **NẶNG — `traLuotMa` thoát sớm** khi đơn không có mã chung (`server/utils/tienDaTra.js:59` `if (!order.discount_code) return;`) → đơn CHỈ
   dùng voucher sẽ không được trả voucher. Sửa: bỏ câu thoát sớm, chỉ câu trả lượt mã chung còn điều kiện `discount_code`; tên + tham số
   giữ nguyên. Thêm ca **G1b** (chỉ voucher, không mã chung) qua cả 4 chỗ gọi: huỷ `orders.js:1602`, xoá `:1787`, duyệt hoàn
   `refunds.js:181`, dọn đơn thử `donThu.js:296` (ca **G6**). Đột biến `BV-V2-THOAT-SOM` (đưa lại câu thoát sớm).
2. **NẶNG — `shipping_fee` = phí khách trả có 3 chỗ đọc chưa nhắc:**
   - `giaoHang.js:496` `phi_khach` + `chenh = phi_that − phi_khach` của chuyến (`giaoHang.js:298,317,397`): `orders.js` truyền vào
     `ghiChuyenDon` báo phí với `phi` = phí KHÁCH TRẢ (sau voucher ship) → `chenh` tự gồm phần quán bù cho voucher ship (đúng quyết định
     08–09.11 "Đối soát ghi phần quán bù"), không sửa `giaoHang.js`. Ca **E4**: đối soát giao hàng ra `quan_bu` = giảm ship khi phí thật = phí báo.
   - `donApp.js:345` `cach_nhan` theo `shipping_fee > 0` → voucher ship trừ hết phí thành `tai_quan`. Sửa (trong Phạm vi):
     `shipping_fee > 0 || giam_ship > 0` → `giao`. Ca **E5**.
   - `reports.js:40,310,336` tổng phí ship = phần khách trả; báo cáo mã thêm dòng "Giảm phí giao (quán bù)" = Σ `giam_ship`. Ca **I3b**.
3. **Đường vào `taoDon` thứ 5 — màn khách** `server/utils/manKhach.js:127-139` hiện một dòng "Mã X" từ `discount_amount`. Sửa: thêm dòng
   từng voucher + "Giảm phí giao" từ `chiTiet`. File ngoài Phạm vi → **Q5 thêm `server/utils/manKhach.js`**. Ca **F5b** (màn khách).
4. **`/discount-codes/validate`** (`discount-codes.js:64`) — chỉ màn Bán hàng CŨ dùng để xem trước, không ghi tiền; màn cũ bỏ ở
   BO-MAN-CU-1. Không sửa; ghi Phát hiện. (Máy chủ vẫn tự tính lại ở `taoDon`.)
5. **Đơn tối thiểu của mã chung** (`orders.js:658` so `subtotal`) — ĐỔI sang tiền món thường (luật F, cùng biểu thức với voucher — MỘT vị
   từ). Ca **F6**: mã chung min 50.000, giỏ thẻ 100.000 + món 30.000 → không áp.
6. **Voucher ship khi `shipping_fee` gõ tay ở quầy** (không qua giao, `orders.js:810`): voucher ship CHỈ cho đơn giao có báo phí (quyết
   định 08–09.11 "đơn tự đến lấy không dùng") → `VOUCHER_SHIP_CAN_GIAO`. Ca **E2b**.
7. **Ca có thể xanh oan — siết:** G3 đòi phiên tạo với voucher có `tong` ĐÃ trừ voucher (chứng minh voucher được xét) rồi mới kiểm
   `available`; D2 đòi đúng số giảm; H3 đòi grant `used_order_id` + `so_tien_giam`; B2 đòi `nguon='doi_diem'`. Thêm ca **I4** chạy bất
   biến I12 / I13 + `doiSoat` sau kịch bản dùng / huỷ voucher → không dòng lệch.
8. **Rút gọn (theo gợi ý soát):** BỎ 409 `VOUCHER_DANG_GIU` ở `giuCho` (không nghiệm thu nào đòi; cổng trong giao dịch đã đủ cho G) —
   ca G5 bỏ, đột biến `BV-V2-GIU-PHIEN` bỏ; BỎ cột `pos_orders.giam_voucher` (lấy Σ `so_tien_giam` của grant). Dùng lại
   `helpers.addDaysToDateString` (`helpers.js:125`), không chuyển hàm của loyalty.js. GIỮ cửa `/rewards/mau/mo-ta` (xem trước câu khi ĐANG gõ,
   trước khi lưu — nghiệm thu A) và GIỮ chụp luật vào mã (B3: sửa mẫu không đổi voucher đã phát).
9. **Q5 sau soát:** 7 file — `server/utils/diemKhach.js`, `server/utils/manKhach.js`, `cong_cu/gia_lap/bat_bien.js`, `cong_cu/thu_UUDAI1.js`,
   `cong_cu/thu_KHTHE1.js`, `cong_cu/thu_P26c.js`, `cong_cu/thu_DOISOAT1.js` (nếu chữ bất biến đổi).
