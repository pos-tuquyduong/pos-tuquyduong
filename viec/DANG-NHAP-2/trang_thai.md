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

## Soát bảo mật
Lần 1 (subagent độc lập, chỉ đọc) — 0 lỗi trước lọc · 0 lỗi sau lọc (không có lỗi nào để chạy bước lọc). Báo cáo tóm tắt:
Không có lỗ hổng mức cao / vừa do diff gây ra. Đã kiểm: lách bộ đếm bằng biến thể tên (hoa / thường / khoảng trắng / unicode / mảng / object — cùng một khoá, không ném lỗi);
đồng thời (`giuLuot` đồng bộ, ghi lượt trước `await` đầu tiên → tối đa 5 lần so bcrypt cho một cặp); gõ đúng khi đang khoá vẫn 429; `dangNhapDung` chỉ chạy sau khi đúng mật khẩu
VÀ tài khoản còn hoạt động, chỉ xoá đếm của chính cặp đó và trả đúng một lượt IP (không dùng tài khoản thường để xoá đếm của `admin`); dò tên (tên lạ / sai mật khẩu / khoá + sai → cùng 401 cùng thân,
câu "vô hiệu" chỉ sau khi đúng mật khẩu); băm giả cost 10; trần Map (một IP chỉ tạo tối đa 20 mục mỗi cửa sổ → làm đầy 5000 mục cần hàng nghìn IP); thân lỗi không lộ gì ngoài số phút.
Ghi chú thấp (không báo lỗi): IPv6 /64 xoay địa chỉ tự do — vốn có của thiết kế "theo IP"; nếu trước POS còn thêm một tầng proxy thì xô 20 lần/IP dùng chung cả quán
(đã ghi ở Phát hiện (a) để chủ quán kiểm trên production).
SOÁT BẢO MẬT: ĐẠT

## Cổng chạy
✓ CỔNG CHẠY ĐẠT   (`node tu_chay/cong.js chay . c7ee1bb^ HEAD viec/DANG-NHAP-2`, cây sạch, HEAD fbbdcfec; lần đầu đỏ A16 vì dòng `SỐ CA` thiếu đường dẫn
`cong_cu/` và số ca gốc 45 ≠ 47 — đã sửa bằng commit b4bf3887 + fbbdcfec rồi chạy lại.)
Kiểm khác: `npm test` → PASS 114 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn); `dot_bien.py` → 23 đột biến · 23 BẮT. Không sửa `client/src/` nên không build `dist`, không cần `--day-du` cho phần client.

## Bài học
- **KHOÁ 1 (đã làm, trong Phạm vi):** bài thử phải in ĐỦ SỐ CA kể cả khi thứ nó thử chưa tồn tại (F2/F3 đỏ khi thiếu module) — cổng A16 so số ca gốc với head;
  `thu_DANGNHAP2.js` có sẵn. Đột biến 23/23 bắt.
- **NGUYÊN TẮC 1 (đề xuất, ngoài Phạm vi — chat soát duyệt):** K5 — khoá theo IP thì phải xác nhận số tầng proxy thật trước (`req.ip` sai = khoá chung cả quán); K4 — thêm giới hạn cho
  đăng nhập thì rà các đường "xác minh mật khẩu" khác (`PUT /auth/password`, `datPinChuQuan` ở `pinChuQuan.js:41`) — đề xuất mở việc riêng.
- **BỎ 2:** (1) `thu_BH2.js` G1 đỏ oan trên kho nông — một lần, môi trường máy mây (cách xử lý đã ghi ở Bước 1); (2) vài lệnh bị người gác chặn vì cú pháp (`cd … &&` chung lệnh khác, biến trong đường dẫn) — viết lại đơn giản là xong.

## Đếm nghiệm thu (phiếu A–I)
A: ca A1–A8 · B: B1–B2 · C: C1–C6 (C5/C6 là luồng hợp lệ K5) · D: D1–D3 · E: E1–E9 · F: F0–F4 · G: G1–G5 (phép tĩnh, client không đổi) · H: H1–H4 · I: bài chạy thật + nối bộ kiểm (I1) + đột biến 23/23. 9/9 có bằng chứng.

## Báo cáo 7 mục
```
VIỆC:        DANG-NHAP-2 — Đăng nhập POS: giới hạn gõ sai + câu báo chung
ĐÃ SỬA:      server/utils/gioiHanDangNhap.js (mới, ~60 dòng — bộ đếm trong bộ nhớ, 5 lần/15 phút theo cặp tên+IP, 20 lần/IP, có trần + dọn) ·
             server/routes/auth.js:20-60 (giữ lượt trước bcrypt, bcrypt.compare async + băm giả, câu chung 401, "vô hiệu" chỉ khi đúng mật khẩu) ·
             kiem_tra_truoc_khi_giao.js (nối bài) · cong_cu/thu_DANGNHAP2.js (47 ca)
BÀI THỬ:     chạy trên bản chưa vá (c7ee1bb) → ĐỎ 25/47 ca (A1b, A2, B1, C2, D1, E3, E5…); sau khi vá → XANH 47/47; đột biến 23/23 BẮT; npm test PASS 114 · FAIL 0
ĐÃ RÀ K4:    grep "bcrypt.compare" trong server/ → 5 chỗ: auth.js login (đã vá), auth.js PUT /password và pinChuQuan.js:41 (cùng dạng, cần token, NGOÀI Phạm vi → Phát hiện), PIN chủ quán / PIN khách (đã có khoá)
CHƯA KIỂM:   số tầng proxy thật của Render (req.ip có phải IP khách không) · hành vi trên Render sau khi máy ngủ/dậy (đếm về 0) · hash mật khẩu cũ trong Turso có cost 10 không ·
             thử tay trên điện thoại · ngay-sát mốc đúng 15:00 (đồng hồ thật; bài dùng đồng hồ lệch) · bài chạy router trong cùng tiến trình, không phải tiến trình con
GIT:         git log --oneline -2 (xem cuối sổ này)
BÀI HỌC:     KHOÁ 1 · NGUYÊN TẮC 1 (đề xuất) · BỎ 2 — chi tiết ở ## Bài học
```
Thử tay 2 thao tác cho chủ quán: (1) mở màn đăng nhập, gõ SAI mật khẩu 6 lần liền với một tên → lần 6 phải hiện "Gõ sai quá nhiều lần — thử lại sau … phút", ô tên/mật khẩu không bị xoá; (2) trên điện thoại khác (mạng 4G) đăng nhập đúng cùng tên đó → vào bình thường.

HEAD ĐÃ KIỂM: fbbdcfec

## VÒNG 2 (chủ quán 14.11) — IP thật sau Cloudflare
### Bước 1 vòng 2 — đối chiếu bản chụp (14.11.2026)
- Nhánh `viec/DANG-NHAP-2`, cây sạch; `git fetch origin viec/DANG-NHAP-2` → HEAD `5398661` · FETCH_HEAD `5398661` (bằng nhau, không kéo). Kho nông → `git fetch --unshallow`.
- `git log --oneline -3` lúc mở:
  ```
  5398661 PHIEU: DANG-NHAP-2 vong 2 — lay IP that sau Cloudflare (sua MOT cho o cua vao), Pham vi +2 — chu quan 14.11
  cac85b4 GOP-DANG-NHAP-2 gop main 1a71424 (chat 14.11, truoc vong 2 IP that sau Cloudflare)
  1a71424 Merge pull request #93 from pos-tuquyduong/viec/ND-API-1
  ```
### Đã làm (vòng 2)
- Bài thử ĐỎ trước: `cong_cu/thu_DANGNHAP2.js` thêm ca J0–J16 (server/index.js THẬT chạy trong tiến trình con, kho thử tạm) — trên gốc `cac85b4`: 54 đạt · 10 hỏng (J1 J4 J5 J6 J7 J8 J13 J14 J15 J16); sau vá 64 đạt · 0 hỏng. Chi tiết `bang_chung_do.txt`.
- Vá: `server/utils/ipKhach.js` (mới, `ipKhach(req)`: `True-Client-IP` rồi `CF-Connecting-IP`, chỉ nhận MỘT địa chỉ IPv4/IPv6 hợp lệ, không thì `req.ip` như cũ) + MỘT middleware ở `server/index.js` ngay sau `app.set('trust proxy', 1)`, trước `app.use` đầu tiên (ghi đè `req.ip` của yêu cầu).
  Không sửa từng đường: auth.js, /api/kh (giuLuotMenu…), man-khach, /api/nd/dang-nhap tự đúng. Ca J13 chứng minh /api/kh/menu đếm theo IP thật mà không sửa một dòng nào ở đó.
- Đột biến vòng 2 (8, đủ BẮT, đối chứng xanh): BV-IP-THAT-MIDDLEWARE · VS-IP-THAT-SAU-DUONG · VS-IP-TIN-XFF · VS-IP-CAT-DANH-SACH · VS-IP-BO-KIEM-HOP-LE · VS-IP-DAO-UU-TIEN · BV-IP-CF-CONNECTING · BV-IP-BO-IPV6.
  Bảng chỗ vá → đột biến: middleware ghi đè req.ip → BV-IP-THAT-MIDDLEWARE; vị trí middleware → VS-IP-THAT-SAU-DUONG; không tin XFF → VS-IP-TIN-XFF; một địa chỉ hợp lệ → VS-IP-CAT-DANH-SACH, VS-IP-BO-KIEM-HOP-LE; thứ tự ưu tiên → VS-IP-DAO-UU-TIEN; CF-Connecting-IP → BV-IP-CF-CONNECTING; IPv6 → BV-IP-BO-IPV6.
- Commit: 50a7e26 (bài đỏ) · 0063991 (cấu hình khoá khách cho tiến trình con) · c006611 (vá + đột biến + bằng chứng).

## Câu hỏi
**Bài `cong_cu/thu_NDAPI1.js` (NGOÀI Phạm vi) đỏ khi thêm middleware vào `server/index.js` — mình dừng ở đây chờ chủ quán.**
`npm test` → PASS 115 · FAIL 1: `✗ A2 index.js: gắn /api/nd TRƯỚC cors chung; so với gốc chỉ THÊM dòng … — cũ 245 khớp 245 · nd 64 · cors 69 · thêm 10`
(`cong_cu/thu_NDAPI1.js:132-133`: so `server/index.js` với gốc ND-API-1 `bbf5eaf`, cho thêm TỐI ĐA 4 dòng — đúng 4 dòng ND-API-1 + QC-APP-1 đã thêm, nên MỌI dòng thêm vào `index.js` đều làm bài này đỏ.)
Phiếu vòng 2 bắt buộc sửa `server/index.js` (≥ 5 dòng: import + chú thích + middleware) nên không có cách vá mà bài này vẫn xanh. Mình KHÔNG nới phép (K8): ngưỡng 4 là cách bài canh "ND-API-1 không đụng index.js ngoài chỗ gắn", mình không tự quyết nới.
Mình ĐỀ XUẤT (chủ quán chỉ cần xác nhận): cho thêm `cong_cu/thu_NDAPI1.js` vào Phạm vi, đổi đúng hằng `<= 4` ở dòng 133 thành `<= 10` (đúng bằng số dòng đã thêm: 4 cũ + 6 của middleware vòng 2), giữ nguyên mọi phép khác của A2 (dòng cũ còn nguyên, đúng thứ tự, /api/nd trước cors); thêm dòng `SỐ CA` nếu cổng đòi. Sau đó mình chạy tiếp: soát độc lập → soát bảo mật → cổng → báo cáo 7 mục.
Chưa làm: `/ra-soat`, `/soat-bao-mat`, cổng `cong.js chay`, báo cáo 7 mục (chờ trả lời này, vì cổng sẽ đỏ vì A2).
Ghi thêm: `thu_BH2.js` G1 đỏ oan trên kho nông — đã xử lý bằng `--unshallow`.

## Phát hiện (vòng 2 — KHÔNG làm, theo phiếu)
- Đổi mật khẩu (`PUT /auth/password`) và đặt PIN chủ quán (`pinChuQuan.js datPinChuQuan`) chưa giới hạn số lần sai — việc sau.
- `ipKhach` tin `True-Client-IP` / `CF-Connecting-IP` vô điều kiện: nếu ai đó gọi thẳng Render (bỏ qua Cloudflare) thì tự gửi header giả IP được. Phiếu chốt cách này; muốn kín hẳn thì Render chỉ nhận từ dải IP Cloudflare (hạ tầng, ngoài kho).
