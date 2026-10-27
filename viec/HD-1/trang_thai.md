# HD-1 — trạng thái

## Đối chiếu bản chụp (27.10.2026)
- Nhánh viec/HD-1; HEAD = FETCH_HEAD = f1fea71 (không kéo, bằng nhau)
- f1fea71 PHIEU: HD-1
- b1f8299 TIEN-DO: UUDAI-1 duyet (f7165ea); them KHO-1..3 ... so v42
- 40e07ce TIEN-DO: P3 (56e090d), BH-1 (9fd32af), DIEM-THAT-1 xong; mo UUDAI-1 ... so v41

## Câu hỏi
1. **Thư viện `qrcode-generator` 1.4.4** (phiếu mục "Thư viện mới: có") — người gác chặn `npm install` ("[NPM-LENH] npm chỉ cho test, ci, run, ls — thêm thư viện phải hỏi chủ quán"). Em không lách. Nhờ chủ quán chạy `cd client && npm install --save-exact qrcode-generator@1.4.4` (hoặc nới người gác) rồi commit `client/package.json` + `client/package-lock.json`. Trong lúc chờ, em làm hết phần không cần thư viện (máy chủ, hàm thuần, giao diện chữ, tem); `veQr.js` và ca QR của thu_HD1 làm ngay khi có thư viện.

## Phát hiện
- `InvoiceSettings.jsx` đã 1283 dòng, `InvoicePreview.jsx` 745, `orders.js` 1762 — vượt ~500 dòng; không tách trong việc này (ngoài Phạm vi).

## Ghi chú
- Giờ làm: 27.10.2026. Không thấy thông báo đổi model giữa phiên.
- Người gác chặn: `git worktree` (dùng `git archive` thay), `npm install` (xem Câu hỏi 1), `Monitor` với `until`.

## Bảng chỗ vá → đột biến (viec/HD-1/dot_bien.py; 65 tên; chạy 27.10: BẮT 63 · LẠC 2 · SỐNG 0 · HỎNG 0)
Hai LẠC còn lại là VS-QR-DAO-MAU, VS-QR-KHONG-VIEN: cần thư viện qrcode-generator (Câu hỏi 1). Mọi đột biến khác BẮT đúng ca.
- routes/hoaDon.js (cửa A): BV-HD-DANG-NHAP · VS-HD-N-THEO-TOTAL · VS-HD-MA-DA-DUNG · VS-HD-MA-HET-HAN · VS-HD-MA-DON-HUY · VS-HD-KHACH-QUEN-CO-MA · VS-HD-N-KHONG-TAT-CT · VS-HD-GIAM-MA-THEO-COT · VS-HD-TT-BO-DON-LECH · VS-HD-TT-CK-CU · VS-HD-DIEM-TRUOC-DON-SAU · VS-HD-DIEM-DOI-QUA-BO · VS-HD-DIEM-CONG-MOI-LOAI · VS-HD-SO-LAN-MOI-DON · VS-HD-GIA-HANG-BANG-GOC · VS-HD-SO-BILL-MA-DAY-DU · BV-HD-KHONG-GHI · VS-HD-LO-LOI-NOI-BO · BV-MOUNT-HOA-DON
- utils/nhanDiem.js + signup-codes.js (D): VS-ND-FLASH-HOI · VS-ND-HE-SO-CO-DINH · VS-ND-TICH-DIEM-TAT · VS-ND-LAM-TRON · BV-ND-ROUTE-GOI-HAM
- settings.js + database.js (E): BV-ST-KHONG-AN · VS-ST-KHONG-AN-THIEU-TONG · VS-ST-KHONG-AN-GIA-TRI-1 · VS-ST-SO-TO-BA · VS-ST-GHI-TRUOC-KHI-KIEM · VS-SEED-LECH
- utils/hoaDon.js (G): VS-G-KHONG-AN-BO · VS-G-KHONG-AN-THIEU-TM · VS-G-KHONG-AN-TRONG-RONG · VS-G-CHU-CU-MAT · VS-G-KHOA-MOI-KHONG-DE · VS-G-DEM-NGUONG · VS-G-DEM-CHUA-DIEN · VS-G-INLAI-LAN-1 · BV-G-INLAI · VS-G-INLAI-LAN-KHONG-TANG · VS-G-CHAN-CA-HAI-TO · VS-G-CHINH-SACH-CA-HAI-TO · VS-G-SO-TO-MAC-DINH-1 · VS-G-SO-TO-RAC · VS-G-GIAM-HANG-LUON-HIEN · VS-G-PHI-GIAO-LUON-HIEN · VS-G-N0-VAN-HUA · VS-G-N0-KHONG-UU-DAI · VS-G-UU-DAI-HUA-DIEM · VS-G-QR-KHONG-MA-GIU-THAM-SO · VS-G-QR-THAM-SO-DAU-SAI · VS-G-QR-TRONG-VAN-IN · VS-G-QR-KHONG-MA-HOA · VS-G-CHU-GIA-GOC-SAI · VS-G-TIEN-KHONG-LAM-TRON · VS-G-DUA-TRA-LUON-HIEN · VS-G-HUY-KHONG-BAO · VS-G-DIEM-DOI-LUON-HIEN · VS-G-TEM-CAT-40
- inPhieu.js (F): BV-TEM-CHU-TUY-CHINH · VS-TEM-CHAN-LAY-DAU · VS-TEM-KHACH-LE-TEN
- InvoicePrint.jsx (H): BV-IN-QUA-CUA-HOA-DON
- veQr.js (C): VS-QR-DAO-MAU · VS-QR-KHONG-VIEN

## Phát hiện (thêm)
- Mẫu chủ quán duyệt có "Chữ cạnh QR" 44 ký tự > 42: máy chọn KHÔNG giới hạn một dòng cho chu_qr (cột hẹp dưới QR, xuống dòng) — chủ quán xem lại nếu muốn khác.
- Mẫu "MÃ NHẬN ĐIỂM · +N điểm (nhập trong 24 giờ)": thêm chữ tự điền {gio} (hạn lấy từ cấu hình `nhandiem_han_gio`) để chữ không nói sai khi đổi hạn.
- Thêm dòng "Giảm Flash sale", "Từ tài khoản mẹ", "Ghi nợ", "ĐƠN ĐÃ HUỶ / HOÀN TIỀN" ngoài danh sách mẫu — để tổng các dòng luôn cân với đơn Flash / nợ / huỷ cũ.
- InvoicePrint còn `fetch` trần cũ (2 chỗ, có sẵn trước việc này); code mới gọi `api.get` nên bánh cóc không tăng.
- Máy in nhiệt lệnh thô (P17): `mon[].chu_giam` đã có sẵn dạng "Giá gốc 96.000 → 86.400".

## Báo cáo
VIỆC:        HD-1 — Hoá đơn bố cục mới (2 tờ, QR đăng ký App KH, mục thanh toán & điểm) + tuỳ chỉnh chữ hoá đơn và tem — CHƯA XONG (chờ thư viện QR)
ĐÃ SỬA:      server/routes/hoaDon.js (mới) · server/utils/nhanDiem.js (mới) · server/routes/signup-codes.js (/nhan-diem gọi hàm tách) · server/routes/settings.js (từ chối khoá ẩn mục bắt buộc, số tờ 1/2) · server/index.js (mount) · server/database.js (seed khoá) · client/src/utils/hoaDon.js, veQr.js (mới) · inPhieu.js · components/InvoicePreview.jsx (HoaDonTo), InvoicePrint.jsx, InPhieu.jsx (tem) · pages/InvoiceSettings.jsx
BÀI THỬ:     thu_HD1.js trên gốc f1fea71 → ĐỎ 28 ca (A0–A23 cửa hoá đơn, G0 hàm thuần, F2/F3 tem); sau khi vá → 116 đạt · 1 hỏng (C0, thư viện QR). thu_P16 90/0, npm test 73/0
ĐÃ RÀ K4:    grep "tienTinhDiem\|docCauHinhNhanDiem" server → /nhan-diem, POST/pay-debt (orders.js, không đụng), hoaDon.js; grep "invoice_" client/server → khoá mới chỉ ở database.js seed + settings.js + hoaDon.js
CHƯA KIỂM:   (1) QR: chưa cài qrcode-generator → veQr.js chưa chạy, C1–C3 + 2 đột biến QR chưa chạy; (2) `client/dist` CHƯA build (build hỏng vì thiếu thư viện) → quầy vẫn chạy bản cũ cho tới khi build + commit dist; (3) in thật trên máy in/giấy 58–80 mm, khổ giấy, QR quét bằng điện thoại thật; (4) giao diện Cài đặt chưa mở thử trên trình duyệt; (5) thu_HD1 chưa thêm vào kiem_tra_truoc_khi_giao.js (sẽ đỏ vì C0 cho tới khi có thư viện); (6) chưa chạy /ra-soat và cổng `tu_chay/cong.js chay`; (7) chưa chạy --day-du
GIT:         xem git log --oneline -2
BÀI HỌC:     KHOÁ 0 · NGUYÊN TẮC 0 · BỎ 2 (chưa chốt vì việc chưa xong; đề xuất: ca "xoá trắng chữ mục bắt buộc" và "đột biến neo sai vị trí thành tương đương" đã xử lý trong bài/dot_bien)

HEAD ĐÃ KIỂM: chưa (việc chưa xong — còn chờ thư viện)
