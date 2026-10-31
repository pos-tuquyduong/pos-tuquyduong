# KH-MUA-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (31.10.2026)
- Nhánh: `viec/KH-MUA-1`; cây sạch.
- `git fetch origin viec/KH-MUA-1` → HEAD `5e797f2` · FETCH_HEAD `5e797f2` (bằng nhau, không kéo).
- `git log --oneline -3`:
  ```
  5e797f2 PHIEU: KH-MUA-1
  97d1de2 TIEN-DO: KH-API-3 (a95634f), KHACH-CK-1 (4b52370) xong; mo KH-MUA-1, KHO-2b, KH-SP-1, BH-CKTAY-1; quyet dinh 31.10 (bo giam tay, dat don App vi+QR); luat 6.9 — so v49
  4b52370 Merge pull request #55 from pos-tuquyduong/viec/KHACH-CK-1
  ```
- Có commit `PHIEU: KH-MUA-1`.

## Bước 3 — kế hoạch
- `ke_hoach.md` đã viết; agent phụ (chỉ đọc) soát theo 4 câu — kết quả ghi cuối `ke_hoach.md`.
- Phiếu dặn **Chờ duyệt kế hoạch** → commit, push, DỪNG ở đây. Các điểm cần chủ quán xác nhận: mục 8 của `ke_hoach.md`.

## Sự cố
- Người gác chặn `git fetch -q origin main` (GIT-KEO: chỉ kéo được nhánh việc) — đúng luật. Hệ quả: máy KHÔNG kiểm được KH-SP-1 đã gộp
  main chưa (số hợp đồng v5, bước nâng cấp 006) → ghi ở mục 8 câu Q1.

## Câu hỏi
- (đã trả lời 31.10) Q1–Q10 của `ke_hoach.md` mục 8: chủ quán đồng ý đề xuất. Không còn câu hỏi mở.

## Làm tiếp (`/lam-viec KH-MUA-1 tiep`, 31.10.2026)
- Bước 1: nhánh `viec/KH-MUA-1`, cây sạch; HEAD `76ce7c5` = FETCH_HEAD `76ce7c5` (không kéo). `git log --oneline -3`:
  ```
  76ce7c5 KH-MUA-1: ke hoach (cho chu quan duyet) + trang thai buoc 1
  5e797f2 PHIEU: KH-MUA-1
  97d1de2 TIEN-DO: KH-API-3 (a95634f), KHACH-CK-1 (4b52370) xong; mo KH-MUA-1, KHO-2b, KH-SP-1, BH-CKTAY-1; quyet dinh 31.10 (bo giam tay, dat don App vi+QR); luat 6.9 — so v49
  ```
- Chủ quán duyệt kế hoạch + Q1–Q10, thêm (31.10):
  1. POST /don nhận `tong_da_xem` BẮT BUỘC (số nguyên ≥ 0) — kiểm SAU tra khoá, TRƯỚC giữ khoá; khác số máy chủ tính → 409 `GIA_DA_DOI`
     dạng `{ error, code, bao_gia: <dạng /gio/bao-gia> }`, không tạo gì; thiếu / sai dạng → 400 `YEU_CAU_KHONG_HOP_LE`. Đột biến VS-bo-so-tong-da-xem.
  2. Hợp đồng v5 ghi nguyên câu "Trả lời 4xx của POST /don không giữ khoá gửi — gửi lại cùng khoa_gui được xử lý như lần đầu." + ca
     thử sau KHO_BAN, QUA_NHIEU_LAN (hết cửa sổ), NGOAI_GIO, PIN_SAI, GIA_DA_DOI → gửi lại cùng khoá → như lần đầu (mục [R] của bài thử).
- Lệch kế hoạch (đã làm theo hướng đơn giản hơn): KHÔNG tạo `server/routes/kh/don.js` — dòng route nằm ở `kh/index.js` (bài hợp đồng chỉ
  quét file này), thân xử lý ở `utils/donApp.js`. Thẻ cài đặt chuông đặt chung thẻ "Giờ hoạt động" (khỏi thêm tab mới ở 4 chỗ của Settings.jsx).
  Nút "Đơn App" luôn hiện góc trên phải mọi màn (đỏ + số khi có đơn mới) — chỗ duy nhất vào màn Đơn App.
- Ngân sách: máy chủ ~450 dòng thêm (phiếu ~350; vượt vì hai điều chủ quán thêm + tính lại không mã Q10 + so lại tổng sau khi tạo phiên);
  giao diện ~240 (phiếu ~200); thử ~795 (phiếu ~450; vượt vì mục [P], [R] chủ quán thêm và các ca soát kế hoạch đòi).

## Chỗ vá → đột biến (cổng A17, A18) — `python3 viec/KH-MUA-1/dot_bien.py`: 30 / 30 BẮT, đối chứng xanh
| Chỗ vá | Đột biến |
|---|---|
| giờ hoạt động `kiemGio` (B) | BV-BO-KIEM-GIO · VS-GIO-CHI-DANG-MO |
| món / tồn `dungItems` (B, Q7) | VS-CON-HANG-NULL-LA-HET · BV-HET-HANG-TONG-SL |
| báo giá `baoGia` (A, Q10) | VS-MA-GIAM-LOI-HONG-CA-GIO · VS-BAO-GIA-DON-GIA-HANG |
| tạo đơn qua phiên (C) | VS-CHOT-VI-KHONG-CHOT · BV-SO-DU-THANH-VI-KHONG-DU · VS-HET-HANG-SX-KHONG-DOI |
| `tong_da_xem` / GIA_DA_DOI (chủ quán 31.10) | VS-bo-so-tong-da-xem · VS-GIA-DA-DOI-THIEU-BAO-GIA · BV-KIEM-DANG-TONG-DA-XEM |
| luật 4xx — không giữ khoá (D, R) | BV-BO-XOA-GIU-KHOA |
| khoá gửi / lưới 10 giây / lượt (E, K) | VS-KHOA-GUI-NOI · VS-BAM-CO-PIN · VS-NHO-KHOA-MAI · BV-BO-LUOI-10-GIAY · VS-DEM-LUOT-TRUOC-TRA-KHOA · BV-TRAN-LUOT |
| tiến trình / đơn của khách (F) | VS-TIEN-TRINH-HET-HAN-VAN-CHO-TRA · BV-BO-DIEU-KIEN-SDT-DON |
| huỷ (G) | VS-HUY-DA-TRA |
| quầy (H) | BV-QUAY-THAY-DON-CHO-TRA · BV-DOI-TIEN-TRINH-CHUA-TRA |
| cài đặt chuông `settings.js` (H) | BV-CHUONG-KIEM · VS-AM-LUONG-101 |
| tiền về muộn (I) | BV-TIEN-VE-CO |
| hợp đồng v5 (J) | BV-HOPDONG-CAU-4XX · BV-HOPDONG-CUA-DON · VS-HOPDONG-MA-THIEU |

Tên đột biến: BV-BO-KIEM-GIO, VS-GIO-CHI-DANG-MO, VS-CON-HANG-NULL-LA-HET, BV-HET-HANG-TONG-SL, VS-MA-GIAM-LOI-HONG-CA-GIO,
VS-BAO-GIA-DON-GIA-HANG, VS-CHOT-VI-KHONG-CHOT, BV-SO-DU-THANH-VI-KHONG-DU, VS-HET-HANG-SX-KHONG-DOI, VS-bo-so-tong-da-xem,
VS-GIA-DA-DOI-THIEU-BAO-GIA, BV-KIEM-DANG-TONG-DA-XEM, BV-BO-XOA-GIU-KHOA, VS-KHOA-GUI-NOI, VS-BAM-CO-PIN, VS-NHO-KHOA-MAI,
BV-BO-LUOI-10-GIAY, VS-DEM-LUOT-TRUOC-TRA-KHOA, BV-TRAN-LUOT, VS-TIEN-TRINH-HET-HAN-VAN-CHO-TRA, BV-BO-DIEU-KIEN-SDT-DON, VS-HUY-DA-TRA,
BV-QUAY-THAY-DON-CHO-TRA, BV-DOI-TIEN-TRINH-CHUA-TRA, BV-CHUONG-KIEM, VS-AM-LUONG-101, BV-TIEN-VE-CO, BV-HOPDONG-CAU-4XX,
BV-HOPDONG-CUA-DON, VS-HOPDONG-MA-THIEU.

## Phát hiện (ngoài Phạm vi, không sửa)
- `server/utils/gioHoatDong.js:2–3` chú thích còn ghi mã `NGOAI_GIO_HOAT_DONG`; mã thật là `NGOAI_GIO` + `QUA_GIO_NHAN_DON` (hợp đồng v5 đã sửa).
- Sáu 4xx của taoDon không có `code` (`orders.js:365, 371, 393, 460, 488, 672`) — App nhận `DON_KHONG_HOP_LE` / `HET_HANG` (dò lời "Không đủ hàng:");
  thêm `code` thật ở orders.js nên làm ở việc sau.
- Bộ kiểm có sẵn 1 cảnh báo (GET có lệnh ghi: packages.js:194, products.js:67, sync.js:147) — có từ trước việc này.
- Người gác chặn vòng `for` trong bash (B-CHUONGTRINH) — chạy lặp bài thử phải gõ từng lần.
