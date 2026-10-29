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
- `npm test -- --day-du`: PASS 80 · FAIL 0 · CẢNH BÁO 1 (xem dòng cảnh báo ở bước 6 dưới).
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
