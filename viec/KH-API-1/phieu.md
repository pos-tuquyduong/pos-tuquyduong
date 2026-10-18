# KH-API-1 — Cổng khách `/api/kh`: đăng nhập bằng mã một lần (OTP), hồ sơ, menu, điểm, voucher, nhận mã bill, lịch sử đơn của mình

<!-- Phiếu do chat soạn 18.10.2026. Nền: main sau sổ việc v37 (cha 8259a59 = Merge PR #33 TU-CHAY-8; LUOI-5 #32). Luật: LUAT_XAY_APP.md
     (bảng nguồn sự thật, mục bảo mật — khách lấy từ token, ca "khách A đọc của B → 403", giới hạn thử; route khách `routes/kh/*.js`
     mount MỘT chỗ tại `/api/kh`). Chủ quán chốt 18.10: đăng nhập = SĐT + mã OTP gửi qua Zalo ZNS (qua bên dịch vụ, cắm ở việc sau
     KH-OTP-1); chưa cắm thì khách lấy mã TẠI QUẦY (thu ngân bấm, màn quầy hiện mã). Không mật khẩu.
     Song song (cùng đợt M2): P26d (server/database.js — CHỈ sửa beginTransaction/run, KHÔNG sửa createTables; orders.js, wallets.js…),
     DOI-SOAT-1 (reports.js, Reports.jsx, gia_lap/bat_bien.js), P16 (Invoice*, InvoiceSettings, Sales.jsx, Orders.jsx). Chung file DUY
     NHẤT với P26d là server/database.js: việc này CHỈ THÊM bảng ngay SAU khối `CREATE TABLE IF NOT EXISTS pos_customers` (khác vùng P26d
     sửa) → git gộp tự động. Chung file với DOI-SOAT-1: kiem_tra_truoc_khi_giao.js — việc này CHỈ thêm tên bài vào mảng danh sách bài
     chạy thật hiện có (`for (const bai of [...]) chayBaiThat(bai)`), DOI-SOAT-1 thêm dòng gọi riêng ở chỗ khác.
     Dịch vụ cũ có khoá `x-service-key` (`/signup-codes/claim`, `/loyalty/points/:phone`, `/loyalty/vouchers/:phone`, `/products`) GIỮ
     NGUYÊN hành vi — đóng là việc của AUDIT-KH sau khi App KH chuyển hẳn sang `/api/kh`.
     18.10 chủ quán trả lời Q1–Q7 của kế hoạch (trang_thai.md): Q1 có CẢ nhận voucher (/claim) VÀ nhận điểm (/nhan-diem) qua token;
     Q2 không tạo nhanMaBill.js; Q3 thêm products.js; Q4 bỏ phần màn quầy (client) khỏi việc này → KH-QUAY-1 sau P16 (tránh đụng
     client/dist với P16, DOI-SOAT-1); Q5 trust proxy 1; Q6 retail; Q7 chỉ mã App xin bị đếm / chặn. -->

**Chờ duyệt kế hoạch:** viết `viec/KH-API-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
App KH đợt 1 (KH-UI-1, mốc M3) có một cổng máy chủ an toàn để: khách đăng nhập bằng SĐT + mã một lần, xem / sửa tên mình, xem menu
(giá + còn hàng), điểm, voucher, lịch sử đơn CỦA MÌNH, và tự nhận mã in trên bill. Mọi quy tắc tiền / điểm vẫn ở máy chủ POS và đi qua
ĐÚNG hàm quầy đang dùng; App KH không bao giờ gửi SĐT để chọn "khách nào" — khách luôn lấy từ token.

## Nghiệm thu
Bài thử mới `cong_cu/thu_KH1.js` (khuôn các bài `thu_P20.js` / `thu_P26c.js`: máy chủ thật trên kho tạm, mount đúng route) + ghép vào
danh sách bài chạy thật của `npm test`.

- A Đăng nhập (`POST /api/kh/dang-nhap/xin-ma` {sdt} → `POST /api/kh/dang-nhap/xac-minh` {sdt, ma, ten?}):
  - A1 SĐT chuẩn hoá bằng hàm chuẩn hoá SĐT đang có (SO-LUONG-1); SĐT sai dạng → 400 `SDT_KHONG_HOP_LE`.
  - A2 Mã 6 chữ số sinh bằng `crypto.randomInt`; lưu BĂM (không lưu mã thô), hạn 5 phút, dùng MỘT lần (câu ghi "đánh dấu đã dùng" có
    điều kiện chưa dùng + kiểm `changes` — hai lần xác minh cùng lúc chỉ MỘT lần được token).
  - A3 Xác minh đúng → 200 + token khách hạn 30 ngày; sai → 400 `MA_SAI`; hết hạn / đã dùng → 400 `MA_HET_HAN`; sai 5 lần → mã huỷ.
  - A4 SĐT đã là khách → token gắn khách đó (không đổi tên, không tạo trùng). SĐT chưa là khách: phải có `ten` (1–50 ký tự sau trim) →
    tạo khách mới GIỐNG đường quầy tạo khách nhanh (cùng hàm nếu có; ghi `created_by` cho biết từ App KH); thiếu `ten` → 400 `CAN_TEN`
    và mã KHÔNG bị tiêu.
  - A5 `xin-ma` trả cùng một câu cho SĐT có hay chưa có trong hệ thống (không lộ ai là khách).
- B Giới hạn thử (đếm trong CSDL, không đếm trong bộ nhớ — Render có thể khởi động lại):
  - B1 `xin-ma`: cùng SĐT ≥ 60 giây giữa hai lần, ≤ 5 lần / giờ; cùng IP ≤ 20 lần / giờ → 429 `QUA_NHIEU_LAN`.
  - B2 `xac-minh`: ≤ 5 lần sai / mã; ≤ 10 lần sai / SĐT / giờ → 429.
  - B3 Hằng số giới hạn đặt một chỗ có tên.
- C Chỗ gửi mã dùng chung `server/utils/guiMaKhach.js` — một hàm `guiMaKhach(sdt, ma)`; chế độ theo biến môi trường `GUI_MA_KHACH`:
  `quay` (MẶC ĐỊNH: không gửi đi đâu, khách lấy mã tại quầy), `gia` (chỉ dùng trong bài thử: giữ mã cuối để bài đọc). Giá trị lạ →
  coi như `quay` + ghi log cảnh báo. KH-OTP-1 sau này chỉ thêm chế độ `zns` ở ĐÚNG file này.
- D Quầy cấp mã (`POST /api/pos/kh/cap-ma` {sdt}; nhân viên đăng nhập, quyền đang dùng cho việc tra / sửa khách): sinh mã như A2 (cùng
  hàm), trả mã cho màn quầy hiển thị, ghi ai cấp. Màn quầy (nút "Mã đăng nhập App") KHÔNG làm ở việc này — KH-QUAY-1 sau P16.
  Mã quầy cấp không bị đếm / chặn bởi giới hạn B (Q7).
- E Đọc dữ liệu của mình (token khách bắt buộc):
  - E1 `GET /api/kh/toi` (SĐT, tên, ngày tạo) · `PUT /api/kh/toi` {ten} — chỉ sửa tên.
  - E2 `GET /api/kh/diem` — số dư + lịch sử gần đây: gọi CÙNG câu / hàm tính điểm mà `/loyalty/points/:phone` dùng (tách ra
    `server/utils/` nếu đang nằm trong route; route cũ gọi lại hàm đó, hành vi không đổi).
  - E3 `GET /api/kh/voucher` — như `/loyalty/vouchers/:phone` (cùng hàm); THÊM mã giảm phát cho SĐT này qua `/claim` nếu bảng có cột
    gắn SĐT (chỉ đọc, chỉ mã còn dùng được); không có cột gắn → ghi `## Phát hiện`, không thêm cột.
  - E4 `GET /api/kh/don` (phân trang, mới nhất trước) và `GET /api/kh/don/:ma` — chỉ đơn có `customer_phone` = SĐT trong token; món,
    tổng, đã trả, trạng thái, ngày. Đơn của khách khác → 404 (không lộ tồn tại).
  - E5 `GET /api/kh/menu` — món đang bán: tên, nhóm, giá bán, còn hàng (lấy như quầy đang lấy). Danh sách TRẮNG trường trả ra; KHÔNG
    giá vốn, không trường nội bộ.
  - E6 `POST /api/kh/nhan-ma-bill` {ma} — đi qua ĐÚNG logic `/signup-codes/claim` (tách hàm dùng chung nếu cần; giữ nguyên mã lỗi
    409 `MA_DA_DUNG`, một SĐT một lần, cổng đơn gốc completed + paid) với SĐT lấy từ token.
  - E7 `POST /api/kh/nhan-diem` {ma} — đi qua ĐÚNG logic `/signup-codes/nhan-diem` (cùng hàm, mã lỗi giữ nguyên) với SĐT lấy từ token.
    E6 / E7: hàm dùng chung đặt NGAY trong `signup-codes.js` (dưới route), không dời sang file khác (phép E9, E14 giữ nguyên).
- F Tách token hai phía:
  - F1 Token khách ký bằng `KH_JWT_SECRET` (biến môi trường riêng, KHÁC khoá token nhân viên); thiếu biến → mọi `/api/kh/*` trả 503
    `KH_CHUA_CAU_HINH` (đóng, không mở); token mang loại `kh` + id khách.
  - F2 Token khách gọi bất kỳ `/api/pos/*` → 401. Token nhân viên gọi `/api/kh/*` (trừ đăng nhập) → 401.
  - F3 Gửi kèm `sdt` / `phone` / `customer_phone` trong tham số hay thân yêu cầu → BỊ BỎ QUA (ca: khách A gửi SĐT của B → vẫn ra dữ
    liệu của A). Ca "khách A đọc đơn của B → 404" (luật ghi 403; ở đây 404 để không lộ — ghi rõ trong kế hoạch).
- G Không lộ: lỗi chỉ `{ error, code }`; không trả mã băm, token người khác, giá vốn; không ghi mã thô hay token ra log.
- H Luồng hợp lệ không bị chặn (K5): khách đăng nhập → nhận mã bill hợp lệ → voucher ra đúng như qua `/claim`; nhận điểm bằng mã bill →
  điểm tăng đúng như qua `/nhan-diem`;
  `thu_P20.js` và mọi bài hiện có vẫn xanh; dịch vụ `x-service-key` cũ vẫn chạy như trước.
- Đột biến (`viec/KH-API-1/dot_bien.py`): tối thiểu bỏ kiểm loại token (F2), lấy SĐT từ thân yêu cầu (F3), bỏ điều kiện "chưa dùng" trong
  câu ghi mã (A2), bỏ giới hạn (B1, B2), bỏ lọc `customer_phone` ở E4, trả thêm giá vốn ở E5 — đều phải bị bắt.

## Phạm vi
- viec/KH-API-1/**
- server/routes/kh/**
- server/middleware/khachAuth.js
- server/utils/guiMaKhach.js
- server/utils/maKhach.js
- server/utils/diemKhach.js
- server/index.js
- server/database.js
- server/routes/loyalty.js
- server/routes/signup-codes.js
- server/routes/products.js
- env.example
- cong_cu/thu_KH1.js
- kiem_tra_truoc_khi_giao.js

## Ngân sách
~300–380 dòng code + ~350 dòng thử. Kế hoạch ghi rõ dòng nào chỉ là TÁCH hàm (không đổi hành vi) và đo lại bài cũ.
**Phương án đơn giản nhất đã xét:** không mật khẩu (OTP là đủ, đỡ quên mật khẩu); token JWT như quầy nhưng khoá riêng; đếm giới hạn
bằng bảng mã OTP (không bảng riêng nếu đủ); mọi số liệu đọc lại qua hàm quầy đã có.

## Đổi cấu trúc DB
có — CHỈ THÊM bảng mã đăng nhập khách (SĐT, mã băm, hạn, số lần sai, đã dùng, nguồn `quay` / `gui`, người cấp, IP, thời điểm) và
(nếu cần) bảng đếm theo IP. Đặt ngay sau khối `CREATE TABLE IF NOT EXISTS pos_customers` trong `createTables`. Không xoá, không đổi
tên, không sửa bảng cũ.

## Thư viện mới
không

## Cấm
- KHÔNG đổi hành vi route cũ (`/signup-codes/*`, `/loyalty/*`, `/products`, `/customers*`) — chỉ được tách hàm cho route mới gọi chung;
  tách ở `products.js` không được giấu lệnh ghi khỏi phép E14.
- KHÔNG sửa `client/` (kể cả `client/dist`) — màn quầy là KH-QUAY-1.
- KHÔNG sửa `server/middleware/auth.js` (token nhân viên) — tách token bằng khoá riêng + kiểm loại ở `khachAuth.js`.
- `server/database.js`: chỉ THÊM khối bảng ở chỗ ghi trên; KHÔNG sửa `beginTransaction`, `run`, hàm khác (P26d song song).
- `kiem_tra_truoc_khi_giao.js`: chỉ thêm `'cong_cu/thu_KH1.js'` vào mảng danh sách bài chạy thật; không nới hạn, không đổi phép khác.
- Không gửi tin thật ra ngoài, không gọi dịch vụ Zalo / SMS (KH-OTP-1). Không thêm `app_kh/` (KH-UI-1).
- Không sửa `tu_chay/`, `.claude/`, `.github/`, sổ việc, `cong_cu/thu_TOCDO1.js`, `cong_cu/gia_lap/**`. Chỉ push đúng
  `git push -u origin viec/KH-API-1`. Không đụng `main`, không merge, không tạo PR.
