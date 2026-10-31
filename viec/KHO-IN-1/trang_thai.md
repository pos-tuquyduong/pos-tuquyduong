# KHO-IN-1 — trạng thái

## Đối chiếu bản chụp (bước 1)
Nhánh `viec/KHO-IN-1`; HEAD = FETCH_HEAD = `7fc9bff` lúc mở phiên (không kéo, đã đủ). Ba dòng log lúc mở:
```
7fc9bff PHIEU: KHO-IN-1
18ee394 TIEN-DO: KHO-2b, BH-CKTAY-1, KH-QUAY-2, KH-MUA-1 xong; mo SEPAY-1, MANKHACH-1, KHO-IN-1, KH-SDT-1, them KHO-2c; quyet dinh 31.10 (SePay, man khach, SDT moi tu 0, khoi phuc khi dong cua, sua phieu nhan) — so v51
596c346 Merge pull request #60 from pos-tuquyduong/viec/KH-MUA-1
```

## Chỗ vá → đột biến (cổng A17 / A18)
| Chỗ vá | Đột biến |
|---|---|
| `server/routes/settings.js` — `khoaInPhieuSai` + cổng 400 (khổ, số bản, tên khoá) | BV-SV-BO-KIEM · VS-SV-KHO-58 · VS-SV-KHO-THIEU-A5 · VS-SV-BAN-TOI-DA-4 · VS-SV-BAN-TOI-DA-2 · VS-SV-BAN-TOI-THIEU-0 · VS-SV-LOAI-LA · VS-SV-TRUONG-LA · VS-SV-CHAN-QUA-TAY · VS-SV-GHI-TRUOC-KIEM |
| `settings.js` log in hoá đơn `paper_size` mặc định · `database.js` seed `invoice_default_size` | BV-SV-LOG-A5 · BV-SEED-A5 |
| `client/src/utils/inPhieu.js` — `KHO_PHIEU_KHO`, `khoaInPhieu`, `docInPhieuKho`, `thuTuNutIn` | BV-UI-THIEU-A5 · VS-UI-KHOA-VIET-HOA · VS-UI-BAN-TOI-DA-4 · VS-UI-BAN-TOI-THIEU-0 · VS-UI-MAC-DINH-A4 · VS-UI-KHONG-KIEM-KHO · VS-UI-CHUNG-KHOA · VS-UI-BAN-CHUNG-KHOA · VS-UI-NUT-KHONG-DAU · VS-UI-NUT-LAP · VS-UI-NUT-KHO-LA |
| K5 quá tay (hoá đơn khách / bộ in sau thanh toán) | VS-QUA-TAY-KHO-BILL-A5 · VS-QUA-TAY-KHO-PHA-CHE · VS-QUA-TAY-BO-IN-MAC-DINH · VS-QUA-TAY-XP-MAT-KHOI-B · VS-QUA-TAY-XP-MAT-CHU-KY |
| `Kho/XemPhieu.jsx` — 3 khổ, nút mặc định, số bản, thứ tự ghi–in | BV-XP-NUT-CUNG · BV-XP-KHONG-DOC-CAI-DAT · BV-XP-KHONG-TAI-CAI-DAT · VS-XP-SO-BAN-MOT · VS-XP-BAN-LUON-NHIEU · BV-XP-THIEU-A5 · VS-XP-A5-KHONG-LE · VS-XP-A5-LA-A4 · BV-XP-KHONG-TO-MAC-DINH · VS-XP-IN-TRUOC-GHI · VS-XP-MAT-IN-LAI |
| `Kho/inPhieuKho.css` — nhiều bản, ngắt trang, cỡ chữ, chống tràn | BV-CSS-KHONG-NGAT-TRANG · BV-CSS-BAN-AN-KHI-IN · BV-CSS-BAN-HIEN-MAN-HINH · BV-CSS-A5 · BV-CSS-TRAN-CHU |
| `CaiDat/InPhieu.jsx` + `Settings.jsx` | BV-CD-KHONG-CHAN-LUU · VS-CD-LUU-SAI-KHOA · VS-CD-LUU-KHONG-DOC-MAY-CHU · BV-ST-KHONG-GAN · BV-ST-KHONG-NHOM · VS-ST-QUYEN-LA |
| `InvoiceSettings.jsx` — ô Khổ mặc định + khoá khi lưu | BV-IS-DOC-KHOA-CU · BV-IS-GHI-KHOA-CU · BV-IS-KHONG-GUI-KHOA · VS-IS-GUI-KHI-CHUA-NAP |

Chạy `python3 viec/KHO-IN-1/dot_bien.py`: đối chứng XANH (in1 65 · q2 55 · p16 90), lần chạy đầu 52/55 BẮT, 3 SỐNG đã xử lý:
VS-SV-TRUONG-LA và VS-XP-SO-BAN-MOT là lỗ thật của bài thử → vá bài (ca tên khoá lạ với giá trị hợp lệ; ca số bản bắt đúng `length: kho ? x.ban : 1`);
VS-IS-GUI-KHO-THO (bỏ `khoHoaDon(...)` quanh `boIn.bill.kho`) là đột biến TƯƠNG ĐƯƠNG (`boIn.bill.kho` luôn đã hợp lệ — từ `<select>` hoặc `docBoIn`) → bỏ khỏi danh sách. Chạy lại 4 đột biến đã vá: 4/4 BẮT.

## Phát hiện (ngoài phạm vi, không sửa)
- Quản lý (`manager`) KHÔNG có sẵn quyền `manage_settings` trong seed (`server/database.js` không có dòng nào cho quyền đó) → quản lý chỉ lưu được Cài đặt in phiếu khi chủ quán cấp quyền ở tab Phân quyền. Đúng như mọi cài đặt khác; ghi lại vì phiếu nói "chủ quán / quản lý".
- Khối seed `defaultSettings` trong `database.js` chỉ chạy khi bảng `pos_settings` rỗng; kho mới/thử có thể đã có dòng khác trước đó (chưa kiểm lại bằng lệnh; không dựa vào đó) → seed '80mm' chỉ là cho đủ đường; dữ liệu thật vẫn 'a5' và vẫn đọc ra 80mm ở màn hình (khoHoaDon). Không sửa dữ liệu.
- Các `viec/*/dot_bien.py` cũ (KH-QUAY-2…) còn neo `value={khoHoaDon(config.default_size)}`, seed `'a5'` — sẽ HỎNG nếu ai chạy lại; đó là hồ sơ lịch sử của việc đã đóng, không có cổng nào chạy chúng.
- Phiếu pha chế SAU THANH TOÁN (từng đơn, khổ 80mm/58mm ở Cài đặt hoá đơn → "Bộ in") KHÁC "phiếu xuất / pha chế" của màn Kho (PX, từ tab Pha chế). Mình hiểu "phiếu pha chế" trong nghiệm thu A là PX của kho (có A5/A4) và KHÔNG đụng phiếu pha chế từng đơn (giữ nhiệt 58/80, mục D). Nếu chủ quán muốn phiếu pha chế từng đơn cũng có A5/A4 thì cần phiếu riêng.
