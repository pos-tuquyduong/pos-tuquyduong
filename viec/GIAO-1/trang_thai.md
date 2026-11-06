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
