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
| chonDong: không đơn hôm nay | VS-don-hom-nay |
| chonDong: theo ngày không xoá hồ sơ | VS-xoa-ngay-ho-so |
| chonDong: theo SĐT giữ dòng của đơn không dọn | VS-sdt-gan-don-giu |
| chonDong: mã giảm theo voucher / mã bill | BV-ma-giam |
| chonDong: giữ ví ≠ 0 (đơn) | VS-don-vi-khac-0 |
| chonDong: giữ ví ≠ 0 (dòng theo ngày) | VS-ngay-dung-vi |
| chonDong: giữ đơn có phiên | BV-giu-phien |
| donDuLieuThu: chặn điểm âm | BV-diem-am |
| donDuLieuThu: gói bị dọn → NULL ở đơn giữ | BV-bo-goi |
| donDuLieuThu: chữ xác nhận đúng nguyên chữ | VS-sai-chu |
| donDuLieuThu: so ma_xac_nhan | VS-bo-so-ma |
| băm gồm mọi id | VS-bam-thieu-id |
| xoá + nhật ký cùng giao dịch | VS-ngoai-giao-dich |
| bản chụp nguyên dòng | VS-ban-chup-thieu |
| `server/index.js` mount | BV-mount |
| `client/src/pages/QuanLy/donThu.js` moNutDon (đã tải sao lưu) | BV-nut-sao-luu |
| dungCsv phần giữ lại | VS-csv-thieu-giu-lai |
| `DonThu.jsx` đổi tiêu chí bỏ dấu đã tải | VS-man-khong-bo-dau |
| `QuanLy.jsx` ô chỉ owner | BV-o-quan-ly |
| `App.jsx` route | BV-route-app |
Kết quả `python3 viec/KH-SDT-1/dot_bien.py`: ĐỐI CHỨNG XANH · TỔNG 23 · BẮT 23 · SỐNG 0 · HỎNG 0 · LẠC 0
(vòng đầu: VS-man-khong-bo-dau SỐNG → siết ca D12; VS-ngoai-giao-dich LẠC vì đột biến viết sai lỗi → viết lại đúng lỗi "commit trước ghi nhật ký").

## Phát hiện (thêm)
- `pos_don_app` (bước 006) KHÔNG có trong `BACKUP_TABLES` (`server/routes/backup.js:41–114`) — thuộc SAOLUU-2. Công cụ dọn không đụng bảng này.
- Đổi Q1 nghĩa là dòng 31.10 "SĐT đăng ký mới BẮT ĐẦU TỪ 0" ở `QUYET_DINH_CHU_QUAN.md:68` đã cũ — chat ghi sổ cập nhật (máy không sửa).
