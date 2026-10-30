# KH-API-3 — Cửa App KH: xem menu không cần đăng nhập · đăng ký 3 bước (xưng hô, địa chỉ) · tự gia hạn đăng nhập · hợp đồng v3

<!-- Phiếu do chat soạn 29.10.2026. Việc [T] (đăng nhập + dữ liệu khách) — Opus, lập kế hoạch, dừng chờ duyệt. Nền: main SAU khi KH-API-2 gộp
     (hợp đồng v2). Làn Opus 1, ngay sau KH-API-2, trước COMBO-1a. Theo YEU_CAU_APPKH_GUI_POS_29102026.md (chat App KH, chủ quán chốt 29.10) —
     QUYET_DINH_CHU_QUAN.md mục App KH (3 dòng 29.10: xem menu không cần đăng nhập · đăng ký 3 bước · tự gia hạn đăng nhập).
     Hiện trạng chat đọc 29.10: /menu ở server/routes/kh/index.js trả danh sách TRẮNG trường món (ton_cu là cờ true/false, không số tồn thật);
     xac-minh gọi xacMinhMa(sdt, ma, ten) → khách mới thiếu tên trả CAN_TEN; mã sống 5 phút; pos_customers đã có cột address, CHƯA có cột xưng hô;
     giới hạn lượt chỉ có ở xin mã / nhận mã (giuLuotNhanMa).
     Chat kiểm lại 30.10 trên main 6f2c30b (sổ v47, KH-API-2 đã gộp): đúng như trên. Bước nâng cấp: main có `001_kho.js`; KHO-2a (chưa gộp)
     đã giữ số 002 → bước của việc này đánh **003** (bộ chạy chấp nhận số nhảy cóc). Báo cáo cho chủ quán theo LUAT §8 (lời thường). -->

**Chờ duyệt kế hoạch:** viết `viec/KH-API-3/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Khách mở App lúc nào cũng xem được menu và giá (chưa đăng nhập vẫn xem); khách mới đăng ký đủ 3 bước (SĐT → mã → Tên + Cách xưng hô, Địa chỉ
tuỳ chọn); khách dùng thường xuyên không bao giờ phải đăng nhập lại. Hợp đồng `HOP_DONG_API_KH.md` lên v3 cùng PR. Phải xong trước khai trương.

## Nghiệm thu
- A **`GET /menu` không bắt buộc token:** không token → trả đúng danh sách trường như có token (kể cả `gia_hang`); token hợp lệ → như trên; token
  gửi kèm mà sai / hết hạn → 401 `KH_TOKEN_SAI` như cũ. Giới hạn chống quá tải cho cửa xem không token đặt RẤT CAO (≥ 300 lần / phút mỗi địa
  chỉ; vượt → 429 `QUA_NHIEU_LAN`) — khách thật không bao giờ chạm (chủ quán dặn). Không thêm trường nào mới vào món.
- B **Đăng ký 3 bước:** `POST /dang-nhap/xac-minh` nhận thêm `xung_ho` (BẮT BUỘC khi tạo khách mới; một trong `anh · chi · co · chu · bac · em ·
  ban`, sai → 400 `XUNG_HO_SAI`) và `dia_chi` (tuỳ chọn, ≤ 300 ký tự, cắt khoảng trắng; dài quá → 400 `DIA_CHI_QUA_DAI`); khách mới thiếu tên HOẶC
  xưng hô → `CAN_TEN` như cũ. Lưu tên + xưng hô + địa chỉ trong CÙNG giao dịch tạo khách. Khi trả `CAN_TEN` cho mã đã đúng: cho mã đó sống thêm
  10 phút tính từ lúc đó (một lần), để khách điền thông tin.
- C **Hồ sơ:** `GET /toi` thêm `xung_ho` (hoặc `null`) và `dia_chi` (cột `address` đang có, hoặc `null`); `PUT /toi` sửa được `ten`, `xung_ho`,
  `dia_chi` (từng trường tuỳ chọn nhưng ít nhất một — thân rỗng → 400 `YEU_CAU_KHONG_HOP_LE`; `ten` gửi mà rỗng → `TEN_KHONG_HOP_LE` như cũ;
  cùng phép kiểm như B; gửi `dia_chi: ""` = xoá). Cột xưng hô thêm qua bước nâng cấp dữ liệu đánh số
  (khung `server/nang_cap/`, bước `003_…`, `themCot` có sao lưu bảng). Màn Khách hàng ở quầy KHÔNG đổi ở việc này.
- D **Tự gia hạn đăng nhập:** `POST /gia-han` (cần token CÒN HẠN) → `{ token, het_han }` mới 30 ngày (giờ Việt Nam). Token hết hạn / sai → 401.
  App gọi khi mở app, tối đa 1 lần / ngày; máy chủ chặn gọi dồn (vd > 10 lần / giờ mỗi khách → 429). Không dùng 30 ngày liền → hết hạn, khách nhận
  mã lại. Kế hoạch nêu rõ cách an toàn (token cũ còn dùng được tới hạn cũ hay không — ghi lý do).
- E **Hợp đồng v3** cùng PR: `/menu` ghi token "không bắt buộc" — khối máy đọc dùng `"token": "tuy_chon"` (bài thử hợp đồng hiểu ba giá trị
  `true` / `false` / `"tuy_chon"`: gọi cả có lẫn không token); thêm `xung_ho`, `dia_chi` ở `/toi`, thân mới của `xac-minh` / `PUT /toi`, cửa
  `/gia-han`, mã lỗi mới; `PHIEN_BAN` 3, dòng nhật ký. `thu_HOPDONG_KH.js` xanh với v3.
- F **K5:** quầy, nhận điểm, PIN, đăng nhập khách cũ chạy y như cũ; App bản đang dùng (v2): khách CŨ đăng nhập / xem / nhận điểm như cũ, khách
  MỚI cần ô xưng hô (chủ quán chốt 30.10 — xưng hô bắt buộc; App KH thêm ô trước khai trương, nhật ký hợp đồng v3 ghi rõ).

## Phạm vi
- viec/KH-API-3/**
- server/routes/kh/**
- server/middleware/khachAuth.js
- server/utils/maKhach.js
- server/nang_cap/**
- HOP_DONG_API_KH.md
- cong_cu/thu_KHAPI3.js
- cong_cu/thu_HOPDONG_KH.js
- cong_cu/thu_KH1.js
- cong_cu/thu_KHUI1.js
- cong_cu/thu_P15QR.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_KHAPI3.js` ĐỎ trên code gốc: menu không token 200 + đủ trường; token sai 401; 301 lần / phút → 429 nhưng 200 lần → 200; khách
mới thiếu xưng hô → `CAN_TEN`, xưng hô lạ → `XUNG_HO_SAI`; mã đã đúng + `CAN_TEN` → 12 phút sau vẫn dùng được, 16 phút sau hết; tạo khách lưu
đủ 3 trường; `PUT /toi` đổi / xoá địa chỉ; gia hạn đúng 30 ngày, token hết hạn → 401, gọi dồn → 429; chạy với `TZ=UTC`, giờ trả theo giờ VN.

## Bài thử cũ sửa
- cong_cu/thu_HOPDONG_KH.js — hiểu token "tuy_chon" + xác minh gửi xung_ho; xanh trên gốc vì hợp đồng v2 không có cửa tuy_chon

## Ghi chú chat (30.10, trả lời ## Câu hỏi của trang_thai.md)
- Chat đã GỘP main c8edb66 (BH-2 + KHO-2a) vào nhánh này (commit GOP-KH-API-3). Kéo về rồi làm tiếp.
- `cong_cu/thu_KHO1.js`: KHO-2a đã đổi B1 / B2 sang đếm số file bước thật → sau gộp XANH với 003. KHÔNG thêm vào Phạm vi, không sửa.
- `cong_cu/thu_KHUI1.js` (ca H3) và `cong_cu/thu_P15QR.js` (ca A6): bài SỬA bình thường (LUAT §6.8), KHÔNG vào `## Bài thử cũ sửa` — bản mới
  phải ĐỎ trên gốc: H3 mong menu không token → 200; A6 ngoài gửi `xung_ho` còn kiểm khách mới LƯU đúng `xung_ho` (gốc không lưu → đỏ). Ghi `SỐ CA`.
- MỚI sau gộp: `cong_cu/thu_KHO2a.js` ca E6b đỏ — nó chạy CẢ thư mục `server/nang_cap/` trên kho thử chỉ có bảng kho, bước 003 gặp
  `no such table: pos_customers`. Sửa ở bước 003 (trong Phạm vi), KHÔNG sửa thu_KHO2a: bảng `pos_customers` chưa có thì bỏ qua (thật ra không xảy ra —
  `database.js` chạy `createTables()` trước `chayNangCap`), ghi chú lý do ngay trong file; thêm ca vào `thu_KHAPI3.js` (kho không có bảng khách → 003
  chạy xong không lỗi; kho có bảng → thêm cột) + đột biến bỏ phép kiểm bảng.
- Soát vòng 2 như kế hoạch; xong chạy lại bộ kiểm + cổng, báo cáo theo LUAT §8 (lời thường trước).

## Ngân sách
~220 dòng máy chủ + ~350 dòng thử. Danh sách trắng `/toi` ở `thu_KH1.js` mở thêm đúng 2 trường theo LUAT §6 mục 7.

## Đổi cấu trúc DB
có — một cột xưng hô ở `pos_customers` qua bước nâng cấp đánh số (`themCot`, tự sao lưu). Không đổi dữ liệu cũ.

## Thư viện mới
không

## Cấm
- KHÔNG đổi cách tạo / kiểm mã đăng nhập ngoài điểm "sống thêm 10 phút khi CAN_TEN"; KHÔNG đổi luật PIN, tiền, điểm, ví.
- KHÔNG sửa `server/routes/orders.js`, `thanh-toan.js`, `wallets.js`, `customers*.js`, `client/**` (màn quầy không đổi), `app_kh/**`.
- KHÔNG làm gửi mã qua Zalo (KH-OTP-1), sổ phiên / đăng xuất máy khác (KH-TACH-1), đặt đơn (KH-MUA-1).
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/KH-API-3`. Không đụng main, không merge,
  không tạo PR.
