# SEPAY-1 — trạng thái

## Bước 1 — đối chiếu bản chụp (31.10.2026)

- Nhánh: `viec/SEPAY-1`; cây sạch.
- HEAD `912576e` · FETCH_HEAD `912576e` — bằng nhau, không kéo.
- `git log --oneline -3`:
  ```
  912576e PHIEU: SEPAY-1
  18ee394 TIEN-DO: KHO-2b, BH-CKTAY-1, KH-QUAY-2, KH-MUA-1 xong; mo SEPAY-1, MANKHACH-1, KHO-IN-1, KH-SDT-1, them KHO-2c; quyet dinh 31.10 (SePay, man khach, SDT moi tu 0, khoi phuc khi dong cua, sua phieu nhan) — so v51
  596c346 Merge pull request #60 from pos-tuquyduong/viec/KH-MUA-1
  ```

## Tiến độ

- Bước 2 (đọc) xong · Bước 3 (kế hoạch) xong: `ke_hoach.md`, đã có agent phụ chỉ đọc soát 4 câu (sửa đè ở mục 6 của kế hoạch).
- Phiếu dặn **Chờ duyệt kế hoạch** → DỪNG ở bước 3. Chưa viết bài thử, chưa sửa code.

## Câu hỏi

- **Q1 — Máy không đọc được tài liệu SePay.** `developer.sepay.vn` và `docs.sepay.vn` báo `ENOTFOUND` từ máy mây (mạng môi trường chặn hai
  tên miền). Phiếu dặn đọc lại tài liệu, không tin trí nhớ → các chi tiết ở `ke_hoach.md` mục 0 (tên header chữ ký + mốc giờ, chuỗi được ký,
  tên trường thân báo, câu trả "đã nhận") còn CHƯA ĐỌC. Đề xuất: chủ quán thêm `developer.sepay.vn`, `docs.sepay.vn` vào danh sách tên miền
  được phép của môi trường (cài đặt môi trường trên claude.ai/code → mạng), HOẶC dán vào file `viec/SEPAY-1/tai_lieu_sepay.md` nguyên văn phần
  "Webhook" + "Xác thực HMAC-SHA256" của tài liệu SePay. Có một trong hai thì máy làm tiếp.
- **Q2 — Bài thử cũ dưới cổng SePay (nghiệm thu E).** Đề xuất A: bài cũ (`thu_P3`, `thu_BH2`, `thu_KHMUA1`, `thu_HOPDONG_KH`) ghim cổng
  payOS và chạy nguyên; các luồng ví + QR, huỷ, xác nhận tay, hết hạn, đơn App, hoàn, đối soát chạy lại dưới SePay trong `thu_SEPAY1`.
  B: thêm chế độ SePay vào từng bài cũ (~160 dòng thử thêm, vượt ngân sách 400). Máy đề xuất A.
- **Q3 — Mặc định công tắc.** Không đặt `CONG_QR` → **payOS** (gộp xong mà chưa điền khoá SePay thì quầy vẫn chạy như hôm nay; bật SePay
  bằng `CONG_QR=sepay`). Chủ quán xác nhận hoặc chọn mặc định SePay.
- Ghi chú môi trường: công cụ đọc tài liệu môi trường (`read_documentation`) bị người gác chặn (CC-LA) — máy không mở được trang hướng dẫn
  cài mạng cho chủ quán.

## Phát hiện (ngoài Phạm vi — không sửa)

- Chữ "payOS" người dùng thấy ngoài Phạm vi: tờ in `client/src/utils/hoaDon.js:27` và mặc định `server/database.js:1210`
  (`invoice_chu_ck` = "Chuyển khoản (payOS)") — đổi được ở Cài đặt chữ hoá đơn, sẽ ghi vào `cai_dat_sepay.md`; câu lỗi
  `server/routes/orders.js:220` "Chuyển khoản phải qua QR payOS" (`CK_PHAI_QUA_PAYOS`); nhãn sao lưu `server/routes/backup.js:91`.
