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
Bước 8 vòng soát 1: **KHÔNG ĐẠT** (báo cáo dưới). Vòng sửa 1 đã làm phần trong Phạm vi, không phải quyết định nghiệp vụ (lỗi 3, 4, 5):
ca C3 bỏ `?? id` (so sdt + ten), thu_KHO1 B1c tập miễn HOÃN cố định `['020_chep_khach_sx.js']`, ba chỗ hồ sơ lệch; thêm đột biến
VS-APP-SAI-KHACH, VS-BUOC-KHAC-HOAN → `dot_bien.py` 32/32 BẮT (đối chứng 68/68 · 112/112). Lỗi 1, 2 là cách quầy làm việc + đụng dữ liệu
khách (Cấm "không xoá dữ liệu khách") → **DỪNG chờ chủ quán** (Q6, Q7).

## Câu hỏi
- **Q6 (07.11, soát vòng 1 lỗi 1) — màn "Đăng ký" sửa / xoá nay không tác dụng lên khách.** Từ Q1, "Thêm khách" tạo dòng `pos_customers`
  (`registrations.js:241–252`) và bước 021 biến mọi đăng ký chờ thành khách. Nhưng `PUT /registrations/:id` (`registrations.js:285–307`) và
  `DELETE /registrations/:id` (`:313–322`) vẫn chỉ đụng `pos_registrations`; danh sách ưu tiên dòng khách (`docKhach.js:40`). Hệ quả: nhân viên
  sửa tên / ghi chú / SĐT mẹ ở màn Đăng ký (`client/src/pages/Registrations.jsx:179`) → báo "Đã cập nhật!" mà danh sách / ô tìm / hồ sơ vẫn tên
  cũ; xoá đăng ký nhập nhầm (`Registrations.jsx:161`) → khách vẫn còn, nhập lại cùng SĐT bị 400 SDT_DA_CO. Quầy không có màn sửa tên khách
  (`grep customersApi.update client/src` → 0).
  *Đề xuất của mình:* (a) `PUT` sửa đăng ký CHỜ thì cùng giao dịch sửa luôn tên / ghi chú / SĐT mẹ / quan hệ của dòng `pos_customers` cùng SĐT
  (chỉ các cột đó). (b) `DELETE` đăng ký CHỜ: xoá luôn dòng khách cùng SĐT CHỈ KHI khách đó "trắng" (không đơn, ví 0, không điểm, không gói,
  created_by là đăng ký đó); khách đã có gì thì chỉ xoá đăng ký và báo "khách đã có giao dịch, không xoá". Phần (b) đụng mục Cấm "không xoá
  dữ liệu khách đã có" nên cần bạn cho phép; không cho thì mình chỉ làm (a). Mỗi phần một ca thử đỏ trên bản hiện tại + đột biến.
- **Q7 (07.11, soát vòng 1 lỗi 2) — "Thêm khách" cho SĐT ĐÃ là khách nay bị chặn.** `registrations.js:242–255` trả 400 "Số điện thoại đã là
  khách" (ca C7b khoá). Trước đây được: tạo đăng ký kèm gói muốn mua (`Customers.jsx:115–123` luôn gửi `requested_product`). Luồng hợp lệ bị
  chặn: khách lẻ đã tạo trên App (hoặc dòng "Khách hàng" do ghi địa chỉ / chiết khấu tự tạo) tới quầy đăng ký gói. Câu trả lời Q1 không nói tới
  ca này — mình đã tự chọn chặn, sai luật (K5, chỗ chưa chốt).
  *Đề xuất của mình:* SĐT đã là khách → KHÔNG tạo khách mới, KHÔNG đổi dòng khách, vẫn ghi đăng ký chờ như trước (giữ luồng cũ); đổi ca C7b
  thành "SĐT đã là khách → 200, vẫn một dòng khách, tên khách giữ nguyên, có đăng ký chờ". Bạn chọn "giữ chặn" thì mình để như hiện tại.

## Soát độc lập — vòng 1 (07.11, agent general-purpose, chép nguyên văn)
```
KHÔNG ĐẠT

Lời thường: phần lõi của việc chạy đúng. Quầy đọc khách thẳng từ kho POS, không còn gọi SX. Quầy và App tạo khách bằng cùng một hàm, và bước chép lần cuối chỉ thêm khách còn thiếu. Mình chạy lại: thu_KHACHAPP1 68/68, thu_KHO1 112/112, thu_GIOVN1 61/61; dot_bien.py đối chứng xanh, 30/30 đột biến BẮT. Nhưng còn một lỗi thật trên màn đang dùng: màn "Đăng ký" (sửa / xoá) nay không còn tác dụng lên khách. Ngoài ra có hai bài thử có lỗ, và một chỗ chặn mới chưa hỏi chủ quán.

LỖI TÌM ĐƯỢC:
1. server/routes/registrations.js:285–307 (PUT /:id) và :313–322 (DELETE /:id) — K4 (bỏ sót đường song song) + K5 (chặn nhầm luồng hợp lệ).
   - Q1 làm POST /registrations (dòng 241–252) tạo thêm dòng pos_customers. Bước 021 cũng biến mọi đăng ký đang chờ thành khách. Nhưng sửa / xoá đăng ký vẫn chỉ đụng pos_registrations.
   - docKhach.js:40 cho dòng khách thắng dòng đăng ký. Hệ quả:
     (a) Nhân viên sửa tên / ghi chú / SĐT mẹ ở màn Đăng ký (client/src/pages/Registrations.jsx:179, App.jsx:67): báo "Đã cập nhật!", nhưng danh sách khách, ô tìm và hồ sơ vẫn hiện tên cũ.
     (b) Xoá một đăng ký nhập nhầm (Registrations.jsx:161): dòng khách còn mãi, vì client không có đường nào xoá hay sửa tên khách (`customersApi.update` không được gọi ở đâu). Nhập lại cùng SĐT thì nhận 400 SDT_DA_CO.
   - Trước khi vá, hai thao tác này có tác dụng vì danh sách hiện chính dòng đăng ký. Không có trong kế hoạch, không có trong Phát hiện, không có ca thử.
2. server/routes/registrations.js:242 + cong_cu/thu_KHACHAPP1.js:182–184 (ca C7b) — K5.
   - "Thêm khách" cho một SĐT đã là khách nay trả 400 "Số điện thoại đã là khách". Trước đây được phép: tạo đăng ký kèm requested_product, rồi xuất CSV sang SX.
   - Luồng hợp lệ bị chặn: khách lẻ đã tạo trên App (hoặc dòng "Khách hàng" do PUT address/discount tự chèn) đến quầy đăng ký gói Nước ép. Customers.jsx:115–123 luôn gửi requested_product.
   - Câu trả lời Q1 không nói tới trường hợp này. Máy tự chọn chặn, rồi khoá lựa chọn đó bằng ca C7b và đột biến VS-DK-TRUNG-VAN-GHI. Đây là chỗ chưa chốt: phải hỏi, không tự quyết.
3. cong_cu/thu_KHACHAPP1.js:143 (ca C3) — K3 (ca xanh oan).
   - Vế "App đăng nhập đúng khách đó" viết `Number(a.j.khach?.id ?? id) === Number(id)`.
   - Mà hoSo (server/routes/kh/index.js:34) không trả `id`, nên vế này luôn rút về `id === id`: đúng với mọi code.
   - Phần đó của nghiệm thu C ("bên kia nhận đúng khách") chưa thật sự được kiểm. Cách sửa: so `a.j.khach.sdt` / `ten` với dòng trong kho, hoặc giải mã token ra khachId.
4. cong_cu/thu_KHO1.js:249–258 (B1 / B2 / B1c sửa theo Q5) — K3, nới phép.
   - Tập bước "được HOÃN" sinh ra từ chính file đang thử: bước nào xuất `truoc` thì được miễn (khuôn TU-CHAY-5).
   - Nếu một bước sau này (vd 019) lỡ thêm `truoc` luôn trả `{hoan}`, bước đó không bao giờ chạy mà B1 / B2 vẫn xanh. B1c chỉ đòi 020 có mặt trong tập, không đòi tập bằng đúng {020}.
   - Đúng chữ chủ quán duyệt, nhưng còn lỗ. Vá một dòng: kiểm thêm `tepTruoc` bằng đúng `['020_chep_khach_sx.js']`.
5. Hồ sơ sai so với code — K1:
   - viec/KHACH-APP-1/trang_thai.md:67 ghi "PUT address/discount … Ngoài nghiệm thu C → để nguyên": code đã chuyển sang taoKhach (customers-v2.js:23–27).
   - trang_thai.md:69 ghi "không cấp QR cho dòng cũ — cần thì mở việc riêng": bước 021 đã cấp.
   - ke_hoach.md:108 ghi "POST /:id/children — KHÔNG chuyển, giữ nguyên": code đã chuyển (customers.js:503+, ca K2c, đột biến BV-NHAN-RIENG-QR). Có thể hiểu là theo lời chủ quán "MỘT hàm cho mọi đường", nhưng kế hoạch chưa sửa, cũng không ghi là lệch kế hoạch.

NGHI NGỜ:
- Mất cột gói SX: docKhach.js:36 luôn trả `subscriptions: []`. Màn Khách hàng (Customers.jsx:451, 792) nay mất cột gói SX (sản phẩm / nhóm / số chu kỳ) cho mọi khách gói. Kế hoạch có ghi `subscriptions:[]`, nhưng chưa có Phát hiện nào nói rõ màn mất thông tin này. Bảng có sẵn cột sx_product / sx_group_name / sx_end_date để ghép.
- Trường tiền tin client gửi: không có cái nào MỚI do việc này. Có một chỗ CŨ đáng ghi Phát hiện vì việc này đổi nguồn của parent_phone:
  - orders.js:635 và 801–816 trừ ví mẹ theo `parent_phone` do client gửi. Không đối chiếu pos_customers.parent_phone của khách.
  - POST /customers (chỉ cần authenticate) và POST /registrations nhận parent_phone tuỳ ý qua taoKhach.
  - Vùng ví chưa rà theo CLAUDE.md §8, nên không kết luận.
- Hiệu năng: motKhach (customers-v2.js:20) và /search (dòng 42) đọc TOÀN BỘ năm nguồn (khách, đăng ký, ví, điểm, hạng) cho mỗi lần tra một SĐT. Kế hoạch PA A1 có tham số `{ phone }` nhưng đã bỏ. Không sai; trên Turso có thể chậm khi đông khách. Chưa đo.
- Khởi động máy: bước 020 `truoc` chờ SX tới 8 s (SX_TIMEOUT_MS) ở MỖI lần khởi động Render cho tới khi chép xong. Không hỏng, nhưng khởi động chậm hơn. SX hợp lệ mà có 0 khách thì bước HOÃN mãi.
- Chữ báo lỗi: registrations.js:254 trả "SĐT không hợp lệ" cho mọi `loi`, kể cả TEN_TRONG. Hiện nhánh này không chạy tới vì dòng 230 đã chặn tên trống.

NGHIỆM THU: 13/15 mục có bằng chứng · mục thiếu: A (một phần), C (một phần).
- A — đủ, trừ một vế: docKhach.js; bốn đường ở customers-v2.js:20, 42, 58; ca A1, A3–A6, A11 (SX = 0 lượt), A12, A14. Vế "giữ nguyên dạng trả ra" chỉ kiểm khoá của DANH SÁCH (A12). /search, /:phone, /:phone/full không có ca; mình đọc docKhach.js:34–44 thấy là tập trùm khoá cũ.
- B — có: 020 / 021; ca B1, B1b–B1e, B2, B3, B3b, B3c, B4, B5; thu_KHO1 B1c cho trường hợp SX không khoá; ke_hoach mục "Chủ quán đối chiếu".
- C — đủ, trừ một vế: ca C1, C2, C2b, C4, C4b, C5, C6, K2, K2c. Vế "hai đường cùng lúc → bên kia nhận đúng khách" ở C3 tự đúng (lỗi 3).
- D — có: C1 so cột; vòng ds / loi gồm A1–A5, A9b; A8 tên không bị đè; B1b + B2 chạy hai lần không đổi gì.
- K5 — có: `git diff 9a49cdf^ HEAD --stat` không đụng client/, sync.js, routes/kh/; A13 / A1b cho số dư, điểm, hạng; thu_HOPDONG_KH / thu_KHSDT1 theo lời phiên chính (mình không chạy).
- Q1 có (C7, A6b, B6b) · Q2 có (C1, K2b) · Q3 có (A14) · Q4 có (A2j, đỏ trên gốc) · Q5 có (B1, B2, B1c).
- Phát hiện chủ quán chốt — có cả năm: người nhận không SĐT (K2, K2d) · PUT address / discount qua hàm chung (C8) · cấp QR ô trống (B6, B6c) · HOÃN tách khỏi bước NÉM (B3, B7) · nhãn SX để sau (client không đổi).

CHƯA SOÁT ĐƯỢC:
- Không chạy `npm test` / `--day-du` / `tu_chay/cong.js` (theo lệnh). Không xác nhận được bánh cóc NGUONG_ROUTE_GHI_KHONG_LOIGHI = 49 bằng số đếm thật.
- Không chạy được 020 trên Turso thật: giao dịch ghi và cách đua thật (bài C3 / C4 chạy trên file libsql cục bộ, ghi có thể bị xếp hàng).
- Không biết SX thật trả dạng gì và bao nhiêu khách.
- Không biết bảng pos_customers trên production có ràng buộc UNIQUE ở qr_code không: bảng có thể có từ trước khi thêm UNIQUE. Lời chú thích ở khachMoi.js "trùng QR ném lỗi thật" dựa vào ràng buộc này.
- Không thử tay trên giao diện.

BÀI HỌC:
- KHOÁ: đổi một đường TẠO cho một đối tượng (Q1: đăng ký → khách thật) thì phải grep mọi route SỬA / XOÁ của cùng đối tượng, mỗi route một ca thử. Thêm vào K4 cạnh "gắn cổng một khoản hoàn → mọi khoản hoàn khác".
- KHOÁ: ca so định danh không được có nhánh `?? giá_trị_mong_đợi`. Phải ghi câu kiểm vào E12/E13: thiếu trường thì ca ĐỎ.
- NGUYÊN TẮC: tập miễn trừ trong bài cũ (bước được HOÃN) phải là danh sách cố định có tên trong bài thử, không sinh ra từ file đang sửa (mở rộng TU-CHAY-5 sang danh sách trắng).
- NGUYÊN TẮC: phép chặn mới mà câu trả lời của chủ quán không nhắc tới (C7b) là "chỗ chưa chốt": ghi Câu hỏi trước khi khoá bằng ca thử và đột biến.
```
Xử lý vòng sửa 1: lỗi 3 → ca C3 (commit 2681286) + đột biến VS-APP-SAI-KHACH BẮT; lỗi 4 → B1c tập cố định + VS-BUOC-KHAC-HOAN BẮT; lỗi 5 → sửa
`trang_thai.md` Phát hiện (2 dòng) + `ke_hoach.md` ghi lệch kế hoạch POST /:id/children. Lỗi 1, 2 → Q6, Q7 (chờ chủ quán).

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
- (soát vòng 1) `docKhach.js` trả `subscriptions: []` cho mọi khách → màn Khách hàng (`Customers.jsx:451, 792`) mất cột gói SX (sản phẩm /
  nhóm / chu kỳ). Kế hoạch đã ghi `subscriptions:[]` nhưng chưa nói màn mất thông tin này. Bảng có cột `sx_product`, `sx_group_name`,
  `sx_end_date` để ghép — chủ quán xem có cần không (giao diện sau hoặc thêm vào Q của việc này).
- (soát vòng 1, có SẴN trước việc này) `orders.js:635, 801–816` trừ ví mẹ theo `parent_phone` client gửi, không đối chiếu
  `pos_customers.parent_phone` — vùng ví chưa rà (CLAUDE.md §8), ngoài Phạm vi.
- (soát vòng 1) `motKhach` / `/search` đọc toàn bộ khách + ví + điểm + hạng cho một lần tra — đúng nhưng có thể chậm trên Turso khi đông khách; chưa đo.
- (soát vòng 1) Bước 020 chờ SX tối đa 8 s mỗi lần khởi động cho tới khi chép xong; SX hợp lệ mà 0 khách thì HOÃN mãi (đúng nghiệm thu B,
  ghi để chủ quán biết khởi động Render chậm hơn tới lúc đó).
- `POST /customers` thêm người nhận không SĐT (`customers.js:389`, `childPhone = null`) đụng `phone NOT NULL` (`database.js:86`) → 500. Hàm tạo
  chung sẽ chỉ nhận người nhận có SĐT hợp lệ; người nhận không SĐT bỏ qua như người nhận trùng SĐT (dòng 398) — hỏi nếu muốn khác.
- `PUT /v2/customers/:phone/address` và `/discount` (`customers-v2.js:315, 355`) tự chèn khách tên "Khách hàng" khi chưa có — đường tạo khách
  thứ ba, khác cột mặc định, không QR. *Cập nhật:* chủ quán chốt 07.11 đi qua hàm chung — đã chuyển sang `taoKhach` (ca C8).
- Khách cũ chép từ bộ đệm SX (`cacheCustomersToLocal`) có `qr_code` NULL → quét QR không ra họ. Bước chép lần cuối chỉ THÊM khách thiếu (có QR);
  không ghi đè dòng cũ. *Cập nhật:* chủ quán chốt 07.11 cấp QR ô trống — bước 021 đã làm (ca B6, B6c).
- Màn quầy vẫn hiện nhãn "SX" / "Đã đồng bộ" cho mọi khách (`CustomerSearch.jsx:306`, `Customers.jsx:298`) vì dạng trả ra giữ `source: 'sx'`,
  `is_synced: true` (phiếu: giữ nguyên dạng, client Cấm). Đổi nhãn thuộc việc giao diện sau.
- `orders.js:818` lấy tên mẹ từ `pos_registrations` (không từ `pos_customers`) để ghi nhật ký — ngoài Phạm vi.
- `kiem_tra_truoc_khi_giao.js:547` chú thích còn nhắc `fetchSXCustomers` — sửa chú thích cùng lúc bỏ hàm (K1: chú thích là khẳng định).
- Kiểm sau bước 3 (07.11): kho mở NÔNG → `thu_BH2.js` G1 đỏ `bad revision 'cbbb809..HEAD'` (không phải lỗi code). Chạy
  `git fetch -q --unshallow origin viec/KHACH-APP-1` (chỉ tải lịch sử) → `npm test` PASS 100 · FAIL 0 · CẢNH BÁO 2. Hai cảnh báo có SẴN trên
  code gốc (nhánh chưa đổi code): route GET có lệnh ghi (3: packages.js:195, products.js:66, sync.js:148) và route ghi không qua loiGhi đếm 54 >
  ngưỡng 50 (có `customers.js:314 POST` — việc này sẽ cho đi qua `loiGhi`). Không nới ngưỡng (K8).

## Chỗ vá → đột biến (`viec/KHACH-APP-1/dot_bien.py`, chạy `python3 viec/KHACH-APP-1/dot_bien.py` — đối chứng 68/68 + 112/112 xanh, 32/32 BẮT)
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
| (bài) C3 App nhận đúng khách khi đua | VS-APP-SAI-KHACH (C3) |
| (bài) thu_KHO1 tập miễn HOÃN cố định | VS-BUOC-KHAC-HOAN (thu_KHO1 B1c) |

Tên đột biến: BV-DOC-SX-DANH-SACH, BV-DOC-SX-TIM, BV-DOC-SX-HO-SO, VS-DOC-CHI-ACTIVE, VS-DOC-LO-BI-MAT, VS-DOC-DANG-KY-DE-KHACH,
VS-DOC-DIEM-HET-HAN, VS-DOC-SO-DU-ME, BV-DOC-XUNG-HO, BV-TAO-MAC-DINH, BV-TAO-QR-KHONG-KIEM, BV-TAO-TRUNG-NGOAI-CAU, VS-QUAY-TRUNG-SAI-MA,
BV-QUAY-MAC-DINH-CU, BV-APP-TAO-RIENG, BV-NHAN-RIENG-QR, BV-DK-KHONG-TAO, VS-DK-TRUNG-VAN-GHI, BV-V2-CHEN-RIENG, BV-HOAN, VS-NEM-THANH-HOAN,
VS-HOAN-GOI-LAI-SX, VS-CHEP-GHI-DE, BV-CHEP-SAO-LUU, BV-CHEP-NHAT-KY, VS-CHEP-RONG-LA-XONG, VS-021-DOI-COT, BV-021-DANG-KY,
VS-021-CHEP-DA-XUAT, BV-021-CAP-QR, VS-APP-SAI-KHACH, VS-BUOC-KHAC-HOAN.

## Ghi chú làm tiếp (07.11)
- Bộ chạy nâng cấp: HOÃN do bước TỰ trả về qua `truoc()` — gọi NGOÀI giao dịch vì giao dịch ghi Turso (`database.js` beginTransaction →
  `db.transaction("write")`) không nên mở trong lúc chờ SX (tới 8 s). Bước ném lỗi vẫn rollback + dừng + `hong` (ca B7 khoá).
- Phần chép không cần SX (đăng ký chờ + cấp QR ô trống) tách thành bước 021 để chạy cả khi 020 HOÃN (Replit không có SX).
- Bánh cóc `NGUONG_ROUTE_GHI_KHONG_LOIGHI` 50 → 49: bộ kiểm báo đếm 49 sau khi 5 route ghi khách đi qua `loiGhi` (được phép HẠ).
- `thu_GIOVN1` A2j: bước 020 nạp lúc khởi động TRƯỚC SX giả của bài → bài xoá bộ đệm `require` của 020 rồi chạy khung lại (chỉ sửa bài).
- `thu_GIOVN1` M5 (phép tĩnh giờ ghi) báo `khachMoi.js` INSERT thiếu `created_at` khi danh sách cột sinh động → viết cột ra hẳn (K8: phép đúng).
