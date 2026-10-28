# HD-1 — trạng thái

## Đối chiếu bản chụp
- 27.10: nhánh viec/HD-1; HEAD = FETCH_HEAD = f1fea71 (không kéo, bằng nhau)
- 28.10 (làm tiếp, `/lam-viec HD-1 tiep`): nhánh viec/HD-1; HEAD = 4698af9 (cây sạch, nhánh đã có đủ commit của origin, không kéo)
  - 4698af9 HD-1: them thu vien qrcode-generator 1.4.4 (chu quan cai - phieu cho phep, nguoi gac chan may)
  - 391bc9d PHIEU: HD-1 chu quan chot 28.10 (bill dung tinh trang thuc te, cai dat day du moi dong)
  - 5f25465 HD-1: bằng chứng đỏ, bảng đột biến, báo cáo tạm (chờ thư viện QR)

## Câu hỏi
(Câu hỏi 1 — thư viện QR — đã được chủ quán trả lời bằng commit 4698af9.)
2. **Bill của đơn CHƯA THU có in mã nhận điểm / ô ưu đãi khách mới + QR mang mã không?** Hiện `server/routes/hoaDon.js` (`donHopLe`: đơn phải `completed` + `paid`) → đơn chưa thu **không** in ô mã và QR không mang `?ma=`; in lại SAU khi thu thì có. Trước HD-1, bill chưa thu vẫn in mã (`signup-codes.js:39-41` ghi "bill mang ra bàn chưa thu vẫn in mã"). Nếu quầy đưa bill chưa thu cho khách rồi thu sau, khách đó không có mã trên tờ đã đưa. Hai lựa chọn: (a) giữ như hiện nay (chỉ in mã khi mã dùng được ngay — đúng "bill đúng tình trạng thực tế"); (b) đơn chưa thu (không huỷ) vẫn in ô mã + QR (mã dùng được sau khi thu, hạn 24 giờ tính từ lúc in). Cả hai đều sửa trong `hoaDon.js` vài dòng + một ca thử; em chưa tự chọn vì đây là cách quầy làm việc. Các phần khác của việc không phụ thuộc câu này.

## Phát hiện
- `InvoiceSettings.jsx` ~1370 dòng, `InvoicePreview.jsx` ~830, `orders.js` 1762 — vượt ~500 dòng; không tách trong việc này (ngoài Phạm vi).
- **Lockfile:** commit 4698af9 ghi `resolved` của qrcode-generator là `http://package-firewall.replit.internal/...` — không tới được từ Render lẫn máy mây (`npm ci` ở client E405, SessionStart hỏng). Đã sửa sang `https://registry.npmjs.org/...` (giữ nguyên `integrity`, npm ci tự kiểm mã băm) ở commit db27760. Chủ quán lưu ý: lần sau thêm thư viện trên Replit thì kiểm lại dòng `resolved` trước khi commit.
- Mẫu chủ quán duyệt có "Chữ cạnh QR" 44 ký tự > 42: máy chọn KHÔNG giới hạn một dòng cho chu_qr (cột hẹp dưới QR, xuống dòng) — chủ quán xem lại nếu muốn khác.
- Mẫu "MÃ NHẬN ĐIỂM · +N điểm (nhập trong 24 giờ)": thêm chữ tự điền {gio} (hạn lấy từ cấu hình `nhandiem_han_gio`).
- Thêm dòng "Giảm Flash sale", "Từ tài khoản mẹ", "Ghi nợ", "ĐƠN ĐÃ HUỶ / HOÀN TIỀN", "IN LẠI · LẦN {lan}", nhãn "Khách" / "NV" ngoài danh sách mẫu — đều có khoá chữ riêng.
- `InvoicePrint.jsx` còn `fetch` trần cũ (2 chỗ, có sẵn trước việc này) và bố cục cũ (dự phòng khi cửa hoá đơn lỗi) với banner "IN LẠI" cứng (dòng ~280, ~472); code mới gọi `api.get` nên bánh cóc không tăng. In lần hai trong CÙNG một hộp thoại `InvoicePrint` không tăng "LẦN n" (`hd` nạp một lần lúc mở) — hành vi cũ, ngoài phạm vi.
- `orders.js:~1237-1247` vẫn tự dựng chữ "gấp heSo điểm" cho mã nhận điểm (cấm sửa orders.js); bố cục mới không dùng chữ đó.
- Quyền cửa hoá đơn: chỉ `authenticate` — mọi nhân viên đọc được hoá đơn của mọi đơn (giống các route đọc đơn khác); mã nhận điểm trả cho nhân viên vì đã in trên bill.
- Mặc định tên quán `'TỨ QUÝ ĐƯỜNG'` là hằng số có tên `CHU_MAC_DINH.ten_quan` (luôn bị `store_name` đè nếu có) — quán khác đóng gói thì đổi hằng số hoặc điền Cài đặt.
- Máy in nhiệt lệnh thô (P17): `mon[].chu_giam` đã có sẵn dạng "Giá gốc 96.000 → 86.400".
- Quy tắc đối soát: HD-1 chỉ ĐỌC, không thêm đường ghi tiền → không có quy tắc đối soát mới.

## Ghi chú
- Giờ làm: 27.10 và 28.10.2026. Không thấy thông báo đổi model giữa phiên.
- Người gác chặn: `git worktree` (dùng `git archive`), `npm install`, `curl` ra ngoài (lấy tarball thư viện — không lách, sửa lockfile thay), `npm config`, `Monitor` với `until`; chạy `thu_HD1.js` đang sửa (có cụm SECRET của JWT) và `--day-du` trực tiếp → chạy qua `npm test` / `npm test -- --day-du`; `cd && A && B` ghép sau lệnh node bị `B-PHANTICH`.
- `kiem_tra_truoc_khi_giao.js`: thêm `thu_HD1` bằng DÒNG RIÊNG sau mảng bài, không vào cuối mảng, vì `thu_P3.js:633` neo regex đòi `'cong_cu/thu_P3.js']) chayBaiThat(bai);` ở cuối mảng (thêm vào mảng làm `thu_P3` đỏ — K4).

## Soát độc lập vòng 1 (28.10) — KHÔNG ĐẠT → đã sửa trong vòng sửa 1
Báo cáo gốc của agent soát (tóm tắt các lỗi, file:dòng lúc soát):
1. `InvoiceSettings.jsx` xem trước chỉ 2 mẫu / phiếu 28.10-3 đòi 6 → thêm `MAU_XEM_TRUOC` (7 mẫu) ở `utils/hoaDon.js`, ô xem trước dùng danh sách này. Ca G54 G55 G56.
2. Dòng IN LẠI viết cứng, nhãn "Khách:" / "NV:" cứng, "IN LẠI" trên tem cứng → khoá `in_lai` (`{lan}`), `nhan_khach`, `nhan_nv`, `tem_in_lai` (seed ở database.js, nhóm trong NHOM_CHU). Ca G50 G51 F8, E6 (seed khớp).
3. `KHONG_AN_DUOC` chỉ 7 khoá, dòng tiền (phí giao, giảm Flash, tài khoản mẹ, ghi nợ, khách đưa…) ẩn được → mở rộng 19 khoá cả máy chủ lẫn client; ca G34 G35 E1 E1b E2 (máy chủ từ chối từng khoá), E3 đổi sang khoá không bắt buộc.
4. Đơn huỷ in "Cộng đơn này +N" dù P24 đã trừ → `dungDiem` cộng thêm dòng `adjust` khi đơn không còn `completed`. Ca A28b.
5. `uu_dai` không xét trạng thái đơn → dùng chung vị từ `dungDuoc` với N. Ca A28c.
6. Reset ghi `invoice_chu_dia_chi=''`/đè tên quán → hàm thuần `chuMacDinhCuaQuan`. Ca G57.
Nghi ngờ cũng đã xử lý: QR mang `?ma=` của mã chết (G52), dòng "+0" (G53), nhãn huỷ/hoàn ẩn được (khoá không ẩn được), đơn cũ `balance` dồn tiền mặt (A30b), nhật ký in xoá mềm (A31b). Để lại (ghi Phát hiện): in lần hai cùng hộp thoại, tên quán mặc định hằng số, khoản giảm tay hiện nhãn "Giảm mã / quà".

## Soát độc lập vòng 2 (28.10) — KHÔNG ĐẠT → đã sửa trong vòng sửa 2
1. `uu_dai` dùng chung cột/hạn của điểm (`diem_nhan_luc`, hạn cấu hình) trong khi `/claim` dùng `claimed_at` + `CODE_EXPIRE_HOURS` = 24 (`signup-codes.js:30,311,319`) → tách `dungDuocDiem` / `dungDuocUuDai` ở `hoaDon.js`, xuất `CODE_EXPIRE_HOURS`, thêm `han_gio_uu_dai` cho chữ "{gio}" của ô ưu đãi. Ca A28d A28e A28f G79.
2. Xem trước tem ở Cài đặt không nhận chữ tem đang sửa / không có dạng IN LẠI → hàm thuần `caiDatTuChuDangSua` (bill và tem dùng chung) + công tắc "Xem dạng IN LẠI". Ca F9.
3. Mã ca trùng 8 cặp → đánh lại G70–G77, kiểm bằng grep mọi `k('<mã> ` (không còn trùng).
Nghi ngờ đã xử lý: Reset ghim tên quán/địa chỉ → `khoaChuGhiKhiReset` (G78). Để lại, ghi nhận: không có ca máy chủ riêng cho đơn `refunded` (hoàn tiền không ghi dòng `adjust` điểm → điểm đã cộng vẫn còn đúng thực tế, `refunds.js:158`); `PHIẾU PHA CHẾ` / nhãn IN LẠI của phiếu pha chế còn chữ cứng (phiếu nội bộ, không phải bill hay tem); 'Khách lẻ' / 'quý khách' mặc định cứng; `KHONG_AN` chép ở hai nơi (server, client) có ca E1 so khớp.

## Soát độc lập lần 3 (28.10) — KHÔNG ĐẠT → đã sửa trong vòng sửa 3
1. `InvoicePrint.jsx` tự mở in chờ `sanSang` nhưng không chờ dữ liệu hoá đơn (nút In có `hdSanSang`) → bill tự in ra bố cục cũ, một tờ, không QR / IN LẠI. Gom thành `sanSangIn` ở `utils/hoaDon.js` dùng cho cả nút In lẫn tự mở in. Ca G81, H2.
2. Mẫu xem trước không phủ "Giảm mã / quà", "Chuyển khoản", "Đổi quà" → thêm vào mẫu Flash / tài khoản mẹ / khách quen; ca G80 đo PHỦ KHOÁ (mỗi khoá chữ hiện ở ≥ 1 mẫu), không đếm tên mẫu.
3. Đơn chưa thu không in mã → **Câu hỏi 2** (nghiệp vụ, chưa tự quyết).
4. Lỗ của bài thử: id `1e3`/`1000.0` trả đơn 1000 (server nay chỉ nhận chữ số thập phân; A2c với đơn 1000 có thật); điểm hết hạn, dòng điểm khách khác, tiền mặt lớn hơn tổng, che SĐT (A19b, A19c, A30c); `veQr` ném khi chuỗi quá dài (C5).
5. Nhãn tờ GIAO KHÁCH / LƯU QUẦY ẩn được → thêm vào danh sách không ẩn được (21 khoá).
6. Reset dùng `caiDatTho` cũ (chỉ nạp lúc mở trang): sửa tên quán → Lưu → Reset không nạp lại thì không xoá `invoice_chu_ten_quan` cũ. **Để lại** (mức thấp, khó gặp; làm đúng cần nạp lại cài đặt sau Lưu — ngoài ngân sách của vòng này).
Ghi nhận thêm (hồ sơ chính xác, K1): (a) khối seed `database.js` chỉ chạy khi `pos_settings` còn rỗng → các khoá `invoice_chu_*` / `invoice_so_to` / `invoice_kh_url` KHÔNG vào production hiện có; hành vi đúng nhờ mặc định ở `utils/hoaDon.js` (`docChu`), seed chỉ cho kho mới. (b) Production còn `invoice_thank_you` / `invoice_policy` cũ thì `docChu` dùng chúng trước mẫu mới (chủ ý: không làm mất chữ chủ quán đã sửa) — chủ quán đổi ở Cài đặt hoá đơn. (c) `store_name` seed cũ `'TÚ QUÝ ĐƯỜNG'` (sai dấu) nằm trong khối seed đó; nếu production còn giá trị này, `docChu` ưu tiên nó hơn mặc định — chưa đọc dữ liệu production. (d) `settings.js` import `KHONG_AN_DUOC` từ `routes/hoaDon.js` (kéo cả signup-codes) — nên chuyển sang `utils/` sau.

## Bảng chỗ vá → đột biến (viec/HD-1/dot_bien.py; 98 tên; chạy 28.10: BẮT 98 · LẠC 0 · SỐNG 0 · HỎNG 0)
- vòng sửa 3: BV-IN-TU-MO-KHONG-DOI-HD · VS-G-SAN-SANG-IN-BO-HD · VS-G-MAU-THIEU-GIAM-MA · VS-G-MAU-THIEU-CK · VS-G-MAU-THIEU-DOI-QUA · VS-G-NHAN-TO-AN-DUOC · VS-HD-NHAN-TO-AN-DUOC · VS-QR-QUA-DAI-NEM · VS-HD-ID-SO-MU · VS-HD-DIEM-HET-HAN-TINH · VS-HD-DIEM-CONG-KHACH-KHAC · VS-HD-TT-LECH-AM-BO · VS-HD-SDT-KHONG-CHE
- vòng sửa 2: VS-HD-UU-DAI-CLAIMED · VS-HD-UU-DAI-DIEM-NHAN-LUC · VS-HD-UU-DAI-HAN-CAU-HINH · VS-G-UU-DAI-GIO-DIEM · VS-G-RESET-GHIM · VS-G-XEM-TRUOC-TEM-BO-CHU (neo của VS-HD-MA-DA-DUNG, VS-HD-MA-HET-HAN, VS-HD-MA-DON-HUY, VS-HD-N-KHONG-TAT-CT, VS-HD-UU-DAI-KHONG-DON, VS-G-UU-DAI-HUA-DIEM cập nhật theo code mới; mã ca bắt G50…G57 → G70…G77)
- routes/hoaDon.js (cửa A): BV-HD-DANG-NHAP · VS-HD-N-THEO-TOTAL · VS-HD-MA-DA-DUNG · VS-HD-MA-HET-HAN · VS-HD-MA-DON-HUY · VS-HD-KHACH-QUEN-CO-MA · VS-HD-N-KHONG-TAT-CT · VS-HD-GIAM-MA-THEO-COT · VS-HD-TT-BO-DON-LECH · VS-HD-TT-CK-CU · VS-HD-DIEM-TRUOC-DON-SAU · VS-HD-DIEM-DOI-QUA-BO · VS-HD-DIEM-CONG-MOI-LOAI · VS-HD-SO-LAN-MOI-DON · VS-HD-GIA-HANG-BANG-GOC · VS-HD-SO-BILL-MA-DAY-DU · BV-HD-KHONG-GHI · VS-HD-LO-LOI-NOI-BO · BV-MOUNT-HOA-DON
  - vòng sửa 1: VS-HD-HUY-DIEM-ADJUST · VS-HD-UU-DAI-KHONG-DON · VS-HD-BALANCE-TIEN-MAT · VS-HD-LOG-XOA-MEM · VS-HD-KHONG-AN-THIEU-TIEN · VS-HD-KHONG-AN-THIEU-THANH-TOAN
- utils/nhanDiem.js + signup-codes.js (D): VS-ND-FLASH-HOI · VS-ND-HE-SO-CO-DINH · VS-ND-TICH-DIEM-TAT · VS-ND-LAM-TRON · BV-ND-ROUTE-GOI-HAM
- settings.js + database.js (E): BV-ST-KHONG-AN · VS-ST-KHONG-AN-THIEU-TONG · VS-ST-KHONG-AN-GIA-TRI-1 · VS-ST-SO-TO-BA · VS-ST-GHI-TRUOC-KHI-KIEM · VS-SEED-LECH
- utils/hoaDon.js (G): VS-G-KHONG-AN-BO · VS-G-KHONG-AN-THIEU-TM · VS-G-KHONG-AN-TRONG-RONG · VS-G-CHU-CU-MAT · VS-G-KHOA-MOI-KHONG-DE · VS-G-DEM-NGUONG · VS-G-DEM-CHUA-DIEN · VS-G-INLAI-LAN-1 · BV-G-INLAI · VS-G-INLAI-LAN-KHONG-TANG · VS-G-CHAN-CA-HAI-TO · VS-G-CHINH-SACH-CA-HAI-TO · VS-G-SO-TO-MAC-DINH-1 · VS-G-SO-TO-RAC · VS-G-GIAM-HANG-LUON-HIEN · VS-G-PHI-GIAO-LUON-HIEN · VS-G-N0-VAN-HUA · VS-G-N0-KHONG-UU-DAI · VS-G-UU-DAI-HUA-DIEM · VS-G-QR-KHONG-MA-GIU-THAM-SO · VS-G-QR-THAM-SO-DAU-SAI · VS-G-QR-TRONG-VAN-IN · VS-G-QR-KHONG-MA-HOA · VS-G-CHU-GIA-GOC-SAI · VS-G-TIEN-KHONG-LAM-TRON · VS-G-DUA-TRA-LUON-HIEN · VS-G-HUY-KHONG-BAO · VS-G-DIEM-DOI-LUON-HIEN · VS-G-TEM-CAT-40
  - vòng sửa 1: VS-G-KHONG-AN-CLIENT-THIEU-GHI-NO · VS-G-IN-LAI-CUNG · VS-G-NHAN-CUNG · VS-G-QR-MA-CHET · VS-G-CONG-0-VAN-IN · BV-G-MAU-HOAN · VS-G-RESET-HANG-SO
- inPhieu.js (F): BV-TEM-CHU-TUY-CHINH · VS-TEM-CHAN-LAY-DAU · VS-TEM-KHACH-LE-TEN · VS-TEM-IN-LAI-CUNG
- InvoicePrint.jsx (H): BV-IN-QUA-CUA-HOA-DON
- veQr.js (C): VS-QR-DAO-MAU · VS-QR-KHONG-VIEN

## Báo cáo
(chờ soát vòng 2 — sẽ ghi 7 mục khi soát ĐẠT)
