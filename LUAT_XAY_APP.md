# Luật xây app Tứ Quý Đường — POS · SX · App KH

<!-- Chủ quán chốt 17.10.2026. Bản GỐC ở kho POS; kho App KH (`tuquyduong/APP-KH`) chép theo. CLAUDE.md nạp file này vào MỌI phiên (@LUAT_XAY_APP.md). Máy KHÔNG sửa file này (hiện là lời
     dặn, người gác chưa khoá — thêm vào file luật ở việc khung sau); muốn đổi thì ghi Phát hiện, chủ quán duyệt, chat ghi. Khi hai luật mâu thuẫn: an toàn tiền & dữ liệu khách >
     đúng > đơn giản > nhanh. -->

## 1. Tôn chỉ — 7 tiêu chí cho mọi việc
1. **Chất lượng trước hết.** App dùng lâu dài; không cắt chất lượng để kịp giờ.
2. **Đơn giản.** Trước khi chốt phiếu / kế hoạch / code / báo cáo, tự hỏi "có cách đơn giản hơn mà vẫn đúng không?". Có thì dùng.
3. **Thông minh, tối ưu.** Dùng lại cái đã có trước khi viết mới; một truy vấn đủ thì không viết ba; không tối ưu sớm khi chưa đo.
4. **Đồng bộ.** Mỗi dữ liệu một nguồn sự thật, mỗi quy tắc một chỗ (mục 2). Ba hệ nói cùng một thứ tiếng (cùng tên, cùng mã lỗi).
5. **Tập trung tính năng.** Bám đúng mục tiêu của việc và mốc trong `LICH_KHAI_TRUONG.md`. Việc khác chưa cần → ghi Phát hiện.
6. **Rà kỹ lỗi.** Bài thử đỏ trước khi vá; đụng tiền thì có đột biến + đối chứng; cổng PR tự chạy được trước khi báo xong.
7. **Dễ sửa, dễ nâng cấp.** Code xếp ngăn nắp, tên rõ, mỗi phần một việc (mục 3) — người sau mở ra là biết sửa ở đâu.

## 2. Kiến trúc đồng bộ — ai giữ dữ liệu gì
| Dữ liệu | Nguồn sự thật | Hệ khác |
|---|---|---|
| Nguyên liệu, sản phẩm = công thức, lô, tồn kho, hạn dùng, phiếu kho | **POS** (`server/kho/`, từ KHO-1) | Tới KHO-3 bán vẫn trừ kho qua SX (`server/utils/sxApi.js`); sau KHO-3 tắt SX. App KH không gọi SX |
| Giá bán, khách, đơn, tiền, ví, điểm, gói, mã giảm, voucher | **POS máy chủ** | App KH đọc / ghi CHỈ qua `/api/kh/*` của POS |
| Kết quả trắc nghiệm thể trạng (bản rút gọn), đánh giá Google (cài đặt, lời mời, ghi chép, đọc / trả lời Google) | **POS** | App KH chỉ làm giao diện khách + gửi thông báo khi POS nhờ |
| Ảnh / chữ trang trí, phiên đăng nhập, đăng ký nhận thông báo, nhắc việc | kho dữ liệu nhỏ của App KH | không tiền, không dữ liệu khách, không giá / tồn / điểm |
- **Cổng `/api/kh` = hợp đồng `HOP_DONG_API_KH.md`** (nguồn duy nhất, có `PHIEN_BAN`). PR nào đổi cửa dưới `/api/kh` (`server/routes/kh/index.js`,
  `loi.js`, `server/middleware/khachAuth.js`, hàm tạo dữ liệu trả cho App KH) → CÙNG PR sửa hợp đồng + tăng `PHIEN_BAN` + ghi nhật ký cuối file.
  Không xoá / đổi tên trường đang dùng; buộc phải thì giữ trường cũ song song ít nhất một đợt và báo App KH bằng file. Bài thử
  `cong_cu/thu_HOPDONG_KH.js` (từ KH-API-2) canh hợp đồng khớp code.
- **Sổ quyết định `QUYET_DINH_CHU_QUAN.md`:** đọc TRƯỚC khi lập kế hoạch; lệch với file khác → sổ này thắng, ghi Phát hiện. Máy không sửa.
- **Quy tắc tiền chỉ nằm ở máy chủ POS.** Màn hình (quầy lẫn App KH) chỉ hiển thị và gửi yêu cầu; máy chủ tự tính lại, không tin số màn hình gửi.
- **Một quy tắc — một hàm.** Tính đã trả, trần hoàn, gói, mã… đã có hàm chung trong `server/utils/` thì GỌI hàm đó; không chép công thức.
- **Mã lỗi dùng chung.** Lỗi MỚI trả `{ error: '<lời tiếng Việt cho người dùng>', code: 'MA_IN_HOA' }`; cùng tình huống → cùng `code` ở mọi
  route (lỗi cũ chưa có `code` thì thêm khi chạm tới).
- **Thời gian = giờ Việt Nam (UTC+7) ở MỌI hệ thống** (chủ quán chốt 28.10): ghi, so, trả ra đều qua `getNow` (`server/utils/helpers.js`; Render
  chạy UTC), định dạng `YYYY-MM-DDTHH:mm:ss` không hậu tố. KHÔNG ghi `CURRENT_TIMESTAMP` / `datetime('now')`, KHÔNG so giờ lưu với
  `Date.now()` trần. App KH lấy "bây giờ" từ máy chủ POS, không tin đồng hồ điện thoại. Số tiền là số nguyên đồng.

## 3. Bố trí code — đơn giản để sửa và nâng cấp
- **Máy chủ POS** `server/`: `routes/<tài-nguyên>.js` chỉ nhận yêu cầu, kiểm quyền, gọi hàm; quy tắc nghiệp vụ dùng lại ở ≥ 2 chỗ → `utils/<tênViệc>.js`;
  truy cập CSDL qua `database.js`. Route khách: `routes/kh/*.js`, mount một chỗ tại `/api/kh`.
- **Quầy** `client/src/`: `pages/` một màn một file, `components/` phần dùng lại; code MỚI gọi máy chủ qua `utils/api.js` (vài màn cũ còn
  `fetch` trực tiếp — chuyển dần khi chạm tới, không mở việc riêng).
- **Mục nghiệp vụ mới** (chủ quán chốt 27.10, kho làm trước): `server/<mục>/` gồm `duong.js` (đường nối), `tinh.js` (phép tính thuần,
  có bài thử), `duLieu.js` (đọc / ghi CSDL); giao diện `client/src/pages/<Mục>/`. Phần cũ chuyển dần theo mục SAU khai trương.
- **Nâng cấp dữ liệu** (từ KHO-1): mỗi lần đổi cấu trúc là một bước đánh số `server/nang_cap/NNN_<ten>.js`, chỉ THÊM, tự sao lưu bảng
  cũ trước bước đụng nó; thông tin riêng của quán nằm trong Cài đặt / hằng số có tên (để đóng gói cho quán khác).
- **App KH** ở kho GitHub riêng `tuquyduong/APP-KH` (chat App KH); kho POS không còn phần giao diện App KH — chỉ giữ cửa `/api/kh`.
  KHÔNG sửa `app_kh/` (bản cũ, xoá khi app mới chạy). Trao đổi hai chat chỉ bằng file qua chủ quán (`YEU_CAU_APPKH_*.md` / `TRA_LOI_POS_*.md`).
- Tên hàm / biến mới: tiếng Việt không dấu, rõ nghĩa (`tinhDaTra`, `layDiemKhach`); một hàm làm một việc. File sắp vượt ~500 dòng → tách
  theo việc, KHÔNG tách theo kích thước.
- Hằng số cấu hình (trần, hạn, hệ số) đặt một chỗ có tên; không rải số trong code. Không để code chết, không chú thích số dòng cứng.
- Thư viện mới chỉ khi tự viết dài hơn ~50 dòng hoặc kém an toàn hơn, và phiếu cho phép.

## 4. Bảo mật
- Mọi route có xác thực đúng loại: **nhân viên** (JWT quầy + `checkPermission`), **khách** (token khách riêng của `/api/kh`), **SX ↔ POS** (khoá API).
  Không route nào "tạm mở".
- **Khách chỉ thấy dữ liệu của mình:** lấy `khach` từ token, KHÔNG từ tham số / thân yêu cầu. Bài thử phải có ca "khách A đọc / sửa của khách B → 403".
- Đăng nhập, nhận mã, đặt đơn từ App KH: giới hạn số lần thử theo SĐT + IP; mã bill không đoán được.
- Không trả ra ngoài: giá vốn, khoá, token người khác, dữ liệu khách khác, lỗi nội bộ (chỉ `error` + `code`).
- Bí mật chỉ ở Secrets / biến môi trường, không bao giờ trong code, `.replit`, log hay báo cáo.

## 5. Tiền
- Mọi lệnh ghi tiền / ví / điểm / gói / kho / lượt mã trong MỘT giao dịch; điều kiện chặn đua viết ngay trong câu ghi và kiểm `changes`.
- Đơn từ App KH đi đúng đường tạo đơn của quầy (cùng hàm, cùng kiểm), không viết đường tắt.
- Tính năng tiền mới phải kèm quy tắc đối soát (ngày / tuần / tháng) — đưa vào màn Đối soát.
- Quyết định tiền của chủ quán ghi ở sổ việc và `CLAUDE.md`; không tự đổi.

## 6. Rà lỗi — trước khi báo xong
1. Bài thử ĐỎ trên code gốc, XANH sau vá (`bang_chung_do.txt`, đủ dòng `SỐ CA` cho MỌI bài thử đổi).
2. Việc tiền / bảo mật: đột biến VS- + BV- cho mỗi chỗ vá, có đối chứng; ca K5 cho đường hợp lệ (không chặn oan).
3. `npm test` và `--day-du` xanh; **`node tu_chay/cong.js chay` ĐẠT** — ghi kết quả vào `trang_thai.md`.
4. Giao diện: ghi đúng 1–3 thao tác để chủ quán thử tay trên điện thoại.
5. Soát độc lập `/ra-soat`; tối đa 3 vòng sửa. **Hết 3 vòng (chủ quán chốt 29.10 — luật này thắng bước 8 của `/lam-viec`):**
   - Lần soát cuối chỉ còn lỗi NHẸ — không đụng tiền / điểm / ví, không lộ thông tin, không ngoài Phạm vi, không file Cấm → KHÔNG hỏi
     chủ quán "sửa ở đâu": làm luôn **vòng sửa 4** ngay trong phiếu (chỉ đúng các lỗi lần soát nêu + ca thử + đột biến), chạy bài thử,
     `--day-du`, cổng, ghi `SOÁT LẦN CUỐI: chat soát thay` + báo cáo 7 mục, push, DỪNG. Không gọi agent soát nữa; chat soát thay.
   - Còn lỗi tiền / điểm / ví / bảo mật / ngoài Phạm vi → dừng, ghi `## Câu hỏi` như cũ.
6. **Trường hợp chỉ còn trong dữ liệu cũ** (vd đơn nợ trước khi bỏ ghi nợ): chọn cách an toàn nhất — hiện đúng như dữ liệu, không hứa
   điểm / tiền / mã — ghi một dòng Phát hiện, KHÔNG dừng hỏi. Câu nào `QUYET_DINH_CHU_QUAN.md` đã trả lời thì không hỏi lại.
7. **Bài thử cũ khoá ĐÚNG danh sách trường** (danh sách trắng) mà phiếu thêm trường mới → được sửa đúng các dòng danh sách đó để thêm
   trường phiếu ghi (vẫn so BẰNG, không nới thành "có ít nhất"), ghi `SỐ CA` như luật; KHÔNG dừng hỏi xin thêm vào Phạm vi (chủ quán
   chốt 29.10).
8. **Bài thử cũ phải đổi vì hành vi ĐÃ ĐƯỢC CHỦ QUÁN DUYỆT đổi** → là bài SỬA bình thường (bản mới đỏ trên code gốc, xanh trên code mới,
   ghi `SỐ CA`), KHÔNG ghi vào `## Bài thử cũ sửa` — mục đó chỉ dành cho bài cũ đổi mà VẪN XANH trên gốc (HOC-1 d bắt bản gốc phải xanh;
   vụ KHO-2a cổng A11, 29.10).

## 7. Nhịp làm việc tới khai trương (07.11.2026)
- Việc **tiền / bảo mật**: phiếu có "Chờ duyệt kế hoạch". Việc **thường** (giao diện, in, dọn, hạ tầng): chạy thẳng tới hết, không dừng chờ duyệt.
- Bộ khung tự chạy ĐÓNG BĂNG sau TU-CHAY-8 tới khai trương; phát hiện về khung → ghi lại, làm sau. (Ngoại lệ chủ quán duyệt 30.10:
  KHUNG-KEO-1, tu-chay 1.8.1 — máy tự tải thêm lịch sử khi phiên mở từ bản chụp cũ, không dừng hỏi.)
- Hết việc trong phiếu là dừng; không tự mở việc mới.

## 8. Nói với chủ quán (chủ quán chốt 29–30.10 — áp cho MỌI chat và MỌI máy, POS · SX · App KH)
1. **Luôn luôn dễ hiểu.** Lời thường, ít thuật ngữ; chữ kỹ thuật bắt buộc dùng thì giải thích bằng một câu đời thường. Mỗi lần nói rõ
   "việc này là gì" rồi "bạn cần làm gì" (dán gì, bấm gì, theo thứ tự). Cần chủ quán quyết: giải thích dễ hiểu + nêu đề xuất của mình để
   chủ quán chỉ cần xác nhận. Xưng "mình" – "bạn". Máy: câu trả lời cuối phiên mở đầu bằng 2–3 câu lời thường (đã làm gì, kết quả ra sao,
   bạn cần làm gì) trước phần chi tiết.
2. **Đã quyết thì ghi, không hỏi lại.** Điều chủ quán đã quyết → chat ghi vào `QUYET_DINH_CHU_QUAN.md` / file này ở lần ghi sổ kế tiếp.
   Câu đã có trả lời ở hai file đó thì máy và chat không hỏi lại.
3. **Duyệt hai lượt mỗi ngày.** Chat gom việc của chủ quán thành 2 lượt: **sáng** (một danh sách dán / bấm để các máy chạy cả ngày) và
   **tối** (xem kết quả, Merge). Chuyện luật đã có cách xử lý an toàn thì máy tự xử lý, không dừng hỏi; chỉ dừng khi đụng tiền / điểm /
   ví / dữ liệu khách / bảo mật / ngoài Phạm vi, hoặc luật chưa có câu trả lời.
