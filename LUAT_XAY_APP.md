# Luật xây app Tứ Quý Đường — POS · SX · App KH

<!-- Chủ quán chốt 17.10.2026. CLAUDE.md nạp file này vào MỌI phiên (@LUAT_XAY_APP.md). Máy KHÔNG sửa file này (hiện là lời
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
| Sản phẩm sản xuất, lô, tồn kho, hạn dùng | **SX** | POS đọc qua `server/utils/sxApi.js`; App KH không gọi SX |
| Giá bán, khách, đơn, tiền, ví, điểm, gói, mã giảm, voucher | **POS máy chủ** | App KH đọc / ghi CHỈ qua `/api/kh/*` của POS |
| Nội dung trình bày (ảnh, mô tả, bài viết) | App KH | không chứa giá, tồn, điểm |
- **Quy tắc tiền chỉ nằm ở máy chủ POS.** Màn hình (quầy lẫn App KH) chỉ hiển thị và gửi yêu cầu; máy chủ tự tính lại, không tin số màn hình gửi.
- **Một quy tắc — một hàm.** Tính đã trả, trần hoàn, gói, mã… đã có hàm chung trong `server/utils/` thì GỌI hàm đó; không chép công thức.
- **Mã lỗi dùng chung.** Lỗi MỚI trả `{ error: '<lời tiếng Việt cho người dùng>', code: 'MA_IN_HOA' }`; cùng tình huống → cùng `code` ở mọi
  route (lỗi cũ chưa có `code` thì thêm khi chạm tới).
- **Thời gian** dùng `getNow` (`server/utils/helpers.js`; Render chạy UTC); số tiền là số nguyên đồng.

## 3. Bố trí code — đơn giản để sửa và nâng cấp
- **Máy chủ POS** `server/`: `routes/<tài-nguyên>.js` chỉ nhận yêu cầu, kiểm quyền, gọi hàm; quy tắc nghiệp vụ dùng lại ở ≥ 2 chỗ → `utils/<tênViệc>.js`;
  truy cập CSDL qua `database.js`. Route khách: `routes/kh/*.js`, mount một chỗ tại `/api/kh`.
- **Quầy** `client/src/`: `pages/` một màn một file, `components/` phần dùng lại; code MỚI gọi máy chủ qua `utils/api.js` (vài màn cũ còn
  `fetch` trực tiếp — chuyển dần khi chạm tới, không mở việc riêng).
- **App KH** `app_kh/` (cùng kho POS): `src/pages/`, `src/components/`, `src/api.js` (chỗ duy nhất gọi `/api/kh`), `src/giaoDien/` (màu,
  chữ, khoảng cách dùng chung). Giao diện theo bản demo chủ quán đã chốt; di động trước; tiếng Việt có dấu.
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
5. Soát độc lập `/ra-soat`; tối đa 3 vòng sửa, quá thì dừng hỏi.

## 7. Nhịp làm việc 14 ngày (17–30.10.2026)
- Việc **tiền / bảo mật**: phiếu có "Chờ duyệt kế hoạch". Việc **thường** (giao diện, in, dọn, hạ tầng): chạy thẳng tới hết, không dừng chờ duyệt.
- Bộ khung tự chạy ĐÓNG BĂNG sau TU-CHAY-8 tới khai trương; phát hiện về khung → ghi lại, làm sau.
- Hết việc trong phiếu là dừng; không tự mở việc mới.
