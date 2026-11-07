# GIAO-1 — trạng thái

## Bước 1 — đối chiếu bản chụp
- Nhánh: viec/GIAO-1, cây sạch.
- HEAD 977aefa · FETCH_HEAD 977aefa (bằng nhau, không kéo).
- git log --oneline -3:
  - 977aefa PHIEU: GIAO-1
  - e7d0dd4 Merge pull request #73 from pos-tuquyduong/viec/SUA-SL-1
  - 35449d2 SUA-SL-1: trang thai, HEAD DA KIEM 4eb4e6f

## Bước 2–3
- Đọc phiếu, CLAUDE.md, KHUON_LOI.md, code thật (bảng nguồn ở ke_hoach.md mục 1).
- Tài liệu Ahamove: máy mây không mở được developers.ahamove.com (không phân giải tên); chỉ đọc được bản tóm tắt của công cụ tìm kiếm → ghi CHƯA KIỂM.
- Kế hoạch: ke_hoach.md; agent chỉ đọc soát 4 câu → bổ sung mục 10.
- Phiếu dặn "Chờ duyệt kế hoạch" → commit, push, DỪNG ở bước 3.

## Câu hỏi
Chi tiết + đề xuất ở ke_hoach.md mục 9 và mục 10:
- Q1 Ahamove không có gợi ý địa chỉ — chọn cách định vị (đề xuất: thử gửi địa chỉ chữ cho Ahamove bằng khoá THỬ).
- Q2 Thêm server/utils/giuCho.js vào Phạm vi (đơn giao trả QR / tài khoản).
- Q3 Hình mẫu màn Giao hàng 05.11 chưa có trong kho.
- Q4 Ghi hàng hỏng khi huỷ đơn Đang pha (damages.js ngoài Phạm vi).
- Q5 Chặn hoàn tiền đơn giao còn chuyến (refunds.js ngoài Phạm vi).

## Phiên 2 (06.11) — chủ quán DUYỆT kế hoạch ef672f9, trả lời Q1–Q5 (commit fa03775)
### Bước 1 — đối chiếu bản chụp
- Nhánh viec/GIAO-1, cây sạch. HEAD fa03775 · FETCH_HEAD fa03775 (bằng nhau, không kéo).
- git log --oneline -3:
  - fa03775 PHIEU: GIAO-1 chu quan tra loi cau hoi 05.11 (them file vao Pham vi)
  - ef672f9 GIAO-1: ke hoach (cho duyet) + trang thai, 5 cau hoi
  - 977aefa PHIEU: GIAO-1
- Thử khoá Ahamove THỬ (Q1 cách 2): KHÔNG làm được trên máy mây — người gác chặn curl tới máy ngoài ([CURL-HOST]) và máy không có khoá
  (đọc biến môi trường bị chặn [B-CHUONGTRINH]). Ghi CHƯA KIỂM; chủ quán thử tay (hướng dẫn ở báo cáo cuối).

### Bước 2–5 — đọc, bài thử trước, sửa
- Đọc: phiếu (câu trả lời fa03775), ke_hoach.md, code thật orders.js (taoDon 176–1258, huỷ 1449–1600, xoá 1638–1768), giuCho.js, refunds.js, damages.js,
  settings.js, hoaDon.js, backup.js, donThu.js, doiSoat.js, index.js, nang_cap/chay.js; client BanHangMoi.jsx, tinh.js, ThuTien.jsx, Settings.jsx,
  DoiSoat.jsx, hoaDon.js, InvoicePreview.jsx, App.jsx, QuanLy/menu.js (+ thu_BH2 khoá menu 6 mục).
- Bài thử viết TRƯỚC (59e3f59 … d09ffb5), chạy trên gốc: ĐỎ (bang_chung_do.txt). Sửa máy chủ 7123f8d, giao diện 6acfc5f.
- Đột biến lần 1: 29/30 BẮT, `VS-tin-lui` SỐNG — ca H8 bị lớp chống lặp che (tin lùi trùng khoá đã có). Truy ra lỗi thật: khoá chống lặp
  (mã, trạng thái, điểm giao) nuốt tin ACCEPTED lần hai khi Ahamove đổi tài xế. Viết H8 mới + H11 (đỏ trên 6acfc5f), sửa d0215a9.
- Kế hoạch mục 11 ghi các điểm chốt khi làm (Q1 hai cách, Q4 "Bỏ đi" không hoàn kho, không sửa dongHoaDon.js, nút mở màn Giao hàng).

### Chỗ vá → đột biến (viec/GIAO-1/dot_bien.py — mỗi chỗ có VS- hoặc BV-, có ĐỐI CHỨNG)
| Chỗ vá | Đột biến | Ca bắt |
|---|---|---|
| orders.js phí ship = báo phí khi có `giao` | VS-phi-man-hinh · VS-phi-don-thuong-0 | D1 · K5a |
| orders.js đơn giao phải thu đủ | BV-giao-thu-du | D8 |
| giaoHang.js một báo phí — một đơn (đọc trước + giành trong giao dịch) | BV-dung-mot-lan | D4 |
| giaoHang.js hạn báo phí; bỏ qua hạn khi chốt phiên | BV-han-bao-phi · VS-han-khi-chot | D5 · D9 |
| giuCho.js TRUONG_DON có `giao` | BV-giuCho-giao | D9 |
| settings.js kiểm khoá giao_* | BV-cai-dat-giao | B2 |
| giaoHang.js ô địa chỉ cách 1 chỉ nhận gợi ý | VS-goi-y-nhan-chu | C1 |
| giaoHang.js km tối đa | VS-km-bang-la-qua | C2 |
| ahamove.js chọn bản thật / thử | VS-moi-truong-khong-trim | A5 |
| giaoHang.js giành quyền gọi xe | BV-gianh-goi-xe | G2 |
| giaoHang.js tra theo mã theo dõi trước khi tạo lại | BV-tra-theo-ma | G4 |
| giaoHang.js chưa thu đủ không gọi xe | VS-chua-thu-van-goi | G1 |
| giaoHang.js chênh phí (quán bù / dư) | BV-chenh | G5 |
| giaoHang.js Tìm lại huỷ chuyến cũ trước | BV-tim-lai-huy-cu | I4 |
| giaoHang.js tài xế huỷ → tự tìm lại MỘT lần | BV-tu-tim-mot-lan | I2 |
| giao-hang.js xác thực khoá tin báo | BV-khoa-bao | H1 |
| giaoHang.js đọc lại trạng thái từ Ahamove (không tin thân) | VS-tin-than-tin | H4 |
| giaoHang.js chống lặp tin (gồm SĐT tài xế) | BV-chong-lap · VS-chong-lap-bo-tai-xe | H3 · H11 |
| giaoHang.js một chiều, ngoại lệ đổi tài xế | VS-tin-lui · BV-doi-tai-xe-ve-tim | H8 · H11 |
| giaoHang.js in tem một máy | BV-in-tem-mot-may | H9 |
| orders.js cổng huỷ đơn giao (đơn thường không đổi) | BV-cong-huy · VS-chan-don-thuong | J1 · K5b |
| giaoHang.js chờ HUY-1 (tiền mặt / CK) | BV-cho-huy-1 | J4 |
| orders.js "Bỏ đi" không hoàn kho | BV-bo-di-kho | J3b |
| giaoHang.js quyền huỷ chuyến | BV-quyen-huy-chuyen | J5 |
| orders.js xoá đơn có chuyến | BV-xoa-don-giao | J8 |
| refunds.js chặn hoàn đơn giao đang chạy | BV-hoan-don-giao | Q5 |
| giaoHang.js Đối soát bù / dư không triệt tiêu | VS-bu-du-triet-tieu | K1 |

Tên đột biến (đủ): VS-phi-man-hinh, VS-phi-don-thuong-0, BV-giao-thu-du, BV-dung-mot-lan, BV-han-bao-phi, VS-han-khi-chot, BV-giuCho-giao,
BV-cai-dat-giao, VS-goi-y-nhan-chu, VS-km-bang-la-qua, VS-moi-truong-khong-trim, BV-gianh-goi-xe, BV-tra-theo-ma, VS-chua-thu-van-goi, BV-chenh,
BV-tim-lai-huy-cu, BV-tu-tim-mot-lan, BV-khoa-bao, VS-tin-than-tin, BV-chong-lap, VS-chong-lap-bo-tai-xe, VS-tin-lui, BV-doi-tai-xe-ve-tim,
BV-in-tem-mot-may, BV-cong-huy, VS-chan-don-thuong, BV-cho-huy-1, BV-bo-di-kho, BV-quyen-huy-chuyen, BV-xoa-don-giao, BV-hoan-don-giao,
VS-bu-du-triet-tieu.

## Phát hiện
- `pos_damage_logs` không trừ kho SX (damages.js: hoàn kho là action riêng, "Chỉ ghi nhận" không đụng kho). Q4 "Bỏ đi" vì thế làm bằng KHÔNG hoàn kho
  + ghi hàng hỏng (kế hoạch mục 11) — kho đúng như chủ quán muốn. Sau KHO-3 (POS giữ kho) nên xem lại cách ghi hàng hỏng trừ kho.
- Đơn KHÔNG giao vẫn nhận `shipping_fee` màn hình gửi (màn cũ Sales.jsx có ô gõ tay phí ship) — chỉ làm khách trả thêm, điểm đã loại phần này. Đề xuất
  việc sau: bỏ ô phí ship màn cũ, máy chủ chỉ nhận phí ship qua `giao`.
- Hoá đơn App KH (utils/dongHoaDon.js) chưa có dòng "GIAO HÀNG" — thêm là đổi hợp đồng /api/kh, để KH-MUA-2 làm cùng hợp đồng.
- Chuyến `giao_loi` (Ahamove báo giao không thành) ở lại cột Đang giao, chưa có nút đóng / xử lý — chủ quán quyết cách xử lý (HUY-1 / báo sự cố).
- Màn Lịch sử đơn huỷ đơn giao sẽ nhận 400 CHON_DO_DA_PHA / LY_DO_BAT_BUOC (màn cũ không hỏi đồ đã pha) — huỷ đơn giao làm ở màn Giao hàng.

## Soát độc lập vòng 1 (/ra-soat, agent riêng) — chép nguyên văn
KHÔNG ĐẠT

LỖI TÌM ĐƯỢC:
1. client/src/pages/GiaoHang/index.jsx:24 + server/utils/giaoHang.js:199 + giaoHang.js:147,177,24 — thẻ ở trạng thái `dang_goi` mà không có `loi` hiện "Đang gọi xe…" và KHÔNG có nút nào. Máy chủ cho gọi lại khi lệnh treo quá 60 s (`goi_luc < now-60`), nhưng câu trả của danhSach không báo "treo" và màn chỉ hiện "Gọi lại" khi có `c.loi`. Huỷ đơn bị chặn (HUY_CHUYEN_TRUOC, dòng 146), xoá bị chặn (SONG, dòng 177), hoàn tiền cũng bị chặn (donGiaoDangChay). Chuyện này xảy ra khi tiến trình máy chủ chết giữa lúc đang gọi Ahamove (Render khởi động lại hoặc triển khai lại), ở cả nút Gọi tài xế lẫn đường tự tìm lại trong tin báo về. Kết quả: thẻ kẹt vĩnh viễn trên màn, chỉ gỡ được bằng gọi API tay. Khuôn K4 (máy chủ có đường, màn không có). Bài thử không có ca nào cho đường treo 60 s, và dot_bien.py không có đột biến nào cho vế `OR goi_luc < ?` → nếu gỡ vế này thì bộ đột biến không bắt (SỐNG).
2. server/routes/refunds.js:162–163 + giaoHang.js:183, 324–325 — duyệt hoàn tiền cho đơn giao đang ở `dang_pha` / `chuyen_huy` thì được (donGiaoDangChay chỉ chặn SONG). Đơn chuyển sang `refunded` nhưng chuyến vẫn giữ `dang_pha`. danhSach chỉ lọc `c.trang_thai NOT IN ('xong','huy')` mà không lọc `o.status`, nên thẻ nằm mãi ở cột Đang pha: "Gọi tài xế" trả 409 DON_KHONG_CON (dòng 194), huỷ đơn trả 400 (đơn không còn completed). Đường này cũng không hỏi đồ đã pha / hàng hỏng. Ca Q5 (thu_GIAO1.js:597–604) chỉ thử XIN hoàn lúc đang pha, rồi gọi xe trước khi duyệt — không có ca duyệt hoàn cho đơn đang pha. Khuôn K4 (hoàn tiền là đường song song với huỷ đơn, nhưng không đóng chuyến).
3. server/utils/giaoHang.js:373–386 — Đối soát cộng `phi_that` và `chenh` (quán bù / dư) của MỌI chuyến, kể cả chuyến đã huỷ ở Ahamove (`chuyen_huy` rồi đơn bị huỷ: `phi_that` vẫn giữ phí báo lúc tạo, dòng 236). Trong khi đó `phi_khach` chỉ tính đơn completed. Kết quả: "phí Ahamove thật" và "quán bù" bị thổi lên bằng số tiền Ahamove không thu. Ca K1 (thu_GIAO1.js:622–625) tính số kỳ vọng bằng CHÍNH công thức của code (cộng `phi_that` mọi chuyến), nên nó khoá luôn cả lỗi. Khuôn K3 (bài thử chép lại công thức đang thử) + tiền (sai báo cáo, không sai dòng tiền).
4. server/utils/giaoHang.js:276–284 — tin CANCELLED tới khi chuyến đang ở `dang_giao` (tài xế ĐÃ lấy hàng) mà `cancel_by_user === false` thì máy vẫn TỰ tạo chuyến mới tới lấy hàng tại quán, dù hàng đang trong tay tài xế cũ. Phiếu I chỉ nói "tài xế huỷ chuyến → tự tìm lại". Tự tìm lại nên giới hạn ở `tim_xe` / `doi_tai_xe`. Khuôn K5 ngược (cho qua một luồng không hợp lệ).
5. server/utils/giaoHang.js:2–3 (chú thích đầu file) — viết "mọi câu ghi trạng thái có `WHERE trang_thai = <cũ>` + kiểm `changes`". Sai với code: các dòng 164, 204, 219, 236, 241, 245 không kiểm `changes`; dòng 262 dùng `NOT IN (...)` chứ không dùng `= <cũ>`. Khuôn K1 (chú thích là khẳng định). Cũng vậy, server/utils/ahamove.js:7 viết "Lỗi ném { code, tho }" nhưng dòng 16 ném `{ code, status }`.
6. server/utils/giaoHang.js:202–206 ("Tìm lại") — huỷ chuyến cũ nhưng không đọc lại để cộng `phi_huy`. Sau đó `ma_ahamove` bị thay, nên tin báo huỷ của chuyến cũ bị bỏ qua (dòng 305–306). Phí huỷ (nếu có) không vào Đối soát, trái phiếu J/K. Khuôn K4 (huyChuyenGiao có đọc phí huỷ, Tìm lại thì không).

NGHI NGỜ:
- Có thể sinh HAI chuyến Ahamove (giaoHang.js:199, 215–237). Giữ quyền gọi chỉ bằng mốc 60 s và câu ghi cuối (dòng 236) chỉ kiểm `trang_thai='dang_goi'`, không có dấu nào cho biết máy nào đang giữ quyền. Máy A chậm quá 60 s (mỗi lời gọi Ahamove có thể tới 10 s, gọi lại khi gặp 401 thành gấp đôi; Tìm lại + tra mã + báo phí + tạo → lý thuyết quá 60 s) thì máy B giành lại, tra mã theo dõi chưa thấy chuyến của A, rồi tạo chuyến thứ hai cùng mã theo dõi. Câu ghi của A vẫn ghi đè. Ngoài ra dòng 236 không kiểm `changes`: thua giành thì vẫn trả `ok:true`, chuyến mới mồ côi ở Ahamove. Đề xuất: lấy `goi_luc` làm dấu giữ quyền (`WHERE goi_luc = ?`); thua thì huỷ chuyến vừa tạo.
- Có thể huỷ đơn khi chuyến vẫn sống: huyChuyenGiao dòng 262 cho `dang_goi` (dùng NOT IN). Nếu Ahamove trả 200 khi huỷ một chuyến đã huỷ, thì có thứ tự: tự tìm lại / Tìm lại giành `dang_goi` → quản lý bấm Huỷ chuyến (đã đọc `tim_xe`/`doi_tai_xe` trước đó) → dòng 262 đặt `chuyen_huy` → taoChuyenMoi tạo chuyến mới, ghi thua 0 dòng → đơn huỷ được (dòng 156) trong khi chuyến mới vẫn chạy. Phụ thuộc cách Ahamove trả lời — chưa kiểm.
- Đua giữa goiXe và duyệt hoàn tiền: goiXe đọc đơn (dòng 193) NGOÀI câu giành quyền (dòng 198). Hoàn tiền xong đúng khe đó thì vẫn gọi xe cho đơn đã hoàn. Gọn hơn: đưa điều kiện `EXISTS(... status='completed' AND payment_status='paid')` vào câu giành.
- Xoá đơn (orders.js:1683, giaoHang.js:174–181): chủ quán xoá được đơn có chuyến `xong` / `chuyen_huy`, dòng chuyến (có `phi_that`, `phi_huy`) bị xoá theo → Đối soát mất tiền quán thật đã trả Ahamove (trái ràng buộc 4, sổ chỉ-thêm). Xoá đơn giao trả tiền mặt / chuyển khoản lúc đang pha cũng đi vòng qua J: không cần lý do, không chặn CHO_HUY_1, không hỏi đồ đã pha, luôn hoàn kho. Chỉ chủ quán làm được, nhưng vẫn là đường song song của J.
- `nguoi_huy_la_quan` mặc định true khi Ahamove không gửi `cancel_by_user` (ahamove.js:100) → tính năng I (tự tìm lại) có thể không bao giờ chạy với Ahamove thật. Đây là phía an toàn, nhưng chưa đối chiếu.
- giaoHang.js:198 không xoá `loi` cũ khi giành quyền → lúc đang gọi, thẻ vẫn hiện lỗi cũ và nút "Gọi lại" (bấm thì 409, vô hại).

NGHIỆM THU: 12/12 mục có ca thử (A, B, C, D, E, F, G, H, I, J, K, K5), nhưng có chỗ yếu, mục thiếu: không mục nào thiếu hẳn.
- A: A1–A8 — có. B: B1–B7 — có (giao diện thẻ Cài đặt: thử tay). C: C1, C1b, C2–C4 — có. D: D1–D9, K5f — có (hoá đơn in thật: thử tay).
- E: E1, E2 — có ở máy chủ (màu 4 cột, tab điện thoại: thử tay). F: F1–F3 + F2 qua máy chủ — có; cờ `toi_gio` / `nhac` KHÔNG có ca.
- G: G1–G7 — có; đường treo 60 s: không ca, không đột biến. H: H1–H11 — có; đường đọc lại dự phòng trong danhSach KHÔNG có ca.
- I: I1–I4, I3 — có. J: J1–J11, Q5 — có; thiếu ca duyệt hoàn cho đơn đang pha. K: K1 — có, nhưng số kỳ vọng tính bằng chính công thức code.
- K5: K5a, K5b, K5f, D2, D3, đột biến VS-chan-don-thuong — có.
(K3: kiểm hành vi qua HTTP, không soi marker; HEAD 93 · 0. K5: không thấy luồng hợp lệ bị chặn oan. Đường tiền: không trường tiền nào lấy từ màn hình.
P1: client/src và dist cùng commit 6acfc5f.)
Đơn giản / đặt chỗ: giaoHang.js require `../routes/damages` (utils phụ thuộc routes); quyền quản lý định nghĩa hai lần (chiQuanLy / laQuanLy);
trang_thai.md chưa có kết quả cong.js và thao tác thử tay; tính năng tiền mới chưa có phép bất biến đối soát (bat_bien).

CHƯA SOÁT ĐƯỢC: không chạy lại đột biến / bài trên gốc; --day-du chưa xong khi nộp; cách Ahamove thật trả lời; giao diện.

BÀI HỌC: KHOÁ — ca duyệt hoàn đơn giao đang pha; ca dang_goi treo; ca đọc lại dự phòng; K1 số cứng; đột biến gỡ vế treo + gỡ khối đọc lại.
NGUYÊN TẮC — (a) K3 số kỳ vọng đối soát không tính bằng chính công thức đang thử; (b) K4 trạng thái máy chủ cho thoát phải có nút trên màn;
(c) K4 mọi đường đổi status đơn phải đóng / chặn bảng con có trạng thái riêng; (d) giành quyền bằng hạn giờ phải có dấu giữ quyền ở câu ghi kết thúc
+ kiểm changes, thua thì dọn tác dụng phụ bên ngoài.

### Vòng sửa 1 (sau soát vòng 1)
- Bài thử thêm (604b51c, đỏ trên bản trước sửa 94 · 7): G8 treo, G9 thua giành, I4b, I5, J8b, Q5b, K1 số cứng; thêm khoá F4 (toi_gio/nhac), H12 (đọc lại).
- Sửa (afade5e): lỗi 1 → cờ `treo` + nút "Gọi lại", treo 180 s; lỗi 2 → duyệt hoàn đóng chuyến chưa gọi xe (`dongChuyenKhiHoan`); lỗi 3 → Đối soát chỉ
  cộng phí thật / chênh của chuyến đã chạy (dang_giao, xong, giao_loi); lỗi 4 → huỷ khi dang_giao → giao_loi, không tự gọi xe; lỗi 5 → sửa chú thích đầu
  giaoHang.js, ahamove.js; lỗi 6 → Tìm lại đọc phí huỷ chuyến cũ. Nghi ngờ: dấu giữ quyền `goi_luc = <lúc giành>` ở mọi câu ghi khi gọi xe, thua thì
  huỷ chuyến vừa tạo (G9); câu giành kiểm lại đơn completed + paid; huyChuyenGiao chỉ đổi tim_xe / doi_tai_xe; không xoá đơn đã từng gọi xe
  (DON_GIAO_DA_GOI_XE); giành quyền xoá `loi` cũ; một hàm laQuanLy.
- Giữ nguyên, ghi lý do: `ghiHangHong` ở routes/damages.js (Phạm vi chỉ có damages.js — tạo utils/hangHong.js là ngoài Phạm vi; đề xuất việc sau);
  phép bất biến đối soát cho phí giao (cong_cu/gia_lap/bat_bien.js là file luật, ngoài Phạm vi — Đối soát hiện số, đề xuất việc sau);
  `cancel_by_user` thiếu → coi là quán huỷ (phía an toàn: không tự gọi xe) — CHƯA KIỂM với Ahamove thật.
- Đột biến: 41/41 BẮT (thêm BV-treo-goi-lai, BV-co-treo, BV-dau-giu-quyen, BV-huy-dang-giao, BV-phi-huy-tim-lai, BV-xoa-da-goi-xe,
  BV-hoan-dong-chuyen, BV-doc-lai-du-phong, VS-doi-soat-moi-chuyen). Bài: gốc 5 · 96, HEAD 101 · 0. npm test --day-du: 102 · 0 · 2 cảnh báo cũ.
| Chỗ vá vòng 1 | Đột biến | Ca bắt |
|---|---|---|
| treo cho gọi lại + cờ treo | BV-treo-goi-lai · BV-co-treo | G8 |
| dấu giữ quyền khi gọi xe | BV-dau-giu-quyen | G9 |
| huỷ khi đang giao không tự gọi xe | BV-huy-dang-giao | I5 |
| phí huỷ khi Tìm lại | BV-phi-huy-tim-lai | I4b |
| không xoá đơn đã gọi xe | BV-xoa-da-goi-xe | J8b |
| duyệt hoàn đóng chuyến | BV-hoan-dong-chuyen | Q5b |
| đọc lại dự phòng | BV-doc-lai-du-phong | H12 |
| Đối soát chỉ chuyến đã chạy | VS-doi-soat-moi-chuyen · VS-bu-du-triet-tieu | K1 |

## Soát độc lập vòng 2 (/ra-soat, agent riêng) — chép nguyên văn
KHÔNG ĐẠT

LỖI TÌM ĐƯỢC:
1. NẶNG (tiền) — K4/K5 ngược. server/utils/giaoHang.js:209, 214, 236, 241. Khi bấm "Gọi lại" trên thẻ treo `dang_goi` mà chuyến cũ còn sống, máy tạo chuyến thứ hai và không huỷ chuyến cũ. Khi nào: máy chủ chết đúng khe "Tìm lại" — đã giành `dang_goi` (dòng 208) nhưng chưa gửi xong lệnh huỷ (dòng 215); dòng chuyến `dang_goi`, `ma_ahamove = X` còn sống. Sau 180 s "Gọi lại": dòng 214 chỉ huỷ khi `c.trang_thai === 'tim_xe'` nên bỏ qua; taoChuyenMoi `traTheoMa` trả X, dòng 236 bỏ qua X vì `co.ma === c.ma_ahamove`, dòng 241 `tn = null` → tạo Y mã HD1-2. X và Y cùng chạy, tin báo của X bị bỏ (nhanTinBao 332–333 không thấy mã X), phí X không vào Đối soát. Đã chạy thật (scratchpad/probe.js): `goiXe → {ok:true, ma_ahamove:"Y1"}`, không có lệnh huỷ X. Bài thử không phủ: G8 dựng thẻ treo không có `ma_ahamove`. Hướng sửa: thẻ treo có `ma_ahamove` thì xử lý như "Tìm lại" — huỷ chuyến cũ trước, hoặc nhận lại chuyến cũ nếu còn sống.
2. NHẸ (sai tài xế trên thẻ / tem) — K3 + K4. giaoHang.js:337 (khoá chống lặp) + dòng 317 (chỉ tiến hạng). Ahamove thật gửi ASSIGNING ngay khi tạo chuyến → khoá `X|ASSIGNING||` đã có; đổi tài xế thì ASSIGNING lần hai bị nuốt, thẻ ở `doi_tai_xe` tài xế cũ; ACCEPTED tài xế mới cùng hạng nên dòng 317 bỏ; đọc lại dự phòng cũng không sửa (cùng hạng). Chạy thật (probe2.js): ASSIGNING → ACCEPTED B → ASSIGNING → ACCEPTED C → thẻ vẫn "TX B". H11 xanh oan vì bỏ tin ASSIGNING đầu. Đổi thẳng ACCEPTED B → C cũng bị bỏ. Hệ quả: tem in tài xế cũ.
3. NHẸ — K3: chỗ vá vòng sửa không có đột biến / ca: (a) vế `AND EXISTS (...)` của câu giành (dòng 211) — dòng 203 chặn trước, gỡ thì không ca nào đỏ; (b) huyChuyenGiao thu hẹp còn tim_xe / doi_tai_xe — không có ca Huỷ chuyến khi `dang_goi`; (c) giành quyền xoá `loi` cũ — không có ca.
4. NHẸ — K3: K1 `phi_khach` (thu_GIAO1.js:695–697) tính lại bằng SQL cùng công thức code; F2 qua máy chủ (dòng 370) tính kỳ vọng bằng chính `gioGoiTaiXe` (F1–F3 có số cứng nên bớt nặng).
5. NHẸ — K4, trạng thái không có nút thoát: thẻ `giao_loi` không có nút (index.jsx:28), không huỷ được (giaoHang.js:153), dongChuyenKhiHoan không đóng nó (191–192) → duyệt hoàn đơn `giao_loi` thì thẻ nằm mãi. Vòng sửa (298–301) mở thêm đường vào `giao_loi`.
6. NHẸ — K1. Chú thích giaoHang.js:3–4 nói mọi câu ghi khi gọi xe kèm dấu giữ quyền, nhưng dòng 309 (`SET loi = ? WHERE id = ?`, tự tìm lại) không có. huyChuyenGiao (284–286) không kiểm `changes`: Ahamove chấp nhận huỷ nhưng máy khác vừa "Tìm lại" thì vẫn `ok:true` trong khi đã có chuyến mới sống.
7. NHẸ — quy trình (LUAT §6.3–6.4): cổng `node tu_chay/cong.js chay . 977aefa^ HEAD viec/GIAO-1` → ĐỎ 1 lý do: A20 chưa có "SOÁT BẢO MẬT: ĐẠT"; trang_thai.md chưa ghi kết quả cổng và 1–3 thao tác thử tay.

NGHI NGỜ:
- Máy A gọi xe chậm quá 180 s (mỗi `goi` có thể tới 4 HTTP khi gặp 401): máy B giành lại, `traTheoMa` nhận lại chính chuyến A vừa tạo (236–239); A thua dấu giữ quyền nên huỷ `t.ma` (257) — đúng chuyến B vừa nhận. Thẻ `tim_xe` nhưng chuyến đã huỷ; tin báo sẽ đưa sang `chuyen_huy`. Nên kiểm `ma_ahamove` hiện tại ≠ `t.ma` trước khi huỷ.
- `giao_loi` do huỷ khi đang giao (299): cộng `phi_huy` mà Đối soát vẫn cộng `phi_that` (DA_CHAY có giao_loi) — có thể tính hai lần nếu Ahamove không thu cước chuyến huỷ; chưa đối chiếu.
- Q4: chủ quán viết "Huỷ luôn hoàn kho… Bỏ đi → ghi hàng hỏng để kho trừ lại đúng"; code "Bỏ đi" KHÔNG hoàn kho (orders.js:1604–1606). Kết quả kho hôm nay như nhau nhưng lệch lời chủ quán; sau KHO-3 nếu ghi hàng hỏng trừ kho thì trừ hai lần. Nên để chủ quán xác nhận.
- Hai phiên QR cùng một mã báo phí: phiên chốt sau 400 BAO_PHI_DA_DUNG, phiên 'loi' (giuCho.js:114–117) trong khi tiền đã về — cùng khuôn lỗi 4xx khác của taoDon.
- Duyệt hoàn đơn giao đang pha không hỏi đồ đã pha / hàng hỏng (refunds.js:165).
- `cancel_by_user` thiếu → coi là quán huỷ (ahamove.js:100) → tính năng I có thể không chạy với Ahamove thật.

NGHIỆM THU: 12/12 mục có bằng chứng · mục thiếu: không. Mục yếu: H (H11 không phủ kịch bản thật), K (`phi_khach` cùng công thức), G (G8 không phủ thẻ treo có mã chuyến).
(K3: bài đỏ trên gốc, kiểm hành vi qua HTTP. K4: taoDon 3 đường đủ; huỷ / xoá / hoàn 4 chỗ đủ, thiếu giao_loi; câu ghi trạng thái đều có điều kiện, 309 không có dấu giữ quyền; lộ khoá A3/A6 xanh. K5: không chặn oan. Đường tiền: phí ship từ báo phí, phí thật / chênh / phí huỷ đọc lại từ Ahamove; chưa có phép bất biến cho phí giao. P1: dist khớp src (afade5e). Đơn giản: utils → routes/damages; danhSach (GET) có thể gọi Ahamove và tự tìm lại; quyền quản lý viết lại ở client index.jsx:43.)

CHƯA SOÁT ĐƯỢC: chưa chạy lại 41 đột biến (lỗi 3 là suy luận); Ahamove thật; giao diện trên trình duyệt; đua thật trên Turso.

BÀI HỌC: KHOÁ — G8b thẻ treo có `ma_ahamove` sống; H11b có ASSIGNING đầu + đổi thẳng ACCEPTED → ACCEPTED; đột biến gỡ EXISTS + ca Huỷ chuyến khi dang_goi; K1 phi_khach số cứng.
NGUYÊN TẮC — (a) K3 kịch bản tin báo bên thứ ba phải bắt đầu từ tin ĐẦU TIÊN bên đó thật sự gửi; (b) K4 đường "gọi lại sau treo" phải xử lý tác dụng phụ còn dở của MỌI đường có thể treo; (c) K4 khoá chống lặp và luật "chỉ tiến hạng" phải cho cập nhật cùng hạng khi dữ liệu phụ đổi.

### Vòng sửa 2 (sau soát vòng 2)
- Bài thử thêm (51ffd8c, 0548ab4; đỏ trên bản trước sửa 103 · 3): G8b, H11b, Q5c; khoá thêm G10 (hoàn chen giữa đọc và giành), J5d (Huỷ chuyến khi đang gọi).
  K1 phí khách trả lấy từ SỔ CỦA BÀI (phí Ahamove giả lúc báo), không tính lại bằng công thức code.
- Sửa (2eab64e): lỗi 1 (NẶNG) → "Gọi lại" thẻ treo còn mã chuyến xử lý như Tìm lại: huỷ chuyến cũ trước; Ahamove từ chối huỷ thì đọc lại — đã CANCELLED
  mới đi tiếp, còn sống thì trả thẻ về như cũ. Lỗi 2 → đổi tài xế cùng hạng (SĐT tài xế khác) được cập nhật, biển số theo tài xế mới. Lỗi 5 → duyệt hoàn
  đóng cả thẻ giao_loi (lối ra duy nhất của giao_loi). Lỗi 6 → huyChuyenGiao kiểm changes (409 TRANG_THAI_DA_DOI); câu ghi lỗi sau tự tìm lại neo theo
  mã chuyến mới. Nghi ngờ 1 → máy thua không huỷ chuyến mà máy thắng đã nhận (so ma_ahamove hiện tại). Đối soát "chuyến đã chạy" theo dấu giờ
  (lay_hang_luc / xong_luc), không theo trạng thái — thẻ giao lỗi đóng khi hoàn vẫn giữ phí.
- Không làm: 3(c) giành quyền xoá lỗi cũ — chỉ hiển thị (câu ghi cuối cũng xoá lỗi), không ca riêng; F2 qua máy chủ vẫn dùng hàm gioGoiTaiXe để tính kỳ vọng
  (F1–F3 số cứng khoá hàm); Q4 "Bỏ đi" không hoàn kho — giữ, đưa vào câu cho chủ quán xác nhận (báo cáo cuối).
- Đột biến: 47/47 BẮT (thêm VS-doi-soat-theo-trang-thai, BV-treo-huy-chuyen-cu, BV-doi-tai-xe-cung-hang, BV-hoan-dong-giao-loi, BV-gianh-kiem-don,
  VS-huy-chuyen-khi-dang-goi). Bài: gốc 5 · 101, HEAD 106 · 0. npm test --day-du: 102 · 0 · 2 cảnh báo cũ.
| Chỗ vá vòng 2 | Đột biến | Ca bắt |
|---|---|---|
| Gọi lại thẻ treo huỷ chuyến cũ | BV-treo-huy-chuyen-cu | G8b |
| đổi tài xế cùng hạng | BV-doi-tai-xe-cung-hang | H11b |
| hoàn đóng thẻ giao_loi | BV-hoan-dong-giao-loi | Q5c |
| câu giành kiểm đơn | BV-gianh-kiem-don | G10 |
| huỷ chuyến chỉ tim_xe / doi_tai_xe | VS-huy-chuyen-khi-dang-goi | J5d |
| Đối soát theo dấu giờ đã chạy | VS-doi-soat-theo-trang-thai | K1 |

## Soát độc lập vòng 3 (/ra-soat, agent riêng, HEAD c2b0714) — chép nguyên văn
KHÔNG ĐẠT

Tóm tắt (của người soát): vòng sửa 2 vá đúng lỗi NẶNG của vòng 2 (hai chuyến sống), nhưng chính nhánh mới ở server/utils/giaoHang.js:219–229 gây ra hai lỗi NẶNG mới, chứng minh bằng script chạy trên HEAD c2b0714 với Ahamove giả của bài thử (scratchpad/p/probe.js, ngoài kho). Chạy lại: thu_GIAO1 106 · 0; --day-du 102 · 0 · 2 cảnh báo cũ, dist khớp src; cổng tu_chay/cong.js ĐỎ ở A20.

LỖI TÌM ĐƯỢC:
1. server/utils/giaoHang.js:219–226 (cùng :306, :368, :30) — thẻ treo `dang_goi` còn chuyến cũ X đang sống mà Ahamove không cho huỷ (tài xế đã lấy hàng). "Gọi lại" → dòng 223 trả thẻ về `dang_goi` với `goi_luc = now`, rồi kẹt vĩnh viễn: capNhatTuAhamove (306) bỏ qua mọi tin vì `dang_goi`; đọc lại dự phòng (368) không đọc `dang_goi`; huỷ đơn 409 (152), hoàn 409 (191 SONG), xoá 409 (183); gọi lại vẫn 502 rồi lại `dang_goi`; X giao xong mà `lay_hang_luc` null nên `daChay` false → Đối soát mất phí Ahamove quán đã trả. Probe P5: `goiXe 502 · dang_goi | sau COMPLETED dang_goi lay_hang null | gọi lại 502 dang_goi | huỷ đơn 409 HUY_CHUYEN_TRUOC`. Hướng sửa: chuyến cũ còn sống thì nhận lại nó (ghi `tim_xe` + mã X rồi `capNhatTuAhamove(c, cu)`), không trả về `dang_goi`. — NẶNG (tiền Đối soát + kẹt trạng thái) — K4.
2. server/utils/giaoHang.js:219 + :228–229 — nhánh `dang_goi` gọi huỷ và đọc lại phí huỷ của cả chuyến ĐÃ huỷ và ĐÃ cộng phí huỷ trước đó (294 huyChuyenGiao, 315 tự tìm lại, 323 chuyen_huy) → `phi_huy` cộng hai lần, Đối soát thổi phồng phí huỷ. Đường thường gặp: Quản lý Huỷ chuyến → Gọi tài xế → mất mạng → Gọi lại (probe P1: 5000 → 10000); tài xế huỷ → tự tìm lại gặp mất mạng → Gọi lại (P3: 3000 → 6000). Hướng sửa: chỉ cộng phí huỷ khi chính lệnh huỷ ở dòng 220 thành công (hoặc nhớ mã chuyến đã tính phí huỷ). Không ca nào. — NẶNG (tiền Đối soát) — K4/K3.
3. server/utils/giaoHang.js:211 + :223 — Ahamove từ chối huỷ chuyến cũ → thẻ trả về trạng thái cũ nhưng `goi_luc` vẫn `now`; câu báo "thử lại" nhưng gọi lại 409 DANG_GOI_XE suốt 10 phút (tim_xe) hoặc 180 s (dang_goi); `tim_lau` false nên nút Tìm lại biến mất. Probe P2. — NHẸ — K4.
4. dot_bien.py + thu_GIAO1.js — ba chỗ vá vòng 2 không có ca khoá (đột biến chạy bằng hàm chay() đều SỐNG): (a) :222 nhánh "còn sống → dừng" → `if (false)` quay về lỗi hai chuyến sống, không ca đỏ (G8b chỉ phủ huỷ X thành công); (b) :265 luôn huỷ chuyến vừa tạo kể cả chuyến máy thắng đã nhận; (c) :297 bỏ kiểm `changes` (TRANG_THAI_DA_DOI). Đột biến thứ tư (câu ghi lỗi tự tìm lại không neo mã mới) BẮT ở I2. — NHẸ, nhưng (a) khoá đường tiền NẶNG — K3.
5. server/routes/refunds.js:120 + giaoHang.js:155,194–195 — thẻ `giao_loi` của đơn trả tiền mặt / chuyển khoản không có lối ra: không xin hoàn được (cần `balance_amount > 0`), huỷ bị chặn (DANG_GIAO_KHONG_HUY), màn không có nút (index.jsx:28). trang_thai.md "lối ra duy nhất của giao_loi" chỉ đúng với đơn trả bằng tài khoản; Q5c dùng đơn ví. — NHẸ — K4/K1.
6. server/utils/giaoHang.js:350 — tin ASSIGNING lần hai (tài xế B bỏ chuyến) bị lớp chống lặp nuốt (khoá `X|ASSIGNING|…|` có từ tin đầu); thẻ vẫn "Đợi tài xế · TX B" tới lần đọc lại ≥ 60 s (probe P4). Tem túi in cho tài xế cũ không tự in lại khi đổi tài xế (index.jsx:71). — NHẸ — K4.
7. viec/GIAO-1/ke_hoach.md:241 — ghi "dang_goi treo > 60 s", code 180 s (giaoHang.js:21); chưa ghi thẻ treo còn mã chuyến thì huỷ chuyến cũ trước. — NHẸ — K1.
8. Quy trình (LUAT §6.3–6.4) — cổng ĐỎ 1 lý do A20 (chưa "SOÁT BẢO MẬT: ĐẠT"); trang_thai.md chưa ghi kết quả cổng và 1–3 thao tác thử tay. — NHẸ.

NGHI NGỜ:
- huyChuyenGiao đua tin báo: CANCELLED về trước dòng 294 thì thẻ đã `chuyen_huy`, quầy nhận 409 TRANG_THAI_DA_DOI dù huỷ đã xong (câu báo sai).
- Ahamove gửi `cancel_by_user=false` cho lệnh huỷ của chính quán → sau Huỷ chuyến máy sẽ tự tìm lại (314); thiếu `cancel_by_user` thì coi là quán huỷ (ahamove.js:100) → I có thể không chạy với Ahamove thật.
- giao_loi do huỷ khi đang giao: Đối soát cộng cả `phi_that` lẫn `phi_huy` (421, 424) — có thể hai lần.
- Q4 "Bỏ đi" không hoàn kho lệch lời chủ quán "huỷ luôn hoàn kho"; chờ chủ quán xác nhận.
- Hai phiên QR cùng mã báo phí: phiên chốt sau 400 BAO_PHI_DA_DUNG trong khi tiền khách đã về.
- danhSach (GET mỗi 15 s) có thể gọi Ahamove và tự tạo chuyến; chỉ khoá `doc_luc` chặn làm hai lần.

NGHIỆM THU: 12/12 mục có bằng chứng · thiếu: không. Yếu: G (không ca chuyến cũ không huỷ được), K (không ca phí huỷ cộng lặp), J/Q5c (giao_loi chỉ đơn ví). Giao diện thuần: thử tay (E màu / tab, B thẻ Cài đặt, D hoá đơn in, F chuông, H tem).
(K3: bài đỏ trên gốc, kiểm hành vi; H11b từ tin đầu nhưng H4, I2 chưa; F2 qua máy chủ vẫn dùng gioGoiTaiXe. K4: taoDon 3 đường đủ; huỷ / xoá / hoàn có cổng; hở ở nhánh treo. K5: không chặn oan. Đường tiền: không trường tiền nào từ màn hình; sai ở phi_huy cộng hai lần và daChay bỏ sót. Đơn giản: nhánh dang_goi gánh ba nghĩa — gọn hơn: lưu trạng thái trước khi giành (cột `truoc_goi`); utils require routes/damages; quyền quản lý viết lại ở index.jsx:43.)

CHƯA SOÁT ĐƯỢC: chưa chạy lại 47 đột biến (chỉ 4 đột biến thêm); Ahamove thật; giao diện; đua thật trên Turso.

BÀI HỌC: KHOÁ — ca Gọi lại thẻ treo khi chuyến cũ đã chạy (không huỷ được); ca phí huỷ không cộng lặp; ca giao_loi đơn tiền mặt / CK; đột biến cho 222 / 265 / 297.
NGUYÊN TẮC — (a) K4 trạng thái "trả về như cũ" sau lỗi phải được MỌI đường đọc trạng thái nhận ra; (b) K4 cộng tiền theo sự kiện bên thứ ba phải gắn ĐÚNG MỘT lần sự kiện, không mỗi lần đọc lại; (c) K3 mỗi nhánh vá mới (kể cả nhánh "dừng") phải có đột biến xoá nhánh đó làm bài đỏ.

## Câu hỏi
**Dừng ở bước 8 (/lam-viec): hết 3 vòng soát, lần cuối còn 2 lỗi NẶNG đụng tiền Đối soát (LUAT_XAY_APP §6.5 → không tự làm vòng 4).**
Chưa chạy bước 8b (soát bảo mật), chưa ghi báo cáo 7 mục / HEAD ĐÃ KIỂM — cổng `cong.js` sẽ đỏ A20 cho tới khi làm tiếp.

Lời thường: phần chính đã chạy (bài thử 106/106, đột biến 47/47, --day-du xanh), nhưng nút "Gọi lại" cho thẻ bị treo (máy chủ khởi động lại giữa lúc gọi
xe — hiếm) còn hai chỗ sai khi gặp trường hợp đặc biệt: (1) chuyến cũ đã có tài xế lấy hàng mà không huỷ được thì thẻ kẹt, Đối soát thiếu phí chuyến đó;
(2) phí huỷ chuyến có thể bị cộng hai lần trên màn Đối soát (không đụng tiền khách, chỉ sai số báo cáo quán chịu).

Đề xuất của mình (bạn chỉ cần trả lời "đồng ý vòng sửa 4" hoặc chỉnh):
- Q6: cho làm **vòng sửa 4** trong phiếu này, đúng các lỗi vòng 3 nêu:
  (a) đơn giản hoá nhánh treo: lưu `truoc_goi` (trạng thái trước khi giành) — khi Gọi lại thẻ treo còn mã chuyến: đọc chuyến cũ ở Ahamove — còn sống thì
  NHẬN LẠI nó (thẻ theo chuyến cũ, không tạo chuyến mới), đã huỷ thì gọi chuyến mới; (b) phí huỷ chỉ cộng khi CHÍNH lệnh huỷ của quán thành công (không
  cộng khi đọc lại chuyến đã huỷ trước đó); (c) Ahamove từ chối huỷ thì trả `goi_luc` cũ để nút bấm lại hiện ngay; (d) thẻ `giao_loi` có nút "Đóng thẻ"
  cho quản lý / chủ quán (kèm lý do, chỉ đóng thẻ, không đụng tiền) — đơn tiền mặt / CK hoàn tiền vẫn chờ HUY-1; (e) đổi tài xế tem tự báo "tài xế đổi —
  in lại tem"; ca thử + đột biến cho từng chỗ; rồi soát lại.
- Q7 (đã hỏi trong vòng soát): "Bỏ đi" hiện KHÔNG hoàn kho (vì ghi hàng hỏng không tự trừ kho SX — hoàn rồi ghi hỏng sẽ làm kho DƯ). Kho ra đúng như ý bạn.
  Bạn xác nhận giữ cách này? (Đề xuất: giữ; khi làm KHO-3 xem lại.)

## Phiên 3 (06.11) — chủ quán trả lời Q6 (đồng ý vòng sửa 4) + Q7 (giữ)
### Bước 1 — đối chiếu bản chụp
- Nhánh viec/GIAO-1, cây sạch. HEAD 360ca5b · FETCH_HEAD 360ca5b (bằng nhau, không kéo).
- git log --oneline -3:
  - 360ca5b GIAO-1: bao cao soat vong 3 (KHONG DAT, 2 loi NANG) — Cau hoi, dung o buoc 8
  - c2b0714 GIAO-1: vong sua 2 — bang chung do (goc 5 · 101, truoc sua 103 · 3, HEAD 106 · 0), trang thai
  - 0205e98 GIAO-1: dot bien BV-tim-lai-huy-cu neo lai sau vong sua 2
- Câu hỏi Q6, Q7 ở trên: ĐÃ TRẢ LỜI (Q6 đồng ý vòng sửa 4; Q7 giữ "Bỏ đi" không hoàn kho).

### Q7 — ghi cho KHO-3
"Bỏ đi" khi huỷ đơn giao: KHÔNG hoàn kho SX + ghi hàng hỏng (pos_damage_logs, action 'none') đúng món + số lượng. Lý do: ghi hàng hỏng không tự trừ kho,
nên hoàn kho rồi ghi hỏng sẽ làm kho DƯ. Chủ quán chốt 06.11 giữ cách này. **KHO-3 (POS giữ kho) phải xem lại:** nếu ghi hàng hỏng bắt đầu trừ kho thì
đường "Bỏ đi" phải đổi sang hoàn kho + ghi hỏng (không thì trừ hai lần).

### Vòng sửa 4
- Bài thử viết trước (72bdc72, cee5f81): đỏ trên code trước vòng 4 (106 · 8), xanh sau (114 · 0); gốc 5 · 109.
- Sửa (c21ecf4): lỗi 1 vòng 3 → nhận lại chuyến cũ còn chạy / đã xong (`nhanLaiChuyenCu`); lỗi 2 → phí huỷ chỉ khi lệnh huỷ của quán thành công
  (bỏ ở các đường tự huỷ); lỗi 3 → không đọc được chuyến cũ thì giữ goi_luc cũ; lỗi 4 → đột biến cho nhánh "dừng/nhận lại" (BV-nhan-lai-chuyen-cu),
  không huỷ chuyến máy thắng (BV-khong-huy-chuyen-may-thang + ca G9b), TRANG_THAI_DA_DOI (BV-trang-thai-da-doi + ca J5f); lỗi 5 → nút "Đóng thẻ" giao lỗi;
  lỗi 7 → ke_hoach 180 s + mục 12. Lỗi 6 (tin ASSIGNING lần hai bị nuốt, thẻ hiện tài xế cũ tới lần đọc lại ≥ 60 s; tem không tự in lại) — NHẸ, không thuộc
  Q6, ghi Phát hiện. Lỗi 8 (cổng / thử tay) — làm ở bước 8b–11.
- Đột biến: 57/57 BẮT. npm test --day-du: 102 · 0 · 2 cảnh báo cũ.
| Chỗ vá vòng 4 | Đột biến | Ca bắt |
|---|---|---|
| nhận lại chuyến cũ còn chạy | BV-nhan-lai-chuyen-cu · VS-nhan-lai-khong-ap-trang-thai | G8b / G8c / I6 |
| chuyến cũ đã huỷ → gọi mới, không cộng phí | VS-nhan-lai-khi-da-huy · VS-phi-huy-moi-lan-doc | J5e |
| không đọc được → giữ goi_luc cũ | BV-giu-goi-luc-cu | GL |
| Đóng thẻ giao lỗi | BV-dong-the · VS-dong-the-nhan-vien · VS-dong-the-moi-the | DT |
| không huỷ chuyến máy thắng đã nhận | BV-khong-huy-chuyen-may-thang | G9b |
| huỷ chuyến kiểm changes | BV-trang-thai-da-doi | J5f |

## Phát hiện (thêm phiên 3)
- Tin ASSIGNING lần hai (tài xế bỏ chuyến) trùng khoá chống lặp với tin ASSIGNING đầu → thẻ hiện tài xế cũ tới lần đọc lại dự phòng (≥ 60 s, khi màn hỏi).
  Đổi thẳng tài xế (ACCEPTED → ACCEPTED) thì cập nhật ngay. Tem túi không tự in lại khi đổi tài xế — quầy bấm "In lại tem túi". Đề xuất việc sau.
- Thẻ `da_dong` (đã đóng) của đơn tiền mặt / CK: tiền hoàn cho khách (nếu có) chờ HUY-1.

## Soát độc lập sau vòng sửa 4 (chủ quán cho thêm một lần soát) — chép nguyên văn
KHÔNG ĐẠT

Tóm tắt (của người soát): vòng sửa 4 sửa đúng hai lỗi NẶNG của vòng 3 (nhận lại chuyến cũ còn chạy — G8b, G8c, I6 xanh; đọc lại chuyến đã huỷ không cộng phí lần nữa — J5e). Lỗi 3, 4, 5 cũng đã xử lý phần lớn. Nhưng nút "Đóng thẻ" sinh lỗi NẶNG: đóng thẻ xong thì Huỷ đơn được → ví khách được hoàn và kho được cộng lại cho hàng đã đi theo tài xế. Chứng minh bằng script chạy thật trên HEAD 2af349d, ngoài kho (scratchpad/p4/probe.js). Chạy lại: thu_GIAO1 114 · 0; dot_bien 57/57 BẮT; --day-du 102 · 0 · 2 cảnh báo cũ, dist khớp src. Đột biến thêm của người soát (scratchpad/p4/them_db.py): 3 BẮT, 9 SỐNG.

LỖI TÌM ĐƯỢC:
1. server/utils/giaoHang.js:152–157 (kiemHuyDonGiao) + :418–424 (dongThe) — NẶNG (ví + kho; trái phiếu J "Đang giao → KHÔNG huỷ trên máy") — K4. Trạng thái `da_dong` không nằm trong danh sách chặn nào của kiemHuyDonGiao; thẻ `giao_loi` bị chặn Huỷ đơn (DANG_GIAO_KHONG_HUY) nhưng sau "Đóng thẻ" thì lọt: hoàn ví (orders.js:1519), cộng lại kho SX cho hàng đã ra đường (orders.js:1605–1630, pos_stock_pending 'in'), chotHuyGiao đổi `da_dong` → `huy`. Probe P1 (đơn ví): huỷ trước đóng thẻ 409; đóng thẻ 200; huỷ lại 200 — ví 9.915.000 → 10.000.000, kho chờ `[out 2, in 2]`, đơn cancelled. Thẻ hứa "không đụng tiền / đơn" (dongThe :416–417, ke_hoach.md:262) nhưng mở khoá đường tiền. Đơn tiền mặt / CK vẫn chặn ở CHO_HUY_1. Ca DT chỉ dùng đơn tiền mặt, không thử Huỷ sau Đóng thẻ. Hướng sửa: thêm `'da_dong'` vào danh sách :155 + ca "đơn ví: Đóng thẻ rồi Huỷ → 409" + đột biến bỏ `'da_dong'`.
2. Lệnh huỷ của quán đã thành công ở Ahamove mà phí huỷ không được ghi — NẶNG (Đối soát thiếu; hiếm) — K4/K3. (a) giaoHang.js:223–232: "Tìm lại" huỷ X thành công (`daHuy = true`) nhưng đọc lại X lỗi → `cu === undefined` → không cộng → gọi chuyến mới; phí mất hẳn. Probe P3: phí 4.000 → phi_huy 0. Đột biến bỏ `&& !daHuy` SỐNG. (b) giaoHang.js:308–312: phí gắn vào UPDATE có điều kiện trạng thái — Huỷ chuyến của quản lý thành công mà thẻ vừa đổi (nhân viên bấm Tìm lại đúng lúc) → UPDATE thua → 409 TRANG_THAI_DA_DOI, phí mất; Tìm lại đọc X đã huỷ nên GỌI CHUYẾN MỚI, trái ý quản lý vừa huỷ. Probe P7: `huỷ 409 TRANG_THAI_DA_DOI | Tìm lại 200 | thẻ tim_xe mã AHA10 (cũ AHA9) phi_huy 0` với phí 5.000. J5f chỉ kiểm mã 409. Cả hai có từ trước vòng 4, vòng 4 không gỡ.
3. Thiếu ca khoá cho chỗ vá vòng 4 — NHẸ, (a) khoá đường tiền — K3. (a) bỏ cộng phí huỷ ở ba đường tài xế / Ahamove tự huỷ (:325, :330, :338) không có ca: đưa lại `phi_huy = phi_huy + d.phi_huy` đều SỐNG (ca tài xế huỷ chạy với cancel_fee 0); (b) điều kiện chống đua nhanLaiChuyenCu (:242–244): bỏ ma_ahamove / goi_luc / kiểm changes đều SỐNG; (c) câu trả thẻ về :227 bỏ điều kiện trang_thai/goi_luc → SỐNG; (d) câu cộng phí :232 bỏ `goi_luc = ?` → SỐNG.
4. giaoHang.js:226–229 — NHẸ — K4/K5. Câu trả thẻ về giữ goi_luc cũ nhưng không giữ loi_mang (câu giành :211 đặt loi_mang = 0): thẻ dang_goi treo do mất mạng (loi_mang 1, chưa 180 s) mà đọc chuyến cũ lỗi → 502, thẻ hết treo, mất nút Gọi lại, bấm lại 409 tới 180 s. Probe P2. ke_hoach.md:260 "bấm lại được ngay" sai trong ca này.
5. giaoHang.js:242 + :365 — NHẸ — K4. Tin báo tới lúc thẻ còn dang_goi vẫn ghi vào sổ chống lặp còn capNhatTuAhamove bỏ qua; sau nhận lại, tin ACCEPTED cùng tài xế bị coi là lặp; nhanLaiChuyenCu đặt doc_luc = now nên đọc lại dự phòng lùi ≥ 60 s. Probe P5: thẻ kẹt tim_xe dù Ahamove ACCEPTED.
6. Chú thích / hồ sơ lệch code — NHẸ — K1. giaoHang.js:192–193 "giao_loi chỉ thoát được qua đây" (nay có Đóng thẻ); đầu file :7–8 thiếu `da_dong`; ke_hoach.md:260 như lỗi 4.

NGHI NGỜ:
- :223 lệnh DELETE "Tìm lại" báo mất mạng nhưng Ahamove thực ra đã huỷ theo lệnh quán (cancel_by_user = true, có cancel_fee) → không cộng phí (probe P4). Có tính là "lệnh huỷ thành công" không? Chủ quán chốt. Gợi ý: dùng `cu.nguoi_huy_la_quan`.
- Quán huỷ thẳng trên app Ahamove (không qua POS) → :338 chuyen_huy, không ghi phí. Hợp chữ Q6 nhưng Đối soát thiếu.
- ahamove.js:100: Ahamove thật gửi cancel_by_user thế nào — chưa đối chiếu.

NGHIỆM THU: 12/12 mục có ca · yếu: J (lỗ da_dong), K (phí huỷ thiếu; không ca khoá việc bỏ phí ở đường tài xế huỷ); giao diện thuần thử tay. K5: không chặn oan trừ lỗi 4. Đường tiền: phí ship, chênh do máy chủ; Đối soát theo dấu giờ đúng; lỗi ở phí huỷ và cổng huỷ đơn. Đua: không còn hai chuyến cùng chạy; P7 một chuyến MỚI được gọi sau khi quản lý vừa huỷ.

CHƯA SOÁT ĐƯỢC: Ahamove thật; giao diện điện thoại; đua thật trên Turso; cổng cong.js; soát bảo mật; refunds.js với da_dong chỉ đọc code.

BÀI HỌC: KHOÁ — ca đơn ví Đóng thẻ rồi Huỷ → 409; ca phí huỷ ≠ 0 ở ba đường tài xế huỷ + đột biến; ca huỷ thành công đọc lại lỗi vẫn ghi phí; J5f kiểm phi_huy; ca thẻ treo loi_mang + đọc lỗi vẫn còn nút Gọi lại.
NGUYÊN TẮC (K4) — thêm trạng thái mới thì grep MỌI danh sách trạng thái ở các cổng trước dòng đầu tiên; lời hứa "không đụng tiền" phải có ca đi tiếp vào đường tiền SAU thao tác đó; tiền bên thứ ba đã phát sinh ghi ngay sau lệnh thành công, không gắn vào câu ghi trạng thái có thể thua.

## Câu hỏi (phiên 3)
**Dừng ở bước 8: lần soát chủ quán cho thêm sau vòng sửa 4 vẫn KHÔNG ĐẠT, còn 2 lỗi NẶNG đụng ví / kho / Đối soát (LUAT §6.5 → không tự sửa thêm).**
Chưa chạy soát bảo mật, cổng, báo cáo 7 mục.

Lời thường: vòng 4 đã chữa đúng hai lỗi bạn duyệt. Nhưng nút "Đóng thẻ" mình thêm có lỗ: đơn trả bằng tài khoản, đóng thẻ giao lỗi xong lại bấm
Huỷ đơn được → khách được hoàn tiền vào tài khoản và kho cộng lại món đã theo tài xế đi. Lỗi do mình, sửa chỉ một chữ (thêm "đã đóng" vào danh sách chặn huỷ).
Ngoài ra phí huỷ chuyến có thể bị thiếu trên Đối soát trong hai trường hợp hiếm (máy đọc lại Ahamove lỗi đúng lúc, hoặc hai người bấm cùng lúc).

Đề xuất (bạn chỉ cần trả lời "đồng ý vòng sửa 5" hoặc chỉnh):
- Q8: cho làm **vòng sửa 5** đúng các lỗi lần soát này nêu, rồi soát lại một lần:
  (1) thẻ "đã đóng" chặn Huỷ đơn như thẻ giao lỗi (+ ca đơn tài khoản);
  (2) phí huỷ ghi NGAY sau khi lệnh huỷ của quán thành công, tách khỏi câu đổi trạng thái thẻ (không mất khi thẻ vừa đổi, không mất khi đọc lại lỗi —
      đọc lỗi thì ghi "phí huỷ chưa rõ" và đọc lại lần sau);
  (3) quản lý vừa Huỷ chuyến thì "Tìm lại" của máy khác không được gọi chuyến mới;
  (4) thẻ treo mất mạng mà đọc chuyến cũ lỗi vẫn giữ nút "Gọi lại"; tin báo tới lúc thẻ đang treo không bị đánh dấu "đã xử lý";
  (5) ca thử + đột biến cho mọi chỗ vá vòng 4 còn thiếu (ba đường tài xế huỷ không cộng phí, chống đua khi nhận lại), sửa chú thích.
- Q9: Ahamove báo chuyến bị huỷ "theo lệnh của quán" (cancel_by_user) nhưng lệnh huỷ của máy bị mất mạng, chưa biết thành công — có tính phí huỷ không?
  Đề xuất: CÓ (Ahamove xác nhận quán huỷ = lệnh của quán thành công). Quán huỷ thẳng trên app Ahamove (không qua POS) cũng tính theo cách này.

## Phiên 4 (07.11) — chủ quán trả lời Q8 (đồng ý vòng sửa 5) + Q9 (CÓ — tính phí huỷ khi Ahamove báo huỷ theo lệnh của quán, kể cả lệnh mất mạng
## và quán huỷ thẳng trên app Ahamove)
### Bước 1 — đối chiếu bản chụp
- Nhánh viec/GIAO-1, cây sạch. HEAD 515a021 · FETCH_HEAD 515a021 (bằng nhau, không kéo).
- git log --oneline -3:
  - 515a021 GIAO-1: bao cao soat sau vong sua 4 (KHONG DAT, 2 loi NANG) — Cau hoi Q8, Q9, dung o buoc 8
  - 2af349d GIAO-1: vong sua 4 — bang chung do (goc 5 · 109, truoc 106 · 8, HEAD 114 · 0), ke hoach muc 12, trang thai, Q7 ghi cho KHO-3
  - c21ecf4 GIAO-1: vong sua 4 (chu quan Q6) — Goi lai / Tim lai doc chuyen cu: con chay thi nhan lai, da huy thi goi moi; phi huy chi khi lenh huy cua quan thanh cong; khong doc duoc giu goi_luc cu; Dong the giao loi; dot bien them 10
- Câu hỏi Q8, Q9 (phiên 3): ĐÃ TRẢ LỜI.

### Q9 — ghi cho sổ quyết định (chủ quán chốt 07.11)
Phí huỷ chuyến quán chịu = chuyến huỷ THEO LỆNH CỦA QUÁN: lệnh huỷ của máy thành công, HOẶC Ahamove báo chuyến huỷ theo lệnh quán (`cancel_by_user`) —
kể cả lệnh của máy bị mất mạng và quán huỷ thẳng trên app Ahamove. Tài xế / Ahamove tự huỷ → không tính phí huỷ.

### Vòng sửa 5
- Bài thử viết trước (391a19e, a4336b2): đỏ trên code trước vòng 5 (116 · 11), xanh sau (127 · 0); gốc 5 · 122 (bang_chung_do.txt).
- Sửa (9539c56):
  (1) thẻ `da_dong` chặn Huỷ đơn như `giao_loi` (V1 — đơn tài khoản: đóng thẻ rồi huỷ → 409, ví / kho / đơn không đổi);
  (2) phí huỷ ghi bằng MỘT hàm `ghiPhiHuy` — dấu `PHI_HUY` (mỗi mã chuyến một lần) + cộng phi_huy trong một giao dịch, TÁCH khỏi câu đổi trạng thái thẻ;
      lệnh huỷ thành công mà không đọc được chuyến → dấu `CHO_PHI_HUY`, Đối soát hiện "n chuyến chưa rõ phí huỷ", màn Giao hàng hỏi thì đọc lại
      (`docLaiPhiHuy`); Q9: Ahamove báo huỷ theo lệnh quán (capNhatTuAhamove, Gọi lại thẻ treo) cũng ghi qua hàm này; tài xế huỷ → không;
  (3) "Tìm lại" mà chuyến cũ vừa bị huỷ bởi việc khác (Ahamove từ chối lệnh huỷ của máy này, đọc lại thấy CANCELLED) → KHÔNG gọi chuyến mới, thẻ theo
      tin huỷ, 409 CHUYEN_DA_HUY; `goi-xe {tu}` — màn gửi trạng thái đang thấy, khác → 409 TRANG_THAI_DA_DOI; Huỷ chuyến mà thẻ đã chuyen_huy theo
      chính chuyến đó → 200;
  (4) câu trả thẻ về giữ loi_mang (thẻ treo vì mất mạng vẫn còn nút Gọi lại); tin báo lúc thẻ dang_goi → 409 DANG_GOI_XE, không ghi sổ chống lặp;
  (5) ca + đột biến cho chỗ vá vòng 4 còn thiếu (V8 tài xế huỷ có phí, V11–V13 chống đua nhận lại / trả thẻ về), sửa chú thích đầu giaoHang.js
      (da_dong, phí huỷ), chú thích dongChuyenKhiHoan / dongThe, ke_hoach.md mục 12 + mục 13 mới.
  Giao diện: client/src/utils/api.js (goiXe gửi `tu`), GiaoHang/index.jsx (gửi trạng thái thẻ), DoiSoat.jsx (dòng "chưa rõ phí huỷ"); build dist cùng commit.
- Neo lại đột biến cũ sau vá (cùng nghĩa, chuỗi mới): BV-phi-huy-tim-lai, BV-nhan-lai-chuyen-cu, VS-nhan-lai-khi-da-huy, VS-phi-huy-moi-lan-doc,
  BV-giu-goi-luc-cu, BV-trang-thai-da-doi.
- Đột biến: 72/72 BẮT (đối chứng XANH 127 · 0). npm test -- --day-du: PASS 102 · FAIL 0 · CẢNH BÁO 2 (hai cảnh báo cũ), dist khớp src.
| Chỗ vá vòng 5 | Đột biến | Ca bắt |
|---|---|---|
| da_dong chặn huỷ đơn | BV-da-dong-chan-huy | V1 |
| phí huỷ ghi ngay sau lệnh, tách câu trạng thái | BV-phi-huy-tach-cau-trang-thai | J5 / J5f |
| phí huỷ một lần mỗi mã chuyến | VS-phi-huy-moi-lan-doc | J5e / V2 / V3 / V5 |
| "phí huỷ chưa rõ" khi đọc lỗi | BV-cho-phi-huy | V2 |
| đọc lại phí huỷ chưa rõ | BV-doc-lai-phi-huy | V2 |
| Q9 Ahamove báo huỷ theo lệnh quán | BV-q9-huy-theo-lenh-quan | V5 / V6 |
| tài xế huỷ không phí | VS-phi-huy-moi-nguoi-huy | V8 |
| Tìm lại không gọi chuyến mới khi chuyến vừa bị huỷ | BV-tim-lai-chuyen-da-huy · VS-nhan-lai-khi-da-huy | V3 / V7 |
| Huỷ chuyến: thẻ đã chuyen_huy theo chính chuyến → 200 | BV-huy-chuyen-the-da-huy | V3 |
| `tu` — trạng thái màn đang thấy | BV-tu-trang-thai | V4 |
| câu trả thẻ về giữ loi_mang | BV-giu-loi-mang | V9 |
| tin lúc đang gọi không ghi sổ | BV-tin-khi-dang-goi | V10 |
| nhận lại: điều kiện goi_luc / mã chuyến / changes | VS-nhan-lai-bo-goi-luc · VS-nhan-lai-bo-ma · BV-nhan-lai-changes | V11 / V12 / V11 |
| câu trả thẻ về: điều kiện trạng thái + goi_luc | VS-tra-ve-bo-dieu-kien | V13 |

Tên đột biến thêm vòng 5: BV-da-dong-chan-huy, BV-phi-huy-tach-cau-trang-thai, BV-cho-phi-huy, BV-doc-lai-phi-huy, VS-phi-huy-moi-nguoi-huy,
BV-q9-huy-theo-lenh-quan, BV-tim-lai-chuyen-da-huy, BV-huy-chuyen-the-da-huy, BV-tu-trang-thai, BV-giu-loi-mang, BV-tin-khi-dang-goi,
VS-nhan-lai-bo-goi-luc, VS-nhan-lai-bo-ma, BV-nhan-lai-changes, VS-tra-ve-bo-dieu-kien.

## Phát hiện (thêm phiên 4)
- server/utils/giaoHang.js nay ~500 dòng (LUAT §3: sắp vượt thì tách theo việc). Đề xuất việc sau: tách phần Ahamove báo về + phí huỷ
  (`capNhatTuAhamove`, `nhanTinBao`, `ghiPhiHuy*`, `docLaiPhiHuy`) sang file riêng — không làm trong vòng sửa (ngoài 5 điểm Q8).
- `goi-xe` không gửi `tu` (công cụ cũ / gọi tay) thì không kiểm trạng thái màn — màn quầy luôn gửi; bảo vệ đua thật vẫn ở câu giành + nhánh
  "chuyến vừa bị huỷ".

