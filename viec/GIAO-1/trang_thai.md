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
