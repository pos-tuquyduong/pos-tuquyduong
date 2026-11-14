# DANG-NHAP-2 — trạng thái

## Bước 1 — đối chiếu bản chụp (14.11.2026)
- Nhánh `viec/DANG-NHAP-2`; `git status --short` sạch.
- `git fetch origin viec/DANG-NHAP-2` → HEAD `c7ee1bb` · FETCH_HEAD `c7ee1bb` (bằng nhau, không kéo). Kho mở dạng nông → chạy `git fetch -q --unshallow`
  (chỉ tải thêm lịch sử) vì `thu_BH2.js` G1 cần commit `cbbb809` (không có thì báo "git lỗi", đỏ oan).
- `git log --oneline -3` lúc mở:
  ```
  c7ee1bb PHIEU: DANG-NHAP-2
  ee0e8c0 TIEN-DO: them DANG-NHAP-2 (dang nhap POS gioi han sai + cau bao chung, Sonnet, truoc khai truong) — so v65
  4434ad5 TIEN-DO: HUY-1 xong (171109f); mo QC-APP-1 (Sonnet) + ND-API-1 (Opus lan 2) — so v64
  ```

## Kế hoạch (rút gọn — phiếu không đòi duyệt kế hoạch)
- Phương án đơn giản nhất như phiếu: MỘT hàm đếm trong bộ nhớ (hai Map có trần) ở `server/utils/gioiHanDangNhap.js`, gọi ĐỒNG BỘ trước bcrypt.
  Route `POST /login` gọi `giuLuot` → bcrypt async (`bcrypt.compare`, băm giả khi không có tên) → 401 chung → câu "vô hiệu" chỉ khi mật khẩu đúng.
- Phần giao diện (G): đọc `Login.jsx` + `api.js` thấy ĐÃ đúng (catch hiện `err.message`, không xoá ô, chỉ 401 có code trong `SESSION_DEAD_CODES` mới đá về
  /login, 429 không vào) → KHÔNG sửa client, không build `dist`; G khoá bằng phép tĩnh (đột biến VS-XOA-O-GO, VS-429-PHIEN-CHET, VS-429-DA-VE-LOGIN bắt).
- Quyết định nhỏ ghi lại (không phải câu hỏi nghiệp vụ): cửa sổ 15 phút tính từ LẦN THỬ ĐẦU của cặp/IP (cố định, không trượt); lần gõ đúng trả lại lượt IP
  đã giữ nên quầy đăng nhập đúng nhiều lần không bị tính; mục đầy trần thì bỏ mục cũ nhất.

## Bài thử đỏ
`viec/DANG-NHAP-2/bang_chung_do.txt` — `cong_cu/thu_DANGNHAP2.js` trên gốc `c7ee1bb`: 22 đạt · 23 hỏng; sau vá: 47 đạt · 0 hỏng.
Khác phiếu I một điểm: bài dựng router thật + express trong CÙNG tiến trình (kho thử tạm, đếm `bcrypt.compare`, lệch `Date.now` để qua 15 phút) thay vì
tiến trình con chạy `server/index.js` — vì cần đếm số lần so bcrypt và đẩy giờ; phép tĩnh H4 canh `app.set('trust proxy', 1)` ở `server/index.js` đứng trước route auth.

## Bảng chỗ vá → đột biến (`viec/DANG-NHAP-2/dot_bien.py`, 23 đột biến, 23 BẮT · 0 SỐNG · 0 HỎNG · 0 LẠC)
| Chỗ vá | Đột biến |
|---|---|
| `auth.js` giữ lượt trước khi so | BV-GIU-LUOT · VS-GIU-SAU-SO |
| `auth.js` băm giả khi không có tên | BV-BAM-GIA |
| `auth.js` câu chung cho tài khoản khoá + sai mật khẩu | VS-CAU-KHOA-RIENG · VS-KHOA-DUNG-CHUNG |
| `auth.js` IP lấy từ `req.ip` | VS-IP-GIA |
| `auth.js` mã 429 không phải mã phiên chết | VS-MA-PHIEN-CHET |
| `auth.js` đúng thì xoá đếm | BV-XOA-DEM-DUNG |
| `gioiHanDangNhap.js` ngưỡng cặp 5 | VS-5-THANH-6 · VS-5-THANH-4 |
| ngưỡng IP 20 + đếm theo IP | VS-20-THANH-21 · BV-DEM-IP |
| khoá theo CẶP (không theo tên toàn cục) | VS-KHOA-THEO-TEN |
| lần đúng trả lại lượt IP | BV-HOAN-IP |
| số phút làm tròn lên | VS-LAM-TRON-XUONG |
| chuẩn hoá tên (trim + chữ thường) | VS-TEN-TRIM · VS-TEN-HOA-THUONG |
| dọn mục quá hạn | BV-DON-QUA-HAN |
| trần số mục | BV-TRAN-MUC |
| `Login.jsx` / `api.js` (khoá, không sửa) | VS-XOA-O-GO · VS-429-PHIEN-CHET · VS-429-DA-VE-LOGIN |
| nối vào `kiem_tra_truoc_khi_giao.js` | BV-NOI-BO-KIEM |

Tên đột biến (đủ 23): BV-GIU-LUOT, VS-GIU-SAU-SO, BV-BAM-GIA, VS-CAU-KHOA-RIENG, VS-KHOA-DUNG-CHUNG, VS-IP-GIA, VS-MA-PHIEN-CHET, BV-XOA-DEM-DUNG,
VS-5-THANH-6, VS-5-THANH-4, VS-20-THANH-21, BV-DEM-IP, VS-KHOA-THEO-TEN, BV-HOAN-IP, VS-LAM-TRON-XUONG, VS-TEN-TRIM, VS-TEN-HOA-THUONG, BV-DON-QUA-HAN,
BV-TRAN-MUC, VS-XOA-O-GO, VS-429-PHIEN-CHET, VS-429-DA-VE-LOGIN, BV-NOI-BO-KIEM.

## Phát hiện (ngoài phạm vi / để chủ quán biết)
- Bộ đếm nằm trong bộ nhớ: máy chủ Render khởi động lại (hoặc ngủ rồi dậy) thì đếm về 0 — người dò có thể thử tiếp 5 lần sau mỗi lần máy dậy. Chấp nhận (phiếu F).
- Nhiều bản máy chủ chạy song song thì mỗi bản đếm riêng (Render hiện một bản).
- `POST /login` còn `catch` trả `err.message` thô ở 500 (lộ lỗi nội bộ, trái LUAT_XAY_APP §4) — thuộc vùng đang sửa nhưng chưa chạm ở việc này; xem mục Câu hỏi/đề xuất ở báo cáo.
- Đường đổi mật khẩu / đặt lại mật khẩu (trong `auth.js` và trang Nhân viên) KHÔNG nằm trong phiếu — chưa kiểm xem có cần cùng giới hạn.
- `thu_BH2.js` G1 đỏ oan trên kho nông (`git lỗi: cbbb809`) — máy mây mở dạng nông thì phải `--unshallow` trước khi chạy `npm test`.

## Soát độc lập (/ra-soat, vòng 1) — NGUYÊN VĂN TÓM TẮT
ĐẠT (có ghi chú nhẹ, không lỗi chặn). Agent chạy lại bài 47 đạt · 0 hỏng và đột biến BV-GIU-LUOT (bắt ở A1b); 22 đột biến còn lại chỉ đọc kết luận.
NGHIỆM THU: 9/9 mục (A–I) có bằng chứng · mục thiếu: không.
NGHI NGỜ nhẹ (đã ghi thành Phát hiện, không sửa):
- (a) `req.ip` đúng khi chỉ MỘT tầng proxy trước POS (`server/index.js:57`, chú thích 54-56 ghi chưa kiểm số tầng của Render). Nếu có thêm tầng (vd Cloudflare)
  thì mọi người chung vài IP và ngưỡng IP 20/15 phút thành khoá chung cả quán → CHỦ QUÁN/CHAT kiểm trên production trước khai trương.
- (b) Kẻ dò từ rất nhiều IP có thể làm đầy 5000 mục và đẩy mục cũ (kể cả mục khoá của chính nó) ra ngoài — rủi ro thấp, nằm trong "chấp nhận" của phiếu F.
- (c) Tài khoản khoá + đúng mật khẩu → 401 "vô hiệu" nhưng lượt vẫn tính (không gọi `dangNhapDung`) — chủ ý, ảnh hưởng nhỏ.
- Đường song song ngoài Phạm vi cùng dạng "dò mật khẩu không giới hạn" (cần token): `PUT /password` (`server/routes/auth.js` ~157) và `datPinChuQuan` (`server/utils/pinChuQuan.js:41`).
- Ca A1c / A3 phụ thuộc đồng hồ thật nhẹ (cần < 1 phút / < 30 giây từ lần thử đầu — thực tế vài giây).
CHƯA SOÁT ĐƯỢC: hành vi trên Render thật (số tầng proxy, độ trễ bcrypt); hash cũ trong Turso (cost ≠ 10 làm thời gian băm giả lệch nhẹ).
BÀI HỌC (agent đề xuất): K5 xác nhận số tầng proxy trước khi khoá theo IP · K4 rà các đường "xác minh mật khẩu" khác khi thêm giới hạn cho login.
