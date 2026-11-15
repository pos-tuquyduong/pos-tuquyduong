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
- cong_cu/thu_NDAPI1.js
- server/utils/ipKhach.js
- server/index.js

<!-- Chủ quán 14.11 — VÒNG 2 (chat mở lại sau soát cuối 06eb608): LẤY ĐÚNG IP THẬT CỦA KHÁCH.
     Vì sao: chủ quán mở pos-tuquyduong.io.vn/cdn-cgi/trace → trả fl=… colo=HKG = có Cloudflare đứng trước. Render luôn đặt Cloudflare trước mọi dịch vụ
     (tài liệu Render + hỗ trợ Render): với app.set('trust proxy', 1), req.ip là IP MÁY CLOUDFLARE, không phải IP khách → nhiều người (cả quán, cả khách
     App) dùng chung một "IP" → giới hạn theo IP / theo cặp của việc này thành khoá chung. Lỗi CÓ TỪ TRƯỚC ở /api/kh (giuLuotMenu, xinMaGui, giuLuotNhanMa,
     capMaQuay, man-khach ghep) và ở /api/nd/dang-nhap (ND-API-1 đã gộp). X-Forwarded-For trên Render KHÔNG bị lọc (proxy chỉ nối thêm) → không dùng
     phần đầu XFF (khách giả được).
     Chat đã gộp main (có ND-API-1) vào nhánh — commit "GOP-DANG-NHAP-2 gop main …". Phạm vi thêm 2 file. SỬA MỘT CHỖ Ở CỬA VÀO (chủ quán chọn
     cách đơn giản nhất — không sửa từng đường):
     V1 — MỘT hàm `server/utils/ipKhach.js` → ipKhach(req): header `true-client-ip`, không có thì `cf-connecting-ip` (Cloudflare tự ghi đè, khách không giả
        được khi đi qua Cloudflare) nếu là IPv4 / IPv6 hợp lệ (một địa chỉ, không danh sách); không có / không hợp lệ → IP Express tính như cũ (Replit, bài
        thử chạy máy). Không đổi trust proxy.
     V2 — `server/index.js`: MỘT middleware gắn ngay sau `app.set('trust proxy', 1)`, TRƯỚC mọi app.use khác: ghi đè req.ip của yêu cầu đó bằng
        ipKhach(req) (Object.defineProperty trên chính req). Mọi chỗ đang dùng req.ip (auth.js, /api/kh — giuLuotMenu, xinMaGui, giuLuotNhanMa,
        capMaQuay — man-khach, /api/nd/dang-nhap) và mọi đường viết sau này TỰ ĐÚNG, KHÔNG sửa từng file. Phép tĩnh: middleware đứng trước app.use đầu tiên.
     V3 — bài thử (đỏ trước), qua máy chủ / app thật có middleware: cùng X-Forwarded-For nhưng True-Client-IP khác → đếm RIÊNG (mỗi người đủ 5 lần sai);
        cùng True-Client-IP mà X-Forwarded-For đổi liên tục → đếm CHUNG (không lách được); không có header Cloudflare → như cũ (bài cũ dùng XFF vẫn xanh);
        header rác ("abc", "1.2.3.4, 5.6.7.8") → bỏ qua; MỘT ca ở /api/kh (vd giuLuotMenu) chứng minh đường cũ không sửa vẫn đếm theo IP thật.
        Bài cũ của /api/kh và /api/nd (thu_KH…, thu_NDAPI1, thu_QCAPP1) vẫn xanh; đột biến có bắt (bỏ middleware, đặt middleware sau đường, tin XFF).
     Rồi: /ra-soat → /soat-bao-mat → cổng (gốc = commit gộp) → báo cáo 7 mục. Đẩy nhánh sau mỗi bước lớn. Chỉ sửa bằng Edit / Write.
     Ghi Phát hiện (KHÔNG làm): đổi mật khẩu (PUT /auth/password) và đặt PIN chủ quán chưa giới hạn sai — việc sau. -->

<!-- Chủ quán 14.11 — câu hỏi A2 (trạng thái 5a72334):
     ĐỒNG Ý — thêm cong_cu/thu_NDAPI1.js: CHỈ đổi hằng `<= 4` (dòng ~133, phép A2) thành `<= 10` (4 dòng ND-API-1 + QC-APP-1 + 6 dòng middleware vòng 2),
        ghi chú cạnh hằng vì sao 10; giữ nguyên mọi phép khác của A2 (dòng cũ còn nguyên, đúng thứ tự, /api/nd trước cors). Không đổi gì khác trong file.
     Phát hiện "gọi thẳng Render bỏ qua Cloudflare": Render đặt Cloudflare trước MỌI dịch vụ (kể cả *.onrender.com) — chấp nhận, ghi Phát hiện là đủ.
     Rồi: /ra-soat → /soat-bao-mat → cổng → báo cáo 7 mục. Đẩy nhánh sau mỗi bước lớn. -->

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
