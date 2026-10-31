# Sổ quyết định của chủ quán — POS · SX · App KH

<!-- Một dòng một quyết định, có ngày. Cả hai chat đọc TRƯỚC khi soạn phiếu. Đổi → sửa đúng dòng, ghi "(đổi dd.mm, trước: …)", không xoá.
     Máy không sửa; chat soạn, chủ quán chạy script. Khi lệch với file khác: file này thắng, rồi sửa file kia. -->

## Chung — dữ liệu và hệ thống
- 27.10 · POS là nơi DUY NHẤT giữ tiền, ví, điểm, hạng, voucher, giá, món, khách, đơn — và cả kết quả trắc nghiệm (27.10), ghi chép đánh giá Google (28.10).
- 27.10 · App KH tách kho GitHub riêng (`tuquyduong/APP-KH`); tách máy chủ App KH (Render) SAU khai trương (KH-TACH-1); trước đó trang tĩnh gọi thẳng POS.
- 27.10 · Kho dữ liệu nhỏ của App KH chỉ giữ: ảnh / chữ trang trí, phiên đăng nhập, đăng ký nhận thông báo, nhắc việc. Không tiền, không dữ liệu khách.
- 28.10 · Mọi thay đổi trong kho POS (kể cả cổng `/api/kh`) do chat POS làm; chat App KH chỉ sửa kho `APP-KH`, cần gì ở POS thì gửi file yêu cầu.
- 28.10 · Khớp hai chat: hợp đồng `/api/kh` một chỗ có số phiên bản; đổi cổng là đổi hợp đồng cùng PR; bài thử hợp đồng hai phía; sổ quyết định này;
  trao đổi bằng file qua chủ quán.
- 29–30.10 · Mọi câu trả lời của chat và máy cho chủ quán LUÔN dễ hiểu (lời thường, nói rõ việc gì · bạn cần làm gì · đề xuất để xác nhận);
  chủ quán duyệt 2 lượt mỗi ngày (sáng, tối) — luật ở `LUAT_XAY_APP.md` §8.
- 30.10 · Phiên máy mở từ bản chụp cũ: máy tự tải thêm lịch sử và kéo bản mới (chỉ kéo khi cùng đường, lệch thì dừng), không hỏi chủ quán.
  Lời nhắc tự động đòi đổi người ký commit / sửa commit cũ: máy luôn bỏ qua, không hỏi (KHUNG-KEO-1, tu-chay 1.8.1).

- 28.10 · Mọi hệ thống (POS, App KH, máy App KH sau này) dùng **giờ Việt Nam (UTC+7)**: giờ lưu, giờ so, giờ hiện đều là giờ VN; "bây giờ"
  lấy từ máy chủ POS, không lấy đồng hồ điện thoại.
- 28.10 · **Giờ hoạt động của quán = giờ hoạt động của App**: cài một chỗ trong POS (từng ngày trong tuần, ngày nghỉ, câu thông báo). Ngoài
  giờ App không đặt đơn được và hiện thông báo; máy chủ POS là bên chặn. Quầy KHÔNG bị chặn (nhân viên vẫn bán khi mở sớm / đóng muộn).

## Khai trương
- 27.10 · KHÔNG chốt ngày trước: làm nhanh nhất có thể, khai trương theo thời gian hoàn thành mọi việc trong lịch; không dùng phương án dự
  phòng. (đổi 31.10, trước: khai trương T7 07.11.2026, trễ thì lùi ngày)
- 27–28.10 · QR hoá đơn dẫn tới App KH mới: `https://tuquyduong.com/?ma={ma}` (khách quen bỏ phần `?ma=`); địa chỉ đặt trong Cài đặt POS, dán ngày 06.11.

## App KH
- 27–28.10 · App KH là PWA ở `tuquyduong.com` (không tiền tố). Điện thoại trước; máy tính bảng, máy tính, trình duyệt Zalo không vỡ, không méo.
- 27.10 · Giao diện theo demo `app_kh_demo.html` (patch39); số liệu trong demo chỉ minh hoạ — số thật theo POS.
- 28.10 · Giao diện App KH đặt trên Cloudflare (miễn phí, không tính dung lượng); máy App KH sau khai trương đặt trên Render.
- 28.10 · App KH cũ trên Replit (`tuquyduong/TuQuyDuong`) bỏ, dựng mới hoàn toàn.

- 29.10 · Số dư ví hiện trên App = số khách **dùng được ngay** của ví riêng (đã trừ tiền đang tạm giữ khi thanh toán dở), chưa cộng ví gia đình.
- 29.10 · Giờ hoạt động có HAI thông tin: "quán đang mở" (giờ mở thật) và "còn nhận đơn App" (đã trừ ngừng nhận trước giờ đóng); lúc giữa hai mốc
  App báo "Quán mở tới … · đã ngừng nhận đơn qua App".
- 30.10 · **Đặt đơn online trên App KH TỪ KHAI TRƯƠNG**, đủ 5 mục: nhận tại quán + trả QR payOS (KH-MUA-1) · trả ví + PIN (KH-MUA-1) ·
  giao Ahamove (KH-MUA-2, sau GIAO-1) · topping / combo trong giỏ (phần `/api/kh` của TOPPING-1, COMBO-1a) · đổi điểm khi trả (P3b).
  Kịp thì khai trương 07.11, không kịp thì LÙI — không bỏ mục nào. Máy chủ tính lại toàn bộ tiền đơn online bằng CÙNG hàm quầy.
- 30.10 · Chỉ 3 thứ cần đăng nhập ở App KH: Kế hoạch, trắc nghiệm thể chất, tích điểm (điểm, voucher, nhận mã). Mọi thứ khác (menu, combo,
  ưu đãi, Giờ vàng, giá từng hạng) mở cho khách vãng lai. Ngoài giờ: xem được, không đặt được (POS chặn).
- 30.10 · Chia cài đặt: sai thì mất tiền → POS; chỉ hiển thị → phần nội dung App KH. Thông tin NGẮN của món (nhu cầu, thể chất, mô tả,
  công dụng, thành phần — cho nhân viên quầy) ở POS, App KH đọc lại (KH-SP-1, trước khai trương); ảnh món sau khai trương (KH-SP-2).
  "Bán chạy nhất" chủ quán tự chọn ở App KH — POS không đếm ly.
- 30.10 · Khách có nhiều địa chỉ, một mặc định (KH-HOSO-1, sau khai trương; `dia_chi` một chuỗi của v3 = địa chỉ mặc định). Địa chỉ dùng
  CHUNG cho quầy và App (khách sửa trong App thì hoá đơn quầy in địa chỉ mới).
- 30.10 · Trắc nghiệm: hỏi khách đồng ý chia sẻ trước khi hiện kết quả; đồng ý hay không đều xem như nhau; chỉ khi đồng ý mới gửi kết quả
  rút gọn về POS, hiện ở chi tiết khách (KH-TN-1, sau khai trương — thông tin sức khoẻ, làm kỹ).
- 30.10 · Xưng hô BẮT BUỘC với khách mới đăng ký App (App bản cũ chỉ có ô Tên sẽ không tạo được khách mới — App KH thêm ô trước khai trương).
- 30.10 · Giờ vàng ở Cài đặt POS: chọn vài món hoặc tất cả; mỗi lựa chọn giảm % HOẶC đặt giá còn lại; giờ bắt đầu / kết thúc. Giờ vàng
  KHÔNG cộng thêm giảm hạng (luật quầy có sẵn). App KH chỉ đọc từ POS (GIOVANG-1, `gia_mon[]`).
- 30.10 · App KH gọi POS ở `https://www.pos-tuquyduong.io.vn` (bản có www). `KH_JWT_SECRET` đã đặt trên Render 30.10.
- 29.10 · Khách chưa đăng nhập LÚC NÀO cũng xem được Trang chủ, Menu, giá, trang món; đăng nhập chỉ khi cần Ưu đãi, Tài khoản, mã thành
  viên, nhận điểm. Đăng ký 3 bước: SĐT → mã (qua Zalo khi có KH-OTP-1) → Tên + Cách xưng hô BẮT BUỘC, Địa chỉ tuỳ chọn (đặt online lần
  đầu thì bắt nhập, lưu làm mặc định). Nhớ đăng nhập 30 ngày, TỰ GIA HẠN mỗi lần mở app (KH-API-3).
- 31.10 · Địa chỉ của khách ở quầy và ở App là MỘT ô (cột address dùng chung — KH-API-3 đã làm): sửa ở đâu thì nơi kia thấy ngay.
- 31.10 · Đặt đơn App (KH-MUA-1): khách trả được bằng QR payOS, ví + PIN, hoặc **ví một phần + QR phần còn lại** (giữ ví trước, như quầy).
  An toàn tiền: MỌI lỗi có mã (4xx) của tạo đơn = chưa tạo đơn, chưa giữ / trừ ví; mỗi lần bấm Đặt có một khoá gửi — gửi lại cùng khoá
  trả đúng đơn cũ, không trừ ví hai lần. Loại giảm trên báo giá: `ma_giam` · `hang` · `gio_vang`.
- 31.10 · Đặt đơn App — duyệt kế hoạch KH-MUA-1: cài đặt chuông (bật / tắt, tiếng, âm lượng) chung cả quán ở Cài đặt, công tắc "Máy ở
  quán" riêng từng máy · chọn ví + QR khi ví 0đ → đi như QR · mã hợp lệ mà giá hạng lợi hơn → App giải thích · huỷ đơn đã huỷ không báo lỗi ·
  tiền QR về sau khi đơn đã huỷ / hết hạn → App báo "Quán đã nhận tiền, nhân viên sẽ liên hệ", hoàn qua Đối soát · món chưa rõ tồn vẫn đặt
  được như quầy · tối đa 10 lần đặt / 10 phút / khách (gửi lại cùng khoá không tính) · mã không áp → đặt theo số báo giá không mã, báo lý do ·
  App gửi "tổng đã xem" (`tong_da_xem`), lệch số máy chủ tính → 409 `GIA_DA_DOI` kèm báo giá mới, KHÔNG tạo gì · lỗi 4xx không giữ khoá gửi.
- 31.10 · Mã thông tin món là mã CHUNG hai hệ (App KH xác nhận): nhu cầu `ngu_ngon dep_da am_bung tinh_tao bo_khi giai_nhiet`; thể chất
  `binh_hoa khi_hu duong_hu am_hu dam_thap thap_nhiet huyet_u khi_uat dac_bam` (KH-TN-1 dùng lại). Thêm mã → báo App trước.
- 31.10 · Chưa có Zalo ZNS: khách MỚI lấy mã đăng nhập App ở quầy theo SĐT, KHÔNG tạo khách trước (để App hỏi tên + xưng hô) — KH-QUAY-2.

## Giao hàng
- 27.10 · Giao hàng dùng Ahamove (không GHN).

## Đánh giá Google
- 28.10 · Chỉ đánh giá trên Google Maps; không quà / voucher đổi đánh giá; không viết sẵn câu; mời mọi khách như nhau (KHÔNG có điều kiện
  "khiếu nại"); đơn huỷ / hoàn tiền không mời; không chỉ tiêu theo nhân viên.
- 28.10 · Toàn bộ dữ liệu, lịch mời, đọc / trả lời Google, màn quản lý ở POS; App KH chỉ làm giao diện khách + gửi thông báo khi POS nhờ.

## Trắc nghiệm thể trạng
- 27.10 · Lưu bản rút gọn (nhóm thể trạng, ngày) khi khách đồng ý; quán quản lý, theo dõi được (trong POS, theo quyền); khách xoá được.

## Tiền, điểm, quầy (POS)
- (đã chốt trước) Không công nợ. Mọi chuyển khoản qua QR payOS, máy chủ tự xác nhận. Trừ tài khoản khách phải có PIN khách.
- (đã chốt trước) Điểm chỉ tính trên tiền khách trả thật (DIEM-THAT-1). Giá hạng: giá gốc gạch ngang + giá hạng. Combo cố định, giảm hạng
  mức riêng cho combo.
- 24.10 · Hoá đơn 2 tờ GIAO KHÁCH / LƯU QUẦY (mặc định 2, đổi được 1); tem từng ly; khách lẻ có mã nhận điểm in chữ + QR (+N điểm, hạn theo cài đặt).
- 26.10 · Mã giảm và giá hạng: máy chủ chọn cách lợi hơn cho khách theo cài đặt từng loại mã (UUDAI-1).
- 27.10 · Mã gõ sai: bỏ qua mã, vẫn giảm giá hạng, báo "Mã không áp" (UUDAI-1 Q5 = a). Đối soát "máy chọn hạng mà mã vẫn bị tiêu": để sau
  khai trương.
- 27.10 · Trước khai trương có: topping theo món, đổi điểm trong phiên thanh toán (P3b), giao Ahamove ở quầy (GIAO-1).
- 28.10 · Hoá đơn hiện đúng tình trạng thực tế của đơn (chỉ in dòng đơn có); MỌI dòng chữ trên bill và tem sửa được trong Cài đặt; dòng
  tiền / thanh toán không tắt được; số giờ hạn mã trên bill tự lấy từ cài đặt hạn mã.

- 29.10 · **Không có bill chưa trả tiền:** khách luôn trả đủ tại quầy rồi mới in bill. Đơn còn nợ chỉ là dữ liệu CŨ (trước khi bỏ ghi nợ):
  in lại thì in đúng như dữ liệu, KHÔNG in mã nhận điểm / ô ưu đãi / QR mang mã. Máy không hỏi lại về đơn chưa trả.
- 29.10 · Hạn mã nhận điểm / mã ưu đãi khách mới: máy cho đúng số giờ đã cài (bill hứa bao nhiêu giờ thì cho bấy nhiêu), cả quầy lẫn App.
- 29.10 · **Bỏ chiết khấu riêng từng khách:** mọi ưu đãi của khách đi qua hạng thành viên; khách VIP chủ quán cho mã giảm riêng sau.
  KHACH-CK-1: bỏ ô ở màn Khách hàng + máy chủ không áp nữa + đặt về 0 qua bước nâng cấp có sao lưu — xong TRƯỚC khi bật màn Bán hàng mới.
- 31.10 · KHACH-CK-1 (đã gộp): hai cửa ghi chiết khấu chỉ còn lưu "Ghi chú khách" (in trên hoá đơn), mức > 0 bị từ chối. Khôi phục một
  bản sao lưu cũ có thể đem mức giảm riêng trở lại hồ sơ — CHẤP NHẬN (máy chủ không áp, màn không hiện; không sửa backup.js). Khách từng có
  % riêng mua trong Giờ vàng → theo giá Giờ vàng như mọi khách.
- 31.10 · **Bỏ hẳn giảm tay ở quầy:** màn Bán hàng (cũ và mới) KHÔNG có ô giảm tay; ở quầy chỉ giảm qua mã giảm, hạng thành viên, Giờ vàng.
  Máy chủ không nhận mức giảm nào màn hình gửi. Cần giảm cho khách quen / bù món lỗi → quản lý tạo mã giảm (BH-CKTAY-1 bỏ ô ở màn cũ).
- 31.10 · payOS chạy thật (chủ quán thử đơn QR 2.000đ: tiền về, máy tự xác nhận). Màn Bán hàng mới được bật từng máy (`/?man=moi`;
  về màn cũ `/?man=cu`). Huỷ đơn đã chuyển khoản: POS không tự trả tiền — nhân viên chuyển trả tay.
- 31.10 · HOÁ ĐƠN KHÁCH chỉ in khổ nhỏ dọc (58mm / 80mm) — bỏ A4 / A5 khỏi chỗ chọn khổ hoá đơn; cài đặt cũ A4 / A5 đọc ra 80mm (KH-QUAY-2).
  CÁC LOẠI PHIẾU (xuất / nhập kho, đặt hàng, phát sinh, pha chế…) VẪN có lựa chọn 80mm / A5 / A4 và có phần Cài đặt in phiếu (KHO-IN-1).
- 29.10 · Khoá payOS và Ahamove CHỈ ở biến môi trường Render (không ở màn Cài đặt, không dán vào chat); Quản lý → Cài đặt chỉ hiện
  "payOS: đã cài ✓ / chưa cài ✗ · Ahamove: đã cài ✓ / chưa cài ✗" (làm trong GIAO-1).

## Kho (POS)
- 26–27.10 · Bỏ app SX: mọi thứ về POS (nhập nguyên liệu → pha chế / sản xuất → thành phẩm → bán). Chỉ nhập DANH MỤC từ SX (nguyên liệu,
  nhóm, món, công thức) — không lấy tồn, khách, gói. Tồn POS bắt đầu từ kiểm kê đầu kỳ. App SX tắt khi POS tự trừ kho (KHO-3).
- 26.10 · Công thức ghi cho 1 đơn vị; món pha tại chỗ trừ thẳng nguyên liệu, món làm sẵn trừ thành phẩm (lô, hạn); hết hàng làm sẵn vẫn
  bán, ghi âm, báo đỏ. Nhân viên xuất kho luôn cần duyệt (công tắc Cài đặt); phiếu nhận cần người KHÁC duyệt; kiểm kê đếm mù, quản lý
  duyệt chênh lệch có lý do; số tồn chỉ đổi qua phiếu; sửa / huỷ phiếu chỉ chủ quán, có lý do, phiếu cũ giữ.
- 28.10 · 32 nguyên liệu chính thức sau gộp trùng tên SX (Táo đỏ ≠ Táo tươi; Củ dền = Dền đỏ). Nhóm nguyên liệu: Rau củ quả · Dược liệu
  (theo loại, không theo món dùng).
- 28.10 · Món SX chưa có giá ở POS: tạo với tên + nhóm, giá trống — đặt giá là bán được. Món không nối được với SX: thêm mới
  trong POS sau (bản 09.10 không có món nào như vậy — Cà Phê Đen CÓ nối, nhập bình thường). (đổi 29.10, trước: ghi nhầm Cà Phê Đen
  không nối được)
- 28.10 · Giá nhập nguyên liệu với nhân viên: TẠM ẨN (chủ quán đang cân nhắc).
- 28.10 · Nâng cấp dữ liệu: bước đánh số, chỉ thêm, chạy trọn gói, không bao giờ chạy đôi; bước lỗi thì quầy vẫn bán, chỉ màn Kho báo lỗi.
- 29.10 · Pha chế (KHO-2a): chỉ cài "% lệch cho phép" theo nhóm món (lệch quá → cảnh báo vàng, không chặn); "sắp hết hạn" = còn ≤ 1 ngày;
  công tắc "nhân viên xuất kho cần duyệt" chỉ chủ quán bật / tắt; lô nguyên liệu quá hạn KHÔNG trừ khi xuất (xử lý bằng phiếu phát sinh);
  "cho ngày mai" chỉ tính thành phẩm còn hạn lúc 00:00 ngày mai; qua ngày đã tự chốt thì không điền kết quả nữa (sai → chủ quán sửa phiếu);
  huy hiệu phiếu chờ duyệt tạm chỉ trong màn Kho.
- 31.10 · KHO-2b (duyệt kế hoạch): hoãn chụp ảnh hoá đơn nhập tới việc lưu ảnh sau khai trương — tạm ghi số hoá đơn vào ghi chú · hạn mức
  dùng nội bộ theo NGƯỜI theo NGÀY, tính bằng giá vốn, mặc định 50.000đ (Cài đặt, chỉ chủ quán đổi), món chưa có giá coi như vượt · chủ quán
  sửa phiếu nhận đã duyệt → phiếu mới tự duyệt (như phiếu xuất) · nhận hàng KHÔNG tự đổi giá nhập (sửa tay ở màn Nguyên liệu).
- 31.10 · Khôi phục sao lưu phải an toàn trước khai trương: không mất cột / dòng, hỏng thì không đổi gì; bảng mới nào cũng phải nằm trong
  sao lưu (SAOLUU-2 — KHO-2b phát hiện lỗi mất dữ liệu khi khôi phục vào máy trống).

## Bảo vệ dữ liệu (POS)
- 28.10 · Sổ kho không chép đè: khôi phục Excel bỏ qua bảng kho khi kho đang có dữ liệu, chỉ khôi phục kho khi máy trống. Sai số kho sửa
  bằng phiếu kiểm kê có duyệt.
- 28.10 · Lên gói Turso Developer (quay lại 10 ngày) trước khai trương, cùng lúc nâng Render; sau khai trương thêm sao lưu tự động hằng
  đêm ra Google Drive.
