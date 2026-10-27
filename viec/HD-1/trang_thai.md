# HD-1 — trạng thái

## Đối chiếu bản chụp (27.10.2026)
- Nhánh viec/HD-1; HEAD = FETCH_HEAD = f1fea71 (không kéo, bằng nhau)
- f1fea71 PHIEU: HD-1
- b1f8299 TIEN-DO: UUDAI-1 duyet (f7165ea); them KHO-1..3 ... so v42
- 40e07ce TIEN-DO: P3 (56e090d), BH-1 (9fd32af), DIEM-THAT-1 xong; mo UUDAI-1 ... so v41

## Câu hỏi
1. **Thư viện `qrcode-generator` 1.4.4** (phiếu mục "Thư viện mới: có") — người gác chặn `npm install` ("[NPM-LENH] npm chỉ cho test, ci, run, ls — thêm thư viện phải hỏi chủ quán"). Em không lách. Nhờ chủ quán chạy `cd client && npm install --save-exact qrcode-generator@1.4.4` (hoặc nới người gác) rồi commit `client/package.json` + `client/package-lock.json`. Trong lúc chờ, em làm hết phần không cần thư viện (máy chủ, hàm thuần, giao diện chữ, tem); `veQr.js` và ca QR của thu_HD1 làm ngay khi có thư viện.

## Phát hiện
- `InvoiceSettings.jsx` đã 1283 dòng, `InvoicePreview.jsx` 745, `orders.js` 1762 — vượt ~500 dòng; không tách trong việc này (ngoài Phạm vi).

## Ghi chú
