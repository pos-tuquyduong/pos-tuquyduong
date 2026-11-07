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

## Đang ở bước
Bước 3 xong — kế hoạch `ke_hoach.md`. Phiếu dặn "lập kế hoạch rồi DỪNG chờ duyệt" (việc [T]) → **DỪNG, chờ chủ quán duyệt + trả lời Câu hỏi**.

## Câu hỏi
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
