# DANG-NHAP-2 — Đăng nhập POS: giới hạn số lần gõ sai + câu báo chung (không lộ tên đăng nhập có thật hay đang bị khoá)

<!-- Phiếu do chat soạn 13.11.2026 (bàn 36, sổ v65, main 4434ad5). Việc [Th] — Sonnet, làm thẳng tới hết, CÓ soát bảo mật. Chủ quán 13.11: làm TRƯỚC
     khai trương. (Mã DANG-NHAP-1 đã dùng ở BAN-HANG-1 — hạn vé 30 ngày; phiếu ND-API-1 gọi việc này là "DANGNHAP-1" = chính việc này.)
     Nguồn: ND-API-1 phát hiện 13.11 — server/routes/auth.js POST /login: (1) KHÔNG giới hạn số lần sai → dò mật khẩu vô hạn; (2) tài khoản bị khoá
     (is_active = 0) trả câu riêng "Tài khoản đã bị vô hiệu hóa" NGAY CẢ KHI SAI mật khẩu → người ngoài biết tên đăng nhập đó có thật; (3) tên không tồn tại
     trả về ngay (không chạy bcrypt) → đo thời gian phản hồi cũng đoán được tên có thật.
     Chat đọc trên main: app.set('trust proxy', 1) (server/index.js) → req.ip là IP thật của khách sau Render. PIN chủ quán / PIN khách ĐÃ có khoá 5 lần /
     15 phút (utils/pinChuQuan.js, pinKhach.js) — việc này theo đúng con số đó. client/src/utils/api.js: 401 của /login KHÔNG kèm code là cố ý (chỉ
     các code trong SESSION_DEAD_CODES mới đá về /login) — câu trả lời đăng nhập KHÔNG được mang code NO_TOKEN / INVALID_TOKEN / TOKEN_EXPIRED /
     USER_NOT_FOUND / USER_INACTIVE. -->

## Mục tiêu
Người ngoài không dò được mật khẩu và không đoán được tên đăng nhập nào có thật; nhân viên gõ nhầm vài lần vẫn đăng nhập bình thường.

## Nghiệm thu
- A **Giới hạn theo CẶP (tên đăng nhập + IP):** sai 5 lần trong 15 phút → lần thứ 6 trở đi trả 429 `QUA_NHIEU_LAN` với câu "Gõ sai quá nhiều lần — thử lại sau
  N phút" (N = số phút còn lại, làm tròn lên), KỂ CẢ khi lần đó gõ đúng mật khẩu. Hết 15 phút → đếm lại. Đăng nhập đúng → xoá đếm của cặp đó. Tên
  đăng nhập so sau khi bỏ khoảng trắng hai đầu + chữ thường (gõ "Admin " và "admin" là một).
- B **KHÔNG khoá theo tên trên mọi máy:** cùng tên đăng nhập từ IP khác vẫn đăng nhập được bình thường (người lạ gõ sai tên chủ quán từ xa KHÔNG làm chủ
  quán ở quầy bị khoá).
- C **Giới hạn theo IP (chặn rải nhiều tên):** một IP sai tổng cộng 20 lần / 15 phút (mọi tên cộng lại) → 429 `QUA_NHIEU_LAN` cho mọi tên từ IP đó.
- D **Giữ lượt TRƯỚC khi so mật khẩu** (khuôn kiemPinChuQuan): gửi 20 yêu cầu sai cùng lúc cho một cặp thì tối đa 5 yêu cầu được so bcrypt, phần còn lại 429.
- E **Câu báo chung:** tên không tồn tại, sai mật khẩu, và tài khoản bị khoá mà SAI mật khẩu → CÙNG một câu "Tên đăng nhập hoặc mật khẩu không đúng",
  cùng 401, KHÔNG kèm code. Tên không tồn tại vẫn chạy một lần bcrypt với băm giả (thời gian phản hồi tương đương). Chỉ khi mật khẩu ĐÚNG mà tài khoản
  bị khoá mới báo "Tài khoản đã bị vô hiệu hoá" (người đó biết mật khẩu — nhân viên thật cần biết lý do). Mọi lần sai (kể cả tên không tồn tại) đều tính lượt.
- F **Bộ đếm** để trong bộ nhớ máy chủ (không bảng mới): có trần số mục + dọn mục quá hạn (không phình bộ nhớ khi bị dò); máy chủ khởi động lại thì đếm
  về 0 — chấp nhận (ghi trong Phát hiện). Hàm đếm để ở `server/utils/gioiHanDangNhap.js`, có thể dùng lại cho đường khác sau này.
- G **Màn đăng nhập** hiện đúng câu của máy chủ cho 401 và 429 (không đá vòng về /login, không xoá ô đã gõ).
- H **Không đổi:** vé (JWT_SECRET, hạn 30 ngày), dạng trả `{ success, token, user, permissions }` khi đúng, last_login, PIN chủ quán / PIN khách, /api/kh.
- I **Bộ kiểm:** `cong_cu/thu_DANGNHAP2.js` ĐỎ trên gốc (máy chủ thật, tiến trình con, kho thử; IP giả qua `X-Forwarded-For`): A (6 lần sai → 429, lần 6 gõ
  đúng vẫn 429; đúng ở lần 4 → đếm về 0), B (IP khác vẫn vào), C (20 tên khác nhau từ một IP → 429), D (20 yêu cầu song song → tối đa 5 lần 401, còn lại
  429), E (ba trường hợp cùng câu, không code; bị khoá + đúng mật khẩu → câu vô hiệu hoá; phép tĩnh: nhánh không có tài khoản vẫn gọi bcrypt), G (phép
  tĩnh Login.jsx / api.js không coi 429 là phiên chết). Bài đăng nhập cũ (thu_P26c và các bài có đăng nhập) vẫn xanh. Nối vào kiem_tra_truoc_khi_giao.js;
  đột biến có bắt (bỏ giữ lượt trước bcrypt, khoá theo tên toàn cục, đổi 5 → 6, bỏ băm giả, trả câu riêng cho tài khoản bị khoá khi sai mật khẩu).

## Phạm vi
- viec/DANG-NHAP-2/**
- server/routes/auth.js
- server/utils/gioiHanDangNhap.js
- client/src/pages/Login.jsx
- client/src/contexts/AuthContext.jsx
- client/src/utils/api.js
- client/dist/**
- cong_cu/thu_DANGNHAP2.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_DANGNHAP2.js` ĐỎ trên gốc: sai bao nhiêu lần cũng không bị chặn; tài khoản bị khoá + sai mật khẩu lộ câu riêng.

## Ngân sách
~90 dòng máy chủ + ~10 dòng giao diện + ~250 dòng thử.
**Phương án đơn giản nhất đã xét:** một hàm đếm trong bộ nhớ (Map có trần) đặt trước bcrypt, đúng con số PIN 5 lần / 15 phút; không bảng, không thư viện.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
có

## Cấm
Không khoá theo tên đăng nhập trên mọi IP; không đổi hạn vé / dạng vé; không gắn code SESSION_DEAD_CODES vào câu trả lời đăng nhập; không đụng PIN, /api/kh,
/api/nd; không làm màn mở khoá thủ công (đợi 15 phút là đủ).
