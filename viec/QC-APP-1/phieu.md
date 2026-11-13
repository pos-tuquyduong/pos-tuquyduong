# QC-APP-1 — Cài đặt "Quảng cáo trên App" (dải quảng cáo + banner Trang chủ theo ngày / khung giờ) + cửa GET /api/kh/quang-cao

<!-- Phiếu do chat soạn 13.11.2026 (bàn 36, sổ v64, main 171109f). Việc [Th] — Sonnet, làm thẳng tới hết, CÓ soát bảo mật (cửa công khai).
     Nguồn: thư App KH 09.11 "Dải quảng cáo App" + thư trả lời POS 09.11 (đã chốt tạm tên trường — App đang đợi đúng tên đó). BAO-1b đã gộp (#89):
     dùng thông báo chung (baoXong / baoLoi / baoLoiTu), thanh "Có thay đổi chưa lưu" (components/ThanhLuu.jsx), hỏi PIN lúc bấm Lưu (HoiPin.jsx) — y
     như pages/CaiDat/HangThe.jsx. Giờ vàng hiện đọc từ GET /api/kh/gio-vang (routes/kh/index.js) — dòng Giờ vàng tự động lấy ĐÚNG nguồn đó.
     Hợp đồng /api/kh: main là v14 (HUY-1), v15 đã dành cho VOUCHER-2 (đang làm) → việc này ghi **v16**; chat chỉnh số lúc gộp nếu cần.
     Bước nâng cấp: số 028 (026 VOUCHER-2, 027 ND-API-1). VOUCHER-2 và ND-API-1 cũng thêm thẻ vào Settings.jsx → Settings.jsx chỉ thêm vài dòng. -->

## Mục tiêu
Chủ quán tự chọn hôm nay / khung giờ nào App hiện chữ quảng cáo gì, không cần sửa code App.

## Nghiệm thu
- A **Thẻ Cài đặt "📣 Quảng cáo trên App"** (quyền manage_settings; phần lớn ở `pages/CaiDat/QuangCao.jsx`, Settings.jsx chỉ thêm nút thẻ + gọi thành
  phần): danh sách dòng quảng cáo; thêm / sửa / xoá; Lưu hỏi PIN chủ quán; báo lưu bằng thông báo chung; thanh "Có thay đổi chưa lưu"; lưu xong tải lại.
- B **Mỗi dòng:** (1) Chữ dải — bắt buộc, ≤ 32 ký tự (đếm theo ký tự nhìn thấy, emoji = 1), đếm ngược khi gõ, quá thì báo dưới ô và không lưu;
  (2) Tiêu đề / dòng phụ / chữ nút cho banner Trang chủ — tuỳ chọn (giới hạn độ dài hợp lý, ghi ở kế hoạch); (3) Bấm vào thì mở: Menu · một món
  (chọn trong danh sách món đang bán) · Ưu đãi · Trắc nghiệm thể trạng · không mở gì; (4) Khi nào hiện: hằng ngày / các thứ trong tuần / từ ngày –
  đến ngày, cộng khung giờ HH:mm – HH:mm (trống = cả ngày; giờ kết thúc phải sau giờ bắt đầu, không vắt qua nửa đêm); (5) Ưu tiên (nút lên / xuống) +
  công tắc Bật / Tắt; (6) Dòng xem trước dải mảnh như App (chữ dài bị cắt "…"); (7) Dưới ô chữ nhắc: "Không ghi công dụng chữa bệnh (quy định quảng
  cáo thực phẩm)."
- C **Giờ vàng tự động:** một công tắc "Khi Giờ vàng đang chạy thì dải hiện Giờ vàng"; bật và đang có giờ vàng → cửa trả thêm dòng `id: 'gio_vang'`,
  `uu_tien: 0`, `den_gio` = giờ kết thúc, chữ do máy chủ dựng từ cùng nguồn /api/kh/gio-vang (vd "⏰ Giờ vàng: giảm 20% đến 16:00", ≤ 32 ký tự).
- D **Cửa `GET /api/kh/quang-cao`** (không token) → `{ success, bay_gio, data[] { id, chu_dai, tieu_de, phu, chu_nut, dich, ma_mon, tu_gio, den_gio,
  uu_tien } }` đúng thư trả lời 09.11: chỉ dòng đang bật VÀ hợp NGÀY HÔM NAY theo giờ VN; `tu_gio` / `den_gio` null = cả ngày; `dich` ∈ 'menu' |
  'mon' | 'uudai' | 'tracnghiem' | ''; `ma_mon` chỉ khi `dich = 'mon'`; món đã tắt / đã xoá → trả `dich: 'menu'`, `ma_mon: null`; xếp theo `uu_tien`;
  không có dòng → `data: []`. Không lộ dòng đang tắt, dòng chưa tới ngày, ghi chú nội bộ.
- E **Máy chủ tự kiểm mọi luật** (không tin màn): độ dài, `dich`, món tồn tại, định dạng giờ / ngày, ngày kết thúc ≥ ngày bắt đầu; sai → 400 kèm câu báo
  rõ (màn hiện dưới đúng ô). Lưu cần PIN chủ quán như các thẻ Cài đặt khác.
- F **Lưu trữ:** bảng mới qua bước `028_quang_cao.js` (chỉ tạo bảng); có trong sao lưu (`routes/backup.js` BACKUP_TABLES) và được don-thu coi là cấu
  hình — KHÔNG xoá khi dọn dữ liệu thử (`server/utils/donThu.js`, bài cũ don-thu vẫn xanh).
- G **Hợp đồng `/api/kh` v16:** khối máy đọc thêm cửa `GET /quang-cao` + "Ghi chú v16" + dòng nhật ký v16; `thu_HOPDONG_KH` xanh.
- H **Bộ kiểm:** `cong_cu/thu_QCAPP1.js` ĐỎ trên gốc: lưu thiếu PIN bị từ chối; chữ 33 ký tự → 400; ngày / thứ / khung giờ lọc đúng (đặt giờ giả lập
  VN, gồm ca sát nửa đêm); món tắt → `dich: 'menu'`; dòng tắt không lộ; Giờ vàng tự động có / không; giao diện có thẻ, đếm ngược, xem trước, câu nhắc;
  nối vào kiem_tra_truoc_khi_giao.js; đột biến có bắt.
- K5 **Không đổi:** cửa /api/kh khác, Giờ vàng, Menu, tiền, đơn; bố cục các thẻ Cài đặt khác.

## Phạm vi
- viec/QC-APP-1/**
- server/routes/kh/index.js
- server/routes/quang-cao.js
- server/index.js
- server/nang_cap/028_quang_cao.js
- server/routes/backup.js
- server/utils/donThu.js
- client/src/pages/Settings.jsx
- client/src/pages/CaiDat/**
- client/src/utils/api.js
- client/dist/**
- HOP_DONG_API_KH.md
- cong_cu/thu_QCAPP1.js
- cong_cu/thu_HOPDONG_KH.js
- kiem_tra_truoc_khi_giao.js

## Bài thử đỏ
Có — `cong_cu/thu_QCAPP1.js` ĐỎ trên gốc: chưa có cửa /api/kh/quang-cao, bảng, thẻ Cài đặt.

## Ngân sách
~180 dòng máy chủ + ~280 dòng giao diện + ~300 dòng thử.
**Phương án đơn giản nhất đã xét:** một bảng, một đường Cài đặt (đọc / lưu cả danh sách một lần), một cửa đọc cho App; dùng lại thông báo / thanh lưu /
hỏi PIN của BAO-1b và nguồn Giờ vàng có sẵn.

## Đổi cấu trúc DB
có — bước `028_quang_cao.js` CHỈ tạo bảng mới; không đụng bảng cũ.

## Thư viện mới
không

## Soát bảo mật
có

## Cấm
Không đổi tên trường đã chốt với App (thư 09.11); không đổi /api/kh/gio-vang và các cửa khác; không làm giao diện dải / banner phía App; không đổi luật
Giờ vàng (GIOVANG-1 làm sau); không đổi bố cục / màu ngoài thẻ mới.
