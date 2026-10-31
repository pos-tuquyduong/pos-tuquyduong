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

## Soát độc lập vòng 1 (`/ra-soat`, báo cáo về qua SubagentHandback)
KHÔNG ĐẠT (lỗi nhẹ, không đụng tiền). Tóm tắt nguyên văn các lỗi và cách xử lý:
1. `thu_KHOIN1.js:171` / `XemPhieu.jsx:108` — K3: ca chỉ kiểm đối số 1 của `docInPhieuKho`; đổi đối số loại thành `'PX'` vẫn xanh → ĐÃ VÁ: ca đòi đối số 2 = `dl?.phieu.loai`; đột biến VS-XP-LOAI-CUNG, VS-XP-LOAI-SAI-TRUONG.
2. `InvoiceSettings.jsx` ô "Khổ mặc định" — K5: chưa nạp được bộ in thì lưu không gửi khổ nhưng vẫn báo "đã lưu" → ĐÃ VÁ: `<select disabled={!boInDaNap}>`; ca + đột biến BV-IS-O-KHO-KHONG-KHOA.
3. `trang_thai.md` — K1: gõ sai `'a80mm'`, và câu "undefined" chưa dẫn được → ĐÃ SỬA.
4. `database.js:579` cột `paper_size DEFAULT 'a5'` — K4 lẻ → ĐÃ ĐỔI '80mm' (route luôn truyền giá trị nên không đổi hành vi).
Nghi ngờ đã xét: ca "dòng bảng không tràn" yếu → ĐÃ SIẾT (đòi nằm trong khối @media print); `invoice_default_size` ghi song song `boIn.bill.kho` — GIỮ có chủ ý (máy chưa có bộ in lưu vẫn đúng, hai giá trị luôn ghi cùng lúc từ một ô); cỡ chữ `.kho-in-a4 15px` là thay đổi nhìn thấy nhỏ (A4 trước chưa có cỡ riêng) — xin chủ quán nhìn thử.
Nghiệm thu soát: A đạt · C đạt · B thiếu kết xuất in thật (không có trình duyệt) · D đạt có điều kiện.
Bài học soát: KHOÁ — ca đọc nguồn phải khớp CẢ BỘ đối số lời gọi; NGUYÊN TẮC — chuyển nguồn ghi sang nơi có cổng "đã nạp" thì khoá luôn ô đó khi chưa nạp.
Đột biến sau vòng 1: `dot_bien.py` 57 đột biến · BẮT 57 · SỐNG 0 · HỎNG 0 · LẠC 0 (đối chứng xanh: 66 · 55 · 90).

## Cổng PR
`node tu_chay/cong.js chay . 7fc9bff^ HEAD viec/KHO-IN-1` (HEAD 0b40ae5, cây sạch): ✓ CỔNG CHẠY ĐẠT.
`npm test` 89 PASS · 0 FAIL · 1 CẢNH BÁO (cảnh báo có từ trước, không phải của việc này); `--day-du` 93 PASS · 0 FAIL.

## Bài học
Sự cố của việc: (a) người gác chặn lệnh chạy bài thử có cụm bí mật (B-BIMAT-CHU) → phải commit bài trước rồi mới chạy; chặn lệnh ghép (B-PHANTICH), ghi ngoài kho (G0-NGOAI, B-DICHCHU), `git stash` (GIT-LENH); (b) 3 đột biến SỐNG lần đầu + 1 lỗ do soát bắt (đối số loại); (c) quản lý không có sẵn `manage_settings`, seed không chạy trên kho mới — bài thử phải bắt theo thực tế chứ không theo tưởng tượng.
- KHOÁ 3 (làm xong, trong Phạm vi): ca đọc nguồn khớp cả bộ đối số `docInPhieuKho(caiDat, dl?.phieu.loai)` + VS-XP-LOAI-CUNG; ca "tên khoá lạ mang giá trị hợp lệ" + VS-SV-TRUONG-LA (giá trị sai che mất lỗi tên khoá); ca ô khổ khoá khi chưa nạp + BV-IS-O-KHO-KHONG-KHOA. Tất cả đỏ trên gốc (SỐ CA 66, 49 ✗).
- NGUYÊN TẮC 1 (đề xuất, `KHUON_LOI.md` ngoài Phạm vi — chat soát duyệt): thêm vào K5 "Đã gây: ô Khổ mặc định đổi nguồn ghi sang chỗ có cổng 'đã nạp' mà ô vẫn sửa được khi chưa nạp → báo 'đã lưu' oan. Chặn: đổi nguồn ghi của một ô thì khoá ô đó cùng điều kiện với nguồn mới." Và vào K3: "ca từ chối thử tên khoá lạ thì dùng giá trị HỢP LỆ, đừng để giá trị sai che lỗi tên".
- BỎ 2: seed `pos_settings` không chạy trên kho mới (đã ghi ở Phát hiện); đột biến tương đương VS-IS-GUI-KHO-THO.
- Dọn: không đề xuất xoá lời dặn nào.

## Báo cáo
VIỆC:        KHO-IN-1 — Cài đặt in phiếu (80mm / A5 / A4 cho từng loại phiếu kho) · khổ hoá đơn mặc định có tác dụng thật
ĐÃ SỬA:      server/routes/settings.js:22-36,148-151 (khoaInPhieuSai + 400 CAI_DAT_KHONG_HOP_LE) · :297 (paper_size '80mm') · server/database.js seed + cột paper_size '80mm' · client/src/utils/inPhieu.js (KHO_PHIEU_KHO, docInPhieuKho, thuTuNutIn) · Kho/XemPhieu.jsx (3 khổ, nút mặc định đứng đầu, số bản) · Kho/inPhieuKho.css · CaiDat/InPhieu.jsx (mới) + Settings.jsx (tab "In phiếu kho") · InvoiceSettings.jsx (ô Khổ mặc định đọc/ghi boIn.bill.kho + invoice_default_size, khoá khi chưa nạp) · client/dist build lại
BÀI THỬ:     thu_KHOIN1.js trên gốc 7fc9bff → ĐỎ 49/66 (A: khổ lạ trả 200 thay vì 400; B: KHO_IN chỉ k80/a4; C: ô khổ ghi config.default_size, seed 'a5'); sau vá → XANH 66/66. thu_KHQUAY2.js sửa 3 ca (hành vi đã duyệt): đỏ 3 trên gốc, xanh 55/55. Đột biến 57/57 BẮT. npm test 89 PASS, --day-du 93 PASS, cổng PR ĐẠT.
ĐÃ RÀ K4:    grep "window.print" client/src → 1 chỗ (XemPhieu.jsx); grep "default_size|invoice_default_size|paper_size" client/src server → mọi chỗ đã xử lý (config.default_size không còn ai đọc; cột paper_size đổi theo); XemPhieu chỉ mount ở Kho/index.jsx và DsPhieu.jsx.
CHƯA KIỂM:   (1) KHÔNG có trình duyệt/máy in: chưa kiểm bằng mắt khổ A5/A4/80mm có tràn/cắt chữ không, và ngắt trang giữa nhiều bản (.kho-in position:absolute + .kho-ban break-after) — chỉ kiểm CSS bằng regex; (2) cỡ chữ A4 (15px) và A5 (13px) mình tự chọn, chủ quán nhìn thử; (3) máy in thật; (4) "phiếu pha chế" trong nghiệm thu A mình hiểu là PX của màn Kho — chờ chủ quán xác nhận; phiếu pha chế sau thanh toán (nhiệt 58/80) không đụng; (5) chưa thử trên Render/Turso thật.
GIT:         xem git log --oneline -2 ở câu trả lời.
BÀI HỌC:     KHOÁ 3 · NGUYÊN TẮC 1 (đề xuất) · BỎ 2

HEAD ĐÃ KIỂM: 0b40ae5
