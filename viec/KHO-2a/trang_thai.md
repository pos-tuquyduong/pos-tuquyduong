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
