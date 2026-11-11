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
- 31.10 · **Soát bảo mật tự động** (TU-CHAY-10, tu-chay 1.9.0 — mở đóng băng bộ khung CHỈ cho việc này): phiếu có mục `## Soát bảo mật`
  (`có` / `không` — chat quyết khi soạn phiếu); `có` (tiền, webhook, cửa công khai `/api/kh`, đăng nhập, mã / khoá, dữ liệu khách) → máy tự chạy
  `/soat-bao-mat` (lời nhắc /security-review của Anthropic) trước khi báo xong, cổng A20 chặn nếu chưa ĐẠT; chủ quán không phải gõ lệnh. Áp dụng
  cả kho App KH (chép y bộ khung). Việc mở trước 1.9.0 (SEPAY-1, MANKHACH-1, KH-SDT-1…): chat soát bảo mật khi gộp. KHÔNG cài Superpowers
  (trùng + đụng bộ khung); GitHub Action soát bảo mật (cần khoá API riêng) — xem lại sau khai trương.

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
- 31.10 → ĐỔI 01.11 · SĐT đăng ký: KHÔNG khoá dữ liệu cũ — khách tạo tài khoản bằng SĐT của mình thì giữ TOÀN BỘ dữ liệu của số đó (đổi số
  là hãn hữu, quán xử lý tay). Dọn dữ liệu thử MỘT lần trước khai trương: máy liệt kê → tải danh sách → tải sao lưu → gõ xác nhận (KH-SDT-1);
  két các ngày thử được phép lệch, két từ ngày bán thật không đổi (Q9); dọn theo ngày kể cả điểm / voucher thử của khách thật (Q8).

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
- 31.10 · Chuyển cổng thanh toán QR sang **SePay** (phí thấp hơn), ĐỦ chức năng như payOS (quầy + App: QR tự xác nhận, hết hạn, huỷ, xác nhận
  tay, ví + QR, đối soát). POS tự dựng VietQR, SePay báo tiền về (xác thực HMAC-SHA256). payOS GIỮ làm dự phòng, bật lại bằng công tắc (SEPAY-1). (đổi 06.11: cổng báo tiền là
  **Tingee** — xem đợt 04–06.11.)
- 31.10 · **Màn khách:** một máy tính bảng quay về phía khách, ghép với máy quầy (máy quầy là máy tính bảng / điện thoại). Lúc thu: hiện QR + món
  + tổng; tiền về: "Cảm ơn". Lúc rảnh: chạy nội dung quán TỰ CÀI (menu, Giờ vàng, QR App, giới thiệu, quảng cáo; ảnh khi có chỗ lưu ảnh)
  (MANKHACH-1).
- 31.10 → ĐỔI 01.11 · HOÁ ĐƠN KHÁCH và PHIẾU PHA CHẾ từng đơn chỉ in khổ nhỏ (58mm / 80mm). Phiếu của màn KHO (xuất, đặt hàng, nhận,
  phát sinh) CHỈ A5 hoặc A4, mặc định A5, có phần Cài đặt in phiếu (KHO-IN-1 đã gộp).
- 29.10 · Khoá payOS và Ahamove CHỈ ở biến môi trường Render (không ở màn Cài đặt, không dán vào chat); Quản lý → Cài đặt chỉ hiện
  "payOS: đã cài ✓ / chưa cài ✗ · Ahamove: đã cài ✓ / chưa cài ✗" (làm trong GIAO-1).

## Đợt quyết định 01–02.11.2026 (chi tiết từng màn: thiet_ke/THIET_KE_DOT2.md · demo đã duyệt: thiet_ke/demo_dot2.html, demo_man_khach.html)
- 01.11 · Sổ két / sao kê (pos_doi_soat_ghi) + hai bảng màn khách: có trong sao lưu nhưng CHẶN khôi phục bằng file (gộp MANKHACH-1).
- 01.11 · Màn khách: ghép MỘT lần, mã ghép dùng một lần; hiện như hoá đơn khách nhận, không bao giờ SĐT / số dư / điểm. 02.11: hiện hoá đơn
  khi bấm Thanh toán với MỌI cách trả (không nút riêng); khách nhập PIN trên màn khách; nội dung rảnh = MỘT danh sách phát (ảnh, video, mẫu có
  sẵn), file lưu ở chỗ lưu chung, máy màn khách tải về một lần (MANKHACH-2a / 2b).
- 01.11 · Tiền mặt làm tròn đến 1.000 — phần lẻ TỪ 600 trở lên tròn lên, 500 trở xuống tròn xuống; chữ "Trả lại" (không "tiền thối"); nút mệnh
  giá bấm = 1 tờ. Tài khoản chỉ đủ một phần: trừ tài khoản TRƯỚC rồi mới thu phần còn lại bằng tiền mặt / QR.
- 01.11 · Một cổng QR tại một thời điểm (payOS HOẶC SePay); tắt lọc "bỏ qua giao dịch không mã" trên SePay; máy kiểm số tài khoản nhận (SEPAY-1). (đổi 06.11: SePay → Tingee.)
- 01.11 · Hạng: chủ quán thêm hạng, thứ bậc; Vàng BÁN theo gói (1 / 3 tháng, giá đặt sau, linh động thêm gói), mua thêm thì hạn CỘNG NỐI;
  Kim Cương CHỈ chủ quán CẤP, có hạn tuỳ chọn hoặc không thời hạn; có hạng cao hơn thì không mua hạng thấp hơn; Kim Cương hết hạn → về Vàng
  nếu Vàng còn hạn; chưa bán thẻ nào trước khai trương (HANG-1).
- 01–02.11 · Ví: gói nạp ("khách trả" / "vào tài khoản" sửa được); nạp KHÔNG hoàn; nạp KHÔNG tích điểm, TIÊU tiền tài khoản THÌ tích điểm (đổi
  luật 24.10); khách tự nạp trên App bằng QR — trước khai trương. HAI loại tiền tặng tách hẳn: THƯỞNG NẠP (không hạn, gộp số dư) và QUÀ CHÀO
  MỪNG (mã mở tài khoản lần đầu, một lần, CÓ hạn, đếm ngược); không có điều kiện đơn tối thiểu; trừ quà chào mừng trước (NAP-1, NAP-2, QUA-1).
  Sổ sách: nạp chưa là doanh thu; báo cáo 3 ô (tiền thật vào quán · bán được bao nhiêu với 2 dòng tặng riêng · quán đang giữ hộ khách).
- 01–02.11 · Bán trên nền tảng (Grab / Shopee / Be): bảng giá kênh (% cộng, sửa riêng món), sửa giá từng dòng lúc nhập đơn kênh, số đơn = mã
  nền tảng (không trùng), bill gắn túi (có mã quà chào mừng + QR) + bill nội bộ (phí, thuế, dự kiến về); làm kịp khai trương (KENH-1).
- 02.11 · Ghi chú món LÚC NÀO CŨNG CÓ ở mọi kênh (nút chọn nhanh + gõ tự do) — làm trong TOPPING-1.
- 02.11 · Bản in: ô số bill / mã kênh to, đóng khung góc phải; đầu bill theo ĐƠN VỊ BÁN, không chồng chữ; hoá đơn App lấy ĐÚNG mẫu hoá đơn POS
  (HD-KH-1).
- 02.11 · Giao hàng: KHÔNG BAO GIỜ thu hộ (COD); miễn / hỗ trợ phí giao có cài đặt, mặc định KHÔNG miễn; giao thất bại do khách → KHÔNG hoàn
  tiền (ghi rõ trước khi đặt).
- 01–02.11 · Đơn vị bán (nhiều hộ kinh doanh, đổi theo ca): mỗi đơn vị có tài khoản + cài đặt SePay riêng; đổi đơn vị phải có PIN; hoá đơn theo
  đơn vị — SAU khai trương (DONVI-1); SEPAY-1 làm sẵn nền (lưu số TK nhận).
- 01–02.11 · Chương trình đặc biệt (thẻ Cài đặt riêng): học sinh giỏi (miễn 1 đồ uống, gia đình đi kèm giảm 50% không giới hạn món trong 1 hoá
  đơn); sinh nhật giảm 50% CẢ ĐƠN, một đơn, ĐÚNG ngày, đối chiếu căn cước thật khớp tài khoản (không lưu số căn cước); ngày sinh nhập một lần —
  App có ô ngày sinh + danh sách chương trình trước khai trương (CT-1a, CT-1b).
- 02.11 · Hợp đồng `/api/kh` v7 viết TRƯỚC khi POS code (mục "Đã hẹn") để App KH làm song song.
- 02.11 · Ví trên App KH (duyệt luồng, demo `thiet_ke/demo_app_vi.html`, `THIET_KE_DOT2.md` M4b): ô Số dư ví = tổng dùng được + dòng nhỏ Quà chào mừng
  đếm ngược; một công tắc "Trừ từ số dư ví" (QR / ví / ví + QR); theo dõi đơn đọc lại giữ ví / còn lại; giao diện App tự thiết kế — đơn giản, dễ
  hiểu, thông minh, ít thao tác.

## Đợt quyết định 04–06.11.2026 (chat bàn 32)
- 04.11 · HANG-1: mọi lần sửa Cài đặt → Hạng (%, giá gói, thứ bậc…) phải gõ PIN chủ quán, kể cả quản lý.
- 04–05.11 · Nội dung chuyển khoản ghi luôn số hoá đơn, giữ số ngay lúc tạo QR; QR không thành công thì số đó huỷ (ghi lý do, Đối soát liệt
  kê). Dạng `TQD<tháng 3 chữ tiếng Anh><ngày 2 số> HD<4 số>` ở quầy (vd `TQDNOV05 HD0016`), `… APP<4 số>` cho đơn App; quầy và App dùng CHUNG
  một dãy số mỗi ngày; bill in đúng số đó; không cài "Cấu trúc mã thanh toán" bên SePay; mã giao dịch ngân hàng (FT…) lưu vào đơn
  (CK-NOIDUNG-1).
- 05.11 · App: số khách đọc ở quầy = số hoá đơn POS (`APP0016`), không phải mã ngẫu nhiên của App; quầy, bill, tem, phiếu pha chế và App hiện
  cùng một số (CK-NOIDUNG-1). Lịch sử đơn trên App có tóm tắt thật từng đơn: kênh, cách nhận, các cách đã trả, số món, đã giảm (KH-TOMTAT-1).
- 05.11 · Nạp tay kiểu cũ CHỈ chủ quán (để thử; sau này ẩn / bỏ). Khách nạp theo gói mệnh giá cài sẵn (NAP-1).
- 05.11 · Giao diện (GIAO-DIEN-1, hình mẫu đã duyệt): báo đơn App là DẢI ở đầu mọi màn (kể cả Bán hàng trên điện thoại), chỉ hiện khi có đơn
  mới, không nút nổi che nút; menu có mục "Đơn App" kèm số; Số dư gộp vào trang Khách hàng (khu Ví trong hồ sơ khách); Quản lý thêm ô
  "Khách và tiền".
- 05.11 · Huỷ đơn (HUY-1): huỷ được ngay từ lúc nhận đơn (trước "xong"); quản lý + chủ quán huỷ đơn trong ngày, đơn ngày trước chỉ chủ quán,
  nhân viên không huỷ; lý do bắt buộc; huỷ là huỷ CẢ đơn (khách muốn thì đặt lại). Khách có tài khoản: TOÀN BỘ tiền đã trả (ví + tiền mặt +
  chuyển khoản) hoàn vào tài khoản, không chuyển tiền thật. Khách lẻ đến quán mua mà huỷ: trả tiền mặt (rất hiếm — ngoại lệ DUY NHẤT của luật
  két không chi tiền mặt), Đối soát ghi riêng.
- 05–06.11 · Tiền chuyển khoản về muộn (QR đã hết hạn / phiên đã đóng): ở quầy nhân viên xác nhận tay, ghi lý do; đơn App thì máy tự cộng vào ví
  khách và báo rõ cho cả quầy lẫn khách; phiên App hỏng vì đơn (vd hết hàng) mà tiền vẫn về cũng tự cộng ví, báo rõ hai bên. Cùng một khoản báo về
  qua HAI cổng → KHÔNG tự cộng, vào nhóm CẦN XEM (CK-NOIDUNG-1).
- 06.11 · Đổi cổng báo tiền SePay → **Tingee** (rẻ hơn; TINGEE-1). Khách chuyển vào số tài khoản ẢO (VA) `VQRQANJMG7944` của MB Bank hộ kinh doanh
  (MB tự thêm mã VA vào ĐẦU nội dung, vd "Qanjmg7944 TQDNOV06 HD0016"); Tingee chỉ báo khoản vào VA. Khoá Tingee chỉ ở biến môi trường Render, khoá
  API chỉ quyền "Ngân hàng & Thanh toán". Đã gỡ Webhook SePay; khi `CONG_QR` chưa là `tingee` thì quầy xác nhận tay. Bật Tingee ngoài giờ bán, thử
  đơn 2.000đ thấy "đã thu" mới giữ.
- 05–06.11 · HANG-1: hạng thành viên KHÔNG khôi phục từ file sao lưu (chỉ sửa ở Cài đặt, có PIN); đổi PIN chủ quán phải gõ PIN cũ.
- 06.11 · Gói nạp (NAP-1): CHỈ chủ quán, gõ PIN chủ quán, mới tạo / sửa gói.
- 06.11 · Thẻ mã QR thương hiệu "Bốn mùa" trên màn hình (GIAO-DIEN-1 mục F, mẫu `viec/GIAO-DIEN-1/mau_the_QR_TQD.png`): chấm tròn, 3 ô góc tô đặc,
  màu theo 4 mảnh logo, logo giữa ≤ 20%, viền trắng, KHÔNG dòng chữ cuối thẻ; bill in nhiệt giữ mã đen vuông. Chủ quán quét thử MB / VCB / TCB /
  MoMo trước khi nhận.
- 04–06.11 · Giao hàng ở quầy (GIAO-1): ô địa chỉ dùng gợi ý địa chỉ của Ahamove (cần khoá riêng — chưa có thì gửi chữ, nhân viên xác nhận);
  khoảng cách giao tối đa đặt trong Cài đặt; quầy bấm tay Nhận đơn / Gọi tài xế (máy gợi ý giờ gọi); màn Giao hàng 4 cột màu, bấm thẻ ra chi
  tiết; huỷ theo từng bước. Khoá Ahamove hiện là khoá thử — xin khoá thật trước khi giao thật.
- 06.11 · GIAO-1: món đã làm của đơn giao bị huỷ — "Bỏ đi" KHÔNG cộng lại kho (đồ hỏng); "Dùng cho đơn khác" mới hoàn kho trên sổ.
- 06.11 · Tingee CHẠY THẬT: đơn thử 2.000đ máy tự báo "đã thu", nội dung chuyển khoản `TQDNOV06 HD…` đúng (TINGEE-1).
- 06.11 · Khách sinh 29/02: năm không nhuận tính sinh nhật là 28/02 — POS (CT-1b, ưu đãi sinh nhật ở quầy) và App (KH-CT-1) dùng CÙNG luật.
- 03.11 (ghi sổ 06.11) · Khách tạo tài khoản trên App phải hiện ở màn Khách hàng POS và tìm được ở quầy (tên / SĐT / quét QR), ĐỦ trường như khách
  tạo ở quầy; quầy và App tạo khách bằng MỘT hàm chung — TRƯỚC khai trương (KHACH-APP-1).
- 06.11 · Khách chỉ còn MỘT nguồn là POS: chép khách SX còn thiếu một lần (chỉ thêm, không ghi đè), rồi POS thôi đọc khách từ SX (KHACH-APP-1).

## Đợt quyết định 07–08.11.2026 (chat bàn 33)
- 07.11 · KHACH-APP-1: khách chỉ còn MỘT nguồn là POS. "Thêm khách" với SĐT đã có → không lưu, báo "Khách đã có tài khoản — tìm khách ở màn Bán hàng
  để bán gói" (khách đã có thì bán gói / thẻ như bán món). Xoá đăng ký nhập nhầm: xoá luôn khách CHỈ KHI khách còn trắng VÀ do chính đăng ký đó tạo,
  chỉ quản lý trở lên, ghi nhật ký (ai, lúc nào, SĐT, tên, lý do); nhân viên xoá thì chỉ xoá đăng ký.
- 08.11 · Thẻ hạng là SẢN PHẨM: bán ở màn Bán hàng quầy (tab "Thẻ thành viên") và trên App (Menu nhóm "Thẻ thành viên", Ưu đãi nút Mua, Trang chủ
  nhắc gia hạn); chung giỏ với đồ uống, trả một lần. Hạng phải CÓ TRƯỚC thì món mới được giá hạng: đồ uống cùng đơn tính theo hạng đang có, hạng mới
  áp từ đơn sau. Mua thẻ thành công thì hệ thống TỰ ĐỘNG lên hạng NGAY — mọi cách trả (tiền mặt, CK, tài khoản, QR), ở quầy hay App. Hạng "chỉ chủ quán
  cấp" (Kim Cương) vẫn hiện nhưng không mua được (nút mờ) — sau này đổi sang bán chỉ cần đổi cài đặt (KH-THE-1, QUAY-UI-1).
- 08.11 · Tích điểm theo TỪNG MÓN: mỗi món / thẻ hạng / gói có công tắc "Tích điểm", chọn nhiều hoặc từng mục; gói nạp luôn 0 điểm (DIEM-MON-1).
- 08.11 · Cách trả ở quầy: ba nút Tiền mặt / Chuyển khoản / Trừ tài khoản — KHÔNG tự trừ tài khoản; bấm "Trừ tài khoản" mới hiện số có thể trừ,
  phần còn lại và PIN khách (QUAY-UI-1).
- 08.11 · Nạp tiền: khách tự nạp trên App HOẶC nạp tại quầy (KH-NAP-1 sau KH-THE-1).
- 08.11 · Đơn nạp tiền không có "Xử lý sự cố" (tiền nạp không hoàn, không huỷ, không đền); form Thêm khách báo "khách đã có" ngay khi gõ SĐT (QUAY-UI-1).
- 07.11 · Mọi màn Cài đặt báo lưu RÕ: thành công nói đã lưu gì; lỗi đỏ đúng lý do; nút Lưu mờ khi thiếu PIN (CAIDAT-BAO-1).
- 08.11 · Gộp NAP-1 (chat): đơn nạp không kèm giao hàng; tiền nạp về muộn sau khi huỷ phiên → quầy xác nhận tay như đơn thường (CK-NOIDUNG-1) → đúng
  một đơn nạp, ví vào đúng số gói.

## Đợt quyết định 08–09.11.2026 b (chat bàn 34)
- 08.11 · Điểm KHÔNG đổi thành tiền, không trừ thẳng vào đơn: điểm chỉ để đổi voucher. Khách tự đổi trong App, đổi xong là xong (không gắn với đơn
  ở quầy). Bỏ đổi điểm ở quầy (P3b).
- 08.11 · Voucher dùng một lần, không trả lại tiền thừa; một đơn tối đa N voucher (Cài đặt, gợi ý 3); voucher tiền trừ trước, voucher % tính trên
  phần còn lại; tổng giảm không quá tiền món; giờ flash không dùng voucher %; mỗi đơn chỉ MỘT mã khuyến mãi chung (mã quán phát cho mọi người);
  đơn huỷ / không thành công → trả lại mọi voucher đã dùng (điểm đã đổi không hoàn); điểm tính trên phần khách trả thật (VOUCHER-2).
- 08–09.11 · Voucher ship: giảm theo số tiền hoặc theo % (có trần "giảm tối đa"), chỉ giảm dòng phí giao, đơn tự đến lấy không dùng; quán vẫn trả
  Ahamove đủ, Đối soát ghi phần quán bù; tính vào giới hạn N voucher (VOUCHER-2).
- 09.11 · Mã khuyến mãi Ahamove: công tắc "phần giảm của Ahamove: cho khách / quán giữ" — trước mắt CHO KHÁCH; trừ mã Ahamove trước rồi mới trừ
  voucher ship; hiện rõ ở quầy VÀ App KH; mã hỏng lúc gọi xe → khách không trả thêm, quán bù, Đối soát ghi. Kho mã hai kiểu: kho mã dùng một lần
  (dán danh sách) và một mã dùng nhiều lượt (số lượt, hạn); máy dùng theo thứ tự, giữ mã cho đơn đang thanh toán, mã hỏng tự chuyển mã kế, sắp hết
  thì nhắc (GIAO-MA-1).
- 09.11 · Tích điểm theo món (DIEM-MON-1): khoản hoàn biết thuộc dòng nào (kết thúc gói, đền theo dòng) chỉ trừ điểm theo phần dòng BẬT điểm —
  dòng tắt điểm không trừ (Cách 2); khoản hoàn không gắn dòng trừ theo tỉ lệ toàn đơn; duyệt hoàn sau khi đã đền → trừ theo phần CÒN LẠI của đơn
  (hoàn hết thì điểm về 0, không phụ thuộc đền món nào trước — Q4 = a).
- 09.11 · Sản phẩm không pha chế (thẻ hạng, gói nạp, gói trả trước) bán MỌI GIỜ, kể cả ngoài giờ mở cửa; giỏ có đồ uống vẫn theo giờ. Đơn chỉ có
  thẻ / nạp tự chuyển "Xong" khi tiền về (KH-THE-1, KH-NAP-1).
- 09.11 · Mọi thao tác trong POS phải báo rõ, dễ hiểu và luôn nhìn thấy: xanh nói đã làm gì; đỏ nói vì sao + cách sửa (BAO-1a ngoài Cài đặt,
  BAO-1b Cài đặt — gồm CAIDAT-BAO-1).
- 09.11 · Giao diện Cài đặt / Khách hàng / Quản lý tinh gọn theo mẫu chủ quán duyệt TẠM (artifact "Tinh gọn Cài đặt & Khách hàng"); góp ý thêm
  và chốt mẫu lần 2 trước khi làm (GIAO-DIEN-2).
- 09.11 · Máy in bill tự cắt rời từng liên (2 liên → 2 tờ rời, không in dài rồi xé).
- 09.11 · Khai trương phải ĐẦY ĐỦ mọi việc, không cắt bớt — sớm nhất T5 26.11 nếu không thêm việc.

## Đợt quyết định 10.11.2026 (chat bàn 35)
- 10.11 · Mã giảm / voucher KHÔNG áp lên thẻ hạng, nạp tiền, gói trả trước, thẻ quà; đơn có thêm món thường thì mã chỉ tính trên món thường
  (VOUCHER-2 — chốt câu chờ 09.11).
- 10.11 · Nạp tiền và thẻ quà CHỈ mua bằng tiền thật (tiền mặt / chuyển khoản): không trừ tiền tài khoản, không mã giảm — chặn vòng lặp "trả 95k nhận
  100k rồi lấy tiền tài khoản mua tiếp"; máy chủ chặn ở cả quầy và App (KH-NAP-1, QUA-TANG-1). Tiền đã vào tài khoản thì khách mua gì cũng được.
- 10.11 · Thẻ quà tặng (QUA-TANG-1, làm SAU CÙNG): mệnh giá + khuyến mãi trong Cài đặt (vd trả 95.000đ nhận 100.000đ, tuỳ chọn tối đa N thẻ
  khuyến mãi / khách / tháng); mỗi thẻ một mã, thuộc người mua tới khi có người nhập. Mua trên App → mã trong "Quà đã mua" + nút Chia sẻ; mua ở
  quầy có tài khoản → mã vào App của khách (in phiếu nếu khách muốn); không tài khoản → in phiếu mã + QR. Không chuyển thẳng theo SĐT lúc bán.
  Người nhận nhập mã trong App hoặc quầy quét mã → tiền vào tài khoản (không hạn); mã dùng một lần, hạn nhận 12 tháng (Cài đặt). Mua 0 điểm,
  tiêu vẫn tích điểm. Mã chưa ai nhập chủ quán huỷ được; đã nhập không hoàn, không đổi tiền mặt.
- 10.11 · Giới thiệu bạn bè (GIOI-THIEU-1, sau khai trương, sau VOUCHER-2): chỉ qua App; thưởng bằng voucher sinh từ "mẫu voucher" trong Cài đặt
  Voucher (mức + hạn trong Cài đặt); người được mời nhận khi đăng ký (khách mới thật), người giới thiệu nhận khi đơn đầu của bạn hoàn tất; trần N
  lần / tháng (mặc định 10).

## Đợt quyết định 11.11.2026 (chat bàn 35)
- 11.11 · Quét QR trên điện thoại khách bằng camera TRƯỚC của màn khách (QUET-1, trước khai trương), không mua máy quét để bàn: máy quầy ra lệnh
  → màn khách tự bật camera; màn rảnh có nút "Quét thẻ thành viên" cho khách tự bấm; quét xong (hoặc 30 giây) màn tự trở lại màn trước.
- 11.11 · Bỏ hẳn màn Bán hàng cũ, chuyển 100% sang màn mới; máy chủ khoá: trừ tiền tài khoản (của khách hay của mẹ) luôn cần PIN chủ tài khoản
  (BO-MAN-CU-1, trước khai trương).
- 11.11 · Đăng nhập App bằng mật khẩu (MATKHAU-1, trước khai trương): quán KHÔNG biết, không xem được mật khẩu khách; quản lý xem được mọi thông
  tin khách trừ mật khẩu; giữ đăng nhập 90 ngày; quầy có nút xoá mật khẩu (chủ quán / quản lý). PIN 4 số giữ riêng để xác nhận tiền, quên PIN
  đặt lại bằng OTP. Màn đăng ký ghi rõ "nhập SĐT có Zalo" vì mã OTP gửi qua Zalo.
- 11.11 · Đổi điểm (DOI-DIEM-1): quà hiện vật đổi ở quầy (khách nhập PIN), voucher đổi ở App hoặc quầy — MỘT cách đổi chung; thay một phần ý 09.11
  "bỏ đổi điểm ở quầy" (P3b vẫn bỏ: không đổi trong phiên thanh toán). Quà hết hạn chưa dùng thì hoàn điểm.
- 11.11 · Cuối danh sách, làm nối tiếp ngay, không chờ — làm hết một lượt: DOI-DIEM-1 → QUET-2 (khách tự quét mã của quán bằng App) →
  GIOI-THIEU-1 → QUA-TANG-1 (sau cùng).

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
- 31.10 · Chỉ khôi phục sao lưu khi quán đã ĐÓNG CỬA (lúc khôi phục, dữ liệu bị khoá ghi). Trang trống trong file sao lưu → bỏ qua, KHÔNG xoá
  bảng.
- 31.10 · Sửa phiếu nhận khi lô đã bị dùng bớt: VẪN cho sửa (số lượng, giá, hạn dùng, ghi chú); sửa xong số liệu phải KHỚP thực tế — còn lại = số
  mới − phần đã dùng, không cho số nhỏ hơn phần đã dùng (báo "đã dùng X"); lô đã dùng thì KHÔNG huỷ được phiếu nhận. Cả nguyên liệu và thành
  phẩm (KHO-2c).

## Bảo vệ dữ liệu (POS)
- 28.10 · Sổ kho không chép đè: khôi phục Excel bỏ qua bảng kho khi kho đang có dữ liệu, chỉ khôi phục kho khi máy trống. Sai số kho sửa
  bằng phiếu kiểm kê có duyệt.
- 28.10 · Lên gói Turso Developer (quay lại 10 ngày) trước khai trương, cùng lúc nâng Render; sau khai trương thêm sao lưu tự động hằng
  đêm ra Google Drive.
