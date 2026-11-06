# TINGEE-1 — trạng thái

## Đối chiếu bản chụp (06.11.2026)
- Nhánh: viec/TINGEE-1; cây sạch; fetch origin viec/TINGEE-1 xong.
- HEAD e9b7036 · FETCH_HEAD e9b7036 (bằng nhau, không kéo).
- `git log --oneline -3`:
  - e9b7036 PHIEU: TINGEE-1
  - f464cea Merge pull request #74 from pos-tuquyduong/viec/HANG-1
  - 7c0c682 GOP-HANG-1 HEAD DA KIEM 84480a7 (chat soat)

## Đối chiếu bản chụp — phiên `tiep` (06.11.2026)
- Nhánh: viec/TINGEE-1; cây sạch; fetch origin viec/TINGEE-1 xong.
- HEAD b4af4be · FETCH_HEAD b4af4be (bằng nhau, không kéo).
- `git log --oneline -3`:
  - b4af4be TINGEE-1 ke hoach (cho duyet) + trang thai, cau hoi tai lieu Tingee
  - e9b7036 PHIEU: TINGEE-1
  - f464cea Merge pull request #74 from pos-tuquyduong/viec/HANG-1

## Bước đang ở
Chủ quán DUYỆT kế hoạch b4af4be kèm điều chỉnh (đã ghi `ke_hoach.md` mục 11). **DỪNG trước bước 4** — chưa kéo được main, chưa có tài
liệu Tingee (Câu hỏi 5–6).

## Soát kế hoạch (agent phụ chỉ đọc, 06.11)
4 câu: (1) ngoài Phạm vi — không; (2) ngắn hơn — gom `TEN_CONG` + `congCuaKhoa` về một bảng ở `congQr.js`, chốt `LECH_TOI_DA_GIAY` dùng chung,
bỏ nhánh "gốc UAT" không bao giờ chạy — ĐÃ nhận cả ba; (3) ca thiếu — chiều ngược "webhook luôn mở", JSON hỏng, nội dung mới CK-NOIDUNG-1,
sát mốc hết hạn, hai cổng payOS+Tingee, ví / điểm không đổi, khoá trong sao lưu — ĐÃ thêm T20–T25 + T3; (4) sót — `doiSoat.js:233 slice(6)`
viết cứng cho `'sepay:'`, địa chỉ Webhook phải có `www`, thêm chú thích cần sửa — ĐÃ ghi vào kế hoạch. Số dòng trích đã kiểm lại bằng grep.

## Câu hỏi
1. **Tài liệu Tingee — máy không đọc được.** Người gác chặn `curl` ra ngoài (CURL-HOST); agent đọc web báo `ENOTFOUND developers.tingee.vn`
   (mạng phiên không có tên miền này). Để viết `docBao` đúng mà không đoán, cần MỘT trong hai:
   (a) bạn dán vào phiếu (hoặc file `viec/TINGEE-1/tai_lieu_tingee.md`) nguyên trang "Webhook Payment Callback": ví dụ thân JSON đầy đủ, cách tính
   chữ ký (thân thô hay đã chuẩn hoá, hex hoa hay thường), câu trả lời Tingee chờ (chỉ HTTP 200, hay cần thân như `{"code":"00"}`), và gửi lại có ký
   lại mốc giờ mới không; hoặc (b) cho phép tên miền developers.tingee.vn trong mạng của môi trường.
   Tên trường cần biết ở bảng mục 2 của `ke_hoach.md`.
2. **QR:** kế hoạch chọn tự dựng VietQR tới đúng tài khoản ngân hàng (như SePay, không gọi API Tingee). Đúng khi Tingee báo cho MỌI tiền vào tài khoản
   đó (không bắt tiền phải vào tài khoản ảo VA của Tingee). Đề xuất: giữ cách này; tài liệu nói phải dùng VA thì đổi sang gọi API tạo QR.
3. **Phụ thuộc CK-NOIDUNG-1:** chưa gộp vào main (sepay.js vẫn đọc `TQD<số>`). Đề xuất: duyệt kế hoạch xong, chờ CK-NOIDUNG-1 gộp rồi mở phiên `tiep`
   kéo main mới — bước code dùng lại đúng hàm đọc nội dung và luật cộng ví của CK-NOIDUNG-1.
4. **Thứ tự chuyển (nghiệm thu F):** kế hoạch đề xuất chuyển thử 2.000đ khi VẪN `CONG_QR=sepay` (QR hai cổng giống hệt vì cùng tài khoản + nội dung;
   webhook Tingee vẫn chốt phiên), thấy tự xác nhận mới đặt `CONG_QR=tingee` — đúng thứ tự phiếu. Bạn chỉ cần xác nhận.

### Phiên `tiep` 06.11 — bị chặn, cần bạn làm
5. **Kéo main vào nhánh — máy bị người gác chặn.** Lời dặn "git merge origin/main" không chạy được: `git fetch origin main` → `[GIT-KEO]` (chỉ được
   fetch đúng `viec/TINGEE-1`); `git merge`, `git ls-remote` → `[GIT-LENH]` ("gộp là việc của chủ quán"); đọc GitHub bằng công cụ GitHub → `[CC-LA]`.
   Kho trong máy là kho nông, không có `origin/main`. Máy KHÔNG lách.
   **Đề xuất (bạn làm, ~1 phút):** trên GitHub mở PR `viec/TINGEE-1` → `main` (chưa cần gộp), bấm **"Update branch"** để kéo main vào nhánh. Rồi mở
   lại phiên `tiep` — bước 1.3 của máy tự `pull --ff-only` bản mới.
6. **Hai file tài liệu không có trong máy.** `viec/TINGEE-1/tai_lieu_tingee.md` và `tingee_tai_lieu_day_du.txt` không nằm trong nhánh ở b4af4be
   (`find /` không thấy). Nếu chúng ở main thì câu 5 giải luôn; nếu chưa commit ở đâu thì bạn đưa vào `viec/TINGEE-1/` trên nhánh này.
   Thiếu tài liệu thì máy không viết `docBao` / chữ ký / câu trả lời — không đoán tên trường.
Câu 1–4 cũ: đã trả lời bằng lời duyệt 06.11 (QR → VA; CK-NOIDUNG-1 đã gộp; thứ tự F → `ke_hoach.md` mục 11.4).

## Phát hiện
- (chưa có)
