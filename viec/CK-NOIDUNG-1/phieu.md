# CK-NOIDUNG-1 — Nội dung chuyển khoản có số hoá đơn: quầy "TQDNOV05 HD0016", App "TQDNOV05 APP0016"; giữ số lúc hiện QR; lưu mã giao dịch ngân hàng

<!-- Phiếu do chat soạn 05.11.2026 (sổ v54). Việc [T] (tiền) — Opus, lập kế hoạch rồi DỪNG chờ duyệt.
     Chủ quán chốt 04–05.11 (chat claude.ai, bàn 32): số hoá đơn ghi luôn trong nội dung CK — giữ số ngay lúc tạo QR; không thành công thì số
     đó HUỶ (dãy số có chỗ trống, mỗi chỗ có lý do); dạng "TQD<THÁNG 3 chữ tiếng Anh><NGÀY 2 số> HD<4 số>" ở quầy, "… APP<4 số>" cho đơn App;
     quầy và App dùng CHUNG một dãy số mỗi ngày (số không bao giờ trùng giữa hai kênh); bill in đúng số đó; bỏ ý cài "Cấu trúc mã thanh toán"
     bên SePay. Mã giao dịch ngân hàng (referenceCode "FT…") lưu vào đơn, in lên bill, hiện ở Đối soát.
     Hiện trạng chat đọc 05.11 trên main 4723a3b: nội dung = 'TQD' + id phiên (server/utils/giuCho.js:66); webhook SePay đọc mã phiên
     (server/utils/sepay.js, server/routes/thanh-toan.js); số đơn sinh LÚC TẠO ĐƠN = MAX+1 trong ngày (taoMaDonTheoSo, server/utils/helpers.js:29,
     dạng ORD-YYYYMMDD-NNN); số bill in to = phần NNN (server/routes/don-mo-rong.js:19); đơn App có mã riêng ở pos_don_app (App gọi bằng mã đó,
     HOP_DONG_API_KH.md); payOS dự phòng giới hạn nội dung ≤ 9 ký tự.
     Thư App KH 05.11 (YEU_CAU_APPKH_GUI_POS_05112026.md): mục 1 (số đơn khách đọc = số bill POS) + mục 3 (câu luật 4xx) gộp vào việc này. -->

**Chờ duyệt kế hoạch:** viết `viec/CK-NOIDUNG-1/ke_hoach.md`, commit, push, rồi DỪNG ở bước 3 của `/lam-viec`.

## Mục tiêu
Sao kê ngân hàng, app ngân hàng của khách, bill và POS cùng một số: nhìn nội dung chuyển khoản là biết ngay hoá đơn nào, ngày nào, quầy hay App.

## Nghiệm thu
- A **Giữ số lúc hiện QR:** phiên QR (quầy và App) được cấp NGAY số hoá đơn tiếp theo của ngày (dãy chung quầy + App, 4 số, đếm lại từ 0001 mỗi
  ngày giờ VN). Hai phiên tạo cùng lúc không bao giờ trùng số; đơn tiền mặt / ví tạo trong lúc đó lấy số sau, không lấy lại số đã giữ.
- B **Nội dung CK:** quầy `TQD<MMM><DD> HD<NNNN>` (vd `TQDNOV05 HD0016`), đơn App `TQD<MMM><DD> APP<NNNN>`; MMM = JAN…DEC theo ngày giờ VN lúc
  tạo phiên. Webhook SePay khớp đúng phiên theo nội dung này (chịu được ngân hàng bỏ dấu cách / đổi chữ hoa thường / thêm chữ trước sau); mọi
  luật khớp hiện có (đúng số tiền, đúng hạn, không khớp hai lần, chữ ký HMAC) giữ nguyên. payOS dự phòng: kế hoạch nêu cách giữ trong giới hạn
  của payOS.
- C **Tiền về → đơn mang đúng số đã giữ:** bill in to `HD0016` / `APP0016` (số đã giữ), mã đơn chứa đúng số đó. Phiên hết hạn / huỷ → số đó ghi
  "huỷ" kèm lý do; tiền về muộn sau khi QR hết hạn, xác nhận tay → đơn nhận LẠI đúng số đã giữ.
- D **Mã giao dịch ngân hàng** (referenceCode SePay) lưu vào đơn; in trên bill (dòng nhỏ "Mã GD"); hiện ở chi tiết đơn và Đối soát.
- E **Đối soát cuối ngày** liệt kê các số bị huỷ trong ngày kèm lý do, để dãy số không có chỗ trống "không giải thích".
- F **App đọc số hoá đơn thay mã ngẫu nhiên** (yêu cầu App KH 05.11 mục 1 — chủ quán: mã `A47Z8N9CF` quá phức tạp, phải là số hoá đơn POS):
  `/api/kh` `GET /don`, `GET /don/:ma`, `POST /don` thêm trường **`so_hd`** = số hoá đơn của đơn (`APP0016` / `HD0016`, đúng chuỗi in trên bill);
  `null` khi đơn chưa được cấp số. KHÔNG đổi `ma` / `ma_don` (App vẫn dùng mã App làm đường dẫn và để gọi cửa). Màn "Đơn App" ở quầy hiện `so_hd`
  chữ to (mã App chỉ nhỏ / ẩn); bill, tem ly, phiếu pha chế của đơn App in `APP0016` to. Đổi hợp đồng: bảng cửa + nhật ký, tăng PHIEN_BAN (chat
  chỉnh số lúc gộp — HANG-1 đang giữ v10), `thu_HOPDONG_KH.js` xanh.
- F2 **Sửa câu luật 4xx của hợp đồng** (App KH 05.11 mục 3): "mọi 4xx của `POST /don` = chưa tạo đơn" TRỪ 401, 409 `KHO_BAN` (chưa rõ → gửi lại CÙNG
  khoá) và 409 `KHOA_GUI_DA_DUNG` (mời xem Lịch sử đơn). Chỉ sửa chữ cho khớp code, không đổi hành vi.
- K5 **Không đổi:** số tiền, cách giữ ví / điểm trong phiên, PIN, cổng chọn (CONG_QR), hoàn / huỷ đơn; đơn cũ giữ mã cũ (không đánh số lại).

## Phạm vi
- viec/CK-NOIDUNG-1/**
- server/utils/giuCho.js
- server/utils/sepay.js
- server/utils/payos.js
- server/utils/congQr.js
- server/utils/vietQr.js
- server/utils/helpers.js
- server/utils/donApp.js
- server/utils/doiSoat.js
- server/routes/thanh-toan.js
- server/routes/orders.js
- server/routes/don-mo-rong.js
- server/routes/hoaDon.js
- server/utils/dongHoaDon.js
- server/routes/wallets.js
- server/routes/kh/index.js
- server/routes/backup.js
- server/nang_cap/019_so_hoa_don.js
- server/nang_cap/chay.js
- client/src/**
- client/dist/**
- cong_cu/thu_CKNOIDUNG1.js
- cong_cu/thu_HOPDONG_KH.js
- cong_cu/thu_SEPAY1.js
- cong_cu/thu_P26c.js
- HOP_DONG_API_KH.md
- kiem_tra_truoc_khi_giao.js

<!-- Chủ quán 05.11 (Q1–Q3 kế hoạch a10a453):
     Q1 — tiền về SAU khi QR hết hạn / đã huỷ, chia hai: (a) phiên QUẦY: cho xác nhận tay (quyền xac_nhan_ck_tay + lý do), đơn nhận lại đúng số
     đã giữ, trừ lại phần ví đã nhả trong cùng giao dịch, ví thiếu → không tạo đơn; (b) phiên APP: KHÔNG tạo lại đơn (khách đã thấy "đã huỷ",
     có thể đã đặt lại) — số tiền thật đã về TỰ cộng vào ví khách của phiên (ghiVi, ghi rõ "tiền về muộn" + số HD + mã GD), một lần duy nhất mỗi
     báo tiền (chống báo lặp như cũ); tài khoản nhận khác / sai chữ ký vẫn chặn như cũ; App thấy đơn `da_huy` + số đã cộng vào tài khoản (kế hoạch
     nêu trường); Đối soát ghi dòng "tiền về muộn — đã cộng vào tài khoản" (CẦN XEM, không ĐỎ).
     Q2 thêm hoaDon.js + dongHoaDon.js (dòng "Mã GD" trên bill quầy và hoá đơn App).
     Q3 thu_SEPAY1.js (B1, E3) + thu_P26c.js (C1, C2) — chỉ các ca khoá dạng cũ, bài sửa thường (đỏ trên gốc, xanh sau vá).
     Bỏ mã App ngẫu nhiên khỏi ghi chú in trên bill đơn App (mã vẫn giữ trong dữ liệu). -->
## Bài thử đỏ
Có — `cong_cu/thu_CKNOIDUNG1.js` ĐỎ trên code gốc: nội dung QR quầy / App đúng dạng; hai phiên cùng lúc khác số, đơn tiền mặt chen giữa lấy số
sau; webhook với nội dung bị ngân hàng đổi dạng vẫn khớp đúng phiên; đơn tạo ra mang đúng số đã giữ; phiên hết hạn → số huỷ có lý do; tiền về
muộn xác nhận tay → nhận lại số cũ; referenceCode lưu vào đơn; qua 00:00 giờ VN số đếm lại từ 0001.

## Ngân sách
~250 dòng máy chủ + ~80 dòng giao diện + ~400 dòng thử.
**Phương án đơn giản nhất đã xét:** một bảng đếm số theo ngày (cấp số bằng một câu ghi nguyên tử), phiên QR mang số đã cấp, `taoMaDonTheoSo` lấy
số từ phiên khi có.

## Đổi cấu trúc DB
có — chỉ THÊM (bước 019): bảng / cột giữ số hoá đơn theo ngày; cột số đã giữ + lý do huỷ của phiên; cột mã giao dịch ngân hàng của đơn. Bảng mới
vào BACKUP_TABLES.

## Thư viện mới
không

## Soát bảo mật
có — webhook tiền vào (khớp nội dung), cấp số chống trùng khi chạy song song, trường mới ở cửa App.

## Cấm
Không làm huỷ đơn / hoàn tiền (HUY-1), gói nạp (NAP-1). Không đổi số tiền hay cách trừ ví.
