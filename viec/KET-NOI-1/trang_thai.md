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
- Bài mới `cong_cu/thu_KETNOI1.js` (89 ca) viết TRƯỚC, đỏ trên gốc 74/89 (`bang_chung_do.txt`). Lớp mạng giả dựng đúng hình lỗi node-fetch 2.7.0.
- Bài cũ sửa thường (hành vi chủ quán duyệt đổi / phiếu cho đổi `index.js`, đỏ trên gốc): `thu_BH2.js` R4 + S22, `thu_P3.js` F7,
  `thu_NDAPI1.js` A2 (so BẰNG 18 dòng thêm), `thu_SAOLUUDEM1.js` B3 (theo commit của việc) + ca mới F1/F2 (đúng lỗi Cài đặt › Sao lưu 16.11).
- `npm test -- --day-du`: PASS 124 · FAIL 0 · CẢNH BÁO 1 (cảnh báo có sẵn từ trước việc này).
- `client/dist` build lại sau mọi sửa `client/src/`.

### Chỗ vá → đột biến (`viec/KET-NOI-1/dot_bien.py`, mỗi đột biến một dòng)
| Chỗ vá | Đột biến |
|---|---|
| database.js `query()` đọc lại câu ĐỌC | BV-DOC-THU-LAI · VS-THU-LAI-BA · VS-THU-LAI-GHI · BV-CAU-GHI |
| database.js `laCauDoc` | VS-CAU-DOC-CHUA-TU |
| database.js `laLoiMang` | VS-MANG-RONG · VS-MANG-BO-CAUSE |
| database.js lỗi đổi dạng (không cause) | VS-LOI-GIU-CAUSE |
| database.js `run()` / giao dịch / commit đổi lỗi | BV-RUN-DOI-LOI · BV-TX-DOI-LOI · BV-COMMIT-DOI-LOI |
| database.js đếm rớt | BV-LOG-DEM |
| giuCho.js `phienCuaMa` (2 chỗ gọi, so thân / trừ TK, QR đang tạo, QR lỗi, dạng mã) | BV-MA-GUI-NHANH · BV-MA-GUI-TRONG-GD · VS-MA-GUI-BO-SO-THAN · VS-MA-GUI-BO-TK · BV-MA-GUI-QR-DANG-TAO · VS-MA-GUI-QR-LOI · BV-MA-GUI-DANG |
| 029_ket_noi.js khoá UNIQUE | BV-029-UNIQUE |
| giuCho.js `chotPhien` B2 + route `/chot` lapLai | BV-CHOT-LAI · VS-CHOT-LAI-MOI-NGUON · BV-LAP-LAI-ROUTE |
| wallets.js `loiGhi` → 503 | BV-LOIGHI-503 |
| database.js `mocLoiKho` / index.js gắn móc / bắt lỗi cuối / health | BV-LOI-KHO-MOC · BV-MOC-INDEX · BV-TRA-LOI-KHO-CUOI · BV-HEALTH |
| api.js `goiFetch` / trang proxy / thuLai mặc định / phiên / tinhThu / upload | BV-API-MAT-KET-NOI · BV-API-PROXY · VS-API-POST-THU-LAI · BV-API-GET-THU-LAI · BV-API-PHIEN-THU-LAI · BV-API-CHOT-THU-LAI · VS-NEN-GUI-LAI-BO-KHO-BAN · VS-NEN-GUI-LAI-MOI-MA · BV-API-TINH-THU · BV-GOI-FETCH-UPLOAD |
| ThuTien.jsx / tinh.js `nhanhNutThu` | BV-NUT-0D · VS-NHANH-NUT |
| tinh.js `loiTinhGia` / `viecKhiThuHong` / `thanPhien` maGui | BV-LOI-TINH · BV-VIEC-KHI-THU-HONG · VS-VIEC-KHONG-PHIEN · BV-MA-GUI-THAN |
| BanHangMoi.jsx mã mỗi lần thu / câu B5 | BV-BH-MA-GUI · BV-BH-CAU-B5 |
| database.js đo chậm (ngưỡng, đường dẫn, đếm câu, ngoài, health cham) / index.js gắn đo | BV-CHAM · VS-CHAM-NGUONG · VS-CHAM-LO-DUONG · BV-DEM-CAU · BV-NGOAI · BV-CHAM-HEALTH · BV-DO-INDEX |

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

## Câu hỏi
(không có)
