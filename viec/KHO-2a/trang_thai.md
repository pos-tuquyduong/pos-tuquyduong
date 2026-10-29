# KHO-2a — trạng thái

## Bước 1 — đối chiếu bản chụp (29.10.2026)
- Nhánh: `viec/KHO-2a`; cây sạch; `git fetch origin viec/KHO-2a` → HEAD `8f88885` = FETCH_HEAD `8f88885` (không kéo).
- `git log --oneline -3`:
  ```
  8f88885 PHIEU: KHO-2a
  988aee7 TIEN-DO: mo KH-API-2 + KHO-2a; KHO-2 tach KHO-2a / KHO-2b; lich xep lai theo tien do 29.10 — so v45
  feda0b0 TIEN-DO: UUDAI-1 (0a543cf), KHO-1 (65eb00d) xong; luat vong sua 4 + du lieu cu; quyet dinh khong co bill chua tra; HD-1 vong 4 — so v44
  ```

## Bước 2–3
- Đã đọc: phiếu, CLAUDE.md, KHUON_LOI.md, QUYET_DINH_CHU_QUAN.md mục Kho, viec/KHO-1/ke_hoach.md, `server/kho/*`, `server/nang_cap/*`,
  `server/routes/settings.js` (PUT /), `server/database.js` (beginTransaction, layNangCapHong), `server/middleware/auth.js` (checkRole),
  `client/src/pages/Kho/index.jsx`, `Layout.jsx` (navItems, vòng hỏi 60 s), `cong_cu/thu_KHO1.js` (B1/B2 đếm cứng 1 bước).
- Kế hoạch: `viec/KHO-2a/ke_hoach.md`. Phiếu dặn **Chờ duyệt kế hoạch** → commit, push, DỪNG ở bước 3.

## Soát kế hoạch (agent phụ chỉ đọc, 4 câu)
- Phạm vi / Cấm: không file nào ngoài Phạm vi. Sửa theo soát: huy hiệu rời `Layout.jsx` về màn Kho (phiếu: Layout chỉ route) + Q7.
- Ngắn hơn: bỏ cột "% chuẩn" tới khi Q1 trả lời; bỏ đường đếm riêng (dùng `GET /phieu?trang_thai=cho_duyet`); hạn món vào `PUT /san-pham/:id`
  có sẵn; lệch theo nhóm vào vòng thêm / sửa chung; `hanLo` dùng lại `addDaysToDateString`; một câu `conLaiTheoLo` dùng chung.
- Ca thiếu đã thêm: I2 → 403 (phiếu ghi "đường lạ → 403"), C7 bấm hai lần (khoá `ma_gui`), C8 đơn vị hiện, D11 từ chối song song duyệt,
  D12 tự từ chối, E8 một giao dịch, F3 hai nhóm khác ngưỡng + món không nhóm, H7 huỷ phiếu chờ duyệt, G3 ẩn giá cả phản hồi đường ghi.
- Đường song song đã vá trong kế hoạch: từ chối cùng điều kiện khoá với duyệt; sửa phiếu giữ giờ làm cũ cho hạn lô, không mở lại kết quả;
  công tắc chỉ '0' là tắt (khôi phục sao lưu ghi `pos_settings` không qua kiểm).
- Nền sai đã sửa: `nhapSx.js:64` đọc `sx_products` bằng cột tường minh (không có `days_use`); ca đua chấp nhận `KHO_BAN`.

## Câu hỏi
Xem mục "Câu hỏi cho chủ quán" cuối `ke_hoach.md` (Q1–Q7) — trả lời cùng lúc duyệt kế hoạch.

## Làm tiếp (`/lam-viec KHO-2a tiep`, 29.10.2026)
### Bước 1 — đối chiếu bản chụp
- Nhánh `viec/KHO-2a`, cây sạch; `git fetch origin viec/KHO-2a` → HEAD `62a8acb` = FETCH_HEAD `62a8acb` (không kéo; hook mở phiên đã kéo 8f88885 → 62a8acb).
- `git log --oneline -3`:
  ```
  62a8acb PHIEU: KHO-2a duyet ke hoach 29.10 (7 cau tra loi chu quan)
  dfc45b4 KHO-2a: ke hoach sua theo soat (Layout, ma_gui, ca thieu, nen nhapSx) — cho duyet
  0385ba9 KHO-2a: ke hoach (cho duyet) + trang thai buoc 1-3
  ```
- Kế hoạch đã duyệt nguyên (Q1–Q7 trả lời trong phiếu) → làm từ bước 4.

### Bước 4–7
- Bài thử `cong_cu/thu_KHO2a.js` viết TRƯỚC, đỏ trên gốc `62a8acb`: 5 đạt · 71 hỏng (`bang_chung_do.txt`). Sau vá: 76 đạt · 0 hỏng.
- `cong_cu/thu_KHO1.js` (mục `## Bài thử cũ sửa`): B1/B2 đếm theo số file bước thật (002 thêm bước); K7 đổi 404 → 403 `DUONG_LA` vì phiếu mục I
  "đường lạ → 403" (ý nghĩa giữ: đường "Bật bán" không còn). Trên gốc đỏ ở K7 (110 · 1); sau vá 111 · 0.
- Lệch kế hoạch (K1): `hanLo` / `thuCuaNgay` không đặt được trong `tinh.js` như kế hoạch ghi — KHO-1 A3 (và K3 bài này) cấm `require` / `Date` ở đó.
  `thuCuaNgay` viết thuần theo lịch (công thức Sakamoto) trong `tinh.js`; `hanLo` ở `duLieu.js` dùng lại `addDaysToDateString`.
- Bài thử D10: manager trong kho thử mặc định KHÔNG có quyền `manage_settings` (403 PERMISSION_DENIED trước cả phép kho_*) → bài cấp quyền đó cho
  manager để ca chỉ thử MỘT phép (K3).
- Ca F6b ban đầu xanh oan với đột biến `VS-ket-qua-phieu-sua` (phiếu sửa giữ ngày làm cũ → 409 `DA_TU_CHOT` che phép "phiếu sửa không điền") →
  sửa ca so đúng mã `PHIEU_KHONG_DIEN`; chạy lại bằng chứng gốc + cả bộ đột biến.
- `npm test -- --day-du`: PASS 80 · FAIL 0 · CẢNH BÁO 1 — cảnh báo có từ trước, ngoài việc này: "route GET có lệnh ghi (3) — packages.js:194, products.js:67, sync.js:147" (xem ## Phát hiện).
- Ngân sách: máy chủ ~554 dòng (phiếu ~650) · giao diện ~542 (~750) · bài thử ~600 (~500 — vượt ~20 %: 76 ca phủ đủ A–J + 4 ca đua + bảng quyền 16 đường × 5).

### Chỗ vá → đột biến (`viec/KHO-2a/dot_bien.py`, đối chứng XANH 76 · 0; 37/37 BẮT)
| Chỗ vá | Đột biến |
|---|---|
| `duLieu.docPhaChe` lô còn hạn / thứ theo lịch | VS-dangco-tinh-lo-het-han · VS-thu-gio-may |
| `duong GET /pha-che` mốc ngày mai 00:00 | VS-mai-moc-bay-gio |
| `duong` NHAN_VIEN (vai trò cho phép) | VS-vai-tro-la-qua |
| `duLieu.luuDinhMuc` xoá rồi chèn | BV-dinh-muc-xoa-cu |
| `tinh.lapPhieuXuat` triển khai lồng | VS-tong-khong-trien-khai |
| 002 chỉ mục `ma_gui` + `ghiPhieu` khiTrung | BV-ma-gui · BV-tra-phieu-da-co |
| `duLieu.duyetPhieu` khoá trạng thái + chặn tự duyệt | BV-khoa-trang-thai-duyet · BV-chan-tu-duyet |
| `duLieu.tuChoiPhieu` cùng khoá | VS-tu-choi-khong-chan-nguoi-tao · BV-khoa-trang-thai-tu-choi |
| `duong` lý do từ chối · quyền duyệt | BV-ly-do-tu-choi · VS-nhan-vien-duyet |
| `duLieu.nvCanDuyet` chỉ '0' là tắt | VS-cong-tac-khac-0-la-tat |
| `settings.js` kho_* chỉ chủ quán · chỉ 0/1 | BV-cong-tac-chi-chu-quan · BV-cong-tac-gia-tri-la |
| `duLieu.ghiKho` lô hạn gần trước, bỏ lô quá hạn, giá vốn | VS-fefo-han-xa-truoc · BV-lo-qua-han · VS-gia-von-thieu-gia |
| `duong PUT /san-pham/:id` han_ngay không gửi = giữ | VS-han-xoa-khi-khong-gui |
| `nhapSx` hạn từ days_use, không đè, đọc p.* | BV-han-tu-sx · VS-han-de-o-co-san · VS-han-sx-cot-cu |
| 002 chỉ mục kết quả + `ghiKetQua` bắt trùng | BV-chi-muc-ket-qua · BV-bat-trung-ket-qua |
| `tinh.lechQuaNguong` | VS-lech-lon-bang |
| tự chốt theo ngày VN (đường + ghiKetQua) | VS-tu-chot-gio-may |
| `ghiKetQua` phiếu sửa không điền | VS-ket-qua-phieu-sua |
| tồn chỉ phiếu da_duyet | VS-ton-tinh-cho-duyet |
| `tinh.trangThaiHan` ≤ 1 ngày | VS-sap-het-nho-hon |
| ẩn giá mọi phản hồi phiếu (`traPhieu` → `traVe`) | BV-an-gia-phan-hoi-ghi |
| đếm lần in | BV-dem-in |
| `suaPhieu` hạn theo giờ làm cũ · chỉ chủ quán | VS-sua-lo-han-gio-sua · VS-quan-ly-sua-phieu |
| `huyPhieu` khoá trạng thái | BV-huy-khoa-trang-thai |
| đường lạ → 403 | BV-duong-la-403 |

Tên đột biến (đủ): VS-dangco-tinh-lo-het-han · VS-thu-gio-may · VS-mai-moc-bay-gio · VS-vai-tro-la-qua · BV-dinh-muc-xoa-cu · VS-tong-khong-trien-khai · BV-ma-gui · BV-tra-phieu-da-co · BV-khoa-trang-thai-duyet · BV-chan-tu-duyet · VS-tu-choi-khong-chan-nguoi-tao · BV-khoa-trang-thai-tu-choi · BV-ly-do-tu-choi · VS-nhan-vien-duyet · VS-cong-tac-khac-0-la-tat · BV-cong-tac-chi-chu-quan · BV-cong-tac-gia-tri-la · VS-fefo-han-xa-truoc · BV-lo-qua-han · VS-gia-von-thieu-gia · VS-han-xoa-khi-khong-gui · BV-han-tu-sx · VS-han-de-o-co-san · VS-han-sx-cot-cu · BV-chi-muc-ket-qua · BV-bat-trung-ket-qua · VS-lech-lon-bang · VS-tu-chot-gio-may · VS-ket-qua-phieu-sua · VS-ton-tinh-cho-duyet · VS-sap-het-nho-hon · BV-an-gia-phan-hoi-ghi · BV-dem-in · VS-sua-lo-han-gio-sua · VS-quan-ly-sua-phieu · BV-huy-khoa-trang-thai · BV-duong-la-403

## Soát độc lập lần 1 (/ra-soat, agent general-purpose, mốc 8f88885^..d9914bd) — KHÔNG ĐẠT
```
KHÔNG ĐẠT
LỖI TÌM ĐƯỢC:
- cong_cu/thu_KHO2a.js:415 (tonLo) dùng ở H3/H5 — K3: "lô cũ + kết quả rơi khỏi tồn" kiểm bằng SQL của chính bài, không đọc GET /ton, /pha-che.
  Đột biến bỏ `AND ${DA_DUYET}` trong conLaiTheoLo (duLieu.js:103-104) → bài vẫn XANH (SỐNG). Nghiệm thu H phần thành phẩm không có phép canh.
- server/kho/duong.js:243 — K3: chặn in phiếu chưa duyệt không có ca (bỏ điều kiện vẫn XANH).
- server/kho/duong.js:259 — K3: chặn số thực ra < 0 không có ca (thay bằng false vẫn XANH).
- server/kho/duong.js:170 — K3: chặn trùng món trong một phiếu không có ca (bỏ vẫn XANH).
- server/kho/duong.js:64,106 + duLieu.js:97 — kiểm đầu vào thiếu: han_ngay lẻ lọt (0.5 → lô hết hạn ngay khi vào kho; addDaysToDateString cắt phần lẻ).
- server/kho/duLieu.js:225 + XemPhieu.jsx:73 — K4: huỷ và từ chối cùng `huy`; huyPhieu không ghi ai / lúc huỷ; phiếu đã duyệt rồi chủ quán huỷ hiện
  "Từ chối: <người duyệt>" — đổ sai người.
- server/nang_cap/002_kho_pha_che.js:11 — thiết kế: CHECK trên kho_phieu_dong.loai khoá cứng tập giá trị (SQLite không đổi được CHECK) — KHO-2b/KHO-3
  thêm loại dòng phải dựng lại bảng. Gọn hơn: bỏ CHECK.
- viec/KHO-2a/trang_thai.md:52 — K1 / LUAT §6: "xem dòng cảnh báo ở bước 6 dưới" không có; thiếu kết quả cong.js chay, thiếu 1–3 thao tác thử tay,
  thiếu CHƯA KIỂM.
NGHI NGỜ: soDuong(0) → null (lệch 0 % thành "không cảnh báo"); đơn giá / giá vốn lấy gia_nhap hiện tại, không theo lô (đúng tới KHO-2b);
  so han_dung > luc theo chuỗi — lô hạn dạng ngày thuần sẽ bị coi quá hạn trong ngày hết hạn; sửa phiếu không bỏ được một món; is_active = 1 không ca;
  ẩn giá ba chỗ (duong.js:162, 234, 281) chứ không phải một.
NGHIỆM THU: 10/10 mục có bằng chứng máy chủ; lỗ: H (tồn thành phẩm theo phiếu còn hiệu lực chưa có phép; in phiếu chờ duyệt chưa có phép);
  B/C/D/G có phần chỉ thử tay mà trang_thai không ghi.
CHƯA SOÁT ĐƯỢC: --day-du chưa xong lúc nộp; --goc không chạy lại; cong.js chưa chạy; Turso thật; bản in / điện thoại; inPhieuKho.css, kho.css chưa đọc.
BÀI HỌC: KHOÁ — ca hứa hành vi máy chủ phải đọc ĐẦU RA đường máy chủ, không lặp công thức bằng SQL; mỗi phép kiểm đầu vào / WHERE mới một VS-.
  NGUYÊN TẮC — hai thao tác dùng chung một trạng thái thì sổ ghi trường phân biệt; CHECK liệt kê giá trị trong SQLite là khoá vĩnh viễn;
  số "ngày" vào addDaysToDateString phải là số nguyên.
```

## Vòng sửa 1
Sửa đúng từng lỗi lần soát 1 nêu (bài thử 6054c54 · vá 903ea8f trở về trước):
- K3 tồn thành phẩm: thêm H3c / H5c đọc ĐẦU RA `GET /ton` (lô cũ / lô phiếu huỷ không còn, lô mới có) — đột biến `VS-lo-tinh-moi-trang-thai` (bỏ
  `AND ${DA_DUYET}` trong conLaiTheoLo) nay BẮT.
- K3 phép chưa có ca: H2b in phiếu chưa duyệt → 404 (`BV-in-chua-duyet`); F7 số thực âm → 400 (`BV-so-thuc-am`); C5 một món hai lần → 400 (`BV-mon-trung`).
- Hạn dùng lẻ: `PUT /san-pham/:id` chỉ nhận số NGUYÊN ngày > 0, null / '' = bỏ hạn, sai → 400 `HAN_SAI` (E0c, `VS-han-le`).
- Huỷ / từ chối: bước 002 thêm `kho_phieu.nguoi_huy`, `huy_luc`; từ chối và huỷ ghi vào đó, KHÔNG ghi đè người duyệt (D7, H5c, `BV-ghi-nguoi-huy`,
  `VS-tu-choi-ghi-nguoi-duyet`); XemPhieu hiện "Duyệt: …" và "Huỷ / Từ chối / Sửa: …" riêng.
- Bỏ CHECK trên `kho_phieu_dong.loai` (bước 002 chưa lên production — sửa trong nhánh, không cần bước 003).
- Nghi ngờ "lệch 0 %": `lech_cho_phep` nhận số ≥ 0 (0 = cảnh báo mọi lệch) — A0c, `VS-lech-0-la-khong`.
- Neo đột biến theo code mới (VS-han-xoa-khi-khong-gui, BV-huy-khoa-trang-thai HỎNG lần chạy đầu vì neo cũ → sửa neo, BẮT).
- Bài mới trên server trước vòng sửa (d9914bd): 78 · 4 (đỏ đúng 4 ca chạm lỗi thật); trên gốc 62a8acb: 5 · 77; HEAD: 82 · 0. Đột biến: đối chứng XANH
  82 · 0, 45/45 BẮT.
- Không sửa (ghi Phát hiện): giá theo lô, hạn lô dạng ngày thuần, sửa phiếu bỏ một món, ẩn giá ba chỗ (gọn hoá — hành vi đúng, G3 canh).

## Thao tác chủ quán thử tay trên điện thoại
1. Đăng nhập nhân viên → Kho › Pha chế › "Cho hôm nay": món cần làm > 0 đã tick sẵn; sửa số phần một món; bấm "Xuất kho nguyên liệu" → phiếu "Chờ duyệt".
2. Đăng nhập quản lý (máy khác) → Kho: tab Phiếu có huy hiệu số (≤ 30 s) → mở phiếu → Duyệt → "In 80 mm": giấy có A (ô ☐), B (cả mẻ + 1 phần), C (ô điền);
   in lần hai có dòng "IN LẠI · LẦN 2".
3. Trên phiếu đã duyệt bấm "✓ Đúng chuẩn" một món, "Khác" một món (số + ghi chú) → Kho › Tồn kho › Thành phẩm thấy lô đúng số, hạn; tab nhóm / tìm không dấu.

## CHƯA KIỂM
- Bước 002 sửa nội dung trong nhánh (vòng sửa 1: bỏ CHECK, thêm nguoi_huy / huy_luc) — máy chỉ thấy nhánh viec/KHO-2a (không ref main), không
  kiểm được CSDL nào (Replit pos_thu.db, máy dev) đã chạy bản 002 cũ của nhánh; CSDL đó sẽ bỏ qua 002 mới → huỷ / từ chối 500. Chủ quán xác nhận chưa chạy nhánh.
- Bản in thật 80 mm / A4 (khổ giấy, ô ☐, dòng "IN LẠI"), giao diện điện thoại, tick mặc định, huy hiệu tự làm mới, tab nhóm / tìm / sắp xếp ở Tồn — máy
  không chạy trình duyệt cho các màn này; chỉ build xanh + `--day-du` so băm dist.
- Turso thật: giao dịch ghi và mã bận chỉ thử trên libsql file (bài thử); ca đua chấp nhận `KHO_BAN`.
- `afterprint` / `window.print()` khác nhau giữa trình duyệt điện thoại — chưa thử.
- Giá vốn lô thành phẩm dùng `gia_nhap` hiện tại của nguyên liệu (chưa có lô nhập có giá — KHO-2b).

## Phát hiện
- Bộ kiểm cảnh báo có từ trước: route GET có lệnh ghi — packages.js:194, products.js:67, sync.js:147 (ngoài Phạm vi).
- KHO-2b: lô nguyên liệu nhập nên lưu hạn dạng `YYYY-MM-DDTHH:mm:ss` (so chuỗi `han_dung > luc`); hạn ngày thuần sẽ bị coi quá hạn ngay trong ngày hết hạn.
- KHO-2b: khi có lô nhập có giá, đơn giá dòng xuất / giá vốn nên lấy giá của LÔ bị trừ thay vì `gia_nhap` hiện tại.
- Sửa phiếu chỉ đổi số phần (≥ 1 món, số phần > 0); bỏ hẳn một món = sửa thành phiếu không có món đó — giao diện chưa có nút bỏ món (phiếu không ghi).
- Ẩn giá đang ở ba chỗ gọi `boGia` trong duong.js + vị từ riêng của KHO-1 (`/nguyen-lieu`) — có thể gom khi chạm tới.

## Soát độc lập lần 2 (/ra-soat, mốc 8f88885^..HEAD sau vòng sửa 1) — KHÔNG ĐẠT (mọi lỗi NHẸ)
```
LỖI TÌM ĐƯỢC:
- cong_cu/thu_KHO2a.js:121-123 (A0c) — K3 + K1: ca hứa "lệch 0 % = cảnh báo mọi lệch" nhưng chỉ kiểm giá trị LƯU; tinh.js:105 (`lechChoPhep != null`) và
  duLieu.js:239 (`?? null`) không có ca — đột biến `!!lechChoPhep` / `|| null` SỐNG. — NHẸ
- server/kho/duong.js:107-111 (HAN_SAI) — K5 + K3: SanPham.jsx:87 LUÔN gửi han_ngay (null khi trống); không ca nào gửi null / ''; đột biến null → 0 → 400
  SỐNG; ngưỡng `> 0` → `> 1` SỐNG. — NHẸ
- server/kho/duong.js:264 (F7) — K5: không ca "số thực = 0" (mẻ hỏng); đột biến `> 0` SỐNG. — NHẸ
- server/kho/duong.js:64 (soKhongAm) — K3: không ca % lệch âm; đột biến nới SỐNG. — NHẸ
- server/kho/nhapSx.js:33, :192 + duLieu.js:97 — K4: hạn lẻ chỉ vá ở PUT; nhập SX nhận days_use lẻ, hanLo vẫn cắt phần lẻ; hạn lẻ từ SX làm lần lưu sau 400.
  Gọn: một vị từ "số ngày nguyên > 0" cho PUT, nhapSx, hanLo. — NHẸ
- viec/KHO-2a/trang_thai.md — K6: vẫn thiếu kết quả cong.js chay và --day-du trên HEAD sau vòng sửa (LUAT §6.3). — NHẸ
NGHI NGỜ: sửa nội dung bước 002 đã đánh số — CSDL nào đã chạy 002 cũ sẽ bỏ qua; "002 chưa lên production" chưa kiểm được từ đây. PUT nhóm công thức không
  gửi lech_cho_phep → xoá về null (ngược quy ước han_ngay; DinhMuc.jsx gửi đủ). Phiếu huy không in được, không ca. Nhãn "Từ chối / huỷ" chung.
NGHIỆM THU: 10/10 mục có bằng chứng; thiếu điều kiện LUAT §6.3 (cong.js, --day-du trên HEAD).
BÀI HỌC: KHOÁ — mỗi phép kiểm đầu vào mới kèm ca "phải KHÔNG bị chặn" cho đúng giá trị màn hình gửi (null, '', 0) + ca ngay trên / dưới ngưỡng; ca mang
  tên một HÀNH VI kiểm ĐẦU RA hành vi, đột biến đưa lỗi cũ ở mọi chỗ tiêu thụ. NGUYÊN TẮC — vá kiểm đầu vào thì grep MỌI đường ghi cùng cột + chỗ đọc,
  một vị từ dùng chung; không sửa nội dung bước nâng cấp đã đánh số khi nó có thể đã chạy — thêm bước mới.
```

## Vòng sửa 2
Sửa đúng từng lỗi lần soát 2 nêu (bài e2a1b6a · vá tới 4ef1ae3):
- Một vị từ `tinh.soNgayNguyen` (số ngày NGUYÊN > 0) cho cả ba chỗ: `PUT /san-pham/:id` (sai → 400 HAN_SAI, null / '' = bỏ hạn), nhập SX (`days_use` lẻ → để
  trống), `hanLo` (K4). Ca E0d (null / '' / 1 / 5 → 200), E5 (hanLo 1.5 → null), E7 (CF03 days_use 1.5 → trống).
- Lệch 0 %: ca theo HÀNH VI — F3 nhóm 0 % lệch 1 % → vàng, đúng chuẩn → không; F3c màn xem phiếu cũng báo; đột biến ở hai chỗ tiêu thụ (tinh.lechQuaNguong,
  duLieu.lechCuaMon). A0d lệch âm → không lưu số âm.
- F7b số thực = 0 (mẻ hỏng) → 200, vẫn ghi (K5).
- Bài mới trên bản trước vòng sửa 2 (903ea8f): 84 · 2 (E5, E7); gốc 62a8acb: 5 · 81; HEAD: 86 · 0.
- Đột biến vòng 2: đối chứng XANH 86 · 0; 53/53 BẮT (VS-han-xoa-khi-khong-gui lần đầu LẠC vì đỏ ở E0 thay vì E0b — mẫu nới thành `E0b?`, BẮT).

## Soát độc lập lần 3 (/ra-soat, HEAD db7ef39) — KHÔNG ĐẠT (mọi lỗi NHẸ — không tiền / điểm / ví / bảo mật / ngoài Phạm vi / file Cấm)
```
LỖI TÌM ĐƯỢC:
- server/kho/tinh.js:74 (soNgayNguyen) — không trần trên: han_ngay 1e9 → addDaysToDateString ném RangeError → duyệt / tự duyệt món đó 500; vị từ nhận true → 1,
  '0x10' → 16. Gọn: hằng số có tên HAN_NGAY_TOI_DA trong cùng vị từ + ca ngay trên / dưới. — K5/K4 — NHẸ
- server/kho/tinh.js:74 — K3: ngưỡng > 0 thiếu ca ngay dưới (0); đột biến `>= 0` SỐNG. — NHẸ
- server/kho/nhapSx.js:57 (v_recipes) — K4/K3: E7 chỉ có ca days_use lẻ ở đường sx_products; trả :57 về duong() SỐNG. — NHẸ
- viec/KHO-2a/dot_bien.py:51 (VS-han-xoa-khi-khong-gui, mẫu nới E0b?) — K3 (TACH-GL): đột biến không còn tái hiện đúng lỗi cũ "không gửi = xoá hạn";
  thay bằng đột biến ở duLieu.js:70 (luôn ghi hanNgay ?? null), mẫu về `✗ E0b `. — NHẸ
- server/kho/duLieu.js:96 — K1: chú thích "N không phải số dương" sai sau soNgayNguyen. — NHẸ
- viec/KHO-2a/trang_thai.md — LUAT §6.3: chưa ghi cong.js chay và --day-du trên HEAD sau vòng sửa 2. — NHẸ
NGHI NGỜ: sửa phiếu CHỜ duyệt = duyệt luôn + ghi kho (người duyệt = chủ quán) — chưa ghi là hành vi chủ quán muốn → Phát hiện; in phiếu huy → 404 không ca;
  han_ngay NGUYÊN LIỆU (cotNguyenLieu, nhapSx shelf_life_days) chưa qua soNgayNguyen — KHO-2b; days_use lẻ bỏ trống im lặng, không cảnh báo;
  so_thuc "Infinity" qua được >= 0.
NGHIỆM THU: 10/10 mục (A … J) có bằng chứng máy chủ, 86 · 0; phần giao diện ghi trung thực ở CHƯA KIỂM + 3 thao tác thử tay. Thiếu: LUAT §6.3.
BÀI HỌC: KHOÁ — vị từ đầu vào dùng chung có trần dưới + trần trên lấy từ giới hạn hàm tiêu thụ, mỗi trần ca ngay trên + dưới; vá N đường ghi thì N ca, đột
  biến neo đúng từng đường. NGUYÊN TẮC — đột biến LẠC vì phép khác bắt trước → thay đột biến cho tái hiện đúng lỗi cũ, không nới mẫu.
```

## Vòng sửa 3 (cuối — so_vong_sua_toi_da; lần soát cuối chỉ lỗi NHẸ → LUAT §6.5: sửa đúng các lỗi lần soát nêu, không gọi agent soát nữa)
Sửa đúng 6 lỗi lần soát 3 nêu (bài 053ff05 · vá 4b2b77d):
- `tinh.soNgayNguyen`: chữ số thập phân nguyên, 1 … `HAN_NGAY_TOI_DA` (3650, hằng số có tên) — true / '0x10' / 1.5 / 0 / 3651 / 1e9 → null; PUT → 400 HAN_SAI
  (lời nêu trần). E0d: null / '' / 1 / 3650 → 200; 0 / 3651 / true / '0x10' / 1e9 → 400, giữ hạn cũ. Đột biến VS-han-0-ngay, BV-han-tran-tren, VS-han-tran-lech.
- E7 thêm days_use lẻ ở đường v_recipes (recipe 3 nối vào CT3 có sẵn — lần chạy đầu ca giả định món mới, đỏ oan, truy nguyên K2: database.js:1124 seed
  CT3 = juice/3). Đột biến VS-han-recipe-le neo đúng dòng v_recipes.
- VS-han-xoa-khi-khong-gui đổi về tái hiện ĐÚNG lỗi cũ (duLieu.luuSanPham luôn ghi `hanNgay ?? null`), mẫu `✗ E0b ` (bỏ mẫu nới `E0b?`).
- Chú thích hanLo sửa theo soNgayNguyen (K1).
- Bài mới trên bản trước vòng sửa 3 (db7ef39): 85 · 1 (E0d); gốc 62a8acb: 5 · 81; HEAD: 86 · 0. Đột biến: đối chứng XANH 86 · 0, 57/57 BẮT.
- Nghi ngờ lần 3 (không sửa — ghi Phát hiện dưới): sửa phiếu chờ duyệt = duyệt luôn; in phiếu huỷ → 404; hạn nguyên liệu chưa qua soNgayNguyen; days_use lẻ
  bỏ trống không cảnh báo; so_thuc "Infinity".

SOÁT LẦN CUỐI: chat soát thay

### Phát hiện (thêm sau soát lần 3)
- Chủ quán bấm "Sửa" trên phiếu CHỜ duyệt → phiếu cũ huỷ, phiếu mới tự duyệt + ghi kho ngay (người duyệt = chủ quán). Đúng luật "chủ quán tự duyệt" nhưng
  phiếu chưa ghi rõ — chủ quán xác nhận khi thử.
- In phiếu đã huỷ trả 404 (chỉ phiếu đã duyệt in được) — phiếu chỉ nói "in lại", chưa nói phiếu huỷ.
- KHO-2b: `kho_nguyen_lieu.han_ngay` (cotNguyenLieu, nhập SX shelf_life_days) chưa qua `soNgayNguyen` — lô nhập dùng hanLo sẽ ra "không hạn" nếu số lẻ.
- Nhập SX: days_use lẻ bị để trống không kèm cảnh báo trong bản xem trước.
- `POST /ket-qua` nhận so_thuc "Infinity" (Number('Infinity') >= 0).

## Nghiệm thu — đếm từng mục (bài `cong_cu/thu_KHO2a.js`, HEAD 86 · 0)
- A Định mức theo thứ: A0–A4 (+ A0c, A0d nhóm lệch). ✓
- B Pha chế (định mức · đang có · cần làm, hôm nay / ngày mai): B1–B5. ✓ — tick mặc định / sửa số phần: thử tay (CHƯA KIỂM).
- C MỘT phiếu PX, bảng tổng + theo công thức, đơn vị theo số phần, số phiếu: C1–C8, C3b, C3c. ✓ — bản in 80 mm / A4: thử tay.
- D Duyệt (nhân viên chờ, quản lý tự duyệt, không tự duyệt, công tắc, đua): D1–D12, D10b. ✓ — huy hiệu tự làm mới: thử tay.
- E Ghi kho một giao dịch, lô hạn gần trước, tồn âm không chặn, thành phẩm lô + hạn + giá vốn, bước 002, nhập SX hạn: E0–E8 (E0b–E0d). ✓
- F Kết quả (✓ / số thực + ghi chú, lệch vàng không chặn, tự chốt qua ngày VN): F1–F7b, F3b, F3c, F5b. ✓
- G Tồn (Σ phiếu đã duyệt, dưới tối thiểu / âm, lô + hạn, nhân viên không giá): G1–G3b. ✓ — tab nhóm / tìm / sắp xếp: thử tay.
- H Danh sách, in lại, sửa / huỷ chỉ chủ quán có lý do, phiếu mới thay_cho_id, tồn theo phiếu còn hiệu lực: H1–H7, H2b, H3b, H3c, H5b, H5c. ✓
- I Quyền ở máy chủ, đường lạ / vai trò lạ 403: I1 (16 đường × 5), I2. ✓
- J Bán hàng như cũ: J1 + `cong_cu/thu_KHO1.js` 111 · 0. ✓
10/10 mục có bằng chứng bài thử; phần giao diện thuần ghi ở CHƯA KIỂM + 3 thao tác thử tay.

## Bài học
Sự cố của việc này (bước 11.1): bài thử tự viết ca rỗng `every(async …)` (bắt khi đọc lại trước commit); D10 đầu tiên đỏ / xanh nhờ phép khác (manager thiếu
manage_settings); F6b xanh oan (DA_TU_CHOT che phép phiếu sửa); 3 lần soát độc lập KHÔNG ĐẠT (lần 1: 8 lỗi — ca tồn thành phẩm đọc SQL của bài, phép đầu vào
không ca, huỷ / từ chối chung trạng thái, CHECK trên cột loai; lần 2: ca lệch 0 % kiểm giá trị lưu, thiếu ca null / '' / 0, K4 nhập SX; lần 3: vị từ hạn không
trần, thiếu ca biên 0, đột biến nới mẫu); E7 đỏ oan do giả định món mới (seed có CT3); người gác chặn 11 lệnh của phiên chính + agent (B-BIMAT-CHU chạy bài
có cụm bí mật của bài thử trước khi commit; B-PHANTICH lệnh ghép / `$'…'` / `;`; B-CHUONGTRINH `for`; B-CD-VITRI `cd` giữa lệnh; GIT-BRANCH `--contains`).
- **KHOÁ** (làm luôn, trong Phạm vi): `kiem_tra_truoc_khi_giao.js` chặn vị từ async trong `every / some / filter / find` của `cong_cu/thu_*.js` (luôn đúng → ca
  xanh oan). Ca đỏ: biểu thức của phép bắt đúng dòng lỗi đã viết `['so_lan_in', 'ma_gui'].every(async (c) => …)` và không bắt dòng sửa (node -e, bước 11);
  trên HEAD 0 file vi phạm. Lý do KHOÁ: mẫu máy tìm được 100 %, không lời dặn nào thay được.
- **KHOÁ** (đề xuất, ngoài Phạm vi — `tu_chay/`): cổng `cong.js` liệt kê điều kiện mới trong diff (`WHERE … AND`, `return res.status(4xx)`, `if (!(…))`) và
  đòi mỗi điều kiện một tên đột biến trong `viec/<MÃ>/dot_bien.py` neo đúng dòng đó. Ca đỏ: diff vòng sửa 0 của việc này (in chưa duyệt, số thực âm, món trùng
  không có đột biến).
- **NGUYÊN TẮC** (đề xuất `KHUON_LOI.md` K3, ngoài Phạm vi): "Ca mang tên một HÀNH VI máy chủ đọc ĐẦU RA của đường máy chủ (`GET /ton`, mã HTTP, cờ trả về),
  không lặp công thức bằng SQL của bài — Đã gây: KHO-2a H3/H5 'rơi khỏi tồn' kiểm bằng SQL riêng, đột biến bỏ lọc da_duyet SỐNG; A0c 'lệch 0 % = cảnh báo'
  kiểm giá trị lưu."
- **NGUYÊN TẮC** (đề xuất `KHUON_LOI.md` K5, ngoài Phạm vi): "Phép kiểm đầu vào mới kèm ca 'phải KHÔNG bị chặn' cho ĐÚNG giá trị màn hình gửi (null khi ô
  trống, '', 0) + ca ngay trên / dưới MỖI trần (dưới lẫn trên, trần trên lấy từ giới hạn hàm tiêu thụ) — Đã gây: KHO-2a HAN_SAI thiếu ca null (SanPham.jsx
  luôn gửi han_ngay), soNgayNguyen không trần → addDaysToDateString ném RangeError."
- **NGUYÊN TẮC** (đề xuất `KHUON_LOI.md` K4, ngoài Phạm vi): "Hai thao tác cùng đổi về một trạng thái (từ chối / huỷ → huy) thì sổ ghi trường phân biệt
  (người, lúc) — không suy ra từ trường khác. Đã gây: KHO-2a phiếu duyệt rồi huỷ hiện 'Từ chối: <người duyệt>'." Kèm: "CHECK liệt kê giá trị trong SQLite
  là khoá vĩnh viễn — danh sách loại dùng chung nhiều đợt đặt trong code" và "bước nâng cấp đã có thể chạy ở CSDL nào đó thì không sửa nội dung — thêm bước
  mới" (002 sửa trong nhánh chưa gộp — xem CHƯA KIỂM).
- **BỎ**: E7 giả định món mới trong seed (một lần, đã có K7 "tên bảng / dữ liệu tra trong code"); đột biến nới mẫu `E0b?` (đã có K3 TACH-GL "đột biến đưa ĐÚNG
  lỗi cũ trở lại" — vi phạm luật có sẵn, không cần luật mới); các lệnh bị người gác chặn (luật người gác đã chặn đúng, làm theo hướng dẫn — không cần thêm).
- Dọn (11.3): không thấy lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` vừa có phép kiểm làm thay ở việc này.

## Kiểm cuối trên HEAD 8371c25 (cây sạch)
- `npm test -- --day-du`: PASS 81 · FAIL 0 · CẢNH BÁO 1 (cảnh báo cũ: route GET có lệnh ghi — packages.js:194, products.js:67, sync.js:147).
- `node cong_cu/thu_KHO2a.js`: 86 đạt · 0 hỏng · `cong_cu/thu_KHO1.js`: 111 · 0 · `python3 viec/KHO-2a/dot_bien.py`: đối chứng XANH, 57/57 BẮT.
- `node tu_chay/cong.js chay . 8f88885^ HEAD viec/KHO-2a`:
```
✗ [A11] bài thử cũ được miễn nhưng bản gốc đỏ trên code PR: `cong_cu/thu_KHO1.js` (thoát 1):
  108 đạt · 3 hỏng
✗ CỔNG ĐỎ (CHẠY) — 1 lý do
```
  Ba ca đỏ của bản GỐC thu_KHO1 trên code PR: B1 / B2 (đếm cứng pos_nang_cap = 1 dòng `001_kho`) và K7 (mong 404 cho đường đã bỏ).

## Câu hỏi
**Q8 — cổng A11 (HOC-1 d) với `cong_cu/thu_KHO1.js`.** Cổng chạy BẢN GỐC của bài cũ trên code đã vá và đòi xanh. Bản gốc đếm cứng "1 bước nâng cấp" (B1/B2) —
phiếu bắt buộc thêm bước `server/nang_cap/002_*.js`, và chính phiếu đã dự liệu sửa đúng hai ca này ở `## Bài thử cũ sửa` ("chỉ nếu bước nâng cấp 002 làm đổi số
bảng / số bước mà ca cũ đếm cứng"). Không có cách vá nào vừa giữ bước 002 vừa cho B1 gốc xanh (sửa 001 thì đụng bước đã chạy ở production). K7: phiếu mục I
"đường lạ → 403" làm ca gốc (mong 404) đỏ; bản sửa giữ ý nghĩa "đường Bật bán không còn" (403 DUONG_LA). Máy KHÔNG sửa `tu_chay/` (ngoài Phạm vi, K8).
Chủ quán chọn:
  (a) chấp nhận ngoại lệ A11 cho việc này (mâu thuẫn phiếu ↔ khung: bước nâng cấp mới luôn làm đỏ ca đếm bước cứng) và ghi đề xuất khung: HOC-1 (d) bỏ qua
      các ca mục `## Bài thử cũ sửa` nêu đích danh; hoặc
  (b) K7 trả về 404 cho đường lạ (bỏ phép "đường lạ → 403" của phiếu I) — B1/B2 vẫn đỏ, nên (b) một mình không làm cổng xanh.
Đề xuất: (a).

## Báo cáo 7 mục
```
VIỆC:        KHO-2a — Kho POS phần 2a: pha chế theo định mức · phiếu xuất kho nguyên liệu có duyệt · in · thành phẩm vào kho · tồn · danh sách phiếu
ĐÃ SỬA:      server/nang_cap/002_kho_pha_che.js — cột han_ngay, lech_cho_phep, so_lan_in, ma_gui, nguoi_huy, huy_luc, loai/cho_mon_id/nguoi/luc + 2 chỉ mục khoá
             server/kho/tinh.js — thuCuaNgay, chonDinhMuc, canLam, soNgayNguyen, lapPhieuXuat, chiaTheoLo, soPhieuKe, lechQuaNguong, trangThaiKetQua,
               trangThaiHan, bangPhieu, boGia (thuần)
             server/kho/duLieu.js — conLaiTheoLo (một câu cho Pha chế / Tồn / chia lô), docPhaChe, định mức, taoPhieuXuat, ghiKho (một hàm cho duyệt /
               tự duyệt / sửa), duyệt / từ chối (cùng khoá trạng thái + người duyệt ≠ người tạo), huỷ, sửa, ghiKetQua, docPhieu, dsPhieu, docTon
             server/kho/duong.js — /pha-che, /dinh-muc, /nhom-cong-thuc, /phieu-xuat, /phieu, /phieu/:id (+ in, duyet, tu-choi, ket-qua, sua, huy), /ton;
               han_ngay ở PUT /san-pham/:id; ẩn giá cho nhân viên; đường lạ → 403 DUONG_LA
             server/kho/nhapSx.js — hạn từ days_use (không đè, số nguyên) · server/routes/settings.js — kho_* chỉ chủ quán, công tắc chỉ 0 / 1
             client/src/pages/Kho/ — PhaChe, XemPhieu (in 80 mm / A4), DsPhieu, TonKho, DinhMuc, chung.js, inPhieuKho.css; index.jsx tab + huy hiệu; SanPham
               hạn dùng; client/dist build lại · kiem_tra_truoc_khi_giao.js — chạy thu_KHO2a + phép KHOÁ vị từ async
BÀI THỬ:     cong_cu/thu_KHO2a.js trên gốc 62a8acb → ĐỎ 5 đạt · 81 hỏng (A1, B1, C1, C7, D3, D5, E2, F4, F5, G3, H3, I2 …); sau vá → XANH 86 · 0.
             cong_cu/thu_KHO1.js (bài cũ sửa) gốc 110 · 1 (K7) → 111 · 0. Đột biến 57/57 BẮT, đối chứng XANH.
ĐÃ RÀ K4:    grep "UPDATE kho_phieu" server/kho → 4 chỗ (duyệt, từ chối, huỷ, in) — cả 4 có khoá trạng thái trong câu ghi; grep "han_ngay" đường ghi → PUT,
             nhapSx (2 đường v_recipes / sx_products), hanLo — cùng soNgayNguyen; grep "new Date|Date.now|CURRENT_TIMESTAMP|datetime(" server/kho → 0 chỗ.
CHƯA KIỂM:   bản in thật 80 mm / A4, điện thoại, tick mặc định, huy hiệu tự làm mới, tab nhóm / tìm / sắp xếp (chỉ build + so băm dist); Turso thật (bài chạy
             libsql file); CSDL nào đã chạy bản 002 cũ của nhánh; giá vốn theo gia_nhap hiện tại (chưa có lô nhập có giá — KHO-2b); cổng A11 ĐỎ (Q8).
GIT:         8371c25 KHO-2a: trang thai — vong sua 3, nghiem thu, bai hoc
             48389ad KHO-2a buoc 11 KHOA: bo kiem chan vi tu async trong every/some/filter/find cua bai thu (K3)
BÀI HỌC:     KHOÁ 2 (1 làm luôn: phép vị từ async; 1 đề xuất cong.js) · NGUYÊN TẮC 3 (đề xuất KHUON_LOI K3 / K4 / K5) · BỎ 3 — chi tiết ở ## Bài học
```

HEAD ĐÃ KIỂM: 8371c25
