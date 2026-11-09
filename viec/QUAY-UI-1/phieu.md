# QUAY-UI-1 — Quầy: tab "Thẻ thành viên" ở Bán hàng, nút chọn cách trả Tiền mặt / Chuyển khoản / Trừ tài khoản, "Thêm khách" báo khách đã có ngay khi gõ, đơn nạp không có "Xử lý sự cố", sửa đăng ký không đổi khách App

<!-- Phiếu do chat soạn 08.11.2026 (bàn 33, sổ v58). Việc [Th] — Sonnet, làm thẳng tới hết (không dừng chờ duyệt kế hoạch).
     Chủ quán thử bản chạy thật 08.11 (sau GIAO-DIEN-1, KH-TOMTAT-1, GIAO-1, NAP-1, KHACH-APP-1):
     (1) "nên hiển thị khách này đã có ngay từ lúc gõ số điện thoại" (form Thêm khách — máy chủ đã chặn 409 KHACH_DA_CO_TAI_KHOAN khi lưu);
     (2) đơn nạp vẫn hiện nút "Xử lý sự cố" → chọn Hoàn tiền thì máy chủ đã chặn (damages.js: product_id < 0 → GOI_THE_KHONG_DEN) nhưng câu báo
         "dùng Huỷ đơn" sai với đơn nạp (không huỷ được);
     (3) "chưa thấy phần hạng để bán" — 2 gói hạng Vàng (1 tháng 100.000đ, 3 tháng 289.000đ) phải bán được ở màn Bán hàng (máy chủ đã nhận
         `membership_buy { tier_id, so_thang }` — orders.js ~490); Kim Cương "chỉ cấp" hiện nhưng không bán;
     (4) cách trả: KHÔNG tự trừ tài khoản nữa — chủ quán 08.11: "thêm nút TM / CK / TRỪ TK, bấm trừ TK thì mới hiện số có thể trừ và PIN"
         (hiện máy tự trừ tài khoản khi khách có số dư, phải bấm "Bỏ");
     (5) KHACH-APP-1 phát hiện: sửa đăng ký đang chờ sửa luôn khách cùng SĐT kể cả khách App / khách có trước — giới hạn như xoá.
     Chạy song song DIEM-MON-1 + KH-THE-1 (Opus): giữ đúng Phạm vi; Settings.jsx chỉ thêm đúng một mục. -->

## Mục tiêu
Năm sửa nhỏ ở quầy theo lần thử 08.11 của chủ quán, không đổi luật tiền nào (máy chủ đã có luật).

## Nghiệm thu
- A Màn Bán hàng có tab "Thẻ thành viên" (cạnh "Nạp tiền"): mỗi hạng `cach_co = 'ban'` hiện các gói đang bán (tên hạng · số tháng · giá máy chủ trả);
  hạng chỉ cấp hiện mờ "Chủ quán cấp", không bấm được. Chạm gói → cần chọn khách trước; giỏ có tối đa MỘT dòng thẻ, cùng giỏ với món được; gửi
  `membership_buy` lên `tinh-thu` / phiên như các trường khác (giá do máy chủ). Lỗi máy chủ (DA_CO_HANG_CAO_HON, GOI_HANG_KHONG_BAN, HANG_CHI_CAP)
  hiện đúng câu. Giỏ nạp và thẻ không chung (đơn nạp riêng như NAP-1).
- B Khối thu tiền màn Bán hàng: ba nút chọn cách trả "Tiền mặt" · "Chuyển khoản" · "Trừ tài khoản" — KHÔNG tự trừ tài khoản khi khách có số dư.
  Chỉ khi bấm "Trừ tài khoản" mới hiện: số dư có thể trừ (tài khoản khách, tài khoản mẹ nếu có — số máy chủ trả), số sẽ trừ, phần còn lại (nếu số dư
  không đủ) kèm chọn Tiền mặt / Chuyển khoản cho phần còn lại, rồi bước PIN khách như phiên hiện nay. Chưa chọn khách / khách không có số dư → nút
  "Trừ tài khoản" mờ kèm lý do. Đơn nạp: chỉ Tiền mặt / Chuyển khoản (như NAP-1). Không đổi luật máy chủ (phiên PIN, chiaTra, tinh-thu).
- C Form Thêm khách: gõ đủ SĐT → tự tra (dùng cửa đọc khách sẵn có) → nếu đã có: hiện "Khách đã có: <tên> — tìm khách ở màn Bán hàng" và mờ nút Lưu;
  máy chủ vẫn là chốt chặn (409).
- D Đơn có dòng nạp (product_id ≤ −2000000): màn Đơn hàng không hiện nút "Xử lý sự cố"; máy chủ damages.js trả câu riêng cho đơn nạp: "Đơn nạp tiền
  không xử lý sự cố — tiền nạp không hoàn" (mã riêng `DON_NAP_KHONG_SU_CO`), mọi hành động (cả "chỉ ghi nhận" / hoàn kho).
- E Sửa đăng ký đang chờ: chỉ sửa khách khi dòng khách do CHÍNH đăng ký đó tạo (cùng điều kiện với xoá — KHACH-APP-1); khách App / khách có trước giữ
  nguyên, đăng ký vẫn sửa. Bài thử khoá.
- K5 Không đổi: giá, luật bán thẻ ở máy chủ, luật nạp, luật ví.

## Phạm vi
- viec/QUAY-UI-1/**
- client/src/pages/BanHang/**
- client/src/pages/Customers.jsx
- client/src/pages/Registrations.jsx
- client/src/pages/Orders.jsx
- client/src/pages/Settings.jsx
- client/src/utils/api.js
- client/dist/**
- server/routes/damages.js
- server/routes/registrations.js
- cong_cu/thu_QUAYUI1.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_QUAYUI1.js` ĐỎ trên gốc: báo sự cố đơn nạp trả câu / mã cũ; sửa đăng ký của khách App đổi tên khách App; (đọc nguồn / tính thử) khách có số
dư thì mặc định KHÔNG trừ tài khoản, có ba cách trả; tab Thẻ gửi `membership_buy`; form Thêm khách tra trước khi lưu.

## Ngân sách
~300 dòng giao diện + ~40 dòng máy chủ + ~200 dòng thử.
**Phương án đơn giản nhất đã xét:** dùng lại cửa / luật máy chủ sẵn có (phiên PIN, chiaTra); chỉ đổi khối thu tiền và thêm hai câu kiểm ở máy chủ.

## Đổi cấu trúc DB
không

## Thư viện mới
không

## Soát bảo mật
có — đụng đường bán thẻ (tiền) và sửa đăng ký.

## Cấm
Không đổi luật điểm (DIEM-MON-1), không làm bán thẻ trên App (KH-THE-1), không đổi orders.js.
