# KH-SDT-1 — kế hoạch (bản 2, theo trả lời của chủ quán 01.11)

**Nói gọn cho chủ quán.** Theo bạn chốt 01.11: KHÔNG khoá dữ liệu cũ — ai tạo tài khoản bằng SĐT của mình thì giữ toàn bộ dữ liệu của số đó
(đổi số là hãn hữu, quán xử lý tay). Việc này chỉ còn **công cụ dọn dữ liệu thử**, chạy một lần trước khai trương, chỉ chủ quán mở:
**liệt kê → tải danh sách → tải sao lưu → gõ `DON DU LIEU THU` → Dọn.**

Bản 1 (mốc / khoá, mục 2–3.3 cũ) BỎ theo Q1 mới. Q2–Q5 đồng ý; Q6: làm trong phiếu này. Nghiệm thu B, C của phiếu không còn làm (chủ quán
bỏ); A (điều tra) giữ ở mục 1; D, E là phần làm. Mọi số dòng đọc trong lượt này trên `720d08d`.

## 1. Điều tra (Nghiệm thu A) — giữ nguyên bản 1, không chặn đường nào
Đường sinh dữ liệu theo SĐT không cần hồ sơ: bán quầy có SĐT (`orders.js:868`), mua thẻ / gói (`orders.js:1028`, `:1055`), nạp ví
(`wallets.js:87`), đổi điểm (`loyalty.js:80`), mã bill (`signup-codes.js:142`). Đều là cách quầy làm việc hằng ngày (KH-QUAY-2 "không tạo
khách trước") → theo Q1 mới, KHÔNG chặn. Mất hồ sơ: không có đường xoá khách (`grep "DELETE FROM pos_customers" server` → 0 trước việc
này); khôi phục sao lưu xoá cả bảng `pos_customers` (`backup.js` khôi phục, bảng không nằm trong `BANG_KHONG_KHOI_PHUC` `backup.js:120`)
→ nghi là nguồn của số 0912345678 — thuộc SAOLUU-2, ghi Phát hiện.

## 2. Công cụ dọn — tiêu chí (D)
Chủ quán chọn **ngày X** (trước hôm nay) và / hoặc **danh sách SĐT thử**. Hai phần là **hợp** (dọn cái này VÀ cái kia):
- **Phần ngày X** — "mọi giao dịch thử trước ngày X": đơn có `created_at < X` + mọi dòng gắn đơn đó; dòng điểm không gắn đơn và voucher
  phát trước X; mã đăng nhập / lần thử App trước X. KHÔNG xoá hồ sơ khách, ví, sổ ví theo ngày (hồ sơ có thể là khách thật nhập từ SX).
- **Phần SĐT** — "xoá sạch số thử": mọi đơn của số đó + hồ sơ khách, ví (= 0), sổ ví, điểm, voucher, gói, thẻ, đăng ký, mã bill đã nhận,
  mã đăng nhập App.
- **Giữ lại, chỉ liệt kê** (khoá trong máy chủ, không lời dặn):
  1. SĐT có ví ≠ 0 (tiền thật — phiếu Cấm) → không đụng dòng nào của số đó, kể cả đơn mà số đó là người trả hộ (`parent_phone`).
  2. Đơn có phiên thanh toán (`pos_phien_thanh_toan.order_id` — QR / App, có tiền ngân hàng thật) → giữ đơn (Q5a: không dọn phiên, báo
     tiền payOS; xoá đơn mà giữ phiên thì Đối soát thấy tiền về không có đơn).
  3. Đơn HÔM NAY — mã đơn = số lớn nhất trong ngày + 1 (`helpers.js:29` `taoMaDonTheoSo`) → xoá đơn hôm nay làm mã bill đã in bị dùng lại.
  4. Không bao giờ dọn: sổ đối soát két (`pos_doi_soat_ghi`), báo tiền payOS, phiên thanh toán, đơn App (`pos_don_app` — nối phiên),
     nhật ký PIN, phiếu / lô kho, sổ nợ kho, sản phẩm, cài đặt, nhân viên (Q5a).
- **Điểm âm:** phần ngày X có thể xoá dòng cộng mà để lại dòng trừ sau X → số dư âm. Máy tính trước; có số nào âm → liệt kê và **từ chối
  dọn** (409 `DIEM_AM`) cho tới khi chủ quán thêm số đó vào danh sách SĐT hoặc đổi ngày.
- Gói bị xoá mà đơn giữ lại còn trỏ tới (`customer_package_id`) → đặt NULL (cùng cách xoá đơn `orders.js:1683`).
- Mã giảm của voucher / mã bill bị xoá (`pos_discount_codes` cùng `code` — `loyalty.js:134`, `signup-codes.js:355`) xoá theo.

## 3. Thiết kế — phương án
**A (chọn): một hàm chọn dòng dùng cho cả liệt kê và dọn** (K4 BAN-HANG-1: một vị từ cho "có gì để làm" và "làm").
- `server/utils/donThu.js` (~170 dòng): `chonDong(q, tieuChi, homNay)` → id từng bảng + danh sách đơn + giữ lại + điểm âm + `ma_xac_nhan`
  (sha256 của tiêu chí + mọi id); `donDuLieuThu(tieuChi, ma, nguoi)` → MỘT giao dịch: chọn lại bằng `tx`, so `ma_xac_nhan` (khác → 409
  `DANH_SACH_DA_DOI`), điểm âm → 409, chụp nguyên mọi dòng (`SELECT *`), xoá, ghi nhật ký `pos_sync_logs` (`type='don_thu'`, `details` =
  tiêu chí + số dòng + bản chụp, `created_by`, `created_at=getNow()`), commit. Không có gì → không ghi nhật ký.
- `server/routes/don-thu.js` (~45 dòng): `POST /liet-ke`, `POST /don`; mọi route `authenticate` + `role === 'owner'` (403 `CHI_CHU_QUAN`).
  Chữ phải gõ `DON DU LIEU THU` (400 `CHU_XAC_NHAN_SAI`). Mount `/api/pos/don-thu` ở `server/index.js` (+2 dòng).
- Không bảng mới, không cột mới (nhật ký vào `pos_sync_logs` đã có trong sao lưu `backup.js`) → không bước nâng cấp.
- Giao diện: `client/src/pages/QuanLy/donThu.js` (hàm thuần: đọc ô SĐT, dựng CSV, điều kiện mở nút Dọn ~40 dòng) + `client/src/pages/DonThu.jsx`
  (~150 dòng) + route `/don-thu` ở `App.jsx` + một ô riêng trong `QuanLy.jsx` chỉ hiện với owner (KHÔNG thêm vào lưới `menu.js` — lưới
  đang bị `thu_BH2.js` F6 khoá đúng 6 ô). Nút Dọn chỉ mở khi: đã liệt kê, có dòng, không điểm âm, đã bấm Tải danh sách, đã bấm Tải sao lưu
  toàn bộ (`/backup/export-all`), gõ đúng chữ. Đổi tiêu chí → phải liệt kê + tải lại.
**B (loại): script dòng lệnh** trên Render shell — chủ quán không chạy được, không phân quyền. **C (loại): xoá từng đơn bằng `DELETE
/orders/:id`** — hoàn ví / điểm / kho SX cho dữ liệu thử (tạo giao dịch mới thay vì dọn), chậm, không chạm điểm / voucher / khách.

Ngân sách: máy chủ ~220, giao diện ~190, thử ~380 — trong ngân sách phiếu.

## 4. Ca thử `cong_cu/thu_KHSDT1.js` — ánh xạ nghiệm thu (đỏ trên `720d08d`: chưa có route / hàm)
| Ca | Nghiệm thu | Nội dung |
|---|---|---|
| D1 | D | Liệt kê theo ngày X: đúng id đơn trước X, dòng gắn đơn, điểm / voucher trước X; không chạm hồ sơ / ví; giữ đơn hôm nay |
| D2 | D | Liệt kê theo SĐT: đủ mọi bảng của số đó; đơn khác số không vào |
| D3 | D | Ví ≠ 0 → số đó và đơn trả hộ nằm ở "giữ lại", không trong danh sách xoá; đơn có phiên thanh toán → giữ lại |
| D4 | D | Liệt kê không ghi gì (băm toàn kho trước = sau) |
| D5 | D | Dọn: thiếu / sai chữ → 400; sai `ma_xac_nhan` → 409; dữ liệu đổi giữa hai bước → 409; kho không đổi |
| D6 | D | Dọn đúng → đúng số dòng đã liệt kê, nhật ký có người / lúc / tiêu chí / số dòng / bản chụp nguyên dòng |
| D7 | D | Chạy lại → liệt kê 0, dọn không ghi nhật ký mới |
| D8 | D | Ngày X = hôm nay / sau hôm nay / sai dạng → 400; không tiêu chí → 400; SĐT sai dạng → 400 |
| D9 | D | Nhân viên không phải owner → 403 cả hai route; không token → 401 |
| D10 | D | Điểm âm: dòng cộng trước X, dòng trừ sau X → liệt kê báo `diem_am`, dọn → 409, kho không đổi |
| D11 | D (giao dịch) | Ép lỗi giữa chừng (bảng nhật ký hỏng) → không xoá dòng nào |
| D12 | D | Giao diện (hàm thuần + nguồn): CSV đủ đơn / SĐT / giữ lại; nút Dọn chỉ mở đủ 6 điều kiện; có nút tải sao lưu gọi `/backup/export-all`; ô owner trong Quản lý; route `/don-thu`; chữ xác nhận cùng một chuỗi với máy chủ |
| E1 | E (K5) | Khách có hồ sơ ngoài tiêu chí: điểm, voucher, ví, sổ ví, gói, thẻ, đơn — băm từng bảng trước = sau dọn |
| E2 | E (K5) | Đơn ngoài tiêu chí: tổng tiền đơn theo ngày (Báo cáo) và các bảng con không đổi; gói đơn giữ lại trỏ tới gói bị xoá → NULL, đơn còn |
Đột biến (`dot_bien.py`): `BV-chi-chu-quan`, `VS-bo-so-ma`, `VS-don-vi-khac-0`, `VS-don-hom-nay`, `BV-giu-phien`, `BV-diem-am`,
`VS-ngoai-giao-dich`, `VS-sai-chu`, `BV-nut-sao-luu`.
CHƯA KIỂM được bằng máy: chủ quán đã thật sự LƯU file sao lưu (màn chỉ biết đã bấm tải); chạy trên Turso production (cỡ bản chụp).

## 5. Luồng hợp lệ phải KHÔNG bị chặn / KHÔNG đổi (K5)
Quầy bán, huỷ, xoá đơn như cũ (không đổi file nào của các đường đó) · khách thật ngoài tiêu chí giữ nguyên (E1) · khách SX có hồ sơ giữ
hồ sơ khi dọn theo ngày · đơn hôm nay giữ · ví ≠ 0 giữ · Đối soát / payOS giữ.

## 6. Câu hỏi — không còn (Q1–Q6 đã trả lời 01.11). Lựa chọn an toàn máy tự làm (LUAT §6.6), ghi để chủ quán biết:
đơn có phiên thanh toán và đơn hôm nay được giữ lại; điểm âm thì từ chối dọn.

## 7. Sửa theo soát độc lập vòng 1 (01.11) — luật "giữ cả cụm hoặc xoá cả cụm"
- Dọn theo ngày KHÔNG xoá dòng sổ ví nào; đơn có dòng sổ ví của SĐT không dọn → giữ (ví phải khớp sổ — đối soát I4, `reconcileWallet`).
- Đơn giữ thêm: hôm nay (giờ hiện ở danh sách giữ), còn nợ kho SX (`pos_stock_pending`), lấy từ gói còn giữ, mua gói mà đơn giữ đang dùng.
- SĐT trong danh sách có đơn bị giữ, hoặc có dòng điểm / sổ ví / gói / thẻ gắn đơn không dọn (vd trả hộ đơn số khác) → giữ CẢ SỐ
  (`giu_lai.sdt`), đơn chỉ chọn theo số đó cũng giữ. Lặp tới khi đứng yên (`chiaGiu`).
- Xoá đơn có mã → `traLuotMa` (cùng hàm xoá đơn `orders.js` dùng).
- Điểm âm: cùng vị từ còn hạn với `BALANCE_SQL` (`diemKhach.js:9`).
- Nhật ký: dòng `don_thu` chỉ số dòng + băm; bản chụp chia phần `don_thu_chup` ≤ 30.000 ký tự / ô (ô Excel của sao lưu ≤ 32.767), che
  `pin_code`, `password`, `ma_bam` (GET `/sync/logs` mọi nhân viên đọc được — `sync.js:346`). Bản đủ cột chỉ trả về cho chủ quán tải.
- Bài thử: sổ ví loại thật, đối soát `chayDoiSoat` trước–sau (E3), sao lưu export-all sau dọn (E4).
- CHƯA làm (ngoài Phạm vi → Câu hỏi): số hoá đơn tiếp theo = COUNT (`settings.js:246–258`) — xoá hoá đơn thử làm số mới trùng số đã in.
