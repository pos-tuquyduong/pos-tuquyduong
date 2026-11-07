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

## Bước 1 — lần làm tiếp 3 (07.11.2026, sau khi chủ quán trả lời Q6, Q7)
- nhánh `viec/KHACH-APP-1`, cây sạch; `git rev-parse --short HEAD FETCH_HEAD`: HEAD `8baeca4` · FETCH_HEAD `8baeca4` (bằng nhau → không kéo).
- `git log --oneline -3`:
  ```
  8baeca4 KHACH-APP-1: soat vong 1 KHONG DAT - vong sua 1 + cau hoi Q6, Q7 (cho chu quan)
  2681286 KHACH-APP-1: vong sua 1 - ca C3 so sdt/ten (bo ??), thu_KHO1 B1c tap mien HOAN co dinh; dot bien VS-APP-SAI-KHACH, VS-BUOC-KHAC-HOAN
  ad98cdd KHACH-APP-1: bang chung do thu_KHO1 (Q5) + trang thai sau npm test
  ```
- Kho mở NÔNG lại → `thu_BH2.js` G1 đỏ `bad revision 'cbbb809..HEAD'`; chạy `git fetch -q --unshallow origin viec/KHACH-APP-1` → `npm test` PASS 101 · FAIL 0.

## Đang ở bước
XONG. Soát vòng 3 chỉ còn lỗi NHẸ → vòng sửa 4 (LUAT §6.5, chat soát thay); soát bảo mật ĐẠT; báo cáo 7 mục + bài học ở cuối file.

## Câu hỏi
(không còn câu nào mở)

## Câu hỏi đã trả lời (chủ quán 07.11 — lệnh làm tiếp sau 8baeca4)
- **Q6 trả lời:** (a) ĐỒNG Ý. (b) ĐỒNG Ý kèm điều kiện: chỉ xoá khách khi khách còn trắng (không đơn, ví 0, không điểm, không gói, không
  giao dịch ví) VÀ dòng khách do chính đăng ký đó tạo — khách App / khách có từ trước KHÔNG xoá, chỉ xoá đăng ký; xoá khách chỉ QUẢN LÝ TRỞ
  LÊN (nhân viên xoá đăng ký thì khách giữ nguyên); mỗi lần xoá khách ghi nhật ký ai / lúc nào / SĐT / tên / lý do. → đã làm (ca R1–R5).
- **Q7 trả lời:** GIỮ CHẶN — khách đã có tài khoản thì tìm ở màn Bán hàng và bán gói như bán món; "Thêm khách" SĐT đã có không lưu gì, báo
  "Khách đã có tài khoản — tìm khách ở màn Bán hàng để bán gói", 409 mã riêng (không 500). → đã làm (ca C7b: 409 `KHACH_DA_CO_TAI_KHOAN`).
- **Chat soát:** đổi `021_chep_dang_ky_qr.js` → `022_chep_dang_ky_qr.js` (GIAO-1 giữ số 021; hai file cùng số → bộ chạy lặng lẽ bỏ qua
  file sau). → đã đổi file, bảng sao lưu `_sao_luu_022_pos_customers`, chú thích khachMoi.js, bài thử (B3b, B6, B6d, B6e), tên đột biến
  `*-022-*`; thêm ca R6 (không hai file cùng số).
Nội dung câu hỏi gốc:
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

## Soát độc lập — vòng 3 (07.11, agent general-purpose, chép nguyên văn)
```
Cả năm lỗi vòng 2 đã được sửa thật, và mình đã tự kiểm lại. thu_KHACHAPP1 99/99. dot_bien.py 52/52 BẮT, có đối chứng xanh. npm test PASS 102 · FAIL 0, cảnh báo duy nhất là cái có sẵn: route GET có lệnh ghi ở packages.js:195, products.js:66, sync.js:148. Bánh cóc in "= 47 đúng ngưỡng". Bài mới ĐỎ trên 35e5c5d7 đúng ở C7d và R2d (mình chạy lại `--goc 35e5c5d7`: 97/99).
Còn hai lỗ nhỏ trong bài thử: mình tự cài 10 đột biến, 3 cái lọt, trong đó 2 cái đúng vào phần vừa sửa. Thêm hai câu trong hồ sơ đã cũ. Tất cả đều NHẸ, không đụng tiền / ví / điểm. Theo LUAT_XAY_APP §6.5, đây là trường hợp làm vòng sửa 4 ngay trong phiếu, không cần hỏi chủ quán.

KHÔNG ĐẠT (chỉ còn lỗi NHẸ)

LỖI TÌM ĐƯỢC:
1. server/routes/registrations.js:271 — nhánh "đã có đăng ký nhưng CHƯA là khách → 400 SDT_DA_DANG_KY (câu cũ)" không có ca nào giữ. Đột biến của mình S-Q7-LUON-TRUNG (đổi `{ daDangKy: true }` thành `{ trung: true }`, tức luôn trả 409) → SỐNG, bài xanh trọn. `grep -rn "SDT_DA_DANG_KY\|đã được đăng ký" cong_cu/` → 0 chỗ. Dòng 270 nói rõ là cố ý giữ câu cũ cho trường hợp này, vậy mà không có ca "phải KHÔNG bị chặn bằng 409". Trường hợp này còn gặp được: đăng ký đã xuất mà khách chưa chép về (020 HOÃN), đăng ký do orders.js:1166 tạo. — K3 / K5 — NHẸ.
2. cong_cu/thu_KHACHAPP1.js:246–247 (ca R2d) — chỉ kiểm hai thứ: không có `pin_code` / `password` và không có hai chuỗi đã cài. Không so BẰNG danh sách trắng COT_NHAT_KY_KHACH (registrations.js:41–42). Đột biến S-NK-THEM-EMAIL (thêm 'email', 'pin_sai', 'pin_khoa_den' vào danh sách trắng) → SỐNG. Cách sửa: so `Object.keys(ct.khach)` BẰNG đúng danh sách. — K3 (danh sách trắng phải so bằng — LUAT §6.7) — NHẸ.
3. viec/KHACH-APP-1/trang_thai.md:310 — vẫn ghi nhật ký xoá chép "khach: cả dòng khách đã xoá". Đây đúng là điều vòng 2b vừa sửa: nay chỉ chép cột danh sách trắng (registrations.js:363–364). — K1 / K4 (sửa một khẳng định thì grep cả hồ sơ) — NHẸ.
4. viec/KHACH-APP-1/trang_thai.md:292 — "*Cập nhật:* … bước 021 đã làm (ca B6, B6c)". Câu này nói về trạng thái hiện tại, không phải lời trích lịch sử; file thật là 022. Vòng 2 chỉ sửa :380. — K4 — NHẸ.

NGHI NGỜ:
- server/routes/orders.js:1150–1172: `is_new_customer` ghi một dòng `pos_registrations` pending nhưng KHÔNG gọi taoKhach. Đây là đường tạo khách thứ hai bên cạnh POST /registrations (Q1), và chưa có trong Phát hiện. Hiện quầy gần như không đi vào nhánh này:
  - CustomerSearch.jsx:224–253 gọi /registrations trước, nên ở orders.js nhánh rơi vào UPDATE ghi chú.
  - CustomerInput.jsx:117 không file nào import (`grep -rln CustomerInput client/src` chỉ ra chính nó).
  - Sau khi 022 đã chạy, đăng ký mới tạo theo đường này không bao giờ thành khách thật.
  - orders.js ngoài Phạm vi → nên ghi Phát hiện.
- server/routes/customers.js:339 và :526: SĐT đã là khách → 400 `SDT_DA_CO`; registrations.js:280 cùng tình huống → 409 `KHACH_DA_CO_TAI_KHOAN`. LUAT §2 "cùng tình huống → cùng code". Không màn nào gọi POST /customers, và Q7 chỉ nói "Thêm khách" → để chủ quán biết, chưa phải lỗi.
- registrations.js:37 (vế `total_topup` / `total_spent`): đột biến S-XOA-BO-VI → SỐNG, vì DAU_VET `pos_balance_transactions` đã che. Chỉ dữ liệu cũ (ví có total_topup mà không có giao dịch) mới lọt. NHẸ.
- 020_chep_khach_sx.js:31–33: `phone` của SX không phải chuỗi (số) → taoKhach trả `loi` → bị đếm `bo_qua`, không chép. Chưa biết SX thật trả dạng gì.
- 020 chép trong MỘT giao dịch Turso, mỗi khách 2–3 câu qua mạng (sinhQrKhongTrung + INSERT + SELECT). Hàng trăm khách thì giao dịch dài; chưa đo giới hạn giao dịch tương tác của Turso.
- Vẫn còn từ vòng 1–2, đã có Phát hiện:
  - `subscriptions: []` (docKhach.js:68);
  - motKhach đọc toàn bộ bảng (customers-v2.js:20);
  - 020 chờ SX tới 8 s mỗi lần khởi động (database.js:39 chạy trước khi server nghe) và HOÃN mãi khi SX tắt hẳn (KHO-3);
  - PUT /registrations ghi đè tên khách App (registrations.js:333–334).

NGHIỆM THU:    19/19 mục có bằng chứng · mục thiếu: không
- A: A1, A1b, A3–A6b, A9, A9b, A11–A14 + A12c mới (thu_KHACHAPP1.js:367–370); customers-v2.js:20, 42, 58 gọi docKhach.
- B: B1–B7, B3b, B3c, B6–B6e; chay.js:36–43.
- C: C0–C6b, C4b, C5b, K2–K2d, C8.
- D: C1 so cột; vòng ds / loi; A8, A8b; B2, B6e.
- K5: diff cả nhánh không đụng client/, sync.js, routes/kh, HOP_DONG_API_KH.md (đã xem `git diff --stat 9a49cdf^ HEAD`); docKhach.js:52–54 dùng cùng câu điểm và hangNhieuKhach như cũ.
- Q1: C7, A6b, B6b · Q2: C1 · Q3: A14 · Q4: thu_GIOVN1 A2j (xanh trong npm test) · Q5: thu_KHO1 B1, B1c, B2 (xanh).
- Q6a: R1–R1d · Q6b: R2, R2b, R2c, R3, R3b, R4 ×12, R5–R5d.
- Q7: C7b, C7d (mới; ĐỎ trên 35e5c5d7 → mình đã chạy lại).
- Phát hiện chủ quán chốt ×5: K2d · C8 · B6, B6c · B3, B7 · nhãn SX để sau (không đụng client).
- Đổi 021 → 022: R6, B3b, B6.
- Lỗi vòng 2 đã sửa thật, đột biến vòng 2b BẮT:
  - (1) C7d / VS-DK-DA-DANG-KY-CAU-CU;
  - (2) R2d / BV-XOA-LO-PIN;
  - (3) kiem_tra_truoc_khi_giao.js:809 có chayBaiThat, npm test in "thu_KHACHAPP1.js xanh";
  - (4) kiem_tra_truoc_khi_giao.js:549 = 47, bộ kiểm in "đúng ngưỡng";
  - (5) :380 đã sửa, còn :292 (lỗi 4 ở trên).
- Từng mục theo đề:
  - Mục 1 K3: bài thử hành vi qua HTTP + dữ liệu thật; marker suông không làm nó xanh được. Có hai lỗ ở trên.
  - Mục 5 tiền: không có trường tiền nào server tin client. DELETE kiểm ví ngay trong câu xoá, trong một giao dịch.
  - Mục 6 P1: không đổi client/src.
  - Mục 8 đơn giản:
    - registrations.js:271 nhồi await + ternary + spread vào một dòng → tách `const daLaKhach = await tx.queryOne(…)` rồi chọn.
    - COT_NHAT_KY_KHACH (danh sách trắng) và donThu.js:31 COT_BI_MAT (danh sách đen) là hai cách cho cùng một luật "nhật ký không lộ bí mật". donThu.js ngoài Phạm vi nên chấp nhận được, nên ghi Phát hiện gom một hàm che chung vào utils.
    - Không có tính năng tiền mới → không cần quy tắc đối soát.

CHƯA SOÁT ĐƯỢC:
- `tu_chay/cong.js`: không chạy được — kho không có origin/main (npm test cũng in "thu_cong.js: không xác định được gốc chung với origin/main").
- `--day-du`: không chạy; không đổi client nên P1 không áp.
- Không xem được main: chưa biết số 020 / 022 có bị việc khác (GIAO-1, NAP-1) chiếm không, chưa thử gộp chay.js.
- Đua / giao dịch trên Turso thật; SX thật trả dạng gì.
- Không thử tay màn Đăng ký và "Tạo nhanh" ở màn Bán hàng.

BÀI HỌC:
- KHOÁ: ca thử cho danh sách trắng (cột nhật ký, khoá trả ra) phải so BẰNG `Object.keys`, không chỉ "không có X". Đột biến chuẩn đi kèm: "thêm một cột vào danh sách trắng" phải BẮT.
- KHOÁ: vá thêm một vị từ rẽ hai nhánh (registrations.js:271) thì CẢ HAI nhánh có ca + đột biến "đổi nhánh này thành nhánh kia". Nhánh "giữ như cũ" là luồng phải KHÔNG bị chặn (K5).
- NGUYÊN TẮC (K4, KHUON_LOI.md): sửa hành vi mà hồ sơ đã mô tả (vd "khach: cả dòng") thì grep trang_thai / ke_hoach tìm câu mô tả cũ trong cùng commit. Vòng 2b sửa code mà sót :310.
- NGUYÊN TẮC (K4): "một hàm tạo khách" thì grep `INSERT INTO pos_registrations` cùng `INSERT INTO pos_customers`. Đăng ký chờ cũng là một đường sinh khách (orders.js:1166).
```
Xử lý — vòng sửa 4 (LUAT §6.5: lần soát cuối chỉ còn lỗi NHẸ → làm luôn, chat soát thay): lỗi 1 → ca C7e + đột biến VS-DK-LUON-409, tách
dòng 271 theo mục 8 · lỗi 2 → R2d so BẰNG danh sách cột + đột biến VS-NK-THEM-COT · lỗi 3, 4 → sửa hai dòng hồ sơ. Nghi ngờ → Phát hiện.

## Soát độc lập — vòng 2 (07.11, agent general-purpose, chép nguyên văn)
```
Phần chính của việc chạy đúng. Quầy đọc khách thẳng từ POS, các bước chép làm đúng, và sửa / xoá đăng ký làm đúng điều chủ quán dặn ở Q6. Mình chạy lại `npm test`: PASS 101 · FAIL 0 · cảnh báo 1 (có sẵn từ trước). Thêm 9 đột biến riêng của mình: 7 bị bắt, 2 lọt. Nhưng còn hai lỗi thật nên chưa đạt. (1) Câu chủ quán chốt ở Q7 không hiện trong trường hợp hay gặp nhất: SĐT đã từng "Thêm khách" thì vẫn nhận câu cũ 400. (2) Nhật ký xoá khách chép nguyên dòng khách, kể cả mã băm PIN, mà mọi nhân viên đọc được. Ngoài ra bài thử của việc chưa được nối vào bộ kiểm, nên sau khi gộp không ai chạy lại nó.

KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
1. server/routes/registrations.js:262–267, 273 — Q7 làm chưa đủ. Code dùng HAI phép thử cho cùng một tình huống "SĐT đã có":
   - Có đăng ký → 400 SDT_DA_DANG_KY "SĐT đã được đăng ký".
   - Chỉ có khách → 409 KHACH_DA_CO_TAI_KHOAN.
   pos_registrations.phone là UNIQUE (database.js:527). Mọi khách tạo bằng "Thêm khách" (dòng 268) và mọi khách do bước 022 tạo
   (022_chep_dang_ky_qr.js:299–307) đều có kèm một dòng đăng ký. Thêm lại SĐT đó → ON CONFLICT → changes 0 → câu 400 cũ, không phải câu
   chủ quán chốt. Màn Bán hàng (CustomerSearch.jsx:226 "Tạo nhanh") hiện câu cũ cho nhân viên. Ca C7b (thu_KHACHAPP1.js:185–191) chỉ
   thử SĐT_Q, là khách KHÔNG có đăng ký, nên không phủ trường hợp này. Thiếu ca: "Thêm khách" lần hai cho SĐT vừa thêm → 409 đúng câu.
   — K4 (hai vị từ cho một việc, BAN-HANG-1) + K3 (ca không phủ luồng chính).
2. server/routes/registrations.js:358–359 — nhật ký 'xoa_khach' ghi `khach: kh` = SELECT * FROM pos_customers. Dòng đó gồm pin_code
   (bcrypt của PIN 4 số — dò ngược 10 000 khả năng), password, pin_sai, pin_khoa_den. Nhật ký này mọi nhân viên đã đăng nhập đọc được
   qua GET /sync/logs (sync.js:345–364, chỉ `authenticate`).
   Kho đã có luật cho đúng chỗ này: donThu.js:26 `COT_BI_MAT = ['pin_code','password','ma_bam'] // nhật ký nhân viên đọc được
   (GET /sync/logs) — che trong bản lưu`; customers.js:19 "băm vẫn là bí mật". PIN đặt ở quầy (pinKhach.js:27–35) không để dấu vết nào
   trong DAU_VET_KHACH, nên khách "trắng" vẫn có thể đã có PIN.
   — K4 / K6 (chép cổng mà bỏ phần che cột bí mật). Bảo mật mức nhẹ – vừa.
3. kiem_tra_truoc_khi_giao.js — chưa có chayBaiThat('cong_cu/thu_KHACHAPP1.js').
   - Grep cả file: không có dòng nào nhắc thu_KHACHAPP1. Các việc gần đây đều nối bài của mình (dòng 801–808: KHO1, KHO2a/b, KHSP1,
     MANKHACH1, KHSDT1…).
   - Cổng tu_chay/cong.js:129, 327 chỉ chạy bài thử có đổi trong chính PR. Sau khi gộp, 91 ca (đọc không gọi SX, một hàm tạo khách,
     R1–R6) không còn là khoá.
   - Lời giao việc ghi "chạy qua npm test" — sai: `npm test` (package.json:9) không chạy bài này.
   — K6 / C16 "bịt bằng khoá", K1.
4. kiem_tra_truoc_khi_giao.js:549 — bánh cóc chưa hạ. Chạy bộ kiểm hôm nay in "route ghi không qua loiGhi = 47 — đã dọn bớt 2 chỗ → HẠ
   NGUONG_ROUTE_GHI_KHONG_LOIGHI xuống 47". Vòng 2 chuyển POST / PUT / DELETE /registrations sang loiGhi mà ngưỡng còn 49 → hai chỗ
   trống cho lỗi mới lọt vào. Luật cho phép hạ. — K6.
5. viec/KHACH-APP-1/trang_thai.md:267 — còn ghi "tách thành bước 021", trong khi file đã đổi thành 022. Các chỗ nhắc 021 ở :59, :83,
   :102, :117, :183 là lời trích / ghi lịch sử, chấp nhận được. — K1 / K4 (đổi tên thì grep hồ sơ).

NGHI NGỜ:
- registrations.js:23–35 DAU_VET_KHACH: 4 bảng "thêm cho chắc" (voucher, hoàn tiền, phiên thanh toán, đơn App) không có ca thử.
  Đột biến riêng của mình S-BO-VOUCHER và S-BO-PHIEN (bỏ dòng khỏi danh sách) → SỐNG (bài xanh trọn).
  Danh sách còn lệch với bảng SĐT có sẵn trong donThu.js:40–51: thiếu pos_signup_codes (claimed_phone / diem_nhan_phone),
  pos_kh_lan_thu, pos_nhat_ky_pin, pos_ngay_sinh_sua, pos_registrations.parent_phone. Năm thứ chủ quán nêu đều có ca + đột biến
  (R4, BV-XOA-BO-*, VS-XOA-BO-VI). Phần lệch hiện chỉ để lại dòng mồ côi, chưa thấy mất tiền.
- registrations.js:329–330 PUT ghi vào MỌI dòng khách cùng SĐT, kể cả khách App / khách có từ trước. Ví dụ: đăng ký chờ cũ + khách App
  → sửa đăng ký thì tên khách tự chọn trên App bị đè. Đồng thời parent_phone / relationship bị ghi bằng giá trị của đăng ký (null nếu
  đăng ký không có). Đúng chữ Q6a ("dòng pos_customers cùng SĐT"). Nhưng DELETE lại giới hạn "khách do đăng ký tạo" mà PUT không có —
  nên hỏi chủ quán xem có muốn giới hạn như vậy cho PUT không.
- registrations.js:347: lý do xoá luôn là câu mặc định, vì client (Registrations.jsx:161) không gửi ly_do và client đang Cấm sửa. Đạt
  chữ Q6b "ghi lý do" nhưng lý do không do người xoá nhập.
- registrations.js:36: "do chính đăng ký tạo" xác định gần đúng bằng created_by trùng + created_at ≥ giờ đăng ký. Khách do cùng nhân viên
  tạo bằng đường khác sau giờ đăng ký (vd nhập file SX ở sync.js) cũng thoả. Hiếm gặp.
- registrations.js:325: điều kiện `AND status IS NOT 'exported'` trong câu ghi không có ca riêng — đột biến S-PUT-BO-CHECK-STATUS SỐNG,
  vì dòng 315 đã chặn trước. Chỉ là lớp chặn đua, không sai.
- Chưa sửa từ vòng 1: docKhach.js luôn trả `subscriptions: []` (màn Khách hàng mất cột gói SX); motKhach / search đọc toàn bộ năm nguồn
  cho mỗi lần tra (customers-v2.js:20, 42); 020 `truoc` chờ SX tới SX_TIMEOUT_MS ở mỗi lần khởi động, và HOÃN mãi nếu SX trả rỗng.
- Đơn giản (mục 8): VAI_XOA_KHACH (registrations.js:22) chép lại VAI_QUAN_LY (kho/duong.js:25) / checkRole('owner','manager').
  DAU_VET_KHACH là danh sách thứ hai về "bảng có SĐT khách", song song với donThu.js, và đã lệch nhau. Gọn hơn: một danh sách chung
  trong utils + dùng chung bộ che cột bí mật của donThu. Việc không có tính năng tiền mới nên không cần quy tắc đối soát.

NGHIỆM THU:    17/19 mục có bằng chứng · mục thiếu: A (một phần), Q7 (một phần)
- A — ca A1, A1b, A3–A6b, A9, A9b, A11, A12, A12b, A13, A14 (thu_KHACHAPP1.js:328–355); customers-v2.js:20, 42, 58 gọi docKhach.
  THIẾU MỘT PHẦN: "giữ nguyên dạng trả ra" chỉ khoá danh sách (A12). /search, /:phone, /:phone/full chưa có ca khoá đủ khoá cũ —
  vòng 1 đã nêu, vòng sửa 1 không xử lý.
- B — có: B1–B7, B3b, B3c, B6–B6e; chay.js:38–42; thu_KHO1 B1 / B1c / B2.
- C — có: C1–C6, C3 đã sửa (VS-APP-SAI-KHACH), K2, K2c, C8.
- D — có: C1 so cột; vòng ds / loi; A8, A8b; B1b, B2, B6e.
- K5 — có: diff cả nhánh không đụng client/, sync.js, routes/kh/, HOP_DONG_API_KH.md.
- Q1 có (C7, A6b, B6b) · Q2 có (C1) · Q3 có (A14) · Q4 có (thu_GIOVN1 A2j) · Q5 có (thu_KHO1 B1, B1c, B2).
- Phát hiện chủ quán chốt × 5 — có: người nhận không SĐT (K2) · PUT address / discount qua taoKhach (C8) · cấp QR ô trống (B6, B6c) ·
  HOÃN ≠ ném lỗi (B3, B7) · nhãn SX để sau (không đụng client).
- Q6a — có: R1–R1d + BV-DK-SUA-KHONG-KHACH, VS-DK-SUA-MOI-KHACH.
- Q6b — có: trắng (R4 × 8, BV-XOA-BO-*, VS-XOA-BO-VI) · do đăng ký tạo (R5, R5b — đột biến riêng S-BO-CREATED_AT / S-BO-CREATED_BY đều
  BẮT) · chỉ quản lý (R3, R3b, VS-XOA-MOI-VAI) · chỉ đăng ký chờ (R5c) · nhật ký ai / lúc / SĐT / tên / lý do (R2b, BV-XOA-KHONG-NHAT-KY,
  S-LOG-KHONG-LY-DO BẮT).
- Q7 — THIẾU MỘT PHẦN (lỗi 1): chỉ đúng cho khách KHÔNG có dòng đăng ký.
- Đổi 021 → 022 — có: R6, B3b, B6; chỉ còn hồ sơ cũ (lỗi 5).
Mục 1 K3: bài ĐỎ trên gốc 37d195b (34/91) và trên 8baeca4 (77/91), theo bang_chung_do.txt:83–114 — mình không chạy lại phần gốc. Bài kiểm
hành vi qua HTTP + dữ liệu thật, không kiểm marker; marker suông không làm nó xanh được.
Mục 5 tiền: không có trường tiền mới nào server tin từ client. DELETE kiểm ví trong cùng câu xoá, cùng một giao dịch.
Mục 6 P1: không đổi client/src — không cần build.

CHƯA SOÁT ĐƯỢC:
- Không chạy `--day-du`. tu_chay/cong.js không chạy được: bộ kiểm báo "không xác định được gốc chung với origin/main" — kho này chỉ có
  nhánh viec/KHACH-APP-1, không có main.
- Không chạy lại đủ 46 đột biến của dot_bien.py. Mình chỉ chạy `npm test` (PASS 101) và 9 đột biến riêng: 7 BẮT, 2 SỐNG (đã nêu ở trên).
- Không xem được main, nên không biết số 022 có bị việc khác chiếm không, và chưa thử gộp chung với GIAO-1 / NAP-1 (cả hai cùng sửa chay.js).
- Đua và giao dịch trên Turso thật (C7c chạy trên file libsql cục bộ, lệnh ghi có thể bị xếp hàng). SX thật trả dạng gì.
- Không thử tay trên giao diện (màn Đăng ký, Tạo nhanh ở màn Bán hàng).

BÀI HỌC:
- KHOÁ: thêm phép vào bộ kiểm — mọi cong_cu/thu_*.js phải có chayBaiThat trong kiem_tra_truoc_khi_giao.js (hoặc nằm trong danh sách
  miễn có tên). Hiện còn 6 bài không nối: KHACHAPP1, HOPDONG_KH, KHQUAY1, P15QR, P16, KHUI1.
- KHOÁ: phép tĩnh — mọi INSERT vào pos_sync_logs có chép một dòng khách (SELECT * pos_customers) phải đi qua bộ che COT_BI_MAT của
  donThu.js.
- NGUYÊN TẮC (K4): câu trả lời chủ quán nói theo ĐỐI TƯỢNG ("SĐT đã là khách") thì ca thử phải phủ mọi cách đối tượng đó đang có trong
  kho: khách có / không có đăng ký, khách App, khách chép từ SX. Không chỉ một dòng mẫu.
- NGUYÊN TẮC (K4): danh sách "bảng có SĐT khách" chỉ nên có MỘT chỗ. Danh sách thứ hai viết riêng sẽ lệch (DAU_VET_KHACH so với donThu.js).
- NGUYÊN TẮC (K6): đổi route sang loiGhi thì chạy bộ kiểm và hạ bánh cóc NGAY trong cùng commit.
```
Xử lý vòng sửa 2 (soát vòng 2 — không lỗi nào đụng tiền / ví / điểm; lỗi 2 là lộ băm PIN trong nhật ký, sửa trong Phạm vi):
lỗi 1 → khi trùng đăng ký mà SĐT đã là khách thì cũng 409 KHACH_DA_CO_TAI_KHOAN (ca C7d) · lỗi 2 → nhật ký chỉ chép cột không bí mật
(danh sách trắng, ca R2d) · lỗi 3 → nối `chayBaiThat('cong_cu/thu_KHACHAPP1.js')` · lỗi 4 → hạ bánh cóc 49 → 47 · lỗi 5 → sửa dòng 021 ·
nghi ngờ "4 bảng không ca" → thêm 4 ca R4 + 4 đột biến · nghiệm thu A "dạng trả ra" → ca A12c cho /search, /:phone, /:phone/full.
Nghi ngờ PUT ghi mọi khách cùng SĐT: đúng chữ Q6a chủ quán duyệt → giữ, ghi Phát hiện.

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
- (soát vòng 3) `orders.js:1150–1172` (`is_new_customer`) ghi đăng ký chờ mà KHÔNG gọi `taoKhach` — đường sinh khách thứ hai bên cạnh
  POST /registrations; sau khi 022 đã chạy, đăng ký tạo theo đường này không thành khách thật. Màn hiện gần như không đi vào nhánh này
  (theo người soát: `CustomerSearch.jsx` gọi /registrations trước; `CustomerInput.jsx` không ai import). orders.js ngoài Phạm vi → việc sau.
- (soát vòng 3) `POST /customers` (customers.js) SĐT đã là khách → 400 `SDT_DA_CO`; "Thêm khách" → 409 `KHACH_DA_CO_TAI_KHOAN` (Q7 chỉ nói
  "Thêm khách"; không màn nào gọi POST /customers). LUAT §2 "cùng tình huống cùng code" — chủ quán xem có gộp không.
- (soát vòng 3) Điều kiện ví của xoá khách: vế `total_topup` / `total_spent` ≠ 0 không có ca riêng (giao dịch ví đã che); chỉ dữ liệu cũ
  (ví có tổng nạp mà không có dòng giao dịch) mới cần vế này.
- (soát vòng 3) Bước 020 chép trong MỘT giao dịch Turso, mỗi khách 2–3 câu qua mạng — hàng trăm khách thì giao dịch dài; chưa đo trên Turso.
  `phone` SX dạng số → bị bỏ (`bo_qua`) — chưa biết SX thật trả dạng gì.
- (soát vòng 3) Hai cách che bí mật trong nhật ký: `COT_NHAT_KY_KHACH` (danh sách trắng, registrations.js) và `COT_BI_MAT` (danh sách đen,
  donThu.js) — gom một hàm che chung vào utils → việc sau.
- (soát vòng 2) `PUT /registrations/:id` sửa MỌI dòng khách cùng SĐT (đúng chữ Q6a chủ quán duyệt), kể cả khách App / khách có từ trước
  có đăng ký chờ cũ; `parent_phone` / `relationship` lấy theo đăng ký (null nếu đăng ký để trống). DELETE thì chỉ khách do đăng ký tạo.
  Sau Q7 không tạo được đăng ký mới cho SĐT đã là khách, nên chỉ còn dữ liệu cũ rơi vào trường hợp này — chủ quán xem có muốn PUT cũng
  giới hạn "khách do đăng ký tạo" không (mình để đúng chữ Q6a).
- (soát vòng 2) `DAU_VET_KHACH` (registrations.js) là danh sách thứ hai "bảng có SĐT khách", song song `donThu.js` (ngoài Phạm vi) — chưa
  có thẻ / lượt mã nhận điểm (`pos_signup_codes`), `pos_nhat_ky_pin`, `pos_ngay_sinh_sua`, `pos_registrations.parent_phone`. Còn thiếu thì
  khách có các dấu vết đó vẫn có thể bị xoá (để lại dòng mồ côi, không mất tiền). Gom một danh sách chung vào `server/utils/` → việc sau.
- (soát vòng 2) Còn 5 bài `cong_cu/thu_*.js` không nối vào bộ kiểm (HOPDONG_KH… theo người soát) — ngoài việc này; đề xuất phép kiểm ở Bài học.
- (vòng sửa 2) Màn Đăng ký (`Registrations.jsx:160`) gọi xoá KHÔNG gửi lý do và luôn báo "Đã xóa!" → nhật ký xoá khách ghi lý do mặc định
  "Xoá đăng ký chờ nhập nhầm — khách chưa có giao dịch nào"; máy chủ đã nhận `ly_do` trong thân yêu cầu và trả `xoa_khach` + `message`
  ("Đã xoá đăng ký và khách…" / "…khách giữ nguyên") nhưng màn chưa hiện (client Cấm). Thêm ô lý do + hiện `message` → việc giao diện sau.
- (vòng sửa 2) "Khách do đăng ký tạo" so `created_at` khách ≥ `created_at` đăng ký bằng so chuỗi. Đăng ký cũ ghi bằng `CURRENT_TIMESTAMP`
  (UTC, dấu cách) so với khách giờ VN dạng T có thể lệch thứ tự quanh nửa đêm — chỉ xảy ra khi cùng người nhập; lệch về phía GIỮ khách
  khi cùng ngày (' ' < 'T'). Ghi để biết, không đổi.
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
  không ghi đè dòng cũ. *Cập nhật:* chủ quán chốt 07.11 cấp QR ô trống — bước 022 (lúc đầu số 021) đã làm (ca B6, B6c).
- Màn quầy vẫn hiện nhãn "SX" / "Đã đồng bộ" cho mọi khách (`CustomerSearch.jsx:306`, `Customers.jsx:298`) vì dạng trả ra giữ `source: 'sx'`,
  `is_synced: true` (phiếu: giữ nguyên dạng, client Cấm). Đổi nhãn thuộc việc giao diện sau.
- `orders.js:818` lấy tên mẹ từ `pos_registrations` (không từ `pos_customers`) để ghi nhật ký — ngoài Phạm vi.
- `kiem_tra_truoc_khi_giao.js:547` chú thích còn nhắc `fetchSXCustomers` — sửa chú thích cùng lúc bỏ hàm (K1: chú thích là khẳng định).
- Kiểm sau bước 3 (07.11): kho mở NÔNG → `thu_BH2.js` G1 đỏ `bad revision 'cbbb809..HEAD'` (không phải lỗi code). Chạy
  `git fetch -q --unshallow origin viec/KHACH-APP-1` (chỉ tải lịch sử) → `npm test` PASS 100 · FAIL 0 · CẢNH BÁO 2. Hai cảnh báo có SẴN trên
  code gốc (nhánh chưa đổi code): route GET có lệnh ghi (3: packages.js:195, products.js:66, sync.js:148) và route ghi không qua loiGhi đếm 54 >
  ngưỡng 50 (có `customers.js:314 POST` — việc này sẽ cho đi qua `loiGhi`). Không nới ngưỡng (K8).

## Vòng sửa 2 — cách làm (07.11)
- `POST /registrations`: ghi đăng ký TRƯỚC (`ON CONFLICT(phone) DO NOTHING` + `changes` → 400 `SDT_DA_DANG_KY`, không 500 khi đua) rồi
  `taoKhach`; khách đã có → huỷ cả giao dịch, 409 `KHACH_DA_CO_TAI_KHOAN` (Q7). Lỗi tên trống trả đúng câu "Tên không được để trống".
- `PUT /registrations/:id`: một giao dịch — sửa đăng ký (`AND status IS NOT 'exported'` trong câu ghi) + sửa `name, notes, parent_phone,
  relationship, updated_at` của dòng khách cùng SĐT (Q6a). Các cột khác của khách không đổi.
- `DELETE /registrations/:id`: một giao dịch — xoá đăng ký; rồi CHỈ KHI đăng ký đang CHỜ, người xoá `owner` / `manager`, có `created_by`:
  một câu `DELETE pos_customers` với mọi điều kiện TRONG câu (khách do đăng ký tạo: `created_by` = người nhập đăng ký và `created_at` ≥ giờ
  đăng ký; ví 0; không dòng nào ở `DAU_VET_KHACH`) → `changes = 1` thì ghi `pos_sync_logs` type `xoa_khach` (created_by = người xoá,
  created_at = getNow, details = {phone, name, ly_do, registration_id, khach: các cột danh sách trắng COT_NHAT_KY_KHACH — không băm PIN / mật khẩu (vòng sửa 2b)}). Trả `xoa_khach` + `message`.
  `DAU_VET_KHACH` thêm cho chắc (ngoài 5 thứ chủ quán nêu): thẻ hạng, voucher, hoàn tiền, phiên thanh toán, đơn App, mã đăng nhập App,
  người nhận gắn SĐT — chỉ làm hẹp lại chỗ được xoá (an toàn hơn), không xoá thêm gì.
- Nhật ký dùng bảng có sẵn `pos_sync_logs` (như `donThu.js` 'don_thu', bước 020 / 022) — không thêm bảng (phiếu: không đổi cấu trúc DB).

## Chỗ vá → đột biến (`viec/KHACH-APP-1/dot_bien.py`, chạy `python3 viec/KHACH-APP-1/dot_bien.py` — đối chứng 100/100 + 112/112 xanh, 54/54 BẮT)
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
| registrations.js SĐT đã là khách → không ghi | VS-DK-TRUNG-VAN-GHI (C7b) |
| registrations.js SĐT đã là khách → 409 KHACH_DA_CO_TAI_KHOAN (Q7) | VS-DK-TRUNG-400 (C7b) |
| registrations.js trùng đăng ký chặn trong câu ghi (đua không 500) | BV-DK-DUA-500 (C7c) |
| registrations.js PUT sửa luôn dòng khách (Q6a) | BV-DK-SUA-KHONG-KHACH (R1) |
| registrations.js PUT chỉ khách cùng SĐT | VS-DK-SUA-MOI-KHACH (R1b) |
| registrations.js DELETE xoá khách trắng (Q6b) | BV-DK-XOA-KHONG-KHACH (R2) |
| registrations.js DELETE nhật ký xoá khách | BV-XOA-KHONG-NHAT-KY (R2b) |
| registrations.js DELETE chỉ quản lý trở lên | VS-XOA-MOI-VAI (R3) |
| registrations.js DELETE chỉ đăng ký CHỜ | VS-XOA-MOI-TRANG-THAI (R5c) |
| registrations.js DELETE chỉ khách do đăng ký tạo | VS-XOA-KHACH-CUA-NGUOI-KHAC (R5) |
| registrations.js DELETE ví 0 | VS-XOA-BO-VI (R4 ví còn tiền) |
| registrations.js DELETE không đơn | BV-XOA-BO-DON (R4 đơn) |
| registrations.js DELETE không giao dịch ví | BV-XOA-BO-GD-VI (R4 giao dịch ví) |
| registrations.js DELETE không điểm | BV-XOA-BO-DIEM (R4 điểm) |
| registrations.js DELETE không gói | BV-XOA-BO-GOI (R4 gói) |
| registrations.js SĐT có đăng ký + là khách → cũng 409 (soát v2 lỗi 1) | VS-DK-DA-DANG-KY-CAU-CU (C7d) |
| registrations.js nhật ký xoá khách không chép băm PIN (soát v2 lỗi 2) | BV-XOA-LO-PIN (R2d) |
| registrations.js SĐT có đăng ký, CHƯA là khách → giữ 400 SDT_DA_DANG_KY (soát v3 lỗi 1) | VS-DK-LUON-409 (C7e) |
| registrations.js nhật ký đúng danh sách trắng cột (soát v3 lỗi 2) | VS-NK-THEM-COT (R2d) |
| registrations.js DELETE không voucher / hoàn tiền / phiên / đơn App | BV-XOA-BO-VOUCHER, BV-XOA-BO-HOAN-TIEN, BV-XOA-BO-PHIEN, BV-XOA-BO-DON-APP (R4) |
| customers-v2.js địa chỉ / ghi chú tạo qua taoKhach | BV-V2-CHEN-RIENG (C8) |
| chay.js trạng thái HOÃN | BV-HOAN (B3) |
| chay.js bước NÉM vẫn hỏng + dừng | VS-NEM-THANH-HOAN (B7) |
| chay.js bước đã chạy không gọi truoc | VS-HOAN-GOI-LAI-SX (B2) |
| 020 chỉ thêm, không ghi đè | VS-CHEP-GHI-DE (B1b) |
| 020 sao lưu | BV-CHEP-SAO-LUU (B1d) |
| 020 nhật ký trước / sau | BV-CHEP-NHAT-KY (B1e) |
| 020 SX trả rỗng → HOÃN | VS-CHEP-RONG-LA-XONG (B3c) |
| 022 chỉ điền ô QR trống, không đổi cột khác | VS-022-DOI-COT (B6) |
| 022 chép đăng ký chờ | BV-022-DANG-KY (B6b) |
| 022 chỉ đăng ký CHỜ | VS-022-CHEP-DA-XUAT (B6b) |
| 022 cấp QR | BV-022-CAP-QR (B6) |
| (bài) C3 App nhận đúng khách khi đua | VS-APP-SAI-KHACH (C3) |
| (bài) thu_KHO1 tập miễn HOÃN cố định | VS-BUOC-KHAC-HOAN (thu_KHO1 B1c) |

Tên đột biến: BV-DOC-SX-DANH-SACH, BV-DOC-SX-TIM, BV-DOC-SX-HO-SO, VS-DOC-CHI-ACTIVE, VS-DOC-LO-BI-MAT, VS-DOC-DANG-KY-DE-KHACH,
VS-DOC-DIEM-HET-HAN, VS-DOC-SO-DU-ME, BV-DOC-XUNG-HO, BV-TAO-MAC-DINH, BV-TAO-QR-KHONG-KIEM, BV-TAO-TRUNG-NGOAI-CAU, VS-QUAY-TRUNG-SAI-MA,
BV-QUAY-MAC-DINH-CU, BV-APP-TAO-RIENG, BV-NHAN-RIENG-QR, BV-DK-KHONG-TAO, VS-DK-TRUNG-VAN-GHI, BV-V2-CHEN-RIENG, BV-HOAN, VS-NEM-THANH-HOAN,
VS-HOAN-GOI-LAI-SX, VS-CHEP-GHI-DE, BV-CHEP-SAO-LUU, BV-CHEP-NHAT-KY, VS-CHEP-RONG-LA-XONG, VS-022-DOI-COT, BV-022-DANG-KY,
VS-022-CHEP-DA-XUAT, BV-022-CAP-QR, VS-APP-SAI-KHACH, VS-BUOC-KHAC-HOAN, VS-DK-TRUNG-400, BV-DK-DUA-500, BV-DK-SUA-KHONG-KHACH,
VS-DK-SUA-MOI-KHACH, BV-DK-XOA-KHONG-KHACH, VS-XOA-MOI-VAI, VS-XOA-MOI-TRANG-THAI, BV-XOA-KHONG-NHAT-KY, VS-XOA-KHACH-CUA-NGUOI-KHAC,
VS-XOA-BO-VI, BV-XOA-BO-DON, BV-XOA-BO-GD-VI, BV-XOA-BO-DIEM, BV-XOA-BO-GOI, VS-DK-DA-DANG-KY-CAU-CU, BV-XOA-LO-PIN, BV-XOA-BO-VOUCHER,
BV-XOA-BO-HOAN-TIEN, BV-XOA-BO-PHIEN, BV-XOA-BO-DON-APP, VS-DK-LUON-409, VS-NK-THEM-COT.

## Ghi chú làm tiếp (07.11)
- Bộ chạy nâng cấp: HOÃN do bước TỰ trả về qua `truoc()` — gọi NGOÀI giao dịch vì giao dịch ghi Turso (`database.js` beginTransaction →
  `db.transaction("write")`) không nên mở trong lúc chờ SX (tới 8 s). Bước ném lỗi vẫn rollback + dừng + `hong` (ca B7 khoá).
- Phần chép không cần SX (đăng ký chờ + cấp QR ô trống) tách thành bước 022 (lúc đầu đánh số 021 — đổi vì GIAO-1 giữ 021) để chạy cả khi 020 HOÃN (Replit không có SX).
- Bánh cóc `NGUONG_ROUTE_GHI_KHONG_LOIGHI` 50 → 49: bộ kiểm báo đếm 49 sau khi 5 route ghi khách đi qua `loiGhi` (được phép HẠ).
- `thu_GIOVN1` A2j: bước 020 nạp lúc khởi động TRƯỚC SX giả của bài → bài xoá bộ đệm `require` của 020 rồi chạy khung lại (chỉ sửa bài).
- `thu_GIOVN1` M5 (phép tĩnh giờ ghi) báo `khachMoi.js` INSERT thiếu `created_at` khi danh sách cột sinh động → viết cột ra hẳn (K8: phép đúng).

## Soát bảo mật
Lần 1 (07.11, sau vòng sửa 4, HEAD 4ab503c) — subagent general-purpose, lời nhắc /security-review + "Tiền lệ của kho này". Lỗ hổng trước lọc: 0
· sau lọc: 0 (không cần bước lọc). Báo cáo nguyên văn:
```
Không tìm thấy lỗ hổng.

Mình đã đọc toàn bộ diff phần code từ 9a49cdf^ tới HEAD: customers-v2.js, customers.js, registrations.js, docKhach.js, khachMoi.js, maKhach.js, nang_cap/chay.js, 020_chep_khach_sx.js, 022_chep_dang_ky_qr.js và kiem_tra_truoc_khi_giao.js. Không có lỗ nào mới do nhánh này đưa vào, ở mức tin cậy ≥ 7.

Các điểm đã soát và vì sao không tính là lỗi:
- **SQL:** mọi giá trị người dùng gửi lên đều đi qua tham số `?`. `CAU_XOA_KHACH_TRANG` (registrations.js) chỉ ghép tên bảng / cột từ hằng số `DAU_VET_KHACH`, không ghép dữ liệu người dùng.
- **PUT /registrations/:id giờ sửa luôn `pos_customers` theo SĐT** (tên, ghi chú, parent_phone, quan hệ). Route chỉ có `authenticate`, nhưng `PUT /customers/:id` trong customers.js (khoảng dòng 368) vốn đã cho mọi nhân viên đăng nhập sửa đúng các trường này. Vậy không có leo thang quyền mới.
- **DELETE /registrations/:id xoá luôn khách:**
  - Chỉ xảy ra khi vai là `owner` hoặc `manager` (`req.user.role`, đúng tên vai trong middleware/auth.js).
  - Đăng ký phải đang chờ, khách phải do chính đăng ký đó tạo (cùng `created_by`, `created_at` từ lúc đăng ký trở đi) và chưa có dấu vết nào (ví, đơn, điểm, gói…). Điều kiện nằm ngay trong câu DELETE.
  - Nhật ký chỉ chép cột ở danh sách trắng `COT_NHAT_KY_KHACH`, không có `pin_code` / `password`.
- **docKhach.js:** chọn từng trường để trả ra, không trả cả dòng, nên không lộ `pin_code` / `password`. Phạm vi dữ liệu trả cho nhân viên đã đăng nhập vẫn như các đường cũ đọc từ SX.
- **maKhach.js (App KH):** tạo khách qua `taoKhach`, mã QR giờ sinh bằng `sinhQrKhongTrung` thay cho `generateQRCode(sdt)`. Đây là cải thiện về độ khó đoán, không phải lỗi. Việc chiếm mã đăng nhập (`AND dung_luc IS NULL` + kiểm `changes`) giữ nguyên.
- **Tạo khách ở POST /customers, /:id/children, /registrations:** trước đây cũng chỉ cần đăng nhập. Kiểm trùng giờ nằm trong câu ghi (`ON CONFLICT DO NOTHING`), không mở đường mới.
- **customers-v2.js address / discount:** vẫn giữ `checkPermission('manage_users')`.
- **Bước nâng cấp 020 / 022:** dữ liệu vào là SX (gọi bằng khoá API, nguồn tin cậy) và bảng đăng ký nội bộ. Chỉ thêm khách mới, không ghi đè dòng đã có.
- **kiem_tra_truoc_khi_giao.js:** chỉ hạ ngưỡng bánh cóc từ 50 xuống 47 và sửa chú thích, không tắt phép kiểm nào.

Chưa kiểm: mình chỉ đọc code, không chạy bài thử. Các vùng cũ nằm ngoài diff (vd `PUT /customers/:id` không có `checkPermission`, `parent_phone` do máy khách gửi trong `POST /orders`) không thuộc phạm vi soát này.
```
SOÁT BẢO MẬT: ĐẠT

## Báo cáo 7 mục
SOÁT LẦN CUỐI: chat soát thay (soát vòng 3 chỉ còn lỗi NHẸ → vòng sửa 4 ngay trong phiếu, LUAT §6.5)
```
VIỆC:        KHACH-APP-1 — Khách chỉ còn MỘT nguồn POS (danh sách, tìm, QR, hồ sơ đọc pos_customers; chép SX lần cuối; một hàm tạo khách)
ĐÃ SỬA:      server/utils/docKhach.js (mới) — một hàm đọc khách; customers-v2.js — 4 đường đọc qua docKhach, bỏ fetchSXCustomers /
             getLocalCachedCustomers / cacheCustomersToLocal; PUT address / discount tạo khách qua taoKhach
             server/utils/khachMoi.js (mới) — taoKhach: một hàm tạo khách (chuẩn SĐT, trùng SĐT trong câu ghi, sinhQrKhongTrung, mặc định Q2)
             customers.js POST / người nhận / POST /:id/children · maKhach.js (App) — qua taoKhach
             registrations.js — POST tạo khách thật (Q1), Q7 409 KHACH_DA_CO_TAI_KHOAN (cả khi SĐT có đăng ký và đã là khách), trùng
             đăng ký chặn trong câu ghi; PUT sửa luôn dòng khách (Q6a); DELETE xoá khách trắng do đăng ký tạo, chỉ owner / manager, nhật
             ký pos_sync_logs 'xoa_khach' cột danh sách trắng (Q6b)
             server/nang_cap/chay.js — trạng thái HOÃN; 020_chep_khach_sx.js — chép SX lần cuối; 022_chep_dang_ky_qr.js (đổi từ 021) —
             đăng ký chờ → khách + cấp QR ô trống
             kiem_tra_truoc_khi_giao.js — nối thu_KHACHAPP1, bánh cóc loiGhi 50 → 47; cong_cu/thu_GIOVN1.js A2j (Q4), thu_KHO1.js B1/B2/B1c (Q5)
BÀI THỬ:     cong_cu/thu_KHACHAPP1.js: trên gốc 37d195b → ĐỎ 34/100 (A1, A3–A5, A11, A12, B*, C1, C2b, C7*, R*, …); sau vá → XANH 100/100.
             thu_GIOVN1 A2j, thu_KHO1 B1c đỏ trên gốc (bang_chung_do.txt). dot_bien.py 54/54 BẮT, đối chứng 100/100 + 112/112.
             npm test PASS 102 · FAIL 0; --day-du PASS 106 · FAIL 0 · CẢNH BÁO 1 (route GET có lệnh ghi — có sẵn trước việc).
ĐÃ RÀ K4:    grep "fetchSXCustomers(" customers-v2.js → 4 chỗ, cả 4 sang docKhach; grep "INSERT INTO pos_customers" server/ → customers.js
             3, maKhach.js 1, customers-v2.js 3, registrations.js 0 (qua taoKhach), sync.js 1 (ngoài Phạm vi, Phát hiện) — đã chuyển hết
             trong Phạm vi; route sửa / xoá đăng ký: PUT, DELETE, revert, confirm-export → PUT / DELETE đã nối khách (revert / xuất chỉ đổi
             trạng thái); "021" trong server / cong_cu / dot_bien → đổi hết sang 022 (hồ sơ cũ giữ làm lịch sử).
CHƯA KIỂM:   Turso thật (giao dịch dài của 020, đua thật — bài chạy libsql file cục bộ); SX thật trả dạng gì / bao nhiêu khách; chưa gộp
             thử với main (GIAO-1 021, NAP-1 cùng sửa chay.js — máy không có ref main); không thử tay giao diện (màn Đăng ký, Thêm khách,
             Tạo nhanh ở Bán hàng); màn Đăng ký không gửi lý do xoá và luôn báo "Đã xóa!" (client Cấm) — lý do trong nhật ký là câu
             mặc định; production có thể thiếu UNIQUE ở qr_code nếu bảng cũ hơn ràng buộc.
GIT:         (xem dòng git log --oneline -2 ghi sau commit cuối)
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 4 · BỎ 2 — chi tiết ở ## Bài học
```

Nghiệm thu — đếm từng mục:
- A (một hàm đọc, 4 đường, mỗi SĐT một dòng, không gọi SX, thêm xung_ho, giữ dạng) — A1, A1b, A3–A6b, A9, A9b, A11, A12, A12b, A12c, A13, A14.
- B (chép lần cuối, chỉ thêm, sao lưu, nhật ký, SX lỗi → HOÃN, cách đếm) — B1–B1e, B2, B3, B3b, B3c, B4, B5, B7; ke_hoach "Chủ quán đối chiếu".
- C (một hàm tạo, cùng chuẩn / mặc định / QR, đua không 500) — C0–C6b, C4b, C5b, K2–K2d, C8.
- D (so cột, hiện / tìm / QR / hồ sơ khi SX thiếu họ và khi SX tắt, tên không bị đè, chép hai lần không đổi) — C1, vòng ds / loi, A8, A8b, B2, B6e.
- K5 (không đổi luật SĐT, /api/kh, số dư / điểm / hạng, client, sync.js) — `git diff --stat 9a49cdf^ HEAD` không đụng client/, sync.js, routes/kh/,
  HOP_DONG_API_KH.md; thu_HOPDONG_KH, thu_KHSDT1 xanh trong npm test; A13.
- Q1 C7, A6b, B6b · Q2 C1, K2b · Q3 A14 · Q4 thu_GIOVN1 A2j · Q5 thu_KHO1 B1, B1c, B2.
- Phát hiện chủ quán chốt: người nhận không SĐT K2, K2d · address / discount qua hàm chung C8 · cấp QR ô trống B6, B6c · HOÃN ≠ ném B3, B7 · nhãn SX để sau (client không đổi).
- Q6a R1–R1d · Q6b R2, R2b, R2c, R2d, R3, R3b, R4 × 12, R5–R5d · Q7 C7b, C7d, C7e (nhánh còn lại) · đổi 021 → 022 R6, B3b, B6.
→ đủ mọi mục, mỗi mục có ca.

## Bài học
Sự cố của việc: soát vòng 1 bắt K4 (sửa / xoá đăng ký bỏ sót) + K5 (tự chọn chặn Q7); soát vòng 2 bắt hai vị từ cho "SĐT đã có" (Q7 chỉ đúng khi
không có đăng ký), nhật ký chép cả dòng khách (băm PIN), bài chưa nối bộ kiểm, bánh cóc chưa hạ; soát vòng 3 bắt danh sách trắng không so BẰNG,
nhánh "giữ câu cũ" không ca. Người gác chặn: `git mv` / `ls-tree` (GIT-LENH — lệnh git con ngoài danh sách), `git fetch origin main` (GIT-KEO),
chạy bài có cụm bí mật của bài thử trước khi commit (B-BIMAT-CHU), lệnh ghép `&&` sau script (B-PHANTICH), `sed -i` (SED-I). Đột biến LẠC một lần
(VS-XOA-KHACH-CUA-NGUOI-KHAC: ca R5 bị điều kiện khác che — sửa ca cho chỉ vi phạm một điều kiện). Kho nông lại → unshallow.
- **KHOÁ (làm trong Phạm vi):** bài thu_KHACHAPP1 nối vào `kiem_tra_truoc_khi_giao.js` (chayBaiThat) — ca R6 "không hai file nâng cấp cùng số"
  nay chạy ở mọi npm test, kể cả sau khi gộp main (bắt đúng lỗi 021 trùng GIAO-1).
- **KHOÁ (đề xuất, ngoài Phạm vi — `kiem_tra_truoc_khi_giao.js` phép mới cần chủ quán duyệt danh sách miễn):** mọi `cong_cu/thu_*.js` phải có
  `chayBaiThat` hoặc nằm trong danh sách miễn có tên; ca đỏ: thêm một bài thử mới không nối → FAIL.
- **KHOÁ (đề xuất):** phép tĩnh — `INSERT INTO pos_sync_logs` có chép dòng khách phải đi qua một hàm che chung (gom `COT_BI_MAT` của donThu.js và
  `COT_NHAT_KY_KHACH`) — file `server/utils/` mới + sửa donThu.js; ca đỏ: chép `SELECT * FROM pos_customers` vào details.
- **NGUYÊN TẮC (K4, đề xuất thêm vào KHUON_LOI.md — ngoài Phạm vi):** đổi đường TẠO của một đối tượng (đăng ký → khách thật) → grep mọi route
  SỬA / XOÁ của cùng đối tượng, mỗi route một ca. Đã gây: Q6 (màn Đăng ký sửa / xoá không tác dụng lên khách).
- **NGUYÊN TẮC (K4):** câu chủ quán nói theo ĐỐI TƯỢNG ("SĐT đã là khách") → ca phủ mọi cách đối tượng đó đang có trong kho (có / không đăng ký,
  khách App, khách chép SX); một vị từ rẽ hai nhánh thì CẢ HAI nhánh có ca + đột biến "đổi nhánh". Đã gây: C7d, C7e.
- **NGUYÊN TẮC (K3):** danh sách trắng (cột nhật ký, khoá trả ra) so BẰNG `Object.keys`, không chỉ "không có X" (LUAT §6.7 áp cả cho bài mới).
  Đã gây: R2d bản đầu.
- **NGUYÊN TẮC (K5):** phép chặn mới mà câu trả lời chủ quán không nhắc tới là chỗ CHƯA CHỐT — hỏi trước khi khoá bằng ca + đột biến. Đã gây: C7b vòng 1.
- **BỎ:** chuỗi `\n` trong script Python sinh ra xuống dòng thật trong dot_bien.py (một lần, đối chứng bắt ngay). Kho nông (đã có cách xử lý ở skill bước 1.3).
Dọn: KHUON_LOI.md / CLAUDE.md ngoài Phạm vi — không đề xuất xoá dòng nào lần này.

## Cổng
`node tu_chay/cong.js chay . 9a49cdf^ HEAD viec/KHACH-APP-1` tại a0e3027c (cây sạch):
✓ CỔNG CHẠY ĐẠT
GIT (git log --oneline -2 lúc kiểm):
  a0e3027c KHACH-APP-1: soat bao mat DAT, bao cao 7 muc, bai hoc
  4ab503ce KHACH-APP-1: bang chung vong sua 4; --day-du PASS 106 FAIL 0

HEAD ĐÃ KIỂM: a0e3027c
