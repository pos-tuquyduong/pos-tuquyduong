# KH-SDT-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (31.10.2026)
- Nhánh: `viec/KH-SDT-1`; cây sạch.
- HEAD `87aa996` · FETCH_HEAD `87aa996` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  87aa996 PHIEU: KH-SDT-1
  18ee394 TIEN-DO: KHO-2b, BH-CKTAY-1, KH-QUAY-2, KH-MUA-1 xong; mo SEPAY-1, MANKHACH-1, KHO-IN-1, KH-SDT-1, them KHO-2c; quyet dinh 31.10 (SePay, man khach, SDT moi tu 0, khoi phuc khi dong cua, sua phieu nhan) — so v51
  596c346 Merge pull request #60 from pos-tuquyduong/viec/KH-MUA-1
  ```

## Bước 2–3 — đọc + kế hoạch
- Đã đọc phiếu, QUYET_DINH_CHU_QUAN.md (mục 31.10), code: xem `ke_hoach.md` (mọi khẳng định kèm file:dòng).
- Phiếu dặn **Chờ duyệt kế hoạch** → commit + push `ke_hoach.md`, DỪNG ở bước 3. Câu hỏi cho chủ quán ở `ke_hoach.md` mục 6 (chép lại dưới).

## Câu hỏi
Xem `ke_hoach.md` mục 6 — Q1…Q6, mỗi câu có đề xuất của máy để chủ quán chỉ cần xác nhận.

## Phát hiện
- `server/routes/sync.js:289` (nhập khách từ SX) và `server/routes/customers-v2.js:58` (`cacheCustomersToLocal`) tạo hồ sơ với
  `created_at` = `CURRENT_TIMESTAMP` (giờ UTC, dạng có dấu cách) hoặc không ghi — trái luật giờ VN (LUAT §2). Không sửa trong việc này
  (sync.js ngoài Phạm vi); kế hoạch KHÔNG dùng `pos_customers.created_at` làm ranh giới vì lẽ đó.

## Soát kế hoạch (agent phụ, chỉ đọc)
Bắt và đã sửa vào `ke_hoach.md`: `customers.js:225/234` lọc theo `customer_id` (bỏ sửa); `customers-v2.js:327/367` tạo hồ sơ cho SĐT bất kỳ
(chuyển sang gắn mốc); huỷ / hoàn đơn cũ trả lượt voucher (`tienDaTra.js:62`) → khoá cả mã đã dùng bằng `is_active=0`; `huyDon`
(`donApp.js:292`) chưa lọc mốc; thêm ca T3 (đủ 4 đường quầy), T7/T7b, T10 (file), T15 (hoàn, báo cáo), T18 (cùng giao dịch).
DỪNG ở bước 3 — chờ chủ quán duyệt kế hoạch + trả lời Q1–Q6.

## Làm tiếp 01.11.2026 — chủ quán đổi Q1
- Bước 1: nhánh `viec/KH-SDT-1`, cây sạch. HEAD `720d08d` · FETCH_HEAD `720d08d` — bằng nhau, không kéo (hook mở phiên đã kéo 87aa996 → 720d08d).
  ```
  720d08d KH-SDT-1: ke hoach sua theo soat (them duong song song + ca thu)
  3d4e22c KH-SDT-1: ke hoach + trang thai (cho chu quan duyet)
  87aa996 PHIEU: KH-SDT-1
  ```
- Chủ quán 01.11: Q1 đổi — KHÔNG khoá dữ liệu cũ; bỏ mốc / khoá; chỉ làm công cụ dọn (liệt kê → tải danh sách → tải sao lưu → gõ
  `DON DU LIEU THU`). Q2–Q5 đồng ý, Q6 làm trong phiếu này. → Nghiệm thu B, C của phiếu KHÔNG làm (chủ quán bỏ); A giữ (điều tra,
  `ke_hoach.md` mục 1); D, E làm. `ke_hoach.md` viết lại bản 2.
- Lựa chọn an toàn máy tự làm (LUAT §6.6, ghi ở `ke_hoach.md` mục 2): giữ đơn có phiên thanh toán, giữ đơn hôm nay, từ chối dọn khi có
  SĐT sẽ điểm âm, dọn theo ngày không xoá hồ sơ / ví / sổ ví.

## Chỗ vá → đột biến (cổng A17, A18)
| Chỗ vá | Đột biến |
|---|---|
| `server/routes/don-thu.js` chỉ owner | BV-chi-chu-quan |
| `server/utils/donThu.js` docTieuChi (ngày < hôm nay) | BV-ngay-truoc-hom-nay |
| chonDong: đơn theo ngày (so nhỏ hơn) | VS-ngay-ca-ngay-x |
| chonDong: theo ngày không xoá hồ sơ | VS-xoa-ngay-ho-so |
| chonDong: mã giảm theo voucher / mã bill | BV-ma-giam |
| chonDong: giữ ví ≠ 0 (đơn) | VS-don-vi-khac-0 |
| chonDong: giữ ví ≠ 0 (dòng theo ngày) | VS-ngay-dung-vi |
| chonDong: giữ đơn có phiên | BV-giu-phien |
| donDuLieuThu: chặn điểm âm | BV-diem-am |
| donDuLieuThu: chữ xác nhận đúng nguyên chữ | VS-sai-chu |
| donDuLieuThu: so ma_xac_nhan | VS-bo-so-ma |
| băm gồm mọi id | VS-bam-thieu-id |
| xoá + nhật ký cùng giao dịch | VS-ngoai-giao-dich |
| bản chụp nguyên dòng | VS-ban-chup-thieu |
| `server/index.js` mount | BV-mount |
| chiaGiu: giữ đơn hôm nay (vòng sửa 1) | BV-giu-hom-nay |
| chiaGiu: giữ đơn nợ kho SX | BV-giu-kho |
| chiaGiu: giữ đơn có sổ ví của số không dọn | BV-giu-so-vi |
| chiaGiu: giữ đơn lấy từ gói còn giữ | BV-giu-goi |
| chiaGiu: giữ đơn mua gói mà đơn giữ đang dùng | BV-giu-mua-goi |
| chiaGiu: số có đơn giữ → giữ cả số | BV-giu-ca-so |
| chiaGiu: đơn chỉ chọn theo số bị giữ → giữ | BV-giu-don-theo-so |
| chiaGiu: số có dòng gắn đơn không dọn → giữ cả số | BV-giu-so-gan-don-khac |
| điểm âm theo vị từ còn hạn | VS-diem-am-het-han |
| trả lượt mã (traLuotMa) | BV-tra-luot-ma |
| bản chụp chia phần ≤ trần ô Excel | VS-chup-mot-o |
| che cột bí mật trong nhật ký | BV-che-bi-mat |
| `client/src/pages/QuanLy/donThu.js` moNutDon (đã tải sao lưu) | BV-nut-sao-luu |
| dungCsv phần giữ lại | VS-csv-thieu-giu-lai |
| `DonThu.jsx` đổi tiêu chí bỏ dấu đã tải | VS-man-khong-bo-dau |
| `QuanLy.jsx` ô chỉ owner | BV-o-quan-ly |
| `App.jsx` route | BV-route-app |
Kết quả vòng đầu: TỔNG 23 · BẮT 23. Sau vòng sửa 1: ĐỐI CHỨNG XANH (81 đạt) · TỔNG 32 · BẮT 32 (một neo cũ HỎNG → sửa neo, chạy riêng BẮT)
(vòng đầu: VS-man-khong-bo-dau SỐNG → siết ca D12; VS-ngoai-giao-dich LẠC vì đột biến viết sai lỗi → viết lại đúng lỗi "commit trước ghi nhật ký").

## Phát hiện (thêm)
- `pos_don_app` (bước 006) KHÔNG có trong `BACKUP_TABLES` (`server/routes/backup.js:41–114`) — thuộc SAOLUU-2. Công cụ dọn không đụng bảng này.
- Đổi Q1 nghĩa là dòng 31.10 "SĐT đăng ký mới BẮT ĐẦU TỪ 0" ở `QUYET_DINH_CHU_QUAN.md:68` đã cũ — chat ghi sổ cập nhật (máy không sửa).

## Soát độc lập vòng 1 (agent phụ, chỉ đọc) — báo cáo nguyên văn
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. server/utils/donThu.js:22-23, 89 (dọn theo ngày) — K4 + K3 — TIỀN: dọn theo ngày xoá dòng sổ ví gắn đơn (loại 'purchase' / 'refund',
   orders.js:896) của khách ví = 0 nhưng giữ dòng nạp và pos_wallets → sổ +100.000 mà số dư 0; Đối soát đỏ I4 (bat_bien.js:61-68), I18
   (bat_bien.js:332-341); bấm `reconcileWallet` (wallets.js:281-299) thì ví được cộng khống. Bài thử che lỗi: dùng loại sổ ví bịa
   'payment' (thu_KHSDT1.js:106, :126), không nằm trong LOAI_TINH_VAO_VI (wallets.js:274); ví R nạp 0đ.
2. server/utils/donThu.js:165-167 — K4 — SAO LƯU HỎNG VĨNH VIỄN: bản chụp ghi vào MỘT ô pos_sync_logs.details; bảng này nằm trong
   /backup/export-all (backup.js:100); SheetJS 0.20.3 ném lỗi khi ô > 32767 ký tự (xlsx.js:16062) → sau lần dọn thật mọi lần "Tải sao lưu
   toàn bộ" trả 500. Bài thử không gọi export-all sau dọn.
3. server/utils/donThu.js:73-75, 83, 95-99 (dọn theo SĐT) — K4: xoá hồ sơ + ví nhưng GIỮ đơn hôm nay, đơn có phiên, đơn số đó trả hộ, và
   dòng điểm / sổ ví gắn các đơn đó → tạo lại đúng ca mồ côi theo SĐT; sổ ví mồ côi → I4 đỏ. Bài thử khoá hành vi này thành "đúng"
   (thu_KHSDT1.js:134-135). Đơn hôm nay không hiện trong giu_lai; chú thích donThu.js:10 sai với code (K1).
4. donThu.js:22-23 so với orders.js:1637-1718 — K4: (a) không trả lượt mã (traLuotMa, orders.js:1674); (b) không hoàn delivered_qty của gói
   còn giữ khi đơn lấy-từ-gói bị xoá (orders.js:1691-1708); (c) xoá cả mã bill ĐÃ dùng (orders.js:1716 giữ làm vết); (d)
   pos_voucher_grants.used_order_id và pos_stock_pending.order_id (database.js:433, :819) trỏ tới đơn đã xoá. Hai danh sách bảng chép tay.
5. donThu.js:22 (pos_invoice_logs) với settings.js:246-258 — K4 — SỐ HOÁ ĐƠN TRÙNG: số kế tiếp = COUNT(*) trong năm + 1; xoá hoá đơn thử làm
   số mới trùng số đã in trên đơn giữ. Bảng có cột is_deleted (settings.js:463). Route xoá đơn có cùng lỗ từ trước.
6. donThu.js:165-167 với sync.js:346-356 — bảo mật: GET /api/pos/sync/logs chỉ cần authenticate → mọi nhân viên đọc được bản chụp
   pos_customers: pin_code (bcrypt PIN 4 số), password, SĐT, ví.
7. donThu.js:109-112 — K4: điểm âm cộng SUM mọi dòng, không lọc hạn như BALANCE_SQL (diemKhach.js:9-13) → cho qua / chặn oan.
8. cong_cu/thu_KHSDT1.js — K3: không ca nào chạy chayDoiSoat / BAT_BIEN trước–sau; E1 trên dữ liệu bịa không bắt được lỗi 1, 3, 4.
NGHI NGỜ: dọn theo ngày xoá điểm / voucher / gói / thẻ của khách THẬT có hồ sơ trước X (bài gắn nhãn xoá điểm R) — vế đầu nghiệm thu E
không có ngoại lệ, cần chủ quán xác nhận · gói mua trước X còn dùng sau X · Turso production giao dịch dài · màn chỉ có SỐ DÒNG, không có
tổng điểm / giá trị voucher · trang_thai.md chưa ghi npm test / --day-du / cong.js / báo cáo 7 mục.
NGHIỆM THU: 2/3 mục có bằng chứng · mục thiếu: E (A ✓ ke_hoach.md:10-15, orders.js:1683 lệch 2 dòng; D ✓ có điều kiện)
Đường tiền: không trường tiền nào lấy từ client. P1: dist khớp src.
Đơn giản hoá: gom phần bù của xoá đơn thành hàm chung; nhật ký chỉ số dòng + băm, tải về là chính; dọn theo SĐT hoặc xoá MỌI thứ hoặc
không xoá hồ sơ khi còn đơn giữ. Quy tắc đối soát: không có — nên chạy đối soát toàn sổ sau dọn.
CHƯA SOÁT ĐƯỢC: chưa chạy dot_bien.py đầy đủ, cong.js chay, bản gốc 720d08d, Turso, màn Lịch sử đồng bộ phía client.
BÀI HỌC: KHOÁ — bài thử công cụ xoá / sửa hàng loạt chạy đối soát trước–sau, dữ liệu mẫu dùng loại dòng ví thật · KHOÁ — phép dò mọi bảng
có order_id / *phone (PRAGMA), mỗi bảng phải ở danh sách dọn hoặc "không dọn" có tên · KHOÁ — ca export-all sau nhật ký lớn / không ô nào
> 32767 · NGUYÊN TẮC K4 — công cụ cùng việc với route có sẵn GỌI chung phần bù · NGUYÊN TẮC K4/K5 — "xoá sạch theo khoá X" mà giữ một phần
là tạo lại mồ côi · NGUYÊN TẮC bảo mật — bản chụp dữ liệu khách chỉ ở chỗ cùng quyền với nơi tạo.

## Vòng sửa 1 — xử lý từng lỗi
| Lỗi | Xử lý | Bằng chứng |
|---|---|---|
| 1 sổ ví | theo ngày không xoá sổ ví; đơn có sổ ví của số không dọn → giữ | D1 "KHÔNG xoá dòng sổ ví", D3 đơn R, E3 đối soát; BV-giu-so-vi |
| 2 sao lưu | bản chụp chia phần ≤ 30.000 ký tự / ô | D6 "chia phần", E4 export-all 200; VS-chup-mot-o |
| 3 xoá nửa chừng | giữ cả cụm: số có đơn giữ / dòng gắn đơn không dọn → giữ cả số; đơn hôm nay hiện ở giữ lại; chú thích sửa | D2, D5 "số trả hộ"; BV-giu-ca-so, BV-giu-so-gan-don-khac, BV-giu-don-theo-so, BV-giu-hom-nay |
| 4a lượt mã | gọi `traLuotMa` (cùng hàm xoá đơn) | E2; BV-tra-luot-ma |
| 4b gói | KHÔNG hoàn delivered_qty — giữ luôn đơn lấy từ gói còn giữ và đơn mua gói đang được dùng (không đổi tiền) | D3; BV-giu-goi, BV-giu-mua-goi |
| 4c mã bill đã dùng | giữ cách dọn: dữ liệu thử dọn cả mã bill đã nhận (số thử nhận lại được ưu đãi khi dùng thật); mã giảm đi kèm cũng dọn | D1, D2 |
| 4d used_order_id / nợ kho | used_order_id được `traLuotMa` xoá về NULL; đơn còn nợ kho → giữ | E2, D3; BV-giu-kho |
| 5 số hoá đơn | NGOÀI Phạm vi (`settings.js`) → Câu hỏi Q7 | — |
| 6 lộ PIN | nhật ký che `pin_code`, `password`, `ma_bam`; bản đủ cột chỉ trả cho chủ quán | D6 "che PIN"; BV-che-bi-mat |
| 7 điểm âm | cùng vị từ còn hạn với BALANCE_SQL | D10 "không chặn oan" (P7); VS-diem-am-het-han |
| 8 bài thử | sổ ví loại thật, đối soát trước–sau, export-all sau dọn, gói / kho / mã chung / hết hạn / 40 đơn lớn | 81 ca |
| nghi: tổng điểm | liệt kê thêm `tong_diem_con_han`, CSV + màn hiện | D1, D12 |
Thêm khi làm (đột biến lộ ra): luật "đơn chỉ chọn theo SĐT" dùng biểu thức ngày riêng → gom MỘT vị từ `theo_ngay` trong câu SQL.

## Câu hỏi (cho chủ quán — mỗi câu có đề xuất)
- **Q7 — số hoá đơn.** Máy tính số hoá đơn kế tiếp bằng cách ĐẾM hoá đơn trong năm (`server/routes/settings.js:246–258`). Dọn xoá hoá đơn
  thử → đếm giảm → số mới có thể TRÙNG số đã in trên tờ hoá đơn của đơn còn giữ (xoá một đơn ở quầy cũng bị y như vậy từ trước).
  **Đề xuất:** sửa cách tính thành "số lớn nhất đã dùng + 1" — một phiếu nhỏ riêng (hoặc cho thêm `server/routes/settings.js` vào
  Phạm vi phiếu này). Chưa sửa thì: chạy công cụ dọn TRƯỚC khi in hoá đơn thật đầu tiên (hoá đơn thử bị dọn hết → đếm lại từ đầu, không
  trùng).
- **Q8 — dọn theo ngày chạm cả khách thật.** Chọn "trước ngày X" thì điểm / voucher / gói / thẻ phát sinh trong giai đoạn thử của khách
  THẬT (khách SX có hồ sơ) cũng bị dọn — hồ sơ, ví, sổ ví của họ thì giữ. **Đề xuất:** giữ như vậy (giai đoạn thử là thử) — bạn duyệt trên
  file danh sách trước khi gõ chữ. Muốn giữ điểm khách thật thì nói, mình đổi "theo ngày" chỉ dọn số không có hồ sơ.
