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
- Bài mới `cong_cu/thu_KETNOI1.js` viết TRƯỚC — sau vòng sửa 2: 99 ca, đỏ trên gốc 82/99 (`bang_chung_do.txt`; bản đầu 89 ca đỏ 74; vòng 1 95 ca đỏ 79). Lớp mạng giả dựng đúng hình lỗi node-fetch 2.7.0.
- Bài cũ sửa thường (hành vi chủ quán duyệt đổi / phiếu cho đổi `index.js`, đỏ trên gốc): `thu_BH2.js` R4 + S22, `thu_P3.js` F7,
  `thu_NDAPI1.js` A2 (so BẰNG 18 dòng thêm), `thu_SAOLUUDEM1.js` B3 (theo commit của việc) + ca mới F1/F2 (đúng lỗi Cài đặt › Sao lưu 16.11).
- `npm test -- --day-du` (sau vòng sửa 2, HEAD e4337891): PASS 124 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn từ trước việc này). Con số 119 ở mục "Sự cố khác" là lần chạy
  TRƯỚC khi có bài mới (bước 1, kho nông).
- `client/dist` build lại sau mọi sửa `client/src/`.

### Chỗ vá → đột biến (`viec/KET-NOI-1/dot_bien.py`, mỗi đột biến một dòng)
| Chỗ vá | Đột biến |
|---|---|
| database.js `query()` đọc lại câu ĐỌC (số lần, độ chờ) | BV-DOC-THU-LAI · VS-THU-LAI-BA · VS-CHO-KHONG · VS-THU-LAI-GHI · BV-CAU-GHI |
| database.js `laCauDoc` | VS-CAU-DOC-CHUA-TU |
| database.js `laLoiMang` | VS-MANG-RONG · VS-MANG-BO-CAUSE · VS-MANG-BO-FETCHERROR |
| database.js lỗi đổi dạng (không cause) | VS-LOI-GIU-CAUSE |
| database.js `run()` / giao dịch (câu đầu, câu sau) / commit đổi lỗi | BV-RUN-DOI-LOI · BV-TX-DOI-LOI · BV-TX-CAU-DAU-DOI-LOI · BV-COMMIT-DOI-LOI |
| database.js đếm rớt | BV-LOG-DEM |
| giuCho.js `phienCuaMa` (3 chỗ gọi, so thân / cách / trừ TK, QR đang tạo, QR lỗi, dạng mã) + khiTrung | BV-MA-GUI-NHANH · BV-MA-GUI-TRONG-GD · BV-MA-GUI-TRUNG-KHOA · VS-MA-GUI-BO-SO-THAN · VS-MA-GUI-BO-CACH · VS-MA-GUI-BO-TK · BV-MA-GUI-QR-DANG-TAO · VS-MA-GUI-QR-LOI · BV-MA-GUI-DANG |
| 029_ket_noi.js khoá UNIQUE | BV-029-UNIQUE |
| giuCho.js `chotPhien` B2 (lapLai, chặn phiên App) + route `/chot` lapLai | BV-CHOT-LAI · VS-CHOT-LAI-MOI-NGUON · VS-CHOT-LAI-APP · BV-LAP-LAI-ROUTE |
| wallets.js `loiGhi` → 503 | BV-LOIGHI-503 |
| database.js `mocLoiKho` (chỉ ≥ 500) / index.js gắn móc / bắt lỗi cuối / health | BV-LOI-KHO-MOC · VS-MOC-MOI-MA · BV-MOC-INDEX · BV-TRA-LOI-KHO-CUOI · BV-HEALTH |
| api.js `goiFetch` / trang proxy (502–504, 520–524: VS-PROXY-CHI-502) / thuLai mặc định / phiên / tinhThu / upload | BV-API-MAT-KET-NOI · BV-API-PROXY · VS-API-POST-THU-LAI · BV-API-GET-THU-LAI · BV-API-PHIEN-THU-LAI · BV-API-CHOT-THU-LAI · VS-NEN-GUI-LAI-BO-KHO-BAN · VS-NEN-GUI-LAI-MOI-MA · BV-API-TINH-THU · BV-GOI-FETCH-UPLOAD |
| ThuTien.jsx / tinh.js `nhanhNutThu` | BV-NUT-0D · VS-NHANH-NUT |
| tinh.js `loiTinhGia` / `xuLyThuHong` / `thanPhien` maGui | BV-LOI-TINH · BV-HUY-409-HOI-LAI · VS-HUY-MOI-TRANG-THAI · VS-HOI-HONG-NHA · VS-VIEC-KHONG-PHIEN · VS-DANG-XU-LY · BV-MA-GUI-THAN |
| BanHangMoi.jsx mã mỗi lần thu / câu B5 | BV-BH-MA-GUI · BV-BH-CAU-B5 |
| database.js đo chậm (ngưỡng, đường dẫn, đếm câu, ngoài, health cham, chống đo hai lần) / index.js gắn đo (+ /api/nd) | BV-CHAM · BV-CHAM-CLOSE · VS-CHAM-NGUONG · VS-CHAM-LO-DUONG · VS-CHAM-BO-QR · BV-DEM-CAU · BV-NGOAI · BV-CHAM-HEALTH · BV-DO-HAI-LAN · BV-DO-INDEX · BV-ND-DO |

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

## Soát độc lập — vòng 2 (agent general-purpose mới, 16.11, trên HEAD aa3a3908) — chép nguyên ý, đủ số liệu
```
KHÔNG ĐẠT
Tóm tắt: bài 95/95 xanh; gốc 1d66c610 16 đạt · 79 hỏng (khớp bằng chứng); --day-du PASS 124 · FAIL 0 · CẢNH BÁO 1; đột biến đủ trên HEAD
62/62 BẮT (đối chứng xanh). Sáu lỗi vòng 1 đã sửa đúng; bản sửa lỗi 2 sinh lỗi mới. Không lỗi nào đụng tiền / ví / lộ / ngoài Phạm vi.
LỖI TÌM ĐƯỢC:
 1. client/src/pages/BanHang/tinh.js:346-348 xuLyThuHong — chốt hỏng vì ĐƠN (4xx taoDon: hết hàng orders.js:439, ví đổi, voucher đã dùng)
    → chotPhien đặt 'loi' (giuCho.js:187) → hỏi lần 1 'loi' → huỷ (WHERE trang_thai='cho') 409 (thanh-toan.js:75) → hỏi lại 'loi' →
    bao_chua_biet → BanHangMoi.jsx:297 câu B5 thay lời máy chủ (gốc: nhả rồi e.message). Phiên 'huy' cũng vậy. Thử hàm thật
    scratchpad/xu_ly_loi.mjs. Xanh oan: ca B3d w3 thu_KETNOI1.js:594 cho huỷ thành công với phiên 'huy' (máy chủ thật trả 409).
    Sửa: chỉ huỷ khi hanhDongPhien(lan1) === 'doi'; 'nha' → bao_loi; thêm ca huỷ 409 cho 'loi'/'huy' + đột biến. K5 (D1) + K3 · NHẸ.
 2. server/database.js:1562 — [CHAM] dựa res.on('finish'); khách bỏ kết nối trước khi máy chủ trả lời → chỉ 'close' (thử scratchpad/finish_abort.js
    ra "close, da_tra", không finish) → đúng ca Ahamove bỏ sau 5 giây (D-LOI-1) không có [CHAM], không đếm cham. Sửa: nghe 'close'. K4 · NHẸ.
 3. server/utils/giuCho.js:20-21 chú thích "Q16: phiên chờ chuyển khoản giữ voucher" bị dời sang dòng nạp laTrungKhoa; giuCho.js:137 dòng 502 có
    sẵn đổi thành LOI_QR() — ngoài hai nhánh Cấm cho phép (hành vi không đổi). K1/K6 · NHẸ.
 4. Lỗ bài thử (scratchpad/dot_bien_soat2.py: 10 đột biến, 4 BẮT, 6 SỐNG): api.js:102 trang 503/504 proxy không ca (chỉ giữ 502 vẫn sống);
    database.js:1557 vế che mã QR (P15-QR) trong duongLog không ca; CHO_DOC_MS = [0, 0] sống (A1d chỉ canh trần ≤ 1000 ms — một chiều);
    mocLoiKho bỏ vế >= 500 sống; api.js:94 nhánh AbortError code chết (không lời gọi nào truyền signal); B2 hai vế trang_thai==='da_thu' và
    order_id che nhau. K3 · NHẸ.
 5. Hồ sơ cũ (K1/K4 TU-CHAY-5): cong_cu/thu_BH2.js:235 nhắc viecKhiThuHong (không còn); bang_chung_do.txt:25,28,49 còn MA_GUI_KHAC_DON /
    MA_GUI_KHONG_HOP_LE / viecKhiThuHong dưới câu "cùng chữ cho các ca có sẵn"; bang_chung_do.txt:53 "16 ca xanh" chỉ kể 13; ke_hoach.md
    "Chỉnh sau duyệt" sót :249, :271 (BV-VIEC-KHI-THU-HONG), :274 (VS-LOI-KHO-CHU-GOC), :306; server/index.js:92 lý do "sau bộ đọc thân —
    ngữ cảnh đo đi theo route" — scratchpad/als_body.js cho thấy ngữ cảnh vẫn còn sau express.json. NHẸ.
 6. server/database.js ~1530-1575 — bộ phận HTTP (mocLoiKho, traLoiKho, doYeuCau, duongLog, bocFetchNgoai) trong database.js (>1.700 dòng) sai
    chỗ theo LUAT §3; gọn hơn: server/middleware/ketNoi.js, database.js chỉ xuất doCau / kho ngữ cảnh. Đơn giản · NHẸ.
NGHI NGỜ: Cloudflare 520–524 không tính là mất kết nối (api.js:102) → tạo phiên gặp 524 ra bao_loi, bấm lại mã mới, phiên cũ mồ côi 10 phút
 (không đơn đôi); commit "rớt" sau khi Turso đã ghi: trừ kho SX sau commit (orders.js:1297) + pos_stock_pending không chạy, nay quầy nhận
 200 lap_lai → SX lệch im lặng (lỗi cũ, nay che bằng thành công); phiên QR gặp ca này kẹt DANG_XU_LY; fetch không hạn giờ (lỗi cũ);
 kiemPin cộng đếm trước khi so (pinKhach.js:48-52) — câu đặt lại rớt rồi gửi lại → pin_sai cộng dồn ("LOẠI" chỉ đúng một phần); POST thường
 gặp 502/503/504 proxy → "…thử lại" (đã ghi Phát hiện); [CHAM] giữ đoạn toàn chữ: mã đơn App /api/kh/don/:ma không chữ số (~10%,
 donApp.js:57) lên log — cần token khách, rủi ro thấp; thu_SAOLUUDEM1.js B3 dựa tiêu đề commit.
NGHIỆM THU: 18/20 · lỗi / thiếu: D1 (lỗi 1), F1 (thiếu ca khách bỏ kết nối — lỗi 2).
CHƯA SOÁT ĐƯỢC: Turso thật; trang 502/52x thật; nhánh catch chayPhien trên màn thật; crypto.randomUUID máy quầy; tu_chay/cong.js chay chưa ghi;
 thử tay điện thoại; /soat-bao-mat.
BÀI HỌC: KHOÁ — hàm giả trong bài thử (huỷ / hỏi) theo ĐÚNG điều kiện câu ghi máy chủ (huỷ 409 khi phiên không còn 'cho'); KHOÁ — đo chậm có ca
 "khách bỏ kết nối giữa chừng". NGUYÊN TẮC K5 — sửa nhánh lỗi chung: liệt kê MỌI trạng thái hỏi về (cho / da_thu / loi / huy / het_han /
 hỏi hỏng), mỗi trạng thái một ca theo hành vi gốc. K3 — mỗi vế danh sách mã / trạng thái một ca riêng; ngưỡng thời gian canh hai chiều.
 K4 — đổi tên hàm / mã ở vòng sửa thì grep cả cong_cu/ + bang_chung_do.txt + ke_hoach.md.
```

## Vòng sửa 2 (sau soát vòng 2 — mọi lỗi NHẸ)
- Lỗi 1 (chốt hỏng vì đơn báo nhầm mất kết nối): `xuLyThuHong` chỉ huỷ phiên còn 'cho'; 'loi' / 'huy' / 'het_han' → bao_loi (lời máy chủ, như gốc).
  Huỷ giả trong bài thử theo ĐÚNG câu ghi máy chủ (409 khi không còn 'cho'). Ca B3d (soát vòng 2) + VS-HUY-MOI-TRANG-THAI.
- Lỗi 2 ([CHAM] khi khách bỏ kết nối): nghe 'close'. Ca F1 "khách bỏ ở 2,3 s, máy chủ 3 s" + BV-CHAM-CLOSE. (Thử lần đầu bỏ ở 150 ms → dưới
  ngưỡng nên không dòng — ca sai thiết kế, sửa thành bỏ TRÊN ngưỡng như Ahamove bỏ sau 5 s.)
- Lỗi 3 (ngoài Cấm giuCho): trả chú thích Q16 về dòng nạp voucherCode; dòng 502 tạo QR hỏng giữ NGUYÊN chữ gốc (LOI_QR chỉ dùng trong phienCuaMa).
- Lỗi 4 (lỗ bài thử): proxy 503 / 504 / 524 (VS-PROXY-CHI-502); che mã QR trong đường dẫn [CHAM] (VS-CHAM-BO-QR); A1d hai chiều ≥ 700 ms
  (VS-CHO-KHONG); móc chỉ ≥ 500 (VS-MOC-MOI-MA); bỏ nhánh AbortError chết; B2 bỏ vế order_id (che nhau, cùng giao dịch với da_thu).
- Lỗi 5 (hồ sơ cũ): thu_BH2.js chú thích → xuLyThuHong; bang_chung_do.txt ghi rõ đổi tên + đủ 17 ca xanh trên gốc; ke_hoach.md "Chỉnh sau duyệt"
  bổ sung; index.js bỏ câu lý do "ngữ cảnh đo đi theo route" (người soát đo được ngữ cảnh vẫn còn sau express.json).
- Lỗi 6 (bộ phận HTTP trong database.js): KHÔNG chuyển — file mới `server/middleware/ketNoi.js` ngoài Phạm vi phiếu; bài thử cần nạp các hàm này
  trong tiến trình (index.js tự chạy máy chủ khi nạp). Ghi Phát hiện.
- Nghi ngờ Cloudflare 520–524: thêm vào trang proxy = mất kết nối (api.js MA_TRANG_PROXY).
- Nghi ngờ kiemPin: sửa lại câu ở vòng sửa 1 — PIN đúng thì cộng đếm rồi đặt lại; nếu câu ĐẶT LẠI (`pinKhach.js:52`) rớt mạng sau khi so đúng,
  lần gửi lại cộng thêm một lần sai (tối đa = số lần gửi lại, 2) — CHƯA KIỂM, ghi Phát hiện (pinKhach.js ngoài Phạm vi).
- Bài thử: 99 ca, gốc 17 đạt · 82 hỏng. Đột biến chạy đủ ở e4337891: 68 · BẮT 68 · SỐNG 0 · HỎNG 0 · LẠC 0 (đối chứng 99 đạt · 0 hỏng).
- `npm test -- --day-du`: PASS 124 · FAIL 0 · CẢNH BÁO 1.

## Soát độc lập — vòng 3 (agent general-purpose mới, 16.11, trên HEAD ef23a453) — chép nguyên ý, đủ số liệu
```
KHÔNG ĐẠT (chỉ còn lỗi NHẸ, không lỗi NẶNG)
Đã chạy: thu_KETNOI1 HEAD 99 đạt · 0 hỏng; cây gốc 1d66c610 17 đạt · 82 hỏng · 99 ca (khớp bằng chứng); --day-du chạy riêng PASS 124 · FAIL 0
 · CẢNH BÁO 1, "dist đã commit KHỚP với src hiện tại" (lần đầu FAIL 1 thu_gia_lap "data/ không đổi" vì chạy song song bài của người soát;
 chạy riêng thu_gia_lap 180 đạt · 0 hỏng); 10 đột biến soát thêm (scratchpad/dot_bien_soat3.py): 6 BẮT, 4 SỐNG.
Lỗi vòng trước đều sửa ĐÚNG: B2 phiên App giuCho.js:150-153 (B2e); huỷ 409 hỏi lại tinh.js:141-151; chốt hỏng vì đơn bao_loi tinh.js:147;
 [CHAM] 'close' database.js:1563; 52x api.js:96,101; A1d hai chiều thu_KETNOI1.js:235; móc ≥ 500 database.js:1545; Q16 giuCho.js:20, dòng 502
 gốc giuCho.js:137; bỏ vế order_id an toàn (sauGhiDon cùng giao dịch cổng da_thu orders.js:1032,1103; da_thu chỉ ghi ở giuCho.js:168).
LỖI TÌM ĐƯỢC:
 1. client/src/utils/api.js:84 CHO_GUI_LAI_MS = [500, 1500] không ca canh độ chờ gửi lại — đột biến [0, 0] SỐNG; đường song song lỗi vòng 2
    (CHO_DOC_MS, chỉ vá máy chủ). K3/K4 — NHẸ
 2. server/database.js:1532-1535 nemLoiGhi: lỗi mạng TRONG giao dịch (câu đầu, câu sau, commit) không ca canh dòng [KET-NOI] + đếm rot —
    xoá baoRot(...) trong nemLoiGhi SỐNG; A4a/A4b chỉ qua query() và run(). K3 (A4) — NHẸ
 3. client/src/pages/BanHang/BanHangMoi.jsx:293-303 chỗ gọi xuLyThuHong (đường tiền) chỉ dò chữ (B5a, thu_BH2 S22): `const p = phien` →
    `const p = null` SỐNG ở thu_KETNOI1 và S22 (mẫu `phienId: p\?\.id` vẫn khớp); `viec === 'bao_chua_biet'` → `'khong_co'` SỐNG ở thu_KETNOI1
    (chỉ S22 bắt, dò chữ). Ít nhất khoá cụm gán `const p = phien; phien = null;` hoặc dựng màn bằng esbuild như E1a. K3 — NHẸ
 4. client/src/utils/api.js:66-73 readBody — đường song song goiFetch (C1 "một chỗ"): 200 mà thân đứt (text() ném) → {} như thành công →
    BanHangMoi.jsx:276 phien.tong ném TypeError → "Cannot read properties of undefined (reading 'tong')" (chữ kỹ thuật, không B5); phiên
    đã tạo mồ côi (giữ ví / voucher 10 phút). Không đơn đôi; lệnh chốt hoanTat(undefined) vẫn báo "đừng thu lại". Lỗi cũ, trong mục tiêu C1/E2.
    Sửa: text() ném → loiMatKetNoi(). K4 — NHẸ
 5. viec/KET-NOI-1/bang_chung_do.txt:79-81 "17 ca xanh trên gốc" chỉ kể 16 — sót "F1 yêu cầu 1,8 giây (ngay DƯỚI ngưỡng)" (vòng 2 lỗi 5 đã chỉ
    đúng chỗ này). Kèm: ke_hoach.md:225 "cause.code UND_ERR_SOCKET" trái :47 và code — "Chỉnh sau duyệt" chưa ghi. K1 — NHẸ
NGHI NGỜ: HRANA_CLOSED_ERROR bọc lỗi mạng gốc (hrana-client errors.js:38-48 "Stream is closed: FetchError: request to …turso.io… reason: <lý do>")
 — lý do khác "socket hang up" (vd "read ECONNRESET") thì laLoiMang (database.js:1501-1505) không nhận → lỗi đi nguyên → err.message có thể lộ
 địa chỉ kho; chỉ khi câu SAU cùng giao dịch chạy tiếp sau câu rớt (nemLoiGhi ném ngay câu đầu → rất hiếm), CHƯA KIỂM Turso. Sau câu B5 nút thu
 vẫn sáng — chặn đơn đôi nhánh "chốt hỏng + hỏi cũng hỏng" chỉ bằng LỜI DẶN (C16), giữ như gốc + chủ quán chọn #3 → Phát hiện. thu_SAOLUUDEM1 B3
 nới (Phát hiện 10). node tu_chay/cong.js chay chưa ghi trang_thai.
NGHIỆM THU: 20/20 có code · 18/20 đủ bằng chứng · thiếu: B3 (độ chờ gửi lại — lỗi 1), A4 (log / đếm đường giao dịch — lỗi 2).
CHƯA SOÁT ĐƯỢC: Turso thật (hình lỗi, xếp hàng BEGIN IMMEDIATE, HRANA_CLOSED_ERROR); trang 502/52x thật; nhánh catch chayPhien trên màn thật + thử
 tay điện thoại; crypto.randomUUID (có nhánh dự phòng Kho/chung.js:8 khớp MAU_MA_GUI); tu_chay/cong.js chay (ghi file trong kho); /soat-bao-mat;
 68 đột biến không chạy lại đủ lượt này.
BÀI HỌC: KHOÁ — mỗi hằng chờ / gửi lại có ca hai chiều, cả máy chủ lẫn quầy (sửa một phía thì grep phía kia); KHOÁ — mỗi chỗ đổi dạng lỗi
 (query / run / giao dịch / commit) có ca canh log + đếm riêng. NGUYÊN TẮC K3 — chỗ gọi hàm thuần trên đường tiền khoá bằng mẫu bao cả phép
 gán đầu vào hoặc chạy thật. K4 — "một chỗ đổi lỗi mạng" phủ cả fetch() bị từ chối LẪN thân trả về đứt. K1 — hồ sơ ghi "N ca" thì liệt kê đúng
 N, đếm bằng máy (lặp lần 2).
```

## Vòng sửa 4 (LUAT §6.5 — soát lần cuối chỉ còn lỗi NHẸ: chat soát thay, không gọi agent soát nữa)
- Lỗi 1 (độ chờ gửi lại ở quầy không ca): ca B3e — 2 lần gửi lại mất ≥ 1800 ms và < 3000 ms (hai chiều) + VS-CHO-GUI-KHONG.
- Lỗi 2 (log / đếm trong giao dịch không ca): ca A4c — câu đầu, câu sau, commit: mỗi lần một dòng [KET-NOI] "giao dich", rot +3 + BV-LOG-GIAO-DICH.
- Lỗi 3 (chỗ gọi xuLyThuHong chỉ dò lời gọi): B5a khoá CẢ cụm `const p = phien; phien = null;` + lời gọi + 3 nhánh + VS-BH-P-NULL, VS-BH-NHANH-B5.
  CHƯA KIỂM: nhánh catch chạy trên màn thật (vẫn dò nguồn — dựng cả BanHangMoi bằng esbuild là việc lớn, khuôn có ở thu_VOUCHER2.js).
- Lỗi 4 (readBody thân đứt → {} như thành công): `api.js` readBody ném MAT_KET_NOI; ca C1d (GET gửi lại, POST thường báo lời tiếng Việt) + BV-THAN-DUT.
- Lỗi 5 (hồ sơ): bang_chung_do.txt đủ 17 ca xanh (thêm F1 1,8 giây — đếm bằng máy); ke_hoach.md "Chỉnh sau duyệt" ghi `:225` UND_ERR_SOCKET.
- Kèm (người soát nêu ở mục Đơn giản): `api.js` sửa định dạng `nenGuiLai`, gộp hai chú thích chồng nhau ở dòng `tinhThu`.
- Nghi ngờ vòng 3 không sửa (đúng §6.5 — chỉ sửa lỗi lần soát nêu): HRANA_CLOSED_ERROR bọc lỗi mạng (Phát hiện 12), nút thu sáng sau câu B5
  (Phát hiện 13).
- Bài thử 102 ca: HEAD 102 đạt · 0 hỏng; gốc 17 đạt · 85 hỏng. Đột biến chạy đủ ở a5d860d9: 73 · BẮT 73 · SỐNG 0 · HỎNG 0 · LẠC 0
  (đối chứng 102 đạt · 0 hỏng). `npm test -- --day-du`: PASS 124 · FAIL 0 · CẢNH BÁO 1.
SOÁT LẦN CUỐI: chat soát thay

## Soát bảo mật
Bước 8b (`/soat-bao-mat`, lần 1, HEAD 0e80b150). Bước 2 (subagent tìm lỗ hổng): 0 lỗ hổng → bước 3 (lọc báo nhầm) không cần. Trước lọc: 0 · sau lọc: 0.
Báo cáo chép nguyên văn:

> ## Kết quả soát bảo mật nhánh `viec/KET-NOI-1` (mốc 1d66c610 → HEAD 0e80b150)
>
> **Không tìm thấy lỗ hổng nào** vượt qua được các loại trừ và tiền lệ đã nêu. Mình đã đọc toàn bộ diff phía máy chủ (`git diff 8d83bf8^ HEAD -- server/`) và phía quầy (`client/src`). Ngoài diff, mình đọc thêm `server/routes/thanh-toan.js` dòng 1–120 và `server/utils/giuCho.js` dòng 36–145.
>
> ### Những gì đã kiểm
>
> 1. **`server/database.js`: đọc lại khi lỗi mạng, đổi lỗi mạng thành `loiKho`, `traLoiKho`, `mocLoiKho`**
>    - Lỗi trả ra ngoài chỉ có câu cố định trong `LOI_KHO` cùng `code: 'KHO_MAT_KET_NOI'`. Lỗi gốc (có địa chỉ kho Turso) không được gắn vào lỗi mới. `ma_goc` chỉ nằm trên đối tượng lỗi, không ra câu trả lời.
>    - Log `[KET-NOI]` chỉ in mã lỗi đã lọc qua `maLoi` (chỉ giữ `[\w-]`, tối đa 40 ký tự). Không in câu SQL, tham số hay chữ lỗi gốc.
>    - `laCauDoc` chỉ dùng để quyết định có đọc lại hay không. Câu ghi và mọi câu trong giao dịch không được gửi lại. Không có đường tiêm SQL mới: tham số vẫn đi qua `sanitizeArgs` và `args`.
>    - `mocLoiKho` chỉ đổi mã trạng thái sang 503 khi câu lỗi khớp đúng hằng của mình.
> 2. **Dòng log `[CHAM]` (`doYeuCau`, `duongLog`)**
>    - Đường dẫn bỏ phần query. Đoạn nào có chữ số (SĐT, mã) đổi thành `:x`, đoạn ngay sau `qr` cũng đổi thành `:x`. Không in thân yêu cầu.
>    - Log cũ ở `server/index.js` vốn đã in mọi đường dẫn, nên phần này không lộ thêm gì.
>    - `AsyncLocalStorage` chỉ giữ bộ đếm thời gian, không mang dữ liệu nào giữa các yêu cầu.
> 3. **`GET /api/pos/health` (công khai) thêm `ket_noi`**: chỉ có số đếm rớt kết nối, số lần đọc lại, số lần chậm và một mốc giờ. Không có dữ liệu khách, khoá hay địa chỉ kho.
> 4. **`bocFetchNgoai` bọc `globalThis.fetch`**: chỉ cộng thời gian, trả nguyên kết quả và nguyên lỗi. Không đổi đích gọi hay header.
> 5. **`giuCho.js`: mã chống trùng `ma_gui`, hàm `phienCuaMa`**
>    - `ma_gui` được kiểm theo mẫu `^[A-Za-z0-9_-]{8,64}$` và truyền vào câu SQL dưới dạng tham số.
>    - Gửi lại cùng mã chỉ trả phiên cũ khi khớp đủ bốn điều: cùng thân đơn, cùng cách trả, cùng `nguoi_tao` (lấy từ JWT `req.user.username`, không lấy từ thân yêu cầu), và cùng lựa chọn trừ tài khoản khi phiên đã giữ ví. Lệch một điều là trả 409.
>    - Không cấp lại ví, voucher hay số hoá đơn. Số tiền vẫn do máy chủ tính (`taoDon chiTinh`) ở lần tạo đầu.
>    - Đường nhanh bỏ qua kiểm PIN. Mình không xếp đây là lỗi: nó chỉ trả lại đúng phiên mà chính tài khoản nhân viên đó đã tạo, sau khi lần tạo đầu đã qua kiểm PIN. Lần tạo đầu mà PIN sai thì không có dòng nào mang `ma_gui` được ghi. Đường nhanh không giữ thêm tiền.
>    - Nhánh bắt lỗi trùng khoá UNIQUE đọc lại phiên cũ qua cùng `phienCuaMa`.
> 6. **`chotPhien` với `lapLai` (`POST /phien/:id/chot`)**
>    - Chốt lần hai một phiên `da_thu` giờ trả `{id, code}` của đơn thay vì 409. Không ghi gì thêm.
>    - Route chỉ nhận phiên `tien_mat` và `tai_khoan`; phiên của đơn App bị loại.
>    - `GET /phien/:id` sẵn có (cùng `authenticate`) đã trả đúng `{id, code}` này cho mọi nhân viên đăng nhập, nên không lộ thêm.
> 7. **`wallets.js` (`loiGhi`) và handler lỗi cuối trong `index.js`**: chỉ chèn `traLoiKho` đặt trước nhánh trả 500, chỉ trả câu cố định.
> 8. **`029_ket_noi.js`**: chỉ thêm cột và chỉ mục UNIQUE, SQL cố định.
> 9. **Phía quầy (`api.js`, các màn BanHang)**
>    - Tự gửi lại khi mất kết nối: GET mặc định, POST chỉ khi lời gọi tự đặt (`tinh-thu` chỉ tính giá; tạo và chốt phiên có mã chống trùng).
>    - Không có `dangerouslySetInnerHTML`, không đưa token ra ngoài, không thêm `fetch` trần (`goiFetch` nằm trong `api.js`).
>
> ### Ghi chú, không phải lỗ hổng
> - `phienCuaMa` chỉ kiểm cờ `tru_tai_khoan`, không kiểm `tru_tai_khoan_me` khi phiên đã giữ ví mẹ (`giu_vi_me > 0`). Vẫn cần cùng nhân viên, cùng mã và cùng thân đơn, và không giữ thêm tiền, nên không có đường khai thác.

Ghi chú của phiên chính (không phải phần báo cáo): ví mẹ đi trong thân đơn — `giuCho.js` gán `don.parent_phone` khi `tru_tai_khoan_me`, nên bỏ cờ
trừ tài khoản mẹ ở lần gửi lại làm `than` khác → 409 qua vế so thân.

SOÁT BẢO MẬT: ĐẠT

## Phát hiện (ngoài Phạm vi / chưa làm — chủ quán xem)
1. Màn Bán hàng CŨ `Sales.jsx` là màn MẶC ĐỊNH (`client/src/pages/BanHang/index.jsx:35`) và gọi `POST /orders` không chống trùng — hở nặng nhất
   (B6). Chủ quán đã chốt để phiếu sau (BO-MAN-CU-1).
2. Đường ghi tiền còn hở bấm hai lần (B6): `wallets/topup|adjust|deduct`, `loyalty/redeem`, `damages`, `membership/cap`, `pay-debt` trả một phần —
   cùng khuôn ma_gui ở phiếu sau.
3. F2 — chốt tiền mặt = 23 câu kho TUẦN TỰ, tạo + chốt = 33 (`thu_KETNOI1.js` [F]). Đề xuất phiếu tối ưu: gộp đọc trong taoDon / gửi lô (batch),
   đo thật bằng dòng [CHAM] trên production trước. Tin báo Ahamove: trả 200 ngay rồi xử lý sau (GIAO-2).
4. Commit "rớt" sau khi Turso đã ghi đơn: phần sau commit của taoDon (trừ kho SX `orders.js:1297`, `pos_stock_pending`) không chạy; nay quầy nhận
   200 lap_lai nên SX lệch im lặng (lỗi cũ, nay bị che bằng thành công). Phiên QR gặp ca này kẹt DANG_XU_LY tới hết hạn (giữ voucher / số HĐ).
5. `fetch` ở quầy không có hạn giờ — yêu cầu treo không bao giờ tới lượt gửi lại, nút khoá lâu (lỗi cũ).
6. Câu C1 "…kiểm tra mạng rồi thử lại" cũng hiện cho POST ghi tiền (nạp ví…) — đúng chữ phiếu nhưng ngược lý do đề xuất #2; đổi = đổi phiếu.
7. Bộ phận HTTP (mocLoiKho, traLoiKho, doYeuCau, bocFetchNgoai) đặt trong `server/database.js` (> 1.700 dòng) — nên tách `server/middleware/ketNoi.js`
   (ngoài Phạm vi).
8. `kiemPin` (`server/utils/pinKhach.js:48-52`) cộng đếm sai TRƯỚC khi so; câu đặt lại rớt mạng → gửi lại cộng dồn một lần (CHƯA KIỂM).
9. [CHAM] giữ đoạn đường dẫn toàn chữ: mã đơn App `/api/kh/don/:ma` không chữ số (~10%) có thể lên log — cần token khách, rủi ro thấp.
10. `cong_cu/thu_SAOLUUDEM1.js` B3 nay dựa tiêu đề commit "SAOLUU-DEM-1…" (bản cũ "diff index.js rỗng" đỏ vĩnh viễn với mọi việc sau chạm index.js).
11. CHƯA KIỂM trên Turso thật: hình lỗi mạng thật, BEGIN IMMEDIATE có xếp hàng hai lần gửi cùng mã không (đã thêm lớp khiTrung đỡ), mã bận Turso.
12. `laLoiMang` (`server/database.js`) không nhận HRANA_CLOSED_ERROR bọc lỗi mạng ("Stream is closed: FetchError: … reason: read ECONNRESET" —
    hrana-client errors.js:38-48) → lỗi đi nguyên, err.message có thể lộ địa chỉ kho. Chỉ khi câu SAU chạy tiếp sau câu rớt trong cùng giao dịch
    (nemLoiGhi ném ngay câu đầu → rất hiếm). Sửa gọn: xét đệ quy `cause`. CHƯA KIỂM trên Turso.
13. Sau câu B5 ("Đừng thu lại…") nút thu vẫn sáng — chặn đơn đôi ở nhánh "chốt hỏng + hỏi cũng hỏng" chỉ bằng LỜI DẶN (C16). Giữ như gốc;
    chủ quán đã chọn #3 (bấm lại = mã mới). Đề xuất phiếu sau: khoá nút thu tới khi nhân viên xác nhận đã kiểm Đơn hàng.

## Câu hỏi
(không có)

## Cổng (LUAT §6.3)
`node tu_chay/cong.js chay . 8d83bf8^ HEAD viec/KET-NOI-1` trên HEAD 76ecb67b, cây sạch:
```
· CẢNH BÁO A16: `cong_cu/thu_BH2.js` chạy trên gốc in 99 ca ≠ 100 ca ở head — bài dừng sớm trên gốc thì bỏ qua; không thì xem lại bằng chứng đỏ (dạng "… phép · … chỗ hỏng" không tách được số ca nên không so)
✓ CỔNG CHẠY ĐẠT
```
Cảnh báo A16 đã truy: ca G1 của `thu_BH2.js` chỉ chạy khi có `.git` (`cong_cu/thu_BH2.js:246-259` — đọc `git log cbbb809..HEAD`); cây gốc cổng
dựng bằng git archive KHÔNG có `.git` → thiếu đúng một ca (99 so 100). Hai ca đỏ trên gốc (R4, S22) là hai ca đã sửa — bằng chứng đúng.

## Nghiệm thu — đếm từng mục (bằng chứng: ca trong `cong_cu/thu_KETNOI1.js` trừ khi ghi khác)
- A1 đọc tự thử lại tối đa 2 lần, chờ tăng dần, lần 3 ném: A1a, A1b, A1c (×2), A1d (hai chiều ≥ 700 / ≤ 1000 ms); dấu hiệu laLoiMang: A1e–A1h, A3c.
- A2 chỉ câu ĐỌC thử lại; run / câu ghi qua query không: A2a, A2b, A2b2, A2c, A2d, A2d2, A2e; danh sách query() không phải SELECT: `ke_hoach.md` mục A2.
- A3 lỗi không phải mạng như cũ, SQLITE_BUSY đường P26d: A3a, A3b, A3c.
- A4 log [KET-NOI] không SQL / tham số; đếm + health: A4a (×2), A4b, A4c (trong giao dịch), G1, G3, G4.
- B1 ma_gui: B1a, B1b, B1c, B1c2, B1d, B1e, B1f, B1f2, B1f3, B1g (×2), B1h, B1i, B1j (×2), B1k; không gửi mã như cũ: B1e.
- B2 chốt lần hai trả đơn đã ghi; đường khác giữ 409: B2a (×3), B2b, B2c, B2d, B2e; `thu_P3.js` F7, `thu_BH2.js` R4.
- B3 quầy gửi lại cùng mã / cùng phiên, chờ, khoá nút: B3a, B3b (×4), B3c (×2), B3d (×4), B3e; nút khoá: `dangGuiRef` có sẵn (`BanHangMoi.jsx` chayPhien).
- B4 một đơn / ví một lần / voucher một lần / một số HĐ: B4a (×2), B4b (×3), B1f, B2a (cùng lúc).
- B5 câu báo một chỗ: B5a (×2), `thu_BH2.js` S22.
- B6 bảng đường ghi tiền + đề xuất: `ke_hoach.md` mục Q-B / B6 (chủ quán duyệt #1: để phiếu sau).
- C1 MAT_KET_NOI + lời tiếng Việt; GET thử lại; POST không (trừ phiên có mã, tinh-thu): C1a (×2), C1b (×2), C1c, C1d, C1 (tinhThu).
- C2 503 KHO_MAT_KET_NOI, không lộ chữ Turso: C2a, C2b, C2c, C2c2, C2d (×2), C2e (×2), C2f, G2; `thu_SAOLUUDEM1.js` F1 / F2 (Cài đặt › Sao lưu).
- D1 luồng thường không đổi: `npm test -- --day-du` PASS 124 · FAIL 0 (mọi bài cũ xanh) + ca "phải KHÔNG đổi" (17 ca xanh trên gốc).
- D2 phiên QR: B1b, B1i, B1j; bài cũ `thu_KHNAP1.js`, `thu_SEPAY1.js`, `thu_TINGEE1.js` xanh trong `--day-du`.
- D3 SQLITE_BUSY / KHO_BAN đường cũ: A3b; `thu_P26b.js`, `thu_P26c.js` xanh.
- E1 không "Đơn 0đ" khi chưa có số máy chủ: E1a (×2, gồm ThuTien.jsx THẬT gói esbuild), E1b (×2, đơn 0đ thật vẫn hiện).
- E2 lời lỗi tính giá: E2a, E2b; B1/B3 (BanHangMoi dùng loiTinhGia).
- F1 dòng [CHAM] > 2 s, không SĐT / tham số: F1 (×6: hằng, cách gắn index.js + /api/nd, 1,8 s, 2,15 s, che SĐT / số / QR, khách bỏ kết nối).
- F2 số câu kho ba đường: F2 + bảng "F2" ở trên (10 / 23 / 5 / 3).
- F3 health `ket_noi.cham`: F3, G1.
→ 20/20 mục có bằng chứng.

## Báo cáo 7 mục
```
VIỆC:        KET-NOI-1 — Kết nối bền vững: đọc tự thử lại khi rớt mạng, thu tiền ở quầy bấm lại không ra đơn đôi, lỗi mạng báo dễ hiểu (+ nhóm F đo chậm)
ĐÃ SỬA:      server/database.js — laLoiMang / laCauDoc; query() đọc lại tối đa 2 lần (200 + 600 ms); run() / giao dịch / commit đổi lỗi mạng thành
               KHO_MAT_KET_NOI (lời "máy chủ", không mang lỗi gốc); log [KET-NOI]; đếm demKetNoi; traLoiKho; mocLoiKho (≥ 500 → 503);
               doYeuCau (AsyncLocalStorage, [CHAM] > 2 s, nghe 'close'); bocFetchNgoai
             server/index.js — bọc fetch, gắn doYeuCau (/api/nd + /api) + mocLoiKho trước route, health ket_noi, bắt lỗi cuối → traLoiKho
             server/nang_cap/029_ket_noi.js — cột pos_phien_thanh_toan.ma_gui + UNIQUE WHERE NOT NULL (bỏ qua kho thiếu bảng — khuôn 025)
             server/utils/giuCho.js — taoPhien: ma_gui (dạng mã), phienCuaMa ở đường nhanh + câu đầu giao dịch + khiTrung (đụng UNIQUE);
               chotPhien: lapLai → đơn đã ghi (chặn phiên đơn App)
             server/routes/thanh-toan.js — /chot đặt lapLai · server/routes/wallets.js — loiGhi → traLoiKho
             client/src/utils/api.js — goiFetch + readBody (MAT_KET_NOI), trang proxy 502–504 / 520–524, gửi lại theo thuLai ('mang' GET + tinhThu,
               'co_ma' tạo / chốt phiên), chờ 500 + 1500 ms
             client/src/pages/BanHang/tinh.js — thanPhien maGui, nhanhNutThu, loiTinhGia, CAU_CHUA_BIET_DON, xuLyThuHong
             client/src/pages/BanHang/BanHangMoi.jsx — maGuiMoi mỗi lần thu, nhánh lỗi qua xuLyThuHong, loiTinhGia · ThuTien.jsx — nhanhNutThu
             client/dist — build lại · kiem_tra_truoc_khi_giao.js — chạy thu_KETNOI1.js
BÀI THỬ:     cong_cu/thu_KETNOI1.js (MỚI, 102 ca) — gốc 1d66c610: 17 đạt · 85 hỏng (A1–A4, B1–B5, C1–C2, E, F, G đỏ); HEAD: 102 đạt · 0 hỏng.
             Bài sửa thường (đỏ trên gốc): thu_BH2.js R4 + S22 (gốc 97/2), thu_P3.js F7 (99/1), thu_NDAPI1.js A2 (thêm 10 ≠ 19),
             thu_SAOLUUDEM1.js F1 (500 + chữ turso.io). Đột biến 73: BẮT 73 (đối chứng 102/0). npm test --day-du: PASS 124 · FAIL 0 · CẢNH BÁO 1.
             Cổng: ✓ CỔNG CHẠY ĐẠT (cảnh báo A16 BH2 99/100 — ca G1 cần .git).
ĐÃ RÀ K4:    db.execute trong database.js: 5 lối lúc chạy (query, run, câu đầu giao dịch, câu sau, commit) → xử lý hết (createTables / seed lúc khởi động
               ngoài việc); lối vào taoPhien 2 (route, donApp — App không mang mã); chotPhien 4 (/chot lapLai; xác nhận tay, webhook, donApp giữ 409);
               fetch trong api.js 1 chỗ (goiFetch) + readBody; 116 chỗ `{ error: err.message }` ≥ 500 → móc mocLoiKho một chỗ + lời đổi tại gốc;
               'finish' / 'close' → close; câu B5 1 chỗ (tinh.js) dùng 1 chỗ (BanHangMoi).
CHƯA KIỂM:   Turso thật (hình lỗi mạng, BEGIN IMMEDIATE xếp hàng hai lần gửi cùng mã — có lớp khiTrung đỡ, mã bận, HRANA_CLOSED_ERROR bọc lỗi
               mạng — Phát hiện 12); trang 502 / 52x thật của Render / Cloudflare; nhánh lỗi chayPhien chạy trên MÀN thật (chỉ hàm xuLyThuHong +
               soi nguồn chỗ gọi); crypto.randomUUID trên máy quầy (có dự phòng); thời gian thật Render ↔ Turso (F2 đo trên kho file); thử tay
               điện thoại; câu đặt lại bộ đếm PIN rớt mạng (Phát hiện 8); SX lệch khi commit rớt sau khi Turso đã ghi (Phát hiện 4).
GIT:         76ecb67b KET-NOI-1: soat bao mat — 0 lo hong (DAT)
             0e80b150 KET-NOI-1 vong sua 4: bang chung 102 ca (goc 85 hong), SO CA 102, dot bien 73/73 BAT; SOAT LAN CUOI: chat soat thay
             (+ commit ghi trang_thai.md này — chỉ viec/KET-NOI-1/)
BÀI HỌC:     KHOÁ 0 (mới ngoài bài thử của việc) · NGUYÊN TẮC 6 (đề xuất KHUON_LOI.md — ngoài Phạm vi) · BỎ 3 — chi tiết ## Bài học
```

## Bài học
Sự cố gom lại: soát độc lập 3 vòng (6 + 6 + 5 lỗi, không lỗi tiền / bảo mật); bài thử tự đỏ do lỗi CỦA BÀI (trùng tên biến 3 lần, sai tên cột,
dòng ✗ bị gom vào log, móc mạng mất khi P26d thay kết nối); bộ kiểm đỏ sau vá (029 trên kho thiếu bảng; index.js sửa dòng cũ); người gác chặn 9 lần.
**KHOÁ** (đã làm trong Phạm vi — là bài thử của việc này, có ca đỏ trước):
- Hàm giả trong bài theo đúng câu ghi máy chủ (huỷ 409 khi không còn 'cho') — B3d; đo chậm có ca khách bỏ kết nối — F1; mỗi hằng chờ có ca hai
  chiều cả máy chủ (A1d) lẫn quầy (B3e); mỗi chỗ đổi dạng lỗi có ca log + đếm riêng (A4a, A4c).
- Đề xuất "cổng so SỐ CA với số ca HEAD" (soát vòng 1): BỎ — cổng A16 đã làm đúng việc này.
**NGUYÊN TẮC** (đề xuất thêm vào `KHUON_LOI.md` — ngoài Phạm vi, chat soát duyệt; `khuon_loi_toi_da` phải gộp nếu vượt):
1. K3 — Lớp giả / hàm giả trong bài thử theo ĐÚNG điều kiện câu ghi máy chủ, lỗi giả mang ĐÚNG MỘT dấu hiệu đang thử. Đã gây: KET-NOI-1 ca B3d
   cho huỷ thành công phiên 'huy' (máy chủ thật 409) → xanh oan, che lỗi "chốt hỏng vì đơn báo mất kết nối"; A1e mang cả mã lẫn chữ nên vế
   FetchError không có ca. Chặn: dựng hàm giả từ câu SQL thật của route; đột biến từng vế.
2. K3 — Hai lớp phòng thủ cùng việc (đọc đầu giao dịch + bắt đụng khoá) che nhau: đột biến bỏ một lớp vẫn xanh. Đã gây: BV-MA-GUI-TRONG-GD,
   BV-MA-GUI-TRUNG-KHOA cùng SỐNG. Chặn: mỗi lớp một ca riêng, đo dấu vết lớp kia KHÔNG ra tay (đếm đụng khoá = 0).
3. K3 — Bài thử gom log máy chủ (console.log thay) thì in ✓ / ✗ bằng hàm gốc. Đã gây: dòng ✗ của ca 1,8 s bị nuốt → đột biến "LẠC" thay vì BẮT.
4. K4 — Sửa nhánh lỗi chung (xử lý sau khi thu hỏng): liệt kê MỌI trạng thái hỏi về (cho / da_thu / loi / huy / het_han / hỏi hỏng), mỗi trạng
   thái một ca theo hành vi gốc; "một chỗ đổi lỗi mạng" phủ cả fetch bị từ chối LẪN thân trả về đứt; đo theo 'close' không 'finish'.
5. K5 — "Đường khác giữ như cũ" phải liệt kê từng LỐI GỌI, mỗi lối một ca; hai lối trùng giá trị phân biệt (nguon 'tai_khoan' của quầy và đơn App)
   thì không dùng giá trị đó để phân biệt. Đã gây: B2 trả 200 cho phiên đơn App (soát vòng 1).
6. K1 / K4 — Đổi tên hàm / mã ở vòng sửa thì grep cả `cong_cu/` + `bang_chung_do.txt` + `ke_hoach.md`; hồ sơ ghi "N ca" phải đếm bằng máy
   (lặp 2 vòng: "16 ca xanh" kể 13, "17" kể 16).
**BỎ**: trùng tên biến trong bài thử (3 lần) — bài sập ngay khi chạy, bộ kiểm bắt tức thì; 029 hỏng trên kho thiếu bảng — bài cũ KHAPI3 / KHO2a
bắt ngay, đã theo khuôn 025; P26d thay kết nối làm mất móc bài thử — đặc thù kho file, đã ghi chú trong bài.
Dọn lời dặn: không có lời dặn nào trong `KHUON_LOI.md` / `CLAUDE.md` được phép kiểm mới của việc này làm thay hoàn toàn.

HEAD ĐÃ KIỂM: ae778712
(17.11 chat POS bàn 39: ghép main 94a90c26 (GIAO-2) — xung đột chỉ client/dist, dựng lại; F2 sửa theo GIAO-2; thu_KETNOI1 102/102; --day-du chỉ đỏ thu_NDAPI1 = môi trường sandbox (multer), cổng PR chạy lại.)
