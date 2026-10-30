# BH-2 — Màn Bán hàng mới đợt 2: thu tiền thật (QR payOS · PIN · giữ tiền) · giá hạng + ưu đãi máy chủ tính · màn kết thúc in hoá đơn HD-1 · menu 6 mục

<!-- Phiếu do chat soạn 29.10.2026. Việc thường [Th] — Sonnet, chạy thẳng tới hết. Nền: main sau khi HD-1 gộp (sổ v45+).
     Đặc tả: ban_mau_pos/DAC_TA_BAN_HANG_2410.md mục 1 (đọc HẾT — chủ quán đã duyệt, đừng hỏi lại bố cục). Đợt 1 (BH-1, PR #45) đã dựng màn mới
     trên API sẵn có, bật theo công tắc TỪNG MÁY (BanHang/index.jsx, mặc định TẮT = màn cũ Sales.jsx). Việc này nối màn mới vào các API tiền
     đã gộp: P3 (server/routes/thanh-toan.js gắn ở /api/pos/thanh-toan: POST /phien, GET /phien/:id, POST /phien/:id/chot ·
     /phien/:id/huy · /phien/:id/xac-nhan-tay (quyền xac_nhan_ck_tay), POST /pin — QR payOS + PIN + giữ tiền; phiên hết hạn theo het_han máy chủ trả), UUDAI-1 (POST /orders/tinh-thu:
     máy chủ tính giá hạng + mã, trả cach / ma_loi / ma_loi_code), HD-1 (GET /api/pos/hoa-don/:id + thành phần in 2 tờ + tem, client/src/utils/
     hoaDon.js, client/src/utils/veQr.js). KHÔNG đổi luật tiền nào ở máy chủ — chỉ GỌI đúng đường.
     Chạy SONG SONG: KH-API-2 (orders.js vùng giá hạng, Settings.jsx), KHO-2a (server/kho, pages/Kho), COMBO-1a (máy chủ combo) — giữ đúng Cấm.
     TÁCH khỏi BH-2 (đã ghi sổ): COMBO-1b làm SAU COMBO-1a; topping (TOPPING-1), đổi điểm (P3b), giao Ahamove (GIAO-1) mỗi việc tự làm phần
     màn của mình SAU BH-2; giá từng hạng ở màn Sản phẩm (Settings.jsx) để BH-3 sau khai trương. -->

## Mục tiêu
Màn Bán hàng mới thu tiền thật đúng luật (không công nợ, chuyển khoản chỉ qua QR payOS máy chủ tự xác nhận, trừ tài khoản / đổi điểm phải có
PIN, giữ rồi mới trừ), hiện đúng giá hạng và ưu đãi do máy chủ tính, kết thúc bằng màn in hoá đơn HD-1; menu POS gọn còn 6 mục. Chủ quán bật
màn mới trên máy quầy khi thử đạt. Phải xong trước khai trương.

## Nghiệm thu
- A **Giá do máy chủ tính:** chọn khách / đổi giỏ / nhập mã → gọi `POST /orders/tinh-thu` (giỏ đổi nội dung tính tiền mới gọi lại, gõ ghi
  chú KHÔNG gọi); lưới + giỏ hiện giá gốc GẠCH + giá hạng (DAC_TA 1.5), dòng ưu đãi + câu máy chọn cách nào (1.6); `ma_loi` → dòng "Mã
  không áp: …". Chưa có số máy chủ thì nút thu tiền chưa sáng (đúng luật UUDAI-1: không thu theo số tự tính). Món giá 0 / chưa có giá →
  "Chưa có giá", không chạm được (sửa lỗi cũ "0đ").
- B **Tiền mặt** (1.9): dãy tờ "Đúng tiền / tờ lớn hơn" ghi sẵn "trả lại …", "Số tiền khác…" bàn phím có 000, "Đã nhận tiền" chỉ sáng khi đủ.
- C **Chuyển khoản = QR payOS** (1.10): tạo phiên `POST /phien` → hiện QR (vẽ bằng `veQr.js`) + số tiền + đếm ngược tới `het_han` máy chủ trả; tự hỏi
  `GET /phien/:id` tới khi máy chủ báo đã nhận → sang màn kết thúc; hết hạn / Huỷ → `POST /phien/:id/huy`, quay về giỏ, không mất giỏ. KHÔNG có nút "đã nhận CK" cho nhân viên;
  "Xác nhận tay" chỉ hiện với quyền `xac_nhan_ck_tay`, gọi `POST /phien/:id/xac-nhan-tay`, bắt buộc lý do. Không trộn tiền mặt + chuyển khoản trong một đơn.
- D **Tài khoản khách + PIN + giữ tiền** (1.11–1.13): khách có số dư → dòng "Trừ tiền tài khoản −X" có nút Bỏ; tài khoản mẹ là dòng riêng mặc
  định tắt; đủ thì chỉ còn "Trả đủ bằng tài khoản"; không đủ → phần còn lại trả tiền mặt / QR (sửa lỗi "không còn nút nào"). Có trừ tài
  khoản → màn nhập PIN 4 số (xoay về khách), gọi `POST /pin`; sai 5 lần → báo khoá 15 phút, quay về giỏ; khách chưa có PIN → đặt tại quầy (gõ 2
  lần) hoặc bỏ trừ tài khoản. Giữ → chốt / nhả đúng theo phiên (`/phien/:id/chot`, `/phien/:id/huy` — máy chủ làm, màn chỉ gọi).
- E **Màn kết thúc** (1.16): "Đã thanh toán · đơn #<số>", ô "Trả lại khách" chữ to (tiền mặt), tab Tờ khách / Tờ lưu / Tem ly vẽ bằng thành
  phần HD-1 từ `GET /api/pos/hoa-don/:id`, chọn 2 tờ (mặc định) hoặc 1 tờ cho riêng đơn này, nút "In hoá đơn (2 tờ) + N tem"; lưới khoá tới
  khi bấm In; sau đó "Đơn mới" hoặc chạm món là đơn mới. Hoá đơn CHỈ in khi đã thanh toán thành công.
- F **Menu 6 mục** (chủ quán duyệt 27.10, CHỈ dời đường dẫn — không xoá màn nào, không đổi màn nào): máy tính: **Bán hàng · Hôm nay · Đơn
  hàng · Khách hàng · Kho · Quản lý**; điện thoại: **Bán hàng · Hôm nay · Đơn · Khách · Thêm**. "Hôm nay" = mở màn Báo cáo / Đối soát đang
  có ở ngày hôm nay. "Đơn hàng" có lối sang Hoàn tiền; "Khách hàng" có lối sang Số dư. "Quản lý" = trang lưới ô dẫn tới: Sản phẩm & công thức
  (Kho) · Nguyên liệu (Kho) · Khuyến mãi & thành viên (Mã chiết khấu + hạng trong Cài đặt) · Con người (người dùng trong Cài đặt) · Báo cáo ·
  Cài đặt (Cài đặt + Cài đặt hoá đơn). "Đăng ký mới" BỎ khỏi menu (đường cũ vẫn mở được). Quyền giữ nguyên như từng mục cũ.
- G **K5:** màn cũ `Sales.jsx` (công tắc TẮT) chạy y như hôm nay; mọi đường máy chủ không đổi; bản in HD-1 không đổi.

## Phạm vi
- viec/BH-2/**
- client/src/pages/BanHang/**
- client/src/pages/QuanLy/**
- client/src/components/Layout.jsx
- client/src/App.jsx
- client/src/utils/api.js
- client/dist/**
- cong_cu/thu_BH2.js
- cong_cu/thu_BH1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_BH2.js` ĐỎ trên code gốc: hàm thuần của màn (giỏ → thân `tinh-thu`, chỉ gọi lại khi nội dung tính tiền đổi; tờ tiền + trả lại;
nút thu chỉ sáng khi có số máy chủ; trừ tài khoản không đủ → còn nút trả phần còn lại; luồng PIN sai 5 lần; luồng QR hết hạn → nhả; menu 6 mục
theo quyền) + ca trên kho thử gọi thật `/orders/tinh-thu`, `/phien` (payOS giả lập như bài P3), `/pin`, `/hoa-don/:id`.

## Bài thử cũ sửa
- cong_cu/thu_BH1.js — chỉ ca đổi vì màn mới gọi máy chủ thay cho số tự tính (ghi ở bang_chung_do.txt); ca khác giữ

## Ngân sách
~900 dòng giao diện (sửa + mới) + ~450 dòng thử. `Layout.jsx` / `App.jsx`: chỉ xếp lại mục menu + route trang Quản lý.
**Phương án đơn giản nhất đã xét:** sửa tiếp màn cũ Sales.jsx — không chọn: chủ quán đã duyệt màn mới (DAC_TA 24.10), BH-1 đã dựng.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Cấm
- KHÔNG sửa bất kỳ file nào dưới `server/` (mọi đường đã có; thiếu gì → ghi Câu hỏi, dừng). KHÔNG sửa `client/src/pages/Sales.jsx`,
  `client/src/pages/Settings.jsx`, `client/src/pages/InvoiceSettings.jsx`, `client/src/pages/Kho/**`, `client/src/components/Invoice*`,
  `client/src/utils/hoaDon.js`, `client/src/utils/veQr.js` (chỉ GỌI), `app_kh/**`.
- KHÔNG làm combo (COMBO-1b), topping (TOPPING-1), đổi điểm (P3b), giao Ahamove (GIAO-1), giá từng hạng ở màn Sản phẩm (BH-3).
- KHÔNG bật màn mới mặc định trên mọi máy — công tắc từng máy giữ mặc định TẮT; chủ quán tự bật trên quầy.
- Mặc định: không sửa tu_chay/, .claude/, .github/, sổ việc. Chỉ push `git push -u origin viec/BH-2`. Không đụng main, không merge,
  không tạo PR.
