# KET-NOI-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (16.11.2026)
- Nhánh: `viec/KET-NOI-1` · cây sạch (không file đã theo dõi đang sửa).
- `git fetch origin viec/KET-NOI-1` → HEAD `8d83bf8` · FETCH_HEAD `8d83bf8` (bằng nhau — không kéo).
- `git log --oneline -3`:
  ```
  8d83bf8 PHIEU: KET-NOI-1
  1d66c61 Merge pull request #97 from pos-tuquyduong/viec/SAOLUU-DEM-1
  b6d8801 TIEN-DO: KH-NAP-1 (7cf48ee, PR #96) xong; KHUNG-KIEM-1 them 4 de xuat; hop dong ND ghi ro truong nguoi; quyet dinh 16.11 — so v69
  ```

## Bước 1 — làm tiếp sau duyệt (16.11.2026, "KET-NOI-1 tiep")
- Hook mở phiên kéo nhánh `96a593c4 → 0820b795`. `git fetch` → HEAD `0820b795` · FETCH_HEAD `0820b795` (bằng nhau).
- `git log --oneline -3`:
  ```
  0820b795 PHIEU: KET-NOI-1 duyet ke hoach (5 de xuat, chu 'may chu', them nhom F do cham) — chu quan 16.11
  96a593c4 KET-NOI-1: ke hoach sua theo soat vong 1 (laCauDoc, QR dang tao, gui lai KHO_BAN, log khong cause, 8 ca them)
  bfc1eecc KET-NOI-1: ke hoach (cho chu quan duyet) + trang thai buoc 1
  ```
- Chủ quán duyệt: đồng ý cả 5 đề xuất; chữ người dùng thấy là "máy chủ" (không "kho dữ liệu"); thêm nhóm F (đo chậm).

## Bước 2–3
- Đã đọc phiếu, code vùng sửa (file:dòng ghi trong `ke_hoach.md`). Bảng B6 do một agent chỉ đọc lập, máy kiểm lại hai khẳng định then chốt
  (`client/src/pages/BanHang/index.jsx:35` mặc định màn CŨ; `server/routes/wallets.js:153-169` nạp không chống trùng).
- Kế hoạch: `ke_hoach.md` — chủ quán duyệt `0820b795`.

## Bước 4–7 — bài thử, sửa, kiểm
- Bài mới `cong_cu/thu_KETNOI1.js` viết TRƯỚC — sau vòng sửa 1: 95 ca, đỏ trên gốc 79/95 (`bang_chung_do.txt`; bản đầu 89 ca, đỏ 74). Lớp mạng giả dựng đúng hình lỗi node-fetch 2.7.0.
- Bài cũ sửa thường (hành vi chủ quán duyệt đổi / phiếu cho đổi `index.js`, đỏ trên gốc): `thu_BH2.js` R4 + S22, `thu_P3.js` F7,
  `thu_NDAPI1.js` A2 (so BẰNG 18 dòng thêm), `thu_SAOLUUDEM1.js` B3 (theo commit của việc) + ca mới F1/F2 (đúng lỗi Cài đặt › Sao lưu 16.11).
- `npm test -- --day-du` (sau vòng sửa 1): PASS 124 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn từ trước việc này). Con số 119 ở mục "Sự cố khác" là lần chạy
  TRƯỚC khi có bài mới (bước 1, kho nông).
- `client/dist` build lại sau mọi sửa `client/src/`.

### Chỗ vá → đột biến (`viec/KET-NOI-1/dot_bien.py`, mỗi đột biến một dòng)
| Chỗ vá | Đột biến |
|---|---|
| database.js `query()` đọc lại câu ĐỌC | BV-DOC-THU-LAI · VS-THU-LAI-BA · VS-THU-LAI-GHI · BV-CAU-GHI |
| database.js `laCauDoc` | VS-CAU-DOC-CHUA-TU |
| database.js `laLoiMang` | VS-MANG-RONG · VS-MANG-BO-CAUSE · VS-MANG-BO-FETCHERROR |
| database.js lỗi đổi dạng (không cause) | VS-LOI-GIU-CAUSE |
| database.js `run()` / giao dịch (câu đầu, câu sau) / commit đổi lỗi | BV-RUN-DOI-LOI · BV-TX-DOI-LOI · BV-TX-CAU-DAU-DOI-LOI · BV-COMMIT-DOI-LOI |
| database.js đếm rớt | BV-LOG-DEM |
| giuCho.js `phienCuaMa` (3 chỗ gọi, so thân / cách / trừ TK, QR đang tạo, QR lỗi, dạng mã) + khiTrung | BV-MA-GUI-NHANH · BV-MA-GUI-TRONG-GD · BV-MA-GUI-TRUNG-KHOA · VS-MA-GUI-BO-SO-THAN · VS-MA-GUI-BO-CACH · VS-MA-GUI-BO-TK · BV-MA-GUI-QR-DANG-TAO · VS-MA-GUI-QR-LOI · BV-MA-GUI-DANG |
| 029_ket_noi.js khoá UNIQUE | BV-029-UNIQUE |
| giuCho.js `chotPhien` B2 (lapLai, chặn phiên App) + route `/chot` lapLai | BV-CHOT-LAI · VS-CHOT-LAI-MOI-NGUON · VS-CHOT-LAI-APP · BV-LAP-LAI-ROUTE |
| wallets.js `loiGhi` → 503 | BV-LOIGHI-503 |
| database.js `mocLoiKho` / index.js gắn móc / bắt lỗi cuối / health | BV-LOI-KHO-MOC · BV-MOC-INDEX · BV-TRA-LOI-KHO-CUOI · BV-HEALTH |
| api.js `goiFetch` / trang proxy / thuLai mặc định / phiên / tinhThu / upload | BV-API-MAT-KET-NOI · BV-API-PROXY · VS-API-POST-THU-LAI · BV-API-GET-THU-LAI · BV-API-PHIEN-THU-LAI · BV-API-CHOT-THU-LAI · VS-NEN-GUI-LAI-BO-KHO-BAN · VS-NEN-GUI-LAI-MOI-MA · BV-API-TINH-THU · BV-GOI-FETCH-UPLOAD |
| ThuTien.jsx / tinh.js `nhanhNutThu` | BV-NUT-0D · VS-NHANH-NUT |
| tinh.js `loiTinhGia` / `xuLyThuHong` / `thanPhien` maGui | BV-LOI-TINH · BV-HUY-409-HOI-LAI · VS-HOI-HONG-NHA · VS-VIEC-KHONG-PHIEN · VS-DANG-XU-LY · BV-MA-GUI-THAN |
| BanHangMoi.jsx mã mỗi lần thu / câu B5 | BV-BH-MA-GUI · BV-BH-CAU-B5 |
| database.js đo chậm (ngưỡng, đường dẫn, đếm câu, ngoài, health cham, chống đo hai lần) / index.js gắn đo (+ /api/nd) | BV-CHAM · VS-CHAM-NGUONG · VS-CHAM-LO-DUONG · BV-DEM-CAU · BV-NGOAI · BV-CHAM-HEALTH · BV-DO-HAI-LAN · BV-DO-INDEX · BV-ND-DO |

### F2 — số câu kho của ba đường (chỉ đo + báo cáo — `thu_KETNOI1.js` mục [F], kho file cục bộ)
| Đường | Câu kho TUẦN TỰ | Ghi chú |
|---|---|---|
| Tạo phiên tiền mặt (`POST /thanh-toan/phien`) | 10 | |
| Chốt tiền mặt (`POST /thanh-toan/phien/:id/chot`) | 23 | |
| Tạo + chốt (một lần bấm "Đã nhận tiền") | **33** | |
| `POST /orders/tinh-thu` | 5 | |
| Tin báo Ahamove (`nhanTinBao`) | 3 | + 2 lần gọi Ahamove (lấy token + đọc chuyến) — bài thử không bọc fetch nên "ngoài 0 ms" |
- **Nhận xét:** kho file cục bộ chạy mỗi câu ~0,3 ms nên tổng chỉ vài ms. Trên Render ↔ Turso mỗi câu là một chuyến mạng (thường 30–150 ms;
  CHƯA ĐO trên production). 33 câu tuần tự × ~100 ms ≈ 3,3 giây cho một lần "Đã nhận tiền" — có thể là một phần của "10–12 giây" chủ quán thấy
  (phần còn lại CHƯA rõ: Render vừa thức, SX, in). Dòng [CHAM] mới sẽ đo thật trên production. Chốt tiền mặt KHÔNG gọi SX qua mạng trong bài thử (SX tắt); trên production `checkStock` gọi SX (đã bọc try/catch).
- Tin báo Ahamove: 3 câu kho + 2 chuyến tới Ahamove (token có thể đã nhớ) — 5 giây hạn của Ahamove bị vượt khi Render vừa thức hoặc Ahamove chậm.

## Người gác đã chặn (bước 11 dùng)
- `[B-CHUONGTRINH]` `xargs` trong lệnh đếm grep — đổi sang công cụ Grep.
- `[B-PHANTICH]` bốn lần: chuỗi grep có `$"` / `$'`; lệnh chạy file script nối thêm `&& sed` — tách lệnh / dùng công cụ Grep.
- `[B-BIMAT-CHU]` chạy `thu_KETNOI1.js` khi bài có chữ SECRET chưa commit — commit trước rồi chạy (đúng luật skill).
- `[GIT-ADD]` `git add client/dist` (thư mục) — thêm từng file.
- `[B-CD-VITRI]` `mkdir … && cd … && git archive` — tách lệnh.

## Sự cố khác
- Stop hook báo bộ kiểm ĐỎ: `thu_BH2.js` G1 `git log cbbb809..HEAD` → `bad revision` — kho NÔNG (phiên mở từ bản chụp). Đã chạy
  `git fetch -q --unshallow origin viec/KET-NOI-1` (bước 1.3, chỉ tải lịch sử) → `npm test`: PASS 119 · FAIL 0 · CẢNH BÁO 1.
- Soát kế hoạch vòng 1 bắt một lỗi thật (`laCauDoc` dò chữ trên mọi câu) + 8 ca thiếu + 5 đường song song — đã sửa trong `ke_hoach.md`.
- Bài thử đỏ bất ngờ trên code đã vá (lỗi CỦA BÀI): hàm `hong` trùng tên biến đếm ca hỏng; sai tên cột `customer_phone`; kiểu voucher `tien`;
  ca A1c dò chữ `ECONNRESET` (mã lỗi có chủ ý trong `ma_goc`) như lộ.
- Bộ kiểm đỏ sau vá (lỗi CỦA MÌNH, đã sửa): bước 029 hỏng trên kho thử chỉ có bảng kho (`thu_KHAPI3` C4b, `thu_KHO2a` E6b) → thêm kiểm bảng
  (khuôn 025); `index.js` sửa dòng cũ (`thu_NDAPI1` A2 "chỉ THÊM dòng") → giữ dòng cũ, thêm dòng mới.

## Soát độc lập — vòng 1 (agent general-purpose, 16.11, trên HEAD c9f52628) — chép nguyên
```
KHÔNG ĐẠT
Tóm tắt: bài mới 90 ca, xanh 90/90 trên HEAD, đỏ 75/90 trên cây gốc 1d66c610; --day-du PASS 124 · FAIL 0 · CẢNH BÁO 1; 10 bài cũ chạy lại
xanh. Đột biến soát thêm (scratchpad/dot_bien_them.py): 6 cái, 2 BẮT, 4 SỐNG.
LỖI TÌM ĐƯỢC:
 1. server/utils/giuCho.js:143 — B2 hứa "chốt bởi đường khác → 409" nhưng donApp.js:321 chốt phiên App tai_khoan với nguon 'tai_khoan' trùng
    quầy → nhân viên gọi POST /phien/:id/chot trên phiên App đã chốt → 200 lap_lai (trước 409). Vế `phien.nguon === nguon` và
    `['tien_mat','tai_khoan'].includes(nguon)` là vế chết (route thanh-toan.js:60 đã lọc cách, nguon luôn = p.cach) — SOAT-BO-NGUON,
    SOAT-BO-DS-NGUON SỐNG. Không ghi tiền thêm. K1/K4/K3. Sửa: bỏ vế chết, chặn phiên App (laPhienApp thanh-toan.js:30), thêm ca.
 2. client/src/pages/BanHang/BanHangMoi.jsx:234 + :298 — đơn đôi: chốt rớt mạng → hỏi phiên thấy `cho` trong lúc lệnh chốt còn chạy ở máy chủ
    → nha → huyPhien 409 (đơn vừa ghi) bị nuốt .catch(() => {}) → màn "Mất kết nối… thử lại" → nhân viên thu lại mã mới → ĐƠN THỨ HAI.
    Sửa: huỷ 409 thì hỏi lại phiên, không báo thử lại. K4 (nuốt lỗi) · đường tiền.
 3. viec/KET-NOI-1/bang_chung_do.txt:7,73 + trang_thai.md "89 ca, đỏ 74/89" đã cũ (3483d3a3, c9f52628 đổi bài sau cd9dac62, thêm C2c2):
    gốc thật 15 đạt · 75 hỏng · tổng 90 — SỐ CA phải 90; trang_thai còn hai số npm test (119 và 124). K1, cổng A16.
 4. client/src/pages/BanHang/tinh.js:337 + giuCho.js:53 — QR DANG_XU_LY hết lượt → nhánh bao_loi "Đang tạo mã QR — chờ vài giây" nhưng không
    đường lấy lại phiên: bấm lại = mã mới → phiên QR thứ hai, số HĐ thứ hai; có voucher → VOUCHER_DANG_GIU tới 10 phút. run(UPDATE qr…)
    giuCho.js:126 rớt sau khi cổng tạo link → phiên kẹt DANG_XU_LY tới hết hạn. K5.
 5. Lỗ bài thử (K3): giuCho.js:47 vế `p.cach !== cach` không có ca (SOAT-BO-CACH SỐNG); database.js:1507 vế FetchError không có ca cô lập
    (SOAT-BO-FETCHERROR SỐNG) — lỗi giả A1e mang cả code ECONNRESET lẫn chữ "socket hang up".
 6. server/index.js:68 — /api/nd gắn trước doYeuCau (:92) nên không đo; F1 ghi "mỗi yêu cầu /api/*". Nhẹ.
NGHI NGỜ:
 - api.js:82 POST/PUT/DELETE ghi tiền rớt mạng vẫn "…rồi thử lại" — đúng chữ phiếu C1 nhưng ngược lý do đề xuất #2; nên hỏi chủ quán.
 - B1 "đúng kiểu khiTrung": đụng UNIQUE ra 500 LOI_MAY_CHU, không đọc lại phiên; chống trùng dựa BEGIN IMMEDIATE; Turso CHƯA KIỂM.
 - Mã lỗi lệch App: MA_GUI_KHAC_DON / MA_GUI_KHONG_HOP_LE vs KHOA_GUI_DA_DUNG / KHOA_GUI_SAI (donApp.js:41,261,270) — LUAT mục 2.
 - ke_hoach.md K1: :174 "cause = lỗi gốc" (trái :62 và code); :128 chữ ký viecKhiThuHong khác tinh.js:336; :118 "hoiPhien đặt thuLai" (mặc định GET).
 - thu_SAOLUUDEM1.js B3 nới: "git diff rỗng" → "không commit nào tiêu đề SAOLUU-DEM-1" — dựa tiêu đề commit.
 - kiemPin có thể đếm thêm một lần khi tạo phiên gửi lại sau KHO_MAT_KET_NOI / KHO_BAN — chưa đo.
NGHIỆM THU: 19/20 · thiếu B2 (vế "chốt bởi đường khác → 409" sai với phiên App tai_khoan, không ca).
 A1–A4, B1, B3, B4, B5, B6, C1, C2, D1–D3, E1, E2, F1 (thiếu /api/nd), F2, F3 có bằng chứng (ca nêu trong báo cáo gốc).
CHƯA SOÁT ĐƯỢC: Turso thật (hình lỗi, xếp hàng BEGIN IMMEDIATE, mã bận); Render/Cloudflare 502 thật; crypto.randomUUID trên máy quầy
 (HTTPS); chưa chạy tu_chay/cong.js chay; chưa chạy lại đủ 54 đột biến; chưa thử tay điện thoại; chưa /soat-bao-mat.
BÀI HỌC: KHOÁ — bài thử nhánh catch chayPhien chạy thật với huyPhien 409 (lỗi 2); KHOÁ — đột biến TỪNG vế phienCuaMa / B2 (lỗi 1, 5);
 KHOÁ — cổng so SỐ CA với số ca trên HEAD (lỗi 3). NGUYÊN TẮC K4 — "đường khác → giữ như cũ" phải liệt kê từng lối gọi, mỗi lối một ca;
 hai lối trùng nguon không phân biệt bằng nguon. NGUYÊN TẮC K5 — "đang xử lý" hết lượt mà lần bấm sau tạo mã mới → cần đường dùng lại mã
 cũ hoặc coi là "chưa biết" (B5). NGUYÊN TẮC K3 — lỗi giả trong bài thử chỉ mang ĐÚNG MỘT dấu hiệu đang thử.
```
(Bản trên rút gọn phần "trả lời 8 mục" — nội dung lỗi / nghi ngờ / nghiệm thu / chưa soát / bài học giữ nguyên ý và số liệu.)

## Vòng sửa 1 (sau soát vòng 1)
- Nghi ngờ kiemPin: LOẠI — PIN đúng đặt lại bộ đếm (`server/utils/pinKhach.js:52`), gửi lại không khoá oan.
- Lỗi 1 (B2 phiên App): bỏ hai vế chết, chặn phiên có dòng `pos_don_app.phien_id` (`giuCho.js` chotPhien) — ca B2e + VS-CHOT-LAI-APP.
- Lỗi 2 (đơn đôi): nhánh lỗi `chayPhien` giao hết cho `xuLyThuHong` (tinh.js — hỏi / huỷ truyền vào): huỷ bị từ chối → hỏi LẠI → đã thu
  → màn kết thúc; không rõ → câu B5. Ca B3d (3 ca, gồm "cho → huỷ 409 → da_thu → xong") + BV-HUY-409-HOI-LAI · VS-HOI-HONG-NHA.
  CHƯA KIỂM: nhánh này chạy ở màn thật (chỉ hàm thuần + soi nguồn chỗ gọi).
- Lỗi 3 (số cũ): bằng chứng chạy lại — gốc 16 đạt · 79 hỏng / 95 ca; SỐ CA 95; NDAPI1 so BẰNG 19.
- Lỗi 4 (DANG_XU_LY hết lượt): coi là "chưa biết" → câu B5, không mời bấm lại (VS-DANG-XU-LY). Phiên QR kẹt khi `UPDATE qr` rớt sau khi
  cổng đã tạo link: ghi Phát hiện (đường cũ, ngoài Cấm của giuCho).
- Lỗi 5 (lỗ bài thử): ca B1c2 (cách khác) + VS-MA-GUI-BO-CACH; A1e cô lập FetchError (Premature close) + VS-MANG-BO-FETCHERROR; vế FetchError
  rút về type 'system' (bỏ request-timeout / body-timeout không xảy ra).
- Lỗi 6 (/api/nd không đo): index.js gắn `doYeuCau` riêng cho /api/nd; `doYeuCau` bỏ qua yêu cầu đã đo (BV-DO-HAI-LAN, BV-ND-DO).
- Nghi ngờ khiTrung: thêm `.catch` đụng khoá UNIQUE → đọc lại phiên (B1f2 + BV-MA-GUI-TRUNG-KHOA); câu đọc đầu giao dịch giữ lớp thứ nhất
  (B1f3 — đếm 0 lần đụng khoá + BV-MA-GUI-TRONG-GD). Hai lớp che nhau nên mỗi lớp một ca nối tiếp (đua trên kho file làm P26d thay kết nối).
- Nghi ngờ mã lỗi lệch App: đổi `MA_GUI_KHAC_DON` / `MA_GUI_KHONG_HOP_LE` → `KHOA_GUI_DA_DUNG` / `KHOA_GUI_SAI` (cùng đơn App).
- Nghi ngờ ke_hoach K1: thêm mục "Chỉnh sau duyệt" cuối `ke_hoach.md` (không viết đè bản chủ quán duyệt).
- Nghi ngờ câu "thử lại" cho POST ghi rớt mạng (api.js): giữ đúng chữ phiếu C1 — ghi Phát hiện để chủ quán xem (đổi chữ = đổi phiếu).
- Nghi ngờ thu_SAOLUUDEM1 B3 dựa tiêu đề commit: giữ — B3 gốc đỏ vĩnh viễn với mọi việc sau chạm index.js; ghi Phát hiện.
- Bài thử tự sửa trong vòng: k() / muc() in thẳng (dòng ✗ không bị gom vào log máy chủ — VS-CHAM-NGUONG từng LẠC); B1f chốt số đếm trước B1f2.
- Đột biến: lần chạy đủ ở d8789d81: 62 · BẮT 60 · SỐNG 2 (BV-MA-GUI-TRONG-GD, BV-MA-GUI-TRUNG-KHOA — hai lớp che nhau) → sửa bài (d6b5d196)
  → chạy lại 3 cái đó: BẮT 3.

## Câu hỏi
(không có)
