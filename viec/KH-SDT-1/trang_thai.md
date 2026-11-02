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
- ~~Q7~~ — ĐÃ xử lý trong Phạm vi ở vòng sửa 2 (người soát vòng 2 gợi ý): công cụ xoá HẾT hoặc KHÔNG xoá hoá đơn năm nay — còn hoá đơn
  năm nay ở đơn giữ thì đơn thử có hoá đơn năm nay cũng giữ (ca D13). Không cần sửa `settings.js`. Đề xuất cũ để tham khảo:
- **Q7 — số hoá đơn.** Máy tính số hoá đơn kế tiếp bằng cách ĐẾM hoá đơn trong năm (`server/routes/settings.js:246–258`). Dọn xoá hoá đơn
  thử → đếm giảm → số mới có thể TRÙNG số đã in trên tờ hoá đơn của đơn còn giữ (xoá một đơn ở quầy cũng bị y như vậy từ trước).
  **Đề xuất:** sửa cách tính thành "số lớn nhất đã dùng + 1" — một phiếu nhỏ riêng (hoặc cho thêm `server/routes/settings.js` vào
  Phạm vi phiếu này). Chưa sửa thì: chạy công cụ dọn TRƯỚC khi in hoá đơn thật đầu tiên (hoá đơn thử bị dọn hết → đếm lại từ đầu, không
  trùng).
- **Q8 — dọn theo ngày chạm cả khách thật.** Chọn "trước ngày X" thì điểm / voucher / gói / thẻ phát sinh trong giai đoạn thử của khách
  THẬT (khách SX có hồ sơ) cũng bị dọn — hồ sơ, ví, sổ ví của họ thì giữ. **Đề xuất:** giữ như vậy (giai đoạn thử là thử) — bạn duyệt trên
  file danh sách trước khi gõ chữ. Muốn giữ điểm khách thật thì nói, mình đổi "theo ngày" chỉ dọn số không có hồ sơ.

## Soát độc lập vòng 2 (agent phụ mới, chỉ đọc) — tóm tắt báo cáo
KHÔNG ĐẠT — vòng sửa 1 đúng (kiểm lại trên code), còn 2 lỗi NẶNG mới, người soát chạy thử ra được:
1. NẶNG — donThu.js BANG_THEO_DON + maGiam + chiaGiu chỉ canh sổ ví của số khác: khách THẬT B nhận mã bill in trên đơn thử → xoá đơn thử
   xoá luôn điểm của B (order_id = đơn thử, signup-codes.js:251-256), mã bill B đã nhận, mã giảm của B (kể cả dòng SAU X). K4.
2. NẶNG — donThu.js traLuotMa cho MỌI đơn xoá, kể cả đơn đã huỷ / hoàn (đã trả lượt ở orders.js:1500, refunds.js:172); xoá đơn ở quầy chỉ
   trả khi completed (orders.js:1672-1674) → mã chung được thêm lượt, I13 có thể đỏ. K4.
3. NHẸ — dòng điểm / sổ ví trỏ tới đơn đã xoá ở quầy → cả số bị giữ vĩnh viễn; theo ngày cũng không dọn (`order_id IS NULL`). K4/K5.
4. NHẸ — gói không gắn đơn của số trong P bị xoá trong khi đơn số khác đang lấy từ gói; ke_hoach.md:32 hứa "đặt NULL" (K1).
5. NHẸ — xoá hồ sơ số trong P không xét parent_phone của khách / đăng ký khác.
6. NHẸ — dòng traLuotMa sửa không được chụp vào nhật ký.
7. NHẸ — trang_thai.md chưa ghi npm test / --day-du / cong.js / báo cáo 7 mục; chưa có phép dò PRAGMA.
NGHI NGỜ: két ngày thử đã đếm sẽ lệch · số thử có trên SX nhập lại · token App của số bị xoá · voucher phát trước X dùng trên đơn sau X ·
cắt đôi cặp UTF-16 ở ranh giới phần nhật ký · Q8.
NGHIỆM THU: 2/3 · thiếu E (lỗi 1, 2). Đơn giản: một vị từ "dòng gắn order_id thuộc SĐT không trong P"; coi order_id mồ côi là xoá được;
lọc completed trước traLuotMa; Q7 làm được trong Phạm vi (giữ đơn có hoá đơn năm nay trừ khi xoá hết).
BÀI HỌC: KHOÁ — ca "dòng con gắn đơn bị xoá nhưng thuộc SĐT KHÁC" cho mọi cột SĐT của bảng con · KHOÁ — chép phần bù của route có sẵn
thì chép cả điều kiện bao quanh (status === 'completed') + ca đơn huỷ / hoàn · NGUYÊN TẮC K4 — dữ liệu do đường xoá cũ để lại (order_id
mồ côi) là đầu vào hợp lệ · NGUYÊN TẮC — lời hứa trong kế hoạch phải là một ca thử hoặc xoá khỏi kế hoạch.

## Vòng sửa 2 — xử lý từng lỗi
| Lỗi | Xử lý | Bằng chứng |
|---|---|---|
| 1 mã bill khách thật | MỘT vị từ `khac(o)`: dòng gắn đơn (điểm, sổ ví, gói, thẻ, mã bill claimed / diem_nhan) của SĐT khác chủ đơn (hoặc sổ ví bất kỳ) mà số đó không dọn → giữ đơn | D3 "mã bill khách thật B"; BV-giu-so-khac |
| 2 trả lượt 2 lần | chỉ đơn `completed` (như orders.js:1668) | E2 (đơn huỷ dùng CHUNG); BV-tra-luot-moi-don |
| 3 mồ côi | ganDon chỉ xét đơn còn tồn tại; theo ngày dọn điểm có order_id mồ côi | D1 (T1 +50 mồ côi), D5 (CM); BV-mo-coi, BV-mo-coi-ngay |
| 4 gói số khác dùng | gói của số trong danh sách mà đơn không dọn đang dùng → giữ cả số; bỏ lời hứa "đặt NULL" khỏi kế hoạch | D5 (G); BV-goi-so-khac |
| 5 mẹ của khách | số là mẹ (pos_customers / pos_registrations.parent_phone) của khách không xoá → giữ cả số | D5 (M2); BV-me-cua-khach |
| 6 dòng sửa | nhật ký `sua_truoc` chụp mã giảm + voucher trước traLuotMa | D6 "chụp dòng bị SỬA"; BV-sua-truoc |
| 7 hồ sơ / PRAGMA | `BANG_KHONG_DON` + ca D14 dò PRAGMA mọi bảng có cột SĐT / order_id; kết quả npm test ghi dưới | D14; BV-bang-khong-don |
| Q7 số hoá đơn | xoá hết hoặc không xoá hoá đơn năm nay | D13; BV-hoa-don-nam |
| nghi: két | liệt kê `ket_se_lech` (màn + CSV) — không chặn, sổ đối soát không dọn (chủ quán chốt chỉ liệt kê) | D1 két; BV-ket |
| nghi: UTF-16 | cắt phần không cắt đôi cặp thay thế | CHƯA KIỂM bằng ca (khó dựng tất định) |
Thêm khi làm: vị từ "giữ cả số vì dòng gắn đơn còn" ban đầu tính cả mã bill → giữ oan T2 (mã bill T2 nhận trên đơn thật R) → loại mã bill
khỏi vị từ đó (VS-ma-bill-giu-so bắt).

## Soát độc lập vòng 3 (agent phụ mới, chỉ đọc) — tóm tắt báo cáo
KHÔNG ĐẠT — vòng sửa 1, 2 đúng (người soát kiểm lại từng chỗ trên code: chiaGiu, vị từ `khac`, traLuotMa chỉ completed, mồ côi, hoá đơn năm
nay, mẹ của khách, sua_truoc, che bí mật, UTF-16; tự cài thêm đột biến bỏ `coVi.has(o.parent_phone)` → bài đỏ 10 ca). Còn:
1. NẶNG (tiền: đối soát két) — donThu.js `ket_se_lech` chỉ lấy ngày có đơn bị xoá VÀ có đếm két đúng ngày đó. Két một ngày = để lại của lần
   đếm trước + tiền vào / ra cả KHOẢNG tới ngày đó (doiSoat.js:127-133 soKet, :96-113 tienTheoSo: bán theo ngày tạo, thu nợ theo
   `pos_order_log.luc`, huỷ theo `cancelled_at`, nạp ví). Người soát chạy thử X = 2026-09-01: (a) đếm két 08-01 và 08-10, xoá đơn tiền mặt
   08-05 → két 08-10 `khop` thành `lech 50000`; (b) đơn nợ tạo 08-31, thu nợ tiền mặt 09-02 (ngày SAU X, có đếm két) → két 09-02 `khop`
   thành `lech 30000`. Cả hai `ket_se_lech: []`. Chú thích donThu.js sai (K1); E3 chỉ chạy két hôm nay (K3).
2. NHẸ — `sua_truoc` ghi vào MỘT ô details, không chia phần (cùng khuôn lỗi 2 vòng 1).
3. NHẸ — số giữ cả số vì gói / mẹ / dòng gắn đơn không dọn: màn / CSV không có lý do (CSV ghi "xem lý do ở ví / đơn" — sai với ca đó).
4. NHẸ — ke_hoach.md mục 4 dòng E2 còn lời hứa "gói … → NULL"; danh sách đột biến mục 4 cũ.
5. NHẸ — UTF-16 dựng ca tất định được (emoji ở vị trí 29.999); trang_thai.md chưa ghi npm test / --day-du / cổng / báo cáo 7 mục.
NGHI NGỜ: sao lưu export-all KHÔNG khôi phục được bảng tiền (backup.js:119-122) — màn không nói dọn xong chỉ còn bản chụp JSON · lời dặn
"phiếu kho / payOS chỉ liệt kê" mà công cụ không liệt kê kho_phieu / payOS · pos_don_app của số thử ở lại · giao dịch dài trên Turso ·
nhật ký (tên, SĐT, ví khách bị xoá) nhân viên đọc được qua GET /sync/logs · Q8.
NGHIỆM THU: 2/3 · thiếu E (lỗi 1). Đường tiền ✓ (server không lấy số tiền từ client). P1 ✓ (--day-du khớp, PASS 93).
BÀI HỌC: KHOÁ — công cụ xoá theo ngày có ca đối soát két của NGÀY ĐƯỢC GIỮ mà khoảng két trùm dữ liệu bị xoá; chạy chayDoiSoat kiểu ngày
cho mọi ngày có đếm két · NGUYÊN TẮC K4 — dòng tiền có NGÀY RIÊNG (thu nợ, huỷ, nạp ví) đi theo đơn bị xoá phải xét theo ngày của chính
dòng đó · KHOÁ — mọi ô ghi vào pos_sync_logs qua cùng một hàm chia phần.

## DỪNG sau 3 vòng soát (LUAT §6.5): còn lỗi NẶNG đụng tiền / đối soát → KHÔNG tự làm vòng sửa 4, hỏi chủ quán (Q9).
Lỗi NHẸ 2–5 làm cùng lúc với Q9 khi chủ quán trả lời.

## Câu hỏi (thêm)
- **Q9 — két các ngày bị ảnh hưởng khi dọn (quan trọng, đụng đối soát).** Màn Đối soát tính két một ngày = tiền để lại lần đếm TRƯỚC + mọi
  tiền mặt vào / ra từ đó tới hết ngày này (bán, thu nợ theo ngày thu, huỷ theo ngày huỷ, nạp ví). Xoá đơn thử thì các lần đếm két SAU đơn đó
  (tới lần đếm kế tiếp) sẽ báo "lệch" — kể cả một ngày THẬT sau ngày X nếu tiền của đơn thử (thu nợ / huỷ) rơi vào ngày đó.
  **Đề xuất của mình (bạn chỉ cần xác nhận):**
  (1) Két của ngày TRƯỚC ngày X (giai đoạn thử) được phép báo lệch sau khi dọn — máy liệt kê ĐÚNG các ngày đó (tính theo cả khoảng, mọi
      loại tiền) trên màn + file danh sách để bạn biết trước.
  (2) Két của ngày TỪ ngày X trở đi KHÔNG được đổi: đơn thử nào có tiền rơi vào khoảng tính của một lần đếm két từ ngày X trở đi → máy GIỮ
      lại đơn đó (ghi lý do), không xoá.
  (3) Bài thử chạy đối soát két cho MỌI ngày có đếm két trước và sau khi dọn: ngày ≥ X không đổi, ngày < X đổi thì phải nằm trong danh sách.
  Nếu bạn muốn đơn giản hơn: chạy công cụ trước khi đếm két thật lần đầu (ngày X = ngày bắt đầu bán thật, chưa đếm két ngày nào từ X) thì
  (2) không bao giờ xảy ra — nhưng máy vẫn nên khoá (2), vì khoá chứ không dặn.
- **Q8** (vẫn chờ) — dọn theo ngày chạm điểm / voucher giai đoạn thử của khách thật.

## Kiểm (bước 6, 11.4)
- `node cong_cu/thu_KHSDT1.js` → 87 đạt · 0 hỏng (SỐ CA 87).
- `npm test` → ĐẾM: PASS 89 · FAIL 0 · CẢNH BÁO 1 (lần đầu); `npm test -- --day-du` sau vòng sửa 2 → PASS 93 · FAIL 0 · CẢNH BÁO 1
  (cảnh báo không thuộc việc này — người soát vòng 3 xác nhận); "dist đã commit KHỚP với src".
- `python3 viec/KH-SDT-1/dot_bien.py` → ĐỐI CHỨNG XANH · 43/43 BẮT.
- `node tu_chay/cong.js chay . 87aa996^ HEAD viec/KH-SDT-1` → ✓ CỔNG CHẠY ĐẠT (ở 0188baa).

## Bài học
1. **KHOÁ (đã làm, trong Phạm vi):** bài thử công cụ xoá hàng loạt chạy đối soát trước–sau (E3), tải sao lưu sau dọn (E4), dò PRAGMA mọi
   bảng có cột SĐT / order_id phải có chủ (D14), sổ ví dùng loại dòng thật. Lý do: vòng 1 bài xanh 67/67 trên dữ liệu bịa trong khi sổ ví
   lệch và sao lưu hỏng.
2. **KHOÁ (đề xuất, ngoài Phạm vi — `kiem_tra_truoc_khi_giao.js` / khung):** phép kiểm "mọi INSERT vào `pos_sync_logs` đi qua một hàm chia
   phần ≤ 32.767 ký tự / ô" (vòng 3 lỗi 2: `sua_truoc` một ô). Ca đỏ: chèn ô 40.000 ký tự rồi gọi export-all → 500.
3. **NGUYÊN TẮC (đề xuất K4, `KHUON_LOI.md` ngoài Phạm vi):** "Công cụ xoá / sửa hàng loạt làm cùng việc với route có sẵn (xoá đơn) phải
   GỌI chung phần bù VÀ chép cả điều kiện bao quanh (status === 'completed')" — Đã gây: vòng 2 trả lượt mã cho đơn đã huỷ (CHUNG 3 → 1).
4. **NGUYÊN TẮC (đề xuất K4):** "Xoá sạch theo khoá X mà giữ một phần dòng của X là tạo lại mồ côi — giữ cả cụm hoặc xoá cả cụm; dòng tiền có
   NGÀY RIÊNG (thu nợ, huỷ, nạp ví) xét theo ngày của chính nó" — Đã gây: vòng 1 xoá hồ sơ còn đơn hôm nay; vòng 3 két ngày sau X lệch.
5. **NGUYÊN TẮC (đề xuất K1):** "Lời hứa trong kế hoạch phải là một ca thử hoặc xoá khỏi kế hoạch khi đổi cách" — Đã gây: "đặt NULL gói"
   còn ở ke_hoach.md sau khi bỏ.
6. **BỎ:** người gác chặn chạy bài thử chứa cụm bí mật khi chưa commit (B-BIMAT-CHU) — luật đã có, làm theo (commit trước rồi chạy).
7. **BỎ:** neo đột biến lệch sau khi đổi chữ code (3 HỎNG ở vòng 2) — bộ đột biến đã báo HỎNG đúng cách, sửa neo.

## Báo cáo 7 mục
VIỆC:        KH-SDT-1 — (theo chủ quán đổi 01.11) chỉ còn công cụ dọn dữ liệu thử trước khai trương; khoá dữ liệu cũ BỎ.
ĐÃ SỬA:      server/utils/donThu.js (mới) — chọn dòng một hàm cho liệt kê + dọn, giữ cả cụm (chiaGiu), dọn một giao dịch, nhật ký chia
             phần + che cột bí mật, trả lượt mã đơn completed · server/routes/don-thu.js (mới) — /liet-ke, /don chỉ owner · server/index.js
             — mount /api/pos/don-thu · client/src/pages/DonThu.jsx (mới) + QuanLy/donThu.js (mới) — liệt kê → tải CSV → tải sao lưu → gõ
             chữ → Dọn · QuanLy.jsx — ô chỉ owner · App.jsx — route /don-thu · client/dist build · kiem_tra_truoc_khi_giao.js — chạy bài mới.
BÀI THỬ:     cong_cu/thu_KHSDT1.js — gốc 720d08d ĐỎ (7 đạt · 45 hỏng, ✗ D0 chưa có route); bản vá vòng 1 / giữa vòng đỏ đúng từng lỗi người
             soát nêu (bang_chung_do.txt); sau vá XANH 87/87. Đột biến 43/43 BẮT.
ĐÃ RÀ K4:    PRAGMA mọi bảng có cột SĐT / order_id → 0 bảng vô chủ (D14); mọi cột SĐT của bảng con (DONG_CON_CO_SDT, 6 cặp); đường xoá đơn
             orders.js DELETE (traLuotMa + điều kiện completed); huỷ / hoàn. CHƯA xử lý: khoảng két (Q9 — NẶNG, chờ chủ quán) + lỗi nhẹ
             vòng 3 (sua_truoc một ô, lý do giữ số, ke_hoach mục 4, ca UTF-16).
CHƯA KIỂM:   - Lỗi NẶNG vòng 3 chưa sửa: dọn có thể làm két một ngày THẬT sau X báo lệch (Q9). Công cụ CHƯA nên chạy trên production.
             - Chủ quán đã thật sự LƯU file sao lưu (màn chỉ biết đã bấm tải); sao lưu không khôi phục được bảng tiền — lấy lại chỉ từ bản chụp JSON.
             - Turso production: giao dịch dài, cỡ bản chụp.
             - Ca UTF-16 cắt đôi emoji ở ranh giới phần (code đúng khi đọc, chưa có ca).
             - Phiên đăng nhập App KH đang mở của số bị xoá hồ sơ; số thử có trên SX được đồng bộ nhập lại sau dọn.
             - Nhật ký (tên, SĐT, ví khách bị xoá) nhân viên đọc được qua GET /sync/logs — chỉ che PIN / mật khẩu / mã băm.
             - Q8 (khách thật theo ngày) chờ chủ quán.
GIT:         0188baa KH-SDT-1: bao cao soat vong 3 + cau hoi Q9 (ket doi soat) — DUNG cho chu quan
             9d9a216 KH-SDT-1: ho so vong sua 2 — bao cao soat 2, bang chung do, Q7 xu ly trong pham vi
BÀI HỌC:     KHOÁ 2 · NGUYÊN TẮC 3 · BỎ 2 — chi tiết ở ## Bài học

HEAD ĐÃ KIỂM: 0188baa

## Làm tiếp 02.11.2026 — chủ quán trả lời Q8, Q9 → vòng sửa 4 (Q9 + 4 lỗi nhẹ vòng 3, một lượt)
- Bước 1: nhánh `viec/KH-SDT-1`, cây sạch. HEAD `c8ef3b8` · FETCH_HEAD `c8ef3b8` — bằng nhau, không kéo (hook mở phiên đã kéo 87aa996 → c8ef3b8).
  ```
  c8ef3b8 KH-SDT-1: kiem, bai hoc, bao cao 7 muc — dung cho chu quan tra loi Q8, Q9
  0188baa KH-SDT-1: bao cao soat vong 3 + cau hoi Q9 (ket doi soat) — DUNG cho chu quan
  9d9a216 KH-SDT-1: ho so vong sua 2 — bao cao soat 2, bang chung do, Q7 xu ly trong pham vi
  ```
- Chủ quán 02.11: **Q9 đồng ý đề xuất** — két trước ngày X được lệch (máy liệt kê trước); đơn thử có tiền rơi vào khoảng tính két từ ngày
  X thì giữ lại. **Q8 đồng ý giữ như đề xuất** — dọn theo ngày chạm cả điểm / voucher giai đoạn thử của khách thật (hồ sơ, ví, sổ ví giữ),
  chủ quán duyệt trên file danh sách. Sửa Q9 + lỗi nhẹ 2–5 trong một lượt (chat soát thay — LUAT §6.5, chủ quán dặn thẳng).
- Lựa chọn an toàn máy tự làm (LUAT §6.6): KHÔNG chọn ngày (chỉ theo SĐT) → coi MỌI két đã đếm là không được đổi (đơn có tiền vào két
  nào cũng giữ, lý do ghi rõ); muốn dọn thì thêm ngày X sau các két thử. Nạp ví tiền mặt của số trong danh sách rơi vào két ≥ X → giữ cả số.

### Vòng sửa 4 — xử lý từng lỗi
| Lỗi (vòng soát 3) | Xử lý | Bằng chứng |
|---|---|---|
| 1 NẶNG két (Q9) | `tienMatTheoNgay` (cùng công thức `tienTheoSo('cash')`: bán − thu nợ ngày tạo, thu nợ ngày thu, huỷ ngày huỷ, nạp ví) + `ketBiDoi` (tiền ngày e → lần đếm đầu từ e, có mốc trước). Két ≥ X (không ngày: mọi két) đổi → giữ đơn / giữ cả số; `ket_se_lech` = két < X có tổng bị dọn ≠ 0 | D1 két, D3 huỷ đúng X, D3 nợ thu sau X, D5 T4, D15, E5 (so `chayDoiSoat` thật mọi ngày két) |
| 2 sua_truoc một ô | bản chụp chia phần = `{ xoa, sua_truoc }`; details chỉ tiêu chí + số dòng + băm | D6 sua_truoc; BV-sua-truoc, VS-sua-truoc-mot-o |
| 3 lý do giữ số | `giu_lai.ly_do_sdt` (lý do đầu tiên); màn + CSV ghi đúng lý do từng số | D2, D5 lý do, D12 CSV / màn; BV-ly-do-sdt, BV-csv-ly-do, BV-man-ly-do |
| 4 kế hoạch cũ | `ke_hoach.md` mục 4 bỏ "gói → NULL", danh sách đột biến trỏ về `dot_bien.py`; thêm mục 9 | — (hồ sơ) |
| 5 UTF-16 | tách `chiaPhan` (xuất ra), ca emoji ở vị trí 29.999 | D16; BV-chia-utf16 |

### Chỗ vá → đột biến (thêm ở vòng 4; bảng cũ phía trên vẫn đúng — neo đổi: BV-giu-so-gan-don-khac, BV-goi-so-khac, BV-me-cua-khach, BV-sua-truoc, BV-ket, BV-giu-ca-so)
| Chỗ vá | Đột biến |
|---|---|
| chiaGiu: đơn có tiền mặt vào két không được đổi → giữ | BV-giu-ket-don |
| két được bảo vệ TỪ ngày X (gồm ngày X) | VS-ket-tu-sau-x |
| không chọn ngày → mọi két được bảo vệ | VS-ket-chi-khi-co-ngay |
| tiền thuộc lần đếm đầu từ ngày đó (cả khoảng) | VS-ket-cung-ngay |
| két chưa có mốc không lệch | VS-ket-khong-moc |
| thu nợ theo ngày thu | VS-ket-bo-thu-no |
| huỷ theo ngày huỷ | VS-ket-bo-huy |
| nạp ví tiền mặt → giữ cả số | BV-nap-ket |
| `ket_se_lech` theo khoảng | BV-ket |
| sua_truoc trong phần chia | BV-sua-truoc, VS-sua-truoc-mot-o |
| `ly_do_sdt` máy chủ / CSV / màn | BV-ly-do-sdt, BV-csv-ly-do, BV-man-ly-do |
| `chiaPhan` không cắt đôi cặp UTF-16 | BV-chia-utf16 |
| số có đơn giữ → giữ cả số (neo mới) | BV-giu-ca-so |
Kết quả: ĐỐI CHỨNG XANH (95 đạt) · TỔNG 56 · BẮT 56 (BV-giu-ca-so lần đầu SỐNG — neo cũ thành tương đương → đổi neo, chạy riêng BẮT).

### Luồng hợp lệ KHÔNG bị chặn (K5) — mỗi luồng một ca
- Đơn 0đ tiền mặt nằm trong khoảng két ≥ X (ORD-20260831-001) → vẫn dọn: D1 danh sách đơn.
- Đơn trước lần đếm két đầu tiên (ORD-20260725-001) → dọn, không báo két nào lệch: D1 két, E5.
- Đơn tiền mặt có két < X (O1, T5) → dọn + liệt kê: D1, E5.
- Số T2 nạp ví tiền mặt 20/10 (không két nào sau) → vẫn xoá sạch: D5 `sdt` = [T2, P6, CM].

### Kiểm (vòng 4)
- `node cong_cu/thu_KHSDT1.js` → 95 đạt · 0 hỏng (SỐ CA 95). Trên gốc c8ef3b8 → 70 đạt · 25 hỏng (`bang_chung_do.txt`).
- `python3 viec/KH-SDT-1/dot_bien.py` → ĐỐI CHỨNG XANH · 56/56 BẮT.
- `npm test -- --day-du` → ĐẾM: PASS 93 · FAIL 0 · CẢNH BÁO 1 (cảnh báo cũ, không thuộc việc này); "dist đã commit KHỚP với src hiện tại".
- `node tu_chay/cong.js tinh . 87aa996^ HEAD viec/KH-SDT-1` (trước 11.4) → chỉ `✗ [A19]` (dòng HEAD ĐÃ KIỂM cũ — bình thường).
- SOÁT LẦN CUỐI: chat soát thay (LUAT §6.5 — chủ quán dặn sửa Q9 + lỗi nhẹ trong một lượt; không gọi agent soát nữa).

### Nghiệm thu — đếm từng mục
- A Điều tra: `ke_hoach.md` mục 1 (không đổi ở vòng này).
- B, C: chủ quán BỎ 01.11 (Q1) — không làm.
- D Công cụ dọn: liệt kê D1/D2/D15, CSV + màn D12, dọn chỉ khi gõ chữ D5, sao lưu trước (nút D12, E4), một giao dịch D11, nhật ký D6
  (chia phần, sua_truoc, che bí mật, D16 emoji), ví ≠ 0 không dọn D3, chạy lại không làm gì D7.
- E K5: E1 (mọi dòng không nhãn còn nguyên từng cột), E2 (tiền đơn giữ, trả lượt mã), E3 (đối soát không thêm lệch), E5 (két mọi ngày:
  ≥ X không đổi, < X đổi đúng bằng danh sách), luồng hợp lệ ở mục "Luồng hợp lệ KHÔNG bị chặn" trên.

## Bài học (vòng 4)
1. **KHOÁ (đã làm, trong Phạm vi):** công thức tiền két chép từ `doiSoat.js tienTheoSo` (doiSoat đọc qua kết nối chung, không qua `tx`) →
   E5 so két MỌI ngày bằng `chayDoiSoat` thật trước–sau, nên công thức chép lệch là bài đỏ. **Đề xuất ngoài Phạm vi:** `doiSoat.js` xuất
   một hàm "tiền mặt theo ngày của danh sách đơn" nhận kết nối `q`, để `donThu.js` gọi chung (bỏ bản chép) — việc sau.
2. **NGUYÊN TẮC (đề xuất K3, ngoài Phạm vi `KHUON_LOI.md`):** "Ca liệt kê theo NGÀY phải có dữ liệu mà cách tính cũ và mới cho kết quả
   khác nhau — ngày của sự kiện ≠ ngày được tính" — Đã gây: lượt này ca D1 két xanh trùng hợp trên gốc (két 31/08 trùng ngày một đơn 0đ
   31/08); bắt được nhờ chạy bài trên gốc, đổi két sang 30/08.
3. **BỎ:** đột biến BV-giu-ca-so thành tương đương sau khi đổi cách lọc P (SỐNG) — bộ đột biến báo đúng, đổi neo; đã có luật.
4. **BỎ:** người gác chặn `git worktree` (GIT-LENH), `until` (B-CHUONGTRINH), python heredoc nối lệnh (B-PHANTICH), chạy bài chứa cụm bí
   mật chưa commit (B-BIMAT-CHU) — đều làm theo hướng dẫn (script trong nháp, commit trước rồi chạy).

## Báo cáo 7 mục (vòng 4)
VIỆC:        KH-SDT-1 — công cụ dọn dữ liệu thử; vòng 4: Q9 (két) + 4 lỗi nhẹ vòng soát 3.
ĐÃ SỬA:      server/utils/donThu.js — tienMatTheoNgay + ketBiDoi (két theo KHOẢNG), chiaGiu giữ đơn / số có tiền mặt vào két từ X (không
             ngày: mọi két), ket_se_lech theo khoảng, giu_lai.ly_do_sdt, chiaPhan (xuất ra), sua_truoc vào phần chia ·
             client/src/pages/QuanLy/donThu.js — CSV lý do từng số · client/src/pages/DonThu.jsx — màn lý do + ghi chú két · client/dist build.
BÀI THỬ:     cong_cu/thu_KHSDT1.js — gốc c8ef3b8 ĐỎ 70 đạt · 25 hỏng (D1 két, D3 huỷ X / nợ, D15, D5 T4, E5, D6 sua_truoc, D2/D5/D12 lý do,
             D16); sau vá XANH 95/95. Đột biến 56/56 BẮT.
ĐÃ RÀ K4:    mọi dòng tiền mặt két tính (`doiSoat.js tienTheoSo`: bán, thu nợ, nạp ví, huỷ) → 4 nhánh trong tienMatTheoNgay, mỗi nhánh một
             đột biến; mọi đường xoá dòng tiền mặt của công cụ: đơn (theo ngày + theo SĐT) và nạp ví (chỉ theo SĐT — theo ngày không xoá
             sổ ví) → cả hai canh két; mọi ô ghi pos_sync_logs của công cụ (don_thu, don_thu_chup) → sua_truoc vào phần chia.
CHƯA KIỂM:   - Chủ quán đã thật sự LƯU file sao lưu (màn chỉ biết đã bấm tải); sao lưu export-all không khôi phục được bảng tiền — lấy lại
               chỉ từ bản chụp JSON.
             - Turso production: giao dịch dài, cỡ bản chụp.
             - Công thức két là bản CHÉP của tienTheoSo — E5 khoá trên dữ liệu thử; đổi doiSoat sau này mà quên donThu thì chỉ bài E5 bắt.
             - Tiền chuyển khoản không xét (két chỉ tiền mặt) — đúng soKet; sao kê CK tuần không được canh.
             - Phiên đăng nhập App KH đang mở của số bị xoá hồ sơ; số thử có trên SX được đồng bộ nhập lại sau dọn.
             - Nhật ký (tên, SĐT, ví khách bị xoá) nhân viên đọc được qua GET /sync/logs — chỉ che PIN / mật khẩu / mã băm.
             - Không có soát độc lập bằng agent cho vòng 4 (chat soát thay theo LUAT §6.5).
GIT:         (xem dòng git log ở câu trả lời cuối phiên)
BÀI HỌC:     KHOÁ 1 · NGUYÊN TẮC 1 · BỎ 2 — chi tiết ở ## Bài học (vòng 4)
