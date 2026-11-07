# KHACH-APP-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (07.11.2026)
- nhánh: `viec/KHACH-APP-1`; cây sạch.
- `git rev-parse --short HEAD FETCH_HEAD`: HEAD `1c06bba` · FETCH_HEAD `1c06bba` (bằng nhau → không kéo).
- `git log --oneline -3`:
  ```
  1c06bba PHIEU: KHACH-APP-1 doi sang cach triet de - mot nguon POS (chu quan 06.11)
  9a49cdf PHIEU: KHACH-APP-1
  267348c TIEN-DO: TINGEE-1 chay that; CT-1b luat sinh 29/02 -> 28/02; mo KHACH-APP-1 (khach App hien o POS); quyet dinh 03 + 06.11 — so v56
  ```

## Bước 1 — lần làm tiếp (07.11.2026, sau khi chủ quán duyệt)
- nhánh `viec/KHACH-APP-1`, cây sạch; `git rev-parse --short HEAD FETCH_HEAD`: HEAD `37d195b` · FETCH_HEAD `37d195b` (bằng nhau).
- `git log --oneline -3`:
  ```
  37d195b PHIEU: KHACH-APP-1 chu quan duyet ke hoach + tra loi Q1-Q4 07.11 (them file vao Pham vi)
  dc6c85d KHACH-APP-1: ghi ket qua npm test sau buoc 3 (kho nong -> unshallow)
  05764eb KHACH-APP-1: ke hoach + cau hoi (cho chu quan duyet)
  ```

## Bước 1 — lần làm tiếp 2 (07.11.2026, sau khi chủ quán trả lời Q5)
- nhánh `viec/KHACH-APP-1`, cây sạch; `git rev-parse --short HEAD FETCH_HEAD`: HEAD `63334e5` · FETCH_HEAD `63334e5` (bằng nhau → không kéo).
- `git log --oneline -3`:
  ```
  63334e5 PHIEU: KHACH-APP-1 chu quan tra loi cau hoi 07.11 (them file vao Pham vi)
  afe703e KHACH-APP-1: bang chung do + trang thai; cau hoi Q5 (thu_KHO1 B1/B2)
  da1f1df KHACH-APP-1: dot_bien.py sua mau / chuoi
  ```

## Đang ở bước
Bước 6 xong (lần làm tiếp 2): `thu_KHO1.js` sửa theo Q5 — gốc 37d195b đỏ đúng ca B1c (111 đạt · 1 hỏng), HEAD 112/112.
`npm test -- --day-du` → PASS 105 · FAIL 0 · CẢNH BÁO 1 (route GET có lệnh ghi: packages.js:195, products.js:66, sync.js:148 — có sẵn trên gốc).
Kho mở nông lần nữa → `thu_BH2` G1 `bad revision 'cbbb809..HEAD'`; `git fetch -q --unshallow origin viec/KHACH-APP-1` rồi chạy lại xanh.
Tiếp: bước 8 soát độc lập, 8b soát bảo mật.

## Câu hỏi
(không còn câu mở)

## Câu hỏi đã trả lời (chủ quán 07.11 — phiếu 63334e5)
- **Q5 — bài cũ `cong_cu/thu_KHO1.js` B1 / B2 đỏ vì bước 020 HOÃN khi kho thử không có SX.** Chủ quán đồng ý đề xuất: thêm `thu_KHO1.js` vào
  Phạm vi; B1 / B2 so BẰNG tập `so` của các file `NNN_*.js` KHÔNG xuất `truoc`; thêm ca B1c (đỏ trên gốc). Đã làm ở commit 729386a.

## Câu hỏi đã trả lời (chủ quán 07.11 — phiếu commit 37d195b)
Chi tiết + đề xuất của mình ở `ke_hoach.md` mục "Câu hỏi cho chủ quán". Tóm tắt:
- **Q1 (K1 — phiếu lệch code):** màn Khách hàng ở quầy KHÔNG gọi `POST /customers`. Nút "Thêm khách" (`client/src/pages/Customers.jsx:115`)
  gọi `registrationsApi.create` → `POST /registrations` (`server/routes/registrations.js:218`) → chỉ ghi `pos_registrations` (chờ xuất sang SX),
  không ghi `pos_customers`. `POST /customers` (`server/routes/customers.js:314`) không màn nào gọi (`grep customersApi.create client/src` → 0).
  Khách tạo kiểu này hôm nay chỉ thành khách thật khi SX nhập về rồi bộ đệm chép lại; cắt SX thì họ mãi "Chờ đồng bộ", không có dòng
  `pos_customers` → không nhập được ngày sinh (`customers-v2.js` ngay-sinh trả `KHACH_KHONG_TON_TAI`), không có mã QR. `registrations.js` ngoài
  Phạm vi, client bị Cấm. Đề xuất: thêm `server/routes/registrations.js` vào Phạm vi để `POST /registrations` cũng gọi hàm tạo khách chung
  (vẫn ghi `pos_registrations` như cũ) + bước chép lần cuối chép luôn đăng ký đang chờ chưa có trong `pos_customers`.
- **Q2 (mặc định cột):** quầy (`customers.js:322, 359`) mặc định `customer_type='subscription'`, `sync_status='new'` (= "chờ xuất sang SX");
  App (`maKhach.js:186`) ghi `'retail'`, `'retail_only'`. Nghiệm thu D đòi so cột giống. Đề xuất: mặc định chung `retail` / `retail_only`
  (không còn xuất SX); quầy gửi rõ `customer_type` thì vẫn theo đó (đường xuất `sync.js` không đổi).
- **Q3 (khách SX đã ngừng):** đọc mọi dòng `pos_customers` hay chỉ `sx_status 'active'` / NULL như đường dự phòng cũ (`customers-v2.js:78`)?
  Đề xuất: mọi dòng (khách đã có tiền / điểm không được biến mất khỏi danh sách).
- **Q4 (bài thử cũ đỏ — phiếu dặn DỪNG):** `cong_cu/thu_GIOVN1.js` ca **A2j** (dòng 334–341) kiểm giờ ghi của `cacheCustomersToLocal` qua
  `GET /customers/search` với SX giả — hàm này phiếu bắt bỏ, nên A2j chắc chắn đỏ. Xin chat nới A2j trên main trước (khuôn SUA-*) — đề xuất
  chuyển A2j sang kiểm giờ ghi của bước chép lần cuối. Các bài cũ khác phiếu nêu (thu_CT1a, thu_HANG1, thu_KHACHCK1, thu_P15QR, thu_P26c) mình
  đọc thấy đều chạy với SX tắt / chỉ dùng `PUT …/discount` → dự kiến vẫn xanh; chạy thật mới chắc (bước 6).

## Phát hiện
- `POST /customers` thêm người nhận không SĐT (`customers.js:389`, `childPhone = null`) đụng `phone NOT NULL` (`database.js:86`) → 500. Hàm tạo
  chung sẽ chỉ nhận người nhận có SĐT hợp lệ; người nhận không SĐT bỏ qua như người nhận trùng SĐT (dòng 398) — hỏi nếu muốn khác.
- `PUT /v2/customers/:phone/address` và `/discount` (`customers-v2.js:315, 355`) tự chèn khách tên "Khách hàng" khi chưa có — đường tạo khách
  thứ ba, khác cột mặc định, không QR. Ngoài nghiệm thu C → để nguyên, ghi lại.
- Khách cũ chép từ bộ đệm SX (`cacheCustomersToLocal`) có `qr_code` NULL → quét QR không ra họ. Bước chép lần cuối chỉ THÊM khách thiếu (có QR);
  không ghi đè dòng cũ nên không cấp QR cho dòng cũ — cần thì mở việc riêng.
- Màn quầy vẫn hiện nhãn "SX" / "Đã đồng bộ" cho mọi khách (`CustomerSearch.jsx:306`, `Customers.jsx:298`) vì dạng trả ra giữ `source: 'sx'`,
  `is_synced: true` (phiếu: giữ nguyên dạng, client Cấm). Đổi nhãn thuộc việc giao diện sau.
- `orders.js:818` lấy tên mẹ từ `pos_registrations` (không từ `pos_customers`) để ghi nhật ký — ngoài Phạm vi.
- `kiem_tra_truoc_khi_giao.js:547` chú thích còn nhắc `fetchSXCustomers` — sửa chú thích cùng lúc bỏ hàm (K1: chú thích là khẳng định).
- Kiểm sau bước 3 (07.11): kho mở NÔNG → `thu_BH2.js` G1 đỏ `bad revision 'cbbb809..HEAD'` (không phải lỗi code). Chạy
  `git fetch -q --unshallow origin viec/KHACH-APP-1` (chỉ tải lịch sử) → `npm test` PASS 100 · FAIL 0 · CẢNH BÁO 2. Hai cảnh báo có SẴN trên
  code gốc (nhánh chưa đổi code): route GET có lệnh ghi (3: packages.js:195, products.js:66, sync.js:148) và route ghi không qua loiGhi đếm 54 >
  ngưỡng 50 (có `customers.js:314 POST` — việc này sẽ cho đi qua `loiGhi`). Không nới ngưỡng (K8).

## Chỗ vá → đột biến (`viec/KHACH-APP-1/dot_bien.py`, chạy `python3 viec/KHACH-APP-1/dot_bien.py` — đối chứng 68/68 xanh, 30/30 BẮT)
| Chỗ vá | Đột biến (ca bắt) |
|---|---|
| customers-v2.js `GET /` đọc qua docKhach, không gọi SX | BV-DOC-SX-DANH-SACH (A11) |
| customers-v2.js `/search` qua docKhach | BV-DOC-SX-TIM (A11) |
| customers-v2.js `/:phone`, `/:phone/full` qua motKhach | BV-DOC-SX-HO-SO (A11) |
| docKhach.js đọc MỌI dòng (Q3) | VS-DOC-CHI-ACTIVE (A14) |
| docKhach.js chọn trường, không rải dòng | VS-DOC-LO-BI-MAT (A12b) |
| docKhach.js dòng khách thắng đăng ký | VS-DOC-DANG-KY-DE-KHACH (A6b) |
| docKhach.js điểm còn hạn | VS-DOC-DIEM-HET-HAN (A1b) |
| docKhach.js số dư mẹ | VS-DOC-SO-DU-ME (A13) |
| docKhach.js thêm xung_ho | BV-DOC-XUNG-HO (A12) |
| khachMoi.js mặc định retail (Q2) | BV-TAO-MAC-DINH (C1) |
| khachMoi.js sinhQrKhongTrung | BV-TAO-QR-KHONG-KIEM (C2b) |
| khachMoi.js trùng SĐT chặn trong câu ghi | BV-TAO-TRUNG-NGOAI-CAU (C4) |
| customers.js POST trùng → 400 SDT_DA_CO | VS-QUAY-TRUNG-SAI-MA (C4b) |
| customers.js POST dùng mặc định chung | BV-QUAY-MAC-DINH-CU (C1) |
| customers.js POST /:id/children qua taoKhach | BV-NHAN-RIENG-QR (K2c) |
| maKhach.js App tạo qua taoKhach | BV-APP-TAO-RIENG (C2b) |
| registrations.js tạo khách thật (Q1) | BV-DK-KHONG-TAO (C7) |
| registrations.js SĐT đã là khách → 400, không ghi | VS-DK-TRUNG-VAN-GHI (C7b) |
| customers-v2.js địa chỉ / ghi chú tạo qua taoKhach | BV-V2-CHEN-RIENG (C8) |
| chay.js trạng thái HOÃN | BV-HOAN (B3) |
| chay.js bước NÉM vẫn hỏng + dừng | VS-NEM-THANH-HOAN (B7) |
| chay.js bước đã chạy không gọi truoc | VS-HOAN-GOI-LAI-SX (B2) |
| 020 chỉ thêm, không ghi đè | VS-CHEP-GHI-DE (B1b) |
| 020 sao lưu | BV-CHEP-SAO-LUU (B1d) |
| 020 nhật ký trước / sau | BV-CHEP-NHAT-KY (B1e) |
| 020 SX trả rỗng → HOÃN | VS-CHEP-RONG-LA-XONG (B3c) |
| 021 chỉ điền ô QR trống, không đổi cột khác | VS-021-DOI-COT (B6) |
| 021 chép đăng ký chờ | BV-021-DANG-KY (B6b) |
| 021 chỉ đăng ký CHỜ | VS-021-CHEP-DA-XUAT (B6b) |
| 021 cấp QR | BV-021-CAP-QR (B6) |

Tên đột biến: BV-DOC-SX-DANH-SACH, BV-DOC-SX-TIM, BV-DOC-SX-HO-SO, VS-DOC-CHI-ACTIVE, VS-DOC-LO-BI-MAT, VS-DOC-DANG-KY-DE-KHACH,
VS-DOC-DIEM-HET-HAN, VS-DOC-SO-DU-ME, BV-DOC-XUNG-HO, BV-TAO-MAC-DINH, BV-TAO-QR-KHONG-KIEM, BV-TAO-TRUNG-NGOAI-CAU, VS-QUAY-TRUNG-SAI-MA,
BV-QUAY-MAC-DINH-CU, BV-APP-TAO-RIENG, BV-NHAN-RIENG-QR, BV-DK-KHONG-TAO, VS-DK-TRUNG-VAN-GHI, BV-V2-CHEN-RIENG, BV-HOAN, VS-NEM-THANH-HOAN,
VS-HOAN-GOI-LAI-SX, VS-CHEP-GHI-DE, BV-CHEP-SAO-LUU, BV-CHEP-NHAT-KY, VS-CHEP-RONG-LA-XONG, VS-021-DOI-COT, BV-021-DANG-KY,
VS-021-CHEP-DA-XUAT, BV-021-CAP-QR.

## Ghi chú làm tiếp (07.11)
- Bộ chạy nâng cấp: HOÃN do bước TỰ trả về qua `truoc()` — gọi NGOÀI giao dịch vì giao dịch ghi Turso (`database.js` beginTransaction →
  `db.transaction("write")`) không nên mở trong lúc chờ SX (tới 8 s). Bước ném lỗi vẫn rollback + dừng + `hong` (ca B7 khoá).
- Phần chép không cần SX (đăng ký chờ + cấp QR ô trống) tách thành bước 021 để chạy cả khi 020 HOÃN (Replit không có SX).
- Bánh cóc `NGUONG_ROUTE_GHI_KHONG_LOIGHI` 50 → 49: bộ kiểm báo đếm 49 sau khi 5 route ghi khách đi qua `loiGhi` (được phép HẠ).
- `thu_GIOVN1` A2j: bước 020 nạp lúc khởi động TRƯỚC SX giả của bài → bài xoá bộ đệm `require` của 020 rồi chạy khung lại (chỉ sửa bài).
- `thu_GIOVN1` M5 (phép tĩnh giờ ghi) báo `khachMoi.js` INSERT thiếu `created_at` khi danh sách cột sinh động → viết cột ra hẳn (K8: phép đúng).
